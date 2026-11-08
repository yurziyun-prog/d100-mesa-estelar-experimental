const assert=require('node:assert/strict');const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{const D=await montarDuelo({criatura:'rastejante_de_cinzas',arma:'espada_forca',dist:1});const {page,cid,criaturaId}=D;const missing=[];page.on('response',r=>{if(r.status()===404)missing.push(r.url());});try{
 await page.evaluate(({cid,criaturaId})=>{window.__APP__.setMestre();window.mesaVida?.parar?.();window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:true,continuoV214:true,mapId:'mapa_real',auto:{[criaturaId]:false}});},{cid,criaturaId});
 await page.waitForFunction(cid=>[...document.getElementById('novaSyncPersonagem').options].some(o=>o.value===cid),cid);
 await page.evaluate(cid=>{const s=document.getElementById('novaSyncPersonagem');s.value=cid;s.dispatchEvent(new Event('change',{bubbles:true}));},cid);
 await page.waitForFunction(()=>window.__APP__.ctl().acoes().estado().sheet?.skills?.some(s=>s.weapons?.length));
 await page.evaluate(id=>window.mesaAcoesMapaAbrir_(id),criaturaId);await page.locator('#maBalao').waitFor({state:'visible'});
 const sel=page.getByLabel('Arma ativa',{exact:true});const sword=await sel.evaluate(s=>[...s.options].find(o=>/Espada de Força/.test(o.text)).value);await sel.selectOption(sword);
 await page.waitForFunction(({cid,sword})=>window.__APP__.ctl().token(cid).activeWeaponId===sword,{cid,sword});
 await page.locator('#maBalao button').filter({hasText:'×'}).count();await page.evaluate(()=>document.querySelector('#maBalao [title="Fechar"]')?.click());
 // A tecla J deve disparar a arma selecionada, não punhos.
 await page.evaluate(()=>{document.activeElement?.blur();document.getElementById('novaSyncBoard').dispatchEvent(new PointerEvent('pointerenter',{bubbles:true}));});
 await page.evaluate(id=>{const n=[...document.querySelectorAll('#novaSyncBoard [data-token]')].find(n=>n.dataset.token===id);n.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:10,clientY:10}));n.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,clientX:10,clientY:10}));},criaturaId);
 await page.waitForFunction(cid=>(window.__fs.get('combatesAtivos/mapaMesaSyncHistorico')?.entries||[]).some(e=>e.source?.id===cid),cid,{timeout:20000});
 const history=await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncHistorico').entries);assert.ok(history.length,'clique no inimigo conclui ataque');await page.waitForTimeout(3500);await page.keyboard.press('j');await page.waitForFunction(({cid,n})=>(window.__fs.get('combatesAtivos/mapaMesaSyncHistorico')?.entries||[]).filter(e=>e.source?.id===cid).length>n,{cid,n:history.filter(e=>e.source?.id===cid).length},{timeout:15000});
 // Arrasto recusa um monstro vivo; carga anda à frente e bloqueia combate.
 const carga=await page.evaluate(async ({cid,criaturaId})=>{const m=window.mesaArrastarMod;let recusado=false;try{await m.aplicar({personagemId:cid,acao:'arrastar',alvoTipo:'token',alvoId:criaturaId});}catch(e){recusado=true;}
 const p=window.__APP__.ctl().token(cid),scene=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena')||{mapId:'mapa_real',objects:[]},obj={id:'caixa_v217',nome:'Caixa solta',x:p.x+.8,y:p.y,larguraM:.4,alturaM:.4,pesoKg:10,pvAtual:10,pvMax:10,camada:1,angulo:0};window.__fsWrite('combatesAtivos/mapaMesaSyncDiretaCena',{...scene,objects:[...scene.objects,obj]});await new Promise(r=>setTimeout(r,150));await m.aplicar({personagemId:cid,acao:'arrastar',alvoTipo:'objeto',alvoId:obj.id});return {recusado,ocupado:window.mesaArrastoOcupadoV217(cid),fator:window.mesaVelocidadeV136(cid)};},{cid,criaturaId});assert.equal(carga.recusado,true);assert.equal(carga.ocupado,true);assert.ok(carga.fator>0&&carga.fator<1);
 await page.waitForFunction(cid=>{const n=document.querySelector('[data-scene-object="caixa_v217"]'),p=window.__APP__.ctl().token(cid);return n&&parseFloat(n.style.left)>p.x/28*100;},cid);
 const semAtaque=await page.evaluate(async id=>{const path='combatesAtivos/mapaMesaSyncHistorico',antes=JSON.stringify(window.__fs.get(path));await window.__APP__.ctl().acoes().executar(id);return antes===JSON.stringify(window.__fs.get(path));},criaturaId);assert.ok(semAtaque,'carga bloqueia ataque');
 await page.evaluate(cid=>window.mesaArrastarMod.aplicar({personagemId:cid,acao:'soltar'}),cid);assert.equal(await page.evaluate(cid=>window.mesaArrastoOcupadoV217(cid),cid),false);
 // Espaço envia salto e não ataque; confirmar evento, inclusive teste falho.
 const before=await page.evaluate(()=>JSON.stringify(window.__fs.get('combatesAtivos/mesaAndares')||{}));
 await page.keyboard.press('Escape');await page.evaluate(cid=>{document.activeElement?.blur();const path='combatesAtivos/mapaMesaSyncDireta/posicoes/'+cid,p=window.__fs.get(path);window.__fsWrite(path,{...p,facing:Math.PI,revision:p.revision+1});},cid);await page.keyboard.press('Space');
 await page.waitForFunction(before=>JSON.stringify(window.__fs.get('combatesAtivos/mesaAndares')||{})!==before,before,{timeout:15000});
 console.log('Recursos ausentes no cenário simulado:',missing);assert.deepEqual(D.H.erros.filter(e=>!e.startsWith('CONSOLE Failed to load resource:')),[],'sem erros JS');console.log('PASS clique e J concluem ataque; Espaço executa salto validado no motor [banco simulado]');
}finally{await D.H.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
