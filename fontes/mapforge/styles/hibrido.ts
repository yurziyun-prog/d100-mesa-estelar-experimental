/**
 * Estilo HÍBRIDO — o planeta dos jogadores: construções de pedra antiga
 * convivendo com tecnologia de era atômica (conduítes neon, cápsulas,
 * consoles entre colunas de arenito). Composição dos vocabulários
 * hiboriano + retrofuturista com acabamento próprio.
 */

import type { RoomKind } from '../types';
import type { Ctx } from '../render/textures';
import type { DoorEnv } from '../render/sprites';
import type { MapStyle, WallTrimSeg } from './style';
import { RNG } from '../rng';
import { hiboriano } from './hiboriano';
import { retrofuturista } from './retrofuturista';

const TEAL = '#2ec4b6';
const PINK = '#ff5d8f';
const GOLD = '#d8b356';

/** fundo: noite do deserto com letreiros neon ao longe */
function paintHybridBackground(x: Ctx, w: number, h: number, seed: number): void {
  hiboriano.paintBackground(x, w, h, seed);
  const rng = new RNG(seed ^ 0x3c9e15);
  for (let i = 0; i < 14; i++) {
    const bx = rng.range(0, w), by = rng.range(0, h);
    const br = rng.range(w * 0.01, w * 0.04);
    const col = rng.pick(['46,196,182', '255,93,143', '255,159,28']);
    const bg = x.createRadialGradient(bx, by, 0, bx, by, br);
    bg.addColorStop(0, `rgba(${col},${rng.range(0.05, 0.12)})`);
    bg.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = bg;
    x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
  }
}

/** trim: pedra com conduíte neon embutido + rebites de bronze */
function paintHybridTrim(x: Ctx, seg: WallTrimSeg, wear: number, rng: RNG): void {
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

  // conduíte neon embutido na pedra
  const segs = Math.floor((a1 - a0) / 1.0);
  for (let si = 0; si < segs; si++) {
    if (wear >= 1 && rng.chance(wear * 0.15)) continue;
    const u0 = a0 + 0.28 + si * 1.0;
    const u1 = Math.min(u0 + 0.5, a1 - 0.28);
    if (u1 - u0 < 0.15) continue;
    const col = si % 2 === 0 ? '46,196,182' : '255,93,143';
    x.save();
    x.shadowColor = `rgba(${col},1)`;
    x.shadowBlur = 0.09;
    x.strokeStyle = `rgba(${col},0.6)`;
    x.lineWidth = 0.045;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(o.x + d.x * u0 + inW.x * 0.13, o.y + d.y * u0 + inW.y * 0.13);
    x.lineTo(o.x + d.x * u1 + inW.x * 0.13, o.y + d.y * u1 + inW.y * 0.13);
    x.stroke();
    x.restore();
  }

  // relevos de bronze com núcleo luminoso
  const reliefs = Math.floor((a1 - a0) / 2.4);
  for (let si = 1; si <= reliefs; si++) {
    const u = a0 + (si * (a1 - a0)) / (reliefs + 1);
    const px = o.x + d.x * u + inW.x * (t * 0.5);
    const py = o.y + d.y * u + inW.y * (t * 0.5);
    x.fillStyle = 'rgba(176,125,58,0.6)';
    x.beginPath(); x.arc(px, py, 0.085, 0, Math.PI * 2); x.fill();
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.08;
    x.fillStyle = 'rgba(46,196,182,0.9)';
    x.beginPath(); x.arc(px, py, 0.03, 0, Math.PI * 2); x.fill();
    x.restore();
  }
}

