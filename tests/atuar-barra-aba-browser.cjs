// Entrada REAL da barra: botão Atuar como → clique na miniatura.
// App montado + banco falso. O destino é interceptado: não valida login da aba filha.
const assert=require('node:assert/strict');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const D=await montarDuelo({criatura:null});const {H,page,cid}=D;
 try{
  await page.context().route('https://mesa.test/?verComo=*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Personagem</title><p>Aba de visão do personagem</p>'}));
  await page.evaluate(async()=>{
   const ctl=window.__APP__.ctl();ctl.close();await ctl.open();
   const panel=document.getElementById('sincronizacao-nova');panel.classList.add('active');
   for(let n=panel;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}
   const s=document.getElementById('novaSyncPersonagem');s.value='__mestre__';s.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForSelector('#mbBarra [data-a="atuar"]');
  assert.equal(await page.locator('#novaSyncPersonagem').isVisible(),false,'o seletor legado está oculto: este é o caminho antes ignorado');
  await page.click('#mbBarra [data-a="atuar"]');
  const token=page.locator('[data-token="'+cid+'"]');await token.scrollIntoViewIfNeeded();
  const [popup]=await Promise.all([page.waitForEvent('popup'),token.click()]);await popup.waitForLoadState();
  assert.equal(decodeURIComponent(new URL(popup.url()).searchParams.get('verComo')),cid);
  await page.waitForFunction(()=>document.getElementById('novaSyncPersonagem').value==='__mestre__');
  await page.waitForSelector('#mbBarra #aaAbrirVisao');
  assert.equal(await page.locator('#aaAbrirVisao').isVisible(),true,'recuperação visível na barra, não no seletor oculto');
  assert.equal(await page.locator('#novaSyncBoard').evaluate(n=>n.classList.contains('mb-escolhendo')),false);
  await popup.close();
  console.log('PASS barra real: clique na miniatura abre aba; mestre preservado; link de recuperação visível [banco falso, destino interceptado]');
 }finally{await H.close();}
})().catch(e=>{console.error(e);process.exit(1);});
