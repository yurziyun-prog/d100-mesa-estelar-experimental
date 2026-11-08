// Mesa Estelar v112 — Barra do Mestre no mapa.
//
// Tudo o que o mestre usa durante a sessão fica numa barra só, em cima do mapa:
// trocar de mapa, colocar criaturas/NPCs/personagens/objetos clicando no ponto,
// mover e editar (modo mestre, salva sozinho), desenhar ao vivo, retirar, trazer o grupo,
// gerar mapa e abrir a Oficina. Os botões só acionam os controles que já existem na mesa,
// então nenhuma regra de jogo muda. Se este arquivo falhar, a mesa continua igual.

import {tamanhoMiniaturaM,corrigirModelo,corrigirObjetoCena} from './mesa-tamanhos.js?v=134';
import {organizarFichas,normNome} from './mesa-mestre.js?v=117';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
// v132: NPC com nome próprio tem uma miniatura só no jogo inteiro (como os jogadores); colocar de novo MOVE a miniatura.
// Genéricos ("Guarda", "Soldado", "Frequentador"…) ou marcados com copias/generico continuam podendo ter várias cópias.
export function npcTemCopias(n){
 if(n?.copias===true||n?.generico===true||String(n?.generico)==='true')return true;
 return /^(guardas?|soldad|capang|bandid|frequentador|mercenari|cidada|civil|civis|pirata|cultista|operari|seguranca|policia|recruta|tripulante|aldea|ladra|ladro|marinheir|serv[oa]s?\b|campones|criad[oa]s?\b|trabalhador|clone|capanga|escravo|bebado|cliente|transeunte|morador|figurante|multidao|plebe|milicia|vigia|sentinela|droide|drone)/.test(norm(n?.nome||''));
}

// Posições em volta do ponto clicado para várias cópias (espiral, ~1,2 m entre elas).
export function posicoesEmVolta(ponto,n,{W=28,H=14}={},passoM=1.2){
 const out=[{x:ponto.x,y:ponto.y}];
 for(let i=1;out.length<n;i++){
  const anel=Math.ceil(i/6),ang=(i%6)/6*Math.PI*2+anel*.5,r=anel*passoM;
  out.push({x:Math.max(.4,Math.min(27.6,ponto.x+Math.cos(ang)*r*28/W)),y:Math.max(.4,Math.min(13.6,ponto.y+Math.sin(ang)*r*14/H))});
 }
 return out.slice(0,n);
}
export function filtrarCatalogo(lista,busca){const q=norm(busca).trim();if(!q)return lista;return lista.filter(x=>norm(x.nome+' '+(x.extra||'')).includes(q));}

