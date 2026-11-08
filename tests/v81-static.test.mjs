import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const direct=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const app=lerApp();

test('v81 adiciona modo foco e controle de histórico da Mesa',()=>{
  assert.match(html,/id="novaSyncFocus"/);
  assert.match(html,/id="novaSyncHistoryToggle"/);
  assert.match(html,/nova-map-focus/);
  assert.match(direct,/mesa:novaSyncMapFocus/);
  assert.match(direct,/mesa:novaSyncHistoryVisible/);
});

test('v81 torna histórico visualmente classificável sem alterar mensagem',()=>{
  assert.match(direct,/nova-history-row/);
  assert.match(direct,/nova-history-success/);
  assert.match(direct,/nova-history-failure/);
  assert.match(direct,/nova-history-critical/);
  assert.match(direct,/nova-history-damage/);
  assert.match(direct,/nova-history-psi/);
});
