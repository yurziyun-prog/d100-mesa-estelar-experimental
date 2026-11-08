import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as L from '../js/mesa-limpeza.js';
const ler=p=>/(^|\/)app\.js$/.test(p)?lerApp():readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('v149: faxina pega móveis de taverna e cópias por nome', ()=>{
 const objs=[...Array(10)].map((_,i)=>({id:'oficina:s:gen55:'+i,nome:'Rocha'})).concat([1,2,3,9].map(i=>({id:'oficina:o:gen1320:'+i,nome:'Porta da cápsula '+i})));
 assert.deepEqual([...L.gruposDeTaverna(objs,false)],['1320']);assert.equal(L.gruposDeTaverna(objs,true).size,0);
 assert.equal(L.soltoDeTaverna({id:'uuid',nome:'Porta da cápsula 9'},false),true);assert.equal(L.soltoDeTaverna({id:'uuid',nome:'Baú'},false),false);
 const t=[{id:'syncnpc%3Acomerciante_generico_1',nome:'Hessa Varn',mapaId:'m'},{id:'syncnpc%3Acomerciante_generico_1~49',nome:'Hessa Varn 49',mapaId:'m'},{id:'syncnpc%3Ax~2',nome:'Hessa Varn 7',mapaId:'m'},{id:'syncnpc%3Aguarda~2',nome:'Guarda 2',mapaId:'m'},{id:'syncnpc%3Aguarda',nome:'Guarda',mapaId:'m'}];
 assert.deepEqual(L.copiasPorNome(t,[{id:'comerciante_generico_1',nome:'Hessa Varn'},{id:'guarda',nome:'Guarda'}]).map(x=>x.nome).sort(),['Hessa Varn 49','Hessa Varn 7']);
 assert.match(ler('js/mesa-limpeza.js'),/limpezaV1(4[89]|5[0-9])/);
});
test('v149: menu de ações recolhível e fora do mapa; Denzel pelo nome', ()=>{
 const a=ler('js/mesa-acoes-mapa.js');assert.match(a,/ma-recolhido/);assert.match(a,/mesa:acoesRecolhido/);assert.match(a,/rb\.right\+10\+w/);
 assert.match(ler('js/mesa-pedagio.js'),/\^denzel/);
});
