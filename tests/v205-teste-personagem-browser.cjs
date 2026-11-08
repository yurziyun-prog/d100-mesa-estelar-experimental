// Módulo "🧪 Testar o mapa com um personagem" (mestre): coloca o personagem de teste (insetoide, lanterna), leva a regiões, remove. VALIDAÇÃO: harness local, mestre SIMULADO.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page,erros}=await preparar({removerFauna:true});
 await page.evaluate(()=>window.__APP__.setMestre());await page.waitForTimeout(1500);
 const K='combatesAtivos/mapaMesaSyncDireta/posicoes/teste_personagem_v205';
 const doc=()=>page.evaluate(k=>{const v=window.__fs.get(k);return v?{nome:v.nome,arte:v.arte3dV200,vis:v.visualV203,x:+(v.x*80/28).toFixed(1),y:+(v.y*50/14).toFixed(1),mapa:v.mapaId,dono:v.donoUid}:null;},K);
 assert.ok(await page.evaluate(()=>!!window.mesaTestePersonagem),'módulo carregado');
 // seletores falsos da barra de ação (perícia → arma padrão) para provar o espelhamento
 await page.evaluate(()=>{document.getElementById('novaSyncSkill')?.remove();document.getElementById('novaSyncWeapon')?.remove();const sk=document.createElement('select');sk.id='novaSyncSkill';sk.innerHTML='<option value="a">Pistola (60%)</option><option value="b">Faca (50%)</option>';const wp=document.createElement('select');wp.id='novaSyncWeapon';const W={a:['Pistola laser'],b:['Faca utilitária','Soco']};const pop=()=>{wp.innerHTML=W[sk.value].map((n,i)=>'<option value="w'+i+'">'+n+'</option>').join('');};pop();sk.addEventListener('change',pop);document.body.append(sk,wp);});
 await page.evaluate(()=>window.mesaTestePersonagem.abrirPainel());
 await page.waitForTimeout(1000);
 await page.evaluate(()=>{const p=document.querySelector('#tpTestePainel [data-pericia]');p.value='b';p.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(400);
 const esp=await page.evaluate(()=>({sk:document.getElementById('novaSyncSkill').value,wp:document.getElementById('novaSyncWeapon').value,arma:document.querySelector('#tpTestePainel [data-arma]').selectedOptions[0]?.textContent}));console.log('perícia→arma:',JSON.stringify(esp));assert.equal(esp.sk,'b');assert.equal(esp.wp,'w0','a arma padrão da perícia já vem escolhida');assert.match(esp.arma,/Faca/);assert.ok(await page.evaluate(()=>!!document.getElementById('tpTestePainel')),'painel abre');
 await page.evaluate(()=>window.mesaTestePersonagem.colocar({quem:'insetoide',lanterna:true,destino:3}));await page.waitForTimeout(800);
 let d=await doc();console.log('colocado:',JSON.stringify(d));assert.ok(d&&d.arte==='cima_insetoide_predador'&&/L/.test(d.vis)&&Math.abs(d.x-6)<.2&&Math.abs(d.y-23.4)<.2,'insetoide com lanterna na margem da lagoa');
 await page.waitForTimeout(1200);console.log('arte na tela:',await page.evaluate(()=>document.querySelector('#novaSyncBoard [data-token="teste_personagem_v205"]')?.dataset.arte3d));
 await page.evaluate(()=>window.mesaTestePersonagem.ir(7));await page.waitForTimeout(600);d=await doc();assert.ok(Math.abs(d.x-55)<.2&&Math.abs(d.y-46.5)<.2,'levado ao contorno da lava');
 await page.evaluate(()=>window.mesaTestePersonagem.equipar({tocha:true}));await page.waitForTimeout(400);assert.match((await doc()).vis,/T/);
 // mapa padrão do mestre: abre o mapa onde está o personagem de teste do mestre (se ninguém joga no mapa aberto)
 await page.evaluate(()=>{window.__fs.set('combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138',{nome:'Kael Teste',imagem:'',donoUid:'mestre1',x:5,y:5,revision:3,facing:0,camada:3,mapaId:'v138_espacoporto'});window.__abriu='';window.__jog=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1');window.__fs.delete('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1');window.__APP__.ctl().openMap=async id=>{window.__abriu=id;};});
 await page.evaluate(()=>window.mesaTestePersonagem.remover());await page.waitForTimeout(300);
 const r1=await page.evaluate(()=>window.mesaTestePersonagem.abrirMapaDoTeste());const abriu=await page.evaluate(()=>window.__abriu);console.log('mapa padrão do mestre ->',r1,abriu);assert.equal(abriu,'v138_espacoporto','abre o mapa do Kael');
 await page.evaluate(()=>{window.__fs.set('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_real',{nome:'Aluna',donoUid:'aluna1',x:3,y:3,mapaId:window.__APP__.ctl().mapaAtual(),camada:3,revision:0});window.__abriu='';});
 const r2=await page.evaluate(()=>window.mesaTestePersonagem.abrirMapaDoTeste());assert.equal(r2,'jogadores','não tira o mapa de jogadores de verdade');assert.equal(await page.evaluate(()=>window.__abriu),'');
 await page.evaluate(()=>{window.__fs.delete('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_real');if(window.__jog)window.__fs.set('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1',window.__jog);});
 // o Kael COMEÇA no mapa aberto (ponto livre, selecionado)
 await page.evaluate(()=>{window.__fs.set('combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138',{nome:'Kael Teste',imagem:'',donoUid:'mestre1',x:5,y:5,revision:9,facing:0,camada:3,mapaId:'v138_espacoporto'});});
 const ik=await page.evaluate(()=>window.mesaTestePersonagem.iniciarComKael());await page.waitForTimeout(600);
 const kk=await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138'));
 console.log('Kael iniciou:',JSON.stringify(ik),'mapa do token:',kk.mapaId);assert.equal(kk.mapaId,ik.mapa,'o Kael veio para o mapa aberto');assert.ok(Math.hypot(ik.x-46,ik.y-26)<8,'perto do acampamento (ponto livre)');
 // trazer um personagem que está em OUTRO mapa (o Kael do mestre) para o mapa aberto e ligar os dois mapas
 await page.evaluate(()=>{window.__fs.set('combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138',{nome:'Kael Teste',imagem:'',donoUid:'mestre',x:5,y:5,revision:3,facing:0,camada:3,mapaId:'v138_espacoporto'});});
 const lista=await page.evaluate(()=>window.mesaTestePersonagem.listarPersonagens());assert.ok(lista.some(p=>p.id==='teste_jogador_v138'&&p.mapa==='v138_espacoporto'),'lista inclui o Kael em outro mapa');
 await page.evaluate(()=>window.mesaTestePersonagem.trazer('teste_jogador_v138',0));await page.waitForTimeout(800);
 const kael=await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/teste_jogador_v138'));const mapaAtual=await page.evaluate(()=>window.novaSyncController_?.mapaAtual?.()||'');
 console.log('Kael agora em',kael.mapaId,'(mapa aberto',mapaAtual+')');assert.ok(kael.mapaId&&kael.mapaId!=='v138_espacoporto','Kael veio para o mapa aberto');
 const ligs=await page.evaluate(()=>window.__fs.get('combatesAtivos/mesaLigacoes')?.ligacoes||[]);console.log('ligações:',JSON.stringify(ligs.map(l=>[l.a.mapa,l.b.mapa])));assert.ok(ligs.some(l=>[l.a.mapa,l.b.mapa].includes('v138_espacoporto')&&[l.a.mapa,l.b.mapa].includes(kael.mapaId)),'mapas ligados por uma saída');
 await page.evaluate(()=>window.mesaTestePersonagem.remover());await page.waitForTimeout(400);assert.equal(await doc(),null,'removido');
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS módulo de teste com personagem [harness local; mestre simulado]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
