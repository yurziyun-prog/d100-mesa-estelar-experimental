import test from 'node:test';
import assert from 'node:assert/strict';
import {conectarAtaques,HEALTH_PATH} from '../js/nova-ataques.js';
import {iniciarIniciativa} from '../js/nova-turnos.js';
import {defesasRestantes,acaoIniciativa,moverNoTurno,ataqueSuperaDefesa,removerMortos} from '../js/nova-turnos.js';
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',CMD=MAP+'/acoes';
const copy=v=>v===undefined?null:structuredClone(v);
function fixture({defense=false}={}){
 const rows=[{id:'a',nome:'Jogador',donoUid:'player',x:1,y:1,initiative:20,actions:2},{id:'b',nome:'NPC',donoUid:'',x:2.4,y:1,initiative:0,actions:2}];
 const store=new Map([[MAP,{mapId:'map',combat:iniciarIniciativa(rows,'session',()=>1)}],...rows.map(t=>[POS+'/'+t.id,t])]);
 const listeners=new Set();let lock=Promise.resolve();
 const emit=p=>{for(const l of [...listeners])if(l.doc?p===l.path:p.startsWith(l.path+'/'))l.fn(l.doc?copy(store.get(p)):[{id:p.split('/').pop(),data:copy(store.get(p))}]);};
 const subscribe=(path,fn,doc)=>{const l={path,fn,doc};listeners.add(l);if(doc)fn(copy(store.get(path)));else for(const [p,v]of store)if(p.startsWith(path+'/'))fn([{id:p.split('/').pop(),data:copy(v)}]);return()=>listeners.delete(l);};
 const database={get:async p=>copy(store.get(p)),subscribeDoc:(p,f)=>subscribe(p,f,true),subscribe:(p,f)=>subscribe(p,f,false),writeMap:async(p,v)=>{store.set(p,copy(v));emit(p);},transact:fn=>{
  const operation=lock.then(async()=>{const writes=[];const value=await fn({get:async p=>{assert.equal(writes.length,0,'Firestore não permite ler depois de gravar');return copy(store.get(p));},set:(p,v)=>writes.push([p,copy(v)])});for(const [p,v]of writes)store.set(p,v);for(const [p]of writes)emit(p);return value;});lock=operation.catch(()=>{});return operation;
 }};
 const healthMaster=[],healthPlayer=[],errors=[];let resolutions=0;
 const prepare=async()=> (a,b,health,map,decision)=>{if(Math.hypot(a.x-b.x,a.y-b.y)>3)throw Error('Fora de alcance');if(defense&&decision.phase==='preview')return {pending:{remaining:2,options:[{id:'dodge',nome:'Esquiva',valor:60}]}};resolutions++;return {defenseSpent:decision.choice==='dodge',actors:{[b.id]:{pv:(health[b.id]?.pv??10)-3}},event:{message:'3 de dano',damage:3}};};
 const options={database,tokens:()=>[],prepare,onError:e=>errors.push(e)};
 const master=conectarAtaques({...options,user:()=>({uid:'gm',master:true}),onHealth:h=>healthMaster.push(h)});
 const player=conectarAtaques({...options,user:()=>({uid:'player',master:false}),onHealth:h=>healthPlayer.push(h)});
 const payload=()=>({actorId:'a',targetId:'b',skillId:'skill',weaponId:'bite',turnId:store.get(MAP).combat.turnId,mapId:'map'});
 return {store,emit,listeners,errors,master,player,payload,healthMaster,healthPlayer,resolutions:()=>resolutions,close(){master.close();player.close();}};
}
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
test('margem, perícia e empate absoluto determinam oposição; mortos saem da renovação',()=>{
 assert.equal(ataqueSuperaDefesa({grau:'Sucesso',valor:60,die:20},{grau:'Sucesso',valor:80,die:70}),true);
 assert.equal(ataqueSuperaDefesa({grau:'Sucesso',valor:60,die:20},{grau:'Sucesso',valor:80,die:40}),false);
 assert.equal(ataqueSuperaDefesa({grau:'Sucesso',valor:60,die:20},{grau:'Sucesso',valor:60,die:20}),false);
 const f=fixture();try{const c=removerMortos(f.store.get(MAP).combat,{b:{combateLab:{morto:true}}});assert.deepEqual(c.order,['a']);assert.deepEqual(acaoIniciativa(acaoIniciativa(c,'pass',c.turnId),'pass',c.session+':1').queue,['a']);}finally{f.close();}
});
