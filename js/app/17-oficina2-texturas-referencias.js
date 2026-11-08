// ============================================================
// V46.77.0 — OFICINA 2 EXPERIMENTAL
// Editor novo e independente. Não reutiliza os controladores da Oficina 1.
// ============================================================
(function(){
'use strict';

let gm2MesaBridge_=null;
// v199 kit do mestre: peças encaixáveis de construção (salas prontas) como carimbos.
let gm2PecaAPI=null;import('./mesa-construcao.js?v=190').then(m=>{gm2PecaAPI=m;}).catch(()=>{});
const GM2_KEY='mesa_estelar_oficina2_v1';
const GM2_CLIP={items:[]};
const gm2={
  st:{
    w:28,h:14,ppm:32,bg:'#d7d7d7',bgImage:'',grid:'#777777',showGrid:false,texture:'nenhuma',
    name:'',mapId:'',elements:[]
  },
  tool:'select', shape:'retangulo', line:'linha_reta', brush:'redondo', stamp:'montanha',pecaGiro:0,pecaMat:'pedra-rio',
  selected:new Set(), primary:'',
  defaults:{
    fill:'#59e391',fillOpacity:1,stroke:'#111111',strokeWidth:0,strokeOpacity:1,
    size:7,opacity:1,shadow:'nenhuma',shadowDir:'SE',shadowDist:4
  },
  history:[],future:[],drag:null,renderQueued:false,
  internalPasteStamp:0,lastExternalPasteSig:'',lastExternalPasteAt:0
};

function gm2clone(x){return JSON.parse(JSON.stringify(x));}
function gm2id(p='e'){return `${p}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`;}
function gm2esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function gm2saveLocal(){if(gm2MesaBridge_){gm2MesaBridge_.dirty=true;gm2MesaBridge_.updateStatus?.();return;}try{localStorage.setItem(GM2_KEY,JSON.stringify(gm2.st));}catch(e){console.warn(e);}}
function gm2loadLocal(){try{const x=JSON.parse(localStorage.getItem(GM2_KEY)||'null');if(x&&Array.isArray(x.elements))gm2.st={...gm2.st,...x};}catch(e){console.warn(e);}}
gm2loadLocal();
if(gm2.st.texture==='pedra')gm2.st.texture='rocha';


// Migração do rascunho 2 anterior: espessuras passam a acompanhar a escala em metros.
for(const e of gm2.st.elements||[]){
 if((e.type==='path'||e.type==='line')&&e.strokeWidthM==null)e.strokeWidthM=Math.max(.01,Number(e.strokeWidth||1)/Math.max(1,gm2.st.ppm));
 if(e.type==='path'&&e.brush==='giz')e.brush='giz_cera';
}
if(gm2.brush==='giz')gm2.brush='giz_cera';
function gm2snap(){return gm2clone(gm2.st);}
function gm2pushHistory(){
  gm2.history.push(gm2snap());
  if(gm2.history.length>180)gm2.history.shift();
  gm2.future.length=0;
}
function gm2restore(x){
  if(!x)return;
  gm2.st=gm2clone(x);gm2.selected.clear();gm2.primary='';
  gm2saveLocal();gm2render();
}
function gm2undo(){
  if(!gm2.history.length)return;
  gm2.future.push(gm2snap());gm2restore(gm2.history.pop());
}
function gm2redo(){
  if(!gm2.future.length)return;
  gm2.history.push(gm2snap());gm2restore(gm2.future.pop());
}

function gm2el(id){return gm2.st.elements.find(e=>String(e.id)===String(id));}
function gm2zNext(){return gm2.st.elements.reduce((m,e)=>Math.max(m,Number(e.z)||0),0)+1;}
function gm2selectedEls(){return [...gm2.selected].map(gm2el).filter(Boolean);}
function gm2clearSelection(){
  for(const e of gm2selectedEls())if(e.type==='image')e.cropMode=false;
  gm2.selected.clear();gm2.primary='';
}
function gm2select(id,add=false){
  if(!add)gm2clearSelection();
  if(add&&gm2.selected.has(id)){gm2.selected.delete(id);if(gm2.primary===id)gm2.primary=[...gm2.selected].at(-1)||'';}
  else {gm2.selected.add(id);gm2.primary=id;}
  gm2loadStyleFromPrimary();gm2render();
}
function gm2setTool(t,val=''){
  gm2clearSelection();
  gm2.tool=t;
  if(t==='shape'&&val)gm2.shape=val;
  if(t==='line'&&val)gm2.line=val;
  if(t==='brush'&&val)gm2.brush=val;
  gm2updateToolbarState();gm2render();
}

function gm2historyAction(fn){
  gm2pushHistory();
  fn();
  gm2saveLocal();gm2render();
}

function gm2applyDefaultsToSelection(){
  const a=gm2selectedEls(); if(!a.length)return false;
  gm2pushHistory();
  for(const e of a){
    if(['shape','line','path'].includes(e.type)){
      e.fill=gm2.defaults.fill;e.fillOpacity=gm2.defaults.fillOpacity;
      e.stroke=gm2.defaults.stroke;e.strokeWidth=gm2.defaults.strokeWidth;e.strokeOpacity=gm2.defaults.strokeOpacity;
      e.opacity=gm2.defaults.opacity;
    }
    e.shadow=gm2.defaults.shadow;e.shadowDir=gm2.defaults.shadowDir;e.shadowDist=gm2.defaults.shadowDist;
  }
  gm2saveLocal();gm2render();return true;
}

function gm2loadStyleFromPrimary(){
  const e=gm2el(gm2.primary);if(!e)return;
  if(e.fill){gm2.defaults.fill=e.fill;gm2.defaults.fillOpacity=Number(e.fillOpacity??1);}
  if(e.stroke){gm2.defaults.stroke=e.stroke;gm2.defaults.strokeWidth=Number(e.strokeWidth??0);gm2.defaults.strokeOpacity=Number(e.strokeOpacity??1);}
  gm2.defaults.opacity=Number(e.opacity??1);
  gm2syncControls();
}

function gm2newShape(kind,x,y,w=1,h=1){
 return {
   id:gm2id('s'),type:'shape',kind,x,y,w,h,rot:0,radius:0,z:gm2zNext(),locked:false,
   fill:gm2.defaults.fill,fillOpacity:gm2.defaults.fillOpacity,
   stroke:gm2.defaults.stroke,strokeWidth:gm2.defaults.strokeWidth,strokeOpacity:gm2.defaults.strokeOpacity,
   opacity:gm2.defaults.opacity,shadow:gm2.defaults.shadow,shadowDir:gm2.defaults.shadowDir,shadowDist:gm2.defaults.shadowDist
 };
}
function gm2newLine(kind,x,y,x2,y2){
 return {
   id:gm2id('l'),type:'line',kind,x,y,x2,y2,cx:(x+x2)/2,cy:(y+y2)/2-.5,z:gm2zNext(),locked:false,
   fill:'none',stroke:gm2.defaults.fill,strokeWidth:gm2.defaults.size,
   strokeWidthM:Math.max(.01,Number(gm2.defaults.size||1)/Math.max(1,gm2.st.ppm)),
   strokeOpacity:gm2.defaults.opacity,opacity:1,
   shadow:gm2.defaults.shadow,shadowDir:gm2.defaults.shadowDir,shadowDist:gm2.defaults.shadowDist
 };
}
function gm2newPath(points){
 return {
   id:gm2id('p'),type:'path',brush:gm2.brush,points,z:gm2zNext(),locked:false,
   stroke:gm2.defaults.fill,strokeWidth:gm2.defaults.size,
   strokeWidthM:Math.max(.01,Number(gm2.defaults.size||1)/Math.max(1,gm2.st.ppm)),
   strokeOpacity:gm2.defaults.opacity,opacity:1,
   shadow:gm2.defaults.shadow,shadowDir:gm2.defaults.shadowDir,shadowDist:gm2.defaults.shadowDist
 };
}
function gm2newEraser(points){
 return {
   id:gm2id('er'),type:'eraser',points,z:gm2zNext(),locked:true,
   widthM:Math.max(.04,Number(gm2.defaults.size||7)/Math.max(1,gm2.st.ppm))
 };
}
function gm2newImage(src,x,y,w,h,name='Imagem'){
 return {id:gm2id('img'),type:'image',src,name,x,y,w,h,rot:0,z:gm2zNext(),locked:false,opacity:1,
   crop:{l:0,t:0,r:0,b:0},cropMode:true,shadow:gm2.defaults.shadow,shadowDir:gm2.defaults.shadowDir,shadowDist:gm2.defaults.shadowDist};
}

function gm2bbox(e){
 if(!e)return{x:0,y:0,w:0,h:0};
 if(e.type==='line'){
   const x=Math.min(e.x,e.x2),y=Math.min(e.y,e.y2);
   return{x,y,w:Math.max(.08,Math.abs(e.x2-e.x)),h:Math.max(.08,Math.abs(e.y2-e.y))};
 }
 if(e.type==='path'){
   const xs=(e.points||[]).map(p=>p.x),ys=(e.points||[]).map(p=>p.y);
   if(!xs.length)return{x:0,y:0,w:0,h:0};
   const x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(.08,Math.max(...xs)-x),h:Math.max(.08,Math.max(...ys)-y)};
 }
 return{x:Number(e.x)||0,y:Number(e.y)||0,w:Math.max(.05,Number(e.w)||.05),h:Math.max(.05,Number(e.h)||.05)};
}
function gm2intersects(a,b){return a.x<=b.x+b.w&&a.x+a.w>=b.x&&a.y<=b.y+b.h&&a.y+a.h>=b.y;}

function gm2shadowFilter(e){
 const preset=e.shadow||'nenhuma';if(preset==='nenhuma')return'';
 const blur=preset==='suave'?2:preset==='media'?5:9,alpha=preset==='suave'?.25:preset==='media'?.4:.58;
 const d=Number(e.shadowDist||4),dir=e.shadowDir||'SE';
 const sx=dir.includes('E')?d:dir.includes('O')?-d:0,sy=dir.includes('S')?d:dir.includes('N')?-d:0;
 return `filter:drop-shadow(${sx}px ${sy}px ${blur}px rgba(0,0,0,${alpha}))`;
}
function gm2dash(e){
 const b=e.brush||e.kind||'';
 if(b==='pontilhada'||b==='pontilhado')return'2 8';
 if(b==='ranhura')return'12 5';
 if(['areia','cascalho','folhas','neve'].includes(b))return'1 7';
 if(b==='grama')return'5 4';
 if(b==='fumaca')return'14 9';
 if(b==='giz'||b==='giz_cera'||b==='lapis')return'5 3';
 return'';
}

function gm2shapeInner(e){
 const p=gm2.st.ppm,x=e.x*p,y=e.y*p,w=e.w*p,h=e.h*p,fill=e.fill||'none',stroke=e.stroke||'none',
       sw=Math.max(0,Number(e.strokeWidth||0)),fo=Number(e.fillOpacity??1),so=sw===0?0:Number(e.strokeOpacity??1);
 const common=`fill="${fill}" fill-opacity="${fo}" stroke="${stroke}" stroke-opacity="${so}" stroke-width="${sw}" vector-effect="non-scaling-stroke"`;
 const cx=x+w/2,cy=y+h/2,rot=Number(e.rot||0),tr=rot?` transform="rotate(${rot} ${cx} ${cy})"`:'';
 switch(e.kind){
  case 'poligono':{ // v197: polígono livre (pontos em metros, absolutos); rochas orgânicas etc.
   const pts=Array.isArray(e.pontos)?e.pontos:null;
   if(pts&&pts.length>=3)return `<polygon points="${pts.map(q=>`${+q.x*p},${+q.y*p}`).join(' ')}" ${common}${tr}/>`;
   return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${common}${tr}/>`;}
  case 'retangulo': case 'quadrado': return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.max(0,Number(e.radius||0))*p}" ${common}${tr}/>`;
  case 'circulo': case 'elipse': return `<ellipse cx="${cx}" cy="${cy}" rx="${w/2}" ry="${h/2}" ${common}${tr}/>`;
  case 'triangulo': return `<polygon points="${cx},${y} ${x+w},${y+h} ${x},${y+h}" ${common}${tr}/>`;
  case 'losango': return `<polygon points="${cx},${y} ${x+w},${cy} ${cx},${y+h} ${x},${cy}" ${common}${tr}/>`;
  case 'pentagono': return gm2polySvg(5,cx,cy,w/2,h/2,-90,common,tr);
  case 'hexagono': return gm2polySvg(6,cx,cy,w/2,h/2,0,common,tr);
  case 'estrela': return gm2starSvg(5,cx,cy,w/2,h/2,.45,-90,common,tr);
  case 'pentagrama': return gm2starSvg(5,cx,cy,w/2,h/2,.36,-90,common,tr);
  case 'hexagrama': return gm2starSvg(6,cx,cy,w/2,h/2,.42,-90,common,tr);
  case 'heptagrama': return gm2starSvg(7,cx,cy,w/2,h/2,.43,-90,common,tr);
  case 'u_balcao':{
    const t=Math.max(.08,Math.min(Number(e.thickness||Math.min(e.w,e.h)*.18),Math.min(e.w,e.h)*.45))*p;
    const rr=Math.min(Math.max(0,Number(e.radius||0))*p,t/2);
    const d=[
      `M ${x+rr} ${y}`,`H ${x+t-rr}`,`Q ${x+t} ${y} ${x+t} ${y+rr}`,
      `V ${y+h-t-rr}`,`Q ${x+t} ${y+h-t} ${x+t+rr} ${y+h-t}`,
      `H ${x+w-t-rr}`,`Q ${x+w-t} ${y+h-t} ${x+w-t} ${y+h-t-rr}`,
      `V ${y+rr}`,`Q ${x+w-t} ${y} ${x+w-t+rr} ${y}`,
      `H ${x+w-rr}`,`Q ${x+w} ${y} ${x+w} ${y+rr}`,
      `V ${y+h-rr}`,`Q ${x+w} ${y+h} ${x+w-rr} ${y+h}`,
      `H ${x+rr}`,`Q ${x} ${y+h} ${x} ${y+h-rr}`,
      `V ${y+rr}`,`Q ${x} ${y} ${x+rr} ${y}`,'Z'
    ].join(' ');
    return `<path d="${d}" ${common}${tr}/>`;
  }
  case 'u':{
    const d=`M ${x+w*.18} ${y} L ${x+w*.18} ${y+h*.72} Q ${x+w*.18} ${y+h} ${cx} ${y+h} Q ${x+w*.82} ${y+h} ${x+w*.82} ${y+h*.72} L ${x+w*.82} ${y}`;
    return `<path d="${d}" ${common} fill="none"${tr}/>`;
  }
  case 'coracao':{
    const d=`M ${cx} ${y+h} C ${x-w*.05} ${y+h*.45}, ${x} ${y+h*.10}, ${x+w*.27} ${y+h*.18} C ${x+w*.43} ${y+h*.22}, ${cx} ${y+h*.35}, ${cx} ${y+h*.35} C ${cx} ${y+h*.35}, ${x+w*.57} ${y+h*.22}, ${x+w*.73} ${y+h*.18} C ${x+w} ${y+h*.10}, ${x+w*1.05} ${y+h*.45}, ${cx} ${y+h} Z`;
    return `<path d="${d}" ${common}${tr}/>`;
  }
  case 'crescente':{
    const d=`M ${cx+w*.28} ${y} A ${w*.48} ${h*.5} 0 1 0 ${cx+w*.28} ${y+h} A ${w*.36} ${h*.42} 0 0 1 ${cx+w*.28} ${y} Z`;
    return `<path d="${d}" ${common}${tr}/>`;
  }
  case 'semicirculo': return `<path d="M ${x} ${y+h} A ${w/2} ${h} 0 0 1 ${x+w} ${y+h} Z" ${common}${tr}/>`;
  default:return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${common}${tr}/>`;
 }
}
function gm2polySvg(n,cx,cy,rx,ry,start,common,tr){
 const pts=[];for(let i=0;i<n;i++){const a=(start+i*360/n)*Math.PI/180;pts.push(`${cx+Math.cos(a)*rx},${cy+Math.sin(a)*ry}`);}
 return `<polygon points="${pts.join(' ')}" ${common}${tr}/>`;
}
function gm2starSvg(n,cx,cy,rx,ry,k,start,common,tr){
 const pts=[];for(let i=0;i<n*2;i++){const rr=i%2?rx*k:rx,rry=i%2?ry*k:ry,a=(start+i*180/n)*Math.PI/180;pts.push(`${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rry}`);}
 return `<polygon points="${pts.join(' ')}" ${common}${tr}/>`;
}
function gm2lineInner(e){
 const p=gm2.st.ppm,x=e.x*p,y=e.y*p,x2=e.x2*p,y2=e.y2*p;
 if(e.strokeWidthM==null)e.strokeWidthM=Math.max(.01,Number(e.strokeWidth||1)/Math.max(1,p));
 const sw=Math.max(1,e.strokeWidthM*p),dash=e.kind==='linha_pontilhada'?'6 7':'';
 if(e.kind==='linha_ondulada'){
   const dx=x2-x,dy=y2-y,len=Math.hypot(dx,dy),steps=Math.max(8,Math.floor(len/18)),pts=[];
   for(let i=0;i<=steps;i++){const t=i/steps,px=x+dx*t,py=y+dy*t,amp=8*Math.sin(t*Math.PI*steps/2),nx=-dy/(len||1),ny=dx/(len||1);pts.push(`${px+nx*amp},${py+ny*amp}`);}
   return `<polyline points="${pts.join(' ')}" fill="none" stroke="${e.stroke}" stroke-opacity="${e.strokeOpacity??1}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
 }
 if(e.kind==='linha_curva')return `<path d="M ${x} ${y} Q ${e.cx*p} ${e.cy*p} ${x2} ${y2}" fill="none" stroke="${e.stroke}" stroke-opacity="${e.strokeOpacity??1}" stroke-width="${sw}" stroke-linecap="round"/>`;
 return `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${e.stroke}" stroke-opacity="${e.strokeOpacity??1}" stroke-width="${sw}" stroke-linecap="round" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
}
function gm2hash_(str){
 let h=2166136261;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;
}
function gm2rand_(seed){
 let x=seed>>>0;return ()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
}
function gm2smoothPath_(pts,p){
 if(!pts?.length)return'';
 if(pts.length===1)return`M ${pts[0].x*p} ${pts[0].y*p}`;
 let d=`M ${pts[0].x*p} ${pts[0].y*p}`;
 for(let i=1;i<pts.length-1;i++){
   const xc=(pts[i].x+pts[i+1].x)/2*p,yc=(pts[i].y+pts[i+1].y)/2*p;
   d+=` Q ${pts[i].x*p} ${pts[i].y*p} ${xc} ${yc}`;
 }
 const z=pts.at(-1);d+=` L ${z.x*p} ${z.y*p}`;return d;
}
function gm2sample_(pts,stepM=.12){
 const out=[];let last=null;
 for(const q of pts||[]){if(!last||Math.hypot(q.x-last.x,q.y-last.y)>=stepM){out.push(q);last=q;}}
 if(pts?.length&&out.at(-1)!==pts.at(-1))out.push(pts.at(-1));return out;
}
function gm2baseStroke_(e,p,sw,extra=''){
 return `<path d="${gm2smoothPath_(e.points,p)}" fill="none" stroke="${e.stroke}" stroke-opacity="${e.strokeOpacity??1}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}
function gm2pathInner(e){
 const p=gm2.st.ppm,b=e.brush||'redondo',op=Number(e.strokeOpacity??1);
 if(e.strokeWidthM==null)e.strokeWidthM=Math.max(.01,Number(e.strokeWidth||1)/Math.max(1,p));
 const sw=Math.max(1,e.strokeWidthM*p),pts=e.points||[],seed=gm2hash_(e.id),rnd=gm2rand_(seed);

 if(!pts.length)return'';
 if(b==='borracha')return'';

 if(b==='redondo')return gm2baseStroke_(e,p,sw);
 if(b==='caneta')return gm2baseStroke_(e,p,Math.max(1,sw*.55));
 if(b==='curso')return gm2baseStroke_(e,p,Math.max(1,Math.min(2,sw*.25)));
 if(b==='pontilhada')return gm2baseStroke_(e,p,Math.max(2,sw*.55),`stroke-dasharray="${Math.max(2,sw*.55)} ${Math.max(4,sw*1.25)}"`);

 if(b==='quadrado'){
   const cells=new Set(),a=gm2sample_(pts,.08),out=[];
   for(const q of a){const gx=Math.floor(q.x),gy=Math.floor(q.y),k=gx+','+gy;if(cells.has(k))continue;cells.add(k);out.push(`<rect x="${gx*p}" y="${gy*p}" width="${p}" height="${p}" fill="${e.stroke}" fill-opacity="${op}"/>`);}
   return out.join('');
 }
 if(b==='espelhado'){
   const mirrored=pts.map(q=>({x:gm2.st.w-q.x,y:q.y}));
   return gm2baseStroke_(e,p,sw)+`<path d="${gm2smoothPath_(mirrored,p)}" fill="none" stroke="${e.stroke}" stroke-opacity="${op}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
 }
 if(b==='caligrafico'){
   const d=gm2smoothPath_(pts,p);
   return `<path d="${d}" fill="none" stroke="${e.stroke}" stroke-opacity="${op}" stroke-width="${Math.max(2,sw*.75)}" stroke-linecap="butt" stroke-linejoin="bevel"/>
           <path d="${d}" transform="translate(${Math.max(1,sw*.25)} ${-Math.max(1,sw*.25)})" fill="none" stroke="${e.stroke}" stroke-opacity="${op*.45}" stroke-width="${Math.max(1,sw*.2)}" stroke-linecap="butt"/>`;
 }
 if(b==='lapis'){
   const a=gm2sample_(pts,.12),dots=[];
   for(const q of a)for(let i=0;i<3;i++){const dx=(rnd()-.5)*sw,dy=(rnd()-.5)*sw;dots.push(`<circle cx="${q.x*p+dx}" cy="${q.y*p+dy}" r="${.35+rnd()*.65}" fill="${e.stroke}" opacity="${op*.28}"/>`);}
   return gm2baseStroke_(e,p,Math.max(1,sw*.3))+dots.join('');
 }
 if(b==='serpentina'){
   const a=gm2sample_(pts,.05),wave=[];
   for(let i=0;i<a.length;i++){
     const q=a[i],prev=a[Math.max(0,i-1)],ang=Math.atan2(q.y-prev.y,q.x-prev.x),off=Math.sin(i*.85)*e.strokeWidthM*1.5;
     wave.push({x:q.x+Math.cos(ang+Math.PI/2)*off,y:q.y+Math.sin(ang+Math.PI/2)*off});
   }
   return `<path d="${gm2smoothPath_(wave,p)}" fill="none" stroke="${e.stroke}" stroke-opacity="${op}" stroke-width="${Math.max(1,sw*.35)}" stroke-linecap="round"/>`;
 }
 if(b==='seta'){
   const a=gm2sample_(pts,Math.max(.35,e.strokeWidthM*4)),heads=[];
   for(let i=1;i<a.length;i++){const q=a[i],pr=a[i-1],ang=Math.atan2(q.y-pr.y,q.x-pr.x),L=Math.max(.13,e.strokeWidthM*2.1),x=q.x*p,y=q.y*p;
     const x1=(q.x-Math.cos(ang-.55)*L)*p,y1=(q.y-Math.sin(ang-.55)*L)*p,x2=(q.x-Math.cos(ang+.55)*L)*p,y2=(q.y-Math.sin(ang+.55)*L)*p;
     heads.push(`<path d="M ${x1} ${y1} L ${x} ${y} L ${x2} ${y2}" fill="none" stroke="${e.stroke}" stroke-width="${Math.max(1,sw*.45)}" stroke-linecap="round"/>`);
   }
   return gm2baseStroke_(e,p,Math.max(1,sw*.25))+heads.join('');
 }
 if(b==='giz_cera'||b==='giz'){
   // Giz único: corpo macio + grão seco nas bordas e no miolo.
   const a=gm2sample_(pts,.055),out=[];
   const d=gm2smoothPath_(pts,p);
   out.push(`<path d="${d}" fill="none" stroke="${e.stroke}" stroke-opacity="${op*.22}" stroke-width="${Math.max(3,sw*1.15)}" stroke-linecap="round" stroke-linejoin="round"/>`);
   out.push(`<path d="${d}" fill="none" stroke="${e.stroke}" stroke-opacity="${op*.36}" stroke-width="${Math.max(2,sw*.72)}" stroke-linecap="round" stroke-linejoin="round"/>`);
   for(const q of a){
     const density=Math.max(8,Math.floor(sw*.75));
     for(let i=0;i<density;i++){
       const ang=rnd()*Math.PI*2;
       const rr=Math.pow(rnd(),.72)*sw*.62;
       const x=q.x*p+Math.cos(ang)*rr,y=q.y*p+Math.sin(ang)*rr;
       const rw=.35+rnd()*1.35,rh=.25+rnd()*.7;
       out.push(`<ellipse cx="${x}" cy="${y}" rx="${rw}" ry="${rh}" transform="rotate(${rnd()*180} ${x} ${y})" fill="${e.stroke}" opacity="${op*(.06+rnd()*.22)}"/>`);
     }
   }
   return out.join('');
 }
 if(b==='spray'){
   // Spray pesado: 120 partículas por amostra, núcleo denso e névoa suave.
   const a=gm2sample_(pts,.055),dots=[];
   const radius=Math.max(10,sw*2.8);
   for(const q of a){
     for(let i=0;i<120;i++){
       const angle=rnd()*Math.PI*2;
       const rr=Math.pow(rnd(),1.5)*radius;
       const x=q.x*p+Math.cos(angle)*rr,y=q.y*p+Math.sin(angle)*rr;
       const particle=.5+rnd()*1.5;
       dots.push(`<circle cx="${x}" cy="${y}" r="${particle}" fill="${e.stroke}" opacity="${op*.12}"/>`);
     }
   }
   return dots.join('');
 }
 if(b==='carimbo'){
   // Carimbo cartográfico selecionável: não é mais só uma sequência de triângulos.
   const a=gm2sample_(pts,Math.max(.55,e.strokeWidthM*6)),out=[],kind=gm2.stamp||'montanha';
   for(const q of a){
     const S=Math.max(6,sw*1.65),x=q.x*p,y=q.y*p,lw=Math.max(1,sw*.16);
     if(kind==='arvore'){
       out.push(`<path d="M ${x} ${y+S*.72} L ${x} ${y+S*.08}" stroke="${e.stroke}" stroke-width="${lw}" stroke-opacity="${op}"/>
                 <circle cx="${x}" cy="${y-S*.18}" r="${S*.42}" fill="${e.stroke}" fill-opacity="${op*.22}" stroke="${e.stroke}" stroke-opacity="${op}" stroke-width="${lw}"/>`);
     }else if(kind==='rocha'){
       out.push(`<path d="M ${x-S*.7} ${y+S*.45} L ${x-S*.38} ${y-S*.35} L ${x+S*.15} ${y-S*.58} L ${x+S*.72} ${y+S*.22} L ${x+S*.28} ${y+S*.62} Z" fill="${e.stroke}" fill-opacity="${op*.14}" stroke="${e.stroke}" stroke-opacity="${op}" stroke-width="${lw}"/>`);
     }else if(kind==='casa'){
       out.push(`<path d="M ${x-S*.65} ${y-S*.05} L ${x} ${y-S*.68} L ${x+S*.65} ${y-S*.05} M ${x-S*.5} ${y-S*.04} V ${y+S*.55} H ${x+S*.5} V ${y-S*.04} M ${x-S*.1} ${y+S*.55} V ${y+S*.1} H ${x+S*.12} V ${y+S*.55}" fill="none" stroke="${e.stroke}" stroke-opacity="${op}" stroke-width="${lw}" stroke-linejoin="round"/>`);
     }else if(kind==='ruina'){
       out.push(`<path d="M ${x-S*.65} ${y+S*.55} V ${y-S*.45} H ${x-S*.18} V ${y-S*.05} H ${x+S*.18} V ${y-S*.62} H ${x+S*.6} V ${y+S*.55} M ${x-S*.78} ${y+S*.55} H ${x+S*.76}" fill="none" stroke="${e.stroke}" stroke-opacity="${op}" stroke-width="${lw}" stroke-linejoin="round"/>`);
     }else{
       // Montanha desenhada, com segunda crista interna.
       out.push(`<path d="M ${x-S} ${y+S*.62} L ${x-S*.18} ${y-S*.72} L ${x+S*.12} ${y-S*.2} L ${x+S*.42} ${y-S*.55} L ${x+S} ${y+S*.62} Z" fill="${e.stroke}" fill-opacity="${op*.08}" stroke="${e.stroke}" stroke-opacity="${op}" stroke-width="${lw}" stroke-linejoin="round"/>
                 <path d="M ${x-S*.18} ${y-S*.72} L ${x-S*.02} ${y-S*.25} L ${x+S*.12} ${y-S*.2}" fill="none" stroke="${e.stroke}" stroke-opacity="${op*.55}" stroke-width="${lw*.8}"/>`);
     }
   }
   return out.join('');
 }
 if(b==='pele'){
   const a=gm2sample_(pts,.10),out=[];
   for(let j=1;j<a.length;j++){const q=a[j],pr=a[j-1],ang=Math.atan2(q.y-pr.y,q.x-pr.x)+Math.PI/2;
     for(let i=-2;i<=2;i++){const off=i*sw*.28,x=q.x*p+Math.cos(ang)*off,y=q.y*p+Math.sin(ang)*off,L=sw*(.5+rnd()*.7);out.push(`<line x1="${x}" y1="${y}" x2="${x+(rnd()-.5)*L}" y2="${y-L}" stroke="${e.stroke}" stroke-opacity="${op*.72}" stroke-width="1"/>`);}
   }return out.join('');
 }
 if(b==='esboco'){
   const paths=[];for(let k=0;k<3;k++){const j=pts.map(q=>({x:q.x+(rnd()-.5)*.06,y:q.y+(rnd()-.5)*.06}));paths.push(`<path d="${gm2smoothPath_(j,p)}" fill="none" stroke="${e.stroke}" stroke-opacity="${op*.45}" stroke-width="${Math.max(1,sw*.18)}"/>`);}return paths.join('');
 }
 if(b==='espirografo'){
   const a=gm2sample_(pts,Math.max(.22,e.strokeWidthM*2.5)),out=[];
   for(const q of a){const r=Math.max(3,sw*(.65+rnd()*.45));out.push(`<circle cx="${q.x*p}" cy="${q.y*p}" r="${r}" fill="none" stroke="${e.stroke}" stroke-opacity="${op*.5}" stroke-width="1"/>`);}
   return out.join('');
 }
 if(b==='teia'){
   const a=gm2sample_(pts,.18),out=[gm2baseStroke_(e,p,Math.max(1,sw*.15))];
   for(let i=0;i<a.length;i++)for(let j=0;j<i;j+=3){const d=Math.hypot(a[i].x-a[j].x,a[i].y-a[j].y);if(d<e.strokeWidthM*9&&rnd()>.65)out.push(`<line x1="${a[i].x*p}" y1="${a[i].y*p}" x2="${a[j].x*p}" y2="${a[j].y*p}" stroke="${e.stroke}" stroke-opacity="${op*.25}" stroke-width="1"/>`);}
   return out.join('');
 }
 if(b==='irregular'){
   const a=gm2sample_(pts,.06),out=[];for(const q of a){const r=Math.max(2,sw*(.15+rnd()*.65));out.push(`<circle cx="${q.x*p}" cy="${q.y*p}" r="${r}" fill="${e.stroke}" opacity="${op*.55}"/>`);}return out.join('');
 }
 if(b==='ranhura'){
   const d=gm2smoothPath_(pts,p),out=[];for(const off of [-5,-1.5,1.5,5])out.push(`<path d="${d}" transform="translate(${off} 0)" fill="none" stroke="${e.stroke}" stroke-opacity="${op*.75}" stroke-width="1"/>`);return out.join('');
 }
 if(b==='areia'){
   const a=gm2sample_(pts,.08),out=[];for(const q of a)for(let i=0;i<12;i++){const ang=rnd()*6.283,rr=rnd()*sw;out.push(`<circle cx="${q.x*p+Math.cos(ang)*rr}" cy="${q.y*p+Math.sin(ang)*rr}" r="${.25+rnd()*.65}" fill="${e.stroke}" opacity="${op*.55}"/>`);}return out.join('');
 }
 if(b==='cascalho'){
   const a=gm2sample_(pts,.12),out=[];for(const q of a)if(rnd()>.25){const x=q.x*p+(rnd()-.5)*sw,y=q.y*p+(rnd()-.5)*sw,r=1.2+rnd()*Math.max(2,sw*.22);out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${e.stroke}" fill-opacity="${op*.18}" stroke="${e.stroke}" stroke-opacity="${op*.7}" stroke-width=".8"/>`);}return out.join('');
 }
 if(b==='grama'){
   const a=gm2sample_(pts,.11),out=[];for(const q of a)if(rnd()>.25){const x=q.x*p+(rnd()-.5)*sw,y=q.y*p+(rnd()-.5)*sw,H=Math.max(5,sw*(.8+rnd()*.7));out.push(`<path d="M ${x} ${y} Q ${x-3} ${y-H*.5} ${x-5} ${y-H} M ${x} ${y} Q ${x} ${y-H*.6} ${x} ${y-H*1.25} M ${x} ${y} Q ${x+3} ${y-H*.5} ${x+5} ${y-H}" fill="none" stroke="${e.stroke}" stroke-opacity="${op*.8}" stroke-width="1.2" stroke-linecap="round"/>`);}return out.join('');
 }
 if(b==='folhas'){
   const a=gm2sample_(pts,.12),out=[];for(const q of a)if(rnd()>.18){const x=q.x*p+(rnd()-.5)*sw*1.2,y=q.y*p+(rnd()-.5)*sw*1.2,rx=Math.max(2,sw*.28),ry=Math.max(3,sw*.5),rot=rnd()*180;out.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="${e.stroke}" opacity="${op*.62}"/>`);}return out.join('');
 }
 if(b==='neve'){
   const a=gm2sample_(pts,.10),out=[];for(const q of a)for(let i=0;i<5;i++){const ang=rnd()*6.283,rr=rnd()*sw,x=q.x*p+Math.cos(ang)*rr,y=q.y*p+Math.sin(ang)*rr,r=.8+rnd()*2.4;out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${.3+rnd()*.5}"/>`);}return out.join('');
 }
 if(b==='fumaca'){
   const a=gm2sample_(pts,.16),fid='gm2sm_'+String(e.id).replace(/\W/g,'_'),out=[`<defs><filter id="${fid}"><feGaussianBlur stdDeviation="${Math.max(2,sw*.45)}"/></filter></defs>`];
   for(const q of a){const x=q.x*p+(rnd()-.5)*sw,y=q.y*p+(rnd()-.5)*sw,r=Math.max(6,sw*(.8+rnd()));out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${e.stroke}" opacity="${op*.08}" filter="url(#${fid})"/>`);}return out.join('');
 }
 return gm2baseStroke_(e,p,sw);
}
function gm2imageInner(e){
 const p=gm2.st.ppm,x=e.x*p,y=e.y*p,w=e.w*p,h=e.h*p,c=e.crop||{l:0,t:0,r:0,b:0},
       fullW=w/Math.max(.03,1-c.l-c.r),fullH=h/Math.max(.03,1-c.t-c.b),
       ix=x-c.l*fullW,iy=y-c.t*fullH,clip=`gm2clip_${String(e.id).replace(/\W/g,'_')}`,
       cx=x+w/2,cy=y+h/2,rot=Number(e.rot||0),tr=rot?` transform="rotate(${rot} ${cx} ${cy})"`:'';
 return `<g${tr}><defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs>
 <image href="${gm2esc(e.src)}" x="${ix}" y="${iy}" width="${fullW}" height="${fullH}" preserveAspectRatio="none" clip-path="url(#${clip})" opacity="${e.opacity??1}"/></g>`;
}
function gm2objectInner(e){
 const p=gm2.st.ppm,x=e.x*p,y=e.y*p,w=e.w*p,h=e.h*p,cx=x+w/2,cy=y+h/2,rot=Number(e.rot||0),tr=rot?` transform="rotate(${rot} ${cx} ${cy})"`:'';
 if(e.src)return `<image href="${gm2esc(e.src)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" opacity="${e.opacity??1}"${tr}/>`;
 return `<g${tr}><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#445"/><text x="${x+w/2}" y="${y+h/2}" text-anchor="middle" fill="white" font-size="12">obj</text></g>`;
}

// v110: formas ganham material/relevo pelo módulo de arte; se falhar, desenho original.
const gm2shapeInnerBaseV110_=gm2shapeInner;
gm2shapeInner=function(e){const base=gm2shapeInnerBaseV110_(e);try{return (typeof window.mesaFormaV110_==='function'&&window.mesaFormaV110_(e,base,gm2.st.ppm))||base;}catch(_){return base;}};
function gm2elementSvg(e){
 const style=gm2shadowFilter(e),lock=e.locked?' data-locked="1"':'';
 let inner='';
 if(e.type==='shape')inner=gm2shapeInner(e);
 else if(e.type==='line')inner=gm2lineInner(e);
 else if(e.type==='path')inner=gm2pathInner(e);
 else if(e.type==='image')inner=gm2imageInner(e);
 else if(e.type==='object')inner=gm2objectInner(e);
 return `<g class="gm2-el" data-eid="${gm2esc(e.id)}" data-type="${e.type}"${lock} style="${style}">${inner}</g>`;
}

function gm2handlesSvg(e){
 if(!e)return'';
 const p=gm2.st.ppm,b=gm2bbox(e),x=b.x*p,y=b.y*p,w=b.w*p,h=b.h*p,cx=x+w/2;
 if(e.locked)return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="5 4" pointer-events="none"/>
 <g pointer-events="none"><rect x="${x+w-24}" y="${y+5}" width="19" height="19" rx="4" fill="#111827" stroke="#ffd166"/><text x="${x+w-14.5}" y="${y+19}" font-size="12" text-anchor="middle">🔒</text></g>`;

 const hs=7, pts=[['nw',x,y],['n',cx,y],['ne',x+w,y],['e',x+w,y+h/2],['se',x+w,y+h],['s',cx,y+h],['sw',x,y+h],['w',x,y+h/2]];
 let out=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#67e8f9" stroke-width="1.4" stroke-dasharray="5 4" pointer-events="none"/>`;
 if(e.type!=='path'&&e.type!=='line'){
   out+=pts.map(([k,px,py])=>`<rect class="gm2-handle" data-handle="${k}" data-eid="${gm2esc(e.id)}" x="${px-hs/2}" y="${py-hs/2}" width="${hs}" height="${hs}" rx="1" fill="#fff" stroke="#23c7dc" stroke-width="1.5"/>`).join('');
   out+=`<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y-22}" stroke="#67e8f9" stroke-width="1.2"/>
         <circle class="gm2-handle" data-handle="rot" data-eid="${gm2esc(e.id)}" cx="${cx}" cy="${y-27}" r="6" fill="#fff" stroke="#23c7dc" stroke-width="1.7"/>`;
   if(e.type==='shape'&&['retangulo','quadrado','u_balcao'].includes(e.kind)){
     out+=`<circle class="gm2-handle" data-handle="radius" data-eid="${gm2esc(e.id)}" cx="${x+Math.max(12,Math.min(w/2,(Number(e.radius||0)*p)+12))}" cy="${y+12}" r="5.5" fill="#d9fbff" stroke="#23c7dc" stroke-width="1.6"/>`;
   }
   if(e.type==='shape'&&e.kind==='u_balcao'){
     const t=Math.max(.08,Number(e.thickness||Math.min(e.w,e.h)*.18));
     out+=`<circle class="gm2-handle" data-handle="uthick" data-eid="${gm2esc(e.id)}" cx="${(e.x+t)*p}" cy="${(e.y+e.h*.5)*p}" r="5.5" fill="#fff5b8" stroke="#23c7dc" stroke-width="1.6"/>`;
   }
   if(e.type==='image'&&e.cropMode){
     const cs=9;
     out+=`<rect class="gm2-crop-handle" data-crop="l" data-eid="${gm2esc(e.id)}" x="${x-cs/2}" y="${y+h/2-cs}" width="${cs}" height="${cs*2}" fill="#ffd166" stroke="#111"/>
           <rect class="gm2-crop-handle" data-crop="r" data-eid="${gm2esc(e.id)}" x="${x+w-cs/2}" y="${y+h/2-cs}" width="${cs}" height="${cs*2}" fill="#ffd166" stroke="#111"/>
           <rect class="gm2-crop-handle" data-crop="t" data-eid="${gm2esc(e.id)}" x="${x+w/2-cs}" y="${y-cs/2}" width="${cs*2}" height="${cs}" fill="#ffd166" stroke="#111"/>
           <rect class="gm2-crop-handle" data-crop="b" data-eid="${gm2esc(e.id)}" x="${x+w/2-cs}" y="${y+h-cs/2}" width="${cs*2}" height="${cs}" fill="#ffd166" stroke="#111"/>`;
   }
 }else if(e.type==='line'&&e.kind==='linha_curva'){
   out+=`<circle class="gm2-handle" data-handle="curve" data-eid="${gm2esc(e.id)}" cx="${e.cx*p}" cy="${e.cy*p}" r="6" fill="#fff" stroke="#23c7dc" stroke-width="1.7"/>`;
 }
 return out;
}


// ===== Gerador de texturas incorporado a partir do arquivo fornecido pelo usuário =====
/**
 * RPG Canvas Texture Generator v1.0.0
 * Códigos prontos para gerar texturas matemáticas, procedurais e realistas em Canvas HTML5.
 * Ideal para fundos de mapas e grids de RPG hospedados no GitHub Pages.
 */

class RPGTextureGenerator {
    /**
     * @param {HTMLCanvasElement|string} canvasElementOrId - O canvas principal ou o ID dele.
     */
    constructor(canvasElementOrId) {
        this.canvas = typeof canvasElementOrId === 'string' ? document.getElementById(canvasElementOrId) : canvasElementOrId;
        if (!this.canvas) {
            throw new Error("Canvas não encontrado. Verifique o ID fornecido.");
        }
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Limpa o canvas e renderiza uma textura preenchendo toda a área.
     * @param {string} textureName - Nome da textura desejada.
     * @param {Object} options - Parâmetros customizados opcionais.
     */
    applyTexture(textureName, options = {}) {
        if (typeof this[textureName] === 'function') {
            this[textureName](options);
        } else {
            console.error(`A textura "${textureName}" não foi implementada.`);
        }
    }

    /**
     * Utilitário para desenhar a grade (Grid) de RPG clássica por cima da textura.
     * @param {number} size - Tamanho de cada quadrado da grade em pixels (padrão: 50).
     * @param {string} color - Cor das linhas (padrão: preto semitransparente).
     * @param {string} style - 'solid' ou 'dashed' (linhas contínuas ou tracejadas).
     */
    drawGrid(size = 50, color = 'rgba(0, 0, 0, 0.15)', style = 'solid') {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        if (style === 'dashed') {
            ctx.setLineDash([4, 4]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        // Linhas verticais
        for (let x = 0; x <= w; x += size) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        // Linhas horizontais
        for (let y = 0; y <= h; y += size) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    // ==========================================
    // 1. TERRENOS NATURAIS E BIOMAS
    // ==========================================

    /** Terra Batida / Lamaço Orgânico */
    terra(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Base marrom terrosa escura
        ctx.fillStyle = options.baseColor || '#4a3525';
        ctx.fillRect(0, 0, w, h);

        // Ruído fractal para manchas de umidade/densidade da terra
        for (let i = 0; i < 400; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(54, 38, 26, 0.4)' : 'rgba(92, 69, 52, 0.2)';
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 60 + 20, 0, Math.PI * 2);
            ctx.fill();
        }

        // Grãos finos de terra/areia misturada
        for (let i = 0; i < 15000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.12)';
            ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
        }
    }

    /** Deserto / Areias Planas */
    areia(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Base dourada de areia
        ctx.fillStyle = options.baseColor || '#e6c587';
        ctx.fillRect(0, 0, w, h);

        // Ondulações suaves geradas por dunas (Gradientes lineares suaves inclinados)
        for (let i = 0; i < 20; i++) {
            const grad = ctx.createLinearGradient(0, 0, w * 0.3, h * 0.2);
            grad.addColorStop(0, 'rgba(255, 245, 220, 0.08)');
            grad.addColorStop(0.5, 'rgba(196, 160, 98, 0.1)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.save();
            ctx.translate(Math.random() * w - w*0.5, Math.random() * h - h*0.5);
            ctx.rotate((Math.random() * 20 - 10) * Math.PI / 180);
            ctx.fillRect(0, 0, w * 1.5, h * 1.5);
            ctx.restore();
        }

        // Grãos finos de sílica cintilante
        for (let i = 0; i < 25000; i++) {
            ctx.fillStyle = Math.random() > 0.7 ? 'rgba(255,255,255,0.25)' : 'rgba(168,133,74,0.15)';
            ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
    }

    /** Deserto Alternativo (Alias para areia) */
    deserto(options = {}) {
        this.areia(options);
    }

    /** Rocha Sólida / Platô Montanhoso */
    rocha(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = options.baseColor || '#737373';
        ctx.fillRect(0, 0, w, h);

        // Manchas minerais escuras e claras
        for (let i = 0; i < 300; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(60,60,60,0.3)' : 'rgba(140,140,140,0.2)';
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 40 + 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hachuras estruturais e fraturas internas do mineral
        ctx.strokeStyle = 'rgba(40,40,40,0.25)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 120; i++) {
            ctx.beginPath();
            let x = Math.random() * w;
            let y = Math.random() * h;
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.random() * 40 - 20, y + Math.random() * 40 - 20);
            ctx.stroke();
        }
    }

    /** Cascalho Solto / Leito de Rio Seco */
    cascalho(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#615a52';
        ctx.fillRect(0, 0, w, h);

        // Geração algorítmica de milhares de pequenos seixos ovais e poligonais
        for (let i = 0; i < 3500; i++) {
            let cx = Math.random() * w;
            let cy = Math.random() * h;
            let r = Math.random() * 5 + 2;

            // Sombra projetada do pedrisco
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(cx + 1, cy + 1, r, 0, Math.PI * 2);
            ctx.fill();

            // Cor aleatória do pedrisco (variações de cinza, marrom e ocre)
            const tones = ['#8c8275', '#736b60', '#524b43', '#9e978e', '#6e6151'];
            ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();

            // Brilho superior de volume no seixo
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.arc(cx - r*0.3, cy - r*0.3, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /** Floresta Vista de Cima (Densa e Fechada) */
    floresta(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Solo escuro sob a folhagem
        ctx.fillStyle = '#1e3313';
        ctx.fillRect(0, 0, w, h);

        // Copas de árvores sobrepostas (Fractais esféricos de folhagem)
        for (let i = 0; i < 1800; i++) {
            let tx = Math.random() * w;
            let ty = Math.random() * h;
            let radius = Math.random() * 25 + 15;

            // Sombra profunda da árvore no chão
            ctx.fillStyle = 'rgba(5, 13, 3, 0.4)';
            ctx.beginPath();
            ctx.arc(tx + 4, ty + 6, radius, 0, Math.PI * 2);
            ctx.fill();

            // Degradê volumétrico da copa (Mais claro no topo/centro devido ao sol)
            let treeGrad = ctx.createRadialGradient(tx - radius*0.2, ty - radius*0.2, radius * 0.1, tx, ty, radius);
            const greenTones = [
                ['#3a6624', '#203d11'],
                ['#477a2d', '#284718'],
                ['#2f541c', '#182e0e'],
                ['#568f37', '#2e541a']
            ];
            const pair = greenTones[Math.floor(Math.random() * greenTones.length)];
            treeGrad.addColorStop(0, pair[0]);
            treeGrad.addColorStop(1, pair[1]);

            ctx.fillStyle = treeGrad;
            ctx.beginPath();
            ctx.arc(tx, ty, radius, 0, Math.PI * 2);
            ctx.fill();

            // Pequenas ranhuras/folhas micro nas copas
            if (Math.random() > 0.5) {
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.beginPath();
                ctx.arc(tx - radius*0.3, ty - radius*0.3, radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /** Palha / Telhado Texturizado / Celeiro */
    palha(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Fundo ocre escuro de palha seca antiga
        ctx.fillStyle = '#8c703f';
        ctx.fillRect(0, 0, w, h);

        // Geração de milhares de fibras e hastes individuais entrelaçadas
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 22000; i++) {
            let x = Math.random() * w;
            let y = Math.random() * h;
            let length = Math.random() * 25 + 10;
            // Direção semi-alinhada (comum em telhados de colmo ou ninhos)
            let angle = (Math.random() * 30 - 15) * Math.PI / 180; 

            ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(230, 197, 124, 0.25)' : 'rgba(74, 56, 27, 0.35)';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }
    }

    /** Terreno Acidentado / Lamaçal Quebrado ou Pântano Seco */
    terreno_acidentado(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#524336';
        ctx.fillRect(0, 0, w, h);

        // Sombreado de declives abruptos e crateras
        for (let i = 0; i < 150; i++) {
            let x = Math.random() * w;
            let y = Math.random() * h;
            let rx = Math.random() * 60 + 20;
            let ry = Math.random() * 30 + 10;

            let grad = ctx.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
            grad.addColorStop(0, 'rgba(0,0,0,0.4)');
            grad.addColorStop(0.5, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(255,255,255,0.08)');

            ctx.fillStyle = grad;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI);
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Pequenas fendas no terreno
        ctx.strokeStyle = 'rgba(23, 18, 14, 0.5)';
        ctx.lineWidth = 2;
        for(let i=0; i<40; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random()*w, Math.random()*h);
            ctx.lineTo(Math.random()*w, Math.random()*h);
            ctx.stroke();
        }
    }

    // ==========================================
    // 2. MISTURAS NATURAIS AVANÇADAS
    // ==========================================

    /** Terreno com Musgos Avançado (Rocha + Fungos Verdes) */
    terreno_com_musgos(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Primeiro gera a rocha basal
        this.rocha({ baseColor: '#5c5c5c' });

        // Camada biológica de musgo (Manchas de veludo verde)
        for (let i = 0; i < 500; i++) {
            let x = Math.random() * w;
            let y = Math.random() * h;
            let rad = Math.random() * 45 + 15;

            let mossGrad = ctx.createRadialGradient(x, y, 2, x, y, rad);
            mossGrad.addColorStop(0, 'rgba(56, 102, 35, 0.7)');
            mossGrad.addColorStop(0.6, 'rgba(40, 77, 23, 0.4)');
            mossGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = mossGrad;
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.fill();
        }

        // Esferas micro texturizadas para dar relevo ao musgo
        for (let i = 0; i < 4000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(106, 166, 68, 0.3)' : 'rgba(29, 54, 17, 0.4)';
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
    }

    /** Terra com Rochas Misturadas */
    terra_com_rochas(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Renderiza a base de terra
        this.terra();

        // Insere blocos de pedras semi-enterradas pelo mapa
        for (let i = 0; i < 40; i++) {
            let rx = Math.random() * w;
            let ry = Math.random() * h;
            let size = Math.random() * 20 + 10;

            // Sombra oclusiva na base da pedra
            ctx.fillStyle = 'rgba(20, 14, 10, 0.6)';
            ctx.beginPath();
            ctx.arc(rx + 3, ry + 4, size, 0, Math.PI * 2);
            ctx.fill();

            // Corpo da rocha poligonal
            ctx.fillStyle = Math.random() > 0.5 ? '#7a7571' : '#595552';
            ctx.beginPath();
            ctx.moveTo(rx - size, ry);
            ctx.lineTo(rx - size*0.5, ry - size);
            ctx.lineTo(rx + size*0.7, ry - size*0.7);
            ctx.lineTo(rx + size, ry + size*0.3);
            ctx.lineTo(rx, ry + size);
            ctx.closePath();
            ctx.fill();

            // Vincos e iluminação de aresta na rocha
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(rx - size, ry);
            ctx.lineTo(rx - size*0.5, ry - size);
            ctx.lineTo(rx + size*0.7, ry - size*0.7);
            ctx.stroke();
        }
    }

    // ==========================================
    // 3. AMBIENTES SOTURNOS E ARQUEOLOGIA
    // ==========================================

    /** Parede ou Solo de Caverna Natural */
    caverna(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Escuridão total de caverna
        ctx.fillStyle = '#262422';
        ctx.fillRect(0, 0, w, h);

        // Manchas de estalagmites e erosão subterrânea
        for (let i = 0; i < 250; i++) {
            let x = Math.random() * w;
            let y = Math.random() * h;
            let grad = ctx.createRadialGradient(x, y, 5, x, y, Math.random() * 80 + 30);
            grad.addColorStop(0, 'rgba(64, 57, 51, 0.35)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 120, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rachaduras profundas de placas tectônicas
        ctx.strokeStyle = 'rgba(10, 8, 7, 0.8)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            let sx = Math.random() * w;
            let sy = Math.random() * h;
            ctx.moveTo(sx, sy);
            for (let j = 0; j < 6; j++) {
                sx += Math.random() * 60 - 30;
                sy += Math.random() * 60 - 30;
                ctx.lineTo(sx, sy);
            }
            ctx.stroke();
        }
    }

    /** Masmorra Antiga / Dungeon de Blocos de Pedra Escuros */
    masmorra(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Base de pedra úmida escura
        ctx.fillStyle = '#303336';
        ctx.fillRect(0, 0, w, h);

        // Ruído de limo e infiltração nas pedras
        for (let i = 0; i < 150; i++) {
            ctx.fillStyle = 'rgba(38, 54, 34, 0.15)';
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 50 + 20, 0, Math.PI * 2);
            ctx.fill();
        }

        // Divisão estrutural de blocos de alvenaria lapidados (Estilo lajota medieval)
        const blockW = options.blockWidth || 100;
        const blockH = options.blockHeight || 50;

        ctx.lineWidth = 2.5;
        
        // Primeira passagem: Sombra das juntas (Profundidade)
        ctx.strokeStyle = '#17191a';
        this._drawBrickLines(w, h, blockW, blockH, 0, 0);

        // Segunda passagem: Chanfro e luz superior nas quinas das pedras para tridimensionalidade
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        this._drawBrickLines(w, h, blockW, blockH, -1, -1);
    }

    /** Alvenaria Tradicional de Tijolos de Pedra Limpos */
    alvenaria(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#948a7c';
        ctx.fillRect(0, 0, w, h);

        const blockW = options.brickWidth || 80;
        const blockH = options.brickHeight || 40;

        // Juntas de argamassa cinza escura
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#47423b';
        this._drawBrickLines(w, h, blockW, blockH, 0, 0);

        // Textura interna porosa de cada tijolo
        for (let i = 0; i < 8000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1);
        }
    }

    /** Função interna auxiliar para desenhar malhas de tijolos amarrados (intercalados) */
    _drawBrickLines(w, h, bw, bh, offsetX, offsetY) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.beginPath();
        
        let row = 0;
        for (let y = 0; y <= h + bh; y += bh) {
            // Linha horizontal
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            
            // Linhas verticais intercaladas (Amarração clássica de parede)
            const shift = (row % 2) * (bw / 2);
            for (let x = -bw; x <= w + bw; x += bw) {
                ctx.moveTo(x + shift, y);
                ctx.lineTo(x + shift, y + bh);
            }
            row++;
        }
        ctx.stroke();
        ctx.restore();
    }

    // ==========================================
    // 4. ESTRUTURAS URBANAS, RIQUEZA E TECNOLOGIA
    // ==========================================

    /** Piso de Mármore Nobre Realista */
    piso_de_marmore(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Base luxuosa de mármore Carrara (Branco acinzentado sutil)
        let baseGrad = ctx.createLinearGradient(0, 0, w, h);
        baseGrad.addColorStop(0, '#f5f5f5');
        baseGrad.addColorStop(0.5, '#eadecc');
        baseGrad.addColorStop(1, '#ebebeb');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, w, h);

        // Desenho procedural de veios minerais orgânicos e ramificados
        const numVeins = options.veinsCount || 12;
        for (let i = 0; i < numVeins; i++) {
            ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(112, 105, 94, 0.25)' : 'rgba(166, 155, 141, 0.15)';
            ctx.lineWidth = Math.random() * 2.5 + 0.5;
            
            ctx.beginPath();
            let vx = Math.random() * w;
            let vy = 0;
            ctx.moveTo(vx, vy);

            // Caminhada aleatória guiada para criar o zigue-zague natural do mármore
            while (vy < h) {
                vx += Math.random() * 40 - 20; // Oscilação X
                vy += Math.random() * 30 + 10; // Avanço Y
                ctx.lineTo(vx, vy);
            }
            ctx.stroke();
        }

        // Linhas de rejunte douradas ou escuras dividindo as placas de mármore majestosas
        const tileSize = options.tileSize || 150;
        ctx.strokeStyle = 'rgba(184, 134, 11, 0.3)'; // Toque de Ouro/Bronze no rejunte
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += tileSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 0; y <= h; y += tileSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();
    }

    /** Concreto Industrial, Moderno ou Masmorra Tecnológica */
    concreto(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Base cinza de cimento fundido
        ctx.fillStyle = '#a6a6a6';
        ctx.fillRect(0, 0, w, h);

        // Manchas de secagem química e umidade do concreto
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(138,138,138,0.25)' : 'rgba(194,194,194,0.3)';
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 70 + 30, 0, Math.PI * 2);
            ctx.fill();
        }

        // Porosidades e microbolhas estouradas na cura do material
        for (let i = 0; i < 18000; i++) {
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }

        // Linhas divisórias de fôrmas de placas de concreto
        ctx.strokeStyle = 'rgba(64,64,64,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Divisões amplas industriais (ex: quadrantes de 300px)
        for (let x = 300; x < w; x += 300) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 300; y < h; y += 300) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();
    }

    /** Placas de Metal Reforçadas / Chão de Nave Sci-Fi ou Fortaleza */
    metal(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Brilho metálico cinza escuro/azulado
        let iron = ctx.createLinearGradient(0, 0, w, 0);
        iron.addColorStop(0, '#40454a');
        iron.addColorStop(0.5, '#565d63');
        iron.addColorStop(1, '#34383c');
        ctx.fillStyle = iron;
        ctx.fillRect(0, 0, w, h);

        // Linhas de painéis rebitados estilo industrial
        const pSize = 100; // tamanho do painel
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += pSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 0; y <= h; y += pSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        // Linhas de luz reflexiva nas bordas dos painéis (Chanfro metálico)
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 1; x <= w; x += pSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 1; y <= h; y += pSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        // Rebites / Parafusos metálicos nos cantos de cada quadrante
        ctx.fillStyle = 'rgba(10,10,10,0.6)';
        for (let x = pSize; x < w; x += pSize) {
            for (let y = pSize; y < h; y += pSize) {
                // Desenha 4 pequenos rebites ao redor da interseção
                ctx.fillRect(x - 8, y - 8, 3, 3);
                ctx.fillRect(x + 5, y - 8, 3, 3);
                ctx.fillRect(x - 8, y + 5, 3, 3);
                ctx.fillRect(x + 5, y + 5, 3, 3);
            }
        }
    }

    // ==========================================
    // 5. CLIMAS EXTREMOS E AMBIENTES FANTÁSTICOS
    // ==========================================

    /** Terreno Congelado / Lago de Gelo Glacial */
    congelado(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Base azul gélida profunda
        let iceGrad = ctx.createLinearGradient(0, 0, 0, h);
        iceGrad.addColorStop(0, '#a3d1e0');
        iceGrad.addColorStop(0.5, '#bee3ed');
        iceGrad.addColorStop(1, '#81b9cc');
        ctx.fillStyle = iceGrad;
        ctx.fillRect(0, 0, w, h);

        // Manchas brancas de neve e geada interna aprisionada no gelo
        for (let i = 0; i < 180; i++) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 50 + 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fissuras térmicas profundas na calota de gelo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            let ix = Math.random() * w;
            let iy = Math.random() * h;
            ctx.moveTo(ix, iy);
            for (let j = 0; j < 5; j++) {
                ix += Math.random() * 80 - 40;
                iy += Math.random() * 80 - 40;
                ctx.lineTo(ix, iy);
            }
            ctx.stroke();
        }
    }

    /** Espaço Sideral Profundo com Estrelas e Nebulosas Cósmicas */
    espacio_sideral(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Vácuo negro absoluto
        ctx.fillStyle = '#05050d';
        ctx.fillRect(0, 0, w, h);

        // Nuvens de poeira cósmica / Nebulosas coloridas (Galáxias de fundo)
        const nebulaColors = ['rgba(110, 37, 143, 0.15)', 'rgba(23, 73, 143, 0.12)', 'rgba(161, 35, 88, 0.1)'];
        for (let i = 0; i < 8; i++) {
            let nx = Math.random() * w;
            let ny = Math.random() * h;
            let rad = Math.random() * 250 + 100;

            let nGrad = ctx.createRadialGradient(nx, ny, 10, nx, ny, rad);
            nGrad.addColorStop(0, nebulaColors[i % nebulaColors.length]);
            nGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = nGrad;
            ctx.beginPath();
            ctx.arc(nx, ny, rad, 0, Math.PI * 2);
            ctx.fill();
        }

        // Estrelas distantes em pontos fixos matemáticos
        for (let i = 0; i < 400; i++) {
            let opacity = Math.random();
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            let size = Math.random() * 1.8;
            ctx.fillRect(Math.random() * w, Math.random() * h, size, size);
        }

        // Estrelas brilhantes com reflexo de cruz cruzada (Lens Flare cósmico)
        for (let i = 0; i < 12; i++) {
            let sx = Math.random() * w;
            let sy = Math.random() * h;
            
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();

            // Feixes de luz da estrela
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(sx - 10, sy); ctx.lineTo(sx + 10, sy);
            ctx.moveTo(sx, sy - 10); ctx.lineTo(sx, sy + 10);
            ctx.stroke();
        }
    }

    // ==========================================
    // 6. PERGAMINHOS E DOCUMENTAÇÃO DO MESTRE
    // ==========================================

    /** Papel Envelhecido Clássico para Mapas Antigos */
    papel(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Tom amarelado/creme de pergaminho vegetal
        ctx.fillStyle = '#ebdcb9';
        ctx.fillRect(0, 0, w, h);

        // Manchas de oxidação causadas pelo tempo (Efeito chá ou café derramado)
        for (let i = 0; i < 180; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(194, 169, 120, 0.25)' : 'rgba(156, 131, 84, 0.15)';
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 90 + 30, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fibras de celulose visíveis na polpa do papel antigo
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = 'rgba(115, 93, 53, 0.12)';
        for (let i = 0; i < 3000; i++) {
            let px = Math.random() * w;
            let py = Math.random() * h;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + Math.random() * 8 - 4, py + Math.random() * 8 - 4);
            ctx.stroke();
        }
    }

    /** Papiro Egípcio / Fibras de Junco Cruzadas Cruas */
    papiro(options = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Base crua de talo de papiro
        ctx.fillStyle = '#dfcaa0';
        ctx.fillRect(0, 0, w, h);

        ctx.lineWidth = 1;
        
        // Camada 1: Fibras de junco verticais prensadas
        for (let x = 0; x < w; x += Math.random() * 4 + 2) {
            ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(163, 138, 93, 0.3)' : 'rgba(240, 227, 197, 0.4)';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        // Camada 2: Fibras horizontais sobrepostas na prensa antiga
        for (let y = 0; y < h; y += Math.random() * 4 + 2) {
            ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(143, 118, 74, 0.25)' : 'rgba(245, 235, 208, 0.35)';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Imperfeições e nós de casca escura esmagados no papiro
        for(let i=0; i<400; i++) {
            ctx.fillStyle = 'rgba(92, 72, 39, 0.4)';
            ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*8+2, Math.random()*3+1);
        }
    }
}



// V46.77.0 — refinamentos solicitados de textura, corrigidos para RPGTextureGenerator.
// IMPORTANTE: RPGTextureGenerator usa this.canvas.width/height; ele não possui this.w/this.h.
RPGTextureGenerator.prototype.textureFloresta=function(){
 const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
 c.fillStyle='#173114';c.fillRect(0,0,w,h);
 const count=Math.max(40,Math.floor(w*h/2400));
 for(let i=0;i<count;i++){
   const cx=Math.random()*w,cy=Math.random()*h,R=16+Math.random()*28;
   c.fillStyle='rgba(5,18,5,.34)';c.beginPath();c.ellipse(cx+R*.18,cy+R*.28,R*.92,R*.62,Math.random(),0,Math.PI*2);c.fill();
   const lobes=9+Math.floor(Math.random()*8);
   for(let j=0;j<lobes;j++){
     const a=Math.random()*Math.PI*2,dist=R*(.12+Math.random()*.55),rr=R*(.24+Math.random()*.34);
     const fx=cx+Math.cos(a)*dist,fy=cy+Math.sin(a)*dist;
     const g=c.createRadialGradient(fx-rr*.28,fy-rr*.32,1,fx,fy,rr);
     g.addColorStop(0,Math.random()>.45?'#67994a':'#56863d');
     g.addColorStop(.48,'#356b2b');g.addColorStop(1,'#10290f');
     c.fillStyle=g;c.beginPath();
     c.ellipse(fx,fy,rr*(.72+Math.random()*.4),rr*(.62+Math.random()*.45),Math.random()*Math.PI,0,Math.PI*2);c.fill();
   }
   for(let k=0;k<22;k++){
     const a=Math.random()*Math.PI*2,rr=Math.sqrt(Math.random())*R*.75,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;
     if(Math.random()<.18){
       c.fillStyle='rgba(5,25,5,.55)';c.beginPath();c.arc(x,y,1.2+Math.random()*2.2,0,Math.PI*2);c.fill();
     }else{
       c.fillStyle=Math.random()>.5?'#7cad56':'#4f8739';
       c.save();c.translate(x,y);c.rotate(Math.random()*Math.PI);c.beginPath();
       c.ellipse(0,0,1+Math.random()*1.8,2+Math.random()*2.8,0,0,Math.PI*2);c.fill();c.restore();
     }
   }
 }
};

RPGTextureGenerator.prototype.textureTerrenoAcidentado=function(){
 const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
 c.fillStyle='#6e5d4f';c.fillRect(0,0,w,h);
 for(let i=0;i<Math.max(500,Math.floor(w*h/90));i++){
   c.fillStyle=Math.random()>.5?'rgba(35,25,18,.16)':'rgba(210,185,150,.10)';
   c.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);
 }
 for(let i=0;i<Math.max(35,Math.floor(w*h/14000));i++){
   let x=Math.random()*w,y=Math.random()*h;
   const sx=x,sy=y;
   c.beginPath();c.moveTo(x,y);
   const n=5+Math.floor(Math.random()*5);
   for(let j=0;j<n;j++){
     x+=(Math.random()-.5)*55;y+=(Math.random()-.5)*42;c.lineTo(x,y);
   }
   c.closePath();
   const g=c.createRadialGradient(sx,sy,2,sx,sy,38);
   g.addColorStop(0,'rgba(25,17,13,.72)');g.addColorStop(1,'rgba(55,38,28,.10)');
   c.fillStyle=g;c.fill();
 }
 for(let i=0;i<Math.max(55,Math.floor(w*h/9000));i++){
   const x=Math.random()*w,y=Math.random()*h,S=7+Math.random()*18,peak=S*(.8+Math.random()*.8);
   c.fillStyle='#44382f';c.beginPath();c.moveTo(x-S,y+S*.5);c.lineTo(x,y-peak);c.lineTo(x+S,y+S*.5);c.closePath();c.fill();
   c.fillStyle='#a18a74';c.beginPath();c.moveTo(x-S,y+S*.5);c.lineTo(x,y-peak);c.lineTo(x-S*.12,y+S*.32);c.closePath();c.fill();
   if(Math.random()<.55){
     c.strokeStyle='rgba(40,28,20,.6)';c.lineWidth=1;c.beginPath();
     c.moveTo(x,y);c.lineTo(x+(Math.random()-.5)*S*2,y+(Math.random()-.5)*S*1.6);c.stroke();
   }
 }
};

RPGTextureGenerator.prototype.textureTerraRochasIrregulares=function(){
 const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
 c.fillStyle='#5c4033';c.fillRect(0,0,w,h);
 for(let i=0;i<Math.max(700,Math.floor(w*h/140));i++){
   c.fillStyle=Math.random()>.5?'#4b3226':'#6a4e3d';
   c.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3);
 }
 for(let i=0;i<Math.max(40,Math.floor(w*h/9000));i++){
   const cx=Math.random()*w,cy=Math.random()*h,r=7+Math.random()*17,pts=[];
   for(let j=0;j<7;j++){
     const a=j/7*Math.PI*2,rr=r*(.68+Math.random()*.55);
     pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);
   }
   c.fillStyle='rgba(20,15,12,.32)';c.beginPath();
   pts.forEach((q,j)=>j?c.lineTo(q[0]+3,q[1]+4):c.moveTo(q[0]+3,q[1]+4));c.closePath();c.fill();
   c.fillStyle='#77736d';c.beginPath();
   pts.forEach((q,j)=>j?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.fill();
   c.strokeStyle='#4b4945';c.lineWidth=1;c.stroke();
   c.fillStyle='rgba(210,205,195,.42)';c.beginPath();
   c.ellipse(cx-r*.22,cy-r*.25,r*.35,r*.18,-.45,0,Math.PI*2);c.fill();
 }
};

RPGTextureGenerator.prototype.textureMasmorraCustom=function(tileWidth=22,tileHeight=14,light=false){
 const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
 c.fillStyle=light?'#6a6965':'#3a3a3a';c.fillRect(0,0,w,h);
 let row=0;c.lineWidth=2.2;c.strokeStyle=light?'#33322f':'#171717';
 for(let y=0;y<h;y+=tileHeight){
   c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();
   const off=(row%2)*(tileWidth/2);
   for(let x=off;x<w;x+=tileWidth){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+tileHeight);c.stroke();}
   row++;
 }
 row=0;c.lineWidth=.8;c.strokeStyle='rgba(255,255,255,.16)';
 for(let y=0;y<h;y+=tileHeight){
   const off=(row%2)*(tileWidth/2);
   for(let x=off;x<w;x+=tileWidth){
     c.beginPath();c.moveTo(x+1.5,y+tileHeight-1.5);c.lineTo(x+1.5,y+1.5);c.lineTo(x+tileWidth-1.5,y+1.5);c.stroke();
   }
   row++;
 }
};

RPGTextureGenerator.prototype.textureMarmorizadoPremium=function(tipo='branco'){
 const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
 const sets={
   branco:['#f2f1ed',['#676d74','#a8adb2','#d3c8bd','#8b8078']],
   preto:['#101113',['#e8e8e5','#777b80','#34383e','#b69b72']],
   vermelho:['#762b2b',['#f0d1c6','#3a1113','#c58b7e','#f4eee6']],
   verde:['#174a35',['#b7dfc8','#09291d','#6ca786','#e5eee7']]
 };
 const [base,cols]=sets[tipo]||sets.branco;
 c.fillStyle=base;c.fillRect(0,0,w,h);
 for(let i=0;i<70;i++){
   c.globalAlpha=.07+Math.random()*.10;
   c.fillStyle=cols[Math.floor(Math.random()*cols.length)];
   c.beginPath();c.ellipse(Math.random()*w,Math.random()*h,15+Math.random()*65,3+Math.random()*16,Math.random()*Math.PI,0,Math.PI*2);c.fill();
 }
 c.globalAlpha=1;
 for(let k=0;k<55;k++){
   c.strokeStyle=cols[Math.floor(Math.random()*cols.length)];
   c.lineWidth=.35+Math.random()*2.2;c.globalAlpha=.18+Math.random()*.48;
   let x=Math.random()*w,y=Math.random()*h;c.beginPath();c.moveTo(x,y);
   const steps=55+Math.floor(Math.random()*120);
   for(let i=0;i<steps;i++){
     x+=(Math.random()-.48)*(5+Math.random()*13);y+=(Math.random()-.5)*(3+Math.random()*10);c.lineTo(x,y);
     if(Math.random()<.035){c.stroke();c.beginPath();c.moveTo(x,y);}
   }
   c.stroke();
 }
 c.globalAlpha=1;
};

RPGTextureGenerator.prototype.texturePraiaCristalina=function(){
 const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#f0dda9');g.addColorStop(1,'#d7bc79');
 c.fillStyle=g;c.fillRect(0,0,w,h);
 c.strokeStyle='rgba(255,249,220,.48)';c.lineWidth=1.1;
 for(let i=0;i<45;i++){
   let x=Math.random()*w,y=Math.random()*h;c.beginPath();c.moveTo(x,y);
   for(let j=0;j<7;j++){x+=(Math.random()-.5)*95;y+=(Math.random()-.5)*70;c.lineTo(x,y);}
   c.stroke();
 }
 for(let i=0;i<Math.max(1200,Math.floor(w*h/55));i++){
   c.fillStyle=Math.random()>.7?'rgba(255,255,238,.7)':'rgba(170,135,70,.38)';
   c.fillRect(Math.random()*w,Math.random()*h,1,1);
 }
};

RPGTextureGenerator.prototype.textureDesertoRosado=function(){
 const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#d9959c');g.addColorStop(.5,'#c87683');g.addColorStop(1,'#a95a69');
 c.fillStyle=g;c.fillRect(0,0,w,h);
 for(let y=-40;y<h+40;y+=22){
   c.strokeStyle='rgba(255,206,204,.22)';c.lineWidth=3;c.beginPath();
   for(let x=0;x<=w;x+=12){const yy=y+Math.sin(x*.022+y*.01)*13+(x/w)*8;x?c.lineTo(x,yy):c.moveTo(x,yy);}
   c.stroke();
 }
};

RPGTextureGenerator.prototype.textureDesertoBranco=function(){
 const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
 c.fillStyle='#f1eee4';c.fillRect(0,0,w,h);
 for(let y=-40;y<h+40;y+=25){
   c.strokeStyle='rgba(190,184,169,.34)';c.lineWidth=2.2;c.beginPath();
   for(let x=0;x<=w;x+=12){const yy=y+Math.sin(x*.017+y*.013)*12;x?c.lineTo(x,yy):c.moveTo(x,yy);}
   c.stroke();
 }
 for(let i=0;i<Math.max(1000,Math.floor(w*h/65));i++){
   c.fillStyle='rgba(255,255,255,.72)';c.fillRect(Math.random()*w,Math.random()*h,1+Math.random(),1+Math.random());
 }
};

RPGTextureGenerator.prototype.textureNoite=function(){
 const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
 const g=c.createLinearGradient(0,0,0,h);
 g.addColorStop(0,'#0b1730');g.addColorStop(.55,'#101a2b');g.addColorStop(1,'#070c16');
 c.fillStyle=g;c.fillRect(0,0,w,h);
 // manchas muito sutis para não virar "espaço sideral"
 for(let i=0;i<120;i++){
   const x=Math.random()*w,y=Math.random()*h,r=15+Math.random()*65;
   const rg=c.createRadialGradient(x,y,0,x,y,r);
   rg.addColorStop(0,'rgba(45,70,105,.08)');rg.addColorStop(1,'rgba(0,0,0,0)');
   c.fillStyle=rg;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
 }
 for(let i=0;i<Math.max(300,Math.floor(w*h/500));i++){
   c.fillStyle=Math.random()>.7?'rgba(120,145,180,.12)':'rgba(0,0,0,.11)';
   c.fillRect(Math.random()*w,Math.random()*h,1,1);
 }
};

const gm2731ApplyTextureBase_=RPGTextureGenerator.prototype.applyTexture;
RPGTextureGenerator.prototype.applyTexture=function(type){
 switch(type){
   case 'floresta':return this.textureFloresta();
   case 'terreno_acidentado':return this.textureTerrenoAcidentado();
   case 'terra_rochas_irregulares':return this.textureTerraRochasIrregulares();
   case 'masmorra':return this.textureMasmorraCustom(22,14,false);
   case 'alvenaria':return this.textureMasmorraCustom(20,12,true);
   case 'marmore_branco':case 'piso_de_marmore':return this.textureMarmorizadoPremium('branco');
   case 'marmore_preto':return this.textureMarmorizadoPremium('preto');
   case 'marmore_vermelho':return this.textureMarmorizadoPremium('vermelho');
   case 'marmore_verde':return this.textureMarmorizadoPremium('verde');
   case 'praia':return this.texturePraiaCristalina();
   case 'deserto_rosado':return this.textureDesertoRosado();
   case 'deserto_branco':return this.textureDesertoBranco();
   case 'noite':return this.textureNoite();
   default:return gm2731ApplyTextureBase_.call(this,type);
 }
};

const gm2textureCache_=new Map();
// v110: ganchos para a arte do mapa (mesa-mapa-arte.js).
window.RPGTextureGeneratorV110_=RPGTextureGenerator;window.gm2LimparTexturasV110_=()=>gm2textureCache_.clear();
function gm2textureData_(name){
 if(!name||name==='nenhuma')return'';
 const basePPM=Math.max(16,Math.min(48,Number(window.mesaTexturaPPM)||24));
 const cw=Math.max(64,Math.round(gm2.st.w*basePPM));
 const ch=Math.max(64,Math.round(gm2.st.h*basePPM));
 const key=`${name}|${cw}|${ch}`;
 if(gm2textureCache_.has(key))return gm2textureCache_.get(key);
 try{
   const c=document.createElement('canvas');c.width=cw;c.height=ch;
   const gen=new RPGTextureGenerator(c);
   gen.applyTexture(name);
   const url=c.toDataURL('image/jpeg',.86);
   gm2textureCache_.set(key,url);
   if(gm2textureCache_.size>12){
     const first=gm2textureCache_.keys().next().value;
     gm2textureCache_.delete(first);
   }
   return url;
 }catch(err){
   console.warn('Oficina 2: textura não pôde ser gerada',name,err);
   return'';
 }
}

function gm2textureSvg_(p,w,h){
 const t=gm2.st.texture||'nenhuma';if(t==='nenhuma')return'';
 const url=gm2textureData_(t);if(!url)return'';
 return `<image href="${url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" opacity="1" pointer-events="none"/>`;
}
function gm2eraserPathSvg_(er,p,color='black'){
 return `<path d="${gm2smoothPath_(er.points,p)}" fill="none" stroke="${color}" stroke-width="${Math.max(1,Number(er.widthM||.2)*p)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function gm2renderWithErasers_(e,erasers,w,h,p){
 const later=erasers.filter(er=>(er.z||0)>(e.z||0));
 const body=gm2elementSvg(e);if(!later.length)return body;
 const mid='gm2mask_'+String(e.id).replace(/\W/g,'_');
 return `<defs><mask id="${mid}"><rect x="0" y="0" width="${w}" height="${h}" fill="white"/>${later.map(er=>gm2eraserPathSvg_(er,p,'black')).join('')}</mask></defs><g mask="url(#${mid})">${body}</g>`;
}
function gm2render(){
 if(gm2.renderQueued)return;
 gm2.renderQueued=true;
 requestAnimationFrame(()=>{
  gm2.renderQueued=false;
  const svg=document.getElementById('gm2svg');if(!svg)return;
  const p=gm2.st.ppm,w=gm2.st.w*p,h=gm2.st.h*p;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.style.width=w+'px';svg.style.height=h+'px';
  const grid=gm2.st.showGrid?`
   <defs><pattern id="gm2grid" width="${p}" height="${p}" patternUnits="userSpaceOnUse"><path d="M ${p} 0 L 0 0 0 ${p}" fill="none" stroke="${gm2.st.grid}" stroke-width="1"/></pattern></defs>
   <rect x="0" y="0" width="${w}" height="${h}" fill="url(#gm2grid)" pointer-events="none"/>`:'';
  const ordered=[...gm2.st.elements].sort((a,b)=>(a.z||0)-(b.z||0));
  const erasers=ordered.filter(e=>e.type==='eraser');
  const els=ordered.filter(e=>e.type!=='eraser').map(e=>gm2renderWithErasers_(e,erasers,w,h,p)).join('');
  const primary=gm2el(gm2.primary),handles=primary?gm2handlesSvg(primary):'';
  const marquee=gm2.drag?.kind==='marquee'?(()=>{const d=gm2.drag,b={x:Math.min(d.x0,d.x1)*p,y:Math.min(d.y0,d.y1)*p,w:Math.abs(d.x1-d.x0)*p,h:Math.abs(d.y1-d.y0)*p};return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="rgba(103,232,249,.10)" stroke="#67e8f9" stroke-dasharray="5 4"/>`;})():'';
  svg.innerHTML=`<rect id="gm2bg" x="0" y="0" width="${w}" height="${h}" fill="${gm2.st.bg}"/>${gm2.st.bgImage?`<image href="${gm2esc(gm2.st.bgImage)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`:''}${gm2textureSvg_(p,w,h)}${grid}<g id="gm2elements">${els}</g><g id="gm2overlay">${handles}${marquee}</g>`;
  gm2MesaBridge_?.paintTokens?.(svg);gm2syncControls();gm2updateToolbarState();gm2status();gm2updateCursor_();
 });
}
function gm2status(){
 const el=document.getElementById('gm2status');if(!el)return;
 const n=gm2.st.elements.length,sel=gm2.selected.size;
 el.textContent=`Oficina 2 · ${gm2.st.w} × ${gm2.st.h} m · ${n} elementos${sel?` · ${sel} selecionado(s)`:''} · ferramenta: ${gm2.tool}`;
}

