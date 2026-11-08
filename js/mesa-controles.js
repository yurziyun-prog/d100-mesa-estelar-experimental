// Mesa Estelar v192 — Controles como num videogame: teclado, mouse e controle, remapeáveis, com balão de ajuda.
//
// • Teclado: WASD/setas andam; J ataca; espaço pula; F interage (porta, item, alavanca…); Tab troca de alvo; Q/R trocam a arma;
//   I abre a mochila; 1/2/3 = Defesa total / Ataque total / Recuo; C muda a postura; M monta/desce; P pausa o tempo real;
//   V centraliza a câmera; H abre a ajuda. Esc cancela.
// • Mouse: botão esquerdo anda (segurar, como sempre); DIREITO abre as ações; ESQUERDO ataca um inimigo; MEIO interage com o que
//   está mais perto; botões laterais (voltar/avançar) trocam a arma.
// • Controle (Xbox/PlayStation/Steam): o mesmo de antes (mesa-controle.js), agora com ajuda na tela e botões trocáveis.
// • O balão de ajuda mostra as teclas do aparelho que você está usando (abre sozinho quando um controle é ligado) e
//   o botão "Trocar controles" deixa escolher outra tecla/botão para cada ação (guardado neste navegador).
// Módulo à parte: se falhar, o mapa e os controles antigos seguem normais.

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const CHAVE='mesa:controlesV192';

// ---------------------------------------------------------------- ações e padrões (puro)
export const ACOES=[
 {id:'atacar',nome:'Atacar',icone:'⚔️',dica:'Ataca o alvo marcado com a arma escolhida'},
 {id:'interagir',nome:'Interagir',icone:'🖐️',dica:'Abre porta, pega item, puxa alavanca, usa o que está mais perto'},
 {id:'alvoProximo',nome:'Próximo alvo',icone:'➡️',dica:'Marca o próximo alvo, do mais perto ao mais longe'},
 {id:'alvoAnterior',nome:'Alvo anterior',icone:'⬅️',dica:'Volta ao alvo anterior'},
 {id:'alvoMaisPerto',nome:'Alvo mais perto',icone:'🎯',dica:'Marca quem está mais perto'},
 {id:'armaProxima',nome:'Próxima arma',icone:'🔫',dica:'Troca para a próxima arma ou ataque'},
 {id:'armaAnterior',nome:'Arma anterior',icone:'🗡️',dica:'Volta à arma anterior'},
 {id:'itens',nome:'Equipamento e mochila',icone:'🎒',dica:'Abre o painel: equipar, guardar, usar e consumir itens'},
 {id:'montar',nome:'Montar / dirigir / descer',icone:'🐉',dica:'Sobe ou desce de montaria ou veículo que está perto'},
 {id:'defesa',nome:'Defesa total',icone:'🛡️',dica:'Tempo real: só se defende (liga e desliga)'},
 {id:'ataqueTotal',nome:'Ataque total',icone:'💥',dica:'Tempo real: ataca mais rápido e defende menos'},
 {id:'recuo',nome:'Recuo / fuga',icone:'💨',dica:'Tempo real: corre mais e não ataca'},
 {id:'postura',nome:'Postura',icone:'🧎',dica:'Alterna de pé, agachado e rastejando'},
 {id:'pausar',nome:'Pausar tempo real',icone:'⏸️',dica:'Pausa ou continua o combate em tempo real (mestre)'},
 {id:'centralizar',nome:'Centralizar câmera',icone:'📍',dica:'Leva a tela até o seu personagem'},
 {id:'correr',nome:'Correr',icone:'🏃',dica:'Liga/desliga a corrida: anda mais rápido e gasta fadiga (a barra azul)'},
 {id:'editarPersonagem',nome:'Editar personagem',icone:'🧑',dica:'Abre o editor de aparência e arma na mão'},
 {id:'ajuda',nome:'Ajuda dos controles',icone:'❓',dica:'Abre e fecha este balão'},
 {id:'alvoEAtacar',nome:'Marcar alvo sob o cursor e atacar',icone:'🖱️',dica:'Mouse: marca quem está sob o cursor e ataca',so:['mouse']},
 {id:'cancelar',nome:'Cancelar / fechar',icone:'✖️',dica:'Fecha balões e janelas',fixo:true},
 {id:'menu',nome:'Menu do controle',icone:'📋',dica:'Menu de atalhos do controle',fixo:true,so:['controle']},
 {id:'saltos',nome:'Pular',icone:'🤸',dica:'Pula na direção em que o personagem está olhando',so:['teclado','controle']}
];
export const acaoPorId=id=>ACOES.find(a=>a.id===id)||null;
export const TECLADO_PADRAO={atacar:'KeyJ',saltos:'Space',interagir:'KeyF',alvoProximo:'Tab',alvoAnterior:'shift+Tab',alvoMaisPerto:'KeyT',armaProxima:'KeyR',armaAnterior:'KeyQ',itens:'KeyI',montar:'KeyM',defesa:'Digit1',ataqueTotal:'Digit2',recuo:'Digit3',postura:'KeyC',correr:'KeyE',editarPersonagem:'KeyG',pausar:'KeyP',centralizar:'KeyV',ajuda:'KeyH',cancelar:'Escape'};
export const MOUSE_PADRAO={alvoEAtacar:0,interagir:1,armaAnterior:3,armaProxima:4};
export const CONTROLE_PADRAO={atacar:'A',interagir:'X',alvoMaisPerto:'Y',alvoAnterior:'CIMA',alvoProximo:'BAIXO',armaAnterior:'LB',armaProxima:'RB',menu:'LT',correr:'L3',saltos:'R3',centralizar:'BACK',pausar:'START',cancelar:'B'};
// botões do controle que repetem outra ação por padrão (gatilho direito ataca; esquerda/direita também trocam o alvo)
export const CONTROLE_EXTRAS={RT:'atacar',ESQ:'alvoAnterior',DIR:'alvoProximo'};
export const PADROES={teclado:TECLADO_PADRAO,mouse:MOUSE_PADRAO,controle:CONTROLE_PADRAO};
export const DISPOSITIVOS={teclado:'⌨️ Teclado',mouse:'🖱️ Mouse',controle:'🎮 Controle'};
export const NOMES_MOUSE={0:'Esquerdo',1:'Meio (roda)',2:'Direito',3:'Lateral (voltar)',4:'Lateral (avançar)'};
export const MOVIMENTO={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};

