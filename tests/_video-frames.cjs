// Extrai quadros de um vídeo webm usando o Chromium do Playwright.
// Uso: node tests/_video-frames.cjs <video.webm> <pasta-saida> [t1,t2,...]
const path=require('path'),fs=require('fs');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const video=path.resolve(process.argv[2]);
const dest=path.resolve(process.argv[3]);
const ts=(process.argv[4]||'3,30,60,90,120,150').split(',').map(Number);
fs.mkdirSync(dest,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const p=await b.newPage({viewport:{width:1280,height:720}});
 await p.goto('file:///'+video.replace(/\\/g,'/'));
 await p.waitForSelector('video',{timeout:15000});
 await p.evaluate(()=>new Promise(r=>{const V=document.querySelector('video');if(V.readyState>=1)return r();V.onloadedmetadata=r;}));
 const dur=await p.evaluate(()=>document.querySelector('video').duration);
 console.log('duração:',dur.toFixed(1)+'s');
 for(const t of ts){
  if(t>=dur)continue;
  await p.evaluate(t=>new Promise(r=>{const V=document.querySelector('video');V.onseeked=r;V.currentTime=t;}),t);
  await p.waitForTimeout(150);
  const v=await p.$('video');
  await v.screenshot({path:path.join(dest,`frame-${String(t).padStart(4,'0')}s.png`)});
  console.log('quadro',t+'s');
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
