// Giros e movimento espontâneo (hipótese: arte3d lia o retângulo na tela). VALIDAÇÃO: harness local; não prova o PC/rede reais.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
const log=(...a)=>console.log(...a);
(async()=>{
 const {H,page,erros}=await preparar();
 const K='combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1';
 const lerA3d=()=>page.evaluate(()=>{const n=document.querySelector('#novaSyncBoard [data-token="jogador_teste_1"]');const e=n?.querySelector('.a3d');return e?{acao:e.dataset.acao,rot:e.style.rotate,quadro:e.dataset.quadro}:null;});
 const mover=(xm,ym)=>page.evaluate(({xm,ym,K})=>{const t=window.__fs.get(K);window.__fsWrite(K,{...t,x:+(xm/80*28).toFixed(3),y:+(ym/50*14).toFixed(3)});},{xm,ym,K});
 const angulo=s=>parseFloat(String(s||'0'));
 await mover(46,26);await page.waitForTimeout(1500);
 const base=await lerA3d();log('parado, antes:',JSON.stringify(base));assert.ok(base,'a miniatura tem arte 3D');
 // 1) parado + pan/zoom/rolagem: nada de andar nem girar
 const amostra=[];
 for(const passo of ['zoom+','zoom-','pan','scroll']){
  await page.evaluate(p=>{const b=document.getElementById('novaSyncBoard');const r=b.getBoundingClientRect();const ev=(t,o)=>b.dispatchEvent(new WheelEvent(t,{bubbles:true,cancelable:true,clientX:r.x+r.width/2,clientY:r.y+r.height/2,...o}));
   if(p==='zoom+')ev('wheel',{deltaY:-300,ctrlKey:true});if(p==='zoom-')ev('wheel',{deltaY:300,ctrlKey:true});if(p==='scroll'){window.scrollBy(0,120);b.parentElement&&(b.parentElement.scrollLeft+=80);}
   if(p==='pan'){b.style.transform=(b.style.transform||'')+' translate(37px,23px)';}
  },passo);
  await page.waitForTimeout(700);amostra.push([passo,await lerA3d()]);
 }
 log('parado com pan/zoom/rolagem:',JSON.stringify(amostra));
 for(const [p,a] of amostra){assert.equal(a.acao,'parado','parado continua parado após '+p);assert.equal(a.rot,base.rot,'rumo não muda após '+p);}
 // 2) trajeto reto para leste e depois para oeste (cruza ±180°): o giro deve ser curto (o menor arco)
 const rots=[];const seg=async(dx,dy,n)=>{for(let i=0;i<n;i++){const p=await page.evaluate(K=>{const t=window.__fs.get(K);return {x:t.x*80/28,y:t.y*50/14};},K);await mover(p.x+dx,p.y+dy);await page.waitForTimeout(120);rots.push(angulo((await lerA3d()).rot));}};
 await seg(.35,0,14);const leste=rots.at(-1);await seg(-.35,0,14);const oeste=rots.at(-1);await seg(0,.35,14);const sul=rots.at(-1);
 log('rumos (graus) leste/oeste/sul:',leste.toFixed(1),oeste.toFixed(1),sul.toFixed(1));
 let maior=0;for(let i=1;i<rots.length;i++)maior=Math.max(maior,Math.abs(rots[i]-rots[i-1]));
 log('maior salto entre quadros (graus):',maior.toFixed(1));
 assert.ok(maior<=185,'nenhum salto > meia volta entre amostras (rotações contínuas, arco curto)');
 const norm=a=>((a%360)+540)%360-180;
 assert.ok(Math.abs(norm(oeste-leste))>150&&Math.abs(norm(oeste-leste))<210,'oeste fica a ~180° do leste');
 // 3) parar: guarda o rumo
 await page.waitForTimeout(800);const parou=await lerA3d();log('parada:',JSON.stringify(parou));assert.equal(parou.acao,'parado');assert.ok(Math.abs(norm(angulo(parou.rot)-sul))<5,'ao parar conserva o último rumo');
 // 4) jitter de rede: ±0,05 m não vira
 const antes=angulo((await lerA3d()).rot);for(let i=0;i<10;i++){const p=await page.evaluate(K=>{const t=window.__fs.get(K);return {x:t.x*80/28,y:t.y*50/14};},K);await mover(p.x+(i%2?.05:-.05),p.y+(i%2?-.04:.04));await page.waitForTimeout(100);log("  jit",i,JSON.stringify(p),(await lerA3d()).rot);}
 await page.waitForTimeout(500);const dep=angulo((await lerA3d()).rot);log('jitter: rumo',antes.toFixed(1),'→',dep.toFixed(1));assert.ok(Math.abs(norm(dep-antes))<25,'jitter pequeno não gira o personagem');
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 log('PASS giros: parado+pan/zoom/rolagem, arco curto ±180°, parada, jitter [harness local]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
