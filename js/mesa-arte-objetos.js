// Mesa Estelar v107 — Arte dos objetos do mapa (vista de cima).
//
// Desenha objetos em SVG detalhado (relevo, grão de madeira, folhas, facetas),
// no mesmo universo visual das miniaturas. O resultado é rasterizado para WebP
// pelo navegador antes de ir para o Storage, então o mapa não paga o custo dos filtros.

export const VERSAO='v139';

// ---------------------------------------------------------------- utilidades
function hexRgb(h){const m=/^#?([0-9a-f]{6})$/i.exec(String(h||''));const n=m?parseInt(m[1],16):0x888888;return [(n>>16)&255,(n>>8)&255,n&255];}
function rgbHex(r,g,b){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
export function tom(h,f){const [r,g,b]=hexRgb(h);return f>=0?rgbHex(r+(255-r)*f,g+(255-g)*f,b+(255-b)*f):rgbHex(r*(1+f),g*(1+f),b*(1+f));}
function mix(a,b,t){const x=hexRgb(a),y=hexRgb(b);return rgbHex(x[0]+(y[0]-x[0])*t,x[1]+(y[1]-x[1])*t,x[2]+(y[2]-x[2])*t);}
const F=v=>Number(v.toFixed(1));
function rng(seed){let s=(seed>>>0)||1;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function hashTexto(t){let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;}

function tela(W,H,seed){
 const defs=[],partes=[],r=rng(seed);let n=0;
 const id=p=>p+(n++);
 const api={W,H,r,
  rr:(a,b)=>a+(b-a)*r(),
  add:s=>partes.push(s),
  def:s=>defs.push(s),
  // gradiente radial com luz vinda de cima/esquerda
  rad:(cor,{cx=38,cy=32,claro=.3,escuro=-.45}={})=>{const i=id('r');defs.push(`<radialGradient id="${i}" cx="${cx}%" cy="${cy}%" r="80%"><stop offset="0" stop-color="${tom(cor,claro)}"/><stop offset=".55" stop-color="${cor}"/><stop offset="1" stop-color="${tom(cor,escuro)}"/></radialGradient>`);return `url(#${i})`;},
  lin:(cores,ang=90)=>{const i=id('l');defs.push(`<linearGradient id="${i}" gradientTransform="rotate(${ang} .5 .5)">${cores.map((c,k)=>`<stop offset="${(k/(cores.length-1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`);return `url(#${i})`;},
  // relevo: textura com luz (pedra, casca, tecido, concreto)
  relevo:({freq=.035,oct=5,escala=3.2,tipo='fractalNoise',elev=48,semente}={})=>{const i=id('f');defs.push(`<filter id="${i}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feTurbulence type="${tipo}" baseFrequency="${freq}" numOctaves="${oct}" seed="${semente??Math.floor(r()*999)}" result="n"/><feDiffuseLighting in="n" surfaceScale="${escala}" lighting-color="#ffffff" result="l"><feDistantLight azimuth="225" elevation="${elev}"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0" result="m"/><feComposite in="m" in2="SourceAlpha" operator="in"/></filter>`);return `url(#${i})`;},
  // grão de madeira: ruído esticado numa direção
  grao:({ang=0,freqX=.012,freqY=.32,forca=.55,semente}={})=>{const i=id('g');defs.push(`<filter id="${i}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${freqX} ${freqY}" numOctaves="4" seed="${semente??Math.floor(r()*999)}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${forca*2.2} ${-forca*.9}" result="a"/><feComposite in="a" in2="SourceAlpha" operator="in" result="b"/><feFlood flood-color="#000" flood-opacity=".9" result="p"/><feComposite in="p" in2="b" operator="in" result="sombra"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sombra"/></feMerge></filter>`);return {url:`url(#${i})`,ang};},
  sombra:(dx=7,dy=9,b=7,op=.55)=>{const i=id('s');defs.push(`<filter id="${i}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="${b}"/><feOffset dx="${dx}" dy="${dy}" result="o"/><feComponentTransfer><feFuncA type="linear" slope="${op}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);return `url(#${i})`;},
  clip:(d)=>{const i=id('c');defs.push(`<clipPath id="${i}"><path d="${d}"/></clipPath>`);return `url(#${i})`;},
  svg:()=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs.join('')}<filter id="acab" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  .45 .45 .45 0 -.55" result="g"/><feComposite in="g" in2="SourceAlpha" operator="in" result="g2"/><feBlend in="SourceGraphic" in2="g2" mode="multiply"/></filter></defs><g filter="url(#acab)">${partes.join('')}</g></svg>`
 };
 return api;
}
// contorno irregular (pedras, copas)
function blob(cx,cy,rx,ry,r,{pontos=12,irreg=.18}={}){
 const p=[];for(let i=0;i<pontos;i++){const a=i/pontos*Math.PI*2,k=1-irreg/2+r()*irreg;p.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k]);}
 let d=`M${F((p[0][0]+p[pontos-1][0])/2)} ${F((p[0][1]+p[pontos-1][1])/2)}`;
 for(let i=0;i<pontos;i++){const a=p[i],b=p[(i+1)%pontos];d+=` Q${F(a[0])} ${F(a[1])} ${F((a[0]+b[0])/2)} ${F((a[1]+b[1])/2)}`;}
 return d+'Z';
}
function poligono(cx,cy,rx,ry,r,{pontos=9,irreg=.3}={}){
 const p=[];for(let i=0;i<pontos;i++){const a=(i+r()*.5)/pontos*Math.PI*2,k=1-irreg/2+r()*irreg;p.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k]);}
 return p;
}
const caminhoPts=p=>'M'+p.map(q=>F(q[0])+' '+F(q[1])).join(' L')+'Z';

// ---------------------------------------------------------------- natureza
function folha(t,x,y,ang,comp,larg,cor,{nervura=true,op=1}={}){
 const c=Math.cos(ang),s=Math.sin(ang),ex=x+c*comp,ey=y+s*comp,nx=-s*larg,ny=c*larg;
 const mx=x+c*comp*.45,my=y+s*comp*.45;
 t.add(`<path d="M${F(x)} ${F(y)} Q${F(mx+nx)} ${F(my+ny)} ${F(ex)} ${F(ey)} Q${F(mx-nx)} ${F(my-ny)} ${F(x)} ${F(y)}Z" fill="${cor}"${op<1?` opacity="${op}"`:''}/>`);
 if(nervura)t.add(`<path d="M${F(x)} ${F(y)} L${F(ex)} ${F(ey)}" stroke="${tom(cor,-.35)}" stroke-width="${F(Math.max(.6,larg*.12))}" opacity=".7"/>`);
}
function palmeira(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.48,n=o.folhas||(12+Math.floor(r()*4));
 const base=o.cor||'#4f7f2a',seca=o.seca??.25;
 const g=t.sombra(10,12,9,.5);t.add(`<g filter="${g}">`);
 const ordem=[...Array(n)].map((_,i)=>i).sort(()=>r()-.5);
 for(const i of ordem){
  const a=i/n*Math.PI*2+r()*.35,comp=R*(.78+r()*.24),curva=(r()-.5)*.5;
  const corF=mix(base,r()<seca?'#8a7a2e':tom(base,.12),r()*.6);
  const pts=[];for(let k=0;k<=36;k++){const u=k/36,aa=a+curva*u*u;pts.push([cx+Math.cos(aa)*comp*u,cy+Math.sin(aa)*comp*u,aa]);}
  for(let k=3;k<36;k++){const [x,y,aa]=pts[k],u=k/36,l=R*.36*Math.sin(Math.PI*Math.min(1,u*1.12))*(.7+r()*.3);
   for(const lado of [-1,1]){const ang=aa+lado*(1.0-u*.4)+(r()-.5)*.18;const ponta=u>.75&&r()<.4?mix(corF,'#a89a3a',.5):corF;folha(t,x,y,ang,l,l*.13,mix(ponta,tom(ponta,lado>0?-.3:.18),.4+r()*.6),{nervura:false});}}
  t.add(`<path d="M${pts.map(p=>F(p[0])+' '+F(p[1])).join(' L')}" fill="none" stroke="${tom(corF,-.2)}" stroke-width="${F(R*.022)}" stroke-linecap="round"/>`);
  t.add(`<path d="M${pts.map(p=>F(p[0])+' '+F(p[1])).join(' L')}" fill="none" stroke="#c9a65a" stroke-width="${F(R*.008)}" opacity=".6" stroke-linecap="round"/>`);
 }
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.09)}" fill="${t.rad('#6b4a2a')}"/>`);
 t.add('</g>');
}
function tufo(t,x,y,tr,cor,r){
 t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(tr)}" fill="${t.rad(cor,{cx:36,cy:30,claro:.3,escuro:-.45})}"/>`);
 const n=10+Math.floor(r()*5);
 for(let k=0;k<n;k++){const a=k/n*6.28+r()*.4,d=tr*(.55+r()*.35);folha(t,x+Math.cos(a)*d*.6,y+Math.sin(a)*d*.6,a+(r()-.5)*.6,tr*(.5+r()*.25),tr*.17,tom(cor,(((Math.cos(a)+Math.sin(a))<0)?.18:-.22)+(r()-.5)*.12),{nervura:false});}
 for(let k=0;k<4;k++){const a=r()*6.28,d=r()*tr*.4;folha(t,x+Math.cos(a)*d-tr*.15,y+Math.sin(a)*d-tr*.15,r()*6.28,tr*.35,tr*.12,tom(cor,.28),{nervura:false,op:.85});}
}
function copa(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.47;
 const base=o.cor||'#3f6f2c',neve=o.neve,flor=o.flor,sol=o.sol||'#d9e36a';
 const g=t.sombra(14,16,14,.6);t.add(`<g filter="${g}">`);
 if(o.galhos!==false)for(let i=0;i<9;i++){const a=r()*6.28,l=R*(.45+r()*.45);t.add(`<path d="M${F(cx)} ${F(cy)} Q${F(cx+Math.cos(a+.35)*l*.5)} ${F(cy+Math.sin(a+.35)*l*.5)} ${F(cx+Math.cos(a)*l)} ${F(cy+Math.sin(a)*l)}" stroke="#3a2a1a" stroke-width="${F(R*.028)}" fill="none" stroke-linecap="round"/>`);}
 // camadas: de baixo (escura, larga) para cima (clara, central); grade com variação = cobertura uniforme
 const camadas=[{esc:-.32,raio:1,tam:.2,passo:.2},{esc:-.12,raio:.9,tam:.17,passo:.18},{esc:.06,raio:.75,tam:.15,passo:.17},{esc:.2,raio:.55,tam:.13,passo:.16}];
 for(const c of camadas){
  const passo=R*c.passo,pts=[];
  for(let y=-R;y<=R;y+=passo)for(let x=-R;x<=R;x+=passo){const px=x+(r()-.5)*passo*.9,py=y+(r()-.5)*passo*.9;if(Math.hypot(px,py)<=R*c.raio*(.9+r()*.12))pts.push([cx+px,cy+py]);}
  pts.sort(()=>r()-.5);
  for(const [x,y] of pts){
   const luz=((cx-x)+(cy-y))/(2*R);
   let cor=tom(base,Math.max(-.45,Math.min(.45,c.esc+luz*.35+(r()-.5)*.12)));
   if(luz>.15&&c.esc>0)cor=mix(cor,sol,.18+r()*.12);
   tufo(t,x,y,R*c.tam*(.8+r()*.4),cor,r);
  }
 }
 if(flor)for(let i=0;i<80;i++){const a=r()*6.28,d=Math.sqrt(r())*R*.88,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d,fr=R*(.016+r()*.012);for(let k=0;k<5;k++){const aa=k/5*6.28;t.add(`<circle cx="${F(x+Math.cos(aa)*fr)}" cy="${F(y+Math.sin(aa)*fr)}" r="${F(fr*.8)}" fill="${tom(flor,(r()-.5)*.2)}"/>`);}t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(fr*.5)}" fill="#ffe36a"/>`);}
 if(neve)for(let i=0;i<70;i++){const a=r()*6.28,d=Math.sqrt(r())*R*.9,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d;t.add(`<path d="${blob(x-R*.02,y-R*.02,R*(.035+r()*.045),R*(.025+r()*.035),r,{pontos:7,irreg:.5})}" fill="${t.rad('#f4f8fb',{claro:.5,escuro:-.12})}" opacity=".95"/>`);}
 t.add('</g>');
}
function pinheiro(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.47,base=o.cor||'#2f5a3a';
 const g=t.sombra(12,14,10,.55);t.add(`<g filter="${g}">`);
 for(let anel=0;anel<5;anel++){const rr=R*(1-anel*.18),n=22-anel*3;
  for(let i=0;i<n;i++){const a=i/n*6.28+anel*.3+r()*.1;const cor=tom(base,-.25+anel*.12+(r()-.5)*.08);
   for(let k=0;k<5;k++)folha(t,cx,cy,a+(k-2)*.06,rr*(.92+r()*.1),rr*.035,cor,{nervura:false});}}
 if(o.neve)for(let i=0;i<26;i++){const a=r()*6.28,d=R*(.2+r()*.65);t.add(`<ellipse cx="${F(cx+Math.cos(a)*d)}" cy="${F(cy+Math.sin(a)*d)}" rx="${F(R*.06)}" ry="${F(R*.035)}" transform="rotate(${F(a*57.3)} ${F(cx+Math.cos(a)*d)} ${F(cy+Math.sin(a)*d)})" fill="#f4f8fb" opacity=".92"/>`);}
 t.add('</g>');
}
function arbusto(t,o={}){copa(t,{cor:o.cor||'#4a7f32',tufos:16,galhos:false,flor:o.flor});}
function folhaMonstera(t,x,y,ang,L,cor){
 const c=Math.cos(ang),sn=Math.sin(ang),P=(u,v)=>[x+c*u-sn*v,y+sn*u+c*v];
 const pts=[];for(let k=0;k<=24;k++){const a=k/24*Math.PI*2;let rr=L*(.5+.12*Math.cos(a));const da=Math.abs(((a+Math.PI)%(2*Math.PI))-Math.PI);if(Math.PI-da<.5)rr*=.55+ (Math.PI-da)*.9;pts.push(P(L*.5+Math.cos(a)*rr,Math.sin(a)*rr*.9));}
 const d='M'+pts.map(p=>F(p[0])+' '+F(p[1])).join(' L')+'Z';
 t.add(`<path d="${d}" fill="${t.rad(cor,{cx:40,cy:35,claro:.22,escuro:-.4})}" stroke="${tom(cor,-.55)}" stroke-width="1.4"/>`);
 const [a0,b0]=P(0,0),[a1,b1]=P(L,0);
 t.add(`<path d="M${F(a0)} ${F(b0)} L${F(a1)} ${F(b1)}" stroke="${tom(cor,.35)}" stroke-width="${F(L*.035)}"/>`);
 for(let k=1;k<6;k++)for(const s2 of [-1,1]){const u=L*(.15+k*.14),[p1,q1]=P(u,s2*L*.05),[p2,q2]=P(u+L*.12,s2*L*(.3+.05*(k%2)));const [p3,q3]=P(u+L*.16,s2*L*.33);
  t.add(`<path d="M${F(p1)} ${F(q1)} Q${F(p2)} ${F(q2)} ${F(p3)} ${F(q3)}" stroke="${tom(cor,-.15)}" stroke-width="1.1" fill="none" opacity=".8"/>`);
  if(k%2||k===4){const [p4,q4]=P(u+L*.15,s2*L*.33);t.add(`<path d="M${F(p2)} ${F(q2)} L${F(p4)} ${F(q4)}" stroke="#3c4a40" stroke-width="${F(L*.05)}" stroke-linecap="round"/>`);}}
}
function plantaVaso(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.47;
 const g=t.sombra(9,11,8,.55);t.add(`<g filter="${g}">`);
 if(o.vaso!==false){t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.36)}" fill="${t.rad(o.corVaso||'#9a5e3a')}" stroke="#3a2010" stroke-width="2"/>`);t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.29)}" fill="${t.rad('#3a2a1e',{claro:-.1})}" filter="${t.relevo({freq:.2,oct:3,escala:2})}"/>`);}
 const base=o.cor||'#2f7a3a',n=o.folhas||12;
 // folhas largas e pontudas (tipo planta de interior), em duas camadas
 for(let camada=0;camada<2;camada++)for(let i=0;i<n;i++){
  const a=i/n*6.28+camada*.26+(r()-.5)*.3,L=R*(camada?.62:.95)*(.8+r()*.25),wd=L*.2;
  const c=tom(base,(camada?.15:-.12)+(r()-.5)*.15);
  const x0=cx+Math.cos(a)*R*.05,y0=cy+Math.sin(a)*R*.05,ex=cx+Math.cos(a)*L,ey=cy+Math.sin(a)*L,nx=-Math.sin(a)*wd,ny=Math.cos(a)*wd,mx=cx+Math.cos(a)*L*.55,my=cy+Math.sin(a)*L*.55;
  t.add(`<path d="M${F(x0)} ${F(y0)} C${F(mx+nx)} ${F(my+ny)} ${F(ex+nx*.3)} ${F(ey+ny*.3)} ${F(ex)} ${F(ey)} C${F(ex-nx*.3)} ${F(ey-ny*.3)} ${F(mx-nx)} ${F(my-ny)} ${F(x0)} ${F(y0)}Z" fill="${t.rad(c,{cx:40,cy:35,claro:.25,escuro:-.35})}" stroke="${tom(c,-.5)}" stroke-width="1.1"/>`);
  t.add(`<path d="M${F(x0)} ${F(y0)} Q${F(mx)} ${F(my)} ${F(ex)} ${F(ey)}" stroke="${tom(c,.35)}" stroke-width="1.4" fill="none" opacity=".8"/>`);
  for(let k=1;k<5;k++){const u=k/5,px=x0+(ex-x0)*u,py=y0+(ey-y0)*u;for(const sg of [-1,1])t.add(`<path d="M${F(px)} ${F(py)} l${F(nx*sg*.6*(1-u*.6)+Math.cos(a)*wd*.4)} ${F(ny*sg*.6*(1-u*.6)+Math.sin(a)*wd*.4)}" stroke="${tom(c,-.25)}" stroke-width=".9" opacity=".6"/>`);}
 }
 t.add('</g>');
}
function pedra(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,rx=W*.46,ry=H*.44,cor=o.cor||'#7a7670';
 const pts=poligono(cx,cy,rx,ry,r,{pontos:o.pontos||10,irreg:.3});
 const g=t.sombra(10,12,8,.55);t.add(`<g filter="${g}">`);
 t.add(`<path d="${caminhoPts(pts)}" fill="${cor}" filter="${t.relevo({freq:o.freq||.03,escala:4})}"/>`);
 // facetas: triângulos do centro (deslocado para a luz) até a borda
 const fx=cx-rx*.12+(r()-.5)*rx*.15,fy=cy-ry*.12+(r()-.5)*ry*.15;
 for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];const mx=(a[0]+b[0])/2-cx,my=(a[1]+b[1])/2-cy;const luz=(-mx-my)/(rx+ry);
  t.add(`<path d="M${F(fx)} ${F(fy)} L${F(a[0])} ${F(a[1])} L${F(b[0])} ${F(b[1])}Z" fill="${luz>0?'#fff':'#000'}" opacity="${F(Math.min(.38,Math.abs(luz)*.55))}"/>`);
  t.add(`<path d="M${F(fx)} ${F(fy)} L${F(a[0])} ${F(a[1])}" stroke="#000" stroke-width="1.2" opacity=".18"/>`);}
 t.add(`<path d="${caminhoPts(pts)}" fill="none" stroke="${tom(cor,-.55)}" stroke-width="2.4" opacity=".7"/>`);
 if(o.musgo)for(let i=0;i<22;i++){const a=r()*6.28,d=Math.sqrt(r())*.75;const x=cx+Math.cos(a)*rx*d-rx*.1,y=cy+Math.sin(a)*ry*d-ry*.1;t.add(`<path d="${blob(x,y,rx*(.06+r()*.1),ry*(.05+r()*.08),r,{pontos:8,irreg:.5})}" fill="${tom(o.musgo,(r()-.5)*.3)}" opacity=".85"/>`);}
 if(o.rachaduras!==false)for(let i=0;i<3;i++){let x=cx+(r()-.5)*rx,y=cy+(r()-.5)*ry,d=`M${F(x)} ${F(y)}`;for(let k=0;k<4;k++){x+=(r()-.5)*rx*.3;y+=(r()-.5)*ry*.3;d+=` L${F(x)} ${F(y)}`;}t.add(`<path d="${d}" stroke="#1a1a1a" stroke-width="1.6" fill="none" opacity=".45"/>`);}
 t.add('</g>');
}
function cristal(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.46;
 const cores=o.cores||['#ff6ad5','#7a5cff','#3fd0ff','#7fffd4','#ffe36a'];
 const g=t.sombra(10,12,10,.5);t.add(`<g filter="${g}">`);
 // base rochosa
 t.add(`<path d="${blob(cx,cy+R*.05,R*.55,R*.45,r,{pontos:11,irreg:.3})}" fill="#4a4652" filter="${t.relevo({freq:.06,escala:3})}"/>`);
 const n=o.n||7;
 const prismas=[...Array(n)].map((_,i)=>({a:-Math.PI/2+(i/(n-1)-.5)*2.6+(r()-.5)*.3,l:R*(.55+r()*.45),w:R*(.13+r()*.08)})).sort((p,q)=>q.l-p.l);
 for(const [k,p] of prismas.entries()){
  const c=Math.cos(p.a),sn=Math.sin(p.a),P=(u,v)=>[cx+c*u-sn*v,cy+sn*u+c*v];
  const pts=[P(-p.w*.2,-p.w),P(p.l*.82,-p.w),P(p.l,0),P(p.l*.82,p.w),P(-p.w*.2,p.w)];
  const c1=cores[k%cores.length],c2=cores[(k+1)%cores.length];
  const gr=t.lin([tom(c1,-.25),c1,tom(c2,.25)],F(p.a*57.3));
  t.add(`<path d="${caminhoPts(pts)}" fill="${gr}" opacity=".93" stroke="${tom(c1,-.45)}" stroke-width="1.6"/>`);
  t.add(`<path d="${caminhoPts([P(-p.w*.2,0),P(p.l,0),P(p.l*.82,p.w),P(-p.w*.2,p.w)])}" fill="#140a2a" opacity=".28"/>`);
  t.add(`<path d="M${F(P(-p.w*.2,0)[0])} ${F(P(-p.w*.2,0)[1])} L${F(P(p.l,0)[0])} ${F(P(p.l,0)[1])}" stroke="#fff" stroke-width="2" opacity=".75"/>`);
  t.add(`<path d="M${F(P(p.l*.1,-p.w*.6)[0])} ${F(P(p.l*.1,-p.w*.6)[1])} L${F(P(p.l*.7,-p.w*.6)[0])} ${F(P(p.l*.7,-p.w*.6)[1])}" stroke="#fff" stroke-width="1.2" opacity=".45"/>`);
 }
 const i='cg'+Math.floor(r()*1e6);t.def(`<radialGradient id="${i}"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="${cores[1]}" stop-opacity="0"/></radialGradient>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy-R*.1)}" r="${F(R*.55)}" fill="url(#${i})"/>`);
 t.add('</g>');
}
function tronco(t,o={}){
 const {W,H,r}=t,horiz=W>=H,L=horiz?W:H,E=horiz?H:W;
 const rot=horiz?'':`transform="rotate(90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})"`;
 const comp=L*.94,esp=Math.min(E*.62,L*.22),x0=(L-comp)/2,y0=(E-esp)/2,cor=o.cor||'#6a4a30';
 const g=t.sombra(9,11,8,.55),gr=t.grao({freqX:.008,freqY:.18,forca:.6});
 t.add(`<g filter="${g}" ${rot}>`);
 t.add(`<rect x="${F(x0)}" y="${F(y0)}" width="${F(comp)}" height="${F(esp)}" rx="${F(esp*.45)}" fill="${t.lin([tom(cor,-.35),tom(cor,.15),cor,tom(cor,-.4)],90)}" filter="${gr.url}"/>`);
 for(let i=0;i<4;i++){const x=x0+comp*(.15+r()*.7);t.add(`<ellipse cx="${F(x)}" cy="${F(y0+esp*(.3+r()*.4))}" rx="${F(esp*.08)}" ry="${F(esp*.06)}" fill="#3a2818"/>`);}
 t.add(`<ellipse cx="${F(x0+comp-esp*.18)}" cy="${F(E/2)}" rx="${F(esp*.2)}" ry="${F(esp*.48)}" fill="${t.rad('#c9a06a',{cx:50,cy:50,claro:.1,escuro:-.3})}" stroke="#4a3220" stroke-width="2"/>`);
 for(let k=1;k<4;k++)t.add(`<ellipse cx="${F(x0+comp-esp*.18)}" cy="${F(E/2)}" rx="${F(esp*.2*k/4)}" ry="${F(esp*.48*k/4)}" fill="none" stroke="#8a6a40" stroke-width="1.2"/>`);
 if(o.musgo)for(let i=0;i<16;i++){const x=x0+comp*(.05+r()*.8),y=y0+esp*(.1+r()*.5);t.add(`<path d="${blob(x,y,esp*(.08+r()*.12),esp*(.06+r()*.08),r,{pontos:7,irreg:.5})}" fill="${tom('#5f8a32',(r()-.5)*.3)}" opacity=".9"/>`);}
 if(o.folhas)for(let i=0;i<14;i++){const x=x0+comp*(.1+r()*.75),y=y0-esp*.1+r()*esp*.4;folha(t,x,y,-1.2-r()*1.4,esp*(.35+r()*.3),esp*.07,tom('#5a8a3a',(r()-.5)*.3));}
 t.add('</g>');
}
function toco(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.45;
 const g=t.sombra(8,10,8,.55);t.add(`<g filter="${g}">`);
 t.add(`<path d="${blob(cx,cy,R,R*.96,r,{pontos:16,irreg:.08})}" fill="${t.rad('#5a3a22')}" filter="${t.relevo({freq:.08,escala:2.5})}"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.86)}" fill="${t.rad('#d9b07a',{cx:50,cy:50,claro:.12,escuro:-.25})}"/>`);
 for(let k=1;k<12;k++)t.add(`<path d="${blob(cx+(r()-.5)*2,cy+(r()-.5)*2,R*.84*k/12,R*.82*k/12,r,{pontos:14,irreg:.05})}" fill="none" stroke="#8a5e34" stroke-width="${F(1+r()*1.6)}" opacity=".75"/>`);
 for(let i=0;i<3;i++){const a=r()*6.28;t.add(`<path d="M${F(cx+Math.cos(a)*R*.1)} ${F(cy+Math.sin(a)*R*.1)} L${F(cx+Math.cos(a)*R*.8)} ${F(cy+Math.sin(a)*R*.8)}" stroke="#4a2e18" stroke-width="2" opacity=".6"/>`);}
 t.add('</g>');
}
function galho(t,o={}){
 const {W,H,r}=t,cor=o.cor||'#7a5a3a';
 const g=t.sombra(7,9,6,.5);t.add(`<g filter="${g}">`);
 const ramo=(x,y,a,l,w,nivel)=>{const ex=x+Math.cos(a)*l,ey=y+Math.sin(a)*l,mx=x+Math.cos(a+.25)*l*.5,my=y+Math.sin(a+.25)*l*.5;
  t.add(`<path d="M${F(x)} ${F(y)} Q${F(mx)} ${F(my)} ${F(ex)} ${F(ey)}" stroke="${tom(cor,-.45)}" stroke-width="${F(w+3)}" fill="none" stroke-linecap="round"/>`);
  t.add(`<path d="M${F(x)} ${F(y)} Q${F(mx)} ${F(my)} ${F(ex)} ${F(ey)}" stroke="${t.lin([tom(cor,-.2),tom(cor,.25)],90)}" stroke-width="${F(w)}" fill="none" stroke-linecap="round"/>`);
  if(o.folhas&&nivel>=1)for(let i=0;i<5;i++){const u=.4+r()*.6;folha(t,x+(ex-x)*u,y+(ey-y)*u,a+(r()-.5)*2.4,w*3+r()*w*2,w*.6,tom('#6f9a3a',(r()-.5)*.3));}
  if(nivel<3)for(let i=0;i<2;i++)ramo(ex-Math.cos(a)*l*.3*i,ey-Math.sin(a)*l*.3*i,a+(r()-.5)*1.4,l*(.45+r()*.2),w*.6,nivel+1);};
 const horiz=W>=H;ramo(horiz?W*.06:W*.5,horiz?H*.55:H*.94,horiz?-.05:-1.6,(horiz?W:H)*.6,Math.min(W,H)*.06,0);
 t.add('</g>');
}
// ---------------------------------------------------------------- madeira e móveis
function caixote(t,o={}){
 const {W,H,r}=t,m=Math.min(W,H)*.06,cor=o.cor||'#a8783e';
 const g=t.sombra(8,10,7,.55),gr=t.grao({freqX:.01,freqY:.4,forca:.5});
 t.add(`<g filter="${g}">`);
 t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" fill="${tom(cor,-.1)}" stroke="#3a2614" stroke-width="3"/>`);
 const tabuas=5;for(let i=0;i<tabuas;i++){const y=m+(H-2*m)*i/tabuas;t.add(`<rect x="${F(m)}" y="${F(y)}" width="${F(W-2*m)}" height="${F((H-2*m)/tabuas)}" fill="${tom(cor,(r()-.5)*.25)}" stroke="#4a3018" stroke-width="1.5" filter="${gr.url}"/>`);}
 const b=Math.min(W,H)*.12;
 t.add(`<path d="M${F(m)} ${F(m)} h${F(W-2*m)} v${F(H-2*m)} h${F(-(W-2*m))}Z M${F(m+b)} ${F(m+b)} v${F(H-2*m-2*b)} h${F(W-2*m-2*b)} v${F(-(H-2*m-2*b))}Z" fill="${tom(cor,-.05)}" fill-rule="evenodd" stroke="#3a2614" stroke-width="2" filter="${gr.url}"/>`);
 if(o.x!==false)t.add(`<path d="M${F(m+b)} ${F(m+b)} L${F(W-m-b)} ${F(H-m-b)} M${F(W-m-b)} ${F(m+b)} L${F(m+b)} ${F(H-m-b)}" stroke="${tom(cor,-.15)}" stroke-width="${F(b*.8)}" stroke-linecap="square"/><path d="M${F(m+b)} ${F(m+b)} L${F(W-m-b)} ${F(H-m-b)} M${F(W-m-b)} ${F(m+b)} L${F(m+b)} ${F(H-m-b)}" stroke="#3a2614" stroke-width="1.2" opacity=".6"/>`);
 for(const [x,y] of [[m+b/2,m+b/2],[W-m-b/2,m+b/2],[m+b/2,H-m-b/2],[W-m-b/2,H-m-b/2]])t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(b*.13)}" fill="#2a2a2a"/>`);
 t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" fill="${t.rad('#ffffff',{claro:0,escuro:0})}" opacity=".0"/>`);
 t.add('</g>');
}
function barril(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.44,cor=o.cor||'#8a5a32';
 const g=t.sombra(8,10,7,.55);t.add(`<g filter="${g}">`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${t.rad(cor)}"/>`);
 for(let i=0;i<14;i++){const a=i/14*6.28;t.add(`<path d="M${F(cx)} ${F(cy)} L${F(cx+Math.cos(a)*R)} ${F(cy+Math.sin(a)*R)}" stroke="#3a2412" stroke-width="1.2" opacity=".5"/>`);}
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.93)}" fill="none" stroke="#5a5e66" stroke-width="${F(R*.07)}"/><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.5)}" fill="none" stroke="#5a5e66" stroke-width="${F(R*.05)}"/>`);
 t.add(`<circle cx="${F(cx+R*.28)}" cy="${F(cy+R*.1)}" r="${F(R*.09)}" fill="#2a1a10"/>`);
 t.add('</g>');
}
function mesaRedonda(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.45,cor=o.cor||'#8a5a34';
 const g=t.sombra(9,11,9,.55),gr=t.grao({freqX:.006,freqY:.25,forca:.45});
 t.add(`<g filter="${g}">`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${tom(cor,-.35)}"/>`);
 if(o.radial){for(let i=0;i<12;i++){const a=i/12*6.28,b=(i+1)/12*6.28;t.add(`<path d="M${F(cx)} ${F(cy)} L${F(cx+Math.cos(a)*R*.95)} ${F(cy+Math.sin(a)*R*.95)} A${F(R*.95)} ${F(R*.95)} 0 0 1 ${F(cx+Math.cos(b)*R*.95)} ${F(cy+Math.sin(b)*R*.95)}Z" fill="${tom(cor,i%2?.08:-.08)}" stroke="#3a2412" stroke-width=".8" filter="${gr.url}" transform="rotate(0)"/>`);}}
 else t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.95)}" fill="${cor}" filter="${gr.url}"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.95)}" fill="${t.rad('#ffffff',{cx:35,cy:30,claro:0,escuro:0})}" opacity=".12"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.95)}" fill="none" stroke="${tom(cor,-.5)}" stroke-width="2.5"/>`);
 t.add(`<ellipse cx="${F(cx-R*.35)}" cy="${F(cy-R*.4)}" rx="${F(R*.35)}" ry="${F(R*.12)}" fill="#fff" opacity=".1" transform="rotate(-30 ${F(cx)} ${F(cy)})"/>`);
 t.add('</g>');
}
function cadeira(t,o={},x0=0,y0=0,esc=1,ang=0){
 const {W,H}=t,w=(o.w||W)*esc,h=(o.h||H)*esc,cx=x0||W/2,cy=y0||H/2;
 const cor=o.cor||'#7a5232',assento=o.assento||tom(cor,.05);
 const gr=t.grao({freqX:.02,freqY:.35,forca:.45});
 t.add(`<g transform="rotate(${ang} ${F(cx)} ${F(cy)})" filter="${t.sombra(5,7,5,.5)}">`);
 // armação de madeira
 t.add(`<rect x="${F(cx-w*.4)}" y="${F(cy-h*.3)}" width="${F(w*.8)}" height="${F(h*.72)}" rx="${F(w*.08)}" fill="${cor}" stroke="${tom(cor,-.55)}" stroke-width="2" filter="${gr.url}"/>`);
 // assento estofado com capitonê
 t.add(`<rect x="${F(cx-w*.32)}" y="${F(cy-h*.2)}" width="${F(w*.64)}" height="${F(h*.55)}" rx="${F(w*.12)}" fill="${t.rad(assento,{claro:.25})}" stroke="${tom(assento,-.5)}" stroke-width="1.6" filter="${t.relevo({freq:.5,oct:2,escala:1,elev:62})}"/>`);
 for(const [a,b] of [[-.12,-.02],[.12,-.02],[0,.14],[-.12,.28],[.12,.28]])t.add(`<circle cx="${F(cx+a*w)}" cy="${F(cy+b*h)}" r="${F(w*.018)}" fill="${tom(assento,-.5)}"/>`);
 // encosto curvo com travessas
 const arco=`M${F(cx-w*.44)} ${F(cy-h*.16)} Q${F(cx-w*.46)} ${F(cy-h*.46)} ${F(cx)} ${F(cy-h*.47)} Q${F(cx+w*.46)} ${F(cy-h*.46)} ${F(cx+w*.44)} ${F(cy-h*.16)}`;
 t.add(`<path d="${arco}" stroke="${tom(cor,-.55)}" stroke-width="${F(w*.13)}" fill="none" stroke-linecap="round"/><path d="${arco}" stroke="${tom(cor,.05)}" stroke-width="${F(w*.1)}" fill="none" stroke-linecap="round"/><path d="${arco}" stroke="${tom(cor,.35)}" stroke-width="${F(w*.025)}" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-1 -2)"/>`);
 for(const a of [-.2,0,.2])t.add(`<path d="M${F(cx+a*w)} ${F(cy-h*.44)} V${F(cy-h*.3)}" stroke="${tom(cor,-.3)}" stroke-width="${F(w*.04)}"/>`);
 t.add('</g>');
}
function mesaRetangular(t,o={}){
 const {W,H}=t,cor=o.cor||'#7a5232';
 const cad=o.cadeiras,mx=cad?W*.16:W*.05,my=cad?H*.2:H*.08;
 if(cad){const n=Math.max(1,Math.round((W-2*mx)/(H*.5)));for(let i=0;i<n;i++){const x=mx+(W-2*mx)*(i+.5)/n;cadeira(t,{cor:o.corCadeira||'#2a2a30',assento:o.corAssento||'#3a3a44',w:H*.32,h:H*.32},x,my*.95,1,0);cadeira(t,{cor:o.corCadeira||'#2a2a30',assento:o.corAssento||'#3a3a44',w:H*.32,h:H*.32},x,H-my*.95,1,180);}
  cadeira(t,{cor:o.corCadeira||'#2a2a30',assento:o.corAssento||'#3a3a44',w:H*.32,h:H*.32},mx*.55,H/2,1,-90);cadeira(t,{cor:o.corCadeira||'#2a2a30',assento:o.corAssento||'#3a3a44',w:H*.32,h:H*.32},W-mx*.55,H/2,1,90);}
 const gr=t.grao({freqX:.005,freqY:.3,forca:.5});
 t.add(`<g filter="${t.sombra(9,11,8,.55)}"><rect x="${F(mx)}" y="${F(my)}" width="${F(W-2*mx)}" height="${F(H-2*my)}" rx="6" fill="${cor}" filter="${gr.url}" stroke="${tom(cor,-.55)}" stroke-width="3"/>`);
 for(let i=1;i<4;i++)t.add(`<path d="M${F(mx)} ${F(my+(H-2*my)*i/4)} h${F(W-2*mx)}" stroke="${tom(cor,-.4)}" stroke-width="1.2" opacity=".6"/>`);
 t.add(`<rect x="${F(mx)}" y="${F(my)}" width="${F(W-2*mx)}" height="${F(H-2*my)}" rx="6" fill="${t.lin(['#ffffff','#ffffff00'],45)}" opacity=".12"/></g>`);
}
function balcao(t,o={}){
 const {W,H,r}=t,cor=o.cor||'#5a3a24',p=Math.min(W,H)*.28;
 const gr=t.grao({freqX:.006,freqY:.3,forca:.5});
 const d=`M${F(W*.05)} ${F(H*.08)} H${F(W*.95)} V${F(H*.08+p)} H${F(W*.05+p)} V${F(H*.95)} H${F(W*.05)}Z`;
 t.add(`<g filter="${t.sombra(9,11,8,.55)}"><path d="${d}" fill="${cor}" filter="${gr.url}" stroke="${tom(cor,-.55)}" stroke-width="3"/>`);
 t.add(`<path d="${d}" fill="none" stroke="#c9a05a" stroke-width="2" opacity=".5" transform="translate(4 4) scale(.985)"/>`);
 for(let i=0;i<6;i++){const x=W*(.25+i*.12),y=H*.08+p*.5;t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(p*.13)}" fill="${['#c9a63a','#7fbf5a','#d9d0c0','#a83a3a'][i%4]}" stroke="#222" stroke-width="1.2"/>`);}
 t.add('</g>');
 for(let i=0;i<4;i++){const x=W*(.3+i*.16),y=H*.08+p+p*.45;t.add(`<g filter="${t.sombra(4,6,4,.5)}"><circle cx="${F(x)}" cy="${F(y)}" r="${F(p*.28)}" fill="${t.rad('#7a2a2a')}" stroke="#2a1010" stroke-width="2"/></g>`);}
}
function estofado(t,o={}){
 // sofá reto ou em L; poltrona; pufe
 const {W,H,r}=t,cor=o.cor||'#a83232',L=o.L,m=Math.min(W,H)*.06;
 const enc=Math.min(W,H)*(o.poltrona?.22:.26);
 const g=t.sombra(9,11,8,.55),tex=t.relevo({freq:.22,oct:2,escala:.7,elev:65});
 t.add(`<g filter="${g}">`);
 const corpo=L?`M${F(m)} ${F(m)} H${F(W-m)} V${F(m+enc*2.1)} H${F(m+enc*2.1)} V${F(H-m)} H${F(m)}Z`:`M${F(m)} ${F(m)} H${F(W-m)} V${F(H-m)} H${F(m)}Z`;
 t.add(`<path d="${corpo}" fill="${tom(cor,-.25)}" stroke="${tom(cor,-.6)}" stroke-width="3" stroke-linejoin="round" filter="${tex}"/>`);
 // encosto (fundo) e braços
 if(L){t.add(`<path d="M${F(m)} ${F(m)} H${F(W-m)} V${F(m+enc*.8)} H${F(m+enc*.8)} V${F(H-m)} H${F(m)}Z" fill="${t.rad(tom(cor,-.1))}" stroke="${tom(cor,-.55)}" stroke-width="2" filter="${tex}"/>`);}
 else{t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(enc*.8)}" rx="${F(enc*.3)}" fill="${t.rad(tom(cor,-.1))}" stroke="${tom(cor,-.55)}" stroke-width="2" filter="${tex}"/>`);
  for(const x of [m,W-m-enc*.7])t.add(`<rect x="${F(x)}" y="${F(m)}" width="${F(enc*.7)}" height="${F(H-2*m)}" rx="${F(enc*.3)}" fill="${t.rad(tom(cor,-.05))}" stroke="${tom(cor,-.55)}" stroke-width="2" filter="${tex}"/>`);}
 // almofadas do assento
 const almofada=(x,y,w,h)=>{t.add(`<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" rx="${F(Math.min(w,h)*.22)}" fill="${t.rad(cor,{claro:.22})}" stroke="${tom(cor,-.5)}" stroke-width="1.8" filter="${tex}"/>`);t.add(`<path d="M${F(x+w*.15)} ${F(y+h*.5)} h${F(w*.7)}" stroke="${tom(cor,-.3)}" stroke-width="1" opacity=".4"/>`);};
 if(L){const n=Math.max(1,Math.round((W-m-(m+enc*.8))/(enc*1.4)));for(let i=0;i<n;i++){const x=m+enc*.8+(W-2*m-enc*.8)*i/n;almofada(x+3,m+enc*.8+3,(W-2*m-enc*.8)/n-6,enc*1.25);}
  const n2=Math.max(1,Math.round((H-m-(m+enc*2.1))/(enc*1.4)));for(let i=0;i<n2;i++){const y=m+enc*2.1+(H-2*m-enc*2.1)*i/n2;almofada(m+enc*.8+3,y+3,enc*1.25,(H-m-enc*2.1-m)/n2-6);}}
 else{const x0=m+enc*.7,x1=W-m-enc*.7,n=o.poltrona?1:Math.max(1,Math.round((x1-x0)/(enc*1.5)));for(let i=0;i<n;i++)almofada(x0+(x1-x0)*i/n+3,m+enc*.8+3,(x1-x0)/n-6,H-2*m-enc*.8-6);}
 if(o.almofadas)for(let i=0;i<o.almofadas;i++){const x=m+enc*.9+r()*(W-2*m-enc*1.8),y=m+enc*.5+r()*enc*.6,c=o.almofadas_cores?.[i%o.almofadas_cores.length]||tom(cor,.3);t.add(`<rect x="${F(x)}" y="${F(y)}" width="${F(enc*.7)}" height="${F(enc*.55)}" rx="${F(enc*.15)}" fill="${t.rad(c)}" stroke="#2a2020" stroke-width="1.5" transform="rotate(${F((r()-.5)*40)} ${F(x+enc*.35)} ${F(y+enc*.27)})"/>`);}
 t.add('</g>');
}
function ninhoAlmofadas(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.46;const cores=o.cores||['#c9452a','#2a5aa8','#d9a63a','#7a2a6a','#2a8a7a'];
 t.add(`<g filter="${t.sombra(8,10,8,.55)}">`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${t.rad('#3a3a8a')}"/>`);
 for(let k=0;k<10;k++){const a=k/10*6.28,c=cores[k%cores.length];t.add(`<ellipse cx="${F(cx+Math.cos(a)*R*.72)}" cy="${F(cy+Math.sin(a)*R*.72)}" rx="${F(R*.24)}" ry="${F(R*.18)}" fill="${t.rad(c)}" stroke="#1a1010" stroke-width="1.6" transform="rotate(${F(a*57.3+90)} ${F(cx+Math.cos(a)*R*.72)} ${F(cy+Math.sin(a)*R*.72)})"/>`);}
 for(let k=0;k<5;k++){const a=k/5*6.28+.3,c=cores[(k+2)%cores.length];t.add(`<ellipse cx="${F(cx+Math.cos(a)*R*.35)}" cy="${F(cy+Math.sin(a)*R*.35)}" rx="${F(R*.2)}" ry="${F(R*.16)}" fill="${t.rad(c)}" stroke="#1a1010" stroke-width="1.4"/>`);}
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.18)}" fill="${t.rad('#d9a63a')}" stroke="#3a2010" stroke-width="2"/>`);
 for(let i=0;i<8;i++){const a=i/8*6.28;t.add(`<circle cx="${F(cx+Math.cos(a)*R*.1)}" cy="${F(cy+Math.sin(a)*R*.1)}" r="${F(R*.025)}" fill="#7a2a2a"/>`);}
 t.add('</g>');
}
function cama(t,o={}){
 const {W,H,r}=t,colcha=o.colcha||'#c9b48f',lencol=o.lencol||'#eeeae0',madeira=o.madeira||'#6a4a2e';
 const vert=H>W,cab=vert?H*.1:W*.1;
 const rot=vert?'':`transform="rotate(-90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})"`;
 const w=vert?W:H,h=vert?H:W;
 t.add(`<g filter="${t.sombra(9,11,8,.55)}" ${rot}>`);
 t.add(`<rect x="${F(w*.04)}" y="${F(h*.02)}" width="${F(w*.92)}" height="${F(h*.96)}" rx="6" fill="${t.rad(madeira)}" stroke="#2a1a0e" stroke-width="2"/>`);
 t.add(`<rect x="${F(w*.08)}" y="${F(cab)}" width="${F(w*.84)}" height="${F(h*.86)}" rx="8" fill="${lencol}" stroke="#9a948a" stroke-width="1.5"/>`);
 const np=w>h*.7?2:1;for(let i=0;i<np;i++){const pw=w*.84/np;t.add(`<rect x="${F(w*.1+pw*i)}" y="${F(cab+h*.02)}" width="${F(pw-w*.04)}" height="${F(h*.16)}" rx="10" fill="${t.rad(o.travesseiro||'#f6f3ec',{claro:.4})}" stroke="#b9b2a6" stroke-width="1.4"/>`);}
 const tex=t.relevo({freq:.18,oct:2,escala:.7,elev:65});
 t.add(`<path d="M${F(w*.08)} ${F(h*.38)} Q${F(w*.5)} ${F(h*.33)} ${F(w*.92)} ${F(h*.38)} V${F(h*.96)} H${F(w*.08)}Z" fill="${t.rad(colcha,{claro:.15})}" stroke="${tom(colcha,-.45)}" stroke-width="1.8" filter="${tex}"/>`);
 t.add(`<path d="M${F(w*.08)} ${F(h*.38)} Q${F(w*.5)} ${F(h*.33)} ${F(w*.92)} ${F(h*.38)} L${F(w*.92)} ${F(h*.46)} Q${F(w*.5)} ${F(h*.41)} ${F(w*.08)} ${F(h*.46)}Z" fill="${tom(lencol,-.05)}" opacity=".9"/>`);
 for(let i=0;i<4;i++){const y=h*(.55+i*.1);t.add(`<path d="M${F(w*.12)} ${F(y)} Q${F(w*.5)} ${F(y+(r()-.5)*h*.06)} ${F(w*.88)} ${F(y)}" stroke="${tom(colcha,-.3)}" stroke-width="1.6" fill="none" opacity=".45"/>`);}
 if(o.padrao==='xadrez')for(let i=0;i<8;i++)t.add(`<path d="M${F(w*.08+w*.84*i/8)} ${F(h*.46)} V${F(h*.96)}" stroke="${tom(colcha,-.5)}" stroke-width="2" opacity=".35"/>`);
 t.add('</g>');
}
function tapete(t,o={}){
 const {W,H,r}=t,cx=W/2,cy=H/2,redondo=o.redondo??Math.abs(W-H)<W*.1;
 const c1=o.cor||'#2a3a7a',c2=o.cor2||'#c9a63a',c3=o.cor3||'#a8322a';
 const tex=t.relevo({freq:.9,oct:2,escala:.8,elev:65});
 t.add(`<g filter="${t.sombra(4,5,4,.4)}">`);
 if(redondo){const R=Math.min(W,H)*.48;
  t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${c3}" filter="${tex}"/>`);
  for(let i=0;i<48;i++){const a=i/48*6.28;t.add(`<circle cx="${F(cx+Math.cos(a)*R*.93)}" cy="${F(cy+Math.sin(a)*R*.93)}" r="${F(R*.035)}" fill="${c2}"/>`);}
  t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.85)}" fill="${c1}" filter="${tex}"/>`);
  for(let k=0;k<3;k++){const rr=R*(.75-k*.2);for(let i=0;i<16;i++){const a=i/16*6.28+k*.2;t.add(`<path d="M${F(cx)} ${F(cy)} Q${F(cx+Math.cos(a+.2)*rr*.6)} ${F(cy+Math.sin(a+.2)*rr*.6)} ${F(cx+Math.cos(a)*rr)} ${F(cy+Math.sin(a)*rr)} Q${F(cx+Math.cos(a-.2)*rr*.6)} ${F(cy+Math.sin(a-.2)*rr*.6)} ${F(cx)} ${F(cy)}" fill="none" stroke="${k%2?c2:'#e9e2d0'}" stroke-width="1.6" opacity=".85"/>`);}}
  t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.14)}" fill="${c3}" stroke="${c2}" stroke-width="3"/>`);
 }else{
  const m=Math.min(W,H)*.04;
  t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" fill="${c3}" filter="${tex}"/>`);
  t.add(`<rect x="${F(m*3)}" y="${F(m*3)}" width="${F(W-6*m)}" height="${F(H-6*m)}" fill="${c1}" stroke="${c2}" stroke-width="3" filter="${tex}"/>`);
  t.add(`<ellipse cx="${F(cx)}" cy="${F(cy)}" rx="${F(W*.28)}" ry="${F(H*.28)}" fill="${c3}" stroke="${c2}" stroke-width="3"/>`);
  for(let i=0;i<12;i++){const a=i/12*6.28;t.add(`<path d="M${F(cx)} ${F(cy)} L${F(cx+Math.cos(a)*W*.25)} ${F(cy+Math.sin(a)*H*.25)}" stroke="#e9e2d0" stroke-width="1.5" opacity=".7"/>`);}
  for(let i=0;i<24;i++){const x=m+(W-2*m)*i/23;t.add(`<path d="M${F(x)} ${F(m*.2)} v${F(m)} M${F(x)} ${F(H-m*1.2)} v${F(m)}" stroke="#e9e2d0" stroke-width="1.4"/>`);}
 }
 t.add('</g>');
}
// ---------------------------------------------------------------- metal, construção, sci-fi
function chapaMetal(t,o={}){
 const {W,H,r}=t,cor=o.cor||'#6a7078',n=o.n||2;
 const tex=t.relevo({freq:.4,oct:2,escala:.9,elev:58});
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=W*i/n,y=H*j/n,w=W/n,h=H/n;
  t.add(`<rect x="${F(x+1)}" y="${F(y+1)}" width="${F(w-2)}" height="${F(h-2)}" fill="${tom(cor,(r()-.5)*.12)}" stroke="#2a2e34" stroke-width="2" filter="${tex}"/>`);
  t.add(`<rect x="${F(x+4)}" y="${F(y+4)}" width="${F(w-8)}" height="${F(h-8)}" fill="none" stroke="#fff" stroke-width="1" opacity=".12"/>`);
  for(const [a,b] of [[.08,.08],[.92,.08],[.08,.92],[.92,.92]])t.add(`<circle cx="${F(x+w*a)}" cy="${F(y+h*b)}" r="${F(Math.min(w,h)*.025)}" fill="#3a3e44" stroke="#9aa0a8" stroke-width=".8"/>`);
  if(o.listras)t.add(`<path d="M${F(x+w*.1)} ${F(y+h*.5)} h${F(w*.8)}" stroke="#2a2e34" stroke-width="3" opacity=".6"/>`);
 }
 if(o.ferrugem)for(let i=0;i<10;i++){const x=r()*W,y=r()*H;t.add(`<path d="${blob(x,y,W*(.03+r()*.06),H*(.02+r()*.05),r,{pontos:7,irreg:.6})}" fill="#7a4a2a" opacity=".35"/>`);}
}
function escotilha(t,o={}){
 const {W,H}=t,cor=o.cor||'#c9a020';
 chapaMetal(t,{cor:'#4a4e56',n:1});
 const m=Math.min(W,H)*.1;
 t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" fill="${tom(cor,-.1)}" stroke="#1a1a1a" stroke-width="3" filter="${t.relevo({freq:.3,oct:2,escala:1,elev:58})}"/>`);
 t.add(`<path d="M${F(W/2)} ${F(m)} V${F(H-m)} M${F(m)} ${F(H/2)} H${F(W-m)}" stroke="#2a2a2a" stroke-width="4"/>`);
 for(let i=0;i<8;i++)t.add(`<path d="M${F(m+(W-2*m)*i/8)} ${F(m)} l${F(m*.8)} ${F(-m*.0)}" stroke="#1a1a1a" stroke-width="0" />`);
 const s=m*.6;for(let i=0;i<10;i++){const x=m+((W-2*m)/10)*i;t.add(`<path d="M${F(x)} ${F(m)} l${F(s)} ${F(s)} M${F(x)} ${F(H-m)} l${F(s)} ${F(-s)}" stroke="#1a1a1a" stroke-width="3" opacity=".7"/>`);}
 t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" fill="${t.lin(['#ffffff','#ffffff00'],45)}" opacity=".18"/>`);
}
function grade(t,o={}){
 const {W,H}=t,cor=o.cor||'#5a4a3e';
 t.add(`<rect x="0" y="0" width="${W}" height="${H}" fill="#14100e"/>`);
 const n=o.n||10,w=Math.min(W,H)*.03;
 for(let i=0;i<=n;i++){const x=W*i/n,y=H*i/n;t.add(`<path d="M${F(x)} 0 V${H} M0 ${F(y)} H${W}" stroke="${cor}" stroke-width="${F(w)}"/>`);}
 t.add(`<path d="M0 0 L${W} ${H} M${W} 0 L0 ${H}" stroke="${tom(cor,-.15)}" stroke-width="${F(w*2.2)}"/>`);
 t.add(`<rect x="${F(w)}" y="${F(w)}" width="${F(W-2*w)}" height="${F(H-2*w)}" fill="none" stroke="${tom(cor,.1)}" stroke-width="${F(w*2.5)}" filter="${t.relevo({freq:.25,oct:3,escala:1.6})}"/>`);
 t.add(`<rect x="0" y="0" width="${W}" height="${H}" fill="${t.lin(['#ff9a5a33','#00000000'],45)}"/>`);
}
function calcamento(t,o={}){
 const {W,H,r}=t,cor=o.cor||'#5a4a48';const lw=W/8,lh=H/14;
 for(let j=0;j<14;j++)for(let i=-1;i<9;i++){const x=i*lw+(j%2)*lw/2,y=j*lh;t.add(`<rect x="${F(x+1.5)}" y="${F(y+1.5)}" width="${F(lw-3)}" height="${F(lh-3)}" rx="2" fill="${tom(cor,(r()-.5)*.3)}"/>`);}
 t.add(`<rect x="0" y="0" width="${W}" height="${H}" fill="#000" opacity=".0" filter="${t.relevo({freq:.06,escala:2})}"/>`);
}
function lampada(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.3,cor=o.cor||'#ffcf6b';
 const i='lg'+Math.floor(t.r()*1e6);t.def(`<radialGradient id="${i}"><stop offset="0" stop-color="#fffbe6"/><stop offset=".35" stop-color="${cor}" stop-opacity=".95"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></radialGradient>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(Math.min(W,H)*.49)}" fill="url(#${i})" opacity=".55"/>`);
 t.add(`<g filter="${t.sombra(4,5,4,.4)}"><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${t.rad('#3a3e46')}" stroke="#14161a" stroke-width="2"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.68)}" fill="url(#${i})"/><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.3)}" fill="#fffbe6"/></g>`);
}
function esqueletos(t,o={}){
 const {W,H,r}=t,osso='#e9e0c8';
 t.add(`<g filter="${t.sombra(5,7,5,.5)}">`);
 const ossoLongo=(x,y,a,l)=>{const ex=x+Math.cos(a)*l,ey=y+Math.sin(a)*l;t.add(`<path d="M${F(x)} ${F(y)} L${F(ex)} ${F(ey)}" stroke="#7a705a" stroke-width="${F(l*.16+2)}" stroke-linecap="round"/><path d="M${F(x)} ${F(y)} L${F(ex)} ${F(ey)}" stroke="${osso}" stroke-width="${F(l*.16)}" stroke-linecap="round"/>`);for(const [px,py] of [[x,y],[ex,ey]])t.add(`<circle cx="${F(px)}" cy="${F(py)}" r="${F(l*.12)}" fill="${osso}" stroke="#7a705a" stroke-width="1"/>`);};
 for(let i=0;i<22;i++)ossoLongo(W*(.15+r()*.7),H*(.15+r()*.7),r()*6.28,Math.min(W,H)*(.08+r()*.12));
 for(let i=0;i<5;i++){const x=W*(.2+r()*.6),y=H*(.2+r()*.6),R=Math.min(W,H)*(.06+r()*.03);t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(R)}" fill="${t.rad(osso)}" stroke="#6a604a" stroke-width="1.5"/><ellipse cx="${F(x+R*.35)}" cy="${F(y-R*.25)}" rx="${F(R*.22)}" ry="${F(R*.18)}" fill="#2a2418"/><ellipse cx="${F(x+R*.35)}" cy="${F(y+R*.25)}" rx="${F(R*.22)}" ry="${F(R*.18)}" fill="#2a2418"/>`);}
 for(let i=0;i<3;i++){const x=W*(.25+r()*.5),y=H*(.25+r()*.5);for(let k=0;k<6;k++)t.add(`<path d="M${F(x)} ${F(y+k*H*.03)} q${F(W*.06)} ${F(-H*.02)} ${F(W*.12)} 0" stroke="${osso}" stroke-width="${F(Math.min(W,H)*.012)}" fill="none" opacity=".9"/>`);}
 t.add('</g>');
}
function armadilha(t,o={}){
 const {W,H,r}=t;
 t.add(`<rect x="0" y="0" width="${W}" height="${H}" fill="#8a8478" filter="${t.relevo({freq:.05,escala:2.5})}"/>`);
 const m=W*.1;t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" fill="${t.rad('#2a2018',{cx:50,cy:50,claro:-.2,escuro:-.6})}"/>`);
 for(let i=0;i<26;i++){const x=m+r()*(W-2*m),y=m+r()*(H-2*m),s=Math.min(W,H)*(.03+r()*.03);t.add(`<path d="M${F(x-s)} ${F(y+s*.6)} L${F(x)} ${F(y-s*1.4)} L${F(x+s)} ${F(y+s*.6)}Z" fill="${t.rad('#9a8a6a',{claro:.35})}" stroke="#2a2018" stroke-width="1"/>`);}
 t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" fill="none" stroke="#5a5448" stroke-width="5"/>`);
}
function tumulo(t,o={}){
 const {W,H}=t,m=Math.min(W,H)*.06;
 t.add(`<g filter="${t.sombra(8,10,8,.55)}"><rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="4" fill="#8a8a84" filter="${t.relevo({freq:.04,escala:3})}" stroke="#3a3a36" stroke-width="2.5"/>`);
 t.add(`<rect x="${F(m*2.5)}" y="${F(m*2.5)}" width="${F(W-5*m)}" height="${F(H-5*m)}" rx="3" fill="none" stroke="#5a5a54" stroke-width="2"/>`);
 t.add(`<path d="M${F(W/2)} ${F(H*.22)} V${F(H*.58)} M${F(W*.36)} ${F(H*.32)} H${F(W*.64)}" stroke="#4a4a44" stroke-width="${F(W*.05)}" stroke-linecap="round"/>`);
 t.add(`<path d="M${F(W*.2)} ${F(H*.8)} q${F(W*.2)} ${F(-H*.05)} ${F(W*.6)} 0" stroke="#5f8a32" stroke-width="4" opacity=".6" fill="none"/></g>`);
}
function telhado(t,o={}){
 const {W,H,r}=t,cor=o.cor||'#7a3a2a',linhas=Math.max(6,Math.round(H/24));
 for(let j=0;j<linhas;j++){const y=H*j/linhas,h=H/linhas;for(let i=-1;i<W/20+1;i++){const x=i*20+(j%2)*10;t.add(`<path d="M${F(x)} ${F(y)} h18 v${F(h*.9)} q-9 ${F(h*.25)} -18 0Z" fill="${tom(cor,(r()-.5)*.25-j/linhas*.15)}" stroke="#2a1410" stroke-width=".8"/>`);}}
 t.add(`<path d="M0 ${F(H/2)} H${W}" stroke="#3a1a12" stroke-width="${F(H*.04)}"/>`);
}
function carro(t,o={}){
 const {W,H}=t,cor=o.cor||'#2a2e34',horiz=W>=H,L=horiz?W:H,E=horiz?H:W;
 const rot=horiz?'':`transform="rotate(90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})"`;
 const x=L*.04,y=E*.12,l=L*.92,e=E*.76;
 t.add(`<g filter="${t.sombra(10,12,9,.55)}" ${rot}>`);
 for(const [a,b] of [[.18,0],[.18,1],[.78,0],[.78,1]])t.add(`<rect x="${F(x+l*a-l*.07)}" y="${F(b?y+e-e*.06:y-e*.06)}" width="${F(l*.14)}" height="${F(e*.12)}" rx="4" fill="#111"/>`);
 t.add(`<rect x="${F(x)}" y="${F(y)}" width="${F(l)}" height="${F(e)}" rx="${F(e*.3)}" fill="${t.rad(cor,{claro:.35})}" stroke="#0a0a0a" stroke-width="2.5"/>`);
 t.add(`<path d="M${F(x+l*.32)} ${F(y+e*.12)} H${F(x+l*.66)} Q${F(x+l*.74)} ${F(y+e*.5)} ${F(x+l*.66)} ${F(y+e*.88)} H${F(x+l*.32)} Q${F(x+l*.26)} ${F(y+e*.5)} ${F(x+l*.32)} ${F(y+e*.12)}Z" fill="${t.lin(['#1a2a3a','#5a7a9a','#1a2a3a'],90)}" stroke="#0a0a0a" stroke-width="2"/>`);
 t.add(`<rect x="${F(x+l*.38)} " y="${F(y+e*.2)}" width="${F(l*.22)}" height="${F(e*.6)}" rx="6" fill="${t.rad(tom(cor,.05))}"/>`);
 for(const b of [.2,.8])t.add(`<ellipse cx="${F(x+l*.97)}" cy="${F(y+e*b)}" rx="${F(l*.02)}" ry="${F(e*.08)}" fill="#fff6c9"/><ellipse cx="${F(x+l*.03)}" cy="${F(y+e*b)}" rx="${F(l*.015)}" ry="${F(e*.07)}" fill="#c92a2a"/>`);
 t.add(`<path d="M${F(x+l*.08)} ${F(y+e*.5)} H${F(x+l*.3)} M${F(x+l*.72)} ${F(y+e*.5)} H${F(x+l*.95)}" stroke="#000" stroke-width="1.5" opacity=".35"/></g>`);
}
function caminhao(t,o={}){
 const {W,H}=t,cor=o.cor||'#5a6a7a',horiz=W>=H,L=horiz?W:H,E=horiz?H:W;
 const rot=horiz?'':`transform="rotate(90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})"`;
 const y=E*.08,e=E*.84;
 t.add(`<g filter="${t.sombra(10,12,9,.55)}" ${rot}>`);
 t.add(`<rect x="${F(L*.02)}" y="${F(y)}" width="${F(L*.7)}" height="${F(e)}" rx="6" fill="${t.lin(['#8a9098','#6a7078','#8a9098'],90)}" stroke="#1a1a1a" stroke-width="2.5" filter="${t.relevo({freq:.2,oct:2,escala:1})}"/>`);
 for(let i=1;i<10;i++)t.add(`<path d="M${F(L*.02+L*.7*i/10)} ${F(y)} V${F(y+e)}" stroke="#4a5058" stroke-width="2"/>`);
 t.add(`<rect x="${F(L*.74)}" y="${F(y+e*.04)}" width="${F(L*.24)}" height="${F(e*.92)}" rx="${F(e*.18)}" fill="${t.rad(cor,{claro:.3})}" stroke="#1a1a1a" stroke-width="2.5"/>`);
 t.add(`<rect x="${F(L*.86)}" y="${F(y+e*.14)}" width="${F(L*.08)}" height="${F(e*.72)}" rx="6" fill="${t.lin(['#1a2a3a','#5a7a9a','#1a2a3a'],90)}"/>`);
 t.add('</g>');
}
function terminal(t,o={}){
 const {W,H}=t,m=Math.min(W,H)*.08,tela=o.tela||'#3fd0ff';
 t.add(`<g filter="${t.sombra(8,10,7,.55)}"><rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="8" fill="${t.rad('#3a4048')}" stroke="#14161a" stroke-width="3"/>`);
 t.add(`<rect x="${F(m*2)}" y="${F(m*2)}" width="${F(W-4*m)}" height="${F((H-4*m)*.55)}" rx="5" fill="#0a1418"/>`);
 for(let i=0;i<5;i++)t.add(`<path d="M${F(m*2.6)} ${F(m*2.6+i*(H-4*m)*.09)} h${F((W-5*m)*(.4+((i*37)%50)/100))}" stroke="${tela}" stroke-width="2.4" opacity=".85"/>`);
 t.add(`<rect x="${F(m*2)}" y="${F(m*2)}" width="${F(W-4*m)}" height="${F((H-4*m)*.55)}" rx="5" fill="${tela}" opacity=".12"/>`);
 for(let i=0;i<6;i++)t.add(`<rect x="${F(m*2+i*(W-4*m)/6+2)}" y="${F(H-m*2-(H-4*m)*.3)}" width="${F((W-4*m)/6-4)}" height="${F((H-4*m)*.12)}" rx="2" fill="${['#c94a3a','#3a9a5a','#d9a63a','#5a6a7a'][i%4]}"/>`);
 t.add('</g>');
}

