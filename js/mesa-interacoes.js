// Mesa Estelar v109 — Interações direto no mapa.
//
// As ações do cenário (investigar, examinar, abrir…) viram PONTOS no mapa: o jogador
// clica no ícone, escolhe a perícia e tenta ali mesmo. Comerciantes e prestadores de
// serviço são acessados clicando na miniatura do NPC. Tudo usa as MESMAS regras do
// Cenário Atual (limite diário por perícia, Sorte, preços, barganha), através da ponte
// `api()` exposta pelo app.js — este módulo só cuida da parte visual no mapa.
//
// Segurança: módulo carregado à parte; se falhar, o mapa e o Cenário Atual seguem iguais.

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const caminhoPontos=id=>'combatesAtivos/mesaPontos_'+encodeURIComponent(String(id||''));
export const RAIO_PADRAO=3;

// Distância em metros entre dois pontos normalizados (0–28 × 0–14).
export function distanciaM(a,b,W=28,H=14){return Math.hypot((a.x-b.x)*W/28,(a.y-b.y)*H/14);}
// Ação do contexto que corresponde a um ponto (pelo id; se as linhas mudaram de ordem, pelo título).
export function acaoDoPonto(ponto,acoes=[]){
 const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
 return acoes.find(a=>String(a.id)===String(ponto.acaoId))||acoes.find(a=>norm(a.titulo)===norm(ponto.titulo))||null;
}
// Linha no formato do cenário: Título|Ícone|Perícias|Dificuldade|Evidente|Sucesso|Crítico|Falha
export function linhaAcao({titulo,icone,pericias,dificuldade,evidente,sucesso,critico,falha}){
 const l=v=>String(v||'').replace(/[|\r\n]+/g,' ').replace(/\s+/g,' ').trim();
 return [l(titulo),l(icone)||'🔎',l(pericias)||'—',l(dificuldade)||'Padrão',l(evidente),l(sucesso),l(critico)||l(sucesso),l(falha)].join('|');
}

