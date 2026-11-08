import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as M from '../js/mesa-cidade-alta-mapas.js';
import * as N from '../js/mesa-nevoa.js';
import * as CA from '../js/mesa-cidade-alta.js';
const PK=[...new Set([...readFileSync(new URL('../js/mesa-cidade-alta-mapas.js',import.meta.url),'utf8').matchAll(/'(pk_[a-z0-9_]+)'/g)].map(m=>m[1])),'pk_escada','pk_escada_madeira','pk_escada_pedra'];
const objetos=PK.map(id=>({id,nome:id,larguraM:1,alturaM:1,imagem:''}));
const ler=p=>/(^|\/)app\.js$/.test(p)?lerApp():readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('v145: mapas da Cidade Alta são gerados com saídas', ()=>{
 const e=M.gerarEscadariaAlta({objetos});assert.ok(e.elements.length>40);assert.equal(e.nevoaV145,true);assert.ok(e.escadariaAltaV145.portao);assert.ok(e.elements.some(x=>/Portão da Cidade Alta/.test(x.nome||x.name)));
 
 const p=M.gerarPracaAlta({objetos});for(const k of ['camara','escadaria','porto','taverna','hospital','palacio'])assert.ok(p.pracaAltaV145.saidas[k],k);
 assert.ok(p.elements.some(x=>/Vaelkor/.test(x.nome||x.name)));assert.ok(p.elements.some(x=>/Valloton/.test(x.nome||x.name)));
 const c=M.gerarCamara({objetos});assert.ok(c.elements.some(x=>/chefe do conselho/i.test(x.nome||x.name)));
 const pal=M.gerarPalacioMusk({objetos});assert.ok(pal.elements.some(x=>x.vaoAndarV144));assert.ok(pal.elements.some(x=>x.escadaAndarV144));assert.ok(pal.elements.some(x=>/Pedra de Fase/.test(x.nome||x.name)));
 assert.ok(M.gerarTavernaAlta({objetos}).tavernaAltaV145.saida);
});
test('v145: névoa — parede corta a visão, porta aberta não', ()=>{
 const parede={nome:'Parede',bloqueiaMovimento:true,x:14,y:7,larguraM:1,alturaM:14};
 assert.equal(N.tapaVista(parede),true);assert.equal(N.tapaVista({nome:'Porta',bloqueiaMovimento:true,estadoInterativo:{aberto:true}}),false);
 assert.equal(N.tapaVista({nome:'Mesa',bloqueiaMovimento:true}),false);
 const g=N.gradeVisao([parede],28,14),pol=N.poligonoVisao(g,{x:5,y:7});
 assert.equal(N.dentroPoligono({x:8,y:7},pol),true);assert.equal(N.dentroPoligono({x:20,y:7},pol),false);
});
test('v145: portão — carta, chances e testes com perícias do jogo', ()=>{
 assert.equal(CA.temCarta({mochila:[{nome:'Carta de Darek Sol'}]}),true);assert.equal(CA.temCarta({mochila:[{nome:'Carta velha'}]}),false);
 assert.equal(CA.chanceContra(30,30),50);assert.equal(CA.chanceContra(200,0),95);
 assert.deepEqual(Object.values(CA.TENTATIVAS).map(t=>t.pericia),['Influência','Enganação','Comércio']);
});
test('v145: ganchos — dormitórios, passar a noite, fome/sede, instalação', ()=>{
 const el=ler('js/mesa-elenco.js');assert.match(el,/chave_dormitorio_/);assert.match(el,/Porta do dormit/);
 assert.match(ler('js/mesa-cenarios-mapas.js'),/Beliche \$\{L\}/);
 const r=ler('js/mesa-relogio.js');assert.match(r,/Passar a noite/);assert.match(r,/mesaNecessidades/);
 const app=ler('js/app.js');assert.match(app,/mesa-nevoa\.js\?v=\d+/);assert.match(app,/mesa-cidade-alta\.js\?v=1[4-9][0-9]/);
 assert.match(ler('index.html'),/v1(4[5-9]|[5-9][0-9])/);
});
test('v145: Casa Vaelkor — arte, carteira e convite', async ()=>{
 const V=await import('../js/mesa-vaelkor.js'),A=await import('../js/mesa-vaelkor-arte.js');
 for(const k of ['retrato','busto','ouro','prata','cobre','bimetal','reverso50','nota1000','nota500'])assert.match(A.ARTE_VAELKOR[k],/^data:image\/webp;base64,/);
 assert.deepEqual(A.trocar(1789).map(d=>[d.valor,d.n]),[[1000,1],[500,1],[100,2],[50,1],[20,1],[10,1],[1,9]]);
 assert.equal(V.tipoArte({nome:'Quadro de Lord Vaelkor'}),'retrato');assert.equal(V.tipoArte({oficinaElement:{arteVaelkorV145:'estandarte'}}),'estandarte');assert.equal(V.tipoArte({nome:'Mesa'}),null);
 const g=V.guardarNoInventario({mochila:[{id:'a'},null]},{id:V.CONVITE_ID,pv:1});assert.equal(g.inv.mochila[1].idBanco,V.CONVITE_ID);assert.equal(V.guardarNoInventario(g.inv,{id:V.CONVITE_ID}).ja,true);
 const q=V.sortearQuando(0,30,150,.5);assert.equal(q,90*60000);
 for(const g2 of ['gerarPracaAlta','gerarCamara','gerarTavernaAlta','gerarPalacioMusk','gerarEscadariaAlta'])assert.ok(M[g2]({objetos}).elements.some(e=>e.arteVaelkorV145),g2);
 assert.match(ler('js/app.js'),/mesa-vaelkor\.js\?v=145/);
});
