// Sonda: por que a porta automática não dispara na demo?
const path=require('path');
const DESTINO='C:/Users/yurzi/Saved Games/projeto mapas/demo-viagem';
process.env.VIDEO_DIR=path.join(DESTINO,'_gravacao');
const fs=require('fs');fs.rmSync(process.env.VIDEO_DIR,{recursive:true,force:true});fs.mkdirSync(process.env.VIDEO_DIR,{recursive:true});
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));
const HEROI_VISUAL='p=#e6b98f;r=#1f2a3a;q=#3a3d44;d=#a8844a;c=#3a1f2a;e=#a8844a;h=curto;k=#3b2a1e;m=borda;a=#8a6a3a;o=normal;x=MS;z=EP;capa=1';
(async()=>{
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 page.on('console',m=>{if(/Ligações|Sessão/.test(m.text()))console.log('[página]',m.text().slice(0,220));});
 await carregarBancoDePecas(page);
 await page.evaluate(async()=>{
  const A=window.__APP__;A.setMestre();
  const G=await import('/js/mesa-gerador-mapas.js?v=141');
  const U=await import('/js/mesa-mapas-ui.js?v=141');
  const objetos=window.mesaMapasV110_.objetos();
  for(const m of [{id:'demo_palacio',nome:'Palácio',tipo:'interior',estilo:'feudal',w:36,h:18,sem:1101},{id:'demo_cidade',nome:'Cidade',tipo:'cidade',estilo:'retro',w:42,h:21,sem:2202}]){
   const st=G.gerarMapa({tipo:m.tipo,largura:m.w,altura:m.h,semente:m.sem,objetos,nome:m.nome,estilo:m.estilo});
   await window.mesaMapasV110_.salvar({id:m.id,nome:m.nome,state:st,cenaDe:mid=>U.cenaDoEstado(st,mid)});
  }
  window.__fsWrite('combatesAtivos/mesaLigacoes',{ligacoes:[{id:'lig_pc',a:{mapa:'demo_palacio',x:26,y:7},b:{mapa:'demo_cidade',x:1.5,y:7},tipo:'porta',auto:true,portaAutoV206:true}],atualizadoEm:Date.now(),ladosV138:true});
  window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/demo_kael',{nome:'Kael',imagem:'',donoUid:'mestre1',x:5,y:9,revision:0,facing:0,camada:3,mapaId:'demo_palacio',diametroM:1,visualV203:'p=#e6b98f;r=#1f2a3a;q=#3a3d44;d=#a8844a;c=#3a1f2a;e=#a8844a;h=curto;k=#3b2a1e;m=borda;a=#8a6a3a;o=normal;x=MS;z=EP;capa=1'});
  window.__fsWrite('combatesAtivos/mesaSessaoV206',{auto:{em:'2099-01-01'}});
  await window.abrirMapaBancoNaMesa_('demo_palacio');
  const sel=document.getElementById('novaSyncPersonagem');
  const marca=()=>{const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));if(!t)return false;
   if(sel&&![...sel.options].some(o=>o.value===t.id)){const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);}
   if(sel)sel.value=t.id;return true;};
  for(let i=0;i<50&&!marca();i++)await new Promise(r=>setTimeout(r,200));
 });
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}const l=document.getElementById('loginScreen');if(l)l.style.display='none';});
 await page.waitForSelector('#novaSyncBoard',{state:'attached',timeout:30000});
 await S(2500);
 // move o herói para perto da porta em passos
 for(let x=5;x<=33;x+=0.8){
  await page.evaluate(x=>{const p='combatesAtivos/mapaMesaSyncDireta/posicoes/demo_kael';const d=window.__fs.get(p);
   window.__fsWrite(p,{...d,x:+x.toFixed(2),revision:(d.revision||0)+1});},x);
  await S(120);
 }
 await S(2500);
 const diag=await page.evaluate(()=>{
  const c=window.__APP__.ctl();
  const sel=document.getElementById('novaSyncPersonagem');
  const t=c.token(encodeURIComponent('demo_kael'));
  const ligs=(window.mesaLigacoes&&window.mesaLigacoes.ligacoes)?window.mesaLigacoes.ligacoes():null;
  const acoes=[...window.__fs.keys()].filter(k=>k.startsWith('combatesAtivos/mesaLigacoes/acoes'));
  // replica os portões do vigia v206, um a um
  const portas={};
  try{portas.modoMestre=!!c.mestre?.();}catch(e){portas.modoMestre='err '+e.message;}
  try{portas.emCombate=!!c.emCombate?.();}catch(e){portas.emCombate='err '+e.message;}
  try{portas.ator=!!c.ator?.();}catch(e){portas.ator='err '+e.message;}
  try{portas.controla=c.ator?.()?!!c.controla?.(c.ator()):'sem ator';}catch(e){portas.controla='err '+e.message;}
  try{const a=c.ator?.();portas.dono=a?String(a.donoUid||''):'-';}catch(e){portas.dono='err';}
  try{portas.uid=String(window.__APP__&&'mestre1');}catch(e){}
  try{const l=(ligs||[]).filter(l=>l.portaAutoV206);portas.ligsAuto=l.map(x=>x.id);
   const mapa=String(c.mapaAtual?.()||'');
   for(const x of l){const p=String(x.a?.mapa)===mapa?x.a:String(x.b?.mapa)===mapa?x.b:null;
    if(p){const m=(window.mesaMapasV110_.mapas()||[]).find(m=>String(m.id)===mapa),W=Number(m?.larguraM)||28,H=Number(m?.alturaM)||14;
     const a=c.ator?.();if(a)portas['d_'+x.id]=+ (Math.hypot((Number(a.x)-Number(p.x))*W/28,(Number(a.y)-Number(p.y))*H/14)-(Number(a.diametroM)||1)/2).toFixed(2);}}}catch(e){portas.dist='err '+e.message;}
  return {sel:sel?sel.value:null,
   ator:(()=>{const a=c.ator();return a?{id:a.id,x:a.x,y:a.y,mapa:a.mapaId,dono:a.donoUid}:null;})(),
   token:t?{id:t.id,x:t.x,y:t.y,mapa:t.mapaId,rev:t.revision}:null,mapaAtual:c.mapaAtual(),acoes,portas,
   sessao:!!window.mesaSessaoV206,ligaMod:!!window.mesaLigacoes};
 });
 console.log(JSON.stringify(diag,null,1));
 await H.close();
})().catch(e=>{console.error('FALHA:',e);process.exit(1);});
