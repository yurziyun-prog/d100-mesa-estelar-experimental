import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {elementosDeMarcas,ETIQUETAS} from '../js/mesa-marcas.js';
import {coberturas,tokenVisivel,barra} from '../js/mesa-andares.js';
import {CIDADE_BAIXA,gerarCidadeBaixaIA} from '../js/mesa-mapa-cidade-baixa.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('v164 terraço: casa barra a rua, em cima só se anda no terraço, escada de fora liga rua e terraço',()=>{
 const M=[{id:'t',tipo:'terraco',forma:'ret',x:4,y:4,w:6,h:5,nome:'Casa'},{id:'e',tipo:'escada',forma:'ret',x:10,y:6,w:1.2,h:2}];
 const els=elementosDeMarcas(M,{W:20,H:14});
 assert.ok(ETIQUETAS.terraco.terraco);
 const rua=els.filter(e=>e.bloqueiaMovimento&&!e.andarV144);assert.ok(rua.length>=1,'a casa barra quem está na rua');
 const beira=els.filter(e=>e.andarV144===2&&e.bloqueiaMovimento);assert.ok(beira.length>=3,'fora do terraço é vazio no 2º andar');
 const piso=els.filter(e=>e.pisoAndarV144===2);assert.ok(piso.length>=1&&piso.every(e=>e.abertoV164&&!e.bloqueiaMovimento));
 const esc=els.find(e=>e.escadaAndarV144);assert.ok(esc&&esc.andarAmbosV144);const s=esc.saidaAndarV144;
 // saída de cima dentro do terraço, saída de baixo fora da casa (coordenadas da mesa 28×14)
 const m=p=>({x:p.x*20/28,y:p.y*14/14});assert.ok(m(s[2]).x>4.4&&m(s[2]).x<9.6&&m(s[2]).y>4.4&&m(s[2]).y<8.6);assert.ok(m(s[1]).x>=10||m(s[1]).y>=9||m(s[1]).y<=4);
});
test('v164 andares: quem está num terraço aberto é visto da rua; paredes da rua não barram o terraço',()=>{
 const objs=[{id:'p',x:7,y:7,larguraM:6,alturaM:5,pisoAndarV144:2,andarV144:2,abertoV164:true},{id:'w',x:7,y:7,larguraM:6,alturaM:5,bloqueiaMovimento:true}];
 const cob=coberturas(objs,28,14);assert.equal(tokenVisivel({x:7,y:7},2,1,cob),true);assert.equal(tokenVisivel({x:20,y:7},2,1,cob),false);
 assert.equal(barra(objs[1],2),false);assert.equal(barra(objs[1],1),true);
});
test('v164 Cidade Baixa da imagem: arte, casas com terraço, escadas que sobem, feira, interior pelo marcador',()=>{
 assert.ok(existsSync(new URL('../'+CIDADE_BAIXA.arte,import.meta.url))&&existsSync(new URL('../'+CIDADE_BAIXA.acima,import.meta.url)));
 const st=gerarCidadeBaixaIA();assert.ok(Math.abs(st.w-73.3)<.01);
 assert.ok(CIDADE_BAIXA.marcas.filter(m=>m.tipo==='terraco').length>=50);assert.ok(st.elements.filter(e=>e.escadaAndarV144).length>=15);
 assert.ok(JSON.stringify(st).length<500000);assert.equal(CIDADE_BAIXA.vendedores.length,6);
 const mk=ler('js/mesa-marcador.js');assert.match(mk,/async function criarInterior/);assert.match(mk,/interiorV164/);
 assert.match(ler('js/mesa-remodelagem.js'),/cidadeBaixaIAV164/);
});
