/**
 * Temas urbanos — fábricas de tiles e pintores compartilhados, parametrizados
 * por paleta, para vestir a cidade nos 5 estilos visuais. O HÍBRIDO (pedra &
 * neon, o planeta dos jogadores) é o tema de referência.
 */

import { RNG } from '../rng';
import type { CanvasFactory, Ctx } from '../render/textures';
import type { SpriteEnv } from '../render/sprites';
import type { CityTilePainter, CityTheme } from './theme';
import type { CityBuilding, Rect } from './types';

// ---------- helpers ----------

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

function rgb(c: [number, number, number], k = 0): string {
  return `rgb(${Math.round(c[0] + k)},${Math.round(c[1] + k)},${Math.round(c[2] + k)})`;
}

function speckle(x: Ctx, px: number, rng: RNG, color: [number, number, number], n: number, alpha: number): void {
  for (let i = 0; i < n; i++) {
    const v = rng.range(-16, 16);
    x.fillStyle = `rgba(${color[0] + v},${color[1] + v},${color[2] + v},${rng.range(alpha * 0.4, alpha)})`;
    x.fillRect(rng.range(0, px), rng.range(0, px), rng.range(0.6, 2.2), rng.range(0.6, 2.2));
  }
}

// ---------- fábricas de tiles ----------

/** lajeirão de rua: grandes pedras com juntas e desgaste central de rolamento */
function streetSlabs(base: [number, number, number], joint: string, worn: string): CityTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 401);
    const px = o.px;
    const rows = 3;
    const rh = px / rows;
    x.fillStyle = rgb([base[0] - 40, base[1] - 36, base[2] - 30]);
    x.fillRect(0, 0, px, px);
    for (let r = 0; r < rows; r++) {
      const cols = r % 2 === 0 ? 2 : 3;
      const cw = px / cols;
      for (let col = 0; col < cols; col++) {
        const k = rng.range(-10, 10);
        const g = x.createLinearGradient(col * cw, r * rh, col * cw, r * rh + rh);
        g.addColorStop(0, rgb(base, k + 8));
        g.addColorStop(1, rgb(base, k - 10));
        x.fillStyle = g;
        x.fillRect(col * cw + 1.5, r * rh + 1.5, cw - 3, rh - 3);
      }
    }
    x.strokeStyle = joint;
    x.lineWidth = Math.max(1.6, px * 0.012);
    for (let r = 0; r <= rows; r++) {
      x.beginPath(); x.moveTo(0, r * rh); x.lineTo(px, r * rh); x.stroke();
    }
    // faixa de desgaste central de rolamento (no sentido do tráfego = eixo x)
    const wg = x.createLinearGradient(0, px * 0.24, 0, px * 0.76);
    wg.addColorStop(0, 'rgba(0,0,0,0)');
    wg.addColorStop(0.5, worn);
    wg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = wg;
    x.fillRect(0, px * 0.24, px, px * 0.52);
    // sulcos de roda: duas linhas escuras paralelas ao eixo da via
    x.strokeStyle = 'rgba(30,18,8,0.28)';
    x.lineWidth = Math.max(1.2, px * 0.018);
    for (const ry of [px * 0.36, px * 0.64]) {
      x.beginPath(); x.moveTo(0, ry); x.lineTo(px, ry + rng.jitter(1.5)); x.stroke();
    }
    if (o.wear >= 2) speckle(x, px, rng, [base[0] - 50, base[1] - 48, base[2] - 42], 90 * o.wear, 0.16);
    return c;
  };
}

/** paralelepípedo arredondado */
function streetCobble(base: [number, number, number], joint: string): CityTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 409);
    const px = o.px;
    const n = 5;
    const cell = px / n;
    x.fillStyle = rgb([base[0] - 46, base[1] - 42, base[2] - 36]);
    x.fillRect(0, 0, px, px);
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        const k = rng.range(-12, 12);
        const g = x.createRadialGradient(
          gx * cell + cell * 0.35, gy * cell + cell * 0.32, cell * 0.08,
          gx * cell + cell / 2, gy * cell + cell / 2, cell * 0.62,
        );
        g.addColorStop(0, rgb(base, k + 10));
        g.addColorStop(1, rgb(base, k - 14));
        x.fillStyle = g;
        roundRect(x, gx * cell + cell * 0.07, gy * cell + cell * 0.07, cell * 0.86, cell * 0.86, cell * 0.2);
        x.fill();
      }
    }
    x.strokeStyle = joint;
    x.lineWidth = Math.max(1, px * 0.006);
    if (o.wear >= 2) speckle(x, px, rng, [base[0] - 60, base[1] - 56, base[2] - 48], 120, 0.14);
    return c;
  };
}

