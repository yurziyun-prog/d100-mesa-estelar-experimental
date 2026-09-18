import test from 'node:test';
import assert from 'node:assert/strict';
import {alvosNoCone} from '../js/nova-area.js';
import {tipoEfeito} from '../js/nova-fx.js';
test('cone métrico exclui retaguarda e fora do alcance; inclui as duas bordas',()=>{
 const a={id:'a',x:1,y:1},b={id:'b',x:5,y:1},theta=Math.PI/6;
 const tokens=[a,b,{id:'edge',x:1+Math.cos(theta)*10,y:1+Math.sin(theta)*10},{id:'back',x:0,y:1},{id:'far',x:17,y:1},{id:'side',x:2,y:5}];
 assert.deepEqual(alvosNoCone(a,b,tokens,{}).map(t=>t.id),['b','edge']);
 assert.deepEqual(alvosNoCone(a,b,tokens,{larguraM:112}).map(t=>t.id),[]);
});
test('ataques naturais e phaser têm efeitos distintos',()=>{
 assert.deepEqual(['Mordida da Serpente','Eco da Matilha','Patada/Pisotear','Cauda','Phaser','Pistola Laser','Blaster'].map(nome=>tipoEfeito({nome})),['bite','sonic','stomp','tail','phaser','laser','blaster']);
});
