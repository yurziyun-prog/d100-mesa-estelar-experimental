// Mesa Estelar v205 — Profundidade VISUAL da água e dos solos fundos (primeira etapa).
// SEM rolagens, SEM fôlego, SEM dano, SEM morte por afogamento: só estados de desenho (seco → vadeando → nadando), reversíveis e com histerese na borda.
// A profundidade é gradual (cresce com a distância da margem) e é comparada com a ALTURA DO CORPO: a mesma água que cobre um cão de sucata mal molha o pé de um humano.
// Quem voa (pés a mais de 0,5 m) não entra. Criaturas aquáticas ficam no volume de água (só ondulam). Não se desloca nem se encolhe o sprite (na visão de cima isso falharia):
// a água é composta POR CIMA do corpo (tinta + ondas de entrada, ondulações em repouso, rastro ao nadar e gotas na saída), num canvas que não cobre HUD nem barras.
import {ESPECIES,idDaEspecie} from './mesa-especies-mapa.js?v=205';
import {alturaCorpoM,altitudePesM} from './mesa-espaco.js?v=205';
/** v205: o banco guarda cada array interno de rectsV201 como {__arrV205:[…]} (Firestore não aceita array dentro de array); aceita os dois formatos */
export const rectsNormais=a=>(a||[]).map(r=>Array.isArray(r)?r:(r&&r.__arrV205)||[]);
/** profundidade máxima (m) de cada material no miolo da poça; a borda sempre começa em zero (rampa de entrada e saída) */
export const PROFUNDIDADE_M={agua_rasa:.18,agua:.6,agua_profunda:2.2,agua_pantano:.6}; // pântano: lama funda até a cintura (vadear), não nado
export const LIMIAR_NADAR_ENTRA=.5,LIMIAR_NADAR_SAI=.35,LIMIAR_VADEAR=.04; // qualquer água (até o canal raso) já faz ondulação ao andar
const dentroRects=(x,y,rects)=>(rects||[]).some(([rx,ry,rw,rh])=>x>=rx&&x<=rx+rw&&y>=ry&&y<=ry+rh);
const caixa=(o,W,H)=>{const cx=Number(o.x)*W/28,cy=Number(o.y)*H/14,w=Number(o.larguraM)||1,h=Number(o.alturaM)||1;return [[cx-w/2,cy-h/2,w,h]];};
/** poças de água da cena (metros): {tipo,rects,nivel}. Lava e outros materiais não entram (a lava tem o módulo próprio). */
export function pocasDeAgua(objs=[],W=28,H=14){
 const p=[];
 for(const o of objs){if(!o||o.destruido)continue;const t=String(o.erPoca||'');if(!(t in PROFUNDIDADE_M))continue;p.push({tipo:t,rects:o.rectsV201?.length?rectsNormais(o.rectsV201):caixa(o,W,H),nivel:Math.max(1,Number(o.andarV144??1)||1),camada:Number(o.camada)||0});}
 return p;
}
/** profundidade (m) num ponto: maior entre as poças que o contêm, reduzida perto da margem (distância ao fora, 8 direções, até 1,6 m) */
export function profundidadeNoPonto(pt,pocas,nivel=1){
 let melhor=0,tipo='';
 for(const p of pocas){
  if(p.nivel!==nivel||!dentroRects(pt.x,pt.y,p.rects))continue;
  let borda=1.6;for(let k=0;k<8;k++){const a=k*Math.PI/4;for(let d=.2;d<=1.6;d+=.2)if(!dentroRects(pt.x+Math.cos(a)*d,pt.y+Math.sin(a)*d,p.rects)){borda=Math.min(borda,d);break;}}
  const g=Math.min(1,borda/1.6),s=g*g*(3-2*g),prof=PROFUNDIDADE_M[p.tipo]*s;
  if(prof>melhor){melhor=prof;tipo=p.tipo;}
 }
 return {prof:melhor,tipo};
}
/** estado visual com histerese: seco | vadeando | nadando. frac = profundidade / (85% da altura do corpo) */
export function modoDeAgua(frac,anterior='seco'){
 if(anterior==='nadando')return frac>=LIMIAR_NADAR_SAI?'nadando':frac>=LIMIAR_VADEAR?'vadeando':'seco';
 if(frac>=LIMIAR_NADAR_ENTRA)return 'nadando';
 if(anterior==='vadeando')return frac>=LIMIAR_VADEAR*.6?'vadeando':'seco';
 return frac>=LIMIAR_VADEAR?'vadeando':'seco';
}
export function instalarAguaVisual({controller,root=document}={}){
 const win=root.defaultView||window,ctl=()=>{try{return controller?.()||null;}catch(_){return null;}};
 const estados=new Map(),t0=performance.now();let cv=null,g=null;
 function canvas(){
  const b=root.getElementById('novaSyncBoard'),sc=b?.parentElement;if(!b||!sc)return null;
  if(!cv||cv.parentElement!==sc){cv?.remove();cv=root.createElement('canvas');cv.id='agCamada';cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:33';sc.append(cv);g=cv.getContext('2d');}
  const w=Math.max(160,Math.round(sc.clientWidth/2)),h=Math.max(120,Math.round(sc.clientHeight/2));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  return {b,sc};
 }
 function atualizar(){
  const c=ctl(),cena=c?.cenaAtual?.(),objs=cena?.objects||[],{W,H}=c?.dimsAtual?.()||{W:28,H:14};
  const pocas=pocasDeAgua(objs,W,H),vivos=new Set();
  if(!pocas.length){estados.clear();return;}
  const nivelDe=t=>{try{return Number(win.mesaAndarV144?.doToken?.(t.id))||1;}catch(_){return 1;}};
  for(const t of c?.tokensNoMapa?.()||[]){
   const id=t.id,pt={x:Number(t.x)*W/28,y:Number(t.y)*H/14},alt=altitudePesM(t,!!win.mesaVoandoV203?.(id));
   const ant=estados.get(id)||{modo:'seco',frac:0,t:0};
   if(alt>.5){if(ant.modo!=='seco')estados.set(id,{modo:'seco',frac:0,t:performance.now(),saiu:performance.now()});continue;}
   const {prof,tipo}=profundidadeNoPonto(pt,pocas,nivelDe(t)),frac=Math.min(1,prof/(alturaCorpoM(t)*.85)),modo=modoDeAgua(frac,ant.modo);
   const esp=ESPECIES[idDaEspecie(t)],aquatico=!!esp?.aquatico;
   estados.set(id,{modo,frac,prof:+prof.toFixed(2),tipo,aquatico,x:pt.x,y:pt.y,t:modo!==ant.modo?performance.now():ant.t,entrou:modo!=='seco'&&ant.modo==='seco'?performance.now():ant.entrou,saiu:modo==='seco'&&ant.modo!=='seco'?performance.now():ant.saiu,turva:tipo==='agua_pantano'});
   vivos.add(id);
  }
  for(const k of [...estados.keys()])if(!vivos.has(k)&&estados.get(k).modo==='seco'&&performance.now()-(estados.get(k).saiu||0)>1500)estados.delete(k);
 }
 function desenhar(){
  const ctx=canvas();if(!ctx)return;const c=ctl(),{W,H}=c?.dimsAtual?.()||{W:28,H:14};
  g.clearRect(0,0,cv.width,cv.height);
  const br=ctx.b.getBoundingClientRect(),sr=ctx.sc.getBoundingClientRect(),esc=cv.width/sr.width,t=(performance.now()-t0)/1000;
  const px=x=>(br.left-sr.left+x/W*br.width)*esc,py=y=>(br.top-sr.top+y/H*br.height)*esc,rm=m=>m/W*br.width*esc;
  const arte=win.mesaArte3dV200?._estado?.();
  for(const [id,e] of estados){
   const tk=c?.token?.(id);if(!tk)continue;
   const raio=Math.max(.35,(Number(tk.diametroM)||1)*.5),x=px(e.x),y=py(e.y),r=rm(raio);
   if(x<-60||y<-60||x>cv.width+60||y>cv.height+60)continue;
   const agora=performance.now(),dEntra=(agora-(e.entrou||0))/1000,dSai=(agora-(e.saiu||0))/1000,cor=e.turva?'110,120,70':'70,175,205';
   if(e.modo!=='seco'){
    // tinta da água sobre o corpo (mais cobertura quanto mais fundo); aquáticos só ondulam
    if(!e.aquatico){const gr=g.createRadialGradient(x,y,0,x,y,r*1.05);gr.addColorStop(0,'rgba('+cor+','+(.1+.5*e.frac).toFixed(2)+')');gr.addColorStop(1,'rgba('+cor+',0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r*1.05,0,6.283);g.fill();}
    // ondulações em repouso / mais fortes ao nadar
    const n=e.modo==='nadando'?3:2;for(let k=0;k<n;k++){const f=((t*.5+k/n)%1);g.strokeStyle='rgba(235,250,255,'+(.5*(1-f)).toFixed(2)+')';g.lineWidth=1.2;g.beginPath();g.ellipse(x,y,r*(.7+f*.9),r*(.5+f*.65),0,0,6.283);g.stroke();}
    // braçadas de quem NADA (água funda): dois arcos que se alternam dos lados do corpo, no ritmo do nado (parado, é só bater de pés: bolhas em volta)
    if(e.modo==='nadando'&&!e.aquatico){const sA=win.mesaArte3dV200?._estado?.()?.get?.(id),ang=Number.isFinite(sA?.ang)?sA.ang:Math.PI,fase=Math.sin(t*7);for(const lado of [-1,1]){const forca=Math.max(0,lado*fase),px=-Math.sin(ang)*lado,py=Math.cos(ang)*lado;g.strokeStyle='rgba(235,250,255,'+(.25+.55*forca).toFixed(2)+')';g.lineWidth=1.8;g.beginPath();g.arc(x+px*r*.85+Math.cos(ang)*r*(.2+.5*forca),y+py*r*.85+Math.sin(ang)*r*(.2+.5*forca),r*.42,ang-1.2,ang+1.2);g.stroke();}}
    // rastro orientado: V atrás de quem nada/vadeia andando
    const s=arte?.get?.(id),andando=s&&performance.now()-(s.ultMov||0)<500;
    if(andando&&Number.isFinite(s.ang)){const bx=-Math.cos(s.ang),by=-Math.sin(s.ang),px0=-by,py0=bx;g.strokeStyle='rgba(235,250,255,.5)';g.lineWidth=1.3;for(const sg of [-1,1]){g.beginPath();g.moveTo(x,y);g.lineTo(x+bx*r*2.4+px0*sg*r*.9,y+by*r*2.4+py0*sg*r*.9);g.stroke();}}
   }
   // onda de entrada (anel que se abre) e gotas/espuma na saída
   if(e.entrou&&dEntra<1){g.strokeStyle='rgba(255,255,255,'+(.8*(1-dEntra)).toFixed(2)+')';g.lineWidth=2;g.beginPath();g.ellipse(x,y,r*(.8+dEntra*2.2),r*(.6+dEntra*1.6),0,0,6.283);g.stroke();}
   if(e.modo==='seco'&&e.saiu&&dSai<.9)for(let k=0;k<7;k++){const a=k*.9+id.length,d=r*(.6+dSai*1.8);g.fillStyle='rgba(235,250,255,'+(.8*(1-dSai/.9)).toFixed(2)+')';g.beginPath();g.arc(x+Math.cos(a)*d,y+Math.sin(a)*d-dSai*r*.5,1.6,0,6.283);g.fill();}
  }
 }
 const iv=setInterval(()=>{try{if(root.hidden)return;atualizar();desenhar();}catch(e){console.warn('[Água]',e);}},100);iv.unref?.();
 const api={parar:()=>{clearInterval(iv);cv?.remove();},atualizar,desenhar,estados:()=>Object.fromEntries([...estados].map(([k,v])=>[k,{modo:v.modo,frac:+v.frac.toFixed(2),prof:v.prof,tipo:v.tipo,aquatico:v.aquatico}]))};
 win.mesaAguaVisualV205=api;return api;
}
