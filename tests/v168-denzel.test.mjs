import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {elementosDeMarcas} from '../js/mesa-marcas.js';
import {doMarcador} from '../js/mesa-fixos.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('v168 pedágio: portão pela cena, pelo mapa (se fizer sentido) ou pelo Denzel; balão não fecha sozinho',()=>{
 const p=ler('js/mesa-pedagio.js');
 assert.match(p,/port\[aã\]o de v\[eé\]spera\$\/i\.test\(String\(o\.nome/);assert.match(p,/Number\(m\.portaoN\.y\)>=Number\(d\.y\)/);
 assert.match(p,/dist\(a,d\)>ALCANCE\+3\)fechar\(\)/);assert.match(p,/cenaCtx=sn\.exists\(\)/);
});
test('v168 marcas com nome de portão viram ponto "Portão de Véspera" (não barra); fixos ignora objetos do Marcador',()=>{
 const els=elementosDeMarcas([{id:'g',tipo:'parede',forma:'ret',x:13.8,y:3.6,w:6.2,h:.6,nome:'Portão de Véspera'}],{W:32,H:48});
 const g=els.find(e=>e.nome==='Portão de Véspera');assert.ok(g&&!g.bloqueiaMovimento&&g.portaoV168);
 assert.ok(doMarcador({id:'oficina:s:gen163:1a'})&&doMarcador({id:'x',oficinaElement:{fundoV161:true}})&&!doMarcador({id:'cadeira1'}));
 assert.match(ler('js/mesa-remodelagem.js'),/posição do portão corrigida/);
});
test('v169: mesa parada no mapa "imagem IA" (apagado) é reaberta no Portão de Véspera',()=>{
 assert.match(ler('js/mesa-remodelagem.js'),/openMap\?\.\(ID\);feitos\.push\('mesa aberta no Portão de Véspera/);
});