function gm2panelHtml(){
 const brushOpts=[
 ['redondo','Pincel'],['quadrado','Pincel de ladrilhos'],['espelhado','Pincel espelhado'],['caligrafico','Caligrafia'],
 ['caneta','Caneta'],['lapis','Lápis'],['serpentina','Serpentina'],['seta','Seta'],['curso','Curso'],
 ['giz_cera','Giz'],['spray','Tinta spray'],['carimbo','Carimbo'],['pele','Pele / pelos'],['esboco','Esboço'],
 ['espirografo','Espirógrafo'],['teia','Teia'],['irregular','Irregular'],['pontilhada','Pontilhado'],['giz','Giz'],
 ['ranhura','Ranhura'],['areia','Areia'],['cascalho','Cascalho'],['grama','Grama'],['folhas','Folhas'],['neve','Neve'],
 ['fumaca','Fumaça'],['borracha','Borracha']
 ];
 return `
 <div class="gm2-head gm2-head-compact">
   <div class="gm2-actions gm2-actions-compact">
    <button id="gm2new" title="Novo mapa">🆕 Novo</button>
    <button id="gm2publish" title="Publicar este mapa na Mesa">📡 Publicar</button>
    <button id="gm2upload" title="Importar mapa ou imagem">🖼️ Importar</button>
    <input id="gm2file" type="file" accept="image/*" hidden>
    <div class="gm2-mapfile-box">
      <input id="gm2mapname" type="text" placeholder="Nome do mapa" title="Nome do mapa">
      <button id="gm2save" class="ok" title="Salvar este mapa na biblioteca">💾</button>
      <select id="gm2mapselect" title="Abrir outro mapa da biblioteca">
        <option value="">▾</option>
      </select>
    </div>
   </div>
 </div>
 <div id="gm2ribbon">
   <div class="gm2-row gm2-maprow">
    <label>Tamanho<select id="gm2size"><option>10x10</option><option>20x12</option><option selected>28x14</option><option>36x20</option><option>50x30</option><option>50x40</option></select></label>
    <label>Escala<select id="gm2ppm"><option>24</option><option selected>32</option><option>40</option><option>48</option></select></label>
    <label>Fundo<input id="gm2bgcolor" type="color"></label><button id="gm2bgimage" title="Imagem de fundo do mapa: clique para escolher uma imagem (ex.: battlemap importado); clique de novo para remover">🏞️</button><input id="gm2bgfile" type="file" accept="image/*" hidden><label>Grade<input id="gm2gridcolor" type="color"></label>
    <label class="gm2-check"><span>Grade</span><input id="gm2gridshow" type="checkbox" checked></label>
    <label>Textura do mapa<select id="gm2texture">
<option value="nenhuma">Nenhuma</option>
<optgroup label="Natureza">
<option value="terra">Terra</option><option value="areia">Areia / deserto</option>
<option value="deserto_rosado">Deserto rosado</option><option value="deserto_branco">Deserto branco</option><option value="praia">Praia</option>
<option value="rocha">Rocha</option><option value="cascalho">Cascalho</option><option value="floresta">Floresta</option><option value="palha">Palha</option>
<option value="terreno_acidentado">Terreno acidentado</option><option value="terreno_com_musgos">Terreno com musgos</option>
<option value="terra_com_rochas">Terra com rochas</option><option value="terra_rochas_irregulares">Terra com rochas irregulares</option>
</optgroup>
<optgroup label="Aventura">
<option value="caverna">Caverna</option><option value="masmorra">Masmorra</option><option value="alvenaria">Alvenaria</option>
</optgroup>
<optgroup label="Construções">
<option value="marmore_branco">Mármore branco</option><option value="marmore_preto">Mármore preto</option>
<option value="marmore_vermelho">Mármore vermelho</option><option value="marmore_verde">Mármore verde</option>
<option value="concreto">Concreto</option><option value="metal">Metal</option>
</optgroup>
<optgroup label="Fantasia">
<option value="congelado">Congelado</option><option value="noite">Noite</option><option value="espacio_sideral">Espaço sideral</option>
</optgroup>
<optgroup label="Mapas antigos">
<option value="papel">Papel envelhecido</option><option value="papiro">Papiro</option>
</optgroup>
</select></label>
    <button id="gm2undo" title="Desfazer (Ctrl+Z)">↶</button><button id="gm2redo" title="Refazer (Ctrl+Y)">↷</button>
    <label>Ferramenta<select id="gm2tool">
      <option value="select">Selecionar</option>${brushOpts.map(x=>`<option value="brush:${x[0]}">${x[1]}</option>`).join('')}
    </select></label>
    <label id="gm2stampWrap" style="display:none">Carimbo<select id="gm2stamp">
      <option value="montanha">Montanha</option><option value="arvore">Árvore</option>
      <option value="rocha">Rocha</option><option value="casa">Casa</option><option value="ruina">Ruína</option>
      <optgroup label="🔨 Construção (clique no mapa para colocar)">
        <option value="peca:parede">🧱 Parede</option><option value="peca:parede_porta">🚪 Parede com porta</option>
        <option value="peca:parede_janela">🪟 Parede com janela</option><option value="peca:passagem">⛩️ Passagem (vão)</option>
        <option value="peca:mureta">▭ Mureta</option><option value="peca:parede_diagonal">⟋ Parede diagonal</option>
        <option value="peca:parede_curva">◜ Parede curva</option>
        <option value="peca:chao">⬛ Chão</option><option value="peca:chao_redondo">⚪ Chão redondo</option>
        <option value="peca:teto">🔺 Teto</option><option value="peca:escada">🪜 Escada</option>
        <option value="peca:casa_pequena">🏠 Casa pequena</option><option value="peca:casa_media">🏡 Casa média</option>
        <option value="peca:galpao">🏭 Galpão</option><option value="peca:torre_redonda">🗼 Torre redonda</option>
        <option value="peca:casa_losango">🔶 Casa losango</option>
      </optgroup>
    </select></label>
    <label id="gm2pecaGiroWrap" style="display:none">Giro<select id="gm2pecaGiro"><option value="0">0°</option><option value="1">90°</option><option value="2">180°</option><option value="3">270°</option></select></label>
    <label id="gm2pecaMatWrap" style="display:none">Material<select id="gm2pecaMat">
      <option value="pedra-rio">Pedra</option><option value="tijolo">Tijolo</option><option value="metal-ferrugem">Metal enferrujado</option>
      <option value="metal-limpo">Metal futurista</option><option value="madeira">Madeira</option>
    </select></label>
    <div class="gm2-preview"><small>Prévia</small><span id="gm2preview"></span></div>
   </div>
   <div class="gm2-row gm2-stylerow">
    <b>Preenchimento / traço</b>
    <input id="gm2fill" type="color"><input id="gm2fillhex" class="gm2-hex" maxlength="7">
    <div id="gm2swatches">${['#ffffff','#111111','#ff5555','#ffd166','#59e391','#56c7f0','#a66cff'].map(c=>`<button data-color="${c}" style="background:${c}"></button>`).join('')}</div>
    <label>Tamanho<input id="gm2sizebrush" type="range" min="1" max="80"></label>
    <label>Opacidade<input id="gm2opacity" type="range" min="0" max="100"></label><span id="gm2opacityval"></span>
    <i class="gm2-sep"></i><b class="gold">Borda</b>
    <input id="gm2stroke" type="color"><input id="gm2strokehex" class="gm2-hex" maxlength="7">
    <label>Grossura<input id="gm2strokeW" type="range" min="0" max="24"></label><span id="gm2strokeWval"></span>
    <label>Opacidade<input id="gm2strokeO" type="range" min="0" max="100"></label>
    <label>Linhas<select id="gm2line"><option value="">— escolher —</option><option value="linha_reta">Reta</option><option value="linha_ondulada">Ondulada</option><option value="linha_pontilhada">Pontilhada</option><option value="linha_curva">Curva editável</option></select></label>
    <button id="gm2selectBtn" title="Selecionar / editar">↖</button>
    <button id="gm2front" title="Trazer para a frente de tudo">⤒</button>
    <button id="gm2up1" title="Subir UMA camada">↑1</button>
    <button id="gm2down1" title="Descer UMA camada">↓1</button>
    <button id="gm2back" title="Enviar para trás de tudo">⤓</button>
    <button id="gm2dup" title="Duplicar">▣</button><button id="gm2lock" title="Fixar / soltar">🔒</button>
    <button id="gm2crop" title="Recortar imagem">✂</button>
    <button id="gm2eraseAll" title="Apagador total: remove o elemento inteiro que tocar">⌫</button>
    <button id="gm2del" title="Excluir">🗑</button>
   </div>
 </div>
 <div class="gm2-workspace">
   <aside id="gm2side">
    <small>Formas</small>
    ${[['retangulo','▭','Retângulo'],['quadrado','□','Quadrado'],['triangulo','△','Triângulo'],['circulo','○','Círculo'],['elipse','⬭','Elipse']].map(x=>`<button data-shape="${x[0]}" title="${x[2]}">${x[1]}</button>`).join('')}
    <small>Outras</small>
    <select id="gm2other"><option value="">⌄</option><option value="hexagono">Hexágono</option><option value="pentagono">Pentágono</option><option value="losango">Losango</option><option value="estrela">Estrela</option><option value="pentagrama">Pentagrama</option><option value="hexagrama">Hexagrama</option><option value="heptagrama">Heptagrama</option><option value="u">U aberto</option><option value="u_balcao">U balcão (oco)</option><option value="coracao">Coração</option><option value="crescente">Lua crescente</option><option value="semicirculo">Semicírculo</option></select>
    <small>Próximos elementos</small>
    <label>Sombra<select id="gm2shadow"><option value="nenhuma">nenhuma</option><option value="suave">suave</option><option value="media">média</option><option value="forte">forte</option></select></label>
    <label>Direção<select id="gm2shadowdir"><option>SE</option><option>SO</option><option>NE</option><option>NO</option><option>S</option><option>N</option><option>E</option><option>O</option></select></label>
    <label>Distância<input id="gm2shadowdist" type="number" min="0" max="30" value="4"></label>
   </aside>
   <div id="gm2viewport"><svg id="gm2svg"></svg></div>
 </div>
 <div id="gm2bank">
   <div class="gm2-bankhead"><b>Objetos do banco</b><label><input id="gm2allobj" type="checkbox"> Selecionar todos</label></div>
   <div id="gm2objlist"></div>
   <button id="gm2addobj">＋ Adicionar marcados</button>
 </div>
 <div id="gm2status"></div>`;
}

