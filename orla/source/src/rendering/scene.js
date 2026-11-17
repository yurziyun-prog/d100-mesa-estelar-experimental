import {drawUpperWalls} from './upper-walls.js';
// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
import { rotationDelta } from '../physics/footprint.js';
export function drawStoredItemMarker(x, z, y, type, scaleMul = 1) {
  if (type === 'rug') {
    const rollW = .20 * scaleMul,
      rollD = .12 * scaleMul,
      rollH = .11 * scaleMul;
    runtime.box3(x, z, rollW, rollD, rollH, ['#6b2942', '#8b4564', '#b46a53'], y);
    const pt = runtime.P(x + rollW * .82, z + rollD * .5, y + rollH * .55);
    runtime.ctx.strokeStyle = '#d8b574';
    runtime.ctx.lineWidth = Math.max(1, .8 * runtime.zoom);
    runtime.ctx.beginPath();
    runtime.ctx.arc(pt[0], pt[1], Math.max(2, 3.3 * runtime.zoom * scaleMul), 0, Math.PI * 2);
    runtime.ctx.stroke();
    return;
  }
  if (type === 'houseKey' || type === 'chestKey') {
    const pt = runtime.P(x + .10 * scaleMul, z + .05 * scaleMul, y + .03 * scaleMul);
    runtime.ctx.strokeStyle = '#e3c476';
    runtime.ctx.lineWidth = Math.max(1.2, 1.6 * runtime.zoom);
    runtime.ctx.beginPath();
    runtime.ctx.arc(pt[0] - 3.5 * scaleMul * runtime.zoom, pt[1], 2.7 * scaleMul * runtime.zoom, 0, Math.PI * 2);
    runtime.ctx.stroke();
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(pt[0] - 1 * scaleMul * runtime.zoom, pt[1]);
    runtime.ctx.lineTo(pt[0] + 5 * scaleMul * runtime.zoom, pt[1]);
    runtime.ctx.lineTo(pt[0] + 7 * scaleMul * runtime.zoom, pt[1] - 2 * scaleMul * runtime.zoom);
    runtime.ctx.moveTo(pt[0] + 4 * scaleMul * runtime.zoom, pt[1]);
    runtime.ctx.lineTo(pt[0] + 4 * scaleMul * runtime.zoom, pt[1] + 2 * scaleMul * runtime.zoom);
    runtime.ctx.stroke();
    return;
  }
  if (type === 'apple') {
    const pt = runtime.P(x + .09 * scaleMul, z + .07 * scaleMul, y + .05 * scaleMul);
    runtime.ctx.fillStyle = '#c53a34';
    runtime.ctx.beginPath();
    runtime.ctx.arc(pt[0], pt[1], 4.8 * runtime.zoom * scaleMul, 0, 7);
    runtime.ctx.fill();
    runtime.ctx.strokeStyle = '#7f1f1a';
    runtime.ctx.stroke();
    runtime.ctx.strokeStyle = '#5b6f2a';
    runtime.ctx.lineWidth = 1.2;
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(pt[0], pt[1] - 5 * runtime.zoom * scaleMul);
    runtime.ctx.lineTo(pt[0] + 2 * runtime.zoom * scaleMul, pt[1] - 8 * runtime.zoom * scaleMul);
    runtime.ctx.stroke();
    return;
  }
  if (type === 'cup' || type === 'mug') {
    const pt = runtime.P(x + .09 * scaleMul, z + .06 * scaleMul, y + .04 * scaleMul);
    runtime.ctx.fillStyle = type === 'cup' ? '#cfe0ef' : '#d9c9b3';
    runtime.ctx.fillRect(pt[0] - 4 * runtime.zoom * scaleMul, pt[1] - 4 * runtime.zoom * scaleMul, 8 * runtime.zoom * scaleMul, 7 * runtime.zoom * scaleMul);
    runtime.ctx.strokeStyle = '#6b625a';
    runtime.ctx.strokeRect(pt[0] - 4 * runtime.zoom * scaleMul, pt[1] - 4 * runtime.zoom * scaleMul, 8 * runtime.zoom * scaleMul, 7 * runtime.zoom * scaleMul);
    runtime.ctx.beginPath();
    runtime.ctx.arc(pt[0] + 5 * runtime.zoom * scaleMul, pt[1] - 1 * runtime.zoom * scaleMul, 2.3 * runtime.zoom * scaleMul, -1.2, 1.2);
    runtime.ctx.stroke();
    return;
  }
  if (type === 'wood') {
    runtime.box3(x, z, .26 * scaleMul, .08 * scaleMul, .10 * scaleMul, ['#775136', '#90653e', '#ba8250'], y);
    const pt = runtime.P(x + .22 * scaleMul, z + .045 * scaleMul, y + .06 * scaleMul);
    runtime.ctx.fillStyle = '#dfba80';
    runtime.ctx.beginPath();
    runtime.ctx.ellipse(pt[0], pt[1], 2.8 * runtime.zoom * scaleMul, 3.5 * runtime.zoom * scaleMul, 0, 0, 7);
    runtime.ctx.fill();
    return;
  }
  if (type === 'stoneChunk' || type === 'ore') {
    runtime.drawRockShape(x + .12 * scaleMul, z + .08 * scaleMul, .25 * scaleMul, .18 * scaleMul, .13 * scaleMul);
    return;
  }
  if (['axe', 'pickaxe', 'shovel', 'backpack'].includes(type)) {
    const at = runtime.P(x + .10 * scaleMul, z + .06 * scaleMul, y + .08 * scaleMul);
    runtime.ctx.font = Math.max(12, 18 * scaleMul * runtime.zoom) + 'px system-ui';
    runtime.ctx.textAlign = 'center';
    runtime.ctx.fillText(runtime.itemIcon(type), at[0], at[1]);
    return;
  }
  const color = type === 'paper' ? '#efe8cd' : type === 'gem' ? '#51bed2' : type === 'coins' ? '#e6b652' : '#ab5748';
  runtime.quad3([x, z, y], [x + .19 * scaleMul, z, y], [x + .19 * scaleMul, z + .12 * scaleMul, y], [x, z + .12 * scaleMul, y], color, '#70533c');
}
export function drawGroundItem(o) {
  const p = runtime.P(o.x, o.z, .06);
  // Mantém objetos pequenos, especialmente chaves, visíveis também no exterior.
  if (o.type === 'houseKey' || o.type === 'chestKey') {
    runtime.drawKey(o.x, o.z, o.type === 'houseKey' ? 'house' : 'chest');
    return;
  }
  runtime.drawStoredItemMarker(o.x - .09, o.z - .065, .06, o.type, .95);
  runtime.ctx.strokeStyle = '#f0de9f88';
  runtime.ctx.lineWidth = 1;
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(p[0], p[1], 8 * runtime.zoom, 3 * runtime.zoom, 0, 0, 7);
  runtime.ctx.stroke();
}
export function size() {
  runtime.dpr = Math.min(2, window.devicePixelRatio || 1);
  runtime.W = window.innerWidth;
  runtime.H = window.innerHeight;
  runtime.canvas.width = Math.round(runtime.W * runtime.dpr);
  runtime.canvas.height = Math.round(runtime.H * runtime.dpr);
  runtime.ctx.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
  runtime.scale = runtime.clamp(Math.min(runtime.W / 29, runtime.H / 20) * 1.48, 20, 58);
}
export function rotated(x, z) {
  const c = Math.cos(runtime.cameraYaw),
    si = Math.sin(runtime.cameraYaw);
  return [x * c - z * si, x * si + z * c];
}
export function unrotate(x, z) {
  const c = Math.cos(runtime.cameraYaw),
    si = Math.sin(runtime.cameraYaw);
  return [x * c + z * si, -x * si + z * c];
}
export function screenVector(dx, dz) {
  const [x, z] = runtime.rotated(dx, dz);
  return [(x - z) * .87, (x + z) * .45];
}
// Projeção oblíqua fixa: apenas o eixo horizontal (yaw) pode girar.
export function P(x, z, y = 0) {
  const [rx, rz] = runtime.rotated(x - runtime.camX, z - runtime.camZ),
    u = (rx - rz) * runtime.scale * .87 * runtime.zoom,
    v = (rx + rz) * runtime.scale * .45 * runtime.zoom - y * runtime.scale * runtime.zoom;
  return [runtime.W * .5 + u, runtime.H * .56 + v];
}
export function poly(pts, fill, stroke = null, line = 1) {
  runtime.ctx.beginPath();
  pts.forEach((p, i) => i ? runtime.ctx.lineTo(p[0], p[1]) : runtime.ctx.moveTo(p[0], p[1]));
  runtime.ctx.closePath();
  runtime.ctx.fillStyle = fill;
  runtime.ctx.fill();
  if (stroke) {
    runtime.ctx.lineWidth = line;
    runtime.ctx.strokeStyle = stroke;
    runtime.ctx.stroke();
  }
}
export function quad3(a, b, c, d, fill, stroke = null) {
  runtime.poly([runtime.P(...a), runtime.P(...b), runtime.P(...c), runtime.P(...d)], fill, stroke);
}
export function line3(a, b, color, w = 1) {
  let p = runtime.P(...a),
    q = runtime.P(...b);
  runtime.ctx.strokeStyle = color;
  runtime.ctx.lineWidth = w;
  runtime.ctx.beginPath();
  runtime.ctx.moveTo(...p);
  runtime.ctx.lineTo(...q);
  runtime.ctx.stroke();
}
export function ellipse(x, z, rx, ry, color) {
  const p = runtime.P(x, z);
  runtime.ctx.fillStyle = color;
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(p[0], p[1], rx * runtime.scale * runtime.zoom, ry * runtime.scale * runtime.zoom, 0, 0, Math.PI * 2);
  runtime.ctx.fill();
}
export function cylinder(x, z, h, r, c1, c2) {
  const a = runtime.P(x, z, h),
    b = runtime.P(x, z, 0);
  runtime.ctx.strokeStyle = c1;
  runtime.ctx.lineWidth = 2 * r * runtime.scale * runtime.zoom;
  runtime.ctx.lineCap = 'round';
  runtime.ctx.beginPath();
  runtime.ctx.moveTo(...a);
  runtime.ctx.lineTo(...b);
  runtime.ctx.stroke();
  runtime.ctx.fillStyle = c2;
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(a[0], a[1], r * runtime.scale * runtime.zoom, r * runtime.scale * runtime.zoom * .5, 0, 0, 7);
  runtime.ctx.fill();
}
export function wallX(x, z1, z2, h, fill, base = '#4b3028') {
  const t = .075;
  runtime.quad3([x, z1, 0], [x, z2, 0], [x, z2, h], [x, z1, h], fill, base);
  runtime.quad3([x - t, z1, h], [x + t, z1, h], [x + t, z2, h], [x - t, z2, h], '#ead8b8', '#674630');
}
export function wallZ(z, x1, x2, h, fill, base = '#4b3028') {
  const t = .075;
  runtime.quad3([x1, z, 0], [x2, z, 0], [x2, z, h], [x1, z, h], fill, base);
  runtime.quad3([x1, z - t, h], [x2, z - t, h], [x2, z + t, h], [x1, z + t, h], '#ead8b8', '#674630');
}
export function solidInnerWall(x, z1, z2, h = 1.62) {
  const t = runtime.WALL_THICKNESS / 2,
    edge = '#836044',
    light = '#dfc8a8';
  // Thick, closed wall: two parallel faces plus endcaps, not a flat sheet.
  const faces = [{
    depth: runtime.painterDepth(x - t, z1),
    draw: () => runtime.quad3([x - t, z1, 0], [x - t, z2, 0], [x - t, z2, h], [x - t, z1, h], light, edge)
  }, {
    depth: runtime.painterDepth(x + t, z1),
    draw: () => runtime.quad3([x + t, z2, 0], [x + t, z1, 0], [x + t, z1, h], [x + t, z2, h], '#cdb391', edge)
  }, {
    depth: runtime.painterDepth(x, z1),
    draw: () => runtime.quad3([x - t, z1, 0], [x + t, z1, 0], [x + t, z1, h], [x - t, z1, h], '#b99a77', edge)
  }, {
    depth: runtime.painterDepth(x, z2),
    draw: () => runtime.quad3([x + t, z2, 0], [x - t, z2, 0], [x - t, z2, h], [x + t, z2, h], '#b99a77', edge)
  }];
  faces.sort((a, b) => a.depth - b.depth).forEach(f => f.draw());
  runtime.quad3([x - t, z1, h], [x + t, z1, h], [x + t, z2, h], [x - t, z2, h], '#f1ddbb', '#816048');
}
export function rectFloor(x, z, w, h, fill) {
  runtime.quad3([x, z, 0.028], [x + w, z, 0.028], [x + w, z + h, 0.028], [x, z + h, 0.028], fill);
}
// Cubo sólido: desenha faces visíveis da câmera, sem "paredes de papel".
export function box3(x, z, w, d, h, sides = ['#7c4e31', '#9b693f', '#b27a50'], base = 0) {
  const c = Math.cos(runtime.cameraYaw),
    si = Math.sin(runtime.cameraYaw),
    vx = c + si,
    vz = c - si;
  const faces = [{
    depth: runtime.painterDepth(x + w, z + d / 2),
    visible: vx > 0,
    fill: sides[1],
    quad: [[x + w, z, base], [x + w, z + d, base], [x + w, z + d, base + h], [x + w, z, base + h]]
  }, {
    depth: runtime.painterDepth(x, z + d / 2),
    visible: vx <= 0,
    fill: sides[1],
    quad: [[x, z + d, base], [x, z, base], [x, z, base + h], [x, z + d, base + h]]
  }, {
    depth: runtime.painterDepth(x + w / 2, z + d),
    visible: vz > 0,
    fill: sides[0],
    quad: [[x, z + d, base], [x + w, z + d, base], [x + w, z + d, base + h], [x, z + d, base + h]]
  }, {
    depth: runtime.painterDepth(x + w / 2, z),
    visible: vz <= 0,
    fill: sides[0],
    quad: [[x + w, z, base], [x, z, base], [x, z, base + h], [x + w, z, base + h]]
  }];
  faces.filter(f => runtime.captureGeometry || f.visible).sort((a, b) => a.depth - b.depth).forEach(f => runtime.quad3(...f.quad, f.fill, '#523b2a'));
  runtime.quad3([x, z, base + h], [x + w, z, base + h], [x + w, z + d, base + h], [x, z + d, base + h], sides[2], '#60422c');
}
export
// src/inventory/inventory.js

