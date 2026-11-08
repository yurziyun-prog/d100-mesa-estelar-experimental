// Mesa Estelar v201 — Terreno natural: caverna natural e cordilheira (planalto ou colinas escarpadas).
// Funções PURAS (testáveis no Node): trabalham numa grade de quadrados de 1 m e devolvem conjuntos de quadrados ('x,y');
// o Editor rápido (mesa-editor-rapido.js) e o gerador de mapas (mesa-mapforge-plano.js) transformam isso em objetos do mapa.
//
// • cavernaNatural: autômato celular (rocha que se agrupa) → salas e passagens irregulares, todas ligadas (só a maior região aberta fica).
// • contornoOrganico: contorno irregular de um retângulo (beiradas tortas); "pontas" cria picos.
// • cordilheira: um terreno elevado natural. Sem pontas → PLANALTO (topo plano em cima, paredão de rocha em volta, rampas de subida).
//   Muito pontiagudo (pontas ≥ 70%) → COLINAS ESCARPADAS (rocha irregular e recortada, sem topo plano; dá para passar pelas fendas).

export const LIMITE_ESCARPADA=.7; // a partir daqui "pontiaguda" vira colinas escarpadas

export function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const hash2=(x,y,s)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041);h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296;};
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const chave=(x,y)=>x+','+y;
const V4=[[1,0],[-1,0],[0,1],[0,-1]];

/** regiões ligadas (4 vizinhos) de uma grade booleana; devolve a lista de listas de índices */
function regioes(g,w,h,valor){
 const vis=new Uint8Array(w*h),out=[];
 for(let i=0;i<w*h;i++){
  if(vis[i]||g[i]!==valor)continue;const pilha=[i],reg=[];vis[i]=1;
  while(pilha.length){const k=pilha.pop();reg.push(k);const x=k%w,y=(k-x)/w;
   for(const [dx,dy] of V4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const j=ny*w+nx;if(!vis[j]&&g[j]===valor){vis[j]=1;pilha.push(j);}}}
  out.push(reg);
 }
 return out;
}

/**
 * Caverna natural numa grade w×h (1 = rocha, 0 = vazio). A borda é sempre rocha e só a MAIOR região aberta fica (nada isolado).
 * opcoes: rocha (0.3–0.6, fração inicial de rocha), passos (1–8, suavização), seed.
 */
export function cavernaNatural(w,h,{rocha=.46,passos=4,seed=1}={}){
 w=Math.max(5,Math.floor(w));h=Math.max(5,Math.floor(h));
 let alvo=Math.max(.3,Math.min(.62,rocha)),melhor=null;
 for(let tent=0;tent<8;tent++){
  const rnd=mulberry32((seed|0)+tent*7919),g=new Uint8Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)g[y*w+x]=(x===0||y===0||x===w-1||y===h-1||rnd()<alvo)?1:0;
  let a=g;
  for(let p=0;p<Math.max(1,Math.min(8,passos));p++){
   const b=new Uint8Array(w*h);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(x===0||y===0||x===w-1||y===h-1){b[y*w+x]=1;continue;}
    let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(a[(y+dy)*w+x+dx])n++;
    b[y*w+x]=n>=5?1:0;}
   a=b;
  }
  const abertas=regioes(a,w,h,0).sort((p,q)=>q.length-p.length);
  if(!abertas.length){alvo-=.04;continue;}
  const fica=new Set(abertas[0]);const f=new Uint8Array(w*h);for(let i=0;i<w*h;i++)f[i]=fica.has(i)?0:1;
  const frac=abertas[0].length/(w*h);
  melhor={w,h,grade:f,abertos:abertas[0].length,fracaoAberta:frac};
  if(frac>=.16)break;alvo-=.03; // pouco espaço aberto: tenta de novo com menos rocha
 }
 return melhor||{w,h,grade:new Uint8Array(w*h).fill(1),abertos:0,fracaoAberta:0};
}

/**
 * Contorno irregular dentro de uma grade w×h (1 = dentro).
 * irregularidade 0–1: quanto a beirada é torta · pontas 0–1: 0 = suave/arredondado, 1 = muito pontiagudo (picos) · seed.
 */
