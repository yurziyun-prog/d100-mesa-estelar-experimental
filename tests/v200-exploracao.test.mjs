import test from 'node:test';
import assert from 'node:assert/strict';
import {papelPorPersonalidade,portaFechada,recursoParaToca,objetoToca,pontoAtras,instalarExploracao} from '../js/mesa-exploracao.js';

const porta=(extra={})=>({id:'p1',nome:'Porta de madeira',x:14,y:7,larguraM:1,alturaM:.3,bloqueiaMovimento:true,...extra});
test('personalidade → papel de vida',()=>{
 assert.equal(papelPorPersonalidade('explorador','vaga'),'exploradora');
 assert.equal(papelPorPersonalidade('covarde','presa'),'covarde');
 assert.equal(papelPorPersonalidade('construtora','vaga'),'construtora');
 assert.equal(papelPorPersonalidade('construtora','parado'),null);
 assert.equal(papelPorPersonalidade('comum','vaga'),null);
});
test('porta: só fechada e destrancada',()=>{
 assert.equal(portaFechada(porta()),true);
 assert.equal(portaFechada(porta({estadoInterativo:{aberto:true}})),false);
 assert.equal(portaFechada(porta({estadoInterativo:{trancado:true}})),false);
 assert.equal(portaFechada(porta({bloqueiaMovimento:false})),false);
 assert.equal(portaFechada({id:'m',nome:'Muro',bloqueiaMovimento:true}),false);
});
test('recursos para a toca: pedra e árvore soltas',()=>{
 assert.equal(recursoParaToca({nome:'Rocha média',larguraM:2}),true);
 assert.equal(recursoParaToca({nome:'Árvore grande',larguraM:3}),true);
 assert.equal(recursoParaToca({nome:'Paredão de rocha',larguraM:20}),false);
 assert.equal(recursoParaToca({nome:'Pedra',larguraM:1,colhidoV144:{ate:1}}),false);
 assert.equal(recursoParaToca({nome:'Mesa',larguraM:1}),false);
});
test('toca: objeto e ponto de refúgio',()=>{
 const o=objetoToca({id:'t1',dono:'synccriatura:lobo',nome:'Lobo',x:5,y:5});
 assert.equal(o.tocaV200.dono,'synccriatura:lobo');assert.equal(o.bloqueiaMovimento,false);assert.ok(o.imagem.startsWith('data:image/svg+xml'));
 const q=pontoAtras({x:10,y:5},{x:4,y:5},2);assert.deepEqual(q,{x:12,y:5});
});
function ctx(extra={}){
 return {eu:{x:5,y:5},casa:{x:5,y:5},objs:[],W:28,H:14,lista:[],jogadores:[],mid:'m1',toM:p=>({x:p.x,y:p.y*1}),ponto:(x,y)=>({x,y}),pos:()=>({x:0,y:0}),...extra};
}
const mk=()=>{const dep={doc:(d,p)=>p,db:{},getDoc:async()=>({exists:()=>false}),setDoc:async()=>{},runTransaction:async()=>{},ehMestre:()=>true};const win={};const root={defaultView:win};return instalarExploracao({...dep,root});};
test('exploradora vai até a porta fechada e depois passa',()=>{
 const rnd=Math.random;Math.random=()=>.3;try{
 const X=mk(),t={id:'synccriatura%3Alobo',nome:'Lobo'};
 const c=ctx({objs:[porta({x:12,y:5})]});
 const d1=X.destino(t,'exploradora',c);assert.ok(d1.p.x>5&&d1.p.x<12,'primeiro vai para a frente da porta');
 const pe=X._estado().pend.get(t.id);assert.ok(pe&&pe.objId==='p1'&&pe.alem.x>12,'guarda o ponto do outro lado');
 const d2=X.destino(t,'exploradora',c);assert.equal(d2.acao,'🚪','chegou: abre a porta');
 const d3=X.destino(t,'exploradora',c);assert.ok(d3.p.x>12,'depois passa para o outro lado');
}finally{Math.random=rnd;}
});
test('covarde corre para a toca ou atrás de obstáculo quando há ameaça',()=>{
 const X=mk(),t={id:'synccriatura%3Acoelho',nome:'Coelho'};
 const toca=objetoToca({id:'t1',dono:'synccriatura:coelho',nome:'Coelho',x:20,y:5});
 const d=X.destino(t,'covarde',ctx({objs:[toca],jogadores:[{x:8,y:5}]}));assert.ok(d.fuga&&d.p.x===20,'vai para a toca');
 const rocha={id:'r1',nome:'Rocha',x:3,y:5,larguraM:1.5,alturaM:1.5,bloqueiaMovimento:true};
 const d2=X.destino(t,'covarde',ctx({objs:[rocha],jogadores:[{x:9,y:5}]}));assert.ok(d2.fuga&&d2.p.x<3,'esconde-se atrás da rocha, longe da ameaça');
 const calmo=X.destino(t,'covarde',ctx({jogadores:[{x:25,y:5}]}));assert.ok(!calmo.fuga&&calmo.pausa<3500,'sem ameaça: passeia com pausas curtas');
});
test('construtora junta pedras e constrói a toca',()=>{
 const X=mk(),t={id:'synccriatura%3Atoupeira',nome:'Toupeira'},rocha={id:'r1',nome:'Rocha',x:9,y:5,larguraM:1.5,alturaM:1.5,bloqueiaMovimento:true};
 let d=X.destino(t,'construtora',ctx({objs:[rocha]}));assert.equal(d.recurso,'r1');assert.equal(d.acao,'🪨');
 X.aoColher(t.id,'m1','r1');X.aoColher(t.id,'m1','r1');X.aoColher(t.id,'m1','r1');
 d=X.destino(t,'construtora',ctx());assert.equal(d.acao,'🕳️','volta para casa e constrói');
 assert.equal(X._estado().pend.get(t.id).tipo,'construir');
});

