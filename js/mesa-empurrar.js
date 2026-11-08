// Mesa Estelar v173 — Caixas, barris e coisas leves no caminho: quem esbarra empurra (se for leve) ou pula por cima.
//
// • Ao andar contra uma caixa/barril/caixote leve, ela desliza 1 m para a frente (se houver espaço livre do outro lado).
// • Se não der para empurrar (parede atrás, ou é pesada demais) e for baixa, o personagem pula por cima e cai do outro lado.
// • O jogador manda o pedido (combatesAtivos/mesaEmpurrar/acoes); o navegador do mestre confere e grava. O mestre faz direto.

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena';
export const PEDIDOS='combatesAtivos/mesaEmpurrar/acoes';
const BAIXO=/caixa|caixote|engradado|barril|barrica|barris|tonel|saco|cesto|balde|vaso|jarro|banquinho|tamborete|banqueta|sucata|carga|pneu|lata|fardo|bau\b|pallet|palete|tora|tronco caido|pedra pequena|entulho/;
const andar=o=>Number(o?.andarV144??o?.oficinaElement?.andarV144??1);
const area=o=>(Number(o.larguraM)||1)*(Number(o.alturaM)||1);
// dá para pular por cima: coisa baixa e não muito funda
export function pulavel(o){
 if(!o||o.destruido||!o.bloqueiaMovimento||andar(o)>1)return false;
 if(!BAIXO.test(sem(o.nome||o.modeloId||o.oficinaElement?.modeloId||'')))return false;
 return Math.min(Number(o.larguraM)||1,Number(o.alturaM)||1)<=1.8&&area(o)<=4.5;
}
// dá para empurrar: leve (uma caixa, um barril, um saco)
export function empurravel(o){return pulavel(o)&&area(o)<=1.7&&!/agrupad|pilha|barris\b|caixas\b|carga pesada|fardos/.test(sem(o.nome));}

const emM=(o,W,H)=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,w:Number(o.larguraM)||1,h:Number(o.alturaM)||1,a:Number(o.angulo)||0});
const caixa=o=>{const g=Math.abs(Math.round(o.a/90))%2===1;const w=g?o.h:o.w,h=g?o.w:o.h;return {x0:o.x-w/2,y0:o.y-h/2,x1:o.x+w/2,y1:o.y+h/2};};
const cruza=(a,b,m=0)=>a.x0<b.x1-m&&a.x1>b.x0+m&&a.y0<b.y1-m&&a.y1>b.y0+m;
function barreiras(objetos,W,H,fora){
 return (objetos||[]).filter(o=>o&&o!==fora&&String(o.id)!==String(fora?.id)&&o.bloqueiaMovimento&&!o.destruido&&andar(o)<=1&&!globalThis.mesaPassavelV170_?.(o)).map(o=>caixa(emM(o,W,H)));
}
// direção do esbarrão (eixo dominante) e a caixa leve que está ali
export function acharObstaculo({de,para,objetos,W,H,raio=.5}){
 const a={x:de.x*W/28,y:de.y*H/14},b={x:para.x*W/28,y:para.y*H/14};let dx=b.x-a.x,dy=b.y-a.y;const L=Math.hypot(dx,dy);if(L<.02)return null;
 dx/=L;dy/=L;
 // ponto logo à frente do personagem
 const f={x:a.x+dx*(raio+.35),y:a.y+dy*(raio+.35)};
 let melhor=null,dm=1e9;
 for(const o of objetos||[]){if(!pulavel(o))continue;const c=caixa(emM(o,W,H));
  const dentro=f.x>=c.x0-.25&&f.x<=c.x1+.25&&f.y>=c.y0-.25&&f.y<=c.y1+.25;if(!dentro)continue;
  const m=emM(o,W,H),d=Math.hypot(m.x-a.x,m.y-a.y);if(d<dm){dm=d;melhor=o;}}
 if(!melhor)return null;
 const ax=Math.abs(dx)>=Math.abs(dy)?{x:Math.sign(dx),y:0}:{x:0,y:Math.sign(dy)};
 return {obj:melhor,dir:ax};
}
// onde a caixa vai parar se for empurrada 1 m (null = não cabe)
export function planoEmpurrao({obj,dir,objetos,tokens=[],W,H,passo=1}){
 if(!empurravel(obj))return null;const m=emM(obj,W,H),c=caixa(m);
 const n={x0:c.x0+dir.x*passo,x1:c.x1+dir.x*passo,y0:c.y0+dir.y*passo,y1:c.y1+dir.y*passo};
 if(n.x0<.2||n.y0<.2||n.x1>W-.2||n.y1>H-.2)return null;
 if(barreiras(objetos,W,H,obj).some(b=>cruza(n,b,.02)))return null;
 for(const t of tokens){const p={x:Number(t.x)*W/28,y:Number(t.y)*H/14},r=(Number(t.diametroM)||1)/2*.8;if(cruza(n,{x0:p.x-r,x1:p.x+r,y0:p.y-r,y1:p.y+r}))return null;}
 return {x:+((m.x+dir.x*passo)*28/W).toFixed(3),y:+((m.y+dir.y*passo)*14/H).toFixed(3)};
}
// onde o personagem cai se pular por cima (null = não dá)
export function planoPulo({obj,dir,ator,objetos,W,H}){
 if(!pulavel(obj))return null;const c=caixa(emM(obj,W,H)),p={x:Number(ator.x)*W/28,y:Number(ator.y)*H/14},r=(Number(ator.diametroM)||1)/2;
 const fundo=dir.x?c.x1-c.x0:c.y1-c.y0;if(fundo>1.8)return null;
 const q=dir.x?{x:(dir.x>0?c.x1:c.x0)+dir.x*(r+.15),y:p.y}:{x:p.x,y:(dir.y>0?c.y1:c.y0)+dir.y*(r+.15)};
 if(q.x<r||q.y<r||q.x>W-r||q.y>H-r)return null;
 const t={x0:q.x-r*.85,x1:q.x+r*.85,y0:q.y-r*.85,y1:q.y+r*.85};
 if(barreiras(objetos,W,H,null).some(b=>cruza(t,b,.02)))return null;
 return {x:+(q.x*28/W).toFixed(3),y:+(q.y*14/H).toFixed(3)};
}

