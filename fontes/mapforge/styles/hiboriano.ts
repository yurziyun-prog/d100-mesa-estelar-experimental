/**
 * Estilo HIBORIANO — era hiboriana (Conan): pedra arenosa antiga, bronze e
 * ouro, sombras rubras, motivos de serpente, tochas e brasas. Funcional por
 * enquanto — aperfeiçoamento visual fica para depois. Arte procedural.
 */

import { RNG } from '../rng';
import type { RoomKind } from '../types';
import type { CanvasFactory, Ctx, TileOpts } from '../render/textures';
import type { SpriteEnv, DoorEnv } from '../render/sprites';
import type { MapStyle, WallTrimSeg } from './style';

// ---------- paleta ----------

const SAND_DK = '#a8926a';
const BRONZE = '#b07d3a';
const GOLD = '#d8b356';
const CRIMSON = '#4a1f1c';
const DARK = '#241610';

function mkCtx(create: CanvasFactory, px: number): { c: HTMLCanvasElement; x: Ctx } {
  const c = create(px, px);
  return { c, x: c.getContext('2d') as Ctx };
}

function shade(rng: RNG, base: [number, number, number], vary: number): string {
  const k = rng.range(-vary, vary);
  return `rgb(${Math.round(base[0] + k)},${Math.round(base[1] + k * 0.85)},${Math.round(base[2] + k * 0.65)})`;
}

function wearHiborian(x: Ctx, px: number, rng: RNG, wear: number): void {
  if (wear >= 1) {
    // poeira de deserto
    for (let i = 0; i < 120 * wear; i++) {
      x.fillStyle = `rgba(214,190,140,${rng.range(0.04, 0.12)})`;
      x.fillRect(rng.range(0, px), rng.range(0, px), rng.range(0.6, 2.2), rng.range(0.6, 2.2));
    }
  }
  if (wear >= 2) {
    // fissuras
    for (let i = 0; i < wear + 1; i++) {
      let cx = rng.range(0, px), cy = rng.range(0, px);
      let ang = rng.range(0, Math.PI * 2);
      x.strokeStyle = 'rgba(30,18,12,0.5)';
      x.lineWidth = rng.range(0.7, 1.5);
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

/** arenito talhado: blocos grandes com juntas de argila */
function floorSandstone(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 311);
  const px = o.px;
  const rows = 3;
  const rh = px / rows;

  x.fillStyle = 'rgb(96,80,56)';
  x.fillRect(0, 0, px, px);
  for (let r = 0; r < rows; r++) {
    const cols = r % 2 === 0 ? 2 : 3;
    const cw = px / cols;
    for (let col = 0; col < cols; col++) {
      const jx = rng.jitter(cw * 0.04), jy = rng.jitter(rh * 0.04);
      const base: [number, number, number] = [186 + rng.range(-14, 12), 158 + rng.range(-12, 10), 112 + rng.range(-10, 8)];
      const g = x.createRadialGradient(
        col * cw + cw / 2 + jx - cw * 0.12, r * rh + rh / 2 + jy - rh * 0.15, cw * 0.08,
        col * cw + cw / 2 + jx, r * rh + rh / 2 + jy, cw * 0.7,
      );
      g.addColorStop(0, shade(rng, base, 6));
      g.addColorStop(1, `rgb(${base[0] - 30},${base[1] - 26},${base[2] - 20})`);
      x.fillStyle = g;
      x.fillRect(col * cw + 2 + jx, r * rh + 2 + jy, cw - 4, rh - 4);
      // marca de cinzel
      x.strokeStyle = 'rgba(60,44,28,0.25)';
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(col * cw + cw * rng.range(0.2, 0.4), r * rh + rh * 0.25);
      x.lineTo(col * cw + cw * rng.range(0.55, 0.75), r * rh + rh * 0.7);
      x.stroke();
    }
  }
  wearHiborian(x, px, rng, o.wear);
  return c;
}

/** salão do trono: lajes polidas com inscrição dourada */
function floorThroneSlabs(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 317);
  const px = o.px;
  const n = 2;
  const cell = px / n;

  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const v = rng.range(-8, 8);
      const g = x.createLinearGradient(gx * cell, gy * cell, gx * cell, gy * cell + cell);
      g.addColorStop(0, `rgb(${150 + v},${124 + v},${88 + v})`);
      g.addColorStop(0.5, `rgb(${164 + v},${138 + v},${100 + v})`);
      g.addColorStop(1, `rgb(${142 + v},${116 + v},${82 + v})`);
      x.fillStyle = g;
      x.fillRect(gx * cell, gy * cell, cell, cell);
    }
  }
  x.strokeStyle = 'rgba(40,26,16,0.85)';
  x.lineWidth = Math.max(1.6, px * 0.01);
  for (let i = 0; i <= n; i++) {
    x.beginPath(); x.moveTo(i * cell, 0); x.lineTo(i * cell, px); x.stroke();
    x.beginPath(); x.moveTo(0, i * cell); x.lineTo(px, i * cell); x.stroke();
  }
  // serpente gravada em ouro
  x.strokeStyle = 'rgba(216,179,86,0.5)';
  x.lineWidth = px * 0.014;
  x.beginPath();
  x.moveTo(px * 0.15, px * 0.7);
  x.bezierCurveTo(px * 0.35, px * 0.45, px * 0.6, px * 0.85, px * 0.85, px * 0.4);
  x.stroke();
  x.fillStyle = 'rgba(216,179,86,0.6)';
  x.beginPath(); x.arc(px * 0.85, px * 0.4, px * 0.025, 0, Math.PI * 2); x.fill();
  wearHiborian(x, px, rng, o.wear);
  return c;
}

