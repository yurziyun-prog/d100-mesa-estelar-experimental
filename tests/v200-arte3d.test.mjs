import test from 'node:test';
import assert from 'node:assert/strict';
import {direcaoPor,folhaDe,existe3D,lista3D} from '../js/mesa-arte3d.js';
test('direção do desenho pelo movimento: lado (espelha para a direita), costas ao subir, frente ao descer',()=>{
 assert.deepEqual(direcaoPor(-5,0),{dir:'lado',espelha:false});
 assert.deepEqual(direcaoPor(5,1),{dir:'lado',espelha:true});
 assert.deepEqual(direcaoPor(1,-6),{dir:'costas',espelha:false});
 assert.deepEqual(direcaoPor(0,6),{dir:'frente',espelha:false});
 assert.deepEqual(direcaoPor(0,0,{dir:'costas',espelha:false}),{dir:'costas',espelha:false},'parado: mantém a direção');
});
test('folhas 3D: ação/direção com queda para o lado',()=>{
 assert.ok(existe3D('h_adventurer')&&!existe3D('nada'));
 assert.ok(lista3D().length>=30);
 const a=folhaDe('h_adventurer','andar','costas');assert.match(a.arquivo,/h_adventurer_andar_costas\.webp$/);assert.equal(a.quadros,8);
 assert.match(folhaDe('h_adventurer','morrer','frente').arquivo,/morrer_lado/,'morrer só existe de lado: cai para o lado');
 assert.equal(folhaDe('zzz','andar','lado'),null);
});
