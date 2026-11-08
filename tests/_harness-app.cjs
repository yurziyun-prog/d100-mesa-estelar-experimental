// Harness comum dos testes de navegador: abre o app REAL montado de js/app/ no Edge, com Firestore SIMULADO em memória (sem rede e sem as regras do servidor)
// e papéis SIMULADOS por variável (mestre/jogador). Prova a lógica e a interface; NÃO é uma sessão autenticada de verdade.
const fs=require('fs'),path=require('path');
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
 const write=(p,d,o)=>{if(window.__FALHA_REDE&&String(p).includes(window.__FALHA_REDE))throw Error("Falha de rede simulada em "+p);store.set(p,o?.merge?merge(store.get(p)||{},d):clone(d));notify(p);};window.__fsWrite=write;
 `;
 const defs={
  getFirestore:'export const getFirestore=()=>({});',
  initializeFirestore:'export const initializeFirestore=()=>({});',
  doc:'export const doc=(db,...a)=>({kind:"doc",path:seg(a).join("/"),id:seg(a).slice(-1)[0]});',
  collection:'export const collection=(db,...a)=>({kind:"col",path:seg(a).join("/")});',
  query:'export const query=c=>c;',where:'export const where=()=>({});',orderBy:'export const orderBy=()=>({});',limit:'export const limit=()=>({});',
  getDoc:'export const getDoc=async r=>snapDoc(r.path);',
  getDocs:'export const getDocs=async c=>snapCol(c.path);',
  setDoc:'const _aninh=(v)=>{if(Array.isArray(v)){for(const x of v){if(Array.isArray(x))return true;if(_aninh(x))return true;}return false;}if(v&&typeof v==="object"&&v.constructor===Object){for(const k of Object.keys(v)){if(v[k]===undefined)return true;if(_aninh(v[k]))return true;}}return false;};const _checa=(p,d)=>{if(!window.__SEM_CHECAR_ANINHADOS&&_aninh(d)){const e=new Error("Function setDoc() called with invalid data. Nested arrays are not supported (found in document "+p+")");e.code="invalid-argument";throw e;}};export const setDoc=async(r,d,o)=>{_checa(r.path,d);if(window.__ESCRITA_PENDENTE&&r.path.includes(window.__ESCRITA_PENDENTE))return new Promise(()=>{});return write(r.path,d,o);};',
  updateDoc:'export const updateDoc=async(r,d)=>write(r.path,d,{merge:true});',
  deleteDoc:'export const deleteDoc=async r=>{store.delete(r.path);notify(r.path);};',
  onSnapshot:'export const onSnapshot=(r,a,b)=>{const fn=typeof a==="function"?a:b;const s={kind:r.kind,path:r.path,fn};subs.push(s);Promise.resolve().then(()=>fn(r.kind==="doc"?snapDoc(r.path):snapCol(r.path)));return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1);};};',
  runTransaction:'export const runTransaction=async(db,fn)=>{if(window.__FALHA_TX){const e=new Error("Missing or insufficient permissions.");e.code="permission-denied";throw e;}const w=[];const tx={get:async r=>snapDoc(r.path),set:(r,d,o)=>{if(!window.__SEM_CHECAR_ANINHADOS&&_aninh(d)){const e=new Error("Function Transaction.set() called with invalid data. Nested arrays are not supported (found in document "+r.path+")");e.code="invalid-argument";throw e;}w.push([r.path,d,o]);return tx;},update:(r,d)=>{w.push([r.path,d,{merge:true}]);return tx;},delete:r=>{w.push([r.path,null]);return tx;}};const out=await fn(tx);if(window.__ATRASO_MS)await new Promise(r=>setTimeout(r,window.__ATRASO_MS));for(const [p,d,o] of w){if(d===null){store.delete(p);notify(p);}else write(p,d,o);}return out;};',
  writeBatch:'export const writeBatch=()=>{const w=[];const b={set:(r,d,o)=>{w.push([r.path,d,o]);return b;},update:(r,d)=>{w.push([r.path,d,{merge:true}]);return b;},delete:r=>{w.push([r.path,null]);return b;},commit:async()=>{for(const [p,d,o] of w){if(d===null){store.delete(p);notify(p);}else write(p,d,o);}}};return b;};',
  serverTimestamp:'export const serverTimestamp=()=>({__sv:1});',
  increment:'export const increment=n=>n;',arrayUnion:'export const arrayUnion=(...a)=>a;',arrayRemove:'export const arrayRemove=(...a)=>a;',
  getStorage:'export const getStorage=()=>({});',ref:'export const ref=(s,p)=>({fullPath:p});',uploadBytes:'export const uploadBytes=async()=>({ref:{}});',getDownloadURL:'export const getDownloadURL=async()=>"";'
 };
 return impl+names.map(n=>defs[n]||('export const '+n+'=(...a)=>({});')).join('\n');
};
async function abrirApp({viewport={width:1500,height:950},headless=true}={}){
 const browser=await chromium.launch({headless,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const ctx=await browser.newContext(process.env.VIDEO_DIR?{viewport,recordVideo:{dir:process.env.VIDEO_DIR,size:{width:Math.min(viewport.width,1280),height:Math.min(viewport.height,800)}}}:{viewport});const page=await ctx.newPage();const erros=[];if(process.env.ARTE_LEGADA)await page.addInitScript(()=>{window.__ARTE_LEGADA_V205=true;});
 page.on('pageerror',e=>erros.push('PAGEERR '+e.message));page.on('console',m=>{if(m.type()==='error')erros.push('CONSOLE '+m.text());if(process.env.LOG_CONSOLE&&m.text().includes(process.env.LOG_CONSOLE))console.log('[página]',m.text().slice(0,300));});
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='mesa.test'){
   const ehApp=u.pathname.endsWith('/js/app.js'),file=path.join(root,u.pathname==='/'?'index.html':u.pathname);
   if(!ehApp&&!fs.existsSync(file))return route.fulfill({status:404,body:''});
   let body=ehApp?appSrc:(/.(webp|png|jpe?g|gif|ico)$/i.test(file)?fs.readFileSync(file):fs.readFileSync(file,'utf8'));
   if(ehApp)body+=`\nwindow.__APP__={ctl:()=>novaSyncController_,setJogador:u=>{userData={role:'jogador'};currentUserUid=u||'jog1';},setPersonagem:c=>{userCharacters=[c];currentCharId=c.id;},setMestre:()=>{userData={role:'mestre'};currentUserUid='mestre1';},setBancos:(c,n)=>{criaturasDB=c;npcsDB=n;},setObjetos:l=>{objetosMapaDB=l;},ev:s=>eval(s)};`;
   return route.fulfill({contentType:ehApp||file.endsWith('.js')?'text/javascript':file.endsWith('.webp')?'image/webp':file.endsWith('.svg')?'image/svg+xml':'text/html',body});
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
 return {browser,page,erros,root,close:()=>browser.close()};
}
module.exports={abrirApp,root};
/** põe no Banco de Objetos as mesmas peças que o jogo cadastra de verdade (IA, 3D dos pacotes e Blender), para os geradores acharem móveis e peças */
async function carregarBancoDePecas(page){
 return page.evaluate(async()=>{
  const [ia,a3,bl,pk]=await Promise.all([import('/js/mesa-pecas-dados.js'),import('/js/mesa-pecas3d-dados.js'),import('/js/mesa-pecas-blender-dados.js'),import('/js/mesa-pecas.js')]);
  const lista=[...ia.PECAS,...a3.PECAS_3D,...bl.PECAS_BLENDER].map(p=>pk.modeloDaPeca(p,location.origin+'/'));
  window.__APP__.setObjetos(lista);return lista.length;
 });
}
module.exports.carregarBancoDePecas=carregarBancoDePecas;
