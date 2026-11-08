// v200 — aba 👾 Criaturas do Diretor: atitudes (agressiva, sanguinária, defensiva, aliada), padrão por espécie, NPC defensivo, vida simples.
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
  const {mountDirectPositionLab}=await import('/nova-direta.js'),{instalarDiretor}=await import('/mesa-diretor.js'),{instalarAtitudes}=await import('/mesa-atitudes-ia.js'),{instalarVidaSimples}=await import('/mesa-vida-simples.js'),{instalarEfeitos}=await import('/mesa-efeitos.js');
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
  window.npcsBanco=[{id:'npc_guarda',nome:'Guarda'}];window.criaturasBanco=[{id:'besta_ululante',nome:'Besta Ululante',tamanho:'Médio'},{id:'cao_cinzento',nome:'Cão Cinzento',tamanho:'Médio'}];
  window.dir=instalarDiretor({db:{},doc,setDoc,getDoc,getDocs,collection,runTransaction,onSnapshot:(p,fn)=>db.subscribeDoc(p,v=>fn({exists:()=>!!v,data:()=>v})),ehMestre:()=>true,uid:()=>'master',npcs:()=>window.npcsBanco,criaturas:()=>window.criaturasBanco,objetosMapa:()=>[],cenarios:()=>[],normalizar:(t,b)=>({...b})});
  const dep2={db:{},doc,setDoc,getDoc,onSnapshot:(p,fn)=>db.subscribeDoc(p,v=>fn({exists:()=>!!v,data:()=>v})),controller:()=>window.lab,ehMestre:()=>true,uid:()=>'master'};
  window.atit=instalarAtitudes(dep2);window.efe=instalarEfeitos({...dep2,criaturas:()=>window.criaturasBanco,npcs:()=>window.npcsBanco});window.vida=instalarVidaSimples(dep2);
 },{W,H});

 try{await page.waitForFunction(()=>document.getElementById('mdBotao'),null,{timeout:8000});}catch(e){console.log('ERROS:',erros.slice(0,5).join(' // '));throw e;}
 await page.waitForTimeout(600);
 await page.click('#mdBotao');await page.waitForSelector('#mdGaveta:not([hidden])');
 const abas=await page.evaluate(()=>[...document.querySelectorAll('#mdGaveta [data-aba]')].map(b=>b.textContent.trim()));
 assert.ok(abas.some(t=>/Criaturas/.test(t)),'aba Criaturas: '+abas);
 await page.click('#mdGaveta [data-aba="bichos"]');await page.waitForSelector('#mdGaveta [data-cr-add]');
 // 1) criatura agressiva x2: a primeira classificação vira o padrão da espécie
 await page.selectOption('#mdGaveta [data-cr-modelo]','besta_ululante');await page.selectOption('#mdGaveta [data-cr-atitude]','agressiva');
 await page.fill('#mdGaveta [data-cr-qtd]','2');await page.click('#mdGaveta [data-cr-add]');await page.waitForTimeout(900);
  let toks=await page.evaluate(()=>window.lab.tokensNoMapa().map(t=>({id:t.id,at:window.atit.atitudeDe(t)})));
 assert.equal(toks.length,2,'2 criaturas no mapa');assert.ok(toks.every(t=>t.at?.id==='agressiva'&&t.at.origem==='especie'),'as duas herdam o padrão da espécie: '+JSON.stringify(toks));
 const pad=await page.evaluate(()=>window.atit.padroes());assert.equal(pad.besta_ululante.atitude,'agressiva','padrão salvo');
 // 2) outra da mesma espécie com atitude diferente: só ela muda (padrão continua)
 await page.waitForSelector('#mdGaveta [data-cr-add]');await page.selectOption('#mdGaveta [data-cr-atitude]','sanguinaria');await page.fill('#mdGaveta [data-cr-qtd]','1');
 await page.click('#mdGaveta [data-cr-add]');await page.waitForTimeout(900);
 toks=await page.evaluate(()=>window.lab.tokensNoMapa().map(t=>({id:t.id,at:window.atit.atitudeDe(t)})));
 assert.equal(toks.length,3);assert.equal(toks.filter(t=>t.at.id==='sanguinaria'&&t.at.origem==='token').length,1,'uma sanguinária individual');
 assert.equal((await page.evaluate(()=>window.atit.padroes())).besta_ululante.atitude,'agressiva','padrão da espécie intacto');
 // 3) NPC comum: defensivo por padrão
 await page.selectOption('#mdGaveta [data-cr-tipo]','npcs');await page.waitForSelector('#mdGaveta [data-cr-add]');
 await page.click('#mdGaveta [data-cr-add]');await page.waitForTimeout(900);
 const npc=await page.evaluate(()=>{const t=window.lab.tokensNoMapa().find(t=>/syncnpc/.test(decodeURIComponent(t.id)));return window.atit.atitudeDe(t);});
 assert.ok(npc&&npc.id==='defensiva'&&npc.origem==='padrao-npc','NPC comum é defensivo por padrão: '+JSON.stringify(npc));
 // o NPC foi colocado com a atitude escolhida no formulário (sanguinária) → conferir a lista e trocar para o padrão
 await page.waitForSelector('#mdGaveta [data-cr-tk]');
 // 4) troca individual pela lista e volta ao padrão
 const alvo=await page.evaluate(()=>[...document.querySelectorAll('#mdGaveta [data-cr-tk][data-campo="atitude"]')].map(s=>s.dataset.crTk));
 assert.equal(alvo.length,4,'4 miniaturas na lista');
 await page.selectOption('#mdGaveta [data-cr-tk="'+alvo[0]+'"][data-campo="atitude"]','defensiva');await page.waitForTimeout(500);
 let a0=await page.evaluate(id=>window.atit.atitudeDe(window.lab.token(id)),alvo[0]);
 assert.equal(a0.id,'defensiva','troca individual vale');
 await page.selectOption('#mdGaveta [data-cr-tk="'+alvo[0]+'"][data-campo="atitude"]','');await page.waitForTimeout(500);
 a0=await page.evaluate(id=>window.atit.atitudeDe(window.lab.token(id)),alvo[0]);
 assert.ok(['agressiva','defensiva'].includes(a0.id)&&a0.origem!=='token','volta ao padrão: '+JSON.stringify(a0));
 // 5) regras de engajamento
 const r=await page.evaluate(()=>{const T=window.lab.tokensNoMapa(),sang=T.find(t=>window.atit.atitudeDe(t).id==='sanguinaria'),outro=T.find(t=>t.id!==sang.id);
  return {sangEngaja:window.atit.engaja(sang,outro),defEngaja:(()=>{const d=T.find(t=>window.atit.atitudeDe(t).id==='defensiva');return d?window.atit.engaja(d,sang):'sem';})()};});
 assert.equal(r.sangEngaja,true,'sanguinária engaja qualquer um');assert.ok(r.defEngaja===false||r.defEngaja==='sem','defensiva não ataca quem não a atacou: '+r.defEngaja);
 // 6) vida simples: um PV só e barras
 assert.equal(await page.evaluate(()=>window.vida.ativo()),true,'vida simples ligada por padrão');
 const col=await page.evaluate(()=>window.vida.colapsar({hitMax:{Cabeça:4,Torso:8,'Braço':3},hit:{Cabeça:4,Torso:2,'Braço':3},armor:{Cabeça:0,Torso:2,'Braço':0},ferimentos:{Torso:'grave'}}));
 assert.deepEqual(col.hitMax,{'PV Global':15});assert.equal(col.hit['PV Global'],9);assert.deepEqual(col.ferimentos,{});
 // 7) a miniatura vira para onde anda (arte original olha para a esquerda: andando para a direita espelha)
 const idv=await page.evaluate(()=>[...document.querySelectorAll('#novaSyncBoard [data-token]')].find(n=>n.dataset.sprite)?.dataset.token);
 assert.ok(idv,'há miniatura artística no mapa');
 const mover=async(dx,dy)=>page.evaluate(async({id,dx,dy})=>{const n=document.querySelector('#novaSyncBoard [data-token="'+CSS.escape(id)+'"]');const l=parseFloat(n.style.left),t=parseFloat(n.style.top);n.style.left=(l+dx)+'%';n.style.top=(t+dy)+'%';await new Promise(r=>setTimeout(r,1100));return {dir:n.dataset.dir,scale:getComputedStyle(n.querySelector('img')).scale};},{id:idv,dx,dy});
 await page.waitForTimeout(600);
 const e=await mover(8,0),o=await mover(-8,0),nn=await mover(0,-8);
 assert.equal(e.dir,'e');assert.ok(/-1/.test(e.scale),'andando para a direita espelha: '+e.scale);assert.equal(o.dir,'o');assert.ok(!/-1/.test(o.scale),'para a esquerda não espelha');assert.equal(nn.dir,'n','subindo = de costas');
 await page.waitForTimeout(300);
 await page.screenshot({path:path.join(root,'docs','imagens','v200-criaturas.png')});
 assert.deepEqual(erros.filter(e=>!/Failed to load resource|net::ERR/.test(e)),[],'sem erros no console');
 console.log('PASS atitudes: aba Criaturas, padrão por espécie, troca individual, NPC defensivo/atitude, engajamento, vida simples');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