/** piso técnico escuro (placas com juntas) */
function streetPlates(base: [number, number, number], rivet: string): CityTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 419);
    const px = o.px;
    const g = x.createLinearGradient(0, 0, px, px);
    g.addColorStop(0, rgb(base, 8));
    g.addColorStop(0.5, rgb(base));
    g.addColorStop(1, rgb(base, -10));
    x.fillStyle = g;
    x.fillRect(0, 0, px, px);
    x.strokeStyle = 'rgba(0,0,0,0.5)';
    x.lineWidth = Math.max(1.6, px * 0.01);
    const step = px / 2;
    for (let i = 0; i <= 2; i++) {
      x.beginPath(); x.moveTo(i * step, 0); x.lineTo(i * step, px); x.stroke();
      x.beginPath(); x.moveTo(0, i * step); x.lineTo(px, i * step); x.stroke();
    }
    x.fillStyle = rivet;
    for (let gy = 0; gy < 2; gy++) {
      for (let gx = 0; gx < 2; gx++) {
        x.beginPath();
        x.arc(gx * step + step * 0.14, gy * step + step * 0.14, px * 0.012, 0, Math.PI * 2);
        x.fill();
      }
    }
    speckle(x, px, rng, [base[0] + 26, base[1] + 26, base[2] + 30], 260, 0.08);
    return c;
  };
}

function sidewalkTile(base: [number, number, number], joint: string): CityTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 431);
    const px = o.px;
    x.fillStyle = rgb(base);
    x.fillRect(0, 0, px, px);
    const n = 4;
    const cell = px / n;
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        const k = rng.range(-5, 5);
        x.fillStyle = rgb(base, k);
        x.fillRect(gx * cell + 1, gy * cell + 1, cell - 2, cell - 2);
      }
    }
    x.strokeStyle = joint;
    x.lineWidth = Math.max(1.2, px * 0.007);
    for (let i = 0; i <= n; i++) {
      x.beginPath(); x.moveTo(i * cell, 0); x.lineTo(i * cell, px); x.stroke();
      x.beginPath(); x.moveTo(0, i * cell); x.lineTo(px, i * cell); x.stroke();
    }
    if (o.wear >= 1) speckle(x, px, rng, [base[0] - 34, base[1] - 32, base[2] - 28], 60 * o.wear, 0.12);
    return c;
  };
}

/** praça: mosaico com losangos em duas cores */
function plazaTile(a: [number, number, number], b: [number, number, number], joint: string): CityTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 433);
    const px = o.px;
    const n = 4;
    const cell = px / n;
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        const even = (gx + gy) % 2 === 0;
        const base = even ? a : b;
        const k = rng.range(-5, 5);
        x.fillStyle = rgb(base, k);
        x.fillRect(gx * cell, gy * cell, cell, cell);
        // losango central
        x.fillStyle = rgb(even ? b : a, k);
        x.beginPath();
        x.moveTo(gx * cell + cell / 2, gy * cell + cell * 0.16);
        x.lineTo(gx * cell + cell * 0.84, gy * cell + cell / 2);
        x.lineTo(gx * cell + cell / 2, gy * cell + cell * 0.84);
        x.lineTo(gx * cell + cell * 0.16, gy * cell + cell / 2);
        x.closePath();
        x.fill();
      }
    }
    x.strokeStyle = joint;
    x.lineWidth = Math.max(1, px * 0.005);
    for (let i = 0; i <= n; i++) {
      x.beginPath(); x.moveTo(i * cell, 0); x.lineTo(i * cell, px); x.stroke();
      x.beginPath(); x.moveTo(0, i * cell); x.lineTo(px, i * cell); x.stroke();
    }
    if (o.wear >= 1) speckle(x, px, rng, [a[0] - 40, a[1] - 38, a[2] - 32], 50 * o.wear, 0.1);
    return c;
  };
}

function grassTile(a: [number, number, number], b: [number, number, number]): CityTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 439);
    const px = o.px;
    x.fillStyle = rgb(a);
    x.fillRect(0, 0, px, px);
    for (let i = 0; i < 1400; i++) {
      const t = rng.chance(0.5) ? a : b;
      const v = rng.range(-14, 14);
      x.strokeStyle = `rgba(${t[0] + v},${t[1] + v},${t[2] + v},${rng.range(0.15, 0.4)})`;
      x.lineWidth = rng.range(0.5, 1.2);
      const gx = rng.range(0, px), gy = rng.range(0, px);
      x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + rng.jitter(3), gy - rng.range(1, 3.4)); x.stroke();
    }
    if (o.wear >= 2) speckle(x, px, rng, [a[0] + 30, a[1] + 24, a[2] + 10], 80, 0.1);
    return c;
  };
}

function backdropTile(base: [number, number, number]): CityTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 443);
    const px = o.px;
    const g = x.createLinearGradient(0, 0, px, px);
    g.addColorStop(0, rgb(base, 6));
    g.addColorStop(1, rgb(base, -8));
    x.fillStyle = g;
    x.fillRect(0, 0, px, px);
    speckle(x, px, rng, [base[0] + 24, base[1] + 22, base[2] + 18], 380, 0.1);
    return c;
  };
}

// ---------- paleta urbana ----------

