const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://support.test/**',route=>{const file=new URL(route.request().url()).pathname.slice(1);return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/html',body:file.endsWith('.js')?fs.readFileSync(path.join(__dirname,'../js',file),'utf8'):'<html><body style="background:#19152c;color:white;font:16px sans-serif"><div id="novaSyncActionPanel"></div><div id="novaSyncActionParking"><button id="novaSyncNext">Passar</button></div></body></html>'});});
 await page.goto('https://support.test/');
 await page.evaluate(async()=>{
  const {criarPainelAcoes}=await import('/nova-painel.js'),{resolverSocorros,resolverPsi}=await import('/nova-suporte.js'),{iniciarIniciativa,acaoIniciativa}=await import('/nova-turnos.js');
  const a={id:'a',nome:'Médico',x:1,y:1,actions:3,initiative:20},b={id:'b',nome:'Paciente',x:2,y:1,actions:2,initiative:10};
  let health={actors:{a:{combateLab:{hit:{Peito:7},hitMax:{Peito:7}}},b:{combateLab:{hit:{Peito:-1,Cabeça:2},hitMax:{Peito:7,Cabeça:4},inconsciente:true}}}},map={combat:iniciarIniciativa([a,b],'s',()=>1)},inventory={mochila:[{nome:'Kit',usosRestantes:5}]};
  const info=()=>({firstAid:{value:100},health:health.actors.a.combateLab,targetHealth:health.actors.b.combateLab,kits:[{comp:'mochila',index:0,uses:inventory.mochila[0].usosRestantes}],inventory,powers:[{id:'cura_psi',name:'Cura',cost:1,value:100,description:'1 PV por PP'}],psiMax:10,psiSpent:0});
  const load=async t=>({skills:[{id:'per:primeiros_socorros',nome:'Primeiros Socorros',valor:100,weapons:[]}],health:health.actors[t.id].combateLab,support:info()});
  const render=()=>panel(a,map.combat,map.combat.activeId==='a',{health:health.actors.a,allHealth:health.actors,tokens:[a,b],targetId:'b'});
  const panel=criarPainelAcoes({root:document,load,roll:()=>({die:20,grau:'Sucesso'}),support:async payload=>{
   const cmd={...payload,id:'test',personagemId:'a'},args={a,b:payload.targetId==='a'?a:b,health,map,cmd,info:info(),seed:1,positions:[a,b]};
   const result=payload.kind==='direct-psi'?resolverPsi(args):resolverSocorros(args);health={actors:result.actors};map.combat=result.combat;if(result.inventory)inventory=result.inventory;await render();return result.message;
  }});
  window.advance=async()=>{const round=map.combat.round;while(map.combat.round===round)map.combat=acaoIniciativa(map.combat,'spend',map.combat.turnId);await render();};window.inspect=()=>({health,map,inventory});await render();
 });
 await page.locator('summary').click();await page.locator('#novaSupportLocation').selectOption('Peito');await page.getByRole('button',{name:'Iniciar tratamento'}).click();
 await page.getByText('Tratamento de Peito').waitFor();assert.equal(await page.getByRole('button',{name:'Concluir e rolar'}).isDisabled(),true);
 let state=await page.evaluate(()=>inspect());assert.equal(state.inventory.mochila[0].usosRestantes,4);assert.equal(state.health.actors.b.combateLab.hit.Peito,-1);
 await page.evaluate(()=>advance());await page.getByRole('button',{name:'Continuar (+5)',exact:true}).click();await page.getByText('2/3 turnos',{exact:false}).first().waitFor();
 await page.evaluate(()=>advance());await page.getByRole('button',{name:'Concluir e rolar'}).click();
 state=await page.evaluate(()=>inspect());assert.equal(state.health.actors.a.treatment,null);assert.equal(state.health.actors.b.combateLab.inconsciente,false);assert.equal(state.inventory.mochila[0].usosRestantes,4);
 await page.evaluate(()=>advance());await page.locator('summary').click();await page.locator('#novaSupportLocation').selectOption('Cabeça');await page.locator('#novaPsiCost').fill('2');await page.getByRole('button',{name:'Usar poder'}).click();state=await page.evaluate(()=>inspect());assert.equal(state.health.actors.a.psiSpent,2);assert.equal(state.health.actors.b.combateLab.hit.Cabeça,4);
 assert.deepEqual(errors,[]);await page.screenshot({path:path.join(__dirname,'../../../suporte-combate.png'),fullPage:true});console.log('PASS navegador: selecionar parte, consumir kit, aguardar rodada, continuar, concluir, curar com PP.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
