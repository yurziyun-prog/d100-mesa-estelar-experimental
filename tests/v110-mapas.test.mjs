import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TIPOS_MAPA,TAMANHOS,gerarMapa,sugerirTipo,resumoMapa,retangulosDeCelulas} from '../js/mesa-gerador-mapas.js';
import {materialDaForma,formaRealista,TEXTURAS} from '../js/mesa-mapa-arte.js';
const app=lerApp();
const objetos=['grade1','pk_barril','caixa_madeira','arvre1','pk_pinheiro','arbusto','pk_pedra_grande','cadeira1','mesa2','pk_cama_solteiro','pk_luminaria','carro1'].map(id=>({id,larguraM:1.2,alturaM:1,bloqueiaMovimento:true}));

test('v110 carrega arte e gerador de mapas à parte',()=>{
 for(const m of ['mesa-mapa-arte','mesa-mapas-ui']){
  assert.match(app,new RegExp(`import\\('\\./${m}\\.js\\?v=1\\d\\d'\\)[\\s\\S]{0,400}\\.catch\\(`),m);
  assert.doesNotMatch(app,new RegExp(`^import .*${m}`,'m'));
 }
 assert.match(app,/gm2shapeInner=function\(e\)\{const base=gm2shapeInnerBaseV110_\(e\);try\{/);
});
test('todos os tipos geram mapas válidos, jogáveis e repetíveis',()=>{
 for(const tipo of Object.keys(TIPOS_MAPA))for(const [w,h] of TAMANHOS){
  const a=gerarMapa({tipo,largura:w,altura:h,semente:123,objetos});
  assert.equal(JSON.stringify(a),JSON.stringify(gerarMapa({tipo,largura:w,altura:h,semente:123,objetos})),tipo);
  assert.doesNotMatch(JSON.stringify(a),/NaN|undefined|null,"y"/,tipo);
  assert.equal(a.w,w);assert.equal(a.h,h);assert.ok(a.elements.length>3,tipo);
  // área bloqueada não pode tomar o mapa todo
  const bloq=a.elements.filter(e=>e.type==='shape'&&e.bloqueiaMovimento).reduce((s,e)=>s+e.w*e.h,0);
  assert.ok(bloq<w*h*.75,`${tipo} ${w}x${h} bloqueado demais`);
  for(const e of a.elements.filter(e=>e.type==='object'))assert.ok(objetos.some(o=>o.id===e.modeloId),e.modeloId);
  assert.ok(resumoMapa(a).objetos>=0);
 }
});
test('sugestão de tipo pelo nome',()=>{
 assert.equal(sugerirTipo('Esgoto da Rua 9'),'esgoto');assert.equal(sugerirTipo('Mina das Costelas'),'caverna');
 assert.equal(sugerirTipo('Bosque de Vidro'),'floresta');assert.equal(sugerirTipo('Taverna do Porto'),'interior');
});
test('retângulos cobrem exatamente as células sólidas',()=>{
 const W=7,H=5,sol=new Uint8Array(W*H).map((_,i)=>(i*7)%3===0?1:0);
 const cob=new Uint8Array(W*H);for(const q of retangulosDeCelulas(sol,W,H))for(let y=q.y;y<q.y+q.h;y++)for(let x=q.x;x<q.x+q.w;x++){assert.equal(cob[y*W+x],0);cob[y*W+x]=1;}
 assert.deepEqual([...cob],[...sol]);
});
test('formas ganham material sem quebrar o desenho original',()=>{
 assert.equal(materialDaForma({type:'shape',fill:'#3e6f78'}),'agua');
 assert.equal(materialDaForma({type:'shape',fill:'#7a5534',bloqueiaMovimento:true}),'madeira');
 assert.equal(materialDaForma({type:'shape',fill:'#123456',src:'x.png'}),null);
 const base='<rect x="0" y="0" width="10" height="10" fill="#7a5534"/>';
 const out=formaRealista({type:'shape',fill:'#7a5534',bloqueiaMovimento:true,w:1,h:1},base,32);
 assert.ok(out.includes(base)&&out.includes('url(#mv110-madeira-32)'));
 assert.equal(formaRealista({type:'shape',fill:'#ff00ff'},'<g/>',32),'<g/>');
 assert.ok(TEXTURAS.floresta&&TEXTURAS.esgoto);
});
