import {movementProfile} from './motion.js';
// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
import { componentBarriers, componentSupport } from '../construction/components.js';
import { isFurnitureInstance } from '../rendering/furniture.js';
import { circleFootprint, footprintDistance, footprintsOverlap } from './footprint.js';
export function circleRect(px, pz, r, o) {
  if (Number.isFinite(o.angle)) return circleFootprint(px, pz, r, o);
  const cx = runtime.clamp(px, o.x, o.x + o.w),
    cz = runtime.clamp(pz, o.z, o.z + o.d);
  return Math.hypot(px - cx, pz - cz) < r;
}
export function rectRect(a, b) {
  if (Number.isFinite(a.angle) || Number.isFinite(b.angle)) return footprintsOverlap(a, b);
  return a.x < b.x + b.w && a.x + a.w > b.x && a.z < b.z + b.d && a.z + a.d > b.z;
}
export function pushableObjects() {
  return [...runtime.fixedSolids.filter(o => o.movable), ...runtime.pushables];
}
export function blockingPushable(x, z, ignore = null) {
  for (const o of runtime.pushableObjects()) {
    if (o === ignore || o.h <= runtime.player.elevation + .12) continue;
    if (runtime.pushContact(x, z, o) && !runtime.overlapCanSeparate(x, z, o)) return o;
  }
  return null;
}
export function insideBoundsForObject(x, z, w, d) {
  const hw = runtime.currentHouseWidth();
  return x >= .012 && z >= .012 && x + w <= hw - .012 && z + d <= 4.988;
}
export function hitsInteriorWallRect(obj) {
  return runtime.rectRect(obj, {
    x: 3.6 - runtime.WALL_THICKNESS / 2 - .03,
    z: .03,
    w: runtime.WALL_THICKNESS + .06,
    d: 2.34
  }) || runtime.rectRect(obj, {
    x: 3.42,
    z: 2.26,
    w: .36,
    d: .20
  });
}
export function objectCanBeAt(o, nx, nz) {
  const test = {
    ...o,
    x: nx,
    z: nz,
    w: o.w,
    d: o.d
  };
  if (!runtime.insideBoundsForObject(nx, nz, o.w, o.d) || runtime.hitsInteriorWallRect(test)) return false;
  for (const s of runtime.fixedSolids) if (s !== o && runtime.rectRect(test, s)) return false;
  for (const other of runtime.pushables) if (other !== o && runtime.rectRect(test, other)) return false;
  return true;
}
export function rectDistance(px, pz, o) {
  if (Number.isFinite(o.angle)) return footprintDistance(px, pz, o);
  return Math.hypot(Math.max(o.x - px, 0, px - (o.x + o.w)), Math.max(o.z - pz, 0, pz - (o.z + o.d)));
}
export function pushContact(x, z, o) {
  return runtime.rectDistance(x, z, o) < runtime.player.r - .0001;
}
export function overlapCanSeparate(nx, nz, o) {
  // Ao encostar num balcão fixo ou móvel, afastar-se sempre deve ser permitido,
  // mesmo que o corpo ainda esteja alguns centímetros sobreposto.
  const oldDist = runtime.rectDistance(runtime.player.x, runtime.player.z, o);
  const newDist = runtime.rectDistance(nx, nz, o);
  return newDist > oldDist + .0001;
}
export function isPushIntent(o, dx, dz) {
  const cx = o.x + o.w / 2 - runtime.player.x,
    cz = o.z + o.d / 2 - runtime.player.z;
  const dot = cx * dx + cz * dz;
  return dot > 0 && dot / (Math.hypot(cx, cz) * Math.hypot(dx, dz) + 1e-6) > .48;
}
export function canPushTo(o, x, z, nx, nz) {
  const test = {
    ...o,
    x: nx,
    z: nz,
    w: o.w,
    d: o.d
  };
  if (!runtime.insideBoundsForObject(nx, nz, o.w, o.d) || runtime.hitsInteriorWallRect(test)) return false;
  if (runtime.fixedSolids.some(s => s !== o && !s.movable && runtime.rectRect(test, s))) return false;
  if (runtime.fixedSolids.some(s => s !== o && s.movable && runtime.rectRect(test, s))) return false;
  if (runtime.wallBarriers().some(b => runtime.rectRect(test, b))) return false;
  if (runtime.pushables.some(other => other !== o && runtime.rectRect(test, other))) return false;
  // Separamos o centro do personagem e o móvel no fim do movimento.
  return runtime.rectDistance(x, z, test) >= runtime.player.r - .015;
}
export function tryPush(o, dx, dz, nx, nz) {
  // O móvel tem de avançar NO MÍNIMO o deslocamento do jogador.
  // Acrescentar folga evita que as colisões se entrelacem por muitos quadros.
  const margin = .026;
  const vx = dx === 0 ? 0 : dx + Math.sign(dx) * margin;
  const vz = dz === 0 ? 0 : dz + Math.sign(dz) * margin;
  const ox = o.x + vx,
    oz = o.z + vz;
  if (runtime.canPushTo(o, nx, nz, ox, oz)) {
    o.x = ox;
    o.z = oz;
    return true;
  }
  return false;
}
export function canWalk(x, z, ignorePush = null) {
  if (runtime.godPhasing()) return x > -40 && x < 40 && z > -40 && z < 40;
  const r = runtime.player.r;
  if (x < -40 || x > 40 || z < -40 || z > 40) return false;
  const stepHeight = Math.max(0, ...runtime.editDecor.map(o => componentSupport(o, x, z)));
  if (stepHeight > runtime.player.elevation + .22) return false;
  const barriers = runtime.wallBarriers();
  if (barriers.some(o => runtime.circleRect(x, z, r, o))) return false;
  if (runtime.editDecor.some(o => isFurnitureInstance(o) && !o.hidden && o.h + (o.baseY || 0) > runtime.player.elevation + .12 && runtime.circleRect(x, z, r, o))) return false;
  for (const o of runtime.fixedSolids) {
    if (o === ignorePush || o.hidden) continue;
    if (o.h > runtime.player.elevation + .12 && runtime.circleRect(x, z, r, o) && !runtime.overlapCanSeparate(x, z, o)) return false;
  }
  for (const h of runtime.houseInstances()) {
    const state = runtime.ensureHouseState(h);
    for (const obj of [...state.fixed, ...state.moveable]) {
      if (obj.hidden || obj.label === 'chamine') continue;
      const rect = {
        ...obj,
        x: h.x + obj.x,
        z: h.z + obj.z,
        w: obj.w,
        d: obj.d
      };
      if (obj.h > runtime.player.elevation + .12 && runtime.circleRect(x, z, r, rect)) return false;
    }
  }
  if (!ignorePush && runtime.pushables.some(o => !o.hidden && o.h > runtime.player.elevation + .12 && runtime.pushContact(x, z, o) && !runtime.overlapCanSeparate(x, z, o))) return false;
  for (const [tx, tz, s] of runtime.foliage) if (Math.hypot(x - tx, z - tz) < .22 + .14 * s + r) return false;
  for (const [bx, bz, s] of runtime.shrubs) if (Math.hypot(x - bx, z - bz) < .1 + .09 * s + r) return false;
  return true;
}

