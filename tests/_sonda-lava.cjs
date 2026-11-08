const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page}=await preparar({removerFauna:true});
 console.log(JSON.stringify(await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c.objects||[]).filter(o=>/lava/i.test(String(o.erPoca||'')+(o.nome||''))).map(o=>({nome:o.nome,keys:Object.keys(o).join(','),x:+(o.x*80/28).toFixed(1),y:+(o.y*50/14).toFixed(1),w:o.larguraM,h:o.alturaM,erPoca:o.erPoca,pontos:o.pocaPontosV198?.length,rects:(o.rectsV201||[]).length,r0:JSON.stringify((o.rectsV201||[]).slice(0,3)),lacos:(o.lacosV201||[]).length,l0:JSON.stringify((o.lacosV201||[]).slice(0,1)).slice(0,200),bl:(o.blocosV201||[]).length}));})).slice(0,2500));
 await H.close();
})();
