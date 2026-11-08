/**
 * Exportação semântica em camadas do EXTERIOR para o motor de jogo
 * (Mesa Estelar): terreno transitável, escarpas como paredes, adereços
 * categorizados (vegetação/rocha/luz) e marcadores de spawn/saída.
 */

import { GAME_EXPORT_VERSION, capsuleOutline } from '../gamedata';
import type { GameMapData, GameFloorArea, GameObject, GameMarker } from '../gamedata';
import type { Vec, WildDoc } from './types';

function rectPolygon(x: number, y: number, w: number, h: number): Vec[] {
  return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
}

/** categoria semântica por tipo de adereço */
const CATEGORY: Record<string, GameObject['category']> = {
  broadleaf: 'vegetation', pine: 'vegetation', oak: 'vegetation', bush: 'vegetation',
  flowers: 'decor', stump: 'decor', log: 'furniture',
  rock: 'furniture', shard: 'decor',
  haystack: 'furniture', fence: 'furniture',
  crystal: 'furniture', cart: 'furniture', timber: 'furniture',
  lantern: 'light',
  entrance: 'stairs',
};

const BLOCKS: Record<string, boolean> = {
  broadleaf: true, pine: true, oak: true, bush: false, flowers: false,
  stump: true, log: true, rock: true, shard: false,
  haystack: true, fence: true, crystal: true, cart: true, timber: true,
  lantern: false, entrance: true,
};

export function exportWildGameData(doc: WildDoc, actors?: import('../npc/actors').GameActor[]): GameMapData {
  const floors: GameFloorArea[] = [];
  // terreno base: o mapa inteiro é transitável por padrão (o jogo bloqueia
  // água pela `kind` da área sobreposta, que vem por último = prioridade)
  floors.push({
    id: 'terrain',
    kind: doc.biome,
    shape: { type: 'rect', rect: { x: 0, y: 0, w: doc.bounds.w, h: doc.bounds.h }, polygon: rectPolygon(0, 0, doc.bounds.w, doc.bounds.h) },
  });
  // trilhas (referência para IA/narrativa e reforço visual no jogo)
  for (const t of doc.trails) {
    floors.push({
      id: t.id,
      kind: 'trail',
      shape: { type: 'capsule', width: t.width, path: t.path, polygon: capsuleOutline(t.path, t.width, 0.6) },
    });
  }
  // corpos d'água: areas com kind 'water' — o jogo trata como bloqueio
  for (const w of doc.waters) {
    floors.push({ id: w.id, kind: 'water', shape: { type: 'rect', rect: boundsOf(w.polygon), polygon: w.polygon } });
  }
  for (const f of doc.fields) {
    floors.push({ id: f.id, kind: 'field', shape: { type: 'rect', rect: f.rect, polygon: rectPolygon(f.rect.x, f.rect.y, f.rect.w, f.rect.h) } });
  }

  // escarpas → paredes (segmentos de ~2 m ao longo da polilinha)
  const walls: GameMapData['layers']['walls'] = [];
  let wallSeq = 0;
  for (const c of doc.cliffs) {
    for (let i = 0; i < c.path.length - 1; i++) {
      const a = c.path[i], b = c.path[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const segs = Math.max(1, Math.ceil(len / 2.2));
      for (let j = 0; j < segs; j++) {
        const t0 = j / segs, t1 = (j + 1) / segs;
        walls.push({
          id: `wc${wallSeq++}`,
          roomId: null,
          side: null,
          a: { x: a.x + (b.x - a.x) * t0, y: a.y + (b.y - a.y) * t0 },
          b: { x: a.x + (b.x - a.x) * t1, y: a.y + (b.y - a.y) * t1 },
          thickness: c.height,
          gaps: [],
        });
      }
    }
  }

  // adereços
  const objects: GameObject[] = doc.props.map((p) => {
    const rotated = p.rot % 2 === 1;
    const fw = rotated ? p.h : p.w;
    const fh = rotated ? p.w : p.h;
    return {
      id: p.id,
      type: p.type,
      category: CATEGORY[p.type] ?? 'furniture',
      blocksMovement: BLOCKS[p.type] ?? true,
      pos: { ...p.pos },
      rot: p.rot,
      footprint: { x: p.pos.x - fw / 2, y: p.pos.y - fh / 2, w: fw, h: fh },
      variant: p.variant,
      roomId: 'terrain',
    };
  });

  // marcadores
  const markers: GameMarker[] = [
    { id: 'm-spawn', type: 'spawn', pos: { ...doc.spawn }, roomId: 'terrain' },
    ...doc.pois.map((p) => ({
      id: p.id, type: 'poi' as const, pos: { ...p.pos }, roomId: 'terrain', label: p.label,
    })),
    ...doc.exits.map((e, i) => ({
      id: `m-exit${i}`, type: 'exit' as const, pos: { ...e }, roomId: 'terrain',
    })),
  ];
  // entrada de mina: saída com transição via objeto (leva à dungeon interior)
  const entrance = doc.props.find((p) => p.type === 'entrance');
  if (entrance) {
    markers.push({
      id: 'm-entrance', type: 'exit', pos: { ...entrance.pos }, roomId: 'terrain',
      viaObjectId: entrance.id,
    });
  }

  return {
    format: 'mesa-estelar-map',
    version: GAME_EXPORT_VERSION,
    seed: doc.seed,
    styleId: doc.styleId,
    mapType: 'wild',
    bounds: { ...doc.bounds },
    wallThickness: 0.6,
    units: 'meters',
    layers: {
      floor: floors, walls, doors: [], objects, markers,
      ...(actors && actors.length ? { actors } : {}),
    },
    links: [],
  };
}

function boundsOf(poly: Vec[]): { x: number; y: number; w: number; h: number } {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export function exportWildGameDataJson(doc: WildDoc, actors?: import('../npc/actors').GameActor[]): string {
  return JSON.stringify(exportWildGameData(doc, actors), null, 2);
}
