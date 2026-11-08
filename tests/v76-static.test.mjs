import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('v76 adiciona interações genéricas ao Cenário Atual',()=>{
  assert.match(html,/dbScenarioInteracoesV76/);
  assert.match(app,/executarInteracaoCenarioV76_/);
  assert.match(app,/cenarioDescobertas/);
  assert.match(app,/Interações do cenário/);
});
test('v76 compacta resumo lateral e remove inglês dos rótulos PT de fadiga',()=>{
  assert.match(app,/PV \$\{pv\.texto\}/);
  assert.match(app,/Ofegante'/);
  assert.doesNotMatch(app,/fatWinded:'Ofegante \(Winded\)'/);
});
test('v76 mantém ações do banco de cenários empilhadas',()=>{
  assert.match(app,/td\.actions \.btn-small/);
  assert.match(app,/width:100%!important/);
});
test('v76 mantém cache-busting do app',()=>assert.match(html,/js\/app\.js\?v=[^"']+/));
