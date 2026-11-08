import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TESTES_PRONTOS,acoesDosTestesSugeridos,escolherPontos} from '../js/mesa-sessao-dados.js';
import {TIPOS_MAPA,gerarMapa} from '../js/mesa-gerador-mapas.js';
import {tamanhoMiniaturaM} from '../js/mesa-tamanhos.js';
const app=lerApp();
const sessao=fs.readFileSync(new URL('../js/mesa-sessao.js',import.meta.url),'utf8');
test('v115 carrega o preparo da sessão à parte',()=>{
 assert.match(app,/import\('\.\/mesa-sessao\.js\?v=1\d\d'\)[\s\S]{0,400}\.catch\(/);
 assert.doesNotMatch(sessao,/const CSS=/,'não pode esconder o CSS.escape do navegador');
});
test('há testes prontos para todo tipo de mapa, no formato do cenário',()=>{
 for(const tipo of Object.keys(TIPOS_MAPA)){
  const l=TESTES_PRONTOS[tipo];assert.ok(l?.length>=3,tipo);
  for(const a of l){assert.ok(a.titulo&&a.evidente&&a.sucesso&&a.falha,a.titulo);assert.doesNotMatch(Object.values(a).join(' '),/\|/);assert.ok(a.pericias.split(';').every(p=>p.trim()));}
 }
});
test('testes sugeridos do cenário viram ações',()=>{
 const a=acoesDosTestesSugeridos('- Percepção para notar o gás\n- Engenharia: avaliar as escoras (difícil)\nlinha sem perícia');
 assert.equal(a.length,2);assert.equal(a[1].titulo,'Avaliar as escoras');assert.equal(a[1].dificuldade,'Difícil');assert.equal(a[0].pericias,'Percepção');
});
test('pontos ficam em chão livre, espalhados e perto do que combina',()=>{
 let s=7;const rnd=()=>((s=(s*16807)%2147483647)/2147483647);
 for(const tipo of Object.keys(TIPOS_MAPA)){
  const st=gerarMapa({tipo,semente:11,objetos:[{id:'grade1',larguraM:2,alturaM:2},{id:'pk_barril',larguraM:1,alturaM:1}]});
  const pts=escolherPontos(TESTES_PRONTOS[tipo],st,{W:st.w,H:st.h,rnd});
  assert.equal(pts.length,TESTES_PRONTOS[tipo].length);
  for(const p of pts){assert.ok(p.x>1&&p.y>1&&p.x<st.w-1&&p.y<st.h-1,tipo);
   const dentro=st.elements.some(e=>e.type!=='path'&&e.bloqueiaMovimento&&p.x>=e.x&&p.x<=e.x+e.w&&p.y>=e.y&&p.y<=e.y+e.h);assert.ok(!dentro,tipo+' ponto dentro de parede');}
 }
});
test('pessoas variam em volta de 1 m pela ficha',()=>{
 assert.equal(tamanhoMiniaturaM({tamanho:'Médio',altura:'1,5'}),1,'v196: pessoa de porte médio nunca menor que 1 m');assert.ok(tamanhoMiniaturaM({tamanho:'Médio',altura:'2,0'})>1);
 assert.ok(tamanhoMiniaturaM({atributos:{TAM:17}})>1);assert.ok(tamanhoMiniaturaM({atributos:{TAM:6}})<.8);
});
