/**
 * Gerador determinístico de EXTERIORES — floresta, penhasco, campo e mina.
 *
 * Pipeline:
 *  1. saídas de borda + spawn deslocado do centro
 *  2. trilhas serpenteantes do spawn até cada saída (derrubam terra na grade)
 *  3. escarpas (penhasco: cordilheiras; mina: paredes de pedreira) com
 *     passagens garantidas onde cruzam trilhas
 *  4. corpos d'água (floresta: riacho; campo: lagoa), campos agrícolas
 *  5. grade de terreno por ruído valor + regras do bioma
 *  6. adereços por rejeição amostrada (nunca sobre trilha/escarpa/spawn)
 */

import { RNG, hashSeed } from '../rng';
import { distToPath } from '../types';
import type { Vec } from '../types';
import {
  BIOMES, TERRAINS, WILD_PROP_DIMS,
} from './types';
import { listPoiNames } from './lore';
import type {
  Biome, TerrainGrid, TerrainKind, WildCliff, WildDoc, WildPoi, WildProp, WildTrail, WildWater, WildField,
} from './types';

export interface WildConfig {
  seed: number;
  width?: number;   // metros
  height?: number;  // metros
  styleId?: string;
  biome?: Biome;
  conservation?: WildDoc['conservation'];
  density?: number; // 0..1 — vegetação/adereços
  lighting?: number;
}

const CELL = 4; // metros por célula da grade

// ---------- ruído valor determinístico ----------

function makeNoise(rng: RNG, cell: number, W: number, H: number): (x: number, y: number) => number {
  const cols = Math.ceil(W / cell) + 2;
  const rows = Math.ceil(H / cell) + 2;
  const g = new Float64Array(cols * rows);
  for (let i = 0; i < g.length; i++) g[i] = rng.next();
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = Math.max(0, x / cell);
    const gy = Math.max(0, y / cell);
    const x0 = Math.min(Math.floor(gx), cols - 2);
    const y0 = Math.min(Math.floor(gy), rows - 2);
    const tx = smooth(gx - x0);
    const ty = smooth(gy - y0);
    const a = g[y0 * cols + x0], b = g[y0 * cols + x0 + 1];
    const c = g[(y0 + 1) * cols + x0], d = g[(y0 + 1) * cols + x0 + 1];
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  };
}

// ---------- caminho serpenteante ----------

function meander(rng: RNG, from: Vec, to: Vec, W: number, H: number): Vec[] {
  const pts: Vec[] = [{ ...from }];
  const total = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(4, Math.round(total / 8));
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = total || 1;
  const ux = dx / len, uy = dy / len;       // unitário para a saída
  const px = -uy, py = ux;                  // perpendicular
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sway = Math.sin(t * Math.PI) * rng.range(3, 8) * rng.pick([-1, 1, 1, -1]);
    const along = rng.jitter(2.5);
    pts.push({
      x: Math.min(W - 2.5, Math.max(2.5, from.x + dx * t + px * sway + ux * along)),
      y: Math.min(H - 2.5, Math.max(2.5, from.y + dy * t + py * sway + uy * along)),
    });
  }
  pts.push({ ...to });
  // suaviza: descarta pontos muito próximos
  return pts.filter((p, i) => i === 0 || i === pts.length - 1 ||
    Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 1.5);
}

// ---------- escarpas ----------

