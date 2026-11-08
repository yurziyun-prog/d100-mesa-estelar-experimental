import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v89 limita interação por perícia/dia e permite rerrolar com Sorte',()=>{
  assert.match(app,/cenarioInteracoesDiariasV89/);
  assert.match(app,/Esta perícia já foi testada nesta interação hoje/);
  assert.match(app,/Rerrolar/);
  assert.match(app,/rerrolagemSorte/);
  assert.match(app,/pontosSorteAtuais_/);
});

test('v89 aceita múltiplas perícias do banco',()=>{
  assert.match(app,/v77AcaoPericia/);
  assert.match(app,/multiple=true/);
  assert.match(app,/periciasDB/);
  assert.match(app,/join\(';\'/);
});

test('v89 registra interação no histórico geral/mestre',()=>{
  assert.match(app,/registrarHistoricoGeral_\('Teste'/);
  assert.match(app,/subtipo:'interacao_cenario'/);
});

test('v89 mantém imagem de carga contida e badge sobreposto',()=>{
  assert.match(app,/#inventoryShipSharedV85 \.inventory-slot\.v85-shared>img/);
  assert.match(app,/object-fit:contain!important/);
  assert.match(app,/right:3px!important;top:3px!important/);
});