export interface UrbanPal {
  streetKind: 'slabs' | 'cobble' | 'plates';
  streetBase: [number, number, number];
  streetJoint: string;
  streetWorn: string;
  sidewalkBase: [number, number, number];
  sidewalkJoint: string;
  plazaA: [number, number, number];
  plazaB: [number, number, number];
  plazaJoint: string;
  grassA: [number, number, number];
  grassB: [number, number, number];
  backdrop: [number, number, number];
  roofBase: [number, number, number];
  roofKind: 'stone' | 'pastel' | 'thatch' | 'metal';
  roofJoint: string;
  parapet: string;
  parapetTop: string;
  neon?: string; // 'r,g,b' — borda luminosa de prédio (híbrido/era atômica)
  neon2?: string;
  accent: string; // porta e detalhes
  door: string;
  trunk: string;
  canopy: [number, number, number];
  canopy2: [number, number, number];
  lampPost: string;
  lampGlobe: string;
  lampGlow: string;
  water: string;
  stallCanvas: string;
  stallCanvas2: string;
  stallWood: string;
  statue: string;
  bench: string;
  vehicle: 'hover' | 'cart';
  vehicleBody: string;
  vehicleGlass: string;
  hedge: [number, number, number];
}

function streetTileOf(pal: UrbanPal): CityTilePainter {
  if (pal.streetKind === 'cobble') return streetCobble(pal.streetBase, pal.streetJoint);
  if (pal.streetKind === 'plates') return streetPlates(pal.streetBase, pal.streetJoint);
  return streetSlabs(pal.streetBase, pal.streetJoint, pal.streetWorn);
}

// ---------- telhados ----------

function paintStoneRoof(x: Ctx, r: Rect, b: CityBuilding, pal: UrbanPal, rng: RNG): void {
  // variação de tonalidade por prédio quebra a monotonia da malha
  const tint = ((b.variant % 7) - 3) * 6;
  const g = x.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  g.addColorStop(0, rgb(pal.roofBase, 8 + tint));
  g.addColorStop(1, rgb(pal.roofBase, -10 + tint));
  x.fillStyle = g;
  x.fillRect(r.x, r.y, r.w, r.h);
  // placas do telhado
  x.strokeStyle = pal.roofJoint;
  x.lineWidth = 0.035;
  const rows = Math.max(2, Math.round(r.h / 1.6));
  for (let i = 1; i < rows; i++) {
    const yy = r.y + (i * r.h) / rows;
    x.beginPath(); x.moveTo(r.x + 0.06, yy); x.lineTo(r.x + r.w - 0.06, yy); x.stroke();
  }
  const cols = Math.max(2, Math.round(r.w / 1.8));
  for (let i = 1; i < cols; i++) {
    const xx = r.x + (i * r.w) / cols;
    x.beginPath(); x.moveTo(xx, r.y + 0.06); x.lineTo(xx, r.y + r.h - 0.06); x.stroke();
  }
  // claraboia / cúpula de ventilação
  const sx = r.x + r.w * (0.3 + rng.range(0, 0.4));
  const sy = r.y + r.h * (0.3 + rng.range(0, 0.4));
  const sr = Math.min(r.w, r.h) * 0.14;
  x.fillStyle = 'rgba(0,0,0,0.25)';
  x.beginPath(); x.arc(sx + 0.05, sy + 0.08, sr, 0, Math.PI * 2); x.fill();
  const dg = x.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
  dg.addColorStop(0, rgb(pal.roofBase, 30));
  dg.addColorStop(1, rgb(pal.roofBase, -4));
  x.fillStyle = dg;
  x.beginPath(); x.arc(sx, sy, sr, 0, Math.PI * 2); x.fill();
  x.strokeStyle = pal.parapet;
  x.lineWidth = 0.04;
  x.stroke();
  // conduto
  if (rng.chance(0.7)) {
    const px2 = r.x + r.w * rng.range(0.2, 0.8);
    const py2 = r.y + r.h * rng.range(0.15, 0.4);
    x.strokeStyle = pal.parapet;
    x.lineWidth = 0.09;
    x.lineCap = 'round';
    x.beginPath(); x.moveTo(px2, py2); x.lineTo(px2 + r.w * 0.22, py2); x.stroke();
  }
  // caixa de escada (acesso ao telhado) perto de um canto
  if (rng.chance(0.6)) {
    const cw = 0.85, ch = 0.85;
    const cxx = rng.chance(0.5) ? r.x + 0.28 : r.x + r.w - 0.28 - cw;
    const cyy = rng.chance(0.5) ? r.y + 0.28 : r.y + r.h - 0.28 - ch;
    x.fillStyle = 'rgba(0,0,0,0.28)';
    x.fillRect(cxx + 0.05, cyy + 0.07, cw, ch);
    x.fillStyle = rgb(pal.roofBase, -26);
    x.fillRect(cxx, cyy, cw, ch);
    x.strokeStyle = pal.roofJoint;
    x.lineWidth = 0.035;
    x.strokeRect(cxx, cyy, cw, ch);
    // sombra da portinhola
    x.fillStyle = 'rgba(0,0,0,0.35)';
    x.fillRect(cxx + 0.14, cyy + 0.14, cw - 0.28, ch - 0.28);
  }
}