function gm2css(){
 if(document.getElementById('gm2css'))return;
 const st=document.createElement('style');st.id='gm2css';st.textContent=`
 #gm-sub-oficina2{--g2:#67e8f9;--g2b:#11152d}
 #gm-sub-oficina2 button,#gm-sub-oficina2 select,#gm-sub-oficina2 input{font:inherit}
 .gm2-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}
 .gm2-head h3{margin:0 0 3px;color:#8feaff}.gm2-head h3 span{font-size:.55em;color:#ffcf67;border:1px solid #80651f;border-radius:10px;padding:2px 6px}
 .gm2-head p{margin:0;color:#aaa}.gm2-actions{display:flex;gap:7px;flex-wrap:wrap}.gm2-actions button{padding:8px 12px;border-radius:7px;border:1px solid #777;cursor:pointer}.gm2-actions .ok{background:#24a844;color:#fff}
 #gm2ribbon{border:1px solid #34506d;border-radius:10px 10px 0 0;background:#11152d;overflow:hidden}
 .gm2-row{display:flex;align-items:flex-end;gap:7px;flex-wrap:wrap;padding:7px 9px}.gm2-row+.gm2-row{border-top:1px solid rgba(255,255,255,.10)}
 .gm2-row label{display:flex;flex-direction:column;gap:2px;margin:0;font-size:9px;color:#b9c2e7}.gm2-row select{height:34px;margin:0;min-width:100px}
 .gm2-row input[type=color]{width:42px;height:32px;padding:2px;margin:0}.gm2-row input[type=range]{width:100px;margin:9px 0 5px}
 .gm2-row button{height:34px;min-width:36px;border-radius:6px;border:1px solid #666;cursor:pointer}.gm2-row b{align-self:center;font-size:13px}.gm2-row .gold{color:#ffd24d}
 .gm2-check{flex-direction:row!important;align-items:center;gap:4px!important;padding-bottom:7px}.gm2-check input{width:auto}
 .gm2-hex{width:74px!important;height:32px!important;margin:0!important}.gm2-sep{height:36px;border-left:1px solid rgba(255,255,255,.14)}
 #gm2swatches{display:flex;gap:4px;align-items:center}#gm2swatches button{width:24px;min-width:24px;height:24px;border-radius:50%;padding:0}
 .gm2-preview{min-width:120px}.gm2-preview small{display:block;font-size:9px;color:#b9c2e7}.gm2-preview span{display:block;width:120px;height:34px;border-radius:7px;background:#252b4d;position:relative;overflow:hidden}
 .gm2-preview span:after{content:"";position:absolute;left:7px;right:7px;top:16px;height:var(--sz,7px);background:var(--c,#59e391);opacity:var(--o,1);border-radius:99px;transform:rotate(-2deg)}
 .gm2-workspace{display:grid;grid-template-columns:58px minmax(0,1fr);align-items:start}
 #gm2side{border:1px solid #34506d;border-top:0;background:#11152d;padding:7px 5px;display:flex;flex-direction:column;gap:6px;min-height:560px}
 #gm2side small{font-size:9px;color:#d6e5ff;margin-top:3px}#gm2side button{height:38px;font-size:20px;border-radius:6px;border:1px solid #777;cursor:pointer}
 #gm2side button.active,#gm2ribbon button.active,#gm2eraseAll.active{outline:2px solid #67e8f9;background:#233e50;color:#fff}
 #gm-sub-oficina2 select{
   box-sizing:border-box;
   min-height:38px;
   height:38px;
   line-height:normal;
   padding-top:5px;
   padding-bottom:5px;
   vertical-align:middle;
   overflow:visible;
 }
 #gm2ribbon label select,#gm2side select{
   min-height:36px;
   height:36px;
   line-height:normal;
 }
 .gm2-head-compact{
   display:flex;
   justify-content:flex-end;
   align-items:center;
   padding:6px 8px !important;
   min-height:0 !important;
   margin-bottom:5px !important;
 }
 .gm2-actions-compact{
   width:100%;
   display:flex;
   gap:5px;
   align-items:center;
   justify-content:flex-end;
   flex-wrap:wrap;
 }
 .gm2-actions-compact>button{
   min-height:34px !important;
   height:34px !important;
   padding:4px 10px !important;
   font-size:.88rem !important;
   line-height:1.1 !important;
   border-radius:7px !important;
 }
 .gm2-mapfile-box{
   display:flex;
   gap:4px;
   align-items:center;
   margin-left:3px;
 }
 #gm2mapname{
   width:190px;
   min-width:130px;
   height:34px;
   box-sizing:border-box;
   margin:0 !important;
   padding:4px 8px !important;
   border-radius:7px;
   border:1px solid rgba(255,255,255,.22);
   background:#10172a;
   color:#fff;
   font-size:.9rem;
   line-height:1.1;
 }
 #gm2save{
   min-width:36px !important;
   width:36px !important;
   height:34px !important;
   padding:3px !important;
   font-size:1rem !important;
 }
 #gm2mapselect{
   width:38px !important;
   min-width:38px !important;
   height:34px !important;
   min-height:34px !important;
   padding:2px 3px !important;
   margin:0 !important;
   line-height:normal !important;
 }

 #gm2side select,#gm2side input{width:100%;margin:0;font-size:10px;padding:4px}#gm2side label{font-size:9px;color:#b9c2e7;margin:0}
 #gm2viewport{overflow:auto;max-width:100%;min-height:560px;padding:12px;background:rgba(3,8,25,.35);border-bottom:1px solid #34506d}
 #gm2svg{display:block;touch-action:none;user-select:none;box-shadow:0 0 0 1px rgba(255,255,255,.12)}
 .gm2-el{pointer-events:all}.gm2-handle,.gm2-crop-handle{cursor:pointer;pointer-events:all}
 #gm2bank{border:1px solid #34506d;border-top:0;background:#11152d;padding:8px}.gm2-bankhead{display:flex;justify-content:space-between;align-items:center;gap:10px}
 #gm2objlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:4px;max-height:120px;overflow:auto;margin:7px 0}
 #gm2objlist label{font-size:11px;background:#181d39;border-radius:5px;padding:4px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 #gm2status{font-size:11px;color:#9fc6d8;margin-top:6px}
 @media(max-width:900px){.gm2-workspace{grid-template-columns:48px minmax(0,1fr)}#gm2side{min-height:420px}.gm2-row{gap:5px}}
 `;document.head.appendChild(st);
}

