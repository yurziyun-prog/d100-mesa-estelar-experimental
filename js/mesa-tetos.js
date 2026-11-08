// Mesa Estelar v139 — Telhados que se abrem e escadas entre andares.
//
// • Telhado: objeto da cena chamado "Telhado · …" (lona da tenda, telhado do café, casco da nave). Para os jogadores
//   ele cobre o lugar; quando um personagem de jogador entra debaixo dele, o telhado some e mostra o que há dentro.
//   O mestre vê o telhado meio transparente.
// • Escada: dois objetos "Escada … ·N" com o mesmo número formam um par (ex.: térreo ↔ andar de cima no mesmo mapa).
//   Perto de uma escada aparece "🪜 …": o personagem vai para a outra ponta.

import {livrePerto} from './mesa-ligacoes.js?v=154';

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',HIST='combatesAtivos/mapaMesaSyncHistorico';
export const PEDIDOS='combatesAtivos/mesaEscadas/acoes',ALCANCE_ESCADA=2;
export const ehTelhado=o=>!!o&&(o.tetoV139||/^telhado\s*·/i.test(String(o.nome||'')));
// Retângulo do objeto em coordenadas normalizadas (28×14).
export function retanguloN(o,W=28,H=14){const w=(Number(o.larguraM)||1)*28/W,h=(Number(o.alturaM)||1)*14/H;return {x0:Number(o.x)-w/2,y0:Number(o.y)-h/2,x1:Number(o.x)+w/2,y1:Number(o.y)+h/2};}
export const dentro=(p,r)=>Number(p.x)>=r.x0&&Number(p.x)<=r.x1&&Number(p.y)>=r.y0&&Number(p.y)<=r.y1;
export const chaveEscada=o=>{const m=/^escada(?:ria)?\b.*·\s*([\w-]+)\s*$/i.exec(String(o?.nome||'').trim());return m?m[1]:'';};
export function parDaEscada(o,objetos=[]){const k=chaveEscada(o);return k?objetos.find(x=>x!==o&&x.id!==o.id&&chaveEscada(x)===k)||null:null;}
export const rotuloEscada=o=>String(o?.nome||'Escada').replace(/\s*·\s*[\w-]+\s*$/,'');

