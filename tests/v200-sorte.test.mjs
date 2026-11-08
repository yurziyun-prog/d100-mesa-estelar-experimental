import test from 'node:test';
import assert from 'node:assert/strict';
import {testeComSorte,prepararSorte} from '../js/nova-recuperacao.js';
const fixo=n=>()=>n;
test('Sorte ativa: +50% do valor da perícia só no próximo teste',()=>{
 const st={luckPrepared:true};
 const r=testeComSorte(st,60,fixo(85));
 assert.equal(r.valor,90,'60 → 90');assert.equal(r.sorte,true);assert.equal(r.sucesso,true,'85 passa a ser sucesso com 90');
 assert.equal(st.luckPrepared,false,'a Sorte some depois do teste');
 const r2=testeComSorte(st,60,fixo(85));assert.equal(r2.valor,60);assert.equal(r2.sucesso,false,'o teste seguinte volta ao normal');assert.ok(!r2.sorte);
});
test('Sorte pode passar de 100 e arredonda',()=>{
 assert.equal(testeComSorte({luckPrepared:true},81,fixo(50)).valor,122);
 assert.equal(testeComSorte({luckPrepared:true},45,fixo(50)).valor,68);
 assert.equal(testeComSorte({},130,fixo(50)).valor,100,'sem Sorte o limite continua 100');
});
test('Gastar Sorte: 1 ponto, liga a Sorte, não liga duas vezes',()=>{
 const info={health:{hit:{},hitMax:{}},luck:2},a={id:'pj',nome:'Kael'};
 const r=prepararSorte({a,health:{actors:{}},info,sheet:null});
 assert.equal(r.actors.pj.luckPrepared,true);assert.equal(r.actors.pj.luckRemaining,1);assert.match(r.message,/\+50%/);
 assert.throws(()=>prepararSorte({a,health:{actors:r.actors},info,sheet:null}),/já está ativa/);
 assert.throws(()=>prepararSorte({a,health:{actors:{pj:{luckRemaining:0}}},info:{...info,luck:0},sheet:null}),/Sem pontos/);
});
