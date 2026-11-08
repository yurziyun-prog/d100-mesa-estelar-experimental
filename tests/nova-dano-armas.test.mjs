import test from 'node:test';
import assert from 'node:assert/strict';
import {aplicarDanoArma} from '../js/nova-dano-armas.js';

test('Danificar Arma absorve o golpe na arma e só transfere o excesso',()=>{
 const r=aplicarDanoArma({nome:'Pistola',pv:4,pvAtual:3,pa:1},6,{agora:'agora'});
 assert.equal(r.estrutural,5);assert.equal(r.aplicado,3);assert.equal(r.excesso,2);
 assert.equal(r.item.pvAtual,0);assert.equal(r.item.inutilizavel,true);assert.equal(r.item.quebradoEm,'agora');
});

test('Danificar Arma não causa excesso enquanto restarem PV estruturais',()=>{
 const r=aplicarDanoArma({pv:8,pvAtual:8,pa:2},5);
 assert.equal(r.aplicado,3);assert.equal(r.excesso,0);assert.equal(r.item.pvAtual,5);
});
