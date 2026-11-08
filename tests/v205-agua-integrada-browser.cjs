// Queda → canal → foz → lagoa como UMA paisagem de água: geometria conectada (nas poças SALVAS), animação da queda E da lagoa sem tokens, relógio compartilhado,
// canvas alinhado ao mundo (pan/zoom). VALIDAÇÃO: harness local. A revisão visual (fotos em docs/antes-depois/agua-integrada-*.png) complementa; não é substituída por este teste.
const assert=require('assert/strict'),path=require('path');
const {pathToFileURL}=require('url');
const {preparar,root}=require('./_mapa-reformado.cjs');
const ajudas=require('./_ajudas-percurso.cjs');
const log=(...a)=>console.log(...a);
(async()=>{
 const {geometriaDaAgua,aguaConectada}=await import(pathToFileURL(path.join(root,'js','mesa-agua-ambiente.js')).href);
 const {H,page,erros,id}=await preparar({viewport:{width:1280,height:800},removerFauna:true});
 const {colocar}=ajudas(page,id,log);
 // 1) geometria SALVA: conectividade e foz
 const objs=await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.filter(o=>o.erPoca||o.fluxoV205).map(o=>({id:o.id,x:o.x,y:o.y,larguraM:o.larguraM,alturaM:o.alturaM,erPoca:o.erPoca,rectsV201:o.rectsV201,fluxoV205:o.fluxoV205,camada:o.camada})));
 const geo=geometriaDaAgua(objs,80,50);
 log('rio: retângulos',geo.rioRects.length,'| lagoa: retângulos',geo.lagoRects.length,'| foz:',JSON.stringify(geo.foz));
 assert.ok(geo.rioRects.length>0&&geo.lagoRects.length>0,'rio (com fluxoV205) e lagoa existem nas poças salvas');
 assert.ok(aguaConectada(geo),'da nascente/queda até a lagoa há caminho contínuo de água (sem faixa de terra)');
 assert.ok(geo.foz&&geo.foz.y>17&&geo.foz.y<24,'a foz fica na entrada da lagoa: '+JSON.stringify(geo.foz));
 // 2) enquadra queda + ponte + lagoa e mede animação SEM personagem na água
 await colocar(14.5,19.2);await page.waitForTimeout(2500);
 const hash=sel=>page.evaluate(sel=>{const c=document.querySelector(sel);if(!c)return null;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=53)h=(h*31+d[i]+d[i+1]*3+d[i+3]*7)|0;return h;},sel);
 const hashRegiao=(sel,x0,y0,x1,y1)=>page.evaluate(({sel,x0,y0,x1,y1})=>{const c=document.querySelector(sel);if(!c)return null;const k=c.width/80,d=c.getContext('2d').getImageData(Math.round(x0*k),Math.round(y0*k),Math.round((x1-x0)*k),Math.round((y1-y0)*k)).data;let h=0,n=0;for(let i=0;i<d.length;i+=68){h=(h*31+d[i]+d[i+3]*5)|0;}for(let i=3;i<d.length;i+=4)n+=d[i];return {h,n};},{sel,x0,y0,x1,y1});
 const q=[],l=[],c0=[];
 for(let i=0;i<8;i++){q.push(await hash('canvas.cq-agua'));l.push((await hashRegiao('canvas.aa-ambiente',5,24,12,28))?.h);c0.push((await hashRegiao('canvas.aa-ambiente',13,19,16,22))?.h);await page.waitForTimeout(450);}
 log('queda (hashes):',q.join(','));log('lagoa ambiente, trecho vazio (hashes):',l.join(','));log('foz/canal (hashes):',c0.join(','));
 assert.ok(new Set(q).size>=6,'a queda se move');assert.ok(new Set(l).size>=6,'a lagoa ondula sozinha, sem personagem');assert.ok(new Set(c0).size>=6,'o canal e a foz se movem');
 const pintado=await hashRegiao('canvas.aa-ambiente',5,24,12,28);assert.ok(pintado.n>5000,'a lagoa recebe ondulação visível (alfa acumulado '+pintado.n+')');
 const seco=await hashRegiao('canvas.aa-ambiente',30,30,36,34);assert.equal(seco.n,0,'fora da água não há nada desenhado (recorte pelas poças)');
 // 3) alinhado ao mundo (pan/zoom): mesmo retângulo da camada do mundo e mesmo z abaixo dos objetos
 const al=await page.evaluate(()=>{const c=document.querySelector('canvas.aa-ambiente'),w=document.querySelector('#novaSyncBoard [data-world-layer]');const a=c.getBoundingClientRect(),b=w.getBoundingClientRect();return {dx:Math.abs(a.left-b.left),dw:Math.abs(a.width-b.width),dh:Math.abs(a.height-b.height),z:c.style.zIndex,pai:c.parentElement===w};});
 log('alinhamento com o mundo:',JSON.stringify(al));assert.ok(al.pai&&al.dx<1&&al.dw<1&&al.dh<1,'o canvas é filho do mundo e coincide com ele (acompanha pan/zoom)');
 // 4) rastro de personagem SOMA ao ambiente (camadas distintas): entra na lagoa, ambiente continua e o efeito local aparece
 const antes=await hashRegiao('canvas.aa-ambiente',5,24,12,28);
 await colocar(8.5,26);await page.waitForTimeout(1800);
 const depois=await hashRegiao('canvas.aa-ambiente',5,24,12,28);const ef=await page.evaluate(()=>{const c=document.getElementById('agCamada');if(!c)return -1;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>20)n++;return n;});
 log('com personagem na lagoa: ambiente continua pintado (',depois.n,') e o efeito local tem',ef,'pixels');assert.ok(depois.n>5000&&ef>100,'ondas ambientes e rastro local coexistem');
 await colocar(14.5,19.2);await page.waitForTimeout(1500);
 for(let i=1;i<=3;i++){await page.screenshot({path:path.join(root,'docs','antes-depois','agua-integrada-'+i+'.png')});await page.waitForTimeout(1500);}
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 log('PASS água integrada [harness local]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
