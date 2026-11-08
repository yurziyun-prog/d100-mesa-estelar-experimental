// Diagnóstico: por que abrir cidade_sem_nome_20261013 na mesa não troca o mapa?
const path=require('path');
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));
const IDS=['v95_residencia_ilu','v145_praca_cidade_alta','v138_espacoporto','cidade_sem_nome_20261013','therion_arte_20261013'];

(async()=>{
 const M=mapas(IDS);
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 const logs=[];
 page.on('pageerror',e=>logs.push('[pageerror] '+e.message));
 page.on('console',m=>{const t=m.text();if(/cena|Cena|limite|grande|ERRO|Error|erro|falh/i.test(t))logs.push('['+m.type()+'] '+t.slice(0,400));});
 await carregarBancoDePecas(page);
 await page.evaluate(async M=>{
  window.__APP__.setMestre();
  for(const [id,dados] of Object.entries(M))window.__fsWrite('mapas/'+id,JSON.parse(JSON.stringify(dados)));
  await window.recarregarBancoMapas_?.();
  document.getElementById('sincronizacao-nova').classList.add('active');
 },M);
 for(const alvo of ['cidade_sem_nome_20261013','therion_arte_20261013']){
  logs.push('=== abrindo '+alvo+' ===');
  await page.evaluate(async id=>{try{await window.abrirMapaBancoNaMesa_(id);}catch(e){window.__diagErro='abrir: '+(e?.message||e);}},alvo);
  await S(6000);
  const d=await page.evaluate(id=>({mapa:String(window.__APP__.ctl().mapaAtual()||''),cena:window.__APP__.ctl().cenaAtual?.()?{mapId:String(window.__APP__.ctl().cenaAtual().mapId||''),objs:(window.__APP__.ctl().cenaAtual().objects||[]).length}:null,
   board:!!document.getElementById('novaSyncBoard'),erro:window.__diagErro||null,
   mapaDocTam:(()=>{const m=window.__fs.get('mapas/'+id);return m?Math.round(JSON.stringify(m).length/1024)+'KB':null;})()}),alvo);
  console.log(alvo,'→',JSON.stringify(d));
 }
 console.log('--- logs ---');logs.forEach(l=>console.log(l));
 await H.close();
})().catch(e=>{console.error('FALHA',e);process.exit(1);});
