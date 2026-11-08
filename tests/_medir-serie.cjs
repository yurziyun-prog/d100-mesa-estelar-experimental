// Amostra a posição do token a cada 60 ms durante 8 s de caminhada para ver a forma do movimento.
const path=require('path');
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas,abrirExport}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const M=mapas(['cidade_sem_nome_20261013']);
 const extras=[];
 for(const d of abrirExport(path.resolve(__dirname,'..','arte-fonte/cidade-sem-nome/publicacao-firestore.json')))
  if(/^configuracoes\/objetoMapa_/.test(d.caminho))extras.push(d.dados);
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 await carregarBancoDePecas(page);
 await page.evaluate(()=>{
  const css=document.createElement('style');
  css.textContent=`#sincronizacao-nova{position:fixed!important;inset:0!important;z-index:12000!important;background:#0a0d14}
#sincronizacao-nova .form-section{padding:0!important;margin:0!important;height:100%!important;overflow:hidden!important}
.nova-board-scroll{position:absolute!important;inset:0!important;overflow:hidden!important;padding:0!important}`;
  document.head.append(css);
 });
 await page.evaluate(async({M,extras})=>{
  const A=window.__APP__;A.setMestre();
  const [ia,a3,bl,pk]=await Promise.all([import('/js/mesa-pecas-dados.js'),import('/js/mesa-pecas3d-dados.js'),import('/js/mesa-pecas-blender-dados.js'),import('/js/mesa-pecas.js')]);
  const lista=[...ia.PECAS,...a3.PECAS_3D,...bl.PECAS_BLENDER].map(p=>pk.modeloDaPeca(p,location.origin+'/'));
  A.setObjetos([...lista,...extras]);
  window.__fsWrite('mapas/cidade_sem_nome_20261013',JSON.parse(JSON.stringify(M['cidade_sem_nome_20261013'])));
  await window.recarregarBancoMapas_?.();
  window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/demo_kael',{nome:'Kael',imagem:'',donoUid:'mestre1',x:14,y:7,revision:0,facing:0,camada:3,mapaId:'cidade_sem_nome_20261013',diametroM:2.2,visualV203:'p=#e6b98f;r=#1f2a3a;q=#3a3d44;d=#a8844a;c=#3a1f2a;e=#a8844a;h=curto;k=#3b2a1e;m=borda;a=#8a6a3a;o=normal;x=MS;z=EP;capa=1'});
  window.__fsWrite('combatesAtivos/mesaSessaoV206',{auto:{em:'2099-01-01'}});
  await window.abrirMapaBancoNaMesa_('cidade_sem_nome_20261013');
 },{M,extras});
 await page.waitForSelector('#novaSyncBoard',{state:'attached',timeout:30000});
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}const l=document.getElementById('loginScreen');if(l)l.style.display='none';});
 await page.waitForFunction(()=>window.__APP__.ctl().token('demo_kael')&&String(window.__APP__.ctl().mapaAtual())==='cidade_sem_nome_20261013',{timeout:30000});
 await page.evaluate(()=>{const sel=document.getElementById('novaSyncPersonagem');const t=window.__APP__.ctl().token('demo_kael');const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);sel.value=t.id;window.__APP__.ctl().refreshView();});
 await S(2500);
 // clica no chão e amostra a cada 60 ms
 const alvo={x:19,y:9.5};
 const clique=await page.evaluate(alvo=>{const b=document.getElementById('novaSyncBoard'),r=b.getBoundingClientRect();return {px:r.left+alvo.x/28*r.width,py:r.top+alvo.y/14*r.height};},alvo);
 const serie=await page.evaluate(async({px,py})=>{
  const amostras=[];
  document.elementFromPoint(px,py); // warm
  const evt=(t,x,y)=>{const e=new PointerEvent(t,{clientX:x,clientY:y,button:0,bubbles:true,pointerId:1,isPrimary:true});return e;};
  // usa dispatchEvent pois page.mouse.click seria fora deste evaluate; simula pointerdown/up no board
  const alvoEl=document.elementFromPoint(px,py);
  alvoEl.dispatchEvent(evt('pointerdown',px,py));
  alvoEl.dispatchEvent(evt('pointerup',px,py));
  const t0=performance.now();
  while(performance.now()-t0<8000){
   const t=window.__APP__.ctl().tokenVisual('demo_kael');
   if(t)amostras.push([Math.round(performance.now()-t0),+t.x.toFixed(3),+t.y.toFixed(3)]);
   await new Promise(r=>setTimeout(r,60));
  }
  return amostras;
 },clique);
 // distância percorrida total
 let percorrido=0;for(let i=1;i<serie.length;i++)percorrido+=Math.hypot((serie[i][1]-serie[i-1][1])*2,(serie[i][2]-serie[i-1][2])*2);
 const ini=serie[0],fim=serie.at(-1);
 console.log('[serie] amostras:',serie.length,'percorrido:',percorrido.toFixed(2),'m em',(fim[0]-ini[0])/1000,'s →',(percorrido/((fim[0]-ini[0])/1000)).toFixed(2),'m/s médio');
 console.log('[serie] primeiras 10:',JSON.stringify(serie.slice(0,10)));
 console.log('[serie] últimas 8:',JSON.stringify(serie.slice(-8)));
 await H.close();
})().catch(e=>{console.error('FALHA:',e);process.exit(1);});
