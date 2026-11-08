// Mesa Estelar v132 — Cabeças que se estendem (Cila e outras criaturas de vários pescoços).
//
// Em volta da miniatura, cada cabeça balança no seu próprio ritmo. Quando a criatura ataca, a cabeça que
// atacou estica o pescoço até o alvo, morde e volta. A criatura em si não sai do lugar.
// Só desenho (nada é gravado). Módulo à parte: se falhar, o mapa segue igual.

import {cabecasDe} from './mesa-tempo-real-ia.js?v=133';

const HEALTH='combatesAtivos/mapaMesaSyncSaude';

// Posição da ponta da cabeça i (em px) num instante, sem ataque.
export function cabecaEmRepouso(i,n,cx,cy,r,t){
 const fase=i*2.399,ang=i/n*Math.PI*2+.28*Math.sin(t*(.55+.13*i)+fase),L=r*(.98+.12*Math.sin(t*(.9+.21*i)+fase*1.7));
 return {x:cx+Math.cos(ang)*L,y:cy+Math.sin(ang)*L,ang};
}
// Qual cabeça vai atacar quando o evento não diz: a mais virada para o alvo.
export function cabecaMaisProxima(n,cx,cy,alvo,t){
 let melhor=0,md=Infinity;for(let i=0;i<n;i++){const p=cabecaEmRepouso(i,n,cx,cy,1,t),a=Math.atan2(alvo.y-cy,alvo.x-cx);const d=Math.abs(Math.atan2(Math.sin(p.ang-a),Math.cos(p.ang-a)));if(d<md){md=d;melhor=i;}}return melhor;
}

