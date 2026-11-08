// Fotos de um trecho: MODO=antes (sombras/luz desligadas e contorno velho não se recupera: só o módulo) ou MODO=depois. [harness local]
const path=require('path');const {preparar,root}=require('./_mapa-reformado.cjs');const aj=require('./_ajudas-percurso.cjs');
(async()=>{const modo=process.env.MODO||'depois';const {H,page,id}=await preparar({viewport:{width:1280,height:800},removerFauna:true});const {colocar}=aj(page,id);
 if(modo==='antes')await page.evaluate(()=>window.mesaSombrasLuzV205?.parar?.());
 for(const [n,x,y] of [['casa',31,28],['ruinas',24,12],['cordilheira',66,12]]){await colocar(x,y);await page.waitForTimeout(2200);await page.screenshot({path:path.join(root,'docs','antes-depois','trecho-'+modo+'-'+n+'.png')});}
 await H.close();})();
