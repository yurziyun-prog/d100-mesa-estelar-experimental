// v200 — DEMONSTRAÇÃO no navegador, com os motores de verdade (vida do mapa, tempo real, atitudes, exploração, efeitos).
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
  window.criaturasBanco=[C('macacodecalico','Macaco de Calico'),C('escavador_de_carapaca','Escavador'),C('larva_interdimensional','Larva',{comportamento:'presa',tamanho:'Pequeno'}),C('besta_ululante','Besta Ululante'),C('predador_couracado','Couraçado'),C('insetoide_predador','Insetoide'),C('insetoide_predador_1','Insetoide B')];
  window.npcsBanco=[{id:'npc_guarda',nome:'Guarda',carreira:'Guarda'}];window.notify=notify;
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
 const ajusta=()=>page.evaluate(()=>{const b=document.getElementById('novaSyncBoard');window.scrollTo(0,b.getBoundingClientRect().top+window.scrollY-6);});
 await ajusta();setInterval(()=>{},1e9).unref?.();
 const legenda=async t=>{await page.evaluate(t=>{let e=document.getElementById('legV');if(!e){e=document.createElement('div');e.id='legV';e.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99999;background:#101828ee;color:#fff;border:1px solid #8ee7ff;border-radius:12px;padding:10px 18px;font:600 18px Segoe UI,Arial;max-width:1100px;text-align:center';document.body.append(e);}e.textContent=t;},t);};
 const pos=id=>page.evaluate(id=>{const n=document.querySelector('#novaSyncBoard [data-token="'+CSS.escape(id)+'"]');return n?{x:parseFloat(n.style.left)*28/100,y:parseFloat(n.style.top)*14/100,dir:n.dataset.dir||''}:null;},id);
 const colocar=async({modelo,qtd=1,atitude,pers='comum'})=>{
  await page.selectOption('#mdGaveta [data-cr-modelo]',modelo);await page.selectOption('#mdGaveta [data-cr-atitude]',atitude);
  await page.waitForSelector('#mdGaveta [data-cr-pers]');await page.selectOption('#mdGaveta [data-cr-pers]',pers);await page.fill('#mdGaveta [data-cr-qtd]',String(qtd));
  await page.click('#mdGaveta [data-cr-add]');await page.waitForTimeout(1200);};
 const log=(...a)=>console.log(...a);
 const colocar2=async({modelo,tipo='criaturas',atitude='defensiva',pers='comum',conf='',ajuda='',dieta=''})=>{
  await page.selectOption('#mdGaveta [data-cr-tipo]',tipo);await page.waitForSelector('#mdGaveta [data-cr-modelo]');
  await page.selectOption('#mdGaveta [data-cr-modelo]',modelo);await page.selectOption('#mdGaveta [data-cr-atitude]',atitude);
  await page.waitForSelector('#mdGaveta [data-cr-pers]');await page.selectOption('#mdGaveta [data-cr-pers]',pers);
  if(conf!=='')await page.selectOption('#mdGaveta [data-cr-conf]',String(conf));if(ajuda!=='')await page.selectOption('#mdGaveta [data-cr-ajuda]',String(ajuda));
  if(dieta)await page.selectOption('#mdGaveta [data-cr-dieta]',dieta);
  await page.click('#mdGaveta [data-cr-add]');await page.waitForTimeout(1200);};
 const abrirPainel=async()=>{await page.click('#mdBotao');await page.waitForSelector('#mdGaveta:not([hidden])');await page.click('#mdGaveta [data-aba="bichos"]');await page.waitForSelector('#mdGaveta [data-cr-add]');};
 const fechar=async()=>{await page.click('#mdGaveta [data-fechar]');await ajusta();};
 const espera=async(fn,ms,passo=1000,arg)=>{const t=Date.now();while(Date.now()-t<ms){if(await page.evaluate(fn,arg))return true;await page.waitForTimeout(passo);}return false;};
 const idc=m=>'synccriatura%3A'+m;
 const res={};
 // ===== Cena 1: construtora + macaco faminto (frugívoro)
 await legenda('1) Coloco um Escavador (construtor) e um Macaco FRUGÍVORO com fome, usando os novos campos do painel');
 await abrirPainel();
 await colocar2({modelo:'escavador_de_carapaca',pers:'construtora',conf:0});
 await colocar2({modelo:'macacodecalico',pers:'explorador',dieta:'frugivora'});
 await page.screenshot({path:path.join(root,'docs','imagens','v200-demo-4.png')});
 await fechar();
 await page.evaluate(i=>window.expl._estado().sat.set(i,18),idc('macacodecalico'));
 await legenda('🍎 O macaco está com fome: procura uma árvore e come frutos (barra laranja = saciedade)');
 res.comeu=await espera(i=>window.expl.saciedade(i)>60,60000,1000,idc('macacodecalico'));
 log('macaco comeu fruto:',res.comeu,'saciedade',await page.evaluate(i=>Math.round(window.expl.saciedade(i)),idc('macacodecalico')));
 await legenda('🕳️ O Escavador junta pedras e árvores e constrói a toca');
 res.toca=await espera(()=>window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects.some(o=>o.tocaV200),90000,1500);
 log('toca construída:',res.toca);
 // ===== Cena 2: entra na toca
 await legenda('🏃 O jogador chega perto do Escavador: ele corre para a toca e ENTRA nela (fica esmaecido)');
 const pe=await pos(idc('escavador_de_carapaca'));
 await page.evaluate(p=>window.tok('pj1','Jogador',Math.max(1,p.x-3.5),p.y),pe);
 res.dentro=await espera(i=>window.expl.dentro(i),25000,500,idc('escavador_de_carapaca'));
 log('escavador dentro da toca:',res.dentro);
 await page.waitForTimeout(3500);await page.screenshot({path:path.join(root,'docs','imagens','v200-demo-5.png')});
 await page.evaluate(()=>window.tok('pj1','Jogador',27,13));
 await legenda('A ameaça se afastou: ele sai da toca');
 res.saiu=await espera(i=>!window.expl.dentro(i),30000,500,idc('escavador_de_carapaca'));
 log('saiu da toca:',res.saiu);
 // ===== Cena 3: NPC se tranca em casa
 await legenda('3) Um NPC (Guarda) com a porta da casa fechada: o jogador chega e ele ABRE, ENTRA e FECHA a porta');
 await page.evaluate(()=>{const c=window.store['combatesAtivos/mapaMesaSyncDiretaCena'];c.objects=c.objects.map(o=>o.id==='porta1'?{...o,bloqueiaMovimento:true,camada:3,estadoInterativo:{aberto:false,trancado:false,orig:{bloq:true,camada:3,visao:null}}}:o);window.store['combatesAtivos/mapaMesaSyncDiretaCena']={...c};});
 await page.evaluate(()=>window.notify('combatesAtivos/mapaMesaSyncDiretaCena'));
 await abrirPainel();
 await colocar2({modelo:'npc_guarda',tipo:'npcs',atitude:'defensiva'});
 await fechar();
 const idn='syncnpc%3Anpc_guarda';
 await page.evaluate(()=>window.tok('pj1','Jogador',12,7));
 // o NPC precisa estar do lado de fora, perto da porta
 await page.evaluate(i=>window.tok(i,'NPC · Guarda',17.5,7,{mapaId:'mapa_demo'}),idn);
 await page.waitForTimeout(500);
 await page.evaluate(()=>window.tok('pj1','Jogador',12.5,7));
 await legenda('🚪 O Guarda corre para a porta, abre, entra e fecha atrás de si');
 for(let k=0;k<14;k++){await page.waitForTimeout(2000);log('  npc',JSON.stringify(await page.evaluate(i=>{const o=window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects.find(o=>o.id==='porta1'),p=window.store['combatesAtivos/mapaMesaSyncDireta/posicoes/'+i],e=window.expl._estado().pend.get(i);return {x:p&&+p.x.toFixed(2),y:p&&+p.y.toFixed(2),aberto:o.estadoInterativo?.aberto,bloq:o.bloqueiaMovimento,etapa:e?.etapa};},idn)));}
 res.npcDentro=await espera(()=>{const o=window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects.find(o=>o.id==='porta1'),p=window.store['combatesAtivos/mapaMesaSyncDireta/posicoes/syncnpc%3Anpc_guarda'];return p&&p.x>21.5&&!o.estadoInterativo?.aberto&&o.bloqueiaMovimento;},40000,700);
 log('DBG npc',JSON.stringify(await page.evaluate(i=>({pend:window.expl._estado().pend.get(i),porta:window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects.find(o=>o.id==='porta1'),pos:window.store['combatesAtivos/mapaMesaSyncDireta/posicoes/'+i]?.x}),idn)).slice(0,600));
 log('NPC dentro com a porta fechada:',res.npcDentro,JSON.stringify(await pos(idn)));
 await page.waitForTimeout(2500);await page.screenshot({path:path.join(root,'docs','imagens','v200-demo-6.png')});
 await page.evaluate(()=>window.tok('pj1','Jogador',1.2,12.5));
 // ===== Cena 4: caçadora
 await legenda('4) Uma Insetoide CAÇADORA faminta persegue uma Larva menor, a mata e come — e fica satisfeita');
 await abrirPainel();
 await colocar2({modelo:'larva_interdimensional',atitude:'pacifica',conf:0});
 await colocar2({modelo:'insetoide_predador',atitude:'defensiva',dieta:'cacadora'});
 await fechar();
 await page.evaluate(i=>window.expl._estado().sat.set(i,10),idc('insetoide_predador'));
 res.fadigaAntes=await page.evaluate(i=>Math.round(window.vida.fadiga(i)),idc('insetoide_predador'));
 res.mortos=await page.evaluate(()=>Object.entries(window.store['combatesAtivos/mapaMesaSyncSaude'].actors).filter(([k,v])=>v.combateLab?.morto).map(([k])=>k));
 res.matou=await espera(()=>{const a=window.store['combatesAtivos/mapaMesaSyncSaude'].actors['synccriatura%3Alarva_interdimensional'];return !!a?.combateLab?.morto;},70000,1000);
 await page.waitForTimeout(8000);
 res.satisfeita=await page.evaluate(i=>Math.round(window.expl.saciedade(i)),idc('insetoide_predador'));
 res.fadigaDepois=await page.evaluate(i=>Math.round(window.vida.fadiga(i)),idc('insetoide_predador'));
 res.mortos=await page.evaluate(()=>Object.entries(window.store['combatesAtivos/mapaMesaSyncSaude'].actors).filter(([k,v])=>v.combateLab?.morto).map(([k])=>k));log('mortos:',res.mortos.join());log('caçadora matou a larva:',res.matou,'| saciedade',res.satisfeita,'| fadiga',res.fadigaAntes,'→',res.fadigaDepois);
 await page.screenshot({path:path.join(root,'docs','imagens','v200-demo-7.png')});
 await legenda('Fim da demonstração');await page.waitForTimeout(1500);
 log('RESULTADO',JSON.stringify(res));
 log('erros:',[...new Set(erros)].slice(0,8).join(' // ').slice(0,1200));
 await ctx.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
