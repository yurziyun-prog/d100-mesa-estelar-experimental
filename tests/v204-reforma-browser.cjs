// Reforma do mapa de teste (ferramenta do mestre): inventário, backup, aplicar (idempotente), resetar e restaurar.
// VALIDAÇÃO: harness local, Firestore simulado e papel simulado (mestre). Não é sessão autenticada.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {abrirApp,root,carregarBancoDePecas}=require('./_harness-app.cjs');
(async()=>{
 const H=await abrirApp(),{page,erros}=H;
 const csv=fs.readFileSync(path.join(root,'dados','banco_criaturas_2026-09-26.csv'),'utf8');
 const lin=csv.replace(/^﻿/,'').split(/\r?\n/).filter(Boolean),cab=lin[0].split(';');
 const todas=lin.slice(1).map(x=>x.split(';')).map(c=>Object.fromEntries(cab.map((h,i)=>[h,c[i]])));
 await page.evaluate(({todas})=>{
  const A=window.__APP__;A.setMestre();A.setBancos(todas,[{id:'engenheira',nome:'Engenheira Vela',carreira:'Engenheira'},{id:'medica',nome:'Doutora Íris',carreira:'Médica'},{id:'cacador',nome:'Caçador Brás',carreira:'Caçador'}]);
  const S=window.__fs,M='mapa_real';
  S.set('combatesAtivos/mapaMesaSyncDireta',{mapId:M,nome:'Pátio de pedra',larguraM:28,alturaM:14,fundo:''});
  S.set('mapas/'+M,{nome:'Pátio de pedra',larguraM:28,alturaM:14});
  S.set('combatesAtivos/mapaMesaSyncDiretaCena',{mapId:M,objetoSchema:1,objects:[{id:'chao1',nome:'Chão do mapa',erTipo:'piso',x:14,y:7,larguraM:28,alturaM:14,camada:1,forma:'rect',cor:'#8a7a66',bloqueiaMovimento:false,bloqueiaVisao:false}]});
  window.confirm=()=>true;window.__logs=[];const w=console.info;console.info=(...a)=>{window.__logs.push(a.join(' '));w.apply(console,a);};
  window.__ready=A.ctl().open();
 },{todas});
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}document.getElementById('loginScreen')&&(document.getElementById('loginScreen').style.display='none');});
 await page.waitForSelector('#novaSyncBoard',{timeout:20000});await page.waitForTimeout(2500);
 await page.waitForFunction(()=>window.mesaReformaTeste&&window.mesaEditorRapidoV197?.construir,null,{timeout:20000});
 console.log('peças no banco:',await carregarBancoDePecas(page));

 // ===== um mapa "antigo": criado pelo editor, só com um muro e tokens (um dentro da futura casa, um na lagoa funda, um jogador comum)
 const id=await page.evaluate(async()=>{const E=window.mesaEditorRapidoV197;const id=await E.criarMapa('🌿 Ecossistema (teste)',80,50,'');for(let i=0;i<80&&!E.pronto(id);i++)await new Promise(r=>setTimeout(r,100));return id;});
 assert.ok(id,'mapa antigo criado');
 await page.evaluate(async id=>{
  const E=window.mesaEditorRapidoV197;E.construir([{t:'ops',ops:[['parede',[5,5,20,5],{par:'pedra'}]]}]);await E.salvar();
  const S=window.__fs,pos=(k,nome,xm,ym,extra={})=>S.set('combatesAtivos/mapaMesaSyncDireta/posicoes/'+k,{nome,imagem:'',donoUid:'',x:+(xm/80*28).toFixed(3),y:+(ym/50*14).toFixed(3),revision:0,facing:0,camada:3,mapaId:id,diametroM:1,...extra});
  pos('synccriatura%3Azumbi_1~101','Monstro · Zumbi',28.2,23.05);           // dentro da parede norte da futura casa
  pos('synccriatura%3Acila~101','Monstro · Cila',13,25);                      // na lagoa funda: criatura aquática FICA na água
  pos('synccriatura%3Alarva_interdimensional~101','Monstro · Larva',12,25.4);  // na lagoa funda: terrestre sai da água
  pos('jogador_teste_1','Jogador de teste',40.5,25,{donoUid:'jog1'});        // personagem de um jogador comum: dono e id têm de sobreviver
  S.set('combatesAtivos/mapaMesaSyncSaude',{revision:1,actors:{'synccriatura%3Azumbi_1~101':{vida:3},'jogador_teste_1':{vida:9}}});
 },id);
 const antes=await page.evaluate(async id=>{const R=window.mesaReformaTeste;return {inv:await R.inventario(id),cands:R.candidatos()};},id);
 console.log('inventário antes:',JSON.stringify({obj:antes.inv.objetos,reforma:antes.inv.reforma,cri:antes.inv.criaturas,jog:antes.inv.jogadores,conf:antes.inv.conferencia}));
 assert.equal(antes.inv.reforma,0,'mapa antigo não tem reforma');assert.ok(!antes.inv.conferencia.ok,'a conferência acusa o que falta');
 assert.ok(antes.cands.some(c=>c.id===id),'o mapa aparece na lista de candidatos');

 // ===== aplicar (com backup)
 const r1=await page.evaluate(async id=>{const R=window.mesaReformaTeste;const r=await R.aplicar(id);const fs=[...window.__fs.keys()];return {r,backups:fs.filter(k=>/^backupsMapa[/][^/]+$/.test(k)),partes:fs.filter(k=>/^backupsMapa[/].+[/]partes[/]/.test(k)).length};},id);
 console.log('tokens apos 1a:',JSON.stringify((await page.evaluate(id=>[...window.__fs].filter(([k,v])=>/posicoes[/]/.test(k)&&v.mapaId===id&&/cila|zumbi_1~101|jogador/.test(k)).map(([k,v])=>[k.split('/').pop(),v.x,v.y,v.revision]),id)))); console.log((await page.evaluate(()=>window.__logs.filter(l=>/bloq/.test(l)))).join(' | ').slice(0,900)); console.log('1ª aplicação:',JSON.stringify({bk:r1.r.backup,novas:r1.r.colocados,movidos:r1.r.movidos.map(m=>m.id.slice(0,24)),falhas:r1.r.falhas,obj:r1.r.depois.objetos,cri:r1.r.depois.criaturas,conf:r1.r.depois.conferencia,faltou:r1.r.faltou.length}));
 assert.ok(r1.backups.length===1&&r1.partes>=1,'backup gravado antes de mudar');
 assert.ok(r1.r.depois.conferencia.ok,'a reforma tem casa, cachoeira, ponte, escada, armadilhas, alavancas, árvores e relevo: '+r1.r.depois.conferencia.falta);
 assert.equal(r1.r.depois.reforma,3,'o mapa fica marcado como reforma v3');
 if(process.env.DEBUG_MAPA){await page.evaluate(()=>{window.__sig1=window.mesaEditorRapidoV197.objetos().map(x=>(x.erTipo||x.tipo||'?')+'|'+(x.nome||'')+'|'+x.x.toFixed(2)+','+x.y.toFixed(2)+'|'+(+x.larguraM).toFixed(1)+'x'+(+x.alturaM).toFixed(1));});console.log('andar2 em 1:',await page.evaluate(()=>window.mesaEditorRapidoV197.objetos().filter(x=>Number(x.andarV144||1)>1).map(x=>(x.erTipo||x.tipo)+':'+(x.nome||'')).join(',')));console.log('tipos 1:',JSON.stringify(await page.evaluate(()=>{const g={};for(const x of window.mesaEditorRapidoV197.objetos()){const k=x.erTipo||x.tipo||'?';g[k]=(g[k]||0)+1;}return g;})));const d=await page.evaluate(()=>{const o=window.mesaEditorRapidoV197.objetos();const g={};for(const x of o){if(!x.bloqueiaMovimento)continue;const k=(x.erTipo||x.tipo||'?')+(x.colisaoV177?'*':'');g[k]=(g[k]||0)+1;}return {bloqueiam:g,pocas:o.filter(x=>x.erPoca||x.pocaV198).map(x=>({n:x.nome,e:x.erPoca,p:x.pocaV198,w:+x.larguraM.toFixed(1),h:+x.alturaM.toFixed(1),x:+(x.x*80/28).toFixed(1),y:+(x.y*50/14).toFixed(1)})).slice(0,6),camas:o.filter(x=>/cama|b[aá]u|mesa|estante|escriv/i.test(x.nome||'')).map(x=>({n:x.nome,b:x.bloqueiaMovimento,w:x.larguraM})).slice(0,8)};});console.log('DEBUG',JSON.stringify(d));}
 assert.ok(r1.r.movidos.filter(m=>!m.erro).length>=2,'zumbi (parede) e larva (água funda) foram movidos: '+JSON.stringify(r1.r.movidos));
 assert.ok(!r1.r.movidos.some(m=>/cila/.test(m.id)),'a cila continua na água');
 const estado1=await page.evaluate(id=>{const S=window.__fs,tk=[...S].filter(([k,v])=>/posicoes[/]/.test(k)&&v.mapaId===id).map(([k,v])=>({k:k.split('/').pop(),x:v.x,y:v.y,dono:v.donoUid,nome:v.nome}));return {tk,saude:S.get('combatesAtivos/mapaMesaSyncSaude')};},id);
 const jog=estado1.tk.find(t=>t.k==='jogador_teste_1');assert.ok(jog&&jog.dono==='jog1','o personagem do jogador mantém id e dono');
 assert.ok(estado1.tk.some(t=>/zumbi_1/.test(t.k)&&t.k.includes('~101')),'o zumbi antigo continua com a mesma identidade');
 assert.ok(estado1.saude.actors['jogador_teste_1'],'a saúde do jogador não foi apagada');
 const manifesto=await page.evaluate(()=>import('./js/mesa-ecossistema.js').then(m=>m.POPULACAO.map(([e,q])=>[e,q])).catch(()=>null));
 // ===== segunda aplicação: nada duplica
 const r2=await page.evaluate(async id=>{const R=window.mesaReformaTeste;const r=await R.aplicar(id);return {obj:r.depois.objetos,cri:r.depois.criaturas,novas:r.colocados,tk:[...window.__fs.keys()].filter(k=>/posicoes[/]/.test(k)&&window.__fs.get(k).mapaId===id).length};},id);
 console.log('2ª aplicação:',JSON.stringify(r2));
 if(process.env.DEBUG_MAPA){console.log('andar2 em 2:',await page.evaluate(()=>window.mesaEditorRapidoV197.objetos().filter(x=>Number(x.andarV144||1)>1).map(x=>(x.erTipo||x.tipo)+':'+(x.nome||'')).join(',')));console.log('DIF:',JSON.stringify(await page.evaluate(()=>{const b=window.mesaEditorRapidoV197.objetos().map(x=>(x.erTipo||x.tipo||'?')+'|'+(x.nome||'')+'|'+x.x.toFixed(2)+','+x.y.toFixed(2)+'|'+(+x.larguraM).toFixed(1)+'x'+(+x.alturaM).toFixed(1));const c=new Map();for(const k of window.__sig1)c.set(k,(c.get(k)||0)+1);for(const k of b)c.set(k,(c.get(k)||0)-1);return [...c].filter(([,v])=>v).map(([k,v])=>v+'x '+k).slice(0,12);})));console.log('tipos 2:',JSON.stringify(await page.evaluate(()=>{const g={};for(const x of window.mesaEditorRapidoV197.objetos()){const k=x.erTipo||x.tipo||'?';g[k]=(g[k]||0)+1;}return g;})));}
 assert.equal(r2.obj,r1.r.depois.objetos,'reaplicar não duplica prédios nem armadilhas');assert.equal(r2.novas,0,'reaplicar não cria criaturas repetidas');assert.equal(r2.tk,estado1.tk.length,'o número de tokens é o mesmo');
 // ===== resetar o teste: criaturas voltam, jogador intocado
 await page.evaluate(id=>{const S=window.__fs;for(const [k,v] of S)if(/synccriatura/.test(k)&&v.mapaId===id){S.set(k,{...v,x:1,y:1});break;}S.set('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1',{...S.get('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1'),x:5,y:3});},id);
 const r3=await page.evaluate(async id=>{const R=window.mesaReformaTeste;const r=await R.resetar(id);const j=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1');return {r,jx:j.x,jy:j.y,dono:j.donoUid,tk:[...window.__fs.keys()].filter(k=>/posicoes[/]/.test(k)&&window.__fs.get(k).mapaId===id).length};},id);
 console.log('reset:',JSON.stringify(r3));
 assert.ok(r3.jx===5&&r3.jy===3&&r3.dono==='jog1','o reset não mexe no jogador');assert.equal(r3.tk,estado1.tk.length,'o reset recoloca as mesmas criaturas, sem duplicar');
 // ===== restaurar o backup da 1ª aplicação: volta o muro antigo e os tokens antigos
 const rs=await page.evaluate(async({id,bk})=>{const R=window.mesaReformaTeste;await R.restaurar(bk);const S=window.__fs;const cena=S.get('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id))||S.get('combatesAtivos/mapaMesaSyncDiretaCena');return {obj:(cena?.objects||[]).length,tk:[...S].filter(([k,v])=>/posicoes[/]/.test(k)&&v.mapaId===id).map(([k])=>k.split('/').pop())};},{id,bk:r1.r.backup});
 console.log('restaurado:',JSON.stringify(rs));
 assert.equal(rs.tk.length,4,'o backup devolve exatamente os 4 tokens de antes: '+rs.tk.join(','));assert.ok(rs.obj<antes.inv.objetos+5,'a cena volta à antiga (poucas peças)');
 const errosReais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));
 console.log('erros:',errosReais.length?errosReais.join(' | '):'nenhum');assert.equal(errosReais.length,0,'sem erros de console');
 console.log('PASS reforma do mapa de teste (harness local, Firestore e papel simulados)');
 await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
