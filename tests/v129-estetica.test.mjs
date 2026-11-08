import test from 'node:test';import assert from 'node:assert/strict';
import {gerarMapa,sugerirEstilo,ESTILOS} from '../js/mesa-gerador-mapas.js';
import {PACOTE_NOVO,desenharObjeto,DESENHOS} from '../js/mesa-arte-objetos.js';
import {textoDoBilhete,itensProvaveis} from '../js/mesa-recheio.js';
import {tipoInterativo} from '../js/mesa-objetos.js';
test('v129: móveis dos três estilos desenham e alguns são interativos',()=>{
 const novos=PACOTE_NOVO.filter(p=>p.estiloV129);assert.ok(novos.length>=19);
 for(const p of novos){assert.ok(DESENHOS[p.tipo],p.tipo);assert.match(desenharObjeto(p,p.larguraM,p.alturaM),/^<svg/);}
 assert.equal(tipoInterativo({nome:'Baú brasonado'}),'recipiente');assert.equal(tipoInterativo({nome:'Armário de metal'}),'recipiente');
 assert.equal(tipoInterativo({nome:'Braseiro de plasma'}),'luz');assert.equal(tipoInterativo({nome:'Porta deslizante'}),'porta');assert.equal(tipoInterativo({nome:'Console holográfico'}),'maquina');
});
test('v129: gerador com estilo usa cores e móveis do estilo',()=>{
 const objetos=PACOTE_NOVO.map(p=>({...p}));
 const st=gerarMapa({tipo:'interior',estilo:'feudal',semente:7,objetos});
 assert.equal(st.estiloV129,'feudal');assert.equal(st.bg,ESTILOS.feudal.bg);
 assert.ok(st.elements.some(e=>/^pk_feu_/.test(e.modeloId||'')));assert.ok(st.elements.some(e=>e.nome==='Passadeira carmim'));
 assert.ok(st.elements.filter(e=>e.nome==='Parede').every(e=>e.fill===ESTILOS.feudal.parede));
 assert.equal(sugerirEstilo('Palácio de Vaelkor'),'feudal');assert.equal(sugerirEstilo('Mercado das Mil Panelas'),'retro');assert.equal(sugerirEstilo('Porto Alto de Véspera'),'futurista');
});
test('v129: bilhete a partir do cenário e itens prováveis',()=>{
 const b=textoDoBilhete({nome:'Bar',eventos:'Às 22h a luz cai e alguém foge pelos fundos do bar.',segredos:'SEGREDO DO MESTRE'},'feudal');
 assert.equal(b.titulo,'Pergaminho selado');assert.doesNotMatch(b.texto,/22h|SEGREDO/); // v134: bilhete nunca usa as notas do mestre
 const l=itensProvaveis([{id:'a',nome:'Nave',categoria:'veículo'},{id:'b',nome:'Kit',categoria:'equipamentos'}],3);assert.equal(l[0].id,'b');
});
