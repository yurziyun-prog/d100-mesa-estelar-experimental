import test from 'node:test';
import assert from 'node:assert/strict';
import {criarRelogio,atualizarRelogios,tempoRestante,textoDuracao} from '../js/nova-duracoes.js';
import {classificarTeste,locaisValidos,descreverTeste} from '../js/nova-regras.js';
test('crítico é estritamente abaixo de dez por cento da perícia efetiva',()=>{
 assert.equal(classificarTeste(80,7).grau,'Crítico');assert.equal(classificarTeste(80,8).grau,'Sucesso');
 assert.equal(classificarTeste(0,1).sucesso,false);assert.equal(classificarTeste(100,10).grau,'Sucesso');
 assert.equal(classificarTeste(85,8).grau,'Crítico');
});
test('local totalmente inutilizado não recebe novos golpes; histórico discrimina base e efetiva',()=>{
 assert.deepEqual(locaisValidos({hitMax:{Braço:3,Peito:7,Perna:4},hit:{Braço:-3,Peito:-2,Perna:-25}}),['Peito']);
 assert.equal(descreverTeste(78,58,33,[{name:'pelas costas',value:-20}]),'base 78 · −20 pelas costas · efetiva 58 · 33/58');
});
test('três rodadas deixam 42 segundos; exploração e novo combate preservam frações',()=>{
 const combat={active:true,session:'s',round:1},a={a:{psiEffects:{mimetismo:{clock:criarRelogio(60000,combat,1000),untilRound:11}}}};
 atualizarRelogios(a,{...combat,round:4},null,900000);assert.equal(a.a.psiEffects.mimetismo.clock.remaining,42000);
 atualizarRelogios(a,{...combat,active:false,round:4},null,901000);assert.equal(textoDuracao(a.a.psiEffects.mimetismo.clock,null,901000),'42 s');
 atualizarRelogios(a,{active:true,session:'next',round:1},null,921000);assert.equal(a.a.psiEffects.mimetismo.clock.remaining,22000);
 assert.equal(tempoRestante(a.a.psiEffects.mimetismo.clock,{active:true,session:'next',round:1},9999999),22000);
 atualizarRelogios(a,{active:true,session:'next',round:5},null,9999999);assert.equal(a.a.psiEffects.mimetismo,undefined);
});
test('magias expiram fora de combate e estados legados órfãos são limpos',()=>{
 const scene={objects:[{id:'illusion',ilusaoPsi:true,clock:criarRelogio(60000,null,1000)}],psiZones:[{kind:'Ilusão',untilRound:2}]};
 atualizarRelogios({},null,scene,60999);assert.equal(scene.objects.length,1);assert.equal(scene.psiZones.length,0);
 atualizarRelogios({},null,scene,61000);assert.equal(scene.objects.length,0);
});