function paintPastelRoof(x: Ctx, r: Rect, b: CityBuilding, pal: UrbanPal, _rng: RNG): void {
  const hues: [number, number, number][] = [[242, 231, 207], [63, 214, 199], [255, 178, 92], [255, 150, 170]];
  const tint = hues[b.variant % hues.length];
  const g = x.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  g.addColorStop(0, rgb(tint, 6));
  g.addColorStop(1, rgb(tint, -12));
  x.fillStyle = g;
  roundRect(x, r.x, r.y, r.w, r.h, 0.5);
  x.fill();
  // faixa decorativa
  x.strokeStyle = pal.accent;
  x.lineWidth = 0.06;
  roundRect(x, r.x + 0.3, r.y + 0.3, r.w - 0.6, r.h - 0.6, 0.35);
  x.stroke();
  // claraboia redonda
  const sx = r.x + r.w / 2, sy = r.y + r.h / 2;
  const sr = Math.min(r.w, r.h) * 0.18;
  x.fillStyle = 'rgba(42,24,48,0.55)';
  x.beginPath(); x.arc(sx, sy, sr, 0, Math.PI * 2); x.fill();
  x.save();
  if (pal.neon) {
    x.shadowColor = `rgba(${pal.neon},1)`;
    x.shadowBlur = 0.14;
  }
  x.strokeStyle = pal.neon ? `rgba(${pal.neon},0.9)` : pal.accent;
  x.lineWidth = 0.05;
  x.beginPath(); x.arc(sx, sy, sr, 0, Math.PI * 2); x.stroke();
  x.restore();
}

function paintThatchRoof(x: Ctx, r: Rect, _b: CityBuilding, pal: UrbanPal, rng: RNG): void {
  const g = x.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  g.addColorStop(0, rgb(pal.roofBase, 12));
  g.addColorStop(1, rgb(pal.roofBase, -14));
  x.fillStyle = g;
  x.fillRect(r.x, r.y, r.w, r.h);
  // palhinhas
  for (let i = 0; i < 130; i++) {
    const v = rng.range(-18, 18);
    x.strokeStyle = `rgba(${pal.roofBase[0] + v},${pal.roofBase[1] + v * 0.8},${pal.roofBase[2] + v * 0.5},${rng.range(0.2, 0.45)})`;
    x.lineWidth = rng.range(0.5, 1.2);
    const hx = rng.range(r.x, r.x + r.w);
    const hy = rng.range(r.y, r.y + r.h);
    x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + rng.jitter(2.4), hy + rng.range(3, 7)); x.stroke();
  }
  // cumeeira
  x.strokeStyle = pal.parapet;
  x.lineWidth = 0.12;
  x.beginPath();
  x.moveTo(r.x + r.w / 2, r.y + 0.08);
  x.lineTo(r.x + r.w / 2, r.y + r.h - 0.08);
  x.stroke();
  // fumaça? não — janela de sótão
  x.fillStyle = 'rgba(20,12,8,0.8)';
  x.fillRect(r.x + r.w / 2 - 0.22, r.y + r.h / 2 - 0.18, 0.44, 0.36);
  x.strokeStyle = pal.parapet;
  x.lineWidth = 0.04;
  x.strokeRect(r.x + r.w / 2 - 0.22, r.y + r.h / 2 - 0.18, 0.44, 0.36);
}

