import test from 'node:test';
import assert from 'node:assert/strict';
import {ehMontaria,montariaVoa,velocidadeDe} from '../js/mesa-transporte.js';
import {destinoSemColisao} from '../js/nova-colisao.js';

test('dragão-trombeta domesticado (alado e corredor) vira montaria; selvagem não', () => {
  for (const id of ['dragao_trombeta_alado_domesticado', 'dragao_trombeta_corredor_domesticado']) assert.equal(ehMontaria({ id, nome: 'Dragão-trombeta' }), true, id);
  for (const id of ['dragao_trombeta_alado_selvagem', 'dragao_trombeta_corredor_selvagem']) assert.equal(ehMontaria({ id, nome: 'Dragão-trombeta' }), false, id);
});

test('só a montaria alada voa e é mais rápida', () => {
  const alado = { tipo: 'montaria', alvoId: 'synccriatura:dragao_trombeta_alado_domesticado~1', nome: 'Dragão' };
  const corredor = { tipo: 'montaria', alvoId: 'synccriatura:dragao_trombeta_corredor_domesticado~1', nome: 'Dragão' };
  assert.equal(montariaVoa(alado), true);
  assert.equal(montariaVoa(corredor), false);
  assert.ok(velocidadeDe(alado) > velocidadeDe(corredor));
});

test('quem voa atravessa paredes; quem não voa é barrado', () => {
  const parede = { id: 'p', x: 10, y: 7, larguraM: 1, alturaM: 8, bloqueiaMovimento: true, camada: 3 };
  const tok = { id: 'pj', x: 8, y: 7, diametroM: 1 };
  const destino = { x: 12, y: 7 };
  globalThis.mesaVoandoV203 = () => false;
  assert.ok(destinoSemColisao(tok, destino, [], {}, [parede]).x < 10);
  globalThis.mesaVoandoV203 = id => id === 'pj';
  assert.equal(destinoSemColisao(tok, destino, [], {}, [parede]).x, 12);
  delete globalThis.mesaVoandoV203;
});
