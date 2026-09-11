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
   if(file.endsWith('app.js'))body+=`\nwindow.__SYNC_TEST__={ready:true,render:labRender_,state:()=>labEstado_,setState:s=>{labEstado_=s;},packet:p=>labReceberConfirmado_(p),setRole:role=>{userData={role};currentUserUid='test';},reduce:labReduzirComando_,visual:()=>labVisualMovement_,move:labAplicarMovimentoEstadoD2_,handlers:labRuleHandlers_,actions:novaDadosAcoes_,prepare:novaPrepararAtaque_,setNpcs:models=>{npcsDB=models;}};`;
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
 await page.locator('#loginScreen .lang-btn').filter({hasText:'EN'}).click();
 if(await page.locator('#loginScreen [data-i18n="loginBtn"]').textContent()!=='Login')throw Error('Troca de idioma na tela de login falhou');
 if(!await page.evaluate(()=>typeof window.fazerLogin==='function'))throw Error('Login não foi inicializado');
 await page.locator('#loginScreen .lang-btn').filter({hasText:'PT'}).click();
 const combat=await page.evaluate(async()=>{
  const api=window.__SYNC_TEST__;api.setRole('mestre');
  api.setNpcs([{id:'vampiro',nome:'Vampiro',FOR:14,CON:14,TAM:14,DES:14,INT:14,POD:14,CAR:14,periciasTexto:'Combate Desarmado:200|Esquiva:30',armasTexto:'Mordida:1d6+MD|Garras:1d8+MD',vinculosAtaquesPericias:'Combate Desarmado:Mordida,Garras'},{id:'alvo',nome:'Alvo',FOR:14,CON:30,TAM:30,DES:14,INT:14,POD:14,CAR:14,periciasTexto:'Combate Desarmado:30',armasTexto:'Punhos:1d3'}]);
  const a={id:'syncnpc%3Avampiro',nome:'Vampiro',x:5,y:5},b={id:'syncnpc%3Aalvo',nome:'Alvo',x:6.4,y:5};
  const data=await api.actions(a),skill=data.skills.find(s=>s.weapons.some(w=>w.nome==='Mordida'));
  if(!skill)throw Error('Mordida do NPC não foi carregada');
  if(!data.skills.every((s,i)=>!i||data.skills[i-1].valor>=s.valor))throw Error('Perícias fora de ordem');
  const before=JSON.stringify(api.state());let result;
  for(let i=0;i<10;i++){const resolve=await api.prepare(a,b,{skillId:skill.id,weaponId:skill.weapons.find(w=>w.nome==='Mordida').id});result=resolve(a,b,{},{});if(JSON.stringify(result)!==JSON.stringify(resolve(a,b,{},{})))throw Error('Tentativa repetida mudou a rolagem');if(result.event.hit)break;}
  if(!result.event.hit||result.event.damage<=0)throw Error('Ataque não aplicou dano');
  if(!Object.keys(result.actors[b.id].combateLab.hit).some(loc=>result.actors[b.id].combateLab.hit[loc]<result.actors[b.id].combateLab.hitMax[loc]))throw Error('PV do alvo não mudou');
  if(JSON.stringify(api.state())!==before)throw Error('Ataque alterou a mesa antiga');
  const {iniciarIniciativa,defesasRestantes}=await import('/js/nova-turnos.js?v=36');
  const map={combat:iniciarIniciativa([{...a,initiative:20,actions:3},{...b,initiative:0,actions:3}],'defense',()=>1)};
  let resolver,preview;
  for(let seed=1;seed<200;seed++){
   resolver=await api.prepare(a,b,{skillId:skill.id,weaponId:skill.weapons.find(w=>w.nome==='Mordida').id,seed});
   preview=resolver(a,b,{},map,{phase:'preview'});if(preview.pending)break;
  }
  if(!preview.pending?.options.some(o=>o.nome==='Esquiva'))throw Error('Defesa não ofereceu Esquiva');
  const defended=resolver(a,b,{},map,{phase:'resolve',choice:preview.pending.options.find(o=>o.nome==='Esquiva').id});
  if(!defended.defenseSpent||!defended.event.defense)throw Error('Defesa não foi rolada');
  if(JSON.stringify(defended)!==JSON.stringify(resolver(a,b,{},map,{phase:'resolve',choice:preview.pending.options.find(o=>o.nome==='Esquiva').id})))throw Error('Defesa mudou ao repetir transação');
  const hurt=structuredClone(result.actors);hurt[a.id]={combateLab:{...data.health,ferimentos:{'Peito':'Sério'}}};
  const wounded=await api.actions({...a,...hurt[a.id]});
  if(wounded.skills.find(s=>s.id===skill.id).valor>=skill.valor)throw Error('Ferimento não penalizou perícia de ataque');
  console.log('PASS defesa nativa, rolagem estável e penalidade de ferimento');
  return {naturalAttacks:skill.weapons.map(w=>w.nome),damage:result.event.damage,deterministicRetry:true};
 });
 console.log(JSON.stringify({combat}));
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
   database:{subscribe:(p,fn)=>{positions=fn;return ()=>{};},subscribeDoc:(p,fn)=>{if(p==='combatesAtivos/mapaMesaSyncDireta')mapListener=fn;return ()=>{};}}});
  window.__positionCtl=ctl;ctl.open();await mapListener({mapId:'fixture',nome:'Mapa compartilhado'});
  positions([{id:'pj',data:{nome:'Jogador',donoUid:'player',x:4,y:4,revision:1}}]);
  const layer=document.querySelector('[data-map-layer]'),svg=layer.firstChild;
  if(!layer.querySelector('mask')||layer.querySelectorAll('path').length<10||layer.querySelectorAll('ellipse').length<10||!layer.querySelector('[data-type="object"] image'))throw Error('Missing native brush/object rendering '+JSON.stringify({paths:layer.querySelectorAll('path').length,ellipses:layer.querySelectorAll('ellipse').length,html:layer.innerHTML.slice(0,600),status:document.getElementById('novaSyncStatus').textContent}));
  if(document.querySelector('#novaSyncMapa').value!=='fixture')throw Error('Player map missing');
  positions([{id:'pj',data:{nome:'Jogador',donoUid:'player',x:8,y:4,revision:2}}]);
  if(layer.firstChild!==svg||!svg.isConnected)throw Error('Movement rebuilt background');
  return {paths:layer.querySelectorAll('path').length,leaves:layer.querySelectorAll('ellipse').length,objects:layer.querySelectorAll('[data-type="object"]').length,backgroundRetained:true,inputUnchanged:true,playerWithoutLibrary:true};
 });
 await page.evaluate(async()=>{
  window.__positionCtl.close();const board=document.querySelector('#novaSyncBoard');
  const {criarEditorMesa}=await import('/js/nova-editor.js?v=35');
  window.__editorScene={mapId:'fixture',objects:[]};
  const editor=criarEditorMesa({board,root:document,database:{transact:async work=>work({get:async path=>path==='map'?{mapId:'fixture'}:structuredClone(window.__editorScene),set:(path,value)=>{window.__editorScene=value;}})},scenePath:'scene',mapPath:'map',positionPath:'positions',enabled:()=>true,map:()=>({mapId:'fixture'}),scene:()=>window.__editorScene,fail:error=>{throw error;},changed:()=>editor.paint()});
  editor.paint();board.addEventListener('pointerdown',event=>editor.begin(event));
 });
 const tree=page.locator('[data-eid="tree"]');await tree.scrollIntoViewIfNeeded();const treeBefore=await tree.boundingBox();
 await page.mouse.move(treeBefore.x+treeBefore.width/2,treeBefore.y+treeBefore.height/2);await page.mouse.down();await page.mouse.move(treeBefore.x+treeBefore.width/2+48,treeBefore.y+treeBefore.height/2,{steps:8});await page.mouse.up();
 const treeAfter=await tree.boundingBox();if(Math.abs(treeAfter.x-treeBefore.x-48)>1)throw Error('Objeto da Oficina não moveu um metro');
 if(!await page.evaluate(()=>Math.abs(window.__editorScene.offsets.tree.x-1)<.01))throw Error('Deslocamento do objeto nativo não foi salvo');
 console.log('PASS objeto nativo da Oficina movido sem reconstruir a pintura');
 await page.screenshot({path:'work/map14-test.png'});
 console.log(JSON.stringify({result,errors},null,2));await browser.close();
 if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
