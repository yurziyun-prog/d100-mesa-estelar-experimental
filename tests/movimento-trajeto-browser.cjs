const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage();
  await page.route('https://trail.test/**',r=>{
   const file=new URL(r.request().url()).pathname.slice(1);
   r.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/html',body:file.endsWith('.js')?fs.readFileSync(path.join(__dirname,'../js',file),'utf8'):'<div id="novaSyncStatus"></div><button id="novaSyncInit"></button><select id="novaSyncPersonagem"></select><div id="novaSyncBoard" style="position:relative;width:840px;height:420px"></div>'});
  });
  await page.goto('https://trail.test/');
  const result=await page.evaluate(async()=>{
   const {mountDirectPositionLab,POSITION_PATH,MAP_PATH}=await import('/nova-direta.js');
   const store={[MAP_PATH]:{},[POSITION_PATH+'/pj']:{nome:'Valery',donoUid:'player',x:10,y:7,revision:0},[POSITION_PATH+'/pm']:{nome:'Mestre',donoUid:'master',x:7,y:7,revision:0}};
   let receive,unblock,frames=new Map(),frameId=0,time=performance.now();
   let gate=new Promise(resolve=>unblock=resolve);
   window.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};window.cancelAnimationFrame=id=>frames.delete(id);
   const db={subscribe:(p,fn)=>{receive=fn;fn(['pj','pm'].map(id=>({id,data:store[POSITION_PATH+'/'+id]})));return()=>{};},subscribeDoc:(p,fn)=>{fn(store[p]||null);return()=>{};},transact:async fn=>{
    await gate;const writes=[];const out=await fn({get:async p=>structuredClone(store[p]||null),set:(p,v)=>writes.push([p,v])});
    for(const [p,v]of writes){store[p]=structuredClone(v);receive([{id:p.split('/').pop(),data:v}]);}return out;
   }};
   const lab=mountDirectPositionLab({user:()=>({uid:'player',master:false}),characters:()=>[],database:db});lab.open();
   const board=document.getElementById('novaSyncBoard'),r=board.getBoundingClientRect();board.setPointerCapture=()=>{};
   function point(type,x,y){board.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,button:0,buttons:type==='pointerup'?0:1,clientX:r.left+x/28*r.width,clientY:r.top+y/14*r.height}));}
   function advance(count){for(let i=0;i<count;i++){time+=50;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(time);}}
   point('pointerdown',10,4);advance(24);point('pointermove',4,4);advance(44);point('pointermove',4,7);advance(24);point('pointerup',4,7);
   const node=board.querySelector('[data-token="pj"]'),preview={x:+node.dataset.x,y:+node.dataset.y};
   unblock();for(let i=0;i<20;i++)await new Promise(r=>setTimeout(r,0));
   const first={preview,saved:structuredClone(store[POSITION_PATH+'/pj']),display:{x:+node.dataset.x,y:+node.dataset.y}};
   store[POSITION_PATH+'/pm']={...store[POSITION_PATH+'/pm'],x:7.5,revision:1};
   receive([{id:'pm',data:store[POSITION_PATH+'/pm']}]);
   gate=new Promise(resolve=>unblock=resolve);time=performance.now();
   point('pointerdown',4,4);advance(24);point('pointermove',10,4);advance(44);point('pointermove',10,7);advance(24);point('pointerup',10,7);
   const secondPreview={x:+node.dataset.x,y:+node.dataset.y};
   unblock();for(let i=0;i<20;i++)await new Promise(r=>setTimeout(r,0));
   return [first,{preview:secondPreview,saved:store[POSITION_PATH+'/pj'],display:{x:+node.dataset.x,y:+node.dataset.y}}];
  });
  for(const [i,run]of result.entries()){
   assert.ok(Math.abs(run.preview.x-(i?10:4))<.001&&Math.abs(run.preview.y-7)<.001,'prévia contorna a outra miniatura');
   assert.ok(Math.hypot(run.saved.x-run.preview.x,run.saved.y-run.preview.y)<.001,'posição confirmada preserva a volta inteira: '+JSON.stringify(run));
   assert.deepEqual(run.display,run.preview);
  }
  console.log('PASS jogador contorna personagem com confirmação atrasada, inclusive após o mestre mover, e não volta ao soltar');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
