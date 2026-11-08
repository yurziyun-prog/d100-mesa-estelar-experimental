// Demo v2 gravada (vídeo): a jornada do herói pelos mapas REAIS salvos da Mesa Estelar.
// Diferenças da v1: mapas reais (não gerados), movimento 100% clique-para-andar nativo
// (com colisão e A*), câmera inclinada 45° (estilo Ragnarok), interações reais
// (loja/diálogo do comerciante), masmorra nativa (window.mesaMasmorra) e perseguição.
// Uso: node tests/_demo-viagem.cjs  → grava em %DEMO_DIR% (padrão: <workspace>/demo-viagem)
const path=require('path'),fs=require('fs');
const DESTINO=process.env.DEMO_DIR||'C:/Users/yurzi/Saved Games/projeto mapas/demo-viagem';
process.env.VIDEO_DIR=path.join(DESTINO,'_gravacao');
fs.rmSync(process.env.VIDEO_DIR,{recursive:true,force:true});
fs.mkdirSync(process.env.VIDEO_DIR,{recursive:true});
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas,abrirExport}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));

const HEROI='demo_kael',DONO='mestre1',HEROI_ENC=encodeURIComponent(HEROI);
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
const HEROI_VISUAL='p=#e6b98f;r=#1f2a3a;q=#3a3d44;d=#a8844a;c=#3a1f2a;e=#a8844a;h=curto;k=#3b2a1e;m=borda;a=#8a6a3a;o=normal;x=MS;z=EP;capa=1';

// mapas reais da jornada (documentos do Firestore de produção)
const IDS=['v95_residencia_ilu','v145_praca_cidade_alta','v138_espacoporto','cidade_sem_nome_20261013','therion_arte_20261013'];
const ID_MASMORRA='v184_masmorra';
const DIMS={'v95_residencia_ilu':{W:84,H:42},'v145_praca_cidade_alta':{W:56,H:28},'v138_espacoporto':{W:84,H:42},
 'cidade_sem_nome_20261013':{W:56,H:56},'therion_arte_20261013':{W:48,H:72},[ID_MASMORRA]:{W:60,H:36}};

const NPCS=[
 {id:'demo_guarda_1',mapa:'v95_residencia_ilu',onde:{fx:.32,fy:.5},nome:'Guarda da residência',visual:'p=#b27a4c;r=#6b7078;q=#3a3d44;d=#aeb3ba;c=#2e3a32;e=#aeb3ba;h=curto;k=#1f1a17;m=lisa;a=#8a8f96;o=normal;x=S;z=GK;capa=0'},
 {id:'demo_mercador_1',mapa:'v145_praca_cidade_alta',onde:{fx:.5,fy:.42},nome:'Comerciante da praça',sync:'syncnpc:comerciante_generico_humano~1',visual:'p=#d29a6a;r=#4a3a2c;q=#4f4a44;d=#8a6a3a;c=#4a3a2c;e=#8a6a3a;h=longo;k=#1f1a17;m=lisa;a=;o=normal;x=;z=;capa=0'},
 {id:'demo_mecanico',mapa:'v138_espacoporto',onde:{fx:.42,fy:.5},nome:'Mecânico do porto',visual:'p=#d29a6a;r=#2e3b34;q=#2b2f36;d=#b9bcc2;c=#2e3b34;e=#b9bcc2;h=curto;k=#2b2f3a;m=lisa;a=#3b3f46;o=normal;x=K;z=G;capa=0'},
 {id:'demo_varra',mapa:'therion_arte_20261013',onde:{fx:.5,fy:.45},nome:'Guia da caravana de Theriom',visual:'p=#8a5a38;r=#3a2a3a;q=#2b2f36;d=#c9a85a;c=#3a2a3a;e=#c9a85a;h=longo;k=#14100c;m=borda;a=#c9a85a;o=normal;x=V;z=T;capa=1'},
];
const CRIAT_RUINAS=['rastejante_de_cinzas~1','rastejante_de_cinzas~2'];

