import {SUPPLIES} from '../combat/ammunition.js';
import {WEAPONS} from '../combat/rules.js';
// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
export function itemSlots(type) {
  return Math.max(1, Math.ceil((runtime.ITEM_SPEC[type]?.litres || 1) / runtime.INVENTORY_SLOT_LITRES));
}
export function itemIcon(type) {
  if(runtime.ITEM_SPEC[type]?.icon)return runtime.ITEM_SPEC[type].icon;
  if(SUPPLIES[type])return SUPPLIES[type].icon;
  if(WEAPONS[type])return WEAPONS[type].icon;
  return {
    backpack: '🎒',
    clothing: '🥼',
    houseKey: '🗝️',
    chestKey: '🗝️',
    coins: '🪙',
    gem: '💎',
    paper: '📜',
    deskBook: '📕',
    book: '📘',
    rug: '🧵',
    apple: '🍎',
    cup: '🥛',
    mug: '☕',
    axe: '🪓',
    pickaxe: '⛏️',
    shovel: '🪏',
    wood: '🪵',
    ore: '💠',
    stoneChunk: '🪨',
    soil: '🟫',
    treasure: '💰'
  }[type] || '📦';
}
export function storeLoad(id) {
  return runtime.game.stores[id].reduce((n, t) => n + (runtime.ITEM_SPEC[t]?.litres || 0), 0);
}
export function storeCanFit(id, type) {
  return runtime.game.stores[id].length < 50 && runtime.storeLoad(id) + (runtime.ITEM_SPEC[type]?.litres || Infinity) <= runtime.STORAGE_LIMIT[id] + 1e-6;
}
export function itemLabel(type) {
  return runtime.ITEM_SPEC[type]?.name || type;
}
export function inventoryHas(type) {
  return runtime.game.stores.inventory.includes(type);
}
export function keyHeld(kind) {
  const code = kind + "Key";
  return runtime.inventoryHas(code) || runtime.handItem?.type === code || runtime.equipment.left === code || runtime.equipment.right === code;
}
export function transferItem(from, to, type) {
  const list = runtime.game.stores[from],
    index = list.indexOf(type);
  if (index < 0) return false;
  if (!runtime.storeCanFit(to, type)) {
    runtime.toast('Sem espaço suficiente para ' + runtime.itemLabel(type) + '.');
    return false;
  }
  list.splice(index, 1);
  runtime.game.stores[to].push(type);
  if (type === 'book' && (from === 'shelf' || to === 'shelf')) {
    if (from === 'shelf') {
      const r = runtime.shelfRows.findIndex(v => v > 0);
      if (r >= 0) runtime.shelfRows[r]--;
    } else runtime.shelfRows[0]++;
  }
  runtime.syncLegacyItems();
  runtime.saveGame();
  runtime.inventoryDraw();
  return true;
}
export function syncLegacyItems() {
  const locs = Object.values(runtime.game.stores).flat();
  runtime.game.loot.coins = !runtime.game.stores.chest.includes('coins');
  runtime.game.loot.gem = !runtime.game.stores.chest.includes('gem');
  runtime.game.deskLoot.paper = !runtime.game.stores.drawerTop.includes('paper') && !runtime.game.stores.drawerBottom.includes('paper') && !runtime.game.stores.deskTop.includes('paper');
  runtime.game.deskLoot.book = !runtime.game.stores.drawerTop.includes('deskBook') && !runtime.game.stores.drawerBottom.includes('deskBook') && !runtime.game.stores.deskTop.includes('deskBook');
  runtime.game.booksLeft = runtime.game.stores.shelf.filter(x => x === 'book').length;
  runtime.game.booksTaken = runtime.game.stores.inventory.filter(x => x === 'book').length;
  runtime.game.rug.placed = runtime.game.stores.floor.includes('rug');
  runtime.game.rug.collected = runtime.game.stores.inventory.includes('rug');
}
export function initialize063() {
  runtime.dialog = document.getElementById('interaction');
  runtime.dialogTitle = document.getElementById('dialogTitle');
  runtime.dialogText = document.getElementById('dialogText');
  runtime.dialogChoices = document.getElementById('dialogChoices');
}
export function initialize064() {
  runtime.inventory = document.getElementById('inventory');
  runtime.invItems = document.getElementById('inventoryItems');
  runtime.invMeta = document.getElementById('inventoryMeta');
}
export function initialize065() {
  runtime.choicesNow = [];
}
export function initialize066() {
  runtime.dragInventoryType = null;
}
export function initialize067() {
  runtime.canvasDragOrigin = null;
}
export function initialize068() {
  runtime.canvasDragSource = null;
}
export function closePanels() {
  runtime.closeDialog();
  runtime.inventory.classList.remove('open');
  runtime.equipmentBox.classList.remove('open');
  document.getElementById('sheet').classList.remove('open');
  runtime.dismissPopups();
}
export function restoreHandItem() {
  if (!runtime.handItem) return;
  const h = runtime.handItem,
    t = h.type;
  if (h.from === 'inventory') runtime.game.stores.inventory.push(t);else if (h.from === 'equipment') {
    if ((['axe', 'pickaxe', 'shovel'].includes(t)||WEAPONS[t]?.hands===2)) {
      runtime.equipment.left = t;
      runtime.equipment.right = t;
      runtime.gathering.activeTool = t;
    } else if (t === 'backpack') runtime.equipment.backpack = t;else if (t === 'clothing') runtime.equipment.clothing = t;else runtime.equipment.left = t;
    runtime.renderEquipment();
  } else if (h.from === 'worldKey') runtime.game.items[t] = false;else if (h.from === 'floor' && h.object) {
    runtime.game.droppedItems.push({
      type: t,
      x: h.object.x,
      z: h.object.z
    });
    runtime.game.stores.floor.push(t);
  } else if (h.from === 'rug') {
    if (!runtime.game.stores.floor.includes('rug')) runtime.game.stores.floor.push('rug');
    runtime.game.rug.placed = true;
  } else if (runtime.game.stores[h.from]) {
    runtime.game.stores[h.from].push(t);
    if (h.from === 'shelf') runtime.shelfRows[h.row ?? 0]++;
  }
  runtime.handItem = null;
  runtime.syncLegacyItems();
  runtime.inventoryDraw();
  runtime.saveGame();
}
export function pickItemToHand(src) {
  if (runtime.handItem) {
    runtime.toast('Você já está segurando algo.');
    return false;
  }
  if (!src || !runtime.ITEM_SPEC[src.type]) return false;
  const t = src.type;
  if (src.from === 'inventory') {
    const i = runtime.game.stores.inventory.indexOf(t);
    if (i < 0) return false;
    runtime.game.stores.inventory.splice(i, 1);
  } else if (src.from === 'worldKey') runtime.game.items[t] = true;else if (src.from === 'floor' && src.object) {
    const i = runtime.game.droppedItems.indexOf(src.object);
    if (i < 0) return false;
    runtime.game.droppedItems.splice(i, 1);
    const f = runtime.game.stores.floor.indexOf(t);
    if (f >= 0) runtime.game.stores.floor.splice(f, 1);
  } else if (src.from === 'rug') {
    const i = runtime.game.stores.floor.indexOf('rug');
    if (i >= 0) runtime.game.stores.floor.splice(i, 1);
    runtime.game.rug.placed = false;
  } else if (runtime.game.stores[src.from]) {
    const i = runtime.game.stores[src.from].indexOf(t);
    if (i < 0) return false;
    runtime.game.stores[src.from].splice(i, 1);
  } else return false;
  if (src.from === 'shelf' && Number.isInteger(src.row) && runtime.shelfRows[src.row] > 0) runtime.shelfRows[src.row]--;
  runtime.handItem = {
    type: t,
    from: src.from,
    row: src.row,
    object: src.object || null
  };
  runtime.syncLegacyItems();
  runtime.inventoryDraw();
  runtime.saveGame();
  runtime.toast(runtime.itemLabel(t) + ' na mão.');
  return true;
}
export function storeHandInInventory() {
  if (!runtime.handItem) return false;
  if (!runtime.canOpenBackpack()) return runtime.toast('Equipe a mochila primeiro.'), false;
  if (!runtime.storeCanFit('inventory', runtime.handItem.type)) {
    runtime.toast('Não cabe na mochila.');
    return false;
  }
  runtime.game.stores.inventory.push(runtime.handItem.type);
  runtime.handItem = null;
  runtime.syncLegacyItems();
  runtime.inventoryDraw();
  runtime.saveGame();
  runtime.toast('Guardado na mochila.');
  return true;
}
export function placeHandAt(mx, my) {
  if (!runtime.handItem) return false;
  const p = runtime.worldAt(mx, my),
    type = runtime.handItem.type;
  let dest = runtime.inventoryDropLocation(p.x, p.z, mx, my);
  if (!dest) {
    runtime.toast('Abra o recipiente ou escolha um local válido.');
    return true;
  }
  if (type === 'rug' && dest !== 'floor') {
    runtime.toast('O tapete só pode ser colocado no chão.');
    return true;
  }
  if (dest === 'floor' && !runtime.canReachFloorPoint(p.x, p.z)) {
    runtime.toast('Lugar fora de alcance.');
    return true;
  }
  if (dest !== 'floor' && !runtime.requireStore(dest)) return true;
  if (type === 'rug') {
    const x = runtime.clamp(p.x - 1.2, .07, 4.52),
      z = runtime.clamp(p.z - .82, .07, 3.28);
    if (!runtime.canReachFloorPoint(x + 1.2, z + .82)) {
      runtime.toast('O tapete ficaria fora de alcance.');
      return true;
    }
    if (!runtime.game.stores.floor.includes('rug')) runtime.game.stores.floor.push('rug');
    runtime.game.rug.x = x;
    runtime.game.rug.z = z;
    runtime.game.rug.placed = true;
    runtime.handItem = null;
    runtime.saveGame();
    runtime.toast('Tapete colocado.');
    return true;
  }
  if (dest === 'floor') {
    runtime.game.droppedItems.push({
      type: type,
      x: p.x,
      z: p.z
    });
    runtime.game.stores.floor.push(type);
    runtime.handItem = null;
    runtime.syncLegacyItems();
    runtime.saveGame();
    runtime.toast(runtime.itemLabel(type) + ' colocado no chão.');
    return true;
  }
  if (!runtime.storeCanFit(dest, type)) {
    runtime.toast('Sem espaço suficiente.');
    return true;
  }
  runtime.game.stores[dest].push(type);
  if (dest === 'shelf' && type === 'book') {
    const zz = runtime.wardrobeObject.z + runtime.wardrobeObject.d * .45;
    let best = 0,
      dist = 1e9;
    for (let r = 0; r < 3; r++) {
      const q = runtime.P(runtime.wardrobeObject.x - .03, zz, .47 + r * .48);
      const d = Math.hypot(mx - q[0], my - q[1]);
      if (d < dist) {
        dist = d;
        best = r;
      }
    }
    runtime.shelfRows[best]++;
  }
  runtime.handItem = null;
  runtime.syncLegacyItems();
  runtime.saveGame();
  runtime.inventoryDraw();
  runtime.toast(runtime.itemLabel(type) + ' colocado em ' + dest + '.');
  return true;
}
export function initialize069() {
  runtime.equipmentBox = document.getElementById('equipment');
  runtime.eqSlots = document.getElementById('eqSlots');
}
export function initialize070() {
  document.getElementById('equipmentClose').onclick = () => runtime.equipmentBox.classList.remove('open');
}
export function initialize071() {
  document.getElementById('inventoryClose').onclick = () => runtime.inventory.classList.remove('open');
}
export function initialize072() {
  runtime.gearSlots = ['clothing', 'left', 'right', 'backpack'];
}
export function initialize073() {
  runtime.equipmentIcon = {
    clothing: '🥼',
    left: '✋',
    right: '✋',
    backpack: '🎒'
  };
}
export function renderEquipment() {
  runtime.eqSlots.replaceChildren();
  for (const slot of runtime.gearSlots) {
    const el = document.createElement('button');
    el.className = 'eq-slot';
    el.title = 'Clique para equipar ou retirar';
    const value = runtime.equipment[slot],
      dual = slot === 'right' && value && runtime.equipment.left === value && (['axe', 'pickaxe', 'shovel'].includes(value)||WEAPONS[value]?.hands===2);
    el.innerHTML = '<strong>' + {
      clothing: 'Roupa',
      left: 'Mão esquerda',
      right: 'Mão direita',
      backpack: 'Mochila'
    }[slot] + '</strong><span>' + (value ? runtime.itemIcon(value) + ' ' + (dual ? '↔' : runtime.itemLabel(value)) : 'Vazio') + '</span>';
    el.onclick = () => {
      if (runtime.handItem) {
        if (slot === 'backpack' && runtime.handItem.type !== 'backpack') return runtime.toast('Esse espaço exige uma mochila.');
        if (slot === 'clothing' && runtime.handItem.type !== 'clothing') return runtime.toast('Esse espaço é para roupas.');
        if ((slot === 'left' || slot === 'right') && ['backpack', 'clothing'].includes(runtime.handItem.type)) return runtime.toast('Use o espaço correto.');
        if (runtime.equipment[slot]) return runtime.toast('Retire o equipamento anterior.');
        const type = runtime.handItem.type;
        if ((['axe', 'pickaxe', 'shovel'].includes(type)||WEAPONS[type]?.hands===2)) {
          if (runtime.equipment.left || runtime.equipment.right) return runtime.toast('Libere as duas mãos.');
          runtime.equipment.left = type;
          runtime.equipment.right = type;
          runtime.gathering.activeTool = ['axe','pickaxe','shovel'].includes(type)?type:null;
        } else runtime.equipment[slot] = type;
        runtime.handItem = null;
        runtime.saveGame();
        runtime.inventoryDraw();
        runtime.renderEquipment();
        return;
      }
      if (!value) return;
      if (runtime.equipment.backpack && value !== 'backpack' && !runtime.storeCanFit('inventory', value)) {
        runtime.toast('Sem espaço na mochila.');
        return;
      }
      if ((['axe', 'pickaxe', 'shovel'].includes(value)||WEAPONS[value]?.hands===2)) {
        runtime.equipment.left = null;
        runtime.equipment.right = null;
        runtime.gathering.activeTool = null;
      } else runtime.equipment[slot] = null;
      if (!runtime.storeCanFit('inventory', value) && runtime.equipment.backpack) {
        runtime.toast('Sem espaço na mochila.');
        return;
      }
      if (runtime.equipment.backpack && value !== 'backpack') runtime.game.stores.inventory.push(value);else runtime.handItem = {
        type: value,
        from: 'equipment',
        object: null
      };
      runtime.saveGame();
      runtime.inventoryDraw();
      runtime.renderEquipment();
    };
    runtime.eqSlots.append(el);
  }
  document.getElementById('eqInfo').textContent = runtime.equipment.backpack ? 'Equipamento e mochila são painéis separados. Clique nos espaços para desequipar.' : 'Sem mochila: leve-a até este painel e equipe-a.';
}
export function initialize074() {
  document.getElementById('equipmentBtn').onclick = () => {
    runtime.inventory.classList.remove('open');
    runtime.renderEquipment();
    runtime.equipmentBox.classList.toggle('open');
  };
}
export function initialize075() {
  document.getElementById('menuBtn').onclick = () => document.getElementById('topActions').classList.toggle('expanded');
}
export function initialize076() {
  document.getElementById('exportSave').onclick = runtime.exportSaveFile;
}
export function initialize077() {
  document.getElementById('importSave').onclick = () => document.getElementById('saveFile').click();
}
export function initialize078() {
  document.getElementById('saveFile').onchange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw Error('Arquivo grande demais');
      const raw = await file.text(),
        data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || !data.stores || !Array.isArray(data.editDecor) || !data.door || !Array.isArray(data.stores.inventory)) throw Error('Formato incompatível');
      if (!confirm('Substituir a partida atual pelo arquivo importado?')) return;
      localStorage.setItem(runtime.saveKey, raw);
      location.reload();
    } catch (err) {
      runtime.toast('Falha na importação: ' + err.message);
    }
  };
}
export function canOpenBackpack() {
  return runtime.godMode() || runtime.equipment.backpack === 'backpack';
}
export function initialize079() {
  runtime.renderEquipment();
}
export function inventoryDraw() {
  runtime.invItems.innerHTML = "";
  const items = [...runtime.game.stores.inventory];
  const usedSlots = items.reduce((n, t) => n + runtime.itemSlots(t), 0);
  const totalCells = Math.max(24, Math.ceil(Math.max(usedSlots, 1) / 6) * 6);
  runtime.invMeta.textContent = "Bolsa visual \xB7 " + usedSlots + " quadrinhos usados \xB7 1 quadrinho = " + runtime.INVENTORY_SLOT_LITRES * 1e3 + " ml";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "inventory-empty";
    empty.textContent = "Vazio. Explore e procure objetos.";
    runtime.invItems.append(empty);
    return;
  }
  for (const type of items) {
    const cell = document.createElement("div");
    cell.className = "inventory-item";
    cell.draggable = true;
    cell.addEventListener("dblclick",e=>{e.preventDefault();runtime.useInventoryItem?.(type);});
    cell.style.gridColumn = "span " + Math.min(6, runtime.itemSlots(type));
    cell.title = "Arraste para o ch\xE3o, ba\xFA, gaveta ou m\xF3vel";
    cell.innerHTML = '<span class="icon">' + runtime.itemIcon(type) + '</span><span class="name">' + runtime.itemLabel(type) + '</span><span class="size">' + (runtime.ITEM_SPEC[type]?.litres || 0).toFixed(2).replace(".", ",") + " L</span>";
    cell.addEventListener("dragstart", e => {
      runtime.dragInventoryType = type;
      e.dataTransfer.setData("text/plain", type);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setDragImage(runtime.emptyDragImage, 0, 0);
    });
    cell.addEventListener("dragend", () => {
      runtime.dragInventoryType = null;
    });
    cell.addEventListener("contextmenu", e => {
      e.preventDefault();
      const now = performance.now();
      if (runtime.inventoryRightClick && runtime.inventoryRightClick.type === type && now - runtime.inventoryRightClick.at < 420) {
        clearTimeout(runtime.inventoryRightClick.timer);
        runtime.inventoryRightClick = null;
        (runtime.useInventoryItem||runtime.quickEquipFromInventory)(type);
      } else {
        if (runtime.inventoryRightClick) {
          clearTimeout(runtime.inventoryRightClick.timer);
          const previous = runtime.inventoryRightClick.type;
          if (!runtime.handItem) runtime.pickItemToHand({
            from: "inventory",
            type: previous
          });
        }
        const token = {
          type,
          at: now,
          timer: null
        };
        token.timer = setTimeout(() => {
          if (runtime.inventoryRightClick !== token) return;
          runtime.inventoryRightClick = null;
          if (!runtime.handItem) runtime.pickItemToHand({
            from: "inventory",
            type
          });
        }, 420);
        runtime.inventoryRightClick = token;
      }
    });
    runtime.invItems.append(cell);
  }
  const empties = Math.max(0, totalCells - usedSlots);
  for (let i = 0; i < empties; i++) {
    const c = document.createElement("div");
    c.className = "inventory-cell";
    runtime.invItems.append(c);
  }
}
export function initialize080() {
  runtime.inventory.addEventListener('dragover', e => {
    if (e.dataTransfer.types.includes('application/x-orla-source')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });
}
export function initialize081() {
  runtime.inventory.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData('application/x-orla-source'));
    } catch {
      return;
    }
    if (!data || !runtime.ITEM_SPEC[data.type]) return;
    if (data.from === 'worldKey') {
      const kind = data.type === 'houseKey' ? 'house' : data.type === 'chestKey' ? 'chest' : null;
      if (!kind || runtime.inventoryHas(data.type)) return;
      const point = runtime.game.groundKeys[kind];
      if (Math.hypot(runtime.player.x - point.x, runtime.player.z - point.z) > 1.12) return runtime.toast('Aproxime-se da chave.');
      runtime.game.items[data.type] = true;
      runtime.game.stores.inventory.push(data.type);
      runtime.saveGame();
      runtime.inventoryDraw();
      runtime.toast('Chave recolhida.');
    } else if (data.from === 'rug') {
      if (!runtime.game.rug.placed || !runtime.game.stores.floor.includes('rug') || !runtime.canReachObject(runtime.rugRect(), .85)) {
        runtime.toast('Aproxime-se do tapete.');
        return;
      }
      const i = runtime.game.stores.floor.indexOf('rug');
      if (i >= 0) runtime.game.stores.floor.splice(i, 1);
      runtime.game.rug.placed = false;
      runtime.game.stores.inventory.push('rug');
      runtime.inventoryDraw();
      runtime.saveGame();
      runtime.toast('Tapete recolhido.');
    } else if (!runtime.game.stores[data.from]?.includes(data.type)) return;else if (data.from === 'floor') {
      const o = runtime.game.droppedItems.find(o => o.type === data.type && Math.abs(o.x - data.x) < .001 && Math.abs(o.z - data.z) < .001);
      if (!o || Math.hypot(runtime.player.x - o.x, runtime.player.z - o.z) > 1.12) {
        runtime.toast('Aproxime-se do objeto.');
        return;
      }
      if (runtime.transferItem('floor', 'inventory', data.type)) {
        runtime.game.droppedItems.splice(runtime.game.droppedItems.indexOf(o), 1);
        runtime.saveGame();
        runtime.toast(runtime.itemLabel(data.type) + ' recolhido.');
      }
    } else if (runtime.requireStore(data.from) && runtime.transferItem(data.from, 'inventory', data.type)) {
      runtime.syncLegacyItems();
      runtime.toast(runtime.itemLabel(data.type) + ' recolhido.');
      if(runtime.activeStorage)runtime.storageDialog(runtime.activeStorage.id,runtime.activeStorage.title);
    }
    runtime.canvasDragSource = null;
  });
}
export function inventoryToggle() {
  if (!runtime.canOpenBackpack()) return runtime.toast('Primeiro equipe a mochila.');
  runtime.equipmentBox.classList.remove('open');
  runtime.inventoryDraw();
  runtime.inventory.classList.toggle('open');
  runtime.dialog.classList.remove('open');
  document.getElementById('sheet').classList.remove('open');
}
export function closeDialog() {
  runtime.activeStorage=null;runtime.dialog.classList.remove('storage-open');
  runtime.dialog.classList.remove('open');
  runtime.choicesNow = [];
  runtime.dialogOrigin = null;
}
export function showDialog(title, message, choices) {
  runtime.activeStorage=null;runtime.dialog.classList.remove('storage-open');runtime.dialog.ondrop=runtime.dialog.ondragover=null;
  runtime.inventory.classList.remove('open');
  runtime.dialogTitle.textContent = title;
  runtime.dialogText.textContent = message;
  runtime.dialogChoices.innerHTML = '';
  runtime.choicesNow = choices;
  for (const [i, ch] of choices.filter(c => c && c.label !== 'Cancelar').entries()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = ch.label;
    if (i === 0) b.classList.add('primary');
    b.onclick = () => {
      runtime.closeDialog();
      ch.action?.();
    };
    runtime.dialogChoices.append(b);
  }
  runtime.dialogOrigin = {
    x: runtime.player.x,
    z: runtime.player.z
  };
  runtime.dialog.classList.add('open');
}
export function initialize082() {
  runtime.REACH = 1.08;
}
export function near(x, z, d = 1.12) {
  return runtime.godMode() || Math.hypot(runtime.player.x - x, runtime.player.z - z) <= d;
}
export function withinReach(x, z, margin = runtime.REACH) {
  return runtime.godMode() || Math.hypot(runtime.player.x - x, runtime.player.z - z) <= margin;
}
export function canReachObject(o, margin = runtime.REACH) {
  return runtime.godMode() || runtime.inside(runtime.player.x, runtime.player.z) && runtime.rectDistance(runtime.player.x, runtime.player.z, o) <= margin;
}
export function storeObject(id) {
  if (id === 'chest') return runtime.chestObject;
  if (id === 'drawerTop' || id === 'drawerBottom' || id === 'deskTop') return runtime.deskObject;
  if (id === 'shelf') return runtime.wardrobeObject;
  if (id === 'bed') return runtime.bedObject;
  if (id === 'table') return runtime.pushables.find(o => o.label === 'mesa');
  return null;
}
export function canReachStore(id) {
  const o = runtime.storeObject(id);
  return !!o && runtime.canReachObject(o);
}
export function storeAvailable(id) {
  if (runtime.godMode()) return !!runtime.game.stores[id];
  if (!runtime.canReachStore(id)) return false;
  if (id === 'chest') return runtime.game.chest.open && !runtime.game.chest.locked;
  if (id === 'drawerTop') return runtime.game.drawerOpen[0];
  if (id === 'drawerBottom') return runtime.game.drawerOpen[1];
  return true;
}
export function requireStore(id) {
  if (runtime.storeAvailable(id)) return true;
  runtime.toast('Aproxime-se e abra o recipiente, se necessário.');
  return false;
}
export function canReachFloorPoint(x, z) {
  return runtime.withinReach(x, z) && x > -12 && x < 20 && z > -10 && z < 18 && (runtime.godMode() || !runtime.wallBarriers().some(w => runtime.circleRect(x, z, .08, w)));
}
export function rugRect() {
  return {
    x: runtime.game.rug.x,
    z: runtime.game.rug.z,
    w: 2.4,
    d: 1.65
  };
}
export function quickEquipFromInventory(type) {
  const items = runtime.game.stores.inventory,
    index = items.indexOf(type);
  if (index < 0) return false;
  const tools = ['axe', 'pickaxe', 'shovel',...Object.keys(WEAPONS).filter(id=>WEAPONS[id].hands===2)],
    twoHanded = tools.includes(type);
  const slot = type === 'backpack' ? 'backpack' : type === 'clothing' ? 'clothing' : 'right';
  // Remove exactly one selected item first: it frees its volume for displaced items.
  items.splice(index, 1);
  const returnOrDrop = item => {
    if ((runtime.canOpenBackpack() || type === 'backpack') && runtime.storeCanFit('inventory', item)) items.push(item);else {
      runtime.game.droppedItems.push({
        type: item,
        x: runtime.player.x + .3,
        z: runtime.player.z + .3
      });
      runtime.game.stores.floor.push(item);
    }
  };
  if (runtime.handItem) {
    returnOrDrop(runtime.handItem.type);
    runtime.handItem = null;
  }
  const slots = new Set(twoHanded ? ['left', 'right'] : [slot]);
  // A two-handed tool is one physical item, even though it occupies two slots.
  for (const key of [...slots]) if (tools.includes(runtime.equipment[key])) {
    slots.add('left');
    slots.add('right');
  }
  let dualReturned = false;
  for (const key of slots) {
    const old = runtime.equipment[key];
    const dual = tools.includes(old) && runtime.equipment.left === runtime.equipment.right;
    if (old && (!dual || !dualReturned)) returnOrDrop(old);
    if (dual) dualReturned = true;
  }
  for (const key of slots) runtime.equipment[key] = null;
  if (twoHanded) {
    runtime.equipment.left = type;
    runtime.equipment.right = type;
  } else runtime.equipment[slot] = type;
  runtime.gathering.activeTool = ['axe','pickaxe','shovel'].includes(runtime.equipment.left) && runtime.equipment.left === runtime.equipment.right ? runtime.equipment.left : null;
  runtime.syncLegacyItems();
  runtime.inventoryDraw();
  runtime.renderEquipment();
  runtime.saveGame();
  runtime.toast(runtime.itemLabel(type) + ' equipado.');
  return true;
}
