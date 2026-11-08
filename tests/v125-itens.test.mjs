import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {aplicarPedido,itemSolto,itensDentro,estadoDe} from '../js/mesa-objetos.js';
import {corrigirModelo,corrigirObjetoCena} from '../js/mesa-tamanhos.js';
const app=lerApp();
test('v125: pegar item de dentro do armário aberto',()=>{
 const o={id:'a',nome:'Armário',estadoInterativo:{aberto:true,itens:[{uid:'u1',tipo:'item',idBanco:'kit',nome:'Kit'},{uid:'u2',tipo:'nota',nome:'Bilhete',texto:'oi'}]}};
 const r=aplicarPedido(o,{acao:'pegar',uid:'u2',nome:'Kibi'});assert.deepEqual(itensDentro(r.objeto).map(i=>i.uid),['u1']);assert.match(r.msg,/Kibi pegou 📜 Bilhete/);
 assert.throws(()=>aplicarPedido({...o,estadoInterativo:{...o.estadoInterativo,aberto:false}},{acao:'pegar',uid:'u1'}),/fechad/);
 assert.throws(()=>aplicarPedido(o,{acao:'pegar',uid:'zz'}),/não está mais/);
 assert.equal(estadoDe({nome:'Baú'}).itens.length,0);
});
test('v125: item solto no chão (inclusive item do catálogo)',()=>{
 assert.equal(itemSolto({id:'x',itemSolto:{tipo:'nota',nome:'Recado'}}).uid,'x');
 assert.equal(itemSolto({id:'y',tipo:'item',modeloId:'syncitem:kit_medico',nome:'Kit'}).idBanco,'kit_medico');
 assert.equal(itemSolto({id:'z',nome:'Sofá'}),null);
});
test('v125: mesas voltam ao tamanho registrado (1,5 m)',()=>{
 assert.deepEqual([corrigirModelo({id:'mesa2',larguraM:1.3,alturaM:1.3}).larguraM,corrigirModelo({id:'mesa1',larguraM:1,alturaM:1}).alturaM],[1.5,1.5]);
 assert.equal(corrigirObjetoCena({modeloId:'syncobjeto:mesa2',larguraM:1.3,alturaM:1.3}).larguraM,1.5);
 assert.equal(corrigirModelo({id:'mesa2',larguraM:1.8,alturaM:1.8}),null); // ajustada à mão: fica
});
test('v125: efeito Desarmar e arma no chão bloqueando o ataque',()=>{
 assert.match(app,/id:'desarmar',nome:'🫳 Desarmar/);assert.match(app,/dst\.armaCaida=\{key:chaveArmaV125_/);assert.match(app,/está no chão\. Pegue de volta/);
});
