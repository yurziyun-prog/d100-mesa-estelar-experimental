// v219 — casa por dentro: um personagem chega perto da porta, o mapa troca para o interior,
// e ao sair pela porta de dentro ele volta para o mapa de fora. Sem clique manual.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {abrirApp,carregarBancoDePecas}=require('./_harness-app.cjs');
const S=ms=>new Promise(r=>setTimeout(r,ms));
const DEST=path.resolve(__dirname,'..','_shots','v219-casa');
fs.mkdirSync(DEST,{recursive:true});
const EXT='casa_teste_v219',INT='casa_teste_v219_interior';

(async()=>{
 const H=await abrirApp({viewport:{width:1280,height:720}});const {page}=H;const erros=[];
 page.on('pageerror',e=>erros.push('PAGEERR '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))erros.push('CONSOLE '+m.text().slice(0,180));});
 await carregarBancoDePecas(page);
 await page.evaluate(async ({EXT,INT})=>{
  const A=window.__APP__;A.setMestre();
  window.__fsWrite('mapas/'+EXT,{id:EXT,nome:'Casa de teste (fora)',larguraM:28,alturaM:14,fundo:'',pxPorMetro:48});
  window.__fsWrite('mapas/'+INT,{id:INT,nome:'Casa de teste (por dentro)',larguraM:10,alturaM:8,fundo:'',pxPorMetro:48});
  window.__fsWrite('combatesAtivos/mapaMesaSyncCena_'+EXT,{mapId:EXT,objects:[]});
  window.__fsWrite('combatesAtivos/mapaMesaSyncCena_'+INT,{mapId:INT,objects:[]});
  window.__fsWrite('combatesAtivos/mesaLigacoes',{ligacoes:[{id:'ligCasaTeste',a:{mapa:EXT,x:14,y:12},b:{mapa:INT,x:5,y:7},tipo:'porta',interiorV164:true}],atualizadoEm:Date.now()});
  await window.recarregarBancoMapas_?.();
  window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/demo_kael',{nome:'Kael',imagem:'',donoUid:'mestre1',x:14,y:12.5,revision:0,facing:0,camada:3,mapaId:EXT,diametroM:2.2});
  await window.abrirMapaBancoNaMesa_?.(EXT);
  const p=document.getElementById('sincronizacao-nova');p.classList.add('active');
  for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}
  const l=document.getElementById('loginScreen');if(l)l.style.display='none';
 },{EXT,INT});
 await page.waitForSelector('#novaSyncBoard');await page.waitForFunction(()=>window.__APP__.ctl().token('demo_kael'));
 await page.waitForFunction(()=>window.mesaLigacoes?.ligacoes?.().some(l=>l.id==='ligCasaTeste'),{timeout:15000});
 await page.evaluate(()=>{const sel=document.getElementById('novaSyncPersonagem'),t=window.__APP__.ctl().token('demo_kael');if(t&&sel){const op=document.createElement('option');op.value=t.id;op.textContent=t.nome;sel.append(op);sel.value=t.id;sel.dispatchEvent(new Event('change',{bubbles:true}));}});
 await S(2500);
 const ini=await page.evaluate(()=>window.__APP__.ctl().token('demo_kael')?.mapaId);
 // anda um passo para marcar "movimento" e disparar a entrada automática
 await page.keyboard.down('KeyW');await S(350);await page.keyboard.up('KeyW');
 await page.waitForFunction(m=>window.__APP__.ctl().mapaAtual()===m,INT,{timeout:15000}).catch(()=>{});
 await S(1500);
 let dentro=await page.evaluate(()=>({mapa:window.__APP__.ctl().mapaAtual(),t:window.__APP__.ctl().token('demo_kael')?.mapaId}));
 console.log('entrada',JSON.stringify({ini,dentro}));
 assert.equal(ini,EXT,'começa fora');
 assert.equal(dentro.mapa,INT,'perto da porta, a mesa abre o interior');
 assert.equal(dentro.t,INT,'o personagem passa para o mapa interno');
 await page.screenshot({path:path.join(DEST,'dentro.png')});

 // afasta da porta para rearmar, espera e volta para a porta de dentro
 const pos=()=>page.evaluate(()=>{const c=window.__APP__.ctl(),t=c.token('demo_kael');return {x:t?.x,y:t?.y,mapa:c.mapaAtual(),ator:c.ator?.()?.id||'',sel:document.getElementById('novaSyncPersonagem')?.value};});
 console.log('antes de afastar',JSON.stringify(await pos()));
 await page.keyboard.down('KeyW');await S(900);await page.keyboard.up('KeyW');
 console.log('depois de afastar',JSON.stringify(await pos()));
 await S(3200);
 await page.keyboard.down('KeyS');await S(1200);await page.keyboard.up('KeyS');
 console.log('depois de voltar',JSON.stringify(await pos()));
 await page.waitForFunction(m=>window.__APP__.ctl().mapaAtual()===m,EXT,{timeout:15000}).catch(()=>{});
 await S(3000);
 const fora=await page.evaluate(()=>({mapa:window.__APP__.ctl().mapaAtual(),t:window.__APP__.ctl().token('demo_kael')?.mapaId}));
 console.log('saída',JSON.stringify(fora));
 assert.equal(fora.mapa,EXT,'ao sair pela porta, volta para o mapa de fora');
 assert.equal(fora.t,EXT,'o personagem volta para o mapa externo');
 assert.deepEqual(erros,[],'sem erros de página');
 console.log('OK v219: casa por dentro automática');
 await H.close();
})().catch(e=>{console.error('FALHA v219:',e);process.exit(1);});
