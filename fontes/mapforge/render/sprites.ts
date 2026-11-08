/**
 * Sprites vetoriais dos objetos e portas — estilo retrofuturista.
 * Cada painter desenha em espaço local centrado em (0,0), em METROS,
 * com a rotação da prop já aplicada pelo renderizador.
 */

import { RNG } from '../rng';
import type { Ctx } from './textures';

export interface SpriteEnv {
  rng: RNG; // derivado do id da prop (determinístico)
  variant: number;
  wear: number; // 0..3
}

const NEON = '#2ee0c8';
const AMBER = '#ffb454';
const GREEN = '#7dffa8';
const RED = '#ff5470';

function roundRect(x: Ctx, rx: number, ry: number, w: number, h: number, r: number): void {
  x.beginPath();
  x.moveTo(rx + r, ry);
  x.arcTo(rx + w, ry, rx + w, ry + h, r);
  x.arcTo(rx + w, ry + h, rx, ry + h, r);
  x.arcTo(rx, ry + h, rx, ry, r);
  x.arcTo(rx, ry, rx + w, ry, r);
  x.closePath();
}

function hazardStripes(x: Ctx, rx: number, ry: number, w: number, h: number, angle = 0): void {
  x.save();
  x.beginPath();
  x.rect(rx, ry, w, h);
  x.clip();
  x.fillStyle = '#c9a227';
  x.fillRect(rx, ry, w, h);
  x.fillStyle = '#15161a';
  const diag = Math.hypot(w, h);
  x.translate(rx + w / 2, ry + h / 2);
  x.rotate(angle - Math.PI / 4);
  for (let p = -diag; p < diag; p += 0.22) {
    x.fillRect(p, -diag, 0.11, diag * 2);
  }
  x.restore();
}

function bodyGradient(x: Ctx, y0: number, y1: number, top: string, bot: string): CanvasGradient {
  const g = x.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  return g;
}

function screw(x: Ctx, cx: number, cy: number, r = 0.03): void {
  const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  g.addColorStop(0, 'rgba(210,225,240,0.8)');
  g.addColorStop(1, 'rgba(10,12,16,0.9)');
  x.fillStyle = g;
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
}

// ---------- props ----------

