// Diagnóstico 4: testar rotas A* em cidade_sem_nome com o RAIO REAL do herói,
// do ponto de entrada até a borda leste — achar caminho que a colisão contínua aceite.
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas}=require('./_mapas-remotos.cjs');
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
  const COL=await import('/js/nova-colisao.js?v=120');
  const mm=window.__fs.get('mapas/cidade_sem_nome_20261013'),W=Number(mm.larguraM)||56,H=Number(mm.alturaM)||56;
  const objs=(mm.mesaScene?.objects||[]).filter(o=>o&&o.bloqueiaMovimento&&!o.destruido);
  const hero={diametroM:2.2,visualV203:'x'};
  const raio=COL.raioParaObjetos(hero);
  const gr=TIA.montarGrade(objs.map(o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),W,H,{passo:W>40?1:.5,raio});
  const rota=(a,b)=>{const r=TIA.caminho(gr,{x:a.x*W/28,y:a.y*H/14},{x:b.x*W/28,y:b.y*H/14});return r?r.length:null;};
  const res={raio,cw:gr.cw,ch:gr.ch,testes:[]};
  // do ponto de entrada até a borda leste (x 24-27, y 1-13)
  const ini={x:3.9,y:7.4};
  for(let y=1;y<=13;y+=1.5){const t={x:26,y};const n=rota(ini,t);if(n)res.testes.push({ate:'26,'+y,n});}
  res.direto=res.testes.length?res.testes[0]:null;
  // se nada direto: waypoints intermediários
  if(!res.testes.length){
   for(let wx=10;wx<=24;wx+=2)for(let wy=1;wy<=13;wy+=2){
    const n1=rota(ini,{x:wx,y:wy});if(!n1)continue;
    const n2=rota({x:wx,y:wy},{x:26,y:7});if(n2){res.via={wp:wx+','+wy,n1,n2};return res;}}
  }
  return res;
 },M);
 console.log(JSON.stringify(out));
 await H.close();
})().catch(e=>{console.error('FALHA',e);process.exit(1);});
