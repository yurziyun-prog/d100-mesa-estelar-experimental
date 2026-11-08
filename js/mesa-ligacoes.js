// Mesa Estelar v126 — Mapas ligados: saídas, viagem entre mapas, mapa geral e mapas intermediários.
//
// • Saídas (🚪➜) ficam nas bordas/portas dos mapas e ligam um mapa a outro (nos dois sentidos).
//   O jogador perto da saída clica e segue para o outro mapa; quando o último personagem sai, a
//   mesa abre o mapa novo sozinha. O mestre pode "levar o grupo", abrir o destino, arrastar a
//   saída para o lugar certo ou removê-la.
// • 🕸️ Mapa geral: esquema de todos os mapas e ligações; clique num mapa para abri-lo.
//   "Montar pelos cenários" cria as ligações a partir dos destinos de cada cenário. Quando dois
//   lugares ligados ficam em regiões diferentes (cidade ↔ fora da cidade, Cidade Baixa ↔ Cidade
//   Superior, serra ↔ palácio…), cria um MAPA INTERMEDIÁRIO de rua/estrada com o aviso para o
//   mestre: "Este mapa representa o espaço entre X e Y".
// • O seletor de mapas da barra passa a seguir a ordem de acesso (quem leva a quem).
// Módulo à parte: se falhar, o mapa segue igual.

import {gerarMapa,sugerirEstilo} from './mesa-gerador-mapas.js?v=141';
import {cenaDoEstado,LIMITE_CENA} from './mesa-mapas-ui.js?v=141';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const clean=v=>JSON.parse(JSON.stringify(v??null));
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',HIST='combatesAtivos/mapaMesaSyncHistorico';
export const LIGACOES='combatesAtivos/mesaLigacoes';
export const PEDIDOS='combatesAtivos/mesaLigacoes/acoes';
export const ALCANCE_SAIDA=1.6;
const uidNovo=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

// ---------------------------------------------------------------- regiões dos cenários
export function zonaDoLocal(local=''){
 const l=sem(local);
 if(/regiao|bosque|floresta|serra|mina|estrada|mar de|norte de|deserto|calico|area externa|cordilheira|trilha/.test(l))return 'rural';
 return 'urbano';
}
const setorUrbano=l=>/superior/.test(sem(l))?'superior':'base';
const ehViagem=c=>/viagem|pilotagem/.test(sem(c?.tipo))||/estrada/.test(sem(c?.local));
// Precisa de mapa intermediário entre os dois cenários? Devolve o tipo do mapa (cidade/ermos/floresta) ou ''.
export function tipoIntermediario(ca,cb){
 if(!ca||!cb||ehViagem(ca)||ehViagem(cb))return '';
 const za=zonaDoLocal(ca.local),zb=zonaDoLocal(cb.local);
 if(za==='urbano'&&zb==='urbano')return setorUrbano(ca.local)!==setorUrbano(cb.local)?'cidade':'';
 if(za!==zb)return 'ermos';
 const ra=sem(ca.local).split(' - ')[0],rb=sem(cb.local).split(' - ')[0];
 if(ra===rb&&!/serra|palacio|cordilheira/.test(sem(ca.nome+cb.nome)))return '';
 return /bosque|floresta/.test(sem(ca.local+cb.local))?'floresta':'ermos';
}
// Pares de mapas ligados pelos destinos dos cenários (sem repetir; nos dois sentidos).
export function paresDosCenarios(cenarios=[]){
 const porId=new Map(cenarios.map(c=>[String(c.id),c])),vistos=new Set(),out=[];
 for(const c of cenarios){
  for(const k of ['destino1','destino2','destino3']){
   const d=String(c?.[k]||'').trim(),cd=porId.get(d);if(!cd||d===String(c.id))continue;
   const ma=String(c.mapaId||''),mb=String(cd.mapaId||'');if(!ma||!mb||ma===mb)continue;
   const chave=[ma,mb].sort().join('|');if(vistos.has(chave))continue;vistos.add(chave);
   out.push({ca:c,cb:cd,ma,mb,tipo:tipoIntermediario(c,cd)});
  }
 }
 return out;
}
// Lugar da n-ésima saída na borda do mapa (normalizado 28×14): leste, oeste, norte, sul…
export function pontoDeBorda(n,lado=null){
 const lados=['leste','oeste','sul','norte'],l=lado||lados[n%4],k=Math.floor(n/4),f=[.5,.3,.7,.15,.85][k%5];
 if(l==='leste')return {x:27.2,y:14*f,lado:l};if(l==='oeste')return {x:.8,y:14*f,lado:l};
 if(l==='norte')return {x:28*f,y:.8,lado:l};return {x:28*f,y:13.2,lado:l};
}
// v138: saídas coerentes — quem sai pela direita entra pela esquerda do próximo mapa (e vice-versa);
// quem sai por cima entra por baixo. Pontos no meio do mapa (portas internas) não têm lado.
export const LEGENDA_PERTO=3.5;
export const OPOSTO={leste:'oeste',oeste:'leste',norte:'sul',sul:'norte'};
export function ladoDoPonto(p){
 const x=Number(p?.x),y=Number(p?.y);if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 const d={leste:28-x,oeste:x,norte:y*2,sul:(14-y)*2}; // y vale o dobro (mapa 2:1)
 const [lado,dist]=Object.entries(d).sort((a,b)=>a[1]-b[1])[0];return dist<=2.2?lado:null;
}
export function pontoOposto(p,lado=ladoDoPonto(p)){
 if(!lado)return null;const x=Math.max(.8,Math.min(27.2,Number(p.x))),y=Math.max(.8,Math.min(13.2,Number(p.y)));
 if(lado==='leste')return {x:.8,y,lado:'oeste'};if(lado==='oeste')return {x:27.2,y,lado:'leste'};
 if(lado==='norte')return {x,y:13.2,lado:'sul'};return {x,y:.8,lado:'norte'};
}
// Afasta o ponto ao longo da borda se já houver outra saída perto (no mesmo mapa).
export function afastarNaBorda(p,ocupados=[]){
 const lado=ladoDoPonto(p),hor=lado==='norte'||lado==='sul';let q={...p};
 for(let k=0;k<12&&ocupados.some(o=>Math.hypot(Number(o.x)-q.x,Number(o.y)-q.y)<1.6);k++){const passo=(k%2?-1:1)*(Math.floor(k/2)+1)*1.8;q=hor?{...q,x:Math.max(1,Math.min(27,p.x+passo))}:{...q,y:Math.max(1,Math.min(13,p.y+passo))};}
 return q;
}
// Corrige ligações antigas: o lado de chegada passa a ser o oposto do lado de saída (mantém a altura/posição).
export function corrigirLados(ligs=[]){
 const out=[];let n=0;
 for(const l of ligs){
  const la=ladoDoPonto(l?.a),lb=ladoDoPonto(l?.b);
  if(la&&lb&&OPOSTO[la]!==lb){
   const ocup=out.concat(ligs).filter(x=>x!==l).flatMap(x=>[x.a,x.b].filter(e=>String(e?.mapa)===String(l.b.mapa)));
   const q=afastarNaBorda(pontoOposto(l.a,la),ocup);out.push({...l,b:{...l.b,x:+q.x.toFixed(3),y:+q.y.toFixed(3)}});n++;
  }else out.push(l);
 }
 return {ligs:out,n};
}
// Ordem de acesso: começa num mapa e percorre as ligações (em largura); os soltos vão no fim.
export function ordemPorAcesso(mapas=[],ligacoes=[],inicio=''){
 const ids=mapas.map(m=>String(m.id)),viz=new Map(ids.map(i=>[i,[]]));
 for(const l of ligacoes){const a=String(l?.a?.mapa||''),b=String(l?.b?.mapa||'');if(viz.has(a)&&viz.has(b)){viz.get(a).push(b);viz.get(b).push(a);}}
 const nome=id=>String(mapas.find(m=>String(m.id)===id)?.nome||id);
 const ord=[],vis=new Set();
 const raizes=[...(inicio&&viz.has(inicio)?[inicio]:[]),...ids.filter(i=>viz.get(i).length).sort((a,b)=>viz.get(b).length-viz.get(a).length)];
 for(const r of raizes){if(vis.has(r))continue;const fila=[r];vis.add(r);
  while(fila.length){const x=fila.shift();ord.push(x);for(const y of [...viz.get(x)].sort((a,b)=>nome(a).localeCompare(nome(b),'pt')))if(!vis.has(y)){vis.add(y);fila.push(y);}}}
 for(const i of [...ids].sort((a,b)=>nome(a).localeCompare(nome(b),'pt')))if(!vis.has(i))ord.push(i);
 return ord.map(i=>mapas.find(m=>String(m.id)===i));
}
// Ponto livre perto de (x,y) (normalizado), longe dos objetos que bloqueiam.
export function livrePerto(objetos=[],x,y,W=28,H=14,raio=.6){
 const bloq=objetos.filter(o=>o?.bloqueiaMovimento&&!o.destruido&&!(Number(o?.andarV144??o?.oficinaElement?.andarV144??1)>1)); // v166: o andar de cima não barra quem chega no térreo
 const livre=(px,py)=>px>raio*28/W&&py>raio*14/H&&px<28-raio*28/W&&py<14-raio*14/H&&!bloq.some(o=>{const hw=(Number(o.larguraM)||1)/2+raio,hh=(Number(o.alturaM)||1)/2+raio;const dx=Math.abs((px-Number(o.x))*W/28),dy=Math.abs((py-Number(o.y))*H/14);return dx<hw&&dy<hh;});
 if(livre(x,y))return {x,y};
 for(let r=.5;r<8;r+=.5)for(let a=0;a<16;a++){const px=x+Math.cos(a/16*Math.PI*2)*r*28/W,py=y+Math.sin(a/16*Math.PI*2)*r*14/H;if(livre(px,py))return {x:px,y:py};}
 return {x:Math.max(1,Math.min(27,x)),y:Math.max(1,Math.min(13,y))};
}
// Um passo para dentro do mapa, a partir da saída.
export function paraDentro(p){return {x:p.x<2?p.x+1.6:p.x>26?p.x-1.6:p.x,y:p.y<2?p.y+1.6:p.y>12?p.y-1.6:p.y};}

