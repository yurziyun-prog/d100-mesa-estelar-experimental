// v196 — Chrome sem janela, MÓDULO REAL de posições (nova-direta) com a cena do Núcleo Subterrâneo v196:
//  1) Kael nasce nas Docas, anda, é barrado pela parede de blindagem e continua livre depois;
//  2) porta FECHADA bloqueia (Docas) e passagem aberta livre num trecho sem porta;
//  3) dados funcionais da cena: 6 armadilhas, 2 portas trancadas, 12 criaturas com facção, telhado do chefe.
// Roda: node tests/v196-browser.cjs
const assert=require('assert/strict');
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
 const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
 const page=await (await browser.newContext({viewport:{width:1500,height:1000}})).newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('https://nova.test/**',route=>{const name=new URL(route.request().url()).pathname.slice(1);
  if(name.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,name),'utf8')});
  return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:12px">'+panel+'</main>'});});
 await page.goto('https://nova.test/');
 const r=await page.evaluate(async()=>{
  const store=window.store={},subs=[];
  const rows=p=>Object.entries(store).filter(([q])=>q.startsWith(p+'/')&&!q.slice(p.length+1).includes('/')).map(([q,d])=>({id:q.slice(p.length+1),data:d}));
  const notify=q=>{for(const s of subs){if(s.doc&&s.path===q)s.fn(store[q]||null);else if(!s.doc&&q.startsWith(s.path+'/'))s.fn(rows(s.path).map(x=>({...x,removed:false})));}};
  const db={get:async p=>store[p]||null,transact:async fn=>{const w=[];const r=await fn({get:async p=>store[p]||null,set:(p,v)=>w.push([p,v]),delete:p=>w.push([p,null])});for(const [p,v] of w){if(v===null)delete store[p];else store[p]=v;}for(const [p] of w)notify(p);return r;},
   read:async p=>rows(p).filter(x=>x.data.status==='new').map(x=>({path:p+'/'+x.id,data:x.data})),write:async(p,d)=>{store[p]=d;notify(p);},remove:async p=>{delete store[p];},
   subscribe:(path,fn)=>{const s={path,fn,doc:false};subs.push(s);setTimeout(()=>fn(rows(path).map(x=>({...x,removed:false}))),0);return()=>{subs.splice(subs.indexOf(s),1);};},
   subscribeDoc:(path,fn)=>{const s={path,fn,doc:true};subs.push(s);setTimeout(()=>fn(store[path]||null),0);return()=>{subs.splice(subs.indexOf(s),1);};},writeMap:async(p,d)=>{store[p]=d;notify(p);}};
  const M=await import('/mesa-masmorra.js'),{mountDirectPositionLab}=await import('/nova-direta.js');
  const g=M.gerarComplexo196({objetos:[]}),cena=M.cenaMasmorra(g,M.ID_MAPA_196);
  const ent=M.metros(g.entrada.x,g.entrada.y);
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:M.ID_MAPA_196,nome:'Núcleo Subterrâneo v196',larguraM:M.W,alturaM:M.H,fundo:''};
  store['combatesAtivos/mapaMesaSyncDiretaCena']=cena;
  const posBase='combatesAtivos/mapaMesaSyncDireta/posicoes/';
  store[posBase+'teste_jogador_v138']={nome:'Kael Teste',imagem:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E',donoUid:'player',x:ent.x,y:ent.y,revision:0,facing:0,camada:3,mapaId:M.ID_MAPA_196,diametroM:1};
  store['personagens/teste_jogador_v138']={nome:'Kael Teste',dono:'player'};
  window.ownSheets=[{id:'teste_jogador_v138',nome:'Kael Teste',dono:'player',donoUid:'player',localizacaoMapaId:M.ID_MAPA_196,localizacaoMapaDefinidaV92:true}];
  window.g=g;window.M=M;
  window.lab=mountDirectPositionLab({database:db,user:()=>({uid:'player',master:false}),characters:()=>window.ownSheets,activeCharacter:()=>'teste_jogador_v138',loadMap:async id=>({id,nome:'Núcleo Subterrâneo v196',larguraM:M.W,alturaM:M.H}),mapas:()=>[{id:M.ID_MAPA_196,nome:'Núcleo Subterrâneo v196',larguraM:M.W,alturaM:M.H}],
   catalog:()=>[],loadActions:async()=>({skills:[],health:{hitMax:{Peito:8},hit:{Peito:8},armor:{}}}),prepareSupport:async()=>({resolve:()=>({})}),restoreHealth:async rows=>Object.fromEntries(rows.map(t=>[t.id,{}])),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows.map(t=>({...t,initiative:10,actions:3}))});
  await window.lab.open();
  // dados funcionais da cena gerada
  const objs=cena.objects||[];
  const f=(k,v)=>objs.filter(o=>String(o.nome||'').includes(k)&&(v?v(o):true));
  const portasTrancadas=objs.filter(o=>o.estadoInterativo&&o.estadoInterativo.trancado===true);
  const armadilhas=objs.filter(o=>o.armadilhaV184);
  const criaturas=g.monstros||[];
  const telhado=objs.filter(o=>o.tetoV139);
  return {ent:{x:g.entrada.x,y:g.entrada.y},W:M.W,H:M.H,objetos:objs.length,
   portasTrancadas:portasTrancadas.map(o=>o.nome),armadilhas:armadilhas.length,
   criaturas:criaturas.length,faccoes:[...new Set(criaturas.map(o=>o.faccao))],telhado:telhado.length};
 });
 console.log(`PASS montou o módulo real de posições com a cena do Núcleo v196 (${r.objetos} objetos)`);
 await page.waitForFunction(()=>document.querySelectorAll('[data-token]').length>=1,null,{timeout:8000});
 const pos=()=>page.evaluate(()=>{const p=window.store['combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138'];return {x:p.x*window.M.W/28,y:p.y*window.M.H/14};});
 await page.locator('#novaSyncBoard').scrollIntoViewIfNeeded();const b=await page.locator('#novaSyncBoard').boundingBox();
 const segurar=async(xm,ym,ms=900)=>{const lx=xm*28/r.W,ly=ym*14/r.H;await page.mouse.move(b.x+lx/28*b.width,b.y+ly/14*b.height);await page.mouse.down();await page.waitForTimeout(ms);await page.mouse.up();await page.waitForTimeout(350);return pos();};
 const p0=await pos();
 assert.ok(Math.hypot(p0.x-r.ent.x,p0.y-r.ent.y)<1.5,'Kael nasce junto à escada das Docas: '+JSON.stringify(p0));
 let p=await segurar(p0.x+2.5,p0.y+1);assert.ok(p.x>p0.x+1,'anda para leste dentro das Docas');
 const p1=p;p=await segurar(p1.x,p1.y-4.5);assert.ok(p.y<p1.y-.5,'anda para o norte');assert.ok(p.y>=2.2,'a parede de blindagem norte o segura (y='+p.y.toFixed(2)+')');
 // porta FECHADA das docas (metros x 8–10, linha y=12): andar para o sul por ali deve ser barrado
 const pA=await pos();const pB=await segurar(9,pA.y+5);assert.ok(pB.y<11.9,'a porta fechada das Docas bloqueia (y='+pB.y.toFixed(2)+')');
 // trecho sem porta (x≈5): passagem livre entre as fileiras de pisos
 const pC=await pos();const pD=await segurar(5,pC.y+4.5);assert.ok(pD.y>pC.y+1.5,'passagem aberta (sem porta) deixa andar para o sul: '+JSON.stringify({de:pC,para:pD}));
 assert.deepEqual(errors,[]);
 // asserções de dados funcionais
 assert.equal(r.armadilhas,6,'6 armadilhas na cena');
 assert.equal(r.portasTrancadas.length,2,'2 portas trancadas: '+r.portasTrancadas.join(' | '));
 assert.ok(/reator/.test(r.portasTrancadas[0]+r.portasTrancadas[1])&&/conten/.test(r.portasTrancadas[0]+r.portasTrancadas[1]),'as trancadas são as portas do reator e da contenção');
 assert.equal(r.criaturas,12,'12 criaturas com facção');
 assert.ok(r.faccoes.includes('neutros')&&r.faccoes.includes('inimigos'),'há facções neutras e inimigas: '+r.faccoes.join(','));
 assert.equal(r.telhado,1,'sala do chefe sob telhado');
 console.log('PASS [movimento real] Kael anda nas Docas, a blindagem o segura, porta fechada bloqueia, passagem aberta libera');
 console.log('PASS [funcional] 6 armadilhas · 2 portas trancadas (reator+contenção) · 12 criaturas com facção (inclui neutros) · telhado do chefe');
 console.log('PASS v196: Núcleo Subterrâneo funcional no módulo real de posições');
 await browser.close();
})().catch(e=>{console.error('FALHOU:',e);process.exit(1);});
