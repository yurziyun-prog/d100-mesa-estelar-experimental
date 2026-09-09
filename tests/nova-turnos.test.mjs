import test from 'node:test';
import assert from 'node:assert/strict';
import {moverNoTurno,saldoMovimento,iniciarIniciativa,acaoIniciativa} from '../js/nova-turnos.js';
const map={larguraM:56,alturaM:28,combat:{active:true,turnId:'one',activeId:'a'}};
const token={id:'a',x:5,y:5,acoesAtuaisLab:3};
test('distância diagonal usa a escala real, preservando pontos de ação',()=>{
 const moved=moverNoTurno(token,{x:8,y:9},map,'one');
 assert.ok(Math.abs(Math.hypot((moved.x-5)*2,(moved.y-5)*2)-6)<1e-9);
 assert.equal(moved.acoesAtuaisLab,3);
 assert.equal(saldoMovimento(moved,map.combat),0);
});
test('movimentos sucessivos somam o caminho, inclusive na volta',()=>{
 const first=moverNoTurno(token,{x:6,y:5},map,'one');
 const back=moverNoTurno(first,{x:5,y:5},map,'one');
 assert.equal(back.movementUsed,4);
 const last=moverNoTurno(back,{x:10,y:5},map,'one');
 assert.equal(last.x,6);
 assert.equal(last.movementUsed,6);
});
test('saldo persistido prevalece para outra aba e só renova no novo turno',()=>{
 const saved={...token,movementTurn:'one',movementUsed:5};
 assert.equal(moverNoTurno(saved,{x:10,y:5},map,'one').x,5.5);
 const next={...map,combat:{...map.combat,turnId:'two'}};
 assert.equal(saldoMovimento(saved,next.combat),6);
 assert.throws(()=>moverNoTurno(saved,{x:10,y:5},next,'one'));
 assert.throws(()=>moverNoTurno(saved,{x:10,y:5},{...map,combat:{active:false}},'one'));
});
test('personagem fora do turno não move; fora de combate não há limite',()=>{
 assert.throws(()=>moverNoTurno({...token,id:'b'},{x:10,y:5},map,'one'));
 assert.equal(moverNoTurno(token,{x:26,y:13},{},null).x,26);
});
const actors=[{id:'a',nome:'A',actions:2,initiative:20,donoUid:'a'},{id:'b',nome:'B',actions:3,initiative:10,donoUid:'b'}];
const step=(c,action)=>acaoIniciativa(c,action,c.turnId);
test('rola uma vez e ordena por total; empate usa iniciativa da ficha',()=>{
 let rolls=0;
 const c=iniciarIniciativa(actors,'session',()=>{rolls++;return 5;});
 assert.equal(rolls,2);assert.deepEqual(c.order,['a','b']);
 assert.equal(c.rolls.a.total,25);
 let next=step(step(step(step(c,'pass'),'pass'),'pass'),'pass');
 assert.equal(next.round,2);assert.deepEqual(next.rolls,c.rolls);assert.equal(rolls,2);
 const tied=iniciarIniciativa([{...actors[0],initiative:12},{...actors[1],initiative:10}],'s',(()=>{let n=0;return()=>[3,5][n++];})());
 assert.deepEqual(tied.order,['a','b']);
});
test('primeira passagem conserva ações; segunda encerra só o ator',()=>{
 let c=iniciarIniciativa(actors,'s',()=>1);
 c=step(c,'spend');assert.equal(c.activeId,'a');assert.equal(c.actors.a.remaining,1);
 c=step(c,'pass');assert.equal(c.activeId,'b');assert.equal(c.actors.a.remaining,1);
 c=step(c,'pass');assert.equal(c.activeId,'a');assert.equal(c.round,1);
 c=step(c,'pass');assert.equal(c.activeId,'b');assert.equal(c.round,1);
 assert.equal(c.actors.b.remaining,3);
 c=step(c,'spend');c=step(c,'spend');assert.equal(c.activeId,'b');
 c=step(c,'spend');assert.equal(c.round,2);assert.equal(c.activeId,'a');
 assert.equal(c.actors.a.remaining,2);assert.equal(c.actors.b.remaining,3);
});
test('movimento não renova na segunda oportunidade do mesmo turno',()=>{
 let c=iniciarIniciativa(actors,'s',()=>1);
 const moved=moverNoTurno(token,{x:7,y:5},{...map,combat:c},c.turnId);
 assert.equal(saldoMovimento(moved,c),2);
 c=step(step(c,'pass'),'pass');
 assert.equal(saldoMovimento(moved,c),2);
 c=step(step(c,'pass'),'pass');
 assert.equal(saldoMovimento(moved,c),6);
});
test('ação duplicada da mesma oportunidade é rejeitada',()=>{
 const c=iniciarIniciativa(actors,'s',()=>1),next=step(c,'spend');
 assert.throws(()=>acaoIniciativa(next,'spend',c.turnId));
});
test('três NPCs que passam uma vez voltam antes de renovar o turno',()=>{
 const npcs=[1,2,3].map(i=>({id:'npc'+i,nome:'NPC '+i,initiative:10-i,actions:3,donoUid:''}));
 let c=iniciarIniciativa(npcs,'npcs',()=>1);
 for(const id of c.order){assert.equal(c.activeId,id);c=step(c,'pass');assert.equal(c.round,1);}
 for(const id of c.order){assert.equal(c.activeId,id);assert.equal(c.actors[id].passes,1);assert.equal(c.actors[id].remaining,3);c=step(c,'pass');}
 assert.equal(c.round,2);
});
