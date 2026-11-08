// Mesa Estelar v203 — Pinceles de espalhar (voltam do Editor/Oficina antigos): grama, mato, folhas, flores, areia, cascalho, neve, pelos, pegadas, sangue e tinta spray.
// O mestre arrasta o mouse e o pincel ESPALHA pequenos elementos pelo caminho (como um spray). O que fica salvo no mapa é só o caminho + estilo + semente (alguns bytes):
// o desenho é refeito igual em todas as telas por este módulo (determinístico), então não pesa e todos veem o mesmo.
/** o quanto cada pincel queima (0 = não queima). Folhas mortas e palha pegam fogo com facilidade; grama verde resiste; areia, pedra, neve, sangue e pegadas não queimam. Queimado, o desenho vira cinza e carvão. */
export const INFLAMABILIDADE_PINCEL={grama:1,mato:3,palha:5,folhas:4,flores:2,pelos:2};
export const ESTILOS_PINCEL=[
 {id:'grama',nome:'Grama',ic:'🌿',cor:'#4f8c3e'},
 {id:'mato',nome:'Mato alto',ic:'🌾',cor:'#9aa43e'},
 {id:'palha',nome:'Palha seca',ic:'🌾',cor:'#d8b050'},
 {id:'folhas',nome:'Folhas',ic:'🍂',cor:'#c0702a'},
 {id:'flores',nome:'Flores',ic:'🌼',cor:'#f2d34a'},
 {id:'areia',nome:'Areia',ic:'🏖️',cor:'#d9c48a'},
 {id:'cascalho',nome:'Cascalho',ic:'🪨',cor:'#8c8c86'},
 {id:'neve',nome:'Neve',ic:'❄️',cor:'#ffffff'},
 {id:'pelos',nome:'Pelos',ic:'🧶',cor:'#8a5a30'},
 {id:'pegada_pata',nome:'Pegadas de pata',ic:'🐾',cor:'#4a3220'},
 {id:'pegada_bota',nome:'Pegadas de bota',ic:'👣',cor:'#3a2a1c'},
 {id:'sangue',nome:'Sangue',ic:'🩸',cor:'#7a1010'},
 {id:'spray',nome:'Tinta spray',ic:'🎨',cor:'#ffffff'}
];
const PPM=36,LIM=2048;
const mulberry=s=>{let a=s>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
const hex=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(String(h||''));const v=m?parseInt(m[1],16):0x4f8c3e;return [(v>>16)&255,(v>>8)&255,v&255];};
const mix=(c,k,r)=>{const j=1+(r()-.5)*k;return 'rgb('+c.map(x=>Math.max(0,Math.min(255,Math.round(x*j)))).join(',')+')';};
/** pontos do caminho já "costurados" a cada ~passo m, com a direção do trecho */
function amostra(pts,passo){const out=[];if(!pts.length)return out;if(pts.length===1)return [{x:pts[0][0],y:pts[0][1],a:0}];let resto=0;
 for(let i=1;i<pts.length;i++){const [x0,y0]=pts[i-1],[x1,y1]=pts[i],d=Math.hypot(x1-x0,y1-y0),a=Math.atan2(y1-y0,x1-x0);if(d<1e-6)continue;let t=passo-resto;
  while(t<=d){out.push({x:x0+(x1-x0)*t/d,y:y0+(y1-y0)*t/d,a});t+=passo;}resto=d-(t-passo);}
 if(!out.length)out.push({x:pts[0][0],y:pts[0][1],a:0});return out;}
