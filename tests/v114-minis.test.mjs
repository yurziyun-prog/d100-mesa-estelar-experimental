import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {specDeNpc,specDeCriatura,renderizarMiniatura} from '../js/mesa-miniaturas.js';
const visual=fs.readFileSync(new URL('../js/mesa-visual.js',import.meta.url),'utf8');
const conteudo=fs.readFileSync(new URL('../js/mesa-conteudo.js',import.meta.url),'utf8');
const app=lerApp();
test('insetoides são bípedes de quatro braços',()=>{
 const npc=specDeNpc({nome:'Tik',raca:'Insetoide'});assert.equal(npc.corpo,'humanoide');assert.ok(npc.tracos.quatroBracos&&npc.tracos.carapaca&&npc.tracos.antenas);
 const cri=specDeCriatura({id:'insetoide_predador',nome:'Insetoide Predador'});assert.equal(cri.corpo,'humanoide');assert.ok(cri.tracos.quatroBracos);
 const gen=specDeCriatura({id:'novo',nome:'Insetoide guerreiro',descricao:'insetoide da colmeia'});assert.equal(gen.corpo,'humanoide');
 assert.equal(specDeCriatura({id:'insetoide_predador_1',nome:'x'}).corpo,'inseto');
 assert.equal(specDeCriatura({id:'z',nome:'Insetoide',descricao:'predador hexápode'}).corpo,'inseto');
 assert.doesNotMatch(renderizarMiniatura(npc),/NaN|undefined/);
});
test('miniaturas ocupam o espaço real e têm sombra de chão',()=>{
 assert.match(visual,/width:calc\(var\(--mv-esc,1\.35\)\*100%\)/);
 assert.match(visual,/base=dm>=5\?1\.15:dm>=2\?1\.3:1\.8/); // v126: em mapas grandes a escala diminui proporcionalmente
 assert.match(visual,/mv-mini::after\{content:'';position:absolute;inset:0;border-radius:50%/);
});
test('miniaturas automáticas para todos (inclusive personagens)',()=>{
 assert.match(conteudo,/\['personagens',dep\.personagens,specDePersonagem\]/);
 assert.match(conteudo,/miniaturas automáticas/);
 assert.match(app,/personagens:\(\)=>userCharacters\|\|\[\]/);
});
