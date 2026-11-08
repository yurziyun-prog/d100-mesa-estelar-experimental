import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fatorDeCorrida,custoDoTick,VELOCIDADE_CORRIDA,LIMITE_SEM_FOLEGO} from '../js/mesa-correr.js';
test('correr: mais rápido, mas sem fôlego não corre',()=>{
 assert.equal(fatorDeCorrida(false,100),1);
 assert.equal(fatorDeCorrida(true,100),VELOCIDADE_CORRIDA);
 assert.equal(fatorDeCorrida(true,LIMITE_SEM_FOLEGO),1,'no limite já está sem fôlego');
});
test('correr: gasta fadiga só se andou; atacar (6) custa menos que correr alguns segundos',()=>{
 assert.equal(custoDoTick(true,0,500),0);
 assert.equal(custoDoTick(false,2,500),0);
 assert.equal(custoDoTick(true,2,500),3);
 assert.ok(custoDoTick(true,2,1000)*3>6,'3 s correndo gasta mais que um ataque');
});
