// Analisa: rota completa computada + objetos bloqueantes perto do ponto de travamento (32,38.3)m.
const path=require('path');
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas,abrirExport}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const M=mapas(['cidade_sem_nome_20261013']);
 const extras=[];
 for(const d of abrirExport(path.resolve(__dirname,'..','arte-fonte/cidade-sem-nome/publicacao-firestore.json')))
  if(/^configuracoes\/objetoMapa_/.test(d.caminho))extras.push(d.dados);
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 await carregarBancoDePecas(page);
 await page.evaluate(()=>{
  const css=document.createElement('style');
  css.textContent=`#sincronizacao-nova{position:fixed!important;inset:0!important;z-index:12000!important;background:#0a0d14}
#sincronizacao-nova .form-section{padding:0!important;margin:0!important;height:100%!important;overflow:hidden!important}
.nova-board-scroll{position:absolute!important;inset:0!important;overflow:hidden!important;padding:0!important}`;
  document.head.append(css);
 });
 await page.evaluate(async({M,extras})=>{
  const A=window.__APP__;A.setMestre();
  const [ia,a3,bl,pk]=await Promise.all([import('/js/mesa-pecas-dados.js'),import('/js/mesa-pecas3d-dados.js'),import('/js/mesa-pecas-blender-dados.js'),import('/js/mesa-pecas.js')]);
  const lista=[...ia.PECAS,...a3.PECAS_3D,...bl.PECAS_BLENDER].map(p=>pk.modeloDaPeca(p,location.origin+'/'));
  A.setObjetos([...lista,...extras]);
  window.__fsWrite('mapas/cidade_sem_nome_20261013',JSON.parse(JSON.stringify(M['cidade_sem_nome_20261013'])));
  await window.recarregarBancoMapas_?.();
  window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/demo_kael',{nome:'Kael',imagem:'',donoUid:'mestre1',x:14,y:7,revision:0,facing:0,camada:3,mapaId:'cidade_sem_nome_20261013',diametroM:2.2,visualV203:'p=#e6b98f;r=#1f2a3a;q=#3a3d44;d=#a8844a;c=#3a1f2a;e=#a8844a;h=curto;k=#3b2a1e;m=borda;a=#8a6a3a;o=normal;x=MS;z=EP;capa=1'});
  window.__fsWrite('combatesAtivos/mesaSessaoV206',{auto:{em:'2099-01-01'}});
  await window.abrirMapaBancoNaMesa_('cidade_sem_nome_20261013');
 },{M,extras});
 await page.waitForSelector('#novaSyncBoard',{state:'attached',timeout:30000});
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}const l=document.getElementById('loginScreen');if(l)l.style.display='none';});
 await page.waitForFunction(()=>window.__APP__.ctl().token('demo_kael')&&String(window.__APP__.ctl().mapaAtual())==='cidade_sem_nome_20261013',{timeout:30000});
 await page.evaluate(()=>{const sel=document.getElementById('novaSyncPersonagem');const t=window.__APP__.ctl().token('demo_kael');const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);sel.value=t.id;window.__APP__.ctl().refreshView();});
 await S(2500);
 const r=await page.evaluate(async()=>{
  // replica computarRota com os mesmos dados da cena carregada
  const {montarGrade,caminho}=await import('/js/mesa-tempo-real-ia.js?v=133');
  const {raioParaObjetos}=await import('/js/nova-colisao.js?v=120');
  const A=window.__APP__;
  const mapa=A.ctl().mapaAtual();
  const cena=await new Promise(res=>{const db=window.__db;res(null);});
  // cena: ler do Firestore simulado como o jogo faz
  const scene=window.__fs?await window.__fs.get('combatesAtivos/mapaMesaSyncCena_'+mapa):null;
  const sceneData=scene||await window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');
  const objs=(sceneData?.objects||[]).filter(o=>o&&o.bloqueiaMovimento&&!o.destruido);
  const t={x:14,y:7,id:'demo_kael',diametroM:2.2};
  const destino28={x:19,y:9.5},w=56,hh=56;
  const raio=Math.max(.3,raioParaObjetos(t));
  const grade=montarGrade(objs.map(o=>({x:Number(o.x)*w/28,y:Number(o.y)*hh/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),w,hh,{passo:1,raio});
  const M=p=>({x:Number(p.x)*w/28,y:Number(p.y)*hh/14});
  const pts=caminho(grade,M(t),M(destino28))||[];
  const rota=pts.map(p=>({x:+(p.x*28/w).toFixed(2),y:+(p.y*14/hh).toFixed(2)}));
  // raio real do token completo na página
  const col=await import('/js/nova-colisao.js?v=120');const rec=await import('/js/nova-recuperacao.js?v=196');
  const real=window.__APP__.ctl().token('demo_kael');
  const raioReal=+(col.raioParaObjetos(real)||0).toFixed(3),raioCorpo=+(col.raioCorpoM(real)||0).toFixed(3),diamMini=+(rec.diametroMiniatura(real)||0).toFixed(3);
  // simula o segmento start→primeiro waypoint em passos de 0,15 m com a colisão REAL
  let cur={x:real.x,y:real.y},travou=null;
  const fim=rota.length?{x:rota[0].x,y:rota[0].y}:destino28;
  for(let k=0;k<400;k++){
   const d=Math.hypot((fim.x-cur.x)*w/28,(fim.y-cur.y)*hh/14);
   if(d<.1)break;
   const ratio=Math.min(1,.15/d);
   const want={x:cur.x+(fim.x-cur.x)*ratio,y:cur.y+(fim.y-cur.y)*ratio};
   const dest=col.destinoSemColisao(cur,want,[],{larguraM:w,alturaM:hh},objs);
   const avancou=Math.hypot((dest.x-cur.x)*w/28,(dest.y-cur.y)*hh/14);
   if(avancou<.01){travou={x:+(cur.x*w/28).toFixed(1),y:+(cur.y*hh/14).toFixed(1)};break;}
   cur=dest;
  }
  return {rota,raioReal,raioCorpo,diamMini,travou,nObjs:objs.length};
 });
 console.log(JSON.stringify(r,null,1));
 await H.close();
})().catch(e=>{console.error('FALHA:',e);process.exit(1);});
