import test from 'node:test';import assert from 'node:assert/strict';
import {resolverSocorros,resolverPsi,ocupado,feridas,atualizarDuracoes} from '../js/nova-suporte.js';
import {iniciarIniciativa,acaoIniciativa} from '../js/nova-turnos.js';
const a={id:'a',nome:'Médico',x:1,y:1,actions:3,initiative:20},b={id:'b',nome:'Paciente',x:2,y:1,actions:3,initiative:10};
const vital={hit:{Peito:-2,Cabeça:3},hitMax:{Peito:7,Cabeça:3},inconsciente:true,infecciosoAtivo:true};
function base(){return {a,b,health:{actors:{a:{combateLab:{hit:{Peito:7},hitMax:{Peito:7}}},b:{combateLab:structuredClone(vital)}}},map:{combat:iniciarIniciativa([a,b],'s',()=>1)},cmd:{operation:'start',useKit:true},info:{firstAid:{value:100},health:{hit:{Peito:7},hitMax:{Peito:7}},targetHealth:structuredClone(vital),kits:[{comp:'mochila',index:0,uses:5}],inventory:{mochila:[{nome:'Kit médico',usosRestantes:5}]}},seed:1};}
function nextRound(c){let result=c;const round=c.round;for(let n=0;n<30&&result.round===round;n++)result=acaoIniciativa(result,'spend',result.turnId);return result;}
test('socorros: kit gasto uma vez; início não cura; exige próxima rodada; conclui e preserva infecção',()=>{
 const args=base(),first=resolverSocorros(args);assert.equal(first.inventory.mochila[0].usosRestantes,4);assert.equal(first.actors.b.combateLab.hit.Peito,-2);assert.equal(first.combat.actors.a.remaining,0);assert.ok(ocupado(first.actors.a,first.combat));
 const next={...args,health:{actors:first.actors},map:{combat:first.combat},cmd:{operation:'finish'}};assert.throws(()=>resolverSocorros(next),/próxima rodada/);
 next.map.combat=nextRound(first.combat);const done=resolverSocorros(next);assert.equal(done.inventory,null);assert.equal(done.actors.a.treatment,null);assert.equal(done.actors.b.combateLab.inconsciente,false);assert.equal(done.actors.b.combateLab.estabilizados.Peito,true);assert.equal(done.actors.b.combateLab.infecciosoAtivo,true);assert.ok(done.actors.b.combateLab.hit.Peito>-2);
});
test('continuação: +5 por turno, máximo três; sem kit metade da perícia',()=>{
 const args=base();args.cmd.useKit=false;let result=resolverSocorros(args);assert.equal(result.inventory,null);
 for(let n=2;n<=3;n++){args.map.combat=nextRound(result.combat);args.health.actors=result.actors;args.cmd={operation:'continue'};result=resolverSocorros(args);assert.equal(result.actors.a.treatment.turns,n);}
 args.map.combat=nextRound(result.combat);args.health.actors=result.actors;assert.throws(()=>resolverSocorros(args),/três turnos/);args.cmd={operation:'finish'};result=resolverSocorros(args);assert.match(result.message,/\/60/);
});
test('alvo, consciência, distância, várias partes e autotratamento',()=>{
 const args=base();args.b={...b,x:9};assert.throws(()=>resolverSocorros(args),/alcance/);args.b=b;
 args.health.actors.b.combateLab.hit.Cabeça=1;assert.equal(feridas(args.health.actors.b.combateLab).length,2);assert.throws(()=>resolverSocorros(args),/Escolha/);args.cmd.local='Peito';assert.ok(resolverSocorros(args));
 args.b=a;args.health.actors.a.combateLab.hit.Peito=4;assert.ok(resolverSocorros(args));args.health.actors.a.combateLab.inconsciente=true;assert.throws(()=>resolverSocorros(args),/consciente/);
});
test('psi valida treino, PP, cura por local, não cura infecção; repetição determinística',()=>{
 const args=base();args.info.powers=[{id:'cura_psi',name:'Cura',value:100,cost:1}];args.info.psiMax=10;args.info.psiSpent=0;args.positions=[a,b];args.cmd={id:'p',powerId:'cura_psi',cost:3};
 const result=resolverPsi(args);assert.equal(result.actors.b.combateLab.hit.Peito,1);assert.equal(result.actors.a.psiSpent,3);assert.equal(result.actors.b.combateLab.infecciosoAtivo,true);assert.deepEqual(result,resolverPsi(args));
 assert.throws(()=>resolverPsi({...args,cmd:{...args.cmd,cost:11}}),/PP/);assert.throws(()=>resolverPsi({...args,cmd:{...args.cmd,powerId:'inventado'}}),/treino/);
});
test('poder resistido produz teste por vítima e efeito expira; narrativa vai ao mestre',()=>{
 const args=base();args.info.powers=[{id:'atordoar_psi',name:'Atordoar',value:100,cost:2},{id:'telepatia',name:'Telepatia',value:100,cost:2}];args.info.psiMax=10;args.info.willById={b:0};args.positions=[a,b];args.cmd={id:'p',powerId:'atordoar_psi',cost:2};
 const result=resolverPsi(args);assert.match(result.message,/Vontade/);assert.equal(result.actors.b.psiEffects.atordoado.penalty,20);atualizarDuracoes(result.actors,{...result.combat,round:2});assert.equal(result.actors.b.psiEffects.atordoado,undefined);
 const narrative=resolverPsi({...args,cmd:{...args.cmd,powerId:'telepatia',text:'Socorro'}});assert.equal(narrative.psiRequests[0].text,'Socorro');assert.equal(narrative.psiRequests[0].status,'pending');
});
