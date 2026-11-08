// v200 — O APP REAL (index.html + app.js montado, todos os módulos) com um Firestore de mentira funcional, como MESTRE.
// Prova de verdade: atalhos visíveis (criaturas, gerador de NPC, gerador de mapa), cartão de comportamento ao selecionar/adicionar criatura,
// ajuste de tamanho pelo bestiário (Cavalgante Prismático × Carniçal Dominante), o chão que não arrasta e o gerador de mapas abrindo.
// Roda: node tests/v200-app-real-browser.cjs
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const appSrc=require('../scripts/montar.cjs').montarApp(root),importados={};
for(const m of appSrc.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]https:\/\/www\.gstatic\.com\/firebasejs\/[^/]+\/([\w.-]+)['"]/g)){(importados[m[2]]??=[]).push(...m[1].split(',').map(x=>x.trim().split(/\s+as\s+/)[0]).filter(Boolean));}
const FIRESTORE=names=>{
 const impl=`
 const store=window.__fs=window.__fs||new Map(),subs=[];
 const clone=v=>{if(v&&v.__sv)return new Date().toISOString();if(Array.isArray(v))return v.map(clone);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([,x])=>x!==undefined).map(([k,x])=>[k,clone(x)]));return v;};
 const merge=(a,b)=>{const r={...a};for(const [k,v] of Object.entries(b)){r[k]=v&&typeof v==='object'&&!Array.isArray(v)&&!v.__sv&&a?.[k]&&typeof a[k]==='object'&&!Array.isArray(a[k])?merge(a[k],v):clone(v);}return r;};
 const seg=a=>a.flatMap(x=>String(x).split('/')).filter(Boolean);
 const snapDoc=p=>({id:p.split('/').pop(),exists:()=>store.has(p),data:()=>store.has(p)?structuredClone(store.get(p)):undefined,ref:{path:p},metadata:{hasPendingWrites:false}});
 const kids=c=>[...store.keys()].filter(p=>p.startsWith(c+'/')&&!p.slice(c.length+1).includes('/'));
 const snapCol=c=>{const docs=kids(c).map(snapDoc);return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f),docChanges:()=>docs.map(doc=>({type:'added',doc})),metadata:{hasPendingWrites:false}};};
 const notify=p=>{for(const s of [...subs]){if(s.kind==='doc'&&s.path===p)s.fn(snapDoc(p));else if(s.kind==='col'&&p.startsWith(s.path+'/')&&!p.slice(s.path.length+1).includes('/'))s.fn(snapCol(s.path));}};
 const write=(p,d,o)=>{store.set(p,o?.merge?merge(store.get(p)||{},d):clone(d));notify(p);};window.__fsWrite=write;
 `;
 const defs={
  getFirestore:'export const getFirestore=()=>({});',
  initializeFirestore:'export const initializeFirestore=()=>({});',
  doc:'export const doc=(db,...a)=>({kind:"doc",path:seg(a).join("/"),id:seg(a).slice(-1)[0]});',
  collection:'export const collection=(db,...a)=>({kind:"col",path:seg(a).join("/")});',
  query:'export const query=c=>c;',where:'export const where=()=>({});',orderBy:'export const orderBy=()=>({});',limit:'export const limit=()=>({});',
  getDoc:'export const getDoc=async r=>snapDoc(r.path);',
  getDocs:'export const getDocs=async c=>snapCol(c.path);',
  setDoc:'export const setDoc=async(r,d,o)=>write(r.path,d,o);',
  updateDoc:'export const updateDoc=async(r,d)=>write(r.path,d,{merge:true});',
  deleteDoc:'export const deleteDoc=async r=>{store.delete(r.path);notify(r.path);};',
  onSnapshot:'export const onSnapshot=(r,a,b)=>{const fn=typeof a==="function"?a:b;const s={kind:r.kind,path:r.path,fn};subs.push(s);Promise.resolve().then(()=>fn(r.kind==="doc"?snapDoc(r.path):snapCol(r.path)));return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1);};};',
  runTransaction:'export const runTransaction=async(db,fn)=>{const w=[];const tx={get:async r=>snapDoc(r.path),set:(r,d,o)=>{w.push([r.path,d,o]);return tx;},update:(r,d)=>{w.push([r.path,d,{merge:true}]);return tx;},delete:r=>{w.push([r.path,null]);return tx;}};const out=await fn(tx);for(const [p,d,o] of w){if(d===null){store.delete(p);notify(p);}else write(p,d,o);}return out;};',
  writeBatch:'export const writeBatch=()=>{const w=[];const b={set:(r,d,o)=>{w.push([r.path,d,o]);return b;},update:(r,d)=>{w.push([r.path,d,{merge:true}]);return b;},delete:r=>{w.push([r.path,null]);return b;},commit:async()=>{for(const [p,d,o] of w){if(d===null){store.delete(p);notify(p);}else write(p,d,o);}}};return b;};',
  serverTimestamp:'export const serverTimestamp=()=>({__sv:1});',
  increment:'export const increment=n=>n;',arrayUnion:'export const arrayUnion=(...a)=>a;',arrayRemove:'export const arrayRemove=(...a)=>a;',
  getStorage:'export const getStorage=()=>({});',ref:'export const ref=(s,p)=>({fullPath:p});',uploadBytes:'export const uploadBytes=async()=>({ref:{}});',getDownloadURL:'export const getDownloadURL=async()=>"";'
 };
 return impl+names.map(n=>defs[n]||('export const '+n+'=(...a)=>({});')).join('\n');
};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1500,height:950}});const erros=[];
 page.on('pageerror',e=>erros.push('PAGEERR '+e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='mesa.test'){
   const ehApp=u.pathname.endsWith('/js/app.js'),file=path.join(root,u.pathname==='/'?'index.html':u.pathname);
   if(!ehApp&&!fs.existsSync(file))return route.fulfill({status:404,body:''});
   let body=ehApp?appSrc:(/.(webp|png|jpe?g|gif|ico)$/i.test(file)?fs.readFileSync(file):fs.readFileSync(file,'utf8'));
   if(ehApp)body+=`\nwindow.__APP__={ctl:()=>novaSyncController_,setMestre:()=>{userData={role:'mestre'};currentUserUid='mestre1';},setBancos:(c,n)=>{criaturasDB=c;npcsDB=n;},setObjetos:l=>{objetosMapaDB=l;}};`;
   return route.fulfill({contentType:ehApp||file.endsWith('.js')?'text/javascript':file.endsWith('.webp')?'image/webp':'text/html',body});
  }
  if(u.hostname==='www.gstatic.com'){
   const file=u.pathname.split('/').pop(),names=[...new Set(importados[file]||[])];
   const body=file==='firebase-firestore.js'?FIRESTORE(names):names.map(n=>`export const ${n}=(...args)=>${['onAuthStateChanged'].includes(n)?'(()=>{})':'({})'};`).join('\n');
   return route.fulfill({contentType:'text/javascript',body});
  }
  return route.fulfill({status:200,contentType:'text/javascript',body:''});
 });
 await page.addInitScript(()=>{window.__osc=[];class AC{constructor(){this.currentTime=0;this.state='running';this.sampleRate=44100;this.destination={};}
  createOscillator(){return {type:'',frequency:{setValueAtTime:v=>{window.__osc.push(Math.round(v));},exponentialRampToValueAtTime(){},value:0},connect(){},start(){},stop(){}};}
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},value:0},connect(){}};}createWaveShaper(){return {connect(){}};}
  createBiquadFilter(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){},value:0},Q:{value:0},connect(){}};}
  createBuffer(n){return {getChannelData:()=>new Float32Array(n)};}createBufferSource(){return {connect(){},start(){}};}resume(){}}window.AudioContext=AC;});
 await page.goto('https://mesa.test/');
 await page.waitForFunction(()=>window.__APP__,{timeout:20000});
 // ---- dados de verdade do bestiário (CSV) e um mapa
 const csv=fs.readFileSync(path.join(root,'dados','banco_criaturas_2026-09-26.csv'),'utf8');
 const lin=csv.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean),cab=lin[0].split(';');
 const linha=id=>{const k=cab.indexOf('id');const l=lin.slice(1).map(x=>x.split(';')).find(c=>c[k]===id);return Object.fromEntries(cab.map((h,i)=>[h,l[i]]));};
 const cav=linha('cavalgante_prismatico');
 console.log('bestiário:',cav.nome,'altura',cav.altura,cav.tamanho,'| Carniçal Dominante: altura 2,05 Grande (dados do jogo)');
 const criaturas=[{id:'cavalgante_prismatico',nome:cav.nome,altura:cav.altura,tamanho:cav.tamanho,TAM:cav.TAM},{id:'carnical_dominante',nome:'Carniçal Dominante',altura:'2,05',tamanho:'Grande',TAM:'15'},{id:'besta_ululante',nome:'Besta Ululante',altura:'2,4',tamanho:'Grande'},{id:'zumbi_1',nome:'Zumbi',especie:'Humanoide parasitado',altura:'1,75',tamanho:'Médio'},{id:'cadaver_de_chefe',nome:'Cadáver Chefe',especie:'Humanoide parasitado (estágio avançado)',altura:'1,8',tamanho:'Médio'}];
 await page.evaluate(({criaturas})=>{
  const A=window.__APP__;A.setMestre();A.setBancos(criaturas,[{id:'guarda',nome:'Guarda',carreira:'Guarda'}]);
  const S=window.__fs,M='mapa_real';
  S.set('combatesAtivos/mapaMesaSyncDireta',{mapId:M,nome:'Pátio de pedra',larguraM:28,alturaM:14,fundo:''});
  S.set('mapas/'+M,{nome:'Pátio de pedra',larguraM:28,alturaM:14});
  S.set('combatesAtivos/mapaMesaSyncDiretaCena',{mapId:M,objetoSchema:1,objects:[{id:'chao1',nome:'Chão do mapa',erTipo:'piso',x:14,y:7,larguraM:28,alturaM:14,camada:1,forma:'rect',cor:'#8a7a66',bloqueiaMovimento:false,bloqueiaVisao:false},{id:'arv1',nome:'Árvore',x:22,y:3,larguraM:2,alturaM:2,camada:3,forma:'ellipse',cor:'#2f7d3a',bloqueiaMovimento:true}]});
  const pos=(id,nome,x,y,extra={})=>S.set('combatesAtivos/mapaMesaSyncDireta/posicoes/'+id,{nome,imagem:'',donoUid:'',x,y,revision:0,facing:0,camada:3,mapaId:M,diametroM:1,...extra});
  pos('synccriatura%3Acavalgante_prismatico','Monstro · Cavalgante Prismático',8,6);   /* tamanho antigo: 1 m (o erro do mestre) */
  pos('synccriatura%3Acarnical_dominante','Monstro · Carniçal Dominante',16,6,{diametroM:1.95});
  S.set('combatesAtivos/mapaMesaSyncSaude',{revision:1,actors:{'synccriatura%3Acarnical_dominante':{repouso:true}}}); /* quieto: a vida não o move durante o teste de arrastar */
  window.__ready=A.ctl().open();
 },{criaturas});
 // deixa a mesa visível (a tela de login do app real cobre tudo)
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}document.getElementById('loginScreen')&&(document.getElementById('loginScreen').style.display='none');});
 await page.waitForSelector('#novaSyncBoard [data-token]',{timeout:20000});
 await page.waitForTimeout(3500);
 // v220: a visão de mestre começa em foco (mapa grande); abre os painéis para usar as ferramentas.
 await page.evaluate(()=>document.getElementById('novaSyncFocus')?.click());
 await page.waitForTimeout(700);
 // ===== 1) atalhos visíveis, com nome
 const atalhos=await page.evaluate(()=>[...document.querySelectorAll('#mdAtalhos button')].map(b=>({t:b.textContent.trim(),v:b.offsetWidth>0&&b.offsetHeight>0})));
 console.log('atalhos:',JSON.stringify(atalhos));
 assert.ok(atalhos.length>=4&&['Criaturas e comportamento','Gerar NPC','Gerar mapa','Combate','Galeria 3D','Mapa de teste'].every(n=>atalhos.some(a=>a.t.includes(n)&&a.v)),'atalhos visíveis: '+JSON.stringify(atalhos));
 assert.ok(atalhos.some(a=>/Criaturas e comportamento/.test(a.t))&&atalhos.some(a=>/Gerar NPC/.test(a.t))&&atalhos.some(a=>/Gerar mapa/.test(a.t)),'nomes dos atalhos');
 await page.evaluate(()=>document.getElementById('novaSyncBoard').scrollIntoView({block:'start'}));
 await page.screenshot({path:path.join(root,'docs','imagens','v200-app-real-1.png')});
 // ===== 2) selecionar uma criatura abre o cartão de comportamento
 await page.evaluate(()=>{const t=document.querySelector('#novaSyncBoard [data-token="synccriatura%3Acavalgante_prismatico"]');t.scrollIntoView({block:'center'});});
 const tk=page.locator('#novaSyncBoard [data-token="synccriatura%3Acavalgante_prismatico"]');
 await tk.click({force:true});await page.waitForTimeout(2800);
 const cartao=await page.evaluate(()=>{const c=document.getElementById('mdCartao');return c&&!c.hidden?{titulo:c.querySelector('.mc-topo b')?.textContent,selects:[...c.querySelectorAll('select[data-mc]')].map(s=>s.dataset.mc),tam:c.querySelector('[data-mc="tam"]')?.textContent||c.textContent.match(/📏[^\n]*/)?.[0]}:null;});
 console.log('cartão:',JSON.stringify(cartao));
 assert.ok(cartao&&cartao.selects.join()==='atitude,pers,conf,ajuda,dieta,arte3d','cartão de comportamento aparece com os 6 seletores (inclui Aparência 3D)');
 assert.ok(/1 → 2,28 m/.test(cartao.tam||''),'o cartão sugere 2,28 m para o Cavalgante Prismático: '+cartao.tam);
 // escolher a atitude no cartão e SALVAR: o botão pergunta se vale só para este ou para toda a espécie
 const salvar=async m=>{await page.click('#mdCartao [data-mc="salvar"]');await page.waitForSelector('#mdCartao .mc-escolha:not([hidden])');await page.click('#mdCartao [data-mc="'+(m==='especie'?'toda-especie':'so-este')+'"]');await page.waitForTimeout(1100);};
 await page.selectOption('#mdCartao [data-mc="atitude"]','agressiva');await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>window.mesaAtitudesIaV200.padroes().cavalgante_prismatico?.atitude),undefined,'escolher no balão NÃO grava: só prepara');
 assert.ok(!(await page.locator('#mdCartao [data-mc="salvar"]').isDisabled()),'o botão Salvar liga ao mudar algo');
 await salvar('especie');
 const pad=await page.evaluate(()=>window.mesaAtitudesIaV200.padroes());
 assert.equal(pad.cavalgante_prismatico?.atitude,'agressiva','primeira classificação vira o padrão da espécie');
 await page.selectOption('#mdCartao [data-mc="dieta"]','frugivora');await salvar('este');
 assert.equal((await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico').dietaV200)),'frugivora');
 // salvar só este personagem × toda a espécie
 const TKN='combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico';
 await page.selectOption('#mdCartao [data-mc="atitude"]','sanguinaria');await salvar('este');
 let r1=await page.evaluate(k=>({tok:window.__fs.get(k).atitudeV200,pad:window.mesaAtitudesIaV200.padroes().cavalgante_prismatico?.atitude}),TKN);
 assert.deepEqual([r1.tok,r1.pad],['sanguinaria','agressiva'],'"só este": o token ganha a atitude e a espécie continua como era');
 await page.selectOption('#mdCartao [data-mc="atitude"]','defensiva');await page.selectOption('#mdCartao [data-mc="pers"]','covarde');await salvar('especie');
 r1=await page.evaluate(k=>({tok:window.__fs.get(k).atitudeV200,pers:window.__fs.get(k).personalidadeV200,pad:window.mesaAtitudesIaV200.padroes().cavalgante_prismatico,at:window.mesaAtitudesIaV200.atitudeDe(window.__APP__.ctl().token('synccriatura%3Acavalgante_prismatico')),pe:window.mesaAtitudesIaV200.personalidadeDe(window.__APP__.ctl().token('synccriatura%3Acavalgante_prismatico'))}),TKN);
 assert.equal(r1.pad.atitude,'defensiva');assert.equal(r1.pad.personalidade,'covarde','"toda a espécie": o padrão ganha atitude e personalidade');
 assert.ok(!r1.tok&&r1.at.origem==='especie'&&r1.pe==='covarde','as exceções individuais somem: o personagem herda a espécie');
 await page.selectOption('#mdCartao [data-mc="atitude"]','agressiva');await page.selectOption('#mdCartao [data-mc="pers"]','comum');await salvar('especie');
 // ajustar o tamanho pelo bestiário
 await page.screenshot({path:path.join(root,'docs','imagens','v200-app-real-2.png')});
 await page.click('#mdCartao [data-mc="tam"]');await page.waitForTimeout(900);
 const d=await page.evaluate(()=>({cav:window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico').diametroM,car:window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acarnical_dominante').diametroM}));
 console.log('tamanhos depois:',JSON.stringify(d));
 assert.ok(d.cav>d.car,'o Cavalgante Prismático (altura 2,40 m) agora é MAIOR que o Carniçal Dominante (2,05 m): '+JSON.stringify(d));
 // ===== 2b) o CHÃO não arrasta (move a tela); a criatura arrasta
 await page.evaluate(()=>{window.mesaCameraV144?.definir?.(2);});await page.waitForTimeout(800);
 const cena0=await page.evaluate(()=>JSON.stringify(window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.map(o=>[o.id,o.x,o.y])));
 const ref0=await page.locator('#novaSyncBoard [data-token="synccriatura%3Acarnical_dominante"]').boundingBox();
 const caixa=await page.locator('#novaSyncBoard').boundingBox();
 await page.mouse.move(caixa.x+caixa.width*.55,caixa.y+caixa.height*.62);await page.mouse.down();await page.mouse.move(caixa.x+caixa.width*.55-90,caixa.y+caixa.height*.62-40,{steps:8});await page.mouse.up();await page.waitForTimeout(900);
 const ref1=await page.locator('#novaSyncBoard [data-token="synccriatura%3Acarnical_dominante"]').boundingBox();
 const cena1=await page.evaluate(()=>JSON.stringify(window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.map(o=>[o.id,o.x,o.y])));
 console.log('chão: tela moveu',Math.round(ref1.x-ref0.x),Math.round(ref1.y-ref0.y),'px; cena igual:',cena0===cena1);
 assert.equal(cena0,cena1,'arrastar o chão NÃO mexe no chão');
 assert.ok(Math.abs(ref1.x-ref0.x)>30||Math.abs(ref1.y-ref0.y)>15,'arrastar o chão move a tela (a criatura se desloca junto com a visão)');
 // arrastar uma ÁRVORE (objeto da cena): ela se move na tela (a gravação é no 💾 Salvar mapa, como já era)
 await page.evaluate(()=>{window.mesaCameraV144?.definir?.(1);});await page.waitForTimeout(900);await page.evaluate(()=>document.getElementById('novaSyncBoard').scrollIntoView({block:'center'}));await page.waitForTimeout(300);
 const arv=page.locator('#novaSyncBoard [data-scene-object="arv1"]');await arv.waitFor();
 const t0=await arv.boundingBox();
 await page.mouse.move(t0.x+t0.width/2,t0.y+t0.height/2);await page.mouse.down();await page.mouse.move(t0.x+t0.width/2-110,t0.y+t0.height/2+30,{steps:10});await page.mouse.up();await page.waitForTimeout(1500);
 const t1=await arv.boundingBox();
 console.log('árvore arrastada:',Math.round(t1.x-t0.x),Math.round(t1.y-t0.y),'px');
 assert.ok(Math.abs(t1.x-t0.x)>60,'a árvore continua arrastável (não virou pan): '+(t1.x-t0.x));
 await page.evaluate(()=>{window.mesaCameraV144?.definir?.(1);});
 // ===== 2c) barras: uma barra de vida só (PV + fadiga juntas); psiquismo só para quem tem poder; a antiga do pé some
 await page.evaluate(()=>window.__fsWrite('combatesAtivos/mapaMesaSyncSaude',{revision:5,actors:{'synccriatura%3Acavalgante_prismatico':{combateLab:{hitMax:{'PV Global':20},hit:{'PV Global':12},armor:{},ferimentos:{}}}}}));
 await page.waitForFunction(()=>document.querySelector('#novaSyncBoard [data-token="synccriatura%3Acavalgante_prismatico"] .vs-barras'),null,{timeout:10000});
 const barras=await page.evaluate(()=>{const n=document.querySelector('#novaSyncBoard [data-token="synccriatura%3Acavalgante_prismatico"]'),b=n.querySelector('.vs-barras'),vis=[...b.querySelectorAll('i')].filter(i=>getComputedStyle(i).display!=='none').map(i=>i.className),r=b.getBoundingClientRect(),nr=n.getBoundingClientRect();return {vis,dentro:r.top>=nr.top-2&&r.bottom<=nr.bottom+2,antiga:[...n.querySelectorAll('.mv-pv')].filter(x=>getComputedStyle(x).display!=='none').length};});
 console.log('barras:',JSON.stringify(barras));
 assert.deepEqual(barras.vis,['pv','fad'],'sem psiquismo: só PV e fadiga (psiquismo e fome só quando existem)');
 assert.equal(barras.antiga,0,'a barra de vida antiga (embaixo) não aparece junto');
 assert.ok(barras.dentro,'as barras ficam juntas, dentro da miniatura');
 // ===== 2d) mesma espécie: zumbi e cadáver chefe (modelos diferentes) são o mesmo bando; Ajuda ligada = não se atacam
 const bando=await page.evaluate(()=>{const A=window.mesaAtitudesIaV200,z={id:'synccriatura%3Azumbi_1'},c={id:'synccriatura%3Acadaver_de_chefe'},o={id:'synccriatura%3Abesta_ululante'};return {zc:A.mesmoBando(z,c),zo:A.mesmoBando(z,o),esp:A.grupoEspecieDe(c)};});
 assert.ok(bando.zc&&!bando.zo,'todos os "Humanoide parasitado" são da mesma espécie: '+JSON.stringify(bando));
 // ===== 2e) criatura nova não herda a saúde de uma morta com o mesmo id
 await page.evaluate(()=>window.__fsWrite('combatesAtivos/mapaMesaSyncSaude',{revision:9,actors:{'synccriatura%3Acavalgante_prismatico':{combateLab:{hitMax:{'PV Global':20},hit:{'PV Global':12},armor:{},ferimentos:{}}},'synccriatura%3Azumbi_1':{combateLab:{hitMax:{'PV Global':8},hit:{'PV Global':-9},morto:true}}}}));
 await page.evaluate(()=>window.mesaAtitudesIaV200.reiniciarCriatura('synccriatura%3Azumbi_1'));await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>!!window.__fs.get('combatesAtivos/mapaMesaSyncSaude').actors['synccriatura%3Azumbi_1']),false,'a saúde/morte antiga some quando a criatura é colocada de novo');
 // ===== 2f) ficha rápida no balão: nome, vida, ataque e defesa
 await page.evaluate(()=>{const t=window.__APP__.ctl().token('synccriatura%3Acavalgante_prismatico');window.__cart=window.__cart;});
 await page.locator('#novaSyncBoard [data-token="synccriatura%3Acavalgante_prismatico"]').click({force:true});
 await page.waitForFunction(()=>{const c=document.getElementById('mdCartao');return c&&!c.hidden&&/Cavalgante/.test(c.textContent);},null,{timeout:10000});
 await page.evaluate(()=>document.querySelector('#mdCartao details.mc-ficha').open=true);
 await page.fill('#mdCartao [data-mf="nome"]','Pônei Prismático');await page.press('#mdCartao [data-mf="nome"]','Tab');await page.waitForTimeout(900);
 await page.fill('#mdCartao [data-mf="atq"]','15');await page.press('#mdCartao [data-mf="atq"]','Tab');await page.waitForTimeout(900);
 await page.fill('#mdCartao [data-mf="def"]','-10');await page.press('#mdCartao [data-mf="def"]','Tab');await page.waitForTimeout(900);
 await page.fill('#mdCartao [data-mf="pv"]','40');await page.press('#mdCartao [data-mf="pv"]','Tab');await page.waitForTimeout(900);
 const ficha=await page.evaluate(()=>{const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico'),h=window.__fs.get('combatesAtivos/mapaMesaSyncSaude').actors['synccriatura%3Acavalgante_prismatico'].combateLab;return {nome:t.nome,atq:t.bonusAtaqueV200,def:t.bonusDefesaV200,max:h.hitMax['PV Global'],at:h.hit['PV Global']};});
 console.log('ficha rápida:',JSON.stringify(ficha));
 assert.deepEqual([ficha.nome,ficha.atq,ficha.def,ficha.max],['Pônei Prismático',15,-10,40],'nome, ataque, defesa e vida máxima salvos');
 assert.equal(ficha.at,24,'a vida atual mantém a proporção (12/20 → 24/40)');
 await page.click('#mdCartao [data-mf="curar"]');await page.waitForTimeout(900);
 assert.equal(await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncSaude').actors['synccriatura%3Acavalgante_prismatico'].combateLab.hit['PV Global']),40,'curar tudo');
 // equipar arma e proteção: preenche os bônus e mostra o ícone 3D
 await page.selectOption('#mdCartao [data-me="arma"]','rpg_sword');await page.waitForTimeout(1000);
 await page.selectOption('#mdCartao [data-me="defesa"]','rpg_shield_heater');await page.waitForTimeout(1000);
 const eq=await page.evaluate(()=>{const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico');return {atq:t.bonusAtaqueV200,def:t.bonusDefesaV200,arma:document.querySelector('#mdCartao [data-me="arma"]')?.value,icone:!!document.querySelector('#mdCartao [data-mi] img, #mdCartao [data-mi="arma"]')};});
 console.log('equipar:',JSON.stringify(eq));
 assert.deepEqual([eq.atq,eq.def,eq.arma],[10,10,'rpg_sword'],'arma e proteção preenchem ataque e defesa e continuam escolhidas');
 await page.screenshot({path:path.join(root,'docs','imagens','v200-app-real-ficha.png')});
 await page.evaluate(()=>{window.__semSepararV201=true;});
 // ===== 2h) aparência 3D animada: escolhida no cartão; parado → andar (de lado/costas/frente) → atacar → golpe → morrer
 const TK='#novaSyncBoard [data-token="synccriatura%3Acavalgante_prismatico"]';
 await page.waitForFunction(()=>{const c=document.getElementById('mdCartao');return c&&!c.hidden&&c.querySelector('[data-mc="arte3d"]');},null,{timeout:10000});
 await page.selectOption('#mdCartao [data-mc="arte3d"]','h_adventurer');await page.waitForTimeout(1200);
 const lerA=()=>page.evaluate(sel=>{const n=document.querySelector(sel),a=n?.querySelector('.a3d');return a?{acao:a.dataset.acao,dir:a.dataset.dir,url:a.dataset.u||'',espelha:a.style.scale,img:getComputedStyle(n.querySelector('img')).visibility,quadro:a.dataset.quadro}:null;},TK);
 let a3=await lerA();console.log('3D parado:',JSON.stringify(a3));
 assert.ok(a3&&/miniaturas3d\/h_adventurer_parado_lado\.webp$/.test(a3.url)&&a3.img==='hidden','a miniatura passou a usar a aparência 3D (a arte antiga some)');
 // anda para a direita (espelha), depois para cima (costas), depois para baixo (frente)
 await page.evaluate(()=>{try{window.mesaVida?.parar?.();}catch(_){}}); // a vida/IA também move criaturas e embaralhava a direção medida (teste intermitente)
 const mover=async(x,y)=>{await page.evaluate(({x,y})=>{const p='combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico',t=window.__fs.get(p);window.__fsWrite(p,{...t,x,y,revision:(t.revision||0)+1});},{x,y});let r=null;for(let k=0;k<12;k++){await page.waitForTimeout(60);r=await lerA();if(r&&r.acao==='andar'&&k>=3)break;}return r;}; // o passo é um salto: espera a animação de andar aparecer (até ~700 ms) em vez de ler num instante fixo
 const base=await page.evaluate(()=>{const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico');return {x:t.x,y:t.y};});
 {const tr=[];for(let k=0;k<8;k++){await page.waitForTimeout(250);tr.push(await page.evaluate(()=>{const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico');return +t.x.toFixed(3)+','+ +t.y.toFixed(3)+' r'+t.revision;}));}console.log('posição parada (2 s):',tr.join(' | '));}
 let dd=await mover(base.x+4,base.y);console.log('andou →',JSON.stringify(dd));assert.ok(dd.acao==='andar'&&dd.dir==='lado'&&/-1/.test(dd.espelha),'para a direita: andar de lado, espelhado');
 await page.waitForTimeout(700);dd=await mover(base.x+4,base.y-3);console.log('andou ↑',JSON.stringify(dd));assert.ok(dd.acao==='andar'&&dd.dir==='costas'&&/andar_costas/.test(dd.url),'para cima: andar de costas');
 await page.waitForTimeout(700);dd=await mover(base.x+4,base.y+1);console.log('andou ↓',JSON.stringify(dd));assert.ok(dd.acao==='andar'&&dd.dir==='frente'&&/andar_frente/.test(dd.url),'para baixo: andar de frente');
 await page.waitForTimeout(1200);dd=await lerA();assert.equal(dd.acao,'parado','parou: volta ao parado');
 // ataca (efeito ef-golpe do jogo) e apanha (ef-impacto)
 await page.evaluate(sel=>{const n=document.querySelector(sel);n.style.setProperty('--gdx','-14px');n.style.setProperty('--gdy','0');n.classList.add('ef-golpe');setTimeout(()=>n.classList.remove('ef-golpe'),420);},TK);
 await page.waitForTimeout(250);dd=await lerA();console.log('atacou:',JSON.stringify(dd));assert.ok(dd.acao==='atacar'&&/atacar_lado/.test(dd.url),'ataque toca a folha de atacar');
 await page.waitForTimeout(1600);
 await page.evaluate(sel=>{const n=document.querySelector(sel);n.classList.add('ef-impacto');setTimeout(()=>n.classList.remove('ef-impacto'),340);},TK);
 await page.waitForTimeout(200);dd=await lerA();assert.equal(dd.acao,'golpe','golpe recebido toca a folha de golpe');
 await page.waitForTimeout(1500);
 await page.screenshot({path:path.join(root,'docs','imagens','v200-app-real-3d.png')});
 // morre
 await page.evaluate(()=>{const A=window.__fs.get('combatesAtivos/mapaMesaSyncSaude');const id='synccriatura%3Acavalgante_prismatico';window.__fsWrite('combatesAtivos/mapaMesaSyncSaude',{...A,revision:(A.revision||1)+1,actors:{...A.actors,[id]:{...A.actors[id],combateLab:{...A.actors[id].combateLab,morto:true}}}});});
 await page.waitForTimeout(1600);dd=await lerA();console.log('morreu:',JSON.stringify(dd));assert.ok(dd.acao==='morrer'&&Number(dd.quadro)>=5,'morto: toca morrer e fica no último quadro');
 await page.evaluate(()=>{const A=window.__fs.get('combatesAtivos/mapaMesaSyncSaude');const id='synccriatura%3Acavalgante_prismatico';window.__fsWrite('combatesAtivos/mapaMesaSyncSaude',{...A,revision:(A.revision||1)+1,actors:{...A.actors,[id]:{...A.actors[id],combateLab:{...A.actors[id].combateLab,morto:false}}}});});
 // volta à arte de antes
 await page.selectOption('#mdCartao [data-mc="arte3d"]','').catch(()=>{});await page.waitForTimeout(900);
 // ===== 2h2) miniatura vista de cima: gira para onde anda, sem espelhar nem trocar de direção
 await page.selectOption('#mdCartao [data-mc="arte3d"]','cima_besta_ululante').catch(()=>{});await page.waitForTimeout(1200);
 {const base2=await page.evaluate(()=>{const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico');return {x:t.x,y:t.y};});
  const lerR=()=>page.evaluate(sel=>{const a=document.querySelector(sel+' .a3d');return a?{u:a.dataset.u,rot:a.style.rotate,esp:a.style.scale,dir:a.dataset.dir}:null;},TK);
  let r0=await lerR();assert.ok(r0&&/cima_besta_ululante_parado_lado/.test(r0.u),'aparência de cima ativa: '+JSON.stringify(r0));
  await page.evaluate(({x,y})=>{const p='combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico',t=window.__fs.get(p);window.__fsWrite(p,{...t,x,y,revision:(t.revision||0)+1});},{x:base2.x+4,y:base2.y});await page.waitForTimeout(900);
  r0=await lerR();console.log('de cima → direita:',JSON.stringify(r0));assert.ok(/deg/.test(r0.rot)&&r0.esp!=='-1 1'&&r0.dir==='lado','de cima: vai para a direita girando (sem espelhar)');
  await page.evaluate(({x,y})=>{const p='combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico',t=window.__fs.get(p);window.__fsWrite(p,{...t,x,y,revision:(t.revision||0)+1});},{x:base2.x+4,y:base2.y-3});
  // o passo foi um salto instantâneo: a animação de andar dura ~350 ms depois dele, então a folha 'andar' é procurada durante a janela (antes: uma leitura fixa aos 600 ms, que caía em 'parado' conforme o tempo do quadro)
  let r1=null,viuAndar=false;for(let k=0;k<14;k++){await page.waitForTimeout(50);const x=await lerR();if(x&&/andar_lado/.test(x.u))viuAndar=true;r1=x;if(viuAndar&&x.rot!==r0.rot)break;}
  console.log('de cima → cima:',JSON.stringify(r1),'viu andar:',viuAndar);assert.ok(r1.rot!==r0.rot&&r1.dir==='lado'&&viuAndar,'de cima: subindo gira de novo e anda na folha de lado');
  await page.screenshot({path:path.join(root,'docs','imagens','v203-cima.png')});
  // editor de visual: sliders mudam a miniatura na hora; salvar grava no personagem (arte3dAjusteV203)
  await page.waitForSelector('#mdCartao .mc-visual',{timeout:8000});
  const tam0=await page.evaluate(sel=>parseFloat(document.querySelector(sel+' .a3d').dataset.fis)||0,TK); // v205: miniatura de cima tem tamanho físico (px), não transform
  await page.evaluate(()=>{const d=document.querySelector('#mdCartao .mc-visual');d.open=true;const set=(k,v)=>{const r=d.querySelector('[data-av="'+k+'"]');r.value=v;r.dispatchEvent(new Event('input',{bubbles:true}));};set('h',80);set('z',150);});
  await page.waitForTimeout(400);
  const fl=await page.evaluate(sel=>{const a=document.querySelector(sel+' .a3d');return {f:a.style.filter,t:a.style.transform,fis:parseFloat(a.dataset.fis)||0};},TK);console.log('ajuste ao vivo:',JSON.stringify(fl));
  assert.ok(fl.f.includes("hue-rotate(80deg)")&&(fl.t.includes("scale(1.5)")||(tam0>0&&Math.abs(fl.fis/tam0-1.5)<.02)),"sliders mudam cor e tamanho na hora");
  await page.click('#mdCartao [data-av-salvar="1"]');await page.waitForTimeout(900);
  const gravado=await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico').arte3dAjusteV203);console.log('gravado:',gravado);
  assert.ok(/h=80;.*z=150/.test(gravado||''),'salvar grava o ajuste no personagem');
  await page.click('#mdCartao [data-av-restaurar="1"]');await page.waitForTimeout(900);
  const volta=await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acavalgante_prismatico').arte3dAjusteV203);assert.ok(volta==='','restaurar limpa o ajuste');await page.evaluate(()=>{const d=document.querySelector('#mdCartao .mc-visual');if(d)d.open=false;});
 }
 await page.selectOption('#mdCartao [data-mc="arte3d"]','').catch(()=>{});await page.waitForTimeout(700);
 // ===== 2h3) pessoa (jogador/NPC) vista de cima em camadas pintáveis + editor de personagem
 await page.evaluate(()=>window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/pessoa_teste',{nome:'Aventureira',imagem:'',donoUid:'',x:10,y:6,revision:0,facing:0,camada:3,mapaId:'mapa_real',diametroM:1}));
 await page.waitForFunction(()=>document.querySelector('#novaSyncBoard [data-token="pessoa_teste"] .a3d[data-pessoa="1"]'),null,{timeout:10000});
 {const P='#novaSyncBoard [data-token="pessoa_teste"] .a3d';
  const lerP=()=>page.evaluate(sel=>{const a=document.querySelector(sel);const v=[...a.querySelectorAll('.a3dc')].filter(g=>g.style.display!=='none').map(g=>g.dataset.c+':'+(g.querySelector('.cor').style.backgroundColor||''));return {camadas:v,quadro:a.dataset.quadro,acao:a.dataset.acao};},P);
  let p0=await lerP();console.log('pessoa de cima:',JSON.stringify(p0));
  assert.ok(p0.camadas.some(c=>c.startsWith('roupa:rgb'))&&p0.camadas.some(c=>c.startsWith('pele:rgb'))&&!p0.camadas.some(c=>c.startsWith('capa')),'pessoa em camadas pintadas, sem capa por padrão');
  await page.evaluate(()=>window.mesaPersonagemEditor.abrir(window.novaSyncController_?.token?.('pessoa_teste')||{id:'pessoa_teste'}));
  await page.waitForSelector('#pedPainel:not([hidden]) input[data-k="r"]',{timeout:5000});
  await page.evaluate(()=>{const p=document.getElementById('pedPainel');const c=p.querySelector('input[data-k="r"]');c.value='#ff0000';c.dispatchEvent(new Event('input',{bubbles:true}));const k=p.querySelector('[data-capa]');k.checked=true;k.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForTimeout(500);p0=await lerP();console.log('pessoa editada (prévia):',JSON.stringify(p0));
  assert.ok(p0.camadas.includes('roupa:rgb(255, 0, 0)')&&p0.camadas.some(c=>c.startsWith('capa:')),'prévia ao vivo: roupa vermelha e capa');
  await page.evaluate(()=>document.querySelector('#pedPainel [data-salvar]').click());await page.waitForTimeout(900);
  const vg=await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/pessoa_teste').visualV203);console.log('visual gravado:',vg);
  assert.ok(/r=#ff0000/.test(vg||'')&&/capa=1/.test(vg||''),'salvar grava o visual no personagem');
  await page.evaluate(()=>document.querySelector('#pedPainel [data-x]').click());
  await page.screenshot({path:path.join(root,'docs','imagens','v203-pessoa.png')});await page.evaluate(()=>document.querySelector('#mdCartao [data-mc="x"]')?.click());}
 // ===== 2h4) deitar na cama / sentar na cadeira: a pessoa aparece na pose
 {const orig=await page.evaluate(()=>{window.__repOrig=window.mesaRepouso;window.mesaRepouso={emRepouso:id=>id==='pessoa_teste'?{tipo:window.__tipoRep||'sono',objetoId:'cama1'}:null};return true;});
  const P='#novaSyncBoard [data-token="pessoa_teste"] .a3d';
  await page.waitForFunction(sel=>document.querySelector(sel)?.dataset.acao==='deitado',P,{timeout:6000});
  let st=await page.evaluate(sel=>({a:document.querySelector(sel).dataset.acao,rot:document.querySelector(sel).style.rotate}),P);console.log('deitado:',JSON.stringify(st));
  assert.ok(st.a==='deitado'&&/90deg/.test(st.rot),'deitado: pose e giro de 90°');
  await page.evaluate(()=>{window.__tipoRep='sentado';});
  await page.waitForFunction(sel=>document.querySelector(sel)?.dataset.acao==='sentado',P,{timeout:6000});
  st=await page.evaluate(sel=>({a:document.querySelector(sel).dataset.acao,rot:document.querySelector(sel).style.rotate}),P);console.log('sentado:',JSON.stringify(st));
  assert.ok(st.a==='sentado'&&/-90deg/.test(st.rot),'sentado: pose virada para a frente da cadeira');
  await page.evaluate(()=>{window.mesaRepouso=window.__repOrig;});
 }
 // ===== 2g) sons: Besta Ululante → grito ensurdecedor no ataque sonoro (Eco da Matilha); zumbi → rosnado
 const som=async(srcId,item)=>{await page.evaluate(()=>{window.__osc.length=0;});
  await page.evaluate(({srcId,item})=>{const A=window.__fs.get('combatesAtivos/mapaMesaSyncSaude')||{actors:{},revision:1};window.__fsWrite('combatesAtivos/mapaMesaSyncSaude',{...A,revision:(A.revision||1)+1,event:{id:'ev'+Math.random(),ts:Date.now(),message:'ataque',item:{nome:item},hit:true,damage:4,source:{id:srcId,x:5,y:10},target:{id:'synccriatura%3Acavalgante_prismatico',x:8,y:6}}});},{srcId,item});
  await page.waitForTimeout(900);return page.evaluate(()=>[...window.__osc]);};
 await page.evaluate(()=>window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Azumbi_1',{nome:'Monstro · Zumbi',imagem:'',donoUid:'',x:20,y:10,revision:0,facing:0,camada:3,mapaId:'mapa_real',diametroM:1}));
 await page.evaluate(()=>window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Abesta_ululante',{nome:'Monstro · Besta Ululante',imagem:'',donoUid:'',x:5,y:10,revision:0,facing:0,camada:3,mapaId:'mapa_real',diametroM:2.4}));
 await page.waitForTimeout(1500);
 const grito=await som('synccriatura%3Abesta_ululante','Eco da Matilha');
 const rosnado=await som('synccriatura%3Azumbi_1','Mordida');
 console.log('som do Eco da Matilha (frequências iniciais):',grito.slice(0,8).join(','),'| som da mordida do zumbi:',rosnado.slice(0,8).join(','));
 assert.ok(grito.some(f=>f>=1800)&&grito.some(f=>f<=70),'grito ensurdecedor: agudo saturado + estrondo grave');
 assert.ok(rosnado.some(f=>f>=70&&f<=120)&&!rosnado.some(f=>f>=1800),'zumbi: rosnado grave (nada de grito agudo)');
 // ===== 3) criatura NOVA (catálogo/qualquer caminho) pergunta o comportamento
 await page.evaluate(()=>window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/synccriatura%3Acadaver_de_chefe',{nome:'Monstro · Cadáver Chefe',imagem:'',donoUid:'',x:5,y:10,revision:0,facing:0,camada:3,mapaId:'mapa_real',diametroM:2.4}));
 for(let k=0;k<10;k++){const t=await page.evaluate(()=>{const c=document.getElementById('mdCartao');return c&&!c.hidden?c.textContent:'';});if(/Cadáver Chefe/.test(t)&&/Criatura nova/.test(t))break;if(/Criatura nova/.test(t)){await page.selectOption('#mdCartao [data-mc="atitude"]','defensiva');await salvar('especie');}await page.waitForTimeout(1500);} /* as outras criaturas novas (zumbi, besta) perguntam antes: a fila é uma por vez */
 await page.waitForFunction(()=>{const c=document.getElementById('mdCartao');return c&&!c.hidden&&/Cadáver Chefe/.test(c.textContent)&&/Criatura nova/.test(c.textContent);},null,{timeout:12000});
 console.log('criatura nova no mapa → o cartão perguntou o comportamento: OK');
 await page.screenshot({path:path.join(root,'docs','imagens','v200-app-real-2b.png')});
 for(let k=0;k<8;k++){ // o cartão mostra uma criatura nova por vez: salva as outras e depois o Cadáver Chefe
  const nome=await page.evaluate(()=>document.querySelector('#mdCartao .mc-topo b')?.textContent||'');
  const chefe=/Cadáver Chefe/.test(nome);
  await page.selectOption('#mdCartao [data-mc="atitude"]',chefe?'sanguinaria':'defensiva');await salvar('especie');
  if(chefe)break;
 }
 assert.equal((await page.evaluate(()=>window.mesaAtitudesIaV200.padroes())).cadaver_de_chefe?.atitude,'sanguinaria','o que o mestre escolheu vira o padrão do Cadáver Chefe');
 // ===== 3b) peças de mapa 3D: o mestre as cadastra sozinho no Banco de Objetos (mobília, masmorra, sci-fi, plantas…)
 await page.evaluate(()=>window.__APP__.setObjetos([{id:'x1',nome:'a'},{id:'x2',nome:'b'},{id:'x3',nome:'c'}]));
 await page.waitForFunction(()=>[...window.__fs.keys()].filter(k=>k.startsWith('configuracoes/objetoMapa_3d_')).length>=300,null,{timeout:90000});
 const pc=await page.evaluate(()=>{const ks=[...window.__fs.keys()].filter(k=>k.startsWith('configuracoes/objetoMapa_3d_'));const d=window.__fs.get(ks.find(k=>/md_barrel/.test(k)));return {n:ks.length,barril:d&&{nome:d.nome,img:d.imagem.split('/').slice(-2).join('/'),w:d.larguraM,h:d.alturaM,bloq:d.bloqueiaMovimento},indice:(window.__fs.get('configuracoes/objetosMapa')?.ids||[]).filter(i=>/^3d_/.test(i)).length};});
 console.log('peças 3D cadastradas:',JSON.stringify(pc));
 assert.ok(pc.n>=300&&pc.indice>=300&&pc.barril&&pc.barril.img.endsWith("pecas3d/md_barrel.webp")&&pc.barril.bloq===true,'as peças 3D entram no Banco de Objetos de Mapa');
 // ===== 4) os geradores abrem
 await page.click('#mdAtalhos button:has-text("Gerar NPC")');await page.waitForSelector('#mdGaveta:not([hidden]) [data-ggerar]',{timeout:8000});
 const aba=await page.evaluate(()=>[...document.querySelectorAll('#mdGaveta [data-aba]')].map(b=>b.textContent.trim()+(b.getAttribute('aria-pressed')==='true'?'*':'')).join(' | '));
 console.log('Diretor:',aba);
 assert.ok(/Gerador\*/.test(aba)&&/Criaturas/.test(aba),'o Diretor abre na aba Gerador e tem a aba 👾 Criaturas');
 await page.click('#mdGaveta [data-fechar]');
 await page.evaluate(()=>{document.querySelector('#mdCartao [data-mc="x"]')?.click();});await page.waitForTimeout(400);
 await page.click('#mdAtalhos button:has-text("Criaturas e comportamento")');await page.waitForSelector('#mdGaveta [data-cr-add]',{timeout:8000});
 await page.screenshot({path:path.join(root,'docs','imagens','v200-app-real-3.png')});
 await page.click('#mdGaveta [data-fechar]');
 await page.click('#mdAtalhos button:has-text("Gerar mapa")');
 await page.waitForSelector('#erGerador',{timeout:8000});
 const gerador=await page.evaluate(()=>document.getElementById('erGerador').innerText.slice(0,160));
 console.log('Gerador de mapas:',gerador.replace(/\n/g,' | '));
 await page.screenshot({path:path.join(root,'docs','imagens','v200-app-real-4.png')});
 console.log('erros:',[...new Set(erros)].slice(0,6).join(' // ').slice(0,600)||'nenhum');
 await browser.close();
 console.log('PASS app real (mestre): atalhos visíveis, cartão de comportamento, padrão por espécie, tamanho pelo bestiário, geradores de NPC e de mapa abrem.');
})().catch(e=>{console.error(e);process.exit(1);});
