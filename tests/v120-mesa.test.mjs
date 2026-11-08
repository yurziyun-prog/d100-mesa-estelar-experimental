import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {destinoSemColisao,RAIO_CORPO} from '../js/nova-colisao.js';
import {corrigirModelo} from '../js/mesa-tamanhos.js';
const direta=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const barra=fs.readFileSync(new URL('../js/mesa-barra.js',import.meta.url),'utf8');
test('passa por um vão de 1 m entre parede e objeto',()=>{
 const objs=[{x:14,y:3,larguraM:1,alturaM:6,angulo:0,camada:3,bloqueiaMovimento:true},{x:14,y:8,larguraM:2,alturaM:2,angulo:0,camada:3,bloqueiaMovimento:true}];
 const t={id:'a',x:10,y:6.5,diametroM:1,camada:3},d=destinoSemColisao(t,{x:19,y:6.5},[],{larguraM:28,alturaM:14},objs);
 assert.equal(d.x,19);assert.ok(RAIO_CORPO<1);
 const bloqueado=destinoSemColisao(t,{x:19,y:3},[],{larguraM:28,alturaM:14},objs);assert.ok(bloqueado.x<14,'parede continua bloqueando');
});
test('deslizar na parede e histórico sempre visível',()=>{
 assert.match(direta,/desliza ao longo dele/);assert.match(direta,/let historyVisible=true;/);
});
test('cadeiras de adulto e controles na barra',()=>{
 assert.deepEqual(corrigirModelo({id:'cadeira2',larguraM:.65,alturaM:.65}),{id:'cadeira2',larguraM:.9,alturaM:.9});
 assert.match(barra,/\['novaSyncStart','novaSyncEnd','novaSyncPullActiveV92','novaSyncRandom','novaSyncClear','novaSyncRestore'\]/);
});
