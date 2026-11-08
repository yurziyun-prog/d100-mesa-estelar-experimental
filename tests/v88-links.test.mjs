import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('v88 remonta vínculos laterais',()=>{
  assert.match(app,/function remontarEntidadesLateraisV88_/);
  assert.match(app,/montarVeiculosPersonagemV83_/);
  assert.match(app,/montarNavesPersonagemV86_/);
  assert.match(app,/MutationObserver/);
});
test('v88 leitura de naves permite recuperar vínculos antigos',()=>{
  assert.match(rules,/match \/navesPossuidas\/\{documento\}[\s\S]*allow read: if autenticado\(\);/);
  assert.match(rules,/affectedKeys\(\)\.hasOnly\(\['cargaItens', 'atualizadoEm'\]\)/);
});