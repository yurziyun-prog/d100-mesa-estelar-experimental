// v193: editar o mapa é rascunho; só grava ao salvar (nada de "salvando…" sem fim)
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{const page=await browser.newPage(),erros=[];page.on('pageerror',e=>erros.push(e.message));
  await page.route('https://mesa.test/**',r=>{const u=new URL(r.request().url()).pathname;if(u.endsWith('.js')){const f=path.join(__dirname,'../js',u.slice(1));return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(f,'utf8')});}
   return r.fulfill({contentType:'text/html',body:'<html><body><div id="novaSyncBoard" style="width:600px;height:300px"></div><div id="novaSyncEditorTools"></div></body></html>'});});
  await page.goto('https://mesa.test/');
  const r=await page.evaluate(async()=>{
   const {criarEditorMesa}=await import('/nova-editor.js');
   const gravado=[];let mudou=0,auto=0;
   const cena={mapId:'m1',objects:[{id:'a',x:1,y:1,nome:'A'}]};
   const database={transact:async fn=>fn({get:async p=>p==='scene'?cena:p==='map'?{mapId:'m1'}:null,set:(p,v)=>{gravado.push([p,v]);}})};
   const ed=criarEditorMesa({board:document.getElementById('novaSyncBoard'),root:document,database,scenePath:'scene',mapPath:'map',positionPath:'pos',enabled:()=>true,map:()=>({mapId:'m1',larguraM:28,alturaM:14}),scene:()=>cena,fail:e=>{window.__erro=String(e?.message||e)},changed:()=>{mudou++;},archivePath:id=>'arq/'+id});
   const R=ed.rascunho;const ini={pend:R.pendentes,n:R.objetosAtuais().length};
   R.empurrar([{kind:'add',object:{id:'b',x:2,y:2,nome:'B'}},{kind:'properties',id:'a',properties:{x:5}},{kind:'remove',id:'zz'}]);
   const depois={pend:R.pendentes,ids:R.objetosAtuais().map(o=>o.id),ax:R.objetosAtuais().find(o=>o.id==='a').x,gravouAntes:gravado.length,aviso:document.getElementById('novaEditNotice').textContent};
   await new Promise(r=>setTimeout(r,2200));const semAuto={gravou:gravado.length};
   await R.salvar();await new Promise(r=>setTimeout(r,100));
   const salvo=gravado.find(g=>g[0]==='scene');
   return {ini,depois,semAuto,gravouDepois:gravado.length,ids:(salvo?.[1]?.objects||[]).map(o=>o.id),ax:(salvo?.[1]?.objects||[]).find(o=>o.id==='a')?.x,pendFim:R.pendentes,erro:window.__erro||''};
  });
  assert.deepEqual(r.ini,{pend:0,n:1});assert.equal(r.depois.pend,3);assert.deepEqual(r.depois.ids,['a','b']);assert.equal(r.depois.ax,5);assert.equal(r.depois.gravouAntes,0,'rascunho não grava');assert.match(r.depois.aviso,/ainda não salvas/);
  assert.equal(r.semAuto.gravou,0,'sem salvar sozinho depois de 2 s');assert.ok(r.gravouDepois>=1,'salvar grava');assert.deepEqual(r.ids,['a','b']);assert.equal(r.ax,5);assert.equal(r.pendFim,0);assert.equal(r.erro,'');assert.deepEqual(erros,[]);
  console.log('PASS rascunho do mapa: edita sem gravar, não salva sozinho, grava só ao clicar em Salvar');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
