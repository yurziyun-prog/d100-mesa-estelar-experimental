// Mesa Estelar v103 — Camada visual do Mapa da Mesa.
//
// Princípio de segurança: este módulo SÓ DESENHA por cima do mapa.
// Ele nunca altera posições, combate, fichas ou objetos. Todas as camadas
// têm pointer-events:none, então cliques continuam chegando ao mapa antigo.
// Se acontecerem erros repetidos, a camada se desliga sozinha e o mapa
// continua exatamente como era antes da v103.
//
// Recursos:
//  - iluminação ambiente por mapa (dia, entardecer, noite, escuridão);
//  - fontes de luz automáticas (lâmpadas, tochas, cristais, fogo, lanterna dos personagens)
//    com sombras projetadas por paredes e objetos que bloqueiam visão;
//  - névoa de guerra opcional: o jogador só vê o que o personagem dele enxerga;
//  - clima (chuva, neve, poeira, brasas, neblina);
//  - efeitos de ataque com partículas, projéteis e números de dano;
//  - acabamento das miniaturas (sombra, anel por tipo, barra de PV).

export const VERSAO='v103';

export const AMBIENTES={
 dia:{nome:'☀️ Dia',cor:[0,0,0],alfa:0},
 entardecer:{nome:'🌇 Entardecer',cor:[70,32,22],alfa:.32},
 noite:{nome:'🌙 Noite',cor:[6,10,30],alfa:.74},
 escuro:{nome:'🕳️ Escuridão',cor:[0,0,0],alfa:.94},
 auto:{nome:'🕐 Pela hora do jogo',cor:[0,0,0],alfa:0} // v135: dia/entardecer/noite pelo relógio ⏰
};
export const CLIMAS={nenhum:'Nenhum',chuva:'🌧️ Chuva',tempestade:'⛈️ Tempestade (raios e trovões)',neve:'❄️ Neve',poeira:'🌪️ Poeira',brasas:'🔥 Brasas',neblina:'🌫️ Neblina',areia:'🏜️ Tempestade de areia',meteoros:'☄️ Chuva de meteoros'};
// v132: abrigo do mapa — quem está dentro vê a luz e ouve o barulho do clima, mas é pouco ou nada atingido.
// particulas: quanto do clima aparece dentro; raio: chance de um raio atingir alguém; meteoro: chance de um meteoro furar o teto.
export const ABRIGOS=[
 {nome:'Ao ar livre',particulas:1,raio:1,meteoro:1},
 {nome:'🛖 Barraco (ainda respinga)',particulas:.35,raio:.3,meteoro:.8},
 {nome:'🏠 Casa',particulas:0,raio:0,meteoro:.5},
 {nome:'🏢 Edifício sólido',particulas:0,raio:0,meteoro:.25},
 {nome:'🏰 Palácio / fortaleza',particulas:0,raio:0,meteoro:.1}
];
export function abrigoDe(n){return ABRIGOS[Math.max(0,Math.min(ABRIGOS.length-1,Math.round(Number(n)||0)))];}
export const PERIGOS={enchente:'🌊 Enchente',gas:'☣️ Gás tóxico',fumaca:'💨 Fumaça'};
export const CONFIG_PADRAO=Object.freeze({ambiente:'dia',nevoa:false,clima:'nenhum',intensidadeClima:1,luzPersonagens:4,perigo:null,abrigo:0});

export function normalizarConfig(c){
 const v=c&&typeof c==='object'?c:{};
 const num=(x,d,min,max)=>{const n=Number(x);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):d;};
 return {
  ambiente:Object.prototype.hasOwnProperty.call(AMBIENTES,v.ambiente)?v.ambiente:CONFIG_PADRAO.ambiente,
  nevoa:v.nevoa===true,
  clima:Object.prototype.hasOwnProperty.call(CLIMAS,v.clima)?v.clima:CONFIG_PADRAO.clima,
  intensidadeClima:num(v.intensidadeClima,1,.2,2),
  luzPersonagens:num(v.luzPersonagens,4,0,12),
  abrigo:Math.round(num(v.abrigo,0,0,ABRIGOS.length-1)),
  perigo:v.perigo&&Object.prototype.hasOwnProperty.call(PERIGOS,v.perigo.tipo)?{tipo:v.perigo.tipo,nivel:num(v.perigo.nivel,.3,0,1)}:null
 };
}
// v130: clima para o cenário inteiro (todos os mapas), por cima do clima de cada mapa.
export const CAMINHO_CLIMA_GLOBAL='combatesAtivos/mesaVisualGlobal';
export function climaEfetivo(config,global){const abrigo=Math.max(0,Math.min(ABRIGOS.length-1,Math.round(Number(config?.abrigo)||0)));return global?.ativo&&Object.prototype.hasOwnProperty.call(CLIMAS,global.clima)?{clima:global.clima,intensidadeClima:Number(global.intensidadeClima)||1,global:true,abrigo}:{clima:config?.clima||'nenhum',intensidadeClima:Number(config?.intensidadeClima)||1,global:false,abrigo};}
export function caminhoConfig(mapId){return 'combatesAtivos/mesaVisual_'+encodeURIComponent(String(mapId||''));}

// ---------------------------------------------------------------------------
// Geometria (em metros). Exportada para testes.
// ---------------------------------------------------------------------------
export function cantosRetangulo(cx,cy,w,h,anguloGraus=0){
 const a=(Number(anguloGraus)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),hw=w/2,hh=h/2;
 return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>({x:cx+x*c-y*s,y:cy+x*s+y*c}));
}
export function segmentosRetangulo(cx,cy,w,h,ang){
 const p=cantosRetangulo(cx,cy,w,h,ang);return p.map((a,i)=>{const b=p[(i+1)%4];return {ax:a.x,ay:a.y,bx:b.x,by:b.y};});
}
export function pontoNoRetangulo(r,p,folga=0){
 const a=-(Number(r.ang)||0)*Math.PI/180,dx=p.x-r.cx,dy=p.y-r.cy;
 const x=dx*Math.cos(a)-dy*Math.sin(a),y=dx*Math.sin(a)+dy*Math.cos(a);
 return Math.abs(x)<=r.w/2+folga&&Math.abs(y)<=r.h/2+folga;
}
function intersecaoRaio(ox,oy,dx,dy,s){
 const ex=s.bx-s.ax,ey=s.by-s.ay,den=dx*ey-dy*ex;if(Math.abs(den)<1e-12)return Infinity;
 const t=((s.ax-ox)*ey-(s.ay-oy)*ex)/den,u=((s.ax-ox)*dy-(s.ay-oy)*dx)/den;
 return t>=0&&u>=-1e-9&&u<=1+1e-9?t:Infinity;
}
// Polígono de visibilidade a partir de "origem", limitado a "raio" metros.
// "bloqueios" = retângulos {cx,cy,w,h,ang}. Bloqueios que contêm a origem são ignorados
// (uma lâmpada não faz sombra em si mesma; um personagem encostado numa parede ainda enxerga).
export function poligonoVisao(origem,bloqueios,raio,largura,altura){
 const ox=origem.x,oy=origem.y,R=Math.max(.1,raio),segs=[];
 for(const r of bloqueios||[]){
  if(pontoNoRetangulo(r,origem,.05))continue;
  const alcance=Math.hypot(r.w,r.h)/2;if(Math.hypot(r.cx-ox,r.cy-oy)-alcance>R)continue;
  segs.push(...segmentosRetangulo(r.cx,r.cy,r.w,r.h,r.ang));
 }
 segs.push({ax:0,ay:0,bx:largura,by:0},{ax:largura,ay:0,bx:largura,by:altura},{ax:largura,ay:altura,bx:0,by:altura},{ax:0,ay:altura,bx:0,by:0});
 const angulos=[];
 const passos=Math.max(24,Math.min(72,Math.round(R*6)));
 for(let i=0;i<passos;i++)angulos.push(-Math.PI+i*2*Math.PI/passos);
 for(const s of segs)for(const [x,y] of [[s.ax,s.ay],[s.bx,s.by]]){
  if(Math.hypot(x-ox,y-oy)>R*1.5)continue;
  const a=Math.atan2(y-oy,x-ox);angulos.push(a-.0004,a,a+.0004);
 }
 angulos.sort((a,b)=>a-b);
 const pts=[];
 for(const a of angulos){
  const dx=Math.cos(a),dy=Math.sin(a);let t=R;
  for(const s of segs){const h=intersecaoRaio(ox,oy,dx,dy,s);if(h<t)t=h;}
  pts.push({x:ox+dx*t,y:oy+dy*t});
 }
 return pts;
}

