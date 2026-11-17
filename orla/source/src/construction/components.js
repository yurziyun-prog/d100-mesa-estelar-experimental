import { state } from "../core/state.js";
// Shared definitions: data, collision and rendering consume the same dimensions.
export const COMPONENTS = Object.freeze({
  wall: {
    name: 'Parede',
    w: 2,
    d: .15,
    h: 2.8,
    material: 'plaster'
  },
  door: {
    name: 'Porta',
    w: 1.2,
    d: .15,
    h: 2.6,
    material: 'wood'
  },
  window: {
    name: 'Janela',
    w: 1.4,
    d: .15,
    h: 2.8,
    material: 'plaster'
  },
  stairs: {
    name: 'Escada',
    w: 1.1,
    d: 2.4,
    h: 1.5,
    material: 'wood'
  },
  floor: {
    name: 'Piso',
    w: 2,
    d: 2,
    h: .08,
    material: 'wood'
  },
  roof: {
    name: 'Telhado',
    w: 3,
    d: 2.6,
    h: 1.1,
    material: 'metal'
  }
});
export function createComponent(kind, x, z, id) {
  const spec = COMPONENTS[kind];
  if (!spec) throw Error("Componente desconhecido");
  return {
    ...spec,
    kind,
    x: x - spec.w / 2,
    z: z - spec.d / 2,
    rot: 0,
    baseY: kind === "roof" ? 2.8 : 0,
    id,
    open: false,
    tint: state?.constructionPreferences?.tint || "#b7a58a",
    material: state?.constructionPreferences?.material || spec.material,
    component: true
  };
}
export function localSize(o) {
  return (o.rot || 0) % 2 ? [o.d, o.w] : [o.w, o.d];
}
export function componentPoint(o, u, v, y = 0) {
  // A rotação livre usa a geometria real projetada, não apenas troca largura/profundidade.
  if (Number.isFinite(o.angle) && Math.abs(o.angle) > .0001 && ['table', 'bed', 'chest', 'shelf', 'lamp', 'chair', 'barrel'].includes(o.kind)) {
    const c = Math.cos(o.angle * Math.PI / 180),
      si = Math.sin(o.angle * Math.PI / 180);
    const [width, depth] = localSize(o);
    const dx = u - width / 2,
      dz = v - depth / 2;
    return [o.x + o.w / 2 + dx * c - dz * si, o.z + o.d / 2 + dx * si + dz * c, y + (o.baseY || 0)];
  }
  const [w, d] = localSize(o),
    r = ((o.rot || 0) % 4 + 4) % 4;
  const a = u / w,
    b = v / d;
  return r === 0 ? [o.x + a * o.w, o.z + b * o.d, y + (o.baseY || 0)] : r === 1 ? [o.x + (1 - b) * o.w, o.z + a * o.d, y + (o.baseY || 0)] : r === 2 ? [o.x + (1 - a) * o.w, o.z + (1 - b) * o.d, y + (o.baseY || 0)] : [o.x + b * o.w, o.z + (1 - a) * o.d, y + (o.baseY || 0)];
}
export function componentRect(o, x, z, w, d) {
  const a = componentPoint(o, x, z),
    b = componentPoint(o, x + w, z + d);
  return {
    x: Math.min(a[0], b[0]),
    z: Math.min(a[1], b[1]),
    w: Math.abs(a[0] - b[0]),
    d: Math.abs(a[1] - b[1])
  };
}
export function componentBarriers(o) {
  if (o.hidden || !o.component || o.kind === 'floor' || o.kind === 'roof' || o.kind === 'stairs') return [];
  const [w, d] = localSize(o);
  if (o.kind === 'door' && o.open) return [componentRect(o, 0, 0, .09, d), componentRect(o, w - .09, 0, .09, d), componentRect(o, .09, -(w - .18), .06, w - .18)];
  return [{
    x: o.x,
    z: o.z,
    w: o.w,
    d: o.d,
    h: o.h
  }];
}
export function componentSupport(o, x, z) {
  if (o.hidden || !o.component || x < o.x || x > o.x + o.w || z < o.z || z > o.z + o.d) return 0;
  if (o.kind === 'floor') return (o.baseY || 0) + o.h;
  if (o.kind !== 'stairs') return 0;
  const r = ((o.rot || 0) % 4 + 4) % 4;
  const t = r === 0 ? (z - o.z) / o.d : r === 1 ? 1 - (x - o.x) / o.w : r === 2 ? 1 - (z - o.z) / o.d : (x - o.x) / o.w;
  return (o.baseY || 0) + Math.ceil(Math.max(.001, t) * 10) / 10 * o.h;
}
export function updateComponent(o, patch) {
  for (const key of ["x", "z", "baseY"]) if (key in patch && (!Number.isFinite(patch[key]) || Math.abs(patch[key]) > 40)) throw Error("Posi\xE7\xE3o deve estar entre \u221240 e 40 m.");
  for (const key of ["w", "d", "h"]) if (key in patch && (!Number.isFinite(patch[key]) || patch[key] < 0.05 || patch[key] > 12)) throw Error("Dimens\xE3o deve estar entre 0,05 e 12 m.");
  const next = {
      ...o,
      ...patch
    },
    [width] = localSize(next);
  if (["door", "window"].includes(o.kind) && (width < 0.4 || next.h < 0.5)) throw Error("Portas e janelas precisam de largura \u2265 0,4 m e altura \u2265 0,5 m.");
  if (patch.tint !== void 0 && !/^#[0-9a-f]{6}$/i.test(patch.tint)) throw Error("Cor inv\xE1lida.");
  if (patch.material !== void 0 && !["wood", "plaster", "metal", "stone", "brick", "ceramic", "concrete"].includes(patch.material)) throw Error("Material inv\xE1lido.");
  for (const key of ["x", "z", "baseY", "w", "d", "h", "tint", "material"]) if (key in patch) o[key] = patch[key];
  return o;
}

// src/rendering/furniture.js
