import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {trocarVeiculos,naveDoGrupo,MODELO_NAVE_GRUPO} from '../js/mesa-naves-cena.js';
test('v172 troca: carro antigo vira o novo no tamanho real; casco de nave cobre o interior, deitado, com id novo',()=>{
 const cena={objects:[{id:'a',nome:'Aerocarro creme',modeloId:'pk_vei_aerocarro_creme',x:10,y:5,larguraM:4.6,alturaM:2.3,oficinaElement:{src:'x'},mapRef:true},
  {id:'t',nome:'Telhado · Caça estelar',modeloId:'pk_nave_caca',x:12,y:7,larguraM:11,alturaM:9,tetoV139:true,oficinaElement:{}},{id:'g',nome:'Telhado · Nave do grupo',modeloId:'pk_nave_grupo',x:5,y:5,larguraM:18,alturaM:10.5}]};
 const r=trocarVeiculos(cena);assert.equal(r.trocados,2);const [a,t,g]=r.cena.objects;
 assert.match(a.imagem,/hovercar-deitada/);assert.equal(a.larguraM,4.9);assert.ok(!a.oficinaElement&&!a.mapRef);
 assert.match(t.imagem,/caca-deitada/);assert.ok(t.larguraM>=11&&t.alturaM>=9&&t.tetoV139&&t.id==='t_v172');assert.equal(g.id,'g');
 assert.equal(trocarVeiculos(r.cena).trocados,0);
});
test('v172 nave do grupo: casco 18×13, banheiro, cozinha, 3 beliches, arsenal, armas, para 6',()=>{
 const modelos=new Map(['pk_fut_console','pk_beliche','pk_mesa_quadrada','pk_cadeira_estofada','pk_fut_armario','pk_caixote_suprimentos'].map(i=>[i,{id:i,imagem:'x.webp',larguraM:1.3,alturaM:2.2}]));const els=naveDoGrupo(42,21,{W:84,H:42,modelos});const n=els.map(e=>e.nome);
 for(const k of ['Vaso sanitário','Chuveiro','Cozinha da nave','Arsenal da nave','Console de armas','Console de pilotagem','Telhado · Nave do grupo'])assert.ok(n.includes(k),k);
 assert.equal(n.filter(x=>x==='Beliche da nave').length,3);const c=els.find(e=>e.id==='nave172_casco');assert.equal(c.larguraM,18);assert.equal(c.alturaM,13);
 assert.equal(MODELO_NAVE_GRUPO.tripulacaoMax,6);
 const r=readFileSync(new URL('../js/mesa-remodelagem.js',import.meta.url),'utf8');assert.match(r,/sergio leone/);assert.match(r,/configuracoes\/navesV172'\)\);if\(!f2/);
 for(const f of ['cozinha-nave','vaso-nave','chuveiro-nave','console-armas-nave','arsenal-nave','veiculo-caca-deitada'])assert.ok(existsSync(new URL('../arte/pecas/'+f+'.webp',import.meta.url)),f);
});