const ESTILO=`
.mi-pontos{position:absolute;inset:0;pointer-events:none;z-index:11}
.mi-ponto{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:16px;line-height:1;background:rgba(10,18,32,.82);border:2px solid #8ee7ff;box-shadow:0 0 0 0 rgba(142,231,255,.55),0 3px 8px rgba(0,0,0,.6);animation:miPulso 2.4s ease-out infinite}
.mi-ponto.mi-ok{border-color:#57e3a1;animation:none}
.mi-ponto.mi-ok::after{content:'✓';position:absolute;right:-5px;top:-6px;font:700 11px/14px Arial;color:#062;background:#57e3a1;border-radius:50%;width:14px;height:14px;text-align:center}
.mi-ponto.mi-off{opacity:.45;animation:none;border-style:dashed}
.mi-ponto.mi-foco{animation:miFoco .5s ease-in-out 4}
@keyframes miPulso{0%{box-shadow:0 0 0 0 rgba(142,231,255,.5),0 3px 8px rgba(0,0,0,.6)}70%{box-shadow:0 0 0 12px rgba(142,231,255,0),0 3px 8px rgba(0,0,0,.6)}100%{box-shadow:0 0 0 0 rgba(142,231,255,0),0 3px 8px rgba(0,0,0,.6)}}
@keyframes miFoco{50%{transform:translate(-50%,-50%) scale(1.5)}}
.mi-balao{position:absolute;z-index:14;width:280px;max-width:80%;padding:10px 12px;border-radius:12px;background:#0f1a2c;border:1px solid #8ee7ff;color:#e8eefc;font:12px/1.4 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.65);pointer-events:auto}
.mi-balao h4{margin:0 0 4px;font-size:13px;color:#8ee7ff;display:flex;gap:6px;align-items:center}
.mi-balao h4 span{flex:1}
.mi-balao .mi-txt{color:#c6d3e6;white-space:pre-line;margin:4px 0}
.mi-balao .mi-linha{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}
.mi-balao select{flex:1;min-width:0}
.mi-balao .mi-res{margin-top:6px;padding:6px 8px;border-radius:8px;font-size:12px}
.mi-res.ok{background:rgba(87,227,161,.1);border:1px solid rgba(87,227,161,.3);color:#cdf5df}
.mi-res.no{background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.25);color:#ffd0d0}
.mi-aviso{color:#ffd166;font-size:12px;margin-top:6px}
.mi-flutua{position:absolute;z-index:15;transform:translate(-50%,-100%);pointer-events:none;font:700 13px 'Segoe UI',Arial;color:#fff;text-shadow:0 1px 3px #000,0 0 6px #000;white-space:nowrap;animation:miSobe 2.6s ease-out forwards}
@keyframes miSobe{0%{opacity:0;margin-top:4px}12%{opacity:1}80%{opacity:1}100%{opacity:0;margin-top:-30px}}
#miGaveta{position:fixed;top:70px;left:12px;bottom:12px;width:min(360px,calc(100vw - 24px));z-index:9989;background:#101828;border:1px solid #49668a;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden}
#miGaveta[hidden]{display:none}
#miGaveta .mi-topo{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08)}
#miGaveta .mi-topo h3{margin:0;font-size:14px;color:#8ee7ff;flex:1}
#miGaveta .mi-corpo{flex:1;overflow:auto;padding:4px 12px 14px}
#miGaveta .mi-sep{margin:12px 0 6px;color:#8ee7ff;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
#miGaveta .mi-cartao{border:1px solid #2f4664;border-radius:12px;padding:9px 10px;background:rgba(255,255,255,.035);margin:7px 0}
#miGaveta .mi-cartao b{color:#e8eefc}
#miGaveta .mi-linha{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}
#miGaveta .mi-linha select,#miGaveta .mi-linha input{flex:1;min-width:0}
#miGaveta textarea{width:100%;min-height:46px;box-sizing:border-box;margin-top:4px}
#miGaveta .mi-npc{display:flex;gap:8px;align-items:center}
#miGaveta .mi-npc img{width:40px;height:40px;border-radius:8px;object-fit:cover;background:#222}
#novaSyncBoard.mi-colocando{cursor:crosshair!important}
`;

