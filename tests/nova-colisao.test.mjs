import {test} from 'node:test';
import assert from 'node:assert/strict';
import {destinoSemColisao} from '../js/nova-colisao.js';
const actor={id:'a',x:2,y:5},other={id:'b',x:6,y:5};
test('para antes da miniatura mesmo apontando para além dela',()=>{
 const p=destinoSemColisao(actor,{x:20,y:5},[other]);assert.ok(p.x<4.6&&p.x>4.59);assert.equal(p.y,5);
});
test('permite contornar e sair de sobreposição antiga',()=>{
 assert.deepEqual(destinoSemColisao(actor,{x:2,y:8},[other]),{x:2,y:8});
 const stuck={...actor,x:5};assert.equal(destinoSemColisao(stuck,{x:4,y:5},[other]).x,4);
 assert.equal(destinoSemColisao(stuck,{x:7,y:5},[other]).x,5);
});
test('usa escala do mapa e ignora a própria miniatura',()=>{
 assert.deepEqual(destinoSemColisao(actor,{x:20,y:5},[actor]),{x:20,y:5});
 const p=destinoSemColisao(actor,{x:20,y:5},[other],{larguraM:56,alturaM:28});assert.ok(p.x<5.3&&p.x>5.29);
});
