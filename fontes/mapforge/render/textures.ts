/**
 * Síntese procedural de texturas — o "tileset artístico" é gerado em runtime.
 *
 * Cada tile é pintado em um canvas de `px` pixels representando `tileM` METROS,
 * assim o pattern alinha-se ao espaço mundial quando o contexto tem a transform
 * mundo→tela ativa (1 tile = tileM metros, canto na origem do mundo).
 *
 * Nenhum asset externo é necessário; tudo é desenhado com gradientes, ruído e
 * geometria. O estado de conservação adiciona grunge/manchas/rachaduras.
 */

import { RNG } from '../rng';

/** abstração de canvas para funcionar no browser e no node-canvas */
export type CanvasFactory = (w: number, h: number) => HTMLCanvasElement;
export type Ctx = CanvasRenderingContext2D;

export interface TileOpts {
  px: number; // resolução do tile em pixels
  tileM: number; // metros representados pelo tile
  seed: number;
  /** 0 = novo, 1 = usado, 2 = abandonado, 3 = arruinado */
  wear: number;
}

function mkCtx(create: CanvasFactory, px: number): { c: HTMLCanvasElement; x: Ctx } {
  const c = create(px, px);
  return { c, x: c.getContext('2d') as Ctx };
}

/** ruído pontilhado sutil */
function speckle(x: Ctx, px: number, rng: RNG, count: number, alpha: number, dark = true): void {
  for (let i = 0; i < count; i++) {
    const v = dark ? 0 : 255;
    x.fillStyle = `rgba(${v},${v},${v},${rng.range(alpha * 0.3, alpha)})`;
    const s = rng.range(0.5, 2.2);
    x.fillRect(rng.range(0, px), rng.range(0, px), s, s);
  }
}

/** escovado metálico: traços horizontais finos */
function brushed(x: Ctx, px: number, rng: RNG, count: number, alpha: number): void {
  for (let i = 0; i < count; i++) {
    const y = rng.range(0, px);
    x.strokeStyle = rng.chance(0.5)
      ? `rgba(255,255,255,${rng.range(0.01, alpha)})`
      : `rgba(0,0,0,${rng.range(0.01, alpha)})`;
    x.lineWidth = rng.range(0.5, 1.4);
    x.beginPath();
    x.moveTo(rng.range(-10, 0), y);
    x.lineTo(px + rng.range(0, 10), y + rng.range(-1.5, 1.5));
    x.stroke();
  }
}

