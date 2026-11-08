import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {ladoDoPonto,pontoOposto,corrigirLados,OPOSTO} from '../js/mesa-ligacoes.js';
import {humorDenzel,tabelaDenzel,aplicarTentativa,chanceContra,TENTATIVAS} from '../js/mesa-pedagio.js';
import {gerarEspacoporto,gerarPortaoVespera,gerarRuasEscavadas} from '../js/mesa-gerador-mapas.js';
import {ligarFixo,trancarPortao} from '../js/mesa-vespera.js';
import {tokenFantasma} from '../js/mesa-vida.js';
import {PACOTE_NOVO,REVISUAL_V138,desenharObjeto} from '../js/mesa-arte-objetos.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('v138: saídas coerentes (direita ↔ esquerda, cima ↔ baixo)',()=>{
 assert.equal(ladoDoPonto({x:27.2,y:7}),'leste');assert.equal(ladoDoPonto({x:.8,y:3}),'oeste');assert.equal(ladoDoPonto({x:14,y:.8}),'norte');assert.equal(ladoDoPonto({x:14,y:13.2}),'sul');assert.equal(ladoDoPonto({x:14,y:7}),null);
 assert.deepEqual(pontoOposto({x:27.2,y:5}),{x:.8,y:5,lado:'oeste'});assert.equal(OPOSTO.norte,'sul');
 const {ligs,n}=corrigirLados([{id:'a',a:{mapa:'P',x:27.2,y:7},b:{mapa:'R',x:27.2,y:4}},{id:'b',a:{mapa:'P',x:.8,y:7},b:{mapa:'Q',x:27.2,y:7}}]);
 assert.equal(n,1);assert.equal(ladoDoPonto(ligs[0].b),'oeste');assert.equal(ligs[0].b.y,7);assert.deepEqual(ligs[1].b,{mapa:'Q',x:27.2,y:7});
});
test('v138: pedágio de Denzel',()=>{
 const h=humorDenzel('pj1',10,10);assert.ok(h>=0&&h<=1);assert.equal(humorDenzel('pj1',10,10),h);assert.ok(humorDenzel('pj1',10,18)>=h);
 assert.ok(tabelaDenzel(.9).preco<tabelaDenzel(.1).preco);assert.equal(chanceContra(50,22),78);assert.equal(chanceContra(0,60),5);
 const e={preco:20,extra:40,armado:true,tentou:{}};
 assert.equal(aplicarTentativa(e,'negociar','Sucesso').preco,10);assert.equal(aplicarTentativa(e,'negociar','Fiasco').recusado,true);
 assert.equal(aplicarTentativa(e,'enganar','Sucesso').liberadoGratis,true);assert.equal(aplicarTentativa(e,'esconder','Sucesso').armado,false);
 assert.equal(aplicarTentativa(e,'intimidar','Sucesso').extra,0);assert.equal(aplicarTentativa(e,'pechinchar','Falha').preco,20);
 assert.ok(aplicarTentativa(e,'negociar','Falha').tentou.negociar);
 for(const t of Object.values(TENTATIVAS))assert.ok(['Influência','Comércio','Enganação','Intimidação','Ocultar Itens'].includes(t.pericia)); // perícias que existem no jogo
});
test('v138: mapas de Véspera',()=>{
 const objs=PACOTE_NOVO.concat([{id:'avrepalmeira',larguraM:3,alturaM:3},{id:'pk_barril',larguraM:1,alturaM:1}]);
 const p=gerarEspacoporto({objetos:objs});assert.equal(p.w,84);assert.ok(p.elements.some(e=>e.nome==='Nave do grupo'));
 const g=gerarPortaoVespera({objetos:objs});assert.equal(g.w,56);assert.ok(g.elements.some(e=>e.nome==='Portão de Véspera'));assert.ok(g.elements.filter(e=>e.modeloId?.startsWith('pk_barraca')).length>=6);
 assert.ok(!g.elements.some(e=>/^(Rua|Faixa)$/.test(e.nome)));
 const r=gerarRuasEscavadas({objetos:objs});assert.equal(r.w,56);assert.ok(r.elements.filter(e=>e.nome==='Parede escavada').length>40); // labirinto
 const cena=trancarPortao({objects:[{nome:'Portão de Véspera'},{nome:'Barril'}]});assert.equal(cena.objects[0].estadoInterativo.trancado,true);assert.equal(cena.objects[1].estadoInterativo,undefined);
 const l=ligarFixo([{id:'x',a:{mapa:'A',x:1,y:1},b:{mapa:'B',x:2,y:2}}],'B',{x:14,y:.8},'A',{x:14,y:13.2});assert.equal(l.length,1);assert.equal(l[0].id,'x');assert.equal(l[0].a.mapa,'B');
});
test('v138: veículos retrofuturistas, fantasmas e giro',()=>{
 for(const r of Object.values(REVISUAL_V138))assert.match(desenharObjeto(r,4.6,2.3),/<svg/);
 assert.ok(PACOTE_NOVO.some(p=>p.id==='pk_nave_grupo'));
 assert.ok(tokenFantasma({x:1,y:2,revision:3}));assert.ok(!tokenFantasma({x:1,y:2,nome:'A'}));
 const g=ler('js/mesa-gerador-mapas.js');assert.ok(!/fill:'#2e3032',nome:'Rua'/.test(g));
 assert.match(ler('js/mesa-visual.js'),/mvAng/);assert.match(ler('js/app.js'),/verComo/);assert.match(ler('js/app.js'),/mesa-pedagio\.js\?v=1[34][0-9]/);
});
