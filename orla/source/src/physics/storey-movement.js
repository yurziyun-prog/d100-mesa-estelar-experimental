import {movementProfile} from './motion.js';
import {state as s} from '../core/state.js';
import {stairFrame,stairPoint,stairHeight,inStairOpening,STOREY_HEIGHT as rise} from './stairs.js';
import {componentBarriers} from '../construction/components.js';
export function installStoreyMovement(stair){
 const originalRescue=s.rescueFromOverlap;
 const groundMove=s.move,groundWalk=s.canWalk,groundSupport=s.supportHeight,groundJump=s.jumpAllowedPoint;
 const base=()=>!s.houseContext&&s.inside(s.player.x,s.player.z);
 const within=(x,z)=>x>s.player.r+.08&&x<s.house.w-s.player.r-.08&&z>s.player.r+.06&&z<5-s.player.r-.06;
 const upperClear=(x,z)=>within(x,z)&&!s.editDecor.some(o=>!o.hidden&&(o.baseY||0)+o.h>rise+.1&&(o.baseY||0)<rise+1.7&&(o.component?componentBarriers(o):[o]).some(b=>s.circleRect(x,z,s.player.r,b)));
 s.rescueFromOverlap=()=>{
  if(base()&&s.onStairs)return;
  if(base()&&s.secondFloor){
   if(upperClear(s.player.x,s.player.z))return;
   for(const radius of [.15,.3,.45,.6])for(let i=0;i<16;i++){const x=s.player.x+Math.cos(i*Math.PI/8)*radius,z=s.player.z+Math.sin(i*Math.PI/8)*radius;if(upperClear(x,z)&&!inStairOpening(stair,x,z,s.player.r)){s.player.x=x;s.player.z=z;return;}}return;
  }
  originalRescue();
 };
 s.canWalk=(x,z,ignore)=>{
  if(base()&&s.onStairs){const f=stairFrame(stair,x,z);return within(x,z)&&f.u>=s.player.r&&f.u<=f.width-s.player.r;}
  if(base()&&s.secondFloor)return upperClear(x,z)&&!inStairOpening(stair,x,z,s.player.r*.65);
  // Open underside: the ramp only blocks headroom where a tread is overhead.
  if(base()&&inStairOpening(stair,x,z)&&stairHeight(stair,x,z)>.45&&stairHeight(stair,x,z)<1.85)return false;
  return groundWalk(x,z,ignore);
 };
 s.supportHeight=(x,z)=>base()&&s.onStairs?stairHeight(stair,x,z):base()&&s.secondFloor?rise:groundSupport(x,z);
 s.jumpAllowedPoint=(x,z)=>base()&&(s.secondFloor||s.onStairs)?s.canWalk(x,z):groundJump(x,z);
 s.move=(dx,dz,dt)=>{
  if(!base()){s.secondFloor=false;s.onStairs=false;return groundMove(dx,dz,dt);}
  const mag=Math.hypot(dx,dz);if(!mag)return;dx/=mag;dz/=mag;
  const {speed,sprint}=movementProfile();
  if(s.secondFloor||s.onStairs){s.sprinting=sprint;if(sprint&&!s.godMode())s.fatigue=Math.max(0,s.fatigue-dt*(3.3+Math.max(0,12-s.SHEETS.traveler.CON)*.5));}
  const steps=Math.max(1,Math.ceil(speed*dt/.045)),step=speed*dt/steps;
  const from=[s.player.x,s.player.z];
  for(let i=0;i<steps;i++){
   const nx=s.player.x+dx*step,nz=s.player.z+dz*step,f=stairFrame(stair,nx,nz),old=stairFrame(stair,s.player.x,s.player.z);
   const aligned=f.u>=s.player.r&&f.u<=f.width-s.player.r;
   const enterBottom=!s.secondFloor&&aligned&&old.v<=.12&&f.v>old.v&&f.v>=0;
   const enterTop=s.secondFloor&&aligned&&old.v>=f.length-.04&&f.v<old.v&&f.v<=f.length;
   if(s.onStairs||enterBottom||enterTop){
    s.onStairs=true;s.secondFloor=false;
    const u=Math.max(s.player.r,Math.min(f.width-s.player.r,f.u));
    [s.player.x,s.player.z]=stairPoint(stair,u,f.v);
    s.player.elevation=stairHeight(stair,s.player.x,s.player.z);
    if(f.v>=f.length){s.onStairs=false;s.secondFloor=true;s.player.elevation=rise;}
    if(f.v<=0){s.onStairs=false;s.player.elevation=0;}
   }else if(s.secondFloor){
    if(s.canWalk(nx,nz)){s.player.x=nx;s.player.z=nz;}
    else if(s.canWalk(nx,s.player.z))s.player.x=nx;
    else if(s.canWalk(s.player.x,nz))s.player.z=nz;
    s.player.elevation=rise;
   }else groundMove(dx,dz,dt/steps);
  }
  if(Math.hypot(s.player.x-from[0],s.player.z-from[1])>.0001){s.walking=true;s.player.step+=dt*10;s.player.faceX=dx;s.player.faceY=dz;}
 };
}
