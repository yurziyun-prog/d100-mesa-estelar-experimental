import test from 'node:test';import assert from 'node:assert/strict';
import {resolverSocorros,resolverPsi,ocupado,feridas,atualizarDuracoes} from '../js/nova-suporte.js';
import {iniciarIniciativa,acaoIniciativa} from '../js/nova-turnos.js';
const a={id:'a',nome:'Médico',x:1,y:1,actions:3,initiative:20},b={id:'b',nome:'Paciente',x:2,y:1,actions:3,initiative:10};
const vital={hit:{Peito:-2,Cabeça:3},hitMax:{Peito:7,Cabeça:3},inconsciente:true,infecciosoAtivo:true};
function base(){return {a,b,health:{actors:{a:{combateLab:{hit:{Peito:7},hitMax:{Peito:7}}},b:{combateLab:structuredClone(vital)}}},map:{combat:iniciarIniciativa([a,b],'s',()=>1)},cmd:{operation:'start',useKit:true},info:{firstAid:{value:100},health:{hit:{Peito:7},hitMax:{Peito:7}},targetHealth:structuredClone(vital),kits:[{comp:'mochila',index:0,uses:5}],inventory:{mochila:[{nome:'Kit médico',usosRestantes:5}]}},seed:1};}
function nextRound(c){let result=c;const round=c.round;for(let n=0;n<30&&result.round===round;n++)result=acaoIniciativa(result,'spend',result.turnId);return result;}
function psiArgs(id,value=100){const args=base();args.b=a;args.positions=[{...a,imagem:'medico.png',revision:0},{...b,imagem:'paciente.png',revision:0}];args.a=args.positions[0];args.info.powers=[{id,name:id,value,cost:2}];args.info.psiMax=20;args.cmd={id:'psi',powerId:id,cost:2};args.scene={mapId:'map',objects:[{id:'tree',nome:'Árvore',imagem:'arvore.png',x:3,y:1,larguraM:2,alturaM:3}]};return args;}
test('Ilusão copia objeto em separado; Mimetismo altera só o usuário; mantém e encerra com PP',()=>{
 const args=psiArgs('ilusao');args.cmd.sourceId='tree';const out=resolverPsi(args);
 assert.equal(out.scene.objects.length,2);assert.equal(out.scene.objects[1].imagem,'arvore.png');assert.equal(out.scene.objects[1].pvMax,0);assert.equal(out.scene.psiZones,undefined);assert.equal(out.actors.a.psiEffects,undefined);
 atualizarDuracoes(out.actors,{...out.combat,round:2},out.scene);assert.equal(out.actors.a.psiSpent,4);
 atualizarDuracoes(out.actors,{...out.combat,round:2},out.scene);assert.equal(out.actors.a.psiSpent,4);
 out.actors.a.psiSpent=20;atualizarDuracoes(out.actors,{...out.combat,round:3},out.scene);assert.equal(out.scene.objects.length,1);
 const mimic=psiArgs('mimetismo_psi');mimic.cmd.sourceId='b';const m=resolverPsi(mimic);assert.equal(m.actors.a.psiEffects.mimetismo_psi.image,'paciente.png');assert.equal(m.actors.b.psiEffects,undefined);assert.equal(m.scene.objects.length,1);assert.equal(m.actors.a.psiEffects.mimetismo_psi.untilRound,11);
});
test('Guerreiro Zen devolve a ativação e bônus pela margem, sem perder última ação nem repetir na rodada',()=>{
 const args=psiArgs('fluxo_marcial');args.map.combat.actors=structuredClone(args.map.combat.actors);args.map.combat.actors.a.remaining=1;
 const out=resolverPsi(args);assert.equal(out.combat.activeId,'a');assert.equal(out.combat.round,1);assert.equal(out.combat.actors.a.remaining,4);assert.equal(out.psiRequests.length,0);
 assert.throws(()=>resolverPsi({...args,health:{actors:out.actors},map:{combat:out.combat}}),/já foi tentado/);
});
test('falha de poder gasta PP e ação sem efeito',()=>{
 const args=psiArgs('aceleracao',0),out=resolverPsi(args);assert.equal(out.combat.actors.a.remaining,2);assert.equal(out.actors.a.psiSpent,2);assert.equal(out.actors.a.psiEffects,undefined);assert.equal(out.psiRequests.length,0);
});
test('teletransporte produz posição persistível sem id interno ou dados de ficha',()=>{
 const args=psiArgs('teletransporte_caotico');args.positions=args.positions.map(({actions,initiative,...p})=>p);args.a=args.positions[0];const out=resolverPsi(args);
 assert.equal(out.moves.a.id,undefined);assert.equal(out.moves.a.teleportNonce,'psi');assert.equal(out.moves.a.revision,1);assert.ok(out.moves.a.x>=0&&out.moves.a.x<=28);assert.equal(out.combat.actors.a.remaining,2);
});
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

test('Grito fora de combate atinge só cone de oito metros e não remove PV',()=>{
 const args=psiArgs('grito_psiquico');args.b=args.positions[1];args.map.combat={active:false};args.positions.push({id:'longe',x:12,y:1,nome:'Longe'});args.info.resistanceById={b:0};args.info.dodgeById={b:0};
 const out=resolverPsi(args);assert.equal(out.actors.b.combateLab.hit.Peito,-2);assert.equal(out.actors.b.combateLab.caido,true);assert.ok(out.actors.b.combateLab.unconsciousClock);assert.equal(out.actors.longe,undefined);assert.equal(out.area.range,8);assert.equal(out.powerName,'grito_psiquico');
});
