import {criarRelogio,atualizarRelogios,RODADA_MS} from './nova-duracoes.js?v=44';
import {classificarTeste} from './nova-regras.js?v=44';
import {acaoIniciativa,ataqueSuperaDefesa} from './nova-turnos.js?v=39';
import {alvosNoCone} from './nova-area.js?v=20260918';
export const feridas=h=>Object.keys(h?.hitMax||{}).filter(k=>Number(h.hit?.[k]??h.hitMax[k])<Number(h.hitMax[k]));
const clone=x=>structuredClone(x),cap=x=>Math.max(0,Math.min(100,Number(x)||0));
export function sorteio(seed){let s=seed>>>0;return max=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return 1+Math.floor(s/4294967296*max);};}
export function teste(valor,roll){const die=roll(100);return {valor:cap(valor),die,...classificarTeste(valor,die)};}
const sucesso=r=>['Sucesso','Crítico'].includes(r.grau);
export function ocupado(actor,combat){return !!actor?.treatment||(combat?.active&&actor?.supportLock===combat.roundId);}
export function atualizarDuracoes(actors,combat,scene,now=Date.now()){
 const changed=atualizarRelogios(actors,combat,scene,now);
 if(combat?.active)for(const [id,a]of Object.entries(actors||{})){
  const st=a.combateLab;
  if(st?.unconsciousUntilRound&&st.unconsciousUntilRound<=combat.round&&!st.morto){st.inconsciente=false;delete st.unconsciousUntilRound;}
  const initial=combat.suspended?.[id];
  if(initial&&!st?.morto&&!st?.inconsciente&&!st?.incapacitado&&!combat.order.includes(id)){combat.order.push(id);combat.initial[id]=initial;combat.actors[id]={remaining:0,passes:2};combat.order.sort((x,y)=>combat.rolls[y].total-combat.rolls[x].total);}
 }
 return changed;
}
function localValido(health,local){const opts=feridas(health);if(opts.length===1)return opts[0];if(!opts.includes(local))throw Error('Escolha a parte ferida a tratar.');return local;}
function distancia(a,b,map){return Math.hypot((a.x-b.x)*(map.larguraM||28)/28,(a.y-b.y)*(map.alturaM||14)/14);}
function fimTurno(c){if(!c?.active)return c;const id=c.activeId;return acaoIniciativa({...c,actors:{...c.actors,[id]:{...c.actors[id],remaining:1}}},'spend',c.turnId);}
function curar(st,local,pv){const before=Number(st.hit[local]);st.hit[local]=Math.min(st.hitMax[local],before+pv);st.tratados={...st.tratados,[local]:true};st.estabilizados={...st.estabilizados,[local]:true};st.ferimentos={...st.ferimentos};if(st.hit[local]>st.hitMax[local]/2)delete st.ferimentos[local];else st.ferimentos[local]=st.hit[local]<=0?'Grave':'Sério';return st.hit[local]-before;}
export function resolverSocorros({a,b,health,map,cmd,info,seed}){
 const actors=clone(health.actors||{}),actor=actors[a.id]||={combateLab:clone(info.health)},patient=actors[b.id]||={combateLab:clone(info.targetHealth)};
 const st=patient.combateLab;
 if(actor.combateLab?.morto||actor.combateLab?.inconsciente||actor.combateLab?.incapacitado)throw Error('O socorrista precisa estar consciente e capaz de agir.');
 if(st?.morto)throw Error('Primeiros Socorros não ressuscita mortos.');
 if(!info.firstAid)throw Error('A ficha não possui Primeiros Socorros.');
 if(distancia(a,b,map)>1.501)throw Error('Fora de alcance: aproxime-se até 1,5 m.');
 const c=map.combat,old=actor.treatment;let message,inventory=null;
 if(cmd.operation==='start'){
  if(ocupado(actor,c))throw Error('Este turno já está dedicado a Primeiros Socorros.');
  const local=localValido(st,cmd.local),kit=cmd.useKit!==false?info.kits.find(k=>(actor.kitUses?.[k.comp+':'+k.index]??k.uses)>0):null;
  actor.treatment={targetId:b.id,local,turns:1,lastRound:c?.round||0,session:c?.session||'',withKit:!!kit};
  if(kit){kit.uses=actor.kitUses?.[kit.comp+':'+kit.index]??kit.uses;inventory=clone(info.inventory);const entry=inventory[kit.comp][kit.index];entry.usosRestantes=kit.uses-1;actor.kitUses={...actor.kitUses,[kit.comp+':'+kit.index]:kit.uses-1};}
  message=`${a.nome} iniciou Primeiros Socorros em ${b.nome} · ${local} · ${kit?'kit: '+(kit.uses-1)+' usos restantes':'sem kit: teste Difícil (metade da perícia)'}. Concluir ou continuar no próximo turno.`;
 }else{
  if(!old||old.targetId!==b.id)throw Error('Não há atendimento iniciado para este paciente.');
  if(cmd.operation!=='cancel'&&c?.active&&(old.session!==c.session||c.round<=old.lastRound))throw Error('Aguarde seu turno na próxima rodada para continuar ou concluir.');
  if(cmd.operation==='continue'){
   if(old.turns>=3)throw Error('O atendimento já atingiu três turnos; conclua o teste.');
   old.turns++;old.lastRound=c?.round||0;message=`${a.nome} continua Primeiros Socorros em ${b.nome}: ${old.turns}/3 turnos · bônus +${(old.turns-1)*5}.`;
  }else if(cmd.operation==='finish'){
   const local=old.local;if(!(local in (st.hitMax||{})))throw Error('A parte tratada não existe mais.');
   const valor=cap((old.withKit?info.firstAid.value:Math.ceil(info.firstAid.value/2))+(old.turns-1)*5),r=teste(valor,sorteio(seed));
   let healed=0;if(sucesso(r)){healed=curar(st,local,r.grau==='Crítico'?Math.max(4,Math.min(6,1+Math.floor((valor-r.die)/10))):Math.max(1,Math.min(3,1+Math.floor((valor-r.die)/20))));st.inconsciente=false;st.incapacitado=false;delete st.inconscienteAteTurno;delete st.unconsciousUntilRound;}
   message=`${a.nome}: Primeiros Socorros em ${b.nome} · ${local} · ${r.die}/${valor} → ${r.grau} · ${sucesso(r)?'ferimento estabilizado, consciente, +'+healed+' PV':'sem recuperação'} · ${old.turns}/3 turnos. Infecções não são curadas.`;
   actor.treatment=null;
  }else if(cmd.operation==='cancel'){actor.treatment=null;message=`${a.nome} interrompeu o atendimento; o uso do kit não é devolvido.`;}
  else throw Error('Etapa de atendimento inválida.');
 }
 actor.supportLock=c?.active?c.roundId:null;
 return {actors,combat:fimTurno(c),inventory,message};
}
export const PSI_NARRATIVOS=new Set(['psicometria','detectar_psi','visao_distante','empatia','ler_mente','localizar_psi','telepatia','amizade','influenciar_mente','controlar_mente','amnesia','mente_acelerada','doador_vida']);
export function resolverPsi({a,b,health,map,cmd,info,positions,scene,seed}){
 const power=info.powers.find(p=>p.id===cmd.powerId);if(!power)throw Error('Poder não disponível para o treino desta ficha.');
 const actors=clone(health.actors||{}),actor=actors[a.id]||={combateLab:clone(info.health)},target=actors[b.id]||={combateLab:clone(info.targetHealth)},c=clone(map.combat);
 if(ocupado(actor,c))throw Error('Conclua o turno de Primeiros Socorros antes de usar psiquismo.');
 if(actor.combateLab.morto||actor.combateLab.inconsciente||actor.combateLab.incapacitado)throw Error('Personagem incapaz de usar psiquismo.');
 const roll=sorteio(seed),cost=Number(cmd.cost??power.cost),used=Number(actor.psiSpent??info.psiSpent??0),minimum=Number(power.cost)||0;
 if(!Number.isInteger(cost)||cost<minimum||cost>info.psiMax-used)throw Error('Custo inválido ou PP insuficientes.');
 if(power.id==='meditacao_psi'&&c?.active)throw Error('Meditação exige uma hora fora de combate.');
 if(power.id==='cura_psi'&&target.combateLab.morto)throw Error('Cura não ressuscita mortos.');
 let local=power.id==='cura_psi'?localValido(target.combateLab,cmd.local):'';
 const self=['meditacao_psi','meditacao_batalha','reflexos','fluxo_marcial','aceleracao','salto','teletransporte','teletransporte_caotico','agilidade_psi','ocultar_mente','anoitecer','circulo_protecao','defesa_mental'];
 if(self.includes(power.id)&&a.id!==b.id)throw Error('Este poder deve ter você como alvo.');
 const range=Number(power.range)||20;
 if(a.id!==b.id&&distancia(a,b,map)>range)throw Error('Alvo fora do alcance psíquico ('+range+' m).');
 const copySource=['ilusao','mimetismo_psi'].includes(power.id)?[...positions,...(scene?.objects||[])].find(t=>t.id===(cmd.sourceId||b.id)):null;
 if(['ilusao','mimetismo_psi'].includes(power.id)&&(!copySource||copySource.destruido))throw Error('Selecione uma forma existente no mapa.');
 if(copySource&&distancia(a,copySource,map)>range)throw Error('Forma fora do alcance psíquico.');
 if(power.id==='fluxo_marcial'&&c?.active){if(actor.zenRound===c.roundId)throw Error('Guerreiro Zen já foi tentado nesta rodada.');actor.zenRound=c.roundId;}
 const r=teste(power.value,roll);actor.psiMax=info.psiMax;actor.psiSpent=used+cost;const text=[`${a.nome}: ${power.name} → ${b.nome} · ${r.die}/${r.valor} · ${r.grau} · ${cost} PP`],moves={},effects=[];
 let requests=clone(health.psiRequests||[]),newScene=clone(scene||{mapId:map.mapId||'',objects:[]}),zenBonus=0;
 const addEffect=(id,key,data={})=>{const t=actors[id]||={combateLab:clone(info.healthById?.[id]||{})};t.psiEffects={...t.psiEffects,[key]:{round:c?.round||0,untilRound:(c?.round||0)+1,source:a.id,...data,clock:criarRelogio((data.durationSeconds||power.durationSeconds||((data.untilRound||((c?.round||0)+1))-(c?.round||0))*6)*1000,c,Number(cmd.time)||Date.now())}};effects.push(id);};
 if(sucesso(r)){
  const ids=power.id==='grito_psiquico'?alvosNoCone(a,b,positions,map,{range:8,angle:60}).map(t=>t.id):[b.id];
  const resisted=['medo','atordoar_psi','controlar_mente','influenciar_mente','ler_mente','amnesia','banimento_caotico','impulso','amizade'];
  for(const id of ids){
   const t=positions.find(t=>t.id===id)||b,h=actors[id]||={combateLab:clone(info.healthById?.[id]||info.targetHealth)};
   if(resisted.includes(power.id)&&id!==a.id){
    const hidden=h.psiEffects?.ocultar_mente,shield=h.psiEffects?.defesa_mental;
    if(hidden?.untilRound>(c?.round||0)&&['ler_mente','influenciar_mente','controlar_mente'].includes(power.id)){text.push(t.nome+': mente oculta, poder bloqueado');continue;}
    const d=teste(Number(info.willById?.[id]||0)+(shield?.untilRound>(c?.round||0)?20:0),roll);text.push(`${t.nome}: Vontade ${d.die}/${d.valor} → ${d.grau}`);if(!ataqueSuperaDefesa(r,d)){text.push('Resistiu');continue;}
   }
   if(power.id==='grito_psiquico'){
    const st=h.combateLab,d=st.inconsciente||st.morto||st.caido||st.derrubado?null:teste(Math.max(0,Number(info.dodgeById?.[id]||0)-(id===b.id?20:0)),roll);
    if(d)text.push(t.nome+': Esquiva '+d.die+'/'+d.valor+' → '+d.grau);
    if(d&&!ataqueSuperaDefesa(r,d))continue;
    st.caido=true;const resistance=teste(Number(info.resistanceById?.[id]||0),roll);text.push(t.nome+': caído · sem dano físico · Resistência '+resistance.die+'/'+resistance.valor+' → '+resistance.grau);
    if(!sucesso(resistance)){const rounds=roll(4);st.inconsciente=true;st.unconsciousUntilRound=(c?.round||0)+rounds;st.unconsciousClock=criarRelogio(rounds*6000,c,Number(cmd.time)||Date.now());text.push('Inconsciente por '+rounds+' rodada(s)');}
   }else if(PSI_NARRATIVOS.has(power.id)){
    requests.push({id:cmd.id+':'+id,actorId:a.id,targetId:id,powerId:power.id,powerName:power.name,text:String(cmd.text||'').slice(0,1000),status:'pending',description:power.description});text.push('Interpretação/mensagem enviada ao mestre para adjudicação');
   }else if(power.id==='cura_psi'){const gain=curar(h.combateLab,local,cost);text.push(`+${gain} PV em ${local}; infecções permanecem`);}
   else if(power.id==='meditacao_psi'){
    const now=Number(cmd.time),day=Math.floor(now/86400000);if(c?.active||actor.lastMeditationDay===day)throw Error('Meditação é permitida uma vez por dia fora de combate.');
    if(!actor.meditationStarted){actor.meditationStarted=now;text.push('Meditação iniciada: retorne após uma hora.');}
    else {if(now-actor.meditationStarted<3600000)throw Error('Ainda não transcorreu uma hora de meditação.');actor.psiSpent=Math.max(0,used-Math.ceil(info.psiMax/4));actor.lastMeditationDay=day;delete actor.meditationStarted;text.push('Recuperou ¼ dos PP máximos');}
   }else if(['salto','teletransporte','teletransporte_caotico','banimento_caotico','impulso'].includes(power.id)){
    let dest;if(power.id==='impulso'){const d=Math.max(.01,distancia(a,t,map));dest={x:t.x+(t.x-a.x)/d*5,y:t.y+(t.y-a.y)/d*5};}
    else if(/caotico/.test(power.id)){for(let attempt=0;attempt<400;attempt++){const p={x:roll(260)/10+1,y:roll(120)/10+1};if(!positions.some(other=>other.id!==id&&distancia(other,p,map)<1)){dest=p;break;}}if(!dest)throw Error('Não há destino livre para o teletransporte.');}
    else {dest={x:Number(cmd.x),y:Number(cmd.y)};if(!Number.isFinite(dest.x)||!Number.isFinite(dest.y)||distancia(t,dest,map)>10+Math.max(0,cost-minimum)*4)throw Error('Escolha um destino válido no alcance de salto/teletransporte.');}
    dest.x=Math.max(.5,Math.min(27.5,dest.x));dest.y=Math.max(.5,Math.min(13.5,dest.y));
    if(positions.some(p=>p.id!==id&&distancia(p,dest,map)<1))throw Error('Destino ocupado por outra miniatura.');const {id:internalId,...position}=t;moves[id]={...position,...dest,teleportNonce:String(cmd.id||Date.now()),revision:(t.revision||0)+1};text.push('Posição alterada');
   }else if(power.id==='mover_objeto'){
    const object=newScene.objects?.find(o=>o.id===cmd.objectId);if(!object)throw Error('Selecione um objeto do mapa.');
    const capacity=80*2**Math.max(0,cost-minimum);if(Number(object.peso||object.pesoKg||80)>capacity)throw Error('Objeto pesado demais para esse gasto.');
    const dest={x:Number(cmd.x),y:Number(cmd.y)};if(!Number.isFinite(dest.x)||!Number.isFinite(dest.y)||distancia(object,dest,map)>10||dest.x<0||dest.x>28||dest.y<0||dest.y>14)throw Error('Destino de objeto inválido (máximo 10 m).');Object.assign(object,dest);text.push('Objeto movido');
   }else if(power.id==='ilusao'){const source=copySource;const illusion={id:cmd.id+':ilusao',nome:'Ilusão de '+String(source.nome||'forma'),imagem:String(source.imagem||''),modeloId:String(source.modeloId||''),tipo:source.tipo||'objeto',x:Math.min(27.5,Number(a.x||0)+1.2),y:Number(a.y||0),larguraM:Number(source.larguraM||source.diametroM||1),alturaM:Number(source.alturaM||source.diametroM||1),pvMax:0,pvAtual:0,dureza:0,pa:0,destrutivel:true,ilusaoPsi:true,autorPsiId:a.id,maintenance:{remaining:(power.durationSeconds||60)*1000,period:6000,cost:2},lastRound:c?.round||0,clock:criarRelogio((power.durationSeconds||60)*1000,c,Number(cmd.time)||Date.now()),qualidadePsi:Math.max(0,r.valor-r.die)};newScene.objects=[...(newScene.objects||[]),illusion];text.push('Ilusão criada como cópia visual de '+String(source.nome||'forma'));}
   else if(['anoitecer','circulo_protecao','defesa_mental'].includes(power.id)){newScene.psiZones=[...(newScene.psiZones||[]),{id:cmd.id,kind:power.name,powerId:power.id,sourceId:a.id,clock:criarRelogio((power.durationSeconds||6)*1000,c,Number(cmd.time)||Date.now()),x:t.x,y:t.y,radius:Math.sqrt(Math.max(1,cost)*5/Math.PI),untilRound:(c?.round||0)+1}];addEffect(id,power.id,{value:cost});}
   else if(power.id==='mimetismo_psi'){const source=copySource;addEffect(a.id,power.id,{image:String(source.imagem||''),sourceId:source.id,sourceName:source.nome||'',untilRound:(c?.round||0)+10,renewRounds:10,renewCost:1});text.push('Mimetismo ativo: '+String(source.nome||'forma')+' por 1 minuto (10 rodadas)');}
   else if(power.id==='fluxo_marcial'){const margin=Math.max(0,r.valor-r.die),bonus=margin>=15?3:margin>=10?2:margin>=5?1:0;zenBonus=1+bonus+(r.grau==='Crítico'?1:0);text.push('Guerreiro Zen: ação de ativação devolvida + '+(zenBonus-1)+' Ações extras');}
   else if(['atordoar_psi','medo'].includes(power.id)){addEffect(id,'atordoado',{penalty:20,visual:'💫'});text.push(t.nome+': −20 nas perícias por uma rodada');}
   else if(power.id==='evitar_dano'){h.psiAbsorption=Number(h.psiAbsorption||0)+cost;text.push('Proteção: '+h.psiAbsorption+' PV absorvidos');}
   else if(power.id==='intuicao_psi'){h.psiIntuition=Number(h.psiIntuition||0)+cost;text.push('Bônus +'+cost+' no próximo teste');}
   else if(power.id==='agilidade_psi'){addEffect(id,power.id,{bonus:Math.floor(cost/5)*10});}
   else if(power.id==='aceleracao'){addEffect(id,power.id,{movement:30});}
   else if(power.id==='reflexos'){if(c?.active&&c.actors[id]){c.actors[id].remaining++;}addEffect(id,power.id,{bonus:1});text.push('+1 ação nesta rodada');}
   else if(power.id==='meditacao_batalha'){addEffect(id,power.id,{readyRound:(c?.round||0)+2,untilRound:(c?.round||0)+3,bonus:20});}
   else if(power.id==='ocultar_mente'){addEffect(id,power.id,{hidden:true});}
   else {requests.push({id:cmd.id+':'+id,actorId:a.id,targetId:id,powerId:power.id,powerName:power.name,text:String(cmd.text||''),description:power.description,status:'pending'});text.push('Poder de cadastro: enviado ao mestre para adjudicação');}
  }
 }
 // Creditar antes do gasto evita encerrar a oportunidade na última ação.
 if(zenBonus&&c?.active&&c.actors?.[a.id])c.actors[a.id]={...c.actors[a.id],remaining:c.actors[a.id].remaining+zenBonus};
 let combatOut=c?.active?acaoIniciativa(c,'spend',c.turnId):c;
 return {actors,combat:combatOut,scene:newScene,moves,psiRequests:requests.slice(-60),psiHit:sucesso(r),powerName:power.name,...(power.id==='grito_psiquico'?{area:{range:8,angle:60,source:{x:a.x,y:a.y},aim:{x:b.x,y:b.y},width:map.larguraM||28,height:map.alturaM||14}}:{}),message:text.join(' · ')};
}
