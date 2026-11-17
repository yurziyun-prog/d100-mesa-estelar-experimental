// The legacy rot stores quarter-turn AABBs. angle adds a precise orientation
// relative to that saved pose, so loading an old object never changes its layout.
export function rotationDelta(o){return Number.isFinite(o.angle)?(o.angle-(o.rot||0)*90)*Math.PI/180:0;}
export function transformPoint(o,x,z,y=0){
  const a=rotationDelta(o),c=Math.cos(a),s=Math.sin(a),cx=o.x+o.w/2,cz=o.z+o.d/2;
  return [cx+(x-cx)*c-(z-cz)*s,cz+(x-cx)*s+(z-cz)*c,y];
}
export function footprintCorners(o){return [[o.x,o.z],[o.x+o.w,o.z],[o.x+o.w,o.z+o.d],[o.x,o.z+o.d]].map(([x,z])=>transformPoint(o,x,z));}
export function footprintBounds(o){const p=footprintCorners(o),xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);const x=Math.min(...xs),z=Math.min(...zs);return {x,z,w:Math.max(...xs)-x,d:Math.max(...zs)-z};}
export function footprintDistance(x,z,o){
  const a=-rotationDelta(o),c=Math.cos(a),s=Math.sin(a),cx=o.x+o.w/2,cz=o.z+o.d/2;
  const px=cx+(x-cx)*c-(z-cz)*s,pz=cz+(x-cx)*s+(z-cz)*c;
  return Math.hypot(Math.max(o.x-px,0,px-o.x-o.w),Math.max(o.z-pz,0,pz-o.z-o.d));
}
export function circleFootprint(x,z,r,o){return footprintDistance(x,z,o)<r;}
export function footprintsOverlap(a,b,pad=0){
  const aa=footprintCorners(a),bb=footprintCorners(b);
  for(const polygon of [aa,bb])for(let i=0;i<2;i++){
    const p=polygon[i],q=polygon[i+1],axis=[-(q[1]-p[1]),q[0]-p[0]],len=Math.hypot(...axis);
    if(!len)continue;axis[0]/=len;axis[1]/=len;
    const ap=aa.map(p=>p[0]*axis[0]+p[1]*axis[1]),bp=bb.map(p=>p[0]*axis[0]+p[1]*axis[1]);
    if(Math.max(...ap)+pad<=Math.min(...bp)||Math.max(...bp)+pad<=Math.min(...ap))return false;
  }
  return true;
}
