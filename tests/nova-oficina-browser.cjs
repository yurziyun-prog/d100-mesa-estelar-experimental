const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
 const page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[];page.on('pageerror',e=>(errors.push(e.message),console.error('PAGE:',e.message)));
 await page.route('https://oficina.test/**',route=>{const name=new URL(route.request().url()).pathname.slice(1);if(name.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(__dirname,'../js',name),'utf8')});return route.fulfill({contentType:'text/html; charset=utf-8',body:'<html><head></head><body style="background:#191c32;color:white;font-family:Arial"><div><div class="gm-subtabs"><button>Oficina de Mapas</button></div><div id="gm-sub-oficina-mapas"></div></div><details open><summary>Editar mapa · Oficina 2</summary><div id="host"></div></details>'+fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').split('<div id="novaSyncStatus"')[1].split('<!-- ABA BATALHA COMPARTILHADA')[0].replace(/^/, '<div id="novaSyncStatus"')+'</body></html>'});});await page.goto('https://oficina.test/');
 let app=require('../scripts/montar.cjs').montarApp(path.join(__dirname,'..'));const start=app.lastIndexOf('(function(){',app.indexOf("let gm2MesaBridge_=null"));const end=app.indexOf('})();',app.indexOf('window.gm2render=gm2render;',start))+5;
 await page.addScriptTag({type:'module',content:`import {estadoOficinaMesa,prepararPublicacaoOficina,compactarPublicacaoOficina,hidratarReferenciasOficina,publicarOficina,mapaComCenaOficina,validarTamanhoOficina} from '/nova-oficina.js';const objetosMapaDB=[],mapasDB=[],itensDB=[],criaturasDB=[],npcsDB=[];let labRender_=()=>{};const labEstado_={};const batalhaEhMestre_=()=>true;const getNome=o=>o.nome;const notificar_=(s)=>window.notice=s;const mostrarSubAbaMestre=()=>{};class RPGTextureGenerator {constructor(){this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');}}\n`+app.slice(start,end)});
 await page.waitForFunction(()=>window.novaOficinaMesa_);
 await page.evaluate(async()=>{
  const map={id:'map',nome:'Teste',larguraM:28,alturaM:14,oficina2State:{w:28,h:14,ppm:32,bg:'#777777',grid:'#555555',showGrid:true,texture:'nenhuma',elements:[]}};
  const mp='combatesAtivos/mapaMesaSyncDireta',sp='combatesAtivos/mapaMesaSyncDiretaCena';window.store=new Map([[mp,{mapId:'map',larguraM:28,alturaM:14}],[sp,{mapId:'map',objects:[],objetosMapaImportados:true}],['mapas/map',map]]);const listeners=[];
  const db={get:async p=>structuredClone(store.get(p)||null),subscribe:(p,fn)=>{queueMicrotask(()=>fn([]));return()=>{};},subscribeDoc:(p,fn)=>{listeners.push({p,fn});queueMicrotask(()=>fn(structuredClone(store.get(p)||null)));return()=>{};},transact:async fn=>{const writes=[];await fn({get:db.get,set:(p,v)=>writes.push([p,v]),delete:p=>writes.push([p,null])});for(const [p,v]of writes)store.set(p,structuredClone(v));for(const [p,v]of writes)for(const l of listeners)if(l.p===p)l.fn(structuredClone(v));}};
  const {mountDirectPositionLab}=await import('/nova-direta.js');window.lab=mountDirectPositionLab({database:db,user:()=>({uid:'master',master:true}),characters:()=>[{id:'absent',nome:'Fora do mapa',dono:'master'}],mapas:()=>[map],loadMap:async()=>map,renderMap:window.novaSyncRenderMap_,renderSceneObject:window.novaOficinaElemento_,workshop:opts=>{const save=opts.onSave;opts.onSave=async value=>{await save(value);window.saved=value;};return window.session=window.novaOficinaMesa_(opts);}});lab.open();
 });
 await page.waitForFunction(()=>document.querySelector('#novaSyncMapa').value==='map');
 assert.equal(await page.locator('#novaSyncPersonagem option[value="absent"]').count(),0);
 await page.locator('#novaOficinaPanel summary').click();await page.waitForFunction(()=>window.session);

 assert.equal(await page.locator('#novaSyncBoard').isVisible(),false);
 assert.ok(await page.locator('#gm2tool option').count()>20);assert.equal(await page.locator('#gm2side [data-shape]').count(),5);
 await page.locator('#gm2tool').selectOption('brush:redondo');await page.locator('#gm2sizebrush').fill('25');await page.locator('#gm2sizebrush').dispatchEvent('input');
 let box=await page.locator('#gm2svg').boundingBox();await page.mouse.move(box.x+60,box.y+60);await page.mouse.down();await page.mouse.move(box.x+200,box.y+120,{steps:10});await page.mouse.up();
 assert.equal(await page.evaluate(()=>window.saved),undefined);assert.equal(await page.evaluate(()=>session.getState().elements[0].brush),'redondo');assert.equal(await page.evaluate(()=>session.getState().elements[0].strokeWidth),25);
 await page.locator('#gm2side [data-shape="retangulo"]').click();box=await page.locator('#gm2svg').boundingBox();await page.mouse.move(box.x+300,box.y+170);await page.mouse.down();await page.mouse.move(box.x+440,box.y+240,{steps:5});await page.mouse.up();
 await page.locator('#gm2mesaLayer').selectOption('3');await page.locator('#gm2mesaBlock').check();await page.locator('#gm2mesaApply').click();
 await page.locator('#gm2publish').click();await page.waitForFunction(()=>window.saved?.objects.length===2);const saved=await page.evaluate(()=>window.saved);assert.equal(saved.objects[1].camada,3);assert.equal(saved.objects[1].bloqueiaMovimento,true);
 await page.locator('#novaOficinaPanel').screenshot({path:path.join(__dirname,'../oficina-mesa-56.png')});
 assert.equal(await page.evaluate(()=>store.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.length),2);await page.waitForFunction(()=>document.querySelectorAll('[data-scene-object] svg').length===2);
 await page.locator('#novaOficinaPanel summary').click();await page.waitForFunction(()=>!document.querySelector('#novaOficinaPanel #gm-sub-oficina2'));assert.equal(await page.locator('#novaOficinaPanel #gm-sub-oficina2').count(),0);assert.equal(await page.locator('#gm-sub-oficina2').count(),1);assert.equal(await page.locator('#novaSyncBoard').isVisible(),true);assert.deepEqual(errors,[]);
 console.log('PASS Oficina 2 real: pincéis, espessura, forma, camada, salvar e retorno ao painel original');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});