export function rotuloTecla(v){
 if(!v)return '—';const shift=/^shift\+/.test(v),c=v.replace(/^shift\+/,'');
 const m=/^Key(.)$/.exec(c)||/^Digit(.)$/.exec(c);const base=m?m[1]:({Space:'Espaço',Tab:'Tab',Escape:'Esc',Enter:'Enter',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Backquote:'`',Backspace:'⌫'}[c]||c.replace(/^Numpad/,'Num '));
 return (shift?'Shift + ':'')+base;
}
export const rotuloMouse=b=>b===undefined||b===null||b===''?'—':(NOMES_MOUSE[b]||'Botão '+b);
export const ROTULO_CONTROLE={A:'A (✕)',B:'B (○)',X:'X (□)',Y:'Y (△)',LB:'LB (L1)',RB:'RB (R1)',LT:'LT (L2)',RT:'RT (R2)',BACK:'Select/Back',START:'Start/Menu',L3:'Clique da alavanca esquerda',R3:'Clique da alavanca direita',CIMA:'D-pad ↑',BAIXO:'D-pad ↓',ESQ:'D-pad ←',DIR:'D-pad →'};
export const rotuloControle=n=>n?(ROTULO_CONTROLE[n]||n):'—';
export const rotulo=(disp,v)=>disp==='teclado'?rotuloTecla(v):disp==='mouse'?rotuloMouse(v):rotuloControle(v);
// Código da tecla do evento (com o prefixo shift+ só para Tab, que é a única combinação padrão).
export const chaveDoEvento=e=>(e.shiftKey&&e.code==='Tab'?'shift+':'')+e.code;
export const configVazia=()=>({teclado:{},mouse:{},controle:{}});
export function lerConfig(texto){try{const c=JSON.parse(texto||'{}');const v=configVazia();for(const d of Object.keys(v))if(c&&typeof c[d]==='object'&&c[d])for(const [a,x] of Object.entries(c[d]))if(acaoPorId(a))v[d][a]=x;return v;}catch(_){return configVazia();}}
// Ligação efetiva de cada ação: o que o jogador trocou, senão o padrão. Valor '' = ação desligada neste aparelho.
export function efetivo(cfg,disp){
 const pad=PADROES[disp]||{},ov=cfg?.[disp]||{},out={};
 for(const a of ACOES){if(a.so&&!a.so.includes(disp))continue;if(Object.hasOwn(ov,a.id))out[a.id]=ov[a.id];else if(Object.hasOwn(pad,a.id))out[a.id]=pad[a.id];}
 return out;
}
// Que ação um botão aciona (inverso). Botão sem ação → ''. No controle os botões "extras" seguem a ação-mãe enquanto ela não for trocada.
export function acaoDoBotao(cfg,disp,valor){
 const ef=efetivo(cfg,disp);for(const [a,v] of Object.entries(ef))if(v!==''&&String(v)===String(valor))return a;
 if(disp==='controle'&&CONTROLE_EXTRAS[valor]){const mae=CONTROLE_EXTRAS[valor];if(!Object.hasOwn(cfg?.controle||{},mae))return mae;}
 return '';
}
// Troca a ligação de uma ação. Se outra ação do mesmo aparelho usava o botão, ela fica sem ligação (nunca dois efeitos num botão). Devolve nova config e quem foi desligado.
export function trocar(cfg,disp,acao,valor){
 const novo=JSON.parse(JSON.stringify(cfg||configVazia()));novo[disp]=novo[disp]||{};
 const a=acaoPorId(acao);if(!a||a.fixo)return {cfg:novo,desligada:null,erro:'Esta ação não pode ser trocada.'};
 if(a.so&&!a.so.includes(disp))return {cfg:novo,desligada:null,erro:'Esta ação não existe neste aparelho.'};
 let desligada=null;const ef=efetivo(novo,disp);
 if(valor!==''&&valor!==undefined)for(const [o,v] of Object.entries(ef)){if(o===acao||String(v)!==String(valor))continue;
  if(acaoPorId(o)?.fixo)return {cfg:cfg||configVazia(),desligada:null,erro:'Esse botão é fixo para "'+acaoPorId(o).nome+'".'};
  novo[disp][o]='';desligada=o;}
 novo[disp][acao]=valor;
 return {cfg:novo,desligada};
}
export function restaurar(cfg,disp){const n=JSON.parse(JSON.stringify(cfg||configVazia()));if(disp)n[disp]={};else return configVazia();return n;}
// Vetor de movimento das teclas seguradas (normalizado; diagonal não anda mais rápido).
export function vetorMovimento(teclas){let x=0,y=0;for(const c of teclas)if(MOVIMENTO[c]){x+=MOVIMENTO[c][0];y+=MOVIMENTO[c][1];}x=Math.max(-1,Math.min(1,x));y=Math.max(-1,Math.min(1,y));const m=Math.hypot(x,y);return m?{x:x/m,y:y/m}:{x:0,y:0};}
// Próximo/anterior alvo na ordem de proximidade; sem alvo atual começa pelo mais perto (próximo) ou mais longe (anterior).
export function proximoAlvo(candidatos,atual,passo=1){
 if(!candidatos.length)return null;const i=candidatos.findIndex(c=>c.id===atual);
 if(i<0)return candidatos[passo>0?0:candidatos.length-1].id;return candidatos[(i+passo+candidatos.length)%candidatos.length].id;
}
// Ajuda: linhas "ação · tecla" para um aparelho, só do que está ligado.
export function linhasDeAjuda(cfg,disp){
 const ef=efetivo(cfg,disp),out=[];
 if(disp==='teclado')out.push({icone:'🏃',nome:'Andar',tecla:'W A S D  ou  setas'});
 if(disp==='mouse')out.push({icone:'🏃',nome:'Andar',tecla:'Esquerdo (segurar)'});
 if(disp==='controle')out.push({icone:'🏃',nome:'Andar',tecla:'Alavanca esquerda'},{icone:'👀',nome:'Escolher algo no mapa',tecla:'Alavanca direita'});
 for(const a of ACOES){const v=ef[a.id];if(v===undefined||v==='')continue;out.push({id:a.id,icone:a.icone,nome:a.nome,tecla:rotulo(disp,v)+(disp==='controle'&&a.id==='atacar'?'  ou  RT':'')});}
 return out;
}