function makeCliffs(
  rng: RNG, biome: Biome, W: number, H: number,
  spawn: Vec, trails: WildTrail[],
): WildCliff[] {
  const cliffs: WildCliff[] = [];
  const blocked = (p: Vec, r: number) =>
    Math.hypot(p.x - spawn.x, p.y - spawn.y) < r ||
    trails.some((t) => distToPath(p, t.path) < 2.6);
  let id = 0;
  const line = (angle: number, offset: number, segs: number, jitterA: number): Vec[] => {
    // linha que atravessa o mapa na direção `angle` passando a `offset` do centro
    const cx = W / 2 + Math.cos(angle + Math.PI / 2) * offset;
    const cy = H / 2 + Math.sin(angle + Math.PI / 2) * offset;
    const ux = Math.cos(angle), uy = Math.sin(angle);
    const half = Math.hypot(W, H);
    const pts: Vec[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = -half + (2 * half * i) / segs;
      pts.push({
        x: Math.min(W - 1, Math.max(1, cx + ux * t + rng.jitter(jitterA))),
        y: Math.min(H - 1, Math.max(1, cy + uy * t + rng.jitter(jitterA))),
      });
    }
    return pts;
  };
  const trim = (path: Vec[]): Vec[] => {
    // remove trechos que esmagariam o spawn (pontos fora do mapa ficam — o
    // renderizador clipa ao limite, mantendo a linha suave)
    return path.filter((p) => !blocked(p, 6));
  };

  if (biome === 'penhasco') {
    const n = rng.int(2, 3);
    const baseA = rng.range(0, Math.PI);
    for (let i = 0; i < n; i++) {
      const p = trim(line(baseA + rng.jitter(0.5), (i - (n - 1) / 2) * rng.range(16, 26), 14, 5));
      if (p.length >= 4) cliffs.push({ id: `c${id++}`, path: p, height: rng.range(2.5, 4) });
    }
  } else if (biome === 'mina') {
    // paredes de pedreira em 2 lados próximos à borda (deixa frestas nas trilhas)
    const sides = rng.pick([['n', 'w'], ['n', 'e'], ['s', 'w'], ['s', 'e']] as const);
    for (const side of sides) {
      const horiz = side === 'n' || side === 's';
      const at = side === 'n' ? 3.5 : side === 's' ? H - 3.5 : side === 'w' ? 3.5 : W - 3.5;
      const pts: Vec[] = [];
      const segs = Math.round((horiz ? W : H) / 7);
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * (horiz ? W : H);
        const p: Vec = horiz
          ? { x: Math.min(W - 2, Math.max(2, t)), y: Math.min(H - 2, Math.max(2, at + rng.jitter(1.6))) }
          : { x: Math.min(W - 2, Math.max(2, at + rng.jitter(1.6))), y: Math.min(H - 2, Math.max(2, t)) };
        if (!blocked(p, 5.5)) pts.push(p);
      }
      if (pts.length >= 4) cliffs.push({ id: `c${id++}`, path: pts, height: rng.range(3, 5) });
    }
  }
  return cliffs;
}

// ---------- grade de terreno ----------

function classify(
  biome: Biome, n1: number, n2: number,
): TerrainKind {
  switch (biome) {
    case 'floresta':
      if (n1 > 0.72) return 'dirt';            // clareiras
      return 'grass';
    case 'penhasco':
      if (n1 > 0.66) return 'rock';            // sopés rochosos
      if (n2 > 0.8) return 'sand';             // cascalho
      return 'grass';
    case 'campo':
      if (n2 > 0.86) return 'dirt';            // veredas naturais
      return 'grass';
    case 'mina':
      if (n1 > 0.5) return 'rock';
      if (n2 > 0.75) return 'dirt';
      return 'grass';
  }
}

// ---------- água e campos ----------

function makeStream(rng: RNG, W: number, H: number): { path: Vec[]; width: number } {
  // riacho que atravessa de borda a borda com serpenteio suave
  const horizontal = rng.chance(0.5);
  const base = horizontal ? rng.range(H * 0.25, H * 0.75) : rng.range(W * 0.25, W * 0.75);
  const pts: Vec[] = [];
  const segs = 12;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const wob = Math.sin(t * Math.PI * rng.range(1.4, 2.4) + rng.range(0, 3)) * rng.range(4, 9);
    pts.push(horizontal
      ? { x: t * W, y: Math.min(H - 1.5, Math.max(1.5, base + wob)) }
      : { x: Math.min(W - 1.5, Math.max(1.5, base + wob)), y: t * H });
  }
  return { path: pts, width: rng.range(2.6, 4) };
}

// ---------- adereços ----------

interface PropSpec { type: string; chance: number; gap: number }

