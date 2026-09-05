/* Mesa Estelar v46.82.0
   Primeira separação arquitetural: objetos interativos da Mesa.
   Este arquivo NÃO toca na Oficina 2. */
(function () {
  'use strict';

  const clone = (v) => JSON.parse(JSON.stringify(v));
  const num = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

  function banco() {
    try { return Array.isArray(objetosMapaDB) ? objetosMapaDB : []; }
    catch (_) { return Array.isArray(window.objetosMapaDB) ? window.objetosMapaDB : []; }
  }

  function estado() {
    try { return labEstado_; }
    catch (_) { return window.labEstado_ || null; }
  }

  function modeloPorId(modeloId) {
    return banco().find(m => String(m.id) === String(modeloId)) || null;
  }

  function criar(modeloId, dados = {}) {
    const m = modeloPorId(modeloId);
    if (!m) throw new Error('Modelo não encontrado no Banco de Objetos: ' + modeloId);
    const pvMax = Math.max(0, num(dados.pvMax ?? m.pvMax ?? m.pv, 0));
    const snap = clone(m);
    return {
      ...snap,
      dadosBanco: snap,
      id: dados.id || `obj:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
      modeloId: String(m.id),
      objetoBancoId: String(m.id),
      nome: m.nome || m.name || m.id || 'Objeto',
      name: m.name || m.nome || m.id || 'Objeto',
      x: num(dados.x, 14),
      y: num(dados.y, 7),
      larguraM: Math.max(.05, num(dados.larguraM ?? m.larguraM, 1)),
      alturaM: Math.max(.05, num(dados.alturaM ?? m.alturaM, 1)),
      angulo: num(dados.angulo, 0),
      pvMax,
      pvAtual: Math.max(0, num(dados.pvAtual, pvMax)),
      dureza: Math.max(0, num(dados.dureza ?? m.dureza, 0)),
      pesoKg: Math.max(0, num(dados.pesoKg ?? m.pesoKg ?? m.peso, 0)),
      destruido: Boolean(dados.destruido),
      __mapEntityV1: true
    };
  }

  function getAll() {
    const e = estado();
    return e && Array.isArray(e.objetosLab) ? e.objetosLab : [];
  }

  function add(modeloId, dados = {}) {
    const e = estado();
    if (!e) throw new Error('Estado da Mesa ainda não está disponível.');
    if (!Array.isArray(e.objetosLab)) e.objetosLab = [];
    const obj = criar(modeloId, dados);
    e.objetosLab.push(obj);
    return obj;
  }

  function remove(id) {
    const e = estado();
    if (!e || !Array.isArray(e.objetosLab)) return false;
    const i = e.objetosLab.findIndex(o => String(o.id) === String(id));
    if (i < 0) return false;
    e.objetosLab.splice(i, 1);
    return true;
  }

  function get(id) { return getAll().find(o => String(o.id) === String(id)) || null; }

  // Persistência será ligada ao documento do mapa na próxima etapa.
  // Por enquanto estas funções produzem/consomem o schema leve sem tocar na Oficina 2.
  function exportRefs() {
    return getAll().filter(o => o.modeloId || o.objetoBancoId).map(o => ({
      id: o.id,
      modeloId: String(o.modeloId || o.objetoBancoId),
      x: num(o.x), y: num(o.y), larguraM: num(o.larguraM,1), alturaM: num(o.alturaM,1),
      angulo: num(o.angulo), pvAtual: num(o.pvAtual), destruido: Boolean(o.destruido)
    }));
  }

  function importRefs(refs) {
    const e = estado();
    if (!e) throw new Error('Estado da Mesa ainda não está disponível.');
    e.objetosLab = (Array.isArray(refs) ? refs : []).map(r => criar(r.modeloId, r));
    return e.objetosLab;
  }

  window.MapEntities = Object.freeze({ add, remove, get, getAll, criar, modeloPorId, exportRefs, importRefs });
  console.info('[Mesa Estelar 46.82.0] map-entities.js carregado. Oficina 2 permanece isolada.');
})();