/** porta híbrida: batente de pedra, folha turquesa, vigia dourada, fenda neon */
function paintHybridDoor(x: Ctx, env: DoorEnv): void {
  const w = env.width;
  const t = env.t;
  const fw = w + 0.44;
  const fh = t * 2 + 0.3;

  x.fillStyle = 'rgba(12,6,4,0.5)';
  x.fillRect(-fw / 2 + 0.03, -fh / 2 + 0.05, fw, fh);

  // moldura de pedra
  const fg = x.createLinearGradient(0, -fh / 2, 0, fh / 2);
  fg.addColorStop(0, '#c9ae7e');
  fg.addColorStop(0.5, '#b39668');
  fg.addColorStop(1, '#7c6238');
  x.fillStyle = fg;
  x.fillRect(-fw / 2, -fh / 2, fw, fh);
  x.strokeStyle = 'rgba(40,26,16,0.5)';
  x.lineWidth = 0.02;
  x.strokeRect(-fw / 2, -fh / 2, fw, fh);

  // fenda neon vertical no centro da moldura
  x.save();
  x.shadowColor = PINK;
  x.shadowBlur = 0.12;
  x.strokeStyle = 'rgba(255,93,143,0.7)';
  x.lineWidth = 0.04;
  x.beginPath(); x.moveTo(0, -fh / 2 + 0.06); x.lineTo(0, fh / 2 - 0.06); x.stroke();
  x.restore();

  // vão
  const gapW = w * 0.16;
  x.fillStyle = '#100806';
  x.fillRect(-w / 2, -t / 2 - 0.06, w, t + 0.12);
  x.save();
  x.shadowColor = TEAL;
  x.shadowBlur = 0.13;
  x.fillStyle = 'rgba(46,196,182,0.4)';
  x.fillRect(-gapW / 2, -t / 2 - 0.06, gapW, t + 0.12);
  x.restore();

  // folhas turquesa com faixa de bronze
  const panelW = (w - gapW) / 2;
  for (const dir of [-1, 1]) {
    const px = dir === -1 ? -w / 2 : gapW / 2;
    const pg = x.createLinearGradient(0, -t / 2, 0, t / 2);
    pg.addColorStop(0, '#3fd6c7');
    pg.addColorStop(0.5, TEAL);
    pg.addColorStop(1, '#157a70');
    x.fillStyle = pg;
    x.fillRect(px, -t / 2 - 0.04, panelW, t + 0.08);
    x.strokeStyle = 'rgba(40,26,16,0.5)';
    x.lineWidth = 0.018;
    x.strokeRect(px, -t / 2 - 0.04, panelW, t + 0.08);
    x.fillStyle = 'rgba(216,179,86,0.85)';
    x.fillRect(px + 0.04, -0.025, panelW - 0.08, 0.05);
  }

  if (env.type === 'round') {
    // vigia dourada com runa
    const cr = Math.min(t * 0.5, fh * 0.3);
    x.fillStyle = GOLD;
    x.beginPath(); x.arc(0, 0, cr, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2a1c10';
    x.beginPath(); x.arc(0, 0, cr * 0.66, 0, Math.PI * 2); x.fill();
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.1;
    x.strokeStyle = 'rgba(46,196,182,0.9)';
    x.lineWidth = 0.035;
    x.beginPath();
    x.moveTo(0, -cr * 0.42); x.lineTo(cr * 0.36, cr * 0.24); x.lineTo(-cr * 0.36, cr * 0.24);
    x.closePath(); x.stroke();
    x.restore();
  } else if (env.type === 'sealed') {
    x.save();
    x.shadowColor = '#ff7a30';
    x.shadowBlur = 0.14;
    x.strokeStyle = 'rgba(255,150,60,0.85)';
    x.lineWidth = 0.045;
    x.beginPath();
    x.moveTo(0, -t * 0.42); x.lineTo(w * 0.14, 0);
    x.lineTo(0, t * 0.42); x.lineTo(-w * 0.14, 0);
    x.closePath(); x.stroke();
    x.restore();
  }

  // colunas com núcleo luminoso
  for (const dir of [-1, 1]) {
    const lx = dir * (fw / 2 - 0.07);
    x.fillStyle = '#a8926a';
    x.fillRect(lx - 0.06, -fh / 2 - 0.04, 0.12, fh + 0.08);
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.1;
    x.fillStyle = 'rgba(46,196,182,0.95)';
    x.beginPath(); x.arc(lx, -fh / 2 - 0.02, 0.028, 0, Math.PI * 2); x.fill();
    x.restore();
  }
}

/** cap: arco de pedra com anel neon / cofre de pedra com runa */
function paintHybridCap(x: Ctx, kind: 'dock' | 'bulkhead', width: number): void {
  const r = width / 2 + 0.35;
  if (kind === 'dock') {
    x.strokeStyle = '#c9ae7e';
    x.lineWidth = 0.18;
    x.beginPath(); x.arc(0, 0, r * 0.85, 0, Math.PI * 2); x.stroke();
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.18;
    x.strokeStyle = 'rgba(46,196,182,0.85)';
    x.lineWidth = 0.06;
    x.beginPath(); x.arc(0, 0, r * 0.68, 0, Math.PI * 2); x.stroke();
    x.restore();
    x.fillStyle = '#100806';
    x.beginPath(); x.arc(0, 0, r * 0.5, 0, Math.PI * 2); x.fill();
  } else {
    const g = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#b89c6c');
    g.addColorStop(1, '#6e5636');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(40,26,16,0.6)';
    x.lineWidth = 0.035;
    x.beginPath(); x.arc(0, 0, r * 0.66, 0, Math.PI * 2); x.stroke();
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.14;
    x.strokeStyle = 'rgba(46,196,182,0.9)';
    x.lineWidth = 0.05;
    x.beginPath();
    x.moveTo(0, -r * 0.3); x.lineTo(r * 0.22, 0);
    x.lineTo(0, r * 0.3); x.lineTo(-r * 0.22, 0);
    x.closePath(); x.stroke();
    x.restore();
  }
}

export const hibrido: MapStyle = {
  id: 'hibrido',
  label: 'Híbrido (pedra & neon)',

  // pisos e casco do vocabulário hiboriano
  floors: {
    ...hiboriano.floors,
    // corredores ganham a passadeira atômica — a "cidade" do planeta mistura
    runner: retrofuturista.floors.runner,
  },
  defaultFloor: 'sandstone',
  wall: hiboriano.wall,
  hull: hiboriano.hull,

  paintBackground: paintHybridBackground,
  atmosphere: (create, w, h) => {
    const c = create(w, h);
    const x = c.getContext('2d') as Ctx;
    const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(26,13,16,0)');
    g.addColorStop(1, 'rgba(20,10,14,0.55)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    return c;
  },
  darknessColor: '26,14,20',

  floorTint: (room, rng) =>
    room.kind === 'hall' || room.kind === 'entry'
      ? `rgba(46,196,182,${rng.range(0.04, 0.07)})`
      : `rgba(216,179,86,${rng.range(0.04, 0.07)})`,
  labelStyle: {
    font: (px) => `bold ${px}px "Trebuchet MS", Georgia, serif`,
    color: 'rgba(232,214,170,0.5)',
    codeColor: 'rgba(46,196,182,0.42)',
    code: (room) => `SETOR ${room.id.toUpperCase()}`,
  },

  paintWallTrim: paintHybridTrim,
  paintExtraWall: (x, a, b, t) => {
    x.strokeStyle = 'rgba(20,10,6,0.9)';
    x.lineWidth = t * 2.4;
    x.lineCap = 'butt';
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.strokeStyle = 'rgba(203,178,135,0.6)';
    x.lineWidth = t * 0.7;
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.save();
    x.shadowColor = TEAL;
    x.shadowBlur = 0.08;
    x.strokeStyle = 'rgba(46,196,182,0.45)';
    x.lineWidth = t * 0.22;
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.restore();
  },

  paintDoor: paintHybridDoor,
  paintCorridorCap: paintHybridCap,
  doorLight: { r: 1.9, strength: 0.45 },
  doorGlow: { r: 0.55, alpha: 0.22, color: '46,196,182' },

  // pintores dos DOIS mundos: ídolos e consoles na mesma sala
  propPainters: {
    ...hiboriano.propPainters,
    ...retrofuturista.propPainters,
  },
  propLight: {
    brazier: { r: 5.8, strength: 0.88 },
    torch: { r: 4.2, strength: 0.65 },
    floorLamp: { r: 5.2, strength: 0.85 },
    console: { r: 1.8, strength: 0.4 },
    powerCell: { r: 1.9, strength: 0.45 },
    holotable: { r: 3.4, strength: 0.5 },
    cryopod: { r: 2.0, strength: 0.32 },
  },
  propGlow: {
    brazier: { r: 1.5, alpha: 0.45, color: '255,150,60' },
    torch: { r: 1.0, alpha: 0.35, color: '255,150,60' },
    floorLamp: { r: 1.4, alpha: 0.38, color: '255,233,184' },
    console: { r: 0.7, alpha: 0.3, color: '46,196,182' },
    powerCell: { r: 0.8, alpha: 0.38, color: '46,196,182' },
    holotable: { r: 1.5, alpha: 0.35, color: '255,93,143' },
  },

  catalog: {
    entry: [
      { type: 'idol', w: 1.4, h: 2.6 }, { type: 'console', w: 1.9, h: 0.9 },
      { type: 'torch', w: 0.6, h: 0.6 }, { type: 'floorLamp', w: 1.3, h: 1.3 },
      { type: 'urn', w: 0.9, h: 0.9 },
    ],
    hall: [
      { type: 'idol', w: 1.4, h: 2.6 }, { type: 'holotable', w: 2.4, h: 2.4 },
      { type: 'altar', w: 2.0, h: 1.1 }, { type: 'serverRack', w: 1.0, h: 2.0 },
      { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    lab: [
      { type: 'altar', w: 2.0, h: 1.1 }, { type: 'console', w: 1.9, h: 0.9 },
      { type: 'cryopod', w: 1.0, h: 2.3 }, { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    utility: [
      { type: 'powerCell', w: 1.1, h: 1.1 }, { type: 'powerCell', w: 1.1, h: 1.1 },
      { type: 'urn', w: 0.9, h: 0.9 }, { type: 'pipeRun', w: 2.6, h: 0.6 },
      { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    storage: [
      { type: 'chest', w: 1.1, h: 0.8 }, { type: 'crate', w: 1.2, h: 1.2 },
      { type: 'urn', w: 0.9, h: 0.9 }, { type: 'floorLamp', w: 1.3, h: 1.3 },
    ],
    quarters: [
      { type: 'cryopod', w: 1.0, h: 2.3 }, { type: 'chest', w: 1.1, h: 0.8 },
      { type: 'bench', w: 2.0, h: 0.9 }, { type: 'brazier', w: 1.3, h: 1.3 },
    ],
    exit: [
      { type: 'stairsDown', w: 2.6, h: 2.6 },
      { type: 'chest', w: 1.1, h: 0.8 }, { type: 'floorLamp', w: 1.3, h: 1.3 },
    ],
    corridor: [],
  },
  centerProps: ['idol', 'altar', 'holotable', 'brazier', 'stairsDown'],
  lightProp: 'brazier',
  corridorDecor: { type: 'pipeRun', w: 2.4, h: 0.6 },
  labels: {
    entry: ['PORTÃO DO SETOR'],
    exit: ['CÂMARA SELADA'],
    hall: ['GRANDE SALÃO', 'FORO', 'MERCADO COBERTO'],
    lab: ['SANTUÁRIO TÉCNICO', 'ORÁCULO MECÂNICO', 'CÂMARA RITUAL'],
    utility: ['GERADOR ANTIGO', 'SUBESTAÇÃO', 'FOURNOS'],
    storage: ['ARSENAL', 'DEPÓSITO', 'TESOURO'],
    quarters: ['APOSENTOS', 'MORADIA'],
    corridor: [],
  },
  floorStyleFor: (kind: RoomKind) =>
    kind === 'hall' ? 'throne'
      : kind === 'corridor' ? 'runner'
        : kind === 'utility' || kind === 'storage' ? 'sand'
          : 'sandstone',
  doorTypes: ['wooden', 'round', 'gate'],
  stubTypes: { entry: 'gate', exit: 'sealed' },
};
