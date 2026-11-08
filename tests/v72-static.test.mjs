import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v72 adiciona resumo rápido do personagem na lateral',()=>{
  assert.match(app,/charQuickV72/);
  assert.match(app,/Fadiga/);
  assert.match(app,/resumoPVPersonagemV72_/);
  assert.match(app,/resumoPPPersonagemV72_/);
});

test('v72 reorganiza o Escudo do Mestre sem remover as subabas',()=>{
  assert.match(app,/#escudo \.gm-subtabs/);
  assert.match(app,/flex-direction:column/);
  assert.match(html,/gm-sub-campanha/);
  assert.match(html,/gm-sub-entidades/);
  assert.match(html,/gm-sub-cenario/);
});

test('v72 não contém as tentativas experimentais de inspeção v69-v71',()=>{
  assert.doesNotMatch(app,/v69-inspec/);
  assert.doesNotMatch(app,/v70-inspec/);
  assert.doesNotMatch(app,/v71-inspec/);
});

test('v72 usa cache-busting próprio',()=>{
  assert.match(html,/js\/app\.js\?v=[^"']+/);
});