export function contornoOrganico(w,h,{irregularidade=.5,pontas=0,seed=1}={}){
 w=Math.max(3,Math.floor(w));h=Math.max(3,Math.floor(h));
 const irr=Math.max(0,Math.min(1,irregularidade)),pt=Math.max(0,Math.min(1,pontas)),rnd=mulberry32(seed|0),fase=rnd(),
  k=7+Math.round(Math.min(w,h)/3.5)+Math.floor(rnd()*3),g=new Uint8Array(w*h),cx=w/2,cy=h/2,P=3.2;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=(x+.5-cx)/(w/2),v=(y+.5-cy)/(h/2),r=Math.hypot(u,v),th=Math.atan2(v,u);
  const base=1/Math.pow(Math.pow(Math.abs(Math.cos(th)),P)+Math.pow(Math.abs(Math.sin(th)),P),1/P); // quase retangular: ocupa quase todo o retângulo arrastado
  const n=(vnoise(Math.cos(th)*(1.6+irr*1.6)+11,Math.sin(th)*(1.6+irr*1.6)+11,seed)-.5)*2,n2=(vnoise(x/3.1,y/3.1,seed+9)-.5)*2;
  let R=base*.94*(1+irr*(.3*n+.14*n2));
  if(pt>0){const q=th/(2*Math.PI)*k+fase+.3*n,tri=Math.abs((q-Math.floor(q))*2-1),pico=Math.pow(tri,2.4);R*=1-pt*.5*(1-pico);}
  g[y*w+x]=r<=R?1:0;
 }
 // só a maior região fica (nada solto)
 const rs=regioes(g,w,h,1).sort((a,b)=>b.length-a.length);
 if(rs.length>1){const f=new Uint8Array(w*h);for(const i of rs[0])f[i]=1;return f;}
 return g;
}

/** quadrados (x,y) de uma grade booleana */
export function celulasDe(grade,w,valor=1){const s=new Set();for(let i=0;i<grade.length;i++)if(grade[i]===valor)s.add(chave(i%w,Math.floor(i/w)));return s;}

/** junta quadrados em poucos retângulos: corridas horizontais iguais empilhadas */
export function retangulosDeCelulas(set,cel=1){
 const por=new Map();for(const k of set){const [x,y]=k.split(',').map(Number);if(!por.has(y))por.set(y,[]);por.get(y).push(x);}
 const corridas=[];for(const [y,xs] of por){xs.sort((a,b)=>a-b);let i=xs[0],f=xs[0];for(const x of xs.slice(1)){if(x===f+1)f=x;else{corridas.push({x:i,y,w:f-i+1,h:1});i=f=x;}}corridas.push({x:i,y,w:f-i+1,h:1});}
 corridas.sort((a,b)=>a.x-b.x||a.w-b.w||a.y-b.y);
 const out=[];let cur=null;
 for(const c of corridas){if(cur&&cur.x===c.x&&cur.w===c.w&&cur.y+cur.h===c.y)cur.h++;else{if(cur)out.push(cur);cur={...c};}}
 if(cur)out.push(cur);
 return out.map(r=>({x:r.x*cel,y:r.y*cel,w:r.w*cel,h:r.h*cel}));
}

/**
 * Cordilheira dentro de um retângulo de w×h quadrados.
 * opcoes: irregularidade (0–1), pontas (0–1; ≥ LIMITE_ESCARPADA → colinas escarpadas), paredao (1–3 quadrados de rocha na borda), rampas (0–3), seed.
 * Devolve {tipo:'planalto'|'escarpada', rocha:Set, topo:Set, aberto:Set, rampas:[{x,y,w,h}], nome}
 *   rocha = quadrados de rocha (impassáveis) · topo = piso plano elevado (só no planalto) · aberto = chão por onde se passa entre a rocha (escarpada)
 */