export const PROP_PAINTERS: Record<string, (x: Ctx, w: number, h: number, env: SpriteEnv) => void> = {
  console(x, w, h, env) {
    const hue = [NEON, GREEN, AMBER][env.variant % 3];
    // base
    x.fillStyle = bodyGradient(x, -h / 2, h / 2, '#3a4250', '#242a34');
    roundRect(x, -w / 2, -h / 2, w, h, 0.08);
    x.fill();
    x.strokeStyle = 'rgba(160,180,200,0.25)';
    x.lineWidth = 0.02;
    x.stroke();
    // console inclinado (metade superior)
    x.fillStyle = bodyGradient(x, -h / 2, 0, '#4b5566', '#323a47');
    roundRect(x, -w / 2 + 0.07, -h / 2 + 0.06, w - 0.14, h * 0.52, 0.05);
    x.fill();
    // tela
    const sw = w * 0.62, sh = h * 0.3;
    x.save();
    x.shadowColor = hue;
    x.shadowBlur = 0.12;
    x.fillStyle = 'rgba(8,14,16,0.95)';
    roundRect(x, -sw / 2, -h / 2 + 0.1, sw, sh, 0.03);
    x.fill();
    x.restore();
    // linhas de UI na tela
    x.strokeStyle = hue;
    x.globalAlpha = 0.85;
    x.lineWidth = 0.016;
    const rows = 3 + (env.variant % 2);
    for (let i = 0; i < rows; i++) {
      const yy = -h / 2 + 0.14 + (sh - 0.08) * (i / rows);
      const len = sw * (0.3 + env.rng.next() * 0.55);
      x.beginPath(); x.moveTo(-sw / 2 + 0.06, yy); x.lineTo(-sw / 2 + 0.06 + len, yy); x.stroke();
    }
    x.globalAlpha = 1;
    // botões
    for (let i = 0; i < 4; i++) {
      x.fillStyle = i === env.variant % 4 ? hue : '#1b2027';
      x.beginPath();
      x.arc(w / 2 - 0.14 - i * 0.11, h / 2 - 0.16, 0.028, 0, Math.PI * 2);
      x.fill();
    }
    // pés
    screw(x, -w / 2 + 0.08, h / 2 - 0.08);
    screw(x, w / 2 - 0.08, h / 2 - 0.08);
  },

  serverRack(x, w, h, env) {
    x.fillStyle = bodyGradient(x, -h / 2, h / 2, '#333b48', '#1e232c');
    roundRect(x, -w / 2, -h / 2, w, h, 0.05);
    x.fill();
    x.strokeStyle = 'rgba(150,170,190,0.22)';
    x.lineWidth = 0.02;
    x.stroke();
    // gavetas com LEDs
    const rows = 6;
    for (let i = 0; i < rows; i++) {
      const yy = -h / 2 + 0.12 + i * ((h - 0.24) / rows);
      x.fillStyle = 'rgba(10,12,16,0.6)';
      x.fillRect(-w / 2 + 0.08, yy, w - 0.16, (h - 0.24) / rows - 0.05);
      const on = env.rng.chance(0.7);
      x.fillStyle = on ? (env.rng.chance(0.25) ? AMBER : GREEN) : '#232a33';
      x.beginPath();
      x.arc(-w / 2 + 0.15, yy + ((h - 0.24) / rows - 0.05) / 2, 0.022, 0, Math.PI * 2);
      x.fill();
    }
    // ventilação lateral
    x.strokeStyle = 'rgba(0,0,0,0.5)';
    x.lineWidth = 0.015;
    for (let i = 0; i < 5; i++) {
      x.beginPath();
      x.moveTo(w / 2 - 0.16, -h / 2 + 0.2 + i * 0.12);
      x.lineTo(w / 2 - 0.06, -h / 2 + 0.2 + i * 0.12);
      x.stroke();
    }
  },

  crate(x, w, h, env) {
    const s = Math.min(w, h);
    // face superior
    x.fillStyle = bodyGradient(x, -s / 2, s / 2, '#4d5665', '#39404d');
    roundRect(x, -s / 2, -s / 2, s, s, 0.06);
    x.fill();
    x.strokeStyle = 'rgba(170,190,210,0.3)';
    x.lineWidth = 0.025;
    x.stroke();
    // moldura interna
    x.strokeStyle = 'rgba(0,0,0,0.35)';
    x.lineWidth = 0.02;
    x.strokeRect(-s / 2 + 0.09, -s / 2 + 0.09, s - 0.18, s - 0.18);
    // faixa de perigo em dois lados
    hazardStripes(x, -s / 2 + 0.02, -s / 2 + 0.02, s - 0.04, 0.09);
    hazardStripes(x, -s / 2 + 0.02, s / 2 - 0.11, s - 0.04, 0.09);
    // estêncil
    x.fillStyle = 'rgba(220,230,240,0.5)';
    x.font = `bold ${s * 0.22}px monospace`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(`C-${40 + (env.variant % 50)}`, 0, s * 0.12);
    screw(x, -s / 2 + 0.07, -s / 2 + 0.2);
    screw(x, s / 2 - 0.07, -s / 2 + 0.2);
    screw(x, -s / 2 + 0.07, s / 2 - 0.2);
    screw(x, s / 2 - 0.07, s / 2 - 0.2);
  },

  powerCell(x, w, h, env) {
    const r = Math.min(w, h) / 2;
    const hue = env.variant % 2 ? AMBER : NEON;
    // aro
    x.fillStyle = bodyGradient(x, -r, r, '#3c4452', '#22272f');
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(170,190,210,0.3)';
    x.lineWidth = 0.025;
    x.stroke();
    // núcleo luminoso
    x.save();
    x.shadowColor = hue;
    x.shadowBlur = r * 0.5;
    const g = x.createRadialGradient(0, 0, 0, 0, 0, r * 0.62);
    g.addColorStop(0, hue);
    g.addColorStop(0.55, hue + '99');
    g.addColorStop(1, 'rgba(10,12,16,0.9)');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r * 0.62, 0, Math.PI * 2); x.fill();
    x.restore();
    // parafusos
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 4) + (i * Math.PI) / 2;
      screw(x, Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, 0.028);
    }
  },

  generator(x, w, h, _env) {
    x.fillStyle = bodyGradient(x, -h / 2, h / 2, '#434c5b', '#272d37');
    roundRect(x, -w / 2, -h / 2, w, h, 0.12);
    x.fill();
    x.strokeStyle = 'rgba(170,190,210,0.28)';
    x.lineWidth = 0.025;
    x.stroke();
    // grelha superior
    x.fillStyle = 'rgba(8,10,14,0.55)';
    roundRect(x, -w / 2 + 0.15, -h / 2 + 0.14, w * 0.42, h - 0.28, 0.04);
    x.fill();
    x.strokeStyle = 'rgba(120,140,160,0.3)';
    x.lineWidth = 0.018;
    for (let i = 0; i < 6; i++) {
      const yy = -h / 2 + 0.2 + (i * (h - 0.4)) / 5;
      x.beginPath(); x.moveTo(-w / 2 + 0.2, yy); x.lineTo(-w / 2 + 0.15 + w * 0.42 - 0.05, yy); x.stroke();
    }
    // cilindros
    for (let i = 0; i < 2; i++) {
      const cx = w * 0.22 + i * w * 0.18;
      x.fillStyle = bodyGradient(x, -h / 2, h / 2, '#566276', '#39404d');
      x.beginPath(); x.arc(cx, 0, h * 0.26, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.4)';
      x.lineWidth = 0.02;
      x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.12)';
      x.beginPath(); x.arc(cx - h * 0.07, -h * 0.07, h * 0.11, 0, Math.PI * 2); x.fill();
    }
    // etiqueta de perigo
    x.fillStyle = '#c9a227';
    x.beginPath();
    x.moveTo(-w * 0.05, -h * 0.32);
    x.lineTo(-w * 0.12, -h * 0.12);
    x.lineTo(w * 0.02, -h * 0.12);
    x.closePath();
    x.fill();
    x.fillStyle = '#15161a';
    x.font = `bold ${h * 0.22}px monospace`;
    x.textAlign = 'center';
    x.fillText('!', -w * 0.05, -h * 0.14);
  },

  holotable(x, w, h, _env) {
    const r = Math.min(w, h) / 2;
    // base
    x.fillStyle = bodyGradient(x, -r, r, '#485264', '#2b313c');
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(180,200,220,0.3)';
    x.lineWidth = 0.03;
    x.stroke();
    // anéis gravados
    x.strokeStyle = 'rgba(0,0,0,0.35)';
    x.lineWidth = 0.018;
    x.beginPath(); x.arc(0, 0, r * 0.78, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.55, 0, Math.PI * 2); x.stroke();
    // vidro
    x.fillStyle = 'rgba(20,32,38,0.85)';
    x.beginPath(); x.arc(0, 0, r * 0.45, 0, Math.PI * 2); x.fill();
    // holograma (aditivo)
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = NEON;
    x.fillStyle = NEON;
    x.shadowColor = NEON;
    x.shadowBlur = r * 0.35;
    x.globalAlpha = 0.85;
    // nave flutuante em wireframe
    x.lineWidth = 0.025;
    x.beginPath();
    x.moveTo(0, -r * 0.28);
    x.lineTo(r * 0.22, r * 0.18);
    x.lineTo(0, r * 0.08);
    x.lineTo(-r * 0.22, r * 0.18);
    x.closePath();
    x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.34, 0.4, Math.PI * 1.2); x.stroke();
    x.globalAlpha = 0.4;
    x.beginPath(); x.arc(0, 0, r * 0.62, 0, Math.PI * 2); x.stroke();
    x.restore();
  },

  cryopod(x, w, h, env) {
    const hue = env.variant % 3 === 2 ? AMBER : NEON;
    // estrutura
    x.fillStyle = bodyGradient(x, -h / 2, h / 2, '#3f4856', '#252b35');
    roundRect(x, -w / 2, -h / 2, w, h, w * 0.42);
    x.fill();
    x.strokeStyle = 'rgba(170,190,210,0.28)';
    x.lineWidth = 0.022;
    x.stroke();
    // janela de criovidro
    const gw = w * 0.56, gh = h * 0.62;
    x.save();
    x.shadowColor = hue;
    x.shadowBlur = 0.16;
    const g = x.createLinearGradient(0, -gh / 2, 0, gh / 2);
    g.addColorStop(0, hue + 'cc');
    g.addColorStop(0.5, hue + '55');
    g.addColorStop(1, 'rgba(12,20,24,0.95)');
    x.fillStyle = g;
    roundRect(x, -gw / 2, -gh / 2, gw, gh, gw * 0.4);
    x.fill();
    x.restore();
    // silhueta adormecida (sutil)
    x.fillStyle = 'rgba(10,16,20,0.5)';
    x.beginPath();
    x.ellipse(0, -gh * 0.08, gw * 0.2, gh * 0.3, 0, 0, Math.PI * 2);
    x.fill();
    x.beginPath(); x.arc(0, -gh * 0.36, gw * 0.14, 0, Math.PI * 2); x.fill();
    // luz de status
    x.fillStyle = env.variant % 4 === 3 ? RED : GREEN;
    x.beginPath(); x.arc(0, h / 2 - 0.12, 0.035, 0, Math.PI * 2); x.fill();
    // trilhos
    x.strokeStyle = 'rgba(0,0,0,0.4)';
    x.lineWidth = 0.02;
    x.beginPath(); x.moveTo(-w / 2 + 0.08, -h / 2 + 0.15); x.lineTo(-w / 2 + 0.08, h / 2 - 0.15); x.stroke();
    x.beginPath(); x.moveTo(w / 2 - 0.08, -h / 2 + 0.15); x.lineTo(w / 2 - 0.08, h / 2 - 0.15); x.stroke();
  },

  bench(x, w, h, env) {
    x.fillStyle = bodyGradient(x, -h / 2, h / 2, '#4a5260', '#2c323d');
    roundRect(x, -w / 2, -h / 2, w, h, 0.05);
    x.fill();
    x.strokeStyle = 'rgba(170,190,210,0.25)';
    x.lineWidth = 0.02;
    x.stroke();
    // silhuetas de ferramentas
    x.fillStyle = 'rgba(12,14,18,0.6)';
    const n = 2 + (env.variant % 3);
    for (let i = 0; i < n; i++) {
      const fx = -w / 2 + 0.2 + env.rng.next() * (w - 0.5);
      const fy = -h / 2 + 0.15 + env.rng.next() * (h - 0.4);
      if (env.rng.chance(0.5)) {
        x.fillRect(fx, fy, 0.28, 0.09);
      } else {
        x.beginPath(); x.arc(fx, fy, 0.07, 0, Math.PI * 2); x.fill();
      }
    }
    // luminária de bancada
    x.save();
    x.shadowColor = AMBER;
    x.shadowBlur = 0.1;
    x.fillStyle = AMBER;
    x.globalAlpha = 0.9;
    x.beginPath(); x.arc(w / 2 - 0.15, -h / 2 + 0.14, 0.035, 0, Math.PI * 2); x.fill();
    x.restore();
    x.globalAlpha = 1;
  },

  pipeRun(x, w, h, _env) {
    const pipes = 3;
    for (let i = 0; i < pipes; i++) {
      const yy = -h / 2 + ((i + 0.5) * h) / pipes;
      const ph = h / pipes - 0.06;
      const g = x.createLinearGradient(0, yy - ph / 2, 0, yy + ph / 2);
      const base = i === 1 ? '#5a6577' : '#485364';
      g.addColorStop(0, base);
      g.addColorStop(0.45, '#6b788c');
      g.addColorStop(1, '#2b323d');
      x.fillStyle = g;
      roundRect(x, -w / 2, yy - ph / 2, w, ph, ph / 2);
      x.fill();
      // abraçadeiras
      x.fillStyle = 'rgba(20,24,30,0.85)';
      x.fillRect(-w * 0.25, yy - ph / 2 - 0.015, 0.07, ph + 0.03);
      x.fillRect(w * 0.25, yy - ph / 2 - 0.015, 0.07, ph + 0.03);
    }
    // joelho de conexão em uma extremidade
    x.fillStyle = '#39404d';
    x.beginPath(); x.arc(-w / 2 + 0.05, 0, h * 0.42, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(150,170,190,0.25)';
    x.lineWidth = 0.02;
    x.stroke();
  },

  floorLamp(x, w, h) {
    const r = Math.min(w, h) / 2;
    // carcaça
    x.fillStyle = bodyGradient(x, -r, r, '#39404d', '#20242c');
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(150,170,190,0.25)';
    x.lineWidth = 0.02;
    x.stroke();
    // anel luminoso (plafonier vista de cima)
    x.save();
    x.shadowColor = '#cfe8ff';
    x.shadowBlur = r * 0.4;
    x.strokeStyle = '#dfeeff';
    x.lineWidth = r * 0.22;
    x.beginPath(); x.arc(0, 0, r * 0.52, 0, Math.PI * 2); x.stroke();
    x.restore();
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.beginPath(); x.arc(0, 0, r * 0.18, 0, Math.PI * 2); x.fill();
  },

  vent(x, w, h, env) {
    const s = Math.min(w, h);
    x.fillStyle = bodyGradient(x, -s / 2, s / 2, '#39404d', '#22262e');
    x.fillRect(-s / 2, -s / 2, s, s);
    x.strokeStyle = 'rgba(150,170,190,0.28)';
    x.lineWidth = 0.022;
    x.strokeRect(-s / 2, -s / 2, s, s);
    // palhetas
    x.fillStyle = 'rgba(8,10,13,0.8)';
    const n = 6;
    for (let i = 0; i < n; i++) {
      const yy = -s / 2 + ((i + 0.5) * s) / n;
      x.save();
      x.translate(0, yy);
      x.transform(1, 0, -0.35, 1, 0, 0); // palhetas inclinadas
      x.fillRect(-s * 0.4, -s * 0.05, s * 0.8, s * 0.1);
      x.restore();
    }
    screw(x, -s / 2 + 0.07, -s / 2 + 0.07);
    screw(x, s / 2 - 0.07, -s / 2 + 0.07);
    screw(x, -s / 2 + 0.07, s / 2 - 0.07);
    screw(x, s / 2 - 0.07, s / 2 - 0.07);
    void env;
  },

  stairsDown(x, w, h) {
    const s = Math.min(w, h);
    // moldura com faixa de perigo
    x.fillStyle = '#20242b';
    roundRect(x, -s / 2, -s / 2, s, s, 0.08);
    x.fill();
    hazardStripes(x, -s / 2 + 0.03, -s / 2 + 0.03, s - 0.06, 0.1);
    hazardStripes(x, -s / 2 + 0.03, s / 2 - 0.13, s - 0.06, 0.1);
    // poço escuro com degraus descendo
    const ix = -s / 2 + 0.18, iy = -s / 2 + 0.18;
    const iw = s - 0.36, ih = s - 0.36;
    x.fillStyle = '#07090d';
    x.fillRect(ix, iy, iw, ih);
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const sy = iy + t * ih;
      const sh = ih / steps;
      const g = x.createLinearGradient(0, sy, 0, sy + sh);
      g.addColorStop(0, `rgb(${34 - i * 4},${38 - i * 4},${46 - i * 4})`);
      g.addColorStop(1, `rgb(${22 - i * 3},${25 - i * 3},${31 - i * 3})`);
      x.fillStyle = g;
      x.fillRect(ix + t * 3, sy, iw - t * 6, sh - 0.02);
      x.fillStyle = 'rgba(200,220,240,0.22)';
      x.fillRect(ix + t * 3, sy, iw - t * 6, 0.025);
    }
    // setas de direção
    x.fillStyle = '#cfe8ff';
    x.globalAlpha = 0.9;
    for (let i = 0; i < 2; i++) {
      const ay = iy - 0.12 - i * 0.0;
      x.beginPath();
      x.moveTo(-0.09, ay + 0.1);
      x.lineTo(0, ay);
      x.lineTo(0.09, ay + 0.1);
      x.lineTo(0, ay + 0.055);
      x.closePath();
      x.fill();
    }
    x.globalAlpha = 1;
    // etiqueta
    x.fillStyle = 'rgba(220,235,250,0.75)';
    x.font = `bold ${s * 0.11}px monospace`;
    x.textAlign = 'center';
    x.fillText('N-2', 0, iy + ih + 0.14);
  },
};

