import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v91 grupo pode mover personagens e NPCs selecionados',()=>{
  assert.match(app,/v91-move-check/);
  assert.match(app,/Selecione pelo menos um personagem ou NPC presente/);
  assert.match(app,/selecionarPresentesV91_/);
});

test('v91 filtra destinos inexistentes e avisa o mestre',()=>{
  assert.match(app,/Este cenário aponta para destino\(s\) ainda não cadastrados/);
  assert.match(app,/Eles não serão oferecidos como viagem aos jogadores/);
  assert.match(app,/O destino apontado ainda não existe no Banco de Cenários/);
});

test('v91 mantém histórico de localização e permite voltar',()=>{
  assert.match(app,/localizacaoHistoricoV91/);
  assert.match(app,/voltarCenarioV91_/);
  assert.match(app,/localizacaoAnteriorCenarioId/);
});

test('v91 mostra cenário local completo e interações contextuais',()=>{
  assert.match(app,/htmlCenarioLocalCompletoV91_/);
  assert.match(app,/obterInteracoesContextuaisV91_/);
  assert.match(app,/descricaoJogadores/);
  assert.match(app,/personagensVisiveis/);
});
