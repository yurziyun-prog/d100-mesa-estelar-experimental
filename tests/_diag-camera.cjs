// Sondagem: por que a inclinação 45° não aparece no vídeo da demo?
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas}=require('./_mapas-remotos.cjs');
(async()=>{
 const M=mapas(['v145_praca_cidade_alta']);
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 page.on('console',m=>{const t=m.text();if(/Câmera|camera/i.test(t))console.log('[console]',t.slice(0,200));});
 await carregarBancoDePecas(page);
 const out=await page.evaluate(async M=>{
  window.__APP__.setMestre();
  window.__fsWrite('mapas/v145_praca_cidade_alta',JSON.parse(JSON.stringify(M['v145_praca_cidade_alta'])));
  await window.recarregarBancoMapas_?.();
  const POS_='combatesAtivos/mapaMesaSyncDireta/posicoes';
  window.__fsWrite(POS_+'/demo_kael',{nome:'Kael',imagem:'',donoUid:'mestre1',x:3.9,y:7.4,revision:0,facing:1.57,camada:3,mapaId:'v145_praca_cidade_alta',diametroM:2.2,visualV203:'p=#e6b98f;r=#1f2a3a;q=#3a3d44;d=#a8844a;c=#3a1f2a;e=#a8844a;h=curto;k=#3b2a1e;m=borda;a=#8a6a3a;o=normal;x=MS;z=EP;capa=1'});
  await window.abrirMapaBancoNaMesa_?.('v145_praca_cidade_alta');
  const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}
  const l=document.getElementById('loginScreen');if(l)l.style.display='none';
  await new Promise(r=>setTimeout(r,4000));
  const b=document.getElementById('novaSyncBoard');
  const r0={mod:!!window.mesaCameraMod,cam:!!window.mesaCameraV144,angulo:null,transform:'',rect:null,off:null,lsAngulo:localStorage.getItem('mesa:cameraAnguloV209'),lsZoom:localStorage.getItem('mesa:zoomMapa')};
  try{r0.angulo=window.mesaCameraV144?.angulo?.();}catch(e){r0.angulo='erro:'+e.message;}
  if(b){r0.transform=b.style.transform||'(vazio)';const r=b.getBoundingClientRect();r0.rect={w:Math.round(r.width),h:Math.round(r.height)};r0.off={w:b.offsetWidth,h:b.offsetHeight};}
  // tenta inclinar e vê se a transform muda
  try{window.mesaCameraV144?.inclinar?.(45);}catch(e){}
  await new Promise(r=>setTimeout(r,1200));
  if(b){r0.transformDepois=b.style.transform||'(vazio)';const r=b.getBoundingClientRect();r0.rectDepois={w:Math.round(r.width),h:Math.round(r.height)};}
  r0.anguloDepois=(()=>{try{return window.mesaCameraV144?.angulo?.();}catch(e){return 'erro';}})();
  return r0;
 },M);
 console.log(JSON.stringify(out,null,1));
 await page.screenshot({path:process.env.DEMO_DIR?process.env.DEMO_DIR+'/_diag-camera.png':'C:/Users/yurzi/Saved Games/projeto mapas/demo-viagem/_diag-camera.png'});
 await H.close();
})().catch(e=>{console.error('FALHA',e);process.exit(1);});
