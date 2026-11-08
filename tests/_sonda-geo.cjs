const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page}=await preparar({removerFauna:true});await page.waitForTimeout(2500);
 for(let k=0;k<3;k++){
 console.log(JSON.stringify(await page.evaluate(()=>{const b=document.getElementById('novaSyncBoard'),cs=getComputedStyle(b),R=e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height].map(x=>Math.round(x*10)/10);};
  const w=b.querySelector('[data-world-layer]'),c=document.getElementById('moCamada'),t=b.querySelector('[data-token="jogador_teste_1"]');
  return {board:R(b),world:w&&R(w),camada:c&&R(c),tok:t&&R(t),pad:[cs.paddingLeft,cs.borderLeftWidth,cs.transform,cs.position,b.offsetLeft,b.offsetWidth,b.clientWidth,b.parentElement.scrollLeft,b.parentElement.id||b.parentElement.className]};})));
 await page.waitForTimeout(1500);}
 await H.close();
})();
