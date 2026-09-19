import {acaoIniciativa,gastarDefesa,removerMortos} from './nova-turnos.js?v=46';
import {alvosNoCone} from './nova-area.js?v=20260918';
import {atualizarDuracoes} from './nova-suporte.js?v=46';
export const HEALTH_PATH='combatesAtivos/mapaMesaSyncSaude';
export const HISTORY_PATH='combatesAtivos/mapaMesaSyncHistorico';
const MAP='combatesAtivos/mapaMesaSyncDireta',POSITIONS=MAP+'/posicoes',COMMANDS=MAP+'/acoes';
export function conectarAtaques({database,user,tokens,prepare,prepareSupport,prepareEquipment,onHealth,onError}){
 let stopHealth=null,stopCommands=null,closed=false;
 const running=new Set(),waiters=new Set(),clean=value=>JSON.parse(JSON.stringify(value));
 async function orientAttack(original,expectedRevision){
  try{await database.transact(async tx=>{
   const map=await tx.get(MAP)||{},path=POSITIONS+'/'+original.personagemId,a=await tx.get(path),b=await tx.get(POSITIONS+'/'+original.targetId);
   if(!a||!b||(map.mapId||'')!==original.mapId)return;
   if(Number(a.revision||0)!==Number(expectedRevision||0))return;
   if(map.combat?.active&&original.turnId&&!original.turnId.startsWith(map.combat.session+':'))return;
   const facing=Math.atan2((b.y-a.y)*(Number(map.alturaM)||14)/14,(b.x-a.x)*(Number(map.larguraM)||28)/28);
   tx.set(path,{...a,facing,revision:Number(a.revision||0)+1});
  });}catch(e){onError(new Error('O ataque foi enviado, mas não foi possível salvar a direção: '+e.message));}
 }
 async function process(id,command){
  if(running.has(id)||closed||!user()?.master)return;running.add(id);
   const path=COMMANDS+'/'+id;
   try{
   if(['direct-inventory','direct-luck','direct-consciousness','direct-first-aid','direct-test','direct-psi','direct-psi-review','direct-stand'].includes(command.kind)){
    if(!prepareSupport)throw Error('Suporte indisponível.');
    const a0=await database.get(POSITIONS+'/'+command.personagemId),b0=await database.get(POSITIONS+'/'+command.targetId);
    if(!a0||!b0)throw Error('Participante não está no mapa.');
    const prepared=await prepareSupport({...a0,id:command.personagemId},{...b0,id:command.targetId},tokens());
    await database.transact(async tx=>{
     const cmd=await tx.get(path),map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{}},history=await tx.get(HISTORY_PATH)||{entries:[]};
     const scene=await tx.get('combatesAtivos/mapaMesaSyncDiretaCena');
     const sheet=prepared.sheetPath?await tx.get(prepared.sheetPath):null;
     const positions=await Promise.all(tokens().map(async t=>{const value=await tx.get(POSITIONS+'/'+t.id);return value?{...value,id:t.id}:null;}));
     const list=positions.filter(Boolean),a=list.find(t=>t.id===cmd?.personagemId),b=list.find(t=>t.id===cmd?.targetId);
     if(cmd?.status!=='pending')return;
     if(!a||!b)throw Error('Participante removido do mapa.');
     if(cmd.donoUid!==a.donoUid&&cmd.donoUid!==user().uid)throw Error('Você não controla este personagem.');
     if(cmd.kind==='direct-psi-review'&&cmd.donoUid!==user().uid)throw Error('Somente o mestre pode adjudicar.');
     if(!['direct-psi-review','direct-luck'].includes(cmd.kind)){
      if(map.combat?.pendingAttack)throw Error('Resolva a defesa pendente.');
      if((map.combat?.active?map.combat.turnId:null)!==cmd.turnId)throw Error('O turno mudou.');
      if(map.combat?.active&&(map.combat.activeId!==a.id||map.combat.actors[a.id]?.remaining<=0))throw Error('Aguarde seu turno com ações disponíveis.');
     }
     const result=prepared.resolve({a,b,health,map,cmd:{...cmd,id,time:Date.now()},sheet,scene,positions:list,seed:cmd.seed});
     atualizarDuracoes(result.actors,result.combat);
     const event={id,actorUid:(list.find(t=>t.id===result.eventActorId)||a).donoUid||'',targetUid:(list.find(t=>t.id===result.eventTargetId)||b).donoUid||'',ts:Date.now(),message:result.message};
     if(cmd.kind==='direct-psi')Object.assign(event,{source:{x:a.x,y:a.y},target:{x:b.x,y:b.y},item:{nome:result.powerName||'Poder psíquico'},hit:result.psiHit!==false,...(result.area?{area:result.area}:{})});
     tx.set(HEALTH_PATH,clean({...health,actors:result.actors||health.actors,psiRequests:result.psiRequests||health.psiRequests||[],event,revision:(health.revision||0)+1}));
     if(prepared.sheetPath&&(result.inventory||result.sheetPatch))tx.set(prepared.sheetPath,{...sheet,...result.sheetPatch,...(result.inventory?{inventario:result.inventory}:{})});
     if(result.scene)tx.set('combatesAtivos/mapaMesaSyncDiretaCena',clean(result.scene));
     for(const [key,value]of Object.entries(result.moves||{}))tx.set(POSITIONS+'/'+key,clean(value));
     if(result.combat)tx.set(MAP,clean({...map,combat:result.combat}));
     tx.set(HISTORY_PATH,clean({entries:[...(history.entries||[]),event].slice(-120),revision:(history.revision||0)+1}));
     tx.set(path,{...cmd,status:'done',message:result.message});
    });return;
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
     const state={...(health.actors?.[cmd.personagemId]||{}),...result.actor};
     tx.set(HEALTH_PATH,clean({...health,actors:{...health.actors,[cmd.personagemId]:state},revision:(health.revision||0)+1}));
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
   const [actor,target]=await Promise.all([find(original.personagemId),find(original.targetId)]);
   if(!actor||!target)throw Error('Participante não encontrado.');
   const resolve=await prepare({...actor,id:original.personagemId},{...target,id:original.targetId},original);
   if(resolve.area||original.area){await processArea(id,command,original,resolve.area||original.area.shape);if(!defense)await orientAttack(original,actor.revision);return;}
   await database.transact(async tx=>{
    // Firestore exige todas as leituras antes da primeira gravação.
    const cmd=await tx.get(path),map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{},revision:0};
    const history=await tx.get(HISTORY_PATH)||{entries:[]};
    const attackCmd=followup?await tx.get(COMMANDS+'/'+command.attackId):cmd;
    const a=await tx.get(POSITIONS+'/'+original.personagemId),b=await tx.get(POSITIONS+'/'+original.targetId);
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
     if(cmd.donoUid!==b.donoUid&&!(cmd.donoUid===user().uid&&!b.donoUid))throw Error('Você não controla o defensor.');
     if(cmd.personagemId!==original.targetId)throw Error('Defensor inválido.');
     if(cmd.choice!=='none'&&!pending.options.some(o=>o.id===cmd.choice))throw Error('Defesa indisponível.');
    }else{
     if(map.combat?.pendingAttack)throw Error('Aguardando a defesa do ataque anterior.');
     if(cmd.donoUid!==a.donoUid&&!(cmd.donoUid===user().uid&&(!map.combat?.active||!a.donoUid)))throw Error('Você não controla este personagem.');
     if(!Number.isFinite(cmd.createdAt)||Math.abs(Date.now()-cmd.createdAt)>30000)throw Error('O pedido expirou. Tente novamente.');
     if(map.combat?.active&&map.combat.activeId!==cmd.personagemId)throw Error('Aguarde sua vez.');
    }
    const result=resolve({...a,id:original.personagemId},{...b,id:original.targetId},health.actors||{},map,{phase:followup?'resolve':'preview',choice:defense?cmd.choice:effectChoice?attackCmd.defenseChoice:null,effectsConfirmed:effectChoice,effects:effectChoice?cmd.effects:[],local:effectChoice?cmd.local:''});
    if(result.effectsPending){
     const attackId=followup?command.attackId:id,message='Ataque acertou · aguardando escolhas de '+a.nome;
     tx.set(HEALTH_PATH,clean({...health,pending:{...result.effectsPending,id:attackId,actorId:original.personagemId,targetId:original.targetId,owner:a.donoUid},revision:(health.revision||0)+1}));
     tx.set(MAP,{...map,combat:{...map.combat,pendingAttack:attackId}});
     tx.set(COMMANDS+'/'+attackId,clean({...attackCmd,defenseChoice:defense?cmd.choice:'none',status:'awaiting',message}));
     if(followup)tx.set(path,{...cmd,status:'done',message});return;
    }
    if(!followup&&result.pending){
     const facing=Math.atan2((b.y-a.y)*(Number(map.alturaM)||14)/14,(b.x-a.x)*(Number(map.larguraM)||28)/28);
     const next={...result.pending,id,actorId:original.personagemId,targetId:original.targetId,owner:b.donoUid,facing};
     tx.set(HEALTH_PATH,clean({...health,pending:next,revision:(health.revision||0)+1}));
     tx.set(MAP,{...map,combat:{...map.combat,pendingAttack:id}});
     tx.set(path,{...cmd,status:'awaiting',message:'Ataque lançado · aguardando defesa de '+b.nome});
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
    const actors={...(health.actors||{})};for(const [key,value]of Object.entries(result.actors||{}))actors[key]={...actors[key],...value};
    atualizarDuracoes(actors,combat);
    tx.set(HEALTH_PATH,clean({...health,actors,revision:(health.revision||0)+1,event,pending:null}));
    tx.set(HISTORY_PATH,clean({entries:[...(history.entries||[]),event].slice(-120),revision:(history.revision||0)+1}));
    if(map.combat?.active)tx.set(MAP,{...map,combat});
    tx.set(path,{...cmd,status:'done',message:event.message});
    if(followup)tx.set(COMMANDS+'/'+command.attackId,{...attackCmd,status:'done',message:event.message});
   });
   if(!defense)await orientAttack(original,actor.revision);
  }catch(e){
   try{await database.transact(async tx=>{const cmd=await tx.get(path);if(cmd?.status==='pending')tx.set(path,{...cmd,status:'rejected',message:e.message});});}catch(failure){onError(failure);}
  }finally{running.delete(id);}
 }
 async function processArea(id,command,original,shape){
  const defense=command.kind==='direct-defense',attackId=defense?command.attackId:id;
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
   let next=null;
   for(const b of affected){
    if(Object.hasOwn(responses,b.id))continue;
    const preview=prepared.get(b.id)(a,b,health.actors||{},map,{phase:'preview',choice:null});
    if(preview.pending){next={...preview.pending,id:attackId,actorId:a.id,targetId:b.id,owner:b.donoUid,facing:Math.atan2((aim.y-a.y)*(Number(map.alturaM)||14)/14,(aim.x-a.x)*(Number(map.larguraM)||28)/28)};break;}
    responses[b.id]='none';
   }
   const area={shape,ids:affected.map(t=>t.id),responses};
   if(next){
    const message='Ataque em cone · aguardando defesa de '+positions.find(t=>t.id===next.targetId).nome;
    const launch={id:attackId,ts:Date.now(),actorUid:a.donoUid,targetUid:aim.donoUid,source:{id:a.id,x:a.x,y:a.y},target:{id:aim.id,x:aim.x,y:aim.y},item:{nome:shape.name||'Eco da Matilha'},message,area:{...shape,source:{x:a.x,y:a.y},aim:{x:aim.x,y:aim.y},width:Number(map.larguraM)||28,height:Number(map.alturaM)||14}};
    tx.set(HEALTH_PATH,clean({...health,...(!defense?{event:launch}:{}),pending:next,revision:(health.revision||0)+1}));
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
   atualizarDuracoes(actors,combat);
   const event={...events[0],id:attackId,area:{...shape,source:{x:a.x,y:a.y},aim:{x:aim.x,y:aim.y},width:Number(map.larguraM)||28,height:Number(map.alturaM)||14},message:events.map(e=>e.message).join(' | ')};
   tx.set(HEALTH_PATH,clean({...health,actors,event,pending:null,revision:(health.revision||0)+1}));
   tx.set(HISTORY_PATH,clean({entries:[...(history.entries||[]),...events].slice(-120),revision:(history.revision||0)+1}));
   tx.set(MAP,{...map,combat});
   tx.set(COMMANDS+'/'+attackId,clean({...attackCmd,area,status:'done',message:event.message}));
   if(defense)tx.set(path,{...cmd,status:'done',message:event.message});
  });
 }
 stopHealth=database.subscribeDoc(HEALTH_PATH,value=>{if(!closed)onHealth(value||{actors:{},revision:0});},onError);
 if(user()?.master)stopCommands=database.subscribe(COMMANDS,rows=>{for(const row of rows)if(!row.removed&&['direct-attack','direct-defense','direct-effects','direct-equipment','direct-inventory','direct-luck','direct-consciousness','direct-first-aid','direct-test','direct-psi','direct-psi-review','direct-stand'].includes(row.data.kind)&&row.data.status==='pending')process(row.id,row.data);},onError);
 async function send(payload){
  const path=COMMANDS+'/'+crypto.randomUUID();
  await database.writeMap(path,{...payload,donoUid:user().uid,createdAt:Date.now(),status:'pending'});
  return new Promise((resolve,reject)=>{
   let stop=null,finished=false;const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);stop?.();waiters.delete(finish);error?reject(error):resolve(value);};
   const timer=setTimeout(()=>finish(Error('Aguardando conexão com o mestre. Mantenha a conta do mestre aberta.')),35000);waiters.add(finish);
   stop=database.subscribeDoc(path,cmd=>{if(['done','awaiting'].includes(cmd?.status))finish(null,cmd.message);else if(cmd?.status==='rejected')finish(Error(cmd.message));},error=>finish(error));if(finished)stop?.();
  });
 }
 return {
  attack:({actorId,targetId,skillId,weaponId,turnId,mapId})=>send({kind:'direct-attack',personagemId:actorId,targetId,skillId,weaponId,turnId:turnId||null,mapId:mapId||'',seed:crypto.getRandomValues(new Uint32Array(1))[0]}),
  support:({actorId,...payload})=>send({...payload,...(payload.kind==='direct-psi'&&payload.powerId==='grito_psiquico'&&payload.turnId?{kind:'direct-attack'}:{}),personagemId:actorId,seed:crypto.getRandomValues(new Uint32Array(1))[0]}),
  chooseEffects:({attackId,actorId,effects,local})=>send({kind:'direct-effects',attackId,personagemId:actorId,effects,local:local||''}),
  defend:({attackId,actorId,choice})=>send({kind:'direct-defense',attackId,personagemId:actorId,choice}),
  equipment:payload=>send({...payload,kind:'direct-equipment'}),
  close(){closed=true;stopHealth?.();stopCommands?.();for(const finish of [...waiters])finish(Error('Sessão encerrada.'));}
 };
}
