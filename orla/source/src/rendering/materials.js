import {state as s} from '../core/state.js';
import {floorMetalDeck,wallSteel} from '../vendor/mesa/textures.ts';
const tiles=new Map();
export function materialTile(material){
 if(tiles.has(material))return tiles.get(material);
 const create=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});let c;
 if(material==='metal')c=floorMetalDeck(create,{px:128,tileM:1,seed:53,wear:1});
 else {c=create(128,128);const x=c.getContext('2d');let seed=54;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);x.fillStyle='#a79a84';x.fillRect(0,0,128,128);
 for(let i=0;i<1900;i++){x.fillStyle=`rgba(${rand()>.5?'255,245,224':'25,19,14'},${rand()*.14})`;x.fillRect(rand()*128,rand()*128,material==='wood'?12:1.5,1);}
 x.lineWidth=1;x.strokeStyle='#423e3655';
 if(material==='wood'){for(let y=0;y<128;y+=16){x.beginPath();x.moveTo(0,y);x.lineTo(128,y);x.stroke();for(let i=0;i<8;i++){x.beginPath();x.ellipse(rand()*128,y+8,8+rand()*20,1+rand()*2,0,0,7);x.stroke();}}}
 if(['stone','brick','ceramic'].includes(material)){const h=material==='brick'?16:32;for(let y=0;y<128;y+=h){x.beginPath();x.moveTo(0,y);x.lineTo(128,y);for(let a=(y/h%2)*16;a<128;a+=32){x.moveTo(a,y);x.lineTo(a,y+h);}x.stroke();}}
 }
 tiles.set(material,c);return c;
}
export function textureFace(points,material,alpha=.2){
 if(!material||points.length!==4)return;const p=points.map(q=>s.P(...q)),a=p[0],b=p[1],d=p[3];const width=Math.hypot(...points[1].map((v,i)=>v-points[0][i]))*96,height=Math.hypot(...points[3].map((v,i)=>v-points[0][i]))*96;if(width<1||height<1)return;
 const c=s.ctx;c.save();try{c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.clip();c.globalAlpha*=alpha;c.transform((b[0]-a[0])/width,(b[1]-a[1])/width,(d[0]-a[0])/height,(d[1]-a[1])/height,...a);c.fillStyle=c.createPattern(materialTile(material),'repeat');c.fillRect(0,0,width,height);}finally{c.restore();}
}
export function withMaterial(material,fn){const before=s.surfaceMaterial;s.surfaceMaterial=material;try{return fn();}finally{s.surfaceMaterial=before;}}
export function installMaterials(){
 const quad=s.quad3;s.quad3=(a,b,c,d,...args)=>{quad(a,b,c,d,...args);if(s.surfaceMaterial)textureFace([a,b,c,d],s.surfaceMaterial);};
 for(const name of ['wallX','wallZ','wallPanel']){const original=s[name];s[name]=(...args)=>withMaterial(s.surfaceMaterial||(!s.houseContext?s.houseFinish?.material:null)||'plaster',()=>original(...args));}
 const floor=s.floorSurface;s.floorSurface=()=>withMaterial(s.baseFloorFinish?.material||'wood',floor);
 s.withMaterial=withMaterial;
}
