import {state as s} from '../core/state.js';
import {WEAPONS,newCombat,restoreCombat} from './rules.js';
export function registerCombatItems(){for(const [id,w] of Object.entries(WEAPONS))s.ITEM_SPEC[id]={name:w.name,litres:w.litres,hands:w.hands};}
export function initializeCombatState(){
 const already=!!s.savedCombat;s.combat=restoreCombat(s.savedCombat);
 if(!already){s.player.x=6.5;s.player.z=2.6;s.player.elevation=0;s.savedStorey={upper:false,stairs:false};for(const id of Object.keys(WEAPONS))s.game.stores.chest.push(id);}
 if(!s.hasLoadedSave){s.game.chest.locked=false;s.equipment.backpack='backpack';s.game.droppedItems=s.game.droppedItems.filter(o=>o.type!=='backpack');s.game.stores.floor=s.game.stores.floor.filter(t=>t!=='backpack');}
}
