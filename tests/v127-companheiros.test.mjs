import test from 'node:test';import assert from 'node:assert/strict';
import {donoPeloNome,pareceCompanheiro,pontoAtras} from '../js/mesa-companheiros.js';
import {faccaoPadrao} from '../js/mesa-tempo-real-ia.js';
test('v127: dono pelo nome e modelo de companheiro',()=>{
 const pjs=[{id:'pj4',nome:'Sérgio Leone'},{id:'pj3',nome:'Kibi'}];
 assert.equal(donoPeloNome('Monstro · Galinha do Sérgio',pjs).id,'pj4');assert.equal(donoPeloNome('Lobo da Kibi',pjs).id,'pj3');
 assert.equal(donoPeloNome('Guarda do Palácio',pjs),null);
 assert.ok(pareceCompanheiro({especie:'Galinha (companheira)'}));assert.ok(!pareceCompanheiro({especie:'Canídeo selvagem'}));
});
test('v127: fica atrás do dono; companheiro é do grupo no tempo real',()=>{
 const p=pontoAtras({x:14,y:7,facing:0},28,14,1);assert.ok(Math.abs(p.x-13)<1e-9&&Math.abs(p.y-7)<1e-9);
 globalThis.mesaCompanheiros={ehCompanheiro:id=>id==='c1'};
 assert.equal(faccaoPadrao({id:'c1'}),'grupo');assert.equal(faccaoPadrao({id:'synccriatura:x'}),'inimigos');
 delete globalThis.mesaCompanheiros;
});
