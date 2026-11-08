// Editar personagem: botão na barra (junto de ⋯ Mais) e "Arma na mão" muda a miniatura. VALIDAÇÃO: harness local.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');const ajudas=require('./_ajudas-percurso.cjs');
(async()=>{
 const {H,page,id,erros}=await preparar({removerFauna:true});const A=ajudas(page,id);await A.mestreProcessa(2500);await page.waitForTimeout(2500);
 const info=await page.evaluate(()=>{const b=document.getElementById('pedBotao');return {existe:!!b,naBarra:!!b&&b.classList.contains('ped-na-barra')&&b.parentElement===document.getElementById('mbMais')?.parentElement,visivel:!!b&&!b.hidden};});
 console.log('botão:',JSON.stringify(info));assert.ok(info.existe&&info.visivel,'o botão 🧑 Editar personagem aparece para quem tem personagem');
 await page.evaluate(()=>document.getElementById('pedBotao').click());await page.waitForTimeout(600);
 assert.ok(await page.evaluate(()=>!!document.querySelector('#pedPainel [data-arma-vis]')),'painel tem "Arma na mão"');
 await page.evaluate(()=>{const s=document.querySelector('#pedPainel [data-arma-vis]');s.value='G';s.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.evaluate(()=>document.querySelector('#pedPainel [data-salvar]').click());await page.waitForTimeout(1500);
 const r=await page.evaluate(()=>{const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1');const g=[...document.querySelectorAll('#novaSyncBoard [data-token="jogador_teste_1"] .a3dc')].filter(x=>x.dataset.c==='ac_fuzil').map(x=>x.style.display);return {visual:t?.visualV203,fuzil:g};});
 console.log(JSON.stringify(r));assert.match(r.visual||'',/z=[A-Z]*G/,'o fuzil ficou no visual salvo');assert.ok(r.fuzil.length&&r.fuzil.every(d=>d!=='none'),'o fuzil aparece na miniatura');
 const reais=erros.filter(x=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(x));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS editor de personagem com arma [harness local]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
