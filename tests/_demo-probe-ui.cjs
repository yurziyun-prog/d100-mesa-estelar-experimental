// Sonda: lista os elementos visíveis nos cantos da tela da mesa (para caçar UI que vaza na demo).
const path=require('path');
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
(async()=>{
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 await carregarBancoDePecas(page);
 await page.evaluate(async()=>{
  const A=window.__APP__;A.setMestre();
  await window.abrirMapaBancoNaMesa_?.('demo_palacio');
  const p=document.getElementById('sincronizacao-nova');p.classList.add('active');
  for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}
  const l=document.getElementById('loginScreen');if(l)l.style.display='none';
 });
 await page.waitForSelector('#novaSyncBoard',{timeout:30000});
 await page.waitForTimeout(2500);
 const achados=await page.evaluate(()=>{
  const W=innerWidth,H=innerHeight,fora=[];
  const zonas={infDir:[W-140,H-140,W,H],infEsq:[0,H-140,300,H],supDir:[W-300,0,W,160],supEsq:[0,0,300,160]};
  for(const el of document.querySelectorAll('body *')){
   const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;
   const r=el.getBoundingClientRect();if(r.width<6||r.height<6||r.width>W||r.height>H)continue;
   const cx=r.left+r.width/2,cy=r.top+r.height/2;
   for(const [nome,[x0,y0,x1,y1]] of Object.entries(zonas)){
    if(cx>=x0&&cx<=x1&&cy>=y0&&cy<=y1){
     const alvo=el.children.length<3?el:(el.children.length<=1?el:el);
     fora.push({zona:nome,tag:alvo.tagName,id:alvo.id,cls:String(alvo.className).slice(0,60),pos:cs.position,txt:(alvo.textContent||'').trim().slice(0,40),r:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}});
     break;}
   }}
  return fora.slice(0,60);
 });
 console.log(JSON.stringify(achados,null,1));
 await H.close();
})().catch(e=>{console.error('FALHA:',e.message);process.exit(1);});
