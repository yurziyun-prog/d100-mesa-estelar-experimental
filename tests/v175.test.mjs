import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {paredeEntre,retDeArrasto,paredesDoComodo,abrirVao,simplificar,tracoPerto,objetoNoPonto,objParede,objTeto,objPorta,objDoBanco,TEXTURAS_BASE} from '../js/mesa-oficina3.js';
import {tipoInterativo} from '../js/mesa-objetos.js';
test('v175 oficina 3.0: parede reta encaixada na grade; cômodo = 4 paredes por dentro',()=>{
 assert.deepEqual(paredeEntre({x:1.1,y:2},{x:5.2,y:2.3},.3),{x:.85,y:1.85,w:4.3,h:.3});
 assert.equal(paredeEntre({x:2,y:1},{x:2.2,y:6},.3).w,.3);
 const r=retDeArrasto({x:3.1,y:3},{x:11,y:9.1});assert.deepEqual(r,{x:3,y:3,w:8,h:6});assert.equal(paredesDoComodo(r,.3).length,4);
});
test('v175 porta abre vão na parede e é porta de verdade; teto some ao entrar',()=>{
 const v=abrirVao({x:0,y:0,w:4,h:.3},{x:2,y:.1},1);assert.equal(v.pedacos.length,2);assert.deepEqual(v.vao,{x:1.5,y:0,w:1,h:.3});
 const p=objPorta(v.vao,null,28,14);assert.equal(tipoInterativo(p),'porta');assert.ok(p.bloqueiaMovimento);
 assert.ok(objTeto({x:0,y:0,w:4,h:4},null,28,14).tetoV139);assert.ok(objParede({x:0,y:0,w:4,h:.3},TEXTURAS_BASE[0],28,14).textura);
});
test('v175 pincel, apagar e objetos do banco',()=>{
 assert.equal(simplificar([[0,0],[.1,0],[.2,0],[1,0]],.25).length,2);
 assert.equal(tracoPerto([{id:'a',pts:[[0,0],[4,0]],w:1}],{x:2,y:.5}).id,'a');
 const o=objDoBanco({id:'ia_barril',nome:'Barril',larguraM:.8,alturaM:.8,imagem:'x',bloqueiaMovimento:true},{x:14,y:7},28,14,90);assert.equal(o.angulo,90);assert.ok(o.bloqueiaMovimento);
 assert.equal(objetoNoPonto([{id:'oficina:img:mk163:fundo',x:14,y:7,larguraM:28,alturaM:14},o],{x:14,y:7},28,14).id,o.id);
 for(const t of TEXTURAS_BASE)assert.ok(existsSync(new URL('../'+t.src,import.meta.url)),t.src);
});
test('v175 ligada no site: só o mestre vê as ferramentas, texturas nos objetos, faixa fora do mapa',()=>{
 const m=readFileSync(new URL('../js/app/22-mesa-e-modulos.js',import.meta.url),'utf8');assert.match(m,/mesa-oficina3\.js/);assert.match(m,/uploadImagemBanco_\(f,'pinceis'\)/);
 const n=readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');assert.match(n,/o\.textura/);
 const b=readFileSync(new URL('../js/mesa-barras.js',import.meta.url),'utf8');assert.match(b,/o3Botao/);
});
import {mapasParaGuardar} from '../js/mesa-apagar-mapas.js';
test('v176 guardar mapas: fica o que o mestre usa, onde há jogadores, interiores e trajetos entre eles',()=>{
 const mapas=[{id:'cenario_c002',nome:'Cidade Baixa de Véspera'},{id:'v145_praca_cidade_alta',nome:'Praça da Cidade Superior'},{id:'x',nome:'Mercado das Mil Panelas'},{id:'casa',nome:'Casa qualquer'},{id:'int',nome:'Interior'},{id:'h',nome:'Hospital de Véspera'},{id:'t',nome:'Entre A e B',intermediario:{a:'cenario_c002',b:'h'}},{id:'th',nome:'Therion'}];
 const g=mapasParaGuardar(mapas,[{a:{mapa:'cenario_c002'},b:{mapa:'int'},interiorV164:true}],{tokens:[{id:'pj1',mapaId:'casa'},{id:'syncnpc%3Aa',mapaId:'x'}]});
 assert.deepEqual(g,['x']);
});
import {montarPeca,MATERIAIS,PARTES,texMat,blocosLinha,bordaMaisPerto} from '../js/mesa-construcao.js';
import {gruposTeto} from '../js/mesa-tetos.js';
test('v177 construção por módulos: materiais com as 6 partes; parede com porta tem porta de verdade; casas prontas completas',()=>{
 for(const m of MATERIAIS)for(const p of PARTES)assert.ok(existsSync(new URL('../'+texMat(m.id,p),import.meta.url)),texMat(m.id,p));
 assert.deepEqual(bordaMaisPerto({x:3.1,y:4.2},2,0),{x:2,y:4,hor:true});
 const pp=montarPeca('parede_porta',{x:3,y:4.1},{M:2,mat:'madeira',W:28,H:14});assert.equal(pp.filter(o=>o.nome==='Porta').length,1);assert.equal(pp.filter(o=>o.nome==='Parede').length,2);
 const casa=montarPeca('casa_pequena',{x:10,y:7},{M:2,mat:'tijolo',W:28,H:14});
 assert.equal(casa.filter(o=>o.nome==='Porta').length,1);assert.ok(casa.some(o=>o.nome==='Janela'));assert.equal(casa.filter(o=>o.tetoV139).length,4);assert.ok(casa.every(o=>!o.textura||o.textura.startsWith('arte/materiais/tijolo/')));
 const torre=montarPeca('torre_redonda',{x:10,y:7},{M:2,mat:'pedra-rio',W:28,H:14});assert.ok(torre.filter(o=>o.bloqueiaMovimento&&o.invisivelV161).length>20);assert.equal(torre.filter(o=>o.nome==='Porta').length,1);
 const b=blocosLinha([{x:0,y:0},{x:3,y:3}],.3,28,14);assert.ok(b.length>=9);
 const g=gruposTeto(casa.filter(o=>o.tetoV139),28,14,[{x:10,y:7}]);assert.ok([...g.values()].every(Boolean));
});
