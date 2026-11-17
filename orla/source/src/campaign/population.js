import { drawEnemy } from '../combat/creature.js';
import { state as s } from '../core/state.js';
import { ACTORS, ATTITUDES, makeActor } from './catalog.js';
import { actorGeometry } from './geometry.js';
import { drawParts } from './draw.js';
import { equippedWeapon, resolveAttack, skillValue } from '../combat/rules.js';
import { consumeAmmo } from '../combat/ammunition.js';
export function installPopulation() {
  const map = s.activeMap();
  map.actors = Array.isArray(map.actors) ? map.actors.filter(o => ACTORS[o.type] && Number.isFinite(o.x) && Number.isFinite(o.z)) : [];
  map.plants ||= [];
  s.cast = map.actors;
  let pending = null;
  const panel = document.getElementById('powersPanel');
  s.serveItem = (id, type) => {
    const a = s.cast.find(o => o.id === id);
    if (!a || a.type !== 'bartender' || a.hp <= 0 || a.attitude === 'hostile' || Math.abs((a.elevation || 0) - s.player.elevation) > .4 || Math.hypot(s.player.x - a.x, s.player.z - a.z) > 3) return s.toast('Aproxime-se do administrador para pedir.'), false;
    const i = a.inventory.indexOf(type);
    if (i < 0 || !s.storeCanFit('inventory', type)) return s.toast('Item indisponível ou mochila cheia.'), false;
    a.inventory.splice(i, 1);
    s.game.stores.inventory.push(type);
    s.inventoryDraw();
    s.saveGame();
    s.toast('UR-17 entregou ' + s.itemLabel(type) + '.');
    return true;
  };
  s.spawnActor = (type, x, z, options = {}) => {
    if (!s.godMode() || s.cast.length >= 80 || !s.canWalk(x, z)) return false;
    const actor = makeActor(type, x, z, options);
    if (!actor) return false;
    s.cast.push(actor);
    s.saveGame();
    s.refreshCastUI?.();
    return actor;
  };
  s.setActorAttitude = (id, value) => {
    if (!s.godMode() || !ATTITUDES[value]) return false;
    const a = s.cast.find(o => o.id === id);
    if (!a) return false;
    a.attitude = value;
    a.cooldown = 1;
    s.saveGame();
    s.refreshCastUI?.();
    return true;
  };
  s.armCampaignPlacement = placement => {
    if (!s.godMode()) return;
    pending = placement;
    s.masterItemPlacement = true;
    panel.classList.remove('open');
    s.toast('Clique no chão para colocar. Esc cancela.');
  };
  document.addEventListener('pointerdown', e => {
    if (!pending || e.button !== 0 || e.target.id !== 'game') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!s.godMode()) {
      pending = null;
      s.masterItemPlacement = false;
      return;
    }
    const p = s.worldAt(e.clientX, e.clientY),
      ok = pending.kind === 'plant' ? s.placePlant(pending.type, p.x, p.z) : s.spawnActor(pending.type, p.x, p.z, {
        ...pending.options,
        elevation: s.player.elevation
      });
    if (ok) {
      pending = null;
      s.masterItemPlacement = false;
      s.toast('Adicionado ao mapa atual.');
    } else s.toast('Escolha um espaço livre para colocar.');
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      pending = null;
      s.masterItemPlacement = false;
    }
  });
  const field = document.createElement('fieldset');
  field.id = 'castCreator';
  field.innerHTML = '<legend>Evocar NPCs e criaturas</legend><label>Modelo <select id="actorType"></select></label><label>Nome <input id="actorName" maxlength="60" placeholder="Nome opcional"></label><label>Atitude <select id="actorAttitude"></select></label><label>Traje / carapaça <input id="actorColor" type="color" value="#526e85"></label><label>Pele / detalhes <input id="actorSkin" type="color" value="#c99571"></label><label>Tamanho <input id="actorScale" type="number" min="0.65" max="1.5" step="0.05" value="1"></label><label>Acessório <select id="actorAccessory"><option value="none">Nenhum</option><option value="hat">Chapéu</option><option value="crest">Crista</option><option value="antenna">Antena</option></select></label><button id="evokeActor">Evocar no mapa</button><label>Personagens deste mapa <select id="castSelect"></select></label><label>Alterar atitude <select id="castDisposition"></select></label><button id="applyAttitude">Aplicar atitude</button><button id="removeActor">Retirar do mapa</button><p>As instâncias ficam neste mapa. Evocar outra cria uma nova criatura, com estado próprio.</p>';
  panel.append(field);
  for (const [id, a] of Object.entries(ACTORS)) field.querySelector('#actorType').add(new Option(a.name, id));
  for (const id of ['actorAttitude', 'castDisposition']) for (const [value, label] of Object.entries(ATTITUDES)) field.querySelector('#' + id).add(new Option(label, value));
  field.querySelector('#actorAttitude').value = 'neutral';
  field.querySelector('#actorType').onchange = () => {
    const a = ACTORS[field.querySelector('#actorType').value];
    field.querySelector('#actorColor').value = a.color;
    field.querySelector('#actorSkin').value = a.skin;
  };
  s.refreshCastUI = () => {
    const select = field.querySelector('#castSelect'),
      value = select.value;
    select.replaceChildren(...s.cast.map(a => new Option(a.name + ' · ' + ATTITUDES[a.attitude] + (a.hp <= 0 ? ' · morto' : ''), a.id)));
    if (s.cast.some(a => a.id === value)) select.value = value;
  };
  s.refreshCastUI();
  field.querySelector('#evokeActor').onclick = () => s.armCampaignPlacement({
    kind: 'actor',
    type: field.querySelector('#actorType').value,
    options: {
      name: field.querySelector('#actorName').value,
      attitude: field.querySelector('#actorAttitude').value,
      color: field.querySelector('#actorColor').value,
      skin: field.querySelector('#actorSkin').value,
      scale: Number(field.querySelector('#actorScale').value),
      accessory: field.querySelector('#actorAccessory').value
    }
  });
  field.querySelector('#applyAttitude').onclick = () => s.setActorAttitude(field.querySelector('#castSelect').value, field.querySelector('#castDisposition').value);
  field.querySelector('#removeActor').onclick = () => {
    if (!s.godMode()) return;
    const id = field.querySelector('#castSelect').value,
      i = s.cast.findIndex(a => a.id === id);
    if (i >= 0) {
      s.cast.splice(i, 1);
      s.saveGame();
      s.refreshCastUI();
    }
  };
  s.drawCastActor = a => {
    const visual = {
      ...a,
      ...(s.campaign.appearance[a.id] || {})
    };
    if (a.visual === 'stalker' && !s.campaign.appearance[a.id]) {
      const old = s.combat.enemy;
      s.combat.enemy = a;
      try {
        drawEnemy();
      } finally {
        s.combat.enemy = old;
      }
      return;
    }
    s.ctx.save();
    if (a.hp <= 0) s.ctx.globalAlpha = .6;
    s.ctx.save();
    if (a.hp <= 0) {
      const origin = s.P(a.x, a.z, a.elevation || 0);
      s.ctx.translate(...origin);
      s.ctx.rotate(-1.4);
      s.ctx.translate(-origin[0], -origin[1]);
    }
    drawParts(actorGeometry(ACTORS[visual.type], visual, a.hp > 0 && a.walking ? a.step || 0 : 0), a.x, a.z, a.elevation || 0, -(a.yaw || 0));
    s.ctx.restore();
    const p = s.P(a.x, a.z, (a.elevation || 0) + (a.scale || 1) * 1.95);
    s.ctx.fillStyle = a.attitude === 'hostile' ? '#f3a18c' : a.attitude === 'friendly' ? '#b2e0c2' : '#e1d4ae';
    s.ctx.font = '12px Georgia';
    s.ctx.textAlign = 'center';
    s.ctx.fillText(a.name + (a.hp <= 0 ? ' · morto' : ''), ...p);
    s.ctx.restore();
  };
  const entities = s.combatEntities;
  s.combatEntities = () => [...entities().filter(e => !map.legacyManaged || e.kind !== 'enemy'), ...s.cast.filter(a => a.id !== s.controlledId).map(a => ({
    x: a.x,
    z: a.z,
    kind: 'npc',
    elevation:a.elevation||0,
    draw: () => s.drawCastActor(a)
  }))];
  const attack = s.combatAttack;
  s.combatAttack = () => {
    const target = s.cast.find(a => a.id === s.selectedActor);
    if (!target) return attack();
    const w = equippedWeapon(s.equipment),
      c = s.combat;
    if (!w || !s.godMode() && c.hp <= 0 || c.cooldown > 0 || target.hp <= 0 || s.handItem || s.combatPaused()) return false;
    if (Math.abs((target.elevation || 0) - s.player.elevation) > .4 || Math.hypot(target.x - s.player.x, target.z - s.player.z) > w.range || !s.combatLineClear(target.x, target.z)) return s.toast('Alvo fora de alcance ou bloqueado.'), false;
    if (!consumeAmmo(w.id)) return s.toast('Sem munição compatível na mochila.'), false;
    const skill = skillValue(c.skills, w.category),
      r = s.godMode() ? {
        hit: true,
        grade: 'Crítico',
        damage: w.die + w.bonus
      } : resolveAttack(skill.value, 1 + Math.floor(Math.random() * 100), w, 1 + Math.floor(Math.random() * w.die));
    target.hp = Math.max(0, target.hp - r.damage);
    c.cooldown = 1.2;
    const distance=Math.max(.001,Math.hypot(target.x-s.player.x,target.z-s.player.z));
    s.player.faceX=(target.x-s.player.x)/distance;s.player.faceY=(target.z-s.player.z)/distance;
    s.triggerEffect(w.effect, target.x, target.z);
    s.orlaAttackFX = {
      until: performance.now() + 470,
      weapon: w.id,
      hit: r.hit,
      origin: {x:s.player.x,z:s.player.z},
      target: {
        x: target.x,
        z: target.z
      }
    };
    s.orlaCombatSound?.(w.effect);
    c.log.unshift(target.name + ': ' + r.grade + ' · ' + r.damage + ' de dano.');
    c.log.length = Math.min(c.log.length, 7);
    s.renderCombat();
    s.saveGame();
    s.refreshCastUI();
    return r;
  };
  const tick = s.combatTick;
  s.combatTick = dt => {
    tick(dt);
    for(const a of s.cast)a.walking=false;
    if (s.godMode() || s.combat.hp <= 0 || s.combatPaused()) return;
    for (const a of s.cast) {
      if (a.id === s.controlledId || a.attitude !== 'hostile' || a.hp <= 0 || Math.abs((a.elevation || 0) - s.player.elevation) > .4) continue;
      a.cooldown = Math.max(0, (a.cooldown || 0) - dt);
      const d = Math.hypot(s.player.x - a.x, s.player.z - a.z);
      if (d > 9 || !s.combatLineClear(a.x, a.z)) continue;
      if (d > 1.1) {
        const nx = a.x + (s.player.x - a.x) / d * dt * 1.3,
          nz = a.z + (s.player.z - a.z) / d * dt * 1.3;
        if ((s.canActorWalk?s.canActorWalk(a,nx,nz):s.canWalk(nx,nz)) && !s.cast.some(b => b !== a && Math.hypot(nx - b.x, nz - b.z) < .5)) {
          a.walking=true;a.step=(a.step||0)+dt*10;
          a.x = nx;
          a.z = nz;
          a.yaw = Math.atan2(s.player.x - a.x, s.player.z - a.z);
        }
      } else if (a.cooldown <= 0) {
        a.cooldown = 1.8;
        const r = resolveAttack(40, 1 + Math.floor(Math.random() * 100), {
          die: 4,
          bonus: 1
        }, 1 + Math.floor(Math.random() * 4));
        s.combat.hp = Math.max(0, s.combat.hp - r.damage);
        if (r.hit) s.orlaHurtAt = performance.now() + 350;
        if (!s.combat.hp) {
          s.combat.corpse = {
            x: s.player.x,
            z: s.player.z,
            elevation: s.player.elevation,
            upper: s.secondFloor,
            stairs: s.onStairs
          };
          s.target = null;
          s.keys.clear();
        }
        s.saveGame();
      }
    }
  };
}
