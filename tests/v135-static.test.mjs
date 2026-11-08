import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {agoraJogo,descreverHora,ambientePelaHora,dormir,horaNaCapsula,ferramentasDe,HORA} from '../js/mesa-relogio.js';
import {tipoInterativo,ferramentaPara,aplicarPedido} from '../js/mesa-objetos.js';
import {AMBIENTES} from '../js/mesa-visual.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v135: relógio do jogo (24 h = 1 h real por padrão) e luz pela hora',()=>{
 const r={ativo:true,jogoMs:8*HORA,realMs:Date.now()-150000,fator:24};
 assert.equal(descreverHora(agoraJogo(r)).hora,9);assert.equal(descreverHora(agoraJogo({...r,ativo:false})).hora,8);
 assert.equal(ambientePelaHora(12),'dia');assert.equal(ambientePelaHora(18),'entardecer');assert.equal(ambientePelaHora(2),'noite');
 assert.ok(AMBIENTES.auto);
});
test('v135: sono recupera Fadiga; cápsula cura PV e tira do coma',()=>{
 assert.deepEqual(dormir('Tired',0,3),{nivel:'Winded',acum:0});assert.equal(dormir('Wearied',0,8).nivel,'Tired');assert.equal(dormir('Winded',0,1).nivel,'Fresh');
 const r=horaNaCapsula({inconsciente:true,hitMax:{'Cabeça':5,Peito:6},hit:{'Cabeça':0,Peito:6},ferimentos:{'Cabeça':'Grave'}});
 assert.equal(r.pv,1);assert.ok(r.acordou);assert.ok(r.st.estabilizados['Cabeça']);
 assert.equal(tipoInterativo({nome:'Cápsula de recuperação 1'}),'recuperacao');assert.equal(tipoInterativo({nome:'Cama de solteiro'}),'descanso');
 assert.equal(tipoInterativo({nome:'Cápsula de aluguel 3'}),'descanso');assert.equal(tipoInterativo({nome:'Porta da cápsula 3'}),'porta');
});
test('v135: lanterna, machado, picareta, extintor e kit',()=>{
 const f=ferramentasDe(['Lanterna tática','Machado','Picareta','Extintor portátil','Kit médico']);assert.ok(f.lanterna&&f.machado&&f.picareta&&f.extintor&&f.kit);
 assert.equal(ferramentaPara({nome:'Caixote',material:'Madeira'},{machado:true}).id,'machado');
 assert.equal(ferramentaPara({nome:'Pedra grande',material:'Pedra'},{picareta:true}).id,'picareta');
 assert.equal(ferramentaPara({nome:'Pedra grande',material:'Pedra'},{machado:true}),null);
 const q=aplicarPedido({id:'x',nome:'Caixote',bloqueiaMovimento:true},{acao:'quebrar',nome:'Lira',verbo:'Cortar',ferramenta:'o machado',teste:{sucesso:true,die:20,valor:70,grau:'Sucesso'}});
 assert.ok(q.objeto.destruido);assert.equal(q.objeto.bloqueiaMovimento,false);
 assert.match(ler('mesa-visual.js'),/lanterna/);assert.match(ler('app.js'),/certaV135/);assert.match(ler('mesa-objetos.js'),/data-extintor/);
});
