import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AMBIENTES_DIRETOR,tensao,chanceEncontro,sortearEvento,sortearClima,gerarNpc,ESPECIES_NPC,PAPEIS_NPC} from '../js/mesa-diretor-dados.js';
import {PACOTES} from '../js/mesa-conteudo-dados.js';
const app=lerApp();
const seed=s=>()=>((s=(s*1103515245+12345)%2147483648)/2147483648);

test('v108 carrega diretor e conteúdo à parte (site segue jogável sem eles)',()=>{
 for(const m of ['mesa-diretor','mesa-conteudo']){
  assert.match(app,new RegExp(`import\\('\\./${m}\\.js\\?v=1\\d\\d'\\)[\\s\\S]{0,1200}\\.catch\\(`),m);
  assert.doesNotMatch(app,new RegExp(`^import .*${m}`,'m'));
 }
});
test('instâncias ~k encontram o modelo do banco',()=>{
 assert.ok((app.match(/split\('~'\)\[0\]/g)||[]).length>=2);
});
test('tensão e chance crescem com o tempo e ficam limitadas',()=>{
 for(const amb of Object.keys(AMBIENTES_DIRETOR)){
  assert.equal(tensao(amb,0),0);
  assert.equal(tensao(amb,1e6),1);
  assert.ok(chanceEncontro(amb,600)>=chanceEncontro(amb,0));
  assert.ok(chanceEncontro(amb,1e6)<=.85);
 }
});
test('eventos sorteados são coerentes e respeitam o banco',()=>{
 const r=seed(7);
 for(const amb of Object.keys(AMBIENTES_DIRETOR))for(let i=0;i<60;i++){
  const ev=sortearEvento(amb,i*5,r);
  if(!ev)continue;
  assert.ok(ev.nome&&ev.texto&&ev.chave,amb);
  for(const c of ev.criaturas)assert.ok(c.qtd>0);
 }
 const semNada=sortearEvento('esgoto',0,seed(3),()=>false);
 assert.ok(!semNada||(!semNada.criaturas.length&&!semNada.npcs.length&&!semNada.objetos.length));
});
test('catástrofes do esgoto só com tensão alta',()=>{
 const cat=AMBIENTES_DIRETOR.esgoto.eventos.filter(e=>e.gravidade>=3);
 assert.ok(cat.length>=2);
 for(const e of cat)assert.ok(e.tensao>=.3,e.id);
});
test('clima e NPC gerados',()=>{
 for(const amb of Object.keys(AMBIENTES_DIRETOR))assert.ok(sortearClima(amb,seed(2)).nome);
 for(const esp of Object.keys(ESPECIES_NPC))for(const pap of Object.keys(PAPEIS_NPC)){
  const n=gerarNpc({especie:esp,papel:pap,rnd:seed(esp.length*31+pap.length)});
  assert.match(n.id,/^npc_[a-z0-9_]+_\d+$/);
  assert.ok(n.nome.trim()&&n.descricao);
  assert.doesNotMatch(JSON.stringify(n),/undefined|NaN/);
 }
});
test('pacotes de conteúdo têm ids únicos',()=>{
 const ids=new Set();
 for(const p of PACOTES){assert.ok(!ids.has(p.id));ids.add(p.id);
  for(const c of [...(p.criaturas||[]),...(p.npcs||[])])assert.match(String(c.id),/^[a-z0-9_]+$/);}
});
