/**
 * Exportação semântica em camadas da CIDADE para o motor de jogo
 * (formato "mesa-estelar-map", compatível com o export da dungeon):
 *   layers.floor    — ruas (polígonos de cápsula), praças e parques
 *   layers.walls    — perímetro de cada prédio, com vão de porta (gap)
 *   layers.doors    — porta de cada prédio, voltada à rua
 *   layers.objects  — prédios (building), árvores (vegetation), postes
 *                     (light), mobiliário urbano (furniture)
 *   layers.markers  — spawn (praça principal) e exits (portões da cidade)
 *   links           — prédio ↔ rua via porta
 */

import { capsuleOutline } from '../gamedata';
import type {
  GameDoor, GameLink, GameMapData, GameMarker, GameObject, GameWallSegment,
} from '../gamedata';
import { getCityTheme } from './themes';
import type { CityDoc, CityBuilding, Vec } from './types';
import type { Rect } from '../types';

const WALL_T = 0.35;

interface SideDef { a: Vec; b: Vec; side: 'n' | 's' | 'e' | 'w'; }

function buildingSides(r: Rect): SideDef[] {
  return [
    { a: { x: r.x, y: r.y }, b: { x: r.x + r.w, y: r.y }, side: 'n' },
    { a: { x: r.x + r.w, y: r.y }, b: { x: r.x + r.w, y: r.y + r.h }, side: 'e' },
    { a: { x: r.x, y: r.y + r.h }, b: { x: r.x + r.w, y: r.y + r.h }, side: 's' },
    { a: { x: r.x, y: r.y }, b: { x: r.x, y: r.y + r.h }, side: 'w' },
  ];
}

function rectPolygon(r: Rect): Vec[] {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ];
}

/** distância de um ponto a um segmento */
function distToSeg(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** rua mais próxima de um ponto (para links e roomId das portas) */
function nearestStreetId(doc: CityDoc, p: Vec): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const st of doc.streets) {
    for (let i = 0; i < st.path.length - 1; i++) {
      const d = distToSeg(p, st.path[i], st.path[i + 1]) - st.width / 2;
      if (d < bestD) { bestD = d; best = st.id; }
    }
  }
  return best;
}

export function exportCityGameData(doc: CityDoc, actors?: import('../npc/actors').GameActor[]): GameMapData {
  const theme = getCityTheme(doc.styleId);
  const walls: GameWallSegment[] = [];
  const doors: GameDoor[] = [];
  const objects: GameObject[] = [];
  const links: GameLink[] = [];

  for (const b of doc.buildings) {
    const door = buildingDoor(b);
    const streetId = nearestStreetId(doc, door.pos);
    doors.push({
      id: `d-${b.id}`,
      roomId: b.id,
      type: theme.doorType,
      width: b.doorWidth,
      pos: door.pos,
      outward: door.outward,
      otherRoomId: streetId,
    });
    for (const s of buildingSides(b.rect)) {
      let gaps: GameWallSegment['gaps'] = [];
      if (s.side === b.facing) {
        const len = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
        const doorCenter = Math.hypot(door.pos.x - s.a.x, door.pos.y - s.a.y);
        gaps = [{ doorId: `d-${b.id}`, offset: Math.min(Math.max(doorCenter, 0.2), len - 0.2), width: b.doorWidth }];
      }
      walls.push({
        id: `w-${b.id}-${s.side}`,
        roomId: b.id,
        side: s.side,
        a: s.a, b: s.b,
        thickness: WALL_T,
        gaps,
      });
    }
    objects.push({
      id: b.id,
      type: 'building',
      category: 'building',
      blocksMovement: true,
      pos: { x: b.rect.x + b.rect.w / 2, y: b.rect.y + b.rect.h / 2 },
      rot: 0,
      footprint: { ...b.rect },
      variant: b.variant,
      roomId: b.id,
      usage: b.usage,
      name: b.name,
    });
    if (streetId) links.push({ doorId: `d-${b.id}`, a: b.id, b: streetId });
  }

  for (const p of doc.props) {
    objects.push({
      id: p.id,
      type: p.type,
      category: propCategory(p.type),
      blocksMovement: propBlocks(p.type),
      pos: p.pos,
      rot: p.rot,
      footprint: { x: p.pos.x - p.w / 2, y: p.pos.y - p.h / 2, w: p.w, h: p.h },
      variant: p.variant,
      roomId: nearestStreetId(doc, p.pos),
    });
  }

  const markers: GameMarker[] = [{
    id: 'm-spawn', type: 'spawn', pos: doc.spawn, roomId: doc.plazas[0]?.id ?? 'city',
  }];
  doc.exits.forEach((e, i) => {
    markers.push({ id: `m-exit-${i}`, type: 'exit', pos: e, roomId: 'city' });
  });

  return {
    format: 'mesa-estelar-map',
    version: 1,
    seed: doc.seed,
    styleId: doc.styleId,
    mapType: 'city',
    bounds: { ...doc.bounds },
    wallThickness: WALL_T,
    units: 'meters',
    layers: {
      floor: [
        ...doc.streets.map((st) => ({
          id: st.id,
          kind: 'street',
          shape: {
            type: 'capsule' as const,
            width: st.width,
            path: st.path,
            polygon: capsuleOutline(st.path, st.width, 0.6),
          },
          openEnd: st.gate === 'both' ? 'both' as const : st.gate === 'start' ? 'start' as const : st.gate === 'end' ? 'far' as const : undefined,
        })),
        ...doc.plazas.map((p) => ({
          id: p.id, kind: 'plaza', label: p.label,
          shape: { type: 'rect' as const, rect: p.rect, polygon: rectPolygon(p.rect) },
        })),
        ...doc.parks.map((p) => ({
          id: p.id, kind: 'park',
          shape: { type: 'rect' as const, rect: p.rect, polygon: rectPolygon(p.rect) },
        })),
      ],
      walls, doors, objects, markers,
      ...(actors && actors.length ? { actors } : {}),
    },
    links,
  };
}

export function exportCityGameDataJson(doc: CityDoc, actors?: import('../npc/actors').GameActor[]): string {
  return JSON.stringify(exportCityGameData(doc, actors), null, 2);
}

function propCategory(type: string): GameObject['category'] {
  if (type === 'tree' || type === 'hedge') return 'vegetation';
  if (type === 'lamp') return 'light';
  return 'furniture';
}

function propBlocks(type: string): boolean {
  return type === 'tree' || type === 'fountain' || type === 'statue' ||
    type === 'stall' || type === 'bench' || type === 'vehicle' || type === 'hedge';
}

function buildingDoor(b: CityBuilding): { pos: Vec; outward: Vec } {
  const r = b.rect;
  switch (b.facing) {
    case 's': return { pos: { x: r.x + r.w / 2, y: r.y + r.h }, outward: { x: 0, y: 1 } };
    case 'n': return { pos: { x: r.x + r.w / 2, y: r.y }, outward: { x: 0, y: -1 } };
    case 'e': return { pos: { x: r.x + r.w, y: r.y + r.h / 2 }, outward: { x: 1, y: 0 } };
    default: return { pos: { x: r.x, y: r.y + r.h / 2 }, outward: { x: -1, y: 0 } };
  }
}