function gm2installTab(){
 const old=document.getElementById('gm-sub-oficina-mapas');if(!old)return;
 if(document.getElementById('gm-sub-oficina2'))return;
 const tabs=old.parentElement.querySelector('.gm-subtabs');
 const oldBtn=[...tabs.querySelectorAll('button')].find(b=>b.textContent.includes('Oficina de Mapas'));
 const btn=document.createElement('button');btn.className='btn-small gm-subtab-btn';btn.textContent='🧭 Oficina 2';
 btn.onclick=function(){window.novaOficinaFechar_?.();mostrarSubAbaMestre('oficina2',this);setTimeout(()=>{gm2render();gm2populateBank();gm2populateMapSelect();},0)};
 oldBtn?.insertAdjacentElement('afterend',btn);
 const panel=document.createElement('div');panel.id='gm-sub-oficina2';panel.className='gm-sub-content hidden';panel.innerHTML=gm2panelHtml();
 old.insertAdjacentElement('afterend',panel);
 gm2css();gm2wire();gm2populateBank();gm2populateMapSelect();gm2render();
}

function gm2populateBank(){
 const box=document.getElementById('gm2objlist');if(!box)return;
 const list=[...(objetosMapaDB||[])].sort((a,b)=>String(getNome(a)||'').localeCompare(String(getNome(b)||''),'pt-BR'));
 box.innerHTML=list.map(o=>`<label title="${gm2esc(getNome(o))}"><input class="gm2objcheck" type="checkbox" value="${gm2esc(o.id)}"> ${gm2esc(getNome(o)||o.id)}</label>`).join('');
}

