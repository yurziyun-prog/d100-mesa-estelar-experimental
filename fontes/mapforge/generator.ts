/**
 * Gerador estrutural da dungeon retrofuturista.
 *
 * Arquitetura própria, em 5 fases:
 *  1. DISPERSÃO  — salas com tamanhos variados posicionadas com sobreposição proposital
 *  2. RELAXAMENTO — iteração de resolução de colisões (empurra os retângulos uns dos
 *                  outros até não haver sobreposição), produzindo plantas orgânicas
 *  3. CONEXÃO    — árvore geradora mínima (MST) sobre os centros + arestas extras para
 *                  laços; cada aresta vira um corredor-cápsula com cantos arredondados
 *  4. PORTAS     — aberturas calculadas exatamente sobre os lados das salas, alinhadas
 *  5. MOBILIÁRIO — props com regras de clearance (parede, porta, circulação)
 */

import { RNG, hashSeed } from './rng';
import { getStyle } from './styles';
import type { PropSpec } from './styles';
import { pickDetail } from './lore';
import {
  doorPos, rectsOverlap, sideLength, sideOrigin, sideOutward, sideDir,
  distToPath, pointInRect,
} from './types';
import type {
  Door, DoorType, MapDocument, Prop, Rect, Room, RoomKind, Side, Vec,
} from './types';

export interface GenConfig {
  seed: number | string;
  width: number; // metros
  height: number; // metros
  complexity: number; // 0..1
  density: number; // 0..1
  conservation: MapDocument['meta']['conservation'];
  lighting: number;
  prompt?: string;
  /** estilo visual/temático (ver src/engine/styles). Padrão: retrofuturista */
  styleId?: string;
}

const WALL_T = 0.45;
const CORRIDOR_W = 2.4;
const ROOM_MARGIN = 2.1; // folga mínima entre salas (cabe um corredor com paredes)

// ---------- helpers geométricos ----------

function inflateRect(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}

