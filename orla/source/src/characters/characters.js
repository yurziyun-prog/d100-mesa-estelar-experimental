import {drawAvatar} from './avatars.js';
// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';

export function syncLookInputs() {
  const a = runtime.looks[runtime.role];
  for (const [id, key] of [['skinColor', 'skin'], ['hairColor', 'hair'], ['outfitColor', 'outfit'], ['pantsColor', 'pants'], ['eyeColor', 'eyes'], ['hairStyle', 'hairStyle'], ['outfitStyle', 'outfitStyle'], ['bodyStyle', 'bodyStyle'], ['beardStyle', 'beardStyle']]) document.getElementById(id).value = a[key];
  document.getElementById('godFaceRow').style.display = runtime.role === 'god' ? 'flex' : 'none';
  document.getElementById('characterHint').textContent = runtime.role === 'god' ? 'Deus: avatar independente, volume, direção e barba personalizável.' : 'Viajante: cores, roupa e constituição próprias.';
}
export function dismissPopups() {
  for (const id of ['appearancePanel', 'powersPanel']) document.getElementById(id).classList.remove('open');
}
export function character() {
  if(drawAvatar())return;
  if (runtime.godMode() && (runtime.godPresence === 'invisible' || runtime.godPresence === 'ethereal')) return;
  runtime.ctx.save();
  if (runtime.godMode() && runtime.godPresence === 'translucent') runtime.ctx.globalAlpha = .35;
  const look = runtime.looks[runtime.role];
  const foot = runtime.P(runtime.player.x, runtime.player.z, runtime.player.elevation + runtime.player.jumpY),
    groundFoot = runtime.P(runtime.player.x, runtime.player.z, runtime.player.elevation),
    u = runtime.scale * runtime.zoom;
  const motion = runtime.player.walkBlend;
  const phase = runtime.player.step * 1.25,
    sw = Math.sin(phase) * motion,
    swOther = Math.sin(phase + Math.PI) * motion;
  const bounce = (1 - Math.cos(phase * 2)) * .023 * motion;
  const screenFace = runtime.screenVector(runtime.player.faceX, runtime.player.faceY);
  const facing = screenFace[0] < -.08 ? -1 : 1;
  // Sombra de contato: primeiro o apoio sob os pés, depois a penumbra.
  runtime.ctx.fillStyle = '#1327168a';
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(groundFoot[0], groundFoot[1] + 1, u * .23, u * .076, 0, 0, Math.PI * 2);
  runtime.ctx.fill();
  runtime.ctx.fillStyle = '#152e1970';
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(groundFoot[0] + 1, groundFoot[1] + 1, u * .14, u * .052, 0, 0, Math.PI * 2);
  runtime.ctx.fill();
  const centerY = foot[1] - u * (.60 + bounce);
  const bodyMul = look.bodyStyle === 'strong' ? 1.20 : look.bodyStyle === 'slim' ? .82 : 1;
  runtime.ctx.lineCap = 'round';
  runtime.ctx.lineJoin = 'round';
  for (const [side, cycle] of [[-1, sw], [1, swOther]]) {
    const hipX = foot[0] + side * u * .077,
      hipY = centerY + u * .19;
    const kneeX = hipX + cycle * u * .14,
      kneeY = foot[1] - u * (.22 + Math.max(0, cycle) * .07);
    const toeX = kneeX + cycle * u * .08 + facing * u * .02,
      toeY = foot[1] - u * (Math.max(0, cycle) * .07);
    runtime.ctx.strokeStyle = look.pants || '#303a4b';
    runtime.ctx.lineWidth = u * .092 * bodyMul;
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(hipX, hipY);
    runtime.ctx.lineTo(kneeX, kneeY);
    runtime.ctx.lineTo(toeX, toeY);
    runtime.ctx.stroke();
    runtime.ctx.strokeStyle = '#49352b';
    runtime.ctx.lineWidth = u * .11;
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(toeX - u * .035, toeY);
    runtime.ctx.lineTo(toeX + facing * u * .067, toeY + u * .01);
    runtime.ctx.stroke();
  }
  for (const [side, cycle] of [[-1, swOther], [1, sw]]) {
    const sx = foot[0] + side * u * .17,
      sy = centerY - u * .24;
    runtime.ctx.strokeStyle = look.skin;
    runtime.ctx.lineWidth = u * .095;
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(sx, sy);
    runtime.ctx.lineTo(sx + side * u * .05 + cycle * u * .11, sy + u * (.3 + Math.max(0, -cycle) * .08));
    runtime.ctx.stroke();
  }
  runtime.ctx.save();
  runtime.ctx.translate(foot[0], centerY - u * .10);
  runtime.ctx.rotate(sw * .025);
  runtime.ctx.fillStyle = look.outfit;
  if(runtime.enhancedVisuals){const fabric=runtime.ctx.createLinearGradient(-u*.18,0,u*.18,0);fabric.addColorStop(0,runtime.shade(look.outfit,-28));fabric.addColorStop(.38,runtime.shade(look.outfit,24));fabric.addColorStop(1,runtime.shade(look.outfit,-12));runtime.ctx.fillStyle=fabric;}
  runtime.ctx.beginPath();
  runtime.ctx.moveTo(-u * .155 * bodyMul, -u * .27);
  runtime.ctx.quadraticCurveTo(0, -u * .38, u * .155 * bodyMul, -u * .27);
  runtime.ctx.lineTo(u * .18 * bodyMul, look.outfitStyle === 'robe' ? u * .45 : u * .29);
  runtime.ctx.quadraticCurveTo(0, u * .35, -u * .18 * bodyMul, look.outfitStyle === 'robe' ? u * .45 : u * .29);
  runtime.ctx.closePath();
  runtime.ctx.fill();
  runtime.ctx.fillStyle = '#9f5649';
  runtime.ctx.fillRect(-u * .16, u * .09, u * .32, u * .065);
  runtime.ctx.fillStyle = '#e6c57f';
  runtime.ctx.fillRect(-u * .028, u * .09, u * .056, u * .065);
  runtime.ctx.restore();
  const hx = foot[0] + sw * u * .013,
    hy = centerY - u * .69;
  runtime.ctx.fillStyle = look.skin;
  if(runtime.enhancedVisuals){const skin=runtime.ctx.createRadialGradient(hx-u*.07,hy-u*.09,0,hx,hy,u*.25);skin.addColorStop(0,runtime.shade(look.skin,24));skin.addColorStop(1,runtime.shade(look.skin,-27));runtime.ctx.fillStyle=skin;}
  runtime.ctx.beginPath();
  runtime.ctx.arc(hx, hy, u * .217, 0, Math.PI * 2);
  runtime.ctx.fill();
  runtime.ctx.fillStyle = look.hair;
  runtime.ctx.beginPath();
  runtime.ctx.arc(hx, hy - u * .067, u * .225, Math.PI * 1.03, Math.PI * 1.98);
  runtime.ctx.lineTo(hx + u * .22, hy - u * .11);
  runtime.ctx.fill();
  if (look.hairStyle === 'bald') {
    runtime.ctx.fillStyle = look.skin;
    runtime.ctx.beginPath();
    runtime.ctx.arc(hx, hy - u * .092, u * .205, Math.PI * 1.02, Math.PI * 1.99);
    runtime.ctx.fill();
  }
  if (look.hairStyle === 'long') {
    runtime.ctx.fillStyle = look.hair;
    runtime.ctx.fillRect(hx - u * .19, hy - u * .08, u * .09, u * .38);
    runtime.ctx.fillRect(hx + u * .10, hy - u * .08, u * .09, u * .38);
  }
  if (look.outfitStyle === 'coat') {
    runtime.ctx.strokeStyle = '#d4b987';
    runtime.ctx.lineWidth = u * .022;
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(foot[0], centerY - u * .34);
    runtime.ctx.lineTo(foot[0], centerY + u * .26);
    runtime.ctx.stroke();
  }
  if (look.outfitStyle === 'armor') {
    runtime.ctx.fillStyle = '#9aa7ac';
    runtime.ctx.fillRect(foot[0] - u * .16, centerY - u * .23, u * .32, u * .14);
  }
  runtime.ctx.fillStyle = look.eyes || '#43342f';
  runtime.ctx.beginPath();
  runtime.ctx.arc(runtime.role === 'god' ? hx : hx + facing * u * .083, hy + u * .019, u * (runtime.role === 'god' ? .033 : .023), 0, Math.PI * 2);
  runtime.ctx.fill();
  if (runtime.role === 'god' && look.beardStyle !== 'none') {
    runtime.ctx.fillStyle = '#e6e1d1';
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(hx - u * .15, hy + u * .085);
    runtime.ctx.quadraticCurveTo(hx, hy + u * (look.beardStyle === 'short' ? .27 : .43), hx + u * .15, hy + u * .085);
    runtime.ctx.quadraticCurveTo(hx, hy + u * .21, hx - u * .15, hy + u * .085);
    runtime.ctx.fill();
    runtime.ctx.fillStyle = '#ded6bd';
    runtime.ctx.beginPath();
    runtime.ctx.arc(hx, hy - u * .18, u * .19, Math.PI, 2 * Math.PI);
    runtime.ctx.fill();
    runtime.ctx.fillStyle = '#e7e0ca';
    runtime.ctx.fillRect(hx - u * .15, hy - u * .04, u * .30, u * .055);
  }
  if (runtime.role === 'god') {
    runtime.ctx.strokeStyle = look.hair;
    runtime.ctx.lineWidth = u * .028;
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(hx - u * .11, hy - u * .02);
    runtime.ctx.lineTo(hx + u * .11, hy - u * .02);
    runtime.ctx.stroke();
  }
  runtime.ctx.restore();
}

