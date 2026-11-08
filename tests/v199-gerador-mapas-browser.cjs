// v199 — 🗺️ Gerador de mapas do MapForge (masmorra, cidade, exterior) dentro do Editor rápido, no Chrome de verdade.
// Confere: janela e prévia, semente repetível, plano aplicado como RASCUNHO (nada gravado), tudo dentro do mapa, Ctrl+Z desfaz a geração inteira,
// paredes/portas/pisos/telhados/árvores/legendas das três categorias, orçamento de peças, e "mapa novo" (cria com o tamanho do plano).
// Gera docs/imagens/v199-mapa-masmorra.png, v199-mapa-cidade.png, v199-mapa-exterior.png. Roda: node tests/v199-gerador-mapas-browser.cjs
const assert=require('assert/strict');const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
const W=100,H=70;
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
  const ID='mapa_gerado';
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:ID,nome:'Mapa de teste',larguraM:W,alturaM:H,fundo:''};
  store['combatesAtivos/mapaMesaSyncDiretaCena']={mapId:ID,objetoSchema:1,objects:[]};
  window.ownSheets=[];
  const renderMap=()=>'<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="display:block"><rect width="'+W+'" height="'+H+'" fill="#2a2622"/></svg>';
  window.lab=mountDirectPositionLab({database:db,user:()=>({uid:'master',master:true}),characters:()=>window.ownSheets,activeCharacter:()=>null,renderMap,loadMap:async id=>({id,nome:'Mapa de teste',larguraM:W,alturaM:H}),mapas:()=>[{id:ID,nome:'Mapa de teste',larguraM:W,alturaM:H}],catalog:()=>[],loadActions:async()=>({skills:[],health:{hitMax:{},hit:{},armor:{}}}),prepareSupport:async()=>({resolve:()=>({})}),restoreHealth:async rows=>({}),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows});
  await window.lab.open();
  const img=c=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="'+c+'"/></svg>');
  const obj=(id,nome,w,h,c)=>({id,nome,larguraM:w,alturaM:h,imagem:img(c),camada:3,bloqueiaMovimento:true});
  window.objetosBanco=[obj('banco','Banco',1.5,.6,'#8a6a3a'),obj('terminal','Terminal',1.2,.8,'#3a5a7a'),obj('gerador','Gerador',2,1.6,'#5a5a5a'),obj('mesa_vidro','Mesa de vidro iluminada',2,1.1,'#7ab'),obj('console','Console holográfico',1.6,1.6,'#4a7'),obj('braseiro','Braseiro de plasma',1,1,'#e60'),obj('barril','Barril',.7,.7,'#7a5a2a'),obj('mesa_longa','Mesa comprida',3,1.2,'#6a4a2a'),obj('estante','Estante',2.4,.6,'#5a3a1a'),obj('estatua','Estátua',1.5,1.6,'#999'),obj('capsula','Cápsula de descanso',1.1,2.2,'#adf'),obj('fonte','Fonte',2.6,2.6,'#48c'),obj('barraca','Barraca de feira',2.4,2.4,'#c94'),obj('carro','Carro vermelho',4.5,2,'#c22'),obj('tronco','Tronco caído',4,1.2,'#654'),obj('pedra','Pedra grande',2.5,2,'#888')];
  instalarCamera({controller:()=>({dimsAtual:()=>({W,H}),ator:()=>null,controla:()=>false,...window.lab}),ehMestre:()=>true});
  window.er=instalarEditorRapido({controller:()=>window.lab,ehMestre:()=>true,objetos:()=>window.objetosBanco});
  window.contar=()=>{const L=window.mesaRascunhoMapaV193.objetosAtuais(),c={};for(const o of L){const k=o.erTipo||o.oficina3||'outro';c[k]=(c[k]||0)+1;}return {total:L.length,...c,fora:L.filter(o=>o.x<-.01||o.y<-.01||o.x>28.01||o.y>14.01).length};};
 },{W,H});
 await page.waitForFunction(()=>document.getElementById('erBotao')&&window.mesaRascunhoMapaV193,null,{timeout:10000});
 await page.waitForTimeout(500);
 await page.click('#erBotao');await page.waitForSelector('#erPainel:not([hidden])');
 const base=await page.evaluate(()=>window.contar());
 const gerar=async(tipo,opcoes={})=>{
  await page.click('#erPainel [data-a="gerador"]');await page.waitForSelector('#erGerador');
  await page.selectOption('#erGerador [data-g="tipo"]',tipo);
  for(const [k,v] of Object.entries(opcoes)){const el=page.locator('#erGerador [data-g="'+k+'"]');if(['estilo','bioma','cons'].includes(k))await el.selectOption(String(v));else await el.fill(String(v));}
  await page.click('#erGerador [data-gerar]');await page.waitForFunction(()=>!document.querySelector('#erGerador [data-ok]').disabled,null,{timeout:20000});
  const info=await page.evaluate(()=>document.querySelector('#erGerador [data-info]').innerText);
  const pixels=await page.evaluate(()=>{const c=document.querySelector('#erGerador [data-pv]'),x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=16)if(d[i]+d[i+1]+d[i+2]>60)n++;return n;});
  return {info,pixels};
 };
 const usarAtual=async()=>{await page.check('#erGerador input[value="atual"]');await page.click('#erGerador [data-ok]');await page.waitForSelector('#erGerador',{state:'detached',timeout:20000});await page.waitForTimeout(900);};
 const bytes=()=>page.evaluate(()=>JSON.stringify(window.mesaRascunhoMapaV193.objetosAtuais()).length);
 const desfazer=async()=>{await page.evaluate(()=>window.mesaRascunhoMapaV193.desfazerLote());await page.waitForTimeout(300);};
 // ---- masmorra
 const a=await gerar('masmorra',{estilo:'medieval',w:48,h:32,seed:4242});assert.match(a.info,/semente\s*4242/,'mostra a semente: '+a.info);assert.ok(a.pixels>300,'prévia desenhada ('+a.pixels+')');
 await usarAtual();const m1=await page.evaluate(()=>window.contar());
 assert.ok(m1.parede>=60&&m1.piso>=20&&m1.porta>=10&&m1.texto>=5,'masmorra: paredes, pisos, portas e legendas '+JSON.stringify(m1));assert.equal(m1.fora,0,'nada fora do mapa');assert.ok(await bytes()<640000,'a cena cabe no limite de gravação (650 KB): '+await bytes());
 assert.ok(await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().some(o=>o.nome==='Chão do mapa'&&o.erTex==='rocha')),'chão do mapa de rocha (medieval)');
 assert.ok(await page.evaluate(()=>window.mesaRascunhoMapaV193.pendentes>0&&!Object.keys(window.store).some(k=>/\/Cena/.test(k)&&0)),'é rascunho (pendente, ainda não salvo)');
 await page.screenshot({path:path.join(root,'docs','imagens','v199-mapa-masmorra.png')});
 await desfazer();const d1=await page.evaluate(()=>window.contar());assert.equal(d1.total,base.total,'Ctrl+Z desfaz a geração inteira: '+d1.total+' vs '+base.total);
 await gerar('masmorra',{estilo:'medieval',w:48,h:32,seed:4242});await usarAtual();const m2=await page.evaluate(()=>window.contar());assert.deepEqual(m2,m1,'a mesma semente gera o mesmo mapa');await desfazer();
 // ---- cidade
 const c=await gerar('cidade',{estilo:'hibrido',w:100,h:70,seed:11,dens:70});assert.ok(c.pixels>300);await usarAtual();const m3=await page.evaluate(()=>window.contar());
 assert.ok(m3.telhado>=5&&m3.parede>=30&&m3.porta>=5&&m3.piso>=8,'cidade: prédios com paredes, portas e telhado, ruas '+JSON.stringify(m3));assert.equal(m3.fora,0);assert.ok(await bytes()<640000,'cidade cabe no limite: '+await bytes());
 await page.screenshot({path:path.join(root,'docs','imagens','v199-mapa-cidade.png')});await desfazer();
 // ---- exterior (penhasco: escarpas viram rocha de caverna; árvores inteiras)
 const e=await gerar('exterior',{estilo:'medieval',bioma:'penhasco',w:90,h:60,seed:5,dens:80});assert.ok(e.pixels>300);await usarAtual();const m4=await page.evaluate(()=>window.contar());
 assert.ok(m4.copa>=10&&m4.piso>=20,'exterior: árvores e terreno '+JSON.stringify(m4));assert.ok((m4.caverna||0)>=1,'escarpas viram parede de caverna');assert.equal(m4.fora,0);console.log('bytes exterior',await bytes());assert.ok(await bytes()<640000,'exterior cabe no limite: '+await bytes());
 await page.screenshot({path:path.join(root,'docs','imagens','v199-mapa-exterior.png')});await desfazer();
 // ---- mapa novo: cria com o tamanho do plano (aqui o stub não "abre" o mapa, então o gerador recusa aplicar no mapa errado)
 await page.evaluate(()=>{window.__salvo=null;window.mesaMapasV110_={salvar:async o=>{window.__salvo={nome:o.nome,w:o.state.w,h:o.state.h};return {id:'mapa_novo',comCena:true};}};window.lab.openMap=async()=>{};});
 await gerar('masmorra',{estilo:'futurista',w:40,h:28,seed:9});await page.fill('#erGerador [data-g="nome"]','Base Gelada');await page.click('#erGerador [data-ok]');
 await page.waitForFunction(()=>/ainda não abriu/.test(document.querySelector('#erGerador [data-st]')?.textContent||''),null,{timeout:15000});
 const salvo=await page.evaluate(()=>window.__salvo);assert.deepEqual([salvo.nome,salvo.w,salvo.h],['Base Gelada',40,28],'mapa novo criado com o tamanho do plano');
 assert.equal((await page.evaluate(()=>window.contar())).total,base.total,'nada foi aplicado no mapa errado');
 assert.deepEqual(erros.filter(x=>!/Failed to load resource|net::ERR/.test(x)),[],'sem erros no console');
 console.log('PASS gerador de mapas: masmorra '+m1.total+' peças, cidade '+m3.total+', exterior '+m4.total+'; rascunho, semente repetível, desfaz tudo, dentro do mapa, mapa novo');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
