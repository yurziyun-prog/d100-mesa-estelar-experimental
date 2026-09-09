const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir=path.join(__dirname,'../js');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const store={},listeners=[],errors=[];let lock=Promise.resolve(),release;
 const statePath='combatesAtivos/mapaMesaSyncDireta/posicoes';
 store[statePath+'/pm']={nome:'Mestre',donoUid:'master',x:5,y:5,revision:0};
 store[statePath+'/pj']={nome:'Jogador',donoUid:'player',x:10,y:5,revision:0};
 const emit=async p=>{for(const l of [...listeners])if(p.startsWith(l.path+'/'))await l.page.evaluate(({id,data})=>window.callbacks[id]?.(data),{id:l.id,data:[{id:p.split('/').pop(),data:store[p]}]}).catch(()=>{});};
 async function pageFor(uid,master){
  const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.exposeBinding('dbCall',async(_,op,arg)=>{
   if(op==='lock'){const previous=lock;let ownRelease;lock=new Promise(r=>{ownRelease=r;});await previous;release=ownRelease;return;}
   if(op==='get')return store[arg]||null;
   if(op==='commit'){await new Promise(r=>setTimeout(r,250));for(const [p,v] of arg)store[p]=v;release();for(const [p]of arg)await emit(p);return;}
   if(op==='write'){store[arg.path]=arg.data;await emit(arg.path);return;}
   if(op==='remove'){delete store[arg];return;}
   if(op==='read')return Object.entries(store).filter(([p,d])=>p.startsWith(arg+'/')&&d.status==='new').map(([path,data])=>({path,data}));
   if(op==='subscribe'){

    listeners.push({...arg,page});
    // Deliver initial snapshot asynchronously, like the SDK.
    setTimeout(()=>{for(const p of Object.keys(store))emit(p);},0);return;
   }
   if(op==='unsubscribe'){const i=listeners.findIndex(l=>l.page===page&&l.id===arg);if(i>=0)listeners.splice(i,1);return;}
  });
  await page.route('https://nova.test/**',route=>{
   const name=new URL(route.request().url()).pathname.slice(1);
   if(name.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,name),'utf8')});
   return route.fulfill({contentType:'text/html',body:'<div id="novaSyncStatus"></div><button id="novaSyncInit">Inicializar</button><select id="novaSyncPersonagem"></select><div id="novaSyncBoard" style="position:relative;width:840px;height:420px"></div>'});
  });
  await page.goto('https://nova.test/');
  await page.evaluate(async({uid,master})=>{
   window.callbacks={};let next=0;
   const db={
    transact:async fn=>{await dbCall('lock');const writes=[];try{const result=await fn({get:p=>dbCall('get',p),set:(p,v)=>writes.push([p,v])});await dbCall('commit',writes);return result;}catch(e){await dbCall('commit',[]);throw e;}},
    read:p=>dbCall('read',p),write:(path,data)=>dbCall('write',{path,data}),remove:p=>dbCall('remove',p),
    subscribe:(path,receive)=>{const id=++next;callbacks[id]=receive;dbCall('subscribe',{path,id});return()=>{delete callbacks[id];dbCall('unsubscribe',id);};}
   };
   const {mountDirectPositionLab}=await import('/nova-direta.js');
   window.lab=mountDirectPositionLab({database:db,user:()=>({uid,master}),characters:()=>[]});

   await lab.open();
  },{uid,master});
  return page;
 }
 try {
  const player=await pageFor('player',false);
  await player.waitForFunction(()=>document.querySelectorAll('[data-token]').length===2);
  async function walkTo(p,x,y){const b=await p.locator('#novaSyncBoard').boundingBox();await p.mouse.click(b.x+x/28*b.width,b.y+y/14*b.height);}
  await walkTo(player,20,6);
  assert.equal(store[statePath+'/pj'].revision,0);
  const local=await player.locator('[data-token="pj"]').evaluate(n=>parseFloat(n.style.left));
  assert.ok(local>40,'miniatura responde antes da confirmação');
  await player.mouse.up();
  await player.waitForFunction(()=>!document.getElementById('novaSyncStatus').textContent.includes('salvando'));
  assert.ok(store[statePath+'/pj'].x>11.9);
  console.log('PASS jogador move e salva sem nenhuma sessão do mestre; resposta local imediata');
  const master=await pageFor('master',true);
  await master.waitForFunction(()=>document.querySelectorAll('[data-token]').length===2);
  const poses=async p=>p.locator('[data-token]').evaluateAll(ns=>ns.map(n=>[n.dataset.token,n.style.left,n.style.top]));
  assert.deepEqual(await poses(master),await poses(player));
  await Promise.all([walkTo(player,21,6),walkTo(master,10,5)]);
  for(const p of [player,master])await p.waitForFunction(()=>!document.getElementById('novaSyncStatus').textContent.includes('salvando'));
  assert.deepEqual(await poses(master),await poses(player));
  assert.ok(store[statePath+'/pm'].x>6.9);
  assert.deepEqual(errors,[]);
  console.log('PASS cliques simultâneos convergem em documentos separados, sem setas');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
