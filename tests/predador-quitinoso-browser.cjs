// App e renderizador reais; banco e papéis simulados. Não grava a campanha.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const especie=process.env.ESPECIE||'insetoide_predador_1',cinzas=especie==='rastejante_de_cinzas';
 const D=await montarDuelo({criatura:especie,dist:2.6});const {H,page,criaturaId}=D;
 try{
  await page.evaluate(({cid,criaturaId,especie})=>{
   window.__APP__.setMestre();window.mesaVida?.parar?.();
   window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:true,continuoV214:true,pausado:true,pausaEmergencia:true,mapId:'mapa_real'});
   const k='combatesAtivos/mapaMesaSyncDireta/posicoes/'+criaturaId,v=window.__fs.get(k);
   // Uma miniatura salva com a aparência anterior usa automaticamente o atlas novo.
   window.__fsWrite(k,{...v,nome:'Predador Quitinoso',arte3dV200:'cima_'+especie,arte3dAjusteV203:'',diametroM:1.3});
  },{cid:D.cid,criaturaId,especie});
  const token=page.locator('[data-token="'+criaturaId+'"]'),art=token.locator(':scope > .a3d');
  await art.waitFor();await page.waitForFunction(id=>document.querySelector('[data-token="'+id+'"] .a3d')?.dataset.u?.includes('parado_lado.webp'),criaturaId);
  const info=await token.evaluate(n=>({a:n.dataset.arte3d,bg:getComputedStyle(n).backgroundColor,shadow:getComputedStyle(n).boxShadow,w:parseFloat(n.querySelector('.a3d').style.width),ppm:document.getElementById('novaSyncBoard').offsetWidth/28}));
  assert.equal(info.a,'cima_'+especie);assert.equal(info.bg,'rgba(0, 0, 0, 0)');assert.equal(info.shadow,'none');const fis=await page.evaluate(async key=>(await import('/js/mesa-escala-fisica.js')).ESCALA_FISICA[key],'cima_'+especie);assert.ok(Math.abs(info.w/info.ppm-fis.metros)<.02,'escala de metros, não tamanho do token');
  const root=path.resolve(__dirname,'..'),dir=path.join(root,cinzas?'docs/rastejante-cinzas':'docs/predador-quitinoso');fs.mkdirSync(dir,{recursive:true});
  await page.locator('#novaSyncBoard').screenshot({path:path.join(dir,'no-mapa.png')});
  const actions=new Set();
  for(let i=0;i<8;i++){
   await page.evaluate(({id,i})=>{const k='combatesAtivos/mapaMesaSyncDireta/posicoes/'+id,v=window.__fs.get(k);window.__fsWrite(k,{...v,x:v.x+.08,revision:(v.revision||0)+1});},{id:criaturaId,i});
   await page.waitForTimeout(110);actions.add(await art.getAttribute('data-acao'));
  }
  assert.ok(actions.has('andar'),'posição lógica aciona caminhada');
  const indices=new Set();for(let i=0;i<6;i++){indices.add(await art.getAttribute('data-quadro'));await page.waitForTimeout(55);}assert.ok(indices.size>2,'quadros animados avançam');
  await token.evaluate(n=>{n.style.setProperty('--gdx','-1');n.style.setProperty('--gdy','0');n.classList.add('ef-golpe');});
  await page.waitForFunction(id=>document.querySelector('[data-token="'+id+'"] .a3d')?.dataset.acao==='atacar',criaturaId);
  await page.waitForTimeout(360);await page.locator('#novaSyncBoard').screenshot({path:path.join(dir,'ataque-no-mapa.png')});
  await token.evaluate(n=>n.classList.remove('ef-golpe'));await page.waitForTimeout(1000);
  await token.evaluate(n=>n.classList.add('ef-impacto'));
  await page.waitForFunction(id=>document.querySelector('[data-token="'+id+'"] .a3d')?.dataset.acao==='golpe',criaturaId);
  await token.evaluate(n=>n.classList.remove('ef-impacto'));
  await page.evaluate(id=>{const k='combatesAtivos/mapaMesaSyncSaude',v=window.__fs.get(k)||{};window.__fsWrite(k,{...v,actors:{...v.actors,[id]:{combateLab:{morto:true}}}});},criaturaId);
  await page.waitForFunction(id=>document.querySelector('[data-token="'+id+'"] .a3d')?.dataset.acao==='morrer',criaturaId);
  await page.waitForTimeout(1400);assert.equal(await art.getAttribute('data-quadro'),'13','queda termina no quadro final');
  for(const width of [1280,390]){await page.setViewportSize({width,height:800});await page.waitForTimeout(150);assert.ok(await art.isVisible());}
  const errors=D.erros.filter(s=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(s));assert.deepEqual(errors,[]);
  console.log('PASS predador: miniatura salva recebe nova arte; escala física; sem aura; andar, ataque, golpe e morte; 1280/390 [banco simulado]');
 }finally{await H.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
