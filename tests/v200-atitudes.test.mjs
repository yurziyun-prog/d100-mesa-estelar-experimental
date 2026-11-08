import test from 'node:test';
import assert from 'node:assert/strict';
import {atitudeDe,engaja,faccaoDaAtitude,separar} from '../js/mesa-atitudes-ia.js';
import {colapsarVida,pvDe} from '../js/mesa-vida-simples.js';

const cri=(n,extra={})=>({id:encodeURIComponent('synccriatura:lobo'+(n>1?'~'+n:'')),x:10,y:7,diametroM:1,...extra});
const npc=(extra={})=>({id:encodeURIComponent('syncnpc:guarda'),x:12,y:7,diametroM:1,...extra});
const jog={id:'p1',donoUid:'u1',x:11,y:7,diametroM:1};
const mk=(padroes,agress={})=>{const atitude=t=>atitudeDe(t,{padroes});return {atitude,agressorDe:id=>agress[id]||null,casa:t=>({x:t.x*1,y:t.y*1}),W:28,H:14,aliadosDe:t=>[]};};

test('atitude: padrão da espécie, ajuste do token e NPC defensivo',()=>{
 const pad={lobo:{atitude:'agressiva',grupo:'a',territorioM:5}};
 assert.equal(atitudeDe(cri(1),{padroes:pad}).origem,'especie');
 assert.equal(atitudeDe(cri(2,{atitudeV200:'sanguinaria'}),{padroes:pad}).id,'sanguinaria');
 assert.equal(atitudeDe(cri(1),{padroes:{}}),null);
 assert.deepEqual(atitudeDe(npc(),{}),{id:'defensiva',grupo:'a',territorioM:0,origem:'padrao-npc',confianca:null,ajuda:0});
 assert.equal(atitudeDe(jog,{padroes:pad}),null);
});
test('facção da atitude: aliada usa o grupo; as outras, cada um por si',()=>{
 assert.equal(faccaoDaAtitude({id:'aliada',grupo:'b'}),'b');
 assert.equal(faccaoDaAtitude({id:'sanguinaria'}),'selvagens');
 assert.equal(faccaoDaAtitude(null),null);
});
test('engajamento: sanguinária ataca todos; defensiva só revida; aliada nunca ataca aliado',()=>{
 const ctx=mk({lobo:{atitude:'sanguinaria'}});
 assert.equal(engaja(cri(1),jog,ctx),true);
 const d=mk({lobo:{atitude:'defensiva'}});
 assert.equal(engaja(cri(1),jog,d),false);
 assert.equal(engaja(cri(1),jog,mk({lobo:{atitude:'defensiva'}},{[cri(1).id]:'p1'})),true);
 const al=mk({lobo:{atitude:'aliada',grupo:'a'}},{[cri(1).id]:'x'});
 const outro=cri(2);
 assert.equal(engaja(cri(1),outro,{...al,agressorDe:()=>outro.id}),false,'mesmo atacada, não ataca aliado do grupo');
});
test('agressiva: só quem entra no território',()=>{
 const ctx=mk({lobo:{atitude:'agressiva',territorioM:4}});
 assert.equal(engaja(cri(1),{...jog,x:12,y:7},ctx),true);
 assert.equal(engaja(cri(1),{...jog,x:24,y:7},ctx),false);
});
test('vida simples: partes do corpo viram um PV só',()=>{
 const c=colapsarVida({hitMax:{Cabeça:4,Torso:8},hit:{Cabeça:4,Torso:-1},armor:{Cabeça:0,Torso:2},ferimentos:{Torso:'grave'}});
 assert.deepEqual(c.hitMax,{'PV Global':12});assert.equal(c.hit['PV Global'],3);assert.deepEqual(c.ferimentos,{});assert.ok(!c.inconsciente&&!c.morto);
 assert.equal(colapsarVida({hitMax:{a:5},hit:{a:-1}}).inconsciente,true);
 assert.equal(colapsarVida({hitMax:{a:8},hit:{a:-3}}).morto,true);
 assert.deepEqual(pvDe({hitMax:{a:5,b:5},hit:{a:2,b:5}}),[7,10]);
});
test('separar: empurra miniatura sobreposta',()=>{
 const q=separar({x:10,y:7},cri(1),[cri(2,{x:10.2,y:7})]);assert.ok(q&&Math.hypot(q.x-10.2,q.y-7)>=.8);
 assert.equal(separar({x:3,y:3},cri(1),[cri(2,{x:20,y:7})]),null);
});