export function cordilheira(w,h,{irregularidade=.55,pontas=0,paredao=1,rampas=2,seed=1}={}){
 w=Math.max(5,Math.floor(w));h=Math.max(5,Math.floor(h));
 const dentro=contornoOrganico(w,h,{irregularidade,pontas,seed}),inside=celulasDe(dentro,w,1);
 const fora=(x,y)=>x<0||y<0||x>=w||y>=h||!dentro[y*w+x];
 const escarpada=pontas>=LIMITE_ESCARPADA;
 const rocha=new Set(),topo=new Set(),aberto=new Set(),rampasR=[];
 if(escarpada){
  // colinas escarpadas: tudo é rocha recortada, com fendas e clareiras irregulares por onde se passa
  for(const k of inside){const [x,y]=k.split(',').map(Number);
   const borda=V4.some(([dx,dy])=>fora(x+dx,y+dy));
   const ruido=vnoise(x/2.4,y/2.4,seed+31)*.7+vnoise(x/1.1,y/1.1,seed+57)*.3;
   if(borda||ruido>.5)rocha.add(k);else aberto.add(k);}
  // as fendas precisam ligar as bordas: nada de bolsões fechados (viram rocha)
  const g=new Uint8Array(w*h).fill(1);for(const k of aberto){const [x,y]=k.split(',').map(Number);g[y*w+x]=0;}
  const rs=regioes(g,w,h,0).filter(r=>r.length>0).sort((a,b)=>b.length-a.length);
  aberto.clear();if(rs.length){for(const i of rs[0])aberto.add(chave(i%w,Math.floor(i/w)));}
  for(const k of inside)if(!aberto.has(k))rocha.add(k);
  return {tipo:'escarpada',rocha,topo,aberto,rampas:rampasR,nome:'Colinas escarpadas',w,h};
 }
 // planalto: paredão de rocha em volta (espessura "paredao") e topo plano elevado dentro
 const esp=Math.max(1,Math.min(3,Math.round(paredao))),dist=new Map(),fila=[];
 for(const k of inside){const [x,y]=k.split(',').map(Number);if(V4.some(([dx,dy])=>fora(x+dx,y+dy))){dist.set(k,1);fila.push([x,y]);}}
 for(let i=0;i<fila.length;i++){const [x,y]=fila[i],d=dist.get(chave(x,y));for(const [dx,dy] of V4){const nx=x+dx,ny=y+dy,kk=chave(nx,ny);if(inside.has(kk)&&!dist.has(kk)){dist.set(kk,d+1);fila.push([nx,ny]);}}}
 for(const k of inside){if((dist.get(k)||99)<=esp)rocha.add(k);else topo.add(k);}
 // rampas: abertas no paredão, longe uma da outra (o paredão fica mais fino e o topo termina na ponta da rampa)
 const cand=[];
 for(const k of rocha){const [x,y]=k.split(',').map(Number);
  for(const [dx,dy] of V4){ // direção de FORA para dentro: a rampa sobe de (x-dx*…)
   const ext=[x-dx,y-dy],int=[x+dx*esp,y+dy*esp];
   if(fora(ext[0],ext[1])&&topo.has(chave(int[0],int[1]))){cand.push({x,y,dx,dy});}}}
 const rnd=mulberry32((seed|0)+99);const escolhidas=[];
 const embaralhado=cand.map(c=>({c,r:rnd()})).sort((a,b)=>a.r-b.r).map(o=>o.c);
 const n=Math.max(0,Math.min(3,Math.round(rampas)));
 for(const c of embaralhado){if(escolhidas.length>=n)break;if(escolhidas.every(o=>Math.hypot(o.x-c.x,o.y-c.y)>Math.max(w,h)/3.2))escolhidas.push(c);}
 for(const c of escolhidas){
  // rampa de 2 de largura (a célula do paredão e a vizinha) atravessando todo o paredão
  const hor=c.dx!==0,lado=1;const cel=[];
  for(let t=0;t<esp;t++)for(let s=0;s<=lado;s++){const px=c.x+(hor?c.dx*t:s),py=c.y+(hor?s:c.dy*t);cel.push([px,py]);}
  // (a direção é de dentro p/ fora: começa na célula externa do paredão)
  const xs=[],ys=[];for(const [px,py] of cel){const kk=chave(px,py);rocha.delete(kk);topo.delete(kk);xs.push(px);ys.push(py);}
  rampasR.push({x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs)+1,h:Math.max(...ys)-Math.min(...ys)+1,sobeParaDentro:{dx:c.dx,dy:c.dy}});
 }
 return {tipo:'planalto',rocha,topo,aberto,rampas:rampasR,nome:'Planalto',w,h};
}

/**
 * Abre entradas na rocha da borda de uma caverna (corredores de 2 quadrados de largura até a região aberta).
 * grade: Uint8Array w×h (1 = rocha), alterada no lugar. Devolve as entradas [{x,y,lado}] (quadrado da borda).
 */
export function abrirEntradas(grade,w,h,n=1,seed=1){
 const rnd=mulberry32((seed|0)+4242),out=[],lados=['n','s','l','o'].map(l=>({l,r:rnd()})).sort((a,b)=>a.r-b.r).map(o=>o.l);
 for(const lado of lados){
  if(out.length>=n)break;
  // linhas (ou colunas) candidatas em ordem aleatória: a primeira cujo caminho em linha reta encontra espaço aberto
  const horiz=lado==='l'||lado==='o',tam=horiz?h:w,idx=Array.from({length:Math.max(0,tam-4)},(_,i)=>i+2).map(i=>({i,r:rnd()})).sort((a,b)=>a.r-b.r).map(o=>o.i);
  for(const i of idx){
   const passo=[];let achou=-1;
   for(let t=0;t<Math.min(w,h)*.6;t++){
    const x=lado==='o'?t:lado==='l'?w-1-t:i,y=lado==='n'?t:lado==='s'?h-1-t:i;
    if(x<1&&lado!=='o'||y<1&&lado!=='n'||x>w-2&&lado!=='l'||y>h-2&&lado!=='s'){}
    if(t>0&&x>0&&y>0&&x<w-1&&y<h-1&&!grade[y*w+x]){achou=t;break;}
    passo.push([x,y]);
   }
   if(achou<0)continue;
   for(const [x,y] of passo){grade[y*w+x]=0;const x2=horiz?x:Math.min(w-2,x+1),y2=horiz?Math.min(h-2,y+1):y;if(x2>0&&y2>0&&x2<w-1&&y2<h-1)grade[y2*w+x2]=0;}
   out.push({x:lado==='o'?0:lado==='l'?w-1:i,y:lado==='n'?0:lado==='s'?h-1:i,lado});break;
  }
 }
 return out;
}

