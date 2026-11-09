// Laboratório v224.3: renderização ortográfica de geometria 3D em Canvas 2D.
// Projeção de vértices reais [x,y,z], não fachadas coladas em um tabuleiro 2D.
// Apenas visualização experimental; não escreve no Firebase.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Inspirado na leitura isometrica de RPGs classicos: norte estavel, cameras sem rotacao livre no jogo.
const JOGO_YAW=-Math.PI/4, JOGO_PITCH=.72, JOGO_ZOOM=1.38;
const MESTRE_YAW=-Math.PI/4, MESTRE_PITCH=.68;
const CONSTRUTOR_YAW=-Math.PI/4, CONSTRUTOR_PITCH=1.14;
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

// Conversão de objetos reais do mapa. x/y são porcentagens 28x14 do motor;
// larguraM/alturaM e z são metros. Nenhum dado é alterado aqui.
function montarCenaReal(scene,W,H){
 const lista=Array.isArray(scene?.objects)?scene.objects:[];
 if(!lista.length){faces.length=0;face([V(0,0),V(W,0),V(W,H),V(0,H)],'#607b5a','#607b5a');return true;}
 faces.length=0;
 face([V(0,0),V(W,0),V(W,H),V(0,H)],'#607b5a','#607b5a');
 const cores={
  madeira:['#a5815e','#825c3c','#c1a17b','#705238','#b69770'],
  tijolo:['#b7684a','#91503a','#cb8667','#8c4d37','#ad6b50'],
  adobe:['#cbb08c','#b29a77','#dec49a','#a88c69','#d3bb95'],
  pedra:['#b6b3a9','#858780','#c5c5bc','#8b8982','#b0afa8']
 };
 let visiveis=0;
 const normal=(n,def)=>Number.isFinite(Number(n))?Number(n):def;
 const objects=lista.filter(o=>o&&!o.destruido&&!o.invisivelV161&&o.opacity!==0).slice(0,1500);
 const prioridade=o=>o.oficina3==='chao'?0:o.oficina3==='teto'?2:1;
 objects.sort((a,b)=>prioridade(a)-prioridade(b));
 for(const o of objects){
  const cx=normal(o.x,NaN)*W/28,cy=normal(o.y,NaN)*H/14;
  const w=normal(o.larguraM,0),h=normal(o.alturaM,0);
  if(![cx,cy,w,h].every(Number.isFinite)||w<=0||h<=0)continue;
  const x=cx-w/2,y=cy-h/2,kind=String(o.oficina3||o.parteV177||'').toLowerCase();
  const mat=String(o.materialV177||o.material||'').toLowerCase();
  const pal=cores[mat]||cores[mat.includes('pedra')?'pedra':'madeira'];
  if(kind==='chao'||o.camada===1&&kind!=='escada'){
   face([V(x,y,.015),V(x+w,y,.015),V(x+w,y+h,.015),V(x,y+h,.015)],
    kind==='chao'?(mat.includes('pedra')?'#a09d90':pal[4]):'#b9b3a3',null);
  }else if(kind==='parede'||kind==='mureta'){
   const altura=normal(o.alturaParedeM,kind==='mureta'?.9:2.7);
   caixa(x,y,0,w,h,altura,pal);
  }else if(kind==='porta'||kind==='janela'){
   const altura=kind==='porta'?2.2:1.05;
   const base=kind==='porta'?0:1.05;
   const cor=kind==='porta'?'#593a2b':'#79b4c5';
   const acc=kind==='porta'?'#a77c50':'#d0e5ea';
   // Portas e janelas são painéis verticais inseridos na espessura
   // da parede. Não erguemos um segundo bloco maciço sobre a parede.
   const vertical=w>=h;
   if(vertical){
    const yy=y+h/2;
    face([V(x,yy,base),V(x+w,yy,base),V(x+w,yy,base+altura),V(x,yy,base+altura)],cor,acc);
    if(kind==='janela')face([V(x+w*.5,yy-.012,base),V(x+w*.5,yy-.012,base+altura),V(x+w*.5+.035,yy-.012,base+altura),V(x+w*.5+.035,yy-.012,base)],'#dbeaf0',null);
   }else{
    const xx=x+w/2;
    face([V(xx,y,base),V(xx,y+h,base),V(xx,y+h,base+altura),V(xx,y,base+altura)],cor,acc);
    if(kind==='janela')face([V(xx-.012,y+h*.5,base),V(xx-.012,y+h*.5,base+altura),V(xx-.012,y+h*.5+.035,base+altura),V(xx-.012,y+h*.5+.035,base)],'#dbeaf0',null);
   }
  }else if(kind==='teto'||o.tetoV139){
   caixa(x,y,2.7,w,h,.38,['#94543d','#784535','#ac7357','#7b4837','#975d41']);
  }else if(kind==='escada'){
   caixa(x,y,0,w,h,.35,pal);
  }else if(o.camada>=2&&w<=6&&h<=6){
   caixa(x,y,0,w,h,Math.min(2,Math.max(.35,normal(o.alturaObjetoM,.75))),pal);
  }else continue;
  visiveis++;
 }
 return true; // Cena identificada, mesmo que alguns objetos não tenham equivalente 3D.
}

