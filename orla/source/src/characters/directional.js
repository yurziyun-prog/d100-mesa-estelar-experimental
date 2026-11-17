import {withFurnitureOcclusion} from '../rendering/occlusion.js';
import {state as s} from '../core/state.js';
import {actorGeometry} from '../campaign/geometry.js';
import {ACTORS} from '../campaign/catalog.js';
import {drawParts} from '../campaign/draw.js';
export function installDirectionalCharacters(){
 const old=s.character,party=s.drawPartyCharacter;
 function draw(id,pose,look,equipment,active){
  if(s.campaign.appearance[id]||look?.avatar==='combatente')return false;
  const god=id==='god';if(god&&['invisible','ethereal'].includes(s.godPresence))return true;
  const appearance={rounded:true,color:look?.outfit||'#65517b',skin:look?.skin||'#b99c83',hair:look?.hair||'#443b40',hairStyle:look?.hairStyle,bodyStyle:look?.bodyStyle,outfitStyle:look?.outfitStyle,beardStyle:look?.beardStyle,pants:look?.pants,eyes:look?.eyes,beard:god&&look?.beardStyle!=='none',scale:look?.bodyStyle==='tall'?1.08:1,weapon:equipment?.right,backpack:equipment?.backpack==='backpack'};
  const phase=active&&s.walking?s.player.step:0,y=(pose.elevation||0)+(active?s.player.jumpY||0:0);
  s.ctx.save();if(god&&s.godPresence==='translucent')s.ctx.globalAlpha=.35;
  withFurnitureOcclusion(()=>drawParts(actorGeometry(ACTORS.explorer,appearance,phase),pose.x,pose.z,y,-Math.atan2(pose.faceX??0,pose.faceY??1)),pose);s.ctx.restore();return true;
 }
 s.character=()=>{if(s.cast.some(a=>a.id===s.controlledId)||(!s.godMode()&&s.combat.hp<=0)||!draw(s.controlledId,s.player,s.looks[s.role],s.equipment,true))old();};
 s.drawPartyCharacter=p=>{if(p.hp<=0||!draw(p.id,p.position,p.looks,p.equipment,false))party(p);};
}
