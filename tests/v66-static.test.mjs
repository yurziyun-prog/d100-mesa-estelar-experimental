import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v66 publica a nova versão do app',()=>{
  assert.match(html,/js\/app\.js\?v=[^"']+/);
  assert.match(app,/v66-navegacao-ficha/);
});

test('v66 preserva abas horizontais e cria contexto persistente de personagem',()=>{
  assert.match(app,/charWorkspaceV66/);
  assert.match(app,/charContextV66/);
  assert.match(app,/Trocar personagem/);
  assert.match(app,/#appScreen > \.tabs/);
  assert.match(app,/#characterSection > \.char-tabs/);
});

test('v66 não substitui os controles existentes da ficha',()=>{
  assert.match(html,/id="characterSection"/);
  assert.match(html,/class="char-tabs"/);
  assert.match(html,/id="charList"/);
});
