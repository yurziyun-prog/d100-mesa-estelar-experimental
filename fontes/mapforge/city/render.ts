/**
 * Renderizador artístico da CIDADE, em camadas:
 *  1. fundo (terreno ao redor)       5. praças e parques
 *  2. deck da cidade (limite)        6. prédios (sombra + telhado + porta)
 *  3. quarteirões (calçada)          7. adereços → emissivos
 *  4. ruas (textura, meio-fio,       8. escuridão furada por luzes (offscreen)
 *     faixa central tracejada)       9. atmosfera (do estilo visual)
 */

import { RNG, hashSeed } from '../rng';
import { getStyle } from '../styles';
import { capsuleOutline } from '../gamedata';
import type { Ctx, TileOpts } from '../render/textures';
import type { RenderEnv, RenderOptions } from '../render/renderer';
import { getTextureTile } from '../render/texturelib';
import { CITY_SPRITES, tryPaintSprite } from '../render/spritemap';
import { getCityTheme } from './themes';
import type { CityDoc, Rect, Vec } from './types';
import type { SpriteEnv } from '../render/sprites';

/** textura da Mesa Estelar por elemento urbano e estilo (foto dominante +
 *  color-grade procedural, mesmo esquema dos exteriores) */
const CITY_TEX = {
  street: {
    retrofuturista: 'terra_batida', futurista: 'metal',
    medieval: 'pedra', hiboriano: 'terra_batida', hibrido: 'pedra',
  } as Record<string, string>,
  sidewalk: {
    retrofuturista: 'areia', futurista: 'metal_ferrugem',
    medieval: 'pedregulhos', hiboriano: 'areia', hibrido: 'pedregulhos',
  } as Record<string, string>,
  plaza: 'pedra',
  park: 'grama',
};
const CITY_TEX_M = 8;
const CITY_TEX_ALPHA = 0.75;
const CITY_GRADE_ALPHA = 0.35;

const TILE_M = 4;

const tileCache = new Map<string, HTMLCanvasElement>();
function cachedTile(key: string, make: () => HTMLCanvasElement): HTMLCanvasElement {
  let t = tileCache.get(key);
  if (!t) {
    t = make();
    if (tileCache.size > 60) tileCache.clear();
    tileCache.set(key, t);
  }
  return t;
}

const WEAR: Record<CityDoc['conservation'], number> = {
  novo: 0, usado: 1, abandonado: 2, arruinado: 3,
};

