// v196 — pôr uma peça num mapa grande não pode travar: o desenho da mesa é incremental (só a peça nova é criada).
// Mede, no Chrome de verdade, quanto custa pôr/quebrar uma peça numa cena com 3000 objetos.
const assert=require('assert/strict');const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await (await browser.newContext({viewport:{width:1500,height:1000}})).newPage();const erros=[];page.on('pageerror',e=>erros.push(e.message));
 await page.route('https://nova.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1);if(n.endsWith('.js'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,n),'utf8')});return r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:12px;width:1480px">'+panel+'</main>'});});
 await page.goto('https://nova.test/');
 const r=await page.evaluate(async()=>{
  const store={},subs=[];const rows=p=>Object.entries(store).filter(([q])=>q.startsWith(p+'/')&&!q.slice(p.length+1).includes('/')).map(([q,d])=>({id:q.slice(p.length+1),data:d}));
  const notify=q=>{for(const s of subs){if(s.doc&&s.path===q)s.fn(store[q]||null);else if(!s.doc&&q.startsWith(s.path+'/'))s.fn(rows(s.path).map(x=>({...x,removed:false})));}};
  const db={get:async p=>store[p]||null,transact:async fn=>{const w=[];const r=await fn({get:async p=>store[p]||null,set:(p,v)=>w.push([p,v]),delete:p=>w.push([p,null])});for(const [p,v] of w){if(v===null)delete store[p];else store[p]=v;}for(const [p] of w)notify(p);return r;},
   read:async p=>[],write:async(p,d)=>{store[p]=d;notify(p);},remove:async p=>{delete store[p];notify(p);},subscribe:(path,fn)=>{const s={path,fn,doc:false};subs.push(s);setTimeout(()=>fn(rows(path).map(x=>({...x,removed:false}))),0);return()=>{};},subscribeDoc:(path,fn)=>{const s={path,fn,doc:true};subs.push(s);setTimeout(()=>fn(store[path]||null),0);return()=>{};},writeMap:async(p,d)=>{store[p]=d;notify(p);}};
  const {mountDirectPositionLab}=await import('/nova-direta.js');
  const ID='mapa_pesado',W=40,H=26,objs=[];
  for(let i=0;i<3000;i++)objs.push({id:'o'+i,nome:'Peça '+i,forma:'rect',cor:'#887766',x:(i%60)*.45+.5,y:Math.floor(i/60)*.27+.5,larguraM:1,alturaM:1,angulo:0,camada:1,bloqueiaMovimento:false,pvMax:0,pvAtual:0,dureza:0,opacity:1,ordemOficina:i});
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:ID,nome:'Pesado',larguraM:W,alturaM:H,fundo:''};
  store['combatesAtivos/mapaMesaSyncDiretaCena']={mapId:ID,objetoSchema:1,objects:objs};
  store['combatesAtivos/mapaMesaSyncDireta/posicoes/a']={nome:'A',imagem:'',donoUid:'master',x:14,y:7,revision:0,facing:0,camada:3,mapaId:ID,diametroM:1};
  window.ownSheets=[{id:'a',nome:'A',dono:'master',donoUid:'master',localizacaoMapaId:ID,localizacaoMapaDefinidaV92:true}];
  window.lab=mountDirectPositionLab({database:db,user:()=>({uid:'master',master:true}),characters:()=>window.ownSheets,activeCharacter:()=>'a',loadMap:async id=>({id,nome:'Pesado',larguraM:W,alturaM:H}),mapas:()=>[{id:ID,nome:'Pesado',larguraM:W,alturaM:H}],catalog:()=>[],loadActions:async()=>({skills:[],health:{hitMax:{Peito:8},hit:{Peito:8},armor:{}}}),prepareSupport:async()=>({resolve:()=>({})}),restoreHealth:async rows=>Object.fromEntries(rows.map(t=>[t.id,{}])),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows.map(t=>({...t,initiative:10,actions:3}))});
  await window.lab.open();
  await new Promise(r=>setTimeout(r,1500));
  const R=window.mesaRascunhoMapaV193;const out={nos:document.querySelectorAll('[data-scene-object]').length,tem:!!R};
  const tempos=[];
  for(let k=0;k<8;k++){const t0=performance.now();R.empurrar([{kind:'add',object:{id:'novo'+k,nome:'Chão novo',forma:'rect',cor:'#223344',x:3+k,y:3,larguraM:2,alturaM:2,angulo:0,camada:1,bloqueiaMovimento:false,pvMax:0,pvAtual:0,dureza:0,opacity:1,ordemOficina:9999+k}}]);tempos.push(performance.now()-t0);}
  out.apareceu=!!document.querySelector('[data-scene-object="novo7"]');out.nosDepois=document.querySelectorAll('[data-scene-object]').length;
  const t1=performance.now();R.empurrar([{kind:'remove',id:'novo0'}]);out.quebrarMs=performance.now()-t1;out.sumiu=!document.querySelector('[data-scene-object="novo0"]');
  out.medio=tempos.reduce((a,b)=>a+b,0)/tempos.length;out.maximo=Math.max(...tempos);out.pend=R.pendentes;
  return out;});
 console.log(JSON.stringify(r));
 assert.equal(r.tem,true);assert.ok(r.nos>=2900,'cena pesada desenhada: '+r.nos);assert.ok(r.apareceu,'a peça nova aparece na hora');assert.equal(r.nosDepois,r.nos+8);assert.ok(r.sumiu,'peça quebrada some na hora');
 assert.ok(r.medio<60,'pôr uma peça numa cena de 3000 objetos custa '+r.medio.toFixed(0)+' ms (limite 60)');assert.deepEqual(erros,[]);
 console.log('PASS desempenho: peça posta em ~'+r.medio.toFixed(0)+' ms (máx '+r.maximo.toFixed(0)+' ms), quebrar em '+r.quebrarMs.toFixed(0)+' ms, numa cena de '+r.nos+' objetos');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