function paintMetalRoof(x: Ctx, r: Rect, _b: CityBuilding, pal: UrbanPal, _rng: RNG): void {
  const g = x.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  g.addColorStop(0, rgb(pal.roofBase, 10));
  g.addColorStop(1, rgb(pal.roofBase, -12));
  x.fillStyle = g;
  x.fillRect(r.x, r.y, r.w, r.h);
  x.strokeStyle = pal.roofJoint;
  x.lineWidth = 0.04;
  const rows = Math.max(2, Math.round(r.h / 1.4));
  for (let i = 1; i < rows; i++) {
    const yy = r.y + (i * r.h) / rows;
    x.beginPath(); x.moveTo(r.x, yy); x.lineTo(r.x + r.w, yy); x.stroke();
  }
  // luzes de posição
  if (pal.neon) {
    x.save();
    x.shadowColor = `rgba(${pal.neon},1)`;
    x.shadowBlur = 0.1;
    x.fillStyle = `rgba(${pal.neon},0.9)`;
    for (const [cx2, cy2] of [[r.x + 0.25, r.y + 0.25], [r.x + r.w - 0.25, r.y + 0.25], [r.x + 0.25, r.y + r.h - 0.25], [r.x + r.w - 0.25, r.y + r.h - 0.25]] as const) {
      x.beginPath(); x.arc(cx2, cy2, 0.05, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }
}

// ---------- adereços urbanos ----------

function urbanPainters(pal: UrbanPal): CityTheme['propPainters'] {
  return {
    tree(x, w, h, env) {
      const rng = env.rng;
      const r = Math.min(w, h) / 2;
      // sombra de copa
      x.fillStyle = 'rgba(0,0,0,0.25)';
      x.beginPath(); x.ellipse(0.1, 0.14, r * 0.62, r * 0.5, 0, 0, Math.PI * 2); x.fill();
      // tronco
      x.strokeStyle = pal.trunk;
      x.lineWidth = r * 0.18;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, r * 0.45); x.lineTo(rng.jitter(0.06), -r * 0.1); x.stroke();
      // copa em 3 blobs
      for (const [ox, oy, k] of [[0, -r * 0.34, 14], [-r * 0.3, -r * 0.1, -6], [r * 0.3, -r * 0.12, 2]] as const) {
        const t = rng.chance(0.5) ? pal.canopy : pal.canopy2;
        const g = x.createRadialGradient(ox - r * 0.1, oy - r * 0.12, r * 0.06, ox, oy, r * 0.42);
        g.addColorStop(0, rgb(t, k + 12));
        g.addColorStop(1, rgb(t, k - 16));
        x.fillStyle = g;
        x.beginPath(); x.arc(ox, oy, r * 0.42, 0, Math.PI * 2); x.fill();
      }
    },

    lamp(x, w, h) {
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.3)';
      x.beginPath(); x.ellipse(0.04, 0.06, r * 0.4, r * 0.32, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = pal.lampPost;
      x.lineWidth = r * 0.16;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, r * 0.42); x.lineTo(0, -r * 0.28); x.stroke();
      x.fillStyle = pal.lampPost;
      x.beginPath(); x.arc(0, -r * 0.28, r * 0.14, 0, Math.PI * 2); x.fill();
      const g = x.createRadialGradient(-r * 0.08, -r * 0.46, r * 0.04, 0, -r * 0.4, r * 0.26);
      g.addColorStop(0, '#fff8e6');
      g.addColorStop(0.7, pal.lampGlobe);
      g.addColorStop(1, rgb(pal.canopy2, 0));
      x.save();
      x.shadowColor = pal.lampGlow;
      x.shadowBlur = r * 0.5;
      x.fillStyle = g;
      x.beginPath(); x.arc(0, -r * 0.4, r * 0.24, 0, Math.PI * 2); x.fill();
      x.restore();
    },

    fountain(x, w, h, env) {
      const rng = env.rng;
      const r = Math.min(w, h) / 2 - 0.08;
      // bacia externa
      const bg = x.createLinearGradient(0, -r, 0, r);
      bg.addColorStop(0, rgb(pal.plazaA, 10));
      bg.addColorStop(1, rgb(pal.plazaA, -26));
      x.fillStyle = bg;
      x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.4)';
      x.lineWidth = 0.05;
      x.stroke();
      // água brilhante
      const wg = x.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 0.78);
      wg.addColorStop(0, rgb(pal.canopy, 26));
      wg.addColorStop(1, pal.water);
      x.save();
      x.shadowColor = pal.water;
      x.shadowBlur = 0.14;
      x.fillStyle = wg;
      x.beginPath(); x.arc(0, 0, r * 0.78, 0, Math.PI * 2); x.fill();
      x.restore();
      // ondulações
      x.strokeStyle = 'rgba(255,255,255,0.4)';
      x.lineWidth = 0.03;
      for (let i = 0; i < 3; i++) {
        x.beginPath(); x.arc(rng.jitter(0.1), rng.jitter(0.1), r * (0.28 + i * 0.16), 0, Math.PI * 2); x.stroke();
      }
      // cisne/coluna central
      x.fillStyle = rgb(pal.plazaA, 6);
      x.beginPath(); x.arc(0, 0, r * 0.2, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.35)';
      x.lineWidth = 0.03;
      x.stroke();
    },

    stall(x, w, h, env) {
      const rng = env.rng;
      // balcão
      x.fillStyle = 'rgba(0,0,0,0.28)';
      roundRect(x, -w / 2 + 0.05, -h / 2 + 0.08, w, h * 0.62, 0.08);
      x.fill();
      x.fillStyle = pal.stallWood;
      roundRect(x, -w / 2, -h / 2, w, h * 0.62, 0.08);
      x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.4)';
      x.lineWidth = 0.025;
      x.stroke();
      // mercadoria
      for (let i = 0; i < 5; i++) {
        const hx = -w * 0.36 + i * w * 0.18;
        x.fillStyle = rng.pick([pal.stallCanvas, pal.stallCanvas2, pal.accent]);
        x.beginPath(); x.arc(hx, -h * 0.22, h * 0.09, 0, Math.PI * 2); x.fill();
      }
      // toldo listrado (vista superior: faixas ao longo de w)
      const stripes = 6;
      for (let i = 0; i < stripes; i++) {
        x.fillStyle = i % 2 === 0 ? pal.stallCanvas : pal.stallCanvas2;
        x.fillRect(-w / 2 + (i * w) / stripes, -h * 0.06, w / stripes + 0.01, h * 0.4);
      }
      x.strokeStyle = 'rgba(0,0,0,0.3)';
      x.lineWidth = 0.02;
      x.strokeRect(-w / 2, -h * 0.06, w, h * 0.4);
    },

    statue(x, w, h) {
      const r = Math.min(w, h) / 2;
      // pedestal
      x.fillStyle = 'rgba(0,0,0,0.3)';
      x.beginPath(); x.ellipse(0.05, 0.07, r * 0.5, r * 0.42, 0, 0, Math.PI * 2); x.fill();
      const pg = x.createLinearGradient(-r * 0.4, -r * 0.4, r * 0.4, r * 0.4);
      pg.addColorStop(0, rgb(pal.plazaA, 12));
      pg.addColorStop(1, rgb(pal.plazaA, -20));
      x.fillStyle = pg;
      roundRect(x, -r * 0.42, -r * 0.42, r * 0.84, r * 0.84, 0.1);
      x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.4)';
      x.lineWidth = 0.03;
      x.stroke();
      // figura (silhueta simples)
      x.fillStyle = pal.statue;
      x.beginPath(); x.arc(0, -r * 0.14, r * 0.16, 0, Math.PI * 2); x.fill();
      x.beginPath();
      x.moveTo(-r * 0.2, r * 0.36);
      x.quadraticCurveTo(0, -r * 0.28, r * 0.2, r * 0.36);
      x.closePath(); x.fill();
    },

    bench(x, w, h) {
      x.fillStyle = 'rgba(0,0,0,0.25)';
      roundRect(x, -w / 2 + 0.04, -h / 2 + 0.05, w, h, h * 0.3);
      x.fill();
      x.fillStyle = pal.bench;
      roundRect(x, -w / 2, -h / 2, w, h, h * 0.3);
      x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.4)';
      x.lineWidth = 0.02;
      x.stroke();
      x.strokeStyle = 'rgba(0,0,0,0.25)';
      for (let i = 1; i < 3; i++) {
        x.beginPath();
        x.moveTo(-w / 2 + (i * w) / 3, -h / 2 + 0.04);
        x.lineTo(-w / 2 + (i * w) / 3, h / 2 - 0.04);
        x.stroke();
      }
    },

    vehicle(x, w, h, env) {
      if (pal.vehicle === 'cart') {
        // carroça de madeira
        x.fillStyle = 'rgba(0,0,0,0.3)';
        roundRect(x, -w / 2 + 0.05, -h / 2 + 0.07, w, h, h * 0.3);
        x.fill();
        x.fillStyle = pal.vehicleBody;
        roundRect(x, -w / 2, -h / 2, w * 0.72, h, h * 0.3);
        x.fill();
        x.strokeStyle = 'rgba(0,0,0,0.45)';
        x.lineWidth = 0.03;
        x.stroke();
        // caçamba
        x.fillStyle = rgb(pal.hedge, -20);
        roundRect(x, w * 0.06, -h * 0.38, w * 0.4, h * 0.76, 0.06);
        x.fill();
        // rodas
        x.fillStyle = '#241a10';
        for (const wx of [-w * 0.28, w * 0.18]) {
          x.beginPath(); x.arc(wx, h * 0.52, h * 0.22, 0, Math.PI * 2); x.fill();
          x.fillStyle = '#4c3a22';
          x.beginPath(); x.arc(wx, h * 0.52, h * 0.09, 0, Math.PI * 2); x.fill();
          x.fillStyle = '#241a10';
        }
        return;
      }
      // hovercar arredondado da era atômica
      x.fillStyle = 'rgba(0,0,0,0.32)';
      roundRect(x, -w / 2 + 0.06, -h / 2 + 0.09, w, h, h * 0.5);
      x.fill();
      const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, rgb(pal.canopy2, 24));
      g.addColorStop(0.5, pal.vehicleBody);
      g.addColorStop(1, rgb(pal.canopy2, -12));
      x.fillStyle = g;
      roundRect(x, -w / 2, -h / 2, w, h, h * 0.5);
      x.fill();
      x.strokeStyle = 'rgba(20,10,26,0.5)';
      x.lineWidth = 0.03;
      x.stroke();
      // cabine de vidro
      x.fillStyle = pal.vehicleGlass;
      roundRect(x, -w * 0.2, -h * 0.3, w * 0.42, h * 0.6, h * 0.24);
      x.fill();
      // faróis
      x.save();
      x.shadowColor = '#ffe9b8';
      x.shadowBlur = 0.08;
      x.fillStyle = '#fff3cf';
      x.beginPath(); x.arc(w / 2 - 0.1, -h * 0.24, 0.06, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(w / 2 - 0.1, h * 0.24, 0.06, 0, Math.PI * 2); x.fill();
      x.restore();
      // cromado lateral
      x.strokeStyle = 'rgba(255,255,255,0.55)';
      x.lineWidth = 0.035;
      x.beginPath(); x.moveTo(-w * 0.42, 0); x.lineTo(w * 0.3, 0); x.stroke();
      void env;
    },

    hedge(x, w, h, env) {
      const rng = env.rng;
      const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, rgb(pal.hedge, 14));
      g.addColorStop(1, rgb(pal.hedge, -14));
      x.fillStyle = g;
      roundRect(x, -w / 2, -h / 2, w, h, h * 0.4);
      x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.35)';
      x.lineWidth = 0.025;
      x.stroke();
      for (let i = 0; i < 12; i++) {
        const v = rng.range(-14, 14);
        x.fillStyle = `rgba(${pal.hedge[0] + v},${pal.hedge[1] + v},${pal.hedge[2] + v},0.5)`;
        x.beginPath();
        x.arc(rng.range(-w / 2 + 0.1, w / 2 - 0.1), rng.range(-h / 2 + 0.1, h / 2 - 0.1), 0.06, 0, Math.PI * 2);
        x.fill();
      }
    },
  };
}