function rectCenter(r: Rect): Vec {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** empurra a sobreposição de dois retângulos ao longo do eixo de menor penetração */
function pushApart(a: Rect, b: Rect, margin: number): void {
  const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
  const bx = b.x + b.w / 2, by = b.y + b.h / 2;
  const overlapX = (a.w + b.w) / 2 + margin - Math.abs(ax - bx);
  const overlapY = (a.h + b.h) / 2 + margin - Math.abs(ay - by);
  if (overlapX <= 0 || overlapY <= 0) return;
  if (overlapX < overlapY) {
    const dir = ax < bx ? -1 : 1;
    a.x += (dir * overlapX) / 2;
    b.x -= (dir * overlapX) / 2;
  } else {
    const dir = ay < by ? -1 : 1;
    a.y += (dir * overlapY) / 2;
    b.y -= (dir * overlapY) / 2;
  }
}

/** ponto na borda do retângulo mais próximo de q */
function nearestEdgePoint(r: Rect, q: Vec): { p: Vec; side: Side; offset: number } {
  const candidates: { p: Vec; side: Side; offset: number; d: number }[] = [];
  const sides: Side[] = ['n', 's', 'e', 'w'];
  for (const s of sides) {
    const o = sideOrigin(r, s);
    const d = sideDir(s);
    const len = sideLength(r, s);
    let t = s === 'n' || s === 's' ? q.x - o.x : q.y - o.y;
    t = Math.max(0.6, Math.min(len - 0.6, t)); // mantém 0.6m dos cantos
    const p = { x: o.x + d.x * t, y: o.y + d.y * t };
    candidates.push({ p, side: s, offset: t, d: Math.hypot(p.x - q.x, p.y - q.y) });
  }
  candidates.sort((a, b) => a.d - b.d);
  const best = candidates[0];
  return { p: best.p, side: best.side, offset: best.offset };
}

/** distância de um ponto a um retângulo (0 se dentro) */
function distToRect(p: Vec, r: Rect): number {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

function quadBezier(a: Vec, c: Vec, b: Vec, n: number): Vec[] {
  const pts: Vec[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const mt = 1 - t;
    pts.push({
      x: mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
      y: mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y,
    });
  }
  return pts;
}

/** pontos amostrados ao longo de uma polilinha (para checar sobreposição) */
function samplePath(path: Vec[], step: number): Vec[] {
  const pts: Vec[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(len / step));
    for (let j = 0; j < n; j++) {
      const t = j / n;
      pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  pts.push(path[path.length - 1]);
  return pts;
}

// ---------- geração ----------

export function generateDungeon(cfg: GenConfig): MapDocument {
  const seedNum = typeof cfg.seed === 'string' ? hashSeed(cfg.seed) : cfg.seed >>> 0;
  const rng = new RNG(seedNum);
  const style = getStyle(cfg.styleId ?? 'retrofuturista');

  const W = cfg.width;
  const H = cfg.height;
  const count = Math.round(12 + cfg.complexity * 8); // 12..20 salas

  // --- fase 1+2: dispersão e relaxamento ---
  const rects: Rect[] = [];
  for (let i = 0; i < count; i++) {
    const roll = rng.next();
    let w: number, h: number;
    if (roll < 0.22) { w = rng.range(12, 18); h = rng.range(10, 16); }       // salão
    else if (roll < 0.62) { w = rng.range(8, 13); h = rng.range(7, 12); }    // média
    else { w = rng.range(5, 8); h = rng.range(5, 8); }                        // pequena
    if (rng.chance(0.3)) [w, h] = [h, w];
    w = Math.min(w, W * 0.28);
    h = Math.min(h, H * 0.28);
    // viés central: reduz áreas mortas de convés nos bordos
    const bx = W * 0.12, by = H * 0.12;
    rects.push({
      x: rng.range(bx, Math.max(bx + 1, W - w - bx)),
      y: rng.range(by, Math.max(by + 1, H - h - by)),
      w, h,
    });
  }

  const margin = 2.2; // distância mínima da borda do convés

  // --- orçamento de área: escala as salas para caber sem sobreposição ---
  // sem isso, o relaxamento pode ser fisicamente impossível (áreas somadas > convés)
  const usableW = W - margin * 2;
  const usableH = H - margin * 2;
  const budget = usableW * usableH * 0.42;
  const totalArea = rects.reduce((s, r) => s + r.w * r.h, 0);
  if (totalArea > budget) {
    const scale = Math.sqrt(budget / totalArea);
    for (const r of rects) {
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      r.w = Math.max(4.6, r.w * scale);
      r.h = Math.max(4.6, r.h * scale);
      r.x = cx - r.w / 2;
      r.y = cy - r.h / 2;
    }
  }

  const clampToDeck = (r: Rect): boolean => {
    let clamped = false;
    if (r.x < margin) { r.x = margin; clamped = true; }
    if (r.y < margin) { r.y = margin; clamped = true; }
    if (r.x + r.w > W - margin) { r.x = W - margin - r.w; clamped = true; }
    if (r.y + r.h > H - margin) { r.y = H - margin - r.h; clamped = true; }
    return clamped;
  };

  for (let iter = 0; iter < 800; iter++) {
    let moved = false;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(inflateRect(rects[i], ROOM_MARGIN), rects[j])) {
          // registra posições para detectar quem está travado na borda
          const ax = rects[i].x, ay = rects[i].y, bx = rects[j].x, by = rects[j].y;
          pushApart(rects[i], rects[j], ROOM_MARGIN);
          const aMoved = rects[i].x !== ax || rects[i].y !== ay;
          const bMoved = rects[j].x !== bx || rects[j].y !== by;
          if (!aMoved && bMoved) {
            // A estava travado: empurra B pelo valor total restante
            pushApart(rects[j], rects[i], ROOM_MARGIN);
            const d = { x: rects[j].x - bx, y: rects[j].y - by };
            rects[j].x = bx + d.x * 2;
            rects[j].y = by + d.y * 2;
          } else if (!bMoved && aMoved) {
            pushApart(rects[i], rects[j], ROOM_MARGIN);
            const d = { x: rects[i].x - ax, y: rects[i].y - ay };
            rects[i].x = ax + d.x * 2;
            rects[i].y = ay + d.y * 2;
          }
          clampToDeck(rects[i]);
          clampToDeck(rects[j]);
          moved = true;
        }
      }
      // recolhe suavemente em direção ao centro para evitar dispersão excessiva
      const c = rectCenter(rects[i]);
      rects[i].x += (W / 2 - c.x) * 0.005;
      rects[i].y += (H / 2 - c.y) * 0.005;
      clampToDeck(rects[i]);
    }
    if (!moved && iter > 40) break;
  }

  // --- rede de segurança: encolhe salas até não haver nenhuma sobreposição ---
  for (let pass = 0; pass < 120; pass++) {
    let any = false;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(inflateRect(rects[i], 0.05), rects[j])) {
          // encolhe a menor das duas em 3%, preservando o centro
          const [small, big] = rects[i].w * rects[i].h <= rects[j].w * rects[j].h ? [i, j] : [j, i];
          const s = rects[small];
          const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
          s.w = Math.max(4.6, s.w * 0.97);
          s.h = Math.max(4.6, s.h * 0.97);
          s.x = cx - s.w / 2;
          s.y = cy - s.h / 2;
          clampToDeck(rects[big]);
          any = true;
        }
      }
    }
    if (!any) break;
  }
  // último empurrão fino de separação
  for (let iter = 0; iter < 100; iter++) {
    let moved = false;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(inflateRect(rects[i], 0.05), rects[j])) {
          pushApart(rects[i], rects[j], 0.05);
          clampToDeck(rects[i]);
          clampToDeck(rects[j]);
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // --- escolha de entrada (mais próxima da borda) e saída (mais distante) ---
  let entryIdx = 0;
  let bestBorder = Infinity;
  rects.forEach((r, i) => {
    const c = rectCenter(r);
    const d = Math.min(c.x, c.y, W - c.x, H - c.y);
    if (d < bestBorder) { bestBorder = d; entryIdx = i; }
  });
  let exitIdx = 0;
  let bestFar = -1;
  const ce = rectCenter(rects[entryIdx]);
  rects.forEach((r, i) => {
    if (i === entryIdx) return;
    const c = rectCenter(r);
    const d = Math.hypot(c.x - ce.x, c.y - ce.y);
    if (d > bestFar) { bestFar = d; exitIdx = i; }
  });

  // --- fase 3: conexão (MST + arestas extras) ---
  const n = rects.length;
  const inTree = new Set<number>([entryIdx]);
  const edges: [number, number][] = [];
  while (inTree.size < n) {
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (const i of inTree) {
      for (let j = 0; j < n; j++) {
        if (inTree.has(j)) continue;
        const d = Math.hypot(
          rectCenter(rects[i]).x - rectCenter(rects[j]).x,
          rectCenter(rects[i]).y - rectCenter(rects[j]).y,
        );
        if (d < bestD) { bestD = d; best = [i, j]; }
      }
    }
    if (!best) break;
    edges.push(best);
    inTree.add(best[1]);
  }
  // arestas extras para criar laços (grafos de dungeon bons têm ciclos)
  const extraEdges = 1 + Math.floor(rng.next() * 3);
  const allPairs: { a: number; b: number; d: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) continue;
      const ca = rectCenter(rects[i]);
      const cb = rectCenter(rects[j]);
      allPairs.push({ a: i, b: j, d: Math.hypot(ca.x - cb.x, ca.y - cb.y) });
    }
  }
  allPairs.sort((p, q) => p.d - q.d);
  const shortlist = allPairs.slice(0, Math.max(6, allPairs.length >> 1));
  rng.shuffle(shortlist);
  for (let k = 0; k < Math.min(extraEdges, shortlist.length); k++) {
    edges.push([shortlist[k].a, shortlist[k].b]);
  }

  // --- construção do documento ---
  const rooms: Room[] = [];
  const doors: Door[] = [];
  let roomSeq = 0;
  let doorSeq = 0;
  const roomIds = rects.map(() => `r${roomSeq++}`);
  const doorById = new Map<string, Door>();

  const kinds: RoomKind[] = rects.map((_, i) => {
    if (i === entryIdx) return 'entry';
    if (i === exitIdx) return 'exit';
    return 'hall';
  });
  const innerKinds: RoomKind[] = ['lab', 'utility', 'storage', 'quarters', 'hall'];
  rects.forEach((r, i) => {
    if (kinds[i] !== 'hall') return;
    const area = r.w * r.h;
    if (area > 130) return; // salão grande permanece 'hall'
    kinds[i] = rng.pick(innerKinds);
  });

  rects.forEach((r, i) => {
    rooms.push({
      id: roomIds[i],
      kind: kinds[i],
      floorStyle: style.floorStyleFor(kinds[i]),
      rect: r,
    });
  });

  // encontra posição de porta no lado da sala, evitando portas existentes;
  // se a parede for curta, reduz a largura da porta até 1.5m para caber
  const findDoorSpot = (
    roomIdx: number, target: Vec, wantWidth: number,
  ): { side: Side; offset: number; width: number } => {
    const r = rects[roomIdx];
    const existing = doors.filter((d) => d.roomId === roomIds[roomIdx]);
    const sides: Side[] = ['n', 's', 'e', 'w'];

    for (let width = wantWidth; width >= 1.5; width *= 0.8) {
      // ordena lados pela proximidade do ponto mais próximo do alvo
      const scored = sides.map((side) => {
        const o = sideOrigin(r, side);
        const d = sideDir(side);
        const len = sideLength(r, side);
        let t = side === 'n' || side === 's' ? target.x - o.x : target.y - o.y;
        t = Math.max(width / 2 + 0.6, Math.min(len - width / 2 - 0.6, t));
        const p = { x: o.x + d.x * t, y: o.y + d.y * t };
        return { side, t, d: Math.hypot(p.x - target.x, p.y - target.y) };
      }).sort((a, b) => a.d - b.d);

      for (const cand of scored) {
        const len = sideLength(r, cand.side);
        const blockers = existing
          .filter((d) => d.side === cand.side)
          .map((d) => ({ c: d.offset, r: d.width / 2 + width / 2 + 0.35 }));
        const fits = (t: number) =>
          t - width / 2 >= 0.6 && t + width / 2 <= len - 0.6 &&
          blockers.every((b) => Math.abs(t - b.c) >= b.r);
        if (fits(cand.t)) return { side: cand.side, offset: cand.t, width };
        // desloca para o espaço livre mais próximo
        let best: number | null = null;
        let bestDist = Infinity;
        for (let t = 0.6 + width / 2; t <= len - 0.6 - width / 2; t += 0.2) {
          if (fits(t) && Math.abs(t - cand.t) < bestDist) { best = t; bestDist = Math.abs(t - cand.t); }
        }
        if (best !== null) return { side: cand.side, offset: best, width };
      }
    }
    // último recurso: ponto mais próximo com clamp consciente da largura
    const width = 1.5;
    const { side, offset } = nearestEdgePoint(r, target);
    const len = sideLength(r, side);
    return { side, width, offset: Math.max(width / 2 + 0.6, Math.min(len - width / 2 - 0.6, offset)) };
  };

  const mkDoor = (roomIdx: number, target: Vec, type: DoorType): Door => {
    const { side, offset, width } = findDoorSpot(roomIdx, target, CORRIDOR_W - 0.2);
    const door: Door = {
      id: `d${doorSeq++}`,
      roomId: roomIds[roomIdx],
      side,
      offset,
      width,
      type,
      outward: sideOutward(side),
    };
    doors.push(door);
    doorById.set(door.id, door);
    return door;
  };

  let corrSeq = 0;
  const corridors: Room[] = [];
  interface CorridorEnd { rect: Rect; doorPoint: Vec }
  const mkCorridor = (
    a: Vec, b: Vec, na: Vec, nb: Vec,
    others: Rect[], endA: CorridorEnd | null, endB: CorridorEnd | null,
    fromDoorId: string | null, toDoorId: string | null,
  ): Vec[] => {
    const p0 = { x: a.x + na.x, y: a.y + na.y };
    const p1 = { x: b.x + nb.x, y: b.y + nb.y };
    const candidates: Vec[][] = [
      [p0, { x: p1.x, y: p0.y }, p1],
      [p0, { x: p0.x, y: p1.y }, p1],
    ];
    // curva orgânica (bézier quadrática) — dá o visual não-diagramático
    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const ctrl = { x: mid.x + rng.jitter(6), y: mid.y + rng.jitter(6) };
    candidates.push(quadBezier(p0, ctrl, p1, 14));
    const endpoints = [endA, endB].filter((e): e is CorridorEnd => e !== null);
    const scored = candidates.map((path) => {
      let hits = 0;
      for (const s of samplePath(path, 1.2)) {
        let hit = false;
        // a amostra é o EIXO: a cápsula completa (parede + folga) deve ficar fora das salas
        for (const o of others) {
          if (distToRect(s, o) < CORRIDOR_W / 2 + 0.6) { hit = true; break; }
        }
        // também penaliza invadir as salas de origem/destino (exceto junto à porta)
        if (!hit) {
          for (const e of endpoints) {
            if (pointInRect(s, inflateRect(e.rect, 0.25)) &&
                Math.hypot(s.x - e.doorPoint.x, s.y - e.doorPoint.y) > 1.6) {
              hit = true; break;
            }
          }
        }
        if (hit) hits++;
      }
      return { path, hits };
    });
    scored.sort((x, y) => x.hits - y.hits);
    const chosen = scored[0].path;
    corridors.push({
      id: `c${corrSeq++}`,
      kind: 'corridor',
      floorStyle: style.floorStyleFor('corridor'),
      capsule: { width: CORRIDOR_W, path: chosen, fromDoorId, toDoorId },
    });
    return chosen;
  };

  // corredores para cada aresta
  for (const [i, j] of edges) {
    const ci = rectCenter(rects[i]);
    const cj = rectCenter(rects[j]);
    const others = rects.filter((_, k) => k !== i && k !== j);
    const di = mkDoor(i, cj, rng.pick<DoorType>(style.doorTypes));
    const dj = mkDoor(j, ci, rng.pick<DoorType>(style.doorTypes));
    const pa = doorPos(di, rooms[i]);
    const pb = doorPos(dj, rooms[j]);
    mkCorridor(pa, pb, di.outward, dj.outward, others,
      { rect: rects[i], doorPoint: pa }, { rect: rects[j], doorPoint: pb },
      di.id, dj.id);
  }

  // stubs de entrada/saída até a borda do convés (caps com bulkhead/docking)
  const mkStub = (roomIdx: number, type: DoorType, cap: 'dock' | 'bulkhead'): void => {
    const r = rects[roomIdx];
    const c = rectCenter(r);
    // lado mais próximo da borda correspondente
    const dists: { side: Side; d: number }[] = [
      { side: 'n', d: c.y }, { side: 's', d: H - c.y },
      { side: 'w', d: c.x }, { side: 'e', d: W - c.x },
    ];
    dists.sort((a, b) => a.d - b.d);
    // tenta o lado mais próximo da borda; cai para o seguinte se não houver espaço
    let spot: { side: Side; offset: number; width: number } | null = null;
    for (const cand of dists) {
      const o = sideOrigin(r, cand.side);
      const d = sideDir(cand.side);
      const len = sideLength(r, cand.side);
      const mid = { x: o.x + d.x * (len / 2), y: o.y + d.y * (len / 2) };
      spot = findDoorSpot(roomIdx, mid, 2.6);
      if (spot.side === cand.side) break;
    }
    spot ??= findDoorSpot(roomIdx, rectCenter(r), 2.6);
    const door: Door = {
      id: `d${doorSeq++}`, roomId: roomIds[roomIdx], side: spot.side, offset: spot.offset,
      width: spot.width, type, outward: sideOutward(spot.side),
    };
    doors.push(door);
    doorById.set(door.id, door);
    const p = doorPos(door, rooms[roomIdx]);
    const o = door.outward;
    const side = spot.side;
    const edge = side === 'n' ? 1.2 : side === 's' ? H - 1.2 : side === 'w' ? 1.2 : W - 1.2;
    const end = side === 'n' || side === 's'
      ? { x: p.x + rng.jitter(1.5), y: edge }
      : { x: edge, y: p.y + rng.jitter(1.5) };
    const start = { x: p.x + o.x * 0.6, y: p.y + o.y * 0.6 };
    corridors.push({
      id: `c${corrSeq++}`, kind: 'corridor', floorStyle: style.floorStyleFor('corridor'),
      label: cap,
      capsule: {
        width: 2.6, path: [start, end], fromDoorId: door.id, toDoorId: null,
      },
    });
  };

  mkStub(entryIdx, style.stubTypes.entry, 'dock');
  mkStub(exitIdx, style.stubTypes.exit, 'bulkhead');

  rooms.push(...corridors);

  // rótulos temáticos (do estilo ativo) + detalhes sensoriais de lore
  rooms.forEach((room) => {
    if (room.rect) room.label = rng.pick(style.labels[room.kind] ?? ['']);
    const detail = pickDetail(style.id, rng);
    if (detail) room.detail = detail;
  });

  const doc: MapDocument = {
    version: 1,
    seed: seedNum,
    styleId: style.id,
    mapType: 'dungeon',
    bounds: { w: W, h: H },
    wallThickness: WALL_T,
    rooms,
    doors,
    props: [],
    extraWalls: [],
    meta: {
      complexity: cfg.complexity,
      density: cfg.density,
      conservation: cfg.conservation,
      lighting: cfg.lighting,
      prompt: cfg.prompt ?? '',
    },
  };

  placeProps(doc, rng);
  return doc;
}