function ground() {
  runtime.ctx.fillStyle = "#3f6944";
  runtime.ctx.fillRect(0, 0, runtime.W, runtime.H);
  const corners = [runtime.P(-11, -10), runtime.P(18, -10), runtime.P(18, 17), runtime.P(-11, 17)];
  runtime.poly(corners, "#729f61", "#527c4a", 1);
  runtime.ctx.save();
  runtime.ctx.beginPath();
  corners.forEach((p, i) => i ? runtime.ctx.lineTo(...p) : runtime.ctx.moveTo(...p));
  runtime.ctx.closePath();
  runtime.ctx.clip();
  for (let x = -11; x < 18; x += 0.36) for (let z = -10; z < 17; z += 0.36) {
    let n = runtime.rnd(x * 81 + z * 117);
    if (n < 0.13) continue;
    let p = runtime.P(x + (n - 0.5) * 0.3, z + (n - 0.5) * 0.35),
      r = (0.5 + n) * runtime.scale * runtime.zoom * 0.014;
    runtime.ctx.strokeStyle = n > 0.7 ? "#91bb6c55" : "#2f683a46";
    runtime.ctx.lineWidth = Math.max(0.5, runtime.zoom * 0.8);
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(p[0], p[1]);
    runtime.ctx.lineTo(p[0] + r, p[1] - r * 0.65);
    runtime.ctx.stroke();
  }
  for (let x = -10; x < 17; x += 1.33) for (let z = -9; z < 16; z += 1.21) {
    const n = runtime.rnd(x * 39.17 + z * 71.3);
    if (n < 0.73) continue;
    const p = runtime.P(x + n * 0.36, z + n * 0.47, 0.013);
    const r = runtime.scale * runtime.zoom * (0.035 + 0.028 * n);
    runtime.ctx.fillStyle = n > 0.94 ? "#d4c58b77" : "#376f4a77";
    runtime.ctx.beginPath();
    runtime.ctx.ellipse(p[0], p[1], r, r * 0.42, 0, 0, Math.PI * 2);
    runtime.ctx.fill();
  }
  runtime.ctx.restore();
  if (runtime.snowAccum > 0.004) {
    runtime.ctx.save();
    runtime.ctx.globalAlpha = Math.min(0.83, runtime.snowAccum * 0.72);
    runtime.poly(corners, "#e4eff0");
    runtime.ctx.restore();
  }
  runtime.quad3([3.08, 5.04, 0.015], [4.14, 5.04, 0.015], [4.14, 14, 0.015], [3.08, 14, 0.015], "#b5aa8b");
  for (let t = 5.15; t < 13.7; t += 0.55) runtime.line3([3.08, t, 0.02], [4.14, t, 0.02], "#f1e8cb2b", 0.9);
}
export function tree(x, z, s = 1) {
  const p = runtime.P(x, z);
  runtime.ctx.fillStyle = "#10231555";
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(p[0] + runtime.scale * runtime.zoom * 0.12 * s, p[1] + runtime.scale * runtime.zoom * 0.08 * s, runtime.scale * runtime.zoom * s * 0.44, runtime.scale * runtime.zoom * s * 0.16, -0.2, 0, 7);
  runtime.ctx.fill();
  runtime.ctx.fillStyle = "#0f21148c";
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(p[0], p[1] + runtime.scale * runtime.zoom * 0.015, runtime.scale * runtime.zoom * s * 0.14, runtime.scale * runtime.zoom * s * 0.06, 0, 0, 7);
  runtime.ctx.fill();
  runtime.cylinder(x, z, 1.62 * s, 0.16 * s, "#6c4a2f", "#8f633e");
  runtime.ctx.fillStyle = "#6f5a42";
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(p[0], p[1] - runtime.scale * runtime.zoom * 0.01, runtime.scale * runtime.zoom * s * 0.09, runtime.scale * runtime.zoom * s * 0.035, 0, 0, 7);
  runtime.ctx.fill();
  const bunch = [[-0.43, 0.12, 0.55], [0.35, 0.07, 0.61], [0.08, -0.44, 0.65], [-0.18, -0.16, 0.6], [0.13, 0.27, 0.67]];
  const c = Math.cos(runtime.cameraYaw),
    si = Math.sin(runtime.cameraYaw);
  for (let i = 0; i < bunch.length; i++) {
    let [bx, bz, rad] = bunch[i];
    const swayX = (c * bx - si * bz) * 0.12 * s,
      swayZ = (si * bx + c * bz) * 0.12 * s;
    let pt = runtime.P(x + bx * s + swayX, z + bz * s + swayZ, 2.02 * s + i % 2 * 0.14 * s),
      r = rad * runtime.scale * runtime.zoom * s;
    let g = runtime.ctx.createRadialGradient(pt[0] - r * 0.36, pt[1] - r * 0.5, r * 0.1, pt[0], pt[1], r * 1.15);
    g.addColorStop(0, "#a8cf63");
    g.addColorStop(0.46, "#5a9a57");
    g.addColorStop(1, "#275b42");
    runtime.ctx.fillStyle = g;
    runtime.ctx.beginPath();
    runtime.ctx.arc(pt[0], pt[1], r, 0, Math.PI * 2);
    runtime.ctx.fill();
    if (runtime.snowAccum > 0.015) {
      runtime.ctx.save();
      runtime.ctx.globalAlpha = Math.min(.9, runtime.snowAccum);
      runtime.ctx.fillStyle = "#eef8f8";
      runtime.ctx.beginPath();
      runtime.ctx.ellipse(pt[0] - r * .12, pt[1] - r * .60, r * .57, r * .17, -.11, 0, Math.PI * 2);
      runtime.ctx.fill();
      runtime.ctx.restore();
    }
    for (let j = 0; j < 8; j++) {
      let ang = runtime.rnd(i * 37 + j * 51 + x * 11) * Math.PI * 2,
        rr = r * (0.15 + runtime.rnd(i * 43 + j * 71) * 0.72);
      runtime.ctx.fillStyle = j % 3 ? "#a6cf65" : "#79b35d";
      runtime.ctx.beginPath();
      runtime.ctx.arc(pt[0] + Math.cos(ang) * rr, pt[1] + Math.sin(ang) * rr * 0.78, r * 0.09, 0, 7);
      runtime.ctx.fill();
    }
  }
}
export function bush(x, z, s) {
  let p = runtime.P(x, z, 0.02);
  runtime.ctx.fillStyle = "#21412655";
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(p[0] + runtime.scale * runtime.zoom * 0.08, p[1] + runtime.scale * runtime.zoom * 0.05, runtime.scale * runtime.zoom * 0.42 * s, runtime.scale * runtime.zoom * 0.15 * s, 0, 0, 7);
  runtime.ctx.fill();
  const clusters = [[-0.18, 0.02, 0.42], [0.16, 0.04, 0.46], [0, -0.08, 0.5]];
  for (const [bx, bz, r0] of clusters) {
    const pt = runtime.P(x + bx * s, z + bz * s, 0.22 * s),
      r = runtime.scale * runtime.zoom * r0 * s;
    const g = runtime.ctx.createRadialGradient(pt[0] - r * 0.28, pt[1] - r * 0.42, r * 0.06, pt[0], pt[1], r);
    g.addColorStop(0, "#a8cf63");
    g.addColorStop(0.5, "#5a9a57");
    g.addColorStop(1, "#2a6347");
    runtime.ctx.fillStyle = g;
    runtime.ctx.beginPath();
    runtime.ctx.arc(pt[0], pt[1], r, 0, 7);
    runtime.ctx.fill();
    if (runtime.snowAccum > .02) {
      runtime.ctx.save();
      runtime.ctx.globalAlpha = Math.min(.9, runtime.snowAccum);
      runtime.ctx.fillStyle = "#eaf3f3";
      runtime.ctx.beginPath();
      runtime.ctx.ellipse(pt[0], pt[1] - r * .62, r * .66, r * .20, 0, 0, Math.PI * 2);
      runtime.ctx.fill();
      runtime.ctx.restore();
    }
  }
}
export function floorSurface() {
  const hw = runtime.currentHouseWidth();
  const finish = runtime.baseFloorFinish || {
    material: 'wood',
    color: '#94683e'
  };
  const mat = finish.material || 'wood',
    tile = mat === 'wood' ? .22 : mat === 'brick' ? .34 : mat === 'ceramic' ? .48 : mat === 'stone' ? .54 : .68;
  runtime.rectFloor(0, 0, hw, 5, finish.color || '#94683e');
  for (let z = tile; z < 5; z += tile) runtime.line3([0, z, .037], [hw, z, .037], runtime.shade(finish.color || '#94683e', -24), mat === 'wood' ? 1 : 1.7);
  if (mat !== 'wood') for (let x = tile; x < hw; x += tile) runtime.line3([x, 0, .04], [x, 5, .04], runtime.shade(finish.color || '#94683e', -24), 1.25);else for (let z = .2; z < 5; z += .44) for (let x = .4 + Math.round(z * 10) % 2 * .85; x < hw; x += 1.9) runtime.line3([x, z, .041], [x, z + .22, .041], runtime.shade(finish.color || '#94683e', -34), .8);
  if (runtime.game.rug.placed) {
    const x = runtime.game.rug.x,
      z = runtime.game.rug.z;
    runtime.rectFloor(x, z, 2.4, 1.65, "#6d2c45");
    runtime.rectFloor(x + 0.17, z + 0.16, 2.06, 1.34, "#b46a53");
    runtime.rectFloor(x + 0.31, z + 0.3, 1.77, 1.04, "#792b46");
    for (let j = 0; j < 14; j++) {
      let zz = z + 0.07 + j * 0.105;
      runtime.line3([x + 0.02, zz, 0.043], [x + 0.14, zz, 0.043], "#f0bb70", 1);
    }
  }
}
export function drawBed() {
  const o = runtime.bedObject,
    x = o.x,
    z = o.z,
    w = o.w,
    d = o.d;
  runtime.box3(x, z, w, d, .18, ['#5c4028', '#755034', '#9a6f47']);
  runtime.box3(x, z, w, .10, .58, ['#6a4930', '#83583a', '#af7b4f']);
  runtime.box3(x + .03, z + .10, w - .06, d - .14, .18, ['#b34840', '#ca5c52', '#e28372'], .18);
  runtime.quad3([x + .12, z + .15, .39], [x + .56, z + .15, .39], [x + .56, z + .35, .39], [x + .12, z + .35, .39], '#ddd1b0');
  runtime.quad3([x + .65, z + .14, .39], [x + w - .10, z + .14, .39], [x + w - .10, z + d - .08, .39], [x + .65, z + d - .08, .39], '#c24d43');
  runtime.line3([x + .62, z + .14, .40], [x + w - .12, z + .14, .40], '#eab4a2', 1.6);
}
export function drawDesk() {
  const o = runtime.deskObject,
    x = o.x,
    z = o.z,
    w = o.w,
    d = o.d,
    h = o.h;
  const dark = ['#62452f', '#765339', '#966d48'];
  // quatro pernas
  for (const [px, pz] of [[x + .09, z + .10], [x + w - .17, z + .10], [x + .09, z + d - .16], [x + w - .17, z + d - .16]]) runtime.box3(px, pz, .09, .09, h - .12, dark);
  // Gabinete opaco para impedir que pessoas ou outros móveis atravessem visualmente as gavetas.
  runtime.box3(x + w - .31, z + .05, .27, d - .10, h - .12, ['#65432e', '#785039', '#a27650']);
  runtime.quad3([x + w - .315, z + .045, .08], [x + w - .315, z + d - .05, .08], [x + w - .315, z + d - .05, h - .12], [x + w - .315, z + .045, h - .12], '#70503b', '#4b3429');
  for (const yy of [.23, .40]) {
    const p = runtime.P(x + w - .18, z + .045, yy);
    runtime.ctx.fillStyle = '#dbc28a';
    runtime.ctx.beginPath();
    runtime.ctx.arc(p[0], p[1], 2.2 * runtime.zoom, 0, Math.PI * 2);
    runtime.ctx.fill();
  }
  // saia traseira e lateral esquerda, deixando vão frontal livre
  runtime.box3(x + .16, z + d - .09, w - .50, .08, .16, ['#62422c', '#765137', '#a27853'], h - .28);
  runtime.box3(x + .14, z + .08, .08, d - .24, .16, ['#62422c', '#765137', '#a27853'], h - .28);
  // tampo por cima
  runtime.box3(x - .02, z - .02, w + .04, d + .04, .10, ['#765236', '#8b6240', '#bd9060'], h - .10);
  // Gavetas pertencem apenas à face z negativa do bloco lateral.
  // O tampo é opaco; o verso não recebe falsos puxadores.
  const frontVisible = runtime.captureGeometry || Math.cos(runtime.cameraYaw) - Math.sin(runtime.cameraYaw) < -.015;
  if (frontVisible) {
    for (let n = 0; n < 2; n++) {
      const open = runtime.game.drawerOpen[n],
        height = h - .28 - n * .19;
      const frontZ = z + .045 - (open ? .29 : 0);
      if (open) {
        runtime.box3(x + w - .32, frontZ, .28, .29, .075, ['#453023', '#543b2c', '#73513a'], height - .04);
        runtime.game.stores[n ? 'drawerBottom' : 'drawerTop'].slice(0, 2).forEach((t, i) => runtime.drawStoredItemMarker(x + w - .29 + i * .10, frontZ + .09, height + .04, t, .48));
      }
      runtime.quad3([x + w - .33, frontZ, height - .035], [x + w - .06, frontZ, height - .035], [x + w - .06, frontZ, height + .11], [x + w - .33, frontZ, height + .11], '#8e633e', '#4f3528');
      const pt = runtime.P(x + w - .19, frontZ - .002, height + .035);
      runtime.ctx.fillStyle = '#e8c785';
      runtime.ctx.beginPath();
      runtime.ctx.arc(pt[0], pt[1], 2.2 * runtime.zoom, 0, 7);
      runtime.ctx.fill();
    }
  }
  // itens sobre o tampo
  if (runtime.game.stores.deskTop.includes('deskBook')) runtime.quad3([x + .12, z + .10, h + .008], [x + .46, z + .10, h + .008], [x + .46, z + .33, h + .008], [x + .12, z + .33, h + .008], '#9e4041');
  if (runtime.game.stores.deskTop.includes('paper')) runtime.quad3([x + .54, z + .12, h + .008], [x + .82, z + .12, h + .008], [x + .82, z + .30, h + .008], [x + .54, z + .30, h + .008], '#ded7b0');
}
export function drawWardrobe() {
  const o = runtime.wardrobeObject,
    x = o.x,
    z = o.z,
    w = o.w,
    d = o.d,
    h = o.h;
  runtime.box3(x, z, w, d, h, ['#4f3529', '#624330', '#8d6648']);
  const showFront = runtime.captureGeometry || Math.cos(runtime.cameraYaw) + Math.sin(runtime.cameraYaw) < -.04;
  if (showFront) {
    const fx = x - .012;
    runtime.quad3([fx, z + .05, .16], [fx, z + d - .05, .16], [fx, z + d - .05, h - .10], [fx, z + .05, h - .10], '#4a3124', '#392117');
    for (let row = 0; row < 3; row++) {
      const bottom = .26 + row * .48;
      runtime.quad3([fx - .012, z + .07, bottom], [fx - .012, z + d - .07, bottom], [fx - .012, z + d - .07, bottom + .05], [fx - .012, z + .07, bottom + .05], '#a98156', '#6a4a34');
    }
    let left = runtime.game.stores.shelf.filter(v => v === 'book').length;
    const cols = ['#b05649', '#b79a57', '#6b8e79', '#c48649', '#9c4f5d', '#7091b0'];
    for (let row = 0; row < 3; row++) {
      const base = .31 + row * .48;
      const count = Math.min(runtime.shelfRows[row], 5);
      for (let k = 0; k < count; k++) {
        const zz = z + .12 + k * .12,
          hi = .23 + (k + row) % 2 * .03;
        runtime.quad3([fx - .028, zz, base], [fx - .028, zz + .09, base], [fx - .028, zz + .09, base + hi], [fx - .028, zz, base + hi], cols[(row * 3 + k) % cols.length], '#4a2c25');
        runtime.line3([fx - .031, zz + .02, base + hi - .02], [fx - .031, zz + .07, base + hi - .02], '#f1e7c4', 1.0);
      }
    }
  }
}
export function drawChimney() {
  const o = runtime.chimneyObject;
  if (!o) return;
  const x = o.x,
    z = o.z,
    d = o.d,
    w = o.w,
    fx = x + .08;
  // Boca na parede leste; o volume principal da chaminé fica do lado de fora.
  runtime.box3(fx, z - .045, Math.max(.24, w * .58), d + .09, 1.58, ['#9e8872', '#b8a18c', '#d4bba0']);
  runtime.box3(x - .02, z - .095, w + .04, d + .19, .17, ['#87715e', '#a78d73', '#c3a98f']);
  runtime.box3(x, z - .08, w * .50, .17, 1.38, ['#917a68', '#ae967f', '#d5b9a0']);
  runtime.box3(x, z + d - .09, w * .50, .17, 1.38, ['#917a68', '#ae967f', '#d5b9a0']);
  runtime.quad3([x - .015, z + .14, .18], [x - .015, z + d - .14, .18], [x - .015, z + d - .14, 1.25], [x - .015, z + .14, 1.25], '#151312', '#51463d');
  if (runtime.game.fireplace.lit && runtime.game.fireplace.wood > 0) {
    const glow = runtime.P(x, z + d * .5, .55);
    runtime.ctx.save();
    const g = runtime.ctx.createRadialGradient(glow[0], glow[1], 0, glow[0], glow[1], 34 * runtime.zoom);
    g.addColorStop(0, '#ffcc6677');
    g.addColorStop(.6, '#ff9d3b33');
    g.addColorStop(1, '#ffcc6600');
    runtime.ctx.fillStyle = g;
    runtime.ctx.beginPath();
    runtime.ctx.arc(glow[0], glow[1], 34 * runtime.zoom, 0, Math.PI * 2);
    runtime.ctx.fill();
    runtime.ctx.fillStyle = '#ff8a2a';
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(glow[0] - 7 * runtime.zoom, glow[1] + 7 * runtime.zoom);
    runtime.ctx.quadraticCurveTo(glow[0] - 1 * runtime.zoom, glow[1] - 8 * runtime.zoom, glow[0] + 4 * runtime.zoom, glow[1] + 4 * runtime.zoom);
    runtime.ctx.quadraticCurveTo(glow[0] + 6 * runtime.zoom, glow[1] - 2 * runtime.zoom, glow[0] + 9 * runtime.zoom, glow[1] + 8 * runtime.zoom);
    runtime.ctx.closePath();
    runtime.ctx.fill();
    runtime.ctx.fillStyle = '#ffd76a';
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(glow[0] - 3 * runtime.zoom, glow[1] + 6 * runtime.zoom);
    runtime.ctx.quadraticCurveTo(glow[0] + 1 * runtime.zoom, glow[1] - 4 * runtime.zoom, glow[0] + 4 * runtime.zoom, glow[1] + 5 * runtime.zoom);
    runtime.ctx.closePath();
    runtime.ctx.fill();
    runtime.ctx.restore();
  }
  runtime.box3(x - .05, z - .12, w + .08, d + .24, .14, ['#654b36', '#815d42', '#ad8760'], 1.39);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 2; i++) {
    const zz = z + .03 + i * d / 2 + row % 2 * .05,
      yy = .28 + row * .25;
    runtime.line3([x - .02, zz, yy], [x - .02, Math.min(z + d - .02, zz + d * .37), yy + .01], '#796757', 1.1);
  }
}
export function drawRockShape(cx, cz, w, d, h) {
  const verts = [[cx - w * .54, cz - d * .2, .08], [cx - w * .35, cz - d * .51, h * .56], [cx + w * .25, cz - d * .48, h * .80], [cx + w * .53, cz + d * .04, h * .35], [cx + w * .29, cz + d * .46, h * .78], [cx - w * .27, cz + d * .48, h * .55]];
  const top = [cx, cz, h];
  const colors = ['#69756c', '#838b7c', '#a2a294', '#747e75', '#969c90', '#78887e'];
  for (let i = 0; i < 6; i++) runtime.quad3([cx, cz, .04], verts[i], verts[(i + 1) % 6], top, colors[i], '#58645c');
}

