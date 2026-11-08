import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v90 persiste localização em personagens e NPCs e reconcilia cenários',()=>{
  assert.match(app,/localizacaoCenarioId/);
  assert.match(app,/reconciliarCenariosLocalizacaoV90_/);
  assert.match(app,/migrarLocalizacoesLegadasV90_/);
  assert.match(app,/personagensCena/);
});

test('v90 publica somente catálogo público de cenários',()=>{
  assert.match(app,/cenariosPublicosV90/);
  assert.match(app,/descricaoJogadores/);
  assert.doesNotMatch(app,/cenariosPublicosV90[^\n]{0,400}descricaoGM/);
});

test('v90 oferece viagem por destinos cadastrados',()=>{
  assert.match(app,/viajarCenarioV90_/);
  assert.match(app,/(destinos disponíveis|🚶 Viagem)/i);
  assert.match(app,/Esse destino não está disponível(?: diretamente)? a partir daqui/);
});

test('v90 mestre move entidade e grupo',()=>{
  assert.match(app,/moverEntidadeParaCenarioV90_/);
  assert.match(app,/moverGrupoCenarioV90_/);
  assert.match(app,/Mover \+ ativar/);
});

test('v90 sincroniza mapa vinculado fora de combate',()=>{
  assert.match(app,/sincronizarMapaLocalizacaoV90_/);
  assert.match(app,/tokensGerenciados/);
  assert.match(app,/Encerre o combate antes de sincronizar/);
  assert.match(app,/mapaMesaSyncDireta/);
});
