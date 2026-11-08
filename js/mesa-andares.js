import {patamarLivre} from './mesa-travessia-dados.js?v=182';
import {instalarSaltos} from './mesa-travessia.js?v=182';
// Mesa Estelar v144 — Andares de verdade: o andar de cima fica POR CIMA do térreo, no mesmo lugar do mapa.
//
// • Objetos têm um andar (andarV144: 1 = térreo, 2 = de cima…). O piso do andar de cima (pisoAndarV144) marca a área
//   que ele cobre. Uma escada de andar (escadaAndarV144) aparece nos dois andares (andarAmbosV144).
// • Quem está no térreo não vê nada do andar de cima. Quem sobe vê só o andar de cima: ele cobre o térreo, menos o
//   vão da escada (e, em lugares luxuosos, um balcão aberto — vaoAndarV144 — de onde se vê lá embaixo, tipo anfiteatro).
// • Paredes e móveis só barram quem está no mesmo andar. Personagens de andares diferentes não se esbarram nem se veem.
// • 🪜 perto da escada: sobe/desce. O mestre vê o andar do personagem com que está atuando, ou escolhe no 🏢.
// Módulo à parte: num mapa sem andares nada muda.

const ANDARES='combatesAtivos/mesaAndares',PEDIDOS=ANDARES+'/acoes',POS='combatesAtivos/mapaMesaSyncDireta/posicoes',HIST='combatesAtivos/mapaMesaSyncHistorico';
const clean=v=>JSON.parse(JSON.stringify(v??null));
const limpa=n=>String(n||'Alguém').replace(/^(NPC|Monstro|PJ|PM|Criatura)\s*[·:-]\s*/i,'');
const prop=(o,k)=>o?.[k]??o?.oficinaElement?.[k];
export const andarDoObjeto=o=>Math.max(1,Number(prop(o,'andarV144')??1)||1);
export const nosDoisAndares=o=>!!prop(o,'andarAmbosV144');
export const pisoDoAndar=o=>Number(prop(o,'pisoAndarV144')??0)||0;
export const ehVao=o=>!!prop(o,'vaoAndarV144');
export const ehEscadaAndar=o=>!!prop(o,'escadaAndarV144');
export const ALCANCE=2.2;
/** nível de destino de uma escada/rampa/poço: ligação explícita (superfície ↔ subsolo) → andar-base do editor → paraAndarV144 → vizinho. Função pura. */
export function destinoEscada(o,de,as=[1,2]){
 const liga=prop(o,'ligaAndaresV205');if(Array.isArray(liga)&&liga.length===2&&liga.includes(de))return liga[0]===de?liga[1]:liga[0];
 const base=Number(prop(o,'andarBaseV198'))||0;if(base){const d=de===base?base+1:base;return as.includes(d)?d:(de>1?1:2);}
 const para=Number(prop(o,'paraAndarV144'))||(de>1?de-1:2);return as.includes(para)?para:(de>1?1:2);}
