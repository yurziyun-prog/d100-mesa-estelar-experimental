import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {MODELOS_HOSPEDADOS,AGUA_OASIS} from '../js/mesa-gpt-mapas.js';
import {precisaAliviar} from '../js/mesa-leveza.js';
import {destinoSemColisao} from '../js/nova-colisao.js';
test('v178 modelos dos mapas do GPT existem como arquivo; imagem embutida grande é aliviada',()=>{
 for(const id of MODELOS_HOSPEDADOS)assert.ok(existsSync(new URL('../arte/modelos/'+id+'.webp',import.meta.url)),id);
 assert.ok(precisaAliviar({id:'therion_oasis',imagem:'data:image/webp;base64,AAA'}));
 assert.ok(!precisaAliviar({id:'x',imagem:'data:image/svg+xml,'+'a'.repeat(100)}));assert.ok(precisaAliviar({id:'x',imagem:'data:image/png;base64,'+'a'.repeat(50000)}));
 assert.ok(!precisaAliviar({id:'x',imagem:'https://x/y.webp'}));
});
test('v178 água do oásis de Therion barra quem tenta atravessar o lago',()=>{
 const t={id:'k',diametroM:1,camada:3,x:23.67*28/48,y:10*14/72};const d=destinoSemColisao(t,{x:t.x,y:45*14/72},[],{larguraM:48,alturaM:72},AGUA_OASIS);
 assert.ok(d.y*72/14<25);assert.ok(AGUA_OASIS.every(o=>o.bloqueiaMovimento&&!o.bloqueiaVisao&&o.invisivelV161));
});
test('v178 ligado no site: leveza instalada; migração dos mapas do GPT; bloqueio em linha na Oficina 3.0',()=>{
 const m=readFileSync(new URL('../js/app/22-mesa-e-modulos.js',import.meta.url),'utf8');assert.match(m,/mesa-leveza\.js/);
 const r=readFileSync(new URL('../js/mesa-remodelagem.js',import.meta.url),'utf8');assert.match(r,/montar178/);
 const o=readFileSync(new URL('../js/mesa-oficina3.js',import.meta.url),'utf8');assert.match(o,/'linha'/);
});
