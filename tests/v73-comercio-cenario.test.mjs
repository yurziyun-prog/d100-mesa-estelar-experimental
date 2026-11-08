import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v73 cadastra NPC comerciante com estoque e barganha',()=>{
  assert.match(html,/dbNPCComerciante/);
  assert.match(html,/dbNPCComercioEstoque/);
  assert.match(html,/dbNPCComercioResistencia/);
  assert.match(app,/comercioNPCCfgV73_/);
  assert.match(app,/estoqueComercio/);
});

test('v73 publica comerciantes visíveis no Cenário Atual sem depender do mapa',()=>{
  assert.match(app,/comerciantesCenarioAtivoV73_/);
  assert.match(app,/interacoes=.*comerciantes/s);
  assert.match(app,/Interações do cenário/);
  assert.match(app,/abrirComercioCenarioV73_/);
});

test('v73 permite compra, venda e barganha no comerciante do cenário',()=>{
  assert.match(app,/rolarBarganhaCenarioV73_/);
  assert.match(app,/comprarComercianteCenarioV73_/);
  assert.match(app,/venderComercianteCenarioV73_/);
  assert.match(app,/comercioResultadoOpostoV73_/);
});

test('v73 permanece em build com cache-busting',()=>{
  assert.match(html,/js\/app\.js\?v=[^"']+/);
});
