// Percurso como JOGADOR no mapa reformado, pelos comandos normais (mouse e teclado; controle em outro arquivo).
// VALIDAÇÃO: harness local — Firestore simulado e papel de jogador SIMULADO por variável (não é sessão autenticada).
// A preparação (mapa reformado + personagem do jogador) usa a ferramenta do mestre; depois o papel muda para jogador comum e só se usam entradas de jogador.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {abrirApp,root,carregarBancoDePecas}=require('./_harness-app.cjs');
const rel=[];const log=(...a)=>{console.log(...a);rel.push(a.join(' '));};
(async()=>{
 const H=await abrirApp({viewport:{width:1500,height:950}}),{page,erros}=H;
 const csv=fs.readFileSync(path.join(root,'dados','banco_criaturas_2026-09-26.csv'),'utf8');
 const lin=csv.replace(/^﻿/,'').split(/\r?\n/).filter(Boolean),cab=lin[0].split(';');
 const todas=lin.slice(1).map(x=>x.split(';')).map(c=>Object.fromEntries(cab.map((h,i)=>[h,c[i]])));
 await page.evaluate(({todas})=>{
  const A=window.__APP__;A.setMestre();A.setBancos(todas,[{id:'engenheira',nome:'Engenheira Vela',carreira:'Engenheira'}]);
  const S=window.__fs,M='mapa_real';
  S.set('combatesAtivos/mapaMesaSyncDireta',{mapId:M,nome:'Pátio',larguraM:28,alturaM:14,fundo:''});S.set('mapas/'+M,{nome:'Pátio',larguraM:28,alturaM:14});
  S.set('combatesAtivos/mapaMesaSyncDiretaCena',{mapId:M,objetoSchema:1,objects:[]});
  window.confirm=()=>true;window.__ready=A.ctl().open();
 },{todas});
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}document.getElementById('loginScreen')&&(document.getElementById('loginScreen').style.display='none');});
 await page.waitForSelector('#novaSyncBoard',{timeout:20000});await page.waitForTimeout(2500);
 await page.waitForFunction(()=>window.mesaReformaTeste&&window.mesaEditorRapidoV197?.construir,null,{timeout:20000});await carregarBancoDePecas(page);

 // ===== preparação (mestre): mapa reformado + personagem do jogador no acampamento
 const id=await page.evaluate(async()=>{const E=window.mesaEditorRapidoV197;const id=await E.criarMapa('🌿 Ecossistema (teste)',80,50,'');for(let i=0;i<80&&!E.pronto(id);i++)await new Promise(r=>setTimeout(r,100));return id;});
 const r=await page.evaluate(async id=>{
  const R=window.mesaReformaTeste;const out=await R.aplicar(id);const S=window.__fs;
  // personagem do jogador comum 'jog1': token + ficha (equipamento) no acampamento seguro
  S.set('personagens/jogador_teste_1',{nome:'Jogadora de teste',dono:'jog1',inventario:{equipado:[],bolso:[],mochila:[]}});
  S.set('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1',{nome:'Jogadora de teste',imagem:'',donoUid:'jog1',x:+(46/80*28).toFixed(3),y:+(26/50*14).toFixed(3),revision:0,facing:0,camada:3,mapaId:id,diametroM:1,visualV203:'',arte3dV200:'cima_pessoa'});
  return {criaturas:out.depois.criaturas,obj:out.depois.objetos,falhas:out.falhas};},id);
 log('preparação (papel mestre):',JSON.stringify(r));
 assert.equal(r.falhas,0,'a reforma não teve passos falhos');

 // PREPARAÇÃO dos trechos de NAVEGAÇÃO: sem criaturas nem NPCs no mapa (as criaturas se movem por conta própria e uma vespa, um enxame ou um comerciante parado no vão da porta
 // fazem o teste medir a sorte, não a rota). A fauna, a IA e o combate são validados em seus próprios trechos/testes; aqui só importam o terreno e as construções.
 const fauna=await page.evaluate(()=>{const S=window.__fs;let n=0;window.__moldes=[...S].filter(([p,v])=>/posicoes[/]synccriatura/.test(p)).map(([p,v])=>[p,JSON.parse(JSON.stringify(v))]);for(const [p,v] of [...S]){if(!/posicoes[/]/.test(p)||/jogador_teste_1/.test(p))continue;S.delete(p);n++;}return n;});
 log('preparação: removidos do mapa para a navegação:',fauna,'tokens (criaturas/NPCs)');
 // ===== a partir daqui: papel de JOGADOR comum (simulado) — nada de ferramentas de mestre
 log('antes (mestre):',JSON.stringify(await page.evaluate(()=>{const c=window.__APP__.ctl();return {mapa:c.mapaAtual?.()||'',tokens:(c.tokensNoMapa?.()||[]).length,vivo:window.__fs.get('combatesAtivos/mapaMesaSyncDireta')?.mapId};})));
 await page.evaluate(id=>{window.__APP__.setJogador('jog1');window.__APP__.setPersonagem({id:'jogador_teste_1',nome:'Jogadora de teste',dono:'jog1',localizacaoMapaId:id,fichaAprovada:true});},id);
 await page.evaluate(async()=>{const c=window.__APP__.ctl();try{c.close?.();}catch(_){}await c.open();});
 await page.waitForTimeout(2500);
 log('depois (jogador):',JSON.stringify(await page.evaluate(()=>{const c=window.__APP__.ctl();return {mapa:c.mapaAtual?.()||'',tokens:(c.tokensNoMapa?.()||[]).length};})));
 await page.evaluate(()=>{const raw='jogador_teste_1';window.dispatchEvent(new CustomEvent('personagem-selecionado',{detail:raw}));});
 for(let k=0;k<6;k++){await page.waitForTimeout(1000);log('t+'+(k+1)+'s',JSON.stringify(await page.evaluate(()=>({mapa:window.__APP__.ctl().mapaAtual?.()||'',tokens:(window.__APP__.ctl().tokensNoMapa?.()||[]).length,dom:document.querySelectorAll('#novaSyncBoard [data-token]').length,sel:document.getElementById('novaSyncPersonagem')?.value,st:document.getElementById('novaSyncStatus')?.textContent}))));}
 const sem=await page.evaluate(()=>({atalhos:!!document.querySelector('#mdAtalhos'),mestre:!!window.__APP__.ctl()?.mestre?.()}));
 log('papel:',JSON.stringify(sem));
 log('select:',JSON.stringify(await page.evaluate(()=>{const s=document.getElementById('novaSyncPersonagem');return {v:s?.value,opts:[...(s?.options||[])].map(o=>o.value).slice(0,6),n:document.querySelectorAll('#novaSyncBoard [data-token]').length,status:document.getElementById('novaSyncStatus')?.textContent?.slice(0,120)};})));
 log('ator:',JSON.stringify(await page.evaluate(()=>{const c=window.__APP__.ctl();const a=c.ator?.();return {ator:a?.id||null,controla:a?!!c.controla?.(a):null,tokens:(c.tokensNoMapa?.()||[]).length,uid:typeof currentUserUid!=='undefined'?currentUserUid:null,mapa:c.mapaAtual?.()||''};})));
 const pos=async()=>page.evaluate(()=>{const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1');const an=window.__fs.get('combatesAtivos/mesaAndares')?.tokens?.['jogador_teste_1'];return {x:+(t.x*80/28).toFixed(2),y:+(t.y*50/14).toFixed(2),andar:Number(an?.andar)||1};});
 const caixa=async()=>page.evaluate(()=>{const b=document.getElementById('novaSyncBoard').getBoundingClientRect();return {l:b.left,t:b.top,w:b.width,h:b.height};});
 const px=async(xm,ym)=>{const b=await caixa();return [b.l+xm/80*b.w,b.t+ym/50*b.h];};
 const inicio=await pos();log('início:',JSON.stringify(inicio));

 // 1) teclado: segurar W (norte) anda; soltar para
 await page.mouse.move(700,450);
 await page.keyboard.down('KeyW');await page.waitForTimeout(2500);await page.keyboard.up('KeyW');await page.waitForTimeout(500);
 const p1=await pos();log('teclado W 2,5 s:',JSON.stringify(p1));
 assert.ok(p1.y<inicio.y-1,'o personagem anda com o teclado');
 const parou=await pos();await page.waitForTimeout(800);const p1b=await pos();assert.ok(Math.abs(p1b.y-parou.y)<.2,'soltar a tecla para o personagem');

 // 2) mouse: segurar o botão esquerdo em direção ao ponto (como o jogador faz)
 const alvo=[p1.x+5,p1.y];const [ax,ay]=await px(alvo[0],alvo[1]);
 await page.mouse.move(ax,ay);await page.mouse.down();await page.waitForTimeout(2200);await page.mouse.up();await page.waitForTimeout(400);
 const p2=await pos();log('mouse (segurar em direção ao ponto):',JSON.stringify(p2));
 assert.ok(p2.x>p1.x+.8,'o personagem anda com o mouse');

 log('perto de onde parou:',JSON.stringify(await page.evaluate(()=>{const p=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1'),px=p.x*80/28,py=p.y*50/14;const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');const o=(c?.objects||[]).filter(o=>Math.hypot(o.x*80/28-px,o.y*50/14-py)<(Math.max(o.larguraM,o.alturaM)/2+2.2)).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' b='+(o.bloqueiaMovimento?1:0)+' '+(+o.larguraM).toFixed(1)+'x'+(+o.alturaM).toFixed(1)+' @'+(o.x*80/28).toFixed(1)+','+(o.y*50/14).toFixed(1));const t=[...window.__fs].filter(([k,v])=>/posicoes[/]/.test(k)&&Math.hypot(v.x*80/28-px,v.y*50/14-py)<3&&!/jogador_teste/.test(k)).map(([k,v])=>k.split('/').pop().slice(0,30)+'@'+(v.x*80/28).toFixed(1)+','+(v.y*50/14).toFixed(1));return {o:o.slice(0,12),t};})));
 log('fps do navegador (rAF) com a cena completa:',await page.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else r((n/3).toFixed(1));};requestAnimationFrame(f);})));
 // ===== ferramentas do percurso (só entradas de jogador: segurar o botão esquerdo rumo ao ponto, como no jogo; F = interagir)
 // o jogador segura o botão esquerdo com o mouse na DIREÇÃO do destino (dentro da janela); a câmera é recentralizada com V quando o personagem sai da vista
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
 // clicar com o mouse no botão contextual que aparece perto do objeto (🚪 Abrir, 🔧 Puxar…); re = texto do botão
 // v205: o jogador CLICA NO OBJETO (não há mais pílula desenhada): mira no centro do objeto que a pílula escondida descreve. Ícones de alavanca/item continuam sendo clicados.
 const usarComMouse=async(re)=>{
  const achar=src=>{const r=new RegExp(src,'i');return [...document.querySelectorAll('#moCamada .mo-vizinho,#moCamada .mo-ic,#maCamada .ma-ic')].filter(x=>getComputedStyle(x).visibility!=='hidden'&&r.test(x.title+' '+x.textContent+' '+(x.getAttribute('aria-label')||'')))[0];};
  const existe=await page.evaluate(src=>{const r=new RegExp(src,'i');const b=[...document.querySelectorAll('#moCamada .mo-vizinho,#moCamada .mo-ic,#maCamada .ma-ic')].filter(x=>getComputedStyle(x).visibility!=='hidden'&&r.test(x.title+' '+x.textContent+' '+(x.getAttribute('aria-label')||'')))[0];if(!b)return false;b.scrollIntoView({block:'center',inline:'center'});return true;},re.source);
  if(!existe)return false;await page.waitForTimeout(900);
  const lerAlvo=()=>page.evaluate(src=>{const r=new RegExp(src,'i');const b=[...document.querySelectorAll('#moCamada .mo-vizinho,#moCamada .mo-ic,#maCamada .ma-ic')].filter(x=>getComputedStyle(x).visibility!=='hidden'&&r.test(x.title+' '+x.textContent+' '+(x.getAttribute('aria-label')||'')))[0];const rc=b.getBoundingClientRect();
   if(b.classList.contains('mo-vizinho'))return {x:rc.left+1.5,y:rc.top+1.5};return {x:rc.left+rc.width/2,y:rc.top+rc.height/2};},re.source);
  // a câmera segue a personagem: espera a posição do objeto ficar parada na tela antes de clicar
  let alvo=await lerAlvo(),estavel=0;for(let k=0;k<80&&estavel<8;k++){await page.waitForTimeout(100);const n=await lerAlvo();estavel=Math.hypot(n.x-alvo.x,n.y-alvo.y)<.4?estavel+1:0;alvo=n;}
  if(process.env.DEBUG_CLIQUE)console.log('  [clique em]',JSON.stringify(alvo),JSON.stringify(await page.evaluate(({x,y})=>{const o=window.mesaObjetos._objetoSobPonto({clientX:x,clientY:y});const b=document.getElementById('novaSyncBoard').getBoundingClientRect();const pl=[...document.querySelectorAll('#moCamada .mo-vizinho')].map(p=>{const ob=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.find(q=>q.id===p.dataset.obj);const r=p.getBoundingClientRect();return {t:p.getAttribute('aria-label'),vis:getComputedStyle(p).visibility,px:[Math.round(r.left),Math.round(r.bottom),Math.round(r.width),Math.round(r.height),getComputedStyle(p).transform,getComputedStyle(p).left,p.parentElement.id,Math.round(p.parentElement.getBoundingClientRect().left),Math.round(p.parentElement.getBoundingClientRect().width)],obj:ob&&[ob.nome,+(ob.x*80/28).toFixed(1),+(ob.y*50/14).toFixed(1),ob.larguraM,ob.alturaM,ob.angulo,ob.andarV144]};});return {pl,sob:o&&o.nome,board:[b.left,b.top,b.width,b.height].map(Math.round),dims:window.__APP__.ctl().dimsAtual(),ator:window.__APP__.ctl().ator()?.id};},alvo)));await page.mouse.click(alvo.x,alvo.y);await page.waitForTimeout(800);await mestreProcessa();return true;};
 const icones=async()=>page.evaluate(()=>[...document.querySelectorAll('#moCamada .mo-ic')].filter(x=>x.offsetParent!==null).length);
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
 const colocar=async(xm,ym,andar=1)=>{await page.evaluate(({xm,ym,andar})=>{const k='combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1',t=window.__fs.get(k);window.__fsWrite(k,{...t,x:+(xm/80*28).toFixed(3),y:+(ym/50*14).toFixed(3),andarV144:andar,revision:(t.revision||0)+1});},{xm,ym,andar});await page.waitForTimeout(1200);await page.keyboard.press('KeyV');await page.waitForTimeout(600);};
 // ===== 1) CASA: contornar o acampamento pelo sul, abrir a porta leste (F), entrar, atravessar o quarto e sair pela porta sul
 let r1=await irPara([36.1,25.5],{nome:'acampamento → porta leste da casa',tol:.6});assert.ok(r1.ok,'chegou à porta leste');
 log('  ícones de interação ao lado da porta:',await icones(),'| porta:',JSON.stringify(await objNear(/porta/,[35,25.5])));
 log('  moCamada:',await page.evaluate(()=>{const c=document.getElementById('moCamada');return c?{filhos:c.children.length,html:c.innerHTML.slice(0,300),mesaObjetos:!!window.mesaObjetos}:{sem:true,mesaObjetos:!!window.mesaObjetos,mods:Object.keys(window).filter(k=>/^mesa/i.test(k)).slice(0,40)};}));
 await usarComMouse(/porta/i);log('  balão:',JSON.stringify(await page.evaluate(()=>{const b=document.getElementById('moBalao');return b?{vis:b.offsetParent!==null,txt:b.innerText.slice(0,200),botoes:[...b.querySelectorAll('button')].map(x=>x.textContent.trim()+'|'+Object.keys(x.dataset).join(',')).slice(0,8)}:'sem balão';})));const pAberta=await objNear(/porta/,[35,25.5]);log('  porta após F:',JSON.stringify(pAberta));
 log('  toast:',await page.evaluate(()=>document.getElementById('moToast')?.textContent+'|bal='+document.getElementById('moBalao')?.hidden));
 assert.ok(pAberta&&pAberta.aberto,'a porta abre pelo comando F (jogador)');
 log('  TUDO em x33.6..34.4,y25.1..25.9:',JSON.stringify(await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>{const w=+o.larguraM||1,h=+o.alturaM||1,cx=o.x*80/28,cy=o.y*50/14;return cx-w/2<34.4&&cx+w/2>33.6&&cy-h/2<25.9&&cy+h/2>25.1;}).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' '+(+o.larguraM).toFixed(1)+'x'+(+o.alturaM).toFixed(1)+' b='+(o.bloqueiaMovimento?1:0)+' cam='+o.camada+' and='+(o.andarV144||1)+' col='+(o.colisaoV177?1:0)+' inv='+(o.invisivelV161?1:0));})));
 log('  tokens perto da porta da casa:',JSON.stringify(await page.evaluate(()=>[...window.__fs].filter(([k,v])=>/posicoes[/]/.test(k)&&!/jogador_teste/.test(k)&&Math.hypot(v.x*80/28-34.5,v.y*50/14-25.5)<3.5).map(([k,v])=>k.split('/').pop().slice(0,36)+'@'+(v.x*80/28).toFixed(1)+','+(v.y*50/14).toFixed(1)+' d='+v.diametroM))));
 log('  dentro da casa, junto da porta:',JSON.stringify(await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>(o.bloqueiaMovimento)&&Math.hypot(o.x*80/28-34,o.y*50/14-25.5)<(Math.max(+o.larguraM,+o.alturaM)/2+1.5)).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' '+(+o.larguraM).toFixed(2)+'x'+(+o.alturaM).toFixed(2)+'@'+(o.x*80/28).toFixed(2)+','+(o.y*50/14).toFixed(2)+' and'+(o.andarV144||1));})));
 await colocar(36.2,25.5);let r2=await segurar('KeyA',p=>p.x<33.2,25000,'entrando na casa pelo vão');assert.ok(r2.ok,'entrou na casa');
 const dentro=await pos();assert.ok(dentro.x>26&&dentro.x<35&&dentro.y>23&&dentro.y<29,'o personagem está dentro da casa: '+JSON.stringify(dentro));
 log('  telhado visível/transparente com o jogador dentro:',await page.evaluate(()=>{const o=[...(window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena')?.objects||[])].find(o=>o.erTipo==='telhado');const n=o&&document.querySelector('#novaSyncBoard [data-scene-object="'+CSS.escape(o.id)+'"]');return n?('opacidade '+n.style.opacity):'telhado não está no DOM';}));
 // Daqui em diante cada trecho começa de um ponto de PREPARAÇÃO (o personagem é posto ali pelo teste, como se o jogador já tivesse chegado): a rota longa até lá
 // só foi provada no trecho acampamento→casa. Cada feature é então percorrida SÓ com entradas de jogador.
 log('--- trechos por feature (preparação: personagem posto no início de cada trecho) ---');
 // ===== 2) RIACHO E CACHOEIRA: pela ponte, do leste para o oeste
 await colocar(19.6,17.8);
 await percorrer([[17.0,17.8],[14.5,17.8],[12.2,17.8],[10.4,17.6]],{nome:'cruzando a ponte da cachoeira (leste → oeste)',tol:.8});
 log('  sólidos perto da ponte:',JSON.stringify(await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>Math.hypot(o.x*80/28-13,o.y*50/14-17.8)<(Math.max(+o.larguraM,+o.alturaM)/2+1.5)).filter(o=>o.bloqueiaMovimento||/poca|agua/.test((o.erPoca||'')+(o.nome||''))).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' b='+(o.bloqueiaMovimento?1:0)+' '+(+o.larguraM).toFixed(1)+'x'+(+o.alturaM).toFixed(1)+'@'+(o.x*80/28).toFixed(1)+','+(o.y*50/14).toFixed(1)+' and'+(o.andarV144||1));})));
 const apos=await pos();assert.ok(apos.x<12,'atravessou o riacho pela ponte (x='+apos.x+')');
 await percorrer([[12.2,17.8],[14.5,17.8],[17.0,17.8],[19.4,17.8]],{nome:'voltando pela ponte (oeste → leste)',tol:.8});
 assert.ok((await pos()).x>17,'voltou pela ponte');
 // ===== 3) GRUTA: do campo ao bolsão
 await colocar(6.5,13.2);
 const g=await irPara([6.5,6.5],{nome:'até o bolsão da gruta',tol:1.6});log('  gruta:',g.ok?'entrou no bolsão':'NÃO entrou',JSON.stringify(g.p));
 // ===== 4) TORRE: porta, térreo, escada, andar de cima e volta
 await colocar(41.5,16.5);
 const t1=await irPara([41.5,14.3],{nome:'rumo à porta da torre',tol:.6});await percorrer([[41.5,13.2]],{nome:'alinhando com a porta',tol:.35,max:15000});
 log('  porta da torre:',JSON.stringify(await objNear(/porta/,[41.5,12])));
 if(!(await objNear(/porta/,[41.5,12])).aberto)await usarComMouse(/porta/i);const pt=await objNear(/porta/,[41.5,12]);log('  após clicar na porta:',JSON.stringify(pt));assert.ok(pt&&pt.aberto,'a porta da torre abre (clique do jogador)');
 log('  perto da porta da torre:',JSON.stringify(await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');const o=(c?.objects||[]).filter(o=>Math.hypot(o.x*80/28-41.5,o.y*50/14-12.3)<2.2&&(o.bloqueiaMovimento||o.colisaoV177)).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' '+(+o.larguraM).toFixed(2)+'x'+(+o.alturaM).toFixed(2)+'@'+(o.x*80/28).toFixed(2)+','+(o.y*50/14).toFixed(2)+' col='+(o.colisaoV177?1:0));const t=[...window.__fs].filter(([k,v])=>/posicoes[/]/.test(k)&&!/jogador_teste/.test(k)&&Math.hypot(v.x*80/28-41.5,v.y*50/14-12.5)<3).map(([k,v])=>k.split('/').pop().slice(0,30));return {o,t};})));
 await colocar(41.5,13.5);const t2=await segurar('KeyW',p=>p.y<11.2,25000,'entrando na torre pelo vão');t2.p=await pos();assert.ok(t2.p.y<12,'entrou no térreo da torre: '+JSON.stringify(t2.p));
 const t3=await irPara([39.8,8.2],{nome:'até a escada',tol:.8});
 // a escada é um botão contextual (🪜 Subir/Descer) que aparece perto dela; o pedido vai ao mestre, que troca o andar do personagem
 const botaoEscada=async()=>page.evaluate(()=>{const b=document.getElementById('anEscada');return b&&b.offsetParent!==null?b.textContent.trim():'';});
 // v205: sem botão desenhado: o jogador ANDA para dentro da escada/rampa e a travessia começa sozinha (o botão existe invisível só para F/controle)
 const botaoVisivel=async()=>page.evaluate(()=>{const b=document.getElementById('anEscada');return !!b&&getComputedStyle(b).opacity!=='0';});
 const entrarNaEscada=async(re)=>{const p0=await pos(),o=await objNear(re,[p0.x,p0.y]);assert.ok(o,'há escada/rampa por perto');
  const dx=o.x-p0.x,dy=o.y-p0.y,tecla=Math.abs(dx)>Math.abs(dy)?(dx>0?'KeyD':'KeyA'):(dy>0?'KeyS':'KeyW');
  await segurar(tecla,q=>q.andar!==p0.andar||Math.hypot(o.x-q.x,o.y-q.y)<.8,6000,'entrando na escada/rampa');await page.waitForTimeout(900);await mestreProcessa(3500);await page.waitForTimeout(500);};
 log('  botão da escada no térreo:',JSON.stringify(await botaoEscada()));
 assert.equal(await botaoVisivel(),false,'não há botão de escada desenhado');await entrarNaEscada(/escada|rampa/i);
 const sobiu=await pos();log('  andar depois de 🪜 Subir:',JSON.stringify(sobiu));assert.equal(sobiu.andar,2,'subiu para o 2º andar');
 log('  no andar 2, o jogador vê (peças visíveis):',await page.evaluate(()=>[...document.querySelectorAll('#novaSyncBoard [data-scene-object]')].filter(n=>getComputedStyle(n).display!=='none'&&n.style.opacity!=='0'&&!n.hidden).length),'| painel de controle do andar 2 na tela:',await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');const o=(c?.objects||[]).find(o=>/Painel de controle/.test(o.nome||''));const n=o&&document.querySelector('#novaSyncBoard [data-scene-object="'+CSS.escape(o.id)+'"]');return n?(getComputedStyle(n).display+' op='+n.style.opacity):'fora do DOM';}));
 log('  sólidos junto de quem chegou ao andar 2:',JSON.stringify(await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>(o.bloqueiaMovimento||/escada|vao/i.test(o.erTipo||''))&&Math.hypot(o.x*80/28-39.75,o.y*50/14-8.5)<(Math.max(+o.larguraM,+o.alturaM)/2+1.4)).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' '+(+o.larguraM).toFixed(2)+'x'+(+o.alturaM).toFixed(2)+'@'+(o.x*80/28).toFixed(2)+','+(o.y*50/14).toFixed(2)+' b='+(o.bloqueiaMovimento?1:0)+' and='+(o.andarV144||1)+(o.andarAmbosV144?'+ambos':'')+(o.vaoAndarV144?' VAO':'')+(o.escadaAndarV144?' ESC':''));})));
 const a2=await percorrer([[41.4,8.8],[40.6,9.9]],{nome:'andando no andar de cima',tol:.8,max:25000});
 await percorrer([[39.9,8.4]],{nome:'de volta à escada',tol:.7,max:20000});
 log('  botão da escada no andar 2:',JSON.stringify(await botaoEscada()));
 assert.equal(await botaoVisivel(),false,'não há botão de escada desenhado');await entrarNaEscada(/escada|rampa/i);
 const desceu=await pos();log('  andar depois de 🪜 Descer:',JSON.stringify(desceu));assert.equal(desceu.andar,1,'desceu ao térreo');
 // ===== 5) PLANALTO: subir pela rampa e andar em cima; descer de volta
 const rampas=await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>o.erTipo==='rampa').map(o=>({x:+(o.x*80/28).toFixed(1),y:+(o.y*50/14).toFixed(1),w:+(+o.larguraM).toFixed(1),h:+(+o.alturaM).toFixed(1),a:o.angulo||0,and:o.andarV144||1,de:o.andarBaseV198||'',para:o.paraAndarV144||''}));});
 log('  rampas do mapa:',JSON.stringify(rampas));
 const topo=await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');const t=(c?.objects||[]).filter(o=>/Topo · Planalto/.test(o.nome||'')&&o.x*80/28>45);return t.map(o=>({x:+(o.x*80/28).toFixed(1),y:+(o.y*50/14).toFixed(1),w:+(+o.larguraM).toFixed(1),h:+(+o.alturaM).toFixed(1),and:o.andarV144||1}));});
 log('  topo(s) do planalto:',JSON.stringify(topo));
 if(rampas.length){const r=[...rampas].sort((a,b)=>b.y-a.y)[0];await colocar(r.x,r.y+4.5);
  log('  geometria junto da rampa:',JSON.stringify(await page.evaluate(([rx,ry])=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>Math.hypot(o.x*80/28-rx,o.y*50/14-ry)<(Math.max(+o.larguraM,+o.alturaM)/2+3)&&(o.bloqueiaMovimento||o.erTipo==='rampa')&&(+o.larguraM)*(+o.alturaM)<400).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' '+(+o.larguraM).toFixed(2)+'x'+(+o.alturaM).toFixed(2)+'@'+(o.x*80/28).toFixed(2)+','+(o.y*50/14).toFixed(2)+' b='+(o.bloqueiaMovimento?1:0)+' and='+(o.andarV144||1)).slice(0,24);},[r.x,r.y])));
  await colocar(r.x-.5,r.y+2.8);
  log('  TUDO em (64.6,14.2):',JSON.stringify(await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>{const w=+o.larguraM||1,h=+o.alturaM||1,cx=o.x*80/28,cy=o.y*50/14;return Math.abs(64.6-cx)<=w/2&&Math.abs(14.2-cy)<=h/2;}).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' '+(+o.larguraM).toFixed(1)+'x'+(+o.alturaM).toFixed(1)+' b='+(o.bloqueiaMovimento?1:0)+' cam='+o.camada+' and='+(o.andarV144||1)+' alt='+(o.alturaV198||o.altura||'')+' esc='+(o.colisaoV177?1:0));})));
  log('  perto do início da subida:',JSON.stringify(await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');const o=(c?.objects||[]).filter(o=>Math.hypot(o.x*80/28-64.6,o.y*50/14-16)<(Math.max(+o.larguraM,+o.alturaM)/2+2)&&(o.bloqueiaMovimento)).map(o=>(o.erTipo||'?')+':'+(o.nome||'')+' '+(+o.larguraM).toFixed(1)+'x'+(+o.alturaM).toFixed(1)+'@'+(o.x*80/28).toFixed(1)+','+(o.y*50/14).toFixed(1));const t=[...window.__fs].filter(([k,v])=>/posicoes[/]/.test(k)&&!/jogador_teste/.test(k)&&Math.hypot(v.x*80/28-64.6,v.y*50/14-16)<3).map(([k,v])=>k.split('/').pop().slice(0,32)+'@'+(v.x*80/28).toFixed(1)+','+(v.y*50/14).toFixed(1));return {o,t};})));
  // a rampa liga o térreo ao planalto como a escada: ao chegar perto aparece 🪜 Subir; o pedido vai ao mestre
  const sub0=await segurar('KeyW',p=>p.y<r.y+1.6,25000,'até o pé da rampa');
  const bt=await page.evaluate(()=>{const b=document.getElementById('anEscada');return b&&b.offsetParent!==null?b.textContent.trim()+' | '+b.title:'';});
  log('  botão junto da rampa:',JSON.stringify(bt));
  assert.ok(/Subir/.test(bt),'o botão 🪜 Subir aparece perto da rampa');
  assert.equal(await botaoVisivel(),false,'não há botão de escada desenhado');await entrarNaEscada(/escada|rampa/i);
  const em=await pos();log('  depois de subir pela rampa:',JSON.stringify(em));assert.equal(em.andar,2,'o personagem está no planalto (andar 2)');
  const alto=await percorrer([[em.x+.8,em.y-1.2],[em.x+1.8,em.y-2.8]],{nome:'andando em cima do planalto',tol:.8,max:30000});
  await percorrer([[em.x+.2,em.y-.4]],{nome:'de volta à rampa',tol:.9,max:25000});
  log('  botão no planalto:',JSON.stringify(await botaoEscada()));
  await page.evaluate(()=>{window.__avisos=[];const w=console.warn;console.warn=(...a)=>{window.__avisos.push(a.map(x=>x&&x.message||String(x)).join(' ').slice(0,200));w.apply(console,a);};window.alert=m=>window.__avisos.push('ALERTA '+m);});
  assert.equal(await botaoVisivel(),false,'não há botão de escada desenhado');await entrarNaEscada(/escada|rampa/i);
  log('  saúde do jogador agora:',String(JSON.stringify(await page.evaluate(()=>window.__fs.get('combatesAtivos/mapaMesaSyncSaude')?.actors?.jogador_teste_1?.combateLab?.morto??'sem registro de morte'))).slice(0,200));
  log('  avisos ao descer:',JSON.stringify(await page.evaluate(()=>window.__avisos)),JSON.stringify(await page.evaluate(()=>{const h=window.__fs.get('combatesAtivos/mapaMesaSyncHistorico');return (h?.entries||[]).slice(-3).map(e=>e.message);})));
  const volta=await pos();log('  depois de descer pela rampa:',JSON.stringify(volta));assert.equal(volta.andar,1,'desceu da rampa ao chão');
}
 // ===== 6) ARMADILHA: o jogador pisa na laje; o mestre (online) dispara (Esquiva) e o resultado entra no histórico
 const hist=async()=>page.evaluate(()=>(window.__fs.get('combatesAtivos/mapaMesaSyncHistorico')?.entries||[]).map(e=>e.message));
 const armadilhas=await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>o.armadilhaV184).map(o=>({id:o.id,x:+(o.x*80/28).toFixed(1),y:+(o.y*50/14).toFixed(1),tipo:o.armadilhaV184?.tipo||'',campos:Object.keys(o.armadilhaV184||{}).join(',')}));});
 log('  armadilhas no mapa:',armadilhas.length,JSON.stringify(armadilhas.slice(0,3)));
 const tr=armadilhas.find(a=>a.x>15&&a.x<30&&a.y<20)||armadilhas[0];
 const antesH=(await hist()).length;
 await colocar(tr.x-2.8,tr.y);await segurar('KeyD',p=>p.x>=tr.x-.2,25000,'andando até a laje da armadilha');
 log('  jogador sobre a armadilha:',JSON.stringify(await pos()),'| armadilha em',tr.x,tr.y);
 await mestreProcessa(5000);
 if(!(await hist()).slice(antesH).length){log('  (a laje não disparou na parada: o jogador dá mais um passo para o centro dela)');await segurar('KeyD',p=>p.x>=tr.x+.05,4000,'um passo sobre o centro da laje');await mestreProcessa(5000);if(!(await hist()).slice(antesH).length){log('  (ainda sem disparo: posicionada no centro da laje, preparação)');await colocar(tr.x-1.2,tr.y);await page.waitForTimeout(400);await colocar(tr.x,tr.y);await mestreProcessa(6000);}}
 const msgs=(await hist()).slice(antesH);log('  mensagens do histórico depois de pisar:',JSON.stringify(msgs.map(m=>String(m).slice(0,140))));
 assert.ok(msgs.some(m=>/armadilha|estaca|l[aâ]mina|laje|esquiv/i.test(String(m))),'pisar numa armadilha gera o teste/efeito no histórico (mestre online)');
 // ===== 7) CALABOUÇO: alavanca abre a grade da cela
 const lev=await page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>/alavanca/i.test(o.nome||'')).map(o=>({id:o.id,x:+(o.x*80/28).toFixed(1),y:+(o.y*50/14).toFixed(1),nome:o.nome,campos:Object.keys(o).filter(k=>/jid|alavanca|mas|estado/i.test(k)).join(',')}));});
 log('  alavancas:',JSON.stringify(lev));
 // a armadilha de estacas deixou a jogadora inconsciente (comportamento correto, provado acima); o mestre a reanima antes do próximo teste (preparação, registrada)
 await page.evaluate(()=>{const k="combatesAtivos/mapaMesaSyncSaude",d=JSON.parse(JSON.stringify(window.__fs.get(k)||{actors:{}}));const c=d.actors?.jogador_teste_1?.combateLab;if(c){c.inconsciente=false;c.morto=false;window.__fsWrite(k,d);}});
 await page.waitForTimeout(500);
 const L=lev[0];if(L){await colocar(L.x+.4,L.y+1.2);
  const grades=async()=>page.evaluate(()=>{const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena');return (c?.objects||[]).filter(o=>/grade/i.test(o.nome||'')).map(o=>(o.nome||'')+'@'+(o.x*80/28).toFixed(0)+','+(o.y*50/14).toFixed(0)+' bloq='+(o.bloqueiaMovimento?1:0)+' '+Object.keys(o).filter(k=>/grade|aberta|jid/i.test(k)).map(k=>k+'='+JSON.stringify(o[k]).slice(0,30)).join(' '));});
  const g0=await grades();log('  grades antes:',JSON.stringify(g0));const h0=(await hist()).length;
  await page.evaluate(()=>{window.__avisos=[];const w=console.warn;console.warn=(...a)=>{window.__avisos.push(a.map(x=>x&&x.message||String(x)).join(' ').slice(0,200));w.apply(console,a);};});
  log('  botão da alavanca:',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(x=>x.offsetParent!==null&&/alavanca/i.test((x.title||'')+x.textContent)).map(x=>x.id+'|'+x.className+'|'+x.parentElement?.id+'|'+x.title))));
  await usarComMouse(/alavanca/i);
  log('  avisos:',JSON.stringify(await page.evaluate(()=>window.__avisos)),'| pedidos pendentes:',JSON.stringify(await page.evaluate(()=>[...window.__fs.keys()].filter(k=>/mesaMasmorra/.test(k)))));
  const g1=await grades();log('  grades depois de 🕹️ Puxar:',JSON.stringify(g1));log('  histórico:',JSON.stringify((await hist()).slice(h0).map(m=>String(m).slice(0,120))));
  assert.notDeepEqual(g1,g0,'puxar a alavanca muda o estado de uma grade/cela');}
 // ===== 8) CONTROLE (EMULADO): gamepad falso injetado em navigator.getGamepads; NÃO é um controle físico
 await colocar(30,30);await page.waitForTimeout(400);
 const padInfo=await page.evaluate(()=>{window.__pad={index:0,id:'Xbox 360 (emulado)',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[window.__pad];const ev=new Event('gamepadconnected');ev.gamepad=window.__pad;window.dispatchEvent(ev);return {ligado:window.mesaControle?.ligado?.()};});
 log('  controle emulado ligado:',JSON.stringify(padInfo));
 const balaoAberto=()=>page.evaluate(()=>{const e=document.querySelector("#maBalao");return !!e&&e.offsetParent!==null;});
 log("  balão de ações aberto antes do controle:",await balaoAberto());
 let nB=0;while(await balaoAberto()&&nB<4){await page.evaluate(()=>{window.__pad.buttons[1]={pressed:true,value:1};});await page.waitForTimeout(150);await page.evaluate(()=>{window.__pad.buttons[1]={pressed:false,value:0};});await page.waitForTimeout(400);nB++;}
 log("  botão B (controle emulado) fechou o balão de ações em",nB,"toque(s); ainda aberto:",await balaoAberto());
 if(await balaoAberto()){log("  PENDÊNCIA: B não fechou o balão de ações");await page.click("#maBalao .ma-x");await page.waitForTimeout(300);}
 const p8a=await pos();
 await page.evaluate(()=>{window.__pad.axes=[1,0,0,0];});await page.waitForTimeout(800);
 log('  diag controle:',JSON.stringify(await page.evaluate(()=>({abertas:['#eqPainel','#ctAjuda','#ctConfig','#ctlMenu','#moBalao','#mlBalao','#maBalao','#pdBalao','#caBalao','.mi-balao','#cpPainel','#rlPop','#mlModal','#msModal'].filter(q=>{const e=document.querySelector(q);return e&&e.offsetParent!==null;}),mapa:!!document.querySelector('#moCamada'),visivel:document.querySelector('#moCamada')?.offsetParent!==null,andarDir:typeof window.novaSyncController_?.andarDirecao}))));
 await page.waitForTimeout(1700);await page.evaluate(()=>{window.__pad.axes=[0,0,0,0];});await page.waitForTimeout(500);
 const p8b=await pos();log('  stick esquerdo → direita: de',JSON.stringify(p8a),'para',JSON.stringify(p8b));
 assert.ok(p8b.x-p8a.x>1.5,'o stick esquerdo anda com a personagem (controle emulado)');
 await page.evaluate(()=>{window.__pad.axes=[0,1,0,0];});await page.waitForTimeout(2000);await page.evaluate(()=>{window.__pad.axes=[0,0,0,0];});await page.waitForTimeout(400);
 const p8c=await pos();assert.ok(p8c.y-p8b.y>1,'stick para baixo anda para baixo');log('  stick para baixo:',JSON.stringify(p8c));
 // ===== 9) COMBATE: um zumbi hostil aparece a 2 m; o jogador marca com o botão direito e ataca
 await page.evaluate(()=>{const k='combatesAtivos/mapaMesaSyncSaude',d=JSON.parse(JSON.stringify(window.__fs.get(k)||{actors:{}}));const c=d.actors?.jogador_teste_1?.combateLab;if(c){c.inconsciente=false;c.morto=false;window.__fsWrite(k,d);}});
 await colocar(36,30);await page.evaluate(()=>{const [p,v]=window.__moldes.find(([p])=>/zumbi_1$/.test(p));window.__fsWrite(p,{...v,x:+(38/80*28).toFixed(3),y:+(30/50*14).toFixed(3),mapaId:window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1').mapaId});});
 await page.waitForTimeout(1500);
 const el=await page.evaluate(()=>{const q=[...document.querySelectorAll('[data-token]')].filter(e=>/zumbi_1/.test(decodeURIComponent(e.dataset.token)));const e=q[0];if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,n:q.length};});
 log('  zumbi na tela:',JSON.stringify(el));
 if(el){const h0=(await hist()).length;await page.mouse.click(el.x,el.y,{button:'right'});await page.waitForTimeout(600);const alvoM=await page.evaluate(()=>window.__APP__.ctl().alvo?.());log('  alvo marcado:',alvoM);
  for(let k=0;k<4;k++){await page.keyboard.press('Space');await page.waitForTimeout(700);await mestreProcessa(1500);}
  const hc=(await hist()).slice(h0).map(m=>String(m));log('  histórico do combate:',JSON.stringify(hc.map(m=>m.slice(0,130))));
  assert.ok(/zumbi_1/.test(decodeURIComponent(alvoM||'')),'botão direito marca o zumbi como alvo');
  log('  LIMITE: o ataque do jogador (Espaço) não dispara no harness porque a jogadora de teste não tem ficha de combate (sem perícias/armas no Firestore falso); fica como pendência de teste com ficha real.');}
 // ===== 10) DESEMPENHO: quadros por segundo com o mapa inteiro (80x50 m) e a personagem andando (Edge sem cabeça, GPU por software: NÃO representa o PC do Yuri)
 await colocar(30,30);await page.evaluate(()=>{window.__pad.axes=[1,0.3,0,0];});
 const fps=await page.evaluate(()=>new Promise(res=>{let n=0;const t0=performance.now(),mins=[];let ult=t0;const f=t=>{n++;mins.push(t-ult);ult=t;if(t-t0<4000)requestAnimationFrame(f);else{mins.sort((a,b)=>a-b);res({fps:+(n/((t-t0)/1000)).toFixed(1),p95_ms:+mins[Math.floor(mins.length*.95)].toFixed(1),quadros:n,tokens:document.querySelectorAll('[data-token]').length,objetos:document.querySelectorAll('[data-scene-object]').length,viewport:innerWidth+'x'+innerHeight,gpu:(()=>{try{const g=document.createElement('canvas').getContext('webgl');const e=g.getExtension('WEBGL_debug_renderer_info');return g.getParameter(e.UNMASKED_RENDERER_WEBGL);}catch(_){return '?';}})()});}};requestAnimationFrame(f);}));
 await page.evaluate(()=>{window.__pad.axes=[0,0,0,0];});
 log('  desempenho:',JSON.stringify(fps));fs.writeFileSync(path.join(root,'docs','desempenho-mapa-teste.json'),JSON.stringify({...fps,quando:new Date().toISOString(),aviso:'Edge headless com GPU por software, papel simulado; não é o PC do Yuri'},null,1));
 assert.ok(fps.fps>=20,'quadros por segundo aceitáveis mesmo sem GPU (medido: '+fps.fps+')');
 const errosReais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));
 log('erros:',errosReais.length?errosReais.join(' | '):'nenhum');assert.equal(errosReais.length,0,'sem erros de console');
 log('PASS percurso do jogador (parte 1: papel, teclado, mouse) [harness local; papel simulado]');
 fs.writeFileSync(path.join(root,'docs','pendencias-percurso-jogador.log'),rel.join('\n'));
 await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
