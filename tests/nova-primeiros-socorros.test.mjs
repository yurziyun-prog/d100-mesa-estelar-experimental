import test from 'node:test';import assert from 'node:assert/strict';
import {primeirosSocorrosPodeAlcancar,prepararPrimeirosSocorros,concluirPrimeirosSocorros,localPrimeirosSocorros} from '../js/nova-primeiros-socorros.js';
test('primeiros socorros exige alcance de 1,5 m',()=>{assert.equal(primeirosSocorrosPodeAlcancar({x:1,y:1},{x:2.5,y:1}),true);assert.equal(primeirosSocorrosPodeAlcancar({x:1,y:1},{x:2.51,y:1}),false);});
test('continuação soma dificuldade e consome um kit',()=>{assert.deepEqual(prepararPrimeirosSocorros({turnos:3,temKit:true,usosKit:5}),{turnos:3,custoAcoes:1,dificuldade:10,usaKit:true,usosRestantes:4});});
test('sucesso recupera pouco e crítico pode recuperar mais',()=>{assert.equal(concluirPrimeirosSocorros({valor:60,rolagem:50,maximoLocal:10,ferimentoGrave:true}).recuperacao,1);assert.ok(concluirPrimeirosSocorros({valor:90,rolagem:1,maximoLocal:10,ferimentoGrave:true}).recuperacao>=3);});
test('seleciona automaticamente uma parte e exige escolha para várias',()=>{assert.equal(localPrimeirosSocorros({hit:{Braço:2},hitMax:{Braço:5}}).local,'Braço');assert.equal(localPrimeirosSocorros({hit:{Braço:2,Perna:1},hitMax:{Braço:5,Perna:5}}).exigeEscolha,true);});
