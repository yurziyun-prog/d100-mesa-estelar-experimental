import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('v84 dynamic companion and vehicle dialogs use real modal overlay',()=>{
  assert.match(app,/modalCompanheiroBancoV82/);
  assert.match(app,/modalVincularCompanheiroV82/);
  assert.match(app,/modalVeiculoV83/);
  assert.match(app,/modal-overlay/);
  assert.doesNotMatch(app,/className='modal';/);
});
test('v84 companions expose edit duplicate and link through explicit listeners',()=>{
  assert.match(app,/data-cv84="edit"/);
  assert.match(app,/data-cv84="duplicate"/);
  assert.match(app,/data-cv84="link"/);
  assert.match(app,/host\.querySelectorAll\('button\[data-cv84\]'\)/);
});
test('v84 shared vehicle cargo exists in owned vehicle sheet',()=>{
  assert.match(app,/Carga compartilhada do veículo/);
  assert.match(app,/guardarNoVeiculoV84_/);
  assert.match(app,/retirarDoVeiculoV84_/);
  assert.match(app,/usuariosPermitidos/);
});
test('v84 linked players may only update shared cargo fields',()=>{
  assert.match(rules,/request\.auth\.uid in resource\.data\.usuariosPermitidos/);
  assert.match(rules,/hasOnly\(\['cargaItens', 'atualizadoEm'\]\)/);
});
test('v84 hides legacy hybrid personal inventory vehicle compartment',()=>{
  assert.match(app,/inv-veiculo/);
  assert.match(app,/option\[value="veiculo"\]/);
});
