const assert=require('node:assert/strict');const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{const D=await montarDuelo({criatura:'rastejante_de_cinzas',arma:'espada_forca',dist:2.6});const {page,cid,criaturaId}=D;
 try{
  await page.evaluate(({cid,criaturaId})=>{window.__APP__.setMestre();window.mesaVida?.parar?.();window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:true,continuoV214:true,mapId:'mapa_real',auto:{[criaturaId]:false}});},{cid,criaturaId});
  await page.waitForFunction(cid=>[...document.getElementById('novaSyncPersonagem').options].some(o=>o.value===cid),cid);
  await page.evaluate(cid=>{const s=document.getElementById('novaSyncPersonagem');s.value=cid;s.dispatchEvent(new Event('change',{bubbles:true}));},cid);
  await page.waitForFunction(()=>window.__APP__.ctl().acoes().estado().sheet?.skills?.some(s=>s.weapons?.length));
  await page.evaluate(id=>window.mesaAcoesMapaAbrir_(id),criaturaId);
  await page.locator('#maBalao').waitFor({state:'visible'});
  const initial=await page.locator('#maBalao nav button:visible').evaluateAll(bs=>bs.map(b=>b.dataset.aba));assert.deepEqual(initial,['atacar','defender'],'sem psi não aparece botão Psi');
  const select=page.getByLabel('Arma ativa',{exact:true});assert.ok(await select.isVisible());
  const data=await page.evaluate(()=>({options:[...document.querySelector('[aria-label="Arma ativa"]').options].map(o=>({value:o.value,text:o.textContent})),sheet:window.__APP__.ctl().acoes().estado().sheet}));
  assert.equal(new Set(data.options.map(o=>o.value)).size,data.options.length,'cada arma aparece uma vez');
  const knife=data.options.find(o=>/Faca Utilitária/.test(o.text));assert.ok(knife);await select.selectOption(knife.value);
  await page.waitForFunction(({cid,id})=>window.__APP__.ctl().token(cid).activeWeaponId===id,{cid,id:knife.value});
  assert.equal(await page.getByLabel('Perícia alternativa',{exact:true}).count(),0,'faca tem perícia própria: nenhuma alternativa');
  assert.equal(await page.evaluate(()=>(window.__fs.get('combatesAtivos/mapaMesaSyncHistorico')?.entries||[]).filter(e=>e.source).length),0,'selecionar não ataca');
  await page.locator('#maBalao [data-aba=defender]').click();await page.getByLabel('Defesa preferida').selectOption('esquiva');
  await page.waitForFunction(cid=>window.__APP__.ctl().token(cid).activeDefenseId==='esquiva',cid);
  await page.locator('#maBalao [data-aba=atacar]').click();const sword=data.options.find(o=>/Espada de Força/.test(o.text));await page.getByLabel('Arma ativa',{exact:true}).selectOption(sword.value);
  assert.ok(await page.getByLabel('Perícia alternativa',{exact:true}).isVisible(),'sem especialidade própria a espada permite improvisar');
  // Migração é exclusiva do Kael designado e conserva itens/perícias.
  const migration=await page.evaluate(async cid=>{
   const A=window.__APP__,old=structuredClone(window.__fs.get('personagens/'+cid));old.testeV138=true;old.nome='Kael Teste';window.__fsWrite('personagens/teste_jogador_v138',old);
   const saved=JSON.stringify(old.pericias),special=JSON.stringify(old.especializacoes),allBefore=old.inventario.equipado.filter(Boolean).map(it=>it.instanciaId);
   const out=await window.criarPersonagemTesteV138_();window.__kaelInv=out.inventario;
   const incompatible=A.ev(`(()=>{const c=window.__fs.get('personagens/teste_jogador_v138'),ps=batalhaListaPericias_(c).filter(p=>p.__especializacao&&periciaCriaturaPodeAtacar_(c,p));return c.inventario.equipado.filter(i=>i&&itemEhArmaOuEscudo_(i)&&!itemEhEscudo_(i)&&!ps.some(p=>penalidadeCompatibilidadeArma_(p,i)===0)).map(i=>i.nome);})()`);
   const after=window.__fs.get('personagens/teste_jogador_v138'),allAfter=Object.values(after.inventario).flat().filter(Boolean).map(it=>it.instanciaId);
   return {incompatible,unchanged:JSON.stringify(after.pericias)===saved&&JSON.stringify(after.especializacoes)===special,kept:allBefore.every(id=>allAfter.includes(id)),marker:after.equipCompativelV216};
  },cid);
  assert.deepEqual(migration.incompatible,[]);assert.equal(migration.unchanged,true);assert.equal(migration.kept,true);assert.equal(migration.marker,true);
  console.log('PASS UI Atacar/Defender; seletor único de arma; perícia automática e fallback; seleção não dispara; defesa persistida; Kael só com armas compatíveis sem perder itens/perícias [banco simulado]');
 }finally{await D.H.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
