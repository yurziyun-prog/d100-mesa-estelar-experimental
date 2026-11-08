// Navegador real, bloqueador de pop-ups habilitado. Sem banco/autenticação.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',ignoreDefaultArgs:['--disable-popup-blocking']});
 try{
  const context=await browser.newContext(),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('https://atuar.test/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/modulo.js')return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(__dirname,'../js/mesa-atuar-aba.js'),'utf8')});
   if(url.searchParams.has('verComo'))return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Visão do personagem</title><p>Destino da aba de personagem</p>'});
   return route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><label>Atuar como <select id="novaSyncPersonagem"><option value="__mestre__">Mestre</option><option value="kael">Kael</option><option value="synccriatura%3Arastejante~900">Rastejante</option></select></label><script type="module">import {instalarAtuarAba} from '/modulo.js';window.mestre=true;window.api=instalarAtuarAba({ehMestre:()=>window.mestre});</script>`});
  });
  await page.goto('https://atuar.test/?campanha=1');await page.waitForFunction(()=>window.api);
  const select=page.locator('#novaSyncPersonagem');
  // Alteração automática não pode abrir aba, nem mesmo depois do polling.
  await select.selectOption('kael');await page.waitForTimeout(500);
  assert.equal(context.pages().length,1);
  await select.selectOption('__mestre__');
  await select.focus();
  const [popup]=await Promise.all([page.waitForEvent('popup'),page.keyboard.press('ArrowDown')]);
  await popup.waitForLoadState();assert.equal(new URL(popup.url()).searchParams.get('verComo'),'kael');
  await page.waitForFunction(()=>document.getElementById('novaSyncPersonagem').value==='__mestre__');
  assert.equal(new URL(page.url()).searchParams.get('campanha'),'1');await popup.close();
  // Bloqueio é reproduzido explicitamente: o link real deve continuar clicável.
  await page.waitForTimeout(1100);
  await page.evaluate(()=>{window.open=()=>null;});await select.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForSelector('#aaAviso');
  await page.waitForFunction(()=>document.getElementById('novaSyncPersonagem').value==='__mestre__');
  const link=page.locator('#aaAbrirVisao');assert.equal(await link.isVisible(),true);
  const href=await link.getAttribute('href');assert.ok(new URL(href).searchParams.has('verComo'));
  const [fallback]=await Promise.all([context.waitForEvent('page'),link.click()]);await fallback.waitForLoadState();
  assert.equal(fallback.url(),href);await fallback.close();
  // A aba de visão do personagem não pode gerar novas abas automaticamente.
  await page.evaluate(()=>{window.mestre=false;window.__calls=0;window.open=()=>{window.__calls++;return {};};});
  await select.focus();await page.keyboard.press('ArrowDown');await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>window.__calls),0);assert.equal(await link.isVisible(),false);
  assert.deepEqual(errors,[]);console.log('PASS gesto real abre aba, original volta a Mestre, bloqueio tem link funcional, mudanças automáticas/jogador não abrem abas');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
