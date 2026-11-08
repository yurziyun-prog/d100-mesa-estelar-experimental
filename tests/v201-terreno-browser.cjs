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
 // ---- abrir
 await page.locator('#erBotao').click();await page.waitForSelector('#erPainel:not([hidden])');
 const O=()=>page.evaluate(()=>window.mesaRascunhoMapaV193.objetosAtuais().map(o=>({id:o.id,tipo:o.erTipo||'',nome:o.nome||'',grupo:o.grupoV201||'',bloco:!!o.erBloco,lacos:!!o.lacosV201,andar:o.andarV144||1,w:o.larguraM,h:o.alturaM,x:o.x*40/28,y:o.y*26/14,tex:o.erTex||'',bloqueia:!!o.bloqueiaMovimento})));
 const foto=async n=>{await page.locator('#novaSyncBoard').scrollIntoViewIfNeeded();await page.waitForTimeout(200);const sb=await page.evaluate(()=>{const r=document.getElementById('novaSyncBoard').parentElement.getBoundingClientRect();return {x:Math.max(0,r.x),y:Math.max(0,r.y),width:Math.min(r.width,1500),height:Math.min(r.height,1000)};});await page.screenshot({path:path.join(root,'docs','imagens',n),clip:sb});};
 // 1) espessura livre: botão Fortaleza (2 m) e campo "Espessura (m)"
 await ferramenta('parede');
 const botoes=await page.evaluate(()=>[...document.querySelectorAll('#erPainel [data-esp]')].map(b=>b.dataset.esp));
 assert.deepEqual(botoes,['0.2','0.3','0.5','1','2'],'presets de espessura, com Fortaleza (2 m)');
 await page.locator('#erPainel [data-esp="2"]').click();await arrastar([4,4],[14,4]);let L=await O();let p=L.at(-1);
 assert.ok(p.tipo==='parede'&&perto(p.h,2,.05)&&p.w>10,'muro de 2 m de grossura: '+p.w+'×'+p.h);
 await page.locator('#erPainel [data-espnum]').fill('3.5');await page.locator('#erPainel [data-espnum]').dispatchEvent('change');await page.waitForTimeout(200);
 await arrastar([4,9],[14,9]);L=await O();p=L.at(-1);assert.ok(perto(p.h,3.5,.05),'espessura livre 3,5 m: '+p.h);
 assert.equal(await page.locator('#erPainel [data-espnum]').inputValue(),'3.5','o campo guarda o valor');
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 await page.locator('#erPainel [data-esp="0.3"]').click();
 // 2) cordilheira sem pontas = planalto
 await ferramenta('cordilheira');
 const ter=await page.evaluate(()=>({tit:document.querySelector('#erPainel .er-terreno h5')?.textContent,pont:!!document.querySelector('#erPainel [data-ter="pontiaguda"]'),res:document.querySelector('#erPainel [data-terres]')?.textContent}));
 assert.ok(/Cordilheira/.test(ter.tit)&&ter.pont&&/planalto/.test(ter.res),'painel da cordilheira: '+JSON.stringify(ter));
 await arrastar([3.5,3.5],[26.5,15.5]);L=await O();
 const massas=L.filter(o=>o.tipo==='macico'&&/Paredão/.test(o.nome)),rampasRocha=L.filter(o=>o.tipo==='macico'&&/Rampa/.test(o.nome)),topo=L.filter(o=>o.tipo==='macicoTopo'),rochas=L.filter(o=>o.bloco),rampas=L.filter(o=>o.tipo==='rampa');
 console.log('planalto:',massas.length,'massa,',rochas.length,'blocos de colisão,',topo.length,'topo,',rampas.length,'rampas');
 assert.ok(massas.length===1&&rochas.length>5&&topo.length===1&&rampas.length>=1,'planalto montado: 1 massa de rocha, 1 topo, blocos e rampas');
 assert.ok(rampasRocha.length===rampas.length&&rampasRocha.every(o=>o.lacos),'cada rampa tem sua massa de rocha orgânica (mesma textura da cordilheira)');
 assert.ok(massas[0].lacos&&topo[0].lacos,'desenhados como contorno suave (SVG), não em blocos');
 assert.ok(topo.every(o=>o.andar===2),'o topo fica no andar de cima (2)');assert.ok(rochas.every(o=>o.andar===1&&o.bloqueia),'o paredão fica no andar 1 e barra o passo');
 assert.ok(new Set([...massas,...topo,...rochas,...rampas].map(o=>o.grupo)).size===1,'tudo do terreno é um grupo (anda junto)');
 const bx=[...rochas].reduce((a,o)=>({x0:Math.min(a.x0,o.x-o.w/2),x1:Math.max(a.x1,o.x+o.w/2),y0:Math.min(a.y0,o.y-o.h/2),y1:Math.max(a.y1,o.y+o.h/2)}),{x0:99,x1:-99,y0:99,y1:-99});
 assert.ok(bx.x0>=2.9&&bx.x1<=27.1&&bx.y0>=2.9&&bx.y1<=16.1,'tudo dentro do retângulo arrastado: '+JSON.stringify(bx));
 await foto('v201-planalto.png');
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 // 3) pontiaguda e muito pontiaguda = colinas escarpadas
 await page.locator('#erPainel [data-ter="pontiaguda"]').check();await page.waitForTimeout(100);
 const pontas=await page.evaluate(()=>{const r=document.querySelector('#erPainel [data-ter="pontas"]');return {vis:!!r&&!r.closest('[hidden]'),val:r?.value};});assert.ok(pontas.vis,'o controle "Pontas" aparece ao marcar Pontiaguda: '+JSON.stringify(pontas));
 await page.locator('#erPainel [data-ter="pontas"]').fill('45');await page.locator('#erPainel [data-ter="pontas"]').dispatchEvent('input');
 assert.ok(/planalto/.test(await page.locator('#erPainel [data-terres]').innerText()),'45% ainda é planalto');
 await page.locator('#erPainel [data-ter="pontas"]').fill('90');await page.locator('#erPainel [data-ter="pontas"]').dispatchEvent('input');
 assert.ok(/escarpadas/.test(await page.locator('#erPainel [data-terres]').innerText()),'90% vira colinas escarpadas');
 await arrastar([3.5,3.5],[26.5,15.5]);L=await O();
 const esc=L;console.log('escarpada:',esc.length,'peças');
 assert.ok(esc.filter(o=>o.bloco).length>10&&esc.some(o=>o.tipo==='macico'),'rocha recortada com blocos de colisão');assert.equal(L.filter(o=>o.andar>1).length,0,'colinas escarpadas não têm topo elevado');
 await foto('v201-escarpada.png');
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 // 4) caverna natural
 await ferramenta('caverna_nat');
 await arrastar([2.5,2.5],[34.5,22.5]);L=await O();
 const cav=L.filter(o=>o.bloco),chao=L.filter(o=>o.tipo==='macicoTopo');console.log('caverna natural:',cav.length,'blocos de colisão,',chao.length,'chão');
 assert.ok(cav.length>20&&chao.length===1&&L.some(o=>o.tipo==='macico'),'caverna natural montada (massa de rocha + chão)');
 await foto('v201-caverna.png');
 await arrastar([5.5,5.5],[8.5,8.5]);assert.ok(/pelo menos 8/.test(await page.evaluate(()=>document.getElementById('erDicas').innerText)),'área pequena: avisa o mínimo');
 // 5) pincel de rocha com tamanho
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 await ferramenta('caverna');await page.locator('#erPainel [data-ter="pincel"]').selectOption('4');
 const a0=(await O()).length;await arrastar([10,10],[16,10],{botao:'right'});L=await O();
 const areaP=L.filter(o=>o.tipo==='macico').reduce((s,o)=>s+o.w*o.h,0);assert.ok(areaP>=20,'pincel de 4 m pinta uma faixa larga: '+areaP.toFixed(1)+' m²');
 // 6) a seta (Selecionar e mover): clicar numa peça e arrastar, sem Alt
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 const primeira=await page.evaluate(()=>document.querySelector('#erPainel [data-f]').dataset.f);assert.equal(primeira,'mover','a seta é a primeira ferramenta da paleta');
 await ferramenta('parede');await arrastar([5,6.5],[12,6.5]);let Lm=await O();const par=Lm.at(-1);assert.equal(par.tipo,'parede');
 await ferramenta('mover');
 assert.ok(await page.evaluate(()=>document.getElementById('novaSyncBoard').classList.contains('er-mover')),'o mapa fica com o cursor de mãozinha');
 await arrastar([8.5,7],[8.5,11]);Lm=await O();const mov=Lm.find(o=>o.id===par.id);
 assert.ok(mov&&perto(mov.y-par.y,4,.6)&&perto(mov.x,par.x,.3),'a parede foi arrastada 4 m para baixo com a seta: dy='+(mov&&(mov.y-par.y).toFixed(2)));
 await arrastar([20.5,20.5],[22.5,20.5]);assert.equal((await O()).length,Lm.length,'arrastar o vazio não faz nada');
 // 7) gerador de mapas: tipo Caverna (massa orgânica) e seletor de grossura das paredes
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 await page.evaluate(()=>window.mesaEditorRapidoV197.gerador());await page.waitForSelector('#erGerador');
 const opcoes=await page.evaluate(()=>({tipos:[...document.querySelectorAll('#erGerador [data-g="tipo"] option')].map(o=>o.value),esp:[...document.querySelectorAll('#erGerador [data-g="esp"] option')].map(o=>o.value)}));
 assert.ok(opcoes.tipos.includes('caverna'),'o gerador tem o tipo Caverna: '+opcoes.tipos);assert.deepEqual(opcoes.esp,['','.25','.4','.6','1','2','custom'],'seletor de grossura');
 const espVis=async()=>page.evaluate(()=>getComputedStyle(document.querySelector('#erGerador [data-espblk]')).display!=='none');
 assert.ok(await espVis(),'masmorra mostra a grossura das paredes');
 await page.selectOption('#erGerador [data-g="tipo"]','caverna');await page.waitForTimeout(150);assert.ok(!(await espVis()),'caverna não usa parede fina: esconde a grossura');
 await page.fill('#erGerador [data-g="seed"]','5');await page.click('#erGerador [data-gerar]');await page.waitForSelector('#erGerador [data-ok]:not([disabled])',{timeout:20000});
 await page.check('#erGerador input[name="erGdest"][value="atual"]');await page.click('#erGerador [data-ok]');await page.waitForSelector('#erGerador',{state:'detached',timeout:20000});await page.waitForTimeout(300);
 L=await O();console.log('caverna gerada:',L.length,'objetos');
 assert.ok(L.some(o=>o.tipo==='macico')&&L.some(o=>o.tipo==='macicoTopo')&&L.filter(o=>o.bloco).length>10,'caverna gerada = massa orgânica + chão + blocos');
 await foto('v201-gerador-caverna.png');
 // 8) poças com forma irregular (opção) ou retangular de antes
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 await page.evaluate(()=>document.querySelector('#erPainel [data-poca="agua"]').click());await page.waitForTimeout(150);
 assert.ok(await page.evaluate(()=>!!document.querySelector('#erPainel [data-ter="pocaIrr"]:checked')),'forma irregular marcada por padrão na poça');
 await arrastar([6.5,6.5],[14.5,11.5]);L=await O();
 const lago=L.find(o=>o.tipo==='macicoTopo');assert.ok(lago&&lago.lacos,'poça irregular = contorno orgânico');
 await foto('v201-poca-irregular.png');
 await page.locator('#erPainel [data-ter="pocaIrr"]').uncheck();await arrastar([20.5,6.5],[26.5,10.5]);L=await O();
 assert.ok(L.some(o=>o.tipo==='poca'),'sem a caixa, sai a poça de antes (retângulo)');
 // 9) apagador de um clique
 await page.evaluate(()=>window.mesaRascunhoMapaV193.descartar());await page.waitForTimeout(200);
 await ferramenta('parede');await arrastar([8,12],[14,12]);assert.equal((await O()).length,1);
 await ferramenta('apagar_peca');await clicar([11,12]);assert.equal((await O()).length,0,'o apagador de um clique tira a peça inteira');
 await ferramenta('cordilheira');await arrastar([3.5,3.5],[22.5,14.5]);let Lc=await O();assert.ok(Lc.length>5);
 const rocha=Lc.find(o=>o.bloco);await clicar([rocha.x,rocha.y]);await ferramenta('apagar_peca');await clicar([rocha.x,rocha.y]);
 Lc=await O();assert.ok(Lc.filter(o=>o.tipo==='macico'&&/Paredão/.test(o.nome)).length===0,'apagar uma rocha tira a massa e os blocos dela');
 // 10) miniaturas continuam clicáveis com o editor aberto (o editor não engole o clique)
 await ferramenta('parede');
 const livre=await page.evaluate(()=>{const b=document.getElementById('novaSyncBoard'),t=document.createElement('div');t.dataset.token='teste_tk';t.style.cssText='position:absolute;left:40%;top:40%;width:40px;height:40px';b.append(t);const r0=t.getBoundingClientRect();t.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:7,clientX:r0.left+5,clientY:r0.top+5}));const st=window.mesaEditorRapidoV197.estado().arrasto;t.remove();return st;});
 assert.equal(livre,'','clicar numa miniatura com uma ferramenta ativa não inicia desenho: o editor deixa o clique passar')
 // 11) Galeria 3D: ver, marcar 👍 e escolher a criatura que cada miniatura substitui (salvo e exportável)
 await page.evaluate(async()=>{window.__g3={};const m=await import('/mesa-galeria3d.js');await m.abrirGaleria3D({root:document,dep:{db:{},doc:(d,...x)=>x.join('/'),getDoc:async p=>({exists:()=>!!window.__g3[p],data:()=>window.__g3[p]}),setDoc:async(p,d)=>{window.__g3[p]=d;},criaturas:()=>[{id:'zumbi_1',nome:'Cadáver de trabalhador'},{id:'carnical_dominante',nome:'Carniçal Dominante'}],npcs:()=>[]}});});
 await page.waitForSelector('#g3Fundo .g3-card');
 const total=await page.locator('#g3Fundo .g3-card').count();console.log('galeria 3D: cartões =',total);assert.ok(total>=50,'mostra todos os modelos 3D');
 const anim=await page.evaluate(()=>{const a=document.querySelector('#g3Fundo .g3-anim');return {img:a.style.backgroundImage,anim:getComputedStyle(a).animationName};});assert.ok(/miniaturas3d\/.+_andar_lado\.webp/.test(anim.img)&&anim.anim==='g3x','a vitrine anima a folha de quadros (andando)');
 const c0=page.locator('#g3Fundo .g3-card').first();const id0=await c0.getAttribute('data-g3');
 await c0.locator('[data-g3-gostei]').check();
 await c0.locator('[data-g3-add]').fill('Cadáver de trabalhador [zumbi_1]');await c0.locator('[data-g3-add]').press('Enter');await page.waitForTimeout(300);
 await page.locator('#g3Fundo .g3-card').first().locator('[data-g3-acao$="|atacar"]').click();
 await page.waitForTimeout(1000);
 const salvo=await page.evaluate(()=>window.__g3['configuracoes/galeria3dV201']);console.log('salvo:',JSON.stringify(salvo).slice(0,200));
 assert.ok(salvo.marcas[id0]?.gostei&&salvo.marcas[id0].para[0].id==='zumbi_1','a marca 👍 e a criatura escolhida foram salvas');
 await page.selectOption('#g3Fundo [data-g3-filtro]','gostei');assert.equal(await page.locator('#g3Fundo .g3-card').count(),1,'o filtro "só as que gostei" mostra só a marcada');
 await page.click('#g3Fundo [data-g3-exp]');const txt=await page.inputValue('#g3Exp');assert.ok(/EU GOSTEI \(1\)/.test(txt)&&/substitui: Cadáver de trabalhador/.test(txt),'exporta a lista em texto');
 await page.selectOption('#g3Fundo [data-g3-filtro]','todos');await page.screenshot({path:path.join(root,'docs','imagens','v201-galeria3d.png')});
 assert.deepEqual(erros.filter(e=>!/setPointerCapture/.test(e)),[]); // (o clique sintético da miniatura chegou ao tratador normal de miniaturas)
 console.log('PASS terreno natural: espessura livre, planalto (rocha + topo elevado + rampas), colinas escarpadas, caverna natural e pincel de rocha.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