export function instalarCabecas(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const board=()=>root.getElementById('novaSyncBoard');
 const botes=[];let canvas=null,raf=0,ultimoEvento='',parar=null,cacheN=new Map();
 const nDe=t=>{const id=decodeURIComponent(String(t?.id||''));if(!id.startsWith('synccriatura:'))return 0;const b=id.slice(13).split('~')[0];
  if(cacheN.has(b))return cacheN.get(b);const m=(dep.criaturas?.()||[]).find(c=>String(c.id)===b);const n=m?cabecasDe(m):0;if(m)cacheN.set(b,n);return n;};
 function tela(){
  const b=board();if(!b)return null;
  if(!canvas||canvas.parentElement!==b){canvas?.remove();canvas=root.createElement('canvas');canvas.id='cabecasCamada';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7';b.append(canvas);}
  if(canvas.width!==b.clientWidth||canvas.height!==b.clientHeight){canvas.width=b.clientWidth;canvas.height=b.clientHeight;}
  return canvas;
 }
 function pescoco(ctx,cx,cy,hx,hy,grossura,tt,i){
  const dx=hx-cx,dy=hy-cy,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,ond=Math.sin(tt*2.2+i)*L*.18;
  const c1={x:cx+dx*.35+nx*ond,y:cy+dy*.35+ny*ond},c2={x:cx+dx*.7-nx*ond*.7,y:cy+dy*.7-ny*ond*.7};
  ctx.lineCap='round';
  ctx.strokeStyle='#3a2420';ctx.lineWidth=grossura+3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,hx,hy);ctx.stroke();
  ctx.strokeStyle='#8a5d4f';ctx.lineWidth=grossura;ctx.beginPath();ctx.moveTo(cx,cy);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,hx,hy);ctx.stroke();
  ctx.strokeStyle='rgba(220,170,140,.45)';ctx.lineWidth=Math.max(1,grossura*.3);ctx.beginPath();ctx.moveTo(cx,cy);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,hx,hy);ctx.stroke();
 }
 function cabeca(ctx,x,y,ang,tam,boca){
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);
  ctx.fillStyle='#6f4638';ctx.strokeStyle='#2a1612';ctx.lineWidth=1.5;
  // mandíbulas (abrem no bote)
  for(const s of [-1,1]){ctx.save();ctx.rotate(s*boca*.6);ctx.beginPath();ctx.moveTo(-tam*.3,0);ctx.quadraticCurveTo(tam*.4,s*tam*.55,tam*1.05,s*tam*.12);ctx.lineTo(tam*.1,s*tam*.05);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#f3ead8';for(let k=0;k<4;k++){const px=tam*(.25+k*.2);ctx.beginPath();ctx.moveTo(px,s*tam*.12);ctx.lineTo(px+tam*.07,s*tam*(.12-.16));ctx.lineTo(px+tam*.13,s*tam*.12);ctx.fill();}ctx.fillStyle='#6f4638';ctx.restore();}
  ctx.beginPath();ctx.ellipse(-tam*.15,0,tam*.42,tam*.36,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffd23a';for(const s of [-1,1]){ctx.beginPath();ctx.arc(-tam*.05,s*tam*.2,tam*.09,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 function quadro(agora){
  raf=0;const c=ctl(),b=board();if(!c||!b||!b.offsetParent)return agendar(600);
  const lista=(c.tokensNoMapa?.()||[]).filter(t=>nDe(t)>0);
  const cv=tela();if(!cv)return agendar(600);const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);
  if(!lista.length){return agendar(800);}
  const W=Number(b.dataset.mapaLargura)||28,ppm=cv.width/W,tt=agora/1000;
  for(const t of lista){
   const n=nDe(t),cx=Number(t.x)/28*cv.width,cy=Number(t.y)/14*cv.height,r=Math.max(10,(Number(t.diametroM)||1)*ppm/2);
   const morta=!!c.saude?.(t.id)?.morto;
   for(let i=0;i<n;i++){
    let p=cabecaEmRepouso(i,n,cx,cy,r,tt),boca=.15+.1*Math.sin(tt*3+i);
    if(morta){p={x:cx+Math.cos(i/n*6.283)*r*.9,y:cy+Math.sin(i/n*6.283)*r*.9,ang:i/n*6.283};boca=.05;}
    const bote=botes.find(x=>x.token===t.id&&x.cabeca===i);
    if(bote&&!morta){
     const f=(agora-bote.inicio)/bote.dur;
     if(f>=1)botes.splice(botes.indexOf(bote),1);
     else{const ida=f<.3?f/.3:f<.45?1:1-(f-.45)/.55,ease=1-Math.pow(1-ida,3);
      const ax=Number(bote.alvo.x)/28*cv.width,ay=Number(bote.alvo.y)/14*cv.height,ang=Math.atan2(ay-cy,ax-cx);
      const fim={x:ax-Math.cos(ang)*ppm*.25,y:ay-Math.sin(ang)*ppm*.25};
      p={x:p.x+(fim.x-p.x)*ease,y:p.y+(fim.y-p.y)*ease,ang:p.ang+(Math.atan2(Math.sin(ang-p.ang),Math.cos(ang-p.ang)))*ease};boca=f<.3?.15+ida*.7:f<.45?.05:.2;}
    }
    const tam=Math.max(7,Math.min(r*.2,ppm*.75));
    const ba=i/n*Math.PI*2,bx=cx+Math.cos(ba)*r*.38,by=cy+Math.sin(ba)*r*.38; // cada pescoço nasce da borda do corpo
    pescoco(ctx,bx,by,p.x,p.y,Math.max(3,tam*.5),tt,i);
    cabeca(ctx,p.x,p.y,p.ang,tam,boca);
   }
  }
  agendar();
 }
 function agendar(ms=0){if(raf)return;raf=-1;setTimeout(()=>{raf=win.requestAnimationFrame(quadro);},ms);}
 function aoEvento(ev){
  if(!ev?.id||ev.id===ultimoEvento)return;ultimoEvento=ev.id;if(Date.now()-Number(ev.ts||0)>6000)return;
  const sid=ev.source?.id;if(!sid||!ev.target)return;const c=ctl(),t=c?.token?.(sid)||(c?.tokensNoMapa?.()||[]).find(x=>x.id===sid);const n=nDe(t||{id:sid});if(!n||!t)return;
  const b=board(),cx=Number(t.x),cy=Number(t.y);
  const k=Number.isInteger(ev.cabeca)?ev.cabeca%n:cabecaMaisProxima(n,cx,cy,ev.target,performance.now()/1000);
  botes.push({token:sid,cabeca:k,alvo:{x:Number(ev.target.x),y:Number(ev.target.y)},inicio:performance.now(),dur:900});void b;
 }
 parar=dep.onSnapshot(D(HEALTH),s=>{try{aoEvento(s.exists()?s.data()?.event:null);}catch(e){console.warn('[Cabeças]',e);}},()=>{});
 agendar(500);
 return {parar:()=>{parar?.();canvas?.remove();}};
}
