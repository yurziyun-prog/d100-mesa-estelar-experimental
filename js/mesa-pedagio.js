// Mesa Estelar v138 — Pedágio de Denzel no Portão de Véspera.
//
// Denzel, guarda meio corrupto, cobra a entrada conforme vai com a cara de cada um (muda a cada dia de jogo)
// e quer as armas: ou ficam com ele (devolvidas na saída) ou se paga mais para entrar armado.
// Quem chega perto dele vê "🛂 Falar com Denzel": pagar, deixar as armas, ou tentar a sorte com uma perícia
// (Influência, Comércio, Enganação, Intimidação, Ocultar Itens), uma tentativa de cada por dia.
// Quem passa atravessa o portão; quem está dentro pede para sair (e recebe as armas de volta).
// O jogador só faz o pedido; o navegador do mestre confere, rola os dados e move o personagem.

import {classificarTeste} from './nova-regras.js?v=46';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=v=>JSON.parse(JSON.stringify(v??null));
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',HIST='combatesAtivos/mapaMesaSyncHistorico';
export const ESTADO='combatesAtivos/mesaPedagio',PEDIDOS='combatesAtivos/mesaPedagio/acoes';
export const DENZEL='syncnpc:guarda_do_portao_1',ALCANCE=3.2;
// Portão (normalizado 28×14) no mapa gerado na v138: centro x 14, folha em y≈4,65; dentro = norte.
export const PORTAO_N={x:14,y:4.65,dentro:{x:14,y:2.6},fora:{x:14,y:6.6}};
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};

// Humor de Denzel com alguém num dia (0 = não foi com a cara; 1 = simpatizou). CAR ajuda um pouco.
export function humorDenzel(charId,dia,car=10){const h=hash(String(charId)+':'+dia)/4294967296+(Number(car)-10)*.03;return Math.max(0,Math.min(1,h));}
export function tabelaDenzel(h){
 if(h>.75)return {preco:5,extra:10,fala:'Denzel te mede de cima a baixo e quase sorri: — Hoje tá tranquilo. Cinco créditos e pode subir.'};
 if(h>.45)return {preco:12,extra:25,fala:'— Taxa de entrada: doze créditos. Regra é regra.'};
 if(h>.2)return {preco:25,extra:45,fala:'Denzel cruza os quatro braços. — Hum… vinte e cinco. E não me olhe assim.'};
 return {preco:40,extra:70,fala:'— Não fui com a sua cara. Quarenta, ou volta pro deserto.'};
}
// Tentativas com perícia: nome mostrado, perícia do personagem (nomes de busca), resistência de Denzel.
export const TENTATIVAS={
 negociar:{rotulo:'🗣️ Conversar',pericia:'Influência',nomes:['influência','influencia'],contra:22,dica:'Influência contra a Intuição de Denzel'},
 pechinchar:{rotulo:'🪙 Pechinchar',pericia:'Comércio',nomes:['comércio','comercio'],contra:22,dica:'Comércio contra a Intuição de Denzel'},
 enganar:{rotulo:'🤥 Enganar',pericia:'Enganação',nomes:['enganação','enganacao'],contra:22,dica:'Enganação contra a Intuição de Denzel: passar de graça'},
 intimidar:{rotulo:'😠 Intimidar',pericia:'Intimidação',nomes:['intimidação','intimidacao'],contra:24,dica:'Intimidação contra a Força de Vontade de Denzel'},
 esconder:{rotulo:'🫥 Esconder as armas',pericia:'Ocultar Itens',nomes:['ocultar itens','ocultar'],contra:30,dica:'Ocultar Itens contra a Percepção de Denzel',soArmado:true}
};
export function chanceContra(valor,contra){return Math.max(5,Math.min(95,Math.round(Number(valor)||0)+50-Number(contra||0)));}
// Aplica o resultado de uma tentativa ao estado de alguém (puro).
export function aplicarTentativa(e,tipo,grau){
 const n={...e,tentou:{...(e.tentou||{}),[tipo]:grau}},ok=grau==='Sucesso'||grau==='Crítico',crit=grau==='Crítico',fiasco=grau==='Fiasco';
 if(tipo==='negociar'){if(crit)return {...n,preco:0,extra:0,liberadoGratis:true,fala:'— Tá bom, tá bom. Hoje é por minha conta. Pode subir — com tudo.'};
  if(ok)return {...n,preco:Math.ceil(n.preco/2),extra:Math.ceil(n.extra/2),fala:'Denzel coça a carapaça. — Tá certo, faço pela metade.'};
  if(fiasco)return {...n,recusado:true,fala:'— Agora você me irritou. Hoje não entra. Volta amanhã.'};
  return {...n,preco:Math.ceil(n.preco*1.25),extra:Math.ceil(n.extra*1.25),fala:'— Conversa bonita não paga a taxa. Subiu.'};}
 if(tipo==='pechinchar'){if(crit)return {...n,preco:Math.ceil(n.preco/2),extra:0,fala:'— Negociante, hein? Metade, e as armas passam.'};
  if(ok)return {...n,preco:Math.ceil(n.preco*.7),extra:Math.ceil(n.extra*.7),fala:'— Hmpf. Tiro um pouco.'};
  if(fiasco)return {...n,preco:Math.ceil(n.preco*1.5),extra:Math.ceil(n.extra*1.5),fala:'Denzel ri alto. — Pechinchando comigo? Agora custa mais.'};
  return {...n,fala:'Denzel ri. — Não.'};}
 if(tipo==='enganar'){if(ok)return {...n,preco:0,extra:0,liberadoGratis:true,fala:crit?'— Ah, da parte do conselho? Desculpe, desculpe! Pode passar, com as suas coisas.':'Denzel hesita, confere o comunicador e acena. — Passa logo.'};
  if(fiasco)return {...n,recusado:true,fala:'— Acha que eu nasci ontem? Some daqui. Hoje não entra.'};
  return {...n,preco:n.preco*2,extra:n.extra*2,fala:'— Mentira tem preço. O dobro.'};}
 if(tipo==='intimidar'){if(crit)return {...n,preco:0,extra:0,liberadoGratis:true,fala:'Denzel engole em seco e abre o portão sem dizer nada.'};
  if(ok)return {...n,extra:0,fala:'— Tá… paga só a entrada e leva o que quiser.'};
  if(fiasco)return {...n,recusado:true,fala:'Denzel bate a lança de choque no chão e chama outros guardas. — Fora. Hoje não entra.'};
  return {...n,preco:Math.ceil(n.preco*1.5),extra:Math.ceil(n.extra*1.5),fala:'— Ameaça? Ficou mais caro.'};}
 if(tipo==='esconder'){if(ok)return {...n,armado:false,escondeu:true,fala:'Denzel nem repara nas armas escondidas.'};
  if(fiasco)return {...n,extra:n.extra*2,fala:'— E isso aqui debaixo do casaco? O dobro pelas armas, espertinho.'};
  return {...n,extra:Math.ceil(n.extra*1.5),fala:'— Estou vendo essas armas. Mais caro.'};}
 return n;
}

