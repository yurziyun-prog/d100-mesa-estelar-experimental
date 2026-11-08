import test from 'node:test';
import assert from 'node:assert/strict';
import {agrupar,resumoMarcas,limparMarcas,DOC_GALERIA} from '../js/mesa-galeria3d.js';
import {SPRITES_3D} from '../js/mesa-sprites-3d-dados.js';
test('galeria 3D: agrupa todos os modelos por tipo, sem perder nenhum',()=>{
 const g=agrupar(),n=Object.values(g).reduce((s,l)=>s+l.length,0);
 assert.equal(n,Object.keys(SPRITES_3D).length);assert.ok(Object.keys(g).includes('Monstro')&&Object.keys(g).includes('Zumbi')||Object.keys(g).length>=3);
 assert.equal(DOC_GALERIA,'configuracoes/galeria3dV201');
});
test('galeria 3D: lista exportada diz quem gostou e no lugar de quem; limpa marcas vazias',()=>{
 const m=limparMarcas({h_king:{gostei:true,para:[{id:'zumbi_1',nome:'Cadáver'}],nota:'bom'},h_punk:{naogostei:true},m_witch:{}});
 assert.deepEqual(Object.keys(m).sort(),['h_king','h_punk']);
 const t=resumoMarcas(m);
 assert.match(t,/EU GOSTEI \(1\)/);assert.match(t,/substitui: Cadáver/);assert.match(t,/NÃO gostei \(1\)/);
});
