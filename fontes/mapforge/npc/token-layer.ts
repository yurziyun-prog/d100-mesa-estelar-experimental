/**
 * Camada de tokens de NPC/criatura sobre o mapa — tokens carregam a ficha
 * inteira e podem ser introduzidos no mapa atual (posição automática em
 * local válido) e realocados por drag nos componentes de canvas.
 */

import { RNG } from '../rng';
import type { Vec, MapDocument } from '../types';
import type { CityDoc } from '../city/types';
import type { WildDoc } from '../wild/types';
import type { NpcFicha } from './generator';
import { tokenDiameter } from './token';

export interface MapToken {
  id: string;
  ficha: NpcFicha;
  /** posição em metros */
  x: number;
  y: number;
  /** diâmetro em metros */
  d: number;
  /** ponto de origem do deploy (âncora do comportamento territorial) */
  ox: number;
  oy: number;
}

export function makeToken(ficha: NpcFicha, x: number, y: number): MapToken {
  const px = Math.round(x * 4) / 4;
  const py = Math.round(y * 4) / 4;
  return {
    id: `tok-${ficha.id}`,
    ficha,
    x: px,
    y: py,
    d: tokenDiameter(ficha),
    ox: px,
    oy: py,
  };
}

/** distância do ponto ao centro do token (hit test) */
export function hitToken(tokens: MapToken[], w: Vec): MapToken | null {
  const sorted = [...tokens].sort((a, b) => b.y - a.y);
  return sorted.find((t) => Math.hypot(w.x - t.x, w.y - t.y) <= t.d / 2 + 0.15) ?? null;
}

/** pontos de spawn válidos para N tokens, conforme o tipo de mapa */
export function spawnPositions(map: MapDocument | CityDoc | WildDoc, n: number, seed: number): Vec[] {
  const rng = new RNG(seed >>> 0);
  const out: Vec[] = [];

  if ('rooms' in map) {
    // dungeon: centros das salas retangulares (preferindo as maiores)
    const salas = map.rooms
      .filter((r) => r.rect)
      .map((r) => ({ r: r.rect!, area: r.rect!.w * r.rect!.h }))
      .sort((a, b) => b.area - a.area);
    if (!salas.length) return [{ x: map.bounds.w / 2, y: map.bounds.h / 2 }];
    for (let i = 0; i < n; i++) {
      const s = salas[i % salas.length].r;
      out.push({
        x: s.x + 1.5 + rng.next() * Math.max(0.5, s.w - 3),
        y: s.y + 1.5 + rng.next() * Math.max(0.5, s.h - 3),
      });
    }
    return out;
  }

  if ('plazas' in map) {
    // cidade: praças e parques primeiro, depois pontos de ruas principais
    const areas = [...map.plazas.map((p) => p.rect), ...map.parks.map((p) => p.rect)];
    const ruas = map.streets.filter((s) => s.kind === 'main');
    for (let i = 0; i < n; i++) {
      if (areas.length && i < areas.length * 2) {
        const r = areas[i % areas.length];
        out.push({
          x: r.x + 1 + rng.next() * Math.max(0.5, r.w - 2),
          y: r.y + 1 + rng.next() * Math.max(0.5, r.h - 2),
        });
      } else if (ruas.length) {
        const s = rng.pick(ruas);
        const seg = rng.int(0, s.path.length - 2);
        const a = s.path[seg], b = s.path[seg + 1];
        const t = rng.next();
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      } else {
        out.push({ x: map.bounds.w / 2, y: map.bounds.h / 2 });
      }
    }
    return out;
  }

  if ('trails' in map) {
    // exterior: ao longo das trilhas (as criaturas vivem nos caminhos)
    const trilhas = map.trails.length ? map.trails : [{ id: 't', width: 2, path: [
      { x: map.bounds.w / 4, y: map.bounds.h / 2 },
      { x: (map.bounds.w * 3) / 4, y: map.bounds.h / 2 },
    ] }];
    for (let i = 0; i < n; i++) {
      const s = rng.pick(trilhas);
      const seg = rng.int(0, s.path.length - 2);
      const a = s.path[seg], b = s.path[seg + 1];
      const t = rng.next();
      out.push({
        x: a.x + (b.x - a.x) * t + rng.jitter(2),
        y: a.y + (b.y - a.y) * t + rng.jitter(2),
      });
    }
    return out;
  }

  return out;
}
