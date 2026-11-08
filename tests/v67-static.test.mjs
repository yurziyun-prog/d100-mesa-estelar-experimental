import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v67 move as abas internas da ficha para a lateral do personagem',()=>{
  assert.match(app,/moverAbasFichaParaLateralV67_/);
  assert.match(app,/char-tabs-v67/);
  assert.match(app,/aside\.insertBefore\(tabs,botaoTrocar\)/);
});

test('v67 remove a foto duplicada do cabeçalho da aba Personagem',()=>{
  assert.match(app,/#char-personagem \.character-header > #charAvatar\{display:none!important;\}/);
});

test('cache-busting do app acompanha a versão atual',()=>{
  assert.match(html,/js\/app\.js\?v=[^"']+/);
});
