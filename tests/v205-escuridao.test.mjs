import test from 'node:test';import assert from 'node:assert/strict';
import {fontesDeLuz,segmentosDeBloqueio,poligonoDeVisao,luzDoToken,RAIO_LANTERNA} from '../js/mesa-escuridao.js';
import {letrasEquipadas} from '../js/mesa-equip-visual.js';
const W=28,H=14;
test('só o EQUIPADO acende: lanterna/tocha/espada de energia viram letras; mochila não',()=>{
 assert.equal(letrasEquipadas([{nome:'Lanterna tática'}]).includes('L'),true);assert.equal(letrasEquipadas([{nome:'Tocha'}]).includes('T'),true);
 assert.equal(letrasEquipadas([{nome:'Espada de energia'}]).includes('N'),true);assert.equal(letrasEquipadas([{nome:'Espada longa'}]).includes('N'),false,'espada comum não é fonte de luz');
 assert.equal(letrasEquipadas([]),'','item guardado (não equipado) não entra na lista');
});
test('luz do token vem da letra gravada no visual',()=>{
 assert.deepEqual(luzDoToken({id:'a',visualV203:'z=LT'}),{lanterna:true,tocha:true,energia:false});assert.deepEqual(luzDoToken({id:'a',visualV203:'z=ME'}),{lanterna:false,tocha:false,energia:false});
});
test('fontes: lâmpada ligada, apagada, entrada de luz e lanterna do token (só no nível certo)',()=>{
 const objs=[{id:'l1',nome:'Lampião de poste',x:2,y:2,andarV144:9,estadoInterativo:{ligado:true}},{id:'l2',nome:'Lampião de poste',x:4,y:2,andarV144:9,estadoInterativo:{ligado:false}},
  {id:'poco',nome:'Alçapão',x:5,y:5,andarV144:1,andarAmbosV144:true,ligaAndaresV205:[1,9],luzEntradaV205:{raio:3.4}},{id:'sup',nome:'Lampião',x:6,y:6,andarV144:1,estadoInterativo:{ligado:true}}];
 const toks=[{id:'t',x:1,y:1,nivel:9,visualV203:'z=L'},{id:'u',x:1,y:1,nivel:1,visualV203:'z=L'}];
 const f=fontesDeLuz({tokens:toks,objs,nivel:9,W,H});
 assert.deepEqual(f.map(x=>x.tipo).sort(),['entrada','lanterna','objeto'],'lâmpada apagada e lanterna de outro nível não contam: '+JSON.stringify(f.map(x=>x.tipo+':'+x.id)));
 assert.equal(f.find(x=>x.tipo==='lanterna').raio,RAIO_LANTERNA);
 assert.equal(fontesDeLuz({tokens:[],objs:[objs[3]],nivel:9,W,H}).length,0,'luz da superfície não ilumina o subsolo');
});
test('paredes cortam a luz: nada ilumina através de rocha/porta fechada',()=>{
 const parede={id:'w',x:6,y:5,larguraM:.5,alturaM:6,bloqueiaMovimento:true,andarV144:9},segs=segmentosDeBloqueio([parede],9,W,H);
 assert.equal(segs.length,4);
 const pol=poligonoDeVisao({x:3,y:5},9,segs,64),leste=pol[0].x; // raio exatamente para leste
 assert.ok(leste<6.4,'a luz para na parede (x máx '+leste.toFixed(2)+')');
 const livre=poligonoDeVisao({x:3,y:5},9,[],64);assert.ok(livre[0].x>11.5,'sem parede a luz alcança 9 m');
 assert.equal(segmentosDeBloqueio([{...parede,andarV144:1}],9,W,H).length,0,'parede de outro nível não bloqueia');
 assert.equal(segmentosDeBloqueio([{...parede,bloqueiaMovimento:false}],9,W,H).length,0,'porta aberta/objeto passável não bloqueia');
});
