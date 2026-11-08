/**
 * Exportação semântica em camadas para integração com o motor de jogo
 * (Mesa Estelar). Derivada puramente do MapDocument — não altera o gerador
 * nem o documento-fonte.
 *
 * Estrutura entregue ao jogo:
 *   layers.floor    — áreas transitáveis (polígonos/polilinhas em metros)
 *   layers.walls    — segmentos de parede com vãos de porta (gaps)
 *   layers.doors    — portas com posição, tipo e conectividade
 *   layers.objects  — objetos com tipo semântico, pegada e categoria
 *   layers.markers  — spawn (entrada) e saídas (escadas, docas)
 *   links           — grafo de conectividade sala ↔ sala via portas
 *
 * Convenção de coordenadas: metros, origem no canto superior esquerdo,
 * eixo y para baixo (igual ao MapDocument).
 */

import {
  distToPath, doorPos, pointInRect, propFootprint,
  sideDir, sideLength, sideOrigin,
} from './types';
import type { MapDocument, Rect, Room, Vec } from './types';

export const GAME_EXPORT_VERSION = 1;

// ---------- tipos do export ----------

export type FloorShape =
  | { type: 'rect'; rect: Rect; polygon: Vec[] }
  | { type: 'capsule'; width: number; path: Vec[]; polygon: Vec[] };

export interface GameFloorArea {
  id: string;
  kind: string;
  label?: string;
  /** detalhe sensorial/narrativo da área (dungeon), quando gerado */
  detail?: string;
  shape: FloorShape;
  /**
   * para corredores: extremidade aberta para fora do mapa.
   * Corredores-cápsula cujo fromDoorId/toDoorId é null terminam em
   * doca/bulkhead — é por onde personagens entram ou saem do mapa.
   */
  openEnd?: 'start' | 'far' | 'both';
}

export interface GameWallGap {
  doorId: string;
  /** distância ao longo do segmento, a partir de a */
  offset: number;
  width: number;
}

export interface GameWallSegment {
  id: string;
  /** sala dona da parede; null = parede livre (extraWalls) */
  roomId: string | null;
  side: 'n' | 's' | 'e' | 'w' | null;
  a: Vec;
  b: Vec;
  thickness: number;
  gaps: GameWallGap[];
}

export interface GameDoor {
  id: string;
  roomId: string;
  type: string;
  width: number;
  /** centro da abertura, em metros */
  pos: Vec;
  /** normal unitária apontando para fora da sala dona */
  outward: Vec;
  /** piso do outro lado da porta (sala ou corredor); null se abre para fora do mapa */
  otherRoomId: string | null;
}

export type ObjectCategory = 'furniture' | 'light' | 'stairs' | 'decor' | 'building' | 'vegetation';

export interface GameObject {
  id: string;
  type: string;
  category: ObjectCategory;
  /** true = bloqueia movimento de personagens */
  blocksMovement: boolean;
  pos: Vec;
  /** rotação em quartos de volta */
  rot: 0 | 1 | 2 | 3;
  /** pegada efetiva já considerando a rotação */
  footprint: Rect;
  variant: number;
  /** sala/corredor que contém o objeto */
  roomId: string | null;
  /** função semântica no mundo (ex.: 'Taverna' para um prédio de cidade) */
  usage?: string;
  /** nome próprio do estabelecimento/objeto */
  name?: string;
}

export interface GameMarker {
  id: string;
  type: 'spawn' | 'exit' | 'poi';
  pos: Vec;
  roomId: string;
  /** objeto pelo qual se sai (ex.: escada), quando houver */
  viaObjectId?: string;
  /** nome do ponto de interesse (type 'poi') */
  label?: string;
}

export interface GameLink {
  doorId: string;
  a: string;
  b: string | null;
}

