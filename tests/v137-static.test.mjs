import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {papelVida,posicaoNaPerna,pontosDeRonda,VELOCIDADE} from '../js/mesa-vida.js';
import {lerControle,ciclar,BOTOES,ZONA} from '../js/mesa-controle.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('v137: papéis de vida fora do combate',()=>{
 assert.equal(papelVida({id:'syncnpc:ur17',texto:'UR-17 robô utilitário'}),'limpeza');
 assert.equal(papelVida({id:'syncnpc:mercante_1',texto:'Mercante',comerciante:true}),'comercio');
 assert.equal(papelVida({id:'syncnpc:guarda_generico_1',texto:'Guarda da cidade'}),'guarda');
 assert.equal(papelVida({id:'syncnpc:x',texto:'Criança de rua'}),'civil');
 assert.equal(papelVida({id:'synccriatura:d',texto:'Dragão-trombeta corredor domesticado'}),'montaria');
 assert.equal(papelVida({id:'synccriatura:c',texto:'Cavalgante prismático, manada'}),'presa');
 assert.equal(papelVida({id:'synccriatura:p',texto:'Predador couraçado'}),'predador');
 assert.equal(papelVida({id:'synccriatura:s',texto:'Sila',mov:0}),'parado');
 assert.ok(VELOCIDADE.fuga>VELOCIDADE.caca&&VELOCIDADE.montado>VELOCIDADE.guarda);
});
test('v137: pernas interpoladas e ronda dentro do mapa',()=>{
 const l={a:[0,0],b:[10,4],t0:1000,d:2000};
 assert.deepEqual(posicaoNaPerna(l,2000),{x:5,y:2,fim:false});assert.equal(posicaoNaPerna(l,9999).fim,true);assert.equal(posicaoNaPerna(null),null);
 const r=pontosDeRonda({x:2,y:2},84,42,10);assert.equal(r.length,4);assert.ok(r.every(p=>p.x>=1&&p.x<=83&&p.y>=1&&p.y<=41));
});
test('v137: leitura do controle (zona morta e borda de botão)',()=>{
 const gp=(axes,press=[])=>({axes,buttons:Array.from({length:17},(_,i)=>({pressed:press.includes(i),value:press.includes(i)?1:0}))});
 let l=lerControle(gp([.1,.1,0,0]));assert.equal(l.mover.m,0);
 l=lerControle(gp([1,0,0,0],[BOTOES.A]));assert.ok(l.mover.x>.99&&l.mover.m<=1);assert.deepEqual(l.apertou,['A']);
 assert.deepEqual(lerControle(gp([0,0,0,0],[BOTOES.A]),l.botoes).apertou,[]); // segurar não repete
 l=lerControle(gp([0,.4,0,0]));assert.ok(l.mover.m>0&&l.mover.m<.55); // leve = devagar
 assert.ok(ZONA>0&&ZONA<.3);assert.equal(ciclar(2,3,1),0);assert.equal(ciclar(0,3,-1),2);assert.equal(ciclar(0,0,1),-1);
});
test('v137: módulos ligados',()=>{
 const app=ler('js/app.js');assert.match(app,/mesa-vida\.js\?v=\d+/);assert.match(app,/mesa-controle\.js\?v=137/);assert.match(app,/nova-direta\.js\?v=\d+/);
 assert.match(ler('js/nova-direta.js'),/andarDirecao,pararAndar/);assert.match(ler('js/mesa-vida.js'),/v137_grande_feira/);
});
