import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const direta=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
test('bancos carregam em paralelo',()=>{
 const i=app.indexOf('async function carregarBancosDeDados() {'),corpo=app.slice(i,i+9000);
 assert.match(corpo,/const preGetV119_=n=>/);
 assert.doesNotMatch(corpo,/await getDocs\(collection\(db, ?["'](pericias|origens|carreiras|especializacoes|itens|npcs|criaturas|mapas)["']\)\)/);
});
test('leituras repetidas viram uma só',()=>{
 assert.match(app,/function novaInstanciasV119_\(\)/);assert.match(app,/function novaFichaDocV119_\(id\)/);
 assert.match(app,/const map806PendentesV119_=new Map\(\),map806LidosV119_=new Set\(\);/);
 assert.doesNotMatch(app,/__lidoV119/,'nada de marca dentro do modelo (iria para o banco)');
 assert.match(direta,/Promise\.all\(\[\.\.\.unicos\.values\(\)\]\.map\(o=>modelFor\(o\)/);
});
