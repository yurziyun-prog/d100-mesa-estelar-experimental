// Regra de interface: painéis permanentes nunca ocupam a área jogável.
// Balões temporários fecháveis/recolhíveis e janelas arrastáveis são exceções.
export function acomodarPainelMapa(root,painel){
 const board=root.getElementById('novaSyncBoard');if(!board||!painel)return false;
 let dock=root.getElementById('mesaPaineisForaMapa');
 if(!dock){dock=root.createElement('div');dock.id='mesaPaineisForaMapa';dock.dataset.mapaPaineis='permanentes';board.parentElement.after(dock);
  const style=root.createElement('style');style.textContent=`#mesaPaineisForaMapa{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;max-width:100%;min-width:0;margin:8px 0}#mesaPaineisForaMapa>*{position:static!important;inset:auto!important;transform:none!important;translate:none!important;max-width:100%!important;box-sizing:border-box;min-width:0;flex-wrap:wrap;white-space:normal!important}#mesaPaineisForaMapa #rtModos{margin:0}#mesaPaineisForaMapa #maLegenda{pointer-events:auto}`;root.head.append(style);
 }
 if(!painel.closest('.mb-faixa')&&painel.parentElement!==dock)dock.append(painel);
 painel.dataset.mapaPainel='permanente-fora';return true;
}
const instalados=new WeakMap();
/** Salvaguarda: módulos novos podem declarar data-mapa-painel="permanente".
 * O observador também recolhe barras antigas se algum módulo as reinserir no mapa.
 * Não interfere em balões temporários, janelas arrastáveis ou efeitos do cenário.
 */
export function instalarRegraPaineisMapa(root=document){
 if(instalados.has(root))return instalados.get(root);
 let agendado=false;
 const mover=()=>{agendado=false;if(!root.getElementById('novaSyncBoard'))return;
  for(const el of root.querySelectorAll('#rtModos,#maLegenda,#rtBarra,#rtConsciencia,#psBarra,#trSaltar,[data-mapa-painel="permanente"]'))acomodarPainelMapa(root,el);
 };
 const obs=new (root.defaultView||window).MutationObserver(()=>{if(agendado)return;agendado=true;queueMicrotask(mover);});
 obs.observe(root.body,{childList:true,subtree:true});mover();
 const api={verificar:mover,parar:()=>{obs.disconnect();instalados.delete(root);}};instalados.set(root,api);return api;
}