export function instalarEmpurrar(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,...p.split('/'));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const toast=t=>{let n=root.getElementById('emAviso');if(!n){n=root.createElement('div');n.id='emAviso';n.style.cssText='position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:9999;background:#1d2a44;border:1px solid #8ee7ff;color:#e8eefc;padding:7px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;pointer-events:none';root.body.append(n);}
  n.textContent=t;n.hidden=false;clearTimeout(n._t);n._t=setTimeout(()=>{n.hidden=true;},2600);};
 const limpa=n=>String(n||'').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 let ultimo=0;
 async function cenaDe(mapa){
  const ativo=await dep.getDoc(D(SCENE));if(ativo.exists()&&String(ativo.data()?.mapId||'')===mapa)return {cena:ativo.data(),ativa:true};
  const arq=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(mapa)));return {cena:arq.exists()?arq.data():null,ativa:false};
 }
 function dimsDe(mapa){try{const c=ctl();if(String(c?.mapaAtual?.()||'')===mapa){const d=c.dimsAtual();if(d?.W)return d;}}catch(_){}
  const m=(dep.mapas?.()||[]).find(x=>String(x.id)===mapa);return {W:Number(m?.larguraM)||28,H:Number(m?.alturaM)||14};}
 // o mestre executa (pedido próprio ou de jogador)
 async function executar(cmd){
  const mapa=String(cmd.mapa||'');if(!mapa)return '';
  const tk=await dep.getDoc(D(POS+'/'+cmd.tokenId));if(!tk.exists())return '';const t={...tk.data(),id:cmd.tokenId};
  if(String(t.mapaId||'')!==mapa&&t.mapaId)return '';
  if(cmd.donoUid&&!ehMestreUid(cmd.donoUid)&&String(t.donoUid||'')!==String(cmd.donoUid))throw Error('pedido de quem não controla o personagem');
  const {W,H}=dimsDe(mapa),{cena,ativa}=await cenaDe(mapa);if(!cena)return '';
  const objs=cena.objects||[],achado=acharObstaculo({de:t,para:cmd.para,objetos:objs,W,H,raio:(Number(t.diametroM)||1)/2});if(!achado)return '';
  const toks=(ctl()?.todosTokens?.()||[]).filter(x=>x.id!==t.id&&String(x.mapaId||'')===mapa);
  const nova=planoEmpurrao({obj:achado.obj,dir:achado.dir,objetos:objs,tokens:toks,W,H});
  const nome=limpa(t.nome)||'Alguém',coisa=String(achado.obj.nome||'a caixa').toLowerCase();
  if(nova){
   const id=String(achado.obj.id);
   const mudar=c=>({...c,objects:(c.objects||[]).map(o=>String(o.id)===id?{...o,x:nova.x,y:nova.y,empurradoV173:Date.now()}:o),editorRevision:Number(c.editorRevision||0)+1});
   await dep.runTransaction(dep.db,async tx=>{
    const arqRef=D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(mapa)),a=await tx.get(arqRef);
    const s=ativa?await tx.get(D(SCENE)):null;
    if(s&&s.exists()&&String(s.data()?.mapId||'')===mapa){const n=clean(mudar(s.data()));tx.set(D(SCENE),n);tx.set(arqRef,n);}
    else if(a.exists())tx.set(arqRef,clean(mudar(a.data())));
   });
   return `📦 ${nome} empurrou ${coisa}.`;
  }
  const pulo=planoPulo({obj:achado.obj,dir:achado.dir,ator:t,objetos:objs,W,H});
  if(pulo){
   await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+cmd.tokenId),s=await tx.get(r);if(!s.exists())return;tx.set(r,{...s.data(),x:pulo.x,y:pulo.y,revision:Number(s.data().revision||0)+1});});
   return `🤸 ${nome} pulou por cima de ${coisa}.`;
  }
  return '';
 }
 const ehMestreUid=u=>ehMestre()&&String(u)===uid();
 // chamado pelo movimento (nova-direta) quando o caminho fica barrado
 globalThis.mesaBloqueioV173_=async(tokenId,{para,parou,mapa})=>{
  const agora=Date.now();if(agora-ultimo<450)return;ultimo=agora;
  try{
   const c=ctl(),t=c?.token?.(tokenId);if(!t)return;
   const {W,H}=dimsDe(String(mapa||'')),cena=c?.cenaAtual?.();
   const objs=cena&&String(cena.mapId||'')===String(mapa)?cena.objects||[]:[];
   if(!acharObstaculo({de:parou,para,objetos:objs,W,H,raio:(Number(t.diametroM)||1)/2}))return; // não é caixa: parede de verdade
   const cmd={tokenId,para,mapa:String(mapa||''),donoUid:uid(),personagemId:String(tokenId),criadoEm:agora};
   if(ehMestre()){const r=await executar({...cmd,donoUid:''});if(r)toast(r);}
   else{await dep.setDoc(D(PEDIDOS+'/em_'+agora.toString(36)+Math.random().toString(36).slice(2,6)),clean(cmd));toast('📦 Empurrando…');}
  }catch(e){console.warn('[Empurrar]',e);}
 };
 // fila dos jogadores (só no navegador do mestre)
 const feitos=new Set();let parar=null,assinado='';
 setInterval(()=>{
  const k=uid()+'|'+ehMestre();if(k===assinado)return;assinado=k;try{parar?.();}catch(_){}parar=null;
  if(!ehMestre()||!dep.onSnapshot||!dep.collection)return;
  parar=dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{if(feitos.has(d.id))return;feitos.add(d.id);
   void (async()=>{try{const r=await executar(d.data()||{});if(r){try{await dep.setDoc(D('combatesAtivos/mesaEmpurrar'),{ultimo:{texto:r,em:Date.now(),donoUid:String(d.data()?.donoUid||'')}},{merge:true});}catch(_){}}}
    catch(e){console.warn('[Empurrar] pedido',e?.message||e);}finally{try{await dep.deleteDoc(D(PEDIDOS+'/'+d.id));}catch(_){}}})();});},e=>console.warn('[Empurrar]',e));
 },1000);
 // o jogador vê o resultado do pedido dele
 try{dep.onSnapshot?.(D('combatesAtivos/mesaEmpurrar'),s=>{const u=s.exists()?s.data()?.ultimo:null;if(u&&!ehMestre()&&String(u.donoUid)===uid()&&Date.now()-Number(u.em)<5000)toast(u.texto);},()=>{});}catch(_){}
 win.mesaEmpurrarV173={executar,acharObstaculo,planoEmpurrao,planoPulo,pulavel,empurravel};
 return {};
}
