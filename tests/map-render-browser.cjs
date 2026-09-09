const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const root=path.resolve('work/mesa-sync');
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='mesa.test'){
   let file=path.join(root,u.pathname==='/'?'index.html':u.pathname);
   if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
   let body=fs.readFileSync(file,'utf8');
   if(file.endsWith('app.js'))body+=`\nwindow.__SYNC_TEST__={ready:true,render:labRender_,state:()=>labEstado_,setState:s=>{labEstado_=s;},packet:p=>labReceberConfirmado_(p),setRole:role=>{userData={role};currentUserUid='test';},reduce:labReduzirComando_,visual:()=>labVisualMovement_,move:labAplicarMovimentoEstadoD2_,handlers:labRuleHandlers_};`;
   return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/html',body});
  }
  if(u.hostname==='www.gstatic.com'){
   const names={ 'firebase-app.js':['initializeApp'], 'firebase-auth.js':['getAuth','createUserWithEmailAndPassword','signInWithEmailAndPassword','onAuthStateChanged','signOut'],
    'firebase-firestore.js':['getFirestore','doc','setDoc','getDoc','collection','query','where','getDocs','deleteDoc','writeBatch','onSnapshot','runTransaction'],
    'firebase-storage.js':['getStorage','ref','uploadBytes','getDownloadURL']}[u.pathname.split('/').pop()]||[];
   return route.fulfill({contentType:'text/javascript',body:names.map(n=>`export const ${n}=(...args)=>${['onSnapshot','onAuthStateChanged'].includes(n)?'(()=>{})':n==='getDoc'?'Promise.resolve({exists:()=>false})':n==='getDocs'?'Promise.resolve({docs:[]})':'({})'};`).join('\n')});
  }
  return route.fulfill({status:200,contentType:'text/javascript',body:''});
 });
 await page.goto('https://mesa.test/');
 await page.waitForFunction(()=>window.__SYNC_TEST__?.ready,{timeout:15000});
 const result=await page.evaluate(async()=>{
  if(typeof window.novaSyncRenderMap_!=='function')throw Error('Native renderer unavailable');
  const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="28" fill="green"/></svg>');
  const map={oficina2State:{w:28,h:14,ppm:32,bg:'#735333',texture:'terra',elements:[
   {id:'grass',type:'path',brush:'grama',points:Array.from({length:80},(_,i)=>({x:1+i*.1,y:2})),stroke:'#669944',strokeWidthM:.2,z:1},
   {id:'leaves',type:'path',brush:'folhas',points:Array.from({length:80},(_,i)=>({x:2+i*.1,y:10})),stroke:'#739944',strokeWidthM:.2,z:2},
   {id:'tree',type:'object',src:image,x:20,y:2,w:3,h:3,rot:20,z:3},
   {id:'erase',type:'eraser',points:[{x:1,y:2},{x:2,y:2}],widthM:.1,z:4}
  ]}};
  const before=JSON.stringify(map),markup=window.novaSyncRenderMap_(map);
  if(JSON.stringify(map)!==before)throw Error('Renderer changed saved map');
  document.body.innerHTML='<div id="novaSyncStatus"></div><button id="novaSyncInit"></button><select id="novaSyncMapa"></select><select id="novaSyncPersonagem"></select><div id="novaSyncBoard" style="position:relative;width:840px;height:420px"></div>';
  const {mountDirectPositionLab}=await import('/js/nova-direta.js?v=14');
  let positions,mapListener;
  const ctl=mountDirectPositionLab({user:()=>({uid:'player',master:false}),characters:()=>[],mapas:()=>[],
   loadMap:async()=>map,renderMap:window.novaSyncRenderMap_,
   database:{subscribe:(p,fn)=>{positions=fn;return ()=>{};},subscribeDoc:(p,fn)=>{mapListener=fn;return ()=>{};}}});
  ctl.open();await mapListener({mapId:'fixture',nome:'Mapa compartilhado'});
  positions([{id:'pj',data:{nome:'Jogador',donoUid:'player',x:4,y:4,revision:1}}]);
  const layer=document.querySelector('[data-map-layer]'),svg=layer.firstChild;
  if(!layer.querySelector('mask')||layer.querySelectorAll('path').length<10||layer.querySelectorAll('ellipse').length<10||!layer.querySelector('[data-type="object"] image'))throw Error('Missing native brush/object rendering '+JSON.stringify({paths:layer.querySelectorAll('path').length,ellipses:layer.querySelectorAll('ellipse').length,html:layer.innerHTML.slice(0,600),status:document.getElementById('novaSyncStatus').textContent}));
  if(document.querySelector('#novaSyncMapa').value!=='fixture')throw Error('Player map missing');
  positions([{id:'pj',data:{nome:'Jogador',donoUid:'player',x:8,y:4,revision:2}}]);
  if(layer.firstChild!==svg||!svg.isConnected)throw Error('Movement rebuilt background');
  return {paths:layer.querySelectorAll('path').length,leaves:layer.querySelectorAll('ellipse').length,objects:layer.querySelectorAll('[data-type="object"]').length,backgroundRetained:true,inputUnchanged:true,playerWithoutLibrary:true};
 });
 await page.screenshot({path:'work/map14-test.png'});
 console.log(JSON.stringify({result,errors},null,2));await browser.close();
 if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
