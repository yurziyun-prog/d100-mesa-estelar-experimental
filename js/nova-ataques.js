import {acaoIniciativa,gastarDefesa,removerMortos} from './nova-turnos.js?v=36';
export const HEALTH_PATH='combatesAtivos/mapaMesaSyncSaude';
export const HISTORY_PATH='combatesAtivos/mapaMesaSyncHistorico';
const MAP='combatesAtivos/mapaMesaSyncDireta',POSITIONS=MAP+'/posicoes',COMMANDS=MAP+'/acoes';
export function conectarAtaques({database,user,tokens,prepare,prepareEquipment,onHealth,onError}){
 let stopHealth=null,stopCommands=null,closed=false;
 const running=new Set(),waiters=new Set(),clean=value=>JSON.parse(JSON.stringify(value));
 async function process(id,command){
  if(running.has(id)||closed||!user()?.master)return;running.add(id);
  const path=COMMANDS+'/'+id;
  try{
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
   const defense=command.kind==='direct-defense';
   const original=defense?await database.get(COMMANDS+'/'+command.attackId):command;
   if(!original)throw Error('Ataque não encontrado.');
   const find=async id=>tokens().find(t=>t.id===id)||(await database.get(POSITIONS+'/'+id));
   const [actor,target]=await Promise.all([find(original.personagemId),find(original.targetId)]);
   if(!actor||!target)throw Error('Participante não encontrado.');
   const resolve=await prepare({...actor,id:original.personagemId},{...target,id:original.targetId},original);
   await database.transact(async tx=>{
    // Firestore exige todas as leituras antes da primeira gravação.
    const cmd=await tx.get(path),map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{},revision:0};
    const history=await tx.get(HISTORY_PATH)||{entries:[]};
    const attackCmd=defense?await tx.get(COMMANDS+'/'+command.attackId):cmd;
    const a=await tx.get(POSITIONS+'/'+original.personagemId),b=await tx.get(POSITIONS+'/'+original.targetId);
    if(cmd?.status!=='pending')return;
    if(!a||!b||original.personagemId===original.targetId)throw Error('Alvo inválido.');
    if((map.mapId||'')!==original.mapId||(map.combat?.active?map.combat.turnId:null)!==original.turnId)throw Error('O mapa ou a oportunidade mudou.');
    const pending=health.pending;
    if(defense){
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
    const result=resolve({...a,id:original.personagemId},{...b,id:original.targetId},health.actors||{},map,{phase:defense?'resolve':'preview',choice:defense?cmd.choice:null});
    if(!defense&&result.pending){
     const next={...result.pending,id,actorId:original.personagemId,targetId:original.targetId,owner:b.donoUid};
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
    const event={...result.event,id:defense?command.attackId:id,ts:Date.now(),actorUid:a.donoUid,targetUid:b.donoUid,source:{id:original.personagemId,x:a.x,y:a.y},target:{id:original.targetId,x:b.x,y:b.y}};
    const actors={...(health.actors||{})};for(const [key,value]of Object.entries(result.actors||{}))actors[key]={...actors[key],...value};
    if(Number.isFinite(result.facing)&&map.combat?.active){
     tx.set(POSITIONS+'/'+original.personagemId,{...a,facing:result.facing,revision:Number(a.revision||0)+1});
    }
    tx.set(HEALTH_PATH,clean({actors,revision:(health.revision||0)+1,event,pending:null}));
    tx.set(HISTORY_PATH,clean({entries:[...(history.entries||[]),event].slice(-120),revision:(history.revision||0)+1}));
    if(map.combat?.active)tx.set(MAP,{...map,combat});
    tx.set(path,{...cmd,status:'done',message:event.message});
    if(defense)tx.set(COMMANDS+'/'+command.attackId,{...attackCmd,status:'done',message:event.message});
   });
  }catch(e){
   try{await database.transact(async tx=>{const cmd=await tx.get(path);if(cmd?.status==='pending')tx.set(path,{...cmd,status:'rejected',message:e.message});});}catch(failure){onError(failure);}
  }finally{running.delete(id);}
 }
 stopHealth=database.subscribeDoc(HEALTH_PATH,value=>{if(!closed)onHealth(value||{actors:{},revision:0});},onError);
 if(user()?.master)stopCommands=database.subscribe(COMMANDS,rows=>{for(const row of rows)if(!row.removed&&['direct-attack','direct-defense','direct-equipment'].includes(row.data.kind)&&row.data.status==='pending')process(row.id,row.data);},onError);
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
  defend:({attackId,actorId,choice})=>send({kind:'direct-defense',attackId,personagemId:actorId,choice}),
  equipment:payload=>send({...payload,kind:'direct-equipment'}),
  close(){closed=true;stopHealth?.();stopCommands?.();for(const finish of [...waiters])finish(Error('Sessão encerrada.'));}
 };
}