function gm2populateMapSelect(){
 const sel=document.getElementById('gm2mapselect');if(!sel)return;
 const lista=[...(mapasDB||[])].filter(m=>m.tipo!=='mapa-parte').sort((a,b)=>String(a.nome||a.id||'').localeCompare(String(b.nome||b.id||''),'pt-BR',{sensitivity:'base'}));
 sel.innerHTML='<option value="">▾</option>'+lista.map(m=>`<option value="${gm2esc(m.id)}">${gm2esc(m.nome||m.id)}</option>`).join('');
}
function gm2legacyToState_(m){
 const st={w:Number(m.larguraM||28),h:Number(m.alturaM||14),ppm:Number(m.pxPorMetro||32),bg:String(m.fundo||'#d7d7d7'),bgImage:String(m.fundoImagem||m.oficina2State?.bgImage||''),grid:String(m.corGrade||'#777777'),showGrid:m.gradeVisivel!==false,texture:String(m.textura||'nenhuma'),name:String(m.nome||''),mapId:String(m.id||''),elements:[]};
 let z=1;
 for(const d of (m.desenhos||[])){
   st.elements.push({id:String(d.id||gm2id('p')),type:'path',brush:String(d.pincel||d.textura||'redondo'),points:gm2clone(d.pts||[]),z:Number(d.ordemOficina||z++),locked:false,stroke:String(d.cor||'#111111'),strokeWidth:Number(d.esp||4),strokeWidthM:Math.max(.01,Number(d.esp||4)/Math.max(1,st.ppm)),strokeOpacity:Number(d.opacidade??1),opacity:1,shadow:'nenhuma',shadowDir:'SE',shadowDist:4});
 }
 for(const f of (m.formas||[])){
   const tipo=String(f.tipo||'retangulo');
   if(/^linha_/.test(tipo)){
     st.elements.push({id:String(f.id||gm2id('l')),type:'line',kind:tipo,x:Number(f.x||0),y:Number(f.y||0),x2:Number(f.x2??(Number(f.x||0)+Number(f.w||1))),y2:Number(f.y2??(Number(f.y||0)+Number(f.h||0))),cx:Number(f.cx??0),cy:Number(f.cy??0),z:Number(f.ordemOficina||z++),locked:!!f.fixada,stroke:String(f.stroke||'#111111'),strokeWidth:Number(f.strokeWidth||2),strokeWidthM:Math.max(.01,Number(f.strokeWidth||2)/Math.max(1,st.ppm)),strokeOpacity:Number(f.strokeOpacity??1),opacity:Number(f.opacity??1),shadow:f.sombraOficina||'nenhuma',shadowDir:f.sombraDirecao||'SE',shadowDist:Number(f.sombraDist||4)});
   }else{
     st.elements.push({id:String(f.id||gm2id('s')),type:'shape',kind:tipo,x:Number(f.x||0),y:Number(f.y||0),w:Math.max(.05,Number(f.w||1)),h:Math.max(.05,Number(f.h||1)),rot:Number(f.rot||0),radius:Number(f.radius||0),z:Number(f.ordemOficina||z++),locked:!!f.fixada,fill:String(f.fill||'#59e391'),fillOpacity:Number(f.fillOpacity??1),stroke:String(f.stroke||'#111111'),strokeWidth:Number(f.strokeWidth||0),strokeOpacity:Number(f.strokeOpacity??1),opacity:Number(f.opacity??1),shadow:f.sombraOficina||'nenhuma',shadowDir:f.sombraDirecao||'SE',shadowDist:Number(f.sombraDist||4)});
   }
 }
 for(const o of (m.objetos||[])){
   const w=Math.max(.05,Number(o.larguraM||1)),h=Math.max(.05,Number(o.alturaM||1)),isImg=!!o.imagemImportada||String(o.modeloId||'')==='imagem_importada';
   const copy=JSON.parse(JSON.stringify(o));
   st.elements.push({...copy,dadosBanco:isImg?undefined:(copy.dadosBanco||copy),id:String(o.id||gm2id(isImg?'i':'o')),type:isImg?'image':'object',modeloId:o.modeloId||o.objetoBancoId||'',objetoBancoId:o.objetoBancoId||o.modeloId||'',nome:o.nome||o.name||'',name:o.name||o.nome||'',src:String(o.imagem||''),x:Number(o.x||0)-w/2,y:Number(o.y||0)-h/2,w,h,rot:Number(o.angulo||0),z:Number(o.ordemOficina||z++),locked:!!o.fixada,opacity:Number(o.opacity??1),shadow:o.sombraOficina||'nenhuma',shadowDir:o.sombraDirecao||'SE',shadowDist:Number(o.sombraDist||4),crop:o.crop||{l:0,t:0,r:0,b:0},cropMode:false});
 }
 return st;
}
async function gm2loadLibraryMap(id){
 if(!batalhaEhMestre_())return;
 const base=(mapasDB||[]).find(m=>String(m.id)===String(id));if(!base)return;
 if(gm2.st.elements?.length&&!confirm(`Abrir “${base.nome||base.id}” na Oficina 2? O rascunho atual será substituído.`))return;
 try{
   const m=await labMapaHidratar_(base);
   gm2pushHistory();
   gm2.st=m.oficina2State?gm2clone(m.oficina2State):gm2legacyToState_(m);
   gm2.st.name=String(m.nome||gm2.st.name||'');
   gm2.st.mapId=String(m.id||id);
   if(gm2.st.texture==='pedra')gm2.st.texture='rocha';
   gm2clearSelection();gm2.tool='select';gm2saveLocal();gm2render();gm2populateMapSelect();
   notificar_(`Mapa “${gm2.st.name||m.id}” aberto na Oficina 2.`,'sucesso',2600);
 }catch(e){console.error(e);notificar_('Não foi possível abrir este mapa na Oficina 2.','erro',4500);}
}
function gm2syncControls(){
 const set=(id,v)=>{const e=document.getElementById(id);if(e&&document.activeElement!==e)e.value=v};
 set('gm2mapname',gm2.st.name||'');set('gm2size',`${gm2.st.w}x${gm2.st.h}`);set('gm2ppm',gm2.st.ppm);set('gm2bgcolor',gm2.st.bg);set('gm2gridcolor',gm2.st.grid);
 const gs=document.getElementById('gm2gridshow');if(gs)gs.checked=gm2.st.showGrid!==false;
 set('gm2texture',gm2.st.texture);set('gm2fill',gm2.defaults.fill);set('gm2fillhex',gm2.defaults.fill);set('gm2stroke',gm2.defaults.stroke);set('gm2strokehex',gm2.defaults.stroke);
 set('gm2sizebrush',gm2.defaults.size);set('gm2opacity',Math.round(gm2.defaults.opacity*100));set('gm2strokeW',gm2.defaults.strokeWidth);set('gm2strokeO',Math.round(gm2.defaults.strokeOpacity*100));
 set('gm2shadow',gm2.defaults.shadow);set('gm2shadowdir',gm2.defaults.shadowDir);set('gm2shadowdist',gm2.defaults.shadowDist);
 const ov=document.getElementById('gm2opacityval');if(ov)ov.textContent=Math.round(gm2.defaults.opacity*100)+'%';
 const sw=document.getElementById('gm2strokeWval');if(sw)sw.textContent=gm2.defaults.strokeWidth;
 const pv=document.getElementById('gm2preview');if(pv){pv.style.setProperty('--c',gm2.defaults.fill);pv.style.setProperty('--sz',Math.max(2,Math.min(20,gm2.defaults.size))+'px');pv.style.setProperty('--o',gm2.defaults.opacity);}
}
function gm2cursorData_(kind){
 const svgs={
  brush:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><g transform="rotate(-42 16 16)"><rect x="13" y="3" width="6" height="18" rx="2" fill="#e8e8e8" stroke="#111"/><path d="M12 20h8l-2 8h-4z" fill="#67e8f9" stroke="#111"/></g></svg>`,
  eraser:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><g transform="rotate(-35 16 16)"><rect x="7" y="10" width="20" height="12" rx="3" fill="#ffb5c8" stroke="#111" stroke-width="2"/><path d="M18 10v12" stroke="#fff" stroke-width="2"/></g></svg>`,
  delete:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><g transform="rotate(-35 16 16)"><rect x="6" y="9" width="19" height="12" rx="3" fill="#ff7070" stroke="#111" stroke-width="2"/></g><path d="M21 5l7 7m0-7l-7 7" stroke="#fff" stroke-width="2.5"/></svg>`
 };
 const raw=svgs[kind]||svgs.brush;return `url("data:image/svg+xml,${encodeURIComponent(raw)}") 5 27`;
}
function gm2updateCursor_(){
 const svg=document.getElementById('gm2svg');if(!svg)return;
 if(gm2.tool==='select')svg.style.cursor='default';
 else if(gm2.tool==='object')svg.style.cursor='grab';
 else if(gm2.tool==='deleteTouch')svg.style.cursor=gm2cursorData_('delete')+', auto';
 else if(gm2.tool==='brush'&&gm2.brush==='borracha')svg.style.cursor=gm2cursorData_('eraser')+', auto';
 else if(gm2.tool==='brush')svg.style.cursor=gm2cursorData_('brush')+', crosshair';
 else if(gm2.tool==='shape'||gm2.tool==='line')svg.style.cursor='crosshair';
 else svg.style.cursor='default';
}
function gm2updateToolbarState(){
 const tool=document.getElementById('gm2tool');if(tool){
   tool.value=gm2.tool==='brush'?`brush:${gm2.brush}`:gm2.tool==='select'?'select':'select';
 }
 document.querySelectorAll('#gm2side [data-shape]').forEach(b=>b.classList.toggle('active',gm2.tool==='shape'&&b.dataset.shape===gm2.shape));
 document.getElementById('gm2selectBtn')?.classList.toggle('active',gm2.tool==='select');
 const swrap=document.getElementById('gm2stampWrap');if(swrap)swrap.style.display=(gm2.tool==='brush'&&gm2.brush==='carimbo')?'flex':'none';
 const ssel=document.getElementById('gm2stamp');if(ssel)ssel.value=gm2.stamp||'montanha';
 const ePeca=String(gm2.stamp||'').startsWith('peca:');
 const gwrap=document.getElementById('gm2pecaGiroWrap');if(gwrap)gwrap.style.display=(gm2.tool==='brush'&&gm2.brush==='carimbo'&&ePeca)?'flex':'none';
 const mwrap=document.getElementById('gm2pecaMatWrap');if(mwrap)mwrap.style.display=(gm2.tool==='brush'&&gm2.brush==='carimbo'&&ePeca)?'flex':'none';
 const gsel=document.getElementById('gm2pecaGiro');if(gsel)gsel.value=String(Number(gm2.pecaGiro||0));
 const msel=document.getElementById('gm2pecaMat');if(msel)msel.value=gm2.pecaMat||'pedra-rio';
 document.getElementById('gm2eraseAll')?.classList.toggle('active',gm2.tool==='deleteTouch');
 const lk=document.getElementById('gm2lock'),pr=gm2el(gm2.primary);if(lk)lk.textContent=pr?.locked?'🔓':'🔒';
 const crop=document.getElementById('gm2crop');if(crop)crop.style.display=pr?.type==='image'?'inline-block':'none';
 gm2updateCursor_();
}

function gm2setHex(key,v){
 v=String(v||'').trim();if(!/^#[0-9a-f]{6}$/i.test(v))return;
 gm2.defaults[key]=v;
 if(gm2selectedEls().length)gm2applyDefaultsToSelection();else gm2syncControls();
}
function gm2styleChanged(){
 if(gm2selectedEls().length)gm2applyDefaultsToSelection();else gm2syncControls();
}

function gm2wire(){
 const $=id=>document.getElementById(id);
 $('gm2new').onclick=()=>{if(!confirm('Criar um mapa novo? O rascunho atual continuará salvo apenas se você já o gravou na biblioteca.'))return;gm2pushHistory();gm2.st={w:28,h:14,ppm:32,bg:'#d7d7d7',bgImage:'',grid:'#777777',showGrid:true,texture:'nenhuma',name:'',mapId:'',elements:[]};gm2clearSelection();gm2saveLocal();gm2render();gm2populateMapSelect();};
 $('gm2undo').onclick=gm2undo;$('gm2redo').onclick=gm2redo;
 $('gm2size').onchange=e=>{const[a,b]=e.target.value.split('x').map(Number);gm2historyAction(()=>{gm2.st.w=a;gm2.st.h=b;});};
 $('gm2ppm').onchange=e=>{gm2.st.ppm=Number(e.target.value)||32;gm2saveLocal();gm2render();};
 $('gm2bgcolor').oninput=e=>{gm2.st.bg=e.target.value;gm2saveLocal();gm2render();};
 $('gm2bgimage').onclick=()=>{if(gm2.st.bgImage){if(confirm('Remover a imagem de fundo do mapa?')){gm2pushHistory();gm2.st.bgImage='';gm2saveLocal();gm2render();}return;}$('gm2bgfile').click();};
 $('gm2bgfile').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const raw=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f);});gm2pushHistory();gm2.st.bgImage=await gm2imagemComprimir_(raw,2000,.82);gm2saveLocal();gm2render();notificar_('🏞️ Imagem de fundo aplicada. Publique/salve o mapa para compartilhar.','sucesso',3200);}catch(err){console.error('fundo',err);notificar_('Não foi possível ler a imagem de fundo.','erro',4200);}};
 $('gm2gridcolor').oninput=e=>{gm2.st.grid=e.target.value;gm2saveLocal();gm2render();};
 $('gm2gridshow').onchange=e=>{gm2.st.showGrid=e.target.checked;gm2saveLocal();gm2render();};
 $('gm2texture').onchange=e=>{gm2.st.texture=e.target.value;gm2saveLocal();gm2render();};
 $('gm2tool').onchange=e=>{const v=e.target.value;if(v==='select')gm2setTool('select');else if(v.startsWith('brush:'))gm2setTool('brush',v.slice(6));};
 $('gm2stamp').onchange=e=>{gm2.stamp=e.target.value;gm2saveLocal();gm2updateToolbarState();};
 $('gm2pecaGiro').onchange=e=>{gm2.pecaGiro=Number(e.target.value)||0;gm2saveLocal();};
 $('gm2pecaMat').onchange=e=>{gm2.pecaMat=e.target.value;gm2saveLocal();};
 $('gm2selectBtn').onclick=()=>gm2setTool('select');
 document.querySelectorAll('#gm2side [data-shape]').forEach(b=>b.onclick=()=>gm2setTool('shape',b.dataset.shape));
 $('gm2other').onchange=e=>{if(e.target.value)gm2setTool('shape',e.target.value);};
 $('gm2line').onchange=e=>{if(e.target.value)gm2setTool('line',e.target.value);};

 const setStyle=(id,key,conv=x=>x)=>{$(id).oninput=e=>{gm2.defaults[key]=conv(e.target.value);gm2styleChanged();};};
 setStyle('gm2fill','fill');$('gm2fillhex').onchange=e=>gm2setHex('fill',e.target.value);
 setStyle('gm2stroke','stroke');$('gm2strokehex').onchange=e=>gm2setHex('stroke',e.target.value);
 setStyle('gm2sizebrush','size',Number);setStyle('gm2opacity','opacity',v=>Number(v)/100);
 setStyle('gm2strokeW','strokeWidth',Number);setStyle('gm2strokeO','strokeOpacity',v=>Number(v)/100);
 setStyle('gm2shadow','shadow');setStyle('gm2shadowdir','shadowDir');setStyle('gm2shadowdist','shadowDist',Number);
 document.querySelectorAll('#gm2swatches [data-color]').forEach(b=>b.onclick=()=>{gm2.defaults.fill=b.dataset.color;gm2styleChanged();});

 $('gm2front').onclick=()=>gm2Layer(true);$('gm2up1').onclick=()=>gm2LayerStep(1);$('gm2down1').onclick=()=>gm2LayerStep(-1);$('gm2back').onclick=()=>gm2Layer(false);
 $('gm2dup').onclick=gm2duplicate;$('gm2del').onclick=gm2delete;
 $('gm2lock').onclick=gm2toggleLock;$('gm2crop').onclick=gm2toggleCrop;
 $('gm2eraseAll').onclick=()=>{gm2clearSelection();gm2.tool='deleteTouch';gm2updateToolbarState();gm2render();};

 $('gm2allobj').onchange=e=>document.querySelectorAll('.gm2objcheck').forEach(c=>c.checked=e.target.checked);
 $('gm2addobj').onclick=()=>{const ids=[...document.querySelectorAll('.gm2objcheck:checked')].map(c=>c.value);if(!ids.length)return;
   gm2.tool='object';gm2.objectIds=ids;gm2clearSelection();
   gm2placeObjects({x:gm2.st.w/2,y:gm2.st.h/2});
   gm2.tool='object';gm2.objectIds=ids;gm2updateToolbarState();gm2status();
 };

 $('gm2upload').onclick=()=>$('gm2file').click();$('gm2file').onchange=e=>{const f=e.target.files?.[0];if(f)gm2importImageFile(f);e.target.value='';};
 $('gm2mapname').oninput=e=>{gm2.st.name=String(e.target.value||'');gm2saveLocal();};
 $('gm2mapselect').onchange=e=>{const id=String(e.target.value||'');if(id)gm2loadLibraryMap(id);e.target.value='';};

 $('gm2save').onclick=gm2saveLibrary;$('gm2publish').onclick=gm2publish;

 const svg=$('gm2svg');
 svg.addEventListener('pointerdown',gm2pointerDown);
 window.addEventListener('keydown',gm2keys,true);
 window.addEventListener('paste',gm2paste,true);
}

function gm2point(ev){
 const svg=document.getElementById('gm2svg'),r=svg.getBoundingClientRect(),sx=(svg.viewBox.baseVal.width||r.width)/r.width,sy=(svg.viewBox.baseVal.height||r.height)/r.height,p=gm2.st.ppm;
 return{x:(ev.clientX-r.left)*sx/p,y:(ev.clientY-r.top)*sy/p};
}
function gm2pointerDown(ev){
 if(ev.button===2)return;
 const handle=ev.target.closest?.('.gm2-handle'),crop=ev.target.closest?.('.gm2-crop-handle');
 if(handle){ev.preventDefault();ev.stopPropagation();gm2handleStart(ev,handle.dataset.eid,handle.dataset.handle);return;}
 if(crop){ev.preventDefault();ev.stopPropagation();gm2cropStart(ev,crop.dataset.eid,crop.dataset.crop);return;}
 const node=ev.target.closest?.('.gm2-el'),id=node?.dataset.eid,e=id?gm2el(id):null,p=gm2point(ev);

 if(gm2.tool==='deleteTouch'){ev.preventDefault();gm2deleteTouchDrag(ev,p);return;}
 if(gm2.tool==='brush'&&gm2.brush==='borracha'){ev.preventDefault();gm2eraserStroke(ev,p);return;}

 if(e){
   if(gm2.tool==='select'||gm2.tool==='shape'||gm2.tool==='line'||gm2.tool==='object'){
     ev.preventDefault();gm2select(id,ev.ctrlKey||ev.metaKey);
     if(!e.locked&&!(ev.ctrlKey||ev.metaKey))gm2moveStart(ev,id);
     return;
   }
 }
 if(gm2.tool==='select'){
   ev.preventDefault();if(!(ev.ctrlKey||ev.metaKey))gm2clearSelection();
   gm2.drag={kind:'marquee',x0:p.x,y0:p.y,x1:p.x,y1:p.y};
   const mv=e2=>{const q=gm2point(e2);gm2.drag.x1=q.x;gm2.drag.y1=q.y;gm2render();};
   const up=()=>{window.removeEventListener('pointermove',mv);const d=gm2.drag,b={x:Math.min(d.x0,d.x1),y:Math.min(d.y0,d.y1),w:Math.abs(d.x1-d.x0),h:Math.abs(d.y1-d.y0)};gm2.drag=null;if(b.w>.05||b.h>.05){for(const el of gm2.st.elements)if(el.type!=='eraser'&&gm2intersects(b,gm2bbox(el)))gm2.selected.add(el.id);gm2.primary=[...gm2.selected].at(-1)||'';}gm2render();};
   window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});gm2render();return;
 }
 if(gm2.tool==='shape'){ev.preventDefault();gm2createShapeDrag(ev,p);return;}
 if(gm2.tool==='line'){ev.preventDefault();gm2createLineDrag(ev,p);return;}
 if(gm2.tool==='brush'){ev.preventDefault();gm2drawPath(ev,p);return;}
 if(gm2.tool==='object'){ev.preventDefault();gm2placeObjects(p);return;}
}

function gm2eraserStroke(ev,p0){
 gm2pushHistory();const e=gm2newEraser([p0]);gm2.st.elements.push(e);
 const mv=e2=>{const p=gm2point(e2),last=e.points.at(-1);if(!last||Math.hypot(p.x-last.x,p.y-last.y)>.025)e.points.push(p);gm2render();};
 const up=()=>{window.removeEventListener('pointermove',mv);gm2saveLocal();gm2render();};
 window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
}
function gm2pointSegDist_(p,a,b){
 const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y,c1=vx*wx+vy*wy;
 if(c1<=0)return Math.hypot(p.x-a.x,p.y-a.y);const c2=vx*vx+vy*vy;
 if(c2<=c1)return Math.hypot(p.x-b.x,p.y-b.y);const t=c1/c2,q={x:a.x+t*vx,y:a.y+t*vy};return Math.hypot(p.x-q.x,p.y-q.y);
}
function gm2touches_(e,p,r){
 if(e.type==='eraser')return false;
 if(e.type==='path'){const a=e.points||[];for(let i=0;i<a.length;i++){if(Math.hypot(a[i].x-p.x,a[i].y-p.y)<=r)return true;if(i&&gm2pointSegDist_(p,a[i-1],a[i])<=r)return true;}return false;}
 const b=gm2bbox(e);return p.x>=b.x-r&&p.x<=b.x+b.w+r&&p.y>=b.y-r&&p.y<=b.y+b.h+r;
}
function gm2deleteTouchDrag(ev,p0){
 gm2pushHistory();let changed=false;
 const r=Math.max(.12,Number(gm2.defaults.size||7)/Math.max(1,gm2.st.ppm)*.8);
 const erase=p=>{const before=gm2.st.elements.length;gm2.st.elements=gm2.st.elements.filter(e=>e.locked||!gm2touches_(e,p,r));if(gm2.st.elements.length!==before)changed=true;gm2clearSelection();gm2render();};
 erase(p0);
 const mv=e2=>erase(gm2point(e2));
 const up=()=>{window.removeEventListener('pointermove',mv);if(!changed)gm2.history.pop();gm2saveLocal();gm2render();};
 window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
}
function gm2createShapeDrag(ev,p0){
 gm2pushHistory();let e=null,moved=false;
 const mv=e2=>{moved=true;const p=gm2point(e2);if(!e){e=gm2newShape(gm2.shape,p0.x,p0.y,.05,.05);gm2.st.elements.push(e);}
   e.x=Math.min(p0.x,p.x);e.y=Math.min(p0.y,p.y);e.w=Math.max(.05,Math.abs(p.x-p0.x));e.h=Math.max(.05,Math.abs(p.y-p0.y));
   if(['quadrado','circulo'].includes(e.kind)){const q=Math.max(e.w,e.h);e.w=q;e.h=q;}gm2render();};
 const up=()=>{window.removeEventListener('pointermove',mv);if(!moved){e=gm2newShape(gm2.shape,p0.x-.5,p0.y-.5,1,1);gm2.st.elements.push(e);}gm2clearSelection();gm2.selected.add(e.id);gm2.primary=e.id;gm2saveLocal();gm2render();};
 window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
}
function gm2createLineDrag(ev,p0){
 gm2pushHistory();const e=gm2newLine(gm2.line,p0.x,p0.y,p0.x+.05,p0.y);gm2.st.elements.push(e);let moved=false;
 const mv=e2=>{moved=true;const p=gm2point(e2);e.x2=p.x;e.y2=p.y;if(e.kind==='linha_curva'){e.cx=(p0.x+p.x)/2;e.cy=(p0.y+p.y)/2-.5;}gm2render();};
 const up=()=>{window.removeEventListener('pointermove',mv);if(!moved)e.x2=p0.x+1;gm2clearSelection();gm2.selected.add(e.id);gm2.primary=e.id;gm2saveLocal();gm2render();};
 window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
}
// v199: converte uma peça de construção (mesa-construcao) em formas gm2 e a coloca no mapa.
function gm2pecaParaFormas_(id,p0){
 const W=gm2.st.w,H=gm2.st.h;
 const brutas=gm2PecaAPI.montarPeca(id,{x:p0.x,y:p0.y},{M:2,giro:Number(gm2.pecaGiro||0),t:.3,mat:gm2.pecaMat||'pedra-rio',W,H});
 const out=[];
 for(const b of brutas){
  const w=Math.max(.05,Number(b.larguraM)||1),h=Math.max(.05,Number(b.alturaM)||1);
  const cx=Number(b.x)||0,cy=Number(b.y)||0; // centro normalizado (0–28 / 0–14)
  const nome=String(b.nome||'');
  const kind=/redondo|círculo|circulo|Losango|losango/.test(nome)?(/losango/i.test(nome)?'losango':'elipse'):'retangulo';
  const e={id:gm2id('s'),type:'shape',kind,x:+(cx*W/28-w/2).toFixed(3),y:+(cy*H/14-h/2).toFixed(3),w,h,rot:Number(b.angulo)||0,radius:0,z:gm2zNext(),locked:false,
   fill:String(b.cor||gm2.defaults.fill),fillOpacity:1,stroke:String(b.borda||'#111111'),strokeWidth:Number(b.bordaLargura)||0,strokeOpacity:1,opacity:1,
   shadow:gm2.defaults.shadow,shadowDir:gm2.defaults.shadowDir,shadowDist:gm2.defaults.shadowDist,
   nome,bloqueiaMovimento:!!b.bloqueiaMovimento,bloqueiaVisao:!!b.bloqueiaVisao,
   pvMax:Number(b.pvMax)||0,pvAtual:Number(b.pvAtual)||0,dureza:Number(b.dureza)||0,
   destrutivel:!!b.destrutivel&&Number(b.pvMax)>0,camada:Number(b.camada)||1,
   oficina3:String(b.oficina3||''),grupoTetoV177:String(b.grupoTetoV177||'')};
  if(b.recorte)e.recorte=b.recorte;
  if(b.mascara)e.mascara=b.mascara;
  if(b.invisivelV161){e.fillOpacity=0;e.strokeOpacity=0;e.strokeWidth=0;e.opacity=0;e.invisivelV161=true;}
  out.push(e);
 }
 return out;
}
function gm2createPecaDrag(ev,p0){
 if(!gm2PecaAPI){notificar_('Módulo de construção ainda carregando; tente de novo em um instante.','aviso',2600);return;}
 const id=String(gm2.stamp||'').slice(5);
 if(!gm2PecaAPI.pecaDe(id)){notificar_('Peça desconhecida: '+id,'erro',3200);return;}
 gm2pushHistory();
 const formas=gm2pecaParaFormas_(id,p0);
 for(const f of formas)gm2.st.elements.push(f);
 gm2clearSelection();for(const f of formas)if(f.camada>=3)gm2.selected.add(f.id);gm2.primary=formas.find(f=>f.camada>=3)?.id||formas[0]?.id||null;
 gm2saveLocal();gm2render();
 notificar_(`🔨 ${gm2PecaAPI.pecaDe(id)?.icone||'🧩'} ${gm2PecaAPI.pecaDe(id)?.nome||id} colocada. Giro atual: ${Number(gm2.pecaGiro||0)*90}°`,'sucesso',2200);
}
function gm2drawPath(ev,p0){
 if(gm2.brush==='carimbo'&&String(gm2.stamp||'').startsWith('peca:')){gm2createPecaDrag(ev,p0);return;}
 gm2pushHistory();const e=gm2newPath([p0]);gm2.st.elements.push(e);
 const mv=e2=>{const p=gm2point(e2);const last=e.points.at(-1);if(!last||Math.hypot(p.x-last.x,p.y-last.y)>.025)e.points.push(p);gm2render();};
 const up=()=>{window.removeEventListener('pointermove',mv);gm2saveLocal();gm2render();};
 window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
}

function gm2moveStart(ev,id){
 const targets=gm2.selected.has(id)?gm2selectedEls():[gm2el(id)];if(!targets.length)return;
 gm2pushHistory();const p0=gm2point(ev),starts=targets.map(e=>({e,x:e.x,y:e.y,x2:e.x2,y2:e.y2,cx:e.cx,cy:e.cy,pts:e.type==='path'?gm2clone(e.points):null}));
 const mv=e2=>{const p=gm2point(e2),dx=p.x-p0.x,dy=p.y-p0.y;for(const s of starts){const e=s.e;
   if(e.type==='path')e.points=s.pts.map(q=>({x:q.x+dx,y:q.y+dy}));
   else {e.x=s.x+dx;e.y=s.y+dy;if(e.type==='line'){e.x2=s.x2+dx;e.y2=s.y2+dy;if(e.kind==='linha_curva'){e.cx=s.cx+dx;e.cy=s.cy+dy;}}}
 }gm2render();};
 const up=()=>{window.removeEventListener('pointermove',mv);gm2saveLocal();};
 window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
}

function gm2handleStart(ev,id,h){
 const e=gm2el(id);if(!e||e.locked)return;gm2pushHistory();const p0=gm2point(ev),b=gm2bbox(e),s=gm2clone(e);
 if(h==='rot'){
   const c={x:b.x+b.w/2,y:b.y+b.h/2};
   const mv=e2=>{const p=gm2point(e2);e.rot=(Math.atan2(p.y-c.y,p.x-c.x)*180/Math.PI+90+360)%360;gm2render();};
   const up=()=>{window.removeEventListener('pointermove',mv);gm2saveLocal();};
   window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});return;
 }
 if(h==='radius'){
   const mv=e2=>{const p=gm2point(e2);e.radius=Math.max(0,Math.min(Math.min(e.w,e.h)/2,p.x-e.x));gm2render();};
   const up=()=>{window.removeEventListener('pointermove',mv);gm2saveLocal();};
   window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});return;
 }
 if(h==='uthick'&&e.kind==='u_balcao'){
   const startT=Math.max(.08,Number(e.thickness||Math.min(e.w,e.h)*.18));
   const mv=e2=>{const p=gm2point(e2);e.thickness=Math.max(.08,Math.min(Math.min(e.w,e.h)*.45,startT+(p.x-p0.x)));gm2render();};
   const up=()=>{window.removeEventListener('pointermove',mv);gm2saveLocal();};
   window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});return;
 }
 if(h==='curve'){
   const mv=e2=>{const p=gm2point(e2);e.cx=p.x;e.cy=p.y;gm2render();};
   const up=()=>{window.removeEventListener('pointermove',mv);gm2saveLocal();};
   window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});return;
 }
 const aspect=(s.w||1)/(s.h||1);
 const mv=e2=>{const p=gm2point(e2),dx=p.x-p0.x,dy=p.y-p0.y;
   let x=s.x,y=s.y,w=s.w,hv=s.h;
   if(h.includes('e'))w=Math.max(.08,s.w+dx);if(h.includes('s'))hv=Math.max(.08,s.h+dy);
   if(h.includes('w')){w=Math.max(.08,s.w-dx);x=s.x+s.w-w;}if(h.includes('n')){hv=Math.max(.08,s.h-dy);y=s.y+s.h-hv;}
   if(e.type==='image'&&['nw','ne','se','sw'].includes(h)){if(Math.abs(dx)>Math.abs(dy)){hv=w/aspect;if(h.includes('n'))y=s.y+s.h-hv;}else{w=hv*aspect;if(h.includes('w'))x=s.x+s.w-w;}}
   if(e.type==='shape'&&['quadrado','circulo'].includes(e.kind)){const q=Math.max(w,hv);w=q;hv=q;if(h.includes('w'))x=s.x+s.w-q;if(h.includes('n'))y=s.y+s.h-q;}
   e.x=x;e.y=y;e.w=w;e.h=hv;gm2render();
 };
 const up=()=>{window.removeEventListener('pointermove',mv);gm2saveLocal();};
 window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
}
function gm2cropStart(ev,id,side){
 const e=gm2el(id);if(!e||e.type!=='image')return;gm2pushHistory();const p0=gm2point(ev),s=gm2clone(e),c=gm2clone(e.crop||{l:0,t:0,r:0,b:0});
 const fullW=s.w/Math.max(.03,1-c.l-c.r),fullH=s.h/Math.max(.03,1-c.t-c.b);
 const mv=e2=>{const p=gm2point(e2),dx=p.x-p0.x,dy=p.y-p0.y;
   if(side==='l'){const d=Math.max(-c.l*fullW,Math.min(s.w-.08,dx));e.x=s.x+d;e.w=s.w-d;e.crop.l=Math.max(0,Math.min(.95-c.r,c.l+d/fullW));}
   if(side==='r'){const d=Math.max(-c.r*fullW,Math.min(s.w-.08,-dx));e.w=s.w+dx;e.crop.r=Math.max(0,Math.min(.95-c.l,c.r-dx/fullW));}
   if(side==='t'){const d=Math.max(-c.t*fullH,Math.min(s.h-.08,dy));e.y=s.y+d;e.h=s.h-d;e.crop.t=Math.max(0,Math.min(.95-c.b,c.t+d/fullH));}
   if(side==='b'){e.h=Math.max(.08,s.h+dy);e.crop.b=Math.max(0,Math.min(.95-c.t,c.b-dy/fullH));}
   gm2render();
 };
 const up=()=>{window.removeEventListener('pointermove',mv);gm2saveLocal();};
 window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
}

function gm2LayerStep(dir){
 const sel=gm2selectedEls();if(!sel.length)return;
 gm2pushHistory();
 const ordered=[...gm2.st.elements].sort((a,b)=>(a.z||0)-(b.z||0));
 ordered.forEach((e,i)=>e.z=i+1);
 const ids=new Set(sel.map(e=>e.id));
 if(dir>0){
   for(let i=ordered.length-2;i>=0;i--){
     if(ids.has(ordered[i].id)&&!ids.has(ordered[i+1].id)){
       const z=ordered[i].z;ordered[i].z=ordered[i+1].z;ordered[i+1].z=z;
     }
   }
 }else{
   for(let i=1;i<ordered.length;i++){
     if(ids.has(ordered[i].id)&&!ids.has(ordered[i-1].id)){
       const z=ordered[i].z;ordered[i].z=ordered[i-1].z;ordered[i-1].z=z;
     }
   }
 }
 gm2saveLocal();gm2render();
}
function gm2Layer(front){
 const a=gm2selectedEls();if(!a.length)return;gm2pushHistory();
 if(front){let z=gm2zNext();a.forEach(e=>e.z=z++);}
 else{const min=Math.min(...gm2.st.elements.map(e=>Number(e.z)||0))-a.length-1;a.forEach((e,i)=>e.z=min+i);}
 gm2saveLocal();gm2render();
}
function gm2duplicate(){
 const a=gm2selectedEls();if(!a.length)return;gm2pushHistory();gm2clearSelection();
 for(const old of a){
  const e=gm2clone(old);
  e.id=gm2id(old.type[0]);e.z=gm2zNext();
  // A cópia precisa ser uma nova instância na cena. Manter mesaObjectId faria
  // o salvamento tratar original e duplicata como o mesmo objeto.
  delete e.mesaObjectId;delete e.mapObjectId;
  if(e.pvMax!==undefined)e.pvAtual=Math.max(0,Number(e.pvMax)||0);
  e.destruido=false;e.pegandoFogo=false;e.pegandoFogoLab=false;e.estadoFogo={};e.fogoUltimaRodadaLab=-1;
  if(e.type==='path')e.points=e.points.map(p=>({x:p.x+.35,y:p.y+.35}));
  else{e.x+=.35;e.y+=.35;if(e.type==='line'){e.x2+=.35;e.y2+=.35;e.cx+=.35;e.cy+=.35;}}
  gm2.st.elements.push(e);gm2.selected.add(e.id);gm2.primary=e.id;
 }
 gm2saveLocal();gm2render();
}
function gm2delete(){if(!gm2.selected.size)return;gm2pushHistory();gm2.st.elements=gm2.st.elements.filter(e=>!gm2.selected.has(e.id));gm2clearSelection();gm2saveLocal();gm2render();}
function gm2toggleLock(){const a=gm2selectedEls();if(!a.length)return;gm2pushHistory();const lock=!a.every(e=>e.locked);a.forEach(e=>e.locked=lock);gm2saveLocal();gm2render();}
function gm2toggleCrop(){const e=gm2el(gm2.primary);if(!e||e.type!=='image')return;e.cropMode=!e.cropMode;gm2render();}

function gm2copy(cut=false){
 const a=gm2selectedEls();if(!a.length)return;
 GM2_CLIP.items=gm2clone(a);gm2.internalPasteStamp=Date.now();
 if(cut)gm2delete();
}
function gm2pasteInternal(){
 if(!GM2_CLIP.items.length)return;gm2pushHistory();gm2clearSelection();
 for(const old of GM2_CLIP.items){
  const e=gm2clone(old);e.id=gm2id(e.type[0]);e.z=gm2zNext();
  delete e.mesaObjectId;delete e.mapObjectId;
  if(e.pvMax!==undefined)e.pvAtual=Math.max(0,Number(e.pvMax)||0);
  e.destruido=false;e.pegandoFogo=false;e.pegandoFogoLab=false;e.estadoFogo={};e.fogoUltimaRodadaLab=-1;
  if(e.type==='path')e.points=e.points.map(p=>({x:p.x+.35,y:p.y+.35}));
  else{e.x+=.35;e.y+=.35;if(e.type==='line'){e.x2+=.35;e.y2+=.35;e.cx+=.35;e.cy+=.35;}}
  gm2.st.elements.push(e);gm2.selected.add(e.id);gm2.primary=e.id;
 }
 gm2saveLocal();gm2render();
}
function gm2keys(ev){
 const panel=document.getElementById('gm-sub-oficina2');if(!panel||panel.classList.contains('hidden')||!panel.getClientRects().length)return;
 const tag=ev.target?.tagName?.toLowerCase();if(['input','textarea','select'].includes(tag))return;
 const mod=ev.ctrlKey||ev.metaKey,k=ev.key.toLowerCase();
 if(mod&&k==='z'){ev.preventDefault();ev.shiftKey?gm2redo():gm2undo();}
 else if(mod&&k==='y'){ev.preventDefault();gm2redo();}
 else if(mod&&k==='c'){ev.preventDefault();gm2copy(false);}
 else if(mod&&k==='x'){ev.preventDefault();gm2copy(true);}
 else if(mod&&k==='d'){ev.preventDefault();gm2duplicate();}
 else if(mod&&k==='v'&&GM2_CLIP.items.length){ev.preventDefault();gm2pasteInternal();}
 else if(ev.key==='Delete'||ev.key==='Backspace'){ev.preventDefault();gm2delete();}
}
function gm2paste(ev){
 const panel=document.getElementById('gm-sub-oficina2');if(!panel||panel.classList.contains('hidden'))return;
 if(Date.now()-gm2.internalPasteStamp<350)return;
 const files=[...(ev.clipboardData?.files||[])].filter(f=>f.type.startsWith('image/'));
 if(!files.length)return;
 ev.preventDefault();const f=files[0],sig=`${f.name}|${f.size}|${f.type}`;
 if(sig===gm2.lastExternalPasteSig&&Date.now()-gm2.lastExternalPasteAt<1600)return;
 gm2.lastExternalPasteSig=sig;gm2.lastExternalPasteAt=Date.now();gm2importImageFile(f);
}
function gm2imagemComprimir_(src,maxPx=1800,quality=.84){
 return new Promise(resolve=>{
   if(!src||!String(src).startsWith('data:image/')){resolve(src);return;}
   const im=new Image();
   im.onload=()=>{
     try{
       const scale=Math.min(1,maxPx/Math.max(im.width||1,im.height||1)),w=Math.max(1,Math.round(im.width*scale)),h=Math.max(1,Math.round(im.height*scale));
       const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{alpha:true});x.drawImage(im,0,0,w,h);
       let data=c.toDataURL('image/webp',quality);
       if(!data.startsWith('data:image/webp')||data.length>=src.length)data=c.toDataURL('image/jpeg',quality);
       resolve(data.length<src.length?data:src);
     }catch(_){resolve(src);}
   };
   im.onerror=()=>resolve(src);im.src=src;
 });
}
async function gm2importImageFile(f){
 const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f);});
 const im=new Image();im.onload=async()=>{
   const maxW=Math.min(gm2.st.w*.65,10),ratio=im.width/im.height||1,w=maxW,h=w/ratio;
   const compact=await gm2imagemComprimir_(raw);
   gm2pushHistory();const e=gm2newImage(compact,Math.max(0,(gm2.st.w-w)/2),Math.max(0,(gm2.st.h-h)/2),w,h,f.name||'Imagem');gm2.st.elements.push(e);gm2clearSelection();gm2.selected.add(e.id);gm2.primary=e.id;gm2.tool='select';gm2saveLocal();gm2render();
 };im.src=raw;
}
async function gm2compactarImagensEstado_(){
 let mudou=false;
 for(const e of (gm2.st.elements||[])){
   if(e.type!=='image'||!String(e.src||'').startsWith('data:image/')||String(e.src).length<450000)continue;
   const novo=await gm2imagemComprimir_(e.src,1600,.80);
   if(novo&&novo.length<e.src.length){e.src=novo;mudou=true;}
 }
 if(mudou){gm2saveLocal();gm2render();}
 return mudou;
}

function gm2addModelsAt_(models,p={x:null,y:null}){
 const list=(models||[]).filter(Boolean);if(!list.length)return 0;
 gm2pushHistory();gm2clearSelection();let off=0,added=0;
 const cx=Number.isFinite(Number(p.x))?Number(p.x):gm2.st.w/2;
 const cy=Number.isFinite(Number(p.y))?Number(p.y):gm2.st.h/2;
 for(const m of list){
   const w=Math.max(.35,Number(m.larguraM||m.largura||1)),h=Math.max(.35,Number(m.alturaM||m.altura||1)),src=m.imagem||m.image||'';
   const banco=JSON.parse(JSON.stringify(m)),pvModelo=Math.max(0,Number(m.pvMax??m.pv??0)||0);
   const destrutivelModelo=m.destrutivel===undefined?pvModelo>0:!['false','0','não','nao','no'].includes(String(m.destrutivel).toLowerCase());
   const e={
     ...banco,dadosBanco:banco,
     id:gm2id('o'),type:'object',modeloId:m.id,objetoBancoId:m.id,nome:getNome(m)||m.nome||m.id,name:getNome(m)||m.nome||m.id,src,
     x:Math.max(0,Math.min(gm2.st.w-w,cx-w/2+off)),y:Math.max(0,Math.min(gm2.st.h-h,cy-h/2+off)),w,h,rot:0,z:gm2zNext(),locked:false,opacity:1,
     pvMax:pvModelo,pvAtual:pvModelo,dureza:Math.max(0,Number(m.dureza??m.pa??0)||0),pesoKg:Math.max(0,Number(m.pesoKg??m.peso??0)||0),
     destrutivel:destrutivelModelo,
     inflamavel:!!m.inflamavel,bloqueiaMovimento:!!m.bloqueiaMovimento,bloqueiaVisao:!!m.bloqueiaVisao,
     destruido:false,pegandoFogoLab:false,fogoUltimaRodadaLab:-1,
     shadow:gm2.defaults.shadow,shadowDir:gm2.defaults.shadowDir,shadowDist:gm2.defaults.shadowDist
   };
   gm2.st.elements.push(e);gm2.selected.add(e.id);gm2.primary=e.id;off+=.25;added++;
 }
 gm2saveLocal();gm2render();return added;
}

function gm2placeObjects(p){
 const ids=gm2.objectIds||[];if(!ids.length)return;
 const models=ids.map(id=>(objetosMapaDB||[]).find(o=>String(o.id)===String(id))).filter(Boolean);
 gm2addModelsAt_(models,p);
}

function gm2objMetaLegacy_(e){
 const keys=[
  'nome','nome_en','nome_zh','categoria','material','descricao','descricao_en','descricao_zh',
  'pvMax','pvAtual','dureza','pesoKg','destrutivel','destruido',
  'inflamavel','inflamabilidade','inflamabilidadeLab','pegandoFogoLab','fogoUltimaRodadaLab',
  'bloqueiaMovimento','bloqueiaVisao','fixoAoMapa','tipoVisual','rascunho'
 ];
 const out={};
 for(const k of keys)if(e[k]!==undefined)out[k]=gm2clone(e[k]);
 return out;
}
function gm2toLegacy(){
 const desenhos=[],objetos=[],formas=[];
 for(const e of gm2.st.elements){
   if(e.type==='path')desenhos.push({id:e.id,cor:e.stroke,esp:e.strokeWidth,opacidade:e.strokeOpacity,pincel:e.brush,textura:e.brush,ferramenta:e.brush==='borracha'?'borracha':'traco',pts:gm2clone(e.points),ordemOficina:e.z});
   else if(e.type==='shape')formas.push({id:e.id,tipo:e.kind,x:e.x,y:e.y,w:e.w,h:e.h,rot:e.rot||0,radius:e.radius||0,fill:e.fill,fillOpacity:e.fillOpacity,stroke:e.stroke,strokeWidth:e.strokeWidth,strokeOpacity:e.strokeOpacity,opacity:e.opacity,ordemOficina:e.z,fixada:e.locked,sombraOficina:e.shadow,sombraDirecao:e.shadowDir,sombraDist:e.shadowDist});
   else if(e.type==='line')formas.push({id:e.id,tipo:e.kind,x:e.x,y:e.y,x2:e.x2,y2:e.y2,cx:e.cx,cy:e.cy,w:Math.abs(e.x2-e.x),h:Math.abs(e.y2-e.y),fill:'none',stroke:e.stroke,strokeWidth:e.strokeWidth,strokeOpacity:e.strokeOpacity,ordemOficina:e.z,fixada:e.locked,sombraOficina:e.shadow,sombraDirecao:e.shadowDir,sombraDist:e.shadowDist});
   else if(e.type==='object'){
     const snap=e.dadosBanco&&typeof e.dadosBanco==='object'?gm2clone(e.dadosBanco):{};
     objetos.push({...snap,...gm2objMetaLegacy_(e),id:e.id,modeloId:e.modeloId||e.objetoBancoId||snap.id||'',objetoBancoId:e.objetoBancoId||e.modeloId||snap.id||'',nome:e.nome||e.name||snap.nome||'Objeto',x:e.x+e.w/2,y:e.y+e.h/2,larguraM:e.w,alturaM:e.h,angulo:e.rot||0,imagem:e.src||snap.imagem||'',ordemOficina:e.z,fixada:e.locked,sombraOficina:e.shadow,sombraDirecao:e.shadowDir,sombraDist:e.shadowDist});
   }
   else if(e.type==='image')objetos.push({id:e.id,modeloId:'imagem_importada',x:e.x+e.w/2,y:e.y+e.h/2,larguraM:e.w,alturaM:e.h,angulo:e.rot||0,imagem:e.src,ordemOficina:e.z,fixada:e.locked,imagemImportada:true,crop:e.crop});
 }
 return{desenhos,objetos,formas};
}
async function gm2saveLibrary(){
 if(!batalhaEhMestre_())return;
 const input=document.getElementById('gm2mapname');
 const nome=String(input?.value||gm2.st.name||'').trim();
 if(!nome){notificar_('Digite um nome para o mapa antes de salvar.','aviso',3200);input?.focus();return;}
 gm2.st.name=nome;
 await gm2compactarImagensEstado_();

 let id=String(gm2.st.mapId||'');
 let existente=id?(mapasDB||[]).find(m=>String(m.id)===id):null;
 if(!id){
   id=labMapaSlug_(nome);let base=id,n=2;while((mapasDB||[]).some(m=>String(m.id)===String(id)))id=`${base}_${n++}`;
 }
 const legacy=gm2toLegacy();
 const dados={
   id,nome,larguraM:gm2.st.w,alturaM:gm2.st.h,pxPorMetro:gm2.st.ppm,
   fundo:gm2.st.bg,corGrade:gm2.st.grid,gradeVisivel:gm2.st.showGrid,textura:gm2.st.texture,
   // Oficina 2 é o formato oficial. Evita duplicar imagens importadas em legacy + state.
   desenhos:[],formas:[],
   objetos:legacy.objetos.filter(o=>!o.imagemImportada),
   oficina2State:gm2clone(gm2.st),
   criadoPor:existente?.criadoPor||currentUserUid||'',atualizadoEm:new Date().toISOString(),oficina2:true
 };
 try{
   const salvo=await labMapaSalvarFirestore_(dados,Number(existente?.partes||0));
   const ix=(mapasDB||[]).findIndex(m=>String(m.id)===String(id));
   if(ix>=0)mapasDB[ix]=salvo;else mapasDB.push(salvo);
   gm2.st.mapId=id;gm2.st.name=nome;gm2saveLocal();
   labMapaSelecionado_=id;labAtualizarSelectMapas_();gm2populateMapSelect();
   if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();
   notificar_(`💾 “${nome}” salvo.`,'sucesso',2800);
 }catch(e){
   console.error('Oficina 2 salvar',e);
   notificar_(`Não foi possível salvar “${nome}”. ${e?.message||'Falha no Firestore.'}`,'erro',6500);
 }
}
function gm2publish(){
 if(!batalhaEhMestre_())return;if(!confirm('Publicar o mapa da Oficina 2 na Mesa ao Vivo? Participantes serão mantidos.'))return;
 const legacy=gm2toLegacy();labEstado_.larguraM=gm2.st.w;labEstado_.alturaM=gm2.st.h;labEstado_.pxPorMetro=gm2.st.ppm;labEstado_.fundo=gm2.st.bg;labEstado_.fundoImagem=gm2.st.bgImage||'';labEstado_.corGrade=gm2.st.grid;labEstado_.gradeVisivel=gm2.st.showGrid;labEstado_.textura=gm2.st.texture;
 labEstado_.oficina2State=gm2clone(gm2.st);
 // Na Mesa, o terreno/desenho da Oficina 2 é renderizado pelo motor novo.
 // Só objetos do banco continuam no motor de combate, para manter interação/dano.
 labEstado_.desenhosLab=[];labEstado_.formasLab=[];labEstado_.objetosLab=legacy.objetos.filter(o=>!o.imagemImportada);
 if(gm2.st.mapId){
   labMapaSelecionado_=String(gm2.st.mapId);
   labEstado_.mapaCompartilhadoIdE7=String(gm2.st.mapId);
   labEstado_.mapaCompartilhadoRevE7=Date.now();
   labAtualizarSelectMapas_();
 }
 labSalvarLocal_();try{labAgendarSyncRemoto_();}catch(_){}
 labRender_();notificar_('Mapa da Oficina 2 publicado na Mesa ao Vivo.','sucesso',3500);
}


function gm2staticMesaSvg_(state,ppm,includeObjects=false){
 if(!state)return'';
 const prev=gm2.st;
 try{
   gm2.st=gm2clone(state);
   gm2.st.ppm=ppm;
   const w=gm2.st.w*ppm,h=gm2.st.h*ppm;
   const ordered=[...(gm2.st.elements||[])].sort((a,b)=>(a.z||0)-(b.z||0));
   const erasers=ordered.filter(e=>e.type==='eraser');
   // Objetos do banco ficam fora desta camada, pois a Mesa precisa deles como objetos de combate.
   const terrain=ordered.filter(e=>e.type!=='eraser'&&(includeObjects||e.type!=='object'))
     .map(e=>gm2renderWithErasers_(e,erasers,w,h,ppm)).join('');
   const grid=includeObjects&&gm2.st.showGrid?'<defs><pattern id="novaGrid" width="'+ppm+'" height="'+ppm+'" patternUnits="userSpaceOnUse"><path d="M '+ppm+' 0 L 0 0 0 '+ppm+'" fill="none" stroke="'+gm2esc(gm2.st.grid||'#777777')+'" stroke-width="1"/></pattern></defs><rect width="'+w+'" height="'+h+'" fill="url(#novaGrid)"/>':'';
   return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block">
     <rect x="0" y="0" width="${w}" height="${h}" fill="${gm2.st.bg||'#d7d7d7'}"/>
     ${gm2.st.bgImage?`<image href="${gm2esc(gm2.st.bgImage)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`:''}
     ${gm2textureSvg_(ppm,w,h)}
     ${grid}
     ${terrain}
   </svg>`;
 }finally{gm2.st=prev;}
}
function gm2installMesaNativeLayer_(){
 const map=document.getElementById('labMetricMap'),state=labEstado_?.oficina2State;
 if(!map||!state)return;
 const ppm=Number(labEstado_.pxPorMetro||state.ppm||48),w=Number(state.w||labEstado_.larguraM||28)*ppm,h=Number(state.h||labEstado_.alturaM||14)*ppm;
 let layer=document.getElementById('labOficina2Terrain');
 if(!layer){layer=document.createElement('div');layer.id='labOficina2Terrain';map.insertBefore(layer,map.firstChild);}
 layer.style.cssText=`position:absolute;inset:0;width:${w}px;height:${h}px;z-index:1;pointer-events:none;overflow:hidden`;
 layer.innerHTML=gm2staticMesaSvg_(state,ppm);
 // A grade continua pertencendo à Mesa, por cima do terreno novo.
 map.style.backgroundColor=state.bg||labEstado_.fundo||'#d7d7d7';
 map.style.backgroundImage=labEstado_.gradeVisivel===false?'none':`linear-gradient(to right,${labEstado_.corGrade||state.grid||'#777'} 1px,transparent 1px),linear-gradient(to bottom,${labEstado_.corGrade||state.grid||'#777'} 1px,transparent 1px)`;
 map.style.backgroundSize=`${ppm}px ${ppm}px,${ppm}px ${ppm}px`;
}
window.labViewNativeInstall_=gm2installMesaNativeLayer_;
const labRenderV4673Base_=labRender_;

window.labRender_=labRender_;

// A escala da Mesa é somente visual. O estado nativo permanece em metros.
const labMudarZoomV4673Base_=window.labMudarZoom_;
window.labMudarZoom_=function(v){
 const n=Math.max(16,Math.min(96,Number(v)||48));
 labEstado_.pxPorMetro=n;labSalvarLocal_();labRender_();
};

// Ao carregar mapa pela Mesa, mapas Oficina2 mantêm o estado nativo.
// O wrapper antigo de formas não deve ressuscitar as formas legacy nesses mapas.
setTimeout(()=>{
 const old=window.labCarregarMapaBanco_;
 if(!old||old.__gm273)return;
 const wrapped=async function(){
   const id=String(labMapaSelecionado_||''),base=(mapasDB||[]).find(m=>String(m.id)===id);
   let hydrated=null;try{if(base)hydrated=await labMapaHidratar_(base);}catch(_){}
   const r=await old();
   if(hydrated?.oficina2State){
     labEstado_.oficina2State=JSON.parse(JSON.stringify(hydrated.oficina2State));
     labEstado_.desenhosLab=[];labEstado_.formasLab=[];
     labEstado_.objetosLab=(labEstado_.objetosLab||[]).filter(o=>!o.imagemImportada);
     if(hydrated.pxPorMetro)labEstado_.pxPorMetro=Number(hydrated.pxPorMetro)||labEstado_.pxPorMetro;
     labSalvarLocal_();labRender_();
   }
   return r;
 };wrapped.__gm273=true;window.labCarregarMapaBanco_=wrapped;
},0);

// A Oficina antiga está aposentada. Oficina 2 é a única oficina exibida.
setTimeout(()=>{
 const oldPanel=document.getElementById('gm-sub-oficina-mapas');
 if(oldPanel)oldPanel.style.display='none';
 document.querySelectorAll('.gm-subtab-btn').forEach(b=>{if((b.getAttribute('onclick')||'').includes("'oficina-mapas'"))b.style.display='none';});
 // Na Mesa ao vivo, retiramos por enquanto o editor antigo. Escala e carregador permanecem.
 const oldTools=document.getElementById('labMapCreationControls');if(oldTools)oldTools.style.display='none';
 const editWrap=document.getElementById('labEditMapToggleWrap');if(editWrap)editWrap.style.display='none';
},1200);


// ============================================================
// V46.80.3 — MAPAS POR REFERÊNCIA
// Objetos do Banco não duplicam imagem/snapshot no mapa salvo.
// O mapa guarda modeloId + transformação; ao abrir, reidrata do Banco.
// Imagens externas continuam independentes e vão para Firebase Storage.
// ============================================================
const MAP803_REF_VERSION_='refs-v1';

function map803BancoPorId_(id){
  id=String(id||'');
  return (objetosMapaDB||[]).find(x=>String(x.id)===id)||null;
}
function map803Clone_(v){return JSON.parse(JSON.stringify(v));}
function map803Ext_(data){
  const m=String(data||'').match(/^data:image\/([^;,]+)/i);let x=(m?.[1]||'webp').toLowerCase();
  if(x==='jpeg')x='jpg';if(!/^(png|webp|jpg|gif)$/.test(x))x='webp';return x;
}
async function map803UploadImagem_(data,mapId,cache,seq){
  data=String(data||'');
  if(!data.startsWith('data:image/'))return data;
  if(cache.has(data))return cache.get(data);
  if(!currentUserUid)throw new Error('Usuário não autenticado para enviar imagens do mapa.');
  const blob=await (await fetch(data)).blob(),ext=map803Ext_(data);
  const safe=String(mapId||'mapa').replace(/[^a-zA-Z0-9_-]+/g,'_');
  const caminho=`mapas/${currentUserUid}/${safe}/externa_${Date.now()}_${String(seq.n++).padStart(3,'0')}.${ext}`;
  const up=await uploadBytes(ref(storage,caminho),blob,{contentType:blob.type||`image/${ext}`});
  const url=await getDownloadURL(up.ref);cache.set(data,url);return url;
}
function map803ObjetoRef_(e){
  return {
    id:String(e.id||gm2id('o')),
    type:'object',
    modeloId:String(e.modeloId||e.objetoBancoId||e.dadosBanco?.id||''),
    objetoBancoId:String(e.objetoBancoId||e.modeloId||e.dadosBanco?.id||''),
    x:Number(e.x||0),y:Number(e.y||0),w:Number(e.w||1),h:Number(e.h||1),rot:Number(e.rot||0),z:Number(e.z||0),
    locked:!!e.locked,opacity:Number(e.opacity??1),shadow:e.shadow||'nenhuma',shadowDir:e.shadowDir||'SE',shadowDist:Number(e.shadowDist||4),
    mapRef:true
  };
}
async function map803EstadoSlim_(state,mapId){
  const st=map803Clone_(state),cache=new Map(),seq={n:1};
 if(String(st.bgImage||'').startsWith('data:image/')){st.bgImage=await map803UploadImagem_(st.bgImage,mapId,cache,seq);}
  const els=[];let refs=0,externas=0;
  for(const e0 of (st.elements||[])){
    const e=map803Clone_(e0);
    if(e.type==='object' && String(e.modeloId||e.objetoBancoId||e.dadosBanco?.id||'')){
      els.push(map803ObjetoRef_(e));refs++;continue;
    }
    if(e.type==='image'){
      if(String(e.src||'').startsWith('data:image/')){e.src=await map803UploadImagem_(e.src,mapId,cache,seq);externas++;}
      delete e.dadosBanco;delete e.imagem;els.push(e);continue;
    }
    // Formas/desenhos são vetoriais e pequenos; elimina snapshots acidentais.
    delete e.dadosBanco;delete e.imagem;
    els.push(e);
  }
  st.elements=els;st.formatoObjetos=MAP803_REF_VERSION_;
  return {state:st,refs,externas};
}
function map803HidratarElemento_(e){
  if(!e||e.type!=='object')return e;
  const mid=String(e.modeloId||e.objetoBancoId||'');
  const m=map803BancoPorId_(mid);
  if(!m)return e;
  const inst={...map803Clone_(m),...map803Clone_(e)};
  inst.modeloId=mid;inst.objetoBancoId=mid;inst.dadosBanco=map803Clone_(m);
  inst.nome=inst.nome||m.nome||mid;inst.name=inst.name||inst.nome;inst.src=m.imagem||m.image||inst.src||'';
  inst.pvMax=Number(m.pvMax||0);inst.pvAtual=Number(m.pvMax||0);inst.dureza=Number(m.dureza||0);inst.pesoKg=Number(m.pesoKg||0);
  inst.destrutivel=m.destrutivel!==false;inst.inflamavel=!!m.inflamavel;inst.inflamabilidade=Number(m.inflamabilidade||0);
  inst.bloqueiaMovimento=m.bloqueiaMovimento!==false;inst.bloqueiaVisao=!!m.bloqueiaVisao;
  inst.destruido=false;inst.pegandoFogoLab=false;inst.fogoUltimaRodadaLab=-1;
  return inst;
}
function map803HidratarEstado_(st){
  const out=map803Clone_(st||{});out.elements=(out.elements||[]).map(map803HidratarElemento_);return out;
}
// Renderização de leitura: usa os mesmos pincéis da Oficina, sem abrir o editor.
window.novaSyncRenderMap_=function(map,{separateObjects=false}={}){
  const state=map803HidratarEstado_(map.oficina2State||gm2legacyToState_(map));
  state.w=Number(state.w||map.larguraM||28);
  state.h=Number(state.h||map.alturaM||14);
  state.ppm=Number(state.ppm||map.pxPorMetro||32);
  if(state.texture==='pedra')state.texture='rocha';
  if(separateObjects)state.elements=(state.elements||[]).filter(e=>e.type!=='object');
  return gm2staticMesaSvg_(state,state.ppm,true);
};
function map803LegacyRefs_(state){
  const objetos=[];
  for(const e of (state.elements||[])){
    if(e.type!=='object')continue;
    objetos.push({
      id:String(e.id),modeloId:String(e.modeloId||e.objetoBancoId||''),objetoBancoId:String(e.objetoBancoId||e.modeloId||''),
      x:Number(e.x||0)+Number(e.w||1)/2,y:Number(e.y||0)+Number(e.h||1)/2,
      larguraM:Number(e.w||1),alturaM:Number(e.h||1),angulo:Number(e.rot||0),ordemOficina:Number(e.z||0),fixada:!!e.locked,
      opacity:Number(e.opacity??1),sombraOficina:e.shadow||'nenhuma',sombraDirecao:e.shadowDir||'SE',sombraDist:Number(e.shadowDist||4),mapRef:true
    });
  }
  return objetos;
}
function map803Bytes_(obj){try{return new Blob([JSON.stringify(obj)]).size;}catch(_){return JSON.stringify(obj).length;}}

// Reidrata mapas refs-v1 ao abrir na Oficina 2.
const map803LoadBase_=gm2loadLibraryMap;
gm2loadLibraryMap=async function(id){
  const base=(mapasDB||[]).find(m=>String(m.id)===String(id));
  if(!base)return map803LoadBase_.apply(this,arguments);
  try{
    const m=await labMapaHidratar_(base);
    if(m?.mesaScene?.oficinaConfig){
      if(gm2.st.elements?.length&&!confirm('Abrir o mapa salvo na mesa e substituir o rascunho da Oficina?'))return;
      gm2pushHistory();gm2.st=estadoOficinaMesa(map803HidratarEstado_(m.oficina2State||gm2legacyToState_(m)),m.mesaScene);gm2.st.mapId=String(m.id||id);gm2clearSelection();gm2.tool='select';gm2saveLocal();gm2render();return;
    }
    if(m?.oficina2State?.formatoObjetos===MAP803_REF_VERSION_){
      if(gm2.st.elements?.length&&!confirm(`Abrir “${base.nome||base.id}” na Oficina 2? O rascunho atual será substituído.`))return;
      gm2pushHistory();gm2.st=map803HidratarEstado_(m.oficina2State);gm2.st.name=String(m.nome||gm2.st.name||'');gm2.st.mapId=String(m.id||id);
      gm2clearSelection();gm2.tool='select';gm2saveLocal();gm2render();gm2populateMapSelect();
      notificar_(`Mapa “${gm2.st.name||m.id}” aberto · objetos reconstruídos do Banco.`,'sucesso',3000);return;
    }
  }catch(e){console.error('Abrir mapa por referência',e);}
  return map803LoadBase_.apply(this,arguments);
};

// Salvamento oficial por referência.
gm2saveLibrary=async function(){
  if(!batalhaEhMestre_())return;
  const input=document.getElementById('gm2mapname'),nome=String(input?.value||gm2.st.name||'').trim();
  if(!nome){notificar_('Digite um nome para o mapa antes de salvar.','aviso',3200);input?.focus();return;}
  let id=String(gm2.st.mapId||''),existente=id?(mapasDB||[]).find(m=>String(m.id)===id):null;
  if(!id){id=labMapaSlug_(nome);let base=id,n=2;while((mapasDB||[]).some(m=>String(m.id)===String(id)))id=`${base}_${n++}`;}
  try{
    notificar_(`⏳ Preparando “${nome}” por referências…`,'info',2600);
    const slim=await map803EstadoSlim_(gm2.st,id);
    const dados={id,nome,larguraM:slim.state.w,alturaM:slim.state.h,pxPorMetro:slim.state.ppm,fundo:slim.state.bg,fundoImagem:slim.state.bgImage||'',corGrade:slim.state.grid,gradeVisivel:slim.state.showGrid,textura:slim.state.texture,
      desenhos:[],formas:[],objetos:map803LegacyRefs_(slim.state),oficina2State:slim.state,formatoObjetos:MAP803_REF_VERSION_,criadoPor:existente?.criadoPor||currentUserUid||'',atualizadoEm:new Date().toISOString(),oficina2:true};
    const kb=(map803Bytes_(dados)/1024).toFixed(1);
    notificar_(`📦 Mapa preparado: ${kb} KB · ${slim.refs} objeto(s) por referência · ${slim.externas} imagem(ns) externa(s).`,'info',4200);
    const salvo=await labMapaSalvarFirestore_(dados,Number(existente?.partes||0));
    const ix=(mapasDB||[]).findIndex(m=>String(m.id)===String(id));if(ix>=0)mapasDB[ix]=salvo;else mapasDB.push(salvo);
    gm2.st.mapId=id;gm2.st.name=nome;gm2saveLocal();labMapaSelecionado_=id;labAtualizarSelectMapas_();gm2populateMapSelect();if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();
    notificar_(`💾 “${nome}” salvo · ${kb} KB · ${slim.refs} referências.`,'sucesso',4500);
  }catch(e){console.error('Salvar mapa por referência',e);notificar_(`Não foi possível salvar “${nome}”. ${e?.message||e}`,'erro',9000);}
};
window.gm2saveLibrary=gm2saveLibrary;

// O botão foi criado com uma referência antiga; força o handler final.
function map803ReligarSalvar_(){if(gm2MesaBridge_)return;const b=document.getElementById('gm2save');if(b)b.onclick=()=>gm2saveLibrary();}
const map803InstallBase_=gm2installTab;
gm2installTab=function(){const r=map803InstallBase_.apply(this,arguments);setTimeout(map803ReligarSalvar_,0);return r;};
setInterval(map803ReligarSalvar_,1200);


// A mesma instância da Oficina 2 é emprestada à mesa: nenhum controlador duplicado.
function novaOficinaModelo_(o){
 const raw=String(o?.modeloId||o?.oficinaElement?.modeloId||'');
 const id=raw.includes(':')?raw.slice(raw.lastIndexOf(':')+1):raw;
 return map803BancoPorId_(id)||(itensDB||[]).find(m=>String(m.id)===id)||null;
}
window.novaOficinaMesa_=function({host,map,scene,draft,tokens=()=>[],onSave}){
 if(!batalhaEhMestre_())throw Error('Somente o mestre pode editar.');
 gm2installTab();const panel=document.getElementById('gm-sub-oficina2');if(!panel)throw Error('A Oficina 2 ainda não está disponível.');
 const marker=document.createComment('Oficina 2'),parent=panel.parentNode;parent.insertBefore(marker,panel);
 const previous={...gm2,selected:new Set(gm2.selected)},className=panel.className;
 const local=map803HidratarEstado_(map.oficina2State||gm2legacyToState_(map));
 const sceneVisual=hidratarReferenciasOficina(scene,{modelFor:novaOficinaModelo_});
 gm2.st=draft||estadoOficinaMesa(local,sceneVisual);gm2.history=[];gm2.future=[];gm2.selected=new Set();gm2.primary='';gm2.tool='select';gm2.renderQueued=false;
 let currentMapId=String(map.id||gm2.st.mapId||''),currentMapName=String(map.nome||gm2.st.name||currentMapId||'Mapa');
 const bridge={dirty:false,saving:false,paintTokens(svg){svg.querySelector('[data-mesa-tokens]')?.remove();const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.dataset.mesaTokens='';g.style.pointerEvents='none';const p=gm2.st.ppm;
 for(const t of tokens()){const x=t.x/28*gm2.st.w*p,y=t.y/14*gm2.st.h*p,r=(Number(t.diametroM)||1)*p/2;const circle=document.createElementNS(g.namespaceURI,'circle');circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.setAttribute('r',r);circle.setAttribute('fill','#263d62');circle.setAttribute('stroke','#00d4ff');g.append(circle);if(t.imagem){const image=document.createElementNS(g.namespaceURI,'image');image.setAttribute('href',t.imagem);image.setAttribute('x',x-r);image.setAttribute('y',y-r);image.setAttribute('width',r*2);image.setAttribute('height',r*2);image.style.clipPath='circle(50%)';g.append(image);}const text=document.createElementNS(g.namespaceURI,'text');text.setAttribute('x',x);text.setAttribute('y',y+r+12);text.setAttribute('text-anchor','middle');text.setAttribute('fill','white');text.setAttribute('font-size','11');text.textContent=t.nome;g.append(text);}svg.append(g);
 }};gm2MesaBridge_=bridge;panel.classList.remove('hidden');host.append(panel);
 const ids=['gm2new','gm2mapselect','gm2publish','gm2save','gm2size','gm2mapname'],saved=ids.map(id=>{const n=document.getElementById(id);return {n,hidden:n.hidden,disabled:n.disabled,readOnly:n.readOnly,onclick:n.onclick,text:n.textContent,title:n.title,value:n.value};});
 const embeddedBank=document.getElementById('gm2bank'),embeddedBankDisplay=embeddedBank?.style.display||'';
 if(embeddedBank)embeddedBank.style.display='none';
 document.getElementById('gm2size').disabled=true;document.getElementById('gm2size').title='O tamanho é mantido durante a edição na mesa para preservar as posições.';
 document.getElementById('gm2new').hidden=true;document.getElementById('gm2mapselect').hidden=true;
 const mapName=document.getElementById('gm2mapname');if(mapName){mapName.value=currentMapName;mapName.readOnly=true;mapName.title='Mapa atualmente aberto. Use “Salvar como novo mapa” para criar outro.';}
 const tinySave=document.getElementById('gm2save');if(tinySave)tinySave.hidden=true;
 const actions=panel.querySelector('.gm2-actions');
 const saveAsBtn=document.createElement('button');saveAsBtn.id='gm2saveas75';saveAsBtn.type='button';saveAsBtn.textContent='💾➕ Salvar como novo mapa';saveAsBtn.title='Cria uma cópia das edições com outro nome e passa a usar o novo mapa.';
 const deleteBtn=document.createElement('button');deleteBtn.id='gm2delete75';deleteBtn.type='button';deleteBtn.textContent='🗑️ Excluir mapa';deleteBtn.title='Exclui o mapa atualmente aberto da biblioteca.';
 const status=document.createElement('span');status.id='gm2dirty75';status.style.cssText='display:inline-flex;align-items:center;padding:6px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.18);font-size:.88em;white-space:nowrap;';
 if(actions){actions.append(saveAsBtn,deleteBtn,status);}
 bridge.updateStatus=()=>{if(!status.isConnected)return;status.textContent=bridge.saving?'↻ Salvando…':bridge.dirty?'● Alterações não salvas':'✓ Mapa salvo';status.style.color=bridge.saving?'#ffd166':bridge.dirty?'#ffd166':'#8ff0a4';};bridge.updateStatus();
 const setBusy=v=>{bridge.saving=!!v;for(const b of [document.getElementById('gm2publish'),saveAsBtn,deleteBtn])if(b)b.disabled=!!v;bridge.updateStatus();};
 const preparar=async(uploadMapId=currentMapId)=>{const snapshot=gm2clone(gm2.st),cache=new Map(),seq={n:1};const publication=await compactarPublicacaoOficina(prepararPublicacaoOficina(snapshot,scene,gm2bbox),{
    modelFor:o=>{const id=String(o.modeloId||'').split(':').pop();return map803BancoPorId_(id)||(typeof itensDB!=='undefined'?itensDB:[]).find(i=>String(i.id)===id);},
    uploadImage:src=>map803UploadImagem_(src,uploadMapId||'novo_mapa',cache,seq)
   });return {snapshot,publication};};
 const saveCurrent=async()=>{if(bridge.saving)return;setBusy(true);
  try{const {snapshot,publication}=await preparar(currentMapId);await onSave(publication);bridge.dirty=JSON.stringify(gm2.st)!==JSON.stringify(snapshot);bridge.updateStatus();notificar_(bridge.dirty?'Mapa atual salvo. Há novas edições no rascunho; salve novamente para compartilhá-las.':`Mapa atual “${currentMapName}” salvo e compartilhado.`,'sucesso',4000);}
  catch(e){notificar_('Não foi possível salvar o mapa atual: '+e.message,'erro',9000);}
  finally{setBusy(false);}
 };
 const uniqueId=name=>{let id=labMapaSlug_(name)||`mapa_${Date.now()}`,base=id,n=2;while((mapasDB||[]).some(m=>String(m.id)===String(id)))id=`${base}_${n++}`;return id;};
 saveAsBtn.onclick=async()=>{if(bridge.saving)return;let nome=prompt('Nome do novo mapa:',currentMapName?`${currentMapName} - cópia`:'Novo mapa');if(nome==null)return;nome=String(nome).trim();if(!nome){notificar_('Digite um nome para o novo mapa.','aviso');return;}const newId=uniqueId(nome);setBusy(true);
  try{const {publication}=await preparar(newId);const newScene=publicarOficina(scene,scene,publication);newScene.mapId=newId;const source=(mapasDB||[]).find(m=>String(m.id)===currentMapId)||map||{};const seed={...JSON.parse(JSON.stringify(source)),id:newId,nome,larguraM:Number(publication.config.w||map.larguraM||28),alturaM:Number(publication.config.h||map.alturaM||14),pxPorMetro:Number(publication.config.ppm||map.pxPorMetro||32),fundo:String(publication.config.bg||map.fundo||'#d7d7d7'),corGrade:String(publication.config.grid||map.corGrade||'#777777'),gradeVisivel:publication.config.showGrid!==false,textura:String(publication.config.texture||'nenhuma'),criadoPor:currentUserUid||'',atualizadoEm:new Date().toISOString()};delete seed.__local;const newMap=mapaComCenaOficina(seed,newScene);newMap.id=newId;newMap.nome=nome;newMap.atualizadoEm=new Date().toISOString();validarTamanhoOficina(newMap);await setDoc(doc(db,'mapas',newId),JSON.parse(JSON.stringify(newMap)),{merge:false});mapasDB.push(newMap);labMapaSelecionado_=newId;labAtualizarSelectMapas_();if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();
   bridge.dirty=false;bridge.updateStatus();notificar_(`Novo mapa “${nome}” criado. Abrindo a nova cópia…`,'sucesso',3500);window.novaOficinaFechar_?.();setTimeout(()=>novaSyncController_.openMap(newId).catch(e=>notificar_('O mapa foi criado, mas não foi possível abri-lo: '+e.message,'erro',7000)),0);
  }catch(e){console.error('Salvar como novo mapa',e);notificar_('Não foi possível criar o novo mapa: '+(e?.message||e),'erro',9000);}
  finally{setBusy(false);}
 };
 deleteBtn.onclick=async()=>{if(bridge.saving)return;const alvo=(mapasDB||[]).find(m=>String(m.id)===currentMapId);if(!alvo){notificar_('Este mapa não está registrado na biblioteca.','aviso');return;}const candidatos=(mapasDB||[]).filter(m=>String(m.id)!==currentMapId&&!m?.hiddenMesaLive&&!String(m?.id||'').startsWith('__mesa_live__'));if(!candidatos.length){notificar_('Este é o único mapa disponível. Crie ou abra outro mapa antes de excluí-lo.','aviso',5000);return;}const fallback=candidatos[0];if(!confirm(`Excluir permanentemente “${alvo.nome||alvo.id}”?\n\nA Mesa abrirá “${fallback.nome||fallback.id}” em seguida.${bridge.dirty?'\n\nAs alterações ainda não salvas deste mapa serão perdidas.':''}`))return;setBusy(true);
  try{window.novaOficinaFechar_?.();await window.excluirMapaBancoAdmin_(currentMapId);if((mapasDB||[]).some(m=>String(m.id)===currentMapId))throw new Error('O mapa não pôde ser removido da biblioteca.');await novaSyncController_.openMap(fallback.id);}
  catch(e){console.error('Excluir mapa pela Oficina',e);notificar_('Não foi possível excluir/trocar o mapa: '+(e?.message||e),'erro',8000);}
  finally{setBusy(false);}
 };
 const publish=document.getElementById('gm2publish');publish.onclick=saveCurrent;publish.title='Salvar alterações no mapa atualmente aberto e compartilhar com os jogadores.';publish.textContent='💾 Salvar mapa atual';
 const layers=document.createElement('div');layers.className='gm2-row';layers.innerHTML='<label>Nível no jogo <select id="gm2mesaLayer"><option value="1">1 · Terreno</option><option value="2">2 · Piso</option><option value="3">3 · Personagens e muros</option><option value="4">4 · Acima dos personagens</option></select></label><label><input id="gm2mesaBlock" type="checkbox"> Bloqueia movimento</label><label>Dureza <input id="gm2mesaHardness" type="number" min="0" step="1" value="0" style="width:64px"></label><label>PV <input id="gm2mesaPV" type="number" min="0" step="1" placeholder="0 = indestrutível" style="width:108px"></label><button id="gm2mesaApply">Aplicar</button><span>Edições locais. Use <b>Salvar mapa atual</b> para compartilhar.</span>';
 panel.querySelector('#gm2ribbon').append(layers);
 layers.querySelector('#gm2mesaApply').onclick=()=>{
  if(!gm2.selected.size){notificar_('Selecione uma forma ou objeto primeiro.','info');return;}
  const layer=Number(layers.querySelector('#gm2mesaLayer').value),block=layers.querySelector('#gm2mesaBlock').checked;
  const hardness=Math.max(0,Number(layers.querySelector('#gm2mesaHardness').value)||0);
  const pvRaw=String(layers.querySelector('#gm2mesaPV').value||'').trim(),pv=pvRaw===''?0:Math.max(0,Number(pvRaw)||0);
  gm2pushHistory();
  for(const e of gm2selectedEls()){
   e.camada=layer;e.bloqueiaMovimento=block;e.dureza=hardness;
   if(pv>0){e.pvMax=pv;e.pvAtual=pv;e.destrutivel=true;e.destruido=false;}
   else{e.pvMax=0;e.pvAtual=0;e.destrutivel=false;e.destruido=false;}
  }
  bridge.dirty=true;bridge.updateStatus();gm2saveLocal();gm2render();
 };
 gm2populateBank();gm2render();
 return {
  refresh(){const svg=document.getElementById('gm2svg');if(svg)bridge.paintTokens(svg);bridge.updateStatus();},
  addModels(models){
   const count=gm2addModelsAt_(models,{x:gm2.st.w/2,y:gm2.st.h/2});
   if(count){bridge.dirty=true;bridge.updateStatus();notificar_(`${count} objeto(s) adicionado(s) ao rascunho da Oficina. Salve o mapa para compartilhar.`,'info',3500);}
   return count;
  },
  getState:()=>gm2clone(gm2.st),get dirty(){return bridge.dirty;},get busy(){return !!bridge.saving;},
  close(){if(gm2MesaBridge_!==bridge)return;gm2MesaBridge_=null;layers.remove();saveAsBtn.remove();deleteBtn.remove();status.remove();if(embeddedBank)embeddedBank.style.display=embeddedBankDisplay;for(const item of saved){item.n.hidden=item.hidden;item.n.disabled=item.disabled;if('readOnly' in item.n)item.n.readOnly=item.readOnly;item.n.onclick=item.onclick;item.n.textContent=item.text;item.n.title=item.title;if(item.n.id==='gm2mapname')item.n.value=item.value;}marker.replaceWith(panel);panel.className=className;Object.assign(gm2,previous);gm2.renderQueued=false;gm2render();}
 };
};
window.novaOficinaElemento_=function(o,scene){
 const previous=gm2.st;try{
  const visual=hidratarReferenciasOficina({objects:[o]},{modelFor:novaOficinaModelo_}).objects[0]||o||{};
  const config=scene?.oficinaConfig||{w:28,h:14,ppm:32},p=Number(config.ppm)||32;gm2.st={...config,elements:[]};
  const raw=visual.oficinaElement||{};
  const bw=Math.max(.05,Number(visual.oficinaBounds?.w ?? raw.w ?? visual.larguraM ?? 1)||1),bh=Math.max(.05,Number(visual.oficinaBounds?.h ?? raw.h ?? visual.alturaM ?? 1)||1);
  const bx=Number.isFinite(Number(visual.oficinaBounds?.x))?Number(visual.oficinaBounds.x):(Number.isFinite(Number(raw.x))?Number(raw.x):(Number(visual.x||0)*(Number(config.w)||28)/28-bw/2));
  const by=Number.isFinite(Number(visual.oficinaBounds?.y))?Number(visual.oficinaBounds.y):(Number.isFinite(Number(raw.y))?Number(raw.y):(Number(visual.y||0)*(Number(config.h)||14)/14-bh/2));
  const b={x:bx,y:by,w:bw,h:bh};
  const e={...raw,id:raw.id||visual.mapObjectId||visual.id||('scene:'+Date.now()),type:raw.type||'object',x:b.x,y:b.y,w:b.w,h:b.h,src:String(raw.src||visual.imagem||''),rot:Number(raw.rot??visual.angulo??0)||0};
  if(!e.src&&visual.imagem)e.src=visual.imagem;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+[b.x*p,b.y*p,b.w*p,b.h*p].join(' ')+'" style="width:100%;height:100%;overflow:visible;pointer-events:none">'+gm2renderWithErasers_(e,scene?.oficinaErasers||[],(Number(config.w)||28)*p,(Number(config.h)||14)*p,p)+'</svg>';
 }catch(err){
  console.warn('[v80] Objeto da Oficina sem geometria completa; usando fallback visual.',err,o);
  const src=String(o?.imagem||novaOficinaModelo_(o)?.imagem||'');
  return src?'<img src="'+src.replace(/"/g,'&quot;')+'" alt="" style="width:100%;height:100%;object-fit:contain;pointer-events:none">':'';
 }finally{gm2.st=previous;}
};

window.gm2render=gm2render;
// v199 kit do mestre: handle para colocar peça programaticamente (debug/testes); devolve as formas colocadas.
window.gm2PecaColocar_=function(id,p,opts={}){if(opts.giro!==undefined)gm2.pecaGiro=Number(opts.giro)||0;if(opts.mat)gm2.pecaMat=String(opts.mat);gm2.stamp='peca:'+id;if(!gm2PecaAPI)return null;const antes=gm2.st.elements.length;gm2createPecaDrag(null,{x:Number(p?.x)||gm2.st.w/2,y:Number(p?.y)||gm2.st.h/2});return gm2.st.elements.slice(antes);};
window.gm2State_=()=>gm2.st;
// v194: essas três ficam presas na IIFE, mas js/app/20 e js/app/22 (fora da IIFE) as chamam pelo
// nome direto — como app.js é <script type="module">, nome bare não enxerga window. Exportar aqui
// e usar window.* nas partes de fora (sem isso, o plano B de salvar mapa grande quebrava com
// "map803EstadoSlim_ is not defined").
window.map803EstadoSlim_=map803EstadoSlim_;
window.map803LegacyRefs_=map803LegacyRefs_;
window.MAP803_REF_VERSION_=MAP803_REF_VERSION_;
setTimeout(gm2installTab,900);
})();


