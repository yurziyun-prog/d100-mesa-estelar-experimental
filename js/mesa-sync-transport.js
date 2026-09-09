import { PROTOCOL, claimAuthority, ownsAuthority, applyCommand } from './mesa-sync-core.js';

// O adaptador Firebase é injetado para testar disputas e retries sem produção.
export function createTransport({ transact, read, write, subscribe, statePath, commandPath, movementPath,
    session, uid, isMaster, reduce, onState, onError, now = Date.now }) {
    let lease=null,closed=false,busy=Promise.resolve(),stops=[],sequence=0,revision=0;
    const enqueue=job=>{busy=busy.then(job).catch(onError);return busy;};
    async function claim(){
        if(closed||!isMaster()){lease=null;return false;}
        const next=await transact(async tx=>{
            const p=await tx.get(statePath);
            if(!p?.estado)throw new Error('shared-state-missing');
            const a=claimAuthority(p||{},session,now());
            if(!a)return null;
            tx.set(statePath,{...p,protocol:PROTOCOL,revision:p.revision||0,authority:a});
            return a;
        });
        lease=next;return !!next;
    }
    async function process(path){
        if(closed||!lease)return;
        await transact(async tx=>{
            const [p,c]=await Promise.all([tx.get(statePath),tx.get(path)]);
            if(!p||!c||c.status!=='new')return;
            if(!ownsAuthority(p,lease,now())){lease=null;return;}
            const next=applyCommand(p,c,lease,now(),reduce);
            if(next)tx.set(statePath,next);
            // Movimentos e comandos têm documentos diferentes. Nunca apagamos
            // o documento de uma amostra mais nova: o read faz parte da transação.
            tx.set(path,{...c,status:'done',accepted:next?.lastCommand.accepted??false});
        });
    }
    async function send(type,actor,payload,opportunity){
        if(closed)throw new Error('transport-closed');
        const n=++sequence,id=`${session}_${n}`,moving=type==='movement';
        const c={protocol:PROTOCOL,id,sequence:n,stream:session,uid:uid(),actor:String(actor||''),type,payload,opportunity,
            baseRevision:revision,createdAt:now(),status:'new'};
        // Um ID por comando. Movimento também tem IDs independentes para não
        // perder o último ponto quando uma ação chega durante o mesmo gesto.
        await write(`${moving?movementPath:commandPath}/${id}`,c);
        return id;
    }
    function start(){
        stops.push(subscribe(statePath,p=>{if(p){revision=Math.max(revision,Number(p.revision||0));onState(p);}},false));
        for(const path of [commandPath,movementPath])stops.push(subscribe(path,doc=>{
            if(doc.data?.status==='new')enqueue(()=>process(doc.path));
        },true));
    }
    async function renew(){
        const ok=await claim();
        // Depois de assumir liderança, reenvia a lista de comandos pendentes:
        // snapshots anteriores podem ter chegado enquanto éramos observadores.
        if(ok){for(const path of [commandPath,movementPath])for(const d of await read(path))if(d.data.status==='new')await enqueue(()=>process(d.path));}
        return ok;
    }
    return {start,send,renew,isLeader:()=>!!lease&&!closed&&lease.until>now(),close(){closed=true;lease=null;stops.splice(0).forEach(f=>f());}};
}
