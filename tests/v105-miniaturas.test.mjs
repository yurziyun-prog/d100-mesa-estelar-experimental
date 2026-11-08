import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizarSpec,renderizarMiniatura,specDeNpc,specDeCriatura,CORPOS,RECEITAS_CRIATURAS,MARCA_MINI} from '../js/mesa-miniaturas.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=lerApp();
const direct=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const visual=fs.readFileSync(new URL('../js/mesa-visual.js',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('v105 cache e carregamento isolado das miniaturas',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-/);
 assert.match(app,/import\('\.\/mesa-miniaturas-ui\.js\?v=1\d\d'\)[\s\S]{0,800}\.catch\(/);
 assert.doesNotMatch(app,/^import .*mesa-miniaturas/m);
});
test('tokens usam a miniatura quando existir',()=>{
 assert.equal((direct.match(/miniatura\?\.url\|\|/g)||[]).length,3);
 assert.match(app,/imagem:String\(e\.miniatura\?\.url\|\|e\.imagem\|\|''\)/);
});
test('regra: dono troca só a imagem do próprio token',()=>{
 assert.match(rules,/affectedKeys\(\)\.hasOnly\(\['imagem','revision'\]\)/);
 assert.match(rules,/request\.resource\.data\.imagem\.size\(\) < 2000/);
});
test('miniatura realista: sem ficha redonda e girando com a direção',()=>{
 assert.match(visual,/\.mv-mini\{background:none!important;border-color:transparent!important/);
 assert.match(visual,/rotate\(\$\{(t\.facing|a)\.toFixed\(3\)\}rad\)/); // v138: ângulo contínuo
 assert.equal(MARCA_MINI,'#mini');
});
test('todos os corpos geram SVG válido',()=>{
 for(const corpo of Object.keys(CORPOS)){
  const svg=renderizarMiniatura({corpo,maoD:'rifle',capa:'#552222',tracos:{cauda:true,olhosBrilho:true,asas:true}});
  assert.match(svg,corpo==='humanoide'?/^<svg [^>]*viewBox="-95 -95 190 190"/:/^<svg [^>]*viewBox="-128 -128 256 256"/,corpo); // v196: gente preenche ~1 m
  assert.doesNotMatch(svg,/NaN|undefined/,corpo);
 }
});
test('receitas automáticas',()=>{
 assert.equal(specDeCriatura({id:'besta_ululante'}).corpo,'quadrupede');
 assert.equal(specDeCriatura({id:'x',nome:'Aranha de pedra'}).corpo,'aracnideo');
 assert.equal(specDeNpc({raca:'Robô',carreira:'Combate'}).corpo,'robo');
 assert.equal(specDeNpc({raca:'Arisian'}).corpo,'tanque');
 assert.ok(specDeNpc({raca:'Reptiliano'}).tracos.cauda);
 for(const id of Object.keys(RECEITAS_CRIATURAS))assert.doesNotMatch(renderizarMiniatura(specDeCriatura({id})),/NaN/,id);
 assert.deepEqual(normalizarSpec({corpo:'dragão',porte:9}).corpo,'humanoide');
 assert.equal(normalizarSpec({porte:9}).porte,1.4);
});
