const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{const {H,page}=await preparar({viewport:{width:1280,height:800},removerFauna:true});
 console.log(JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&/^[+−\-]$|×/.test(b.textContent.trim())).map(b=>b.id+'|'+b.textContent.trim()+'|'+b.title))));
 await H.close();})();
