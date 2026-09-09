const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir=path.join(__dirname,'../js');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const store={},listeners=[],errors=[];let lock=Promise.resolve(),release;
 const statePath='combatesAtivos/mapaMesaSyncNova';
 store[statePath]={protocol:1,revision:0,estado:{tokens:[{id:'pm',nome:'Mestre',donoUid:'master',x:5,y:5},{id:'pj',nome:'Jogador',donoUid:'player',x:10,y:5}]}};
 const emit=async p=>{for(const l of [...listeners])if((l.many&&p.startsWith(l.path+'/')&&store[p]?.status==='new')||(!l.many&&p===l.path))await l.page.evaluate(({id,data})=>window.callbacks[id]?.(data),{id:l.id,data:l.many?{path:p,data:store[p]}:store[p]}).catch(()=>{});};
 async function pageFor(uid,master){
  const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.exposeBinding('dbCall',async(_,op,arg)=>{
   if(op==='lock'){const previous=lock;let ownRelease;lock=new Promise(r=>{ownRelease=r;});await previous;release=ownRelease;return;}
   if(op==='get')return store[arg]||null;
   if(op==='commit'){for(const [p,v] of arg)store[p]=v;release();for(const [p]of arg)await emit(p);return;}
   if(op==='write'){store[arg.path]=arg.data;await emit(arg.path);return;}
   if(op==='remove'){delete store[arg];return;}
   if(op==='read')return Object.entries(store).filter(([p,d])=>p.startsWith(arg+'/')&&d.status==='new').map(([path,data])=>({path,data}));
   if(op==='subscribe'){
    if(arg.many&&!master)throw Error('player subscribed to private queue');
    listeners.push({...arg,page});
    // Deliver initial snapshot asynchronously, like the SDK.
    setTimeout(()=>{if(arg.many){for(const p of Object.keys(store))if(p.startsWith(arg.path+'/'))emit(p);}else emit(arg.path);},0);return;
   }
   if(op==='unsubscribe'){const i=listeners.findIndex(l=>l.page===page&&l.id===arg);if(i>=0)listeners.splice(i,1);return;}
  });
  await page.route('https://nova.test/**',route=>{
   const name=new URL(route.request().url()).pathname.slice(1);
   if(name.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,name),'utf8')});
   return route.fulfill({contentType:'text/html',body:'<div id="novaSyncStatus"></div><button id="novaSyncInit">Inicializar</button><select id="novaSyncPersonagem"></select><button id="right">Direita</button><div id="novaSyncBoard" style="position:relative;width:840px;height:420px"></div>'});
  });
  await page.goto('https://nova.test/');
  await page.evaluate(async({uid,master})=>{
   window.callbacks={};let next=0;
   const db={
    transact:async fn=>{await dbCall('lock');const writes=[];try{const result=await fn({get:p=>dbCall('get',p),set:(p,v)=>writes.push([p,v])});await dbCall('commit',writes);return result;}catch(e){await dbCall('commit',[]);throw e;}},
    read:p=>dbCall('read',p),write:(path,data)=>dbCall('write',{path,data}),remove:p=>dbCall('remove',p),
    subscribe:(path,receive,many)=>{const id=++next;callbacks[id]=receive;dbCall('subscribe',{path,many,id});return()=>{delete callbacks[id];dbCall('unsubscribe',id);};}
   };
   const {mountPositionLab}=await import('/nova-sync.js');
   window.lab=mountPositionLab({database:db,user:()=>({uid,master}),characters:()=>[]});
   document.getElementById('right').onclick=()=>lab.move(1,0);
   await lab.open();
  },{uid,master});
  return page;
 }
 try {
  const player=await pageFor('player',false);
  await player.waitForFunction(()=>document.querySelectorAll('[data-token]').length===2);
  await player.click('#right');
  assert.equal(Object.values(store).filter(d=>d.type==='nova_move').length,1);
  const master=await pageFor('master',true);
  await master.waitForFunction(()=>document.getElementById('novaSyncStatus').textContent.includes('revisão 1'));
  await player.waitForFunction(()=>document.getElementById('novaSyncStatus').textContent.includes('revisão 1'));
  assert.equal(store[statePath].estado.tokens[1].x,11);
  console.log('PASS comando enviado antes do mestre conectar é recuperado e confirmado nas duas telas');
  await master.click('#right');
  await player.waitForFunction(()=>document.getElementById('novaSyncStatus').textContent.includes('revisão 2'));
  assert.equal(store[statePath].estado.tokens[0].x,6);
  const box=await player.locator('[data-token="pj"]').boundingBox();
  await player.mouse.move(box.x+box.width/2,box.y+box.height/2);await player.mouse.down();await player.mouse.move(box.x+box.width/2+60,box.y+box.height/2+30);await player.mouse.up();
  await master.waitForFunction(()=>document.getElementById('novaSyncStatus').textContent.includes('revisão 3'));
  assert.ok(store[statePath].estado.tokens[1].x>12.9);
  const poses=async p=>p.locator('[data-token]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.token,left:n.style.left,top:n.style.top})));
  assert.deepEqual(await poses(master),await poses(player));
  console.log('PASS botões do mestre e arraste do jogador atualizam as mesmas posições nas duas telas');
  await master.evaluate(()=>{window.savedToken=document.querySelector('[data-token]');});
  store[statePath].authority.until=Date.now()+12000;
  await emit(statePath);
  assert.equal(await master.evaluate(()=>window.savedToken===document.querySelector('[data-token]')),true);
  console.log('PASS renovação preserva os elementos das miniaturas');
  // Expire lease in persisted state; the periodic renewal must recover queued input.
  store[statePath].authority.until=Date.now()-1;
  await player.click('#right');
  await master.waitForFunction(()=>document.getElementById('novaSyncStatus').textContent.includes('revisão 4'),{},{timeout:10000});
  assert.deepEqual(await poses(master),await poses(player));
  assert.deepEqual(errors,[]);
  console.log('PASS retomada após expiração da liderança; nenhum erro JavaScript');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
