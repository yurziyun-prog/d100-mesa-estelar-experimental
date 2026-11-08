// Mesa Estelar v137 — Controle de videogame (Gamepad API): Xbox, PlayStation e Steam Controller (via Steam Input).
// Só lê o controle e aciona o que já existe no mapa (andar, atacar, interagir, alvo, arma). Nada é gravado aqui.

export const ZONA=.2; // zona morta das alavancas
// Layout "standard" da Gamepad API (o mesmo que o Steam Input entrega como controle XInput).
export const BOTOES={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,BACK:8,START:9,L3:10,R3:11,CIMA:12,BAIXO:13,ESQ:14,DIR:15};
export const AJUDA='Alavanca esquerda: andar (leve = devagar) · alavanca direita: escolher algo no mapa (objeto, bilhete, pessoa) · X: usar o que está escolhido (ou o mais perto) · A/RT: atacar · B: fechar · Y: alvo mais perto · D-pad: trocar alvo · LB/RB: trocar arma · LT: menu (ataques, psi, posturas, escadas, construtor) · L3: agachar/rastejar/levantar · R3: salto (mire com alavanca direita, A confirma, B cancela) · Back: centralizar · Start: pausar o tempo real (mestre) · Com uma janela aberta (balão, conversa, loja): D-pad cima/baixo escolhe o campo, esquerda/direita altera valores, A confirma, B fecha';
// v159: janelas que o controle sabe percorrer (a de cima, visível, ganha o foco)
export const JANELAS=['#eqPainel','#ctAjuda','#ctConfig','[data-defense-prompt]','#rtEscolha','#ctlMenu','#cenarioComercioModalV73','#cvCaixa','#pdBalao','#caBalao','#moBalao','#mlBalao','#maBalao','.mi-balao','#cpPainel','#rlPop','#vkPopCarteira','#mlModal','#msModal'];

function alavanca(gp,ix,iy){
 const x=Number(gp?.axes?.[ix])||0,y=Number(gp?.axes?.[iy])||0,m=Math.hypot(x,y);
 if(m<ZONA)return {x:0,y:0,m:0};
 const k=Math.min(1,(m-ZONA)/(1-ZONA))/m; // reescala para 0..1 fora da zona morta
 return {x:x*k,y:y*k,m:Math.min(1,m*k)};
}
// Lê um controle: alavancas já com zona morta e quais botões acabaram de ser apertados (borda de subida).
export function lerControle(gp,antes={}){
 const botoes={};
 for(const [nome,i] of Object.entries(BOTOES)){const b=gp?.buttons?.[i];botoes[nome]=!!(b&&(b.pressed||Number(b.value)>.5));}
 const apertou=Object.keys(botoes).filter(k=>botoes[k]&&!antes[k]);
 return {mover:alavanca(gp,0,1),rolar:alavanca(gp,2,3),botoes,apertou};
}
// Próximo índice ao percorrer uma lista (alvo/arma), com volta.
export function ciclar(i,n,passo){if(!(n>0))return -1;return ((Number(i)||0)+passo+n*8)%n;}