// v177: telhados feitos por módulos (Oficina 3.0) que se encostam são um telhado só: entrou num, abre a casa toda
export function gruposTeto(tetos=[],W=28,H=14,toks=[]){
 const rs=tetos.map(o=>retanguloN(o,W,H)),pai=tetos.map((_,i)=>i),raiz=i=>pai[i]===i?i:(pai[i]=raiz(pai[i]));
 const toca=(a,b)=>a.x0<=b.x1+.02&&b.x0<=a.x1+.02&&a.y0<=b.y1+.02&&b.y0<=a.y1+.02;
 for(let i=0;i<tetos.length;i++)if(tetos[i].oficina3||tetos[i].grupoTetoV177)for(let j=i+1;j<tetos.length;j++)if((tetos[j].oficina3||tetos[j].grupoTetoV177)&&toca(rs[i],rs[j]))pai[raiz(i)]=raiz(j);
 const abre=new Set();tetos.forEach((o,i)=>{if(toks.some(t=>dentro(t,rs[i])))abre.add(raiz(i));});
 return new Map(tetos.map((o,i)=>[o,abre.has(raiz(i))]));
}
export function instalarTetos(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let cena=null,mapa=null,parar=[],assinado='',botao=null,ocupado=false;const processados=new Set();
 // v158: vale o mapa que ESTA tela mostra. Se o mestre estiver em outro mapa, usa a cena do mapa do jogador
 // (antes, as cadeiras e portas do mapa aberto pelo mestre apareciam por cima do mapa do jogador).
 const vistaV158=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 const outraV158=()=>{const v=vistaV158();return !!v&&v!==String(mapa?.mapId||'');};
 const dims=()=>{if(outraV158()){try{const d=ctl()?.dimsAtual?.();if(d?.W)return d;}catch(_){}}return {W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14};};
 const objetos=()=>{if(outraV158()){try{const c=ctl()?.cenaAtual?.();return c&&String(c.mapId||'')===vistaV158()?(c.objects||[]):[];}catch(_){return [];}}return cena&&mapa?.mapId&&String(cena.mapId||'')===String(mapa.mapId)?(cena.objects||[]):[];};
 const ehJogador=t=>!!String(t?.donoUid||'')&&!decodeURIComponent(String(t.id||'')).startsWith('sync');
 function ator(){const c=ctl();try{const t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}

 // ------------------------------------------------------------ telhados
 function telhados(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;const {W,H}=dims(),m=ehMestre();
  // v205: a revelação é LOCAL a esta sessão: o telhado abre para quem está embaixo dele (o personagem que esta tela controla), no mesmo nível.
  // Antes qualquer jogador sob o telhado abria o teto para todo mundo (inclusive para quem estava no alto ou fora). O mestre, sem personagem, segue vendo pelo critério antigo.
  const todos=(ctl()?.tokensNoMapa?.()||[]).filter(ehJogador),eu=ator(),toks=eu?[eu]:m?todos:[];
  const andarT=t=>{try{return Number(win.mesaAndarV144?.doToken?.(t.id))||1;}catch(_){return 1;}},andarO=o=>Math.max(1,Number(o?.andarV144??1)||1);
  const tetos=objetos().filter(ehTelhado),abertoDe=gruposTeto(tetos,W,H,toks.filter(t=>tetos.some(o=>andarO(o)===andarT(t))));
  for(const o of tetos){const n=b.querySelector(`[data-scene-object="${CSS.escape(String(o.id))}"]`);if(!n)continue;
   const aberto=abertoDe.get(o)??false,alvo=aberto?'0':m?'.45':'1';
   if(n.style.opacity!==alvo){n.style.transition='opacity .45s ease';n.style.opacity=alvo;}
   n.title=aberto?'':(m?'Telhado (some quando um jogador entra) · '+String(o.nome||''):String(o.nome||'').replace(/^telhado\s*·\s*/i,''));}
 }
 // ------------------------------------------------------------ escadas
 function escadaPerto(a){const {W,H}=dims();let melhor=null,dm=1e9;for(const o of objetos()){if(!chaveEscada(o))continue;const d=Math.hypot((a.x-o.x)*W/28,(a.y-o.y)*H/14);if(d<dm){dm=d;melhor=o;}}return melhor&&dm<=ALCANCE_ESCADA+Math.max(Number(melhor.larguraM)||1,Number(melhor.alturaM)||1)/2?melhor:null;}
 function botaoEscada(){
  const b=root.getElementById('novaSyncBoard'),a=ator(),o=a&&!mapa?.combat?.active?escadaPerto(a):null,par=o?parDaEscada(o,objetos()):null;
  if(!b||!o||!par){botao?.remove();botao=null;return;}
  if(!botao||botao.parentElement!==b){botao?.remove();botao=root.createElement('button');botao.type='button';botao.id='etEscada';
   botao.style.cssText="position:absolute;z-index:34;transform:translate(-50%,-190%);height:28px;padding:0 10px;border-radius:999px;border:1px solid #8ee7ff;background:rgba(8,22,36,.94);color:#cdf6ff;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;white-space:nowrap";
   botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',()=>void subir());b.append(botao);}
  const txt='🪜 '+rotuloEscada(o);if(botao.textContent!==txt)botao.textContent=txt;botao.title='Usar a escada: vai para '+rotuloEscada(par).replace(/^escada\s*/i,'a outra ponta ');botao.dataset.obj=String(o.id);
  botao.style.left=Number(o.x)/28*100+'%';botao.style.top=Number(o.y)/14*100+'%';
 }
 async function subir(){
  const a=ator();if(!a||ocupado||!botao)return;ocupado=true;
  const cmd={donoUid:uid(),personagemId:decodeURIComponent(String(a.id)),objetoId:botao.dataset.obj,criadoEm:Date.now()};
  try{if(ehMestre())await processar('local'+Date.now(),cmd);else await dep.setDoc(D(PEDIDOS+'/e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),cmd);}catch(e){console.warn('[Escadas]',e);}
  finally{setTimeout(()=>{ocupado=false;},700);}
 }
 async function processar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);
  try{
   const id=String(cmd.personagemId||''),t=(ctl()?.todosTokens?.()||[]).find(x=>decodeURIComponent(String(x.id))===id);if(!t)throw Error('Personagem não está no mapa.');
   if(!ehMestre()||(String(t.donoUid||'')!==String(cmd.donoUid||'')&&!String(pid).startsWith('local')))throw Error('Pedido de quem não controla o personagem.');
   const o=objetos().find(x=>String(x.id)===String(cmd.objetoId)),par=o?parDaEscada(o,objetos()):null;if(!o||!par)throw Error('Escada sem par.');
   const {W,H}=dims();if(Math.hypot((t.x-o.x)*W/28,(t.y-o.y)*H/14)>ALCANCE_ESCADA+3)throw Error('Longe da escada.');
   const ocup=[...objetos().filter(x=>x!==par),...(ctl()?.tokensNoMapa?.()||[]).filter(x=>x.id!==t.id).map(x=>({x:x.x,y:x.y,larguraM:1,alturaM:1,bloqueiaMovimento:true}))];
   const p=livrePerto(ocup,Number(par.x),Number(par.y),W,H,.5);
   await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+t.id),s=await tx.get(r);if(!s.exists())return;const h=await tx.get(D(HIST)),hh=h.exists()?h.data():{entries:[],revision:0};
    tx.set(r,{...s.data(),x:+p.x.toFixed(3),y:+p.y.toFixed(3),revision:Number(s.data().revision||0)+1});
    tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'esc:'+Date.now().toString(36),ts:Date.now(),actorUid:'',targetUid:'',message:`🪜 ${String(t.nome||'Alguém').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,'')}: ${rotuloEscada(o)}.`}].slice(-120),revision:Number(hh.revision||0)+1}));});
  }catch(e){console.warn('[Escadas]',e?.message||e);}
  finally{if(!String(pid).startsWith('local'))try{await dep.deleteDoc?.(D(PEDIDOS+'/'+pid));}catch(_){}}
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(SCENE),s=>{cena=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},()=>{}));
 }
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}telhados();botaoEscada();}catch(e){console.warn('[Tetos]',e);}},400);
 win.mesaTetos={telhados,processar};
 return {parar(){clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});botao?.remove();}};
}
