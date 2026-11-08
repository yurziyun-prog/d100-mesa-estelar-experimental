import test from 'node:test';import assert from 'node:assert/strict';
import {zonasDeLava,suportesDeLava,contatoComLava,fatorDeEscalada,ALTITUDE_SEGURA_M} from '../js/mesa-lava.js';
const W=80,H=50,k=x=>x/80*28,ky=y=>y/50*14;
const lava={id:'l',x:k(68.5),y:ky(45),larguraM:13,alturaM:10,erPoca:'lava',rectsV201:[[64,42,9,2],[63,46,11,1],[64,44,10,2]],perigoLavaV205:{tipo:'lava',dano:'2d6',intensidade:1,margemCalorM:1.2}};
const nucleo={id:'n',x:k(68.5),y:ky(43.5),larguraM:5,alturaM:3,erPoca:'lava',rectsV201:[[66,42,5,3]],perigoLavaV205:{tipo:'nucleo',dano:'4d6',intensidade:2}};
const ponte={id:'b',x:k(68.5),y:ky(44.8),larguraM:13,alturaM:1.6,suporteLavaV205:true};
const Z=zonasDeLava([lava,nucleo],W,H),S=suportesDeLava([ponte],W,H);
test('lava exposta queima; núcleo mais forte; fora da forma irregular não há contato',()=>{
 assert.equal(contatoComLava({x:65,y:46.5},Z,[],0,1).tipo,'lava');
 assert.equal(contatoComLava({x:68,y:43},Z,[],0,1).tipo,'nucleo');assert.ok(contatoComLava({x:68,y:43},Z,[],0,1).intensidade>contatoComLava({x:65,y:46.5},Z,[],0,1).intensidade);
 assert.equal(contatoComLava({x:75.5,y:41},Z,[],0,1),null,'longe da lava (nem a margem de calor): sem efeito');
 assert.equal(contatoComLava({x:63,y:44},Z,[],0,1)?.tipo,'calor','junto da borda: só o calor da crosta');
 assert.equal(contatoComLava({x:65,y:46.5},Z,[],0,2),null,'outro nível não queima');
});
test('voo: alto não queima; muito baixo só calor; no chão queima',()=>{
 const p={x:68,y:43};assert.equal(contatoComLava(p,Z,[],ALTITUDE_SEGURA_M,1),null);assert.equal(contatoComLava(p,Z,[],5,1),null);
 assert.equal(contatoComLava(p,Z,[],1.2,1).tipo,'calor');assert.equal(contatoComLava(p,Z,[],.2,1).tipo,'nucleo');
});
test('ponte firme sustenta quem está em cima; fora dela queima',()=>{
 assert.equal(contatoComLava({x:68,y:44.6},Z,S,0,1),null);assert.equal(contatoComLava({x:68,y:46.4},Z,S,0,1)?.tipo,'lava');
});
test('perigo crescente: 1, 1,5, 2, 2,5, 3 e para em 3; poça antiga sem dados vira lava comum',()=>{
 assert.deepEqual([1,2,3,4,5,9].map(fatorDeEscalada),[1,1.5,2,2.5,3,3]);
 assert.equal(zonasDeLava([{id:'x',x:5,y:5,larguraM:4,alturaM:4,erPoca:'lava'}],28,14)[0].tipo,'lava');
});
