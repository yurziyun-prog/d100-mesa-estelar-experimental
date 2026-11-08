import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const direct=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('v94 mapa remoto do jogador não herda combate do mapa do mestre',()=>{
  assert.match(direct,/return \{\.\.\.\(shared\|\|\{\}\),mapId:String\(id\).*combat:\{active:false\}\};/s);
});

test('v94 movimento salva usando o mapa do próprio cliente',()=>{
  assert.match(direct,/const movementMapId=String\(mapPacket\?\.mapId\|\|''\)/);
  assert.match(direct,/const activeCombatHere=!!globalState\?\.combat\?\.active&&String\(globalState\?\.mapId\|\|''\)===movementMapId/);
  assert.match(direct,/const state=activeCombatHere\?globalState:localMap/);
  assert.match(direct,/archivePath\(movementMapId\)/);
  assert.match(direct,/String\(t\.mapaId\|\|''\)!==movementMapId/);
});

test('v94 regras limitam combate ao mapa onde ele ocorre',()=>{
  assert.match(rules,/let combatHere = c\.get\('active', false\) && previous\.get\('mapaId',''\) == map\.get\('mapId',''\)/);
  assert.match(rules,/return rt\.get\('pausaEmergencia', false\);/);
  assert.match(rules,/return !jogoEmPausaEmergencia\(\) && \(!combatHere \?/);
  assert.match(rules,/request\.resource\.data\.get\('mapaId',''\) == get\(\/databases\/\$\(database\)\/documents\/combatesAtivos\/mapaMesaSyncDireta\)\.data\.get\('mapId',''\)/);
});