// ---------------------------------------------------------------- v129: futurista, retrofuturista e feudal galáctico
const NEON='#5ad8ff',MAGENTA='#ff4fd8',OURO='#d9a63a',CARMIM='#7a1a24',CREME='#efe2c4',LARANJA='#e8743a',PETROLEO='#2a9a9a';
function brilho(t,cor,blur=6){const i='bl'+Math.floor(t.r()*1e7);t.def(`<filter id="${i}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${blur}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);return `url(#${i})`;}
function placaMetal(t,x,y,w,h,cor='#2a3440',rx=8){t.add(`<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" rx="${rx}" fill="${t.lin([tom(cor,.18),cor,tom(cor,-.3)],120)}" stroke="#0c1016" stroke-width="3"/>`);}
function consoleHolo(t,o={}){
 const {W,H}=t,m=Math.min(W,H)*.08,c=o.neon||NEON,cx=W/2,cy=H/2;
 t.add(`<g filter="${t.sombra(8,10,8,.6)}">`);placaMetal(t,m,m,W-2*m,H-2*m,o.cor||'#26303c',Math.min(W,H)*.2);t.add('</g>');
 t.add(`<rect x="${F(m*1.8)}" y="${F(m*1.8)}" width="${F(W-3.6*m)}" height="${F(H-3.6*m)}" rx="${F(Math.min(W,H)*.15)}" fill="none" stroke="${c}" stroke-width="3" filter="${brilho(t,c,4)}"/>`);
 const gl=brilho(t,c,8);for(let k=0;k<3;k++)t.add(`<ellipse cx="${F(cx)}" cy="${F(cy)}" rx="${F((W-6*m)*(.18+k*.12))}" ry="${F((H-6*m)*(.18+k*.12))}" fill="none" stroke="${c}" stroke-width="${2-k*.5}" opacity="${.9-k*.25}" filter="${gl}"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(Math.min(W,H)*.07)}" fill="#e8fbff" filter="${gl}"/>`);
 for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;t.add(`<rect x="${F(cx+Math.cos(a)*(W*.3)-6)}" y="${F(cy+Math.sin(a)*(H*.3)-3)}" width="12" height="6" rx="2" fill="${[MAGENTA,c,'#ffd447',c][i]}" opacity=".9"/>`);}
}
function capsula(t,o={}){
 const {W,H}=t,vert=H>W,w=vert?W:H,h=vert?H:W,rot=vert?'':`transform="rotate(-90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})"`;
 t.add(`<g ${rot} filter="${t.sombra(8,10,8,.6)}"><rect x="${F(w*.08)}" y="${F(h*.03)}" width="${F(w*.84)}" height="${F(h*.94)}" rx="${F(w*.42)}" fill="${t.lin(['#d9e2ea','#8a96a4','#3a4450'],90)}" stroke="#141a22" stroke-width="3"/>`);
 t.add(`<rect x="${F(w*.2)}" y="${F(h*.12)}" width="${F(w*.6)}" height="${F(h*.62)}" rx="${F(w*.3)}" fill="${t.lin(['#bff4ff','#2a6a8a'],90)}" opacity=".75" stroke="${o.neon||NEON}" stroke-width="2"/>`);
 t.add(`<path d="M${F(w*.28)} ${F(h*.2)} q${F(w*.06)} ${F(h*.2)} 0 ${F(h*.45)}" stroke="#ffffff" stroke-width="3" opacity=".45" fill="none"/>`);
 for(let i=0;i<5;i++)t.add(`<circle cx="${F(w*.3+i*w*.1)}" cy="${F(h*.86)}" r="${F(w*.025)}" fill="${i%2?(o.neon||NEON):'#57e3a1'}"/>`);t.add('</g>');
}
function armarioMetal(t,o={}){
 const {W,H}=t,n=Math.max(1,Math.round(W/Math.max(1,H)*1.4)),m=Math.min(W,H)*.06,c=o.neon||NEON;
 t.add(`<g filter="${t.sombra(7,9,7,.55)}">`);placaMetal(t,m,m,W-2*m,H-2*m,o.cor||'#3a4650',6);
 for(let i=0;i<n;i++){const x=m+(W-2*m)*i/n;t.add(`<rect x="${F(x+4)}" y="${F(m+4)}" width="${F((W-2*m)/n-8)}" height="${F(H-2*m-8)}" rx="4" fill="${t.lin([tom(o.cor||'#3a4650',.12),tom(o.cor||'#3a4650',-.18)],90)}" stroke="#10161c" stroke-width="2"/>`);
  for(let k=0;k<3;k++)t.add(`<path d="M${F(x+(W-2*m)/n*.3)} ${F(m+(H-2*m)*(.2+k*.08))} h${F((W-2*m)/n*.4)}" stroke="#0c1016" stroke-width="2"/>`);
  t.add(`<rect x="${F(x+(W-2*m)/n*.42)}" y="${F(m+(H-2*m)*.62)}" width="${F((W-2*m)/n*.16)}" height="${F((H-2*m)*.1)}" rx="2" fill="${c}" filter="${brilho(t,c,3)}"/>`);}
 t.add('</g>');
}
function painelNeon(t,o={}){
 const {W,H}=t,c=o.neon||NEON,vert=H>W;
 placaMetal(t,W*.05,H*.05,W*.9,H*.9,'#1a2028',Math.min(W,H)*.3);
 const g=brilho(t,c,9);t.add(vert?`<rect x="${F(W*.38)}" y="${F(H*.12)}" width="${F(W*.24)}" height="${F(H*.76)}" rx="${F(W*.12)}" fill="${c}" filter="${g}"/>`:`<rect x="${F(W*.12)}" y="${F(H*.38)}" width="${F(W*.76)}" height="${F(H*.24)}" rx="${F(H*.12)}" fill="${c}" filter="${g}"/>`);
}
function portaDeslizante(t,o={}){
 const {W,H}=t,c=o.neon||NEON,vert=H>W;chapaMetal(t,{cor:'#3a4450',n:1});
 const g=brilho(t,c,4);
 if(vert){t.add(`<rect x="${F(W*.15)}" y="${F(H*.04)}" width="${F(W*.7)}" height="${F(H*.45)}" fill="${t.lin(['#4a5664','#2a3240'],0)}" stroke="#0c1016" stroke-width="2"/><rect x="${F(W*.15)}" y="${F(H*.51)}" width="${F(W*.7)}" height="${F(H*.45)}" fill="${t.lin(['#4a5664','#2a3240'],0)}" stroke="#0c1016" stroke-width="2"/><path d="M${F(W*.2)} ${F(H*.5)} H${F(W*.8)}" stroke="${c}" stroke-width="3" filter="${g}"/>`);}
 else{t.add(`<rect x="${F(W*.04)}" y="${F(H*.15)}" width="${F(W*.45)}" height="${F(H*.7)}" fill="${t.lin(['#4a5664','#2a3240'],90)}" stroke="#0c1016" stroke-width="2"/><rect x="${F(W*.51)}" y="${F(H*.15)}" width="${F(W*.45)}" height="${F(H*.7)}" fill="${t.lin(['#4a5664','#2a3240'],90)}" stroke="#0c1016" stroke-width="2"/><path d="M${F(W*.5)} ${F(H*.2)} V${F(H*.8)}" stroke="${c}" stroke-width="3" filter="${g}"/>`);}
 t.add(`<circle cx="${F(W*.5)}" cy="${F(H*.5)}" r="${F(Math.min(W,H)*.08)}" fill="${o.trava||'#57e3a1'}" filter="${g}"/>`);
}
function mesaVidro(t,o={}){
 const {W,H}=t,m=Math.min(W,H)*.1,c=o.neon||NEON;
 t.add(`<g filter="${t.sombra(6,8,7,.45)}"><rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="${F(Math.min(W,H)*.18)}" fill="#9fdcff" opacity=".28" stroke="${c}" stroke-width="3"/></g>`);
 t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="${F(Math.min(W,H)*.18)}" fill="none" stroke="${c}" stroke-width="2" filter="${brilho(t,c,5)}"/>`);
 t.add(`<path d="M${F(m*2)} ${F(m*1.6)} L${F(W*.45)} ${F(m*1.6)}" stroke="#ffffff" stroke-width="3" opacity=".5"/>`);
}
function cadeiraErgo(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.42,c=o.neon||NEON;
 t.add(`<g filter="${t.sombra(5,7,5,.5)}"><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${t.rad(o.cor||'#2a3440')}" stroke="#0c1016" stroke-width="2"/>`);
 t.add(`<path d="M${F(cx-R*.9)} ${F(cy-R*.2)} A${F(R*.9)} ${F(R*.9)} 0 0 1 ${F(cx+R*.9)} ${F(cy-R*.2)}" stroke="${tom(o.cor||'#2a3440',-.3)}" stroke-width="${F(R*.35)}" fill="none" stroke-linecap="round"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy+R*.15)}" r="${F(R*.45)}" fill="${tom(o.cor||'#2a3440',.15)}"/><path d="M${F(cx-R*.75)} ${F(cy-R*.45)} A${F(R*.85)} ${F(R*.85)} 0 0 1 ${F(cx+R*.75)} ${F(cy-R*.45)}" stroke="${c}" stroke-width="2" fill="none"/></g>`);
}
// --- retrofuturista
function sofaRetro(t,o={}){
 const {W,H}=t,cor=o.cor||LARANJA,c2=o.cor2||CREME;
 t.add(`<g filter="${t.sombra(8,10,8,.55)}"><path d="M${F(W*.04)} ${F(H*.9)} Q${F(W*.04)} ${F(H*.08)} ${F(W*.5)} ${F(H*.08)} Q${F(W*.96)} ${F(H*.08)} ${F(W*.96)} ${F(H*.9)} Z" fill="${t.rad(cor,{claro:.25})}" stroke="${tom(cor,-.5)}" stroke-width="3"/>`);
 t.add(`<path d="M${F(W*.16)} ${F(H*.88)} Q${F(W*.16)} ${F(H*.36)} ${F(W*.5)} ${F(H*.36)} Q${F(W*.84)} ${F(H*.36)} ${F(W*.84)} ${F(H*.88)} Z" fill="${t.rad(c2,{claro:.2})}" stroke="${tom(c2,-.4)}" stroke-width="2"/>`);
 for(let i=0;i<3;i++)t.add(`<circle cx="${F(W*(.32+i*.18))}" cy="${F(H*.62)}" r="${F(Math.min(W,H)*.03)}" fill="${tom(c2,-.35)}"/>`);
 t.add(`<path d="M${F(W*.1)} ${F(H*.3)} Q${F(W*.5)} ${F(H*.12)} ${F(W*.9)} ${F(H*.3)}" stroke="#ffffff" stroke-width="3" opacity=".35" fill="none"/></g>`);
}
function luminariaAtomica(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.42,cor=o.cor||'#ffd27a';
 lampada(t,{cor});
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.18)}" fill="${t.lin(['#ffffff','#c9ccd2','#6a6e76'],120)}" stroke="#2a2a30" stroke-width="2"/>`);
 for(let i=0;i<6;i++){const a=i*Math.PI/3,x=cx+Math.cos(a)*R*.62,y=cy+Math.sin(a)*R*.62;t.add(`<path d="M${F(cx)} ${F(cy)} L${F(x)} ${F(y)}" stroke="#c9ccd2" stroke-width="3"/><circle cx="${F(x)}" cy="${F(y)}" r="${F(R*.13)}" fill="${[LARANJA,PETROLEO,CREME][i%3]}" stroke="#2a2a30" stroke-width="2"/>`);}
}
function mesaBumerangue(t,o={}){
 const {W,H}=t,cor=o.cor||PETROLEO;
 t.add(`<g filter="${t.sombra(7,9,7,.5)}"><path d="M${F(W*.06)} ${F(H*.3)} Q${F(W*.5)} ${F(H*.02)} ${F(W*.94)} ${F(H*.3)} Q${F(W*.8)} ${F(H*.62)} ${F(W*.5)} ${F(H*.5)} Q${F(W*.2)} ${F(H*.62)} ${F(W*.06)} ${F(H*.3)}Z" fill="${t.rad(cor,{claro:.3})}" stroke="${tom(cor,-.5)}" stroke-width="3"/>`);
 for(let i=0;i<9;i++)t.add(`<circle cx="${F(W*(.2+t.r()*.6))}" cy="${F(H*(.2+t.r()*.25))}" r="${F(Math.min(W,H)*.012)}" fill="${CREME}" opacity=".8"/>`);t.add('</g>');
}
function radioValvulas(t,o={}){
 const {W,H}=t,m=Math.min(W,H)*.08,cor=o.cor||'#8a5a34';
 t.add(`<g filter="${t.sombra(7,9,7,.55)}"><rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="${F(Math.min(W,H)*.25)}" fill="${t.rad(cor)}" stroke="#2a1a0e" stroke-width="3" filter="${t.grao({freqX:.02,freqY:.3}).url}"/>`);
 t.add(`<rect x="${F(W*.14)}" y="${F(H*.2)}" width="${F(W*.44)}" height="${F(H*.6)}" rx="8" fill="${CREME}" stroke="#2a1a0e" stroke-width="2"/>`);for(let i=0;i<6;i++)t.add(`<path d="M${F(W*.18)} ${F(H*(.28+i*.08))} h${F(W*.36)}" stroke="#8a7a5a" stroke-width="1.5"/>`);
 const g=brilho(t,'#ffb347',5);for(let i=0;i<3;i++)t.add(`<circle cx="${F(W*(.68+i*.08))}" cy="${F(H*.5)}" r="${F(Math.min(W,H)*.06)}" fill="#ffb347" filter="${g}" opacity=".9"/>`);t.add('</g>');
}
function poltronaOvo(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.45,cor=o.cor||'#f2f0ea',in_=o.cor2||LARANJA;
 t.add(`<g filter="${t.sombra(7,9,7,.55)}"><ellipse cx="${F(cx)}" cy="${F(cy)}" rx="${F(R)}" ry="${F(R*.95)}" fill="${t.rad(cor,{claro:.4})}" stroke="#6a6a70" stroke-width="3"/><ellipse cx="${F(cx)}" cy="${F(cy+R*.12)}" rx="${F(R*.68)}" ry="${F(R*.62)}" fill="${t.rad(in_,{claro:.25})}" stroke="${tom(in_,-.45)}" stroke-width="2"/></g>`);
}
// --- feudal galáctico
function trono(t,o={}){
 const {W,H}=t,cor=o.cor||CARMIM,ouro=o.ouro||OURO,c=o.neon||NEON;
 t.add(`<g filter="${t.sombra(9,11,9,.6)}"><path d="M${F(W*.12)} ${F(H*.96)} V${F(H*.24)} L${F(W*.3)} ${F(H*.04)} L${F(W*.5)} ${F(H*.14)} L${F(W*.7)} ${F(H*.04)} L${F(W*.88)} ${F(H*.24)} V${F(H*.96)}Z" fill="${t.lin([tom(ouro,.25),ouro,tom(ouro,-.4)],100)}" stroke="#3a2a10" stroke-width="3"/>`);
 t.add(`<rect x="${F(W*.24)}" y="${F(H*.3)}" width="${F(W*.52)}" height="${F(H*.6)}" rx="8" fill="${t.rad(cor,{claro:.2})}" stroke="${tom(cor,-.5)}" stroke-width="2" filter="${t.relevo({freq:.2,oct:2,escala:.8,elev:60})}"/>`);
 t.add(`<path d="M${F(W*.5)} ${F(H*.36)} l${F(W*.08)} ${F(H*.1)} l${F(-W*.08)} ${F(H*.1)} l${F(-W*.08)} ${F(-H*.1)}Z" fill="${ouro}" stroke="#3a2a10" stroke-width="1.5"/>`);
 const g=brilho(t,c,3);t.add(`<path d="M${F(W*.2)} ${F(H*.9)} V${F(H*.34)} M${F(W*.8)} ${F(H*.9)} V${F(H*.34)}" stroke="${c}" stroke-width="1.6" stroke-dasharray="6 4" filter="${g}"/></g>`);
}
function estandarte(t,o={}){
 const {W,H}=t,cor=o.cor||CARMIM,ouro=o.ouro||OURO,vert=H>=W,w=vert?W:H,h=vert?H:W,rot=vert?'':`transform="rotate(-90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})"`;
 t.add(`<g ${rot} filter="${t.sombra(6,8,6,.5)}"><rect x="${F(w*.04)}" y="${F(h*.03)}" width="${F(w*.92)}" height="${F(h*.06)}" rx="3" fill="${ouro}" stroke="#3a2a10" stroke-width="2"/>`);
 t.add(`<path d="M${F(w*.12)} ${F(h*.08)} H${F(w*.88)} V${F(h*.86)} L${F(w*.5)} ${F(h*.97)} L${F(w*.12)} ${F(h*.86)}Z" fill="${t.rad(cor,{claro:.18})}" stroke="${ouro}" stroke-width="3" filter="${t.relevo({freq:.25,oct:2,escala:.6,elev:62})}"/>`);
 const cx=w*.5,cy=h*.45,R=w*.24;t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="none" stroke="${ouro}" stroke-width="3"/>`);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;t.add(`<path d="M${F(cx)} ${F(cy)} L${F(cx+Math.cos(a)*R*(i%2?.6:1))} ${F(cy+Math.sin(a)*R*(i%2?.6:1))}" stroke="${ouro}" stroke-width="${i%2?2:3}"/>`);}
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.22)}" fill="${o.neon||NEON}" filter="${brilho(t,o.neon||NEON,4)}"/></g>`);
}
function braseiroPlasma(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.4,c=o.chama||'#7af0ff';
 lampada(t,{cor:c});
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.78)}" fill="${t.lin(['#4a3a2a',OURO,'#3a2a10'],120)}" stroke="#2a1a0a" stroke-width="3"/>`);
 const g=brilho(t,c,7);for(let i=0;i<7;i++){const a=t.r()*Math.PI*2,r=R*.35*t.r();t.add(`<circle cx="${F(cx+Math.cos(a)*r)}" cy="${F(cy+Math.sin(a)*r)}" r="${F(R*(.12+t.r()*.14))}" fill="${i%2?c:'#ffffff'}" opacity=".85" filter="${g}"/>`);}
}
function bauBrasonado(t,o={}){
 const {W,H}=t,m=Math.min(W,H)*.07,cor=o.cor||'#4a2a1e',ouro=o.ouro||OURO;
 t.add(`<g filter="${t.sombra(8,10,8,.55)}"><rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="10" fill="${t.rad(cor)}" stroke="#1a0e08" stroke-width="3" filter="${t.grao({freqX:.012,freqY:.35}).url}"/>`);
 for(const x of [m+(W-2*m)*.2,W-m-(W-2*m)*.2])t.add(`<rect x="${F(x-m*.6)}" y="${F(m)}" width="${F(m*1.2)}" height="${F(H-2*m)}" fill="${t.lin([tom(ouro,.3),ouro,tom(ouro,-.35)],0)}" stroke="#3a2a10" stroke-width="1.5"/>`);
 t.add(`<rect x="${F(m)}" y="${F(H/2-m*.5)}" width="${F(W-2*m)}" height="${F(m)}" fill="${tom(ouro,-.2)}"/><circle cx="${F(W/2)}" cy="${F(H/2)}" r="${F(Math.min(W,H)*.13)}" fill="${t.lin([tom(ouro,.3),ouro],120)}" stroke="#3a2a10" stroke-width="2"/><path d="M${F(W/2)} ${F(H/2-Math.min(W,H)*.07)} v${F(Math.min(W,H)*.1)}" stroke="#2a1a0a" stroke-width="3"/></g>`);
}
function mesaBanquete(t,o={}){
 const {W,H}=t,cor=o.cor||'#5a3420',ouro=o.ouro||OURO;
 mesaRetangular(t,{cor,cadeiras:o.cadeiras!==false,corCadeira:'#3a1a14',corAssento:CARMIM});
 const n=Math.max(2,Math.round(Math.max(W,H)/Math.min(W,H)*2));for(let i=0;i<n;i++){const x=W*(.2+.6*i/(n-1||1));t.add(`<circle cx="${F(x)}" cy="${F(H/2)}" r="${F(Math.min(W,H)*.06)}" fill="${ouro}" stroke="#3a2a10" stroke-width="1.5"/><circle cx="${F(x)}" cy="${F(H/2)}" r="${F(Math.min(W,H)*.025)}" fill="#ffefb0"/>`);}
 t.add(`<path d="M${F(W*.12)} ${F(H/2)} H${F(W*.88)}" stroke="${CARMIM}" stroke-width="${F(Math.min(W,H)*.1)}" opacity=".7"/>`);
}
function armaduraCerimonial(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.42,ouro=o.ouro||OURO,c=o.neon||NEON;
 t.add(`<g filter="${t.sombra(7,9,7,.55)}"><ellipse cx="${F(cx)}" cy="${F(cy)}" rx="${F(R)}" ry="${F(R*.62)}" fill="${t.lin(['#c9ccd2','#6a6e76','#2a2e34'],100)}" stroke="#14161a" stroke-width="3"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.42)}" fill="${t.lin(['#e2e4ea','#7a7e86'],120)}" stroke="#14161a" stroke-width="2"/><path d="M${F(cx-R*.25)} ${F(cy)} h${F(R*.5)}" stroke="${c}" stroke-width="3" filter="${brilho(t,c,3)}"/>`);
 t.add(`<path d="M${F(cx-R*.9)} ${F(cy)} q${F(R*.2)} ${F(-R*.5)} ${F(R*.45)} ${F(-R*.3)} M${F(cx+R*.9)} ${F(cy)} q${F(-R*.2)} ${F(-R*.5)} ${F(-R*.45)} ${F(-R*.3)}" stroke="${ouro}" stroke-width="3" fill="none"/></g>`);
}
function portaoBronze(t,o={}){
 const {W,H}=t,ouro=o.ouro||'#a8742a',vert=H>W;
 t.add(`<g filter="${t.sombra(6,8,6,.5)}"><rect x="${F(W*.03)}" y="${F(H*.03)}" width="${F(W*.94)}" height="${F(H*.94)}" rx="4" fill="${t.lin([tom(ouro,.25),ouro,tom(ouro,-.45)],vert?0:90)}" stroke="#2a1a08" stroke-width="3" filter="${t.relevo({freq:.22,oct:2,escala:.9,elev:58})}"/>`);
 t.add(vert?`<path d="M${F(W*.1)} ${F(H*.5)} H${F(W*.9)}" stroke="#2a1a08" stroke-width="3"/>`:`<path d="M${F(W*.5)} ${F(H*.1)} V${F(H*.9)}" stroke="#2a1a08" stroke-width="3"/>`);
 for(let i=0;i<6;i++){const k=(i+.5)/6;t.add(vert?`<circle cx="${F(W*.5)}" cy="${F(H*k)}" r="${F(W*.08)}" fill="${tom(ouro,.35)}" stroke="#2a1a08" stroke-width="1.5"/>`:`<circle cx="${F(W*k)}" cy="${F(H*.5)}" r="${F(H*.08)}" fill="${tom(ouro,.35)}" stroke="#2a1a08" stroke-width="1.5"/>`);}
 t.add('</g>');
}

