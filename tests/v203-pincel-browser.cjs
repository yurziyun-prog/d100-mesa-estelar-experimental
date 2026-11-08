const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const appSrc=require('../scripts/montar.cjs').montarApp(root),importados={};
for(const m of appSrc.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]https:\/\/www\.gstatic\.com\/firebasejs\/[^/]+\/([\w.-]+)['"]/g)){(importados[m[2]]??=[]).push(...m[1].split(',').map(x=>x.trim().split(/\s+as\s+/)[0]).filter(Boolean));}
const FIRESTORE=names=>{
 const impl=`
 const store=window.__fs=window.__fs||new Map(),subs=[];
 const clone=v=>{if(v&&v.__sv)return new Date().toISOString();if(Array.isArray(v))return v.map(clone);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([,x])=>x!==undefined).map(([k,x])=>[k,clone(x)]));return v;};
 const merge=(a,b)=>{const r={...a};for(const [k,v] of Object.entries(b)){r[k]=v&&typeof v==='object'&&!Array.isArray(v)&&!v.__sv&&a?.[k]&&typeof a[k]==='object'&&!Array.isArray(a[k])?merge(a[k],v):clone(v);}return r;};
 const seg=a=>a.flatMap(x=>String(x).split('/')).filter(Boolean);
 const snapDoc=p=>({id:p.split('/').pop(),exists:()=>store.has(p),data:()=>store.has(p)?structuredClone(store.get(p)):undefined,ref:{path:p},metadata:{hasPendingWrites:false}});
 const kids=c=>[...store.keys()].filter(p=>p.startsWith(c+'/')&&!p.slice(c.length+1).includes('/'));
 const snapCol=c=>{const docs=kids(c).map(snapDoc);return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f),docChanges:()=>docs.map(doc=>({type:'added',doc})),metadata:{hasPendingWrites:false}};};
 const notify=p=>{for(const s of [...subs]){if(s.kind==='doc'&&s.path===p)s.fn(snapDoc(p));else if(s.kind==='col'&&p.startsWith(s.path+'/')&&!p.slice(s.path.length+1).includes('/'))s.fn(snapCol(s.path));}};
 const write=(p,d,o)=>{store.set(p,o?.merge?merge(store.get(p)||{},d):clone(d));notify(p);};window.__fsWrite=write;
 `;
 const defs={
  getFirestore:'export const getFirestore=()=>({});',
  initializeFirestore:'export const initializeFirestore=()=>({});',
  doc:'export const doc=(db,...a)=>({kind:"doc",path:seg(a).join("/"),id:seg(a).slice(-1)[0]});',
  collection:'export const collection=(db,...a)=>({kind:"col",path:seg(a).join("/")});',
  query:'export const query=c=>c;',where:'export const where=()=>({});',orderBy:'export const orderBy=()=>({});',limit:'export const limit=()=>({});',
  getDoc:'export const getDoc=async r=>snapDoc(r.path);',
  getDocs:'export const getDocs=async c=>snapCol(c.path);',
  setDoc:'export const setDoc=async(r,d,o)=>write(r.path,d,o);',
  updateDoc:'export const updateDoc=async(r,d)=>write(r.path,d,{merge:true});',
  deleteDoc:'export const deleteDoc=async r=>{store.delete(r.path);notify(r.path);};',
  onSnapshot:'export const onSnapshot=(r,a,b)=>{const fn=typeof a==="function"?a:b;const s={kind:r.kind,path:r.path,fn};subs.push(s);Promise.resolve().then(()=>fn(r.kind==="doc"?snapDoc(r.path):snapCol(r.path)));return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1);};};',
  runTransaction:'export const runTransaction=async(db,fn)=>{const w=[];const tx={get:async r=>snapDoc(r.path),set:(r,d,o)=>{w.push([r.path,d,o]);return tx;},update:(r,d)=>{w.push([r.path,d,{merge:true}]);return tx;},delete:r=>{w.push([r.path,null]);return tx;}};const out=await fn(tx);for(const [p,d,o] of w){if(d===null){store.delete(p);notify(p);}else write(p,d,o);}return out;};',
  writeBatch:'export const writeBatch=()=>{const w=[];const b={set:(r,d,o)=>{w.push([r.path,d,o]);return b;},update:(r,d)=>{w.push([r.path,d,{merge:true}]);return b;},delete:r=>{w.push([r.path,null]);return b;},commit:async()=>{for(const [p,d,o] of w){if(d===null){store.delete(p);notify(p);}else write(p,d,o);}}};return b;};',
  serverTimestamp:'export const serverTimestamp=()=>({__sv:1});',
  increment:'export const increment=n=>n;',arrayUnion:'export const arrayUnion=(...a)=>a;',arrayRemove:'export const arrayRemove=(...a)=>a;',
  getStorage:'export const getStorage=()=>({});',ref:'export const ref=(s,p)=>({fullPath:p});',uploadBytes:'export const uploadBytes=async()=>({ref:{}});',getDownloadURL:'export const getDownloadURL=async()=>"";'
 };
 return impl+names.map(n=>defs[n]||('export const '+n+'=(...a)=>({});')).join('\n');
};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1500,height:950}});const erros=[];
 page.on('pageerror',e=>erros.push('PAGEERR '+e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='mesa.test'){
   const ehApp=u.pathname.endsWith('/js/app.js'),file=path.join(root,u.pathname==='/'?'index.html':u.pathname);
   if(!ehApp&&!fs.existsSync(file))return route.fulfill({status:404,body:''});
   let body=ehApp?appSrc:(/.(webp|png|jpe?g|gif|ico)$/i.test(file)?fs.readFileSync(file):fs.readFileSync(file,'utf8'));
   if(ehApp)body+=`\nwindow.__APP__={ctl:()=>novaSyncController_,setMestre:()=>{userData={role:'mestre'};currentUserUid='mestre1';},setBancos:(c,n)=>{criaturasDB=c;npcsDB=n;},setObjetos:l=>{objetosMapaDB=l;}};`;
   return route.fulfill({contentType:ehApp||file.endsWith('.js')?'text/javascript':file.endsWith('.webp')?'image/webp':'text/html',body});
  }
  if(u.hostname==='www.gstatic.com'){
   const file=u.pathname.split('/').pop(),names=[...new Set(importados[file]||[])];
   const body=file==='firebase-firestore.js'?FIRESTORE(names):names.map(n=>`export const ${n}=(...args)=>${['onAuthStateChanged'].includes(n)?'(()=>{})':'({})'};`).join('\n');
   return route.fulfill({contentType:'text/javascript',body});
  }
  return route.fulfill({status:200,contentType:'text/javascript',body:''});
 });
 await page.addInitScript(()=>{window.__osc=[];class AC{constructor(){this.currentTime=0;this.state='running';this.sampleRate=44100;this.destination={};}
  createOscillator(){return {type:'',frequency:{setValueAtTime:v=>{window.__osc.push(Math.round(v));},exponentialRampToValueAtTime(){},value:0},connect(){},start(){},stop(){}};}
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},value:0},connect(){}};}createWaveShaper(){return {connect(){}};}
  createBiquadFilter(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){},value:0},Q:{value:0},connect(){}};}
  createBuffer(n){return {getChannelData:()=>new Float32Array(n)};}createBufferSource(){return {connect(){},start(){}};}resume(){}}window.AudioContext=AC;});
 await page.goto('https://mesa.test/');
 await page.waitForFunction(()=>window.__APP__,{timeout:20000});
 // ---- dados de verdade do bestiário (CSV) e um mapa
 const csv=fs.readFileSync(path.join(root,'dados','banco_criaturas_2026-09-26.csv'),'utf8');
 const lin=csv.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean),cab=lin[0].split(';');
 const linha=id=>{const k=cab.indexOf('id');const l=lin.slice(1).map(x=>x.split(';')).find(c=>c[k]===id);return Object.fromEntries(cab.map((h,i)=>[h,l[i]]));};
 const cav=linha('cavalgante_prismatico');
 console.log('bestiário:',cav.nome,'altura',cav.altura,cav.tamanho,'| Carniçal Dominante: altura 2,05 Grande (dados do jogo)');
 const criaturas=[{id:'cavalgante_prismatico',nome:cav.nome,altura:cav.altura,tamanho:cav.tamanho,TAM:cav.TAM},{id:'carnical_dominante',nome:'Carniçal Dominante',altura:'2,05',tamanho:'Grande',TAM:'15'},{id:'besta_ululante',nome:'Besta Ululante',altura:'2,4',tamanho:'Grande'},{id:'zumbi_1',nome:'Zumbi',especie:'Humanoide parasitado',altura:'1,75',tamanho:'Médio'},{id:'cadaver_de_chefe',nome:'Cadáver Chefe',especie:'Humanoide parasitado (estágio avançado)',altura:'1,8',tamanho:'Médio'}];
 await page.evaluate(({criaturas})=>{
  const A=window.__APP__;A.setMestre();A.setBancos(criaturas,[{id:'guarda',nome:'Guarda',carreira:'Guarda'}]);
  const S=window.__fs,M='mapa_real';
  S.set('combatesAtivos/mapaMesaSyncDireta',{mapId:M,nome:'Pátio de pedra',larguraM:28,alturaM:14,fundo:''});
  S.set('mapas/'+M,{nome:'Pátio de pedra',larguraM:28,alturaM:14});
  S.set('combatesAtivos/mapaMesaSyncDiretaCena',{mapId:M,objetoSchema:1,objects:[{id:'chao1',nome:'Chão do mapa',erTipo:'piso',x:14,y:7,larguraM:28,alturaM:14,camada:1,forma:'rect',cor:'#8a7a66',bloqueiaMovimento:false,bloqueiaVisao:false},{id:'arv1',nome:'Árvore',x:22,y:3,larguraM:2,alturaM:2,camada:3,forma:'ellipse',cor:'#2f7d3a',bloqueiaMovimento:true}]});
  const pos=(id,nome,x,y,extra={})=>S.set('combatesAtivos/mapaMesaSyncDireta/posicoes/'+id,{nome,imagem:'',donoUid:'',x,y,revision:0,facing:0,camada:3,mapaId:M,diametroM:1,...extra});
  pos('synccriatura%3Acavalgante_prismatico','Monstro · Cavalgante Prismático',8,6);   /* tamanho antigo: 1 m (o erro do mestre) */
  pos('synccriatura%3Acarnical_dominante','Monstro · Carniçal Dominante',16,6,{diametroM:1.95});
  S.set('combatesAtivos/mapaMesaSyncSaude',{revision:1,actors:{'synccriatura%3Acarnical_dominante':{repouso:true}}}); /* quieto: a vida não o move durante o teste de arrastar */
  window.__ready=A.ctl().open();
 },{criaturas});
 // deixa a mesa visível (a tela de login do app real cobre tudo)
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}document.getElementById('loginScreen')&&(document.getElementById('loginScreen').style.display='none');});
 await page.waitForSelector('#novaSyncBoard [data-token]',{timeout:20000});
 await page.waitForTimeout(3500);
  page.on('console',m=>{if(/warn|error/.test(m.type()))console.log('CONSOLE',m.type(),m.text().slice(0,200));});
 // ===== v203: pincel de espalhar
 await page.evaluate(()=>{window.confirm=()=>true;});
 const idm=await page.evaluate(async()=>{const E=window.mesaEditorRapidoV197;const id=await E.criarMapa('Teste pincel',40,25,'');for(let i=0;i<80&&!E.pronto(id);i++)await new Promise(r=>setTimeout(r,100));return id;});
 await page.evaluate(()=>{const E=window.mesaEditorRapidoV197;E.abrir();E.ferramenta('espalhar');});
 await page.waitForSelector('#erPainel [data-painel-pincel]:not([hidden])',{timeout:8000});
 const estilos=await page.evaluate(()=>[...document.querySelectorAll('#erPainel [data-pinc]')].map(b=>b.dataset.pinc));
 console.log('estilos:',estilos.join(','));assert.ok(estilos.length>=10&&estilos.includes('grama')&&estilos.includes('pegada_pata')&&estilos.includes('pelos'),'painel com os pincéis');
 const box=await page.evaluate(()=>{const r=document.getElementById('novaSyncBoard').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
 const trs=[['grama',.08,.25],['pegada_pata',.5,.25],['pelos',.08,.55],['folhas',.5,.55]];
 for(const [est,fx,fy] of trs){
  await page.evaluate(e=>{document.querySelector('#erPainel [data-pinc="'+e+'"]').click();},est);
  const y0=box.y+box.h*fy;
  await page.mouse.move(box.x+box.w*fx,y0);await page.mouse.down();
  for(let k=1;k<=14;k++)await page.mouse.move(box.x+box.w*(fx+k*.025),y0+Math.sin(k)*12,{steps:2});
  await page.mouse.up();await page.waitForTimeout(250);
 }
 await page.waitForTimeout(1500);
 const r=await page.evaluate(()=>{const E=window.mesaEditorRapidoV197;const o=E.objetos().filter(x=>x.pincelV203);const imgs=[...document.querySelectorAll('#novaSyncBoard [data-scene-object] img')].filter(i=>i.src.startsWith('data:image/png')&&i.naturalWidth>1).length;return {n:o.length,est:o.map(x=>x.pincelV203.estilo+':'+x.pincelV203.pts.length),bytes:JSON.stringify(o).length,imgs};});
 console.log('pincéis:',JSON.stringify(r));
 assert.equal(r.n,4,'4 pinceladas criadas');assert.ok(r.bytes<12000,'pincelada leve (só o caminho): '+r.bytes);assert.ok(r.imgs>=4,'desenhadas na tela: '+r.imgs);
 await page.screenshot({path:path.join(root,'docs','imagens','v203-pincel.png')});
 await browser.close();
 console.log('PASS pincéis de espalhar: grama, pegadas, pelos e folhas desenhados e salvos só como caminho');
})().catch(e=>{console.error(e);process.exit(1);});
