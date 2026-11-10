import {pincelUrl as pincelUrlV203} from './mesa-pinceis.js?v=203';
import {publicarOficina,mapaComCenaOficina,validarTamanhoOficina} from './nova-oficina.js?v=201';
import {avancarFogo} from './nova-fogo.js?v=50';
import {restaurarObjeto} from './nova-dano-objetos.js?v=50';
import {camadaEntidade,ordenarCamadas} from './nova-camadas.js?v=48';
import {normalizarObjeto,criarObjeto,objetosDoMapa,prepararCena} from './nova-objetos.js?v=80';
import {diametroMiniatura,diametroVisual} from './nova-recuperacao.js?v=99';
import {descreverTeste} from './nova-regras.js?v=46';
import {textoDuracao,tempoRestante} from './nova-duracoes.js?v=46';
// Movimento livre: uma posição por personagem, sem sessão-mestre ou fila de comandos.
import {saldoMovimento,movimentoMaximo,moverNoTurno,iniciarIniciativa,acaoIniciativa,defesasRestantes} from './nova-turnos.js?v=46';
import {destinoSemColisao,conterTokenNoMapa,TOKEN_DIAMETER,raioParaObjetos} from './nova-colisao.js?v=120';
import {criarPainelAcoes} from './nova-painel.js?v=134';
import {emComa} from './nova-coma.js?v=134';
import {spriteDoToken} from './mesa-sprites-npc.js?v=199';
import {conectarAtaques,HEALTH_PATH,HISTORY_PATH} from './nova-ataques.js?v=208';
// v208: pathfinding do clique-para-mover (mesma IA de caminho do tempo real)
import {montarGrade,caminho} from './mesa-tempo-real-ia.js?v=133';
import {mostrarAtaque} from './nova-fx.js?v=46';
import {criarEditorMesa} from './nova-editor.js?v=203';
// v112: tamanhos reais das miniaturas (módulo à parte; sem ele, tudo fica com 1 m como antes).
let tamanhosV112=null;import('./mesa-tamanhos.js?v=134').then(m=>{tamanhosV112=m;}).catch(()=>{});
import {ocupado,atualizarDuracoes} from './nova-suporte.js?v=46';
export const POSITION_PATH='combatesAtivos/mapaMesaSyncDireta/posicoes';
export const MAP_PATH='combatesAtivos/mapaMesaSyncDireta';
export const SCENE_PATH='combatesAtivos/mapaMesaSyncDiretaCena';
/* v198: caverna desenhada em SVG — o contorno dos lados expostos balança para fora (ruído pelas coordenadas do MAPA, então peças
   vizinhas continuam o mesmo contorno); lados encostados em outra peça ficam retos e sem linha. */
