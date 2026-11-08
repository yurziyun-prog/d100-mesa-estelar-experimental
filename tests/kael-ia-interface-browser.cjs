// App, ficha e resolvedor reais; Firestore/autenticação simulados.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const D=await montarDuelo({criatura:'rastejante_de_cinzas',arma:'espada_forca',dist:4});const {page,cid,criaturaId}=D;
 try{
  await page.evaluate(({cid,criaturaId})=>{
   const A=window.__APP__,e=A.ev;A.setMestre();window.mesaVida?.parar?.();
   window.__cid=cid;
   e(`(()=>{const c=window.__fs.get('personagens/'+window.__cid);for(const [list,key] of [[periciasDB,'pericias'],[especializacoesDB,'especializacoes']]){c[key]={};for(const p of list)c[key][p.id]={investimentos:{xp:50-calcularFormulaPersonagem_(p.formula,c)}};}const p=itensDB.find(i=>i.id==='pistola_laser');c.inventario.equipado[2]={...p,instanciaId:'pistola_teste'};c.inventario.equipado[3]={...itensDB.find(i=>i.id==='armadura_leve'),instanciaId:'armadura_teste'};window.__fsWrite('personagens/'+window.__cid,c);})()`);
   const key='combatesAtivos/mapaMesaSyncDireta/posicoes/'+criaturaId,v=window.__fs.get(key);
   window.__fsWrite(key,{...v,atitudeV200:'sanguinaria',donoUid:'',arte3dV200:'cima_rastejante_de_cinzas'});
   window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:true,continuoV214:true,mapId:'mapa_real',auto:{[criaturaId]:false}});
  },{cid,criaturaId});
  await page.waitForFunction(cid=>[...document.getElementById('novaSyncPersonagem').options].some(o=>o.value===cid),cid);
  await page.evaluate(cid=>{const s=document.getElementById('novaSyncPersonagem');s.value=cid;s.dispatchEvent(new Event('change',{bubbles:true}));},cid);
  await page.waitForFunction(()=>window.__APP__.ctl().acoes().estado().sheet?.skills?.some(s=>s.weapons?.some(w=>/Espada de Força/.test(w.nome))));
  const values=await page.evaluate(()=>window.__APP__.ctl().acoes().estado().sheet.skills.filter(s=>s.weapons.some(w=>/Espada de Força/.test(w.nome))).map(s=>({id:s.id,base:s.base,valor:s.valor,weapons:s.weapons})));
  assert.ok(values.length);for(const v of values){assert.equal(v.base,50,'base de combate é a mesma ficha 50');assert.equal(v.valor,45,'armadura leve aplica os 10% documentados');assert.ok(v.weapons.every(w=>w.calculo.includes('base 50')),'cada arma explica os redutores');}
  const pick=await page.evaluate(()=>{const ss=window.__APP__.ctl().acoes().estado().sheet.skills;return {sword:ss.flatMap(s=>s.weapons.map(w=>({skillId:s.id,...w}))).find(w=>/Espada de Força/.test(w.nome)),gun:ss.flatMap(s=>s.weapons.map(w=>({skillId:s.id,...w}))).find(w=>/pistola.*laser/i.test(w.nome))};});
  for(const [weapon,yes,no] of [[pick.sword,'EN','PG'],[pick.gun,'P','EG']]){
   assert.ok(weapon,'Arma não localizada: '+JSON.stringify(pick)+' | '+JSON.stringify(await page.evaluate(cid=>window.__fs.get('personagens/'+cid).inventario.equipado,cid)));await page.evaluate(w=>window.__APP__.ctl().acoes().escolher(w.skillId,w.id),weapon);
   await page.waitForFunction(({cid,id,yes,no})=>{const t=window.__APP__.ctl().token(cid);return t?.activeWeaponId===id&&[...yes].every(c=>t.visualV203?.includes(c))&&![...no].some(c=>/z=([^;]*)/.exec(t.visualV203||'')?.[1]?.includes(c));},{cid,id:weapon.id,yes,no});
  }
  await page.evaluate(()=>{const el=document.createElement('div');el.id='painelNovoRegressao';el.dataset.mapaPainel='permanente';el.textContent='Novo painel permanente';el.style.cssText='position:absolute;inset:0';document.getElementById('novaSyncBoard').append(el);});
  await page.waitForFunction(()=>document.getElementById('painelNovoRegressao')?.parentElement?.id==='mesaPaineisForaMapa');
  // Painéis permanentes ficam completamente abaixo do mapa, inclusive no celular.
  for(const width of [1280,390]){await page.setViewportSize({width,height:850});await page.waitForTimeout(650);
   const bad=await page.evaluate(()=>{const map=document.getElementById('novaSyncBoard').getBoundingClientRect();return [...document.querySelectorAll('[data-mapa-painel="permanente-fora"]')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.height&&r.left<map.right&&r.right>map.left&&r.top<map.bottom&&r.bottom>map.top;}).map(n=>n.id);});assert.deepEqual(bad,[]);
   assert.equal(await page.locator('#rtModos').count(),1);
  }
  const start=await page.evaluate(id=>window.__APP__.ctl().token(id).x,criaturaId);
  await page.waitForTimeout(1000);assert.equal(await page.evaluate(id=>window.__APP__.ctl().token(id).x,criaturaId),start,'controle manual não é ignorado');
  await page.evaluate(id=>window.mesaTempoRealV111.definirAutomatico(id,true),criaturaId);
  await page.waitForFunction(({cid,criaturaId})=>(window.__fs.get('combatesAtivos/mapaMesaSyncHistorico')?.entries||[]).some(e=>e.source?.id===criaturaId&&e.target?.id===cid),{cid,criaturaId},{timeout:20000});
  assert.equal(await page.evaluate(cid=>window.__APP__.ctl().token(cid).activeWeaponId,cid),pick.gun.id,'ataque não apaga arma ativa');
  const after=await page.evaluate(id=>window.__APP__.ctl().token(id).x,criaturaId);assert.ok(after<start-1,'criatura persegue e ataca sem jogador atacar antes');
  console.log('PASS ficha de combate base 50 + ajustes explícitos; arma ativa salva e muda visual; painéis fora do mapa 1280/390; IA retomada persegue e ataca espontaneamente [banco simulado]');
  console.log('Percentuais:',JSON.stringify(values.map(v=>({pericia:v.id,base:v.base,valor:v.valor,armas:v.weapons.map(w=>({nome:w.nome,valor:w.valor,calculo:w.calculo}))}))));
 }finally{await D.H.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