// ---------------------------------------------------------------- v138: veículos retrofuturistas, naves, deserto de Véspera
// Tudo visto de cima e desenhado "deitado" (comprimento no eixo X); se o objeto for mais alto que largo, gira 90°.
function deitado(t){const {W,H}=t,horiz=W>=H,L=horiz?W:H,E=horiz?H:W;return {L,E,abre:horiz?'<g>':`<g transform="rotate(90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})">`};}
function flutua(t,cx,cy,rx,ry,cor=NEON){t.add(`<ellipse cx="${F(cx)}" cy="${F(cy)}" rx="${F(rx)}" ry="${F(ry)}" fill="${cor}" opacity=".35" filter="${brilho(t,cor,Math.max(4,ry*.25))}"/>`);}
// Aerocarro: casco oval de carro antigo (anos 50) com cúpula de vidro, rabetas e brilho de levitação.
function aerocarro(t,o={}){
 const {L,E,abre}=deitado(t),cor=o.cor||'#2a9a9a',cromo=o.cromo||'#e8e2d0',cx=L/2,cy=E/2;
 t.add(abre);flutua(t,cx,cy+E*.04,L*.44,E*.4,o.luz||NEON);
 t.add(`<g filter="${t.sombra(9,11,8,.5)}">`);
 // rabetas (traseira à esquerda)
 for(const s of [-1,1])t.add(`<path d="M${F(L*.2)} ${F(cy+s*E*.18)} Q${F(L*.06)} ${F(cy+s*E*.42)} ${F(L*.02)} ${F(cy+s*E*.47)} Q${F(L*.14)} ${F(cy+s*E*.3)} ${F(L*.3)} ${F(cy+s*E*.3)}Z" fill="${tom(cor,-.2)}" stroke="#0a0a0a" stroke-width="2"/>`);
 t.add(`<path d="M${F(L*.06)} ${F(cy)} C${F(L*.06)} ${F(cy-E*.42)} ${F(L*.7)} ${F(cy-E*.46)} ${F(L*.96)} ${F(cy-E*.12)} Q${F(L*.99)} ${F(cy)} ${F(L*.96)} ${F(cy+E*.12)} C${F(L*.7)} ${F(cy+E*.46)} ${F(L*.06)} ${F(cy+E*.42)} ${F(L*.06)} ${F(cy)}Z" fill="${t.rad(cor,{claro:.4,cx:45,cy:30})}" stroke="#0a0a0a" stroke-width="2.5"/>`);
 t.add(`<path d="M${F(L*.12)} ${F(cy)} C${F(L*.14)} ${F(cy-E*.3)} ${F(L*.68)} ${F(cy-E*.34)} ${F(L*.9)} ${F(cy-E*.08)}" stroke="${cromo}" stroke-width="${F(E*.03)}" fill="none" opacity=".85"/><path d="M${F(L*.12)} ${F(cy)} C${F(L*.14)} ${F(cy+E*.3)} ${F(L*.68)} ${F(cy+E*.34)} ${F(L*.9)} ${F(cy+E*.08)}" stroke="${cromo}" stroke-width="${F(E*.03)}" fill="none" opacity=".85"/>`);
 t.add(`<ellipse cx="${F(L*.56)}" cy="${F(cy)}" rx="${F(L*.19)}" ry="${F(E*.25)}" fill="${t.lin(['#123044','#7fd6ff','#1a3a52'],70)}" stroke="#0a0a0a" stroke-width="2" opacity=".92"/><ellipse cx="${F(L*.6)}" cy="${F(cy-E*.1)}" rx="${F(L*.09)}" ry="${F(E*.06)}" fill="#fff" opacity=".45"/>`);
 t.add(`<circle cx="${F(L*.51)}" cy="${F(cy+E*.05)}" r="${F(E*.07)}" fill="${tom(o.banco||'#c9452a',-.1)}" opacity=".8"/>`);
 for(const s of [-1,1])t.add(`<circle cx="${F(L*.93)}" cy="${F(cy+s*E*.1)}" r="${F(E*.05)}" fill="#fff6c9" filter="${brilho(t,'#fff6c9',3)}"/><circle cx="${F(L*.04)}" cy="${F(cy+s*E*.44)}" r="${F(E*.035)}" fill="#ff4a3a"/>`);
 t.add('</g></g>');
}
// Cargueiro flutuante: cabine-cápsula na frente e baú arredondado com nervuras (caminhão retrô).
function cargueiroFlutuante(t,o={}){
 const {L,E,abre}=deitado(t),cor=o.cor||'#e8743a',bau=o.bau||'#d9cdb0',cy=E/2;
 t.add(abre);flutua(t,L*.5,cy,L*.47,E*.42,o.luz||'#ffb35a');
 t.add(`<g filter="${t.sombra(10,12,9,.55)}">`);
 t.add(`<rect x="${F(L*.03)}" y="${F(E*.08)}" width="${F(L*.66)}" height="${F(E*.84)}" rx="${F(E*.32)}" fill="${t.lin([tom(bau,.2),bau,tom(bau,-.3)],90)}" stroke="#1a1a1a" stroke-width="2.5"/>`);
 for(let i=1;i<8;i++)t.add(`<path d="M${F(L*.03+L*.66*i/8)} ${F(E*.12)} V${F(E*.88)}" stroke="${tom(bau,-.35)}" stroke-width="2.5"/>`);
 t.add(`<path d="M${F(L*.08)} ${F(cy)} H${F(L*.64)}" stroke="${cor}" stroke-width="${F(E*.08)}" opacity=".85"/>`);
 t.add(`<path d="M${F(L*.7)} ${F(E*.12)} H${F(L*.82)} Q${F(L*.99)} ${F(E*.14)} ${F(L*.99)} ${F(cy)} Q${F(L*.99)} ${F(E*.86)} ${F(L*.82)} ${F(E*.88)} H${F(L*.7)}Z" fill="${t.rad(cor,{claro:.35})}" stroke="#1a1a1a" stroke-width="2.5"/>`);
 t.add(`<path d="M${F(L*.84)} ${F(E*.22)} Q${F(L*.95)} ${F(E*.26)} ${F(L*.95)} ${F(cy)} Q${F(L*.95)} ${F(E*.74)} ${F(L*.84)} ${F(E*.78)}Z" fill="${t.lin(['#123044','#7fd6ff','#1a3a52'],90)}" stroke="#0a0a0a" stroke-width="1.5"/>`);
 for(const s of [.25,.75])t.add(`<circle cx="${F(L*.975)}" cy="${F(E*s)}" r="${F(E*.04)}" fill="#fff6c9"/>`);
 t.add('</g></g>');
}
// Carroça das areias: arcaica — rodas altas, lona listrada em arco e varais para o animal.
function carrocaAreia(t,o={}){
 const {L,E,abre}=deitado(t),lona=o.lona||'#d8c8a0',faixa=o.faixa||'#b0402a',mad='#6a4a2a',cy=E/2;
 t.add(abre);t.add(`<g filter="${t.sombra(8,10,7,.5)}">`);
 for(const s of [-1,1])t.add(`<path d="M${F(L*.72)} ${F(cy+s*E*.18)} L${F(L*.99)} ${F(cy+s*E*.08)}" stroke="${mad}" stroke-width="${F(E*.05)}" stroke-linecap="round"/>`);
 for(const [x,s] of [[.2,-1],[.2,1],[.55,-1],[.55,1]])t.add(`<rect x="${F(L*x)}" y="${F(s<0?E*.02:E*.86)}" width="${F(L*.14)}" height="${F(E*.12)}" rx="3" fill="#2a1e14" stroke="#120c08" stroke-width="2"/>`);
 t.add(`<rect x="${F(L*.06)}" y="${F(E*.12)}" width="${F(L*.68)}" height="${F(E*.76)}" rx="6" fill="${mad}" stroke="#2a1a0e" stroke-width="2.5" filter="${t.grao({})}"/>`);
 t.add(`<rect x="${F(L*.1)}" y="${F(E*.1)}" width="${F(L*.56)}" height="${F(E*.8)}" rx="${F(E*.3)}" fill="${t.lin([tom(lona,-.25),lona,tom(lona,.2),lona,tom(lona,-.25)],0)}" stroke="#3a2e1e" stroke-width="2"/>`);
 for(let i=0;i<5;i++)t.add(`<path d="M${F(L*(.16+i*.11))} ${F(E*.12)} V${F(E*.88)}" stroke="${i%2?faixa:'#8a6a40'}" stroke-width="${F(E*.04)}" opacity=".8"/>`);
 t.add(`<rect x="${F(L*.67)}" y="${F(E*.3)}" width="${F(L*.06)}" height="${F(E*.4)}" fill="#8a5a2a" stroke="#2a1a0e" stroke-width="1.5"/>`);
 t.add('</g></g>');
}
// Naves (vista de cima). forma: cargueiro (nave do grupo), caca, transporte, disco.
function nave(t,o={}){
 const {L,E,abre}=deitado(t),cor=o.cor||'#8a9098',faixa=o.faixa||LARANJA,mot=o.motor||'#ffb35a',cy=E/2,forma=o.forma||'cargueiro';
 t.add(abre);
 const motor=(x,y,r)=>t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(r*1.6)}" fill="${mot}" opacity=".5" filter="${brilho(t,mot,r*.8)}"/><circle cx="${F(x)}" cy="${F(y)}" r="${F(r)}" fill="#2a2e34" stroke="#0a0c10" stroke-width="2"/><circle cx="${F(x)}" cy="${F(y)}" r="${F(r*.6)}" fill="${tom(mot,.4)}"/>`);
 const casco=(d)=>t.add(`<path d="${d}" fill="${t.lin([tom(cor,.3),cor,tom(cor,-.35)],100)}" stroke="#0e1014" stroke-width="3" filter="${t.relevo({freq:.06,oct:3,escala:1.6,elev:40})}"/>`);
 const vidro=(x,y,rx,ry)=>t.add(`<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(rx)}" ry="${F(ry)}" fill="${t.lin(['#0e2234','#6fd0ff','#123044'],60)}" stroke="#0a0a0a" stroke-width="2"/><ellipse cx="${F(x+rx*.2)}" cy="${F(y-ry*.35)}" rx="${F(rx*.4)}" ry="${F(ry*.22)}" fill="#fff" opacity=".45"/>`);
 t.add(`<g filter="${t.sombra(14,18,12,.55)}">`);
 if(forma==='caca'){
  casco(`M${F(L*.98)} ${F(cy)} L${F(L*.55)} ${F(cy-E*.1)} L${F(L*.25)} ${F(E*.03)} L${F(L*.08)} ${F(E*.05)} L${F(L*.2)} ${F(cy-E*.12)} L${F(L*.05)} ${F(cy-E*.08)} L${F(L*.05)} ${F(cy+E*.08)} L${F(L*.2)} ${F(cy+E*.12)} L${F(L*.08)} ${F(E*.95)} L${F(L*.25)} ${F(E*.97)} L${F(L*.55)} ${F(cy+E*.1)}Z`);
  t.add(`<path d="M${F(L*.3)} ${F(E*.12)} L${F(L*.5)} ${F(cy-E*.08)} M${F(L*.3)} ${F(E*.88)} L${F(L*.5)} ${F(cy+E*.08)}" stroke="${faixa}" stroke-width="${F(E*.03)}"/>`);
  vidro(L*.68,cy,L*.1,E*.06);motor(L*.06,cy-E*.05,E*.04);motor(L*.06,cy+E*.05,E*.04);
 }else if(forma==='transporte'){
  casco(`M${F(L*.04)} ${F(cy)} C${F(L*.04)} ${F(E*.1)} ${F(L*.8)} ${F(E*.08)} ${F(L*.98)} ${F(cy)} C${F(L*.8)} ${F(E*.92)} ${F(L*.04)} ${F(E*.9)} ${F(L*.04)} ${F(cy)}Z`);
  for(const s of [-1,1])t.add(`<path d="M${F(L*.12)} ${F(cy+s*E*.3)} L${F(L*.02)} ${F(cy+s*E*.49)} L${F(L*.26)} ${F(cy+s*E*.34)}Z" fill="${tom(cor,-.25)}" stroke="#0e1014" stroke-width="2"/>`);
  t.add(`<path d="M${F(L*.1)} ${F(cy)} H${F(L*.9)}" stroke="${faixa}" stroke-width="${F(E*.05)}" opacity=".9"/>`);
  for(let i=0;i<10;i++)for(const s of [-1,1])t.add(`<circle cx="${F(L*(.2+i*.065))}" cy="${F(cy+s*E*.2)}" r="${F(E*.03)}" fill="#ffe9a8" stroke="#3a3020" stroke-width="1.5"/>`);
  vidro(L*.88,cy,L*.06,E*.14);for(const k of [-.18,0,.18])motor(L*.05,cy+E*k,E*.06);
 }else if(forma==='disco'){
  const R=Math.min(L,E)*.46;
  t.add(`<circle cx="${F(L/2)}" cy="${F(cy)}" r="${F(R)}" fill="${t.rad(cor,{claro:.35})}" stroke="#0e1014" stroke-width="3"/><circle cx="${F(L/2)}" cy="${F(cy)}" r="${F(R*.8)}" fill="none" stroke="${tom(cor,-.3)}" stroke-width="2"/>`);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;t.add(`<circle cx="${F(L/2+Math.cos(a)*R*.9)}" cy="${F(cy+Math.sin(a)*R*.9)}" r="${F(R*.05)}" fill="${i%2?faixa:'#ffe9a8'}" filter="${brilho(t,i%2?faixa:'#ffe9a8',2)}"/>`);}
  vidro(L/2,cy,R*.42,R*.42);
 }else{ // cargueiro: casco robusto com nariz arredondado, dois motores e rampa de carga
  casco(`M${F(L*.08)} ${F(E*.16)} H${F(L*.62)} Q${F(L*.98)} ${F(E*.2)} ${F(L*.98)} ${F(cy)} Q${F(L*.98)} ${F(E*.8)} ${F(L*.62)} ${F(E*.84)} H${F(L*.08)} Q${F(L*.03)} ${F(cy)} ${F(L*.08)} ${F(E*.16)}Z`);
  for(const s of [-1,1]){t.add(`<rect x="${F(L*.04)}" y="${F(s<0?E*.02:E*.78)}" width="${F(L*.42)}" height="${F(E*.2)}" rx="${F(E*.09)}" fill="${t.lin([tom(cor,.15),tom(cor,-.15),tom(cor,-.45)],90)}" stroke="#0e1014" stroke-width="2.5"/>`);motor(L*.04,s<0?E*.12:E*.88,E*.075);}
  t.add(`<path d="M${F(L*.1)} ${F(cy)} H${F(L*.9)}" stroke="${faixa}" stroke-width="${F(E*.06)}"/><path d="M${F(L*.16)} ${F(E*.24)} H${F(L*.6)} M${F(L*.16)} ${F(E*.76)} H${F(L*.6)}" stroke="#0e1014" stroke-width="1.5" opacity=".5"/>`);
  t.add(`<rect x="${F(L*.1)}" y="${F(cy-E*.14)}" width="${F(L*.16)}" height="${F(E*.28)}" rx="4" fill="#3a3e44" stroke="#0e1014" stroke-width="2"/>`);
  for(let i=0;i<4;i++)t.add(`<path d="M${F(L*.12)} ${F(cy-E*.11+i*E*.07)} l${F(L*.05)} ${F(E*.03)} l${F(-L*.05)} ${F(E*.03)}" stroke="#ffd447" stroke-width="2" fill="none"/>`);
  for(let i=0;i<5;i++)for(const s of [-1,1])t.add(`<circle cx="${F(L*(.32+i*.07))}" cy="${F(cy+s*E*.2)}" r="${F(E*.025)}" fill="#ffe9a8" stroke="#3a3020" stroke-width="1.2"/>`);
  vidro(L*.86,cy,L*.07,E*.17);
  if(o.inscricao)t.add(`<text x="${F(L*.45)}" y="${F(cy-E*.06)}" text-anchor="middle" font-family="Arial Black,Arial" font-size="${F(E*.07)}" fill="${tom(faixa,.5)}" opacity=".9">${String(o.inscricao).replace(/[<&>]/g,"")}</text>`);
 }
 t.add('</g></g>');
}
// Barraca de feira: toldo listrado de quatro águas, mastros e mercadoria na frente.
function barraca(t,o={}){
 const {W,H}=t,c1=o.cor||'#c9452a',c2=o.cor2||'#efe2c4',m=Math.min(W,H)*.06;
 t.add(`<g filter="${t.sombra(8,10,8,.5)}">`);
 const listras=t.lin(Array.from({length:9},(_,i)=>i%2?c2:c1),0);
 t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="6" fill="${listras}" stroke="#2a1a10" stroke-width="2.5"/>`);
 t.add(`<path d="M${F(m)} ${F(m)} L${F(W/2)} ${F(H/2)} L${F(W-m)} ${F(m)} M${F(m)} ${F(H-m)} L${F(W/2)} ${F(H/2)} L${F(W-m)} ${F(H-m)}" stroke="#000" stroke-width="2" opacity=".35"/>`);
 t.add(`<path d="M${F(W/2)} ${F(H/2)} L${F(W-m)} ${F(m)} L${F(W-m)} ${F(H-m)}Z" fill="#000" opacity=".14"/><path d="M${F(W/2)} ${F(H/2)} L${F(m)} ${F(H-m)} L${F(W-m)} ${F(H-m)}Z" fill="#000" opacity=".22"/>`);
 for(let i=0;i<14;i++){const x=m+(W-2*m)*(i+.5)/14;t.add(`<path d="M${F(x)} ${F(H-m)} l${F((W-2*m)/28)} ${F(m*.9)} l${F((W-2*m)/28)} ${F(-m*.9)}" fill="${i%2?c1:c2}" stroke="#2a1a10" stroke-width="1"/>`);}
 for(const [x,y] of [[m,m],[W-m,m],[m,H-m],[W-m,H-m]])t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(m*.5)}" fill="#5a3a20" stroke="#1a0e06" stroke-width="1.5"/>`);
 t.add(`<circle cx="${F(W/2)}" cy="${F(H/2)}" r="${F(m*.5)}" fill="${OURO}" stroke="#3a2a10" stroke-width="1.5"/></g>`);
}
// Plataforma de pouso: círculo de concreto com faixas de perigo e luzes.
function plataforma(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.48;
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${t.rad(o.cor||'#8a8478',{claro:.15,escuro:-.25})}" stroke="#3a3630" stroke-width="4" filter="${t.relevo({freq:.09,oct:3,escala:1.4,elev:35})}"/>`);
 const n=36;for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=(i+.5)/n*Math.PI*2,r1=R*.86,r2=R*.94;t.add(`<path d="M${F(cx+Math.cos(a0)*r1)} ${F(cy+Math.sin(a0)*r1)} A${F(r1)} ${F(r1)} 0 0 1 ${F(cx+Math.cos(a1)*r1)} ${F(cy+Math.sin(a1)*r1)} L${F(cx+Math.cos(a1)*r2)} ${F(cy+Math.sin(a1)*r2)} A${F(r2)} ${F(r2)} 0 0 0 ${F(cx+Math.cos(a0)*r2)} ${F(cy+Math.sin(a0)*r2)}Z" fill="#ffd447" opacity=".85"/>`);}
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.55)}" fill="none" stroke="#efe2c4" stroke-width="${F(R*.03)}" stroke-dasharray="${F(R*.12)} ${F(R*.08)}" opacity=".8"/>`);
 for(const a of [0,90,180,270])t.add(`<path d="M${F(cx)} ${F(cy-R*.75)} l${F(R*.08)} ${F(R*.12)} h${F(-R*.16)}Z" fill="#efe2c4" transform="rotate(${a} ${F(cx)} ${F(cy)})" opacity=".85"/>`);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;t.add(`<circle cx="${F(cx+Math.cos(a)*R*.98)}" cy="${F(cy+Math.sin(a)*R*.98)}" r="${F(R*.025)}" fill="#7fffd4" filter="${brilho(t,'#7fffd4',3)}"/>`);}
}
// Torre de controle: base redonda, anel de janelas e antena parabólica.
function torreControle(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.45,cor=o.cor||'#c9b98f';
 t.add(`<g filter="${t.sombra(10,14,10,.55)}"><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${t.rad(cor,{claro:.3})}" stroke="#2a2418" stroke-width="3"/>`);
 const n=16;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;t.add(`<rect x="${F(cx+Math.cos(a)*R*.78-R*.07)}" y="${F(cy+Math.sin(a)*R*.78-R*.05)}" width="${F(R*.14)}" height="${F(R*.1)}" rx="2" fill="#7fd6ff" stroke="#0a1a24" stroke-width="1.2" transform="rotate(${F(a*180/Math.PI+90)} ${F(cx+Math.cos(a)*R*.78)} ${F(cy+Math.sin(a)*R*.78)})"/>`);}
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.55)}" fill="${t.rad(tom(cor,-.1))}" stroke="#2a2418" stroke-width="2"/><ellipse cx="${F(cx+R*.15)}" cy="${F(cy-R*.1)}" rx="${F(R*.28)}" ry="${F(R*.2)}" fill="#e8e2d0" stroke="#3a3428" stroke-width="2"/><path d="M${F(cx+R*.15)} ${F(cy-R*.1)} l${F(R*.3)} ${F(-R*.3)}" stroke="#3a3428" stroke-width="3"/><circle cx="${F(cx+R*.45)}" cy="${F(cy-R*.4)}" r="${F(R*.05)}" fill="#ff4a3a" filter="${brilho(t,'#ff4a3a',3)}"/></g>`);
}
// Portão de rocha de Véspera: duas folhas de metal rebitado presas em blocos de pedra.
function portaoRocha(t,o={}){
 const {W,H}=t,vert=H>W,L=vert?H:W,E=vert?W:H,rocha=o.rocha||'#9a8a74',metal=o.metal||'#5a4a3a';
 t.add(vert?`<g transform="rotate(90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})">`:'<g>');
 t.add(`<g filter="${t.sombra(6,8,6,.5)}">`);
 for(const x of [0,L*.86])t.add(`<rect x="${F(x)}" y="0" width="${F(L*.14)}" height="${F(E)}" rx="6" fill="${t.rad(rocha,{claro:.2})}" stroke="#3a3024" stroke-width="3" filter="${t.relevo({freq:.12,oct:4,escala:2.2})}"/>`);
 for(const [x,w] of [[L*.14,L*.36],[L*.5,L*.36]]){t.add(`<rect x="${F(x)}" y="${F(E*.18)}" width="${F(w)}" height="${F(E*.64)}" fill="${t.lin([tom(metal,.25),metal,tom(metal,-.4)],90)}" stroke="#1a120a" stroke-width="2.5"/>`);
  for(let i=1;i<4;i++)t.add(`<path d="M${F(x+w*i/4)} ${F(E*.18)} V${F(E*.82)}" stroke="#1a120a" stroke-width="2" opacity=".6"/>`);
  for(let i=0;i<6;i++)for(const yy of [.26,.74])t.add(`<circle cx="${F(x+w*(i+.5)/6)}" cy="${F(E*yy)}" r="${F(E*.035)}" fill="${tom(metal,.45)}"/>`);}
 t.add(`<path d="M${F(L*.5)} ${F(E*.12)} V${F(E*.88)}" stroke="#ffd447" stroke-width="3" opacity=".7"/></g></g>`);
}

