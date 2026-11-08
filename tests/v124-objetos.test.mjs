import test from 'node:test';import assert from 'node:assert/strict';
import {tipoInterativo,estadoDe,aplicarPedido,distanciaObjeto,valorComDificuldade,TIPOS} from '../js/mesa-objetos.js';
test('v124: tipos pelo nome e pelo mestre',()=>{
 assert.equal(tipoInterativo({nome:'Porta'}),'porta');assert.equal(tipoInterativo({nome:'Escotilha'}),'porta');
 assert.equal(tipoInterativo({nome:'Armário de metal'}),'recipiente');assert.equal(tipoInterativo({nome:'Luminária de teto'}),'luz');
 assert.equal(tipoInterativo({nome:'Terminal ainda ativo'}),'maquina');assert.equal(tipoInterativo({nome:'Parede'}),'');
 assert.equal(tipoInterativo({nome:'Sofá',interativo:'recipiente'}),'recipiente');assert.equal(tipoInterativo({nome:'Porta',interativo:'nenhum'}),'');
});
test('v124: porta trancada pede teste; Força Bruta arromba e libera a passagem',()=>{
 let o={id:'p',nome:'Porta',bloqueiaMovimento:true,camada:3};
 o=aplicarPedido(o,{acao:'mestre',patch:{trancado:true}}).objeto;assert.equal(estadoDe(o).trancado,true);
 assert.throws(()=>aplicarPedido(o,{acao:'alternar',nome:'Qozae'}),/trancad/);
 const f=aplicarPedido(o,{acao:'teste',personagemId:'pj1',nome:'Qozae',teste:{pericia:'Mecanismos',valor:30,die:80,grau:'Falha',sucesso:false}});
 assert.match(f.msg,/falhou/);assert.throws(()=>aplicarPedido(f.objeto,{acao:'teste',personagemId:'pj1',teste:{pericia:'Mecanismos',valor:30,die:2,grau:'Crítico',sucesso:true}}),/Já tentou/);
 const s=aplicarPedido(f.objeto,{acao:'teste',personagemId:'pj1',nome:'Qozae',teste:{pericia:'Força Bruta',valor:60,die:10,grau:'Sucesso',sucesso:true}});
 const e=estadoDe(s.objeto);assert.equal(e.aberto,true);assert.equal(e.quebrado,true);assert.equal(s.objeto.bloqueiaMovimento,false);assert.match(s.msg,/arrombou/);
 const fechada=aplicarPedido(s.objeto,{acao:'alternar',nome:'Qozae'}).objeto;assert.equal(fechada.bloqueiaMovimento,true);assert.equal(fechada.camada,3);
});
test('v124: luz liga/desliga; máquina travada pede teste; dificuldade e alcance',()=>{
 const l=aplicarPedido({id:'l',nome:'Luminária'},{acao:'alternar',nome:'Kibi'});assert.equal(estadoDe(l.objeto).ligado,true);assert.match(l.msg,/ligou/);
 assert.deepEqual(TIPOS.maquina.pericias,['Computação','Cibersegurança','Eletrônica','Mecânica']);
 assert.equal(valorComDificuldade(60,'dificil'),40);assert.equal(valorComDificuldade(60,'facil'),90);
 assert.ok(distanciaObjeto({x:12.4,y:7,diametroM:1},{x:14,y:7,larguraM:1,alturaM:1.6})<2);
});
