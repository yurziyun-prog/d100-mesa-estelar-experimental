// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
export
// src/objects/interactions.js

function initialize084() {
  window.addEventListener("keydown", e => {
    if (e.target instanceof HTMLElement && (e.target.matches("input,select,textarea") || e.target.isContentEditable)) return;
    let k = e.key.toLowerCase();
    if (["1", "2", "3"].includes(k) && !e.repeat) {
      const t = {
        1: "axe",
        2: "pickaxe",
        3: "shovel"
      }[k];
      if (runtime.equipment.left === t && runtime.equipment.right === t) {
        runtime.gathering.activeTool = t;
        runtime.toast("Ferramenta pronta: " + runtime.itemLabel(t));
      } else runtime.toast("Pegue e equipe " + runtime.itemLabel(t) + " nas duas m\xE3os.");
      return;
    }
    if (k === "tab") {
      e.preventDefault();
      if (!e.repeat) runtime.toggleEditor();
      return;
    }
    if (k === "f" && !e.repeat) {
      runtime.drawSheet();
      document.getElementById("sheet").classList.toggle("open");
      return;
    }
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (k === "escape") {
      runtime.editPlacing = null;
      if (runtime.placingObject) {
        runtime.placingObject = null;
        runtime.toast("Posicionamento cancelado.");
      }
      runtime.placingRug = false;
      runtime.placingSmallItem = null;
      if (runtime.helpOpen) runtime.toggleHelp(false);
      runtime.closePanels();
      runtime.restoreHandItem();
    }
    if (k === "enter" && runtime.dialog.classList.contains("open")) {
      e.preventDefault();
      const btn = runtime.dialogChoices.querySelector("button");
      if (btn) btn.click();
      return;
    }
    if (k === "i" && !e.repeat) {
      runtime.inventoryToggle();
      return;
    }
    if (k === "e" && !e.repeat) {
      if (!runtime.dialog.classList.contains("open")) runtime.interact();
      return;
    }
    if (k === "c") {
      runtime.keys.add("c");
      return;
    }
    if (k === "shift") {
      runtime.keys.add("shift");
      return;
    }
    if (k === "q" && !e.repeat) runtime.turnCamera(-Math.PI / 4);
    if (k === "r" && !e.repeat) runtime.turnCamera(Math.PI / 4);
    if (k === " ") {
      runtime.keys.add("space");
      if (!e.repeat) {
        clearTimeout(runtime.neutralJumpTimer);
        runtime.neutralJumpTimer = setTimeout(() => {
          if (runtime.keys.has("space")) runtime.startHop();
          runtime.neutralJumpTimer = 0;
        }, 120);
      }
      return;
    }
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
      if (runtime.keys.has("space") && !e.repeat) {
        if (runtime.neutralJumpTimer) {
          clearTimeout(runtime.neutralJumpTimer);
          runtime.neutralJumpTimer = 0;
        }
        const vectors = {
          w: [1, -1],
          arrowup: [1, -1],
          s: [-1, 1],
          arrowdown: [-1, 1],
          a: [-1, -1],
          arrowleft: [-1, -1],
          d: [1, 1],
          arrowright: [1, 1]
        };
        const [jx, jz] = runtime.unrotate(...vectors[k]);
        runtime.startJump(jx, jz);
      } else {
        runtime.closePanels();
        runtime.closeClimate();
        runtime.keys.add(k);
      }
    }
  });
}
export function initialize085() {
  window.addEventListener('keyup', e => {
    if (e.key === ' ' && runtime.neutralJumpTimer) {
      clearTimeout(runtime.neutralJumpTimer);
      runtime.neutralJumpTimer = 0;
    }
    runtime.keys.delete(e.key === ' ' ? 'space' : e.key.toLowerCase());
  });
}
export function initialize086() {
  window.addEventListener('blur', () => {
    runtime.keys.clear();
    if (runtime.neutralJumpTimer) {
      clearTimeout(runtime.neutralJumpTimer);
      runtime.neutralJumpTimer = 0;
    }
  });
}
export function initialize087() {
  runtime.canvas.addEventListener('dragover', e => {
    if (runtime.dragInventoryType) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });
}
export function initialize088() {
  runtime.canvas.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain') || runtime.dragInventoryType;
    runtime.dragInventoryType = null;
    if (!runtime.ITEM_SPEC[type] || !runtime.game.stores.inventory.includes(type)) return;
    const p = runtime.worldAt(e.clientX, e.clientY),
      dest = runtime.inventoryDropLocation(p.x, p.z, e.clientX, e.clientY);
    if (!dest) {
      runtime.toast('Abra o recipiente ou escolha um espaço dentro da casa.');
      return;
    }
    if (dest === 'floor' && !runtime.canReachFloorPoint(p.x, p.z)) {
      runtime.toast('Lugar fora de alcance. Aproxime-se para colocar o item.');
      return;
    }
    if (dest !== 'floor' && !runtime.requireStore(dest)) return;
    if (type === 'rug' && dest === 'floor') {
      const x = runtime.clamp(p.x - 1.2, .07, 4.52),
        z = runtime.clamp(p.z - .82, .07, 3.28);
      if (!runtime.canReachFloorPoint(x + 1.2, z + .82)) {
        runtime.toast('O tapete ficaria fora de alcance.');
        return;
      }
      if (runtime.transferItem('inventory', 'floor', type)) {
        runtime.game.rug.x = x;
        runtime.game.rug.z = z;
        runtime.game.rug.placed = true;
        runtime.saveGame();
      }
      return;
    }
    if (!runtime.transferItem('inventory', dest, type)) return;
    if (dest === 'floor') runtime.game.droppedItems.push({
      type,
      x: p.x,
      z: p.z
    });
    runtime.game.rug.placed = runtime.game.stores.floor.includes('rug');
    runtime.saveGame();
    runtime.inventoryDraw();
    runtime.toast(runtime.itemLabel(type) + ' guardado em ' + dest + '.');
  });
}
export function initialize089() {
  runtime.canvas.addEventListener('dragstart', e => {
    if (!runtime.canvasDragSource) {
      e.preventDefault();
      return;
    }
    const source = runtime.canvasDragSource;
    e.dataTransfer.setData('application/x-orla-source', JSON.stringify({
      from: source.from,
      type: source.type,
      x: source.object?.x,
      z: source.object?.z
    }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(runtime.emptyDragImage, 0, 0);
    runtime.target = null;
  });
}
export function initialize090() {
  runtime.canvas.addEventListener('dragend', () => {
    runtime.canvasDragSource = null;
    runtime.canvasDragOrigin = null;
  });
}
export function initialize091() {
  runtime.canvas.addEventListener('contextmenu', e => e.preventDefault());
}
export function initialize092() {
  runtime.canvas.addEventListener("pointerdown", e => {
    runtime.mouseScreen = {
      x: e.clientX,
      y: e.clientY
    };
    if (runtime.helpOpen) return;
    if (e.button === 2) {
      if (e.buttons === 3) {
        runtime.runMouseBoth = true;
        runtime.dragRotate = null;
        runtime.target = runtime.worldAt(e.clientX, e.clientY);
        return;
      }
      runtime.dragRotate = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        moved: false
      };
      runtime.canvas.setPointerCapture(e.pointerId);
      runtime.canvas.style.cursor = "ew-resize";
      return;
    }
    if (e.button === 0 && e.buttons === 3 && !runtime.editMode) {
      runtime.runMouseBoth = true;
      runtime.dragRotate = null;
      runtime.target = runtime.worldAt(e.clientX, e.clientY);
      return;
    }
    if (e.button !== 0) return;
    if (runtime.editMode) {
      if (runtime.editPlacing) {
        runtime.editPlaceAt(e.clientX, e.clientY);
      } else {
        if (!runtime.selectAt(e.clientX, e.clientY)) {
          runtime.selected = null;
          runtime.renderEditor();
        }
      }
      return;
    }
    if(!runtime.handItem && runtime.baseHouseEnabled!==false && runtime.player.elevation<.4 && runtime.reveal() && runtime.screenHitsFurniture(runtime.chestObject,e.clientX,e.clientY)){
      if(runtime.game.chest.open&&runtime.canReachStore('chest'))runtime.storageDialog('chest','Baú');else runtime.activateOrApproach('chest');return;
    }
    if (runtime.handItem) {
      runtime.closePanels();
      runtime.placeHandAt(e.clientX, e.clientY);
      return;
    }
    runtime.canvasDragOrigin = {
      x: e.clientX,
      y: e.clientY
    };
    runtime.canvasDragSource = runtime.sourceItemAtScreen(e.clientX, e.clientY);
    runtime.closePanels();
    runtime.game.pending = null;
    if (runtime.keys.has("space")) {
      if (runtime.neutralJumpTimer) {
        clearTimeout(runtime.neutralJumpTimer);
        runtime.neutralJumpTimer = 0;
      }
      const dst = runtime.worldAt(e.clientX, e.clientY);
      const dx = dst.x - runtime.player.x,
        dz = dst.z - runtime.player.z;
      runtime.startJump(dx, dz, Math.hypot(dx, dz));
      return;
    }
    if (runtime.placingSmallItem) {
      const p = runtime.worldAt(e.clientX, e.clientY),
        type = runtime.placingSmallItem;
      if (runtime.inside(runtime.player.x, runtime.player.z) && p.x > 0.15 && p.x < runtime.currentHouseWidth() - 0.15 && p.z > 0.15 && p.z < 4.85) {
        if (!runtime.canReachFloorPoint(p.x, p.z)) {
          runtime.toast("Este ponto est\xE1 fora de alcance.");
          return;
        }
        if (runtime.transferItem("inventory", "floor", type)) {
          runtime.game.droppedItems.push({
            type,
            x: p.x,
            z: p.z
          });
          runtime.placingSmallItem = null;
          runtime.saveGame();
          runtime.inventoryDraw();
          runtime.toast("Item colocado.");
        }
      } else runtime.toast("Coloque o item dentro da casa.");
      return;
    }
    if (runtime.placingRug) {
      const p = runtime.worldAt(e.clientX, e.clientY);
      const x = runtime.clamp(p.x - 1.2, 0.08, 4.52),
        z = runtime.clamp(p.z - 0.825, 0.08, 3.28);
      if (runtime.canReachFloorPoint(x + 1.2, z + 0.825) && x + 2.4 < runtime.currentHouseWidth() - 0.1) {
        runtime.game.rug.x = x;
        runtime.game.rug.z = z;
        runtime.transferItem("inventory", "floor", "rug");
        runtime.game.rug.placed = true;
        runtime.placingRug = false;
        runtime.saveGame();
        runtime.toast("Tapete colocado.");
      } else runtime.toast("Entre na casa para colocar o tapete.");
      return;
    }
    if (runtime.placingObject) {
      const p = runtime.worldAt(e.clientX, e.clientY),
        o = runtime.placingObject;
      if (!runtime.canReachObject(o) || !runtime.withinReach(p.x, p.z, 1.35)) {
        runtime.toast("Voc\xEA s\xF3 pode mover m\xF3veis para perto de si.");
        return;
      }
      if (runtime.canPlaceObjectAt(o, p.x, p.z)) {
        o.x = p.x - o.w / 2;
        o.z = p.z - o.d / 2;
        runtime.placingObject = null;
        runtime.saveGame();
        runtime.toast("Objeto reposicionado.");
      } else runtime.toast("N\xE3o h\xE1 espa\xE7o livre aqui. Clique em outro local ou Esc.");
      return;
    }
    runtime.target = runtime.worldAt(e.clientX, e.clientY);
  });
}
export function initialize093() {
  runtime.canvas.addEventListener('pointermove', e => {
    runtime.mouseScreen = {
      x: e.clientX,
      y: e.clientY
    };
    if (runtime.dragRotate && e.pointerId === runtime.dragRotate.id) {
      const dx = e.clientX - runtime.dragRotate.x;
      runtime.dragRotate.x = e.clientX;
      if (Math.abs(dx) > 3) {
        runtime.dragRotate.moved = true;
        runtime.cameraGoal += dx * .008;
        runtime.target = null;
      }
      return;
    }
    const src = runtime.sourceItemAtScreen(e.clientX, e.clientY);
    if (runtime.handItem) runtime.canvas.style.cursor = 'grabbing';else if (src) runtime.canvas.style.cursor = 'grab';else if (!runtime.dragRotate) runtime.canvas.style.cursor = 'crosshair';
  });
}
export function initialize094() {
  runtime.stopDrag = e => {
    if ((e.buttons & 3) !== 3) runtime.runMouseBoth = false;
    if (runtime.dragRotate && runtime.dragRotate.id === e.pointerId) {
      const info = runtime.dragRotate;
      runtime.dragRotate = null;
      runtime.canvas.style.cursor = "crosshair";
      if (e.button === 2 && !info.moved) runtime.contextClick(e.clientX, e.clientY, e.shiftKey);
    }
  };
}
export function initialize095() {
  runtime.canvas.addEventListener('pointerup', runtime.stopDrag);
}
export function initialize096() {
  runtime.canvas.addEventListener('pointercancel', runtime.stopDrag);
}
export function initialize097() {
  runtime.canvas.addEventListener('wheel', e => {
    e.preventDefault();
    runtime.zoom = runtime.clamp(runtime.zoom * (e.deltaY > 0 ? .90 : 1.11), .62, 2.05);
  }, {
    passive: false
  });
}
export function labelRoof() {
  runtime.roofButton.textContent = ['🏠 Telhado: auto', '🏠 Telhado: sempre', '🏠 Telhado: oculto'][runtime.roofMode];
}
export function initialize098() {
  runtime.roofButton.onclick = () => {
    runtime.roofMode = (runtime.roofMode + 1) % 3;
    runtime.labelRoof();
    runtime.toast(['Telhado automático', 'Telhado sempre visível', 'Telhado oculto'][runtime.roofMode]);
  };
}
export function initialize099() {
  document.getElementById('turnL').onclick = () => runtime.turnCamera(-Math.PI / 4);
}
export function initialize100() {
  document.getElementById('turnR').onclick = () => runtime.turnCamera(Math.PI / 4);
}
export function initialize101() {
  runtime.inventoryBtn = document.getElementById('inventoryBtn');
}
export function initialize102() {
  runtime.inventoryBtn.onclick = () => {
    if (runtime.handItem) {
      if (!runtime.canOpenBackpack()) return runtime.toast('Equipe a mochila primeiro.');
      runtime.storeHandInInventory();
      return;
    }
    runtime.inventoryToggle();
  };
}
export function initialize103() {
  runtime.inventoryBtn.addEventListener('dragover', e => {
    if (runtime.dragInventoryType || e.dataTransfer.types.includes('application/x-orla-source')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });
}
export function initialize104() {
  runtime.inventoryBtn.addEventListener('drop', e => {
    e.preventDefault();
    if (!runtime.canOpenBackpack()) return runtime.toast('Equipe a mochila primeiro.');
    if (runtime.dragInventoryType) {
      const t = runtime.dragInventoryType;
      runtime.dragInventoryType = null;
      if (runtime.game.stores.inventory.includes(t)) return;
      runtime.game.stores.inventory.push(t);
      runtime.inventoryDraw();
      runtime.saveGame();
      return;
    }
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData('application/x-orla-source'));
    } catch (_) {
      return;
    }
    if (!data || !runtime.ITEM_SPEC[data.type]) return;
    if (data.from === 'rug') {
      if (!runtime.game.rug.placed || !runtime.game.stores.floor.includes('rug') || !runtime.canReachObject(runtime.rugRect(), .85)) {
        runtime.toast('Aproxime-se do tapete.');
        return;
      }
      const i = runtime.game.stores.floor.indexOf('rug');
      if (i >= 0) runtime.game.stores.floor.splice(i, 1);
      runtime.game.rug.placed = false;
      runtime.game.stores.inventory.push('rug');
    } else if (data.from === 'worldKey') {
      const kind = data.type === 'houseKey' ? 'house' : data.type === 'chestKey' ? 'chest' : null;
      if (!kind || runtime.inventoryHas(data.type)) return;
      const point = runtime.game.groundKeys[kind];
      if (Math.hypot(runtime.player.x - point.x, runtime.player.z - point.z) > 1.12) {
        runtime.toast('Aproxime-se da chave.');
        return;
      }
      runtime.game.items[data.type] = true;
      runtime.game.stores.inventory.push(data.type);
    } else if (data.from === 'floor') {
      const o = runtime.game.droppedItems.find(o => o.type === data.type && Math.abs(o.x - data.x) < .001 && Math.abs(o.z - data.z) < .001);
      if (!o || Math.hypot(runtime.player.x - o.x, runtime.player.z - o.z) > 1.12) {
        runtime.toast('Aproxime-se do objeto.');
        return;
      }
      runtime.game.droppedItems.splice(runtime.game.droppedItems.indexOf(o), 1);
      runtime.game.stores.inventory.push(data.type);
    } else if (runtime.game.stores[data.from]?.includes(data.type)) {
      const i = runtime.game.stores[data.from].indexOf(data.type);
      runtime.game.stores[data.from].splice(i, 1);
      runtime.game.stores.inventory.push(data.type);
    }
    runtime.syncLegacyItems();
    runtime.inventoryDraw();
    runtime.saveGame();
    runtime.toast('Guardado no inventário.');
  });
}
export function initialize105() {
  document.getElementById('restart').onclick = () => {
    if (confirm('Reiniciar chaves, portas, baú e posições dos móveis?')) {
      try {
        localStorage.removeItem(runtime.saveKey);
        localStorage.removeItem('orla-v16-aventura');
      } catch (_) {}
      location.reload();
    }
  };
}
export function initialize106() {
  runtime.inventoryDraw();
}
export function initialize107() {
  document.getElementById('minus').onclick = () => runtime.zoom = runtime.clamp(runtime.zoom * .87, .62, 2.05);
}
export function initialize108() {
  document.getElementById('plus').onclick = () => runtime.zoom = runtime.clamp(runtime.zoom * 1.13, .62, 2.05);
}
export function toggleHelp(state) {
  runtime.closeDialog();
  runtime.helpOpen = state;
  document.getElementById('help').classList.toggle('open', state);
  runtime.keys.clear();
}
export function initialize109() {
  document.getElementById('helpbtn').onclick = () => runtime.toggleHelp(true);
}
export function initialize110() {
  document.getElementById('closeHelp').onclick = () => runtime.toggleHelp(false);
}
export function initialize111() {
  document.getElementById('editBtn').onclick = () => runtime.toggleEditor();
}
export function initialize112() {
  document.getElementById('roleBtn').onclick = () => runtime.setRole(runtime.role === 'god' ? 'traveler' : 'god');
}
export function initialize113() {
  document.getElementById('sheetBtn').onclick = () => {
    runtime.drawSheet();
    runtime.inventory.classList.remove('open');
    runtime.closeDialog();
    document.getElementById('sheet').classList.toggle('open');
  };
}
export function initialize114() {
  document.getElementById('sheetClose').onclick = () => document.getElementById('sheet').classList.remove('open');
}
export function initialize115() {
  runtime.setRole(runtime.role);

  // === ORLA v0.30: WebGL geometry + independent atmospheric FX ===
}
export function initialize151() {
  window.addEventListener('resize', runtime.size);
}
export function initialize152() {
  runtime.size();
}
export function initialize153() {
  requestAnimationFrame(runtime.tick);
}
export function initialize154() {
  window.__orlaDebug = {
    player: runtime.player,
    game: runtime.game,
    gathering: runtime.gathering,
    houseOneBlueprint: runtime.houseOneBlueprint,
    houseTwoBlueprint: runtime.houseTwoBlueprint,
    houseInstances: runtime.houseInstances,
    ensureHouseState: runtime.ensureHouseState,
    cloneInteriorAt: runtime.cloneInteriorAt,
    pushables: runtime.pushables,
    draw: runtime.draw,
    drawInnerScene: runtime.drawInnerScene,
    clickedInteraction: runtime.clickedInteraction,
    drawWallFace: runtime.drawWallFace,
    doorDialog: runtime.doorDialog,
    chestDialog: runtime.chestDialog,
    pickKey: runtime.pickKey,
    saveGame: runtime.saveGame,
    inside: runtime.inside,
    worldAt: runtime.worldAt,
    move: runtime.move,
    canWalk: runtime.canWalk,
    turnCamera: runtime.turnCamera,
    get cameraYaw() {
      return runtime.cameraYaw;
    },
    get cameraGoal() {
      return runtime.cameraGoal;
    },
    startJump: runtime.startJump,
    supportHeight: runtime.supportHeight,
    wallBarriers: runtime.wallBarriers,
    isClickedDoor: runtime.isClickedDoor,
    project: runtime.P,
    rectDistance: runtime.rectDistance,
    overlapCanSeparate: runtime.overlapCanSeparate,
    tryPush: runtime.tryPush,
    canPushTo: runtime.canPushTo,
    get roofMode() {
      return runtime.roofMode;
    },
    chestObject: runtime.chestObject,
    doorCanClose: runtime.doorCanClose,
    canPlaceChest: runtime.canPlaceChest,
    get placingObject() {
      return runtime.placingObject;
    },
    collectChestItem: runtime.collectChestItem,
    drawChest: runtime.drawChest,
    drawDoor: runtime.drawDoor,
    box3: runtime.box3,
    drawerDialog: runtime.drawerDialog,
    storageDialog: runtime.storageDialog,
    transferItem: runtime.transferItem,
    storeCanFit: runtime.storeCanFit,
    rotateObjectBy: runtime.rotateObjectBy,
    toggleLamp: runtime.toggleLamp,
    clickedLamp: runtime.clickedLamp,
    rotateObject90: runtime.rotateObject90,
    canPlaceObjectAt: runtime.canPlaceObjectAt,
    contextClick: runtime.contextClick,
    objectAtScreen: runtime.objectAtScreen,
    deskObject: runtime.deskObject
  };
}