const ESTILO=`
#mbBarra{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:6px;flex-wrap:nowrap;overflow-x:auto;height:46px;box-sizing:border-box;padding:6px 8px;margin:6px 0;background:rgba(10,16,30,.92);border:1px solid #2f4664;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.35);scrollbar-width:thin}
#mbBarra .mb-b{flex:none;width:34px;height:32px;padding:0;display:inline-grid;place-items:center;font-size:16px;line-height:1;border-radius:9px;border:1px solid #3b5878;background:#16233a;color:#e8eefc;cursor:pointer}
#mbBarra .mb-seta{width:24px;font-size:12px}
#mbBarra .mb-b:hover{border-color:#8ee7ff}
#mbBarra .mb-b[aria-pressed="true"]{background:#1f5f4a;border-color:#57e3a1;box-shadow:0 0 0 2px rgba(87,227,161,.25) inset}
#mbBarra .mb-b:disabled{opacity:.4;cursor:default}
#mbBarra #novaSyncRestore.mb-b,#novaSyncRestore{background:#1f8a4c;border-color:#49d17f;color:#fff}
#mbBarra #novaSyncRestore.mb-b:hover{background:#26a65b;border-color:#8ff0b5}
#mbBarra #novaSyncRestore.mb-b:disabled{opacity:.55}
#mbBarra .mb-sep{flex:none;width:1px;height:24px;background:#2f4664;margin:0 2px}
#mbBarra select{flex:0 1 230px;min-width:140px;height:32px;border-radius:9px;background:#16233a;color:#e8eefc;border:1px solid #3b5878;padding:0 6px}
#mbBarra input[type=color]{flex:none;width:30px;height:30px;padding:0;border:1px solid #3b5878;border-radius:8px;background:none;cursor:pointer}
#mbBarra .mb-st{flex:none;margin-left:auto;font:12px 'Segoe UI',Arial,sans-serif;color:#9fd8b8;white-space:nowrap;min-width:92px;text-align:right}
#mbBarra .mb-st.salvando{color:#ffd447}
#mbPaleta{position:fixed;z-index:10004;width:min(440px,calc(100vw - 24px));max-height:min(70vh,620px);display:flex;flex-direction:column;background:#101828;border:1px solid #49668a;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.6);color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif}
#mbPaleta[hidden]{display:none}
#mbPaleta .mb-topo{display:flex;gap:4px;padding:10px 10px 6px;align-items:center}
#mbPaleta .mb-aba{flex:1;height:30px;border-radius:9px;border:1px solid #3b5878;background:#16233a;color:#c6d3e6;cursor:pointer;font-size:12px}
#mbPaleta .mb-aba[aria-pressed="true"]{background:#1f3f62;border-color:#8ee7ff;color:#fff}
#mbPaleta .mb-busca{display:flex;gap:6px;padding:0 10px 8px}
#mbPaleta .mb-busca input[type=search]{flex:1;height:30px;border-radius:9px;border:1px solid #3b5878;background:#0b1322;color:#e8eefc;padding:0 8px}
#mbPaleta .mb-busca label{display:flex;align-items:center;gap:4px;color:#9fb3cc;font-size:12px}
#mbPaleta .mb-busca input[type=number]{width:46px;height:30px;border-radius:9px;border:1px solid #3b5878;background:#0b1322;color:#e8eefc;text-align:center}
#mbPaleta .mb-grade{overflow:auto;padding:0 10px 10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px;align-content:start}
#mbPaleta .mb-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px;border-radius:10px;border:1px solid transparent;background:rgba(255,255,255,.04);cursor:pointer;color:#e8eefc;font-size:11px;text-align:center;min-height:86px}
#mbPaleta .mb-item:hover{border-color:#8ee7ff;background:rgba(142,231,255,.08)}
#mbPaleta .mb-item img{width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}
#mbPaleta .mb-item .mb-sem{width:48px;height:48px;display:grid;place-items:center;font-size:24px}
#mbPaleta .mb-item span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.2}
#mbPaleta .mb-vazio{grid-column:1/-1;color:#9fb3cc;padding:10px}
#mbDica{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:10005;padding:8px 14px;border-radius:12px;background:#122a24;border:1px solid #57e3a1;color:#e8fff4;font:600 13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);pointer-events:none}
#mbDica[hidden]{display:none}
#novaSyncBoard.mb-colocando,#novaSyncBoard.mb-colocando *{cursor:crosshair!important}
#novaSyncBoard.mb-escolhendo [data-token]{cursor:pointer!important;filter:drop-shadow(0 0 4px #ffd447)}
/* v116: fantasma do que vai ser colocado, acompanhando o mouse */
#mbFantasma{position:absolute;z-index:30;pointer-events:none;transform:translate(-50%,-50%);opacity:.72;filter:drop-shadow(0 4px 8px rgba(0,0,0,.6))}
#mbFantasma img{width:100%;height:100%;object-fit:contain;display:block}
#mbFantasma.mb-redondo::after{content:'';position:absolute;inset:0;border-radius:50%;border:2px dashed rgba(255,212,71,.85)}
/* v116: ferramentas de edição nas laterais do mapa (sem painel, sem o mapa pular) */
#mbLateral{position:absolute;left:8px;top:8px;z-index:35;display:flex;flex-direction:column;gap:5px;padding:6px;border-radius:12px;background:rgba(10,16,30,.86);border:1px solid #2f4664;box-shadow:0 6px 18px rgba(0,0,0,.45)}
#mbLateral[hidden],#mbPropriedades[hidden]{display:none}
#mbLateral .mb-b,#mbPropriedades .mb-b{width:32px;height:30px}
#mbLateral input[type=color]{width:32px;height:28px;padding:0;border:1px solid #3b5878;border-radius:8px;background:none}
#mbPropriedades{position:absolute;right:8px;top:48px;z-index:35;width:200px;padding:8px;border-radius:12px;background:rgba(10,16,30,.9);border:1px solid #2f4664;color:#e8eefc;font:12px 'Segoe UI',Arial,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.45)}
#mbPropriedades label{display:flex;justify-content:space-between;align-items:center;gap:6px;margin:3px 0}
#mbPropriedades input:not([type=checkbox]){width:90px!important;height:24px!important;min-height:0!important;padding:2px 6px!important;font-size:12px!important;box-sizing:border-box;margin:0!important}
body.mb-mestre #novaSyncPersonagem,body.mb-mestre .nova-acting-label,body.mb-mestre #novaSyncCatalog,body.mb-mestre #novaMapPrimaryV68,body.mb-mestre #novaMapSetupV68{display:none!important}
body.mb-mestre #novaSyncMasterPanel{padding:0!important;border:0!important;background:none!important;min-height:0!important;box-shadow:none!important;margin:0!important}
/* v121: Oficina avançada compacta, em abas, e sempre recolhível */
.mb-ofi-abas{display:none}
#novaOficinaPanel .mb-ofi-abas{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0 6px}
#novaOficinaPanel .mb-ofi-abas button{height:28px;padding:0 10px;border-radius:999px;border:1px solid #3b5878;background:#16233a;color:#c6d3e6;cursor:pointer;font:600 12px 'Segoe UI',Arial,sans-serif}
#novaOficinaPanel .mb-ofi-abas button[aria-pressed="true"]{background:#1f3f62;border-color:#8ee7ff;color:#fff}
#novaOficinaPanel .mb-ofi-abas .mb-ofi-fechar{margin-left:auto;border-color:#ff8a8a;color:#ffd0d0}
#novaOficinaPanel .gm2-row.mb-ofi-oculta{display:none!important}
#novaOficinaPanel{scroll-margin-top:72px}
#novaOficinaPanel>summary{position:relative;z-index:40;cursor:pointer}
#novaOficinaPanel #gm2ribbon{padding:4px 6px!important;gap:4px!important}
#novaOficinaPanel #gm2ribbon .gm2-row{padding:4px 0!important;row-gap:4px!important}
#novaOficinaPanel #gm2side.mb-ofi-recolhido{display:none!important}
#mbBarra .mb-turno{flex:0 1 auto;min-width:0;max-width:300px;margin:0 0 0 auto!important;padding:0 4px!important;background:none!important;border:0!important;font:12px 'Segoe UI',Arial,sans-serif!important;color:#c6d3e6!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mbBarra .mb-turno+.mb-st{margin-left:8px}
#mbBarra [data-mesa] .mb-b:disabled{opacity:.35}
#mbBarra .mb-ator{flex:none;display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 4px 0 9px;border-radius:999px;background:#2a1f3d;border:1px solid #b07cff;color:#eadcff;font:600 12px 'Segoe UI',Arial,sans-serif;max-width:190px}
#mbBarra .mb-ator span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#mbBarra .mb-ator button{width:22px;height:22px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;cursor:pointer}
#mbBarra .mb-ator[hidden]{display:none}
`;

const ABAS=[['criaturas','👾 Criaturas'],['npcs','🎭 NPCs'],['personagens','🧑 Jogadores'],['objetos','🪑 Objetos']];

