import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {ROTEIROS,POSTOS,tarefasDoEvento,cascoFinal,rolarD100,acharClareira} from '../js/mesa-viagem.js';
const dados=['02-dados-padrao','01-nucleo'].map(f=>readFileSync(new URL('../js/app/'+f+'.js',import.meta.url),'utf8')).join('\n');
test('v179 viagem: só usa perícias que existem no jogo',()=>{
 for(const r of Object.values(ROTEIROS))for(const ev of r.eventos)for(const t of ev.tarefas){
  assert.ok(t.posto==='todos'||POSTOS.some(p=>p.id===t.posto),t.posto);
  for(const o of t.opcoes)for(const p of o.pericias)assert.match(dados,new RegExp(`nome:\\s*['"]${p}['"]`),p);}
});
test('v179 viagem: tarefas por posto e "todos" geram uma por tripulante',()=>{
 const ev=ROTEIROS.queda.eventos.find(e=>e.id==='pane');const tri=[{id:'a'},{id:'b'},{id:'c'}];
 const ts=tarefasDoEvento(ev,tri,{a:'piloto'});
 assert.equal(ts.find(t=>t.chave==='pane:piloto').personagemId,'a');
 assert.equal(ts.find(t=>t.chave==='pane:navegador').personagemId,null);
 assert.equal(ts.filter(t=>t.chave.startsWith('pane:todos:')).length,3);
});
test('v179 viagem: a queda sempre acontece e o casco fica entre 15 e 70',()=>{
 assert.ok(ROTEIROS.queda.queda);
 assert.equal(cascoFinal({},ROTEIROS.queda),70);
 assert.equal(cascoFinal({x:{sucesso:false,dano:500}},ROTEIROS.queda),15);
 assert.equal(cascoFinal({},ROTEIROS.tranquila),100);
 assert.match(ROTEIROS.queda.sabotagem,/Sabotagem/);
 assert.ok(ROTEIROS.queda.eventos.find(e=>e.id==='motor').texto.includes('100%'));
});
test('v179 viagem: d100 com graus',()=>{
 assert.equal(rolarD100(50,5).grau,'Crítico');assert.equal(rolarD100(50,40).grau,'Sucesso');
 assert.equal(rolarD100(50,70).grau,'Falha');assert.equal(rolarD100(50,99).grau,'Falha crítica');
});
test('v179 viagem: destroços caem num espaço livre do mapa',()=>{
 const W=56,H=56,parede={bloqueiaMovimento:true,x:44*28/W,y:16*14/H,larguraM:20,alturaM:20};
 const c=acharClareira([parede],W,H,13.5,9.8,{x:44,y:16});
 assert.ok(c.x+6.75<=34||c.x-6.75>=54||c.y+4.9<=6||c.y-4.9>=26,JSON.stringify(c));
});
test('v179 ligado no site: módulo de viagem instalado e botão na barra',()=>{
 const m=readFileSync(new URL('../js/app/22-mesa-e-modulos.js',import.meta.url),'utf8');assert.match(m,/mesa-viagem\.js/);
 const b=readFileSync(new URL('../js/mesa-barras.js',import.meta.url),'utf8');assert.match(b,/vgBotao/);
});
