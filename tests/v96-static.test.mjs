import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('v96 ficha completa vira pendente, não bloqueada automaticamente',()=>{
  assert.match(app,/fichaStatus:pronta\?'pendente':'rascunho'/);
  assert.match(app,/fichaAprovada:false/);
  assert.match(app,/Ficha completa enviada ao mestre para aprovação/);
  assert.doesNotMatch(app,/Criação concluída\. A ficha foi bloqueada/);
});

test('v96 mestre tem fila, aprovação e reabertura',()=>{
  assert.match(html,/option value="aprovacao">Aprovação pendente/);
  assert.match(app,/window\.aprovarFichaV96_/);
  assert.match(app,/window\.reabrirFichaV96_/);
  assert.match(app,/fichaStatus:'aprovada'/);
  assert.match(app,/fichaStatus:'reaberta'/);
});

test('v96 migra bloqueios automáticos antigos para aprovação pendente',()=>{
  assert.match(app,/migrarAprovacaoFichaV96_/);
  assert.match(app,/legadoConcluido\?'pendente':'rascunho'/);
  assert.match(app,/criacaoConcluida:false/);
});

test('v96 bloqueia estrutura aprovada mas permite fluxo explícito de XP',()=>{
  assert.match(rules,/alteracaoJogadorEmFichaAprovadaValida/);
  assert.match(rules,/changed\.hasAny\(\['pericias','especializacoes'\]\)/);
  assert.match(rules,/changed\.hasAny\(\['xpPendentes'\]\)/);
  assert.match(rules,/!resource\.data\.get\('fichaAprovada', false\)/);
});
