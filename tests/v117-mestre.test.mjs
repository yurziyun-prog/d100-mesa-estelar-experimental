import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {organizarFichas,normNome} from '../js/mesa-mestre.js';
import {TESTES_CENARIOS} from '../js/mesa-sessao-cenarios.js';
import {PERICIAS_BANCO,periciasReais,TESTES_PRONTOS} from '../js/mesa-sessao-dados.js';
import {specDeNpc} from '../js/mesa-miniaturas.js';
const app=lerApp();
test('PDM vira NPC de ficha avançada e o NPC duplicado some',()=>{
 const f=organizarFichas({personagens:[{id:'a',nome:'Dra. Ilya Nemer',dono:'m'},{id:'b',nome:'Qozae',dono:'p'}],npcs:[{id:'n1',nome:'Dra. Ilya Nemer'},{id:'n2',nome:'Tessan Vey'}],mestreUid:'m'});
 assert.deepEqual(f.avancados.map(x=>x.id),['a']);assert.deepEqual(f.jogadores.map(x=>x.id),['b']);
 assert.deepEqual(f.npcsBanco.map(x=>x.id),['n2']);assert.deepEqual(f.duplicados.map(x=>x.id),['n1']);
 assert.equal(normNome('Dra. Ilya Nemer'),normNome('Ilya Nemer'));
});
test('testes escritos para os cenários só usam perícias do banco',()=>{
 for(const [id,l] of Object.entries(TESTES_CENARIOS))for(const a of l){
  for(const p of a.pericias.split(';'))assert.ok(PERICIAS_BANCO.includes(p),id+': '+p);
  assert.ok(a.titulo&&a.evidente&&a.sucesso&&a.falha);assert.doesNotMatch(Object.values(a).join(' '),/\|/);
 }
 for(const l of Object.values(TESTES_PRONTOS))for(const a of l)for(const p of a.pericias.split(';'))assert.ok(PERICIAS_BANCO.includes(p),p);
 assert.deepEqual(periciasReais('Investigação, Insight, Costumes, Locale (Véspera), Dissimulação'),['Pesquisa','Percepção','Intuição','Etiqueta','Região','Enganação']);
});
test('mulheres pela ficha (sexo Feminino ou "Dra.")',()=>{
 for(const n of [{nome:'Dra. Ilya Nemer'},{nome:'X',sexo:'Feminino'},{nome:'Y',sexo:'F'}])assert.ok(['longo','rabo','coque','crespo'].includes(specDeNpc(n).cabelo),n.nome);
});
test('v117 carrega a conta do mestre à parte',()=>{
 assert.match(app,/import\('\.\/mesa-mestre\.js\?v=1\d\d'\)[\s\S]{0,400}\.catch\(/);
 assert.match(app,/window\.mesaMestreV117_=\{limparSelecao\(\)/);
});
