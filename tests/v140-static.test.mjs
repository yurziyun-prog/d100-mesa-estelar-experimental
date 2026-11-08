import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {posturaDe,velocidadePostura,berroConectou,distanciaEmpurrao,empurrar,POSTURAS} from '../js/mesa-posturas.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('v140: posturas',()=>{
 assert.equal(posturaDe(null),'em_pe');assert.equal(posturaDe({postura:'agachado'}),'agachado');assert.equal(posturaDe({combateLab:{caido:true}}),'caido');
 assert.equal(posturaDe({postura:'caido',combateLab:{caido:false}}),'em_pe'); // levantou pela ação da ficha
 assert.equal(posturaDe({levantandoAte:Date.now()+1000}),'levantando');
 assert.equal(velocidadePostura('agachado'),.5);assert.equal(velocidadePostura('rastejando'),.25);assert.equal(velocidadePostura('caido'),0);assert.equal(Object.keys(POSTURAS).length,4);
 const app=ler('js/app.js');assert.match(app,/name:'agachado',value:10/);assert.match(app,/rastejando \(alvo baixo\)/);
 assert.match(ler('js/nova-direta.js'),/mesaPosturaVelocidadeV140/);assert.match(ler('js/mesa-tempo-real.js'),/mesaPosturaVelocidadeV140/);
});
test('v140: berro sonoro empurra, derruba e ensurdece',()=>{
 const ev=m=>({source:{id:'d'},target:{id:'k'},message:m});
 assert.deepEqual(berroConectou(ev('⚡ Dragão-Trombeta → Kael: Combate Desarmado · Trombeta · dano rolado 6 · dano tomado 2')),{dano:6});
 assert.equal(berroConectou(ev('⚡ Dragão-Trombeta → Kael: Combate Desarmado · Mordida · dano rolado 6')),null); // nome do atacante não conta
 assert.equal(berroConectou(ev('⚡ Dragão-Trombeta → Kael: Combate Desarmado · Trombeta · 90/68 · Falha')),null); // errou
 assert.equal(berroConectou({...ev('⚡ Kael: Grito Psíquico · dano rolado 3'),item:{nome:'Grito Psíquico'}}),null);
 assert.ok(distanciaEmpurrao(6,1)>distanciaEmpurrao(6,3));assert.ok(distanciaEmpurrao(30,1)<=5);
 const e=empurrar({de:{x:10,y:7},alvo:{x:12,y:7},dist:3,objetos:[{x:14,y:7,larguraM:1,alturaM:4,bloqueiaMovimento:true}]});assert.equal(e.bateu,'parede');assert.ok(e.x>12&&e.x<13.6);
});
test('v140: psi no tempo real, entrada no mapa 1 e sem menus para o jogador',()=>{
 assert.match(ler('js/mesa-tempo-real.js'),/async function assumirPsi/);assert.match(ler('js/nova-ataques.js'),/assumirPsi/);assert.match(ler('js/mesa-acoes-mapa.js'),/kind:'direct-psi',actorId/);
 const d=ler('js/nova-direta.js');assert.match(d,/function entrarSozinhoV140/);assert.match(d,/espacoportoV138\|\|String\(m\?\.id\)==='v138_espacoporto'/);
});
