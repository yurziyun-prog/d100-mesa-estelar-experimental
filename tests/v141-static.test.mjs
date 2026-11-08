import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {nomeVisivel,copiasDeComerciantes,espalhar,ehGenerico,especieDoToken,RACAS} from '../js/mesa-comerciantes.js';
import {gerarPortaoVespera,gerarRuasEscavadas,gerarEspacoporto} from '../js/mesa-gerador-mapas.js';
import {gerarEspacoportoV141} from '../js/mesa-cenarios-mapas.js';
import {PACOTE_NOVO} from '../js/mesa-arte-objetos.js';
import {chaveEscada,parDaEscada} from '../js/mesa-tetos.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../'+f,import.meta.url),'utf8');
const objs=PACOTE_NOVO.map(p=>({...p}));
test('v141: chão de deserto com pincéis de textura (sem elipses coloridas)',()=>{
 const g=gerarPortaoVespera({objetos:objs});
 assert.ok(!g.elements.some(e=>/Veio de areia colorida|^Duna$/.test(e.nome)));
 const pinc=g.elements.filter(e=>e.type==='path'&&['areia','fumaca','ranhura','cascalho'].includes(e.brush));assert.ok(pinc.length>=40);
 assert.ok(g.elements.some(e=>e.nome==='Degraus da subida para Véspera'));
});
test('v141: naves por dentro e terraços com escadarias',()=>{
 const p=gerarEspacoportoV141({objetos:objs},gerarEspacoporto),tel=p.elements.filter(e=>/^Telhado · /.test(e.nome)).map(e=>e.nome);
 for(const n of ['Nave do grupo','Cargueiro enferrujado','Saltador em disco','Caça estelar','Transporte de passageiros'])assert.ok(tel.includes('Telhado · '+n),n);
 assert.ok(p.elements.some(e=>/Poltrona de passageiro/.test(e.nome)));
 const r=gerarRuasEscavadas({objetos:objs}).elements.filter(e=>chaveEscada(e));assert.equal(r.length,4);for(const e of r)assert.ok(parDaEscada(e,r));
});
test('v141: comerciantes genéricos com nome descoberto',()=>{
 const id=encodeURIComponent('syncnpc:comerciante_generico_insetoide~4');assert.ok(ehGenerico(id));assert.equal(especieDoToken(id),'insetoide');assert.ok(!ehGenerico('syncnpc%3Acomerciante_generico_1~3'));
 const meta={[id]:{nomeReal:"T'kar Var",conhecidoPor:{u1:true}}},t={id,nome:'Comerciante 4'};
 assert.equal(nomeVisivel(t,meta,{uid:'u1'}),"T'kar Var");assert.equal(nomeVisivel(t,meta,{uid:'u2'}),undefined);assert.equal(nomeVisivel(t,meta,{mestre:true}),"Comerciante 4 · T'kar Var");
 const cop=copiasDeComerciantes([{id:'syncnpc%3Acomerciante_generico_1~30'},{id:'syncnpc%3Acomerciante_generico_1'},{id:'syncnpc%3Aomm~2'}],[{id:'comerciante_generico_1',comerciante:'true'},{id:'omm'}]);assert.equal(cop.length,1);
 const e=espalhar([{id:'a',x:5,y:5},{id:'b',x:5.1,y:5}],[{x:12,y:8,alturaM:3}]);assert.ok(e.get('b').x===12);
 assert.ok(RACAS.length>=6);assert.match(ler('js/nova-direta.js'),/mesaNomeVisivelV141/);assert.match(ler('js/app.js'),/publicarComerciantesV141_/);
});
test('v142: Kael recomeça no mapa 1 e a viagem atualiza a ficha',()=>{
 const v=ler('js/mesa-vespera.js');assert.match(v,/async function recomecarTeste/);assert.match(v,/kaelInicioV142/);assert.match(v,/Recomeçar no Espaço-porto/);assert.match(v,/miniaturaKael/);
 assert.match(ler('js/mesa-ligacoes.js'),/localizacaoMapaId:String\(para\)/);
});
