/**
 * Temas de exterior — fábricas de tiles e pintores compartilhados por paleta,
 * vestindo floresta/penhasco/campo/mina nos 5 estilos visuais. O HÍBRIDO
 * (pedra & neon, o planeta dos jogadores) é o tema de referência.
 */

import { RNG } from '../rng';
import type { CanvasFactory, Ctx } from '../render/textures';
import type { WildTheme, WildTilePainter } from './theme';

// ---------- helpers ----------

function mkCtx(create: CanvasFactory, px: number): { c: HTMLCanvasElement; x: Ctx } {
  const c = create(px, px);
  return { c, x: c.getContext('2d') as Ctx };
}

function rgb(c: [number, number, number] | string, k = 0): string {
  if (typeof c === 'string') {
    const h = c.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgb(${Math.max(0, Math.min(255, Math.round(r + k)))},${Math.max(0, Math.min(255, Math.round(g + k)))},${Math.max(0, Math.min(255, Math.round(b + k)))})`;
  }
  return `rgb(${Math.round(c[0] + k)},${Math.round(c[1] + k)},${Math.round(c[2] + k)})`;
}

function speckle(x: Ctx, px: number, rng: RNG, color: [number, number, number], n: number, alpha: number, size = 2): void {
  for (let i = 0; i < n; i++) {
    const v = rng.range(-14, 14);
    x.fillStyle = `rgba(${color[0] + v},${color[1] + v},${color[2] + v},${rng.range(alpha * 0.4, alpha)})`;
    x.fillRect(rng.range(0, px), rng.range(0, px), rng.range(0.6, size), rng.range(0.6, size));
  }
}

function rr(x: Ctx, rx: number, ry: number, w: number, h: number, r: number): void {
  x.beginPath();
  x.moveTo(rx + r, ry);
  x.arcTo(rx + w, ry, rx + w, ry + h, r);
  x.arcTo(rx + w, ry + h, rx, ry + h, r);
  x.arcTo(rx, ry + h, rx, ry, r);
  x.arcTo(rx, ry, rx + w, ry, r);
  x.closePath();
}

// ---------- tiles de terreno ----------

function tileGrass(a: [number, number, number], b: [number, number, number],
  flowers: [string, string]): WildTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 601);
    const px = o.px;
    x.fillStyle = rgb(a);
    x.fillRect(0, 0, px, px);
    // tufos em duas tonalidades
    for (let i = 0; i < 1500; i++) {
      const t = rng.chance(0.5) ? a : b;
      const v = rng.range(-13, 13);
      x.strokeStyle = `rgba(${t[0] + v},${t[1] + v},${t[2] + v},${rng.range(0.16, 0.42)})`;
      x.lineWidth = rng.range(0.5, 1.2);
      const gx = rng.range(0, px), gy = rng.range(0, px);
      x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + rng.jitter(3), gy - rng.range(1, 3.6)); x.stroke();
    }
    // flores silvestres esparsas
    for (let i = 0; i < 46; i++) {
      x.fillStyle = rng.chance(0.5) ? flowers[0] : flowers[1];
      x.beginPath(); x.arc(rng.range(0, px), rng.range(0, px), rng.range(0.8, 1.6), 0, Math.PI * 2); x.fill();
    }
    if (o.wear >= 2) speckle(x, px, rng, [a[0] + 26, a[1] + 20, a[2] + 6], 70 * o.wear, 0.1);
    return c;
  };
}

function tileDirt(a: [number, number, number], b: [number, number, number]): WildTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 607);
    const px = o.px;
    x.fillStyle = rgb(a);
    x.fillRect(0, 0, px, px);
    // manchas de umidade
    for (let i = 0; i < 7; i++) {
      const g = x.createRadialGradient(rng.range(0, px), rng.range(0, px), 2, rng.range(0, px), rng.range(0, px), px * rng.range(0.2, 0.42));
      g.addColorStop(0, `rgba(${b[0]},${b[1]},${b[2]},0.28)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, px, px);
    }
    // seixos
    for (let i = 0; i < 60; i++) {
      const v = rng.range(-16, 20);
      x.fillStyle = `rgba(${b[0] + v},${b[1] + v},${b[2] + v},${rng.range(0.3, 0.7)})`;
      x.beginPath();
      x.ellipse(rng.range(0, px), rng.range(0, px), rng.range(0.8, 2.4), rng.range(0.6, 1.6), rng.range(0, 3), 0, Math.PI * 2);
      x.fill();
    }
    if (o.wear >= 2) speckle(x, px, rng, [a[0] - 30, a[1] - 26, a[2] - 20], 80 * o.wear, 0.14);
    return c;
  };
}