// Saltos direcionais: alcançam móveis baixos, mas nunca atravessam paredes.
export function wallBarriers() {
  const t = runtime.WALL_THICKNESS,
    hw = runtime.currentHouseWidth();
  const b = [{
    x: -t,
    z: -t,
    w: t,
    d: 5 + 2 * t
  }, {
    x: hw,
    z: -t,
    w: t,
    d: 5 + 2 * t
  }, {
    x: 0,
    z: -t,
    w: hw,
    d: t
  }, {
    x: 0,
    z: 5,
    w: runtime.house.doorX1,
    d: t
  }, {
    x: runtime.house.doorX2,
    z: 5,
    w: hw - runtime.house.doorX2,
    d: t
  }, {
    x: 3.6 - t / 2 - .03,
    z: .03,
    w: t + .06,
    d: 2.34
  }, {
    x: 3.42,
    z: 2.26,
    w: .36,
    d: .20
  }];
  if (!runtime.game.door.open) b.push({
    x: runtime.house.doorX1,
    z: 5,
    w: runtime.house.doorX2 - runtime.house.doorX1,
    d: t
  });else b.push({
    x: runtime.house.doorX1 - runtime.DOOR_THICKNESS / 2,
    z: 3.98,
    w: runtime.DOOR_THICKNESS,
    d: 1.02
  });
  if(runtime.baseHouseEnabled===false)b.length=0;
  for (const h of runtime.houseInstances()) {
    const state = runtime.ensureHouseState(h),
      ww = runtime.isHouseTwo(h) ? 10 : 7;
    const frame = [{
      x: -t,
      z: -t,
      w: t,
      d: 5 + 2 * t
    }, {
      x: ww,
      z: -t,
      w: t,
      d: 5 + 2 * t
    }, {
      x: 0,
      z: -t,
      w: ww,
      d: t
    }, {
      x: 0,
      z: 5,
      w: runtime.house.doorX1,
      d: t
    }, {
      x: runtime.house.doorX2,
      z: 5,
      w: ww - runtime.house.doorX2,
      d: t
    }, {
      x: 3.6 - t / 2 - .03,
      z: .03,
      w: t + .06,
      d: 2.34
    }, {
      x: 3.42,
      z: 2.26,
      w: .36,
      d: .20
    }];
    for (const wall of frame) b.push({
      x: h.x + wall.x,
      z: h.z + wall.z,
      w: wall.w,
      d: wall.d
    });
    if (!state.door.open) b.push({
      x: h.x + runtime.house.doorX1,
      z: h.z + 5,
      w: runtime.house.doorX2 - runtime.house.doorX1,
      d: t
    });else b.push({
      x: h.x + runtime.house.doorX1 - runtime.DOOR_THICKNESS / 2,
      z: h.z + 3.98,
      w: runtime.DOOR_THICKNESS,
      d: 1.02
    });
  }
  for (const o of runtime.editDecor) if ((o.baseY || 0) < runtime.player.elevation + 1.4 && (o.baseY || 0) + o.h > runtime.player.elevation + .05) b.push(...componentBarriers(o));
  return b;
}
export function supportHeight(x, z) {
  const supports = runtime.player.jump ? [...runtime.fixedSolids.filter(o => o.h < .9), ...runtime.pushables] : [];
  let h = 0;
  for (const o of supports) if (x > o.x + .05 && x < o.x + o.w - .05 && z > o.z + .05 && z < o.z + o.d - .05) h = Math.max(h, o.h);
  for (const o of runtime.editDecor) h = Math.max(h, componentSupport(o, x, z));
  return h;
}
export function jumpAllowedPoint(x, z) {
  if (runtime.godPhasing()) return x > -60 && x < 60 && z > -60 && z < 60;
  if (x < -60 || x > 60 || z < -60 || z > 60) return false;
  if (runtime.wallBarriers().some(b => runtime.circleRect(x, z, runtime.player.r, b))) return false;
  if (runtime.fixedSolids.some(o => o.h > 1 && runtime.circleRect(x, z, runtime.player.r, o))) return false;
  for (const [tx, tz, r] of runtime.foliage) if (Math.hypot(x - tx, z - tz) < .22 + .14 * r + runtime.player.r) return false;
  return true;
}
export function startJump(dx, dz, distance = null) {
  if (runtime.player.jump || runtime.dialog.classList.contains('open') || runtime.helpOpen) return false;
  const mag = Math.hypot(dx, dz);
  if (mag < .1) return false;
  dx /= mag;
  dz /= mag;
  let jumpLen = distance === null ? 1.22 : runtime.clamp(distance, .35, 1.42);
  // O comando direcional procura uma superfície baixa à frente antes de saltar por cima dela.
  if (distance === null) {
    const candidates = [...runtime.fixedSolids.filter(o => o.h <= .85), ...runtime.pushables].map(o => {
      const cx = o.x + o.w / 2,
        cz = o.z + o.d / 2,
        xx = cx - runtime.player.x,
        zz = cz - runtime.player.z;
      return {
        distance: Math.hypot(xx, zz),
        forward: xx * dx + zz * dz,
        side: Math.abs(xx * dz - zz * dx)
      };
    }).filter(o => o.forward > .32 && o.forward < 1.42 && o.side < .3 && o.distance < 1.48).sort((a, b) => a.distance - b.distance);
    if (candidates.length) jumpLen = candidates[0].forward;
  }
  const ex = runtime.player.x + dx * jumpLen,
    ez = runtime.player.z + dz * jumpLen;
  const steps = Math.max(24, Math.ceil(Math.hypot(ex - runtime.player.x, ez - runtime.player.z) / .035));
  const startInside = runtime.inside(runtime.player.x, runtime.player.z),
    endInside = runtime.inside(ex, ez);
  // Saltos não podem cruzar limites da casa, nem mesmo tangenciando a parede.
  if (startInside !== endInside) {
    runtime.toast('Você não pode saltar através de uma parede.');
    return false;
  }
  for (let i = 1; i <= steps; i++) {
    const x = runtime.player.x + (ex - runtime.player.x) * i / steps,
      z = runtime.player.z + (ez - runtime.player.z) * i / steps;
    if (!runtime.jumpAllowedPoint(x, z)) {
      runtime.toast('O salto está bloqueado por uma parede ou obstáculo alto.');
      return false;
    }
  }
  const endHeight = runtime.supportHeight(ex, ez);
  if (endHeight > runtime.player.elevation + .85) {
    runtime.toast('É alto demais para pular.');
    return false;
  }
  runtime.player.jump = {
    t: 0,
    duration: .62,
    sx: runtime.player.x,
    sz: runtime.player.z,
    sy: runtime.player.elevation,
    ex,
    ez,
    ey: endHeight
  };
  runtime.player.faceX = dx;
  runtime.player.faceY = dz;
  runtime.target = null;
  runtime.game.pending = null;
  return true;
}
export function startHop() {
  if (runtime.player.jump || runtime.dialog.classList.contains('open') || runtime.helpOpen) return false;
  runtime.player.jump = {
    t: 0,
    duration: .42,
    sx: runtime.player.x,
    sz: runtime.player.z,
    sy: runtime.player.elevation,
    ex: runtime.player.x,
    ez: runtime.player.z,
    ey: runtime.player.elevation
  };
  runtime.target = null;
  runtime.game.pending = null;
  return true;
}
export function tickJump(dt) {
  const j = runtime.player.jump;
  if (!j) return;
  j.t = Math.min(1, j.t + dt / j.duration);
  // Movimento balístico aproximado: duas parábolas combinadas.
  const p = j.t;
  const nextX = j.sx + (j.ex - j.sx) * p,
    nextZ = j.sz + (j.ez - j.sz) * p;
  // Revalidar cada quadro: a parede ou um móvel pode ter mudado durante o salto.
  if (!runtime.jumpAllowedPoint(nextX, nextZ) || runtime.inside(j.sx, j.sz) !== runtime.inside(nextX, nextZ)) {
    runtime.player.x = j.sx;
    runtime.player.z = j.sz;
    runtime.player.elevation = j.sy;
    runtime.player.jumpY = 0;
    runtime.player.jump = null;
    runtime.target = null;
    runtime.toast('Salto interrompido: passagem bloqueada.');
    return;
  }
  runtime.player.x = nextX;
  runtime.player.z = nextZ;
  runtime.player.elevation = j.sy + (j.ey - j.sy) * p;
  runtime.player.jumpY = Math.sin(Math.PI * p) * .96;
  if (j.t >= 1) {
    runtime.player.elevation = j.ey;
    runtime.player.jumpY = 0;
    runtime.player.jump = null;
  }
}
export function rescueFromOverlap() {
  if (runtime.godPhasing()) return;
  // Corrige interseções antigas do salvamento ou móveis deslocados pelo editor.
  const solids = [...runtime.fixedSolids.filter(o => !o.hidden && o.h > .28), ...runtime.pushables.filter(o => !o.hidden && o.h > .28)];
  const trapped = solids.some(o => runtime.circleRect(runtime.player.x, runtime.player.z, runtime.player.r * .60, o)) || runtime.wallBarriers().some(b => runtime.circleRect(runtime.player.x, runtime.player.z, runtime.player.r * .60, b));
  if (!trapped || runtime.player.jump) return;
  const ox = runtime.player.x,
    oz = runtime.player.z;
  for (const radius of [.15, .3, .45, .6, .8, 1.05]) {
    for (let i = 0; i < 24; i++) {
      const theta = i * Math.PI / 12,
        cx = ox + radius * Math.cos(theta),
        cz = oz + radius * Math.sin(theta);
      if (runtime.inside(cx, cz) !== runtime.inside(ox, oz)) continue;
      if (runtime.canWalk(cx, cz) && !solids.some(o => runtime.circleRect(cx, cz, runtime.player.r, o))) {
        runtime.player.x = cx;
        runtime.player.z = cz;
        runtime.target = null;
        return;
      }
    }
  }
}
export
// src/persistence/save.js

