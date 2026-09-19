const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir=path.join(__dirname,'../js');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const store={},listeners=[],errors=[];let lock=Promise.resolve(),release;
 const statePath='combatesAtivos/mapaMesaSyncDireta/posicoes';
 store[statePath+'/pm']={nome:'Mestre',donoUid:'master',x:5,y:5,revision:0};
 store[statePath+'/pj']={nome:'Jogador',donoUid:'player',x:10,y:5,revision:0};
 const emit=async p=>{for(const l of [...listeners])if(l.document?p===l.path:p.startsWith(l.path+'/'))await l.page.evaluate(({id,data})=>window.callbacks[id]?.(data),{id:l.id,data:l.document?(store[p]||null):[{id:p.split('/').pop(),data:store[p]||{},removed:!store[p]}]}).catch(()=>{});};
 async function pageFor(uid,master){
  const context=await browser.newContext({viewport:{width:1800,height:1200}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.exposeBinding('dbCall',async(_,op,arg)=>{
   if(op==='lock'){const previous=lock;let ownRelease;lock=new Promise(r=>{ownRelease=r;});await previous;release=ownRelease;return;}
   if(op==='get')return store[arg]||null;
   if(op==='commit'){await new Promise(r=>setTimeout(r,250));for(const [p,v] of arg){if(v===null)delete store[p];else store[p]=v;}release();for(const [p]of arg)await emit(p);return;}
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
   return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:12px">'+panel+'</main>'});
  });
  await page.goto('https://nova.test/');
  await page.evaluate(async({uid,master})=>{
   window.callbacks={};let next=0;
   const db={
    get:p=>dbCall('get',p),
    transact:async fn=>{await dbCall('lock');const writes=[];try{const result=await fn({get:p=>dbCall('get',p),set:(p,v)=>writes.push([p,v]),delete:p=>writes.push([p,null])});await dbCall('commit',writes);return result;}catch(e){await dbCall('commit',[]);throw e;}},
    read:p=>dbCall('read',p),write:(path,data)=>dbCall('write',{path,data}),remove:p=>dbCall('remove',p),
    subscribe:(path,receive)=>{const id=++next;callbacks[id]=receive;dbCall('subscribe',{path,id});return()=>{delete callbacks[id];dbCall('unsubscribe',id);};},
    subscribeDoc:(path,receive)=>{const id=++next;callbacks[id]=receive;dbCall('subscribe',{path,id,document:true});return()=>{delete callbacks[id];dbCall('unsubscribe',id);};},
    writeMap:(path,data)=>dbCall('write',{path,data})
   };
   const {mountDirectPositionLab}=await import('/nova-direta.js');const {acaoIniciativa}=await import('/nova-turnos.js');
   window.lab=mountDirectPositionLab({mapas:()=>[{id:'a',nome:'Bosque'},{id:'b',nome:'Casa'}],loadMap:async id=>({id,larguraM:28,alturaM:14,objetos:id==='a'?[{id:'tree',modeloId:'arvore',x:3,y:3,pvAtual:12}]:[]}),loadProp:async()=>({nome:'Árvore',imagem:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="green"/%3E%3C/svg%3E',material:'madeira',pvMax:40,dureza:5,camada:4,inflamabilidade:3}),renderMap:(_,options)=>options.separateObjects?'<svg></svg>':'<svg><rect data-baked-tree=""/></svg>',database:db,user:()=>({uid,master}),characters:()=>[],catalog:()=>[{id:'npc:guarda',nome:'Guarda',donoUid:'',catalogType:'npc'},...['pj','pm','monstro','objeto','item'].map(type=>({id:type+'extra',nome:type,catalogType:type,imagem:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E'}))],loadActions:async()=>({skills:[{id:'per',nome:'Percepção',valor:50,weapons:[],descricao:'Observe o ambiente'},{id:'laser',nome:'Pistolas de Energia',valor:80,attack:true,weapons:[{id:'laser',nome:'Pistola Laser',ammunition:{key:'laser',capacity:6}},{id:'blaster',nome:'Blaster de Palma',ammunition:{key:'blaster',capacity:4}}]}],health:{hitMax:{'Cabeça':6,'Peito':8,'Abdômen':7,'Braço Direito':5,'Braço Esquerdo':5,'Perna Direita':6,'Perna Esquerda':6},hit:{'Cabeça':6,'Peito':8,'Abdômen':7,'Braço Direito':5,'Braço Esquerdo':5,'Perna Direita':6,'Perna Esquerda':6},armor:{}},pvHtml:'<span>PV 5/5 · PA 0</span>'}),prepareSupport:async()=>({resolve:({a,health,map})=>({actors:health.actors||{},combat:map.combat?.active?acaoIniciativa(map.combat,'spend',map.combat.turnId):map.combat,message:a.nome+' · Percepção: 25/50 → Sucesso'})}),prepareAttack:async(actor,target,command)=>(freshActor,freshTarget,health)=>({actors:{[actor.id]:{...health[actor.id],municaoLab:{...health[actor.id]?.municaoLab,[command.weaponId]:(health[actor.id]?.municaoLab?.[command.weaponId]??(command.weaponId==='laser'?6:4))-1}}},event:{message:'Ataque confirmado',hit:true,damage:2,item:{nome:'Pistola Laser'}}}),restoreHealth:async rows=>Object.fromEntries(rows.map(token=>[token.id,{municaoLab:{}}])),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows.map(t=>({...t,initiative:t.id==='pj'?20:0,actions:t.id==='pj'?2:3}))});

   await lab.open();
  },{uid,master});
  return page;
 }
 try {
 const mapPath='combatesAtivos/mapaMesaSyncDireta',scenePath='combatesAtivos/mapaMesaSyncDiretaCena';store[mapPath]={mapId:'a',larguraM:28,alturaM:14};
 const master=await pageFor('master',true),player=await pageFor('player',false);
 await player.locator('[data-scene-object="map:tree"]').waitFor();
 assert.equal(store[scenePath].objects[0].pvAtual,12);assert.equal(store[scenePath].objects[0].material,'madeira');assert.equal(store[scenePath].objects[0].camada,4);
 await master.waitForFunction(()=>!document.querySelector('[data-baked-tree]'));
 assert.equal(await player.locator('[data-scene-object]').count(),1);
 store[scenePath].objects[0].pvAtual=0;store[scenePath].objects[0].destruido=true;await emit(scenePath);
 await master.locator('#novaSyncMapa').selectOption('b');for(let i=0;i<100&&store[scenePath]?.mapId!=='b';i++)await new Promise(r=>setTimeout(r,50));assert.equal(store[scenePath]?.mapId,'b');
 await master.locator('#novaSyncMapa').selectOption('a');await player.locator('[data-scene-object="map:tree"]').waitFor();
 assert.equal(store[scenePath].objects[0].pvAtual,0);assert.equal(store[scenePath].objects[0].destruido,true);
 assert.equal(store['combatesAtivos/mapaMesaSyncCena_a']?.objects?.[0]?.pvAtual,0);
 const saved=JSON.stringify(store[scenePath]);await master.waitForTimeout(700);assert.equal(JSON.stringify(store[scenePath]),saved);
 await master.screenshot({path:path.join(__dirname,'../../../objetos-47.png'),fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS objetos salvos: mestre/jogador, importação única, sem desenho duplicado, troca de mapas conserva PV zero.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
