const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page}=await preparar({removerFauna:true});
 const r=await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.filter(o=>/Areia molhada|Praia/.test(o.nome||'')).map(o=>({nome:o.nome,camada:o.camada,tinta:o.tintaV205,tipo:o.erTipo,tex:o.erTex,ord:o.ordemOficina,w:o.larguraM})));
 console.log(JSON.stringify(r));
 await H.close();
})();
