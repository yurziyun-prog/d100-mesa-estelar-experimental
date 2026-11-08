// Mede o custo do draw() no mapa pesado (cidade sem nome, 279 objetos).
const path=require('path');
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas,abrirExport}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const M=mapas(['cidade_sem_nome_20261013']);
 const extras=[];
 for(const arq of ['arte-fonte/cidade-sem-nome/publicacao-firestore.json']){
  for(const d of abrirExport(path.resolve(__dirname,'..',arq)))
   if(/^configuracoes\/objetoMapa_/.test(d.caminho))extras.push(d.dados);
 }
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
 await S(3000);
 const r=await page.evaluate(()=>{
  const ctl=window.__APP__.ctl();
  const nObj=document.querySelectorAll('#novaSyncBoard [data-scene-object]').length;
  const nTok=document.querySelectorAll('#novaSyncBoard [data-token]').length;
  let tDraw=0;
  try{const t0=performance.now();for(let i=0;i<5;i++)ctl.refreshView();tDraw=(performance.now()-t0)/5;}catch(e){}
  return {nObj,nTok,tDraw:Math.round(tDraw*10)/10};
 });
 console.log('[medir] objetos de cena:',r.nObj,'tokens:',r.nTok,'custo refreshView/draw:',r.tDraw,'ms');
 await H.close();
})().catch(e=>{console.error('FALHA:',e);process.exit(1);});
