import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {cobertura,buracos} from '../js/mesa-marcador.js';
import {registrar,aplicarRegistro,idBase} from '../js/mesa-fixos.js';
test('v174 marcador abre (linha de código não pode estar presa num comentário)',()=>{
 const s=readFileSync(new URL('../js/mesa-marcador.js',import.meta.url),'utf8');assert.match(s,/\n\s*const src=srcDoFundo\(cena\)/);
});
test('v174 parede apagada no 🛠️: marca sem cobertura sai; pedaço apagado vira passagem',()=>{
 const m={tipo:'parede',forma:'ret',x:0,y:0,w:4,h:1};
 assert.equal(cobertura(m,[]),0);assert.equal(cobertura(m,[{x:0,y:0,w:4,h:1}]),1);
 const b=buracos(m,[{x:0,y:0,w:2,h:1}]);assert.equal(b.length,1);assert.deepEqual(b[0],{x:2,y:0,w:2,h:1});
});
test('v174 o que o mestre apagou não volta: carro trocado não é reposto; apagar mata os registros do mesmo objeto',()=>{
 assert.equal(idBase('map:o:1_v172'),'map:o:1');
 const reg={'map:o:1':{k:'map:o:1',tipo:'adicionar',id:'map:o:1',nome:'Aerocarro',x:5,y:5,obj:{id:'map:o:1',nome:'Aerocarro',x:5,y:5}}};
 const cena={objects:[{id:'map:o:1_v172',nome:'Aerocarro',x:5,y:5,trocadoV172:true}]};
 assert.equal(aplicarRegistro(cena,reg).mudou,0);
 const r2=registrar(reg,[{tipo:'remover',id:'map:o:1_v172',nome:'Aerocarro',de:{x:5,y:5}}]);assert.ok(r2['map:o:1'].apagado);
 assert.equal(aplicarRegistro({objects:[]},r2).mudou,0);
});
test('v174 paredes invisíveis só aparecem no modo editar',()=>{
 const n=readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');assert.ok(!n.includes("node.style.opacity=user()?.master?'.22':'0'"));
 const v=readFileSync(new URL('../js/mesa-vista.js',import.meta.url),'utf8');assert.match(v,/mesa-editando/);
});
