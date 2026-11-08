// A seta do mouse muda conforme a função (câmera, mover peças, construir, apagar). VALIDAÇÃO: harness local, mestre SIMULADO.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page,erros}=await preparar({removerFauna:true});
 await page.evaluate(()=>window.__APP__.setMestre());await page.waitForTimeout(1200);
 await page.evaluate(()=>{const p=document.getElementById('novaSyncPersonagem');if(![...p.options].some(o=>o.value==='__mestre__')){const o=document.createElement('option');o.value='__mestre__';o.textContent='Mestre';p.append(o);}p.value='__mestre__';p.dispatchEvent(new Event('change',{bubbles:true}));});
 const modo=async()=>{await page.waitForTimeout(450);return page.evaluate(()=>({m:document.getElementById('novaSyncBoard').dataset.modoMouse||'',cur:getComputedStyle(document.getElementById('novaSyncBoard')).cursor.slice(0,40),rot:document.getElementById('modoMouseV205')?.textContent||''}));};
 let r=await modo();console.log('sem editor:',JSON.stringify(r));assert.equal(r.m,'camera');assert.equal(r.cur,'grab');
 await page.evaluate(()=>window.mesaEditorRapidoV197.abrir());
 r=await modo();console.log('editor aberto (parede):',JSON.stringify(r));assert.equal(r.m,'construir');assert.equal(r.cur,'crosshair');assert.match(r.rot,/Construir/);
 for(const [f,esperado,cur] of [['mover','mover','move'],['apagar_peca','apagar',null],['chao','construir','crosshair']]){
  await page.evaluate(f=>document.querySelector('#erPainel [data-f="'+f+'"]')?.click(),f);r=await modo();console.log(f+':',JSON.stringify(r));
  assert.equal(r.m,esperado,f);if(cur)assert.equal(r.cur,cur,f);assert.ok(r.rot,'etiqueta do modo');}
 await page.evaluate(()=>window.mesaEditorRapidoV197.fechar?.());
 await page.evaluate(()=>{const b=document.querySelector('#erPainel [data-f]');});
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS cursor por modo [harness local; mestre simulado]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