// Casa 1 instanciável: transforma o mesmo modelo visual em uma unidade navegável.
export function drawChest() {
  const o = runtime.chestObject,
    {
      x,
      z,
      w,
      d
    } = o,
    h = .54,
    odd = (o.rot || 0) % 2 !== 0;
  // W e D são a caixa de colisão já rotacionada. Coordenadas locais sempre mantêm as proporções.
  const corner = (u, v, y) => {
    const r = ((o.rot || 0) % 4 + 4) % 4;
    return r === 0 ? [x + u * w, z + v * d, y] : r === 1 ? [x + (1 - v) * w, z + u * d, y] : r === 2 ? [x + (1 - u) * w, z + (1 - v) * d, y] : [x + v * w, z + (1 - u) * d, y];
  };
  const face = (a, b, c, dd, col, edge) => runtime.quad3(corner(...a), corner(...b), corner(...c), corner(...dd), col, edge);
  const wood = ['#28272e', '#37353b', '#55515b'];
  runtime.box3(x, z, w, d, .47, wood);
  // Detalhes aplicados somente às faces externas do volume, nunca ao chão.
  for (const u of [.12, .83]) {
    face([u, 1, .06], [u + .06, 1, .06], [u + .06, 1, .46], [u, 1, .46], '#24242a');
    face([u, 0, .06], [u + .06, 0, .06], [u + .06, 0, .46], [u, 0, .46], '#24242a');
  }
  const key = runtime.P(...corner(.5, 1, .30));
  runtime.ctx.fillStyle = runtime.game.chest.locked ? '#e1bd6a' : '#a6ada0';
  runtime.ctx.fillRect(key[0] - 3, key[1] - 5, 6, 10);
  if (runtime.game.chest.open) {
    face([.045, .05, .485], [.955, .05, .485], [.955, .95, .485], [.045, .95, .485], '#161419', '#4b454a');
    const lid = () => {
      // tampa sólida e opaca; ocupa o plano traseiro do baú
      face([0, -.12, .48], [1, -.12, .48], [1, -.12, 1.16], [0, -.12, 1.16], '#353139', '#9e8c73');
      face([.03, -.121, .55], [.97, -.121, .55], [.97, -.121, 1.10], [.03, -.121, 1.10], '#48444e', '#84796b');
    };
    const items = () => {
      if (runtime.game.stores.chest.includes('coins')) {
        for (let i = 0; i < 8; i++) {
          const q = runtime.P(...corner(.18 + i % 4 * .18, .26 + Math.floor(i / 4) * .23, .51));
          runtime.ctx.fillStyle = '#e0b350';
          runtime.ctx.beginPath();
          runtime.ctx.ellipse(q[0], q[1], 3 * runtime.zoom, 2.5 * runtime.zoom, 0, 0, 7);
          runtime.ctx.fill();
        }
      }
      if (runtime.game.stores.chest.includes('gem')) {
        const q = runtime.P(...corner(.72, .56, .53));
        runtime.ctx.fillStyle = '#5ad2de';
        runtime.ctx.beginPath();
        runtime.ctx.moveTo(q[0], q[1] - 7);
        runtime.ctx.lineTo(q[0] + 6, q[1]);
        runtime.ctx.lineTo(q[0], q[1] + 6);
        runtime.ctx.lineTo(q[0] - 6, q[1]);
        runtime.ctx.fill();
      }
      runtime.game.stores.chest.filter(t => !['coins', 'gem'].includes(t)).slice(0, 5).forEach((type, i) => {
        const c = corner(.15 + i % 3 * .24, .20 + Math.floor(i / 3) * .32, .52);
        runtime.drawStoredItemMarker(c[0], c[1], c[2], type, .88);
      });
    };
    // Se o lado da dobradiça está à frente dos itens, desenhar a tampa POR ÚLTIMO.
    // No ângulo oposto, os itens ficam naturalmente à frente da tampa.
    const hinge = corner(.5, -.12, .7),
      middle = corner(.5, .5, .7);
    const lidInFront = runtime.painterDepth(hinge[0], hinge[1]) >= runtime.painterDepth(middle[0], middle[1]);
    if (lidInFront) {
      items();
      lid();
    } else {
      lid();
      items();
    }
  } else {
    runtime.box3(x - .015, z - .015, w + .03, d + .03, .12, ['#353139', '#46424a', '#66616a'], .46);
    for (const u of [.13, .81]) face([u, 0, .58], [u + .06, 0, .58], [u + .06, 1, .58], [u, 1, .58], '#24232a');
  }
}
export function drawDivider() {
  runtime.solidInnerWall(3.6, .06, 2.36, 1.64);
  // A pequena seção solta da antiga parede foi removida por completo.
}
export function drawMoveable(o) {
  if (o.label === 'mesa') {
    for (const [lx, lz] of [[o.x + .12, o.z + .12], [o.x + o.w - .12, o.z + .12], [o.x + .12, o.z + o.d - .12], [o.x + o.w - .12, o.z + o.d - .12]]) runtime.box3(lx - .047, lz - .047, .094, .094, .50, ['#583927', '#64432d', '#87603e']);
    runtime.box3(o.x, o.z, o.w, o.d, .12, ['#875b37', '#9b6940', '#c49860'], .46);
    runtime.line3([o.x + .08, o.z + .11, .60], [o.x + o.w - .08, o.z + .11, .60], '#ebc993', 1.4);
  } else {
    runtime.box3(o.x, o.z, o.w, o.d, .38, ['#634329', '#805631', '#a47344']);
    runtime.box3(o.x + .04, o.z + .04, o.w - .08, o.d - .08, .04, ['#8a633f', '#9d7751', '#bc9465'], .38);
  }
}
export function drawSurfaceItems(id = null) {
  const groups = [['table', runtime.pushables.find(o => o.label === 'mesa')], ['bed', runtime.bedObject], ['deskTop', runtime.deskObject]];
  for (const [loc, o] of groups) {
    if (id && loc !== id || !o) continue;
    for (const [i, type] of runtime.game.stores[loc].entries()) {
      const x = o.x + .14 + i % 3 * .21,
        z = o.z + .12 + Math.floor(i / 3) * .21,
        y = o.h + .035;
      runtime.drawStoredItemMarker(x, z, y, type, 1);
    }
  }
}
export function lampIndexAt(x, z) {
  const a = runtime.fixedSolids.filter(o => o.label === 'luminaria');
  return Math.hypot(x - (a[0].x + a[0].w / 2), z - (a[0].z + a[0].d / 2)) < Math.hypot(x - (a[1].x + a[1].w / 2), z - (a[1].z + a[1].d / 2)) ? 0 : 1;
}
export function toggleLamp(i) {
  runtime.game.lamps[i] = !runtime.game.lamps[i];
  runtime.saveGame();
  runtime.toast(runtime.game.lamps[i] ? 'Luminária acesa.' : 'Luminária apagada.');
}
export function drawLamp(x, z) {
  const on = runtime.game.lamps[runtime.lampIndexAt(x, z)],
    base = runtime.P(x, z, .02),
    light = runtime.P(x, z, 1.41);
  if (on) {
    runtime.ctx.save();
    const radius = runtime.scale * runtime.zoom * 1.45;
    const glow = runtime.ctx.createRadialGradient(base[0], base[1], 0, base[0], base[1], radius);
    glow.addColorStop(0, '#f6cb6448');
    glow.addColorStop(.42, '#f6cf4920');
    glow.addColorStop(1, '#f6cf4900');
    runtime.ctx.fillStyle = glow;
    runtime.ctx.beginPath();
    runtime.ctx.ellipse(base[0], base[1], radius, radius * .50, 0, 0, Math.PI * 2);
    runtime.ctx.fill();
    const aura = runtime.ctx.createRadialGradient(light[0], light[1], 0, light[0], light[1], runtime.scale * runtime.zoom * .42);
    aura.addColorStop(0, '#fff5bf88');
    aura.addColorStop(1, '#fff5bf00');
    runtime.ctx.fillStyle = aura;
    runtime.ctx.beginPath();
    runtime.ctx.arc(light[0], light[1], runtime.scale * runtime.zoom * .42, 0, Math.PI * 2);
    runtime.ctx.fill();
    runtime.ctx.restore();
  }
  runtime.box3(x - .11, z - .11, .22, .22, .07, ['#473629', '#604736', '#82644b']);
  runtime.box3(x - .042, z - .042, .084, .084, 1.02, ['#4b3527', '#473527', '#64513c'], .07);
  runtime.box3(x - .07, z - .07, .14, .14, .12, ['#6e543f', '#7c624b', '#96775b'], 1.09);
  runtime.box3(x - .15, z - .15, .30, .30, .23, on ? ['#c69942', '#e8c96b', '#fff0b2'] : ['#555347', '#66665a', '#99968a'], 1.17);
  runtime.line3([x - .12, z, 1.30], [x + .12, z, 1.30], on ? '#fff5c7' : '#777065', 1.8);
}
// Continuous wall prism: original (inner) face stays fixed and volume grows outwards.
// Top / end caps close gaps between adjacent sections, including window jambs.
export function wallPanel(x, z, y0, y1, dx, dz, fill) {
  // Cada parede é um prisma de 15 cm; a face interna permanece no perímetro
  // original da casa e a espessura cresce exclusivamente para o exterior.
  const thick = runtime.WALL_THICKNESS,
    edge = '#6c4d38';
  const alongX = Math.abs(dx) > .001;
  const ox = alongX ? 0 : x < 3.5 ? -thick : thick;
  const oz = alongX ? z < 2.5 ? -thick : thick : 0;
  const a = [x, z, y0],
    b = [x + dx, z + dz, y0],
    c = [x + dx, z + dz, y1],
    d = [x, z, y1];
  const aa = [x + ox, z + oz, y0],
    bb = [x + dx + ox, z + dz + oz, y0];
  const cc = [x + dx + ox, z + dz + oz, y1],
    dd = [x + ox, z + oz, y1];
  const surfaces = [{
    z: runtime.painterDepth(x + dx / 2, z + dz / 2),
    pts: [a, b, c, d],
    fill: runtime.shade(fill, -3)
  }, {
    z: runtime.painterDepth(x + dx / 2 + ox, z + dz / 2 + oz),
    pts: [aa, bb, cc, dd],
    fill
  }, {
    z: runtime.painterDepth(x, z),
    pts: [a, aa, dd, d],
    fill: '#cdb291'
  }, {
    z: runtime.painterDepth(x + dx, z + dz),
    pts: [b, bb, cc, c],
    fill: '#cdb291'
  }];
  surfaces.sort((u, v) => u.z - v.z).forEach(f => runtime.quad3(...f.pts, f.fill));
  runtime.quad3(d, c, cc, dd, '#e8d3af');
  runtime.line3(dd, cc, edge, 1.1);
}
export function wallLine(x, z, h, dx, dz, fill) {
  runtime.wallPanel(x, z, 0, h, dx, dz, fill);
}
// Portal: somente a abertura é transparente; refazemos o que existe além da parede
// em vez de preencher o vidro com uma textura artificial de grama ou madeira.
export function initialize062() {
  runtime.paintingPortal = false;
}
export function sceneThroughWindow(side) {
  if (runtime.paintingPortal) return;
  runtime.paintingPortal = true;
  try {
    if (runtime.reveal()) {
      // Exterior: somente o desenho dentro do recorte do vidro. Evita redesenhar
      // o chão inteiro e elimina grama que aparecia indevidamente sobre a copa.
      runtime.ctx.fillStyle = '#65984e';
      runtime.ctx.fillRect(0, 0, runtime.W, runtime.H);
      const distantTrees = runtime.foliage.filter(t => Math.abs(t[0] - 3.5) < 8 && Math.abs(t[1] - 2.5) < 8);
      for (const t of distantTrees) runtime.tree(...t);
      for (const s of runtime.shrubs.filter(t => Math.abs(t[0] - 3.5) < 8 && Math.abs(t[1] - 2.5) < 8)) runtime.bush(...s);
    } else {
      // Vista externa: assoalho e móveis REAIS projetados através da janela.
      runtime.floorSurface();
      runtime.drawBed();
      runtime.drawDesk();
      runtime.drawWardrobe();
      runtime.drawChest();
      for (const o of runtime.pushables) runtime.drawMoveable(o);
    }
  } finally {
    runtime.paintingPortal = false;
  }
}
export function clippedWindow(coords, side) {
  if (runtime.paintingPortal) return;
  runtime.ctx.save();
  runtime.ctx.beginPath();
  coords.map(p => runtime.P(...p)).forEach((p, i) => i ? runtime.ctx.lineTo(...p) : runtime.ctx.moveTo(...p));
  runtime.ctx.closePath();
  runtime.ctx.clip();
  runtime.sceneThroughWindow(side);
  runtime.ctx.restore();
}
export function windowPaneZ(z, x, width) {
  const y1 = 1.24,
    y2 = 2.17,
    eps = .003;
  runtime.wallLine(x, z, y1, width, 0, '#d4bd98');
  runtime.wallPanel(x, z, y2, 2.92, width, 0, '#dbc5a2');
  runtime.clippedWindow([[x, z, y1], [x + width, z, y1], [x + width, z, y2], [x, z, y2]], 'z');
  // Vidro azulado translúcido apenas sobre o que efetivamente está atrás.
  runtime.ctx.save();
  runtime.ctx.globalAlpha = .32;
  runtime.quad3([x, z + eps, y1], [x + width, z + eps, y1], [x + width, z + eps, y2], [x, z + eps, y2], '#a7d8ee');
  runtime.ctx.restore();
  runtime.line3([x + width / 2, z, y1], [x + width / 2, z, y2], '#f3dfba', 2.3);
  runtime.line3([x, z, 1.70], [x + width, z, 1.70], '#f3dfba', 2.3);
  runtime.line3([x, z, y1], [x + width, z, y1], '#694631', 3.3);
}
export function windowPaneX(x, z, width) {
  const y1 = 1.24,
    y2 = 2.17,
    eps = .003;
  runtime.wallLine(x, z, y1, 0, width, '#d4bd98');
  runtime.wallPanel(x, z, y2, 2.92, 0, width, '#dbc5a2');
  runtime.clippedWindow([[x, z, y1], [x, z + width, y1], [x, z + width, y2], [x, z, y2]], 'x');
  runtime.ctx.save();
  runtime.ctx.globalAlpha = .32;
  runtime.quad3([x + eps, z, y1], [x + eps, z + width, y1], [x + eps, z + width, y2], [x + eps, z, y2], '#a7d8ee');
  runtime.ctx.restore();
  runtime.line3([x, z + width / 2, y1], [x, z + width / 2, y2], '#f3dfba', 2.3);
  runtime.line3([x, z, 1.70], [x, z + width, 1.70], '#f3dfba', 2.3);
  runtime.line3([x, z, y1], [x, z + width, y1], '#694631', 3.3);
}
export function drawWallFace(side) {
  const cream = runtime.houseFinish?.color || "#e6d3b1",
    wood = "#765338",
    h = 2.92,
    hw = runtime.currentHouseWidth();
  const added = (runtime.game.addedWindows || []).filter(o => o.side === side && !o.hidden);
  if (added.length) {
    const horizontal = side === "north" || side === "south",
      wallAt = horizontal ? side === "north" ? 0 : 5 : side === "west" ? 0 : hw;
    const length = horizontal ? hw : 5;
    const openings = added.map(o => ({
      start: o.u,
      end: o.u + o.w,
      kind: "window"
    }));
    const defaults = side === "north" ? [[2, 2.9]] : side === "south" ? [[1.1, 1.8]] : side === "west" ? [[1.95, 2.83]] : [];
    for (const [a, b] of defaults) openings.push({
      start: a,
      end: b,
      kind: "window"
    });
    if (side === "south") openings.push({
      start: 3.05,
      end: 4.23,
      kind: "door"
    });
    openings.sort((a, b) => a.start - b.start);
    let cursor = 0;
    const solid = (a, b) => {
      if (b <= a) return;
      if (horizontal) runtime.wallLine(a, wallAt, h, b - a, 0, cream);else runtime.wallLine(wallAt, a, h, 0, b - a, cream);
    };
    for (const o of openings) {
      if (o.start > cursor + 1e-3) solid(cursor, o.start);
      if (o.kind === "window") {
        if (horizontal) runtime.windowPaneZ(wallAt, o.start, o.end - o.start);else runtime.windowPaneX(wallAt, o.start, o.end - o.start);
      }
      cursor = Math.max(cursor, o.end);
    }
    solid(cursor, length);
    for (let u = 0; u < length; u += 1.18) {
      if (openings.some(o => u > o.start - 0.03 && u < o.end + 0.03)) continue;
      if (horizontal) runtime.line3([u, wallAt, 0.02], [u, wallAt, h], wood, 3.3);else runtime.line3([wallAt, u, 0.02], [wallAt, u, h], wood, 3.3);
    }
    if (side === "south") {
      runtime.wallPanel(3.05, wallAt, 2.6, h, 1.18, 0, cream);
      if (!runtime.reveal()) runtime.drawDoor();
    }
    if (horizontal) runtime.line3([0, wallAt, h], [hw, wallAt, h], wood, 4.3);else runtime.line3([wallAt, 0, h], [wallAt, 5, h], wood, 4.3);
    return;
  }
  if (side === "north" || side === "south") {
    const z = side === "north" ? 0 : 5;
    const segments = side === "north" ? [[0, 2], [2, 2.9], [2.9, hw]] : [[0, 1.1], [1.1, 1.8], [1.8, 3.05], [4.23, hw]];
    for (const [a, b] of segments) {
      if (side === "north" && a === 2 || side === "south" && a === 1.1) runtime.windowPaneZ(z, a, b - a);else runtime.wallLine(a, z, h, b - a, 0, cream);
    }
    for (let x = 0; x < hw; x += 1.18) {
      if (side === "south" && x > 3.02 && x < 4.24) continue;
      if (side === "north" && x > 2 && x < 2.9 || side === "south" && x > 1.1 && x < 1.8) continue;
      runtime.line3([x, z, 0.02], [x, z, h], wood, 3.3);
    }
    if (side === "south") {
      runtime.wallPanel(3.05, z, 2.6, h, 1.18, 0, cream);
      if (!runtime.reveal()) runtime.drawDoor();
    }
    runtime.line3([0, z, h], [hw, z, h], wood, 4.3);
  } else {
    const x = side === "west" ? 0 : hw;
    if (side === "west") {
      const w1 = 1.95,
        w2 = w1 + 0.88;
      runtime.wallLine(x, 0, h, 0, w1, cream);
      runtime.windowPaneX(x, w1, w2 - w1);
      runtime.wallLine(x, w2, h, 0, 5 - w2, cream);
      for (let z = 0; z < 5; z += 1.18) {
        if (z > w1 && z < w2) continue;
        runtime.line3([x, z, 0.02], [x, z, h], wood, 3.3);
      }
    } else {
      runtime.wallLine(x, 0, h, 0, 5, cream);
      for (let z = 0; z < 5; z += 1.18) runtime.line3([x, z, 0.02], [x, z, h], wood, 3.3);
    }
    runtime.line3([x, 0, h], [x, 5, h], wood, 4.3);
  }
}
// Máscara projetada de alvenaria opaca, aplicada somente às paredes
// que ficam na frente da folha da porta em cada orientação de câmera.
// O recorte atua em pixels e não depende de um ângulo fixo da câmera.
export function clipDoorBehindWalls() {
  const d = runtime.painterDepth(3.05, 4.52),
    t = .001;
  const occluders = [{
    depth: runtime.painterDepth(1.5, 5),
    quad: [[0, 5, 0], [3.05, 5, 0], [3.05, 5, 2.92], [0, 5, 2.92]]
  }, {
    depth: runtime.painterDepth(5.6, 5),
    quad: [[4.23, 5, 0], [7, 5, 0], [7, 5, 2.92], [4.23, 5, 2.92]]
  }, {
    depth: runtime.painterDepth(0, 2.5),
    quad: [[0, 0, 0], [0, 5, 0], [0, 5, 2.92], [0, 0, 2.92]]
  }, {
    depth: runtime.painterDepth(7, 2.5),
    quad: [[7, 0, 0], [7, 5, 0], [7, 5, 2.92], [7, 0, 2.92]]
  }, {
    depth: runtime.painterDepth(3.5, 0),
    quad: [[0, 0, 0], [7, 0, 0], [7, 0, 2.92], [0, 0, 2.92]]
  }];
  const front = occluders.filter(o => o.depth > d + t);
  if (!front.length) return false;
  runtime.ctx.beginPath();
  runtime.ctx.rect(0, 0, runtime.W, runtime.H);
  for (const wall of front) {
    const ps = wall.quad.map(v => runtime.P(...v));
    runtime.ctx.moveTo(ps[0][0], ps[0][1]);
    for (let i = 1; i < ps.length; i++) runtime.ctx.lineTo(...ps[i]);
    runtime.ctx.closePath();
  }
  runtime.ctx.clip('evenodd');
  return true;
}
export function drawDoor() {
  runtime.ctx.save();
  if (!runtime.paintingPortal && !runtime.reveal()) runtime.clipDoorBehindWalls();
  const x = 3.05,
    z = 5,
    h = 2.60;
  runtime.line3([x, z, 0], [x, z, h], '#523826', 4.5);
  runtime.line3([4.23, z, 0], [4.23, z, h], '#523826', 4.5);
  runtime.line3([x, z, h], [4.23, z, h], '#503827', 4.5);
  // Porta maciça gira lentamente no eixo vertical, de frente para o cômodo.
  const angle = runtime.doorSwing * Math.PI / 2,
    dx = 1.18 * Math.cos(angle),
    dz = -1.18 * Math.sin(angle);
  const nx = Math.sin(angle) * runtime.DOOR_THICKNESS * .5,
    nz = Math.cos(angle) * runtime.DOOR_THICKNESS * .5;
  const a = [x - nx, z - nz, 0],
    b = [x + dx - nx, z + dz - nz, 0];
  const c = [x + dx + nx, z + dz + nz, 0],
    d = [x + nx, z + nz, 0];
  const aa = [a[0], a[1], h],
    bb = [b[0], b[1], h],
    cc = [c[0], c[1], h],
    dd = [d[0], d[1], h];
  const faces = [{
    depth: runtime.painterDepth((a[0] + b[0]) / 2, (a[1] + b[1]) / 2),
    p: [a, b, bb, aa],
    color: '#76502f'
  }, {
    depth: runtime.painterDepth((c[0] + d[0]) / 2, (c[1] + d[1]) / 2),
    p: [d, c, cc, dd],
    color: '#694429'
  }, {
    depth: runtime.painterDepth((b[0] + c[0]) / 2, (b[1] + c[1]) / 2),
    p: [b, c, cc, bb],
    color: '#593920'
  }];
  faces.sort((u, v) => u.depth - v.depth).forEach(f => runtime.quad3(...f.p, f.color, '#563b28'));
  runtime.quad3(aa, bb, cc, dd, '#9a6c48', '#563b28');
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    runtime.line3([x + dx * t - nx, z + dz * t - nz, .10], [x + dx * t - nx, z + dz * t - nz, h - .1], '#5c3925', 1.4);
  }
  const lock = runtime.P(x + dx * .85 + nx, z + dz * .85 + nz, 1.10);
  runtime.ctx.fillStyle = runtime.game.door.locked ? '#e9ba57' : '#c6d2b1';
  runtime.ctx.beginPath();
  runtime.ctx.arc(lock[0], lock[1], 3.2 * runtime.zoom, 0, 7);
  runtime.ctx.fill();
  runtime.ctx.restore();
}
export function drawDoorwayBackground() {
  if (!runtime.game.door.open) return;
  // O recorte do vão é um portal óptico: renderiza a geometria real do
  // cômodo no mesmo espaço da cena, não um painel que imita madeira.
  const corners = [[3.055, 5, 0], [4.225, 5, 0], [4.225, 5, 2.60], [3.055, 5, 2.60]].map(p => runtime.P(...p));
  runtime.ctx.save();
  runtime.ctx.beginPath();
  corners.forEach((p, i) => i ? runtime.ctx.lineTo(...p) : runtime.ctx.moveTo(...p));
  runtime.ctx.closePath();
  runtime.ctx.clip();
  // Fundo neutro: se a câmera não alcançar outra parede, não revela grama.
  runtime.ctx.fillStyle = '#baa483';
  runtime.ctx.fillRect(0, 0, runtime.W, runtime.H);
  runtime.floorSurface();
  // A parede oposta, as aberturas e o mobiliário são os mesmos de dentro.
  runtime.drawWallFace('north');
  const things = [{
    x: 1.3,
    z: .9,
    draw: runtime.drawBed
  }, {
    x: runtime.deskObject.x + runtime.deskObject.w / 2,
    z: runtime.deskObject.z + runtime.deskObject.d / 2,
    draw: runtime.drawDesk
  }, {
    x: runtime.wardrobeObject.x + runtime.wardrobeObject.w / 2,
    z: runtime.wardrobeObject.z + runtime.wardrobeObject.d / 2,
    draw: runtime.drawWardrobe
  }, {
    x: runtime.chestPos().x,
    z: runtime.chestPos().z,
    draw: runtime.drawChest
  }, {
    x: 3.6,
    z: 1.18,
    draw: runtime.drawDivider
  }, ...runtime.pushables.map(o => ({
    x: o.x + o.w / 2,
    z: o.z + o.d / 2,
    draw: () => {
      runtime.drawMoveable(o);
      if (o.label === 'mesa') runtime.drawSurfaceItems('table');
    }
  })), {
    x: .7,
    z: 2.3,
    draw: () => runtime.drawLamp(.7, 2.3)
  }, {
    x: 6.26,
    z: 3.88,
    draw: () => runtime.drawLamp(6.26, 3.88)
  }];
  things.sort((a, b) => runtime.painterDepth(a.x, a.z) - runtime.painterDepth(b.x, b.z)).forEach(o => o.draw());
  runtime.ctx.restore();
}
export function drawOuterShell() {
  const hw = runtime.currentHouseWidth();
  const sides = [{
    side: 'north',
    x: hw / 2,
    z: 0
  }, {
    side: 'south',
    x: hw / 2,
    z: 5
  }, {
    side: 'west',
    x: 0,
    z: 2.5
  }, {
    side: 'east',
    x: hw,
    z: 2.5
  }];
  const depth = p => {
    const [rx, rz] = runtime.rotated(p.x, p.z);
    return rx + rz;
  };
  runtime.drawDoorwayBackground();
  sides.sort((a, b) => depth(a) - depth(b)).forEach(w => runtime.drawWallFace(w.side));
}
export function interiorWalls() {
  const cream = '#e8d5b6',
    dark = '#765338',
    hw = runtime.currentHouseWidth();
  runtime.wallX(3.6, .1, 2.28, 1.6, cream);
  for (let z = .2; z < 4.9; z += 1) if (z < 2.28 || z > 2.55 && z < 2.78) runtime.line3([3.6, z, .01], [3.6, z, 1.6], dark, 3);
  runtime.wallZ(5, 0, 3.02, .74, '#d8c29b');
  runtime.wallZ(5, 4.28, hw, .74, '#d8c29b');
  runtime.wallX(hw, 0, 5, .72, '#d7c09c');
  runtime.wallX(0, 0, 5, .72, '#d7c09c');
  runtime.line3([0, 5, .74], [3.02, 5, .74], dark, 4);
  runtime.line3([4.28, 5, .74], [hw, 5, .74], dark, 4);
}
export function roof() {
  const hw = runtime.currentHouseWidth(),
    a = -0.28,
    b = hw + 0.28,
    rz = 2.5,
    eave = hw > 8 ? 5.82 : 2.96,
    rh = hw > 8 ? 7.07 : 4.18;
  const gables = [a, b].map(x => ({
    x,
    depth: runtime.rotated(x, 2.5)[0] + runtime.rotated(x, 2.5)[1]
  })).sort((x, y) => x.depth - y.depth);
  for (const g of gables) runtime.poly([runtime.P(g.x, -0.4, eave - 0.05), runtime.P(g.x, 2.5, rh + 0.01), runtime.P(g.x, 5.41, eave - 0.05)], "#bb956f", "#5b3827", 0.6);
  const sides = [{
    depth: runtime.rotated(hw / 2, 1).reduce((a2, b2) => a2 + b2, 0),
    fill: "#984332",
    p: [[a, -0.37, eave], [b, -0.37, eave], [b, rz, rh], [a, rz, rh]],
    back: true
  }, {
    depth: runtime.rotated(hw / 2, 4).reduce((a2, b2) => a2 + b2, 0),
    fill: "#b6563c",
    p: [[a, rz, rh], [b, rz, rh], [b, 5.39, eave], [a, 5.39, eave]],
    back: false
  }];
  sides.sort((x, y) => x.depth - y.depth);
  for (const face of sides) {
    runtime.quad3(...face.p, face.fill, "#542e24");
    const r = face.back ? [-0.37, rz] : [rz, 5.39];
    for (let i = 1; i < 12; i++) {
      const z = r[0] + (r[1] - r[0]) * i / 12;
      const yy = face.back ? eave + (rh - eave) * (z - r[0]) / (rz - r[0]) : rh + (eave - rh) * (z - rz) / (5.39 - rz);
      runtime.line3([a, z, yy + 0.01], [b, z, yy + 0.01], "#67382d9b", 0.76);
    }
  }
  runtime.quad3([a, -0.37, eave], [b, -0.37, eave], [b, -0.37, eave - 0.15], [a, -0.37, eave - 0.15], "#683b2d");
  runtime.quad3([a, 5.39, eave], [b, 5.39, eave], [b, 5.39, eave - 0.15], [a, 5.39, eave - 0.15], "#683b2d");
  runtime.line3([a, rz, rh], [b, rz, rh], "#633b30", 4.5);
}

