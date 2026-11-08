import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {subtrai,retInter,retDeQuadrados,contornoDe,contornoFino,juntaQuadrados,diferencas,retDeLinha,pontosDeLinha,pontosDiagonal,segmentoToca,distRet,ESPESSURAS,MODELOS,POCAS,CORES_LUZ,FERRAMENTAS,CELULA} from '../js/mesa-editor-rapido.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const area=l=>l.reduce((s,r)=>s+r.w*r.h,0);
test('v197 geometria: tirar um retângulo de outro deixa só o que sobra, sem sobrepor',()=>{
 const r={x:0,y:0,w:5,h:3};
 assert.equal(area(subtrai(r,{x:1,y:1,w:2,h:1})),13);assert.equal(subtrai(r,{x:10,y:10,w:1,h:1}).length,1,'fora: não muda');
 assert.equal(subtrai(r,{x:-1,y:-1,w:9,h:9}).length,0,'cobre tudo: some');
 const p=subtrai(r,{x:1,y:1,w:2,h:1});for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)assert.equal(retInter(p[i],p[j]),null,'pedaços não se sobrepõem');
});
test('v197 paredes são finas: linha reta com espessura fixa, nas linhas da grade, cantos sem fresta',()=>{
 assert.deepEqual(ESPESSURAS.map(e=>e[1]),[.2,.3,.5,1,2]);
 const r=retDeLinha({x:5.1,y:5.9},{x:9.1,y:7.5},.3,40,26);assert.ok(Math.abs(r.w-4.3)<1e-9&&Math.abs(r.h-.3)<1e-9&&Math.abs(r.x-4.85)<1e-9&&Math.abs(r.y-5.85)<1e-9,'horizontal 4 m + meia espessura nas pontas: '+JSON.stringify(r));
 const v=retDeLinha({x:3.2,y:2.1},{x:3.4,y:8.8},.5,40,26);assert.ok(Math.abs(v.w-.5)<1e-9&&Math.abs(v.h-7.5)<1e-9,'vertical: '+JSON.stringify(v));
 assert.equal(retDeLinha({x:5,y:5},{x:5.2,y:5.2},.3,40,26),null,'sem arrastar não há parede');
 assert.deepEqual(pontosDeLinha({x:-3,y:4.4},{x:99,y:4.6},40,26),{a:{x:0,y:4},b:{x:40,y:4}},'limitada ao mapa');
 assert.deepEqual(pontosDiagonal({x:24,y:15},{x:28.2,y:19.3},40,26),{a:{x:24,y:15},b:{x:28,y:19}});assert.equal(pontosDiagonal({x:5,y:5},{x:9,y:5.2},40,26),null,'sem diagonal');assert.equal(pontosDiagonal({x:38,y:5},{x:44,y:11},40,26),null,'fora do mapa');
 const c=contornoFino({x:12,y:5,w:7,h:6},.3);assert.equal(c.paredes.length,4);assert.deepEqual(c.piso,{x:12,y:5,w:7,h:6});assert.ok(c.paredes.every(p=>Math.min(p.w,p.h)===.3),'quatro paredes finas');
 assert.ok(segmentoToca({x:0,y:0},{x:4,y:4},{x:1.5,y:1.5,w:1,h:1}));assert.ok(!segmentoToca({x:0,y:0},{x:4,y:0},{x:1,y:1,w:1,h:1}));
 assert.equal(distRet({x:5,y:5},{x:4,y:4,w:2,h:2}),0);assert.ok(Math.abs(distRet({x:7,y:5},{x:4,y:4,w:2,h:2})-1)<1e-9);
});
test('v197 geometria: arrastar vira quadrados inteiros dentro do mapa; pincel livre junta vizinhos; contorno grosso de caverna',()=>{
 assert.deepEqual(retDeQuadrados({x:5.2,y:5.8},{x:9.9,y:7.1},40,26),{x:5,y:5,w:5,h:3});assert.deepEqual(retDeQuadrados({x:-3,y:-3},{x:1.5,y:0.2},40,26),{x:0,y:0,w:2,h:1});assert.equal(retDeQuadrados({x:50,y:50},{x:60,y:60},40,26),null);
 const c=contornoDe({x:0,y:0,w:7,h:6});assert.equal(c.paredes.length,4);assert.equal(area(c.paredes)+area([c.piso]),42);assert.equal(contornoDe({x:0,y:0,w:2,h:5}).piso,null);
 assert.deepEqual(juntaQuadrados([{x:3,y:2},{x:4,y:2},{x:5,y:2},{x:8,y:2}]),[{x:3,y:2,w:3,h:1},{x:8,y:2,w:1,h:1}]);
});
test('v197 rascunho: diferença entre listas vira add/properties/remove',()=>{
 const a=[{id:'1',x:1,nome:'A'},{id:'2',x:2}],b=[{id:'1',x:5,nome:'A'},{id:'3',x:3}];
 const d=diferencas(a,b);assert.deepEqual(d.map(e=>e.kind).sort(),['add','properties','remove']);assert.deepEqual(d.find(e=>e.kind==='properties').properties,{x:5});
});
test('v197 modelos e paleta: modelos cabem, paredes são linhas na grade, e a paleta tem as ferramentas do RPG Map',()=>{
 assert.ok(MODELOS.length>=5);assert.ok(MODELOS.some(m=>/sci-fi/i.test(m.nome)),'tem modelo sci-fi');
 for(const m of MODELOS){assert.ok(m.w>=4&&m.h>=4&&m.w<=40&&m.h<=26,m.id);for(const [t,a,o] of m.ops){assert.ok(['comodo','parede','piso','poca','porta','janela','obj'].includes(t),m.id+':'+t);
  if(t==='obj'){assert.equal(typeof a,'string');assert.ok(o[0]>=0&&o[0]<=m.w&&o[1]>=0&&o[1]<=m.h,m.id+' objeto dentro do modelo');}
  else if(t==='porta'||t==='janela'){assert.ok(a[0]>=0&&a[0]<=m.w&&a[1]>=0&&a[1]<=m.h,m.id+' vão na parede');}
  else if(t==='parede'){assert.ok(a.length===4&&a.every(n=>Number.isInteger(n)),m.id+' linha nos cruzamentos da grade');assert.ok(a[0]===a[2]||a[1]===a[3],m.id+' parede reta');assert.ok(Math.max(a[0],a[2])<=m.w&&Math.max(a[1],a[3])<=m.h,m.id+' dentro');}
  else assert.ok(a[0]>=0&&a[1]>=0&&a[0]+a[2]<=m.w&&a[1]+a[3]<=m.h,m.id+' '+t+' dentro do modelo');}}
 const ids=FERRAMENTAS.flatMap(s=>s[1]).map(x=>x[0]);for(const f of ['parede','diagonal','cerca','caverna','comodo','tirar_area','tirar_bloco','borracha','conta_gotas','mover','porta','janela','objeto','luz','texto','modelo'])assert.ok(ids.includes(f),f);
 assert.equal(CELULA,1);assert.ok(POCAS.length>=3&&CORES_LUZ.length>=6);
});
test('v197: instalado no app, com mapa novo do zero, zoom, e sem o zzZ fantasma; NPCs enxergam o rascunho',()=>{
 const app=ler('js/app/22-mesa-e-modulos.js');assert.match(app,/import\('\.\/mesa-editor-rapido\.js\?v=197'\)\.then\(m=>\{window\.mesaEditorRapidoMod=m\.instalarEditorRapido\(/);
 assert.match(ler('js/mesa-vespera.js'),/Editor rápido/);assert.match(ler('js/mesa-camera.js'),/definir:n=>/);assert.match(ler('js/nova-direta.js'),/textoV197/);
 const ed=ler('js/mesa-editor-rapido.js');assert.match(ed,/async function criarMapa\(nome,w,h,pisoId\)/);assert.match(ed,/data-a="novo"/);
 assert.match(ler('js/mesa-noite.js'),/if\(!node\)continue; \/\/ v197/,'zzZ só para miniatura que existe neste mapa');
 for(const f of ['js/mesa-vida.js','js/mesa-companheiros.js','js/mesa-tempo-real.js'])assert.match(ler(f),/mesaRascunhoCenaV197_\?\.\(cenaSalva\)/,f+' lê a cena com o rascunho');
 assert.match(ler('js/nova-editor.js'),/globalThis\.mesaRascunhoCenaV197_=c=>/);
});
