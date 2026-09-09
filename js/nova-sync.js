import {createTransport} from './mesa-sync-transport.js?v=4';

// O Firestore emite primeiro a escrita local. Só a confirmação do servidor
// pode disparar a transação que lê esse documento de comando.
export function listenConfirmedCommands(onSnapshot, reference, receive, fail) {
    return onSnapshot(reference,{includeMetadataChanges:true},snapshot=>{
        for(const change of snapshot.docChanges({includeMetadataChanges:true})) {
            if(change.type!=='removed' && !change.doc.metadata.hasPendingWrites)
                receive({path:change.doc.ref.path,data:change.doc.data()});
        }
    },fail);
}

export function reducePosition(state, command, masterUid) {
    if(command.type !== 'nova_move') return false;
    const token = state.tokens?.find(t => String(t.id) === command.actor);
    if(!token || command.uid !== command.donoUid || command.actor !== command.personagemId) return false;
    if(command.uid !== masterUid && command.uid !== token.donoUid) return false;
    const p = command.payload;
    if(!p) return false;
    let x, y;
    if(p.mode === 'point') { x=p.x; y=p.y; }
    else {
        if(!Number.isFinite(p.dx) || !Number.isFinite(p.dy) || Math.abs(p.dx)+Math.abs(p.dy)!==1) return false;
        x=Number(token.x)+p.dx; y=Number(token.y)+p.dy;
    }
    if(!Number.isFinite(x) || !Number.isFinite(y)) return false;
    token.x=Math.max(0,Math.min(28,x)); token.y=Math.max(0,Math.min(14,y));
    return true;
}

