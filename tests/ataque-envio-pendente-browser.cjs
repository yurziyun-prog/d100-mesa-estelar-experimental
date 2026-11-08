// App montado real, Firestore simulado: confirmação de escrita nunca chega.
// Verifica o bloqueio visual, não regras/autenticação do servidor.
const assert=require('node:assert/strict');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const D=await montarDuelo({criatura:'rastejante_de_cinzas',dist:.6});
 const {H,page,cid,criaturaId,erros}=D;
 try{
  await page.evaluate(async()=>{const c=window.__APP__.ctl();c.close();await c.open();});
  await page.waitForFunction(id=>document.querySelector('#novaSyncPersonagem option[value="'+id+'"]'),cid);
  await page.evaluate(id=>{
   const panel=document.getElementById('sincronizacao-nova');panel.classList.add('active');
   for(let n=panel;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}
   const select=document.getElementById('novaSyncPersonagem');select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));
  },cid);
  await page.waitForFunction(()=>[...document.querySelectorAll('#novaSyncSkill option')].some(o=>/Pistola/.test(o.textContent)));
  const skill=await page.locator('#novaSyncSkill option').evaluateAll(options=>options.find(o=>/Pistola/.test(o.textContent)).value);
  await page.selectOption('#novaSyncSkill',skill);
  await page.evaluate(id=>window.__APP__.ctl().marcarAlvo(id),criaturaId);
  await page.waitForFunction(()=>{const b=document.querySelector('#novaSyncTest');return b&&!b.disabled;});
  await page.evaluate(()=>{window.__ESCRITA_PENDENTE='/acoes/';});
  await page.click('#novaSyncTest');
  await page.waitForFunction(()=>document.querySelector('#novaSyncTest')?.disabled);
  await page.waitForFunction(()=>document.querySelector('#novaSyncActionPanel')?.textContent.includes('O banco não confirmou o envio'),null,{timeout:25000});
  assert.equal(await page.locator('[data-defense-bubble]').count(),0,'o balão Enviando deve sair');
  assert.equal(await page.locator('#novaSyncTest').isDisabled(),false,'o painel não fica bloqueado');
  const text=await page.locator('#novaSyncActionPanel').textContent();
  assert.match(text,/resultado ainda é desconhecido/);assert.match(text,/histórico/);
  assert.equal(await page.evaluate(()=>[...window.__fs.keys()].filter(p=>p.includes('/acoes/')).length),0,'nenhum reenvio automático');
  assert.deepEqual(erros.filter(e=>!/favicon|Failed to load resource|net::ERR/.test(e)),[]);
  console.log('PASS app real: envio pendente libera balão e controles após o prazo; resultado incerto explícito [banco falso]');
 }finally{await H.close();}
})().catch(e=>{console.error(e);process.exit(1);});
