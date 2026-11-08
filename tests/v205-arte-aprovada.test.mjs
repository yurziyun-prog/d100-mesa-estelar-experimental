import test from 'node:test';import assert from 'node:assert/strict';
import {SPRITES_3D as S} from '../js/mesa-sprites-3d-dados.js';
test('a arte aprovada do dragão-trombeta corredor (Blender) continua sendo a das duas espécies do mapa',()=>{
 for(const k of ['cima_dragao_trombeta_corredor_domesticado','cima_dragao_trombeta_corredor_selvagem']){
  assert.ok(S[k].aprovadaV205,k+' marcado como arte aprovada');assert.match(S[k].folhas.andar_lado.arquivo,/^blender_dragao_trombeta_cima_/,k+' aponta para a arte do Blender');}
 assert.ok(S.blender_dragao_trombeta_cima,'a arte original aprovada continua no catálogo');
});
