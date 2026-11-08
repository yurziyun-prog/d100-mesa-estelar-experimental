import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {classificarCenario,gerarDoCenario} from '../js/mesa-cenarios-mapas.js';
import {PACOTE_NOVO,REVISUAL_V139,desenharObjeto} from '../js/mesa-arte-objetos.js';
import {tipoInterativo,TIPOS} from '../js/mesa-objetos.js';
import {SONO_MAX,FATOR_SENTADO,dormir} from '../js/mesa-relogio.js';
import {chaveEscada,parDaEscada,ehTelhado,retanguloN,dentro} from '../js/mesa-tetos.js';
import {trancarPortas,npcsLivres,papelCombina} from '../js/mesa-remodelagem.js';
import {pontoJuntoParede} from '../js/mesa-recheio.js';
import {elencoDoCenario} from '../js/mesa-elenco.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../'+f,import.meta.url),'utf8');
const objs=PACOTE_NOVO.map(p=>({...p}));
const cont=st=>{const c={};for(const e of st.elements)c[e.nome]=(c[e.nome]||0)+1;return c;};
test('v139: mapa pela descrição do cenário',()=>{
 assert.equal(classificarCenario({nome:'Mercado das Mil Panelas'}).tipo,'mercado');
 assert.equal(classificarCenario({nome:'A Caravana que Não Chegou',local:'Véspera - Mercado ou Última Bateria'}).tipo,'ermos');
 assert.equal(classificarCenario({nome:'Entre Competição de Tiro e Ruas Escavadas',local:'Rua da cidade',intermediario:true}).tipo,'rua');
 assert.equal(classificarCenario({nome:'Praça de Vallotton'}).tipo,'praca');
 const m=gerarDoCenario({id:'C016',nome:'Mercado das Mil Panelas',descricaoJogadores:'panelas e máquinas de venda'},{objetos:objs}),c=cont(m);
 assert.equal(m.w,84);assert.ok(c['Barraca de feira']>=20);assert.ok(c['Máquina de venda']>=8);assert.ok(c['Poste de luz']>=6);assert.ok(c['Banca de panelas']>=3);assert.ok(Object.keys(c).some(k=>/^Telhado ·/.test(k)));assert.ok(m.pessoasV139.length>=10);
 // cadeiras soltas na camada 2, sem bloquear, e mesas sem cadeiras desenhadas
 const cad=m.elements.filter(e=>e.nome==='Cadeira');assert.ok(cad.length&&cad.every(e=>e.camada===2&&e.bloqueiaMovimento===false));
 assert.ok(!m.elements.some(e=>['mesa3','pk_mesa_reuniao'].includes(e.modeloId)));
});
test('v139: Última Bateria com andar de cima e escadas pareadas; armários na parede',()=>{
 const t=gerarDoCenario({nome:'A Última Bateria'},{objetos:objs}),c=cont(t);
 assert.equal(t.w,28);for(let i=1;i<=6;i++){assert.equal(c['Porta da cápsula '+i],1);assert.equal(c['Cápsula de aluguel '+i],1);}
 const esc=t.elements.filter(e=>chaveEscada(e)||e.escadaAndarV144);assert.ok(esc.length>=1); // v144: escada única de andar (o andar de cima fica por cima do térreo)
 const cli=cont(gerarDoCenario({nome:'Clínica das Três Arcadas'},{objetos:objs}));assert.equal(cli['Cadeira de espera'],6);assert.ok(cli['Armário de remédios']);
 const arm=gerarDoCenario({nome:'Arquivo Cívico'},{objetos:objs}).elements.filter(e=>e.nome==='Estante');assert.ok(arm.length>=10);
 const p=pontoJuntoParede([{nome:'Parede',x:14,y:7,larguraM:10,alturaM:.4,bloqueiaMovimento:true}],28,14,1.6,.8,3);assert.ok(p&&Math.abs(p.y-7)<1);
 const cena=trancarPortas({objects:[{nome:'Porta da cela 1'},{nome:'Porta da cápsula 2'},{nome:'Porta'}]});assert.equal(cena.objects[0].estadoInterativo.trancado,true);assert.equal(cena.objects[2].estadoInterativo,undefined);
});
test('v139: sentar, sono e consumo',()=>{
 assert.equal(tipoInterativo({nome:'Cadeira'}),'assento');assert.equal(tipoInterativo({nome:'Banco'}),'assento');assert.equal(TIPOS.assento.repouso,'sentado');assert.equal(tipoInterativo({nome:'Banco de dados'}),'');
 assert.equal(SONO_MAX,8);assert.ok(FATOR_SENTADO<1);assert.equal(dormir('Tired',0,9*FATOR_SENTADO).nivel,'Winded');
 const app=ler('js/app.js');assert.match(app,/cafe:\{limite:1/);assert.match(app,/agua:\{limite:4/);assert.match(app,/comida:\{limite:4/);
});
test('v139: telhados, PMs e mesas sem cadeiras',()=>{
 assert.ok(ehTelhado({nome:'Telhado · Café'}));const r=retanguloN({x:14,y:7,larguraM:4,alturaM:2},28,14);assert.ok(dentro({x:14.5,y:7.2},r));assert.ok(!dentro({x:20,y:7},r));
 for(const v of Object.values(REVISUAL_V139))assert.match(desenharObjeto(v,3,1.2),/<svg/);
 assert.deepEqual(elencoDoCenario({personagensCenaIds:'pm1',npcsCena:''},{personagens:[{id:'pm1',nome:'Dra',dono:'m'}],mestreUid:'m'}),[]);
 const livres=npcsLivres([{id:'a',nome:'Tessan Vey',comerciante:true},{id:'b',nome:'Hessa Varn',comerciante:true}],[{npcsCena:'Tessan Vey'}],[]);assert.deepEqual(livres.map(n=>n.id),['b']);assert.ok(papelCombina(livres[0],'vendedor'));
});
