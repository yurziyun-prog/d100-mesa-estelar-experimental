const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page}=await preparar({removerFauna:false});
 await page.waitForTimeout(2500);
 const r=await page.evaluate(()=>{
  const out=[];const toks=[...document.querySelectorAll('#novaSyncBoard [data-token]')].slice(0,60);
  for(const n of toks){const id=decodeURIComponent(n.dataset.token);const cs=getComputedStyle(n),rb=n.getBoundingClientRect();
   const filhos=[...n.querySelectorAll('*')].map(e=>{const c=getComputedStyle(e);return e.tagName+'.'+(e.className||e.dataset.rotulo!==undefined?'rot':'')+' bg='+c.backgroundColor+' sh='+(c.boxShadow!=='none'?c.boxShadow.slice(0,40):'-')+' br='+c.borderRadius+' op='+c.opacity+' vis='+c.visibility;}).filter(x=>!/bg=rgba\(0, 0, 0, 0\) sh=- br=0px/.test(x)||true).slice(0,5);
   const pb=getComputedStyle(n,'::before'),pa=getComputedStyle(n,'::after');
   out.push({id:id.slice(0,38),w:Math.round(rb.width),h:Math.round(rb.height),bg:cs.backgroundColor,sh:cs.boxShadow==='none'?'-':cs.boxShadow.slice(0,40),flt:cs.filter.slice(0,30),before:pb.content+'|'+pb.backgroundColor,after:pa.content+'|'+pa.backgroundColor,filhos});}
  return out;});
 for(const x of r.slice(0,14))console.log(JSON.stringify(x));
 await page.screenshot({path:'docs/sonda-aura.png'});
 await H.close();
})();
