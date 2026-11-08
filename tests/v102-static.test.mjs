import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=lerApp();
const direct=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('Cenário Atual e Mapa da Mesa ficam adjacentes',()=>{
  assert.match(html,/cenarioAtualTabBtn[\s\S]{0,240}syncLabTabBtn/);
});

test('barra principal usa ícones compactos e remove Preparar personagens visível',()=>{
  assert.doesNotMatch(html,/Preparar personagens/);
  assert.match(html,/novaSyncPullActiveV92[^>]*title="Trazer personagens ativos/);
  assert.match(html,/novaSyncStart[^>]*title="Iniciar combate"[^>]*>▶</);
  assert.match(app,/\.icon-btn-v102\{width:38px/);
  assert.match(direct,/Fora de combate · movimento livre · iniciativa ao começar/);
});

test('troca do mapa emite sincronização de cenário e pull grava ambos',()=>{
  assert.match(direct,/mesa-mapa-aberto-v102/);
  assert.match(app,/addEventListener\('mesa-mapa-aberto-v102'/);
  assert.match(app,/__mesaMoverEntidadeCenario_\?\.\(`char:\$\{ch\.id\}`/);
  assert.match(app,/personagem\(ns\) foram trazidos para/);
});

test('jogador sem localização usa último destino coletivo e não câmera do mestre',()=>{
  assert.match(direct,/const fallback=groupLocation\?\.\(\)\|\|\{\}/);
  assert.match(direct,/return String\(fallback\.mapaId\|\|''\)/);
  assert.match(app,/localizacoesMundoV90/);
  assert.match(app,/char\?\.localizacaoCenarioId\|\|v102GroupLocation_\?\.cenarioId/);
});

test('desenho colaborativo é por mapa e jogador, sincronizado e sem liberar edição do mapa',()=>{
  assert.match(html,/novaSyncSharedDrawTools/);
  assert.match(direct,/mapaDesenhos\/.*\/usuarios/);
  assert.match(direct,/saveMySharedDrawings/);
  assert.match(direct,/data-shared-ink-layer|sharedInkLayer/);
  assert.match(direct,/if\(!control\.closest\('#novaSyncSharedDrawTools'\)\)control\.disabled=true/);
  assert.match(rules,/match \/mapaDesenhos\/\{mapaId\}\/usuarios\/\{userId\}/);
  assert.match(rules,/ehDono\(userId\)/);
  assert.match(rules,/request\.resource\.data\.uid == request\.auth\.uid/);
});

test('Oficina do Mapa recebe barra compacta de ações',()=>{
  assert.match(direct,/nova-workshop-toolbar-v102/);
  assert.match(direct,/\['gm2publish','💾','Salvar mapa atual'\]/);
  assert.match(direct,/\['gm2delete75','🗑','Excluir mapa'\]/);
});


test('mestre pode inativar personagem sem apagar a ficha e grupo ignora inativos',()=>{
  assert.match(app,/personagemAtivoCampanhaV102_/);
  assert.match(app,/alternarPersonagemAtivoCampanhaV102_/);
  assert.match(app,/ativoNaCampanha:novo/);
  assert.match(app,/ids\.has\(String\(ch\.id\)\)&&personagemAtivoCampanhaV102_\(ch\)/);
  assert.match(rules,/ativoNaCampanha/);
});


test('personagens inativos têm filtro próprio e ação do mestre',()=>{
  assert.match(html,/option value="inativos">Inativos/);
  assert.match(app,/filtroPersonagensMestre_==='inativos'/);
  assert.match(app,/Marcar personagem como inativo/);
  assert.match(app,/Reativar personagem na campanha/);
});
