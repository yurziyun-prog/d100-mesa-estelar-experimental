import test from 'node:test';
import assert from 'node:assert/strict';
import {aplicarEdicoes,formaMesa} from '../js/nova-editor-estado.js';
test('salvar preserva dano, fogo e efeitos recebidos durante a edição',()=>{
 const scene={objects:[{id:'wall',x:1,y:2,pvAtual:3,pegandoFogo:true},{id:'spell',clock:{remaining:42}}],psiZones:[{id:'dark'}]};
 const next=aplicarEdicoes(scene,[{kind:'object',id:'wall',dx:2,dy:1},{kind:'properties',id:'wall',properties:{camada:3}}]);
 assert.equal(next.objects[0].pvAtual,3);assert.equal(next.objects[0].pegandoFogo,true);assert.equal(next.objects[0].x,3);assert.deepEqual(next.objects[1],scene.objects[1]);assert.deepEqual(next.psiZones,scene.psiZones);assert.equal(scene.objects[0].x,1);
});
test('remover elemento nativo, objeto e traço não remove vizinhos',()=>{
 const next=aplicarEdicoes({objects:[{id:'a'},{id:'b'}],strokes:[{id:'s'},{id:'t'}]},[{kind:'remove',id:'a'},{kind:'hide',id:'native'},{kind:'removeStroke',id:'s'}]);assert.deepEqual(next.objects,[{id:'b'}]);assert.deepEqual(next.strokes,[{id:'t'}]);assert.deepEqual(next.hiddenElements,['native']);
});
test('retângulo guarda dimensões métricas e camada de colisão',()=>{
 const o=formaMesa('rect',{x:1,y:1},{x:4,y:3},{larguraM:56,alturaM:28},{camada:3,bloqueiaMovimento:true});assert.equal(o.larguraM,6);assert.equal(o.alturaM,4);assert.equal(o.x,2.5);assert.equal(o.bloqueiaMovimento,true);
});
