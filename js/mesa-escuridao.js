// Mesa Estelar v205 — Subsolo escuro de verdade: sem luz natural no interior fechado, mesmo de dia.
// A visão de quem está num nível subterrâneo (elevação < 0) é a luz que existe: fontes acesas, lanterna/tocha/espada de energia EMPUNHADAS (letras L/T/N do equipamento
// gravadas no token) e a claridade que entra por uma abertura real (escada, rampa, poço com luzEntradaV205). Toda luz é cortada por paredes/rochas/portas fechadas do MESMO nível
// (raios contra os retângulos), então nada ilumina através de parede, rocha ou teto. Fora da luz é preto (a ficha, os botões e o resto da tela continuam normais: o preto só cobre o mapa).
// É só visão desta tela: não grava nada. Quem está na superfície (ou outro nível) não ganha visão do subsolo (a cobertura já esconde o nível errado).
import {lerVisual} from './mesa-arte3d.js?v=200';
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const RAIO_LANTERNA=9,RAIO_TOCHA=6.5,RAIO_ESPADA=2.6,RAIO_BRASEIRO=4.2,RAIO_LAMPIAO=7,ABERTURA_LANTERNA=Math.PI*.42;
const decod=id=>{let d=String(id||'');try{d=decodeURIComponent(d);}catch(_){}return d;};
/** o que o token empunha que dá luz (letras L lanterna · T tocha · N espada de energia em visualV203.z) */
export function luzDoToken(t){const z=lerVisual(t?.visualV203,decod(t?.id)).z||'';return {lanterna:z.includes('L'),tocha:z.includes('T'),energia:z.includes('N')};}
const andarDe=o=>Math.max(1,Number(o?.andarV144??1)||1);
const noNivel=(o,nivel)=>!!o&&(andarDe(o)===nivel||!!o.andarAmbosV144);
/** objeto que é fonte de luz ACESA (lâmpada ligada, braseiro/fogueira/tocha de parede acesos). Estado em estadoInterativo.ligado ou queimando. */
export function luzDoObjeto(o){
 const t=sem((o?.nome||'')+' '+(o?.idBanco||''));
 if(/lampiao|lampada|luminaria|abajur|farol/.test(t)){const lig=o?.estadoInterativo?.ligado;return lig?{raio:RAIO_LAMPIAO,cor:'#ffe2a8'}:null;}
 if(/braseiro|fogueira|tocha|lareira/.test(t)&&!o?.estadoInterativo?.apagado&&!o?.destruido)return {raio:RAIO_BRASEIRO,cor:'#ffb060',tremula:true};
 return null;
}
/** fontes de luz de um nível (função pura). tokens: {x,y,id,visualV203,facing?,nivel}; objs: objetos da cena; W,H em metros */
export function fontesDeLuz({tokens=[],objs=[],nivel=1,W=28,H=14,rumo=()=>Math.PI}={}){
 const f=[],m=p=>({x:Number(p.x)*W/28,y:Number(p.y)*H/14});
 for(const o of objs){
  if(!noNivel(o,nivel))continue;
  const l=luzDoObjeto(o);if(l)f.push({...m(o),...l,tipo:'objeto',id:o.id,forca:1});
  if(o.luzEntradaV205&&o.ligaAndaresV205?.includes(nivel))f.push({...m(o),raio:Number(o.luzEntradaV205.raio)||3.4,cor:'#fff6d8',tipo:'entrada',id:o.id,forca:.7,decai:true});
 }
 for(const t of tokens){
  if((t.nivel??1)!==nivel)continue;const l=luzDoToken(t),p=m(t);
  if(l.lanterna)f.push({...p,raio:RAIO_LANTERNA,cor:'#fff0c8',tipo:'lanterna',id:t.id,forca:1,cone:{ang:rumo(t),abertura:ABERTURA_LANTERNA},halo:1.6});
  if(l.tocha)f.push({...p,raio:RAIO_TOCHA,cor:'#ffb060',tipo:'tocha',id:t.id,forca:1,tremula:true});
  if(l.energia)f.push({...p,raio:RAIO_ESPADA,cor:'#9fd8ff',tipo:'energia',id:t.id,forca:.9});
 }
 return f;
}
/** segmentos que bloqueiam luz neste nível: bordas dos sólidos (parede, rocha, porta fechada, objeto que bloqueia movimento) */
export function segmentosDeBloqueio(objs=[],nivel=1,W=28,H=14){
 const S=[];
 for(const o of objs){
  if(!o||o.destruido||!noNivel(o,nivel)||!o.bloqueiaMovimento||o.invisivelV161)continue;
  const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1;if(w*h>400)continue; // chão/maciço gigante do mapa não é parede
  const cx=Number(o.x)*W/28,cy=Number(o.y)*H/14,a=(Number(o.angulo)||0)*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);
  const p=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>({x:cx+x*ca-y*sa,y:cy+x*sa+y*ca}));
  for(let i=0;i<4;i++)S.push([p[i],p[(i+1)%4],String(o.id)]);
 }
 return S;
}
/** polígono de visão: do ponto o, raios a cada passo contra os segmentos, cortados em `raio` */
export function poligonoDeVisao(o,raio,segs,passos=96,cone=null,ignorarId=''){
 const pts=[];
 for(let i=0;i<passos;i++){
  const a=cone?cone.ang-cone.abertura+(2*cone.abertura)*i/(passos-1):i/passos*Math.PI*2,dx=Math.cos(a),dy=Math.sin(a);let d=raio;
  for(const [p,q,dono] of segs){
   if(ignorarId&&dono===ignorarId)continue; // a fonte não bloqueia a própria luz (braseiro, lampião)
   const ex=q.x-p.x,ey=q.y-p.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;
   const t=((p.x-o.x)*ey-(p.y-o.y)*ex)/den,u=((p.x-o.x)*dy-(p.y-o.y)*dx)/den;
   if(t>.02&&t<d&&u>=0&&u<=1)d=t;
  }
  pts.push({x:o.x+dx*d,y:o.y+dy*d});
 }
 return pts;
}
export function instalarEscuridao({controller,root=document}={}){
 const win=root.defaultView||window,ctl=()=>{try{return controller?.()||null;}catch(_){return null;}};
 let cv=null,g=null,t0=performance.now(),ligada=false;
 const nivelVisto=()=>{try{return Number(win.mesaAndarV144?.visto?.())||1;}catch(_){return 1;}};
 const elevVista=()=>{try{return Number(win.mesaAndarV144?.elevacaoVista?.())||0;}catch(_){return 0;}};
 const sou=()=>{try{return !!ctl()?.mestre?.();}catch(_){return false;}};
 function pegaCanvas(){
  const b=root.getElementById('novaSyncBoard'),sc=b?.parentElement;if(!b||!sc)return null;
  if(!cv||cv.parentElement!==sc){cv?.remove();cv=root.createElement('canvas');cv.id='esCamada';cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:36';sc.append(cv);g=cv.getContext('2d');}
  const w=Math.max(160,Math.round(sc.clientWidth/3)),h=Math.max(120,Math.round(sc.clientHeight/3));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  return {b,sc};
 }
 function desenhar(){
  const nivel=nivelVisto(),sub=elevVista()<0;
  if(!sub){if(ligada&&cv){cv.style.display='none';ligada=false;}return;}
  const ctx=pegaCanvas();if(!ctx)return;ligada=true;cv.style.display='';
  const c=ctl(),cena=c?.cenaAtual?.(),objs=cena?.objects||[],dm=c?.dimsAtual?.()||{W:28,H:14},{W,H}=dm;
  const arte=win.mesaArte3dV200?._estado?.();
  const toks=(c?.tokensNoMapa?.()||[]).map(t=>({...t,nivel:(()=>{try{return Number(win.mesaAndarV144?.doToken?.(t.id))||1;}catch(_){return 1;}})()}));
  const rumo=t=>{const s=arte?.get?.(t.id);return s&&Number.isFinite(s.ang)?s.ang:Math.PI;};
  const fontes=fontesDeLuz({tokens:toks,objs,nivel,W,H,rumo}),segs=segmentosDeBloqueio(objs,nivel,W,H);
  const br=ctx.b.getBoundingClientRect(),sr=ctx.sc.getBoundingClientRect(),esc=cv.width/sr.width;
  // metros → pixel do canvas
  const px=(x)=>(br.left-sr.left+x/W*br.width)*esc,py=(y)=>(br.top-sr.top+y/H*br.height)*esc,rpx=r=>r/W*br.width*esc;
  const t=(performance.now()-t0)/1000;
  g.globalCompositeOperation='source-over';g.clearRect(0,0,cv.width,cv.height);
  g.fillStyle=sou()?'rgba(0,0,0,.55)':'#000';g.fillRect(0,0,cv.width,cv.height);   // sem luz = preto (o mestre enxerga um pouco para conduzir)
  g.globalCompositeOperation='destination-out';
  for(const f of fontes){
   const raio=f.raio*(f.tremula?1+.04*Math.sin(t*9+f.x):1),pol=poligonoDeVisao(f,raio,segs,f.cone?64:96,f.cone||null,f.tipo==='objeto'||f.tipo==='entrada'?String(f.id):'');
   const gr=g.createRadialGradient(px(f.x),py(f.y),0,px(f.x),py(f.y),rpx(raio));
   gr.addColorStop(0,'rgba(0,0,0,'+f.forca+')');gr.addColorStop(f.decai?.3:.72,'rgba(0,0,0,'+(f.forca*(f.decai?.5:.85))+')');gr.addColorStop(1,'rgba(0,0,0,0)');
   g.fillStyle=gr;g.beginPath();if(f.cone)g.moveTo(px(f.x),py(f.y));pol.forEach((p,i)=>{if(i===0&&!f.cone)g.moveTo(px(p.x),py(p.y));else g.lineTo(px(p.x),py(p.y));});g.closePath();g.fill();
   if(f.halo){const p2=poligonoDeVisao(f,f.halo,segs,32),gh=g.createRadialGradient(px(f.x),py(f.y),0,px(f.x),py(f.y),rpx(f.halo));gh.addColorStop(0,'rgba(0,0,0,.9)');gh.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gh;g.beginPath();p2.forEach((p,i)=>{if(i===0)g.moveTo(px(p.x),py(p.y));else g.lineTo(px(p.x),py(p.y));});g.closePath();g.fill();}
  }
  g.globalCompositeOperation='source-over';
  cv.dataset.fontes=String(fontes.length);
 }
 const iv=setInterval(()=>{try{if(root.hidden)return;desenhar();}catch(e){console.warn('[Escuridão]',e);}},100);iv.unref?.();
 const api={parar:()=>{clearInterval(iv);cv?.remove();},desenhar,ligada:()=>ligada,fontes:()=>{const c=ctl();return fontesDeLuz({tokens:(c?.tokensNoMapa?.()||[]).map(t=>({...t,nivel:Number(win.mesaAndarV144?.doToken?.(t.id))||1})),objs:c?.cenaAtual?.()?.objects||[],nivel:nivelVisto(),...(c?.dimsAtual?.()||{})});}};
 win.mesaEscuridaoV205=api;return api;
}