// ---------------------------------------------------------------- v139: móveis soltos, feira, rua e escada
// Banco de praça / banco corrido (sentável).
function bancoPraca(t,o={}){
 const {L,E,abre}=deitado(t),mad=o.cor||'#8a5a34',ferro=o.ferro||'#2a2e34';
 t.add(abre);t.add(`<g filter="${t.sombra(5,7,5,.5)}">`);
 for(const x of [.08,.88])t.add(`<rect x="${F(L*x)}" y="${F(E*.08)}" width="${F(L*.04)}" height="${F(E*.84)}" rx="3" fill="${ferro}"/>`);
 const gr=t.grao({freqX:.004,freqY:.35,forca:.5});
 for(let i=0;i<4;i++)t.add(`<rect x="${F(L*.04)}" y="${F(E*(.14+i*.19))}" width="${F(L*.92)}" height="${F(E*.15)}" rx="3" fill="${tom(mad,i%2?-.08:.05)}" stroke="${tom(mad,-.5)}" stroke-width="1.5" filter="${gr.url}"/>`);
 t.add('</g></g>');
}
// Máquina de venda (vista de cima): gabinete com vitrine iluminada e painel.
function maquinaVenda(t,o={}){
 const {W,H}=t,cor=o.cor||'#c9452a',neon=o.neon||NEON,m=Math.min(W,H)*.06;
 t.add(`<g filter="${t.sombra(7,9,7,.55)}"><rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="8" fill="${t.lin([tom(cor,.25),cor,tom(cor,-.4)],90)}" stroke="#14161a" stroke-width="3"/>`);
 t.add(`<rect x="${F(W*.12)}" y="${F(H*.55)}" width="${F(W*.6)}" height="${F(H*.32)}" rx="4" fill="${t.lin(['#0e2234','#3fa0d0','#0e2234'],0)}" stroke="#0a0a0a" stroke-width="2"/>`);
 for(let i=0;i<4;i++)t.add(`<rect x="${F(W*(.16+i*.14))}" y="${F(H*.62)}" width="${F(W*.09)}" height="${F(H*.18)}" rx="2" fill="${['#ffd447','#57e3a1','#ff4fd8','#ffb35a'][i]}" opacity=".85"/>`);
 t.add(`<rect x="${F(W*.76)}" y="${F(H*.55)}" width="${F(W*.12)}" height="${F(H*.32)}" rx="3" fill="#1a1e24"/><circle cx="${F(W*.82)}" cy="${F(H*.64)}" r="${F(W*.03)}" fill="${neon}" filter="${brilho(t,neon,3)}"/>`);
 t.add(`<rect x="${F(W*.12)}" y="${F(H*.16)}" width="${F(W*.76)}" height="${F(H*.22)}" rx="4" fill="${tom(cor,.45)}" opacity=".9"/><path d="M${F(W*.18)} ${F(H*.27)} H${F(W*.82)}" stroke="${neon}" stroke-width="3" filter="${brilho(t,neon,3)}"/></g>`);
}
// Banca de panelas: balcão de comida com caldeirões fumegantes.
function bancaPanelas(t,o={}){
 const {W,H}=t,mad=o.cor||'#6a4a2a',m=Math.min(W,H)*.05;
 t.add(`<g filter="${t.sombra(7,9,7,.55)}">`);
 const gr=t.grao({freqX:.005,freqY:.3,forca:.5});
 t.add(`<rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="6" fill="${mad}" stroke="${tom(mad,-.55)}" stroke-width="3" filter="${gr.url}"/>`);
 const n=Math.max(2,Math.round(W/H*2));
 for(let i=0;i<n;i++){const cx=W*(i+.5)/n,cy=H*(i%2?.62:.4),R=Math.min(W/n,H)*.3;
  t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${t.rad('#3a3e44',{claro:.3})}" stroke="#0e1014" stroke-width="2.5"/><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.78)}" fill="${['#c9762a','#7a9a3a','#b0402a','#d9b04a'][i%4]}"/>`);
  t.add(`<ellipse cx="${F(cx+R*.2)}" cy="${F(cy-R*.3)}" rx="${F(R*.6)}" ry="${F(R*.35)}" fill="#fff" opacity=".28" filter="${brilho(t,'#ffffff',R*.25)}"/>`);}
 t.add('</g>');
}
// Poste de luz (vista de cima): base, braço e luminária.
function posteLuz(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.42,cor=o.cor||'#2a2e34',luz=o.luz||'#ffe9a8';
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.9)}" fill="${luz}" opacity=".18"/><g filter="${t.sombra(4,6,4,.5)}"><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.32)}" fill="${t.rad(cor,{claro:.35})}" stroke="#0a0a0a" stroke-width="2"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.55)}" fill="none" stroke="${tom(cor,.2)}" stroke-width="${F(R*.08)}"/><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.2)}" fill="${luz}" filter="${brilho(t,luz,4)}"/></g>`);
}
// Escada (vista de cima): degraus com corrimão; a seta aponta o sentido de subida.
function escada(t,o={}){
 const {L,E,abre}=deitado(t),cor=o.cor||'#7a6a58';
 t.add(abre);t.add(`<g filter="${t.sombra(5,7,5,.5)}"><rect x="0" y="0" width="${F(L)}" height="${F(E)}" rx="4" fill="${tom(cor,-.3)}" stroke="#1a140e" stroke-width="2.5"/>`);
 const n=Math.max(5,Math.round(L/E*4));for(let i=0;i<n;i++){const x=L*i/n;t.add(`<rect x="${F(x+2)}" y="${F(E*.1)}" width="${F(L/n-4)}" height="${F(E*.8)}" fill="${tom(cor,.05+i/n*.35)}" stroke="${tom(cor,-.45)}" stroke-width="1.2"/>`);}
 for(const y of [.05,.95])t.add(`<path d="M2 ${F(E*y)} H${F(L-2)}" stroke="#2a2420" stroke-width="${F(E*.06)}"/>`);
 t.add(`<path d="M${F(L*.3)} ${F(E/2)} H${F(L*.75)} M${F(L*.65)} ${F(E*.32)} L${F(L*.77)} ${F(E/2)} L${F(L*.65)} ${F(E*.68)}" stroke="#ffd447" stroke-width="${F(E*.07)}" fill="none" stroke-linecap="round" opacity=".85"/></g></g>`);
}
// Fonte da praça: bacia redonda com água e jato no meio.
function fonte(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)*.47,pedra=o.cor||'#c9b98f';
 t.add(`<g filter="${t.sombra(6,8,6,.45)}"><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${t.rad(pedra,{claro:.25})}" stroke="#5a5040" stroke-width="3" filter="${t.relevo({freq:.1,oct:3,escala:1.5})}"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.82)}" fill="${t.rad('#3fa0c0',{claro:.35,escuro:-.2})}"/><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.25)}" fill="${pedra}" stroke="#5a5040" stroke-width="2"/>`);
 for(let i=0;i<3;i++)t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*(.38+i*.14))}" fill="none" stroke="#fff" stroke-width="1.5" opacity="${(.4-i*.1).toFixed(2)}"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.1)}" fill="#e8f8ff" filter="${brilho(t,'#bff6ff',4)}"/></g>`);
}
// Estante / prateleira de arquivo encostada na parede.
function estanteArquivo(t,o={}){
 const {L,E,abre}=deitado(t),cor=o.cor||'#5a4030';
 t.add(abre);const gr=t.grao({freqX:.004,freqY:.3,forca:.5});
 t.add(`<g filter="${t.sombra(5,7,5,.5)}"><rect x="0" y="0" width="${F(L)}" height="${F(E)}" rx="3" fill="${cor}" stroke="${tom(cor,-.55)}" stroke-width="2.5" filter="${gr.url}"/>`);
 const n=Math.max(4,Math.round(L/E*3));for(let i=0;i<n;i++){const x=L*(i+.1)/n,w=L*.8/n;t.add(`<rect x="${F(x)}" y="${F(E*.15)}" width="${F(w)}" height="${F(E*.7)}" fill="${['#8a2a2a','#2a4a7a','#c9a24a','#3a6a3a','#e6d6b0'][i%5]}" stroke="#14100c" stroke-width="1"/>`);}
 t.add('</g></g>');
}

