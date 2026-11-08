// Gera as texturas de natureza, lava e lixo (águas, areias, terras, rochas soltas, gramas, flores, sucata, lixo, lava, arbustos, florestas)
// e MELHORA as básicas antigas (tijolo, pedra, madeira, telha, palha, azulejo, rocha, areia, terra, grama, água). 256×256, sem emenda.
// Os originais são guardados uma única vez em arte/texturas/originais-v196. A metal.webp NÃO é mexida.
// Uso: node scripts/gerar-texturas-v198.cjs   (usa o Chrome e o Playwright do ambiente)
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..'),saida=path.join(raiz,'arte','texturas');
const b64=f=>'data:image/webp;base64,'+fs.readFileSync(path.join(raiz,f)).toString('base64');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage();await page.setContent('<canvas id="c" width="256" height="256"></canvas>');
 const sprites={arvore:b64('arte/modelos/therion_arvore_oasis.webp'),palmeira:b64('arte/modelos/therion_palmeira_oasis.webp'),arbusto:b64('arte/pecas/arbusto.webp'),arbustoDeserto:b64('arte/modelos/therion_arbusto_deserto.webp'),oAgua:b64('arte/texturas/originais-v196/agua.webp'),oGrama:b64('arte/texturas/originais-v196/grama.webp'),oAreia:b64('arte/texturas/originais-v196/areia.webp'),oTerra:b64('arte/texturas/originais-v196/terra.webp'),sucata:b64('arte/pecas/sucata.webp'),rochas:b64('arte/pecas/rochas.webp'),pedrinhas:b64('arte/pecas/sujeira-pedrinhas.webp'),ferrugem:b64('arte/materiais/metal-ferrugem/chao.webp')};
 const lista=await page.evaluate(async sprites=>{
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
  /* ---------- ajudantes novos: ruído de pontos (Voronoi sem emenda) e hash */
  const H=(i,j,k,s)=>{const t=Math.sin(i*127.1+j*311.7+k*74.7+s*19.19)*43758.5453;return t-Math.floor(t);};
  function vor(x,y,n,s,jit=.9){const px=x/256*n,py=y/256*n,i0=Math.floor(px),j0=Math.floor(py);let d1=9,d2=9,b=null;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ci=i0+di,cj=j0+dj,wi=((ci%n)+n)%n,wj=((cj%n)+n)%n;
    const fx=ci+.5+(H(wi,wj,1,s)-.5)*jit,fy=cj+.5+(H(wi,wj,2,s)-.5)*jit,dx=px-fx,dy=py-fy,d=Math.hypot(dx,dy);
    if(d<d1){d2=d1;d1=d;b={wi,wj,dx,dy};}else if(d<d2)d2=d;}
   return {d1,d2,dx:b.dx,dy:b.dy,id:H(b.wi,b.wj,3,s),id2:H(b.wi,b.wj,4,s),id3:H(b.wi,b.wj,5,s)};}
  const gr=(a,b,t)=>mistura(a,b,Math.max(0,Math.min(1,t)));
  const luzDe=(dx,dy)=>Math.max(-1,Math.min(1,(-dx-dy)*.9));
  const esc=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
  const fazer=(id,f)=>{pintar(f);saidas[id]=cv.toDataURL('image/webp',.92);};
  const gB=grade(64,801),gB2=grade(64,802),FW=novoFbm(360);
  const lamina=(u,v,x,y)=>{const w=fbm(FW,u,v,3)*34;return valor(gB,64,(x+w+256)%256,y/4)*.6+valor(gB2,64,(x+w*.5+256)%256,(y/4+7)%64)*.4;};
  const FA=novoFbm(310),FB=novoFbm(320),FC=novoFbm(330);

  /* ---------- ÁGUAS */
  const caust=(u,v,p=8)=>Math.pow(1-Math.abs(2*fbm(FB,u,v,4)-1),p)+Math.pow(1-Math.abs(2*fbm(FC,v,u,4)-1),p)*.7;
  const aguaRasa=(u,v)=>{const f=fbm(FA,u,v,4);let c=mistura([42,168,188],[112,226,224],f);c=gr(c,[205,192,150],(.36-f)*1.8);return mistura(c,[235,255,250],Math.min(1,caust(u,v,9)*.55));};
  fazer('agua_rasa',aguaRasa);
  fazer('agua',(u,v)=>{const f=fbm(FA,u,v,4);let c=mistura([30,104,170],[84,176,220],f);return mistura(c,[220,245,255],Math.min(1,caust(u,v,10)*.42));});
  fazer('agua_profunda',(u,v)=>{const f=fbm(FA,u,v,4);let c=mistura([6,34,104],[22,82,164],f);return mistura(c,[70,150,220],Math.min(1,caust(u,v,12)*.3));});
  fazer('agua_pantano',(u,v,x,y)=>{const f=fbm(FA,u,v,4);let c=mistura([46,66,34],[88,104,48],f);c=mistura(c,[140,150,80],Math.min(1,caust(u,v,10)*.18));
   const q=vor(x,y,34,41,.95);if(q.id>.78&&q.d1<.2+.1*q.id2){const l=luzDe(q.dx,q.dy);c=mistura([96,150,40],[160,205,70],.5+.5*l+q.id3*.3);}return c;});
  fazer('agua_suja',(u,v,x,y)=>{const f=fbm(FA,u,v,5);let c=mistura([88,68,42],[136,104,62],f);c=mistura(c,[176,150,100],Math.min(1,caust(u,v,10)*.22));
   const q=vor(x,y,40,43,.95);if(q.id>.8&&q.d1<.14)c=mistura(c,[210,200,170],.7);return c;});

  /* ---------- AREIAS */
  const areia=(a,b,cr,ondas,pn)=>(u,v,x,y)=>{const f=fbm(FA,u,v,4);const o=Math.sin((v+(fbm(FB,u,v,3)-.5)*.22)*Math.PI*2*ondas);let c=mistura(a,b,f*.75+.12*o);const g=H(x,y,7,3);c=[c[0]+(g-.5)*pn,c[1]+(g-.5)*pn,c[2]+(g-.5)*pn];
   const q=vor(x,y,22,47,.95);if(q.id>.93&&q.d1<.09)c=mistura(c,cr,.6);return c;};
  fazer('areia_clara',areia([226,208,160],[244,230,186],[150,130,100],7,26));
  fazer('areia',areia([222,198,146],[240,222,174],[150,126,92],6,26));
  fazer('areia_escura',areia([54,50,48],[92,86,80],[176,170,160],6,30));
  fazer('areia_deserto',areia([204,148,84],[230,182,112],[130,84,44],9,24));

  /* ---------- TERRAS E LAMA */
  fazer('terra_rachada',(u,v,x,y)=>{const q=vor(x,y,6,53,.8);const f=fbm(FA,u,v,5);let c=mistura([152,108,70],[196,150,102],q.id*.7+f*.3);const l=luzDe(q.dx,q.dy);c=[c[0]+l*14,c[1]+l*12,c[2]+l*10];
   const e=q.d2-q.d1;if(e<.07)c=mistura(c,[40,24,14],1-e/.07);else if(e<.14)c=mistura(c,[96,60,36],(.14-e)/.07*.4);return c;});
  fazer('lama',(u,v,x,y)=>{const f=fbm(FA,u,v,5);let c=mistura([58,40,26],[104,74,46],f);const r=1-Math.abs(2*fbm(FB,u,v,4)-1);c=mistura(c,[150,120,88],Math.pow(r,14)*.5);
   const q=vor(x,y,9,57,.8);if(q.id>.7&&q.d1<.4){const k=1-q.d1/.4;c=mistura(c,[72,86,96],k*.45);}return c;});
  const terraBatida=(u,v,x,y)=>{const f=fbm(FA,u,v,5);let c=mistura([120,88,58],[168,128,86],f);const g=H(x,y,9,4);c=[c[0]+(g-.5)*34,c[1]+(g-.5)*30,c[2]+(g-.5)*26];
   const q=vor(x,y,30,59,.95);if(q.id>.86&&q.d1<.16){const l=luzDe(q.dx,q.dy);c=mistura(c,[150+l*40,140+l*38,128+l*34],.9);}return c;};
  fazer('terra_batida',terraBatida);fazer('terra',terraBatida);

  /* ---------- ROCHAS SOLTAS */
  fazer('cascalho',(u,v,x,y)=>{const q=vor(x,y,20,61,.85);const cor=[[132,126,118],[170,158,140],[108,102,98],[150,128,104],[92,96,104]][Math.floor(q.id*5)%5];
   const k=Math.min(1,q.d1/.62),l=luzDe(q.dx,q.dy);let c=esc(cor,1.12-.45*k+l*.12);const e=q.d2-q.d1;if(e<.09)c=mistura(c,[22,18,16],1-e/.09);
   const g=(H(x,y,9,5)-.5)*14;return [c[0]+g,c[1]+g,c[2]+g];});
  fazer('pedregulhos',(u,v,x,y)=>{const f=fbm(FA,u,v,5);let c=mistura([118,88,60],[150,116,80],f);const q=vor(x,y,6,67,.55);const raio=.34+q.id2*.1;
   if(q.id>.12&&q.d1<raio+.1){const som=q.d1>raio?Math.min(1,(q.d1-raio)/.1):0;if(q.d1<=raio){const cor=[[128,124,118],[150,140,126],[104,100,98]][Math.floor(q.id*3)%3],k=q.d1/raio,l=luzDe(q.dx,q.dy);c=esc(cor,1.2-.5*k+l*.2+(fbm(FB,u,v,4)-.5)*.25);}else c=mistura(c,[30,22,16],.6*(1-som));}
   return c;});

  /* ---------- GRAMAS */
  const grama=(a,b,topo,esp)=>(u,v,x,y)=>{const f=fbm(FA,u,v,4);const l=lamina(u,v,x,y);let c=mistura(a,b,f*.6+l*.5-.2);if(l>esp)c=mistura(c,topo,Math.min(1,(l-esp)*3));const g=(H(x,y,11,6)-.5)*18;return [c[0]+g,c[1]+g*1.1,c[2]+g*.5];};
  const gramaCurta=grama([46,112,40],[96,168,56],[150,206,82],.72);
  fazer('grama_curta',gramaCurta);fazer('grama',gramaCurta);
  fazer('grama_alta',grama([26,80,34],[66,130,46],[170,214,96],.62));
  fazer('grama_seca',grama([150,126,64],[204,176,98],[236,214,142],.66));

  /* ---------- FLORES */
  const flores=(cores,miolo,n,sem)=>(u,v,x,y)=>{let c=gramaCurta(u,v,x,y);const q=vor(x,y,n,sem,.9);
   if(q.id>.38){const ang=Math.atan2(q.dy,q.dx),R=.2+.06*q.id2,pet=R*(.72+.28*Math.cos(5*ang+q.id3*6));
    if(q.d1<pet){const cor=cores[Math.floor(q.id2*cores.length)%cores.length],l=luzDe(q.dx,q.dy);c=esc(cor,.86+.16*l+.1*(1-q.d1/pet));if(q.d1<.07)c=miolo;}
    else if(q.d1<pet+.05)c=mistura(c,[16,48,14],.35);}return c;};
  fazer('flores_amarelas',flores([[250,214,40],[255,232,90],[246,196,30]],[210,120,20],16,71));
  fazer('flores_vermelhas',flores([[214,40,52],[236,80,96],[250,150,170],[255,255,255]],[250,214,60],16,73));
  fazer('flores_azuis',flores([[86,110,230],[130,150,250],[170,100,220],[250,250,255]],[255,226,90],16,79));

  /* ---------- SUCATA E LIXO */
  fazer('sucata',(u,v,x,y)=>{const q=vor(x,y,9,83,.9);const pal=[[120,60,34],[112,116,122],[64,90,130],[150,40,34],[170,140,60],[80,84,88]];const cor=pal[Math.floor(q.id*pal.length)%pal.length];
   const l=luzDe(q.dx,q.dy),e=q.d2-q.d1,f=fbm(FA,u,v,5);let c=esc(cor,.86+.2*l+(f-.5)*.5);
   if(q.id3>.55)c=mistura(c,[150,76,30],Math.max(0,fbm(FB,v,u,4)-.45)*1.6);
   if(q.d1<.09&&q.id2>.5)c=[24,22,22];
   if(e<.07)c=mistura(c,[14,12,12],1-e/.07);else if(e<.11)c=mistura(c,[230,230,230],.12);
   if(H(Math.floor(x/3),y,13,8)>.985)c=mistura(c,[230,220,200],.25);return c;});
  fazer('lixo',(u,v,x,y)=>{const f=fbm(FA,u,v,5);let c=mistura([46,40,34],[74,66,56],f);const cores=[[230,230,220],[60,110,200],[40,150,70],[200,50,40],[210,170,50],[110,70,40],[160,160,170]];
   for(const [n,sem,lim] of [[28,89,.3],[19,97,.34]]){const q=vor(x,y,n,sem,.95);if(q.id>.45&&q.d1<lim*(.6+.6*q.id2)){const cor=cores[Math.floor(q.id3*cores.length)%cores.length],l=luzDe(q.dx,q.dy);c=esc(cor,.84+.2*l);if(q.d1>lim*.55)c=mistura(c,[18,14,10],.4);}}return c;});

  /* ---------- LAVA VULCÂNICA e rocha vulcânica */
  fazer('lava',(u,v,x,y)=>{const q=vor(x,y,7,111,.85),f=fbm(FA,u,v,5),e=q.d2-q.d1,l=luzDe(q.dx,q.dy);
   let c=esc([34,26,26],.8+.5*f+.12*l);const quente=Math.pow(1-Math.abs(2*fbm(FB,u,v,5)-1),10);
   c=mistura(c,[170,40,10],Math.min(1,quente*.9));
   if(e<.28){const t=1-e/.28;c=mistura(c,[200,50,10],Math.min(1,t*1.1));if(e<.16)c=mistura(c,[255,140,20],(1-e/.16)*.95);if(e<.07)c=mistura(c,[255,235,140],(1-e/.07)*.95);}
   return c;});
  fazer('lava_fluida',(u,v)=>{const f=fbm(FA,u,v,5),r=1-Math.abs(2*fbm(FB,u,v,5)-1),r2=1-Math.abs(2*fbm(FC,v,u,4)-1);
   let c=mistura([120,24,6],[255,120,16],f);c=mistura(c,[255,215,90],Math.pow(r,8)*.8);c=mistura(c,[40,12,8],Math.max(0,Math.pow(r2,3)-.55)*1.6);return c;});
  fazer('rocha_vulcanica',(u,v,x,y)=>{const q=vor(x,y,8,113,.8),f=fbm(FA,u,v,5),e=q.d2-q.d1,l=luzDe(q.dx,q.dy);let c=esc([48,46,52],.75+.5*f+.2*l+(q.id-.5)*.3);
   if(e<.08)c=mistura(c,[8,6,8],1-e/.08);if(e<.035&&q.id>.7)c=mistura(c,[255,120,30],.9);const g=(H(x,y,5,3)-.5)*14;return [c[0]+g,c[1]+g,c[2]+g];});

  /* ---------- MELHORIA DAS TEXTURAS BÁSICAS ANTIGAS (os originais ficam em arte/texturas/originais-v196) */
  fazer('tijolo',(u,v,x,y)=>{const r=Math.floor(y/32),xo=(x+(r%2)*32)%256,bx=xo%64,by=y%32,bi=Math.floor(xo/64);const f=fbm(FA,u,v,5);
   if(bx<3||by<3){return esc(mistura([196,186,166],[150,142,128],f),.9+(H(x,y,2,1)-.5)*.2);}
   const id=H(bi,r,6,2);let c=mistura([146,62,44],[176,92,60],id);c=gr(c,[120,58,46],(f-.5)*.9);c=esc(c,.92+(H(x,y,3,2)-.5)*.2+(by<6?.14:by>27?-.16:0)+(bx<6?.06:bx>60?-.1:0));
   if(H(Math.floor(x/2),Math.floor(y/2),4,3)>.97)c=esc(c,.7);return c;});
  fazer('pedra',(u,v,x,y)=>{const q=vor(x,y,7,121,.6),f=fbm(FA,u,v,5),e=q.d2-q.d1,l=luzDe(q.dx,q.dy);let c=esc(mistura([128,124,118],[168,160,148],q.id),.84+.3*f+.12*l);
   if(e<.1)c=mistura(c,[30,26,24],1-e/.1);else if(e<.16&&l>0)c=esc(c,1.12);const g=(H(x,y,5,3)-.5)*16;return [c[0]+g,c[1]+g,c[2]+g];});
  fazer('madeira',(u,v,x,y)=>{const pl=Math.floor(y/32),py=y%32,seam=H(pl,0,1,5)*256,gx=(x+H(pl,0,2,5)*200)%256;const f=fbm(FA,u,v,4);
   const grao=.5+.5*Math.sin((py*.55+fbm(FB,gx/256,pl/8,4)*14+Math.sin(gx*.05)*2)*1.8);const base=mistura([112,72,38],[170,118,64],H(pl,0,3,5));let c=mistura(base,[86,52,26],grao*.55+(f-.5)*.4);
   if(py<2)return [30,18,10];if(py<4)c=esc(c,1.18);if(Math.abs(x-seam)<1.5||(x-seam>254||seam-x>254))c=[34,20,12];
   if(Math.hypot(((x-seam+256)%256)-6,py-16)<2||Math.hypot(((x-seam+256)%256)-250,py-16)<2)c=[70,70,76];return c;});
  fazer('telha',(u,v,x,y)=>{const r=Math.floor(y/16),xo=(x+(r%2)*16)%256,bx=(xo%32)-16,by=y%16,ti=Math.floor(xo/32);const d=Math.hypot(bx,by*1.1);const id=H(ti,r,7,2);
   let c=mistura([166,64,34],[204,102,52],id);const f=fbm(FA,u,v,5);c=esc(c,.86+.3*f-.38*Math.min(1,d/20)+(by<5?.0:0));
   if(d>14.5)c=mistura(c,[40,16,10],Math.min(1,(d-14.5)/2.5)*.85);return c;});
  fazer('palha',(u,v,x,y)=>{const l=lamina(u,v,x,y),f=fbm(FA,u,v,4);const faixa=(y%64)/64;let c=mistura([150,112,52],[226,192,108],l*.9+(f-.5)*.3);c=esc(c,.8+.32*Math.pow(1-faixa,.8));
   if(faixa<.04)c=esc(c,.45);if(H(Math.floor(x/2),Math.floor(y/6),3,9)>.9)c=esc(c,1.25);return c;});
  fazer('azulejo',(u,v,x,y)=>{const bx=x%64-32,by=y%64-32,g=Math.min(x%64,64-x%64,y%64,64-y%64);if(g<1.6)return [212,214,216];
   const f=fbm(FA,u,v,3);let c=esc([240,244,248],.96+f*.06);const d=Math.hypot(bx,by),ang=Math.atan2(by,bx),pet=14+7*Math.cos(4*ang);
   if(d<pet&&d>5.5)c=mistura(c,[28,86,168],d<pet-4?.9:.6);else if(d<4)c=[232,176,40];
   const cantos=Math.hypot(Math.abs(bx)-28,Math.abs(by)-28);if(cantos<5)c=mistura(c,[28,86,168],.75);
   if(g<4)c=esc(c,.94);if(bx+by<-50)c=esc(c,1.05);return c;});
  fazer('rocha',(u,v,x,y)=>{const q=vor(x,y,5,127,.85),f=fbm(FA,u,v,5),r=1-Math.abs(2*fbm(FB,u,v,5)-1),e=q.d2-q.d1,l=luzDe(q.dx,q.dy);
   let c=esc(mistura([108,96,86],[154,138,118],q.id*.5+f*.5),.86+.26*l);if(Math.pow(r,18)>.2)c=esc(c,.5);if(e<.12)c=mistura(c,[24,20,18],1-e/.12);
   const g=(H(x,y,5,3)-.5)*18;return [c[0]+g,c[1]+g,c[2]+g];});

  /* ---------- FLORESTAS: sprites da arte do Portão de Véspera / Therion espalhados sem emenda sobre o chão */
  const img=async s=>{const i=new Image();i.src=s;await i.decode();return i;};
  const S={arvore:await img(sprites.arvore),palmeira:await img(sprites.palmeira),arbusto:await img(sprites.arbusto),arbustoDeserto:await img(sprites.arbustoDeserto)};
  function espalhar(chao,lista,sem,filtro){
   pintar(chao);const rr=(i,k)=>H(i,k,1,sem);
   lista.forEach(([im,tam,n],li)=>{for(let i=0;i<n;i++){const k=li*100+i,px=rr(k,1)*256,py=rr(k,2)*256,t=tam*(.82+rr(k,3)*.36),rot=rr(k,4)*Math.PI*2;
    for(const ox of [-256,0,256])for(const oy of [-256,0,256]){const cx=px+ox,cy=py+oy;if(cx<-t||cy<-t||cx>256+t||cy>256+t)continue;
     ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=10;ctx.shadowOffsetX=3;ctx.shadowOffsetY=5;if(filtro)ctx.filter=filtro;ctx.drawImage(im,-t/2,-t/2,t,t);ctx.restore();}}});
   return cv.toDataURL('image/webp',.92);}
  const chaoMata=c1=>(u,v)=>mistura(c1,esc(c1,1.4),fbm(FA,u,v,4));
  saidas.floresta_oasis=espalhar(chaoMata([26,52,22]),[[S.arvore,140,5],[S.arvore,120,6],[S.arbusto,74,6]],131);
  saidas.floresta_densa=espalhar(chaoMata([16,38,18]),[[S.arvore,150,3],[S.arvore,128,5],[S.arvore,110,6],[S.arbusto,72,6]],137);
  saidas.floresta_outono=espalhar(chaoMata([58,36,18]),[[S.arvore,140,5],[S.arvore,120,6],[S.arbusto,74,6]],139,'hue-rotate(-52deg) saturate(1.35) brightness(1.05)');
  saidas.floresta_sombria=espalhar(chaoMata([14,22,22]),[[S.arvore,140,4],[S.arvore,116,5],[S.arbusto,70,4]],149,'hue-rotate(35deg) saturate(.7) brightness(.62)');
  saidas.palmeiral=espalhar((u,v)=>mistura([196,172,118],[226,206,150],fbm(FA,u,v,4)),[[S.palmeira,180,5],[S.palmeira,150,6],[S.arbusto,56,4]],151);
  saidas.arbustal=espalhar((u,v)=>mistura([172,126,72],[210,164,100],fbm(FA,u,v,4)),[[S.arbustoDeserto,78,9],[S.arbustoDeserto,60,10]],157);
  saidas.moitas=espalhar(chaoMata([40,84,34]),[[S.arbusto,90,9],[S.arbusto,70,12]],163);

  /* ---------- FLORESTAS desenhadas à mão: conífera (pinheiros vistos de cima) e tropical (folhas largas) */
  function desenhaArvores(chao,n,sem,quemDesenha){pintar(chao);for(let i=0;i<n;i++){const px=H(i,1,1,sem)*256,py=H(i,2,1,sem)*256,t=.8+H(i,3,1,sem)*.5,rot=H(i,4,1,sem)*6.28;
   for(const ox of [-256,0,256])for(const oy of [-256,0,256]){const cx=px+ox,cy=py+oy;if(cx<-80||cy<-80||cx>336||cy>336)continue;ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.scale(t,t);quemDesenha(i);ctx.restore();}}
   return cv.toDataURL('image/webp',.92);}
  const conifera=(i,paleta)=>{ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=9;ctx.shadowOffsetX=3;ctx.shadowOffsetY=5;
   const pal=paleta||['#0f3a2a','#14503a','#1c6a48','#2c8458','#5aa46c'],cam=[46,36,26,16,7].map((R,k)=>[R,pal[k]]);
   cam.forEach(([R,cor],ci)=>{ctx.shadowColor=ci?'transparent':'rgba(0,0,0,.5)';const pontas=18+ci*3;ctx.fillStyle=cor;ctx.beginPath();
    for(let k=0;k<pontas*2;k++){const a=k/(pontas*2)*Math.PI*2+ci*.2,r=k%2?R*.8:R*(.96+((k*7+i)%5)*.02);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=.8;for(let k=0;k<pontas;k++){const a=k/pontas*Math.PI*2+ci*.2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*R*.9,Math.sin(a)*R*.9);ctx.stroke();}});
   ctx.fillStyle='#8a5a30';ctx.beginPath();ctx.arc(0,0,2.4,0,6.3);ctx.fill();};
  saidas.floresta_conifera=desenhaArvores(chaoMata([30,34,26]),20,171,conifera);
  saidas.floresta_conifera_neve=desenhaArvores((u,v)=>mistura([226,232,240],[246,250,255],fbm(FA,u,v,4)),20,173,i=>conifera(i,['#3c5a5c','#68888a','#9ab8bc','#cfe2e6','#f6fbff']));
  const folhaGrande=(R,cor1,cor2)=>{const g=ctx.createLinearGradient(0,0,R,0);g.addColorStop(0,cor1);g.addColorStop(1,cor2);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(R*.3,-R*.34,R*.75,-R*.26,R,0);ctx.bezierCurveTo(R*.75,R*.26,R*.3,R*.34,0,0);ctx.fill();
   ctx.strokeStyle='rgba(10,50,10,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(R*.95,0);ctx.stroke();ctx.lineWidth=.6;for(let k=1;k<6;k++){const px=R*k/6.5;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px+R*.1,-R*.11);ctx.moveTo(px,0);ctx.lineTo(px+R*.1,R*.11);ctx.stroke();}};
  const tropical=i=>{ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=9;ctx.shadowOffsetX=3;ctx.shadowOffsetY=5;const n=9+(i%3);
   for(let k=0;k<n;k++){ctx.save();ctx.rotate(k/n*Math.PI*2+i);folhaGrande(52+(k%2)*8,k%2?'#14661f':'#1f7a2a',k%2?'#4cb84a':'#7ad05a');ctx.restore();ctx.shadowColor='transparent';}
   for(let k=0;k<6;k++){ctx.save();ctx.rotate(k/6*Math.PI*2+.4);folhaGrande(30,'#2c9a36','#a4e070');ctx.restore();}
   ctx.fillStyle='#d8903c';ctx.beginPath();ctx.arc(0,0,3,0,6.3);ctx.fill();};
  saidas.floresta_tropical=desenhaArvores(chaoMata([14,44,18]),11,177,tropical);
  /* ---------- v198b: variações feitas a partir da ARTE DO GPT (originais restaurados), para manter o mesmo traço pintado */
  const O={agua:await img(sprites.oAgua),grama:await img(sprites.oGrama),areia:await img(sprites.oAreia),terra:await img(sprites.oTerra),sucata:await img(sprites.sucata),rochas:await img(sprites.rochas),pedrinhas:await img(sprites.pedrinhas),ferrugem:await img(sprites.ferrugem)};
  const base=(im,filtro)=>{ctx.clearRect(0,0,256,256);ctx.filter=filtro||'none';ctx.drawImage(im,0,0,256,256);ctx.filter='none';};
  const sai=id=>{saidas[id]=cv.toDataURL('image/webp',.92);};
  const sobre=(f)=>{const im=ctx.getImageData(0,0,256,256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4,c=f(x/256,y/256,x,y,[im.data[i],im.data[i+1],im.data[i+2]]);im.data[i]=lim(c[0]);im.data[i+1]=lim(c[1]);im.data[i+2]=lim(c[2]);im.data[i+3]=255;}ctx.putImageData(im,0,0);};
  const solta=(im,tam,n,sem,filtro)=>{for(let i=0;i<n;i++){const px=H(i,1,1,sem)*256,py=H(i,2,1,sem)*256,t=tam*(.8+H(i,3,1,sem)*.4),rot=H(i,4,1,sem)*6.28;
   for(const ox of [-256,0,256])for(const oy of [-256,0,256]){const cx=px+ox,cy=py+oy;if(cx<-t||cy<-t||cx>256+t||cy>256+t)continue;ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=6;ctx.shadowOffsetX=2;ctx.shadowOffsetY=3;if(filtro)ctx.filter=filtro;ctx.drawImage(im,-t/2,-t/2,t,t);ctx.restore();}}};
  /* águas */
  base(O.agua,'brightness(1.12) saturate(.92) hue-rotate(-6deg)');sai('agua_rasa');
  base(O.agua,'brightness(.46) saturate(1.5) hue-rotate(14deg)');sai('agua_profunda');
  base(O.agua,'hue-rotate(-92deg) brightness(.62) saturate(.8)');sobre((u,v,x,y,c)=>{const q=vor(x,y,30,41,.95);if(q.id>.82&&q.d1<.2){const l=luzDe(q.dx,q.dy);return mistura(c,[120+l*30,170+l*25,50],.8);}return c;});sai('agua_pantano');
  base(O.agua,'sepia(1) saturate(1.6) brightness(.62) hue-rotate(-14deg)');sai('agua_suja');
  /* areias e terras */
  base(O.areia,'brightness(1.14) saturate(.72)');sai('areia_clara');
  base(O.areia,'grayscale(.85) brightness(.36) contrast(1.2)');sai('areia_escura');
  base(O.areia,'hue-rotate(-14deg) saturate(1.45) brightness(.9)');sai('areia_deserto');
  base(O.terra,'brightness(.86) saturate(.9)');sai('terra_batida');
  base(O.terra,'brightness(.95)');sobre((u,v,x,y,c)=>{const q=vor(x,y,6,53,.8),e=q.d2-q.d1;if(e<.06)return mistura(c,[30,18,10],1-e/.06);if(e<.13)return mistura(c,[70,44,26],(.13-e)/.07*.45);return c;});sai('terra_rachada');
  base(O.terra,'brightness(.45) saturate(.8)');sobre((u,v,x,y,c)=>{const r=Math.pow(1-Math.abs(2*fbm(FB,u,v,5)-1),9);return mistura(c,[118,126,128],Math.min(1,r*.55));});sai('lama');
  base(O.terra,'brightness(.8)');solta(O.rochas,34,34,201);sai('cascalho');
  base(O.terra,'brightness(.92)');solta(O.rochas,120,4,203);solta(O.rochas,64,5,205);sai('pedregulhos');
  /* gramas e flores */
  base(O.grama,'brightness(1.12) saturate(1.12)');sai('grama_curta');
  base(O.grama,'brightness(.66) saturate(1.25) hue-rotate(6deg)');sai('grama_alta');
  base(O.grama,'hue-rotate(-44deg) saturate(.75) brightness(1.3) sepia(.25)');sai('grama_seca');
  const flor=(cores,miolo,n,sem)=>{base(O.grama,'brightness(1.08) saturate(1.1)');sobre((u,v,x,y,c)=>{const q=vor(x,y,n,sem,.9);
    if(q.id>.38){const ang=Math.atan2(q.dy,q.dx),R=.2+.06*q.id2,pet=R*(.72+.28*Math.cos(5*ang+q.id3*6));
     if(q.d1<pet){const cor=cores[Math.floor(q.id2*cores.length)%cores.length],l=luzDe(q.dx,q.dy);return q.d1<.07?miolo:esc(cor,.86+.16*l+.1*(1-q.d1/pet));}
     if(q.d1<pet+.05)return mistura(c,[10,30,8],.4);}return c;});};
  flor([[250,214,40],[255,232,90],[246,196,30]],[210,120,20],16,71);sai('flores_amarelas');
  flor([[214,40,52],[236,80,96],[250,150,170],[255,255,255]],[250,214,60],16,73);sai('flores_vermelhas');
  flor([[86,110,230],[130,150,250],[170,100,220],[250,250,255]],[255,226,90],16,79);sai('flores_azuis');
  /* sucata e lixo: peças pintadas pelo GPT espalhadas sobre chão de chapa suja */
  base(O.ferrugem,'brightness(.5) saturate(.8)');solta(O.sucata,120,5,211);solta(O.sucata,70,5,213);sai('sucata');
  base(O.terra,'brightness(.38) saturate(.6) hue-rotate(-10deg)');solta(O.sucata,62,12,217,'brightness(.85) saturate(.9)');solta(O.sucata,48,12,219,'brightness(.7) saturate(.8)');solta(O.pedrinhas,70,6,221,'brightness(.6)');sai('lixo');
  /* florestas sobre chão de grama escurecida */
  function mata(filtroChao,lista,sem,filtro){base(O.grama,filtroChao);lista.forEach(([im,tam,n],li)=>{solta(im,tam,n,sem+li*7,filtro);});return cv.toDataURL('image/webp',.92);}
  saidas.floresta_oasis=mata('brightness(.5) saturate(1.1)',[[S.arvore,140,5],[S.arvore,120,6],[S.arbusto,74,6]],131);
  saidas.floresta_densa=mata('brightness(.38)',[[S.arvore,150,5],[S.arvore,128,7],[S.arvore,110,8],[S.arbusto,72,6]],137);
  saidas.floresta_outono=mata('hue-rotate(-60deg) brightness(.5)',[[S.arvore,140,5],[S.arvore,120,6],[S.arbusto,74,6]],139,'hue-rotate(-52deg) saturate(1.35) brightness(1.05)');
  saidas.floresta_sombria=mata('brightness(.25) hue-rotate(30deg)',[[S.arvore,140,6],[S.arvore,116,7],[S.arbusto,70,5]],149,'hue-rotate(35deg) saturate(.7) brightness(.62)');
  saidas.palmeiral=mata('hue-rotate(-60deg) saturate(.7) brightness(1.1)',[[S.palmeira,180,5],[S.palmeira,150,6],[S.arbusto,56,4]],151);
  saidas.arbustal=mata('hue-rotate(-55deg) saturate(.9) brightness(.95)',[[S.arbustoDeserto,78,10],[S.arbustoDeserto,60,12]],157);
  saidas.moitas=mata('brightness(.7) saturate(1.1)',[[S.arbusto,90,9],[S.arbusto,70,12]],163);

  /* ---------- NEVE E GELO */
  base(O.areia,'grayscale(1) brightness(1.55) contrast(.7)');sobre((u,v,x,y,c)=>{const f=fbm(FA,u,v,5),r=1-Math.abs(2*fbm(FB,u,v,4)-1),g=(H(x,y,7,3)-.5)*12,az=(1-f)*42+Math.pow(r,6)*26;return [c[0]*.62+104+g-az*.7,c[1]*.62+110+g-az*.35,c[2]*.62+118+g-az*.05];});
  const neveBase=ctx.getImageData(0,0,256,256);sai('solo_nevado');
  saidas.floresta_nevada=(()=>{ctx.putImageData(neveBase,0,0);solta(S.arvore,140,5,231,'grayscale(.6) brightness(1.75) contrast(.85)');solta(S.arvore,118,6,233,'grayscale(.7) brightness(1.7) contrast(.85)');solta(S.arbusto,72,6,235,'grayscale(.6) brightness(1.7)');
   sobre((u,v,x,y,c)=>{const f=fbm(FB,u,v,4);return mistura(c,[230,240,255],Math.max(0,f-.5)*.9);});return cv.toDataURL('image/webp',.92);})();
  const gelo=(muro)=>(u,v,x,y)=>{const f=fbm(FA,u,v,5),r1=1-Math.abs(2*fbm(FB,u,v,5)-1),r2=1-Math.abs(2*fbm(FC,v,u,4)-1);
   let c=mistura([120,190,226],[212,244,255],f);c=mistura(c,[40,110,180],Math.max(0,.45-f)*1.1);
   c=mistura(c,[255,255,255],Math.min(1,Math.pow(r1,18)*.9));c=mistura(c,[70,140,205],Math.min(1,Math.pow(r2,26)*.7));
   const q=vor(x,y,26,241,.95);if(q.id>.86&&q.d1<.12)c=mistura(c,[235,250,255],.65);
   if(muro){const by=y%128,bx=x%128;const d=Math.min(bx,128-bx,by,128-by);if(d<2)c=mistura(c,[20,60,110],.85);else if(d<5)c=esc(mistura(c,[255,255,255],.25),1);const tom=.9+.1*Math.sin(x*.07+y*.03);c=esc(c,tom);}
   return c;};
  fazer('gelo',gelo(false));fazer('parede_gelo',gelo(true));
  /* parede de gelo com blocos mais fundos: duas cores de bloco */
  fazer('paredao_gelo',(u,v,x,y)=>{const bi=Math.floor(x/128)+Math.floor(y/128)*2,c0=gelo(false)(u,v,x,y);const t=.86+.2*H(bi,1,2,9);const bx=x%128,by=y%128,d=Math.min(bx,128-bx,by,128-by);
   let c=[c0[0]*t,c0[1]*t,Math.min(255,c0[2]*(t+.06))];if(d<2.5)c=[16,52,100];else if(d<6)c=mistura(c,[18,60,120],.55*(1-(d-2.5)/3.5));else if(bx<10&&by>6)c=mistura(c,[255,255,255],.18);return c;});
  /* ---------- v198c: coníferas desenhadas ramo a ramo (agulhas) e floresta tropical feita com a arte pintada do GPT em verdes vivos */
  const pinheiro=(R,pal,neve,sem)=>{const rn=(a,b)=>H(a,b,1,sem);
   for(let L=0;L<3;L++){const rr=R*(1-L*.27),nb=12+L*3;
    for(let b=0;b<nb;b++){const ang=b/nb*6.2832+L*.45+(rn(L,b)-.5)*.35,ca=Math.cos(ang),sa=Math.sin(ang);
     for(let s=.06;s<1;s+=.028){const px=ca*rr*s,py=sa*rr*s,comp=rr*.3*(1-s*.45)*(.8+rn(b,s*100)*.4);
      for(const lado of [-1,1]){const a2=ang+lado*(.95+rn(s*50,b)*.25),ex=px+Math.cos(a2)*comp,ey=py+Math.sin(a2)*comp;
       const t=Math.min(1,.2+s*.65+L*.1+(rn(b,s*80)-.5)*.3),cor=t<.5?mistura(pal[0],pal[1],t*2):mistura(pal[1],pal[2],(t-.5)*2);
       ctx.strokeStyle='rgb('+(cor[0]|0)+','+(cor[1]|0)+','+(cor[2]|0)+')';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(ex,ey);ctx.stroke();
       if(neve&&rn(s*90,b+lado)>.55){ctx.strokeStyle='rgba(246,250,255,'+(.5+rn(b,s*70)*.4)+')';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(px+(ex-px)*.3,py+(ey-py)*.3);ctx.lineTo(ex,ey);ctx.stroke();}}}}}
   ctx.fillStyle=neve?'#dfe9f0':'#6a8a52';ctx.beginPath();ctx.arc(0,0,2.6,0,6.3);ctx.fill();};
  const pinhal=(n,sem,neve)=>{for(let i=0;i<n;i++){const px=H(i,1,1,sem)*256,py=H(i,2,1,sem)*256,t=.78+H(i,3,1,sem)*.5,rot=H(i,4,1,sem)*6.28;
   for(const ox of [-256,0,256])for(const oy of [-256,0,256]){const cx=px+ox,cy=py+oy;if(cx<-70||cy<-70||cx>326||cy>326)continue;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.scale(t,t);ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(4,6,42,40,0,0,6.3);ctx.fill();
    pinheiro(44,neve?[[26,58,62],[64,104,108],[150,182,186]]:[[5,28,20],[16,66,40],[72,130,74]],neve,sem+i);ctx.restore();}}};
  base(O.grama,'brightness(.3) saturate(.8) hue-rotate(10deg)');pinhal(9,171,false);sai('floresta_conifera');
  ctx.putImageData(neveBase,0,0);pinhal(9,173,true);sai('floresta_conifera_neve');
  saidas.floresta_tropical=mata('brightness(.42) saturate(1.4) hue-rotate(14deg)',[[S.palmeira,150,4],[S.arvore,132,5],[S.arvore,112,5],[S.arbusto,70,6]],177,'hue-rotate(42deg) saturate(1.5) brightness(.95)');
  /* ---------- v198d: pinheiros refeitos (ramos em leque, agulhas inclinadas para fora) + COPAS com fundo transparente + CHÃOS de floresta */
  const pinheiro2=(R,pal,neve,sem)=>{const rn=(a,b)=>H(a,b,1,sem);
   const cor=(t)=>{const c=t<.5?mistura(pal[0],pal[1],t*2):mistura(pal[1],pal[2],(t-.5)*2);return 'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')';};
   for(let L=0;L<3;L++){const rr=R*(1-L*.24),nb=9+L*2;
    for(let b=0;b<nb;b++){const ang=b/nb*6.2832+L*.5+(rn(L,b)-.5)*.3,ca=Math.cos(ang),sa=Math.sin(ang),len=rr*(.88+rn(b,L+9)*.16);
     /* galho central */
     ctx.strokeStyle=neve?'#5a4a3a':'#4a2e1a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(ca*len,sa*len);ctx.stroke();
     for(let s=.1;s<1;s+=.045){const px=ca*len*s,py=sa*len*s,comp=len*.34*Math.sin(Math.PI*Math.min(1,s*1.05+.12))*(.85+rn(b,s*90)*.3);
      for(const lado of [-1,1]){const a2=ang+lado*.62,ex=px+Math.cos(a2)*comp,ey=py+Math.sin(a2)*comp;
       const t=Math.min(1,.15+s*.55+L*.14+(rn(b,s*70+lado)-.5)*.28);
       ctx.strokeStyle=cor(t);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(ex,ey);ctx.stroke();
       if(neve&&rn(s*77,b+lado*3)>.35){ctx.strokeStyle='rgba(248,252,255,'+(.55+rn(b,s*55)*.4)+')';ctx.lineWidth=1.9;ctx.beginPath();ctx.moveTo(px+(ex-px)*.35,py+(ey-py)*.35);ctx.lineTo(ex,ey);ctx.stroke();}}}}}
   ctx.fillStyle=neve?'#f2f7fb':'#7a9a5a';ctx.beginPath();ctx.arc(0,0,3,0,6.3);ctx.fill();};
  const pinhal2=(n,sem,neve)=>{for(let i=0;i<n;i++){const px=H(i,1,1,sem)*256,py=H(i,2,1,sem)*256,t=.8+H(i,3,1,sem)*.4,rot=H(i,4,1,sem)*6.28;
   for(const ox of [-256,0,256])for(const oy of [-256,0,256]){const cx=px+ox,cy=py+oy;if(cx<-70||cy<-70||cx>326||cy>326)continue;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.scale(t,t);ctx.filter='blur(7px)';ctx.fillStyle='rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(6,8,38,36,0,0,6.3);ctx.fill();ctx.filter='none';
    pinheiro2(46,neve?[[22,52,56],[62,102,108],[158,190,194]]:[[4,26,18],[14,62,38],[76,138,78]],neve,sem+i);ctx.restore();}}};
  const limpa=()=>ctx.clearRect(0,0,256,256);
  base(O.grama,'brightness(.28) saturate(.8) hue-rotate(10deg)');pinhal2(9,171,false);sai('floresta_conifera');
  ctx.putImageData(neveBase,0,0);pinhal2(9,173,true);sai('floresta_conifera_neve');
  /* copas: só as árvores, fundo transparente (ficam POR CIMA das peças; dá para andar por baixo) */
  const copas=(lista,sem,filtro)=>{limpa();lista.forEach(([im,tam,n],li)=>solta(im,tam,n,sem+li*7,filtro));};
  copas([[S.arvore,140,4],[S.arvore,120,5],[S.arbusto,74,4]],131);sai('copa_oasis');
  copas([[S.arvore,150,4],[S.arvore,128,5],[S.arvore,110,6]],137);sai('copa_densa');
  copas([[S.arvore,140,4],[S.arvore,120,5]],139,'hue-rotate(-52deg) saturate(1.35) brightness(1.05)');sai('copa_outono');
  copas([[S.arvore,140,5],[S.arvore,116,5]],149,'hue-rotate(35deg) saturate(.7) brightness(.62)');sai('copa_sombria');
  copas([[S.arvore,140,4],[S.arvore,118,5]],231,'grayscale(.6) brightness(1.75) contrast(.85)');sai('copa_nevada');
  copas([[S.palmeira,170,4],[S.palmeira,140,4]],151);sai('copa_palmeiral');
  copas([[S.palmeira,150,3],[S.arvore,132,4],[S.arvore,112,4]],177,'hue-rotate(42deg) saturate(1.5) brightness(.95)');sai('copa_tropical');
  limpa();pinhal2(8,171,false);sai('copa_conifera');
  limpa();pinhal2(8,173,true);sai('copa_conifera_neve');
  /* chãos de floresta (sem árvores) para combinar com as copas */
  const folhas=(c1,c2,n,sem)=>sobre((u,v,x,y,c)=>{const q=vor(x,y,n,sem,.95);if(q.id>.55&&q.d1<.2){const l=luzDe(q.dx,q.dy);return esc(q.id2>.5?c1:c2,.85+.2*l);}return c;});
  base(O.grama,'brightness(.42) saturate(1.05)');folhas([70,98,36],[104,84,34],34,301);sai('chao_floresta');
  base(O.terra,'brightness(.62) saturate(1.1)');folhas([196,96,30],[150,60,24],34,303);sai('chao_floresta_outono');
  ctx.putImageData(neveBase,0,0);folhas([176,170,164],[196,190,184],30,305);sai('chao_floresta_neve');
  base(O.terra,'brightness(.5) saturate(.9) hue-rotate(-5deg)');folhas([118,76,40],[84,54,30],38,307);sai('chao_conifera');
  base(O.grama,'brightness(.34) saturate(1.5) hue-rotate(12deg)');folhas([34,110,40],[60,138,50],34,309);sai('chao_tropical');
  /* ---------- v198e: abetos vistos de cima como na foto de referência: copas estreitas e irregulares, ramos caídos, pontas claras acinzentadas */
  const abeto=(R,neve,sem,prata)=>{const rn=(a,b)=>H(a,b,1,sem);
   const pal=neve?[[24,54,56],[88,126,128],[200,222,226]]:prata?[[90,110,90],[160,176,150],[222,230,214]]:[[8,32,22],[40,88,52],[150,176,120]];
   const cor=t=>{const c=t<.5?mistura(pal[0],pal[1],t*2):mistura(pal[1],pal[2],(t-.5)*2);return 'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')';};
   const nb=15;
   for(let L=0;L<3;L++)for(let b=0;b<nb;b++){const ang=b/nb*6.2832+L*.42+(rn(L,b)-.5)*.5,ca=Math.cos(ang),sa=Math.sin(ang),len=R*(.45+rn(b,L+4)*.65)*(1-L*.2);
    ctx.strokeStyle=neve?'#4a3e34':'#3a2a1a';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(ca*len,sa*len);ctx.stroke();
    for(let s=.12;s<1;s+=.06){const px=ca*len*s,py=sa*len*s,comp=len*.3*(1-s*.55)*(.8+rn(b,s*90+L)*.4);
     for(const lado of [-1,1]){const a2=ang+lado*(.5+rn(s*60,b)*.25),ex=px+Math.cos(a2)*comp,ey=py+Math.sin(a2)*comp;
      const t=Math.min(1,.12+s*.78+L*.08+(rn(b,s*70+lado)-.5)*.3);ctx.strokeStyle=cor(t);ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(ex,ey);ctx.stroke();
      if(neve&&rn(s*77,b+lado*3)>.4){ctx.strokeStyle='rgba(248,252,255,.85)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(px+(ex-px)*.4,py+(ey-py)*.4);ctx.lineTo(ex,ey);ctx.stroke();}}}}
   /* topo mais claro (ponta nova) */
   ctx.fillStyle=neve?'#eef5f8':prata?'#e8eee0':'#b6d08a';ctx.beginPath();ctx.arc(0,0,R*.09,0,6.3);ctx.fill();};
  const abetal=(n,sem,neve)=>{for(let i=0;i<n;i++){const px=H(i,1,1,sem)*256,py=H(i,2,1,sem)*256,t=.5+H(i,3,1,sem)*.62,rot=H(i,4,1,sem)*6.28,prata=H(i,5,1,sem)>.82;
   for(const ox of [-256,0,256])for(const oy of [-256,0,256]){const cx=px+ox,cy=py+oy;if(cx<-60||cy<-60||cx>316||cy>316)continue;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.scale(t,t);ctx.filter='blur(5px)';ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(5,7,30,28,0,0,6.3);ctx.fill();ctx.filter='none';
    abeto(40,neve,sem+i,prata&&!neve);ctx.restore();}}};
  /* chão de musgo vivo como na foto */
  base(O.grama,'brightness(.46) saturate(1.1) hue-rotate(-8deg)');sobre((u,v,x,y,c)=>{const f=fbm(FB,u,v,5);return f>.52?mistura(c,[132,170,40],Math.min(1,(f-.52)*3.2)*.8):c;});
  const chaoMusgo=ctx.getImageData(0,0,256,256);
  ctx.putImageData(chaoMusgo,0,0);abetal(34,171,false);sai('floresta_conifera');
  ctx.putImageData(neveBase,0,0);abetal(30,173,true);sai('floresta_conifera_neve');
  limpa();abetal(24,171,false);sai('copa_conifera');
  limpa();abetal(22,173,true);sai('copa_conifera_neve');
  ctx.putImageData(chaoMusgo,0,0);sai('chao_conifera');
  /* ---------- v198f: arbustos e palmeiras também viram COPA (por cima) + chão próprio; as florestas "completas" saem da lista */
  limpa();solta(S.arbusto,90,6,163);solta(S.arbusto,70,8,167);sai('copa_moitas');
  limpa();solta(S.arbustoDeserto,78,7,157);solta(S.arbustoDeserto,60,9,159);sai('copa_arbustal');
  base(O.areia,'brightness(1.02) saturate(.9)');sai('chao_palmeiral');
  base(O.terra,'hue-rotate(-6deg) saturate(1.2) brightness(1.05)');sai('chao_arbustal');
  /* ---------- v198g: copas em ALTA resolução (512 px) e em tamanho de árvore de verdade: broadleaf 8 m por quadro, coníferas 16 m por quadro */
  cv.width=512;cv.height=512;ctx.setTransform(2,0,0,2,0,0);
  copas([[S.arvore,140,4],[S.arvore,120,5],[S.arbusto,74,4]],131);sai('copa_oasis');
  copas([[S.arvore,150,4],[S.arvore,128,5],[S.arvore,110,6]],137);sai('copa_densa');
  copas([[S.arvore,140,4],[S.arvore,120,5]],139,'hue-rotate(-52deg) saturate(1.35) brightness(1.05)');sai('copa_outono');
  copas([[S.arvore,140,5],[S.arvore,116,5]],149,'hue-rotate(35deg) saturate(.7) brightness(.62)');sai('copa_sombria');
  copas([[S.arvore,140,4],[S.arvore,118,5]],231,'grayscale(.6) brightness(1.75) contrast(.85)');sai('copa_nevada');
  copas([[S.palmeira,170,4],[S.palmeira,140,4]],151);sai('copa_palmeiral');
  copas([[S.palmeira,150,3],[S.arvore,132,4],[S.arvore,112,4]],177,'hue-rotate(42deg) saturate(1.5) brightness(.95)');sai('copa_tropical');
  limpa();abetal(24,171,false);sai('copa_conifera');
  limpa();abetal(22,173,true);sai('copa_conifera_neve');
  ctx.setTransform(1,0,0,1,0,0);cv.width=256;cv.height=256;
  return saidas;

 },sprites);
 const orig=path.join(saida,'originais-v196');fs.mkdirSync(orig,{recursive:true});
 const BASE=['agua','areia','terra','grama','tijolo','pedra','madeira','telha','palha','azulejo','rocha'];
 for(const [id,url] of Object.entries(lista)){if(BASE.includes(id)||/^floresta_|^copa_|^(palmeiral|arbustal|moitas)$/.test(id))continue;const alvo=path.join(saida,id+'.webp'),bk=path.join(orig,id+'.webp');
    fs.writeFileSync(alvo,Buffer.from(url.split(',')[1],'base64'));console.log('gerada',id+'.webp');}
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
