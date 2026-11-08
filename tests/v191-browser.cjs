// v191 — Chrome sem janela, MÓDULO REAL de posições (nova-direta) com a cena gerada da masmorra + módulo real de viagem:
//  1) Kael nasce no Quarto, anda em várias direções (segurar o mouse), é barrado por parede e continua livre depois;
//  2) viagem: Embarcar fica ativo mesmo sem jogador no mapa; "Iniciar viagem agora" mostra a cena para todos.
// Roda: node tests/v191-browser.cjs
const assert=require('assert/strict');
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');
const comMestre=false;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
 const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
 const page=await (await browser.newContext({viewport:{width:1500,height:1000}})).newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('https://nova.test/**',route=>{const name=new URL(route.request().url()).pathname.slice(1);
  if(name.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,name),'utf8')});
  return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:12px">'+panel+'</main>'});});
 await page.goto('https://nova.test/');
 const r=await page.evaluate(async ({comMestre})=>{
  const store=window.store={},subs=[];
  const rows=p=>Object.entries(store).filter(([q])=>q.startsWith(p+'/')&&!q.slice(p.length+1).includes('/')).map(([q,d])=>({id:q.slice(p.length+1),data:d}));
  const notify=q=>{for(const s of subs){if(s.doc&&s.path===q)s.fn(store[q]||null);else if(!s.doc&&q.startsWith(s.path+'/'))s.fn(rows(s.path).map(x=>({...x,removed:false})));}};
  const db={get:async p=>store[p]||null,transact:async fn=>{const w=[];const r=await fn({get:async p=>store[p]||null,set:(p,v)=>w.push([p,v]),delete:p=>w.push([p,null])});for(const [p,v] of w){if(v===null)delete store[p];else store[p]=v;}for(const [p] of w)notify(p);return r;},
   read:async p=>rows(p).filter(x=>x.data.status==='new').map(x=>({path:p+'/'+x.id,data:x.data})),write:async(p,d)=>{store[p]=d;notify(p);},remove:async p=>{delete store[p];notify(p);},
   subscribe:(path,fn)=>{const s={path,fn,doc:false};subs.push(s);setTimeout(()=>fn(rows(path).map(x=>({...x,removed:false}))),0);return()=>{subs.splice(subs.indexOf(s),1);};},
   subscribeDoc:(path,fn)=>{const s={path,fn,doc:true};subs.push(s);setTimeout(()=>fn(store[path]||null),0);return()=>{subs.splice(subs.indexOf(s),1);};},writeMap:async(p,d)=>{store[p]=d;notify(p);}};
  const M=await import('/mesa-masmorra.js'),{mountDirectPositionLab}=await import('/nova-direta.js');
  const g=M.gerarMasmorra({objetos:[]}),cena=M.cenaMasmorra(g);
  const ent=M.metros(g.entrada.x,g.entrada.y);
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:M.ID_MASMORRA,nome:'Masmorra de treino',larguraM:M.W,alturaM:M.H,fundo:''};
  store['combatesAtivos/mapaMesaSyncDiretaCena']=cena;
  const posBase='combatesAtivos/mapaMesaSyncDireta/posicoes/';
  store[posBase+'teste_jogador_v138']={nome:'Kael Teste',imagem:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E',donoUid:'player',x:ent.x,y:ent.y,revision:0,facing:0,camada:3,mapaId:M.ID_MASMORRA,diametroM:1};
  store['personagens/teste_jogador_v138']={nome:'Kael Teste',dono:'player'};
  const uid=comMestre?'master':'player';
  window.ownSheets=[{id:'teste_jogador_v138',nome:'Kael Teste',dono:'player',donoUid:'player',localizacaoMapaId:M.ID_MASMORRA,localizacaoMapaDefinidaV92:true}];
  window.g=g;window.M=M;window.ent=ent;
  window.lab=mountDirectPositionLab({database:db,user:()=>({uid,master:comMestre}),characters:()=>window.ownSheets,activeCharacter:()=>'teste_jogador_v138',loadMap:async id=>({id,nome:'Masmorra de treino',larguraM:M.W,alturaM:M.H}),mapas:()=>[{id:M.ID_MASMORRA,nome:'Masmorra de treino',larguraM:M.W,alturaM:M.H}],
   catalog:()=>[],loadActions:async()=>({skills:[],health:{hitMax:{Peito:8},hit:{Peito:8},armor:{}}}),prepareSupport:async()=>({resolve:()=>({})}),restoreHealth:async rows=>Object.fromEntries(rows.map(t=>[t.id,{}])),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows.map(t=>({...t,initiative:10,actions:3}))});
  await window.lab.open();
  return {ent,entM:{x:g.entrada.x,y:g.entrada.y},objetos:cena.objects.length,W:M.W,H:M.H};
 },{comMestre});
  console.log('PASS montou o módulo real de posições com a cena da masmorra ('+r.objetos+' objetos)');
 await page.waitForFunction(()=>document.querySelectorAll('[data-token]').length>=1,null,{timeout:8000});
 const pos=()=>page.evaluate(()=>{const p=window.store['combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138'];return {x:p.x*window.M.W/28,y:p.y*window.M.H/14};});
 await page.locator('#novaSyncBoard').scrollIntoViewIfNeeded();const b=await page.locator('#novaSyncBoard').boundingBox();
 const segurar=async(xm,ym,ms=900)=>{const lx=xm*28/r.W,ly=ym*14/r.H;await page.mouse.move(b.x+lx/28*b.width,b.y+ly/14*b.height);await page.mouse.down();await page.waitForTimeout(ms);await page.mouse.up();await page.waitForTimeout(350);return pos();};
 const p0=await pos();assert.ok(p0.x>=10&&p0.x<=18&&p0.y>=2&&p0.y<=8,'Kael nasce dentro do Quarto (x 10–18 m, y 2–8 m): '+JSON.stringify(p0));
 let p=await segurar(p0.x-2.2,p0.y+1.2);assert.ok(Math.hypot(p.x-p0.x,p.y-p0.y)>1,'anda para o sudoeste dentro do Quarto');
 const p1=p;p=await segurar(p1.x+3,p1.y);assert.ok(p.x>p1.x+1,'anda para leste');
 const p2=p;p=await segurar(p2.x,Math.max(1,p2.y-6));assert.ok(p.y<p2.y-.5,'anda para cima');assert.ok(p.y>=2.3,'mas a parede norte do Quarto o segura (y='+p.y.toFixed(2)+')');
 const p3=p;p=await segurar(p3.x-.5,p3.y+2);assert.ok(p.y>p3.y+.5,'depois de bater na parede continua livre para andar');
 const fim=await pos();assert.ok(fim.x>=9.9&&fim.x<=18.1&&fim.y>=2&&fim.y<=8.1,'segue dentro do Quarto: '+JSON.stringify(fim));
 console.log('PASS [movimento real] Kael anda para todos os lados no Quarto, a parede o segura e ele continua livre');
 assert.deepEqual(errors,[]);
 await browser.close();
 // ---------------------------------------------------------------- viagem (módulo real)
 const b2=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 for(const modo of ['kael-no-mapa','kael-fora']){
  const pg=await (await b2.newContext({viewport:{width:1280,height:800}})).newPage();const erros=[];pg.on('pageerror',e=>erros.push(e.message));pg.on('console',mm=>{if(mm.type()==='error')erros.push(mm.text());});
  await pg.route('https://nova.test/**',route=>{const name=new URL(route.request().url()).pathname.slice(1);if(name.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,name),'utf8')});return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:8px"><div id="wrap" style="position:relative;width:1200px;height:600px;background:#1a2235"><div id="novaSyncBoard" style="position:absolute;inset:0"></div></div></main>'});});
  await pg.goto('https://nova.test/');
  await pg.evaluate(async modo=>{
   const store=window.store={},subs=[];const snap=r=>({exists:()=>r.p in store,data:()=>store[r.p]});
   const fire=s=>{if(s.ref.p)s.cb(snap(s.ref));else s.cb({forEach:f=>{for(const [q,v] of Object.entries(store))if(q.startsWith(s.ref.col+'/'))f({id:q.slice(s.ref.col.length+1),data:()=>v});}});};
   const emit=q=>{for(const s of [...subs])if(s.ref.p===q||(s.ref.col&&q.startsWith(s.ref.col+'/')))fire(s);};
   const V=await import('/mesa-viagem.js');
   const tokens=[{id:'teste_jogador_v138',nome:'Kael Teste',x:10,y:7,donoUid:'u1',mapaId:modo==='kael-no-mapa'?'m1':'outro',diametroM:1},{id:'segundo',nome:'Segundo',x:11,y:7,donoUid:'u2',mapaId:'outro',diametroM:1}];
   const ctl={ator:()=>tokens[0],controla:()=>true,tokensNoMapa:()=>tokens.filter(t=>t.mapaId==='m1'),todosTokens:()=>tokens,mapaAtual:()=>'m1',openMap:async()=>{}};
   const dep=(uid,mestre)=>({db:{},doc:(db,...segs)=>({p:segs.join('/')}),getDoc:async r=>snap(r),getDocs:async()=>({forEach(){}}),setDoc:async(r,v,o)=>{store[r.p]=o?.merge?{...(store[r.p]||{}),...v}:v;emit(r.p);},deleteDoc:async r=>{delete store[r.p];emit(r.p);},
    onSnapshot:(ref,cb)=>{const s={ref,cb};subs.push(s);setTimeout(()=>fire(s),0);return()=>{};},collection:(db,...segs)=>({col:segs.join('/')}),runTransaction:async(db,fn)=>{const w=[];const rr=await fn({get:async x=>snap(x),set:(x,v)=>w.push([x.p,v])});for(const [q,v] of w){store[q]=v;emit(q);}return rr;},
    controller:()=>ctl,ehMestre:()=>mestre,uid:()=>uid,mapas:()=>[{id:'m1',nome:'Masmorra de treino'},{id:'t',nome:'Therion'}]});
   window.vgMestre=V.instalarViagem(dep('master',true));
  },modo);
  await pg.waitForSelector('#vgBotao',{timeout:4000});
  const css1=await pg.evaluate(()=>{const s=getComputedStyle(document.getElementById('vgBotao'));return {pos:s.position};});assert.equal(css1.pos,'absolute','botão 🚀 posicionado dentro do mapa');
  await pg.evaluate(()=>document.getElementById('vgBotao').click());
  const ir=await pg.locator('#vgPrep [data-ir]').isDisabled(),ja=await pg.locator('#vgPrep [data-ja]').isDisabled();assert.equal(ir,false,'Embarcar nunca fica desabilitado ('+modo+')');assert.equal(ja,false);
  const txt=await pg.locator('#vgPrep').innerText();assert.match(txt,/Iniciar viagem agora/i);assert.match(txt,/Todos os jogadores e você veem a viagem/);if(modo==='kael-fora')assert.match(txt,/vão todos os personagens de jogador do jogo/);
  await pg.evaluate(()=>document.querySelector('#vgPrep [data-ja]').click());
  await pg.waitForFunction(()=>window.store['combatesAtivos/mesaViagem']?.fase==='voo',null,{timeout:4000});
  const est=await pg.evaluate(()=>window.store['combatesAtivos/mesaViagem']);assert.equal(est.ativa,true);assert.ok(est.inicioVooEm>0);assert.ok(est.horas>=3);assert.equal(est.tripulantes.length,modo==='kael-no-mapa'?1:2,'tripulação: '+modo);
  assert.ok(est.tripulantes.every(t=>est.postos[t.id]==='passageiro'),'quem não escolheu posto vai de passageiro');
  await pg.waitForSelector('#vgCena.on',{timeout:4000});await pg.waitForFunction(()=>getComputedStyle(document.getElementById('vgCena')).opacity==='1',null,{timeout:4000});assert.equal(await pg.evaluate(()=>getComputedStyle(document.getElementById('vgCena')).opacity),'1');
  assert.equal(await pg.locator('#vgCena [data-pular]').count(),1,'o mestre vê os controles da viagem');
  await pg.waitForFunction(()=>/em andamento/.test(document.getElementById('vgBotao').textContent),null,{timeout:3000});
  assert.deepEqual(erros,[]);await pg.close();
  console.log('PASS [viagem '+modo+'] Embarcar liberado, "Iniciar viagem agora" põe a cena em tela cheia, tripulação certa, controles do mestre, botão mostra "em andamento"');
 }
 await b2.close();
 console.log('PASS v191: movimento real na masmorra e viagem visível para todos');
})().catch(e=>{console.error('FALHOU',e);process.exit(1);});
