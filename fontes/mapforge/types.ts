/**
 * Modelo de dados do mapa — geometria em vetor, em METROS.
 * O documento é independente de estilo: o renderizador é que o "pinta".
 */

export interface Vec {
  x: number;
  y: number;
}

export interface Rect {
  x: number; // canto superior esquerdo
  y: number;
  w: number;
  h: number;
}

export type Side = 'n' | 's' | 'e' | 'w';

export type RoomKind =
  | 'entry'
  | 'exit'
  | 'hall'
  | 'lab'
  | 'utility'
  | 'storage'
  | 'quarters'
  | 'corridor';

export type DoorType = string;

export interface Door {
  id: string;
  roomId: string;
  side: Side;
  /** distância ao longo da parede, a partir do canto inicial do lado */
  offset: number;
  width: number;
  type: DoorType;
  /** normal unitária apontando para fora da sala */
  outward: Vec;
}

export interface CapsuleRoom {
  width: number;
  /** polilinha do eixo do corredor, em metros */
  path: Vec[];
  fromDoorId: string | null;
  toDoorId: string | null;
}

export interface Room {
  id: string;
  kind: RoomKind;
  /** chave de estilo de piso, resolvida pelo estilo ativo */
  floorStyle: string;
  label?: string;
  /** detalhe sensorial/narrativo da sala (cheiro, som, grafite…) — não renderizado */
  detail?: string;
  /** salas retangulares: rect definido, capsule ausente */
  rect?: Rect;
  /** corredores: capsule definido, rect ausente */
  capsule?: CapsuleRoom;
}

export interface Prop {
  id: string;
  /** chave do catálogo de props do estilo ativo */
  type: string;
  pos: Vec; // centro, metros
  /** rotação em quartos de volta (0=0°, 1=90°, 2=180°, 3=270°) */
  rot: 0 | 1 | 2 | 3;
  /** pegada (largura x profundidade) antes da rotação, metros */
  w: number;
  h: number;
  /** variação visual determinística derivada do id */
  variant: number;
}

export interface ExtraWall {
  id: string;
  a: Vec;
  b: Vec;
}

export interface MapMeta {
  complexity: number; // 0..1 → nº de salas
  density: number; // 0..1 → quantidade de props
  conservation: 'novo' | 'usado' | 'abandonado' | 'arruinado';
  lighting: number; // 0..1 → intensidade da escuridão ambiente
  prompt: string; // instruções em linguagem natural (reservado)
}

export interface MapDocument {
  version: 1;
  seed: number;
  styleId: string;
  mapType: 'dungeon';
  bounds: { w: number; h: number }; // metros
  wallThickness: number; // metros
  rooms: Room[];
  doors: Door[];
  props: Prop[];
  extraWalls: ExtraWall[];
  meta: MapMeta;
}

export const SIDES: Side[] = ['n', 's', 'e', 'w'];

/** comprimento de um lado do retângulo */
export function sideLength(rect: Rect, side: Side): number {
  return side === 'n' || side === 's' ? rect.w : rect.h;
}

/** posição mundial do início do lado (canto inicial, no sentido horário) */
export function sideOrigin(rect: Rect, side: Side): Vec {
  switch (side) {
    case 'n': return { x: rect.x, y: rect.y };
    case 's': return { x: rect.x + rect.w, y: rect.y + rect.h };
    case 'e': return { x: rect.x + rect.w, y: rect.y };
    case 'w': return { x: rect.x, y: rect.y + rect.h };
  }
}

/** direção unitária ao longo do lado, no sentido horário */
export function sideDir(side: Side): Vec {
  switch (side) {
    case 'n': return { x: 1, y: 0 };
    case 's': return { x: -1, y: 0 };
    case 'e': return { x: 0, y: 1 };
    case 'w': return { x: 0, y: -1 };
  }
}

/** normal unitária apontando para fora da sala */
export function sideOutward(side: Side): Vec {
  switch (side) {
    case 'n': return { x: 0, y: -1 };
    case 's': return { x: 0, y: 1 };
    case 'e': return { x: 1, y: 0 };
    case 'w': return { x: -1, y: 0 };
  }
}

/** posição mundial da porta (centro da abertura) */
export function doorPos(door: Door, room: Room): Vec {
  const rect = room.rect!;
  const o = sideOrigin(rect, door.side);
  const d = sideDir(door.side);
  return { x: o.x + d.x * door.offset, y: o.y + d.y * door.offset };
}

export function roomCenter(room: Room): Vec {
  if (room.rect) return { x: room.rect.x + room.rect.w / 2, y: room.rect.y + room.rect.h / 2 };
  const p = room.capsule!.path;
  return { x: (p[0].x + p[p.length - 1].x) / 2, y: (p[0].y + p[p.length - 1].y) / 2 };
}

/** pegada efetiva da prop considerando rotação em 90° */
export function propFootprint(prop: Prop): Rect {
  const swap = prop.rot % 2 === 1;
  const w = swap ? prop.h : prop.w;
  const h = swap ? prop.w : prop.h;
  return { x: prop.pos.x - w / 2, y: prop.pos.y - h / 2, w, h };
}

export function rectsOverlap(a: Rect, b: Rect, margin = 0): boolean {
  return (
    a.x - margin < b.x + b.w &&
    a.x + a.w + margin > b.x &&
    a.y - margin < b.y + b.h &&
    a.y + a.h + margin > b.y
  );
}

export function pointInRect(p: Vec, r: Rect, inset = 0): boolean {
  return p.x >= r.x + inset && p.x <= r.x + r.w - inset && p.y >= r.y + inset && p.y <= r.y + r.h - inset;
}

/** distância de ponto a segmento */
export function distToSegment(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = a.x + t * dx;
  const py = a.y + t * dy;
  return Math.hypot(p.x - px, p.y - py);
}

/** distância de ponto a polilinha */
export function distToPath(p: Vec, path: Vec[]): number {
  let d = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    d = Math.min(d, distToSegment(p, path[i], path[i + 1]));
  }
  return d;
}
