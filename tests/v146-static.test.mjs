import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as L from '../js/mesa-limpeza.js';
import * as A from '../js/mesa-arte-objetos.js';
import {tipoInterativo} from '../js/mesa-objetos.js';
import {gerarDoCenario} from '../js/mesa-cenarios-mapas.js';
import {aplicarRegistro} from '../js/mesa-fixos.js';
import {NIVEIS} from '../js/mesa-camera.js';
const ler=p=>/(^|\/)app\.js$/.test(p)?lerApp():readFileSync(new URL('../'+p,import.meta.url),'utf8');
const objetos=A.PACOTE_NOVO.map(p=>({...p,larguraM:p.larguraM||1,alturaM:p.alturaM||1}));

test('v146: Última Bateria 28×14 com escada vertical, beliches e ladrilhos', ()=>{
 const st=gerarDoCenario({id:'c_ub',nome:'A Última Bateria'},{objetos});
 assert.equal(st.w,28);assert.equal(st.h,14);
 const els=st.elements,n=e=>String(e.nome||e.name||'');
 const esc=els.find(e=>e.escadaAndarV144);assert.equal(esc.modeloId,'pk_escada_interna');assert.ok(esc.h>esc.w,'escada na vertical');
 assert.equal(els.filter(e=>e.modeloId==='pk_beliche').length,6);
 assert.ok(els.filter(e=>/^pk_ladrilhos_retro/.test(e.modeloId)).length>=8);assert.ok(els.filter(e=>e.modeloId==='pk_ladrilhos_metal').length>=8);
 assert.ok(els.some(e=>/banheiro \(unissex\)/i.test(n(e))));
 for(const k of [1,2,3,4,5,6,7,8])assert.ok(els.some(e=>n(e)==='Porta da cápsula '+k),'porta '+k);
 assert.ok(A.desenharObjeto(objetos.find(o=>o.id==='pk_beliche'),1.3,2.2).includes('<svg'));
});
test('v146: escada e corredor não viram cama', ()=>{
 assert.equal(tipoInterativo({nome:'Escada para os dormitórios'}),'');assert.equal(tipoInterativo({nome:'Corredor dos dormitórios'}),'');
 assert.equal(tipoInterativo({nome:'Beliche A1 (de cima e de baixo)'}),'descanso');assert.equal(tipoInterativo({nome:'Porta do dormitório A'}),'porta');
});
test('v146: faxina tira móveis de outro mapa e cópias de NPC único', ()=>{
 const cenas=new Map([['ub',[{id:'oficina:o:gen77:1'},{id:'oficina:o:gen77:2'},{id:'oficina:o:gen77:3'}]],['portao',[{id:'oficina:s:gen55:1'},{id:'oficina:s:gen55:2'},{id:'oficina:s:gen55:3'},{id:'oficina:s:gen55:4'},{id:'oficina:o:gen77:9'},{id:'mestre-uuid'}]]]);
 const dono=L.donosDasSementes(cenas),r=L.semVazados(cenas.get('portao'),'portao',dono);
 assert.deepEqual(r.fora.map(o=>o.id),['oficina:o:gen77:9']);assert.equal(r.fica.length,5);
 const toks=[{id:'syncnpc%3Acomerciante_generico_1~7'},{id:'syncnpc:comerciante_generico_1'},{id:'syncnpc:guarda_cidade~3'},{id:'syncnpc:comerciante_generico_grey~2'},{id:'syncnpc:trabalhador_minerador~4'}];
 assert.deepEqual(L.copiasDeUnicos(toks,[{id:'comerciante_generico_1',nome:'Hessa Varn'},{id:'guarda_cidade',nome:'Guarda da Cidade Superior'},{id:'comerciante_generico_grey',nome:'Comerciante'},{id:'trabalhador_minerador',nome:'Minerador'}]).map(t=>t.id),['syncnpc%3Acomerciante_generico_1~7']);
 assert.equal(L.npcUnico({id:'guarda_do_portao_1',nome:'Denzel'}),true);assert.equal(L.npcUnico({id:'x',nome:'Insetoide 3'}),false);
});
test('v146: registro do mestre não traz móvel gerado para outro mapa', ()=>{
 const cena={objects:[{id:'oficina:s:gen55:1',nome:'Rocha',x:1,y:1}]};
 const reg={a:{k:'a',tipo:'adicionar',id:'oficina:o:gen77:5',nome:'Cápsula',x:5,y:5,obj:{id:'oficina:o:gen77:5',nome:'Cápsula'},ts:1},b:{k:'b',tipo:'adicionar',id:'uuid-1',nome:'Baú',x:2,y:2,obj:{id:'uuid-1',nome:'Baú'},ts:2}};
 const r=aplicarRegistro(cena,reg);assert.deepEqual(r.cena.objects.map(o=>o.id),['oficina:s:gen55:1','uuid-1']);
});
test('v146: zoom até 4×, posturas recolhíveis, Denzel e guardas abrem conversa', ()=>{
 assert.deepEqual(NIVEIS,[1,1.5,2,3,4]);
 assert.match(ler('js/mesa-camera.js'),/ctrlKey/);assert.match(ler('js/mesa-posturas.js'),/mesa:posturasAberto/);
 assert.match(ler('js/mesa-acoes-mapa.js'),/mesaDialogoNPC_/);assert.match(ler('js/mesa-pedagio.js'),/mesaDialogoNPC_/);assert.match(ler('js/mesa-cidade-alta.js'),/mesaDialogoNPC_/);
 assert.match(ler('js/app.js'),/mesa-limpeza\.js\?v=1(4[6-9]|5[0-9])/);assert.match(ler('js/mesa-remodelagem.js'),/andaresV1(4[6-9]|5[0-9])/);
});