// v146: beliche visto de cima (estrutura de metal, colchão de cima, a ponta do de baixo aparecendo e a escadinha do lado).
function beliche(t,o={}){
 const {W,H}=t,vert=H>W,w=vert?W:H,h=vert?H:W,rot=vert?'':`transform="rotate(-90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})"`;
 const metal=o.metal||'#4a5560',colcha=o.colcha||'#3a6a8a',baixo=o.colcha2||'#7a4a3a';
 t.add(`<g ${rot}>`);
 // cama de baixo (aparece um pouco para o lado e embaixo)
 t.add(`<rect x="${F(w*.16)}" y="${F(h*.07)}" width="${F(w*.8)}" height="${F(h*.9)}" rx="5" fill="${tom(baixo,-.15)}" stroke="#1a1410" stroke-width="2"/>`);
 t.add(`<rect x="${F(w*.2)}" y="${F(h*.72)}" width="${F(w*.72)}" height="${F(h*.22)}" fill="${t.rad(baixo,{claro:.1})}" opacity=".9"/>`);
 // cama de cima, com sombra sobre a de baixo
 t.add(`<g filter="${t.sombra(10,12,9,.6)}"><rect x="${F(w*.04)}" y="${F(h*.02)}" width="${F(w*.8)}" height="${F(h*.9)}" rx="5" fill="${t.lin([tom(metal,.25),metal],0)}" stroke="#141a20" stroke-width="2.5"/>`);
 t.add(`<rect x="${F(w*.09)}" y="${F(h*.05)}" width="${F(w*.7)}" height="${F(h*.84)}" rx="6" fill="#e8e4da" stroke="#8a867c" stroke-width="1.4"/>`);
 t.add(`<rect x="${F(w*.13)}" y="${F(h*.08)}" width="${F(w*.62)}" height="${F(h*.14)}" rx="9" fill="${t.rad('#f6f3ec',{claro:.4})}" stroke="#b9b2a6" stroke-width="1.3"/>`);
 t.add(`<path d="M${F(w*.09)} ${F(h*.34)} Q${F(w*.44)} ${F(h*.3)} ${F(w*.79)} ${F(h*.34)} V${F(h*.89)} H${F(w*.09)}Z" fill="${t.rad(colcha,{claro:.15})}" stroke="${tom(colcha,-.45)}" stroke-width="1.6"/>`);
 for(let i=0;i<3;i++){const y=h*(.5+i*.12);t.add(`<path d="M${F(w*.13)} ${F(y)} Q${F(w*.44)} ${F(y+h*.015)} ${F(w*.75)} ${F(y)}" stroke="${tom(colcha,-.3)}" stroke-width="1.4" fill="none" opacity=".45"/>`);}
 // grade de proteção de um lado e colunas nos cantos
 t.add(`<path d="M${F(w*.05)} ${F(h*.06)} V${F(h*.5)}" stroke="${tom(metal,-.3)}" stroke-width="${F(w*.035)}" stroke-linecap="round"/>`);
 for(const [a,b] of [[.04,.02],[.84,.02],[.04,.92],[.84,.92]])t.add(`<rect x="${F(w*a-w*.02)}" y="${F(h*b-w*.02)}" width="${F(w*.07)}" height="${F(w*.07)}" rx="2" fill="${tom(metal,-.35)}" stroke="#0e1216" stroke-width="1.2"/>`);
 t.add('</g>');
 // escadinha no lado comprido
 const ex=w*.86,ey0=h*.55,ey1=h*.9;t.add(`<g><path d="M${F(ex)} ${F(ey0)} V${F(ey1)} M${F(ex+w*.11)} ${F(ey0)} V${F(ey1)}" stroke="${tom(metal,.2)}" stroke-width="${F(w*.03)}" stroke-linecap="round"/>`);
 for(let i=0;i<5;i++){const y=ey0+(ey1-ey0)*(i+.5)/5;t.add(`<path d="M${F(ex)} ${F(y)} H${F(ex+w*.11)}" stroke="${tom(metal,.35)}" stroke-width="${F(w*.025)}"/>`);}
 t.add('</g></g>');
}
// v146: escada interna larga, vista de cima, subindo para o norte (sem seta: os degraus clareiam para cima e há corrimão dos dois lados).
function escadaInterna(t,o={}){
 const {W,H}=t,vert=H>=W,w=vert?W:H,h=vert?H:W,rot=vert?'':`transform="rotate(-90 ${F(W/2)} ${F(H/2)}) translate(${F((W-H)/2)} ${F((H-W)/2)})"`;
 const cor=o.cor||'#5a6470',n=Math.max(8,Math.round(h/w*5));
 t.add(`<g ${rot} filter="${t.sombra(6,8,6,.5)}"><rect x="0" y="0" width="${F(w)}" height="${F(h)}" rx="3" fill="${tom(cor,-.45)}" stroke="#10141a" stroke-width="3"/>`);
 const m=w*.12,pat=h*.1; // patamar em cima
 t.add(`<rect x="${F(m)}" y="${F(h*.01)}" width="${F(w-2*m)}" height="${F(pat)}" fill="${tom(cor,.42)}" stroke="${tom(cor,-.5)}" stroke-width="1.5"/>`);
 for(let i=0;i<n;i++){const y=pat+h*.01+(h*.98-pat)*i/n,hh=(h*.98-pat)/n,claro=.38-(i/n)*.55;
  t.add(`<rect x="${F(m)}" y="${F(y+1)}" width="${F(w-2*m)}" height="${F(hh-2)}" fill="${tom(cor,claro)}" stroke="${tom(cor,-.55)}" stroke-width="1.2"/>`);
  t.add(`<path d="M${F(m+3)} ${F(y+hh-3)} H${F(w-m-3)}" stroke="#d8c060" stroke-width="2" opacity=".5"/>`);}
 for(const x of [m*.5,w-m*.5])t.add(`<path d="M${F(x)} ${F(h*.02)} V${F(h*.98)}" stroke="${tom(cor,.5)}" stroke-width="${F(m*.45)}" stroke-linecap="round"/>`);
 t.add('</g>');
}
// v146: painel de ladrilhos (1 m cada), em xadrez, com rejunte — para cobrir o piso inteiro de um salão sem pesar o mapa.
function ladrilhos(t,o={}){
 const {W,H,r}=t,nx=Math.max(1,Math.round(o.nx||7)),ny=Math.max(1,Math.round(o.ny||7)),c1=o.cor||'#e8dcc0',c2=o.cor2||'#4a9690',rej=o.rejunte||'#4a4038';
 t.add(`<rect x="0" y="0" width="${F(W)}" height="${F(H)}" fill="${rej}"/>`);
 const g=Math.max(1.2,W/nx*.035);
 for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const x=W*i/nx,y=H*j/ny,w=W/nx,h=H/ny,c=tom((i+j)%2?c2:c1,(r()-.5)*.08);
  if(o.bisel){ // v151: ladrilho com bisel (claro em cima/esquerda, escuro embaixo/direita) e brilho
   t.add(`<rect x="${F(x+g)}" y="${F(y+g)}" width="${F(w-2*g)}" height="${F(h-2*g)}" rx="${F(g)}" fill="${tom(c,-.22)}"/>`);
   t.add(`<rect x="${F(x+g)}" y="${F(y+g)}" width="${F(w-2*g-2)}" height="${F(h-2*g-2)}" rx="${F(g)}" fill="${tom(c,.18)}"/>`);
   t.add(`<rect x="${F(x+g+2)}" y="${F(y+g+2)}" width="${F(w-2*g-4)}" height="${F(h-2*g-4)}" rx="${F(g*.8)}" fill="${c}"/>`);
   t.add(`<path d="M${F(x+g+4)} ${F(y+h*.42)} Q${F(x+w*.22)} ${F(y+h*.2)} ${F(x+w*.45)} ${F(y+g+4)}" stroke="#ffffff" stroke-width="${F(w*.035)}" opacity=".18" fill="none" stroke-linecap="round"/>`);
   if(o.losango&&(i+j)%2===0)t.add(`<path d="M${F(x+w/2)} ${F(y+h*.36)} L${F(x+w*.64)} ${F(y+h/2)} L${F(x+w/2)} ${F(y+h*.64)} L${F(x+w*.36)} ${F(y+h/2)}Z" fill="${o.losango}" opacity=".55"/>`);
  }else{
   t.add(`<rect x="${F(x+1.5)}" y="${F(y+1.5)}" width="${F(w-3)}" height="${F(h-3)}" rx="1.5" fill="${c}"/>`);
   t.add(`<path d="M${F(x+3)} ${F(y+h*.3)} L${F(x+w*.3)} ${F(y+3)}" stroke="#fff" stroke-width="1.5" opacity=".14"/>`);}
 }
}