import {papelPorFome,planoAbrigo,aberta,dietaValida,DIETAS} from '../js/mesa-exploracao.js';
test('fome: faminta caça ou procura frutos conforme a dieta',()=>{
 assert.equal(papelPorFome('cacadora',30),'cacadora');assert.equal(papelPorFome('cacadora',80),null);
 assert.equal(papelPorFome('frugivora',30),'forrageira');
 assert.equal(papelPorFome('onivora',40),'forrageira');assert.equal(papelPorFome('onivora',10),'cacadora');
 assert.equal(papelPorFome('',0),null);assert.equal(dietaValida('xyz'),'');assert.ok(DIETAS.cacadora.nome);
});
test('abrigo em casa: o lado de dentro é o mais longe da ameaça; quem já está dentro não precisa',()=>{
 const porta=porta_=>({id:'p',nome:'Porta',x:20,y:7,larguraM:.5,alturaM:1.4,bloqueiaMovimento:true,...porta_});
 const pl=planoAbrigo(porta(),{x:20,y:7},{x:16,y:7},{x:10,y:7});
 assert.ok(pl&&pl.dentro.x>20&&pl.antes.x<20,'ameaça à esquerda: entra pela direita');
 assert.equal(planoAbrigo(porta(),{x:20,y:7},{x:24,y:7},{x:10,y:7}),null,'já está do lado de dentro');
 assert.equal(aberta(porta({estadoInterativo:{aberto:true}})),true);assert.equal(aberta(porta()),false);
});
test('caçadora persegue, mata e come; frugívora come na árvore',async()=>{
 const rnd=Math.random;Math.random=()=>.3;
 try{
  const feridas=[];const dep={doc:(d,p)=>p,db:{},getDoc:async()=>({exists:()=>false}),setDoc:async()=>{},runTransaction:async(db,fn)=>fn({get:async p=>({exists:()=>true,data:()=>({revision:1,actors:{'synccriatura%3Apresa':{combateLab:{hitMax:{'PV Global':10},hit:{'PV Global':10}}}}})}),set:(p,v)=>feridas.push(v)}),ehMestre:()=>true};
  const win={},root={defaultView:win},X=instalarExploracao({...dep,root});
  const t={id:'synccriatura%3Alobo',nome:'Lobo',diametroM:1.2,dietaV200:'cacadora'};
  assert.equal(X.papelDe(t,'vaga'),'cacadora'.length?X.papelDe(t,'vaga'):null);
  X._estado().sat.set(t.id,10);assert.equal(X.papelDe(t,'vaga'),'cacadora');
  const presa={id:'synccriatura%3Apresa',diametroM:.8};
  const c=(x)=>({eu:{x,y:5},casa:{x:5,y:5},objs:[],W:28,H:14,lista:[t,presa],jogadores:[],mid:'m',toM:p=>p,ponto:(a,b)=>({x:a,y:b}),pos:i=>i===presa.id?{x:10,y:5}:{x,y:5},viva:()=>true});
  const d1=X.destino(t,'cacadora',c(5));assert.ok(d1.caca&&d1.p.x>5,'persegue');
  const d2=X.destino(t,'cacadora',c(9.5));assert.equal(d2.acao,'🍖','chegou: ataca e come');
  await new Promise(r=>setTimeout(r,30));assert.ok(feridas.length&&feridas[0].actors['synccriatura%3Apresa'].combateLab.morto,'a presa morreu');
  X.destino(t,'cacadora',c(9.5));assert.equal(X.saciedade(t.id),100,'ficou satisfeita');assert.equal(X.papelDe(t,'vaga'),null,'saciada: volta à rotina');
  // frugívora
  const m={id:'synccriatura%3Amacaco',dietaV200:'frugivora'};X._estado().sat.set(m.id,20);assert.equal(X.papelDe(m,'vaga'),'forrageira');
  const arv={id:'a1',nome:'Árvore grande',x:12,y:5,larguraM:2,alturaM:2,bloqueiaMovimento:true};
  const f1=X.destino(m,'forrageira',{...c(5),lista:[m],objs:[arv]});assert.equal(f1.acao,'🍎');
  X.destino(m,'forrageira',{...c(12),lista:[m],objs:[arv]});assert.equal(X.saciedade(m.id),80,'comeu frutos: +60');
  X.parar();
 }finally{Math.random=rnd;}
});
test('abrigo: NPC abre a porta, entra, fecha e espera',()=>{
 const rnd=Math.random;Math.random=()=>.3;
 try{
  const win={},root={defaultView:win},X=instalarExploracao({doc:(d,p)=>p,db:{},getDoc:async()=>({exists:()=>false}),setDoc:async()=>{},runTransaction:async()=>{},ehMestre:()=>true,root});
  const npc={id:'syncnpc%3Aguarda',nome:'NPC · Guarda'},porta={id:'p1',nome:'Porta',x:20,y:7,larguraM:.5,alturaM:1.4,bloqueiaMovimento:true};
  const c={eu:{x:16,y:7},casa:{x:16,y:7},objs:[porta],W:28,H:14,lista:[npc],jogadores:[{x:10,y:7}],mid:'m',toM:p=>p,ponto:(a,b)=>({x:a,y:b}),pos:()=>({x:16,y:7})};
  const d1=X.destino(npc,'vaga',{...c}); // sem papel de refúgio: só roda se quer()
  const dd=X.destino(npc,'covarde',c);assert.ok(dd.fuga&&dd.p.x>17&&dd.p.x<20,'corre para a frente da porta');
  const ab=X._estado().pend.get(npc.id);assert.equal(ab.tipo,'abrigo');
  assert.equal(X.destino(npc,'covarde',c).acao,'🚪','abre');
  const e1=X.destino(npc,'covarde',c);assert.ok(e1.p.x>20,'entra');
  assert.equal(X.destino(npc,'covarde',c).acao,'🔒','fecha a porta');
  X.parar();
 }finally{Math.random=rnd;}
});

