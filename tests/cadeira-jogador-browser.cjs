// UI do jogador e processador de objetos separado, ambos em banco falso.
const assert=require('node:assert/strict');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const {H,page,cid,id}=await montarDuelo({criatura:null});
 try{
  await page.evaluate(async({cid,id})=>{
   const A=window.__APP__,S=window.__fs,p=S.get('combatesAtivos/mapaMesaSyncDireta/posicoes/'+cid);
   window.__fsWrite('combatesAtivos/mapaMesaSyncDiretaCena',{mapId:id,objects:[{id:'cadeira_teste',nome:'Cadeira',interativo:'assento',x:p.x+.6,y:p.y,larguraM:.8,alturaM:.8,camada:3,bloqueiaMovimento:false}]});
   window.__fsWrite('combatesAtivos/mesaRelogio',{ativo:false,tempo:0,baseReal:Date.now(),fator:24});
   const {instalarObjetos}=await import('/js/mesa-objetos.js');const levantar=window.mesaLevantarAoAndarV205;
   // Documento sem mapa visível: só o processador simulado de autoridade usa este módulo.
   window.__autoridadeObjetos=instalarObjetos({root:document.implementation.createHTMLDocument('Autoridade'),db:A.ev('db'),
    doc:A.ev('doc'),setDoc:A.ev('setDoc'),deleteDoc:A.ev('deleteDoc'),onSnapshot:A.ev('onSnapshot'),collection:A.ev('collection'),runTransaction:A.ev('runTransaction'),
    ehMestre:()=>true,uid:()=> 'autoridade-simulada',controller:()=>A.ctl(),api:()=>window.mesaObjetosV124_});
   window.mesaLevantarAoAndarV205=levantar;
   A.setJogador('mestre1');window.mesaDiretorV206_=cid;A.ev('currentCharId='+JSON.stringify(cid));
   const c=A.ctl();c.close();c.open();
   const panel=document.getElementById('sincronizacao-nova');panel.classList.add('active');
   for(let n=panel;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}
  },{cid,id});
  await page.waitForFunction(cid=>window.__APP__.ctl().ator()?.id===cid,cid);
  // Aguardar assinatura do papel jogador, não tratar o mestre como jogador.
  await page.waitForTimeout(900);
  await page.evaluate(()=>window.mesaObjetos.abrir('cadeira_teste'));
  await page.waitForSelector('#moBalao [data-deitar]');
  assert.equal(await page.locator('#moBalao [data-tipo]').count(),0);
  assert.equal(await page.locator('#moBalao [data-trancar]').count(),0);
  assert.equal(await page.locator('#moBalao [data-arrastar]').count(),0);
  assert.match(await page.locator('#moBalao').textContent(),/relógio do jogo está parado/);
  await page.evaluate(()=>window.__fsWrite('combatesAtivos/mesaRelogio',{ativo:true,tempo:0,baseReal:Date.now(),fator:24}));
  await page.waitForFunction(()=>!document.getElementById('moBalao').textContent.includes('relógio do jogo está parado'));
  await page.locator('#moBalao [data-deitar]').click();
  await page.waitForFunction(cid=>window.mesaRepouso?.emRepouso(cid)?.tipo==='sentado',cid);
  await page.waitForFunction(()=>!document.querySelector('#moBalao [data-deitar]'));
  assert.doesNotMatch(await page.locator('#moBalao').textContent(),/Pedido enviado/);
  assert.equal(await page.locator('#moBalao [data-levantar]').count(),0,'não exige botão para levantar');
  const pos0=await page.evaluate(cid=>window.__APP__.ctl().token(cid).x,cid);
  await page.evaluate(()=>window.__APP__.ctl().andarDirecao(1,0));
  await page.waitForFunction(cid=>!window.mesaRepouso?.emRepouso(cid),cid);
  await page.waitForFunction(({cid,x})=>window.__APP__.ctl().token(cid).x>x+.05,{cid,x:pos0});
  await page.evaluate(()=>window.__APP__.ctl().pararAndar());
  const old=await page.evaluate(()=>[...window.__fs].find(([p,v])=>p.startsWith('combatesAtivos/mesaObjetos/acoes/')&&v.status==='done')?.[0]);
  assert.ok(old,'há uma confirmação interna de conclusão');
  await page.evaluate(p=>window.__fsWrite(p,{...window.__fs.get(p),concluidoEm:1}),old);
  await page.waitForFunction(p=>!window.__fs.has(p),old);
  assert.equal(await page.evaluate(cid=>!!window.mesaRepouso?.emRepouso(cid),cid),false,'limpeza não reaplica sentar');
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:844});
   await page.evaluate(()=>window.mesaObjetos.abrir('cadeira_teste'));
   const box=await page.locator('#moBalao').boundingBox();
   assert.ok(box&&box.x>=-1&&box.x+box.width<=width+1,'balão cabe na tela de '+width+' px: '+JSON.stringify(box));
  }
  console.log('PASS jogador: só ações úteis, relógio condicional, sentar sem aviso técnico e levantar ao caminhar [autoridade separada simulada]');
 }finally{await H.close();}
})().catch(e=>{console.error(e);process.exit(1);});
