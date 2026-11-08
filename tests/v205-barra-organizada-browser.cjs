// Barra do mapa: botões só-ícone ganham nome, os raros ficam em "⋯ Mais" e "❓ Ajuda" lista tudo. VALIDAÇÃO: harness local, mestre simulado.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page,erros}=await preparar({removerFauna:true,viewport:{width:1500,height:900}});
 await page.evaluate(()=>{window.__APP__.setMestre();const p=document.getElementById('novaSyncPersonagem');if(![...p.options].some(o=>o.value==='__mestre__')){const o=document.createElement('option');o.value='__mestre__';o.textContent='Mestre';p.append(o);}p.value='__mestre__';p.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(3500);
 const est=()=>page.evaluate(()=>{const vis=e=>e.offsetParent!==null;const q=id=>document.getElementById(id);return {rot:[...document.querySelectorAll('.mb-rotulado')].filter(vis).map(e=>e.dataset.rotulo),ocultos:['elPanoramico','ljBotao','mlGeral','cpBotao','moSoltar','moTodos'].filter(id=>q(id)&&!vis(q(id))),mais:q('mbMais')?.textContent,ajuda:!!q('mbAjuda')};});
 let e=await est();console.log('rótulos:',e.rot.join(', '));console.log('ocultos:',e.ocultos.join(', '),'|',e.mais);
 assert.ok(e.rot.length>=6,'botões só-ícone ganharam nome');assert.ok(e.ocultos.length>=3,'botões raros recolhidos');assert.match(e.mais,/Mais/);assert.ok(e.ajuda);
 await page.screenshot({path:require('path').join(__dirname,'..','docs','antes-depois','barra-depois.png')});
 await page.evaluate(()=>document.getElementById('mbMais').click());await page.waitForTimeout(400);e=await est();assert.equal(e.ocultos.length,0,'⋯ Mais mostra tudo de volta');assert.match(e.mais,/Menos/);
 await page.evaluate(()=>document.getElementById('mbMais').click());await page.waitForTimeout(400);
 await page.evaluate(()=>document.getElementById('mbAjuda').click());await page.waitForTimeout(300);
 const aj=await page.evaluate(()=>[...document.querySelectorAll('#mbAjudaPainel .ma-l')].length);console.log('linhas da ajuda:',aj);assert.ok(aj>=12,'ajuda lista os botões');
 const reais=erros.filter(x=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(x));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS barra organizada [harness local; mestre simulado]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
