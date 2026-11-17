import {state} from '../core/state.js';
import {COMPONENTS,createComponent,componentPoint} from './components.js';
import {sceneTransaction} from './inspector.js';
import {isFurnitureInstance} from '../rendering/furniture.js';
import {localSize} from './components.js';
import {footprintsOverlap} from '../physics/footprint.js';

export
// Orla v0.48: ferramenta fantasma de posicionamento e janelas em paredes existentes.
function installPlacementPreview() {
  const overlay = document.getElementById('placementPreview'),
    hint = document.getElementById('placementHelp');
  const cx = overlay.getContext('2d');
  let cursor = {
      x: innerWidth / 2,
      y: innerHeight / 2
    },
    angle = 0,
    previousMode = null;
  const shapeDefaults = {
    tree: [.5, .5, 2.4],
    shrub: [.45, .45, .4],
    stone: [.65, .55, .5],
    house1: [7, 5, 3.1],
    house2: [10, 5, 3.1],
    table: [1.15, .7, .65],
    chair: [.5, .5, .8],
    bed: [1.5, .9, .4],
    chest: [.9, .7, .55],
    shelf: [.65, 1.4, 1.9],
    barrel: [.5, .5, .8],
    lamp: [.25, .25, 1.3]
  };
  const collide = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w > b.x - pad && a.z < b.z + b.d + pad && a.z + a.d > b.z - pad;
  const norm = k => k === 'create' || k === 'move' || k === 'component';
  const originalPlace = state.editPlaceAt;
  function wallSlotAt(p) {
    let best = null;
    for (const o of state.editDecor) {
      if (o.hidden || !o.component || o.kind !== 'wall') continue;
      const long = Math.max(o.w, o.d),
        len = Math.min(1.05, long - .25);
      if (len < .4) continue;
      const longX = o.w >= o.d,
        along = longX ? p.x - o.x : p.z - o.z;
      const perpendicular = longX ? Math.abs(p.z - o.z - o.d / 2) : Math.abs(p.x - o.x - o.w / 2);
      if (perpendicular > .55 || along < .12 || along > long - .12) continue;
      const raw = Math.max(.08, Math.min(long - len - .08, along - len / 2));
      const r = ((o.rot || 0) % 4 + 4) % 4;
      const u = longX && r === 2 || !longX && r === 3 ? long - raw - len : raw;
      const overlaps = (o.windowSlots || []).some(s => u < s.u + s.w + .08 && u + len > s.u - .08);
      const option = {
        wall: o,
        u,
        w: len,
        bottom: .86,
        top: Math.min(o.h - .14, 2.13),
        valid: !overlaps,
        score: perpendicular
      };
      if (!best || option.score < best.score) best = option;
    }
    // A casa original também é uma parede existente: abrir um vão real.
    const hw = state.currentHouseWidth();
    const sides = [{
      side: 'north',
      p: p.z,
      u: p.x,
      length: hw
    }, {
      side: 'south',
      p: 5 - p.z,
      u: p.x,
      length: hw
    }, {
      side: 'west',
      p: p.x,
      u: p.z,
      length: 5
    }, {
      side: 'east',
      p: hw - p.x,
      u: p.z,
      length: 5
    }];
    for (const q of sides) {
      if (Math.abs(q.p) > .48 || q.u < .25 || q.u > q.length - .25) continue;
      const width = Math.min(1, q.length - .5),
        start = Math.max(.1, Math.min(q.length - width - .1, q.u - width / 2));
      const defaults = q.side === 'north' ? [[2, 2.9]] : q.side === 'south' ? [[1.1, 1.8], [3.05, 4.23]] : q.side === 'west' ? [[1.95, 2.83]] : [];
      const reserved = [...defaults, ...(state.game.addedWindows || []).filter(o => o.side === q.side).map(o => [o.u, o.u + o.w])];
      const valid = !reserved.some(([a, b]) => start < b + .1 && start + width > a - .1);
      const option = {
        side: q.side,
        u: start,
        w: width,
        bottom: 1.24,
        top: 2.17,
        valid,
        score: Math.abs(q.p)
      };
      if (!best || option.score < best.score) best = option;
    }
    return best;
  }
  function previewAt() {
    if (!state.editMode || !state.editPlacing || !norm(state.editPlacing.kind)) return null;
    let p;
    try {
      p = state.worldAt(cursor.x, cursor.y);
    } catch (_) {
      return null;
    }
    const e = state.editPlacing,
      selectedKind = state.selected?.kind || {
        mesa: 'table',
        cama: 'bed',
        bau: 'chest',
        armario: 'shelf',
        luminaria: 'lamp',
        banquinho: 'chair'
      }[state.selected?.label],
      k = e.kind === 'component' ? e.item : e.kind === 'create' ? e.item : selectedKind;
    if (!k && e.kind !== 'move') return null;
    if (e.kind === 'component' && e.item === 'window') {
      const slot = wallSlotAt(p);
      return {
        type: 'window',
        slot,
        ok: !!slot?.valid,
        reason: slot ? 'Janela deve ocupar um vão livre.' : 'Aproxime o cursor de uma parede existente.'
      };
    }
    const source = e.kind === 'move' ? state.selected : null;
    if (e.kind === 'move' && !source) return null;
    const dims = source ? [...localSize(source),source.h] : e.kind === 'component' ? COMPONENTS[k] ? [COMPONENTS[k].w, COMPONENTS[k].d, COMPONENTS[k].h] : null : shapeDefaults[k];
    if (!dims) return null;
    const [w, d, h] = dims;
    let a = angle;
    if (source && previousMode !== e) a = Number(source.angle) || (source.rot || 0) * 90;
    const theta = a * Math.PI / 180,
      bw = Math.abs(w * Math.cos(theta)) + Math.abs(d * Math.sin(theta)),
      bd = Math.abs(w * Math.sin(theta)) + Math.abs(d * Math.cos(theta));
    const rect = {
      x: p.x - bw / 2,
      z: p.z - bd / 2,
      w: bw,
      d: bd
    };
    const boundary = rect.x > -40 && rect.z > -40 && rect.x + rect.w < 40 && rect.z + rect.d < 40;
    const obstacles = [...state.editDecor, ...state.fixedSolids, ...state.pushables].filter(o => o !== source && !o.hidden && o.kind !== 'floor' && o.kind !== 'roof');
    const candidate={x:p.x-w/2,z:p.z-d/2,w,d,angle:a,rot:0};
    const surface=['floor','roof'].includes(k);
    const blocked = !surface&&(obstacles.some(o => footprintsOverlap(candidate,o,.02)) || Math.abs(p.x - state.player.x) < bw / 2 + .20 && Math.abs(p.z - state.player.z) < bd / 2 + .20 || isFurnitureInstance({kind:k})&&state.wallBarriers().some(o=>footprintsOverlap(candidate,o,.01)));
    const houseOverlap = rect.x < 10.02 && rect.x + rect.w > -.02 && rect.z < 5.02 && rect.z + rect.d > -.02;
    const isStructure = ['house1', 'house2'].includes(k);
    const allowedHouse = isStructure ? !houseOverlap && !state.houseInstances().some(o => collide(rect, o, .2)) : true;
    const insideHouse = p.x > 0 && p.x < 10 && p.z > 0 && p.z < 5;
    const allowedPosition = isStructure || e.kind === 'component' || k === 'tree' || k === 'shrub' || k === 'stone' || insideHouse || !houseOverlap;
    const ok = boundary && !blocked && allowedHouse && allowedPosition && (!source || state.role === 'god' || state.canEditSelected(source));
    return {
      type: 'object',
      kind: k,
      rect,
      w,
      d,
      h,
      angle: a,
      baseY:source?.baseY||0,
      center: p,
      source,
      ok,
      reason: !boundary ? 'Fora dos limites.' : blocked ? 'Posição ocupada.' : !allowedHouse ? 'Não é possível sobrepor casas.' : 'Posição inválida.'
    };
  }
  function projected(x, z, y = 0) {
    return state.P(x, z, y);
  }
  function drawPoly(points, color, stroke) {
    cx.beginPath();
    points.forEach((p, i) => {
      const q = projected(...p);
      if (i) cx.lineTo(...q);else cx.moveTo(...q);
    });
    cx.closePath();
    cx.fillStyle = color;
    cx.fill();
    cx.strokeStyle = stroke;
    cx.lineWidth = 1.6;
    cx.stroke();
  }
  function ghost(pre) {
    const valid = pre.ok,
      fill = valid ? 'rgba(49,143,234,.32)' : 'rgba(235,53,73,.35)',
      edge = valid ? '#80d5ff' : '#ff7786';
    if (pre.type === 'window') {
      if (!pre.slot) {
        hint.textContent = '🪟 Aponte para uma parede existente · Esc cancela';
        return;
      }
      const {
        wall,
        u,
        w,
        bottom,
        top,
        side
      } = pre.slot;
      const wp = (v, y) => side === 'north' ? [v, 0, y] : side === 'south' ? [v, 5, y] : side === 'west' ? [0, v, y] : [state.currentHouseWidth(), v, y];
      const a = wall ? componentPoint(wall, u, wall.d / 2, bottom) : wp(u, bottom),
        b = wall ? componentPoint(wall, u + w, wall.d / 2, bottom) : wp(u + w, bottom),
        c = wall ? componentPoint(wall, u + w, wall.d / 2, top) : wp(u + w, top),
        d = wall ? componentPoint(wall, u, wall.d / 2, top) : wp(u, top);
      drawPoly([a, b, c, d], fill, edge);
      hint.textContent = pre.ok ? '🪟 Janela na parede · Clique para abrir o vão · Esc cancela' : '🪟 Outro vão ocupa esse trecho';
      return;
    }
    const {
      center,
      w,
      d,
      h,
      angle: a
    } = pre;
    const c = Math.cos(a * Math.PI / 180),
      sn = Math.sin(a * Math.PI / 180);
    const pt = (xx, zz, yy) => [center.x + xx * c - zz * sn, center.z + xx * sn + zz * c, yy+(pre.baseY||0)];
    const v = [pt(-w / 2, -d / 2, 0), pt(w / 2, -d / 2, 0), pt(w / 2, d / 2, 0), pt(-w / 2, d / 2, 0)];
    const upper = v.map(q => [q[0], q[1], h]);
    drawPoly([v[0], v[1], upper[1], upper[0]], fill, edge);
    drawPoly([v[1], v[2], upper[2], upper[1]], fill, edge);
    drawPoly([v[2], v[3], upper[3], upper[2]], fill, edge);
    drawPoly(upper, fill, edge);
    // Além do volume de colocação, reproduz o móvel em transparência na posição proposta.
    if (['table', 'bed', 'chest', 'shelf', 'lamp', 'chair', 'barrel'].includes(pre.kind)) {
      const model = {
        kind: pre.kind,
        x: center.x - w / 2,
        z: center.z - d / 2,
        w,
        d,
        h,
        angle: a,
        rot: 0,
        material: 'wood',
        tint: '#b7a58a',
        contents: []
      };
      const oldCtx = state.ctx;
      try {
        state.ctx = cx;
        cx.save();
        cx.globalAlpha = .56;
        cx.filter = valid ? 'sepia(.25) saturate(1.2) hue-rotate(150deg)' : 'sepia(.3) saturate(1.6) hue-rotate(300deg)';
        state.drawDecor(model);
      } catch (err) {
        if (!state._placementDrawWarned) {
          state._placementDrawWarned = true;
          console.warn('Prévia do móvel simplificada:', err);
        }
      } finally {
        cx.restore();
        state.ctx = oldCtx;
      }
    }
    const label = {
      shelf: 'Estante',
      table: 'Mesa',
      bed: 'Cama',
      chest: 'Baú',
      window: 'Janela',
      wall: 'Parede'
    }[pre.kind] || pre.kind;
    hint.textContent = (valid ? '🔵 ' : '🔴 ') + label + ' · ' + Math.round(a) + '° · ← → giram ' + (state.editPlacing?.kind === 'component' || pre.source?.component ? '90°' : '15°') + ' · Clique confirma · Esc cancela' + (valid ? '' : ' · ' + pre.reason);
  }
  function loop() {
    const ratio = Math.min(devicePixelRatio || 1, 2),
      sw = innerWidth,
      sh = innerHeight;
    if (overlay.width !== Math.round(sw * ratio) || overlay.height !== Math.round(sh * ratio)) {
      overlay.width = Math.round(sw * ratio);
      overlay.height = Math.round(sh * ratio);
    }
    cx.setTransform(ratio, 0, 0, ratio, 0, 0);
    cx.clearRect(0, 0, sw, sh);
    const mode = state.editPlacing;
    if (mode !== previousMode) {
      angle = mode?.angle ?? (mode?.kind === 'move' ? state.selected?.angle ?? (state.selected?.rot||0)*90 : 0);
      previousMode = mode;
    }
    const pre = previewAt();
    hint.classList.toggle('active', !!pre);
    if (pre) ghost(pre);
    requestAnimationFrame(loop);
  }
  state.canvas.addEventListener('pointermove', e => {
    cursor = {
      x: e.clientX,
      y: e.clientY
    };
  }, {
    passive: true
  });
  window.addEventListener('keydown', e => {
    if (!state.editMode || !state.editPlacing || !norm(state.editPlacing.kind)) return;
    if (e.target instanceof HTMLElement && e.target.matches('input,select,textarea')) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if(['house1','house2'].includes(state.editPlacing.item||state.selected?.kind))return state.toast('A posição da casa pode mudar; sua rotação completa ainda não está habilitada.');
      const step = state.editPlacing.kind === 'component' || state.editPlacing.kind === 'move' && state.selected?.component ? 90 : 15;
      angle = (angle + (e.key === 'ArrowRight' ? step : -step) + 360) % 360;
      state.editPlacing.angle = angle;
    }
    if (e.key === 'Escape') {
      angle = 0;
      hint.classList.remove('active');
    }
  }, true);
  // Capture before the legacy click handler to prevent invalid placement.
  state.canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !state.editMode || !state.editPlacing) return;
    cursor={x:e.clientX,y:e.clientY};
    const pre = previewAt();
    if (!pre) return;
    if (!pre.ok) {
      e.stopImmediatePropagation();
      state.toast(pre.reason || 'Posição bloqueada');
      return;
    }
  }, true);
  state.editPlaceAt = (mx, my) => {
    const e = state.editPlacing;
    if (!e || !norm(e.kind)) return originalPlace(mx, my);
    cursor = {
      x: mx,
      y: my
    };
    const pre = previewAt();
    if (!pre || !pre.ok) {
      state.toast(pre?.reason || 'Posição inválida');
      return true;
    }
    if (pre.type === 'window') {
      const {
        wall,
        u,
        w,
        bottom,
        top,
        side
      } = pre.slot;
      sceneTransaction(() => {
        if (wall) {
          wall.windowSlots = wall.windowSlots || [];
          wall.windowSlots.push({
            u,
            w,
            bottom,
            top
          });
        } else {
          state.game.addedWindows = state.game.addedWindows || [];
          state.game.addedWindows.push({
            side,
            u,
            w,
            bottom,
            top
          });
        }
      });
      state.selected = wall || null;
      state.editPlacing = null;
      state.saveGame();
      state.renderEditor();
      state.toast('Janela aberta na parede existente.');
      return true;
    }
    const kind = e.kind;
    if (kind === 'component') {
      const o = createComponent(e.item, pre.center.x, pre.center.z, crypto.randomUUID());
      const turns = (Math.round(angle / 90) % 4 + 4) % 4;
      if (turns % 2) {
        const oldW = o.w;
        o.w = o.d;
        o.d = oldW;
        o.x = pre.center.x - o.w / 2;
        o.z = pre.center.z - o.d / 2;
      }
      o.rot = turns;
      state.editDecor.push(o);
      state.selected = o;
      state.editPlacing = null;
      state.saveGame();
      state.renderEditor();
      return true;
    }
    if (kind === 'move') {
      const o = state.selected;
      if (!o) return true;
      const r = originalPlace(mx, my);
      if (!state.editPlacing) {
        if (o.component) {
          const oldTurn = ((o.rot || 0) % 4 + 4) % 4,
            newTurn = (Math.round(angle / 90) % 4 + 4) % 4;
          const cx = o.x + o.w / 2,
            cz = o.z + o.d / 2;
          if (oldTurn % 2 !== newTurn % 2) {
            const tmp = o.w;
            o.w = o.d;
            o.d = tmp;
          }
          o.x = cx - o.w / 2;
          o.z = cz - o.d / 2;
          o.rot = newTurn;
        } else o.angle = angle;
        state.saveGame();
      }
      return r;
    }
    const before = new Set(state.editDecor);
    const r = originalPlace(mx, my);
    if (!state.editPlacing) {
      const created = state.editDecor.find(o => !before.has(o));
      if (created && isFurnitureInstance(created)) {
        created.angle = angle;
        created.rot = 0;
        state.saveGame();
      }
    }
    return r;
  };
  const placeWithHistory=state.editPlaceAt;
  state.editPlaceAt=(...args)=>sceneTransaction(()=>placeWithHistory(...args));
  state.placementPreview=previewAt;
  requestAnimationFrame(loop);
}
