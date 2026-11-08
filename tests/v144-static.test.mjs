import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as A from '../js/mesa-andares.js';
import * as C from '../js/mesa-camera.js';
import * as T from '../js/mesa-trabalho.js';
import * as N from '../js/mesa-noite.js';
import {papelVida} from '../js/mesa-vida.js';
const ler=p=>/(^|\/)app\.js$/.test(p)?lerApp():readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('v144: andar de cima cobre o térreo; vão da escada aparece', ()=>{
 const objs=[{id:'p2',x:14,y:7,larguraM:28,alturaM:14,oficinaElement:{andarV144:2,pisoAndarV144:2}},{id:'mesa',x:20,y:7,larguraM:1,alturaM:1},{id:'esc',x:2,y:7,larguraM:2,alturaM:2,oficinaElement:{escadaAndarV144:true,andarAmbosV144:true}},{id:'cap',x:10,y:3,larguraM:1,alturaM:2,oficinaElement:{andarV144:2}}];
 const cob=A.coberturas(objs);
 assert.equal(A.objetoVisivel(objs[1],1,cob),true);assert.equal(A.objetoVisivel(objs[3],1,cob),false);
 assert.equal(A.objetoVisivel(objs[1],2,cob),false);assert.equal(A.objetoVisivel(objs[3],2,cob),true);assert.equal(A.objetoVisivel(objs[2],2,cob),true);
 assert.equal(A.tokenVisivel({x:20,y:7},1,2,cob),false);assert.equal(A.tokenVisivel({x:2,y:7},1,2,cob),true);
 assert.equal(A.barra({oficinaElement:{andarV144:2}},1),false);assert.deepEqual(A.andaresDoMapa(objs),[1,2]);
});
test('v144: câmera centraliza e para nas bordas', ()=>{
 assert.deepEqual(C.deslocamento({x:10,y:10},2,1000,500),{tx:0,ty:0});
 assert.deepEqual(C.deslocamento({x:500,y:250},2,1000,500),{tx:-500,ty:-250});
 assert.deepEqual(C.deslocamento({x:990,y:490},2,1000,500),{tx:-1000,ty:-500});
});
test('v144: trabalhadores e casas noturnas', ()=>{
 assert.equal(T.oficioDoMapa({nome:'Minas de Kharos'}),'minerador');assert.equal(T.oficioDoMapa({nome:'Floresta de Aun'}),'lenhador');
 assert.equal(T.ehRecurso({nome:'Rocha',larguraM:2},'minerador'),true);assert.equal(T.ehRecurso({nome:'Rocha',larguraM:40},'minerador'),false);
 assert.equal(T.deveVoltar({colhidoV144:{ate:5,ateReal:9}},6,0,true),true);assert.equal(T.deveVoltar({colhidoV144:{ate:5,ateReal:9}},0,8,false),false);
 assert.equal(papelVida({id:'syncnpc:a',texto:'Minerador 2'}),'minerador');assert.equal(papelVida({id:'syncnpc:a',texto:'Lenhador 1'}),'lenhador');
 assert.equal(N.modoRotina({id:'x',tipo:'comerciante_noturno',h:12}),'ausente');assert.equal(N.modoRotina({id:'x',tipo:'comerciante_noturno',h:23}),null);
});
test('v144: ganchos — colisão por andar, PV retrátil, foco removido, caminho sem cortar parede', ()=>{
 const d=ler('js/nova-direta.js');assert.match(d,/mesaAndarV144\?\.colide/);assert.match(d,/mesa:pvPartesAberto/);assert.match(d,/let mapFocus=true/);assert.match(d,/cenaAtual:\(\)=>sceneData/);
 const v=ler('js/mesa-vida.js');assert.doesNotMatch(v,/i%3===2/);assert.match(v,/gradeDe\(t\)/);
 assert.match(ler('js/mesa-cenarios-mapas.js'),/pisoAndarV144=2/);assert.match(ler('js/mesa-remodelagem.js'),/andaresV1(4[4-9]|5[0-9])/);
 const a=ler('js/app.js');for(const m of ['mesa-andares','mesa-camera','mesa-trabalho'])assert.match(a,new RegExp(m+'\\.js\\?v=\\d+'));
});
