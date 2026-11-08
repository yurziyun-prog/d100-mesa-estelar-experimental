import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {MONTARIAS,catalogo,instanciaMontaria,VEICULOS} from '../js/mesa-concessionaria.js';import {RAMOS} from '../js/mesa-lojas.js';
const ficha=readFileSync(new URL('../js/app/23-radio-ficha-naves.js',import.meta.url),'utf8');
test('v193 montarias: catálogo usa os mesmos modelos de companheiros da ficha',()=>{
 assert.equal(catalogo('montarias'),MONTARIAS);assert.deepEqual(MONTARIAS.map(m=>m.id),['galinha_domestica','lobo_companheiro','drone_auxiliar_zk4','dragao_trombeta_domesticado']);
 for(const m of MONTARIAS){assert.ok(ficha.includes("id:'"+m.id+"'"),'modelo na ficha: '+m.id);assert.ok(m.preco>0&&m.vendavel&&m.pvMax>0);}
 const d=MONTARIAS.find(m=>m.id==='dragao_trombeta_domesticado');assert.equal(d.montaria,true);assert.equal(d.preco,3000);assert.equal(d.nivelAcesso,'Comum');
 assert.match(ficha,/id:'dragao_trombeta_domesticado'[^}]*vendavel:true,preco:3000/);
 assert.ok(MONTARIAS.find(m=>m.id==='lobo_companheiro').preco<VEICULOS[0].preco,'montaria acessível, abaixo do veículo mais barato');
});
test('v193 montarias: instância na ficha tem o formato do vínculo do Banco; ramo de comerciante e botão do Mercado',()=>{
 const m=MONTARIAS[3],i=instanciaMontaria(m);
 for(const k of ['instanciaId','modeloId','nomeIndividual','estado','pvAtual','pvMax','energiaAtual','energiaMax','vinculadoEm','modelo'])assert.ok(k in i,k);
 assert.equal(i.modeloId,m.id);assert.equal(i.pvAtual,28);assert.equal(i.modelo.montaria,true);assert.notEqual(i.instanciaId,instanciaMontaria(m).instanciaId);
 assert.equal(RAMOS.montarias.vitrine,'montarias');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/abrir\('montarias','Estábulo e animais'\)/);
 const c=readFileSync(new URL('../js/mesa-concessionaria.js',import.meta.url),'utf8');assert.match(c,/cmd\.tipo==='montarias'\?\{companheiros:/,'entrega dentro da mesma transação que cobra');
});
test('v193 montarias: compra de ponta a ponta com banco simulado (desconta, entrega o animal, recusa sem dinheiro)',async()=>{
 const {instalarConcessionaria}=await import('../js/mesa-concessionaria.js');
 const win={location:{href:'http://x/'}};const root={defaultView:win,getElementById:()=>null};
 const banco={'personagens/p1':{nome:'Kael',dono:'u1',recursos:3500,companheiros:[]},'personagens/p2':{nome:'Pobre',dono:'u1',recursos:100}};const avisos=[];
 const dep={root,db:'db',doc:(db,p)=>p,setDoc:async(r,d,o)=>{if(r.startsWith('combatesAtivos/mesaConcessionaria')&&!r.includes('acoes'))avisos.push(JSON.stringify(d));banco[r]={...(o?.merge?banco[r]:{}),...d};},getDoc:async r=>({exists:()=>!!banco[r],data:()=>banco[r]}),deleteDoc:async()=>{},onSnapshot:()=>()=>{},collection:()=>'c',
  runTransaction:async(db,fn)=>fn({get:async r=>({exists:()=>!!banco[r],data:()=>banco[r]}),set:(r,d)=>{banco[r]=d;}}),ehMestre:()=>true,uid:()=>'u1',personagem:()=>({id:'p1'}),registrar:async()=>{}};
 const c=instalarConcessionaria(dep);try{
  await win.mesaConcessionariaV171.processar('local1',{donoUid:'u1',personagemId:'p1',tipo:'montarias',modeloId:'dragao_trombeta_domesticado'});
  assert.equal(banco['personagens/p1'].recursos,500);assert.equal(banco['personagens/p1'].companheiros.length,1);assert.equal(banco['personagens/p1'].companheiros[0].modeloId,'dragao_trombeta_domesticado');
  await win.mesaConcessionariaV171.processar('local2',{donoUid:'u1',personagemId:'p2',tipo:'montarias',modeloId:'dragao_trombeta_domesticado'});
  assert.equal(banco['personagens/p2'].recursos,100);assert.ok(!banco['personagens/p2'].companheiros,'sem dinheiro, sem animal');assert.ok(avisos.some(a=>/Recursos insuficientes/.test(a)));
 }finally{c?.parar?.();}
});
