const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page,r}=await preparar({removerFauna:true});
 console.log('reforma:',JSON.stringify(r));
 console.log(JSON.stringify(await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena'),os=c.objects||[];const por={};for(const o of os){const a=o.andarV144||1;por[a]=(por[a]||0)+1;}
  const f=o=>({nome:o.nome,tipo:o.erTipo,x:+(o.x*80/28).toFixed(1),y:+(o.y*50/14).toFixed(1),w:o.larguraM,h:o.alturaM,and:o.andarV144,liga:o.ligaAndaresV205,elev:o.elevacaoAndarV205});
  return {total:os.length,porAndar:por,elev:os.filter(o=>o.elevacaoAndarV205!==undefined).length,liga:os.filter(o=>o.ligaAndaresV205).map(f),tetos:os.filter(o=>o.erTipo==='telhado').map(f),sub:os.filter(o=>(o.andarV144||1)===9).slice(0,12).map(f)};})));
 await H.close();
})();
