const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{const {H,page}=await preparar({removerFauna:true});
 const r=await page.evaluate(()=>({salvar:typeof window.mesaRascunhoMapaV193.salvar,auto:window.mesaAutoSalvar,pend:window.mesaRascunhoMapaV193.pendentes}));console.log(JSON.stringify(r));await H.close();})();
