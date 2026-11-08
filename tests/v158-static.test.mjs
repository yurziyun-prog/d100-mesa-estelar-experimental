import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {baseJogador,NIVEIS_JOGADOR} from '../js/mesa-camera.js';
const ler=f=>readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v158 jogador vê na escala de 1 m por quadrado; panorâmico só se o mestre ligar',()=>{
 assert.equal(baseJogador(28),1);assert.equal(baseJogador(56),2.8);assert.equal(baseJogador(84),4.2);assert.equal(baseJogador(84,true),1);assert.equal(baseJogador(14),1);
 assert.equal(NIVEIS_JOGADOR[0],1);assert.match(ler('mesa-camera.js'),/mesaCamera/);
});
test('v158 módulos usam o mapa que a tela mostra (não o do mestre)',()=>{
 assert.match(ler('mesa-pedagio.js'),/ctxMapaId\|\|ctl\(\)\?\.mapaAtual/);assert.match(ler('mesa-objetos.js'),/outraV158\(\)/);assert.match(ler('mesa-tetos.js'),/outraV158\(\)/);
 assert.match(ler('mesa-objetos.js'),/cenaDoc\(cmd\.mapId\)/);
});
test('v158 fome e sede acima do mapa, zzZ e NPCs dormem em casa',()=>{
 assert.match(ler('mesa-relogio.js'),/rlNecTopo/);assert.doesNotMatch(ler('mesa-relogio.js'),/transform:translate\(10%,-150%\)/);
 const n=ler('mesa-noite.js');assert.match(n,/nt-z/);assert.doesNotMatch(n,/ausente:'🌙'/);assert.match(n,/async function irParaCasa/);assert.match(n,/BEBADO/);
});