function tileRock(a: [number, number, number], b: [number, number, number], joint: string): WildTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 613);
    const px = o.px;
    x.fillStyle = rgb(a);
    x.fillRect(0, 0, px, px);
    // facetas
    for (let i = 0; i < 9; i++) {
      const cx = rng.range(0, px), cy = rng.range(0, px);
      const r = px * rng.range(0.12, 0.3);
      x.fillStyle = `rgba(${b[0]},${b[1]},${b[2]},${rng.range(0.12, 0.3)})`;
      x.beginPath();
      x.moveTo(cx, cy - r);
      x.lineTo(cx + r * rng.range(0.7, 1.1), cy + r * 0.4);
      x.lineTo(cx - r * rng.range(0.7, 1.1), cy + r * 0.5);
      x.closePath(); x.fill();
    }
    // fissuras
    x.strokeStyle = joint;
    x.lineWidth = Math.max(1, px * 0.008);
    for (let i = 0; i < 6; i++) {
      let gx = rng.range(0, px), gy = rng.range(0, px);
      x.beginPath(); x.moveTo(gx, gy);
      for (let s = 0; s < 4; s++) {
        gx += rng.jitter(px * 0.14); gy += rng.jitter(px * 0.14);
        x.lineTo(gx, gy);
      }
      x.stroke();
    }
    if (o.wear >= 2) speckle(x, px, rng, [a[0] + 30, a[1] + 30, a[2] + 32], 60 * o.wear, 0.12);
    return c;
  };
}

function tileSand(a: [number, number, number], b: [number, number, number]): WildTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 619);
    const px = o.px;
    x.fillStyle = rgb(a);
    x.fillRect(0, 0, px, px);
    // ondulações de vento
    x.strokeStyle = `rgba(${b[0]},${b[1]},${b[2]},0.4)`;
    x.lineWidth = Math.max(1, px * 0.007);
    for (let i = 0; i < 9; i++) {
      const gy = rng.range(0, px);
      x.beginPath();
      x.moveTo(0, gy);
      for (let sgx = 0; sgx <= px; sgx += px / 6) {
        x.lineTo(sgx, gy + Math.sin(sgx * 0.05 + i) * px * 0.02);
      }
      x.stroke();
    }
    speckle(x, px, rng, b, 90, 0.2, 1.6);
    return c;
  };
}

function tileField(base: [number, number, number], row: string, sprout: string): WildTilePainter {
  return (create, o) => {
    const { c, x } = mkCtx(create, o.px);
    const rng = new RNG(o.seed + 631);
    const px = o.px;
    x.fillStyle = rgb(base);
    x.fillRect(0, 0, px, px);
    // sulcos de plantio (linhas no eixo x)
    const n = 6;
    x.strokeStyle = row;
    x.lineWidth = Math.max(1.4, px * 0.02);
    for (let i = 0; i <= n; i++) {
      const gy = (i / n) * px;
      x.beginPath(); x.moveTo(0, gy); x.lineTo(px, gy + rng.jitter(1)); x.stroke();
    }
    // brotos ao longo das linhas
    x.strokeStyle = sprout;
    x.lineWidth = Math.max(1, px * 0.01);
    for (let i = 0; i < n; i++) {
      const gy = ((i + 0.5) / n) * px;
      for (let jx = 0; jx < px; jx += px / 8) {
        const v = rng.range(-10, 10);
        x.strokeStyle = `rgba(${parseInt(sprout.slice(1, 3), 16) + v},${parseInt(sprout.slice(3, 5), 16) + v},${parseInt(sprout.slice(5, 7), 16) + v},0.75)`;
        x.beginPath();
        x.moveTo(jx, gy);
        x.lineTo(jx + rng.jitter(2.4), gy - rng.range(2, 5));
        x.stroke();
      }
    }
    if (o.wear >= 2) speckle(x, px, rng, [base[0] + 20, base[1] + 16, base[2] + 8], 60, 0.12);
    return c;
  };
}

// ---------- paleta ----------

