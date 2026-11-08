import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {gerarPortaoV162,PORTAO_V162} from '../js/mesa-gerador-mapas.js';
import {DESENHOS,PACOTE_NOVO,desenharObjeto} from '../js/mesa-arte-objetos.js';
const ler=f=>readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v162 kit do deserto: desenhos novos, exportados e com detalhes (pedras, sulcos, rachaduras)',()=>{
 for(const k of ['casa_terraco','casa_cupula','barraco','varal','agave','toldo','rachaduras'])assert.ok(DESENHOS[k],k);
 const ids=['pk_casa_ret','pk_casa_redonda','pk_casa_losango','pk_casa_l','pk_casa_oval','pk_casa_cupula','pk_barraco','pk_varal','pk_agave','pk_toldo_rubi','pk_rachaduras','pk_patio_loja_n'];
 for(const id of ids){const o=PACOTE_NOVO.find(x=>x.id===id);assert.ok(o,id);const svg=desenharObjeto(o.receita||o,o.larguraM||2,o.alturaM||2,7);assert.match(svg,/^<svg/);assert.ok(svg.length>1500,id);}
 assert.equal(PACOTE_NOVO.find(x=>x.id==='pk_varal').camada,5);
 assert.match(ler('mesa-arte-ui.js'),/DESENHOS/);
});
test('v162 Portão (nossa arte): mapa separado, lojas com vendedor e porta, pintura de chão própria',()=>{
 assert.ok(existsSync(new URL('../arte/mapas/portao-vespera-chao.webp',import.meta.url)));
 assert.ok(existsSync(new URL('../arte/mapas/portao-vespera.webp',import.meta.url)),'mapa pintado continua como plano B');
 const st=gerarPortaoV162({objetos:PACOTE_NOVO});
 assert.equal(st.w,PORTAO_V162.W);assert.ok(st.portaoV162&&st.portaoN);
 assert.ok(st.elements.length>80);assert.ok(st.elements.some(e=>e.invisivelV161));
 for(const L of PORTAO_V162.lojas)assert.ok(PORTAO_V162.lojasCalc?.[L.id]?.vendedor&&PORTAO_V162.lojasCalc[L.id].porta,L.id);
 const r=ler('mesa-remodelagem.js');assert.match(r,/portaoKitV162/);assert.match(r,/v162_portao_kit/);
});
