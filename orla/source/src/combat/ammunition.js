import {state as s} from '../core/state.js';
export const AMMO={pistol:'ammoBullet',laserRifle:'energyCell',bow:'arrow'};
export const SUPPLIES={ammoBullet:{name:'Cartucho de pistola',litres:.015,icon:'▰'},energyCell:{name:'Carga de energia',litres:.04,icon:'🔋'},arrow:{name:'Flecha',litres:.07,icon:'➶'},reviveSerum:{name:'Ampola de ressurreição',litres:.2,icon:'💉'}};
export function registerSupplies(){Object.assign(s.ITEM_SPEC,SUPPLIES);}
export function ammoCount(weapon){return s.game.stores.inventory.filter(t=>t===AMMO[weapon]).length;}
export function consumeAmmo(weapon){const type=AMMO[weapon];if(!type||s.godMode())return true;const i=s.game.stores.inventory.indexOf(type);if(i<0)return false;s.game.stores.inventory.splice(i,1);s.inventoryDraw();return true;}
export function seedSupplies(){if(s.combat.suppliesVersion>=1)return;
 const hasSerum=Object.values(s.game.stores).some(a=>a.includes('reviveSerum'))||s.handItem?.type==='reviveSerum'||Object.values(s.equipment).includes('reviveSerum')||s.game.droppedItems.some(o=>o.type==='reviveSerum');
 for(const [id,n] of [['ammoBullet',12],['energyCell',12],['arrow',8],['reviveSerum',hasSerum||s.hasLoadedSave?0:1]])for(let i=0;i<n;i++)s.game.stores.chest.push(id);
 s.combat.suppliesVersion=1;
}