export function instalarBarraMestre(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctrl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const el=id=>root.getElementById(id);
 if(!el('mbCssV112')){const st=root.createElement('style');st.id='mbCssV112';st.textContent=ESTILO;root.head.append(st);}
 let barra=null,paleta=null,dica=null,aba='criaturas',armado=null,erros=0;

 // ------------------------------------------------------------ catálogo
 function catalogo(tipo){
  const t=c=>{try{return tamanhoMiniaturaM(c);}catch(_){return 1;}};
  if(tipo==='criaturas')return (dep.criaturas?.()||[]).filter(c=>c.selecionavelCombate!==false&&String(c.selecionavelCombate)!=='false').map(c=>({chave:'synccriatura:'+c.id,nome:c.nome||c.id,img:c.miniatura?.url||c.imagem||'',extra:c.tipo||'',copias:true,w:t(c),h:t(c),redondo:true}));
  // v117: PDMs são NPCs com ficha avançada; o NPC do banco com o mesmo nome (duplicado) some da lista
  const f=organizarFichas({personagens:dep.personagens?.()||[],npcs:dep.npcs?.()||[],mestreUid:String(dep.uid?.()||'')});
  if(tipo==='npcs')return [...f.avancados.map(c=>({chave:String(c.id),nome:c.nome||c.id,img:c.miniatura?.url||c.imagem||'',extra:'ficha avançada '+(c.raca||''),copias:false,w:t(c),h:t(c),redondo:true})),
   ...f.npcsBanco.filter(c=>c.selecionavelCombate!==false&&String(c.selecionavelCombate)!=='false').map(c=>({chave:'syncnpc:'+c.id,nome:c.nome||c.id,img:c.miniatura?.url||c.imagem||'',extra:(c.carreira||'')+' '+(c.raca||''),copias:npcTemCopias(c),w:t(c),h:t(c),redondo:true}))];
  if(tipo==='personagens')return f.jogadores.map(c=>({chave:String(c.id),nome:c.nome||c.id,img:c.miniatura?.url||c.imagem||'',extra:c.raca||'',copias:false,w:t(c),h:t(c),redondo:true}));
  return (dep.objetos?.()||[]).map(o=>({chave:'syncobjeto:'+o.id,nome:o.nome||o.id,img:o.imagem||'',extra:o.categoria||'',copias:true,w:Number(o.larguraM)||1,h:Number(o.alturaM)||1,redondo:false}));
 }

 // ------------------------------------------------------------ barra
 function montarBarra(){
  if(barra?.isConnected)return true;
  const sec=el('sincronizacao-nova'),alvo=sec?.querySelector('.nova-board-scroll')||el('novaSyncBoard')?.parentElement;
  if(!sec||!alvo)return false;
  barra=root.createElement('div');barra.id='mbBarra';barra.setAttribute('role','toolbar');barra.setAttribute('aria-label','Barra do mestre');
  barra.innerHTML=`<button type="button" class="mb-b mb-seta" data-mapa-ant title="Mapa anterior">◀</button><select data-mapa title="Trocar o mapa da mesa (os jogadores veem o novo mapa na hora)" aria-label="Mapa da mesa"></select><button type="button" class="mb-b mb-seta" data-mapa-prox title="Próximo mapa">▶</button>
   <button type="button" class="mb-b" data-a="colocar" title="Colocar no mapa: criaturas, NPCs, personagens e objetos. Escolha e clique no ponto do mapa." aria-pressed="false">＋</button>
   <button type="button" class="mb-b" data-a="mover" title="Modo mestre: arraste miniaturas e móveis livremente. Tudo salva sozinho." aria-pressed="false">✋</button>
   <button type="button" class="mb-b" data-a="atuar" title="Atuar como: clique numa miniatura (NPC, monstro ou personagem) e passe a mover, atacar e agir como ela. No tempo real, ela sai do automático." aria-pressed="false">🎭</button>
   <span class="mb-ator" data-ator hidden><span data-ator-nome></span><button type="button" data-a="sair-ator" title="Voltar a ser o mestre">✕</button></span>
   <button type="button" class="mb-b" data-a="remover" title="Retirar do mapa o que estiver selecionado">🗑️</button>
   <span class="mb-sep"></span><span data-mesa style="display:flex;gap:6px;flex:none"></span>
   <span class="mb-sep"></span>
   <button type="button" class="mb-b" data-a="desenhar" title="Desenhar ao vivo no mapa (todos veem na hora)" aria-pressed="false">✏️</button>
   <input type="color" data-cor value="#ffd447" title="Cor do desenho" aria-label="Cor do desenho">
   <button type="button" class="mb-b" data-a="desfazer" title="Desfazer seu último desenho">↶</button>
   <button type="button" class="mb-b" data-a="limpar" title="Apagar seus desenhos deste mapa">🧽</button>
   <span class="mb-sep"></span>
   <button type="button" class="mb-b" data-a="editar" title="Editar o mapa: paredes, formas, lápis e objetos com botões na lateral do mapa" aria-pressed="false">🛠️</button>
   <span class="mb-st" data-st title="Situação do salvamento automático">✔ tudo salvo</span>`;
  alvo.parentElement.insertBefore(barra,alvo);
  barra.querySelector('[data-mapa]').addEventListener('change',e=>trocarMapa(e.target.value));
  // v125: ◀ ▶ trocam para o mapa anterior/seguinte da lista (em ordem de acesso quando houver ligações)
  const passo=d=>{const sel=barra.querySelector('[data-mapa]'),ops=[...sel.options].filter(o=>o.value);if(!ops.length)return;let i=ops.findIndex(o=>o.value===sel.value);i=i<0?(d>0?0:ops.length-1):(i+d+ops.length)%ops.length;sel.value=ops[i].value;trocarMapa(ops[i].value);};
  barra.querySelector('[data-mapa-ant]').addEventListener('click',()=>passo(-1));barra.querySelector('[data-mapa-prox]').addEventListener('click',()=>passo(1));
  barra.querySelector('[data-cor]').addEventListener('input',e=>{const c=el('novaSyncSharedDrawColor');if(c){c.value=e.target.value;c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}));}});
  barra.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;acao(b.dataset.a,b);});
  atualizar();return true;
 }
 // Os botões dos outros módulos (🎨 ⚡ 🔎 🧭 🗺️) passam para a barra, e o desenho compartilhado
 // (que a barra já controla) sai da frente: menos linhas de controle em cima do mapa.
 function arrumarEntorno(){
  const ferramentas=root.querySelector('#sincronizacao-nova .nova-view-tools');
  let extras=barra.querySelector('[data-extras]');
  if(!extras){const sep=root.createElement('span');sep.className='mb-sep';extras=root.createElement('span');extras.dataset.extras='';extras.style.cssText='display:flex;gap:6px;flex:none';barra.insertBefore(sep,barra.querySelector('[data-st]'));barra.insertBefore(extras,barra.querySelector('[data-st]'));}
  for(const b of [...(ferramentas?.querySelectorAll(':scope > button')||[])]){if(b.id==='novaSyncFocus')continue;b.classList.add('mb-b');extras.append(b);}
  const desenho=el('novaSyncSharedDrawTools');if(desenho&&desenho.style.display!=='none')desenho.style.display='none';
  // v120: os controles da linha de cima (▶ ■ 📍 🎲 🧹 ♻ e a situação do turno) vêm para a barra;
  // os repetidos (seletor de mapa, ✕, busca rápida) somem para o mestre.
  const mesa=barra.querySelector('[data-mesa]');
  for(const id of ['novaSyncStart','novaSyncEnd','novaSyncPullActiveV92','novaSyncRandom','novaSyncClear','novaSyncRestore']){const b=el(id);if(b&&mesa&&b.parentElement!==mesa){b.classList.add('mb-b');mesa.append(b);}}
  const turno=el('novaSyncTurno'),st=barra.querySelector('[data-st]');if(turno&&st&&turno.parentElement!==barra){turno.classList.add('mb-turno');barra.insertBefore(turno,st);}
  // v116: o ＋ é o jeito padrão de colocar; o catálogo antigo e o "Atuar como" saem da frente
  for(const id of ['novaSyncCatalog']){const n=el(id);if(n&&n.style.display!=='none')n.style.display='none';}
  root.body.classList.add('mb-mestre');
  const of=el('novaOficinaPanel');if(of&&!of.open&&of.style.display!=='none')of.style.display='none';
 }
 function acao(a,b){
  try{
   if(a==='colocar')return alternarPaleta(b);
   if(a==='mover')return alternarMover();
   if(a==='remover')return el('novaSyncRemove')?.click();
   if(a==='desenhar'){if(modoMestre())definirAtuar(false);return el('novaSyncSharedDrawToggle')?.click();}
   if(a==='desfazer')return el('novaSyncSharedDrawUndo')?.click();
   if(a==='limpar')return el('novaSyncSharedDrawClear')?.click();
   if(a==='editar')return alternarEdicao();
   if(a==='atuar')return alternarEscolhaAtor();
   if(a==='sair-ator'){escolhendo=false;definirAtuar(true);return atualizar();}
  }catch(err){console.warn('[Barra do mestre]',a,err);}
 }
 const modoMestre=()=>el('novaSyncPersonagem')?.value==='__mestre__';
 function definirAtuar(mestre){
  const s=el('novaSyncPersonagem');if(!s)return;
  if(mestre){if(![...s.options].some(o=>o.value==='__mestre__'))return;s.value='__mestre__';}
  else{const o=[...s.options].find(o=>o.value==='')||null;s.value=o?'':s.value==='__mestre__'?([...s.options].find(o=>!o.value.startsWith('__'))?.value||''):s.value;}
  s.dispatchEvent(new Event('change',{bubbles:true}));
 }
 function alternarMover(){
  const ligar=!modoMestre();
  if(ligar&&el('novaSyncSharedDrawToggle')?.getAttribute('aria-pressed')==='true')el('novaSyncSharedDrawToggle').click();
  definirAtuar(ligar);atualizar();
 }
 function trocarMapa(id){
  if(!id)return;const s=el('novaSyncMapa');
  if(s&&[...s.options].some(o=>o.value===id)){s.value=id;s.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(typeof win.abrirMapaBancoNaMesa_==='function')win.abrirMapaBancoNaMesa_(id);
  else ctrl()?.openMap?.(id);
 }
 function preencherMapas(){
  const sel=barra?.querySelector('[data-mapa]');if(!sel||root.activeElement===sel)return;
  const atual=String(ctrl()?.mapaAtual?.()||el('novaSyncBoard')?.dataset.mapaVisivel||el('novaSyncMapa')?.value||'');
  // v176: mapas guardados (🗂️ Mapas) não aparecem, a não ser o que está aberto
  const lista=[...(dep.mapas?.()||[])].filter(m=>m?.id&&!String(m.id).includes('__parte__')&&(!m.arquivadoV176||String(m.id)===atual)).sort((a,b)=>String(a.nome||a.id).localeCompare(String(b.nome||b.id),'pt'));
  try{const o=win.mesaOrdemMapas?.(lista);if(Array.isArray(o)&&o.length===lista.length)lista.splice(0,lista.length,...o);}catch(_){}
  const chave=lista.map(m=>m.id+':'+(m.nome||'')).join('|')+'#'+atual+'#'+(dep.mapas?.()||[]).filter(m=>m?.arquivadoV176).length;if(sel.dataset.k===chave)return;sel.dataset.k=chave;
  sel.innerHTML=`<option value="">🗺️ Escolha o mapa…</option>`+lista.map(m=>`<option value="${esc(m.id)}">${esc(m.nome||m.id)}</option>`).join('');
  sel.value=lista.some(m=>String(m.id)===atual)?atual:'';
 }
 function atualizar(){
  if(!barra)return;
  preencherMapas();
  const desenho=el('novaSyncSharedDrawToggle');
  const pd=barra.querySelector('[data-a="desenhar"]');pd.setAttribute('aria-pressed',desenho?.getAttribute('aria-pressed')==='true'?'true':'false');pd.disabled=!desenho||desenho.disabled;
  for(const k of ['desfazer','limpar'])barra.querySelector(`[data-a="${k}"]`).disabled=!el(k==='desfazer'?'novaSyncSharedDrawUndo':'novaSyncSharedDrawClear');
  barra.querySelector('[data-a="mover"]').setAttribute('aria-pressed',modoMestre()?'true':'false');
  barra.querySelector('[data-a="colocar"]').setAttribute('aria-pressed',paleta&&!paleta.hidden||armado?'true':'false');
  barra.querySelector('[data-a="editar"]').setAttribute('aria-pressed',edicao?'true':'false');
  barra.querySelector('[data-a="atuar"]').setAttribute('aria-pressed',escolhendo?'true':'false');
  const s=el('novaSyncPersonagem'),v=s?.value||'',chip=barra.querySelector('[data-ator]');
  const ator=v&&!v.startsWith('__')?[...(s?.options||[])].find(o=>o.value===v)?.textContent||'':v==='__automatico__'?'⚙ Automático':'';
  chip.hidden=!ator;const nm=chip.querySelector('[data-ator-nome]');if(nm.textContent!=='🎭 '+ator)nm.textContent='🎭 '+ator;
  atualizarLateral();
  const cor=el('novaSyncSharedDrawColor'),ci=barra.querySelector('[data-cor]');if(cor&&root.activeElement!==ci&&ci.value!==cor.value)ci.value=cor.value;
  const aviso=String(el('novaEditNotice')?.textContent||''),st=barra.querySelector('[data-st]');
  const salvando=/Salvando|Sincronizando|Retirando/i.test(aviso);
  const txt=salvando?'⏳ salvando…':/Alterações locais/i.test(aviso)?'⚠️ não salvo':'✔ tudo salvo';
  if(st.textContent!==txt){st.textContent=txt;st.classList.toggle('salvando',txt!=='✔ tudo salvo');}
 }

 // ------------------------------------------------------------ paleta
 function montarPaleta(){
  if(paleta)return;
  paleta=root.createElement('div');paleta.id='mbPaleta';paleta.hidden=true;
  paleta.innerHTML=`<div class="mb-topo">${ABAS.map(([k,n])=>`<button type="button" class="mb-aba" data-aba="${k}" aria-pressed="false">${n}</button>`).join('')}<button type="button" class="mb-b" data-fechar title="Fechar" style="width:30px;height:30px;border-radius:9px;border:1px solid #3b5878;background:#16233a;color:#e8eefc;cursor:pointer">✕</button></div>
   <div class="mb-busca"><input type="search" data-busca placeholder="Buscar pelo nome…" aria-label="Buscar"><label title="Quantas cópias colocar em volta do ponto clicado">× <input type="number" data-qtd min="1" max="12" value="1"></label></div>
   <div class="mb-grade" data-grade></div>`;
  root.body.append(paleta);
  paleta.querySelector('[data-fechar]').addEventListener('click',()=>{paleta.hidden=true;atualizar();});
  paleta.querySelectorAll('[data-aba]').forEach(b=>b.addEventListener('click',()=>{if(aba!==b.dataset.aba)paleta.querySelector('[data-busca]').value='';aba=b.dataset.aba;desenharPaleta();}));
  paleta.querySelector('[data-busca]').addEventListener('input',()=>desenharPaleta());
  paleta.querySelector('[data-grade]').addEventListener('click',e=>{const it=e.target.closest('[data-chave]');if(!it)return;armar(it.dataset.chave,it.dataset.nome,it.dataset.copias==='1');});
 }
 function posicionarPaleta(botao){
  const r=(botao||barra).getBoundingClientRect(),w=Math.min(440,win.innerWidth-24);
  paleta.style.left=Math.max(12,Math.min(win.innerWidth-w-12,r.left))+'px';paleta.style.top=Math.min(win.innerHeight-200,r.bottom+8)+'px';
 }
 function alternarPaleta(botao){
  montarPaleta();
  if(!paleta.hidden&&!armado){paleta.hidden=true;atualizar();return;}
  desarmar();posicionarPaleta(botao);paleta.hidden=false;desenharPaleta();paleta.querySelector('[data-busca]').focus();atualizar();
 }
 function desenharPaleta(){
  paleta.querySelectorAll('[data-aba]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.aba===aba?'true':'false'));
  const lista=filtrarCatalogo(catalogo(aba),paleta.querySelector('[data-busca]').value).slice(0,180);
  paleta.querySelector('[data-qtd]').disabled=aba==='personagens';
  paleta.querySelector('[data-grade]').innerHTML=lista.map(x=>`<button type="button" class="mb-item" data-chave="${esc(x.chave)}" data-nome="${esc(x.nome)}" data-copias="${x.copias?1:0}" title="${esc(x.nome)}">${x.img?`<img src="${esc(x.img)}" alt="" loading="lazy">`:'<div class="mb-sem">❔</div>'}<span>${esc(x.nome)}</span></button>`).join('')||'<div class="mb-vazio">Nada encontrado.</div>';
 }

 // ------------------------------------------------------------ colocar clicando no mapa
 function mostrarDica(t){if(!dica){dica=root.createElement('div');dica.id='mbDica';root.body.append(dica);}dica.textContent=t;dica.hidden=!t;}
 function armar(chave,nome,copias){
  const qtd=copias?Math.max(1,Math.min(12,Number(paleta.querySelector('[data-qtd]').value)||1)):1;
  const item=catalogo(aba).find(x=>x.chave===chave)||{};
  if(escolhendo)alternarEscolhaAtor();
  armado={chave,nome,qtd,copias:!!copias,img:item.img||'',w:item.w||1,h:item.h||1,redondo:!!item.redondo};paleta.hidden=true;
  el('novaSyncBoard')?.classList.add('mb-colocando');
  mostrarDica(`📍 Clique no mapa para colocar ${nome}${qtd>1?' ×'+qtd:''} · Shift mantém · Esc cancela`);atualizar();
 }
 function desarmar(){armado=null;fantasma?.remove();fantasma=null;el('novaSyncBoard')?.classList.remove('mb-colocando');mostrarDica('');atualizar();}
 function pontoNoMapa(ev){const b=el('novaSyncBoard'),r=b.getBoundingClientRect();return {x:Math.max(.3,Math.min(27.7,(ev.clientX-r.left)/b.clientWidth*28)),y:Math.max(.3,Math.min(13.7,(ev.clientY-r.top)/b.clientHeight*14))};}
 async function colocarEm(ponto,manter){
  const a=armado;if(!a)return;const c=ctrl();
  if(!c?.place){mostrarDica('⚠️ A mesa ainda está carregando. Tente de novo.');return;}
  const b=el('novaSyncBoard'),W=Number(b?.dataset.mapaLargura)||28,H=Number(b?.dataset.mapaAltura)||14;
  if(!manter)desarmar();
  for(const p of posicoesEmVolta(ponto,a.qtd,{W,H}))await c.place(a.chave,{x:Number(p.x.toFixed(3)),y:Number(p.y.toFixed(3))},{instancia:a.copias!==false});
 }
 function captura(ev){
  if(!armado)return;const b=el('novaSyncBoard');if(!b||!b.contains(ev.target))return;
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();
  void colocarEm(pontoNoMapa(ev),ev.shiftKey).catch(e=>console.warn('[Barra do mestre] colocar',e));
 }
 root.addEventListener('pointerdown',captura,true);
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){if(armado)desarmar();else if(escolhendo)alternarEscolhaAtor();else if(paleta&&!paleta.hidden){paleta.hidden=true;atualizar();}}});

 // ------------------------------------------------------------ v121: Oficina avançada compacta e recolhível
 const ABAS_OFI=[['gm2-maprow','🗺️ Mapa e chão'],['gm2-stylerow','🎨 Cores, formas e objetos'],['outra','🧱 Regras da mesa']];
 function arrumarOficina(){
  const d=el('novaOficinaPanel'),sc=el('sincronizacao-nova')?.querySelector('.nova-board-scroll');if(!d)return;
  // fora do contêiner do mapa: as ferramentas da lateral não cobrem mais o título (dá para recolher)
  if(sc&&d.parentElement===sc)sc.parentElement.insertBefore(d,sc);
  if(!d.open)return;
  if(edicao)alternarEdicao(false);
  const ribbon=d.querySelector('#gm2ribbon');if(!ribbon)return;
  let abas=d.querySelector('.mb-ofi-abas');
  if(!abas){
   abas=root.createElement('div');abas.className='mb-ofi-abas';
   abas.innerHTML=ABAS_OFI.map(([k,n])=>`<button type="button" data-ofi-aba="${k}">${n}</button>`).join('')+'<button type="button" data-ofi-aba="tudo">☰ Tudo</button><button type="button" data-ofi-lado title="Mostrar/ocultar o painel lateral de sombras e outros">⇔ Painel</button><button type="button" class="mb-ofi-fechar" data-ofi-fechar title="Recolher a Oficina e voltar ao mapa">✕ Recolher</button>';
   ribbon.parentElement.insertBefore(abas,ribbon);
   abas.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.ofiFechar!==undefined){d.open=false;return;}
    if(b.dataset.ofiLado!==undefined){d.querySelector('#gm2side')?.classList.toggle('mb-ofi-recolhido');return;}
    try{win.localStorage.setItem('mesa:ofiAba',b.dataset.ofiAba);}catch(_){}mostrarAbaOfi(d,b.dataset.ofiAba);});
  }
  let atual='gm2-maprow';try{atual=win.localStorage.getItem('mesa:ofiAba')||atual;}catch(_){}
  if(abas.dataset.aplicada!==atual+':'+ribbon.children.length){abas.dataset.aplicada=atual+':'+ribbon.children.length;mostrarAbaOfi(d,atual);}
 }
 function mostrarAbaOfi(d,aba){
  const rows=[...d.querySelectorAll('#gm2ribbon > .gm2-row')];
  for(const r of rows){const k=r.classList.contains('gm2-maprow')?'gm2-maprow':r.classList.contains('gm2-stylerow')?'gm2-stylerow':'outra';r.classList.toggle('mb-ofi-oculta',aba!=='tudo'&&k!==aba);}
  d.querySelectorAll('[data-ofi-aba]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.ofiAba===aba?'true':'false'));
 }

 // ------------------------------------------------------------ v116: fantasma que segue o mouse
 let fantasma=null;
 function moverFantasma(ev){
  const b=el('novaSyncBoard');if(!armado||!b){fantasma?.remove();fantasma=null;return;}
  if(!b.contains(ev.target)){if(fantasma)fantasma.style.display='none';return;}
  if(!fantasma||!fantasma.isConnected){fantasma=root.createElement('div');fantasma.id='mbFantasma';fantasma.innerHTML=armado.img?`<img src="${esc(armado.img)}" alt="">`:'';b.append(fantasma);}
  const ppm=b.clientWidth/(Number(b.dataset.mapaLargura)||28),esc2=armado.redondo?1.8:1;
  fantasma.classList.toggle('mb-redondo',!!armado.redondo);
  fantasma.style.width=(armado.w||1)*ppm*(armado.redondo?1:1)+'px';fantasma.style.height=(armado.h||1)*ppm+'px';
  const im=fantasma.querySelector('img');if(im&&armado.redondo){im.style.width=im.style.height=esc2*100+'%';im.style.margin=(1-esc2)*50+'%';}
  const r=b.getBoundingClientRect();fantasma.style.left=(ev.clientX-r.left)/r.width*100+'%';fantasma.style.top=(ev.clientY-r.top)/r.height*100+'%';fantasma.style.display='';
 }
 root.addEventListener('pointermove',moverFantasma,true);

 // ------------------------------------------------------------ v116: 🎭 atuar como (clicando na miniatura)
 let escolhendo=false;
 function alternarEscolhaAtor(){
  escolhendo=!escolhendo;if(escolhendo)desarmar();
  el('novaSyncBoard')?.classList.toggle('mb-escolhendo',escolhendo);
  mostrarDica(escolhendo?'🎭 Clique na miniatura que você quer controlar · Esc cancela':'');atualizar();
 }
 async function atuarComo(id,gesto){
  escolhendo=false;el('novaSyncBoard')?.classList.remove('mb-escolhendo');mostrarDica('');
  const s=el('novaSyncPersonagem');if(!s)return;
  if(![...s.options].some(o=>o.value===id)){mostrarDica('⚠️ Esta miniatura não pode ser controlada agora.');setTimeout(()=>mostrarDica(''),2500);return;}
  if(el('novaSyncSharedDrawToggle')?.getAttribute('aria-pressed')==='true')el('novaSyncSharedDrawToggle').click();
  if(edicao)alternarEdicao(false);
  // O seletor legado está oculto nesta barra e seu change é sintético.
  // Encaminhar o clique real antes de qualquer await preserva a ativação
  // necessária ao window.open e mantém esta aba no papel de Mestre.
  if(gesto?.isTrusted&&win.mesaAtuarAbaV205?.escolher?.(id)){atualizar();return;}
  s.value=id;s.dispatchEvent(new Event('change',{bubbles:true}));
  try{const rt=win.mesaTempoRealV111;if(rt?.ativo?.()&&rt.automatico?.(id))await rt.assumirControle(id);}catch(e){console.warn('[Barra do mestre] tempo real',e);}
  atualizar();
 }

 // ------------------------------------------------------------ v116: edição do mapa na lateral
 let edicao=false,lateral=null,props=null;
 const FERRAMENTAS=[['move','↖','Selecionar e mover (arraste objetos e paredes)'],['rect','▭','Parede / retângulo (arraste no mapa)'],['square','◻','Quadrado'],['circle','◯','Círculo'],['ellipse','⬭','Elipse'],['triangle','△','Triângulo'],['draw','✎','Lápis (riscos que ficam no mapa)']];
 function alternarEdicao(forcar){
  edicao=typeof forcar==='boolean'?forcar:!edicao;
  if(edicao){if(!modoMestre())definirAtuar(true);if(el('novaSyncSharedDrawToggle')?.getAttribute('aria-pressed')==='true')el('novaSyncSharedDrawToggle').click();}
  else ferramenta('move');
  try{root.body?.classList.toggle('mesa-editando',edicao);}catch(_){} // v174: no modo de editar o mestre vê as paredes/escadas invisíveis
  montarLateral();atualizar();
 }
 function ferramenta(t){const s=el('novaSyncShape');if(s&&s.value!==t){s.value=t;s.dispatchEvent(new Event('change',{bubbles:true}));}if(lateral)lateral.querySelectorAll('[data-f]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===t?'true':'false'));}
 function montarLateral(){
  const b=el('novaSyncBoard'),host=b?.parentElement;if(!host)return;
  if(getComputedStyle(host).position==='static')host.style.position='relative';
  if(!lateral||!lateral.isConnected){
   lateral=root.createElement('div');lateral.id='mbLateral';lateral.setAttribute('role','toolbar');lateral.setAttribute('aria-label','Editar mapa');
   lateral.innerHTML=FERRAMENTAS.map(([f,i,t])=>`<button type="button" class="mb-b" data-f="${f}" title="${t}" aria-pressed="false">${i}</button>`).join('')+
    `<input type="color" data-tinta value="#5a5f66" title="Cor das formas e do lápis"><button type="button" class="mb-b" data-bloq title="Formas novas bloqueiam passagem (paredes)" aria-pressed="true">🧱</button>`+
    `<button type="button" class="mb-b" data-dup title="Duplicar o objeto selecionado">⧉</button><button type="button" class="mb-b" data-del title="Apagar o selecionado">🗑️</button>`+
    `<button type="button" class="mb-b" data-undo title="Desfazer">↶</button><button type="button" class="mb-b" data-redo title="Refazer">↷</button>`+
    `<button type="button" class="mb-b" data-ofi title="Oficina completa (chão, texturas, ferramentas avançadas)">🛠️</button>`;
   host.append(lateral);
   lateral.addEventListener('pointerdown',e=>e.stopPropagation());
   lateral.addEventListener('click',e=>{const x=e.target.closest('button');if(!x)return;
    if(x.dataset.f)return ferramenta(x.dataset.f);
    if(x.dataset.bloq!==undefined){const c=el('novaEditBlock');if(c){c.checked=!c.checked;x.setAttribute('aria-pressed',c.checked?'true':'false');}return;}
    if(x.dataset.dup!==undefined)return el('novaEditDuplicate')?.click();
    if(x.dataset.del!==undefined)return el('novaSyncRemove')?.click();
    if(x.dataset.undo!==undefined)return el('novaSyncEditUndo')?.click();
    if(x.dataset.redo!==undefined)return el('novaEditRedo')?.click();
    if(x.dataset.ofi!==undefined){const d=el('novaOficinaPanel');if(d){alternarEdicao(false);arrumarOficina();d.style.display='';d.open=true;setTimeout(()=>{arrumarOficina();d.scrollIntoView({block:'start',behavior:'smooth'});},300);}}
   });
   lateral.querySelector('[data-tinta]').addEventListener('input',e=>{const i=el('novaSyncInk');if(i){i.value=e.target.value;i.dispatchEvent(new Event('input',{bubbles:true}));}});
   const bl=el('novaEditBlock');if(bl){bl.checked=true;}
   const ink=el('novaSyncInk');if(ink)ink.value=lateral.querySelector('[data-tinta]').value;
  }
  if(!props||!props.isConnected){
   props=root.createElement('div');props.id='mbPropriedades';props.hidden=true;
   props.innerHTML=`<b style="color:#8ee7ff">Objeto selecionado</b><div data-campos></div><div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn-small btn-select" data-aplicar style="flex:1">Aplicar</button></div>`;
   host.append(props);props.addEventListener('pointerdown',e=>e.stopPropagation());
   // reaproveita os campos do editor da mesa (mesmos ids: o editor continua lendo deles)
   const campos=props.querySelector('[data-campos]');
   for(const [id,rot] of [['novaEditName','Nome'],['novaEditWidth','Largura (m)'],['novaEditHeight','Altura (m)'],['novaEditAngle','Giro (°)'],['novaEditLayer','Camada'],['novaEditOpacity','Opacidade']]){const inp=el(id);if(!inp)continue;const l=root.createElement('label');l.textContent=rot;campos.append(l);l.append(inp);}
   props.querySelector('[data-aplicar]').addEventListener('click',()=>el('novaEditApply')?.click());
  }
  lateral.hidden=!edicao;
 }
 let ultimaSel='';
 function atualizarLateral(){
  if(!lateral&&!edicao)return;montarLateral();
  const sel=edicao?ctrl()?.selecao?.():null,id=sel?.kind==='object'?sel.id:'';
  if(props){props.hidden=!id;if(id!==ultimaSel){ultimaSel=id;}}
 }
 function capturaAtor(ev){
  if(!escolhendo)return;const b=el('novaSyncBoard');if(!b||!b.contains(ev.target))return;
  const tk=ev.target.closest('[data-token]');ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();
  if(tk)void atuarComo(tk.dataset.token,ev);
 }
 root.addEventListener('pointerdown',capturaAtor,true);

 // ------------------------------------------------------------ tamanhos reais (v112)
 // Móveis do banco com medida exagerada, móveis já colocados no mapa aberto e miniaturas
 // sem tamanho. Só mexe em quem ainda está com a medida antiga; é seguro repetir.
 const POS='combatesAtivos/mapaMesaSyncDireta/posicoes',CENA='combatesAtivos/mapaMesaSyncDiretaCena';
 const D=p=>dep.doc(dep.db,...p.split('/'));
 let modelosFeitos=false,ultimoAjuste='',ajustando=false;
 async function ajustarTamanhos(){
  if(ajustando||!dep.db||!dep.setDoc)return;ajustando=true;
  try{
   if(!modelosFeitos){
    const lista=dep.objetos?.()||[];let n=0;
    for(let i=0;i<lista.length;i++){const novo=corrigirModelo(lista[i]);if(!novo)continue;
     await dep.setDoc(D('configuracoes/'+dep.docObjeto(novo.id)),{larguraM:novo.larguraM,alturaM:novo.alturaM},{merge:true});lista[i]={...lista[i],larguraM:novo.larguraM,alturaM:novo.alturaM};n++;}
    modelosFeitos=true;if(n)console.info('[Barra do mestre] medidas reais em',n,'móvel(is) do banco.');
   }
   const mapa=String(ctrl()?.mapaAtual?.()||'');if(!mapa)return;
   const chave=mapa+':'+Math.floor(Date.now()/15000);if(chave===ultimoAjuste)return;ultimoAjuste=chave;
   // móveis do mapa aberto
   const cs=await dep.getDoc(D(CENA)),cena=cs.exists()?cs.data():null;
   if(cena&&String(cena.mapId||'')===mapa&&(cena.objects||[]).some(o=>corrigirObjetoCena(o))){
    await dep.runTransaction(dep.db,async tx=>{
     const s=await tx.get(D(CENA)),c=s.exists()?s.data():null;if(!c||String(c.mapId||'')!==mapa)return;
     const objects=(c.objects||[]).map(o=>corrigirObjetoCena(o)||o),next=JSON.parse(JSON.stringify({...c,objects}));
     tx.set(D(CENA),next);tx.set(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(mapa)),next);
    });
   }
   // miniaturas sem tamanho no mapa aberto
   const modelo=id=>{const [pref,resto]=[id.split(':')[0],id.split(':').slice(1).join(':').split('~')[0]];if(!/^sync/.test(id))return (dep.personagens?.()||[]).find(m=>String(m.id)===id)||null;const banco=pref==='synccriatura'?dep.criaturas?.():pref==='syncnpc'?dep.npcs?.():null;return (banco||[]).find(m=>String(m.id)===resto)||null;};
   const ps=await dep.getDocs(dep.collection(dep.db,...POS.split('/')));
   // v117: NPC do banco duplicado de um NPC de ficha avançada que já está no mesmo mapa sai do mapa
   try{const f=organizarFichas({personagens:dep.personagens?.()||[],npcs:dep.npcs?.()||[],mestreUid:String(dep.uid?.()||'')});
    const noMapa=(ps.docs||[]).map(d=>({id:decodeURIComponent(d.id),raw:d.id,t:d.data()})).filter(x=>String(x.t?.mapaId||'')===mapa);
    const avNoMapa=new Set(noMapa.filter(x=>f.avancados.some(c=>String(c.id)===x.id)).map(x=>normNome(f.avancados.find(c=>String(c.id)===x.id).nome)));
    for(const x of noMapa){if(!x.id.startsWith('syncnpc:'))continue;const base=x.id.slice(8).split('~')[0],n=f.duplicados.find(d=>String(d.id)===base);
     if(n&&avNoMapa.has(normNome(n.nome))&&dep.deleteDoc){await dep.deleteDoc(D(POS+'/'+x.raw));console.info('[Barra do mestre] duplicado retirado:',n.nome);}}
   }catch(e){console.warn('[Barra do mestre] duplicados',e);}
   for(const d of ps.docs||[]){
    const id=decodeURIComponent(d.id),t=d.data();if(/^sync(objeto|item):/.test(id)||String(t?.mapaId||'')!==mapa)continue;
    const m=modelo(id);if(!m)continue;
    // v114: miniatura do banco no lugar da foto antiga (quem já tem miniatura própria fica como está)
    // v122: monstros/NPCs do banco seguem sempre a miniatura desenhada atual do banco (inclusive se a antiga já era desenhada)
    const mini=/^sync/.test(id)?String(m.miniatura?.url||''):'',trocaImg=!!mini&&mini.includes('#mini')&&t.imagem!==mini;
    if(Number(t?.diametroM)>0&&!trocaImg)continue;
    const diam=tamanhoMiniaturaM(m);
    await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+d.id),s=await tx.get(r);if(!s.exists())return;const v=s.data();
     const novo={...v};if(!(Number(v.diametroM)>0))novo.diametroM=diam;if(trocaImg)novo.imagem=mini;
     if(novo.diametroM===v.diametroM&&novo.imagem===v.imagem)return;tx.set(r,{...novo,revision:Number(v.revision||0)+1});});
   }
  }catch(e){console.warn('[Barra do mestre] tamanhos',e);}
  finally{ajustando=false;}
 }

 // ------------------------------------------------------------ vigia (instala/atualiza sem pular a página)
 const vigia=setInterval(()=>{
  try{
   if(!ehMestre()){if(barra?.isConnected)barra.remove();root.body.classList.remove('mb-mestre');return;}
   if(montarBarra()){arrumarEntorno();arrumarOficina();atualizar();void ajustarTamanhos();}erros=0;
  }catch(e){if(++erros<4)console.warn('[Barra do mestre]',e);if(erros>=8){clearInterval(vigia);barra?.remove();}}
 },900);
 return {selecao:()=>ctrl()?.selecao?.()||null,abrirPaleta:()=>alternarPaleta(barra?.querySelector('[data-a="colocar"]')),armar,desarmar,colocarEm,parar:()=>{clearInterval(vigia);root.removeEventListener('pointerdown',captura,true);barra?.remove();paleta?.remove();}};
}
