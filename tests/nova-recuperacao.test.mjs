import test from 'node:test';import assert from 'node:assert/strict';
import {distanciaBordas,identificarKit,testeComSorte,registrarCura,bonusConsciencia,prepararSorte,resolverConsciencia} from '../js/nova-recuperacao.js';
import {iniciarIniciativa,removerMortos,acaoIniciativa} from '../js/nova-turnos.js';
import {resolverSocorros} from '../js/nova-suporte.js';
const a={id:'a',nome:'Herói',x:1,y:1,initiative:20,actions:3},b={id:'b',nome:'Besta Ululante',x:4.1,y:1,initiative:10,actions:2};
const st=()=>({hit:{Peito:-2},hitMax:{Peito:7},inconsciente:true});
const c=()=>iniciarIniciativa([a,b],'s',()=>1);
test('kits do cadastro em português/inglês são reconhecidos, sem confundir armas',()=>{
 for(const nome of ['Kit Médico Básico','Kit de Primeiros Socorros','Basic Medkit','First Aid Kit','Primeiros Socorros'])assert.ok(identificarKit({nome}));
 assert.ok(identificarKit({idBanco:'kit_medico_basico',nome:'基础医疗包'}));assert.equal(identificarKit({nome:'Pistola Laser'}),false);
});
test('socorros usa bordas da miniatura, escala do mapa e desconta uma carga',()=>{
 assert.ok(Math.abs(distanciaBordas(a,b)-1.4)<.001);assert.equal(distanciaBordas(a,a),0);assert.ok(distanciaBordas(a,b,{larguraM:56})>1.5);
 const args={a,b,map:{combat:c()},health:{actors:{}},cmd:{operation:'start',useKit:true},seed:1,info:{health:{},targetHealth:st(),firstAid:{value:60},kits:[{comp:'equipado',index:0,key:'kit:1',uses:5}],inventory:{equipado:[{nome:'First Aid Kit',usosRestantes:5}]}}};
 const out=resolverSocorros(args);assert.equal(out.inventory.equipado[0].usosRestantes,4);assert.ok(out.actors.a.treatment.withKit);
 assert.throws(()=>resolverSocorros({...args,b:{...b,x:4.3}}),/Fora de alcance/);
});
test('cura soma cinco por PV apenas nas rodadas seguintes, até despertar',()=>{
 const state={combateLab:st()},combat=c();registrarCura(state,2,combat);assert.equal(bonusConsciencia(state.combateLab,combat),0);
 combat.round=2;combat.roundId='s:2';assert.equal(bonusConsciencia(state.combateLab,combat),10);registrarCura(state,1,combat);combat.round=3;combat.roundId='s:3';assert.equal(bonusConsciencia(state.combateLab,combat),15);
 const out=resolverConsciencia({a,health:{actors:{a:state}},map:{combat},info:{resistanceById:{a:40}},roll:()=>50});assert.equal(out.actors.a.combateLab.inconsciente,false);assert.equal(out.actors.a.combateLab.curasConsciencia,undefined);assert.match(out.message,/40 \+ 15/);assert.equal(out.combat.actors.a.remaining,3);
});
test('inconsciente mantém iniciativa; falha avança e só pode testar uma vez por rodada',()=>{
 const combat=removerMortos(c(),{a:{combateLab:st()}});assert.deepEqual(combat.order,['a','b']);
 const out=resolverConsciencia({a,health:{actors:{a:{combateLab:st()}}},map:{combat},info:{resistanceById:{a:30}},roll:()=>80});assert.equal(out.combat.activeId,'b');assert.match(out.message,/continua inconsciente/);
 assert.throws(()=>resolverConsciencia({a,health:{actors:out.actors},map:{combat},info:{resistanceById:{a:30}},roll:()=>1}),/já foi realizado/);
 let next=out.combat;for(let n=0;n<10&&next.round===1;n++)next=acaoIniciativa(next,'spend',next.turnId);assert.equal(next.activeId,'a');assert.equal(next.round,2);
});
test('Sorte gasta 1 ponto e liga +50% da perícia para o próximo teste',()=>{
 const health={actors:{a:{combateLab:st()}}},info={luck:1},out=prepararSorte({a,health,info});
 assert.equal(out.actors.a.luckRemaining,0);assert.equal(out.sheetPatch.pontosSorte,0);assert.match(out.message,/\+50%/);assert.equal(out.actors.a.luckPrepared,true);
 assert.throws(()=>prepararSorte({a,health:{actors:out.actors},info}),/já está ativa|Sem pontos/);
 const actor={luckPrepared:true};const r=testeComSorte(actor,80,()=>100);assert.equal(r.grau,'Fiasco','00 continua Fiasco mesmo com Sorte');assert.equal(actor.luckPrepared,false,'a Sorte vale um teste só');
 const b={luckPrepared:true},ok=testeComSorte(b,60,()=>85);assert.equal(ok.valor,90);assert.equal(ok.sucesso,true,'85 passa com 90 (60 + 50%)');
});
