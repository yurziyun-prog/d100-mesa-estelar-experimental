export const CATEGORIES=Object.freeze({ranged:'Ataque à distância',blades:'Lâminas de combate',unarmed:'Combate desarmado',polearms:'Armas de haste'});
export const WEAPONS=Object.freeze({
 pistol:{name:'Pistola',category:'ranged',hands:1,range:8,die:6,bonus:2,litres:1.2,icon:'🔫',effect:'shot'},
 laserRifle:{name:'Rifle laser',category:'ranged',hands:2,range:8,die:6,bonus:3,litres:4,icon:'⚡',effect:'laser'},
 bow:{name:'Arco e flechas',category:'ranged',hands:2,range:8,die:6,bonus:1,litres:3,icon:'🏹',effect:'arrow'},
 longsword:{name:'Espada longa',category:'blades',hands:1,range:1.6,die:6,bonus:2,litres:2.5,icon:'🗡️',effect:'attack'},
 lightsaber:{name:'Sabre de luz',category:'blades',hands:1,range:1.6,die:6,bonus:3,litres:1,icon:'✨',effect:'plasma'},
 spear:{name:'Lança',category:'polearms',hands:2,range:2.5,die:6,bonus:2,litres:4,icon:'🔱',effect:'attack'},
 staff:{name:'Bastão longo',category:'polearms',hands:2,range:2.5,die:6,bonus:1,litres:3,icon:'🦯',effect:'attack'},
 combatGloves:{name:'Luvas de combate',category:'unarmed',hands:2,range:1.1,die:4,bonus:1,litres:.6,icon:'🥊',effect:'attack'}
});
export const UNARMED=Object.freeze({name:'Punhos livres',category:'unarmed',range:1.1,die:3,bonus:0,effect:'attack'});
export const normalize=name=>String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function categoryForSkill(name){const n=normalize(name);if(/lanca.?chamas|lanca.?foguetes/.test(n))return 'ranged';if(/haste|lanca|alabarda|bastao|pique/.test(n))return 'polearms';if(/desarmad|boxe|karate|judo|artes marciais|luta livre|soco/.test(n))return 'unarmed';if(/arma.*branca|lamina|espada|sabre|adaga|esgrima|machado/.test(n))return 'blades';if(/distancia|arma.*fogo|laser|arco|flecha|rifle|pistola|tiro|besta|blaster|revolver|fuzil|espingarda|escopeta|metralha|arremesso/.test(n))return 'ranged';return null;}
export function skillValue(skills,category){
 const related=skills.filter(p=>(p.category||categoryForSkill(p.name))===category&&Number.isFinite(p.value));
 return related.reduce((best,p)=>p.value>best.value?{name:p.name,value:Math.max(0,Math.min(100,p.value))}:best,{name:CATEGORIES[category],value:0});
}
// Same classification as Mesa Estelar js/nova-regras.js; damage is simplified here.
export function resolveAttack(value,die,weapon,damageDie){const v=Math.max(0,Math.min(100,value));const grade=die>=99?'Fiasco':die<v/10?'Crítico':die<=v?'Sucesso':'Falha';const hit=grade==='Sucesso'||grade==='Crítico';return {die,value:v,grade,hit,damage:hit?(grade==='Crítico'?weapon.die:Math.max(1,Math.min(weapon.die,damageDie)))+weapon.bonus:0};}
export function equippedWeapon(equipment){for(const id of [equipment.right,equipment.left]){const w=WEAPONS[id];if(w&&(w.hands===1||(equipment.right===id&&equipment.left===id)))return {id,...w};}return !equipment.left&&!equipment.right?{id:'unarmed',...UNARMED}:null;}
export function newCombat(){return {version:1,hp:12,maxHp:12,skills:[{name:CATEGORIES.ranged,category:'ranged',value:45},{name:CATEGORIES.blades,category:'blades',value:40},{name:CATEGORIES.unarmed,category:'unarmed',value:35},{name:CATEGORIES.polearms,category:'polearms',value:40}],enemy:{id:'orla-stalker',name:'Rastejante da Orla',x:7,z:11,hp:24,maxHp:24,cooldown:0,alert:false},cooldown:0,log:[]};}
export function restoreCombat(data){const c=newCombat();if(!data||data.version!==1)return c;c.suppliesVersion=data.suppliesVersion===1?1:0;if(data.corpse&&['x','z','elevation'].every(k=>Number.isFinite(data.corpse[k])))c.corpse={x:data.corpse.x,z:data.corpse.z,elevation:data.corpse.elevation,upper:!!data.corpse.upper,stairs:!!data.corpse.stairs};c.hp=Number.isFinite(data.hp)?Math.max(0,Math.min(c.maxHp,data.hp)):c.hp;if(Array.isArray(data.skills)){const rows=data.skills.slice(0,64).filter(p=>p&&typeof p.name==='string'&&Number.isFinite(p.value)&&(CATEGORIES[p.category]||categoryForSkill(p.name)));if(rows.length)c.skills=rows.map(p=>({name:p.name.slice(0,60),category:p.category||categoryForSkill(p.name),value:Math.max(0,Math.min(100,p.value))}));}if(data.enemy){for(const k of ['x','z'])if(Number.isFinite(data.enemy[k])&&Math.abs(data.enemy[k])<60)c.enemy[k]=data.enemy[k];c.enemy.hp=Number.isFinite(data.enemy.hp)?Math.max(0,Math.min(c.enemy.maxHp,data.enemy.hp)):c.enemy.hp;}c.cooldown=Math.max(0,Math.min(1.2,Number(data.cooldown)||0));return c;}
