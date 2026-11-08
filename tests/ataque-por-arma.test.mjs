import test from 'node:test';import assert from 'node:assert/strict';
import {ataquesPorArma,ataqueDaArma} from '../js/mesa-ataques-por-arma.js';
import {melhorDefesa} from '../js/mesa-tempo-real-ia.js';
const skill=(id,base,penalty)=>({id,nome:id,base,valor:base,attack:true,weapons:[{id:'laser',nome:'Laser',valor:base,penalty}]});
test('a arma usa perícia exata, sem duplicar opções por perícia',()=>{
 const sheet={skills:[skill('errada',90,2),skill('certa',50,0),skill('outra_certa',40,0)]};
 const ops=ataquesPorArma(sheet);assert.equal(ops.length,1);assert.equal(ops[0].skillId,'certa');assert.deepEqual(ops[0].alternativas,[]);
 assert.equal(ataqueDaArma(sheet,'laser','errada').skillId,'certa','pedido antigo também é remapeado');
});
test('alternativas aparecem somente sem perícia exata e podem ser selecionadas',()=>{
 const sheet={skills:[skill('proxima',50,1),skill('distante',80,2)]},a=ataquesPorArma(sheet)[0];
 assert.equal(a.improvisado,true);assert.equal(a.skillId,'proxima');assert.equal(a.alternativas.length,2);
 assert.equal(ataqueDaArma(sheet,'laser','distante').skillId,'distante');assert.equal(ataqueDaArma(sheet,'fora'),null);
 assert.equal(ataqueDaArma(sheet,'laser','distante').improvisado,true);assert.equal(ataqueDaArma(sheet,'laser','distante').alternativas.length,2);
});
test('defesa preferida é respeitada; indisponível usa a melhor possível',()=>{
 const pending={options:[{id:'per:esquiva',nome:'Esquiva',valor:40},{id:'esp:espada|w',nome:'Aparar (Espada)',valor:65}]};
 assert.equal(melhorDefesa(pending,'esquiva'),'per:esquiva');assert.equal(melhorDefesa(pending,'aparar'),'esp:espada|w');
 assert.equal(melhorDefesa({options:[pending.options[0]]},'aparar'),'per:esquiva');
});
