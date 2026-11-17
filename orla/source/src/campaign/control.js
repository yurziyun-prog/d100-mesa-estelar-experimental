import { state as s } from '../core/state.js';
import { ACTORS, copy } from './catalog.js';
import { actorGeometry } from './geometry.js';
import { drawParts } from './draw.js';
export function installControl() {
  const book = s.campaign,
    party = book.party;
  for (const id of ['traveler', 'god']) {
    let p = party.find(a => a.id === id);
    if (!p) {
      p = {
        id,
        name: id === 'god' ? 'Deus' : 'Viajante'
      };
      party.push(p);
    }
    p.position ||= {
      x: s.player.x + (id === 'god' ? 1 : 0),
      z: s.player.z,
      elevation: s.player.elevation,
      faceX:s.player.faceX,faceY:s.player.faceY
    };
    p.looks ||= copy(s.looks[id==='god'?'god':'traveler']);
    p.hp ??= s.combat.hp;
    p.maxHp ??= 12;
    p.inventory ||= id === 'traveler' ? [...s.game.stores.inventory] : [];
    p.equipment ||= id === 'traveler' ? copy(s.equipment) : {
      left: null,
      right: null,
      clothing: 'clothing',
      backpack: 'backpack'
    };
  }
  const legacy = () => s.baseHouseEnabled && !s.activeMap().legacyManaged ? {
    ...s.combat.enemy,
    type: 'scarab',
    name: s.combat.enemy.name,
    attitude: 'hostile',
    color: '#52696a',
    skin: '#b3bda2',
    scale: 1,
    inventory: [],
    elevation: 0
  } : null;
  const get = id => party.find(a => a.id === id) || s.cast.find(a => a.id === id) || (id === s.combat.enemy.id ? legacy() : null);
  s.controlledId = get(book.controlled) ? book.controlled : s.role === 'god' ? 'god' : 'traveler';
  book.controlled = s.controlledId;
  let suppress = false;
  const traveler = () => party.find(p => p.id === 'traveler');
  s.syncControlled = () => {
    if (suppress) return;
    const a = get(s.controlledId);
    if (!a) return;
    const pose = {
      x: s.player.x,
      z: s.player.z,
      elevation: s.player.elevation,
      faceX:s.player.faceX,faceY:s.player.faceY
    };
    if (party.includes(a)) {
      a.position = pose;
      a.sceneId = book.active;
    } else {Object.assign(a, pose);a.yaw=Math.atan2(s.player.faceX,s.player.faceY);}
    if (a.id === 'god') traveler().hp = s.combat.hp;else a.hp = s.combat.hp;
    if(party.includes(a))a.looks=copy(s.looks[s.role]);
    a.fatigue = s.fatigue;
    a.inventory = [...s.game.stores.inventory];
    a.equipment = copy(s.equipment);
    a.handItem = copy(s.handItem || null);
  };
  const save = s.saveGame;
  s.saveGame = () => {
    s.syncControlled();
    save();
  };
  const oldRole = s.setRole;
  s.controlCharacter = id => {
    let a = get(id);
    if (!a) return false;
    s.syncControlled();
    if (id === s.combat.enemy.id && !s.activeMap().legacyManaged) {
      a = {
        ...a,
        visual: 'stalker'
      };
      s.cast.push(a);
      s.activeMap().legacyManaged = true;
      s.combat.enemy.hp = 0;
      s.refreshCastUI();
    }
    const previous = s.controlledId;
    suppress = true;
    try {
      s.controlledId = book.controlled = id;
      oldRole(id === 'god' ? 'god' : 'traveler');
      if(a.looks)s.looks[s.role]=copy(a.looks);
      const pose = a.position || a;
      Object.assign(s.player, {
        x: pose.x,
        z: pose.z,
        elevation: pose.elevation || 0,
        jump: null,
        jumpY: 0, walkBlend:0,step:0,faceX:pose.faceX??0,faceY:pose.faceY??1
      });
      s.walking=false;
      s.secondFloor = s.baseHouseEnabled && s.player.elevation >= 2.7;
      s.onStairs = false;
      s.onBarStair = !!s.barInside?.(s.player.x, s.player.z) && s.player.elevation > 0 && s.player.elevation < 2.7;
      s.combat.hp = id === 'god' ? traveler().hp : a.hp;
      s.combat.maxHp = id === 'god' ? traveler().maxHp || 12 : a.maxHp || 12;
      s.fatigue = a.fatigue ?? s.maxFatigue;
      s.game.stores.inventory = [...(a.inventory || [])];
      s.equipment = copy(a.equipment || {
        left: null,
        right: null,
        backpack: 'backpack',
        clothing: null
      });
      s.handItem = copy(a.handItem || null);
      s.combat.corpse = s.combat.hp <= 0 ? {
        ...(id === 'god' ? traveler().position : pose),
        upper: s.secondFloor,
        stairs: false
      } : null;
      s.target = null;
      s.keys.clear();
      s.selectedActor = null;
      s.renderCombat();
      s.inventoryDraw();
      s.renderEquipment();
      s.syncLookInputs();
      document.querySelector('#roleBtn').textContent = id === 'god' ? '☁ Deus' : a.name;
      s.toast('Controlando ' + a.name + '.');
    } finally {
      suppress = false;
    }
    s.saveGame();
    return previous !== id;
  };
  s.setRole = id => s.controlCharacter(id);
  const character = s.character;
  s.character = () => {
    const npc = s.cast.find(a => a.id === s.controlledId);
    if (npc) {
      if (npc.visual === 'stalker') {
        Object.assign(npc, {
          x: s.player.x,
          z: s.player.z
        });
        s.drawCastActor(npc);
        return;
      }
      drawParts(actorGeometry(ACTORS[npc.type], npc, s.walking ? s.player.step : 0), s.player.x, s.player.z, s.player.elevation, -Math.atan2(s.player.faceX, s.player.faceY));
      return;
    }
    character();
  };
  s.drawPartyCharacter = p => {
    const originalLook=s.looks.traveler,originalGodLook=s.looks.god;
    const player = {
        ...s.player
      },
      role = s.role,
      hp = s.combat.hp,
      corpse = s.combat.corpse,
      walking = s.walking;
    try {
      Object.assign(s.player, p.position);
      s.player.jumpY = 0;
      s.player.walkBlend=0;s.player.step=0;s.player.jump=null;
      s.player.faceX=p.position.faceX??0;s.player.faceY=p.position.faceY??1;
      s.role = p.id === 'god' ? 'god' : 'traveler';
      if(p.looks)s.looks[s.role]=p.looks;
      s.combat.hp = p.id === 'god' ? 12 : p.hp;
      s.combat.corpse = p.hp <= 0 ? p.position : null;
      s.walking = false;
      character();
    } finally {
      Object.assign(s.player, player);
      s.role = role;
      s.looks.traveler=originalLook;s.looks.god=originalGodLook;
      s.combat.hp = hp;
      s.combat.corpse = corpse;
      s.walking = walking;
    }
  };
  const entities = s.combatEntities;
  s.combatEntities = () => [...entities().filter(e => e.kind !== 'corpse'), ...party.filter(p => p.id !== s.controlledId && p.position).map(p => ({
    x: p.position.x,
    z: p.position.z,
    kind: 'party',
    draw: () => s.drawPartyCharacter(p)
  }))];
  const tick = s.combatTick;
  s.combatTick = dt => {
    tick(dt);
    s.syncControlled();
  };
  s.reviveCharacter = id => {
    if (!s.godMode()) return false;
    const a = get(id);
    if (!a || a.hp > 0) return false;
    a.hp = a.maxHp || 12;
    if (id === s.combat.enemy.id && !s.activeMap().legacyManaged) s.combat.enemy.hp = a.hp;
    if (id === 'traveler') {
      s.combat.hp = a.hp;
      s.combat.corpse = null;
    }
    a.cooldown = 2;
    s.saveGame();
    s.refreshCastUI();
    s.toast(a.name + ' ressuscitado.');
    return true;
  };
  // Keep the existing divine resurrection button tied to the Traveler, not a possession.
  document.querySelector('#godReviveTraveler').onclick = () => s.reviveCharacter('traveler');
  const menu = document.createElement('div');
  menu.id = 'characterContext';
  menu.hidden = true;
  document.body.append(menu);
  let contextId = null;
  const close = () => {
    menu.hidden = true;
    contextId = null;
  };
  function open(a, x, y) {
    contextId = a.id;
    menu.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = a.name;
    menu.append(title);
    const button = (text, fn) => {
      const b = document.createElement('button');
      b.textContent = text;
      b.onclick = () => {
        close();
        fn();
      };
      menu.append(b);
    };
    button('Controlar esse personagem', () => s.controlCharacter(a.id));
    if (s.cast.includes(a)) {
      button('Selecionar como alvo', () => {
        s.selectedActor = a.id;
        s.renderCombat();
        s.toast('Alvo: ' + a.name);
      });
      button('Conversar', () => {
        const p = a.position || a;
        if (Math.hypot(s.player.x - p.x, s.player.z - p.z) > 3 && !s.godMode()) return s.toast('Aproxime-se para conversar.');
        s.toast(ACTORS[a.type].dialogue || a.name + ' observa você.');
      });
      if (a.type === 'bartender') for (const [type, name] of [['coffee', 'Café'], ['water', 'Água'], ['beer', 'Cerveja'], ['ration', 'Refeição']]) button('Pedir ' + name, () => s.serveItem(a.id, type));
      if (s.godMode()) for (const [value, label] of [['hostile', 'Hostil'], ['neutral', 'Neutra'], ['friendly', 'Amigável']]) button('Atitude: ' + label, () => s.setActorAttitude(a.id, value));
    }
    if (s.godMode() && a.hp <= 0) button('Ressuscitar', () => s.reviveCharacter(a.id));
    button('Fechar', () => {});
    menu.hidden = false;
    menu.style.left = Math.max(8, Math.min(innerWidth - 238, x)) + 'px';
    menu.style.top = Math.max(8, Math.min(innerHeight - menu.offsetHeight - 8, y)) + 'px';
  }
  s.openCharacterContext = (id, x = 200, y = 150) => {
    const a = get(id);
    if (a) open(a, x, y);
  };
  function hit(e) {
    return [...party, ...s.cast, ...(legacy() ? [legacy()] : [])].map(a => {
      const pose = a.id === s.controlledId ? s.player : a.position || a,
        p = s.P(pose.x, pose.z, (pose.elevation || 0) + (a.hp <= 0 ? .12 : .8));
      if (a.hp <= 0) p[0] -= s.scale * s.zoom * .3;
      return {
        a,
        d: Math.hypot(e.clientX - p[0], e.clientY - p[1])
      };
    }).filter(o => o.d < Math.max(18, s.scale * s.zoom * .55)).sort((a, b) => a.d - b.d)[0]?.a;
  }
  let characterPress = false;
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('#characterContext')) return;
    if (e.target.id === 'game' && e.button === 2) {
      const a = hit(e);
      if (a) {
        e.preventDefault();
        e.stopImmediatePropagation();
        characterPress = true;
        open(a, e.clientX, e.clientY);
        return;
      }
    }
    close();
  }, true);
  document.addEventListener('pointerup', e => {
    if (characterPress && e.button === 2) {
      e.preventDefault();
      e.stopImmediatePropagation();
      characterPress = false;
    }
  }, true);
  document.addEventListener('contextmenu', e => {
    if (e.target.id === 'game' && hit(e)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
  const roster = document.createElement('fieldset');
  roster.innerHTML = '<legend>Personagens dos jogadores</legend><label>Nome <input id=partyName maxlength=60></label><button id=addPartyMember>Adicionar personagem de jogador</button><select id=partySelect></select><button id=controlPartyMember>Controlar personagem selecionado</button>';
  document.getElementById('powersPanel').append(roster);
  const refreshRoster = () => roster.querySelector('select').replaceChildren(...party.map(p => new Option(p.name, p.id)));
  refreshRoster();
  roster.querySelector('#addPartyMember').onclick = () => {
    if (s.registerPartyMember('player-' + crypto.randomUUID(), roster.querySelector('input').value || 'Viajante')) refreshRoster();
  };
  roster.querySelector('#controlPartyMember').onclick = () => s.controlCharacter(roster.querySelector('select').value);
  s.partyCharacters = () => party;
  s.controlRecord = () => get(s.controlledId);
  const restored=s.controlRecord();
  if(restored?.inventory)s.game.stores.inventory=copy(restored.inventory);
  const facing=restored?.position||restored;
  s.player.faceX=facing?.faceX??s.player.faceX;s.player.faceY=facing?.faceY??s.player.faceY;
  s.fatigue = restored?.fatigue ?? s.fatigue;
  if (s.cast.some(a => a.id === s.controlledId)) {
    s.combat.hp = s.controlRecord().hp;
    s.combat.maxHp = s.controlRecord().maxHp;
  }
  s.syncControlled();
}
