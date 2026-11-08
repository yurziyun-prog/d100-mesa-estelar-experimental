import {acaoIniciativa} from './nova-turnos.js?v=46';
import {classificarTeste} from './nova-regras.js?v=46';
// v201: personagens de jogadores e NPCs (gente) nunca ficam menores que 1,25 m no mapa — ficavam miúdos ao lado das criaturas; o mestre pode aumentar à vontade (balão → Tamanho)
export const TAMANHO_MIN_PESSOA_M=1.25;
const ehPessoaToken=t=>{let id='';try{id=decodeURIComponent(String(t?.id||''));}catch(_){id=String(t?.id||'');}return !!id&&!/^(synccriatura|dummy|objeto|item|oficina)/.test(id)&&String(t?.catalogType||'')!=='objeto';};
export function diametroMiniatura(t){const n0=Number(t?.diametroM),n=(n0>.72&&n0<1)?1:n0; // v196: porte médio = 1 m × 1 m (valores antigos de 0,75–0,99 m sobem para 1)
 return n>0?n:/besta\s+ululante/i.test(t?.nome||'')?2.4:1;}
/** v201: tamanho só do DESENHO — gente (jogadores e NPCs) aparece com pelo menos 1,25 m para não ficar miúda ao lado das criaturas; colisão e portas seguem usando diametroMiniatura */
export const diametroVisual=t=>{const d=diametroMiniatura(t);return ehPessoaToken(t)&&d<TAMANHO_MIN_PESSOA_M?TAMANHO_MIN_PESSOA_M:d;};
export function distanciaBordas(a,b,map={}){if(a.id===b.id)return 0;return Math.max(0,Math.hypot((a.x-b.x)*(map.larguraM||28)/28,(a.y-b.y)*(map.alturaM||14)/14)-(diametroMiniatura(a)+diametroMiniatura(b))/2);}
export function identificarKit(item){const s=[item.idBanco,item.id,item.nome,item.nome_en,item.nome_zh,item.name].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('_',' ').toLowerCase();return /kit.*(?:medic|socorro)|medkit|primeiros socorros|first[ -]?aid|medical kit/.test(s);}
// v200: Sorte ativa (actor.luckPrepared) = +50% do valor da perícia NESTE teste (o próximo que o personagem fizer); depois some.
export function testeComSorte(actor,value,roll){
 const sorte=!!actor?.luckPrepared;value=Math.max(0,Math.min(100,Number(value)||0));
 if(sorte){value=Math.round(value*1.5);actor.luckPrepared=false;} // pode passar de 100: o Fiasco só no 00 (regra do d100)
 const die=roll(100);return {die,valor:value,...classificarTeste(value,die),...(sorte?{sorte:true}:{})};
}
export function registrarCura(actor,pv,combat){if(pv<=0||!actor.combateLab?.inconsciente)return;const st=actor.combateLab;st.curasConsciencia=st.curasConsciencia||[];st.curasConsciencia.push({pv,session:combat?.session||'',round:combat?.round||0});}
export function bonusConsciencia(st,combat){return (st?.curasConsciencia||[]).filter(h=>h.session===(combat?.session||'')&&h.round<(combat?.round||0)).reduce((n,h)=>n+5*h.pv,0);}
export function despertar(st){st.inconsciente=false;st.incapacitado=false;delete st.unconsciousClock;delete st.unconsciousUntilRound;delete st.inconscienteAteTurno;delete st.curasConsciencia;}

export function prepararSorte({a,health,info,sheet}){
 const actors=structuredClone(health.actors||{}),state=actors[a.id]||={combateLab:info.health};
 if(state.combateLab?.morto)throw Error('Personagem morto não usa Sorte.');
 const balance=sheet?info.luck:Number(state.luckRemaining??info.luck);
 if(!Number.isFinite(balance)||balance<=0)throw Error('Sem pontos de Sorte.');
 if(state.luckPrepared)throw Error('A Sorte já está ativa para o próximo teste.');
 state.luckRemaining=balance-1;
 state.luckPrepared=true; // v200: +50% da perícia no próximo teste
 return {actors,sheetPatch:{pontosSorte:balance-1,pontosSorteDerivadoV15:true},message:a.nome+' · 🍀 Sorte ativada: +50% da perícia no próximo teste · saldo '+(balance-1)};
}
export function resolverConsciencia({a,health,map,info,roll}){
 const actors=structuredClone(health.actors||{}),state=actors[a.id]||={combateLab:info.health},st=state.combateLab,c=structuredClone(map.combat);
 if(!c?.active||c.activeId!==a.id||!st.inconsciente||st.morto)throw Error('Teste de consciência disponível somente na sua vez, estando inconsciente.');
 if(state.consciousnessRound===c.roundId)throw Error('O teste de consciência já foi realizado nesta rodada.');
 state.consciousnessRound=c.roundId;const bonus=bonusConsciencia(st,c),base=info.resistanceById[a.id]||0,value=Math.min(100,base+bonus),r=testeComSorte(state,value,roll);
 if(r.sucesso)despertar(st);
 const combat=r.sucesso?c:acaoIniciativa({...c,actors:{...c.actors,[a.id]:{remaining:1,passes:1}}},'spend',c.turnId);
 return {actors,combat,message:a.nome+' · Teste de consciência · base '+base+' + '+bonus+' por cura · '+r.die+'/'+value+' → '+r.grau+(r.sorte?' · 🍀 Sorte':'')+' · '+(r.sucesso?'recuperou a consciência':'continua inconsciente')};
}
