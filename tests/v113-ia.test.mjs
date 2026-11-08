import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {perfilCombate,descreverPerfil,fracaoVida,escolherAlvoPerfil,pontoDeFuga,montarGrade,COMPORTAMENTOS} from '../js/mesa-tempo-real-ia.js';
const app=lerApp();
const rt=fs.readFileSync(new URL('../js/mesa-tempo-real.js',import.meta.url),'utf8');
test('jeito de lutar pela ficha',()=>{
 assert.equal(perfilCombate({texto:'Errante parasitado zumbi',int:3,mov:3}).fuga,0);
 assert.equal(perfilCombate({texto:'Rastejante de cinzas pequeno predador',int:5,mov:3}).fuga,.5);
 assert.equal(perfilCombate({texto:'Besta Ululante Grande predador',int:6,mov:8}).fuga,.1);
 assert.equal(perfilCombate({texto:'Carniçal Dominante cadaver',int:6,mov:3}).fuga,0);
 const npc=perfilCombate({texto:'Pip Rasco catador',int:12,mov:6,tipo:'npc'});assert.equal(npc.alvo,'perigoso');assert.equal(npc.fuga,.3);
 const cila=perfilCombate({texto:'Cila séssil',mov:0});assert.ok(cila.imovel);assert.equal(cila.fuga,0);
 assert.equal(perfilCombate({texto:'galinha',int:2,mov:4}).alvo,'vinganca');
 assert.equal(perfilCombate({texto:'Rato',int:5,mov:6},'furia').fuga,0);
 assert.equal(perfilCombate({texto:'Rato',int:5,mov:6},'teimoso').fuga,.1);
 assert.ok(perfilCombate({texto:'Rato',int:5,mov:6},'parado').imovel);
 assert.equal(perfilCombate({texto:'Errante zumbi',int:3,mov:3,comportamento:'feroz'}).fuga,0);
 for(const k of Object.keys(COMPORTAMENTOS))assert.ok(descreverPerfil(perfilCombate({texto:'x',int:6,mov:4},k)));
});
test('vida, alvo e fuga',()=>{
 const health={actors:{a:{combateLab:{hitMax:{t:10,c:10},hit:{t:2,c:8}}},b:{combateLab:{hitMax:{t:10},hit:{t:10}}}}};
 assert.equal(fracaoVida(health,'a'),.5);assert.equal(fracaoVida(health,'z'),1);
 const ator={id:'synccriatura:m',x:10,y:7,donoUid:''},A={id:'a',x:14,y:7,donoUid:'p1'},B={id:'b',x:12,y:7,donoUid:'p2'};
 assert.equal(escolherAlvoPerfil(ator,[ator,A,B],{health,perfil:{alvo:'proximo'}}).id,'b');
 assert.equal(escolherAlvoPerfil(ator,[ator,A,B],{health,perfil:{alvo:'ferido'}}).id,'a');
 assert.equal(escolherAlvoPerfil(ator,[ator,A,B],{health,perfil:{alvo:'proximo',imovel:true},alcanceMax:.5}),null);
 const g=montarGrade([],28,14),p=pontoDeFuga({x:10,y:7},[{x:12,y:7}],g,28,14);
 assert.ok(p.x<10,'foge para longe');
});
test('tempo real: deslize suave, ponte com inteligência e deslocamento do banco',()=>{
 assert.match(rt,/rt-ativo \[data-token\^="sync"\]\{transition:left \.5s linear/);
 assert.match(rt,/mesa-tempo-real-ia\.js\?v=1(1[3-9]|[2-9]\d)/);
 assert.match(app,/import\('\.\/mesa-tempo-real\.js\?v=\d+'\)/);
 assert.match(app,/return \{acoes,mov,ataques,int,tipo,texto,comportamento/);
 assert.match(app,/deslocamentoFichaV112_\(c,t\.nome,t\)/);
});
