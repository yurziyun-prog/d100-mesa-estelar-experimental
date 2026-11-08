import test from 'node:test';import assert from 'node:assert/strict';
import {zonaDoLocal,tipoIntermediario,paresDosCenarios,ordemPorAcesso,livrePerto,pontoDeBorda} from '../js/mesa-ligacoes.js';
const C=[
 {id:'C003',nome:'A Última Bateria',local:'Distrito inferior de Véspera',tipo:'Social',mapaId:'bar',destino1:'C002',destino2:'C014'},
 {id:'C002',nome:'Ruas Escavadas',local:'Ruas internas de Véspera',tipo:'Exploração',mapaId:'ruas',destino1:'C003',destino2:'C026'},
 {id:'C026',nome:'Porto Alto',local:'Véspera - Cidade Superior',tipo:'Social',mapaId:'porto',destino1:'C002'},
 {id:'C014',nome:'Mina',local:'Calico - zona de mineração',tipo:'Exploração',mapaId:'mina',destino1:'C010'},
 {id:'C010',nome:'Mar de Pedras',local:'Região dos Domínios de Vaelkor',tipo:'Viagem/Pilotagem',mapaId:'mar'}];
test('v126: regiões e mapas intermediários',()=>{
 assert.equal(zonaDoLocal('Calico - região florestal'),'rural');assert.equal(zonaDoLocal('Véspera - Cidade Baixa'),'urbano');
 assert.equal(tipoIntermediario(C[0],C[1]),'');assert.equal(tipoIntermediario(C[1],C[2]),'cidade');assert.equal(tipoIntermediario(C[0],C[3]),'ermos');
 assert.equal(tipoIntermediario(C[3],C[4]),''); // viagem já é o trajeto
});
test('v126: ligações pelos destinos dos cenários, sem repetir',()=>{
 const p=paresDosCenarios(C);assert.deepEqual(p.map(x=>[x.ma,x.mb].sort().join('-')).sort(),['bar-mina','bar-ruas','mar-mina','porto-ruas']);
});
test('v126: ordem por acesso e pontos de chegada',()=>{
 const ms=['bar','ruas','porto','mina','solto'].map(id=>({id,nome:id}));
 const L=[{a:{mapa:'bar'},b:{mapa:'ruas'}},{a:{mapa:'ruas'},b:{mapa:'porto'}},{a:{mapa:'bar'},b:{mapa:'mina'}}];
 assert.deepEqual(ordemPorAcesso(ms,L,'bar').map(m=>m.id),['bar','mina','ruas','porto','solto']);
 const p=livrePerto([{x:14,y:7,larguraM:4,alturaM:4,bloqueiaMovimento:true}],14,7);assert.ok(Math.hypot(p.x-14,p.y-7)>2);
 assert.equal(pontoDeBorda(0).lado,'leste');assert.equal(pontoDeBorda(1).lado,'oeste');
});
