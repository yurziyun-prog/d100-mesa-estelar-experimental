/**
 * Validação geométrica automática:
 *  - conectividade (flood fill sobre grade de navegação rasterizada)
 *  - portas alinhadas a paredes
 *  - props sem sobreposição e com clearance de portas
 *  - paredes extras dentro do convés
 */

import {
  doorPos, propFootprint, rectsOverlap, sideLength, distToPath, pointInRect,
} from './types';
import type { MapDocument, Prop, Rect } from './types';

export interface Issue {
  severity: 'error' | 'warning';
  message: string;
}

const NAV_CELL = 0.25; // metros

/** máscara de piso navegável na grade */
function buildNavGrid(doc: MapDocument): { w: number; h: number; walk: Uint8Array } {
  const gw = Math.ceil(doc.bounds.w / NAV_CELL);
  const gh = Math.ceil(doc.bounds.h / NAV_CELL);
  const walk = new Uint8Array(gw * gh);
  const idx = (ix: number, iy: number) => iy * gw + ix;

  // salas retangulares (interior do piso; a parede fica FORA do rect)
  for (const room of doc.rooms) {
    if (!room.rect) continue;
    const x0 = Math.ceil(room.rect.x / NAV_CELL);
    const y0 = Math.ceil(room.rect.y / NAV_CELL);
    const x1 = Math.floor((room.rect.x + room.rect.w) / NAV_CELL);
    const y1 = Math.floor((room.rect.y + room.rect.h) / NAV_CELL);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) walk[idx(x, y)] = 1;
    }
  }
  // corredores-cápsula
  for (const room of doc.rooms) {
    if (!room.capsule) continue;
    const r = room.capsule.width / 2 - 0.05;
    const x0 = Math.max(0, Math.floor((Math.min(...room.capsule.path.map((p) => p.x)) - r) / NAV_CELL));
    const y0 = Math.max(0, Math.floor((Math.min(...room.capsule.path.map((p) => p.y)) - r) / NAV_CELL));
    const x1 = Math.min(gw - 1, Math.ceil((Math.max(...room.capsule.path.map((p) => p.x)) + r) / NAV_CELL));
    const y1 = Math.min(gh - 1, Math.ceil((Math.max(...room.capsule.path.map((p) => p.y)) + r) / NAV_CELL));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const p = { x: (x + 0.5) * NAV_CELL, y: (y + 0.5) * NAV_CELL };
        if (distToPath(p, room.capsule.path) <= r) walk[idx(x, y)] = 1;
      }
    }
  }
  // aberturas de porta: conectam piso da sala ao exterior (corredor)
  for (const door of doc.doors) {
    const room = doc.rooms.find((r) => r.id === door.roomId);
    if (!room?.rect) continue;
    const p = doorPos(door, room);
    const o = door.outward;
    for (let t = -door.width / 2; t <= door.width / 2; t += NAV_CELL) {
      // varre perpendicularmente através da parede
      for (let s = -0.5; s <= 0.5; s += NAV_CELL) {
        const wx = p.x + (o.y !== 0 ? t : 0) + o.x * s;
        const wy = p.y + (o.x !== 0 ? t : 0) + o.y * s;
        const ix = Math.floor(wx / NAV_CELL);
        const iy = Math.floor(wy / NAV_CELL);
        if (ix >= 0 && iy >= 0 && ix < gw && iy < gh) walk[idx(ix, iy)] = 1;
      }
    }
  }
  // paredes extras bloqueiam
  for (const wall of doc.extraWalls) {
    const len = Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y);
    const steps = Math.ceil(len / NAV_CELL);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wx = wall.a.x + (wall.b.x - wall.a.x) * t;
      const wy = wall.a.y + (wall.b.y - wall.a.y) * t;
      const ix = Math.floor(wx / NAV_CELL);
      const iy = Math.floor(wy / NAV_CELL);
      if (ix >= 0 && iy >= 0 && ix < gw && iy < gh) walk[idx(ix, iy)] = 0;
    }
  }
  return { w: gw, h: gh, walk };
}

function floodFill(walk: Uint8Array, gw: number, gh: number, sx: number, sy: number): Uint8Array {
  const seen = new Uint8Array(gw * gh);
  const stack: number[] = [];
  const start = sy * gw + sx;
  if (!walk[start]) return seen;
  seen[start] = 1;
  stack.push(start);
  while (stack.length) {
    const cur = stack.pop()!;
    const x = cur % gw;
    const y = (cur / gw) | 0;
    const neighbors = [
      x > 0 ? cur - 1 : -1,
      x < gw - 1 ? cur + 1 : -1,
      y > 0 ? cur - gw : -1,
      y < gh - 1 ? cur + gw : -1,
    ];
    for (const nb of neighbors) {
      if (nb >= 0 && walk[nb] && !seen[nb]) {
        seen[nb] = 1;
        stack.push(nb);
      }
    }
  }
  return seen;
}

function propRect(p: Prop): Rect {
  return propFootprint(p);
}

