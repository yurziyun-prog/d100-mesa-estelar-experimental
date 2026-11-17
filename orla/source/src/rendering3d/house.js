import * as T from '../vendor/three/three.module.js';
import {state as s} from '../core/state.js';
import {box,face,rod,material} from './primitives.js';
import {UPPER_WINDOWS} from '../rendering/upper-walls.js';
import {stairPoint,stairFrame,STOREY_HEIGHT as rise} from '../physics/stairs.js';
export function buildHouse(parent,width=10,stair=s.stairArea){
 const root=new T.Group();root.name='Casa '+(width>8?'2':'1');parent.add(root);const walls=[],upper=new T.Group(),roof=new T.Group();root.add(upper,roof);const cream=s.houseFinish?.color||'#dfcbaa',finish=s.houseFinish?.material||'plaster',wood='#8b6746';
 box(root,0,-.18,0,width,.18,5,s.baseFloorFinish?.color||'#967047',s.baseFloorFinish?.material||'wood');
 const segment=(group,side,start,end,base,height)=>{const horizontal=['north','south'].includes(side);return horizontal?box(group,start,base,side==='north'?-.075:4.925,end-start,height,.15,cream,finish):box(group,side==='west'?-.075:width-.075,base,start,.15,height,end-start,cream,finish);};
 const openings={north:[[2,.9]],south:[[1.1,.7],[3.05,1.18,'door']],west:[[1.95,.88]],east:[]};for(const w of s.game.addedWindows||[])openings[w.side]?.push([w.u,w.w]);
 for(let floor=0;floor<(width>8?2:1);floor++)for(const side of ['north','south','east','west']){
  const full=new T.Group(),cut=new T.Group(),length=['north','south'].includes(side)?width:5,y=floor*rise;root.add(full,cut);cut.visible=false;walls.push({side,floor,full,cut});segment(cut,side,0,length,y,.38);let cursor=0;
  const apertures=(floor?UPPER_WINDOWS[side]:openings[side]).slice().sort((a,b)=>a[0]-b[0]);for(const [u,w,type] of apertures){segment(full,side,cursor,u,y,2.92);const sill=type==='door'?0:1.24,top=type==='door'?2.6:2.17;if(sill)segment(full,side,u,u+w,y,sill);segment(full,side,u,u+w,y+top,2.92-top);if(type!=='door'){
   const horizontal=['north','south'].includes(side),at=side==='south'?5:side==='east'?width:0,glass=new T.Mesh(horizontal?new T.BoxGeometry(w,.93,.012):new T.BoxGeometry(.012,.93,w),material('#a7d8ee','glass',true));glass.position.set(horizontal?u+w/2:at,y+1.705,horizontal?at:u+w/2);full.add(glass);
   const point=(a,h)=>horizontal?[a,y+h,at]:[at,y+h,a];for(const a of [u,u+w/2,u+w])rod(full,point(a,1.2),point(a,2.2),.025,'#e4cfaa');for(const h of [1.22,1.7,2.19])rod(full,point(u,h),point(u+w,h),.024,'#e4cfaa');
  }cursor=u+w;}segment(full,side,cursor,length,y,2.92);
  for(let u=.12;u<length;u+=1.4){const horizontal=['north','south'].includes(side),at=side==='south'?5.08:side==='east'?width+.08:-.08;rod(full,horizontal?[u,y,at]:[at,y,u],horizontal?[u,y+2.92,at]:[at,y+2.92,u],.022,'#8e7053');}
 }
 box(root,3.53,0,.1,.14,1.62,2.18,cream,finish);
 const door=new T.Group();door.position.set(3.05,0,5);root.add(door);box(door,0,0,-.04,1.18,2.6,.08,'#765339');for(let i=1;i<6;i++)rod(door,[i*1.18/6,.12,-.05],[i*1.18/6,2.48,-.05],.008,'#4c3a2f');sphereHandle(door);
 if(width>8&&stair){const a=stair,x1=a.x-.09,x2=a.x+a.w+.09,z1=a.z-.03,z2=a.z+a.d+.05;
 for(const [x,z,w,d] of [[.1,.1,x1-.1,4.8],[x2,.1,width-x2-.1,4.8],[x1,.1,x2-x1,z1-.1],[x1,z2,x2-x1,4.9-z2]])box(upper,x,rise-.12,z,w,.12,d,s.baseFloorFinish?.color||wood,s.baseFloorFinish?.material||'wood');
 const frame=stairFrame(a,a.x,a.z),stairs=new T.Group();root.add(stairs);for(let i=0;i<15;i++){const v=(i+.5)/15*frame.length,[x,z]=stairPoint(a,frame.width/2,v),horizontal=a.dir%2;box(stairs,x-(horizontal?frame.length/15:frame.width)/2,(i+1)/15*rise-.12,z-(horizontal?frame.width:frame.length/15)/2,horizontal?frame.length/15+.01:frame.width,.12,horizontal?frame.width:frame.length/15+.01,'#b18a5d');}
 for(const u of [.02,frame.width-.02]){const b=stairPoint(a,u,0),t=stairPoint(a,u,frame.length);rod(stairs,[b[0],.1,b[1]],[t[0],rise-.08,t[1]],.045,wood);rod(stairs,[b[0],.9,b[1]],[t[0],rise+.9,t[1]],.025,'#d4b88b');for(let i=0;i<=5;i++){const v=i/5*frame.length,p=stairPoint(a,u,v),y=v/frame.length*rise;rod(stairs,[p[0],y,p[1]],[p[0],y+.9,p[1]],.018,wood);}}
 for(const [u1,v1,u2,v2] of [[-.09,0,-.09,frame.length],[frame.width+.09,0,frame.width+.09,frame.length],[-.09,0,frame.width+.09,0]]){const a1=stairPoint(a,u1,v1),a2=stairPoint(a,u2,v2);rod(upper,[a1[0],rise+.75,a1[1]],[a2[0],rise+.75,a2[1]],.032,'#d4b88b');for(let i=0;i<=6;i++){const t=i/6,x=a1[0]+(a2[0]-a1[0])*t,z=a1[1]+(a2[1]-a1[1])*t;rod(upper,[x,rise,z],[x,rise+.75,z],.018,wood);}}
 }
 const eave=width>8?5.82:2.96,peak=width>8?7.07:4.18;for(const z of [-.37,5.39])face(roof,[[-.3,eave,z],[width+.3,eave,z],[width+.3,peak,2.5],[-.3,peak,2.5]],'#aa5740','brick');for(const x of [0,width])face(roof,[[x,eave,-.37],[x,eave,5.39],[x,peak,2.5]],cream,finish);
 for(let x=-.3;x<width+.3;x+=.28)for(const z of [-.37,5.39])rod(roof,[x,eave+.015,z],[x,peak+.015,2.5],.012,'#ce7b55');
 const chimney=new T.Group();root.add(chimney);const z=s.chimneyObject?.z||1.22;box(chimney,width+.05,0,z,.38,width>8?7.8:4.9,.82,'#9b8b77','stone');for(let y=.22;y<(width>8?7.8:4.9);y+=.25)rod(chimney,[width+.04,y,z-.01],[width+.44,y,z-.01],.007,'#71655b');box(chimney,width-.01,width>8?7.77:4.87,z-.06,.5,.18,.94,'#baaa90','stone');
 return {root,update(){const inside=!s.houseContext&&s.inside(s.player.x,s.player.z),level=s.secondFloor?1:0;roof.visible=!inside;upper.visible=!inside||level===1;door.rotation.y=-s.doorSwing*Math.PI/2;for(const w of walls){const px=w.side==='east'?width:w.side==='west'?0:width/2,pz=w.side==='south'?5:w.side==='north'?0:2.5,near=s.painterDepth(px,pz)>s.painterDepth(width/2,2.5),visible=!inside||w.floor<=level;w.full.visible=visible&&!(inside&&near);w.cut.visible=visible&&inside&&near;}}};
}
function sphereHandle(door){const m=new T.Mesh(new T.SphereGeometry(.035,10,8),material('#cfaa50','metal'));m.position.set(.99,1.1,-.09);door.add(m);}
