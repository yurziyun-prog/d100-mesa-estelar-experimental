import test from 'node:test';import assert from 'node:assert/strict';
import {instalarEspaco,sobrepoemVertical,passaPorCima,alturaObjetoM,altitudePesM,ALTITUDE_MONTARIA_VOANDO} from '../js/mesa-espaco.js';
import {destinoSemColisao} from '../js/nova-colisao.js';
const pessoa=(id,x,y)=>({id,x,y,diametroM:1,arte3dV200:'cima_pessoa'});
test('voador alto passa por cima de quem está no chão; voo baixo (0,5 m) não é intangível',()=>{
 const h=pessoa('p',0,0),m=pessoa('m',1,0);
 assert.equal(sobrepoemVertical(h,m,false,false),true,'dois corpos no chão se bloqueiam');
 assert.equal(sobrepoemVertical(h,m,true,false),false,'montaria a 5 m passa por cima');
 // altitude baixa: 0,5 m ainda atravessa o corpo de 1,8 m
 const baixo={...m},A=[.5,.5+1.8],B=[0,1.8];assert.ok(A[0]<B[1]-.3&&B[0]<A[1]-.3,'voo a 0,5 m continua sobrepondo');
});
test('altura do objeto decide quem passa por cima',()=>{
 const parede={erTipo:'parede',bloqueiaMovimento:true},tronco={erTipo:'tronco'},rocha={nome:'Rocha 1x1'};
 assert.equal(alturaObjetoM(parede),3);assert.equal(passaPorCima(3,parede),false,'voo a 3 m bate na parede de 3 m');
 assert.equal(passaPorCima(ALTITUDE_MONTARIA_VOANDO,parede),true);assert.equal(passaPorCima(ALTITUDE_MONTARIA_VOANDO,tronco),true);assert.equal(passaPorCima(3,rocha),true);
});
test('colisão: o corpo voando atravessa outro corpo e a rocha, mas não a parede baixa em voo natural',()=>{
 let voando=new Set();globalThis.mesaVoandoV203=id=>voando.has(id);
 instalarEspaco({controller:()=>({token:id=>null})});
 const a=pessoa('a',5,5),b=pessoa('b',6,5);
 let r=destinoSemColisao(a,{x:9,y:5},[b],{larguraM:28,alturaM:14},[]);assert.ok(r.x<6,'no chão: bloqueado por b ('+r.x+')');
 voando.add('a');r=destinoSemColisao(a,{x:9,y:5},[b],{larguraM:28,alturaM:14},[]);assert.equal(r.x,9,'voando: passa por cima');
 const parede={id:'w',x:7,y:5,larguraM:.4,alturaM:4,bloqueiaMovimento:true,erTipo:'parede'};
 r=destinoSemColisao(a,{x:9,y:5},[],{larguraM:28,alturaM:14},[parede]);assert.equal(r.x,9,'a 5 m passa sobre a parede de 3 m');
 voando=new Set();r=destinoSemColisao(a,{x:9,y:5},[],{larguraM:28,alturaM:14},[parede]);assert.ok(r.x<7,'no chão a parede bloqueia');
 delete globalThis.mesaVoandoV203;delete globalThis.mesaEspacoV205;
});
test('criaturas que voam por natureza ficam a 3 m',()=>{assert.equal(altitudePesM({id:'synccriatura%3Avespa_de_vidro'}),3);assert.equal(altitudePesM({id:'synccriatura%3Azumbi_1'}),0);});
