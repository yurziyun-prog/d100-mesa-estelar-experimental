// Lava no mapa reformado: queima no contato, mais no núcleo, perigo crescente; ponte firme e voo alto não queimam; o calor da borda é leve.
// VALIDAÇÃO: harness local; o mestre online é SIMULADO por alguns segundos (quem aplica a queimadura é o mestre, uma vez por intervalo).
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
const ajudas=require('./_ajudas-percurso.cjs');
const log=(...a)=>console.log(...a);
(async()=>{
 const {H,page,erros,id}=await preparar();
 const {mestreProcessa,colocar}=ajudas(page,id,log);
 const hist=()=>page.evaluate(()=>(window.__fs.get('combatesAtivos/mapaMesaSyncHistorico')?.entries||[]).map(e=>String(e.message)));
 const dados=await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c.objects||[]).filter(o=>o.perigoLavaV205||o.suporteLavaV205).map(o=>({nome:o.nome,perigo:o.perigoLavaV205,suporte:!!o.suporteLavaV205,x:+(o.x*80/28).toFixed(1),y:+(o.y*50/14).toFixed(1),w:o.larguraM,h:o.alturaM}));});
 log('regiões de perigo no mapa:',JSON.stringify(dados));assert.ok(dados.some(d=>d.perigo?.tipo==='lava')&&dados.some(d=>d.perigo?.tipo==='nucleo'),'lava, núcleo e ponte firme existem como DADOS');
 const reanima=()=>page.evaluate(()=>{const k='combatesAtivos/mapaMesaSyncSaude',d=JSON.parse(JSON.stringify(window.__fs.get(k)||{actors:{}}));const c=d.actors?.jogador_teste_1?.combateLab;if(c){c.inconsciente=false;c.morto=false;window.__fsWrite(k,d);}});
 const novas=async(antes)=>(await hist()).slice(antes).filter(m=>/🔥/.test(m));
 // 1) núcleo: queimaduras repetidas, perigo crescente
 // o dano é sorteado (4d6): se a primeira queimadura derruba a jogadora, os intervalos seguintes não queimam. O teste zera a saúde dela e tenta de novo (até 4x), registrando as tentativas.
 const zeraSaude=()=>page.evaluate(()=>{const k='combatesAtivos/mapaMesaSyncSaude',d=JSON.parse(JSON.stringify(window.__fs.get(k)||{actors:{}}));if(d.actors?.jogador_teste_1){delete d.actors.jogador_teste_1.combateLab;window.__fsWrite(k,d);}});
 let h0,n1=[];for(let t=1;t<=4;t++){await zeraSaude();h0=(await hist()).length;await colocar(68,43);await mestreProcessa(8500);n1=await novas(h0);log('tentativa '+t+' no núcleo:',n1.length,'queimaduras');if(n1.length>=2)break;}
 {} log('no núcleo da lava, 8,5 s:',JSON.stringify(n1));assert.ok(n1.length>=2,'queima periodicamente (uma vez por intervalo)');assert.ok(n1.some(m=>/núcleo/.test(m)),'núcleo é identificado');assert.ok(n1.some(m=>/crescente/.test(m)),'perigo crescente aparece na 2ª queimadura');
 assert.ok(n1.length<=4,'nunca a cada quadro/cliente: '+n1.length+' queimaduras em 8,5 s');
 // 2) (a ponte de crosta foi removida do mapa; o contrato de suporte continua coberto no teste unitário v205-lava)
 // 3) voo alto: sem contato
 await page.evaluate(()=>{window.__voaAntes=window.mesaVoandoV203;window.mesaVoandoV203=()=>true;});
 h0=(await hist()).length;await colocar(65,46.5);await mestreProcessa(5000);
 const n3=await novas(h0);log('voando alto sobre a lava:',JSON.stringify(n3));assert.equal(n3.length,0,'quem voa a 5 m não recebe dano de contato');
 await page.evaluate(()=>{window.mesaVoandoV203=window.__voaAntes;});
 // 4) calor da borda: leve (só calor)
 // o ponto da borda sai da GEOMETRIA REAL da cena (fora de toda lava/núcleo, dentro da margem de calor, fora de qualquer ponte): a forma da lava é irregular e um ponto fixo cai ora na margem, ora na lava, ora sobre a ponte
 const borda=await page.evaluate(async()=>{const L=await import('/js/mesa-lava.js?v=205');const objs=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects||[],z=L.zonasDeLava(objs,80,50),sp=L.suportesDeLava(objs,80,50);let melhor=null;
  for(let y=36;y<=52;y+=.5)for(let x=56;x<=80;x+=.5){const k=L.contatoComLava({x,y},z,sp,0,1),dentroLava=z.some(q=>q.rects.some(([rx,ry,rw,rh])=>x>=rx&&x<=rx+rw&&y>=ry&&y<=ry+rh)),sobrePonte=sp.some(q=>x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1);
   if(k&&k.calor&&!dentroLava&&!sobrePonte){const d=Math.hypot(x-64,y-42);if(!melhor||d<melhor.d)melhor={x,y,d,tipo:k.tipo,dano:k.dano};}}
  return melhor;});
 log('ponto de borda (fora da lava, na margem de calor, fora da ponte):',JSON.stringify(borda));assert.ok(borda,'a cena tem uma margem de calor acessível (se não, é pendência do desenho do mapa)');assert.equal(borda.tipo,'calor');
 await reanima();h0=(await hist()).length;await colocar(borda.x,borda.y);await mestreProcessa(6800);
 const n4=await novas(h0);log('na borda (calor da crosta):',JSON.stringify(n4));assert.ok(n4.some(m=>/calor/.test(m)),'a crosta quente da borda só dá calor');
 // 5) caminho seco de contorno: longe da lava, nada
 await reanima();h0=(await hist()).length;await colocar(55,48);await mestreProcessa(4500);
 assert.equal((await novas(h0)).length,0,'o caminho de contorno é seguro');
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 log('PASS lava [harness local; mestre simulado por instantes]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
