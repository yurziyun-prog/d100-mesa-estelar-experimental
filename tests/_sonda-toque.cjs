const {preparar}=require('./_mapa-reformado.cjs');const ajudas=require('./_ajudas-percurso.cjs');
(async()=>{const {H,page,id}=await preparar({viewport:{width:1280,height:800},removerFauna:true});const {pos}=ajudas(page,id,console.log);
 const tocar=async(x,y)=>{let a=null,n=0;const ler=()=>page.evaluate(({x,y})=>{const c=document.getElementById('moCamada')||document.getElementById('novaSyncBoard');const r=c.getBoundingClientRect();return {x:r.left+x/80*r.width,y:r.top+y/50*r.height,vw:innerWidth,vh:innerHeight};},{x,y});
  a=await ler();for(let k=0;k<40&&n<6;k++){await page.waitForTimeout(100);const b=await ler();n=Math.hypot(b.x-a.x,b.y-a.y)<.5?n+1:0;a=b;}
  console.log('alvo na tela',JSON.stringify(a));await page.mouse.click(a.x,a.y);};
 const p0=await pos();console.log('antes',JSON.stringify(p0));await tocar(38,25.5);
 for(let i=0;i<20;i++){await page.waitForTimeout(1000);const p=await pos();console.log(i,JSON.stringify(p));if(Math.hypot(p.x-38,p.y-25.5)<1)break;}
 await H.close();})();
