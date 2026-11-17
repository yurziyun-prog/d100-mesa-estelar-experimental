import {state as s} from '../core/state.js';
import {rotationDelta,transformPoint} from '../physics/footprint.js';
export function withObjectTransform(o,draw){
  if(!o)return draw();
  const angle=rotationDelta(o);
  if(s.objectTransformActive||!angle)return draw();
  const projection=s.P,yaw=s.cameraYaw;
  s.objectTransformActive=true;s.cameraYaw=yaw+angle;
  s.P=(x,z,y=0)=>{const p=transformPoint(o,x,z,y);s.cameraYaw=yaw;try{return projection(...p);}finally{s.cameraYaw=yaw+angle;}};
  try{return draw();}finally{s.P=projection;s.cameraYaw=yaw;s.objectTransformActive=false;}
}
export function installObjectTransforms(){
  for(const [name,key] of [['drawBed','bedObject'],['drawDesk','deskObject'],['drawWardrobe','wardrobeObject'],['drawChest','chestObject'],['drawerFrontAtClick','deskObject'],['shelfItemAtScreen','wardrobeObject']]){
    const draw=s[name];s[name]=(...args)=>withObjectTransform(s[key],()=>draw(...args));
  }
  const moveable=s.drawMoveable;s.drawMoveable=o=>withObjectTransform(o,()=>moveable(o));
  const surface=s.drawSurfaceItems;s.drawSurfaceItems=(id=null)=>{for(const [key,o] of [['table',s.pushables.find(o=>o.label==='mesa')],['bed',s.bedObject],['deskTop',s.deskObject]])if(!id||key===id)withObjectTransform(o,()=>surface(key));};
  const hit=s.surfaceItemAtScreen;s.surfaceItemAtScreen=(id,...args)=>withObjectTransform(s.storeObject(id),()=>hit(id,...args));
}
