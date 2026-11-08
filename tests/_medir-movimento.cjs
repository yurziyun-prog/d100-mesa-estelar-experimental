// Mede a movimentação do jogador no mapa de teste: m/s, saltos entre amostras, mudanças de direção. [harness local]
const {preparar}=require('./_mapa-reformado.cjs');const ajudas=require('./_ajudas-percurso.cjs');
(async()=>{
 const {H,page,id}=await preparar({removerFauna:true});const A=ajudas(page,id);await A.mestreProcessa(2500);await A.colocar(48,36);await page.waitForTimeout(1500);
 for(const [tecla,seg] of [['d',4000],['s',3000],['a',3000]]){
  const amostras=[];await page.keyboard.down(tecla);const t0=Date.now();
  while(Date.now()-t0<seg){await page.waitForTimeout(100);const p=await A.pos();amostras.push({t:Date.now()-t0,x:p.x,y:p.y});}
  await page.keyboard.up(tecla);await page.waitForTimeout(500);
  const d=amostras.slice(1).map((a,i)=>({dt:a.t-amostras[i].t,dx:+(a.x-amostras[i].x).toFixed(2),dy:+(a.y-amostras[i].y).toFixed(2)}));
  const dist=Math.hypot(amostras.at(-1).x-amostras[0].x,amostras.at(-1).y-amostras[0].y);
  const saltos=d.filter(s=>Math.hypot(s.dx,s.dy)>1.2),parados=d.filter(s=>Math.hypot(s.dx,s.dy)<.01).length;
  console.log(tecla,'dist',dist.toFixed(1),'m em',seg/1000,'s =',(dist/(seg/1000)).toFixed(2),'m/s; amostras',d.length,'paradas',parados,'saltos>1.2m',saltos.length,JSON.stringify(saltos.slice(0,4)));
  console.log('   passos:',d.slice(0,14).map(s=>s.dx+','+s.dy).join(' | '));
 }
 await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
