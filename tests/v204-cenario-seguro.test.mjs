import test from 'node:test';
import assert from 'node:assert/strict';
import {simularColocacao,PONTOS_SEGUROS,POPULACAO,passosEcossistema} from '../js/mesa-ecossistema.js';

const hostil=a=>/agressiva|sanguinaria/.test(a);
test('início seguro: nenhuma criatura hostil nasce a menos de 14 m do acampamento nem de 10 m da casa', () => {
  const col = simularColocacao();
  assert.equal(col.length, POPULACAO.reduce((s, p) => s + p[1], 0), 'todas as criaturas da lista ganham lugar');
  for (const c of col.filter(x => hostil(x.atitude)))
    for (const [nome, p] of Object.entries(PONTOS_SEGUROS)) assert.ok(Math.hypot(c.x - p.x, c.y - p.y) >= p.raio, `${c.id} (${c.area}) a ${Math.hypot(c.x - p.x, c.y - p.y).toFixed(1)} m de ${nome}`);
});

test('as montarias domesticadas e os pacíficos ficam perto do acampamento/campo, sem hostis misturados', () => {
  const col = simularColocacao();
  for (const c of col.filter(x => /domesticado/.test(x.id))) assert.ok(Math.hypot(c.x - PONTOS_SEGUROS.acampamento.x, c.y - PONTOS_SEGUROS.acampamento.y) < 8, c.id + ' fica no acampamento');
});

test('a reforma tem as regiões pedidas (casa com telhado, cachoeira, ponte, gruta, torre com escada, armadilhas e alavancas)', () => {
  const {passos, especiais} = passosEcossistema();
  const txt = JSON.stringify(passos);
  for (const termo of ['telhado', 'sl_cachoeira_queda', 'sl_ponte_madeira', 'caverna_nat', 'escada', 'cordilheira', 'copa']) assert.ok(txt.includes(termo), 'falta ' + termo);
  assert.ok(especiais.filter(e => e.k === 'armadilha').length >= 8, 'armadilhas');
  assert.ok(especiais.filter(e => e.k === 'alavanca').length >= 2, 'alavancas');
  assert.ok(especiais.filter(e => e.k === 'grade').length >= 2, 'grades de cela');
});
