// Sessão de treino (js/mesa-treino-sessao.js): roteamento puro e regras do Firestore. VALIDAÇÃO: código-fonte/unidade (sem navegador).
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {rotaDe,COLECAO} from '../js/mesa-treino-sessao.js';
test('rotaDe: só redireciona fichas da sessão; criaturas, NPCs e outros caminhos ficam como estão',()=>{
 const ids=new Set(['char_1']);
 assert.equal(rotaDe('personagens/char_1',ids,'t_a'),COLECAO+'/t_a/fichas/char_1');
 assert.equal(rotaDe('personagens/char_2',ids,'t_a'),'personagens/char_2','outra ficha não é redirecionada');
 assert.equal(rotaDe('combatesAtivos/mapaMesaSyncSaude',ids,'t_a'),'combatesAtivos/mapaMesaSyncSaude');
 assert.equal(rotaDe('personagens/char_1/algo',ids,'t_a'),'personagens/char_1/algo','subcaminho não casa');
 assert.equal(rotaDe('personagens/char_1',ids,''),'personagens/char_1','sem sessão: ficha real');
 assert.equal(rotaDe('personagens/char%5F1',new Set(['char_1']),'t_a'),COLECAO+'/t_a/fichas/char_1','id codificado também casa');
});
test('regras: treinoSessoes só para o mestre; combate lê o caminho roteado pelos mesmos pontos de gravação da ficha',()=>{
 const r=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
 assert.match(r,/match \/treinoSessoes\/\{sessaoId\} \{\s*allow read, write: if ehMestre\(\);\s*match \/fichas\/\{fichaId\} \{\s*allow read, write: if ehMestre\(\);/);
 const app=readFileSync(new URL('../js/app/22-mesa-e-modulos.js',import.meta.url),'utf8');
 assert.match(app,/sheetPath=source\.startsWith\('sync'\)\|\|source\.startsWith\('dummy:'\)\?null:\(globalThis\.mesaTreinoRotaV205/,'ficha do ator roteada');
 assert.match(app,/targetSheetPath=!objectTarget&&[^;]*\(globalThis\.mesaTreinoRotaV205/,'ficha do alvo roteada');
 for(const f of ['mesa-relogio.js','mesa-limpeza.js','mesa-uso-itens.js','mesa-objetos.js','mesa-equipar.js']){
  assert.match(readFileSync(new URL('../js/'+f,import.meta.url),'utf8'),/mesaTreinoRotaV205/,f+' roteia a ficha');}
});
