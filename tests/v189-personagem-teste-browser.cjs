// v189 — Kael Teste percorre a masmorra no Chrome (sem janela, banco falso) e testa o que o Yuri pediu:
//  1) percebe uma armadilha (Percepção) e SALTA por cima (Atletismo); depois falha o salto e cai nela (Esquiva, dano);
//  2) força a alavanca emperrada (Força Bruta): falha, depois sucesso → a cela do arsenal se abre;
//  3) abre o baú da sala do altar e tenta a porta trancada da cripta (Mecanismos: falha, depois sucesso), pelas regras do módulo de objetos;
//  4) foge de monstro: entra em Recuo (Defesa +15, velocidade ×1,6) pelo módulo de atitudes;
//  5) reconstrói uma parede quebrada com o 🧱 e com o X do controle;
//  6) a armadilha do corredor liberta a cela do anfiteatro.
// Roda: node tests/v189-personagem-teste-browser.cjs
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');let warns=[];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
 const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());if(m.type()==='warning')warns.push(m.text());});
 await page.route('https://nova.test/**',route=>{const name=new URL(route.request().url()).pathname.slice(1);
  if(name.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,name),'utf8')});
  return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:8px"><div id="wrap" style="position:relative;width:1200px;height:720px;background:#1a2235"><div id="novaSyncBoard" style="position:absolute;inset:0"></div></div></main>'});});
 await page.goto('https://nova.test/');
 const r=await page.evaluate(async()=>{
  const dies=[];window.proximoDado=(...d)=>dies.push(...d.map(v=>(v-1)/100+.001));const realRandom=Math.random;Math.random=()=>dies.length?dies.shift():realRandom();
  const store=window.store={},subs=[],log=window.log=[];
  const snap=r=>({exists:()=>r.p in store,data:()=>store[r.p]});
  const fire=s=>{if(s.ref.p)s.cb(snap(s.ref));else s.cb({forEach:f=>{for(const [q,v] of Object.entries(store))if(q.startsWith(s.ref.col+'/'))f({id:q.slice(s.ref.col.length+1),data:()=>v});}});};
  const emit=q=>{for(const s of [...subs])if(s.ref.p===q||(s.ref.col&&q.startsWith(s.ref.col+'/')))fire(s);};
  const M=await import('/mesa-masmorra.js'),K=await import('/mesa-controle.js'),A=await import('/mesa-atitudes.js'),O=await import('/mesa-objetos.js'),AD=await import('/mesa-atitudes-dados.js');
  const g=M.gerarMasmorra({objetos:[]}),cena=M.cenaMasmorra(g);
  const ent=M.metros(g.entrada.x,g.entrada.y);
  const tokens=[{id:'teste_jogador_v138',nome:'Kael Teste',x:ent.x,y:ent.y,donoUid:'master',mapaId:M.ID_MASMORRA,diametroM:1}];
  const board=document.getElementById('novaSyncBoard');
  const desenharTokens=()=>{for(const t of tokens){let n=board.querySelector(`[data-token="${t.id}"]`);if(!n){n=document.createElement('div');n.dataset.token=t.id;n.style.cssText='position:absolute;width:28px;height:28px;border-radius:50%;background:#7a9;transform:translate(-50%,-50%)';board.append(n);}n.style.left=t.x/28*100+'%';n.style.top=t.y/14*100+'%';}};
  desenharTokens();
  const ctl={ator:()=>tokens[0],controla:()=>true,tokensNoMapa:()=>tokens,todosTokens:()=>tokens,token:id=>tokens.find(t=>t.id===id),mapaAtual:()=>M.ID_MASMORRA,alvo:()=>'',marcarAlvo(){},andarDirecao(){return true;},pararAndar(){},openMap:async()=>{}};
  const dep={db:{},doc:(db,q)=>({p:q}),getDoc:async r=>snap(r),setDoc:async(r,v,o)=>{store[r.p]=o?.merge?{...(store[r.p]||{}),...v}:v;emit(r.p);},deleteDoc:async r=>{delete store[r.p];emit(r.p);},
   onSnapshot:(ref,cb)=>{const s={ref,cb};subs.push(s);setTimeout(()=>fire(s),0);return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1);};},
   collection:(db,...segs)=>({col:segs.join('/')}),runTransaction:async(db,fn)=>{const w=[];const r=await fn({get:async r=>snap(r),set:(r,v)=>w.push([r.p,v])});for(const [q,v] of w){store[q]=v;emit(q);}return r;},
   controller:()=>ctl,ehMestre:()=>true,uid:()=>'master',mapas:()=>[{id:M.ID_MASMORRA}],objetos:()=>[],criaturas:()=>[],itens:()=>[],personagens:()=>[],
   pericia:async(t,nomes)=>{log.push('pericia:'+nomes[0]);return 50;},
   atingir:async(t,h,mapa,o)=>{log.push('dano:'+o.dano+':'+o.nome);return {combateLab:{hit:{Perna:3},ferido:true},total:5,dano:{local:'Perna Direita'}};}};
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:M.ID_MASMORRA,combat:null,larguraM:M.W,alturaM:M.H};
  store['combatesAtivos/mapaMesaSyncDiretaCena']=cena;
  store['combatesAtivos/mapaMesaSyncSaude']={actors:{},revision:0};
  store['combatesAtivos/mapaMesaSyncHistorico']={entries:[],revision:0};
  store['configuracoes/masmorraV184']={em:'já',versao:189};
  store['combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138']={...tokens[0],revision:0};
  store['combatesAtivos/mesaTempoReal']={ativo:true,mapId:M.ID_MASMORRA,iniciadoEm:1,pausado:false};
  window.mesaPedagioV138_={pericia:dep.pericia};
  window.mm=M.instalarMasmorra(dep);window.at=A.instalarAtitudes(dep);
  const pad={id:'Xbox Falso',index:0,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.pad=pad;navigator.getGamepads=()=>[pad];
  window.ctlMod=K.instalarControle({controller:()=>ctl});
  window.moverKael=(x,y)=>{tokens[0].x=x;tokens[0].y=y;desenharTokens();};window.irParaM=(xm,ym)=>{const p=M.metros(xm,ym);window.moverKael(p.x,p.y);return p;};
  window.g=g;window.M=M;window.O=O;window.AD=AD;window.tokens=tokens;
  return {objetos:cena.objects.length,traps:g.armadilhas.length,jaulas:g.jaulas.length,portas:g.portas.length};
 });
 assert.equal(r.traps,6);assert.equal(r.jaulas,2);
 await page.waitForTimeout(700);
 const objs=()=>page.evaluate(()=>window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects);
 const hist=()=>page.evaluate(()=>window.store['combatesAtivos/mapaMesaSyncHistorico'].entries.map(e=>e.message));
 const esperar=(re,ms=4000)=>page.waitForFunction(src=>(window.store['combatesAtivos/mapaMesaSyncHistorico'].entries||[]).some(e=>new RegExp(src).test(e.message)),re.source,{timeout:ms});
 // 1) percebe a armadilha (Percepção, dado 10 contra 50) chegando perto; salta por cima (Atletismo, dado 20); depois falha o salto (dado 90) e cai (Esquiva 80 → dano)
 const a0=await page.evaluate(()=>window.g.armadilhas.find(a=>!a.liberta));
 await page.evaluate(([a])=>{window.proximoDado(10);window.irParaM(a.x+1.2,a.y);},[a0]);
 await esperar(/👁️ Kael Teste percebe uma armadilha/);
 let h=await hist();assert.match(h.at(-1),/Percepção 10\/50/);
 let trap=(await objs()).find(o=>o.armadilhaV184&&o.reveladaV184);assert.ok(trap&&trap.opacity===.85,'laje revelada fica visível');
 await page.evaluate(([a])=>{window.proximoDado(20);window.irParaM(a.x,a.y);},[a0]);
 await esperar(/🤸 Kael Teste salta por cima da armadilha/);
 h=await hist();assert.match(h.at(-1),/Atletismo 20\/50 → Sucesso/);assert.ok(!h.some(m=>/pisa numa armadilha/.test(m)),'saltou: não disparou');
 await page.evaluate(([a])=>{window.irParaM(a.x+1.5,a.y);},[a0]);await page.waitForTimeout(500);
 await page.evaluate(([a])=>{window.proximoDado(90,80);window.irParaM(a.x,a.y);},[a0]);
 await esperar(/pisa numa armadilha/);
 h=await hist();assert.match(h.at(-2),/tenta saltar .* Atletismo 90\/50 → Falha · cai em cima dela!/);assert.match(h.at(-1),/pisa numa armadilha de (estacas|lâminas) · Esquiva 80\/(50|40) → Falha · dano 5 \(Perna Direita\)/);
 let saude=await page.evaluate(()=>window.store['combatesAtivos/mapaMesaSyncSaude'].actors.teste_jogador_v138);assert.equal(saude.combateLab.hit.Perna,3);
 console.log('PASS armadilha: percebe (Percepção), salta por cima (Atletismo), e quando falha o salto cai nela e leva dano');
 // 2) alavanca emperrada: Força Bruta falha (dado 95) → não se mexe; sucesso (dado 30) → destrava e a cela do arsenal se abre
 await page.evaluate(()=>{const al=window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects.find(o=>o.alavancaV186);window.moverKael(al.x+.4*28/window.M.W,al.y+.3*14/window.M.H);});
 await page.waitForSelector('#maCamada [data-alavanca]',{timeout:4000});
 await page.evaluate(()=>window.proximoDado(95));await page.locator('#maCamada [data-alavanca]').first().click();
 await esperar(/força a alavanca emperrada/);h=await hist();assert.match(h.at(-1),/Força bruta 95\/50 → Falha · não se mexe\./);
 let j1=(await objs()).filter(o=>o.jaulaV186==='j1');assert.ok(j1.every(o=>o.bloqueiaMovimento),'cela 1 segue fechada');
 await page.waitForTimeout(300);await page.evaluate(()=>window.proximoDado(30));await page.locator('#maCamada [data-alavanca]').first().click();
 await esperar(/destrava a alavanca emperrada/);h=await hist();assert.match(h.at(-1),/Força bruta 30\/50 → Sucesso · 🔓 a cela se abre!/);
 j1=(await objs()).filter(o=>o.jaulaV186==='j1');assert.ok(j1.some(o=>o.portaJaulaV186&&o.abertaV186&&!o.bloqueiaMovimento),'portão da cela 1 aberto');
 const al=(await objs()).find(o=>o.alavancaV186);assert.equal(al.emperradaV189,false);assert.equal(al.nome,'Alavanca (puxada)');
 await page.waitForTimeout(500);assert.equal(await page.locator('#maCamada [data-alavanca]').count(),0,'alavanca puxada some');
 console.log('PASS alavanca emperrada: Força Bruta falha e depois destrava; a cela do arsenal abre');
 // 3) baú e porta trancada pelas regras do módulo de objetos (a até 2 m)
 const r3=await page.evaluate(()=>{const objs=window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects,W=window.M.W,H=window.M.H;const bau=objs.find(o=>o.nome==='Baú brasonado');
  window.moverKael(bau.x+1*28/W,bau.y);const t=window.tokens[0];const d=window.O.distanciaObjeto(t,bau,W,H);
  const ab=window.O.aplicarPedido(bau,{acao:'alternar',nome:'Kael Teste'});const porta=objs.find(o=>o.nome==='Porta da cripta');
  let erro='';try{window.O.aplicarPedido(porta,{acao:'alternar',nome:'Kael Teste'});}catch(e){erro=e.message;}
  const f=window.O.aplicarPedido(porta,{acao:'teste',nome:'Kael Teste',personagemId:'teste_jogador_v138',teste:{pericia:'Mecanismos',die:77,valor:50,grau:'Falha',sucesso:false}});
  const s=window.O.aplicarPedido(f.objeto,{acao:'teste',nome:'Kael Teste',personagemId:'teste_jogador_v138',teste:{pericia:'Força Bruta',die:12,valor:50,grau:'Sucesso',sucesso:true}});
  return {d,abriu:window.O.estadoDe(ab.objeto).aberto,msg:ab.msg,erro,trancadaDepoisDaFalha:window.O.estadoDe(f.objeto).trancado,aberta:window.O.estadoDe(s.objeto).aberto,msg2:s.msg};});
 assert.ok(r3.d<=2,'Kael a até 2 m do baú');assert.equal(r3.abriu,true);assert.match(r3.msg,/Kael Teste abriu: Baú brasonado/);assert.match(r3.erro,/trancad/);assert.equal(r3.trancadaDepoisDaFalha,true);assert.equal(r3.aberta,true);assert.match(r3.msg2,/arrombou: Porta da cripta/);
 console.log('PASS baú abre; porta trancada resiste ao primeiro teste e cede à Força Bruta');
 // 4) fugir de monstro: Recuo pelo módulo de atitudes (barra 💨)
 await page.waitForSelector('#rtModos button[data-modo="fuga"]',{timeout:4000});await page.click('#rtModos button[data-modo="fuga"]');await page.waitForTimeout(600);
 const fuga=await page.evaluate(()=>{const a=window.store['combatesAtivos/mapaMesaSyncSaude'].actors.teste_jogador_v138;const p=window.AD.perfilRT(a,window.store['combatesAtivos/mesaTempoReal'],window.store['combatesAtivos/mapaMesaSyncDireta']);return {modo:a.modoRT?.modo,vel:p.velocidade,def:p.defesa,ataca:p.podeAtacar};});
 assert.equal(fuga.modo,'fuga');assert.equal(fuga.vel,1.6);assert.equal(fuga.def,15);assert.equal(fuga.ataca,false);
 await page.waitForTimeout(1100);await page.click('#rtModos button[data-modo="normal"]');await page.waitForTimeout(500);
 console.log('PASS fugir: Recuo deixa Kael 1,6× mais rápido, +15 na defesa e sem ataques; volta ao Normal');
 // 5) parede quebrada → 🧱 (clique) e X do controle
 await page.evaluate(()=>{const cena=window.store['combatesAtivos/mapaMesaSyncDiretaCena'],ent=window.M.metros(window.g.entrada.x,window.g.entrada.y);window.moverKael(ent.x,ent.y);
  const par=cena.objects.filter(o=>o.nome==='Parede de pedra').map(o=>({o,d:Math.hypot((o.x-ent.x)*window.M.W/28,(o.y-ent.y)*window.M.H/14)})).sort((a,b)=>a.d-b.d)[0].o;
  Object.assign(par,{destruido:true,pvAtual:0,bloqueiaMovimento:false,bloqueiaVisao:false,bloqueiosOriginais:{movimento:true,visao:true}});window.paredeId=par.id;window.store['combatesAtivos/mapaMesaSyncDiretaCena']={...cena,objects:[...cena.objects]};});
 await page.waitForSelector('#maCamada [data-rec]',{timeout:4000});await page.evaluate(()=>window.proximoDado(31));await page.locator('#maCamada [data-rec]').first().click();
 const pid=await page.evaluate(()=>window.paredeId);
 await page.waitForFunction(id=>{const o=window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects.find(x=>x.id===id);return o&&o.pvAtual===12;},pid,{timeout:4000});
 await page.waitForTimeout(2600);await page.evaluate(()=>{window.proximoDado(3);window.pad.buttons[2]={pressed:true,value:1};});await page.waitForTimeout(120);await page.evaluate(()=>{window.pad.buttons[2]={pressed:false,value:0};});
 await page.waitForFunction(id=>{const o=window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects.find(x=>x.id===id);return o&&o.pvAtual===24;},pid,{timeout:4000});
 console.log('PASS reconstruir: 🧱 pelo clique e pelo X do controle');
 // 6) a armadilha do corredor liberta a cela do anfiteatro (não percebida: Esquiva direto)
 await page.evaluate(()=>{const a=window.g.armadilhas.find(x=>x.liberta==='j2');window.proximoDado(80);window.irParaM(a.x,a.y);});
 await esperar(/um mecanismo range: uma jaula se abre/);
 const j2=(await objs()).filter(o=>o.jaulaV186==='j2');assert.ok(j2.some(o=>o.portaJaulaV186&&o.abertaV186&&!o.bloqueiaMovimento));
 console.log('PASS armadilha do corredor liberta a cela do anfiteatro');
 await page.locator('#mmBotao').click();await page.waitForSelector('#mmPop button[data-ir]');
 assert.deepEqual(errors,[]);
 console.log('PASS v189 personagem de teste: tudo funcionou, sem erros de página');
 await browser.close();
})().catch(e=>{console.error('FALHOU',e);console.error('avisos:',warns);process.exit(1);});
