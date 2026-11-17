// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
import { instantiateHouse } from './models.js';
import { drawComponent } from '../rendering/components.js';
import { isFurnitureInstance, drawFurnitureInstance } from '../rendering/furniture.js';
export function isHouseTwo(o) {
  return !!o && o.kind === 'house2';
}
export function annexActive() {
  return runtime.isHouseTwo(runtime.houseContext) || !runtime.houseContext && runtime.useHouseTwoBase;
}
export function currentHouseWidth() {
  return runtime.annexActive() ? 10 : 7;
}
export
// Casa 1 instanciável: transforma o mesmo modelo visual em uma unidade navegável.
function houseInstances() {
  return runtime.editDecor.filter(o => (o.kind === 'house1' || o.kind === 'house2') && !o.hidden);
}
export function captureHouseBlueprint(kind = 'house1') {
  return JSON.parse(JSON.stringify(runtime.houseModels[kind] || runtime.houseModels.house1));
}
export function cloneInteriorAt(x, z) {
  return runtime.houseInstances().find(o => x > o.x + .12 && x < o.x + ((runtime.isHouseTwo(o) ? 10 : 7) - .12) && z > o.z + .12 && z < o.z + 4.88) || null;
}
export function ensureHouseState(o) {
  if (o.interior && o.interior.fixed && o.interior.door) return o.interior;
  if (!o.snapshot || o.modelVersion === 1) {
    o.interior = instantiateHouse(runtime.houseModels[o.kind] || runtime.houseModels.house1);
    return o.interior;
  }
  const seed = o.snapshot || runtime.captureHouseBlueprint();
  const fixed = seed.fixed.map(v => ({
    ...v
  }));
  const moveable = seed.moveable.map(v => ({
    ...v
  }));
  o.interior = {
    door: {
      locked: false,
      open: false
    },
    chest: {
      locked: false,
      open: false
    },
    fixed,
    moveable,
    stores: {
      chest: [],
      drawerTop: [],
      drawerBottom: [],
      deskTop: [],
      table: ['apple', 'cup', 'mug'],
      bed: [],
      shelf: [...(seed.shelf || [])],
      floor: seed.rug?.placed ? ['rug'] : [],
      inventory: []
    },
    drawerOpen: [false, false],
    rug: {
      ...(seed.rug || {
        x: .45,
        z: 1.8,
        placed: true
      })
    },
    lamps: [true, true],
    droppedItems: [],
    shelfRows: [...(seed.shelfRows || [2, 2, 2])],
    fireplace: {
      wood: 0,
      lit: false,
      burn: 0
    }
  };
  if (runtime.isHouseTwo(o)) {
    const byLabel = (arr, lbl, idx = 0) => arr.filter(v => v.label === lbl)[idx] || null;
    const desk = byLabel(fixed, 'escrivaninha'),
      ward = byLabel(fixed, 'armario'),
      chim = byLabel(fixed, 'chamine'),
      bed = byLabel(fixed, 'cama'),
      chest = byLabel(fixed, 'bau');
    const lampA = byLabel(fixed, 'luminaria', 0),
      lampB = byLabel(fixed, 'luminaria', 1),
      table = byLabel(moveable, 'mesa'),
      stool = byLabel(moveable, 'banquinho');
    if (chim) Object.assign(chim, {
      x: 9.56,
      z: 1.22,
      w: .42,
      d: .92,
      h: 2.74
    });
    if (ward) Object.assign(ward, {
      x: 9.02,
      z: .36,
      w: .74,
      d: 1.56,
      h: 1.95
    });
    if (desk) Object.assign(desk, {
      x: 4.62,
      z: 4.08,
      w: 1.2,
      d: .72,
      h: .66,
      rot: 0
    });
    if (chest) Object.assign(chest, {
      x: 8.18,
      z: 3.10,
      w: .96,
      d: .66,
      h: .54,
      rot: 2
    });
    if (table) Object.assign(table, {
      x: 5.62,
      z: .46,
      w: 1.12,
      d: .58,
      h: .58,
      rot: 0
    });
    if (stool) Object.assign(stool, {
      x: 5.96,
      z: 1.12,
      w: .42,
      d: .42,
      h: .42,
      rot: 0
    });
    if (bed) Object.assign(bed, {
      x: .18,
      z: 3.84,
      w: 1.6,
      d: .92,
      h: .35,
      rot: 0
    });
    if (lampA) Object.assign(lampA, {
      x: .78,
      z: 2.18
    });
    if (lampB) Object.assign(lampB, {
      x: 8.68,
      z: 2.44
    });
  }
  return o.interior;
}
export function withHouseInstance(o, callback) {
  if (runtime.houseContext) return callback();
  const h = runtime.ensureHouseState(o);
  const before = {
    houseFinish:runtime.houseFinish,baseFloorFinish:runtime.baseFloorFinish,
    camX: runtime.camX,
    camZ: runtime.camZ,
    playerX: runtime.player.x,
    playerZ: runtime.player.z,
    door: runtime.game.door,
    chest: runtime.game.chest,
    stores: runtime.game.stores,
    drawerOpen: runtime.game.drawerOpen,
    rug: runtime.game.rug,
    lamps: runtime.game.lamps,
    droppedItems: runtime.game.droppedItems,
    doorSwing: runtime.doorSwing,
    items: runtime.game.items,
    fireplace: runtime.game.fireplace,
    addedWindows: runtime.game.addedWindows,
    shelfRows: [...runtime.shelfRows],
    fixed: runtime.fixedSolids.map(v => ({
      ...v
    })),
    moveable: runtime.pushables.map(v => ({
      ...v
    }))
  };
  runtime.houseContext = o;
  runtime.houseFinish=h.houseFinish||null;runtime.baseFloorFinish=h.baseFloorFinish||null;
  try {
    runtime.camX -= o.x;
    runtime.camZ -= o.z;
    runtime.player.x -= o.x;
    runtime.player.z -= o.z;
    runtime.fixedSolids.forEach((v, i) => Object.assign(v, h.fixed[i] || {}));
    runtime.pushables.forEach((v, i) => Object.assign(v, h.moveable[i] || {}));
    runtime.game.door = h.door;
    runtime.game.chest = h.chest;
    runtime.game.stores = h.stores;
    runtime.game.addedWindows = h.addedWindows || (h.addedWindows = []);
    runtime.game.stores.inventory = before.stores.inventory;
    runtime.game.drawerOpen = h.drawerOpen;
    runtime.game.rug = h.rug;
    runtime.game.lamps = h.lamps;
    runtime.game.droppedItems = h.droppedItems;
    runtime.game.fireplace = h.fireplace || (h.fireplace = {
      wood: 0,
      lit: false
    });
    runtime.game.items = {
      ...before.items,
      chestKey: true
    };
    runtime.doorSwing = h.door.open ? 1 : 0;
    for (let i = 0; i < 3; i++) runtime.shelfRows[i] = h.shelfRows[i] || 0;
    return callback();
  } finally {
    h.houseFinish=runtime.houseFinish;h.baseFloorFinish=runtime.baseFloorFinish;
    runtime.houseFinish=before.houseFinish;runtime.baseFloorFinish=before.baseFloorFinish;
    h.fixed = runtime.fixedSolids.map(v => ({
      ...v
    }));
    h.moveable = runtime.pushables.map(v => ({
      ...v
    }));
    h.door = runtime.game.door;
    h.chest = runtime.game.chest;
    h.stores = runtime.game.stores;
    h.stores.inventory = [];
    h.drawerOpen = runtime.game.drawerOpen;
    h.rug = runtime.game.rug;
    h.lamps = runtime.game.lamps;
    h.droppedItems = runtime.game.droppedItems;
    h.shelfRows = [...runtime.shelfRows];
    h.fireplace = runtime.game.fireplace;
    h.addedWindows = runtime.game.addedWindows;
    runtime.fixedSolids.forEach((v, i) => {
      for (const key of Object.keys(v)) delete v[key];
      Object.assign(v, before.fixed[i]);
    });
    runtime.pushables.forEach((v, i) => {
      for (const key of Object.keys(v)) delete v[key];
      Object.assign(v, before.moveable[i]);
    });
    runtime.camX = before.camX;
    runtime.camZ = before.camZ;
    runtime.player.x = before.playerX;
    runtime.player.z = before.playerZ;
    runtime.game.door = before.door;
    runtime.game.chest = before.chest;
    runtime.game.stores = before.stores;
    runtime.game.drawerOpen = before.drawerOpen;
    runtime.game.rug = before.rug;
    runtime.game.lamps = before.lamps;
    runtime.game.droppedItems = before.droppedItems;
    runtime.game.items = before.items;
    runtime.game.fireplace = before.fireplace;
    runtime.game.addedWindows = before.addedWindows;
    runtime.doorSwing = before.doorSwing;
    for (let i = 0; i < 3; i++) runtime.shelfRows[i] = before.shelfRows[i];
    runtime.houseContext = null;
  }
}
export function drawAnnexFloor() {}
export function drawAnnexWalls(interior = false) {}
export function drawAnnexRoof() {}
export
// src/rendering/atmosphere.js

