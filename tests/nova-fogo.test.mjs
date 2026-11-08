import test from 'node:test';import assert from 'node:assert/strict';
import {acender,ignicao,avancarFogo,apagarFogo,extintor} from '../js/nova-fogo.js';
import {restaurarObjeto} from '../js/nova-dano-objetos.js';
const object=()=>({id:'o',nome:'Caixa',x:5,y:5,larguraM:2,alturaM:2,camada:3,pesoKg:150,inflamavel:true,inflamabilidade:3,destrutivel:true,pvAtual:5,pvMax:5,dureza:10,bloqueiaMovimento:true});
test('ignição usa calor, inflamabilidade e crítico; zero explícito não queima',()=>{
 const o=object();assert.equal(ignicao(o,{nome:'Laser'},false,null,0),true);assert.equal(ignicao({...object(),inflamabilidade:0},{nome:'Lança-chamas incendiário'},true,null,0),false);
 assert.equal(ignicao({...object(),inflamabilidade:1},{nome:'Laser'},false,null,0),false);assert.equal(ignicao({...object(),inflamabilidade:1},{nome:'Laser'},true,null,0),true);
});
test('fogo processa uma vez por rodada; destrói sem descontar dureza; restaurar apaga',()=>{
 const combat={active:true,session:'s',round:1},map={mapId:'m',combat},o=object(),scene={mapId:'m',objects:[o]};acender(o,combat,0);
 assert.equal(avancarFogo(scene,map,[],999999).messages.length,0);
 combat.round=2;assert.equal(avancarFogo(scene,map,[],999999).messages.length,1);assert.equal(o.pvAtual,3);
 assert.equal(avancarFogo(scene,map,[],999999).changed,false);
 combat.round=3;avancarFogo(scene,map);combat.round=4;avancarFogo(scene,map);assert.equal(o.destruido,true);assert.equal(o.pegandoFogo,false);assert.equal(o.bloqueiaMovimento,false);
 assert.equal(restaurarObjeto(o).pegandoFogo,false);assert.equal(restaurarObjeto(o).bloqueiaMovimento,true);
});
test('transição para exploração preserva segundos e propaga somente na camada; calor usa bordas',()=>{
 const o=object(),other={...object(),id:'b',x:7.1},upper={...object(),id:'c',camada:4},scene={mapId:'m',objects:[o,other,upper]},map={mapId:'m',combat:{active:true,session:'s',round:1}};
 acender(o,map.combat,0);map.combat.active=false;avancarFogo(scene,map,[],1000,()=>0);assert.equal(avancarFogo(scene,map,[],6999,()=>0).messages.length,0);
 const r=avancarFogo(scene,map,[{id:'a',x:6.5,y:5}],7000,()=>0);assert.equal(other.pegandoFogo,true);assert.equal(upper.pegandoFogo,undefined);assert.deepEqual(r.exposure,[{id:'a',damage:2}]);
});
test('extintor consome carga, acumula 100kg, exige equipamento e borda a 1,5m',()=>{
 const o=object();acender(o,null,0);const info={inventory:{equipado:[{nome:'Extintor',uso:5}]},health:{}},args={a:{id:'a',nome:'Ator',x:7,y:5},health:{actors:{}},map:{mapId:'m'},cmd:{mapId:'m',objectId:'o'},scene:{mapId:'m',objects:[o]},info,sheet:{}};
 const r=apagarFogo(args);assert.equal(r.inventory.equipado[0].usoAtual,4);assert.equal(r.scene.objects[0].pegandoFogo,true);assert.equal(o.estadoFogo.restanteKg,undefined);
 const r2=apagarFogo({...args,scene:r.scene,info:{...info,inventory:r.inventory}});assert.equal(r2.scene.objects[0].pegandoFogo,false);assert.equal(r2.inventory.equipado[0].usoAtual,3);
 assert.throws(()=>apagarFogo({...args,a:{...args.a,x:20}}),/alcance/);assert.throws(()=>apagarFogo({...args,health:{actors:{a:{combateLab:{inconsciente:true}}}}}),/estado/);
 assert.equal(extintor({mochila:[{nome:'Extintor',uso:5}]}),undefined);assert.equal(extintor({equipado:[{nome:'Extintor',uso:5,usoAtual:0}]}),undefined);
});
