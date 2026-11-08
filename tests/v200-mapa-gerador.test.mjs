import test from 'node:test';
import assert from 'node:assert/strict';
import {gerarPlano,abrirVaos,menosRetangulo} from '../js/mesa-mapforge-plano.js';
import {montarGrade,caminho} from '../js/mesa-tempo-real-ia.js';
const cen=r=>({x:r.x+r.w/2,y:r.y+r.h/2,larguraM:r.w,alturaM:r.h,angulo:0});
test('menosRetangulo: corta o vão e deixa as pontas',()=>{
 const p=menosRetangulo({x:0,y:0,w:10,h:.4},{x:4,y:-.2,w:2,h:.8});
 assert.deepEqual(p.map(r=>[r.x,r.w]),[[0,4],[6,4]]);
 assert.deepEqual(menosRetangulo({x:0,y:0,w:2,h:2},{x:5,y:5,w:1,h:1}),[{x:0,y:0,w:2,h:2}],'sem encontro: igual');
});
test('abrirVaos: nenhuma parede cruza o vão de uma porta',()=>{
 const pl={paredes:[{r:{x:0,y:0,w:10,h:.4},tex:'pedra'},{r:{x:4.8,y:-3,w:.4,h:6},tex:'pedra'}],vaos:[{r:{x:4,y:0,w:2,h:.4}}]};
 abrirVaos(pl);
 for(const p of pl.paredes){const x0=Math.max(p.r.x,4),x1=Math.min(p.r.x+p.r.w,6),y0=Math.max(p.r.y,0),y1=Math.min(p.r.y+p.r.h,.4);assert.ok(x1-x0<=.001||y1-y0<=.001,'parede dentro do vão: '+JSON.stringify(p.r));}
});
test('masmorra gerada: portas passáveis, salas fechadas com porta fechada e ligadas com porta aberta',async()=>{
 for(const seed of [3,29]){
  const p=await gerarPlano({tipo:'masmorra',estilo:'medieval',seed});
  const par=p.paredes.map(w=>cen(w.r)),por=p.vaos.map(v=>cen(v.r));
  const aberta=montarGrade(par,p.W,p.H,{passo:.25,raio:.15}),fechada=montarGrade([...par,...por],p.W,p.H,{passo:.25,raio:.15});
  const bloq=(g,x,y)=>g.g[Math.floor(y/g.passo)*g.cw+Math.floor(x/g.passo)]===1;
  assert.equal(p.vaos.filter(v=>{const c=cen(v.r);return bloq(aberta,c.x,c.y);}).length,0,'todo vão de porta está livre');
  const salas=p.pisos.filter(f=>f.sala).map(f=>cen(f.r)),base=salas[0],chega=(c,t)=>c.length&&Math.hypot(c.at(-1).x-t.x,c.at(-1).y-t.y)<1;
  let ab=0,fe=0;for(const s of salas.slice(1)){if(chega(caminho(aberta,base,s,{maxNos:80000}),s))ab++;if(chega(caminho(fechada,base,s,{maxNos:80000}),s))fe++;}
  assert.ok(ab>=salas.length-2,'portas abertas ligam as salas: '+ab+'/'+(salas.length-1));assert.equal(fe,0,'com as portas fechadas as salas ficam trancadas');
 }
});
