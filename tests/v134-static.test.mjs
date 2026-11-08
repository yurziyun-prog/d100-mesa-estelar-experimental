import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {emComa,estadoVital,locaisDoComa} from '../js/nova-coma.js';
import {chaveServe} from '../js/mesa-objetos.js';
import {textoDoBilhete} from '../js/mesa-recheio.js';
import {TAMANHOS} from '../js/mesa-gerador-mapas.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v134: desmaio × coma × morte',()=>{
 const coma={inconsciente:true,hitMax:{'Cabeça':5,Peito:8},hit:{'Cabeça':-2,Peito:8},ferimentos:{'Cabeça':'Grave'}};
 assert.ok(emComa(coma));assert.deepEqual(locaisDoComa(coma),['Cabeça']);assert.equal(estadoVital(coma),'🛌 Em coma');
 assert.ok(!emComa({...coma,estabilizados:{'Cabeça':true}}));assert.equal(estadoVital({...coma,estabilizados:{'Cabeça':true}}),'💤 Desmaiado');
 assert.ok(!emComa({inconsciente:true,hitMax:{'Braço Direito':4},hit:{'Braço Direito':-3},ferimentos:{'Braço Direito':'Grave'}}));
 assert.equal(estadoVital({...coma,morto:true}),'💀 Morto');
 assert.match(ler('mesa-tempo-real.js'),/emComa\(st\)/);assert.match(ler('app.js'),/Em coma: só acorda/);
});
test('v134: chave do quarto e aluguel com o UR-17',()=>{
 assert.ok(chaveServe({nome:'Chave da cápsula 3',abre:'Porta da cápsula 3'},{nome:'Porta da cápsula 3'}));
 assert.ok(chaveServe({nome:'Chave da cápsula 3'},{nome:'Porta da cápsula 3'}));
 assert.ok(!chaveServe({nome:'Chave da cápsula 3'},{nome:'Porta da cápsula 4'}));
 assert.ok(!chaveServe({nome:'Kit médico'},{nome:'Porta da cápsula 4'}));
 const e=ler('mesa-elenco.js');assert.match(e,/chave_capsula_/);assert.match(e,/comerciante:true/);
});
test('v134: bilhetes sem notas do mestre; mapas panorâmicos',async()=>{
 const b=textoDoBilhete({nome:'Arquivo',segredos:'O arquivista é o traidor',objetivo:'Descobrir o traidor',eventos:'X'},'futurista');
 assert.doesNotMatch(b.texto,/traidor|arquivista/);
 assert.ok(TAMANHOS.some(([w])=>w===56));
 let m=null;try{m=await import('../js/mesa-elenco.js');}catch(_){}
 if(m){const st=m.ampliarEstado({w:28,h:14,elements:[{type:'object',x:1,y:1,w:2,h:1},{type:'shape',x:2,y:3,w:4,h:1}]},2);
  assert.equal(st.w,56);assert.equal(st.elements[0].w,2);assert.equal(st.elements[0].x,3);assert.equal(st.elements[1].w,8);assert.equal(st.elements[1].x,4);}
 assert.match(ler('nova-direta.js'),/mapas panorâmicos/);
});
