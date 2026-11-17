// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
import { serializeFurniture, restoreFurniture } from './object-state.js';

export function initialize044() {
  runtime.placingObject = null;
  runtime.placingRug = false;
  runtime.placingSmallItem = null;
  runtime.dialogOrigin = null;
  runtime.furnitureSaveTimer = null;
}
export function scheduleFurnitureSave() {
  clearTimeout(runtime.furnitureSaveTimer);
  runtime.furnitureSaveTimer = setTimeout(() => runtime.saveGame(), 300);
}
export function initialize045() {
  runtime.chestObject = runtime.fixedSolids.find(o => o.label === 'bau');
}
export function initialize046() {
  runtime.bedObject = runtime.fixedSolids.find(o => o.label === 'cama');
}
export function initialize047() {
  runtime.deskObject = runtime.fixedSolids.find(o => o.label === 'escrivaninha');
}
export function initialize048() {
  runtime.wardrobeObject = runtime.fixedSolids.find(o => o.label === 'armario');
}
export function initialize049() {
  runtime.chimneyObject = runtime.fixedSolids.find(o => o.label === 'chamine');
}
export function initialize050() {
  runtime.saveKey = 'orla-v20-aventura';
}
export function initialize051() {
  runtime.lastSaveData = '';
  runtime.houseContext = null;
  runtime.saveFailureShown = false;
  runtime.lastPositionSaveAt = 0;
  runtime.lastSavedPosition = {
    x: runtime.player.x,
    z: runtime.player.z
  };
}
export function initialize052() {
  runtime.saveStatus = document.getElementById('saveStatus');
}
export function markSaveStatus(ok) {
  if (!runtime.saveStatus) return;
  runtime.saveStatus.textContent = ok ? '● Salvo no navegador' : '● Exportar para preservar';
  runtime.saveStatus.style.color = ok ? '#c4ddc2' : '#ffd39c';
}
export function serializeObject(o) {
  return serializeFurniture(o);
}
export function applyObjectState(list, saved) {
  restoreFurniture(list,saved);
}
export function saveGame() {
  if (runtime.mapTransitionPending) return;
  if (runtime.houseContext) return;
  try {
    const payload = JSON.stringify({
      schemaVersion: 3,
      itemInstancesVersion: 1,
      campaign:runtime.campaign,
      combat:runtime.combat,
      architecture: {stair:runtime.stairArea,houseFinish:runtime.houseFinish,baseFloorFinish:runtime.baseFloorFinish,constructionPreferences:runtime.constructionPreferences},
      storey: {upper:!!runtime.secondFloor,stairs:!!runtime.onStairs,elevation:runtime.player.elevation},
      addedWindows: runtime.game.addedWindows || [],
      handItem: runtime.handItem,
      door: runtime.game.door,
      chest: runtime.game.chest,
      loot: runtime.game.loot,
      deskLoot: runtime.game.deskLoot,
      items: runtime.game.items,
      booksTaken: runtime.game.booksTaken,
      booksLeft: runtime.game.booksLeft,
      lamps: runtime.game.lamps,
      rug: runtime.game.rug,
      droppedItems: runtime.game.droppedItems,
      placedDeskBook: runtime.game.placedDeskBook,
      placedDeskPaper: runtime.game.placedDeskPaper,
      stores: runtime.game.stores,
      drawerOpen: runtime.game.drawerOpen,
      fixedMovables: runtime.fixedSolids.filter(o => o.movable).map(runtime.serializeObject),
      pushables: runtime.pushables.map(runtime.serializeObject),
      editDecor: runtime.editDecor,
      role: runtime.role,
      looks: runtime.looks,
      godPresence: runtime.godPresence,
      gathering: runtime.gathering,
      houseBlueprint: runtime.houseOneBlueprint,
      toolsSeeded: true,
      equipment: runtime.equipment,
      shelfRows: runtime.shelfRows,
      layoutVersion: 45,
      fireplace: runtime.game.fireplace,
      playerPosition: {
        x: runtime.player.x,
        z: runtime.player.z
      },
      savedAt: new Date().toISOString()
    });
    runtime.lastSaveData = payload;
    try {
      localStorage.setItem(runtime.saveKey, payload);
      runtime.markSaveStatus(true);
    } catch (err) {
      runtime.markSaveStatus(false);
      if (!runtime.saveFailureShown) {
        runtime.saveFailureShown = true;
        console.warn('Falha ao salvar localmente:', err);
      }
    }
  } catch (err) {
    runtime.markSaveStatus(false);
    console.warn('Falha ao serializar a partida:', err);
  }
}
export function transferLegacy(type, origin) {
  const i = runtime.game.stores[origin].indexOf(type);
  if (i >= 0) {
    runtime.game.stores[origin].splice(i, 1);
    runtime.game.stores.inventory.push(type);
  }
}
export function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem(runtime.saveKey) || localStorage.getItem('orla-v19-aventura') || localStorage.getItem('orla-v18-aventura') || localStorage.getItem('orla-v16-aventura') || 'null');
    if (!data) return;
    runtime.hasLoadedSave=true;runtime.savedCombat=data.combat;runtime.campaign=data.campaign;
    if(data.architecture)runtime.savedArchitecture=data.architecture;
    if(data.storey)runtime.savedStorey=data.storey;
    runtime.game.addedWindows=Array.isArray(data.addedWindows)?data.addedWindows.filter(o=>o&&['north','south','east','west'].includes(o.side)&&Number.isFinite(o.u)&&Number.isFinite(o.w)&&o.u>=0&&o.w>0&&o.u+o.w<=(['north','south'].includes(o.side)?10:5)).map(o=>({...o})):[];
    if (data.handItem && runtime.ITEM_SPEC[data.handItem.type]) runtime.handItem=data.handItem;
    if (['god','traveler'].includes(data.role)) runtime.role=data.role;
    if (data.stores) {
      for (const id of Object.keys(runtime.game.stores)) if (Array.isArray(data.stores[id])) runtime.game.stores[id] = data.stores[id].filter(t => runtime.ITEM_SPEC[t]);
      if (Array.isArray(data.drawerOpen)) runtime.game.drawerOpen = data.drawerOpen.map(Boolean).slice(0, 2);
      if (runtime.game.drawerOpen[0] && runtime.game.drawerOpen[1]) runtime.game.drawerOpen[1] = false;
    } else {
      if (data.loot?.coins) runtime.transferLegacy('coins', 'chest');
      if (data.loot?.gem) runtime.transferLegacy('gem', 'chest');
      if (data.deskLoot?.paper) runtime.transferLegacy('paper', 'drawerTop');
      if (data.deskLoot?.book) runtime.transferLegacy('deskBook', 'drawerBottom');
      for (let i = 0; i < Math.min(6, Number(data.booksTaken) || 0); i++) runtime.transferLegacy('book', 'shelf');
      if (data.rug?.collected) runtime.transferLegacy('rug', 'floor');
    }
    for (const k of ['door', 'chest', 'loot', 'deskLoot', 'items', 'fireplace']) if (data[k]) Object.assign(runtime.game[k], data[k]);
    // Migra as chaves das versões antigas, que só tinham os dois booleanos.
    // Uma chave largada/guardada já existente em stores NÃO é duplicada.
    for (const kind of ['house', 'chest']) {
      const key = kind + 'Key';
      if (runtime.game.items[key] && runtime.handItem?.type!==key && !Object.values(data.equipment || runtime.equipment).includes(key) && !Object.values(runtime.game.stores).some(a => a.includes(key))) runtime.game.stores.inventory.push(key);
    }
    if (data.rug) Object.assign(runtime.game.rug, data.rug);
    if (Array.isArray(data.droppedItems)) runtime.game.droppedItems = data.droppedItems.filter(o => o && runtime.ITEM_SPEC[o.type] && Number.isFinite(o.x) && Number.isFinite(o.z));
    runtime.game.placedDeskBook = !!data.placedDeskBook;
    runtime.game.placedDeskPaper = !!data.placedDeskPaper;
    if (Number.isFinite(data.booksTaken)) runtime.game.booksTaken = data.booksTaken;
    if (Number.isFinite(data.booksLeft)) runtime.game.booksLeft = data.booksLeft;
    if (Array.isArray(data.lamps) && data.lamps.length === 2) runtime.game.lamps = data.lamps.map(Boolean);
    runtime.applyObjectState(runtime.fixedSolids.filter(o => o.movable), data.fixedMovables);
    runtime.applyObjectState(runtime.pushables, data.pushables);
    // Restauração pontual solicitada: corrige UMA vez o layout invertido nas versões 0.36–0.38.
    // Preserva itens, fichas, casas criadas, fechaduras e demais dados da partida.
    if (!data.layoutVersion || data.layoutVersion < 39) {
      Object.assign(runtime.fixedSolids.find(o => o.label === 'cama'), {
        x: .12,
        z: .20,
        rot: 0
      });
      Object.assign(runtime.fixedSolids.find(o => o.label === 'armario'), {
        x: 6.10,
        z: .34,
        rot: 0
      });
      Object.assign(runtime.fixedSolids.find(o => o.label === 'bau'), {
        x: .20,
        z: 4.15,
        rot: 2
      });
      Object.assign(runtime.fixedSolids.find(o => o.label === 'escrivaninha'), {
        x: 4.30,
        z: 4.10,
        rot: 0
      });
      Object.assign(runtime.fixedSolids.filter(o => o.label === 'luminaria')[0], {
        x: .61,
        z: 2.21
      });
      Object.assign(runtime.fixedSolids.filter(o => o.label === 'luminaria')[1], {
        x: 6.17,
        z: 3.79
      });
      Object.assign(runtime.pushables.find(o => o.label === 'mesa'), {
        x: 5.64,
        z: 4.05,
        rot: 0
      });
      Object.assign(runtime.pushables.find(o => o.label === 'banquinho'), {
        x: 4.87,
        z: 3.58,
        rot: 0
      });
    }
    // Correção pontual v0.45: cama no canto original e estante afastada da lareira.
    // Somente estes dois móveis são corrigidos, preservando todo o restante da partida.
    if (!data.layoutVersion || data.layoutVersion < 45) {
      const bed = runtime.fixedSolids.find(o => o.label === 'cama');
      const shelf = runtime.fixedSolids.find(o => o.label === 'armario');
      if (bed) Object.assign(bed, {
        x: .12,
        z: .20,
        rot: 0
      });
      if (shelf) Object.assign(shelf, {
        x: 7.55,
        z: .28,
        rot: 0
      });
    }
    if (data.playerPosition && Number.isFinite(data.playerPosition.x) && Number.isFinite(data.playerPosition.z)) {
      const {
        x,
        z
      } = data.playerPosition;
      if (x > -12 && x < 20 && z > -10 && z < 18) {
        runtime.player.x = x;
        runtime.player.z = z;
      }
    }
    if (data.looks) for (const kind of ['traveler', 'god']) if (data.looks[kind]) {
      runtime.looks[kind].avatar=data.looks[kind].avatar==='combatente'?'combatente':'original';
      for (const k of Object.keys(runtime.looks[kind])) if (typeof data.looks[kind][k] === 'string') runtime.looks[kind][k] = data.looks[kind][k];
    }
    if (['normal', 'translucent', 'invisible', 'ethereal'].includes(data.godPresence)) runtime.godPresence = data.godPresence;
    if (data.gathering) {
      if (Array.isArray(data.gathering.trees)) data.gathering.trees.forEach((v, i) => {
        if (runtime.gathering.trees[i] && v) Object.assign(runtime.gathering.trees[i], v);
      });
      if (Array.isArray(data.gathering.rocks)) data.gathering.rocks.forEach((v, i) => {
        if (runtime.gathering.rocks[i] && v) Object.assign(runtime.gathering.rocks[i], v);
      });
      if (data.gathering.mound) Object.assign(runtime.gathering.mound, data.gathering.mound);
      if (['axe', 'pickaxe', 'shovel'].includes(data.gathering.activeTool)) runtime.gathering.activeTool = data.gathering.activeTool;
    }
    if (Array.isArray(data.editDecor)) {
      data.editDecor.filter(o => o && typeof o.kind === 'string' && Number.isFinite(o.x) && Number.isFinite(o.z)).forEach(o => runtime.editDecor.push(o));
    }
    if (data.equipment && typeof data.equipment === 'object') {
      for (const k of ['clothing', 'left', 'right', 'backpack']) if (data.equipment[k] === null || typeof data.equipment[k] === 'string') runtime.equipment[k] = data.equipment[k];
    }
    if (Array.isArray(data.shelfRows) && data.shelfRows.length === 3) {
      for (let i = 0; i < 3; i++) runtime.shelfRows[i] = Math.max(0, Math.floor(data.shelfRows[i] || 0));
    }
    if (!data.equipment) {
      const hasLegacyTools = ['axe', 'pickaxe', 'shovel'].some(t => runtime.game.stores.inventory.includes(t));
      if (hasLegacyTools) {
        runtime.equipment.backpack = 'backpack';
      }
    }
    // Remove ferramentas duplicadas de mapas antigos quando já estiverem carregadas.
    for (const t of ['axe', 'pickaxe', 'shovel', 'backpack']) if (!data.itemInstancesVersion && runtime.game.stores.inventory.includes(t)) {
      const idx = runtime.game.droppedItems.findIndex(o => o.type === t);
      if (idx >= 0) {
        runtime.game.droppedItems.splice(idx, 1);
        const fi = runtime.game.stores.floor.indexOf(t);
        if (fi >= 0) runtime.game.stores.floor.splice(fi, 1);
      }
    }
  } catch (_) {}
}
export function initialize053() {
  runtime.loadGame();
}
export function initialize054() {
  runtime.syncLegacyItems();
  // Restitui objetos físicos ao cenário em partidas anteriores à criação do equipamento.
}
export function initialize055() {
  if(runtime.campaign?.scenes?.find(o=>o.id===runtime.campaign.active)?.biome!==undefined && runtime.campaign.scenes.find(o=>o.id===runtime.campaign.active).biome!=="meadow")return;
  for (const entry of runtime.initialEquipmentDrops) {
    const type = entry.type;
    const equipped = Object.values(runtime.equipment).includes(type);
    const inStores = Object.values(runtime.game.stores).some(a => a.includes(type));
    const onGround = runtime.game.droppedItems.some(o => o.type === type);
    if (!equipped && !inStores && !onGround && runtime.handItem?.type !== type) {
      runtime.game.droppedItems.push({
        ...entry
      });
      runtime.game.stores.floor.push(type);
    }
  }
}
export function initialize056() {
  if (!runtime.shelfRows.some(Boolean) && runtime.game.stores.shelf.includes('book')) runtime.shelfRows[0] = runtime.game.stores.shelf.filter(t => t === 'book').length;
}
export function initialize057() {
  runtime.syncShelf = () => {
    const n = runtime.game.stores.shelf.filter(t => t === 'book').length;
    let q = runtime.shelfRows.reduce((a, b) => a + b, 0);
    if (q < n) runtime.shelfRows[0] += n - q;else if (q > n) {
      let diff = q - n;
      for (let r = 2; r >= 0; r--) {
        const d = Math.min(diff, runtime.shelfRows[r]);
        runtime.shelfRows[r] -= d;
        diff -= d;
      }
    }
  };
}
export function initialize058() {
  runtime.syncShelf();
}
export function initialize059() {
  try {
    localStorage.setItem('orla-blueprint-casa-1', JSON.stringify(runtime.houseModels.house1));
    localStorage.setItem('orla-blueprint-casa-2', JSON.stringify(runtime.houseModels.house2));
  } catch (_) {}
}
export function initialize060() {
  runtime.doorSwing = runtime.game.door.open ? 1 : 0;
}
export function initialize061() {
  runtime.toastTimer = 0;
}
export function toast(msg) {
  runtime.toastEl.textContent = msg;
  runtime.toastEl.classList.add('on');
  clearTimeout(runtime.toastTimer);
  runtime.toastTimer = setTimeout(() => runtime.toastEl.classList.remove('on'), 2300);
}
export function exportSaveFile() {
  runtime.saveGame();
  const json = runtime.lastSaveData || (() => {
    try {
      return localStorage.getItem(runtime.saveKey);
    } catch (_) {
      return null;
    }
  })();
  if (!json) return runtime.toast('Não foi possível criar a cópia da partida.');
  const blob = new Blob([json], {
      type: 'application/json'
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = 'orla_partida_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
  runtime.toast('Arquivo de partida exportado.');
}
