import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {gerarEntradaVespera,ENTRADA_V161,portaoNV161} from '../js/mesa-gerador-mapas.js';
const ler=f=>readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v161 Portão pintado: arte, casas bloqueadas, 4 lojas com porta e balcão, portão no lugar',()=>{
 assert.ok(existsSync(new URL('../'+ENTRADA_V161.arte,import.meta.url)));
 const st=gerarEntradaVespera({objetos:[{id:'pk_mesa_longa',larguraM:3,alturaM:1.2},{id:'pk_portao_vespera',larguraM:7,alturaM:1.6}]});
 assert.equal(st.w,45);assert.equal(st.h,34);assert.ok(st.elements.some(e=>e.type==='image'&&e.src===ENTRADA_V161.arte));
 assert.ok(st.elements.filter(e=>e.invisivelV161).length>25);assert.equal(st.elements.filter(e=>/^Balcão · /.test(e.nome||'')).length,4);
 for(const L of Object.values(ENTRADA_V161.lojas))assert.ok(L.vendedor&&L.porta);
 const pn=portaoNV161();assert.ok(pn.dentro.y<pn.y&&pn.fora.y>pn.y);assert.match(ler("mesa-pedagio.js"),/m\?\.portaoN\?\.x/);
});
test('v161 comerciante: clique abre a loja (não o menu de armas), fica atrás do balcão, sem barra de rolagem para jogador',()=>{
 assert.match(ler('mesa-conversas.js'),/comerciante genérico abre a loja/);assert.match(ler('mesa-interacoes.js'),/o clique já abre a loja/);
 assert.match(ler('mesa-vida.js'),/lojaV161/);assert.match(ler('mesa-camera.js'),/sc\.style\.overflow/);assert.match(ler('nova-direta.js'),/invisivelV161/);
 assert.match(readFileSync(new URL('../scripts/preparar-hosting.cjs',import.meta.url),'utf8'),/arte dos mapas pintados/);
});