const ESTILO=`
#mlCamada{position:absolute;inset:0;pointer-events:none;z-index:12}
#mlCamada .ml-saida{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:3px;height:24px;padding:0 7px;border-radius:999px;background:rgba(8,30,22,.85);border:1.5px solid #57e3a1;color:#d8ffe9;font:600 11px 'Segoe UI',Arial,sans-serif;pointer-events:auto;cursor:pointer;white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis}
#mlCamada .ml-saida.ml-curta{padding:0 4px;opacity:.75;font-size:13px}
#mlCamada .ml-saida:hover{background:rgba(12,52,36,.95)}
#mlCamada .ml-saida.ml-arrasta{cursor:grabbing;opacity:.8}
#mlGeral,#mlInter{position:absolute;top:8px;z-index:31;height:28px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:12px 'Segoe UI',Arial,sans-serif;cursor:pointer;padding:0 10px}
#mlGeral{left:268px}
#mlInter{left:50%;transform:translateX(-50%);top:44px;height:auto;max-width:70%;padding:5px 12px;border-color:#ffd447;color:#ffe9a8;cursor:default;text-align:center}
#mlInter button{margin-left:8px;background:none;border:0;color:#ffd447;cursor:pointer}
#mlBalao{position:absolute;z-index:9001;width:min(280px,calc(100vw - 24px));padding:10px 12px;border-radius:12px;background:rgba(9,15,29,.97);border:1px solid #57e3a1;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.55)}
#mlBalao[hidden]{display:none}
#mlBalao h4{margin:0 0 6px;display:flex;gap:6px;align-items:center;color:#57e3a1;font-size:14px}
#mlBalao h4 span{flex:1}
#mlBalao h4 button{width:24px;height:24px;border-radius:7px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;padding:0}
#mlBalao .ml-b{display:block;width:100%;margin:4px 0;min-height:32px;padding:4px 10px;border-radius:9px;border:1px solid #2f4664;background:rgba(255,255,255,.05);color:#e8eefc;cursor:pointer;font:inherit;text-align:left}
#mlBalao .ml-b:hover:not(:disabled){border-color:#57e3a1}
#mlBalao .ml-b:disabled{opacity:.45;cursor:not-allowed}
#mlBalao .ml-aviso{color:#ffcf8a;font-size:12px;margin:4px 0}
#mlBalao .ml-res{color:#d9f6ff;font-size:12px;margin-top:4px}
#mlSetas{position:absolute;right:8px;bottom:42px;z-index:31;display:grid;grid-template-columns:repeat(3,26px);grid-template-rows:repeat(3,26px);gap:2px;padding:3px;border-radius:12px;background:rgba(9,15,29,.82);border:1px solid #3b5878}
#mlSetas .ml-seta{position:relative;width:26px;height:26px;padding:0;border-radius:7px;border:1px solid #2f4664;background:#16233a;color:#d8ffe9;font:700 14px 'Segoe UI',Arial,sans-serif;cursor:pointer}
#mlSetas .ml-seta:disabled{opacity:.25;cursor:default}
#mlSetas .ml-seta:hover:not(:disabled){border-color:#57e3a1;color:#57e3a1}
#mlSetas .ml-seta small{position:absolute;right:1px;bottom:0;font-size:8px;color:#ffd447}
#mlSetas .ms-n{grid-area:1/2}#mlSetas .ms-o{grid-area:2/1}#mlSetas .ms-c{grid-area:2/2;font-size:12px}#mlSetas .ms-l{grid-area:2/3}#mlSetas .ms-s{grid-area:3/2}
#mlSetas .ml-setamenu{position:absolute;right:0;bottom:calc(100% + 4px);display:flex;flex-direction:column;gap:3px;min-width:160px;padding:5px;border-radius:9px;background:rgba(9,15,29,.97);border:1px solid #57e3a1}
#mlSetas .ml-setamenu button{text-align:left;padding:4px 8px;border-radius:7px;border:1px solid #2f4664;background:#16233a;color:#e8eefc;font:12px 'Segoe UI',Arial,sans-serif;cursor:pointer}
#mlModal{position:fixed;inset:0;z-index:9995;background:rgba(3,6,14,.78);display:grid;place-items:center}
#mlModal[hidden]{display:none}
#mlModal .ml-caixa{width:min(1180px,96vw);height:min(760px,92vh);display:flex;flex-direction:column;border-radius:16px;background:#0d1526;border:1px solid #2f4664;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;overflow:hidden}
#mlModal header{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid #22385a}
#mlModal header h3{margin:0;flex:1;color:#8ee7ff;font-size:16px;min-width:200px}
#mlModal header select{width:auto!important;max-width:220px;margin:0!important;padding:0 8px!important;height:30px!important}
#mlModal header button,#mlModal header select{height:30px;border-radius:9px;border:1px solid #3b5878;background:#16233a;color:#e8eefc;font:12px 'Segoe UI',Arial,sans-serif;padding:0 10px;cursor:pointer}
#mlModal .ml-svg{flex:1;overflow:auto;background:radial-gradient(circle at 50% 40%,#13213a,#070c18)}
#mlModal svg{display:block}
#mlModal .ml-no{cursor:pointer}
#mlModal .ml-no:hover rect{stroke:#fff}
#mlModal footer{padding:8px 14px;border-top:1px solid #22385a;color:#9fb3cc;font-size:12px;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
#mlModal .ml-log{max-height:90px;overflow:auto;color:#c6d3e6;font-size:12px;padding:0 14px 8px}
`;