test('bando: quem tem Ajuda anda junto com a mesma espécie',()=>{
 const rnd=Math.random;Math.random=()=>.3;
 try{
  const win={mesaAtitudesIaV200:{atitudeDe:()=>({id:'defensiva',ajuda:1}),mesmoBando:()=>true}};const root={defaultView:win};
  const X=instalarExploracao({doc:(d,p)=>p,db:{},getDoc:async()=>({exists:()=>false}),setDoc:async()=>{},runTransaction:async()=>{},ehMestre:()=>true,root});
  const z={id:'synccriatura%3Azumbi_1',nome:'Zumbi'},o={id:'synccriatura%3Azumbi_1~2',nome:'Zumbi 2'};
  assert.equal(X.papelDe(z,'vaga'),'bando');
  const c={eu:{x:5,y:5},casa:{x:5,y:5},objs:[],W:28,H:14,lista:[z,o],jogadores:[],mid:'m',toM:p=>p,ponto:(a,b)=>({x:a,y:b}),pos:i=>i===o.id?{x:20,y:5}:{x:5,y:5}};
  const d=X.destino(z,'bando',c);assert.ok(d.p.x>15,'vai até o grupo: '+JSON.stringify(d.p));
  const perto=X.destino(z,'bando',{...c,eu:{x:19,y:5},pos:i=>i===o.id?{x:20,y:5}:{x:19,y:5}});assert.ok(Math.abs(perto.p.x-20)<3,'já perto: fica ao redor');
  X.parar();
 }finally{Math.random=rnd;}
});
