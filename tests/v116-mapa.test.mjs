import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const barra=fs.readFileSync(new URL('../js/mesa-barra.js',import.meta.url),'utf8');
const direta=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const rt=fs.readFileSync(new URL('../js/mesa-tempo-real.js',import.meta.url),'utf8');
test('＋ com fantasma, 🎭 atuar como e edição na lateral',()=>{
 assert.match(barra,/id='mbFantasma'/);
 assert.match(barra,/data-a="atuar"/);assert.match(barra,/async function atuarComo\(id,gesto\)/);
 assert.match(barra,/gesto\?\.isTrusted&&win\.mesaAtuarAbaV205\?\.escolher\?\.\(id\)/);
 assert.match(barra,/id='mbLateral'/);assert.match(barra,/\['rect','▭'/);
 assert.match(barra,/body\.mb-mestre #novaSyncPersonagem,body\.mb-mestre \.nova-acting-label,body\.mb-mestre #novaSyncCatalog,/);
});
test('controlador expõe a seleção e o tempo real libera a criatura',()=>{
 assert.match(direta,/selecao:\(\)=>\{try\{return editor\.selection;\}catch\(_\)\{return null;\}\}/);
 assert.match(rt,/const assumirControle=async id=>/);assert.match(rt,/auto:\{\[id\]:false\}/);
});
