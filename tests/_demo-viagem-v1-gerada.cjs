// Demo gravada (vídeo): a jornada do herói pelos mapas da sessão de amanhã — Mesa Estelar real,
// harness local (Firestore simulado, mestre simulado). Direção: sai do palácio de Ilü-Mus-Ki,
// atravessa a cidade e o espaço-porto, viaja pelo Mar de Pedra, chega às ruínas, desce à masmorra,
// escapa das criaturas e volta à superfície. As portas são automáticas (v206): o próprio jogo troca
// o mapa quando o personagem chega na saída.
// Uso: node tests/_demo-viagem.cjs  → grava em %DEMO_DIR% (padrão: <workspace>/demo-viagem)
const path=require('path'),fs=require('fs');
const DESTINO=process.env.DEMO_DIR||'C:/Users/yurzi/Saved Games/projeto mapas/demo-viagem';
process.env.VIDEO_DIR=path.join(DESTINO,'_gravacao');
fs.rmSync(process.env.VIDEO_DIR,{recursive:true,force:true});
fs.mkdirSync(process.env.VIDEO_DIR,{recursive:true});
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));

const HEROI='demo_kael', DONO='mestre1';
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
const HEROI_VISUAL='p=#e6b98f;r=#1f2a3a;q=#3a3d44;d=#a8844a;c=#3a1f2a;e=#a8844a;h=curto;k=#3b2a1e;m=borda;a=#8a6a3a;o=normal;x=MS;z=EP;capa=1';

// ------------------------------------------------------------ mapas da jornada (sementes fixas)
const MAPAS=[
 {id:'demo_palacio',nome:'🏛️ Palácio de Ilü-Mus-Ki',tipo:'interior',estilo:'feudal',w:36,h:18,sem:1101},
 {id:'demo_cidade',nome:'🏙️ Praça da Cidade Alta',tipo:'cidade',estilo:'retro',w:42,h:21,sem:2202},
 {id:'demo_porto',nome:'🚀 Espaço-porto de Kharon',tipo:'cidade',estilo:'futurista',w:42,h:21,sem:3303},
 {id:'demo_viagem',nome:'🏜️ Mar de Pedra — a viagem',tipo:'ermos',estilo:'',w:42,h:21,sem:4404},
 {id:'demo_ruinas',nome:'🏚️ Cidade em Ruínas (Sem Nome)',tipo:'ermos',estilo:'',w:42,h:21,sem:5505},
 {id:'demo_masmorra',nome:'🕳️ Masmorra das Ruínas',tipo:'esgoto',estilo:'feudal',w:36,h:18,sem:6606},
];
// saídas (pontos de ligação em UNIDADES DE GRADE 28×14 — o jogo guarda posições assim).
const DIMS=Object.fromEntries(MAPAS.map(m=>[m.id,{W:m.w,H:m.h}]));
const SAIDAS=[
 ['palacio_cidade',{mapa:'demo_palacio',x:26,y:7},{mapa:'demo_cidade',x:1.5,y:7}],
 ['cidade_porto',{mapa:'demo_cidade',x:26.5,y:7},{mapa:'demo_porto',x:1.5,y:7}],
 ['porto_viagem',{mapa:'demo_porto',x:26.5,y:7},{mapa:'demo_viagem',x:1.5,y:7}],
 ['viagem_ruinas',{mapa:'demo_viagem',x:26.5,y:7},{mapa:'demo_ruinas',x:1.5,y:7}],
 ['poco',{mapa:'demo_ruinas',x:14,y:7},{mapa:'demo_masmorra',x:14,y:12.5}],
];
const LIGS=SAIDAS.map(([k,a,b])=>({id:'lig_'+k,a,b,tipo:'porta',auto:true,portaAutoV206:true}));
// portas por mapa (para estacionar o herói na soleira e deixar a v206 completar)
const PORTAS={};
for(const l of LIGS)for(const p of [l.a,l.b])(PORTAS[p.mapa]=PORTAS[p.mapa]||[]).push({x:p.x,y:p.y});