export interface GameMapData {
  format: 'mesa-estelar-map';
  version: number;
  seed: number;
  styleId: string;
  mapType: string;
  bounds: { w: number; h: number };
  wallThickness: number;
  units: 'meters';
  layers: {
    floor: GameFloorArea[];
    walls: GameWallSegment[];
    doors: GameDoor[];
    objects: GameObject[];
    markers: GameMarker[];
    /** atores vivos (NPCs/criaturas) posicionados no mapa — opcional */
    actors?: import('./npc/actors').GameActor[];
  };
  links: GameLink[];
}

// ---------- helpers ----------

/** amostra uma polilinha com passo regular (inclui o ponto final) */
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

/**
 * Contorno fechado (polígono) de uma cápsula de corredor: desloca o eixo
 * para os dois lados com normais médias e concatena esquerda + direita
 * invertida. A borda do polígono é, para o jogo, a parede do corredor.
 */
export function capsuleOutline(path: Vec[], width: number, step = 0.5): Vec[] {
  const pts = samplePath(path, step);
  const half = width / 2;
  const left: Vec[] = [];
  const right: Vec[] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    let dx = next.x - prev.x;
    let dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const nx = -dy, ny = dx;
    left.push({ x: pts[i].x + nx * half, y: pts[i].y + ny * half });
    right.push({ x: pts[i].x - nx * half, y: pts[i].y - ny * half });
  }
  return [...left, ...right.reverse()];
}

function rectPolygon(r: Rect): Vec[] {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ];
}

function pointInRoom(p: Vec, room: Room, inset = 0): boolean {
  if (room.rect) return pointInRect(p, room.rect, inset);
  if (room.capsule) return distToPath(p, room.capsule.path) <= room.capsule.width / 2 - inset;
  return false;
}

const OBJECT_CATEGORY: Record<string, ObjectCategory> = {
  floorLamp: 'light',
  brazier: 'light',
  stairsDown: 'stairs',
  pipeRun: 'decor',
  vent: 'decor',
  banner: 'decor',
  rubble: 'decor',
};

// ---------- export principal ----------

