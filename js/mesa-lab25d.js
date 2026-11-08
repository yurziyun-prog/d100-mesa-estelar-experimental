// Laboratório v224.3: renderização ortográfica de geometria 3D em Canvas 2D.
// Projeção de vértices reais [x,y,z], não fachadas coladas em um tabuleiro 2D.
// Apenas visualização experimental; não escreve no Firebase.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Inspirado na leitura isometrica de RPGs classicos: norte estavel, cameras sem rotacao livre no jogo.
const JOGO_YAW=-Math.PI/4, JOGO_PITCH=.75, JOGO_ZOOM=1.6;
const V=(x,y,z=0)=>[x,y,z];
const casa={x:9,y:5,w:7,d:5,h:3.2,telhado:1.7};
const faces=[];
function face(vs,cor,borda='#24313b'){faces.push({vs,cor,borda});}
function caixa(x,y,z,w,d,h,cores){
 const A=V(x,y,z),B=V(x+w,y,z),C=V(x+w,y+d,z),D=V(x,y+d,z);
 const E=V(x,y,z+h),F=V(x+w,y,z+h),G=V(x+w,y+d,z+h),H=V(x,y+d,z+h);
 face([A,B,F,E],cores[0]);face([B,C,G,F],cores[1]);face([D,C,G,H],cores[2]);face([D,A,E,H],cores[3]);face([E,F,G,H],cores[4]);
}
const casaFaces=()=>{
 faces.length=0;
 // Terreno, estrada, cercado e sombra compartilham o mesmo plano do cenário.
 face([V(0,0),V(28,0),V(28,18),V(0,18)],'#61785b','#61785b');
 face([V(0,12),V(28,12),V(28,16),V(0,16)],'#9e9a86','#9e9a86');
 face([V(0,12),V(28,12),V(28,12.18),V(0,12.18)],'#ded3b4','#ded3b4');
 face([V(0,15.82),V(28,15.82),V(28,16),V(0,16)],'#ded3b4','#ded3b4');
 // Fundação de pedra de 7 x 5 metros e paredes de 3,2 metros.
 caixa(casa.x,casa.y,0,casa.w,casa.d,.28,['#77756b','#64655e','#77756b','#5c5b55','#b0a795']);
 caixa(casa.x+.15,casa.y+.15,.28,casa.w-.3,casa.d-.3,casa.h-.28,['#c9ae85','#977552','#d1b28c','#af8965','#d2b48b']);
 const x=casa.x,y=casa.y,w=casa.w,d=casa.d,h=casa.h,r=casa.telhado,ext=.45;
 // Telhado em duas águas: cumeeira paralela ao eixo y.
 const L=x-ext,R=x+w+ext,M=x+w/2;
 const front=y-ext,back=y+d+ext,wall=h-.03,top=h+r;
 face([V(L,front,wall),V(M,front,top),V(M,back,top),V(L,back,wall)],'#775341','#513a32');
 face([V(M,front,top),V(R,front,wall),V(R,back,wall),V(M,back,top)],'#a15f48','#543529');
 face([V(L,front,wall),V(M,front,top),V(R,front,wall)],'#6d4a39','#453126');
 face([V(L,back,wall),V(R,back,wall),V(M,back,top)],'#6a4637','#453126');
 // Ripas do telhado como geometria e chaminé com altura real.
 caixa(x+4.8,y+3.4,h+.5,.75,.7,1.7,['#8e5040','#803e32','#8e5040','#803e32','#b66b4d']);
 // Janelas e portas estão em planos verticais à frente das paredes.
 face([V(x+2.7,y-.016,.29),V(x+4.1,y-.016,.29),V(x+4.1,y-.016,2.35),V(x+2.7,y-.016,2.35)],'#59443b','#302b2a');
 face([V(x+.75,y-.02,1.2),V(x+2.05,y-.02,1.2),V(x+2.05,y-.02,2.3),V(x+.75,y-.02,2.3)],'#72b8bc','#2a4a53');
 face([V(x+w-.02,y+1.4,1.2),V(x+w-.02,y+2.9,1.2),V(x+w-.02,y+2.9,2.4),V(x+w-.02,y+1.4,2.4)],'#65aeb5','#294b52');
};
const paleta={ceu:'#aec6d1',chao:'#61785b'};
export function instalarLaboratorio25D({root=document,win=window,host,ativo=()=>false,modo=()=>'',mapa=()=>'',idMapa=''}={}){
 if(!host)return {atualizar(){},destruir(){}};
 const painel=root.createElement('div');painel.id='mtmLab25D';
 painel.style.cssText='position:relative;width:100%;min-height:580px;height:min(78dvh,900px);overflow:hidden;border:1px solid #516a79;border-radius:12px;background:#a6c2ce;touch-action:none';
 const canvas=root.createElement('canvas');canvas.style.cssText='width:100%;height:100%;display:block;cursor:grab;touch-action:none';canvas.setAttribute('aria-label','Protótipo geométrico 2,5D: casa, rua e personagem');
 const help=root.createElement('div');help.style.cssText='position:absolute;left:12px;top:10px;z-index:2;padding:6px 9px;border-radius:7px;background:#0c1b2dda;color:#e8f5ff;font:12px Segoe UI,Arial,sans-serif;pointer-events:none';help.textContent='Laboratório geométrico 2,5D · arraste para girar · roda para aproximar · não edita objetos';
 painel.append(canvas,help);host.prepend(painel);
 const ctx=canvas.getContext('2d');let yaw=-.65,pitch=.62,zoom=1.0,raf=0,drag=null,ultimoModo='',personagem=[18,13,0],selecionado='',modoAtual='mapa-construtor',centroCamera=[14,9],ultimoTokenPos='';
 const lerTokens=()=>{const b=root.getElementById('novaSyncBoard');return [...(b?.querySelectorAll('[data-token]')||[])].map(el=>({id:el.dataset.token,x:parseFloat(el.style.left)*.28,y:parseFloat(el.style.top)*.14})).filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y));};
 function orientar(p){const [x,y,z]=p,c=Math.cos(yaw),s=Math.sin(yaw);const xx=x*c-y*s,yy=x*s+y*c;return [xx,yy*Math.sin(pitch)-z*Math.cos(pitch),yy*Math.cos(pitch)+z*Math.sin(pitch)];}
 function pintar(){
  raf=0;if(!painel.isConnected)return;
  const r=canvas.getBoundingClientRect(),dpr=clamp(win.devicePixelRatio||1,1,2),W=Math.max(1,Math.round(r.width*dpr)),H=Math.max(1,Math.round(r.height*dpr));
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const width=W/dpr,height=H/dpr;
  const grad=ctx.createLinearGradient(0,0,0,height);grad.addColorStop(0,'#9fb8c9');grad.addColorStop(1,'#cad4cf');ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
   // No modo de jogo a camera desliza suavemente para seguir a miniatura.
  // O angulo do mundo nunca gira quando a miniatura muda de direcao.
  const center=orientar(V(centroCamera[0],centroCamera[1],0)),scale=Math.min(width/38,height/26)*zoom;
  const projetar=v=>{const q=orientar(v);return [width/2+(q[0]-center[0])*scale,height*.53+(q[1]-center[1])*scale];};
  const desenharPoligono=(vs,cor,borda)=>{ctx.beginPath();vs.forEach((v,i)=>{const [x,y]=projetar(v);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();ctx.fillStyle=cor;ctx.fill();if(borda){ctx.strokeStyle=borda;ctx.lineWidth=Math.max(.6,scale*.018);ctx.stroke();}};
  casaFaces();
  // painter's algorithm em função da profundidade média das faces
  const sorted=faces.map(f=>({...f,depth:f.vs.reduce((sum,v)=>sum+orientar(v)[2],0)/f.vs.length})).sort((a,b)=>a.depth-b.depth);
  for(const f of sorted)desenharPoligono(f.vs,f.cor,f.borda);
  // Um personagem de 1,75 m, na escala física da casa (3,2 m de paredes).
  const tok=lerTokens().find(t=>t.id===selecionado)||lerTokens()[0];
  let p=tok?[tok.x,tok.y,0]:personagem;
  // Visão sem token: um demonstrador virtual, sem salvar um jogador no banco.
  const a=projetar(V(p[0],p[1],0)),b=projetar(V(p[0],p[1],1.75)),mid=projetar(V(p[0],p[1],.94));
  ctx.fillStyle='#26343b55';ctx.beginPath();ctx.ellipse(a[0]+scale*.22,a[1]+scale*.07,scale*.42,scale*.17,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#1c3342';ctx.lineWidth=Math.max(2,scale*.16);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(mid[0],mid[1]);ctx.stroke();
  ctx.strokeStyle='#3288ac';ctx.lineWidth=Math.max(5,scale*.48);ctx.beginPath();ctx.moveTo(mid[0],mid[1]);ctx.lineTo(b[0],b[1]+scale*.18);ctx.stroke();
  ctx.fillStyle='#edbb8b';ctx.beginPath();ctx.arc(b[0],b[1]+scale*.13,Math.max(4,scale*.20),0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#102235bb';ctx.fillRect(10,height-29,Math.min(440,width-20),22);ctx.fillStyle='#edf7ff';ctx.font='12px Segoe UI,Arial';ctx.fillText('Casa: 7 × 5 m · parede 3,2 m · personagem 1,75 m',18,height-14);
 }
 const invalidate=()=>{if(!raf)raf=win.requestAnimationFrame(pintar);};
 canvas.addEventListener('pointerdown',e=>{if(modoAtual==='mapa-jogo')return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});
 canvas.addEventListener('pointermove',e=>{if(modoAtual==='mapa-jogo'||!drag||e.pointerId!==drag.id)return; yaw+=(e.clientX-drag.x)*.007;pitch=clamp(pitch+(e.clientY-drag.y)*.005,.16,1.56);drag.x=e.clientX;drag.y=e.clientY;invalidate();});
 const stop=e=>{if(drag&&e.pointerId===drag.id){drag=null;canvas.style.cursor='grab';}};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
 canvas.addEventListener('wheel',e=>{if(modoAtual==='mapa-jogo')return;e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.7,3);invalidate();},{passive:false});
 const resize=typeof ResizeObserver!=='undefined'?new ResizeObserver(invalidate):null;resize?.observe(painel);
 const acompanhamento=win.setInterval(()=>{
  if(modoAtual!=='mapa-jogo'||painel.hidden)return;
  const t=lerTokens().find(t=>t.id===selecionado);
  if(!t)return;
  centroCamera[0]+=(t.x-centroCamera[0])*.26;
  centroCamera[1]+=(t.y-centroCamera[1])*.26;
  if(Math.hypot(t.x-centroCamera[0],t.y-centroCamera[1])>.008)invalidate();
  const chave=t.id+':'+t.x.toFixed(3)+':'+t.y.toFixed(3);
  if(chave!==ultimoTokenPos){
   ultimoTokenPos=chave;
   // O jogador se move no mundo; o mundo mantém seu norte isométrico.
   // Câmera do jogo acompanha sem exigir controle manual do ângulo.
   invalidate();
  }
 },160);
 return {el:painel,atualizar({visivel=false,token='',modo='mapa-construtor'}={}){
  const mudou=modoAtual!==modo,tokenMudou=selecionado!==token;
  modoAtual=modo;selecionado=token;
  if(modo==='mapa-jogo'&&tokenMudou){const t=lerTokens().find(t=>t.id===token);if(t)centroCamera=[t.x,t.y];}
  if(mudou){
   drag=null;
   if(modo==='mapa-construtor'){pitch=1.20;zoom=1.20;centroCamera=[14,9];}
   if(modo==='mapa-mestre'){pitch=.68;zoom=1;centroCamera=[14,9];}
   if(modo==='mapa-jogo'){yaw=JOGO_YAW;pitch=JOGO_PITCH;zoom=JOGO_ZOOM;const t=lerTokens().find(t=>t.id===selecionado);if(t)centroCamera=[t.x,t.y];}
  }
  canvas.style.cursor=modo==='mapa-jogo'?'default':'grab';
  canvas.style.touchAction=modo==='mapa-jogo'?'auto':'none';
  help.textContent=modo==='mapa-construtor'
   ?'CONSTRUTOR · arraste para girar e inclinar · roda para zoom · modelo visual, edição ainda no mapa funcional'
   :modo==='mapa-mestre'
   ?'MESTRE · câmera livre para inspeção · arraste para girar · roda para zoom'
   :'JOGO · estilo isométrico clássico · norte fixo · acompanha personagem · rotação e zoom bloqueados';
  painel.hidden=!visivel;painel.style.display=visivel?'block':'none';
  if(visivel&&(mudou||tokenMudou||!raf))invalidate();
 },destruir(){win.clearInterval(acompanhamento);resize?.disconnect();if(raf)win.cancelAnimationFrame(raf);painel.remove();}};
}