// ---------------------------------------------------------------- catálogo
// ---------------------------------------------------------------- v162: kit do deserto (casas de terraço, cúpulas, barracos, varais, agaves, toldos)
// Inspirado nas vilas de deserto: muros de pedra creme com cantos arredondados, terraço no alto, rachaduras,
// lonas coloridas e plantas douradas. Tudo visto de cima, luz vindo do alto à esquerda.
const KIT={parede:'#ecd3a0',paredeSombra:'#b88f58',piso:'#d6a25e',pisoJunta:'#a8743c',terracota:'#c4532e',teal:'#2f8a86',mostarda:'#dfa62c',rubi:'#b23b2a',creme:'#f3e3bf',madeira:'#8a5a32',chapa:'#9aa3a6'};
// contorno da casa (path) dentro de W×H com margem m; forma: ret | redonda | losango | L | oval
function contornoCasa(forma,W,H,m,enc=0){
 const x0=m+enc,y0=m+enc,x1=W-m-enc,y1=H-m-enc,w=x1-x0,h=y1-y0,rx=Math.max(4,Math.min(w,h)*.16);
 if(forma==='redonda'||forma==='oval'){const cx=(x0+x1)/2,cy=(y0+y1)/2;return `M${F(cx-w/2)} ${F(cy)} A${F(w/2)} ${F(h/2)} 0 1 0 ${F(cx+w/2)} ${F(cy)} A${F(w/2)} ${F(h/2)} 0 1 0 ${F(cx-w/2)} ${F(cy)}Z`;}
 if(forma==='losango'){const cx=(x0+x1)/2,cy=(y0+y1)/2,k=Math.min(w,h)*.09;
  const P=[[cx,y0],[x1,cy],[cx,y1],[x0,cy]];let d='';
  for(let i=0;i<4;i++){const a=P[i],b=P[(i+1)%4],c=P[(i+3)%4],ux=(b[0]-a[0]),uy=(b[1]-a[1]),L1=Math.hypot(ux,uy),vx=(c[0]-a[0]),vy=(c[1]-a[1]),L2=Math.hypot(vx,vy);
   const p1=[a[0]+vx/L2*k,a[1]+vy/L2*k],p2=[a[0]+ux/L1*k,a[1]+uy/L1*k];d+=(i?'L':'M')+F(p1[0])+' '+F(p1[1])+` Q${F(a[0])} ${F(a[1])} ${F(p2[0])} ${F(p2[1])}`;}
  return d+'Z';}
 if(forma==='L'){const cx=x0+w*.55,cy=y0+h*.45,r=rx;
  return `M${F(x0+r)} ${F(y0)} L${F(cx-r)} ${F(y0)} Q${F(cx)} ${F(y0)} ${F(cx)} ${F(y0+r)} L${F(cx)} ${F(cy-r)} Q${F(cx)} ${F(cy)} ${F(cx+r)} ${F(cy)} L${F(x1-r)} ${F(cy)} Q${F(x1)} ${F(cy)} ${F(x1)} ${F(cy+r)} L${F(x1)} ${F(y1-r)} Q${F(x1)} ${F(y1)} ${F(x1-r)} ${F(y1)} L${F(x0+r)} ${F(y1)} Q${F(x0)} ${F(y1)} ${F(x0)} ${F(y1-r)} L${F(x0)} ${F(y0+r)} Q${F(x0)} ${F(y0)} ${F(x0+r)} ${F(y0)}Z`;}
 return `M${F(x0+rx)} ${F(y0)} L${F(x1-rx)} ${F(y0)} Q${F(x1)} ${F(y0)} ${F(x1)} ${F(y0+rx)} L${F(x1)} ${F(y1-rx)} Q${F(x1)} ${F(y1)} ${F(x1-rx)} ${F(y1)} L${F(x0+rx)} ${F(y1)} Q${F(x0)} ${F(y1)} ${F(x0)} ${F(y1-rx)} L${F(x0)} ${F(y0+rx)} Q${F(x0)} ${F(y0)} ${F(x0+rx)} ${F(y0)}Z`;
}
// ponto dentro do contorno (para espalhar objetos no terraço)
function dentroForma(forma,W,H,m,x,y){
 const cx=W/2,cy=H/2,a=W/2-m,b=H/2-m;
 if(forma==='redonda'||forma==='oval')return ((x-cx)/a)**2+((y-cy)/b)**2<.82;
 if(forma==='losango')return Math.abs(x-cx)/a+Math.abs(y-cy)/b<.8;
 if(forma==='L')return x>m*1.5&&y>m*1.5&&x<W-m*1.5&&y<H-m*1.5&&!(x>m+(W-2*m)*.55&&y<m+(H-2*m)*.45);
 return x>m*1.6&&y>m*1.6&&x<W-m*1.6&&y<H-m*1.6;
}
function rachadura(t,x,y,ang,comp,cor='#6a4a2a',lw=1.6){
 let px=x,py=y,d=`M${F(px)} ${F(py)}`;const n=4+Math.floor(t.r()*4);
 for(let i=0;i<n;i++){ang+=t.rr(-.7,.7);const L=comp/n;px+=Math.cos(ang)*L;py+=Math.sin(ang)*L;d+=` L${F(px)} ${F(py)}`;
  if(t.r()<.3){const a2=ang+t.rr(-1.3,1.3);t.add(`<path d="M${F(px)} ${F(py)} l${F(Math.cos(a2)*L*.6)} ${F(Math.sin(a2)*L*.6)}" stroke="${cor}" stroke-width="${F(lw*.7)}" fill="none" opacity=".7"/>`);}}
 t.add(`<path d="${d}" stroke="${cor}" stroke-width="${F(lw)}" fill="none" stroke-linecap="round" opacity=".85"/>`);
}
function vasoPlanta(t,x,y,r,cor){t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(r)}" fill="${t.rad(KIT.terracota)}" stroke="#4a2414" stroke-width="1.5"/>`);
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2+t.r()*.4;folha(t,x,y,a,r*1.6,r*.4,cor||'#7f9b34',{nervura:false});}}
function caixoteTopo(t,x,y,s){t.add(`<g transform="translate(${F(x)} ${F(y)}) rotate(${F(t.rr(-25,25))})"><rect x="${F(-s/2)}" y="${F(-s/2)}" width="${F(s)}" height="${F(s)}" rx="2" fill="${t.lin([tom(KIT.madeira,.25),KIT.madeira],120)}" stroke="#3a2210" stroke-width="2"/><path d="M${F(-s/2)} ${F(-s/2)} L${F(s/2)} ${F(s/2)} M${F(s/2)} ${F(-s/2)} L${F(-s/2)} ${F(s/2)}" stroke="#3a2210" stroke-width="1.6" opacity=".7"/></g>`);}
function tapeteTopo(t,x,y,w,h,c1,c2){t.add(`<g transform="translate(${F(x)} ${F(y)}) rotate(${F(t.rr(-20,20))})"><rect x="${F(-w/2)}" y="${F(-h/2)}" width="${F(w)}" height="${F(h)}" fill="${c1}" stroke="${tom(c1,-.45)}" stroke-width="2"/><rect x="${F(-w/2+w*.12)}" y="${F(-h/2+h*.14)}" width="${F(w*.76)}" height="${F(h*.72)}" fill="none" stroke="${c2}" stroke-width="${F(Math.min(w,h)*.08)}"/><rect x="${F(-w*.12)}" y="${F(-h*.12)}" width="${F(w*.24)}" height="${F(h*.24)}" fill="${c2}" transform="rotate(45)"/></g>`);}
// v162: linha do meio do muro (pontos) para assentar as pedras uma a uma
function linhaMuro(forma,W,H,m,esp){
 const x0=m+esp/2,y0=m+esp/2,x1=W-m-esp/2,y1=H-m-esp/2,cx=W/2,cy=H/2;
 if(forma==='redonda'||forma==='oval'){const a=(x1-x0)/2,b=(y1-y0)/2,n=90;return Array.from({length:n},(_,i)=>[cx+Math.cos(i/n*Math.PI*2)*a,cy+Math.sin(i/n*Math.PI*2)*b]);}
 if(forma==='losango')return [[cx,y0],[x1,cy],[cx,y1],[x0,cy]];
 if(forma==='L'){const ix=m+(W-2*m)*.55,iy=m+(H-2*m)*.45;return [[x0,y0],[ix-esp/2,y0],[ix-esp/2,iy+esp/2],[x1,iy+esp/2],[x1,y1],[x0,y1]];}
 return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
}
// pedras do muro: tamanhos diferentes, juntas desencontradas, algumas faltando ou trincadas, luz no alto à esquerda
function pedrasDoMuro(t,pts,esp,cor){
 // anda pela linha do muro (fechada) somando o comprimento: serve para cantos retos e para curvas
 const n=pts.length,seg=[];let tot=0;for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]);seg.push({a,b,L,ini:tot});tot+=L;}
 const em=d=>{d=((d%tot)+tot)%tot;const s=seg.find(q=>d>=q.ini&&d<=q.ini+q.L)||seg[seg.length-1],u=(d-s.ini)/(s.L||1);return {x:s.a[0]+(s.b[0]-s.a[0])*u,y:s.a[1]+(s.b[1]-s.a[1])*u,ang:Math.atan2(s.b[1]-s.a[1],s.b[0]-s.a[0])*57.2958};};
 let partes='',d=t.rr(0,esp*.5);const fim=tot-esp*.4;
 while(d<fim){const len=Math.min(fim-d,esp*t.rr(.7,1.6));if(len<esp*.3)break;const c0=em(d),c1=em(d+len),meio=em(d+len/2);
  // ângulo pela corda (fica certo nas curvas)
  const ang=Math.abs(c1.ang-c0.ang)<.01?meio.ang:Math.atan2(c1.y-c0.y,c1.x-c0.x)*57.2958,q=t.r(),cxb=meio.x,cyb=meio.y;
  if(q<.06)partes+=`<rect x="${F(-len/2)}" y="${F(-esp*.36)}" width="${F(len)}" height="${F(esp*.72)}" rx="2" fill="#3a2a16" opacity=".55" transform="translate(${F(cxb)} ${F(cyb)}) rotate(${F(ang)})"/>`; // pedra que caiu
  else{const c=tom(cor,t.rr(-.16,.1)),h=esp*t.rr(.7,.86),off=t.rr(-.06,.06)*esp;
   partes+=`<g transform="translate(${F(cxb)} ${F(cyb)}) rotate(${F(ang+t.rr(-2.5,2.5))})"><rect x="${F(-len/2+1)}" y="${F(-h/2+off)}" width="${F(len-2)}" height="${F(h)}" rx="${F(Math.min(5,esp*.18))}" fill="${c}" stroke="${tom(cor,-.55)}" stroke-width="1.3"/><path d="M${F(-len/2+3)} ${F(-h/2+off+2)} h${F(len-6)}" stroke="${tom(c,.45)}" stroke-width="1.6" opacity=".8"/><path d="M${F(-len/2+3)} ${F(h/2+off-2)} h${F(len-6)}" stroke="${tom(c,-.4)}" stroke-width="1.6" opacity=".6"/>`+(q>.9?`<path d="M${F(-len*.2)} ${F(-h/2+off)} l${F(len*.08)} ${F(h*.45)} l${F(-len*.06)} ${F(h*.4)}" stroke="${tom(cor,-.6)}" stroke-width="1" fill="none"/>`:'')+`</g>`;}
  d+=len+esp*t.rr(.06,.16);}
 t.add(`<g>${partes}</g>`);
}
// Casa de terraço: muro grosso de pedra creme, terraço de lajotas por cima (ou pátio aberto, com porta), rachaduras e coisas
function casaTerraco(t,o={}){
 const {W,H}=t,forma=o.forma||'ret',m=Math.min(W,H)*.045,esp=Math.min(W,H)*(o.aberta?.075:.1),parede=o.parede||KIT.parede,piso=o.piso||KIT.piso;
 const ext=contornoCasa(forma,W,H,m),int=contornoCasa(forma,W,H,m,esp);
 t.add(`<g filter="${t.sombra(9,12,9,.55)}"><path d="${ext}" fill="${t.lin([tom(parede,.12),parede,tom(parede,-.12)],135)}" stroke="#4a3418" stroke-width="3"/></g>`);
 // blocos de pedra no muro (juntas) e brilho na quina de cima
 t.add(`<path d="${ext}" fill="none" stroke="${tom(parede,-.5)}" stroke-width="${F(esp*.95)}" opacity=".55" clip-path="${t.clip(ext)}"/>`); // argamassa
 pedrasDoMuro(t,linhaMuro(forma,W,H,m,esp),esp,parede);
 t.add(`<path d="${ext}" fill="none" stroke="#fff6dc" stroke-width="2" opacity=".55" transform="translate(-1.5 -1.5)"/>`);
 // terraço / pátio
 const cint=t.clip(int);
 t.add(`<path d="${int}" fill="${piso}" stroke="#5a3a1a" stroke-width="2.5" filter="${t.relevo({freq:.045,oct:3,escala:2.4,elev:55})}"/>`);
 const lado=Math.min(W,H)*.075;let lj='';for(let y=0;y<H;y+=lado)for(let x=(Math.floor(y/lado)%2)*lado/2;x<W;x+=lado)lj+=`M${F(x)} ${F(y)} h${F(lado)} v${F(lado)}`;
 t.add(`<g clip-path="${cint}"><path d="${lj}" stroke="${o.pisoJunta||KIT.pisoJunta}" stroke-width="1.2" fill="none" opacity=".55"/>`);
 // sombra interna do muro (o terraço é mais baixo que a mureta)
 t.add(`<path d="${int}" fill="none" stroke="#000" stroke-width="${F(esp*.9)}" opacity=".22" transform="translate(${F(esp*.25)} ${F(esp*.3)})"/></g>`);
 // porta (pátio aberto): vão no muro
 if(o.aberta&&o.porta){const v=Math.min(W,H)*.22,ex=esp+m+4;const P={s:[W/2-v/2,H-ex,v,ex],n:[W/2-v/2,0,v,ex],o:[0,H/2-v/2,ex,v],l:[W-ex,H/2-v/2,ex,v]}[o.porta];
  if(P)t.add(`<rect x="${F(P[0])}" y="${F(P[1])}" width="${F(P[2])}" height="${F(P[3])}" fill="${piso}"/><rect x="${F(P[0])}" y="${F(P[1])}" width="${F(P[2])}" height="${F(P[3])}" fill="#000" opacity=".12"/>`);}
 // rachaduras no muro e no chão
 for(let i=0;i<(o.rachaduras??4);i++){let x,y,k=0;do{x=t.rr(m,W-m);y=t.rr(m,H-m);}while(!dentroForma(forma,W,H,m*.6,x,y)&&++k<20);rachadura(t,x,y,t.rr(0,6.28),Math.min(W,H)*t.rr(.08,.2));}
 // coisas no terraço (ou no pátio): caixotes, vasos com planta, tapete, alçapão com escada, antena/painel
 const n=o.coisas??(4+Math.floor(t.r()*4));const cores=[KIT.teal,KIT.rubi,KIT.mostarda,KIT.terracota];
 const ponto=()=>{for(let k=0;k<40;k++){const x=t.rr(m+esp*1.6,W-m-esp*1.6),y=t.rr(m+esp*1.6,H-m-esp*1.6);if(dentroForma(forma,W,H,m+esp*1.2,x,y))return [x,y];}return [W/2,H/2];};
 if(!o.aberta&&o.alcapao!==false){const [x,y]=ponto(),s=Math.min(W,H)*.12;t.add(`<rect x="${F(x-s/2)}" y="${F(y-s/2)}" width="${F(s)}" height="${F(s)}" fill="#3a2414" stroke="#1a0e06" stroke-width="2"/><path d="M${F(x-s*.3)} ${F(y-s/2)} v${F(s)} M${F(x+s*.3)} ${F(y-s/2)} v${F(s)} M${F(x-s*.3)} ${F(y-s*.2)} h${F(s*.6)} M${F(x-s*.3)} ${F(y+s*.15)} h${F(s*.6)}" stroke="#a8743c" stroke-width="2.4"/>`);}
 if(t.r()<.75){const [x,y]=ponto();tapeteTopo(t,x,y,Math.min(W,H)*.26,Math.min(W,H)*.18,cores[Math.floor(t.r()*4)],KIT.creme);}
 for(let i=0;i<n;i++){const [x,y]=ponto(),q=t.r();
  if(q<.4)caixoteTopo(t,x,y,Math.min(W,H)*t.rr(.06,.09));
  else if(q<.7)vasoPlanta(t,x,y,Math.min(W,H)*.035,t.r()<.5?'#8fae3a':'#c9b43a');
  else if(q<.85)t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(Math.min(W,H)*.045)}" fill="${t.rad('#7a5a3a')}" stroke="#3a2210" stroke-width="2"/><circle cx="${F(x)}" cy="${F(y)}" r="${F(Math.min(W,H)*.028)}" fill="none" stroke="#3a2210" stroke-width="1.4"/>`); // barril
  else{const s=Math.min(W,H)*.05;t.add(`<g transform="translate(${F(x)} ${F(y)})"><circle r="${F(s)}" fill="${t.rad('#cfd6d8')}" stroke="#2a3238" stroke-width="2"/><path d="M0 0 L${F(s*1.4)} ${F(-s*.9)}" stroke="#2a3238" stroke-width="2.2"/><circle cx="${F(s*1.4)}" cy="${F(-s*.9)}" r="${F(s*.25)}" fill="#5fe1ff" filter="${brilho(t,'#5fe1ff',3)}"/></g>`);} // antena com luz
 }
}
// Casa de cúpula: muro redondo com a cúpula de escamas coloridas (laranja, vermelho, rosa)
function casaCupula(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)/2*.92,esp=R*.12;
 t.add(`<g filter="${t.sombra(9,12,9,.55)}"><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R)}" fill="${o.parede||KIT.parede}" stroke="#4a3418" stroke-width="3"/></g>`);
 const Rc=R-esp;t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(Rc)}" fill="${t.rad(o.cor||'#c8552e',{cx:40,cy:36,claro:.25,escuro:-.35})}" stroke="#4a2414" stroke-width="2.5"/>`);
 const cores=o.cores||['#d9653a','#c4442e','#e8875a','#b8342a','#f0a070','#d0503a'];
 for(let k=1;k<=7;k++){const rr=Rc*(1-k/8.2),n=Math.max(6,Math.round(rr*2*Math.PI/(Rc*.16)));
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+(k%2)*Math.PI/n,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr,s=Rc*.085*(1-k/12);
   t.add(`<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(s)}" ry="${F(s*.8)}" transform="rotate(${F(a*57.3+90)} ${F(x)} ${F(y)})" fill="${cores[(i*3+k)%cores.length]}" stroke="#5a2414" stroke-width="1" opacity=".95"/>`);}}
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(Rc)}" fill="${t.rad('#ffffff',{cx:32,cy:28,claro:0,escuro:-1})}" opacity=".18"/>`);
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(Rc*.07)}" fill="${OURO}" stroke="#3a2a10" stroke-width="1.5"/><circle cx="${F(cx-Rc*.02)}" cy="${F(cy-Rc*.02)}" r="${F(Rc*.025)}" fill="#fff8d0"/>`);
 for(let i=0;i<3;i++)rachadura(t,cx+Math.cos(i*2.1)*R*.95,cy+Math.sin(i*2.1)*R*.95,i*2.1+3.14,R*.15);
}
// Barraco: tábuas e chapas remendadas, lona num canto
function barraco(t,o={}){
 const {W,H}=t,m=Math.min(W,H)*.05;
 t.add(`<g filter="${t.sombra(8,10,8,.5)}"><rect x="${F(m)}" y="${F(m)}" width="${F(W-2*m)}" height="${F(H-2*m)}" rx="3" fill="${KIT.madeira}" stroke="#2a1608" stroke-width="3"/></g>`);
 const n=6+Math.floor(t.r()*3),cores=[KIT.chapa,'#b8784a','#7a8a8c',KIT.teal,'#a8743c'];
 for(let i=0;i<n;i++){const x=m+(W-2*m)*i/n,w=(W-2*m)/n,c=cores[Math.floor(t.r()*cores.length)],ond=c===KIT.chapa||c==='#7a8a8c';
  t.add(`<rect x="${F(x)}" y="${F(m+t.rr(0,4))}" width="${F(w+1)}" height="${F(H-2*m-t.rr(0,8))}" fill="${ond?t.lin([tom(c,.25),c,tom(c,-.2),c,tom(c,.25)],0):t.lin([tom(c,.15),tom(c,-.15)],90)}" stroke="#2a1608" stroke-width="1.6"/>`);
  if(ond)for(let y=m;y<H-m;y+=7)t.add(`<path d="M${F(x)} ${F(y)} h${F(w)}" stroke="#000" stroke-width="1" opacity=".18"/>`);}
 for(let i=0;i<10;i++)t.add(`<circle cx="${F(t.rr(m,W-m))}" cy="${F(t.rr(m,H-m))}" r="1.8" fill="#2a1608" opacity=".7"/>`);
 const c=o.lona||[KIT.rubi,KIT.mostarda,KIT.teal][Math.floor(t.r()*3)];
 t.add(`<path d="M${F(W-m)} ${F(m)} L${F(W*.45)} ${F(m)} L${F(W-m)} ${F(H*.6)}Z" fill="${c}" stroke="${tom(c,-.5)}" stroke-width="2" opacity=".92"/>`);
 rachadura(t,W*.3,H*.7,0,W*.25,'#2a1608',1.2);
}
// Varal: duas estacas e uma corda com roupas estendidas (fica por cima de quem passa)
function varal(t,o={}){
 const {W,H}=t,y=H/2,x0=W*.04,x1=W*.96,sag=H*.12;
 for(const x of [x0,x1])t.add(`<circle cx="${F(x)}" cy="${F(y)}" r="${F(H*.09)}" fill="${t.rad('#6a4a2a')}" stroke="#2a1608" stroke-width="2"/>`);
 t.add(`<path d="M${F(x0)} ${F(y)} Q${F(W/2)} ${F(y+sag*2)} ${F(x1)} ${F(y)}" stroke="#3a2a1a" stroke-width="2.2" fill="none"/>`);
 const cores=[KIT.teal,KIT.rubi,KIT.mostarda,'#f3e3bf','#6a4ab0','#e8875a','#3a6ab8'];const n=o.pecas||Math.max(3,Math.round(W/H*1.4));
 for(let i=0;i<n;i++){const u=(i+.6)/(n+.2),x=x0+(x1-x0)*u,yy=y+sag*2*4*u*(1-u),c=cores[Math.floor(t.r()*cores.length)],w=(x1-x0)/n*t.rr(.55,.8),h=H*t.rr(.35,.55),tipo=t.r();
  t.add(`<g transform="translate(${F(x)} ${F(yy)}) rotate(${F(t.rr(-8,8))})" filter="${t.sombra(3,5,3,.35)}">`+(tipo<.4?`<path d="M${F(-w/2)} 0 h${F(w)} l${F(w*.15)} ${F(h*.35)} l${F(-w*.2)} 0 v${F(h*.65)} h${F(-w*.9)} v${F(-h*.65)} l${F(-w*.2)} 0Z" fill="${c}" stroke="${tom(c,-.45)}" stroke-width="1.5"/>`:`<rect x="${F(-w/2)}" y="0" width="${F(w)}" height="${F(h)}" fill="${c}" stroke="${tom(c,-.45)}" stroke-width="1.5"/><path d="M${F(-w/2)} ${F(h*.3)} h${F(w)} M${F(-w/2)} ${F(h*.65)} h${F(w)}" stroke="${tom(c,.35)}" stroke-width="${F(h*.07)}"/>`)+`<path d="M${F(-w*.3)} 0 v3 M${F(w*.3)} 0 v3" stroke="#222" stroke-width="2"/></g>`);}
}
// Agave dourada (planta grande em estrela, como as das vilas do deserto)
function agave(t,o={}){
 const {W,H}=t,cx=W/2,cy=H/2,R=Math.min(W,H)/2*.95,cor=o.cor||'#c9b43a';
 t.add(`<g filter="${t.sombra(6,9,7,.45)}">`);
 for(const [k,esc,c] of [[11,1,tom(cor,-.15)],[9,.78,cor],[7,.5,tom(cor,.2)]])for(let i=0;i<k;i++){const a=i/k*Math.PI*2+esc*.6+t.rr(-.08,.08);
  const L=R*esc*t.rr(.85,1),w=L*.26,ex=cx+Math.cos(a)*L,ey=cy+Math.sin(a)*L,nx=-Math.sin(a)*w,ny=Math.cos(a)*w,mx=cx+Math.cos(a)*L*.4,my=cy+Math.sin(a)*L*.4;
  t.add(`<path d="M${F(cx)} ${F(cy)} Q${F(mx+nx)} ${F(my+ny)} ${F(ex)} ${F(ey)} Q${F(mx-nx)} ${F(my-ny)} ${F(cx)} ${F(cy)}Z" fill="${t.lin([tom(c,.25),c,tom(c,-.3)],a*57.3)}" stroke="${tom(c,-.55)}" stroke-width="1.8"/>`);
  // sulcos: nervura central funda e dois sulcos de cada lado, que afinam até a ponta
  const sx=nx/w,sy=ny/w;let sul=`<path d="M${F(cx)} ${F(cy)} L${F(ex)} ${F(ey)}" stroke="${tom(c,-.5)}" stroke-width="2" opacity=".75"/><path d="M${F(cx+sx*1.2)} ${F(cy+sy*1.2)} L${F(ex+sx*.4)} ${F(ey+sy*.4)}" stroke="${tom(c,.45)}" stroke-width="1" opacity=".6"/>`;
  for(const k of [-.55,-.3,.3,.55]){const p0x=cx+Math.cos(a)*L*.1+sx*w*k*.55,p0y=cy+Math.sin(a)*L*.1+sy*w*k*.55,mx2=cx+Math.cos(a)*L*.45+sx*w*k*.8,my2=cy+Math.sin(a)*L*.45+sy*w*k*.8,e2x=cx+Math.cos(a)*L*.88+sx*w*k*.12,e2y=cy+Math.sin(a)*L*.88+sy*w*k*.12;
   sul+=`<path d="M${F(p0x)} ${F(p0y)} Q${F(mx2)} ${F(my2)} ${F(e2x)} ${F(e2y)}" stroke="${tom(c,-.38)}" stroke-width="1" fill="none" opacity=".55"/>`;}
  // espinhos na borda e ponta escura
  for(let q=.3;q<.95;q+=.13)for(const sg of [1,-1]){const bx=cx+Math.cos(a)*L*q,by=cy+Math.sin(a)*L*q,lw=w*(1-q)*1.25*(q<.5?q*2:1);const px=bx+sx*lw*sg,py=by+sy*lw*sg;sul+=`<path d="M${F(px)} ${F(py)} l${F(sx*sg*3+Math.cos(a)*3)} ${F(sy*sg*3+Math.sin(a)*3)}" stroke="${tom(c,-.6)}" stroke-width="1.2"/>`;}
  sul+=`<circle cx="${F(ex)}" cy="${F(ey)}" r="1.8" fill="${tom(c,-.65)}"/>`;
  t.add(sul);}
 t.add(`<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(R*.1)}" fill="${tom(cor,-.35)}"/></g>`);
}
// Toldo: lona esticada (triângulo ou quadrilátero) com cordas até as estacas — fica por cima de quem passa
function toldo(t,o={}){
 const {W,H}=t,c1=o.cor||KIT.rubi,c2=o.cor2||KIT.creme,m=Math.min(W,H)*.06;
 const P=o.tri?[[m,m],[W-m,H*.35],[W*.3,H-m]]:[[m,H*.15],[W*.8,m],[W-m,H*.8],[W*.15,H-m]];
 const d='M'+P.map(p=>F(p[0])+' '+F(p[1])).join(' L')+'Z';
 const gid='lst'+Math.floor(t.r()*1e8),n=7;let st='';for(let i=0;i<n;i++){const c=i%2?c2:c1;st+=`<stop offset="${(i/n).toFixed(3)}" stop-color="${c}"/><stop offset="${((i+1)/n).toFixed(3)}" stop-color="${c}"/>`;}
 t.def(`<linearGradient id="${gid}" gradientTransform="rotate(20 .5 .5)">${st}</linearGradient>`);
 t.add(`<g filter="${t.sombra(10,14,10,.4)}"><path d="${d}" fill="url(#${gid})" stroke="${tom(c1,-.5)}" stroke-width="2.5" opacity=".95"/></g>`);
 t.add(`<path d="${d}" fill="none" stroke="${tom(c1,-.35)}" stroke-width="5" stroke-dasharray="2 9" opacity=".6"/>`);
 t.add(`<path d="${d}" fill="${t.lin(['#ffffff','#000000'],135)}" opacity=".12"/>`);
 for(const p of P)t.add(`<circle cx="${F(p[0])}" cy="${F(p[1])}" r="4" fill="#5a3a20" stroke="#1a0e06" stroke-width="1.4"/>`);
}
// Rachaduras e manchas no chão (decalque, por baixo de tudo)
function rachaduras(t,o={}){
 const {W,H}=t;t.add(`<ellipse cx="${F(W/2)}" cy="${F(H/2)}" rx="${F(W*.45)}" ry="${F(H*.42)}" fill="#8a6a3a" opacity=".16"/>`);
 for(let i=0;i<(o.n||6);i++)rachadura(t,t.rr(W*.2,W*.8),t.rr(H*.2,H*.8),t.rr(0,6.28),Math.min(W,H)*t.rr(.2,.45),'#5a3a1a',2);
}

