import {withMaterial} from './materials.js';
import { state as s } from '../core/state.js';
import { componentPoint, componentRect, localSize } from '../construction/components.js';
export
// src/rendering/components.js
function drawComponent(o) {return withMaterial(o.material,()=>drawComponentDetail(o));}
function drawComponentDetail(o) {
  const [w, d] = localSize(o),
    h = o.h;
  const palette = {
    wood: ["#604936", "#896545", "#c49b67"],
    plaster: ["#9c8f7a", "#bcaf96", "#e5d6ba"],
    metal: ["#344d53", "#526c70", "#94aaa5"],
    stone: ["#626863", "#858b80", "#b3b6a4"],
    brick: ["#753e32", "#a05b43", "#bb8462"],
    ceramic: ["#537985", "#83a9b1", "#c6ded6"],
    concrete: ["#555b5c", "#848d8b", "#b2b6b2"]
  };
  const colors = (palette[o.material] || palette.wood).slice();
  if (o.tint && o.tint !== "#b7a58a") colors.splice(0, 3, s.shade(o.tint, -42), s.shade(o.tint, -20), o.tint);
  const box = (x, z, bw, bd, bh, by = 0, cols = colors) => {
    const r = componentRect(o, x, z, bw, bd);
    s.box3(r.x, r.z, r.w, r.d, bh, cols, by + (o.baseY || 0));
  };
  const face = (points, color, edge) => s.quad3(...points.map(p => componentPoint(o, ...p)), color, edge);
  const line = (a, b, color, width = 1) => s.line3(componentPoint(o, ...a), componentPoint(o, ...b), color, width);
  if (o.kind === "wall") {
    const slots = (o.windowSlots || []).slice().sort((a, b) => a.u - b.u);
    let cursor = 0;
    for (const slot of slots) {
      const u = Math.max(cursor, Math.min(w, slot.u)),
        right = Math.max(u, Math.min(w, slot.u + slot.w));
      if (u > cursor + 2e-3) box(cursor, 0, u - cursor, d, h);
      const bottom = Math.max(0.4, Math.min(h - 0.5, slot.bottom || 0.85));
      const top = Math.max(bottom + 0.3, Math.min(h - 0.12, slot.top || 2.12));
      if (bottom > 0) box(u, 0, right - u, d, bottom);
      if (h - top > 0) box(u, 0, right - u, d, h - top, top);
      const frame = Math.min(0.075, (right - u) * 0.15);
      box(u, 0, frame, d, top - bottom, bottom, ["#82674b", "#a88b62", "#dfc19a"]);
      box(right - frame, 0, frame, d, top - bottom, bottom, ["#82674b", "#a88b62", "#dfc19a"]);
      box(u, 0, right - u, d, 0.065, bottom, ["#82674b", "#a88b62", "#dfc19a"]);
      box(u, 0, right - u, d, 0.065, top - 0.065, ["#82674b", "#a88b62", "#dfc19a"]);
      s.ctx.save();
      s.ctx.globalAlpha = 0.36;
      face([[u + frame, d / 2, bottom + 0.04], [right - frame, d / 2, bottom + 0.04], [right - frame, d / 2, top - 0.04], [u + frame, d / 2, top - 0.04]], "#93c7ce");
      s.ctx.restore();
      line([(u + right) / 2, d / 2, bottom], [(u + right) / 2, d / 2, top], "#ead2a2", 2);
      line([u, d / 2, (bottom + top) / 2], [right, d / 2, (bottom + top) / 2], "#ead2a2", 2);
      cursor = right;
    }
    if (w > cursor + 2e-3) box(cursor, 0, w - cursor, d, h);
    if (!slots.length) {
      for (let y = 0.28; y < h; y += 0.28) {
        line([0, -2e-3, y], [w, -2e-3, y], s.shade(colors[1], -20), 0.6);
        line([0, d + 2e-3, y], [w, d + 2e-3, y], s.shade(colors[1], -20), 0.6);
      }
      box(0, -0.015, w, d + 0.03, 0.08, 0.1);
      box(0, -0.02, w, d + 0.04, 0.09, h - 0.09);
    }
  } else if (o.kind === "door" || o.kind === "window") {
    const jamb = Math.min(0.1, w * 0.12),
      bottom = o.kind === "window" ? h * 0.4 : 0,
      top = o.kind === "window" ? h * 0.8 : h - 0.15;
    box(0, 0, jamb, d, h);
    box(w - jamb, 0, jamb, d, h);
    box(jamb, 0, w - jamb * 2, d, h - top, top);
    if (bottom) box(jamb, 0, w - jamb * 2, d, bottom);
    if (o.kind === "window") {
      s.ctx.save();
      s.ctx.globalAlpha = 0.4;
      face([[jamb, d / 2, bottom], [w - jamb, d / 2, bottom], [w - jamb, d / 2, top], [jamb, d / 2, top]], "#82bac5");
      s.ctx.restore();
      line([w / 2, d / 2, bottom], [w / 2, d / 2, top], "#d7c69e", 2);
      line([jamb, d / 2, (bottom + top) / 2], [w - jamb, d / 2, (bottom + top) / 2], "#d7c69e", 2);
      line([w * 0.25, d / 2, bottom + 0.1], [w * 0.55, d / 2, top - 0.1], "#d1f0eb", 1);
      box(0, -0.04, w, d + 0.08, 0.06, bottom);
    } else {
      const dw = w - 2 * jamb;
      if (o.open) {
        box(jamb, -dw, 0.06, dw, top - 0.03, 0, palette.wood);
        for (let i = 1; i < 5; i++) line([jamb, -dw * i / 5, 0.1], [jamb, -dw * i / 5, top - 0.1], "#362d25");
      } else {
        box(jamb, d * 0.25, dw, d * 0.5, top - 0.03, 0, palette.wood);
        for (let i = 1; i < 6; i++) line([jamb + dw * i / 6, d * 0.77, 0.08], [jamb + dw * i / 6, d * 0.77, top - 0.1], "#493a2c");
      }
      const p = s.P(...componentPoint(o, o.open ? jamb : w - jamb - 0.12, o.open ? -dw * 0.8 : d * 0.82, h * 0.44));
      s.ctx.fillStyle = "#bde9dd";
      s.ctx.beginPath();
      s.ctx.arc(p[0], p[1], 2.3 * s.zoom, 0, 7);
      s.ctx.fill();
    }
  } else if (o.kind === "stairs") {
    for (let i = 0; i < 10; i++) {
      box(0, d * i / 10, w, d / 10, h * (i + 1) / 10);
      line([0, d * i / 10, h * (i + 1) / 10], [w, d * i / 10, h * (i + 1) / 10], "#e2c69b", 1.2);
    }
    for (const x of [0.04, w - 0.04]) {
      for (let i = 0; i <= 4; i++) box(x, d * i / 4, 0.04, 0.04, 0.65, h * i / 4);
      line([x, 0, 0.65], [x, d, h + 0.65], colors[2], 3);
    }
  } else if (o.kind === "floor") {
    box(0, 0, w, d, h);
    const gridStep = o.material === 'wood' ? .22 : o.material === 'ceramic' ? .44 : o.material === 'brick' ? .34 : .65;
    for (let z = gridStep; z < d; z += gridStep) {
      line([0, z, h + .003], [w, z, h + .003], colors[0], o.material === 'wood' ? .9 : 1.5);
    }
    if (o.material !== 'wood') {
      for (let x = gridStep; x < w; x += gridStep) line([x, 0, h + .004], [x, d, h + .004], colors[0], 1.25);
    } else {
      for (let z = .22; z < d; z += .22) for (let x = .3 + Math.round(z * 10) % 2 * .6; x < w; x += 1.1) line([x, z - .2, h + .005], [x, z, h + .005], colors[0], .7);
    }
  } else if (o.kind === "roof") {
    const faces = [{
      z: d * 0.25,
      p: [[0, 0, 0], [w, 0, 0], [w, d / 2, h], [0, d / 2, h]],
      color: colors[1]
    }, {
      z: d * 0.75,
      p: [[0, d / 2, h], [w, d / 2, h], [w, d, 0], [0, d, 0]],
      color: colors[2]
    }];
    faces.sort((a, b) => {
      const x = componentPoint(o, w / 2, a.z),
        y = componentPoint(o, w / 2, b.z);
      return s.painterDepth(x[0], x[1]) - s.painterDepth(y[0], y[1]);
    });
    for (const f of faces) {
      face(f.p, f.color, colors[0]);
      for (let i = 1; i < 8; i++) {
        const z = (f.z < d / 2 ? 0 : d / 2) + d / 2 * i / 8,
          y = h * (1 - Math.abs(z - d / 2) / (d / 2));
        line([0, z, y + 6e-3], [w, z, y + 6e-3], colors[0]);
      }
    }
    line([0, d / 2, h], [w, d / 2, h], "#d0ba86", 3);
  }
}

// src/rendering/atmosphere.js

// src/rendering/atmosphere.js
