import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {pesoDeTexto,pesoObjeto,capacidade,fatorArrasto,posicaoAtras,tokenArrastavel,objetoArrastavel} from '../js/mesa-arrastar.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v136: arrastar — peso, Força e velocidade',()=>{
 assert.equal(pesoDeTexto('80 kg'),80);assert.equal(pesoDeTexto('~18 t de biomassa'),18000);assert.equal(pesoDeTexto(''),75);
 assert.equal(capacidade(10),80);
 assert.ok(fatorArrasto(40,80)>fatorArrasto(80,80));assert.equal(fatorArrasto(400,80),0); // pesado demais sozinho
 assert.ok(fatorArrasto(400,80+120+120)>0); // com ajuda
 const p=posicaoAtras({x:10,y:5},0,1.2);assert.ok(Math.abs(p.x-8.8)<1e-9&&p.y===5);
 assert.ok(tokenArrastavel({inconsciente:true}));assert.ok(tokenArrastavel({morto:true}));assert.ok(!tokenArrastavel({}));
 assert.ok(objetoArrastavel({nome:'Caixote',larguraM:1,alturaM:1}));assert.ok(!objetoArrastavel({nome:'Parede'}));assert.ok(!objetoArrastavel({nome:'Porta da cápsula 3'}));
 assert.ok(!objetoArrastavel({nome:'Piso',oficinaElement:{type:'shape'}}));assert.ok(pesoObjeto({nome:'Cofre',material:'Metal',larguraM:1,alturaM:1})>pesoObjeto({nome:'Caixote',larguraM:1,alturaM:1}));
 assert.match(ler('nova-direta.js'),/mesaVelocidadeV136/);assert.match(ler('mesa-objetos.js'),/data-arrastar/);assert.match(ler('app.js'),/mesa-arrastar\.js\?v=136/);
});