/** areia pisada (celas, masmorras) */
function floorSand(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 331);
  const px = o.px;
  const g = x.createLinearGradient(0, 0, px, px);
  g.addColorStop(0, 'rgb(168,140,96)');
  g.addColorStop(0.5, 'rgb(178,150,104)');
  g.addColorStop(1, 'rgb(160,134,90)');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  for (let i = 0; i < 1000; i++) {
    const v = rng.range(-18, 18);
    x.fillStyle = `rgba(${196 + v},${168 + v},${120 + v},${rng.range(0.08, 0.22)})`;
    x.fillRect(rng.range(0, px), rng.range(0, px), rng.range(0.5, 1.8), rng.range(0.5, 1.8));
  }
  // pegadas e sulcos de arraste
  x.fillStyle = 'rgba(120,96,62,0.3)';
  for (let i = 0; i < 16; i++) {
    x.beginPath();
    x.ellipse(rng.range(0, px), rng.range(0, px), 2.4, 1.4, rng.range(0, 3), 0, Math.PI * 2);
    x.fill();
  }
  wearHiborian(x, px, rng, Math.max(o.wear, 1));
  return c;
}

// ---------- parede e casco ----------

/** parede de megablocos arenitos com faixa de bronze */
function wallSandstone(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 337);
  const px = o.px;

  const g = x.createLinearGradient(0, 0, 0, px);
  g.addColorStop(0, '#c9ae7e');
  g.addColorStop(0.45, '#d4bb8c');
  g.addColorStop(0.85, '#b39668');
  g.addColorStop(1, '#97794e');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);

  // blocos com emendas
  const rows = 2;
  const rh = px / rows;
  for (let r = 0; r <= rows; r++) {
    x.strokeStyle = 'rgba(60,44,28,0.4)';
    x.lineWidth = Math.max(1.4, px * 0.009);
    x.beginPath(); x.moveTo(0, r * rh); x.lineTo(px, r * rh); x.stroke();
  }
  for (let r = 0; r < rows; r++) {
    const off = r % 2 === 0 ? 0 : px / 4;
    x.beginPath(); x.moveTo(off + px / 2, r * rh); x.lineTo(off + px / 2, (r + 1) * rh); x.stroke();
  }

  // faixa de bronze na base
  const band = px * 0.14;
  const bg = x.createLinearGradient(0, px - band, 0, px);
  bg.addColorStop(0, BRONZE);
  bg.addColorStop(1, '#7c5524');
  x.fillStyle = bg;
  x.fillRect(0, px - band, px, band);
  x.fillStyle = 'rgba(255,230,160,0.25)';
  x.fillRect(0, px - band, px, 2);

  wearHiborian(x, px, rng, o.wear);
  return c;
}

