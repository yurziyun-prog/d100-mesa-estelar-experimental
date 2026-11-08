// 🏠 Criar mapa BÁSICO: cria, desenha, SALVA (banco falso estrito: sem arrays aninhados nem undefined) e coloca o personagem de teste. VALIDAÇÃO: harness local.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page,erros}=await preparar({removerFauna:true});
 await page.evaluate(()=>{window.__APP__.setMestre();window.confirm=()=>true;window.__fs.set('combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138',{nome:'Kael Teste',imagem:'',donoUid:'mestre1',x:5,y:5,revision:3,facing:0,camada:3,mapaId:'v138_espacoporto'});});await page.waitForTimeout(1200);
 await page.evaluate(()=>window.mesaHubTeste.abrir());await page.waitForTimeout(300);
 await page.evaluate(()=>document.querySelector('#hubTeste [data-basico]').click());
 await page.waitForFunction(()=>/Pronto|Firebase recusou|Não confirmou|⚠️/.test(document.getElementById('htMsg')?.textContent||''),null,{timeout:60000});
 const msg=await page.evaluate(()=>document.getElementById('htMsg').textContent);console.log('mensagem:',msg.slice(0,400));
 assert.match(msg,/Pronto/,'o mapa básico foi criado e salvo');
 const r=await page.evaluate(()=>{const mapas=[...window.__fs].filter(([p])=>/^mapas\/[^/]+$/.test(p)&&/Casa de teste/.test(window.__fs.get(p).nome||''));const id=mapas[0]?.[0].slice(6);const c=window.__fs.get('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id));const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138');return {id,pecas:(c?.objects||[]).length,token:t?{mapa:t.mapaId,x:+(t.x*24/28).toFixed(1),y:+(t.y*16/14).toFixed(1)}:null};});
 const cr=await page.evaluate(i=>[...window.__fs].filter(([p,v])=>/posicoes[/]synccriatura/.test(p)&&v.mapaId===i).map(([p,v])=>[p.split('/').pop(),+(v.x*24/28).toFixed(1),+(v.y*16/14).toFixed(1)]),r.id);console.log('criaturas no mapa:',JSON.stringify(cr));assert.ok(cr.length>=1,'há uma criatura no jardim');assert.ok(cr[0][1]>18||cr[0][1]<5||cr[0][2]>13||cr[0][2]<3,'fora da casa (casa: x 6–18, y 4–12)');
console.log(JSON.stringify(r));assert.ok(r.id,'mapa existe');assert.ok(r.pecas>=15,'cena arquivada com as peças: '+r.pecas);assert.equal(r.token?.mapa,r.id,'o KAEL foi para o mapa novo (não ficou no outro)');assert.ok(Math.hypot(r.token.x-9,r.token.y-8)<3,'dentro da casa: '+JSON.stringify(r.token));
 // 2ª vez: RECONSTRÓI o mesmo mapa (sem duplicar mapa, peças nem criatura)
 await page.evaluate(()=>{document.getElementById('htMsg').textContent='';document.querySelector('#hubTeste [data-basico]').click();});
 await page.waitForFunction(()=>/Pronto|Firebase recusou|Não confirmou|⚠️/.test(document.getElementById('htMsg')?.textContent||''),null,{timeout:90000});
 const r2=await page.evaluate(()=>{const mapas=[...window.__fs].filter(([p])=>/^mapas\/[^/]+$/.test(p)&&/Casa de teste/.test(window.__fs.get(p).nome||''));const id=mapas[0]?.[0].slice(6);const c=window.__fs.get('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id));const cr=[...window.__fs].filter(([p,v])=>/posicoes[/]synccriatura/.test(p)&&v.mapaId===id).length;return {n:mapas.length,pecas:(c?.objects||[]).length,criaturas:cr};});
 console.log('2ª vez:',JSON.stringify(r2));assert.equal(r2.n,1,'continua um mapa só');assert.equal(r2.pecas,r.pecas,'mesmas peças (sem duplicar)');assert.equal(r2.criaturas,1,'uma criatura só');
 assert.equal(await page.evaluate(()=>[...window.__fs].filter(([p,v])=>/posicoes[/]synccriatura/.test(p)).map(([,v])=>v.atitudeV200)[0]),'sanguinaria','criatura nasce sanguinária (caça o Kael)');
 const reais=erros.filter(x=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(x));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS mapa básico [harness local; banco falso estrito]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