export interface WildPal {
  grassA: [number, number, number]; grassB: [number, number, number];
  flowers: [string, string];
  dirtA: [number, number, number]; dirtB: [number, number, number];
  rockA: [number, number, number]; rockB: [number, number, number]; rockJoint: string;
  sandA: [number, number, number]; sandB: [number, number, number];
  fieldBase: [number, number, number]; fieldRow: string; fieldSprout: string;
  waterBase: string; waterHi: string; waterEdge: string;
  cliffFace: string; cliffTop: string;
  trunk: string;
  canopy: [number, number, number]; canopy2: [number, number, number];
  pine: [number, number, number];
  bush: [number, number, number];
  rock: string;
  hay: string; fenceWood: string;
  crystal: string; crystalGlow: string;
  cartWood: string; timberWood: string;
  lanternPost: string; lanternGlow: string;
  caveDark: string; caveFrame: string;
  darkness: [number, number, number];
}

// ---------- pintores de adereços ----------

function wildPainters(pal: WildPal): WildTheme['propPainters'] {
  const treeCrown = (x: Ctx, r: number, rng: RNG, tones: [[number, number, number], [number, number, number]]) => {
    for (const [ox, oy, k] of [[0, -r * 0.3, 12], [-r * 0.3, -r * 0.05, -8], [r * 0.3, -r * 0.08, 0]] as const) {
      const t = rng.chance(0.5) ? tones[0] : tones[1];
      const g = x.createRadialGradient(ox - r * 0.08, oy - r * 0.1, r * 0.05, ox, oy, r * 0.44);
      g.addColorStop(0, rgb(t, k + 14));
      g.addColorStop(1, rgb(t, k - 16));
      x.fillStyle = g;
      x.beginPath(); x.arc(ox, oy, r * 0.44, 0, Math.PI * 2); x.fill();
    }
  };

  return {
    broadleaf(x, w, h, env) {
      const rng = env.rng;
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.26)';
      x.beginPath(); x.ellipse(0.12, 0.16, r * 0.6, r * 0.48, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = pal.trunk;
      x.lineWidth = r * 0.16;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, r * 0.42); x.lineTo(rng.jitter(0.05), -r * 0.05); x.stroke();
      treeCrown(x, r, rng, [pal.canopy, pal.canopy2]);
    },

    oak(x, w, h, env) {
      const rng = env.rng;
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.28)';
      x.beginPath(); x.ellipse(0.14, 0.18, r * 0.62, r * 0.5, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = pal.trunk;
      x.lineWidth = r * 0.2;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, r * 0.44); x.lineTo(rng.jitter(0.06), -r * 0.08); x.stroke();
      // copa mais cheia, mais arredondada
      const g = x.createRadialGradient(-r * 0.12, -r * 0.2, r * 0.08, 0, -r * 0.05, r * 0.62);
      g.addColorStop(0, rgb(pal.canopy, 18));
      g.addColorStop(0.75, rgb(pal.canopy2, -6));
      g.addColorStop(1, rgb(pal.canopy2, -22));
      x.fillStyle = g;
      x.beginPath(); x.arc(0, -r * 0.05, r * 0.6, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.18)';
      x.lineWidth = 0.03;
      x.beginPath(); x.arc(0, -r * 0.05, r * 0.6, 0, Math.PI * 2); x.stroke();
    },

    pine(x, w, h, env) {
      const rng = env.rng;
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.26)';
      x.beginPath(); x.ellipse(0.1, 0.14, r * 0.5, r * 0.42, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = pal.trunk;
      x.lineWidth = r * 0.12;
      x.beginPath(); x.moveTo(0, r * 0.42); x.lineTo(rng.jitter(0.04), -r * 0.1); x.stroke();
      // três camadas cônicas
      for (const [fy, fw, k] of [[0.28, 0.5, -12], [0.02, 0.72, 0], [-0.26, 0.94, 12]] as const) {
        const g = x.createLinearGradient(0, r * fy - r * 0.3, 0, r * fy + r * 0.34);
        g.addColorStop(0, rgb(pal.pine, k + 10));
        g.addColorStop(1, rgb(pal.pine, k - 18));
        x.fillStyle = g;
        x.beginPath();
        x.moveTo(0, r * fy - r * 0.42);
        x.lineTo(r * fw * 0.5, r * fy + r * 0.3);
        x.lineTo(-r * fw * 0.5, r * fy + r * 0.3);
        x.closePath(); x.fill();
      }
    },

    bush(x, w, h, env) {
      const rng = env.rng;
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.22)';
      x.beginPath(); x.ellipse(0.06, 0.08, r * 0.55, r * 0.42, 0, 0, Math.PI * 2); x.fill();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + rng.jitter(0.4);
        const bx = Math.cos(a) * r * 0.26, by = Math.sin(a) * r * 0.26;
        const g = x.createRadialGradient(bx - r * 0.06, by - r * 0.08, r * 0.04, bx, by, r * 0.3);
        g.addColorStop(0, rgb(pal.bush, 14));
        g.addColorStop(1, rgb(pal.bush, -14));
        x.fillStyle = g;
        x.beginPath(); x.arc(bx, by, r * 0.3, 0, Math.PI * 2); x.fill();
      }
      // bagas/flores
      x.fillStyle = pal.flowers[0];
      for (let i = 0; i < 4; i++) {
        x.beginPath(); x.arc(rng.jitter(r * 0.5), rng.jitter(r * 0.5), 0.05, 0, Math.PI * 2); x.fill();
      }
    },

    rock(x, w, h, env) {
      const rng = env.rng;
      const g = x.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      g.addColorStop(0, rgb(pal.rockA, 20));
      g.addColorStop(1, rgb(pal.rockA, -18));
      x.fillStyle = 'rgba(0,0,0,0.3)';
      x.beginPath(); x.ellipse(0.06, 0.1, w * 0.5, h * 0.42, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(-w * 0.46, h * 0.1);
      x.lineTo(-w * 0.24, -h * 0.4);
      x.lineTo(w * 0.18, -h * 0.46);
      x.lineTo(w * 0.48, -h * 0.05);
      x.lineTo(w * 0.34, h * 0.4);
      x.lineTo(-w * 0.3, h * 0.44);
      x.closePath(); x.fill();
      x.strokeStyle = pal.rockJoint;
      x.lineWidth = 0.03;
      x.stroke();
      // fenda de luz
      x.strokeStyle = `rgba(${pal.rockB[0]},${pal.rockB[1]},${pal.rockB[2]},0.7)`;
      x.lineWidth = 0.05;
      x.beginPath(); x.moveTo(-w * 0.2, -h * 0.1); x.lineTo(w * 0.1, h * 0.12); x.stroke();
      void rng;
    },

    stump(x, w, h) {
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.26)';
      x.beginPath(); x.ellipse(0.05, 0.08, r * 0.52, r * 0.42, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = pal.trunk;
      x.beginPath(); x.arc(0, 0, r * 0.46, 0, Math.PI * 2); x.fill();
      x.fillStyle = rgb(pal.rockA, 60);
      x.beginPath(); x.arc(0, 0, r * 0.34, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(60,40,18,0.6)';
      x.lineWidth = 0.03;
      for (const rr2 of [0.12, 0.22]) {
        x.beginPath(); x.arc(0, 0, r * rr2, 0, Math.PI * 2); x.stroke();
      }
    },

    log(x, w, h, env) {
      const rng = env.rng;
      x.fillStyle = 'rgba(0,0,0,0.26)';
      rr(x, -w / 2 + 0.05, -h / 2 + 0.07, w, h, h / 2);
      x.fill();
      const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, rgb(pal.cartWood, 16));
      g.addColorStop(1, rgb(pal.cartWood, -16));
      x.fillStyle = g;
      rr(x, -w / 2, -h / 2, w, h, h / 2);
      x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.4)';
      x.lineWidth = 0.03;
      x.stroke();
      // anéis nas pontas
      x.fillStyle = rgb(pal.cartWood, 34);
      for (const ex of [-w / 2 + 0.05, w / 2 - 0.05]) {
        x.beginPath(); x.ellipse(ex, 0, h * 0.32, h * 0.4, 0, 0, Math.PI * 2); x.fill();
      }
      // casca
      x.strokeStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 3; i++) {
        const ly = -h * 0.25 + i * h * 0.25;
        x.beginPath(); x.moveTo(-w * 0.35, ly + rng.jitter(0.05)); x.lineTo(w * 0.35, ly + rng.jitter(0.05)); x.stroke();
      }
    },

    flowers(x, w, h, env) {
      const rng = env.rng;
      // mancha de grama alta com flores coloridas (não bloqueia)
      for (let i = 0; i < 26; i++) {
        const gx = rng.jitter(w * 0.42), gy = rng.jitter(h * 0.42);
        x.strokeStyle = `rgba(${pal.bush[0]},${pal.bush[1]},${pal.bush[2]},${rng.range(0.3, 0.6)})`;
        x.lineWidth = 0.7;
        x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + rng.jitter(1.4), gy - rng.range(1.5, 3.4)); x.stroke();
      }
      for (let i = 0; i < 14; i++) {
        x.globalAlpha = 0.85;
        x.fillStyle = rng.chance(0.5) ? pal.flowers[0] : pal.flowers[1];
        x.beginPath(); x.arc(rng.jitter(w * 0.4), rng.jitter(h * 0.4), rng.range(0.05, 0.1), 0, Math.PI * 2); x.fill();
      }
      x.globalAlpha = 1;
    },

    haystack(x, w, h) {
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.26)';
      x.beginPath(); x.ellipse(0.08, 0.12, r * 0.55, r * 0.44, 0, 0, Math.PI * 2); x.fill();
      const g = x.createRadialGradient(-r * 0.1, -r * 0.12, r * 0.06, 0, 0, r * 0.52);
      g.addColorStop(0, rgb(pal.hay, 26));
      g.addColorStop(1, rgb(pal.hay, -20));
      x.fillStyle = g;
      x.beginPath(); x.arc(0, 0, r * 0.5, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(90,60,20,0.5)';
      x.lineWidth = 0.03;
      for (const a2 of [0.2, 0.45]) {
        x.beginPath(); x.arc(0, 0, r * a2, 0, Math.PI * 2); x.stroke();
      }
    },

    fence(x, w, h) {
      x.fillStyle = 'rgba(0,0,0,0.24)';
      rr(x, -w / 2 + 0.03, -h / 2 + 0.04, w, h, h * 0.3);
      x.fill();
      x.fillStyle = pal.fenceWood;
      rr(x, -w / 2, -h / 2, w, h * 0.55, h * 0.2);
      x.fill();
      // mourões
      x.fillStyle = rgb(pal.cartWood, -12);
      for (const mx of [-w / 2 + 0.08, 0, w / 2 - 0.08]) {
        x.fillRect(mx - 0.05, -h * 0.42, 0.1, h * 0.84);
      }
    },

    crystal(x, w, h, env) {
      const rng = env.rng;
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.28)';
      x.beginPath(); x.ellipse(0.05, 0.09, r * 0.5, r * 0.4, 0, 0, Math.PI * 2); x.fill();
      x.save();
      x.shadowColor = pal.crystalGlow;
      x.shadowBlur = 0.16;
      const n = 3 + (env.variant % 2);
      for (let i = 0; i < n; i++) {
        const bx = (i - (n - 1) / 2) * r * 0.34;
        const bh = r * rng.range(0.6, 1.05);
        const g = x.createLinearGradient(bx, -bh, bx, 0);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.25, pal.crystal);
        g.addColorStop(1, rgb(pal.darkness, 0));
        x.fillStyle = g;
        x.beginPath();
        x.moveTo(bx, -bh);
        x.lineTo(bx + r * 0.16, -bh * 0.22);
        x.lineTo(bx + r * 0.12, 0);
        x.lineTo(bx - r * 0.12, 0);
        x.lineTo(bx - r * 0.16, -bh * 0.22);
        x.closePath(); x.fill();
      }
      x.restore();
    },

    shard(x, w, h, env) {
      const rng = env.rng;
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.24)';
      x.beginPath(); x.ellipse(0.04, 0.07, r * 0.46, r * 0.36, 0, 0, Math.PI * 2); x.fill();
      const g = x.createLinearGradient(-r * 0.2, -r * 0.4, r * 0.2, r * 0.3);
      g.addColorStop(0, rgb(pal.rockB, 26));
      g.addColorStop(1, rgb(pal.rockA, -12));
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(rng.jitter(0.08), -r * 0.46);
      x.lineTo(r * 0.3, r * 0.28);
      x.lineTo(-r * 0.32, r * 0.3);
      x.closePath(); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.35)';
      x.lineWidth = 0.03;
      x.stroke();
    },

    cart(x, w, h) {
      x.fillStyle = 'rgba(0,0,0,0.3)';
      rr(x, -w / 2 + 0.05, -h / 2 + 0.07, w, h, 0.1);
      x.fill();
      const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, rgb(pal.cartWood, 14));
      g.addColorStop(1, rgb(pal.cartWood, -16));
      x.fillStyle = g;
      rr(x, -w / 2, -h / 2, w * 0.8, h, 0.1);
      x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.45)';
      x.lineWidth = 0.03;
      x.stroke();
      // caçamba com minério
      x.fillStyle = 'rgba(20,14,10,0.85)';
      rr(x, -w * 0.34, -h * 0.32, w * 0.5, h * 0.64, 0.06);
      x.fill();
      x.fillStyle = pal.crystal;
      for (let i = 0; i < 3; i++) {
        x.beginPath(); x.arc(-w * 0.24 + i * w * 0.14, rngless(i), 0.07, 0, Math.PI * 2); x.fill();
      }
      // rodas
      x.fillStyle = '#241a10';
      for (const wx of [-w * 0.28, w * 0.2]) {
        x.beginPath(); x.arc(wx, h * 0.52, h * 0.2, 0, Math.PI * 2); x.fill();
      }
      // cabo inclinado
      x.strokeStyle = pal.timberWood;
      x.lineWidth = 0.07;
      x.beginPath(); x.moveTo(w * 0.36, 0); x.lineTo(w * 0.52, 0); x.stroke();
      function rngless(i: number): number { return (i - 1) * h * 0.1; }
    },

    timber(x, w, h) {
      // suporte de madeira da mina (vista topo: viga dupla com colunas)
      x.fillStyle = 'rgba(0,0,0,0.28)';
      rr(x, -w / 2 + 0.04, -h / 2 + 0.06, w, h, 0.06);
      x.fill();
      x.fillStyle = pal.timberWood;
      rr(x, -w / 2, -h / 2, w, h * 0.28, 0.04);
      x.fill();
      rr(x, -w / 2, h * 0.22 - h * 0.0, w, h * 0.28, 0.04);
      x.fill();
      x.fillStyle = rgb(pal.cartWood, -18);
      for (const cx3 of [-w / 2 + 0.1, w / 2 - 0.1]) {
        x.fillRect(cx3 - 0.05, -h * 0.3, 0.1, h * 0.6);
      }
    },

    lantern(x, w, h) {
      const r = Math.min(w, h) / 2;
      x.fillStyle = 'rgba(0,0,0,0.3)';
      x.beginPath(); x.ellipse(0.04, 0.05, r * 0.4, r * 0.32, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = pal.lanternPost;
      x.lineWidth = r * 0.18;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, r * 0.4); x.lineTo(0, -r * 0.2); x.stroke();
      x.save();
      x.shadowColor = pal.lanternGlow;
      x.shadowBlur = r * 0.5;
      const g = x.createRadialGradient(-r * 0.06, -r * 0.34, r * 0.03, 0, -r * 0.28, r * 0.22);
      g.addColorStop(0, '#fff6da');
      g.addColorStop(1, `rgba(${pal.lanternGlow},1)`);
      x.fillStyle = g;
      x.beginPath(); x.arc(0, -r * 0.28, r * 0.2, 0, Math.PI * 2); x.fill();
      x.restore();
    },

    entrance(x, w, h) {
      // boca da mina: abertura escura contra a rocha, com mourão de madeira
      x.fillStyle = 'rgba(0,0,0,0.4)';
      x.beginPath(); x.ellipse(0.12, 0.18, w * 0.42, h * 0.4, 0, 0, Math.PI * 2); x.fill();
      const g = x.createRadialGradient(0, 0, w * 0.05, 0, 0, w * 0.42);
      g.addColorStop(0, '#050302');
      g.addColorStop(0.8, pal.caveDark);
      g.addColorStop(1, rgb(pal.rockA, -30));
      x.fillStyle = g;
      x.beginPath(); x.ellipse(0, 0, w * 0.4, h * 0.38, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = pal.caveFrame;
      x.lineWidth = 0.14;
      x.beginPath(); x.ellipse(0, 0, w * 0.4, h * 0.38, 0, 0, Math.PI * 2); x.stroke();
      // mourões
      x.strokeStyle = pal.timberWood;
      x.lineWidth = 0.12;
      x.beginPath(); x.moveTo(-w * 0.28, -h * 0.3); x.lineTo(-w * 0.28, h * 0.3); x.stroke();
      x.beginPath(); x.moveTo(w * 0.28, -h * 0.3); x.lineTo(w * 0.28, h * 0.3); x.stroke();
      x.beginPath(); x.moveTo(-w * 0.32, -h * 0.26); x.lineTo(w * 0.32, -h * 0.26); x.stroke();
    },
  };
}