const BIOME_PROP_TABLE: Record<Biome, PropSpec[]> = {
  floresta: [
    { type: 'broadleaf', chance: 0.34, gap: 2.6 },
    { type: 'bush', chance: 0.12, gap: 1.6 },
    { type: 'rock', chance: 0.05, gap: 1.8 },
    { type: 'stump', chance: 0.03, gap: 1.4 },
    { type: 'log', chance: 0.025, gap: 1.8 },
    { type: 'flowers', chance: 0.05, gap: 1.2 },
    { type: 'pine', chance: 0.06, gap: 2.2 },
  ],
  penhasco: [
    { type: 'pine', chance: 0.16, gap: 2.4 },
    { type: 'rock', chance: 0.2, gap: 2.0 },
    { type: 'bush', chance: 0.06, gap: 1.5 },
    { type: 'shard', chance: 0.04, gap: 1.4 },
  ],
  campo: [
    { type: 'oak', chance: 0.05, gap: 3.0 },
    { type: 'bush', chance: 0.05, gap: 1.5 },
    { type: 'rock', chance: 0.025, gap: 1.8 },
    { type: 'flowers', chance: 0.06, gap: 1.2 },
    { type: 'haystack', chance: 0.035, gap: 2.2 },
    { type: 'broadleaf', chance: 0.03, gap: 2.6 },
  ],
  mina: [
    { type: 'crystal', chance: 0.035, gap: 1.8 },
    { type: 'rock', chance: 0.17, gap: 2.0 },
    { type: 'bush', chance: 0.04, gap: 1.6 },      // fungos nas paredes úmidas
    { type: 'cart', chance: 0.03, gap: 2.2 },
    { type: 'timber', chance: 0.04, gap: 1.8 },
    { type: 'lantern', chance: 0.025, gap: 1.6 },
    { type: 'shard', chance: 0.05, gap: 1.2 },
  ],
};

/** tipos garantidos (mínimos de cenário por bioma) */
const BIOME_FORCED: Record<Biome, string[]> = {
  floresta: ['broadleaf', 'broadleaf', 'broadleaf', 'log', 'flowers'],
  penhasco: ['pine', 'pine', 'pine', 'rock', 'rock', 'shard'],
  campo: ['oak', 'oak', 'haystack', 'haystack'],
  mina: ['crystal', 'crystal', 'cart', 'lantern', 'entrance', 'timber'],
};

// ---------- gerador principal ----------

