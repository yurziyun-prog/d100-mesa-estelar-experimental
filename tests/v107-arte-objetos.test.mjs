import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {desenharObjeto,DESENHOS,RECEITAS_OBJETOS,PACOTE_NOVO} from '../js/mesa-arte-objetos.js';
const app=lerApp();

test('v107 carrega a arte dos objetos à parte',()=>{
 assert.match(app,/import\('\.\/mesa-arte-ui\.js\?v=1\d\d'\)[\s\S]{0,600}\.catch\(/);
 assert.doesNotMatch(app,/^import .*mesa-arte/m);
});
test('todos os desenhos geram SVG válido na proporção do objeto',()=>{
 for(const tipo of Object.keys(DESENHOS)){
  const svg=desenharObjeto({tipo},2,1);
  assert.match(svg,/^<svg [^>]*viewBox="0 0 512 256"/,tipo);
  assert.doesNotMatch(svg,/NaN|undefined/,tipo);
 }
});
test('receitas cobrem os objetos do banco e o pacote novo é consistente',()=>{
 for(const [id,r] of Object.entries(RECEITAS_OBJETOS))assert.ok(DESENHOS[r.tipo],id);
 const ids=new Set();
 for(const p of PACOTE_NOVO){assert.match(p.id,/^pk_[a-z0-9_]+$/);assert.ok(!ids.has(p.id));ids.add(p.id);assert.ok(DESENHOS[p.tipo],p.id);assert.ok(p.larguraM>0&&p.alturaM>0);}
});
test('mesmo objeto gera sempre o mesmo desenho',()=>{
 assert.equal(desenharObjeto(RECEITAS_OBJETOS.arvre1,4.5,4.5),desenharObjeto(RECEITAS_OBJETOS.arvre1,4.5,4.5));
});
