import test from 'node:test';import assert from 'node:assert/strict';
import {tipoArma,vozDaCriatura,raioNoSegundo} from '../js/mesa-efeitos.js';
test('v128: tipo de efeito pela arma',()=>{
 assert.equal(tipoArma('Granada de fragmentação'),'explosao');assert.equal(tipoArma('Lança-mísseis'),'explosao');
 assert.equal(tipoArma('Bastão de choque'),'raio');assert.equal(tipoArma('Pistola Laser'),'laser');assert.equal(tipoArma('Revólver'),'tiro');assert.equal(tipoArma('Mordida'),'');
});
test('v128: voz de cada criatura',()=>{
 assert.equal(vozDaCriatura('Besta Ululante'),'rugido');assert.equal(vozDaCriatura('Insetoide Predador'),'inseto');assert.equal(vozDaCriatura('Cadáver de trabalhador'),'gemido');
 assert.equal(vozDaCriatura('Serpente Sanguessuga'),'chiado');assert.equal(vozDaCriatura('Limo de esgoto'),'borbulho');assert.equal(vozDaCriatura('Vespa de Vidro'),'zumbido');assert.equal(vozDaCriatura('Galinha do Sérgio'),'ave');
});
test('v128: raios da tempestade iguais para todos (pelo relógio), ~1 a cada 7 s',()=>{
 let n=0;for(let s=1e9;s<1e9+11000;s++)if(raioNoSegundo(s))n++;assert.ok(n>1100&&n<2100,String(n));assert.equal(raioNoSegundo(123456),raioNoSegundo(123456));
});