// ---------- montagem ----------

function makeWildTheme(id: string, label: string, pal: WildPal): WildTheme {
  return {
    id,
    label,
    grass: tileGrass(pal.grassA, pal.grassB, pal.flowers),
    dirt: tileDirt(pal.dirtA, pal.dirtB),
    rock: tileRock(pal.rockA, pal.rockB, pal.rockJoint),
    sand: tileSand(pal.sandA, pal.sandB),
    field: tileField(pal.fieldBase, pal.fieldRow, pal.fieldSprout),
    waterBase: pal.waterBase,
    waterHi: pal.waterHi,
    waterEdge: pal.waterEdge,
    cliffFace: pal.cliffFace,
    cliffTop: pal.cliffTop,
    propPainters: wildPainters(pal),
    propLight: {
      lantern: { r: 5.0, strength: 0.85 },
      crystal: { r: 2.6, strength: 0.35 },
      entrance: { r: 3.0, strength: 0.3 },
    },
    propGlow: {
      lantern: { r: 1.1, alpha: 0.42, color: pal.lanternGlow },
      crystal: { r: 1.5, alpha: 0.35, color: pal.crystalGlow },
    },
    darknessColor: pal.darkness.map((v) => Math.max(8, Math.round(v * 0.3))).join(','),
  };
}

