// Atuar como → aba nova com a visão do personagem (mestre simulado). VALIDAÇÃO: harness local.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page}=await preparar({removerFauna:true});
 await page.evaluate(()=>{window.__APP__.setMestre();window.__TESTE_ATUAR_ABA=true;window.__abertas=[];window.open=(u)=>{window.__abertas.push(String(u));return {};};});await page.waitForTimeout(1200);
 await page.evaluate(()=>{const s=document.getElementById('novaSyncPersonagem');s.value='jogador_teste_1';s.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(300);
 const ab=await page.evaluate(()=>window.__abertas);console.log('abas:',JSON.stringify(ab));
 assert.equal(ab.length,1,'abriu uma aba');assert.match(ab[0],/verComo=jogador_teste_1/,'com o personagem escolhido');
 await page.evaluate(()=>{const s=document.getElementById('novaSyncPersonagem');s.value='jogador_teste_1';s.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(300);
 assert.equal((await page.evaluate(()=>window.__abertas)).length,1,'não abre duas vezes seguidas');
 console.log('PASS atuar como abre aba [harness local]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
