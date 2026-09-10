import {acaoIniciativa} from './nova-turnos.js?v=18';
export const HEALTH_PATH='combatesAtivos/mapaMesaSyncSaude';
const MAP='combatesAtivos/mapaMesaSyncDireta',POSITIONS=MAP+'/posicoes',COMMANDS=MAP+'/acoes';
export function conectarAtaques({database,user,tokens,prepare,onHealth,onError}){
 let stopHealth=null,stopCommands=null,closed=false;
 const running=new Set(),waiters=new Set();
 const clean=value=>JSON.parse(JSON.stringify(value));
 async function process(id,command){
  if(running.has(id)||closed||!user()?.master)return;running.add(id);
  const path=COMMANDS+'/'+id;
  try{
   const find=async id=>tokens().find(t=>t.id===id)||(await database.get(POSITIONS+'/'+id));
   const [actor,target]=await Promise.all([find(command.personagemId),find(command.targetId)]);
   if(!actor||!target)throw Error('Participante não encontrado.');
   const resolve=await prepare({...actor,id:command.personagemId},{...target,id:command.targetId},command);
   await database.transact(async tx=>{
    const cmd=await tx.get(path),map=await tx.get(MAP)||{},health=await tx.get(HEALTH_PATH)||{actors:{},revision:0};
    const a=await tx.get(POSITIONS+'/'+command.personagemId),b=await tx.get(POSITIONS+'/'+command.targetId);
    if(cmd?.status!=='pending')return;
    if(!a||!b||cmd.personagemId===cmd.targetId)throw Error('Alvo inválido.');
    if(cmd.donoUid!==a.donoUid&&!(cmd.donoUid===user().uid&&(!map.combat?.active||!a.donoUid)))throw Error('Você não controla este personagem.');
    if(!Number.isFinite(cmd.createdAt)||Math.abs(Date.now()-cmd.createdAt)>30000)throw Error('O pedido expirou. Tente o ataque novamente.');
    if((map.mapId||'')!==cmd.mapId||(map.combat?.active?map.combat.turnId:null)!==cmd.turnId)throw Error('O mapa ou a oportunidade mudou.');
    let combat=map.combat;
    if(combat?.active){if(combat.activeId!==cmd.personagemId)throw Error('Aguarde sua vez.');combat=acaoIniciativa(combat,'spend',cmd.turnId);}
    const result=resolve({...a,id:cmd.personagemId},{...b,id:cmd.targetId},health.actors||{},map);
    const event={...result.event,id,ts:Date.now(),source:{id:cmd.personagemId,x:a.x,y:a.y},target:{id:cmd.targetId,x:b.x,y:b.y}};
    tx.set(HEALTH_PATH,clean({actors:{...(health.actors||{}),...result.actors},revision:(health.revision||0)+1,event}));
    if(map.combat?.active)tx.set(MAP,{...map,combat});
    tx.set(path,{...cmd,status:'done',message:event.message});
   });
  }catch(e){
   try{await database.transact(async tx=>{const cmd=await tx.get(path);if(cmd?.status==='pending')tx.set(path,{...cmd,status:'rejected',message:e.message});});}catch(failure){onError(failure);}
  }finally{running.delete(id);}
 }
 stopHealth=database.subscribeDoc(HEALTH_PATH,value=>{if(!closed)onHealth(value||{actors:{},revision:0});},onError);
 if(user()?.master)stopCommands=database.subscribe(COMMANDS,rows=>{for(const row of rows)if(!row.removed&&row.data.kind==='direct-attack'&&row.data.status==='pending')process(row.id,row.data);},onError);
 return {
  async attack({actorId,targetId,skillId,weaponId,turnId,mapId}){
   const id=crypto.randomUUID(),path=COMMANDS+'/'+id;
   await database.writeMap(path,{kind:'direct-attack',donoUid:user().uid,personagemId:actorId,targetId,skillId,weaponId,turnId:turnId||null,mapId:mapId||'',createdAt:Date.now(),status:'pending'});
   return new Promise((resolve,reject)=>{
    let stop=null,finished=false;const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);stop?.();waiters.delete(finish);error?reject(error):resolve(value);};
    const timer=setTimeout(()=>finish(Error('Ataque aguardando conexão com o mestre. Mantenha a conta do mestre aberta.')),35000);
    waiters.add(finish);
    stop=database.subscribeDoc(path,cmd=>{if(cmd?.status==='done')finish(null,cmd.message);else if(cmd?.status==='rejected')finish(Error(cmd.message));},error=>finish(error));
    if(finished)stop?.();
   });
  },
  close(){closed=true;stopHealth?.();stopCommands?.();for(const finish of [...waiters])finish(Error('Sessão encerrada.'));}
 };
}
