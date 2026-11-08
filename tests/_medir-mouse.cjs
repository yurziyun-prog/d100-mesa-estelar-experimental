// Segura o botão do mouse sobre a miniatura e arrasta para vários lados; registra animação (acao/quadro) e giro. [harness local]
const {preparar}=require('./_mapa-reformado.cjs');const ajudas=require('./_ajudas-percurso.cjs');
(async()=>{
 const {H,page,id}=await preparar({removerFauna:true});const A=ajudas(page,id);await A.mestreProcessa(2500);await A.colocar(48,38);await page.waitForTimeout(1500);
 const info=()=>page.evaluate(()=>{const n=document.querySelector('#novaSyncBoard [data-token="jogador_teste_1"]');const a=n?.querySelector('.a3d');const r=n.getBoundingClientRect();return {cx:r.left+r.width/2,cy:r.top+r.height/2,acao:a?.dataset.acao,quadro:a?.dataset.quadro,rot:a?.style.rotate,esc:a?.style.scale};});
 await page.evaluate(ms=>{window.__ATRASO_MS=ms;},Number(process.env.ATRASO||0));let i0=await info();console.log('inicio',JSON.stringify(i0));
 await page.mouse.move(i0.cx+120,i0.cy+10);await page.mouse.down();
 for(const [dx,dy] of [[200,0],[200,200],[-200,200],[-200,-200]]){
  await page.mouse.move(i0.cx+120+dx,i0.cy+10+dy,{steps:8});
  const amostras=[];for(let k=0;k<10;k++){await page.waitForTimeout(150);const p=await A.pos(),a=await info();amostras.push(p.x+','+p.y+' '+a.acao+'#'+a.quadro+' '+a.rot);}
  console.log('alvo',dx,dy,'\n  '+amostras.join('\n  '));
 }
 await page.mouse.up();await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
