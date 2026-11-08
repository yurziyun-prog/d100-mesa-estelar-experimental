// v190 — Chrome sem janela, banco falso: estrutura dos mapas, usar itens (🎒) e montaria/veículos.
//  1) estrutura: mapas soltos e a masmorra ganham ligações; uma segunda conferência não grava nada;
//  2) itens: Kael usa Kit Médico (cura + estanca), Café (Fadiga melhora; segundo café é recusado), Antídoto, Lanterna (luz acende);
//  3) transporte: monta o Dragão-Trombeta domesticado (×2, a montaria vai junto, animação), desce; dirige o aerocarro (o veículo vai junto e vira);
//     pilota a nave (propulsor e sombra).
// Roda: node tests/v190-browser.cjs
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');let warns=[];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
 const errors=[];
 for(const [w,alt] of [[1280,800],[390,844]]){
 const page=await (await browser.newContext({viewport:{width:w,height:alt}})).newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());if(m.type()==='warning')warns.push(m.text());});
 await page.route('https://nova.test/**',route=>{const name=new URL(route.request().url()).pathname.slice(1);
  if(name.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,name),'utf8')});
  return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">'+css+'<main style="padding:8px"><div id="wrap" style="position:relative;width:100%;aspect-ratio:2/1;background:#1a2235"><div id="novaSyncBoard" style="position:absolute;inset:0"></div></div></main>'});});
 await page.goto('https://nova.test/');
 await page.evaluate(async()=>{
  const dies=[];Math.random=(r=>()=>dies.length?dies.shift():r())(Math.random);
  const store=window.store={},subs=[];
  const snap=r=>({exists:()=>r.p in store,data:()=>store[r.p]});
  const fire=s=>{if(s.ref.p)s.cb(snap(s.ref));else s.cb({forEach:f=>{for(const [q,v] of Object.entries(store))if(q.startsWith(s.ref.col+'/'))f({id:q.slice(s.ref.col.length+1),data:()=>v});}});};
  const emit=q=>{for(const s of [...subs])if(s.ref.p===q||(s.ref.col&&q.startsWith(s.ref.col+'/')))fire(s);};
  const E=await import('/mesa-estrutura.js'),U=await import('/mesa-uso-itens.js'),T=await import('/mesa-transporte.js');
  const tokens=[{id:'teste_jogador_v138',nome:'Kael Teste',x:10,y:7,donoUid:'master',mapaId:'m1',diametroM:1,facing:0},
   {id:encodeURIComponent('synccriatura:dragao_trombeta_corredor_domesticado'),nome:'Dragão-Trombeta Corredor Domesticado',x:11.1,y:7,donoUid:'',mapaId:'m1',diametroM:2.2,facing:0,imagem:'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27/%3E'},
   {id:encodeURIComponent('synccriatura:zumbi_1'),nome:'Zumbi',x:10.6,y:8,donoUid:'',mapaId:'m1',diametroM:1,facing:0}];
  const board=document.getElementById('novaSyncBoard');
  const desenhar=()=>{for(const t of tokens){let n=board.querySelector(`[data-token="${CSS.escape(t.id)}"]`);if(!n){n=document.createElement('div');n.dataset.token=t.id;n.style.cssText='position:absolute;width:28px;height:28px;border-radius:50%;background:#7a9;transform:translate(-50%,-50%)';board.append(n);}n.style.left=t.x/28*100+'%';n.style.top=t.y/14*100+'%';}};desenhar();
  const ctl={ator:()=>tokens[0],controla:()=>true,tokensNoMapa:()=>tokens,todosTokens:()=>tokens,token:id=>tokens.find(t=>t.id===id),mapaAtual:()=>'m1',dimsAtual:()=>({W:28,H:14}),emCombate:()=>false,gastarAcao:async()=>true};
  const criaturas=[{id:'dragao_trombeta_corredor_domesticado',nome:'Dragão-Trombeta Corredor Domesticado'},{id:'zumbi_1',nome:'Cadáver'}];
  const dep={db:{},doc:(db,q)=>({p:q}),getDoc:async r=>snap(r),setDoc:async(r,v,o)=>{store[r.p]=o?.merge?{...(store[r.p]||{}),...v}:v;emit(r.p);},deleteDoc:async r=>{delete store[r.p];emit(r.p);},
   onSnapshot:(ref,cb)=>{const s={ref,cb};subs.push(s);setTimeout(()=>fire(s),0);return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1);};},
   collection:(db,...segs)=>({col:segs.join('/')}),runTransaction:async(db,fn)=>{const w=[];const r=await fn({get:async r=>snap(r),set:(r,v)=>w.push([r.p,v])});for(const [q,v] of w){store[q]=v;emit(q);}return r;},
   controller:()=>ctl,ehMestre:()=>true,uid:()=>'master',criaturas:()=>criaturas,
   mapas:()=>[{id:'cenario_c002',nome:'Ruas Escavadas de Véspera',larguraM:56,alturaM:28},{id:'cenario_c001',nome:'Portão de Véspera'},{id:'v138_espacoporto',nome:'Espaço-porto de Véspera'},{id:E.ID_MASMORRA,nome:'Masmorra de treino'},{id:'cidade_sn',nome:'Cidade Sem Nome'},{id:'solto1',nome:'Taverna do Fim'},{id:'solto2',nome:'Mina de Calico'}]};
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:'m1',combat:null,larguraM:28,alturaM:14};
  store['combatesAtivos/mapaMesaSyncDiretaCena']={mapId:'m1',objects:[{id:'carro1',nome:'Aerocarro rubi',modeloId:'pk_vei_aerocarro_rubi',x:10,y:9,larguraM:2.6,alturaM:1.4,angulo:0,camada:3},{id:'nave1',nome:'Caça estelar',modeloId:'pk_nave_caca',x:12,y:11,larguraM:5,alturaM:4,angulo:0,camada:3},{id:'barril1',nome:'Barril',x:10,y:6,larguraM:1,alturaM:1,camada:3}]};
  store['combatesAtivos/mapaMesaSyncSaude']={actors:{teste_jogador_v138:{combateLab:{hitMax:{Peito:10,'Braço':4},hit:{Peito:10,'Braço':0},sangrando:true,envenenado:true}}},revision:0};
  store['combatesAtivos/mapaMesaSyncHistorico']={entries:[],revision:0};
  store['combatesAtivos/mapaMesaSyncDireta/posicoes/'+tokens[1].id]={...tokens[1],revision:0};
  store['personagens/teste_jogador_v138']={nome:'Kael Teste',combate:{fadiga:'Tired'},inventario:{equipado:[{id:'espada_longa',nome:'Espada Longa',instanciaId:'e1'}],bolso:[{id:'kit_medico',nome:'Kit Médico Básico',uso:'3',instanciaId:'k1'}],mochila:[{id:'cafe',nome:'Café',instanciaId:'c1'},{id:'cafe',nome:'Café',instanciaId:'c2'},{id:'antidoto_universal',nome:'Antídoto Universal',uso:'1',instanciaId:'a1'},{id:'lanterna',nome:'Lanterna',uso:'24',instanciaId:'l1'}]}};
  store['combatesAtivos/mesaLigacoes']={ligacoes:[{id:'velha',a:{mapa:'cenario_c001',x:1,y:1},b:{mapa:'mapa_apagado',x:2,y:2}}]};
  window.dep=dep;window.E=E;window.T=T;window.tokens=tokens;window.desenhar=desenhar;window.ctl=ctl;
  window.est=E.instalarEstrutura(dep);window.itens=U.instalarUsoItens(dep);window.tp=T.instalarTransporte(dep);
  window.moverKael=(x,y,f)=>{tokens[0].x=x;tokens[0].y=y;if(f!==undefined)tokens[0].facing=f;store['combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138']={...tokens[0],revision:0};desenhar();};
  window.hoje=Date.now;
 });
 const hist=()=>page.evaluate(()=>window.store['combatesAtivos/mapaMesaSyncHistorico'].entries.map(e=>e.message));
 // 1) estrutura
 const rel=await page.evaluate(()=>window.est.conferir());
 assert.ok(rel.removidas.includes('velha'),'ligação quebrada tirada');assert.ok(rel.novas.includes('lig_v190_masmorra_entrada')&&rel.novas.includes('lig_v190_masmorra_saida'),'masmorra ligada');
 assert.ok(rel.novas.includes('lig_v190_masmorra_poco'),'poço liga a masmorra à Cidade Sem Nome');assert.equal(rel.depois.componentes,1);assert.deepEqual(rel.depois.soltos,[]);assert.deepEqual(rel.depois.quebradas,[]);
 const ligs=await page.evaluate(()=>window.store['combatesAtivos/mesaLigacoes'].ligacoes);assert.ok(ligs.length>=5);assert.ok(ligs.every(l=>l.a.x>0&&l.a.x<28&&l.b.y>0&&l.b.y<14));
 const antes=JSON.stringify(ligs);const rel2=await page.evaluate(()=>window.est.conferir());assert.deepEqual([rel2.removidas,rel2.novas,rel2.ajustadas],[[],[],0]);
 assert.equal(JSON.stringify(await page.evaluate(()=>window.store['combatesAtivos/mesaLigacoes'].ligacoes)),antes,'segunda conferência não muda nada');
 console.log(`PASS [${w}px] estrutura: ligação quebrada tirada, masmorra (com poço) e ${ligs.length-3} mapa(s) ligados, tudo num grupo só, idempotente`);
 // 2) itens
 await page.waitForSelector('#uiBotao',{timeout:4000});await page.click('#uiBotao');await page.waitForSelector('#uiPop button[data-c]',{timeout:4000});
 let lista=await page.locator('#uiPop button[data-c]').allTextContents();assert.equal(lista.length,5);assert.ok(lista.some(t=>/Kit Médico Básico.*3 usos/.test(t)));assert.ok(!lista.some(t=>/Espada/.test(t)),'espada não é item de uso');
 const clicar=async nome=>{await page.locator('#uiPop button[data-c]',{hasText:nome}).first().click();await page.waitForTimeout(500);};
 await clicar('Kit Médico');let h=await hist();assert.match(h.at(-1),/Kael Teste usa Kit Médico Básico: \+2 PV em Braço · estancou o sangramento/);
 let st=await page.evaluate(()=>({a:window.store['combatesAtivos/mapaMesaSyncSaude'].actors.teste_jogador_v138,inv:window.store['personagens/teste_jogador_v138'].inventario}));
 assert.equal(st.a.combateLab.hit['Braço'],2);assert.equal(st.a.combateLab.sangrando,false);assert.equal(st.inv.bolso[0].usosRestantes,2);
 await clicar('Café');h=await hist();assert.match(h.at(-1),/consome Café: Fadiga Cansado → Ofegante/);
 st=await page.evaluate(()=>window.store['personagens/teste_jogador_v138']);assert.equal(st.combate.fadiga,'Winded');assert.equal(st.inventario.mochila[0],null,'café comido some');
 await page.waitForTimeout(300);await clicar('Café');await page.waitForTimeout(200);assert.match(await page.locator('#uiPop').innerText(),/Já usou café há pouco/);
 await clicar('Antídoto');h=await hist();assert.match(h.at(-1),/toma Antídoto Universal: envenenado neutralizado/);assert.equal((await page.evaluate(()=>window.store['personagens/teste_jogador_v138'].inventario.mochila[2])),null,'antídoto de uso único some');
 await clicar('Lanterna');h=await hist();assert.match(h.at(-1),/acende Lanterna \(ilumina 4 m\)/);await page.waitForSelector('#uiLuz i',{timeout:3000});
 await clicar('Lanterna');h=await hist();assert.match(h.at(-1),/apaga Lanterna/);await page.waitForFunction(()=>!document.querySelector('#uiLuz i'),null,{timeout:3000});
 await page.click('#uiBotao');
 console.log(`PASS [${w}px] itens: Kit Médico cura e estanca, Café melhora a Fadiga (e o segundo é recusado), Antídoto, Lanterna acende e apaga`);
 // 3) transporte: montaria
 const esperarBotao=re=>page.waitForFunction(src=>[...document.querySelectorAll('#tpBotao button')].some(b=>new RegExp(src).test(b.textContent)),re.source,{timeout:4000});
 await esperarBotao(/Montar Dragão-Trombeta/);await page.locator('#tpBotao button',{hasText:'Montar'}).first().click();await page.waitForFunction(()=>window.tp.estado('teste_jogador_v138')?.tipo==='montaria',null,{timeout:4000});
 assert.equal(await page.evaluate(()=>window.mesaTransporteVelocidadeV190('teste_jogador_v138')),2);assert.equal(await page.evaluate(()=>window.mesaTransporteVelocidadeV190('outro')),1);
 h=await hist();assert.match(h.at(-1),/Kael Teste monta Dragão-Trombeta Corredor Domesticado · velocidade ×2/);
 await page.evaluate(()=>window.moverKael(6,4,.5));
 await page.waitForFunction(()=>{const m=window.tokens[1];const p=window.store['combatesAtivos/mapaMesaSyncDireta/posicoes/'+m.id];return p&&Math.abs(p.x-6)<.05&&Math.abs(p.y-4)<.05;},null,{timeout:5000});
 await page.evaluate(()=>window.moverKael(6.4,4.2,.5));await page.waitForSelector('#tpCamada .tp-montaria',{state:'attached',timeout:4000});
 assert.ok(await page.evaluate(()=>document.querySelector('[data-token="teste_jogador_v138"]').classList.contains('tp-condutor')),'condutor com a classe de animação');
 await page.waitForFunction(()=>!!document.querySelector('#tpCamada .tp-puf'),null,{timeout:4000});
 await page.waitForFunction(()=>!!document.querySelector('#tpCamada .tp-anel,#tpCamada .tp-bicho'),null,{timeout:3000});
 await page.locator('#tpBotao button',{hasText:'Descer'}).click();await page.waitForFunction(()=>!window.tp.estado('teste_jogador_v138'),null,{timeout:4000});
 await page.waitForFunction(()=>!document.querySelector('[data-token="teste_jogador_v138"]').classList.contains('tp-condutor'),null,{timeout:3000});
 console.log(`PASS [${w}px] montaria: monta o dragão (×2), a montaria acompanha, passada e poeira animadas, desce`);
 // aerocarro
 await page.evaluate(()=>window.moverKael(10.8,9.2,0));await esperarBotao(/Dirigir Aerocarro/);await page.locator('#tpBotao button',{hasText:'Dirigir'}).first().click();
 await page.waitForFunction(()=>window.tp.estado('teste_jogador_v138')?.tipo==='terrestre',null,{timeout:4000});assert.equal(await page.evaluate(()=>window.mesaTransporteVelocidadeV190('teste_jogador_v138')),3.2);
 await page.evaluate(()=>window.moverKael(16,5,Math.PI/2));
 await page.waitForFunction(()=>{const o=window.store['combatesAtivos/mapaMesaSyncDiretaCena'].objects.find(x=>x.id==='carro1');return Math.abs(o.x-16)<.05&&Math.abs(o.y-5)<.05&&o.angulo===90;},null,{timeout:5000});
 await page.waitForSelector('#tpCamada .tp-terrestre .tp-farol',{state:'attached',timeout:3000});
 await page.locator('#tpBotao button',{hasText:'Descer'}).click();await page.waitForFunction(()=>!window.tp.estado('teste_jogador_v138'),null,{timeout:4000});
 console.log(`PASS [${w}px] veículo terrestre: o aerocarro acompanha o motorista e vira para onde ele olha, com faróis`);
 // nave
 await page.evaluate(()=>window.moverKael(13.2,11,0));await esperarBotao(/Pilotar Caça estelar/);await page.locator('#tpBotao button',{hasText:'Pilotar'}).first().click();
 await page.waitForFunction(()=>window.tp.estado('teste_jogador_v138')?.tipo==='espacial',null,{timeout:4000});assert.equal(await page.evaluate(()=>window.mesaTransporteVelocidadeV190('teste_jogador_v138')),4.5);
 await page.evaluate(()=>window.moverKael(14,8,-Math.PI/2));await page.waitForSelector('#tpCamada .tp-espacial .tp-chama',{state:'attached',timeout:4000});await page.waitForSelector('#tpCamada .tp-espacial .tp-vento',{state:'attached',timeout:3000});
 await page.locator('#tpBotao button',{hasText:'Descer'}).click();await page.waitForFunction(()=>!window.tp.estado('teste_jogador_v138'),null,{timeout:4000});
 console.log(`PASS [${w}px] nave: pilota o caça com propulsor, sombra e rastro de velocidade`);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'sem rolagem lateral');
 await page.screenshot({path:path.join(__dirname,'..','_entregas','v190-'+w+'.png')}).catch(()=>{});
 await page.close();}
 assert.deepEqual(errors,[]);
 console.log('PASS v190: estrutura, itens e transporte em 1280 e 390 px, sem erros de página');
 await browser.close();
})().catch(e=>{console.error('FALHOU',e);console.error('avisos:',warns);process.exit(1);});
