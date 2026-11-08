/**
 * Estilo RETROFUTURISTA — era atômica vibrante (inspirado em Fallout, sem
 * ferrugem): creme, turquesa, laranja, rosa neon e mostarda; formas
 * arredondadas, linhas limpas, luz de néon. Arte 100% procedural.
 * Mesma geometria do gerador, outra pele.
 */

import { RNG } from '../rng';
import type { RoomKind } from '../types';
import type { CanvasFactory, Ctx, TileOpts } from '../render/textures';
import type { SpriteEnv, DoorEnv } from '../render/sprites';
import type { MapStyle, WallTrimSeg } from './style';

// ---------- paleta era atômica ----------

const CREAM = '#f2e7cf';
const CREAM_DK = '#d9c8a4';
const TEAL = '#2ec4b6';
const TEAL_DK = '#1b8f84';
const ORANGE = '#ff9f1c';
const PINK = '#ff5d8f';
const MUSTARD = '#f4c95d';
const PLUM = '#2a1830';
const PLUM_DK = '#1c0f22';

function mkCtx(create: CanvasFactory, px: number): { c: HTMLCanvasElement; x: Ctx } {
  const c = create(px, px);
  return { c, x: c.getContext('2d') as Ctx };
}

function roundRect(x: Ctx, rx: number, ry: number, w: number, h: number, r: number): void {
  x.beginPath();
  x.moveTo(rx + r, ry);
  x.arcTo(rx + w, ry, rx + w, ry + h, r);
  x.arcTo(rx + w, ry + h, rx, ry + h, r);
  x.arcTo(rx, ry + h, rx, ry, r);
  x.arcTo(rx, ry, rx + w, ry, r);
  x.closePath();
}

