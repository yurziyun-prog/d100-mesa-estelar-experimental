/**
 * Estilo MEDIEVAL — masmorra/castelo de fantasia.
 * Arte 100% procedural: pedra irregular, terra batida, madeira, ferro e
 * luz quente de braseiros. Mesma geometria do gerador, outra pele.
 */

import { RNG } from '../rng';
import type { RoomKind } from '../types';
import type { CanvasFactory, Ctx, TileOpts } from '../render/textures';
import type { SpriteEnv, DoorEnv } from '../render/sprites';
import type { MapStyle, WallTrimSeg } from './style';

// ---------- helpers de desenho ----------

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

function stoneShade(rng: RNG, base: [number, number, number], vary: number): string {
  const k = rng.range(-vary, vary);
  return `rgb(${Math.round(base[0] + k)},${Math.round(base[1] + k * 0.9)},${Math.round(base[2] + k * 0.75)})`;
}

/** desgaste: musgo, poeira e rachaduras */
function wearMedieval(x: Ctx, px: number, rng: RNG, wear: number): void {
  if (wear >= 1) {
    // musgo em manchas esverdeadas junto às juntas
    for (let i = 0; i < 3 + wear * 3; i++) {
      const cx = rng.range(0, px), cy = rng.range(px * 0.4, px);
      const r = rng.range(px * 0.05, px * 0.14);
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(74,92,44,${0.12 + wear * 0.05})`);
      g.addColorStop(1, 'rgba(74,92,44,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
    for (let i = 0; i < 140 * wear; i++) {
      x.fillStyle = `rgba(20,16,10,${rng.range(0.04, 0.14)})`;
      x.fillRect(rng.range(0, px), rng.range(0, px), rng.range(0.6, 2), rng.range(0.6, 2));
    }
  }
  if (wear >= 2) {
    for (let i = 0; i < 3 + wear * 2; i++) {
      let cx = rng.range(0, px), cy = rng.range(0, px);
      let ang = rng.range(0, Math.PI * 2);
      x.strokeStyle = 'rgba(12,10,8,0.5)';
      x.lineWidth = rng.range(0.7, 1.6);
      x.beginPath(); x.moveTo(cx, cy);
      for (let s = 0; s < rng.int(4, 8); s++) {
        ang += rng.jitter(0.8);
        const len = rng.range(px * 0.02, px * 0.05);
        cx += Math.cos(ang) * len;
        cy += Math.sin(ang) * len;
        x.lineTo(cx, cy);
      }
      x.stroke();
    }
  }
}

// ---------- pisos ----------

/** lajeirão irregular: pedras com juntas sinuosas e sombreamento radial */
function floorFlagstone(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 101);
  const px = o.px;
  const n = 4; // pedras por tile
  const cell = px / n;

  x.fillStyle = 'rgb(38,34,28)';
  x.fillRect(0, 0, px, px);
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const jx = rng.jitter(cell * 0.06);
      const jy = rng.jitter(cell * 0.06);
      const cx = gx * cell + cell / 2 + jx;
      const cy = gy * cell + cell / 2 + jy;
      const rw = cell * rng.range(0.42, 0.5);
      const rh = cell * rng.range(0.42, 0.5);
      const base: [number, number, number] = [96 + rng.range(-12, 14), 90 + rng.range(-10, 12), 80 + rng.range(-8, 10)];
      const g = x.createRadialGradient(cx - rw * 0.25, cy - rh * 0.3, rw * 0.1, cx, cy, Math.max(rw, rh) * 1.15);
      g.addColorStop(0, stoneShade(rng, base, 8));
      g.addColorStop(0.75, `rgb(${base[0] - 22},${base[1] - 20},${base[2] - 16})`);
      g.addColorStop(1, `rgb(${base[0] - 34},${base[1] - 31},${base[2] - 25})`);
      x.fillStyle = g;
      x.save();
      x.translate(cx, cy);
      x.rotate(rng.jitter(0.06));
      // contorno levemente irregular
      x.beginPath();
      const corners = 8;
      for (let i = 0; i <= corners; i++) {
        const a = (i / corners) * Math.PI * 2;
        const rr = 1 + rng.jitter(0.09);
        const pxp = Math.cos(a) * rw * rr;
        const pyp = Math.sin(a) * rh * rr;
        if (i === 0) x.moveTo(pxp, pyp); else x.lineTo(pxp, pyp);
      }
      x.closePath();
      x.fill();
      x.restore();
    }
  }
  wearMedieval(x, px, rng, o.wear);
  return c;
}

/** salão: grandes lajes polidas com anel gravado */
function floorHallSlabs(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 113);
  const px = o.px;
  const slabs = 2;
  const cell = px / slabs;

  for (let gy = 0; gy < slabs; gy++) {
    for (let gx = 0; gx < slabs; gx++) {
      const shade = rng.range(-8, 8);
      const g = x.createLinearGradient(gx * cell, gy * cell, gx * cell, gy * cell + cell);
      g.addColorStop(0, `rgb(${112 + shade},${105 + shade},${92 + shade})`);
      g.addColorStop(0.5, `rgb(${122 + shade},${115 + shade},${100 + shade})`);
      g.addColorStop(1, `rgb(${104 + shade},${97 + shade},${85 + shade})`);
      x.fillStyle = g;
      x.fillRect(gx * cell, gy * cell, cell, cell);
      // polimento: brilho diagonal suave
      x.fillStyle = 'rgba(255,244,220,0.045)';
      x.beginPath();
      x.moveTo(gx * cell, gy * cell + cell);
      x.lineTo(gx * cell + cell, gy * cell);
      x.lineTo(gx * cell + cell, gy * cell + cell * 0.35);
      x.lineTo(gx * cell + cell * 0.35, gy * cell + cell);
      x.closePath();
      x.fill();
    }
  }
  // juntas
  x.strokeStyle = 'rgba(24,20,15,0.85)';
  x.lineWidth = Math.max(1.6, px * 0.01);
  for (let i = 0; i <= slabs; i++) {
    const p = i * cell;
    x.beginPath(); x.moveTo(p, 0); x.lineTo(p, px); x.stroke();
    x.beginPath(); x.moveTo(0, p); x.lineTo(px, p); x.stroke();
  }
  // anel gravado central
  x.strokeStyle = 'rgba(30,26,20,0.5)';
  x.lineWidth = px * 0.012;
  x.beginPath(); x.arc(px / 2, px / 2, px * 0.3, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = 'rgba(235,225,200,0.10)';
  x.lineWidth = px * 0.006;
  x.beginPath(); x.arc(px / 2, px / 2 + 2, px * 0.3, 0, Math.PI * 2); x.stroke();

  wearMedieval(x, px, rng, o.wear);
  return c;
}

/** terra batida (cozinhas, despensas) */
function floorDirt(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 127);
  const px = o.px;
  const g = x.createLinearGradient(0, 0, px, px);
  g.addColorStop(0, 'rgb(86,70,50)');
  g.addColorStop(0.5, 'rgb(94,77,55)');
  g.addColorStop(1, 'rgb(80,65,46)');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  // grânulos
  for (let i = 0; i < 900; i++) {
    const v = rng.range(-16, 16);
    x.fillStyle = `rgba(${110 + v},${90 + v},${64 + v},${rng.range(0.08, 0.22)})`;
    x.fillRect(rng.range(0, px), rng.range(0, px), rng.range(0.5, 1.8), rng.range(0.5, 1.8));
  }
  // pedrinhas e palha
  for (let i = 0; i < 26; i++) {
    x.fillStyle = `rgba(60,55,48,${rng.range(0.3, 0.6)})`;
    x.beginPath();
    x.arc(rng.range(0, px), rng.range(0, px), rng.range(1, 3), 0, Math.PI * 2);
    x.fill();
  }
  x.strokeStyle = 'rgba(190,160,90,0.16)';
  x.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const sx = rng.range(0, px), sy = rng.range(0, px);
    x.beginPath(); x.moveTo(sx, sy);
    x.lineTo(sx + rng.jitter(14), sy + rng.jitter(14));
    x.stroke();
  }
  wearMedieval(x, px, rng, Math.max(o.wear, 1));
  return c;
}

/** corredor: degraus de pedra gastos ao longo do eixo */
function floorCorridorSteps(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 139);
  const px = o.px;
  const g = x.createLinearGradient(0, 0, px, 0);
  g.addColorStop(0, 'rgb(84,78,68)');
  g.addColorStop(0.5, 'rgb(94,88,76)');
  g.addColorStop(1, 'rgb(82,76,66)');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  // degraus: juntas horizontais a cada metro (o tile se repete no eixo)
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = i * (px / steps);
    x.strokeStyle = 'rgba(26,22,17,0.7)';
    x.lineWidth = Math.max(1.4, px * 0.008);
    x.beginPath(); x.moveTo(0, y); x.lineTo(px, y); x.stroke();
    x.strokeStyle = 'rgba(226,214,190,0.10)';
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(0, y + 1.6); x.lineTo(px, y + 1.6); x.stroke();
  }
  // desgaste central de passagem
  const w = x.createLinearGradient(0, 0, 0, px);
  w.addColorStop(0, 'rgba(40,34,26,0)');
  w.addColorStop(0.5, 'rgba(52,44,34,0.20)');
  w.addColorStop(1, 'rgba(40,34,26,0)');
  x.fillStyle = w;
  x.fillRect(0, 0, px, px);
  wearMedieval(x, px, rng, o.wear);
  return c;
}

// ---------- paredes e casco ----------

/** parede de pedra: silhares escuros com cursos defasados */
function wallStone(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 149);
  const px = o.px;
  const g = x.createLinearGradient(0, 0, px, px);
  g.addColorStop(0, 'rgb(52,48,42)');
  g.addColorStop(0.5, 'rgb(60,55,48)');
  g.addColorStop(1, 'rgb(46,42,37)');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);

  const rows = 4;
  const rh = px / rows;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * rh * 0.9;
    const bw = rh * 1.8;
    for (let bx = -bw; bx < px + bw; bx += bw) {
      const shade = rng.range(-9, 9);
      x.fillStyle = `rgba(${70 + shade},${64 + shade},${55 + shade},0.28)`;
      x.fillRect(bx + off + 2, r * rh + 2, bw - 4, rh - 4);
    }
  }
  // juntas
  x.strokeStyle = 'rgba(14,12,9,0.8)';
  x.lineWidth = Math.max(1.5, px * 0.009);
  for (let r = 0; r <= rows; r++) {
    x.beginPath(); x.moveTo(0, r * rh); x.lineTo(px, r * rh); x.stroke();
  }
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * rh * 0.9;
    const bw = rh * 1.8;
    for (let bx = -bw; bx < px + bw; bx += bw) {
      x.beginPath(); x.moveTo(bx + off, r * rh); x.lineTo(bx + off, (r + 1) * rh); x.stroke();
    }
  }
  // luz raspar de cima
  const tg = x.createLinearGradient(0, 0, 0, px);
  tg.addColorStop(0, 'rgba(220,205,175,0.07)');
  tg.addColorStop(0.4, 'rgba(0,0,0,0)');
  tg.addColorStop(1, 'rgba(0,0,0,0.25)');
  x.fillStyle = tg;
  x.fillRect(0, 0, px, px);

  wearMedieval(x, px, rng, o.wear);
  return c;
}

/** casco: rocha viva da caverna ao redor do complexo */
function hullRock(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 157);
  const px = o.px;
  x.fillStyle = 'rgb(30,27,23)';
  x.fillRect(0, 0, px, px);
  // manchas grandes de rocha
  for (let i = 0; i < 14; i++) {
    const cx = rng.range(0, px), cy = rng.range(0, px);
    const r = rng.range(px * 0.1, px * 0.3);
    const v = rng.range(-10, 12);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${44 + v},${40 + v},${34 + v},0.5)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  }
  // veios de minério escuro
  for (let i = 0; i < 6; i++) {
    let cx = rng.range(0, px), cy = rng.range(0, px);
    let ang = rng.range(0, Math.PI * 2);
    x.strokeStyle = 'rgba(16,14,11,0.6)';
    x.lineWidth = rng.range(1, 2.4);
    x.beginPath(); x.moveTo(cx, cy);
    for (let s = 0; s < 8; s++) {
      ang += rng.jitter(0.7);
      cx += Math.cos(ang) * px * 0.05;
      cy += Math.sin(ang) * px * 0.05;
      x.lineTo(cx, cy);
    }
    x.stroke();
  }
  for (let i = 0; i < 240; i++) {
    const v = rng.range(-12, 14);
    x.fillStyle = `rgba(${52 + v},${47 + v},${40 + v},${rng.range(0.08, 0.2)})`;
    x.fillRect(rng.range(0, px), rng.range(0, px), rng.range(0.6, 2.4), rng.range(0.6, 2.4));
  }
  return c;
}

// ---------- fundo e atmosfera ----------

function paintCavernBackground(x: Ctx, w: number, h: number, seed: number): void {
  const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, '#171310');
  g.addColorStop(0.6, '#0e0b09');
  g.addColorStop(1, '#070505');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  // sombras de rocha ao longe
  const rng = new RNG(seed ^ 0x34f5a);
  for (let i = 0; i < 6; i++) {
    const cx = rng.range(0, w), cy = rng.range(0, h);
    const r = rng.range(w * 0.15, w * 0.4);
    const gg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    gg.addColorStop(0, `rgba(${rng.pick(['40,32,24', '28,26,22', '34,28,30'])},0.12)`);
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gg;
    x.fillRect(0, 0, w, h);
  }
}

function atmosphereMedieval(create: CanvasFactory, w: number, h: number, seed: number): HTMLCanvasElement {
  const c = create(w, h);
  const x = c.getContext('2d') as Ctx;
  const rng = new RNG(seed + 77);
  // vinheta quente (tocha)
  const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.7, 'rgba(12,8,4,0.20)');
  g.addColorStop(1, 'rgba(8,5,2,0.5)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  // grão
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng.next() - 0.5) * 8;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  return c;
}

// ---------- detalhe de parede ----------

/** alvenaria: juntas perpendiculares e musgo junto ao piso */
function paintMasonryTrim(x: Ctx, seg: WallTrimSeg, wear: number, rng: RNG): void {
  const { o, d, a0, a1, inW, t } = seg;
  // sombra de base onde parede encontra o piso
  x.strokeStyle = 'rgba(8,6,4,0.6)';
  x.lineWidth = 0.05;
  x.beginPath();
  x.moveTo(o.x + d.x * a0, o.y + d.y * a0);
  x.lineTo(o.x + d.x * a1, o.y + d.y * a1);
  x.stroke();
  x.strokeStyle = 'rgba(232,220,195,0.12)';
  x.lineWidth = 0.035;
  x.beginPath();
  x.moveTo(o.x + d.x * a0 - inW.x * 0.05, o.y + d.y * a0 - inW.y * 0.05);
  x.lineTo(o.x + d.x * a1 - inW.x * 0.05, o.y + d.y * a1 - inW.y * 0.05);
  x.stroke();
  // juntas perpendiculares a cada ~1.15m
  const spacing = 1.15;
  const n = Math.floor((a1 - a0) / spacing);
  for (let i = 1; i <= n; i++) {
    const u = a0 + (i * (a1 - a0)) / (n + 1) + rng.jitter(0.1);
    const px = o.x + d.x * u, py = o.y + d.y * u;
    x.strokeStyle = 'rgba(12,10,8,0.5)';
    x.lineWidth = 0.035;
    x.beginPath();
    x.moveTo(px + inW.x * 0.04, py + inW.y * 0.04);
    x.lineTo(px + inW.x * (t * 0.9), py + inW.y * (t * 0.9));
    x.stroke();
    // pedra solta ocasional
    if (wear >= 1 && rng.chance(0.12)) {
      x.fillStyle = 'rgba(90,84,72,0.5)';
      x.beginPath();
      x.arc(px + inW.x * t * 0.5, py + inW.y * t * 0.5, 0.05, 0, Math.PI * 2);
      x.fill();
    }
  }
}

// ---------- sprites de objetos ----------

const WOOD_D = '#4a3524';
const WOOD_L = '#6b4e32';
const IRON = '#3b3f45';
const FIRE = '#ff9a3c';

type P = (x: Ctx, w: number, h: number, env: SpriteEnv) => void;

function woodBody(x: Ctx, y0: number, y1: number, l = WOOD_L, d = WOOD_D): CanvasGradient {
  const g = x.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, l);
  g.addColorStop(1, d);
  return g;
}

function ironBand(x: Ctx, rx: number, ry: number, w: number, h: number): void {
  x.fillStyle = IRON;
  x.fillRect(rx, ry, w, h);
  x.fillStyle = 'rgba(200,205,215,0.18)';
  x.fillRect(rx, ry, w, Math.min(0.03, h * 0.3));
}

const MEDIEVAL_PAINTERS: Record<string, P> = {
  barrel(x, w, h) {
    const r = Math.min(w, h) / 2;
    // corpo com barrilamento
    const g = x.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
    g.addColorStop(0, WOOD_L);
    g.addColorStop(0.7, WOOD_D);
    g.addColorStop(1, '#2e2015');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    // tábuas
    x.strokeStyle = 'rgba(20,12,6,0.5)';
    x.lineWidth = 0.025;
    for (let i = -1; i <= 1; i++) {
      x.beginPath();
      x.moveTo(i * r * 0.5, -r * 0.9);
      x.quadraticCurveTo(i * r * 0.62, 0, i * r * 0.5, r * 0.9);
      x.stroke();
    }
    // cintas de ferro
    x.strokeStyle = IRON;
    x.lineWidth = r * 0.14;
    x.beginPath(); x.arc(0, 0, r * 0.62, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(190,200,215,0.16)';
    x.lineWidth = r * 0.04;
    x.beginPath(); x.arc(0, 0, r * 0.56, 0, Math.PI * 2); x.stroke();
    // tampa
    x.fillStyle = '#54381f';
    x.beginPath(); x.arc(0, 0, r * 0.42, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(15,9,4,0.6)';
    x.lineWidth = 0.03;
    x.beginPath(); x.arc(0, 0, r * 0.42, 0, Math.PI * 2); x.stroke();
  },

  chest(x, w, h) {
    // caixa
    x.fillStyle = woodBody(x, -h / 2, h / 2);
    roundRect(x, -w / 2, -h / 2, w, h, 0.06);
    x.fill();
    x.strokeStyle = 'rgba(18,10,5,0.6)';
    x.lineWidth = 0.025;
    x.stroke();
    // tampa em arco
    x.fillStyle = woodBody(x, -h / 2, 0, '#7a5a38', '#54381f');
    roundRect(x, -w / 2, -h / 2, w, h * 0.42, 0.09);
    x.fill();
    x.strokeStyle = 'rgba(18,10,5,0.55)';
    x.stroke();
    // tiras de ferro
    ironBand(x, -w * 0.32, -h / 2, w * 0.09, h);
    ironBand(x, w * 0.23, -h / 2, w * 0.09, h);
    // fechadura
    x.fillStyle = IRON;
    x.fillRect(-0.09, -0.07, 0.18, 0.2);
    x.fillStyle = '#c9a227';
    x.beginPath(); x.arc(0, 0.01, 0.035, 0, Math.PI * 2); x.fill();
  },

  longTable(x, w, h, env) {
    // tampo de tábuas
    x.fillStyle = woodBody(x, -h / 2, h / 2, '#75552f', '#503722');
    roundRect(x, -w / 2, -h / 2, w, h, 0.05);
    x.fill();
    x.strokeStyle = 'rgba(20,12,6,0.6)';
    x.lineWidth = 0.025;
    x.stroke();
    // juntas das tábuas
    x.strokeStyle = 'rgba(20,12,6,0.4)';
    x.lineWidth = 0.02;
    const planks = 4;
    for (let i = 1; i < planks; i++) {
      const yy = -h / 2 + (i * h) / planks;
      x.beginPath(); x.moveTo(-w / 2 + 0.08, yy); x.lineTo(w / 2 - 0.08, yy); x.stroke();
    }
    // travessas
    x.fillStyle = 'rgba(30,18,9,0.7)';
    x.fillRect(-w * 0.32, -h / 2, w * 0.08, h);
    x.fillRect(w * 0.24, -h / 2, w * 0.08, h);
    // jarros, copos e restos de banquete
    const rng = env.rng;
    for (let i = 0; i < 3; i++) {
      const fx = -w / 2 + w * (0.2 + 0.3 * i) + rng.jitter(0.2);
      const fy = rng.jitter(h * 0.2);
      if (i === 1) {
        x.fillStyle = 'rgba(12,8,5,0.8)';
        x.beginPath(); x.arc(fx, fy, 0.11, 0, Math.PI * 2); x.fill();
        x.fillStyle = 'rgba(140,110,60,0.5)';
        x.beginPath(); x.arc(fx, fy, 0.07, 0, Math.PI * 2); x.fill();
      } else {
        x.fillStyle = '#8b6b3f';
        x.beginPath(); x.arc(fx, fy, 0.06, 0, Math.PI * 2); x.fill();
        x.fillStyle = 'rgba(230,220,200,0.35)';
        x.beginPath(); x.arc(fx - 0.015, fy - 0.015, 0.02, 0, Math.PI * 2); x.fill();
      }
    }
  },

  bench(x, w, h) {
    x.fillStyle = woodBody(x, -h / 2, h / 2, '#6d4f2c', '#4a3320');
    roundRect(x, -w / 2, -h / 2, w, h, 0.04);
    x.fill();
    x.strokeStyle = 'rgba(20,12,6,0.55)';
    x.lineWidth = 0.022;
    x.stroke();
    x.strokeStyle = 'rgba(20,12,6,0.35)';
    x.beginPath(); x.moveTo(-w / 2 + 0.06, 0); x.lineTo(w / 2 - 0.06, 0); x.stroke();
  },

  brazier(x, w, h, env) {
    const r = Math.min(w, h) / 2;
    // pernas
    x.strokeStyle = IRON;
    x.lineWidth = 0.06;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      x.beginPath();
      x.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
      x.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95);
      x.stroke();
    }
    // tigela
    const g = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#4a4e55');
    g.addColorStop(0.75, '#26292e');
    g.addColorStop(1, '#14161a');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r * 0.78, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(160,168,180,0.25)';
    x.lineWidth = 0.025;
    x.stroke();
    // brasas ardentes
    x.save();
    x.shadowColor = FIRE;
    x.shadowBlur = r * 0.45;
    const rng = env.rng;
    for (let i = 0; i < 5; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(0, r * 0.42);
      const cr = rng.range(r * 0.1, r * 0.2);
      const cg = x.createRadialGradient(Math.cos(a) * d, Math.sin(a) * d, 0, Math.cos(a) * d, Math.sin(a) * d, cr);
      cg.addColorStop(0, '#ffd98a');
      cg.addColorStop(0.5, FIRE);
      cg.addColorStop(1, 'rgba(160,50,10,0.1)');
      x.fillStyle = cg;
      x.beginPath(); x.arc(Math.cos(a) * d, Math.sin(a) * d, cr, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  },

  weaponRack(x, w, h, env) {
    // estrutura
    x.fillStyle = woodBody(x, -h / 2, h / 2, '#65482a', '#43301d');
    roundRect(x, -w / 2, -h / 2, w, h, 0.04);
    x.fill();
    x.strokeStyle = 'rgba(18,10,5,0.6)';
    x.lineWidth = 0.022;
    x.stroke();
    // travesseiros de armas: lanças e espadas em fileira
    const rng = env.rng;
    const n = 4 + (env.variant % 2);
    for (let i = 0; i < n; i++) {
      const fx = -w / 2 + ((i + 0.5) * w) / n;
      if (rng.chance(0.5)) {
        // lança
        x.strokeStyle = '#5d4a30';
        x.lineWidth = 0.035;
        x.beginPath(); x.moveTo(fx, -h * 0.38); x.lineTo(fx, h * 0.3); x.stroke();
        x.fillStyle = '#9aa2ae';
        x.beginPath();
        x.moveTo(fx, -h * 0.46);
        x.lineTo(fx - 0.045, -h * 0.3);
        x.lineTo(fx + 0.045, -h * 0.3);
        x.closePath(); x.fill();
      } else {
        // espada
        x.strokeStyle = '#aab2be';
        x.lineWidth = 0.045;
        x.beginPath(); x.moveTo(fx, -h * 0.34); x.lineTo(fx, h * 0.26); x.stroke();
        x.strokeStyle = '#8a6b3f';
        x.lineWidth = 0.05;
        x.beginPath(); x.moveTo(fx - 0.07, h * 0.26); x.lineTo(fx + 0.07, h * 0.26); x.stroke();
      }
    }
  },

  bookshelf(x, w, h, env) {
    x.fillStyle = woodBody(x, -h / 2, h / 2, '#5a4024', '#3a2817');
    roundRect(x, -w / 2, -h / 2, w, h, 0.04);
    x.fill();
    x.strokeStyle = 'rgba(16,9,4,0.6)';
    x.lineWidth = 0.022;
    x.stroke();
    // prateleiras com livros
    const rng = env.rng;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      const yy = -h / 2 + ((r + 0.5) * h) / rows;
      x.fillStyle = 'rgba(12,7,3,0.75)';
      x.fillRect(-w / 2 + 0.05, yy - h * 0.12, w - 0.1, h * 0.24);
      let bx = -w / 2 + 0.08;
      while (bx < w / 2 - 0.12) {
        const bw = rng.range(0.05, 0.1);
        const bh = h * rng.range(0.16, 0.23);
        x.fillStyle = rng.pick(['#7a3b2e', '#5d5a2f', '#33506b', '#6b4a2f', '#4a3b5d', '#755c36']);
        x.fillRect(bx, yy + h * 0.12 - bh, bw, bh);
        bx += bw + rng.range(0.005, 0.03);
      }
    }
  },

  cauldron(x, w, h) {
    const r = Math.min(w, h) / 2;
    // fogueira de pedras
    x.fillStyle = 'rgba(70,64,54,0.9)';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      x.beginPath();
      x.arc(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, r * 0.2, 0, Math.PI * 2);
      x.fill();
    }
    // brasa sob o pote
    x.save();
    x.shadowColor = FIRE;
    x.shadowBlur = r * 0.4;
    x.fillStyle = 'rgba(255,140,50,0.75)';
    x.beginPath(); x.arc(0, 0, r * 0.4, 0, Math.PI * 2); x.fill();
    x.restore();
    // caldeirão
    const g = x.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r * 0.72);
    g.addColorStop(0, '#3d4046');
    g.addColorStop(0.8, '#1b1d21');
    g.addColorStop(1, '#0c0d10');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r * 0.68, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(150,158,170,0.22)';
    x.lineWidth = 0.025;
    x.stroke();
    // poção borbulhante
    x.save();
    x.shadowColor = '#8aff6a';
    x.shadowBlur = r * 0.3;
    const pg = x.createRadialGradient(0, 0, 0, 0, 0, r * 0.44);
    pg.addColorStop(0, '#b6ff9e');
    pg.addColorStop(0.6, '#57c256');
    pg.addColorStop(1, '#1d4d24');
    x.fillStyle = pg;
    x.beginPath(); x.arc(0, 0, r * 0.44, 0, Math.PI * 2); x.fill();
    x.restore();
    // bolhas
    x.fillStyle = 'rgba(230,255,215,0.7)';
    x.beginPath(); x.arc(-r * 0.14, -r * 0.1, r * 0.07, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(r * 0.16, r * 0.12, r * 0.05, 0, Math.PI * 2); x.fill();
  },

  bed(x, w, h) {
    // estrutura
    x.fillStyle = woodBody(x, -h / 2, h / 2, '#5f4527', '#3f2c19');
    roundRect(x, -w / 2, -h / 2, w, h, 0.05);
    x.fill();
    x.strokeStyle = 'rgba(16,9,4,0.55)';
    x.lineWidth = 0.022;
    x.stroke();
    // colchão
    x.fillStyle = '#a08b62';
    roundRect(x, -w / 2 + 0.07, -h / 2 + 0.07, w - 0.14, h - 0.14, 0.06);
    x.fill();
    // cobertor
    x.fillStyle = '#7a3b2e';
    roundRect(x, -w / 2 + 0.1, -h / 2 + h * 0.28, w - 0.2, h * 0.62, 0.05);
    x.fill();
    x.strokeStyle = 'rgba(40,16,10,0.5)';
    x.lineWidth = 0.02;
    x.beginPath(); x.moveTo(-w / 2 + 0.12, -h / 2 + h * 0.45); x.lineTo(w / 2 - 0.12, -h / 2 + h * 0.45); x.stroke();
    // travesseiro
    x.fillStyle = '#cfc4a4';
    roundRect(x, -w / 2 + 0.12, -h / 2 + 0.1, w - 0.24, h * 0.16, 0.05);
    x.fill();
  },

  banner(x, w, h, env) {
    // pano estendido no piso (vista de cima: faixa de tecido com brasão)
    x.fillStyle = '#7a2231';
    roundRect(x, -w / 2, -h / 2, w, h, 0.03);
    x.fill();
    x.strokeStyle = 'rgba(30,6,10,0.6)';
    x.lineWidth = 0.02;
    x.stroke();
    // orla dourada
    x.strokeStyle = '#c9a227';
    x.lineWidth = 0.035;
    x.strokeRect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12);
    // brasão
    x.fillStyle = '#c9a227';
    const s = Math.min(w, h);
    if (env.variant % 2 === 0) {
      // leão simplificado: losango + garras
      x.beginPath();
      x.moveTo(0, -s * 0.24);
      x.lineTo(s * 0.18, 0);
      x.lineTo(0, s * 0.24);
      x.lineTo(-s * 0.18, 0);
      x.closePath(); x.fill();
    } else {
      // torre
      x.fillRect(-s * 0.12, -s * 0.18, s * 0.24, s * 0.36);
      x.fillRect(-s * 0.16, -s * 0.22, s * 0.32, s * 0.08);
    }
    // dobras do tecido
    x.strokeStyle = 'rgba(20,4,8,0.3)';
    x.lineWidth = 0.018;
    for (let i = 1; i < 3; i++) {
      const yy = -h / 2 + (i * h) / 3;
      x.beginPath(); x.moveTo(-w / 2 + 0.04, yy); x.lineTo(w / 2 - 0.04, yy); x.stroke();
    }
  },

  rubble(x, w, h, env) {
    const rng = env.rng;
    // sombra de acúmulo
    x.fillStyle = 'rgba(10,8,6,0.35)';
    x.beginPath(); x.ellipse(0, 0, w * 0.5, h * 0.5, 0, 0, Math.PI * 2); x.fill();
    // pedras soltas
    for (let i = 0; i < 9; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(0, Math.min(w, h) * 0.32);
      const cx = Math.cos(a) * d, cy = Math.sin(a) * d;
      const r = rng.range(0.08, 0.2);
      const v = rng.range(-12, 14);
      x.fillStyle = `rgb(${88 + v},${82 + v},${70 + v})`;
      x.save();
      x.translate(cx, cy);
      x.rotate(rng.range(0, Math.PI));
      x.beginPath();
      const corners = 6;
      for (let k = 0; k <= corners; k++) {
        const aa = (k / corners) * Math.PI * 2;
        const rr = r * (1 + rng.jitter(0.25));
        if (k === 0) x.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
        else x.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
      }
      x.closePath(); x.fill();
      x.fillStyle = 'rgba(0,0,0,0.25)';
      x.fill();
      x.restore();
    }
    // caco de madeira
    x.strokeStyle = '#4a3524';
    x.lineWidth = 0.06;
    x.beginPath(); x.moveTo(-w * 0.2, h * 0.18); x.lineTo(w * 0.15, h * 0.28); x.stroke();
  },

  stairsDown(x, w, h) {
    const s = Math.min(w, h);
    // moldura de pedra
    x.fillStyle = '#3a352c';
    roundRect(x, -s / 2, -s / 2, s, s, 0.06);
    x.fill();
    x.strokeStyle = 'rgba(12,10,7,0.7)';
    x.lineWidth = 0.03;
    x.stroke();
    // poço escuro
    const ix = -s / 2 + 0.16, iy = -s / 2 + 0.16;
    const iw = s - 0.32, ih = s - 0.32;
    x.fillStyle = '#060504';
    x.fillRect(ix, iy, iw, ih);
    // degraus de pedra descendo
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const sy = iy + t * ih;
      const sh = ih / steps;
      const v = 52 - i * 6;
      const g = x.createLinearGradient(0, sy, 0, sy + sh);
      g.addColorStop(0, `rgb(${v + 10},${v + 6},${v - 2})`);
      g.addColorStop(1, `rgb(${v - 8},${v - 10},${v - 14})`);
      x.fillStyle = g;
      x.fillRect(ix + t * 2.6, sy, iw - t * 5.2, sh - 0.02);
      x.fillStyle = 'rgba(226,214,190,0.14)';
      x.fillRect(ix + t * 2.6, sy, iw - t * 5.2, 0.022);
    }
    // musgo nas quinas
    x.fillStyle = 'rgba(84,104,50,0.35)';
    x.beginPath(); x.arc(-s / 2 + 0.12, -s / 2 + 0.14, 0.1, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(s / 2 - 0.14, s / 2 - 0.12, 0.08, 0, Math.PI * 2); x.fill();
  },
};

// ---------- portas ----------

function paintWoodenDoor(x: Ctx, env: DoorEnv): void {
  const w = env.width;
  const t = env.t;
  const fw = w + 0.44;
  const fh = t * 2 + 0.3; // cobre todo o vão recortado na parede

  // sombra de embutir
  x.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(x, -fw / 2 + 0.03, -fh / 2 + 0.05, fw, fh, 0.08);
  x.fill();
  // moldura de pedra
  x.fillStyle = woodBody(x, -fh / 2, fh / 2, '#5c564a', '#38332b');
  roundRect(x, -fw / 2, -fh / 2, fw, fh, 0.08);
  x.fill();
  x.strokeStyle = 'rgba(14,12,9,0.6)';
  x.lineWidth = 0.025;
  x.stroke();

  // vão escuro
  const gapW = w * (env.type === 'gate' ? 0.3 : 0.16);
  x.fillStyle = '#050403';
  x.fillRect(-w / 2, -t / 2 - 0.06, w, t + 0.12);

  if (env.type === 'gate') {
    // grade de ferro meio erguida
    x.strokeStyle = '#454a52';
    x.lineWidth = 0.05;
    const bars = Math.max(4, Math.round(w / 0.3));
    for (let i = 0; i <= bars; i++) {
      const bx = -w / 2 + (i * w) / bars;
      x.beginPath(); x.moveTo(bx, -t / 2 - 0.06); x.lineTo(bx, t / 2 + 0.06); x.stroke();
    }
    x.lineWidth = 0.04;
    x.beginPath(); x.moveTo(-w / 2, -t * 0.18); x.lineTo(w / 2, -t * 0.18); x.stroke();
    x.beginPath(); x.moveTo(-w / 2, t * 0.22); x.lineTo(w / 2, t * 0.22); x.stroke();
  } else {
    // folhas de madeira semiabertas
    const panelW = (w - gapW) / 2;
    for (const dir of [-1, 1]) {
      const px = dir === -1 ? -w / 2 : gapW / 2;
      const g = x.createLinearGradient(0, -t / 2, 0, t / 2);
      g.addColorStop(0, env.type === 'reinforced' ? '#5d4326' : '#6d4f2c');
      g.addColorStop(1, env.type === 'reinforced' ? '#3a2a17' : '#4a3520');
      x.fillStyle = g;
      roundRect(x, px, -t / 2 - 0.04, panelW, t + 0.08, 0.03);
      x.fill();
      x.strokeStyle = 'rgba(14,8,4,0.6)';
      x.lineWidth = 0.02;
      x.stroke();
      // tábuas
      x.strokeStyle = 'rgba(20,11,5,0.45)';
      x.lineWidth = 0.016;
      for (let i = 1; i <= 2; i++) {
        const yy = -t / 2 + (i * (t + 0.08)) / 3;
        x.beginPath(); x.moveTo(px + 0.04, yy); x.lineTo(px + panelW - 0.04, yy); x.stroke();
      }
      // tiras de ferro
      if (env.type === 'reinforced') {
        x.fillStyle = IRON;
        x.fillRect(px + panelW * 0.18, -t / 2 - 0.04, panelW * 0.14, t + 0.08);
        x.fillRect(px + panelW * 0.66, -t / 2 - 0.04, panelW * 0.14, t + 0.08);
      } else {
        x.fillStyle = IRON;
        x.fillRect(px + panelW * 0.36, -t / 2 - 0.04, panelW * 0.14, t + 0.08);
      }
    }
    if (env.type === 'reinforced') {
      // tranca de ferro atravessando
      x.fillStyle = IRON;
      x.fillRect(-w / 2 - 0.06, -0.05, w + 0.12, 0.1);
      x.fillStyle = 'rgba(200,206,216,0.2)';
      x.fillRect(-w / 2 - 0.06, -0.05, w + 0.12, 0.025);
    }
  }

  // maçanetas
  x.fillStyle = '#8a6b3f';
  x.beginPath(); x.arc(-gapW / 2 - 0.07, 0, 0.035, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(gapW / 2 + 0.07, 0, 0.035, 0, Math.PI * 2); x.fill();
}

function paintMedievalCap(x: Ctx, kind: 'dock' | 'bulkhead', width: number): void {
  const r = width / 2 + 0.35;
  if (kind === 'dock') {
    // arco de pedra com escuridão além
    x.fillStyle = '#050403';
    x.beginPath(); x.arc(0, 0, r * 0.9, 0, Math.PI * 2); x.fill();
    // anel de pedra
    x.strokeStyle = '#57503f';
    x.lineWidth = 0.2;
    x.beginPath(); x.arc(0, 0, r * 0.82, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(14,12,9,0.7)';
    x.lineWidth = 0.035;
    x.beginPath(); x.arc(0, 0, r * 0.72, 0, Math.PI * 2); x.stroke();
    // vigaças do arco
    x.strokeStyle = 'rgba(90,82,66,0.9)';
    x.lineWidth = 0.09;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.26;
      x.beginPath();
      x.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
      x.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95);
      x.stroke();
    }
  } else {
    // laje selada com ferro
    const g = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#55503f');
    g.addColorStop(0.75, '#38342a');
    g.addColorStop(1, '#201d17');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(12,10,8,0.7)';
    x.lineWidth = 0.03;
    x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.66, 0, Math.PI * 2); x.stroke();
    // cintas de ferro
    x.strokeStyle = IRON;
    x.lineWidth = 0.07;
    x.beginPath(); x.arc(0, 0, r * 0.82, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(-r, 0); x.lineTo(r, 0); x.stroke();
    x.beginPath(); x.moveTo(0, -r); x.lineTo(0, r); x.stroke();
    // selo de cera
    x.save();
    x.shadowColor = '#c9a227';
    x.shadowBlur = 0.08;
    x.fillStyle = '#c9a227';
    x.beginPath(); x.arc(0, 0, 0.08, 0, Math.PI * 2); x.fill();
    x.restore();
  }
}

// ---------- export do estilo ----------

export const medieval: MapStyle = {
  id: 'medieval',
  label: 'Medieval',

  floors: {
    flagstone: floorFlagstone,
    hallSlabs: floorHallSlabs,
    dirt: floorDirt,
    corridorSteps: floorCorridorSteps,
  },
  defaultFloor: 'flagstone',
  wall: wallStone,
  hull: hullRock,

  paintBackground: paintCavernBackground,
  atmosphere: atmosphereMedieval,
  darknessColor: '18,11,5',

  floorTint: (_room, rng) =>
    `hsla(${Math.round(rng.range(28, 48))}, 32%, ${Math.round(rng.range(52, 64))}%, 0.05)`,
  labelStyle: {
    font: (px) => `bold ${px}px Georgia, 'Times New Roman', serif`,
    color: 'rgba(226,210,175,0.40)',
    codeColor: 'rgba(200,182,148,0.30)',
    code: (room) => `CÂMARA ${room.id.toUpperCase()}`,
  },

  paintWallTrim: paintMasonryTrim,
  paintExtraWall: (x, a, b, t) => {
    x.strokeStyle = 'rgba(16,13,10,0.95)';
    x.lineWidth = t * 2.4;
    x.lineCap = 'butt';
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.strokeStyle = 'rgba(120,110,92,0.5)';
    x.lineWidth = t * 0.7;
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
  },

  paintDoor: paintWoodenDoor,
  paintCorridorCap: paintMedievalCap,
  doorLight: { r: 1.6, strength: 0.35 },
  doorGlow: { r: 0.45, alpha: 0.18, color: '255,170,80' },

  propPainters: MEDIEVAL_PAINTERS,
  propLight: {
    brazier: { r: 6.0, strength: 0.95 },
    cauldron: { r: 3.0, strength: 0.45 },
  },
  propGlow: {
    brazier: { r: 1.7, alpha: 0.5, color: '255,150,60' },
    cauldron: { r: 1.1, alpha: 0.3, color: '140,255,110' },
  },

  catalog: {
    entry: [
      { type: 'weaponRack', w: 1.8, h: 0.7 }, { type: 'barrel', w: 0.95, h: 0.95 },
      { type: 'banner', w: 1.1, h: 1.1 }, { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    hall: [
      { type: 'longTable', w: 2.6, h: 1.1 }, { type: 'bench', w: 1.6, h: 0.5 },
      { type: 'bench', w: 1.6, h: 0.5 }, { type: 'banner', w: 1.1, h: 1.1 },
      { type: 'brazier', w: 1.3, h: 1.3 }, { type: 'bookshelf', w: 1.3, h: 0.6 },
    ],
    lab: [
      { type: 'bookshelf', w: 1.3, h: 0.6 }, { type: 'cauldron', w: 1.1, h: 1.1 },
      { type: 'bookshelf', w: 1.3, h: 0.6 }, { type: 'brazier', w: 1.3, h: 1.3 },
      { type: 'longTable', w: 2.0, h: 0.9 },
    ],
    utility: [
      { type: 'cauldron', w: 1.1, h: 1.1 }, { type: 'barrel', w: 0.95, h: 0.95 },
      { type: 'barrel', w: 0.95, h: 0.95 }, { type: 'rubble', w: 1.2, h: 1.2 },
      { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    storage: [
      { type: 'barrel', w: 0.95, h: 0.95 }, { type: 'barrel', w: 0.95, h: 0.95 },
      { type: 'chest', w: 1.1, h: 0.8 }, { type: 'rubble', w: 1.2, h: 1.2 },
      { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    quarters: [
      { type: 'bed', w: 1.0, h: 2.2 }, { type: 'bed', w: 1.0, h: 2.2 },
      { type: 'chest', w: 1.1, h: 0.8 }, { type: 'bench', w: 1.4, h: 0.5 },
      { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    exit: [
      { type: 'stairsDown', w: 2.6, h: 2.6 },
      { type: 'chest', w: 1.1, h: 0.8 }, { type: 'barrel', w: 0.95, h: 0.95 },
      { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    corridor: [],
  },
  centerProps: ['longTable', 'cauldron', 'brazier', 'stairsDown'],
  lightProp: 'brazier',
  corridorDecor: { type: 'rubble', w: 1.2, h: 1.2 },
  labels: {
    entry: ['PORTARIA'],
    exit: ['CÂMARA SELADA'],
    hall: ['SALÃO NOBRE', 'GALERIA DOS REIS', 'SALA DO TRONO', 'REFETÓRIO'],
    lab: ['SCRIPTÓRIO', 'ALQUIMIA', 'ESTÚDIO DO MAGO', 'HERBÁRIO'],
    utility: ['COZINHA', 'DESPENSA', 'FORJA', 'CALDEIRARIA'],
    storage: ['ARMAZÉM', 'ADEGA', 'CELEIRO DE GRÃOS', 'CÂMARA FRIA'],
    quarters: ['DORMITÓRIO', 'ALOJAMENTO', 'QUARTOS DE GUARDA'],
    corridor: [],
  },
  floorStyleFor: (kind: RoomKind) =>
    kind === 'hall' ? 'hallSlabs'
      : kind === 'utility' || kind === 'storage' ? 'dirt'
        : kind === 'corridor' ? 'corridorSteps'
          : 'flagstone',
  doorTypes: ['wooden', 'wooden', 'reinforced'],
  stubTypes: { entry: 'gate', exit: 'reinforced' },
};