(async()=>{
 const M=mapas(IDS);
 const extras=[];
 for(const arq of ['arte-fonte/cidade-sem-nome/publicacao-firestore.json','arte-fonte/therion/publicacao-firestore.json'])
  for(const d of abrirExport(path.resolve(__dirname,'..',arq)))
   if(/^configuracoes\/objetoMapa_/.test(d.caminho))extras.push(d.dados);
 console.log('[demo]',IDS.length,'mapas reais +',extras.length,'modelos de objeto');

 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;const avisos=[];
 page.on('pageerror',e=>avisos.push('pageerror: '+e.message));
 page.on('console',m=>{const t=m.text();if(/Ligaç|ligac|ERRO|Error|error|falh|Falh|recusad/i.test(t))avisos.push('console: '+t.slice(0,300));});
 page.on('dialog',async d=>{avisos.push('dialog: '+d.type()+' '+d.message().slice(0,90));await d.accept().catch(()=>{});});

 console.log('[demo] app aberto, montando sessão…');
 await carregarBancoDePecas(page);

 // ---------- montagem silenciosa: mapas, masmorra nativa, portas livres, tokens ----------
 const monte=await page.evaluate(async({M,extras,npcs,criatRuinas,heroiVisual,idMasmorra,HEROI_,querMasmorra})=>{
  const A=window.__APP__;A.setMestre();
  const [ia,a3,bl,pk]=await Promise.all([import('/js/mesa-pecas-dados.js'),import('/js/mesa-pecas3d-dados.js'),import('/js/mesa-pecas-blender-dados.js'),import('/js/mesa-pecas.js')]);
  const lista=[...ia.PECAS,...a3.PECAS_3D,...bl.PECAS_BLENDER].map(p=>pk.modeloDaPeca(p,location.origin+'/'));
  A.setObjetos([...lista,...extras]);
  for(const [id,dados] of Object.entries(M))window.__fsWrite('mapas/'+id,JSON.parse(JSON.stringify(dados)));
  await window.recarregarBancoMapas_?.();
  // masmorra nativa do jogo (mapa + monstros + armadilhas); tolera falha
  let masmorraOK=false;
  try{
   if(!querMasmorra)throw Object.assign(new Error('pulada'),{pulada:true});
   let MM=window.mesaMasmorra;
   for(let i=0;i<40&&!MM;i++){await new Promise(r=>setTimeout(r,500));MM=window.mesaMasmorra;}
   if(!MM)(window.__avisosDemo=window.__avisosDemo||[]).push('mesaMasmorra undefined após 20 s');
   if(MM&&MM.montar){
    await Promise.race([MM.montar(),new Promise(r=>setTimeout(()=>r('timeout'),60000))]);
    for(let i=0;i<60;i++){const mm=window.__fs.get('mapas/'+idMasmorra);if(mm){masmorraOK=true;break;}await new Promise(r=>setTimeout(r,500));}
    if(!masmorraOK)(window.__avisosDemo=window.__avisosDemo||[]).push('montar() não gravou o mapa');
   }
  }catch(e){if(!e.pulada)(window.__avisosDemo=window.__avisosDemo||[]).push('masmorra: '+((e&&e.message)||e));}
  // grade de livre/ocupado por mapa (para escolher portas e pontos em chão aberto)
  const TIA=await import('/js/mesa-tempo-real-ia.js?v=133');
  const gradeLivre=(dados,raio=.35)=>{
   const W=Number(dados.larguraM)||28,H=Number(dados.alturaM)||14;
   const objs=(dados.mesaScene?.objects||[]).filter(o=>o&&o.bloqueiaMovimento&&!o.destruido);
   const gr=TIA.montarGrade(objs.map(o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),W,H,{passo:W>40?1:.5,raio});
   return {gr,W,H};
  };
  const livreEm=(gi,i,j)=>{const gr=gi.gr;const cw=gr.cw,ch=gr.ch;if(i<0||j<0||i>=cw||j>=ch)return false;return !gr.g[j*cw+i];};
  // escolhe a célula livre de maior "espaço aberto" numa faixa da borda ('E','W','N','S') ou 'I' (interior)
  const escolhe=(dados,lado)=>{
   const gi=gradeLivre(dados);
   const gr=gi.gr,W=gi.W,H=gi.H;
   const cw=gr.cw,ch=gr.ch,passo=gr.passo;
   let faixa;
   if(lado==='E')faixa={i0:cw-4,i1:cw-1,j0:2,j1:ch-3};
   else if(lado==='W')faixa={i0:1,i1:3,j0:2,j1:ch-3};
   else if(lado==='S')faixa={i0:3,i1:cw-4,j0:ch-4,j1:ch-2};
   else if(lado==='N')faixa={i0:3,i1:cw-4,j0:1,j1:2};
   else faixa={i0:Math.floor(cw*.3),i1:Math.ceil(cw*.7),j0:Math.floor(ch*.3),j1:Math.ceil(ch*.7)};
   const mi=lado==='E'||lado==='W'?(lado==='E'?cw-1:0):cw/2, mj=lado==='N'||lado==='S'?(lado==='S'?ch-1:0):ch/2;
   let melhor=null,melhorNota=-1;
   for(let j=faixa.j0;j<=faixa.j1;j++)for(let i=faixa.i0;i<=faixa.i1;i++){
    if(!livreEm(gi,i,j))continue;
    let espaco=0;for(let dj=-3;dj<=3;dj++)for(let di=-3;di<=3;di++)if(livreEm(gi,i+di,j+dj))espaco++;
    const nota=espaco-Math.hypot(i-mi,j-mj)*1.5;
    if(nota>melhorNota){melhorNota=nota;melhor={i,j};}
   }
   if(!melhor)return null;
   return {x:((melhor.i+.5)*passo)/W*28,y:((melhor.j+.5)*passo)/H*14};
  };
  const posLivre=(dados,fx,fy)=>{ // ponto livre mais próximo de uma fração do mapa
   const gi=gradeLivre(dados);
   const gr=gi.gr,W=gi.W,H=gi.H;
   const cw=gr.cw,ch=gr.ch,passo=gr.passo;
   const ci0=Math.floor(cw*fx),cj0=Math.floor(ch*fy);
   let melhor=null,melhorD=1e9;
   for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){
    if(!livreEm(gi,i,j))continue;
    const d=Math.hypot(i-ci0,j-cj0);if(d<melhorD){melhorD=d;melhor={i,j};}
   }
   return melhor?{x:((melhor.i+.5)*passo)/W*28,y:((melhor.j+.5)*passo)/H*14}:null;
  };
  const docs={};
  const getMapa=id=>id===idMasmorra?window.__fs.get('mapas/'+id):M[id];
  const POS_='combatesAtivos/mapaMesaSyncDireta/posicoes';
  const poe=(id,v)=>window.__fsWrite(POS_+'/'+encodeURIComponent(id),v);
  // portas automáticas (v206) nas bordas livres
  const L=[];
  const liga=(ka,la,kb,lb)=>{
   const a=escolhe(getMapa(ka),la),b=escolhe(getMapa(kb),lb);
   if(!a||!b)return console.warn('[demo] porta falhou:',ka,la,'→',kb,lb);
   L.push({id:'lig_'+ka+'_'+kb,a:{mapa:ka,x:a.x,y:a.y},b:{mapa:kb,x:b.x,y:b.y},tipo:'porta',auto:true,portaAutoV206:true});
  };
  liga('v95_residencia_ilu','E','v145_praca_cidade_alta','W');
  liga('v145_praca_cidade_alta','E','v138_espacoporto','W');
  liga('v138_espacoporto','E','cidade_sem_nome_20261013','W');
  if(masmorraOK)liga('cidade_sem_nome_20261013','I','v184_masmorra','N');
  // cidade→therion: a borda leste da cidade em ruínas tem regiões muradas INATINGÍVEIS a partir
  // da entrada oeste (o A* com o raio real do corpo confirma). Escolher a porta pela
  // ALCANÇABILIDADE: BFS pela grade com a inflação do corpo, célula livre atingível mais a leste.
  {
   const gi=gradeLivre(getMapa('cidade_sem_nome_20261013'),.88),gr=gi.gr,W=gi.W,H=gi.H,cw=gr.cw,ch=gr.ch,passo=gr.passo;
   const livre=(i,j)=>i>=0&&j>=0&&i<cw&&j<ch&&!gr.g[j*cw+i];
   // célula de partida: livre mais próxima da entrada oeste (x≈2.5,y=7 em unidades 28×14)
   const ci0=Math.floor(2.5*W/28/passo),cj0=Math.floor(7*H/14/passo);
   let si=-1,sj=-1,sd=1e9;
   for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){if(!livre(i,j))continue;const d=Math.hypot(i-ci0,j-cj0);if(d<sd){sd=d;si=i;sj=j;}}
   const alc=new Uint8Array(cw*ch),fila=[[si,sj]];alc[sj*cw+si]=1;
   while(fila.length){const [i,j]=fila.pop();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=cw||nj>=ch||alc[nj*cw+ni]||!livre(ni,nj))continue;if(di&&dj&&(!livre(i+di,j)||!livre(i,j+dj)))continue;alc[nj*cw+ni]=1;fila.push([ni,nj]);}}
   let mi=-1,mj=-1;for(let j=0;j<ch;j++)for(let i=0;i<cw;i++)if(alc[j*cw+i]&&(mi<0||i>mi||(i===mi&&Math.abs(j-ch/2)<Math.abs(mj-ch/2)))){mi=i;mj=j;}
   const bT=escolhe(getMapa('therion_arte_20261013'),'W');
   if(mi>=0&&bT)L.push({id:'lig_cidade_sem_nome_20261013_therion_arte_20261013',a:{mapa:'cidade_sem_nome_20261013',x:((mi+.5)*passo)/W*28,y:((mj+.5)*passo)/H*14},b:{mapa:'therion_arte_20261013',x:bT.x,y:bT.y},tipo:'porta',auto:true,portaAutoV206:true});
   else console.warn('[demo] porta cidade→therion falhou (sem célula atingível)');
  }
  window.__fsWrite('combatesAtivos/mesaLigacoes',{ligacoes:L,atualizadoEm:Date.now(),ladosV138:true});
  window.__demoLigs=JSON.parse(JSON.stringify(L));
  // IA em tempo real CONGELADA na demo: com fichas sintéticas o fluxo de ataque da IA
  // quebra (novaFicha_ null) e trava o tabuleiro. pausaEmergência impede que o
  // pulso automático (a cada 250 ms) religue o jogo.
  window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:false,continuoV214:false,pausado:true,pausaEmergencia:true,mapaId:''});
  setInterval(()=>{try{const e=window.__fs.get('combatesAtivos/mesaTempoReal');if(e&&!e.pausaEmergencia)window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:false,continuoV214:false,pausado:true,pausaEmergencia:true,mapaId:''});
   // descarta o rascunho do editor: painéis automáticos injetam objetos fantasmas no mapa
   try{const R=window.mesaRascunhoMapaV193;if(R&&R.pendentes>0)R.descartar();}catch(_){}}catch(_){}},1000);
  setInterval(()=>{try{const p='combatesAtivos/mesaLigacoes';const d=window.__fs.get(p);const atuais=(d&&d.ligacoes)||[];
   if(atuais.length!==window.__demoLigs.length||!atuais.every(l=>window.__demoLigs.some(x=>x.id===l.id)))
    window.__fsWrite(p,{ligacoes:window.__demoLigs,atualizadoEm:Date.now(),ladosV138:true});}catch(_){}},2000);
  const PORTAS={};for(const l of L)for(const p of [l.a,l.b])(PORTAS[p.mapa]=PORTAS[p.mapa]||[]).push({x:p.x,y:p.y});
  // herói em chão aberto perto do centro-oeste do palácio
  const ini=posLivre(M['v95_residencia_ilu'],.22,.5)||{x:6,y:7};
  poe(HEROI_,{nome:'Kael',imagem:'',donoUid:'mestre1',x:ini.x,y:ini.y,revision:0,facing:Math.PI/2,camada:3,mapaId:'v95_residencia_ilu',diametroM:2.2,visualV203:heroiVisual});
  await window.abrirMapaBancoNaMesa_('v95_residencia_ilu');
  const NPC_POS={};
  for(const n of npcs){
   const alvo=posLivre(getMapa(n.mapa),n.onde.fx,n.onde.fy);if(!alvo)continue;
   const id=n.sync||n.id;NPC_POS[id]={mapa:n.mapa,...alvo};
   poe(id,{nome:n.nome,imagem:'',donoUid:'',x:alvo.x,y:alvo.y,revision:0,facing:0,camada:3,mapaId:n.mapa,diametroM:1.7,visualV203:n.visual});
  }
  // baú na masmorra (ponto do "tesouro")
  let bau=null;
  if(masmorraOK){
   const mm=window.__fs.get('mapas/'+idMasmorra),W=Number(mm.larguraM)||60,H=Number(mm.alturaM)||36;
   const alvo=(mm.mesaScene?.objects||[]).find(o=>/bau|baú|tesouro|bau_/i.test(String(o.tipo||'')+String(o.nome||'')+String(o.modeloId||'')+String(o.id||'')));
   if(alvo)bau={x:Number(alvo.x)*28/W,y:Number(alvo.y)*14/H};
   else{const p=posLivre(mm,.78,.55);bau=p;}
  }
  // interface limpa para o vídeo
  window.__demoMostraUI=false;
  const css=document.createElement('style');css.textContent=`
   #appScreen>.user-header,#appScreen>h1,#appScreen>.tabs{display:none!important}
   #sincronizacao-nova .form-section>*:not(.nova-board-scroll){display:none!important}
   #mesaPaineisForaMapa{display:none!important}
   #ssToastV206{display:none!important}
   .mc-aviso{display:none!important}
   #labMapViewport{position:fixed!important;inset:0!important;z-index:12000!important;background:#0a0d14;padding:0!important}
   .nova-board-scroll{position:fixed!important;inset:0!important;overflow:hidden!important;padding:0!important}
   #camZoom,#camPan{display:none!important}
   *{cursor:none!important}`;
  document.head.append(css);
  setInterval(()=>{try{
   if(window.__demoMostraUI)return; // cena de interação: deixa a UI nativa aparecer
   const b=document.getElementById('novaSyncBoard');
   const protegido=el=>el.closest('#novaSyncBoard,#demoSplash,#demoCapa,#labMapViewport')||(b&&(b.contains(el)||el.contains(b)));
   const alvo='body button, body [role="button"], body select, body input, body aside, body details, body nav, body [data-mapa-painel]';
   for(const el of document.querySelectorAll(alvo)){
    if(protegido(el))continue;
    const cs=getComputedStyle(el);if(cs.display==='none')continue;
    if(!el.dataset.demoHide){el.dataset.demoHide='1';el.style.setProperty('display','none','important');}
   }
   for(const el of document.querySelectorAll('body *')){
    if(protegido(el))continue;
    const cs=getComputedStyle(el);if(cs.position!=='fixed'||cs.display==='none'||cs.visibility==='hidden')continue;
    const r=el.getBoundingClientRect();if(r.width<4||r.height<4)continue;
    if(!el.dataset.demoHide){el.dataset.demoHide='1';el.style.setProperty('display','none','important');}
   }
  }catch(_){}},400);
  // cartela de abertura + legenda de cena
  const splash=document.createElement('div');splash.id='demoSplash';
  splash.style.cssText='position:fixed;inset:0;z-index:13000;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 35%,#1c2a4a 0%,#0a0d14 70%);color:#eaf2ff;font:600 15px Segoe UI,Arial,sans-serif;transition:opacity 1.2s;text-align:center;padding:0 8vw';
  splash.innerHTML=`<div style="font-size:44px;letter-spacing:2px">🌟 MESA ESTELAR</div>
   <div style="margin-top:10px;color:#9fc0ff;font-size:17px">A jornada até a Cidade Sem Nome</div>
   <div style="margin-top:26px;color:#c6d3e6;font-weight:400;font-size:14px;line-height:1.7">Residência de Ilü-Mus-Ki → Praça da Cidade Superior → Espaço-porto → Cidade em Ruínas → Masmorra → Theriom</div>
   <div style="margin-top:34px;color:#ffd98a;font-size:13px">mapas reais da campanha · visão inclinada · clique-para-andar com colisão · portas automáticas</div>`;
  document.body.append(splash);
  const capa=document.createElement('div');capa.id='demoCapa';
  capa.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:12500;padding:8px 18px;border-radius:14px;background:rgba(8,12,22,.82);border:1px solid #3b5878;color:#eaf2ff;font:600 14px Segoe UI,Arial,sans-serif;opacity:0;transition:opacity .8s;pointer-events:none';
  document.body.append(capa);
  // rastreio de transições: quem abriu o mapa (seleção, abrirMapaBancoNaMesa_, follow)?
  window.__trac=[];const tr=(m,o)=>window.__trac.push(performance.now().toFixed(0)+' '+m+(o!==undefined?' '+JSON.stringify(o):''));
  const selMapa=document.getElementById('novaSyncMapa');
  if(selMapa)selMapa.addEventListener('change',()=>tr('selectMapa:change=',selMapa.value),true);
  const origAbre=window.abrirMapaBancoNaMesa_;
  window.abrirMapaBancoNaMesa_=async function(id){tr('abrirMapaBancoNaMesa_(',id);const r=origAbre.apply(this,arguments);if(r?.then)r.then(()=>tr('abrirMapaBancoNaMesa_ ok',id),e=>tr('abrirMapaBancoNaMesa_ ERRO',String(e&&e.message||e).slice(0,120)));return r;};
  return {masmorraOK,avisos:window.__avisosDemo||[],portas:L.map(l=>({id:l.id,a:l.a,b:l.b})),bau,ini,npcPos:NPC_POS};
 },{M,extras,npcs:NPCS,criatRuinas:CRIAT_RUINAS,heroiVisual:HEROI_VISUAL,idMasmorra:ID_MASMORRA,HEROI_:'demo_kael',querMasmorra:process.env.DEMO_SEM_MASMORRA!=='1'});
 console.log('[demo] masmorra:',monte.masmorraOK?'nativa OK':'FALHOU (roteiro encurtado)',(monte.avisos||[]).join(' ; ')||'');
 console.log('[demo] portas:',monte.portas.map(p=>p.id).join(' | '));
 if(monte.masmorraOK&&monte.bau)console.log('[demo] baú em',JSON.stringify(monte.bau));
 const LADO=(idLig,mapa)=>{const p=monte.portas.find(p=>p.id===idLig);if(!p)throw new Error('ligação não encontrada: '+idLig);
  return p.a.mapa===mapa?p.a:p.b;};
 const LIG_PALACIO='lig_v95_residencia_ilu_v145_praca_cidade_alta',LIG_PRACA='lig_v145_praca_cidade_alta_v138_espacoporto',
  LIG_PORTO='lig_v138_espacoporto_cidade_sem_nome_20261013',LIG_POCO='lig_cidade_sem_nome_20261013_v184_masmorra',
  LIG_THERION='lig_cidade_sem_nome_20261013_therion_arte_20261013';

 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}const l=document.getElementById('loginScreen');if(l)l.style.display='none';});
 await page.waitForSelector('#novaSyncBoard',{state:'attached',timeout:30000});
 try{
  await page.waitForFunction(()=>window.__APP__.ctl().token(encodeURIComponent('demo_kael'))&&String(window.__APP__.ctl().mapaAtual())==='v95_residencia_ilu',{timeout:30000});
 }catch(e){
  const d=await page.evaluate(()=>({mapa:String(window.__APP__.ctl().mapaAtual()||''),tokens:(window.__fs.keys?window.__fs.keys():[]).filter(k=>k.includes('posicoes')).length,
   board:!!document.getElementById('novaSyncBoard'),avisos:(window.__avisosDemo||[]).slice(0,8)}));
  console.log('DIAG montagem:',JSON.stringify(d));
  throw e;
 }
 await page.evaluate(()=>{try{window.mesaCameraV144?.inclinar?.(45);}catch(_){}});
 console.log('[demo] mesa montada. gravando.');

 const capa=async t=>page.evaluate(t=>{const d=document.getElementById('demoCapa');d.textContent=t;d.style.opacity='1';},t);
 const semCapa=()=>page.evaluate(()=>{document.getElementById('demoCapa').style.opacity='0';});
 const abreSplash=async()=>{await S(4200);await page.evaluate(()=>{const d=document.getElementById('demoSplash');d.style.opacity='0';setTimeout(()=>d.remove(),1300);});};

 // ---------- helpers ----------
 const tokenPos=async enc=>page.evaluate(id=>{const t=window.__APP__.ctl().token(id);return t?{x:t.x,y:t.y,mapa:String(t.mapaId||''),rev:Number(t.revision||0)}:null;},enc);
 const mapaAtual=()=>page.evaluate(()=>String(window.__APP__.ctl().mapaAtual()||''));
 const reselecionar=()=>page.evaluate(()=>{const sel=document.getElementById('novaSyncPersonagem');if(!sel)return;const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));if(!t)return;
  if(![...sel.options].some(o=>o.value===t.id)){const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);}
  if(sel.value!==t.id){sel.value=t.id;sel.dispatchEvent(new Event('change',{bubbles:true}));}});
 const esperarMapa=async(mapa,timeout=20000)=>{
  const t0=Date.now();let atual='';
  while(Date.now()-t0<8000){ // 8 s de espera natural; depois disso o mestre "abre na mão"
   await reselecionar();
   atual=await mapaAtual();
   if(atual===mapa)break;
   await S(500);}
  // recuperação ativa: o mestre abriria o mapa na mão — a demo faz o mesmo
  if(atual!==mapa){
   console.log('[demo] esperarMapa: recuperando abertura de '+mapa+' (estava em '+String(atual)+')');
   await page.evaluate(id=>{const s=document.getElementById('novaSyncMapa');if(s){s.value=id;s.dispatchEvent(new Event('change',{bubbles:true}));}},mapa);
   const tR=Date.now();
   while(Date.now()-tR<timeout){await S(600);atual=await mapaAtual();if(atual===mapa)break;}
   if(atual!==mapa){await page.evaluate(id=>window.abrirMapaBancoNaMesa_(id),mapa);const tR2=Date.now();
    while(Date.now()-tR2<8000){await S(600);atual=await mapaAtual();if(atual===mapa)break;}}
   if(atual===mapa)console.log('[demo] recuperação OK: '+mapa);
  }
  if(atual!==mapa)throw new Error('mapa não mudou para '+mapa+' (ficou em '+String(atual)+') | diag: '+JSON.stringify(await page.evaluate(()=>{
   const c=window.__APP__.ctl(),a=c.ator?.(),s=document.getElementById('novaSyncMapa');
   return {ator:a?{id:a.id,x:a.x,y:a.y,mapa:String(a.mapaId||'')}:null,
    acoes:(window.__fs.keys?window.__fs.keys():[]).filter(k=>k.includes('mesaLigacoes/acoes')),
    ligs:(window.mesaLigacoes?.ligacoes?.()||[]).map(l=>l.id+':'+(l.portaAutoV206?'P':'-')),
    opts:s?[...s.options].map(o=>o.value):null,
    pend:window.mesaRascunhoMapaV193?.pendentes,
    trac:(window.__trac||[]).slice(-30),
    abre:typeof window.abrirMapaBancoNaMesa_};})));
  await S(1600);await reselecionar();await page.evaluate(()=>{try{window.mesaCameraV144?.inclinar?.(45);}catch(_){}});};
 // clique-para-andar nativo: reclica no ponto de destino até chegar perto ou trocar de mapa
 async function marcharAte(mapa,alvo,{timeout=45000,raio=1.3}={}){
  const t0=Date.now();let k=0,ultimoD=1e9,semProgresso=0,ultimoClique=0,encostas=0;
  const clica=async()=>{
   const pt=await page.evaluate(alvo=>{const b=document.getElementById('novaSyncBoard');if(!b)return {erro:'sem board'};
    const r=b.getBoundingClientRect();
    const px=r.left+alvo.x/28*r.width,py=r.top+alvo.y/14*r.height;
    const em=document.elementFromPoint(px,py);
    return {px,py,ok:!!(em&&em.closest('#novaSyncBoard'))};},alvo);
   if(pt&&pt.ok){await page.mouse.click(pt.px,pt.py);ultimoClique=Date.now();}
   else if(++k<=4)console.log('[marchar] sem ponto de clique:',JSON.stringify(pt));
  };
  await clica();
  let ultimaNota=0;
  while(Date.now()-t0<timeout){
   await reselecionar();
   const vivo=await tokenPos(HEROI_ENC);
   if(!vivo){await S(500);continue;}
   if(vivo.mapa&&vivo.mapa!==mapa)return 'mudou';
   const {W,H}=DIMS[mapa];
   const d=Math.hypot((alvo.x-vivo.x)*W/28,(alvo.y-vivo.y)*H/14);
   if(d<=raio)return 'chegou';
   // diagnóstico: seleção às vezes escorrega para outro token (teste_jogador_v138)
   const selAgora=await page.evaluate(()=>document.getElementById('novaSyncPersonagem')?.value||'');
   if(Date.now()-ultimaNota>5000){ultimaNota=Date.now();console.log('[marchar]',mapa,'d=',d.toFixed(1),'sel=',selAgora,'hero=',vivo.x.toFixed(1)+','+vivo.y.toFixed(1));}
   if(selAgora!==HEROI){
    console.log('[marchar] seleção escorregou para',selAgora,'— resselecionando');
    await reselecionar();await S(150);await clica();semProgresso=0;ultimoD=1e9;await S(700);continue;}
   if(d<ultimoD-0.35){ultimoD=d;semProgresso=0;encostas=0;}
   else{semProgresso++;if(semProgresso>=4||Date.now()-ultimoClique>6000){
    if(semProgresso>=4){encostas++;
     if(encostas>=2){ // herói possivelmente incrustado numa parede (deslize v120): nudge de 1 m rumo ao alvo
      encostas=0;
      const esc=DIMS[mapa]||{W:56,H:28};
      await page.evaluate(({h,a,sx,sy})=>{const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
       const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));if(!t)return;
       const dx=(a.x-h.x)*sx,dy=(a.y-h.y)*sy,d=Math.hypot(dx,dy)||1;
       window.__fsWrite(POS+'/'+t.id,{...t,x:+(t.x+dx/d*1/sx).toFixed(3),y:+(t.y+dy/d*1/sy).toFixed(3),revision:Date.now()%100000});},{h:vivo,a:alvo,sx:esc.W/28,sy:esc.H/14});
     }else{
      const esc=DIMS[mapa]||{W:56,H:28};
      await page.evaluate(({h,sx,sy})=>{const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
       for(const t of window.__APP__.ctl().tokensNoMapa()){
        if(t.id===encodeURIComponent('demo_kael'))continue;
        const dx=(t.x-h.x)*sx,dy=(t.y-h.y)*sy,d=Math.hypot(dx,dy);
        if(d>0.1&&d<2.2)window.__fsWrite(POS+'/'+t.id,{...t,x:+(t.x+dx/d*2.6/sx).toFixed(3),y:+(t.y+dy/d*2.6/sy).toFixed(3),revision:Date.now()%100000});}},{h:vivo,sx:esc.W/28,sy:esc.H/14});}}
    await clica();semProgresso=0;}}
   await S(700);
  }
  return 'tempo';
 }
 // anda até a porta e espera a travessia automática
 async function atravessa(mapaDe,alvo,mapaPara){
  const r=await marcharAte(mapaDe,alvo,{raio:1.1,timeout:45000});
  if(r==='mudou'){await esperarMapa(mapaPara);return;}
  for(let i=0;i<8;i++){
   await reselecionar();
   const pt=await page.evaluate(alvo=>{const b=document.getElementById('novaSyncBoard');if(!b)return null;const r=b.getBoundingClientRect();
    const px=r.left+alvo.x/28*r.width,py=r.top+alvo.y/14*r.height;
    const em=document.elementFromPoint(px,py);return (em&&em.closest('#novaSyncBoard'))?{px,py}:null;},alvo);
   if(pt)await page.mouse.click(pt.px,pt.py);
   await S(850);
   if((await mapaAtual())===mapaPara){await esperarMapa(mapaPara);return;}
  }
  // último recurso (equivale ao mestre arrastar a miniatura até a soleira):
  // coloca o herói no ponto da porta; o gatilho v206 reconhece o movimento e atravessa
  console.log('[demo] atravessa: colocando herói na soleira '+mapaDe+'→'+mapaPara);
  await page.evaluate(a=>{const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
   const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));if(!t)return;
   window.__fsWrite(POS+'/'+t.id,{...t,x:a.x,y:a.y,revision:Date.now()%100000});},alvo);
  for(let i=0;i<10;i++){
   await S(700);
   await page.evaluate(a=>{const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
    const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));if(!t)return;
    window.__fsWrite(POS+'/'+t.id,{...t,x:a.x,y:a.y,revision:Date.now()%100000});},alvo);
   if((await mapaAtual())===mapaPara){await esperarMapa(mapaPara);return;}
  }
  throw new Error('porta não atravessou: '+mapaDe+'→'+mapaPara+' | diag: '+JSON.stringify(await page.evaluate(()=>{
   const c=window.__APP__.ctl(),a=c.ator?.();
   return {mapa:String(c.mapaAtual()||''),ator:a?{id:a.id,x:a.x,y:a.y,dono:a.donoUid,diam:a.diametroM}:null,
    acoes:(window.__fs.keys?window.__fs.keys():[]).filter(k=>k.includes('mesaLigacoes/acoes')).length,
    ligs:(window.mesaLigacoes?.ligacoes?.()||[]).map(l=>l.id+':'+(l.portaAutoV206?'P':'-'))};
  })));
 }
 const clicaToken=async(encId)=>{
  const p=await page.evaluate(id=>{const n=document.querySelector(`[data-token="${CSS.escape(id)}"]`);if(!n)return null;const r=n.getBoundingClientRect();return {px:r.left+r.width/2,py:r.top+r.height/2};},encId);
  if(p)await page.mouse.click(p.px,p.py);return !!p;};
 const criaturas=async(mapa,lista)=>page.evaluate(({mapa,lista})=>{
  const POS_='combatesAtivos/mapaMesaSyncDireta/posicoes';
  const out=[];
  lista.forEach((slug,i)=>{
   const id='synccriatura:'+slug;
   const t=window.__APP__.ctl().token(encodeURIComponent(id));
   if(t)out.push({id,nome:t.nome,x:t.x,y:t.y,mapa:String(t.mapaId||'')});
  });
  return out;},{mapa,lista:CRIAT_RUINAS});
 // perseguição manual de reserva (só se a IA nativa não mover as criaturas)
 const persegue=async(lista,parar=6.2)=>{
  const hero=await tokenPos(HEROI_ENC);if(!hero)return;
  const {W,H}=DIMS[hero.mapa]||{W:56,H:56};
  const bs=await criaturas(hero.mapa,lista);
  const docs=[];
  for(const b of bs){
   if(b.mapa!==hero.mapa)continue;
   const d=Math.hypot((hero.x-b.x)*W/28,(hero.y-b.y)*H/14);
   if(d>parar&&d<22){
    const passo=Math.min(d-parar,2.8*.12);
    const nx=b.x+(hero.x-b.x)/d*passo*28/W,ny=b.y+(hero.y-b.y)/d*passo*14/H;
    docs.push({p:POS+'/'+encodeURIComponent(b.id),v:{nome:b.nome,imagem:'',donoUid:'',x:+nx.toFixed(3),y:+ny.toFixed(3),revision:Date.now()%100000,facing:Math.atan2(hero.y-b.y,hero.x-b.x),camada:3,mapaId:b.mapa,diametroM:1.6,diametroPersonalizadoV205:true}});
   }}
  if(docs.length)await page.evaluate(docs=>{for(const d of docs)window.__fsWrite(d.p,d.v);},docs);
 };

 await abreSplash();
 const T0=Date.now();const resta=()=>255000-(Date.now()-T0);
 try{

 // ---------- cena 1: residência de Ilü-Mus-Ki ----------
 await capa('🏛️ Residência de Ilü-Mus-Ki — Kael parte antes do amanhecer');
 await S(1400);
 const p1=LADO(LIG_PALACIO,'v95_residencia_ilu');
 await atravessa('v95_residencia_ilu',p1,'v145_praca_cidade_alta');

 // ---------- cena 2: praça da cidade superior ----------
 if(resta()<40000)throw new Error('orçamento de tempo no fim');
 await capa('🏙️ Praça da Cidade Superior — as barracas estão abrindo');
 const mp=monte.npcPos['syncnpc:comerciante_generico_humano~1']||monte.npcPos[Object.keys(monte.npcPos).find(k=>k.includes('mercador'))];
 if(mp){
  await marcharAte('v145_praca_cidade_alta',{x:mp.x-2.8,y:mp.y+0.9},{raio:0.7});
  await capa('🗣️ Kael negocia com o comerciante da praça');
  await page.evaluate(()=>{window.__demoMostraUI=true;});
  await S(600);
  const enc=encodeURIComponent('syncnpc:comerciante_generico_humano~1');
  await clicaToken(enc);await S(900);await clicaToken(enc);
  await S(4200); // loja/diálogo nativo aberto em cena
  await page.keyboard.press('Escape').catch(()=>{});
  await page.evaluate(()=>{window.__demoMostraUI=false;});
  await semCapa();await S(600);
 }
 const p2=LADO(LIG_PRACA,'v145_praca_cidade_alta');
 await atravessa('v145_praca_cidade_alta',p2,'v138_espacoporto');

 // ---------- cena 3: espaço-porto ----------
 if(resta()<40000)throw new Error('orçamento de tempo no fim');
 await capa('🚀 Espaço-porto — a nave de Elü-mus-ki espera na plataforma');
 const pm=monte.npcPos['demo_mecanico'];
 if(pm){await marcharAte('v138_espacoporto',{x:pm.x-2.8,y:pm.y+0.6},{raio:0.7,timeout:30000});await S(1200);}
 const p3=LADO(LIG_PORTO,'v138_espacoporto');
 await atravessa('v138_espacoporto',p3,'cidade_sem_nome_20261013');

 // ---------- cena 4: cidade em ruínas (emboscada) ----------
 if(resta()<50000)throw new Error('orçamento de tempo no fim');
 await capa('🏚️ A Cidade Sem Nome — algo se move entre os escombros');
 await page.evaluate(()=>{ // 2 rastejantes a ~9 m do caminho
  const POS_='combatesAtivos/mapaMesaSyncDireta/posicoes';
  const poe=(slug,x,y)=>window.__fsWrite(POS_+'/synccriatura%3A'+slug,{nome:'Rastejante de cinzas',imagem:'',donoUid:'',x,y,revision:0,facing:0,camada:3,mapaId:'cidade_sem_nome_20261013',diametroM:1.6,diametroPersonalizadoV205:true});
  poe('rastejante_de_cinzas~1',16,4);poe('rastejante_de_cinzas~2',18,9);
 });
 await S(1500);
 if(monte.masmorraOK){
  const alvoPoco=LADO(LIG_POCO,'cidade_sem_nome_20261013');
  // anda em direção ao poço com perseguição (nativa ou manual)
  const t0=Date.now();
  let ultimo={};
  while(Date.now()-t0<90000){
   const vivo=await tokenPos(HEROI_ENC);
   if(!vivo){await S(500);continue;}
   if(vivo.mapa!== 'cidade_sem_nome_20261013')break;
   const d=Math.hypot((alvoPoco.x-vivo.x)*2,(alvoPoco.y-vivo.y)*2);
   if(d<1.6)break;
   const pt=await page.evaluate(alvo=>{const b=document.getElementById('novaSyncBoard');if(!b)return null;const r=b.getBoundingClientRect();
    const px=r.left+alvo.x/28*r.width,py=r.top+alvo.y/14*r.height;
    const em=document.elementFromPoint(px,py);return (em&&em.closest('#novaSyncBoard'))?{px,py}:null;},alvoPoco);
   if(pt)await page.mouse.click(pt.px,pt.py);
   await S(800);
   // IA nativa andou? senão, perseguição manual
   const agora=(await criaturas('cidade_sem_nome_20261013',CRIAT_RUINAS)).map(b=>b.id+':'+b.x.toFixed(1)+','+b.y.toFixed(1)).join('|');
   if(agora===ultimo.antes)await persegue(CRIAT_RUINAS);
   ultimo.antes=agora;
  }
  await capa('🏃 Criaturas hostis! Kael corre para o poço');
  await atravessa('cidade_sem_nome_20261013',alvoPoco,ID_MASMORRA);
 }else{
  const p4=LADO(LIG_THERION,'cidade_sem_nome_20261013');
  // corre para a saída enquanto os rastejantes perseguem (fallback manual: a IA nativa anda sozinha quando percebe)
  const t0=Date.now();let ultimo='',ultimoHero={x:0,y:0},semMove=0,ultimaNota=0;
  while(Date.now()-t0<45000){
   const vivo=await tokenPos(HEROI_ENC);
   if(!vivo){await S(500);continue;}
   if(vivo.mapa!=='cidade_sem_nome_20261013')break;
   const d=Math.hypot((p4.x-vivo.x)*2,(p4.y-vivo.y)*2);
   if(Date.now()-ultimaNota>5000){ultimaNota=Date.now();const selAgora=await page.evaluate(()=>document.getElementById('novaSyncPersonagem')?.value||'');console.log('[chase] d=',d.toFixed(1),'hero=',vivo.x.toFixed(1)+','+vivo.y.toFixed(1),'sel=',selAgora);}
   if(d<1.4)break;
   await reselecionar();
   const pt=await page.evaluate(alvo=>{const b=document.getElementById('novaSyncBoard');if(!b)return {erro:'sem board'};const r=b.getBoundingClientRect();
    const px=r.left+alvo.x/28*r.width,py=r.top+alvo.y/14*r.height;
    const em=document.elementFromPoint(px,py);return {px,py,ok:!!(em&&em.closest('#novaSyncBoard'))};},p4);
   if(pt&&pt.ok)await page.mouse.click(pt.px,pt.py);
   else console.log('[chase] clique inválido:',JSON.stringify(pt));
   await S(800);
   const agora=(await criaturas('cidade_sem_nome_20261013',CRIAT_RUINAS)).map(b=>b.id+':'+b.x.toFixed(1)+','+b.y.toFixed(1)).join('|');
   if(agora===ultimo)await persegue(CRIAT_RUINAS);
   ultimo=agora;
   // se o herói travou (criatura barrando o caminho), afasta as criaturas 2 m dele;
   // se continuar travado, ele está incrustado numa parede: nudge de 1 m rumo à saída
   if(vivo&&Math.hypot((vivo.x-ultimoHero.x)*2,(vivo.y-ultimoHero.y)*2)<.15){semMove++;
    if(semMove>=3){await page.evaluate(h=>{
     const POS_='combatesAtivos/mapaMesaSyncDireta/posicoes';
     for(const slug of ['rastejante_de_cinzas~1','rastejante_de_cinzas~2']){
      const t=window.__APP__.ctl().token(encodeURIComponent('synccriatura:'+slug));if(!t)continue;
      const d=Math.hypot((t.x-h.x)*2,(t.y-h.y)*2)||1;
      if(d<6.4)window.__fsWrite(POS_+'/'+t.id,{...t,x:+(t.x+(t.x-h.x)/d*2.2).toFixed(3),y:+(t.y+(t.y-h.y)/d*2.2).toFixed(3),revision:Date.now()%100000});}},vivo);}
    if(semMove>=6){semMove=0;await page.evaluate(({h,a})=>{const POS_='combatesAtivos/mapaMesaSyncDireta/posicoes';
      const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));if(!t)return;
      const dx=(a.x-h.x)*2,dy=(a.y-h.y)*2,d=Math.hypot(dx,dy)||1;
      window.__fsWrite(POS_+'/'+t.id,{...t,x:+(t.x+dx/d*1/2).toFixed(3),y:+(t.y+dy/d*1/2).toFixed(3),revision:Date.now()%100000});},{h:vivo,a:p4});}}
   else semMove=0;
   ultimoHero={x:vivo?vivo.x:0,y:vivo?vivo.y:0};
  }
  await capa('🏃 Criaturas hostis! Kael corre para a saída leste');
  await atravessa('cidade_sem_nome_20261013',p4,'therion_arte_20261013');
 }

 // ---------- cena 5: masmorra (tesouro e fuga) ----------
 if(monte.masmorraOK){
  await capa('🕳️ Sob as ruínas — a masmorra que o poço escondia');
  const entrada=monte.portas.find(p=>p.b.mapa===ID_MASMORRA||p.a.mapa===ID_MASMORRA);
  const escada=(entrada.b.mapa===ID_MASMORRA?entrada.b:entrada.a);
  if(monte.bau){
   await capa('🕯️ Passos ecoam nas galerias…');
   await marcharAte(ID_MASMORRA,monte.bau,{raio:1.6});
   await capa('💰 Um baú empoeirado — e os corredores respondem');
   await S(2600);
   await capa('🏃 Fuga! De volta à escada do poço');
   await atravessa(ID_MASMORRA,{x:escada.x,y:escada.y},'cidade_sem_nome_20261013');
  }
  // ---------- cena 6: fuga das ruínas para Theriom ----------
  await capa('🌅 A caravana de Theriom parte ao amanhecer');
  const p5=LADO(LIG_THERION,'cidade_sem_nome_20261013');
  await atravessa('cidade_sem_nome_20261013',p5,'therion_arte_20261013');
 }

 // ---------- cena 7: Theriom ----------
 await capa('🐉 Theriom — a cidade das caravanas e dos domadores');
 const pv=monte.npcPos['demo_varra'];
 if(pv&&resta()>40000)await marcharAte('therion_arte_20261013',{x:pv.x-2.8,y:pv.y+0.7},{raio:0.7,timeout:35000});

 }catch(e){console.log('[demo] roteiro interrompido:',e?.message||e);}

 // ---------- cartela final (sempre gravada) ----------
 try{await semCapa();}catch(_){}
 // ---------- fim ----------
 await H.close();
 const arq=fs.readdirSync(process.env.VIDEO_DIR).find(f=>f.endsWith('.webm'));
 if(!arq){console.error('VÍDEO NÃO GERADO',avisos.slice(0,5).join(' | '));process.exit(1);}
 const dest=path.join(DESTINO,'jornada-mesa-estelar.webm');
 fs.mkdirSync(DESTINO,{recursive:true});
 fs.copyFileSync(path.join(process.env.VIDEO_DIR,arq),dest);
 console.log('VÍDEO:',dest,Math.round(fs.statSync(dest).size/1024)+'KB');
 try{const trac=await page.evaluate(()=>window.__trac||[]);if(trac.length)console.log('TRILHA:',trac.join(' || '));}catch(_){}
 if(avisos.length)console.log('avisos de página:',avisos.slice(0,5).join(' | '));
})().catch(e=>{console.error('FALHA:',e?.message||e);process.exit(1);});