/** desgaste: tinta desbotada, rachaduras finas, poeira — NUNCA ferrugem */
function wearAtomic(x: Ctx, px: number, rng: RNG, wear: number): void {
  if (wear >= 1) {
    // manchas de desbotamento suaves
    for (let i = 0; i < 2 + wear * 2; i++) {
      const cx = rng.range(0, px), cy = rng.range(0, px);
      const r = rng.range(px * 0.08, px * 0.22);
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(240,232,210,${0.05 + wear * 0.02})`);
      g.addColorStop(1, 'rgba(240,232,210,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
    for (let i = 0; i < 90 * wear; i++) {
      x.fillStyle = `rgba(30,18,36,${rng.range(0.03, 0.1)})`;
      x.fillRect(rng.range(0, px), rng.range(0, px), rng.range(0.6, 2), rng.range(0.6, 2));
    }
  }
  if (wear >= 2) {
    // rachaduras finas escuras
    for (let i = 0; i < wear; i++) {
      let cx = rng.range(0, px), cy = rng.range(0, px);
      let ang = rng.range(0, Math.PI * 2);
      x.strokeStyle = 'rgba(28,16,34,0.4)';
      x.lineWidth = rng.range(0.6, 1.2);
      x.beginPath(); x.moveTo(cx, cy);
      for (let s = 0; s < rng.int(4, 7); s++) {
        ang += rng.jitter(0.7);
        const len = rng.range(px * 0.02, px * 0.045);
        cx += Math.cos(ang) * len;
        cy += Math.sin(ang) * len;
        x.lineTo(cx, cy);
      }
      x.stroke();
    }
  }
}

// ---------- pisos ----------

/** vinil turquesa: quadrados com cantos arredondados e rejunte creme */
function floorVinyl(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 211);
  const px = o.px;
  const n = 4;
  const cell = px / n;

  x.fillStyle = CREAM_DK;
  x.fillRect(0, 0, px, px);
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const v = rng.range(-10, 10);
      const g = x.createRadialGradient(
        gx * cell + cell * 0.35, gy * cell + cell * 0.3, cell * 0.1,
        gx * cell + cell / 2, gy * cell + cell / 2, cell * 0.75,
      );
      g.addColorStop(0, `rgb(${64 + v},${196 + v},${182 + v})`);
      g.addColorStop(1, `rgb(${38 + v},${150 + v},${140 + v})`);
      x.fillStyle = g;
      roundRect(x, gx * cell + cell * 0.06, gy * cell + cell * 0.06, cell * 0.88, cell * 0.88, cell * 0.16);
      x.fill();
      // brilho de verniz no canto superior
      x.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(x, gx * cell + cell * 0.14, gy * cell + cell * 0.1, cell * 0.5, cell * 0.16, cell * 0.08);
      x.fill();
    }
  }
  wearAtomic(x, px, rng, o.wear);
  return c;
}

/** salão: xadrez creme/laranja pastel, peças com cantos bem arredondados */
function floorChecker(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 223);
  const px = o.px;
  const n = 4;
  const cell = px / n;

  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const even = (gx + gy) % 2 === 0;
      const v = rng.range(-6, 6);
      const base = even ? [242 + v, 231 + v, 207 + v] : [255, 178 + v, 92 + v];
      const g = x.createLinearGradient(gx * cell, gy * cell, gx * cell, gy * cell + cell);
      g.addColorStop(0, `rgb(${base[0]},${base[1]},${base[2]})`);
      g.addColorStop(1, `rgb(${base[0] - 18},${base[1] - 18},${base[2] - 14})`);
      x.fillStyle = g;
      roundRect(x, gx * cell + 1, gy * cell + 1, cell - 2, cell - 2, cell * 0.18);
      x.fill();
      x.strokeStyle = 'rgba(42,24,48,0.35)';
      x.lineWidth = 1;
      x.stroke();
    }
  }
  wearAtomic(x, px, rng, o.wear);
  return c;
}

/** área técnica: borracha ameixa com confete mostarda */
function floorRubber(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 227);
  const px = o.px;

  const g = x.createLinearGradient(0, 0, px, px);
  g.addColorStop(0, '#33203a');
  g.addColorStop(0.5, '#3c2744');
  g.addColorStop(1, '#2c1a33');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  for (let i = 0; i < 700; i++) {
    const v = rng.range(-14, 14);
    x.fillStyle = `rgba(${244 + v},${201 + v},${93 + v},${rng.range(0.06, 0.18)})`;
    x.beginPath();
    x.arc(rng.range(0, px), rng.range(0, px), rng.range(0.5, 1.6), 0, Math.PI * 2);
    x.fill();
  }
  // linhas de divisão de tapete
  x.strokeStyle = 'rgba(244,201,93,0.16)';
  x.lineWidth = Math.max(1.4, px * 0.008);
  const step = px / 2;
  for (let i = 0; i <= 2; i++) {
    x.beginPath(); x.moveTo(i * step, 0); x.lineTo(i * step, px); x.stroke();
    x.beginPath(); x.moveTo(0, i * step); x.lineTo(px, i * step); x.stroke();
  }
  wearAtomic(x, px, rng, o.wear);
  return c;
}

/** corredor: passadeira mostarda com bordas creme/turquesa */
function floorRunner(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 229);
  const px = o.px;

  x.fillStyle = CREAM;
  x.fillRect(0, 0, px, px);
  const stripe = px * 0.09;
  x.fillStyle = TEAL;
  x.fillRect(0, stripe * 0.6, px, stripe * 0.5);
  x.fillRect(0, px - stripe * 1.1, px, stripe * 0.5);
  const g = x.createLinearGradient(0, 0, px, 0);
  g.addColorStop(0, '#e5b84a');
  g.addColorStop(0.5, '#f4c95d');
  g.addColorStop(1, '#e0b346');
  x.fillStyle = g;
  x.fillRect(0, stripe * 1.6, px, px - stripe * 3.2);
  // losangos decorativos
  x.fillStyle = 'rgba(255,93,143,0.5)';
  const dw = px / 4;
  for (let i = 0; i < 4; i++) {
    const cx = i * dw + dw / 2;
    const cy = px / 2;
    x.beginPath();
    x.moveTo(cx, cy - px * 0.09);
    x.lineTo(cx + px * 0.055, cy);
    x.lineTo(cx, cy + px * 0.09);
    x.lineTo(cx - px * 0.055, cy);
    x.closePath();
    x.fill();
  }
  wearAtomic(x, px, rng, o.wear);
  return c;
}

// ---------- parede e casco ----------

/** parede creme: painéis arredondados com faixa turquesa na altura do quadril */
function wallCream(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 233);
  const px = o.px;

  const g = x.createLinearGradient(0, 0, 0, px);
  g.addColorStop(0, '#efe3c8');
  g.addColorStop(0.45, '#f4ead2');
  g.addColorStop(0.8, '#e2d3b0');
  g.addColorStop(1, '#cbb98f');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);

  // painéis com emendas arredondadas (faixa horizontal = espessura da parede)
  const panels = 2;
  const pw = px / panels;
  for (let i = 0; i <= panels; i++) {
    const p = i * pw;
    x.strokeStyle = 'rgba(42,24,48,0.28)';
    x.lineWidth = Math.max(1.4, px * 0.01);
    x.beginPath();
    x.moveTo(p, px * 0.06);
    x.quadraticCurveTo(p + px * 0.02, px * 0.5, p, px * 0.94);
    x.stroke();
    x.strokeStyle = 'rgba(255,250,238,0.5)';
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(p + 2, px * 0.08);
    x.quadraticCurveTo(p + 2 + px * 0.02, px * 0.5, p + 2, px * 0.92);
    x.stroke();
  }

  // faixa turquesa na base (borda do piso)
  const band = px * 0.16;
  const bg = x.createLinearGradient(0, px - band, 0, px);
  bg.addColorStop(0, TEAL);
  bg.addColorStop(1, TEAL_DK);
  x.fillStyle = bg;
  x.fillRect(0, px - band, px, band);
  x.fillStyle = 'rgba(255,255,255,0.18)';
  x.fillRect(0, px - band, px, 2);

  wearAtomic(x, px, rng, o.wear);
  return c;
}

/** casco externo: concreto ameixa com grade sutil */
function hullPlum(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 239);
  const px = o.px;

  const g = x.createLinearGradient(0, 0, px, px);
  g.addColorStop(0, PLUM);
  g.addColorStop(1, PLUM_DK);
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  for (let i = 0; i < 500; i++) {
    const v = rng.range(-12, 12);
    x.fillStyle = `rgba(${58 + v},${36 + v},${66 + v},${rng.range(0.05, 0.16)})`;
    x.fillRect(rng.range(0, px), rng.range(0, px), rng.range(0.6, 2.2), rng.range(0.6, 2.2));
  }
  x.strokeStyle = 'rgba(255,93,143,0.07)';
  x.lineWidth = 1;
  const step = px / 4;
  for (let i = 0; i <= 4; i++) {
    x.beginPath(); x.moveTo(i * step, 0); x.lineTo(i * step, px); x.stroke();
    x.beginPath(); x.moveTo(0, i * step); x.lineTo(px, i * step); x.stroke();
  }
  return c;
}

/** fundo: noite ameixa com néons desfocados (bokeh) — cidade lá fora */
function paintAtomicBackground(x: Ctx, w: number, h: number, seed: number): void {
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#170b1d');
  g.addColorStop(0.6, '#221229');
  g.addColorStop(1, '#150a1a');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);

  const rng = new RNG(seed ^ 0x51ab3f);
  // bokeh de letreiros
  for (let i = 0; i < 26; i++) {
    const bx = rng.range(0, w);
    const by = rng.range(0, h);
    const br = rng.range(w * 0.01, w * 0.05);
    const col = rng.pick(['46,196,182', '255,93,143', '255,159,28', '244,201,93']);
    const bg = x.createRadialGradient(bx, by, 0, bx, by, br);
    bg.addColorStop(0, `rgba(${col},${rng.range(0.05, 0.14)})`);
    bg.addColorStop(0.7, `rgba(${col},${rng.range(0.02, 0.06)})`);
    bg.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = bg;
    x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
  }
}

// ---------- pintores de sprites ----------

function atomSymbol(x: Ctx, cx: number, cy: number, r: number, color: string): void {
  x.save();
  x.translate(cx, cy);
  x.strokeStyle = color;
  x.lineWidth = r * 0.16;
  for (let i = 0; i < 3; i++) {
    x.save();
    x.rotate((i * Math.PI) / 3);
    x.beginPath(); x.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2); x.stroke();
    x.restore();
  }
  x.restore();
}

function glowDot(x: Ctx, cx: number, cy: number, r: number, color: string, blur = r * 1.2): void {
  x.save();
  x.shadowColor = color;
  x.shadowBlur = blur;
  x.fillStyle = color;
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  x.restore();
}

const ATOMIC_PAINTERS: Record<string, (x: Ctx, w: number, h: number, env: SpriteEnv) => void> = {
  /** luminária atômica: tripé + globo de leite brilhante */
  floorLamp(x, w, h) {
    const r = Math.min(w, h) / 2;
    // base e tripé
    x.fillStyle = CREAM_DK;
    x.beginPath(); x.arc(0, r * 0.32, r * 0.42, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#8f7f5c';
    x.lineWidth = r * 0.09;
    for (const a of [-0.5, 0.5]) {
      x.beginPath(); x.moveTo(0, r * 0.1); x.lineTo(Math.sin(a) * r * 0.5, r * 0.42); x.stroke();
    }
    x.fillStyle = '#b9a87e';
    x.fillRect(-r * 0.05, -r * 0.45, r * 0.1, r * 0.6);
    // globo opalino
    const g = x.createRadialGradient(-r * 0.12, -r * 0.55, r * 0.05, 0, -r * 0.45, r * 0.34);
    g.addColorStop(0, '#fffdf4');
    g.addColorStop(0.7, '#fdeec9');
    g.addColorStop(1, '#e8c98e');
    x.save();
    x.shadowColor = '#ffe9b8';
    x.shadowBlur = r * 0.5;
    x.fillStyle = g;
    x.beginPath(); x.arc(0, -r * 0.42, r * 0.3, 0, Math.PI * 2); x.fill();
    x.restore();
    // anel equatorial
    x.strokeStyle = TEAL;
    x.lineWidth = r * 0.07;
    x.beginPath(); x.ellipse(0, -r * 0.42, r * 0.31, r * 0.1, 0, 0, Math.PI * 2); x.stroke();
  },

  /** mesa átomo: tampo redondo creme com símbolo atômico brilhante */
  holotable(x, w, h) {
    const r = Math.min(w, h) / 2 - 0.08;
    x.fillStyle = 'rgba(20,10,26,0.35)';
    x.beginPath(); x.ellipse(0.05, 0.08, r * 0.96, r * 0.9, 0, 0, Math.PI * 2); x.fill();
    const g = x.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#faf1dc');
    g.addColorStop(0.8, '#e8d9b6');
    g.addColorStop(1, '#c9b78c');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = TEAL_DK;
    x.lineWidth = 0.06;
    x.stroke();
    // borda laranja
    x.strokeStyle = ORANGE;
    x.lineWidth = 0.035;
    x.beginPath(); x.arc(0, 0, r * 0.86, 0, Math.PI * 2); x.stroke();
    x.save();
    x.shadowColor = PINK;
    x.shadowBlur = 0.18;
    atomSymbol(x, 0, 0, r * 0.55, 'rgba(255,93,143,0.9)');
    x.restore();
    glowDot(x, 0, 0, r * 0.09, PINK, 0.22);
  },

  /** console retrô: caixa arredondada com mostrador e teclas candy */
  console(x, w, h, env) {
    x.fillStyle = 'rgba(20,10,26,0.3)';
    roundRect(x, -w / 2 + 0.04, -h / 2 + 0.06, w, h, 0.14);
    x.fill();
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#f6ecd4');
    g.addColorStop(1, '#d9c8a4');
    x.fillStyle = g;
    roundRect(x, -w / 2, -h / 2, w, h, 0.14);
    x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.4)';
    x.lineWidth = 0.025;
    x.stroke();
    // tela oval
    const scrW = w * 0.42;
    x.fillStyle = PLUM;
    x.beginPath(); x.ellipse(-w * 0.18, 0, scrW / 2, h * 0.3, 0, 0, Math.PI * 2); x.fill();
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.12;
    x.strokeStyle = TEAL;
    x.lineWidth = 0.03;
    x.beginPath(); x.ellipse(-w * 0.18, 0, scrW / 2 - 0.03, h * 0.3 - 0.03, 0, 0, Math.PI * 2); x.stroke();
    // linha de varredura
    x.strokeStyle = 'rgba(46,196,182,0.75)';
    x.lineWidth = 0.025;
    const sy = Math.sin(env.variant * 2.1) * h * 0.14;
    x.beginPath(); x.moveTo(-w * 0.18 - scrW * 0.36, sy); x.lineTo(-w * 0.18 + scrW * 0.36, sy); x.stroke();
    x.restore();
    // mostrador redondo + teclas
    x.fillStyle = CREAM;
    x.beginPath(); x.arc(w * 0.18, -h * 0.12, h * 0.14, 0, Math.PI * 2); x.fill();
    x.strokeStyle = ORANGE;
    x.lineWidth = 0.03;
    x.beginPath(); x.arc(w * 0.18, -h * 0.12, h * 0.1, 0, Math.PI * 2); x.stroke();
    const keys = [PINK, TEAL, MUSTARD];
    for (let i = 0; i < 3; i++) {
      glowDot(x, w * 0.1 + i * w * 0.09, h * 0.22, h * 0.055, keys[(env.variant + i) % 3], 0.06);
    }
  },

  /** cápsula de descanso: leito arredondado com grande vigia */
  cryopod(x, w, h) {
    x.fillStyle = 'rgba(20,10,26,0.3)';
    roundRect(x, -w / 2 + 0.04, -h / 2 + 0.06, w, h, w * 0.4);
    x.fill();
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#f6ecd4');
    g.addColorStop(1, '#cfc09a');
    x.fillStyle = g;
    roundRect(x, -w / 2, -h / 2, w, h, w * 0.4);
    x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.4)';
    x.lineWidth = 0.025;
    x.stroke();
    // vigia circular
    const cy = -h * 0.1;
    x.fillStyle = PLUM;
    x.beginPath(); x.arc(0, cy, w * 0.32, 0, Math.PI * 2); x.fill();
    const pg = x.createRadialGradient(-w * 0.1, cy - w * 0.1, 0.02, 0, cy, w * 0.32);
    pg.addColorStop(0, 'rgba(46,196,182,0.85)');
    pg.addColorStop(1, 'rgba(27,143,132,0.25)');
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.16;
    x.fillStyle = pg;
    x.beginPath(); x.arc(0, cy, w * 0.26, 0, Math.PI * 2); x.fill();
    x.restore();
    // base acolchoada
    x.fillStyle = TEAL_DK;
    roundRect(x, -w * 0.28, h * 0.18, w * 0.56, h * 0.24, w * 0.12);
    x.fill();
  },

  /** caixa arredondada com faixa turquesa e etiqueta laranja */
  crate(x, w, h) {
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#efe3c8');
    g.addColorStop(1, '#cbb98f');
    x.fillStyle = g;
    roundRect(x, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.18);
    x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.4)';
    x.lineWidth = 0.025;
    x.stroke();
    x.fillStyle = TEAL;
    roundRect(x, -w / 2, -h * 0.1, w, h * 0.2, h * 0.06);
    x.fill();
    x.fillStyle = ORANGE;
    roundRect(x, -w * 0.16, -h * 0.32, w * 0.32, h * 0.26, h * 0.06);
    x.fill();
    x.fillStyle = PLUM;
    x.font = `bold ${h * 0.2}px sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('☢', 0, -h * 0.19);
  },

  /** rack de válvulas: armário arredondado com fileiras de tubos brilhantes */
  serverRack(x, w, h, env) {
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#e8dab8');
    g.addColorStop(1, '#c2b28a');
    x.fillStyle = g;
    roundRect(x, -w / 2, -h / 2, w, h, w * 0.18);
    x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.4)';
    x.lineWidth = 0.025;
    x.stroke();
    const cols = [TEAL, PINK, ORANGE];
    for (let r = 0; r < 4; r++) {
      const ry = -h * 0.32 + r * h * 0.2;
      x.fillStyle = PLUM;
      roundRect(x, -w * 0.32, ry, w * 0.64, h * 0.12, h * 0.05);
      x.fill();
      const col = cols[(env.variant + r) % 3];
      x.save();
      x.shadowColor = col;
      x.shadowBlur = 0.08;
      x.fillStyle = col;
      x.beginPath();
      x.arc(-w * 0.2 + (r % 2) * w * 0.4, ry + h * 0.06, h * 0.032, 0, Math.PI * 2);
      x.fill();
      x.restore();
    }
  },

  /** gerador atômico: máquina arredondada com cúpula e núcleo brilhante */
  generator(x, w, h) {
    x.fillStyle = 'rgba(20,10,26,0.35)';
    roundRect(x, -w / 2 + 0.05, -h / 2 + 0.07, w, h, 0.2);
    x.fill();
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#f0e5ca');
    g.addColorStop(1, '#c9b78c');
    x.fillStyle = g;
    roundRect(x, -w / 2, -h / 2, w, h, 0.2);
    x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.4)';
    x.lineWidth = 0.025;
    x.stroke();
    // cúpula com núcleo
    const dr = Math.min(w, h) * 0.26;
    const dg = x.createRadialGradient(0, -h * 0.08, dr * 0.1, 0, -h * 0.08, dr);
    dg.addColorStop(0, '#fff6da');
    dg.addColorStop(0.65, '#f4c95d');
    dg.addColorStop(1, '#c98f2a');
    x.save();
    x.shadowColor = ORANGE;
    x.shadowBlur = 0.2;
    x.fillStyle = dg;
    x.beginPath(); x.arc(0, -h * 0.08, dr, 0, Math.PI * 2); x.fill();
    x.restore();
    atomSymbol(x, 0, -h * 0.08, dr * 0.6, 'rgba(42,24,48,0.7)');
    // aletas
    x.strokeStyle = TEAL_DK;
    x.lineWidth = 0.04;
    for (const dir of [-1, 1]) {
      x.beginPath();
      x.moveTo(dir * w * 0.28, h * 0.05);
      x.lineTo(dir * w * 0.42, h * 0.38);
      x.stroke();
    }
  },

  /** célula de energia: cilindro com líquido turquesa brilhante */
  powerCell(x, w, h) {
    const r = Math.min(w, h) / 2 - 0.05;
    const g = x.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#f6ecd4');
    g.addColorStop(1, '#cbb98f');
    x.fillStyle = g;
    roundRect(x, -r * 0.7, -r, r * 1.4, r * 2, r * 0.3);
    x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.45)';
    x.lineWidth = 0.025;
    x.stroke();
    const lg = x.createLinearGradient(0, -r * 0.7, 0, r * 0.7);
    lg.addColorStop(0, '#7ce9de');
    lg.addColorStop(0.5, TEAL);
    lg.addColorStop(1, TEAL_DK);
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.16;
    x.fillStyle = lg;
    roundRect(x, -r * 0.44, -r * 0.7, r * 0.88, r * 1.4, r * 0.22);
    x.fill();
    x.restore();
    // bolhas
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.beginPath(); x.arc(-r * 0.15, -r * 0.3, r * 0.07, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(r * 0.12, r * 0.2, r * 0.05, 0, Math.PI * 2); x.fill();
  },

  /** tubulação lisa: canos turquesa com juntas arredondadas */
  pipeRun(x, w, h) {
    const r = h / 2;
    x.lineCap = 'round';
    for (const [off, col, lw] of [[0, TEAL_DK, r * 1.5], [-r * 0.28, TEAL, r * 0.55]] as const) {
      x.strokeStyle = col;
      x.lineWidth = lw;
      x.beginPath(); x.moveTo(-w / 2, off); x.lineTo(w / 2, off); x.stroke();
    }
    // juntas
    for (const jx of [-w * 0.3, 0, w * 0.3]) {
      x.fillStyle = CREAM;
      x.beginPath(); x.arc(jx, -r * 0.28, r * 0.42, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(42,24,48,0.4)';
      x.lineWidth = 0.02;
      x.stroke();
    }
  },

  /** ventilação: grade circular */
  vent(x, w, h) {
    const r = Math.min(w, h) / 2 - 0.04;
    const g = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#efe3c8');
    g.addColorStop(1, '#b3a17a');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.45)';
    x.lineWidth = 0.03;
    x.stroke();
    x.fillStyle = PLUM;
    x.beginPath(); x.arc(0, 0, r * 0.68, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(242,231,207,0.7)';
    x.lineWidth = 0.03;
    for (let i = -2; i <= 2; i++) {
      x.beginPath(); x.moveTo(i * r * 0.22, -r * 0.6); x.lineTo(i * r * 0.22, r * 0.6); x.stroke();
    }
  },

  /** banco diner: assento vinil turquesa com costuras */
  bench(x, w, h) {
    x.fillStyle = 'rgba(20,10,26,0.3)';
    roundRect(x, -w / 2 + 0.04, -h / 2 + 0.06, w, h, h * 0.4);
    x.fill();
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#3fd6c7');
    g.addColorStop(1, TEAL_DK);
    x.fillStyle = g;
    roundRect(x, -w / 2, -h / 2, w, h, h * 0.4);
    x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.5)';
    x.lineWidth = 0.02;
    x.stroke();
    x.strokeStyle = 'rgba(242,231,207,0.55)';
    x.lineWidth = 0.025;
    x.setLineDash([0.08, 0.06]);
    roundRect(x, -w / 2 + 0.07, -h / 2 + 0.07, w - 0.14, h - 0.14, h * 0.3);
    x.stroke();
    x.setLineDash([]);
    // pés cromados
    x.fillStyle = '#d9d3c2';
    x.fillRect(-w * 0.38, h / 2 - 0.06, 0.07, 0.08);
    x.fillRect(w * 0.38 - 0.07, h / 2 - 0.06, 0.07, 0.08);
  },

  /** escada descendente: espiral arredondada com fio neon rosa */
  stairsDown(x, w, h) {
    const r = Math.min(w, h) / 2 - 0.05;
    x.fillStyle = PLUM;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = CREAM_DK;
    x.lineWidth = 0.07;
    x.stroke();
    // degraus em espiral
    for (let i = 0; i < 7; i++) {
      const a0 = i * 0.55;
      const rr = r * (0.92 - i * 0.1);
      x.strokeStyle = `rgba(242,231,207,${0.85 - i * 0.09})`;
      x.lineWidth = r * 0.09;
      x.beginPath(); x.arc(0, 0, rr, a0, a0 + 1.5); x.stroke();
    }
    x.fillStyle = '#0e0714';
    x.beginPath(); x.arc(0, 0, r * 0.16, 0, Math.PI * 2); x.fill();
    x.save();
    x.shadowColor = PINK;
    x.shadowBlur = 0.2;
    x.strokeStyle = PINK;
    x.lineWidth = 0.045;
    x.beginPath(); x.arc(0, 0, r * 0.98, -0.4, Math.PI * 0.9); x.stroke();
    x.restore();
    glowDot(x, r * 0.82, -r * 0.55, 0.05, PINK, 0.14);
  },
};