/** casco: rocha e deserto noturno */
function hullRock(create: CanvasFactory, o: TileOpts): HTMLCanvasElement {
  const { c, x } = mkCtx(create, o.px);
  const rng = new RNG(o.seed + 347);
  const px = o.px;

  const g = x.createLinearGradient(0, 0, px, px);
  g.addColorStop(0, '#3a2a1c');
  g.addColorStop(1, '#241708');
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  for (let i = 0; i < 420; i++) {
    const v = rng.range(-14, 14);
    x.fillStyle = `rgba(${74 + v},${54 + v},${34 + v},${rng.range(0.06, 0.18)})`;
    x.beginPath();
    x.arc(rng.range(0, px), rng.range(0, px), rng.range(0.6, 2.4), 0, Math.PI * 2);
    x.fill();
  }
  return c;
}

/** fundo: noite rubra do deserto */
function paintDesertBackground(x: Ctx, w: number, h: number, seed: number): void {
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1c0f0c');
  g.addColorStop(0.6, '#2a1410');
  g.addColorStop(1, '#170b08');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);

  const rng = new RNG(seed ^ 0x9e2b44);
  for (let i = 0; i < 3; i++) {
    const bx = rng.range(0, w), by = rng.range(0, h);
    const br = rng.range(w * 0.18, w * 0.4);
    const bg = x.createRadialGradient(bx, by, 0, bx, by, br);
    bg.addColorStop(0, `rgba(160,70,40,${rng.range(0.05, 0.1)})`);
    bg.addColorStop(1, 'rgba(160,70,40,0)');
    x.fillStyle = bg;
    x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
  }
  const starRng = new RNG(seed ^ 0x77aa11);
  for (let i = 0; i < 240; i++) {
    x.fillStyle = `rgba(255,220,180,${starRng.range(0.12, 0.6)})`;
    x.beginPath();
    x.arc(starRng.range(0, w), starRng.range(0, h), starRng.range(0.3, 1.2), 0, Math.PI * 2);
    x.fill();
  }
}

// ---------- sprites ----------

function flame(x: Ctx, cx: number, cy: number, r: number): void {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, '#fff2c0');
  g.addColorStop(0.4, '#ffb640');
  g.addColorStop(0.8, 'rgba(220,80,30,0.75)');
  g.addColorStop(1, 'rgba(220,80,30,0)');
  x.save();
  x.shadowColor = '#ff9a30';
  x.shadowBlur = r;
  x.fillStyle = g;
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  x.restore();
}

