/**
 * Gerador de CIDADES — malha viária, quarteirões, praças, parques e prédios
 * alinhados à rua. Determinístico por seed. Geometria em metros.
 *
 * Estrutura: 1 via principal horizontal + 1 vertical cruzando no centro;
 * vias secundárias conforme densidade. Quarteirões = células entre vias
 * (recuados da pista por meia-largura + calçada). O quarteirão que contém
 * o centro vira praça principal; os demais misturam prédios e parques.
 */

import { RNG, hashSeed } from '../rng';
import type { Rect, Vec } from '../types';
import { pickEstablishment } from './lore';
import type { CityBuilding, CityDoc, CityPark, CityPlaza, CityProp, CityStreet } from './types';

export interface CityConfig {
  seed: number;
  width?: number;   // metros
  height?: number;  // metros
  styleId?: string;
  conservation?: CityDoc['conservation'];
  density?: number; // 0..1 — mais vias secundárias e prédios
  lighting?: number;
}

const SIDEWALK = 1.5;   // largura da calçada ao redor dos quarteirões
const MAIN_W = 7;
const SEC_W = 4.6;

/** dimensões padrão dos adereços urbanos (metros) */
export const CITY_PROP_DIMS: Record<string, { w: number; h: number }> = {
  tree: { w: 1.7, h: 1.7 },
  lamp: { w: 0.8, h: 0.8 },
  fountain: { w: 3.4, h: 3.4 },
  stall: { w: 2.3, h: 1.7 },
  statue: { w: 1.5, h: 1.5 },
  bench: { w: 1.7, h: 0.65 },
  vehicle: { w: 4.3, h: 2.0 },
  hedge: { w: 1.7, h: 0.9 },
};

