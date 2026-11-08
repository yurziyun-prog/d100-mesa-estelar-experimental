import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
test('v83 companion edit duplicate link robust',()=>{
  assert.match(app,/data-cv83-action="edit"/);
  assert.match(app,/duplicarCompanheiroBancoV83_/);
  assert.match(app,/carregarPersonagensV83_/);
  assert.match(app,/companheiroCharsV83_/);
});
test('v83 vehicle bank and owned instances',()=>{
  assert.match(app,/Banco de Veículos/);
  assert.match(app,/VEICULOS_POS_V83_/);
  assert.match(app,/Vincular veículo e tripulação/);
  assert.match(app,/cargaItens:\[\]/);
});
test('v83 firestore collections',()=>{
  assert.match(rules,/match \/veiculos\/\{documento\}/);
  assert.match(rules,/match \/veiculosPossuidos\/\{documento\}/);
});
