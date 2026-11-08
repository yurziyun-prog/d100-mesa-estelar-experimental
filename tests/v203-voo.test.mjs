// v203 — criaturas voadoras passam por muros; só o telhado as detém. Copas: transparência para quem está embaixo e queda junto com o tronco. Passageiros nos veículos.
import test from 'node:test';import assert from 'node:assert/strict';
import {montarGrade,caminho} from '../js/mesa-tempo-real-ia.js';
import {copaEmbaixo,copasOrfas} from '../js/mesa-copas.js';
import {capacidadeDe,passageirosPor} from '../js/mesa-transporte.js';
const W=40,H=20;
test('v203: muro barra quem anda, mas o voador (grade só com telhados) passa por cima',()=>{
 const muro=[{x:20,y:10,larguraM:1,alturaM:18,angulo:0}];
 const chao=montarGrade(muro,W,H),voo=montarGrade([],W,H);
 const fim=p=>p.length?Math.hypot(p[p.length-1].x-35,p[p.length-1].y-10):99;
 assert.ok(fim(caminho(chao,{x:5,y:10},{x:35,y:10}))>8,'a pé: o muro para antes do alvo');
 assert.ok(fim(caminho(voo,{x:5,y:10},{x:35,y:10}))<.5,'voando: passa por cima do muro e chega ao alvo');
});
test('v203: telhado cobre o alvo — o voador não tem caminho até dentro (precisa quebrar o telhado)',()=>{
 const telhado=[{x:30,y:10,larguraM:8,alturaM:6,angulo:0}];
 const voo=montarGrade(telhado,W,H);
 const fim=p=>p.length?Math.hypot(p[p.length-1].x-30,p[p.length-1].y-10):99;
 assert.ok(fim(caminho(voo,{x:5,y:10},{x:30,y:10}))>1.2,'alvo debaixo do telhado: o caminho para antes (é aí que quebra o telhado)');
 assert.ok(fim(caminho(montarGrade([],W,H),{x:5,y:10},{x:30,y:10}))<.5,'telhado quebrado: caminho livre');
});
test('v203: copa fica transparente só para quem está embaixo; copa cai junto com o tronco',()=>{
 const copa={id:'c1',erTipo:'copa',x:14,y:7,larguraM:5,grupoArvoreV203:'g1'};
 assert.ok(copaEmbaixo(copa,[{x:14.2,y:7.1}],28,14),'embaixo');assert.ok(!copaEmbaixo(copa,[{x:20,y:7}],28,14),'longe');
 const tronco={id:'t1',erTipo:'tronco',grupoArvoreV203:'g1',destrutivel:true,pvMax:60,pvAtual:60};
 assert.deepEqual(copasOrfas([copa,tronco]),[]);
 assert.deepEqual(copasOrfas([copa,{...tronco,pvAtual:0,destruido:true}]),['c1']);
});
test('v203: capacidade dos veículos por tamanho; contagem de passageiros',()=>{
 assert.equal(capacidadeDe({larguraM:.9,alturaM:2.2}),1,'moto');assert.ok(capacidadeDe({larguraM:2.6,alturaM:4.9})>=4,'aerocarro');assert.ok(capacidadeDe({larguraM:5.6,alturaM:21.8})>=8,'cargueiro');
 const m=passageirosPor({a:{transporteV190:{tipo:'passageiro',alvoId:'v1'}},b:{transporteV190:{tipo:'passageiro',alvoId:'v1'}},c:{transporteV190:{tipo:'terrestre',alvoId:'v1'}}});assert.equal(m.get('v1'),2);
});