import {CONFIANCA,AJUDA,modeloBase,confiancaValida,ajudaValida} from '../js/mesa-atitudes-ia.js';
test('Skyrim: Confiança e Ajuda vêm do token, da espécie ou do padrão',()=>{
 const pad={lobo:{atitude:'defensiva',confianca:2,ajuda:1}};
 const a=atitudeDe(cri(1),{padroes:pad});assert.equal(a.confianca,2);assert.equal(a.ajuda,1);
 const b=atitudeDe(cri(2,{atitudeV200:'defensiva',confiancaV200:0,ajudaV200:''}),{padroes:pad});assert.equal(b.confianca,0,'token manda');assert.equal(b.ajuda,1,'vazio = padrão da espécie');
 assert.equal(atitudeDe(cri(1),{padroes:{lobo:{atitude:'aliada'}}}).ajuda,2,'aliada ajuda espécie e grupo por padrão');
 assert.equal(atitudeDe(cri(1),{padroes:{lobo:{atitude:'agressiva'}}}).confianca,null);
 assert.equal(confiancaValida(9),null);assert.equal(ajudaValida('2'),2);assert.equal(CONFIANCA[0].combate,'covarde');assert.equal(CONFIANCA[3].combate,'furia');assert.ok(AJUDA[2].nome);
});
test('Agressão pacífica: nunca ataca, nem revidando',()=>{
 const ctx=mk({lobo:{atitude:'pacifica'}},{[cri(1).id]:'p1'});
 assert.equal(engaja(cri(1),jog,ctx),false);
});
test('Ajuda: defensiva com ajuda socorre o bando; sem ajuda não',()=>{
 const A=cri(1),B=cri(2),agr={...jog,id:'inimigo'};
 const mkc=(ajuda)=>{const base=mk({lobo:{atitude:'defensiva',ajuda}},{[B.id]:'inimigo'});return {...base,ajudantesDe:()=>[B]};};
 assert.equal(engaja(A,agr,mkc(1)),true,'o irmão foi atacado por "inimigo": ajuda');
 assert.equal(engaja(A,agr,mkc(0)),false,'sem ajuda: não se mete');
 assert.equal(modeloBase(cri(3)),'lobo');
 const outro={id:encodeURIComponent('synccriatura:lobo~9'),x:11,y:7,diametroM:1};
 assert.equal(engaja(A,outro,mkc(1)),false,'não ajuda contra alguém do próprio bando');
});

import {chaveEspecie} from '../js/mesa-atitudes-ia.js';
test('mesma espécie: com Ajuda ligada não se atacam (nem sanguinária), mesmo sendo modelos diferentes',()=>{
 assert.equal(chaveEspecie('Humanoide parasitado (estágio avançado)'),'humanoide parasitado');
 assert.equal(chaveEspecie('Humanoide parasitado'),'humanoide parasitado');
 const zumbi={id:encodeURIComponent('synccriatura:zumbi_1'),x:10,y:7,diametroM:1},chefe={id:encodeURIComponent('synccriatura:cadaver_de_chefe'),x:11,y:7,diametroM:1};
 const ctx=(ajuda)=>({atitude:t=>atitudeDe(t,{padroes:{zumbi_1:{atitude:'sanguinaria',ajuda},cadaver_de_chefe:{atitude:'sanguinaria',ajuda}}}),agressorDe:()=>null,casa:t=>({x:t.x,y:t.y}),W:28,H:14,aliadosDe:()=>[],mesmoBando:(a,b)=>/synccriatura/.test(decodeURIComponent(b.id))});
 assert.equal(engaja(zumbi,chefe,ctx(1)),false,'Ajuda: mesma espécie → não se atacam');
 assert.equal(engaja(zumbi,chefe,ctx(0)),true,'sem Ajuda a sanguinária ataca todo mundo');
 assert.equal(engaja(zumbi,jog,ctx(1)),true,'mas continua atacando quem é de fora');
});

import {instalarAtitudes} from '../js/mesa-atitudes-ia.js';
test('gravar no token usa a revisão ATUAL do servidor e tenta de novo (evita permission-denied quando a vida/tempo real mexem no token)',async()=>{
 const gravados=[];let revServidor=7,falhas=1;
 const dep={doc:(d,p)=>p,db:{},getDoc:async()=>({exists:()=>true,data:()=>({revision:revServidor})}),
  setDoc:async(p,d)=>{if(falhas-->0){revServidor=9;const e=new Error('permission-denied');e.code='permission-denied';throw e;}gravados.push({p,d});},
  onSnapshot:()=>()=>{},ehMestre:()=>true,uid:()=>'m',controller:()=>null,root:{defaultView:{}}};
 const A=instalarAtitudes(dep);
 const t={id:'synccriatura%3Alobo',revision:1}; // token "velho" na tela: revisão 1; no servidor já está em 7 e vai a 9
 await A.definirToken(t,{dieta:'cacadora'});
 assert.equal(gravados.length,1);assert.equal(gravados[0].d.revision,10,'revisão do servidor (9) + 1, não a da tela');assert.equal(gravados[0].d.dietaV200,'cacadora');
 A.parar();
});