// ---------- portas ----------

/** porta de era atômica: folhas arredondadas creme/turquesa com vigia e arco neon */
function paintAtomicDoor(x: Ctx, env: DoorEnv): void {
  const w = env.width;
  const t = env.t;
  const framePad = 0.22;
  const fw = w + framePad * 2;
  const fh = t * 2 + 0.3;

  // sombra de embutir
  x.fillStyle = 'rgba(15,7,20,0.45)';
  roundRect(x, -fw / 2 + 0.03, -fh / 2 + 0.05, fw, fh, 0.18);
  x.fill();

  // moldura creme arredondada
  const fg = x.createLinearGradient(0, -fh / 2, 0, fh / 2);
  fg.addColorStop(0, '#f6ecd4');
  fg.addColorStop(0.55, '#e2d3b0');
  fg.addColorStop(1, '#b3a17a');
  x.fillStyle = fg;
  roundRect(x, -fw / 2, -fh / 2, fw, fh, 0.18);
  x.fill();
  x.strokeStyle = 'rgba(42,24,48,0.45)';
  x.lineWidth = 0.025;
  x.stroke();

  // arco neon rosa sobre o vão
  x.save();
  x.shadowColor = PINK;
  x.shadowBlur = 0.14;
  x.strokeStyle = 'rgba(255,93,143,0.85)';
  x.lineWidth = 0.04;
  x.beginPath();
  x.arc(0, 0, fw * 0.42, Math.PI * 1.15, Math.PI * 1.85);
  x.stroke();
  x.restore();

  // abertura
  const gapW = w * 0.16;
  x.fillStyle = PLUM_DK;
  x.fillRect(-w / 2, -t / 2 - 0.06, w, t + 0.12);
  x.save();
  x.shadowColor = TEAL;
  x.shadowBlur = 0.14;
  x.fillStyle = 'rgba(46,196,182,0.4)';
  x.fillRect(-gapW / 2, -t / 2 - 0.06, gapW, t + 0.12);
  x.restore();

  // folhas deslizantes arredondadas
  const panelW = (w - gapW) / 2;
  for (const dir of [-1, 1]) {
    const px = dir === -1 ? -w / 2 : gapW / 2;
    const pg = x.createLinearGradient(0, -t / 2, 0, t / 2);
    pg.addColorStop(0, '#3fd6c7');
    pg.addColorStop(0.5, TEAL);
    pg.addColorStop(1, TEAL_DK);
    x.fillStyle = pg;
    roundRect(x, px, -t / 2 - 0.04, panelW, t + 0.08, 0.08);
    x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.5)';
    x.lineWidth = 0.02;
    x.stroke();
    // faixa creme no painel
    x.fillStyle = 'rgba(242,231,207,0.85)';
    roundRect(x, px + 0.05, -0.03, panelW - 0.1, 0.06, 0.03);
    x.fill();
  }

  if (env.type === 'round') {
    // porta circular com vigia
    const cr = Math.min(t * 0.55, fh * 0.32);
    x.fillStyle = CREAM;
    x.beginPath(); x.arc(0, 0, cr, 0, Math.PI * 2); x.fill();
    x.strokeStyle = ORANGE;
    x.lineWidth = 0.045;
    x.beginPath(); x.arc(0, 0, cr, 0, Math.PI * 2); x.stroke();
    const vg = x.createRadialGradient(-cr * 0.2, -cr * 0.2, cr * 0.05, 0, 0, cr * 0.62);
    vg.addColorStop(0, '#ffe9b8');
    vg.addColorStop(1, '#e8963c');
    x.save();
    x.shadowColor = ORANGE;
    x.shadowBlur = 0.12;
    x.fillStyle = vg;
    x.beginPath(); x.arc(0, 0, cr * 0.6, 0, Math.PI * 2); x.fill();
    x.restore();
    // raios do volante
    x.strokeStyle = 'rgba(42,24,48,0.6)';
    x.lineWidth = 0.03;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      x.beginPath();
      x.moveTo(-Math.cos(a) * cr * 0.5, -Math.sin(a) * cr * 0.5);
      x.lineTo(Math.cos(a) * cr * 0.5, Math.sin(a) * cr * 0.5);
      x.stroke();
    }
  } else if (env.type === 'blast') {
    // porta-cofre: chevrons laranja + luz vermelha
    x.fillStyle = ORANGE;
    for (let i = -1; i <= 1; i++) {
      const cx = (i * w) / 4;
      x.beginPath();
      x.moveTo(cx - 0.12, -t * 0.26);
      x.lineTo(cx, -t * 0.1);
      x.lineTo(cx + 0.12, -t * 0.26);
      x.lineTo(cx + 0.12, -t * 0.12);
      x.lineTo(cx, t * 0.04);
      x.lineTo(cx - 0.12, -t * 0.12);
      x.closePath();
      x.fill();
    }
    glowDot(x, 0, -fh / 2 - 0.03, 0.035, PINK, 0.12);
  }

  // postes com luz de status candy
  for (const dir of [-1, 1]) {
    const lx = dir * (fw / 2 - 0.06);
    x.fillStyle = PLUM;
    x.fillRect(lx - 0.035, -fh / 2 - 0.05, 0.07, fh + 0.1);
    glowDot(x, lx, -fh / 2 - 0.02, 0.03, TEAL, 0.1);
  }

  // soleira mostarda
  x.fillStyle = MUSTARD;
  roundRect(x, -w / 2 - 0.1, fh / 2 + 0.02, w + 0.2, 0.09, 0.04);
  x.fill();
}

