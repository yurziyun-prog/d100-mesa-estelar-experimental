// v197 — 🎨 Editor rápido (estilo RPG Map), no Chrome de verdade com o módulo real da mesa:
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
 // ---- abrir
 await page.locator('#erBotao').click();await page.waitForSelector('#erPainel:not([hidden])');
 {await page.evaluate(()=>{const d=document.createElement('button');d.id='o3Botao';document.body.append(d);});const vis=id=>page.evaluate(i=>{const e=document.getElementById(i);return !!e&&getComputedStyle(e).display!=='none';},id);
  if(await vis('o3Botao'))throw Error('Oficina 3.0 devia estar escondida');
  await page.locator('#erAntigos').click();
  if(await vis('o3Botao'))throw Error('a Oficina 3.0 foi removida: o botão nunca aparece (v201)');
  await page.locator('#erAntigos').click();
 }
 const secoes=await page.evaluate(()=>[...document.querySelectorAll('#erPainel h5')].map(h=>h.textContent));
 assert.deepEqual(secoes,['Andares','Construir','Material · Parede','Apagar','Objetos','Geral','Pincéis','Luz','Modelos','Pincel de espalhar','Poças','Zoom'],'paleta na ordem: andares, construir (chão→copas), material, apagar, objetos');
 const ferrs=await page.evaluate(()=>[...document.querySelectorAll('#erPainel [data-f]')].map(b=>b.dataset.f));
 for(const f of ['parede','diagonal','cerca','caverna','comodo','tirar_area','tirar_bloco','borracha','modelo','conta_gotas','mover','porta','janela','objeto','luz','texto'])assert.ok(ferrs.includes(f),'ferramenta '+f);
 await page.waitForTimeout(800);const livre=await page.evaluate(()=>{const pn=document.getElementById('erPainel'),bd=document.getElementById('novaSyncBoard'),p=pn.getBoundingClientRect(),b=bd.getBoundingClientRect(),sc=bd.parentElement.getBoundingClientRect();return {ok:b.left>=p.right-1&&p.left>=sc.left&&b.right<=sc.right+4,rolou:bd.parentElement.scrollLeft};});
 assert.ok(livre.ok&&livre.rolou===0,'o painel fica ao lado do mapa (sem rolagem lateral): '+JSON.stringify(livre));
 // ---- 1) PAREDE = linha fina de espessura fixa, só reta (horizontal ou vertical)
 await arrastar([5.1,5.9],[9.1,7.5]);let L=await objs();
 assert.equal(L.length,1);const p1=L[0];assert.equal(p1.tipo,'parede');assert.ok(p1.h<=.31&&p1.w>4&&p1.w<4.4,'linha fina, não bloco de 1 m: '+p1.w+'×'+p1.h);assert.ok(perto(p1.x,7)&&perto(p1.y,6),'sobre as linhas da grade: '+p1.x+','+p1.y);assert.ok(p1.bloqueia&&p1.visao,'barra passo e visão');
 await arrastar([5.5,5.5],[5.5,5.5]);assert.equal((await objs()).length,1,'clique sem arrastar não faz parede');
 await page.locator('#erPainel [data-esp="0.5"]').click();await arrastar([3.5,14.5],[3.5,19.5]);L=await objs();const g=L.at(-1);assert.ok(perto(g.w,.5)&&g.h>5.4&&g.h<5.6,'parede grossa vertical 0,5 m: '+g.w+'×'+g.h);
 await page.locator('#erPainel [data-esp="0.3"]').click();
 // ---- 2) tirar área / tirar blocos cortam só o trecho da linha
 await ferramenta('tirar_area');const a0=area(await objs(),'parede');await arrastar([6.5,5.5],[7.5,5.5]);L=await objs();
 assert.ok(perto(a0-area(L,'parede'),2*.3,.02),'tirou 2 m da parede fina: '+(a0-area(L,'parede')).toFixed(2));
 await ferramenta('tirar_bloco');const a1=area(L,'parede');await clicar([8.5,5.5]);L=await objs();assert.ok(perto(a1-area(L,'parede'),.3,.05),'tirou 1 m (um bloco) da parede: '+(a1-area(L,'parede')).toFixed(2));
 // ---- 3) cômodo: 4 paredes finas no contorno + piso por dentro
 await ferramenta('comodo');await arrastar([12.5,5.5],[18.5,10.5]);L=await objs();
 assert.ok(perto(area(L,'piso'),42,.1),'piso 7×6 = 42 m²: '+area(L,'piso'));const topo=L.find(o=>o.tipo==='parede'&&perto(o.y,5,.02)&&o.w>7);assert.ok(topo&&perto(topo.h,.3),'parede de cima fina sobre o contorno');
 // ---- 4) porta e janela: do tamanho da parede (1 m de comprimento, mesma espessura)
 const antesP=area(L,'parede');await ferramenta('porta');await clicar([15.5,5.2]);L=await objs();const porta=L.find(o=>o.tipo==='porta');
 assert.ok(porta&&perto(porta.w,1,.02)&&perto(porta.h,.3,.02),'porta 1 m × espessura da parede: '+JSON.stringify(porta&&[porta.w,porta.h]));assert.ok(perto(antesP-area(L,'parede'),.3,.03),'vão aberto na parede');
 await ferramenta('janela');await clicar([12.1,8.5]);L=await objs();const jan=L.find(o=>o.tipo==='janela');assert.ok(jan&&perto(jan.w,.3,.02)&&perto(jan.h,1,.02),'janela na parede vertical: '+JSON.stringify(jan&&[jan.w,jan.h]));assert.ok(jan.bloqueia&&!jan.visao,'janela barra o passo e deixa ver');
 await ferramenta('porta');await clicar([30.5,20.5]);assert.equal((await objs()).filter(o=>o.tipo==='porta').length,1,'porta fora de parede não faz nada');
 // ---- 5) diagonal (45°), cerca (baixa), caverna (blocos)
 await ferramenta('diagonal');await arrastar([24,15],[28,19.3]);L=await objs();const dg=L.find(o=>o.diag);assert.ok(dg,'diagonal criada');assert.ok(Math.abs(Math.abs(dg.ang)-45)<1,'a 45°: '+dg.ang);assert.ok(L.filter(o=>o.bloco&&o.bloqueia).length>=4,'blocos invisíveis de colisão ao longo da diagonal');
 await ferramenta('cerca');await arrastar([30.5,15],[36.5,15.2]);L=await objs();const ce=L.find(o=>o.tipo==='cerca');assert.ok(ce&&ce.h<.2&&ce.bloqueia&&!ce.visao,'cerca baixa: barra o passo, deixa ver');
 await ferramenta('caverna');await arrastar([30.5,20.5],[33.5,22.5]);L=await objs();assert.ok(L.some(o=>o.tipo==='macico'&&o.w>=4&&o.h>=3),'caverna = massa orgânica de 4×3 quadrados (contorno suave, cantos arredondados)');
 {const cv=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().find(o=>o.erTipo==='macico'));assert.ok(cv&&cv.lacosV201&&cv.rectsV201.length>=1,'caverna: caminho suave guardado (v201)');{const svg=await page.evaluate(()=>[...document.querySelectorAll('[data-scene-object] path')].length);assert.ok(svg>=1,'caverna desenhada como contorno orgânico (SVG): '+svg);}{const q0=await px(29.5,19.5),q1=await px(34.5,23.5);await page.screenshot({path:'docs/imagens/v198-caverna.png',clip:{x:Math.max(0,q0.x),y:Math.max(0,q0.y),width:Math.max(40,q1.x-q0.x),height:Math.max(40,q1.y-q0.y)}});}}
 // ---- 6) piso (textura) e poça
 await mat('piso','areia');await arrastar([22.5,5.5],[27.5,8.5]);L=await objs();assert.ok(L.some(o=>o.tipo==='piso'&&/areia/.test(o.tex)),'piso de areia');
 const pisosPoca=(await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='piso').length));await page.locator('#erPainel [data-poca="agua"]').click();await page.locator('#erPainel [data-ter="pocaIrr"]').uncheck();await arrastar([22.5,12.5],[27.5,15.5]);
 assert.equal(await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='piso').length),pisosPoca,'a poça não corta o piso (sem linhas no chão)');
 assert.ok(await page.evaluate(()=>[...document.querySelectorAll('[data-scene-object] polygon')].some(p=>p.getAttribute('points').split(' ').length>=40)),'poça desenhada como mancha irregular (SVG), não como quadrado');L=await objs();assert.ok(L.some(o=>o.tipo==='poca'&&/agua/.test(o.tex)),'poça de água');
 await page.locator('#erPainel [data-poca="lava"]').click();await arrastar([29.5,12.5],[31.5,14.5]);L=await objs();assert.ok(L.some(o=>o.tipo==='poca'&&o.nome==='Poça · Lava'),'poça de lava');

 {await mat('copa','copa_conifera');await arrastar([26.5,3.5],[39.5,14.5]);
  const copa=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='copa').map(o=>({cor:o.cor,camada:o.camada,bloq:o.bloqueiaMovimento,visao:o.bloqueiaVisao,tex:o.texturaId||o.erTex,x:o.x*40/28,y:o.y*26/14,s:o.larguraM})));
  assert.ok(copa.length>=6,'a ferramenta Copas espalha várias árvores: '+copa.length);assert.ok(copa.every(t=>t.x-t.s/2>=26-.01&&t.x+t.s/2<=40+.01&&t.y-t.s/2>=3-.01&&t.y+t.s/2<=15+.01),'todas as árvores ficam INTEIRAS dentro do retângulo (nenhuma cortada)');assert.ok(copa.every(t=>t.s>=3&&t.s<=5.1),'coníferas de 3 a 5 m');assert.ok(copa[0].camada>5,'copa tem camada própria, acima do telhado');{const q0=await px(25.5,2.5),q1=await px(39.9,15.5);await page.screenshot({path:'docs/imagens/v198-copa-sobre-chao.png',clip:{x:Math.max(0,q0.x),y:Math.max(0,q0.y),width:Math.max(40,q1.x-q0.x),height:Math.max(40,q1.y-q0.y)}});}assert.equal(copa[0].cor,'transparent','copa sem fundo: os vãos mostram o chão');assert.ok(!copa[0].bloq&&!copa[0].visao,'copa deixa passar por baixo e não tapa a visão');
  const pisosAntes=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='piso').length);
  await mat('piso','chao_conifera');await arrastar([31.5,6.5],[33.5,8.5]);
  const depois=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais());
  assert.equal(depois.filter(o=>o.erTipo==='copa').length,copa.length,'piso por baixo não mexe nas árvores');assert.ok(depois.filter(o=>o.erTipo==='piso').length>=pisosAntes+1,'chão de floresta criado');
  /* copa e chão não viram parede */
  await ferramenta('parede');assert.equal(await page.locator('#erPainel [data-mat^="copa_"]').count(),0,'copas não são material de parede');assert.equal(await page.locator('#erPainel [data-mat="ouro"],#erPainel [data-mat="flores_azuis"],#erPainel [data-mat="agua_rasa"]').count(),3,'qualquer material serve para parede (ouro, flores, água…)');
  await ferramenta('copa');assert.ok(await page.locator('#erPainel [data-mat^="copa_"]').count()>=9&&await page.locator('#erPainel [data-mat="tijolo"]').count()===0,'a ferramenta Copas mostra só copas');
  /* telhado comum fica por cima e abre */
  await mat('telhado','telha');await arrastar([30.5,10.5],[34.5,12.5]);
  const tel=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='telhado'));assert.ok(tel.length===1&&tel[0].camada===5&&tel[0].tetoV139&&!tel[0].bloqueiaMovimento,'telhado por cima, abre e não bloqueia');
  /* escada, rampa e poço */
  await page.locator('#erPainel [data-f="escada"]').click();await arrastar([20.5,24.5],[22.5,25.5]);
  await page.locator('#erPainel [data-f="rampa"]').click();await arrastar([24.5,24.5],[27.5,25.5]);
  await page.locator('#erPainel [data-f="poco"]').click();await clicar([30.5,24.5]);
  const ex=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().map(o=>({t:o.erTipo,n:o.nome,deg:o.degradeV198,b:o.bloqueiaMovimento,f:o.forma})));
  assert.ok(ex.some(o=>o.t==='escada'),'escada criada');{const lig=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='escada'||o.erTipo==='rampa').map(o=>!!(o.escadaAndarV144&&o.andarAmbosV144&&o.andarBaseV198===1)));assert.ok(lig.length>=2&&lig.every(Boolean),'escada e rampa levam ao andar de cima');const des=await page.evaluate(()=>[...document.querySelectorAll('[data-scene-object] svg')].filter(s=>s.querySelectorAll('rect').length>8||s.querySelectorAll('polyline').length>0).length);assert.ok(des>=2,'escada e rampa desenhadas de cima (SVG): '+des);}assert.ok(ex.some(o=>o.t==='rampa'&&!o.b),'rampa sem bloquear');assert.ok(ex.filter(o=>o.t==='poco').length===2&&ex.some(o=>o.t==='poco'&&o.b&&o.f==='circle'),'poço de pedra + água');}
 {
  /* parede sobre parede ou sobre telhado = andar de cima; piso e copa no andar escolhido */
  {const info=()=>page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='parede'&&o.larguraM<1&&o.alturaM<1.5||o.erTipo==='parede').map(o=>({a:o.andarV144||1,x:o.x*40/28,y:o.y*26/14})));
   await page.locator('#erPainel [data-andar="1"]').click();await mat('telhado','telha');await arrastar([2.5,24.5],[6.5,25.5]);await ferramenta('parede');await arrastar([3,25],[6,25]);
   const sobTeto=(await info()).filter(o=>o.y>24.5&&o.y<25.5&&o.x<7);assert.ok(sobTeto.some(o=>o.a===2),'parede sobre telhado fica no andar 2');
   assert.equal(await page.evaluate(()=>document.querySelector('#erPainel [data-andar][aria-pressed="true"]').dataset.andar),'2','o seletor foi para o andar 2');
   await page.locator('#erPainel [data-andar="1"]').click();await arrastar([8,24],[12,24]);await page.locator('#erPainel [data-andar="1"]').click();await arrastar([8,24],[12,24]);
   const dupla=(await info()).filter(o=>Math.abs(o.y-24)<.4&&o.x>7.5&&o.x<12.5);assert.ok(dupla.some(o=>o.a===1)&&dupla.some(o=>o.a===2),'parede sobre parede: a segunda vai para o andar 2');
   await page.locator('#erPainel [data-andar="2"]').click();await mat('piso','jade');await arrastar([14.5,24.5],[16.5,25.5]);
   const pisoA2=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='piso'&&o.andarV144===2).map(o=>o.pisoAndarV144));assert.ok(pisoA2.length&&pisoA2.every(v=>v===2),'piso no andar 2 cobre o de baixo');
   await page.locator('#erPainel [data-andar="1"]').click();
   const copaAnd=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='copa').map(o=>!!o.andarAmbosV144));assert.ok(copaAnd.length&&copaAnd.every(v=>!v),'copa segue o andar escolhido (não é fixa)');}
  const n2base=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.andarV144>1).length);
  /* cômodos: um por cima do outro vira uma sala só (sem parede no meio); ao lado, fica uma parede entre eles */
  {const nParedes=async()=>page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.erTipo==='parede'&&o.erSala).map(o=>({s:o.erSala,x:o.x*40/28,y:o.y*26/14,w:o.larguraM,h:o.alturaM}))).then(L=>L.filter(o=>o.y>17&&o.x<17));
   await ferramenta('comodo');await arrastar([2.5,18.5],[8.5,22.5]);const a1=await nParedes();const salas1=new Set(a1.map(o=>o.s)).size;assert.equal(salas1,1,'uma sala');
   await arrastar([5.5,19.5],[11.5,22.5]);const a2=await nParedes();assert.equal(new Set(a2.map(o=>o.s)).size,1,'sobrepostos viram UMA sala');
   assert.ok(!a2.some(o=>o.w<1&&o.h>1&&Math.abs(o.x-5.5)<.6&&o.y<22),'sem parede no meio da sala fundida');
   assert.ok(a2.some(o=>o.w>6&&Math.abs(o.x-7)<1.5),'o contorno de fora continua');
   await arrastar([12.5,18.5],[15.5,22.5]);const a3=await nParedes();const meio=a3.filter(o=>o.h>1&&o.w<1&&Math.abs(o.x-12)<.6);assert.ok(meio.length>=1,'cômodo ao lado: continua uma parede entre as duas salas ('+meio.length+')');{const q0=await px(1.5,17.5),q1=await px(16.5,23.5);await page.screenshot({path:'docs/imagens/v198-comodos.png',clip:{x:Math.max(0,q0.x),y:Math.max(0,q0.y),width:Math.max(40,q1.x-q0.x),height:Math.max(40,q1.y-q0.y)}});}}
  /* sem escolher andar: cômodo por cima de outro se funde (continua no andar 1) */
  await ferramenta('comodo');await arrastar([11.5,22.5],[17.5,25.5]);await arrastar([12.5,23.5],[15.5,25.5]);
  assert.equal((await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.andarV144>1).length)),n2base,'cômodo sobre cômodo (sem telhado) não cria andar');
  /* escolhendo o andar 2: o cômodo vira o andar de cima e o de baixo não é cortado */
  const antes=(await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais())).filter(o=>(o.andarV144||1)===1&&(o.erTipo==='parede'||o.erComodo)).length;
  await page.locator('#erPainel [data-andar="2"]').click();await ferramenta('comodo');await arrastar([12.5,23.5],[15.5,25.5]);
  const dep=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais());
  const a2=dep.filter(o=>o.andarV144===2);assert.ok(a2.length>=5,'andar 2 criado: '+a2.length);assert.ok(a2.some(o=>o.erComodo&&o.pisoAndarV144===2),'o chão do andar 2 cobre o de baixo');
  assert.equal(dep.filter(o=>(o.andarV144||1)===1&&(o.erTipo==='parede'||o.erComodo)).length,antes,'o andar de baixo ficou intacto');
  await page.locator('#erPainel [data-andar="1"]').click();}
 {const chao=()=>page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.nome==='Chão do mapa').map(o=>o.texturaId));
  /* a paleta não pula para o topo ao escolher algo */
  await ferramenta('piso');await page.evaluate(()=>{document.querySelector('#erPainel .er-corpo').scrollTop=400;});const rolA=await page.evaluate(()=>document.querySelector('#erPainel .er-corpo').scrollTop);
  await page.evaluate(()=>document.querySelector('#erPainel [data-mat="jade"]').click());const rolB=await page.evaluate(()=>document.querySelector('#erPainel .er-corpo').scrollTop);assert.ok(rolA>100&&Math.abs(rolA-rolB)<2,'a rolagem da paleta não volta ao topo: '+rolA+' → '+rolB);
  await ferramenta('comodo');await page.evaluate(()=>{document.querySelector('#erPainel .er-corpo').scrollTop=0;});await page.locator('#erPainel').screenshot({path:'docs/imagens/v198-paleta.png'});
  const n0=(await objs()).length;await mat('piso','grama');await arrastar([36.5,22.5],[38.5,24.5]);await mat('poca','agua').catch(()=>{});
  await mat('chao','marmore_negro');const chaoPecas=await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().filter(o=>o.nome==='Chão do mapa').map(o=>o.larguraM*o.alturaM));assert.equal(chaoPecas.length,1,'o chão do mapa é UMA peça inteira, mesmo com pisos por cima');
  const c1=await chao();assert.deepEqual(c1,['marmore_negro'],'chão do mapa trocado, sem duplicar: '+c1);const n1=(await objs()).length;
  await mat('chao','jade');
  assert.deepEqual(await chao(),['jade'],'trocou de novo');assert.equal((await objs()).length,n1,'trocar o chão não cria peças novas');
  const fundida=await page.evaluate(()=>{const ps=[...document.querySelectorAll('[data-scene-object]')].filter(n=>/tijolo|pedra|rocha|marmore|metal/.test(n.style.backgroundImage)&&n.style.backgroundPosition);return ps.length;});
  assert.ok(fundida>0,'paredes sem borda própria e com textura alinhada ao mapa');} await mat('piso','grama');await arrastar([22.5,6.5],[24.5,7.5]);L=await objs();assert.ok(L.some(o=>/grama/.test(o.tex)),'piso de grama por cima');
 // ---- 7) móveis
 await ferramenta('objeto');await page.locator('#erPainel [data-busca]').fill('mesa');await page.waitForTimeout(150);
 const achou=await page.evaluate(()=>[...document.querySelectorAll('#erPainel [data-obj]')].map(b=>b.dataset.obj));assert.deepEqual(achou,['mesa_madeira'],'busca filtra a lista: '+achou);
 await page.locator('#erPainel [data-obj="mesa_madeira"]').click();await clicar([14,8]);L=await objs();assert.ok(L.some(o=>o.modelo==='mesa_madeira'&&o.tipo==='objeto'),'móvel posto');
 await page.keyboard.press('r');await clicar([14,9.5]);L=await objs();assert.ok(L.filter(o=>o.modelo==='mesa_madeira').some(o=>o.ang===90),'R gira o móvel antes de pôr');
 // ---- 8) botão direito: pincel de rocha (blocos)
 await arrastar([3.5,22.5],[10.5,22.5],{botao:'right'});L=await objs();assert.ok(L.some(o=>o.tipo==='macico'&&o.y>21&&o.y<24&&o.w>=7),'direito desenha rocha (massa orgânica)');
 // ---- 9) Alt+arrastar move; Ctrl+Alt duplica
 const mesa=L.find(o=>o.modelo==='mesa_madeira'&&o.ang===0);const n0=L.length;
 await arrastar([mesa.x,mesa.y],[mesa.x+3,mesa.y-1],{alt:true});L=await objs();const mov=L.find(o=>o.id===mesa.id);assert.ok(Math.abs(mov.x-(mesa.x+3))<.6,'Alt+arrastar moveu');
 await arrastar([mov.x,mov.y],[mov.x+4,mov.y],{alt:true,ctrl:true});L=await objs();assert.equal(L.length,n0+1,'Ctrl+Alt duplicou');
 // ---- 10) borracha apaga a diagonal INTEIRA (com os blocos de colisão)
 await ferramenta('borracha');await arrastar([25.5,16.5],[26.5,17.5]);L=await objs();assert.ok(!L.some(o=>o.diag)&&!(await page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().some(o=>o.erBloco&&!o.grupoV201))),'borracha tirou a diagonal e os blocos dela');
 await arrastar([22.5,12.5],[27.5,15.5]);L=await objs();assert.ok(!L.some(o=>o.tipo==='poca'&&/agua/.test(o.tex)),'borracha apagou a poça de água');
 // ---- 11) modelos, luz e texto
 await ferramenta('modelo');await page.locator('#erPainel [data-modelo="scifi_sala"]').click();const nM0=(await objs()).length;await clicar([33,6]);L=await objs();
 assert.ok(L.length>nM0+8,'modelo Sala sci-fi carimbado: +'+(L.length-nM0));assert.ok(L.some(o=>o.tipo==='porta'&&o.x>28),'portas do modelo');assert.ok(L.filter(o=>o.tipo==='parede'&&o.x>28&&/metal/.test(o.tex)).every(o=>o.h<=.31||o.w<=.31),'paredes do modelo são finas');
 await page.keyboard.press('Control+z');await page.waitForTimeout(150);assert.equal((await objs()).length,nM0,'um Ctrl+Z desfaz o modelo inteiro');await page.keyboard.press('Control+y');await page.waitForTimeout(150);
 await ferramenta('luz');await page.locator('#erPainel [data-luzcor="#7ad7ff"]').click();await clicar([20,19]);L=await objs();assert.ok(L.some(o=>o.tipo==='luz'),'luz posta');
 await page.evaluate(()=>{window.prompt=()=>'Reator 1';});await ferramenta('texto');await clicar([20,22]);L=await objs();assert.ok(L.some(o=>o.tipo==='texto'),'texto posto');
 // ---- 11b) todos os modelos carimbam sem erro e um Ctrl+Z desfaz cada um
 await ferramenta('modelo');const modelos=await page.evaluate(()=>[...document.querySelectorAll('#erPainel [data-modelo]')].map(b=>b.dataset.modelo));assert.ok(modelos.length>=11,'modelos na paleta: '+modelos.length);
 for(const m of modelos){await page.locator('#erPainel [data-modelo="'+m+'"]').click();const n=(await objs()).length;await clicar([20,13]);const k=(await objs()).length;assert.ok(k>n+2,'modelo '+m+' carimbou ('+(k-n)+' peças)');await page.keyboard.press('Control+z');await page.waitForTimeout(100);assert.equal((await objs()).length,n,'Ctrl+Z desfez '+m);}
 // ---- 12) zoom 200% com o mapa ampliado
 await page.locator('#erPainel [data-z="2"]').click();await page.waitForTimeout(900);
 const esc2=await page.evaluate(()=>{const b=document.getElementById('novaSyncBoard');return b.getBoundingClientRect().width/b.offsetWidth;});assert.ok(esc2>1.8&&esc2<2.2,'mapa ampliado 200%: '+esc2.toFixed(2));
 {/* zoom pela roda do mouse (sem Ctrl), contínuo, ao redor do ponteiro; limite de 8× para o mestre */
  const pc=await px(20,13);await page.mouse.move(pc.x,pc.y);await page.mouse.wheel(0,-700);await page.waitForTimeout(700);
  const zA=await page.evaluate(()=>window.mesaCameraV144.zoom());assert.ok(zA>3.5,'a roda amplia livremente (mestre): '+zA.toFixed(2));
  await page.mouse.wheel(0,-9000);await page.waitForTimeout(500);const zB=await page.evaluate(()=>window.mesaCameraV144.zoom());assert.ok(zB<=8.01&&zB>6,'limite de 8× para o mestre: '+zB.toFixed(2));
  await page.mouse.wheel(0,9000);await page.waitForTimeout(700);const zC=await page.evaluate(()=>window.mesaCameraV144.zoom());assert.ok(zC<1.05,'a roda volta ao mapa inteiro: '+zC.toFixed(2));
  await page.evaluate(()=>document.querySelector('#camPan [data-p="seguir"]')?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));await page.locator('#erPainel [data-z="2"]').click();await page.waitForTimeout(1000);}
 await ferramenta('parede');const nZ=(await objs()).length;await arrastar([19.2,12.9],[23.2,12.9]);L=await objs();assert.equal(L.length,nZ+1,'desenhou com o mapa ampliado');const pz=L.at(-1);assert.ok(perto(pz.x,21,.05)&&perto(pz.y,13,.05),'no lugar certo com zoom: '+pz.x+','+pz.y);
 await page.locator('#erPainel [data-z="1"]').click();await page.waitForTimeout(900);
 // ---- 13) NPCs: a grade de caminhos enxerga a parede do rascunho (ainda não salva) e não dá para atravessar
 await arrastar([0.2,17.1],[39.8,17.1]);
 const cam=await page.evaluate(async({W,H})=>{const {montarGrade,caminho}=await import('/mesa-tempo-real-ia.js');
  const salva=window.store['combatesAtivos/mapaMesaSyncDiretaCena'];const c=window.mesaRascunhoCenaV197_(salva);
  const lista=(c.objects||[]).filter(o=>o.bloqueiaMovimento&&!o.destruido&&Number(o.camada||3)===3).map(o=>({x:o.x*W/28,y:o.y*H/14,larguraM:o.larguraM,alturaM:o.alturaM,angulo:o.angulo||0}));
  const g=montarGrade(lista,W,H,{passo:.5});const lado=caminho(g,{x:5,y:16.2},{x:35,y:16.2}),atravessa=caminho(g,{x:10,y:16.2},{x:10,y:17.9});
  const g0=montarGrade(lista.filter(o=>!(o.larguraM>30)),W,H,{passo:.5}),semParede=caminho(g0,{x:10,y:16.2},{x:10,y:17.9});
  return {salvaTem:(salva.objects||[]).length,rascunhoTem:(c.objects||[]).length,lado:!!(lado&&lado.length),atravessa:!!(atravessa&&atravessa.length),semParede:!!(semParede&&semParede.length)};},{W,H});
 assert.equal(cam.salvaTem,0);assert.ok(cam.rascunhoTem>10,'a cena que a IA lê inclui o rascunho');assert.ok(cam.lado,'anda ao longo do lado da parede');assert.equal(cam.atravessa,false,'NÃO atravessa a parede fina de ponta a ponta');assert.ok(cam.semParede,'sem a parede o caminho existiria (o teste é válido)');
 // ---- 14) mapa novo do zero
 await page.evaluate(()=>{window.__salvo=null;window.__aberto=null;window.mesaMapasV110_={salvar:async o=>{window.__salvo={nome:o.nome,w:o.state.w,h:o.state.h,cena:o.cenaDe('mapa_novo')};return {id:'mapa_novo',comCena:true};}};window.lab.openMap=async id=>{window.__aberto=id;};window.confirm=()=>true;});
 await page.locator('#erPainel [data-a="novo"]').click();await page.waitForSelector('#erNovo');
 await page.fill('#erNovo [data-n]','Bairro do Porto');await page.fill('#erNovo [data-w]','60');await page.fill('#erNovo [data-h]','30');await page.selectOption('#erNovo [data-p]','grama');await page.click('#erNovo [data-ok]');
 await page.waitForFunction(()=>window.__aberto,null,{timeout:5000});const nv=await page.evaluate(()=>({s:window.__salvo,a:window.__aberto}));
 assert.equal(nv.a,'mapa_novo','abriu o mapa novo');assert.deepEqual([nv.s.nome,nv.s.w,nv.s.h],['Bairro do Porto',60,30]);assert.ok((nv.s.cena.objects||[]).some(o=>o.nome==='Chão do mapa'&&/grama/.test(o.textura||'')&&o.larguraM===60),'mapa novo com piso de fundo');
 // ---- 15) rascunho: nada gravado; desfazer/refazer por gesto; salvar
 const grav=await page.evaluate(()=>(window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects||[]).length);assert.equal(grav,0,'nada gravado antes de salvar');
 const nA=(await objs()).length;await page.keyboard.press('Control+z');await page.waitForTimeout(150);const nB=(await objs()).length;assert.notEqual(nB,nA,'Ctrl+Z desfez o último gesto');
 await page.keyboard.press('Control+y');await page.waitForTimeout(150);assert.equal((await objs()).length,nA,'Ctrl+Y refez');
 await page.locator('#erPainel [data-a="salvar"]').click();await page.waitForTimeout(400);
 const salvo=await page.evaluate(()=>(window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects||[]).length);assert.equal(salvo,nA,'salvar grava tudo de uma vez: '+salvo+' objetos');
 // ---- galerias de modelos (imagens para conferir o visual)
 const foto=async nome=>{await page.evaluate(()=>window.mesaEditorRapidoV197.ferramenta('parede'));await page.mouse.move(2,2);await page.waitForTimeout(500);await page.locator('#novaSyncBoard').scrollIntoViewIfNeeded();
  const sb=await page.evaluate(()=>{const r=document.getElementById('novaSyncBoard').getBoundingClientRect();return {x:Math.max(0,r.x),y:Math.max(0,r.y),width:Math.min(r.width,1500),height:Math.min(r.height,1000)};});await page.screenshot({path:path.join(root,'docs/imagens/'+nome),clip:sb});};
 const estampar=async(id,c)=>{await ferramenta('modelo');await page.locator('#erPainel [data-modelo="'+id+'"]').click();await clicar(c);};
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 await estampar('trono',[8,7]);await estampar('templo_jade',[24,7]);await estampar('laboratorio',[9,19]);await estampar('galpao_ferrugem',[28,19]);await foto('v197-modelos-1.png');
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 await estampar('quarteirao',[14,9]);await estampar('taverna',[33,7]);await estampar('scifi_sala',[33,19]);await estampar('salao_marmore',[11,22]);await foto('v197-modelos-2.png');
 // ---- imagem
 await ferramenta('modelo');await page.locator('#erPainel [data-modelo="taverna"]').click();await page.evaluate(()=>window.mesaEditorRapidoV197.ferramenta('parede'));await page.waitForTimeout(300);await page.locator('#novaSyncBoard').scrollIntoViewIfNeeded();
 const sb=await page.evaluate(()=>{const r=document.getElementById('novaSyncBoard').parentElement.getBoundingClientRect();return {x:Math.max(0,r.x),y:Math.max(0,r.y),width:Math.min(r.width,1500),height:Math.min(r.height,1000)};});await page.screenshot({path:path.join(root,'docs/imagens/v197-editor-rapido.png'),clip:sb});
 assert.deepEqual(erros,[]);
 console.log('PASS editor rápido: parede fina em linha, diagonal, cerca, caverna, cômodo, porta/janela do tamanho da parede, pisos, poças, móveis, luz, texto, modelos, zoom, NPC não atravessa, mapa novo do zero, desfazer/refazer e salvar ('+salvo+' objetos)');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
