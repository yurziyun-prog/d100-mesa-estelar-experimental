/**
 * Renderizador artístico de EXTERIORES, em camadas:
 *  1. fundo (escuridão ao redor)       5. trilhas (terra batida)
 *  2. convés do mapa (grama base)      6. escarpas (face sombreada + topo)
 *  3. terreno da grade (rocha, areia,  7. adereços → emissivos
 *     plantação) + variação por célula 8. escuridão furada por luzes
 *  4. água (gradiente + ondas + praia) 9. atmosfera (do estilo visual)
 */

import { RNG, hashSeed } from '../rng';
import { getStyle } from '../styles';
import { capsuleOutline } from '../gamedata';
import type { Ctx, TileOpts } from '../render/textures';
import type { RenderEnv, RenderOptions } from '../render/renderer';
import type { SpriteEnv } from '../render/sprites';
import { getWildTheme } from './themes';
import type { WildDoc, Vec, Biome } from './types';
import { getTextureTile } from '../render/texturelib';
import { WILD_SPRITES, tryPaintSprite } from '../render/spritemap';

/** textura da Mesa Estelar por tipo de terreno e bioma. A foto entra como
 *  camada dominante e o tile procedural vira color-grade por cima — assim a
 *  paleta continua do tema, mas o detalhe vem da textura real. */
const TERRAIN_TEX: Record<Biome, Record<string, string>> = {
  floresta: { grass: 'grama', dirt: 'terra_batida', sand: 'areia', rock: 'rocha', field: 'palha' },
  penhasco: { grass: 'grama_seca', dirt: 'terra_rachada', sand: 'areia_deserto', rock: 'pedregulhos' },
  campo: { grass: 'grama', dirt: 'terra', sand: 'areia', rock: 'pedra', field: 'palha' },
  mina: { grass: 'terra_rachada', dirt: 'terra_rachada', sand: 'pedregulhos', rock: 'rocha' },
};
/** metros de mundo por repetição da textura */
const TEX_TILE_M = 8;
const TEX_ALPHA = 0.85;   // presença da foto
const GRADE_ALPHA = 0.32; // color-grade procedural por cima

const TILE_M = 4;

const tileCache = new Map<string, HTMLCanvasElement>();
function cachedTile(key: string, make: () => HTMLCanvasElement): HTMLCanvasElement {
  let t = tileCache.get(key);
  if (!t) {
    t = make();
    if (tileCache.size > 240) tileCache.clear();
    tileCache.set(key, t);
  }
  return t;
}

const WEAR: Record<WildDoc['conservation'], number> = {
  novo: 0, usado: 1, abandonado: 2, arruinado: 3,
};

/**
 * Normaliza uma cor css (hex, rgb ou rgba) para a tripla "r,g,b" usada nas
 * strings `rgba(${tripla},alfa)`. Evita `rgba(rgba(...),a)` inválido.
 */
function toTriplet(color: string): string {
  const m = color.match(/rgba?\(\s*([^)]+?)\s*\)/);
  if (m) return m[1].split(',').slice(0, 3).map((v) => v.trim()).join(',');
  if (color.startsWith('#')) {
    const h = color.slice(1);
    const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
    const n = parseInt(full, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }
  return color;
}

function tracePolygon(x: Ctx, poly: Vec[]): void {
  x.beginPath();
  x.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) x.lineTo(poly[i].x, poly[i].y);
  x.closePath();
}

/** desloca uma polilinha para um lado (normal média), sem fechar */
function offsetPath(path: Vec[], d: number): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i < path.length; i++) {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(path.length - 1, i + 1)];
    let dx = next.x - prev.x, dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    out.push({ x: path[i].x - dy * d, y: path[i].y + dx * d });
  }
  return out;
}

