// A single local coordinate system is shared by all four stair orientations.
export const STOREY_HEIGHT=2.84;
export function stairFrame(a,x,z){
 const r=(a.dir||0)%4;
 return r===0?{u:x-a.x,v:a.z+a.d-z,width:a.w,length:a.d}:r===1?{u:z-a.z,v:x-a.x,width:a.d,length:a.w}:r===2?{u:a.x+a.w-x,v:z-a.z,width:a.w,length:a.d}:{u:a.z+a.d-z,v:a.x+a.w-x,width:a.d,length:a.w};
}
export function stairPoint(a,u,v){const r=(a.dir||0)%4;return r===0?[a.x+u,a.z+a.d-v]:r===1?[a.x+v,a.z+u]:r===2?[a.x+a.w-u,a.z+v]:[a.x+a.w-v,a.z+a.d-u];}
export function stairHeight(a,x,z){const f=stairFrame(a,x,z);return Math.max(0,Math.min(1,f.v/f.length))*STOREY_HEIGHT;}
export function inStairOpening(a,x,z,pad=0){const f=stairFrame(a,x,z);return f.u>-pad&&f.u<f.width+pad&&f.v>0&&f.v<f.length;}