// Camadas de interiores separadas da colisão: nenhum objeto é duplicado.
export function drawSheet() {
  const sh = runtime.SHEETS[runtime.role],
    god = runtime.role === 'god';
  document.getElementById('sheetTitle').textContent = god ? '☁ Deus · Mestre' : '📜 Viajante · D100';
  const labels = {
    FOR: 'Força',
    DES: 'Destreza',
    CON: 'Constituição',
    INT: 'Inteligência',
    PER: 'Percepção',
    VON: 'Vontade',
    CAR: 'Carisma',
    PV: 'Pontos de vida',
    PM: 'Pontos de magia',
    mov: 'Movimento'
  };
  document.getElementById('sheetStats').innerHTML = Object.entries(sh).filter(([k]) => labels[k]).map(([k, v]) => '<div class="stat"><span>' + labels[k] + '</span><b>' + (k==='PV'&&!god&&runtime.combat?runtime.combat.hp+'/'+runtime.combat.maxHp:v) + '</b></div>').join('');
  document.getElementById('sheetNote').textContent = god ? 'Acesso de mestre para edição de cenário. Atributos de caráter narrativo.' : 'Capacidade de mover: até ' + runtime.kgLoad() + ' kg. Combate: D100 contra a maior perícia relacionada à arma equipada. Consulte Perícias e registro no painel de combate.';
}
export function setRole(kind) {
  runtime.role = kind;
  runtime.selected = null;
  runtime.editPlacing = null;
  document.getElementById('roleBtn').textContent = runtime.role === 'god' ? '☁ Deus' : '🧙 Viajante';
  document.getElementById('powersBtn').style.display = runtime.godMode() ? '' : 'none';
  runtime.dismissPopups();
  runtime.syncLookInputs();
  runtime.drawSheet();
  runtime.renderEditor();
  runtime.saveGame();
  runtime.toast(runtime.role === 'god' ? 'Deus: modo mestre ativado.' : 'Viajante selecionado.');
}
export function initialize141() {
  runtime.appearancePanel = document.getElementById('appearancePanel');
  runtime.powersPanel = document.getElementById('powersPanel');
}
export function initialize142() {
  document.getElementById('appearanceBtn').onclick = () => {
    runtime.syncLookInputs();
    runtime.powersPanel.classList.remove('open');
    runtime.appearancePanel.classList.toggle('open');
  };
}
export function initialize143() {
  document.getElementById('powersBtn').onclick = () => {
    if (!runtime.godMode()) return;
    runtime.appearancePanel.classList.remove('open');
    runtime.powersPanel.classList.toggle('open');
  };
}
export function initialize144() {
  document.getElementById('appearanceClose').onclick = () => {
    runtime.appearancePanel.classList.remove('open');
    runtime.saveGame();
  };
}
export function initialize145() {
  document.getElementById('godCreateItem').onclick = () => {
    if (!runtime.godMode()) return;
    const type = prompt('Materializar no inventário: ' + Object.keys(runtime.ITEM_SPEC).join(', '));
    if (!type || !runtime.ITEM_SPEC[type]) return runtime.toast('Item desconhecido.');
    runtime.game.stores.inventory.push(type);
    runtime.inventoryDraw();
    runtime.saveGame();
    runtime.toast(runtime.itemLabel(type) + ' materializado.');
  };
}
export function initialize146() {
  document.getElementById('godTeleport').onclick = () => {
    if (!runtime.godMode()) return;
    runtime.powersPanel.classList.remove('open');
    if (!runtime.editMode) runtime.toggleEditor(true);
    runtime.editPlacing = {kind:'teleport'};
    runtime.toast('Clique no destino do teleporte.');
  };
}
export function initialize147() {
  document.getElementById('powersClose').onclick = () => runtime.powersPanel.classList.remove('open');
}
export function initialize148() {
  for (const [id, key] of [['skinColor', 'skin'], ['hairColor', 'hair'], ['outfitColor', 'outfit'], ['pantsColor', 'pants'], ['eyeColor', 'eyes'], ['hairStyle', 'hairStyle'], ['outfitStyle', 'outfitStyle'], ['bodyStyle', 'bodyStyle'], ['beardStyle', 'beardStyle']]) document.getElementById(id).addEventListener('input', e => {
    runtime.looks[runtime.role][key] = e.target.value;
    runtime.saveGame();
  });
}
export function initialize149() {
  document.getElementById('godPresence').addEventListener('change', e => {
    runtime.godPresence = e.target.value;
    runtime.saveGame();
    runtime.toast('Manifestação: ' + e.target.selectedOptions[0].textContent);
  });
}
export function initialize150() {
  document.getElementById('godPresence').value = runtime.godPresence;
}