// ---------------------------------------------------------------- instalação (navegador)
export function instalarControles(dep){
 const root=dep.root||document,win=root.defaultView||window,ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const acoes=()=>win.mesaAcoesMapa||null,board=()=>root.getElementById('novaSyncBoard');
 const armazem=()=>{try{return win.localStorage;}catch(_){return null;}};
 let cfg=lerConfig(armazem()?.getItem(CHAVE)),uso='teclado',ajudaAberta=false,ajuda=null,botao=null,painel=null,capturando=null,armaI=0,gpAntes={},rafCap=0;
 if(cfg.teclado.atacar==='Space'){cfg.teclado.atacar='KeyJ';cfg.teclado.saltos='Space';}
 const teclas=new Set();let andando=false;
 const salvar=()=>{try{armazem()?.setItem(CHAVE,JSON.stringify(cfg));}catch(_){}};
 const ator=()=>{try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}};
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const ESTILO=`#ctBotao{position:fixed;left:16px;bottom:176px;z-index:9998;width:34px;height:34px;border-radius:50%;border:1px solid #8ee7ff;background:#132036;color:#e8eefc;font-size:17px;cursor:pointer;padding:0}
#ctAjuda{position:fixed;left:16px;bottom:60px;z-index:9999;width:min(360px,calc(100vw - 32px));max-height:70vh;overflow:auto;padding:12px;border-radius:14px;background:rgba(10,18,32,.97);border:1px solid #6b83a8;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.55)}
#ctAjuda[hidden]{display:none}#ctAjuda h4{margin:0 0 6px;font-size:14px;color:#8ee7ff;display:flex;gap:8px;align-items:center}#ctAjuda h4 span{flex:1}
#ctAjuda .ct-abas{display:flex;gap:4px;margin-bottom:8px}#ctAjuda .ct-abas button{flex:1;padding:5px;border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;font:600 12px 'Segoe UI',Arial,sans-serif}#ctAjuda .ct-abas button[aria-pressed=true]{border-color:#ffd447;background:#3a2e14}
#ctAjuda .ct-linha{display:grid;grid-template-columns:22px 1fr auto;gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06)}#ctAjuda kbd{background:#0b1424;border:1px solid #3b5878;border-bottom-width:2px;border-radius:6px;padding:1px 7px;font:600 12px 'Segoe UI',Arial,sans-serif;color:#ffe9a8;white-space:nowrap}
#ctAjuda .ct-rodape{display:flex;gap:6px;margin-top:8px}#ctAjuda .ct-rodape button,#ctConfig button.ct-b{padding:6px 10px;border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;font:600 12px 'Segoe UI',Arial,sans-serif}
#ctConfig{position:fixed;inset:0;z-index:10060;background:rgba(3,8,18,.74);display:flex;align-items:center;justify-content:center;padding:10px}#ctConfig[hidden]{display:none}
#ctConfig .c{width:min(760px,100%);max-height:calc(100vh - 20px);overflow:auto;background:#101a2e;border:1px solid #3b5878;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;padding:14px 16px}
#ctConfig h3{margin:0 0 4px;color:#8ee7ff}#ctConfig table{width:100%;border-collapse:collapse;margin-top:8px}#ctConfig th,#ctConfig td{padding:5px 6px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;vertical-align:middle}
#ctConfig td button{min-width:96px;padding:4px 8px;border-radius:7px;border:1px solid #3b5878;background:#16233a;color:#ffe9a8;cursor:pointer;font:600 12px 'Segoe UI',Arial,sans-serif}#ctConfig td button.esperando{border-color:#ffd447;background:#3a2e14;color:#fff;animation:ctPisca .8s ease-in-out infinite}
#ctConfig td.fixo{color:#9fb3cc}#ctConfig .ct-aviso{min-height:1.4em;color:#ffe9a8;margin:6px 0}@keyframes ctPisca{50%{opacity:.55}}
@media(prefers-reduced-motion:reduce){#ctConfig td button.esperando{animation:none}}`;
 if(!root.getElementById('ctCss')){const st=root.createElement('style');st.id='ctCss';st.textContent=ESTILO;root.head.append(st);}

 // ---------------------------------------------------------------- executar uma ação
 const candidatos=()=>{const a=ator();if(!a)return [];return (ctl()?.tokensNoMapa?.()||[]).filter(t=>t.id!==a.id).map(t=>({id:t.id,d:Math.hypot(Number(t.x)-Number(a.x),Number(t.y)-Number(a.y))})).sort((p,q)=>p.d-q.d);};
 const nodoDe=id=>{const b=board();return id&&b?b.querySelector(`[data-token="${CSS.escape(String(id))}"]`):null;};
 const verNaTela=n=>{try{n?.scrollIntoView?.({block:'center',inline:'center',behavior:'smooth'});}catch(_){}};
 function marcar(id){if(!id)return;ctl()?.marcarAlvo?.(id);verNaTela(nodoDe(id));}
 function interagir(){
  const a=ator(),n=nodoDe(a?.id);if(!n)return false;const r=n.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,lim=Math.max(70,r.width*3);
  const btns=[...root.querySelectorAll('#moCamada .mo-ic,#moCamada .mo-vizinho,#arCamada button,#maCamada button')].filter(x=>x.offsetParent!==null&&!x.classList.contains('mo-disc'));
  const m=btns.map(x=>{const q=x.getBoundingClientRect();return {x,d:Math.hypot(q.left+q.width/2-cx,q.top+q.height/2-cy)};}).filter(o=>o.d<=lim).sort((p,q)=>p.d-q.d)[0];
  if(m){m.x.click();return true;}
  const tp=root.querySelector('#tpBotao button');if(tp){tp.click();return true;}return false;
 }
 function trocarArma(passo){const ac=acoes();if(!ac?.escolherRapido)return;const n=armaI+passo;if(n>=0&&ac.escolherRapido(n)){armaI=n;return;}if(n<0){for(let k=7;k>=0;k--)if(ac.escolherRapido(k)){armaI=k;return;}return;}if(ac.escolherRapido(0))armaI=0;}
 function executar(id,extra={}){
  try{switch(id){
   case 'saltos':win.mesaSaltos?.pular?.();break;
   case 'atacar':acoes()?.disparar?.();break;
   case 'interagir':interagir();break;
   case 'alvoProximo':marcar(proximoAlvo(candidatos(),ctl()?.alvo?.()||'',1));break;
   case 'alvoAnterior':marcar(proximoAlvo(candidatos(),ctl()?.alvo?.()||'',-1));break;
   case 'alvoMaisPerto':marcar(candidatos()[0]?.id);break;
   case 'armaProxima':trocarArma(1);break;case 'armaAnterior':trocarArma(-1);break;
   case 'itens':if(win.mesaEquipar?.abrir)win.mesaEquipar.abrir();else root.getElementById('uiBotao')?.click();break;
   case 'montar':root.querySelector('#tpBotao button')?.click();break;
   case 'defesa':win.mesaAtitudesRT?.alternar?.('defesa');break;case 'ataqueTotal':win.mesaAtitudesRT?.alternar?.('ataque');break;case 'recuo':win.mesaAtitudesRT?.alternar?.('fuga');break;
   case 'postura':{const a=ator(),ps=['em_pe','agachado','rastejando'];if(a){const i=ps.indexOf(win.mesaPosturas?.postura(a.id));void win.mesaPosturas?.pedir(ps[(i+1)%ps.length]);}break;}
   case 'pausar':root.querySelector('[data-pausa]')?.click();break;
   case 'centralizar':verNaTela(nodoDe(ator()?.id));break;
   case 'correr':win.mesaCorrerV205?.alternar?.();break;
   case 'editarPersonagem':root.getElementById('pedBotao')?.click();break;
   case 'ajuda':alternarAjuda();break;
   case 'cancelar':acoes()?.fechar?.();root.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));break;
   case 'alvoEAtacar':{const n=extra.alvo?.closest?.('[data-token]');if(n&&n.dataset.token!==ator()?.id){marcar(n.dataset.token);setTimeout(()=>acoes()?.disparar?.(),120);}break;}
  }}catch(e){console.warn('[Controles]',id,e);}
 }
 // ---------------------------------------------------------------- teclado
 const digitando=e=>{const t=e.target;return !!t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable);};
 const visivel=()=>{const b=board();return !!b&&b.offsetParent!==null;};
 function paraAndar(){const c=ctl();if(andando){c?.pararAndar?.();andando=false;}}
 function andar(){const v=vetorMovimento(teclas),c=ctl();if(!c)return;if(v.x||v.y){andando=!!c.andarDirecao?.(v.x,v.y)||andando;}else paraAndar();}
 root.addEventListener('keydown',e=>{
  if(capturando||digitando(e)||e.ctrlKey||e.metaKey||e.altKey)return;uso='teclado';
  if(MOVIMENTO[e.code]&&visivel()&&ator()){e.preventDefault();teclas.add(e.code);andar();iniciarRenovacao();return;}
  const a=acaoDoBotao(cfg,'teclado',chaveDoEvento(e));
  if(a&&(visivel()||a==='ajuda')){if(e.repeat&&a!=='atacar'){e.preventDefault();return;}e.preventDefault();executar(a);}
 });
 // v204: o jogo anda 1,5 m por pedido de direção; segurar a tecla tem de RENOVAR o pedido (antes o personagem parava depois de 1,5 m mesmo com a tecla apertada)
 let renovador=0;
 function iniciarRenovacao(){if(renovador)return;renovador=win.setInterval(()=>{if(!teclas.size){win.clearInterval(renovador);renovador=0;return;}andar();},110);}
 root.addEventListener('keyup',e=>{if(teclas.delete(e.code))andar();});
 win.addEventListener('blur',()=>{teclas.clear();paraAndar();});
 // ---------------------------------------------------------------- mouse (esquerdo é do jogo: andar)
 function noMapa(e){const b=board();return !!b&&b.contains(e.target);}
 root.addEventListener('mousedown',e=>{if(capturando||e.button===0||!noMapa(e)||digitando(e))return;uso='mouse';
  const a=acaoDoBotao(cfg,'mouse',e.button);if(a){e.preventDefault();e.stopPropagation();executar(a,{alvo:e.target});}
 },true);
 root.addEventListener('contextmenu',e=>{if(noMapa(e))e.preventDefault();},true);
 for(const t of ['mouseup','auxclick'])root.addEventListener(t,e=>{if(e.button>=3&&noMapa(e))e.preventDefault();},true);
 // ---------------------------------------------------------------- controle: ajuda ao ligar; botões trocados valem por cima do mesa-controle
 win.addEventListener('gamepadconnected',()=>{uso='controle';alternarAjuda(true);setTimeout(()=>{if(uso==='controle'&&ajudaAberta&&!capturando)alternarAjuda(false);},14000);});
 function sondarControle(){
  const pads=[...(win.navigator?.getGamepads?.()||[])].filter(Boolean);if(!pads.length)return;
  const gp=pads[0];const algum=gp.buttons.some(b=>b.pressed);if(algum&&uso!=='controle'){uso='controle';if(ajudaAberta)desenharAjuda();}
 }
 // consultado pelo mesa-controle.js a cada botão apertado: '' = nada; string = ação trocada; undefined = comportamento padrão dele
 win.mesaControlesV192={
  mapeado:nome=>{const a=acaoDoBotao(cfg,'controle',nome),padrao=acaoDoBotao(configVazia(),'controle',nome);return a===padrao?undefined:a;},
  executar,config:()=>cfg,ajuda:alternarAjuda,uso:()=>uso
 };
 // ---------------------------------------------------------------- ajuda (balão)
 function desenharAjuda(){
  if(!ajuda)return;const linhas=linhasDeAjuda(cfg,uso);
  const h=`<h4><span>🎮 Controles · ${DISPOSITIVOS[uso]||''}</span><button type="button" data-fechar title="Fechar" style="border:0;background:none;color:#fff;font-size:16px;cursor:pointer">✕</button></h4>
  <div class="ct-abas">${Object.entries(DISPOSITIVOS).map(([k,n])=>`<button type="button" data-aba="${k}" aria-pressed="${k===uso}">${n}</button>`).join('')}</div>
  ${linhas.map(l=>`<div class="ct-linha"><span>${l.icone}</span><span title="${esc(acaoPorId(l.id)?.dica||'')}">${esc(l.nome)}</span><kbd>${esc(l.tecla)}</kbd></div>`).join('')}
  <div class="ct-rodape"><button type="button" data-config>⚙️ Trocar controles</button><button type="button" data-fechar>Entendi</button></div>`;
  if(ajuda.dataset.h!==h){ajuda.innerHTML=h;ajuda.dataset.h=h;}
 }
 function alternarAjuda(abrir){
  ajudaAberta=abrir===undefined?!ajudaAberta:!!abrir;
  if(!ajuda){ajuda=root.createElement('div');ajuda.id='ctAjuda';ajuda.hidden=true;ajuda.addEventListener('pointerdown',e=>e.stopPropagation());
   ajuda.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.fechar!==undefined)alternarAjuda(false);else if(b.dataset.aba){uso=b.dataset.aba;ajuda.dataset.h='';desenharAjuda();}else if(b.dataset.config!==undefined)abrirConfig();});root.body.append(ajuda);}
  ajuda.hidden=!ajudaAberta;if(ajudaAberta){ajuda.dataset.h='';desenharAjuda();}
 }
 // ---------------------------------------------------------------- configurações: trocar controles
 function abrirConfig(){
  if(!painel){painel=root.createElement('div');painel.id='ctConfig';painel.hidden=true;root.body.append(painel);painel.addEventListener('pointerdown',e=>{if(e.target===painel)fecharConfig();});
   painel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.x!==undefined)return fecharConfig();
    if(b.dataset.padrao!==undefined){cfg=restaurar(cfg,b.dataset.padrao==='tudo'?'':b.dataset.padrao);if(b.dataset.padrao==='tudo')cfg=configVazia();salvar();aviso('Controles voltaram ao padrão.');return desenharConfig();}
    if(b.dataset.trocar){iniciarCaptura(b.dataset.d,b.dataset.trocar,b);return;}
    if(b.dataset.limpar){const r=trocar(cfg,b.dataset.d,b.dataset.limpar,'');cfg=r.cfg;salvar();return desenharConfig();}});}
  painel.hidden=false;desenharConfig();
 }
 function fecharConfig(){cancelarCaptura();if(painel)painel.hidden=true;}
 let msg='';const aviso=t=>{msg=t;const x=painel?.querySelector('.ct-aviso');if(x)x.textContent=t;};
 function desenharConfig(){
  if(!painel)return;const ds=Object.keys(DISPOSITIVOS);
  const linhas=ACOES.map(a=>`<tr><td>${a.icone} <b>${esc(a.nome)}</b><br><small style="color:#9fb3cc">${esc(a.dica)}</small></td>${ds.map(d=>{if(a.so&&!a.so.includes(d))return '<td class="fixo">—</td>';const v=efetivo(cfg,d)[a.id];if(a.fixo)return `<td class="fixo">${esc(rotulo(d,v))} <small>(fixo)</small></td>`;return `<td><button type="button" data-d="${d}" data-trocar="${a.id}" title="Clique e depois aperte a nova tecla/botão">${esc(rotulo(d,v))}</button>${Object.hasOwn(cfg[d]||{},a.id)?` <button type="button" data-d="${d}" data-limpar="${a.id}" title="Desligar neste aparelho" style="min-width:0;padding:3px 6px">✕</button>`:''}</td>`;}).join('')}</tr>`).join('');
  painel.innerHTML=`<div class="c"><h3>⚙️ Trocar controles</h3><div style="color:#c6d3e6">Clique no botão da tabela e aperte a nova tecla, botão do mouse ou botão do controle. Cada botão só faz uma coisa por aparelho; se você usar um já ocupado, a outra ação fica sem ligação. <b>Esc</b> cancela.</div>
  <div class="ct-aviso">${esc(msg)}</div><table><thead><tr><th>Ação</th>${ds.map(d=>`<th>${DISPOSITIVOS[d]}</th>`).join('')}</tr></thead><tbody>${linhas}</tbody></table>
  <div style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;margin-top:10px"><span style="display:flex;gap:6px;flex-wrap:wrap">${ds.map(d=>`<button type="button" class="ct-b" data-padrao="${d}">Padrão do ${d}</button>`).join('')}<button type="button" class="ct-b" data-padrao="tudo">Tudo ao padrão</button></span><button type="button" class="ct-b" data-x>Fechar</button></div></div>`;
 }
 function cancelarCaptura(){if(!capturando)return;capturando.botao?.classList.remove('esperando');capturando=null;if(rafCap)win.cancelAnimationFrame(rafCap);rafCap=0;root.removeEventListener('keydown',noTeclaCaptura,true);root.removeEventListener('mousedown',noMouseCaptura,true);}
 function terminarCaptura(valor){const {disp,acao}=capturando;const r=trocar(cfg,disp,acao,valor);cancelarCaptura();if(r.erro){aviso('⚠️ '+r.erro);}else{cfg=r.cfg;salvar();aviso(`${acaoPorId(acao).nome}: ${rotulo(disp,valor)}${r.desligada?` · "${acaoPorId(r.desligada).nome}" ficou sem ligação`:''}.`);}desenharConfig();}
 function noTeclaCaptura(e){e.preventDefault();e.stopPropagation();if(e.code==='Escape'){cancelarCaptura();aviso('Troca cancelada.');return desenharConfig();}if(['ShiftLeft','ShiftRight','ControlLeft','ControlRight','AltLeft','AltRight','MetaLeft','MetaRight'].includes(e.code))return;terminarCaptura(chaveDoEvento(e));}
 function noMouseCaptura(e){if(e.target.closest?.('#ctConfig button'))return;e.preventDefault();e.stopPropagation();terminarCaptura(e.button);}
 function iniciarCaptura(disp,acao,botao){
  cancelarCaptura();capturando={disp,acao,botao};botao.classList.add('esperando');botao.textContent='Aperte…';aviso(`Aperte a nova ${disp==='teclado'?'tecla':disp==='mouse'?'botão do mouse':'botão do controle'} para "${acaoPorId(acao).nome}" (Esc cancela).`);
  if(disp==='teclado')root.addEventListener('keydown',noTeclaCaptura,true);
  else if(disp==='mouse')root.addEventListener('mousedown',noMouseCaptura,true);
  else{gpAntes={};const nomes=['A','B','X','Y','LB','RB','LT','RT','BACK','START','L3','R3','CIMA','BAIXO','ESQ','DIR'];root.addEventListener('keydown',noTeclaCaptura,true);
   const laco=()=>{if(!capturando||capturando.disp!=='controle')return;const gp=[...(win.navigator?.getGamepads?.()||[])].filter(Boolean)[0];if(gp){const idx={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,BACK:8,START:9,L3:10,R3:11,CIMA:12,BAIXO:13,ESQ:14,DIR:15};for(const n of nomes){const p=!!(gp.buttons[idx[n]]?.pressed);if(p&&!gpAntes[n]){gpAntes[n]=true;return terminarCaptura(n);}gpAntes[n]=p;}}rafCap=win.requestAnimationFrame(laco);};
   rafCap=win.requestAnimationFrame(laco);}
 }
 // ---------------------------------------------------------------- botão ❓ e vigia
 function botaoAjuda(){
  if(!botao||!botao.isConnected){botao=root.createElement('button');botao.type='button';botao.id='ctBotao';botao.textContent='❓';botao.title='Ajuda dos controles (H)';botao.setAttribute('aria-label','Ajuda dos controles');botao.addEventListener('click',()=>alternarAjuda());root.body.append(botao);}
  botao.hidden=!visivel();
 }
 const vigia=setInterval(()=>{try{botaoAjuda();sondarControle();if(ajudaAberta&&ajuda){desenharAjuda();}}catch(e){console.warn('[Controles]',e);}},600);
 const api={executar,ajuda:alternarAjuda,config:()=>cfg,definir:c=>{cfg=lerConfig(JSON.stringify(c));salvar();},abrirConfig,uso:()=>uso};win.mesaControlesMod=api;
 return {...api,parar(){clearInterval(vigia);cancelarCaptura();botao?.remove();ajuda?.remove();painel?.remove();paraAndar();delete win.mesaControlesV192;}};
}
