// v193: foto de item que não carrega vira a miniatura (usa o mesmo código do site, extraído de js/app/01-nucleo.js)
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const nuc=fs.readFileSync(path.join(__dirname,'../js/app/01-nucleo.js'),'utf8');
 const ini=nuc.indexOf('const miniAttr_='),fim=nuc.indexOf('\n',nuc.indexOf('const miniaturaOuCaixa_='));assert.ok(ini>0&&fim>ini);
 const trecho=nuc.slice(ini,fim);
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{const page=await browser.newPage(),erros=[];page.on('pageerror',e=>erros.push(e.message));
  await page.route('https://mesa.test/**',r=>{const u=new URL(r.request().url()).pathname;if(u.endsWith('.js'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(__dirname,'../js',u.slice(1)),'utf8')});if(u.includes('quebrada'))return r.fulfill({status:404,body:'nao'});return r.fulfill({contentType:'text/html',body:'<html><body></body></html>'});});
  await page.goto('https://mesa.test/');
  const r=await page.evaluate(async trecho=>{const {miniaturaDeItem}=await import('/mesa-itens-mini.js');window.miniaturaDeItem=miniaturaDeItem;
   const f=new Function('miniaturaDeItem',trecho+';return {miniAttr_,miniaturaOuCaixa_};')(miniaturaDeItem);
   const item={id:'kit_escalada',nome:'Kit de Escalada',imagem:'https://mesa.test/quebrada.png'};const nome='Kit de Escalada';
   document.body.innerHTML=`<div id="a"><img src="${item.imagem}" alt="${nome}"${f.miniAttr_(item)}></div><div id="b">${f.miniaturaOuCaixa_({id:'x',nome:'Coisa'},'x')}</div>`;
   await new Promise(r=>setTimeout(r,1200));const img=document.querySelector('#a img');return {src:img.src.slice(0,30),cls:img.className,ok:img.complete&&img.naturalWidth>0,b:document.querySelector('#b img')?.src.slice(0,20)};},trecho);
  assert.match(r.src,/^data:image\/svg\+xml/,JSON.stringify(r));assert.ok(r.ok,'a miniatura carregou');assert.match(r.cls,/item-mini/);assert.match(r.b,/^data:image/);assert.deepEqual(erros,[]);
  console.log('PASS foto quebrada vira miniatura; item sem foto mostra miniatura',r.src);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