export function instalarInteracoesMapa(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const api=()=>dep.api?.()||null;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const D=p=>dep.doc(dep.db,...p.split('/'));
 if(!root.getElementById('miCssV109')){const st=root.createElement('style');st.id='miCssV109';st.textContent=ESTILO;root.head.append(st);}

 let mapaId='',pontos=[],parar=null,balao=null,gaveta=null,colocando=null,erros=[];
 const board=()=>root.getElementById('novaSyncBoard');
 const dims=()=>({W:Number(board()?.dataset.mapaLargura)||28,H:Number(board()?.dataset.mapaAltura)||14});
 const emCombate=()=>!!root.querySelector('#novaSyncBoard [data-turn-arrow]');
 const falhou=e=>{console.warn('[Interações no mapa]',e);erros=[...erros.filter(t=>Date.now()-t<120000),Date.now()];if(erros.length>=4){desligar();}};
 function desligar(){try{clearInterval(vigia);parar?.();board()?.querySelector('.mi-pontos')?.remove();fecharBalao();gaveta?.remove();root.getElementById('miBotao')?.remove();console.warn('[Interações no mapa] desligadas após erros repetidos; o resto do site segue normal.');}catch(_){}}

 // ---------------------------------------------------------------- contexto
 const contexto=()=>{try{return api()?.contexto?.()||{};}catch(_){return {};}};
 function acoesMestre(){
  // O mestre vê as ações do cenário ligado a ESTE mapa (mesmo que não seja o publicado).
  try{const c=(dep.cenarios?.()||[]).find(x=>String(x.mapaId||'')===mapaId);if(c)return {cenario:c,acoes:api()?.parse?.(c.interacoesTexto)||[]};}catch(_){}
  return {cenario:null,acoes:contexto().acoes||[]};
 }
 const acoesVisiveis=()=>ehMestre()?acoesMestre().acoes:(contexto().acoes||[]);
 const acoesPublicadas=()=>contexto().acoes||[];
 function meuToken(){
  const pid=String(api()?.personagemId?.()||'');if(!pid)return null;
  const n=board()?.querySelector(`[data-token="${CSS.escape(encodeURIComponent(pid))}"]`);
  return n?{x:Number(n.dataset.x),y:Number(n.dataset.y)}:null;
 }
 function longe(p,raio=RAIO_PADRAO){
  if(ehMestre())return 0;const t=meuToken();if(!t)return 0;
  const {W,H}=dims(),d=distanciaM(t,p,W,H);return d>raio?d:0;
 }

 // ---------------------------------------------------------------- pontos
 function observar(id){
  parar?.();parar=null;pontos=[];fecharBalao();
  if(!id||!dep.onSnapshot)return desenharPontos();
  parar=dep.onSnapshot(D(caminhoPontos(id)),s=>{pontos=s.exists()?(s.data()?.pontos||[]):[];desenharPontos();},falhou);
 }
 async function salvarPontos(lista){pontos=lista;desenharPontos();await dep.setDoc(D(caminhoPontos(mapaId)),{pontos:lista,mapId:mapaId,atualizadoEm:new Date().toISOString()});}
 function desenharPontos(){
  const b=board();if(!b)return;
  let camada=b.querySelector('.mi-pontos');if(!camada){camada=root.createElement('div');camada.className='mi-pontos';b.append(camada);}
  const acoes=acoesVisiveis(),pub=acoesPublicadas(),mestre=ehMestre();
  const itens=pontos.map(p=>{const a=acaoDoPonto(p,acoes),ok=!!a&&!!acaoDoPonto(p,pub);let feito=false;try{feito=!!a&&(api()?.pericias?.(a)||[]).some(r=>r.resultado?.sucesso);}catch(_){}return {p,a,ok,feito};}).filter(x=>mestre||x.ok&&!!meuToken()&&!longe(x.p,(Number(x.p.raio)||RAIO_PADRAO)+1.5)); // v143: o jogador só vê o ponto quando chega perto
  const chave=JSON.stringify(itens.map(x=>[x.p.id,x.p.x,x.p.y,x.a?.icone||x.p.icone,x.ok,x.feito]));
  if(camada.dataset.chave===chave)return;camada.dataset.chave=chave;
  camada.innerHTML=itens.map(({p,a,ok,feito})=>`<span class="mi-ponto${feito?' mi-ok':''}${ok?'':' mi-off'}" data-ponto="${esc(p.id)}" style="left:${p.x/28*100}%;top:${p.y/14*100}%" title="${esc((a?.titulo||p.titulo)+(ok?'':' (fora do Cenário Atual publicado)'))}">${esc(a?.icone||p.icone||'🔎')}</span>`).join('');
  camada.querySelectorAll('.mi-ponto').forEach(el=>el.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();abrirBalaoPonto(el.dataset.ponto);}));
 }
 function fecharBalao(){balao?.remove();balao=null;}
 function posicionarBalao(el,p){
  const b=board();if(!b)return;const dir=p.x>17;
  el.style.left=dir?'':`calc(${p.x/28*100}% + 20px)`;el.style.right=dir?`calc(${(28-p.x)/28*100}% + 20px)`:'';
  el.style.top=p.y>9?'':`calc(${p.y/14*100}% - 14px)`;el.style.bottom=p.y>9?`calc(${(14-p.y)/14*100}% - 14px)`:'';
 }
 function htmlAcao(a,{ponto=null}={}){
  let skills=[];try{skills=api()?.pericias?.(a)||[];}catch(_){}
  const usadas=skills.filter(s=>s.resultado);
  const res=usadas.map(s=>`<div class="mi-res ${s.resultado.sucesso?'ok':'no'}"><b>${esc(s.nome)}</b> ${s.resultado.rolagem}/${s.resultado.valor} → ${esc(s.resultado.grau)}${(s.texto||(!s.resultado.sucesso?a.falha:''))?`<br>${esc(s.texto||a.falha)}`:''}</div>`).join('');
  const dist=ponto?longe(ponto,Number(ponto.raio)||RAIO_PADRAO):0;
  const corpo=skills.length?`<div class="mi-linha"><select data-pericia>${skills.map(s=>`<option value="${esc(s.id)}">${esc(s.nome)}${s.valor!=null?` (${s.valor}%)`:''}${s.usada?' · usada hoje':''}</option>`).join('')}</select></div>
   <div class="mi-linha"><button type="button" class="btn-small btn-select" data-tentar${dist?' disabled':''}>🎲 Tentar</button>${usadas.length?`<button type="button" class="btn-small" data-sorte title="Gastar 1 Ponto de Sorte para rerrolar a perícia escolhida"${dist?' disabled':''}>⭐ Rerrolar</button>`:''}</div>`
   :`<div class="mi-linha"><button type="button" class="btn-small btn-select" data-tentar${dist?' disabled':''}>👉 Fazer</button></div>`;
  return `<div class="mi-txt">${esc(a.evidente||'')}</div>${corpo}${dist?`<div class="mi-aviso">🚶 Aproxime-se: você está a ${dist.toFixed(1)} m (precisa de ${Number(ponto.raio)||RAIO_PADRAO} m).</div>`:''}${res}`;
 }
 async function tentar(a,el,usarSorte,origem){
  const pid=el.querySelector('[data-pericia]')?.value||'';
  const botoes=[...el.querySelectorAll('button')];botoes.forEach(b=>b.disabled=true);
  try{
   const r=await api()?.executar?.(a.id,pid,usarSorte);
   if(r&&origem){const t=r.sucesso==null?'✔':r.sucesso?`✅ ${r.grau}`:`❌ ${r.grau}`;flutuar(origem,`${a.icone||'🔎'} ${t}`);}
  }catch(e){falhou(e);}
  botoes.forEach(b=>b.disabled=false);
 }
 function flutuar(p,texto){const b=board();if(!b)return;const f=root.createElement('div');f.className='mi-flutua';f.textContent=texto;f.style.left=p.x/28*100+'%';f.style.top=`calc(${p.y/14*100}% - 18px)`;b.append(f);setTimeout(()=>f.remove(),2700);}
 function abrirBalaoPonto(id){
  fecharBalao();const p=pontos.find(x=>x.id===id);if(!p)return;
  const a=acaoDoPonto(p,acoesVisiveis()),pub=!!acaoDoPonto(p,acoesPublicadas());
  const b=board();balao=root.createElement('div');balao.className='mi-balao';posicionarBalao(balao,p);
  const render=()=>{
   balao.innerHTML=`<h4><span>${esc(a?.icone||p.icone||'🔎')} ${esc(a?.titulo||p.titulo)}</span><button type="button" class="btn-small" data-x title="Fechar">✕</button></h4>
    ${a?htmlAcao(a,{ponto:p}):'<div class="mi-aviso">Esta ação não existe mais no cenário.</div>'}
    ${ehMestre()?`${pub?'':'<div class="mi-aviso">⚠️ O cenário deste mapa não é o Cenário Atual publicado — jogadores não veem este ponto.</div>'}<div class="mi-linha"><label style="display:flex;gap:4px;align-items:center">Alcance <input type="number" min="1" max="30" step="0.5" value="${Number(p.raio)||RAIO_PADRAO}" data-raio style="width:56px"> m</label><button type="button" class="btn-small" data-mover title="Mover este ponto">📍</button><button type="button" class="btn-small" data-del title="Remover ponto do mapa">🗑️</button></div>`:''}`;
   balao.querySelector('[data-x]').addEventListener('click',fecharBalao);
   balao.querySelector('[data-tentar]')?.addEventListener('click',async()=>{await tentar(a,balao,false,p);render();desenharPontos();});
   balao.querySelector('[data-sorte]')?.addEventListener('click',async()=>{await tentar(a,balao,true,p);render();desenharPontos();});
   balao.querySelector('[data-del]')?.addEventListener('click',async()=>{try{await salvarPontos(pontos.filter(x=>x.id!==id));}catch(e){falhou(e);}fecharBalao();redesenharGaveta();});
   balao.querySelector('[data-mover]')?.addEventListener('click',()=>{fecharBalao();iniciarColocacao({moverId:id});});
   balao.querySelector('[data-raio]')?.addEventListener('change',async ev=>{const r=Math.max(1,Math.min(30,Number(ev.target.value)||RAIO_PADRAO));try{await salvarPontos(pontos.map(x=>x.id===id?{...x,raio:r}:x));}catch(e){falhou(e);}});
  };
  render();
  balao.addEventListener('pointerdown',e=>e.stopPropagation());
  b.append(balao);
 }

 // ---------------------------------------------------------------- NPCs no mapa (comércio / serviços)
 win.mesaComerciantePorToken_=id=>{try{return comerciantePorToken(id);}catch(_){return null;}}; // v156: conversas (jogador) sabe quem é comerciante
 // v163: cada comerciante do mapa tem a sua loja (mesa-lojas: ramos + itens escolhidos pelo mestre)
 win.mesaComerciantePorTokenBase_=id=>{try{return comerciantePorTokenBase(id);}catch(_){return null;}};
 function comerciantePorToken(tokenId){const b=comerciantePorTokenBase(tokenId);try{const l=win.mesaLojasV163?.paraToken?.(tokenId,b);if(l)return l;}catch(_){}return b;}
 function comerciantePorTokenBase(tokenId){
  const id=decodeURIComponent(String(tokenId||''));if(!id.startsWith('syncnpc:'))return null;
  const npcId=id.slice(8).split('~')[0];
  return (contexto().comerciantes||[]).find(m=>String(m.id)===npcId)||(()=>{try{return api()?.comerciante?.(npcId)||null;}catch(_){return null;}})(); // v152: também comerciantes fora do cenário publicado
 }
 function abrirMenuNpc(node,m){
  fecharBalao();const p={x:Number(node.dataset.x),y:Number(node.dataset.y)};
  const b=board();balao=root.createElement('div');balao.className='mi-balao';posicionarBalao(balao,p);
  const dist=longe(p,RAIO_PADRAO);
  const rot=m.comerciante&&m.prestadorServicos?'🛒 Comércio e serviços':m.comerciante?'🛒 Ver mercadorias':'🧰 Ver serviços';
  try{win.mesaComerciantes?.conhecer?.(node.dataset.token);}catch(_){} // v141: conversar revela o nome
  const nomeV=(()=>{try{return win.mesaNomeVisivelV141?.({id:node.dataset.token,nome:m.nome})||m.nome;}catch(_){return m.nome;}})();
  balao.innerHTML=`<h4><span>${esc(nomeV)}</span><button type="button" class="btn-small" data-x title="Fechar">✕</button></h4>
   <div class="mi-txt">${esc(m.comercioNome&&m.comercioNome!==m.nome?m.comercioNome:(m.tipo||'NPC'))}${m.mercadoNegro?' · 🕶️ mercado negro':''}</div>
   <div class="mi-linha"><button type="button" class="btn-small btn-select" data-loja${dist?' disabled':''}>${rot}</button></div>
   ${dist?`<div class="mi-aviso">🚶 Chegue mais perto (${dist.toFixed(1)} m; precisa de ${RAIO_PADRAO} m).</div>`:''}`;
  balao.querySelector('[data-x]').addEventListener('click',fecharBalao);
  balao.querySelector('[data-loja]')?.addEventListener('click',()=>{fecharBalao();try{api()?.comercio?.(m.id);}catch(e){falhou(e);}});
  balao.addEventListener('pointerdown',e=>e.stopPropagation());
  b.append(balao);
 }
 function instalarCliques(){
  const b=board();if(!b||b.dataset.miCliques)return;b.dataset.miCliques='1';
  b.addEventListener('click',e=>{
   try{
    if(colocando||emCombate())return;
    const node=e.target.closest?.('[data-token]');if(!node)return;
    // v163: Denzel cobra a entrada (mesa-pedagio abre o balão dele; a loja dele, se tiver, fica num botão lá dentro)
    try{if(win.mesaPedagio?.ehDenzel?.(node.dataset.token))return;}catch(_){}
    const m=comerciantePorToken(node.dataset.token);
    // v161: perto do comerciante, o clique já abre a loja (comprar, vender e barganhar com Comércio/Influência/Submundo)
    if(m){const p={x:Number(node.dataset.x),y:Number(node.dataset.y)};if(!longe(p,RAIO_PADRAO)&&m.comerciante){fecharBalao();try{win.mesaComerciantes?.conhecer?.(node.dataset.token);}catch(_){}try{api()?.comercio?.(m.id);}catch(err){falhou(err);}}else abrirMenuNpc(node,m);}
    else if(/^syncnpc:comerciante_generico_/.test(decodeURIComponent(String(node.dataset.token||'')))){fecharBalao();const n=root.createElement('div');n.className='mi-balao';const p={x:Number(node.dataset.x),y:Number(node.dataset.y)};posicionarBalao(n,p);n.innerHTML='<h4><span>🛒 Comerciante</span><button type="button" class="btn-small" data-x title="Fechar">✕</button></h4><div class="mi-txt">A loja ainda está abrindo (o mestre precisa estar com a mesa aberta). Tente de novo em alguns segundos.</div>';n.querySelector('[data-x]').addEventListener('click',()=>n.remove());n.addEventListener('pointerdown',ev=>ev.stopPropagation());board()?.append(n);balao=n;}
   }catch(err){falhou(err);}
  });
  // colocação de pontos (mestre)
  b.addEventListener('pointerdown',async e=>{
   if(!colocando)return;e.stopPropagation();e.preventDefault();
   const r=b.getBoundingClientRect(),x=Math.max(.3,Math.min(27.7,(e.clientX-r.left)/r.width*28)),y=Math.max(.3,Math.min(13.7,(e.clientY-r.top)/r.height*14));
   const c=colocando;
   try{
    if(c.moverId)await salvarPontos(pontos.map(p=>p.id===c.moverId?{...p,x,y}:p));
    else await salvarPontos([...pontos.filter(p=>!(c.acao&&String(p.acaoId)===String(c.acao.id))),{id:crypto.randomUUID(),acaoId:String(c.acao.id),titulo:String(c.acao.titulo||''),icone:String(c.acao.icone||'🔎'),x,y,raio:RAIO_PADRAO}]);
   }catch(err){falhou(err);}
   fimColocacao();redesenharGaveta();
  },true);
 }
 let dicaEl=null,gavetaAntes=false;
 function iniciarColocacao(c){
  colocando=c;board()?.classList.add('mi-colocando');gavetaAntes=!!gaveta&&!gaveta.hidden;if(gaveta)gaveta.hidden=true;
  dicaEl?.remove();dicaEl=root.createElement('div');dicaEl.style.cssText='position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:9992;padding:9px 14px;border-radius:12px;border:1px solid #8ee7ff;background:#0f1a2c;color:#e8eefc;font:600 13px Segoe UI,Arial;box-shadow:0 10px 30px rgba(0,0,0,.5);pointer-events:none';
  dicaEl.textContent='📍 Clique no mapa para posicionar o ponto (Esc cancela)';root.body.append(dicaEl);
 }
 function fimColocacao(){colocando=null;board()?.classList.remove('mi-colocando');dicaEl?.remove();dicaEl=null;if(gavetaAntes)abrirGaveta();}
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&colocando)fimColocacao();});

 // ---------------------------------------------------------------- painel "Ações neste local"
 function instalarBotao(){
  const barra=root.querySelector('#sincronizacao-nova .nova-view-tools');if(!barra||root.getElementById('miBotao'))return;
  const b=root.createElement('button');b.type='button';b.id='miBotao';b.className='btn-small';b.textContent='🔎';b.title='Ações neste local: investigar, examinar, comércio';
  b.addEventListener('click',()=>{if(gaveta&&!gaveta.hidden){gaveta.hidden=true;colocando=null;board()?.classList.remove('mi-colocando');}else abrirGaveta();});
  barra.append(b);
 }
 function abrirGaveta(){if(!gaveta){gaveta=root.createElement('aside');gaveta.id='miGaveta';root.body.append(gaveta);}gaveta.hidden=false;redesenharGaveta();}
 function redesenharGaveta(){
  if(!gaveta||gaveta.hidden)return;
  const mestre=ehMestre(),{cenario,acoes}=mestre?acoesMestre():{cenario:null,acoes:acoesVisiveis()},pub=acoesPublicadas();
  const comerciantes=contexto().comerciantes||[];
  const rol=gaveta.querySelector('.mi-corpo')?.scrollTop||0;
  const fixado=a=>pontos.find(p=>acaoDoPonto(p,[a]));
  gaveta.innerHTML=`<div class="mi-topo"><h3>🔎 Ações neste local</h3><button type="button" class="btn-small" data-fechar title="Fechar">✕</button></div>
  <div class="mi-corpo">
   ${!mapaId?'<div style="color:#9fb3cc">Abra um mapa na mesa.</div>':''}
   ${mestre&&cenario?`<div style="color:#9fb3cc">Cenário deste mapa: <b style="color:#e8eefc">${esc(cenario.nome||cenario.id)}</b>${acoes.length&&!acoes.some(a=>acaoDoPonto({acaoId:a.id,titulo:a.titulo},pub))?'<br>⚠️ Não é o Cenário Atual publicado: os jogadores só usam as ações do cenário atual.':''}</div>`:''}
   ${mestre&&!cenario&&mapaId?'<div style="color:#9fb3cc">Nenhum cenário do banco está ligado a este mapa; mostrando as ações do Cenário Atual.</div>':''}
   <div class="mi-sep">Investigar e interagir (${acoes.length})</div>
   ${acoes.map(a=>{const p=fixado(a);return `<div class="mi-cartao" data-acao="${esc(a.id)}"><b>${esc(a.icone||'🔎')} ${esc(a.titulo)}</b>${a.dificuldade?` <small style="color:#8fa8bc">· ${esc(a.dificuldade)}</small>`:''}
     ${mestre?`<div class="mi-txt" style="color:#c6d3e6;margin-top:4px">${esc(a.evidente||'')}</div><div class="mi-linha"><button type="button" class="btn-small" data-fixar="${esc(a.id)}">${p?'📍 Mover no mapa':'📍 Fixar no mapa'}</button>${p?`<button type="button" class="btn-small" data-ver="${esc(p.id)}" title="Mostrar no mapa">👁️</button><button type="button" class="btn-small" data-soltar="${esc(p.id)}" title="Tirar do mapa">🗑️</button>`:''}</div>`
     :`${p?`<div class="mi-linha"><button type="button" class="btn-small" data-ver="${esc(p.id)}">📍 Ver no mapa</button></div>`:htmlAcao(a)}`}</div>`;}).join('')||'<div style="color:#9fb3cc">Nenhuma ação cadastrada.</div>'}
   <div class="mi-sep">Comércio e serviços (${comerciantes.length})</div>
   ${comerciantes.map(m=>`<div class="mi-cartao mi-npc">${m.imagem?`<img src="${esc(m.imagem)}" alt="">`:'<span style="font-size:24px">🛒</span>'}<div style="flex:1"><b>${esc(m.nome)}</b><div style="color:#9fb3cc;font-size:12px">${esc(m.comercioNome||m.tipo||'')}</div></div><button type="button" class="btn-small btn-select" data-loja="${esc(m.id)}">${m.comerciante?'🛒':'🧰'}</button></div>`).join('')||'<div style="color:#9fb3cc">Ninguém para negociar aqui.</div>'}
   ${!mestre&&comerciantes.length?'<div style="color:#9fb3cc;font-size:12px">Dica: clique na miniatura do comerciante no mapa.</div>':''}
   ${mestre&&cenario?`<div class="mi-sep">Nova ação num ponto do mapa</div>
    <div class="mi-linha"><input type="text" data-n-titulo placeholder="Título (ex.: Examinar a comporta)"><select data-n-icone>${['🔎','🚪','🔒','💰','🧪','📜','⚙️','🩺','🗝️','👂'].map(i=>`<option>${i}</option>`).join('')}</select></div>
    <div class="mi-linha"><input type="text" data-n-pericias placeholder="Perícias (ex.: Percepção; Mecânica)"><select data-n-dif>${['Fácil','Padrão','Difícil','Muito difícil'].map(d=>`<option${d==='Padrão'?' selected':''}>${d}</option>`).join('')}</select></div>
    <textarea data-n-evidente placeholder="O que todos percebem"></textarea>
    <textarea data-n-sucesso placeholder="Se passar no teste"></textarea>
    <textarea data-n-falha placeholder="Se falhar (opcional)"></textarea>
    <div class="mi-linha"><button type="button" class="btn-small btn-select" data-n-criar>➕ Criar e clicar no mapa</button></div>`:''}
   <div data-st style="color:#9fb3cc;min-height:1.2em;margin-top:6px">${colocando?'📍 Clique no mapa para posicionar…':''}</div>
  </div>`;
  gaveta.querySelector('.mi-corpo').scrollTop=rol;
  const $=q=>gaveta.querySelector(q),st=t=>{const e=$('[data-st]');if(e)e.textContent=t||'';};
  $('[data-fechar]').addEventListener('click',()=>{gaveta.hidden=true;colocando=null;board()?.classList.remove('mi-colocando');});
  const on=(sel,fn)=>gaveta.querySelectorAll(sel).forEach(el=>el.addEventListener('click',async()=>{try{await fn(el);}catch(e){falhou(e);st('⚠️ '+(e?.message||e));}}));
  on('[data-fixar]',el=>{const a=acoes.find(x=>String(x.id)===el.dataset.fixar);const p=fixado(a);iniciarColocacao(p?{moverId:p.id}:{acao:a});});
  on('[data-soltar]',async el=>{await salvarPontos(pontos.filter(p=>p.id!==el.dataset.soltar));redesenharGaveta();});
  on('[data-ver]',el=>{const n=board()?.querySelector(`.mi-ponto[data-ponto="${CSS.escape(el.dataset.ver)}"]`);if(n){n.classList.remove('mi-foco');void n.offsetWidth;n.classList.add('mi-foco');n.scrollIntoView?.({block:'nearest',inline:'nearest'});}});
  on('[data-loja]',el=>api()?.comercio?.(el.dataset.loja));
  gaveta.querySelectorAll('.mi-cartao[data-acao]').forEach(card=>{
   const a=acoes.find(x=>String(x.id)===card.dataset.acao);if(!a)return;
   card.querySelector('[data-tentar]')?.addEventListener('click',async()=>{await tentar(a,card,false,meuToken());redesenharGaveta();desenharPontos();});
   card.querySelector('[data-sorte]')?.addEventListener('click',async()=>{await tentar(a,card,true,meuToken());redesenharGaveta();desenharPontos();});
  });
  on('[data-n-criar]',async()=>{
   const titulo=$('[data-n-titulo]').value.trim();if(!titulo)return st('Dê um título à ação.');
   const linha=linhaAcao({titulo,icone:$('[data-n-icone]').value,pericias:$('[data-n-pericias]').value.split(/[;,]/).map(s=>s.trim()).filter(Boolean).join(';'),dificuldade:$('[data-n-dif]').value,evidente:$('[data-n-evidente]').value,sucesso:$('[data-n-sucesso]').value,falha:$('[data-n-falha]').value});
   st('Salvando no cenário…');
   const acao=await api()?.adicionarAcao?.(cenario.id,linha);
   if(!acao)return st('Não foi possível salvar a ação.');
   iniciarColocacao({acao});
  });
 }

 // ---------------------------------------------------------------- ciclo
 let ultimo=null;
 const vigia=setInterval(()=>{
  try{
   instalarBotao();instalarCliques();
   const id=String(board()?.dataset.mapaVisivel||'');
   if(id!==ultimo){ultimo=id;mapaId=id;observar(id);redesenharGaveta();}
   desenharPontos();
  }catch(e){falhou(e);}
 },900);
 return {abrir:abrirGaveta,pontos:()=>pontos,parar:desligar};
}