// ---------- paletas dos 5 estilos ----------

const PAL_HIBRIDO: WildPal = {
  grassA: [58, 88, 58], grassB: [76, 108, 66],
  flowers: ['#2ec4b6', '#ff5d8f'],
  dirtA: [138, 114, 78], dirtB: [168, 144, 104],
  rockA: [116, 106, 92], rockB: [148, 138, 120], rockJoint: 'rgba(40,32,22,0.55)',
  sandA: [176, 154, 112], sandB: [196, 176, 136],
  fieldBase: [112, 96, 54], fieldRow: 'rgba(70,56,26,0.6)', fieldSprout: '#7fae5c',
  waterBase: 'rgba(32,110,116,0.92)', waterHi: 'rgba(70,190,196,0.55)', waterEdge: 'rgba(214,190,140,0.85)',
  cliffFace: '#3a2c18', cliffTop: '#a89164',
  trunk: '#4a3014',
  canopy: [34, 96, 78], canopy2: [52, 116, 92],
  pine: [30, 76, 66],
  bush: [46, 92, 70],
  rock: '#8a7a62',
  hay: '#c9a44e', fenceWood: '#6e4c26',
  crystal: '#2ec4b6', crystalGlow: '70,225,210',
  cartWood: '#7a5628', timberWood: '#5f421e',
  lanternPost: '#3f2c12', lanternGlow: '255,205,120',
  caveDark: '#120c06', caveFrame: '#4c3a1e',
  darkness: [40, 30, 20],
};