// v205: ID de andar e ELEVAÇÃO são coisas diferentes. O ID continua positivo e estável (compatível com mapas antigos); a elevação física do piso é (id-1)*3 m,
// a menos que algum objeto do andar declare elevacaoAndarV205 (ex.: subsolo = -3 m). Visão, cobertura e ordem usam a elevação, nunca o número do ID.
export const ANDAR_SUBSOLO=9;
export function elevacoesDoMapa(objs=[]){const m=new Map();for(const o of objs){const e=prop(o,'elevacaoAndarV205');if(e===undefined||e===null||e==='')continue;const a=andarDoObjeto(o);if(Number.isFinite(Number(e)))m.set(a,Number(e));}return m;}
export const elevacaoDoAndar=(a,elev)=>elev&&elev.has(a)?elev.get(a):(Math.max(1,Number(a)||1)-1)*3;
const ret=o=>{const w=(Number(o.larguraM)||1)*28/(o.__W||28),h=(Number(o.alturaM)||1)*14/(o.__H||14);return {x0:Number(o.x)-w/2,y0:Number(o.y)-h/2,x1:Number(o.x)+w/2,y1:Number(o.y)+h/2};};
const dentro=(p,r)=>Number(p.x)>=r.x0&&Number(p.x)<=r.x1&&Number(p.y)>=r.y0&&Number(p.y)<=r.y1;
// Áreas cobertas por cada andar acima do térreo, e os vãos (de onde se vê o andar de baixo).
export function coberturas(objs=[],W=28,H=14){
 const piso=new Map(),vaos=[],abertos=new Map(),elev=elevacoesDoMapa(objs);
 for(const o of objs){const a=pisoDoAndar(o),r=ret({...o,__W:W,__H:H});if(a>1){if(!piso.has(a))piso.set(a,[]);piso.get(a).push(r);if(prop(o,'abertoV164')){if(!abertos.has(a))abertos.set(a,[]);abertos.get(a).push(r);}}if(ehVao(o)||ehEscadaAndar(o))vaos.push(r);}
 return {piso,vaos,abertos,elev};
}
export const andaresDoMapa=(objs=[])=>{const elev=elevacoesDoMapa(objs);return [...new Set([1,...objs.map(andarDoObjeto),...objs.map(pisoDoAndar).filter(a=>a>1)])].sort((a,b)=>elevacaoDoAndar(a,elev)-elevacaoDoAndar(b,elev)||a-b);}; // ordenado pela elevação (o subsolo vem antes do térreo)
// Um ponto do andar `a` fica escondido para quem olha do andar `v` (> a) se algum andar entre eles o cobre.
function coberto(p,a,v,cob){
 if(cob.vaos.some(r=>dentro(p,r)))return false;
 const ea=elevacaoDoAndar(a,cob.elev),ev=elevacaoDoAndar(v,cob.elev);
 if(ea<0&&ev>=0)return true; // subsolo visto da superfície: a terra o cobre (só os vãos mostram)
 for(const [k,rs] of cob.piso){const ek=elevacaoDoAndar(k,cob.elev);if(ek>ea&&ek<=ev&&rs.some(r=>dentro(p,r)))return true;}
 return false;
}
export function objetoVisivel(o,v,cob){
 if(nosDoisAndares(o))return true;const a=andarDoObjeto(o);
 if(a===v)return true;if(elevacaoDoAndar(a,cob.elev)>elevacaoDoAndar(v,cob.elev))return false;return !coberto(o,a,v,cob);
}
// v164: quem está num terraço aberto (a céu aberto) é visto de baixo, da rua
export function tokenVisivel(t,a,v,cob){if(a===v)return true;if(elevacaoDoAndar(a,cob.elev)>elevacaoDoAndar(v,cob.elev))return (cob.abertos?.get(a)||[]).some(r=>dentro(t,r));return !coberto(t,a,v,cob);}
// Este objeto barra quem está no andar `a`?
export const barra=(o,a)=>nosDoisAndares(o)||andarDoObjeto(o)===a;

