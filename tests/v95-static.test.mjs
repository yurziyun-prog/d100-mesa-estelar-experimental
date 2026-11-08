import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v95 separa visualmente PJ PM e NPCs no editor de cenário',()=>{
  assert.match(html,/PJ \/ PM vinculados à cena/);
  assert.match(html,/NPCs do Banco vinculados à cena/);
  assert.match(html,/id="dbScenarioNPCsVinculados"/);
  assert.match(html,/id="dbScenarioNPCBusca"/);
  assert.match(app,/function npcsDisponiveisParaCenario_\(\)/);
  assert.match(app,/__cenarioId:`npcdb:\$\{n\.id\}`/);
});

test('v95 mantém vínculos NPC compatíveis com personagensCena legado',()=>{
  assert.match(app,/vinculosCenarioModal_=new Map/);
  assert.match(app,/function lerPersonagensVinculadosCenario_\(\)/);
  assert.match(app,/personagensCena:lerPersonagensVinculadosCenario_\(\)/);
  assert.match(app,/String\(id\)\.startsWith\('npcdb:'\)/);
});

test('v95 banco mostra apenas idioma ativo sem apagar traduções',()=>{
  assert.match(app,/function aplicarIdiomaCamposBanco_\(\)/);
  assert.match(app,/idCampoIdiomaBanco_/);
  assert.match(app,/valorIdiomaBanco_/);
  assert.match(app,/if\(userData\?\.role==='mestre'\)renderizarBancoDados\(\)/);
  assert.match(app,/nome_en:val\('dbScenarioNomeEn'\)/);
  assert.match(app,/descricao_en: val\('dbItemDescricaoEn'\)/);
});
