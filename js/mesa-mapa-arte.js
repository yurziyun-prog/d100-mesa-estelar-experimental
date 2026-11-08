// Mesa Estelar v110 — Chão dos mapas e formas com material.
//
// 1) Texturas de chão pintadas (mesmo universo visual das miniaturas e objetos):
//    substitui a "floresta de bolas verdes" por chão de mata (folhas, musgo, galhos),
//    e acrescenta/conserta: grama, terra, rochas, ruínas, esgoto, assoalho, lajotas,
//    calçamento, asfalto, lama, caverna e chão de metal.
// 2) Formas da Oficina (paredes, mesas, canteiros, piscinas…) ganham material automático
//    pelo tom da cor: pedra/concreto, madeira, grama, água, metal — com relevo e sombra.
//    Não altera nenhum dado salvo: é só o desenho. Desligável (window.mesaFormasRealistas=false).
//
// Segurança: tudo passa por ganchos com try/catch no app.js; se este arquivo falhar,
// as texturas e formas antigas continuam valendo.

// ---------------------------------------------------------------- aleatório com semente
export function semente(txt){let h=2166136261;for(const c of String(txt))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// ---------------------------------------------------------------- utilidades de pintura
function manchas(c,w,h,r,n,cores,[rmin,rmax],alpha=[.08,.22]){
 for(let i=0;i<n;i++){
  const x=r()*w,y=r()*h,R=rmin+r()*(rmax-rmin),cor=cores[Math.floor(r()*cores.length)],a=alpha[0]+r()*(alpha[1]-alpha[0]);
  const g=c.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,rgba(cor,a));g.addColorStop(1,rgba(cor,0));
  c.fillStyle=g;c.fillRect(x-R,y-R,R*2,R*2);
 }
}
function graos(c,w,h,r,dens,cores,tam=[.6,1.6]){
 const n=Math.floor(w*h*dens);
 for(let i=0;i<n;i++){c.fillStyle=cores[Math.floor(r()*cores.length)];const s=tam[0]+r()*(tam[1]-tam[0]);c.fillRect(r()*w,r()*h,s,s);}
}
function hex2rgb(h){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return [n>>16&255,n>>8&255,n&255];}
function rgba(hex,a){const [r,g,b]=hex2rgb(hex);return `rgba(${r},${g},${b},${a})`;}
function pedrinhas(c,w,h,r,n,base,[smin,smax]){
 for(let i=0;i<n;i++){
  const x=r()*w,y=r()*h,s=smin+r()*(smax-smin),rot=r()*Math.PI;
  c.save();c.translate(x,y);c.rotate(rot);
  c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(s*.18,s*.22,s,s*.72,0,0,Math.PI*2);c.fill();
  const g=c.createRadialGradient(-s*.3,-s*.3,0,0,0,s*1.1);const [rr,gg,bb]=hex2rgb(base[Math.floor(r()*base.length)]);
  g.addColorStop(0,`rgb(${Math.min(255,rr+45)},${Math.min(255,gg+45)},${Math.min(255,bb+45)})`);g.addColorStop(1,`rgb(${rr},${gg},${bb})`);
  c.fillStyle=g;c.beginPath();c.ellipse(0,0,s,s*.72,0,0,Math.PI*2);c.fill();c.restore();
 }
}
function fissuras(c,w,h,r,n,cor='rgba(20,15,10,.35)',largura=1){
 c.strokeStyle=cor;c.lineCap='round';
 for(let i=0;i<n;i++){
  let x=r()*w,y=r()*h,a=r()*Math.PI*2;c.lineWidth=largura*(.6+r()*.8);c.beginPath();c.moveTo(x,y);
  const passos=4+Math.floor(r()*8);for(let k=0;k<passos;k++){a+=(r()-.5)*1.2;const d=4+r()*12;x+=Math.cos(a)*d;y+=Math.sin(a)*d;c.lineTo(x,y);}
  c.stroke();
 }
}
function folhas(c,w,h,r,n,cores,[smin,smax]){
 for(let i=0;i<n;i++){
  const x=r()*w,y=r()*h,s=smin+r()*(smax-smin),rot=r()*Math.PI*2,cor=cores[Math.floor(r()*cores.length)];
  c.save();c.translate(x,y);c.rotate(rot);
  c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(1,1.2,s,s*.45,0,0,Math.PI*2);c.fill();
  c.fillStyle=cor;c.beginPath();c.moveTo(-s,0);c.quadraticCurveTo(0,-s*.55,s,0);c.quadraticCurveTo(0,s*.55,-s,0);c.fill();
  c.strokeStyle='rgba(0,0,0,.22)';c.lineWidth=.6;c.beginPath();c.moveTo(-s*.9,0);c.lineTo(s*.9,0);c.stroke();
  c.restore();
 }
}
function laminas(c,w,h,r,n,cores,[lmin,lmax]){
 c.lineCap='round';
 for(let i=0;i<n;i++){
  const x=r()*w,y=r()*h,l=lmin+r()*(lmax-lmin),a=-Math.PI/2+(r()-.5)*1.4;
  c.strokeStyle=cores[Math.floor(r()*cores.length)];c.lineWidth=.7+r()*.9;
  c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a)*l*.5+(r()-.5)*3,y+Math.sin(a)*l*.5,x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();
 }
}
function tufos(c,w,h,r,n,cores,raio){
 for(let i=0;i<n;i++){
  const x=r()*w,y=r()*h,R=raio*(.6+r()*.8);
  c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(x+2,y+2,R,R*.7,0,0,Math.PI*2);c.fill();
  for(let k=0;k<14;k++){const a=r()*Math.PI*2,d=r()*R;c.strokeStyle=cores[Math.floor(r()*cores.length)];c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);c.stroke();}
 }
}
function galhos(c,w,h,r,n,cor='#3b2a1a'){
 c.lineCap='round';
 for(let i=0;i<n;i++){
  let x=r()*w,y=r()*h,a=r()*Math.PI*2;const l=10+r()*26;c.strokeStyle=cor;c.lineWidth=1+r()*1.6;
  c.beginPath();c.moveTo(x,y);const x2=x+Math.cos(a)*l,y2=y+Math.sin(a)*l;c.lineTo(x2,y2);c.stroke();
  c.lineWidth*=.6;c.beginPath();c.moveTo(x+Math.cos(a)*l*.5,y+Math.sin(a)*l*.5);a+=(r()<.5?-1:1)*(.5+r()*.5);c.lineTo(x+Math.cos(a)*l*.5+Math.cos(a)*l*.35,y+Math.sin(a)*l*.5+Math.sin(a)*l*.35);c.stroke();
 }
}
function tabuas(c,w,h,r,{larg=18,cores=['#7a5534','#6b4a2c','#83603d','#5f4127'],juntas='rgba(25,15,8,.55)'}={}){
 for(let y=0;y<h;y+=larg){
  let x=-r()*120;
  while(x<w){
   const comp=60+r()*140,cor=cores[Math.floor(r()*cores.length)];
   c.fillStyle=cor;c.fillRect(x,y,comp,larg);
   c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=.8;
   for(let k=0;k<4;k++){const yy=y+2+r()*(larg-4);c.beginPath();c.moveTo(x,yy);c.bezierCurveTo(x+comp*.3,yy+(r()-.5)*3,x+comp*.6,yy+(r()-.5)*3,x+comp,yy);c.stroke();}
   if(r()<.25){c.fillStyle='rgba(40,25,10,.35)';c.beginPath();c.ellipse(x+comp*r(),y+larg/2,2.5,1.6,0,0,Math.PI*2);c.fill();}
   c.fillStyle=juntas;c.fillRect(x+comp-1,y,1.4,larg);x+=comp;
  }
  c.fillStyle=juntas;c.fillRect(0,y+larg-1,w,1.4);
  c.fillStyle='rgba(255,255,255,.05)';c.fillRect(0,y,w,1);
 }
}
function blocos(c,w,h,r,{lado=36,alto=null,cores,junta='rgba(20,18,15,.6)',deslocar=true,irregular=.12,gasto=.25}){
 const H=alto||lado;
 for(let y=0,linha=0;y<h;y+=H,linha++){
  const off=deslocar&&linha%2?lado/2:0;
  for(let x=-off;x<w;x+=lado){
   const cor=cores[Math.floor(r()*cores.length)],j=1.5;
   const dx=(r()-.5)*lado*irregular*.3,dy=(r()-.5)*H*irregular*.3;
   c.fillStyle=cor;c.fillRect(x+j+dx,y+j+dy,lado-j*2,H-j*2);
   const g=c.createLinearGradient(x,y,x+lado,y+H);g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(1,'rgba(0,0,0,.16)');c.fillStyle=g;c.fillRect(x+j+dx,y+j+dy,lado-j*2,H-j*2);
   if(r()<gasto){c.fillStyle='rgba(0,0,0,.12)';c.beginPath();c.ellipse(x+lado*r(),y+H*r(),lado*.25*r()+3,H*.2*r()+2,r()*3,0,Math.PI*2);c.fill();}
  }
 }
 c.strokeStyle=junta;c.lineWidth=1;
}