function cavernaSvgV198(o,Wm,Hm){
 const rh=n=>{const t=Math.sin(n*127.1+311.7)*43758.5453;return t-Math.floor(t);};
 const nv=(t,s)=>{const i=Math.floor(t),f=t-i,u=f*f*(3-2*f);return rh(i+s*57.1)*(1-u)+rh(i+1+s*57.1)*u;};
 const ruido=(t,s)=>{const a=nv(t*1.6,s),b=nv(t*4.1,s+9);return Math.pow(a*.72+b*.28,1.15);};
 const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1,tm=Number(o.texturaM)||2,md=(a,b)=>((a%b)+b)%b;
 const px0=o.x/28*Wm-w/2,py0=o.y/14*Hm-h/2,fl=String(o.bordasV198||''),amp=.34,passo=.125;
 const arr=(x)=>+x.toFixed(3);
 const borda=(lado)=>{const p=[],n=Math.max(2,Math.ceil((lado==='t'||lado==='b'?w:h)/passo));
  for(let i=0;i<=n;i++){const u=i/n,exp=fl.includes(lado);
   if(lado==='t'){const x=w*u;p.push([x,exp?-amp*ruido(px0+x,py0*3.1+1):0]);}
   else if(lado==='b'){const x=w*(1-u);p.push([x,h+(exp?amp*ruido(px0+x,(py0+h)*3.1+2):0)]);}
   else if(lado==='r'){const y=h*u;p.push([w+(exp?amp*ruido(py0+y,(px0+w)*3.7+4):0),y]);}
   else{const y=h*(1-u);p.push([exp?-amp*ruido(py0+y,px0*3.7+3):0,y]);}}
  return p;};
 const L={t:borda('t'),r:borda('r'),b:borda('b'),l:borda('l')};
 const pol=[...L.t,...L.r,...L.b,...L.l].map(q=>arr(q[0])+','+arr(q[1])).join(' ');
 const tr=['t','r','b','l'].filter(k=>fl.includes(k)).map(k=>'M'+L[k].map(q=>arr(q[0])+' '+arr(q[1])).join(' L')).join(' ');
 const id='cv'+String(o.id).replace(/[^a-zA-Z0-9_-]/g,'_');
 return '<svg viewBox="0 0 '+arr(w)+' '+arr(h)+'" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible"><defs><pattern id="'+id+'" patternUnits="userSpaceOnUse" x="'+arr(-md(px0,tm))+'" y="'+arr(-md(py0,tm))+'" width="'+tm+'" height="'+tm+'"><image href="'+String(o.textura).replace(/"/g,'%22')+'" width="'+tm+'" height="'+tm+'" preserveAspectRatio="none"/></pattern></defs><polygon points="'+pol+'" fill="url(#'+id+')"/>'+(tr?'<path d="'+tr+'" fill="none" stroke="'+(o.borda||'#2a2622')+'" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>':'')+'</svg>';
}


/* v201: massa orgânica (caverna natural, cordilheira): UM caminho suave com a textura do mapa, sombra projetada, sombra e luz na beirada (relevo) e contorno escuro.
   o.lacosV201 = caminho SVG em metros relativo ao canto da peça (vários laços: o miolo é buraco, evenodd). erTipo 'macico' = rocha (por cima), 'macicoTopo' = topo plano elevado (mais claro, sem sombra projetada). */
/* setas de subida/descida da rampa de rocha: três ângulos (chevrons) apontando para dentro da cordilheira */
function setasV201(o,w,h,a){return ''; /* v205: sem setas de subida/descida: toda rampa e escada sobe ou desce conforme o lado de onde se entra */ const s=o.setasV201;if(!s)return '';const L=Math.hypot(s.dx,s.dy)||1,ux=s.dx/L,uy=s.dy/L,px=-uy,py=ux,cx=w/2,cy=h/2,n=Math.max(2,Math.min(4,Math.round(Math.max(w,h)/1.4)));let m='';
 for(let i=0;i<n;i++){const t=(i-(n-1)/2)*Math.min(.9,Math.max(w,h)/(n+1)),bx=cx+ux*t,by=cy+uy*t,k=Math.min(.35,Math.min(w,h)*.22);m+='<polyline points="'+a(bx-ux*k*.6+px*k)+','+a(by-uy*k*.6+py*k)+' '+a(bx+ux*k*.6)+','+a(by+uy*k*.6)+' '+a(bx-ux*k*.6-px*k)+','+a(by-uy*k*.6-py*k)+'" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';}
 return m;}
/* v205: transições ORGÂNICAS — terrenos planos (grama, areia, pântano, terra) e as águas (rasa → funda) esmaecem para dentro da própria borda em vez de terminar num recorte duro; a rocha e a lava ficam nítidas. Largura do esmaecido em metros. */
function suavizacaoV205(o){
 if(globalThis.__SEM_SUAVIZAR_V205)return 0;
 const p=String(o.erPoca||'');
 if(p==='agua_profunda')return 1.3;if(p==='agua_pantano')return .9;if(p==='agua'||p==='agua_rasa')return .7;if(p.startsWith('lava'))return 0;
 if(o.erTipo!=='macicoTopo')return 0;
 const t=String(o.erTex||o.texturaId||o.textura||'').toLowerCase();
 if(/grama|mato|relva/.test(t))return .9;if(/areia|praia|duna/.test(t))return .7;if(/terra|barro|lama|pantano|musgo/.test(t))return .8;if(/vulc|rocha|pedra|cascalho/.test(t))return .35;return .5;
}
/* v205: TOPO DE ROCHA orgânico (teto de caverna/gruta): em cima da textura de rocha, blocos arredondados com luz e sombra, rachaduras, musgo nas beiradas e uma borda escurecida — nada de "telhado de pedras" liso. Tudo calculado do id da peça (não muda a cada desenho). */
function reliefRochaV205(o,w,h,id,a){
 let sd=0;for(const ch of String(o.id))sd=(sd*31+ch.charCodeAt(0))%2147483647;const R=()=>{sd=(sd*48271)%2147483647;return sd/2147483647;};
 const area=w*h,nBlocos=Math.max(8,Math.min(60,Math.round(area/9)));let m='<defs><radialGradient id="'+id+'mg"><stop offset="0" stop-color="#5f8f3a" stop-opacity=".55"/><stop offset=".6" stop-color="#5f8f3a" stop-opacity=".25"/><stop offset="1" stop-color="#5f8f3a" stop-opacity="0"/></radialGradient>'
  +'<radialGradient id="'+id+'lz" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient></defs><g clip-path="url(#'+id+'c)">';
 // sombra larga e suave no miolo mais baixo: o topo parece abaulado (mais claro no centro, mais escuro na beirada)
 m+='<rect x="-2" y="-2" width="'+a(w+4)+'" height="'+a(h+4)+'" fill="url(#'+id+'dm)" />';
 for(let i=0;i<nBlocos;i++){const bw=1.0+R()*2.2,x=R()*w,y=R()*h,rot=R()*6.28,nv=6+Math.floor(R()*3),P=[];for(let k=0;k<nv;k++){const t=rot+k/nv*6.2832,r=bw/2*(.72+R()*.5);P.push([x+Math.cos(t)*r,y+Math.sin(t)*r*.8]);}
  const pt=q=>a(q[0])+','+a(q[1]),c=[x+.03,y+.03],luz=[P[0],P[1],P[2],P[3]].concat([c]).map(pt).join(' '),som=[P[3],P[4],P[5],P[nv-1],P[0],c].map(pt).join(' ');
  m+='<polygon points="'+P.map(pt).join(' ')+'" fill="#000" opacity=".22" transform="translate(.08 .13)"/><polygon points="'+P.map(pt).join(' ')+'" fill="#d8c9a8" fill-opacity=".10" stroke="#120e0a" stroke-opacity=".34" stroke-width=".05" stroke-linejoin="round"/><polygon points="'+luz+'" fill="#fff" fill-opacity=".14"/><polygon points="'+som+'" fill="#000" fill-opacity=".2"/>';}
 // rachaduras: caminhos tortos e finos
 for(let i=0;i<Math.max(4,Math.round(area/26));i++){let x=R()*w,y=R()*h,ang=R()*6.28,d='M'+a(x)+' '+a(y);const n=4+Math.floor(R()*5);for(let k=0;k<n;k++){ang+=(R()-.5)*1.1;x+=Math.cos(ang)*(.35+R()*.55);y+=Math.sin(ang)*(.35+R()*.55);d+=' L'+a(x)+' '+a(y);}
  m+='<path d="'+d+'" fill="none" stroke="#0c0906" stroke-opacity=".5" stroke-width="'+a(.05+R()*.05)+'" stroke-linecap="round" stroke-linejoin="round"/>';}
 // musgo: manchas verdes macias, mais perto da borda (onde pega umidade)
 for(let i=0;i<Math.max(5,Math.round(area/14));i++){const edge=R()<.6,x=edge?(R()<.5?R()*.18:1-R()*.18)*w:R()*w,y=edge?R()*h:R()*h,rx=.5+R()*1.1;
  m+='<ellipse cx="'+a(x)+'" cy="'+a(y)+'" rx="'+a(rx*1.3)+'" ry="'+a(rx*1.3*(.5+R()*.5))+'" fill="url(#'+id+'mg)" opacity="'+a(.6+R()*.4)+'"/>';}
 // borda escurecida por dentro (a rocha desce e some na sombra)
 m+='</g>';
 return m;
}
function macicoSvgV201(o,Wm,Hm){
 const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1,tm=Number(o.texturaM)||3,md=(a,b)=>((a%b)+b)%b,a=x=>+x.toFixed(3);
 const px0=o.x/28*Wm-w/2,py0=o.y/14*Hm-h/2,topo=o.erTipo==='macicoTopo',d=String(o.lacosV201||'').replace(/"/g,'');
 const id='mz'+String(o.id).replace(/[^a-zA-Z0-9_-]/g,'_'),c=(!o.borda||/^#1a1612$/i.test(o.borda))?'#3b2a1c':o.borda,fe=suavizacaoV205(o); /* v205: contorno marrom-escuro fino, não preto grosso */
 return '<svg viewBox="0 0 '+a(w)+' '+a(h)+'" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible"><defs>'
  +'<pattern id="'+id+'" patternUnits="userSpaceOnUse" x="'+a(-md(px0,tm))+'" y="'+a(-md(py0,tm))+'" width="'+tm+'" height="'+tm+'"><image href="'+String(o.textura||'').replace(/"/g,'%22')+'" width="'+tm+'" height="'+tm+'" preserveAspectRatio="none"/></pattern>'
  +(o.rochaOrganicaV205?'<radialGradient id="'+id+'dm" cx=".5" cy=".46" r=".62"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".7" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></radialGradient>':'')
  +'<clipPath id="'+id+'c"><path d="'+d+'" clip-rule="evenodd"/></clipPath><filter id="'+id+'f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation=".14"/></filter><filter id="'+id+'fs" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".32"/></filter>'+(fe>0?'<filter id="'+id+'ft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="'+a(fe/2)+'" result="b"/><feComposite in="SourceGraphic" in2="b" operator="in"/></filter>':'')+'</defs>'
  +(topo?'':'<path d="'+d+'" fill-rule="evenodd" fill="#000" opacity=".38" transform="translate(.3 .46)" filter="url(#'+id+'fs)"/>')
  +'<path d="'+d+'" fill-rule="evenodd" fill="url(#'+id+')"'+(fe>0?' filter="url(#'+id+'ft)"':'')+(o.erPoca==='agua_profunda'?' opacity=".78"':'')+'/>'
  +(topo?'':'<g clip-path="url(#'+id+'c)"><path d="'+d+'" fill="none" stroke="#000" stroke-opacity="'+(topo?.07:.22)+'" stroke-width="'+(topo?.4:.5)+'" stroke-linejoin="round"/>'
  +'<path d="'+d+'" fill="none" stroke="#fff" stroke-opacity="'+(topo?.16:.12)+'" stroke-width=".16" transform="translate(-.06 -.07)" stroke-linejoin="round"/></g>')
  +(o.rochaOrganicaV205?reliefRochaV205(o,w,h,id,a):'')
  +(o.tintaV205?'<path d="'+d+'" fill-rule="evenodd" fill="'+String(o.tintaV205).replace(/"/g,'')+'" filter="url(#'+id+'ft)"/>':'')
  +(fe>0?'':'<path d="'+d+'" fill-rule="evenodd" fill="none" stroke="'+c+'" stroke-opacity="'+(topo?.2:.28)+'" stroke-width="'+(topo?.6:.7)+'" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>')+setasV201(o,w,h,a)+'</svg>';
}

/* v198: escada (degraus com quina clara e sombra) e rampa (plano inclinado com setas), vistas de cima; corrimãos nas duas laterais */
function escadaSvgV198(o){
 const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1,hor=w>=h,L=hor?w:h,S=hor?h:w,tm=Number(o.texturaM)||.6,a=x=>+x.toFixed(3);
 const P=(al,ac,la,lc)=>hor?{x:al,y:ac,w:la,h:lc}:{x:ac,y:al,w:lc,h:la};
 const R=(q,fill,extra='')=>'<rect x="'+a(q.x)+'" y="'+a(q.y)+'" width="'+a(q.w)+'" height="'+a(q.h)+'" fill="'+fill+'" '+extra+'/>';
 const id='es'+String(o.id).replace(/[^a-zA-Z0-9_-]/g,'_'),rampa=o.erTipo==='rampa';let m='';
 m+='<defs><pattern id="'+id+'" patternUnits="userSpaceOnUse" x="0" y="0" width="'+tm+'" height="'+tm+'"><image href="'+String(o.textura).replace(/"/g,'%22')+'" width="'+tm+'" height="'+tm+'" preserveAspectRatio="none"/></pattern>'
  +'<linearGradient id="'+id+'g" x1="'+(hor?0:0)+'" y1="0" x2="'+(hor?1:0)+'" y2="'+(hor?0:1)+'"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>';
 m+=R(P(0,0,L,S),'url(#'+id+')');
 if(rampa){
  m+=R(P(0,0,L,S),'url(#'+id+'g)');
  /* v205: sem setas: toda rampa e escada sobe ou desce conforme o lado de onde se entra */
  const nr=Math.max(3,Math.round(L/.5));for(let i=1;i<nr;i++)m+=R(P(i*L/nr,0,.025,S),'rgba(0,0,0,.18)');
 }else{
  const n=Math.max(3,Math.round(L/.38)),sl=L/n;
  for(let i=0;i<n;i++){const x0=i*sl;
   m+=R(P(x0,0,sl,S),'rgba(0,0,0,.08)');                          /* v205: sem escurecimento direcional */
   m+=R(P(x0+.07,0,sl-.07,S),'rgba(255,255,255,.10)');          /* piso do degrau */
   m+=R(P(x0,0,.07,S),'rgba(0,0,0,.6)');                          /* espelho (sombra) */
   m+=R(P(x0+.07,0,.035,S),'rgba(255,255,255,.4)');}              /* quina clara */
 }
 const rl=Math.min(.09,S*.18);m+=R(P(0,0,L,rl),'#2a2622','opacity=".9"')+R(P(0,S-rl,L,rl),'#2a2622','opacity=".9"');
 m+='<rect x="0" y="0" width="'+a(w)+'" height="'+a(h)+'" fill="none" stroke="#1a1612" stroke-width="2" vector-effect="non-scaling-stroke"/>';
 return '<svg viewBox="0 0 '+a(w)+' '+a(h)+'" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible">'+m+'</svg>';
}

/* v198: poça = mancha arredondada e irregular (oval com bordas onduladas) preenchida pela textura do mapa; nunca um quadrado */
function pocaSvgV198(o,Wm,Hm){
 const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1,tm=Number(o.texturaM)||3,md=(a,b)=>((a%b)+b)%b,a=x=>+x.toFixed(3);
 const px0=o.x/28*Wm-w/2,py0=o.y/14*Hm-h/2;let sd=0;for(const ch of String(o.id))sd=(sd*31+ch.charCodeAt(0))%9973;
 const f=(k)=>((Math.sin(sd*12.9898+k*78.233)*43758.5453)%1+1)%1*6.2832;
 const pts=[],N=56;for(let i=0;i<N;i++){const t=i/N*6.2832;
  const r=.86*(1+.09*Math.sin(2*t+f(1))+.07*Math.sin(3*t+f(2))+.05*Math.sin(5*t+f(3))+.035*Math.sin(7*t+f(4)));
  pts.push(a(w/2+Math.cos(t)*w/2*r)+','+a(h/2+Math.sin(t)*h/2*r));}
 const id='pc'+String(o.id).replace(/[^a-zA-Z0-9_-]/g,'_'),lava=String(o.erPoca||'').startsWith('lava');
 return '<svg viewBox="0 0 '+a(w)+' '+a(h)+'" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible'+(lava?';filter:drop-shadow(0 0 5px #ff7a1a)':'')+'"><defs><pattern id="'+id+'" patternUnits="userSpaceOnUse" x="'+a(-md(px0,tm))+'" y="'+a(-md(py0,tm))+'" width="'+tm+'" height="'+tm+'"><image href="'+String(o.textura).replace(/"/g,'%22')+'" width="'+tm+'" height="'+tm+'" preserveAspectRatio="none"/></pattern></defs><polygon points="'+pts.join(' ')+'" fill="url(#'+id+')" stroke="rgba(0,0,0,.35)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
}

export function mountDirectPositionLab({user,characters,workshop=null,renderSceneObject=()=>'',activeCharacter=()=>null,viewActor=()=>'',groupLocation=()=>({}),catalog=characters,mapas=()=>[],loadMap=async()=>null,renderMap=()=>'',loadProp=async o=>o,loadActions=async()=>({skills:[]}),prepareAttack=null,prepareSupport=null,prepareFire=async()=>()=>[],restoreHealth=async()=>({}),playAttackSound=()=>{},unlockSound=()=>{},rollTest=()=>({die:0,grau:'Indisponível'}),loadCombatants=async()=>{throw new Error('Não foi possível carregar as fichas');},database,root=document}) {
 const el=id=>root.getElementById(id), displayName=t=>String((globalThis.mesaNomeVisivelV141?.(t))??t?.nome??'').replace(/^(NPC|Monstro|PJ|PM|Objeto|Item)\s*[·:-]\s*/i,''), tokens=new Map(), previews=new Map(), queues=new Map();
 let stop=null,stopMap=null,stopHistory=null,account='',error='',generation=0,mapPacket=null,sharedMapPacket=null,mapData=null,renderedMap=null,mapRequest=0;
 let sharedDrawStop=null,sharedDrawMap='',sharedDrawMode=false,sharedDrawGesture=null,sharedDrawSaving=false;
 const sharedDrawDocs=new Map();
 let changingTurn=false,lastSelectedTurn='',defending=false;
 let fireSync=false;
 let durationSync=false,clockTimer=null,sheetStop=null,sheetWatch='',sheetRevision=0,creatureStop=null;
 const dismissedPsi=new Set();
 let held=null,turning=null,frame=0,placing=false,placementChoice='',posicoesCarregadasV140=false;const entradaTentadaV140=new Set();
 let ultimaEscolhaAtorV213=''; // v213: escolha intencional do ator — resiste a redesenhos transientes que roubavam o controle
 const catalogChecked=new Set();
 let workshopHandle=null,workshopDraft=null,workshopBase=null,workshopMap='',workshopDirty=false;
 let catalogKey='',catalogLimit=48,sceneRef=null,sceneMapId=null,sceneSync=null,sceneNodes=null,contornoSel='';
 const viewStorage=root.defaultView?.localStorage;
 let mapFocus=false; // v144: o botão “foco no mapa” saiu
 // v120: o botão de esconder o histórico saiu (v98); quem tinha escondido ficava sem histórico para sempre.
 let historyVisible=true;try{viewStorage?.removeItem('mesa:novaSyncHistoryVisible');}catch(_){}
 function applyViewMode(){
  const tab=el('sincronizacao-nova'),focus=el('novaSyncFocus'),historyButton=el('novaSyncHistoryToggle');
  tab?.classList.toggle('nova-map-focus',!!mapFocus);
  tab?.classList.toggle('nova-history-hidden',!historyVisible);
  if(focus){focus.hidden=true;focus.style.setProperty('display','none','important');focus.setAttribute('aria-pressed',String(!!mapFocus));focus.textContent=mapFocus?'↩':'⛶';focus.title=mapFocus?'Mostrar painéis novamente':'Dar mais espaço ao mapa';}
  if(historyButton){historyButton.setAttribute('aria-pressed',String(!!historyVisible));historyButton.textContent='📜';historyButton.title=historyVisible?'Ocultar histórico':'Mostrar histórico';historyButton.hidden=!!mapFocus;}
 }
 const archivePath=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
 // v92: o mapa aberto pelo mestre é apenas a visão do mestre durante exploração.
 // Cada miniatura conserva o mapa em que realmente está; jogadores seguem o mapa
 // da miniatura do personagem ativo. Em combate, o mapa global continua autoritativo.
 const activeCharId=()=>String(activeCharacter?.()||'');
 const activeCharRecord=()=>{const id=activeCharId();return (characters()||[]).find(c=>String(c.id)===id)||null;};
 // v93: em exploração, mapa ausente NÃO significa "mapa aberto pelo mestre".
 // Esse fallback fazia miniaturas legadas viajarem junto com a câmera do mestre.
 // Só durante combate o mapa global volta a ser autoritativo.
 const tokenMapId=t=>String(t?.mapaId||(sharedMapPacket?.combat?.active?sharedMapPacket?.mapId:'')||'');
 const currentMapId=()=>String(mapPacket?.mapId||'');
 const tokenOnCurrentMap=t=>!!t&&tokenMapId(t)===currentMapId();
 const tokensOnCurrentMap=()=>[...tokens.values()].filter(tokenOnCurrentMap);
 function desiredViewMapId(){
  const shared=sharedMapPacket||{};
  if(user()?.master)return String(shared?.mapId||'');
  // “Atuar como” segue a miniatura escolhida, não a localização antiga da
  // ficha nem o último mapa coletivo. Aguardar o token evita mostrar outro
  // personagem/mapa durante a chegada dos snapshots; não muda dados salvos.
  const viewId=String(viewActor?.()||'');
  if(viewId){const viewed=tokens.get(viewId)||tokens.get(encodeURIComponent(viewId));return String(viewed?.mapaId||'');}
  if(shared?.combat?.active)return String(shared?.mapId||'');
  // A ficha é a fonte de verdade da localização do jogador. A miniatura é derivada dela.
  // Isso impede um token atrasado/legado de arrastar a tela para o mapa do mestre.
  const c=activeCharRecord();
  if(c?.localizacaoMapaDefinidaV92===true&&c?.localizacaoMapaId)return String(c.localizacaoMapaId);
  if(c?.localizacaoMapaId)return String(c.localizacaoMapaId);
  const token=tokens.get(encodeURIComponent(activeCharId()));
  if(token?.mapaId)return String(token.mapaId);
  // v102: personagem ainda sem localização vê o último destino coletivo usado
  // por “Trazer personagens ativos”, nunca o mapa que o mestre apenas abriu para editar.
  // v140: personagem novo (sem lugar definido pelo mestre nem miniatura de um jogo anterior) começa no mapa 1
  const inicio=(mapas?.()||[]).find(m=>m?.espacoportoV138||String(m?.id)==='v138_espacoporto');
  if(inicio)return String(inicio.id);
  const fallback=groupLocation?.()||{};
  return String(fallback.mapaId||'');
 }
 function sharedDrawPath(mapId){return 'mapaDesenhos/'+String(mapId||'')+'/usuarios';}
 function mySharedDrawDoc(){return sharedDrawDocs.get(String(user()?.uid||''))||{uid:String(user()?.uid||''),strokes:[],revision:0};}
 function drawSharedInk(){
  const board=el('novaSyncBoard');if(!board)return;
  let ink=board.querySelector('[data-shared-ink-layer]');
  if(!ink){ink=root.createElementNS('http://www.w3.org/2000/svg','svg');ink.dataset.sharedInkLayer='';ink.setAttribute('viewBox','0 0 28 14');ink.setAttribute('preserveAspectRatio','none');ink.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6';board.append(ink);}
  ink.replaceChildren();
  const docs=[...sharedDrawDocs.values()];
  if(sharedDrawGesture?.stroke)docs.push({uid:user()?.uid||'',strokes:[sharedDrawGesture.stroke],__preview:true});
  for(const d of docs)for(const stroke of (d.strokes||[])){
   if(!Array.isArray(stroke.points)||stroke.points.length<2)continue;
   const path=root.createElementNS('http://www.w3.org/2000/svg','polyline');
   path.setAttribute('points',stroke.points.map(p=>Number(p.x)+','+Number(p.y)).join(' '));
   path.setAttribute('fill','none');path.setAttribute('stroke',String(stroke.color||'#ffd447'));
   path.setAttribute('stroke-width',String(Number(stroke.width)||3));path.setAttribute('vector-effect','non-scaling-stroke');
   path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');path.setAttribute('opacity',String(Number(stroke.opacity)||1));ink.append(path);
  }
 }
 function watchSharedDrawings(mapId){
  const id=String(mapId||'');if(sharedDrawMap===id&&sharedDrawStop)return;
  sharedDrawStop?.();sharedDrawStop=null;sharedDrawMap=id;sharedDrawGesture=null;sharedDrawMode=false;sharedDrawDocs.clear();drawSharedInk();
  if(!id)return;
  sharedDrawStop=database.subscribe(sharedDrawPath(id),rows=>{
   for(const row of rows){if(row.removed)sharedDrawDocs.delete(String(row.id));else sharedDrawDocs.set(String(row.id),row.data||{});}
   drawSharedInk();
  },fail);
 }
 async function saveMySharedDrawings(strokes){
  const uid=String(user()?.uid||''),mapId=String(mapPacket?.mapId||'');if(!uid||!mapId||sharedDrawSaving)return;
  sharedDrawSaving=true;const path=sharedDrawPath(mapId)+'/'+uid;
  try{
   const prev=sharedDrawDocs.get(uid)||await database.get(path)||{uid,strokes:[],revision:0},revision=Number(prev.revision||0)+1;
   const clean=(strokes||[]).slice(-120).map(st=>({id:String(st.id||crypto.randomUUID()),color:String(st.color||'#ffd447'),width:Math.max(1,Math.min(10,Number(st.width)||3)),opacity:Math.max(.1,Math.min(1,Number(st.opacity)||1)),points:(st.points||[]).slice(0,1600).map(p=>({x:Number(p.x)||0,y:Number(p.y)||0}))}));
   await database.writeMap(path,{uid,mapaId:mapId,strokes:clean,revision,atualizadoEm:new Date().toISOString()});sharedDrawDocs.set(uid,{uid,mapaId:mapId,strokes:clean,revision});
  }catch(e){fail(e);}finally{sharedDrawSaving=false;drawSharedInk();status();}
 }
 async function undoMySharedDraw(){const own=mySharedDrawDoc();await saveMySharedDrawings((own.strokes||[]).slice(0,-1));}
 async function clearMySharedDraw(){const own=mySharedDrawDoc();if(!(own.strokes||[]).length)return;if(!root.defaultView.confirm('Apagar todos os seus desenhos deste mapa?'))return;await saveMySharedDrawings([]);}
 function syncSharedDrawControls(){
  const tools=el('novaSyncSharedDrawTools'),toggle=el('novaSyncSharedDrawToggle'),color=el('novaSyncSharedDrawColor');if(!tools)return;
  tools.hidden=!mapPacket?.mapId;
  if(toggle){toggle.setAttribute('aria-pressed',String(sharedDrawMode));toggle.classList.toggle('active',sharedDrawMode);toggle.disabled=!mapPacket?.mapId;}
  if(color)color.disabled=!mapPacket?.mapId;
  if(el('novaSyncSharedDrawUndo'))el('novaSyncSharedDrawUndo').disabled=sharedDrawSaving||!(mySharedDrawDoc().strokes||[]).length;
  if(el('novaSyncSharedDrawClear'))el('novaSyncSharedDrawClear').disabled=sharedDrawSaving||!(mySharedDrawDoc().strokes||[]).length;
 }
 async function normalizeScene(scene){
  if(!scene)return null;
  const objects=await Promise.all((scene.objects||[]).map(async o=>normalizarObjeto(o,await modelFor(o))));
  return {...scene,objects};
 }
 function viewPacket(shared,id,loaded){
  if(!id)return {...(shared||{}),mapId:'',nome:'Sem mapa vinculado',fundo:'',larguraM:28,alturaM:14,combat:{active:false}};
  if(String(shared?.mapId||'')===String(id))return {...(shared||{}),mapId:String(id)};
  // v94: um mapa visto por outro jogador não herda o combate nem a autoridade
  // espacial do mapa que o mestre está observando. A cópia serve só como
  // envelope de UI; movimento, colisão e turno pertencem ao mapa desta ficha.
  return {...(shared||{}),mapId:String(id),nome:String(loaded?.nome||id),fundo:String(loaded?.fundo||''),larguraM:Number(loaded?.larguraM)||28,alturaM:Number(loaded?.alturaM)||14,combat:{active:false}};
 }
 async function applyMapView(shared,{force=false}={}){
  sharedMapPacket=shared||sharedMapPacket||null;
  const id=desiredViewMapId(),request=++mapRequest,g=generation;
  if(!force&&String(mapPacket?.mapId||'')===id){
   mapPacket=viewPacket(sharedMapPacket,id,mapData);
   if(id===String(sharedMapPacket?.mapId||''))sceneData=sharedSceneData;
   draw();return;
  }
  stopViewScene?.();stopViewScene=null;
  if(!id){mapPacket=viewPacket(sharedMapPacket,'',null);mapData=null;sceneData=null;renderedMap=null;watchSharedDrawings('');draw();return;}
  try{
   const loaded=await loadMap(id);if(g!==generation||request!==mapRequest)return;
   mapPacket=viewPacket(sharedMapPacket,id,loaded);mapData=loaded;renderedMap=null;watchSharedDrawings(id);
   if(id===String(sharedMapPacket?.mapId||'')){
    sceneData=sharedSceneData?.mapId===id?sharedSceneData:null;
   }else{
    const archived=await normalizeScene(await database.get(archivePath(id)));if(g!==generation||request!==mapRequest)return;
    sceneData=archived?.mapId===id?archived:null;
    stopViewScene=database.subscribeDoc(archivePath(id),async scene=>{
     try{const normalized=await normalizeScene(scene);if(g!==generation||desiredViewMapId()!==id)return;sceneData=normalized?.mapId===id?normalized:null;renderedMap=null;draw();editor.paint();}
     catch(e){if(g===generation)fail(e);}
    },fail);
   }
   draw();if(user()?.master)void syncScene();
  }catch(e){if(g===generation&&request===mapRequest)fail(e);}
 }
 async function ensurePlayerView(){if(user()?.master)return;const id=desiredViewMapId();if(String(mapPacket?.mapId||'')!==id)await applyMapView(sharedMapPacket,{force:true});}
 async function modelFor(o){if(!o.modeloId)return {};const key=(o.tipo||'objeto')+':'+o.modeloId;if(!propCache.has(key))propCache.set(key,loadProp(o).catch(e=>{propCache.delete(key);throw e;}));return await propCache.get(key)||{};}
 async function syncScene(){
  if(!user()?.master||!mapData||!mapPacket?.mapId||sceneSync)return;
  const id=mapPacket.mapId,map={...mapData,id},g=generation;
  sceneSync=(async()=>{
   const seeds=objetosDoMapa(map),raw=await database.get(SCENE_PATH),archive=raw?.mapId===id?raw:await database.get(archivePath(id)),models=new Map();
   {const unicos=new Map();for(const o of [...seeds,...(archive?.objects||[])])if(o.modeloId&&!unicos.has(o.modeloId))unicos.set(o.modeloId,o);const lidos=await Promise.all([...unicos.values()].map(o=>modelFor(o).catch(()=>({}))));[...unicos.keys()].forEach((k,i)=>models.set(k,lidos[i]));} // v119: modelos em paralelo
   if(g!==generation)return;
   await database.transact(async tx=>{
    const currentMap=await tx.get(MAP_PATH),old=await tx.get(SCENE_PATH),saved=old?.mapId===id?old:await tx.get(archivePath(id));
    if(currentMap?.mapId!==id)return;
    const next=prepararCena(saved||map.mesaScene,map,seeds,models);
    if(JSON.stringify(next)===JSON.stringify(old))return;
    if(old?.mapId&&old.mapId!==id)tx.set(archivePath(old.mapId),old);
    tx.set(SCENE_PATH,next);
   });
  })();
  try{await sceneSync;}catch(e){fail(e);}finally{sceneSync=null;if(mapPacket?.mapId!==id)void syncScene();}
 }
 function world(){let n=el('novaSyncBoard').querySelector('[data-world-layer]');if(!n){n=root.createElement('div');n.dataset.worldLayer='';n.style.cssText='position:absolute;inset:0;z-index:1;pointer-events:none;isolation:isolate';el('novaSyncBoard').append(n);}return n;}
 function paintLayers(){const nodes=[...world().children].filter(n=>n.dataset.token||n.dataset.sceneObject);const sorted=ordenarCamadas(nodes.map(node=>({node,camada:Number(node.dataset.camada),token:!!node.dataset.token,alt:node.dataset.token?(Number(globalThis.mesaEspacoV205?.altitudePes?.(node.dataset.token))||0):0})));sorted.forEach((e,i)=>e.node.style.zIndex=String(i+1));}
 const quickChoices=new Map();
 let stopScene=null,stopViewScene=null,sceneData=null,sharedSceneData=null,sceneRequest=0;
 const propCache=new Map();
 let attacks=null,health={actors:{},revision:0},history={entries:[]},attacking=false,managing=false,lastEffect='',selectedTarget='',sendingActor='';
 const availableActors=()=>{
  const available=new Map();

  for(const token of tokens.values())if(canView(token))available.set(token.id,token);
  return available;
 };
 const selectedActor=()=>{
  const value=el('novaSyncPersonagem')?.value;
  if(user()?.master&&mapPacket?.combat?.active&&value==='__automatico__')return tokens.get(mapPacket.combat.activeId);
  return availableActors().get(value);
 };
 const masterMode=()=>!!user()?.master&&el('novaSyncPersonagem')?.value==='__mestre__';
 const movimentoPsi=t=>health.actors?.[t?.id]?.psiEffects?.aceleracao?.untilRound>(mapPacket?.combat?.round||0)?{...t,movementMax:30}:t;
 // v140: personagem ativo do jogador sem miniatura entra sozinho no mapa em que ele deve estar (mapa 1 ou onde ficou)
 function entrarSozinhoV140(){
  if(user()?.master||placing||!posicoesCarregadasV140||mapPacket?.combat?.active)return;
  const cid=activeCharId();if(!cid)return;const id=encodeURIComponent(cid);if(tokens.has(id))return;
  const alvo=desiredViewMapId();if(!alvo||String(mapPacket?.mapId||'')!==alvo)return;
  const k=id+'|'+alvo;if(entradaTentadaV140.has(k))return;
  const entry=el('novaSyncEntrySelect');if(!entry||![...entry.options].some(o=>o.value===id))return;
  entradaTentadaV140.add(k);entry.value=id;el('novaSyncJoin')?.click();
 }
 function drawCatalog(){
  const select=el('novaSyncMestrePersonagem');if(!select)return;
  const details=el('novaSyncCatalog');if(details)details.hidden=!user()?.master;
  const old=select.value;
  const type=el('novaSyncMestreTipo')?.value,search=(el('novaSyncCatalogSearch')?.value||'').toLocaleLowerCase('pt-BR');
  const editing=!!workshopHandle;
  const key=JSON.stringify([type,search,old,details?.open,placing,placementChoice,editing,!!mapPacket?.combat?.active,user()?.master,[...tokens.keys()],catalogLimit,[...catalogChecked].sort()]);
  if(key===catalogKey)return;catalogKey=key;
  const placeholder=root.createElement('option');placeholder.value='';placeholder.textContent='Escolher personagem para colocar no mapa';
  const list=(user()?.master?catalog():[]).filter(t=>(!type||t.catalogType===type)&&String(t.nome).toLocaleLowerCase('pt-BR').includes(search));
  const visibleIds=new Set(list.map(t=>String(t.id)));
  for(const id of [...catalogChecked])if(!visibleIds.has(id))catalogChecked.delete(id);
  select.replaceChildren(placeholder,...list.map(t=>{const o=root.createElement('option');o.value=t.id;o.textContent=displayName(t);o.disabled=tokenOnCurrentMap(tokens.get(encodeURIComponent(t.id)));if(o.disabled)o.textContent+=' (já está neste mapa)';return o;}));
  select.value=old;select.disabled=!user()?.master||placing;
  if(el('novaSyncMestreTipo'))el('novaSyncMestreTipo').disabled=select.disabled;
  if(select.disabled)placementChoice='';
  const button=el('novaSyncAdicionar');
  if(button){button.disabled=select.disabled||!select.value||tokenOnCurrentMap(tokens.get(encodeURIComponent(select.value)));button.textContent=placementChoice?'Cancelar colocação':'Adicionar ao mapa';}
  const marked=el('novaSyncAdicionarMarcados');
  const checkedEntries=list.filter(t=>catalogChecked.has(String(t.id))&&['objeto','item'].includes(t.catalogType));
  if(marked){marked.hidden=!editing;marked.disabled=!editing||!checkedEntries.length||placing;marked.textContent=`Adicionar marcados à edição${checkedEntries.length?` (${checkedEntries.length})`:''}`;}
  const hint=el('novaSyncAdicionarHint');
  if(hint)hint.textContent=!user()?.master?'O mestre adiciona personagens ao mapa.':placing?'Adicionando personagem…':editing?'Na Oficina aberta, marque objetos ou itens pelas prévias abaixo para incluí-los no rascunho; depois salve o mapa para compartilhar.':placementChoice?'Clique no mapa para escolher a posição.':'Escolha o tipo e o personagem, depois clique em Adicionar ao mapa.';
  const grid=el('novaSyncCatalogGrid');
  if(grid){
   grid.replaceChildren();
   if(details?.open&&user()?.master)for(const [i,t] of list.slice(0,catalogLimit).entries()){
    const card=root.createElement('div');card.className='nova-catalog-card';card.dataset.catalogId=String(t.id);
    const already=tokenOnCurrentMap(tokens.get(encodeURIComponent(t.id)));
    if(t.imagem){const img=root.createElement('img');img.src=t.imagem;img.loading='lazy';img.decoding='async';img.alt='';card.append(img);}
    const body=root.createElement('span');body.className='nova-catalog-name';body.textContent=(i+1)+'. '+t.nome+(already?' (no mapa)':'');card.append(body);
    if(editing&&['objeto','item'].includes(t.catalogType)){
     const check=root.createElement('input');check.type='checkbox';check.className='nova-catalog-check';check.checked=catalogChecked.has(String(t.id));check.setAttribute('aria-label','Marcar '+displayName(t)+' para adicionar à edição');
     check.addEventListener('change',()=>{check.checked?catalogChecked.add(String(t.id)):catalogChecked.delete(String(t.id));catalogKey='';drawCatalog();});
     card.prepend(check);
    }else{
     card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-pressed',String(select.value===String(t.id)));
     if(already)card.setAttribute('aria-disabled','true');
     const choose=()=>{if(already)return;select.value=t.id;placementChoice='';catalogKey='';drawCatalog();status();};
     card.addEventListener('click',choose);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
    }
    grid.append(card);
   }
   if(details?.open&&!list.length)grid.textContent='Nenhum resultado para este filtro.';
  }
  const more=el('novaSyncCatalogMore');if(more)more.hidden=!details?.open||list.length<=catalogLimit;
 }
 const canView=t=>!!t&&tokenOnCurrentMap(t)&&!!user()&&(user().master||user().uid===t.donoUid);
 const controlled=t=>{
  if(!t||!user())return false;
  if(user().uid===t.donoUid)return true;
  if(!user().master)return false;
  if(!mapPacket?.combat?.active)return true;
  const value=el('novaSyncPersonagem')?.value;
  return value==='__automatico__'?t.id===mapPacket.combat.activeId:value===t.id;
 };
 async function escolherDefesa(modo){
  const t=selectedActor();if(!t||!controlled(t))throw Error('Você não controla este personagem.');
  if(!['auto','esquiva','aparar'].includes(modo))throw Error('Defesa inválida.');
  await database.transact(async tx=>{const path=POSITION_PATH+'/'+t.id,v=await tx.get(path);if(!v||v.activeDefenseId===modo)return;tx.set(path,{...v,activeDefenseId:modo,revision:Number(v.revision||0)+1});});
 }
 const updateActions=criarPainelAcoes({root,load:loadActions,roll:rollTest,unlock:unlockSound,loadout:async({actorId,skillId,weaponId})=>{
  const token=tokens.get(actorId);if(!token||!controlled(token))return;
  await database.transact(async tx=>{const path=POSITION_PATH+'/'+actorId,current=await tx.get(path);if(!current)return;if(current.activeSkillId===String(skillId||'')&&current.activeWeaponId===String(weaponId||''))return;tx.set(path,{...current,activeSkillId:String(skillId||''),activeWeaponId:String(weaponId||''),revision:Number(current.revision||0)+1});});
 },attack:async payload=>{
  if(!user()?.master&&globalThis.mesaJogoPausadoV214?.())throw Error('Jogo pausado pelo mestre.');
  if(!attacks||attacking||queues.size||managing||editor.busy)throw Error('Aguarde a sincronização.');
  if(!controlled(tokens.get(payload.actorId)))throw Error('Você não controla este personagem.');
  if(globalThis.mesaArrastoOcupadoV217?.(payload.actorId))throw Error('Solte a carga para atacar.');
  const tentativa=el('novaSyncBoard')?.querySelector('[data-token="'+CSS.escape(String(payload.actorId))+'"]');if(tentativa)tentativa.dataset.ataqueIntencaoAte=String(performance.now()+350);
  release();attacking=true;sendingActor=payload.actorId;draw();
  try{error='';return await attacks.attack({...payload,mapId:mapPacket?.mapId||''});}catch(e){error='Ataque de '+displayName(tokens.get(payload.actorId))+(e.outcomeUnknown?' sem confirmação: ':' não realizado: ')+e.message;throw e;}finally{attacking=false;sendingActor='';draw();}
 },spend:async(id,turn)=>{
  if(mapPacket?.combat?.activeId!==id||mapPacket.combat.turnId!==turn)return false;
  return changeTurn('spend');
 },support:async payload=>{
  if(!attacks)throw Error('Sessão de combate indisponível.');
  if(!controlled(tokens.get(payload.actorId)))throw Error('Você não controla este personagem.');
  return attacks.support({...payload,mapId:mapPacket?.mapId||''});
 }});
 async function syncFire(){
  if(!user()?.master||fireSync||!account||!sceneData?.objects?.some(o=>o.pegandoFogo&&!o.destruido))return;
  const now=Date.now(),preview=structuredClone(sceneData);if(!avancarFogo(preview,mapPacket||{},[],now,()=>1).changed)return;
  fireSync=true;const fireGeneration=generation;
  try{const apply=await prepareFire(tokensOnCurrentMap());await database.transact(async tx=>{
   const map=await tx.get(MAP_PATH),scene=await tx.get(SCENE_PATH),health=await tx.get(HEALTH_PATH)||{actors:{}},history=await tx.get(HISTORY_PATH)||{entries:[]};
   const ids=tokensOnCurrentMap().map(t=>t.id),positions=(await Promise.all(ids.map(async id=>{const t=await tx.get(POSITION_PATH+'/'+id);return t?{...t,id}:null;}))).filter(Boolean);
   if(!user()?.master||fireGeneration!==generation||!map||scene?.mapId!==map.mapId||map.combat?.pendingAttack)return;
   let seed=now>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const result=avancarFogo(scene,map,positions,now,random);if(!result.changed)return;
   const events=result.messages.map(message=>({message,actorUid:''})).concat(apply(positions,health.actors||={},result.exposure,map,random)).map((e,i)=>({...e,id:'fire:'+now+':'+i,ts:now}));
   tx.set(SCENE_PATH,scene);
   if(events.length){health.revision=(health.revision||0)+1;tx.set(HEALTH_PATH,health);tx.set(HISTORY_PATH,{entries:[...(history.entries||[]),...events].slice(-120),revision:(history.revision||0)+1});}
  });}catch(e){fail(e);}finally{fireSync=false;}
 }
 function syncDurations(){
  if(!user()?.master||durationSync||!account)return;
  const mode=mapPacket?.combat?.active?mapPacket.combat.roundId:'exploration';
  const preview=structuredClone(health.actors||{}),c=structuredClone(mapPacket?.combat),scene=structuredClone(sceneData);
  const changed=atualizarDuracoes(preview,c,scene);
  if(!changed&&health.supportRound===mode)return;
  durationSync=true;
  database.transact(async tx=>{
   const map=await tx.get(MAP_PATH),h=await tx.get(HEALTH_PATH),sc=await tx.get(SCENE_PATH);if(!h)return;
   const modified=atualizarDuracoes(h.actors,map?.combat,sc),key=map?.combat?.active?map.combat.roundId:'exploration';
   if(!modified&&h.supportRound===key)return;
   h.supportRound=key;h.revision=(h.revision||0)+1;tx.set(HEALTH_PATH,h);if(map)tx.set(MAP_PATH,map);if(sc)tx.set(SCENE_PATH,sc);
  }).catch(fail).finally(()=>durationSync=false);
 }
 function paintClocks(){let expired=false;for(const n of board.querySelectorAll('[data-effect-clock]')){n.textContent=textoDuracao(n.effectClock,mapPacket?.combat);if(tempoRestante(n.effectClock,mapPacket?.combat)<=0){n.closest('[data-scene-object]')?.remove();expired=true;}}if(expired)draw();}
 function status(){
  drawPsiInbox();
  syncDurations();
  el('novaSyncStatus').textContent=(queues.size?'Mesa 36 · salvando posição…':error)||`Mesa 36 · ${tokensOnCurrentMap().length} personagem(ns) · 48 px/m`;
  if(held)el('novaSyncStatus').textContent='Solte o botão do mouse para parar · 3 m/s';
  else if(placementChoice)el('novaSyncStatus').textContent='Clique no mapa para colocar o personagem escolhido.';
  const masterPanel=el('novaSyncMasterPanel'),playerInfo=el('novaSyncPlayerInfo');
  if(masterPanel)masterPanel.hidden=false;
  const masterTitle=el('novaSyncMasterTitle');if(masterTitle)masterTitle.textContent=user()?.master?'Painel do mestre · combate':'Sessão de combate · somente leitura';
  if(masterPanel&&!user()?.master)for(const control of masterPanel.querySelectorAll('button,select'))if(!control.closest('#novaSyncSharedDrawTools'))control.disabled=true;
  // v93: este botão era desabilitado no modo jogador e nunca reabilitado ao
  // retornar para a conta do mestre na mesma sessão do navegador.
  const pullActive=el('novaSyncPullActiveV92');
  if(pullActive){pullActive.disabled=!user()?.master||!!mapPacket?.combat?.active;pullActive.title=mapPacket?.combat?.active?'Encerre o combate antes de mover o grupo.':'Move explicitamente os personagens ativos para o cenário/mapa que o mestre está vendo.';}
  const selected=selectedActor(),joined=mapPacket?.joined||{};
  const actorSelect=el('novaSyncPersonagem');if(actorSelect)actorSelect.disabled=!user()?.master&&!!mapPacket?.combat?.active||attacking||!!queues.size||managing;
  const tools=el('novaSyncEditorTools');if(tools){tools.hidden=!!workshop||!masterMode();for(const control of tools.querySelectorAll('button,input'))control.disabled=editor.busy;}
  const entry=el('novaSyncEntrySelect');
  if(entry){const old=entry.value;const chars=(characters()||[]).filter(c=>(c.donoUid||c.dono)===user()?.uid&&!tokenOnCurrentMap(tokens.get(encodeURIComponent(c.id))));entry.replaceChildren(...chars.map(c=>{const o=root.createElement('option');o.value=encodeURIComponent(c.id);o.textContent=c.nome||'Personagem';return o;}));entry.value=chars.some(c=>encodeURIComponent(c.id)===old)?old:chars.some(c=>String(c.id)===String(activeCharacter()))?encodeURIComponent(activeCharacter()):entry.options[0]?.value||'';entry.parentElement.hidden=!!user()?.master||!chars.length;entry.disabled=!!mapPacket?.combat?.active;}
  const joining=entry?.value?(characters()||[]).find(c=>encodeURIComponent(c.id)===entry.value):null;
  if(el('novaOficinaPanel'))el('novaOficinaPanel').hidden=!user()?.master;
  const join=el('novaSyncJoin');
  if(join){join.hidden=!!user()?.master;join.textContent=joining||joined[selected?.id]===false?'Entrar':'Sair do combate';join.disabled=placing||!!mapPacket?.combat?.active||!joining&&(!selected||selected.donoUid!==user()?.uid);join.title=mapPacket?.combat?.active?'Aguarde o fim do combate para entrar.':'';}
  if(playerInfo)playerInfo.hidden=true;
  const alert=el('novaSyncErro');
  if(alert){alert.hidden=!error;alert.textContent=error;}
  const c=mapPacket?.combat,t=tokens.get(c?.activeId),panel=el('novaSyncTurno');
  if(panel)panel.textContent=c?.active?(c.schema===2?
   `Turno ${c.round} · Vez de ${t?.nome||'personagem'} · Ações: ${c.actors[c.activeId].remaining} / ${c.initial[c.activeId].remaining} · Passagens: ${c.actors[c.activeId].passes} / 2 · Movimento: ${saldoMovimento(movimentoPsi(previews.get(c.activeId)||t),c).toFixed(2)} / ${movimentoMaximo(movimentoPsi(previews.get(c.activeId)||t))} m`:
   'Combate da versão anterior: encerre e inicie novamente para rolar a iniciativa.'):'Fora de combate · movimento livre · iniciativa ao começar.';
  if(panel&&!user()?.master){
   const ownTurn=c?.active&&t?.donoUid===user()?.uid;
   panel.textContent=c?.active?(ownTurn?
    `Turno ${c.round} · Sua vez, ${displayName(t)} · Ações: ${c.actors?.[t.id]?.remaining??0} · Movimento: ${saldoMovimento(movimentoPsi(previews.get(t.id)||t),c).toFixed(2)} / ${movimentoMaximo(movimentoPsi(previews.get(t.id)||t))} m`:
    `Turno de combate iniciado · Turno ${c.round} · Vez de ${displayName(t)||'outro personagem'}. Aguarde sua vez.`):'Modo explorador · movimento livre.';
   panel.dataset.ownTurn=String(!!ownTurn);
  }
  const list=el('novaSyncOrdem');
  if(c?.pendingAttack&&panel)panel.textContent+=' · Aguardando defesa';
  if(list)list.textContent=user()?.master&&c?.active&&c.schema===2?'Iniciativa: '+c.order.map(id=>`${tokens.get(id)?.nome||id}: ${c.rolls[id].die} + ${c.rolls[id].initiative} = ${c.rolls[id].total} (${c.actors[id].remaining} Ações; ${c.actors[id].passes>=2?'encerrou':c.actors[id].passes+' passagem(ns)'})`).join(' → '):'';
  for(const [id,available]of [['novaSyncStart',user()?.master&&!c?.active],['novaSyncNext',c?.active&&c.schema===2&&controlled(t)],['novaSyncSpend',c?.active&&c.schema===2&&controlled(t)],['novaSyncEnd',user()?.master&&c?.active]]){
   const b=el(id);if(b){b.hidden=id==='novaSyncStart'||id==='novaSyncEnd'?true:false; /* v143: turnos viram opção secundária no balão ⚡ */b.disabled=!available||(['novaSyncNext','novaSyncSpend'].includes(id)&&!!health.actors?.[c?.activeId]?.combateLab?.inconsciente)||queues.size>0||changingTurn||attacking||managing||editor.busy||!!c?.pendingAttack&&id!=='novaSyncEnd';}
  }
  const roleHint=el('novaSyncTurnoHint');
  if(roleHint)roleHint.textContent='Passar ação preserva as Ações na primeira passagem; a segunda encerra sua participação neste turno. Registrar 1 Ação apenas desconta o gasto, sem resolver ataques ou testes.';
  if(el('novaSyncMapa'))el('novaSyncMapa').disabled=!!c?.active||!user()?.master;
  if(el('novaSyncInit'))el('novaSyncInit').disabled=!!c?.active;
  const quick=el('novaSyncQuickSearch'),quickAdd=el('novaSyncQuickAdd');
  if(quick)quick.disabled=!user()?.master||placing;
  if(quickAdd)quickAdd.disabled=!user()?.master||placing||!quickChoices.has(quick?.value);
  const remove=el('novaSyncRemove');
  if(remove)remove.disabled=!user()?.master||managing||attacking||queues.size>0||!(editor.selection||selectedActor())||!!c?.active&&(!editor.selection||editor.selection.kind==='token');
  for(const id of ['novaSyncRandom','novaSyncClear','novaSyncRestore'])if(el(id))el(id).disabled=!user()?.master||!!c?.active||managing||attacking||queues.size>0;
  // v133: botões só do mestre ficam escondidos para os jogadores
  {const so=!user()?.master;for(const id of ['novaSyncStart','novaSyncEnd']){const b=el(id);if(b&&b.style.display!=='none')b.style.setProperty('display','none','important');} /* v143: turnos só pelo balão ⚡ */
  for(const id of ['novaSyncPullActiveV92','novaSyncRemove','novaSyncRandom','novaSyncClear','novaSyncRestore','novaSyncQuickAdd','novaMapSetupV68']){const b=el(id);if(b&&(b.style.display==='none')!==so){if(so)b.style.setProperty('display','none','important');else b.style.removeProperty('display');}}
   // v133: sem botão de entrar/sair do combate (o mestre decide quando o combate acaba)
   // v140: o jogador não escolhe quem atuar nem quem entra: é sempre o personagem ativo, que entra sozinho
   const j=el('novaSyncJoin');if(j&&j.style.display!=='none')j.style.setProperty('display','none','important');
   for(const n of [el('novaSyncPersonagem')?.closest('label'),el('novaSyncEntrySelect')?.closest('label')]){if(!n)continue;if(so){if(n.style.display!=='none')n.style.setProperty('display','none','important');}else if(n===el('novaSyncPersonagem')?.closest('label'))n.style.removeProperty('display');}
   if(so)entrarSozinhoV140();}
  for(const button of el('novaSyncBoard').querySelectorAll('[data-map-action]'))button.disabled=!c?.active||c.activeId!==selected?.id||!controlled(selected)||attacking||!!queues.size||changingTurn||!!c?.pendingAttack;
  const event=health.event,eventVisible=event&&(user()?.master||event.actorUid===user()?.uid||event.targetUid===user()?.uid);
  const ownEvent=eventVisible?{...event,message:user()?.master?event.message:event.targetUid===user()?.uid?(event.defenderMessage||event.message):(event.attackerMessage||event.message)}:null;
  const watch=selected?.id&&!decodeURIComponent(selected.id).startsWith('sync')?decodeURIComponent(selected.id):'';
  if(watch!==sheetWatch){sheetStop?.();sheetWatch=watch;sheetRevision++;if(watch)sheetStop=database.subscribeDoc((globalThis.mesaTreinoRotaV205?.('personagens/'+watch)||('personagens/'+watch)),()=>{sheetRevision++;queueMicrotask(()=>status());},fail);}
  updateActions(selected?{...selected,nome:displayName(selected)}:null,c,controlled(selected)&&tokens.has(selected?.id)&&(!c?.active||c.activeId===selected?.id)&&!queues.size&&!changingTurn&&!attacking&&!managing&&!editor.busy&&!c?.pendingAttack,{selectTarget:id=>{selectedTarget=id;draw();},sheetRevision,mapWidth:Number(mapPacket?.larguraM)||28,mapHeight:Number(mapPacket?.alturaM)||14,allHealth:health.actors,psiRequests:health.psiRequests,isMaster:!!user()?.master,objects:sceneData?.objects||[],tokens:tokensOnCurrentMap(),health:health.actors?.[selected?.id],revision:health.revision,event:ownEvent,targetId:selectedTarget,masterMode:masterMode(),defenses:c?.active?defesasRestantes(c,selected?.id):null});
  syncSharedDrawControls();
 }
 function drawMap(){
  const board=el('novaSyncBoard'),select=el('novaSyncMapa'); if(!board||!select)return;
  const list=mapas()||[],old=select.value;
  select.replaceChildren(...list.map(m=>{const o=root.createElement('option');o.value=m.id;o.textContent=m.nome||m.id;return o;}));
  if(mapPacket?.mapId&&!list.some(m=>String(m.id)===String(mapPacket.mapId))){const o=root.createElement('option');o.value=mapPacket.mapId;o.textContent=mapPacket.nome||mapPacket.mapId;select.append(o);}
  select.value=mapPacket?.mapId||old||'';
  const fundo=String(mapPacket?.fundo||mapData?.fundo||mapData?.oficina2State?.bg||'');
  board.style.backgroundImage=/^(#|rgb|hsl|linear-gradient)/i.test(fundo)?'none':(fundo?`url("${fundo.replaceAll('"','%22')}")`:'linear-gradient(135deg,#20314c,#18233a)');
  board.style.backgroundColor=/^(#|rgb|hsl)/i.test(fundo)?fundo:'#20314c';
  board.style.backgroundSize='cover';board.style.backgroundPosition='center';
  if(mapPacket?.larguraM&&mapPacket?.alturaM){board.dataset.mapWidth=mapPacket.larguraM;board.dataset.mapHeight=mapPacket.alturaM;}
  let layer=board.querySelector('[data-map-layer]');
  if(!layer){layer=root.createElement('div');layer.dataset.mapLayer='';layer.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden';board.prepend(layer);}
  const visualMap=sceneData?.oficinaConfig?{...mapData,oficina2State:{...sceneData.oficinaConfig,elements:[]}}:mapData;const editandoGrade=board.dataset.editing==='true';const visualKey=JSON.stringify([sceneData?.oficinaConfig||null,editandoGrade]);if(renderedMap===mapData&&layer.firstChild&&layer.dataset.visualKey===visualKey)return;layer.dataset.visualKey=visualKey;
  layer.innerHTML=visualMap?renderMap(visualMap,{separateObjects:sceneData?.mapId===mapPacket?.mapId&&sceneData?.objetosMapaImportados}):'';
  const svg=layer.querySelector('svg');
  if(svg){svg.style.cssText='display:block;width:100%;height:100%';svg.setAttribute('preserveAspectRatio','none');}
  // v209: sem grade de batalha na mesa (mapa limpo, estilo MMO); no editor de mapa a grade volta
  for(const r of layer.querySelectorAll('rect[fill="url(#novaGrid)"]'))r.style.display=editandoGrade&&globalThis.mesaGradeNaMesa===true?'':'none'; // v193: sem grade na mesa nem editando (window.mesaGradeNaMesa=true a traz de volta)
  renderedMap=mapData;
 }
 const nodosToken=new Map();
 const nodoDoToken=id=>{for(const n of world().querySelectorAll(':scope>[data-token]'))if(n.dataset.token===id)return n;return null;};
 // v203: o mapa era redesenhado inteiro a cada mudança de vida/posição (dezenas por segundo com bichos agindo). Agora a 1ª chamada desenha na hora e as seguintes, em até 90 ms, viram uma só.
 let drawUltimoV203=0,drawPendenteV203=false;
 function draw(){drawUltimoV203=performance.now();drawAgoraV203();} // ações do usuário: desenho na hora
 function drawSuaveV203(){ // atualizações que chegam do banco (vida, posições dos bichos): no máximo 1 desenho a cada 40 ms
  const agora=performance.now();
  if(agora-drawUltimoV203>=40){drawUltimoV203=agora;drawAgoraV203();return;}
  if(!drawPendenteV203){drawPendenteV203=true;setTimeout(()=>{drawPendenteV203=false;drawUltimoV203=performance.now();try{drawAgoraV203();}catch(e){console.warn('[Mesa] desenho',e);}},Math.max(8,40-(agora-drawUltimoV203)));}
 }
 function drawAgoraV203(){
  const board=el('novaSyncBoard'),select=el('novaSyncPersonagem'),old=select.value;
  if(!el('ndCssV209')){const st=root.createElement('style');st.id='ndCssV209';st.textContent='[data-token]:hover>[data-rotulo]{opacity:1!important} #novaSyncBoard [data-scene-object]{contain:layout style} #novaSyncBoard [data-token]{contain:layout style}';root.head.append(st);} // v209: nome aparece ao passar o mouse
  // v134: mapas panorâmicos (mais de 28 m) cabem na largura da tela: menos pixels por metro, miniaturas menores
  // v209b: mapas quadrados/verticais também cabem na ALTURA da moldura (senão a parte de baixo ficava invisível).
  // v212: o piso de 16 px/m quebrava mapas muito largos (84 m → 1344 px numa janela de 1280): a borda
  // ficava inalcançável fora da tela. Piso passa a ser 10 px/m (o mesmo dos verticais) — sempre cabe.
  {const Wm=Number(mapPacket?.larguraM)||28,Hm=Number(mapPacket?.alturaM)||14,cw=(board.parentElement?.clientWidth||0)-(parseFloat(getComputedStyle(board.parentElement).paddingLeft)||0),ch=board.parentElement?.clientHeight||0; /* v197: descontar a coluna do editor rápido */ let ppmV=Wm>28&&cw>200?Math.max(10,Math.min(48,cw/Wm)):48;if(ch>200)ppmV=Math.max(10,Math.min(ppmV,ch/Hm));board.style.width=Wm*ppmV+'px';board.style.height=Hm*ppmV+'px';}
  const mine=[...availableActors().values()];
  {const sigV203=mine.map(t=>t.id+'\u0001'+displayName(t)+(tokens.has(t.id)?'':'~')).join('\u0002');if(select.dataset.sigV203!==sigV203){select.dataset.sigV203=sigV203;select.replaceChildren(...mine.map(t=>{const option=root.createElement('option');option.value=t.id;option.textContent=displayName(t)+(tokens.has(t.id)?'':' (fora do mapa)');return option;}));}} // v203: só refaz a lista quando ela muda (refazer a cada desenho forçava layout)
  if(user()?.master){const option=root.createElement('option');option.value='__mestre__';option.textContent='👑 Mestre';select.prepend(option);if(mapPacket?.combat?.active){const automatic=root.createElement('option');automatic.value='__automatico__';automatic.textContent='⚙ Automático';select.prepend(automatic);}}
  // v213: se o valor caiu da lista num redesenho transitório (ex.: tokens recarregando após trocar de mapa),
  // preferir o último ator ESCOLHIDO de propósito antes de cair no "primeiro token do mapa" — senão o
  // controle escorregava para outro personagem no meio do movimento (clique-para-andar andava outro token).
  select.value=mapPacket?.combat?.active&&user()?.master?(old==='__mestre__'?'__mestre__':old==='__automatico__'?'__automatico__':mine.some(t=>t.id===old)?old:'__automatico__'):old==='__mestre__'&&user()?.master?old:mine.some(t=>t.id===old)?old:mine.find(t=>t.id===ultimaEscolhaAtorV213)?.id||mine.find(t=>t.id===encodeURIComponent(activeCharacter()))?.id||mine.find(t=>tokens.has(t.id))?.id||(user()?.master?'__mestre__':mine[0]?.id||'');
  if(!user()?.master){const ativo=mine.find(t=>t.id===encodeURIComponent(activeCharacter()));if(ativo)select.value=ativo.id;}
  if(mapPacket?.combat?.active&&mapPacket.combat.schema===2){
   const active=tokens.get(mapPacket.combat.activeId);
   if(user()?.master&&old!=='__mestre__'&&!mine.some(t=>t.id===old))select.value='__automatico__';
   else if(controlled(active))select.value=active.id;
  }
  const turnKey=mapPacket?.combat?.active?[mapPacket.combat.session,mapPacket.combat.round,mapPacket.combat.activeId].join(':'):'';
  if(turnKey!==lastSelectedTurn||select.value!==old){
   if(turnKey!==lastSelectedTurn&&user()?.master&&mapPacket?.combat?.active&&old!=='__mestre__')select.value='__automatico__';
   if(error==='Aguarde o turno deste personagem.'||error==='Aguarde sua vez.')error='';
   selectedTarget='';lastSelectedTurn=turnKey;
  }
  if(el('novaSyncInit'))el('novaSyncInit').style.display='none';
  for(const [id,node] of [...nodosToken])if(!node.isConnected||!tokens.has(id)||!tokenOnCurrentMap(tokens.get(id))){node.remove();nodosToken.delete(id);} // v196: lista própria dos tokens (a cena pode ter milhares de nós)
  for(const node of world().querySelectorAll(':scope>[data-token]'))if(!nodosToken.has(node.dataset.token)&&(!tokens.has(node.dataset.token)||!tokenOnCurrentMap(tokens.get(node.dataset.token))))node.remove();
  const bwV203=board.clientWidth,bhV203=board.clientHeight; // v203: lê o tamanho do tabuleiro uma vez (ler por token forçava o navegador a refazer o layout 40 vezes por desenho)
  for(const t of tokens.values()){
   if(!tokenOnCurrentMap(t))continue;
   let node=nodosToken.get(t.id);if(node&&!node.isConnected){nodosToken.delete(t.id);node=null;}if(!node)node=nodoDoToken(t.id);
   if(!node){
    node=root.createElement('div');node.dataset.token=t.id;
    node.style.cssText='position:absolute;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:50%;border:3px solid transparent;background:'+(t.imagem?'transparent':'#263d62')+';touch-action:none;user-select:none;transition:left .28s linear,top .28s linear';
    if(t.imagem||spriteDoToken(t)){const img=root.createElement('img');img.src=spriteDoToken(t)||t.imagem;img.draggable=false;img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none';node.append(img);}
    const label=root.createElement('span');label.dataset.rotulo='';label.textContent=displayName(t);label.style.cssText='position:absolute;top:46px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#172337;font-size:12px;opacity:0;transition:opacity .15s;pointer-events:none';node.append(label);world().append(node);
    const facingHandle=root.createElement('span');facingHandle.dataset.facingHandle='';facingHandle.title='Segure para girar';facingHandle.style.cssText='position:absolute;width:10px;height:10px;border-radius:50%;background:#ffd447;border:1px solid #111;box-shadow:0 0 3px #000;cursor:grab;z-index:13;transform:translate(-50%,-50%);';node.append(facingHandle);
   }
   nodosToken.set(t.id,node);
   node.dataset.camada=camadaEntidade(t);node.style.pointerEvents='auto';
   const p=previews.get(t.id)||t;
    const tokenDiameterM=diametroVisual(t);
    const tokenHealth=health.actors?.[t.id]?.combateLab||{};
    const mimicState=health.actors?.[t.id]?.psiEffects?.mimetismo_psi,mimic=mimicState?.clock&&tempoRestante(mimicState.clock,mapPacket?.combat)<=0?null:mimicState;
    const spriteArte=mimic?'':spriteDoToken(t),tokenImage=mimic?.image||spriteArte||t.imagem||'';
    const tokenImg=node.querySelector('img');
    if(tokenImg&&tokenImg.getAttribute('src')!==tokenImage){if(tokenImage)tokenImg.src=tokenImage;else tokenImg.remove();}
    if(!tokenImg&&tokenImage){const img=root.createElement('img');img.src=tokenImage;img.draggable=false;img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none';node.prepend(img);}
    /* miniatura artística (corpo inteiro, fundo transparente): sem recorte redondo; marca o token para as animações de movimento/ataque */
    {const im=node.querySelector('img');if(im){const sp=!!spriteArte&&tokenImage===spriteArte;if(sp){im.style.objectFit='contain';im.style.borderRadius='0';node.style.background='transparent';}else{im.style.objectFit='cover';im.style.borderRadius='50%';}if(sp){if(node.dataset.sprite!=='1')node.dataset.sprite='1';}else if(node.dataset.sprite)delete node.dataset.sprite;}}
    node.querySelectorAll('[data-effect-clock]').forEach(n=>n.remove());
    let timerIndex=0;for(const effect of Object.values(health.actors?.[t.id]?.psiEffects||{})){if(!effect.clock)continue;const timer=root.createElement('small');timer.dataset.effectClock='';timer.effectClock=effect.clock;timer.style.cssText='position:absolute;left:0;top:calc(100% + 20px);background:#151b32;color:#ddd;white-space:nowrap;font-size:10px';timer.style.top='calc(100% + '+(20+14*timerIndex++)+'px)';timer.textContent=textoDuracao(effect.clock,mapPacket?.combat);node.append(timer);}
    node.style.filter='drop-shadow(0 2px 3px rgba(0,0,0,.45))'; // v209: sombra de chão no lugar de fundo escuro
    node.querySelectorAll('[data-state-symbol]').forEach(n=>n.remove());
    if(tokenHealth.morto||tokenHealth.inconsciente||tokenHealth.incapacitado){const state=root.createElement('span');state.dataset.stateSymbol='';state.textContent=tokenHealth.morto?'💀':emComa(tokenHealth)?'🛌':tokenHealth.inconsciente?'💤':'🩸';state.title=tokenHealth.morto?'Morto':emComa(tokenHealth)?'Em coma: precisa de Primeiros Socorros ou cura no ferimento grave':tokenHealth.inconsciente?'Desmaiado: pode acordar sozinho ou ser socorrido':'Incapacitado';state.style.cssText='position:absolute;inset:0;display:grid;place-items:center;font-size:22px;text-shadow:0 1px 3px #000;pointer-events:none;z-index:10;';node.append(state);}
    else if(health.actors?.[t.id]?.psiEffects?.atordoado){const state=root.createElement('span');state.dataset.stateSymbol='';state.textContent='💫';state.title='Atordoado';state.style.cssText='position:absolute;right:-3px;top:-8px;font-size:16px;text-shadow:0 1px 3px #000;pointer-events:none;z-index:10;';node.append(state);}
   node.style.boxSizing='border-box';
   const wpxV203=tokenDiameterM/(Number(mapPacket?.larguraM)||28)*bwV203,hpxV203=tokenDiameterM/(Number(mapPacket?.alturaM)||14)*bhV203;
   node.style.width=wpxV203+'px';
   node.style.height=hpxV203+'px';
   const label=node.querySelector('span');if(label){label.textContent=displayName(t);label.style.top='calc(100% + 3px)';label.style.opacity=(t.id===selectedTarget||t.id===select.value)?'1':'';} // v209: nome some; aparece no toque/seleção ou ao passar o mouse
   node.style.transition=previews.has(t.id)?'none':'left .2s linear,top .2s linear';
   node.style.left=`${p.x/28*100}%`;node.style.top=`${p.y/14*100}%`;
   const aim=sendingActor===t.id?(tokens.get(selectedTarget)||(sceneData?.objects||[]).find(o=>o.id===selectedTarget)):null;
   const facing=aim?Math.atan2((aim.y-t.y)*(Number(mapPacket?.alturaM)||14)/14,(aim.x-t.x)*(Number(mapPacket?.larguraM)||28)/28):health.pending?.actorId===t.id&&Number.isFinite(health.pending.facing)?health.pending.facing:Number.isFinite(p.facing)?p.facing:0;
   const handle=node.querySelector('[data-facing-handle]');
   if(handle){const radius=Math.max(28,Math.min(54,tokenDiameterM/2*48+7));handle.style.left=(50+Math.cos(facing)*radius/Math.max(1,wpxV203)*100)+'%';handle.style.top=(50+Math.sin(facing)*radius/Math.max(1,hpxV203)*100)+'%';}
   node.dataset.x=p.x;node.dataset.y=p.y;
   node.style.cursor=masterMode()?'move':'pointer';node.style.borderColor=t.id===select.value?'#ffd447':t.id===selectedTarget?'#ff7855':'transparent'; // v209: sem anel ciano permanente (só seleção/alvo)
   node.querySelectorAll('[data-turn-arrow]').forEach(n=>n.remove());
   if(mapPacket?.combat?.active&&mapPacket.combat.activeId===t.id){
    const arrow=root.createElement('span');arrow.dataset.turnArrow='';arrow.textContent='▼';arrow.title='Turno atual';
    arrow.style.cssText='position:absolute;left:50%;top:-24px;transform:translateX(-50%);color:#ffd447;font-size:22px;font-weight:bold;line-height:1;text-shadow:0 0 5px #000;pointer-events:none;z-index:11;';node.append(arrow);
   }
   node.querySelectorAll('[data-defense-bubble]').forEach(n=>n.remove());
   if(mapPacket?.combat?.pendingAttack&&health.pending?.actorId===t.id){
    const bubble=root.createElement('span');bubble.dataset.defenseBubble='';bubble.textContent=health.pending?.type==='effects'?'✨ Escolher efeitos':'⏳ Defesa';bubble.title='Aguardando a defesa do alvo';
    const above=p.y/14>0.28;
    bubble.style.cssText='position:absolute;left:50%;'+(above?'top:calc(100% + 20px);':'bottom:calc(100% + 4px);')+'transform:translateX(-50%);white-space:nowrap;padding:2px 5px;border-radius:4px;background:#ffd447;color:#171b2f;font:11px Arial,sans-serif;font-weight:bold;z-index:12;pointer-events:none;';node.append(bubble);
   }
   node.querySelectorAll('[data-map-action]').forEach(n=>n.remove());
   if(mapPacket?.combat?.active&&selectedTarget===t.id&&mapPacket.combat.activeId===selectedActor()?.id&&t.id!==selectedActor()?.id&&controlled(selectedActor())){
    const actor=selectedActor();
    const action=root.createElement('button');action.type='button';action.dataset.mapAction='attack';action.textContent='⚔';action.title='Testar ação de '+displayName(actor)+' contra '+displayName(t);action.disabled=attacking||!!queues.size||changingTurn;
    const bottomSpace=bhV203*(1-p.y/14)-parseFloat(node.style.height)/2;
    action.style.cssText='position:absolute;left:50%;transform:translateX(-50%);'+(bottomSpace<54?'bottom:calc(100% + 4px);':'top:calc(100% + 21px);')+'z-index:12;border:1px solid #ffd447;border-radius:5px;background:#18233a;color:#fff;cursor:pointer;';
    action.addEventListener('pointerdown',e=>e.stopPropagation());
    action.addEventListener('click',e=>{e.stopPropagation();updateActions.setTarget(t.id);updateActions.triggerAttack();});
    node.append(action);
   }
  }
  drawMap();drawScene();paintLayers();editor.paint();drawSharedInk();workshopHandle?.refresh?.();drawCatalog();drawHistory();drawDefense();status();syncSharedDrawControls();
visualSync();
 }
 function drawDefense(){
  let box=board.querySelector('[data-defense-prompt]');
  const pending=health.pending,isEffects=pending?.type==='effects',t=tokens.get(isEffects?pending.actorId:pending?.targetId);
  if(!pending||mapPacket?.combat?.pendingAttack!==pending.id||!t){box?.remove();return;}
  const canRespond=user()?.uid===t.donoUid||!!user()?.master;
  const key=pending.id+':'+pending.type+':'+canRespond+':'+defending;
  if(box?.dataset.key===key)return;
  box?.remove();box=root.createElement('div');box.dataset.defensePrompt='';box.dataset.key=key;
  box.style.cssText='max-height:45vh;overflow:auto;position:absolute;z-index:30;width:260px;max-width:90%;padding:8px;border:1px solid #00d4ff;border-radius:8px;background:#151b32;color:white;font:13px Arial,sans-serif;box-sizing:border-box;';
  box.style.left=Math.max(0,Math.min(board.clientWidth-270,t.x/28*board.clientWidth-130))+'px';
  const y=t.y/14*board.clientHeight;box.style.top=(y>180?y-175:y+40)+'px';
  const title=root.createElement('strong');title.textContent=isEffects?'Escolhas de '+displayName(t):canRespond?'Defesa de '+displayName(t)+' · '+pending.remaining+' restante(s)':'Aguardando defesa de '+displayName(t);box.append(title);
  if(isEffects){
   const result=root.createElement('p');result.textContent=pending.attackText+' · '+pending.defenseText;box.append(result);
   if(canRespond){
    const checks=[];
    for(const option of pending.options||[]){const label=root.createElement('label'),input=root.createElement('input');input.type='checkbox';input.value=option.id;label.append(input,root.createTextNode(option.nome));label.style.display='block';box.append(label);checks.push(input);}
    const hint=root.createElement('small');hint.textContent='Até '+pending.maxEffects+' efeito(s). Escolher o local não consome efeito.';box.append(hint);
    const location=root.createElement('select');const random=root.createElement('option');random.value='';random.textContent='Local aleatório';location.append(random);
    for(const local of pending.locations||[]){const o=root.createElement('option');o.value=local;o.textContent=local;location.append(o);}if(pending.locations?.length)box.append(location);
    const confirm=root.createElement('button');confirm.textContent='Aplicar golpe';confirm.disabled=defending;box.append(confirm);
    const feedback=root.createElement('p');box.append(feedback);
    confirm.onclick=async()=>{const effects=checks.filter(c=>c.checked).map(c=>c.value);if(effects.length>pending.maxEffects){feedback.textContent='Escolha no máximo '+pending.maxEffects+' efeito(s).';return;}confirm.disabled=true;try{await attacks.chooseEffects({attackId:pending.id,actorId:pending.actorId,effects,local:location.value});error='';}catch(e){feedback.textContent=e.message;}finally{confirm.disabled=false;}};
   }
   box.addEventListener('pointerdown',e=>e.stopPropagation());board.append(box);return;
  }
  if(canRespond){
   const choices=root.createElement('select');choices.style.cssText='width:100%;margin:6px 0;background:#303349;color:white;font:13px Arial;';
   for(const option of pending.options){const o=root.createElement('option');o.value=option.id;o.textContent=option.nome+' — '+(option.base!==undefined?descreverTeste(option.base,option.valor,'?',option.modifiers||[]):option.valor+'%');choices.append(o);}
   const hint=root.createElement('div');hint.textContent=pending.cone?'Cone sonoro: somente Esquiva. O alvo central recebe −20.':pending.ranged?'Ataque à distância: somente Esquiva.':'Aparar exige arma corpo a corpo com alcance suficiente.';box.append(choices,hint);
   for(const [label,choice]of [['Rolar defesa',null],['Não defender','none']]){const b=root.createElement('button');b.textContent=label;b.disabled=defending;b.style.cssText='font:12px Arial;padding:5px;margin:6px 4px 0 0;';b.addEventListener('click',async()=>{
    defending=true;drawDefense();try{await attacks.defend({attackId:pending.id,actorId:t.id,choice:choice||choices.value});error='';}catch(e){error=e.message;}finally{defending=false;draw();}
   });box.append(b);}
  }
  box.addEventListener('pointerdown',e=>e.stopPropagation());board.append(box);
 }
 function drawPsiInbox(){
  const shown=(health.psiRequests||[]).filter(r=>!dismissedPsi.has(r.id)&&(r.status==='pending'&&user()?.master||r.status==='resolved'&&tokens.get(r.actorId)?.donoUid===user()?.uid));
  let box=el('novaPsiInbox');
  if(!shown.length){box?.remove();return;}
  if(!box){box=root.createElement('aside');box.id='novaPsiInbox';box.className='nova-psi-inbox';box.setAttribute('aria-label','Mensagens psíquicas');root.body.append(box);}
  for(const card of [...box.children])if(!shown.some(r=>r.id===card.dataset.request))card.remove();
  for(const request of shown){
   let card=[...box.children].find(n=>n.dataset.request===request.id);
   if(card?.dataset.status===request.status)continue;
   if(!card){card=root.createElement('section');card.dataset.request=request.id;box.append(card);}card.replaceChildren();card.dataset.status=request.status;
   const title=root.createElement('strong');title.textContent=request.powerName+' · '+(tokens.get(request.actorId)?.nome||'Personagem');card.append(title);
   const message=root.createElement('p');message.textContent=request.status==='resolved'?request.answer:request.text||request.description;card.append(message);
   if(request.status==='resolved'){const close=root.createElement('button');close.textContent='Entendido';close.onclick=()=>{dismissedPsi.add(request.id);drawPsiInbox();};card.append(close);}
   if(request.status==='pending'){
    const answer=root.createElement('textarea');answer.placeholder='Resposta para o jogador';answer.setAttribute('aria-label','Resposta do mestre');card.append(answer);
    const button=root.createElement('button');button.type='button';button.textContent='Enviar resposta';card.append(button);
    const feedback=root.createElement('p');feedback.setAttribute('role','status');card.append(feedback);
    button.onclick=async()=>{if(!answer.value.trim()){feedback.textContent='Escreva uma resposta.';return;}button.disabled=true;try{await attacks.support({kind:'direct-psi-review',actorId:request.actorId,targetId:request.targetId,requestId:request.id,text:answer.value,turnId:null});}catch(e){feedback.textContent=e.message;}finally{button.disabled=false;}};
   }
  }
 }
 function drawScene(){
  const board=el('novaSyncBoard'),scene=editor.preview();
  board.querySelectorAll('[data-psi-zone]').forEach(n=>n.remove());
  for(const z of scene?.psiZones||[]){
   if(z.clock?tempoRestante(z.clock,mapPacket?.combat)<=0:!mapPacket?.combat?.active||z.untilRound<=mapPacket.combat.round)continue;
   const n=root.createElement('div');n.dataset.psiZone=z.id;n.textContent=(z.label||z.kind)+(z.clock?' · '+textoDuracao(z.clock,mapPacket?.combat):'');
   n.style.cssText=`position:absolute;pointer-events:none;border:2px solid #bb83ff;border-radius:50%;background:#8a4fff33;color:white;transform:translate(-50%,-50%);z-index:3;left:${z.x/28*100}%;top:${z.y/14*100}%;width:${z.radius*2/(mapPacket?.larguraM||28)*100}%;height:${z.radius*2/(mapPacket?.alturaM||14)*100}%;`;if(z.powerId==='anoitecer'||/anoitecer/i.test(z.kind||'')){const caster=tokens.get(z.sourceId),privileged=user()?.master||caster?.donoUid===user()?.uid;n.style.background=privileged?'rgba(0,0,0,.6)':'#000';n.style.borderColor='#222';n.style.zIndex='25';if(caster){n.style.left=caster.x/28*100+'%';n.style.top=caster.y/14*100+'%';}}board.append(n);
  }
  if(contornoSel!==selectedTarget){for(const node of board.querySelectorAll('[data-scene-object]'))node.style.outline=node.dataset.sceneObject===selectedTarget?'2px solid #ff7855':'';contornoSel=selectedTarget;}
  if(sceneRef===scene&&sceneMapId===mapPacket?.mapId)return; // cena igual à já desenhada: nada a fazer
  // v196: desenho INCREMENTAL da cena: só refaz o que mudou (antes, cada peça posta refazia o mapa inteiro: milhares de nós a cada clique)
  const mesmoMapa=sceneMapId===mapPacket?.mapId&&sceneNodes;
  sceneRef=scene;sceneMapId=mapPacket?.mapId;
  if(!mesmoMapa||scene?.mapId!==(mapPacket?.mapId||'')){for(const node of board.querySelectorAll('[data-scene-object]'))node.remove();sceneNodes=new Map();}
  if(scene?.mapId!==(mapPacket?.mapId||''))return;
  const criarNo=o=>{
   const node=root.createElement('div');node.dataset.sceneObject=o.id;node.dataset.camada=camadaEntidade(o);node.style.outline=o.id===selectedTarget?'2px solid #ff7855':'';node.title=o.nome+' · PV '+o.pvAtual+'/'+o.pvMax+' · Dureza '+o.dureza+' · '+(o.material||'Material não informado')+' · Camada '+o.camada;
   node.style.cssText='position:absolute;pointer-events:none;transform:translate(-50%,-50%);';node.style.outline=o.id===selectedTarget?'2px solid #ff7855':'';
   node.style.left=o.x/28*100+'%';node.style.top=o.y/14*100+'%';
   node.style.transform+=' rotate('+o.angulo+'deg)';node.style.opacity=String(o.opacity??1);
   // v161: paredes/casas de mapas pintados são invisíveis (a arte já desenha); o mestre vê um contorno leve
   if(o.invisivelV161||o.oficinaElement?.invisivelV161){node.style.opacity='0';node.dataset.invisivel='1';} // v174: paredes/escadas invisíveis só aparecem no modo de editar (🛠️)
   node.style.width=o.larguraM/(Number(mapPacket?.larguraM)||28)*100+'%';node.style.height=o.alturaM/(Number(mapPacket?.alturaM)||14)*100+'%';
   if(o.pincelV203){node.innerHTML='<img alt="" draggable="false" src="'+pincelUrlV203(o)+'" style="width:100%;height:100%;display:block;pointer-events:none">';}else if(o.oficinaElement){node.innerHTML=renderSceneObject(o,scene);}else if(o.forma){node.style.background=o.cor||'#666666';node.style.border=(o.bordaLargura||0)+'px solid '+(o.borda||'#111111');if(['circle','ellipse'].includes(o.forma))node.style.borderRadius='50%';if(o.forma==='triangle')node.style.clipPath='polygon(50% 0,100% 100%,0 100%)';node.style.boxShadow=o.sombra?'4px 4px 6px #0008':'';const semBordaV205=/^(parede|caverna|cerca|mureta)$/.test(String(o.erTipo||o.oficina3||''));if(semBordaV205){node.style.border='0';}if(typeof o.bordasV198==='string'&&!semBordaV205){const fl=o.bordasV198,cb=o.borda||'#2a2622',e=o.erTipo==='caverna'?'2px':'1.5px';['Top','Right','Bottom','Left'].forEach((n,i)=>{node.style['border'+n]=(fl.includes('trbl'[i])?e:'0')+' solid '+cb;});if(o.erTipo==='caverna'){const rd=(a,b)=>fl.includes(a)&&fl.includes(b)?'min(30%,14px)':'0';node.style.borderTopLeftRadius=rd('t','l');node.style.borderTopRightRadius=rd('t','r');node.style.borderBottomRightRadius=rd('b','r');node.style.borderBottomLeftRadius=rd('b','l');}}if(o.textura){const tm=Number(o.texturaM)||1;node.style.backgroundImage='url("'+String(o.textura).replace(/"/g,'%22')+'")';node.style.backgroundSize=(tm/(Number(o.larguraM)||1)*100)+'% '+(tm/(Number(o.alturaM)||1)*100)+'%';node.style.backgroundRepeat='repeat';if(o.degradeV198){node.style.backgroundImage='linear-gradient('+o.degradeV198+',rgba(0,0,0,.42),rgba(255,255,255,.22)),'+node.style.backgroundImage;node.style.backgroundSize='100% 100%,'+node.style.backgroundSize;node.style.backgroundRepeat='no-repeat,repeat';}if(o.texMundoV198&&!Number(o.angulo)){const Wm=Number(mapPacket?.larguraM)||28,Hm=Number(mapPacket?.alturaM)||14,lm=Number(o.larguraM)||1,am=Number(o.alturaM)||1,px0=o.x/28*Wm-lm/2,py0=o.y/14*Hm-am/2,md=(a,b)=>((a%b)+b)%b,dx=lm-tm,dy=am-tm;node.style.backgroundPosition=(Math.abs(dx)>1e-6?(-md(px0,tm)/dx*100):0)+'% '+(Math.abs(dy)>1e-6?(-md(py0,tm)/dy*100):0)+'%';}if((o.erTipo==='macico'||o.erTipo==='macicoTopo'||o.rochaOrganicaV205)&&o.lacosV201&&o.textura){node.style.background='none';node.style.backgroundImage='none';node.style.border='0';node.style.borderRadius='0';node.style.boxShadow='';node.innerHTML=macicoSvgV201(o,Number(mapPacket?.larguraM)||28,Number(mapPacket?.alturaM)||14);}if(o.erTipo==='caverna'&&typeof o.bordasV198==='string'&&o.textura&&!Number(o.angulo)){node.style.background='none';node.style.backgroundImage='none';node.style.border='0';node.style.borderRadius='0';node.style.boxShadow='';node.innerHTML=cavernaSvgV198(o,Number(mapPacket?.larguraM)||28,Number(mapPacket?.alturaM)||14);}if((o.erTipo==='escada'||o.erTipo==='rampa')&&o.textura&&!Number(o.angulo)){node.style.background='none';node.style.backgroundImage='none';node.style.border='0';node.innerHTML=escadaSvgV198(o);}if(o.pocaV198&&o.textura&&!Number(o.angulo)){node.style.background='none';node.style.backgroundImage='none';node.style.border='0';node.style.boxShadow='';node.innerHTML=pocaSvgV198(o,Number(mapPacket?.larguraM)||28,Number(mapPacket?.alturaM)||14);}}if(o.mascara){node.style.webkitMaskImage=o.mascara;node.style.maskImage=o.mascara;}if(o.recorte)node.style.clipPath=o.recorte;if(o.misturaV197)node.style.mixBlendMode=o.misturaV197;if(o.textoV197){node.textContent=o.textoV197;node.style.color=o.corTexto||'#fff';node.style.font='600 '+(Number(o.tamTexto)||14)+'px Segoe UI,Arial,sans-serif';node.style.display='flex';node.style.alignItems='center';node.style.justifyContent='center';node.style.textAlign='center';node.style.textShadow='0 1px 3px #000,0 0 6px #000';node.style.whiteSpace='pre-wrap';}}else if(o.imagem){const img=root.createElement('img');img.src=o.imagem;img.alt=o.nome;img.style.cssText='width:100%;height:100%;object-fit:contain';node.append(img);}else{node.textContent=o.nome;node.style.background='#37455b';}
   if(o.pegandoFogo&&!o.destruido){const fire=root.createElement('span');fire.className='nova-fire';fire.title='Em chamas';fire.textContent='🔥';node.append(fire);}
   if(o.destruido&&o.telhadoQuebradoV203){node.style.opacity='0';node.style.pointerEvents='none';}else if(o.destruido&&o.pincelV203){node.style.filter='brightness(.2) contrast(1.35) sepia(.35)';node.style.opacity='.92';node.title='Queimado';}else if(o.destruido){node.style.filter='grayscale(1)';node.style.opacity='.45';const badge=root.createElement('span');badge.textContent='💥 Restos';badge.style.cssText='position:absolute;top:100%;left:0;white-space:nowrap;background:#181827;color:#ddd;font-size:12px';node.append(badge);}
   if(o.clock){const timer=root.createElement('small');timer.dataset.effectClock='';timer.effectClock=o.clock;timer.textContent=textoDuracao(o.clock,mapPacket?.combat);timer.style.cssText='position:absolute;top:100%;left:0;background:#151b32;color:white;white-space:nowrap';node.append(timer);}
   return node;
  };
  const vistos=new Set();
  for(const o of [...(scene.objects||[])].sort((a,b)=>(a.ordemOficina||0)-(b.ordemOficina||0))){
   if(o.clock&&tempoRestante(o.clock,mapPacket?.combat)<=0)continue;
   const id=String(o.id);vistos.add(id);
   const antes=sceneNodes.get(id);if(antes&&antes.o===o&&antes.node.isConnected)continue;
   const node=criarNo(o);
   if(antes?.node?.isConnected)antes.node.replaceWith(node);else world().append(node);
   sceneNodes.set(id,{o,node});
  }
  for(const [id,ex] of [...sceneNodes])if(!vistos.has(id)){ex.node.remove();sceneNodes.delete(id);}
 }
 function fail(e){
  const detail=String(e.code||e.message||e);
  error=detail.includes('permission-denied')?
   'O Firebase recusou a operação (permission-denied). '+(e?.context?'Etapa: '+e.context+'. ':'')+'Nenhuma alteração dessa operação foi confirmada. Confira as regras publicadas no Firestore.':
   `Não foi possível salvar/sincronizar: ${detail}. O movimento não confirmado volta ao último ponto salvo.`;
  status();console.error('[Sync direta]',e);
 }
 function drawHistory(){
  const box=el('novaSyncHistory'),gm=el('novaSyncGmHealth');if(!box)return;
  const own=user()?.master?null:user()?.uid;
  const title=el('novaSyncHistoryTitle');if(title)title.textContent=user()?.master?'Histórico completo':'Seu histórico';
  const entries=(history.entries||[]).filter(e=>!own||e.donoUid===own||e.actorUid===own||e.targetUid===own);
  box.replaceChildren();for(const e of entries.slice().reverse()){
   const row=root.createElement('div');row.className='nova-history-row';
   const message=!own?e.message:e.targetUid===own?(e.defenderMessage||e.message):(e.attackerMessage||e.message);
   const msg=String(message||'Ação registrada'),low=msg.toLocaleLowerCase('pt-BR');
   if(/fiasco|falha|não realizado|nao realizado|bloquead|não atingiu|nao atingiu/.test(low))row.classList.add('nova-history-failure');
   else if(/crítico|critico/.test(low))row.classList.add('nova-history-critical');
   else if(/sucesso|bem-suced/.test(low))row.classList.add('nova-history-success');
   if(/dano|ferimento|pv |armadura/.test(low))row.classList.add('nova-history-damage');
   if(/psi|psíqu|psiqu/.test(low))row.classList.add('nova-history-psi');
   const time=root.createElement('span');time.className='nova-history-time';time.textContent=new Date(e.ts||Date.now()).toLocaleTimeString();
   const text=root.createElement('span');text.className='nova-history-text';text.textContent=msg;
   row.append(time,text);box.append(row);
  }
  if(gm){
   // v144: só NPCs e criaturas DESTE mapa, só em combate (turnos ou tempo real), e o quadro recolhe/abre
   let emLuta=!!mapPacket?.combat?.active;try{emLuta=emLuta||!!globalThis.mesaTempoRealV111?.ativo?.();}catch(_){}
   const lista=user()?.master&&emLuta?tokensOnCurrentMap().filter(t=>decodeURIComponent(String(t.id)).startsWith('sync')&&health.actors?.[t.id]?.combateLab):[];
   gm.hidden=!lista.length;gm.replaceChildren();
   let abertoPV=true;try{abertoPV=viewStorage?.getItem('mesa:pvPartesAberto')!=='0';}catch(_){}
   if(lista.length){const cab=root.createElement('button');cab.type='button';cab.className='btn-small';cab.style.cssText='width:100%;text-align:left;margin-bottom:4px';cab.textContent=(abertoPV?'▾':'▸')+' 🩸 PV por parte do corpo · '+lista.length+' no mapa';cab.title=abertoPV?'Recolher':'Mostrar';
    cab.addEventListener('click',()=>{try{viewStorage?.setItem('mesa:pvPartesAberto',abertoPV?'0':'1');}catch(_){}drawHistory();});gm.append(cab);}
   if(abertoPV)for(const t0 of lista){const id=t0.id;
    const t=tokens.get(id)||t0,h=health.actors?.[id]?.combateLab;if(!t||!h)continue;
    const row=root.createElement('div');row.className='nova-gm-health-row';
    const title=root.createElement('strong');title.textContent=displayName(t);row.append(title);
    const grid=root.createElement('div');grid.className='nova-pv-grid';
    const order=['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda'];
    for(const loc of Object.keys(h.hitMax||{}).sort((a,b)=>(order.includes(a)?order.indexOf(a):99)-(order.includes(b)?order.indexOf(b):99))){
     const cell=root.createElement('div');cell.className='nova-pv-cell';
     for(const [tag,text]of [['small',loc],['b',`PV ${h.hit?.[loc]??h.hitMax[loc]}/${h.hitMax[loc]}`],['small',`PA ${h.armor?.[loc]||0}`]]){const n=root.createElement(tag);n.textContent=text;cell.append(n);}grid.append(cell);
    }row.append(grid);gm.append(row);
   }
  }
 }
 function close(){closeWorkshop();sharedDrawStop?.();sharedDrawStop=null;sharedDrawMap='';sharedDrawDocs.clear();sharedDrawMode=false;sharedDrawGesture=null;creatureStop?.();creatureStop=null;sheetStop?.();sheetStop=null;sheetWatch='';clearInterval(clockTimer);clockTimer=null;el('novaPsiInbox')?.remove();dismissedPsi.clear();editor.close({keepDraft:!!user()?.master});attacks?.close();attacks=null;health={actors:{},revision:0};history={entries:[]};held=null;selectedTarget='';placementChoice='';catalogChecked.clear();cancelAnimationFrame(frame);generation++;stop?.();stopMap?.();stopScene?.();stopViewScene?.();stopHistory?.();stopScene=null;stopViewScene=null;stopHistory=null;sceneData=null;sharedSceneData=null;sceneRequest++;stop=null;stopMap=null;account='';tokens.clear();previews.clear();queues.clear();mapPacket=null;sharedMapPacket=null;mapData=null;renderedMap=null;mapRequest++;}
 let saudeCacheV153=null,saudeCacheEmV153=0;const saudeForaV153=async()=>{if(!saudeCacheV153||Date.now()-saudeCacheEmV153>5000){saudeCacheV153=await database.get(HEALTH_PATH)||{};saudeCacheEmV153=Date.now();}return saudeCacheV153;};
 function open(){
  const u=user();if(!u)return;if(account===u.uid&&stop)return;close();account=u.uid;error='';const g=generation;
  stop=database.subscribe(POSITION_PATH,rows=>{
   if(g!==generation)return;posicoesCarregadasV140=true;
   for(const row of rows){
    if(row.removed){tokens.delete(row.id);continue;}
    const t={...row.data,id:row.id},old=tokens.get(row.id);
    if(!old||t.revision>=old.revision)tokens.set(row.id,t);
   }
   drawSuaveV203();void ensurePlayerView();
  },fail);
  stopMap=database.subscribeDoc(MAP_PATH,async p=>{
   if(g!==generation)return;
   if(p?.combat?.session===sharedMapPacket?.combat?.session&&Number(p?.combat?.sequence)<Number(sharedMapPacket?.combat?.sequence))return;
   try{if(user()?.master)closeWorkshop();await applyMapView(p||null,{force:String(desiredViewMapId())!==String(mapPacket?.mapId||'')});}
   catch(e){if(g===generation)fail(e);}
  },fail);
  stopScene=database.subscribeDoc(SCENE_PATH,async scene=>{
   const request=++sceneRequest;
   try{
    const normalized=await normalizeScene(scene);
    if(g!==generation||request!==sceneRequest)return;
    sharedSceneData=normalized;
    if(String(mapPacket?.mapId||'')===String(sharedMapPacket?.mapId||'')){
     const separateBefore=sceneData?.mapId===mapPacket?.mapId&&sceneData?.objetosMapaImportados;
     sceneData=normalized;
     if(separateBefore!==(sceneData?.mapId===mapPacket?.mapId&&sceneData?.objetosMapaImportados))renderedMap=null;
     draw();editor.paint();if(user()?.master)void syncScene();
    }
   }catch(e){if(g===generation)fail(e);}
  },fail);
  creatureStop=database.subscribeDoc('combatesAtivos/mapaMesaSyncCriaturas',()=>{sheetRevision++;queueMicrotask(()=>status());},fail);
  stopHistory=database.subscribeDoc(HISTORY_PATH,value=>{if(g!==generation)return;history=value||{entries:[]};drawHistory();},fail);
  if(prepareAttack)attacks=conectarAtaques({database,user,tokens:()=>tokensOnCurrentMap(),prepare:prepareAttack,prepareSupport,onError:fail,onHealth:value=>{
   if(g!==generation)return;health=value;drawSuaveV203();const event=value.event;
   if(event&&event.id!==lastEffect){lastEffect=event.id;if(Date.now()-event.ts<5000&&event.source&&event.target){let novo=false;try{novo=!!visual?.ataque(event);}catch(_){}if(!novo)mostrarAtaque(board,event);try{playAttackSound(event);}catch(_){}}}
  }});
  if(!clockTimer)clockTimer=setInterval(()=>{paintClocks();drawScene();syncDurations();syncFire();},1000);
  draw();
 }
 async function initialize(){
  open();if(!user()?.master||mapPacket?.combat?.active)return;
 try{
   const mapaId=el('novaSyncMapa')?.value;
   if(mapaId){const m=(mapas()||[]).find(x=>String(x.id)===String(mapaId));if(m)await database.writeMap(MAP_PATH,{mapId:String(m.id),nome:String(m.nome||m.id),fundo:String(m.fundo||''),larguraM:Number(m.larguraM)||28,alturaM:Number(m.alturaM)||14});}
   const legacy=await database.get('combatesAtivos/mapaMesaSyncNova');
   const source=legacy?.estado?.tokens?.length?legacy.estado.tokens:characters();
   for(const [i,t] of source.entries()){
    if(!t.id)continue;
    const id=String(t.id),path=POSITION_PATH+'/'+encodeURIComponent(id);
    await database.transact(async tx=>{
     if(await tx.get(path))return;
     tx.set(path,{nome:String(t.nome||'Personagem'),imagem:String(t.miniatura?.url||t.imagem||''),donoUid:String(t.donoUid||t.dono||''),
     x:Math.max(.7,Math.min(27.3,Number.isFinite(t.x)?t.x:4+i*3)),y:Math.max(.8,Math.min(13.2,Number.isFinite(t.y)?t.y:7)),camada:camadaEntidade(t),facing:Number.isFinite(t.facing)?t.facing:0,mapaId:String(mapaId||mapPacket?.mapId||''),revision:0});
    });
   }
  }catch(e){fail(e);}
 }
 // Keep every segment of the preview. One transaction batches the waiting
 // segments, so latency cannot turn a detour into a chord through a character.
 async function save(id,points,facing){
  if(!controlled(tokens.get(id)||{}))return;
  if(!points.length)return;
  // v94: capture o mapa que ESTE cliente está vendo. Durante exploração ele
  // pode ser diferente do mapa global aberto pelo mestre, e isso é normal.
  const movementMapId=String(mapPacket?.mapId||'');
  const combatHere=!!sharedMapPacket?.combat?.active&&String(sharedMapPacket?.mapId||'')===movementMapId;
  const expectedTurn=combatHere?sharedMapPacket.combat.turnId:null;
  const localMap={mapId:movementMapId,nome:String(mapPacket?.nome||''),fundo:String(mapPacket?.fundo||''),larguraM:Number(mapPacket?.larguraM)||28,alturaM:Number(mapPacket?.alturaM)||14,combat:{active:false}};
  const existing=queues.get(id);if(existing){existing.points.push(...points);if(Number.isFinite(facing))existing.facing=facing;return;}
  const q={points:[...points],facing:Number.isFinite(facing)?facing:null},g=generation;queues.set(id,q);status();
  try{
   while(q.points.length&&g===generation){
    const pathPoints=q.points.splice(0);
    const result=await database.transact(async tx=>{
     const globalState=await tx.get(MAP_PATH);
     if(!user()?.master&&(await tx.get('combatesAtivos/mesaTempoReal'))?.pausaEmergencia)throw Error('Jogo pausado pelo mestre.');
     const path=POSITION_PATH+'/'+id,t=await tx.get(path);
     const combateAqui=!!globalState?.combat?.active&&String(globalState?.mapId||'')===movementMapId;
     const hp=combateAqui?await tx.get(HEALTH_PATH):await saudeForaV153(); // v153: fora de combate a saúde não entra na transação
     if(!t)throw new Error('Personagem não encontrado');
     if(String(t.mapaId||'')!==movementMapId)throw new Error('Este personagem está em outro mapa.');
     // Só o mapa que realmente contém o combate usa o estado global da Mesa.
     // Em qualquer outro mapa, o jogador continua em exploração independente.
     const activeCombatHere=!!globalState?.combat?.active&&String(globalState?.mapId||'')===movementMapId;
     const state=activeCombatHere?globalState:localMap;
     const scenePath=String(globalState?.mapId||'')===movementMapId?SCENE_PATH:archivePath(movementMapId);
     const savedScene=movementMapId?(combateAqui?await tx.get(scenePath):await database.get(scenePath)):null;
     if(ocupado(hp?.actors?.[id],activeCombatHere?state?.combat:null))throw Error('Primeiros Socorros impede movimento neste turno.');
     // v153: fora de combate não lê as outras miniaturas dentro da transação. NPCs andando (vida, guardas, trabalhadores)
     // mudavam esses documentos o tempo todo, a transação era refeita várias vezes e falhava — e a miniatura "voltava".
     // Fora de combate só paredes e móveis barram; miniaturas passam umas pelas outras (sem empurra-empurra no bar).
     const others=activeCombatHere?await Promise.all([...tokens.keys()].filter(key=>key!==id&&tokenOnCurrentMap(tokens.get(key))).map(async key=>{const value=await tx.get(POSITION_PATH+'/'+key);return value?{...value,id:key}:null;})):[];
     const acceleration=hp?.actors?.[id]?.psiEffects?.aceleracao;
     let moved={...t,id,...(acceleration?.untilRound>(state?.combat?.round||0)?{movementMax:30}:{})},blocked=false;
     for(const next of pathPoints){
      const destination=destinoSemColisao(moved,next,others.filter(Boolean).filter(o=>globalThis.mesaAndarV144?.mesmoAndar?.(id,o.id)!==false),state,(savedScene&&String(savedScene.mapId||'')===movementMapId?savedScene.objects||[]:[]).filter(o=>globalThis.mesaAndarV144?.colide?.(id,o)!==false&&!globalThis.mesaPassavelV170_?.(o)));
      moved=moverNoTurno(moved,destination,state,activeCombatHere?expectedTurn:null);
      if(Math.hypot(moved.x-next.x,moved.y-next.y)>.001){blocked={x:next.x,y:next.y};break;}
     }
     const {id:ignored,...value}=moved;
     // O bônus é temporário e vem da saúde; preservar o deslocamento base na posição.
     if(t.movementMax===undefined)delete value.movementMax;else value.movementMax=t.movementMax;
     if(Number.isFinite(q.facing))value.facing=q.facing;
     value.revision=t.revision+1;tx.set(path,value);return {value,blocked};
    });
    if(g!==generation)return;
    const saved=result.value;
    error='';
    if(!tokens.has(id)||saved.revision>=tokens.get(id).revision)tokens.set(id,{...saved,id});
    if(result.blocked){
     try{globalThis.mesaBloqueioV173_?.(id,{para:result.blocked,parou:{x:Number(saved.x),y:Number(saved.y)},mapa:movementMapId});}catch(_){} // v173: esbarrou numa caixa leve → empurra / pula
     q.points.length=0;if(held?.id===id){held=null;cancelAnimationFrame(frame);}
     error='Movimento interrompido: o caminho foi ocupado ou o movimento disponível terminou.';
    }
   }
  }catch(e){if(g===generation){held=null;cancelAnimationFrame(frame);fail(e);}}
  finally{if(g===generation){queues.delete(id);if(held?.id!==id)previews.delete(id);draw();}}
 }
 const board=el('novaSyncBoard');
 // v103: camada visual opcional (luz, névoa, clima, efeitos). Carregada à parte:
 // se o arquivo faltar ou falhar, o mapa segue exatamente como antes.
 var visual=null;
 if(board)import('./mesa-visual.js?v=138').then(m=>{try{visual=m.criarMesaVisual({root,database,board:()=>el('novaSyncBoard')});globalThis.mesaVisualV205=visual;visualSync();}catch(e){console.warn('[Mesa Visual] não iniciada',e);}}).catch(e=>console.warn('[Mesa Visual] indisponível; mapa clássico mantido.',e));
 function visualSync(){
  if(!visual)return;
  try{
   const id=String(mapPacket?.mapId||'');
   visual.sync({user:user(),mapId:id,larguraM:Number(mapPacket?.larguraM)||28,alturaM:Number(mapPacket?.alturaM)||14,combate:!!mapPacket?.combat?.active,
    tokens:tokensOnCurrentMap().map(t=>({...t,...(previews.get(t.id)||{}),saude:health.actors?.[t.id]?.combateLab||null})),
    objetos:sceneData?.mapId===id?(sceneData.objects||[]):[],
    formas:id&&mapData?.oficina2State?.elements||[]});
  }catch(e){console.warn('[Mesa Visual]',e);}
 }
 const editor=criarEditorMesa({board,root,database,scenePath:SCENE_PATH,mapPath:MAP_PATH,positionPath:POSITION_PATH,enabled:masterMode,map:()=>mapPacket,scene:()=>sceneData?.mapId===(mapPacket?.mapId||'')?sceneData:null,fail,changed:draw,tokens:()=>tokens,archivePath});
 try{globalThis.mesaRascunhoMapaV193=editor.rascunho;}catch(_){}
 // v263: salvar deve ficar acessível fora da área do mapa e mostrar se há rascunho.
 // Os controles destrutivos/raramente usados permanecem disponíveis em um menu.
 const saveBarV263=el('mesaSaveBarV263'),saveButtonV263=el('mesaSaveButtonV263');
 const saveStatusV263=el('mesaSaveStatusV263'),advancedV263=el('mesaAdvancedActionsContentV263');
 if(advancedV263){
  for(const id of ['novaSyncRandom','novaSyncClear','novaSyncRestore']){
   const control=el(id);
   if(control)advancedV263.append(control);
  }
 }
 let avisoSalvarV263='',salvandoV263=false;
 function atualizarSaveV263(){
  if(!saveBarV263||!saveButtonV263)return;
  const habilitado=!!user()?.master;
  saveBarV263.hidden=!habilitado;
  if(!habilitado)return;
  const r=editor.rascunho;
  const pendentes=Number(r.pendentes)||0;
  const ocupado=salvandoV263||!!r.ocupado,editandoComoMestre=!!r.ativo();
  saveButtonV263.disabled=ocupado||!pendentes||!editandoComoMestre;
  saveButtonV263.textContent=ocupado?'⏳ Salvando…':pendentes?'💾 Salvar mapa ('+pendentes+')':'✓ Mapa salvo';
  if(saveStatusV263){
   saveStatusV263.textContent=ocupado?'Gravando alterações…':
    !editandoComoMestre?'Para editar o cenário, selecione Mestre em “Atuar como” acima.':
    pendentes?pendentes+' alteração(ões) NÃO salva(s).'+(avisoSalvarV263?' '+avisoSalvarV263:''):
    avisoSalvarV263||'Sem alterações pendentes.';
   saveStatusV263.style.color=pendentes?'#ffdc9b':'#c1dfce';
  }
 }
 if(saveButtonV263)saveButtonV263.addEventListener('click',async()=>{
  if(salvandoV263||!user()?.master)return;
  const r=editor.rascunho;
  if(!r.ativo()||!r.pendentes)return;
  salvandoV263=true;avisoSalvarV263='';atualizarSaveV263();
  try{
   const resp=await r.salvar();
   if(resp?.estado!=='confirmado'){
    throw Error(resp?.erro?.message||'Não houve confirmação de salvamento: '+String(resp?.estado||'desconhecido'));
   }
   avisoSalvarV263='✓ Salvo e sincronizado.';
  }catch(e){
   avisoSalvarV263='⚠ Erro ao salvar: '+String(e?.message||e);
   // Não limpar o rascunho se a gravação falhar.
   console.error('[Mapa] salvar v263:',e);
  }finally{salvandoV263=false;atualizarSaveV263();}
 });
 globalThis.addEventListener('mesa-rascunho-v197',()=>{avisoSalvarV263='';atualizarSaveV263();});
 atualizarSaveV263();

 function closeWorkshop(){if(workshopHandle){workshopDraft=workshopHandle.getState();workshopDirty=workshopHandle.dirty;workshopHandle.close();workshopHandle=null;}catalogChecked.clear();catalogKey='';board.style.removeProperty('display');const details=el('novaOficinaPanel');if(details)details.open=false;drawCatalog();}
 if(workshop){
  const details=root.createElement('details');details.id='novaOficinaPanel';details.style.cssText='margin:12px 0;border:1px solid #34506d;border-radius:10px;padding:10px;max-width:100%;';
  const summary=root.createElement('summary');summary.textContent='🛠️ Editar mapa · Oficina 2';summary.style.cursor='pointer';const host=root.createElement('div');host.style.marginTop='8px';const topbar=root.createElement('div');topbar.className='nova-workshop-toolbar-v102';const discard=root.createElement('button');discard.textContent='↻';discard.title='Recarregar cenário / descartar rascunho';discard.className='icon-btn-v102';discard.type='button';discard.onclick=()=>{if(workshopHandle?.busy)return;if(!root.defaultView.confirm('Descartar as edições locais e carregar o cenário salvo?'))return;closeWorkshop();workshopDraft=null;workshopBase=null;setTimeout(()=>{details.open=true;},0);};topbar.append(discard);details.append(summary,topbar,host);board.parentElement.insertBefore(details,board);
  details.addEventListener('toggle',()=>{if(!details.open){closeWorkshop();return;}if(!user()?.master){details.open=false;return;}
   if(workshopMap!==(mapPacket?.mapId||'')){workshopDraft=null;workshopBase=null;workshopMap=mapPacket?.mapId||'';}
   workshopBase??=structuredClone(sceneData&&String(sceneData.mapId||workshopMap)===String(workshopMap)?sceneData:{mapId:workshopMap,objects:[]}); // v146: nunca a cena de outro mapa
   try{workshopHandle=workshop({host,map:{...mapData,id:workshopMap,larguraM:mapPacket?.larguraM||28,alturaM:mapPacket?.alturaM||14},scene:editor.preview()||workshopBase,draft:workshopDraft,tokens:()=>tokensOnCurrentMap(),onSave:async publication=>{
    if(!user()?.master)throw Error('Somente o mestre pode salvar.');const expected=workshopMap;let result;
    await database.transact(async tx=>{const state=await tx.get(MAP_PATH),fresh=await tx.get(SCENE_PATH),stored=expected?await tx.get('mapas/'+expected):null;
     if((state?.mapId||'')!==expected)throw Error('O mapa ativo mudou. Reabra a edição.');
     if(publication.config.w!==Number(state.larguraM||28)||publication.config.h!==Number(state.alturaM||14))throw Error('Na mesa, mantenha o tamanho do mapa para preservar as posições. Redimensione pela Oficina fora da mesa.');
     result=publicarOficina(fresh||{mapId:expected,objects:[]},workshopBase,publication);result.mapId=expected;
     const data=JSON.parse(JSON.stringify(result)),savedMap=stored?mapaComCenaOficina(stored,data):null;
     validarTamanhoOficina(data);if(savedMap)validarTamanhoOficina(savedMap);
     tx.set(SCENE_PATH,data);if(expected){tx.set(archivePath(expected),data);if(savedMap)tx.set('mapas/'+expected,savedMap);}
    });try{void root.defaultView.mesaFixosV143_?.anotar?.(expected,workshopBase,result)?.catch?.(()=>{});}catch(_){} // v143
    workshopBase=structuredClone(result);workshopDirty=false;editor.close();error='';draw();
   }});
   for(const [id,icon,title] of [['gm2publish','💾','Salvar mapa atual'],['gm2upload','🖼','Importar mapa ou imagem'],['gm2saveas75','＋','Salvar como novo mapa'],['gm2delete75','🗑','Excluir mapa']]){const b=root.getElementById(id);if(b){b.textContent=icon;b.title=title;b.classList.add('icon-btn-v102');topbar.append(b);}}
   board.style.display='none';catalogKey='';drawCatalog();}catch(e){closeWorkshop();fail(e);}
  });
  root.defaultView.novaOficinaFechar_=closeWorkshop;root.defaultView.addEventListener('beforeunload',event=>{if(workshopHandle?.dirty||workshopDirty){event.preventDefault();event.returnValue='';}});
 }
 function point(e){const r=board.getBoundingClientRect();return {x:Math.max(0,Math.min(28,(e.clientX-r.left)/r.width*28)),y:Math.max(0,Math.min(14,(e.clientY-r.top)/r.height*14))};}
 function pointToken(e,t){return conterTokenNoMapa(t,point(e),mapPacket||{});}
 // v208 — clique para mover (estilo MMO): toque no chão anda até lá desviando de paredes/portas.
 function computarRota(t,destino28){
  const w=Number(mapPacket?.larguraM)||28,hh=Number(mapPacket?.alturaM)||14;
  const objs=(sceneData&&sceneData.mapId===mapPacket?.mapId?sceneData.objects||[]:[]).filter(o=>o&&o.bloqueiaMovimento&&!o.destruido&&!globalThis.mesaPassavelV170_?.(o)&&globalThis.mesaAndarV144?.colide?.(t.id,o)!==false);
  try{
   // v211: a grade infla os obstáculos pelo RAIO REAL do corpo que vai andar (0,8× o diâmetro).
   // Antes usava o padrão 0,45 m de folga: miniaturas largas (2 m+) recebiam rotas por corredores
   // estreitos demais e travavam na parede no meio do caminho.
   const grade=montarGrade(objs.map(o=>({x:Number(o.x)*w/28,y:Number(o.y)*hh/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),w,hh,{passo:w>40?1:.5,raio:Math.max(.3,raioParaObjetos(t))});
   const M=p=>({x:Number(p.x)*w/28,y:Number(p.y)*hh/14}),pts=caminho(grade,M(t),M(destino28))||[];
   const out=pts.slice(1).map(p=>({x:Math.max(0,Math.min(28,p.x*28/w)),y:Math.max(0,Math.min(14,p.y*14/hh))}));
   out.push(destino28);
   return out;
  }catch(_){return [destino28];}
 }
 // toque (clique sem arrastar) no chão: o personagem caminha até o ponto pela rota livre.
 function tapParaAndar(e){
  const h=held;if(!h||h.pad)return false;
  if(performance.now()-h.time>450||!h.downPt)return false;
  const w=Number(mapPacket?.larguraM)||28,hh=Number(mapPacket?.alturaM)||14,p=point(e);
  if(Math.hypot((p.x-h.downPt.x)*w/28,(p.y-h.downPt.y)*hh/14)>.3)return false; // foi arrasto, não toque
  const t=previews.get(h.id)||tokens.get(h.id);if(!t)return false;
  const rota=computarRota(t,p);if(!rota.length)return false;
  h.target=rota[0];h.rota=rota.slice(1);h.pointer='rota';h.sent=performance.now();
  if(!frame)frame=requestAnimationFrame(step); // v210: garante a cadeia mesmo se o lostpointercapture soltar o held antes do 1º quadro
  return true;
 }
 function release(){
  const h=held;if(!h)return;held=null;cancelAnimationFrame(frame);
  if(h.trail.length)save(h.id,h.trail.splice(0),h.facing);
  else if(!queues.has(h.id)){previews.delete(h.id);draw();}
  status();
 }
 const levantarEm=new Map();
 function step(now){
  const h=held;if(!h)return;
  frame=0; // v210: o quadro desta cadeia já está rodando; tap-para-andar pode reagendar se necessário
  if(!user()?.master&&globalThis.mesaJogoPausadoV214?.()){h.trail=[];previews.delete(h.id);held=null;cancelAnimationFrame(frame);draw();return;}
  // v211: em páginas pesadas (mapas grandes) o RAF pode cair para ~5 quadros/s; o clamp de dt travava a
  // velocidade real em ~0,7 m/s. Agora o tempo acumulado roda em sub-passos de ≤50 ms (colisão segura)
  // até 350 ms por quadro — a velocidade de 3 m/s se mantém mesmo com o jogo lento.
  let resto=Math.min(.35,(now-h.time)/1000);h.time=now;
  let t=previews.get(h.id)||tokens.get(h.id);
  if(globalThis.mesaRepouso?.emRepouso?.(h.id)){const k=Date.now();if(!(levantarEm.get(h.id)>k-2500)){levantarEm.set(h.id,k);void globalThis.mesaLevantarAoAndarV205?.(h.id).catch(()=>{});}} // v205: andar tira de sentado/deitado
  const w=Number(mapPacket?.larguraM)||28,height=Number(mapPacket?.alturaM)||14;
  try{
   const vArr=Number(mapPacket?.combat?.active?1:(globalThis.mesaAtitudesRT?.velocidade?.(h.id)??1))*Number(globalThis.mesaVelocidadeV136?.(h.id)??1)*Number(globalThis.mesaPosturaVelocidadeV140?.(h.id)??1)*Number(globalThis.mesaTransporteVelocidadeV190?.(h.id)??1)*Number(globalThis.mesaCorrerVelocidadeV205?.(h.id)??1); /* v205: 🏃 correr */ // v136: arrastar deixa mais lento · v140: postura
   const ign=o=>!globalThis.mesaArrastoIgnorar?.(h.id,o.id);
   const doAndar=o=>globalThis.mesaAndarV144?.colide?.(h.id,o)!==false&&!globalThis.mesaPassavelV170_?.(o),mesmoAndar=o=>globalThis.mesaAndarV144?.mesmoAndar?.(h.id,o.id)!==false; // v144: andares
   const outrosT=tokensOnCurrentMap().map(t=>previews.get(t.id)||t).filter(ign).filter(mesmoAndar),objs=(sceneData&&sceneData.mapId===mapPacket?.mapId?sceneData.objects||[]:[]).filter(ign).filter(doAndar);
   const prog=q=>Math.hypot((q.x-t.x)*w/28,(q.y-t.y)*height/14);
   let andou=false;
   while(resto>1e-4){
    const dt=Math.min(.05,resto);resto-=dt;
    const distance=Math.hypot((h.target.x-t.x)*w/28,(h.target.y-t.y)*height/14);
    if(distance<.08){if(h.rota?.length){h.target=h.rota.shift();continue;}break;} // v208: próximo waypoint do clique-para-mover
    if(distance<=0)break;
    const ratio=Math.min(1,(h.shift?1.5:3)*vArr*dt/distance);
    const want={x:t.x+(h.target.x-t.x)*ratio,y:t.y+(h.target.y-t.y)*ratio};
    let dest=destinoSemColisao(t,want,outrosT,mapPacket,objs);
    // v120: encostou numa parede/objeto? desliza ao longo dele (só no eixo livre) em vez de travar na quina
    if(prog(dest)<prog(want)*.5){const ax=destinoSemColisao(t,{x:want.x,y:t.y},outrosT,mapPacket,objs),ay=destinoSemColisao(t,{x:t.x,y:want.y},outrosT,mapPacket,objs);const melhor=prog(ax)>=prog(ay)?ax:ay;if(prog(melhor)>prog(dest)+.0005)dest=melhor;}
    const p=moverNoTurno(movimentoPsi(t),dest,mapPacket,h.turn);
    if(p.x===t.x&&p.y===t.y)break; // travou numa parede: para de gastar o resto do tempo
    if(!h.shift){const dx=(p.x-t.x)*w/28,dy=(p.y-t.y)*height/14;if(Math.hypot(dx,dy)>.001)h.facing=Math.atan2(dy,dx);p.facing=h.facing;}
    t=p;previews.set(h.id,p);andou=true;
    h.trail.push({x:p.x,y:p.y});
   }
   if(andou){draw();
    if(now-h.sent>=200){h.sent=now;save(h.id,h.trail.splice(0),h.facing);}}
  }catch(e){release();error=e.message;status();return;}
  frame=requestAnimationFrame(step);
 }
 // v137: andar com controle (gamepad): direção da alavanca analógica; leve = devagar (sem virar), forte = normal.
 function andarDirecao(dx,dy){
  if(!user()?.master&&globalThis.mesaJogoPausadoV214?.())return false;
  const mag=Math.min(1,Math.hypot(Number(dx)||0,Number(dy)||0));
  if(mag<.2){if(held?.pad)release();return false;}
  if(attacking||managing)return false;
  const id=selectedActor()?.id,t0=id?tokens.get(id):null;if(!t0||!controlled(t0))return false;
  const t=previews.get(id)||t0,w=Number(mapPacket?.larguraM)||28,hh=Number(mapPacket?.alturaM)||14;
  const alcance=1.5*Math.max(1,Number(globalThis.mesaCorrerVelocidadeV205?.(id)??1)); /* v205: correndo, o alvo de cada pedido fica mais longe (senão o personagem chega ao alvo e espera a renovação) */
  const alvo=conterTokenNoMapa(t,{x:Math.max(0,Math.min(28,t.x+dx/mag*alcance*28/w)),y:Math.max(0,Math.min(14,t.y+dy/mag*alcance*14/hh))},mapPacket||{});
  if(held?.pad&&held.id===id){held.target=alvo;held.shift=mag<.55;return true;}
  const state=health.actors?.[id]?.combateLab;
  if(ocupado(health.actors?.[id],mapPacket?.combat)||state?.morto||state?.inconsciente||state?.incapacitado)return false;
  try{const turn=mapPacket?.combat?.active?mapPacket.combat.turnId:null;moverNoTurno(t,{x:t.x,y:t.y},mapPacket,turn);
   release();held={id,target:alvo,turn,pointer:'pad',pad:true,time:performance.now(),sent:performance.now(),trail:[],shift:mag<.55,facing:Number.isFinite(t.facing)?t.facing:0};
   frame=requestAnimationFrame(step);return true;
  }catch(e){if(error!==e.message){error=e.message;status();}return false;}
 }
 function pararAndar(){if(held?.pad)release();}
 board.addEventListener('pointermove',e=>{
  if(sharedDrawGesture&&e.pointerId===sharedDrawGesture.pointer){const p=point(e),pts=sharedDrawGesture.stroke.points,last=pts.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)>.025&&pts.length<1600){pts.push(p);drawSharedInk();}return;}
  if(turning&&e.pointerId===turning.pointer){const t=previews.get(turning.id)||tokens.get(turning.id);if(t){const p=point(e),w=Number(mapPacket?.larguraM)||28,h=Number(mapPacket?.alturaM)||14;const angle=Math.atan2((p.y-t.y)*h/14,(p.x-t.x)*w/28);previews.set(turning.id,{...t,facing:angle});draw();}return;}
  if(held&&e.pointerId===held.pointer){if(!(e.buttons&1))release();else{const t=previews.get(held.id)||tokens.get(held.id);held.target=pointToken(e,t);}}
 });
 const finishTurning=()=>{if(!turning)return;const r=turning;turning=null;const t=previews.get(r.id)||tokens.get(r.id);previews.delete(r.id);if(t&&Number.isFinite(t.facing))database.transact(async tx=>{const path=POSITION_PATH+'/'+r.id,current=await tx.get(path);if(!current)throw new Error('Personagem não encontrado');tx.set(path,{...current,facing:t.facing,revision:Number(current.revision||0)+1});}).catch(fail).finally(draw);};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])board.addEventListener(event,e=>{
  if(sharedDrawGesture&&e.pointerId===sharedDrawGesture.pointer){const g=sharedDrawGesture;sharedDrawGesture=null;if(event==='pointerup'&&g.stroke.points.length>1){const own=mySharedDrawDoc();void saveMySharedDrawings([...(own.strokes||[]),g.stroke]);}else drawSharedInk();return;}
  if(turning&&e.pointerId===turning.pointer)finishTurning();
  else if(event==='pointerup'&&held&&e.pointerId===held.pointer&&!held.pad){if(!tapParaAndar(e))release();}
  else if(event==='lostpointercapture'&&held&&held.pointer==='rota'){/* v210: o toque já virou rota de caminhada; a captura some ao soltar o botão, mas o personagem segue andando sozinho */}
  else release();
 });
 root.defaultView?.addEventListener('blur',release);
 root.defaultView?.addEventListener('mesa-pausa-v214',()=>{
  if(!user()?.master&&globalThis.mesaJogoPausadoV214?.()){
   if(held){held.trail=[];previews.delete(held.id);held=null;cancelAnimationFrame(frame);}
   turning=null;
  }
  draw();
 });
 root.addEventListener('visibilitychange',()=>{if(root.hidden)release();});
 board.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  if(!user()?.master&&globalThis.mesaJogoPausadoV214?.()){fail(Error('Jogo pausado pelo mestre.'));return;}
  if(attacking||managing)return;
  if(sharedDrawMode&&mapPacket?.mapId){
   e.preventDefault();e.stopPropagation();const p=point(e);sharedDrawGesture={pointer:e.pointerId,stroke:{id:crypto.randomUUID(),color:el('novaSyncSharedDrawColor')?.value||'#ffd447',width:3,opacity:1,points:[p]}};board.setPointerCapture(e.pointerId);drawSharedInk();return;
  }
  const chosen=placementChoice;
  if(chosen&&user()?.master&&!mapPacket?.combat?.active){const raw=point(e),entry=catalog().find(t=>String(t.id)===chosen);place(chosen,conterTokenNoMapa(entry||{},raw,mapPacket||{}));return;}
  if(editor.begin(e))return;
  const clicked=e.target.closest('[data-token]')?.dataset.token;
  const handle=e.target.closest('[data-facing-handle]');
  if(handle){const node=handle.closest('[data-token]'),id=node?.dataset.token,t=tokens.get(id);if(!t||!controlled(t)|| (mapPacket?.combat?.active&&mapPacket.combat.activeId!==id))return;turning={id,pointer:e.pointerId};board.setPointerCapture(e.pointerId);e.preventDefault();return;}
  if(clicked){
   release();
   if(clicked===selectedActor()?.id)selectedTarget='';
   else if(controlled(selectedActor())){
    if(selectedTarget===clicked){try{root.defaultView.mesaAcoesMapaAbrir_?.(clicked);}catch(_){}} // v208: 2º clique no mesmo alvo abre ações (atacar/conversar/usar)
    else selectedTarget=clicked;
   }
   draw();
   return;
  }
  const id=selectedActor()?.id, t=id?tokens.get(id):null;
  if(!t||!controlled(t))return;
  const state=health.actors?.[id]?.combateLab;
  if(ocupado(health.actors?.[id],mapPacket?.combat)){error='Primeiros Socorros impede movimento e outras ações neste turno.';status();return;}
  if(state?.morto||state?.inconsciente||state?.incapacitado){error='Este personagem está inconsciente ou incapacitado e não pode se mover.';status();return;}
  e.preventDefault();
  try{
   const turn=mapPacket?.combat?.active?mapPacket.combat.turnId:null;
   moverNoTurno(previews.get(id)||t,{x:t.x,y:t.y},mapPacket,turn);
   release();held={id,target:pointToken(e,t),turn,pointer:e.pointerId,time:performance.now(),sent:performance.now(),trail:[],shift:e.shiftKey,facing:Number.isFinite(t.facing)?t.facing:0,downPt:point(e)};
   try{board.setPointerCapture(e.pointerId);}catch(_){}
   frame=requestAnimationFrame(step);
  }catch(e){error=e.message;status();}
 });
 async function place(chosen,p,opts={}){
  if(placing)return;const t0=catalog().find(t=>String(t.id)===chosen);if(!t0)return;
  placing=true;drawCatalog();let t=t0;
  try{
   let id=encodeURIComponent(t.id);
   // v112: várias cópias da mesma criatura/NPC (sufixo ~k), usado pela barra do mestre.
   if(opts.instancia&&/^sync(criatura|npc):/.test(String(t.id))){const mapa=String(mapPacket?.mapId||'');
    for(let k=1;k<99;k++){const cand=k===1?String(t.id):t.id+'~'+k,ex=await database.get(POSITION_PATH+'/'+encodeURIComponent(cand));
     if(!ex||String(ex.mapaId||'')!==mapa){id=encodeURIComponent(cand);if(k>1)t={...t,nome:String(t.nome||'')+' '+k};break;}}}
   if(String(t.id).startsWith('synccriatura:')){try{await globalThis.mesaAtitudesIaV200?.reiniciarCriatura?.(id);}catch(e){console.warn('[Criatura nova] não consegui zerar a saúde antiga',e?.code||e);}} // v200: criatura comum nova começa do zero
   if(String(t.id).startsWith('synccriatura:'))await loadActions({...t,id});
   const precisaFicha=!!mapPacket?.combat?.active||String(t.id).startsWith('syncnpc:');
   const entrant=precisaFicha?((await loadCombatants([{...t,id}]))||[])[0]:null;
   if(['objeto','item'].includes(t.catalogType)&&masterMode()){editor.addObject(criarObjeto(t,{id:crypto.randomUUID(),tipo:t.catalogType,...p}));el('novaSyncMestrePersonagem').value='';placementChoice='';return;}
   await database.transact(async tx=>{
    const s=await tx.get(MAP_PATH),existing=await tx.get(POSITION_PATH+'/'+id);
    if(['objeto','item'].includes(t.catalogType)){
     const scene=await tx.get(SCENE_PATH),objects=scene?.mapId===(s?.mapId||'')?scene.objects:[];
     const object=criarObjeto(t,{id:crypto.randomUUID(),tipo:t.catalogType,...p});
     tx.set(SCENE_PATH,{...(scene?.mapId===(s?.mapId||'')?scene:{}),mapId:s?.mapId||'',objects:[...objects,object]});return;
    }
    if(existing&&String(existing.mapaId||s?.mapId||'')===String(s?.mapId||''))throw new Error('Este personagem já está neste mapa.');
    const persistidos=String(t.id).startsWith('syncnpc:')&&entrant?.atributosIndividuo?{atributosIndividuo:structuredClone(entrant.atributosIndividuo)}:{};
    const tamanho=!['objeto','item'].includes(t.catalogType)&&tamanhosV112?{diametroM:tamanhosV112.tamanhoMiniaturaM(t)}:{};
    tx.set(POSITION_PATH+'/'+id,{...(existing||{}),...tamanho,nome:String(t.nome||'Personagem'),imagem:String(t.miniatura?.url||t.imagem||''),donoUid:String(t.donoUid||t.dono||''),facing:Number(existing?.facing||0),camada:camadaEntidade(t),...persistidos,...p,mapaId:String(s?.mapId||mapPacket?.mapId||''),revision:existing?Number(existing.revision||0)+1:0});
    if(s?.combat?.active&&entrant?.actions>0){
     const die=1+Math.floor(Math.random()*10),total=Number(entrant.initiative||0)+die,c={...s.combat,order:[...s.combat.order,id],queue:[...s.combat.queue],initial:{...s.combat.initial,[id]:{remaining:entrant.actions,passes:0}},actors:{...s.combat.actors,[id]:{remaining:entrant.actions,passes:0}},rolls:{...s.combat.rolls,[id]:{initiative:Number(entrant.initiative||0),die,total,owner:String(t.donoUid||t.dono||'')}}};
     c.order.sort((a,b)=>Number(c.rolls[b]?.total||0)-Number(c.rolls[a]?.total||0)||String(a).localeCompare(String(b)));
     const activeTotal=Number(s.combat.rolls?.[s.combat.activeId]?.total||0);
     if(total<activeTotal){const ix=Math.max(0,c.queue.indexOf(s.combat.activeId));c.queue.splice(ix+1,0,id);}
     tx.set(MAP_PATH,{...s,combat:c});
    }
   });
   el('novaSyncMestrePersonagem').value='';placementChoice='';error='';
  }catch(e){fail(e);}finally{placing=false;draw();}
 }
 el('novaSyncFocus')?.addEventListener('click',()=>{mapFocus=!mapFocus;try{viewStorage?.setItem('mesa:novaSyncMapFocus',mapFocus?'1':'0');}catch(_){}applyViewMode();});
 el('novaSyncHistoryToggle')?.addEventListener('click',()=>{historyVisible=!historyVisible;try{viewStorage?.setItem('mesa:novaSyncHistoryVisible',historyVisible?'1':'0');}catch(_){}applyViewMode();});
 applyViewMode();
 el('novaSyncMestrePersonagem')?.addEventListener('change',()=>{release();placementChoice='';drawCatalog();status();});
 el('novaSyncMestreTipo')?.addEventListener('change',()=>{placementChoice='';el('novaSyncMestrePersonagem').value='';drawCatalog();status();});
 el('novaSyncCatalog')?.addEventListener('toggle',()=>{catalogKey='';drawCatalog();});
 el('novaSyncCatalogSearch')?.addEventListener('input',()=>{catalogLimit=48;placementChoice='';drawCatalog();status();});
 el('novaSyncCatalogMore')?.addEventListener('click',()=>{catalogLimit+=48;drawCatalog();});
 el('novaSyncQuickSearch')?.addEventListener('focus',()=>{
  if(!user()?.master)return;quickChoices.clear();const options=el('novaSyncQuickOptions');options.replaceChildren();
  const labels={pj:'PJ',pm:'PM',npc:'NPC',monstro:'Monstro',objeto:'Objeto',item:'Item'};
  for(const t of catalog()){
   if(tokenOnCurrentMap(tokens.get(encodeURIComponent(t.id))))continue;
   const base=t.nome+' · '+(labels[t.catalogType]||'Personagem');let label=base,n=2;while(quickChoices.has(label))label=base+' ('+(n++)+')';
   quickChoices.set(label,t.id);const option=root.createElement('option');option.value=label;options.append(option);
  }
 });
 el('novaSyncQuickSearch')?.addEventListener('input',status);
 el('novaSyncQuickAdd')?.addEventListener('click',async()=>{
  if(!user()?.master||placing)return;
  const input=el('novaSyncQuickSearch'),id=quickChoices.get(input.value);if(!id)return;
  const entry=catalog().find(t=>t.id===id);let p={x:14,y:7};
  if(!['objeto','item'].includes(entry?.catalogType)){
   const w=(Number(mapPacket?.larguraM)||28)/28,h=(Number(mapPacket?.alturaM)||14)/14;
   const candidates=[];for(let y=.8;y<=13.2;y+=.8)for(let x=.8;x<=27.2;x+=.8)candidates.push({x,y});
   candidates.sort((a,b)=>Math.hypot((a.x-14)*w,(a.y-7)*h)-Math.hypot((b.x-14)*w,(b.y-7)*h));
   p=candidates.find(p=>tokensOnCurrentMap().every(t=>Math.hypot((p.x-t.x)*w,(p.y-t.y)*h)>=TOKEN_DIAMETER));
   if(!p){error='Não há espaço livre para outra miniatura.';status();return;}
  }
  await place(id,p);input.value='';quickChoices.clear();status();
 });
 el('novaSyncAdicionar')?.addEventListener('click',()=>{
  if(!user()?.master||placing)return;
  release();placementChoice=placementChoice?'':el('novaSyncMestrePersonagem').value;drawCatalog();status();
 });
 el('novaSyncAdicionarMarcados')?.addEventListener('click',()=>{
  if(!user()?.master||placing||!workshopHandle?.addModels)return;
  const entries=(catalog()||[]).filter(t=>catalogChecked.has(String(t.id))&&['objeto','item'].includes(t.catalogType));
  if(!entries.length)return;
  const count=workshopHandle.addModels(entries);
  if(count){catalogChecked.clear();catalogKey='';drawCatalog();workshopHandle.refresh?.();status();}
 });
 el('novaSyncPersonagem').addEventListener('change',()=>{
  ultimaEscolhaAtorV213=el('novaSyncPersonagem').value; // v213
  release();selectedTarget='';
  if(mapPacket?.combat?.active&&mapPacket.combat.schema===2){draw();return;}
  draw();
 });
 el('novaSyncMapa')?.addEventListener('change',()=>{if(user()?.master){if(!editor.canLeave()){el('novaSyncMapa').value=mapPacket?.mapId||'';return;}const m=(mapas()||[]).find(x=>String(x.id)===String(el('novaSyncMapa').value));if(m)openMap(String(m.id)).catch(fail);}});
 async function changeTurn(action){
  if(mapPacket?.combat?.pendingAttack&&action!=='end')return;
  if(queues.size||changingTurn||managing||attacking)return;
  if(['start','end'].includes(action)?!user()?.master:!controlled(tokens.get(mapPacket?.combat?.activeId)))return;
  const expected=mapPacket?.combat?.turnId||null;
  const g=generation;
  changingTurn=true;status();
  let stage=action==='start'?'carregar fichas para iniciar combate':'atualizar turno';
  try{
   const joined=mapPacket?.joined||{};
   const participants=action==='start'?await loadCombatants(tokensOnCurrentMap().filter(t=>joined[t.id]!==false)):[];
   const started=action==='start'?iniciarIniciativa(participants,crypto.randomUUID()):null;
   stage=action==='start'?'salvar iniciativa, deslocamento e saúde de '+participants.length+' participantes':'salvar avanço do turno';
   await database.transact(async tx=>{
    if(g!==generation)throw new Error('A sessão mudou');
    const state=await tx.get(MAP_PATH)||{},c=state.combat;
    const healthState=await tx.get(HEALTH_PATH);
    const durationScene=await tx.get(SCENE_PATH);
    const freshPositions=action==='start'?await Promise.all(participants.map(t=>tx.get(POSITION_PATH+'/'+t.id))):[];
    if(['spend','pass'].includes(action)&&healthState?.actors?.[c?.activeId]?.combateLab?.inconsciente)throw Error('Faça o Teste de consciência antes de avançar.');
    if(action==='spend'&&ocupado(healthState?.actors?.[c?.activeId],c))throw Error('Este turno está dedicado a Primeiros Socorros.');
    if((c?.turnId||null)!==expected)throw new Error('O turno mudou. Confira a tela antes de avançar.');
    let combat;
    if(action==='start'){
     if(c?.active)return;
     combat=started;
    }else{
     if(!c?.active)return;
     if(action!=='end'&&!controlled(tokens.get(c.activeId)))throw new Error('Você não controla este personagem.');
     combat=action==='end'?{...c,active:false,pendingAttack:null,turnId:crypto.randomUUID()}:acaoIniciativa(c,action,expected);
    }
    if(user()?.master&&healthState)atualizarDuracoes(healthState.actors,combat,durationScene);
    if(user()?.master&&durationScene)tx.set(SCENE_PATH,durationScene);
    tx.set(MAP_PATH,{...state,combat});
    if(action==='start')participants.forEach((t,i)=>{const fresh=freshPositions[i];if(fresh)tx.set(POSITION_PATH+'/'+t.id,{...fresh,movementMax:Number(t.movementMax)||movimentoMaximo(t),revision:Number(fresh.revision||0)+1});});
    if(user()?.master&&healthState&&!['start','end'].includes(action)){atualizarDuracoes(healthState.actors,combat);tx.set(HEALTH_PATH,{...healthState,revision:(healthState.revision||0)+1});}
    if(action==='start')tx.set(HISTORY_PATH,{entries:[...((started.order||[]).map(id=>({actorUid:tokens.get(id)?.donoUid||'',ts:Date.now(),message:`Iniciativa: ${tokens.get(id)?.nome||id} · ${started.rolls[id].die} + ${started.rolls[id].initiative} = ${started.rolls[id].total}`})))],revision:Date.now()});
    if(action==='end')tx.set(HISTORY_PATH,{entries:[],revision:Date.now()});
    if(['start','end'].includes(action))tx.set(HEALTH_PATH,{...(healthState||{actors:{}}),pending:null,revision:(healthState?.revision||0)+1});
   });
   error='';status();return true;
  }catch(e){e.context=stage;fail(e);}
  finally{changingTurn=false;status();}
 }
 for(const [id,action]of [['novaSyncStart','start'],['novaSyncNext','pass'],['novaSyncSpend','spend'],['novaSyncEnd','end']])el(id)?.addEventListener('click',e=>{if(e.detail<2){unlockSound();changeTurn(action);}});
 async function manage(action){
  if(!user()?.master||mapPacket?.combat?.active||managing||attacking||queues.size)return;
  const selectedForRemoval=action==='remove'?selectedActor():null;
  if(action==='remove'&&!selectedForRemoval)return;
  if(action==='clear'&&!root.defaultView.confirm('Limpar os participantes e o estado de combate? O mapa e seus objetos permanecem.'))return;
  if(action==='restore'&&!root.defaultView.confirm('Restaurar vida, munição e fadiga de todos no mapa, e o próprio mapa (fogo, objetos destruídos, armas caídas)? Também zera fome, sede e cansaço e devolve Sorte e PP de quem está neste mapa.'))return;
  if(action==='restore')try{root.defaultView.dispatchEvent(new CustomEvent('mesa-restaurar-v160',{detail:{mapId:String(mapPacket?.mapId||'')}}));}catch(_){}
  if(action==='remove'&&!root.defaultView.confirm(`Retirar ${selectedForRemoval.nome||'este personagem'} do mapa?`))return;
  release();managing=true;status();
  try{
   const ids=tokensOnCurrentMap().map(t=>t.id),restored=action==='restore'?await restoreHealth(tokensOnCurrentMap()):null;
   await database.transact(async tx=>{
    const state=await tx.get(MAP_PATH)||{},healthState=await tx.get(HEALTH_PATH)||{},scene=await tx.get(SCENE_PATH);
    const values=await Promise.all(ids.map(id=>tx.get(POSITION_PATH+'/'+id)));
    const creaturePath='combatesAtivos/mapaMesaSyncCriaturas',creatures=await tx.get(creaturePath)||{instances:{}};
    if(state.combat?.active)throw Error('Encerre o combate antes de reorganizar a mesa.');
    if(action==='remove'){
     const id=selectedForRemoval.id;
     const instances={...creatures.instances};delete instances[id];tx.set(creaturePath,{...creatures,instances});
     tx.delete(POSITION_PATH+'/'+id);
     const joined={...(state.joined||{})};delete joined[id];
     const actors={...(healthState.actors||{})};delete actors[id];
     tx.set(MAP_PATH,{...state,joined});
     tx.set(HEALTH_PATH,{...healthState,actors,pending:null,revision:(healthState.revision||0)+1});
     tx.set(HISTORY_PATH,{entries:healthState.history||[],revision:(healthState.revision||0)+1});
    }else if(action==='random'){
     const placed=[],w=(Number(state.larguraM)||28)/28,h=(Number(state.alturaM)||14)/14;
     for(const [i,t]of values.entries())if(t){
      let point;for(let k=0;k<600;k++){const candidate={x:.8+Math.random()*26.4,y:.8+Math.random()*12.4};if(placed.every(p=>Math.hypot((candidate.x-p.x)*w,(candidate.y-p.y)*h)>=TOKEN_DIAMETER+.1)){point=candidate;break;}}
      if(!point)throw Error('Não há espaço para distribuir todas as miniaturas sem sobreposição.');
      placed.push(point);tx.set(POSITION_PATH+'/'+ids[i],{...t,...point,revision:t.revision+1});
     }
    }else if(action==='clear'){
     const instances={...creatures.instances};for(const id of ids)delete instances[id];tx.set(creaturePath,{...creatures,instances});
     for(const id of ids)tx.delete(POSITION_PATH+'/'+id);
     const {combat,joined,...kept}=state;tx.set(MAP_PATH,kept);tx.set(HEALTH_PATH,{actors:{},revision:(healthState.revision||0)+1});tx.set(HISTORY_PATH,{entries:[],revision:(healthState.revision||0)+1});
    }else{
     for(const id of Object.keys(restored)){const previous=healthState.actors?.[id];if(previous?.luckRemaining!==undefined)restored[id].luckRemaining=previous.luckRemaining;if(previous?.luckPrepared)restored[id].luckPrepared=true;}
     tx.set(HEALTH_PATH,{actors:restored,revision:(healthState.revision||0)+1});
     // v133: o mapa volta ao normal também: fogo apagado, objetos destruídos de pé (meteoros, explosões), armas caídas voltam ao dono, ilusões e zonas psíquicas somem
     if(scene)tx.set(SCENE_PATH,{...scene,psiZones:[],objects:(scene.objects||[]).filter(o=>!o.ilusaoPsi&&!o.itemSolto?.armaCaida).map(o=>{const r=restaurarObjeto(o);delete r.queimado;return r;})});
    }
   });error='';
  }catch(e){fail(e);}finally{managing=false;draw();}
 }
 el('novaSyncSharedDrawToggle')?.addEventListener('click',()=>{if(!mapPacket?.mapId||mapPacket?.combat?.active)return;sharedDrawMode=!sharedDrawMode;release();editor.close({keepDraft:!!user()?.master});syncSharedDrawControls();drawSharedInk();});
 el('novaSyncSharedDrawUndo')?.addEventListener('click',()=>void undoMySharedDraw());
 el('novaSyncSharedDrawClear')?.addEventListener('click',()=>void clearMySharedDraw());
 for(const [id,action]of [['novaSyncRandom','random'],['novaSyncClear','clear'],['novaSyncRestore','restore']])el(id)?.addEventListener('click',()=>manage(action));
 el('novaSyncRemove')?.addEventListener('click',()=>{const selected=editor.selection;if(selected&&selected.kind!=='token'){editor.removeSelected();return;}if(selected?.kind==='token'){el('novaSyncPersonagem').value=selected.id;}manage('remove');});
 el('novaSyncJoin')?.addEventListener('click',async()=>{
  const entryId=el('novaSyncEntrySelect')?.value,entry=(characters()||[]).find(c=>encodeURIComponent(c.id)===entryId);const t=entry?{...entry,id:entryId,donoUid:entry.donoUid||entry.dono}:selectedActor();if(!t||t.donoUid!==user()?.uid||mapPacket?.combat?.active||placing)return;
  placing=true;status();
  try{await database.transact(async tx=>{
   const state=await tx.get(MAP_PATH)||{};if(state.combat?.active)throw Error('O combate começou. Aguarde para entrar.');
   const existing=await tx.get(POSITION_PATH+'/'+t.id);
   if(!existing||String(existing.mapaId||state?.mapId||'')!==String(mapPacket?.mapId||state?.mapId||'')){
    const sheet=await tx.get('personagens/'+decodeURIComponent(t.id));if(!sheet||sheet.dono!==user()?.uid)throw Error('A ficha não pertence a este jogador.');
    // v140: no espaço-porto (mapa 1) o personagem chega ao lado da nave do grupo
    const mInfo=(mapas?.()||[]).find(m=>String(m?.id)===String(mapPacket?.mapId||'')),chegada=mInfo?.espacoportoV138||String(mInfo?.id||'')==='v138_espacoporto'?{x:2.6,y:7.2}:null;
    const cands=[];for(let y=.8;y<13.3;y+=chegada?.6:1.2)for(let x=.8;x<27.3;x+=chegada?.6:1.2)cands.push({x,y});if(chegada)cands.sort((a,b)=>Math.hypot(a.x-chegada.x,a.y-chegada.y)-Math.hypot(b.x-chegada.x,b.y-chegada.y));
    let p=null;for(const candidate of cands){if(p)break;const {x,y}=candidate;const sx=(mapPacket?.larguraM||28)/28,sy=(mapPacket?.alturaM||14)/14,r=diametroMiniatura(t)/2;
    const overlaps=tokensOnCurrentMap().some(o=>Math.hypot((x-o.x)*sx,(y-o.y)*sy)<Math.max(TOKEN_DIAMETER,r+diametroMiniatura(o)/2))||(sceneData?.objects||[]).some(o=>{if(!o.bloqueiaMovimento||o.destruido||camadaEntidade(o)!==3)return false;const a=-(o.angulo||0)*Math.PI/180,dx=(x-o.x)*sx,dy=(y-o.y)*sy;return Math.hypot(Math.max(0,Math.abs(dx*Math.cos(a)-dy*Math.sin(a))-o.larguraM/2),Math.max(0,Math.abs(dx*Math.sin(a)+dy*Math.cos(a))-o.alturaM/2))<r;});if(!overlaps)p=candidate;}
    if(!p)throw Error('Não há espaço livre para entrar no mapa.');
    tx.set(POSITION_PATH+'/'+t.id,{...(existing||{}),nome:String(sheet.nome||'Personagem'),imagem:String(sheet.miniatura?.url||sheet.imagem||''),donoUid:user().uid,...p,mapaId:String(mapPacket?.mapId||state?.mapId||''),revision:existing?Number(existing.revision||0)+1:0,facing:Number(existing?.facing||0),camada:3});
   }
   tx.set(MAP_PATH,{...state,joiningActorId:t.id,joined:{...(state.joined||{}),[t.id]:existing?(state.joined||{})[t.id]===false:true}});
  });error='';}catch(e){fail(e);}finally{placing=false;draw();}
 });
 root.defaultView.addEventListener('personagem-selecionado',event=>{const id=encodeURIComponent(event.detail);if(!mapPacket?.combat?.active){void applyMapView(sharedMapPacket,{force:true}).then(()=>{draw();el('novaSyncPersonagem').value=id;draw();});}});
 root.defaultView.addEventListener('personagem-localizacao-alterada-v93',()=>{if(!user()?.master&&!mapPacket?.combat?.active)void applyMapView(sharedMapPacket,{force:true});});

 status();
 async function inventoryMove(char,payload){
  const map=await database.get(MAP_PATH),id=encodeURIComponent(char.id);if(!map?.combat?.active||!await database.get(POSITION_PATH+'/'+id))return false;
  open();const message=await attacks.support({...payload,kind:'direct-inventory',actorId:id,targetId:id,turnId:map.combat.turnId});
  const sheet=await database.get(globalThis.mesaTreinoRotaV205?.('personagens/'+char.id)||('personagens/'+char.id));if(sheet?.inventario)char.inventario=sheet.inventario;
  root.defaultView?.renderizarInventario?.(char);return true;
 }
 async function openMap(id){
  if(!user()?.master)throw Error('Somente o mestre pode escolher o mapa.');
  const m=(mapas()||[]).find(x=>String(x.id)===String(id));if(!m)throw Error('Mapa não encontrado.');
  if(!editor.canLeave())return;open();await database.transact(async tx=>{const state=await tx.get(MAP_PATH)||{};if(state.combat?.active)throw Error('Encerre o combate antes de trocar o mapa.');tx.set(MAP_PATH,{...state,mapId:String(m.id),nome:String(m.nome||m.id),fundo:String(m.fundo||''),larguraM:Number(m.larguraM)||28,alturaM:Number(m.alturaM)||14});});
  try{root.defaultView?.dispatchEvent(new CustomEvent('mesa-mapa-aberto-v102',{detail:{mapaId:String(m.id)}}));}catch(_){}
 }
 return {restaurarTudo:()=>manage('restore'),cenaAtual:()=>sceneData,dimsAtual:()=>({W:Number(mapPacket?.larguraM)||28,H:Number(mapPacket?.alturaM)||14}),open,close,initialize,inventoryMove,openMap,refreshView:()=>applyMapView(sharedMapPacket,{force:true}),place:(chosen,p,opts)=>place(chosen,p,opts),mapaAtual:()=>mapPacket?.mapId||'',selecao:()=>{try{return editor.selection;}catch(_){return null;}},emCombate:()=>!!mapPacket?.combat?.active,acoes:()=>updateActions,escolherDefesa,ator:()=>selectedActor()||null,alvo:()=>selectedTarget,controla:t=>{try{return !!controlled(t);}catch(_){return false;}},saude:id=>health.actors?.[id]?.combateLab||null,token:id=>tokens.get(id)||null,tokenVisual:id=>{const t=tokens.get(id)||null,p=previews.get(id);return t&&p?{...t,x:p.x,y:p.y,facing:Number.isFinite(p.facing)?p.facing:t.facing}:t;}, /* v205: posição que a tela está mostrando agora (a prévia do arrasto), para a animação seguir o corpo sem esperar o banco */ mestre:()=>{try{return !!masterMode();}catch(_){return false;}},tokensNoMapa:()=>{try{return tokensOnCurrentMap();}catch(_){return [];}},suporte:p=>{if(!attacks)throw Error('Sessão indisponível.');return attacks.support({...p,mapId:mapPacket?.mapId||''});},todosTokens:()=>[...tokens.values()],gastarAcao:async id=>{const c=mapPacket?.combat;if(!c?.active)return true;if(c.activeId!==id||!controlled(tokens.get(id)))return false;return changeTurn('spend');},andarDirecao,pararAndar,andando:()=>!!held?.pad,marcarAlvo:id=>{selectedTarget=id||'';try{updateActions.setTarget(selectedTarget);}catch(_){}draw();}};
}

// Mesa Estelar v102: localização individual + desenhos colaborativos por mapa; mapa do mestre é apenas a visão do mestre.
