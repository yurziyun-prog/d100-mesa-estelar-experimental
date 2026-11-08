import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hostis,faccaoDe,intervaloAcaoMs,velocidadeMs,escolherAlvo,escolherAtaque,montarGrade,caminho,avancar,combateAcabou,melhorDefesa,escolherEfeitos,ehJogador,RODADA_S} from '../js/mesa-tempo-real-ia.js';
const app=lerApp();
const ataques=fs.readFileSync(new URL('../js/nova-ataques.js',import.meta.url),'utf8');
const direta=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');

test('tempo real carrega à parte e o ataque valida o estado antes de resolver',()=>{
 assert.match(app,/import\('\.\/mesa-tempo-real\.js\?v=\d+'\)[\s\S]{0,500}\.catch\(/);
 assert.doesNotMatch(app,/^import .*mesa-tempo-real/m);
 assert.match(ataques,/command\.kind==='direct-attack'&&globalThis\.mesaTempoRealV111&&command\.targetKind!=='object'&&!command\.powerId/);
 assert.ok(ataques.indexOf('await globalThis.mesaTempoRealV111.iniciar?.()')<ataques.indexOf('await globalThis.mesaTempoRealV111.assumir(id,command)'));
 assert.match(direta,/nova-ataques\.js\?v=\d+/);
 assert.match(app,/nova-direta\.js\?v=\d+/);
});
test('facções e hostilidade',()=>{
 const pj={id:'pj1',donoUid:'u1'},rato={id:encodeURIComponent('synccriatura:rato~1')};
 assert.ok(ehJogador(pj));assert.ok(!ehJogador(rato));
 assert.equal(faccaoDe(pj),'grupo');assert.equal(faccaoDe(rato),'inimigos');assert.equal(faccaoDe(rato,{[rato.id]:'a'}),'a');
 assert.ok(hostis('grupo','inimigos'));assert.ok(!hostis('inimigos','inimigos'));assert.ok(!hostis('neutros','grupo'));
 assert.ok(hostis('selvagens','selvagens'));assert.ok(hostis('a','b'));
});
test('mais ações = age e anda mais rápido; velocidade do jogo acelera',()=>{
 assert.ok(intervaloAcaoMs(3)<intervaloAcaoMs(2));assert.ok(intervaloAcaoMs(2,2)<intervaloAcaoMs(2,1));assert.ok(intervaloAcaoMs(50)>=700/1);
 assert.ok(velocidadeMs(6,3)>velocidadeMs(6,2));assert.equal(+velocidadeMs(6,2).toFixed(3),+(6/RODADA_S).toFixed(3)); // deslocamento por rodada (v123: rodada de 5 s)
});
test('alvo é o inimigo vivo mais próximo',()=>{
 const a={id:'a',x:0,y:7},perto={id:'p',x:3,y:7},longe={id:'l',x:20,y:7},morto={id:'m',x:1,y:7};
 const health={actors:{m:{combateLab:{morto:true}}}},faccoes={a:'a',p:'b',l:'b',m:'b'};
 assert.equal(escolherAlvo(a,[a,perto,longe,morto],{faccoes,health}).id,'p');
 assert.equal(escolherAlvo(a,[a,perto],{faccoes:{a:'a',p:'a'}}),null);
});
test('escolha de ataque respeita alcance, linha de tiro e munição',()=>{
 const lista=[{skillId:'s',weaponId:'faca',valor:60,alcance:1.8,distancia:false},{skillId:'t',weaponId:'rifle',valor:45,alcance:60,distancia:true}];
 assert.equal(escolherAtaque(lista,1).ataque.weaponId,'faca');
 assert.equal(escolherAtaque(lista,10).ataque.weaponId,'rifle');
 const b=escolherAtaque(lista,10,{bloqueado:true});assert.equal(b.alcanca,false);
 assert.equal(escolherAtaque(lista,10,{indisponivel:new Set(['t|rifle'])}).alcanca,false);
});
test('caminho desvia de parede',()=>{
 const g=montarGrade([{x:10,y:5,larguraM:1,alturaM:8,angulo:0}],20,14);
 const pts=caminho(g,{x:2,y:5},{x:18,y:5});assert.ok(pts.length>=2);
 const fim=pts.at(-1);assert.ok(Math.hypot(fim.x-18,fim.y-5)<.5);
 for(const p of pts)assert.ok(!(Math.abs(p.x-10)<.9&&p.y<9.4),'atravessou a parede '+JSON.stringify(p));
 const p=avancar({x:2,y:5},pts,1);assert.ok(Math.abs(Math.hypot(p.x-2,p.y-5)-1)<.01);
});
test('fim de combate e escolhas automáticas',()=>{
 const t=[{id:'a'},{id:'b'}];
 assert.deepEqual(combateAcabou(t,{faccoes:{a:'a',b:'b'}}),{fim:false});
 assert.equal(combateAcabou(t,{faccoes:{a:'a',b:'b'},health:{actors:{b:{combateLab:{morto:true}}}}}).vencedor,'a');
 assert.equal(combateAcabou(t,{faccoes:{a:'selvagens',b:'selvagens'}}).fim,false);
 assert.equal(melhorDefesa({options:[{id:'e',valor:30},{id:'ap',valor:55}]}),'ap');assert.equal(melhorDefesa({options:[]}),'none');
 const e=escolherEfeitos({options:[{id:'x'},{id:'y'},{id:'z'}],maxEffects:2,locations:['Peito']},()=>.1);
 assert.equal(e.effects.length,2);assert.equal(new Set(e.effects).size,2);
});