// ---------------------------------------------------------------- texturas
export const TEXTURAS={
 floresta:{nome:'Floresta (chão de mata)',pintar(c,w,h,r){
  c.fillStyle='#3a3622';c.fillRect(0,0,w,h);
  manchas(c,w,h,r,Math.floor(w*h/2500),['#4c5a2a','#5d6b30','#2f3a1c','#6a5a33','#3e4a24'],[25,90],[.25,.5]);
  manchas(c,w,h,r,Math.floor(w*h/9000),['#6f8a3a','#7d9b45'],[18,50],[.18,.35]);
  graos(c,w,h,r,.05,['rgba(20,18,10,.35)','rgba(120,110,70,.25)']);
  folhas(c,w,h,r,Math.floor(w*h/90),['#6b5a2a','#7d6a32','#5a6b2a','#8a6a2a','#4e5e26','#9a7a3a','#73502a'],[3,6.5]);
  galhos(c,w,h,r,Math.floor(w*h/7000));
  tufos(c,w,h,r,Math.floor(w*h/5000),['#5f7d2e','#6e8f36','#4a6626'],9);
  pedrinhas(c,w,h,r,Math.floor(w*h/22000),['#6b675c','#5a574e'],[4,9]);
 }},
 grama:{nome:'Grama',pintar(c,w,h,r){
  c.fillStyle='#4f7a2c';c.fillRect(0,0,w,h);
  manchas(c,w,h,r,Math.floor(w*h/3000),['#5d8a33','#3f6824','#6a9238','#4a7028','#7a8f3a'],[25,80],[.25,.45]);
  laminas(c,w,h,r,Math.floor(w*h/7),['#3d6322','#5b8a30','#6f9e3c','#4a7429','#85b04a'],[3,7]);
  for(let i=0;i<Math.floor(w*h/9000);i++){const x=r()*w,y=r()*h,cor=['#f2f2e6','#ffd447','#c9a0dc'][Math.floor(r()*3)];for(let k=0;k<5;k++){c.fillStyle=cor;c.beginPath();c.arc(x+(r()-.5)*10,y+(r()-.5)*10,1.3,0,Math.PI*2);c.fill();}}
 }},
 terra:{nome:'Terra',pintar(c,w,h,r){
  c.fillStyle='#6b4f34';c.fillRect(0,0,w,h);
  manchas(c,w,h,r,Math.floor(w*h/2500),['#7a5c3d','#5a412a','#80654a','#4d3824'],[20,80],[.25,.45]);
  graos(c,w,h,r,.12,['rgba(40,28,15,.35)','rgba(150,120,85,.3)','rgba(90,70,45,.4)']);
  fissuras(c,w,h,r,Math.floor(w*h/22000),'rgba(35,22,12,.3)',.8);
  pedrinhas(c,w,h,r,Math.floor(w*h/2500),['#8a7a66','#6e6252','#9a8a74'],[1.5,4]);
  tufos(c,w,h,r,Math.floor(w*h/16000),['#6a7a35','#58682c'],7);
 }},
 lama:{nome:'Lama',pintar(c,w,h,r){
  c.fillStyle='#4a3a28';c.fillRect(0,0,w,h);
  manchas(c,w,h,r,Math.floor(w*h/2200),['#3a2c1d','#5a4630','#2e2418'],[25,90],[.3,.55]);
  for(let i=0;i<Math.floor(w*h/12000);i++){const x=r()*w,y=r()*h,R=10+r()*35;const g=c.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,'rgba(70,80,75,.55)');g.addColorStop(.7,'rgba(60,60,50,.35)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.ellipse(x,y,R,R*.6,r()*3,0,Math.PI*2);c.fill();c.strokeStyle='rgba(220,230,220,.12)';c.lineWidth=1;c.beginPath();c.ellipse(x-R*.2,y-R*.15,R*.5,R*.25,0,3.6,5.6);c.stroke();}
  graos(c,w,h,r,.06,['rgba(20,15,8,.4)','rgba(120,100,70,.2)']);
 }},
 rochas:{nome:'Rochas',pintar(c,w,h,r){
  c.fillStyle='#45423e';c.fillRect(0,0,w,h);
  manchas(c,w,h,r,Math.floor(w*h/1800),['#55524c','#34312d','#5e594f','#3c3934','#2b2926'],[25,100],[.3,.5]);
  graos(c,w,h,r,.11,['rgba(0,0,0,.28)','rgba(210,205,195,.16)','rgba(120,115,105,.2)']);
  fissuras(c,w,h,r,Math.floor(w*h/10000),'rgba(12,11,10,.45)',1.2);
  pedrinhas(c,w,h,r,Math.floor(w*h/3200),['#6e6a61','#5b574f','#7c776c'],[2,6]);
  pedrinhas(c,w,h,r,Math.floor(w*h/38000),['#6e6a61','#5b574f'],[9,16]);
 }},
 masmorra:{nome:'Masmorra (rocha viva)',pintar(c,w,h,r){
  c.fillStyle='#0d0c0b';c.fillRect(0,0,w,h);
  manchas(c,w,h,r,Math.floor(w*h/1400),['#161412','#080706','#1c1913','#100e0c','#0a0a0d'],[30,120],[.35,.6]);
  graos(c,w,h,r,.08,['rgba(0,0,0,.35)','rgba(150,140,125,.09)','rgba(60,55,48,.25)']);
  fissuras(c,w,h,r,Math.floor(w*h/6500),'rgba(0,0,0,.6)',1.4);
  fissuras(c,w,h,r,Math.floor(w*h/26000),'rgba(90,84,72,.12)',1);
  pedrinhas(c,w,h,r,Math.floor(w*h/6000),['#262320','#1c1915'],[2,5]);
  for(let i=0;i<Math.floor(w*h/30000);i++){const x=r()*w,y=r()*h,R=20+r()*50;const g=c.createRadialGradient(x,y,R*.3,x,y,R);g.addColorStop(0,'rgba(0,0,0,.4)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.ellipse(x,y,R,R*.7,r()*3,0,Math.PI*2);c.fill();}
  // vinheta das bordas (luz cai para o centro do mapa, como a referência)
  const vg=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.30,w/2,h/2,Math.max(w,h)*.72);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(.75,'rgba(0,0,0,.28)');vg.addColorStop(1,'rgba(0,0,0,.62)');
  c.fillStyle=vg;c.fillRect(0,0,w,h);
 }},
 caverna:{nome:'Caverna',pintar(c,w,h,r){
  c.fillStyle='#2b2825';c.fillRect(0,0,w,h);
  manchas(c,w,h,r,Math.floor(w*h/1600),['#38332f','#211e1c','#413a33','#272b26','#1a1816'],[25,105],[.3,.55]);
  graos(c,w,h,r,.1,['rgba(0,0,0,.3)','rgba(170,160,150,.12)']);
  fissuras(c,w,h,r,Math.floor(w*h/6000),'rgba(5,5,5,.55)',1.2);
  pedrinhas(c,w,h,r,Math.floor(w*h/4200),['#524c45','#443f39'],[2,6]);
  manchas(c,w,h,r,Math.floor(w*h/40000),['#3a5a4a'],[15,40],[.15,.25]);
  manchas(c,w,h,r,Math.floor(w*h/45000),['#31502f','#3f5a35'],[12,34],[.2,.35]);
 }},
 ruinas:{nome:'Ruínas',pintar(c,w,h,r){
  c.fillStyle='#5d564c';c.fillRect(0,0,w,h);
  blocos(c,w,h,r,{lado:44,alto:30,cores:['#6e675c','#655e53','#787064','#5a544a','#71695c'],gasto:.4});
  manchas(c,w,h,r,Math.floor(w*h/3500),['#3a4a2a','#4a5a30','#2e2a24'],[20,70],[.25,.45]);
  fissuras(c,w,h,r,Math.floor(w*h/16000),'rgba(20,18,15,.35)',.9);
  pedrinhas(c,w,h,r,Math.floor(w*h/3000),['#7d766a','#6a6458'],[2,5]);
  tufos(c,w,h,r,Math.floor(w*h/9000),['#5d7a2e','#6e8f36'],8);
 }},
 esgoto:{nome:'Esgoto (concreto úmido)',pintar(c,w,h,r){
  c.fillStyle='#4b5048';c.fillRect(0,0,w,h);
  blocos(c,w,h,r,{lado:48,alto:48,cores:['#545a52','#4c524a','#5a5f56','#474c45'],deslocar:false,gasto:.5});
  manchas(c,w,h,r,Math.floor(w*h/2500),['#2f3a2c','#3c4a2e','#1f2420','#5a5030'],[20,80],[.3,.55]);
  for(let i=0;i<Math.floor(w*h/9000);i++){const x=r()*w,y=r()*h,R=8+r()*28;c.fillStyle='rgba(30,45,40,.45)';c.beginPath();c.ellipse(x,y,R,R*.55,r()*3,0,Math.PI*2);c.fill();c.strokeStyle='rgba(200,230,220,.12)';c.lineWidth=1;c.beginPath();c.ellipse(x-R*.25,y-R*.1,R*.45,R*.2,0,3.4,5.8);c.stroke();}
  graos(c,w,h,r,.06,['rgba(0,0,0,.3)','rgba(150,160,140,.15)']);
  for(let i=0;i<Math.floor(w*h/30000);i++){const x=r()*w,y=r()*h;c.strokeStyle='rgba(30,30,28,.8)';c.lineWidth=2;c.strokeRect(x,y,26,26);for(let k=4;k<26;k+=5){c.beginPath();c.moveTo(x+k,y+2);c.lineTo(x+k,y+24);c.stroke();}}
 }},
 assoalho:{nome:'Assoalho de madeira',pintar(c,w,h,r){c.fillStyle='#5f4127';c.fillRect(0,0,w,h);tabuas(c,w,h,r);manchas(c,w,h,r,Math.floor(w*h/9000),['#2a1a0c'],[20,60],[.08,.18]);}},
 lajotas:{nome:'Lajotas',pintar(c,w,h,r){c.fillStyle='#8a7a66';c.fillRect(0,0,w,h);blocos(c,w,h,r,{lado:40,cores:['#b5a48a','#a8977c','#bfae93','#9d8d74'],deslocar:false,gasto:.2});c.fillStyle='rgba(255,255,255,.10)';for(let y=0;y<h;y+=40)c.fillRect(0,y+1,w,1.2);for(let x=0;x<w;x+=40)c.fillRect(x+1,0,1.2,h);graos(c,w,h,r,.04,['rgba(0,0,0,.15)','rgba(255,255,255,.12)']);fissuras(c,w,h,r,Math.floor(w*h/60000),'rgba(30,25,18,.25)',.8);}},
 calcamento:{nome:'Calçamento de pedra',pintar(c,w,h,r){c.fillStyle='#3e3a35';c.fillRect(0,0,w,h);blocos(c,w,h,r,{lado:22,alto:18,cores:['#77716a','#6a645d','#837c73','#5f5a54'],irregular:.6,gasto:.3});manchas(c,w,h,r,Math.floor(w*h/6000),['#2a2622'],[20,60],[.12,.25]);}},
 asfalto:{nome:'Asfalto / rua',pintar(c,w,h,r){c.fillStyle='#2c2e30';c.fillRect(0,0,w,h);manchas(c,w,h,r,Math.floor(w*h/2500),['#3a3c3e','#232526','#34312c'],[20,90],[.3,.5]);graos(c,w,h,r,.25,['rgba(0,0,0,.35)','rgba(160,160,160,.18)','rgba(90,90,90,.3)']);fissuras(c,w,h,r,Math.floor(w*h/9000),'rgba(10,10,10,.6)',1.2);}},
 chao_metal:{nome:'Chão de metal (nave)',pintar(c,w,h,r){
  c.fillStyle='#4a5058';c.fillRect(0,0,w,h);const L=64;
  for(let y=0;y<h;y+=L)for(let x=0;x<w;x+=L){const g=c.createLinearGradient(x,y,x+L,y+L);const b=70+r()*16;g.addColorStop(0,`rgb(${b+6},${b+12},${b+20})`);g.addColorStop(1,`rgb(${b-14},${b-8},${b})`);c.fillStyle=g;c.fillRect(x+1,y+1,L-2,L-2);
   c.fillStyle='rgba(20,22,26,.8)';for(const [px,py] of [[5,5],[L-7,5],[5,L-7],[L-7,L-7]]){c.beginPath();c.arc(x+px+1,y+py+1,1.8,0,Math.PI*2);c.fill();}
   if(r()<.2){c.strokeStyle='rgba(255,255,255,.07)';for(let k=6;k<L-6;k+=6){c.beginPath();c.moveTo(x+6,y+k);c.lineTo(x+L-6,y+k);c.stroke();}}}
  manchas(c,w,h,r,Math.floor(w*h/12000),['#6a4a2a','#1a1c20'],[10,40],[.12,.25]);
 }},
 neve:{nome:'Neve',pintar(c,w,h,r){c.fillStyle='#e9eef3';c.fillRect(0,0,w,h);manchas(c,w,h,r,Math.floor(w*h/2500),['#d5dee8','#ffffff','#c9d4e0','#b8c6d6'],[25,90],[.35,.6]);graos(c,w,h,r,.05,['rgba(255,255,255,.9)','rgba(160,180,200,.3)']);for(let i=0;i<Math.floor(w*h/7000);i++){const x=r()*w,y=r()*h;c.strokeStyle='rgba(150,170,190,.25)';c.lineWidth=1.2;c.beginPath();c.arc(x,y,6+r()*10,3.3,5.9);c.stroke();}}},
};
export const NOMES_NOVOS=['esgoto','assoalho','lajotas','calcamento','asfalto','lama','chao_metal','rochas','ruinas','grama','caverna'];

export function pintarTextura(nome,canvas){
 const t=TEXTURAS[nome];if(!t)return false;
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 t.pintar(c,w,h,rng(semente(nome+':'+w+'x'+h)));
 return true;
}

// ---------------------------------------------------------------- material das formas
function hsl(hex){
 let [r,g,b]=hex2rgb(hex).map(v=>v/255);const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;let h=0,s=0;
 if(max!==min){const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h*=60;}
 return {h,s,l};
}
// Decide o material de uma forma da Oficina pelo tom da cor e pelo bloqueio.
export function materialDaForma(e){
 if(!e||e.type!=='shape'||e.src)return null;
 if(e.material==='nenhum')return null;
 if(e.material&&MATERIAIS[e.material])return e.material;
 const fill=String(e.fill||'');if(!/^#[0-9a-f]{3,8}$/i.test(fill)||Number(e.fillOpacity??1)<.5)return null;
 const {h,s,l}=hsl(fill.slice(0,7)),bloq=String(e.bloqueiaMovimento)!=='false'&&e.bloqueiaMovimento!==false;
 if(h>=175&&h<=235&&s>.25&&l>.3)return 'agua';
 if(h>=70&&h<=160&&s>.18&&l<.75)return 'grama';
 if(h>=10&&h<=50&&s>.18&&l<.55)return 'madeira';
 if(s<.18&&l<.42)return bloq?'pedra':'piso_escuro';
 if(s<.18)return bloq?'concreto':null;
 if(h>=190&&h<=260&&s<.35)return 'metal';
 return bloq?'concreto':null;
}
const MATERIAIS={
 pedra:p=>{const s=p*.9,H=s*.72,L=s*1.5;return `<pattern id="mv110-pedra-${p}" width="${L}" height="${H*2}" patternUnits="userSpaceOnUse"><rect width="${L}" height="${H*2}" fill="none"/>
  <path d="M0 ${H*.5}H${L}M${L*.5} 0V${H*.5}M0 ${H*1.5}H${L}M${L*.5} ${H}V${H*1.5}" stroke="rgba(0,0,0,.48)" stroke-width="1.6"/>
  <path d="M1 1H${L*.48}M1 ${H*.52}H${L*.48}M${L*.52} ${H*.52}H${L-1}M1 ${H+1}H${L*.48}M${L*.52} ${H+1}H${L-1}" stroke="rgba(255,255,255,.34)" stroke-width="1.4"/>
  <path d="M0 ${H-1}H${L}M0 ${H*2-1}H${L}" stroke="rgba(0,0,0,.4)" stroke-width="1.2"/>
  <circle cx="${L*.24}" cy="${H*.24}" r="1.2" fill="rgba(0,0,0,.24)"/><circle cx="${L*.76}" cy="${H*1.26}" r="1.4" fill="rgba(0,0,0,.22)"/><circle cx="${L*.6}" cy="${H*.7}" r="1" fill="rgba(255,255,255,.20)"/></pattern>`;},
 concreto:p=>`<pattern id="mv110-concreto-${p}" width="${p*1.5}" height="${p*1.5}" patternUnits="userSpaceOnUse"><rect width="${p*1.5}" height="${p*1.5}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1"/><path d="M0 1H${p*1.5}" stroke="rgba(255,255,255,.10)"/><circle cx="${p*.3}" cy="${p*.4}" r="1" fill="rgba(0,0,0,.25)"/><circle cx="${p*1.1}" cy="${p*.9}" r="1.2" fill="rgba(255,255,255,.18)"/><circle cx="${p*.7}" cy="${p*1.2}" r=".9" fill="rgba(0,0,0,.2)"/></pattern>`,
 madeira:p=>`<pattern id="mv110-madeira-${p}" width="${p*2}" height="${p*.32}" patternUnits="userSpaceOnUse"><rect width="${p*2}" height="${p*.32}" fill="none"/><path d="M0 ${p*.31}H${p*2}" stroke="rgba(30,15,5,.5)" stroke-width="1.2"/><path d="M0 ${p*.05}H${p*2}" stroke="rgba(255,235,200,.14)"/><path d="M0 ${p*.12}C${p*.6} ${p*.08},${p*1.2} ${p*.18},${p*2} ${p*.12}M0 ${p*.22}C${p*.7} ${p*.26},${p*1.3} ${p*.17},${p*2} ${p*.22}" stroke="rgba(0,0,0,.16)" fill="none" stroke-width=".8"/><path d="M${p*1.3} 0V${p*.32}" stroke="rgba(30,15,5,.4)" stroke-width="1"/></pattern>`,
 grama:p=>`<pattern id="mv110-grama-${p}" width="${p*.5}" height="${p*.5}" patternUnits="userSpaceOnUse"><path d="M${p*.1} ${p*.4}l1 -${p*.14}M${p*.3} ${p*.2}l-1 -${p*.12}M${p*.42} ${p*.46}l1.2 -${p*.13}M${p*.2} ${p*.12}l.8 -${p*.1}" stroke="rgba(20,50,10,.45)" stroke-width="1"/><path d="M${p*.36} ${p*.33}l-.8 -${p*.12}M${p*.05} ${p*.2}l1 -${p*.1}" stroke="rgba(190,230,120,.35)" stroke-width="1"/></pattern>`,
 agua:p=>`<pattern id="mv110-agua-${p}" width="${p*2}" height="${p}" patternUnits="userSpaceOnUse"><path d="M0 ${p*.3}q${p*.25} -${p*.12} ${p*.5} 0t${p*.5} 0M${p} ${p*.75}q${p*.25} -${p*.12} ${p*.5} 0t${p*.5} 0" stroke="rgba(255,255,255,.38)" fill="none" stroke-width="1.2"/><path d="M0 ${p*.55}q${p*.25} -${p*.1} ${p*.5} 0t${p*.5} 0" stroke="rgba(0,40,60,.25)" fill="none" stroke-width="1"/></pattern>`,
 metal:p=>`<pattern id="mv110-metal-${p}" width="${p}" height="${p}" patternUnits="userSpaceOnUse"><rect width="${p}" height="${p}" fill="none" stroke="rgba(0,0,0,.3)"/><path d="M1 1H${p-1}M1 1V${p-1}" stroke="rgba(255,255,255,.14)"/><circle cx="3" cy="3" r="1.2" fill="rgba(0,0,0,.45)"/><circle cx="${p-3}" cy="${p-3}" r="1.2" fill="rgba(0,0,0,.45)"/><path d="M2 ${p*.5}H${p-2}" stroke="rgba(255,255,255,.08)"/></pattern>`,
 rocha:p=>{const L=p*1.3,H=p*1.1;return `<pattern id="mv110-rocha-${p}" width="${L}" height="${H}" patternUnits="userSpaceOnUse"><rect width="${L}" height="${H}" fill="none"/><circle cx="${p*.2}" cy="${p*.3}" r="${p*.09}" fill="rgba(255,255,255,.06)"/><circle cx="${p*.85}" cy="${p*.7}" r="${p*.13}" fill="rgba(0,0,0,.22)"/><circle cx="${p*.5}" cy="${p*.5}" r="${p*.06}" fill="rgba(0,0,0,.18)"/><path d="M${p*.1} ${p*.9}l${p*.25} -${p*.12}l${p*.2} ${p*.05}M${p*.55} ${p*.2}l${p*.18} ${p*.08}l${p*.14} -${p*.06}" stroke="rgba(0,0,0,.32)" fill="none" stroke-width="1"/><path d="M${p*.15} ${p*.15}l${p*.12} ${p*.1}" stroke="rgba(255,255,255,.12)" stroke-width="1"/><circle cx="${p*.55}" cy="${p*.15}" r="1.5" fill="rgba(255,255,255,.08)"/></pattern>`;},
 lajota:p=>{const L=p*.75,T=4,Wd=L*T,Hg=L*T;let tiles='';
  // 4×4 lajotas com variação sutil de tom por tile (determinístico, como a referência)
  const tons=['rgba(255,255,255,.08)','rgba(0,0,0,.08)','rgba(255,255,255,.04)','rgba(0,0,0,.12)','rgba(255,244,220,.08)','rgba(0,0,0,.05)','rgba(255,255,255,.10)','rgba(0,0,0,.10)','rgba(255,244,220,.05)','rgba(0,0,0,.07)','rgba(255,255,255,.07)','rgba(0,0,0,.11)','rgba(255,255,255,.05)','rgba(0,0,0,.09)','rgba(255,244,220,.09)','rgba(0,0,0,.04)'];
  for(let ty=0;ty<T;ty++)for(let tx=0;tx<T;tx++){tiles+=`<rect x="${tx*L}" y="${ty*L}" width="${L}" height="${L}" fill="${tons[(ty*T+tx)%tons.length]}"/>`;}
  return `<pattern id="mv110-lajota-${p}" width="${Wd}" height="${Hg}" patternUnits="userSpaceOnUse"><rect width="${Wd}" height="${Hg}" fill="none"/>${tiles}
  <path d="${Array.from({length:T+1},(_,k)=>`M${k*L} 0V${Hg}`).join('')}${Array.from({length:T+1},(_,k)=>`M0 ${k*L}H${Wd}`).join('')}" stroke="rgba(20,16,12,.42)" stroke-width="1.2"/>
  <path d="${Array.from({length:T},(_,k)=>`M${k*L+1.4} 1.4V${Hg-1.4}`).join('')}${Array.from({length:T},(_,k)=>`M1.4 ${k*L+1.4}H${Wd-1.4}`).join('')}" stroke="rgba(255,250,235,.10)" stroke-width="1"/></pattern>`;},
 trilha:p=>`<pattern id="mv110-trilha-${p}" width="${p*.6}" height="${p*.6}" patternUnits="userSpaceOnUse"><rect width="${p*.6}" height="${p*.6}" fill="none"/><circle cx="${p*.12}" cy="${p*.2}" r="1.1" fill="rgba(20,16,10,.4)"/><circle cx="${p*.42}" cy="${p*.45}" r="1.4" fill="rgba(140,125,100,.32)"/><circle cx="${p*.3}" cy="${p*.08}" r=".8" fill="rgba(25,20,12,.35)"/><path d="M${p*.05} ${p*.5}l${p*.15} -${p*.02}" stroke="rgba(25,20,12,.3)"/><circle cx="${p*.5}" cy="${p*.15}" r=".9" fill="rgba(0,0,0,.3)"/></pattern>`,
 piso_escuro:p=>`<pattern id="mv110-piso_escuro-${p}" width="${p}" height="${p}" patternUnits="userSpaceOnUse"><rect width="${p}" height="${p}" fill="none" stroke="rgba(255,255,255,.06)"/><circle cx="${p*.25}" cy="${p*.3}" r=".8" fill="rgba(0,0,0,.3)"/><circle cx="${p*.7}" cy="${p*.75}" r=".7" fill="rgba(255,255,255,.05)"/><path d="M${p*.1} ${p*.6}l${p*.2} ${p*.05}" stroke="rgba(0,0,0,.25)" stroke-width=".8"/></pattern>`,
 // v196: blindagem de paredes do complexo (placas de metal com rebites e marca de alerta)
 blindagem:p=>{const L=p*1.5,H=p*1.5;return `<pattern id="mv110-blindagem-${p}" width="${L}" height="${H}" patternUnits="userSpaceOnUse"><rect width="${L}" height="${H}" fill="none"/>
  <path d="M0 ${H*.5}H${L}M${L*.5} 0V${H*.5}" stroke="rgba(0,0,0,.42)" stroke-width="1.6"/>
  <path d="M2 2H${L*.48}M2 ${H*.52}H${L*.48}M${L*.52} ${H*.52}H${L-2}M2 2V${H*.48}M${L*.52} 2V${H*.48}" stroke="rgba(255,255,255,.20)" stroke-width="1.3"/>
  <path d="M0 ${H-1.6}H${L}M0 ${H*.5-1.6}H${L}" stroke="rgba(0,0,0,.34)" stroke-width="1.1"/>
  <circle cx="${L*.12}" cy="${H*.12}" r="1.4" fill="rgba(0,0,0,.4)"/><circle cx="${L*.88}" cy="${H*.12}" r="1.4" fill="rgba(0,0,0,.4)"/><circle cx="${L*.12}" cy="${H*.88}" r="1.4" fill="rgba(0,0,0,.4)"/><circle cx="${L*.88}" cy="${H*.88}" r="1.4" fill="rgba(0,0,0,.4)"/>
  <circle cx="${L*.62}" cy="${H*.3}" r="1" fill="rgba(255,255,255,.15)"/><circle cx="${L*.3}" cy="${H*.7}" r="1" fill="rgba(255,255,255,.13)"/>
  <rect x="${L*.06}" y="${H*.47}" width="${L*.14}" height="2" fill="rgba(255,209,71,.26)"/></pattern>`;},
 // v196: painel de piso do complexo (placas de deck com emendas luminosas)
 painel:p=>{const L=p*1.6,H=p*1.6;let g='';
  for(const [x,y] of [[0,0],[L/2,0],[0,H/2],[L/2,H/2]]){
   g+=`<rect x="${x+2}" y="${y+2}" width="${L/2-4}" height="${H/2-4}" fill="none" stroke="rgba(0,0,0,.38)" stroke-width="1.4"/>`;
   g+=`<path d="M${x+3.4} ${y+3.4}H${x+L/2-3.4}M${x+3.4} ${y+3.4}V${y+H/2-3.4}" stroke="rgba(255,255,255,.10)" stroke-width="1.1"/>`;
   g+=`<circle cx="${x+5}" cy="${y+5}" r="1.2" fill="rgba(0,0,0,.42)"/><circle cx="${x+L/2-5}" cy="${y+5}" r="1.2" fill="rgba(0,0,0,.42)"/><circle cx="${x+5}" cy="${y+H/2-5}" r="1.2" fill="rgba(0,0,0,.42)"/><circle cx="${x+L/2-5}" cy="${y+H/2-5}" r="1.2" fill="rgba(0,0,0,.42)"/>`;
  }
  g+=`<rect x="${L*.5-7}" y="${H*.5-1}" width="14" height="2" rx="1" fill="rgba(111,231,255,.30)"/>`;
  return `<pattern id="mv110-painel-${p}" width="${L}" height="${H}" patternUnits="userSpaceOnUse"><rect width="${L}" height="${H}" fill="none"/>${g}</pattern>`;},
};
// Recebe o SVG original de uma forma e devolve uma versão com material, relevo e sombra.
// v196-realismo: sombras suaves (blur), volume por gradiente de luz e grão (ruído) por cima do material.
export function formaRealista(e,svgBase,p){
 const mat=materialDaForma(e);if(!mat)return svgBase;
 const m=/^<(rect|ellipse|polygon|path)\b([^>]*)\/>$/s.exec(String(svgBase).trim());if(!m)return svgBase;
 const [,tag,attrs]=m;const pp=Math.round(Number(p)||32);
 const geo=attrs.replace(/\s(fill|fill-opacity|stroke|stroke-opacity|stroke-width|vector-effect)="[^"]*"/g,'');
 const bloq=String(e.bloqueiaMovimento)!=='false'&&e.bloqueiaMovimento!==false;
 const fino=Math.min(Number(e.w)||1,Number(e.h)||1)*pp;
 const temSombra=bloq&&mat!=='agua'&&mat!=='grama'&&String(e.shadow||'nenhuma')==='nenhuma';
 const rotM=/\stransform="([^"]*)"/.exec(geo),geoSemRot=geo.replace(/\stransform="[^"]*"/,'');
 const comRot=rotM?` transform="${rotM[1]}"`:'';
 // paredes (formas finas que bloqueiam): sombra de contato + sombra projetada no piso (ambas suaves)
 const paredeFina=bloq&&fino<=pp*.8&&mat!=='rocha';
 const sombraG=temSombra?`<g filter="url(#mv110-blur)" transform="translate(${Math.max(2,pp*.07)},${Math.max(2,pp*.09)})"><${tag}${geoSemRot}${comRot} fill="#000" fill-opacity=".38"/></g>`:'';
 const sombraChao=paredeFina?`<g filter="url(#mv110-blur)" transform="translate(${Math.max(3,pp*.17)},${Math.max(3,pp*.22)})"><${tag}${geoSemRot}${comRot} fill="#000" fill-opacity=".24"/></g>`:'';
 const off=Math.max(1,Math.min(2.4,pp*.045));
 // relevo: face de topo (claro, deslocado para noroeste) + espessura (escuro, deslocado para sudeste)
 const relevo=bloq&&mat!=='agua'?`<g transform="translate(${-off} ${-off})"><${tag}${geoSemRot}${comRot} fill="none" stroke="rgba(255,255,255,${mat==='rocha'?.22:.34})" stroke-width="${Math.max(1.2,Math.min(3.2,fino*.09))}"/></g><g transform="translate(${off} ${off})"><${tag}${geoSemRot}${comRot} fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1.2"/></g>`:'';
 // volume: gradiente de luz diagonal (claro NW → escuro SE) por cima do preenchimento base
 const grao=(mat==='agua'||mat==='grama')?'':`<${tag}${geo} filter="url(#mv110-grain)" opacity="${bloq?.16:.11}"/>`;
 const luz=`<${tag}${geo} fill="url(#mv110-luz)"/>`;
 const brilhoAgua=mat==='agua'?`<${tag}${geo} fill="none" stroke="rgba(0,0,0,.35)" stroke-width="${Math.max(2,pp*.12)}"/>`:'';
 const borda=mat==='grama'?`<${tag}${geo} fill="none" stroke="rgba(40,60,20,.55)" stroke-width="2"/>`:'';
 const defs=`<defs>${MATERIAIS[mat](pp)}<linearGradient id="mv110-luz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".13"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".20"/></linearGradient><filter id="mv110-grain" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .9 0"/></filter><filter id="mv110-blur" x="-30%" y="-30%" width="170%" height="170%"><feGaussianBlur stdDeviation="${Math.max(1.4,pp*.05)}"/></filter></defs>`;
 return `${defs}${sombraChao}${sombraG}${svgBase}${luz}<${tag}${geo} fill="url(#mv110-${mat}-${pp})"/>${grao}${brilhoAgua}${borda}${relevo}`;
}

// ---------------------------------------------------------------- instalação
export function instalarArteMapa(dep){
 const win=dep.win||window,doc=win.document;
 const G=dep.Gerador;
 if(G?.prototype?.applyTexture&&!G.prototype.__mv110){
  const base=G.prototype.applyTexture;
  G.prototype.applyTexture=function(nome,...resto){
   try{if(win.mesaTexturasNovas!==false&&pintarTextura(nome,this.canvas))return;}catch(e){console.warn('[Arte do mapa] textura',nome,e);}
   return base.call(this,nome,...resto);
  };
  G.prototype.__mv110=true;
 }
 win.mesaFormaV110_=(e,svg,p)=>win.mesaFormasRealistas===false?svg:formaRealista(e,svg,p);
 if(!win.mesaTexturaPPM)win.mesaTexturaPPM=36;
 try{dep.limparCache?.();}catch(_){}
 // novas opções no seletor de textura da Oficina
 const rotulos=Object.fromEntries(Object.entries(TEXTURAS).map(([k,t])=>[k,t.nome]));
 const completar=()=>{
  const sel=doc.getElementById('gm2texture');if(!sel||sel.dataset.mv110)return;sel.dataset.mv110='1';
  const tem=new Set([...sel.options].map(o=>o.value));
  for(const [k,n] of Object.entries(rotulos)){if(tem.has(k)){const o=[...sel.options].find(x=>x.value===k);if(o&&k==='floresta')o.textContent=n;continue;}const o=doc.createElement('option');o.value=k;o.textContent=n;sel.append(o);}
 };
 completar();const t=setInterval(completar,3000);
 return {texturas:Object.keys(TEXTURAS),parar:()=>clearInterval(t)};
}