const NPCS=[
 {id:'demo_guarda_1',mapa:'demo_palacio',x:8,y:4,nome:'Guarda do palácio',visual:'p=#b27a4c;r=#6b7078;q=#3a3d44;d=#aeb3ba;c=#2e3a32;e=#aeb3ba;h=curto;k=#1f1a17;m=lisa;a=#8a8f96;o=normal;x=S;z=GK;capa=0'},
 {id:'demo_guarda_2',mapa:'demo_palacio',x:8,y:11,nome:'Guarda do palácio',visual:'p=#8a5a38;r=#6b7078;q=#3a3d44;d=#aeb3ba;c=#2e3a32;e=#aeb3ba;h=curto;k=#1f1a17;m=lisa;a=#8a8f96;o=normal;x=S;z=GK;capa=0'},
 {id:'demo_mercador_1',mapa:'demo_cidade',x:9,y:5.5,nome:'Comerciante da praça',visual:'p=#d29a6a;r=#4a3a2c;q=#4f4a44;d=#8a6a3a;c=#4a3a2c;e=#8a6a3a;h=longo;k=#1f1a17;m=lisa;a=;o=normal;x=;z=;capa=0'},
 {id:'demo_mercador_2',mapa:'demo_cidade',x:11,y:8.5,nome:'Comerciante da praça',visual:'p=#e6b98f;r=#3b1f27;q=#1f1418;d=#a8844a;c=#3b1f27;e=#a8844a;h=coque;k=#3b2a1e;m=borda;a=#a8844a;o=normal;x=C;z=;capa=0'},
 {id:'demo_mecanico',mapa:'demo_porto',x:13,y:4.5,nome:'Mecânico do porto',visual:'p=#d29a6a;r=#2e3b34;q=#2b2f36;d=#b9bcc2;c=#2e3b34;e=#b9bcc2;h=curto;k=#2b2f3a;m=lisa;a=#3b3f46;o=normal;x=K;z=G;capa=0'},
];
const CRIAT_RUINAS=['rastejante_de_cinzas~1','rastejante_de_cinzas~2'];
const CRIAT_MASMORRA=['rastejante_de_cinzas~3','cacador_de_nevoa~1','besta_ululante~1'];

