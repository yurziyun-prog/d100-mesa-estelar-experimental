import test from 'node:test';import assert from 'node:assert/strict';
import {pocasDeAgua,profundidadeNoPonto,modoDeAgua,PROFUNDIDADE_M} from '../js/mesa-agua-visual.js';
const W=80,H=50,lago={id:'l',x:13*28/80,y:25*14/50,larguraM:20,alturaM:13,erPoca:'agua',rectsV201:[[3,20,20,10]]},fundo={id:'f',x:13*28/80,y:25*14/50,larguraM:8,alturaM:4,erPoca:'agua_profunda',rectsV201:[[9,23,8,4]]},lava={id:'v',x:60*28/80,y:40*14/50,larguraM:5,alturaM:5,erPoca:'lava'};
const P=pocasDeAgua([lago,fundo,lava],W,H);
test('lava não entra no módulo de água; água tem material',()=>{assert.equal(P.length,2);assert.deepEqual(P.map(p=>p.tipo).sort(),['agua','agua_profunda']);});
test('profundidade é gradual: zero fora, cresce da margem ao miolo, fundo é mais fundo',()=>{
 assert.equal(profundidadeNoPonto({x:1,y:25},P,1).prof,0);
 const margem=profundidadeNoPonto({x:3.3,y:25},P,1).prof,meio=profundidadeNoPonto({x:7,y:25},P,1).prof,fundoM=profundidadeNoPonto({x:13,y:25},P,1).prof;
 assert.ok(margem<meio&&meio<fundoM&&fundoM<=PROFUNDIDADE_M.agua_profunda,[margem,meio,fundoM].join('<'));
 assert.equal(profundidadeNoPonto({x:13,y:25},P,2).prof,0,'outro nível não tem esta água');
});
test('mesma profundidade, corpos diferentes: humano 1,8 m vs cão 0,9 m',()=>{
 const prof=.6,fracHumano=prof/(1.8*.85),fracCao=prof/(.9*.85);assert.ok(fracHumano<.5&&fracCao>=.5,'o humano vadeia onde o cão já nada: '+fracHumano.toFixed(2)+' vs '+fracCao.toFixed(2));
 assert.equal(modoDeAgua(fracHumano),'vadeando');assert.equal(modoDeAgua(fracCao),'nadando');
});
test('histerese: não oscila na borda entre vadear e nadar',()=>{
 let m='vadeando';const trilha=[.45,.52,.48,.51,.46,.5,.49];const modos=trilha.map(f=>m=modoDeAgua(f,m));
 const trocas=modos.filter((x,i)=>i&&x!==modos[i-1]).length;assert.ok(trocas<=1,'trocas: '+trocas+' '+modos.join(','));
 assert.equal(modoDeAgua(.2,'nadando'),'vadeando','sai do nado só abaixo de 0,35');assert.equal(modoDeAgua(.02,'vadeando'),'seco');assert.equal(modoDeAgua(0,'seco'),'seco');
});
