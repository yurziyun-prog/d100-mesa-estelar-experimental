import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {LOJAS_PORTAO,CARAVANAS_PORTAO} from '../js/mesa-gerador-mapas.js';import {RACAS} from '../js/mesa-comerciantes.js';import {ESPECIES_NPC} from '../js/mesa-diretor-dados.js';
const ler=f=>readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v160 barracas em que se entra no Portão, com comerciantes alien/robô e caravanas',()=>{
 assert.equal(LOJAS_PORTAO.length,4);for(const L of LOJAS_PORTAO){assert.ok(L.vendedor.y>L.y&&L.vendedor.y<L.y+L.h);assert.ok(RACAS.includes(L.especie));}
 assert.ok(LOJAS_PORTAO.some(L=>L.especie==='robo'));assert.ok(ESPECIES_NPC.robo);assert.equal(CARAVANAS_PORTAO.length,2);
 const g=ler('mesa-gerador-mapas.js');assert.match(g,/tetoV139:true,lojaV160/);assert.match(g,/Balcão · /);
 const r=ler('mesa-remodelagem.js');assert.match(r,/portaoLojasV160/);assert.match(r,/Dragão-trombeta de carga/);assert.match(ler('mesa-vida.js'),/de carga/);
});
test('v160 Restaurar do mestre também zera fome/sede/sono e devolve Sorte e PP de quem está no mapa',()=>{
 assert.match(ler('nova-direta.js'),/mesa-restaurar-v160/);const l=ler('mesa-limpeza.js');assert.match(l,/mesa-restaurar-v160/);assert.match(l,/patch\.pontosSorte/);assert.match(l,/pontosMagiaGastos=0/);
});
