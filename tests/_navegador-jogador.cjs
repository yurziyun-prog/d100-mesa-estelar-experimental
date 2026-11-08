// Navegação de jogador (A*, clique, F) extraída do percurso do jogador. VALIDAÇÃO: harness local.
module.exports=function navegador(page,id,pos,log=console.log){
 const assert=require("assert/strict");
 const caixa=async()=>page.evaluate(()=>{const b=document.getElementById("novaSyncBoard").getBoundingClientRect();return {l:b.left,t:b.top,w:b.width,h:b.height};});
 const hist=async()=>page.evaluate(()=>(window.__fs.get("combatesAtivos/mapaMesaSyncHistorico")?.entries||[]).map(e=>e.message));
 const tela=async()=>page.evaluate(()=>{const n=document.querySelector('#novaSyncBoard [data-token="jogador_teste_1"]');const r=n?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2,vw:innerWidth,vh:innerHeight}:null;});
 const apontar=async(xm,ym,noDown=false)=>{let t=await tela();if(!t||t.x<60||t.y<80||t.x>t.vw-60||t.y>t.vh-60){await page.keyboard.press('KeyV');await page.waitForTimeout(700);t=await tela();}
  const p=await pos(),dx=xm-p.x,dy=ym-p.y,d=Math.hypot(dx,dy)||1,k=Math.min(220,d*48);const base=Math.atan2(dy,dx);let tx=0,ty=0;let achou=false;for(const kk of [k,k*.65,k*1.3,k*.4]){for(const da of [0,.25,-.25,.5,-.5,.8,-.8,1.1,-1.1]){const ang=base+da;tx=Math.max(20,Math.min(t.vw-20,t.x+Math.cos(ang)*kk));ty=Math.max(60,Math.min(t.vh-20,t.y+Math.sin(ang)*kk));const livre=await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return !!e&&!e.closest('[data-token],button,#moBalao,#moCamada,#tpBotao')&&!!e.closest('#novaSyncBoard');},[tx,ty]);if(livre||!noDown){achou=true;break;}}if(achou)break;}await page.mouse.move(tx,ty);};
 const percorrer=async(wps,{tol=1.0,max=70000,nome=''}={})=>{
  await apontar(wps[0][0],wps[0][1],true);await page.mouse.down();const t0=Date.now();let i=0,p=await pos(),ult=p,tUlt=Date.now(),ok=true;
  while(i<wps.length&&Date.now()-t0<max){await page.waitForTimeout(250);p=await pos();
   if(Math.hypot(p.x-wps[i][0],p.y-wps[i][1])<=tol){i++;if(i>=wps.length)break;}
   if(Math.hypot(p.x-ult.x,p.y-ult.y)>.15){ult=p;tUlt=Date.now();}else if(Date.now()-tUlt>7000){ok=false;break;}
   await apontar(...wps[Math.min(i,wps.length-1)]);}
  await page.mouse.up();await page.waitForTimeout(250);p=await pos();if(!(ok&&i>=wps.length)&&process.env.DEBUG_PARADO)log('  (parado: vizinhança)',JSON.stringify(await page.evaluate(([px,py])=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');const o=(c?.objects||[]).filter(o=>o.bloqueiaMovimento&&Math.hypot(o.x*80/28-px,o.y*50/14-py)<(Math.max(+o.larguraM,+o.alturaM)/2+1.6)).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' '+(+o.larguraM).toFixed(1)+'x'+(+o.alturaM).toFixed(1)+'@'+(o.x*80/28).toFixed(1)+','+(o.y*50/14).toFixed(1));const t=[...window.__fs].filter(([k,v])=>/posicoes[/]/.test(k)&&!/jogador_teste/.test(k)&&Math.hypot(v.x*80/28-px,v.y*50/14-py)<2.2).map(([k,v])=>k.split('/').pop().slice(0,34)+'@'+(v.x*80/28).toFixed(1)+','+(v.y*50/14).toFixed(1));return {o,t};},[p.x,p.y])));log('  → '+(nome||'trecho')+':',ok&&i>=wps.length?'chegou':'NÃO chegou (parou em '+i+'/'+wps.length+')',JSON.stringify(p),((Date.now()-t0)/1000).toFixed(0)+' s');return {ok:ok&&i>=wps.length,p};
 };
 // andar em linha reta com o teclado (W/A/S/D) até a condição valer ou o tempo acabar
 const segurar=async(tecla,cond,max=40000,nome='')=>{await page.keyboard.down(tecla);const t0=Date.now();let p=await pos();let n=0;while(Date.now()-t0<max){await page.waitForTimeout(200);p=await pos();if(process.env.DEBUG_SEG&&(n++%15===0))log('     ...',tecla,JSON.stringify(p));if(cond(p))break;}await page.keyboard.up(tecla);await page.waitForTimeout(250);p=await pos();log('  → '+nome+' (tecla '+tecla+'):',cond(p)?'chegou':'NÃO chegou',JSON.stringify(p),((Date.now()-t0)/1000).toFixed(0)+' s');return {ok:cond(p),p};};
 const objNear=async(re,xy)=>page.evaluate(([src,x,y])=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');const r=new RegExp(src,'i');const o=(c?.objects||[]).filter(o=>r.test((o.erTipo||'')+' '+(o.nome||''))).sort((a,b)=>Math.hypot(a.x*80/28-x,a.y*50/14-y)-Math.hypot(b.x*80/28-x,b.y*50/14-y))[0];return o?{id:o.id,nome:o.nome,aberto:o.estadoInterativo?.aberto??!o.bloqueiaMovimento,bloq:!!o.bloqueiaMovimento,x:+(o.x*80/28).toFixed(1),y:+(o.y*50/14).toFixed(1)}:null;},[re.source,...xy]);
 // Os pedidos de objeto/transporte de jogadores vão para uma fila e o MESTRE (online) aplica. Aqui o papel do mestre é SIMULADO por alguns segundos
 // (a mesma aba vira mestre, processa a fila e volta a jogador): é a limitação conhecida do harness de uma só aba; o jogo real precisa do mestre conectado.
 const mestreProcessa=async(ms=3000)=>{await page.evaluate(()=>window.__APP__.setMestre());await page.waitForTimeout(ms);
  await page.evaluate(id=>{window.__APP__.setJogador('jog1');window.__APP__.setPersonagem({id:'jogador_teste_1',nome:'Jogadora de teste',dono:'jog1',localizacaoMapaId:id,fichaAprovada:true});},id);
  await page.evaluate(async()=>{const c=window.__APP__.ctl();try{c.close?.();}catch(_){}await c.open();window.dispatchEvent(new CustomEvent('personagem-selecionado',{detail:'jogador_teste_1'}));});await page.waitForTimeout(2500);};
 const interagir=async()=>{await page.keyboard.press('KeyF');await page.waitForTimeout(800);await mestreProcessa();};
 const usarComMouse=async(re)=>{
  const achar=src=>{const r=new RegExp(src,'i');return [...document.querySelectorAll('#moCamada .mo-vizinho,#moCamada .mo-ic,#maCamada .ma-ic')].filter(x=>getComputedStyle(x).visibility!=='hidden'&&r.test(x.title+' '+x.textContent+' '+(x.getAttribute('aria-label')||'')))[0];};
  const existe=await page.evaluate(src=>{const r=new RegExp(src,'i');const b=[...document.querySelectorAll('#moCamada .mo-vizinho,#moCamada .mo-ic,#maCamada .ma-ic')].filter(x=>getComputedStyle(x).visibility!=='hidden'&&r.test(x.title+' '+x.textContent+' '+(x.getAttribute('aria-label')||'')))[0];if(!b)return false;b.scrollIntoView({block:'center',inline:'center'});return true;},re.source);
  if(!existe)return false;await page.waitForTimeout(900);
  const lerAlvo=()=>page.evaluate(src=>{const r=new RegExp(src,'i');const b=[...document.querySelectorAll('#moCamada .mo-vizinho,#moCamada .mo-ic,#maCamada .ma-ic')].filter(x=>getComputedStyle(x).visibility!=='hidden'&&r.test(x.title+' '+x.textContent+' '+(x.getAttribute('aria-label')||'')))[0];const rc=b.getBoundingClientRect();
   if(b.classList.contains('mo-vizinho'))return {x:rc.left+1.5,y:rc.top+1.5};return {x:rc.left+rc.width/2,y:rc.top+rc.height/2};},re.source);
  // a câmera segue a personagem: espera a posição do objeto ficar parada na tela antes de clicar
  let alvo=await lerAlvo(),estavel=0;for(let k=0;k<80&&estavel<8;k++){await page.waitForTimeout(100);const n=await lerAlvo();estavel=Math.hypot(n.x-alvo.x,n.y-alvo.y)<.4?estavel+1:0;alvo=n;}
  if(process.env.DEBUG_CLIQUE)console.log('  [clique em]',JSON.stringify(alvo),JSON.stringify(await page.evaluate(({x,y})=>{const o=window.mesaObjetos._objetoSobPonto({clientX:x,clientY:y});const b=document.getElementById('novaSyncBoard').getBoundingClientRect();const pl=[...document.querySelectorAll('#moCamada .mo-vizinho')].map(p=>{const ob=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.find(q=>q.id===p.dataset.obj);const r=p.getBoundingClientRect();return {t:p.getAttribute('aria-label'),vis:getComputedStyle(p).visibility,px:[Math.round(r.left),Math.round(r.bottom),Math.round(r.width),Math.round(r.height),getComputedStyle(p).transform,getComputedStyle(p).left,p.parentElement.id,Math.round(p.parentElement.getBoundingClientRect().left),Math.round(p.parentElement.getBoundingClientRect().width)],obj:ob&&[ob.nome,+(ob.x*80/28).toFixed(1),+(ob.y*50/14).toFixed(1),ob.larguraM,ob.alturaM,ob.angulo,ob.andarV144]};});return {pl,sob:o&&o.nome,board:[b.left,b.top,b.width,b.height].map(Math.round),dims:window.__APP__.ctl().dimsAtual(),ator:window.__APP__.ctl().ator()?.id};},alvo)));await page.mouse.click(alvo.x,alvo.y);await page.waitForTimeout(800);await mestreProcessa();return true;};
 // ===== planejador do jogador: olha o mapa (objetos sólidos e água funda que ele VÊ) e escolhe os pontos de passagem, como uma pessoa faria ao olhar a tela
 const planejar=async(dest,{abrirPortas=true}={})=>page.evaluate(({dest,abrirPortas})=>{
  const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena'),objs=c?.objects||[],W=80,H=50,G=.125,nx=W/G,ny=H/G,blk=new Uint8Array(nx*ny);
  const p0=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1'),a={x:p0.x*80/28,y:p0.y*50/14};
  const portasAbertas=new Set(objs.filter(o=>o.erTipo==='porta'&&!o.bloqueiaMovimento).map(o=>o.id)),portasFechadas=new Set(objs.filter(o=>o.erTipo==='porta'&&o.bloqueiaMovimento).map(o=>o.id));
  for(const o of objs){
   if(o.colisaoV177&&(portasAbertas.has(o.colisaoV177)||(abrirPortas&&portasFechadas.has(o.colisaoV177))))continue; // a trava da porta segue o estado da porta
   const agua=/agua_profunda|agua_pantano|lava/.test(String(o.erPoca||''))&&!/rasa/.test(String(o.erPoca||'')),solido=o.bloqueiaMovimento&&!o.destruido&&!(Number(o.andarV144||1)>1)&&o.erTipo!=='telhado'&&o.erTipo!=='copa';
   const portaFechada=o.erTipo==='porta'&&o.bloqueiaMovimento;
   if(!solido&&!agua)continue;if(portaFechada&&abrirPortas)continue; // porta fechada: o jogador a abre quando chegar
   const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1;if(w*h>900)continue;const cx=o.x*80/28,cy=o.y*50/14,r=.4,rot=((Number(o.angulo)||0)*Math.PI/180);
   const hw=(Math.abs(Math.cos(rot))*w+Math.abs(Math.sin(rot))*h)/2+r,hh=(Math.abs(Math.sin(rot))*w+Math.abs(Math.cos(rot))*h)/2+r;
   for(let gx=Math.floor((cx-hw)/G);gx<=Math.ceil((cx+hw)/G);gx++)for(let gy=Math.floor((cy-hh)/G);gy<=Math.ceil((cy+hh)/G);gy++)if(gx>=0&&gy>=0&&gx<nx&&gy<ny&&Math.abs(gx*G-cx)<=hw&&Math.abs(gy*G-cy)<=hh){blk[gy*nx+gx]=1;if(gx===Math.round(35/G)&&gy===Math.round(25.5/G))(window.__quem=window.__quem||[]).push((o.erTipo||'?')+':'+(o.nome||'')+' '+w+'x'+h+' b='+(o.bloqueiaMovimento?1:0)+' poca='+(o.erPoca||'')+' col='+(o.colisaoV177||''));}
  }
  for(const [k,t] of window.__fs){if(!/posicoes[/]/.test(k)||/jogador_teste_1/.test(k)||t.mapaId!==p0.mapaId)continue;const cx=t.x*80/28,cy=t.y*50/14,rr=(Number(t.diametroM)||1)/2+.55;for(let gx=Math.floor((cx-rr)/G);gx<=Math.ceil((cx+rr)/G);gx++)for(let gy=Math.floor((cy-rr)/G);gy<=Math.ceil((cy+rr)/G);gy++)if(gx>=0&&gy>=0&&gx<nx&&gy<ny&&Math.hypot(gx*G-cx,gy*G-cy)<=rr)blk[gy*nx+gx]=1;}
  const cel=(x,y)=>[Math.max(0,Math.min(nx-1,Math.round(x/G))),Math.max(0,Math.min(ny-1,Math.round(y/G)))];
  window.__grade=()=>{let t='';for(let y=24.0;y<=27.0;y+=G){for(let x=33.0;x<=38;x+=G)t+=blk[Math.round(y/G)*nx+Math.round(x/G)]?'#':'.';t+='|';}return t;};
  const [sx,sy]=cel(a.x,a.y);let [tx,ty]=cel(dest[0],dest[1]);
  if(blk[ty*nx+tx]){let ok=false;for(let r=1;r<8&&!ok;r++)for(let dx=-r;dx<=r&&!ok;dx++)for(let dy=-r;dy<=r&&!ok;dy++){const x=tx+dx,y=ty+dy;if(x>=0&&y>=0&&x<nx&&y<ny&&!blk[y*nx+x]){tx=x;ty=y;ok=true;}}}
  for(let gx=sx-10;gx<=sx+10;gx++)for(let gy=sy-10;gy<=sy+10;gy++)if(gx>=0&&gy>=0&&gx<nx&&gy<ny&&Math.hypot(gx-sx,gy-sy)<=9)blk[gy*nx+gx]=0; // o personagem já está aqui: a vizinhança imediata é livre para sair
  const ant=new Int32Array(nx*ny).fill(-2),q=[sy*nx+sx];ant[sy*nx+sx]=-1;
  for(let i=0;i<q.length;i++){const k=q[i],x=k%nx,y=(k/nx)|0;if(x===tx&&y===ty)break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=nx||Y>=ny)continue;const n=Y*nx+X;if(blk[n]||ant[n]!==-2)continue;if(dx&&dy&&(blk[y*nx+X]||blk[Y*nx+x]))continue;ant[n]=k;q.push(n);}}
  if(ant[ty*nx+tx]===-2){let vis=0,minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;for(let k=0;k<nx*ny;k++)if(ant[k]!==-2){vis++;minx=Math.min(minx,(k%nx)*G);maxx=Math.max(maxx,(k%nx)*G);miny=Math.min(miny,((k/nx)|0)*G);maxy=Math.max(maxy,((k/nx)|0)*G);}return {ok:false,motivo:'sem caminho livre (alcança '+vis*G*G+' m² em x '+minx+'-'+maxx+', y '+miny+'-'+maxy+'; início bloqueado? '+(blk[sy*nx+sx]?1:0)+'; destino '+tx*G+','+ty*G+')'};}
  const pts=[];for(let k=ty*nx+tx;k>=0;k=ant[k])pts.push([(k%nx)*G,((k/nx)|0)*G]);pts.reverse();
  // simplifica: mantém um ponto a cada ~3,5 m e as quinas
  const out=[];let ult=pts[0];for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-ult[0],pts[i][1]-ult[1]);const dirA=i>1?[pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]]:null,dirB=i+1<pts.length?[pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]]:null;const quina=dirA&&dirB&&(dirA[0]!==dirB[0]||dirA[1]!==dirB[1])&&d>1.4;if(d>=1.5||quina||i===pts.length-1){out.push(pts[i]);ult=pts[i];}}
  return {ok:true,pts:out,total:pts.length*G};
 },{dest,abrirPortas});
 const abrirPortaPerto=async()=>{ // se há uma porta fechada a menos de 2,2 m, o jogador clica no botão 🚪 Abrir
  const p=await pos(),por=await objNear(/porta/,[p.x,p.y]);if(por&&!por.aberto&&Math.hypot(por.x-p.x,por.y-p.y)<3.2){return usarComMouse(/porta/i);}return false;};
 const irPara=async(dest,{nome='',tol=1.0,max=120000}={})=>{
  const t0=Date.now();let p=await pos();
  for(let tentativa=0;tentativa<7&&Date.now()-t0<max;tentativa++){
   let pl=await planejar(dest);for(let k=0;k<5&&!pl.ok;k++){await page.waitForTimeout(1500);pl=await planejar(dest);}   // quem bloqueia (criaturas) se mexe: espera e olha de novo
   if(!pl.ok){log('  → '+nome+': '+pl.motivo);return {ok:false,p};}
   const r=await percorrer(pl.pts.length?pl.pts:[dest],{nome:nome+(tentativa?' (retomada '+tentativa+')':''),tol,max:60000});p=r.p;
   if(Math.hypot(p.x-dest[0],p.y-dest[1])<=tol+.4)return {ok:true,p};
   await abrirPortaPerto();await page.waitForTimeout(1200);
  }
  return {ok:Math.hypot(p.x-dest[0],p.y-dest[1])<=tol+.4,p};
 };
 return {irPara,percorrer,planejar,interagir,usarComMouse,objNear,mestreProcessa,segurar,tela,apontar,abrirPortaPerto};
};