const PAL_RETRO: WildPal = {
  grassA: [84, 148, 88], grassB: [110, 172, 104],
  flowers: ['#ff96aa', '#3ed6c6'],
  dirtA: [206, 186, 148], dirtB: [228, 210, 174],
  rockA: [128, 132, 150], rockB: [160, 164, 184], rockJoint: 'rgba(40,36,60,0.5)',
  sandA: [236, 220, 178], sandB: [246, 232, 196],
  fieldBase: [150, 170, 92], fieldRow: 'rgba(90,110,48,0.6)', fieldSprout: '#d8ec9a',
  waterBase: 'rgba(52,178,190,0.9)', waterHi: 'rgba(150,240,240,0.6)', waterEdge: 'rgba(246,232,196,0.9)',
  cliffFace: '#3c3050', cliffTop: '#e9dcc0',
  trunk: '#8a5a2e',
  canopy: [64, 158, 102], canopy2: [255, 158, 130],
  pine: [48, 130, 96],
  bush: [74, 156, 100],
  rock: '#9aa0b4',
  hay: '#e8c45e', fenceWood: '#b4834a',
  crystal: '#ff5d8f', crystalGlow: '255,120,160',
  cartWood: '#a8763e', timberWood: '#8a5f30',
  lanternPost: '#2a1830', lanternGlow: '255,217,140',
  caveDark: '#1c1226', caveFrame: '#5c4a78',
  darkness: [46, 30, 54],
};