(async()=>{
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;const avisos=[];
 page.on('pageerror',e=>avisos.push(e.message));
 page.on('console',m=>{if(/Ligações|Sessão|demo-hide/.test(m.text()))console.log('[página]',m.text().slice(0,240));});
 console.log('[demo] app aberto, montando sessão…');
 await carregarBancoDePecas(page);

 // ---------- montagem (silenciosa): mapas gerados, ligações, tokens ----------
 await page.evaluate(async({mapas,ligs,npcs,criatRuinas,criatMasmorra,heroiVisual})=>{
  const A=window.__APP__;A.setMestre();
  const G=await import('/js/mesa-gerador-mapas.js?v=141');
  const U=await import('/js/mesa-mapas-ui.js?v=141');
  const objetos=window.mesaMapasV110_.objetos();
  for(const m of mapas){
   const st=G.gerarMapa({tipo:m.tipo,largura:m.w,altura:m.h,semente:m.sem,objetos,nome:m.nome,estilo:m.estilo});
   await window.mesaMapasV110_.salvar({id:m.id,nome:m.nome,state:st,cenaDe:mid=>U.cenaDoEstado(st,mid)});
  }
  window.__fsWrite('combatesAtivos/mesaLigacoes',{ligacoes:ligs,atualizadoEm:Date.now(),ladosV138:true});
  // guarda: a estrutura v190 (que roda sozinha a cada 3,5 s) insiste em ligar mapas soltos;
  // na demo as ligações são exatamente estas cinco — reescreve se aparecer extra.
  window.__demoLigs=JSON.parse(JSON.stringify(ligs));
  setInterval(()=>{try{const p='combatesAtivos/mesaLigacoes';const d=window.__fs.get(p);const atuais=(d&&d.ligacoes)||[];
   if(atuais.length!==window.__demoLigs.length||!atuais.every(l=>window.__demoLigs.some(x=>x.id===l.id)))
    window.__fsWrite(p,{ligacoes:window.__demoLigs,atualizadoEm:Date.now(),ladosV138:true});}catch(_){}},2000);
  const POS_='combatesAtivos/mapaMesaSyncDireta/posicoes';
  const poe=(id,v)=>window.__fsWrite(POS_+'/'+encodeURIComponent(id),v);
  poe('demo_kael',{nome:'Kael',imagem:'',donoUid:'mestre1',x:4,y:7,revision:0,facing:Math.PI/2,camada:3,mapaId:'demo_palacio',diametroM:2.2,visualV203:heroiVisual});
  for(const n of npcs)poe(n.id,{nome:n.nome,imagem:'',donoUid:'',x:n.x,y:n.y,revision:0,facing:0,camada:3,mapaId:n.mapaId??n.mapa,diametroM:1.6,visualV203:n.visual});
  for(const slug of criatRuinas)poe('synccriatura:'+slug,{nome:'Rastejante de cinzas',imagem:'',donoUid:'',x:slug.endsWith('~1')?20:22,y:slug.endsWith('~1')?3:9,revision:0,facing:0,camada:3,mapaId:'demo_ruinas',diametroM:2,diametroPersonalizadoV205:true});
  for(const slug of criatMasmorra){const n=String(slug.match(/~(\d)/)[1]);
   poe('synccriatura:'+slug,{nome:'Criatura',imagem:'',donoUid:'',x:n==='1'?6:n==='2'?21:10,y:n==='1'?7:n==='2'?6:9,revision:0,facing:0,camada:3,mapaId:'demo_masmorra',diametroM:2,diametroPersonalizadoV205:true});}
  window.__fsWrite('combatesAtivos/mesaSessaoV206',{auto:{em:'2099-01-01'}}); // não deixa o preparo automático interferir na demo
  await window.abrirMapaBancoNaMesa_('demo_palacio');
  // herói como ator selecionado (a entrada automática em portas v206 depende disso)
  const sel=document.getElementById('novaSyncPersonagem');
  const marca=()=>{const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));if(!t)return false;
   if(sel&&![...sel.options].some(o=>o.value===t.id)){const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);}
   if(sel)sel.value=t.id;return true;};
  for(let i=0;i<50&&!marca();i++)await new Promise(r=>setTimeout(r,200));
  // interface limpa para o vídeo: só o mapa (o viewport fixo cobre o restante)
  setInterval(()=>{try{window.mesaAtuarAbaV205?.destruir?.();}catch(_){}},1000); // "Atuar como" não pode roubar a seleção na demo
  const css=document.createElement('style');css.textContent=`
   #appScreen>.user-header,#appScreen>h1,#appScreen>.tabs{display:none!important}
   #sincronizacao-nova .form-section>*:not(.nova-board-scroll){display:none!important}
   #mesaPaineisForaMapa{display:none!important}
   #ssToastV206{display:none!important}
   .mc-aviso{display:none!important}
   #labMapViewport{position:fixed!important;inset:0!important;z-index:12000!important;background:#0a0d14;padding:0!important}
   *{cursor:none!important}`;
  document.head.append(css);
  // guarda-fogo: qualquer elemento de interface fora do tabuleiro e das cartelas some na hora
  setInterval(()=>{try{
   const alvo='body button, body [role="button"], body select, body input, body aside, body details, body nav, body [data-mapa-painel]';
   for(const el of document.querySelectorAll(alvo)){
    if(el.closest('#novaSyncBoard,#demoSplash,#demoCapa,#labMapViewport'))continue;
    const cs=getComputedStyle(el);if(cs.display==='none')continue;
    if(!el.dataset.demoHide){el.dataset.demoHide='1';el.style.setProperty('display','none','important');console.log('[demo-hide]',el.tagName,el.id||String(el.className).slice(0,40));}
   }
   for(const el of document.querySelectorAll('body *')){
    if(el.closest('#novaSyncBoard,#demoSplash,#demoCapa,#labMapViewport'))continue;
    const cs=getComputedStyle(el);if(cs.position!=='fixed'||cs.display==='none'||cs.visibility==='hidden')continue;
    const r=el.getBoundingClientRect();if(r.width<4||r.height<4)continue;
    if(!el.dataset.demoHide){el.dataset.demoHide='1';el.style.setProperty('display','none','important');console.log('[demo-hide]',el.tagName,el.id||String(el.className).slice(0,40));}
   }
  }catch(_){}},400);
  // cartela de abertura + legenda de cena
  const splash=document.createElement('div');splash.id='demoSplash';
  splash.style.cssText='position:fixed;inset:0;z-index:13000;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 35%,#1c2a4a 0%,#0a0d14 70%);color:#eaf2ff;font:600 15px Segoe UI,Arial,sans-serif;transition:opacity 1.2s;text-align:center;padding:0 8vw';
  splash.innerHTML=`<div style="font-size:44px;letter-spacing:2px">🌟 MESA ESTELAR</div>
   <div style="margin-top:10px;color:#9fc0ff;font-size:17px">A jornada até a Cidade Sem Nome</div>
   <div style="margin-top:26px;color:#c6d3e6;font-weight:400;font-size:14px;line-height:1.7">Palácio de Ilü-Mus-Ki → Praça da Cidade Alta → Espaço-porto de Kharon → Mar de Pedra → Ruínas → Masmorra</div>
   <div style="margin-top:34px;color:#ffd98a;font-size:13px">gravação da mesa real · portas automáticas · miniaturas vistas de cima</div>`;
  document.body.append(splash);
  const capa=document.createElement('div');capa.id='demoCapa';
  capa.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:12500;padding:8px 18px;border-radius:14px;background:rgba(8,12,22,.82);border:1px solid #3b5878;color:#eaf2ff;font:600 14px Segoe UI,Arial,sans-serif;opacity:0;transition:opacity .8s;pointer-events:none';
  document.body.append(capa);
 },{mapas:MAPAS,ligs:LIGS,npcs:NPCS,criatRuinas:CRIAT_RUINAS,criatMasmorra:CRIAT_MASMORRA,heroiVisual:HEROI_VISUAL});
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}const l=document.getElementById('loginScreen');if(l)l.style.display='none';});
 await page.waitForSelector('#novaSyncBoard',{timeout:30000});
 await page.waitForFunction(()=>[...document.querySelectorAll('#novaSyncBoard [data-token]')].length>=3,null,{timeout:30000});
 console.log('[demo] mesa montada. gravando.');

 const capa=async t=>page.evaluate(t=>{const d=document.getElementById('demoCapa');d.textContent=t;d.style.opacity='1';},t);
 const abreSplash=async()=>{await S(5200);await page.evaluate(()=>{const d=document.getElementById('demoSplash');d.style.opacity='0';setTimeout(()=>d.remove(),1300);});};

 // ---------- estado local dos tokens ----------
 const tokens=new Map();
 const reg=(id,def)=>tokens.set(id,{rev:0,facing:0,donoUid:'',...def});
 reg(HEROI,{nome:'Kael',donoUid:DONO,mapaId:'demo_palacio',x:4,y:7,diametroM:2.2,visual:HEROI_VISUAL});
 for(const n of NPCS)reg(n.id,{nome:n.nome,mapaId:n.mapa,x:n.x,y:n.y,diametroM:1.6,visual:n.visual});
 const bichosRuinas=CRIAT_RUINAS.map(slug=>{const id='synccriatura:'+slug;reg(id,{nome:'Rastejante de cinzas',mapaId:'demo_ruinas',x:slug.endsWith('~1')?20:22,y:slug.endsWith('~1')?3:9,diametroM:2});return id;});
 const bichosMasmorra=CRIAT_MASMORRA.map(slug=>{const n=String(slug.match(/~(\d)/)[1]);reg(id_fixo(slug),{nome:'Criatura',mapaId:'demo_masmorra',x:n==='1'?6:n==='2'?21:10,y:n==='1'?7:n==='2'?6:9,diametroM:2});return id_fixo(slug);});
 function id_fixo(slug){return 'synccriatura:'+slug;}
 const perseguir=list=>list.map(id=>{const l=tokens.get(id);return {id,nome:l.nome,mapaId:l.mapaId,x:l.x,y:l.y,vel:2.4,pararEm:1.5,rev:0,facing:0,donoUid:'',diametroM:2};});

 // ---------- helpers de baixo nível ----------
 const tokenPos=async id=>page.evaluate(id=>{const t=window.__APP__.ctl().token(id);return t?{x:t.x,y:t.y,mapa:String(t.mapaId||''),rev:Number(t.revision||0)}:null;},id);
 const gravar=async(id,t)=>({p:POS+'/'+encodeURIComponent(id),v:{nome:t.nome,imagem:'',donoUid:t.donoUid||'',x:+t.x.toFixed(3),y:+t.y.toFixed(3),revision:t.rev,facing:t.facing||0,camada:3,mapaId:t.mapaId,diametroM:t.diametroM||1,...(t.visual?{visualV203:t.visual}:{}),...(String(id).startsWith('synccriatura:')?{diametroPersonalizadoV205:true}:{})}});
 const escrever=async docs=>page.evaluate(docs=>{for(const d of docs)window.__fsWrite(d.p,d.v);},docs);
 const centralizar=async id=>page.evaluate(id=>{const c=window.__APP__.ctl(),t=c.tokenVisual(id);const vp=document.getElementById('labMapViewport');const board=document.getElementById('novaSyncBoard');
  if(!t||!vp||!board)return; // t.x/t.y vêm em unidades de grade 28×14
  vp.scrollLeft=t.x/28*board.clientWidth-vp.clientWidth/2;vp.scrollTop=t.y/14*board.clientHeight-vp.clientHeight/2;},id);
 const sincronizarHeroi=async()=>{const vivo=await tokenPos(encodeURIComponent(HEROI));if(vivo){const h=tokens.get(HEROI);h.mapaId=vivo.mapa;h.x=vivo.x;h.y=vivo.y;h.rev=Math.max(h.rev,vivo.rev);}};
 const reselecionar=()=>page.evaluate(()=>{const sel=document.getElementById('novaSyncPersonagem');if(!sel)return;const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));if(!t)return;
  if(![...sel.options].some(o=>o.value===t.id)){const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);}
  sel.value=t.id;});
 const esperarMapa=async(mapa,timeout=18000)=>{
  const t0=Date.now();let atual='';
  while(Date.now()-t0<timeout){
   await reselecionar();
   atual=await page.evaluate(()=>String(window.__APP__.ctl().mapaAtual()||''));
   if(atual===mapa)break;
   await S(700);}
  if(atual!==mapa){
   const d=await page.evaluate(()=>{
    const c=window.__APP__.ctl();const sel=document.getElementById('novaSyncPersonagem');
    const a=c.ator?.();const t=c.token(encodeURIComponent('demo_kael'));
    return {mapa:c.mapaAtual(),sel:sel?.value,ator:a?{id:a.id,x:a.x,y:a.y,mapa:a.mapaId}:null,
     token:t?{x:t.x,y:t.y,mapa:t.mapaId,rev:t.revision}:null,
     acoes:[...window.__fs.keys()].filter(k=>k.startsWith('combatesAtivos/mesaLigacoes/acoes')),
     ligs:(window.mesaLigacoes?.ligacoes?.()||[]).map(l=>l.id+':'+(l.portaAutoV206?'P':'-'))};});
   console.log('DIAG travessia para',mapa,JSON.stringify(d));
   throw new Error('mapa não mudou para '+mapa+' (ficou em '+String(atual)+')');}
  await S(1800);await sincronizarHeroi();await reselecionar();await centralizar(encodeURIComponent(HEROI));};
 async function andar(id,alvo,vel,opts={}){
  const ti=setInterval(async()=>{try{await centralizar(encodeURIComponent(id));}catch(_){}},220);
  try{
   const t0=Date.now();let tick=0;
   while(Date.now()-t0<(opts.timeout||90000)){
    const t=tokens.get(id);
    if(++tick%6===1){ // consulta remota só de vez em quando: detecta a porta automática e repara a seleção
     await reselecionar();
     const vivo=await tokenPos(encodeURIComponent(id));
     if(vivo&&vivo.mapa&&vivo.mapa!==t.mapaId){t.mapaId=vivo.mapa;t.x=vivo.x;t.y=vivo.y;t.rev=Math.max(t.rev,vivo.rev);break;}
     if(t.mapaId!==alvo.mapa)break;}
    const dx=alvo.x-t.x,dy=alvo.y-t.y,d=Math.hypot(dx,dy);
    const {W,H}=DIMS[t.mapaId]||{W:28,H:14};
    // portas cuja saída é o destino desta caminhada (evita parar na porta errada, ex.: ao nascer na entrada)
    const portas=(PORTAS[t.mapaId]||[]).filter(pt=>Math.hypot((pt.x-alvo.x)*W/28,(pt.y-alvo.y)*H/14)<=2.2);
    let dPorta=Infinity;
    for(const pt of portas){const dm=Math.hypot((pt.x-t.x)*W/28,(pt.y-t.y)*H/14)-(t.diametroM||1)/2;if(dm<dPorta)dPorta=dm;}
    if(dPorta<=1.5)break; // na soleira: para de escrever e a porta automática (v206) completa a travessia
    if(d<(opts.raio??0.5))break; // para colado no alvo (sem porta por perto)
    if(tick%40===0)console.log(`[andar] ${id} em ${t.x.toFixed(1)},${t.y.toFixed(1)} → ${alvo.x},${alvo.y} (${Math.round(Date.now()-t0)}ms)`);
    const passo=Math.min(d,vel*0.11);
    t.x+=dx/d*passo;t.y+=dy/d*passo;t.facing=Math.atan2(dy,dx);t.rev++;
    const docs=[await gravar(id,t)];
    for(const c of (opts.perseguir||[])){ // criaturas vão atrás do herói
     if(c.mapaId!==t.mapaId)continue;
     const ddx=t.x-c.x,ddy=t.y-c.y,dd=Math.hypot(ddx,ddy)||1e-6;
     if(dd>c.pararEm){const ps=Math.min(dd-c.pararEm,c.vel*0.11);c.x+=ddx/dd*ps;c.y+=ddy/dd*ps;c.facing=Math.atan2(ddy,ddx);c.rev++;}
     const lc=tokens.get(c.id);lc.x=c.x;lc.y=c.y;lc.rev=c.rev;
     docs.push(await gravar(c.id,c));}
    await escrever(docs);
    await S(95);
   }
  }finally{clearInterval(ti);}
 }

 await abreSplash();

 // ---------- cena 1: palácio ----------
 await capa('🏛️ Palácio de Ilü-Mus-Ki — Kael parte antes do amanhecer');
 await S(1500);
 await andar(HEROI,{mapa:'demo_palacio',x:25.2,y:7},2.6);
 await esperarMapa('demo_cidade');

 // ---------- cena 2: cidade ----------
 await capa('🏙️ Praça da Cidade Alta — comerciantes abrem as barracas');
 await andar(HEROI,{mapa:'demo_cidade',x:8,y:7},2.6);await S(900);
 await andar(HEROI,{mapa:'demo_cidade',x:25.7,y:7},2.6);
 await esperarMapa('demo_porto');

 // ---------- cena 3: espaço-porto ----------
 await capa('🚀 Espaço-porto de Kharon — a nave de Elü-mus-ki espera');
 await andar(HEROI,{mapa:'demo_porto',x:25.7,y:7},2.6);
 await esperarMapa('demo_viagem');

 // ---------- cena 4: viagem ----------
 await capa('🏜️ Mar de Pedra — dias de voo rasante sobre o deserto');
 await andar(HEROI,{mapa:'demo_viagem',x:25.7,y:7},2.6);
 await esperarMapa('demo_ruinas');

 // ---------- cena 5: ruínas (emboscada) ----------
 await capa('🏚️ A Cidade Sem Nome — algo se move entre os escombros');
 await andar(HEROI,{mapa:'demo_ruinas',x:13.6,y:7},2.6,{perseguir:perseguir(bichosRuinas)});
 await esperarMapa('demo_masmorra');

 // ---------- cena 6: masmorra (tesouro + fuga) ----------
 await capa('🕳️ Masmorra das Ruínas — o poço desce mais do que deveria');
 await andar(HEROI,{mapa:'demo_masmorra',x:8.5,y:4.7},2.3,{perseguir:perseguir(bichosMasmorra)});
 await capa('💰 Um baú empoeirado… e os passos se aproximam');
 await S(1800);
 await capa('🏃 Fuga! De volta à escada do poço');
 await andar(HEROI,{mapa:'demo_masmorra',x:14,y:12},2.6,{perseguir:perseguir(bichosMasmorra),timeout:20000});
 await esperarMapa('demo_ruinas');

 // ---------- cena 7: amanhecer ----------
 await capa('🌅 Amanhece sobre as ruínas — a caravana da Varra está chegando');
 await andar(HEROI,{mapa:'demo_ruinas',x:9,y:7},1.8,{timeout:15000});
 await page.evaluate(()=>{const d=document.createElement('div');
  d.style.cssText='position:fixed;inset:0;z-index:13000;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 35%,#23361f 0%,#0a0d14 75%);color:#eaf2ff;font:600 15px Segoe UI,Arial,sans-serif;text-align:center;transition:opacity 1.4s;opacity:0';
  d.innerHTML=`<div style="font-size:38px">🌟 MESA ESTELAR</div>
   <div style="margin-top:12px;color:#9fc0ff;font-size:16px">Sessão pronta para amanhã</div>
   <div style="margin-top:22px;color:#c6d3e6;font-weight:400;font-size:13.5px;line-height:1.8">Palácio · Cidade · Espaço-porto · Mar de Pedra · Ruínas · Masmorra<br>ligados por portas automáticas — o grupo entra e a mesa leva.</div>`;
  document.body.append(d);requestAnimationFrame(()=>{d.style.opacity='1';});});
 await S(7000);

 // ---------- fim: fecha o navegador e salva o vídeo ----------
 await H.close();
 const arq=fs.readdirSync(process.env.VIDEO_DIR).find(f=>f.endsWith('.webm'));
 if(!arq){console.error('VÍDEO NÃO GERADO',avisos.slice(0,5).join(' | '));process.exit(1);}
 const dest=path.join(DESTINO,'jornada-mesa-estelar.webm');
 fs.mkdirSync(DESTINO,{recursive:true});
 fs.copyFileSync(path.join(process.env.VIDEO_DIR,arq),dest);
 console.log('VÍDEO:',dest,Math.round(fs.statSync(dest).size/1024)+'KB');
 if(avisos.length)console.log('avisos de página:',avisos.slice(0,5).join(' | '));
})().catch(e=>{console.error('FALHA:',e);process.exit(1);});
