// Profundidade visual da água: seco → vadeando → nadando por profundidade/altura do corpo, com histerese; nada de dano, rolagem ou morte. VALIDAÇÃO: harness local.
const assert=require('assert/strict'),path=require('path');
const {preparar,root}=require('./_mapa-reformado.cjs');
const ajudas=require('./_ajudas-percurso.cjs');
const log=(...a)=>console.log(...a);
(async()=>{
 const {H,page,erros,id}=await preparar();
 const {colocar}=ajudas(page,id,log);
 const estado=()=>page.evaluate(()=>window.mesaAguaVisualV205.estados()['jogador_teste_1']||null);
 const saude=()=>page.evaluate(()=>JSON.stringify(window.__fs.get('combatesAtivos/mapaMesaSyncSaude')?.actors?.jogador_teste_1||null));
 const hist=()=>page.evaluate(()=>(window.__fs.get('combatesAtivos/mapaMesaSyncHistorico')?.entries||[]).length);
 const s0=await saude(),h0=await hist();
 const pinta=()=>page.evaluate(()=>{const cv=document.getElementById('agCamada');if(!cv)return -1;const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>20)n++;return n;});
 const trilha=[];
 for(const [nome,x,y] of [['seco, longe da água',30,25],['praia (margem do lago)',3.6,25],['lago, meio',7,25],['lago, fundo',13,25],['pântano',46,42.5]]){
  await colocar(x,y);await page.waitForTimeout(1300);const e=await estado();const px=await pinta();trilha.push([nome,e&&e.modo,e&&e.prof,e&&e.tipo,px]);log('  ',nome,'→',JSON.stringify(e),'| pixels de água desenhados:',px);
 }
 const por=Object.fromEntries(trilha.map(t=>[t[0],t]));
 assert.ok(!por['seco, longe da água'][1]||por['seco, longe da água'][1]==='seco','longe da água: seco');
 assert.equal(por['lago, fundo'][1],'nadando','no fundo do lago nada');assert.ok(por['lago, fundo'][2]>por['lago, meio'][2]&&por['lago, meio'][2]>=por['praia (margem do lago)'][2],'profundidade gradual da margem ao fundo');
 assert.ok(['vadeando','seco'].includes(por['praia (margem do lago)'][1]),'na margem só vadeia');
 assert.ok(por['lago, fundo'][4]>200,'a água é desenhada sobre o corpo (ondas/tinta)');
 // histerese real: caminhar devagar pela borda entre vadear e nadar não faz o estado piscar
 const modos=[];for(let x=3;x<=9;x+=.3){await page.evaluate(({x})=>{const K='combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1',t=window.__fs.get(K);window.__fsWrite(K,{...t,x:+(x/80*28).toFixed(3),y:+(25/50*14).toFixed(3),revision:(t.revision||0)+1});},{x});await page.waitForTimeout(200);const e=await estado();modos.push(e?.modo||'seco');}
 const trocas=modos.filter((m,i)=>i&&m!==modos[i-1]).length;log('  caminhada pela margem:',modos.join(','),'| trocas:',trocas);assert.ok(trocas<=3,'sem piscar: '+trocas+' trocas');
 // ZERO efeito de jogo: sem dano, sem rolagem, sem nada novo no histórico
 assert.equal(await saude(),s0,'a saúde não mudou na água');assert.equal(await hist(),h0,'nenhuma rolagem/mensagem foi criada pela água');
 await colocar(13,25);await page.waitForTimeout(1500);
 const nado=await page.evaluate(()=>{const e=document.querySelector('#novaSyncBoard [data-token="jogador_teste_1"] .a3d');return {nado:e?.dataset.nado||'',acao:e?.dataset.acao||'',anim:getComputedStyle(e).animationName};});log('em água funda:',JSON.stringify(nado));assert.equal(nado.nado,'1','em água funda a miniatura NADA (balanço do nado)');assert.ok(['parado','andar'].includes(nado.acao),'a animação do personagem continua tocando na água');
 await colocar(4.6,22.6);await page.waitForTimeout(1200);await page.evaluate(()=>{});
 await colocar(13,25);await page.waitForTimeout(800);await page.screenshot({path:path.join(root,'docs','antes-depois','agua-nadando.png')});
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 log('PASS água visual (sem dano/rolagem) [harness local]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
