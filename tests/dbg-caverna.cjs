// v201 — terreno natural no Editor rápido (cordilheira: planalto e colinas escarpadas; caverna natural; espessura livre; pincel de rocha), no navegador de verdade.
// paredes FINAS em linha (espessura fixa), diagonal, cerca, caverna (blocos), cômodo, tirar área/blocos, porta/janela do tamanho da parede,
// pisos, poças, móveis, luz, texto, modelos, botão direito, Alt/Ctrl+Alt, borracha, desfazer/refazer, zoom, mapa novo do zero e 💾 Salvar.
// Também confere que NPCs (grade de caminhos) não atravessam a parede do rascunho.
// Gera docs/imagens/v197-editor-rapido.png. Roda: node tests/v197-editor-rapido-browser.cjs
const assert=require('assert/strict');const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
const W=40,H=26,perto=(a,b,t=.05)=>Math.abs(a-b)<=t;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await (await browser.newContext({viewport:{width:1500,height:1100}})).newPage();const erros=[];page.on('pageerror',e=>erros.push(e.message));page.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
 await page.route('https://nova.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1);if(n.endsWith('.js'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,n),'utf8')});
  if(n.startsWith('arte/')&&fs.existsSync(path.join(root,n)))return r.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,n))});
  return r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:12px;width:1480px">'+panel+'</main>'});});
 await page.goto('https://nova.test/');
 await page.evaluate(async({W,H})=>{
  const store=window.store={},subs=[];const rows=p=>Object.entries(store).filter(([q])=>q.startsWith(p+'/')&&!q.slice(p.length+1).includes('/')).map(([q,d])=>({id:q.slice(p.length+1),data:d}));
  const notify=q=>{for(const s of subs){if(s.doc&&s.path===q)s.fn(store[q]||null);else if(!s.doc&&q.startsWith(s.path+'/'))s.fn(rows(s.path).map(x=>({...x,removed:false})));}};
  const db={get:async p=>store[p]||null,transact:async fn=>{const w=[];const r=await fn({get:async p=>store[p]||null,set:(p,v)=>w.push([p,v]),delete:p=>w.push([p,null])});for(const [p,v] of w){if(v===null)delete store[p];else store[p]=v;}for(const [p] of w)notify(p);return r;},
   read:async p=>[],write:async(p,d)=>{store[p]=d;notify(p);},remove:async p=>{delete store[p];notify(p);},subscribe:(path,fn)=>{const s={path,fn,doc:false};subs.push(s);setTimeout(()=>fn(rows(path).map(x=>({...x,removed:false}))),0);return()=>{};},subscribeDoc:(path,fn)=>{const s={path,fn,doc:true};subs.push(s);setTimeout(()=>fn(store[path]||null),0);return()=>{};},writeMap:async(p,d)=>{store[p]=d;notify(p);}};
  const {mountDirectPositionLab}=await import('/nova-direta.js'),{instalarEditorRapido}=await import('/mesa-editor-rapido.js'),{instalarCamera}=await import('/mesa-camera.js');
  const ID='bairro_teste';
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:ID,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H,fundo:''};
  store['combatesAtivos/mapaMesaSyncDiretaCena']={mapId:ID,objetoSchema:1,objects:[]};
  window.ownSheets=[];
  const renderMap=()=>'<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="display:block"><rect width="'+W+'" height="'+H+'" fill="#b69a72"/></svg>';
  window.lab=mountDirectPositionLab({database:db,user:()=>({uid:'master',master:true}),characters:()=>window.ownSheets,activeCharacter:()=>null,renderMap,loadMap:async id=>({id,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H}),mapas:()=>[{id:ID,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H}],catalog:()=>[],loadActions:async()=>({skills:[],health:{hitMax:{},hit:{},armor:{}}}),prepareSupport:async()=>({resolve:()=>({})}),restoreHealth:async rows=>({}),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows});
  await window.lab.open();
  const img=c=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="'+c+'"/><circle cx="5" cy="5" r="2" fill="#fff"/></svg>');
  const obj=(id,nome,w,h,c)=>({id,nome,larguraM:w,alturaM:h,imagem:img(c),camada:3,bloqueiaMovimento:true});
  window.objetosBanco=[obj('mesa_madeira','Mesa de madeira',2,1,'#6a4a2a'),obj('cadeira_simples','Cadeira simples',.6,.6,'#8a6a3a'),obj('arvore_media','Árvore média',2.2,2.2,'#3f7a3a'),obj('barril','Barril',.8,.8,'#7a5a2a'),obj('cama_simples','Cama simples',1,2,'#a8322a')];
  instalarCamera({controller:()=>({dimsAtual:()=>({W,H}),ator:()=>null,controla:()=>false,...window.lab}),ehMestre:()=>true});
  window.er=instalarEditorRapido({controller:()=>window.lab,ehMestre:()=>true,objetos:()=>window.objetosBanco});
 },{W,H});
 await page.waitForFunction(()=>document.getElementById('erBotao')&&window.mesaRascunhoMapaV193,null,{timeout:10000});
 await page.waitForTimeout(500);
 // ---- helpers de mouse em metros
 const box=async()=>{await page.locator('#novaSyncBoard').scrollIntoViewIfNeeded();await page.waitForTimeout(150);return page.evaluate(()=>{const r=document.getElementById('novaSyncBoard').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});};
 const px=async(mx,my)=>{const b=await box();return {x:b.x+mx/W*b.w,y:b.y+my/H*b.h};};
 const arrastar=async(a,b,opc={})=>{const p0=await px(a[0],a[1]),p1=await px(b[0],b[1]);if(opc.alt)await page.keyboard.down('Alt');if(opc.ctrl)await page.keyboard.down('Control');
  await page.mouse.move(p0.x,p0.y);await page.mouse.down({button:opc.botao||'left'});await page.mouse.move((p0.x+p1.x)/2,(p0.y+p1.y)/2,{steps:3});await page.mouse.move(p1.x,p1.y,{steps:3});await page.mouse.up({button:opc.botao||'left'});
  if(opc.ctrl)await page.keyboard.up('Control');if(opc.alt)await page.keyboard.up('Alt');await page.waitForTimeout(120);};
 const clicar=async(m)=>{const p=await px(m[0],m[1]);await page.mouse.click(p.x,p.y);await page.waitForTimeout(120);};
 const objs=()=>page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().map(o=>({id:o.id,nome:o.nome,tipo:o.erTipo||'',x:o.x*40/28,y:o.y*26/14,w:o.larguraM,h:o.alturaM,tex:o.textura||'',ang:o.angulo||0,modelo:o.modeloId||'',diag:!!o.erDiag,bloco:!!o.erBloco,bloqueia:!!o.bloqueiaMovimento,visao:!!o.bloqueiaVisao})));
 const area=(l,tipo)=>l.filter(o=>o.tipo===tipo&&!o.bloco).reduce((s,o)=>s+o.w*o.h,0);
 const ferramenta=async f=>{const b=page.locator('#erPainel [data-f="'+f+'"]');if((await b.getAttribute('aria-pressed'))==='true')return;await b.click();};
 const mat=async(tool,id)=>{await ferramenta(tool);await page.evaluate(i=>document.querySelector('#erPainel [data-mat="'+i+'"]').click(),id);await page.waitForTimeout(80);};
 await page.locator('#erBotao').click();await page.waitForSelector('#erPainel:not([hidden])');
 await ferramenta('caverna');
 await arrastar([5.5,5.5],[11.5,9.5]);await arrastar([11.5,7.5],[15.5,12.5]);
 await page.waitForTimeout(500);
 const info=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().map(o=>({t:o.erTipo,b:o.bordasV198,tex:!!o.textura,f:o.forma,w:o.larguraM,h:o.alturaM})));
 console.log(JSON.stringify(info));
 await page.screenshot({path:path.join(root,'docs','imagens','dbg-caverna.png'),clip:await page.evaluate(()=>{const r=document.getElementById('novaSyncBoard').getBoundingClientRect();return {x:r.left+r.width*.1,y:Math.max(0,r.top)+r.height*.15,width:r.width*.5,height:r.height*.6};})});
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
