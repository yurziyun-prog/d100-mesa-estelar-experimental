import test from 'node:test';
import assert from 'node:assert/strict';
import {conectarAtaques,HEALTH_PATH} from '../js/nova-ataques.js';
import {iniciarIniciativa} from '../js/nova-turnos.js';
import {resolverSocorros,resolverPsi} from '../js/nova-suporte.js';
import {defesasRestantes,acaoIniciativa,moverNoTurno,ataqueSuperaDefesa,removerMortos} from '../js/nova-turnos.js';
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',CMD=MAP+'/acoes';
const copy=v=>v===undefined?null:structuredClone(v);
function fixture({defense=false,area=false,support=false,special=false}={}){
 const rows=[{id:'a',nome:'Jogador',donoUid:'player',x:1,y:1,initiative:20,actions:2},{id:'b',nome:'NPC',donoUid:'',x:2.4,y:1,initiative:0,actions:2}];
 const store=new Map([[MAP,{mapId:'map',combat:iniciarIniciativa(rows,'session',()=>1)}],...rows.map(t=>[POS+'/'+t.id,t])]);
 const listeners=new Set();let lock=Promise.resolve();
 const emit=p=>{for(const l of [...listeners])if(l.doc?p===l.path:p.startsWith(l.path+'/'))l.fn(l.doc?copy(store.get(p)):[{id:p.split('/').pop(),data:copy(store.get(p))}]);};
 const subscribe=(path,fn,doc)=>{const l={path,fn,doc};listeners.add(l);if(doc)fn(copy(store.get(path)));else for(const [p,v]of store)if(p.startsWith(path+'/'))fn([{id:p.split('/').pop(),data:copy(v)}]);return()=>listeners.delete(l);};
 const database={get:async p=>copy(store.get(p)),subscribeDoc:(p,f)=>subscribe(p,f,true),subscribe:(p,f)=>subscribe(p,f,false),writeMap:async(p,v)=>{store.set(p,copy(v));emit(p);},transact:fn=>{
  const operation=lock.then(async()=>{const writes=[];const value=await fn({get:async p=>{assert.equal(writes.length,0,'Firestore não permite ler depois de gravar');return copy(store.get(p));},set:(p,v)=>writes.push([p,copy(v)])});for(const [p,v]of writes)store.set(p,v);for(const [p]of writes)emit(p);return value;});lock=operation.catch(()=>{});return operation;
 }};
 const healthMaster=[],healthPlayer=[],errors=[];let resolutions=0;
 const prepare=async()=>{
  const resolve=(a,b,health,map,decision)=>{if(Math.hypot(a.x-b.x,a.y-b.y)>(area?15:3))throw Error('Fora de alcance');if(defense&&decision.phase==='preview')return {pending:{remaining:2,options:[{id:'dodge',nome:'Esquiva',valor:60}]}};if(special&&!decision.effectsConfirmed)return {effectsPending:{type:'effects',options:[{id:'sangrar',nome:'Sangrar'}],locations:['Peito'],maxEffects:1}};resolutions++;return {defenseSpent:decision.choice==='dodge',actors:{[a.id]:{municaoLab:{charge:(health[a.id]?.municaoLab?.charge??10)-1}},[b.id]:{pv:(health[b.id]?.pv??10)-3}},event:{message:'3 de dano',damage:3}};};
  if(area)resolve.area={range:15,angle:60,centralPenalty:20};return resolve;
 };
 const options={database,tokens:()=>[...store.entries()].filter(([key])=>key.startsWith(POS+'/')).map(([key,t])=>({...t,id:key.split('/').pop()})),prepare,onError:e=>errors.push(e)};
 if(support){store.set('personagens/a',{inventario:{mochila:[{nome:'Kit médico',usosRestantes:5}]}});options.prepareSupport=async()=>({sheetPath:'personagens/a',resolve:args=>{
  const info={firstAid:{value:100},health:{hit:{Peito:7},hitMax:{Peito:7}},targetHealth:{hit:{Peito:-2},hitMax:{Peito:7},inconsciente:true},kits:[{comp:'mochila',index:0,uses:args.sheet.inventario.mochila[0].usosRestantes}],inventory:args.sheet.inventario,powers:[{id:'cura_psi',name:'Cura',value:100,cost:1}],psiMax:10};
  return args.cmd.kind==='direct-first-aid'?resolverSocorros({...args,info}):resolverPsi({...args,info});}});}
 const master=conectarAtaques({...options,user:()=>({uid:'gm',master:true}),onHealth:h=>healthMaster.push(h)});
 const player=conectarAtaques({...options,user:()=>({uid:'player',master:false}),onHealth:h=>healthPlayer.push(h)});
 const payload=()=>({actorId:'a',targetId:'b',skillId:'skill',weaponId:'bite',turnId:store.get(MAP).combat.turnId,mapId:'map'});
 return {store,emit,listeners,errors,master,player,payload,healthMaster,healthPlayer,resolutions:()=>resolutions,close(){master.close();player.close();}};
}

