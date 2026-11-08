const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{const {H,page}=await preparar({removerFauna:false});
 console.log(JSON.stringify(await page.evaluate(()=>[...window.__fs].filter(([p,v])=>/posicoes[/]synccriatura/.test(p)&&!v.habitatV205).map(([p,v])=>decodeURIComponent(p.split('/').pop())+'|'+v.nome))));
 await H.close();})();
