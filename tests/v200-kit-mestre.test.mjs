import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v200 — kit do mestre: peças de construção (mesa-construcao.js) como carimbos na Oficina 2.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../js/app/17-oficina2-texturas-referencias.js',import.meta.url),'utf8');
test('v200 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-/);
});
test('kit do mestre: import dinâmico, conversão e gancho de colocação',()=>{
 // módulo de construção carregado sob demanda
 assert.match(app,/import\('\.\/mesa-construcao\.js\?v=190'\)/);
 // conversão peça → formas gm2 (metros reais, colisão, teto, camada)
 assert.match(app,/function gm2pecaParaFormas_\(id,p0\)/);
 assert.match(app,/gm2PecaAPI\.montarPeca\(id,\{x:p0\.x,y:p0\.y\}/);
 assert.match(app,/bloqueiaMovimento:!!b\.bloqueiaMovimento/);
 assert.match(app,/grupoTetoV177:String\(b\.grupoTetoV177\|\|''\)/);
 // blocos invisíveis de colisão não podem renderizar opacos
 assert.match(app,/if\(b\.invisivelV161\)\{e\.fillOpacity=0;e\.strokeOpacity=0;e\.strokeWidth=0/);
 // colocação por clique e gancho no desenho
 assert.match(app,/function gm2createPecaDrag\(ev,p0\)/);
 assert.match(app,/gm2\.brush==='carimbo'&&String\(gm2\.stamp\|\|''\)\.startsWith\('peca:'\)/);
 // handle de teste
 assert.match(app,/window\.gm2PecaColocar_=function\(id,p,opts=\{\}\)/);
});
test('kit do mestre: UI (carimbos de construção, giro e material)',()=>{
 // grupo de carimbos no seletor
 assert.match(app,/optgroup label="🔨 Construção \(clique no mapa para colocar\)"/);
 for(const peca of ['parede','parede_porta','parede_janela','passagem','mureta','parede_diagonal','parede_curva','chao','chao_redondo','teto','escada','casa_pequena','casa_media','galpao','torre_redonda','casa_losango'])
  assert.ok(app.includes(`value="peca:${peca}"`),`carimbo peca:${peca}`);
 // seletores de giro e material
 assert.match(app,/id="gm2pecaGiro"/);
 assert.match(app,/id="gm2pecaMat"/);
 assert.match(app,/pecaGiro:0,pecaMat:'pedra-rio'/);
});