const HIBORIAN_PAINTERS: Record<string, (x: Ctx, w: number, h: number, env: SpriteEnv) => void> = {
  /** braseiro: taça de bronze com fogo */
  brazier(x, w, h) {
    const r = Math.min(w, h) / 2;
    x.strokeStyle = '#4c3316';
    x.lineWidth = r * 0.1;
    for (const a of [-0.55, 0, 0.55]) {
      x.beginPath(); x.moveTo(0, r * 0.1); x.lineTo(Math.sin(a) * r * 0.55, r * 0.48); x.stroke();
    }
    const g = x.createLinearGradient(0, -r * 0.3, 0, r * 0.15);
    g.addColorStop(0, '#d09a4e');
    g.addColorStop(1, '#7c5524');
    x.fillStyle = g;
    x.beginPath(); x.ellipse(0, 0, r * 0.55, r * 0.34, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#3a2410';
    x.beginPath(); x.ellipse(0, -r * 0.05, r * 0.44, r * 0.24, 0, 0, Math.PI * 2); x.fill();
    flame(x, 0, -r * 0.22, r * 0.42);
  },

  /** tocha de parede: cabo + fogo */
  torch(x, w, h) {
    const r = Math.min(w, h) / 2;
    x.strokeStyle = '#5a3c1c';
    x.lineWidth = r * 0.14;
    x.beginPath(); x.moveTo(0, r * 0.5); x.lineTo(0, -r * 0.15); x.stroke();
    x.fillStyle = '#3a2410';
    x.beginPath(); x.arc(0, -r * 0.2, r * 0.2, 0, Math.PI * 2); x.fill();
    flame(x, 0, -r * 0.38, r * 0.34);
  },

  /** ídolo serpente: coluna com cabeça de serpente dourada */
  idol(x, w, h) {
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#b89c6c');
    g.addColorStop(1, '#8a6f44');
    x.fillStyle = g;
    x.fillRect(-w * 0.28, -h * 0.1, w * 0.56, h * 0.55);
    x.fillStyle = '#97794e';
    x.fillRect(-w * 0.36, h * 0.35, w * 0.72, h * 0.15);
    x.fillRect(-w * 0.36, -h * 0.2, w * 0.72, h * 0.12);
    // serpente enrolada
    x.strokeStyle = GOLD;
    x.lineWidth = w * 0.1;
    x.beginPath();
    x.moveTo(0, h * 0.3);
    x.bezierCurveTo(-w * 0.25, h * 0.1, w * 0.25, -h * 0.05, 0, -h * 0.25);
    x.stroke();
    // cabeça
    x.fillStyle = GOLD;
    x.beginPath(); x.ellipse(0, -h * 0.32, w * 0.14, h * 0.08, 0.3, 0, Math.PI * 2); x.fill();
    x.fillStyle = CRIMSON;
    x.beginPath(); x.arc(w * 0.05, -h * 0.33, w * 0.025, 0, Math.PI * 2); x.fill();
  },

  /** altar de sacrifício: laje com canal rúnico */
  altar(x, w, h) {
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#c0a678');
    g.addColorStop(1, '#8f7550');
    x.fillStyle = g;
    x.fillRect(-w / 2, -h / 2, w, h * 0.8);
    x.fillStyle = '#6e5636';
    x.fillRect(-w * 0.4, h * 0.3, w * 0.8, h * 0.2);
    x.strokeStyle = 'rgba(90,20,16,0.75)';
    x.lineWidth = 0.05;
    x.beginPath();
    x.moveTo(-w * 0.35, -h * 0.2);
    x.lineTo(w * 0.35, -h * 0.2);
    x.stroke();
    x.beginPath();
    x.moveTo(0, -h * 0.2); x.lineTo(0, h * 0.25);
    x.stroke();
  },

  /** ânfora */
  urn(x, w, h) {
    const r = Math.min(w, h) / 2;
    const g = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#d8b880');
    g.addColorStop(1, '#96713f');
    x.fillStyle = g;
    x.beginPath();
    x.ellipse(0, r * 0.1, r * 0.55, r * 0.72, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#7c5a30';
    x.fillRect(-r * 0.22, -r * 0.72, r * 0.44, r * 0.24);
    x.strokeStyle = 'rgba(60,40,20,0.5)';
    x.lineWidth = 0.03;
    x.beginPath(); x.ellipse(0, r * 0.1, r * 0.4, r * 0.55, 0, 0, Math.PI * 2); x.stroke();
  },

  /** arara de armas */
  weaponRack(x, w, h) {
    x.strokeStyle = '#5a3c1c';
    x.lineWidth = 0.07;
    x.beginPath(); x.moveTo(-w / 2, h * 0.35); x.lineTo(w / 2, h * 0.35); x.stroke();
    x.beginPath(); x.moveTo(-w / 2 + 0.1, h * 0.35); x.lineTo(-w / 2 + 0.1, -h * 0.3); x.stroke();
    x.beginPath(); x.moveTo(w / 2 - 0.1, h * 0.35); x.lineTo(w / 2 - 0.1, -h * 0.3); x.stroke();
    // lanças e espadas
    for (let i = 0; i < 4; i++) {
      const px = -w * 0.32 + i * w * 0.2;
      x.strokeStyle = '#9aa0a8';
      x.lineWidth = 0.035;
      x.beginPath(); x.moveTo(px, h * 0.35); x.lineTo(px + 0.06, -h * 0.32); x.stroke();
      x.fillStyle = i % 2 === 0 ? '#c9ced4' : GOLD;
      x.beginPath();
      x.moveTo(px + 0.06, -h * 0.32);
      x.lineTo(px - 0.02, -h * 0.18);
      x.lineTo(px + 0.14, -h * 0.18);
      x.closePath(); x.fill();
    }
  },

  /** baú de madeira com fecho de bronze */
  chest(x, w, h) {
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#7c5a30');
    g.addColorStop(1, '#4c3418');
    x.fillStyle = g;
    x.fillRect(-w / 2, -h / 2 + h * 0.18, w, h * 0.82);
    x.beginPath();
    x.arc(0, -h / 2 + h * 0.18, w / 2, Math.PI, 0);
    x.fill();
    x.strokeStyle = BRONZE;
    x.lineWidth = 0.045;
    x.strokeRect(-w / 2 + 0.04, -h / 2 + h * 0.22, w - 0.08, h * 0.72);
    x.fillStyle = GOLD;
    x.fillRect(-w * 0.09, -h * 0.06, w * 0.18, h * 0.2);
  },

  /** monte de ossos */
  bonePile(x, w, h, env) {
    const rng = new RNG(env.variant * 7919 + 13);
    for (let i = 0; i < 9; i++) {
      const bx = rng.range(-w * 0.38, w * 0.38);
      const by = rng.range(-h * 0.3, h * 0.3);
      const a = rng.range(0, Math.PI);
      x.strokeStyle = `rgba(226,214,186,${rng.range(0.6, 0.95)})`;
      x.lineWidth = 0.055;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a) * 0.4, by + Math.sin(a) * 0.4); x.stroke();
    }
    x.fillStyle = 'rgba(226,214,186,0.9)';
    x.beginPath(); x.arc(-w * 0.12, -h * 0.12, 0.11, 0, Math.PI * 2); x.fill();
    x.fillStyle = DARK;
    x.beginPath(); x.arc(-w * 0.16, -h * 0.14, 0.028, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(-w * 0.08, -h * 0.14, 0.028, 0, Math.PI * 2); x.fill();
  },

  /** escada descendente em pedra */
  stairsDown(x, w, h) {
    const r = Math.min(w, h) / 2 - 0.05;
    x.fillStyle = '#1c0f0a';
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = SAND_DK;
    x.lineWidth = 0.07;
    x.stroke();
    for (let i = 0; i < 6; i++) {
      const rr = r * (0.9 - i * 0.12);
      x.strokeStyle = `rgba(203,178,135,${0.9 - i * 0.1})`;
      x.lineWidth = r * 0.1;
      x.beginPath(); x.arc(0, 0, rr, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
    }
    x.fillStyle = '#0d0604';
    x.beginPath(); x.arc(0, 0, r * 0.18, 0, Math.PI * 2); x.fill();
  },
};

// ---------- portas ----------

function paintHiborianDoor(x: Ctx, env: DoorEnv): void {
  const w = env.width;
  const t = env.t;
  const fw = w + 0.44;
  const fh = t * 2 + 0.3;

  x.fillStyle = 'rgba(12,6,4,0.5)';
  x.fillRect(-fw / 2 + 0.03, -fh / 2 + 0.05, fw, fh);

  // moldura de bronze
  const fg = x.createLinearGradient(0, -fh / 2, 0, fh / 2);
  fg.addColorStop(0, '#c99a4e');
  fg.addColorStop(0.5, '#a5763a');
  fg.addColorStop(1, '#6e4c20');
  x.fillStyle = fg;
  x.fillRect(-fw / 2, -fh / 2, fw, fh);

  // vão escuro
  x.fillStyle = '#120806';
  x.fillRect(-w / 2, -t / 2 - 0.06, w, t + 0.12);

  if (env.type === 'gate') {
    // grade de portão
    x.strokeStyle = '#3a2c14';
    x.lineWidth = 0.05;
    const bars = Math.max(3, Math.floor(w / 0.3));
    for (let i = 0; i <= bars; i++) {
      const bx = -w / 2 + (i * w) / bars;
      x.beginPath(); x.moveTo(bx, -t / 2 - 0.06); x.lineTo(bx, t / 2 + 0.06); x.stroke();
    }
    x.beginPath(); x.moveTo(-w / 2, 0); x.lineTo(w / 2, 0); x.stroke();
  } else {
    // folha de madeira pesada com faixas de bronze
    const pg = x.createLinearGradient(0, -t / 2, 0, t / 2);
    pg.addColorStop(0, '#6e4c26');
    pg.addColorStop(1, '#42300f');
    x.fillStyle = pg;
    x.fillRect(-w / 2, -t / 2 - 0.04, w, t + 0.08);
    x.fillStyle = 'rgba(176,125,58,0.85)';
    x.fillRect(-w / 2 + 0.04, -t * 0.32, w - 0.08, t * 0.16);
    x.fillRect(-w / 2 + 0.04, t * 0.16, w - 0.08, t * 0.16);
    // anel puxador
    x.strokeStyle = GOLD;
    x.lineWidth = 0.035;
    x.beginPath(); x.arc(0, 0, t * 0.24, 0, Math.PI * 2); x.stroke();
  }

  if (env.type === 'sealed') {
    // porta selada: losango rúnico incandescente
    x.save();
    x.shadowColor = '#ff7a30';
    x.shadowBlur = 0.14;
    x.strokeStyle = 'rgba(255,150,60,0.8)';
    x.lineWidth = 0.045;
    x.beginPath();
    x.moveTo(0, -t * 0.42); x.lineTo(w * 0.14, 0);
    x.lineTo(0, t * 0.42); x.lineTo(-w * 0.14, 0);
    x.closePath(); x.stroke();
    x.restore();
  }

  // colunas laterais
  for (const dir of [-1, 1]) {
    const lx = dir * (fw / 2 - 0.07);
    x.fillStyle = '#a8926a';
    x.fillRect(lx - 0.06, -fh / 2 - 0.04, 0.12, fh + 0.08);
    x.fillStyle = BRONZE;
    x.fillRect(lx - 0.08, -fh / 2 - 0.06, 0.16, 0.09);
    x.fillRect(lx - 0.08, fh / 2 - 0.03, 0.16, 0.09);
  }
}

function paintHiborianCap(x: Ctx, kind: 'dock' | 'bulkhead', width: number): void {
  const r = width / 2 + 0.35;
  if (kind === 'dock') {
    // arco de pedra com brasa
    x.strokeStyle = '#c9ae7e';
    x.lineWidth = 0.18;
    x.beginPath(); x.arc(0, 0, r * 0.85, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#150a06';
    x.beginPath(); x.arc(0, 0, r * 0.62, 0, Math.PI * 2); x.fill();
    flame(x, 0, 0, r * 0.2);
  } else {
    // pedra selada com runa
    const g = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#b89c6c');
    g.addColorStop(1, '#6e5636');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(40,26,16,0.6)';
    x.lineWidth = 0.035;
    x.beginPath(); x.arc(0, 0, r * 0.7, 0, Math.PI * 2); x.stroke();
    x.save();
    x.shadowColor = '#ff7a30';
    x.shadowBlur = 0.14;
    x.strokeStyle = 'rgba(255,150,60,0.85)';
    x.lineWidth = 0.05;
    x.beginPath();
    x.moveTo(0, -r * 0.3); x.lineTo(r * 0.22, 0);
    x.lineTo(0, r * 0.3); x.lineTo(-r * 0.22, 0);
    x.closePath(); x.stroke();
    x.restore();
  }
}

// ---------- trim ----------

function paintHiborianTrim(x: Ctx, seg: WallTrimSeg, wear: number, rng: RNG): void {
  const { o, d, a0, a1, inW, t } = seg;
  const p0 = { x: o.x + d.x * a0, y: o.y + d.y * a0 };
  const p1 = { x: o.x + d.x * a1, y: o.y + d.y * a1 };
  x.strokeStyle = 'rgba(255,236,200,0.3)';
  x.lineWidth = 0.04;
  x.beginPath(); x.moveTo(p0.x, p0.y); x.lineTo(p1.x, p1.y); x.stroke();
  x.strokeStyle = 'rgba(30,18,10,0.5)';
  x.lineWidth = 0.05;
  x.beginPath();
  x.moveTo(p0.x - inW.x * 0.06, p0.y - inW.y * 0.06);
  x.lineTo(p1.x - inW.x * 0.06, p1.y - inW.y * 0.06);
  x.stroke();

  // relevo serpente em bronze
  const segs = Math.floor((a1 - a0) / 1.1);
  for (let si = 0; si < segs; si++) {
    if (wear >= 2 && rng.chance(0.2)) continue;
    const u0 = a0 + 0.3 + si * 1.1;
    const u1 = Math.min(u0 + 0.6, a1 - 0.3);
    if (u1 - u0 < 0.2) continue;
    x.strokeStyle = 'rgba(176,125,58,0.5)';
    x.lineWidth = 0.045;
    x.beginPath();
    for (let u = u0; u <= u1; u += 0.1) {
      const wob = Math.sin((u - u0) * 8) * 0.03;
      const px = o.x + d.x * u + inW.x * (0.12 + wob);
      const py = o.y + d.y * u + inW.y * (0.12 + wob);
      if (u === u0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.stroke();
  }

  // relevos circulares
  const reliefs = Math.floor((a1 - a0) / 2.6);
  for (let si = 1; si <= reliefs; si++) {
    const u = a0 + (si * (a1 - a0)) / (reliefs + 1);
    const px = o.x + d.x * u, py = o.y + d.y * u;
    x.fillStyle = 'rgba(176,125,58,0.55)';
    x.beginPath();
    x.arc(px + inW.x * (t * 0.5), py + inW.y * (t * 0.5), 0.09, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = 'rgba(40,26,16,0.5)';
    x.beginPath();
    x.arc(px + inW.x * (t * 0.5), py + inW.y * (t * 0.5), 0.04, 0, Math.PI * 2);
    x.fill();
  }
}

// ---------- estilo ----------

export const hiboriano: MapStyle = {
  id: 'hiboriano',
  label: 'Hiboriano',

  floors: {
    sandstone: floorSandstone,
    throne: floorThroneSlabs,
    sand: floorSand,
    corridorSteps: floorSandstone,
  },
  defaultFloor: 'sandstone',
  wall: wallSandstone,
  hull: hullRock,

  paintBackground: paintDesertBackground,
  atmosphere: (create, w, h) => {
    const c = create(w, h);
    const x = c.getContext('2d') as Ctx;
    const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(30,14,10,0)');
    g.addColorStop(1, 'rgba(22,10,7,0.55)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    return c;
  },
  darknessColor: '28,13,9',

  floorTint: (_room, rng) => {
    const v = Math.round(rng.range(-14, 14));
    return `rgba(${200 + v},${160 + v},${110 + v},0.05)`;
  },
  labelStyle: {
    font: (px) => `bold ${px}px Georgia, "Times New Roman", serif`,
    color: 'rgba(226,200,150,0.45)',
    codeColor: 'rgba(176,125,58,0.4)',
    code: (room) => `CÂMARA ${room.id.toUpperCase()}`,
  },

  paintWallTrim: paintHiborianTrim,
  paintExtraWall: (x, a, b, t) => {
    x.strokeStyle = 'rgba(20,10,6,0.9)';
    x.lineWidth = t * 2.4;
    x.lineCap = 'butt';
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.strokeStyle = 'rgba(203,178,135,0.6)';
    x.lineWidth = t * 0.7;
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
  },

  paintDoor: paintHiborianDoor,
  paintCorridorCap: paintHiborianCap,
  doorLight: { r: 1.8, strength: 0.42 },
  doorGlow: { r: 0.5, alpha: 0.2, color: '255,170,80' },

  propPainters: HIBORIAN_PAINTERS,
  propLight: {
    brazier: { r: 5.8, strength: 0.9 },
    torch: { r: 4.2, strength: 0.7 },
  },
  propGlow: {
    brazier: { r: 1.6, alpha: 0.5, color: '255,150,60' },
    torch: { r: 1.1, alpha: 0.4, color: '255,150,60' },
  },

  catalog: {
    entry: [
      { type: 'weaponRack', w: 1.8, h: 0.7 }, { type: 'urn', w: 0.9, h: 0.9 },
      { type: 'torch', w: 0.6, h: 0.6 }, { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    hall: [
      { type: 'idol', w: 1.4, h: 2.6 }, { type: 'brazier', w: 1.3, h: 1.3 },
      { type: 'altar', w: 2.0, h: 1.1 }, { type: 'weaponRack', w: 1.8, h: 0.7 },
    ],
    lab: [
      { type: 'altar', w: 2.0, h: 1.1 }, { type: 'urn', w: 0.9, h: 0.9 },
      { type: 'idol', w: 1.2, h: 2.2 }, { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    utility: [
      { type: 'urn', w: 0.9, h: 0.9 }, { type: 'urn', w: 0.9, h: 0.9 },
      { type: 'bonePile', w: 1.2, h: 1.2 }, { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    storage: [
      { type: 'chest', w: 1.1, h: 0.8 }, { type: 'urn', w: 0.9, h: 0.9 },
      { type: 'bonePile', w: 1.2, h: 1.2 }, { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    quarters: [
      { type: 'chest', w: 1.1, h: 0.8 }, { type: 'urn', w: 0.9, h: 0.9 },
      { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    exit: [
      { type: 'stairsDown', w: 2.6, h: 2.6 },
      { type: 'chest', w: 1.1, h: 0.8 }, { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    corridor: [],
  },
  centerProps: ['altar', 'idol', 'brazier', 'stairsDown'],
  lightProp: 'brazier',
  corridorDecor: { type: 'bonePile', w: 1.2, h: 1.2 },
  labels: {
    entry: ['PORTÃO'],
    exit: ['TUMBA SELADA'],
    hall: ['TRONO DE OSSOS', 'SALÃO DO REI', 'CÂMARA AUGUSTA'],
    lab: ['ORÁCULO', 'CÂMARA RITUAL', 'SANTUÁRIO'],
    utility: ['FOSSO', 'CALABOUÇO', 'FOURNOS'],
    storage: ['ARSENAL', 'TESOURO', 'CÂMARA FUNERÁRIA'],
    quarters: ['APOSENTOS', 'ALCOVA'],
    corridor: [],
  },
  floorStyleFor: (kind: RoomKind) =>
    kind === 'hall' ? 'throne'
      : kind === 'utility' || kind === 'storage' ? 'sand'
        : kind === 'corridor' ? 'corridorSteps'
          : 'sandstone',
  doorTypes: ['wooden', 'wooden', 'gate'],
  stubTypes: { entry: 'gate', exit: 'sealed' },
};
