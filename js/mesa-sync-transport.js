import { PROTOCOL, claimAuthority, ownsAuthority, applyCommand } from './mesa-sync-core.js';

// O adaptador Firebase é injetado para testar disputas e retries sem produção.
export function createTransport({ transact, read, write, remove, subscribe, statePath, commandPath, movementPath,
    session, uid, isMaster, reduce, onState, onError, now = Date.now }) {
    let lease=null,closed=false,busy=Promise.resolve(),stops=[],sequence=0,revision=0,renewing=null;
    const enqueue=job=>{busy=busy.then(job).catch(onError);return busy;};
    async function claim(){
        if(closed||!isMaster()){lease=null;return false;}
        const next=await transact(async tx=>{
            const p=await tx.get(statePath);
            // Login can happen before the user opens the Mesa. There is no
            // shared combat document yet, so remain an observer silently.
            if(!p?.estado)return null;
            const a=claimAuthority(p||{},session,now());
            if(!a)return null;
            tx.set(statePath,{...p,protocol:PROTOCOL,revision:p.revision||0,authority:a});
            return a;
        });
        lease=next;return !!next;
    }
    async function process(path){
        if(closed||!lease)return;
        const changed=await transact(async tx=>{
            const [p,c]=await Promise.all([tx.get(statePath),tx.get(path)]);
            if(!p||!c||c.status!=='new')return false;
            if(!ownsAuthority(p,lease,now())){lease=null;return false;}
            const next=applyCommand(p,c,lease,now(),reduce);
            if(next)tx.set(statePath,next);
            // A fila antiga permite apagar a mensagem, mas não necessariamente
            // atualizá-la. O recibo no estado torna o retry idempotente.
            return !!next;
        });
        if(changed&&remove)await remove(path);
    }
    async function send(type,actor,payload,opportunity){
        if(closed)throw new Error('transport-closed');
        const n=++sequence,id=`${session}_${n}`,moving=type==='movement';
        const actorId=String(actor||'');
        const ownerUid=uid();
        const c={protocol:PROTOCOL,id,sequence:n,stream:session,uid:ownerUid,donoUid:ownerUid,
            actor:actorId,personagemId:actorId,type,payload,opportunity,
            baseRevision:revision,createdAt:now(),status:'new'};
        // Um ID por comando. Movimento também tem IDs independentes para não
        // perder o último ponto quando uma ação chega durante o mesmo gesto.
        await write(`${moving?movementPath:commandPath}/${id}`,c);
        return id;
    }
    function start(){
        stops.push(subscribe(statePath,p=>{if(p){revision=Math.max(revision,Number(p.revision||0));onState(p);}},false));
        // Apenas a sessão do mestre precisa observar a fila inteira. Um jogador
        // só pode ler as próprias ações pelas regras do Firestore; assinar a
        // coleção completa fazia a conta receber PERMISSION_DENIED e exibir o
        // falso aviso de sincronização.
        if(isMaster()) for(const path of [...new Set([commandPath,movementPath])])stops.push(subscribe(path,doc=>{
            if(doc.data?.status==='new')enqueue(()=>process(doc.path));
        },true));
    }
    function renew(){
        if(closed)return Promise.resolve(false);
        if(renewing)return renewing;
        renewing=(async()=>{
        // A renovação grava o mesmo documento que process(). Use a mesma fila.
        const ok=await enqueue(claim);
        // Depois de assumir liderança, reenvia a lista de comandos pendentes:
        // snapshots anteriores podem ter chegado enquanto éramos observadores.
        if(ok){for(const path of [...new Set([commandPath,movementPath])])for(const d of await read(path))if(d.data.status==='new')await enqueue(()=>process(d.path));}
        return ok;
        })().finally(()=>{renewing=null;});
        return renewing;
    }
    return {start,send,renew,isLeader:()=>!!lease&&!closed&&lease.until>now(),close(){closed=true;lease=null;stops.splice(0).forEach(f=>f());}};
}
