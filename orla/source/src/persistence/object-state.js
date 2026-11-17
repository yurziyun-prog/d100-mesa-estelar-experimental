// Stable identity survives duplicate labels, reordered arrays and old saves.
export function assignObjectIds(objects, prefix) {
  objects.forEach((object, index) => { object.id ||= `${prefix}-${index}`; });
}
export function serializeFurniture(o) {
  return {id:o.id,label:o.label,x:o.x,z:o.z,w:o.w,d:o.d,h:o.h,rot:o.rot||0,angle:o.angle,hidden:!!o.hidden};
}
export function restoreFurniture(objects, saved) {
  if (!Array.isArray(saved)) return;
  const used = new Set();
  for (const entry of saved) {
    if (!entry || typeof entry !== 'object') continue;
    const object = entry.id ? objects.find(o=>o.id===entry.id) : objects.find(o=>o.label===entry.label&&!used.has(o));
    if (!object) continue;
    used.add(object);
    for (const key of ['x','z','w','d','h']) {
      const value=entry[key];
      if(Number.isFinite(value)&&Math.abs(value)<=100&&(key==='x'||key==='z'||value>0)) object[key]=value;
    }
    if(Number.isFinite(entry.rot)) object.rot=((Math.round(entry.rot)%4)+4)%4;
    if(Number.isFinite(entry.angle)) object.angle=((entry.angle%360)+360)%360;
    if(typeof entry.hidden==='boolean') object.hidden=entry.hidden;
  }
}
