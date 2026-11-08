import test from 'node:test';
import assert from 'node:assert/strict';
import {ehChao} from '../js/mesa-chao.js';
test('chão (v205): só o fundo do mapa é chão; pisos, pontes e calçadas menores são peças comuns',()=>{
 assert.equal(ehChao({nome:'Chão do mapa',erTipo:'piso'}),true);
 assert.equal(ehChao({nome:'Piso',larguraM:3,alturaM:3,camada:2}),false,'piso pequeno é arrastável');
 assert.equal(ehChao({nome:'Chão · Pedra',erTipo:'piso',larguraM:13,alturaM:1.6}),false,'ponte/passarela de piso é arrastável');
 assert.equal(ehChao({nome:'Chão · Terra',erTipo:'piso',larguraM:28,alturaM:14,camada:1}),true,'o piso que cobre o mapa é o fundo');
 assert.equal(ehChao({nome:'Calçada de pedra'}),false);
 assert.equal(ehChao({nome:'Peça',larguraM:26,alturaM:13,camada:1}),true,'cobre o mapa');
 assert.equal(ehChao({nome:'Mesa',larguraM:2,alturaM:1,camada:3}),false);
 assert.equal(ehChao({nome:'Parede',larguraM:26,alturaM:13,camada:1,bloqueiaMovimento:true}),false);
 assert.equal(ehChao({nome:'Poça',erTipo:'poca'}),false,'poça pode ser movida');
 assert.equal(ehChao(null),false);
});
