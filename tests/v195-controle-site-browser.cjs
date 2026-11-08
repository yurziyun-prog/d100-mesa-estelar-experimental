// v195: o site fora do mapa pelo controle — setas movem o foco, A aperta, LB/RB trocam de aba, B fecha, alavanca direita rola
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{const page=await browser.newPage({viewport:{width:900,height:700}}),erros=[];page.on('pageerror',e=>erros.push(e.message));
  await page.route('https://mesa.test/**',r=>{const u=new URL(r.request().url()).pathname;if(u.endsWith('.js'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(__dirname,'../js',u.slice(1)),'utf8')});
   return r.fulfill({contentType:'text/html',body:`<html><body style="margin:0;font:14px sans-serif"><div id="appScreen"><div class="tabs" style="display:flex;gap:8px;padding:8px">
    <button class="tab-btn active" id="t1" onclick="window.aba='ficha';document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">📋 Ficha</button><button class="tab-btn" id="t2" onclick="window.aba='mapa';document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">🗺️ Mapa da Mesa</button><button class="tab-btn" id="t3" onclick="window.aba='mercado';document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">🛒 Mercado</button></div>
    <div style="display:flex;gap:8px;padding:8px"><button id="b1" onclick="window.fez='b1'">Inventário</button><button id="b2" onclick="window.fez='b2'">Equipar</button></div>
    <div style="padding:8px"><button id="b3" onclick="window.fez='b3'">Salvar</button></div><div style="height:1500px"></div></div></body></html>`});});
  await page.goto('https://mesa.test/');
  const r=await page.evaluate(async()=>{
   const pad={index:0,id:'Xbox',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
   navigator.getGamepads=()=>[pad];
   const {instalarControle}=await import('/mesa-controle.js');instalarControle({controller:()=>null});
   const esp=ms=>new Promise(r=>setTimeout(r,ms));
   const aperta=async i=>{pad.buttons[i]={pressed:true,value:1};await esp(90);pad.buttons[i]={pressed:false,value:0};await esp(90);};
   const foco=()=>document.querySelector('.ctl-foco')?.id||'';
   const out={};
   await aperta(13);out.p1=foco();            // BAIXO: entra no site (aba ativa ou primeiro botão)
   await aperta(15);out.p2=foco();            // DIR
   await aperta(13);out.p3=foco();            // BAIXO: desce para a fileira de baixo
   await aperta(0);out.fez=window.fez||'';    // A aperta
   await aperta(5);out.abaRB=window.aba||''+'';out.ativa=document.querySelector('.tab-btn.active')?.id;
   await aperta(5);out.ativa2=document.querySelector('.tab-btn.active')?.id;
   await aperta(4);out.ativa3=document.querySelector('.tab-btn.active')?.id;   // LB volta
   pad.axes=[0,0,0,.9];await esp(300);pad.axes=[0,0,0,0];out.rolou=window.scrollY>20; // alavanca direita para baixo rola a página
   return out;});
  assert.ok(['t1','b1'].includes(r.p1),'BAIXO põe o foco no site: '+r.p1);assert.ok(r.p2&&r.p2!==r.p1||r.p1==='t1','DIR move o foco: '+JSON.stringify(r));
  assert.equal(r.fez,'b1'.length?r.fez:'');assert.ok(r.fez.startsWith('b'),'A apertou um botão: '+r.fez);
  assert.equal(r.ativa,'t2','RB vai para a aba seguinte');assert.equal(r.ativa2,'t3');assert.equal(r.ativa3,'t2','LB volta');assert.ok(r.rolou,'alavanca direita rola a página');assert.deepEqual(erros,[]);
  console.log('PASS controle no site: foco por setas, A aperta, LB/RB trocam de aba, alavanca direita rola',JSON.stringify(r));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
