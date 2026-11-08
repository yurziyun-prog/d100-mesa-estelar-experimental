/**
 * Renderizador artístico em camadas.
 *
 * Ordem de composição:
 *  1. espaço (estrelas/nebulosas)   5. oclusão ambiental (offscreen)
 *  2. convés (casco da estação)     6. paredes (aço, chanfro, cintas de luz)
 *  3. pisos texturizados            7. vãos de porta + portas + caps
 *  4. decalques (rótulos, guiias)   8. props → brilho emissivo → escuridão+luzes
 *                                   9. atmosfera (vinheta, scanlines, grão)
 */

import { RNG, hashSeed } from '../rng';
import { doorPos, sideDir, sideLength, sideOrigin } from '../types';
import type { Door, MapDocument, Rect, Room, Vec } from '../types';
import type { CanvasFactory, TileOpts } from './textures';
import { getStyle } from '../styles';
import type { SpriteEnv } from './sprites';
import { getTextureTile } from './texturelib';
import { DUNGEON_SPRITES, tryPaintSprite } from './spritemap';

/** textura de piso (Mesa Estelar) por estilo — foto dominante + color-grade
 *  procedural do próprio piso da sala, como nos exteriores */
const FLOOR_TEX: Record<string, string> = {
  retrofuturista: 'metal',
  futurista: 'metal',
  medieval: 'pedra',
  hiboriano: 'pedra',
  hibrido: 'pedra',
};
const FLOOR_TEX_ALPHA = 0.8;
const FLOOR_GRADE_ALPHA = 0.35;
const FLOOR_TEX_M = 8;

export interface RenderEnv {
  createCanvas: CanvasFactory;
}

export interface RenderOptions {
  pxPerMeter?: number;
  padding?: number; // metros ao redor do convés
  lighting?: number; // 0..1 (override)
  showLabels?: boolean;
}

const TILE_M = 4; // metros por tile de textura

// cache de tiles/atmosfera — essencial para re-renderizações interativas rápidas
const tileCache = new Map<string, HTMLCanvasElement>();
function cachedTile(
  key: string,
  make: () => HTMLCanvasElement,
): HTMLCanvasElement {
  let t = tileCache.get(key);
  if (!t) {
    t = make();
    if (tileCache.size > 60) tileCache.clear();
    tileCache.set(key, t);
  }
  return t;
}
const WEAR: Record<MapDocument['meta']['conservation'], number> = {
  novo: 0, usado: 1, abandonado: 2, arruinado: 3,
};

type Ctx = CanvasRenderingContext2D;

/** região poligonal de uma cápsula (corredor) — preenchível e clipável */
function capsulePolygon(path: Vec[], width: number, capSegs = 7): Vec[] {
  const half = width / 2;
  const pts: { p: Vec; tx: number; ty: number; d: number }[] = [];
  const step = 0.15;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const tx = (b.x - a.x) / len, ty = (b.y - a.y) / len;
    const n = Math.max(1, Math.ceil(len / step));
    for (let j = 0; j < n; j++) {
      const t = j / n;
      pts.push({ p: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, tx, ty, d: (i + t) * len });
    }
  }
  const last = path[path.length - 1];
  const pl = path[path.length - 2];
  const ltx = last.x - pl.x, lty = last.y - pl.y;
  const llen = Math.hypot(ltx, lty);
  pts.push({ p: { ...last }, tx: ltx / llen, ty: lty / llen, d: Infinity });

  const left: Vec[] = [];
  const right: Vec[] = [];
  for (const s of pts) {
    const nx = -s.ty, ny = s.tx;
    left.push({ x: s.p.x + nx * half, y: s.p.y + ny * half });
    right.push({ x: s.p.x - nx * half, y: s.p.y - ny * half });
  }
  // tampas semicirculares nas extremidades
  const cap = (center: Vec, tangent: Vec, side: 1 | -1): Vec[] => {
    const nx = -tangent.y, ny = tangent.x;
    const out: Vec[] = [];
    const baseAng = Math.atan2(ny * side, nx * side);
    for (let i = 0; i <= capSegs; i++) {
      const a = baseAng + (i / capSegs) * Math.PI;
      out.push({ x: center.x + Math.cos(a) * half, y: center.y + Math.sin(a) * half });
    }
    return out;
  };
  const first = pts[0];
  const lastP = pts[pts.length - 1];
  return [
    ...cap(first.p, { x: first.tx, y: first.ty }, 1),
    ...left,
    ...cap(lastP.p, { x: lastP.tx, y: lastP.ty }, -1).reverse(),
    ...right.reverse(),
  ];
}

