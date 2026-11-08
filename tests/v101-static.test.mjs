import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v101 inclui Avaliação entre perícias de negociação',()=>{
  assert.match(app,/\['comercio','avaliacao','influencia','submundo'\]/);
});

test('v101 separa objetivo de compra e venda com NPC comerciante',()=>{
  assert.match(app,/cenarioComercioObjetivoV101/);
  assert.match(app,/Comprar mais barato/);
  assert.match(app,/Vender mais caro/);
});

test('v101 persiste modificadores da negociação diária',()=>{
  assert.match(app,/status\.modificadores=\{\.\.\.estado\}/);
  assert.match(app,/st\?\.modificadores/);
});
