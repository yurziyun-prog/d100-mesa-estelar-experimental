import test from 'node:test';
import assert from 'node:assert/strict';
import {moverNoTurno,saldoMovimento} from '../js/nova-turnos.js';
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
