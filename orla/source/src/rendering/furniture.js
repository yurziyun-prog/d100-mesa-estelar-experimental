import {state as s} from '../core/state.js';
import {componentPoint,localSize} from '../construction/components.js';
const kinds={table:'mesa',bed:'cama',chest:'bau',shelf:'armario',lamp:'luminaria',chair:'banquinho',barrel:'barril'};
export function isFurnitureInstance(o){return !!o&&!!kinds[o.kind];}
// Reuse the detailed original drawing in local coordinates; restore all context in finally.
export function drawFurnitureInstance(o){
  const label=kinds[o.kind];if(!label)return;
  const base=[...s.fixedSolids,...s.pushables].find(v=>v.label===label);
  const dimensions={table:[1.12,.58,.58],bed:[1.6,.92,.35],chest:[.96,.66,.54],shelf:[.74,1.56,1.95],lamp:[.18,.18,1.34],chair:[.5,.5,.8],barrel:[.5,.5,.8]};
  const [cw,cd,ch]=dimensions[o.kind],canonical={w:cw,d:cd,h:ch};
  const before=base?{...base}:null,project=s.P,yaw=s.cameraYaw,chest=s.game.chest,contents=s.game.stores.chest,lamps=s.game.lamps,shelf=s.game.stores.shelf,rows=s.shelfRows;
  const [w,d]=localSize(o),bw=canonical.w,bd=canonical.d,bh=canonical.h;
  const c=Math.cos(yaw),si=Math.sin(yaw),zoom=s.scale*s.zoom;
  s.P=(x,z,y=0)=>{
    const q=componentPoint(o,x/bw*w,z/bd*d,y/bh*o.h),dx=q[0]-s.camX,dz=q[1]-s.camZ,rx=dx*c-dz*si,rz=dx*si+dz*c;
    return [s.W*.5+(rx-rz)*zoom*.87,s.H*.56+(rx+rz)*zoom*.45-q[2]*zoom];
  };
  s.cameraYaw=yaw+(Number.isFinite(o.angle)?o.angle:(o.rot||0)*90)*Math.PI/180;
  const previousTransform=s.objectTransformActive;s.objectTransformActive=true;
  if(base)Object.assign(base,{...canonical,x:0,z:0,rot:0,hidden:false});
  // Tint is a translucent material wash over each existing polygon, preserving detail.
  const quad=s.quad3;
  const tint=o.tint&&o.tint!=='#b7a58a'?o.tint:({metal:'#729a9f',stone:'#929588',plaster:'#d0c6a9'})[o.material];
  if(tint)s.quad3=(a,b,c,d,fill,stroke)=>quad(a,b,c,d,fill?.startsWith('#')?mix(fill,tint,.45):fill,stroke);
  try{
    if(o.kind==='table')s.drawMoveable(base);
    else if(o.kind==='bed')s.drawBed();
    else if(o.kind==='shelf'){s.game.stores.shelf=o.contents||[];s.shelfRows=[Math.min(5,s.game.stores.shelf.length),0,0];s.drawWardrobe();}
    else if(o.kind==='lamp'){s.game.lamps=[o.lit!==false,o.lit!==false];s.drawLamp(bw/2,bd/2);}
    else if(o.kind==='chest'){s.game.chest=o.chestState||{open:false,locked:false};s.game.stores.chest=o.contents||[];s.drawChest();}
    else if(o.kind==='chair'){
      for(const x of [.04,bw-.1])for(const z of [.04,bd-.1])s.box3(x,z,.06,.06,.37,['#503c2d','#715139','#967149']);
      s.box3(0,0,bw,bd,.06,['#73543c','#896747','#b39163'],.37);
      for(const x of [.03,bw-.08])s.box3(x,bd-.07,.05,.06,.4,['#503c2d','#715139','#967149'],.4);
      s.box3(.03,bd-.07,bw-.06,.06,.09,['#73543c','#896747','#b39163'],.69);
    }else{
      const radius=bw*.48,center=[bw/2,bd/2];
      for(let i=0;i<16;i++){const a=i*Math.PI/8,b=(i+1)*Math.PI/8;const p=(angle,y,r)=>[center[0]+Math.cos(angle)*r,center[1]+Math.sin(angle)*r,y];s.quad3(p(a,.06,radius*.84),p(b,.06,radius*.84),p(b,.7,radius),p(a,.7,radius),i%2?'#8c6944':'#775839','#493e31');}
      const points=Array.from({length:16},(_,i)=>s.P(center[0]+Math.cos(i*Math.PI/8)*radius,center[1]+Math.sin(i*Math.PI/8)*radius,.7));s.poly(points,'#a08358','#514636');
      for(const y of [.16,.58])for(let i=0;i<16;i++){const a=i*Math.PI/8,b=(i+1)*Math.PI/8;s.line3([center[0]+Math.cos(a)*radius,center[1]+Math.sin(a)*radius,y],[center[0]+Math.cos(b)*radius,center[1]+Math.sin(b)*radius,y],'#415558',2.5);}
    }
  }finally{if(base){for(const key of Object.keys(base))delete base[key];Object.assign(base,before);}s.P=project;s.cameraYaw=yaw;s.quad3=quad;s.game.chest=chest;s.game.stores.chest=contents;s.game.lamps=lamps;s.game.stores.shelf=shelf;s.shelfRows=rows;s.objectTransformActive=previousTransform;}
}
function mix(a,b,t){const expand=x=>x.length===4?'#'+x.slice(1).split('').map(c=>c+c).join(''):x;return '#'+[0,2,4].map(i=>Math.round(parseInt(expand(a).slice(i+1,i+3),16)*(1-t)+parseInt(b.slice(i+1,i+3),16)*t).toString(16).padStart(2,'0')).join('');}
