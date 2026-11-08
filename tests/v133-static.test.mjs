import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {gravidade,localParaTratar,ehMedico,vontadeDeSocorrer,papelTatico,testeConsciencia,restanteRelogio,escolherPsi,planejarManobra} from '../js/mesa-tempo-real-tatica.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v133: recuperação — consciência com Resistência + 5 por PV curado; relógio respeitado',()=>{
 const r=testeConsciencia({resistencia:40,curas:[{pv:2}]},45);assert.equal(r.valor,50);assert.ok(r.sucesso);
 assert.ok(!testeConsciencia({resistencia:40},45).sucesso);
 assert.equal(restanteRelogio({remaining:6000,at:Date.now()-2000})>3000,true);assert.equal(restanteRelogio({remaining:1000,at:Date.now()-2000}),0);
 const rt=ler('mesa-tempo-real.js');assert.match(rt,/Teste de consciência/);assert.match(rt,/rtConsciencia/);assert.match(rt,/ataquesBloqueadosTurnos/);
});
test('v133: socorro — médico prefere curar; ameaçado se protege',()=>{
 const st={hitMax:{Peito:10,Braco:6},hit:{Peito:-1,Braco:6},ferimentos:{Peito:'Grave'},inconsciente:true};
 assert.ok(gravidade(st)>2);assert.equal(localParaTratar(st),'Peito');assert.equal(gravidade({morto:true}),0);
 assert.ok(ehMedico({primeirosSocorros:72}));assert.ok(ehMedico({texto:'Médica da clínica'}));
 const medico=vontadeDeSocorrer({valor:72,medico:true,gravidade:3.2});assert.ok(medico>.9);
 assert.ok(vontadeDeSocorrer({valor:20,gravidade:1})<.5);
 assert.equal(vontadeDeSocorrer({valor:40,gravidade:1,ameacado:true}),0);
 assert.ok(vontadeDeSocorrer({valor:72,medico:true,gravidade:3.2,ameacado:true})>0);
});
test('v133: papéis — fraco no corpo a corpo fica atrás, atira, usa psi ou se esconde',()=>{
 assert.equal(papelTatico({corpoACorpo:30,aDistancia:55}),'atirador');
 assert.equal(papelTatico({corpoACorpo:20,psi:{max:10,poderes:[{id:'atordoar_psi'}]}}),'psiquico');
 assert.equal(papelTatico({corpoACorpo:10}),'escondido');assert.equal(papelTatico({corpoACorpo:60}),'linha');
 assert.equal(escolherPsi({psi:{poderes:[{id:'grito_psiquico',custo:3,valor:50},{id:'atordoar_psi',custo:2,valor:60,alcance:20}]}},{psiLivre:5,distAlvo:5,noCone:3}).id,'grito_psiquico');
 assert.equal(escolherPsi({psi:{poderes:[{id:'atordoar_psi',custo:2,valor:60,alcance:20}]}},{psiLivre:1,distAlvo:5}),null);
});
test('v133: manobras — ninguém estaciona',()=>{
 const m=planejarManobra({eu:{x:5,y:5},alvo:{x:6.3,y:5},papel:'linha',pensa:true,rnd:()=>.1});assert.ok(m&&m.tipo==='flanquear');
 const a=planejarManobra({eu:{x:5,y:5},alvo:{x:7,y:5},papel:'atirador',alcance:20,rnd:()=>.3});assert.ok(Math.hypot(a.x-7,a.y-5)>=4);
 const f=planejarManobra({eu:{x:5,y:5},alvo:{x:6,y:5},pensa:true,frac:.3,aliados:[{x:3,y:5}]});assert.equal(f.tipo,'recuar');assert.ok(f.x<3);
 assert.equal(planejarManobra({eu:{x:5,y:5},alvo:{x:6,y:5},semMente:true}),null);
 const nd=ler('nova-direta.js');assert.match(nd,/botões só do mestre/);assert.match(nd,/armaCaida/);
});
