import {AMMO,SUPPLIES,ammoCount,consumeAmmo} from './ammunition.js';
import { state as s } from '../core/state.js';
import { WEAPONS, CATEGORIES, skillValue, equippedWeapon, resolveAttack, categoryForSkill, newCombat } from './rules.js';
import { drawEnemy } from './creature.js';
export
// src/combat/combat.js
function installCombat() {
  const c = s.combat;
  const panelsOpen = () => s.editMode || s.helpOpen || !!document.querySelector("#inventory.open,#equipment.open,#sheet.open,#appearancePanel.open,#interaction.open,#powersPanel.open,#characterContext:not([hidden]),#scenarioMenu:not([hidden])");
  s.combatPaused = panelsOpen;
  let uiClock = 0;
  const roll = n => 1 + Math.floor(Math.random() * n);
  const log = text => {
    c.log.unshift(text);
    c.log.length = Math.min(c.log.length, 7);
    render();
  };
  const blocked = (x, z) => s.inside(x, z) || s.houseInstances().some(h => x > h.x - 0.35 && x < h.x + h.w + 0.35 && z > h.z - 0.35 && z < h.z + 5.35) || s.wallBarriers().some(o => s.circleRect(x, z, 0.3, o)) || s.foliage.some((t, i) => !s.gathering.trees[i]?.fallen && Math.hypot(x - t[0], z - t[1]) < 0.3 + 0.22 * t[2]) || s.gathering.rocks.some(o => o.hp > 0 && Math.hypot(x - o.x, z - o.z) < 0.75);
  s.combatLineClear = (x, z) => {
    const d = Math.hypot(x - s.player.x, z - s.player.z);
    for (let i = 1; i <= Math.ceil(d / 0.08); i++) {
      const t = i / Math.ceil(d / 0.08),
        px = s.player.x + (x - s.player.x) * t,
        pz = s.player.z + (z - s.player.z) * t;
      if (s.wallBarriers().some(o => s.circleRect(px, pz, 0.025, o))) return false;
    }
    return true;
  };
  s.combatAttack = () => {

    if (panelsOpen()) return s.toast("Feche os pain\xE9is para combater."), false;
    if ((!s.godMode() && c.hp <= 0) || c.enemy.hp <= 0) return false;
    if (c.cooldown > 0) return false;
    const w = equippedWeapon(s.equipment);
    if (!w) return s.toast("Equipe uma arma ou libere as duas m\xE3os para lutar desarmado."), false;
    if (s.handItem) return s.toast("Guarde ou equipe o objeto que est\xE1 segurando antes de atacar."), false;
    if (s.player.elevation > 0.3 || s.player.jump) return s.toast("Des\xE7a ao t\xE9rreo para enfrentar a criatura."), false;
    const d = Math.hypot(c.enemy.x - s.player.x, c.enemy.z - s.player.z);
    if (d > w.range) return s.toast("Fora de alcance: " + w.range + " m."), false;
    if (!s.combatLineClear(c.enemy.x, c.enemy.z)) return s.toast("Uma parede ou porta bloqueia o ataque."), false;
    if(!consumeAmmo(w.id))return s.toast('Sem munição: leve '+SUPPLIES[AMMO[w.id]].name+' na mochila.'),false;
    const skill = skillValue(c.skills, w.category),
      r = s.godMode()?{die:null,value:100,grade:'Crítico',hit:true,damage:w.die+w.bonus,divine:true}:resolveAttack(skill.value, roll(100), w, roll(w.die));
    c.cooldown = 1.2;
    c.enemy.alert = true;
    c.enemy.hp = Math.max(0, c.enemy.hp - r.damage);
    s.orlaAttackFX = {
      until: performance.now() + 470,
      weapon: w.id,
      hit: r.hit,
      origin: {
        x: s.player.x,
        z: s.player.z
      },
      target: {
        x: c.enemy.x,
        z: c.enemy.z
      }
    };
    s.orlaCombatSound?.(w.effect || 'attack');
    if (r.hit) s.orlaCombatSound?.('hit');
    s.player.faceX = (c.enemy.x - s.player.x) / Math.max(d, 0.01);
    s.player.faceY = (c.enemy.z - s.player.z) / Math.max(d, 0.01);
    s.triggerEffect(w.effect, c.enemy.x, c.enemy.z);
    log(`${w.name} \xB7 ${skill.name} ${skill.value}% \xB7 ${r.divine?'Deus · crítico garantido':'D100 '+r.die+': '+r.grade}${r.hit ? " \xB7 " + r.damage + " de dano" : ""}.`);
    if (!c.enemy.hp) log("Rastejante derrotado.");
    s.saveGame();
    return r;
  };
  const recover = () => {
    if(!s.godMode())return s.toast("Use uma ampola ou peça a Deus para ressuscitar."),false;
    c.hp = c.maxHp;
    c.corpse=null;
    c.cooldown = 0;
    c.enemy = newCombat().enemy;
    s.player.x = 6.5;
    s.player.z = 2.6;
    s.player.elevation = 0;
    s.player.jump = null;
    s.player.jumpY = 0;
    s.secondFloor = s.onStairs = false;
    s.target = null;
    s.keys.clear();
    s.game.door.open = false;
    s.game.pending = null;
    log("Voc\xEA se recuperou na casa. Um novo encontro est\xE1 pronto l\xE1 fora.");
    s.saveGame();
  };
  s.resetCombat = recover;
  s.combatTick = dt => {
    const paused = s.godMode() || panelsOpen();
    c.cooldown = Math.max(0, c.cooldown - dt);
    if (paused) {render();return;}
    c.enemy.cooldown = Math.max(0, (c.enemy.cooldown || 0) - dt);
    s.combatTime = (s.combatTime || 0) + dt;
    if (c.hp > 0 && c.enemy.hp > 0 && !s.inside(s.player.x, s.player.z) && !s.cloneInteriorAt(s.player.x, s.player.z) && s.player.elevation < 0.3) {
      const e = c.enemy,
        dx = s.player.x - e.x,
        dz = s.player.z - e.z,
        d = Math.hypot(dx, dz);
      if (d < 7) e.alert = true;
      if (e.alert && d < 13 && d > 1.20) {
        const angle = Math.atan2(dz, dx),
          step = Math.min(dt * 1.65, d - 1.20);
        for (const offset of [0, 0.55, -0.55, 1.1, -1.1]) {
          const x = e.x + Math.cos(angle + offset) * step,
            z = e.z + Math.sin(angle + offset) * step;
          if (!blocked(x, z) && (!s.actorSpaceClear || s.actorSpaceClear(x,z,0,e.id,.32))) {
            e.x = x;
            e.z = z;
            break;
          }
        }
      }
      const actualDistance = Math.hypot(s.player.x - e.x, s.player.z - e.z);
      if (actualDistance <= 1.75 && e.cooldown <= 0 && (actualDistance < 1.3 || s.combatLineClear(e.x, e.z))) {
        e.cooldown = 1.85;
        s.triggerEffect?.('attack', s.player.x, s.player.z);
        s.orlaEnemyStrikeAt = performance.now() + 390;
        s.orlaCombatSound?.('enemy');
        const r = resolveAttack(35, roll(100), {
          die: 4,
          bonus: 1
        }, roll(4));
        c.hp = Math.max(0, c.hp - r.damage);
        if (r.hit) {
          s.orlaHurtAt = performance.now() + 350;
          s.orlaCombatSound?.('hit');
        }
        if (!c.hp) {
          s.orlaDiedAt = performance.now();
          c.corpse={x:s.player.x,z:s.player.z,elevation:s.player.elevation,upper:s.secondFloor,stairs:s.onStairs};
          s.orlaCombatSound?.('death');
        }
        log(`Rastejante \xB7 35% \xB7 D100 ${r.die}: ${r.grade}${r.hit ? " \xB7 voc\xEA sofreu " + r.damage + " de dano" : ""}.`);
        if (!c.hp) {
          s.target = null;
          s.keys.clear();
          log("Viajante incapacitado. Use uma ampola ou peça a Deus para ressuscitar.");
        }
        s.saveGame();
      }
    }
    uiClock += dt;
    if (uiClock > 0.12) {
      uiClock = 0;
      render();
    }
  };
  s.combatEntities = () => [{
    x: c.enemy.x,
    z: c.enemy.z,
    kind: "enemy",
    draw: drawEnemy
  }];
  const canWalk2 = s.canWalk;
  s.canWalk = (x, z, ...args) => {
    if (!s.godMode() && c.enemy.hp > 0 && s.player.elevation < 0.3 && Math.hypot(x - c.enemy.x, z - c.enemy.z) < s.player.r + 0.35 && Math.hypot(x - c.enemy.x, z - c.enemy.z) < Math.hypot(s.player.x - c.enemy.x, s.player.z - c.enemy.z)) return false;
    return canWalk2(x, z, ...args);
  };
  const move2 = s.move;
  s.move = (...args) => {
    if (c.hp <= 0 && !s.godMode()) return;
    return move2(...args);
  };
  const jump = s.startJump,
    hop = s.startHop;
  s.startJump = (...args) => c.hp <= 0 && !s.godMode() ? false : jump(...args);
  s.startHop = (...args) => c.hp <= 0 && !s.godMode() ? false : hop(...args);
  const panel = document.createElement("section");
  panel.id = "combatPanel";
  panel.innerHTML = '<button class="combat-toggle" type="button" aria-expanded="false">⚔ Combate D100 <span>▸</span></button><div class="combat-content"><div id="combatSummary"></div><button id="combatAttack" type="button">Atacar criatura (F)</button><button id="combatRecover" type="button">Recuperar-se na casa</button><details><summary>Per\xEDcias e registro</summary><p>Usa o maior valor da categoria. Especializa\xE7\xF5es n\xE3o somam.</p><div id="combatSkills"></div><form id="addCombatSkill"><input name="name" placeholder="Ex.: Espada longa" maxlength="60" required><select name="category"></select><input name="value" type="number" min="0" max="100" value="50" required><button>Adicionar per\xEDcia</button></form><ol id="combatLog"></ol></details></div>';
  panel.classList.add("is-collapsed");
  document.body.append(panel);
  const toggleCombat = panel.querySelector('.combat-toggle');
  const setCombatOpen = value => {
    panel.classList.toggle('is-collapsed', !value);
    toggleCombat.setAttribute('aria-expanded', String(value));
    toggleCombat.querySelector('span').textContent = value ? '▾' : '▸';
  };
  toggleCombat.addEventListener('click', () => setCombatOpen(panel.classList.contains('is-collapsed')));
  document.addEventListener('pointerdown', e => {
    if (!panel.contains(e.target)) setCombatOpen(false);
  }, true);
  panel.querySelector("#combatAttack").onclick = s.combatAttack;
  panel.querySelector("#combatRecover").onclick = recover;
  const form = panel.querySelector("form");
  for (const [id, label] of Object.entries(CATEGORIES)) form.elements.category.add(new Option(label, id));
  form.elements.name.oninput = () => {
    const category = categoryForSkill(form.elements.name.value);
    if (category) form.elements.category.value = category;
  };
  form.onsubmit = e => {
    e.preventDefault();
    if (!s.godMode() || c.skills.length >= 64) return;
    const name = form.elements.name.value.trim(),
      value = Number(form.elements.value.value),
      category = form.elements.category.value;
    if (!name || !Number.isFinite(value) || value < 0 || value > 100) return;
    c.skills.push({
      name,
      value,
      category
    });
    form.elements.name.value = "";
    skills();
    s.saveGame();
    render();
  };
  let lastGod;
  function skills() {
    const list = panel.querySelector("#combatSkills");
    list.replaceChildren();
    for (const [i, p] of c.skills.entries()) {
      const label = document.createElement("label");
      label.textContent = p.name + " \xB7 " + CATEGORIES[p.category] + " ";
      const input = document.createElement("input");
      input.type = "number";
      input.min = 0;
      input.max = 100;
      input.value = p.value;
      input.disabled = !s.godMode();
      input.onchange = () => {
        const v = Number(input.value);
        if (s.godMode() && Number.isFinite(v) && v >= 0 && v <= 100) {
          p.value = v;
          s.saveGame();
          render();
        } else input.value = p.value;
      };
      label.append(input);
      if (s.godMode() && i >= 4) {
        const b = document.createElement("button");
        b.textContent = "Remover";
        b.onclick = () => {
          c.skills.splice(i, 1);
          skills();
          s.saveGame();
          render();
        };
        label.append(b);
      }
      list.append(label);
    }
    form.hidden = !s.godMode();
  }
  function render() {
    const god = s.godMode(),
      w = equippedWeapon(s.equipment),
      skill = w ? skillValue(c.skills, w.category) : null,
      target=s.cast?.find(a=>a.id===s.selectedActor)||c.enemy,activeName=s.controlRecord?.()?.name||'Viajante';
    if (lastGod !== god) {
      lastGod = god;
      skills();
    }
    panel.querySelector("#combatSummary").textContent = `${god ? "Deus \xB7 crítico garantido" : activeName+" " + c.hp + "/" + c.maxHp + " PV"} \xB7 ${target.name} ${target.hp}/${target.maxHp} PV
${w ? w.name + " \xB7 " + skill.value + "% \xB7 alcance " + w.range + " m" : "Equipe uma arma ou deixe as m\xE3os livres."}`;
    panel.querySelector('#combatSummary').textContent += w&&AMMO[w.id]?'\nMunição: '+(god?'∞':ammoCount(w.id))+' · '+SUPPLIES[AMMO[w.id]].name:'';
    panel.querySelector("#combatAttack").disabled = (!god && c.hp <= 0) || target.hp <= 0 || c.cooldown > 0;
    panel.querySelector("#combatRecover").hidden = !god;
    panel.querySelector("#combatRecover").textContent = god ? "Reiniciar encontro" : "Recuperar-se na casa";
    const logs = panel.querySelector("#combatLog");
    logs.replaceChildren(...c.log.map(text => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    }));
    const fx = document.getElementById("actionEffects");
    if (fx) fx.hidden = !god;
  }
  document.addEventListener("keydown", e => {
    if (e.code !== "KeyF" || e.repeat || e.target.closest?.("input,select,textarea") || s.editMode) return;
    e.preventDefault();
    s.combatAttack();
  });
  document.addEventListener("pointerdown", e => {
    if (e.button !== 0 || e.target.id !== "game" || s.editMode || s.masterItemPlacement) return;
    const p = s.P(c.enemy.x, c.enemy.z, 0.5);
    if (Math.hypot(e.clientX - p[0], e.clientY - p[1]) > s.scale * s.zoom * 0.65) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    s.combatAttack();
  }, true);
  const setRole2 = s.setRole;
  s.setRole = (...args) => {
    setRole2(...args);
    render();
  };
  s.renderCombat = render;
  render();
  s.saveGame();
}

// src/combat/setup.js