function tracePolygon(x: Ctx, poly: Vec[]): void {
  x.beginPath();
  x.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) x.lineTo(poly[i].x, poly[i].y);
  x.closePath();
}

function roundedRectPath(x: Ctx, r: Rect, rad: number): void {
  x.beginPath();
  x.moveTo(r.x + rad, r.y);
  x.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rad);
  x.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rad);
  x.arcTo(r.x, r.y + r.h, r.x, r.y, rad);
  x.arcTo(r.x, r.y, r.x + r.w, r.y, rad);
  x.closePath();
}

export function renderMap(doc: MapDocument, env: RenderEnv, opts: RenderOptions = {}): HTMLCanvasElement {
  const s = opts.pxPerMeter ?? 28;
  const pad = opts.padding ?? 3;
  const W = doc.bounds.w + pad * 2;
  const H = doc.bounds.h + pad * 2;
  const canvas = env.createCanvas(Math.round(W * s), Math.round(H * s));
  const x = canvas.getContext('2d') as Ctx;
  const wear = WEAR[doc.meta.conservation];
  const lighting = opts.lighting ?? doc.meta.lighting;
  const style = getStyle(doc.styleId);

  // transform base: mundo (metros, origem no canto do convés) → tela
  x.setTransform(s, 0, 0, s, pad * s, pad * s);

  const tilePx = Math.round(TILE_M * s);
  const tileOpts: TileOpts = { px: tilePx, tileM: TILE_M, seed: doc.seed, wear };
  const pattern = (tile: HTMLCanvasElement): CanvasPattern | string => {
    try {
      return x.createPattern(tile, 'repeat') ?? '#333';
    } catch {
      return '#333';
    }
  };
  const tileKey = (kind: string) => `${kind}:${tilePx}:${doc.seed}:${wear}`;

  // ===== 1. fundo (estilo) =====
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  style.paintBackground(x, canvas.width, canvas.height, doc.seed);
  x.restore();

  // ===== 2. convés =====
  const deck: Rect = { x: 0, y: 0, w: doc.bounds.w, h: doc.bounds.h };
  roundedRectPath(x, deck, 1.4);
  x.save();
  x.shadowColor = style.doorGlow.color.includes('224') ? 'rgba(46,224,200,0.5)' : 'rgba(255,170,80,0.35)';
  x.shadowBlur = 0.5 * s;
  x.fillStyle = pattern(cachedTile(tileKey('hull'), () => style.hull(env.createCanvas, tileOpts)));
  x.fill();
  x.restore();
  x.strokeStyle = 'rgba(140,170,200,0.18)';
  x.lineWidth = 0.06;
  x.stroke();

  const rectRooms = doc.rooms.filter((r) => r.rect);
  const corridors = doc.rooms.filter((r) => r.capsule);

  // ===== 3. pisos =====
  const mkTile = (kind: string, fn: () => HTMLCanvasElement) =>
    cachedTile(tileKey(kind), fn);
  const floorTiles: Record<string, CanvasPattern | string> = {};
  for (const [key, painter] of Object.entries(style.floors)) {
    floorTiles[key] = pattern(mkTile(`floor:${key}`, () => painter(env.createCanvas, tileOpts)));
  }
  const floorOf = (room: Room): CanvasPattern | string =>
    floorTiles[room.floorStyle] ?? floorTiles[style.defaultFloor];

  // tile de textura fotográfica do piso (null = fallback procedural)
  const floorTexKey = FLOOR_TEX[style.id];
  const floorTexTile = floorTexKey
    ? getTextureTile(floorTexKey, Math.round(FLOOR_TEX_M * s), env.createCanvas)
    : null;
  /** foto da Mesa Estelar dominante + color-grade com o piso procedural da sala */
  const paintFloor = (room: Room, fill: () => void): void => {
    x.fillStyle = floorOf(room);
    fill();
    if (floorTexTile) {
      x.globalAlpha = FLOOR_TEX_ALPHA;
      x.fillStyle = pattern(floorTexTile);
      fill();
      x.globalAlpha = FLOOR_GRADE_ALPHA;
      x.fillStyle = floorOf(room);
      fill();
      x.globalAlpha = 1;
    }
  };

  for (const room of rectRooms) {
    const r = room.rect!;
    paintFloor(room, () => x.fillRect(r.x, r.y, r.w, r.h));
    // tinta sutil por sala — quebra a monotonia de grandes áreas iguais
    const tintRng = new RNG(hashSeed(room.id) ^ 0x7f4a7c15);
    const tint = style.floorTint(room, tintRng);
    if (tint) {
      x.fillStyle = tint;
      x.fillRect(r.x, r.y, r.w, r.h);
    }
    // borda interna sutil
    x.strokeStyle = 'rgba(0,0,0,0.35)';
    x.lineWidth = 0.045;
    x.strokeRect(r.x + 0.02, r.y + 0.02, r.w - 0.04, r.h - 0.04);
  }
  for (const room of corridors) {
    const cap = room.capsule!;
    const poly = capsulePolygon(cap.path, cap.width);
    tracePolygon(x, poly);
    paintFloor(room, () => x.fill());
  }

  // ===== 4. decalques =====
  if (opts.showLabels !== false) {
    for (const room of rectRooms) {
      if (!room.label) continue;
      const r = room.rect!;
      x.save();
      x.font = style.labelStyle.font(Math.max(0.5, Math.min(0.75, r.w / 14)));
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillStyle = style.labelStyle.color;
      // espaçamento entre letras
      const chars = room.label.split('');
      const widths = chars.map((ch) => x.measureText(ch).width + 0.14);
      const total = widths.reduce((a, b) => a + b, 0) - 0.14;
      let cx = r.x + r.w / 2 - total / 2;
      const cy = r.y + r.h / 2;
      chars.forEach((ch, i) => {
        x.fillText(ch, cx + widths[i] / 2, cy);
        cx += widths[i];
      });
      // código do setor abaixo
      x.font = style.labelStyle.font(Math.max(0.3, Math.min(0.42, r.w / 22))).replace('bold ', '');
      x.fillStyle = style.labelStyle.codeColor;
      x.fillText(style.labelStyle.code(room), r.x + r.w / 2, cy + 0.62);
      x.restore();
    }
  }

  // ===== 5. oclusão ambiental (offscreen) =====
  const aoCanvas = env.createCanvas(canvas.width, canvas.height);
  const ax = aoCanvas.getContext('2d') as Ctx;
  ax.setTransform(s, 0, 0, s, pad * s, pad * s);
  ax.save();
  ax.shadowColor = 'rgba(0,0,0,0.45)';
  ax.shadowBlur = 0.22 * s;
  ax.shadowOffsetX = 0.06 * s;
  ax.shadowOffsetY = 0.1 * s;
  ax.fillStyle = '#000';
  const t = doc.wallThickness;
  for (const room of rectRooms) {
    roundedRectPath(ax, room.rect!, 0.1);
    ax.fill();
  }
  for (const room of corridors) {
    tracePolygon(ax, capsulePolygon(room.capsule!.path, room.capsule!.width + t * 2));
    ax.fill();
  }
  ax.restore();
  // remove o preenchimento sólido, mantendo só a sombra derramada sobre o piso
  ax.globalCompositeOperation = 'destination-out';
  for (const room of rectRooms) {
    ax.fillRect(room.rect!.x, room.rect!.y, room.rect!.w, room.rect!.h);
  }
  for (const room of corridors) {
    tracePolygon(ax, capsulePolygon(room.capsule!.path, room.capsule!.width));
    ax.fill();
  }
  ax.globalCompositeOperation = 'source-over';
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.drawImage(aoCanvas, 0, 0);
  x.restore();

  // ===== 6. paredes =====
  const wallTile = pattern(cachedTile(`${tileKey('wall')}:w5`, () => style.wall(env.createCanvas, { ...tileOpts, seed: doc.seed + 5, wear })));
  // salas: faixa entre rect expandido e o próprio rect
  for (const room of rectRooms) {
    const r = room.rect!;
    const outer: Rect = { x: r.x - t, y: r.y - t, w: r.w + t * 2, h: r.h + t * 2 };
    x.fillStyle = wallTile;
    roundedRectPath(x, outer, 0.16);
    x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.4)';
    x.lineWidth = 0.035;
    x.stroke();
  }
  // corredores: cápsula expandida
  for (const room of corridors) {
    const cap = room.capsule!;
    tracePolygon(x, capsulePolygon(cap.path, cap.width + t * 2));
    x.fillStyle = wallTile;
    x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.4)';
    x.lineWidth = 0.035;
    x.stroke();
  }
  // re-pinta os pisos por cima das faixas internas (limpa o excesso)
  for (const room of rectRooms) {
    const r = room.rect!;
    x.fillStyle = floorOf(room);
    x.fillRect(r.x - 0.02, r.y - 0.02, r.w + 0.04, r.h + 0.04);
  }
  for (const room of corridors) {
    const cap = room.capsule!;
    tracePolygon(x, capsulePolygon(cap.path, cap.width));
    x.fillStyle = floorOf(room);
    x.fill();
  }

  // detalhe arquitetônico das paredes das salas (por trecho livre, conforme estilo)
  const lightRng = new RNG(doc.seed ^ 0x51ab3);
  for (const room of rectRooms) {
    const r = room.rect!;
    const sides: ('n' | 's' | 'e' | 'w')[] = ['n', 's', 'e', 'w'];
    for (const side of sides) {
      const o = sideOrigin(r, side);
      const d = sideDir(side);
      const len = sideLength(r, side);
      const doorGaps = doc.doors
        .filter((dd) => dd.roomId === room.id && dd.side === side)
        .map((dd) => ({ c: dd.offset, hw: dd.width / 2 + 0.14 }));

      // subdivide o lado em trechos livres de porta
      const cuts = [0, ...doorGaps.flatMap((g) => [g.c - g.hw, g.c + g.hw]).sort((a, b) => a - b), len];
      for (let ci = 0; ci < cuts.length - 1; ci++) {
        const a0 = cuts[ci], a1 = cuts[ci + 1];
        if (a1 - a0 < 0.3) continue;
        const inW = { x: -d.y, y: d.x }; // para dentro da parede
        style.paintWallTrim(x, { o, d, a0, a1, inW, t }, wear, lightRng);
      }
    }
  }

  // paredes extras (desenhadas pelo editor)
  for (const wall of doc.extraWalls) {
    style.paintExtraWall(x, wall.a, wall.b, t);
  }

  // ===== 7. vãos de porta + portas + caps =====
  const roomById = new Map(doc.rooms.map((r) => [r.id, r]));
  const doorAt = (door: Door): { pos: Vec; horizontal: boolean } => {
    const room = roomById.get(door.roomId)!;
    const pos = doorPos(door, room);
    return { pos, horizontal: door.side === 'n' || door.side === 's' };
  };

  x.save();
  x.globalCompositeOperation = 'destination-out';
  for (const door of doc.doors) {
    const { pos, horizontal } = doorAt(door);
    x.save();
    x.translate(pos.x, pos.y);
    if (!horizontal) x.rotate(Math.PI / 2);
    const gw = door.width + 0.24;
    const gh = t * 2 + 0.28;
    x.beginPath();
    x.roundRect?.(-gw / 2, -gh / 2, gw, gh, 0.08);
    if (!x.roundRect) {
      x.rect(-gw / 2, -gh / 2, gw, gh);
    }
    x.fill();
    x.restore();
  }
  x.restore();

  for (const door of doc.doors) {
    const { pos, horizontal } = doorAt(door);
    x.save();
    x.translate(pos.x, pos.y);
    if (!horizontal) x.rotate(Math.PI / 2);
    style.paintDoor(x, { type: door.type, width: door.width, t });
    x.restore();
  }

  // caps de corredores sem porta (dock/bulkhead)
  for (const room of corridors) {
    const cap = room.capsule!;
    const ends: { p: Vec; tangent: Vec; isStart: boolean }[] = [];
    if (!cap.fromDoorId) {
      const p0 = cap.path[0], p1 = cap.path[1];
      const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      ends.push({ p: p0, tangent: { x: -(p1.x - p0.x) / len, y: -(p1.y - p0.y) / len }, isStart: true });
    }
    if (!cap.toDoorId) {
      const n = cap.path.length;
      const p0 = cap.path[n - 1], p1 = cap.path[n - 2];
      const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      ends.push({ p: p0, tangent: { x: -(p1.x - p0.x) / len, y: -(p1.y - p0.y) / len }, isStart: false });
    }
    for (const e of ends) {
      x.save();
      x.translate(e.p.x, e.p.y);
      x.rotate(Math.atan2(e.tangent.y, e.tangent.x) + Math.PI / 2);
      style.paintCorridorCap(x, room.label === 'dock' ? 'dock' : 'bulkhead', cap.width);
      x.restore();
    }
  }

  // ===== 8. props =====
  const sorted = [...doc.props].sort((a, b) => a.pos.y - b.pos.y);
  const lights: { p: Vec; r: number; strength: number }[] = [];
  const emissives: { p: Vec; r: number; alpha: number; color: string }[] = [];
  const LIGHT_BY_TYPE = style.propLight;
  const GLOW_BY_TYPE = style.propGlow;

  for (const prop of sorted) {
    const painter = style.propPainters[prop.type];
    if (!painter) continue;
    // sombra projetada
    x.save();
    x.translate(prop.pos.x + 0.07, prop.pos.y + 0.12);
    x.scale(1, 0.82);
    x.shadowColor = 'rgba(0,0,0,0.55)';
    x.shadowBlur = 0.09 * s;
    x.fillStyle = 'rgba(0,0,0,0.4)';
    x.beginPath();
    x.ellipse(0, 0, prop.w * 0.52, prop.h * 0.52, 0, 0, Math.PI * 2);
    x.fill();
    x.restore();
    // sprite (peça da Mesa Estelar quando mapeada; senão painter procedural)
    x.save();
    x.translate(prop.pos.x, prop.pos.y);
    x.rotate((prop.rot * Math.PI) / 2);
    if (!tryPaintSprite(x, DUNGEON_SPRITES, style.id, prop.type, prop.variant, prop.w, prop.h)) {
      const env: SpriteEnv = {
        rng: new RNG(hashSeed(prop.id)),
        variant: prop.variant,
        wear,
      };
      painter(x, prop.w, prop.h, env);
    }
    x.restore();
    const li = LIGHT_BY_TYPE[prop.type];
    if (li) lights.push({ p: prop.pos, r: li.r, strength: li.strength });
    const gl = GLOW_BY_TYPE[prop.type];
    if (gl) emissives.push({ p: prop.pos, r: gl.r, alpha: gl.alpha, color: gl.color });
  }
  // portas também emitem pouca luz
  for (const door of doc.doors) {
    const { pos } = doorAt(door);
    lights.push({ p: pos, r: style.doorLight.r, strength: style.doorLight.strength });
    emissives.push({ p: pos, r: style.doorGlow.r, alpha: style.doorGlow.alpha, color: style.doorGlow.color });
  }

  // brilho emissivo aditivo
  x.save();
  x.globalCompositeOperation = 'lighter';
  for (const e of emissives) {
    const g = x.createRadialGradient(e.p.x, e.p.y, 0, e.p.x, e.p.y, e.r);
    g.addColorStop(0, `rgba(${e.color},${e.alpha})`);
    g.addColorStop(1, `rgba(${e.color},0)`);
    x.fillStyle = g;
    x.beginPath();
    x.arc(e.p.x, e.p.y, e.r, 0, Math.PI * 2);
    x.fill();
  }
  x.restore();

  // escuridão ambiente furada pelas luzes — em canvas OFFSCREEN para não
  // apagar o mapa (destination-out atinge só a camada de escuridão)
  const darkCanvas = env.createCanvas(canvas.width, canvas.height);
  const dx2 = darkCanvas.getContext('2d') as Ctx;
  const dark = dx2.createLinearGradient(0, 0, canvas.width, canvas.height);
  const dk = 0.12 + 0.3 * (1 - lighting);
  dark.addColorStop(0, `rgba(${style.darknessColor},${dk})`);
  dark.addColorStop(1, `rgba(${style.darknessColor},${dk + 0.06})`);
  dx2.fillStyle = dark;
  dx2.fillRect(0, 0, canvas.width, canvas.height);
  dx2.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const lx = (l.p.x + pad) * s;
    const ly = (l.p.y + pad) * s;
    const lr = l.r * s;
    const g = dx2.createRadialGradient(lx, ly, 0, lx, ly, lr);
    g.addColorStop(0, `rgba(255,255,255,${l.strength})`);
    g.addColorStop(0.55, `rgba(255,255,255,${l.strength * 0.3})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    dx2.fillStyle = g;
    dx2.beginPath();
    dx2.arc(lx, ly, lr, 0, Math.PI * 2);
    dx2.fill();
  }
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.drawImage(darkCanvas, 0, 0);
  x.restore();

  // ===== 9. atmosfera =====
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 0.85;
  x.drawImage(cachedTile(`atm:${style.id}:${canvas.width}x${canvas.height}:${doc.seed}`, () => style.atmosphere(env.createCanvas, canvas.width, canvas.height, doc.seed)), 0, 0);
  x.restore();

  return canvas;
}