function move(dx, dz, dt) {
  if (runtime.player.jump) return;
  let mag = Math.hypot(dx, dz);
  if (mag < 0.01) return;
  dx /= mag;
  dz /= mag;
  const profile = movementProfile();
  runtime.sprinting = profile.sprint;
  const speed = profile.speed * dt;
  const startX = runtime.player.x, startZ = runtime.player.z;
  if (runtime.sprinting && !runtime.godMode()) runtime.fatigue = Math.max(0, runtime.fatigue - dt * (3.3 + Math.max(0, 12 - runtime.SHEETS.traveler.CON) * .5));
  const tryAxis = (stepX, stepZ) => {
    const nx = runtime.player.x + stepX,
      nz = runtime.player.z + stepZ;
    if (runtime.godPhasing()) {
      runtime.player.x = nx;
      runtime.player.z = nz;
      runtime.player.elevation = 0;
      return true;
    }
    const wallSteps = Math.max(1, Math.ceil(Math.hypot(stepX, stepZ) / 0.055));
    for (let i = 1; i <= wallSteps; i++) {
      const t = i / wallSteps;
      if (runtime.wallBarriers().some(w => runtime.circleRect(runtime.player.x + stepX * t, runtime.player.z + stepZ * t, runtime.player.r, w))) return false;
    }
    const free = runtime.canWalk(nx, nz);
    if (free) {
      runtime.player.x = nx;
      runtime.player.z = nz;
      runtime.player.elevation = runtime.supportHeight(nx, nz);
      return true;
    }
    const obj = runtime.blockingPushable(nx, nz);
    if (!obj || !runtime.inside(nx, nz) || !runtime.isPushIntent(obj, stepX, stepZ)) return false;
    if (!runtime.keys.has("shift")) return false;
    const oldX = obj.x,
      oldZ = obj.z;
    if (!runtime.tryPush(obj, stepX, stepZ, nx, nz)) return false;
    if (!runtime.canWalk(nx, nz, obj)) {
      obj.x = oldX;
      obj.z = oldZ;
      return false;
    }
    runtime.player.x = nx;
    runtime.player.z = nz;
    runtime.player.elevation = runtime.supportHeight(nx, nz);
    runtime.scheduleFurnitureSave();
    return true;
  };
  if (Math.abs(dx * speed) > 0) tryAxis(dx * speed, 0);
  if (Math.abs(dz * speed) > 0) tryAxis(0, dz * speed);
  const moved = Math.hypot(runtime.player.x-startX,runtime.player.z-startZ)>1e-6;
  if(moved) runtime.player.step += dt * 10;
  runtime.player.dir = dx >= 0 ? 1 : -1;
  const desired = Math.atan2(dz, dx),
    current = Math.atan2(runtime.player.faceY, runtime.player.faceX);
  let diff = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
  let angle = current + diff * Math.min(1, dt * 15);
  runtime.player.faceX = Math.cos(angle);
  runtime.player.faceY = Math.sin(angle);
  runtime.walking = moved;
}
export function worldAt(mx, my) {
  const u = (mx - runtime.W * .5) / (runtime.scale * .87 * runtime.zoom),
    v = (my - runtime.H * .56) / (runtime.scale * .45 * runtime.zoom);
  const [x, z] = runtime.unrotate((u + v) / 2, (v - u) / 2);
  return {
    x: x + runtime.camX,
    z: z + runtime.camZ
  };
}
