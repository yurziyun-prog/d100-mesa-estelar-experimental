// Diagnóstico 3: por que o herói trava em (11.8,7.6) em cidade_sem_nome indo para a porta leste?
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const M=mapas(['cidade_sem_nome_20261013']);
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 await carregarBancoDePecas(page);
 const out=await page.evaluate(async M=>{
  window.__APP__.setMestre();
  window.__fsWrite('mapas/cidade_sem_nome_20261013',JSON.parse(JSON.stringify(M['cidade_sem_nome_20261013'])));
  await window.recarregarBancoMapas_?.();
  const TIA=await import('/js/mesa-tempo-real-ia.js?v=133');
  const mm=window.__fs.get('mapas/cidade_sem_nome_20261013'),W=Number(mm.larguraM)||56,H=Number(mm.alturaM)||56;
  const objs=(mm.mesaScene?.objects||[]).filter(o=>o&&o.bloqueiaMovimento&&!o.destruido);
  const gr=TIA.montarGrade(objs.map(o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),W,H,{passo:W>40?1:.5,raio:.88});
  const ini={x:11.8*W/28,y:7.6*H/14},fim={x:26.3*W/28,y:7*H/14};
  const ci=Math.floor(ini.x/gr.passo),cj=Math.floor(ini.y/gr.passo),cif=Math.floor(fim.x/gr.passo),cjf=Math.floor(fim.y/gr.passo);
  const livre=(i,j)=>i>=0&&j>=0&&i<gr.cw&&j<gr.ch&&!gr.g[j*gr.cw+i];
  const viz=(i,j)=>{for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)if(livre(i+di,j+dj))return true;return false;};
  // acha vizinho livre mais próximo (o A* do jogo faz isso?)
  const rota=TIA.caminho(gr,ini,fim);
  return {cw:gr.cw,ch:gr.ch,passo:gr.passo,objsBloq:objs.length,
   iniLivre:livre(ci,cj),iniVizinhoLivre:viz(ci,cj),fimLivre:livre(cif,cjf),fimVizinhoLivro:viz(cif,cjf),
   rota:rota?rota.length:null,rotaNull:!rota};
 },M);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FALHA',e);process.exit(1);});
