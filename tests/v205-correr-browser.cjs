// 🏃 Correr: anda mais rápido e gasta fadiga; para sozinho sem fôlego. VALIDAÇÃO: harness local (jogador simulado).
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');const ajudas=require('./_ajudas-percurso.cjs');
(async()=>{
 const {H,page,id,erros}=await preparar({removerFauna:true});const A=ajudas(page,id);await A.mestreProcessa(2500);await page.waitForTimeout(1500);
 const fad=()=>page.evaluate(()=>window.mesaModoSimplesV200.fadiga('jogador_teste_1'));
 const anda=async(seg)=>{await A.colocar(30,34);await page.waitForTimeout(800);const p0=await A.pos();await page.keyboard.down('d');await page.waitForTimeout(seg*1000);await page.keyboard.up('d');await page.waitForTimeout(400);const p1=await A.pos();return Math.hypot(p1.x-p0.x,p1.y-p0.y);};
 assert.ok(await page.evaluate(()=>!!document.getElementById('crBotao')&&!document.getElementById('crBotao').hidden),'botão 🏃 Correr aparece para quem controla um personagem');
 assert.ok(await page.evaluate(()=>!!document.querySelector('#novaSyncBoard [data-token="jogador_teste_1"] .vs-barras .fad')),'a barra de fadiga aparece na miniatura do personagem em uso');
 const f0=await fad();const d1=await anda(2);const f1=await fad();console.log('a pé:',d1.toFixed(2),'m; fadiga',f0,'→',f1);
 await page.mouse.move(600,500);await page.keyboard.press('KeyE');await page.waitForTimeout(400); // atalho do teclado (E) liga a corrida
 assert.equal(await page.evaluate(()=>document.getElementById('crBotao').getAttribute('aria-pressed')),'true','a tecla E liga o correr');
 await page.keyboard.press('KeyE');await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.getElementById('crBotao').getAttribute('aria-pressed')),'false','E de novo desliga');
 await page.evaluate(()=>document.getElementById('crBotao').click());await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>document.getElementById('crBotao').getAttribute('aria-pressed')),'true');
 const d2=await anda(2);const f2=await fad();console.log('correndo:',d2.toFixed(2),'m; fadiga',f1,'→',f2);
 assert.ok(d2>d1*1.25,'correndo anda bem mais: '+d1.toFixed(2)+' → '+d2.toFixed(2));assert.ok(f2<f1-5,'correr gasta fadiga: '+f1+' → '+f2);
 // sem fôlego: para de correr
 await page.evaluate(()=>{window.mesaModoSimplesV200.gastar('jogador_teste_1',200);});await page.waitForTimeout(1500);
 assert.equal(await page.evaluate(()=>window.mesaCorrerV205.correndo('jogador_teste_1')),false,'sem fôlego para sozinho');
 const reais=erros.filter(x=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(x));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS correr [harness local; jogador simulado]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