const PAL_MEDIEVAL: WildPal = {
  grassA: [64, 96, 50], grassB: [84, 118, 62],
  flowers: ['#d8d3c0', '#c49a4a'],
  dirtA: [118, 94, 62], dirtB: [146, 120, 84],
  rockA: [112, 110, 104], rockB: [142, 140, 132], rockJoint: 'rgba(30,28,24,0.6)',
  sandA: [168, 150, 112], sandB: [188, 172, 136],
  fieldBase: [96, 84, 48], fieldRow: 'rgba(56,48,24,0.65)', fieldSprout: '#8aa456',
  waterBase: 'rgba(52,94,116,0.92)', waterHi: 'rgba(120,170,190,0.45)', waterEdge: 'rgba(178,162,126,0.8)',
  cliffFace: '#26221c', cliffTop: '#8f8a7c',
  trunk: '#4c3418',
  canopy: [62, 100, 46], canopy2: [88, 126, 56],
  pine: [44, 82, 44],
  bush: [70, 104, 54],
  rock: '#7c7a70',
  hay: '#b8963e', fenceWood: '#5a3c1c',
  crystal: '#7ab8c8', crystalGlow: '130,190,210',
  cartWood: '#6e4c26', timberWood: '#54381a',
  lanternPost: '#2c2116', lanternGlow: '255,190,110',
  caveDark: '#0e0c08', caveFrame: '#3c2f1a',
  darkness: [34, 30, 22],
};

