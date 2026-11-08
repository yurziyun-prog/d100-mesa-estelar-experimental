// Reforma com um PERSONAGEM selecionado (como o Kael do Yuri): o editor só grava em modo Mestre; a reforma tem de trocar sozinha e gravar. [harness local]
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page,id,erros}=await preparar({removerFauna:true});
 await page.evaluate(()=>{window.__APP__.setMestre();const p=document.getElementById('novaSyncPersonagem');if(![...p.options].some(o=>o.value==='__mestre__')){const o=document.createElement('option');o.value='__mestre__';o.textContent='Mestre';p.append(o);}p.value='__mestre__';p.dispatchEvent(new Event('change',{bubbles:true}));});
 const sel=await page.evaluate(()=>{const p=document.getElementById('novaSyncPersonagem');const o=document.createElement('option');o.value='kael_teste';o.textContent='Kael';p.append(o);p.value='kael_teste';p.dispatchEvent(new Event('change',{bubbles:true}));return p.value;});
 console.log('seletor antes:',sel);assert.notEqual(sel,'__mestre__','um personagem está selecionado, não o Mestre');
 const r=await page.evaluate(async i=>{try{const out=await window.mesaReformaTeste.aplicar(i);return {ok:true,obj:out.depois.objetos};}catch(e){return {ok:false,erro:String(e?.message||e)};}},id);
 console.log('reforma:',JSON.stringify(r));assert.ok(r.ok,'a reforma conclui com um personagem selecionado: '+r.erro);assert.ok(r.obj>300,'cena gravada');
 const sel2=await page.evaluate(()=>document.getElementById('novaSyncPersonagem').value);console.log('seletor depois:',sel2);
 // gravação recusada (como no banco real): a reforma PARA, mostra o erro original, descarta o rascunho e não deixa o mapa pela metade
 const antes=await page.evaluate(i=>(window.__fs.get('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(i))?.objects||[]).length,id);
 await page.evaluate(()=>{window.__FALHA_TX=true;}); // toda transação do banco falha com permission-denied
 const r2=await page.evaluate(async i=>{try{await window.mesaReformaTeste.aplicar(i);return {ok:true};}catch(e){return {ok:false,erro:String(e?.message||e),pend:Number(window.mesaRascunhoMapaV193?.pendentes||0)};}finally{window.__FALHA_TX=false;}},id);
 const depois=await page.evaluate(i=>(window.__fs.get('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(i))?.objects||[]).length,id);
 console.log('reforma com gravação recusada:',JSON.stringify(r2),'cena arquivada antes/depois:',antes,depois);
 assert.equal(r2.ok,false,'a reforma não finge sucesso');assert.match(r2.erro,/permission-denied/,'mostra o código original do erro');assert.equal(r2.pend,0,'rascunho descartado');assert.equal(depois,antes,'o banco ficou como estava');
 console.log('PASS reforma com personagem selecionado [harness local]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
