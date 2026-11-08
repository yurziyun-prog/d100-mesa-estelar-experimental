// Cachoeira animada: o canvas existe dentro do objeto, muda com o tempo (fluxo contínuo) e não cobre as pedras. VALIDAÇÃO: harness local.
const assert=require('assert/strict'),path=require('path');
const {preparar,root}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page,erros}=await preparar();
 const K='combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1';
 await page.evaluate(K=>{const t=window.__fs.get(K);window.__fsWrite(K,{...t,x:+(17.5/80*28).toFixed(3),y:+(19/50*14).toFixed(3)});},K);await page.waitForTimeout(2500);
 const info=await page.evaluate(()=>{const c=document.querySelector('canvas.cq-agua');if(!c)return null;const r=c.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height),pai:c.parentElement.dataset.sceneObject,primeiro:c.parentElement.firstElementChild===c};});
 console.log('canvas da cachoeira:',JSON.stringify(info));assert.ok(info,'a cachoeira tem canvas animado');assert.equal(info.primeiro,true,'a água fica por baixo da imagem das pedras');
 const hash=()=>page.evaluate(()=>{const c=document.querySelector('canvas.cq-agua');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=37)h=(h*31+d[i]+d[i+1]*3)|0;return h;});
 const hs=[];for(let i=0;i<6;i++){hs.push(await hash());await page.waitForTimeout(260);}
 console.log('hashes de quadros:',hs.join(','));assert.ok(new Set(hs).size>=5,'o fluxo muda quadro a quadro (animação contínua)');
 // o miolo tem água, as bordas esmaecem
 const alfa=await page.evaluate(()=>{const c=document.querySelector('canvas.cq-agua'),g=c.getContext('2d');const a=(x,y)=>g.getImageData(x,y,1,1).data[3];return {meio:a(48,100),borda:a(2,100),poco:a(48,230)};});
 console.log('alfa:',JSON.stringify(alfa));assert.ok(alfa.meio>150&&alfa.borda<20&&alfa.poco>150,'água no canal, nada fora dele');
 await page.screenshot({path:path.join(root,'docs','antes-depois','cachoeira-depois.png')});
 const {velocidadeFluxo}=await import(require('url').pathToFileURL(path.join(root,'js','mesa-cachoeira.js')).href);
 assert.ok(velocidadeFluxo(.05)<velocidadeFluxo(.15)&&velocidadeFluxo(.15)<velocidadeFluxo(.3)&&velocidadeFluxo(.95)<velocidadeFluxo(.3),'acelera até a queda e desacelera no poço');
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS cachoeira animada [harness local]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
