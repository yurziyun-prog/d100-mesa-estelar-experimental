// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
import {transformPoint,footprintBounds} from '../physics/footprint.js';

export function chestPos() {
  return {
    x: runtime.chestObject.x + runtime.chestObject.w / 2,
    z: runtime.chestObject.z + runtime.chestObject.d / 2
  };
}
export function canPlaceChest(x, z) {
  const c = runtime.chestObject,
    o = c,
    nx = x - c.w / 2,
    nz = z - c.d / 2,
    test = {
      ...o,
      x: nx,
      z: nz,
      w: c.w,
      d: c.d
    };
  if (!runtime.insideBoundsForObject(nx, nz, c.w, c.d) || runtime.hitsInteriorWallRect(test)) return false;
  if (runtime.wallBarriers().some(w => runtime.rectRect(test, w))) return false;
  if (runtime.fixedSolids.some(o => o !== c && runtime.rectRect(test, o))) return false;
  if (runtime.pushables.some(o => runtime.rectRect(test, o))) return false;
  if (runtime.circleRect(runtime.player.x, runtime.player.z, runtime.player.r + .12, test)) return false;
  return true;
}
export function canRotateObject(o) {
  return ['bau', 'escrivaninha', 'mesa', 'armario', 'banquinho', 'cama'].includes(o.label);
}
export function canPlaceObjectAt(o, x, z, ignorePlayer = false) {
  const nx = x - o.w / 2,
    nz = z - o.d / 2,
    test = {
      ...o,
      x: nx,
      z: nz,
      w: o.w,
      d: o.d
    };
  const bounds = footprintBounds(test);
  if (!runtime.insideBoundsForObject(bounds.x, bounds.z, bounds.w, bounds.d) || runtime.hitsInteriorWallRect(test)) return false;
  if (runtime.wallBarriers().some(w => runtime.rectRect(test, w))) return false;
  if (runtime.fixedSolids.some(s => s !== o && runtime.rectRect(test, s))) return false;
  if (runtime.pushables.some(s => s !== o && runtime.rectRect(test, s))) return false;
  if (!ignorePlayer && runtime.circleRect(runtime.player.x, runtime.player.z, runtime.player.r + .12, test)) return false;
  return true;
}
export function encostarParede(o) {
  // Testa cada parede externa com uma pequena folga visual, sem diminuir cômodos.

  const oldX = o.x,
    oldZ = o.z;
  const offsets = [0, -.10, .10, -.23, .23, -.38, .38];
  const candidates = [];
  for (const along of offsets) {
    candidates.push({
      x: .08,
      z: runtime.clamp(oldZ + along, .08, 4.92 - o.d)
    });
    candidates.push({
      x: 6.92 - o.w,
      z: runtime.clamp(oldZ + along, .08, 4.92 - o.d)
    });
    candidates.push({
      x: runtime.clamp(oldX + along, .08, 6.92 - o.w),
      z: .08
    });
    candidates.push({
      x: runtime.clamp(oldX + along, .08, 6.92 - o.w),
      z: 4.92 - o.d
    });
  }
  candidates.sort((a, b) => Math.hypot(a.x - oldX, a.z - oldZ) - Math.hypot(b.x - oldX, b.z - oldZ));
  for (const pos of candidates) {
    if (runtime.canPlaceObjectAt(o, pos.x + o.w / 2, pos.z + o.d / 2)) {
      o.x = pos.x;
      o.z = pos.z;
      runtime.saveGame();
      runtime.toast('Móvel encostado à parede.');
      return;
    }
  }
  runtime.toast('Esta parede está ocupada. Reposicione outro móvel primeiro.');
}
export function startPlaceObject(o) {
  if (!runtime.canReachObject(o)) {
    runtime.toast('Aproxime-se do móvel para movê-lo.');
    return;
  }
  runtime.placingObject = o;
  runtime.target = null;
  runtime.toast('Clique no chão para reposicionar ' + (o.label === 'bau' ? 'o baú' : 'o móvel') + '. Esc cancela.');
}
export function rotateObjectBy(o, degrees) {
  if (!runtime.canRotateObject(o) || !runtime.canReachObject(o, 1.45)) {
    runtime.toast('Aproxime-se do móvel.');
    return false;
  }
  const old = {
      x: o.x,
      z: o.z,
      w: o.w,
      d: o.d,
      rot: o.rot || 0,
      angle: o.angle
    };
  const cx = o.x + o.w / 2,
    cz = o.z + o.d / 2;
  // Preserve the received mesh and rotate every detail around its centre.
  o.angle = ((Number.isFinite(o.angle) ? o.angle : (o.rot || 0) * 90) + degrees + 360) % 360;
  const shifts = [[0, 0], [.07, 0], [-.07, 0], [0, .07], [0, -.07], [.16, 0], [-.16, 0], [0, .16], [0, -.16], [.28, 0], [-.28, 0], [0, .28], [0, -.28], [.38, 0], [-.38, 0], [0, .38], [0, -.38]];
  for (const [dx, dz] of shifts) {
    o.x = cx + dx - o.w / 2;
    o.z = cz + dz - o.d / 2;
    if (runtime.canPlaceObjectAt(o, cx + dx, cz + dz, true)) {
      runtime.saveGame();
      runtime.toast('Móvel girado ' + degrees + '°.');
      return true;
    }
  }
  Object.assign(o, old);
  runtime.toast('Não há espaço para girar aqui.');
  return false;
}
export function rotateObject90(o) {
  return runtime.rotateObjectBy(o, 90);
}
export function objectAtScreen(mx, my) {
  const objs = [...runtime.pushableObjects()];
  const hits = [];
  for (const o of objs) {
    const p = o.x,
      q = o.z,
      w = o.w,
      d = o.d,
      h = o.h;
    const project=v=>runtime.P(...transformPoint(o,...v));
    const polyTop = [[p, q, h], [p + w, q, h], [p + w, q + d, h], [p, q + d, h]].map(project);
    const faces = [[[p, q, 0], [p + w, q, 0], [p + w, q, h], [p, q, h]], [[p, q + d, 0], [p + w, q + d, 0], [p + w, q + d, h], [p, q + d, h]], [[p, q, 0], [p, q + d, 0], [p, q + d, h], [p, q, h]], [[p + w, q, 0], [p + w, q + d, 0], [p + w, q + d, h], [p + w, q, h]]];
    if (runtime.inScreenPoly([mx, my], polyTop) || faces.some(face => runtime.inScreenPoly([mx, my], face.map(project)))) hits.push(o);
  }
  hits.sort((a, b) => runtime.painterDepth(b.x + b.w / 2, b.z + b.d / 2) - runtime.painterDepth(a.x + a.w / 2, a.z + a.d / 2));
  return hits[0] || null;
}
export function storageDialog(id, title) {
  if (!runtime.requireStore(id)) return;
  const contents=runtime.game.stores[id],types=[...new Set(contents)];
  runtime.showDialog(title,'Ocupação: '+runtime.storeLoad(id).toFixed(1)+' / '+runtime.STORAGE_LIMIT[id]+' L. Arraste para a mochila ou clique com o botão direito.',[]);
  runtime.activeStorage={id,title};runtime.dialog.classList.add('storage-open');
  for(const type of types){const button=document.createElement('button');button.type='button';button.textContent=runtime.itemLabel(type);button.dataset.item=type;button.draggable=true;button.title='Arrastar ou botão direito para enviar à mochila';
   button.oncontextmenu=e=>{e.preventDefault();if(runtime.transferItem(id,'inventory',type))runtime.storageDialog(id,title);};
   button.ondragstart=e=>{e.dataTransfer.setData('application/x-orla-source',JSON.stringify({from:id,type}));e.dataTransfer.effectAllowed='move';};runtime.dialogChoices.append(button);
  }
  if(runtime.canOpenBackpack()){runtime.inventory.classList.add('open');runtime.inventoryDraw();}
  runtime.dialog.ondragover=e=>{if(e.dataTransfer.types.includes('text/plain'))e.preventDefault();};
  runtime.dialog.ondrop=e=>{e.preventDefault();const type=e.dataTransfer.getData('text/plain');if(runtime.ITEM_SPEC[type]&&runtime.transferItem('inventory',id,type))runtime.storageDialog(id,title);};
}
export function drawerDialog(index) {
  if (!runtime.canReachObject(runtime.deskObject)) return runtime.toast('Aproxime-se da escrivaninha.');
  runtime.toggleDrawer(index);
}
export function toggleDrawer(index, showToast = true) {
  if (!runtime.canReachObject(runtime.deskObject)) {
    runtime.toast('Aproxime-se da escrivaninha.');
    return false;
  }
  if (runtime.game.drawerOpen[index]) {
    runtime.game.drawerOpen[index] = false;
    runtime.saveGame();
    if (showToast) runtime.toast('Gaveta ' + (index + 1) + ' fechada.');
    return true;
  }
  if (index === 1 && runtime.game.drawerOpen[0]) {
    runtime.toast('Feche a gaveta superior primeiro.');
    return false;
  }
  runtime.game.drawerOpen[index] = true;
  runtime.saveGame();
  if (showToast) runtime.toast('Gaveta ' + (index + 1) + ' aberta.');
  return true;
}
export function drawerFrontAtClick(mx, my) {
  if (!runtime.canReachObject(runtime.deskObject) || Math.cos(runtime.cameraYaw) - Math.sin(runtime.cameraYaw) >= -.015) return -1;
  const o = runtime.deskObject,
    {
      x,
      z,
      w,
      h
    } = o;
  for (let n = 0; n < 2; n++) {
    const frontZ = z + .045 - (runtime.game.drawerOpen[n] ? .29 : 0),
      height = h - .28 - n * .19;
    const front = [[x + w - .36, frontZ, height - .075], [x + w - .035, frontZ, height - .075], [x + w - .035, frontZ, height + .145], [x + w - .36, frontZ, height + .145]].map(v => runtime.P(...v));
    if (runtime.inScreenPoly([mx, my], front)) return n;
    if (runtime.game.drawerOpen[n]) {
      const side = [[x + w - .35, frontZ, height - .075], [x + w - .35, frontZ + .29, height - .075], [x + w - .35, frontZ + .29, height + .08], [x + w - .35, frontZ, height + .08]].map(v => runtime.P(...v));
      if (runtime.inScreenPoly([mx, my], side)) return n;
    }
  }
  return -1;
}
export function bookshelfDialog() {
  if (!runtime.canReachObject(runtime.wardrobeObject)) {
    runtime.toast('Aproxime-se da estante.');
    return;
  }
  const choices = [{
    label: 'Ver livros e guardar',
    action: () => runtime.storageDialog('shelf', 'Estante de livros')
  }];
  if (runtime.game.stores.shelf.length === 0) choices.push({
    label: 'Reposicionar',
    action: () => runtime.repositionMenu(runtime.wardrobeObject)
  });
  runtime.showDialog('Estante', runtime.game.stores.shelf.length + ' livros/itens nas prateleiras.', choices);
}
export function deskDialog() {
  if (!runtime.canReachObject(runtime.deskObject)) {
    runtime.toast('Aproxime-se da escrivaninha.');
    return;
  }
  const choices = [{
    label: (runtime.game.drawerOpen[0] ? 'Fechar' : 'Abrir') + ' gaveta superior',
    action: () => runtime.toggleDrawer(0)
  }, {
    label: (runtime.game.drawerOpen[1] ? 'Fechar' : 'Abrir') + ' gaveta inferior',
    action: () => runtime.toggleDrawer(1)
  }, {
    label: 'Objetos sobre o tampo',
    action: () => runtime.storageDialog('deskTop', 'Tampo da escrivaninha')
  }, {
    label: 'Reposicionar',
    action: () => runtime.repositionMenu(runtime.deskObject)
  }];
  runtime.showDialog('Escrivaninha', 'Escolha uma gaveta ou examine o tampo.', choices);
}
export function repositionMenu(o) {
  if (!runtime.canReachObject(o)) {
    runtime.toast('Aproxime-se do móvel.');
    return;
  }
  if (o.label === 'armario' && runtime.game.booksLeft > 0) {
    runtime.toast('Retire os livros antes de reposicionar a estante.');
    return;
  }
  const opts = [{
    label: 'Mover',
    action: () => runtime.startPlaceObject(o)
  }];
  if (runtime.canRotateObject(o)) {
    opts.push({
      label: 'Girar 90°',
      action: () => runtime.rotateObjectBy(o, 90)
    });
    opts.push({
      label: 'Girar 180°',
      action: () => runtime.rotateObjectBy(o, 180)
    });
  }
  runtime.showDialog('Reposicionar', 'Mover ou girar ' + ({
    bau: 'baú',
    armario: 'estante',
    cama: 'cama',
    escrivaninha: 'escrivaninha',
    mesa: 'mesa',
    banquinho: 'banquinho',
    luminaria: 'luminária'
  }[o.label] || 'objeto') + '.', opts);
}
export function objectContextMenu(o, lockMode = false) {
  if (!o || !runtime.canReachObject(o)) return runtime.toast('Aproxime-se do objeto.');
  if (o.label === 'bau') return runtime.quickChestAction(lockMode);
  if (o.label === 'luminaria') {
    const i = runtime.fixedSolids.filter(v => v.label === 'luminaria').indexOf(o);
    runtime.toggleLamp(i);
    return;
  }
  if (o.label === 'escrivaninha') return runtime.toast('Clique com o direito nas gavetas para abrir ou fechar. Use Tab para mover.');
  if (o.label === 'armario') return runtime.toast('Clique com o direito sobre um livro para pegá-lo. Use Tab para mover a estante.');
  if (o.label === 'chamine') {
    if (runtime.handItem && runtime.handItem.type === 'wood') {
      runtime.game.fireplace.wood++;
      runtime.game.fireplace.burn = (runtime.game.fireplace.burn || 0) + 42;
      runtime.handItem = null;
      runtime.saveGame();
      runtime.toast('Lenha colocada na lareira.');
      return;
    }
    if (runtime.game.fireplace.wood > 0) {
      runtime.game.fireplace.lit = !runtime.game.fireplace.lit;
      if (runtime.game.fireplace.lit && runtime.game.fireplace.burn <= 0) runtime.game.fireplace.burn = 42;
      runtime.saveGame();
      return runtime.toast(runtime.game.fireplace.lit ? 'Fogo aceso.' : 'Fogo apagado.');
    }
    return runtime.toast('Leve lenha até a lareira para acendê-la.');
  }
  runtime.toast('Use Tab para selecionar, girar ou mover este objeto.');
}
export function nearDoor() {
  return runtime.near(3.64, 5, 1.32);
}
export function doorCanClose() {
  return !runtime.circleRect(runtime.player.x, runtime.player.z, runtime.player.r + .14, {
    x: 3.05,
    z: 4.90,
    w: 1.18,
    d: .20
  }) && !runtime.circleRect(runtime.player.x, runtime.player.z, runtime.player.r + .07, {
    x: 3.05 - runtime.DOOR_THICKNESS / 2,
    z: 3.98,
    w: runtime.DOOR_THICKNESS,
    d: 1.02
  });
}
export function quickDoorAction(lockMode = false) {
  if (!runtime.nearDoor()) return runtime.toast('Aproxime-se da porta para interagir.');
  if (lockMode) {
    if (runtime.game.door.open) return runtime.toast('Feche a porta antes de trancá-la.');
    if (!runtime.godMode() && !runtime.keyHeld('house')) return runtime.toast('Você precisa estar com a chave da casa.');
    runtime.game.door.locked = !runtime.game.door.locked;
    runtime.saveGame();
    return runtime.toast(runtime.game.door.locked ? 'Porta trancada.' : 'Porta destrancada.');
  }
  if (runtime.game.door.locked) {
    if (!runtime.godMode() && !runtime.keyHeld('house')) return runtime.toast('A porta está trancada.');
    runtime.game.door.locked = false;
    runtime.game.door.open = true;
    runtime.saveGame();
    return runtime.toast('Você destrancou e abriu a porta.');
  }
  if (runtime.game.door.open) {
    if (!runtime.doorCanClose()) return runtime.toast('Afaste-se do vão antes de fechar a porta.');
    runtime.game.door.open = false;
    runtime.saveGame();
    return runtime.toast('Porta fechada.');
  }
  runtime.game.door.open = true;
  runtime.saveGame();
  return runtime.toast('Porta aberta.');
}
export function doorDialog() {
  if (!runtime.nearDoor()) {
    runtime.toast('Aproxime-se da porta para interagir.');
    return;
  }
  if (runtime.game.door.open) {
    runtime.showDialog('Porta da casa', 'A porta está aberta.', [{
      label: 'Fechar',
      action: () => {
        if (!runtime.doorCanClose()) {
          runtime.toast('Afaste-se do vão antes de fechar a porta.');
          return;
        }
        runtime.game.door.open = false;
        runtime.saveGame();
        runtime.toast('Você fechou a porta.');
      }
    }, {
      label: 'Cancelar'
    }]);
    return;
  }
  if (runtime.game.door.locked) {
    if (!runtime.keyHeld('house')) {
      runtime.showDialog('Porta trancada', 'A fechadura não cede. Você precisa ter a chave dourada consigo.', [{
        label: 'Entendido'
      }]);
      return;
    }
    runtime.showDialog('Porta trancada', 'Você tem a chave da casa no inventário.', [{
      label: 'Destrancar',
      action: () => {
        if (!runtime.keyHeld('house')) return runtime.toast('Você não está com a chave da casa.');
        runtime.game.door.locked = false;
        runtime.saveGame();
        runtime.toast('A fechadura abriu. Agora você pode abrir a porta.');
      }
    }, {
      label: 'Cancelar'
    }]);
    return;
  }
  runtime.showDialog('Porta destrancada', 'Você pode abrir a porta ou trancá-la novamente.', [{
    label: 'Abrir',
    action: () => {
      runtime.game.door.open = true;
      runtime.saveGame();
      runtime.toast('Porta aberta. Agora você pode entrar.');
    }
  }, {
    label: 'Trancar',
    action: () => {
      runtime.game.door.locked = true;
      runtime.saveGame();
      runtime.toast('Porta trancada.');
    }
  }, {
    label: 'Cancelar'
  }]);
}
export function pickKey(kind) {
  const pos = runtime.game.groundKeys[kind],
    code = kind + 'Key';
  if (!runtime.godMode() && !runtime.near(pos.x, pos.z, 1.15)) return runtime.toast('Aproxime-se da chave.');
  if (runtime.game.items[code] || Object.values(runtime.game.stores).some(a => a.includes(code))) return;
  runtime.game.items[code] = true;
  runtime.game.stores.inventory.push(code);
  runtime.saveGame();
  runtime.inventoryDraw();
  runtime.toast('Chave guardada no inventário.');
}
export function collectChestItem(kind) {
  if (!runtime.game.chest.open || runtime.game.loot[kind]) return;
  runtime.game.loot[kind] = true;
  runtime.saveGame();
  runtime.inventoryDraw();
  runtime.toast(kind === 'coins' ? '12 moedas adicionadas ao inventário.' : 'Cristal azul adicionado ao inventário.');
}
export function quickChestAction(lockMode = false) {
  if (!runtime.godMode() && (!runtime.inside(runtime.player.x, runtime.player.z) || !runtime.near(runtime.chestPos().x, runtime.chestPos().z, 1.35))) return runtime.toast('Chegue mais perto do baú.');
  if (lockMode) {
    if (runtime.game.chest.open) return runtime.toast('Feche o baú antes de trancá-lo.');
    if (!runtime.godMode() && !runtime.keyHeld('chest')) return runtime.toast('Você precisa estar com a chave do baú.');
    runtime.game.chest.locked = !runtime.game.chest.locked;
    runtime.saveGame();
    return runtime.toast(runtime.game.chest.locked ? 'Baú trancado.' : 'Baú destrancado.');
  }
  if (runtime.game.chest.locked) {
    if (!runtime.godMode() && !runtime.keyHeld('chest')) return runtime.toast('O baú está trancado.');
    runtime.game.chest.locked = false;
    runtime.game.chest.open = true;
    runtime.saveGame();
    runtime.storageDialog('chest','Baú');return;
  }
  runtime.game.chest.open = !runtime.game.chest.open;
  runtime.saveGame();
  if(runtime.game.chest.open)return runtime.storageDialog('chest','Baú');
  runtime.closeDialog();return runtime.toast('Baú fechado.');
}
export function chestDialog() {
  if (!runtime.inside(runtime.player.x, runtime.player.z) || !runtime.near(runtime.chestPos().x, runtime.chestPos().z, 1.35)) {
    runtime.toast('Chegue mais perto do baú.');
    return;
  }
  const choices = [];
  if (runtime.game.chest.locked) {
    if (runtime.keyHeld('chest')) choices.push({
      label: 'Destrancar',
      action: () => {
        if (!runtime.keyHeld('chest')) return runtime.toast('Você não está com a chave do baú.');
        runtime.game.chest.locked = false;
        runtime.saveGame();
        runtime.toast('Baú destrancado.');
      }
    });else choices.push({
      label: 'Examinar fechadura',
      action: () => runtime.toast('É necessária a chave do baú.')
    });
  } else if (runtime.game.chest.open) {
    choices.push({
      label: 'Ver conteúdo / guardar itens',
      action: () => runtime.storageDialog('chest', 'Interior do baú')
    });
    choices.push({
      label: 'Fechar',
      action: () => {
        runtime.game.chest.open = false;
        runtime.saveGame();
      }
    });
  } else {
    choices.push({
      label: 'Abrir',
      action: () => {
        runtime.game.chest.open = true;
        runtime.saveGame();
      }
    });
    choices.push({
      label: 'Trancar',
      action: () => {
        runtime.game.chest.locked = true;
        runtime.saveGame();
      }
    });
  }
  choices.push({
    label: 'Reposicionar',
    action: () => runtime.repositionMenu(runtime.chestObject)
  });
  runtime.showDialog('Baú', runtime.game.chest.locked ? 'Baú trancado.' : runtime.game.chest.open ? 'Baú aberto, capacidade de 65 litros.' : 'Baú fechado.', choices);
}
export function interact() {
  if (runtime.inside(runtime.player.x, runtime.player.z)) {
    for (let i = 0; i < 2; i++) {
      const lamp = runtime.fixedSolids.filter(o => o.label === 'luminaria')[i];
      const lx = lamp.x + lamp.w / 2,
        lz = lamp.z + lamp.d / 2;
      if (runtime.near(lx, lz, .53)) {
        runtime.toggleLamp(i);
        return;
      }
    }
  }
  if (runtime.nearDoor()) {
    runtime.quickDoorAction();
    return;
  }
  if (!runtime.game.items.houseKey && runtime.near(runtime.game.groundKeys.house.x, runtime.game.groundKeys.house.z, 1.15)) {
    runtime.pickKey('house');
    return;
  }
  if (!runtime.game.items.chestKey && runtime.near(runtime.game.groundKeys.chest.x, runtime.game.groundKeys.chest.z, 1)) {
    runtime.pickKey('chest');
    return;
  }
  if ((runtime.godMode() || runtime.inside(runtime.player.x, runtime.player.z)) && runtime.near(runtime.chestPos().x, runtime.chestPos().z, 1.25)) {
    runtime.quickChestAction();
    return;
  }
  if (runtime.near(runtime.wardrobeObject.x + .2, runtime.wardrobeObject.z + .7, 1.1) && runtime.inside(runtime.player.x, runtime.player.z)) {
    runtime.toast('Pegue livros com o botão direito.');
    return;
  }
  if (runtime.inside(runtime.player.x, runtime.player.z)) {
    runtime.toast('Explore a casa. Clique com o botão direito nos móveis para reposicioná-los.');
  } else runtime.toast('Procure uma chave dourada ao lado da trilha.');
}
export function inScreenPoly(pt, coords) {
  let ok = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const a = coords[i],
      b = coords[j];
    if (a[1] > pt[1] !== b[1] > pt[1] && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) ok = !ok;
  }
  return ok;
}
export function isClickedDoor(mx, my) {
  const depth = ([x, z]) => runtime.rotated(x, z).reduce((a, b) => a + b, 0);
  if (!runtime.inside(runtime.player.x, runtime.player.z) && depth([3.64, 5]) < depth([3.64, 2.5])) return false;
  // Com a porta aberta, a abertura NÃO é clicável. Só a folha girada.
  const region = runtime.game.door.open ? [runtime.P(3.05, 5, .04), runtime.P(3.05, 3.98, .04), runtime.P(3.05, 3.98, 2.60), runtime.P(3.05, 5, 2.60)] : [runtime.P(3.05, 5, 0), runtime.P(4.23, 5, 0), runtime.P(4.23, 5, 2.62), runtime.P(3.05, 5, 2.62)];
  if (!runtime.inScreenPoly([mx, my], region)) {
    const hinge = runtime.P(3.05, 5, 1.18),
      end = runtime.P(3.05 + 1.18 * Math.cos(runtime.doorSwing * Math.PI / 2), 5 - 1.18 * Math.sin(runtime.doorSwing * Math.PI / 2), 1.18);
    const dist = Math.hypot(end[0] - hinge[0], end[1] - hinge[1]);
    const t = dist ? Math.max(0, Math.min(1, ((mx - hinge[0]) * (end[0] - hinge[0]) + (my - hinge[1]) * (end[1] - hinge[1])) / (dist * dist))) : 0;
    if (!runtime.nearDoor() || Math.hypot(mx - (hinge[0] + (end[0] - hinge[0]) * t), my - (hinge[1] + (end[1] - hinge[1]) * t)) > Math.max(18, runtime.scale * runtime.zoom * .42)) return false;
  }
  // Um clique não atravessa a alvenaria que oculta visualmente a folha.
  const dd = runtime.painterDepth(3.05, 4.52);
  const fronts = [{
    dep: runtime.painterDepth(1.5, 5),
    q: [[0, 5, 0], [3.05, 5, 0], [3.05, 5, 2.92], [0, 5, 2.92]]
  }, {
    dep: runtime.painterDepth(5.6, 5),
    q: [[4.23, 5, 0], [7, 5, 0], [7, 5, 2.92], [4.23, 5, 2.92]]
  }, {
    dep: runtime.painterDepth(0, 2.5),
    q: [[0, 0, 0], [0, 5, 0], [0, 5, 2.92], [0, 0, 2.92]]
  }, {
    dep: runtime.painterDepth(7, 2.5),
    q: [[7, 0, 0], [7, 5, 0], [7, 5, 2.92], [7, 0, 2.92]]
  }, {
    dep: runtime.painterDepth(3.5, 0),
    q: [[0, 0, 0], [7, 0, 0], [7, 0, 2.92], [0, 0, 2.92]]
  }];
  if (!runtime.nearDoor() && fronts.some(f => f.dep > dd + .001 && runtime.inScreenPoly([mx, my], f.q.map(v => runtime.P(...v))))) return false;
  return true;
}
export function activateOrApproach(kind, lockMode = false) {
  const locations = {
    door: runtime.inside(runtime.player.x, runtime.player.z) ? {
      x: 3.64,
      z: 4.48
    } : {
      x: 3.64,
      z: 5.66
    },
    house: {
      ...runtime.game.groundKeys.house
    },
    chest: {
      x: runtime.chestPos().x,
      z: runtime.chestPos().z + .64
    },
    chestKey: {
      ...runtime.game.groundKeys.chest
    }
  };
  const at = locations[kind];
  if (!at) return;
  if (Math.hypot(runtime.player.x - at.x, runtime.player.z - at.z) < .78) {
    ({
      door: () => runtime.quickDoorAction(lockMode),
      house: () => runtime.pickKey('house'),
      chest: () => runtime.quickChestAction(lockMode),
      chestKey: () => runtime.pickKey('chest')
    })[kind]();
    return;
  }
  runtime.game.pending = kind;
  runtime.game.pendingLockMode = lockMode;
  runtime.target = {
    ...at
  };
  runtime.toast('Indo até ' + {
    door: 'a porta',
    house: 'a chave',
    chest: 'o baú',
    chestKey: 'a chave do baú'
  }[kind] + '…');
}
export function clickedLamp(mx, my) {
  if (!runtime.reveal()) return -1;
  for (let i = 0; i < 2; i++) {
    const lamp = runtime.fixedSolids.filter(o => o.label === 'luminaria')[i];
    const pt = runtime.P(lamp.x + lamp.w / 2, lamp.z + lamp.d / 2, 1.31);
    if (Math.hypot(mx - pt[0], my - pt[1]) < runtime.scale * runtime.zoom * .26 + 7) return i;
  }
  return -1;
}
export function groundItemAtScreen(mx, my) {
  return [...runtime.game.droppedItems].reverse().find(o => {
    const p = runtime.P(o.x, o.z, .055);
    return Math.hypot(mx - p[0], my - p[1]) <= Math.max(12, runtime.scale * runtime.zoom * .29);
  }) || null;
}
export function directPickupFloorItem(item) {
  if (!item) return false;
  const obj = runtime.game.droppedItems.find(o => o === item || o.type === item.type && Math.abs(o.x - item.x) < .001 && Math.abs(o.z - item.z) < .001);
  if (!obj) return false;
  if (runtime.canOpenBackpack() && runtime.storeCanFit('inventory', obj.type)) {
    const idx = runtime.game.droppedItems.indexOf(obj);
    if (idx >= 0) runtime.game.droppedItems.splice(idx, 1);
    const fi = runtime.game.stores.floor.indexOf(obj.type);
    if (fi >= 0) runtime.game.stores.floor.splice(fi, 1);
    runtime.game.stores.inventory.push(obj.type);
    runtime.syncLegacyItems();
    runtime.saveGame();
    runtime.inventoryDraw();
    runtime.toast(runtime.itemLabel(obj.type) + ' guardado na mochila.');
    return true;
  }
  runtime.pickItemToHand({
    from: 'floor',
    type: obj.type,
    object: obj
  });
  return true;
}
export function surfaceItemAtScreen(loc, mx, my) {
  const map = {
    table: runtime.pushables.find(o => o.label === 'mesa'),
    bed: runtime.bedObject,
    deskTop: runtime.deskObject
  };
  const o = map[loc];
  if (!o || !runtime.canReachObject(o)) return null;
  const items = runtime.game.stores[loc] || [];
  for (let i = 0; i < items.length; i++) {
    const p = runtime.P(o.x + .14 + i % 3 * .21 + .08, o.z + .14 + Math.floor(i / 3) * .23 + .06, o.h + .05);
    if (Math.hypot(mx - p[0], my - p[1]) < Math.max(12, runtime.scale * runtime.zoom * .22)) return {
      from: loc,
      type: items[i]
    };
  }
  return null;
}
export function shelfItemAtScreen(mx, my) {
  if (!runtime.canReachObject(runtime.wardrobeObject)) return null;
  const showFront = Math.cos(runtime.cameraYaw) + Math.sin(runtime.cameraYaw) < -.04;
  if (!showFront) return null;
  const x = runtime.wardrobeObject.x,
    z = runtime.wardrobeObject.z;
  let left = runtime.game.stores.shelf.filter(v => v === 'book').length;
  for (let row = 0; row < 3; row++) {
    const count = Math.min(runtime.shelfRows[row], 5);
    for (let k = 0; k < count; k++) {
      const zz = z + .12 + k * .12,
        base = .31 + row * .48,
        hi = .23 + (k + row) % 2 * .03;
      const p = runtime.P(x - .03, zz + .045, base + hi * .55);
      if (Math.hypot(mx - p[0], my - p[1]) < Math.max(12, runtime.scale * runtime.zoom * .18)) return {
        from: 'shelf',
        type: 'book',
        row: row
      };
    }
  }
  return null;
}
export function rugAtScreen(mx, my) {
  if (!runtime.inside(runtime.player.x, runtime.player.z) || !runtime.game.rug.placed) return null;
  const polyPts = [[runtime.game.rug.x, runtime.game.rug.z, .046], [runtime.game.rug.x + 2.4, runtime.game.rug.z, .046], [runtime.game.rug.x + 2.4, runtime.game.rug.z + 1.65, .046], [runtime.game.rug.x, runtime.game.rug.z + 1.65, .046]].map(v => runtime.P(...v));
  if (runtime.inScreenPoly([mx, my], polyPts) && runtime.canReachObject(runtime.rugRect(), .85)) return {
    from: 'rug',
    type: 'rug'
  };
  return null;
}
export function sourceItemAtScreen(mx, my) {
  const loose = runtime.groundItemAtScreen(mx, my);
  if (loose && (runtime.godMode() || Math.hypot(runtime.player.x - loose.x, runtime.player.z - loose.z) <= 1.12)) return {
    from: 'floor',
    type: loose.type,
    object: loose
  };
  const rug = runtime.rugAtScreen(mx, my);
  if (rug) return rug;
  for (const loc of ['table', 'bed', 'deskTop']) {
    const hit = runtime.surfaceItemAtScreen(loc, mx, my);
    if (hit) return hit;
  }
  const shelfHit = runtime.shelfItemAtScreen(mx, my);
  if (shelfHit) return shelfHit;
  for (const kind of ['house', 'chest']) {
    if (runtime.game.items[kind + 'Key']) continue;
    const pos = runtime.game.groundKeys[kind],
      screen = runtime.P(pos.x, pos.z, .06);
    if (Math.hypot(mx - screen[0], my - screen[1]) < Math.max(13, runtime.scale * runtime.zoom * .32) && (runtime.godMode() || Math.hypot(runtime.player.x - pos.x, runtime.player.z - pos.z) < 1.12)) {
      return {
        from: 'worldKey',
        type: kind + 'Key',
        object: pos
      };
    }
  }
  if ((runtime.godMode() || runtime.inside(runtime.player.x, runtime.player.z)) && runtime.canReachObject(runtime.deskObject)) {
    const o = runtime.deskObject,
      {
        x,
        z,
        w,
        h
      } = o;
    for (let n = 0; n < 2; n++) {
      if (!runtime.game.drawerOpen[n]) continue;
      const id = n === 0 ? 'drawerTop' : 'drawerBottom';
      const frontZ = z + .045 - .29,
        height = h - .28 - n * .19;
      const contents = runtime.game.stores[id];
      for (let i = 0; i < Math.min(contents.length, 2); i++) {
        const p = runtime.P(x + w - .29 + i * .10 + .05, frontZ + .13, height + .09);
        if (Math.hypot(mx - p[0], my - p[1]) < Math.max(7, runtime.scale * runtime.zoom * .115)) return {
          from: id,
          type: contents[i]
        };
      }
    }
  }
  if ((runtime.godMode() || runtime.inside(runtime.player.x, runtime.player.z)) && runtime.game.chest.open && (!runtime.game.chest.locked || runtime.godMode()) && runtime.canReachObject(runtime.chestObject)) {
    const c = runtime.chestObject,
      contents = runtime.game.stores.chest;
    for (let i = 0; i < Math.min(contents.length, 8); i++) {
      const p = runtime.P(c.x + .17 + i % 4 * .18, c.z + .2 + Math.floor(i / 4) * .2, .55);
      if (Math.hypot(mx - p[0], my - p[1]) < Math.max(10, runtime.scale * runtime.zoom * .16)) return {
        from: 'chest',
        type: contents[i]
      };
    }
  }
  return null;
}
export function clickedInteraction(mx, my, lockMode = false) {
  const lamp = runtime.inside(runtime.player.x, runtime.player.z) ? runtime.clickedLamp(mx, my) : -1;
  if (lamp >= 0) {
    runtime.toggleLamp(lamp);
    return true;
  }
  const keyVisible = runtime.rotated(runtime.game.groundKeys.house.x, runtime.game.groundKeys.house.z).reduce((a, b) => a + b, 0) >= runtime.rotated(3.5, 2.5).reduce((a, b) => a + b, 0) || runtime.reveal();
  const clicks = [{
    kind: 'door',
    hit: runtime.isClickedDoor(mx, my)
  }, {
    kind: 'house',
    hit: keyVisible && !runtime.game.items.houseKey && Math.hypot(...(() => {
      const p = runtime.P(runtime.game.groundKeys.house.x, runtime.game.groundKeys.house.z, .06);
      return [mx - p[0], my - p[1]];
    })()) < runtime.scale * runtime.zoom * .45
  }, {
    kind: 'chestKey',
    hit: runtime.reveal() && !runtime.game.items.chestKey && Math.hypot(mx - runtime.P(runtime.game.groundKeys.chest.x, runtime.game.groundKeys.chest.z, .06)[0], my - runtime.P(runtime.game.groundKeys.chest.x, runtime.game.groundKeys.chest.z, .06)[1]) < runtime.scale * runtime.zoom * .42
  }];
  const item = clicks.find(a => a.hit);
  if (item) {
    runtime.activateOrApproach(item.kind);
    return true;
  }
  const pos = runtime.worldAt(mx, my);
  if (runtime.inside(runtime.player.x, runtime.player.z)) {
    const item = runtime.groundItemAtScreen(mx, my);
    if (item) {
      runtime.directPickupFloorItem(item);
      return true;
    }
  }
  if (runtime.rugAtScreen(mx, my)) {
    runtime.toast('Clique com o botão direito para pegar o tapete com a mão.');
    return true;
  }
  const obj = runtime.inside(runtime.player.x, runtime.player.z) ? runtime.objectAtScreen(mx, my) : null;
  if (obj && runtime.reveal()) {
    runtime.objectContextMenu(obj, lockMode);
    return true;
  }
  return false;
}
export function screenHitsFurniture(o, mx, my) {
  const x = o.x,
    z = o.z,
    w = o.w,
    d = o.d,
    h = o.h;
  const quads = [[[x, z, h], [x + w, z, h], [x + w, z + d, h], [x, z + d, h]], [[x, z + d, 0], [x + w, z + d, 0], [x + w, z + d, h], [x, z + d, h]], [[x + w, z, 0], [x + w, z + d, 0], [x + w, z + d, h], [x + w, z, h]], [[x, z, 0], [x + w, z, 0], [x + w, z, h], [x, z, h]], [[x, z, 0], [x, z + d, 0], [x, z + d, h], [x, z, h]]];
  return quads.some(q => runtime.inScreenPoly([mx, my], q.map(v => runtime.P(...transformPoint(o,...v)))));
}
export function inventoryDropLocation(wx, wz, mx = null, my = null) {
  if (mx !== null && runtime.inside(runtime.player.x, runtime.player.z)) {
    for (let n = 0; n < 2; n++) if (runtime.game.drawerOpen[n]) {
      const o = runtime.deskObject,
        zz = o.z + .045 - .29,
        h = o.h - .28 - n * .19;
      const face = [[o.x + o.w - .33, zz, h - .035], [o.x + o.w - .06, zz, h - .035], [o.x + o.w - .06, zz, h + .11], [o.x + o.w - .33, zz, h + .11]].map(v => runtime.P(...v));
      if (runtime.inScreenPoly([mx, my], face)) return n === 0 ? 'drawerTop' : 'drawerBottom';
    }
    if (runtime.screenHitsFurniture(runtime.chestObject, mx, my)) return runtime.game.chest.open ? 'chest' : null;
    if (runtime.screenHitsFurniture(runtime.wardrobeObject, mx, my)) return 'shelf';
    if (runtime.screenHitsFurniture(runtime.deskObject, mx, my)) {
      const o = runtime.deskObject;
      for (let n = 0; n < 2; n++) if (runtime.game.drawerOpen[n]) {
        const zz = o.z + .045 - .29,
          h = o.h - .28 - n * .19;
        const drawerFace = [[o.x + o.w - .33, zz, h - .035], [o.x + o.w - .06, zz, h - .035], [o.x + o.w - .06, zz, h + .11], [o.x + o.w - .33, zz, h + .11]].map(v => runtime.P(...v));
        if (runtime.inScreenPoly([mx, my], drawerFace)) return n === 0 ? 'drawerTop' : 'drawerBottom';
      }
      return 'deskTop';
    }
    if (runtime.screenHitsFurniture(runtime.bedObject, mx, my)) return 'bed';
    const table = runtime.pushables.find(o => o.label === 'mesa');
    if (runtime.screenHitsFurniture(table, mx, my)) return 'table';
  }
  if (!runtime.inside(runtime.player.x, runtime.player.z) || !runtime.inside(wx, wz)) return 'floor';
  const inRect = o => wx >= o.x - .05 && wx <= o.x + o.w + .05 && wz >= o.z - .05 && wz <= o.z + o.d + .05;
  if (inRect(runtime.chestObject)) return runtime.game.chest.open ? 'chest' : null;
  if (inRect(runtime.wardrobeObject)) return 'shelf';
  if (inRect(runtime.deskObject)) {
    const upper = runtime.game.drawerOpen[0],
      lower = runtime.game.drawerOpen[1];
    if (upper) return 'drawerTop';
    if (lower) return 'drawerBottom';
    return 'deskTop';
  }
  if (inRect(runtime.bedObject)) return 'bed';
  const table = runtime.pushables.find(o => o.label === 'mesa');
  if (inRect(table)) return 'table';
  return 'floor';
}
export function drawerItemAtClick(mx, my) {
  return false;
}
export function awardResource(type, count, x, z) {
  for (let i = 0; i < count; i++) {
    if (runtime.canOpenBackpack() && runtime.storeCanFit('inventory', type)) runtime.game.stores.inventory.push(type);else {
      const p = {
        type,
        x: x + i % 3 * .16,
        z: z + Math.floor(i / 3) * .16
      };
      runtime.game.droppedItems.push(p);
      runtime.game.stores.floor.push(type);
    }
  }
}
export function resourceClick(mx, my) {
  document.getElementById('resourceMode').textContent = 'Ferramenta: ' + runtime.itemLabel(runtime.gathering.activeTool);
  if (runtime.editMode) return false;
  const p = runtime.worldAt(mx, my);
  const close = (x, z, limit) => Math.hypot(p.x - x, p.z - z) < limit;
  const nearNode = (x, z) => runtime.godMode() || Math.hypot(runtime.player.x - x, runtime.player.z - z) < 2;
  for (let i = 0; i < runtime.foliage.length; i++) {
    const t = runtime.foliage[i],
      state = runtime.gathering.trees[i];
    if (state.fallen || !close(t[0], t[1], .60)) continue;
    if (!nearNode(t[0], t[1])) {
      runtime.toast('Aproxime-se da árvore.');
      return true;
    }
    if (!runtime.godMode() && !(runtime.equipment.left === 'axe' && runtime.equipment.right === 'axe')) {
      runtime.toast('Equipe o machado (tecla 1).');
      return true;
    }
    runtime.startWorkAnimation('axe', t[0], t[1]);
    state.hard = Math.max(0, state.hard - (runtime.godMode() ? 10 : 2));
    if (state.hard === 0) state.hp -= runtime.godMode() ? 10 : 2;
    if (state.hp <= 0) {
      state.fallen = true;
      runtime.awardResource('wood', 3, t[0], t[1]);
      runtime.toast('Árvore abatida! 3 unidades de lenha obtidas.');
      runtime.inventoryDraw();
    } else runtime.toast('Árvore · dureza ' + state.hard + ' · vida ' + state.hp);
    runtime.saveGame();
    return true;
  }
  for (const r of runtime.gathering.rocks) {
    if (r.hp <= 0 || !close(r.x, r.z, .62)) continue;
    if (!nearNode(r.x, r.z)) {
      runtime.toast('Aproxime-se da rocha.');
      return true;
    }
    if (!runtime.godMode() && !(runtime.equipment.left === 'pickaxe' && runtime.equipment.right === 'pickaxe')) {
      runtime.toast('Equipe a picareta (tecla 2).');
      return true;
    }
    runtime.startWorkAnimation('pickaxe', r.x, r.z);
    r.hard = Math.max(0, r.hard - (runtime.godMode() ? 10 : 2));
    if (r.hard === 0) r.hp -= runtime.godMode() ? 10 : 2;
    if (r.hp <= 0) {
      runtime.awardResource('ore', 2, r.x, r.z);
      runtime.awardResource('stoneChunk', 1, r.x + .2, r.z + .1);
      runtime.toast('Rocha minerada: minério e pedra.');
      runtime.inventoryDraw();
    } else runtime.toast('Rocha · dureza ' + r.hard + ' · vida ' + r.hp);
    runtime.saveGame();
    return true;
  }
  const m = runtime.gathering.mound;
  if (close(m.x, m.z, .8)) {
    if (!nearNode(m.x, m.z)) {
      runtime.toast('Aproxime-se do relevo.');
      return true;
    }
    if (!m.dug) {
      if (!runtime.godMode() && !(runtime.equipment.left === 'shovel' && runtime.equipment.right === 'shovel')) {
        runtime.toast('Equipe a pá (tecla 3).');
        return true;
      }
      runtime.startWorkAnimation('shovel', m.x, m.z);
      m.work++;
      if (m.work >= 4) {
        m.dug = true;
        runtime.toast('Um baú enterrado foi encontrado! Clique novamente.');
      } else runtime.toast('Escavação: ' + m.work + '/4');
    } else if (!m.chestOpen) {
      m.chestOpen = true;
      runtime.awardResource('treasure', 1, m.x, m.z);
      runtime.inventoryDraw();
      runtime.toast('Tesouro encontrado!');
    } else runtime.toast('O baú enterrado já foi aberto.');
    runtime.saveGame();
    return true;
  }
  return false;
}
export function contextClick(mx, my, lockMode = false) {
  const doorComponent=[...runtime.editDecor].reverse().find(o=>o.component&&o.kind==='door'&&!o.hidden&&runtime.screenHitsFurniture(o,mx,my));
  if(doorComponent){
    if(!runtime.godMode()&&runtime.rectDistance(runtime.player.x,runtime.player.z,doorComponent)>1.15)return runtime.toast('Aproxime-se da porta.');
    if(doorComponent.open&&runtime.circleRect(runtime.player.x,runtime.player.z,runtime.player.r+.1,doorComponent))return runtime.toast('Afaste-se do vão antes de fechar.');
    doorComponent.open=!doorComponent.open;runtime.saveGame();return;
  }
  if (!runtime.houseContext) {
    const at = runtime.worldAt(mx, my),
      own = runtime.cloneInteriorAt(runtime.player.x, runtime.player.z);
    for (const h of runtime.houseInstances()) {
      const doorX = h.x + 3.64,
        doorZ = h.z + 5;
      const withinDoor = Math.hypot(at.x - doorX, at.z - doorZ) < .85 || runtime.withHouseInstance(h, () => runtime.isClickedDoor(mx, my));
      if (withinDoor && (runtime.godMode() || Math.hypot(runtime.player.x - doorX, runtime.player.z - doorZ) < 1.55)) {
        const st = runtime.ensureHouseState(h);
        if (lockMode) {
          if (st.door.open) return runtime.toast('Feche a porta antes de trancar.');
          st.door.locked = !st.door.locked;
        } else if (st.door.locked) {
          if (!runtime.godMode()) return runtime.toast('Esta porta está trancada.');
          st.door.locked = false;
          st.door.open = true;
        } else st.door.open = !st.door.open;
        runtime.saveGame();
        runtime.toast(st.door.open ? 'Porta da casa criada aberta.' : st.door.locked ? 'Porta trancada.' : 'Porta fechada.');
        return;
      }
    }
    if (own) {
      runtime.withHouseInstance(own, () => runtime.contextClick(mx, my, lockMode));
      runtime.saveGame();
      return;
    }
  }
  if (!runtime.editMode && runtime.resourceClick(mx, my)) return;
  const deco = runtime.editDecor.find(o => o.kind === 'chest' && Math.hypot(runtime.worldAt(mx, my).x - (o.x + o.w / 2), runtime.worldAt(mx, my).z - (o.z + o.d / 2)) < .6);
  if (deco && (runtime.godMode() || Math.hypot(runtime.player.x - deco.x, runtime.player.z - deco.z) < 1.6)) {
    if (deco.chestState.locked && !runtime.godMode()) return runtime.toast('Este baú está trancado.');
    if (deco.chestState.open && deco.contents?.length) {
      const t = deco.contents.shift();
      runtime.game.stores.inventory.push(t);
      runtime.inventoryDraw();
      runtime.saveGame();
      runtime.toast(runtime.itemLabel(t) + ' recolhido deste baú.');
      return;
    }
    deco.chestState.open = !deco.chestState.open;
    runtime.saveGame();
    runtime.toast(deco.chestState.open ? 'Baú independente aberto: ' + (deco.contents?.length || 0) + ' itens.' : 'Baú fechado.');
    return;
  }
  if (runtime.handItem) {
    runtime.placeHandAt(mx, my);
    return;
  }
  const src = runtime.sourceItemAtScreen(mx, my);
  if (src) {
    if (src.from === 'floor') {
      runtime.directPickupFloorItem(src.object || src);
      runtime.closePanels();
      return;
    }
    runtime.pickItemToHand(src);
    runtime.closePanels();
    return;
  }
  if (runtime.isClickedDoor(mx, my)) {
    if (runtime.nearDoor()) runtime.quickDoorAction(lockMode);else runtime.activateOrApproach('door', lockMode);
    return;
  }
  const drawerIndex = runtime.drawerFrontAtClick(mx, my);
  if (drawerIndex >= 0) {
    runtime.toggleDrawer(drawerIndex);
    return;
  }
  if (!runtime.inside(runtime.player.x, runtime.player.z)) {
    const loose = runtime.groundItemAtScreen(mx, my);
    if (loose) {
      runtime.toast('Arraste o objeto até a janela do inventário para recolher.');
      return;
    }
    const p = runtime.P(runtime.game.groundKeys.house.x, runtime.game.groundKeys.house.z, .06);
    if (!runtime.game.items.houseKey && Math.hypot(mx - p[0], my - p[1]) < runtime.scale * runtime.zoom * .45) runtime.activateOrApproach('house');
    return; // Não interagir com objetos do interior estando do lado de fora.
  }
  if (runtime.clickedInteraction(mx, my, lockMode)) return;
  const obj = runtime.objectAtScreen(mx, my);
  if (obj) {
    runtime.objectContextMenu(obj, lockMode);
    return;
  }
  // Objetos menores também requerem clique direito.
  // Cliques no chão vazio não abrem inventário coletivo nem recolhem itens distantes.
}
