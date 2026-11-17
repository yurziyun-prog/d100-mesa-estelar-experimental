import {UPPER_WINDOWS} from './upper-walls.js';
import {state as s} from '../core/state.js';
import {footprintCorners} from '../physics/footprint.js';
export function convexHull(points){
  const p=points.map(q=>[q[0],q[1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const half=list=>{const result=[];for(const q of list){while(result.length>1&&cross(result.at(-2),result.at(-1),q)<=0)result.pop();result.push(q);}return result;};
  return [...half(p).slice(0,-1),...half([...p].reverse()).slice(0,-1)];
}
function path(ctx,points){points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
function clipFace(ctx,points,holes=[]){ctx.beginPath();ctx.rect(-1,-1,s.W+2,s.H+2);path(ctx,points.map(p=>s.P(...p)));for(const hole of holes)path(ctx,hole.map(p=>s.P(...p)));ctx.clip('evenodd');}
function wallMask(entity,hx,hz,width,height,baseY=0){
  const vx=Math.cos(s.cameraYaw)+Math.sin(s.cameraYaw),vz=Math.cos(s.cameraYaw)-Math.sin(s.cameraYaw);
  for(const side of ['north','south','east','west']){
    const alongX=side==='north'||side==='south',plane=alongX?hz+(side==='south'?5:0):hx+(side==='east'?width:0),v=alongX?vz:vx,pos=alongX?entity.z:entity.x;
    if(Math.abs(v)<.001||(plane-pos)/v<=.001)continue;
    const length=alongX?width:5,mid=s.painterDepth(hx+width/2,hz+2.5),sideDepth=s.painterDepth(alongX?hx+width/2:plane,alongX?plane:hz+2.5);
    const h=height==='cut'&&sideDepth>mid?(s.zoom>1.42?.18:.56):2.92;
    const point=(u,y)=>alongX?[hx+u,plane,y+baseY]:[plane,hz+u,y+baseY];
    const holes=[];
    if(h>2.17){
      const openings=baseY?(side==='east'?[]:UPPER_WINDOWS[side].map(([a,w])=>[a,a+w])):side==='north'?[[2,2.9]]:side==='south'?[[1.1,1.8]]:side==='west'?[[1.95,2.83]]:[];
      const house=s.houseInstances().find(o=>o.x===hx&&o.z===hz),windows=house?s.ensureHouseState(house).addedWindows:s.game.addedWindows;
      for(const o of windows||[])if(o.side===side)openings.push([o.u,o.u+o.w]);
      for(const [a,b] of openings)holes.push([point(a,1.24),point(b,1.24),point(b,2.17),point(a,2.17)]);
    }
    if(side==='south'&&!baseY){
      const house=s.houseInstances().find(o=>o.x===hx&&o.z===hz),door=house?s.ensureHouseState(house).door:s.game.door;
      if(door.open)holes.push([point(3.05,0),point(4.23,0),point(4.23,Math.min(h,2.6)),point(3.05,Math.min(h,2.6))]);
    }
    clipFace(s.ctx,[point(0,0),point(length,0),point(length,h),point(0,h)],holes);
  }
}
export function drawSceneEntity(entity){
  if(entity.kind==='house'||entity.kind?.startsWith('house-'))return entity.draw();
  s.ctx.save();
  try{
    if(s.baseHouseEnabled!==false){
      const actor=['party','npc','enemy','corpse'].includes(entity.kind),inside=s.inside(entity.x,entity.z),elevation=entity.elevation||0;
      if(actor&&inside&&(!s.reveal()||(s.secondFloor?elevation<2.5:elevation>=2.5)))return;
      wallMask(entity,0,0,s.house.w,s.reveal()&&!s.secondFloor?'cut':'full');
      if(s.house.w>8&&(!s.reveal()||s.secondFloor))wallMask(entity,0,0,s.house.w,s.reveal()?'cut':'full',2.84);
    }
    for(const house of s.houseInstances())if(entity.x!==house.x||entity.z!==house.z)wallMask(entity,house.x,house.z,house.kind==='house2'?10:7,s.cloneInteriorAt(s.player.x,s.player.z)===house?'cut':'full');
    entity.draw();
  }finally{s.ctx.restore();}
}
export function clipIndoorWeather(ctx){
  const houses=[];
  if(s.reveal())houses.push({x:0,z:0,w:s.house.w,d:5});
  for(const o of s.houseInstances())if(s.cloneInteriorAt(s.player.x,s.player.z)===o||s.roofMode===2)houses.push(o);
  for(const o of houses){const points=[];for(const x of [o.x,o.x+o.w])for(const z of [o.z,o.z+o.d])for(const y of [0,s.secondFloor?5.82:2.96])points.push(s.P(x,z,y));ctx.beginPath();ctx.rect(-1,-1,s.W+2,s.H+2);path(ctx,convexHull(points));ctx.clip('evenodd');}
}
export function withFurnitureOcclusion(character,pose=s.player){
    s.ctx.save();
    try{
      const vx=Math.cos(s.cameraYaw)+Math.sin(s.cameraYaw),vz=Math.cos(s.cameraYaw)-Math.sin(s.cameraYaw);
      for(const o of (s.baseHouseEnabled!==false&&s.inside(pose.x,pose.z)?[...s.fixedSolids,...s.pushables]:[])){
        if(o.hidden||o.label==='luminaria'||o.label==='chamine'||o.h<(pose.elevation||0)+(pose.jumpY||0))continue;
        const corners=footprintCorners(o);
        for(let i=0;i<4;i++){
          const a=corners[i],b=corners[(i+1)%4],normal=[b[1]-a[1],-(b[0]-a[0])],view=normal[0]*vx+normal[1]*vz;
          if(view<=.001)continue;
          if(normal[0]*(pose.x-a[0])+normal[1]*(pose.z-a[1])>=-.001)continue;
          clipFace(s.ctx,[[a[0],a[1],0],[b[0],b[1],0],[b[0],b[1],o.h],[a[0],a[1],o.h]]);
        }
      }
      character();
    }finally{s.ctx.restore();}
}
export function installOcclusion(){s.drawSceneEntity=drawSceneEntity;const character=s.character;s.character=()=>withFurnitureOcclusion(character);}
