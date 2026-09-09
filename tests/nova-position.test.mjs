import test from 'node:test';
import assert from 'node:assert/strict';
import {reducePosition,listenConfirmedCommands} from '../js/nova-sync.js';
test('nova aba: propriedade verificada pela autoridade, inclusive identidade falsificada',()=>{
 const s={tokens:[{id:'pj',donoUid:'player',x:5,y:5}]};
 const c={type:'nova_move',actor:'pj',personagemId:'pj',uid:'other',donoUid:'other',payload:{dx:1,dy:0}};
 assert.equal(reducePosition(s,c,'master'),false);
 assert.equal(reducePosition(s,{...c,uid:'master'},'master'),false);
 assert.equal(s.tokens[0].x,5);
 assert.equal(reducePosition(s,{...c,uid:'player',donoUid:'player'},'master'),true);
 assert.equal(s.tokens[0].x,6);
});
test('nova aba: mouse respeita limites; coordenada inválida não muda posição',()=>{
 const s={tokens:[{id:'pj',donoUid:'player',x:5,y:5}]};
 const c={type:'nova_move',actor:'pj',personagemId:'pj',uid:'master',donoUid:'master',payload:{mode:'point',x:99,y:-3}};
 assert.equal(reducePosition(s,c,'master'),true);
 assert.deepEqual([s.tokens[0].x,s.tokens[0].y],[28,0]);
 assert.equal(reducePosition(s,{...c,payload:{mode:'point',x:NaN,y:1}},'master'),false);
 assert.deepEqual([s.tokens[0].x,s.tokens[0].y],[28,0]);
});


test('fila aguarda escrita local ser confirmada antes de processar',()=>{
 let deliver;const received=[];
 listenConfirmedCommands((ref,options,callback)=>{
   assert.equal(options.includeMetadataChanges,true);deliver=callback;return()=>{};
 },'queue',c=>received.push(c),e=>{throw e});
 const snapshot=(pending,type='modified')=>({docChanges:options=>{
   assert.equal(options.includeMetadataChanges,true);
   return [{type,doc:{metadata:{hasPendingWrites:pending},ref:{path:'queue/one'},data:()=>({status:'new'})}}];
 }});
 deliver(snapshot(true,'added'));assert.equal(received.length,0);
 deliver(snapshot(false));assert.equal(received.length,1);
 deliver(snapshot(false,'removed'));assert.equal(received.length,1);
});