// Casa 2: segundo pavimento integrado ao casco, não uma plataforma flutuante.
export function drawKey(x, z, type) {
  const p = runtime.P(x, z, .06),
    r = runtime.scale * runtime.zoom;
  runtime.ctx.fillStyle = '#26361d80';
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(p[0] + 1.6, p[1] + 3, r * .18, r * .07, 0, 0, 7);
  runtime.ctx.fill();
  // Chave dourada, aro e dentes, com brilho discreto.
  runtime.ctx.strokeStyle = type === 'house' ? '#f5d36e' : '#aedee3';
  runtime.ctx.lineWidth = Math.max(2, r * .075);
  runtime.ctx.lineCap = 'round';
  runtime.ctx.beginPath();
  runtime.ctx.arc(p[0] - r * .13, p[1] - r * .10, r * .095, 0, Math.PI * 2);
  runtime.ctx.stroke();
  runtime.ctx.beginPath();
  runtime.ctx.moveTo(p[0] - r * .06, p[1] - r * .04);
  runtime.ctx.lineTo(p[0] + r * .21, p[1] + r * .18);
  runtime.ctx.lineTo(p[0] + r * .26, p[1] + r * .11);
  runtime.ctx.moveTo(p[0] + r * .14, p[1] + r * .12);
  runtime.ctx.lineTo(p[0] + r * .19, p[1] + r * .05);
  runtime.ctx.stroke();
  runtime.ctx.font = 'bold 11px system-ui';
  runtime.ctx.textAlign = 'center';
  runtime.ctx.fillStyle = '#fff0bb';
  runtime.ctx.fillText('Chave', p[0], p[1] - r * .45);
}
export function drawItems() {
  if (!runtime.game.items.chestKey && runtime.reveal()) runtime.drawKey(runtime.game.groundKeys.chest.x, runtime.game.groundKeys.chest.z, 'chest');
}
export
// Camadas de interiores separadas da colisão: nenhum objeto é duplicado.
function painterDepth(x, z) {
  const a = runtime.rotated(x, z);
  return a[0] + a[1];
}
export function footprintDepth(o) {
  const pts = [[o.x, o.z], [o.x + o.w, o.z], [o.x, o.z + o.d], [o.x + o.w, o.z + o.d]];
  return Math.min(...pts.map(([x, z]) => runtime.painterDepth(x, z)));
}
// Renderização por partes: evita que uma parede ou mesa inteira cubra o personagem.
export function wallParts() {
  const result = [];
  for (let z = .06; z < 2.36; z += .12) {
    const a = z,
      b = Math.min(z + .12, 2.36);
    result.push({
      x: 3.6,
      z: (a + b) / 2,
      depth: runtime.painterDepth(3.6, (a + b) / 2),
      draw: () => runtime.drawWallSegment(a, b)
    });
  }
  return result;
}
export function drawWallSegment(z1, z2) {
  const x = 3.6,
    t = runtime.WALL_THICKNESS / 2,
    h = 1.06;
  const vx = Math.cos(runtime.cameraYaw) + Math.sin(runtime.cameraYaw);
  // Renderizar somente a face visível evita desenhar a face traseira sobre o personagem.
  const xx = vx > 0 ? x + t : x - t;
  runtime.quad3([xx, z1, 0], [xx, z2, 0], [xx, z2, h], [xx, z1, h], vx > 0 ? '#cdb391' : '#dfc8a8');
  runtime.quad3([x - t, z1, h], [x + t, z1, h], [x + t, z2, h], [x - t, z2, h], '#f1ddbb');
  if (z1 <= .061) runtime.quad3([x - t, z1, 0], [x + t, z1, 0], [x + t, z1, h], [x - t, z1, h], '#b99a77');
  if (z2 >= 2.359) runtime.quad3([x + t, z2, 0], [x - t, z2, 0], [x - t, z2, h], [x + t, z2, h], '#b99a77');
}
export function tableParts(o) {
  if (rotationDelta(o)) return [{
    x: o.x + o.w / 2,
    z: o.z + o.d / 2,
    depth: runtime.footprintDepth(o),
    draw: () => runtime.drawMoveable(o)
  }];
  if (o.label !== 'mesa') return [{
    x: o.x + o.w / 2,
    z: o.z + o.d / 2,
    depth: runtime.footprintDepth(o),
    draw: () => runtime.drawMoveable(o)
  }];
  const parts = [];
  for (const [lx, lz] of [[.12, .12], [o.w - .12, .12], [.12, o.d - .12], [o.w - .12, o.d - .12]]) {
    const x = o.x + lx - .047,
      z = o.z + lz - .047;
    parts.push({
      x,
      z,
      depth: runtime.painterDepth(x + .047, z + .047),
      draw: () => runtime.box3(x, z, .094, .094, .50, ['#583927', '#64432d', '#87603e'])
    });
  }
  for (let i = 0; i < 6; i++) {
    const z = o.z + o.d * i / 6,
      dd = o.d / 6 + .001;
    parts.push({
      x: o.x + o.w / 2,
      z: z + dd / 2,
      depth: runtime.painterDepth(o.x + o.w / 2, z + dd / 2),
      draw: () => {
        runtime.quad3([o.x, z, .58], [o.x + o.w, z, .58], [o.x + o.w, z + dd, .58], [o.x, z + dd, .58], '#c49860');
        if (i === 0) runtime.quad3([o.x, z, .46], [o.x + o.w, z, .46], [o.x + o.w, z, .58], [o.x, z, .58], '#875b37');
        runtime.quad3([o.x + o.w, z, .46], [o.x + o.w, z + dd, .46], [o.x + o.w, z + dd, .58], [o.x + o.w, z, .58], '#9b6940');
      }
    });
  }
  return parts;
}
export function drawAnnexFloorIfNeeded() {}
export function drawInnerScene() {
  runtime.floorSurface();
  const hw = runtime.currentHouseWidth();
  const sides = [{
    name: "north",
    x: hw / 2,
    z: 0
  }, {
    name: "south",
    x: hw / 2,
    z: 5
  }, {
    name: "west",
    x: 0,
    z: 2.5
  }, {
    name: "east",
    x: hw,
    z: 2.5
  }];
  const mid = runtime.painterDepth(hw / 2, 2.5);
  const distant = sides.filter(o => runtime.painterDepth(o.x, o.z) <= mid).sort((a, b) => runtime.painterDepth(a.x, a.z) - runtime.painterDepth(b.x, b.z));
  const nearby = sides.filter(o => runtime.painterDepth(o.x, o.z) > mid).sort((a, b) => runtime.painterDepth(a.x, a.z) - runtime.painterDepth(b.x, b.z));
  const cutH = runtime.zoom > 1.42 ? 0.18 : 0.56;
  for (const o of distant) runtime.drawWallFace(o.name);
  const parts = [...(runtime.bedObject.hidden ? [] : [{
    x: runtime.bedObject.x + runtime.bedObject.w / 2,
    z: runtime.bedObject.z + runtime.bedObject.d / 2,
    depth: runtime.footprintDepth(runtime.bedObject),
    draw: () => {
      runtime.drawBed();
      runtime.drawSurfaceItems("bed");
    }
  }]), ...(runtime.deskObject.hidden ? [] : [{
    x: runtime.deskObject.x + runtime.deskObject.w / 2,
    z: runtime.deskObject.z + runtime.deskObject.d / 2,
    depth: runtime.footprintDepth(runtime.deskObject),
    draw: () => runtime.drawDesk()
  }]), ...(runtime.wardrobeObject.hidden ? [] : [{
    x: runtime.wardrobeObject.x + runtime.wardrobeObject.w / 2,
    z: runtime.wardrobeObject.z + runtime.wardrobeObject.d / 2,
    depth: runtime.footprintDepth(runtime.wardrobeObject),
    draw: () => runtime.drawWardrobe()
  }]), {
    x: runtime.chimneyObject.x + runtime.chimneyObject.w / 2,
    z: runtime.chimneyObject.z + runtime.chimneyObject.d / 2,
    depth: runtime.footprintDepth(runtime.chimneyObject),
    draw: () => runtime.drawChimney()
  }, ...(runtime.chestObject.hidden ? [] : [{
    x: runtime.chestPos().x,
    z: runtime.chestPos().z,
    depth: runtime.footprintDepth(runtime.chestObject),
    draw: () => runtime.drawChest()
  }]), {
    x: runtime.game.door.open ? 3.05 : 3.64,
    z: runtime.game.door.open ? 4.49 : 5,
    depth: runtime.game.door.open ? Math.min(runtime.painterDepth(3.05, 3.98), runtime.painterDepth(3.05, 5)) : runtime.painterDepth(3.64, 5) - 0.02,
    isDoor: true,
    draw: () => runtime.drawDoor()
  }, ...runtime.wallParts(), ...runtime.pushables.filter(o => !o.hidden).flatMap(o => runtime.tableParts(o)), ...runtime.pushables.filter(o => o.label === "mesa" && !o.hidden).map(o => ({
    x: o.x + o.w / 2,
    z: o.z + o.d / 2,
    depth: runtime.painterDepth(o.x + o.w / 2, o.z + o.d / 2) + 0.075,
    draw: () => runtime.drawSurfaceItems("table")
  })), ...runtime.fixedSolids.filter(o => o.label === "luminaria" && !o.hidden).map(o => ({
    x: o.x + o.w / 2,
    z: o.z + o.d / 2,
    depth: runtime.footprintDepth(o),
    draw: () => runtime.drawLamp(o.x + o.w / 2, o.z + o.d / 2)
  })), {
    x: runtime.game.groundKeys.chest.x,
    z: runtime.game.groundKeys.chest.z,
    depth: runtime.painterDepth(runtime.game.groundKeys.chest.x, runtime.game.groundKeys.chest.z),
    draw: () => runtime.drawItems()
  }, ...runtime.editDecor.filter(o => !runtime.houseContext && o.kind !== "floor" && runtime.inside(o.x, o.z)).map(o => ({
    x: o.x,
    z: o.z,
    depth: runtime.painterDepth(o.x + (o.w || 0) / 2, o.z + (o.d || 0) / 2),
    draw: () => runtime.drawDecor(o)
  })), ...runtime.game.droppedItems.filter(o => runtime.inside(o.x, o.z)).map(o => ({
    x: o.x,
    z: o.z,
    depth: runtime.painterDepth(o.x, o.z),
    draw: () => runtime.drawGroundItem(o)
  })), {
    x: runtime.player.x,
    z: runtime.player.z,
    isPlayer: true,
    draw: () => runtime.character()
  }];
  parts.sort((a, b) => {
    const d = q => q.isPlayer ? runtime.painterDepth(q.x, q.z) + 0.12 + Math.min(0.25, runtime.player.elevation * 0.12) : q.depth ?? runtime.painterDepth(q.x, q.z);
    return d(a) - d(b);
  }).forEach(part => part.draw());
  for (const wall of nearby) runtime.drawCutWall(wall.name, cutH);
}
export function drawCutWall(name, height) {
  const hw = runtime.currentHouseWidth(),
    cream = '#e3d0ad';
  if (name === 'south') {
    runtime.wallZ(5, 0, 3.05, height, cream);
    runtime.wallZ(5, 4.23, hw, height, cream);
  } else if (name === 'north') runtime.wallZ(0, 0, hw, height, cream);else if (name === 'east') runtime.wallX(hw, 0, 5, height, cream);else runtime.wallX(0, 0, 5, height, cream);
}
export function draw() {
  runtime.frame++;
  runtime.ctx.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
  runtime.ctx.clearRect(0, 0, runtime.W, runtime.H);
  runtime.ground();
  const baseHouseScene = [{
    x: runtime.house.w / 2,
    z: 2.5,
    kind: "house",
    draw: () => {
      if(runtime.baseHouseEnabled===false)return;
      if (runtime.reveal()) runtime.drawInnerScene();else {
        const hw = runtime.currentHouseWidth(),
          offset = 0.65;
        runtime.poly([[0, 0], [hw, 0], [hw, 5], [0, 5]].map(([x, z]) => runtime.P(x + offset, z + offset, 8e-3)), "#152a1640");
        runtime.drawOuterShell();
        drawUpperExterior051();
        runtime.roof();
        runtime.drawExternalChimney();
        drawChimneyCap051();
      }
    }
  }];
  const scene = [...runtime.foliage.map((t, i) => ({
    x: t[0],
    z: t[1],
    kind: "tree",
    draw: () => {
      if (!runtime.gathering.trees[i].fallen) runtime.tree(...t);else {
        runtime.box3(t[0] - 0.5, t[1] - 0.1, 1, 0.24, 0.18, ["#6b4c32", "#98704b", "#b38a5e"]);
      }
    }
  })), ...runtime.gathering.rocks.map(r => ({
    x: r.x,
    z: r.z,
    kind: "rock",
    draw: () => {
      if (r.hp > 0) runtime.drawRockShape(r.x, r.z, 0.56, 0.5, 0.4);
    }
  })), {
    x: runtime.gathering.mound.x,
    z: runtime.gathering.mound.z,
    kind: "mound",
    draw: () => {
      if(runtime.baseHouseEnabled===false)return;
      const m = runtime.gathering.mound;
      runtime.ellipse(m.x, m.z, 0.72, 0.36, m.dug ? "#533929" : "#678b3f");
      if (m.dug) {
        runtime.box3(m.x - 0.21, m.z - 0.15, 0.43, 0.3, 0.31, ["#735032", "#90663f", "#b48b5e"]);
      }
    }
  }, ...runtime.shrubs.map(t => ({
    x: t[0],
    z: t[1],
    kind: "bush",
    draw: () => runtime.bush(...t)
  })), ...baseHouseScene, ...(!runtime.inside(runtime.player.x, runtime.player.z) && !runtime.cloneInteriorAt(runtime.player.x, runtime.player.z) ? [{
    x: runtime.player.x,
    z: runtime.player.z,
    kind: "player",
    draw: () => runtime.character()
  }] : []), ...runtime.editDecor.filter(o => o.kind !== "floor" && !runtime.inside(o.x, o.z)).map(o => ({
    x: o.x,
    z: o.z,
    kind: "decor",
    draw: () => runtime.drawDecor(o)
  })), ...runtime.game.droppedItems.filter(o => !runtime.inside(o.x, o.z)).map(o => ({
    x: o.x,
    z: o.z,
    kind: "dropped",
    draw: () => runtime.drawGroundItem(o)
  })), ...(!runtime.game.items.houseKey ? [{
    x: runtime.game.groundKeys.house.x,
    z: runtime.game.groundKeys.house.z,
    kind: "key",
    draw: () => runtime.drawKey(runtime.game.groundKeys.house.x, runtime.game.groundKeys.house.z, "house")
  }] : [])];
  scene.push(...(runtime.combatEntities?.()||[]));
  scene.sort((a, b) => (a.depth ?? runtime.painterDepth(a.x, a.z)) - (b.depth ?? runtime.painterDepth(b.x, b.z)));
  for (const obj of scene) if (runtime.drawSceneEntity) runtime.drawSceneEntity(obj);else obj.draw();
  if (runtime.placingObject) {
    runtime.ctx.save();
    runtime.ctx.font = "bold 14px sans-serif";
    runtime.ctx.fillStyle = "#f8e5ab";
    runtime.ctx.textAlign = "center";
    runtime.ctx.fillText("CLIQUE PARA POSICIONAR O OBJETO  \u2022  ESC CANCELA", runtime.W / 2, runtime.H - 70);
    runtime.ctx.restore();
  }
  if (runtime.target) {
    const r = runtime.P(runtime.target.x, runtime.target.z);
    runtime.ctx.strokeStyle = "#d5ecab";
    runtime.ctx.lineWidth = 1.4;
    runtime.ctx.beginPath();
    runtime.ctx.ellipse(r[0], r[1], runtime.scale * runtime.zoom * 0.24, runtime.scale * runtime.zoom * 0.12, 0, 0, 7);
    runtime.ctx.stroke();
  }
  if (runtime.workAnimation.kind && performance.now() < runtime.workAnimation.until) {
    const progress = 1 - (runtime.workAnimation.until - performance.now()) / 600;
    const p = runtime.P(runtime.player.x, runtime.player.z, 1);
    const rad = (0.1 + Math.sin(progress * Math.PI) * 0.55) * runtime.scale * runtime.zoom;
    runtime.ctx.save();
    runtime.ctx.strokeStyle = runtime.workAnimation.kind === "axe" ? "#d8d4c8" : runtime.workAnimation.kind === "pickaxe" ? "#a2b3bf" : "#ae8551";
    runtime.ctx.lineWidth = 4;
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(p[0] - 12, p[1] + 6);
    runtime.ctx.lineTo(p[0] + Math.cos(progress * 5) * rad, p[1] - Math.sin(progress * 5) * rad);
    runtime.ctx.stroke();
    const q = runtime.P(runtime.workAnimation.x, runtime.workAnimation.z, 0.28);
    for (let i = 0; i < 6; i++) {
      runtime.ctx.fillStyle = runtime.workAnimation.kind === "shovel" ? "#876142" : runtime.workAnimation.kind === "axe" ? "#c6a16e" : "#aeb7b5";
      const angle = i * Math.PI / 3;
      runtime.ctx.fillRect(q[0] + Math.cos(angle) * progress * 21 - 2, q[1] + Math.sin(angle) * progress * 16 - 2, 4, 4);
    }
    runtime.ctx.restore();
  }
  if (runtime.handItem) {
    runtime.ctx.save();
    runtime.ctx.font = "16px system-ui";
    runtime.ctx.textAlign = "left";
    runtime.ctx.fillText("\u270B " + runtime.itemIcon(runtime.handItem.type) + " " + runtime.itemLabel(runtime.handItem.type), runtime.mouseScreen.x + 16, runtime.mouseScreen.y - 10);
    runtime.ctx.restore();
  }
}

// src/persistence/save.js

// src/persistence/save.js
export
// Casa 2: segundo pavimento integrado ao casco, não uma plataforma flutuante.
function drawUpperExterior051() { drawUpperWalls(false); }
export function drawChimneyCap051() {
  const o = runtime.chimneyObject;
  if (!o || runtime.currentHouseWidth() < 9) return;
  const x = runtime.currentHouseWidth() + .055,
    z = o.z + .02,
    w = .38,
    d = Math.max(.74, o.d * .9),
    top = 7.95;
  runtime.box3(x - .06, z - .06, w + .12, d + .12, .18, ['#685b4f', '#978572', '#c5b49b'], top - .18);
  runtime.box3(x + .05, z + .06, w - .10, d - .12, .055, ['#51443e', '#706359', '#8e8176'], top - .005);
}
