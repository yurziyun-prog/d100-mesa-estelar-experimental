// Diagnóstico 2: observar o que acontece no cliente quando a porta automática (v206) processa
// a viagem v138 → cidade_sem_nome. Sem cliques: escreve o "pedido" como o gatilho faria e observa.
const path=require('path');
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const {mapas}=require('./_mapas-remotos.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));
const IDS=['v138_espacoporto','cidade_sem_nome_20261013'];

(async()=>{
 const M=mapas(IDS);
 const H=await abrirApp({viewport:{width:1280,height:720}});
 const {page}=H;
 const logs=[];
 page.on('pageerror',e=>logs.push('[pageerror] '+e.message));
 page.on('console',m=>{const t=m.text();if(/Ligaç|Sync direta|cena|ERRO|Error/i.test(t))logs.push('['+m.type()+'] '+t.slice(0,250));});
 page.on('dialog',async d=>{logs.push('[dialog] '+d.type()+': '+d.message().slice(0,90));await d.accept().catch(()=>{});});
 await carregarBancoDePecas(page);
 await page.evaluate(async M=>{
  window.__APP__.setMestre();
  for(const [id,dados] of Object.entries(M))window.__fsWrite('mapas/'+id,JSON.parse(JSON.stringify(dados)));
  await window.recarregarBancoMapas_?.();
  document.getElementById('sincronizacao-nova').classList.add('active');
  const l={id:'lig_diag',a:{mapa:'v138_espacoporto',x:25.5,y:7},b:{mapa:'cidade_sem_nome_20261013',x:2.5,y:7},tipo:'porta',auto:true,portaAutoV206:true};
  window.__fsWrite('combatesAtivos/mesaLigacoes',{ligacoes:[l],atualizadoEm:Date.now(),ladosV138:true});
  window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/'+encodeURIComponent('diag_hero'),{nome:'Herói',imagem:'',donoUid:'mestre1',x:25.5,y:7,revision:0,facing:0,camada:3,mapaId:'v138_espacoporto',diametroM:2.2});
  await window.abrirMapaBancoNaMesa_('v138_espacoporto');
 },M);
 // espera o token aparecer no app
 await page.waitForFunction(()=>window.__APP__.ctl().token(encodeURIComponent('diag_hero')),{timeout:20000}).catch(()=>logs.push('[probe] token não apareceu'));
 // instrumentação de observação
 await page.evaluate(()=>{
  window.__trac=[];const tr=(m,o)=>window.__trac.push(m+(o!==undefined?' '+JSON.stringify(o):''));
  const s=document.getElementById('novaSyncMapa');
  s.addEventListener('change',()=>tr('select:change valor=',s.value),true);
  const orig=window.abrirMapaBancoNaMesa_;
  window.abrirMapaBancoNaMesa_=async function(id){tr('abrirMapaBancoNaMesa_ chamado com',id);return orig.apply(this,arguments);};
  let n=0;window.__poll=setInterval(()=>{
   const c=window.__APP__.ctl(),t=c.token(encodeURIComponent('diag_hero'));
   tr('poll '+n++,{mapa:c.mapaAtual(),hero:t?String(t.mapaId||''):'sem-token',mestre:c.mestre?.(),pend:window.mesaRascunhoMapaV193?.pendentes});
  },400);
 });
 // escreve o pedido de porta como o gatilho v206 faria
 await page.evaluate(()=>{window.__fsWrite('combatesAtivos/mesaLigacoes/acoes/sspdiag1',{donoUid:'mestre1',personagemId:encodeURIComponent('diag_hero'),nome:'Herói',ligacao:'lig_diag',de:'v138_espacoporto',criadoEm:Date.now()});});
 await S(10000);
 const out=await page.evaluate(()=>{clearInterval(window.__poll);return {trac:window.__trac,acoesRestantes:(window.__fs.keys?window.__fs.keys():[]).filter(k=>k.includes('mesaLigacoes/acoes')),mapa:String(window.__APP__.ctl().mapaAtual()||''),
  hero:(()=>{const t=window.__APP__.ctl().token(encodeURIComponent('diag_hero'));return t?{mapa:String(t.mapaId||''),x:t.x,y:t.y}:null;})()};});
 console.log('mapa final:',out.mapa,'| hero:',JSON.stringify(out.hero),'| acoes restantes:',out.acoesRestantes.length);
 console.log('--- trilha ---');out.trac.forEach(l=>console.log(l));
 console.log('--- logs ---');logs.slice(0,20).forEach(l=>console.log(l));
 await H.close();
})().catch(e=>{console.error('FALHA',e);process.exit(1);});
