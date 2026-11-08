// v199 — geradores de mapa do MapForge → plano do Editor rápido (funções puras + motor empacotado).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const raiz=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const P=await import('../js/mesa-mapforge-plano.js');
const dentroDoMapa=(pl,l)=>l.every(p=>p.r.x>=-.01&&p.r.y>=-.01&&p.r.x+p.r.w<=pl.W+.01&&p.r.y+p.r.h<=pl.H+.01&&p.r.w>0&&p.r.h>0&&Number.isFinite(p.r.x+p.r.y+p.r.w+p.r.h));

test('v199 rasterizar: polígono vira retângulos de 1 m sem sobrar nem faltar',()=>{
 const rs=P.rasterizar([{x:0,y:0},{x:4,y:0},{x:4,y:3},{x:0,y:3}]);
 assert.equal(rs.reduce((a,r)=>a+r.w*r.h,0),12,'área 4×3');assert.ok(rs.length<=2,'linhas iguais viram um retângulo só: '+rs.length);
 const L=P.rasterizar([{x:0,y:0},{x:4,y:0},{x:4,y:2},{x:2,y:2},{x:2,y:4},{x:0,y:4}]);assert.equal(L.reduce((a,r)=>a+r.w*r.h,0),12,'forma em L');
});

test('v199 faixas: corredor reto vira retângulos exatos',()=>{
 const rs=P.rectsDeFaixa([{x:2,y:5},{x:10,y:5},{x:10,y:9}],2);
 assert.equal(rs.length,2);assert.deepEqual(rs[0],{x:2,y:4,w:9,h:2},'trecho horizontal (com o canto fechado)');assert.deepEqual(rs[1],{x:9,y:4,w:2,h:5},'trecho vertical (com o canto fechado)');
});

for(const [tipo,estilo,bioma] of [['masmorra','medieval',''],['masmorra','futurista',''],['cidade','hibrido',''],['cidade','hiboriano',''],['exterior','medieval','floresta'],['exterior','retrofuturista','penhasco'],['exterior','hibrido','mina'],['exterior','medieval','campo']])
 test(`v199 plano ${tipo}/${estilo}${bioma?'/'+bioma:''}: tudo dentro do mapa, só texturas que existem, dentro do orçamento`,async()=>{
  const [w,h]=P.TAMANHO_PADRAO[tipo],pl=await P.gerarPlano({tipo,estilo,bioma,seed:42,w,h,densidade:.7,complexidade:.7});
  assert.ok(dentroDoMapa(pl,[...pl.pisos,...pl.paredes,...pl.vaos,...pl.telhados]),'geometria dentro do mapa e sem NaN');
  assert.ok(pl.stats.total<=P.MAX_OBJETOS,'cabe no orçamento de peças: '+pl.stats.total);
  const texs=new Set([pl.chao,...pl.pisos.map(p=>p.tex),...pl.paredes.map(p=>p.tex),...pl.telhados.map(p=>p.tex)].filter(Boolean));
  const ofic=fs.readFileSync(path.join(raiz,'js/mesa-oficina3.js'),'utf8');
  for(const t of texs)assert.ok(ofic.includes(`{id:'${t}'`),'textura existe no mapa da mesa: '+t);
  assert.ok(pl.pisos.length>0&&(tipo==='exterior'||pl.paredes.length>0));
  if(tipo==='masmorra')assert.ok(pl.vaos.length>=5&&pl.textos.length>=3,'masmorra com portas e legendas');
  if(tipo==='cidade')assert.ok(pl.telhados.length>=3&&pl.vaos.length>=3,'cidade com prédios e portas');
  if(tipo==='exterior')assert.ok(pl.copas.length>=3,'exterior com árvores');
 });

test('v199 plano: mesma semente = mesmo plano; semente diferente = plano diferente; orçamento corta só adereços',async()=>{
 const a=await P.gerarPlano({tipo:'masmorra',estilo:'medieval',seed:7,w:48,h:32}),b=await P.gerarPlano({tipo:'masmorra',estilo:'medieval',seed:7,w:48,h:32}),c=await P.gerarPlano({tipo:'masmorra',estilo:'medieval',seed:8,w:48,h:32});
 assert.deepEqual(a,b);assert.notDeepEqual(a.paredes,c.paredes);
 const grande=await P.gerarPlano({tipo:'exterior',estilo:'medieval',bioma:'floresta',seed:3,w:120,h:120,densidade:1,maxObjetos:400});
 assert.ok(grande.stats.total<=400,'respeita o limite pedido: '+grande.stats.total);assert.ok(grande.avisos.length>=1,'avisa quando corta');assert.ok(grande.pisos.length>20,'a estrutura (pisos) não é cortada');
});

test('v199 integração: botão 🗺️ no Editor rápido, motor fora do carregamento inicial, texturas novas do gerador existem',()=>{
 const ed=fs.readFileSync(path.join(raiz,'js/mesa-editor-rapido.js'),'utf8');assert.ok(ed.includes('data-a="gerador"')&&ed.includes('abrirGerador')&&ed.includes('fPlano'));
 const pl=fs.readFileSync(path.join(raiz,'js/mesa-mapforge-plano.js'),'utf8');assert.ok(pl.includes("import('./mesa-mapforge-motor.js?v=199')"),'motor só por import dinâmico');
 assert.ok(fs.existsSync(path.join(raiz,'js/mesa-mapforge-motor.js'))&&fs.existsSync(path.join(raiz,'fontes/mapforge/entrada-mapas.ts')));
});
