import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('v75 separa salvar atual, salvar como novo e excluir na Oficina embutida',()=>{
  assert.match(app,/Salvar mapa atual/);
  assert.match(app,/Salvar como novo mapa/);
  assert.match(app,/gm2saveas75/);
  assert.match(app,/gm2delete75/);
  assert.match(app,/Alterações não salvas/);
});
test('v75 não usa o pequeno botão duplicado de salvar durante edição na mesa',()=>{
  assert.match(app,/tinySave\.hidden=true/);
});
test('v75 mantém cache-busting do app',()=>assert.match(html,/js\/app\.js\?v=[^"']+/));
