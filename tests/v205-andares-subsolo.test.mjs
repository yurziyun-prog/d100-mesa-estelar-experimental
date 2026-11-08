import test from 'node:test';import assert from 'node:assert/strict';
import {coberturas,objetoVisivel,tokenVisivel,andaresDoMapa,destinoEscada,elevacaoDoAndar,elevacoesDoMapa,ANDAR_SUBSOLO} from '../js/mesa-andares.js';
const piso=(a,x,y,w,h,extra={})=>({id:'p'+a+x,x,y,larguraM:w,alturaM:h,andarV144:a,pisoAndarV144:a>1?a:undefined,...extra});
const S=ANDAR_SUBSOLO,sub=piso(S,10,5,6,4,{elevacaoAndarV205:-3});
const torre=piso(2,20,5,6,4);
const objs=[sub,torre,{id:'chao',x:14,y:7,larguraM:28,alturaM:14}];
test('ID positivo, elevação negativa: o subsolo fica abaixo do térreo',()=>{
 const el=elevacoesDoMapa(objs);assert.equal(elevacaoDoAndar(S,el),-3);assert.equal(elevacaoDoAndar(1,el),0);assert.equal(elevacaoDoAndar(2,el),3);
 assert.deepEqual(andaresDoMapa(objs),[S,1,2],'ordenado pela elevação, não pelo ID');
});
test('superfície não vê o subsolo (só os vãos); quem está no subsolo não vê a superfície',()=>{
 const cob=coberturas(objs,28,14),parede={id:'w',x:12,y:6,andarV144:S},solo={id:'s',x:12,y:6,andarV144:1};
 assert.equal(objetoVisivel(parede,1,cob),false,'objeto do subsolo visto do térreo: escondido');
 assert.equal(objetoVisivel(solo,S,cob),false,'objeto da superfície visto do subsolo: escondido');
 assert.equal(objetoVisivel(parede,S,cob),true);assert.equal(objetoVisivel(solo,1,cob),true);
 assert.equal(tokenVisivel({x:12,y:6},S,1,cob),false,'token no subsolo não aparece para quem está na superfície');
 assert.equal(tokenVisivel({x:12,y:6},1,S,cob),false);
 const comPoco=coberturas([...objs,{id:'poco',x:12,y:6,larguraM:1,alturaM:1,andarV144:1,andarAmbosV144:true,vaoAndarV144:true}],28,14);
 assert.equal(objetoVisivel({id:'q',x:12,y:6,andarV144:S},1,comPoco),true,'pelo vão do poço se vê o subsolo');
});
test('mapas antigos seguem iguais: 2º andar cobre o térreo e é invisível de baixo',()=>{
 const cob=coberturas([torre],28,14);assert.equal(objetoVisivel({id:'t',x:20,y:5,andarV144:2},1,cob),false);assert.equal(objetoVisivel({id:'t',x:20,y:5,andarV144:1},2,cob),false,'térreo debaixo do piso do 2º andar fica coberto');
 assert.equal(objetoVisivel({id:'t',x:3,y:3,andarV144:1},2,cob),true,'fora do piso do 2º andar o térreo continua visível');
});
test('destino explícito entre superfície e subsolo; subir não é somar 1',()=>{
 const poco={ligaAndaresV205:[1,S]};assert.equal(destinoEscada(poco,1,[S,1,2]),S);assert.equal(destinoEscada(poco,S,[S,1,2]),1);
 assert.equal(destinoEscada({andarBaseV198:1},1,[1,2]),2,'escada do editor continua 1→2');assert.equal(destinoEscada({andarBaseV198:1},2,[1,2]),1);
});