export function instalarLigacoes(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const el=id=>root.getElementById(id);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const mapas=()=>{try{return (dep.mapas?.()||[]).filter(m=>m?.id&&!String(m.id).includes('__parte__'));}catch(_){return [];}};
 const cenarios=()=>{try{return dep.cenarios?.()||[];}catch(_){return [];}};
 if(!el('mlCssV126')){const st=root.createElement('style');st.id='mlCssV126';st.textContent=ESTILO;root.head.append(st);}
 let corrigindo=false,ligs=[],mapa=null,cena=null,parar=[],assinado=null,chave='',balao=null,saidaAberta='',resultado='',modal=null,arrasto=null,ocultarAviso='';
 const processados=new Set();
 const board=()=>el('novaSyncBoard');
 const mapaAtual=()=>{try{const v=ctl()?.mapaAtual?.();if(v)return String(v);}catch(_){}return String(mapa?.mapId||'');}; // v143: o mapa que esta tela mostra
 const nomeMapa=id=>String(mapas().find(m=>String(m.id)===String(id))?.nome||id||'?');
 const dims=()=>({W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14});
 const limpaNome=n=>String(n||'').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 function ator(){const c=ctl();try{const t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 // saídas do mapa aberto: {lig, aqui:{x,y}, la:{mapa,x,y}}
 function saidasAqui(){const m=mapaAtual();if(!m)return [];const out=[];for(const l of ligs){if(String(l.a?.mapa)===m)out.push({lig:l,lado:'a',aqui:l.a,la:l.b});else if(String(l.b?.mapa)===m)out.push({lig:l,lado:'b',aqui:l.b,la:l.a});}return out;}
 // a ordem do seletor de mapas da barra segue os acessos
 win.mesaOrdemMapas=lista=>{try{if(!ligs.length)return null;const ini=String((mapas().find(m=>m.espacoportoV138||String(m.id)==='v138_espacoporto')||mapas().find(m=>/portao|portão/i.test(m.nome||'')))?.id||'');return ordemPorAcesso(lista,ligs,ini);}catch(_){return null;}};

 // ------------------------------------------------------------ desenho
 function desenhar(){
  const b=board();if(!b)return;
  let cam=el('mlCamada');if(!cam||cam.parentElement!==b){cam?.remove();cam=root.createElement('div');cam.id='mlCamada';b.append(cam);chave='';
   cam.addEventListener('pointerdown',aoApertarSaida);}
  // v143: a legenda com o nome do próximo mapa só aparece para quem chega perto da porta (ou ao clicar nela).
  const ag=ator(),{W:dW,H:dH}=dims(),pertoDe=p=>!!ag&&Math.hypot((ag.x-Number(p.x))*dW/28,(ag.y-Number(p.y))*dH/14)<=LEGENDA_PERTO;
  const s=saidasAqui(),k=JSON.stringify([s.map(x=>[x.lig.id,x.aqui.x,x.aqui.y,x.la.mapa,pertoDe(x.aqui)||saidaAberta===x.lig.id]),mapas().length]);
  if(k!==chave){chave=k;cam.innerHTML=s.map(x=>{const mostra=pertoDe(x.aqui)||saidaAberta===x.lig.id;return `<button type="button" class="ml-saida${mostra?'':' ml-curta'}" data-lig="${esc(x.lig.id)}" style="left:${Number(x.aqui.x)/28*100}%;top:${Number(x.aqui.y)/14*100}%;transform:translate(${x.aqui.x<3?'0':x.aqui.x>25?'-100%':'-50%'},${x.aqui.y<1.5?'0':x.aqui.y>12.5?'-100%':'-50%'})" title="${mostra?'Saída para '+esc(nomeMapa(x.la.mapa))+(x.lig.tipo==='intermediario'?' (trajeto)':''):'Saída — clique ou chegue perto para ver'}">${mostra?'🚪➜ '+esc(nomeMapa(x.la.mapa)):'🚪'}</button>`;}).join('');}
  // botões e aviso do mestre
  const sc=b.parentElement,m=ehMestre();let g=el('mlGeral');
  if(m){if(getComputedStyle(sc).position==='static')sc.style.position='relative';
   if(!g){g=root.createElement('button');g.type='button';g.id='mlGeral';g.textContent='🕸️ Mapa geral';g.title='Esquema de ligação entre os mapas (portas, ruas, trajetos)';g.addEventListener('pointerdown',e=>e.stopPropagation());g.addEventListener('click',abrirGeral);sc.append(g);}}
  else g?.remove();
  desenharSetas(sc,m,s);
  const inter=mapas().find(x=>String(x.id)===mapaAtual())?.intermediario;let av=el('mlInter');
  if(m&&inter&&ocultarAviso!==mapaAtual()){if(!av){av=root.createElement('div');av.id='mlInter';av.addEventListener('pointerdown',e=>e.stopPropagation());av.addEventListener('click',e=>{if(e.target.closest('button')){ocultarAviso=mapaAtual();av.remove();}});sc.append(av);}
   const t=`🧭 ${esc(inter.texto||('Este mapa representa o espaço entre '+nomeMapa(inter.a)+' e '+nomeMapa(inter.b)+'.'))} <small>(só o mestre vê)</small><button type="button" title="Esconder">✕</button>`;if(av.dataset.t!==t){av.innerHTML=t;av.dataset.t=t;}}
  else av?.remove();
  if(saidaAberta)desenharBalao();
 }

 // v143: mudador de mapa do mestre — uma seta para cada lado por onde o mapa abre (↑ mostra o mapa de cima, → o da direita…).
 const SETA={norte:['↑','de cima'],sul:['↓','de baixo'],leste:['→','da direita'],oeste:['←','da esquerda'],dentro:['⊙','por portas internas']};
 function desenharSetas(sc,m,s){
  let box=el('mlSetas');if(!m){box?.remove();return;}
  if(!box){box=root.createElement('div');box.id='mlSetas';box.addEventListener('pointerdown',e=>e.stopPropagation());box.addEventListener('click',aoClicarSeta);sc.append(box);}
  const por={norte:[],sul:[],leste:[],oeste:[],dentro:[]};
  for(const x of s){const l=ladoDoPonto(x.aqui)||'dentro',d=String(x.la.mapa);if(!por[l].includes(d))por[l].push(d);}
  const bt=(lado,cls)=>{const ds=por[lado],[ic,txt]=SETA[lado];return `<button type="button" class="ml-seta ${cls}" data-lado="${lado}" ${ds.length?'':'disabled'} title="${ds.length?'Abrir o mapa '+txt+': '+esc(ds.map(nomeMapa).join(' · ')):'Nada '+txt}">${ic}${ds.length>1?'<small>'+ds.length+'</small>':''}</button>`;};
  const h=bt('norte','ms-n')+bt('oeste','ms-o')+bt('dentro','ms-c')+bt('leste','ms-l')+bt('sul','ms-s')+(setaMenu?`<div class="ml-setamenu">${por[setaMenu].map(d=>`<button type="button" data-ir-mapa="${esc(d)}">${esc(nomeMapa(d))}</button>`).join('')}</div>`:'');
  if(box.dataset.h!==h){box.innerHTML=h;box.dataset.h=h;}
  box._por=por;
 }
 let setaMenu='';
 function aoClicarSeta(e){
  const b=e.target.closest('button');if(!b)return;const box=el('mlSetas');
  if(b.dataset.irMapa){setaMenu='';abrirMapa(b.dataset.irMapa);return;}
  const ds=box?._por?.[b.dataset.lado]||[];if(!ds.length)return;
  if(ds.length===1){setaMenu='';abrirMapa(ds[0]);}else setaMenu=setaMenu===b.dataset.lado?'':b.dataset.lado;
  if(box)box.dataset.h='';desenhar();
 }

 // ------------------------------------------------------------ balão da saída
 function aoApertarSaida(e){
  const bt=e.target.closest('.ml-saida');if(!bt)return;e.stopPropagation();
  if(ehMestre()&&e.button===0){ // o mestre pode arrastar a saída
   const b=board(),r=b.getBoundingClientRect();arrasto={id:bt.dataset.lig,bt,x0:e.clientX,y0:e.clientY,moveu:false,r};
   const mover=ev=>{if(!arrasto)return;if(Math.hypot(ev.clientX-arrasto.x0,ev.clientY-arrasto.y0)>5)arrasto.moveu=true;if(arrasto.moveu){bt.classList.add('ml-arrasta');bt.style.left=((ev.clientX-r.left)/r.width*100)+'%';bt.style.top=((ev.clientY-r.top)/r.height*100)+'%';}};
   const soltar=async ev=>{root.removeEventListener('pointermove',mover,true);root.removeEventListener('pointerup',soltar,true);const a=arrasto;arrasto=null;bt.classList.remove('ml-arrasta');
    if(a?.moveu){const x=Math.max(.3,Math.min(27.7,(ev.clientX-r.left)/r.width*28)),y=Math.max(.3,Math.min(13.7,(ev.clientY-r.top)/r.height*14));await moverSaida(a.id,x,y);}else abrirSaida(bt.dataset.lig);};
   root.addEventListener('pointermove',mover,true);root.addEventListener('pointerup',soltar,true);return;
  }
  abrirSaida(bt.dataset.lig);
 }
 function abrirSaida(id){saidaAberta=String(id);resultado='';chave='';if(!balao){balao=root.createElement('div');balao.id='mlBalao';balao.hidden=true;root.body.append(balao);balao.addEventListener('pointerdown',e=>e.stopPropagation());balao.addEventListener('click',aoClicar);}
  balao.hidden=false;balao.dataset.h='';desenharBalao();
  const bt=el('mlCamada')?.querySelector(`[data-lig="${CSS.escape(saidaAberta)}"]`);if(bt){const r=bt.getBoundingClientRect(),w=balao.offsetWidth||280,h=balao.offsetHeight||160;let x=r.right+8,y=r.top-10;if(x+w>win.innerWidth-8)x=r.left-w-8;if(x<8)x=8;y=Math.max(8,Math.min(win.innerHeight-h-8,y));balao.style.left=Math.round(x+win.scrollX)+'px';balao.style.top=Math.round(y+win.scrollY)+'px';}}
 function fecharBalao(){saidaAberta='';chave='';if(balao)balao.hidden=true;}
 function desenharBalao(){
  if(!balao||balao.hidden)return;const s=saidasAqui().find(x=>x.lig.id===saidaAberta);if(!s){fecharBalao();return;}
  const a=ator(),m=ehMestre(),{W,H}=dims(),dist=a?Math.max(0,Math.hypot((a.x-s.aqui.x)*W/28,(a.y-s.aqui.y)*H/14)-(Number(a.diametroM)||1)/2):null,perto=!!a&&dist<=ALCANCE_SAIDA;
  let h=`<h4>🚪➜ <span>${esc(nomeMapa(s.la.mapa))}</span><button type="button" data-fechar title="Fechar">✕</button></h4>`;
  if(a)h+=`<button type="button" class="ml-b" data-ir ${perto?'':'disabled'}>🚶 ${esc(limpaNome(a.nome))} segue para ${esc(nomeMapa(s.la.mapa))}</button>${perto?'':`<div class="ml-aviso">Chegue mais perto da saída: ${dist.toFixed(1).replace('.',',')} m (até ${ALCANCE_SAIDA} m).</div>`}`;
  else if(!m)h+='<div class="ml-aviso">Selecione o seu personagem.</div>';
  if(m)h+=`<button type="button" class="ml-b" data-grupo>👥 Levar o grupo todo para lá</button><button type="button" class="ml-b" data-abrir-destino>👁️ Abrir ${esc(nomeMapa(s.la.mapa))} (sem mover ninguém)</button><button type="button" class="ml-b" data-remover>🗑️ Remover esta ligação</button><div class="ml-aviso" style="color:#9fb3cc">Arraste o 🚪➜ para mudar o lugar da saída.</div>`;
  h+=`<div class="ml-res">${esc(resultado)}</div>`;
  if(balao.dataset.h!==h){balao.innerHTML=h;balao.dataset.h=h;}
 }
 async function aoClicar(ev){
  const b=ev.target.closest('button');if(!b)return;if(b.dataset.fechar!==undefined){fecharBalao();return;}
  const s=saidasAqui().find(x=>x.lig.id===saidaAberta);if(!s)return;const a=ator();
  try{
   if(b.dataset.ir!==undefined){b.disabled=true;
    if(ehMestre())resultado=await viajar({ligacao:s.lig.id,de:mapaAtual(),personagemId:String(a.id),nome:limpaNome(a.nome)});
    else{await dep.setDoc(D(PEDIDOS+'/'+uidNovo('ir')),clean({donoUid:uid(),personagemId:String(a.id),nome:limpaNome(a.nome),ligacao:s.lig.id,de:mapaAtual(),criadoEm:Date.now()}));resultado='⏳ Seguindo… a mesa leva você em instantes.';}}
   else if(b.dataset.grupo!==undefined){b.disabled=true;resultado=await levarGrupo(s);}
   else if(b.dataset.abrirDestino!==undefined){abrirMapa(s.la.mapa);fecharBalao();return;}
   else if(b.dataset.remover!==undefined){await salvarLigs(ligs.filter(l=>l.id!==s.lig.id));fecharBalao();return;}
  }catch(e){resultado='⚠️ '+(e?.message||e);}
  balao.dataset.h='';desenharBalao();
 }

 // ------------------------------------------------------------ viagem (navegador do mestre)
 function abrirMapa(id){
  if(!id)return;const s=el('novaSyncMapa');
  if(s&&[...s.options].some(o=>o.value===id)){s.value=id;s.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(typeof win.abrirMapaBancoNaMesa_==='function')win.abrirMapaBancoNaMesa_(id);
  else ctl()?.openMap?.(id);
 }
 async function objetosDoMapa(id){
  if(String(cena?.mapId||'')===String(id))return cena?.objects||[];
  try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)));return s.exists()?(s.data()?.objects||[]):[];}catch(_){return [];}
 }
 const ehPJ=t=>!!t&&(!!t.donoUid||!decodeURIComponent(String(t.id||'')).startsWith('sync'));
 // v138: personagens do mestre (PMs, ex.: Dra. Ilya) não são "do grupo": não viajam junto ao levar o grupo
 // (só o personagem de teste do mestre, que faz papel de jogador).
 const ehDoGrupo=t=>{const id=decodeURIComponent(String(t?.id||''));if(id===String(win.mesaTesteJogadorId||'teste_jogador_v138'))return true;const d=String(t?.donoUid||'');return !!d&&!(ehMestre()&&d===uid());}; // v139: só personagens de jogadores (e o de teste)
 async function chegada(l,lado,indice=0){
  const la=lado==='a'?l.b:l.a,obj=await objetosDoMapa(la.mapa),m=mapas().find(x=>String(x.id)===String(la.mapa)),W=Number(m?.larguraM)||28,H=Number(m?.alturaM)||14;
  const base=paraDentro(la),desl=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1]][indice%8];
  return livrePerto(obj,base.x+desl[0]*28/W,base.y+desl[1]*14/H,W,H);
 }
 async function moverToken(id,para,p,nome,lig){
  await dep.runTransaction(dep.db,async tx=>{
   const r=D(POS+'/'+id),s=await tx.get(r);if(!s.exists())throw Error('Personagem não está no mapa.');const v=s.data();
   const hs=await tx.get(D(HIST)),hh=hs.exists()?hs.data():{entries:[],revision:0};
   tx.set(r,{...v,mapaId:String(para),x:Number(p.x.toFixed(3)),y:Number(p.y.toFixed(3)),revision:Number(v.revision||0)+1});
   tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'lig:'+uidNovo('h'),ts:Date.now(),actorUid:String(v.donoUid||''),targetUid:'',message:`🚪➜ ${nome} seguiu para ${nomeMapa(para)}`}].slice(-120),revision:Number(hh.revision||0)+1}));
  });
  // v142: a ficha do personagem acompanha a viagem (a tela do jogador segue a ficha)
  const pid=decodeURIComponent(String(id));if(!pid.startsWith('sync'))try{await dep.setDoc(D('personagens/'+pid),{localizacaoMapaId:String(para),localizacaoMapaDefinidaV92:true,...(win.__mesaLocalDoMapaV154_?{localizacaoCenarioId:String(win.__mesaLocalDoMapaV154_(para))}:{})},{merge:true});}catch(e){console.warn('[Ligações] ficha',e);}
 }
 async function viajar(cmd){
  const l=ligs.find(x=>x.id===cmd.ligacao);if(!l)throw Error('Ligação não encontrada.');
  const lado=String(l.a?.mapa)===String(cmd.de)?'a':String(l.b?.mapa)===String(cmd.de)?'b':'';if(!lado)throw Error('Esta saída não é deste mapa.');
  const t=ctl()?.token?.(String(cmd.personagemId));if(!t)throw Error('Personagem não está no mapa.');
  const aqui=lado==='a'?l.a:l.b,para=lado==='a'?l.b.mapa:l.a.mapa,{W,H}=dims();
  if(Math.hypot((t.x-aqui.x)*W/28,(t.y-aqui.y)*H/14)-(Number(t.diametroM)||1)/2>ALCANCE_SAIDA+.6)throw Error('Longe da saída.');
  const p=await chegada(l,lado,Math.floor(Math.random()*8));
  await moverToken(t.id,para,p,limpaNome(cmd.nome||t.nome),l);
  // o último personagem saiu? abre o mapa novo para todos
  setTimeout(()=>{try{const ainda=(ctl()?.tokensNoMapa?.()||[]).filter(x=>ehDoGrupo(x)&&String(x.mapaId||mapaAtual())===mapaAtual()&&String(x.id)!==String(t.id));
   if(!ainda.length&&mapaAtual()===String(cmd.de)){abrirMapa(para);aviso(`Todos saíram: abrindo ${nomeMapa(para)}.`);}}catch(e){console.warn('[Ligações]',e);}},1200);
  return `🚶 ${limpaNome(cmd.nome||t.nome)} seguiu para ${nomeMapa(para)}.`;
 }
 async function levarGrupo(s){
  const lista=(ctl()?.tokensNoMapa?.()||[]).filter(ehDoGrupo);let i=0;
  for(const t of lista){const p=await chegada(s.lig,s.lado,i++);await moverToken(t.id,s.la.mapa,p,limpaNome(t.nome),s.lig);}
  abrirMapa(s.la.mapa);fecharBalao();return `👥 ${lista.length} personagem(ns) levados para ${nomeMapa(s.la.mapa)}.`;
 }
 function aviso(txt){const d=root.createElement('div');d.textContent='🚪 '+txt;d.style.cssText='position:fixed;left:50%;top:76px;transform:translateX(-50%);z-index:9999;background:#0d2a1e;border:1px solid #57e3a1;color:#d8ffe9;padding:8px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;box-shadow:0 8px 24px #0008';root.body.append(d);setTimeout(()=>d.remove(),4500);}
 async function processar(id,cmd){
  if(processados.has(id))return;processados.add(id);
  try{const t=ctl()?.token?.(String(cmd.personagemId||''));if(!t)throw Error('Personagem não está no mapa.');
   if(String(t.donoUid||'')!==String(cmd.donoUid||''))throw Error('Pedido de quem não controla o personagem.');
   await viajar(cmd);}catch(e){console.warn('[Ligações] pedido recusado',e?.message||e);}
  finally{try{await dep.deleteDoc?.(D(PEDIDOS+'/'+id));}catch(_){}}
 }
 async function salvarLigs(novas){ligs=novas;chave='';await dep.setDoc(D(LIGACOES),clean({ligacoes:novas,atualizadoEm:Date.now(),ladosV138:true}));desenhar();desenharGeral();}
 async function moverSaida(id,x,y){const m=mapaAtual();await salvarLigs(ligs.map(l=>l.id!==id?l:String(l.a.mapa)===m?{...l,a:{...l.a,x,y}}:{...l,b:{...l.b,x,y}}));}
 // nova ligação entre dois mapas, nas bordas livres de cada um
 function novaLigacao(ma,mb,extra={}){
  const usados=m=>ligs.filter(l=>String(l.a.mapa)===m||String(l.b.mapa)===m).length;
  const pa=pontoDeBorda(usados(ma),extra.ladoA),ocB=ligs.flatMap(l=>[l.a,l.b].filter(e=>String(e?.mapa)===String(mb)));
  const pb=afastarNaBorda(extra.ladoB&&extra.ladoB!==OPOSTO[pa.lado]?pontoDeBorda(usados(mb),extra.ladoB):pontoOposto(pa,pa.lado),ocB); // v138: entra pelo lado oposto
  return {id:uidNovo('lig'),a:{mapa:ma,x:pa.x,y:pa.y},b:{mapa:mb,x:pb.x,y:pb.y},tipo:extra.tipo||'porta',auto:!!extra.auto};
 }

 // ------------------------------------------------------------ mapa geral
 function abrirGeral(){
  if(!modal){modal=root.createElement('div');modal.id='mlModal';modal.hidden=true;root.body.append(modal);
   modal.addEventListener('click',aoClicarGeral);modal.addEventListener('pointerdown',e=>{if(e.target===modal)modal.hidden=true;});}
  modal.hidden=false;modal.dataset.h='';desenharGeral();
 }
 let logGeral=[];
 const linhas=t=>{if(t.length<=28)return [t];const p=t.split(' ');let a='',b='';for(const w of p){if((a+' '+w).trim().length<=28&&!b)a=(a+' '+w).trim();else b=(b+' '+w).trim();}return [a,b.length>28?b.slice(0,27)+'…':b];};
 function desenharGeral(){
  if(!modal||modal.hidden)return;
  const ms=mapas(),ini=String((ms.find(m=>m.espacoportoV138||String(m.id)==='v138_espacoporto')||ms.find(m=>/portao|portão/i.test(m.nome||'')))?.id||'');
  const ord=ordemPorAcesso(ms,ligs,ini),viz=new Map(ms.map(m=>[String(m.id),new Set()]));
  for(const l of ligs){viz.get(String(l.a.mapa))?.add(String(l.b.mapa));viz.get(String(l.b.mapa))?.add(String(l.a.mapa));}
  // camadas por distância a partir da raiz de cada grupo
  const nivel=new Map();for(const m of ord){const id=String(m.id);if(nivel.has(id))continue;nivel.set(id,0);const fila=[id];while(fila.length){const x=fila.shift();for(const y of viz.get(x)||[])if(!nivel.has(y)){nivel.set(y,nivel.get(x)+1);fila.push(y);}}}
  const col=new Map();for(const m of ord){const n=nivel.get(String(m.id))||0;if(!col.has(n))col.set(n,[]);col.get(n).push(m);}
  const NW=196,NH=54,GX=70,GY=18,cols=[...col.keys()].sort((a,b)=>a-b);
  const maxL=Math.max(1,...[...col.values()].map(v=>v.length)),Wsvg=Math.max(900,cols.length*(NW+GX)+60),Hsvg=Math.max(560,maxL*(NH+GY)+60);
  const pos=new Map();for(const c of cols){const lista=col.get(c);lista.forEach((m,i)=>pos.set(String(m.id),{x:40+c*(NW+GX),y:30+i*(NH+GY)+(maxL-lista.length)*(NH+GY)/2}));}
  const cor=m=>m.intermediario?'#6a5a2a':/cidade|rua|vespera|véspera|mercado|praca|praça|bar|bateria|clinica|clínica|palacio|palácio|tribunal|arquivo|terraco|terraço|porto|residencia|residência|galeria|patio|pátio|ringue|feira|pavilh/i.test(m.nome||'')?'#24456e':'#2f5a2a';
  let arestas='';for(const l of ligs){const a=pos.get(String(l.a.mapa)),b=pos.get(String(l.b.mapa));if(!a||!b)continue;arestas+=`<line x1="${a.x+NW/2}" y1="${a.y+NH/2}" x2="${b.x+NW/2}" y2="${b.y+NH/2}" stroke="${l.tipo==='intermediario'?'#ffd447':'#57e3a1'}" stroke-width="2" stroke-opacity=".75" ${l.tipo==='intermediario'?'stroke-dasharray="6 4"':''}/>`;}
  let nos='';for(const m of ord){const p=pos.get(String(m.id)),atual=String(m.id)===mapaAtual(),n=(viz.get(String(m.id))||new Set()).size;
   nos+=`<g class="ml-no" data-mapa="${esc(m.id)}"><rect x="${p.x}" y="${p.y}" width="${NW}" height="${NH}" rx="10" fill="${cor(m)}" stroke="${atual?'#ffd447':n?'#8ee7ff':'#ff8a8a'}" stroke-width="${atual?3:1.5}" ${m.intermediario?'stroke-dasharray="5 3"':''}/>${linhas(String(m.nome||m.id)).map((t,k,a)=>`<text x="${p.x+NW/2}" y="${p.y+(a.length>1?15+k*13:20)}" text-anchor="middle" fill="#fff" font-size="11.5" font-weight="600">${esc(t)}</text>`).join('')}<text x="${p.x+NW/2}" y="${p.y+46}" text-anchor="middle" fill="#c6d3e6" font-size="10">${m.intermediario?'trajeto · ':''}${n} ligaç${n===1?'ão':'ões'}${atual?' · aberto':''}</text></g>`;}
  const opc=ms.map(m=>`<option value="${esc(m.id)}">${esc(m.nome||m.id)}</option>`).join('');
  const h=`<div class="ml-caixa"><header><h3>🕸️ Mapa geral · ligações entre mapas</h3>
   <button type="button" data-montar title="Cria as ligações a partir dos destinos de cada cenário e os mapas intermediários (rua, estrada, trilha) entre regiões diferentes">⚙️ Montar pelos cenários</button>
   <select data-a title="Mapa de origem">${opc}</select><select data-b title="Mapa de destino">${opc}</select>
   <button type="button" data-ligar title="Liga os dois mapas por uma saída em cada um">🔗 Ligar</button>
   <button type="button" data-inter title="Cria um mapa de rua/estrada entre os dois e liga tudo">🧩 Intermediário</button>
   <button type="button" data-rechear title="Põe armários/baús com itens e bilhetes (escritos a partir de cada cenário) e algo solto no chão, em cada mapa de cenário ainda não recheado">🎁 Rechear mapas</button>
   <button type="button" data-x title="Fechar">✕</button></header>
   <div class="ml-svg"><svg width="${Wsvg}" height="${Hsvg}" viewBox="0 0 ${Wsvg} ${Hsvg}">${arestas}${nos}</svg></div>
   <div class="ml-log">${logGeral.map(esc).join('<br>')}</div>
   <footer><span>🟦 cidade/interior</span><span>🟩 fora da cidade</span><span>🟨 tracejado = mapa intermediário (trajeto)</span><span>borda vermelha = sem ligação</span><span>Clique num mapa para abri-lo · ${ligs.length} ligações · ${ms.length} mapas</span></footer></div>`;
  if(modal.dataset.h===h)return;const a=modal.querySelector('[data-a]')?.value,b=modal.querySelector('[data-b]')?.value;modal.innerHTML=h;modal.dataset.h=h;if(a)modal.querySelector('[data-a]').value=a;if(b)modal.querySelector('[data-b]').value=b;
 }
 async function aoClicarGeral(e){
  const no=e.target.closest('.ml-no');if(no){abrirMapa(no.dataset.mapa);modal.hidden=true;return;}
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.x!==undefined){modal.hidden=true;return;}
  const a=modal.querySelector('[data-a]')?.value,bb=modal.querySelector('[data-b]')?.value;
  try{
   b.disabled=true;
   if(b.dataset.ligar!==undefined){if(!a||!bb||a===bb)throw Error('Escolha dois mapas diferentes.');await salvarLigs([...ligs,novaLigacao(a,bb)]);logGeral.unshift(`🔗 ${nomeMapa(a)} ↔ ${nomeMapa(bb)}`);}
   else if(b.dataset.inter!==undefined){if(!a||!bb||a===bb)throw Error('Escolha dois mapas diferentes.');const ca=cenarios().find(c=>String(c.mapaId)===a),cb=cenarios().find(c=>String(c.mapaId)===bb);
    const novas=await criarIntermediario(a,bb,tipoIntermediario(ca||{local:nomeMapa(a)},cb||{local:nomeMapa(bb)})||'cidade',[...ligs]);await salvarLigs(novas);}
   else if(b.dataset.montar!==undefined)await montarPelosCenarios();
   else if(b.dataset.rechear!==undefined){if(!win.mesaRecheio)throw Error('Recheio ainda carregando.');await win.mesaRecheio.rechear(t=>{logGeral.unshift(t);modal.dataset.h='';desenharGeral();});}
  }catch(err){logGeral.unshift('⚠️ '+(err?.message||err));}
  b.disabled=false;modal.dataset.h='';desenharGeral();
 }
 // cria o mapa de trajeto entre A e B (rua, estrada ou trilha) e liga A ↔ trajeto ↔ B
 async function criarIntermediario(a,b,tipo,lista){
  const ma=win.mesaMapasV110_;if(!ma?.salvar)throw Error('O gerador de mapas ainda não carregou.');
  const na=nomeMapa(a),nb=nomeMapa(b),nome=`Entre ${na} e ${nb}`.slice(0,80),texto=`Este mapa representa o espaço entre ${na} e ${nb}.`;
  const existente=mapas().find(m=>m.intermediario&&((m.intermediario.a===a&&m.intermediario.b===b)||(m.intermediario.a===b&&m.intermediario.b===a)));
  let id=existente?.id;
  if(!id){
   const estado=gerarMapa({tipo,largura:56,altura:28,objetos:ma.objetos?.()||[],nome,estilo:tipo==='cidade'?(sugerirEstilo(na+' '+nb)||'futurista'):''});
   const r=await ma.salvar({nome,state:estado,cenaDe:mid=>{const c=cenaDoEstado(estado,mid);return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});id=r.id;
   await dep.setDoc(D('mapas/'+id),{intermediario:{a,b,texto,tipo}},{merge:true});
   const m=mapas().find(x=>String(x.id)===String(id));if(m)m.intermediario={a,b,texto,tipo};else (dep.mapas?.()||[]).push({id,nome,larguraM:36,alturaM:18,intermediario:{a,b,texto,tipo}});
   logGeral.unshift(`🧩 ${nome}: mapa de ${tipo==='cidade'?'rua':tipo==='floresta'?'trilha':'estrada'} criado.`);
  }
  // tira a ligação direta A↔B (se houver) e liga pelas pontas do trajeto
  ligs=lista.filter(l=>!((l.a.mapa===a&&l.b.mapa===b)||(l.a.mapa===b&&l.b.mapa===a)));
  if(!ligs.some(l=>(l.a.mapa===a&&l.b.mapa===id)||(l.a.mapa===id&&l.b.mapa===a)))ligs.push({...novaLigacao(a,id,{ladoA:'leste',ladoB:'oeste',tipo:'intermediario',auto:true})});
  if(!ligs.some(l=>(l.a.mapa===id&&l.b.mapa===b)||(l.a.mapa===b&&l.b.mapa===id)))ligs.push({...novaLigacao(id,b,{ladoA:'leste',ladoB:'oeste',tipo:'intermediario',auto:true})});
  return ligs;
 }
 async function montarPelosCenarios(){
  const ms=new Set(mapas().map(m=>String(m.id))),pares=paresDosCenarios(cenarios()).filter(p=>ms.has(p.ma)&&ms.has(p.mb));
  if(!pares.length)throw Error('Nenhum cenário com destino e mapa ligado.');
  let lista=[...ligs],nd=0,ni=0;
  const tem=(a,b)=>lista.some(l=>(l.a.mapa===a&&l.b.mapa===b)||(l.a.mapa===b&&l.b.mapa===a));
  const temInter=(a,b)=>mapas().some(m=>m.intermediario&&((m.intermediario.a===a&&m.intermediario.b===b)||(m.intermediario.a===b&&m.intermediario.b===a)));
  for(const p of pares){
   if(p.tipo){if(temInter(p.ma,p.mb)&&!tem(p.ma,p.mb))continue;ligs=lista;lista=await criarIntermediario(p.ma,p.mb,p.tipo,lista);ni++;}
   else if(!tem(p.ma,p.mb)){ligs=lista;lista=[...lista,novaLigacao(p.ma,p.mb,{auto:true})];nd++;}
  }
  // mapa sem nenhum acesso: liga ao cenário de local mais parecido por um trajeto
  const ligados=new Set(lista.flatMap(l=>[String(l.a.mapa),String(l.b.mapa)]));
  for(const c of cenarios()){const m=String(c.mapaId||'');if(!m||!ms.has(m)||ligados.has(m))continue;
   const viz=cenarios().filter(x=>x.id!==c.id&&x.mapaId&&ms.has(String(x.mapaId))&&ligados.has(String(x.mapaId))).map(x=>({x,pts:sem(x.local).split(/\W+/).filter(w=>w.length>3&&sem(c.local).includes(w)).length})).sort((a,b)=>b.pts-a.pts)[0]?.x;
   if(!viz)continue;ligs=lista;lista=await criarIntermediario(m,String(viz.mapaId),zonaDoLocal(c.local)==='rural'||zonaDoLocal(viz.local)==='rural'?'ermos':'cidade',lista);ligados.add(m);ni++;}
  await salvarLigs(lista);logGeral.unshift(`⚙️ ${nd} ligação(ões) diretas e ${ni} trajeto(s) entre regiões criados a partir dos cenários.`);
 }

 // ------------------------------------------------------------ assinaturas
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(LIGACOES),s=>{ligs=s.exists()?(s.data()?.ligacoes||[]):[];chave='';desenhar();desenharGeral();
   // v138: uma vez, no navegador do mestre, acerta os lados das saídas antigas
   if(ehMestre()&&s.exists()&&!s.data()?.ladosV138&&!corrigindo){corrigindo=true;const r=corrigirLados(ligs);
    dep.setDoc(D(LIGACOES),clean({ligacoes:r.ligs,atualizadoEm:Date.now(),ladosV138:{em:new Date().toISOString(),corrigidas:r.n,antes:ligs}})).then(()=>{if(r.n)aviso(`${r.n} saída(s) acertada(s): quem sai pela direita agora chega pela esquerda do outro mapa (e cima ↔ baixo).`);}).catch(e=>console.warn('[Ligações] lados',e)).finally(()=>{corrigindo=false;});}
  },e=>console.warn('[Ligações]',e)));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;chave='';desenhar();},e=>console.warn('[Ligações] mapa',e)));
  parar.push(dep.onSnapshot(D(SCENE),s=>{cena=s.exists()?s.data():null;},e=>console.warn('[Ligações] cena',e)));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},e=>console.warn('[Ligações] pedidos',e)));
 }
 setInterval(()=>{try{if(board()&&!root.hidden)desenhar();}catch(_){}},700); // v143: legendas aparecem/somem conforme o personagem anda
 root.addEventListener('pointerdown',e=>{if(balao&&!balao.hidden&&!balao.contains(e.target)&&!e.target.closest?.('.ml-saida'))fecharBalao();});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){if(modal&&!modal.hidden)modal.hidden=true;else if(balao&&!balao.hidden)fecharBalao();}});
 const vigia=setInterval(()=>{
  try{if(!uid())return;const k=uid()+'|'+ehMestre();if(assinado!==k){assinado=k;assinar();}desenhar();}catch(e){console.warn('[Ligações]',e);}
 },800);
 /** v205: liga dois mapas (se ainda não houver ligação) para o personagem poder ir e voltar pela saída 🚪➜ como qualquer jogador */
 async function ligar(a,b){if(!a||!b||String(a)===String(b))return false;if(ligs.some(l=>[String(l.a.mapa),String(l.b.mapa)].sort().join('|')===[String(a),String(b)].sort().join('|')))return false;await salvarLigs([...ligs,novaLigacao(String(a),String(b))]);return true;}
 return {abrirGeral,ligacoes:()=>ligs,ligar,parar:()=>{clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});}};
}