export function validateMap(doc: MapDocument): Issue[] {
  const issues: Issue[] = [];
  const roomById = new Map(doc.rooms.map((r) => [r.id, r]));

  // --- conectividade ---
  const entry = doc.rooms.find((r) => r.kind === 'entry');
  if (!entry?.rect) {
    issues.push({ severity: 'error', message: 'Sala de entrada não definida.' });
  } else {
    const grid = buildNavGrid(doc);
    const start = {
      x: Math.floor((entry.rect.x + entry.rect.w / 2) / NAV_CELL),
      y: Math.floor((entry.rect.y + entry.rect.h / 2) / NAV_CELL),
    };
    const seen = floodFill(grid.walk, grid.w, grid.h, start.x, start.y);
    for (const room of doc.rooms) {
      const c = room.rect
        ? { x: room.rect.x + room.rect.w / 2, y: room.rect.y + room.rect.h / 2 }
        : room.capsule!.path[Math.floor(room.capsule!.path.length / 2)];
      const ix = Math.floor(c.x / NAV_CELL);
      const iy = Math.floor(c.y / NAV_CELL);
      if (ix < 0 || iy < 0 || ix >= grid.w || iy >= grid.h || !seen[iy * grid.w + ix]) {
        issues.push({
          severity: 'error',
          message: `Sala ${room.id}${room.label ? ` (${room.label})` : ''} inacessível a partir da entrada.`,
        });
      }
    }
  }

  // --- portas ---
  for (const door of doc.doors) {
    const room = roomById.get(door.roomId);
    if (!room?.rect) {
      issues.push({ severity: 'error', message: `Porta ${door.id} referencia sala inexistente.` });
      continue;
    }
    const len = sideLength(room.rect, door.side);
    if (door.offset - door.width / 2 < 0 || door.offset + door.width / 2 > len) {
      issues.push({ severity: 'error', message: `Porta ${door.id} ultrapassa o comprimento da parede.` });
    }
    // porta deve dar para piso navegável do lado de fora (corredor)
    const p = doorPos(door, room);
    const out = { x: p.x + door.outward.x * 0.8, y: p.y + door.outward.y * 0.8 };
    const outside = doc.rooms.some((r) => {
      if (r.rect) return pointInRect(out, r.rect, 0.02);
      if (r.capsule) return distToPath(out, r.capsule.path) <= r.capsule.width / 2 + 0.01;
      return false;
    });
    if (!outside) {
      issues.push({ severity: 'warning', message: `Porta ${door.id} não se conecta a um corredor do lado de fora.` });
    }
  }
  // portas sobrepostas na mesma parede
  for (let i = 0; i < doc.doors.length; i++) {
    for (let j = i + 1; j < doc.doors.length; j++) {
      const a = doc.doors[i], b = doc.doors[j];
      if (a.roomId === b.roomId && a.side === b.side) {
        if (Math.abs(a.offset - b.offset) < (a.width + b.width) / 2) {
          issues.push({ severity: 'error', message: `Portas ${a.id} e ${b.id} se sobrepõem na mesma parede.` });
        }
      }
    }
  }

  // --- props ---
  const propRects: Rect[] = [];
  for (const prop of doc.props) {
    const r = propRect(prop);
    const inside = doc.rooms.some((room) => {
      if (room.rect) return (
        r.x >= room.rect.x + 0.25 && r.y >= room.rect.y + 0.25 &&
        r.x + r.w <= room.rect.x + room.rect.w - 0.25 &&
        r.y + r.h <= room.rect.y + room.rect.h - 0.25
      );
      if (room.capsule) {
        const corners = [
          { x: r.x, y: r.y }, { x: r.x + r.w, y: r.y },
          { x: r.x, y: r.y + r.h }, { x: r.x + r.w, y: r.y + r.h },
        ];
        return corners.every((c) => distToPath(c, room.capsule!.path) <= room.capsule!.width / 2 - 0.15);
      }
      return false;
    });
    if (!inside) {
      issues.push({ severity: 'error', message: `Prop ${prop.id} (${prop.type}) fora do piso ou sobre parede.` });
    }
    // clearance de portas (apenas portas da sala onde a prop está, ou muito próximas)
    for (const door of doc.doors) {
      const room = roomById.get(door.roomId);
      if (!room?.rect) continue;
      // porta de outra sala através do vão entre salas não conta como obstrução
      if (
        r.x > room.rect.x + room.rect.w + 1.0 || r.x + r.w < room.rect.x - 1.0 ||
        r.y > room.rect.y + room.rect.h + 1.0 || r.y + r.h < room.rect.y - 1.0
      ) continue;
      const p = doorPos(door, room);
      const zone: Rect = { x: p.x - 1.1, y: p.y - 1.1, w: 2.2, h: 2.2 };
      if (rectsOverlap(r, zone)) {
        issues.push({ severity: 'error', message: `Prop ${prop.id} (${prop.type}) obstrui a porta ${door.id}.` });
      }
    }
    propRects.push(r);
  }
  for (let i = 0; i < propRects.length; i++) {
    for (let j = i + 1; j < propRects.length; j++) {
      if (rectsOverlap(propRects[i], propRects[j])) {
        issues.push({ severity: 'error', message: `Props ${doc.props[i].id} e ${doc.props[j].id} se sobrepõem.` });
      }
    }
  }

  // --- paredes extras ---
  for (const wall of doc.extraWalls) {
    for (const [tag, p] of [['início', wall.a], ['fim', wall.b]] as const) {
      if (p.x < 0 || p.y < 0 || p.x > doc.bounds.w || p.y > doc.bounds.h) {
        issues.push({ severity: 'error', message: `Parede extra ${wall.id} (${tag}) fora dos limites do convés.` });
      }
    }
  }

  return issues;
}

export function isValid(doc: MapDocument): boolean {
  return validateMap(doc).every((i) => i.severity !== 'error');
}

/** resumo para exibição no painel */
export function summarize(issues: Issue[]): { errors: number; warnings: number } {
  return {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
  };
}
