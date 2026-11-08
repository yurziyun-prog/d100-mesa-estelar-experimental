const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{const {H,page}=await preparar({removerFauna:true});
 await page.waitForTimeout(500);await H.close();})();
