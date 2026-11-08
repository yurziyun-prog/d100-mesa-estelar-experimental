import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=lerApp();
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules', import.meta.url),'utf8');

test('v82 cria banco administrativo de companheiros com CSV',()=>{
  assert.match(app,/Banco de Companheiros/);
  assert.match(app,/importarCompanheirosCSVV82_/);
  assert.match(app,/exportarCompanheirosCSVV82_/);
  assert.match(app,/baixarTemplateCompanheirosV82_/);
});

test('v82 inclui modelos básicos animal, robô e montaria',()=>{
  assert.match(app,/galinha_domestica/);
  assert.match(app,/lobo_companheiro/);
  assert.match(app,/drone_auxiliar_zk4/);
  assert.match(app,/dragao_trombeta_domesticado/);
});

test('v82 vincula instância persistente a uma única ficha',()=>{
  assert.match(app,/const arr=Array\.isArray\(char\.companheiros\)/);
  assert.match(app,/setDoc\(doc\(db,'personagens',char\.id\),\{companheiros:arr\}/);
  assert.match(app,/modelo:JSON\.parse\(JSON\.stringify\(mod\)\)/);
});

test('v82 só mostra vínculos na lateral quando existem',()=>{
  assert.match(app,/charCompanionsV82/);
  assert.match(app,/if\(!c\|\|!arr\.length\)\{box\.style\.display='none'/);
  assert.match(app,/abrirFichaCompanheiroV82_/);
});

test('v82 banco de modelos continua privado ao mestre',()=>{
  assert.match(rules,/match \/companheiros\/\{documento\} \{ allow read, write: if ehMestre\(\); \}/);
});
