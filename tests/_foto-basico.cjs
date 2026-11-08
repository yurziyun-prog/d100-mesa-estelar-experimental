// Foto do mapa básico com o Kael selecionado, como o Yuri vê (1500x900). [harness local]
const path=require('path');const {preparar,root}=require('./_mapa-reformado.cjs');
(async()=>{const {H,page}=await preparar({removerFauna:true,viewport:{width:1500,height:900}});
 await page.evaluate(()=>{window.__APP__.setMestre();window.confirm=()=>true;window.__fs.set('combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138',{nome:'Kael Teste',imagem:'',donoUid:'mestre1',x:5,y:5,revision:3,facing:0,camada:3,mapaId:'v138_espacoporto'});
  window.__fs.set('personagens/teste_jogador_v138',{nome:'Kael Teste',dono:'mestre1',inventario:{equipado:[],bolso:[],mochila:[]}});});
 await page.waitForTimeout(1200);await page.evaluate(()=>window.mesaHubTeste.abrir());
 await page.evaluate(()=>document.querySelector('#hubTeste [data-basico]').click());
 await page.waitForFunction(()=>/Pronto|Firebase recusou|⚠️/.test(document.getElementById('htMsg')?.textContent||''),null,{timeout:90000});
 await page.evaluate(()=>document.querySelector('#hubTeste [data-x]')?.click());await page.waitForTimeout(3500);
 await page.screenshot({path:path.join(root,'docs','antes-depois','basico-tela.png')});
 console.log(JSON.stringify(await page.evaluate(()=>({sel:document.getElementById('novaSyncPersonagem')?.value,mapa:window.__APP__.ctl().mapaAtual(),barras:document.querySelectorAll('#novaSyncBoard .vs-barras').length,acao:!!document.getElementById('novaSyncTest'),botaoTxt:document.getElementById('novaSyncTest')?.textContent}))));
 await H.close();})();