/** cap de corredor: anel neon turquesa (dock) ou cofre redondo mostarda (bulkhead) */
function paintAtomicCap(x: Ctx, kind: 'dock' | 'bulkhead', width: number): void {
  const r = width / 2 + 0.35;
  if (kind === 'dock') {
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.22;
    x.strokeStyle = 'rgba(46,196,182,0.9)';
    x.lineWidth = 0.08;
    x.beginPath(); x.arc(0, 0, r * 0.72, 0, Math.PI * 2); x.stroke();
    x.restore();
    x.strokeStyle = '#e2d3b0';
    x.lineWidth = 0.16;
    x.beginPath(); x.arc(0, 0, r * 0.9, 0, Math.PI * 2); x.stroke();
    x.fillStyle = PLUM_DK;
    x.beginPath(); x.arc(0, 0, r * 0.55, 0, Math.PI * 2); x.fill();
    glowDot(x, 0, 0, 0.06, PINK, 0.16);
  } else {
    const g = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#f4c95d');
    g.addColorStop(0.7, '#dfa93a');
    g.addColorStop(1, '#a97c22');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(42,24,48,0.5)';
    x.lineWidth = 0.03;
    x.stroke();
    x.strokeStyle = 'rgba(42,24,48,0.4)';
    x.lineWidth = 0.028;
    x.beginPath(); x.arc(0, 0, r * 0.66, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.4, 0, Math.PI * 2); x.stroke();
    x.fillStyle = CREAM;
    roundRect(x, -r * 0.95, -0.09, r * 1.9, 0.18, 0.08);
    x.fill();
    atomSymbol(x, 0, 0, r * 0.22, 'rgba(42,24,48,0.65)');
    glowDot(x, 0, 0, 0.055, ORANGE, 0.14);
  }
}