export function instalarLaboratorio25D({root=document,win=window,host,cenaAtual=()=>null,dimensoes=()=>({W:28,H:14}),mapaAtual=()=>'',ativo=()=>false,modo=()=>'',mapa=()=>'',idMapa=''}={}){
 if(!host)return {atualizar(){},destruir(){}};
 const painel=root.createElement('div');painel.id='mtmLab25D';
 painel.style.cssText='position:relative;width:100%;min-height:580px;height:min(78dvh,900px);overflow:hidden;border:1px solid #516a79;border-radius:12px;background:#a6c2ce;touch-action:none';
 const canvas=root.createElement('canvas');canvas.style.cssText='width:100%;height:100%;display:block;cursor:grab;touch-action:none';canvas.setAttribute('aria-label','Protótipo geométrico 2,5D: casa, rua e personagem');
 const help=root.createElement('div');help.style.cssText='position:absolute;left:12px;top:10px;z-index:2;padding:6px 9px;border-radius:7px;background:#0c1b2dda;color:#e8f5ff;font:12px Segoe UI,Arial,sans-serif;pointer-events:none';help.textContent='Laboratório geométrico 2,5D · arraste para girar · roda para aproximar · não edita objetos';
 painel.append(canvas,help);host.prepend(painel);
 const tools=root.createElement('div');
 tools.style.cssText='position:absolute;right:10px;top:10px;z-index:3;display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end';
 const reset=root.createElement('button');reset.type='button';reset.textContent='⌖ Reenquadrar';
 reset.title='Voltar ao ângulo e ao centro recomendados para este modo';
 reset.style.cssText='background:#102339e8;border:1px solid #5c748f;color:#e4f1fd;border-radius:7px;padding:6px 9px;cursor:pointer;font:12px Segoe UI,Arial,sans-serif';
 tools.append(reset);painel.append(tools);
 const ctx=canvas.getContext('2d');let yaw=-.65,pitch=.62,zoom=1.0,raf=0,drag=null,ultimoModo='',personagem=[18,13,0],selecionado='',modoAtual='mapa-construtor',centroCamera=[14,9],ultimoTokenPos='',ultimoMapaV230='';
 const lerTokens=()=>{
  const b=root.getElementById('novaSyncBoard'),d=dimensoes(),W=Number(d?.W)||28,H=Number(d?.H)||14;
  return [...(b?.querySelectorAll('[data-token]')||[])].map(el=>({
   id:el.dataset.token,x:parseFloat(el.style.left)*W/100,y:parseFloat(el.style.top)*H/100
  })).filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y));
 };
 const dimValidas=()=>{const d=dimensoes();return {W:Number(d?.W)||28,H:Number(d?.H)||14};};
 const selecionarToken=()=>{const list=lerTokens();return list.find(t=>t.id===selecionado)||list[0]||null;};
 // Centraliza no conteúdo construído, evitando que casas pequenas fiquem
 // perdidas num campo vazio muito grande. Não altera objetos nem coordenadas.
 function enquadramentoCena(){
  const d=dimValidas(),c=cenaAtual(),objs=Array.isArray(c?.objects)?c.objects:[];
  const validos=objs.filter(o=>o&&!o.destruido&&!o.invisivelV161&&
   !['chao','teto'].includes(String(o.oficina3||o.parteV177||'').toLowerCase())&&
   Number.isFinite(Number(o.x))&&Number.isFinite(Number(o.y))&&
   Number(o.larguraM)>0&&Number(o.alturaM)>0);
  if(!validos.length)return {cx:d.W/2,cy:d.H/2,zoom:1};
  let minx=Infinity,maxx=-Infinity,miny=Infinity,maxy=-Infinity;
  for(const o of validos){
   const x=Number(o.x)*d.W/28,y=Number(o.y)*d.H/14,w=Number(o.larguraM),h=Number(o.alturaM);
   minx=Math.min(minx,x-w/2);maxx=Math.max(maxx,x+w/2);
   miny=Math.min(miny,y-h/2);maxy=Math.max(maxy,y+h/2);
  }
  return {cx:(minx+maxx)/2,cy:(miny+maxy)/2,
   zoom:clamp(Math.min(d.W/Math.max(9,(maxx-minx)*1.8),d.H/Math.max(8,(maxy-miny)*1.8)),.85,1.8)};
 }


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
  const dims=dimValidas();
  const center=orientar(V(centroCamera[0],centroCamera[1],0)),scale=Math.min(width/(dims.W*1.36),height/(dims.H*1.85))*zoom;
  const projetar=v=>{const q=orientar(v);return [width/2+(q[0]-center[0])*scale,height*.53+(q[1]-center[1])*scale];};
  const desenharPoligono=(vs,cor,borda)=>{ctx.beginPath();vs.forEach((v,i)=>{const [x,y]=projetar(v);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();ctx.fillStyle=cor;ctx.fill();if(borda){ctx.strokeStyle=borda;ctx.lineWidth=Math.max(.6,scale*.018);ctx.stroke();}};
  const cena=cenaAtual(),mid=String(mapaAtual()||''),real=!!(cena&&mid&&String(cena.mapId||'')===mid);
  if(real)montarCenaReal(cena,dims.W,dims.H);
  else{faces.length=0;face([V(0,0),V(dims.W,0),V(dims.W,dims.H),V(0,dims.H)],'#607b5a','#607b5a');}
  // O chão é a base do mundo: nunca deve ocultar paredes ou personagens.
  // Primeiro os planos horizontais baixos; depois as superfícies elevadas.
  // A ordenação completa de faces interseccionadas exige z-buffer, ainda pendente.
  const planos=faces.filter(f=>f.vs.every(v=>v[2]<=.03));
  const elevados=faces.filter(f=>!f.vs.every(v=>v[2]<=.03));
  const longePrimeiro=(a,b)=>a.vs.reduce((n,v)=>n+orientar(v)[2],0)/a.vs.length-b.vs.reduce((n,v)=>n+orientar(v)[2],0)/b.vs.length;
  planos.sort(longePrimeiro);elevados.sort(longePrimeiro);
  for(const f of planos)desenharPoligono(f.vs,f.cor,f.borda);
  for(const f of elevados)desenharPoligono(f.vs,f.cor,f.borda);
  // Renderizar todos os tokens presentes neste mapa, e não apenas o primeiro.
  const personagens=lerTokens();
  for(const t of personagens){
   const x=t.x,y=t.y,centro=projetar(V(x,y,0)),cabeca=projetar(V(x,y,1.65));
   const tamanho=Math.max(2,scale*.21),selected=t.id===selecionado;
   // Sombras, botas e torso usam as mesmas unidades de comprimento do mundo.
   ctx.fillStyle='rgba(20,29,33,.28)';
   ctx.beginPath();ctx.ellipse(centro[0]+scale*.13,centro[1]+scale*.08,scale*.36,scale*.17,0,0,Math.PI*2);ctx.fill();
   const ponto=z=>projetar(V(x,y,z));
   const quadril=ponto(.78),ombros=ponto(1.40),pe=ponto(.07);
   ctx.lineCap='round';ctx.lineJoin='round';
   ctx.strokeStyle='#273b51';ctx.lineWidth=Math.max(2,scale*.11);
   ctx.beginPath();ctx.moveTo(quadril[0]-scale*.10,quadril[1]);ctx.lineTo(pe[0]-scale*.14,pe[1]);ctx.moveTo(quadril[0]+scale*.10,quadril[1]);ctx.lineTo(pe[0]+scale*.14,pe[1]);ctx.stroke();
   ctx.strokeStyle=selected?'#b58b39':'#347b9e';ctx.lineWidth=Math.max(5,scale*.35);
   ctx.beginPath();ctx.moveTo(quadril[0],quadril[1]);ctx.lineTo(ombros[0],ombros[1]);ctx.stroke();
   ctx.strokeStyle='#d6a780';ctx.lineWidth=Math.max(2,scale*.105);
   ctx.beginPath();ctx.moveTo(ombros[0]-scale*.20,ombros[1]);ctx.lineTo(quadril[0]-scale*.24,quadril[1]);
   ctx.moveTo(ombros[0]+scale*.20,ombros[1]);ctx.lineTo(quadril[0]+scale*.24,quadril[1]);ctx.stroke();
   ctx.fillStyle='#edc29a';ctx.beginPath();ctx.arc(cabeca[0],cabeca[1]+scale*.08,tamanho,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#564536';ctx.beginPath();ctx.arc(cabeca[0],cabeca[1]+scale*.03,tamanho,Math.PI,Math.PI*1.97);ctx.fill();
   if(selected){ctx.strokeStyle='#f4d27e';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(centro[0],centro[1],scale*.4,scale*.16,0,0,Math.PI*2);ctx.stroke();}
  }
  ctx.fillStyle='#102235bb';ctx.fillRect(10,height-29,Math.min(570,width-20),22);ctx.fillStyle='#edf7ff';ctx.font='12px Segoe UI,Arial';ctx.fillText(real?'Cena compartilhada · objetos reais em visualização 2,5D experimental':'Mapa sem cena 3D carregada · abra uma cena no Construtor',18,height-14);
 }
 const invalidate=()=>{if(!raf)raf=win.requestAnimationFrame(pintar);};
 canvas.addEventListener('pointerdown',e=>{if(modoAtual==='mapa-jogo')return;drag={x:e.clientX,y:e.clientY,id:e.pointerId,pan:e.shiftKey||e.button===2};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});
 canvas.addEventListener('contextmenu',e=>{if(modoAtual!=='mapa-jogo')e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{
  if(modoAtual==='mapa-jogo'||!drag||e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(drag.pan){
   const r=canvas.getBoundingClientRect(),d=dimValidas();
   const factor=Math.min(r.width/(d.W*1.36),r.height/(d.H*1.85))*zoom||1;
   const horiz=dx/factor,vert=dy/(factor*Math.max(.2,Math.sin(pitch)));
   // Reverter a projeção horizontal para mover a câmera no plano do terreno.
   const c=Math.cos(yaw),sn=Math.sin(yaw);
   centroCamera[0]-=horiz*c+vert*sn;
   centroCamera[1]-=-horiz*sn+vert*c;
  }else{
   yaw+=dx*.007;
   pitch=clamp(pitch+dy*.005,.16,1.56);
  }
  drag.x=e.clientX;drag.y=e.clientY;invalidate();
 });
 const stop=e=>{if(drag&&e.pointerId===drag.id){drag=null;canvas.style.cursor='grab';}};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
 canvas.addEventListener('wheel',e=>{if(modoAtual==='mapa-jogo')return;e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.7,3);invalidate();},{passive:false});
 const resize=typeof ResizeObserver!=='undefined'?new ResizeObserver(invalidate):null;resize?.observe(painel);
 const reenquadrar=()=>{
  const enq=enquadramentoCena(),t=selecionarToken();
  if(modoAtual==='mapa-construtor'){
   yaw=CONSTRUTOR_YAW;pitch=CONSTRUTOR_PITCH;zoom=1.05*enq.zoom;
   centroCamera=[enq.cx,enq.cy];
  }else if(modoAtual==='mapa-mestre'){
   yaw=MESTRE_YAW;pitch=MESTRE_PITCH;zoom=enq.zoom;
   centroCamera=[enq.cx,enq.cy];
  }else{
   yaw=JOGO_YAW;pitch=JOGO_PITCH;zoom=JOGO_ZOOM*enq.zoom;
   centroCamera=t?[t.x,t.y]:[enq.cx,enq.cy];
  }
  invalidate();
 };
 reset.addEventListener('click',reenquadrar);
 const acompanhamento=win.setInterval(()=>{
  if(painel.hidden)return;
  if(modoAtual!=='mapa-jogo'){invalidate();return;}
  const t=selecionarToken();
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
  const idAtual=String(mapaAtual()||''),cena=enquadramentoCena();
  const cenaInfo=cena.cx.toFixed(2)+':'+cena.cy.toFixed(2)+':'+cena.zoom.toFixed(2);
  const mapaMudou=(idAtual+'|'+cenaInfo)!==ultimoMapaV230;
  if(mapaMudou){ultimoMapaV230=idAtual+'|'+cenaInfo;}
  if(modo==='mapa-jogo'&&tokenMudou){const t=lerTokens().find(t=>t.id===token);if(t)centroCamera=[t.x,t.y];}
  if(mudou||mapaMudou){
   drag=null;
   const d=dimValidas(),enq=enquadramentoCena();
   centroCamera=[enq.cx,enq.cy];
   reenquadrar();
  }
  canvas.style.cursor=modo==='mapa-jogo'?'default':'grab';
  canvas.style.touchAction=modo==='mapa-jogo'?'auto':'none';
  reset.hidden=modo==='mapa-jogo';
  help.textContent=modo==='mapa-construtor'
   ?'CONSTRUTOR · arrastar: girar · Shift+arrastar: deslocar · roda: zoom · edição pelo mapa funcional'
   :modo==='mapa-mestre'
   ?'MESTRE · arrastar: girar · Shift+arrastar: deslocar · roda: zoom'
   :'JOGO · estilo isométrico clássico · norte fixo · acompanha personagem · rotação e zoom bloqueados';
  painel.hidden=!visivel;painel.style.display=visivel?'block':'none';
  if(visivel&&(mudou||mapaMudou||tokenMudou||!raf))invalidate();
 },destruir(){win.clearInterval(acompanhamento);resize?.disconnect();if(raf)win.cancelAnimationFrame(raf);painel.remove();}};
}
