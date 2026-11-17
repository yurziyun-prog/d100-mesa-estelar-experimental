import {state as s} from '../core/state.js';
import {drawComponent} from './components.js';
export function naturalGround(){
  const {ctx,W,H}=s;
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#253f3c');sky.addColorStop(1,'#526852');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  // Soft world-space patches remove the hard rectangular edge without changing collision.
  for(let x=-18;x<=24;x+=3)for(let z=-16;z<=23;z+=3){
    const n=s.rnd(x*47+z*73),p=s.P(x,z),r=s.scale*s.zoom*(2.8+n);
    const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],r);
    g.addColorStop(0,n>.5?'#738369aa':'#425e4dbb');g.addColorStop(1,'#425e4d00');ctx.fillStyle=g;ctx.fillRect(p[0]-r,p[1]-r,r*2,r*2);
  }
  for(let i=0;i<2000;i++){
    const x=-12+s.rnd(i*3.1)*32,z=-11+s.rnd(i*7.3)*30,n=s.rnd(i*19);
    if(x>-.15&&x<10.15&&z>-.15&&z<5.15)continue;
    if(x>2.94&&x<4.32&&z>5&&z<14.2)continue;
    const p=s.P(x,z),u=s.scale*s.zoom;
    ctx.strokeStyle=n>.75?'#afb78c66':'#203f3670';ctx.lineWidth=.75*s.zoom;ctx.beginPath();ctx.moveTo(p[0]-u*.025,p[1]);ctx.quadraticCurveTo(p[0]-u*.025,p[1]-u*.05,p[0]-u*.06,p[1]-u*(.07+n*.07));ctx.moveTo(p[0],p[1]);ctx.quadraticCurveTo(p[0]+u*.015,p[1]-u*.06,p[0]+u*.06,p[1]-u*.08);ctx.stroke();
    if(n>.975){ctx.fillStyle='#b6b39e';ctx.beginPath();ctx.ellipse(p[0]+2,p[1]+1,u*.045,u*.022,.2,0,7);ctx.fill();}
  }
  const left=[],right=[];
  for(let i=0;i<=35;i++){const z=5.04+i*.26,n=s.rnd(i*12);left.push(s.P(3.08-(i? n*.16:0),z,.018));right.unshift(s.P(4.14+(i?n*.21:0),z,.018));}
  s.poly([...left,...right],'#918675');
  for(let i=0;i<100;i++){
    const z=5.17+s.rnd(i*7)*8.95,x=3.08+s.rnd(i*13)*1.03,n=s.rnd(i*17),w=.11+n*.18,d=.08+n*.13;
    const points=[[x,z],[x+w*.8,z-.015],[x+w,z+d*.65],[x+w*.15,z+d]].map(([x,z])=>s.P(x,z,.023));
    s.poly(points,['#b0a68e','#8e8878','#c0b296','#9e947f'][i%4],'#5e62544a',.6);
  }
}
export function naturalTree(x,z,size=1){
  const {ctx}=s,u=s.scale*s.zoom*size,p=s.P(x,z);
  ctx.save();
  const shadow=ctx.createRadialGradient(p[0]+u*.2,p[1]+u*.08,0,p[0]+u*.2,p[1]+u*.08,u*.85);shadow.addColorStop(0,'#10262375');shadow.addColorStop(1,'#10262300');ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(p[0]+u*.2,p[1]+u*.08,u*.95,u*.31,-.2,0,7);ctx.fill();
  s.cylinder(x,z,1.65*size,.12*size,'#514a39','#8a7851');
  for(let i=0;i<4;i++)s.line3([x+(i-2)*.035*size,z,0],[x+(i-1)*.02*size,z,1.55*size],i%2?'#897455':'#353c30',Math.max(.7,size*s.zoom));
  const groups=[[-.42,.10,1.73,.46],[.40,.08,1.88,.49],[-.06,-.34,2.2,.56],[.02,.27,2.02,.55],[-.18,-.06,2.48,.39]];
  groups.sort((a,b)=>s.painterDepth(x+a[0],z+a[1])-s.painterDepth(x+b[0],z+b[1]));
  groups.forEach(([dx,dz,y,rad],i)=>{
    const q=s.P(x+dx*size,z+dz*size,y*size),r=u*rad;
    const g=ctx.createRadialGradient(q[0]-r*.35,q[1]-r*.5,0,q[0],q[1],r*1.1);g.addColorStop(0,'#a3b379');g.addColorStop(.4,'#6c8c5d');g.addColorStop(1,'#294e42');ctx.fillStyle=g;
    ctx.beginPath();for(let j=0;j<=36;j++){const angle=j/36*Math.PI*2,rr=r*(.86+s.rnd(i*81+(j%36)*7+x)*.19),xx=q[0]+Math.cos(angle)*rr,yy=q[1]+Math.sin(angle)*rr*.88;if(!j)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.closePath();ctx.fill();
    for(let j=0;j<34;j++){const a=s.rnd(i*37+j*29+x)*Math.PI*2,rr=r*Math.sqrt(s.rnd(i*71+j*19))*.8;ctx.fillStyle=j%3?'#b9c38a55':'#193c3440';ctx.beginPath();ctx.ellipse(q[0]+Math.cos(a)*rr,q[1]+Math.sin(a)*rr*.8,r*.08,r*.035,-.4,0,7);ctx.fill();}
  });ctx.restore();
}
export function contactShadows(){
  const {ctx}=s;
  for(const o of [...s.fixedSolids,...s.pushables]){
    if(o.hidden||o.label==='chamine')continue;
    const p=s.P(o.x+o.w/2,o.z+o.d/2,.035),r=Math.max(o.w,o.d)*s.scale*s.zoom*.8;
    const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],r);g.addColorStop(0,'#1b20224d');g.addColorStop(1,'#1b202200');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(p[0],p[1],r,r*.48,0,0,7);ctx.fill();
  }
}
export function installAtmosphere(){
  s.enhancedVisuals=true;
  const ground=s.ground,tree=s.tree,floor=s.floorSurface,bush=s.bush;
  s.ground=()=>{if(s.enhancedVisuals)naturalGround();else ground();for(const o of s.editDecor)if(o.component&&o.kind==='floor'&&!o.hidden&&!s.inside(o.x,o.z))drawComponent(o);};
  s.tree=(...args)=>s.enhancedVisuals?naturalTree(...args):tree(...args);
  s.bush=(x,z,size)=>{if(!s.enhancedVisuals)return bush(x,z,size);const original=s.P;s.P=(xx,zz,y=0)=>original(xx,zz,y*.38);try{naturalTree(x,z,size*.62);}finally{s.P=original;}};
  s.floorSurface=()=>{floor();if(!s.houseContext)for(const o of s.editDecor)if(o.component&&o.kind==='floor'&&!o.hidden&&s.inside(o.x,o.z))drawComponent(o);if(s.enhancedVisuals)contactShadows();};
  const draw=s.draw;s.draw=()=>{draw();if(s.editMode&&s.selected){const o=s.selected;if(Number.isFinite(o.w)){s.ctx.save();const y=(o.baseY||0)+o.h+.03;const p=[[o.x,o.z,y],[o.x+o.w,o.z,y],[o.x+o.w,o.z+o.d,y],[o.x,o.z+o.d,y]].map(v=>s.P(...v));s.ctx.beginPath();p.forEach((q,i)=>i?s.ctx.lineTo(...q):s.ctx.moveTo(...q));s.ctx.closePath();s.ctx.strokeStyle='#b8dfd1';s.ctx.lineWidth=2;s.ctx.setLineDash([5,4]);s.ctx.stroke();s.ctx.restore();}}};
  const button=document.createElement('button');button.id='visualStyle';button.className='secondary-control';button.textContent='◈ Visual: atmosférico';button.onclick=()=>{s.enhancedVisuals=!s.enhancedVisuals;button.textContent=s.enhancedVisuals?'◈ Visual: atmosférico':'◈ Visual: original';};document.getElementById('topActions').append(button);
}
