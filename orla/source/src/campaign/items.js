import { FOOD, nutritionResult } from './nutrition.js';
import { state as s } from '../core/state.js';
import { AMMO } from '../combat/ammunition.js';
import { equippedWeapon } from '../combat/rules.js';
export function installItemUse() {
  s.useInventoryItem = type => {
    const items = s.game.stores.inventory;
    if (!items.includes(type)) return false;
    const weapon = Object.keys(AMMO).find(id => AMMO[id] === type);
    if (weapon) {
      if (equippedWeapon(s.equipment)?.id === weapon) {
        s.toast('Arma compatível já equipada. Munição preservada.');
        return true;
      }
      if (!items.includes(weapon)) return s.toast('Tenha a arma compatível na mochila para equipá-la.'), false;
      return s.quickEquipFromInventory(weapon);
    }
    if (type === 'reviveSerum') {
      if (s.godMode() || s.combat.hp > 0) return s.toast('A ampola só é consumida para ressuscitar um personagem morto.'), false;
      items.splice(items.indexOf(type), 1);
      s.combat.hp = Math.ceil(s.combat.maxHp / 2);
      s.combat.corpse = null;
      s.combat.cooldown = 0;
      s.combat.enemy.cooldown = 2;
      s.target = null;
      s.orlaDiedAt = 0;
      s.orlaCombatSound?.('resurrect');
      s.inventoryDraw();
      s.renderCombat();
      s.saveGame();
      s.toast('Ressuscitado com metade dos PV.');
      return true;
    }
    if (FOOD[type]) {
      const actor = s.controlRecord(),
        r = nutritionResult({
          type,
          fatigue: s.fatigue,
          maxFatigue: s.maxFatigue,
          hp: s.combat.hp,
          lastUse: actor.foodUse || {}
        });
      if (!r.ok) return s.toast(r.reason), false;
      items.splice(items.indexOf(type), 1);
      s.fatigue = r.fatigue;
      actor.foodUse = r.lastUse;
      s.combat.cooldown = Math.max(s.combat.cooldown, 1.2);
      s.inventoryDraw();
      s.saveGame();
      s.toast('Consumido: fadiga melhorou um nível.');
      return true;
    }
    return s.quickEquipFromInventory(type);
  };
}
