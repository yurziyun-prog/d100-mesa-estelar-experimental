import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v65 oferece limpeza manual de imagem com apagar e restaurar',()=>{
  assert.match(app,/objMapaAbrirEditorManualV65_/);
  assert.match(app,/🧽 Limpar manualmente/);
  assert.match(app,/🖌️ Restaurar/);
  assert.match(app,/objMapaMascaraDesfazerV65_/);
});

test('v65 mantém cache-busting atualizado',()=>{
  assert.match(html,/js\/app\.js\?v=[^"']+/);
});