// ---------- portas ----------

export interface DoorEnv {
  type: string;
  width: number; // metros
  t: number; // espessura da parede
}

/** desenha a porta centrada em (0,0), alinhada ao eixo x (painéis deslizam em x) */
export function paintDoor(x: Ctx, env: DoorEnv): void {
  const w = env.width;
  const t = env.t;
  const framePad = 0.22;
  const fw = w + framePad * 2;
  const fh = t * 2 + 0.3; // cobre todo o vão recortado na parede

  // sombra de embutir
  x.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(x, -fw / 2 + 0.03, -fh / 2 + 0.05, fw, fh, 0.08);
  x.fill();

  // moldura
  const fg = x.createLinearGradient(0, -fh / 2, 0, fh / 2);
  fg.addColorStop(0, '#4c5666');
  fg.addColorStop(0.5, '#39404d');
  fg.addColorStop(1, '#23272f');
  x.fillStyle = fg;
  roundRect(x, -fw / 2, -fh / 2, fw, fh, 0.08);
  x.fill();
  x.strokeStyle = 'rgba(180,200,220,0.3)';
  x.lineWidth = 0.02;
  x.stroke();

  // abertura (escuridão do vão com brilho interno)
  const gapW = w * 0.16;
  x.fillStyle = '#05070b';
  x.fillRect(-w / 2, -t / 2 - 0.06, w, t + 0.12);
  x.save();
  x.shadowColor = NEON;
  x.shadowBlur = 0.14;
  x.fillStyle = 'rgba(46,224,200,0.35)';
  x.fillRect(-gapW / 2, -t / 2 - 0.06, gapW, t + 0.12);
  x.restore();

  // painéis deslizantes (semiabertos)
  const panelW = (w - gapW) / 2;
  for (const dir of [-1, 1]) {
    const px = dir === -1 ? -w / 2 : gapW / 2;
    const pg = x.createLinearGradient(0, -t / 2, 0, t / 2);
    pg.addColorStop(0, '#5b6678');
    pg.addColorStop(0.5, '#424a58');
    pg.addColorStop(1, '#2a2f39');
    x.fillStyle = pg;
    roundRect(x, px, -t / 2 - 0.04, panelW, t + 0.08, 0.03);
    x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.45)';
    x.lineWidth = 0.018;
    x.stroke();
    // sulcos do painel
    x.strokeStyle = 'rgba(0,0,0,0.3)';
    for (let i = 1; i <= 2; i++) {
      const yy = -t / 2 + (i * (t + 0.08)) / 3;
      x.beginPath(); x.moveTo(px + 0.05, yy); x.lineTo(px + panelW - 0.05, yy); x.stroke();
    }
  }

  if (env.type === 'airlock') {
    // anéis de portinhola nos painéis
    for (const dir of [-1, 1]) {
      const cx = dir * (gapW / 2 + panelW / 2);
      x.strokeStyle = 'rgba(46,224,200,0.65)';
      x.lineWidth = 0.035;
      x.beginPath(); x.arc(cx, 0, Math.min(t * 0.42, 0.16), 0, Math.PI * 2); x.stroke();
      x.fillStyle = 'rgba(10,16,20,0.9)';
      x.beginPath(); x.arc(cx, 0, Math.min(t * 0.3, 0.11), 0, Math.PI * 2); x.fill();
    }
  } else if (env.type === 'blast') {
    // chevrons amarelos
    x.fillStyle = '#c9a227';
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
  }

  // postes com luz de status
  for (const dir of [-1, 1]) {
    const lx = dir * (fw / 2 - 0.06);
    x.fillStyle = '#1a1e25';
    x.fillRect(lx - 0.035, -fh / 2 - 0.05, 0.07, fh + 0.1);
    x.save();
    x.shadowColor = GREEN;
    x.shadowBlur = 0.09;
    x.fillStyle = GREEN;
    x.beginPath(); x.arc(lx, -fh / 2 - 0.02, 0.028, 0, Math.PI * 2); x.fill();
    x.restore();
  }

  // placa de soleira com faixa de perigo
  hazardStripes(x, -w / 2 - 0.1, fh / 2 + 0.02, w + 0.2, 0.09);
}

