// Mesa Estelar v159 — Menus fora do mapa.
//
// Os botões fixos da mesa (Interativos, Soltar item, Mapa geral, Companheiros, som, Cenário, posturas, relógio,
// carteira, ferramentas do mestre, zoom, atalhos…) ficavam por cima do mapa e atrapalhavam o jogo. Aqui eles vão
// para duas faixas FORA do mapa: uma em cima e outra embaixo. Dentro do mapa só aparece o que surge ao clicar em
// algo (menu de ações, balões, conversa) ou o que é do lugar (ex.: "Falar com Denzel" perto dele).
// As faixas têm altura fixa: botão que aparece ou some não empurra o mapa. Módulo à parte: se falhar, tudo
// continua como antes, por cima do mapa.

// Em que faixa (e em que ordem) fica cada botão, pelo id que o módulo dono dá a ele.
export const LUGARES={
 'topo-esq':['moTodos','moSoltar','mlGeral','cpBotao','nvBotao','mlInter','ljBotao','mkBotao','amBotao','o3Botao','vgBotao','rtBotao'],
 'topo-dir':['efSom','mcBotao'],
 'base-esq':['psBarra','rlChip','rlNoite','ntSilencio','vkCarteira','vkMestre','lzBotao','rtMissoes','rtAutoChip'],
 'base-dir':['mlSetas','camPan','camZoom','maLegenda']
};
export const lugarDe=id=>Object.keys(LUGARES).find(k=>LUGARES[k].includes(id))||null;

const ESTILO=`
.mb-faixa{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:40px;padding:4px 0;box-sizing:border-box}
.mb-faixa .mb-g{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0}
.mb-faixa .mb-g>*{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;margin:0!important;z-index:5!important;flex:0 0 auto}
.mb-faixa #camZoom{flex-direction:row!important;padding:2px!important}
.mb-faixa #camZoom button{width:30px!important;height:28px!important}
.mb-faixa #mlSetas{transform:scale(.8)!important;transform-origin:center}
.mb-faixa #psBarra{flex-direction:row!important}
.mb-faixa #maLegenda{opacity:.75}
/* nomes das miniaturas não crescem com a ampliação do mapa */
#novaSyncBoard [data-token]>span:not([data-facing-handle]):not([data-state-symbol]){transform:translateX(-50%) scale(var(--mz-inv,1))!important;transform-origin:50% 0}
`;

export function instalarBarras(dep={}){
 const root=dep.root||document,win=root.defaultView||window;
 const el=id=>root.getElementById(id);
 if(!el('mbCss')){const st=root.createElement('style');st.id='mbCss';st.textContent=ESTILO;root.head.append(st);}
 function faixa(id,antesDe){
  let f=el(id);const b=el('novaSyncBoard'),sc=b?.parentElement,pai=sc?.parentElement;if(!pai)return null;
  if(!f){f=root.createElement('div');f.id=id;f.className='mb-faixa';f.innerHTML='<div class="mb-g" data-g="esq"></div><div class="mb-g" data-g="dir"></div>';
   f.addEventListener('pointerdown',e=>e.stopPropagation());}
  if(antesDe?f.nextElementSibling!==sc:f.previousElementSibling!==sc){if(antesDe)pai.insertBefore(f,sc);else sc.after(f);}
  return f;
 }
 function grupo(lugar){const [qual,lado]=lugar.split('-');const f=faixa(qual==='topo'?'mbTopo':'mbBase',qual==='topo');return f?.querySelector(`[data-g="${lado}"]`)||null;}
 function arrumar(){
  const b=el('novaSyncBoard');if(!b?.parentElement)return;
  for(const [lugar,ids] of Object.entries(LUGARES)){
   const g=grupo(lugar);if(!g)continue;
   for(const id of ids){const n=el(id);if(!n)continue;
    if(n.parentElement!==g)g.append(n);
    // ordem fixa dentro da faixa
    const atras=ids.slice(0,ids.indexOf(id)).map(el).filter(x=>x&&x.parentElement===g).pop();
    if(atras&&atras.nextElementSibling!==n)atras.after(n);else if(!atras&&g.firstElementChild!==n)g.prepend(n);}
  }
 }
 let pendente=false;const agendar=()=>{if(pendente)return;pendente=true;win.requestAnimationFrame(()=>{pendente=false;try{arrumar();}catch(e){console.warn('[Barras]',e);}});};
 // observa o mapa e a moldura: botão novo vai para a faixa no mesmo quadro (sem piscar por cima do mapa)
 let obs=null,alvo=null;
 const vigia=setInterval(()=>{const b=el('novaSyncBoard'),sc=b?.parentElement;if(sc&&sc!==alvo){obs?.disconnect();alvo=sc;obs=new win.MutationObserver(agendar);obs.observe(sc,{childList:true});obs.observe(b,{childList:true});}agendar();},700);
 agendar();
 win.mesaBarrasV159={arrumar,LUGARES};
 return {parar(){clearInterval(vigia);obs?.disconnect();}};
}
