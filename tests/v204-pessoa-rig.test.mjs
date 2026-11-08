import test from 'node:test';
import assert from 'node:assert/strict';
import {lerVisual,textoVisual,camadaVisivel,CAMADAS_PESSOA,corCamadasPessoa,ESTILOS_PESSOA} from '../js/mesa-arte3d.js';
import {SPRITES_3D} from '../js/mesa-sprites-3d-dados.js';

test('visual da pessoa: calça, ida e volta do texto e limite de 160 caracteres', () => {
  const v = lerVisual('', 'id-x');
  assert.match(v.q, /^#[0-9a-f]{6}$/i);
  const t = textoVisual({ ...v, h: 'volumoso', m: 'bordaemb', o: 'pontuda', x: 'COFHSM', capa: 1 });
  assert.ok(t.length <= 160, 'cabe na regra do Firestore: ' + t.length);
  const w = lerVisual(t, 'id-x');
  assert.equal(w.q, v.q); assert.equal(w.x, 'COFHSM'); assert.equal(w.h, 'volumoso');
  assert.equal(corCamadasPessoa(w).calca, w.q);
});

test('estilos prontos definem calça e cores realistas (sem amarelo/azul de desenho)', () => {
  for (const [, , e] of ESTILOS_PESSOA) assert.ok(e.q && e.r && e.d, 'estilo completo');
});

test('camadas: calça sempre aparece; capa só com capa; cabelo só o escolhido', () => {
  const v = lerVisual('h=longo;capa=0', 'a');
  assert.equal(camadaVisivel(v, 'calca'), true);
  assert.equal(camadaVisivel(v, 'capa'), false);
  assert.equal(camadaVisivel(v, 'cabelo_longo'), true);
  assert.equal(camadaVisivel(v, 'cabelo_curto'), false);
});

test('catálogo da pessoa com esqueleto: todas as camadas e vistas do editor existem', () => {
  const cam = SPRITES_3D.cima_pessoa?.camadas;
  assert.ok(cam, 'cima_pessoa registrado');
  for (const c of CAMADAS_PESSOA) {
    assert.ok(cam[c], 'camada ' + c);
    for (const k of ['parado_lado', 'andar_lado', 'parado_frente', 'parado_costas', 'parado_perfil', 'andar_perfil']) assert.ok(cam[c][k]?.arquivo && cam[c][k].quadros >= 1, c + ' ' + k);
  }
  for (const a of ['atacar_lado', 'golpe_lado', 'morrer_lado', 'deitado_lado', 'sentado_lado']) assert.ok(cam.roupa[a], a);
});

test('equipamento da ficha vira acessório da miniatura (mochila, capacete, capa, armadura)', async () => {
  const {letrasEquipadas, visualComEquipamento} = await import('../js/mesa-equip-visual.js');
  assert.equal(letrasEquipadas([{ nome: 'Mochila de viagem' }, { nome: 'Capacete de combate' }]), 'KM');
  assert.equal(letrasEquipadas([{ nome: 'Capa de viajante' }, { nome: 'Colete biomesh' }]), 'AS');
  assert.equal(letrasEquipadas([{ nome: 'Chapéu de couro' }, null]), 'C');
  assert.equal(letrasEquipadas([{ nome: 'Comunicador' }]), '');
  const t = visualComEquipamento('h=curto', 'id', 'KM');
  assert.ok(/z=KM/.test(t)); assert.equal(visualComEquipamento(t, 'id', 'KM'), null, 'sem mudança não regrava');
  const v = lerVisual(t, 'id');
  assert.equal(camadaVisivel(v, 'ac_mochila'), true); assert.equal(camadaVisivel(v, 'ac_capacete'), true);
  assert.equal(camadaVisivel(v, 'cabelo_curto'), false, 'capacete cobre o cabelo');
  assert.equal(camadaVisivel(lerVisual('capa=0;z=A', 'id'), 'capa'), true, 'capa equipada aparece');
});

test('de costas a capa e a mochila ficam por cima do corpo; nas outras vistas, atrás', async () => {
  const {ordemCamadas} = await import('../js/mesa-arte3d.js');
  const costas = ordemCamadas('costas'), cima = ordemCamadas('cima');
  assert.ok(costas.indexOf('capa') > costas.indexOf('pele') && costas.indexOf('ac_mochila') > costas.indexOf('capa'));
  assert.ok(cima.indexOf('capa') < cima.indexOf('roupa'));
});