export function generateWild(cfg: WildConfig): WildDoc {
  const W = cfg.width ?? 96;
  const H = cfg.height ?? 72;
  const density = cfg.density ?? 0.6;
  const biome = cfg.biome ?? 'floresta';
  const rng = new RNG(hashSeed(`wild-${biome}-${cfg.seed}`));
  const seedNum = typeof cfg.seed === 'number' ? cfg.seed : hashSeed(String(cfg.seed));

  const noiseA = makeNoise(new RNG(hashSeed(`wa-${cfg.seed}`)), 14, W, H);
  const noiseB = makeNoise(new RNG(hashSeed(`wb-${cfg.seed}`)), 5.5, W, H);

  // ---- 1. spawn e saídas ----
  const spawn: Vec = {
    x: W / 2 + rng.jitter(Math.min(8, W * 0.08)),
    y: H / 2 + rng.jitter(Math.min(6, H * 0.08)),
  };
  const nExits = biome === 'penhasco' ? 2 : rng.int(2, 3);
  const sideDefs = rng.shuffle([
    { side: 'n' as const, at: rng.range(W * 0.3, W * 0.7) },
    { side: 's' as const, at: rng.range(W * 0.3, W * 0.7) },
    { side: 'w' as const, at: rng.range(H * 0.3, H * 0.7) },
    { side: 'e' as const, at: rng.range(H * 0.3, H * 0.7) },
  ]).slice(0, nExits);
  const exits: Vec[] = sideDefs.map((s) =>
    s.side === 'n' ? { x: s.at, y: 1.2 }
      : s.side === 's' ? { x: s.at, y: H - 1.2 }
        : s.side === 'w' ? { x: 1.2, y: s.at }
          : { x: W - 1.2, y: s.at });

  // ---- 2. trilhas ----
  const trails: WildTrail[] = exits.map((e, i) => ({
    id: `t${i}`,
    width: rng.range(1.9, 2.6),
    path: meander(rng, spawn, e, W, H),
    toExit: true,
  }));
  // ramal extra na floresta/campo para dar organicidade
  if ((biome === 'floresta' || biome === 'campo') && rng.chance(0.7)) {
    const anchor = rng.pick(trails[0].path.slice(1, -2));
    const target = rng.chance(0.5)
      ? { x: rng.range(6, W - 6), y: 1.2 }
      : { x: 1.2, y: rng.range(6, H - 6) };
    const path = meander(rng, anchor, target, W, H);
    if (path.length >= 4) trails.push({ id: `t${trails.length}`, width: rng.range(1.4, 1.9), path });
  }

  // ---- 3. escarpas ----
  const cliffs = makeCliffs(rng, biome, W, H, spawn, trails);

  // ---- 4. água e campos ----
  const waters: WildWater[] = [];
  const waterPaths: { path: Vec[]; width: number }[] = [];
  if (biome === 'floresta') {
    const s = makeStream(rng, W, H);
    if (distToPath(spawn, s.path) > 6) waterPaths.push(s);
  }
  if (biome === 'campo') {
    const cx = rng.range(W * 0.2, W * 0.8), cy = rng.range(H * 0.2, H * 0.8);
    const rx = rng.range(5, 8), ry = rng.range(3.5, 6);
    if (Math.hypot(cx - spawn.x, cy - spawn.y) > 14 &&
      trails.every((t) => distToPath({ x: cx, y: cy }, t.path) > 8)) {
      const poly: Vec[] = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        poly.push({ x: cx + Math.cos(a) * rx * rng.range(0.75, 1.15), y: cy + Math.sin(a) * ry * rng.range(0.75, 1.15) });
      }
      waters.push({ id: 'w0', polygon: poly });
    }
  }
  // registro dos polígonos de riacho (para render + export)
  for (let i = 0; i < waterPaths.length; i++) {
    const wp = waterPaths[i];
    // contorno aproximado por cápsula
    const left: Vec[] = [], right: Vec[] = [];
    const pts = wp.path;
    for (let j = 0; j < pts.length; j++) {
      const prev = pts[Math.max(0, j - 1)], next = pts[Math.min(pts.length - 1, j + 1)];
      let dx = next.x - prev.x, dy = next.y - prev.y;
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      left.push({ x: pts[j].x - dy * wp.width / 2, y: pts[j].y + dx * wp.width / 2 });
      right.push({ x: pts[j].x + dy * wp.width / 2, y: pts[j].y - dx * wp.width / 2 });
    }
    waters.push({ id: `w${waters.length}`, polygon: [...left, ...right.reverse()] });
  }

  const fields: WildField[] = [];
  if (biome === 'campo') {
    const n = rng.int(2, 3);
    for (let i = 0; i < n; i++) {
      const fw = rng.range(10, 16), fh = rng.range(7, 11);
      const fx = rng.range(5, W - fw - 5), fy = rng.range(5, H - fh - 5);
      const rect = { x: fx, y: fy, w: fw, h: fh };
      const c = { x: fx + fw / 2, y: fy + fh / 2 };
      if (Math.hypot(c.x - spawn.x, c.y - spawn.y) > 12 &&
        trails.every((t) => distToPath(c, t.path) > Math.min(fw, fh) / 2 + 2) &&
        fields.every((f) => !(fx < f.rect.x + f.rect.w && fx + fw > f.rect.x && fy < f.rect.y + f.rect.h && fy + fh > f.rect.y))) {
        fields.push({ id: `f${i}`, rect });
      }
    }
  }

  // ---- 5. grade de terreno ----
  const cols = Math.ceil(W / CELL);
  const rows = Math.ceil(H / CELL);
  const data: TerrainKind[] = new Array<TerrainKind>(cols * rows);
  const inPolygon = (p: Vec, poly: Vec[]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if (((yi > p.y) !== (yj > p.y)) && (p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  };
  const nearCliffHigh = (p: Vec): boolean => {
    for (const c of cliffs) {
      if (distToPath(p, c.path) < 7 && noiseA(p.x, p.y) > 0.45) return true;
    }
    return false;
  };
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const p = { x: (gx + 0.5) * CELL, y: (gy + 0.5) * CELL };
      let t = classify(biome, noiseA(p.x, p.y), noiseB(p.x, p.y));
      if (waters.some((w) => inPolygon(p, w.polygon))) t = 'water';
      else if (waterPaths.some((wp) => distToPath(p, wp.path) < wp.width / 2 + 1.2)) t = 'sand';
      else if (fields.some((f) => p.x >= f.rect.x && p.x <= f.rect.x + f.rect.w && p.y >= f.rect.y && p.y <= f.rect.y + f.rect.h)) t = 'field';
      else if (t !== 'water' && t !== 'sand' && t !== 'field') {
        if (trails.some((tr) => distToPath(p, tr.path) < tr.width / 2 + 0.9)) t = 'dirt';
        else if (cliffs.length > 0 && cliffs.some((c) => distToPath(p, c.path) < 1.4)) t = 'rock';
        else if (biome === 'penhasco' && t === 'grass' && nearCliffHigh(p)) t = 'rock';
      }
      data[gy * cols + gx] = t;
    }
  }

  // ---- 6. adereços ----
  const props: WildProp[] = [];
  const occupied = new Set<string>();
  const cellKey = (x: number, y: number, gap: number) =>
    `${Math.floor(x / (gap * 0.9))}:${Math.floor(y / (gap * 0.9))}`;
  const free = (p: Vec, gap: number) => {
    if (p.x < 1 || p.x > W - 1 || p.y < 1 || p.y > H - 1) return false;
    const k = cellKey(p.x, p.y, gap);
    if (occupied.has(k)) return false;
    if (Math.hypot(p.x - spawn.x, p.y - spawn.y) < 4.5) return false;
    if (exits.some((e) => Math.hypot(p.x - e.x, p.y - e.y) < 3)) return false;
    if (trails.some((t) => distToPath(p, t.path) < t.width / 2 + gap * 0.6)) return false;
    if (cliffs.some((c) => distToPath(p, c.path) < 1.6 + gap * 0.4)) return false;
    const gx = Math.floor(p.x / CELL), gy = Math.floor(p.y / CELL);
    const t = data[Math.min(rows - 1, Math.max(0, gy)) * cols + Math.min(cols - 1, Math.max(0, gx))];
    if (t === 'water' || t === 'field') return false;
    if (biome === 'mina' && t === 'grass' && rng.chance(0.5)) return false;
    return true;
  };
  const place = (type: string, p: Vec): boolean => {
    const dims = WILD_PROP_DIMS[type] ?? { w: 1.2, h: 1.2 };
    const spec = BIOME_PROP_TABLE[biome].find((s) => s.type === type);
    const gap = spec?.gap ?? 1.6;
    if (!free(p, gap)) return false;
    occupied.add(cellKey(p.x, p.y, gap));
    const cx = Math.min(W - 1, Math.max(1, Math.round(p.x * 4) / 4));
    const cy = Math.min(H - 1, Math.max(1, Math.round(p.y * 4) / 4));
    props.push({
      id: `p${props.length}`, type,
      pos: { x: cx, y: cy },
      rot: rng.int(0, 3) as 0 | 1 | 2 | 3,
      w: dims.w, h: dims.h, variant: rng.int(0, 3),
    });
    return true;
  };

  // forçados (garantia de cenário)
  for (const type of BIOME_FORCED[biome]) {
    for (let tries = 0; tries < 240; tries++) {
      const p = { x: rng.range(3, W - 3), y: rng.range(3, H - 3) };
      if (place(type, p)) break;
    }
  }
  // entrada da mina encostada numa escarpa, se houver
  if (biome === 'mina' && cliffs.length > 0) {
    const ent = props.find((p) => p.type === 'entrance');
    if (ent) {
      const c = cliffs[0];
      const mid = c.path[Math.floor(c.path.length / 2)];
      ent.pos = { x: Math.round(mid.x * 4) / 4, y: Math.round(mid.y * 4) / 4 };
    }
  }
  // cercas ao redor dos campos (2 lados)
  if (biome === 'campo') {
    for (const f of fields) {
      const sides = rng.shuffle(['n', 's', 'e', 'w'] as const).slice(0, 2);
      for (const side of sides) {
        const horiz = side === 'n' || side === 's';
        const len = horiz ? f.rect.w : f.rect.h;
        const n = Math.floor(len / 2.6);
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const p: Vec = horiz
            ? { x: f.rect.x + t * f.rect.w, y: side === 'n' ? f.rect.y - 0.8 : f.rect.y + f.rect.h + 0.8 }
            : { x: side === 'w' ? f.rect.x - 0.8 : f.rect.x + f.rect.w + 0.8, y: f.rect.y + t * f.rect.h };
          place('fence', p);
        }
      }
    }
  }
  // espalhados
  const table = BIOME_PROP_TABLE[biome];
  const densMul = 0.35 + density * 0.85;
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const roll = rng.next();
      let acc = 0;
      for (const spec of table) {
        acc += spec.chance * densMul;
        if (roll < acc) {
          const p = { x: (gx + 0.5) * CELL + rng.jitter(1.6), y: (gy + 0.5) * CELL + rng.jitter(1.6) };
          place(spec.type, p);
          break;
        }
      }
    }
  }

  // ---- 7. pontos de interesse (lore) ----
  // 1–2 locais nomeados encostados em trilhas: pega um ponto interno de uma
  // trilha e desloca perpendicularmente, fora da pista, em terreno firme.
  const pois: WildPoi[] = [];
  {
    const names = rng.shuffle(listPoiNames(biome));
    const nPoi = rng.int(1, 2);
    const terrainAt = (p: Vec): TerrainKind =>
      data[Math.min(rows - 1, Math.max(0, Math.floor(p.y / CELL))) * cols +
        Math.min(cols - 1, Math.max(0, Math.floor(p.x / CELL)))];
    for (let k = 0; k < nPoi && pois.length < names.length; k++) {
      for (let tries = 0; tries < 120; tries++) {
        const trail = rng.pick(trails);
        const i = rng.int(1, Math.max(1, trail.path.length - 2));
        const a = trail.path[i - 1], b = trail.path[Math.min(trail.path.length - 1, i + 1)];
        let dx = b.x - a.x, dy = b.y - a.y;
        const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        const side = rng.pick([-1, 1]);
        const off = trail.width / 2 + rng.range(2.2, 4.5);
        const p: Vec = {
          x: Math.min(W - 3, Math.max(3, trail.path[i].x - dy * off * side)),
          y: Math.min(H - 3, Math.max(3, trail.path[i].y + dx * off * side)),
        };
        if (Math.hypot(p.x - spawn.x, p.y - spawn.y) < 8) continue;
        if (trails.some((t) => distToPath(p, t.path) < t.width / 2 + 1.4)) continue;
        if (cliffs.some((c) => distToPath(p, c.path) < 2.2)) continue;
        if (waters.some((w) => inPolygon(p, w.polygon))) continue;
        if (fields.some((f) => p.x >= f.rect.x && p.x <= f.rect.x + f.rect.w && p.y >= f.rect.y && p.y <= f.rect.y + f.rect.h)) continue;
        if (pois.some((q) => Math.hypot(q.pos.x - p.x, q.pos.y - p.y) < 14)) continue;
        if (terrainAt(p) === 'water' || terrainAt(p) === 'rock') continue;
        pois.push({ id: `poi${pois.length}`, pos: { x: Math.round(p.x * 4) / 4, y: Math.round(p.y * 4) / 4 }, label: names[pois.length] });
        break;
      }
    }
  }

  const grid: TerrainGrid = { cell: CELL, cols, rows, data };
  return {
    version: 1,
    kind: 'wild',
    seed: seedNum,
    styleId: cfg.styleId ?? 'hibrido',
    biome,
    bounds: { w: W, h: H },
    conservation: cfg.conservation ?? 'usado',
    lighting: cfg.lighting ?? 0.6,
    grid, trails, cliffs, waters, fields, props, pois, spawn, exits,
  };
}

export { BIOMES, TERRAINS };
