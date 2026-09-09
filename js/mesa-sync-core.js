// Protocolo de estado confirmado. Sem DOM, Firebase, timers ou relógio global.
export const PROTOCOL = 1;
export const copy = value => JSON.parse(JSON.stringify(value));

export function opportunity(state) {
    return `${state.combateIdD8 || ''}:${state.oportunidadeSeq || 0}:${state.rodada || 0}:${state.turnoIndex || 0}:${state.ordemIniciativa?.[state.turnoIndex || 0] || ''}`;
}

export function claimAuthority(packet, session, now, duration = 12000) {
    const old = packet.authority;
    if (old && old.session !== session && old.until > now) return null;
    return { session, epoch: old?.session === session && old.until > now ? old.epoch : (old?.epoch || 0) + 1, until: now + duration };
}

export function ownsAuthority(packet, lease, now) {
    const a = packet.authority;
    return !!a && !!lease && a.session === lease.session && a.epoch === lease.epoch && a.until > now;
}

export function acceptSnapshot(previous, packet) {
    if (packet.protocol !== PROTOCOL || !Number.isSafeInteger(packet.revision)) return false;
    return !previous || packet.revision > previous.revision;
}

export function movementCost(distance, perAction) {
    return Math.max(0, Math.ceil((distance - 1 - 1e-7) / perAction));
}

// Cada gesto envia distância acumulada, não somente a corda entre amostras.
// Assim curvas e amostras coalescidas têm o mesmo custo que todos os frames.
export function move(state, command, perAction) {
    const t = state.tokens.find(t => String(t.id) === command.actor);
    const p = command.payload;
    if (!t || !p || !Number.isSafeInteger(command.sequence) || command.sequence <= 0) return false;
    const combat = state.fase === 'combate';
    if (combat && (command.opportunity !== opportunity(state) || String(state.ordemIniciativa[state.turnoIndex]) !== command.actor)) return false;
    if (combat && (state.pendenciaLab || state.danoPendenteLab || t.primeirosSocorrosLab)) return false;
    if (![p.x,p.y,p.distance].every(Number.isFinite) || p.distance < 0) return false;
    const previous = t.movementConfirmed || {};
    if(previous.stream&&previous.stream!==command.stream&&Number(command.baseRevision||0)<Number(previous.revision||0))return false;
    if (previous.stream === command.stream && command.sequence <= previous.sequence) return false;
    const sameGesture = previous.stream === command.stream && previous.gesture === p.gesture && previous.opportunity === command.opportunity;
    const traveled = sameGesture ? previous.distance : 0;
    if (p.distance < traveled) return false;
    const dx=p.x-t.x,dy=p.y-t.y,straight=Math.hypot(dx,dy),delta=p.distance-traveled;
    if (straight > delta + .03) return false;
    const before=Math.max(0,Number(t.movimentoUsadoDirecionalD1||0));
    let allowed=delta;
    if(combat){
        if(!Number.isFinite(perAction)||perAction<=0)return false;
        const paid=movementCost(before,perAction),actions=Math.max(0,Number(t.acoesAtuaisLab||0));
        allowed=Math.max(0,Math.min(delta,1+(paid+actions)*perAction-before));
        const after=before+allowed;
        t.acoesAtuaisLab=actions-(movementCost(after,perAction)-paid);
        t.movimentoUsadoDirecionalD1=after;
        t.movimentoGratisDisponivel=after<1;
    }
    const fraction=delta>0?Math.min(1,allowed/delta):1;
    t.x=Math.max(0,Math.min(state.larguraM,t.x+dx*fraction));
    t.y=Math.max(0,Math.min(state.alturaM,t.y+dy*fraction));
    if(Number.isFinite(p.angle))t.angulo=p.angle;
    t.movementConfirmed={stream:command.stream,sequence:command.sequence,gesture:p.gesture,distance:p.distance,opportunity:command.opportunity,revision:command.authorityRevision||0};
    return true;
}

export function advance(state, expected, { pass = false } = {}) {
    if(state.fase!=='combate'||opportunity(state)!==expected||state.pendenciaLab||state.danoPendenteLab)return false;
    const order=state.ordemIniciativa||[];
    if(!order.length)return false;
    const current=state.tokens.find(t=>String(t.id)===String(order[state.turnoIndex]));
    if(!current)return false;
    state.oportunidadeSeq=Number(state.oportunidadeSeq||0)+1;
    if(pass){current.passagensLab=Number(current.passagensLab||0)+1;if(current.passagensLab>=2)current.finishedRound=true;}
    const eligible=t=>t&&!t.finishedRound&&Number(t.acoesAtuaisLab)>0&&!t.combateLab?.morto&&!t.combateLab?.inconsciente&&!t.combateLab?.incapacitado;
    for(let step=1;step<=order.length;step++){
        const i=(state.turnoIndex+step)%order.length;
        if(eligible(state.tokens.find(t=>String(t.id)===String(order[i])))){state.turnoIndex=i;return true;}
    }
    state.rodada=Number(state.rodada||0)+1;
    for(const t of state.tokens){
        t.acoesAtuaisLab=Math.max(0,Number(t.acoesMaxLab||0)-Number(t.penalidadeAcaoProximaLab||0));
        t.penalidadeAcaoProximaLab=0;t.passagensLab=0;t.finishedRound=false;
        t.defesasMaxLab=Math.max(0,Number(t.acoesMaxLab||0));t.defesasAtuaisLab=t.defesasMaxLab;
        t.movimentoUsadoDirecionalD1=0;t.movimentoGratisDisponivel=true;t.movimentoBonusLab=0;
    }
    const first=order.findIndex(id=>eligible(state.tokens.find(t=>String(t.id)===String(id))));
    state.turnoIndex=Math.max(0,first);
    return true;
}

// A consequência e o recibo são gravados na MESMA transação.
export function applyCommand(packet, command, lease, now, reduce) {
    if(!ownsAuthority(packet,lease,now))throw new Error('authority-lost');
    if(command.protocol!==PROTOCOL||!command.id||!command.stream||!Number.isSafeInteger(command.sequence))throw new Error('invalid-command');
    const receipts=packet.receipts||{};
    const key=`${command.uid}:${command.stream}:${command.sequence}`;
    if(receipts[key])return null;
    const state=copy(packet.estado);
    const accepted=reduce(state,{...command,authorityRevision:(packet.revision||0)+1})!==false;
    return {...packet,protocol:PROTOCOL,revision:(packet.revision||0)+1,estado:accepted?state:packet.estado,
        receipts:Object.fromEntries([...Object.entries(receipts),[key,true]].slice(-512)),lastCommand:{id:command.id,accepted}};
}
