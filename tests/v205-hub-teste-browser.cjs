// Painel único "🌿 Mapa de teste": lista os mapas de teste, abre, avisa de cópias e não cria mapa novo por engano. VALIDAÇÃO: harness local, mestre simulado.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page,id,erros}=await preparar({removerFauna:true});
 await page.evaluate(()=>window.__APP__.setMestre());await page.waitForTimeout(1500);
 assert.ok(await page.evaluate(()=>!!window.mesaHubTeste),'painel instalado');
 await page.evaluate(()=>window.mesaHubTeste.abrir());await page.waitForTimeout(300);
 const txt=()=>page.evaluate(()=>document.getElementById('hubTeste')?.innerText||'');
 let t=await txt();console.log(t.split('\n').filter(Boolean).slice(0,14).join(' | '));
 assert.match(t,/seus mapas de teste/i);assert.match(t,/Atualizar/);assert.match(t,/Testar com o Kael/);assert.match(t,/Guardar os outros mapas/);
 assert.equal(await page.evaluate(()=>document.querySelector('#hubTeste [data-novo]').disabled),true,'já existe um mapa de teste: "Criar" fica bloqueado (sem cópia por engano)');
 // abrir
 await page.evaluate(()=>{window.__abriu='';window.__APP__.ctl().openMap=async i=>{window.__abriu=i;};});
 await page.evaluate(()=>document.querySelector('#hubTeste [data-abrir]').click());await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>window.__abriu),id,'Abrir abre o mapa de teste');
 // Atualizar abre o painel de reforma já com o mapa escolhido
 await page.evaluate(()=>document.querySelector('#hubTeste [data-atualizar]').click());await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>document.querySelector('#rfPainel [data-mapa]')?.value),id,'Atualizar já vem com o mapa escolhido');
 await page.evaluate(()=>document.querySelector('#rfPainel [data-x]').click());
 // guardar uma cópia
 await page.evaluate(()=>window.mesaHubTeste.abrir());await page.waitForTimeout(200);
 await page.evaluate(()=>document.querySelector('#hubTeste [data-guardar]').click());await page.waitForTimeout(500);
 assert.equal(await page.evaluate(i=>!!window.__fs.get('mapas/'+i)?.arquivadoV176,id),true,'Guardar esconde sem apagar');assert.ok(await page.evaluate(i=>!!window.__fs.get('mapas/'+i),id),'o mapa continua existindo');
 // faixa do mestre enxuta
 const botoes=await page.evaluate(()=>[...document.querySelectorAll('#mdAtalhos button')].map(b=>b.textContent));console.log('faixa:',botoes.join(' | '));
 assert.ok(botoes.some(b=>/Mapa de teste/.test(b)));assert.ok(!botoes.some(b=>/Reformar|Aba de jogador|Ajustar tamanhos|Testar o mapa com/.test(b)),'botões soltos saíram da faixa');
 const reais=erros.filter(x=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(x));assert.equal(reais.length,0,reais.join('|'));
 await page.screenshot({path:require('path').join(__dirname,'..','docs','antes-depois','hub-teste.png')});
 console.log('PASS painel do mapa de teste [harness local; mestre simulado]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
