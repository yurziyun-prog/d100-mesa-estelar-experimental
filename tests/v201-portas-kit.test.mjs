import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v201 — portas do kit de construção viram portas de verdade na Mesa; a publicação
// passa a carregar bloqueiaVisao (parede/barreira de visão, porta fechada, janela livre).
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const oficina=fs.readFileSync(new URL('../js/nova-oficina.js',import.meta.url),'utf8');
const app17=fs.readFileSync(new URL('../js/app/17-oficina2-texturas-referencias.js',import.meta.url),'utf8');
test('v201 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-/);
});
test('publicação leva bloqueiaVisao e o roundtrip preserva',()=>{
 // prepararPublicacaoOficina: elemento → objeto com bloqueiaVisao (antes caía sempre em false)
 assert.match(oficina,/bloqueiaMovimento:!!e\.bloqueiaMovimento,bloqueiaVisao:!!e\.bloqueiaVisao,fixoAoMapa/);
 // estadoOficinaMesa (cena → elementos do editor) também o preserva
 assert.match(oficina,/bloqueiaMovimento:!!o\.bloqueiaMovimento,bloqueiaVisao:!!o\.bloqueiaVisao,nome:o\.nome/);
});
test('import de nova-oficina atualizado em todos os consumidores vivos',()=>{
 for(const f of ['app/01-nucleo.js','mesa-elenco.js','mesa-mapas-ui.js','mesa-remodelagem.js','nova-direta.js']){
  const src=fs.readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
  assert.match(src,/nova-oficina\.js\?v=201/,f+' deve usar ?v=201');
 }
});
test('app/17 expõe estado para testes de pipeline',()=>{
 assert.match(app17,/window\.gm2State_=\(\)=>gm2\.st/);
});
