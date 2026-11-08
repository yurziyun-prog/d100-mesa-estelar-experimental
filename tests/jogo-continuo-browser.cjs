// App montado e regras reais de ataque; Firestore e autenticação simulados.
const assert=require('node:assert/strict');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const D=await montarDuelo({criatura:'rastejante_de_cinzas',arma:'espada_forca',dist:.6});
 const {H,page,cid,criaturaId,id}=D;
 try{
  await page.evaluate(async({cid,criaturaId})=>{
   const A=window.__APP__;A.setMestre();
   const c=A.ctl();c.close();c.open();
   const panel=document.getElementById('sincronizacao-nova');panel.classList.add('active');
   for(let n=panel;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}
   const s=document.getElementById('novaSyncPersonagem');s.value=cid;s.dispatchEvent(new Event('change',{bubbles:true}));
   // Nenhuma ação autônoma interfere neste caso de regressão do ataque manual.
   window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:true,pausado:true,mapId:'escadaria_antiga',auto:{[criaturaId]:false,[cid]:false},faccoes:{[cid]:'grupo',[criaturaId]:'inimigos'}});
   const {iniciarIniciativa}=await import('/js/nova-turnos.js');
   const path='combatesAtivos/mapaMesaSyncDireta',rows=[cid,criaturaId].map(id=>({...window.__fs.get(path+'/posicoes/'+id),id,initiative:10,actions:2}));
   window.__fsWrite(path,{...window.__fs.get(path),combat:iniciarIniciativa(rows,'turnos-legados',()=>1)});
  },{cid,criaturaId});
  await page.waitForFunction(id=>{const s=window.mesaTempoRealV111?.estado();return s?.ativo&&s.mapId===id&&!s.pausado&&s.continuoV214;},id);
  await page.waitForFunction(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDireta')?.combat?.active===false);
  await page.waitForFunction(cid=>[...document.getElementById('novaSyncPersonagem').options].some(o=>o.value===cid),cid);
  await page.evaluate(cid=>{const s=document.getElementById('novaSyncPersonagem');s.value=cid;s.dispatchEvent(new Event('change',{bubbles:true}));},cid);
  await page.waitForFunction(()=>window.__APP__.ctl().acoes().estado()?.sheet?.skills?.some(s=>s.weapons?.some(w=>/Espada de Força/.test(w.nome))));
  const chosen=await page.evaluate(()=>window.__APP__.ctl().acoes().estado().sheet.skills.flatMap(s=>s.weapons.map(w=>({skillId:s.id,weaponId:w.id,nome:w.nome}))).find(w=>/Espada de Força/.test(w.nome)));
  assert.ok(chosen);
  await page.evaluate(({chosen,criaturaId})=>{const c=window.__APP__.ctl();c.marcarAlvo(criaturaId);c.acoes().escolher(chosen.skillId,chosen.weaponId);},{chosen,criaturaId});
  await page.waitForFunction(()=>{const b=document.getElementById('novaSyncTest');return b&&!b.disabled;});
  await page.click('#novaSyncTest');
  await page.waitForFunction(()=>[...window.__fs].some(([p,v])=>p.includes('/acoes/')&&v.kind==='v56:direct-attack'&&['done','rejected'].includes(v.status)),null,{timeout:15000});
  const result=await page.evaluate(()=>[...window.__fs].filter(([p,v])=>p.includes('/acoes/')&&v.kind==='v56:direct-attack').map(([p,v])=>({status:v.status,message:v.message})));
  console.log('ataque:',JSON.stringify(result));assert.equal(result.at(-1).status,'done');
  assert.equal(await page.locator('[data-defense-bubble]').count(),0,'não mostra aviso de envio comum');
  assert.equal(await page.evaluate(()=>window.mesaTempoRealV111.estado().pausado),false,'fim/efeito da luta não pausa');
  // A pausa é explícita e persiste até o mestre retomar.
  await page.evaluate(()=>window.mesaTempoRealV111.pausar(true));
  await page.waitForFunction(()=>window.mesaJogoPausadoV214());
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(()=>window.mesaTempoRealV111.estado().pausaEmergencia),true);
  await page.evaluate(cid=>{window.__APP__.setJogador('mestre1');window.mesaDiretorV206_=cid;},cid);
  await assert.rejects(page.evaluate(()=>window.mesaTempoRealV111.pausar(false)),/Somente o mestre/);
  assert.equal(await page.evaluate(()=>window.__APP__.ctl().andarDirecao(1,0)),false,'jogador não move durante pausa');
  await page.evaluate(()=>window.__APP__.setMestre());
  const before=await page.evaluate(cid=>window.__APP__.ctl().token(cid).x,cid);
  assert.equal(await page.evaluate(()=>window.__APP__.ctl().andarDirecao(1,0)),true,'mestre ainda pode reposicionar');
  await page.waitForFunction(({cid,before})=>window.__APP__.ctl().token(cid).x>before+.05,{cid,before});
  await page.evaluate(()=>window.__APP__.ctl().pararAndar());
  await page.evaluate(()=>window.mesaTempoRealV111.pausar(false));
  assert.equal(await page.evaluate(()=>window.mesaJogoPausadoV214()),false);
  console.log('PASS espada executa após migrar estado antigo; pausa só mestre; movimento bloqueado ao jogador e retomada explícita [banco falso]');
 }catch(e){console.log('diagnóstico',await page.evaluate(()=>({rt:window.mesaTempoRealV111?.estado(),map:window.__fs.get('combatesAtivos/mapaMesaSyncDireta'),tokens:window.__APP__.ctl()?.todosTokens?.().map(t=>({id:t.id,mapa:t.mapaId})),errors:document.getElementById('novaSyncStatus')?.textContent})));throw e;}finally{await H.close();}
})().catch(e=>{console.error(e);process.exit(1);});
