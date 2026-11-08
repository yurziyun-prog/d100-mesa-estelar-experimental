/**
 * Estilo FUTURISTA — estação espacial / nave abandonada.
 * Paleta industrial fria (aço, grafite, neon teal). Encapsula as texturas,
 * sprites e o vocabulário de geração originais (o renderer e o generator
 * são agnósticos de estilo).
 */

import { RNG, hashSeed } from '../rng';
import type { RoomKind } from '../types';
import {
  atmosphereOverlay, floorCorridorDeck, floorDarkGrate,
  floorHallPlate, floorMetalDeck, hullDeck, wallSteel,
} from '../render/textures';
import { PROP_PAINTERS, paintCorridorCap, paintDoor } from '../render/sprites';
import type { Ctx } from '../render/textures';
import type { MapStyle, WallTrimSeg } from './style';

function paintSpaceBackground(x: Ctx, w: number, h: number, seed: number): void {
  const bg = x.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#04060c');
  bg.addColorStop(0.5, '#070a14');
  bg.addColorStop(1, '#04050a');
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  // nebulosas tênues
  const rng = new RNG(seed ^ 0x1b873593);
  for (let i = 0; i < 3; i++) {
    const nx = rng.range(0, w);
    const ny = rng.range(0, h);
    const nr = rng.range(w * 0.2, w * 0.45);
    const hue = rng.pick(['120,80,180', '40,120,160', '160,60,90']);
    const g = x.createRadialGradient(nx, ny, 0, nx, ny, nr);
    g.addColorStop(0, `rgba(${hue},0.08)`);
    g.addColorStop(1, `rgba(${hue},0)`);
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  }
  // estrelas
  const starRng = new RNG(hashSeed(`stars-${seed}`));
  for (let i = 0; i < 420; i++) {
    const sx = starRng.range(0, w);
    const sy = starRng.range(0, h);
    const r = starRng.range(0.3, 1.4);
    x.fillStyle = `rgba(220,230,255,${starRng.range(0.15, 0.8)})`;
    x.beginPath(); x.arc(sx, sy, r, 0, Math.PI * 2); x.fill();
  }
}

/** detalhe de parede retrofuturista: chanfro de luz, cintas neon, emendas e rebites */
function paintSteelTrim(x: Ctx, seg: WallTrimSeg, wear: number, lightRng: RNG): void {
  const { o, d, a0, a1, inW, t } = seg;
  const p0 = { x: o.x + d.x * a0, y: o.y + d.y * a0 };
  const p1 = { x: o.x + d.x * a1, y: o.y + d.y * a1 };
  // chanfro de luz na borda do piso (linha clara na parede, escura no piso)
  x.strokeStyle = 'rgba(205,230,250,0.34)';
  x.lineWidth = 0.04;
  x.beginPath(); x.moveTo(p0.x, p0.y); x.lineTo(p1.x, p1.y); x.stroke();
  x.strokeStyle = 'rgba(6,8,12,0.55)';
  x.lineWidth = 0.05;
  x.beginPath();
  x.moveTo(p0.x - inW.x * 0.06, p0.y - inW.y * 0.06);
  x.lineTo(p1.x - inW.x * 0.06, p1.y - inW.y * 0.06);
  x.stroke();
  // cinta luminosa (pisca quebrada conforme desgaste)
  const stripOff = 0.1;
  const segs = Math.floor((a1 - a0) / 0.9);
  for (let si = 0; si < segs; si++) {
    if (wear >= 1 && lightRng.chance(wear * 0.16)) continue;
    const u0 = a0 + 0.25 + si * 0.9;
    const u1 = Math.min(u0 + 0.55, a1 - 0.25);
    if (u1 - u0 < 0.15) continue;
    x.strokeStyle = 'rgba(46,224,200,0.30)';
    x.lineWidth = 0.045;
    x.beginPath();
    x.moveTo(o.x + d.x * u0 + inW.x * stripOff, o.y + d.y * u0 + inW.y * stripOff);
    x.lineTo(o.x + d.x * u1 + inW.x * stripOff, o.y + d.y * u1 + inW.y * stripOff);
    x.stroke();
  }
  // emendas verticais a cada ~2.2m + rebites
  const seams = Math.floor((a1 - a0) / 2.2);
  for (let si = 1; si <= seams; si++) {
    const u = a0 + (si * (a1 - a0)) / (seams + 1);
    const px = o.x + d.x * u, py = o.y + d.y * u;
    x.strokeStyle = 'rgba(0,0,0,0.35)';
    x.lineWidth = 0.03;
    x.beginPath();
    x.moveTo(px + inW.x * 0.03, py + inW.y * 0.03);
    x.lineTo(px + inW.x * (t - 0.03), py + inW.y * (t - 0.03));
    x.stroke();
    x.fillStyle = 'rgba(150,170,190,0.35)';
    x.beginPath();
    x.arc(px + inW.x * (t * 0.5), py + inW.y * (t * 0.5), 0.022, 0, Math.PI * 2);
    x.fill();
  }
}

