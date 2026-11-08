// App real montado + Firestore falso. Regressão: ficha/visão global antigas não
// podem escolher o mapa de uma aba “Atuar como”; ela segue o token explícito.
const assert=require('node:assert/strict');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const {H,page,cid,id:house}=await montarDuelo({criatura:null});
 const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes/';
 try{
  await page.evaluate(async({cid,house,MAP,POS})=>{
   const A=window.__APP__,S=window.__fs;
   window.__kaelPos=structuredClone(S.get(POS+cid));
   S.delete(POS+cid);
   window.__fsWrite('mapas/escadaria_antiga',{nome:'Escadaria guardada',arquivadoV176:true,larguraM:28,alturaM:14});
   window.__fsWrite('mapas/destino_novo',{nome:'Destino novo',larguraM:28,alturaM:14});
   window.__fsWrite(MAP,{mapId:'escadaria_antiga',nome:'Escadaria guardada',larguraM:28,alturaM:14});
   const f=S.get('personagens/'+cid);f.localizacaoMapaId='escadaria_antiga';f.localizacaoMapaDefinidaV92=true;
   window.__fsWrite('personagens/'+cid,f);
   window.__fichaAntiga={...f,id:cid};
   A.ev('userCharacters=[window.__fichaAntiga];currentCharId=window.__fichaAntiga.id;');
   window.mesaDiretorV206_=cid;window.mesaModoJogadorV138_=true;A.setJogador('mestre1');
   A.ctl().close();A.ctl().open();
  },{cid,house,MAP,POS});
  await page.waitForFunction(()=>window.__APP__.ctl().mapaAtual()==='');
  assert.equal(await page.evaluate(p=>window.__fs.has(p),POS+cid),false,'aguardar não recria nem teleporta o personagem');
  await page.evaluate(({p,house})=>window.__fsWrite(p,{...window.__kaelPos,mapaId:house}),{p:POS+cid,house});
  await page.waitForFunction(house=>window.__APP__.ctl().mapaAtual()===house,house);
  assert.equal(await page.evaluate(cid=>!!document.querySelector('[data-token="'+cid+'"]'),cid),true);
  assert.equal(await page.evaluate(MAP=>window.__fs.get(MAP).mapId,MAP),'escadaria_antiga','não troca o mapa do mestre');
  assert.equal(await page.evaluate(cid=>window.__fs.get('personagens/'+cid).localizacaoMapaId,cid),'escadaria_antiga','não altera a ficha para corrigir a visão');
  // O mapa global em combate também não deve arrastar uma visão explícita
  // cujo ator está em outro mapa. A visão local recebe combate inativo.
  await page.evaluate(async MAP=>{
   const {iniciarIniciativa}=await import('/js/nova-turnos.js');
   window.__fsWrite(MAP,{...window.__fs.get(MAP),combat:iniciarIniciativa([{id:'outro',initiative:1,actions:2}],'outro-mapa',()=>1)});
  },MAP);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.__APP__.ctl().mapaAtual()),house);
  assert.equal(await page.evaluate(()=>window.__APP__.ctl().emCombate()),false);
  await page.evaluate(p=>window.__fsWrite(p,{...window.__fs.get(p),mapaId:'destino_novo',revision:5}),POS+cid);
  await page.waitForFunction(()=>window.__APP__.ctl().mapaAtual()==='destino_novo');
  // Para jogador comum, preservar a política existente: localização da ficha.
  await page.evaluate(MAP=>{window.mesaDiretorV206_='';window.mesaModoJogadorV138_=false;window.__fsWrite(MAP,{...window.__fs.get(MAP),combat:{active:false}});},MAP);
  await page.waitForFunction(()=>window.__APP__.ctl().mapaAtual()==='escadaria_antiga');
  console.log('PASS visão segue token atual, aguarda posição, ignora ficha/mapa global antigos, acompanha mudança e preserva jogador comum [banco falso]');
 }finally{await H.close();}
})().catch(e=>{console.error(e);process.exit(1);});
