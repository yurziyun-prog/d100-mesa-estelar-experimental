// Diagnóstico 5: reproduzir a cena da perseguição isoladamente e inspecionar o estado do jogo.
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const M=mapas(['cidade_sem_nome_20261013']);
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 const logs=[];
 page.on('console',m=>{const t=m.text();if(/Tempo real|Sync direta|ERRO|Error/i.test(t))logs.push(t.slice(0,150));});
 await carregarBancoDePecas(page);
 await page.evaluate(async M=>{
  window.__APP__.setMestre();
  window.__fsWrite('mapas/cidade_sem_nome_20261013',JSON.parse(JSON.stringify(M['cidade_sem_nome_20261013'])));
  await window.recarregarBancoMapas_?.();
  document.getElementById('sincronizacao-nova').classList.add('active');
  window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:false,continuoV214:false,pausado:true,pausaEmergencia:true,mapaId:''});
  setInterval(()=>{try{const R=window.mesaRascunhoMapaV193;if(R&&R.pendentes>0)R.descartar();}catch(_){}},800);
  const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
  window.__fsWrite(POS+'/'+encodeURIComponent('demo_kael'),{nome:'Kael',imagem:'',donoUid:'mestre1',x:11.8,y:7.6,revision:0,facing:0,camada:3,mapaId:'cidade_sem_nome_20261013',diametroM:2.2});
  window.__fsWrite(POS+'/'+encodeURIComponent('synccriatura:rastejante_de_cinzas~1'),{nome:'Rastejante',imagem:'',donoUid:'',x:16,y:4,revision:0,facing:0,camada:3,mapaId:'cidade_sem_nome_20261013',diametroM:1.6,diametroPersonalizadoV205:true});
  await window.abrirMapaBancoNaMesa_('cidade_sem_nome_20261013');
  await new Promise(r=>setTimeout(r,3000));
  const sel=document.getElementById('novaSyncPersonagem');
  const t=window.__APP__.ctl().token(encodeURIComponent('demo_kael'));
  if(t){const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);sel.value=t.id;sel.dispatchEvent(new Event('change',{bubbles:true}));}
 },M);
 await page.waitForFunction(()=>window.__APP__.ctl().mapaAtual()==='cidade_sem_nome_20261013',{timeout:20000});
 // clica 10× a leste e observa
 for(let i=0;i<9;i++){
  const pt=await page.evaluate(k=>{const b=document.getElementById('novaSyncBoard');if(!b)return null;const r=b.getBoundingClientRect();const i=k;
   const px=r.left+(11.8+(i%2?1.5:-1.5))/28*r.width,py=r.top+(7.6+(i%3-1)*1.5)/14*r.height;const em=document.elementFromPoint(px,py);
   return (em&&em.closest('#novaSyncBoard'))?{px,py}:null;},i);
  if(pt)await page.mouse.click(pt.px,pt.py);
  await S(900);
  const st=await page.evaluate(()=>{
   const c=window.__APP__.ctl(),t=c.token(encodeURIComponent('demo_kael'));
   const rt=window.__fs.get('combatesAtivos/mesaTempoReal');
   const mapa=window.__fs.get('combatesAtivos/mapaMesaSyncDireta');
   return {hero:t?{x:+t.x.toFixed(2),y:+t.y.toFixed(2)}:null,emCombate:c.emCombate?.(),rtAtivo:!!rt?.ativo,continuo:!!rt?.continuoV214,mapaCombat:!!mapa?.combat?.active,
    sel:document.getElementById('novaSyncPersonagem')?.value};});
  console.log(i,JSON.stringify(st),'status=',JSON.stringify(await page.evaluate(()=>document.getElementById('novaSyncStatus')?.textContent||'')));
 }
 console.log('--- logs página ---');logs.slice(0,8).forEach(l=>console.log(l));
 await H.close();
})().catch(e=>{console.error('FALHA',e);process.exit(1);});