// ---------- montagem de tema ----------

function makeCityTheme(id: string, label: string, pal: UrbanPal, doorType: string, plazaLabel: string): CityTheme {
  const paintRoof = (x: Ctx, r: Rect, b: CityBuilding, env: SpriteEnv): void => {
    const rng = env.rng;
    if (pal.roofKind === 'pastel') paintPastelRoof(x, r, b, pal, rng);
    else if (pal.roofKind === 'thatch') paintThatchRoof(x, r, b, pal, rng);
    else if (pal.roofKind === 'metal') paintMetalRoof(x, r, b, pal, rng);
    else paintStoneRoof(x, r, b, pal, rng);
    // neon no contorno (híbrido / era atômica)
    if (pal.neon) {
      x.save();
      x.shadowColor = `rgba(${pal.neon},1)`;
      x.shadowBlur = 0.12;
      x.strokeStyle = `rgba(${pal.neon},0.75)`;
      x.lineWidth = 0.05;
      roundRect(x, r.x + 0.06, r.y + 0.06, r.w - 0.12, r.h - 0.12, 0.16);
      x.stroke();
      if (pal.neon2 && b.variant % 3 === 0) {
        x.shadowColor = `rgba(${pal.neon2},1)`;
        x.strokeStyle = `rgba(${pal.neon2},0.7)`;
        x.lineWidth = 0.04;
        roundRect(x, r.x + 0.16, r.y + 0.16, r.w - 0.32, r.h - 0.32, 0.12);
        x.stroke();
      }
      x.restore();
    }
  };

  return {
    id,
    label,
    backdrop: backdropTile(pal.backdrop),
    street: streetTileOf(pal),
    sidewalk: sidewalkTile(pal.sidewalkBase, pal.sidewalkJoint),
    plaza: plazaTile(pal.plazaA, pal.plazaB, pal.plazaJoint),
    grass: grassTile(pal.grassA, pal.grassB),
    paintBuildingRoof: paintRoof,
    buildingEdge: pal.parapet,
    doorFrame: pal.accent,
    doorType,
    propPainters: urbanPainters(pal),
    propLight: {
      lamp: { r: 5.2, strength: 0.85 },
      fountain: { r: 3.4, strength: 0.4 },
    },
    propGlow: {
      lamp: { r: 1.15, alpha: 0.4, color: pal.lampGlow },
      fountain: { r: 1.8, alpha: 0.3, color: pal.water },
    },
    darknessColor: pal.backdrop.map((v) => Math.max(8, Math.round(v * 0.28))).join(','),
    lampSpacing: pal.roofKind === 'thatch' ? 15 : 12,
    plazaLabel,
  };
}

