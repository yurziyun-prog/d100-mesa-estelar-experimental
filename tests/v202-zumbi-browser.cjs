// v202 — zumbi SANGUINÁRIO ataca quem está no mapa? (motores de verdade; só as fichas e a rolagem são simuladas)
// Só os dados das fichas e a rolagem do ataque são simulados (2 ações, mordida 60%, dano 3–7).
// Roda: node tests/demo-v200-mapa.cjs [--video]   (com --video grava docs/videos/tmp-mapa/*.webm)
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js'),tmp=path.join(root,'docs','videos','tmp-mapa');
fs.rmSync(tmp,{recursive:true,force:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
const W=28,H=14,VIDEO=process.argv.includes('--video'),SEED=Number((process.argv.find(a=>a.startsWith('--seed='))||'--seed=0').slice(7))||0;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const ctx=await browser.newContext({viewport:{width:1400,height:820},...(VIDEO?{recordVideo:{dir:tmp,size:{width:1400,height:820}}}:{})});
 const page=await ctx.newPage();const erros=[];page.on('pageerror',e=>erros.push('PAGEERR '+e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')erros.push(m.text());});
 await page.route('https://nova.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1);if(n.endsWith('.js'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,n),'utf8')});
  if(n.startsWith('arte/')&&fs.existsSync(path.join(root,n)))return r.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,n))});
  return r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<style>body{margin:0;background:#0b1020}</style><main style="padding:6px;width:1380px"><div id="sincronizacao-nova">'+panel+'</div></main>'});});
 if(SEED)await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};},SEED);
 await page.goto('https://nova.test/');
 await page.evaluate(async({W,H})=>{
  const svgImg=svg=>'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
  const store=window.store={},subs=[];const rows=p=>Object.entries(store).filter(([q])=>q.startsWith(p+'/')&&!q.slice(p.length+1).includes('/')).map(([q,d])=>({id:q.slice(p.length+1),data:d}));
  const notify=q=>{for(const s of subs){if(s.doc&&s.path===q)s.fn(store[q]||null);else if(!s.doc&&q.startsWith(s.path+'/'))s.fn(rows(s.path).map(x=>({...x,removed:false})));}};
  const db={get:async p=>store[p]||null,transact:async fn=>{const w=[];const r=await fn({get:async p=>store[p]||null,set:(p,v)=>w.push([p,v]),delete:p=>w.push([p,null])});for(const [p,v] of w){if(v===null)delete store[p];else store[p]=v;}for(const [p] of w)notify(p);return r;},
   read:async p=>[],write:async(p,d)=>{store[p]=d;notify(p);},remove:async p=>{delete store[p];notify(p);},subscribe:(path,fn)=>{const s={path,fn,doc:false};subs.push(s);setTimeout(()=>fn(rows(path).map(x=>({...x,removed:false}))),0);return()=>{};},subscribeDoc:(path,fn)=>{const s={path,fn,doc:true};subs.push(s);setTimeout(()=>fn(store[path]||null),0);return()=>{};},writeMap:async(p,d)=>{store[p]=d;notify(p);}};
  const mods={};for(const n of ['nova-direta','mesa-diretor','mesa-atitudes-ia','mesa-vida-simples','mesa-efeitos','mesa-tempo-real','mesa-vida','mesa-exploracao','mesa-trabalho'])mods[n]=await import('/'+n+'.js');
  const ID='mapa_demo';
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:ID,nome:'Campo de teste',larguraM:W,alturaM:H,fundo:''};
  const O=(id,nome,x,y,l,a,img,extra={})=>({id,nome,tipo:'objeto',x,y,larguraM:l,alturaM:a,angulo:0,camada:3,opacity:1,bloqueiaMovimento:true,bloqueiaVisao:false,imagem:img,...extra});
  const parede=svgImg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" preserveAspectRatio="none"><rect width="10" height="10" fill="#3a3d4a"/></svg>');
  const portaImg=svgImg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" preserveAspectRatio="none"><rect width="10" height="10" fill="#a86a2a" stroke="#4a2a0a" stroke-width="1"/></svg>');
  const rocha=svgImg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><ellipse cx="5" cy="6" rx="4.6" ry="3.6" fill="#8d8f96" stroke="#555" stroke-width=".4"/></svg>');
  const arv=svgImg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4.6" fill="#2f7d3a" stroke="#174d1f" stroke-width=".4"/><circle cx="5" cy="5" r="1" fill="#5a3b1a"/></svg>');
  store['combatesAtivos/mapaMesaSyncDiretaCena']={mapId:ID,objetoSchema:1,objects:[
   O('p_topo','Parede',24.4,3,7,.5,parede),O('p_base','Parede',24.4,11,7,.5,parede),O('p_e1','Parede',21,4.7,.5,3.4,parede),O('p_e2','Parede',21,9.3,.5,3.4,parede),
   O('porta1','Porta de madeira',21,7,.5,1.4,portaImg,{estadoInterativo:{aberto:false,trancado:false}}),
   O('r1','Rocha média',7,3.2,1.5,1.2,rocha),O('r2','Rocha média',10,11,1.5,1.2,rocha),O('a1','Árvore grande',4,10.5,2,2,arv),O('a2','Árvore grande',13,2.4,2,2,arv),
   O('esconde','Pedra grande',16.5,8.5,2.2,1.8,rocha)]};
  const renderMap=()=>'<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="display:block"><rect width="'+W+'" height="'+H+'" fill="#6f6247"/></svg>';
  window.ownSheets=[];
  window.lab=mods['nova-direta'].mountDirectPositionLab({database:db,user:()=>({uid:'master',master:true}),characters:()=>window.ownSheets,activeCharacter:()=>null,renderMap,loadMap:async id=>({id,nome:'Campo de teste',larguraM:W,alturaM:H}),mapas:()=>[{id:ID,nome:'Campo de teste',larguraM:W,alturaM:H}],catalog:()=>[],loadActions:async()=>({skills:[],health:{hitMax:{},hit:{},armor:{}}}),prepareSupport:async()=>({resolve:()=>({})}),restoreHealth:async rows=>({}),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows});
  await window.lab.open();
  const doc=(d,...seg)=>seg.join('/'),collection=(d,...seg)=>seg.join('/');
  const mesclar=(a,b)=>{const r={...a};for(const [k,v] of Object.entries(b)){r[k]=v&&typeof v==='object'&&!Array.isArray(v)&&a?.[k]&&typeof a[k]==='object'?mesclar(a[k],v):v;}return r;};const setDoc=async(p,data,o)=>{store[p]=o?.merge?mesclar(store[p]||{},data):data;notify(p);};
  const getDoc=async p=>({exists:()=>!!store[p],data:()=>store[p]});
  const getDocs=async c=>({forEach:fn=>rows(c).forEach(r=>fn({id:r.id,data:()=>r.data}))});
  const runTransaction=async(d,fn)=>db.transact(tx=>fn({get:async p=>({exists:()=>!!store[p],data:()=>store[p]}),set:(p,v)=>tx.set(p,v)}));
  const snap=v=>({exists:()=>!!v,data:()=>v});
  const onSnapshot=(p,fn)=>{if(p.split('/').length%2===1)return db.subscribe(p,r=>fn({forEach:f=>r.forEach(x=>f({id:x.id,data:()=>x.data})),docs:r.map(x=>({id:x.id,data:()=>x.data}))}));return db.subscribeDoc(p,v=>fn(snap(v)));};
  const deleteDoc=async p=>{delete store[p];notify(p);};
  const C=(id,nome,extra={})=>({id,nome,tamanho:'Médio',movimentoTerrestre:6,...extra});
  window.criaturasBanco=[C('macacodecalico','Macaco de Calico'),C('escavador_de_carapaca','Escavador'),C('larva_interdimensional','Larva',{comportamento:'presa'}),C('besta_ululante','Besta Ululante'),C('predador_couracado','Couraçado'),C('insetoide_predador','Insetoide'),C('insetoide_predador_1','Insetoide B')];
  window.npcsBanco=[];
  window.mesaTempoRealDadosV111_={
   async dados(t){return {acoes:2,mov:6,ataques:[{skillId:'mordida',weaponId:'dente',nome:'Mordida',valor:60,alcance:1.6,distancia:false}],int:5,tipo:'criatura',texto:'predador',comportamento:'',primeirosSocorros:0,kits:0,resistencia:40,psi:{max:0,gasto:0,poderes:[]},corpoACorpo:60,aDistancia:0};},
   async preparar(a,b,cmd){const f=(A,B,atores,falso,op)=>{if(op.phase==='preview')return {pending:null};
     const cl=atores[B.id]?.combateLab||{hitMax:{'PV Global':20},hit:{'PV Global':20}},acertou=Math.random()<.7,dano=acertou?3+Math.floor(Math.random()*5):0,novo=Number(cl.hit['PV Global'])-dano;
     return {event:{message:(A.nome||'?')+' morde '+(B.nome||'?')+(acertou?' ('+dano+')':' e erra'),hit:acertou,damage:dano,nome:'Mordida'},actors:{[B.id]:{...(atores[B.id]||{}),combateLab:{...cl,hit:{'PV Global':novo},inconsciente:novo<=0||undefined,morto:novo<=-5||undefined}}}};};
    f.targetSheetPath=null;return f;},
   suporte:async()=>({})};
  const dep={db:{},doc,setDoc,getDoc,getDocs,deleteDoc,collection,runTransaction,onSnapshot,controller:()=>window.lab,ehMestre:()=>true,uid:()=>'master',personagemId:()=>'',api:()=>window.mesaTempoRealDadosV111_,criaturas:()=>window.criaturasBanco,npcs:()=>window.npcsBanco,objetosMapa:()=>[],cenarios:()=>[],mapas:()=>[{id:ID,nome:'Campo de teste',larguraM:W,alturaM:H}],normalizar:(t,b)=>({...b})};
  window.dir=mods['mesa-diretor'].instalarDiretor(dep);
  window.atit=mods['mesa-atitudes-ia'].instalarAtitudes(dep);window.vida=mods['mesa-vida-simples'].instalarVidaSimples(dep);
  window.efe=mods['mesa-efeitos'].instalarEfeitos(dep);window.expl=mods['mesa-exploracao'].instalarExploracao(dep);
  window.trab=mods['mesa-trabalho'].instalarTrabalho({...dep,root:document});window.rt=mods['mesa-tempo-real'].instalarTempoReal(dep);window.vidaMod=mods['mesa-vida'].instalarVida(dep);
  const H0=n=>({combateLab:{hitMax:{'PV Global':n},hit:{'PV Global':n},armor:{},ferimentos:{}}});
  const ids=['macacodecalico','escavador_de_carapaca','larva_interdimensional','besta_ululante','predador_couracado','insetoide_predador','insetoide_predador_1'];
  store['combatesAtivos/mapaMesaSyncSaude']={revision:1,actors:Object.fromEntries(ids.map(i=>['synccriatura%3A'+i,H0(i==='besta_ululante'?90:18)]))};
  window.tok=(id,nome,x,y,extra={})=>{const p='combatesAtivos/mapaMesaSyncDireta/posicoes/'+id;store[p]={...(store[p]||{}),nome,imagem:'',donoUid:'',x,y,revision:Number(store[p]?.revision||0)+1,facing:0,camada:3,mapaId:ID,diametroM:1.1,...extra};notify(p);};
  window.tok('pj1','Jogador',1.2,7,{donoUid:'u1',diametroM:1,imagem:svgImg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#3b82f6"/></svg>')});
 },{W,H});
 await page.waitForFunction(()=>document.getElementById('mdBotao'),null,{timeout:10000});
 await page.waitForTimeout(800);
 await page.waitForTimeout(800);
 const log=(...a)=>console.log(...a);
 const IDZ='synccriatura%3Azumbi_1';
 await page.evaluate(()=>{
  window.SEMVIDA=true;window.criaturasBanco.push({id:'zumbi_1',nome:'Cadáver de trabalhador',tamanho:'Médio',altura:'1,76',movimentoTerrestre:3,comportamento:'Alimentar-se',especie:'Humanoide parasitado'});
  const s=window.store['combatesAtivos/mapaMesaSyncSaude'];if(!window.SEMVIDA)s.actors['synccriatura%3Azumbi_1']={combateLab:{hitMax:{'PV Global':18},hit:{'PV Global':18},armor:{},ferimentos:{}}};
  window.store['combatesAtivos/mapaMesaSyncSaude']={...s,revision:2};
 });
 // como o Yuri fez: a espécie já tinha padrão DEFENSIVO e ele mudou ESTE zumbi para sanguinária; há um NPC defensivo (facção neutra) por perto
 await page.evaluate(()=>{
  window.tok('synccriatura%3Azumbi_1','Cadáver de trabalhador',14,4,{diametroM:1,atitudeV200:'sanguinaria',grupoV200:'a',territorioMV200:0});
  window.tok('syncnpc%3Aguarda','Guarda',6,8,{diametroM:1});
 });
 const pos=id=>page.evaluate(id=>{const t=window.lab.token(id);return t?{x:t.x,y:t.y}:null;},IDZ);
 const assert=require('assert/strict');
 let atacou='';
 for(let k=0;k<280&&!atacou;k++){await page.waitForTimeout(250);const ev=await page.evaluate(()=>window.store['combatesAtivos/mapaMesaSyncSaude']?.event?.message||'');if(/Cadáver.*(morde|Garras|ataca|Mordida|Pancada|Soco).*Guarda/.test(ev))atacou=ev;}
 console.log('o zumbi sanguinário atacou o NPC neutro que estava na área de visão:',atacou||'NÃO');
 assert.ok(atacou,'a sanguinária ataca até quem é neutro (NPC defensivo) quando está na área de visão');
 // sem círculo colorido e sem a bolinha amarela de frente
 const vis=await page.evaluate(()=>{const n=document.querySelector('#novaSyncBoard [data-token]'),h=n?.querySelector('[data-facing-handle]');return {anel:n?getComputedStyle(n).boxShadow:'',borda:n?getComputedStyle(n).borderTopColor:'',bolinha:h?getComputedStyle(h).display:'sem'};});
 console.log('visual:',JSON.stringify(vis));
 assert.ok(!/0px 0px 0px 2px/.test(vis.anel)&&/rgba\(0, 0, 0, 0\)|transparent/.test(vis.borda)&&['none','sem'].includes(vis.bolinha),'sem anel colorido nem bolinha de frente');
 // miniaturas não ficam uma por cima da outra: o mestre afasta quem sobrepôs
 await page.evaluate(()=>{window.tok('pj1','Jogador',10,8,{donoUid:'u1',diametroM:1});window.tok('synccriatura%3Azumbi_1','Cadáver de trabalhador',10.2,8.1,{diametroM:1,atitudeV200:'defensiva',grupoV200:'a',territorioMV200:0});});
 await page.waitForTimeout(6000);
 const d=await page.evaluate(()=>{const a=window.lab.token('pj1'),b=window.lab.token('synccriatura%3Azumbi_1');return Math.hypot(a.x-b.x,a.y-b.y);});
 console.log('distância entre o jogador e o zumbi depois de 6 s:',d.toFixed(2),'m');
 assert.ok(d>=.85,'as miniaturas se afastam em vez de ficar uma por cima da outra: '+d);
 console.log('PASS zumbi sanguinário caça à distância; sem anel/bolinha; sem sobreposição');
 await ctx.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