// ---------------------------------------------------------------------------
// Interpretação dos dados da mesa
// ---------------------------------------------------------------------------
const semAcento=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export function tipoToken(t){
 const id=decodeURIComponent(String(t?.id||''));
 if(id.startsWith('syncnpc:'))return 'npc';
 if(id.startsWith('synccriatura:'))return 'monstro';
 if(id.startsWith('dummy:'))return 'alvo';
 return 'personagem';
}
export const CORES_TIPO={personagem:'#57e3a1',npc:'#f2c14e',monstro:'#ff5a4f',alvo:'#9aa3b5'};
export function fracaoPV(c){
 if(!c||typeof c!=='object')return null;
 if(c.morto)return 0;
 const max=Object.values(c.hitMax||{}).reduce((s,v)=>s+Math.max(0,Number(v)||0),0);if(!max)return null;
 const atual=Object.entries(c.hitMax||{}).reduce((s,[k])=>s+Math.max(0,Number(c.hit?.[k])||0),0);
 return Math.max(0,Math.min(1,atual/max));
}
const LUZES=[
 [/lustre|candelabr|lampad|lampiao|luminari|abajur|lanterna|poste|holofote|refletor|spot/,{cor:'#ffd9a0',raio:5.5}],
 [/tocha|fogueir|lareira|braseir|forno|fornalha|caldeir/,{cor:'#ff9640',raio:5,tremula:1}],
 [/vela/,{cor:'#ffc070',raio:2.6,tremula:.6}],
 [/neon|painel|monitor|tela|terminal|console|holo/,{cor:'#7fe9ff',raio:3.5}],
 [/cristal|gema|runa|portal/,{cor:'#c79bff',raio:3.2}]
];
export function luzDoObjeto(o){
 if(!o||o.destruido)return null;
 if(o.pegandoFogo)return {cor:'#ff7a2a',raio:3.5+Math.min(4,Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)),tremula:1.4,fogo:true};
 if(o.luz===false)return null;
 if(o.luz&&typeof o.luz==='object')return {cor:String(o.luz.cor||'#ffd9a0'),raio:Number(o.luz.raio)||5,tremula:Number(o.luz.tremula)||0};
 const n=semAcento([o.nome,o.modeloId,o.tipoVisual].join(' '));
 for(const [re,luz] of LUZES)if(re.test(n))return {...luz};
 return null;
}
export function classificarAtaque(item){
 const n=semAcento([item?.nome,item?.categoria,item?.familia,item?.tipo].join(' '));
 if(/grito.*psiquic|eco.*matilha|sonic|sonor|trombeta|ulul|uivo|grito|berro|rugid|bramid|ensurdec/.test(n))return 'sonico';
 if(/baforad|sopro|bafo|cuspe de|cuspi|jato de|lanca-?chamas/.test(n))return 'sopro';
 if(/psiquic|psychic|psi\b/.test(n))return 'psi';
 if(/laser/.test(n))return 'laser';
 if(/faser|phaser|plasma|ion\b|ionic|energia/.test(n))return 'energia';
 if(/blaster/.test(n))return 'blaster';
 if(/pistol|revolver|rifle|fuzil|espingard|escopet|metralh|carabin|arma de fogo|tiro|bala|disparo|sniper/.test(n))return 'bala';
 if(/arco|besta\b|flecha|virote|dardo|lanca-?dardo/.test(n))return 'flecha';
 if(/sabre|saber|espada|faca|adaga|machad|lamina|katana|foice|cutelo|lanca\b/.test(n))return 'lamina';
 if(/mordida|bite|presa/.test(n))return 'mordida';
 if(/garra|unha/.test(n))return 'garra';
 if(/patada|pisot|stomp|coice|cauda|calda|rabo|tail/.test(n))return 'esmagar';
 if(/soco|punho|chute|desarmad|cabecad|joelh|cotovel/.test(n))return 'soco';
 return 'impacto';
}

// ---------------------------------------------------------------------------
// Camada visual
// ---------------------------------------------------------------------------
const CSS_ID='mesaVisualCssV103';
const CSS=`
/* v201: sem círculo colorido em volta da miniatura e sem a bolinha amarela de frente (a figura já mostra para onde olha) */
#novaSyncBoard.mv-on [data-token]{box-shadow:0 6px 10px rgba(0,0,0,.45);border-color:transparent!important;}
#novaSyncBoard [data-token] [data-facing-handle]{display:none!important;}
#novaSyncBoard.mv-on [data-token].mv-mini::after{display:none!important;}
#novaSyncBoard.mv-on [data-token] .mv-rotulo{background:rgba(10,16,30,.78)!important;color:#f3f6ff;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:0 7px;font:600 11px/17px 'Segoe UI',Arial,sans-serif!important;text-shadow:0 1px 2px #000;pointer-events:none;}
#novaSyncBoard.mv-on [data-token] .mv-pv{position:absolute;left:18%;right:18%;bottom:6%;height:4px;border-radius:3px;background:rgba(0,0,0,.65);overflow:hidden;pointer-events:none;z-index:9;box-shadow:0 0 0 1px rgba(0,0,0,.5);}
#novaSyncBoard.mv-on [data-token] .mv-pv>i{display:block;height:100%;border-radius:3px;transition:width .35s ease,background-color .35s ease;}
#novaSyncBoard.mv-on.mv-fogo-vivo .nova-fire{opacity:0;}
/* v105: miniatura realista = só a figura no chão, sem ficha redonda */
#novaSyncBoard.mv-on [data-token].mv-mini{background:none!important;border-color:transparent!important;box-shadow:none!important;overflow:visible!important;}
#novaSyncBoard.mv-on [data-token].mv-mini>img{border-radius:0!important;object-fit:contain!important;transform-origin:50% 50%;transition:transform .25s ease;width:calc(var(--mv-esc,1.35)*100%)!important;height:calc(var(--mv-esc,1.35)*100%)!important;margin:calc((1 - var(--mv-esc,1.35))*50%)!important;max-width:none!important;
 filter:drop-shadow(0 0 1.5px var(--mv-sel,transparent)) drop-shadow(0 0 4px var(--mv-sel,transparent));}
/* v109: a miniatura já mostra frente/costas — a bolinha de girar fica invisível (continua funcionando ao segurar a borda) */
#novaSyncBoard.mv-on [data-token].mv-mini [data-facing-handle]{background:transparent!important;border-color:transparent!important;box-shadow:none!important;width:16px!important;height:16px!important;opacity:0;transition:opacity .2s;}
#novaSyncBoard.mv-on [data-token].mv-mini:hover [data-facing-handle]{opacity:.55;border:1px dashed #ffd447!important;}
/* v114: a sombra no chão mostra o espaço que a figura ocupa (1 m para uma pessoa), sem virar ficha redonda */
#novaSyncBoard.mv-on [data-token].mv-mini::after{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(0,0,0,.30) 0,rgba(0,0,0,.20) 50%,transparent 66%,transparent 71%);pointer-events:none;z-index:-1;}
.mv-camada{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;}
.mv-pop{position:fixed;z-index:9999;width:270px;max-width:calc(100vw - 24px);padding:12px;border:1px solid #49668a;border-radius:12px;background:#121a2e;color:#e8eefc;box-shadow:0 12px 30px rgba(0,0,0,.6);font:13px 'Segoe UI',Arial,sans-serif;}
.mv-pop h4{margin:0 0 8px;font-size:14px;color:#8ee7ff;}
.mv-pop label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0;}
.mv-pop select,.mv-pop input[type=range]{width:140px;}
.mv-pop .mv-sep{border-top:1px solid rgba(255,255,255,.1);margin:10px 0 6px;padding-top:6px;color:#9fb3cc;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
.mv-pop .mv-nota{color:#9fb3cc;font-size:11px;line-height:1.35;margin-top:6px;min-height:15px;}
`;