export const DESENHOS={
 palmeira:{nome:'Palmeira',f:palmeira},copa:{nome:'Árvore de copa',f:copa},pinheiro:{nome:'Pinheiro',f:pinheiro},arbusto:{nome:'Arbusto',f:arbusto},
 planta_vaso:{nome:'Planta em vaso',f:plantaVaso},pedra:{nome:'Pedra',f:pedra},cristal:{nome:'Cristal',f:cristal},tronco:{nome:'Tronco caído',f:tronco},
 toco:{nome:'Toco cortado',f:toco},galho:{nome:'Galho',f:galho},caixote:{nome:'Caixote',f:caixote},barril:{nome:'Barril',f:barril},
 mesa_redonda:{nome:'Mesa redonda',f:mesaRedonda},mesa_retangular:{nome:'Mesa retangular',f:mesaRetangular},balcao:{nome:'Balcão de bar',f:balcao},
 cadeira:{nome:'Cadeira',f:(t,o)=>cadeira(t,o)},estofado:{nome:'Sofá / poltrona',f:estofado},ninho_almofadas:{nome:'Ninho de almofadas',f:ninhoAlmofadas},
 cama:{nome:'Cama',f:cama},tapete:{nome:'Tapete',f:tapete},chapa_metal:{nome:'Chão metálico',f:chapaMetal},escotilha:{nome:'Escotilha',f:escotilha},
 grade:{nome:'Grade',f:grade},calcamento:{nome:'Calçamento',f:calcamento},lampada:{nome:'Luminária',f:lampada},esqueletos:{nome:'Ossada',f:esqueletos},
 armadilha:{nome:'Armadilha de estacas',f:armadilha},tumulo:{nome:'Túmulo',f:tumulo},telhado:{nome:'Telhado',f:telhado},carro:{nome:'Carro',f:carro},
 caminhao:{nome:'Caminhão',f:caminhao},terminal:{nome:'Terminal',f:terminal},
 // v129
 console_holo:{nome:'Console holográfico',f:consoleHolo},capsula:{nome:'Cápsula de descanso',f:capsula},armario_metal:{nome:'Armário de metal',f:armarioMetal},
 painel_neon:{nome:'Painel de luz neon',f:painelNeon},porta_deslizante:{nome:'Porta deslizante',f:portaDeslizante},mesa_vidro:{nome:'Mesa de vidro iluminada',f:mesaVidro},
 cadeira_ergo:{nome:'Cadeira ergonômica',f:cadeiraErgo},sofa_retro:{nome:'Sofá retrô',f:sofaRetro},luminaria_atomica:{nome:'Luminária atômica',f:luminariaAtomica},
 mesa_bumerangue:{nome:'Mesa bumerangue',f:mesaBumerangue},radio_valvulas:{nome:'Rádio de válvulas',f:radioValvulas},poltrona_ovo:{nome:'Poltrona ovo',f:poltronaOvo},
 trono:{nome:'Trono estelar',f:trono},estandarte:{nome:'Estandarte',f:estandarte},braseiro_plasma:{nome:'Braseiro de plasma',f:braseiroPlasma},
 bau_brasonado:{nome:'Baú brasonado',f:bauBrasonado},mesa_banquete:{nome:'Mesa de banquete',f:mesaBanquete},armadura:{nome:'Armadura cerimonial',f:armaduraCerimonial},portao_bronze:{nome:'Portão de bronze',f:portaoBronze},
 // v138
 aerocarro:{nome:'Aerocarro',f:aerocarro},cargueiro_flutuante:{nome:'Cargueiro flutuante',f:cargueiroFlutuante},carroca_areia:{nome:'Carroça das areias',f:carrocaAreia},nave:{nome:'Nave',f:nave},
 barraca:{nome:'Barraca de feira',f:barraca},plataforma:{nome:'Plataforma de pouso',f:plataforma},torre_controle:{nome:'Torre de controle',f:torreControle},portao_rocha:{nome:'Portão de rocha',f:portaoRocha},
 // v139
 // v162: kit do deserto
 casa_terraco:{nome:'Casa de terraço',f:casaTerraco},casa_cupula:{nome:'Casa de cúpula',f:casaCupula},barraco:{nome:'Barraco',f:barraco},varal:{nome:'Varal',f:varal},agave:{nome:'Agave',f:agave},toldo:{nome:'Toldo',f:toldo},rachaduras:{nome:'Rachaduras',f:rachaduras},
 beliche:{nome:'Beliche',f:beliche},escada_interna:{nome:'Escada interna',f:escadaInterna},ladrilhos:{nome:'Ladrilhos',f:ladrilhos},
 banco_praca:{nome:'Banco',f:bancoPraca},maquina_venda:{nome:'Máquina de venda',f:maquinaVenda},banca_panelas:{nome:'Banca de panelas',f:bancaPanelas},poste_luz:{nome:'Poste de luz',f:posteLuz},escada:{nome:'Escada',f:escada},fonte:{nome:'Fonte',f:fonte},estante_arquivo:{nome:'Estante',f:estanteArquivo}
};
// Proporção em pixels: até 512 no lado maior.
export function desenharObjeto(receita,larguraM=1,alturaM=1,semente){
 const k=DESENHOS[receita?.tipo];if(!k)throw new Error('Desenho desconhecido: '+receita?.tipo);
 const lw=Math.max(.1,Number(larguraM)||1),lh=Math.max(.1,Number(alturaM)||1),esc=512/Math.max(lw,lh);
 const W=Math.max(48,Math.round(lw*esc)),H=Math.max(48,Math.round(lh*esc));
 const t=tela(W,H,semente??hashTexto(JSON.stringify(receita)));
 k.f(t,receita);
 return t.svg();
}
export const svgParaDataUrl=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);