const PAL_HIBORIANO: WildPal = {
  grassA: [98, 106, 54], grassB: [124, 130, 68],
  flowers: ['#d8b356', '#c46a3a'],
  dirtA: [158, 128, 86], dirtB: [186, 156, 112],
  rockA: [132, 108, 82], rockB: [164, 140, 110], rockJoint: 'rgba(60,44,26,0.6)',
  sandA: [196, 168, 118], sandB: [214, 190, 144],
  fieldBase: [128, 108, 58], fieldRow: 'rgba(80,64,28,0.6)', fieldSprout: '#c0b45e',
  waterBase: 'rgba(58,112,124,0.9)', waterHi: 'rgba(140,190,196,0.5)', waterEdge: 'rgba(204,180,132,0.85)',
  cliffFace: '#3c2812', cliffTop: '#c9ae7e',
  trunk: '#5c3c1a',
  canopy: [92, 110, 50], canopy2: [128, 138, 72],
  pine: [70, 92, 46],
  bush: [104, 116, 58],
  rock: '#96795a',
  hay: '#cfa54a', fenceWood: '#6a4820',
  crystal: '#d8753a', crystalGlow: '240,150,80',
  cartWood: '#7a5424', timberWood: '#5e4018',
  lanternPost: '#33230f', lanternGlow: '255,180,96',
  caveDark: '#160e06', caveFrame: '#503618',
  darkness: [44, 32, 18],
};

const PAL_FUTURISTA: WildPal = {
  grassA: [46, 78, 66], grassB: [60, 96, 80],
  flowers: ['#2ee0c8', '#7dffa8'],
  dirtA: [62, 68, 80], dirtB: [86, 94, 108],
  rockA: [74, 82, 96], rockB: [100, 110, 128], rockJoint: 'rgba(18,22,28,0.6)',
  sandA: [104, 112, 124], sandB: [128, 136, 150],
  fieldBase: [56, 84, 66], fieldRow: 'rgba(30,52,38,0.7)', fieldSprout: '#7dffa8',
  waterBase: 'rgba(28,120,126,0.9)', waterHi: 'rgba(46,224,200,0.5)', waterEdge: 'rgba(150,170,190,0.7)',
  cliffFace: '#14181f', cliffTop: '#5b6678',
  trunk: '#39404d',
  canopy: [52, 112, 94], canopy2: [70, 140, 116],
  pine: [44, 96, 84],
  bush: [58, 110, 92],
  rock: '#646e80',
  hay: '#9aa67a', fenceWood: '#39404d',
  crystal: '#2ee0c8', crystalGlow: '46,224,200',
  cartWood: '#4a5262', timberWood: '#363d4a',
  lanternPost: '#23272f', lanternGlow: '190,225,255',
  caveDark: '#05070a', caveFrame: '#39404d',
  darkness: [14, 18, 24],
};

// ---------- registro ----------

const THEMES = new Map<string, WildTheme>([
  ['hibrido', makeWildTheme('hibrido', 'Exterior híbrido (pedra & neon)', PAL_HIBRIDO)],
  ['retrofuturista', makeWildTheme('retrofuturista', 'Exterior da era atômica', PAL_RETRO)],
  ['medieval', makeWildTheme('medieval', 'Exterior medieval', PAL_MEDIEVAL)],
  ['hiboriano', makeWildTheme('hiboriano', 'Estepes hiborianas', PAL_HIBORIANO)],
  ['futurista', makeWildTheme('futurista', 'Zona terraformada orbital', PAL_FUTURISTA)],
]);

export function getWildTheme(styleId: string): WildTheme {
  return THEMES.get(styleId) ?? THEMES.get('hibrido')!;
}

export function listWildThemes(): { id: string; label: string }[] {
  return [...THEMES.values()].map((t) => ({ id: t.id, label: t.label }));
}