function hexRgb(h){const m=/^#?([0-9a-f]{6})$/i.exec(String(h||''));const n=m?parseInt(m[1],16):0xffffff;return [(n>>16)&255,(n>>8)&255,n&255];}
const rgba=(h,a)=>{const [r,g,b]=hexRgb(h);return `rgba(${r},${g},${b},${a})`;};

export function criarMesaVisual({root=document,database=null,board:obterBoard}={}){
 const win=root.defaultView||window;
 const armazenamento=(()=>{try{return win.localStorage;}catch(_){return null;}})();
 const lerPref=(k,d)=>{try{const v=armazenamento?.getItem('mesa:visual:'+k);return v===null||v===undefined?d:v;}catch(_){return d;}};
 const gravarPref=(k,v)=>{try{armazenamento?.setItem('mesa:visual:'+k,String(v));}catch(_){}};

 let ativo=lerPref('ativo','1')!=='0';
 let qualidade=lerPref('qualidade','alta');
 let desligadoPorErro=false,erros=0,ultimoErro='';const errosRecentes=[];
 let snap=null,config={...CONFIG_PADRAO},configMapa='',pararConfig=null,global=null,pararGlobal=null;
 const ef=()=>climaEfetivo(config,global);
 setInterval(()=>{try{if(camadas)agendar();}catch(_){}},2000); // v135: hora do jogo e lanternas
 try{(root.defaultView||window).mesaVisualClima=()=>ef();}catch(_){}
 let vigia=0,camadas=null,raf=0,ultimoQuadro=0,tLuz=0,chaveLuz='',cacheLuz=null;
 const particulasClima=[],efeitos=[];
 let climaAtual='',climaChave='',lentoDesde=0;

 const board=()=>{try{return obterBoard?.()||null;}catch(_){return null;}};

 // v203: medidas do tabuleiro guardadas por 300 ms (ler clientWidth/offsetParent a cada quadro obrigava o navegador a refazer o layout 60 vezes por segundo)
 const medidaV203=b=>{const t=Date.now();if(!b.__mT||t-b.__mT>300){b.__mT=t;b.__mW=b.clientWidth;b.__mH=b.clientHeight;b.__mV=!!b.offsetParent;}return b;};
 const cwV=b=>medidaV203(b).__mW,chV=b=>medidaV203(b).__mH,visV=b=>medidaV203(b).__mV;
 function seguro(nome,fn){
  return (...args)=>{
   if(desligadoPorErro)return undefined;
   try{return fn(...args);}
   catch(e){
    const agora=Date.now();errosRecentes.push(agora);while(errosRecentes.length&&agora-errosRecentes[0]>120000)errosRecentes.shift();
    erros=errosRecentes.length;ultimoErro=nome+': '+(e?.message||e);
    console.warn('[Mesa Visual] erro em',nome,e);
    if(erros>=3){desligadoPorErro=true;desmontar();console.warn('[Mesa Visual] desligada automaticamente após erros repetidos. O mapa continua funcionando normalmente.');atualizarPainel();}
    return undefined;
   }
  };
 }

 function instalarCss(){
  if(root.getElementById(CSS_ID))return;
  const st=root.createElement('style');st.id=CSS_ID;st.textContent=CSS;root.head.append(st);
 }
 function montar(){
  const b=board();if(!b)return null;
  if(camadas&&camadas.board===b&&camadas.clima.isConnected)return camadas;
  desmontar();instalarCss();
  const criar=(nome,z,extra='')=>{const c=root.createElement('canvas');c.className='mv-camada';c.dataset.mesaVisual=nome;c.style.zIndex=String(z);if(extra)c.style.cssText+=extra;b.append(c);return c;};
  camadas={board:b,
   clima:criar('clima',4),
   // o brilho fica ABAIXO da escuridão: só aparece onde há luz e nunca vaza pela névoa
   brilho:criar('brilho',5,'mix-blend-mode:screen;'),
   luz:criar('luz',5),
   fx:criar('fx',9)
  };
  b.classList.add('mv-on');
  // retoma a animação quando a aba do mapa volta a ficar visível
  if(!vigia)vigia=win.setInterval(()=>{if(ligado()&&camadas&&!raf&&camadas.board.offsetParent&&!root.hidden)agendar();},1000);
  return camadas;
 }
 function desmontar(){
  if(raf){win.cancelAnimationFrame(raf);raf=0;}
  if(vigia){win.clearInterval(vigia);vigia=0;}
  const b=camadas?.board||board();
  if(b){
   b.classList.remove('mv-on','mv-fogo-vivo');
   b.querySelectorAll('[data-mesa-visual]').forEach(n=>n.remove());
   b.querySelectorAll('[data-token]').forEach(n=>{n.querySelector('.mv-pv')?.remove();n.style.removeProperty('--mv-anel');n.querySelector('.mv-rotulo')?.classList.remove('mv-rotulo');n.classList.remove('mv-mini');n.style.removeProperty('--mv-sel');n.style.removeProperty('--mv-anel-chao');const im=n.querySelector(':scope > img');if(im)im.style.transform='';});
  }
  camadas=null;cacheLuz=null;chaveLuz='';efeitos.length=0;particulasClima.length=0;climaAtual='';climaChave='';
 }
 const ligado=()=>ativo&&!desligadoPorErro;

 // ---------------------------------------------------------------- dados
 function mundo(){
  const s=snap;if(!s)return null;
  const W=Number(s.larguraM)||28,H=Number(s.alturaM)||14;
  const fx=W/28,fy=H/14;
  const tokens=(s.tokens||[]).map(t=>({id:String(t.id),nome:t.nome,x:(Number(t.x)||0)*fx,y:(Number(t.y)||0)*fy,donoUid:String(t.donoUid||''),tipo:tipoToken(t),saude:t.saude||null,facing:Number(t.facing)||0}));
  const objetos=(s.objetos||[]).filter(o=>o&&!o.oculto).map(o=>({...o,cx:(Number(o.x)||0)*fx,cy:(Number(o.y)||0)*fy,w:Math.max(.05,Number(o.larguraM)||1),h:Math.max(.05,Number(o.alturaM)||1),ang:Number(o.angulo)||0}));
  const bloqueios=[];
  for(const o of objetos)if(o.bloqueiaVisao&&!o.destruido)bloqueios.push({cx:o.cx,cy:o.cy,w:o.w,h:o.h,ang:o.ang});
  for(const e of s.formas||[]){
   if(e?.type!=='shape'||e.bloqueiaMovimento!==true||e.bloqueiaVisao===false||e.destruido)continue;
   if(Number(e.fillOpacity??1)<.6||Number(e.opacity??1)<.6)continue;
   const w=Math.max(.05,Number(e.w)||0),h=Math.max(.05,Number(e.h)||0);if(!w||!h)continue;
   // Pisos enormes marcados por engano como bloqueio não podem apagar o mapa inteiro.
   if(w*h>W*H*.25)continue;
   bloqueios.push({cx:(Number(e.x)||0)+w/2,cy:(Number(e.y)||0)+h/2,w,h,ang:Number(e.rot)||0});
  }
  return {W,H,tokens,objetos,bloqueios};
 }

 // ---------------------------------------------------------------- configuração por mapa
 function observarConfig(mapId){
  if(mapId===configMapa)return;
  pararConfig?.();pararConfig=null;configMapa=mapId;config={...CONFIG_PADRAO};chaveLuz='';
  if(!pararGlobal&&database?.subscribeDoc){try{pararGlobal=database.subscribeDoc(CAMINHO_CLIMA_GLOBAL,v=>{global=v||null;particulasClima.length=0;climaAtual='';climaChave='';atualizarPainel();agendar();},()=>{});}catch(_){}}
  if(!mapId||!database?.subscribeDoc)return atualizarPainel();
  try{
   pararConfig=database.subscribeDoc(caminhoConfig(mapId),v=>{config=normalizarConfig(v);chaveLuz='';atualizarPainel();agendar();},e=>{console.warn('[Mesa Visual] configuração indisponível; usando padrão.',e);});
  }catch(e){console.warn('[Mesa Visual] configuração indisponível; usando padrão.',e);}
  atualizarPainel();
 }
 async function salvarGlobal(parcial){
  if(!snap?.user?.master||!database?.writeMap)return;
  global={...(global||{}),...parcial};particulasClima.length=0;climaAtual='';climaChave='';agendar();atualizarPainel();
  try{await database.writeMap(CAMINHO_CLIMA_GLOBAL,{ativo:!!global.ativo,clima:String(global.clima||'nenhum'),intensidadeClima:Number(global.intensidadeClima)||1,atualizadoEm:new Date().toISOString()});nota(global.ativo?'Clima salvo para o cenário inteiro (todos os mapas).':'Clima volta a ser de cada mapa.');}
  catch(e){nota('Não foi possível salvar: '+(e?.code||e?.message||e));}
 }
 async function salvarConfig(parcial){
  if(!snap?.user?.master||!configMapa||!database?.writeMap)return;
  const proximo=normalizarConfig({...config,...parcial});config=proximo;chaveLuz='';agendar();atualizarPainel();
  try{await database.writeMap(caminhoConfig(configMapa),{...proximo,mapId:configMapa,atualizadoEm:new Date().toISOString()});nota('Salvo para todos neste mapa.');}
  catch(e){nota('Não foi possível salvar: '+(e?.code||e?.message||e));}
 }

 // ---------------------------------------------------------------- miniaturas
 function enfeitarTokens(m){
  const b=camadas?.board;if(!b)return;
  const porId=new Map(m.tokens.map(t=>[t.id,t]));
  const uid=String(snap?.user?.uid||''),mestre=!!snap?.user?.master;
  for(const node of b.querySelectorAll('[data-token]')){
   const t=porId.get(node.dataset.token);if(!t)continue;
   node.style.setProperty('--mv-anel',CORES_TIPO[t.tipo]||CORES_TIPO.personagem);
   // v105: miniaturas vistas de cima (#mini) giram para onde o personagem olha
   const img=node.querySelector(':scope > img');
   const mini=!!img&&String(img.getAttribute('src')||'').includes('#mini');
   node.classList.toggle('mv-mini',mini);
   // v138: ângulo contínuo (sem dar a volta inteira ao cruzar o lado esquerdo, onde o ângulo pula de +180° para -180°)
   if(img){let alvo='';if(mini){const ant=Number(node.dataset.mvAng);let a=t.facing;if(Number.isFinite(ant)){a=ant+Math.atan2(Math.sin(t.facing-ant),Math.cos(t.facing-ant));}node.dataset.mvAng=a.toFixed(4);alvo=`rotate(${a.toFixed(3)}rad)`;}else delete node.dataset.mvAng;if(img.style.transform!==alvo)img.style.transform=alvo;}
   if(mini){
    // a borda do token (amarelo = selecionado, laranja = alvo) vira brilho em volta da figura
    const bc=String(node.style.borderColor||'').toLowerCase().replace(/\s/g,'');
    const sel=/255,212,71|ffd447/.test(bc)?'#ffd447':/255,120,85|ff7855/.test(bc)?'#ff7855':'';
    node.style.setProperty('--mv-sel',sel||'transparent');
    node.style.setProperty('--mv-anel-chao',CORES_TIPO[t.tipo]||CORES_TIPO.personagem);
    // v114: figura maior para ocupar o espaço real (pessoa ≈ 1 m); criaturas grandes crescem menos
    const ppm=(b.__bwV203||(b.__bwV203=b.clientWidth,setTimeout(()=>{b.__bwV203=0;},200),b.__bwV203))/(Number(b.dataset.mapaLargura)||28),dm=ppm>0?(parseFloat(node.style.width)||node.clientWidth)/ppm:1; // v203: largura vem do estilo (sem forçar layout por token)
    // v126: em mapas grandes (mais de 30 m de largura) a figura cresce menos, proporcional ao tamanho do mapa
    const Wm=Number(b.dataset.mapaLargura)||28,fm=Wm>30?Math.max(.55,28/Wm):1,base=dm>=5?1.15:dm>=2?1.3:1.8;
    const esc=String(Math.max(1,+(base*fm).toFixed(2)));if(node.style.getPropertyValue('--mv-esc')!==esc)node.style.setProperty('--mv-esc',esc);
   }
   const rot=[...node.children].find(c=>c.tagName==='SPAN'&&!c.dataset.facingHandle&&!c.dataset.stateSymbol&&!c.dataset.turnArrow&&!c.dataset.defenseBubble);
   if(rot&&!rot.classList.contains('mv-rotulo'))rot.classList.add('mv-rotulo');
   const f=fracaoPV(t.saude),mostrar=f!==null&&(mestre||(uid&&t.donoUid===uid));
   let barra=node.querySelector(':scope > .mv-pv');
   if(!mostrar){barra?.remove();continue;}
   if(!barra){barra=root.createElement('div');barra.className='mv-pv';barra.append(root.createElement('i'));node.append(barra);}
   const i=barra.firstChild,pct=Math.round(f*100);
   if(i.style.width!==pct+'%')i.style.width=pct+'%';
   const cor=f>.6?'#4fd17a':f>.3?'#f2c14e':'#ff5a4f';if(i.style.backgroundColor!==cor)i.style.backgroundColor=cor;
   barra.title='PV '+pct+'%';
  }
 }

 // ---------------------------------------------------------------- luz e névoa
 // v135: iluminação efetiva ("pela hora do jogo" segue o relógio ⏰)
 /* v205: névoa de guerra AUTOMÁTICA — só existe em lugar escuro, de noite ou com neblina; de dia, em lugar claro, a opção marcada fica de reserva e NADA escurece (quem limita a visão são paredes e a tela) */
 const nevoaPermitida=()=>{try{const a=ambNome();return a==='noite'||a==='escuro'||ef().clima==='neblina';}catch(_){return false;}};
 const ambNome=()=>config.ambiente==='auto'?(()=>{try{return win.mesaRelogio?.ambiente?.()||'dia';}catch(_){return 'dia';}})():config.ambiente;
 const ambAtual=()=>AMBIENTES[ambNome()]||AMBIENTES.dia;
 function luzes(m){
  const out=[];
  for(const o of m.objetos){const l=luzDoObjeto(o);if(l)out.push({...l,x:o.cx,y:o.cy,id:'o:'+o.id});}
  const raioPersonagem=config.luzPersonagens;
  // v135: lanterna equipada = cone de luz na direção em que o personagem olha
  if(ambAtual().alfa>0)for(const t of m.tokens){let ef=null;try{ef=win.mesaItensEfeito?.(t.id);}catch(_){}if(ef?.lanterna&&!(t.saude?.morto||t.saude?.inconsciente))out.push({cor:'#fff4d6',raio:12,x:t.x,y:t.y,id:'lant:'+t.id,cone:{dir:Number(t.facing)||0,meio:.55}});}
  if(raioPersonagem>0&&ambAtual().alfa>0)for(const t of m.tokens)if(t.tipo==='personagem'&&!(t.saude?.morto))out.push({cor:'#fff1d6',raio:raioPersonagem,x:t.x,y:t.y,id:'t:'+t.id,personagem:true});
  return out;
 }
 function calcularLuz(m){
  const lista=luzes(m);
  const uid=String(snap?.user?.uid||''),mestre=!!snap?.user?.master;
  const meus=mestre?[]:m.tokens.filter(t=>uid&&t.donoUid===uid);
  const olhos=mestre?m.tokens.filter(t=>t.tipo==='personagem'&&t.donoUid):meus;
  const chave=JSON.stringify([config,ambNome(),nevoaPermitida(),m.W,m.H,lista.map(l=>[l.id,l.x.toFixed(2),l.y.toFixed(2),l.raio,l.cone?l.cone.dir.toFixed(2):'']),olhos.map(t=>[t.x.toFixed(2),t.y.toFixed(2)]),m.bloqueios.length,m.bloqueios.slice(0,400).map(r=>[r.cx.toFixed(1),r.cy.toFixed(1)]).join(';'),mestre]);
  if(chave===chaveLuz&&cacheLuz)return cacheLuz;
  const diag=Math.hypot(m.W,m.H);
  cacheLuz={
   lista:lista.map(l=>({...l,poli:poligonoVisao(l,m.bloqueios,l.raio,m.W,m.H)})),
   visao:config.nevoa&&nevoaPermitida()?olhos.map(t=>poligonoVisao(t,m.bloqueios,diag,m.W,m.H)):[],
   nevoaAtiva:config.nevoa&&nevoaPermitida()&&(mestre?olhos.length>0:meus.length>0),
   mestre
  };
  chaveLuz=chave;return cacheLuz;
 }
 function caminho(ctx,poli,k){ctx.beginPath();poli.forEach((p,i)=>i?ctx.lineTo(p.x*k,p.y*k):ctx.moveTo(p.x*k,p.y*k));ctx.closePath();}
 function desenharLuz(m,agora){
  const c=camadas.luz,g=camadas.brilho,amb=ambAtual();
  const bw=cwV(camadas.board),bh=chV(camadas.board);
  const escala=qualidade==='baixa'?.35:.5,cw=Math.max(1,Math.round(bw*escala)),ch=Math.max(1,Math.round(bh*escala));
  for(const cv of [c,g])if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch;}
  const ctx=c.getContext('2d'),gtx=g.getContext('2d');
  ctx.clearRect(0,0,cw,ch);gtx.clearRect(0,0,cw,ch);
  const L=calcularLuz(m),k=cw/m.W,mestre=L.mestre;
  const alfa=amb.alfa*(mestre?.55:1);
  let animado=false;
  if(alfa>0){
   ctx.globalCompositeOperation='source-over';
   ctx.fillStyle=`rgba(${amb.cor.join(',')},${alfa})`;ctx.fillRect(0,0,cw,ch);
   ctx.globalCompositeOperation='destination-out';
   for(const l of L.lista){
    let f=1;if(l.tremula){animado=true;f=1+.07*l.tremula*Math.sin(agora/97+l.x*3)+.05*l.tremula*Math.sin(agora/53+l.y*5);}
    const r=l.raio*k*f,grad=ctx.createRadialGradient(l.x*k,l.y*k,0,l.x*k,l.y*k,r);
    grad.addColorStop(0,'rgba(0,0,0,1)');grad.addColorStop(.55,'rgba(0,0,0,.75)');grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.save();caminho(ctx,l.poli,k);ctx.clip();if(l.cone){ctx.beginPath();ctx.moveTo(l.x*k,l.y*k);ctx.arc(l.x*k,l.y*k,r,l.cone.dir-l.cone.meio,l.cone.dir+l.cone.meio);ctx.closePath();ctx.clip();}ctx.fillStyle=grad;ctx.fillRect(l.x*k-r,l.y*k-r,r*2,r*2);ctx.restore();
   }
   ctx.globalCompositeOperation='source-over';
  }
  // brilho colorido das fontes de luz (visível também de dia para fogo)
  for(const l of L.lista){
   if(l.personagem)continue;
   if(alfa<=0&&!l.fogo)continue;
   let f=1;if(l.tremula){animado=true;f=1+.1*l.tremula*Math.sin(agora/83+l.x*7);}
   const r=l.raio*k*(alfa>0?.9:.55)*f,grad=gtx.createRadialGradient(l.x*k,l.y*k,0,l.x*k,l.y*k,r),forca=alfa>0?.42:.25;
   grad.addColorStop(0,rgba(l.cor,forca));grad.addColorStop(1,rgba(l.cor,0));
   gtx.save();caminho(gtx,l.poli,k);gtx.clip();if(l.cone){gtx.beginPath();gtx.moveTo(l.x*k,l.y*k);gtx.arc(l.x*k,l.y*k,r,l.cone.dir-l.cone.meio,l.cone.dir+l.cone.meio);gtx.closePath();gtx.clip();}gtx.fillStyle=grad;gtx.fillRect(l.x*k-r,l.y*k-r,r*2,r*2);gtx.restore();
  }
  // névoa de guerra: camada própria = tudo escuro menos a união das áreas vistas
  if(L.nevoaAtiva){
   const nv=mestre?.28:1;
   if(!camadas.nevoa)camadas.nevoa=root.createElement('canvas');
   const n=camadas.nevoa;if(n.width!==cw||n.height!==ch){n.width=cw;n.height=ch;}
   const ntx=n.getContext('2d');ntx.globalCompositeOperation='source-over';ntx.clearRect(0,0,cw,ch);
   ntx.fillStyle=`rgba(3,5,12,${nv})`;ntx.fillRect(0,0,cw,ch);
   ntx.globalCompositeOperation='destination-out';ntx.fillStyle='#000';
   for(const p of L.visao){caminho(ntx,p,k);ntx.fill();}
   ntx.globalCompositeOperation='source-over';
   ctx.drawImage(n,0,0);
  }
  camadas.board.classList.toggle('mv-fogo-vivo',L.lista.some(l=>l.fogo));
  return animado;
 }

 // ---------------------------------------------------------------- clima
 function prepararClima(bw,bh){
  const e=ef(),tipo=e.clima,chave=tipo+'|'+e.abrigo;
  if(chave===climaChave&&(particulasClima.length||tipo==='nenhum'))return;
  climaAtual=tipo;climaChave=chave;particulasClima.length=0;if(tipo==='nenhum')return;
  const base={chuva:260,tempestade:430,neve:160,poeira:120,brasas:70,neblina:14,areia:420,meteoros:7}[tipo]||0;
  const dentro=abrigoDe(e.abrigo).particulas*(tipo==='neblina'?1:1);
  const n=Math.round(base*(bw*bh)/(1344*672)*e.intensidadeClima*dentro*(qualidade==='baixa'?.45:1));
  for(let i=0;i<n;i++)particulasClima.push(novaParticulaClima(tipo,bw,bh,true));
 }
 function novaParticulaClima(tipo,bw,bh,inicio){
  const r=Math.random;
  if(tipo==='chuva'||tipo==='tempestade')return {x:r()*bw*1.2-bw*.1,y:inicio?r()*bh:-20,v:520+r()*260,l:10+r()*12,a:.25+r()*.3};
  if(tipo==='neve')return {x:r()*bw,y:inicio?r()*bh:-6,v:25+r()*35,s:1+r()*2.4,f:r()*6.28,a:.5+r()*.45};
  if(tipo==='poeira')return {x:inicio?r()*bw:-10,y:r()*bh,v:70+r()*90,s:1+r()*2.2,f:r()*6.28,a:.18+r()*.3};
  if(tipo==='areia')return {x:inicio?r()*bw:-10,y:r()*bh,v:260+r()*260,s:.8+r()*2.4,f:r()*6.28,a:.25+r()*.4,l:6+r()*16};
  if(tipo==='meteoros')return {x:r()*bw*1.1,y:inicio?r()*bh*-.5:-40-r()*bh,v:380+r()*360,l:40+r()*70,a:.55+r()*.4,s:1.4+r()*1.8,espera:inicio?r()*4:r()*5};
  if(tipo==='brasas')return {x:r()*bw,y:inicio?r()*bh:bh+6,v:22+r()*40,s:1+r()*1.8,f:r()*6.28,a:.5+r()*.5,vida:r()};
  return {x:r()*bw,y:r()*bh,v:6+r()*10,s:120+r()*180,f:r()*6.28,a:.05+r()*.07};
 }
 function desenharClima(dt,agora){
  const c=camadas.clima,bw=cwV(camadas.board),bh=chV(camadas.board);
  if(c.width!==bw||c.height!==bh){c.width=bw;c.height=bh;}
  const ctx=c.getContext('2d');ctx.clearRect(0,0,bw,bh);
  prepararClima(bw,bh);const tipo=climaAtual;if(tipo==='nenhum'||!particulasClima.length)return desenharPerigo(ctx,bw,bh,agora);
  const vento=Math.sin(agora/4000)*.5;
  const perigo=desenharPerigo(ctx,bw,bh,agora);
  if(tipo==='areia'){const a=Math.min(.42,.22*ef().intensidadeClima*abrigoDe(ef().abrigo).particulas)*(.85+.15*Math.sin(agora/700));ctx.fillStyle=`rgba(150,100,45,${a})`;ctx.fillRect(0,0,bw,bh);}
  for(let i=0;i<particulasClima.length;i++){
   const p=particulasClima[i];
   if(tipo==='chuva'||tipo==='tempestade'){
    const vt=tipo==='tempestade'?.45:.18;p.y+=p.v*dt*(tipo==='tempestade'?1.25:1);p.x+=p.v*dt*(vt+vento*.15);
    ctx.strokeStyle=`rgba(170,200,255,${p.a})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.l*.2,p.y-p.l);ctx.stroke();
    if(p.y>bh+20){if(Math.random()<.35){efeitos.push({tipo:'respingo',x:p.x,y:bh*Math.random(),t:0,d:.35});}particulasClima[i]=novaParticulaClima(tipo,bw,bh,false);}
   }else if(tipo==='neve'){
    p.f+=dt;p.y+=p.v*dt;p.x+=Math.sin(p.f)*12*dt+vento*10*dt;
    ctx.fillStyle=`rgba(255,255,255,${p.a})`;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.283);ctx.fill();
    if(p.y>bh+6)particulasClima[i]=novaParticulaClima(tipo,bw,bh,false);
   }else if(tipo==='poeira'){
    p.f+=dt*2;p.x+=p.v*dt;p.y+=Math.sin(p.f)*8*dt;
    ctx.fillStyle=`rgba(214,180,120,${p.a})`;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.283);ctx.fill();
    if(p.x>bw+10)particulasClima[i]=novaParticulaClima(tipo,bw,bh,false);
   }else if(tipo==='areia'){
    p.f+=dt*3;p.x+=p.v*dt;p.y+=Math.sin(p.f)*22*dt+p.v*dt*.08;
    ctx.strokeStyle=`rgba(196,140,70,${p.a})`;ctx.lineWidth=p.s;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.l,p.y-p.l*.08);ctx.stroke();
    if(p.x>bw+20||p.y>bh+10)particulasClima[i]=novaParticulaClima(tipo,bw,bh,false);
   }else if(tipo==='meteoros'){
    if(p.espera>0){p.espera-=dt;continue;}
    p.y+=p.v*dt;p.x-=p.v*dt*.55;
    const dx=p.l*.55,dy=-p.l,g=ctx.createLinearGradient(p.x,p.y,p.x+dx,p.y+dy);g.addColorStop(0,`rgba(255,240,200,${p.a})`);g.addColorStop(.25,`rgba(255,150,60,${p.a*.8})`);g.addColorStop(1,'rgba(255,90,30,0)');
    ctx.strokeStyle=g;ctx.lineWidth=p.s*1.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+dx,p.y+dy);ctx.stroke();ctx.lineCap='butt';
    ctx.fillStyle=`rgba(255,250,225,${p.a})`;ctx.shadowColor='rgba(255,140,50,.9)';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.283);ctx.fill();ctx.shadowBlur=0;
    if(p.y>bh+30||p.x<-60)particulasClima[i]=novaParticulaClima(tipo,bw,bh,false);
   }else if(tipo==='brasas'){
    p.f+=dt*3;p.y-=p.v*dt;p.x+=Math.sin(p.f)*14*dt;p.vida+=dt*.25;
    const a=p.a*(1-Math.min(1,p.vida));ctx.fillStyle=`rgba(255,${120+Math.round(80*Math.sin(p.f))},40,${Math.max(0,a)})`;
    ctx.shadowColor='rgba(255,120,40,.8)';ctx.shadowBlur=6;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.283);ctx.fill();ctx.shadowBlur=0;
    if(p.y<-6||p.vida>=1)particulasClima[i]=novaParticulaClima(tipo,bw,bh,false);
   }else{
    p.f+=dt*.2;p.x+=p.v*dt;if(p.x-p.s>bw)p.x=-p.s;
    const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s);g.addColorStop(0,`rgba(225,232,240,${p.a*(1+.3*Math.sin(p.f))})`);g.addColorStop(1,'rgba(225,232,240,0)');
    ctx.fillStyle=g;ctx.fillRect(p.x-p.s,p.y-p.s,p.s*2,p.s*2);
   }
  }
  return true||perigo;
 }
 function desenharPerigo(ctx,bw,bh,agora){
  const p=config.perigo;if(!p)return false;const n=p.nivel;
  if(p.tipo==='enchente'){
   ctx.fillStyle=`rgba(58,84,92,${.18+.42*n})`;ctx.fillRect(0,0,bw,bh);
   ctx.strokeStyle=`rgba(200,225,235,${.12+.25*n})`;ctx.lineWidth=1.4;
   for(let i=0;i<Math.round(40*(.4+n));i++){const x=(i*137.5+agora*.02*(1+i%3))%bw,y=(i*89.3)%bh,r=6+((agora/60+i*13)%28);ctx.globalAlpha=1-r/34;ctx.beginPath();ctx.ellipse(x,y,r,r*.45,0,0,6.283);ctx.stroke();}
   ctx.globalAlpha=1;
  }else{
   const cor=p.tipo==='gas'?'120,190,80':'150,150,150';
   for(let i=0;i<18;i++){const x=((i*211+agora*.012*(1+i%4))%(bw+300))-150,y=(i*97.7)%bh,r=120+40*Math.sin(agora/1500+i);const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${cor},${.10+.25*n})`);g.addColorStop(1,`rgba(${cor},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  }
  return true;
 }

 // ---------------------------------------------------------------- efeitos de ataque
 function px(m,p){const b=camadas.board;return {x:(Number(p.x)||0)/28*cwV(b),y:(Number(p.y)||0)/14*chV(b)};}
 function faiscas(x,y,cor,n,vel=180,vida=.5,gravidade=0){
  for(let i=0;i<n;i++){const a=Math.random()*6.283,v=vel*(.35+Math.random()*.65);efeitos.push({tipo:'faisca',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:gravidade,cor,t:0,d:vida*(.5+Math.random()*.5),s:1+Math.random()*2});}
 }
 function ataque(event){
  if(!ligado()||!event?.source||!event?.target)return false;
  const cam=montar();if(!cam)return false;
  const m=mundo()||{W:28,H:14};
  const a=px(m,event.source),b=px(m,event.target),tipo=classificarAtaque(event.item),acerto=event.hit!==false,critico=/cr[ií]tico/i.test(String(event.grade||event.message||''));
  const ppm=cwV(cam.board)/(m.W||28);
  const cores={laser:'#ff4b4b',energia:'#c56cff',blaster:'#ffd447',bala:'#ffe6a0',flecha:'#d9c7a0',lamina:'#bff4ff',mordida:'#fff2dc',garra:'#ffd0c0',esmagar:'#d8b98c',soco:'#ffffff',impacto:'#f0f0f0',psi:'#d6a6ff',sonico:'#8fe3ff',sopro:'#ffa23c'};
  const cor=cores[tipo]||'#fff';
  // v132: raio da tempestade / meteoro — o mesa-efeitos desenha a queda; aqui só o impacto em quem foi atingido
  if(event.natureza==='clima'){if(acerto&&event.target?.id)aplicarImpacto(b,/meteor/i.test(String(event.item?.nome||''))?'#ffb070':'#dfe8ff','impacto',false,ppm,event);agendar();return true;}
  // se errou, o projétil passa do alvo
  const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||1;
  const desvio=acerto?{x:b.x,y:b.y}:{x:b.x+dx/dist*ppm*1.5+(-dy/dist)*ppm*.6,y:b.y+dy/dist*ppm*1.5+(dx/dist)*ppm*.6};
  if(['laser','energia','blaster','bala','flecha'].includes(tipo)){
   const vel=tipo==='bala'?2600:tipo==='flecha'?900:1800;
   efeitos.push({tipo:'clarao',x:a.x,y:a.y,cor,t:0,d:.12,r:ppm*.35});
   efeitos.push({tipo:'projetil',de:a,para:desvio,cor,estilo:tipo,t:0,d:Math.max(.08,dist/vel),acerto,critico,ao:()=>{if(acerto)aplicarImpacto(b,cor,tipo,critico,ppm,event);else efeitos.push({tipo:'texto',x:b.x,y:b.y-ppm*.6,txt:'errou',cor:'#cfd6e6',t:0,d:1.1,tam:12});}});
  }else if(tipo==='psi'){
   efeitos.push({tipo:'onda',x:b.x,y:b.y,cor,t:0,d:.9,r:ppm*1.6,aneis:3});
   efeitos.push({tipo:'fio',de:a,para:b,cor,t:0,d:.6});
   if(acerto)aplicarImpacto(b,cor,tipo,critico,ppm,event);
  }else if(tipo==='sopro'){ // v201: baforada/jato em CONE saindo de quem ataca na direção do alvo
   const dirS=Math.atan2(dy,dx),alc=Math.max(dist*1.1,ppm*3.5);
   efeitos.push({tipo:'cone',x:a.x,y:a.y,dir:dirS,meio:Math.PI/9,alcance:alc,cor,t:0,d:.9});
   for(let j=0;j<14;j++){const t2=Math.random()*alc,ang=dirS+(Math.random()-.5)*Math.PI/5;efeitos.push({tipo:'faisca',x:a.x+Math.cos(ang)*t2,y:a.y+Math.sin(ang)*t2,vx:Math.cos(ang)*60,vy:Math.sin(ang)*60,g:0,cor,t:0,d:.5,s:2+Math.random()*2});}
   if(acerto)aplicarImpacto(b,cor,tipo,critico,ppm,event);else efeitos.push({tipo:'texto',x:b.x,y:b.y-ppm*.6,txt:'errou',cor:'#cfd6e6',t:0,d:1.1,tam:12});
  }else if(tipo==='sonico'){
   const area=event.area;
   if(area?.source&&area?.aim){
    const s=px(m,area.source),alvo=px(m,area.aim),dir=Math.atan2(alvo.y-s.y,alvo.x-s.x),meio=(Number(area.angle)||60)*Math.PI/360;
    const alcance=(Number(area.range)||8)*cwV(cam.board)/(Number(area.width)||m.W||28);
    efeitos.push({tipo:'cone',x:s.x,y:s.y,dir,meio,alcance,cor,t:0,d:1.1});
   }else{ // sem área informada (criaturas): cone de som saindo de quem grita na direção do alvo, com ondas
    const dirS=Math.atan2(dy,dx);efeitos.push({tipo:'cone',x:a.x,y:a.y,dir:dirS,meio:Math.PI/6,alcance:Math.max(dist*1.15,ppm*4.5),cor,t:0,d:1.1});
    efeitos.push({tipo:'onda',x:a.x,y:a.y,cor,t:0,d:.8,r:ppm*1.4,aneis:3});
   }
   if(acerto)aplicarImpacto(b,cor,tipo,critico,ppm,event);
  }else{
   efeitos.push({tipo:'golpe',x:b.x,y:b.y,ang:Math.atan2(dy,dx),cor,estilo:tipo,t:0,d:.35,r:ppm*.7,acerto});
   if(acerto)aplicarImpacto(b,cor,tipo,critico,ppm,event);else efeitos.push({tipo:'texto',x:b.x,y:b.y-ppm*.6,txt:'errou',cor:'#cfd6e6',t:0,d:1.1,tam:12});
  }
  agendar();
  return true;
 }
 function aplicarImpacto(b,cor,tipo,critico,ppm,event){
  const sangue=['mordida','garra','lamina','bala','flecha'].includes(tipo);
  faiscas(b.x,b.y,sangue?'#b3122a':cor,critico?26:14,ppm*4,.55,sangue?ppm*6:0);
  efeitos.push({tipo:'anel',x:b.x,y:b.y,cor:critico?'#ffd447':cor,t:0,d:critico?.6:.35,r:ppm*(critico?1.4:.8)});
  if(sangue)efeitos.push({tipo:'mancha',x:b.x+(Math.random()-.5)*ppm*.5,y:b.y+(Math.random()-.5)*ppm*.5,r:ppm*(.18+Math.random()*.18),t:0,d:45,semente:Math.random()});
  const dano=Number(event?.damage);
  if(Number.isFinite(dano)&&dano>0)efeitos.push({tipo:'texto',x:b.x,y:b.y-ppm*.6,txt:'−'+Math.round(dano),cor:critico?'#ffd447':'#ff6b6b',t:0,d:1.4,tam:critico?22:16});
  else if(critico)efeitos.push({tipo:'texto',x:b.x,y:b.y-ppm*.6,txt:'CRÍTICO',cor:'#ffd447',t:0,d:1.3,tam:15});
 }
 function desenharFx(dt){
  const c=camadas.fx,bw=cwV(camadas.board),bh=chV(camadas.board);
  if(c.width!==bw||c.height!==bh){c.width=bw;c.height=bh;}
  const ctx=c.getContext('2d');ctx.clearRect(0,0,bw,bh);
  for(let i=efeitos.length-1;i>=0;i--){
   const e=efeitos[i];e.t+=dt;const k=Math.min(1,e.t/e.d);
   if(k>=1){
    if(e.tipo==='projetil'&&!e.chegou){e.chegou=true;efeitos.splice(i,1);faiscas(e.para.x,e.para.y,e.cor,e.acerto?10:5,160,.4);try{e.ao?.();}catch(_){}continue;}
    efeitos.splice(i,1);continue;
   }
   ctx.save();
   if(e.tipo==='projetil'){
    const x=e.de.x+(e.para.x-e.de.x)*k,y=e.de.y+(e.para.y-e.de.y)*k,ang=Math.atan2(e.para.y-e.de.y,e.para.x-e.de.x);
    const cauda=e.estilo==='laser'?60:e.estilo==='bala'?26:e.estilo==='flecha'?18:34;
    ctx.translate(x,y);ctx.rotate(ang);
    ctx.shadowColor=e.cor;ctx.shadowBlur=e.estilo==='flecha'?0:12;
    const g=ctx.createLinearGradient(-cauda,0,0,0);g.addColorStop(0,rgba(e.cor,0));g.addColorStop(1,rgba(e.cor,1));
    ctx.strokeStyle=g;ctx.lineWidth=e.estilo==='laser'?3:e.estilo==='bala'?2:e.estilo==='flecha'?2:4;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-cauda,0);ctx.lineTo(0,0);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,e.estilo==='flecha'?1.5:2.2,0,6.283);ctx.fill();
   }else if(e.tipo==='clarao'||e.tipo==='anel'){
    const r=e.r*(e.tipo==='anel'?(.4+k*.9):(1-k*.3));
    if(e.tipo==='clarao'){const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,r);g.addColorStop(0,rgba('#ffffff',.9*(1-k)));g.addColorStop(.4,rgba(e.cor,.6*(1-k)));g.addColorStop(1,rgba(e.cor,0));ctx.fillStyle=g;ctx.fillRect(e.x-r,e.y-r,r*2,r*2);}
    else{ctx.strokeStyle=rgba(e.cor,1-k);ctx.lineWidth=3*(1-k)+1;ctx.beginPath();ctx.arc(e.x,e.y,r,0,6.283);ctx.stroke();}
   }else if(e.tipo==='faisca'){
    e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=(e.g||0)*dt;e.vx*=.94;e.vy*=.94;
    ctx.fillStyle=rgba(e.cor,1-k);ctx.beginPath();ctx.arc(e.x,e.y,e.s*(1-k*.5),0,6.283);ctx.fill();
   }else if(e.tipo==='golpe'){
    ctx.translate(e.x,e.y);ctx.rotate(e.ang);
    ctx.strokeStyle=rgba(e.cor,(1-k)*(e.acerto?1:.55));ctx.lineCap='round';ctx.shadowColor=e.cor;ctx.shadowBlur=8;
    if(e.estilo==='garra'||e.estilo==='mordida'){
     const n=e.estilo==='garra'?3:2;ctx.lineWidth=3;
     for(let j=0;j<n;j++){const o=(j-(n-1)/2)*e.r*.35;ctx.beginPath();ctx.moveTo(-e.r*.6,o-e.r*.4*k);ctx.lineTo(e.r*.6*k,o+e.r*.3);ctx.stroke();}
    }else if(e.estilo==='esmagar'||e.estilo==='soco'||e.estilo==='impacto'){
     ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r*(.3+k*.7),0,6.283);ctx.stroke();
     for(let j=0;j<6;j++){const a=j*1.047;ctx.beginPath();ctx.moveTo(Math.cos(a)*e.r*.35,Math.sin(a)*e.r*.35);ctx.lineTo(Math.cos(a)*e.r*(.5+k*.6),Math.sin(a)*e.r*(.5+k*.6));ctx.stroke();}
    }else{
     ctx.lineWidth=4;ctx.beginPath();ctx.arc(-e.r*.4,0,e.r,-1.1+k*.4,1.1*k+.2);ctx.stroke();
    }
   }else if(e.tipo==='onda'){
    for(let j=0;j<(e.aneis||3);j++){const kk=Math.min(1,Math.max(0,k*1.4-j*.18));if(kk<=0)continue;ctx.strokeStyle=rgba(e.cor,(1-kk)*.9);ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r*kk,0,6.283);ctx.stroke();}
   }else if(e.tipo==='fio'){
    const mx=(e.de.x+e.para.x)/2,my=(e.de.y+e.para.y)/2-30;
    ctx.strokeStyle=rgba(e.cor,.8*(1-k));ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.lineDashOffset=-e.t*80;
    ctx.beginPath();ctx.moveTo(e.de.x,e.de.y);ctx.quadraticCurveTo(mx,my,e.para.x,e.para.y);ctx.stroke();
   }else if(e.tipo==='cone'){
    ctx.fillStyle=rgba(e.cor,.27*(1-k));ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,e.alcance,e.dir-e.meio,e.dir+e.meio);ctx.closePath();ctx.fill();ctx.strokeStyle=rgba(e.cor,.7*(1-k));ctx.lineWidth=1.6;ctx.stroke();
    for(let j=0;j<4;j++){const kk=((k*1.6+j*.25)%1);ctx.strokeStyle=rgba(e.cor,.85*(1-kk)*(1-k*.5));ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(e.x,e.y,e.alcance*kk,e.dir-e.meio,e.dir+e.meio);ctx.stroke();}
   }else if(e.tipo==='texto'){
    const y=e.y-28*k;ctx.globalAlpha=k<.7?1:1-(k-.7)/.3;ctx.font=`800 ${e.tam}px 'Segoe UI',Arial,sans-serif`;ctx.textAlign='center';
    ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.strokeText(e.txt,e.x,y);ctx.fillStyle=e.cor;ctx.fillText(e.txt,e.x,y);
   }else if(e.tipo==='mancha'){
    ctx.globalAlpha=k<.85?.55:.55*(1-(k-.85)/.15);ctx.fillStyle='#5e0a15';
    let s=e.semente*1000;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};
    ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,6.283);ctx.fill();
    for(let j=0;j<5;j++){const a=rnd()*6.283,d=e.r*(.8+rnd()*.9);ctx.beginPath();ctx.arc(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d,e.r*(.15+rnd()*.3),0,6.283);ctx.fill();}
   }else if(e.tipo==='respingo'){
    ctx.strokeStyle=`rgba(190,215,255,${.5*(1-k)})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(e.x,e.y,2+k*6,1+k*2.5,0,0,6.283);ctx.stroke();
   }
   ctx.restore();
  }
  // fogo vivo nos objetos em chamas
  const m=mundo();
  if(m){const k=bw/m.W;for(const o of m.objetos)if(o.pegandoFogo&&!o.destruido){
   const n=qualidade==='baixa'?1:2;
   for(let j=0;j<n;j++)efeitos.push({tipo:'chama',x:(o.cx+(Math.random()-.5)*o.w*.7)*k,y:(o.cy+(Math.random()-.2)*o.h*.5)*k,vy:-(18+Math.random()*30),s:k*(.12+Math.random()*.16),t:0,d:.45+Math.random()*.45});
  }}
  for(let i=efeitos.length-1;i>=0;i--){const e=efeitos[i];if(e.tipo!=='chama')continue;e.y+=e.vy*dt;e.x+=Math.sin(e.t*9+i)*12*dt;
   const k=Math.min(1,e.t/e.d);ctx.save();ctx.globalCompositeOperation='lighter';const r=e.s*(1-k*.6),g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,r);
   g.addColorStop(0,`rgba(255,${Math.round(170-110*k)},${Math.round(50-45*k)},${.55*(1-k)})`);g.addColorStop(.6,`rgba(230,70,10,${.25*(1-k)})`);g.addColorStop(1,'rgba(200,40,0,0)');ctx.fillStyle=g;ctx.fillRect(e.x-r,e.y-r,r*2,r*2);ctx.restore();}
  return efeitos.length>0;
 }

 // ---------------------------------------------------------------- laço de animação
 function agendar(){if(!raf&&ligado()&&camadas)raf=win.requestAnimationFrame(quadro);}
 const quadro=seguro('quadro',agora=>{
  raf=0;if(!ligado()||!camadas)return;
  if(root.hidden||!camadas.board.isConnected||!visV(camadas.board)){ultimoQuadro=0;return;}
  const dt=ultimoQuadro?Math.min(.05,(agora-ultimoQuadro)/1000):.016;ultimoQuadro=agora;
  const inicio=win.performance?.now?.()||0;
  const m=mundo();let continuar=false;
  if(m){
   enfeitarTokens(m);
   // luz: no máximo ~20 quadros/s, ou quando algo muda
   if(agora-tLuz>48||!cacheLuz){tLuz=agora;continuar=desenharLuz(m,agora)||continuar;}
   else continuar=true;
  }
  continuar=desenharClima(dt,agora)||continuar;
  continuar=desenharFx(dt)||continuar;
  const custo=(win.performance?.now?.()||0)-inicio;
  if(custo>24&&qualidade==='alta'){if(!lentoDesde)lentoDesde=agora;else if(agora-lentoDesde>2500){qualidade='baixa';particulasClima.length=0;climaAtual='';climaChave='';cacheLuz=null;console.info('[Mesa Visual] qualidade reduzida automaticamente para manter o mapa fluido.');atualizarPainel();}}
  else lentoDesde=0;
  if(continuar||cacheLuz&&cacheLuz.lista.some(l=>l.tremula))raf=win.requestAnimationFrame(quadro);
 });

 // ---------------------------------------------------------------- painel
 let botao=null,painel=null;
 function nota(t){const n=painel?.querySelector('.mv-nota');if(n)n.textContent=t||'';}
 function instalarBotao(){
  if(botao?.isConnected)return;
  const barra=root.querySelector('#sincronizacao-nova .nova-view-tools');if(!barra)return;
  botao=root.createElement('button');botao.type='button';botao.id='mesaVisualBotao';botao.className='btn-small';botao.textContent='🎨';botao.title='Visual do mapa: luz, névoa, clima e efeitos';
  botao.addEventListener('click',e=>{e.stopPropagation();painel?.isConnected?fecharPainel():abrirPainel();});
  barra.append(botao);
 }
 function fecharPainel(){painel?.remove();painel=null;}
 function abrirPainel(){
  fecharPainel();instalarCss();
  painel=root.createElement('div');painel.className='mv-pop';painel.addEventListener('click',e=>e.stopPropagation());
  root.body.append(painel);atualizarPainel();posicionarPainel();
  const fora=()=>{fecharPainel();root.removeEventListener('click',fora);};setTimeout(()=>root.addEventListener('click',fora),0);
 }
 function posicionarPainel(){
  if(!painel||!botao)return;const r=botao.getBoundingClientRect(),w=painel.offsetWidth||270;
  painel.style.top=Math.min(win.innerHeight-20,r.bottom+6)+'px';painel.style.left=Math.max(12,Math.min(win.innerWidth-w-12,r.left))+'px';
 }
 function atualizarPainel(){
  if(botao)botao.style.opacity=ligado()?'1':'.55';
  if(!painel)return;
  const mestre=!!snap?.user?.master,c=config;
  const opt=(obj,v)=>Object.entries(obj).map(([k,n])=>`<option value="${k}"${k===v?' selected':''}>${typeof n==='string'?n:n.nome}</option>`).join('');
  painel.innerHTML=`<h4>🎨 Visual do mapa</h4>
   <label>Efeitos neste aparelho <input type="checkbox" data-k="ativo"${ativo?' checked':''}${desligadoPorErro?' disabled':''}></label>
   <label>Qualidade <select data-k="qualidade"><option value="alta"${qualidade==='alta'?' selected':''}>Alta</option><option value="baixa"${qualidade==='baixa'?' selected':''}>Leve</option></select></label>
   ${mestre?`<div class="mv-sep">Mestre · vale para todos neste mapa</div>
   <label>Iluminação <select data-k="ambiente">${opt(AMBIENTES,c.ambiente)}</select></label>
   <label title="Automática: a névoa só aparece em lugar escuro, de noite ou com neblina. De dia, em lugar claro, não existe.">Névoa (auto: escuro/noite/neblina) <input type="checkbox" data-k="nevoa"${c.nevoa?' checked':''}></label>
   <label>Clima <select data-k="clima">${opt(CLIMAS,ef().clima)}</select></label>
   <label title="Marcado: o clima vale para todos os mapas (o cenário inteiro). Desmarcado: só para este mapa.">Cenário inteiro <input type="checkbox" data-k="climaGlobal"${global?.ativo?' checked':''}></label>
   <label>Intensidade <input type="range" min="0.2" max="2" step="0.1" value="${ef().intensidadeClima}" data-k="intensidadeClima"></label>
   <label title="Dentro de um abrigo os personagens veem a luz e ouvem o barulho do clima, mas são pouco ou nada atingidos. Meteoros ainda podem furar o teto.">Abrigo <select data-k="abrigo">${ABRIGOS.map((a,i)=>`<option value="${i}"${i===c.abrigo?' selected':''}>${a.nome}</option>`).join('')}</select></label>
   <label>Luz dos personagens <input type="range" min="0" max="10" step="0.5" value="${c.luzPersonagens}" data-k="luzPersonagens" title="${c.luzPersonagens} m"></label>`:
   `<div class="mv-sep">Mapa atual</div><div>${AMBIENTES[c.ambiente].nome}${ef().clima!=='nenhum'?' · '+CLIMAS[ef().clima]:''}${c.nevoa?' · névoa de guerra':''}${c.abrigo?' · '+ABRIGOS[c.abrigo].nome:''}</div>`}
   <div class="mv-nota">${desligadoPorErro?'⚠️ Desligada automaticamente por erro ('+escapar(ultimoErro)+'). O mapa continua normal. Recarregue a página para tentar de novo.':!configMapa?'Abra um mapa para configurar.':''}</div>`;
  painel.querySelectorAll('[data-k]').forEach(inp=>inp.addEventListener(inp.type==='range'?'change':'input',()=>{
   const k=inp.dataset.k,v=inp.type==='checkbox'?inp.checked:inp.value;
   if(k==='ativo'){ativo=!!v;gravarPref('ativo',ativo?'1':'0');if(ativo){montar();chaveLuz='';agendar();}else desmontar();atualizarPainel();return;}
   if(k==='qualidade'){qualidade=v;gravarPref('qualidade',v);particulasClima.length=0;climaAtual='';climaChave='';cacheLuz=null;agendar();return;}
   if(k==='climaGlobal'){void salvarGlobal({ativo:!!v,clima:ef().clima,intensidadeClima:ef().intensidadeClima});return;}
   if((k==='clima'||k==='intensidadeClima')&&global?.ativo){void salvarGlobal({[k]:inp.type==='range'?Number(v):v});return;}
   salvarConfig({[k]:inp.type==='range'||k==='abrigo'?Number(v):v});
  }));
 }
 const escapar=s=>String(s||'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

 // ---------------------------------------------------------------- API pública
 const sync=seguro('sync',s=>{
  snap=s||null;
  instalarBotao();
  observarConfig(String(s?.mapId||''));
  try{const b=board();if(b&&b.dataset.mapaVisivel!==String(s?.mapId||'')){b.dataset.mapaVisivel=String(s?.mapId||'');b.dataset.mapaLargura=String(s?.larguraM||28);b.dataset.mapaAltura=String(s?.alturaM||14);b.dispatchEvent(new CustomEvent('mesa-mapa-visivel',{detail:{mapId:String(s?.mapId||'')}}));}}catch(_){}
  if(!ligado())return;
  if(!montar())return;
  agendar();
 });
 return {
  sync,
  ataque:seguro('ataque',ataque),
  ligado,
  estado:()=>({ativo,desligadoPorErro,erros,ultimoErro,qualidade,config:{...config},mapa:configMapa,efeitos:efeitos.length}),
  destruir(){try{pararConfig?.();pararGlobal?.();fecharPainel();desmontar();botao?.remove();}catch(_){}}
 };
}