test('suporte entre mestre/jogador persiste etapa e kit, rejeita impostor e só cura na rodada seguinte',async()=>{
 const f=fixture({support:true});try{
  const payload={kind:'direct-first-aid',actorId:'a',targetId:'b',operation:'start',turnId:f.store.get(MAP).combat.turnId,useKit:true};
  await assert.rejects(f.player.support({...payload,actorId:'b'}),/controla/);
  await f.player.support(payload);assert.equal(f.store.get('personagens/a').inventario.mochila[0].usosRestantes,4);assert.equal(f.store.get(HEALTH_PATH).actors.a.treatment.local,'Peito');assert.equal(f.store.get(HEALTH_PATH).actors.b.combateLab.hit.Peito,-2);
  const command=[...f.store.keys()].filter(p=>p.startsWith(CMD+'/')).at(-1);f.emit(command);await new Promise(r=>setTimeout(r,5));assert.equal(f.store.get('personagens/a').inventario.mochila[0].usosRestantes,4);
  let map=f.store.get(MAP);while(map.combat.round===1)map.combat=acaoIniciativa(map.combat,'spend',map.combat.turnId);f.store.set(MAP,map);
  await f.player.support({...payload,operation:'finish',turnId:map.combat.turnId});assert.equal(f.store.get(HEALTH_PATH).actors.a.treatment,null);assert.equal(f.store.get(HEALTH_PATH).actors.b.combateLab.inconsciente,false);assert.ok(f.store.get(HEALTH_PATH).actors.b.combateLab.hit.Peito>-2);
 }finally{f.close();}
});
test('ataque do jogador resolvido uma vez pelo mestre, com dano e gasto atômicos',async()=>{
 const f=fixture();try{
  assert.equal(await f.player.attack(f.payload()),'3 de dano');
  assert.equal(f.store.get(HEALTH_PATH).actors.b.pv,7);
  assert.equal(f.store.get(MAP).combat.actors.a.remaining,1);
  const command=[...f.store.keys()].find(p=>p.startsWith(CMD+'/'));f.emit(command);f.emit(command);
  await new Promise(r=>setTimeout(r,10));assert.equal(f.resolutions(),1);
  assert.deepEqual(f.healthMaster.at(-1),f.healthPlayer.at(-1));
  await f.player.attack(f.payload());
  assert.equal(f.store.get(HEALTH_PATH).actors.b.pv,4);
  assert.equal(f.store.get(MAP).combat.activeId,'b');
  assert.deepEqual(f.errors,[]);
 }finally{f.close();}assert.equal(f.listeners.size,0);
});
test('alcance e controle inválidos não gastam Ação nem alteram PV',async()=>{
 const f=fixture();try{
  f.store.get(POS+'/b').x=20;
  await assert.rejects(f.player.attack(f.payload()),/Fora de alcance/);
  await assert.rejects(f.player.attack({...f.payload(),actorId:'b',targetId:'a'}),/não controla/);
  assert.equal(f.store.get(MAP).combat.actors.a.remaining,2);
  assert.equal(f.store.has(HEALTH_PATH),false);
  assert.equal(f.resolutions(),0);
 }finally{f.close();}
});
test('mestre assume PJ apenas fora do combate',async()=>{
 const context=fixture();try{
  await assert.rejects(context.master.attack(context.payload()),/não controla/);
  context.store.get(MAP).combat.active=false;
  assert.equal(await context.master.attack({...context.payload(),turnId:null}),'3 de dano');
  assert.equal(context.store.get(HEALTH_PATH).actors.b.pv,7);
 }finally{context.close();}
});

