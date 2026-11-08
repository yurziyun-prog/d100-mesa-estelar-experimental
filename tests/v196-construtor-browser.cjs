// v196 — o construtor de verdade, no Chrome (nova-direta + câmera + Oficina 3.0 reais), só com o controle de videogame simulado:
//  1) Brunel Obras aparece no mapa, do tamanho (1 m) dos outros, e anda com a alavanca esquerda;
//  2) A põe a peça NA HORA (rascunho), apertar A duas vezes no mesmo lugar não duplica, X quebra a que acabou de pôr;
//  3) RT abre a paleta: estruturas, pisos novos, cores e móveis/objetos — tudo escolhido com setas, LB/RB e A;
//  4) piso escolhido na paleta vale na peça de chão; objeto do banco é posto com A e gira com LB/RB;
//  5) 💾 Salvar mapa grava o rascunho todo de uma vez.
// Gera docs/imagens/v196-construtor-no-mapa.png. Roda: node tests/v196-construtor-browser.cjs
const assert=require('assert/strict');const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await (await browser.newContext({viewport:{width:1500,height:1000}})).newPage();const erros=[];page.on('pageerror',e=>erros.push(e.message));page.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
 await page.route('https://nova.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1);if(n.endsWith('.js'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,n),'utf8')});
  if(n.startsWith('arte/')&&fs.existsSync(path.join(root,n)))return r.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,n))});
  if(n.endsWith('.webp')||n.endsWith('.png'))return r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64')});
  return r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:12px;width:1480px">'+panel+'</main>'});});
 await page.goto('https://nova.test/');
 await page.evaluate(async()=>{
  const store=window.store={},subs=[];const rows=p=>Object.entries(store).filter(([q])=>q.startsWith(p+'/')&&!q.slice(p.length+1).includes('/')).map(([q,d])=>({id:q.slice(p.length+1),data:d}));
  const notify=q=>{for(const s of subs){if(s.doc&&s.path===q)s.fn(store[q]||null);else if(!s.doc&&q.startsWith(s.path+'/'))s.fn(rows(s.path).map(x=>({...x,removed:false})));}};
  const db={get:async p=>store[p]||null,transact:async fn=>{const w=[];const r=await fn({get:async p=>store[p]||null,set:(p,v)=>w.push([p,v]),delete:p=>w.push([p,null])});for(const [p,v] of w){if(v===null)delete store[p];else store[p]=v;}for(const [p] of w)notify(p);return r;},
   read:async p=>[],write:async(p,d)=>{store[p]=d;notify(p);},remove:async p=>{delete store[p];notify(p);},subscribe:(path,fn)=>{const s={path,fn,doc:false};subs.push(s);setTimeout(()=>fn(rows(path).map(x=>({...x,removed:false}))),0);return()=>{};},subscribeDoc:(path,fn)=>{const s={path,fn,doc:true};subs.push(s);setTimeout(()=>fn(store[path]||null),0);return()=>{};},writeMap:async(p,d)=>{store[p]=d;notify(p);}};
  const {mountDirectPositionLab}=await import('/nova-direta.js'),{instalarCamera}=await import('/mesa-camera.js'),{instalarOficina3}=await import('/mesa-oficina3.js');
  const {renderizarMiniatura,specDeNpc,svgParaDataUrl}=await import('/mesa-miniaturas.js');
  const kael=svgParaDataUrl(renderizarMiniatura(specDeNpc({id:'teste_jogador_v138',nome:'Kael Teste',raca:'Humano',carreira:'Aventureiro',sexo:'M',armasTexto:'Pistola Laser|Faca Utilitária'})));
  const ID='cidade_baixa_teste',W=40,H=26;
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:ID,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H,fundo:''};
  store['combatesAtivos/mapaMesaSyncDiretaCena']={mapId:ID,objetoSchema:1,objects:[]};
  store['combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138']={nome:'Kael Teste',imagem:kael,donoUid:'master',x:19,y:7,revision:0,facing:0,camada:3,mapaId:ID,diametroM:1};
  window.ownSheets=[{id:'teste_jogador_v138',nome:'Kael Teste',dono:'master',donoUid:'master',localizacaoMapaId:ID,localizacaoMapaDefinidaV92:true}];
  const renderMap=()=>'<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="display:block"><rect width="'+W+'" height="'+H+'" fill="#b69a72"/></svg>';
  window.lab=mountDirectPositionLab({database:db,user:()=>({uid:'master',master:true}),characters:()=>window.ownSheets,activeCharacter:()=>'teste_jogador_v138',renderMap,
   loadMap:async id=>({id,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H}),mapas:()=>[{id:ID,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H}],catalog:()=>[],loadActions:async()=>({skills:[],health:{hitMax:{Peito:8},hit:{Peito:8},armor:{}}}),prepareSupport:async()=>({resolve:()=>({})}),restoreHealth:async rows=>Object.fromEntries(rows.map(t=>[t.id,{}])),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows.map(t=>({...t,initiative:10,actions:3}))});
  await window.lab.open();
  const snap=p=>({exists:()=>!!store[p],data:()=>store[p]});
  const obj=(id,nome,w,h)=>({id,nome,larguraM:w,alturaM:h,imagem:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="#6a4a2a"/></svg>'),camada:3,bloqueiaMovimento:true});
  window.objetosBanco=[obj('mesa_madeira','Mesa de madeira',2,1),obj('cadeira_simples','Cadeira simples',.6,.6),obj('arvore_media','Árvore média',2.2,2.2),obj('barril','Barril',.8,.8),obj('lampada_rua','Luminária de rua',.5,.5)];
  instalarCamera({controller:()=>({dimsAtual:()=>({W,H}),ator:()=>window.lab.ator?.(),controla:()=>true,...window.lab}),ehMestre:()=>true});
  window.o3=instalarOficina3({db:'db',doc:(d,...s)=>s.join('/'),setDoc:async(p,v,o)=>{store[p]=o?.merge?{...(store[p]||{}),...v}:v;},getDoc:async p=>snap(p),onSnapshot:(p,cb)=>{cb(snap(p));return()=>{};},runTransaction:async(d,fn)=>fn({get:async p=>snap(p),set:(p,v)=>{store[p]=v;}}),
   controller:()=>window.lab,ehMestre:()=>true,mapas:()=>[{id:ID,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H}],objetos:()=>window.objetosBanco,enviarImagem:async()=>''});
 });
 await page.waitForFunction(()=>document.querySelector('[data-token]')&&window.mesaOficina3V175,null,{timeout:10000});
 await page.waitForTimeout(1200);
 const pad=(apertou=[],mover={x:0,y:0,m:0})=>page.evaluate(({apertou,mover})=>globalThis.mesaConstrucaoControleV177_({mover,rolar:{x:0,y:0,m:0},botoes:{},apertou}),{apertou,mover});
 const nos=()=>page.evaluate(()=>document.querySelectorAll('[data-scene-object]').length);
 const ultimo=()=>page.evaluate(()=>{const o=window.mesaRascunhoMapaV193.objetosAtuais();return o.length?{nome:o.at(-1).nome,textura:o.at(-1).textura||'',n:o.length,modelo:o.at(-1).modeloId||'',ang:o.at(-1).angulo}:null;});
 // 1) entrar e aparecer
 await page.evaluate(()=>window.mesaOficina3V175.construtor.entrar());await page.waitForTimeout(700);
 const av=await page.evaluate(()=>{const a=document.getElementById('o3Avatar'),t=document.querySelector('[data-token="teste_jogador_v138"]');if(!a)return null;const r=a.getBoundingClientRect(),q=t.getBoundingClientRect();return {w:r.width,h:r.height,tokenW:q.width,x:r.left,y:r.top,vis:r.width>10&&getComputedStyle(a).display!=='none',img:a.querySelector('img')?.src.slice(0,22)};});
 assert.ok(av&&av.vis,'Brunel aparece no mapa: '+JSON.stringify(av));assert.ok(Math.abs(av.w-av.tokenW)<3,'mesmo tamanho dos outros ('+av.w.toFixed(1)+' × '+av.tokenW.toFixed(1)+')');assert.match(av.img,/^data:image\/svg/,'com miniatura');
 // 2) anda com a alavanca esquerda (a câmera segue o construtor, então a posição vem do módulo, em metros)
 const p0=await page.evaluate(()=>window.mesaOficina3V175.construtor.estado().p);
 for(let i=0;i<24;i++){await pad([],{x:1,y:0,m:1});await page.waitForTimeout(40);}await pad([],{x:0,y:0,m:0});await page.waitForTimeout(150);
 const p1=await page.evaluate(()=>window.mesaOficina3V175.construtor.estado().p);assert.ok(p1.x>p0.x+2,'andou para a direita (metros): '+p0.x.toFixed(1)+' → '+p1.x.toFixed(1));
 // 3) A põe na hora; A de novo não duplica; X quebra
 await page.evaluate(()=>window.mesaOficina3V175.escolher&&0);
 const n0=await nos();const t0=Date.now();await pad(['A']);await page.waitForFunction(n=>document.querySelectorAll('[data-scene-object]').length>n,n0,{timeout:2000});const ms=Date.now()-t0;
 assert.ok(ms<400,'a peça aparece na hora ('+ms+' ms)');const n1=await nos();await pad(['A']);await page.waitForTimeout(200);assert.equal(await nos(),n1,'A de novo no mesmo lugar não duplica');
 const gravouAntes=await page.evaluate(()=>(window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects||[]).length);assert.equal(gravouAntes,0,'nada é gravado antes de salvar');
 await pad(['X']);await page.waitForTimeout(250);assert.ok(await nos()<n1,'X quebra a peça que acabou de pôr (mesmo sem salvar)');
 // 4) paleta
 await pad(['RT']);await page.waitForSelector('#o3Paleta');
 const abas=await page.evaluate(()=>[...document.querySelectorAll('#o3Paleta [data-pa]')].map(b=>b.textContent.trim()));
 assert.ok(abas.length>=5&&abas.some(a=>/Estruturas/.test(a))&&abas.some(a=>/Pisos/.test(a))&&abas.some(a=>/Cores/.test(a))&&abas.some(a=>/M[óo]veis/.test(a)),'abas da paleta: '+abas.join(' | '));
 const nPisos=await page.evaluate(()=>{document.querySelector('#o3Paleta [data-pa="1"]').click();return document.querySelectorAll('#o3Paleta [data-pi]').length;});assert.ok(nPisos>=20,'pisos e materiais: '+nPisos);
 await page.evaluate(()=>document.querySelector('#o3Paleta [data-pa="0"]').click());
 // escolhe "Chão" (1º item) com A, abre de novo, vai para Pisos com RB, desce e escolhe Areia
 await pad(['A']);assert.equal(await page.locator('#o3Paleta').count(),0,'A escolhe e fecha');
 await pad(['RT']);await pad(['RB']);for(let i=0;i<9;i++)await pad(['DIR']);await pad(['A']);
 const hud=await page.evaluate(()=>document.getElementById('o3Hud')?.textContent||'');assert.match(hud,/Brunel Obras/);assert.match(hud,/Areia|Água|Terra|Grama|Lajota|Rocha|Piso/,'HUD mostra o piso escolhido: '+hud.slice(0,80));
 for(let i=0;i<14;i++){await pad([],{x:1,y:0,m:1});await page.waitForTimeout(40);}await pad([],{x:0,y:0,m:0});await page.waitForTimeout(150);
 await pad(['A']);await page.waitForTimeout(250);const piso=await ultimo();assert.ok(piso&&/arte\/texturas\//.test(piso.textura),'peça de chão com o piso escolhido: '+JSON.stringify(piso));
 // 5) objeto/móvel pela paleta
 await pad(['RT']);const iMov=await page.evaluate(()=>[...document.querySelectorAll('#o3Paleta [data-pa]')].findIndex(b=>/M[óo]veis/.test(b.textContent)));
 for(let i=0;i<iMov;i++)await pad(['RB']);await pad(['A']);
 for(let i=0;i<14;i++){await pad([],{x:0,y:1,m:1});await page.waitForTimeout(40);}await pad([],{x:0,y:0,m:0});await page.waitForTimeout(150);
 const n2=await nos();await pad(['RB']);await pad(['A']);await page.waitForFunction(n=>document.querySelectorAll('[data-scene-object]').length>n,n2,{timeout:2000});
 const mov=await ultimo();assert.ok(mov&&/Mesa|Cadeira|Barril|Lumin/.test(mov.nome)&&mov.modelo,'móvel posto: '+JSON.stringify(mov));assert.ok(Math.abs(mov.ang)===90||mov.ang===270||mov.ang===90,'LB/RB gira o objeto antes de pôr: '+mov.ang);
 await page.locator('#novaSyncBoard').scrollIntoViewIfNeeded();await page.waitForTimeout(400);{const bb=await page.evaluate(()=>{const r=document.getElementById('novaSyncBoard').parentElement.getBoundingClientRect();return {x:Math.max(0,r.x),y:Math.max(0,r.y),width:Math.min(r.width,1500),height:Math.min(r.height,720)};});await page.screenshot({path:path.join(root,'docs/imagens/v196-construtor-no-mapa.png'),clip:bb});}
 // 6) salvar grava tudo
 const pend=await page.evaluate(()=>window.mesaRascunhoMapaV193.pendentes);assert.ok(pend>=2);
 await page.evaluate(()=>window.mesaRascunhoMapaV193.salvar());await page.waitForTimeout(300);
 const gravado=await page.evaluate(()=>(window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects||[]).length);assert.equal(gravado,2,'salvar grava o rascunho (piso + móvel; a peça quebrada não vai): '+gravado);
 assert.deepEqual(erros,[]);
 console.log('PASS construtor pelo controle: avatar do tamanho dos outros, anda, põe na hora ('+ms+' ms), sem duplicar, quebra, paleta com pisos e móveis, gira, salva ('+gravado+' objetos)');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