/** manchas de óleo/grime */
function stains(x: Ctx, px: number, rng: RNG, count: number, alpha: number): void {
  for (let i = 0; i < count; i++) {
    const cx = rng.range(0, px), cy = rng.range(0, px);
    const r = rng.range(px * 0.04, px * 0.16);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(8,10,12,${alpha})`);
    g.addColorStop(1, 'rgba(8,10,12,0)');
    x.fillStyle = g;
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.fill();
  }
}

/** rachaduras: polilinhas sinuosas escuras */
function cracks(x: Ctx, px: number, rng: RNG, count: number): void {
  for (let i = 0; i < count; i++) {
    let cx = rng.range(0, px), cy = rng.range(0, px);
    let ang = rng.range(0, Math.PI * 2);
    x.strokeStyle = 'rgba(5,6,8,0.55)';
    x.lineWidth = rng.range(0.8, 1.8);
    x.beginPath();
    x.moveTo(cx, cy);
    const segs = rng.int(4, 9);
    for (let s = 0; s < segs; s++) {
      ang += rng.jitter(0.9);
      const len = rng.range(px * 0.02, px * 0.06);
      cx += Math.cos(ang) * len;
      cy += Math.sin(ang) * len;
      x.lineTo(cx, cy);
    }
    x.stroke();
  }
}

function wearOverlays(x: Ctx, px: number, rng: RNG, wear: number): void {
  if (wear >= 1) {
    stains(x, px, rng, 3 + wear * 4, 0.10 + wear * 0.08);
    speckle(x, px, rng, 120 * (wear + 1), 0.10);
  }
  if (wear >= 2) {
    stains(x, px, rng, 5, 0.22);
    cracks(x, px, rng, 2 + wear * 2);
    speckle(x, px, rng, 250, 0.16);
  }
  if (wear >= 3) {
    stains(x, px, rng, 8, 0.3);
    cracks(x, px, rng, 8);
  }
}

function rivets(x: Ctx, _px: number, positions: [number, number][], r: number, shade: string): void {
  for (const [cx, cy] of positions) {
    const g = x.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(200,215,230,0.5)');
    g.addColorStop(0.6, shade);
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    x.fillStyle = g;
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.fill();
  }
}

// ---------- tiles de piso ----------

/** piso metálico de convés: placas 2x2 com emendas e rebites */
export function floorMetalDeck(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed);
  const px = o.px;
  const plates = 2; // placas por tile
  const cell = px / plates;

  for (let gy = 0; gy < plates; gy++) {
    for (let gx = 0; gx < plates; gx++) {
      const shade = rng.range(-10, 10);
      const g = x.createLinearGradient(0, gy * cell, 0, (gy + 1) * cell);
      g.addColorStop(0, `rgb(${78 + shade},${86 + shade},${102 + shade})`);
      g.addColorStop(0.5, `rgb(${86 + shade},${95 + shade},${112 + shade})`);
      g.addColorStop(1, `rgb(${70 + shade},${78 + shade},${92 + shade})`);
      x.fillStyle = g;
      x.fillRect(gx * cell, gy * cell, cell, cell);
      // leve bisel interno
      x.strokeStyle = 'rgba(255,255,255,0.05)';
      x.strokeRect(gx * cell + 1.5, gy * cell + 1.5, cell - 3, cell - 3);
    }
  }
  brushed(x, px, rng, 220, 0.05);

  // emendas entre placas
  x.strokeStyle = 'rgba(10,12,16,0.8)';
  x.lineWidth = Math.max(1.5, px * 0.008);
  for (let i = 0; i <= plates; i++) {
    const p = i * cell;
    x.beginPath(); x.moveTo(p, 0); x.lineTo(p, px); x.stroke();
    x.beginPath(); x.moveTo(0, p); x.lineTo(px, p); x.stroke();
  }
  x.strokeStyle = 'rgba(255,255,255,0.06)';
  x.lineWidth = 1;
  for (let i = 0; i <= plates; i++) {
    const p = i * cell + 1.5;
    x.beginPath(); x.moveTo(p, 0); x.lineTo(p, px); x.stroke();
    x.beginPath(); x.moveTo(0, p); x.lineTo(px, p); x.stroke();
  }

  // rebites nas quinas de cada placa
  const off = px * 0.035;
  const positions: [number, number][] = [];
  for (let gy = 0; gy < plates; gy++) {
    for (let gx = 0; gx < plates; gx++) {
      for (const [ux, uy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
        positions.push([gx * cell + off + ux * (cell - off * 2), gy * cell + off + uy * (cell - off * 2)]);
      }
    }
  }
  rivets(x, px, positions, Math.max(1.4, px * 0.008), 'rgba(90,100,115,0.9)');

  wearOverlays(x, px, rng, o.wear);
  return c;
}

/** piso de salão: placas grandes polidas com friso central */
export function floorHallPlate(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 11);
  const px = o.px;

  const g = x.createLinearGradient(0, 0, px, px);
  g.addColorStop(0, 'rgb(82,93,112)');
  g.addColorStop(0.5, 'rgb(92,105,126)');
  g.addColorStop(1, 'rgb(78,89,106)');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  brushed(x, px, rng, 320, 0.06);

  // friso diagonal sutil
  x.strokeStyle = 'rgba(255,255,255,0.045)';
  x.lineWidth = px * 0.012;
  x.beginPath();
  x.moveTo(0, px);
  x.lineTo(px, 0);
  x.stroke();

  // emenda em cruz com rebites espaçados
  x.strokeStyle = 'rgba(10,12,16,0.75)';
  x.lineWidth = Math.max(1.5, px * 0.007);
  x.beginPath(); x.moveTo(px / 2, 0); x.lineTo(px / 2, px); x.stroke();
  x.beginPath(); x.moveTo(0, px / 2); x.lineTo(px, px / 2); x.stroke();
  const positions: [number, number][] = [];
  for (let i = 1; i < 8; i++) {
    positions.push([px / 2, (px / 8) * i]);
    positions.push([(px / 8) * i, px / 2]);
  }
  rivets(x, px, positions, Math.max(1.3, px * 0.007), 'rgba(95,105,120,0.9)');

  wearOverlays(x, px, rng, o.wear);
  return c;
}

/** piso técnico escuro com grelha */
export function floorDarkGrate(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 23);
  const px = o.px;

  const g = x.createLinearGradient(0, 0, 0, px);
  g.addColorStop(0, 'rgb(58,65,77)');
  g.addColorStop(1, 'rgb(50,55,66)');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  brushed(x, px, rng, 160, 0.04);

  // grelha central
  const gw = px * 0.44;
  x.fillStyle = 'rgb(22,25,31)';
  x.fillRect((px - gw) / 2, 0, gw, px);
  x.strokeStyle = 'rgba(0,0,0,0.7)';
  x.lineWidth = 2;
  const slats = 10;
  for (let i = 0; i <= slats; i++) {
    const y = (px / slats) * i;
    x.beginPath(); x.moveTo((px - gw) / 2, y); x.lineTo((px + gw) / 2, y); x.stroke();
  }
  x.strokeStyle = 'rgba(120,140,160,0.18)';
  x.lineWidth = 1;
  for (let i = 0; i <= slats; i++) {
    const y = (px / slats) * i + 1.4;
    x.beginPath(); x.moveTo((px - gw) / 2, y); x.lineTo((px + gw) / 2, y); x.stroke();
  }
  // bordas da grelha
  x.strokeStyle = 'rgba(90,100,115,0.6)';
  x.lineWidth = Math.max(1.5, px * 0.006);
  x.strokeRect((px - gw) / 2, -2, gw, px + 4);

  wearOverlays(x, px, rng, Math.max(o.wear, 1));
  return c;
}

/** piso de corredor: placas alongadas + faixa guia luminosa */
export function floorCorridorDeck(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 37);
  const px = o.px;

  const g = x.createLinearGradient(0, 0, px, 0);
  g.addColorStop(0, 'rgb(63,70,84)');
  g.addColorStop(0.5, 'rgb(72,80,95)');
  g.addColorStop(1, 'rgb(61,68,81)');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  brushed(x, px, rng, 180, 0.05);

  // emendas verticais (o tile se repete ao longo do eixo mundial)
  x.strokeStyle = 'rgba(10,12,16,0.8)';
  x.lineWidth = Math.max(1.5, px * 0.008);
  x.beginPath(); x.moveTo(0, 0.5); x.lineTo(px, 0.5); x.stroke();
  x.beginPath(); x.moveTo(0, px - 0.5); x.lineTo(px, px - 0.5); x.stroke();

  // faixa guia central
  x.fillStyle = 'rgba(46,224,200,0.10)';
  x.fillRect(0, px / 2 - px * 0.05, px, px * 0.1);
  x.fillStyle = 'rgba(46,224,200,0.18)';
  x.fillRect(0, px / 2 - px * 0.006, px, px * 0.012);

  const positions: [number, number][] = [
    [px * 0.08, px * 0.12], [px * 0.92, px * 0.12],
    [px * 0.08, px * 0.88], [px * 0.92, px * 0.88],
  ];
  rivets(x, px, positions, Math.max(1.3, px * 0.007), 'rgba(85,95,110,0.9)');

  wearOverlays(x, px, rng, o.wear);
  return c;
}

/** casco do convés (área fora das salas): placas pesadas escuras */
export function hullDeck(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 53);
  const px = o.px;
  const plates = 2;
  const cell = px / plates;

  for (let gy = 0; gy < plates; gy++) {
    for (let gx = 0; gx < plates; gx++) {
      const shade = rng.range(-5, 5);
      x.fillStyle = `rgb(${50 + shade},${56 + shade},${66 + shade})`;
      x.fillRect(gx * cell, gy * cell, cell, cell);
    }
  }
  brushed(x, px, rng, 100, 0.03);
  x.strokeStyle = 'rgba(8,10,13,0.9)';
  x.lineWidth = Math.max(2, px * 0.012);
  for (let i = 0; i <= plates; i++) {
    const p = i * cell;
    x.beginPath(); x.moveTo(p, 0); x.lineTo(p, px); x.stroke();
    x.beginPath(); x.moveTo(0, p); x.lineTo(px, p); x.stroke();
  }
  x.strokeStyle = 'rgba(160,185,210,0.10)';
  x.lineWidth = 1;
  for (let i = 0; i <= plates; i++) {
    const p = i * cell + 2;
    x.beginPath(); x.moveTo(p, 0); x.lineTo(p, px); x.stroke();
    x.beginPath(); x.moveTo(0, p); x.lineTo(px, p); x.stroke();
  }
  // greebles: linhas de manutenção e pequenos painéis
  for (let i = 0; i < 4; i++) {
    const gx = rng.range(0, px), gy = rng.range(0, px);
    x.strokeStyle = 'rgba(85,98,115,0.3)';
    x.lineWidth = 1.2;
    x.strokeRect(gx, gy, rng.range(px * 0.08, px * 0.2), rng.range(px * 0.05, px * 0.14));
  }
  wearOverlays(x, px, rng, o.wear);
  return c;
}

/** aço de parede: ESCURO (as paredes são a "tinta" do desenho), com nervuras e rebites */
export function wallSteel(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 91);
  const px = o.px;

  const g = x.createLinearGradient(0, 0, px, px);
  g.addColorStop(0, 'rgb(37,42,51)');
  g.addColorStop(0.5, 'rgb(44,50,61)');
  g.addColorStop(1, 'rgb(33,38,46)');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  brushed(x, px, rng, 160, 0.04);

  // nervuras horizontais
  x.strokeStyle = 'rgba(5,6,9,0.7)';
  x.lineWidth = Math.max(1.5, px * 0.012);
  x.beginPath(); x.moveTo(0, px * 0.3); x.lineTo(px, px * 0.3); x.stroke();
  x.beginPath(); x.moveTo(0, px * 0.72); x.lineTo(px, px * 0.72); x.stroke();
  x.strokeStyle = 'rgba(160,185,215,0.14)';
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(0, px * 0.3 + 2); x.lineTo(px, px * 0.3 + 2); x.stroke();
  x.beginPath(); x.moveTo(0, px * 0.72 + 2); x.lineTo(px, px * 0.72 + 2); x.stroke();

  // emenda vertical central + rebites em fila
  x.strokeStyle = 'rgba(5,6,9,0.6)';
  x.lineWidth = Math.max(1.5, px * 0.01);
  x.beginPath(); x.moveTo(px / 2, 0); x.lineTo(px / 2, px); x.stroke();
  const positions: [number, number][] = [];
  for (let i = 1; i < 8; i++) {
    positions.push([px / 2, (px / 8) * i]);
    positions.push([px * 0.06, (px / 8) * i]);
    positions.push([px * 0.94, (px / 8) * i]);
  }
  rivets(x, px, positions, Math.max(1.4, px * 0.008), 'rgba(70,80,96,0.9)');

  wearOverlays(x, px, rng, o.wear);
  return c;
}

/** overlay de vinheta + scanlines + ruído, gerado por dimensão de saída */
export function atmosphereOverlay(
  create: CanvasFactory,
  w: number,
  h: number,
  seed: number,
): HTMLCanvasElement {
  const c = create(w, h);
  const x = c.getContext('2d') as Ctx;
  const rng = new RNG(seed + 77);

  // vinheta
  const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(2,4,10,0.42)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);

  // scanlines bem sutis
  x.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < h; y += 3) x.fillRect(0, y, w, 1);

  // grão de filme
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng.next() - 0.5) * 9;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  return c;
}
