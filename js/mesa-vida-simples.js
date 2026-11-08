// Mesa Estelar v200 — Vida simples no combate em tempo real: UMA barra de PV, fadiga e psiquismo (sem dano por partes do corpo).
//
// Temporário, a pedido do mestre, para deixar o combate em tempo real mais simples:
//  • o dano deixa de ser por parte do corpo (cabeça, peito, braços…): tudo entra num PV só ("PV Global" — o mesmo conjunto que o jogo já usa para
//    quem tem um PV só). Sem ferimentos sérios/graves, sem membros inúteis, sem choque, sem coma. Zerou o PV = inconsciente; passou de −25% do PV máximo = morto.
//  • cada miniatura mostra três barras finas: ❤️ PV, 🟦 fadiga (cai ao atacar, volta com calma) e 🟪 psiquismo (só quem tem poder psíquico).
//  • botão no painel do tempo real (⚡) liga/desliga: desligado, tudo volta ao sistema por partes do corpo.
// Só mexe no que acontece DEPOIS de cada ataque do tempo real (mesa-tempo-real.js chama colapsar()); fichas e dados do jogo não são alterados.
// Fatigue: cai 6 pontos por ataque feito; volta 3 a cada 5 s; abaixo de 20% a criatura/pessoa ataca mais devagar (intervalo ×1,5).

export const PV_GLOBAL='PV Global';
export const FADIGA_MAX=100,CUSTO_ATAQUE=6,RECUPERA_5S=3,LIMITE_CANSADO=20;
const PATH={config:'configuracoes/modoCombateV200',fadiga:'combatesAtivos/mesaFadigaV200',saude:'combatesAtivos/mapaMesaSyncSaude',mapa:'combatesAtivos/mapaMesaSyncDireta'};

/** junta as partes do corpo num PV só; devolve uma cópia (idempotente). Morto/inconsciente passam a depender só do PV. */
export function colapsarVida(cl){
 if(!cl||typeof cl!=='object')return cl;
 const hm=cl.hitMax||{},locais=Object.keys(hm);
 let max,atual,pa;
 if(locais.length===1&&locais[0]===PV_GLOBAL){max=Number(hm[PV_GLOBAL])||1;atual=Number(cl.hit?.[PV_GLOBAL]??max);pa=Number(cl.armor?.[PV_GLOBAL])||0;}
 else if(locais.length){
  max=locais.reduce((s,k)=>s+Math.max(0,Number(hm[k])||0),0)||1;
  atual=locais.reduce((s,k)=>s+Number(cl.hit?.[k]??hm[k]),0);
  const ar=locais.map(k=>Math.max(0,Number(cl.armor?.[k])||0));pa=ar.some(v=>v>0)?Math.ceil(ar.reduce((s,v)=>s+v,0)/ar.length):0;
 }else return cl;
 const caiu=atual<=0,morto=atual<=-Math.ceil(max*.25);
 const out={...cl,hitMax:{[PV_GLOBAL]:max},hit:{[PV_GLOBAL]:atual},armor:{[PV_GLOBAL]:pa},ferimentos:{},membrosInuteis:{},resistenciaFerimentos:{},
  ataquesBloqueadosTurnos:0,penalidadeAcoesFerimento:0,morto:morto||undefined,inconsciente:caiu&&!morto?true:undefined,incapacitado:caiu?true:undefined};
 if(!caiu){delete out.inconsciente;delete out.incapacitado;}
 if(!morto)delete out.morto;
 return out;
}
/** [atual, máximo] do PV (soma das partes quando ainda não foi colapsado) */
export function pvDe(cl){
 const hm=cl?.hitMax||{},ks=Object.keys(hm);if(!ks.length)return null;
 const max=ks.reduce((s,k)=>s+Math.max(0,Number(hm[k])||0),0);if(!(max>0))return null;
 return [Math.max(0,ks.reduce((s,k)=>s+Number(cl.hit?.[k]??hm[k]),0)),max];
}
/** [livre, máximo] de pontos psíquicos, ou null se a pessoa não tem poder psíquico */
export function psiDe(ator){
 const max=Number(ator?.psiMax);if(!(max>0))return null;
 return [Math.max(0,max-Math.max(0,Number(ator.psiSpent)||0)),max];
}
export const corDoPV=f=>f>.3?'#e0483a':'#b02418'; // vida sempre vermelha (escurece quando está baixa)