// ------------------------------------------------------------------ contornos suaves (o desenho orgânico de verdade)
/**
 * Contornos de um conjunto de quadrados como curvas suaves e orgânicas (nada de degraus de 1 m).
 * Traça as arestas de fora (e dos buracos), balança cada trecho com ruído (pelas coordenadas do mapa: massas vizinhas continuam o mesmo contorno)
 * e arredonda as quinas (Chaikin). suavizar 1 = quinas chanfradas (pontiagudo) · 2–3 = redondo.
 * Devolve laços [[x,y],...] em metros (coordenadas da grade), fechados implicitamente. Antihorário = buraco, horário = contorno de fora (y para baixo).
 */
export function lacosSuaves(set,{ruido=.16,suavizar=2,seed=1,passoM=1,angular=0}={}){
 const saidas=new Map(),add=(a,b)=>{const k=a[0]+','+a[1];if(!saidas.has(k))saidas.set(k,[]);saidas.get(k).push(b);};
 for(const k of set){const [x,y]=k.split(',').map(Number);
  if(!set.has(x+','+(y-1)))add([x,y],[x+1,y]);
  if(!set.has((x+1)+','+y))add([x+1,y],[x+1,y+1]);
  if(!set.has(x+','+(y+1)))add([x+1,y+1],[x,y+1]);
  if(!set.has((x-1)+','+y))add([x,y+1],[x,y]);}
 const lacos=[];
 for(const [k0,lista] of saidas){
  while(lista.length){
   const ini=k0.split(',').map(Number),pts=[ini];let cur=lista.pop();
   while(cur){pts.push(cur);const ck=cur[0]+','+cur[1];if(cur[0]===ini[0]&&cur[1]===ini[1])break;const l=saidas.get(ck);cur=l&&l.length?l.pop():null;}
   if(pts.length>3)lacos.push(pts.slice(0,-1));
  }
 }
 const out=[];
 for(const L0 of lacos){
  if(angular>0){const A=angularizar(L0,angular,seed);if(A.length>=3)out.push(A);continue;}
  // tira os pontos no meio de retas
  let L=L0.filter((p,i)=>{const a=L0[(i+L0.length-1)%L0.length],b=L0[(i+1)%L0.length];return !((a[0]===p[0]&&p[0]===b[0])||(a[1]===p[1]&&p[1]===b[1]));});
  if(L.length<3)L=L0;
  // balanço: cada trecho vira pedaços de ~passoM com deslocamento para fora/dentro; as quinas ficam (e serão arredondadas)
  const P=[];
  for(let i=0;i<L.length;i++){
   const a=L[i],b=L[(i+1)%L.length],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),n=Math.max(1,Math.round(len/passoM)),nx=dy/len,ny=-dx/len;
   P.push([a[0],a[1]]);
   for(let j=1;j<n;j++){const x=a[0]+dx*j/n,y=a[1]+dy*j/n,r=(vnoise(x*1.15+seed*.37,y*1.15+seed*.61,seed)-.5)*2*ruido*2;P.push([x+nx*r,y+ny*r]);}
  }
  let Q=P;
  for(let it=0;it<Math.max(0,Math.min(4,suavizar));it++){
   const N=[];for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length];N.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}
   Q=N;
  }
  // tira pontos quase iguais
  const R=[];for(const p of Q){const u=R[R.length-1];if(!u||Math.hypot(p[0]-u[0],p[1]-u[1])>=.13)R.push(p);}
  if(R.length>=3)out.push(R);
 }
 return out;
}
/** caminho SVG (coordenadas em metros, relativas a (ox,oy)) de uma lista de laços; fill-rule evenodd faz os buracos */
export function caminhoDeLacos(lacos,ox=0,oy=0){
 const f=v=>(Math.round(v*100)/100).toString();
 return lacos.map(L=>'M'+L.map(p=>f(p[0]-ox)+' '+f(p[1]-oy)).join('L')+'Z').join('');
}
/** caixa (x0,y0,x1,y1) de uma lista de laços */
export function caixaDeLacos(lacos){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const L of lacos)for(const [x,y] of L){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}return {x0,y0,x1,y1};}

