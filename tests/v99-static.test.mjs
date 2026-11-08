import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const recovery=fs.readFileSync(new URL('../js/nova-recuperacao.js',import.meta.url),'utf8');
const panel=fs.readFileSync(new URL('../js/nova-painel.js',import.meta.url),'utf8');
const attacks=fs.readFileSync(new URL('../js/nova-ataques.js',import.meta.url),'utf8');

test('v99 Sorte não converte mais rolagem em sucesso automático',()=>{
  assert.match(recovery,/export function testeComSorte\(actor,value,roll\).*const die=roll\(100\)/s);
  assert.doesNotMatch(recovery,/luckPrepared\?\{die:/);
  assert.match(app,/O combate antigo não prepara sucesso automático/);
  assert.doesNotMatch(app,/Sorte preparada: o próximo teste não-Psi será um Sucesso normal/);
});

test('painel mostra a Sorte (+50% no próximo teste) e a deixa ativa',()=>{
  assert.match(panel,/luckPrepared/);
  assert.match(panel,/Sorte ativa · \+50%/);
  assert.match(panel,/o próximo teste que você fizer terá \+50% do valor da perícia/);
});

test('v99 restaura checkpoint e reproduz teste com nova semente',()=>{
  assert.match(attacks,/luckCheckpoints=new Map\(\)/);
  assert.match(attacks,/async function processLuckReroll/);
  assert.match(attacks,/luckRerollOf:lastId/);
  assert.match(attacks,/newSeed=crypto\.getRandomValues/);
  assert.match(attacks,/tx\.set\(HISTORY_PATH,clean\(checkpoint\.history\)\)/);
  assert.match(attacks,/Rerrolagem de Sorte/);
});

test('v99 regra publicada descreve substituição imediata do último teste',()=>{
  assert.match(app,/Gaste 1 ponto para rerrolar o último teste; a nova rolagem substitui a anterior/);
  assert.match(app,/Spend 1 point to reroll the most recent test; the new roll replaces the old result/);
});