export function exportGameData(doc: MapDocument, actors?: import('./npc/actors').GameActor[]): GameMapData {
  const roomById = new Map(doc.rooms.map((r) => [r.id, r]));

  // ---- camada floor ----
  const floor: GameFloorArea[] = doc.rooms.map((room) => {
    if (room.rect) {
      return {
        id: room.id, kind: room.kind, label: room.label, detail: room.detail,
        shape: { type: 'rect', rect: room.rect, polygon: rectPolygon(room.rect) },
      };
    }
    const cap = room.capsule!;
    const openEnd =
      cap.fromDoorId === null && cap.toDoorId === null ? 'both'
        : cap.fromDoorId === null ? 'start'
          : cap.toDoorId === null ? 'far'
            : undefined;
    return {
      id: room.id, kind: room.kind, label: room.label, detail: room.detail,
      ...(openEnd ? { openEnd } : {}),
      shape: {
        type: 'capsule', width: cap.width, path: cap.path,
        polygon: capsuleOutline(cap.path, cap.width),
      },
    };
  });

  // ---- camada walls: um segmento por lado de cada sala retangular ----
  // (paredes de corredores são implícitas na borda do polígono de piso)
  const walls: GameWallSegment[] = [];
  for (const room of doc.rooms) {
    if (!room.rect) continue;
    for (const side of ['n', 's', 'e', 'w'] as const) {
      const o = sideOrigin(room.rect, side);
      const d = sideDir(side);
      const len = sideLength(room.rect, side);
      const gaps = doc.doors
        .filter((door) => door.roomId === room.id && door.side === side)
        .map((door) => ({ doorId: door.id, offset: door.offset, width: door.width }))
        .sort((a, b) => a.offset - b.offset);
      walls.push({
        id: `${room.id}:${side}`,
        roomId: room.id,
        side,
        a: o,
        b: { x: o.x + d.x * len, y: o.y + d.y * len },
        thickness: doc.wallThickness,
        gaps,
      });
    }
  }
  for (const w of doc.extraWalls) {
    walls.push({
      id: w.id, roomId: null, side: null, a: w.a, b: w.b,
      thickness: doc.wallThickness, gaps: [],
    });
  }

  // ---- camada doors + conectividade ----
  const doors: GameDoor[] = [];
  const links: GameLink[] = [];
  for (const door of doc.doors) {
    const room = roomById.get(door.roomId);
    if (!room) continue;
    const pos = doorPos(door, room);
    // piso do outro lado: caminha na normal até achar uma sala/corredor
    let otherRoomId: string | null = null;
    for (const probe of [0.6, 1.2, 2.0, 3.0, 4.5]) {
      const p = { x: pos.x + door.outward.x * probe, y: pos.y + door.outward.y * probe };
      const hit = doc.rooms.find((r) => r.id !== door.roomId && pointInRoom(p, r));
      if (hit) { otherRoomId = hit.id; break; }
    }
    doors.push({
      id: door.id, roomId: door.roomId, type: door.type, width: door.width,
      pos, outward: door.outward, otherRoomId,
    });
    links.push({ doorId: door.id, a: door.roomId, b: otherRoomId });
  }

  // ---- camada objects ----
  const objects: GameObject[] = doc.props.map((prop) => {
    const category = OBJECT_CATEGORY[prop.type] ?? 'furniture';
    const room = doc.rooms.find((r) => pointInRoom(prop.pos, r)) ?? null;
    return {
      id: prop.id,
      type: prop.type,
      category,
      blocksMovement: category !== 'light' && category !== 'decor',
      pos: prop.pos,
      rot: prop.rot,
      footprint: propFootprint(prop),
      variant: prop.variant,
      roomId: room?.id ?? null,
    };
  });

  // ---- camada markers ----
  const markers: GameMarker[] = [];
  const entry = doc.rooms.find((r) => r.kind === 'entry' && r.rect);
  if (entry) {
    markers.push({
      id: 'spawn', type: 'spawn',
      pos: { x: entry.rect!.x + entry.rect!.w / 2, y: entry.rect!.y + entry.rect!.h / 2 },
      roomId: entry.id,
    });
  }
  const exit = doc.rooms.find((r) => r.kind === 'exit' && r.rect);
  if (exit) {
    const stairs = doc.props.find(
      (p) => p.type === 'stairsDown' && pointInRect(p.pos, exit.rect!, 0.5),
    );
    markers.push({
      id: 'exit', type: 'exit',
      pos: stairs ? stairs.pos
        : { x: exit.rect!.x + exit.rect!.w / 2, y: exit.rect!.y + exit.rect!.h / 2 },
      roomId: exit.id,
      viaObjectId: stairs?.id,
    });
  }

  return {
    format: 'mesa-estelar-map',
    version: GAME_EXPORT_VERSION,
    seed: doc.seed,
    styleId: doc.styleId,
    mapType: doc.mapType,
    bounds: doc.bounds,
    wallThickness: doc.wallThickness,
    units: 'meters',
    layers: {
      floor, walls, doors, objects, markers,
      ...(actors && actors.length ? { actors } : {}),
    },
    links,
  };
}

export function serializeGameData(data: GameMapData): string {
  return JSON.stringify(data, null, 2);
}

/** convenience: serializa direto a partir do documento */
export function exportGameDataJson(doc: MapDocument, actors?: import('./npc/actors').GameActor[]): string {
  return serializeGameData(exportGameData(doc, actors));
}

/** type-guard mínimo para reimportação/validação externa */
export function isGameMapData(data: unknown): data is GameMapData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return d.format === 'mesa-estelar-map' &&
    typeof d.version === 'number' &&
    typeof d.seed === 'number' &&
    typeof d.bounds === 'object' && d.bounds !== null &&
    typeof d.layers === 'object' && d.layers !== null;
}