// ---------- mobiliário (vocabulário vem do estilo ativo) ----------

function placeProps(doc: MapDocument, rng: RNG): void {
  const style = getStyle(doc.styleId);
  const catalog = style.catalog;
  const lightProp = style.lightProp;
  // especificação da prop de luz: procura no catálogo do estilo; se não
  // houver (catálogo incompleto), cai numa padrão de 1.3×1.3
  const lightSpec: PropSpec =
    Object.values(catalog).flat().find((s) => s.type === lightProp)
    ?? { type: lightProp, w: 1.3, h: 1.3 };
  let seq = 0;
  const placed: Rect[] = [];
  const clearance = 0.28; // folga entre props

  const doorZones = (rect: Rect): Rect[] =>
    doc.doors
      .filter((d) => d.roomId && doc.rooms.find((r) => r.id === d.roomId)?.rect)
      .map((d) => {
        const room = doc.rooms.find((r) => r.id === d.roomId)!;
        if (room.rect !== rect) return null;
        const p = doorPos(d, room);
        return { x: p.x - 1.3, y: p.y - 1.3, w: 2.6, h: 2.6 } as Rect;
      })
      .filter((z): z is Rect => z !== null);

  const tryPlace = (room: Room, spec: PropSpec, nearWall: boolean): Prop | null => {
    const rect = room.rect!;
    const zones = doorZones(rect);
    for (let attempt = 0; attempt < 40; attempt++) {
      let cx: number, cy: number;
      if (nearWall) {
        const side = rng.pick(['n', 's', 'e', 'w'] as const);
        const inset = (side === 'n' || side === 's' ? spec.h : spec.w) / 2 + 0.5;
        if (side === 'n') { cx = rng.range(rect.x + spec.w / 2 + 0.3, rect.x + rect.w - spec.w / 2 - 0.3); cy = rect.y + inset; }
        else if (side === 's') { cx = rng.range(rect.x + spec.w / 2 + 0.3, rect.x + rect.w - spec.w / 2 - 0.3); cy = rect.y + rect.h - inset; }
        else if (side === 'e') { cx = rect.x + rect.w - inset; cy = rng.range(rect.y + spec.h / 2 + 0.3, rect.y + rect.h - spec.h / 2 - 0.3); }
        else { cx = rect.x + inset; cy = rng.range(rect.y + spec.h / 2 + 0.3, rect.y + rect.h - spec.h / 2 - 0.3); }
      } else {
        cx = rng.range(rect.x + spec.w / 2 + 0.5, rect.x + rect.w - spec.w / 2 - 0.5);
        cy = rng.range(rect.y + spec.h / 2 + 0.5, rect.y + rect.h - spec.h / 2 - 0.5);
      }
      const rot = rng.int(0, 3) as 0 | 1 | 2 | 3;
      const test: Rect = {
        x: cx - ((rot % 2 ? spec.h : spec.w) / 2) - clearance,
        y: cy - ((rot % 2 ? spec.w : spec.h) / 2) - clearance,
        w: (rot % 2 ? spec.h : spec.w) + 2 * clearance,
        h: (rot % 2 ? spec.w : spec.h) + 2 * clearance,
      };
      // dentro da sala (com folga da parede) e sem tocar zonas de porta
      if (test.x < rect.x + 0.45 || test.y < rect.y + 0.45 ||
          test.x + test.w > rect.x + rect.w - 0.45 || test.y + test.h > rect.y + rect.h - 0.45) continue;
      if (zones.some((z) => rectsOverlap(test, z))) continue;
      if (placed.some((p) => rectsOverlap(test, p))) continue;
      const prop: Prop = {
        id: `p${seq++}`, type: spec.type, pos: { x: cx, y: cy }, rot,
        w: spec.w, h: spec.h, variant: rng.int(0, 3),
      };
      placed.push(test);
      return prop;
    }
    return null;
  };

  for (const room of doc.rooms) {
    if (!room.rect) continue;
    let specs = catalog[room.kind] ?? [];
    const mult = 0.45 + doc.meta.density * 1.1;
    const target = Math.max(1, Math.round(specs.length * mult));
    // garante props centrais características
    const centerSpecs = specs.filter((s) => style.centerProps.includes(s.type));
    for (const cs of centerSpecs) {
      const p = tryPlace(room, cs, false);
      if (p) doc.props.push(p);
    }
    let wallCount = 0;
    const wallSpecs = specs.filter((s) => !style.centerProps.includes(s.type));
    rng.shuffle([...wallSpecs]);
    for (const ws of wallSpecs) {
      if (wallCount >= target - centerSpecs.length) break;
      const p = tryPlace(room, ws, true);
      if (p) { doc.props.push(p); wallCount++; }
    }
    // iluminação proporcional à área: ~1 luz a cada 85 m²
    const area = room.rect.w * room.rect.h;
    const want = Math.max(1, Math.ceil(area / 85));
    let have = doc.props.filter((p) => p.type === lightProp && pointInRect(p.pos, room.rect!, 0.3)).length;
    for (let k = 0; k < 4 && have < want; k++) {
      const p = tryPlace(room, lightSpec, false);
      if (p) { doc.props.push(p); have++; }
    }
    // TODA sala retangular deve ter ao menos uma luz (fallback garantido).
    // Os filtros abaixo espelham EXATAMENTE as regras do validador
    // (validate.ts): zona de porta 2.2×2.2 no centro da porta e footprint
    // cru (sem folga) na sobreposição entre props.
    const hasLamp = doc.props.some(
      (p) => p.type === lightProp && pointInRect(p.pos, room.rect!, 0.5),
    );
    if (!hasLamp) {
      const rect = room.rect!;
      const zones: Rect[] = doc.doors.map((d) => {
        const droom = doc.rooms.find((r) => r.id === d.roomId)!;
        const p = doorPos(d, droom);
        return { x: p.x - 1.1, y: p.y - 1.1, w: 2.2, h: 2.2 };
      });
      const fp = (q: { x: number; y: number }): Rect => ({
        x: q.x - lightSpec.w / 2, y: q.y - lightSpec.h / 2,
        w: lightSpec.w, h: lightSpec.h,
      });
      const blocked = (q: { x: number; y: number }): boolean => {
        const r = fp(q);
        if (zones.some((z) => rectsOverlap(r, z))) return true;
        for (const p of doc.props) {
          const pr: Rect = { x: p.pos.x - p.w / 2, y: p.pos.y - p.h / 2, w: p.w, h: p.h };
          if (rectsOverlap(r, pr)) return true;
        }
        return false;
      };
      const q = ((): { x: number; y: number } | null => {
        // grade fina: 7×5 pontos, do centro para fora (quadrantes internos primeiro)
        const cands: { x: number; y: number; d: number }[] = [];
        for (let gx = 1; gx < 8; gx++) {
          for (let gy = 1; gy < 6; gy++) {
            const qx = rect.x + (rect.w * gx) / 8;
            const qy = rect.y + (rect.h * gy) / 6;
            // dentro do piso com a margem do validador (0.25 + metade da pegada)
            const inset = 0.25 + Math.max(lightSpec.w, lightSpec.h) / 2;
            if (!pointInRect({ x: qx, y: qy }, rect, inset)) continue;
            const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
            cands.push({ x: qx, y: qy, d: Math.hypot(qx - cx, qy - cy) });
          }
        }
        cands.sort((a, b) => a.d - b.d);
        return cands.find((c) => !blocked(c)) ?? null;
      })();
      if (q) {
        doc.props.push({
          id: `p${seq++}`, type: lightProp, pos: q, rot: 0, w: lightSpec.w, h: lightSpec.h, variant: 0,
        });
        placed.push({ x: q.x - 0.93, y: q.y - 0.93, w: 1.86, h: 1.86 });
      }
    }
  }

  // corredores: luzes espaçadas + tubulações decorativas
  const doorPoints = doc.doors.map((d) => {
    const room = doc.rooms.find((r) => r.id === d.roomId)!;
    return doorPos(d, room);
  });
  const farFromDoors = (p: Vec, min: number) =>
    doorPoints.every((dp) => Math.hypot(dp.x - p.x, dp.y - p.y) >= min);
  const farFromProps = (p: Vec, min: number) =>
    doc.props.every((q) => {
      const rr = Math.max(q.w, q.h) / 2 + min;
      return Math.hypot(q.pos.x - p.x, q.pos.y - p.y) >= rr;
    });
  for (const room of doc.rooms) {
    if (!room.capsule) continue;
    const path = room.capsule.path;
    const totalLen = path.reduce((s, p, i) => i ? s + Math.hypot(p.x - path[i - 1].x, p.y - path[i - 1].y) : 0, 0);
    // não posiciona decoração perto das extremidades (zonas de porta)
    const endpointClear = Math.min(2.2, Math.max(1.6, totalLen * 0.2));
    const cumLen: number[] = [0];
    for (let i = 1; i < path.length; i++) {
      cumLen.push(cumLen[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
    }
    let acc = 3.0;
    let flip = false;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      let d = acc;
      while (d < len) {
        const globalD = cumLen[i] + d;
        if (globalD > endpointClear && globalD < totalLen - endpointClear) {
          const t = d / len;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          let placedHere = false;
          if (flip && doc.meta.density > 0.4 && style.corridorDecor) {
            // decoração ao longo da parede (só em trechos retos);
            // nesses pontos não há luz, para não sobrepor as pegadas
            const decor = style.corridorDecor;
            const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
            const px2 = px + nx * (room.capsule.width / 2 - 0.55);
            const py2 = py + ny * (room.capsule.width / 2 - 0.55);
            const horiz = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
            const pw = horiz ? decor.w : decor.h, ph = horiz ? decor.h : decor.w;
            const corners = [
              { x: px2 - pw / 2, y: py2 - ph / 2 }, { x: px2 + pw / 2, y: py2 - ph / 2 },
              { x: px2 - pw / 2, y: py2 + ph / 2 }, { x: px2 + pw / 2, y: py2 + ph / 2 },
            ];
            const fits = corners.every((c) => distToPath(c, path) <= room.capsule!.width / 2 - 0.12);
            if (fits && farFromDoors({ x: px2, y: py2 }, 2.1) && farFromProps({ x: px2, y: py2 }, 0.7)) {
              doc.props.push({
                id: `p${seq++}`, type: decor.type,
                pos: { x: px2, y: py2 },
                rot: horiz ? 0 : 1,
                w: decor.w, h: decor.h, variant: rng.int(0, 2),
              });
              placedHere = true;
            }
          }
          if (!placedHere && farFromDoors({ x: px, y: py }, 2.1) && farFromProps({ x: px, y: py }, 0.75)) {
            doc.props.push({
              id: `p${seq++}`, type: lightProp, pos: { x: px, y: py },
              rot: 0, w: lightSpec.w, h: lightSpec.h, variant: 0,
            });
          }
          flip = !flip;
        }
        d += 7.0;
      }
      acc = d - len;
    }
  }
}

/**
 * Reancora os corredores ligados a uma sala que foi movida/editada.
 * Recalcula o trecho inicial (ou final) do caminho a partir da nova posição da porta.
 */
export function reanchorCorridors(doc: MapDocument, roomId: string): void {
  const room = doc.rooms.find((r) => r.id === roomId);
  if (!room || !room.rect) return;
  for (const corr of doc.rooms) {
    if (!corr.capsule) continue;
    const cap = corr.capsule;
    for (const key of ['fromDoorId', 'toDoorId'] as const) {
      const doorId = cap[key];
      if (!doorId) continue;
      const door = doc.doors.find((d) => d.id === doorId);
      if (!door || door.roomId !== roomId) continue;
      const p = doorPos(door, room);
      const idx = key === 'fromDoorId' ? 0 : cap.path.length - 1;
      const o = door.outward;
      cap.path[idx] = { x: p.x + o.x, y: p.y + o.y };
      // mantém o segundo ponto no prolongamento da normal para evitar dobras
      const next = cap.path[key === 'fromDoorId' ? 1 : cap.path.length - 2];
      const d = { x: next.x - cap.path[idx].x, y: next.y - cap.path[idx].y };
      const len = Math.hypot(d.x, d.y);
      if (len > 4) {
        const clamped = { x: cap.path[idx].x + (d.x / len) * 2, y: cap.path[idx].y + (d.y / len) * 2 };
        cap.path[key === 'fromDoorId' ? 1 : cap.path.length - 2] = clamped;
      }
    }
  }
}

/** usado pelo editor: caminho de um corredor como lista de pontos amostrados */
export function corridorSamples(doc: MapDocument, corrId: string, step = 1): Vec[] {
  const corr = doc.rooms.find((r) => r.id === corrId);
  if (!corr?.capsule) return [];
  return samplePath(corr.capsule.path, step);
}

/** verifica se um ponto está sobre o piso de alguma sala/corredor */
export function isOnFloor(doc: MapDocument, p: Vec, inset = 0): boolean {
  for (const room of doc.rooms) {
    if (room.rect && pointInRect(p, room.rect, inset)) return true;
    if (room.capsule && distToPath(p, room.capsule.path) <= room.capsule.width / 2 - inset) return true;
  }
  return false;
}
