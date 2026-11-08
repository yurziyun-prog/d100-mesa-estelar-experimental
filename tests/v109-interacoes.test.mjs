import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {acaoDoPonto,linhaAcao,distanciaM,RAIO_PADRAO} from '../js/mesa-interacoes.js';
const app=lerApp();
const diretor=fs.readFileSync(new URL('../js/mesa-diretor.js',import.meta.url),'utf8');
const visual=fs.readFileSync(new URL('../js/mesa-visual.js',import.meta.url),'utf8');

test('v109 carrega as interações no mapa à parte',()=>{
 assert.match(app,/import\('\.\/mesa-interacoes\.js\?v=1\d\d'\)[\s\S]{0,600}\.catch\(/);
 assert.doesNotMatch(app,/^import .*mesa-interacoes/m);
 assert.match(app,/window\.mesaInteracoesMapaV109_=\{/);
});
test('ponte usa as mesmas regras do Cenário Atual',()=>{
 const i=app.indexOf('window.mesaInteracoesMapaV109_={'),trecho=app.slice(i,i+3500);
 assert.match(trecho,/executarInteracaoCenarioV89_/);
 assert.match(trecho,/abrirComercioCenarioV73_/);
 assert.match(trecho,/estadoDiarioInteracaoV89_/);
});
test('ponto encontra a ação pelo id ou pelo título',()=>{
 const acoes=[{id:'acao_0_examinar',titulo:'Examinar a comporta'},{id:'acao_1_x',titulo:'Vasculhar'}];
 assert.equal(acaoDoPonto({acaoId:'acao_1_x'},acoes).titulo,'Vasculhar');
 assert.equal(acaoDoPonto({acaoId:'acao_9_examinar',titulo:'examinar a COMPORTA'},acoes).id,'acao_0_examinar');
 assert.equal(acaoDoPonto({acaoId:'nada',titulo:'nada'},acoes),null);
});
test('linha de ação no formato do cenário, sem quebrar colunas',()=>{
 const l=linhaAcao({titulo:'Abrir | cofre',pericias:'Mecânica;Eletrônica',evidente:'Um cofre\nvelho',sucesso:'Abre.'});
 assert.equal(l.split('|').length,8);
 assert.match(l,/^Abrir cofre\|🔎\|Mecânica;Eletrônica\|Padrão\|Um cofre velho\|Abre\.\|Abre\.\|$/);
});
test('distância em metros respeita o tamanho do mapa',()=>{
 assert.equal(distanciaM({x:0,y:0},{x:28,y:0},56,14),56);
 assert.ok(RAIO_PADRAO>=2&&RAIO_PADRAO<=5);
});
test('encontros podem surgir na borda ou num ponto escolhido',()=>{
 assert.match(diretor,/pontoDeBorda/);
 assert.match(diretor,/surgimento:'borda'/);
 assert.match(diretor,/c\.tipo==='encontro'/);
 assert.match(diretor,/dentroObstaculo/);
});
test('miniatura realista esconde a bolinha de girar',()=>{
 assert.match(visual,/\.mv-mini \[data-facing-handle\]\{[^}]*opacity:0/);
});
