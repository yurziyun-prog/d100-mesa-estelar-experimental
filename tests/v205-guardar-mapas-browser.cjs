// 🗂️ Mapas: "Guardar todos (menos o de teste)" esconde os outros mapas (arquivadoV176) sem apagar. VALIDAÇÃO: harness local, mestre simulado.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page,id,erros}=await preparar({removerFauna:true});
 await page.evaluate(()=>{window.__APP__.setMestre();});await page.waitForTimeout(1500);
 await page.evaluate(()=>window.mesaApagarMapasV173.abrir());await page.waitForTimeout(600);
 const clica=()=>page.evaluate(()=>document.querySelector('#amModal [data-guardar-todos]').click());
 const naLista=await page.evaluate(()=>[...document.querySelectorAll('#amModal [data-mostrar]')].map(i=>i.dataset.mostrar));console.log('mapas na lista:',naLista.length);assert.ok(naLista.length>=3);
const estados=l=>page.evaluate(l=>l.map(n=>[n,!!window.__fs.get('mapas/'+n)?.arquivadoV176]),l);const antes=await estados(naLista);
await clica();await page.waitForTimeout(300);
 let e=await estados(naLista);console.log('1º clique (só pede confirmação):',JSON.stringify(e));assert.deepEqual(e,antes,'1º clique não guarda nada');
 await clica();await page.waitForTimeout(1500);
 e=await page.evaluate(l=>l.map(n=>[n,!!window.__fs.get('mapas/'+n)?.arquivadoV176]),naLista);console.log('depois:',JSON.stringify(e));
 assert.ok(e.filter(x=>!/ecossistema/i.test(x[0])).every(x=>x[1]),'os outros mapas ficaram guardados');assert.ok(e.filter(x=>/ecossistema/i.test(x[0])).every(x=>!x[1]),'o mapa de teste continua à mostra');
 // 🧹 tirar NPCs e monstros dos mapas guardados (jogador fica; mapa de teste fica; cópia antes)
 await page.evaluate(()=>{const P='combatesAtivos/mapaMesaSyncDireta/posicoes/';window.__fsWrite(P+'synccriatura%3Azumbi_1~7',{nome:'Zumbi',x:3,y:3,mapaId:'v184_masmorra',camada:3,revision:0});window.__fsWrite(P+'syncnpc%3Aguarda',{nome:'Guarda',x:4,y:4,mapaId:'v196_complexo',camada:3,revision:0});window.__fsWrite(P+'pj_aluna',{nome:'Aluna',donoUid:'aluna1',x:5,y:5,mapaId:'v184_masmorra',camada:3,revision:0});window.__fsWrite(P+'synccriatura%3Alobo~1',{nome:'Lobo de teste',x:6,y:6,mapaId:window.__APP__.ctl().mapaAtual(),camada:3,revision:0});});
 await page.waitForTimeout(800);
 const limpa=()=>page.evaluate(()=>document.querySelector('#amModal [data-limpar-guardados]').click());
 await limpa();await page.waitForTimeout(300);await limpa();await page.waitForTimeout(1500);
 const ex=await page.evaluate(()=>{const P='combatesAtivos/mapaMesaSyncDireta/posicoes/';return {zumbi:!!window.__fs.get(P+'synccriatura%3Azumbi_1~7'),guarda:!!window.__fs.get(P+'syncnpc%3Aguarda'),aluna:!!window.__fs.get(P+'pj_aluna'),lobo:!!window.__fs.get(P+'synccriatura%3Alobo~1'),backup:[...window.__fs.keys()].some(k=>/backupTokensGuardados_/.test(k))};});
 console.log('limpeza:',JSON.stringify(ex));assert.equal(ex.zumbi,false);assert.equal(ex.guarda,false);assert.equal(ex.aluna,true,'jogador fica');assert.equal(ex.lobo,true,'monstro do mapa de teste fica');assert.ok(ex.backup,'cópia feita');
 const reais=erros.filter(x=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(x));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS guardar todos os mapas [harness local; mestre simulado]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
