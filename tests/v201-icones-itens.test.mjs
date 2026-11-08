import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {iconeParaItem,ARMAS_RAPIDAS,DEFESAS_RAPIDAS,srcIcone,todosIcones} from '../js/mesa-icones-itens.js';
test('ícone pelo nome do item (sem acento, plural, palavra mais longa vence)',()=>{
 assert.match(iconeParaItem('Espada longa'),/rpg_claymore/);
 assert.match(iconeParaItem('Machado duplo de guerra'),/axe_double/);
 assert.match(iconeParaItem('Poções de cura'),/potion/);
 assert.match(iconeParaItem('MAÇÃ verde'),/apple/);
 assert.equal(iconeParaItem('Lanterna'),'');
 assert.equal(iconeParaItem(''),'');
});
test('todos os ícones existem em disco e o equipamento rápido aponta para ícones reais',()=>{
 for(const i of todosIcones())assert.ok(fs.existsSync(new URL('../'+i.src,import.meta.url)),i.src);
 for(const a of [...ARMAS_RAPIDAS,...DEFESAS_RAPIDAS].filter(x=>x.id))assert.ok(srcIcone(a.id),a.id);
});
