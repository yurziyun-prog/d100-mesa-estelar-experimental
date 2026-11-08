// Probe v209: (1) a visão inclinada renderiza bem nos mapas REAIS? (2) o clique-para-andar acerta o ponto
// clicado com o mapa inclinado? (3) movimento nativo respeita colisão? Grava screenshots em <workspace>/demo-viagem/probe.
const path=require('path'),fs=require('fs');
const DESTINO=process.env.PROBE_DIR||'C:/Users/yurzi/Saved Games/projeto mapas/demo-viagem/probe';
fs.mkdirSync(DESTINO,{recursive:true});
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas,abrirExport}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));

const IDS=['v95_residencia_ilu','v145_praca_cidade_alta','v138_espacoporto','cidade_sem_nome_20261013','therion_arte_20261013'];
const HEROI_VISUAL='p=#e6b98f;r=#1f2a3a;q=#3a3d44;d=#a8844a;c=#3a1f2a;e=#a8844a;h=curto;k=#3b2a1e;m=borda;a=#8a6a3a;o=normal;x=MS;z=EP;capa=1';

(async()=>{
 const M=mapas(IDS);
 // modelos exportados (semnome_*, therion_*) dos pacotes de publicação
 const extras=[];
 for(const arq of ['arte-fonte/cidade-sem-nome/publicacao-firestore.json','arte-fonte/therion/publicacao-firestore.json']){
  for(const d of abrirExport(path.resolve(__dirname,'..',arq)))
   if(/^configuracoes\/objetoMapa_/.test(d.caminho))extras.push(d.dados);
 }
 console.log('[probe]',IDS.length,'mapas +',extras.length,'modelos de objeto');
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;const avisos=[];
 page.on('pageerror',e=>avisos.push(e.message));
 await carregarBancoDePecas(page);
 // a área do mapa ocupa a janela inteira no probe (sem CSS de demo escondendo UI)
 await page.evaluate(()=>{
  const css=document.createElement('style');
  css.textContent=`#sincronizacao-nova{position:fixed!important;inset:0!important;z-index:12000!important;background:#0a0d14}
#sincronizacao-nova .form-section{padding:0!important;margin:0!important;height:100%!important;overflow:hidden!important}
.nova-board-scroll{position:absolute!important;inset:0!important;overflow:hidden!important;padding:0!important}
#mesaPaineisForaMapa{display:none!important}`;
  document.head.append(css);
  // guarda: nenhum elemento de interface fora do tabuleiro pode cobri-lo
  setInterval(()=>{try{
   const b=document.getElementById('novaSyncBoard');
   for(const el of document.querySelectorAll('body *')){
    if(el===b||(b&&b.contains(el))||(b&&el.contains(b)))continue;
    const cs=getComputedStyle(el);if(cs.position!=='fixed'&&cs.position!=='absolute')continue;
    if(cs.display==='none'||cs.visibility==='hidden')continue;
    const r=el.getBoundingClientRect();if(r.width<4||r.height<4)continue;
    if(!el.dataset.probeHide){el.dataset.probeHide='1';el.style.setProperty('display','none','important');}
   }
  }catch(_){}},400);
 });

 await page.evaluate(async({M,extras,heroiVisual})=>{
  const A=window.__APP__;A.setMestre();
  // banco de objetos: peças do jogo + modelos exportados
  const [ia,a3,bl,pk]=await Promise.all([import('/js/mesa-pecas-dados.js'),import('/js/mesa-pecas3d-dados.js'),import('/js/mesa-pecas-blender-dados.js'),import('/js/mesa-pecas.js')]);
  const lista=[...ia.PECAS,...a3.PECAS_3D,...bl.PECAS_BLENDER].map(p=>pk.modeloDaPeca(p,location.origin+'/'));
  A.setObjetos([...lista,...extras]);
  // mapas bonitos no Firestore simulado
  for(const [id,dados] of Object.entries(M))window.__fsWrite('mapas/'+id,JSON.parse(JSON.stringify(dados)));
  await window.recarregarBancoMapas_?.();
  // herói de teste no mapa das ruínas
  window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/demo_kael',{nome:'Kael',imagem:'',donoUid:'mestre1',x:14,y:7,revision:0,facing:Math.PI/2,camada:3,mapaId:'cidade_sem_nome_20261013',diametroM:2.2,visualV203:heroiVisual});
  // sessão automática não interfere no probe
  window.__fsWrite('combatesAtivos/mesaSessaoV206',{auto:{em:'2099-01-01'}});
  await window.abrirMapaBancoNaMesa_('cidade_sem_nome_20261013');
  const sel=document.getElementById('novaSyncPersonagem');
  for(let i=0;i<60;i++){
   const t=window.__APP__.ctl().token('demo_kael');
   if(t){if(![...sel.options].some(o=>o.value===t.id)){const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);}
    if(sel.value!==t.id)sel.value=t.id;
    try{window.__APP__.ctl().refreshView();}catch(_){}
    if(String(window.__APP__.ctl().mapaAtual())==='cidade_sem_nome_20261013')break;}
   await new Promise(r=>setTimeout(r,300));}
 },{M,extras,heroiVisual:HEROI_VISUAL});
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}const l=document.getElementById('loginScreen');if(l)l.style.display='none';});
 await page.waitForSelector('#novaSyncBoard',{timeout:30000});
 await page.waitForFunction(()=>window.__APP__.ctl().token('demo_kael')&&String(window.__APP__.ctl().mapaAtual())==='cidade_sem_nome_20261013',{timeout:30000});
 await page.evaluate(()=>window.__APP__.ctl().refreshView());
 await S(2500); // cena montar + câmera assentar

 const angulo0=await page.evaluate(()=>window.mesaCameraV144?.angulo?.()??null);
 console.log('[probe] ângulo inicial da câmera:',angulo0);
 // fps real da página com o mapa pesado montado
 const fps=await page.evaluate(()=>new Promise(res=>{let n=0;const t0=performance.now();const loop=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(loop);else res(Math.round(n/3*10)/10)};requestAnimationFrame(loop);}));
 console.log('[probe] fps da página com o mapa:',fps);
 await page.screenshot({path:path.join(DESTINO,'1-inclinada-padrao.png')});
 await page.evaluate(()=>window.mesaCameraV144.inclinar(0));
 await S(900);
 await page.screenshot({path:path.join(DESTINO,'2-plana.png')});
 await page.evaluate(()=>window.mesaCameraV144.inclinar(30));
 await S(900);

 // ---- clique-para-andar com o mapa inclinado ----
 // fps DURANTE o movimento (os primeiros 3 s do andar)
 page.evaluate(()=>{window.__fpsAndando=new Promise(res=>{let n=0;const t0=performance.now();const loop=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(loop);else res(Math.round(n/3*10)/10)};requestAnimationFrame(loop);});}).catch(()=>{});
 const alvo={x:19,y:9.5}; // grade 28×14
 const clique=await page.evaluate(alvo=>{
  const b=document.getElementById('novaSyncBoard'),r=b.getBoundingClientRect();
  const px=r.left+alvo.x/28*r.width,py=r.top+alvo.y/14*r.height;
  const em=document.elementFromPoint(px,py);
  return {px,py,sobreBoard:!!(em&&em.closest('#novaSyncBoard')),tag:em?em.tagName+'#'+(em.id||'')+(em.className?'.'+String(em.className).split(' ')[0]:''):''};
 },alvo);
 console.log('[probe] clique em',JSON.stringify(alvo),'→ tela',Math.round(clique.px),Math.round(clique.py),'sobre o tabuleiro:',clique.sobreBoard,clique.tag);
 if(!clique.sobreBoard)throw new Error('ponto de clique fora do tabuleiro');
 const t0=Date.now();
 const amostras=[];
 await page.mouse.click(clique.px,clique.py);
 while(Date.now()-t0<9000){
  const p=await page.evaluate(()=>{const t=window.__APP__.ctl().tokenVisual('demo_kael');return t?{x:t.x,y:t.y}:null;});
  if(p)amostras.push({...p,ms:Date.now()-t0});
  await S(450);
  const d=await page.evaluate(alvo=>{const t=window.__APP__.ctl().tokenVisual('demo_kael');return t?Math.hypot((t.x-alvo.x)*2,(t.y-alvo.y)*2):null;},alvo);
  if(d!==null&&d<0.9)break;
 }
 const ini=amostras[0],fim=amostras.at(-1);
 const dist=(a,b)=>Math.hypot((a.x-b.x)*2,(a.y-b.y)*2);
 console.log('[probe] amostras:',amostras.length,'| ini',ini&&ini.x.toFixed(2)+','+ini.y.toFixed(2),'→ fim',fim&&fim.x.toFixed(2)+','+fim.y.toFixed(2));
 console.log('[probe] distância ao alvo: ini',ini?dist(ini,alvo).toFixed(2):'?', '→ fim',fim?dist(fim,alvo).toFixed(2):'?');
 if(amostras.length>2){let maior=0,iniV=amostras[0];for(let i=1;i<amostras.length;i++){const v=dist(amostras[i],iniV)/((amostras[i].ms-iniV.ms)/1000);if(v>maior)maior=v;}console.log('[probe] velocidade máx medida:',maior.toFixed(2),'m/s');}
 console.log('[probe] fps durante o andar:',await page.evaluate(()=>window.__fpsAndando??null));
 await page.screenshot({path:path.join(DESTINO,'3-andando-inclinado.png')});
 if(avisos.length)console.log('[probe] avisos:',avisos.slice(0,6).join(' | '));
 console.log(dist(fim,alvo)<2.2?'[probe] OK: chegou perto do alvo clicado':'[probe] ATENÇÃO: não chegou perto do alvo (colisão pode ter desviado)');
 await H.close();
})().catch(e=>{console.error('FALHA:',e);process.exit(1);});
