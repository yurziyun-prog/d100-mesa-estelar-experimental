import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v97 mestre pode revisar e aprovar qualquer PJ ainda não aprovado',()=>{
  assert.match(app,/const acaoMestreFicha=isMaster&&!meu&&tipo==='pc'/);
  assert.match(app,/Revisar e aprovar esta ficha/);
  assert.match(app,/diagnosticoCriacaoV97_/);
  assert.match(app,/Aprovar e bloquear a edição do jogador/);
  assert.match(app,/fichaAprovacaoForcada:!diag\.pronta/);
});

test('v97 mantém proteção contra aprovação acidental de ficha incompleta',()=>{
  assert.match(app,/if\(!diag\.pronta\)/);
  assert.match(app,/Fichas antigas podem não ter registrado corretamente/);
  assert.match(app,/if\(!ok\)return/);
});

test('v97 compacta botões dos cartões do mestre sem estourar o card',()=>{
  assert.match(html,/\.char-item-actions\.char-item-actions-review \{ display: grid/);
  assert.match(html,/grid-template-columns: minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(html,/\.btn-delete \{ grid-column: 1 \/ -1/);
  assert.match(app,/char-item-actions-review/);
});
