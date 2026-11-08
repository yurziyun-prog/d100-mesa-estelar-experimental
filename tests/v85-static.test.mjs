import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v85 has separate shared vehicle and future ship inventory blocks',()=>{
  assert.match(html,/id="inventoryVehicleSharedV85"/);
  assert.match(html,/id="inventoryShipSharedV85"/);
  assert.match(html,/id="inventoryVehicleSelectV85"/);
  assert.doesNotMatch(html,/<h4>🚗 Veículo\/Nave<\/h4>/);
});
test('v85 shared vehicle cargo supports drag both ways',()=>{
  assert.match(app,/soltarInventarioVeiculoV85_/);
  assert.match(app,/iniciarArrastoVeiculoV85_/);
  assert.match(app,/soltarVeiculoEmInventarioV85_/);
  assert.match(app,/entityType:'vehicle'/);
});
test('v85 vehicle links update live for other linked players',()=>{
  assert.match(app,/onSnapshot\(collection\(db,VEICULOS_POS_V83_\)/);
  assert.match(app,/iniciarVeiculosAoVivoV85_/);
  assert.match(app,/donoUidPersonagemV85_/);
});
test('v85 entity sidebar wraps and vehicle cards share site styling',()=>{
  assert.match(app,/#charVehiclesV83 \.cv82-link/);
  assert.match(app,/white-space:normal/);
  assert.match(app,/overflow-wrap:anywhere/);
});
test('v85 entity modal close is conspicuous red top-right control',()=>{
  assert.match(app,/\.entity-modal-v85 \.close/);
  assert.match(app,/background:#dc3545/);
  assert.match(app,/float:right/);
});
test('v85 owned vehicle sheet points cargo management to Inventory',()=>{
  assert.match(app,/Inventário → Veículo/);
  assert.match(app,/Modal de veículo fica enxuto; carga é administrada na aba Inventário/);
});