// ---------- paletas dos 5 estilos ----------

const PAL_HIBRIDO: UrbanPal = {
  streetKind: 'slabs',
  streetBase: [150, 126, 90], streetJoint: 'rgba(44,28,14,0.65)', streetWorn: 'rgba(36,20,8,0.3)',
  sidewalkBase: [190, 170, 134], sidewalkJoint: 'rgba(66,48,26,0.5)',
  plazaA: [184, 158, 112], plazaB: [58, 142, 132], plazaJoint: 'rgba(48,32,18,0.55)',
  grassA: [42, 78, 60], grassB: [56, 96, 74],
  backdrop: [44, 32, 22],
  roofBase: [142, 118, 82], roofKind: 'stone', roofJoint: 'rgba(48,34,16,0.6)',
  parapet: '#4c3a1e', parapetTop: '#a89164',
  neon: '46,196,182', neon2: '255,93,143',
  accent: '#d8b356', door: '#2ec4b6',
  trunk: '#4a3014', canopy: [36, 108, 92], canopy2: [52, 128, 108],
  lampPost: '#6a4a1e', lampGlobe: '#9df0e6', lampGlow: '120,235,220',
  water: 'rgba(40,150,160,0.9)',
  stallCanvas: '#e8792e', stallCanvas2: '#f2e7cf', stallWood: '#6e4c26',
  statue: '#a89164', bench: '#6e4c26',
  vehicle: 'hover', vehicleBody: '#f2e7cf', vehicleGlass: 'rgba(46,196,182,0.75)',
  hedge: [44, 88, 70],
};

const PAL_RETRO: UrbanPal = {
  streetKind: 'slabs',
  streetBase: [74, 56, 88], streetJoint: 'rgba(24,12,30,0.6)', streetWorn: 'rgba(255,220,160,0.07)',
  sidewalkBase: [226, 211, 176], sidewalkJoint: 'rgba(120,96,60,0.4)',
  plazaA: [242, 231, 207], plazaB: [255, 178, 92], plazaJoint: 'rgba(90,64,36,0.45)',
  grassA: [86, 150, 92], grassB: [112, 172, 108],
  backdrop: [42, 26, 50],
  roofBase: [240, 228, 200], roofKind: 'pastel', roofJoint: 'rgba(120,96,60,0.35)',
  parapet: '#c9b78c', parapetTop: '#f2e7cf',
  neon: '46,196,182', neon2: '255,93,143',
  accent: '#ff9f1c', door: '#2ec4b6',
  trunk: '#6e4c26', canopy: [72, 168, 110], canopy2: [255, 150, 120],
  lampPost: '#2a1830', lampGlobe: '#ffd98c', lampGlow: '255,217,140',
  water: 'rgba(64,190,200,0.9)',
  stallCanvas: '#ff9f1c', stallCanvas2: '#f2e7cf', stallWood: '#8a6844',
  statue: '#e8d9b6', bench: '#2ec4b6',
  vehicle: 'hover', vehicleBody: '#ff9f1c', vehicleGlass: 'rgba(120,235,225,0.8)',
  hedge: [64, 130, 80],
};