function drawDecor(o) {
  if (o.hidden) return;
  if (o.component) {
    drawComponent(o);
    return;
  }
  if (isFurnitureInstance(o)) {
    drawFurnitureInstance(o);
    return;
  }
  if (["table", "bed", "chest", "shelf", "lamp", "chair"].includes(o.kind)) {
    const map = {
      table: runtime.pushables.find(q => q.label === "mesa"),
      bed: runtime.bedObject,
      chest: runtime.chestObject,
      shelf: runtime.wardrobeObject,
      lamp: runtime.fixedSolids.find(q => q.label === "luminaria")
    };
    const base = map[o.kind];
    if (base) {
      const bak = {
        x: base.x,
        z: base.z,
        w: base.w,
        d: base.d,
        h: base.h,
        rot: base.rot
      };
      Object.assign(base, {
        x: o.x,
        z: o.z,
        w: o.w,
        d: o.d,
        h: o.h,
        rot: o.rot || 0
      });
      try {
        if (o.kind === "table") runtime.drawMoveable(base);else if (o.kind === "bed") runtime.drawBed();else if (o.kind === "chest") {
          const oldChest = runtime.game.chest,
            oldItems = runtime.game.stores.chest;
          runtime.game.chest = o.chestState || {
            locked: false,
            open: false
          };
          runtime.game.stores.chest = o.contents || [];
          try {
            runtime.drawChest();
          } finally {
            runtime.game.chest = oldChest;
            runtime.game.stores.chest = oldItems;
          }
        } else if (o.kind === "shelf") runtime.drawWardrobe();else if (o.kind === "lamp") runtime.drawLamp(o.x + o.w / 2, o.z + o.d / 2);
      } finally {
        Object.assign(base, bak);
      }
      return;
    }
  }
  if (o.kind === "tree") {
    runtime.tree(o.x, o.z, o.scale || 0.9);
    return;
  }
  if (o.kind === "shrub") {
    runtime.bush(o.x, o.z, o.scale || 0.85);
    return;
  }
  if (o.kind === "stone") {
    runtime.drawRockShape(o.x + o.w / 2, o.z + o.d / 2, o.w, o.d, o.h);
    return;
  }
  if (o.kind === "house1" || o.kind === "house2") {
    const playerInside = runtime.cloneInteriorAt(runtime.player.x, runtime.player.z) === o;
    runtime.withHouseInstance(o, () => {
      if (playerInside && (runtime.roofMode === 0 || runtime.roofMode === 2)) {
        runtime.drawAnnexFloorIfNeeded();
        runtime.drawInnerScene();
      } else {
        runtime.drawOuterShell();
        drawUpperExterior051();
        runtime.roof();
        runtime.drawExternalChimney();
        drawChimneyCap051();
      }
    });
    return;
  }
  if (o.kind === "house") {
    runtime.box3(o.x, o.z, o.w, o.d, o.h, ["#99836a", "#b49c7c", "#d1b592"]);
    runtime.box3(o.x - 0.1, o.z - 0.1, o.w + 0.2, o.d + 0.2, 0.35, ["#653a2f", "#8c4835", "#af6147"], o.h);
    return;
  }
  runtime.box3(o.x, o.z, o.w, o.d, o.h, o.kind === "barrel" ? ["#654831", "#805b38", "#a27b50"] : ["#6a4b35", "#8a6442", "#b28c62"]);
}
export function drawExternalChimney() {
  const o = runtime.chimneyObject;
  if (!o) return;
  const yaw = runtime.cameraYaw;
  const eastVisible = Math.cos(yaw) + Math.sin(yaw) > 0.02;
  const x = runtime.currentHouseWidth() + 0.055;
  const z = o.z + 0.02,
    w = 0.38,
    d = Math.max(0.74, o.d * 0.9),
    top = 7.95;
  if (!eastVisible && runtime.secondFloor) runtime.box3(x, z, w, d, 6.90 - 5.76, ["#8f7a68", "#b39d83", "#d2baa0"], 5.76);
  if (eastVisible) {
    runtime.box3(x, z, w, d, 6.90, ["#8f7a68", "#b39d83", "#d2baa0"]);
    for (let row = 0; row < 21; row++) {
      const by = 0.2 + row * 0.3;
      for (let i = 0; i < 3; i++) {
        const a = z + 0.035 + i * (d - 0.07) / 3,
          b = a + (d - 0.07) / 3 * 0.88;
        runtime.quad3([x + w + 3e-3, a, by], [x + w + 3e-3, b, by], [x + w + 3e-3, b, by + 0.23], [x + w + 3e-3, a, by + 0.23], ["#b9a38b", "#988270", "#c8b49b"][(i + row) % 3], "#6d6257");
      }
    }
  }
  runtime.box3(x, z, w, d, top - 6.90, ["#8f7a68", "#b39d83", "#d2baa0"], 6.90);
  runtime.box3(x - 0.04, z - 0.04, w + 0.08, d + 0.08, 0.12, ["#766858", "#95816a", "#c5b39b"], top - 0.13);
  runtime.box3(x + 0.06, z + 0.08, w - 0.12, d - 0.16, 0.065, ["#55473c", "#76665a", "#a99782"], top - 0.01);
  if (runtime.game.fireplace.lit && runtime.game.fireplace.wood > 0) {
    const t = performance.now() / 1e3;
    for (let i = 0; i < 5; i++) {
      const rise = (t * 0.22 + i * 0.21) % 1,
        p = runtime.P(x + w * 0.5 + Math.sin(t + i) * 0.04, z + d * 0.5, top + 0.1 + rise * 1.8);
      runtime.ctx.save();
      runtime.ctx.globalAlpha = (1 - rise) * 0.35;
      runtime.ctx.fillStyle = "#8b8b90";
      runtime.ctx.beginPath();
      runtime.ctx.arc(p[0], p[1], (5 + rise * 9) * runtime.zoom, 0, Math.PI * 2);
      runtime.ctx.fill();
      runtime.ctx.restore();
    }
  }
}

// src/inventory/inventory.js