/** desenha o pincel num canvas (metros → pixels) */
export function desenharPincel(ctx,P,w,h){
 const r=mulberry(P.seed||1),est=P.estilo,cor=hex(P.cor),tam=Math.max(.4,Number(P.tam)||1.5),dens=Math.max(.2,Math.min(4,Number(P.dens)||1)),S=PPM,pts=P.pts||[];
 const L=(x,y,x2,y2,lw,c,al=1)=>{ctx.globalAlpha=al;ctx.strokeStyle=c;ctx.lineWidth=lw*S;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x*S,y*S);ctx.lineTo(x2*S,y2*S);ctx.stroke();};
 const E=(x,y,rx,ry,rot,c,al=1)=>{ctx.globalAlpha=al;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x*S,y*S,Math.max(.4,rx*S),Math.max(.4,ry*S),rot,0,Math.PI*2);ctx.fill();};
 const passo=({grama:.16,mato:.22,palha:.2,folhas:.28,flores:.3,areia:.12,cascalho:.2,neve:.14,pelos:.2,sangue:.4,spray:.1}[est])||.7;
 const sm=amostra(pts,est.startsWith('pegada')?(est==='pegada_pata'?.78:.7):passo);
 const raio=tam/2;
 if(est==='pegada_pata'||est==='pegada_bota'){
  sm.forEach((q,i)=>{const lado=i%2?1:-1,ox=-Math.sin(q.a)*lado*.15*(tam/1.5),oy=Math.cos(q.a)*lado*.15*(tam/1.5),x=q.x+ox,y=q.y+oy,k=.7+tam/4,al=.5+r()*.3,c=mix(cor,.25,r);
   ctx.save();ctx.translate(x*S,y*S);ctx.rotate(q.a);ctx.scale(S,S);
   ctx.globalAlpha=al;ctx.fillStyle=c;
   if(est==='pegada_pata'){ctx.beginPath();ctx.ellipse(-.02*k,0,.1*k,.085*k,0,0,7);ctx.fill();for(let t=-1.5;t<=1.5;t+=1){ctx.beginPath();ctx.ellipse(.12*k,t*.065*k,.04*k,.034*k,0,0,7);ctx.fill();}}
   else{ctx.beginPath();ctx.ellipse(.07*k,0,.13*k,.065*k,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(-.1*k,0,.06*k,.05*k,0,0,7);ctx.fill();}
   ctx.restore();});
  ctx.globalAlpha=1;return;}
 for(const q of sm){
  const n=Math.max(1,Math.round(dens*raio*raio*(est==='areia'||est==='neve'?26:est==='cascalho'?5:est==='spray'?16:est==='sangue'?3:est==='folhas'?5:est==='flores'?2.2:est==='pelos'?10:est==='mato'?9:est==='palha'?10:14)));
  for(let i=0;i<n;i++){const a=r()*6.283,d=Math.sqrt(r())*raio,x=q.x+Math.cos(a)*d,y=q.y+Math.sin(a)*d;
   if(est==='grama'||est==='mato'||est==='palha'){const len=(est==='mato'?.5:est==='palha'?.38:.26)*(.6+r()*.8),an=-Math.PI/2+(r()-.5)*(est==='palha'?2.6:1.1),cu=(r()-.5)*.25;ctx.globalAlpha=.9;ctx.strokeStyle=mix(cor,.5,r);ctx.lineWidth=(est==='mato'?.034:est==='palha'?.03:.04)*S;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x*S,y*S);ctx.quadraticCurveTo((x+Math.cos(an+cu)*len*.55)*S,(y+Math.sin(an+cu)*len*.55)*S,(x+Math.cos(an+cu*2)*len)*S,(y+Math.sin(an+cu*2)*len)*S);ctx.stroke();}
   else if(est==='folhas'){E(x,y,.07+r()*.07,.035+r()*.03,r()*6.28,mix(cor,.7,r),.85);}
   else if(est==='flores'){const c=r()<.5?mix(cor,.2,r):(r()<.5?'rgb(240,240,245)':'rgb(220,110,150)');E(x,y,.05+r()*.04,.05+r()*.04,0,c,.95);E(x,y,.018,.018,0,'rgb(250,200,40)',1);}
   else if(est==='areia'){E(x,y,.014+r()*.022,.014+r()*.022,0,mix(cor,.28,r),.45+r()*.45);}
   else if(est==='cascalho'){const g=mix(cor,.55,r);E(x,y,.04+r()*.07,.03+r()*.05,r()*6.28,g,.95);E(x+.012,y+.014,.04+r()*.05,.03+r()*.04,0,'rgb(20,20,20)',.18);}
   else if(est==='neve'){E(x,y,.03+r()*.05,.03+r()*.05,0,'rgb(255,255,255)',.45+r()*.5);}
   else if(est==='pelos'){const an=q.a+(r()-.5)*1.1,len=.1+r()*.22;L(x,y,x+Math.cos(an)*len,y+Math.sin(an)*len,.012+r()*.01,mix(cor,.4,r),.55+r()*.35);}
   else if(est==='sangue'){const rr=.03+r()*r()*.16;E(x,y,rr,rr*(.7+r()*.5),r()*6.28,mix(cor,.3,r),.78);if(r()<.18){const an=r()*6.28;L(x,y,x+Math.cos(an)*rr*3,y+Math.sin(an)*rr*3,.014,mix(cor,.3,r),.7);}}
   else{const g=ctx.createRadialGradient(x*S,y*S,0,x*S,y*S,.09*S);g.addColorStop(0,'rgba('+cor.join(',')+','+(.25+r()*.3)+')');g.addColorStop(1,'rgba('+cor.join(',')+',0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x*S,y*S,.09*S,0,7);ctx.fill();}
  }}
 ctx.globalAlpha=1;
}
const cache=new Map();
/** endereço da imagem do pincel de um objeto da cena (data URL, guardado em memória) */
export function pincelUrl(o){
 const P=o?.pincelV203;if(!P||typeof document==='undefined')return '';
 const w=Math.max(.5,Number(o.larguraM)||1),h=Math.max(.5,Number(o.alturaM)||1),chave=String(o.id)+'|'+(P.pts?.length||0)+'|'+P.estilo+'|'+P.cor+'|'+P.tam+'|'+P.dens+'|'+P.seed+'|'+w.toFixed(2)+'x'+h.toFixed(2);
 let u=cache.get(chave);if(u)return u;
 const k=Math.min(1,LIM/(Math.max(w,h)*PPM)),c=document.createElement('canvas');c.width=Math.max(2,Math.ceil(w*PPM*k));c.height=Math.max(2,Math.ceil(h*PPM*k));
 const x=c.getContext('2d');x.scale(k,k);try{desenharPincel(x,P,w,h);}catch(e){console.warn('[Pincel]',e);}
 u=c.toDataURL('image/png');if(cache.size>150)cache.clear();cache.set(chave,u);return u;
}
/** objeto de cena a partir de um traço (metros absolutos) — largura/altura = caixa do traço + margem; os pontos ficam relativos à caixa */
export function objetoPincel(pts,{estilo='grama',cor,tam=1.5,dens=1,seed=1,id,W=28,H=14}={}){
 const raio=Math.max(.2,tam/2)+(estilo.startsWith('pegada')?.4:.15);
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [x,y] of pts){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 x0=Math.max(0,x0-raio);y0=Math.max(0,y0-raio);x1=Math.min(W,x1+raio);y1=Math.min(H,y1+raio);
 const w=Math.max(.6,x1-x0),h=Math.max(.6,y1-y0),meta=ESTILOS_PINCEL.find(e=>e.id===estilo)||ESTILOS_PINCEL[0];
 return {id,nome:'Pincel · '+meta.nome,forma:'rect',cor:'transparent',bordaLargura:0,x:+((x0+w/2)*28/W).toFixed(4),y:+((y0+h/2)*14/H).toFixed(4),larguraM:+w.toFixed(3),alturaM:+h.toFixed(3),angulo:0,camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,material:'',
  ...(INFLAMABILIDADE_PINCEL[estilo]?{inflamavel:true,inflamabilidade:INFLAMABILIDADE_PINCEL[estilo],destrutivel:true,pvMax:4,pvAtual:4,dureza:0,material:'Vegetal'}:{}),
  erTipo:'pincel',pincelV203:{estilo,cor:cor||meta.cor,tam:+tam.toFixed(2),dens:+dens.toFixed(2),seed,pts:pts.map(([x,y])=>[+(x-x0).toFixed(2),+(y-y0).toFixed(2)])}};
}
