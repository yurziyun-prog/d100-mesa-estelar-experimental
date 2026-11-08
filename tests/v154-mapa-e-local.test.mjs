import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {lerApp} from './_app.mjs';
const app=lerApp();
test('v154: mapa sem cenário vira local próprio (mapa:<id>)',()=>{
 assert.match(app,/function cenarioDeMapaV154_\(cid\)/);
 assert.match(app,/\|\|cenarioDeMapaV154_\(cid\);if\(!alvo\)return false;/);
 assert.match(app,/scenarioForMap\(mapId\)\|\|window\.__mesaCenarioDeMapaV154_\?\.\('mapa:'\+mapId\)/);
 assert.doesNotMatch(app,/Este mapa ainda não possui um cenário correspondente/);
});
test('v154: migração não apaga mapa definido sem cenário; chegada pela ligação',()=>{
 assert.match(app,/if\(!cReal&&!cVirt&&e\.localizacaoMapaDefinidaV92===true/);
 assert.match(app,/async function chegadaV154_\(mapId,chegando,antes\)/);
 assert.match(app,/function prevV154_\(ligs,origem,alvo\)/);
});
