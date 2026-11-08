import {instalarLatidoMesa} from './mesa-latido.js';
import {ocupadoNoArrasto} from './mesa-arrasto-regras.js';
import {acaoIniciativa,gastarDefesa,removerMortos} from './nova-turnos.js?v=46';
import {alvosNoCone} from './nova-area.js?v=20260918';
import {atualizarDuracoes} from './nova-suporte.js?v=46';
export const HEALTH_PATH='combatesAtivos/mapaMesaSyncSaude';
export const HISTORY_PATH='combatesAtivos/mapaMesaSyncHistorico';
const SCENE='combatesAtivos/mapaMesaSyncDiretaCena';
const MAP='combatesAtivos/mapaMesaSyncDireta',POSITIONS=MAP+'/posicoes',COMMANDS=MAP+'/acoes';
export function conectarAtaques({database,user,tokens,prepare,prepareSupport,prepareEquipment,onHealth,onError}){
 let stopHealth=null,stopCommands=null,closed=false;
 const running=new Set(),waiters=new Set(),luckCheckpoints=new Map(),clean=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
 const clearLuckMarkers=actors=>{for(const state of Object.values(actors||{})){if(!state||typeof state!=='object')continue;delete state.lastLuckCommandId;delete state.lastLuckLabel;delete state.luckRerollPending;delete state.luckPrepared;}};
 const markLuck=(actors,actorId,commandId,label)=>{const state=actors[actorId]||={};state.lastLuckCommandId=commandId;state.lastLuckLabel=label||'último teste';delete state.luckRerollPending;};
 const supportLuckEligible=cmd=>cmd?.kind==='direct-test'||cmd?.kind==='direct-consciousness'||cmd?.kind==='direct-psi'||(cmd?.kind==='direct-first-aid'&&cmd?.operation==='finish');
 const pruneLuck=actorId=>{for(const [key,value]of [...luckCheckpoints])if(value?.actorId===actorId)luckCheckpoints.delete(key);};
 async function orientAttack(original,expectedRevision){
  try{await database.transact(async tx=>{
   const map=await tx.get(MAP)||{},path=POSITIONS+'/'+original.personagemId,a=await tx.get(path),scene=original.targetKind==='object'?await tx.get(SCENE):null,b=original.targetKind==='object'?scene?.objects?.find(o=>o.id===original.targetId):await tx.get(POSITIONS+'/'+original.targetId);
   if(!a||!b||(map.mapId||'')!==original.mapId)return;
   if(Number(a.revision||0)!==Number(expectedRevision||0))return;
   if(map.combat?.active&&original.turnId&&!original.turnId.startsWith(map.combat.session+':'))return;
   const facing=Math.atan2((b.y-a.y)*(Number(map.alturaM)||14)/14,(b.x-a.x)*(Number(map.larguraM)||28)/28);
   tx.set(path,{...a,facing,revision:Number(a.revision||0)+1});
  });}catch(e){onError(new Error('O ataque foi enviado, mas não foi possível salvar a direção: '+e.message));}
 }
 /* v200: Sorte = +50% do valor da perícia no próximo teste (não rerrola mais). Gasta 1 ponto e marca a Sorte ativa no personagem. */
 async function processLuckBoost(id,command){
  if(!prepareSupport)throw Error('Suporte indisponível.');
  const actor0=await database.get(POSITIONS+'/'+command.personagemId);
  if(!actor0)throw Error('Participante não está no mapa.');
  const prepared=await prepareSupport({...actor0,id:command.personagemId},{...actor0,id:command.personagemId},tokens());
  let msg='';
  await database.transact(async tx=>{
   const path=COMMANDS+'/'+id,cmd=await tx.get(path),map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{}},history=await tx.get(HISTORY_PATH)||{entries:[]},scene=await tx.get(SCENE);
   const a=await tx.get(POSITIONS+'/'+command.personagemId),sheet=prepared.sheetPath?await tx.get(prepared.sheetPath):null;
   if(cmd?.status!=='pending')return;
   if(!a)throw Error('Participante removido do mapa.');
   if(cmd.donoUid!==a.donoUid&&cmd.donoUid!==user().uid)throw Error('Você não controla este personagem.');
   const spend=prepared.resolve({a:{...a,id:a.id},b:{...a,id:a.id},health,map,cmd:{...cmd,id,time:Date.now()},sheet,scene,positions:tokens(),seed:cmd.seed});
   const event={id,actorUid:a.donoUid||'',ts:Date.now(),message:spend.message};
   tx.set(HEALTH_PATH,clean({...health,actors:spend.actors,revision:Number(health.revision||0)+1,event}));
   tx.set(HISTORY_PATH,clean({...history,entries:[...(history.entries||[]),event].slice(-120),revision:Number(history.revision||0)+1}));
   if(prepared.sheetPath&&sheet&&spend.sheetPatch)tx.set(prepared.sheetPath,{...sheet,...clean(spend.sheetPatch)});
   tx.set(path,{...cmd,status:'done',message:spend.message});
   msg=spend.message;
  });
  return msg||'🍀 Sorte ativada: +50% da perícia no próximo teste.';
 }
 async function processLuckReroll(id,command){
  if(!prepareSupport)throw Error('Suporte indisponível.');
  const actor0=await database.get(POSITIONS+'/'+command.personagemId);
  if(!actor0)throw Error('Participante não está no mapa.');
  const prepared=await prepareSupport({...actor0,id:command.personagemId},{...actor0,id:command.personagemId},tokens());
  const rerollId=crypto.randomUUID(),newSeed=crypto.getRandomValues(new Uint32Array(1))[0];
  let replayLabel='último teste',selectedCheckpoint=null;
  await database.transact(async tx=>{
   const path=COMMANDS+'/'+id,cmd=await tx.get(path),map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{}},history=await tx.get(HISTORY_PATH)||{entries:[]},scene=await tx.get(SCENE);
   const a=await tx.get(POSITIONS+'/'+command.personagemId),sheet=prepared.sheetPath?await tx.get(prepared.sheetPath):null;
   if(cmd?.status!=='pending')return;
   if(!a)throw Error('Participante removido do mapa.');
   if(cmd.donoUid!==a.donoUid&&cmd.donoUid!==user().uid)throw Error('Você não controla este personagem.');
   const actorState=health.actors?.[a.id]||{},lastId=String(actorState.lastLuckCommandId||''),checkpoint=luckCheckpoints.get(lastId);
   if(!lastId||!checkpoint||checkpoint.actorId!==a.id)throw Error('Não há um teste recente disponível para rerrolar. Faça a rerrolagem imediatamente após o teste.');
   if(Number(checkpoint.afterRevision)!==Number(health.revision||0))throw Error('Outro evento já aconteceu depois desse teste; a janela de rerrolagem terminou.');
   if(checkpoint.used)throw Error('Este teste já foi rerrolado com Sorte.');
   const spend=prepared.resolve({a:{...a,id:a.id},b:{...a,id:a.id},health,map,cmd:{...cmd,id,time:Date.now()},sheet,scene,positions:tokens(),seed:cmd.seed});
   const restored=clean(checkpoint.health||{actors:{}});restored.actors=restored.actors||{};clearLuckMarkers(restored.actors);
   const restoredActor=restored.actors[a.id]||={};restoredActor.luckRerollPending=rerollId;
   if(!prepared.sheetPath&&spend.actors?.[a.id]?.luckRemaining!==undefined)restoredActor.luckRemaining=spend.actors[a.id].luckRemaining;
   restored.revision=Number(health.revision||0)+1;restored.event={id,actorUid:a.donoUid||'',ts:Date.now(),message:spend.message};
   tx.set(HEALTH_PATH,clean(restored));
   tx.set(MAP,clean(checkpoint.map));
   tx.set(HISTORY_PATH,clean(checkpoint.history));
   if(checkpoint.scene!==null&&checkpoint.scene!==undefined)tx.set(SCENE,clean(checkpoint.scene));
   for(const [key,value]of Object.entries(checkpoint.positions||{}))tx.set(POSITIONS+'/'+key,clean(value));
   for(const [docPath,value]of Object.entries(checkpoint.sheets||{})){
    const merged=docPath===prepared.sheetPath&&spend.sheetPatch?{...clean(value),...clean(spend.sheetPatch)}:clean(value);tx.set(docPath,merged);
   }
   if(prepared.sheetPath&&!Object.prototype.hasOwnProperty.call(checkpoint.sheets||{},prepared.sheetPath)&&sheet&&spend.sheetPatch)tx.set(prepared.sheetPath,{...sheet,...clean(spend.sheetPatch)});
   for(const [commandPath,value]of Object.entries(checkpoint.relatedCommands||{}))tx.set(COMMANDS+'/'+commandPath,clean(value));
   const original=clean(checkpoint.command);delete original.status;delete original.message;delete original.engineVersion;
   const replay={...original,donoUid:cmd.donoUid,createdAt:Date.now(),status:'pending',seed:newSeed,luckRerollOf:lastId,luckSpent:true};
   tx.set(COMMANDS+'/'+rerollId,replay);
   tx.set(COMMANDS+'/'+lastId,{...clean(checkpoint.command),status:'rerolled',message:'Substituído por rerrolagem de Sorte.'});
   tx.set(path,{...cmd,status:'done',message:spend.message+' · nova rolagem em andamento'});
   selectedCheckpoint=checkpoint;replayLabel=checkpoint.label||replayLabel;
  });
  if(selectedCheckpoint)selectedCheckpoint.used=true;
  return '🍀 '+replayLabel+' rerrolado; o novo resultado substituirá o anterior.';
 }

 async function process(id,command){
  command={...command,kind:command.kind.replace(/^v56:/,'')};
  if(running.has(id)||closed||!user()?.master)return;running.add(id);
   const path=COMMANDS+'/'+id;
   try{
   if(['direct-attack','direct-psi'].includes(command.kind)&&ocupadoNoArrasto(await database.get('combatesAtivos/mesaArrastos'),String(command.personagemId||'')))throw Error('Solte a carga para atacar ou usar poderes.');
   if(command.kind==='direct-luck'){await processLuckBoost(id,command);return;}
   // v111/v208: no combate em tempo real o ataque é resolvido pelo módulo do tempo real (recarga, defesa automática).
   // Sem combate nenhum, a hostilidade LIGA o tempo real na hora (estilo MMO) — se houver combate por turnos, segue o fluxo antigo.
   if(command.kind==='direct-attack'&&globalThis.mesaTempoRealV111&&command.targetKind!=='object'&&!command.powerId){
    await globalThis.mesaTempoRealV111.iniciar?.(); // valida também mapa e pausas legadas, mesmo se já estava ativo
    if(await globalThis.mesaTempoRealV111.assumir(id,command))return;
   }
   // v140: psi dos jogadores no tempo real (recarga e resolução pelo módulo do tempo real)
   if(command.kind==='direct-psi'&&!command.turnId&&globalThis.mesaTempoRealV111?.ativo?.()&&globalThis.mesaTempoRealV111.assumirPsi&&await globalThis.mesaTempoRealV111.assumirPsi(id,command))return;
   if(['direct-extinguish','direct-inventory','direct-consciousness','direct-first-aid','direct-test','direct-psi','direct-psi-review','direct-stand'].includes(command.kind)){
    if(!prepareSupport)throw Error('Suporte indisponível.');
    const a0=await database.get(POSITIONS+'/'+command.personagemId),b0=await database.get(POSITIONS+'/'+command.targetId);
    if(!a0||!b0)throw Error('Participante não está no mapa.');
    const prepared=await prepareSupport({...a0,id:command.personagemId},{...b0,id:command.targetId},tokens());
    let supportCheckpoint=null;
    await database.transact(async tx=>{
     const cmd=await tx.get(path),map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{}},history=await tx.get(HISTORY_PATH)||{entries:[]};
     const scene=await tx.get('combatesAtivos/mapaMesaSyncDiretaCena');
     const sheet=prepared.sheetPath?await tx.get(prepared.sheetPath):null;
     const positions=await Promise.all(tokens().map(async t=>{const value=await tx.get(POSITIONS+'/'+t.id);return value?{...value,id:t.id}:null;}));
     const list=positions.filter(Boolean),a=list.find(t=>t.id===cmd?.personagemId),b=list.find(t=>t.id===cmd?.targetId);
     if(cmd?.status!=='pending')return;
     if(!a||!b)throw Error('Participante removido do mapa.');
     if(cmd.kind==='direct-extinguish'&&cmd.mapId!==map.mapId)throw Error('O mapa mudou.');
     if(cmd.donoUid!==a.donoUid&&cmd.donoUid!==user().uid)throw Error('Você não controla este personagem.');
     if(cmd.kind==='direct-psi-review'&&cmd.donoUid!==user().uid)throw Error('Somente o mestre pode adjudicar.');
     if(cmd.kind!=='direct-psi-review'){
      if(map.combat?.pendingAttack)throw Error('Resolva a defesa pendente.');
      if((map.combat?.active?map.combat.turnId:null)!==cmd.turnId)throw Error('O turno mudou.');
      if(map.combat?.active&&(map.combat.activeId!==a.id||map.combat.actors[a.id]?.remaining<=0))throw Error('Aguarde seu turno com ações disponíveis.');
     }
     const result=prepared.resolve({a,b,health,map,cmd:{...cmd,id,time:Date.now()},sheet,scene,positions:list,seed:cmd.seed});
     atualizarDuracoes(result.actors,result.combat);
     const message=String(result.message||'')+(cmd.luckRerollOf?' · 🍀 Rerrolagem de Sorte':'');
     const event={id,actorUid:(list.find(t=>t.id===result.eventActorId)||a).donoUid||'',targetUid:(list.find(t=>t.id===result.eventTargetId)||b).donoUid||'',ts:Date.now(),message};
     if(cmd.kind==='direct-psi')Object.assign(event,{source:{x:a.x,y:a.y},target:{x:b.x,y:b.y},item:{nome:result.powerName||'Poder psíquico'},hit:result.psiHit!==false,...(result.area?{area:result.area}:{})});
     const actors=clean(result.actors||health.actors||{});clearLuckMarkers(actors);
     const nextRevision=Number(health.revision||0)+1,eligible=supportLuckEligible(cmd)&&!cmd.luckRerollOf;
     if(eligible){
      const label=cmd.kind==='direct-consciousness'?'teste de consciência':cmd.kind==='direct-first-aid'?'teste de Primeiros Socorros':cmd.kind==='direct-psi'?'teste de Psiquismo':'teste de perícia';
      markLuck(actors,a.id,id,label);
      supportCheckpoint={actorId:a.id,label,afterRevision:nextRevision,command:clean(cmd),health:clean(health),map:clean(map),history:clean(history),scene:clean(scene),positions:Object.fromEntries(list.map(t=>[t.id,clean(t)])),sheets:(prepared.sheetPath&&(result.inventory||result.sheetPatch)&&sheet)?{[prepared.sheetPath]:clean(sheet)}:{},relatedCommands:{}};
     }
     tx.set(HEALTH_PATH,clean({...health,actors,psiRequests:result.psiRequests||health.psiRequests||[],event,revision:nextRevision}));
     if(prepared.sheetPath&&(result.inventory||result.sheetPatch))tx.set(prepared.sheetPath,{...sheet,...result.sheetPatch,...(result.inventory?{inventario:result.inventory}:{})});
     if(result.scene)tx.set('combatesAtivos/mapaMesaSyncDiretaCena',clean(result.scene));
     for(const [key,value]of Object.entries(result.moves||{}))tx.set(POSITIONS+'/'+key,clean(value));
     if(result.combat)tx.set(MAP,clean({...map,combat:result.combat}));
     tx.set(HISTORY_PATH,clean({entries:[...(history.entries||[]),event].slice(-120),revision:(history.revision||0)+1}));
     tx.set(path,{...cmd,status:'done',message});
    });
    if(supportCheckpoint){pruneLuck(supportCheckpoint.actorId);luckCheckpoints.set(id,supportCheckpoint);}return;
   }
   if(command.kind==='direct-equipment'){
    if(!prepareEquipment)throw Error('Troca de equipamento indisponível.');
    const token=await database.get(POSITIONS+'/'+command.personagemId);if(!token)throw Error('Personagem não encontrado.');
    const prepared=await prepareEquipment({...token,id:command.personagemId},command);
    await database.transact(async tx=>{
     const cmd=await tx.get(path),map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{}},history=await tx.get(HISTORY_PATH)||{entries:[]};
     const fresh=await tx.get(POSITIONS+'/'+command.personagemId),sheet=prepared.sheetPath?await tx.get(prepared.sheetPath):null;
     if(cmd?.status!=='pending')return;
     if(!fresh||cmd.donoUid!==fresh.donoUid&&!(cmd.donoUid===user().uid&&!fresh.donoUid))throw Error('Você não controla este personagem.');
     if(!map.combat?.active||map.combat.activeId!==cmd.personagemId||map.combat.turnId!==cmd.turnId||map.combat.pendingAttack)throw Error('Aguarde sua oportunidade e conclua a defesa pendente.');
     const result=prepared.resolve(sheet,health.actors?.[cmd.personagemId]||{},map);
     if(result.cost>map.combat.actors[cmd.personagemId].remaining)throw Error('Ações insuficientes.');
     let combat=map.combat;for(let i=0;i<result.cost;i++)combat=acaoIniciativa(combat,'spend',combat.turnId);
     const state={...(health.actors?.[cmd.personagemId]||{}),...result.actor},actors={...health.actors,[cmd.personagemId]:state};clearLuckMarkers(actors);
     tx.set(HEALTH_PATH,clean({...health,actors,revision:(health.revision||0)+1}));
     if(result.inventory&&prepared.sheetPath){if(!sheet)throw Error('Ficha não encontrada.');tx.set(prepared.sheetPath,{...sheet,inventario:result.inventory});}
     tx.set(MAP,{...map,combat});
     const event={id,actorUid:fresh.donoUid,ts:Date.now(),message:result.message};
     tx.set(HISTORY_PATH,{entries:[...(history.entries||[]),event].slice(-120),revision:(history.revision||0)+1});
     tx.set(path,{...cmd,status:'done',message:result.message});
    });return;
   }
   const defense=command.kind==='direct-defense',effectChoice=command.kind==='direct-effects',followup=defense||effectChoice;
   const original=followup?await database.get(COMMANDS+'/'+command.attackId):command;
   if(!original)throw Error('Ataque não encontrado.');
   const find=async id=>tokens().find(t=>t.id===id)||(await database.get(POSITIONS+'/'+id));
   const objectTarget=original.targetKind==='object';
   if(objectTarget&&followup)throw Error('Objetos não têm defesa ativa.');
   const [actor,target]=await Promise.all([find(original.personagemId),objectTarget?database.get(SCENE).then(s=>s?.objects?.find(o=>o.id===original.targetId)):find(original.targetId)]);
   if(!actor||!target)throw Error('Participante não encontrado.');
   const resolve=await prepare({...actor,id:original.personagemId},{...target,id:original.targetId},original);
   if(resolve.area||original.area){await processArea(id,command,original,resolve.area||original.area.shape);if(!defense)await orientAttack(original,actor.revision);return;}
   let attackCheckpoint=null;
   await database.transact(async tx=>{
    // Firestore exige todas as leituras antes da primeira gravação.
    const cmd=await tx.get(path),map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{},revision:0};
    const history=await tx.get(HISTORY_PATH)||{entries:[]};
    const attackCmd=followup?await tx.get(COMMANDS+'/'+command.attackId):cmd;
    const scene=await tx.get(SCENE);
    const a=await tx.get(POSITIONS+'/'+original.personagemId),b=objectTarget?scene?.objects?.find(o=>o.id===original.targetId):await tx.get(POSITIONS+'/'+original.targetId);
    // Alguns efeitos (por exemplo Danificar Arma) alteram a ficha persistente
    // do defensor. Leia-a antes de qualquer gravação para respeitar a regra de
    // transações do Firestore e entregue a versão fresca ao resolvedor.
    const targetSheetPath=resolve.targetSheetPath||null;
    const targetSheet=targetSheetPath?await tx.get(targetSheetPath):null;
    if(objectTarget&&(!map.combat?.active||scene?.mapId!==map.mapId))throw Error('Inicie o combate no mapa deste objeto.');
    if(cmd?.status!=='pending')return;
    if(!a||!b||original.personagemId===original.targetId)throw Error('Alvo inválido.');
    if((map.mapId||'')!==original.mapId||(map.combat?.active?map.combat.turnId:null)!==original.turnId)throw Error('O mapa ou a oportunidade mudou.');
    const pending=health.pending;
    if(effectChoice){
     if(attackCmd?.status!=='awaiting'||pending?.type!=='effects'||pending.id!==command.attackId||map.combat?.pendingAttack!==command.attackId)throw Error('Esta escolha já foi resolvida.');
     if(cmd.personagemId!==original.personagemId||(cmd.donoUid!==a.donoUid&&cmd.donoUid!==user().uid))throw Error('Somente o atacante ou o mestre escolhe os efeitos.');
    }else if(defense){
     if(pending?.type==='effects')throw Error('A defesa já foi resolvida.');
     if(attackCmd?.status!=='awaiting'||pending?.id!==command.attackId||map.combat?.pendingAttack!==command.attackId)throw Error('Esta defesa já foi resolvida ou encerrada.');
     if(cmd.donoUid!==b.donoUid&&cmd.donoUid!==user().uid)throw Error('Você não controla o defensor.');
     if(cmd.personagemId!==original.targetId)throw Error('Defensor inválido.');
     if(cmd.choice!=='none'&&!pending.options.some(o=>o.id===cmd.choice))throw Error('Defesa indisponível.');
    }else{
     if(map.combat?.pendingAttack)throw Error('Aguardando a defesa do ataque anterior.');
     if(cmd.donoUid!==a.donoUid&&cmd.donoUid!==user().uid)throw Error('Você não controla este personagem.');
     if(!Number.isFinite(cmd.createdAt)||Math.abs(Date.now()-cmd.createdAt)>30000)throw Error('O pedido expirou. Tente novamente.');
     if(map.combat?.active&&map.combat.activeId!==cmd.personagemId)throw Error('Aguarde sua vez.');
    }
    const result=resolve({...a,id:original.personagemId},{...b,id:original.targetId},health.actors||{},map,{phase:followup?'resolve':'preview',choice:defense?cmd.choice:effectChoice?attackCmd.defenseChoice:null,effectsConfirmed:effectChoice,effects:effectChoice?cmd.effects:[],local:effectChoice?cmd.local:''},scene,targetSheet);
    if(result.targetSheetPatch&&targetSheetPath&&!targetSheet)throw Error('Ficha persistente do defensor não encontrada.');
    const luckActorId=!effectChoice?(!followup?a.id:(defense&&cmd.choice!=='none'?b.id:null)):null;
    const luckLabel=!followup?'teste de ataque':'teste de defesa';
    const luckEligible=!!luckActorId&&!cmd.luckRerollOf,nextRevision=Number(health.revision||0)+1;
    const actorsWithLuck=base=>{const out=clean(base||{});clearLuckMarkers(out);if(luckEligible)markLuck(out,luckActorId,id,luckLabel);return out;};
    const prepareLuckCheckpoint=()=>{if(!luckEligible)return;attackCheckpoint={actorId:luckActorId,label:luckLabel,afterRevision:nextRevision,command:clean(cmd),health:clean(health),map:clean(map),history:clean(history),scene:clean(scene),positions:{[a.id]:clean(a),...(objectTarget?{}:{[b.id]:clean(b)})},sheets:targetSheetPath&&targetSheet?{[targetSheetPath]:clean(targetSheet)}:{},relatedCommands:followup?{[command.attackId]:clean(attackCmd)}:{}};};
    if(result.effectsPending){
     const attackId=followup?command.attackId:id,message='Ataque acertou · aguardando escolhas de '+a.nome+(cmd.luckRerollOf?' · 🍀 Rerrolagem de Sorte':'');
     prepareLuckCheckpoint();const markedActors=actorsWithLuck(health.actors||{});
     tx.set(HEALTH_PATH,clean({...health,actors:markedActors,pending:{...result.effectsPending,id:attackId,actorId:original.personagemId,targetId:original.targetId,owner:a.donoUid},revision:nextRevision}));
     tx.set(MAP,{...map,combat:{...map.combat,pendingAttack:attackId}});
     tx.set(COMMANDS+'/'+attackId,clean({...attackCmd,defenseChoice:defense?cmd.choice:'none',status:'awaiting',message}));
     if(followup)tx.set(path,{...cmd,status:'done',message});return;
    }
    if(!followup&&result.pending){
     const facing=Math.atan2((b.y-a.y)*(Number(map.alturaM)||14)/14,(b.x-a.x)*(Number(map.larguraM)||28)/28);
     const next={...result.pending,id,actorId:original.personagemId,targetId:original.targetId,owner:b.donoUid,facing},message='Ataque lançado · aguardando defesa de '+b.nome+(cmd.luckRerollOf?' · 🍀 Rerrolagem de Sorte':'');
     prepareLuckCheckpoint();const markedActors=actorsWithLuck(health.actors||{});
     tx.set(HEALTH_PATH,clean({...health,actors:markedActors,pending:next,revision:nextRevision}));
     tx.set(MAP,{...map,combat:{...map.combat,pendingAttack:id}});
     tx.set(path,{...cmd,status:'awaiting',message});
     return;
    }
    let combat=map.combat;
    if(combat?.active){
     const {pendingAttack,...unlocked}=combat;combat=unlocked;
     if(result.defenseSpent)combat=gastarDefesa(combat,original.targetId);
     combat=removerMortos(combat,{...(health.actors||{}),...result.actors});
     if(combat.active)combat=acaoIniciativa(combat,'spend',combat.turnId);
    }
    const event={...result.event,id:followup?command.attackId:id,ts:Date.now(),actorUid:a.donoUid,targetUid:b.donoUid,source:{id:original.personagemId,x:a.x,y:a.y},target:{id:original.targetId,x:b.x,y:b.y}};
    if(cmd.luckRerollOf)event.message=String(event.message||'')+' · 🍀 Rerrolagem de Sorte';
    const actors={...(health.actors||{})};for(const [key,value]of Object.entries(result.actors||{}))actors[key]={...actors[key],...value};
    const markedActors=actorsWithLuck(actors);prepareLuckCheckpoint();
    atualizarDuracoes(markedActors,combat);
    tx.set(HEALTH_PATH,clean({...health,actors:markedActors,revision:nextRevision,event,pending:null}));
    tx.set(HISTORY_PATH,clean({entries:[...(history.entries||[]),event].slice(-120),revision:(history.revision||0)+1}));
    if(result.targetSheetPatch&&targetSheetPath)tx.set(targetSheetPath,clean({...targetSheet,...result.targetSheetPatch}));
    if(objectTarget&&result.object)tx.set(SCENE,clean({...scene,objects:scene.objects.map(o=>o.id===b.id?result.object:o)}));
    if(map.combat?.active)tx.set(MAP,{...map,combat});
    tx.set(path,{...cmd,status:'done',message:event.message});
    if(followup)tx.set(COMMANDS+'/'+command.attackId,{...attackCmd,status:'done',message:event.message});
   });
   if(attackCheckpoint){pruneLuck(attackCheckpoint.actorId);luckCheckpoints.set(id,attackCheckpoint);}
   if(!defense)await orientAttack(original,actor.revision);
  }catch(e){
   try{await database.transact(async tx=>{
    const cmd=await tx.get(path);
    const rejectedAttack=command.kind==='direct-attack';
    const history=rejectedAttack?await tx.get(HISTORY_PATH)||{entries:[],revision:0}:null;
    if(cmd?.status!=='pending')return;
    if(rejectedAttack){
     const actor=tokens().find(t=>String(t.id)===String(command.personagemId));
     const target=tokens().find(t=>String(t.id)===String(command.targetId));
     const event={id:id+':rejected',ts:Date.now(),actorUid:actor?.donoUid||cmd.donoUid||'',targetUid:target?.donoUid||'',message:'Ataque de '+(actor?.nome||'personagem')+' não realizado: '+e.message};
     tx.set(HISTORY_PATH,clean({entries:[...(history.entries||[]),event].slice(-120),revision:(history.revision||0)+1}));
    }
    tx.set(path,{...cmd,status:'rejected',engineVersion:60,message:e.message});
   });}catch(failure){onError(failure);}
  }finally{running.delete(id);}
 }
 async function processArea(id,command,original,shape){
  const defense=command.kind==='direct-defense',attackId=defense?command.attackId:id;let areaCheckpoint=null;
  const candidates=original.area?.ids||[...new Set([original.targetId,...tokens().map(t=>t.id)])].filter(key=>key!==original.personagemId);
  const source=await database.get(POSITIONS+'/'+original.personagemId);
  const prepared=new Map();
  await Promise.all(candidates.map(async key=>{const t=await database.get(POSITIONS+'/'+key);if(t)prepared.set(key,await prepare({...source,id:original.personagemId},{...t,id:key},original));}));
  await database.transact(async tx=>{
   const path=COMMANDS+'/'+id,cmd=await tx.get(path),attackCmd=defense?await tx.get(COMMANDS+'/'+attackId):cmd;
   const map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{}},history=await tx.get(HISTORY_PATH)||{entries:[]};
   const a={...await tx.get(POSITIONS+'/'+original.personagemId),id:original.personagemId};
   const positions=[];for(const key of candidates){const p=await tx.get(POSITIONS+'/'+key);if(p)positions.push({...p,id:key});}
   if(cmd?.status!=='pending')return;
   if((map.mapId||'')!==original.mapId||map.combat?.turnId!==original.turnId)throw Error('O mapa ou a oportunidade mudou.');
   const aim=positions.find(t=>t.id===original.targetId);if(!aim)throw Error('Alvo central não encontrado.');
   const affected=defense?positions.filter(t=>attackCmd.area.ids.includes(t.id)):alvosNoCone(a,aim,positions,map,shape).filter(t=>!health.actors?.[t.id]?.combateLab?.morto);
   if(!affected.some(t=>t.id===original.targetId))throw Error('Alvo central fora do alcance do cone.');
   const responses={...(attackCmd.area?.responses||{})};
   if(defense){
    const p=health.pending,b=affected.find(t=>t.id===cmd.personagemId);
    if(attackCmd.status!=='awaiting'||p?.id!==attackId||p.targetId!==cmd.personagemId||map.combat?.pendingAttack!==attackId)throw Error('Esta defesa já foi resolvida ou encerrada.');
    if(!b||cmd.donoUid!==b.donoUid&&cmd.donoUid!==user().uid)throw Error('Você não controla o defensor.');
    if(cmd.choice!=='none'&&!p.options.some(o=>o.id===cmd.choice))throw Error('Defesa indisponível.');
    responses[b.id]=cmd.choice;
   }else{
    if(map.combat?.pendingAttack)throw Error('Aguardando a defesa do ataque anterior.');
    if(cmd.donoUid!==a.donoUid&&cmd.donoUid!==user().uid)throw Error('Você não controla este personagem.');
    if(map.combat?.activeId!==a.id)throw Error('Aguarde sua vez.');
    if(!Number.isFinite(cmd.createdAt)||Math.abs(Date.now()-cmd.createdAt)>30000)throw Error('O pedido expirou. Tente novamente.');
   }
   const luckActorId=!defense?a.id:(cmd.choice!=='none'?cmd.personagemId:null),luckLabel=defense?'teste de defesa':'teste de ataque',luckEligible=!!luckActorId&&!cmd.luckRerollOf,nextRevision=Number(health.revision||0)+1;
   const actorsWithLuck=base=>{const out=clean(base||{});clearLuckMarkers(out);if(luckEligible)markLuck(out,luckActorId,id,luckLabel);return out;};
   const prepareAreaCheckpoint=()=>{if(!luckEligible)return;areaCheckpoint={actorId:luckActorId,label:luckLabel,afterRevision:nextRevision,command:clean(cmd),health:clean(health),map:clean(map),history:clean(history),scene:null,positions:Object.fromEntries([a,...positions].map(t=>[t.id,clean(t)])),sheets:{},relatedCommands:defense?{[attackId]:clean(attackCmd)}:{}};};
   let next=null;
   for(const b of affected){
    if(Object.hasOwn(responses,b.id))continue;
    const preview=prepared.get(b.id)(a,b,health.actors||{},map,{phase:'preview',choice:null});
    if(preview.pending){next={...preview.pending,id:attackId,actorId:a.id,targetId:b.id,owner:b.donoUid,facing:Math.atan2((aim.y-a.y)*(Number(map.alturaM)||14)/14,(aim.x-a.x)*(Number(map.larguraM)||28)/28)};break;}
    responses[b.id]='none';
   }
   const area={shape,ids:affected.map(t=>t.id),responses};
   if(next){
    const message='Ataque em cone · aguardando defesa de '+positions.find(t=>t.id===next.targetId).nome+(cmd.luckRerollOf?' · 🍀 Rerrolagem de Sorte':'');
    const launch={id:attackId,ts:Date.now(),actorUid:a.donoUid,targetUid:aim.donoUid,source:{id:a.id,x:a.x,y:a.y},target:{id:aim.id,x:aim.x,y:aim.y},item:{nome:shape.name||'Eco da Matilha'},message,area:{...shape,source:{x:a.x,y:a.y},aim:{x:aim.x,y:aim.y},width:Number(map.larguraM)||28,height:Number(map.alturaM)||14}};
    prepareAreaCheckpoint();const markedActors=actorsWithLuck(health.actors||{});
    tx.set(HEALTH_PATH,clean({...health,actors:markedActors,...(!defense?{event:launch}:{}),pending:next,revision:nextRevision}));
    tx.set(MAP,{...map,combat:{...map.combat,pendingAttack:attackId}});
    tx.set(COMMANDS+'/'+attackId,clean({...attackCmd,area,status:'awaiting',message}));
    if(defense)tx.set(path,{...cmd,status:'done',message:'Defesa registrada · '+message});
    return;
   }
   const actors={...(health.actors||{})},events=[];
   const {pendingAttack,...unlocked}=map.combat;let combat=unlocked;
   for(const b of affected){
    // Todos usam a mesma rolagem de ataque e o mesmo saldo inicial de munição.
    const result=prepared.get(b.id)(a,b,health.actors||{},map,{phase:'resolve',choice:responses[b.id]||'none'});
    for(const [key,value]of Object.entries(result.actors||{}))actors[key]={...actors[key],...value};
    if(result.defenseSpent)combat=gastarDefesa(combat,b.id);
    events.push({...result.event,id:attackId+':'+b.id,ts:Date.now(),actorUid:a.donoUid,targetUid:b.donoUid,source:{id:a.id,x:a.x,y:a.y},target:{id:b.id,x:b.x,y:b.y}});
   }
   combat=acaoIniciativa(combat,'spend',combat.turnId);combat=removerMortos(combat,actors);
   const markedActors=actorsWithLuck(actors);prepareAreaCheckpoint();atualizarDuracoes(markedActors,combat);
   const event={...events[0],id:attackId,area:{...shape,source:{x:a.x,y:a.y},aim:{x:aim.x,y:aim.y},width:Number(map.larguraM)||28,height:Number(map.alturaM)||14},message:events.map(e=>e.message).join(' | ')+(cmd.luckRerollOf?' · 🍀 Rerrolagem de Sorte':'')};
   tx.set(HEALTH_PATH,clean({...health,actors:markedActors,event,pending:null,revision:nextRevision}));
   tx.set(HISTORY_PATH,clean({entries:[...(history.entries||[]),...events].slice(-120),revision:(history.revision||0)+1}));
   tx.set(MAP,{...map,combat});
   tx.set(COMMANDS+'/'+attackId,clean({...attackCmd,area,status:'done',message:event.message}));
   if(defense)tx.set(path,{...cmd,status:'done',message:event.message});
  });
  if(areaCheckpoint){pruneLuck(areaCheckpoint.actorId);luckCheckpoints.set(id,areaCheckpoint);}
 }
 stopHealth=database.subscribeDoc(HEALTH_PATH,value=>{if(!closed)onHealth(value||{actors:{},revision:0});},onError);
 if(user()?.master)stopCommands=database.subscribe(COMMANDS,rows=>{for(const row of rows)if(!row.removed&&['v56:direct-attack','v56:direct-defense','v56:direct-effects','direct-attack','direct-defense','direct-effects','direct-equipment','direct-extinguish','direct-inventory','direct-luck','direct-consciousness','direct-first-aid','direct-test','direct-psi','direct-psi-review','direct-stand'].includes(row.data.kind)&&row.data.status==='pending')process(row.id,row.data);},onError);
 const latido=instalarLatidoMesa({root:globalThis.document,uid:()=>user()?.uid||'',acordar:()=>{},aoComando:id=>{if(user()?.master&&!closed)void database.get(COMMANDS+'/'+id).then(cmd=>{if(cmd?.status==='pending')return process(id,cmd);}).catch(onError);}});
 async function send(payload){
  if(closed)throw Error('Sessão encerrada.');
  const commandId=crypto.randomUUID(),path=COMMANDS+'/'+commandId;
  return new Promise((resolve,reject)=>{
   let stop=null,finished=false,confirmed=false;
   const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);stop?.();waiters.delete(finish);error?reject(error):resolve(value);};
   // O setDoc pode ficar pendente sem rede. O prazo cobre envio E resposta;
   // esperar a escrita antes de armar o timer deixava o personagem bloqueado.
   const timer=setTimeout(()=>{
    const reason=confirmed?'Comando enviado, mas sem resposta do mestre. Mantenha aberta a aba do mestre.':'O banco não confirmou o envio. Verifique a conexão.';
    finish(Object.assign(Error(reason+' O resultado ainda é desconhecido; o comando pode ser processado depois. Confira o histórico antes de repetir. Referência: '+commandId),{code:'attack-timeout',commandId,outcomeUnknown:true}));
   },20000);waiters.add(finish);
   try{
    Promise.resolve(database.writeMap(path,{...payload,donoUid:user().uid,createdAt:Date.now(),status:'pending'})).then(()=>{
     if(finished)return;confirmed=true;latido.comando(commandId);
     // Um jogador só pode ler comandos seus que já existem. Assinar antes
     // de criar o documento podia causar permission-denied no banco real.
     // O snapshot inicial também entrega uma resposta que já tenha chegado.
     try{stop=database.subscribeDoc(path,cmd=>{if(['done','awaiting'].includes(cmd?.status))finish(null,cmd.message);else if(cmd?.status==='rejected')finish(Error(cmd.message));},error=>finish(error));if(finished)stop?.();}catch(error){finish(error);}
    },error=>finish(error));
   }catch(error){finish(error);}
  });
 }
 return {
  attack:({actorId,targetId,targetKind='character',skillId,weaponId,turnId,mapId})=>send({kind:'v56:direct-attack',personagemId:actorId,targetId,targetKind,skillId,weaponId,turnId:turnId||null,mapId:mapId||'',seed:crypto.getRandomValues(new Uint32Array(1))[0]}),
  support:({actorId,...payload})=>send({...payload,...(payload.kind==='direct-psi'&&payload.powerId==='grito_psiquico'&&payload.turnId?{kind:'v56:direct-attack'}:{}),personagemId:actorId,seed:crypto.getRandomValues(new Uint32Array(1))[0]}),
  chooseEffects:({attackId,actorId,effects,local})=>send({kind:'v56:direct-effects',attackId,personagemId:actorId,effects,local:local||''}),
  defend:({attackId,actorId,choice})=>send({kind:'v56:direct-defense',attackId,personagemId:actorId,choice}),
  equipment:payload=>send({...payload,kind:'direct-equipment'}),
  close(){closed=true;latido.parar();stopHealth?.();stopCommands?.();for(const finish of [...waiters])finish(Error('Sessão encerrada.'));}
 };
}
