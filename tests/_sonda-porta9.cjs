const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{const {H,page}=await preparar({removerFauna:true});
 console.log(JSON.stringify(await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.filter(o=>(o.andarV144||1)===9&&o.bloqueiaMovimento&&Math.abs(o.x*80/28-53)<1.5&&Math.abs(o.y*50/14-29.5)<2.5).map(o=>[o.nome,+(o.x*80/28).toFixed(2),+(o.y*50/14).toFixed(2),o.larguraM,o.alturaM]))));await H.close();})();
