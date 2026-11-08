import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=lerApp();

test('todo cenário recebe mapa próprio sem apagar mapas antigos',()=>{
  assert.match(app,/function criarMapaPadraoV100_/);
  assert.match(app,/mapaPadraoCenarioV100:true/);
  assert.match(app,/larguraM:28,alturaM:18,pxPorMetro:32/);
  assert.match(app,/Mapas existentes nunca são apagados/);
  assert.doesNotMatch(app,/deleteDoc\(doc\(db,'mapas'.*v100/);
});

test('vínculo é conservador: explícito, backref ou nome exato',()=>{
  const start=app.indexOf('function candidatoMapaV100_');
  const end=app.indexOf('async function criarMapaPadraoV100_',start);
  const block=app.slice(start,end);
  assert.match(block,/mapaPorIdV100_\(cenario\?\.mapaId\)/);
  assert.match(block,/String\(m\.cenarioId\|\|''\)===String\(cenario\.id\)/);
  assert.match(block,/chaveV100_\(m\.nome\|\|''\)===ck/);
  assert.doesNotMatch(block,/includes\(ck\)|hits\/a\.size/);
});

test('nome do mapa acompanha nome do cenário e backref é gravado',()=>{
  assert.match(app,/await setDoc\(doc\(db,'mapas',String\(mapa\.id\)\),\{nome,cenarioId:String\(cenario\.id\)/);
  assert.match(app,/await setDoc\(doc\(db,'cenarios',String\(cenario\.id\)\),\{mapaId:String\(mapa\.id\)\}/);
});

test('cenário oferece trazer jogadores ativos e abrir mapa',()=>{
  assert.match(app,/trazerJogadoresParaCenarioV100_/);
  assert.match(app,/👥 Trazer jogadores/);
  assert.match(app,/abrirMapaVinculadoCenarioV80_/);
  assert.match(app,/collection\(db,'usuarios'\)/);
});

test('mudança de mapa reconcilia cenário individual sem mover por câmera do mestre',()=>{
  assert.match(app,/iniciarObservadorMapaParaCenarioV100_/);
  assert.match(app,/if\(!primeira&&old!==undefined&&old!==mapId\)sincronizarEntidadePeloMapaV100_/);
  assert.match(app,/window\.__mesaMoverEntidadeCenario_/);
  assert.match(app,/Abrir um mapa como mestre continua sendo apenas navegação/);
});

test('há gancho para futuras portas mapa → cenário',()=>{
  assert.match(app,/window\.viajarPersonagemParaMapaV100_/);
  assert.match(app,/window\.__mesaPersistirViagemCenario_/);
});
