const path=require('path');const {preparar,root}=require('./_mapa-reformado.cjs');const aj=require('./_ajudas-percurso.cjs');
(async()=>{const {H,page,id}=await preparar({viewport:{width:1280,height:800},removerFauna:true});const {colocar}=aj(page,id);
 const p=process.env.PREFIXO||'depois';
 for(const [n,x,y] of (process.env.SPOTS?JSON.parse(process.env.SPOTS):[['pantano',48,41],['planalto',66,12],['ruinas',24,12],['campo',30,34],['lagoa',9,23],['caverna',60,26]])){await colocar(x,y);await page.waitForTimeout(1500);await page.screenshot({path:path.join(root,'docs','antes-depois','relevo-'+p+'-'+n+'.png')});}
 const tam=await page.evaluate(()=>JSON.stringify(window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena')).length);console.log('cena KB:',Math.round(tam/1024));
 await H.close();})();