const PAL_MEDIEVAL: UrbanPal = {
  streetKind: 'cobble',
  streetBase: [128, 122, 110], streetJoint: 'rgba(30,26,20,0.6)', streetWorn: 'rgba(20,16,10,0.2)',
  sidewalkBase: [148, 132, 104], sidewalkJoint: 'rgba(60,50,36,0.45)',
  plazaA: [140, 132, 116], plazaB: [116, 108, 92], plazaJoint: 'rgba(40,34,24,0.5)',
  grassA: [74, 108, 56], grassB: [94, 128, 70],
  backdrop: [48, 42, 30],
  roofBase: [146, 104, 54], roofKind: 'thatch', roofJoint: 'rgba(60,40,18,0.4)',
  parapet: '#4c3418', parapetTop: '#8a6a3a',
  accent: '#6e5636', door: '#4c3418',
  trunk: '#4c3418', canopy: [82, 122, 52], canopy2: [104, 140, 62],
  lampPost: '#2c2116', lampGlobe: '#ffca7a', lampGlow: '255,190,110',
  water: 'rgba(70,120,140,0.9)',
  stallCanvas: '#a8322e', stallCanvas2: '#e8dcc0', stallWood: '#5a3c1c',
  statue: '#b4ac9c', bench: '#5a3c1c',
  vehicle: 'cart', vehicleBody: '#6e4c26', vehicleGlass: 'rgba(200,220,235,0.7)',
  hedge: [64, 96, 48],
};

const PAL_HIBORIANO: UrbanPal = {
  ...PAL_MEDIEVAL,
  streetBase: [182, 156, 112], streetJoint: 'rgba(70,50,28,0.55)', streetWorn: 'rgba(60,40,20,0.16)',
  sidewalkBase: [196, 172, 128], sidewalkJoint: 'rgba(90,66,36,0.4)',
  plazaA: [188, 158, 106], plazaB: [160, 128, 82], plazaJoint: 'rgba(70,50,26,0.5)',
  grassA: [96, 116, 62], grassB: [122, 138, 76],
  backdrop: [56, 40, 24],
  roofBase: [168, 138, 88], roofKind: 'thatch', roofJoint: 'rgba(80,58,28,0.4)',
  stallCanvas: '#b07d3a', stallCanvas2: '#e8d8b0',
  statue: '#c9ae7e',
};

const PAL_FUTURISTA: UrbanPal = {
  streetKind: 'plates',
  streetBase: [58, 64, 76], streetJoint: 'rgba(150,170,190,0.25)', streetWorn: 'rgba(46,224,200,0.05)',
  sidewalkBase: [74, 82, 96], sidewalkJoint: 'rgba(20,24,30,0.6)',
  plazaA: [70, 78, 92], plazaB: [88, 98, 114], plazaJoint: 'rgba(20,24,30,0.55)',
  grassA: [52, 88, 74], grassB: [66, 106, 88],
  backdrop: [16, 20, 28],
  roofBase: [64, 72, 86], roofKind: 'metal', roofJoint: 'rgba(150,170,190,0.18)',
  parapet: '#39404d', parapetTop: '#5b6678',
  neon: '46,224,200',
  accent: '#2ee0c8', door: '#2ee0c8',
  trunk: '#3a4250', canopy: [56, 120, 104], canopy2: [70, 140, 120],
  lampPost: '#23272f', lampGlobe: '#c8e8ff', lampGlow: '190,225,255',
  water: 'rgba(46,224,200,0.85)',
  stallCanvas: '#39404d', stallCanvas2: '#7dffa8', stallWood: '#2a2f39',
  statue: '#7c8798', bench: '#39404d',
  vehicle: 'hover', vehicleBody: '#5b6678', vehicleGlass: 'rgba(120,235,225,0.75)',
  hedge: [48, 88, 76],
};

// ---------- registro ----------

const THEMES = new Map<string, CityTheme>([
  ['hibrido', makeCityTheme('hibrido', 'Cidade híbrida (pedra & neon)', PAL_HIBRIDO, 'round', 'GRANDE PRAÇA')],
  ['retrofuturista', makeCityTheme('retrofuturista', 'Cidade da era atômica', PAL_RETRO, 'round', 'SALÃO CÍVICO')],
  ['medieval', makeCityTheme('medieval', 'Vila medieval', PAL_MEDIEVAL, 'wooden', 'PRAÇA DO MERCADO')],
  ['hiboriano', makeCityTheme('hiboriano', 'Cidade hiboriana', PAL_HIBORIANO, 'wooden', 'FORO')],
  ['futurista', makeCityTheme('futurista', 'Distrito orbital', PAL_FUTURISTA, 'sliding', 'NÚCLEO')],
]);

export function getCityTheme(styleId: string): CityTheme {
  return THEMES.get(styleId) ?? THEMES.get('hibrido')!;
}

export function listCityThemes(): { id: string; label: string }[] {
  return [...THEMES.values()].map((t) => ({ id: t.id, label: t.label }));
}