// ---------- detalhe de parede ----------

/** trim atômico: cinta neon arredondada (alterna rosa/turquesa), rebites redondos, faixa laranja */
function paintAtomicTrim(x: Ctx, seg: WallTrimSeg, wear: number, rng: RNG): void {
  const { o, d, a0, a1, inW, t } = seg;
  const p0 = { x: o.x + d.x * a0, y: o.y + d.y * a0 };
  const p1 = { x: o.x + d.x * a1, y: o.y + d.y * a1 };
  // chanfro claro junto ao piso
  x.strokeStyle = 'rgba(255,248,230,0.4)';
  x.lineWidth = 0.04;
  x.beginPath(); x.moveTo(p0.x, p0.y); x.lineTo(p1.x, p1.y); x.stroke();
  x.strokeStyle = 'rgba(42,24,48,0.4)';
  x.lineWidth = 0.05;
  x.beginPath();
  x.moveTo(p0.x - inW.x * 0.06, p0.y - inW.y * 0.06);
  x.lineTo(p1.x - inW.x * 0.06, p1.y - inW.y * 0.06);
  x.stroke();

  // cinta neon em segmentos com extremidades redondas
  const stripOff = 0.12;
  const segs = Math.floor((a1 - a0) / 0.9);
  for (let si = 0; si < segs; si++) {
    if (wear >= 1 && rng.chance(wear * 0.14)) continue; // segmento queimado
    const u0 = a0 + 0.25 + si * 0.9;
    const u1 = Math.min(u0 + 0.55, a1 - 0.25);
    if (u1 - u0 < 0.15) continue;
    const col = si % 2 === 0 ? '255,93,143' : '46,196,182';
    x.lineCap = 'round';
    x.save();
    x.shadowColor = `rgba(${col},1)`;
    x.shadowBlur = 0.08;
    x.strokeStyle = `rgba(${col},0.55)`;
    x.lineWidth = 0.05;
    x.beginPath();
    x.moveTo(o.x + d.x * u0 + inW.x * stripOff, o.y + d.y * u0 + inW.y * stripOff);
    x.lineTo(o.x + d.x * u1 + inW.x * stripOff, o.y + d.y * u1 + inW.y * stripOff);
    x.stroke();
    x.restore();
  }

  // emendas arredondadas a cada ~2.2m + rebites redondos
  const seams = Math.floor((a1 - a0) / 2.2);
  for (let si = 1; si <= seams; si++) {
    const u = a0 + (si * (a1 - a0)) / (seams + 1);
    const px = o.x + d.x * u, py = o.y + d.y * u;
    x.strokeStyle = 'rgba(42,24,48,0.3)';
    x.lineWidth = 0.03;
    x.beginPath();
    x.moveTo(px + inW.x * 0.03, py + inW.y * 0.03);
    x.lineTo(px + inW.x * (t - 0.03), py + inW.y * (t - 0.03));
    x.stroke();
    // rebite com anel laranja
    x.fillStyle = 'rgba(255,159,28,0.8)';
    x.beginPath();
    x.arc(px + inW.x * (t * 0.5), py + inW.y * (t * 0.5), 0.03, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = 'rgba(42,24,48,0.55)';
    x.beginPath();
    x.arc(px + inW.x * (t * 0.5), py + inW.y * (t * 0.5), 0.014, 0, Math.PI * 2);
    x.fill();
  }
}

// ---------- estilo ----------

export const retrofuturista: MapStyle = {
  id: 'retrofuturista',
  label: 'Retrofuturista (era atômica)',

  floors: {
    vinyl: floorVinyl,
    checker: floorChecker,
    rubber: floorRubber,
    runner: floorRunner,
  },
  defaultFloor: 'vinyl',
  wall: wallCream,
  hull: hullPlum,

  paintBackground: paintAtomicBackground,
  atmosphere: (create, w, h) => {
    const c = create(w, h);
    const x = c.getContext('2d') as Ctx;
    // vinheta ameixa suave (sem grão pesado — estética limpa)
    const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(28,15,34,0)');
    g.addColorStop(1, 'rgba(20,9,26,0.5)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    return c;
  },
  darknessColor: '30,16,36',

  floorTint: (_room, rng) => {
    const pick = rng.pick(['46,196,182', '255,159,28', '255,93,143', '244,201,93']);
    return `rgba(${pick},0.045)`;
  },
  labelStyle: {
    font: (px) => `bold ${px}px "Trebuchet MS", Verdana, sans-serif`,
    color: 'rgba(242,231,207,0.45)',
    codeColor: 'rgba(46,196,182,0.4)',
    code: (room) => `BLOCO ${room.id.toUpperCase()}`,
  },

  paintWallTrim: paintAtomicTrim,
  paintExtraWall: (x, a, b, t) => {
    x.strokeStyle = 'rgba(28,15,34,0.9)';
    x.lineWidth = t * 2.4;
    x.lineCap = 'butt';
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.strokeStyle = 'rgba(226,211,176,0.75)';
    x.lineWidth = t * 0.7;
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.save();
    x.shadowColor = PINK;
    x.shadowBlur = 0.1;
    x.strokeStyle = 'rgba(255,93,143,0.5)';
    x.lineWidth = t * 0.25;
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.restore();
  },

  paintDoor: paintAtomicDoor,
  paintCorridorCap: paintAtomicCap,
  doorLight: { r: 1.9, strength: 0.45 },
  doorGlow: { r: 0.55, alpha: 0.22, color: '255,93,143' },

  propPainters: ATOMIC_PAINTERS,
  propLight: {
    floorLamp: { r: 5.4, strength: 0.9 },
    holotable: { r: 3.6, strength: 0.55 },
    console: { r: 1.8, strength: 0.4 },
    cryopod: { r: 2.0, strength: 0.35 },
    powerCell: { r: 1.9, strength: 0.45 },
    generator: { r: 3.2, strength: 0.5 },
  },
  propGlow: {
    floorLamp: { r: 1.5, alpha: 0.42, color: '255,233,184' },
    holotable: { r: 1.7, alpha: 0.4, color: '255,93,143' },
    console: { r: 0.75, alpha: 0.32, color: '46,196,182' },
    powerCell: { r: 0.85, alpha: 0.4, color: '46,196,182' },
    cryopod: { r: 0.75, alpha: 0.3, color: '46,196,182' },
    generator: { r: 1.2, alpha: 0.35, color: '255,159,28' },
  },

  catalog: {
    entry: [
      { type: 'console', w: 1.9, h: 0.9 }, { type: 'console', w: 1.9, h: 0.9 },
      { type: 'vent', w: 1.0, h: 1.0 }, { type: 'floorLamp', w: 1.3, h: 1.3 },
      { type: 'crate', w: 1.2, h: 1.2 },
    ],
    hall: [
      { type: 'holotable', w: 2.4, h: 2.4 }, { type: 'console', w: 1.9, h: 0.9 },
      { type: 'crate', w: 1.2, h: 1.2 }, { type: 'serverRack', w: 1.0, h: 2.0 },
      { type: 'floorLamp', w: 1.3, h: 1.3 }, { type: 'bench', w: 2.0, h: 0.9 },
    ],
    lab: [
      { type: 'bench', w: 2.0, h: 0.9 }, { type: 'bench', w: 2.0, h: 0.9 },
      { type: 'serverRack', w: 1.0, h: 2.0 }, { type: 'cryopod', w: 1.0, h: 2.3 },
      { type: 'floorLamp', w: 1.3, h: 1.3 }, { type: 'console', w: 1.9, h: 0.9 },
    ],
    utility: [
      { type: 'generator', w: 2.6, h: 1.7 }, { type: 'powerCell', w: 1.1, h: 1.1 },
      { type: 'powerCell', w: 1.1, h: 1.1 }, { type: 'pipeRun', w: 2.6, h: 0.6 },
      { type: 'vent', w: 1.0, h: 1.0 }, { type: 'floorLamp', w: 1.3, h: 1.3 },
    ],
    storage: [
      { type: 'crate', w: 1.2, h: 1.2 }, { type: 'crate', w: 1.2, h: 1.2 },
      { type: 'crate', w: 1.2, h: 1.2 }, { type: 'powerCell', w: 1.1, h: 1.1 },
      { type: 'floorLamp', w: 1.3, h: 1.3 },
    ],
    quarters: [
      { type: 'cryopod', w: 1.0, h: 2.3 }, { type: 'cryopod', w: 1.0, h: 2.3 },
      { type: 'bench', w: 2.0, h: 0.9 }, { type: 'console', w: 1.9, h: 0.9 },
      { type: 'floorLamp', w: 1.3, h: 1.3 },
    ],
    exit: [
      { type: 'stairsDown', w: 2.6, h: 2.6 },
      { type: 'crate', w: 1.2, h: 1.2 }, { type: 'crate', w: 1.2, h: 1.2 },
      { type: 'floorLamp', w: 1.3, h: 1.3 },
    ],
    corridor: [],
  },
  centerProps: ['holotable', 'generator', 'stairsDown', 'floorLamp'],
  lightProp: 'floorLamp',
  corridorDecor: { type: 'pipeRun', w: 2.4, h: 0.6 },
  labels: {
    entry: ['RECEPÇÃO'],
    exit: ['SELO ATÔMICO'],
    hall: ['SALÃO CÍVICO', 'GALERIA', 'ÁTRIO', 'SALA DE JANTAR'],
    lab: ['LABORATÓRIO', 'PESQUISA APLICADA', 'QUÍMICA', 'ENGENHARIA GENÉTICA'],
    utility: ['ENERGIA', 'REATOR', 'SUBESTAÇÃO', 'MANUTENÇÃO'],
    storage: ['DEPÓSITO', 'ESTOQUE', 'CARGA', 'SUPRIMENTOS'],
    quarters: ['MORADIA', 'ALOJAMENTO', 'REPÚBLICO'],
    corridor: [],
  },
  floorStyleFor: (kind: RoomKind) =>
    kind === 'hall' ? 'checker'
      : kind === 'utility' ? 'rubber'
        : kind === 'corridor' ? 'runner'
          : 'vinyl',
  doorTypes: ['sliding', 'sliding', 'round'],
  stubTypes: { entry: 'round', exit: 'blast' },
};
