import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {RODADA_S,intervaloAcaoMs} from '../js/mesa-tempo-real-ia.js';
const rt=readFileSync(new URL('../js/mesa-tempo-real.js',import.meta.url),'utf8');
test('v123: rodada de 5 s; 3 ações = um ataque a cada ~1,7 s',()=>{assert.equal(RODADA_S,5);assert.equal(intervaloAcaoMs(3),1667);});
test('v123: fila com prioridade, uma ação por criatura, cancelada ao pausar',()=>{
 assert.match(rt,/jobs\.sort\(\(a,b\)=>a\.prioridade-b\.prioridade\)/);
 assert.match(rt,/j\.ger!==geracao\|\|!estado\?\.ativo\|\|estado\.pausado/);
 assert.match(rt,/naFila\.has\(t\.id\)/);
 assert.match(rt,/\{prioridade:0\}/);
 assert.match(rt,/pausarLocal\(v\)/);
});
test('jogo contínuo: crítico resolve efeitos automaticamente sem pausa coletiva',()=>{
 assert.match(rt,/const perguntar=false/);
 assert.match(rt,/escolherEfeitos\(r\.effectsPending,rngDe\(info\.seed\)\)/);
});
