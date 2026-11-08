// Gera as texturas novas de arte/texturas (256×256, SEM emenda: repetem sem costura) desenhando num canvas do Chrome.
// Uso: node scripts/gerar-texturas-v197.cjs   (usa o Chrome já instalado e o Playwright do ambiente; não precisa de Python)
// Texturas: metal enferrujado, cromado, mármore branco/negro/vermelho, ouro, jade.
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const saida=path.join(__dirname,'..','arte','texturas');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage();await page.setContent('<canvas id="c" width="256" height="256"></canvas>');
 const lista=await page.evaluate(()=>{
  const N=256,cv=document.getElementById('c'),ctx=cv.getContext('2d');
  // ---------- ruído periódico (sem emenda)
  let sem=1;const rnd=()=>{sem=(sem*1664525+1013904223)>>>0;return sem/4294967296;};
  const grade=(p,s)=>{sem=s;const g=new Float32Array(p*p);for(let i=0;i<g.length;i++)g[i]=rnd();return g;};
  const suave=t=>t*t*(3-2*t);
  const valor=(g,p,x,y)=>{const x0=Math.floor(x)%p,y0=Math.floor(y)%p,x1=(x0+1)%p,y1=(y0+1)%p,fx=suave(x-Math.floor(x)),fy=suave(y-Math.floor(y));
   const a=g[y0*p+x0],b=g[y0*p+x1],c=g[y1*p+x0],d=g[y1*p+x1];return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;};
  const fbm=(gs,u,v,oit=4)=>{let s=0,amp=.5,tot=0;for(let o=0;o<oit;o++){const p=4<<o;s+=amp*valor(gs[o],p,u*p,v*p);tot+=amp;amp/=2;}return s/tot;};
  const novoFbm=(seed)=>[0,1,2,3,4].map((o,i)=>grade(4<<i,seed+i*97));
  const mistura=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const lim=v=>Math.max(0,Math.min(255,v));
  function pintar(f){const im=ctx.createImageData(N,N);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=f(x/N,y/N,x,y);const i=(y*N+x)*4;im.data[i]=lim(c[0]);im.data[i+1]=lim(c[1]);im.data[i+2]=lim(c[2]);im.data[i+3]=255;}ctx.putImageData(im,0,0);}
  // emendas de placas (lajotas de 128 px): linha escura fina + brilho ao lado, repetem sem costura
  const placa=(x,y,cel=128)=>{const dx=Math.min(x%cel,cel-(x%cel)),dy=Math.min(y%cel,cel-(y%cel));const d=Math.min(dx,dy);return d<1.2?-1:d<2.4?.5:0;};
  const saidas={};
  // ---------- mármore: veios = seno distorcido por ruído periódico
  function marmore(seed,base,veio,veio2,fundoClaro,forca=1){
   const F=novoFbm(seed),G=novoFbm(seed+500);
   const hp=(i,j,k)=>{const t=Math.sin(i*127.1+j*311.7+k*74.7+seed)*43758.5453;return t-Math.floor(t);};
   pintar((u,v,x,y)=>{
    /* cada bloco (128 px) ganha deslocamento, giro e intensidade de veio próprios: nenhum bloco igual ao outro */
    const bi=Math.floor(x/128),bj=Math.floor(y/128);
    let uu=(u+hp(bi,bj,1))%1,vv=(v+hp(bi,bj,2))%1;if(hp(bi,bj,3)>.5){const t=uu;uu=vv;vv=t;}
    const dens=.25+hp(bi,bj,4)*.75,tom=.85+hp(bi,bj,5)*.3;
    const r1=1-Math.abs(2*fbm(F,uu,vv,5)-1),r2=1-Math.abs(2*fbm(G,uu,vv,4)-1);
    const v1=Math.pow(r1,16+(1-dens)*14),v2=Math.pow(r2,34+(1-dens)*20)*.9;
    let c=mistura(hex(base),hex(fundoClaro),Math.pow(fbm(F,vv,uu,3),1.4));
    c=[c[0]*tom,c[1]*tom,c[2]*tom];
    c=mistura(c,hex(veio),Math.min(1,v1*.85*dens*forca));c=mistura(c,hex(veio2),Math.min(1,v2*dens*Math.max(.6,forca)));
    const g=placa(x,y);if(g<0)return mistura(c,[20,20,24],.55);if(g>0)return mistura(c,[255,255,255],.14);
    const r=(Math.sin(x*12.9898+y*78.233)*43758.5453)%1;return [c[0]+r*5,c[1]+r*5,c[2]+r*5];
   });return cv.toDataURL('image/webp',.92);
  }
  saidas.marmore_branco=marmore(11,'#ebe8e1','#8d8f96','#b9b4aa','#f6f4ef');
  saidas.marmore_negro=marmore(23,'#1c1c21','#d8d6d0','#8a7a52','#2c2c33',.38);
  saidas.marmore_vermelho=marmore(37,'#8a2323','#f0d9c8','#4a0e0e','#a63838',.42);
  // ---------- ouro: faixas escovadas + martelado + brilho em diagonal
  {const F=novoFbm(51),G=novoFbm(52);
   pintar((u,v,x,y)=>{
    const esc=fbm(F,u*.12,v*3,3)*.6+(((Math.sin(y*91.3+x*.07)*43758.5453)%1)*.07),m=fbm(G,u,v,4);
    const diag=Math.pow(Math.abs(Math.sin((u+v)*Math.PI*2)),6);
    let c=mistura(hex('#8a6410'),hex('#e6b422'),.35+esc*.55+m*.2);c=mistura(c,hex('#fff1a8'),diag*.45);
    const dimp=Math.pow(fbm(novoFbm(53),u*2%1,v*2%1,2),3);c=mistura(c,hex('#5a3f08'),dimp*.35);
    const g=placa(x,y);if(g<0)return mistura(c,[40,28,4],.65);if(g>0)return mistura(c,[255,250,200],.3);return c;
   });saidas.ouro=cv.toDataURL('image/webp',.92);}
  // ---------- jade: nuvens translúcidas + veios claros
  {const F=novoFbm(61),G=novoFbm(62);
   pintar((u,v,x,y)=>{
    const n=fbm(F,u,v,5),m=fbm(G,u,v,3),vei=Math.pow(1-Math.abs(Math.sin((u*2+v*3+n*2.5)*Math.PI*2)),10);
    let c=mistura(hex('#1d5a43'),hex('#4fb98a'),n);c=mistura(c,hex('#a8f0cc'),Math.pow(m,3)*.55);c=mistura(c,hex('#d8fff0'),vei*.5);
    const brilho=Math.pow(fbm(novoFbm(63),u,v,2),5);c=mistura(c,[255,255,255],brilho*.25);
    const g=placa(x,y);if(g<0)return mistura(c,[8,30,22],.6);if(g>0)return mistura(c,[220,255,240],.16);return c;
   });saidas.jade=cv.toDataURL('image/webp',.92);}
  // ---------- metal enferrujado: aço cinza + ferrugem em manchas + rebites
  {const F=novoFbm(71),G=novoFbm(72);
   pintar((u,v,x,y)=>{
    const aço=.5+fbm(F,u*2%1,v*2%1,3)*.35+(((Math.sin(x*37.1+y*.3)*43758.5453)%1)*.05);
    let c=mistura(hex('#4f5258'),hex('#8d9096'),aço);
    const ferr=fbm(G,u,v,5),m=Math.max(0,Math.min(1,(ferr-.45)*3.2));
    c=mistura(c,mistura(hex('#7a3a14'),hex('#c2691f'),fbm(novoFbm(73),u,v,3)),m*.92);
    const g=placa(x,y,64);if(g<0)return mistura(c,[18,14,12],.65);if(g>0)return mistura(c,[255,230,200],.1);
    // rebites nos cantos de cada placa
    const cx=x%64,cy=y%64,rr=[[7,7],[57,7],[7,57],[57,57]].some(([a,b])=>Math.hypot(cx-a,cy-b)<2.6);if(rr)return mistura(c,[30,26,24],.7);
    return c;
   });saidas.metal_ferrugem=cv.toDataURL('image/webp',.92);}
  // ---------- cromado: espelho com bandas de céu/chão + escovado fino
  {const F=novoFbm(81);
   pintar((u,v,x,y)=>{
    const b=.5+.5*Math.sin(v*Math.PI*4+fbm(F,u,v,3)*1.4),s=Math.pow(b,1.6);
    let c=mistura(hex('#2f343c'),hex('#f4f8fc'),s);c=mistura(c,hex('#8fb8e6'),Math.pow(Math.sin(u*Math.PI*2),2)*.18);
    const esc=(((Math.sin(y*57.7)*43758.5453)%1)*.5+.5)*6;c=[c[0]+esc,c[1]+esc,c[2]+esc];
    const g=placa(x,y);if(g<0)return mistura(c,[10,12,16],.7);if(g>0)return mistura(c,[255,255,255],.35);return c;
   });saidas.cromado=cv.toDataURL('image/webp',.92);}
  // ---------- aço escovado: fios horizontais finos, reflexo suave, chapas de 128 px com rebites (metal de verdade, sem cara de pedra)
  {const F=novoFbm(91);
   pintar((u,v,x,y)=>{
    const fio=valor(grade(256,7),256,y%256,0)*.5+(((Math.sin(y*127.1+x*.013)*43758.5453)%1)*.5+.5)*.5; // fio horizontal: varia mais em y que em x
    const refl=.5+.5*Math.sin(u*Math.PI*2+fbm(F,u,v,3)*1.2),base=.42+refl*.22+(fio-.5)*.16;
    let c=[base*232,base*236,base*242];
    const g=placa(x,y,128);if(g<0)return mistura(c,[20,24,30],.7);if(g>0)return mistura(c,[255,255,255],.28);
    const cx=x%128,cy=y%128;if([[10,10],[118,10],[10,118],[118,118]].some(([p,q])=>Math.hypot(cx-p,cy-q)<3))return mistura(c,[40,44,50],.75);
    return c;
   });saidas.aco_escovado=cv.toDataURL('image/webp',.92);}
  // ---------- chapa xadrez (piso antiderrapante): losangos em relevo alternando a direção
  {pintar((u,v,x,y)=>{
    const cel=32,cx=(x%cel)-cel/2,cy=(y%cel)-cel/2,par=(Math.floor(x/cel)+Math.floor(y/cel))%2;
    const ang=par?Math.PI/4:-Math.PI/4,c=Math.cos(ang),sn=Math.sin(ang),lx=cx*c+cy*sn,ly=-cx*sn+cy*c;
    const dentro=Math.abs(lx)<9&&Math.abs(ly)<2.6,borda=Math.abs(lx)<10.2&&Math.abs(ly)<3.8;
    let base=.46+.1*Math.sin(u*Math.PI*2)+(((Math.sin(x*12.9+y*78.2)*43758.5453)%1)*.04);let col=[base*190,base*196,base*204];
    if(dentro){const luz=(lx*.5-ly*.5)/10;col=[col[0]+60+luz*25,col[1]+60+luz*25,col[2]+64+luz*25];}else if(borda)col=[col[0]*.55,col[1]*.55,col[2]*.6];
    const g=placa(x,y,128);if(g<0)return mistura(col,[16,18,22],.7);if(g>0)return mistura(col,[255,255,255],.2);return col;
   });saidas.chapa_xadrez=cv.toDataURL('image/webp',.92);}
  // ---------- painel sci-fi: placas escuras de 128×64 com chanfro, respiros e faixa de luz ciano
  {const F=novoFbm(95);
   pintar((u,v,x,y)=>{
    const pw=128,ph=64,px=x%pw,py=y%ph,pi=Math.floor(y/ph)%4,pj=Math.floor(x/pw)%2;
    const dx=Math.min(px,pw-px),dy=Math.min(py,ph-py),d=Math.min(dx,dy);
    let base=.2+.05*fbm(F,u,v,3)+.03*Math.sin(v*Math.PI*8);let c=[base*150,base*170,base*200];
    if(d<2)c=[8,10,14];else if(d<5)c=mistura(c,px<pw/2?[170,190,215]:[10,14,20],px<pw/2?.35:.4); // chanfro claro em cima/esquerda, escuro embaixo/direita
    // respiros em algumas placas
    if((pi+pj)%3===0&&d>10&&py>20&&py<44&&px>24&&px<104&&(py-20)%6<3)c=[10,13,18];
    // faixa de luz ciano em outras
    if((pi+pj)%3===1&&py>28&&py<36&&px>14&&px<114){const k=1-Math.abs(py-32)/4;c=mistura(c,[90,235,255],Math.max(0,Math.min(1,k))*.95);}
    // parafusos
    if([[9,9],[pw-9,9],[9,ph-9],[pw-9,ph-9]].some(([p,q])=>Math.hypot(px-p,py-q)<2.2))c=[110,120,135];
    return c;
   });saidas.painel_scifi=cv.toDataURL('image/webp',.92);}
  return saidas;
 });
 fs.mkdirSync(saida,{recursive:true});
 for(const [id,url] of Object.entries(lista)){fs.writeFileSync(path.join(saida,id+'.webp'),Buffer.from(url.split(',')[1],'base64'));console.log('gerada',id+'.webp');}
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