/** suavização de Chaikin (corte de cantos) — remove picos de caminhos meandrosos */
function chaikin(path: Vec[], iterations = 2): Vec[] {
  let pts = path;
  for (let it = 0; it < iterations; it++) {
    if (pts.length < 3) break;
    const out: Vec[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

export function renderWild(doc: WildDoc, env: RenderEnv, opts: RenderOptions = {}): HTMLCanvasElement {
  const s = opts.pxPerMeter ?? 28;
  const pad = opts.padding ?? 3;
  const W = doc.bounds.w + pad * 2;
  const H = doc.bounds.h + pad * 2;
  const canvas = env.createCanvas(Math.round(W * s), Math.round(H * s));
  const x = canvas.getContext('2d') as Ctx;
  const wear = WEAR[doc.conservation];
  const lighting = opts.lighting ?? doc.lighting;
  const theme = getWildTheme(doc.styleId);
  const style = getStyle(doc.styleId);
  const { grid } = doc;

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
  const tileKey = (kind: string) => `wild:${kind}:${tilePx}:${doc.seed}:${wear}:${theme.id}`;

  // ===== 1. fundo =====
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  const bg = x.createLinearGradient(0, 0, 0, canvas.height);
  const [br, bgc, bb] = theme.darknessColor.split(',').map(Number);
  bg.addColorStop(0, `rgb(${Math.round(br * 0.5)},${Math.round(bgc * 0.5)},${Math.round(bb * 0.5)})`);
  bg.addColorStop(1, `rgb(${Math.round(br * 0.3)},${Math.round(bgc * 0.3)},${Math.round(bb * 0.3)})`);
  x.fillStyle = bg;
  x.fillRect(0, 0, canvas.width, canvas.height);
  x.restore();

  // ===== 2. convés: grama base cobre tudo =====
  x.save();
  x.beginPath();
  x.rect(0, 0, doc.bounds.w, doc.bounds.h);
  x.shadowColor = 'rgba(0,0,0,0.55)';
  x.shadowBlur = 0.8 * s;
  x.fillStyle = pattern(cachedTile(tileKey('grass'), () => theme.grass(env.createCanvas, tileOpts)));
  x.fill();
  x.restore();

  // textura da Mesa Estelar sobre a grama base (foto dominante + color-grade)
  const overlayTex = (texKey: string | undefined, w: number, h: number): void => {
    if (!texKey) return;
    const texTile = getTextureTile(texKey, Math.round(TEX_TILE_M * s), env.createCanvas);
    if (!texTile) return;
    x.save();
    x.beginPath();
    x.rect(0, 0, w, h);
    x.globalAlpha = TEX_ALPHA;
    x.fillStyle = pattern(texTile);
    x.fill();
    x.globalAlpha = GRADE_ALPHA;
    x.fillStyle = pattern(cachedTile(tileKey('grass'), () => theme.grass(env.createCanvas, tileOpts)));
    x.fill();
    x.restore();
  };
  overlayTex(TERRAIN_TEX[doc.biome]?.grass, doc.bounds.w, doc.bounds.h);

  // ===== 3. terreno da grade (por tipo, união de células num único path) =====
  const fillKind = (kind: string, painter: () => HTMLCanvasElement) => {
    x.save();
    x.beginPath();
    let any = false;
    for (let gy = 0; gy < grid.rows; gy++) {
      for (let gx = 0; gx < grid.cols; gx++) {
        if (grid.data[gy * grid.cols + gx] !== kind) continue;
        any = true;
        x.rect(gx * grid.cell, gy * grid.cell, grid.cell + 0.02, grid.cell + 0.02);
      }
    }
    if (!any) { x.restore(); return; }
    x.fillStyle = pattern(cachedTile(tileKey(kind), painter));
    x.fill();
    // foto da Mesa Estelar como camada dominante + color-grade procedural
    const texKey = TERRAIN_TEX[doc.biome]?.[kind];
    if (texKey) {
      const texTile = getTextureTile(texKey, Math.round(TEX_TILE_M * s), env.createCanvas);
      if (texTile) {
        x.globalAlpha = TEX_ALPHA;
        x.fillStyle = pattern(texTile);
        x.fill();
        x.globalAlpha = GRADE_ALPHA;
        x.fillStyle = pattern(cachedTile(tileKey(kind), painter));
        x.fill();
        x.globalAlpha = 1;
      }
    }
    x.restore();
  };
  fillKind('dirt', () => theme.dirt(env.createCanvas, tileOpts));
  fillKind('sand', () => theme.sand(env.createCanvas, tileOpts));
  fillKind('rock', () => theme.rock(env.createCanvas, tileOpts));
  fillKind('field', () => theme.field(env.createCanvas, tileOpts));

  // variação sutil por célula (clareira mais escura / mais clara)
  const tintRng = new RNG(hashSeed(`tint-${doc.seed}`));
  const tints: number[] = [];
  for (let i = 0; i < grid.cols * grid.rows; i++) tints.push(tintRng.range(-1, 1));
  x.save();
  for (let gy = 0; gy < grid.rows; gy++) {
    for (let gx = 0; gx < grid.cols; gx++) {
      const t = grid.data[gy * grid.cols + gx];
      if (t !== 'grass') continue;
      const v = tints[gy * grid.cols + gx];
      if (Math.abs(v) < 0.45) continue;
      x.fillStyle = v > 0 ? `rgba(255,244,210,${(v - 0.45) * 0.07})` : `rgba(10,20,10,${(-v - 0.45) * 0.09})`;
      x.fillRect(gx * grid.cell, gy * grid.cell, grid.cell, grid.cell);
    }
  }
  x.restore();

  // borda das plantações
  x.save();
  x.strokeStyle = 'rgba(30,22,10,0.4)';
  x.lineWidth = 0.1;
  for (const f of doc.fields) {
    x.strokeRect(f.rect.x, f.rect.y, f.rect.w, f.rect.h);
  }
  x.restore();

  // ===== 4. água =====
  for (const wtr of doc.waters) {
    tracePolygon(x, wtr.polygon);
    x.save();
    const g = x.createLinearGradient(
      Math.min(...wtr.polygon.map((p) => p.x)), Math.min(...wtr.polygon.map((p) => p.y)),
      Math.max(...wtr.polygon.map((p) => p.x)), Math.max(...wtr.polygon.map((p) => p.y)),
    );
    g.addColorStop(0, theme.waterBase);
    g.addColorStop(1, theme.waterHi);
    x.fillStyle = g;
    x.fill();
    // textura de água rasa da Mesa Estelar (sutil, por baixo das ondulações)
    const wt = getTextureTile('agua_rasa', Math.round(TEX_TILE_M * s), env.createCanvas);
    if (wt) {
      x.globalAlpha = 0.2;
      x.fillStyle = pattern(wt);
      x.fill();
      x.globalAlpha = 1;
    }
    x.clip();
    // ondulações
    const wr = new RNG(hashSeed(`${wtr.id}-${doc.seed}`));
    x.strokeStyle = 'rgba(255,255,255,0.28)';
    x.lineWidth = 0.05;
    for (let i = 0; i < 14; i++) {
      const wy = wr.range(0, doc.bounds.h);
      x.beginPath();
      x.moveTo(0, wy);
      for (let wx = 0; wx <= doc.bounds.w; wx += 4) {
        x.lineTo(wx, wy + Math.sin(wx * 0.4 + i * 1.7) * 0.3);
      }
      x.stroke();
    }
    x.restore();
    // praia: contorno arenoso
    tracePolygon(x, wtr.polygon);
    x.strokeStyle = theme.waterEdge;
    x.lineWidth = 0.4;
    x.globalAlpha = 0.65;
    x.stroke();
    x.globalAlpha = 1;
  }

  // ===== 5. trilhas (cápsula suave com leve desvio orgânico) =====
  const dirtPat = pattern(cachedTile(tileKey('dirt'), () => theme.dirt(env.createCanvas, tileOpts)));
  for (const tr of doc.trails) {
    const wrng = new RNG(hashSeed(tr.id + doc.seed));
    const wob = chaikin(tr.path.map((p) => ({ x: p.x + wrng.jitter(0.12), y: p.y + wrng.jitter(0.12) })));
    const poly = capsuleOutline(wob, tr.width, 0.5);
    tracePolygon(x, poly);
    x.save();
    x.clip();
    x.fillStyle = dirtPat;
    x.fill();
    // manchas de desgaste internas
    x.globalAlpha = 0.28;
    for (let i = 0; i < tr.path.length - 1; i++) {
      const a = tr.path[i], b = tr.path[i + 1];
      const mx = (a.x + b.x) / 2 + wrng.jitter(0.5);
      const my = (a.y + b.y) / 2 + wrng.jitter(0.5);
      x.beginPath();
      x.arc(mx, my, tr.width * wrng.range(0.2, 0.38), 0, Math.PI * 2);
      x.fill();
    }
    x.restore();
    // borda batida
    tracePolygon(x, poly);
    x.strokeStyle = 'rgba(24,16,8,0.32)';
    x.lineWidth = 0.16;
    x.stroke();
  }

  // ===== 6. escarpas =====
  x.save();
  x.beginPath();
  x.rect(0, 0, doc.bounds.w, doc.bounds.h);
  x.clip();
  for (const cl of doc.cliffs) {
    const face = offsetPath(cl.path, cl.height * 0.18);
    const top = offsetPath(cl.path, -cl.height * 0.3);
    // sombra projetada
    x.save();
    x.strokeStyle = 'rgba(0,0,0,0.38)';
    x.lineWidth = cl.height * 0.42;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.beginPath();
    x.moveTo(face[0].x + 0.16, face[0].y + 0.22);
    for (let i = 1; i < face.length; i++) x.lineTo(face[i].x + 0.16, face[i].y + 0.22);
    x.stroke();
    x.restore();
    // face rochosa
    x.save();
    x.strokeStyle = theme.cliffFace;
    x.lineWidth = cl.height * 0.42;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.beginPath();
    x.moveTo(face[0].x, face[0].y);
    for (let i = 1; i < face.length; i++) x.lineTo(face[i].x, face[i].y);
    x.stroke();
    // estratos na face
    x.strokeStyle = 'rgba(0,0,0,0.28)';
    x.lineWidth = 0.08;
    for (let i = 1; i < face.length - 1; i += 2) {
      x.beginPath();
      x.moveTo(face[i].x - 0.08, face[i].y + cl.height * 0.12);
      x.lineTo(face[i].x + 0.18, face[i].y + cl.height * 0.16);
      x.stroke();
    }
    x.restore();
    // topo iluminado
    x.save();
    x.strokeStyle = theme.cliffTop;
    x.lineWidth = 0.42;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.beginPath();
    x.moveTo(top[0].x, top[0].y);
    for (let i = 1; i < top.length; i++) x.lineTo(top[i].x, top[i].y);
    x.stroke();
    x.restore();
  }
  x.restore(); // fim do clip das escarpas

  // ===== 7. adereços =====
  const lights: { p: Vec; r: number; strength: number }[] = [];
  const emissives: { p: Vec; r: number; alpha: number; color: string }[] = [];
  const NO_SHADOW = new Set(['flowers', 'shard']);
  const sorted = [...doc.props].sort((a, b) => a.pos.y - b.pos.y);
  for (const prop of sorted) {
    const painter = theme.propPainters[prop.type];
    if (!painter) continue;
    if (!NO_SHADOW.has(prop.type)) {
      x.save();
      x.translate(prop.pos.x + 0.07, prop.pos.y + 0.12);
      x.scale(1, 0.85);
      x.shadowColor = 'rgba(0,0,0,0.5)';
      x.shadowBlur = 0.08 * s;
      x.fillStyle = 'rgba(0,0,0,0.35)';
      x.beginPath();
      x.ellipse(0, 0, prop.w * 0.5, prop.h * 0.5, 0, 0, Math.PI * 2);
      x.fill();
      x.restore();
    }
    x.save();
    x.translate(prop.pos.x, prop.pos.y);
    x.rotate((prop.rot * Math.PI) / 2);
    if (!tryPaintSprite(x, WILD_SPRITES, theme.id, prop.type, prop.variant, prop.w, prop.h)) {
      const env2: SpriteEnv = { rng: new RNG(hashSeed(prop.id)), variant: prop.variant, wear };
      painter(x, prop.w, prop.h, env2);
    }
    x.restore();
    const li = theme.propLight[prop.type];
    if (li) lights.push({ p: prop.pos, r: li.r, strength: li.strength });
    const gl = theme.propGlow[prop.type];
    if (gl) emissives.push({ p: prop.pos, r: gl.r, alpha: gl.alpha, color: toTriplet(gl.color) });
  }

  // brilho emissivo aditivo
  x.save();
  x.globalCompositeOperation = 'lighter';
  for (const e of emissives) {
    const g = x.createRadialGradient(e.p.x, e.p.y, 0, e.p.x, e.p.y, e.r);
    g.addColorStop(0, `rgba(${e.color},${e.alpha})`);
    g.addColorStop(1, `rgba(${e.color},0)`);
    x.fillStyle = g;
    x.beginPath(); x.arc(e.p.x, e.p.y, e.r, 0, Math.PI * 2); x.fill();
  }
  x.restore();

  // ===== 8. escuridão furada por luzes =====
  const darkCanvas = env.createCanvas(canvas.width, canvas.height);
  const dx2 = darkCanvas.getContext('2d') as Ctx;
  const dark = dx2.createLinearGradient(0, 0, canvas.width, canvas.height);
  const dk = 0.1 + 0.26 * (1 - lighting);
  dark.addColorStop(0, `rgba(${theme.darknessColor},${dk})`);
  dark.addColorStop(1, `rgba(${theme.darknessColor},${dk + 0.05})`);
  dx2.fillStyle = dark;
  dx2.fillRect(0, 0, canvas.width, canvas.height);
  dx2.globalCompositeOperation = 'destination-out';
  // spawn e saídas sempre legíveis
  const punches = [...lights.map((l) => ({ p: l.p, r: l.r, strength: l.strength })),
    { p: doc.spawn, r: 5, strength: 0.5 },
    ...doc.pois.map((p) => ({ p: p.pos, r: 4.2, strength: 0.42 })),
    ...doc.exits.map((e) => ({ p: e, r: 3.4, strength: 0.45 }))];
  for (const l of punches) {
    const lx = (l.p.x + pad) * s;
    const ly = (l.p.y + pad) * s;
    const lr = l.r * s;
    const g = dx2.createRadialGradient(lx, ly, 0, lx, ly, lr);
    g.addColorStop(0, `rgba(255,255,255,${l.strength})`);
    g.addColorStop(0.55, `rgba(255,255,255,${l.strength * 0.3})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    dx2.fillStyle = g;
    dx2.beginPath(); dx2.arc(lx, ly, lr, 0, Math.PI * 2); dx2.fill();
  }
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.drawImage(darkCanvas, 0, 0);
  x.restore();

  // ===== 8b. pontos de interesse: losango + rótulo (sempre legíveis) =====
  if (opts.showLabels !== false) {
    for (const poi of doc.pois) {
      x.save();
      x.translate(poi.pos.x, poi.pos.y);
      x.fillStyle = style.labelStyle.color;
      x.strokeStyle = 'rgba(0,0,0,0.65)';
      x.lineWidth = 0.05;
      x.beginPath();
      x.moveTo(0, -0.42); x.lineTo(0.32, 0); x.lineTo(0, 0.42); x.lineTo(-0.32, 0);
      x.closePath();
      x.fill();
      x.stroke();
      x.font = style.labelStyle.font(0.52);
      x.textAlign = 'center';
      x.textBaseline = 'top';
      x.shadowColor = 'rgba(0,0,0,0.8)';
      x.shadowBlur = 0.06 * s;
      x.fillStyle = `rgba(${toTriplet(style.labelStyle.color)},0.92)`;
      x.fillText(poi.label, 0, 0.62);
      x.restore();
    }
  }

  // ===== 9. atmosfera =====
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 0.85;
  x.drawImage(cachedTile(`atm:wild:${style.id}:${canvas.width}x${canvas.height}:${doc.seed}`, () =>
    style.atmosphere(env.createCanvas, canvas.width, canvas.height, doc.seed)), 0, 0);
  x.restore();

  return canvas;
}