export function instalarPedagio(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const api=()=>win.mesaPedagioV138_||null;
 let estado={},mapa=null,relogio=null,parar=[],assinado='',balao=null,aberto='',botao=null,ocupado=false;
 const processados=new Set();
 // v158: o mapa é o que ESTE jogador está vendo (não o que o mestre abriu); ao processar um pedido, o mapa da miniatura dele
 let ctxMapaId=null,cenaCtx=null;
 const mapaId=()=>{try{return String(ctxMapaId||ctl()?.mapaAtual?.()||mapa?.mapId||'');}catch(_){return String(ctxMapaId||mapa?.mapId||'');}};
 // v161: mapas novos do portão guardam onde fica o portão (portaoN, em coordenadas da mesa)
 // v168: o portão também é achado pela cena (objeto "Portão de Véspera"), caso o mapa tenha perdido o portaoN numa edição.
 // Sem isso o jogo achava que quem estava do lado de fora já estava dentro (só aparecia "Sair de Véspera").
 const PN=()=>{const id=mapaId(),m=(dep.mapas?.()||[]).find(x=>String(x.id)===id);
  try{let c=ctl()?.cenaAtual?.();if(!(c&&String(c.mapId||'')===id)&&cenaCtx&&String(cenaCtx.mapId||'')===id)c=cenaCtx;if(c&&String(c.mapId||'')===id){const g=(c.objects||[]).find(o=>/^port[aã]o de v[eé]spera$/i.test(String(o.nome||'')));
   if(g){const {H}=dims(),k=14/H,y=Number(g.y),x=Number(g.x);return {x,y,dentro:{x,y:Math.max(.25,y-2*k)},fora:{x,y:Math.min(13.7,y+2.4*k)}};}}}catch(_){}
  // portão guardado no mapa — só se fizer sentido: o Denzel fica do lado de FORA (ao sul) do portão
  const d=denzel(),{H}=dims(),k=14/H;
  if(m?.portaoN?.x&&Number.isFinite(Number(m.portaoN.y))&&!(d&&Number(m.portaoN.y)>=Number(d.y)))return m.portaoN;
  if(d){const y=Math.max(.3,Number(d.y)-1.4*k),x=Number(d.x);return {x,y,dentro:{x,y:Math.max(.25,y-1.6*k)},fora:{x,y:Number(d.y)+1.2*k}};}
  return PORTAO_N;};
 const ehPortao=()=>{const id=mapaId();return id==='cenario_c001'||!!(dep.mapas?.()||[]).find(m=>String(m.id)===id&&(m.portaoV138||/port[aã]o de v[eé]spera/i.test(m.nome||'')));};
 const dims=()=>{const id=mapaId();try{const c=ctl();if(String(c?.mapaAtual?.()||'')===id){const d=c.dimsAtual?.();if(d?.W)return d;}}catch(_){}const m=(dep.mapas?.()||[]).find(x=>String(x.id)===id)||(String(mapa?.mapId)===id?mapa:null);return {W:Number(m?.larguraM)||28,H:Number(m?.alturaM)||14};};
 const dist=(a,b)=>{const {W,H}=dims();return Math.hypot((a.x-b.x)*W/28,(a.y-b.y)*H/14);};
 const denzel=()=>{try{const ts=(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===mapaId());return ts.find(t=>decodeURIComponent(String(t.id))===DENZEL)||ts.find(t=>decodeURIComponent(String(t.id)).startsWith('syncnpc:')&&/^denzel\b/i.test(String(t.nome||'').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,'')))||null;}catch(_){return null;}};
 const dia=()=>{const j=Number(relogio?.jogoMs);return Number.isFinite(j)&&j>0?Math.floor((j+(relogio?.ativo?(Date.now()-Number(relogio.realMs||Date.now()))*Number(relogio.fator||24):0))/86400000):Math.floor(Date.now()/86400000);};
 function ator(){const c=ctl();try{const t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 // v163: Denzel (o original ou uma cópia "Denzel" em outro mapa do portão)
 const ehDenzel=id=>{const d=decodeURIComponent(String(id||''));if(d.split('~')[0]===DENZEL)return true;if(!d.startsWith('syncnpc:'))return false;const t=(ctl()?.todosTokens?.()||[]).find(x=>decodeURIComponent(String(x.id))===d);return /^denzel\b/i.test(String(t?.nome||'').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,''));};
 let esperandoDesde=0;
 const ehPC=t=>!!t&&!decodeURIComponent(String(t.id||'')).startsWith('sync');
 // dentro = ao norte do portão (o portão vem da cena, do mapa ou da posição do Denzel — ver PN)
 const dentro=t=>Number(t.y)<Number(PN().y)-.05;
 const meu=t=>estado?.[decodeURIComponent(String(t.id))]||null;

 // ------------------------------------------------------------ interface (todos)
 const CSS=`#pdBotao{position:absolute;z-index:34;transform:translate(-50%,-190%);height:28px;padding:0 10px;border-radius:999px;border:1px solid #ffd447;background:rgba(32,24,6,.94);color:#ffe9a8;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;white-space:nowrap}
#pdBalao{position:fixed;z-index:9002;width:min(330px,calc(100vw - 24px));padding:10px 12px;border-radius:12px;background:rgba(9,15,29,.97);border:1px solid #ffd447;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.55)}
#pdBalao[hidden]{display:none}#pdBalao h4{margin:0 0 6px;display:flex;align-items:center;gap:6px;color:#ffd447;font-size:14px}#pdBalao h4 span{flex:1}
#pdBalao h4 button{width:24px;height:24px;border-radius:7px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;padding:0}
#pdBalao .pd-fala{font-style:italic;color:#ffe9a8;margin:4px 0 8px;line-height:1.35}
#pdBalao .pd-b{display:block;width:100%;margin:4px 0;min-height:30px;padding:4px 10px;border-radius:9px;border:1px solid #2f4664;background:rgba(255,255,255,.05);color:#e8eefc;cursor:pointer;font:inherit;text-align:left}
#pdBalao .pd-b:hover:not(:disabled){border-color:#ffd447}#pdBalao .pd-b:disabled{opacity:.45;cursor:not-allowed}
#pdBalao .pd-grade{display:grid;grid-template-columns:1fr 1fr;gap:4px}#pdBalao .pd-grade .pd-b{margin:0;font-size:12px}
#pdBalao .pd-info{color:#9fb3cc;font-size:12px;margin:4px 0}`;
 if(!root.getElementById('pdCss')){const st=root.createElement('style');st.id='pdCss';st.textContent=CSS;root.head.append(st);}
 function desenharBotao(){
  const b=root.getElementById('novaSyncBoard');const a=ator(),d=denzel();let mostrar=null;
  if(b&&a&&ehPC(a)&&ehPortao()&&String(a.mapaId||mapaId())===mapaId()){
   if(!dentro(a)&&d&&dist(a,d)<=ALCANCE)mostrar={x:d.x,y:d.y,txt:'🛂 Falar com Denzel',tip:'Denzel cobra a entrada de Véspera'};
   else if(dentro(a)&&dist(a,PN())<=ALCANCE+1)mostrar={x:PN().x,y:PN().y,txt:'🚪 Pedir para sair',tip:'Denzel abre o portão (e devolve as armas que ficaram com ele)'};
  }
  // v168: o balão aberto só fecha se o personagem se afastar de verdade (antes fechava sozinho em meio segundo)
  if(!mostrar){botao?.remove();botao=null;if(aberto){const d=denzel();if(!a||!d||String(decodeURIComponent(a.id))!==aberto||dist(a,d)>ALCANCE+3)fechar();}return;}
  if(!botao||botao.parentElement!==b){botao?.remove();botao=root.createElement('button');botao.type='button';botao.id='pdBotao';botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',()=>abrir(ator()));b.append(botao);}
  if(botao.textContent!==mostrar.txt)botao.textContent=mostrar.txt;botao.title=mostrar.tip;botao.style.left=mostrar.x/28*100+'%';botao.style.top=mostrar.y/14*100+'%';
  if(aberto)desenharBalao();
 }
 function abrir(a){
  if(!a)return;aberto=String(decodeURIComponent(a.id));
  if(!balao){balao=root.createElement('div');balao.id='pdBalao';balao.hidden=true;root.body.append(balao);balao.addEventListener('pointerdown',e=>e.stopPropagation());balao.addEventListener('click',aoClicar);}
  balao.hidden=false;balao.dataset.h='';
  const e=meu(a);if(!dentro(a)&&(!e||e.dia!==dia()))void pedir('falar');
  desenharBalao();
  const r=botao?.getBoundingClientRect();if(r){balao.style.left=Math.max(8,Math.min(win.innerWidth-340,r.left))+'px';balao.style.top=Math.max(8,Math.min(win.innerHeight-360,r.bottom+8))+'px';}
 }
 function fechar(){aberto='';if(balao)balao.hidden=true;}
 // v146: clicar no Denzel (fora de combate) abre a conversa direto; longe demais, avisa para chegar perto
 function avisoPerto(txt){const n=root.createElement('div');n.textContent=txt;n.style.cssText='position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:9999;background:#2a2214;border:1px solid #ffd447;color:#ffe9a8;padding:8px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;pointer-events:none';root.body.append(n);setTimeout(()=>n.remove(),3200);}
 const dialogoAnterior=win.mesaDialogoNPC_;
 win.mesaDialogoNPC_=(id,atorId)=>{
  try{const tk=(ctl()?.todosTokens?.()||[]).find(t=>String(t.id)===String(id)),ehDenzel=decodeURIComponent(String(id)).split('~')[0]===DENZEL||/^denzel\b/i.test(String(tk?.nome||'').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,''));
   if(ehDenzel){const a=ator(),d=denzel()||tk;
   if(a&&ehPC(a)&&d){
    if(!dentro(a)&&dist(a,d)>ALCANCE){avisoPerto('🚶 Chegue perto do Denzel (uns 3 m) para conversar e negociar a entrada.');return true;}
    abrir(a);const n=root.querySelector(`#novaSyncBoard [data-token="${win.CSS.escape(String(d.id))}"]`)?.getBoundingClientRect();
    if(n&&balao){balao.style.left=Math.max(8,Math.min(win.innerWidth-340,n.left))+'px';balao.style.top=Math.max(8,Math.min(win.innerHeight-360,n.bottom+8))+'px';}
    return true;}}}catch(e){console.warn('[Pedágio] diálogo',e);}
  return typeof dialogoAnterior==='function'?dialogoAnterior(id,atorId):false;
 };
 function desenharBalao(){
  if(!balao||balao.hidden)return;const a=ator();if(!a||decodeURIComponent(a.id)!==aberto){fechar();return;}
  const e=meu(a),nome=String(a.nome||'').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,'');let h=`<h4>🛂 <span>Denzel · Portão de Véspera</span><button type="button" data-x title="Fechar">✕</button></h4>`;
  if(dentro(a)){
   h+=`<div class="pd-fala">— Vai descer? Tá, eu abro.${e?.guardadas?.length?' E toma suas coisas de volta.':''}</div><button type="button" class="pd-b" data-acao="sair">🚪 Sair de Véspera${e?.guardadas?.length?` (receber ${e.guardadas.length} arma(s))`:''}</button>`;
  }else if(!e||e.dia!==dia()){if(!esperandoDesde)esperandoDesde=Date.now();h+='<div class="pd-info">⏳ Denzel está olhando para você…</div>';
   if(Date.now()-esperandoDesde>5000)h+='<div class="pd-info" style="color:#ffbd7a">Esperando o mestre: a conta do mestre precisa estar com o site aberto (é ela que rola os dados de Denzel).</div>';}
  else if(e.liberado)h+=`<div class="pd-fala">— Já pagou. Pode passar.</div><button type="button" class="pd-b" data-acao="passar">🚶 Passar pelo portão</button>`;
  else{
   h+=`<div class="pd-fala">${esc(e.fala||'')}</div>`;
   if(e.recusado)h+='<div class="pd-info">⛔ Denzel não deixa você entrar hoje.</div>';
   else{
    if(e.liberadoGratis)h+=`<button type="button" class="pd-b" data-acao="passar">🚶 Passar (de graça${e.armado?', com as armas':''})</button>`;
    else{
     h+=`<div class="pd-info">💳 Seus recursos: ${Number(e.recursos??0)} · Entrada: <b>${e.preco}</b>${e.armado?` · Armas (${esc((e.armas||[]).join(', '))}): <b>+${e.extra}</b>`:''}</div>`;
     if(!e.armado)h+=`<button type="button" class="pd-b" data-acao="pagar">💰 Pagar ${e.preco} e entrar</button>`;
     else h+=`<button type="button" class="pd-b" data-acao="pagarArmado">💰 Pagar ${e.preco+e.extra} e entrar armado</button><button type="button" class="pd-b" data-acao="deixarArmas">🗃️ Deixar as armas com Denzel e pagar ${e.preco}</button>`;
    }
    h+='<div class="pd-grade">'+Object.entries(TENTATIVAS).filter(([k,t])=>!t.soArmado||e.armado||e.tentou?.[k]).map(([k,t])=>`<button type="button" class="pd-b" data-acao="t:${k}" title="${esc(t.dica)} · uma tentativa por dia" ${e.tentou?.[k]||e.liberadoGratis?'disabled':''}>${t.rotulo}${e.tentou?.[k]?` · ${esc(e.tentou[k])}`:''}</button>`).join('')+'</div>';
   }
  }
  if(e&&e.dia===dia())esperandoDesde=0;
  if(e?.ultima)h+=`<div class="pd-info" style="color:#d9f6ff">${esc(e.ultima)}</div>`;
  // v163: se o Denzel também vende coisas, a loja dele fica aqui (o clique nele abre este balão, não a loja)
  try{const d=denzel(),m=d?win.mesaComerciantePorToken_?.(d.id):null;if(m?.comerciante)h+=`<button type="button" class="pd-b" data-loja="${esc(m.id)}">🛒 Ver o que o Denzel vende</button>`;}catch(_){}
  if(ocupado)h+='<div class="pd-info">⏳ …</div>';
  h+='<button type="button" class="pd-b" data-outras style="font-size:12px;opacity:.85" title="Atacar, perícia, psi… (botão direito no Denzel também abre)">⚔️ Outras ações com o Denzel</button>';
  if(balao.dataset.h!==h){balao.innerHTML=h;balao.dataset.h=h;}
 }
 async function aoClicar(ev){const b=ev.target.closest('button');if(!b)return;if(b.dataset.x!==undefined){fechar();return;}if(b.dataset.loja){fechar();try{win.abrirComercioCenarioV73_?.(b.dataset.loja);}catch(_){}return;}if(b.dataset.outras!==undefined){fechar();const d=denzel();if(d)win.mesaAcoesMapaAbrir_?.(String(d.id));return;}const ac=b.dataset.acao;if(ac)await pedir(ac);}
 async function pedir(acao){
  const a=ator();if(!a||ocupado)return;ocupado=true;desenharBalao();
  const cmd={donoUid:uid(),personagemId:decodeURIComponent(String(a.id)),acao,criadoEm:Date.now()};
  try{if(ehMestre())await processar('local'+Date.now(),cmd);else await dep.setDoc(D(PEDIDOS+'/p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),cmd);}
  catch(e){console.warn('[Pedágio]',e);}finally{setTimeout(()=>{ocupado=false;if(balao)balao.dataset.h='';desenharBalao();},ehMestre()?50:900);}
 }

 // ------------------------------------------------------------ regras (navegador do mestre)
 async function salvarEstado(id,e){estado={...estado,[id]:e};await dep.setDoc(D(ESTADO),clean({[id]:e,atualizadoEm:Date.now()}),{merge:true});}
 async function registrar(msg){try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HIST)),h=s.exists()?s.data():{entries:[],revision:0};tx.set(D(HIST),clean({entries:[...(h.entries||[]),{id:'pd:'+Date.now().toString(36),ts:Date.now(),actorUid:'',targetUid:'',message:msg}].slice(-120),revision:Number(h.revision||0)+1}));});}catch(_){}}
 async function mover(id,p){
  const lista=ctl()?.todosTokens?.()||[],ocup=lista.filter(t=>String(t.mapaId||'')===mapaId()&&decodeURIComponent(t.id)!==id);
  let q={...p};for(let k=0;k<10&&ocup.some(o=>dist(o,q)<1);k++)q={x:p.x+((k%3)-1)*1.1*28/dims().W,y:p.y+(k>5?(dentro(p)?-1:1):0)*14/dims().H};
  await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+encodeURIComponent(id)),s=await tx.get(r);if(!s.exists())throw Error('Personagem não está no mapa.');tx.set(r,{...s.data(),x:+q.x.toFixed(3),y:+q.y.toFixed(3),facing:dentro(q)?-Math.PI/2:Math.PI/2,revision:Number(s.data().revision||0)+1});});
 }
 async function processar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);
  try{
   const id=String(cmd.personagemId||''),t=(ctl()?.todosTokens?.()||[]).find(x=>decodeURIComponent(String(x.id))===id);if(!t)throw Error('Personagem não está no mapa.');ctxMapaId=String(t.mapaId||'')||null;
   try{const cc=ctl()?.cenaAtual?.();if(ctxMapaId&&String(cc?.mapId||'')!==ctxMapaId&&String(cenaCtx?.mapId||'')!==ctxMapaId){const sn=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(ctxMapaId)));cenaCtx=sn.exists()?sn.data():null;}}catch(_){} // v168: portão do mapa do jogador
   if(String(t.donoUid||'')!==String(cmd.donoUid||'')&&!ehMestre())throw Error('Pedido de quem não controla o personagem.');
   if(!ehPortao()||String(t.mapaId||'')!==mapaId())throw Error('Fora do Portão de Véspera.');
   const P=api();if(!P)throw Error('Ponte do pedágio indisponível.');
   const hoje=dia(),nome=String(t.nome||'Alguém').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,'');
   let e=estado?.[id];
   if(cmd.acao==='sair'){
    if(!dentro(t))throw Error('Já está do lado de fora.');
    let msg='';if(e?.guardadas?.length){const n=await P.devolverArmas(id,e.guardadas);msg=` Recebeu ${n} arma(s) de volta.`;e={...e,guardadas:e.guardadas.slice(n)};}
    await mover(id,PN().fora);await salvarEstado(id,{...(e||{}),liberado:false,ultima:'🚪 Denzel abriu o portão.'+msg});await registrar(`🛂 ${nome} saiu pelo Portão de Véspera.${msg}`);return;
   }
   const d=denzel();if(!d||dist(t,d)>ALCANCE+.8)throw Error('Longe de Denzel.');
   if(!e||e.dia!==hoje||cmd.acao==='falar'&&e.dia!==hoje){
    const car=await P.car(t),h=humorDenzel(id,hoje,car),tab=tabelaDenzel(h),armas=await P.armas(id),recursos=await P.recursos(id);
    e={dia:hoje,humor:+h.toFixed(3),preco:tab.preco,extra:tab.extra,armado:armas.length>0,armas,recursos,fala:tab.fala+(armas.length?` — E essas armas? Ou ficam comigo, ou são mais ${tab.extra}.`:''),tentou:{},guardadas:estado?.[id]?.guardadas||[],liberado:false};
   }
   if(cmd.acao==='falar'){await salvarEstado(id,e);return;}
   if(e.recusado)throw Error('Denzel não deixa entrar hoje.');
   if(cmd.acao.startsWith('t:')){
    const tipo=cmd.acao.slice(2),T=TENTATIVAS[tipo];if(!T||e.tentou?.[tipo])throw Error('Já tentou isso hoje.');
    const valor=await P.pericia(t,T.nomes),chance=chanceContra(valor,T.contra),die=1+Math.floor(Math.random()*100),r=classificarTeste(chance,die);
    e=aplicarTentativa(e,tipo,r.grau);e.ultima=`🎲 ${T.pericia} ${valor} (chance ${chance}%): ${die} → ${r.grau}`;
    await salvarEstado(id,e);await registrar(`🛂 ${nome} tenta ${T.pericia.toLowerCase()} com Denzel: ${die}/${chance} → ${r.grau}.`);return;
   }
   if(cmd.acao==='passar'){if(!(e.liberado||e.liberadoGratis))throw Error('Ainda não pagou.');await mover(id,PN().dentro);await salvarEstado(id,{...e,liberado:true,ultima:'🚶 Passou pelo portão.'});await registrar(`🛂 ${nome} entrou em Véspera${e.liberadoGratis?' sem pagar':''}.`);return;}
   let pago=0,msg='';
   if(cmd.acao==='pagar'){if(e.armado)throw Error('Denzel quer resolver as armas primeiro.');pago=e.preco;}
   else if(cmd.acao==='pagarArmado')pago=e.preco+e.extra;
   else if(cmd.acao==='deixarArmas'){pago=e.preco;}
   else throw Error('Ação desconhecida.');
   const resto=await P.cobrar(id,pago);
   if(cmd.acao==='deixarArmas'){const itens=await P.guardarArmas(id);e={...e,guardadas:[...(e.guardadas||[]),...itens],armado:false};msg=` Deixou ${itens.length} arma(s) com Denzel.`;}
   e={...e,liberado:true,recursos:resto,ultima:`💰 Pagou ${pago}.${msg} Denzel abre o portão.`};
   await mover(id,PN().dentro);await salvarEstado(id,e);await registrar(`🛂 ${nome} pagou ${pago} a Denzel e entrou em Véspera.${msg}`);
  }catch(err){const id=String(cmd.personagemId||'');const e=estado?.[id];if(e)try{await salvarEstado(id,{...e,ultima:'⚠️ '+(err?.message||err)});}catch(_){}console.warn('[Pedágio]',err?.message||err);}
  finally{ctxMapaId=null;if(!String(pid).startsWith('local'))try{await dep.deleteDoc?.(D(PEDIDOS+'/'+pid));}catch(_){}}
 }

 // ------------------------------------------------------------ assinaturas
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(ESTADO),s=>{const v=s.exists()?s.data():{};delete v.atualizadoEm;estado=v;if(balao)balao.dataset.h='';desenharBalao();},()=>{}));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D('combatesAtivos/mesaRelogio'),s=>{relogio=s.exists()?s.data():null;},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},()=>{}));
 }
 root.addEventListener('pointerdown',e=>{if(balao&&!balao.hidden&&!balao.contains(e.target)&&e.target.id!=='pdBotao')fechar();});
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}desenharBotao();}catch(e){console.warn('[Pedágio]',e);}},600);
 win.mesaPedagio={estado:()=>estado,pedir,processar,ehDenzel};
 return {parar(){clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});botao?.remove();balao?.remove();}};
}
