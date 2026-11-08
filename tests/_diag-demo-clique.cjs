// Probe enxuto: o clique-para-andar funciona no mapa v95 com a CSS da demo? (ciclo rápido de diagnóstico)
const path=require('path');
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas,abrirExport}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const M=mapas(['v95_residencia_ilu']);
 const extras=[];
 for(const d of abrirExport(path.resolve(__dirname,'..','arte-fonte/cidade-sem-nome/publicacao-firestore.json')))
  if(/^configuracoes\/objetoMapa_/.test(d.caminho))extras.push(d.dados);
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 page.on('console',m=>{if(/\[diag\]/.test(m.text()))console.log('[página]',m.text());});
 await carregarBancoDePecas(page);
 await page.evaluate(async({M,extras})=>{
  const A=window.__APP__;A.setMestre();
  const [ia,a3,bl,pk]=await Promise.all([import('/js/mesa-pecas-dados.js'),import('/js/mesa-pecas3d-dados.js'),import('/js/mesa-pecas-blender-dados.js'),import('/js/mesa-pecas.js')]);
  const lista=[...ia.PECAS,...a3.PECAS_3D,...bl.PECAS_BLENDER].map(p=>pk.modeloDaPeca(p,location.origin+'/'));
  A.setObjetos([...lista,...extras]);
  window.__fsWrite('mapas/v95_residencia_ilu',JSON.parse(JSON.stringify(M['v95_residencia_ilu'])));
  await window.recarregarBancoMapas_?.();
  window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/demo_kael',{nome:'Kael',imagem:'',donoUid:'mestre1',x:6.17,y:7.17,revision:0,facing:0,camada:3,mapaId:'v95_residencia_ilu',diametroM:2.2,visualV203:'p=#e6b98f;r=#1f2a3a;q=#3a3d44;d=#a8844a;c=#3a1f2a;e=#a8844a;h=curto;k=#3b2a1e;m=borda;a=#8a6a3a;o=normal;x=MS;z=EP;capa=1'});
  await window.abrirMapaBancoNaMesa_('v95_residencia_ilu');
 },{M,extras});
 await page.waitForSelector('#novaSyncBoard',{state:'attached',timeout:30000});
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}const l=document.getElementById('loginScreen');if(l)l.style.display='none';});
 await page.waitForFunction(()=>window.__APP__.ctl().token(encodeURIComponent('demo_kael'))&&String(window.__APP__.ctl().mapaAtual())==='v95_residencia_ilu',{timeout:30000});
 await page.evaluate(()=>{const sel=document.getElementById('novaSyncPersonagem');const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);sel.value=t.id;window.__APP__.ctl().refreshView();});
 await S(2000);
 await page.evaluate(()=>{try{window.mesaCameraV144?.inclinar?.(45);}catch(_){}});
 // CSS igual à da demo
 await page.evaluate(()=>{
  const css=document.createElement('style');css.textContent=`
   #appScreen>.user-header,#appScreen>h1,#appScreen>.tabs{display:none!important}
   #sincronizacao-nova .form-section>*:not(.nova-board-scroll){display:none!important}
   #mesaPaineisForaMapa{display:none!important}
   #labMapViewport{position:fixed!important;inset:0!important;z-index:12000!important;background:#0a0d14;padding:0!important}
   #camZoom,#camPan{display:none!important}
   *{cursor:none!important}`;
  document.head.append(css);
  setInterval(()=>{try{
   if(window.__demoMostraUI)return;
   const alvo='body button, body [role="button"], body select, body input, body aside, body details, body nav, body [data-mapa-painel]';
   for(const el of document.querySelectorAll(alvo)){
    if(el.closest('#novaSyncBoard,#demoSplash,#demoCapa,#labMapViewport'))continue;
    const cs=getComputedStyle(el);if(cs.display==='none')continue;
    if(!el.dataset.demoHide){el.dataset.demoHide='1';el.style.setProperty('display','none','important');}
   }
  }catch(_){}},400);
 });
 await S(1500);
 const alvo={x:20,y:7};
 for(let k=0;k<6;k++){
  const info=await page.evaluate(alvo=>{const b=document.getElementById('novaSyncBoard');if(!b)return null;const r=b.getBoundingClientRect();
   const px=r.left+alvo.x/28*r.width,py=r.top+alvo.y/14*r.height;
   const em=document.elementFromPoint(px,py);
   const t=window.__APP__.ctl().tokenVisual(encodeURIComponent('demo_kael'));
   console.log('[diag] board',Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height),'| pt',Math.round(px),Math.round(py),'| em',em?em.tagName+'#'+(em.id||'')+(em.className?'.'+String(em.className).split(' ')[0]:''):'null','| hero',t?t.x.toFixed(2)+','+t.y.toFixed(2):'null');
   return (em&&em.closest('#novaSyncBoard'))?{px,py}:null;},alvo);
  if(info){await page.mouse.click(info.px,info.py);console.log('[diag] clique',k,'em',Math.round(info.px),Math.round(info.py));}
  else console.log('[diag] clique',k,'BLOQUEADO (elementFromPoint fora do board)');
  await S(1600);
 }
 await H.close();
})().catch(e=>{console.error('FALHA:',e?.message||e);process.exit(1);});
