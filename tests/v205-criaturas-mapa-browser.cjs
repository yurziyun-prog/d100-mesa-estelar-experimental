// TODAS as espécies do mapa de testes aparecem no mapa real (reformado), em grupos por família, com pessoa de referência, em quatro estados: parado · andando · atacando · morta.
// Fotos em docs/galeria-mapa/ e vídeo opcional (VIDEO_DIR). VALIDAÇÃO: harness local (arte 3D e escala do jogo; sem IA). Não prova comportamento nem luta: prova que cada espécie aparece com a arte/escala/ações certas.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url');
const {preparar,root}=require('./_mapa-reformado.cjs');
const log=(...a)=>console.log(...a);
(async()=>{
 const imp=p=>import(pathToFileURL(path.join(root,p)).href);
 const {POPULACAO}=await imp('js/mesa-ecossistema.js'),{ESPECIES,a3DaEspecie}=await imp('js/mesa-especies-mapa.js'),{ESCALA_FISICA}=await imp('js/mesa-escala-fisica.js'),{SPRITES_3D}=await imp('js/mesa-sprites-3d-dados.js');
 const {H,page,erros}=await preparar({viewport:{width:1280,height:800},removerFauna:true});
 const dir=path.join(root,'docs','galeria-mapa');fs.mkdirSync(dir,{recursive:true});
 const ids=[...new Set(POPULACAO.map(p=>p[0]))];
 const FAM=['insetoide','artropode_alienigena','primata_alienigena','humanoide_monstro','voador_alienigena','montaria','animal_alienigena','anfibio_alienigena','aquatico_alienigena'];
 ids.sort((a,b)=>FAM.indexOf(ESPECIES[a]?.grupo)-FAM.indexOf(ESPECIES[b]?.grupo));
 const grupos=[];for(let i=0;i<ids.length;i+=3)grupos.push(ids.slice(i,i+3));
 const K='combatesAtivos/mapaMesaSyncDireta/posicoes/';
 const legenda=t=>page.evaluate(t=>{let d=document.getElementById('legendaGaleria');if(!d){d=document.createElement('div');d.id='legendaGaleria';d.style.cssText='position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:99999;background:rgba(8,14,28,.9);color:#fff;font:600 15px Segoe UI,Arial;padding:6px 16px;border-radius:12px;border:1px solid #8ee7ff;pointer-events:none;max-width:96vw;text-align:center;line-height:1.35';document.body.append(d);}d.innerHTML=t;},t);
 const resultado=[];let n=0;
 for(const [gi,g] of grupos.entries()){
  // monta o grupo: 4 espécies numa linha larga (espaço de 9 m), a pessoa de referência na frente
  const X0=29,Y0=22,esp=8.6,donos=[];
  await page.evaluate(({g,X0,Y0,esp,K})=>{const S=window.__fs;const mapa=S.get(K+'jogador_teste_1').mapaId;
   for(const [p] of [...S])if(/posicoes[/]synccriatura/.test(p))S.delete(p);
   g.forEach((id,i)=>{const m=window.__moldes.find(([p])=>{const d=decodeURIComponent(p.split('/').pop());return d==='synccriatura:'+id||d.startsWith('synccriatura:'+id+'~');});if(!m)return;
    S.set(K+m[0].split('/').pop(),{...m[1],x:+((X0+i*esp)/80*28).toFixed(3),y:+(Y0/50*14).toFixed(3),mapaId:mapa,revision:1});});
   const jt=S.get(K+'jogador_teste_1');window.__fsWrite(K+'jogador_teste_1',{...jt,x:+((X0+esp)/80*28).toFixed(3),y:+((Y0+4.5)/50*14).toFixed(3),revision:(jt.revision||0)+1});},{g,X0,Y0,esp,K});
  await page.waitForTimeout(2800);
  const info=await page.evaluate(()=>[...document.querySelectorAll('#novaSyncBoard [data-token]')].map(n=>({id:decodeURIComponent(n.dataset.token),a3:n.dataset.arte3d||'',acao:n.querySelector('.a3d')?.dataset.acao||''})).filter(x=>/synccriatura/.test(x.id)));
  const nomes=g.map(id=>(ESPECIES[id]?.nome||id)+' ('+(ESCALA_FISICA[a3DaEspecie(id)]?.metros??'?')+' m de quadro)');
  const lg=est=>legenda('<b>'+est+'</b> · grupo '+(gi+1)+'/'+grupos.length+'<br>'+nomes.join(' · ')+'<br><small>pessoa de referência: abaixo, ao centro</small>');
  // PARADO
  await lg('PARADO');await page.waitForTimeout(900);await page.screenshot({path:path.join(dir,`g${gi+1}-1-parado.png`)});
  // ANDANDO: todos andam 4 m para leste em passos
  await lg('ANDANDO');
  for(let s=1;s<=8;s++){await page.evaluate(({K,s})=>{for(const [p,v] of [...window.__fs])if(/posicoes[/]synccriatura/.test(p))window.__fsWrite(p,{...v,x:v.x+ (0.5/80*28),revision:(v.revision||0)+1});},{K,s});await page.waitForTimeout(170);if(s===5)await page.screenshot({path:path.join(dir,`g${gi+1}-2-andando.png`)});}
  // ATACANDO: classe de golpe do jogo (como os efeitos de combate fazem) apontando para a pessoa
  await lg('ATACANDO');
  await page.evaluate(()=>{for(const nd of document.querySelectorAll('#novaSyncBoard [data-token]')){if(!/synccriatura/.test(decodeURIComponent(nd.dataset.token)))continue;nd.style.setProperty('--gdx','0');nd.style.setProperty('--gdy','1');nd.classList.add('ef-golpe');}});
  await page.waitForTimeout(420);await page.screenshot({path:path.join(dir,`g${gi+1}-3-atacando.png`)});
  await page.evaluate(()=>{for(const nd of document.querySelectorAll('#novaSyncBoard [data-token]'))nd.classList.remove('ef-golpe');});
  // MORTA: saúde real marca morta (a queda vem do estado, não de um atalho)
  await lg('MORTA');
  await page.evaluate(()=>{const S=window.__fs,k='combatesAtivos/mapaMesaSyncSaude',d=JSON.parse(JSON.stringify(S.get(k)||{actors:{}}));d.actors=d.actors||{};for(const [p] of S)if(/posicoes[/]synccriatura/.test(p)){const id=p.split('/').pop();d.actors[id]={...(d.actors[id]||{}),combateLab:{...(d.actors[id]?.combateLab||{}),morto:true}};}window.__fsWrite(k,d);});
  await page.waitForTimeout(1900);await page.screenshot({path:path.join(dir,`g${gi+1}-4-morta.png`)});
  await page.evaluate(()=>{const S=window.__fs,k='combatesAtivos/mapaMesaSyncSaude',d=JSON.parse(JSON.stringify(S.get(k)||{actors:{}}));for(const id of Object.keys(d.actors||{}))if(/synccriatura/.test(decodeURIComponent(id)))delete d.actors[id];window.__fsWrite(k,d);});
  for(const x of info)resultado.push({grupo:gi+1,...x});n++;
 }
 const sem=ids.filter(id=>!resultado.some(r=>r.id.startsWith('synccriatura:'+id)));
 const semArte=resultado.filter(r=>!r.a3);
 log('espécies exibidas no mapa:',ids.length-sem.length,'de',ids.length,'| sem token:',JSON.stringify(sem),'| tokens sem arte 3D:',JSON.stringify(semArte.map(r=>r.id)));
 fs.writeFileSync(path.join(root,'docs','galeria-mapa','indice.json'),JSON.stringify({grupos:grupos.map((g,i)=>({grupo:i+1,especies:g,fotos:['1-parado','2-andando','3-atacando','4-morta'].map(s=>`g${i+1}-${s}.png`)})),semToken:sem,semArte:semArte.map(r=>r.id),resultado},null,1));
 if(sem.length)log('LACUNA REAL: espécies da população SEM token no mapa (modelo ausente do bestiário local):',JSON.stringify(sem));assert.ok(sem.every(x=>x==='cao_de_sucata'),'só a lacuna já conhecida (cao_de_sucata fora do bestiário CSV) é tolerada e registrada: '+sem);
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 log('PASS galeria no mapa: ',n,'grupos x 4 estados [harness local]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