export const futurista: MapStyle = {
  id: 'futurista',
  label: 'Futurista',

  floors: {
    metalDeck: floorMetalDeck,
    hallPlate: floorHallPlate,
    darkGrate: floorDarkGrate,
    corridorDeck: floorCorridorDeck,
  },
  defaultFloor: 'metalDeck',
  wall: wallSteel,
  hull: hullDeck,

  paintBackground: paintSpaceBackground,
  atmosphere: atmosphereOverlay,
  darknessColor: '4,7,14',

  floorTint: (_room, rng) =>
    `hsla(${Math.round(rng.range(185, 255))}, 30%, ${Math.round(rng.range(58, 72))}%, 0.055)`,
  labelStyle: {
    font: (px) => `bold ${px}px monospace`,
    color: 'rgba(190,210,230,0.40)',
    codeColor: 'rgba(155,180,205,0.32)',
    code: (room) => `SEÇÃO ${room.id.toUpperCase()}`,
  },

  paintWallTrim: paintSteelTrim,
  paintExtraWall: (x, a, b, t) => {
    x.strokeStyle = 'rgba(12,15,20,0.9)';
    x.lineWidth = t * 2.4;
    x.lineCap = 'butt';
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.strokeStyle = 'rgba(96,108,126,0.55)';
    x.lineWidth = t * 0.7;
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
  },

  paintDoor,
  paintCorridorCap,
  doorLight: { r: 1.8, strength: 0.4 },
  doorGlow: { r: 0.5, alpha: 0.2, color: '46,224,200' },

  propPainters: PROP_PAINTERS,
  propLight: {
    floorLamp: { r: 5.0, strength: 0.85 },
    holotable: { r: 3.4, strength: 0.5 },
    console: { r: 1.7, strength: 0.35 },
    cryopod: { r: 1.9, strength: 0.3 },
    powerCell: { r: 1.7, strength: 0.4 },
  },
  propGlow: {
    floorLamp: { r: 1.5, alpha: 0.4, color: '200,225,255' },
    holotable: { r: 1.6, alpha: 0.35, color: '46,224,200' },
    console: { r: 0.7, alpha: 0.3, color: '125,255,168' },
    powerCell: { r: 0.8, alpha: 0.35, color: '46,224,200' },
    cryopod: { r: 0.7, alpha: 0.25, color: '46,224,200' },
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
    entry: ['ACESSO PRINCIPAL'],
    exit: ['SEÇÃO RESTRITA'],
    hall: ['SALÃO CENTRAL', 'ÁTRIO', 'GALERIA NORTE', 'ÁREA COMUM'],
    lab: ['LABORATÓRIO K7', 'PESQUISA', 'ANALÍTICA', 'LAB. QUÍMICA'],
    utility: ['ENERGIA', 'REATOR AUX.', 'SUBESTAÇÃO', 'MANUTENÇÃO'],
    storage: ['DEPÓSITO C-3', 'ARMAZÉM', 'CARGA', 'ESTOQUE'],
    quarters: ['ALOJAMENTO', 'REPÚBLICA', 'QUARTOS'],
    corridor: [],
  },
  floorStyleFor: (kind: RoomKind) =>
    kind === 'hall' ? 'hallPlate'
      : kind === 'utility' ? 'darkGrate'
        : kind === 'corridor' ? 'corridorDeck'
          : 'metalDeck',
  doorTypes: ['sliding', 'sliding', 'airlock'],
  stubTypes: { entry: 'airlock', exit: 'blast' },
};
