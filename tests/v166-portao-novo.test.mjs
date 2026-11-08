import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {PORTAO_IA2,gerarPortaoIA2} from '../js/mesa-mapa-ia.js';
import {livrePerto} from '../js/mesa-ligacoes.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('v166 Portão com a imagem nova: arte, casas com terraço, escadas, vendedores fora das paredes',()=>{
 assert.ok(existsSync(new URL('../'+PORTAO_IA2.arte,import.meta.url))&&existsSync(new URL('../'+PORTAO_IA2.acima,import.meta.url)));
 const st=gerarPortaoIA2();assert.ok(st.portaoV166&&st.portaoN.dentro.y<st.portaoN.y);
 assert.ok(PORTAO_IA2.marcas.filter(m=>m.tipo==='terraco').length>=20);assert.ok(st.elements.filter(e=>e.escadaAndarV144).length>=10);
 const bloq=PORTAO_IA2.marcas.filter(m=>['terraco','parede','rocha','movel'].includes(m.tipo));
 for(const v of [...PORTAO_IA2.vendedores,PORTAO_IA2.denzel])assert.ok(!bloq.some(m=>v.x>m.x&&v.x<m.x+m.w&&v.y>m.y&&v.y<m.y+m.h),'livre: '+(v.id||'Denzel'));
 const r=ler('js/mesa-remodelagem.js');assert.match(r,/portaoNovoV166/);assert.match(r,/portaoTrocaV165/);
});
test('v166 andar de cima não barra quem chega/anda no térreo (chegada, sono, posturas, combate)',()=>{
 const objs=[{x:14,y:7,larguraM:4,alturaM:4,bloqueiaMovimento:true,oficinaElement:{andarV144:2}}];
 assert.deepEqual(livrePerto(objs,14,7,28,14),{x:14,y:7});
 for(const f of ['js/mesa-noite.js','js/mesa-posturas.js','js/mesa-diretor.js','js/mesa-remodelagem.js'])assert.match(ler(f),/andarV144\?\?1\)>1/,f);
});
test('v166 marcador: marcas num documento próprio, marcas tiradas do mapa e "Ver colisão"',()=>{
 const m=ler('js/mesa-marcador.js');assert.match(m,/combatesAtivos\/marcasMapa_/);assert.match(m,/function marcasDaCena/);assert.match(m,/data-col/);assert.match(m,/Ver colisão/);
 assert.match(m,/#mkSvg\{position:absolute;left:0;top:0;width:100%;height:100%;z-index:35;/,'abaixo da barra do mestre');
});
test('v167 marcador: colisões do mapa viram marcas selecionáveis; arrastar move e cantos mudam o tamanho',()=>{
 const m=readFileSync(new URL('../js/mesa-marcador.js',import.meta.url),'utf8');
 assert.match(m,/function juntarDaCena/);assert.match(m,/function moverMarca/);assert.match(m,/arrasto=\{id:ms\.id/);assert.match(m,/e\.bloqueiaVisao\?\?o\.bloqueiaVisao/);
});
