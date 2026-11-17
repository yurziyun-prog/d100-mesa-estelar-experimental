import {state as s} from '../core/state.js';
import {movementProfile} from './motion.js';
export function installActorCollisions(){
 const alive=a=>a.id==='god'?s.godPresence!=='ethereal':a.hp>0;
 s.actorBodies=()=>[...s.campaign.party.filter(alive).map(a=>({id:a.id,...(a.id===s.controlledId?s.player:a.position),radius:.23})),...s.cast.filter(alive).map(a=>({id:a.id,...(a.id===s.controlledId?s.player:a),radius:.23*(a.scale||1)})),...(s.baseHouseEnabled&&!s.activeMap().legacyManaged&&s.combat.enemy.hp>0?[{...s.combat.enemy,elevation:0,radius:.32}]:[])];
 s.actorSpaceClear=(x,z,y=0,id=s.controlledId,radius=.23)=>(id==='god'&&s.godPresence==='ethereal')||s.actorBodies().every(a=>a.id===id||Math.abs((a.elevation||0)-y)>.65||Math.hypot(x-a.x,z-a.z)>=radius+a.radius-.015);
 s.actorStepClear=(x,z,y,id,from)=>s.actorBodies().every(a=>{
  if(a.id===id||Math.abs((a.elevation||0)-y)>.65||(id==='god'&&s.godPresence==='ethereal'))return true;
  const limit=.23+a.radius-.015,d=Math.hypot(x-a.x,z-a.z),old=Math.hypot(from.x-a.x,from.z-a.z);
  return d>=limit||(old<limit&&d>old+1e-6);
 });
 const walk=s.canWalk;let checking=null;
 s.canWalk=(x,z,...args)=>walk(x,z,...args)&&s.actorStepClear(x,z,s.player.elevation,checking||s.controlledId,checking?s.actorBodies().find(a=>a.id===checking):s.player);
 s.canActorWalk=(a,x,z)=>{checking=a.id;try{return s.canWalk(x,z);}finally{checking=null;}};
 const move=s.move;s.move=(dx,dz,dt)=>{
  const steps=Math.max(1,Math.ceil(movementProfile().speed*dt/.04));
  for(let i=0;i<steps;i++){
   const pose={...s.player},flags=[s.secondFloor,s.onStairs,s.onBarStair];
   move(dx,dz,dt/steps);
   if(!s.actorStepClear(s.player.x,s.player.z,s.player.elevation,s.controlledId,pose)){
    Object.assign(s.player,pose);[s.secondFloor,s.onStairs,s.onBarStair]=flags;s.walking=false;break;
   }
  }
 };
}