export function generateCity(cfg: CityConfig): CityDoc {
  const W = cfg.width ?? 96;
  const H = cfg.height ?? 72;
  const density = cfg.density ?? 0.6;
  const styleId = cfg.styleId ?? 'hibrido';
  const rng = new RNG(hashSeed(`city-${cfg.seed}`));
  const seedNum = typeof cfg.seed === 'number' ? cfg.seed : hashSeed(String(cfg.seed));

  // ---------- malha viária ----------
  const xs: { at: number; kind: 'main' | 'secondary' }[] = [{ at: W / 2, kind: 'main' }];
  const ys: { at: number; kind: 'main' | 'secondary' }[] = [{ at: H / 2, kind: 'main' }];
  if (density > 0.25 && rng.chance(0.9)) xs.push({ at: W * rng.range(0.22, 0.32), kind: 'secondary' });
  if (density > 0.35 && rng.chance(0.9)) xs.push({ at: W * rng.range(0.68, 0.78), kind: 'secondary' });
  if (density > 0.45 && rng.chance(0.8)) ys.push({ at: H * rng.range(0.22, 0.34), kind: 'secondary' });
  if (density > 0.55 && rng.chance(0.8)) ys.push({ at: H * rng.range(0.66, 0.78), kind: 'secondary' });
  if (density > 0.75) {
    if (rng.chance(0.6)) xs.push({ at: W * rng.range(0.42, 0.58), kind: 'secondary' });
    if (rng.chance(0.6)) ys.push({ at: H * rng.range(0.42, 0.58), kind: 'secondary' });
  }
  xs.sort((a, b) => a.at - b.at);
  ys.sort((a, b) => a.at - b.at);

  const streets: CityStreet[] = [];
  xs.forEach((v, i) => {
    streets.push({
      id: `sx${i}`, kind: v.kind, width: v.kind === 'main' ? MAIN_W : SEC_W,
      path: [{ x: v.at, y: 0 }, { x: v.at, y: H }],
      gate: v.kind === 'main' ? 'both' : undefined,
    });
  });
  ys.forEach((v, i) => {
    streets.push({
      id: `sy${i}`, kind: v.kind, width: v.kind === 'main' ? MAIN_W : SEC_W,
      path: [{ x: 0, y: v.at }, { x: W, y: v.at }],
      gate: v.kind === 'main' ? 'both' : undefined,
    });
  });
  const roadHalf = (atX: number): number => {
    const r = xs.find((v) => Math.abs(v.at - atX) < 0.01);
    return (r?.kind === 'main' ? MAIN_W : SEC_W) / 2;
  };
  const roadHalfY = (atY: number): number => {
    const r = ys.find((v) => Math.abs(v.at - atY) < 0.01);
    return (r?.kind === 'main' ? MAIN_W : SEC_W) / 2;
  };

  // ---------- quarteirões (células entre vias, recuadas) ----------
  const xEdges = [0, ...xs.map((v) => v.at), W];
  const yEdges = [0, ...ys.map((v) => v.at), H];
  const blocks: Rect[] = [];
  for (let i = 0; i < xEdges.length - 1; i++) {
    for (let j = 0; j < yEdges.length - 1; j++) {
      const x0 = xEdges[i], x1 = xEdges[i + 1];
      const y0 = yEdges[j], y1 = yEdges[j + 1];
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const insetL = (i === 0 ? 0 : roadHalf(x0)) + (i === 0 ? 0 : SIDEWALK);
      const insetR = (i === xEdges.length - 2 ? 0 : roadHalf(x1)) + (i === xEdges.length - 2 ? 0 : SIDEWALK);
      const insetT = (j === 0 ? 0 : roadHalfY(y0)) + (j === 0 ? 0 : SIDEWALK);
      const insetB = (j === yEdges.length - 2 ? 0 : roadHalfY(y1)) + (j === yEdges.length - 2 ? 0 : SIDEWALK);
      const r: Rect = {
        x: x0 + insetL + 0.4, y: y0 + insetT + 0.4,
        w: x1 - x0 - insetL - insetR - 0.8,
        h: y1 - y0 - insetT - insetB - 0.8,
      };
      if (r.w < 6 || r.h < 6) continue;
      void cx; void cy;
      blocks.push(r);
    }
  }

  // ---------- classificação dos quarteirões ----------
  const center: Vec = { x: W / 2, y: H / 2 };
  const distToCenter = (r: Rect) => Math.hypot(r.x + r.w / 2 - center.x, r.y + r.h / 2 - center.y);
  const sortedByCenter = [...blocks].sort((a, b) => distToCenter(a) - distToCenter(b));

  const plazas: CityPlaza[] = [];
  const parks: CityPark[] = [];
  const buildings: CityBuilding[] = [];
  const props: CityProp[] = [];
  let propN = 0;
  const addProp = (type: string, x: number, y: number, rot: 0 | 1 | 2 | 3 = 0): void => {
    const dims = CITY_PROP_DIMS[type] ?? { w: 1, h: 1 };
    props.push({ id: `cp${propN++}`, type, pos: { x, y }, rot, w: dims.w, h: dims.h, variant: Math.floor(rng.range(0, 1e6)) });
  };

  const buildingRects: Rect[] = [];
  const usedNames = new Set<string>();

  // distância de um ponto à via principal mais próxima (para "facing")
  const mainDist = (px: number, py: number): Record<'n' | 's' | 'e' | 'w', number> => {
    const d = { n: Infinity, s: Infinity, e: Infinity, w: Infinity };
    for (const v of xs) {
      if (v.kind !== 'main') continue;
      const dd = Math.abs(px - v.at);
      if (px < v.at) d.e = Math.min(d.e, dd); else d.w = Math.min(d.w, dd);
    }
    for (const v of ys) {
      if (v.kind !== 'main') continue;
      const dd = Math.abs(py - v.at);
      if (py < v.at) d.s = Math.min(d.s, dd); else d.n = Math.min(d.n, dd);
    }
    return d;
  };

  const fillBlockWithBuildings = (r: Rect): void => {
    // subdivide em lotes ~11m — quarteirões densos, sem mar vazio de calçada
    const cols = Math.max(1, Math.min(3, Math.round(r.w / 11)));
    const rows = Math.max(1, Math.min(3, Math.round(r.h / 11)));
    const lotW = r.w / cols, lotH = r.h / rows;
    for (let ci = 0; ci < cols; ci++) {
      for (let ri = 0; ri < rows; ri++) {
        if (rng.chance(0.07)) continue; // pátio / vazio ocasional
        const lot: Rect = { x: r.x + ci * lotW, y: r.y + ri * lotH, w: lotW, h: lotH };
        const m = rng.range(0.35, 0.9); // recuo do lote
        const br: Rect = {
          x: lot.x + m, y: lot.y + m,
          w: Math.max(4.5, lot.w - m * 2), h: Math.max(4.5, lot.h - m * 2),
        };
        // prédios não encostam uns nos outros
        const overlaps = buildingRects.some((o) =>
          br.x < o.x + o.w + 0.4 && br.x + br.w + 0.4 > o.x &&
          br.y < o.y + o.h + 0.4 && br.y + br.h + 0.4 > o.y);
        if (overlaps) continue;
        const d = mainDist(br.x + br.w / 2, br.y + br.h / 2);
        const facing = (Object.entries(d) as [CityBuilding['facing'], number][])
          .sort((a, b) => a[1] - b[1])[0][0];
        const storyRoll = rng.range(0, 1);
        const stories = storyRoll < 0.34 ? 1 : storyRoll < 0.68 ? 2 : storyRoll < 0.88 ? 3 : 4;
        const id = `b${buildings.length}`;
        const est = pickEstablishment(styleId, rng, usedNames);
        buildings.push({
          id, rect: br, facing, stories,
          variant: Math.floor(rng.range(0, 1e6)),
          doorWidth: 1.3,
          usage: est.usage, name: est.name,
        });
        buildingRects.push(br);
      }
    }
  };

  const fillPark = (r: Rect): void => {
    parks.push({ id: `pk${parks.length}`, rect: r });
    const count = Math.round((r.w * r.h) / 55) + rng.int(3, 6);
    for (let i = 0; i < count; i++) {
      const tx = rng.range(r.x + 1.4, r.x + r.w - 1.4);
      const ty = rng.range(r.y + 1.4, r.y + r.h - 1.4);
      // não cobre árvore sobre banco/fonte — espaçamento simples
      if (props.some((p) => p.type === 'tree' && Math.hypot(p.pos.x - tx, p.pos.y - ty) < 2.4)) continue;
      addProp('tree', tx, ty);
    }
    if (rng.chance(0.5)) {
      addProp('bench', r.x + r.w / 2 + rng.jitter(r.w * 0.2), r.y + r.h / 2 + rng.jitter(r.h * 0.2), rng.pick([0, 1, 2, 3] as const));
    }
  };

  const fillPlaza = (r: Rect, label: string): void => {
    plazas.push({ id: `pl${plazas.length}`, rect: r, label });
    addProp('fountain', r.x + r.w / 2, r.y + r.h / 2);
    if (rng.chance(0.55)) addProp('statue', r.x + r.w * rng.range(0.2, 0.8), r.y + r.h * rng.range(0.2, 0.8));
    const stalls = rng.int(2, 4);
    for (let i = 0; i < stalls; i++) {
      // barracas ao redor da fonte, longe do centro
      const a = (i / stalls) * Math.PI * 2 + rng.jitter(0.5);
      const rad = Math.min(r.w, r.h) * rng.range(0.3, 0.4);
      const sx = r.x + r.w / 2 + Math.cos(a) * rad;
      const sy = r.y + r.h / 2 + Math.sin(a) * rad;
      if (sx < r.x + 1.6 || sx > r.x + r.w - 1.6 || sy < r.y + 1.6 || sy > r.y + r.h - 1.6) continue;
      addProp('stall', sx, sy, ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4 as 0 | 1 | 2 | 3);
    }
    if (rng.chance(0.6)) {
      addProp('bench', r.x + r.w / 2 + rng.jitter(r.w * 0.25), r.y + r.h / 2 + rng.jitter(r.h * 0.25), rng.pick([0, 1, 2, 3] as const));
    }
  };

  sortedByCenter.forEach((r, idx) => {
    if (idx === 0) {
      fillPlaza(r, 'PRAÇA');
      return;
    }
    const roll = rng.range(0, 1);
    if (roll < 0.16) fillPark(r);
    else fillBlockWithBuildings(r);
  });

  // ---------- árvores e postes ao longo das vias ----------
  const intersections = (vertical: boolean): number[] =>
    vertical ? ys.map((v) => v.at) : xs.map((v) => v.at);

  streets.forEach((st) => {
    const vertical = st.path[0].x === st.path[1].x;
    const len = vertical ? H : W;
    const at = vertical ? st.path[0].x : st.path[0].y;
    const crosses = intersections(vertical);
    // árvores (apenas em vias principais, nos dois lados)
    if (st.kind === 'main' && rng.chance(0.85)) {
      for (let u = 4; u < len - 4; u += rng.range(8, 12)) {
        if (crosses.some((cy) => Math.abs(cy - u) < st.width / 2 + 2.4)) continue;
        const side = rng.chance(0.5) ? 1 : -1;
        const off = st.width / 2 + 1.3;
        const tx = vertical ? at + side * off : u;
        const ty = vertical ? u : at + side * off;
        addProp('tree', tx, ty);
      }
    }
    // postes de luz (ambos os lados, espaçadas)
    const lampEvery = st.kind === 'main' ? 11 : 15;
    for (let u = 5; u < len - 3; u += lampEvery) {
      if (crosses.some((cy) => Math.abs(cy - u) < st.width / 2 + 1.8)) continue;
      const side = Math.floor(u / lampEvery) % 2 === 0 ? 1 : -1;
      const off = st.width / 2 + 0.8;
      const lx = vertical ? at + side * off : u;
      const ly = vertical ? u : at + side * off;
      addProp('lamp', lx, ly);
    }
    // veículos ocasionais estacionados
    if (rng.chance(0.7)) {
      const u = rng.range(8, len - 8);
      if (!crosses.some((cy) => Math.abs(cy - u) < st.width / 2 + 4)) {
        const off = st.width / 2 - 1.1;
        const side = rng.chance(0.5) ? 1 : -1;
        const vx = vertical ? at + side * off : u;
        const vy = vertical ? u : at + side * off;
        addProp('vehicle', vx, vy, vertical ? 1 : 0);
      }
    }
  });

  // ---------- spawn e saídas ----------
  const mainPlaza = plazas[0];
  const spawn: Vec = mainPlaza
    ? { x: mainPlaza.rect.x + mainPlaza.rect.w / 2, y: mainPlaza.rect.y + mainPlaza.rect.h / 2 + 2.6 }
    : { x: W / 2, y: H / 2 };
  const exits: Vec[] = [];
  for (const st of streets) {
    if (st.kind !== 'main') continue;
    const vertical = st.path[0].x === st.path[1].x;
    for (const end of [st.path[0], st.path[1]]) {
      const onBorder = vertical
        ? (end.y <= 0.01 || end.y >= H - 0.01)
        : (end.x <= 0.01 || end.x >= W - 0.01);
      if (onBorder) exits.push({ x: end.x, y: end.y });
    }
  }

  return {
    version: 1,
    kind: 'city',
    seed: seedNum,
    styleId,
    bounds: { w: W, h: H },
    conservation: cfg.conservation ?? 'usado',
    lighting: cfg.lighting ?? 0.6,
    streets, blocks, plazas, parks, buildings, props,
    spawn, exits,
  };
}
