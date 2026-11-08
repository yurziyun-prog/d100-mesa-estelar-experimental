import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=lerApp();
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v63 usa documento independente para o radio compartilhado',()=>{
  assert.match(app,/configuracoes\/audio_mesa_ao_vivo_v1/);
  assert.match(app,/onSnapshot\(audioMesaLiveV63Ref_\(\)/);
});

test('v63 instala e remove o player conforme autenticacao',()=>{
  assert.match(app,/onAuthStateChanged\(auth,user=>/);
  assert.match(app,/iniciarAudioMesaAoVivoV63_/);
  assert.match(app,/pararAudioMesaAoVivoV63_/);
  assert.match(app,/labAudioMesaFloat/);
});

test('v63 publica tocar, playlist e parar do mestre',()=>{
  assert.match(app,/gmMusicaTocarId510_=function/);
  assert.match(app,/gmMusicaTocarMomento510_=function/);
  assert.match(app,/gmMusicaParar490_=function/);
  assert.match(app,/audioMesaLiveV63Publicar_\(labEstado_\.audioMesaLab\)/);
});

test('v63 sincroniza avancos de playlist',()=>{
  assert.match(app,/labAudioAvancarV63Base_/);
  assert.match(app,/batalhaEhMestre_\(\).*audioMesaLiveV63Publicar_/s);
});

test('index mantém cache-busting do app em build posterior à v63',()=>{
  assert.match(index,/js\/app\.js\?v=[^"']+/);
});