export function instalarControle(dep={}){
 const root=dep.root||document,win=root.defaultView||window,nav=win.navigator;
 if(!nav?.getGamepads)return {parar(){}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const acoes=()=>win.mesaAcoesMapa||null;
 const board=()=>root.getElementById('novaSyncBoard');
 const visivel=()=>{const b=board();return !!b&&!root.hidden&&b.offsetParent!==null&&b.style.display!=='none';};
 let antes={},andando=false,raf=0,arma=0,alvoI=-1,ultimoSeguir=0,chip=null,conectados=new Set(),escolhido=null,ultimoRolar=0,focoI=-1,focoJan=null;
 if(!root.getElementById('ctlCss')){const st=root.createElement('style');st.id='ctlCss';st.textContent='.ctl-escolhido{outline:3px solid #ffd447!important;outline-offset:3px;box-shadow:0 0 12px #ffd447!important}.ctl-foco{outline:3px solid #ffd447!important;outline-offset:2px}';root.head.append(st);}
 // ---- janelas abertas (balão, conversa, loja): o controle escolhe o botão e aperta
 function janelaAberta(){for(const sel of JANELAS){const j=[...root.querySelectorAll(sel)].find(x=>!x.hidden&&x.getClientRects().length>0&&x.getBoundingClientRect().height>0&&getComputedStyle(x).visibility!=='hidden'&&getComputedStyle(x).display!=='none');if(j)return j;}return null;}
 const botoesDe=j=>[...j.querySelectorAll('button,[data-acao],input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.offsetParent!==null&&x.getBoundingClientRect().height>0);
 function focar(j,passo){const bs=botoesDe(j);if(!bs.length)return;if(focoJan!==j){focoJan=j;focoI=-1;}root.querySelectorAll('.ctl-foco').forEach(x=>x.classList.remove('ctl-foco'));
  focoI=focoI<0?(passo>0?0:bs.length-1):ciclar(focoI,bs.length,passo);const b=bs[focoI];b.classList.add('ctl-foco');try{b.focus({preventScroll:true});}catch(_){}b.scrollIntoView?.({block:'nearest'});}
 function alterarFoco(j,passo){const bs=botoesDe(j),b=bs[focoI]||root.activeElement;if(b?.tagName==='SELECT'){const opts=[...b.options].filter(o=>!o.disabled),i=opts.findIndex(o=>o.value===b.value);if(opts.length){b.value=opts[ciclar(i,opts.length,passo)].value;b.dispatchEvent(new win.Event('change',{bubbles:true}));}return true;}if(b?.matches('input[type=number],input[type=range]')){passo>0?b.stepUp():b.stepDown();b.dispatchEvent(new win.Event('input',{bubbles:true}));b.dispatchEvent(new win.Event('change',{bubbles:true}));return true;}return false;}
 function menu(){root.getElementById('ctlMenu')?.remove();const j=root.createElement('div');j.id='ctlMenu';j.style.cssText='position:fixed;right:16px;top:80px;z-index:10001;background:#132036;color:white;border:1px solid #8ee7ff;border-radius:12px;padding:14px;display:grid;gap:8px;max-height:80vh;overflow:auto';const title=root.createElement('strong');title.textContent='🎮 Ações do personagem';j.append(title);const add=(text,fn)=>{const b=root.createElement('button');b.textContent=text;b.onclick=()=>{j.remove();fn();};j.append(b);};for(const [aba,nome]of [['atacar','⚔️ Armas e golpes'],['psi','🔮 Poderes psíquicos'],['pericia','🎲 Perícias'],['curar','🩹 Cura']])add(nome,()=>acoes()?.abrir?.(ctl()?.alvo?.()||'',aba));for(const[p,n]of [['em_pe','Em pé / levantar'],['agachado','Agachar'],['rastejando','Rastejar']])add(n,()=>void win.mesaPosturas?.pedir(p));add('↗ Saltar',()=>win.mesaSaltos?.abrir());add('🪜 Usar escada',()=>{const b=root.getElementById('anEscada');if(b&&!b.disabled)b.click();else aviso('Aproxime-se de uma escada disponível.');});add('🛡️ Defesa',()=>{const d=root.querySelector('[data-defense-prompt]');if(d)focar(d,1);else aviso(win.mesaTempoRealV111?.ativo?.()?'No tempo real, a defesa é rolada automaticamente.':'A defesa fica disponível quando você recebe um ataque.');});if(win.mesaOficina3V175?.construtor)add('👷 Modo construtor (mestre)',()=>win.mesaOficina3V175.construtor.entrar());for(const t of root.querySelectorAll('#appScreen > .tabs .tab-btn')){if(t.closest('.hidden')||t.classList.contains('hidden')||t.getBoundingClientRect().width<2)continue;add('➡️ '+t.textContent.trim(),()=>t.click());}add('Fechar',()=>{});j.lastElementChild.dataset.fechar='';root.body.append(j);focoJan=null;focoI=-1;focar(j,1);}
 function apertarFoco(j){const bs=botoesDe(j);const b=bs[focoI]||bs.find(x=>x.classList.contains('ctl-foco'));if(!b){focar(j,1);return;}b.click();vibrar(.15,40);setTimeout(()=>{const j2=janelaAberta();if(j2!==j){focoJan=null;focoI=-1;}},120);}
 // ---- alavanca direita: escolher algo no mapa na direção apontada (objeto interativo, bilhete, pessoa)
 function escolhiveis(){const b=board();if(!b)return [];return [...b.querySelectorAll('#moCamada [data-obj],#arCamada button,#maCamada button,[data-token]')].filter(x=>x.offsetParent!==null&&getComputedStyle(x).visibility!=='hidden'&&x.getBoundingClientRect().width>0);}
 function centro(x){const r=x.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}
 function escolherNaDirecao(dx,dy){
  const a=ator(),meu=nodoDe(a?.id),daqui=escolhido&&escolhido.isConnected?escolhido:meu;if(!daqui)return;const o=centro(daqui),m=Math.hypot(dx,dy)||1,ux=dx/m,uy=dy/m;
  const melhor=escolhiveis().filter(x=>x!==daqui&&x!==meu).map(x=>{const c=centro(x),vx=c.x-o.x,vy=c.y-o.y,d=Math.hypot(vx,vy)||1,cos=(vx*ux+vy*uy)/d;return {x,d,cos};}).filter(q=>q.cos>.5).sort((p,q)=>p.d/(p.cos*p.cos)-q.d/(q.cos*q.cos))[0];
  if(!melhor)return;escolhido?.classList.remove('ctl-escolhido');escolhido=melhor.x;escolhido.classList.add('ctl-escolhido');vibrar(.1,25);
 }
 function usarEscolhido(){if(!escolhido?.isConnected)return false;const x=escolhido;escolhido.classList.remove('ctl-escolhido');escolhido=null;
  if(x.matches('[data-token]')){const id=x.dataset.token;try{if(!win.mesaDialogoNPC_?.(id,ator()?.id))win.mesaAcoesMapaAbrir_?.(id);}catch(_){win.mesaAcoesMapaAbrir_?.(id);}}else x.click();vibrar(.2,50);return true;}

 function aviso(txt,ms=4200){
  const n=root.createElement('div');n.textContent=txt;
  n.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:10000;background:#132036;border:1px solid #8ee7ff;color:#e8eefc;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:min(92vw,720px);text-align:center;pointer-events:none';
  root.body.append(n);setTimeout(()=>n.remove(),ms);
 }
 function mostrarChip(){
  if(chip||!root.body)return;
  chip=root.createElement('button');chip.type='button';chip.id='mesaControleChip';chip.textContent='🎮';chip.title='Controle conectado — '+AJUDA;chip.setAttribute('aria-label','Controle conectado: ver comandos');
  chip.style.cssText='position:fixed;left:16px;bottom:56px;z-index:9998;width:34px;height:34px;border-radius:50%;border:1px solid #8ee7ff;background:#132036;color:#e8eefc;font-size:17px;cursor:pointer;padding:0';
  chip.addEventListener('click',()=>aviso('🎮 '+AJUDA,9000));root.body.append(chip);
 }
 function tirarChip(){chip?.remove();chip=null;}
 const vibrar=(f=.35,ms=70)=>{try{for(const gp of nav.getGamepads())gp?.vibrationActuator?.playEffect?.('dual-rumble',{duration:ms,strongMagnitude:f,weakMagnitude:f*.8});}catch(_){}};

 const ator=()=>{try{return ctl()?.ator?.()||null;}catch(_){return null;}};
 function nodoDe(id){const b=board();return id&&b?b.querySelector(`[data-token="${CSS.escape(String(id))}"]`):null;}
 function rolavel(el){for(let p=el?.parentElement;p&&p!==root.body;p=p.parentElement){const cs=win.getComputedStyle(p);if(/(auto|scroll)/.test(cs.overflowX+cs.overflowY)&&(p.scrollWidth>p.clientWidth+2||p.scrollHeight>p.clientHeight+2))return p;}return null;}
 // v159: só rola a PÁGINA (nunca a moldura do mapa; quem acompanha o personagem dentro do mapa é a câmera)
 function verNaTela(n){if(!n)return;const r=n.getBoundingClientRect(),m=80;if(r.top<m||r.bottom>win.innerHeight-m)win.scrollBy({top:r.top+r.height/2-win.innerHeight/2,behavior:'smooth'});}
 function seguir(){verNaTela(nodoDe(ator()?.id));}
 function candidatos(){
  const a=ator();if(!a)return [];const lista=(ctl()?.tokensNoMapa?.()||[]).filter(t=>t.id!==a.id);
  return lista.map(t=>({t,d:Math.hypot(Number(t.x)-Number(a.x),Number(t.y)-Number(a.y))})).sort((p,q)=>p.d-q.d).map(x=>x.t);
 }
 function trocarAlvo(passo){
  const c=candidatos();if(!c.length)return;
  const atual=ctl()?.alvo?.()||'';let i=c.findIndex(t=>t.id===atual);
  i=passo===0?0:ciclar(i<0?(passo>0?-1:0):i,c.length,passo);alvoI=i;ctl()?.marcarAlvo?.(c[i].id);
  verNaTela(nodoDe(c[i].id));
 }
 function trocarArma(passo){
  const ac=acoes();if(!ac?.escolherRapido)return;
  const n=arma+passo;
  if(n>=0&&ac.escolherRapido(n)){arma=n;return vibrar(.15,40);}
  if(n<0){for(let k=7;k>=0;k--)if(ac.escolherRapido(k)){arma=k;return vibrar(.15,40);}return;}
  if(ac.escolherRapido(0)){arma=0;vibrar(.15,40);}
 }
 function interagir(){
  const a=ator(),n=nodoDe(a?.id);if(!n)return false;const r=n.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  const lim=Math.max(60,r.width*3);
  const btns=[...root.querySelectorAll('#arCamada button,#moCamada [data-obj],#maCamada button')].filter(x=>x.offsetParent!==null);
  const melhor=btns.map(x=>{const q=x.getBoundingClientRect();return {x,d:Math.hypot(q.left+q.width/2-cx,q.top+q.height/2-cy)};}).filter(o=>o.d<=lim).sort((p,q)=>p.d-q.d)[0];
  if(!melhor)return false;melhor.x.click();vibrar(.2,50);return true;
 }
 function apertar(nome){
  const ac=acoes(),c=ctl(),j=janelaAberta();
  if(j){if(nome==='ESQ'||nome==='DIR'){if(alterarFoco(j,nome==='DIR'?1:-1))return;return focar(j,nome==='DIR'?1:-1);}if(nome==='CIMA')return focar(j,-1);if(nome==='BAIXO')return focar(j,1);if(nome==='A'||nome==='X')return apertarFoco(j);
   if(nome==='B'){const f=j.querySelector('[data-x],[data-fechar],[data-close],.cv-fechar,button[title="Fechar"]');if(f)f.click();else root.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));focoJan=null;focoI=-1;return;}return;}
  // v192: botões que o jogador trocou em "Trocar controles" valem por cima do padrão ('' = botão desligado)
  {const ov=win.mesaControlesV192?.mapeado?.(nome);if(ov!==undefined){if(ov)win.mesaControlesV192.executar(ov);return;}}
  switch(nome){
   case 'A':case 'RT':if(ac?.disparar?.())vibrar(.45,90);break;
   case 'B':escolhido?.classList.remove('ctl-escolhido');escolhido=null;ac?.fechar?.();root.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));break;
   case 'X':if(!usarEscolhido())interagir();break;
   case 'Y':trocarAlvo(0);break;
   case 'ESQ':case 'CIMA':trocarAlvo(-1);break;
   case 'DIR':case 'BAIXO':trocarAlvo(1);break;
   case 'LB':trocarArma(-1);break;
   case 'RB':trocarArma(1);break;
   case 'LT':menu();break;
   case 'L3':{const a=ator(),ps=['em_pe','agachado','rastejando'];if(a){const i=ps.indexOf(win.mesaPosturas?.postura(a.id));void win.mesaPosturas?.pedir(ps[(i+1)%ps.length]);}break;}
   case 'R3':win.mesaSaltos?.abrir();break;
   case 'BACK':win.mesaControlesV192?.executar?(win.mesaControlesV192.executar('itens')):(()=>{const b=board();if(b)win.scrollBy({top:b.getBoundingClientRect().top+b.getBoundingClientRect().height/2-win.innerHeight/2,behavior:'smooth'});})();break; // v192: Select/Back abre o equipamento
   case 'START':root.querySelector('[data-pausa]')?.click();break;
  }
 }
 // v192: acha o painel rolável sob o último ponto tocado/apontado (barra lateral, lista, janela) e rola; sem painel, rola a página
 let ultimoAlvo=null;root.addEventListener('pointermove',e=>{ultimoAlvo=e.target;},{passive:true});
 function painelRolavel(el,dy){for(let n=el;n&&n!==root.body&&n!==root.documentElement;n=n.parentElement){if(n.id==='novaSyncBoard'||n.closest?.('#novaSyncBoard'))return null;const s=getComputedStyle(n);if(/(auto|scroll)/.test(s.overflowY)&&n.scrollHeight>n.clientHeight+2){if(dy<0?n.scrollTop>0:n.scrollTop<n.scrollHeight-n.clientHeight-1)return n;}}return null;}
 function rolarSite(x,y,modal){const dy=y*18,dx=x*18;if(!dy&&!dx)return;const alvo=painelRolavel(modal||ultimoAlvo,dy);if(alvo)alvo.scrollBy(dx,dy);else if(!modal)win.scrollBy(dx,dy);}
 // v195: o site inteiro pelo controle (ficha, inventário, mercado, regras…): quando o mapa não está na tela
 const FOCAVEL='button,a[href],input:not([type=hidden]),select,textarea,summary,[onclick],[tabindex]:not([tabindex="-1"])';
 const visivelEl=x=>{if(x.disabled||x.closest('[hidden],.hidden,[inert]'))return false;const r=x.getBoundingClientRect();if(r.width<4||r.height<4)return false;const cs=getComputedStyle(x);return cs.visibility!=='hidden'&&cs.display!=='none';};
 const focaveis=()=>[...root.querySelectorAll(FOCAVEL)].filter(visivelEl);
 let ultimoNav=0,focoSite=null;
 function irPara(el){if(!el)return;root.querySelectorAll('.ctl-foco').forEach(x=>x.classList.remove('ctl-foco'));focoSite=el;el.classList.add('ctl-foco');try{el.focus({preventScroll:true});}catch(_){}try{el.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'});}catch(_){}vibrar(.08,20);}
 function vizinho(dx,dy){
  const lista=focaveis();if(!lista.length)return null;
  let de=focoSite&&focoSite.isConnected&&visivelEl(focoSite)?focoSite:null;
  if(!de){const ativa=lista.find(x=>x.matches('.tab-btn.active'))||lista.find(x=>{const r=x.getBoundingClientRect();return r.top>=0&&r.bottom<=win.innerHeight;})||lista[0];return ativa;}
  const o=centro(de);let melhor=null,nota=1e12;
  for(const x of lista){if(x===de||de.contains(x)||x.contains(de))continue;const c=centro(x),vx=c.x-o.x,vy=c.y-o.y;
   const along=dx?vx*dx:vy*dy,perp=dx?Math.abs(vy):Math.abs(vx);if(along<=2)continue; // só o que está na direção pedida
   const n=along+perp*2.2;if(n<nota){nota=n;melhor=x;}}
  return melhor;
 }
 function abaSeguinte(passo){const abas=[...root.querySelectorAll('.tabs .tab-btn')].filter(visivelEl);if(!abas.length)return;let i=abas.findIndex(x=>x.classList.contains('active'));i=ciclar(i<0?0:i,abas.length,passo);abas[i].click();focoSite=abas[i];vibrar(.15,40);setTimeout(()=>irPara(abas[i]),60);}
 function fecharJanelaGeral(){const x=[...root.querySelectorAll('.modal-overlay.active .close,.modal.active .close,.modal-content .close,[data-fechar],.cc-x,.mi-x')].find(visivelEl);if(x){x.click();return true;}
  root.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return false;}
 function navegarSite(l){
  const jn=janelaAberta(),ag=performance.now();
  const dir=l.apertou.includes('CIMA')?[0,-1]:l.apertou.includes('BAIXO')?[0,1]:l.apertou.includes('ESQ')?[-1,0]:l.apertou.includes('DIR')?[1,0]:null;
  // alavanca esquerda também move o foco (a cada 230 ms)
  let alav=null;if(!dir&&l.mover.m>.6&&ag-ultimoNav>230){alav=Math.abs(l.mover.x)>Math.abs(l.mover.y)?[Math.sign(l.mover.x),0]:[0,Math.sign(l.mover.y)];}
  const mv=dir||alav;if(alav)ultimoNav=ag;
  for(const b of l.apertou){
   if(b==='A'){if(jn){apertarFoco(jn);continue;}const el=focoSite&&focoSite.isConnected?focoSite:null;if(!el){irPara(vizinho(0,1));continue;}
    if(el.matches('input[type=text],input[type=email],input[type=password],input[type=search],input[type=number],textarea')){el.focus();vibrar(.1,20);}else if(el.tagName==='SELECT'){const op=[...el.options].filter(o=>!o.disabled),i=op.findIndex(o=>o.value===el.value);if(op.length){el.value=op[ciclar(i,op.length,1)].value;el.dispatchEvent(new Event('change',{bubbles:true}));vibrar(.1,20);}}else{el.click();vibrar(.2,50);}}
   else if(b==='B'){fecharJanelaGeral();}
   else if(b==='LB'&&!jn)abaSeguinte(-1);else if(b==='RB'&&!jn)abaSeguinte(1);
   else if(b==='START'){win.abrirConfigSite?.();}
   else if(b==='Y'&&!jn){win.scrollTo({top:0,behavior:'smooth'});}
  }
  if(mv){if(jn){focar(jn,(mv[1]||mv[0])>0?1:-1);}else irPara(vizinho(mv[0],mv[1]));}
 }
 function escolherNoBalao(l,jn){if(l.rolar.m>.55){const ag=performance.now();if(ag-ultimoRolar>260){ultimoRolar=ag;focar(jn,(Math.abs(l.rolar.y)>=Math.abs(l.rolar.x)?l.rolar.y:l.rolar.x)>0?1:-1);}}}
 function quadro(){
  raf=0;const pads=[...nav.getGamepads()].filter(Boolean);
  if(!pads.length){globalThis.mesaConstrucaoControleV177_?.({mover:{x:0,y:0,m:0},rolar:{x:0,y:0,m:0},botoes:{},apertou:[]});antes={};if(andando){ctl()?.pararAndar?.();andando=false;}return;}
  const gp=pads[0],l=lerControle(gp,antes);antes=l.botoes;
  try{if(visivel()&&globalThis.mesaConstrucaoControleV177_?.(l)){if(andando){ctl()?.pararAndar?.();andando=false;}raf=win.requestAnimationFrame(quadro);return;}}catch(e){console.warn('[Controle] construção',e);} // v177: construindo, o controle move a peça
  if(!visivel())globalThis.mesaConstrucaoControleV177_?.({mover:{x:0,y:0,m:0},rolar:{x:0,y:0,m:0},botoes:{},apertou:[]});
  if(visivel()){
   const c=ctl();
   if(win.mesaSaltos?.aberto()){c?.pararAndar?.();andando=false;win.mesaSaltos.controle(l);raf=win.requestAnimationFrame(quadro);return;}
   const modal=janelaAberta();
   if(!modal&&l.mover.m>0&&c?.andarDirecao){andando=!!c.andarDirecao(l.mover.x,l.mover.y)||andando;const ag=performance.now();if(andando&&ag-ultimoSeguir>450){ultimoSeguir=ag;seguir();}}
   else if(andando){c?.pararAndar?.();andando=false;}
   // v159: a alavanca direita não rola mais a moldura do mapa (empurrava a visão para fora): escolhe algo no mapa
   // ou, com uma janela aberta, o botão dela
   // v192: alavanca direita rola as barras laterais e a página (o mapa só anda com o personagem, na alavanca esquerda)
   {const jn=janelaAberta();if(jn)escolherNoBalao(l,jn);else if(l.rolar.m>0)rolarSite(l.rolar.x,l.rolar.y,null);} // balão aberto: alavanca direita escolhe o botão; sem balão: rola
   for(const b of l.apertou)try{apertar(b);}catch(e){console.warn('[Controle]',e);}
  }else{if(andando){ctl()?.pararAndar?.();andando=false;}const jn=janelaAberta();if(jn)escolherNoBalao(l,jn);else if(l.rolar.m>0)rolarSite(l.rolar.x,l.rolar.y,null);try{navegarSite(l);}catch(e){console.warn('[Controle] site',e);}}
  raf=win.requestAnimationFrame(quadro);
 }
 const ligar=()=>{if(!raf)raf=win.requestAnimationFrame(quadro);};
 const connected=e=>{conectados.add(e.gamepad.index);mostrarChip();aviso('🎮 Controle conectado ('+String(e.gamepad.id||'').replace(/\s*\(.*$/,'').slice(0,40)+'). '+AJUDA,7000);ligar();};
 const disconnected=e=>{conectados.delete(e.gamepad.index);if(!conectados.size){tirarChip();aviso('🎮 Controle desconectado.',2500);}};
 win.addEventListener('gamepadconnected',connected);win.addEventListener('gamepaddisconnected',disconnected);
 try{if([...nav.getGamepads()].some(Boolean)){mostrarChip();ligar();}}catch(_){}
 win.mesaControle={ajuda:AJUDA,ligado:()=>!!raf,alvo:()=>ctl()?.alvo?.()||''};
 return {parar(){if(raf)win.cancelAnimationFrame(raf);raf=0;ctl()?.pararAndar?.();win.removeEventListener('gamepadconnected',connected);win.removeEventListener('gamepaddisconnected',disconnected);root.getElementById('ctlMenu')?.remove();tirarChip();}};
}
