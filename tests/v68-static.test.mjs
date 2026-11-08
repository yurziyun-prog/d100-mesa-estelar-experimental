import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('v68 compacta o painel superior do Mapa da Mesa',()=>{
  assert.match(app,/novaMapSetupV68/);
  assert.match(app,/Preparar \/ organizar mesa/);
  assert.match(app,/novaMapPrimaryV68/);
});
test('v68 oferece indicador explícito de sincronização',()=>{
  assert.match(app,/novaSyncPillV68/);
  assert.match(app,/Sincronizado/);
  assert.match(app,/Salvando/);
  assert.match(app,/Falha de sincronização/);
});
test('v68 usa cache-busting próprio',()=>{
  assert.match(html,/js\/app\.js\?v=[^"']+/);
});
