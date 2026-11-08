// Mesa Estelar v205 — Superfície de água AMBIENTE: queda → canal → desembocadura → lagoa como UMA paisagem contínua, sem depender de personagens.
// Um canvas de baixa resolução (12 px/m) vive DENTRO da camada do mundo (acompanha pan/zoom sem recalcular) e fica acima das poças e abaixo de areia, ponte, objetos e miniaturas.
// Tudo é recortado pelos retângulos reais das poças salvas (nunca por um retângulo "aproximado"): onda e espuma não atravessam terra, ponte ou rocha.
// Camadas distintas: (1) ondulação de fundo da lagoa (lenta) · (2) fluxo do canal (acelera perto da queda, perde força na foz) · (3) anéis de mistura que nascem na foz e morrem na lagoa.
// O relógio é COMPARTILHADO com a cachoeira (mesaRelogioAguaV205). Só visual: sem força de correnteza, sem natação, sem dano.
import {pocasDeAgua} from './mesa-agua-visual.js?v=205';
const PPM=12,LAGO_MIN_M2=60;
const dentro=(x,y,rects)=>rects.some(([rx,ry,rw,rh])=>x>=rx&&x<=rx+rw&&y>=ry&&y<=ry+rh);
const area=p=>p.rects.reduce((s,[,,w,h])=>s+w*h,0);
/** geometria da paisagem de água (metros): lagoa = poças 'agua/profunda' grandes; rio = poça com fluxoV205 (ou rasa); foz = onde rio e lagoa se tocam. Função pura. */
/** v205: o banco guarda cada array interno de rectsV201 como {__arrV205:[…]} (Firestore não aceita array dentro de array); aceita os dois formatos */
export const rectsNormais=a=>(a||[]).map(r=>Array.isArray(r)?r:(r&&r.__arrV205)||[]);
export function geometriaDaAgua(objs=[],W=28,H=14){
 const pocas=pocasDeAgua(objs,W,H),porId=new Map(objs.map(o=>[o.id,o]));
 const fluxo=objs.filter(o=>o?.fluxoV205&&!o.destruido).map(o=>({rects:o.rectsV201?.length?rectsNormais(o.rectsV201):[[o.x*W/28-o.larguraM/2,o.y*H/14-o.alturaM/2,o.larguraM,o.alturaM]],dir:o.fluxoV205}));
 const rio=fluxo.length?fluxo[0]:null;
 const lagoRects=pocas.filter(p=>(p.tipo==='agua'||p.tipo==='agua_profunda')&&area(p)>=LAGO_MIN_M2).flatMap(p=>p.rects);
 const rioRects=rio?rio.rects:[];
 // foz: pontos de grade de 0,5 m dentro do rio E da lagoa
 const comuns=[];for(const [rx,ry,rw,rh] of rioRects)for(let x=rx;x<=rx+rw;x+=.5)for(let y=ry;y<=ry+rh;y+=.5)if(dentro(x,y,lagoRects))comuns.push([x,y]);
 let foz=null;if(comuns.length){const yMin=Math.min(...comuns.map(p=>p[1]));const topo=comuns.filter(p=>p[1]<=yMin+1);foz={x:topo.reduce((s,p)=>s+p[0],0)/topo.length,y:yMin+.6};}
 else if(rioRects.length){const b=rioRects.reduce((m,r)=>r[1]+r[3]>m[1]+m[3]?r:m);foz={x:b[0]+b[2]/2,y:b[1]+b[3]};}
 const fundoRects=pocas.filter(p=>p.tipo==='agua_profunda').flatMap(p=>p.rects);
 return {lagoRects,rioRects,fundoRects,foz,dir:rio?.dir||{dx:0,dy:1,vel:1},ids:[...porId.keys()].length};
}
/** o rio e a lagoa formam um caminho de água contínuo? (flood fill de 0,5 m na união dos retângulos, do topo do rio ao centro da lagoa) */
export function aguaConectada(g){
 const todos=[...g.rioRects,...g.lagoRects];if(!g.rioRects.length||!g.lagoRects.length)return false;
 const topo=g.rioRects.reduce((m,r)=>r[1]<m[1]?r:m),ini=[topo[0]+topo[2]/2,topo[1]+.25];
 const alvoR=g.lagoRects.reduce((m,r)=>r[2]*r[3]>m[2]*m[3]?r:m),alvo=[alvoR[0]+alvoR[2]/2,alvoR[1]+alvoR[3]/2];
 const k=(x,y)=>Math.round(x*2)+','+Math.round(y*2),vis=new Set([k(...ini)]),fila=[ini];
 while(fila.length){const [x,y]=fila.shift();if(Math.hypot(x-alvo[0],y-alvo[1])<.8)return true;
  for(const [dx,dy] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const nx=x+dx,ny=y+dy,kk=k(nx,ny);if(vis.has(kk)||!dentro(nx,ny,todos))continue;vis.add(kk);fila.push([nx,ny]);}}
 return false;
}
function textura(){
 const c=document.createElement('canvas');c.width=96;c.height=96;const g=c.getContext('2d');let s=11;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 for(let i=0;i<70;i++){const x=r()*96,y=r()*96,l=6+r()*18,w=1+r()*1.6,a=.1+r()*.3;g.fillStyle='rgba(255,255,255,'+a.toFixed(2)+')';for(const dx of [-96,0,96])for(const dy of [-96,0,96])g.fillRect(x+dx,y+dy,l,w);}
 return c;
}
export function instalarAguaAmbiente({controller,root=document}={}){
 const win=root.defaultView||window,tex=textura(),T0=performance.now();
 win.mesaRelogioAguaV205=()=>(performance.now()-T0)/1000;
 const ctl=()=>{try{return controller?.()||null;}catch(_){return null;}};
 let cv=null,g=null,geo=null,chave='',pad=null;
 const mundo=()=>root.querySelector('#novaSyncBoard [data-world-layer]');
 function garante(W,H){
  const w=mundo();if(!w)return false;const cw=Math.round(W*PPM),ch=Math.round(H*PPM);
  if(!cv||cv.parentElement!==w){cv?.remove();cv=root.createElement('canvas');cv.className='aa-ambiente';cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:normal';w.append(cv);g=cv.getContext('2d');pad=g.createPattern(tex,'repeat');}
  if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch;}
  return true;
 }
 function empilha(){ // acima das poças, abaixo de areia/ponte/objetos/miniaturas: z = o maior z das poças de água
  const w=mundo(),c=ctl()?.cenaAtual?.();if(!w||!c)return;let z=0;
  for(const o of c.objects||[]){if(!String(o.erPoca||'').startsWith('agua'))continue;const n=w.querySelector('[data-scene-object="'+CSS.escape(String(o.id))+'"]');const v=parseInt(n?.style.zIndex||'0',10);if(v>z)z=v;}
  cv.style.zIndex=String(z||1);if(cv.nextElementSibling)w.append(cv);
 }
 function clipa(rects){g.beginPath();for(const [x,y,w,h] of rects)g.rect(x*PPM,y*PPM,w*PPM,h*PPM);g.clip();}
 function desenha(t){
  const c=ctl(),cena=c?.cenaAtual?.(),dm=c?.dimsAtual?.()||{W:28,H:14},{W,H}=dm,objs=cena?.objects||[];
  const k=W+'x'+H+':'+(cena?.mapId||'')+':'+objs.length+':'+objs.filter(o=>o?.erPoca).length+':'+objs.filter(o=>o?.fluxoV205).length;
  if(k!==chave){chave=k;geo=geometriaDaAgua(objs,W,H);}
  if(!geo.lagoRects.length&&!geo.rioRects.length){if(cv)cv.style.display='none';return;}
  if(!garante(W,H))return;
  const sub=(()=>{try{return win.mesaAndarV144?.elevacaoVista?.()<0;}catch(_){return false;}})();cv.style.display=sub?'none':'';if(sub)return;
  empilha();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);
  const dirx=geo.dir.dx||0,diry=geo.dir.dy||1;
  // (0) gradação de cor (referência do Yuri: verde-azulado profundo e dessaturado, raso mais claro e translúcido): véu teal sobre a água toda e mais escuro no fundo
  if(geo.lagoRects.length){g.save();clipa(geo.lagoRects);g.fillStyle='rgba(18,96,106,.30)';g.fillRect(0,0,cv.width,cv.height);g.restore();}
  if(geo.rioRects.length){g.save();clipa(geo.rioRects);g.fillStyle='rgba(40,128,134,.16)';g.fillRect(0,0,cv.width,cv.height);g.restore();}
  // (1) lagoa: ondulação de fundo, duas camadas lentas em direções diferentes (nunca em grade)
  if(geo.lagoRects.length){g.save();clipa(geo.lagoRects);g.fillStyle=pad;g.globalAlpha=.16;
   g.save();g.translate(t*.9,t*.5);g.scale(.9,.9);g.fillStyle=pad;g.fillRect(-300,-300,cv.width/.9+600,cv.height/.9+600);g.restore();
   g.globalAlpha=.1;g.save();g.rotate(.5);g.translate(-t*.6,t*.35);g.scale(1.3,1.3);g.fillStyle=pad;g.fillRect(-300,-300,cv.width/1.3+900,cv.height/1.3+900);g.restore();
   g.restore();}
  // (2) canal: faixas que correm a jusante (relógio compartilhado com a queda), mais lentas perto da foz
  if(geo.rioRects.length&&geo.foz){g.save();clipa(geo.rioRects);const bb=geo.rioRects.reduce((m,r)=>({x0:Math.min(m.x0,r[0]),y0:Math.min(m.y0,r[1]),x1:Math.max(m.x1,r[0]+r[2]),y1:Math.max(m.y1,r[1]+r[3])}),{x0:1e9,y0:1e9,x1:-1e9,y1:-1e9});
   const L=Math.max(.1,bb.y1-bb.y0);g.globalAlpha=.5;
   for(let y=bb.y0;y<bb.y1;y+=.5){const f=(y-bb.y0)/L,veloc=(geo.dir.vel||1)*(1.1-.85*Math.max(0,(y-(geo.foz.y-3))/3.5));const off=(t*Math.max(.18,veloc)*PPM*1.6)%96;
    g.save();g.beginPath();g.rect(bb.x0*PPM,y*PPM,(bb.x1-bb.x0)*PPM,.5*PPM);g.clip();g.translate(0,diry*off);g.fillStyle=pad;g.fillRect(bb.x0*PPM,(y*PPM)-diry*off-96,(bb.x1-bb.x0)*PPM,.5*PPM+192);g.restore();}
   g.restore();}
  // (2b) mistura de cor: o canal raso escurece devagar até o tom da lagoa nos últimos metros (some a emenda de cor)
  if(geo.rioRects.length&&geo.foz){g.save();clipa(geo.rioRects);const gr=g.createLinearGradient(0,(geo.foz.y-4.5)*PPM,0,(geo.foz.y+1.5)*PPM);gr.addColorStop(0,'rgba(40,140,152,0)');gr.addColorStop(1,'rgba(40,140,152,.45)');g.fillStyle=gr;g.fillRect(0,(geo.foz.y-4.5)*PPM,cv.width,6*PPM);g.restore();}
  // (3) foz: anéis de mistura que nascem na desembocadura e morrem dentro da lagoa (recortados pela lagoa; esmaecem com a distância)
  if(geo.foz&&geo.lagoRects.length){g.save();clipa(geo.lagoRects);
   for(let i=0;i<3;i++){const f=((t*.22+i/3)%1),r=(.8+f*6.5)*PPM,a=.55*(1-f)*(1-f);g.strokeStyle='rgba(235,250,255,'+a.toFixed(3)+')';g.lineWidth=1.6;g.beginPath();g.ellipse(geo.foz.x*PPM,(geo.foz.y+.4)*PPM,r*1.2,r*.8,0,0,6.283);g.stroke();}
   const gr=g.createRadialGradient(geo.foz.x*PPM,geo.foz.y*PPM,0,geo.foz.x*PPM,geo.foz.y*PPM,3*PPM);gr.addColorStop(0,'rgba(255,255,255,'+(.22+.06*Math.sin(t*2)).toFixed(2)+')');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(geo.foz.x*PPM-4*PPM,geo.foz.y*PPM-4*PPM,8*PPM,8*PPM);
   g.restore();}
 }
 const iv=setInterval(()=>{try{if(root.hidden||win.document?.hidden)return;desenha(win.mesaRelogioAguaV205());}catch(e){console.warn('[Água ambiente]',e);}},100);iv.unref?.();
 const api={parar:()=>{clearInterval(iv);cv?.remove();},desenhar:()=>desenha(win.mesaRelogioAguaV205()),geometria:()=>geo,canvas:()=>cv};
 win.mesaAguaAmbienteV205=api;return api;
}
