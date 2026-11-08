import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {specDePersonagem,specDeCriatura,renderizarMiniatura,receitaPorNome} from '../js/mesa-miniaturas.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=lerApp();
const ui=fs.readFileSync(new URL('../js/mesa-miniaturas-ui.js',import.meta.url),'utf8');

test('v106 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-/);
 assert.match(app,/import\('\.\/mesa-miniaturas-ui\.js\?v=1\d\d'\)/);
 assert.match(app,/personagens:\(\)=>userCharacters/);
 assert.match(ui,/instalarPainelBanco\('banco-npcs','personagens'\)/);
});
test('miniaturas prontas dos jogadores pelo nome',()=>{
 assert.ok(specDePersonagem({nome:'Qozae'}).tracos.focinhoLongo);
 assert.ok(specDePersonagem({nome:'Kozae'}).tracos.focinhoLongo);
 assert.equal(specDePersonagem({nome:'Qozae'}).cabeca,'chapeu');
 const j=specDePersonagem({nome:'Jullytrath'});assert.ok(j.tracos.asasDobradas&&j.tracos.cauda&&j.tracos.chifres);
 assert.ok(specDePersonagem({nome:'Kibi'}).porte<.8);
 const s=specDePersonagem({nome:'Sérgio Leone'});assert.equal(s.cabeca,'capacete');assert.equal(s.maoD,'revolver');
 assert.equal(specDeCriatura({id:'galinha_do_sergio'}).corpo,'ave');
 assert.equal(receitaPorNome('Fulano'),null);
 for(const n of ['Qozae','Jullytrath','Kibi','Sérgio Leone'])assert.doesNotMatch(renderizarMiniatura(specDePersonagem({nome:n})),/NaN|undefined/);
});
test('CSV de criaturas novas no formato do banco',()=>{
 const csv=fs.readFileSync(new URL('../dados/dados-v106/criaturas_novas_e_zumbis_v106.csv',import.meta.url),'utf8').replace(/^﻿/,'');
 const linhas=csv.trim().split('\n'),cab=linhas[0].split(';');
 assert.ok(cab.includes('id')&&cab.includes('periciasTexto')&&cab.includes('armasTexto'));
 assert.equal(linhas.length,9);
 assert.match(csv,/zumbi_1;Errante Parasitado/);assert.match(csv,/cadaver_de_chefe;Carniçal Dominante/);
 for(const id of ['inchado_pustulento','cao_de_sucata','rastejador_de_tubulacoes','sentinela_imperial','mariposa_cinza','galinha_do_sergio']){assert.match(csv,new RegExp(';'+id+';'));assert.doesNotMatch(renderizarMiniatura(specDeCriatura({id})),/NaN/);}
});
