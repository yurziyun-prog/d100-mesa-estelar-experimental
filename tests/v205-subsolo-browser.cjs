// Subsolo real: descer pelo alçapão (andando), nível -3 m, superfície escondida, escuridão total sem luz, lanterna ilumina só o permitido,
// teto da caverna abre só para quem está dentro e no mesmo nível, volta pela rampa. VALIDAÇÃO: harness local, papel de jogador simulado, mestre simulado por instantes.
const assert=require('assert/strict'),path=require('path');
const {preparar,root}=require('./_mapa-reformado.cjs');
const ajudas=require('./_ajudas-percurso.cjs');
const rel=[];const log=(...a)=>{console.log(...a);rel.push(a.join(' '));};
(async()=>{
 const {H,page,erros,id}=await preparar();
 const {pos,segurar,mestreProcessa,colocar}=ajudas(page,id,log);
 const K='combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1';
 const estado=()=>page.evaluate(()=>({nivel:window.mesaAndarV144.visto(),elev:window.mesaAndarV144.elevacaoVista(),escura:window.mesaEscuridaoV205.ligada(),fontes:window.mesaEscuridaoV205.fontes().map(f=>f.tipo)}));
 // alfa do preto a (dx,dy) metros do centro do token da jogadora (0 = vê, 255 = escuro)
 const alfaEm=(dx,dy)=>page.evaluate(({dx,dy})=>{const cv=document.getElementById('esCamada');if(!cv||cv.style.display==='none')return -1;const t=document.querySelector('#novaSyncBoard [data-token="jogador_teste_1"]').getBoundingClientRect(),sr=cv.parentElement.getBoundingClientRect(),e=cv.width/sr.width,b=document.getElementById('novaSyncBoard').getBoundingClientRect(),pxm=b.width/80;const x=Math.round((t.left+t.width/2+dx*pxm-sr.left)*e),y=Math.round((t.top+t.height/2+dy*pxm-sr.top)*e);return cv.getContext('2d').getImageData(Math.max(0,Math.min(cv.width-1,x)),Math.max(0,Math.min(cv.height-1,y)),1,1).data[3];},{dx,dy});
 const alfaNoToken=()=>alfaEm(0,0);
 const tetos=()=>page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena'),b=document.getElementById('novaSyncBoard');return (c.objects||[]).filter(o=>o.erTipo==='telhado'&&/Pedra|Rocha/.test(o.nome)).map(o=>{const n=b.querySelector('[data-scene-object="'+CSS.escape(String(o.id))+'"]');return {x:+(o.x*80/28).toFixed(0),y:+(o.y*50/14).toFixed(0),op:n?getComputedStyle(n).opacity:'sem nó'};});});
 const posiciona=(x,y,andar)=>page.evaluate(({K,x,y,andar})=>{const t=window.__fs.get(K);window.__fsWrite(K,{...t,x:+(x/80*28).toFixed(3),y:+(y/50*14).toFixed(3),andarV144:andar,revision:(t.revision||0)+1});},{K,x,y,andar});
 // ===== 1) teto da caverna: fora = fechado; dentro (mesmo nível) = aberto
 await colocar(51,29.8);await page.waitForTimeout(1500);
 const fora=await tetos();log('tetos de pedra com a jogadora FORA da caverna:',JSON.stringify(fora));assert.ok(fora.length>=2&&fora.every(t=>t.op==='1'),'teto de rocha fechado por fora');
 await colocar(60,30);await page.waitForTimeout(1800);
 const dentro=await tetos();log('tetos com a jogadora DENTRO do retângulo da caverna (superfície):',JSON.stringify(dentro));assert.equal(dentro.find(t=>t.x===66)?.op,'0','o teto da caverna abre para quem está dentro, no mesmo nível');
 // ===== 2) descer pelo alçapão ANDANDO (sem botão)
 await colocar(46.4,29.1);
 const e0=await estado();assert.equal(e0.nivel,1);assert.equal(e0.escura,false,'superfície: sem escuridão');
 await segurar('KeyD',q=>q.andar!==1||Math.hypot(48.2-q.x,28.6-q.y)<.8,6000,'andando para o alçapão');await page.waitForTimeout(900);await mestreProcessa(3500);await page.waitForTimeout(600);
 const p1=await pos();log('depois do alçapão:',JSON.stringify(p1));assert.equal(p1.andar,9,'desceu ao nível 9 (subsolo)');
 await page.waitForTimeout(900);const e1=await estado();log('estado no subsolo:',JSON.stringify(e1));assert.equal(e1.elev,-3,'elevação -3 m (ID positivo, altura negativa)');assert.equal(e1.nivel,9);assert.equal(e1.escura,true,'escuridão ligada no subsolo');
 // a superfície some e o subsolo aparece
 const vis=await page.evaluate(()=>{const b=document.getElementById('novaSyncBoard'),c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');let sup=0,sub=0,supOcultos=0,subVisiveis=0;for(const o of c.objects){const n=b.querySelector('[data-scene-object="'+CSS.escape(String(o.id))+'"]');if(!n)continue;const a=o.andarV144||1,v=getComputedStyle(n).visibility;if(o.andarAmbosV144)continue;if(a===1){sup++;if(v==='hidden')supOcultos++;}if(a===9){sub++;if(v!=='hidden')subVisiveis++;}}return {sup,supOcultos,sub,subVisiveis};});
 log('visibilidade no subsolo:',JSON.stringify(vis));assert.ok(vis.supOcultos>=vis.sup*.95,'quase tudo da superfície escondido');assert.ok(vis.subVisiveis>=vis.sub*.95,'o subsolo aparece');
 // ===== 3) escuridão: perto do alçapão há claridade; sala funda sem luz é preto
 await posiciona(48.6,29.6,9);await page.waitForTimeout(1200);
 await page.screenshot({path:path.join(root,'docs','antes-depois','subsolo-entrada.png')});const aPerto=await alfaNoToken(),aLonge=await alfaEm(-4.3,0);log('alfa do preto: junto da entrada =',aPerto,'| 4,3 m para o fundo da câmara =',aLonge);
 assert.ok(aPerto<200,'junto da abertura há claridade');assert.equal(aLonge,255,'fora do alcance da abertura é preto total');
 // teto da caverna NÃO abre para quem está embaixo (outro nível)
 await posiciona(66,29.5,9);await page.waitForTimeout(1500);
 const emBaixo=await tetos();log('tetos com a jogadora no SUBSOLO sob a caverna:',JSON.stringify(emBaixo));assert.equal(emBaixo.find(t=>t.x===66)?.op,'1','quem está embaixo não abre o teto da superfície');
 // sala funda (D): sem fonte, tudo preto, inclusive em volta do token
 await posiciona(66,37,9);await page.waitForTimeout(1200);
 const aFundo=await alfaNoToken(),aFundo2=await alfaEm(1.5,0);log('sala funda sem luz:',aFundo,aFundo2);assert.equal(aFundo,255);assert.equal(aFundo2,255);
 // lanterna EMPUNHADA (letra L no visual, como o equipamento grava): revela só uma área
 await page.evaluate(({K})=>{const t=window.__fs.get(K);window.__fsWrite(K,{...t,visualV203:(t.visualV203||'')+';z=L',revision:(t.revision||0)+1});},{K});await page.waitForTimeout(1300);
 const aLant=await alfaNoToken(),aLonge2=await alfaEm(11,0),aTras=await alfaEm(-6,0);log('com lanterna: token',aLant,'| 11 m adiante',aLonge2,'| 6 m atrás',aTras);
 await page.screenshot({path:path.join(root,'docs','antes-depois','subsolo-lanterna.png')});assert.ok(aLant<80,'a lanterna ilumina onde a jogadora está');assert.equal(aLonge2,255,'além do alcance continua preto');
 // guardar a lanterna (tirar do equipamento) devolve a escuridão
 await page.evaluate(({K})=>{const t=window.__fs.get(K);window.__fsWrite(K,{...t,visualV203:String(t.visualV203||'').replace(/;z=L/,''),revision:(t.revision||0)+1});},{K});await page.waitForTimeout(1300);
 assert.equal(await alfaNoToken(),255,'sem a lanterna, preto de novo');
 // ===== 4) subir de volta pela rampa da boca (andando) — volta à superfície e a luz natural volta
 await posiciona(56.4,29.4,9);await page.waitForTimeout(1200);
 await segurar('KeyA',q=>q.andar!==9||Math.hypot(54.4-q.x,29.4-q.y)<.8,6000,'andando para a rampa da boca');await page.waitForTimeout(900);await mestreProcessa(3500);await page.waitForTimeout(600);
 const p2=await pos();log('depois da rampa:',JSON.stringify(p2));assert.equal(p2.andar,1,'voltou à superfície');
 await page.waitForTimeout(600);const e2=await estado();assert.equal(e2.escura,false,'na superfície a escuridão some');assert.equal(e2.elev,0);
 await page.screenshot({path:path.join(root,'docs','antes-depois','subsolo-volta.png')});
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));log('erros:',reais.length?reais.join('|'):'nenhum');assert.equal(reais.length,0);
 log('PASS subsolo [harness local; papel simulado; mestre simulado por instantes]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
