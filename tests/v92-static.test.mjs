import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const direct=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('v92 persiste mapa da localização e move miniatura no destino',()=>{
  assert.match(app,/localizacaoMapaId/);
  assert.match(app,/localizacaoMapaDefinidaV92/);
  assert.match(app,/moverTokenParaMapaV92_/);
  assert.match(app,/mapaId,x:Number\(spawn\.x\),y:Number\(spawn\.y\),revision/);
});

test('v92 mapa do mestre não vira localização global dos jogadores',()=>{
  assert.match(direct,/desiredViewMapId/);
  assert.match(direct,/tokensOnCurrentMap/);
  // A visão explícita de Atuar como fica entre mestre e combate coletivo.
  // O jogador comum continua seguindo o combate; o diretor segue seu token.
  assert.match(direct,/if\(user\(\)\?\.master\)return String\(shared\?\.mapId\|\|''\)/);
  assert.match(direct,/if\(shared\?\.combat\?\.active\)return String\(shared\?\.mapId\|\|''\)/);
  assert.match(direct,/if\(token\?\.mapaId\)return String\(token\.mapaId\)/);
  assert.match(direct,/ensurePlayerView/);
});

test('v92 traz personagens ativos somente por comando explícito',()=>{
  assert.match(html,/novaSyncPullActiveV92/);
  assert.match(html,/trazerPersonagensAtivosMapaV92_/);
  assert.match(app,/window\.trazerPersonagensAtivosMapaV92_/);
  assert.match(app,/personagemAtivo/);
  assert.match(app,/observarLocalizacaoPersonagemAtivoV92_/);
});

test('v92 tokens têm mapa e filtros de desenho por mapa',()=>{
  assert.ok(direct.includes("mapaId:String(mapaId||mapPacket?.mapId||'')"));
  assert.match(direct,/tokenOnCurrentMap/);
  assert.match(direct,/if\(!tokenOnCurrentMap\(t\)\)/);
});

test('v92 regras permitem mapaId sem liberar mapa arbitrário para jogador',()=>{
  assert.match(rules,/mapaId/);
  assert.match(rules,/localizacaoMapaId/);
  assert.match(rules,/get\('mapaId',''\)/);
});
