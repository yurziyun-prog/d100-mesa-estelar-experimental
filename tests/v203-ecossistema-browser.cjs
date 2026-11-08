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
 // ===== v203: Mapa de teste (ecossistema)
 const todas=lin.slice(1).map(x=>x.split(';')).map(c=>Object.fromEntries(cab.map((h,i)=>[h,c[i]])));
 await page.evaluate(({todas})=>{window.__APP__.setBancos(todas,[{id:'engenheira',nome:'Engenheira Vela',carreira:'Engenheira'},{id:'medica',nome:'Doutora Íris',carreira:'Médica'},{id:'cacador',nome:'Caçador Brás',carreira:'Caçador'}]);window.confirm=()=>true;},{todas});
 await page.evaluate(()=>{window.__logs=[];const w=console.info;console.info=(...a)=>{window.__logs.push(a.join(' '));w.apply(console,a);};const w2=console.warn;console.warn=(...a)=>{window.__logs.push('WARN '+a.map(x=>x&&x.message||x).join(' '));w2.apply(console,a);};});
 await page.evaluate(()=>[...document.querySelectorAll('#mdAtalhos button')].find(b=>/Mapa de teste/.test(b.textContent)).click());
 let n=0;for(let k=0;k<160;k++){await page.waitForTimeout(500);n=await page.evaluate(()=>{let c=0;for(const k of window.__fs.keys())if(/posicoes[/](synccriatura|syncnpc)/.test(k)&&window.__fs.get(k).nome&&!/Cavalgante Prism|Carniçal Dominante/.test(window.__fs.get(k).nome)&&window.__fs.get(k).mapaId!=='mapa_real')c++;return c;});if(n>=40)break;}
 const logs=await page.evaluate(()=>window.__logs);console.log('logs:',logs.join(' | ').slice(0,900));
 const res=await page.evaluate(()=>{const s=window.__fs;const out={mapas:[...s.keys()].filter(k=>/^mapas[/]/.test(k)),pos:0,npcs:[],atit:{}};for(const [k,v] of s){if(!/posicoes[/]/.test(k)||v.mapaId!=='ecossistema_teste')continue;out.pos++;if(/syncnpc/.test(k))out.npcs.push(v.nome+' dono='+v.donoUid);}
  const pd=window.mesaAtitudesIaV200?.padroes?.()||{};out.atit=Object.fromEntries(Object.entries(pd).map(([k,v])=>[k,v.atitude]));return out;});
 console.log('mapas:',res.mapas.join(','),'| tokens do ecossistema:',res.pos,'| NPCs:',JSON.stringify(res.npcs));console.log('padrões:',JSON.stringify(res.atit));
 assert.ok(res.pos>=30,'criaturas e NPCs colocados no mapa novo: '+res.pos);
 const cena=await page.evaluate(()=>{for(const [k,v] of window.__fs)if(/Cena|cena/.test(k)&&v&&Array.isArray(v.objects)&&v.objects.length>50)return {k,n:v.objects.length,tipos:[...new Set(v.objects.map(o=>o.erTipo||o.tipo))].join(','),arm:v.objects.filter(o=>o.armadilhaV184).length};return null;});
 console.log('cena:',JSON.stringify(cena));
 await page.waitForTimeout(2500);await page.evaluate(()=>{document.querySelector('#mdCartao [data-mc="x"]')?.click();});await page.screenshot({path:path.join(root,'docs','imagens','v203-ecossistema.png')});
 const sprites=await page.evaluate(()=>{const r={};let total=0;for(const n of document.querySelectorAll('#novaSyncBoard [data-token]')){const a=n.querySelector('.a3d');total++;const u=a?.dataset.u||(a?.querySelector('.a3dc')?.dataset.u)||'';const k=/cima_|pessoa_/.test(u)?'cima':(a?'outra':'sem');r[k]=(r[k]||0)+1;if(k!=='cima')(r.lista=r.lista||[]).push(k+':'+n.dataset.token);}return {r,total};});
 console.log('miniaturas na tela:',JSON.stringify(sprites));
 // ---- desempenho (PERF=1): fps, tempo de CPU e funções mais pesadas
 if(process.env.PERF){
  const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Performance.enable');
  await page.waitForTimeout(6000);
  console.log('ANIMACOES:',JSON.stringify(await page.evaluate(()=>{const r={};for(const an of document.getAnimations()){const t=an.effect?.target;const k=(an.animationName||an.transitionProperty||'?')+' @'+(t?.closest?.('#novaSyncBoard')?'board':'fora');r[k]=(r[k]||0)+1;}const ob=[...document.querySelectorAll('#novaSyncBoard [data-scene-object]')];const est={};for(const o of ob){const cs=getComputedStyle(o);const k=[cs.filter!=='none'?'filter':'',cs.mixBlendMode!=='normal'?'blend':'',cs.opacity!=='1'?'opac':'',cs.maskImage!=='none'?'mask':'',cs.willChange!=='auto'?'wc':''].filter(Boolean).join('+')||'simples';est[k]=(est[k]||0)+1;}return {r,est,n:ob.length};})));
  if(process.env.PERF_CSS)await page.evaluate(c=>{const st=document.createElement('style');st.textContent=c;document.head.append(st);},process.env.PERF_CSS);
  await page.evaluate(()=>{window.__fr=0;const t0=performance.now();const l=()=>{window.__fr++;requestAnimationFrame(l);};requestAnimationFrame(l);window.__t0=t0;});
  const m0=await cdp.send('Performance.getMetrics');await cdp.send('Profiler.start');
  await page.waitForTimeout(8000);
  const {profile}=await cdp.send('Profiler.stop');const m1=await cdp.send('Performance.getMetrics');
  const fr=await page.evaluate(()=>({fps:window.__fr/((performance.now()-window.__t0)/1000),nos:document.getElementsByTagName('*').length}));
  const g=(m,n)=>m.metrics.find(x=>x.name===n)?.value||0;
  console.log('PERF fps≈'+fr.fps.toFixed(1)+' | elementos DOM '+fr.nos+' | CPU script '+(g(m1,'ScriptDuration')-g(m0,'ScriptDuration')).toFixed(2)+'s | layout '+(g(m1,'LayoutDuration')-g(m0,'LayoutDuration')).toFixed(2)+'s | estilo '+(g(m1,'RecalcStyleDuration')-g(m0,'RecalcStyleDuration')).toFixed(2)+'s | tarefas '+(g(m1,'TaskDuration')-g(m0,'TaskDuration')).toFixed(2)+'s em 8 s');
  console.log('DOM:',JSON.stringify(await page.evaluate(()=>{const c={};for(const e of document.getElementsByTagName('*')){const k=e.tagName.toLowerCase();c[k]=(c[k]||0)+1;}const top=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8);const b=document.getElementById('novaSyncBoard');const filhos={};for(const ch of b.querySelectorAll('*')){const p=ch.parentElement;const k=(p.id||p.className&&String(p.className).slice(0,30)||p.tagName);filhos[k]=(filhos[k]||0)+1;}return {top,dentroDoBoard:b.getElementsByTagName('*').length,pais:Object.entries(filhos).sort((a,b)=>b[1]-a[1]).slice(0,8)};})));
  const dt=profile.timeDeltas,por=new Map();const idx=new Map(profile.nodes.map(n=>[n.id,n]));
  profile.samples.forEach((id,i)=>{const n=idx.get(id);const k=(n.callFrame.functionName||'(anônima)')+' '+String(n.callFrame.url).split('/').pop()+':'+n.callFrame.lineNumber;por.set(k,(por.get(k)||0)+(dt[i]||0));});
  const top=[...por.entries()].sort((x,y)=>y[1]-x[1]).slice(0,22).map(([k,v])=>(v/1000).toFixed(0)+'ms '+k);
  {const pai=new Map();for(const n of profile.nodes)for(const c of (n.children||[]))pai.set(c,n);const quem=new Map();
   profile.samples.forEach((id,i)=>{const n=idx.get(id);if(!/^get (clientWidth|clientHeight|offsetParent|offsetWidth|offsetHeight)|getBoundingClientRect/.test(n.callFrame.functionName))return;let p=pai.get(id),k='';for(let h=0;h<3&&p;h++,p=pai.get(p.id))k+=(p.callFrame.functionName||'(anon)')+'@'+String(p.callFrame.url).split('/').pop()+':'+p.callFrame.lineNumber+' < ';quem.set(k,(quem.get(k)||0)+(dt[i]||0));});
   console.log('QUEM FORÇA LAYOUT:\n'+[...quem.entries()].sort((x,y)=>y[1]-x[1]).slice(0,10).map(([k,v])=>(v/1000).toFixed(0)+'ms '+k).join('\n'));}
  console.log('MAIS PESADAS:\n'+top.join('\n'));
 }
 const quebradas=await page.evaluate(()=>{const r={};for(const i of document.querySelectorAll('#novaSyncBoard img')){if(i.complete&&i.naturalWidth===0){const k=(i.getAttribute('src')||'').slice(0,70);r[k]=(r[k]||0)+1;}}return r;});console.log('IMAGENS QUEBRADAS:',JSON.stringify(quebradas).slice(0,900));
 const tam=await page.evaluate(()=>{const E=window.mesaEditorRapidoV197;const o=E?E.objetos():[];const r={};let tot=0;for(const x of o){const n=JSON.stringify(x).length;tot+=n;const k=(x.erTipo||x.tipo||'?')+(x.erPoca?':poca':'')+(x.nome&&/Grama|Mato|Tufo/.test(x.nome)?':'+x.nome:'');r[k]=(r[k]||0)+n;}return {tot,top:Object.entries(r).sort((a,b)=>b[1]-a[1]).slice(0,10)};});console.log('TAMANHO DA CENA:',JSON.stringify(tam));
 // ---- árvores: cada copa tem tronco sólido; quem está embaixo vê a copa transparente
 {const arv=await page.evaluate(()=>{const cena=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');const ob=cena?.objects||[];const copas=ob.filter(o=>o.erTipo==='copa'),tr=ob.filter(o=>o.erTipo==='tronco');
   return {copas:copas.length,troncos:tr.length,sol:tr.filter(t=>t.bloqueiaMovimento&&t.larguraM<2).length,fora:tr.filter(t=>!(t.bloqueiaMovimento&&t.larguraM<2)).map(t=>t.bloqueiaMovimento+'/'+t.larguraM+'/'+t.destruido).join(','),ligados:tr.filter(t=>copas.some(c=>c.grupoArvoreV203===t.grupoArvoreV203)).length,pv:tr.every(t=>t.destrutivel&&t.inflamavel&&t.pvMax>0),exCopa:copas.find(c=>/tropical|palm/i.test(c.erTex||''))||copas[0]};});
  console.log('árvores:',JSON.stringify({...arv,exCopa:arv.exCopa?.id}));
  assert.ok(arv.copas>=10&&arv.troncos>=arv.copas*.6&&arv.sol>=arv.troncos-2&&arv.ligados===arv.troncos&&arv.pv,'cada copa (menos arbustos) tem tronco sólido, vivo e ligado a ela');
  const idc=arv.exCopa.id;
  await page.evaluate(({c,W,H})=>{const k=Object.keys(Object.fromEntries(window.__fs)).find(x=>/posicoes[/]syncnpc%3Aengenheira/.test(x));const t=window.__fs.get(k);window.__fsWrite(k,{...t,x:c.x,y:c.y,revision:(t.revision||0)+1});},{c:arv.exCopa});
  await page.evaluate(()=>{const raw=localStorage.getItem('mesaEcoJogador');window.dispatchEvent(new CustomEvent('personagem-selecionado',{detail:raw}));});
  await page.waitForTimeout(1500);
  const op=await page.evaluate(id=>{const n=document.querySelector('#novaSyncBoard [data-scene-object="'+CSS.escape(id)+'"]');return n?Number(n.style.opacity):-1;},idc);
  console.log('opacidade da copa com o personagem embaixo:',op);
  assert.ok(op>=0&&op<.6,'a copa fica transparente para quem está embaixo');
 }
 // ---- simulação: o que os bichos e os NPCs fazem sozinhos em ${SIM}s
 const SIM=Number(process.env.SIM||60);
 const amostra=()=>page.evaluate(()=>{const o={};for(const [k,v] of window.__fs){if(!/posicoes[/](synccriatura|syncnpc)/.test(k)||v.mapaId!=='ecossistema_teste')continue;let x=v.x,y=v.y;const vd=window.__fs.get('combatesAtivos/mesaVida'),l=vd?.legs?.[k.split('/').pop()];if(l){const fr=Math.max(0,Math.min(1,(Date.now()+Number(vd.desvio||0)-Number(l.t0))/Math.max(1,Number(l.d))));x=l.a[0]+(l.b[0]-l.a[0])*fr;y=l.a[1]+(l.b[1]-l.a[1])*fr;}o[k]={x:x*80/28,y:y*50/14,nome:v.nome};}return o;});
 const mapaAtual=await page.evaluate(()=>window.novaSyncController_?.mapaAtual?.()||'');console.log('mapa aberto:',mapaAtual,'| tempo real ativo:',await page.evaluate(()=>window.mesaTempoRealV111?.ativo?.()));
 const p0=await amostra();const ev=[];const t0=Date.now();
 while(Date.now()-t0<SIM*1000){await page.waitForTimeout(1000);const m=await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncSaude')?.event?.message||'');if(m&&ev[ev.length-1]!==m)ev.push(m);}
 const p1=await amostra();let mexeu=0,total=0;const parados=[];for(const k of Object.keys(p0)){total++;const d=Math.hypot(p1[k].x-p0[k].x,p1[k].y-p0[k].y);if(d>1.5)mexeu++;else parados.push(p0[k].nome);}
 const saude=await page.evaluate(()=>{const a=window.__fs.get('combatesAtivos/mapaMesaSyncSaude')?.actors||{};const mortos=Object.entries(a).filter(([k,v])=>v.morto).map(([k])=>decodeURIComponent(k));return {mortos};});
 console.log('movimento em '+SIM+'s:',mexeu+'/'+total,'| parados:',parados.slice(0,40).join('; '));console.log('mortos:',saude.mortos.join(', '));console.log('eventos ('+ev.length+'):',ev.slice(0,25).join(' || ').slice(0,1500));
 await browser.close();
 console.log('PASS mapa de teste (ecossistema) criado');
})().catch(e=>{console.error(e);process.exit(1);});