/** contorno ANGULAR (rocha recortada, pontiaguda): simplifica o contorno de degraus em segmentos retos (Douglas-Peucker, tolerância tol em metros) e balança as pontas. */
function angularizar(L,tol,seed){
 const n=L.length;if(n<4)return L;
 const dist=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;if(!l)return Math.hypot(p[0]-a[0],p[1]-a[1]);const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l));return Math.hypot(p[0]-(a[0]+t*dx),p[1]-(a[1]+t*dy));};
 const rdp=(pts)=>{if(pts.length<3)return pts;let m=0,k=0;const a=pts[0],b=pts[pts.length-1];for(let i=1;i<pts.length-1;i++){const d=dist(pts[i],a,b);if(d>m){m=d;k=i;}}
  if(m<=tol)return [a,b];const l=rdp(pts.slice(0,k+1)),r=rdp(pts.slice(k));return l.slice(0,-1).concat(r);};
 // fecha o laço dividindo no ponto mais distante do primeiro
 let far=0,md=0;for(let i=1;i<n;i++){const d=Math.hypot(L[i][0]-L[0][0],L[i][1]-L[0][1]);if(d>md){md=d;far=i;}}
 const A=L.slice(0,far+1),B=L.slice(far).concat([L[0]]);
 const S=rdp(A).slice(0,-1).concat(rdp(B).slice(0,-1));
 // balança as pontas (pelas coordenadas do mapa)
 return S.map(([x,y])=>[x+(vnoise(x*.9+seed*.13,y*.9+3,seed)-.5)*.9,y+(vnoise(x*.9+7,y*.9+seed*.29,seed+5)-.5)*.9]);
}

// ------------------------------------------------------------------ picos 3D (para cima, como montanhas de mapa)
/**
 * Onde pôr picos 3D numa massa de rocha: amostragem com distância mínima, picos maiores no miolo e menores perto da beirada.
 * set: quadrados da massa ('x,y') · pontas 0–1: mais pontas = mais picos · tamMin/tamMax: largura do pico em metros · seed.
 * Devolve [{x,y,tam,v}] (x,y = ponto de apoio no chão, em metros; v = variante 0..n), ordenados de cima para baixo da tela (os de baixo ficam por cima).
 */
export function picosDe(set,{pontas=.8,seed=1,tamMin=2.2,tamMax=4.8,maximo=60,dentroMin=.5}={}){
 if(!set.size)return [];
 const dist=new Map(),fila=[];
 for(const k of set){const [x,y]=k.split(',').map(Number);if(V4.some(([dx,dy])=>!set.has((x+dx)+','+(y+dy)))){dist.set(k,.5);fila.push([x,y]);}}
 for(let i=0;i<fila.length;i++){const [x,y]=fila[i],d=dist.get(x+','+y);for(const [dx,dy] of V4){const kk=(x+dx)+','+(y+dy);if(set.has(kk)&&!dist.has(kk)){dist.set(kk,d+1);fila.push([x+dx,y+dy]);}}}
 let md=1;for(const d of dist.values())if(d>md)md=d;
 const rnd=mulberry32((seed|0)+777),cand=[...set].map(k=>{const [x,y]=k.split(',').map(Number);return {x:x+.5,y:y+.5,d:dist.get(k)||.5,r:rnd()};}).filter(c=>c.d>=dentroMin).sort((a,b)=>b.d*(.6+.8*b.r)-a.d*(.6+.8*a.r));
 const alvo=Math.max(1,Math.min(maximo,Math.round(set.size/(40-30*Math.max(0,Math.min(1,pontas))))));
 const out=[];
 for(const c of cand){
  if(out.length>=alvo)break;
  const f=Math.min(1,c.d/Math.max(2,md*.8)),tam=Math.min(tamMax,tamMin+(tamMax-tamMin)*(.25+.75*f)*(.7+.5*c.r));
  if(out.every(o=>Math.hypot(o.x-c.x,o.y-c.y)>(o.tam+tam)*.3))out.push({x:c.x+(rnd()-.5)*.6,y:c.y+(rnd()-.5)*.6,tam:Math.round(tam*10)/10,v:Math.floor(rnd()*4)});
 }
 return out.sort((a,b)=>a.y-b.y);
}
