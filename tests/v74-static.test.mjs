import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('v74 adiciona serviços de NPC e mercado negro',()=>{
  assert.match(html,/dbNPCPrestadorServicos/);
  assert.match(html,/dbNPCComercioMercadoNegro/);
  assert.match(app,/contratarServicoCenarioV74_/);
  assert.match(app,/mercadoNegro/);
});
test('v74 amplia descrições na tabela de cenários',()=>{
  assert.match(app,/min-width:380px;max-width:500px/);
  assert.match(app,/table-layout:fixed/);
});
test('v74 mantém cache-busting do app',()=>{assert.match(html,/js\/app\.js\?v=[^"']+/);});
