import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as F from '../js/mesa-fixos.js';
import * as N from '../js/mesa-noite.js';
const ler=p=>/(^|\/)app\.js$/.test(p)?lerApp():readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('v143: objeto movido pelo mestre volta para onde ele deixou mesmo com outro id', ()=>{
 const antes={objects:[{id:'a',nome:'Cápsula',x:10,y:7,larguraM:2,alturaM:1}]},depois={objects:[{id:'a',nome:'Cápsula',x:5,y:5,larguraM:2,alturaM:1}]};
 const reg=F.registrar({},F.diffObjetos(antes,depois));
 const r=F.aplicarRegistro({objects:[{id:'novo',nome:'Cápsula',x:10.2,y:7,larguraM:2,alturaM:1}]},reg,{forcar:true});
 assert.equal(r.cena.objects[0].x,5);assert.equal(r.cena.objects[0].fixoMestreV143.k,'a');
 assert.equal(F.aplicarRegistro(r.cena,reg).mudou,0);
});
test('v143: retirado continua retirado; acrescentado volta', ()=>{
 const reg=F.registrar({},[{tipo:'remover',id:'x',nome:'Armário',de:{x:3,y:3}},{tipo:'adicionar',id:'y',nome:'Baú',x:4,y:4,angulo:0,obj:{id:'y',nome:'Baú',x:4,y:4}}]);
 const r=F.aplicarRegistro({objects:[{id:'z',nome:'Armário',x:3.1,y:3}]},reg,{forcar:true});
 assert.deepEqual(r.cena.objects.map(o=>o.id),['y']);
});
test('v143: mesa em cima da cápsula sai; armário solto vai para a parede', ()=>{
 const c={objects:[{id:'w',nome:'Parede',x:14,y:.2,larguraM:28,alturaM:.4,bloqueiaMovimento:true,oficinaElement:{type:'shape'}},{id:'cap',nome:'Cápsula',x:10,y:7,larguraM:2.2,alturaM:1,camada:2},{id:'m',nome:'Mesa',x:10.1,y:7.1,larguraM:1.4,alturaM:1.4,camada:2},{id:'arm',nome:'Armário de remédios',x:14,y:7,larguraM:1.6,alturaM:.8,camada:3}]};
 const r=F.arrumarCena(c);const m=r.cena.objects.find(o=>o.id==='m'),a=r.cena.objects.find(o=>o.id==='arm');
 assert.notEqual(m.y,7.1);assert.ok(a.y<1.5);
});
test('v143: ganchos — editor, oficina e salvar do gerador', ()=>{
 assert.match(ler('js/nova-editor.js'),/mesaFixosV143_\?\.anotar/);assert.match(ler('js/nova-editor.js'),/filaV143/);
 assert.match(ler('js/nova-direta.js'),/mesaFixosV143_\?\.anotar\?\.\(expected,workshopBase,result\)/);
 assert.match(ler('js/app.js'),/mesaFixosV143_\.aplicar\(id,cena/);assert.match(ler('js/app.js'),/mesa-fixos\.js\?v=14\d/);assert.match(ler('js/app.js'),/mesa-noite\.js\?v=14\d/);
});
test('jogo contínuo: opções de turnos ficam fora da interface padrão', ()=>{
 assert.match(ler('js/nova-direta.js'),/id==='novaSyncStart'\|\|id==='novaSyncEnd'\?true/);
 assert.doesNotMatch(ler('js/mesa-tempo-real.js'),/data-turnos="ini"/);
 assert.match(ler('js/mesa-tempo-real.js'),/Pausa de emergência/);
});
test('v143: setas do mestre e legendas de saída só perto', ()=>{
 const s=ler('js/mesa-ligacoes.js');assert.match(s,/mlSetas/);assert.match(s,/LEGENDA_PERTO/);assert.match(s,/ml-curta/);
 assert.match(ler('js/mesa-interacoes.js'),/só vê o ponto quando chega perto/);
});
test('v143: rotinas de dia e noite', ()=>{
 const g=['syncnpc:g1','syncnpc:g2'];
 const t=[N.modoRotina({id:'syncnpc:g1',tipo:'guarda',h:23,guardasDoMapa:g}),N.modoRotina({id:'syncnpc:g2',tipo:'guarda',h:23,guardasDoMapa:g})].sort();
 assert.deepEqual(t,['dormindo','vigia']);
 assert.equal(N.modoRotina({id:'c',tipo:'comerciante',h:21}),'ausente');assert.equal(N.modoRotina({id:'c',tipo:'comerciante',h:12}),null);
 assert.equal(N.modoRotina({id:'n',tipo:'noturno',h:12}),'dormindo');assert.equal(N.modoRotina({id:'n',tipo:'noturno',h:23}),null);
 assert.equal(N.tipoDe('syncnpc:ur17','UR-17'),'robo');
 assert.ok(N.chanceDeAcordar([{dist:3,andando:true,armadura:2}],{grupo:4})>N.chanceDeAcordar([{dist:3,andando:true,silencio:'ok'}],{grupo:1}));
 assert.ok(N.chanceDeAcordar([],{violencia:true})>.5);
 assert.match(ler('js/mesa-vida.js'),/mesaNoiteV143\?\.parado/);assert.match(ler('js/mesa-vida.js'),/mapasParaRodar/);
 assert.match(ler('js/mesa-companheiros.js'),/segue em qualquer mapa/);
});