/** cap de extremidade de corredor: bulkhead blindado ou anel de acoplagem */
export function paintCorridorCap(x: Ctx, kind: 'dock' | 'bulkhead', width: number): void {
  const r = width / 2 + 0.35;
  if (kind === 'dock') {
    x.save();
    x.shadowColor = NEON;
    x.shadowBlur = 0.2;
    x.strokeStyle = 'rgba(46,224,200,0.9)';
    x.lineWidth = 0.07;
    x.beginPath(); x.arc(0, 0, r * 0.72, 0, Math.PI * 2); x.stroke();
    x.restore();
    x.strokeStyle = '#39404d';
    x.lineWidth = 0.16;
    x.beginPath(); x.arc(0, 0, r * 0.9, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#0a0d12';
    x.beginPath(); x.arc(0, 0, r * 0.55, 0, Math.PI * 2); x.fill();
  } else {
    // bulkhead: porta pesada fechada
    x.fillStyle = bodyGradient(x, -r, r, '#454e5d', '#262b34');
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(180,200,220,0.3)';
    x.lineWidth = 0.03;
    x.stroke();
    x.strokeStyle = 'rgba(0,0,0,0.45)';
    x.lineWidth = 0.025;
    x.beginPath(); x.arc(0, 0, r * 0.66, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.4, 0, Math.PI * 2); x.stroke();
    hazardStripes(x, -r * 0.95, -0.09, r * 1.9, 0.18);
    x.save();
    x.shadowColor = RED;
    x.shadowBlur = 0.1;
    x.fillStyle = RED;
    x.beginPath(); x.arc(0, 0, 0.07, 0, Math.PI * 2); x.fill();
    x.restore();
  }
}
