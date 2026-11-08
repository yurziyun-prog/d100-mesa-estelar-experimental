import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {LUGARES,lugarDe} from '../js/mesa-barras.js';import {JANELAS,AJUDA} from '../js/mesa-controle.js';
const ler=f=>readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v159 menus fixos ficam em faixas fora do mapa',()=>{
 for(const id of ['moTodos','moSoltar','mlGeral','cpBotao','efSom','mcBotao','psBarra','rlChip','vkCarteira','vkMestre','lzBotao','camZoom','maLegenda','nvBotao'])assert.ok(lugarDe(id),id);
 for(const [f,re] of [['mesa-relogio.js',/!chip\|\|!chip\.isConnected/],['mesa-posturas.js',/!barra\.isConnected/],['mesa-vaelkor.js',/!carteira\.isConnected/],['mesa-limpeza.js',/!botao\.isConnected/]])assert.match(ler(f),re);
 assert.match(ler('mesa-camera.js'),/--mz-inv/);
});
test('v159 controle: alavanca direita escolhe (não rola a moldura) e janelas são navegáveis',()=>{
 const c=ler('mesa-controle.js');assert.doesNotMatch(c,/alvo\.scrollLeft\+=dx/);assert.match(c,/escolherNaDirecao/);assert.ok(JANELAS.includes('#moBalao'));assert.match(AJUDA,/janela aberta/);
});
