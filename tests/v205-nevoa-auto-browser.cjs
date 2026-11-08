// Névoa automática: lugar claro de dia = sem névoa; escolha antiga ignorada; escolha nova do mestre vale. VALIDAÇÃO: harness local (jogador simulado).
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');const ajudas=require('./_ajudas-percurso.cjs');
(async()=>{
 const {H,page,id,erros}=await preparar({removerFauna:true});const A=ajudas(page,id);await A.mestreProcessa(2500);await page.waitForTimeout(1500);
 const est=()=>page.evaluate(()=>({ligada:window.mesaNevoaV145.ligada(),modo:window.mesaNevoaV145.modo(),auto:window.mesaNevoaV145.automatico(),canvas:!!document.getElementById('nvCanvas')}));
 let e=await est();console.log('claro, de dia:',JSON.stringify(e));assert.equal(e.ligada,false,'lugar claro de dia: sem névoa');assert.equal(e.canvas,false);assert.equal(e.auto,true);
 // escolha ANTIGA (valor simples guardado por versões anteriores) é ignorada
 await page.evaluate(i=>{window.__fsWrite('combatesAtivos/mesaNevoa',{mapas:{[i]:'penumbra'}});},id);await page.waitForTimeout(500);
 e=await est();console.log('valor antigo "penumbra":',JSON.stringify(e));assert.equal(e.ligada,false,'valor antigo não liga névoa');
 // escolha nova do mestre
 await page.evaluate(i=>{window.__fsWrite('combatesAtivos/mesaNevoa',{mapas:{[i]:{m:'escuro',v:2}}});},id);await page.waitForTimeout(900);
 e=await est();console.log('mestre escolheu escuro:',JSON.stringify(e));assert.equal(e.modo,'escuro');assert.equal(e.auto,false);assert.ok(e.canvas,'névoa desenhada');
 await page.screenshot({path:require('path').join(__dirname,'..','docs','antes-depois','nevoa-escuro.png')});
 await page.evaluate(i=>{window.__fsWrite('combatesAtivos/mesaNevoa',{mapas:{[i]:null}});},id);await page.waitForTimeout(900);
 e=await est();assert.equal(e.ligada,false,'voltou ao automático (claro)');
 const reais=erros.filter(x=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(x));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS névoa automática [harness local; jogador simulado]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