const CSS=`.vs-barras{position:absolute;left:22%;right:22%;bottom:2%;display:grid;gap:1px;pointer-events:none;z-index:12}
#novaSyncBoard [data-token]:has(>.vs-barras) .mv-pv{display:none!important} /* uma barra de vida só: a nova (PV+fadiga+psiquismo) junta, no lugar da antiga */
.vs-barras i{display:block;height:3px;border-radius:2px;background:rgba(0,0,0,.55);overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.6)}
.vs-barras i b{display:block;height:100%;width:100%;transition:width .35s}
.vs-barras i.fome b{background:#e8a23a}.vs-barras i.pv b{background:#e0483a}.vs-barras i.fad b{background:#4aa8ff}.vs-barras i.psi b{background:#b07cff}
.vs-barras[data-cansado] i.fad b{background:#7a8aa0}`;

export function instalarVidaSimples(dep){
 const root=dep.root||document,win=root.defaultView||window,D=p=>dep.doc(dep.db,...p.split('/'));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 let simples=true,saude=null,fadiga={},mapa=null,parar=[],assinado='',sujo=false,ultimaGrava=0;
 if(!root.getElementById('vsCssV200')){const st=root.createElement('style');st.id='vsCssV200';st.textContent=CSS;root.head.append(st);}
 const fad=id=>{const v=Number(fadiga[id]);return Number.isFinite(v)?Math.max(0,Math.min(FADIGA_MAX,v)):FADIGA_MAX;};
 const cansado=id=>fad(id)<LIMITE_CANSADO;
 async function definir(on){simples=!!on;await dep.setDoc(D(PATH.config),{simples:!!on,atualizadoEm:Date.now()},{merge:true});}
 // ---- fadiga: só o mestre escreve; todos leem
 function gastar(id,n){if(!id)return;fadiga={...fadiga,[id]:Math.max(0,fad(id)-n)};sujo=true;}
 async function gravar(){if(!sujo||!ehMestre())return;sujo=false;ultimaGrava=Date.now();try{await dep.setDoc(D(PATH.fadiga),{valores:fadiga,atualizadoEm:Date.now()});}catch(e){sujo=true;console.warn('[Vida simples] fadiga',e?.message||e);}}
 function aoEvento(ev){if(!simples||!ehMestre()||!ev?.id||!ev.source?.id||Date.now()-Number(ev.ts||0)>6000)return;if(ev.__vs===ev.id)return;ev.__vs=ev.id;gastar(String(ev.source.id),CUSTO_ATAQUE);}
 function recupera(){if(!ehMestre())return;let mexeu=false;const n={...fadiga};for(const [id,v] of Object.entries(n)){if(v<FADIGA_MAX){n[id]=Math.min(FADIGA_MAX,v+RECUPERA_5S);mexeu=true;}}if(mexeu){fadiga=n;sujo=true;}}
 // ---- barras nas miniaturas
 function pinta(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;
  if(!simples){b.querySelectorAll('.vs-barras').forEach(n=>n.remove());return;}
  const eu=uid(),mestre=ehMestre();
  for(const node of b.querySelectorAll('[data-token]')){
   const id=node.dataset.token,ator=saude?.actors?.[id],cl=ator?.combateLab;let box=node.querySelector(':scope>.vs-barras');
   const dono=(()=>{try{return String(dep.controller?.()?.token?.(id)?.donoUid||'');}catch(_){return '';}})();
   const selecionado=(()=>{try{const c=dep.controller?.(),t=c?.ator?.();return !!t&&String(t.id)===String(id)&&!!c.controla?.(t);}catch(_){return false;}})();
   const semSaude=!ator||!cl||!pvDe(cl);
   if(semSaude&&selecionado){ /* v205: o personagem em uso sempre mostra a fadiga (e a vida quando a ficha de saúde existir) */
    if(!box){box=root.createElement('div');box.className='vs-barras';box.innerHTML='<i class="pv"><b></b></i><i class="fad"><b></b></i><i class="psi"><b></b></i><i class="fome"><b></b></i>';node.append(box);}
    box.querySelector('.pv').style.display='none';box.querySelector('.psi').style.display='none';box.querySelector('.fome').style.display='none';box.querySelector('.fad b').style.width=Math.round(fad(id))+'%';box.toggleAttribute('data-cansado',cansado(id));box.title='Fadiga '+Math.round(fad(id))+'% (a vida aparece quando a ficha de saúde carregar)';continue;}
   if(!ator||!cl||!(mestre||(eu&&dono===eu))){box?.remove();continue;}
   const pv=pvDe(cl);if(!pv){box?.remove();continue;}
   box?.querySelector('.pv')&&(box.querySelector('.pv').style.display='');
   const psi=psiDe(ator);
   if(!box){box=root.createElement('div');box.className='vs-barras';box.innerHTML='<i class="pv"><b></b></i><i class="fad"><b></b></i><i class="psi"><b></b></i><i class="fome"><b></b></i>';node.append(box);}
   const f=pv[0]/pv[1];box.querySelector('.pv b').style.width=Math.round(Math.max(0,Math.min(1,f))*100)+'%';box.querySelector('.pv b').style.background=corDoPV(f);
   box.title='PV '+pv[0]+'/'+pv[1]+' · Fadiga '+Math.round(fad(id))+'%'+(psi?' · Psiquismo '+psi[0]+'/'+psi[1]:'');
   box.querySelector('.fad b').style.width=Math.round(fad(id))+'%';box.toggleAttribute('data-cansado',cansado(id));
   {const fo=win.mesaExploracaoV200?.saciedade?.(id),inf=box.querySelector('.fome');inf.style.display=fo===undefined||!win.mesaExploracaoV200?.dietaDe?.(dep.controller?.()?.token?.(id)||{id})?'none':'';if(fo!==undefined)inf.querySelector('b').style.width=Math.round(fo)+'%';box.title+=fo===undefined?'':' · Saciedade '+Math.round(fo)+'%';}
   const ip=box.querySelector('.psi');ip.style.display=psi?'':'none';if(psi)ip.querySelector('b').style.width=Math.round(psi[0]/psi[1]*100)+'%';
  }
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(PATH.config),s=>{const v=s.exists()?s.data()?.simples:undefined;simples=v===undefined?true:!!v;},()=>{}));
  parar.push(dep.onSnapshot(D(PATH.saude),s=>{saude=s.exists()?s.data():null;if(saude?.event)aoEvento(saude.event);},()=>{}));
  parar.push(dep.onSnapshot(D(PATH.fadiga),s=>{const v=s.exists()?s.data()?.valores:null;if(v&&!ehMestre())fadiga=v;else if(v&&!Object.keys(fadiga).length)fadiga=v;},()=>{}));
  parar.push(dep.onSnapshot(D(PATH.mapa),s=>{mapa=s.exists()?s.data():null;},()=>{}));
 }
 let c=0;const vigia=setInterval(()=>{try{if(!uid())return;const k=uid()+'|'+ehMestre();if(assinado!==k){assinado=k;assinar();}
  pinta();c++;if(c%7===0)recupera();if(sujo&&Date.now()-ultimaGrava>1800)void gravar();}catch(e){console.warn('[Vida simples]',e);}},700);
 const api={ativo:()=>simples,definir,colapsar:colapsarVida,fadiga:fad,cansado,gastar,velocidadeFator:id=>simples&&cansado(id)?.6:1,intervaloFator:id=>simples&&cansado(id)?1.5:1,parar:()=>{clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});}};
 win.mesaModoSimplesV200=api;return api;
}