test('defesa pendente bloqueia avanço, pertence ao defensor e gasta reserva separada uma só vez',async()=>{
 const f=fixture({defense:true});try{
  assert.match(await f.player.attack(f.payload()),/aguardando defesa/);
  const pending=f.store.get(HEALTH_PATH).pending,c=f.store.get(MAP).combat;
  assert.equal(c.actors.a.remaining,2);
  assert.throws(()=>acaoIniciativa(c,'pass',c.turnId),/Aguardando/);
  assert.throws(()=>moverNoTurno({id:'a',x:1,y:1},{x:2,y:1},f.store.get(MAP),c.turnId),/Aguardando/);
  await assert.rejects(f.player.defend({attackId:pending.id,actorId:'b',choice:'dodge'}),/não controla/);
  await f.master.defend({attackId:pending.id,actorId:'b',choice:'dodge'});
  assert.equal(f.store.get(MAP).combat.actors.a.remaining,1);
  assert.equal(f.store.get(MAP).combat.actors.b.remaining,2);
  assert.equal(defesasRestantes(f.store.get(MAP).combat,'b'),1);
  await assert.rejects(f.master.defend({attackId:pending.id,actorId:'b',choice:'dodge'}),/oportunidade mudou|já foi resolvida/);
  assert.equal(f.resolutions(),1);
 }finally{f.close();}
});
test('cone inclui aliado, aguarda cada defesa e gasta somente uma ação e uma carga',async()=>{
 const f=fixture({area:true,defense:true});try{
  f.store.set(POS+'/c',{id:'c',nome:'Aliado',donoUid:'player',x:3,y:1.5,revision:0});
  f.store.set(POS+'/d',{id:'d',nome:'Fora',donoUid:'',x:1,y:8,revision:0});
  await f.player.attack(f.payload());
  const attackId=f.store.get(HEALTH_PATH).pending.id;
  assert.equal(f.store.get(HEALTH_PATH).pending.targetId,'b');
  await f.master.defend({attackId,actorId:'b',choice:'dodge'});
  assert.equal(f.store.get(HEALTH_PATH).pending.targetId,'c');
  await assert.rejects(f.master.defend({attackId,actorId:'b',choice:'dodge'}),/já foi resolvida/);
  await f.player.defend({attackId,actorId:'c',choice:'none'});
  const h=f.store.get(HEALTH_PATH);
  assert.equal(h.pending,null);assert.equal(h.actors.b.pv,7);assert.equal(h.actors.c.pv,7);assert.equal(h.actors.d,undefined);
  assert.equal(h.actors.a.municaoLab.charge,9);assert.equal(f.store.get(MAP).combat.actors.a.remaining,1);
  assert.equal(h.event.area.angle,60);assert.equal(h.event.area.range,15);
 }finally{f.close();}
});
test('ataque orienta a miniatura também ao gastar a última ação',async()=>{
 const f=fixture();try{
  f.store.get(POS+'/b').x=1;f.store.get(POS+'/b').y=2.4;
  await f.player.attack(f.payload());await new Promise(r=>setTimeout(r,10));
  assert.equal(f.store.get(POS+'/a').facing,Math.PI/2);
  f.store.get(POS+'/b').y=1;f.store.get(POS+'/b').x=2.4;
  await f.player.attack(f.payload());await new Promise(r=>setTimeout(r,10));
  assert.equal(f.store.get(POS+'/a').facing,0);assert.equal(f.store.get(MAP).combat.activeId,'b');
 }finally{f.close();}
});
test('margem, perícia e empate absoluto determinam oposição; mortos saem da renovação',()=>{
 assert.equal(ataqueSuperaDefesa({grau:'Sucesso',valor:60,die:20},{grau:'Sucesso',valor:80,die:70}),true);
 assert.equal(ataqueSuperaDefesa({grau:'Sucesso',valor:60,die:20},{grau:'Sucesso',valor:80,die:40}),false);
 assert.equal(ataqueSuperaDefesa({grau:'Sucesso',valor:60,die:20},{grau:'Sucesso',valor:60,die:20}),false);
 const f=fixture();try{const c=removerMortos(f.store.get(MAP).combat,{b:{combateLab:{morto:true}}});assert.deepEqual(c.order,['a']);assert.deepEqual(acaoIniciativa(acaoIniciativa(c,'pass',c.turnId),'pass',c.session+':1').queue,['a']);}finally{f.close();}
});

test('defesa, escolha de efeitos e dano formam uma única resolução com autoria e gasto único',async()=>{
 const f=fixture({defense:true,special:true});try{
  await f.player.attack(f.payload());let pending=f.store.get(HEALTH_PATH).pending;
  await f.master.defend({attackId:pending.id,actorId:'b',choice:'dodge'});
  pending=f.store.get(HEALTH_PATH).pending;assert.equal(pending.type,'effects');assert.equal(f.resolutions(),0);assert.equal(f.store.get(MAP).combat.actors.a.remaining,2);
  await assert.rejects(f.player.chooseEffects({attackId:pending.id,actorId:'b',effects:[],local:'Peito'}),/Somente/);
  await f.player.chooseEffects({attackId:pending.id,actorId:'a',effects:['sangrar'],local:'Peito'});
  assert.equal(f.resolutions(),1);assert.equal(f.store.get(HEALTH_PATH).pending,null);assert.equal(f.store.get(MAP).combat.actors.a.remaining,1);assert.equal(defesasRestantes(f.store.get(MAP).combat,'b'),1);
  await assert.rejects(f.player.chooseEffects({attackId:pending.id,actorId:'a',effects:[],local:'Peito'}),/já foi resolvida|mudou/);assert.equal(f.resolutions(),1);
 }finally{f.close();}
});
