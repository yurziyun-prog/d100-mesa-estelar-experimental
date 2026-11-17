import {BIOMES,treeGeometry,meshParts,buildCampaignLandscape} from '../campaign/three.js';
import * as T from '../vendor/three/three.module.js';
import {state as s} from '../core/state.js';
import {box,face,rod,sphere} from './primitives.js';
import {transformPoint} from '../physics/footprint.js';
import {drawComponent} from '../rendering/components.js';
import {drawFurnitureInstance} from '../rendering/furniture.js';
import {componentPoint,localSize} from '../construction/components.js';
export function captureDrawing(group,draw,map=p=>p){
 const old={quad3:s.quad3,line3:s.line3,cylinder:s.cylinder,poly:s.poly,objectTransformActive:s.objectTransformActive,captureGeometry:s.captureGeometry};const convert=p=>{const q=map(p);return [q[0],q[2]||0,q[1]];};s.ctx.save();
 s.quad3=(a,b,c,d,color)=>{if(typeof color==='string')face(group,[a,b,c,d].map(convert),color,'plain');};s.line3=(a,b,color,w=1)=>{if(typeof color==='string')rod(group,convert(a),convert(b),Math.min(.018,w*.0035),color,'plain');};s.cylinder=(x,z,h,r,c1)=>rod(group,convert([x,z,0]),convert([x,z,h]),r,c1,'plain');s.poly=()=>{};s.objectTransformActive=true;s.captureGeometry=true;
 try{draw();}finally{Object.assign(s,old);s.ctx.restore();}
}
export function buildFurniture(parent){
 for(const [i,o] of (s.baseHouseEnabled===false&&!s.houseContext?[]:s.fixedSolids).entries()){if(o.hidden)continue;const g=new T.Group();g.name=o.id||'furniture-'+i;parent.add(g);const fn={cama:s.drawBed,escrivaninha:s.drawDesk,armario:s.drawWardrobe,bau:s.drawChest,chamine:s.drawChimney};if(o.label==='luminaria'){const x=o.x+o.w/2,z=o.z+o.d/2;captureDrawing(g,()=>s.drawLamp(x,z));if(s.game.lamps[s.lampIndexAt(x,z)]){const light=new T.PointLight('#ffd7a0',3,6,1.6);light.position.set(x,1.3,z);g.add(light);}}else if(fn[o.label])captureDrawing(g,fn[o.label],p=>transformPoint(o,...p));}
 for(const o of (s.baseHouseEnabled===false&&!s.houseContext?[]:s.pushables))if(!o.hidden)captureDrawing(parent,()=>s.drawMoveable(o),p=>transformPoint(o,...p));
 if((s.baseHouseEnabled!==false||s.houseContext)&&s.game.rug.placed){const r=s.game.rug;box(parent,r.x,.012,r.z,2.4,.012,1.65,'#67243b','plain');for(const off of [.06,.12]){rod(parent,[r.x+off,.03,r.z+off],[r.x+2.4-off,.03,r.z+off],.015,'#cf9d5c');rod(parent,[r.x+off,.03,r.z+1.65-off],[r.x+2.4-off,.03,r.z+1.65-off],.015,'#cf9d5c');}}
 for(const o of (s.houseContext?[]:s.editDecor)){if(o.hidden||o.kind?.startsWith('house'))continue;const g=new T.Group();g.name=o.id||'editor-object';parent.add(g);if(o.component)captureDrawing(g,()=>drawComponent(o));else if(['table','bed','chest','shelf','lamp','chair','barrel'].includes(o.kind)){const canonical={table:[1.12,.58,.58],bed:[1.6,.92,.35],chest:[.96,.66,.54],shelf:[.74,1.56,1.95],lamp:[.18,.18,1.34],chair:[.5,.5,.8],barrel:[.5,.5,.8]}[o.kind],size=localSize(o);captureDrawing(g,()=>drawFurnitureInstance(o),p=>componentPoint(o,p[0]/canonical[0]*size[0],p[1]/canonical[1]*size[1],p[2]/canonical[2]*o.h));}else if(o.kind==='rock')sphere(g,[o.x,.3,o.z],[.5,.3,.4],'#7e8681');}
}
export function buildWorld(parent){
 buildCampaignLandscape(parent);
 box(parent,-60,-.3,-60,120,.1,120,BIOMES[s.activeMap?.()?.biome]?.ground||'#496257','plaster');if(s.baseHouseEnabled!==false)box(parent,3.08,-.01,5.04,1.06,.015,8.96,'#b3a88d','stone');
 s.foliage.forEach(([x,z,size],i)=>{if(s.gathering.trees[i]?.fallen)return;if(s.baseHouseEnabled===false){meshParts(parent,treeGeometry(s.treeType(i),size),x,z);return;}rod(parent,[x,0,z],[x,2.2*size,z],.10*size,'#73604b');for(let j=0;j<6;j++){const a=j*2.4;sphere(parent,[x+Math.cos(a)*.35*size,(1.6+j*.14)*size,z+Math.sin(a)*.35*size],[.48*size,.44*size,.45*size],['#537361','#66816a','#798d6c'][j%3]);}});
 for(const [x,z,size] of s.shrubs)sphere(parent,[x,.24*size,z],[.4*size,.27*size,.35*size],'#637853');for(const r of s.gathering.rocks)if(r.hp>0){const m=new T.Mesh(new T.DodecahedronGeometry(.5,0),new T.MeshStandardMaterial({color:'#79817c',roughness:1}));m.position.set(r.x,.3,r.z);m.scale.y=.65;m.castShadow=true;parent.add(m);}
 for(const [key,p] of Object.entries(s.game.groundKeys))if(!s.game.items[key+'Key']){const torus=new T.Mesh(new T.TorusGeometry(.075,.012,6,16),new T.MeshStandardMaterial({color:'#d4bd6d',metalness:.7,roughness:.3}));torus.rotation.x=Math.PI/2;torus.position.set(p.x,.06,p.z);parent.add(torus);rod(parent,[p.x+.07,.06,p.z],[p.x+.27,.06,p.z],.013,'#d4bd6d');}
 for(const o of s.game.droppedItems)if(s.ITEM_SPEC[o.type])box(parent,o.x,.025,o.z,.12,.12,.15,o.type==='reviveSerum'?'#65bdce':'#b9a77b','metal');
}
