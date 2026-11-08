// Régua de escala: humano, macaco, carniçal, chefe, montaria, predadores... lado a lado, mesmo piso e zoom. VALIDAÇÃO: harness local.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {preparar,root}=require('./_mapa-reformado.cjs');
const ORDEM=['zumbi_1','cadaver_de_chefe','criatura_de_calico_1','criatura_de_calico_2','insetoide_predador','insetoide_predador_1','escavador_de_carapaca','predador_couracado','cavalgante_prismatico','besta_ululante','montariapterodatil','dragao_trombeta_corredor_domesticado','dragao_trombeta_alado_selvagem','carrapato_de_ferro','rastejante_de_cinzas','vespa_de_vidro'];
(async()=>{
 const {H,page,erros}=await preparar();
 const r=await page.evaluate(({ORDEM})=>{
  const S=window.__fs,K='combatesAtivos/mapaMesaSyncDireta/posicoes/',mapa=S.get(K+'jogador_teste_1').mapaId;
  for(const [p] of [...S])if(/posicoes[/]/.test(p)&&!/jogador_teste_1/.test(p))S.delete(p);
  // jogadora no meio de uma clareira vazia (o acampamento), criaturas em duas fileiras
  const base=window.__moldes;let col=0;const colocados=[];
  const pos=(i)=>({x:8+(i%8)*8.5,y:i<8?19:31}); // metros no campo central
  ORDEM.forEach((id,i)=>{const m=base.find(([p])=>decodeURIComponent(p).endsWith('synccriatura:'+id)||decodeURIComponent(p).includes('synccriatura:'+id+'~'));if(!m){colocados.push(id+' (sem molde)');return;}
   const p=pos(i);S.set(K+m[0].split('/').pop(),{...m[1],x:+(p.x/80*28).toFixed(3),y:+(p.y/50*14).toFixed(3),mapaId:mapa});colocados.push(id);});
  const jt=S.get(K+'jogador_teste_1');window.__fsWrite(K+'jogador_teste_1',{...jt,x:+(4/80*28).toFixed(3),y:+(25/50*14).toFixed(3)});
  return colocados;},{ORDEM});
 console.log('colocados:',r.join(', '));
 await page.waitForTimeout(3500);
 const med=await page.evaluate(()=>{const b=document.getElementById('novaSyncBoard'),mw=Number(b.dataset.mapWidth)||28,pxm=b.offsetWidth/mw;
  return {pxm:+pxm.toFixed(2),itens:[...b.querySelectorAll('[data-token]')].map(n=>{const e=n.querySelector('.a3d');if(!e)return null;const r=e.getBoundingClientRect();return {id:decodeURIComponent(n.dataset.token).replace('synccriatura:','').slice(0,34),a3:n.dataset.arte3d,quadroM:+(r.width/(b.getBoundingClientRect().width/mw)).toFixed(2),disco:getComputedStyle(n).backgroundColor!=='rgba(0, 0, 0, 0)'||getComputedStyle(n).boxShadow!=='none'};}).filter(Boolean)};});
 console.log(JSON.stringify(med.itens));
 const {ESCALA_FISICA}=await import(require('url').pathToFileURL(path.join(root,'js','mesa-escala-fisica.js')).href);
 const LEG=!!process.env.ARTE_LEGADA;if(LEG)console.log('(modo ANTES: arte legada, sem escala física nem remoção de discos; sem asserções de escala)');
 for(const it of LEG?[]:med.itens){const f=ESCALA_FISICA[it.a3];if(f)assert.ok(Math.abs(it.quadroM-f.metros)<.08,it.id+': quadro '+it.quadroM+' m deveria ser '+f.metros+' m');assert.equal(it.disco,false,it.id+' sem disco/aura/sombra redonda');}
 // fotos: a câmera segue a jogadora; ela vai para junto de cada grupo e a régua é fotografada no zoom normal do jogo
 const K='combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1';
 const grupos=[[6,25],[24,25],[42,25],[60,25]];let n=0;
 for(const [gx,gy] of grupos){await page.evaluate(({K,gx,gy})=>{const t=window.__fs.get(K);window.__fsWrite(K,{...t,x:+(gx/80*28).toFixed(3),y:+(gy/50*14).toFixed(3)});},{K,gx,gy});await page.waitForTimeout(1600);
  const bb=await page.evaluate(()=>{const b=document.getElementById('novaSyncBoard').getBoundingClientRect();return {x:Math.max(0,b.x),y:Math.max(0,b.y),w:Math.min(b.width,1400),h:Math.min(b.height,760)};});
  await page.screenshot({path:path.join(root,'docs','antes-depois','escala-'+(LEG?'antes':'depois')+'-'+(++n)+'.png')});}
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS escala física e sem discos [harness local]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