// Recebe somente autenticação, fichas e operações de banco. Nenhuma rotina do mapa antigo.
export function mountPositionLab({user, characters, database, root=document}) {
    const path='combatesAtivos/mapaMesaSyncNova';
    const el=id=>root.getElementById(id);
    let transport=null, opening=null, packet=null, account='', timer=null, renewal=null;
    let pending=new Map(), error='', drag=null;
    const controlled=t=>user()?.master || t.donoUid===user()?.uid;
    function status() {
        let message=error;
        if(!message && !packet) message='Aguardando o mestre inicializar os personagens.';
        if(!message) {
            const leader=packet.authority?.until>Date.now();
            message=`Sincronização nova 4 · revisão ${packet.revision} · ${packet.estado.tokens.length} personagem(ns)`;
            if(pending.size) message+=' · movimento aguardando confirmação';
            if(!leader) message+=' · aguardando sessão do mestre';
        }
        if(el('novaSyncStatus')) el('novaSyncStatus').textContent=message;
    }
    function render() {
        const board=el('novaSyncBoard'), select=el('novaSyncPersonagem');
        if(!board || !select) return;
        const tokens=packet?.estado?.tokens||[], mine=tokens.filter(controlled), old=select.value;
        select.replaceChildren(...mine.map(t=>{
            const option=root.createElement('option'); option.value=t.id; option.textContent=t.nome; return option;
        }));
        select.value=mine.some(t=>t.id===old)?old:mine[0]?.id||'';
        const init=el('novaSyncInit'); if(init) init.hidden=!user()?.master;
        board.replaceChildren(...tokens.map(t=>{
            const node=root.createElement('div'); node.dataset.token=t.id; node.title=t.nome;
            node.style.cssText=`position:absolute;left:${t.x/28*100}%;top:${t.y/14*100}%;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:50%;border:3px solid ${t.id===select.value?'#ffd447':'#00d4ff'};background:#263d62;touch-action:none;cursor:${controlled(t)?'grab':'default'};`;
            if(t.imagem){const img=root.createElement('img');img.src=t.imagem;img.draggable=false;img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none';node.append(img);}
            const label=root.createElement('span');label.textContent=t.nome;label.style.cssText='position:absolute;top:46px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#172337;padding:2px 5px;font-size:12px';node.append(label);
            return node;
        }));
        status();
    }
    function receive(p) {
        if(!p?.estado || !Number.isSafeInteger(p.revision)) return;
        if(packet && p.revision<packet.revision) return;
        const changed=!packet || packet.revision!==p.revision;
        packet=p;
        for(const [id,key] of pending) {
            if(p.lastCommand?.id===id || p.receipts?.[key]) {
                pending.delete(id);
                if(p.lastCommand?.id===id && !p.lastCommand.accepted) error='O mestre recusou este movimento. Selecione um personagem da sua conta.';
            }
        }
        // Renovar a sessão não muda as posições. Recriar os elementos aqui
        // interrompia interações e recarregava imagens a cada renovação.
        if(changed && !drag)render();else status();
    }
    function fail(e) { error=`Falha na sincronização nova: ${e.code||e.message||String(e)}`;status();console.error('[Sync nova]',e); }
    function close() {
        transport?.close();transport=null;clearInterval(timer);timer=null;renewal=null;
        packet=null;pending.clear();account='';opening=null;drag=null;
    }
    function renew() {
        if(!renewal && transport) renewal=transport.renew().catch(fail).finally(()=>{renewal=null;status();});
        return renewal;
    }
    async function open() {
        const u=user(); if(!u?.uid) return;
        if(account && account!==u.uid) close();
        if(opening) return opening;
        if(transport) return;
        account=u.uid;error='';
        transport=createTransport({ ...database, subscribe:(p,receive,many)=>database.subscribe(p,receive,many,fail), statePath:path,commandPath:path+'/acoes',movementPath:path+'/acoes',
            session:crypto.randomUUID(),uid:()=>u.uid,isMaster:()=>u.master,
            reduce:(s,c)=>reducePosition(s,c,u.uid),onState:receive,onError:fail});
        // A leitura real da fila (database.read) recupera comandos recebidos ANTES da liderança.
        transport.start();
        opening=(async()=>{
            await renew();
            timer=setInterval(()=>{renew();status();},4000);
            render();
        })().catch(e=>{close();fail(e);}).finally(()=>{opening=null;});
        return opening;
    }
    async function initialize() {
        await open();if(!user()?.master) return;
        const tokens=characters().filter(t=>t.id).map((t,i)=>({id:String(t.id),nome:t.nome||'Personagem',
            imagem:t.imagem||'',donoUid:String(t.donoUid||t.dono||''),
            x:Number.isFinite(t.x)?t.x:4+i*3,y:Number.isFinite(t.y)?t.y:7}));
        if(!tokens.length){error='Nenhum personagem disponível. Abra as fichas e tente inicializar novamente.';status();return;}
        try {
            await database.transact(async tx=>{
                const p=await tx.get(path);
                const existing=p?.estado?.tokens||[],ids=new Set(existing.map(t=>t.id));
                const added=tokens.filter(t=>!ids.has(t.id));
                if(!p || added.length) tx.set(path,{...(p||{}),protocol:1,revision:(p?.revision||0)+1,
                    estado:{tokens:[...existing,...added]}});
            });
            await renew();
        } catch(e){fail(e);}
    }
    async function send(payload, tokenId=el('novaSyncPersonagem')?.value) {
        await open();
        const t=packet?.estado?.tokens.find(t=>t.id===tokenId);
        if(!t || !controlled(t)){error='Selecione um personagem que você controla.';status();return;}
        error='';
        try {
            const id=await transport.send('nova_move',t.id,payload,'nova:0');
            const cut=id.lastIndexOf('_'),key=`${user().uid}:${id.slice(0,cut)}:${id.slice(cut+1)}`;
            pending.set(id,key);
            // A confirmação pode chegar antes de setDoc terminar.
            if(packet) receive(packet);
        }catch(e){fail(e);}
    }
    const board=el('novaSyncBoard');
    if(board){
        board.style.touchAction='none';
        board.addEventListener('pointerdown',e=>{
            if(e.button!==0)return;
            const id=e.target.closest('[data-token]')?.dataset.token;
            const t=packet?.estado?.tokens.find(t=>t.id===id);
            if(t && controlled(t)){el('novaSyncPersonagem').value=id;drag={id,x:e.clientX,y:e.clientY};board.setPointerCapture(e.pointerId);}
        });
        board.addEventListener('pointerup',e=>{
            if(!drag)return; const d=drag;drag=null;
            if(board.hasPointerCapture(e.pointerId))board.releasePointerCapture(e.pointerId);
            if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<3){render();return;}
            const r=board.getBoundingClientRect();
            send({mode:'point',x:(e.clientX-r.left)/r.width*28,y:(e.clientY-r.top)/r.height*14},d.id);
        });
        board.addEventListener('pointercancel',()=>{drag=null;});
    }
    el('novaSyncPersonagem')?.addEventListener('change',render);
    return {open,close,initialize,move:(dx,dy)=>send({dx,dy})};
}