// Receitas para os objetos que já existem no seu banco (IDs reais).
export const RECEITAS_OBJETOS={
 arbusto:{tipo:'arbusto',cor:'#3f7f2c'},
 armadilha1:{tipo:'armadilha'},
 arvre1:{tipo:'copa',cor:'#6a7f5a',galhos:true},
 avrepalmeira:{tipo:'palmeira',cor:'#4f8a2a'},
 arvrepalmeira2:{tipo:'palmeira',cor:'#3f7a2a',folhas:8},
 arvreparmera3:{tipo:'palmeira',cor:'#56802a',seca:.35},
 arvre3:{tipo:'copa',cor:'#2f5f24',tufos:30},
 avre4:{tipo:'copa',cor:'#5a9a3a'},
 avreneve:{tipo:'copa',cor:'#3a5a3a',neve:true},
 cadeira1:{tipo:'cadeira',cor:'#7a4a2a',assento:'#6a3e24'},
 cadeira2:{tipo:'cadeira',cor:'#c9b090',assento:'#4a2a2a'},
 cadeira3:{tipo:'cadeira',cor:'#1e1e22',assento:'#2a2a30'},
 caixa1:{tipo:'caixote',cor:'#9a6a3a'},
 caixa2:{tipo:'caixote',cor:'#b08a50'},
 calcamento1:{tipo:'calcamento',cor:'#4a3e3e'},
 camacasal2:{tipo:'cama',colcha:'#3a3a44',padrao:'xadrez',madeira:'#4a4e56'},
 camacasalemoouvampiro:{tipo:'cama',colcha:'#1a1a1e',lencol:'#3a1a24',travesseiro:'#2a2a30',madeira:'#14141a'},
 camacasl1:{tipo:'cama',colcha:'#c9b48f',madeira:'#8a6a44'},
 caminhao1:{tipo:'caminhao',cor:'#4a5a6a'},
 carro1:{tipo:'carro',cor:'#2a2e34'},
 chaometalico1:{tipo:'chapa_metal',cor:'#5e646c',n:2},
 cristalgay1:{tipo:'cristal'},
 escotilha1:{tipo:'escotilha',cor:'#c9a020'},
 esqueletos1:{tipo:'esqueletos'},
 galho1:{tipo:'galho',cor:'#6a5a3a',folhas:true},
 galhoseco1:{tipo:'galho',cor:'#8a7a5a'},
 grade1:{tipo:'grade',cor:'#5a4a3e'},
 lampada:{tipo:'lampada',cor:'#ffcf6b'},
 mesa1:{tipo:'mesa_redonda',cor:'#8a5a34'},
 mesa2:{tipo:'mesa_redonda',cor:'#5a3a24',radial:true},
 mesa3:{tipo:'mesa_retangular',cor:'#7a5232',cadeiras:true},
 mesa4:{tipo:'balcao',cor:'#4a2e1e'},
 preda1:{tipo:'pedra',cor:'#3e4246'},
 planta1:{tipo:'planta_vaso',cor:'#2f7a3a'},
 planta2:{tipo:'planta_vaso',cor:'#3a8a3a',vaso:false,folhas:11},
 poltronaamarela1:{tipo:'estofado',cor:'#d9a42a',poltrona:true},
 predragay1:{tipo:'cristal',cores:['#ffb0e0','#a08aff','#7fe0ff','#fff0b0']},
 predramusgosa1:{tipo:'pedra',cor:'#6a6a64',musgo:'#5f8a32'},
 predranova2:{tipo:'pedra',cor:'#9a7a5a'},
 predranova3:{tipo:'pedra',cor:'#8a7a6a',pontos:8},
 predranova4:{tipo:'pedra',cor:'#a89070'},
 redragay2:{tipo:'cristal',cores:['#c93a8a','#3ac9a0','#e0c03a']},
 sofavermeio:{tipo:'estofado',cor:'#c92a2a'},
 sofaazul1:{tipo:'estofado',cor:'#1e2e3e',L:true},
 sofacinza1:{tipo:'estofado',cor:'#2a2a2e',L:true},
 sofahippie:{tipo:'ninho_almofadas'},
 sofahippie2:{tipo:'estofado',cor:'#2a3a7a',L:true,almofadas:7,almofadas_cores:['#c9452a','#d9a63a','#7a2a6a','#2a8a7a']},
 sofavermelho2:{tipo:'estofado',cor:'#b82a2a',L:true},
 tapete1:{tipo:'tapete',redondo:true},
 telhado1:{tipo:'telhado',cor:'#6a3a2a'},
 telhado2:{tipo:'telhado',cor:'#4a4e56'},
 tronco1:{tipo:'tronco',cor:'#6a4a30',musgo:true,folhas:true},
 troncocortado1:{tipo:'toco'},
 tronco2:{tipo:'galho',cor:'#8a7058'},
 tumulo1:{tipo:'tumulo'}
};
// Objetos novos do pacote (entram no banco com estes IDs).
export const PACOTE_NOVO=[
 {id:'pk_barril',nome:'Barril',tipo:'barril',larguraM:0.7,alturaM:0.7,material:'Madeira',pvMax:20,dureza:3,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:true},
 {id:'pk_caixote_suprimentos',nome:'Caixote de suprimentos',tipo:'caixote',cor:'#7a8a5a',larguraM:0.85,alturaM:0.7,material:'Madeira',pvMax:18,dureza:3,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:true},
 {id:'pk_terminal',nome:'Terminal',tipo:'terminal',larguraM:1.2,alturaM:.8,material:'Metal',pvMax:15,dureza:5,bloqueiaMovimento:true},
 {id:'pk_luminaria',nome:'Luminária de teto',tipo:'lampada',larguraM:1,alturaM:1,material:'Metal',pvMax:4,dureza:2,camada:4},
 {id:'pk_pinheiro',nome:'Pinheiro',tipo:'pinheiro',larguraM:3.5,alturaM:3.5,material:'Madeira',pvMax:80,dureza:5,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_pinheiro_neve',nome:'Pinheiro com neve',tipo:'pinheiro',neve:true,larguraM:3.5,alturaM:3.5,material:'Madeira',pvMax:80,dureza:5,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_arvore_florida',nome:'Árvore florida',tipo:'copa',cor:'#4a7a3a',flor:'#f2a6c9',larguraM:4,alturaM:4,material:'Madeira',pvMax:80,dureza:5,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_arvore_alienigena',nome:'Árvore alienígena',tipo:'copa',cor:'#5a3a7a',flor:'#7fffd4',larguraM:4,alturaM:4,material:'Orgânico',pvMax:80,dureza:5,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_arbusto_florido',nome:'Arbusto florido',tipo:'arbusto',flor:'#ffd447',larguraM:1.5,alturaM:1.5,material:'Vegetal',pvMax:10,dureza:1,inflamavel:true,inflamabilidade:4},
 {id:'pk_pedra_grande',nome:'Pedra grande',tipo:'pedra',cor:'#6e6a64',larguraM:2.5,alturaM:2,material:'Pedra',pvMax:200,dureza:12,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_pedra_pequena',nome:'Pedra pequena',tipo:'pedra',cor:'#857f76',larguraM:.8,alturaM:.7,material:'Pedra',pvMax:40,dureza:10},
 {id:'pk_cristal_azul',nome:'Cristal azul',tipo:'cristal',cores:['#bff6ff','#3fd0ff','#2a6aff','#9fe8ff'],larguraM:1,alturaM:1.2,material:'Cristal',pvMax:30,dureza:8,bloqueiaMovimento:true},
 {id:'pk_mesa_reuniao',nome:'Mesa com cadeiras',tipo:'mesa_retangular',cadeiras:true,cor:'#5a3a24',corCadeira:'#3a2a1a',corAssento:'#5a2a2a',larguraM:3,alturaM:1.7,material:'Madeira',pvMax:30,dureza:3,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:true},
 {id:'pk_cama_solteiro',nome:'Cama de solteiro',tipo:'cama',colcha:'#5a7a9a',larguraM:1.1,alturaM:2.1,material:'Madeira',pvMax:20,dureza:2,inflamavel:true,inflamabilidade:3},
 {id:'pk_sofa_couro',nome:'Sofá de couro',tipo:'estofado',cor:'#6a3e24',larguraM:2.4,alturaM:1,material:'Couro',pvMax:20,dureza:2,inflamavel:true,inflamabilidade:3},
 {id:'pk_tapete_retangular',nome:'Tapete retangular',tipo:'tapete',redondo:false,cor:'#6a1a1a',cor2:'#d9a63a',cor3:'#2a2a5a',larguraM:3,alturaM:2,material:'Tecido',pvMax:5,dureza:0,camada:1,inflamavel:true,inflamabilidade:4},
 {id:'pk_tronco_caido',nome:'Tronco caído',tipo:'tronco',larguraM:4,alturaM:1.2,material:'Madeira',pvMax:60,dureza:5,bloqueiaMovimento:true},
 {id:'pk_chao_metal_ferrugem',nome:'Chão metálico enferrujado',tipo:'chapa_metal',cor:'#6a6258',ferrugem:true,n:2,larguraM:2,alturaM:2,material:'Metal',camada:1,pvMax:100,dureza:8},
 // v129: futurista, retrofuturista e feudal galáctico (estilo em "estiloV129")
 {id:'pk_fut_console',nome:'Console holográfico',tipo:'console_holo',estiloV129:'futurista',larguraM:1.6,alturaM:1.6,material:'Metal',pvMax:20,dureza:6,bloqueiaMovimento:true},
 {id:'pk_fut_capsula',nome:'Cápsula de descanso',tipo:'capsula',estiloV129:'futurista',larguraM:1.1,alturaM:2.2,material:'Metal',pvMax:30,dureza:6,bloqueiaMovimento:true},
 {id:'pk_fut_capsula_med',nome:'Cápsula de recuperação',tipo:'capsula',neon:'#57e3a1',interativo:'recuperacao',estiloV129:'futurista',larguraM:1.1,alturaM:2.2,material:'Metal',pvMax:30,dureza:6,bloqueiaMovimento:false}, // v135: hospital
 {id:'pk_fut_armario',nome:'Armário de metal',tipo:'armario_metal',estiloV129:'futurista',larguraM:2.7,alturaM:.9,material:'Metal',pvMax:30,dureza:7,bloqueiaMovimento:true},
 {id:'pk_fut_neon',nome:'Painel de luz neon',tipo:'painel_neon',estiloV129:'futurista',larguraM:1.6,alturaM:.35,material:'Metal',pvMax:5,dureza:2,camada:4},
 {id:'pk_fut_porta',nome:'Porta deslizante',tipo:'porta_deslizante',estiloV129:'futurista',larguraM:1.6,alturaM:.5,material:'Metal',pvMax:40,dureza:9,bloqueiaMovimento:true},
 {id:'pk_fut_mesa',nome:'Mesa de vidro iluminada',tipo:'mesa_vidro',estiloV129:'futurista',larguraM:2,alturaM:1.1,material:'Vidro',pvMax:10,dureza:3,bloqueiaMovimento:true},
 {id:'pk_fut_cadeira',nome:'Cadeira ergonômica',tipo:'cadeira_ergo',estiloV129:'futurista',larguraM:.85,alturaM:.85,material:'Metal',pvMax:8,dureza:3},
 {id:'pk_retro_sofa',nome:'Sofá retrô',tipo:'sofa_retro',estiloV129:'retro',larguraM:2.4,alturaM:1.1,material:'Couro',pvMax:20,dureza:2,inflamavel:true,inflamabilidade:3},
 {id:'pk_retro_luminaria',nome:'Luminária atômica',tipo:'luminaria_atomica',estiloV129:'retro',larguraM:1,alturaM:1,material:'Metal',pvMax:4,dureza:2},
 {id:'pk_retro_mesa',nome:'Mesa bumerangue',tipo:'mesa_bumerangue',estiloV129:'retro',larguraM:1.8,alturaM:1,material:'Fórmica',pvMax:12,dureza:2,bloqueiaMovimento:true},
 {id:'pk_retro_radio',nome:'Rádio de válvulas',tipo:'radio_valvulas',estiloV129:'retro',larguraM:.9,alturaM:.5,material:'Madeira',pvMax:6,dureza:2},
 {id:'pk_retro_poltrona',nome:'Poltrona ovo',tipo:'poltrona_ovo',estiloV129:'retro',larguraM:1,alturaM:1,material:'Fibra',pvMax:10,dureza:2},
 {id:'pk_feu_trono',nome:'Trono estelar',tipo:'trono',estiloV129:'feudal',larguraM:1.6,alturaM:1.6,material:'Metal',pvMax:60,dureza:8,bloqueiaMovimento:true},
 {id:'pk_feu_estandarte',nome:'Estandarte da casa',tipo:'estandarte',estiloV129:'feudal',larguraM:1,alturaM:1.8,material:'Tecido',pvMax:5,dureza:0,camada:4,inflamavel:true,inflamabilidade:4},
 {id:'pk_feu_braseiro',nome:'Braseiro de plasma',tipo:'braseiro_plasma',estiloV129:'feudal',larguraM:1,alturaM:1,material:'Metal',pvMax:20,dureza:6,bloqueiaMovimento:true},
 {id:'pk_feu_bau',nome:'Baú brasonado',tipo:'bau_brasonado',estiloV129:'feudal',larguraM:1.7,alturaM:1.05,material:'Madeira',pvMax:25,dureza:5,bloqueiaMovimento:true},
 {id:'pk_feu_mesa',nome:'Mesa de banquete',tipo:'mesa_banquete',estiloV129:'feudal',larguraM:3.4,alturaM:1.5,material:'Madeira',pvMax:40,dureza:4,bloqueiaMovimento:true,inflamavel:true,inflamabilidade:3},
 {id:'pk_feu_armadura',nome:'Armadura cerimonial',tipo:'armadura',estiloV129:'feudal',larguraM:1,alturaM:.9,material:'Metal',pvMax:40,dureza:9,bloqueiaMovimento:true},
 {id:'pk_feu_portao',nome:'Portão de bronze',tipo:'portao_bronze',estiloV129:'feudal',larguraM:2,alturaM:.5,material:'Bronze',pvMax:80,dureza:12,bloqueiaMovimento:true},
 {id:'pk_carro_vermelho',nome:'Carro vermelho',tipo:'carro',cor:'#8a2a2a',larguraM:4.5,alturaM:2,material:'Metal',pvMax:120,dureza:8,bloqueiaMovimento:true},
 // v138: veículos retrofuturistas e arcaicos, naves e o deserto de Véspera
 {id:'pk_vei_aerocarro_turquesa',nome:'Aerocarro turquesa',tipo:'aerocarro',cor:'#2a9a9a',larguraM:4.6,alturaM:2.3,material:'Metal',pvMax:90,dureza:7,bloqueiaMovimento:true},
 {id:'pk_vei_aerocarro_creme',nome:'Aerocarro creme',tipo:'aerocarro',cor:'#e6d6b0',banco:'#2a9a9a',larguraM:4.6,alturaM:2.3,material:'Metal',pvMax:90,dureza:7,bloqueiaMovimento:true},
 {id:'pk_vei_aerocarro_rubi',nome:'Aerocarro rubi',tipo:'aerocarro',cor:'#a8242c',luz:'#ff9a5a',larguraM:4.6,alturaM:2.3,material:'Metal',pvMax:90,dureza:7,bloqueiaMovimento:true},
 {id:'pk_vei_cargueiro',nome:'Cargueiro flutuante',tipo:'cargueiro_flutuante',larguraM:8,alturaM:3,material:'Metal',pvMax:160,dureza:8,bloqueiaMovimento:true},
 {id:'pk_vei_carroca',nome:'Carroça das areias',tipo:'carroca_areia',larguraM:4.2,alturaM:2.2,material:'Madeira',pvMax:40,dureza:3,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:true},
 {id:'pk_nave_grupo',nome:'Nave do grupo',tipo:'nave',forma:'cargueiro',cor:'#9aa0a6',faixa:'#e8743a',larguraM:24,alturaM:14,material:'Metal',pvMax:900,dureza:14,bloqueiaMovimento:true},
 {id:'pk_nave_caca',nome:'Caça estelar',tipo:'nave',forma:'caca',cor:'#b8bcc4',faixa:'#c9452a',larguraM:11,alturaM:9,material:'Metal',pvMax:400,dureza:12,bloqueiaMovimento:true},
 {id:'pk_nave_transporte',nome:'Transporte de passageiros',tipo:'nave',forma:'transporte',cor:'#d9cdb0',faixa:'#2a9a9a',larguraM:32,alturaM:13,material:'Metal',pvMax:1200,dureza:14,bloqueiaMovimento:true},
 {id:'pk_nave_disco',nome:'Saltador em disco',tipo:'nave',forma:'disco',cor:'#a8b0b8',faixa:'#ff4fd8',larguraM:9,alturaM:9,material:'Metal',pvMax:300,dureza:12,bloqueiaMovimento:true},
 {id:'pk_nave_cargueiro_ferrugem',nome:'Cargueiro enferrujado',tipo:'nave',forma:'cargueiro',cor:'#8a6a4a',faixa:'#5a7a3a',motor:'#7fd6ff',larguraM:20,alturaM:12,material:'Metal',pvMax:800,dureza:13,bloqueiaMovimento:true},
 {id:'pk_plataforma_pouso',nome:'Plataforma de pouso',tipo:'plataforma',larguraM:30,alturaM:30,material:'Concreto',camada:1,pvMax:0,dureza:20,bloqueiaMovimento:false},
 {id:'pk_torre_controle',nome:'Torre de controle',tipo:'torre_controle',larguraM:6,alturaM:6,material:'Concreto',pvMax:500,dureza:14,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_barraca_rubra',nome:'Barraca de feira',tipo:'barraca',cor:'#c9452a',cor2:'#efe2c4',larguraM:2.4,alturaM:2.4,material:'Tecido',pvMax:15,dureza:1,inflamavel:true,inflamabilidade:4,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_barraca_anil',nome:'Barraca de feira',tipo:'barraca',cor:'#2a4a9a',cor2:'#e6d6b0',larguraM:2.4,alturaM:2.4,material:'Tecido',pvMax:15,dureza:1,inflamavel:true,inflamabilidade:4,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_barraca_acafrao',nome:'Barraca de feira',tipo:'barraca',cor:'#d9a63a',cor2:'#7a2a4a',larguraM:2.4,alturaM:2.4,material:'Tecido',pvMax:15,dureza:1,inflamavel:true,inflamabilidade:4,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_portao_vespera',nome:'Portão de Véspera',tipo:'portao_rocha',larguraM:7,alturaM:1.6,material:'Metal',pvMax:600,dureza:16,bloqueiaMovimento:true,bloqueiaVisao:true},
 // v139: mesas sem cadeiras desenhadas (as cadeiras são objetos à parte, sentáveis) e móveis de feira/rua
 {id:'pk_mesa_quadrada',nome:'Mesa quadrada',tipo:'mesa_retangular',cadeiras:false,cor:'#7a5232',larguraM:1.4,alturaM:1.4,material:'Madeira',pvMax:15,dureza:3,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:true},
 {id:'pk_mesa_longa',nome:'Mesa comprida',tipo:'mesa_retangular',cadeiras:false,cor:'#6a4a2a',larguraM:3,alturaM:1.2,material:'Madeira',pvMax:25,dureza:3,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:true},
 {id:'pk_mesa_redonda_bar',nome:'Mesa redonda',tipo:'mesa_redonda',cor:'#8a5a34',larguraM:1.3,alturaM:1.3,material:'Madeira',pvMax:12,dureza:3,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:true},
 {id:'pk_cadeira_madeira',nome:'Cadeira',tipo:'cadeira',cor:'#7a4a2a',assento:'#6a3e24',larguraM:.7,alturaM:.7,material:'Madeira',pvMax:5,dureza:2,camada:2,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:false},
 {id:'pk_cadeira_estofada',nome:'Cadeira estofada',tipo:'cadeira',cor:'#2a2a30',assento:'#7a2a2a',larguraM:.7,alturaM:.7,material:'Metal',pvMax:6,dureza:3,camada:2,bloqueiaMovimento:false},
 {id:'pk_banco_praca',nome:'Banco',tipo:'banco_praca',larguraM:2,alturaM:.7,material:'Madeira',pvMax:12,dureza:3,camada:2,inflamavel:true,inflamabilidade:3,bloqueiaMovimento:false},
 {id:'pk_maquina_venda',nome:'Máquina de venda',tipo:'maquina_venda',larguraM:1.2,alturaM:1,material:'Metal',pvMax:40,dureza:8,bloqueiaMovimento:true},
 {id:'pk_maquina_venda_anil',nome:'Máquina de venda',tipo:'maquina_venda',cor:'#2a4a9a',neon:'#ff4fd8',larguraM:1.2,alturaM:1,material:'Metal',pvMax:40,dureza:8,bloqueiaMovimento:true},
 {id:'pk_banca_panelas',nome:'Banca de panelas',tipo:'banca_panelas',larguraM:2.3,alturaM:1.1,material:'Madeira',pvMax:25,dureza:3,inflamavel:true,inflamabilidade:2,bloqueiaMovimento:true},
 {id:'pk_poste_luz',nome:'Poste de luz',tipo:'poste_luz',larguraM:.8,alturaM:.8,material:'Metal',pvMax:30,dureza:8,camada:4,bloqueiaMovimento:false},
 {id:'pk_beliche',nome:'Beliche',tipo:'beliche',estiloV129:'futurista',larguraM:1.3,alturaM:2.2,material:'Metal',pvMax:25,dureza:5,bloqueiaMovimento:true},
 {id:'pk_escada_interna',nome:'Escada interna',tipo:'escada_interna',larguraM:2.4,alturaM:6,material:'Metal',pvMax:200,dureza:14,camada:2,bloqueiaMovimento:false},
 {id:'pk_ladrilhos_retro',nome:'Piso de ladrilhos (7×7 m)',tipo:'ladrilhos',cor:'#e8dcc0',cor2:'#4a9690',rejunte:'#4a4038',nx:7,ny:7,larguraM:7,alturaM:7,material:'Cerâmica',pvMax:0,dureza:0,camada:1,bloqueiaMovimento:false},
 {id:'pk_ladrilhos_retro2',nome:'Piso de ladrilhos do bar (7×7 m)',tipo:'ladrilhos',cor:'#f0e4c6',cor2:'#2c6b6e',rejunte:'#5a4630',losango:'#c9a24a',bisel:true,nx:7,ny:7,larguraM:7,alturaM:7,material:'Cerâmica',pvMax:0,dureza:0,camada:1,bloqueiaMovimento:false},
 {id:'pk_ladrilhos_metal',nome:'Piso de placas de metal (7×7 m)',tipo:'chapa_metal',cor:'#4a545e',n:7,larguraM:7,alturaM:7,material:'Metal',pvMax:0,dureza:0,camada:1,bloqueiaMovimento:false},
 // v162: kit do deserto (casas de terraço de vários formatos, cúpula, barraco, varal, agave, toldos, rachaduras)
 {id:'pk_casa_ret',nome:'Casa de terraço',tipo:'casa_terraco',forma:'ret',larguraM:6,alturaM:5,material:'Pedra',pvMax:900,dureza:14,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_casa_ret_teal',nome:'Casa de terraço',tipo:'casa_terraco',forma:'ret',piso:'#c58f55',parede:'#f0dcae',larguraM:7,alturaM:4.5,material:'Pedra',pvMax:900,dureza:14,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_casa_redonda',nome:'Casa redonda',tipo:'casa_terraco',forma:'redonda',larguraM:5.5,alturaM:5.5,material:'Pedra',pvMax:900,dureza:14,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_casa_losango',nome:'Casa em losango',tipo:'casa_terraco',forma:'losango',larguraM:6,alturaM:6,material:'Pedra',pvMax:900,dureza:14,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_casa_l',nome:'Casa em L',tipo:'casa_terraco',forma:'L',larguraM:7,alturaM:6,material:'Pedra',pvMax:900,dureza:14,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_casa_oval',nome:'Casa oval',tipo:'casa_terraco',forma:'oval',larguraM:7,alturaM:4.5,material:'Pedra',pvMax:900,dureza:14,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_patio_loja_s',nome:'Pátio de loja',tipo:'casa_terraco',forma:'ret',aberta:true,porta:'s',coisas:3,alcapao:false,larguraM:6,alturaM:5,material:'Pedra',pvMax:900,dureza:14,camada:1,bloqueiaMovimento:false},
 {id:'pk_patio_loja_n',nome:'Pátio de loja',tipo:'casa_terraco',forma:'ret',aberta:true,porta:'n',coisas:3,alcapao:false,larguraM:6,alturaM:5,material:'Pedra',pvMax:900,dureza:14,camada:1,bloqueiaMovimento:false},
 {id:'pk_patio_loja_o',nome:'Pátio de loja',tipo:'casa_terraco',forma:'ret',aberta:true,porta:'o',coisas:3,alcapao:false,larguraM:6,alturaM:5,material:'Pedra',pvMax:900,dureza:14,camada:1,bloqueiaMovimento:false},
 {id:'pk_patio_loja_l',nome:'Pátio de loja',tipo:'casa_terraco',forma:'ret',aberta:true,porta:'l',coisas:3,alcapao:false,larguraM:6,alturaM:5,material:'Pedra',pvMax:900,dureza:14,camada:1,bloqueiaMovimento:false},
 {id:'pk_casa_cupula',nome:'Casa de cúpula',tipo:'casa_cupula',larguraM:7,alturaM:7,material:'Pedra',pvMax:1200,dureza:15,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_barraco',nome:'Barraco',tipo:'barraco',larguraM:2.8,alturaM:2.3,material:'Madeira',pvMax:60,dureza:3,inflamavel:true,inflamabilidade:3,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'pk_varal',nome:'Varal de roupas',tipo:'varal',larguraM:3.8,alturaM:1.1,material:'Tecido',pvMax:5,dureza:0,inflamavel:true,inflamabilidade:4,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false},
 {id:'pk_agave',nome:'Agave dourada',tipo:'agave',larguraM:2.6,alturaM:2.6,material:'Vegetal',pvMax:10,dureza:1,camada:3,bloqueiaMovimento:true},
 {id:'pk_agave_verde',nome:'Agave',tipo:'agave',cor:'#8fae3a',larguraM:2,alturaM:2,material:'Vegetal',pvMax:10,dureza:1,camada:3,bloqueiaMovimento:true},
 {id:'pk_toldo_rubi',nome:'Toldo de lona',tipo:'toldo',cor:'#b23b2a',cor2:'#f3e3bf',larguraM:3,alturaM:2.55,material:'Tecido',pvMax:5,dureza:0,inflamavel:true,inflamabilidade:4,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false},
 {id:'pk_toldo_teal',nome:'Toldo de lona',tipo:'toldo',tri:true,cor:'#2f8a86',cor2:'#dfa62c',larguraM:2.7,alturaM:2.25,material:'Tecido',pvMax:5,dureza:0,inflamavel:true,inflamabilidade:4,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false},
 {id:'pk_toldo_mostarda',nome:'Toldo de lona',tipo:'toldo',cor:'#dfa62c',cor2:'#c4532e',larguraM:3.3,alturaM:2.25,material:'Tecido',pvMax:5,dureza:0,inflamavel:true,inflamabilidade:4,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false},
 {id:'pk_rachaduras',nome:'Chão rachado',tipo:'rachaduras',larguraM:3,alturaM:2.4,material:'nenhum',pvMax:0,dureza:0,camada:1,bloqueiaMovimento:false,bloqueiaVisao:false},
 {id:'pk_escada',nome:'Escada',tipo:'escada',larguraM:3,alturaM:1.4,material:'Pedra',pvMax:200,dureza:14,camada:1,bloqueiaMovimento:false},
 {id:'pk_fonte_praca',nome:'Fonte',tipo:'fonte',larguraM:4,alturaM:4,material:'Pedra',pvMax:300,dureza:14,bloqueiaMovimento:true},
 {id:'pk_estante_arquivo',nome:'Estante',tipo:'estante_arquivo',larguraM:2.4,alturaM:0.6,material:'Madeira',pvMax:20,dureza:3,inflamavel:true,inflamabilidade:4,bloqueiaMovimento:true,bloqueiaVisao:true},
];
// v138: carros e caminhões "do nosso tempo" ganham o visual retrofuturista (o banco troca a imagem uma vez).
// v139: mesas do banco que vinham com cadeiras desenhadas passam a ser só a mesa.
export const REVISUAL_V139={mesa3:{tipo:'mesa_retangular',cor:'#7a5232',cadeiras:false,nome:'Mesa'},pk_mesa_reuniao:{tipo:'mesa_retangular',cadeiras:false,cor:'#5a3a24',nome:'Mesa de reunião'},pk_feu_mesa:{tipo:'mesa_banquete',cadeiras:false,nome:'Mesa de banquete'}};
export const REVISUAL_V138={carro1:{tipo:'aerocarro',cor:'#3a4a5a',cromo:'#d8dee6',nome:'Aerocarro'},pk_carro_vermelho:{tipo:'aerocarro',cor:'#a8242c',luz:'#ff9a5a',nome:'Aerocarro vermelho'},caminhao1:{tipo:'cargueiro_flutuante',cor:'#4a6a7a',bau:'#c9c0a8',nome:'Cargueiro flutuante'}};
export function receitaDoObjeto(o){return RECEITAS_OBJETOS[o?.id]||null;}
