const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1400,height:900}});page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log('PG',m.text().slice(0,200));});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const root=path.resolve(__dirname,'..');
 const appSrc=require('../scripts/montar.cjs').montarApp(root),importados={};
 for(const m of appSrc.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]https:\/\/www\.gstatic\.com\/firebasejs\/[^/]+\/([\w.-]+)['"]/g)){(importados[m[2]]??=[]).push(...m[1].split(',').map(x=>x.trim().split(/\s+as\s+/)[0]).filter(Boolean));}
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='mesa.test'){
   let file=path.join(root,u.pathname==='/'?'index.html':u.pathname);
   const ehApp=u.pathname.endsWith('/js/app.js');if(!ehApp&&!fs.existsSync(file))return route.fulfill({status:404,body:''});
   let body=ehApp?require('../scripts/montar.cjs').montarApp(root):fs.readFileSync(file,'utf8');
   if(ehApp)body+=`\nwindow.__SYNC_TEST__={ready:true,render:labRender_,state:()=>labEstado_,setState:s=>{labEstado_=s;},packet:p=>labReceberConfirmado_(p),setRole:role=>{userData={role};currentUserUid='test';},reduce:labReduzirComando_,visual:()=>labVisualMovement_,move:labAplicarMovimentoEstadoD2_,handlers:labRuleHandlers_,actions:novaDadosAcoes_,prepare:novaPrepararAtaque_,setNpcs:models=>{npcsDB=models;periciasDB=[{id:'esquiva',nome:'Esquiva',atributos:['DES','DES']},{id:'combate_desarmado',nome:'Combate Desarmado',atributos:['FOR','DES']}];}};`;
   return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/html',body});
  }
  if(u.hostname==='www.gstatic.com'){
   const names=[...new Set(importados[u.pathname.split('/').pop()]||[])]; // nomes importados de verdade pelo app (muda a cada versão)
   return route.fulfill({contentType:'text/javascript',body:names.map(n=>`export const ${n}=(...args)=>${['onSnapshot','onAuthStateChanged'].includes(n)?'(()=>{})':n==='getDoc'?'Promise.resolve({exists:()=>false})':n==='getDocs'?'Promise.resolve({docs:[]})':'({})'};`).join('\n')});
  }
  return route.fulfill({status:200,contentType:'text/javascript',body:''});
 });
 await page.goto('https://mesa.test/');
 await page.waitForFunction(()=>window.__SYNC_TEST__?.ready,{timeout:15000});
 await page.evaluate(()=>window.__SYNC_TEST__.setRole("mestre"));
 await page.waitForTimeout(4000);
 const info=await page.evaluate(()=>({mdBotao:!!document.getElementById("mdBotao"),barra:!!document.querySelector("#sincronizacao-nova .nova-view-tools"),mods:Object.keys(window).filter(k=>/^mesa(Diretor|AtitudesIa|Exploracao|VidaSimples)|mesaVidaMod|mesaTempoReal$/.test(k)),erros:window.__erros||[]}));
 console.log(JSON.stringify(info),JSON.stringify(errors.slice(0,8)));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
