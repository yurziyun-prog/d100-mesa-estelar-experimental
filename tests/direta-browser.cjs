const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir=path.join(__dirname,'../js');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const store={},listeners=[],errors=[];let lock=Promise.resolve(),release;
 const statePath='combatesAtivos/mapaMesaSyncDireta/posicoes';
 store[statePath+'/pm']={nome:'Mestre',donoUid:'master',x:5,y:5,revision:0};
 store[statePath+'/pj']={nome:'Jogador',donoUid:'player',x:10,y:5,revision:0};
 const emit=async p=>{for(const l of [...listeners])if(l.document?p===l.path:p.startsWith(l.path+'/'))await l.page.evaluate(({id,data})=>window.callbacks[id]?.(data),{id:l.id,data:l.document?store[p]:[{id:p.split('/').pop(),data:store[p]}]}).catch(()=>{});};
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
   const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
   const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
   const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
   return route.fulfill({contentType:'text/html',body:css+'<main style="padding:12px">'+panel+'</main>'});
  });
  await page.goto('https://nova.test/');
  await page.evaluate(async({uid,master})=>{
   window.callbacks={};let next=0;
   const db={
    transact:async fn=>{await dbCall('lock');const writes=[];try{const result=await fn({get:p=>dbCall('get',p),set:(p,v)=>writes.push([p,v])});await dbCall('commit',writes);return result;}catch(e){await dbCall('commit',[]);throw e;}},
    read:p=>dbCall('read',p),write:(path,data)=>dbCall('write',{path,data}),remove:p=>dbCall('remove',p),
    subscribe:(path,receive)=>{const id=++next;callbacks[id]=receive;dbCall('subscribe',{path,id});return()=>{delete callbacks[id];dbCall('unsubscribe',id);};},
    subscribeDoc:(path,receive)=>{const id=++next;callbacks[id]=receive;dbCall('subscribe',{path,id,document:true});return()=>{delete callbacks[id];dbCall('unsubscribe',id);};},
    writeMap:async()=>{}
   };
   const {mountDirectPositionLab}=await import('/nova-direta.js');
   window.lab=mountDirectPositionLab({database:db,user:()=>({uid,master}),characters:()=>[],catalog:()=>[{id:'npc:guarda',nome:'Guarda',donoUid:'',catalogType:'npc'},...['pj','pm','monstro','objeto','item'].map(type=>({id:type+'extra',nome:type,catalogType:type,imagem:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E'}))],loadActions:async()=>({skills:[{id:'per',nome:'Percepção',valor:50,weapons:[],descricao:'Observe o ambiente'}],pvHtml:'<span>PV 5/5 · PA 0</span>'}),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows.map(t=>({...t,initiative:t.id==='pj'?20:0,actions:t.id==='pj'?2:3}))});

   await lab.open();
  },{uid,master});
  return page;
 }
 try {
  const player=await pageFor('player',false);
  await player.waitForFunction(()=>document.querySelectorAll('[data-token]').length===2);
  async function walkTo(p,x,y){await p.locator('#novaSyncBoard').scrollIntoViewIfNeeded();const b=await p.locator('#novaSyncBoard').boundingBox();const start=await p.evaluate(()=>{const id=document.querySelector('#novaSyncPersonagem').value;const n=[...document.querySelectorAll('[data-token]')].find(n=>n.dataset.token===id);return {x:+n.dataset.x,y:+n.dataset.y};});await p.mouse.move(b.x+x/28*b.width,b.y+y/14*b.height);await p.mouse.down();await p.waitForTimeout(Math.hypot(x-start.x,y-start.y)/3*1000+150);await p.mouse.up();}
  async function placeAt(p,x,y){await p.locator('#novaSyncBoard').scrollIntoViewIfNeeded();const r=await p.locator('#novaSyncBoard').boundingBox();await p.mouse.click(r.x+x/28*r.width,r.y+y/14*r.height);}
  await player.locator('#novaSyncBoard').scrollIntoViewIfNeeded();
  const b=await player.locator('#novaSyncBoard').boundingBox();
  await player.mouse.move(b.x+600,b.y+180);await player.mouse.down();
  await player.waitForFunction(()=>Number(document.querySelector('[data-token="pj"]').dataset.x)>10);
  assert.equal(store[statePath+'/pj'].revision,0);
  const local=await player.locator('[data-token="pj"]').evaluate(n=>parseFloat(n.style.left));
  assert.ok(local>10/28*100,'miniatura responde antes da confirmação');
  await player.mouse.up();
  await player.waitForFunction(()=>!document.getElementById('novaSyncStatus').textContent.includes('salvando'));
  const stopped=store[statePath+'/pj'].x;
  assert.ok(stopped>10&&stopped<10.6,'soltar interrompe antes do destino a 3 m/s');
  await player.waitForTimeout(500);assert.equal(store[statePath+'/pj'].x,stopped,'não continua andando após soltar');
  console.log('PASS jogador move e salva sem nenhuma sessão do mestre; resposta local imediata');
  const master=await pageFor('master',true);
  await master.waitForFunction(()=>document.querySelectorAll('[data-token]').length===2);
  const poses=async p=>p.locator('[data-token]').evaluateAll(ns=>ns.map(n=>[n.dataset.token,n.style.left,n.style.top]));
  assert.deepEqual(await poses(master),await poses(player));
  await Promise.all([walkTo(player,21,6),walkTo(master,10,8)]);
  for(const p of [player,master])await p.waitForFunction(()=>!document.getElementById('novaSyncStatus').textContent.includes('salvando'));
  assert.deepEqual(await poses(master),await poses(player));
  assert.ok(store[statePath+'/pm'].x>6.9);
  assert.deepEqual(errors,[]);
  console.log('PASS cliques simultâneos convergem em documentos separados, sem setas');
  await master.locator('#novaSyncStart').click();
  await player.waitForFunction(()=>document.querySelector('#novaSyncTurno').textContent.includes('Turno de combate iniciado'));
  assert.equal(await master.locator('#novaSyncNext').isDisabled(),true,'mestre não passa pelo jogador');
  const combatPath='combatesAtivos/mapaMesaSyncDireta';
  const rolls=JSON.stringify(store[combatPath].combat.rolls);
  const origin={...store[statePath+'/pj']};
  await walkTo(player,origin.x-3,origin.y);
  await player.waitForFunction(()=>!document.querySelector('#novaSyncStatus').textContent.includes('salvando'));
  assert.ok(Math.abs(store[statePath+'/pj'].movementUsed-3)<.001);
  async function act(page,button){
   const before=store[combatPath].combat.sequence;
   await page.locator(button).click();
   const until=Date.now()+5000;
   while(store[combatPath].combat.sequence===before&&Date.now()<until)await new Promise(r=>setTimeout(r,20));
   assert.equal(store[combatPath].combat.sequence,before+1);
  }
  await act(player,'#novaSyncNext');
  await master.waitForFunction(()=>document.querySelector('#novaSyncTurno').textContent.includes('Vez de Mestre'));
  assert.equal(store[combatPath].combat.actors.pj.remaining,2);
  await act(master,'#novaSyncNext');
  await player.waitForFunction(()=>document.querySelector('#novaSyncTurno').textContent.includes('Turno de combate iniciado'));
  assert.ok((await player.locator('#novaSyncTurno').textContent()).includes('Turno de combate iniciado'));
  await walkTo(player,1,origin.y);
  await player.waitForFunction(()=>!document.querySelector('#novaSyncStatus').textContent.includes('salvando'));
  assert.equal(store[statePath+'/pj'].movementUsed,6);
  assert.ok(Math.abs(store[statePath+'/pj'].x-(origin.x-6))<.001);
  await act(player,'#novaSyncSpend');
  await player.waitForFunction(()=>document.querySelector('#novaSyncTurno').textContent.includes('Turno de combate iniciado'));
  await act(player,'#novaSyncSpend');
  await master.waitForFunction(()=>document.querySelector('#novaSyncTurno').textContent.includes('Vez de Mestre'));
  assert.equal(store[combatPath].combat.round,1);
  await act(master,'#novaSyncNext');
  await player.waitForFunction(()=>document.querySelector('#novaSyncTurno').textContent.includes('Turno 2'));
  assert.ok((await player.locator('#novaSyncTurno').textContent()).includes('Turno de combate iniciado'));
  assert.equal(JSON.stringify(store[combatPath].combat.rolls),rolls);
  assert.equal(store[combatPath].combat.actors.pj.remaining,2);
  assert.equal(store[combatPath].combat.actors.pm.remaining,3);
  await master.locator('#novaSyncEnd').click();
  await player.waitForFunction(()=>document.querySelector('#novaSyncTurno').textContent.includes('Modo explorador'));
  await walkTo(player,26,origin.y);
  await player.waitForFunction(()=>!document.querySelector('#novaSyncStatus').textContent.includes('salvando'));
  assert.ok(Math.abs(store[statePath+'/pj'].x-26)<.001);
  assert.deepEqual(await poses(master),await poses(player));
  assert.deepEqual(errors,[]);
  console.log('PASS iniciativa, ações do dono, duas passagens, avanço automático e saldo de movimento por turno');
  assert.equal(await player.locator('#novaSyncMestrePersonagem').isDisabled(),true);
  await master.locator('#novaSyncCatalog summary').click();
  for(const type of ['pj','pm','monstro','npc']){
   await master.locator('#novaSyncMestreTipo').selectOption(type);
   assert.equal(await master.locator('#novaSyncMestrePersonagem option').count(),2,'filtro mostra somente o tipo escolhido');
  }
  await master.locator('#novaSyncMestrePersonagem').selectOption('npc:guarda');
  assert.equal(store[statePath+'/npc%3Aguarda'],undefined,'selecionar não adiciona');
  await master.locator('#novaSyncAdicionar').click();
  assert.equal(await master.locator('#novaSyncAdicionar').textContent(),'Cancelar colocação');
  await master.locator('#novaSyncAdicionar').click();
  assert.equal(await master.locator('#novaSyncAdicionar').textContent(),'Adicionar ao mapa');
  await master.locator('#novaSyncAdicionar').click();
  await placeAt(master,2,2);
  await player.waitForFunction(()=>document.querySelectorAll('[data-token]').length===3);
  assert.equal(store[statePath+'/npc%3Aguarda'].nome,'Guarda');
  assert.ok(Math.abs(store[statePath+'/npc%3Aguarda'].x-2)<.02);
  console.log('PASS seletor lista e coloca NPC no mapa de ambas as contas');
  await master.locator('#novaSyncCatalog summary').click();
  await master.waitForFunction(()=>document.querySelectorAll('#novaSyncCatalogGrid img').length===0);
  await master.locator('#novaSyncCatalog summary').click();
  await master.locator('#novaSyncMestreTipo').selectOption('objeto');
  await master.waitForFunction(()=>document.querySelectorAll('#novaSyncCatalogGrid img').length===1);
  await master.locator('#novaSyncCatalogGrid button').click();
  await master.locator('#novaSyncAdicionar').click();
  await placeAt(master,6,6);
  await player.waitForFunction(()=>document.querySelectorAll('[data-scene-object]').length===1);
  assert.equal(store['combatesAtivos/mapaMesaSyncDiretaCena'].objects[0].tipo,'objeto');
  assert.equal(store[combatPath].scene,undefined,'objetos não pesam no documento usado para movimento');
  assert.equal(Object.keys(store).filter(p=>p.startsWith(statePath+'/')).length,3,'objeto não vira personagem');
  assert.equal(await master.locator('#novaSyncStart').isVisible(),true);
  assert.equal(await master.locator('#novaSyncEnd').isVisible(),false);
  await master.locator('#novaSyncStart').click();
  await master.waitForFunction(()=>document.querySelector('#novaSyncEnd').hidden===false);
  assert.equal(await master.locator('#novaSyncStart').isVisible(),false);
  const order=[...store[combatPath].combat.order];
  for(const id of order){
   assert.equal(store[combatPath].combat.activeId,id);
   await act(id==='pj'?player:master,'#novaSyncNext');
   assert.equal(store[combatPath].combat.round,1);
  }
  for(const id of order){
   assert.equal(store[combatPath].combat.activeId,id);
   assert.equal(store[combatPath].combat.actors[id].passes,1);
   assert.ok(store[combatPath].combat.actors[id].remaining>0);
   await act(id==='pj'?player:master,'#novaSyncNext');
  }
  assert.equal(store[combatPath].combat.round,2);
  const beforeActions=store[combatPath].combat.actors.pj.remaining;
  await player.locator('#novaSyncActionPanel button').click();
  await player.waitForFunction(()=>document.querySelector('#novaSyncActionPanel').textContent.includes('Sucesso'));
  assert.equal(store[combatPath].combat.actors.pj.remaining,beforeActions-1);
  assert.deepEqual(errors,[]);
  console.log('PASS galeria sob demanda, objeto compartilhado, botão contextual, retorno do NPC e teste gastando Ação');
  await master.locator('#novaSyncEnd').click();
  await master.locator('#novaSyncQuickSearch').fill('item · Item');
  await master.locator('#novaSyncQuickAdd').click();
  await player.waitForFunction(()=>document.querySelectorAll('[data-scene-object]').length===2);
  assert.equal(store['combatesAtivos/mapaMesaSyncDiretaCena'].objects[1].tipo,'item');
  await master.locator('#novaSyncPersonagem').selectOption('pm');
  await walkTo(master,27.2,store[statePath+'/pj'].y);
  await master.waitForFunction(()=>!document.getElementById('novaSyncStatus').textContent.includes('salvando'));
  const pm=store[statePath+'/pm'],pj=store[statePath+'/pj'];
  assert.ok(Math.hypot(pm.x-pj.x,pm.y-pj.y)>=1.4-1e-5,'miniaturas param sem se sobrepor');
  assert.ok(pm.x<pj.x,'não atravessa o jogador');
  await master.locator('#novaSyncMasterPanel').scrollIntoViewIfNeeded();
  await master.screenshot({path:path.join(__dirname,'../../../sync25-ui.png'),fullPage:true});
  console.log('PASS busca rápida adiciona diretamente e colisão persiste na outra conta');

 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