/**
 * Normaliza uma cor css (hex, rgb ou rgba) para a tripla "r,g,b" usada nas
 * strings `rgba(${tripla},alfa)`. Evita `rgba(rgba(...),a)` inválido —
 * alguns temas guardam cores já em rgba() (ex.: água das fontes).
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

function roundedRectPath(x: Ctx, r: Rect, rad: number): void {
  x.beginPath();
  x.moveTo(r.x + rad, r.y);
  x.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rad);
  x.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rad);
  x.arcTo(r.x, r.y + r.h, r.x, r.y, rad);
  x.arcTo(r.x, r.y, r.x + r.w, r.y, rad);
  x.closePath();
}

export function renderCity(doc: CityDoc, env: RenderEnv, opts: RenderOptions = {}): HTMLCanvasElement {
  const s = opts.pxPerMeter ?? 28;
  const pad = opts.padding ?? 3;
  const W = doc.bounds.w + pad * 2;
  const H = doc.bounds.h + pad * 2;
  const canvas = env.createCanvas(Math.round(W * s), Math.round(H * s));
  const x = canvas.getContext('2d') as Ctx;
  const wear = WEAR[doc.conservation];
  const lighting = opts.lighting ?? doc.lighting;
  const theme = getCityTheme(doc.styleId);
  const style = getStyle(doc.styleId);

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
  const tileKey = (kind: string) => `city:${kind}:${tilePx}:${doc.seed}:${wear}:${theme.id}`;

  // texturas fotográficas por elemento urbano (null = fallback procedural)
  const texTileOf = (key: string): HTMLCanvasElement | null =>
    getTextureTile(key, Math.round(CITY_TEX_M * s), env.createCanvas);
  /** preenche o path corrente com foto + color-grade do tile procedural.
   *  `gradeTile` é o tile procedural já em cache (mesmo painter da camada base). */
  const overlayTex = (key: string | undefined, gradeTile: HTMLCanvasElement): void => {
    if (!key) return;
    const texTile = texTileOf(key);
    if (!texTile) return;
    x.globalAlpha = CITY_TEX_ALPHA;
    x.fillStyle = pattern(texTile);
    x.fill();
    x.globalAlpha = CITY_GRADE_ALPHA;
    x.fillStyle = pattern(gradeTile);
    x.fill();
    x.globalAlpha = 1;
  };

  // ===== 1. fundo: terreno selvagem ao redor =====
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  const bg = x.createLinearGradient(0, 0, 0, canvas.height);
  const [br, bgc, bb] = theme.darknessColor.split(',').map(Number);
  bg.addColorStop(0, `rgb(${Math.round(br * 0.5)},${Math.round(bgc * 0.5)},${Math.round(bb * 0.5)})`);
  bg.addColorStop(1, `rgb(${Math.round(br * 0.32)},${Math.round(bgc * 0.32)},${Math.round(bb * 0.32)})`);
  x.fillStyle = bg;
  x.fillRect(0, 0, canvas.width, canvas.height);
  x.restore();

  // ===== 2. deck da cidade =====
  const deck: Rect = { x: 0, y: 0, w: doc.bounds.w, h: doc.bounds.h };
  roundedRectPath(x, deck, 1.6);
  x.save();
  x.shadowColor = 'rgba(0,0,0,0.6)';
  x.shadowBlur = 0.8 * s;
  x.fillStyle = pattern(cachedTile(tileKey('backdrop'), () => theme.backdrop(env.createCanvas, tileOpts)));
  x.fill();
  x.restore();

  const streetPoly = (id: string): Vec[] => {
    const st = doc.streets.find((v) => v.id === id)!;
    return capsuleOutline(st.path, st.width, 0.6);
  };

  // ===== 3. quarteirões (calçada) =====
  const sidewalkTile = cachedTile(tileKey('sidewalk'), () => theme.sidewalk(env.createCanvas, tileOpts));
  const sidewalkPat = pattern(sidewalkTile);
  const sidewalkTexKey = CITY_TEX.sidewalk[doc.styleId] ?? CITY_TEX.sidewalk.hibrido;
  for (const b of doc.blocks) {
    x.fillStyle = sidewalkPat;
    x.fillRect(b.x, b.y, b.w, b.h);
    x.strokeStyle = 'rgba(0,0,0,0.3)';
    x.lineWidth = 0.05;
    x.strokeRect(b.x + 0.02, b.y + 0.02, b.w - 0.04, b.h - 0.04);
    x.beginPath();
    x.rect(b.x, b.y, b.w, b.h);
    overlayTex(sidewalkTexKey, sidewalkTile);
  }

  // ===== 4. ruas =====
  const streetTile = cachedTile(tileKey('street'), () => theme.street(env.createCanvas, tileOpts));
  const streetPat = pattern(streetTile);
  const streetTexKey = CITY_TEX.street[doc.styleId] ?? CITY_TEX.street.hibrido;
  for (const st of doc.streets) {
    const poly = streetPoly(st.id);
    tracePolygon(x, poly);
    x.save();
    x.clip();
    // textura alinhada ao mundo: preenche via pattern + leve escurecimento de borda
    x.fillStyle = streetPat;
    x.fill();
    tracePolygon(x, poly);
    overlayTex(streetTexKey, streetTile);
    x.restore();
    // meio-fio: contorno escuro
    tracePolygon(x, poly);
    x.strokeStyle = 'rgba(12,8,6,0.55)';
    x.lineWidth = 0.3;
    x.stroke();
    // faixa central tracejada (vias principais)
    if (st.kind === 'main') {
      x.save();
      x.strokeStyle = 'rgba(244,201,93,0.5)';
      x.lineWidth = 0.13;
      x.setLineDash([1.1, 1.1]);
      x.beginPath();
      x.moveTo(st.path[0].x, st.path[0].y);
      for (let i = 1; i < st.path.length; i++) x.lineTo(st.path[i].x, st.path[i].y);
      x.stroke();
      x.restore();
    }
  }

  // ===== 5. praças e parques =====
  const plazaTile = cachedTile(tileKey('plaza'), () => theme.plaza(env.createCanvas, tileOpts));
  const plazaPat = pattern(plazaTile);
  for (const p of doc.plazas) {
    x.fillStyle = plazaPat;
    x.fillRect(p.rect.x, p.rect.y, p.rect.w, p.rect.h);
    x.beginPath();
    x.rect(p.rect.x, p.rect.y, p.rect.w, p.rect.h);
    overlayTex(CITY_TEX.plaza, plazaTile);
    x.strokeStyle = 'rgba(0,0,0,0.35)';
    x.lineWidth = 0.07;
    x.strokeRect(p.rect.x, p.rect.y, p.rect.w, p.rect.h);
    // rótulo da praça
    if (opts.showLabels !== false) {
      x.save();
      x.font = style.labelStyle.font(Math.max(0.5, Math.min(0.8, p.rect.w / 16)));
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillStyle = style.labelStyle.color;
      x.fillText(p.label, p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h - 0.9);
      x.restore();
    }
  }
  const grassTile = cachedTile(tileKey('grass'), () => theme.grass(env.createCanvas, tileOpts));
  const grassPat = pattern(grassTile);
  for (const p of doc.parks) {
    x.fillStyle = grassPat;
    x.fillRect(p.rect.x, p.rect.y, p.rect.w, p.rect.h);
    x.beginPath();
    x.rect(p.rect.x, p.rect.y, p.rect.w, p.rect.h);
    overlayTex(CITY_TEX.park, grassTile);
    x.strokeStyle = 'rgba(0,0,0,0.3)';
    x.lineWidth = 0.06;
    x.strokeRect(p.rect.x, p.rect.y, p.rect.w, p.rect.h);
  }

  // ===== 6. prédios =====
  for (const b of doc.buildings) {
    const r = b.rect;
    // sombra projetada (sudoeste)
    x.save();
    x.fillStyle = 'rgba(8,4,2,0.45)';
    roundedRectPath(x, { x: r.x + 0.2, y: r.y + 0.3, w: r.w, h: r.h }, 0.14);
    x.fill();
    x.restore();
    // parede externa (parapeito)
    x.fillStyle = theme.buildingEdge;
    roundedRectPath(x, r, 0.14);
    x.fill();
    // telhado
    const inner: Rect = { x: r.x + 0.14, y: r.y + 0.14, w: r.w - 0.28, h: r.h - 0.28 };
    const env: SpriteEnv = { rng: new RNG(hashSeed(b.id)), variant: b.variant, wear };
    theme.paintBuildingRoof(x, inner, b, env);
    // porta voltada à rua
    const dw = b.doorWidth;
    let dx = 0, dy = 0, horiz = true;
    if (b.facing === 's') { dx = r.x + r.w / 2; dy = r.y + r.h - 0.12; horiz = true; }
    if (b.facing === 'n') { dx = r.x + r.w / 2; dy = r.y + 0.12; horiz = true; }
    if (b.facing === 'e') { dx = r.x + r.w - 0.12; dy = r.y + r.h / 2; horiz = false; }
    if (b.facing === 'w') { dx = r.x + 0.12; dy = r.y + r.h / 2; horiz = false; }
    x.save();
    x.translate(dx, dy);
    if (!horiz) x.rotate(Math.PI / 2);
    x.fillStyle = 'rgba(8,5,3,0.85)';
    x.fillRect(-dw / 2, -0.22, dw, 0.44);
    x.strokeStyle = theme.doorFrame;
    x.lineWidth = 0.04;
    x.strokeRect(-dw / 2, -0.22, dw, 0.44);
    x.restore();
    // rótulo do estabelecimento (prédios grandes, não residenciais)
    if (opts.showLabels !== false && b.usage && b.usage !== 'Residência' && r.w * r.h >= 30) {
      x.save();
      const label = b.name ?? b.usage;
      const fontPx = Math.max(0.3, Math.min(0.52, r.h * 0.15));
      x.font = style.labelStyle.font(fontPx);
      const tw = x.measureText(label).width;
      // placa escura com borda em acento — leitura garantida sobre o telhado
      roundedRectPath(x, {
        x: r.x + r.w / 2 - tw / 2 - 0.18, y: r.y + r.h / 2 - fontPx * 0.64,
        w: tw + 0.36, h: fontPx * 1.28,
      }, 0.1);
      x.fillStyle = 'rgba(8,6,4,0.68)';
      x.fill();
      x.strokeStyle = theme.doorFrame;
      x.lineWidth = 0.035;
      x.stroke();
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillStyle = 'rgba(244,235,214,0.92)';
      x.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + fontPx * 0.04);
      x.restore();
    }
  }

  // ===== 7. adereços =====
  const lights: { p: Vec; r: number; strength: number }[] = [];
  const emissives: { p: Vec; r: number; alpha: number; color: string }[] = [];
  const sorted = [...doc.props].sort((a, b) => a.pos.y - b.pos.y);
  for (const prop of sorted) {
    const painter = theme.propPainters[prop.type];
    if (!painter) continue;
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
    x.save();
    x.translate(prop.pos.x, prop.pos.y);
    x.rotate((prop.rot * Math.PI) / 2);
    if (!tryPaintSprite(x, CITY_SPRITES, theme.id, prop.type, prop.variant, prop.w, prop.h)) {
      const env: SpriteEnv = { rng: new RNG(hashSeed(prop.id)), variant: prop.variant, wear };
      painter(x, prop.w, prop.h, env);
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

  // ===== 8. escuridão furada por luzes (offscreen) =====
  const darkCanvas = env.createCanvas(canvas.width, canvas.height);
  const dx2 = darkCanvas.getContext('2d') as Ctx;
  const dark = dx2.createLinearGradient(0, 0, canvas.width, canvas.height);
  const dk = 0.18 + 0.34 * (1 - lighting);
  dark.addColorStop(0, `rgba(${theme.darknessColor},${dk})`);
  dark.addColorStop(1, `rgba(${theme.darknessColor},${dk + 0.06})`);
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
    dx2.beginPath(); dx2.arc(lx, ly, lr, 0, Math.PI * 2); dx2.fill();
  }
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.drawImage(darkCanvas, 0, 0);
  x.restore();

  // ===== 9. atmosfera (compartilhada com o estilo visual) =====
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 0.85;
  x.drawImage(cachedTile(`atm:city:${style.id}:${canvas.width}x${canvas.height}:${doc.seed}`, () =>
    style.atmosphere(env.createCanvas, canvas.width, canvas.height, doc.seed)), 0, 0);
  x.restore();

  return canvas;
}
