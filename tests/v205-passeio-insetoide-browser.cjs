// Passeio pelo mapa de testes com um INSETOIDE (bípede de quatro braços) como personagem do jogador — para gravar vídeo (VIDEO_DIR=pasta).
// ANDA DE VERDADE (rota planejada, teclado e mouse; sem teleporte entre os lugares): só o ponto de partida é posto pelo teste.
// VALIDAÇÃO: harness local; jogador SIMULADO; o mestre online é SIMULADO por instantes nas travessias; Firestore falso. Legendas na tela dizem o que acontece.
const assert=require('assert/strict');
const {preparar}=require('./_mapa-reformado.cjs');
const ajudas=require('./_ajudas-percurso.cjs');
const navegador=require('./_navegador-jogador.cjs');
const log=(...a)=>console.log(...a);
(async()=>{
 const {H,page,erros,id}=await preparar({viewport:{width:1280,height:800},removerFauna:true});
 const {pos,colocar}=ajudas(page,id,log);
 const {irPara,segurar,mestreProcessa,interagir,usarComMouse,objNear}=navegador(page,id,pos,log);
 const K='combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1';
 await page.evaluate(({K})=>{const t=window.__fs.get(K);window.__fsWrite(K,{...t,nome:'Insetoide (jogador)',arte3dV200:'cima_insetoide_predador',visualV203:'',diametroM:.7,revision:(t.revision||0)+1});},{K});
 // para o vídeo: a armadilha de estacas na soleira da torre é retirada (ela deixa a jogadora inconsciente e a rota para; a armadilha continua testada em v204-percurso)
 await page.evaluate(()=>{const k='combatesAtivos/mapaMesaSyncDiretaCena',c=JSON.parse(JSON.stringify(window.__fs.get(k)));c.objects=c.objects.filter(o=>!(o.armadilhaV184&&Math.hypot(o.x*80/28-41,o.y*50/14-13.6)<2));window.__fsWrite(k,c);});
 await page.waitForTimeout(1500);await colocar(36.2,25.5);await page.waitForTimeout(1200); // ponto de partida: na porta da casa (o acampamento tem obstáculos que travam a rota automática)
 const a3=await page.evaluate(()=>document.querySelector('#novaSyncBoard [data-token="jogador_teste_1"]')?.dataset.arte3d);log('arte da miniatura do jogador:',a3);assert.equal(a3,'cima_insetoide_predador','o jogador aparece como o insetoide (arte 3D de cima), não como bolinha');
 const legenda=async t=>{await page.evaluate(t=>{let d=document.getElementById('legendaVideo');if(!d){d=document.createElement('div');d.id='legendaVideo';d.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;background:rgba(8,14,28,.88);color:#fff;font:600 17px Segoe UI,Arial;padding:8px 18px;border-radius:999px;border:1px solid #8ee7ff;pointer-events:none;max-width:92vw;text-align:center';document.body.append(d);}d.textContent=t;},t);await page.waitForTimeout(1000);};
 const vai=async(x,y,nome,tol=1.0)=>{const r=await irPara([x,y],{nome,tol});if(!r.ok)log('  (não chegou em',nome,')',JSON.stringify(r.p));return r;};
 log('início:',JSON.stringify(await pos()));
 await legenda('Insetoide (bípede, quatro braços) — começa na porta da casa, perto do acampamento');
 await legenda('Casa: abrir a porta e entrar');
 await interagir();log('porta da casa:',JSON.stringify(await objNear(/porta/,[35,25.5])));
 await segurar('KeyA',p=>p.x<32.6,9000,'entrando na casa');await legenda('O telhado abre para quem está dentro');await page.waitForTimeout(1200);
 await segurar('KeyD',p=>p.x>37.2,7000,'saindo da casa pela porta');
 await legenda('Rumo ao riacho: cachoeira animada e ponte de madeira');
 await vai(20,17.8,'trilha até o riacho');await vai(10.6,17.5,'atravessando a ponte',.8);await page.waitForTimeout(1200);
 await legenda('Lagoa: a água cobre o corpo conforme a profundidade (só visual, sem dano)');
 await vai(5.6,23.6,'até a margem da lagoa');await segurar('KeyS',p=>p.y>25.4,4000,'entrando na água');await segurar('KeyD',p=>p.x>9.2,6000,'nadando');await page.waitForTimeout(1800);await segurar('KeyA',p=>p.x<6.3,6000,'saindo da água');await segurar('KeyW',p=>p.y<23.4,4000,'de volta à margem');
 await legenda('Torre: abrir a porta e subir a escada andando');
 await vai(41.56,14.2,'de volta pelas trilhas até a torre',.6);await vai(41.5,13.3,'até a porta da torre',.3);await page.waitForTimeout(600);
 for(let k=0;k<3;k++){const d=await objNear(/porta/,[41.5,12]);if(d&&d.aberto)break;if(k%2===0)await interagir();else await usarComMouse(/porta/i);}
 log('porta da torre:',JSON.stringify(await objNear(/porta/,[41.5,12])));

 await segurar('KeyW',p=>p.y<10.6,6000,'entrando na torre');
 const e=await objNear(/escada/,[41,9]);
 if(e){const p0=await pos();await vai(e.x+1.3,e.y+.4,'até perto da escada',.7);await segurar('KeyA',q=>q.andar!==p0.andar||Math.hypot(e.x-q.x,e.y-q.y)<.8,5000,'subindo a escada');await page.waitForTimeout(900);await mestreProcessa(3000);const p1=await pos();log('depois da escada:',JSON.stringify(p1));
  if(p1.andar!==p0.andar){await legenda('2º andar da torre — a mesma escada leva de volta');await page.waitForTimeout(1500);
   await segurar('KeyD',q=>Math.hypot(e.x-q.x,e.y-q.y)>1.7,5000,'afastando da escada');await segurar('KeyA',q=>Math.hypot(e.x-q.x,e.y-q.y)<.8,5000,'de volta à escada');await page.waitForTimeout(900);await mestreProcessa(3000);await page.waitForTimeout(800);assert.equal((await pos()).andar,1,'voltou ao térreo');}}
 await legenda('Alçapão ao lado da trilha da caverna: descer ao subsolo (-3 m)');
 await vai(46.2,29.1,'até o alçapão',.5);await segurar('KeyD',q=>q.andar!==1||Math.hypot(48.2-q.x,28.6-q.y)<.8,6000,'descendo pelo alçapão');await page.waitForTimeout(900);await mestreProcessa(3500);await page.waitForTimeout(1500);assert.equal((await pos()).andar,9,'desceu ao subsolo');
 await legenda('Subsolo: escuro, só a abertura dá claridade');await page.waitForTimeout(2500);
 await legenda('Lanterna empunhada: ilumina só a área permitida (paredes cortam a luz)');
 await page.evaluate(({K})=>{const t=window.__fs.get(K);window.__fsWrite(K,{...t,visualV203:';z=L',revision:(t.revision||0)+1});},{K});await page.waitForTimeout(1500);
 await segurar('KeyS',p=>p.y>31.5,6000,'explorando a câmara');await segurar('KeyW',p=>p.y<29.2,6000,'voltando');await page.waitForTimeout(800);
 await legenda('Passagem para a câmara seguinte e rampa da boca da caverna');
 await segurar('KeyD',q=>q.andar!==9||Math.hypot(54.4-q.x,29.4-q.y)<.8,9000,'rumo à rampa');await page.waitForTimeout(900);await mestreProcessa(3500);await page.waitForTimeout(1200);assert.equal((await pos()).andar,1,'voltou à superfície pela rampa');
 await legenda('Lava ao sudeste: a ponte de crosta é firme; o caminho de contorno é seguro');
 await vai(55,36,'rumo ao sul',1.5);await segurar('KeyS',p=>p.y>44.7,12000,'descendo até a altura da ponte de crosta');await segurar('KeyD',p=>p.x>74,14000,'cruzando a ponte de crosta');await page.waitForTimeout(1500);
 await legenda('Fim do passeio (teste no harness local: jogador e mestre simulados)');await page.waitForTimeout(2500);
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));log('erros:',reais.length?reais.join('|'):'nenhum');
 log('PASS passeio do insetoide concluído');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
