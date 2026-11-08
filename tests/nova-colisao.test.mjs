import {test} from 'node:test';
import assert from 'node:assert/strict';
import {destinoSemColisao,conterTokenNoMapa,linhaBloqueadaPorObjetos} from '../js/nova-colisao.js';
const actor={id:'a',x:2,y:5},other={id:'b',x:6,y:5};
test('para antes da miniatura mesmo apontando para além dela',()=>{
 const p=destinoSemColisao(actor,{x:20,y:5},[other]);assert.ok(p.x<5.01&&p.x>4.99,"para a 1 m (soma dos raios de dois corpos de 1 m), não a 1,4 m");assert.equal(p.y,5);
});
test('permite contornar e sair de sobreposição antiga',()=>{
 assert.deepEqual(destinoSemColisao(actor,{x:2,y:8},[other]),{x:2,y:8});
 const stuck={...actor,x:5};assert.equal(destinoSemColisao(stuck,{x:4,y:5},[other]).x,4);
 assert.equal(destinoSemColisao(stuck,{x:7,y:5},[other]).x,5);
});
test('usa escala do mapa e ignora a própria miniatura',()=>{
 assert.deepEqual(destinoSemColisao(actor,{x:20,y:5},[actor]),{x:20,y:5});
 const p=destinoSemColisao(actor,{x:20,y:5},[other],{larguraM:56,alturaM:28});assert.ok(p.x<5.51&&p.x>5.49);
});


test('borda usa o raio real da miniatura em vez de uma margem fixa maior',()=>{
 const normal={id:'a',x:2,y:2,diametroM:1};
 assert.deepEqual(conterTokenNoMapa(normal,{x:0,y:0},{larguraM:28,alturaM:14}),{x:.5,y:.5});
 assert.deepEqual(conterTokenNoMapa(normal,{x:28,y:14},{larguraM:28,alturaM:14}),{x:27.5,y:13.5});
 assert.deepEqual(conterTokenNoMapa(normal,{x:0,y:0},{larguraM:56,alturaM:28}),{x:.25,y:.25});
});

test('barreira sólida da camada 3 bloqueia linha reta de tiro, mas outras camadas e objetos não sólidos não',()=>{
 const a={id:'a',x:2,y:5,camada:3},b={id:'b',x:8,y:5,camada:3},map={larguraM:28,alturaM:14};
 const parede={id:'wall',x:5,y:5,larguraM:.5,alturaM:4,angulo:0,camada:3,bloqueiaMovimento:true};
 assert.equal(linhaBloqueadaPorObjetos(a,b,map,[parede]),true);
 assert.equal(linhaBloqueadaPorObjetos(a,b,map,[{...parede,camada:2}]),false);
 assert.equal(linhaBloqueadaPorObjetos(a,b,map,[{...parede,bloqueiaMovimento:false}]),false);
 assert.equal(linhaBloqueadaPorObjetos(a,b,map,[{...parede,destruido:true}]),false);
 assert.equal(linhaBloqueadaPorObjetos(a,b,map,[{...parede,y:9}]),false);
 assert.equal(linhaBloqueadaPorObjetos(a,b,map,[parede],{ignorarIds:['wall']}),false);
});

test('v205: dois corpos de 1 m passam um pelo outro num corredor largo (só o espaço do corpo bloqueia)',()=>{
 const a={id:'a',x:5,y:5,diametroM:1},b={id:'b',x:5,y:6.2,diametroM:1}; // 1,2 m de distância > 1 m (antes: travava abaixo de 1,4 m)
 const p=destinoSemColisao(a,{x:9,y:5},[b]);assert.equal(p.x,9,'passa ao lado sem ser bloqueado');
});
