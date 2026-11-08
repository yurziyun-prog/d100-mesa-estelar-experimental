import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {VEICULOS,NAVES} from '../js/mesa-concessionaria.js';
import {RAMOS,itensDoRamo} from '../js/mesa-lojas.js';
test('v171 catálogo: 16 veículos e 16 naves com imagem, preço e medida; ramos de vitrine',()=>{
 assert.equal(VEICULOS.length,16);assert.equal(NAVES.length,16);
 for(const v of [...VEICULOS,...NAVES]){assert.ok(v.preco>0&&v.imagem&&existsSync(new URL('../'+v.imagem,import.meta.url)),v.id);assert.match(v.dimensoes,/m$/);}
 assert.ok(VEICULOS.find(v=>v.id==='ia_scooter_turquesa').preco<NAVES.find(v=>v.id==='ia_nave_cargueiro_dourado').preco/100);
 assert.equal(RAMOS.veiculos.vitrine,'veiculos');assert.deepEqual(itensDoRamo('naves',[{id:'x',nome:'Nave',categoria:'Naves',preco:1}]),[]);
 const r=readFileSync(new URL('../js/mesa-remodelagem.js',import.meta.url),'utf8');assert.match(r,/veiculosDecoV171/);assert.match(r,/Estaleiro de Véspera/);
 assert.match(readFileSync(new URL('../js/mesa-lojas.js',import.meta.url),'utf8'),/mesaConcessionariaV171\.abrir/);
});
