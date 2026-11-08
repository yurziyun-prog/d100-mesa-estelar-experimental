// v199 — 🎲 Gerador de NPCs e criaturas no 🧭 Diretor de cena (motor do MapForge) + miniaturas artísticas no mapa, no Chrome de verdade.
// Confere: abas e opções, geração com semente repetível, fichas completas, salvar NPC no banco, colocar NPC e criatura no mapa com a arte nova
// (token marcado data-sprite, imagem arte/miniaturas/…, sem recorte redondo), "Todos no mapa". Gera docs/imagens/v199-gerador.png.
// Roda: node tests/v199-gerador-npc-browser.cjs
const assert=require('assert/strict');const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
const W=28,H=14;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await (await browser.newContext({viewport:{width:1500,height:1000}})).newPage();const erros=[];page.on('pageerror',e=>erros.push(e.message));page.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
 await page.route('https://nova.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1);if(n.endsWith('.js'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,n),'utf8')});
  if(n.startsWith('arte/')&&fs.existsSync(path.join(root,n)))return r.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,n))});
  return r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:12px;width:1480px"><div id="sincronizacao-nova">'+panel+'</div></main>'});});
 await page.goto('https://nova.test/');
 await page.evaluate(async({W,H})=>{
  const store=window.store={},subs=[];const rows=p=>Object.entries(store).filter(([q])=>q.startsWith(p+'/')&&!q.slice(p.length+1).includes('/')).map(([q,d])=>({id:q.slice(p.length+1),data:d}));
  const notify=q=>{for(const s of subs){if(s.doc&&s.path===q)s.fn(store[q]||null);else if(!s.doc&&q.startsWith(s.path+'/'))s.fn(rows(s.path).map(x=>({...x,removed:false})));}};
  const db={get:async p=>store[p]||null,transact:async fn=>{const w=[];const r=await fn({get:async p=>store[p]||null,set:(p,v)=>w.push([p,v]),delete:p=>w.push([p,null])});for(const [p,v] of w){if(v===null)delete store[p];else store[p]=v;}for(const [p] of w)notify(p);return r;},
   read:async p=>[],write:async(p,d)=>{store[p]=d;notify(p);},remove:async p=>{delete store[p];notify(p);},subscribe:(path,fn)=>{const s={path,fn,doc:false};subs.push(s);setTimeout(()=>fn(rows(path).map(x=>({...x,removed:false}))),0);return()=>{};},subscribeDoc:(path,fn)=>{const s={path,fn,doc:true};subs.push(s);setTimeout(()=>fn(store[path]||null),0);return()=>{};},writeMap:async(p,d)=>{store[p]=d;notify(p);}};
  const {mountDirectPositionLab}=await import('/nova-direta.js'),{instalarDiretor}=await import('/mesa-diretor.js');
  const ID='mapa_teste';
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:ID,nome:'Mapa de teste',larguraM:W,alturaM:H,fundo:''};
  store['combatesAtivos/mapaMesaSyncDiretaCena']={mapId:ID,objetoSchema:1,objects:[]};
  window.ownSheets=[];
  const renderMap=()=>'<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="display:block"><rect width="'+W+'" height="'+H+'" fill="#7a6a52"/></svg>';
  window.lab=mountDirectPositionLab({database:db,user:()=>({uid:'master',master:true}),characters:()=>window.ownSheets,activeCharacter:()=>null,renderMap,loadMap:async id=>({id,nome:'Mapa de teste',larguraM:W,alturaM:H}),mapas:()=>[{id:ID,nome:'Mapa de teste',larguraM:W,alturaM:H}],catalog:()=>[],loadActions:async()=>({skills:[],health:{hitMax:{},hit:{},armor:{}}}),prepareSupport:async()=>({resolve:()=>({})}),restoreHealth:async rows=>({}),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows});
  await window.lab.open();
  /* "firestore" de mentira para o Diretor, ligado ao mesmo armazenamento do mapa */
  const doc=(d,...seg)=>seg.join('/'),collection=(d,...seg)=>seg.join('/');
  const setDoc=async(p,data,o)=>{store[p]=o?.merge?{...(store[p]||{}),...data}:data;notify(p);};
  const getDoc=async p=>({exists:()=>!!store[p],data:()=>store[p]});
  const getDocs=async c=>({forEach:fn=>rows(c).forEach(r=>fn({id:r.id,data:()=>r.data}))});
  const runTransaction=async(d,fn)=>db.transact(tx=>fn({get:async p=>({exists:()=>!!store[p],data:()=>store[p]}),set:(p,v)=>tx.set(p,v)}));
  window.npcsBanco=[];window.criaturasBanco=[];
  window.dir=instalarDiretor({db:{},doc,setDoc,getDoc,getDocs,collection,runTransaction,onSnapshot:()=>()=>{},ehMestre:()=>true,uid:()=>'master',npcs:()=>window.npcsBanco,criaturas:()=>window.criaturasBanco,objetosMapa:()=>[],cenarios:()=>[],normalizar:(t,b)=>({...b})});
 },{W,H});
 try{await page.waitForFunction(()=>document.getElementById('mdBotao'),null,{timeout:8000});}catch(e){console.log('ERROS:',erros.slice(0,5).join(' // '));console.log('barra:',await page.evaluate(()=>!!document.querySelector('#sincronizacao-nova .nova-view-tools')+' '+!!document.querySelector('.nova-view-tools')+' '+typeof window.dir));throw e;}
 await page.waitForTimeout(600);
 await page.click('#mdBotao');await page.waitForSelector('#mdGaveta:not([hidden])');
 await page.click('#mdGaveta [data-aba="npc"]');await page.waitForSelector('#mdGaveta [data-ggerar]');
 const abas=await page.evaluate(()=>[...document.querySelectorAll('#mdGaveta [data-aba]')].map(b=>b.textContent.trim()));
 assert.ok(abas.some(t=>/Gerador/.test(t)),'a aba se chama Gerador: '+abas);
 // ---- NPC: opções e geração com semente
 const opcoes=await page.evaluate(()=>({papeis:document.querySelectorAll('#mdGaveta [data-g="papel"] option').length,racas:document.querySelectorAll('#mdGaveta [data-g="raca"] option').length,carr:document.querySelectorAll('#mdGaveta [data-g="carreira"] option').length,poder:document.querySelectorAll('#mdGaveta [data-g="poder"] option').length}));
 assert.deepEqual(opcoes,{papeis:7,racas:17,carr:34,poder:6},'opções do motor do jogo (7 papéis, 16 raças, 33 carreiras, 6 poderes)');
 await page.fill('#mdGaveta [data-g="seed"]','4242');await page.selectOption('#mdGaveta [data-g="poder"]','5');await page.fill('#mdGaveta [data-g="qtd"]','3');
 await page.click('#mdGaveta [data-ggerar]');await page.waitForSelector('#mdGaveta [data-fi="2"]');
 const nomes1=await page.evaluate(()=>[...document.querySelectorAll('#mdGaveta [data-fi] h4')].map(h=>h.textContent));
 assert.equal(nomes1.length,3,'3 fichas');
 const ficha=await page.evaluate(()=>document.querySelector('#mdGaveta [data-fi="0"]').innerText);
 assert.ok(/FOR \d+ · CON \d+ · TAM \d+ · DES \d+ · INT \d+ · POD \d+ · CAR \d+/.test(ficha)&&/PV \d+/.test(ficha)&&/Sorte/.test(ficha),'ficha completa (atributos, PV, sorte): '+ficha.slice(0,160));
 await page.click('#mdGaveta [data-ggerar]');await page.waitForTimeout(150);
 const nomes2=await page.evaluate(()=>[...document.querySelectorAll('#mdGaveta [data-fi] h4')].map(h=>h.textContent));
 assert.deepEqual(nomes2,nomes1,'a mesma semente gera os mesmos NPCs');
 const arte=await page.evaluate(()=>document.querySelector('#mdGaveta [data-fi="0"] img')?.getAttribute('src'));assert.ok(/arte\/miniaturas\/.+\.webp$/.test(arte||''),'a ficha mostra a miniatura artística: '+arte);
 // ---- salvar no banco
 await page.click('#mdGaveta [data-gsalvar="0"]');await page.waitForTimeout(300);
 const salvo=await page.evaluate(()=>Object.entries(window.store).filter(([k])=>k.startsWith('npcs/')).map(([k,v])=>({k,v})));
 assert.equal(salvo.length,1,'NPC salvo no banco');assert.ok(salvo[0].v.periciasTexto.includes(':')&&/^\d+$/.test(String(salvo[0].v.FOR)),'perícias e atributos no formato do site');assert.ok(/miniaturas/.test(salvo[0].v.miniatura?.url),'miniatura artística gravada no NPC');
 // ---- colocar NPC no mapa
 await page.click('#mdGaveta [data-gcolocar="1"]');await page.waitForTimeout(700);
 const tokNpc=await page.evaluate(()=>[...document.querySelectorAll('#novaSyncBoard [data-token]')].map(n=>({id:n.dataset.token,sprite:n.dataset.sprite||'',src:n.querySelector('img')?.getAttribute('src')||'',fit:n.querySelector('img')?.style.objectFit||'',raio:n.querySelector('img')?.style.borderRadius||''})));
 assert.equal(tokNpc.length,1,'NPC no mapa');assert.equal(tokNpc[0].sprite,'1','token marcado como miniatura artística');assert.ok(/arte\/miniaturas\//.test(tokNpc[0].src),'usa a arte nova: '+tokNpc[0].src);assert.equal(tokNpc[0].fit,'contain','corpo inteiro, sem recorte');assert.ok(tokNpc[0].raio==='0px'||tokNpc[0].raio==='0','sem recorte redondo');
 // ---- criatura
 await page.click('#mdGaveta [data-gtipo="criatura"]');await page.waitForSelector('#mdGaveta [data-g="esp"]');
 const espN=await page.evaluate(()=>document.querySelectorAll('#mdGaveta [data-g="esp"] option').length);assert.equal(espN,30,'29 criaturas + aleatória');
 await page.selectOption('#mdGaveta [data-g="esp"]','besta_ululante');await page.fill('#mdGaveta [data-g="cqtd"]','2');await page.fill('#mdGaveta [data-g="seed"]','7');
 await page.click('#mdGaveta [data-ggerar]');await page.waitForSelector('#mdGaveta [data-fi="1"]');
 const crNomes=await page.evaluate(()=>[...document.querySelectorAll('#mdGaveta [data-fi] h4')].map(h=>h.textContent));assert.ok(crNomes.every(n=>/Besta Ululante/.test(n)),'espécie fixada: '+crNomes);
 await page.click('#mdGaveta [data-gtodos]');await page.waitForTimeout(900);
 const toks=await page.evaluate(()=>[...document.querySelectorAll('#novaSyncBoard [data-token]')].map(n=>({id:n.dataset.token,sprite:n.dataset.sprite||'',src:n.querySelector('img')?.getAttribute('src')||''})));
 assert.equal(toks.length,3,'NPC + 2 criaturas no mapa: '+toks.length);
 const cri=toks.filter(t=>/synccriatura/.test(decodeURIComponent(t.id)));assert.equal(cri.length,2,'duas criaturas');assert.ok(cri.every(t=>t.sprite==='1'&&/besta_ululante\.webp$/.test(t.src)),'criaturas com a miniatura artística da espécie: '+JSON.stringify(cri));
 // ---- arte grande
 await page.click('#mdGaveta [data-garte="0"]');await page.waitForSelector('#mdArteGrande img');
 const g=await page.evaluate(()=>document.querySelector('#mdArteGrande img').getAttribute('src'));assert.ok(/arte\/miniaturas\/grande\//.test(g),'arte grande');await page.click('#mdArteGrande');
 await page.waitForTimeout(300);
 await page.screenshot({path:path.join(root,'docs','imagens','v199-gerador.png')});
 assert.deepEqual(erros.filter(e=>!/Failed to load resource|net::ERR/.test(e)),[],'sem erros no console');
 console.log('PASS gerador de NPCs e criaturas: 7 papéis/16 raças/33 carreiras/29 criaturas, semente repetível, ficha completa, salvar no banco, colocar NPC e criaturas com a miniatura artística (corpo inteiro), arte grande');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