export function instalarAndares(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const el=id=>root.getElementById(id);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let estado={tokens:{}},parar=[],assinado='',verAndar=1,botao=null,ocupado=false;const processados=new Set(),temporizadores=new Set(),recibos=new Set();
 const depois=(fn,ms)=>{const id=setTimeout(()=>{temporizadores.delete(id);fn();},ms);temporizadores.add(id);return id;};
 const mapaAtual=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 const cena=()=>{try{const c=ctl()?.cenaAtual?.();if(!c||String(c.mapId||'')!==mapaAtual())return null;return win.mesaRascunhoCenaV197_?.(c)||c;}catch(_){return null;}};
 const objetos=()=>cena()?.objects||[];
 const dims=()=>{try{return ctl()?.dimsAtual?.()||{W:28,H:14};}catch(_){return {W:28,H:14};}};
 const tokenPorId=id=>{try{return (ctl()?.todosTokens?.()||[]).find(t=>String(t.id)===String(id))||null;}catch(_){return null;}};
 function andarDoToken(id){const t=tokenPorId(id),r=estado.tokens?.[id];if(!r)return 1;return String(r.mapa||'')===String(t?.mapaId||mapaAtual())?Math.max(1,Number(r.andar)||1):1;}
 function ator(){try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 const temAndares=()=>andaresDoMapa(objetos()).length>1;
 let editando=false;
 function andarVisto(){if(editando&&ehMestre())return verAndar;const a=ator();return a?andarDoToken(a.id):verAndar;}
 // usado pela colisão da mesa (nova-direta)
 win.mesaAndarV144={
  colide:(tokenId,o)=>!temAndares()||barra(o,andarDoToken(tokenId)),
  mesmoAndar:(a,b)=>!temAndares()||andarDoToken(a)===andarDoToken(b),
  doToken:andarDoToken,visto:andarVisto,elevacaoVista:()=>elevacaoDoAndar(andarVisto(),elevacoesDoMapa(objetos())),
  /* editor rápido: mestre construindo escolhe o andar que vê (ligar/desligar) */
  editor:(on,n)=>{editando=!!on;if(n)verAndar=Math.max(1,Number(n)||1);desenhar();},
  ver:n=>{verAndar=Math.max(1,Number(n)||1);desenhar();}
 };
 try{win.addEventListener('mesa-rascunho-v197',()=>{if(editando)desenhar();});}catch(_){}

 // ------------------------------------------------------------ desenho (cada tela)
 function desenhar(){
  let st=el('anEsconde');if(!st){st=root.createElement('style');st.id='anEsconde';root.head.append(st);}
  const objs=objetos(),b=el('novaSyncBoard');
  if(!b||!temAndares()){if(st.textContent)st.textContent='';botaoAndar(false);botaoEscada(null);return;}
  const {W,H}=dims(),cob=coberturas(objs,W,H),v=andarVisto(),regras=[];
  for(const o of objs)if(!objetoVisivel(o,v,cob)){const k=CSS.escape(String(o.id));regras.push(`#novaSyncBoard [data-scene-object="${k}"]`,`#novaSyncBoard [data-obj="${k}"]`);} // objeto e o ícone dele (porta, luz, armário…)
  for(const t of ctl()?.tokensNoMapa?.()||[])if(!tokenVisivel(t,andarDoToken(t.id),v,cob))regras.push(`#novaSyncBoard [data-token="${CSS.escape(String(t.id))}"]`);
  const css=regras.length?regras.join(',')+'{visibility:hidden!important;pointer-events:none!important}':'';if(st.textContent!==css)st.textContent=css;
  botaoAndar(true);
  const a=ator(),x=a&&!ctl()?.emCombate?.()?escadaPerto(a):null;botaoEscada(x);autoEscada(a,x);
 }
 // v205: escada e rampa começam a travessia ao ANDAR para dentro da entrada (sem botão desenhado; o botão fica invisível só para F/controle). Passar de lado não aciona;
 // depois de usar, a mesma entrada só vale de novo quando o ator sai da zona (evita subir/descer em loop).
 let ultPos=null,travada='',ultAndou=0;
 function autoEscada(a,x){
  if(!a){ultPos=null;return;}
  const agora=Date.now(),prev=ultPos;if(prev&&Math.hypot(a.x-prev.x,a.y-prev.y)>.004)ultAndou=agora;ultPos={x:a.x,y:a.y,t:agora};const andou=agora-ultAndou<1600; // andou há pouco (não só neste instante)
  if(!x){if(travada)travada='';return;}
  const {W,H}=dims(),o=x.o,d=Math.hypot((a.x-o.x)*W/28,(a.y-o.y)*H/14),entrada=Math.max(.9,Math.min(Number(o.larguraM)||1,Number(o.alturaM)||1)/2);
  if(travada===String(o.id)){if(d>Math.max(1.3,entrada+.4))travada='';return;}
  if(d<=entrada&&andou&&!ocupado&&botao){travada=String(o.id);void usar();}
 }
 function botaoAndar(mostrar){
  let bt=el('anVer');const m=ehMestre();
  if(!mostrar||!m){bt?.remove();return;}
  const b=el('novaSyncBoard'),sc=b?.parentElement;if(!sc)return;
  if(!bt){bt=root.createElement('button');bt.type='button';bt.id='anVer';bt.style.cssText="position:absolute;right:8px;bottom:150px;z-index:31;height:28px;padding:0 10px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:12px 'Segoe UI',Arial,sans-serif;cursor:pointer";
   bt.addEventListener('pointerdown',e=>e.stopPropagation());bt.addEventListener('click',()=>{const as=andaresDoMapa(objetos());const i=as.indexOf(verAndar);verAndar=as[(i+1)%as.length]||1;desenhar();});sc.append(bt);}
  const a=ator(),tx=`🏢 ${a?andarDoToken(a.id):verAndar}º andar`;if(bt.textContent!==tx)bt.textContent=tx;
  bt.title=a?'Você vê o andar do personagem com que está atuando':'Trocar o andar que você está vendo';bt.disabled=!!a;
 }
 function escadaPerto(a){
  const {W,H}=dims(),v=andarDoToken(a.id);let melhor=null,dm=1e9;
  for(const o of objetos()){if(!ehEscadaAndar(o))continue;const d=Math.hypot((a.x-o.x)*W/28,(a.y-o.y)*H/14);if(d<dm){dm=d;melhor=o;}}
  return melhor&&dm<=ALCANCE+Math.max(Number(melhor.larguraM)||1,Number(melhor.alturaM)||1)/2?{o:melhor,de:v}:null;
 }
 function destinoDaEscada(o,de){const as=andaresDoMapa(objetos()),base=Number(prop(o,'andarBaseV198'))||0;
  const liga=prop(o,'ligaAndaresV205');if(Array.isArray(liga)&&liga.length===2&&liga.includes(de))return liga[0]===de?liga[1]:liga[0]; /* v205: ligação explícita entre dois níveis (superfície ↔ subsolo), sem supor que subir = somar 1 */if(base){const d=de===base?base+1:base;return as.includes(d)?d:(de>1?1:2);} /* escada feita no editor: liga o andar-base ao de cima */
  const para=Number(prop(o,'paraAndarV144'))||(de>1?de-1:2);return as.includes(para)?para:(de>1?1:2);}
 function botaoEscada(x){
  const b=el('novaSyncBoard');
  if(!b||!x){botao?.remove();botao=null;return;}
  if(!botao||botao.parentElement!==b){botao?.remove();botao=root.createElement('button');botao.type='button';botao.id='anEscada';
   botao.style.cssText="position:absolute;z-index:34;transform:translate(-50%,-190%);opacity:0;pointer-events:none;height:28px;padding:0 10px;border-radius:999px;border:1px solid #8ee7ff;background:rgba(8,22,36,.94);color:#cdf6ff;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;white-space:nowrap";
   botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',()=>void usar());b.append(botao);}
  const para=destinoDaEscada(x.o,x.de),el0=elevacoesDoMapa(objetos()),sobe=elevacaoDoAndar(para,el0)>elevacaoDoAndar(x.de,el0),txt=sobe?'🪜 Subir':'🪜 Descer';if(botao.textContent!==txt)botao.textContent=txt;
  botao.title=para>x.de?`Subir para o ${para}º andar`:(para===1?'Descer para o térreo':`Descer para o ${para}º andar`);botao.dataset.obj=String(x.o.id);
  botao.style.left=Number(x.o.x)/28*100+'%';botao.style.top=Number(x.o.y)/14*100+'%';
 }
 async function usar(){
  const a=ator();if(!a||ocupado||!botao)return;ocupado=true;
  const cmd={donoUid:uid(),personagemId:decodeURIComponent(String(a.id)),tokenId:String(a.id),objetoId:botao.dataset.obj,mapa:mapaAtual(),criadoEm:Date.now()};
  try{if(ehMestre())await processar('local'+Date.now(),cmd,true);else {const ref=D(PEDIDOS+'/a'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));await dep.setDoc(ref,cmd);let stop;const timer=depois(()=>{stop?.();win.alert?.('Sem resposta do mestre para a escada. Tente novamente.');},20000);stop=dep.onSnapshot(ref,s=>{const d=s.exists()?s.data():null;if(d?.status){clearTimeout(timer);stop?.();if(d.status==='erro')win.alert?.(d.mensagem);recibos.delete(stop);}});recibos.add(stop);}}catch(e){console.warn('[Andares]',e);}
  finally{depois(()=>{ocupado=false;},700);}
 }
 // ------------------------------------------------------------ o mestre aplica
 async function cenaDoMapa(id){
  const c=cena();if(c&&String(c.mapId||'')===String(id))return c;
  for(const p of ['combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id),'combatesAtivos/mapaMesaSyncDiretaCena']){try{const s=await dep.getDoc(D(p));if(s.exists()&&String(s.data()?.mapId||'')===String(id))return s.data();}catch(_){}}
  return null;
 }
 async function processar(pid,cmd,local=false){
  if(processados.has(pid)||cmd.status)return;processados.add(pid);if(processados.size>500)processados.delete(processados.values().next().value);
  try{
   if(!Number.isFinite(cmd.criadoEm)||Math.abs(Date.now()-cmd.criadoEm)>15000)throw Error('Pedido de escada expirado. Tente novamente.');
   const t=tokenPorId(cmd.tokenId)||tokenPorId(encodeURIComponent(String(cmd.personagemId||'')));if(!t)throw Error('Personagem não encontrado.');
   if(!ehMestre()||(String(t.donoUid||'')!==String(cmd.donoUid||'')&&!local))throw Error('Pedido de quem não controla o personagem.');
   const mid=String(t.mapaId||cmd.mapa||''),c=await cenaDoMapa(mid),o=(c?.objects||[]).find(x=>String(x.id)===String(cmd.objetoId));if(!o||!ehEscadaAndar(o))throw Error('Escada não encontrada.');
   const m=(dep.mapas?.()||[]).find(x=>String(x.id)===mid),W=Number(m?.larguraM)||28,H=Number(m?.alturaM)||14;
   if(Math.hypot((t.x-o.x)*W/28,(t.y-o.y)*H/14)>ALCANCE+3)throw Error('Longe da escada.');
   const r=estado.tokens?.[t.id],de=r&&String(r.mapa||'')===mid?Number(r.andar)||1:1,para=destinoEscada(o,de,andaresDoMapa(c.objects||[]));
   await dep.runTransaction(dep.db,async tx=>{
    const rf=D(POS+'/'+t.id),s=await tx.get(rf),ar=await tx.get(D(ANDARES)),h=await tx.get(D(HIST));
    const request=local?null:await tx.get(D(PEDIDOS+'/'+pid));if(request&&(!request.exists()||request.data().status))return;
    const combat=await tx.get(D('combatesAtivos/mapaMesaSyncDireta')),health=await tx.get(D('combatesAtivos/mapaMesaSyncSaude'));
    if(combat.exists()&&combat.data().mapId===mid&&combat.data().combat?.active)throw Error('Use a escada fora de combate.');
    const hp=health.exists()?health.data().actors?.[t.id]?.combateLab:null;if(hp?.morto||hp?.inconsciente)throw Error('O personagem precisa estar consciente para usar a escada.');
    if(!s.exists())throw Error('Personagem saiu do mapa.');const fresh={...s.data(),id:t.id},and=ar.exists()?ar.data():{tokens:{}};
    if(!local&&String(fresh.donoUid||'')!==String(cmd.donoUid||''))throw Error('Você não controla este personagem.');
    if(String(fresh.mapaId||mid)!==mid)throw Error('O personagem mudou de mapa.');
    if(Math.hypot((fresh.x-o.x)*W/28,(fresh.y-o.y)*H/14)>ALCANCE+Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)/2)throw Error('Longe da escada.');
    const atual=and.tokens?.[t.id];if(atual?.mapa===mid&&Number(atual.andar||1)!==de)throw Error('O andar mudou. Tente novamente.');
    const outros=(ctl()?.todosTokens?.()||[]).filter(x=>String(x.mapaId||mid)===mid).map(x=>({...x,andar:and.tokens?.[x.id]?.mapa===mid?and.tokens[x.id].andar:1}));
    const p=patamarLivre(o,{objects:c.objects||[],tokens:outros,token:fresh,andar:para,W,H});if(!p)throw Error('Patamar ocupado ou sem piso. Libere a saída antes de usar a escada.');
    const em=Date.now(),movimento={id:pid,tipo:'escada',de:{x:fresh.x,y:fresh.y},para:p,em},hh=h.exists()?h.data():{entries:[],revision:0};
    tx.set(D(ANDARES),clean({...and,tokens:{...(and.tokens||{}),[t.id]:{mapa:mid,andar:para,em,movimento}}}));
    tx.set(rf,{...s.data(),x:+p.x.toFixed(4),y:+p.y.toFixed(4),revision:Number(s.data().revision||0)+1});
    tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'and:'+pid,ts:em,actorUid:cmd.donoUid||'',targetUid:'',message:'🪜 '+limpa(t.nome)+(para>de?' sobe para o '+para+'º andar.':para===1?' desce para o térreo.':' desce para o '+para+'º andar.')}].slice(-120),revision:Number(hh.revision||0)+1}));
    if(request)tx.set(D(PEDIDOS+'/'+pid),{...request.data(),status:'concluido',mensagem:'Travessia concluída.'});
   });
  }catch(e){console.warn('[Andares]',e?.message||e);if(local)win.alert?.(e?.message||String(e));else await dep.setDoc(D(PEDIDOS+'/'+pid),{status:'erro',mensagem:e?.message||String(e)},{merge:true});}
  finally{if(!local)depois(()=>void dep.deleteDoc?.(D(PEDIDOS+'/'+pid)).catch?.(()=>{}),30000);}

 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(ANDARES),s=>{estado={tokens:{},...(s.exists()?s.data():{})};},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},()=>{}));
 }
 const saltos=instalarSaltos({...dep,andar:id=>andarDoToken(id)});
 const vigia=setInterval(()=>{try{if(!uid())return;const k=uid()+'|'+ehMestre();if(k!==assinado){assinado=k;assinar();}desenhar();}catch(e){console.warn('[Andares]',e);}},350);
 return {parar(){saltos.parar();clearInterval(vigia);for(const id of temporizadores)clearTimeout(id);for(const stop of recibos)stop();parar.forEach(f=>{try{f();}catch(_){}});},processar};
}
