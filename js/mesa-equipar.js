// Mesa Estelar v192 — Equipamento e mochila DENTRO do mapa: ver o que está equipado e na mochila, equipar, guardar,
// passar para o bolso, usar e consumir sem sair da aba do mapa. Funciona com mouse, teclado e controle de videogame.
//
// • 🎒 (canto do mapa), tecla E ou o botão Select/Back do controle abrem o painel "Equipamento".
// • Cada item mostra a imagem, o nome, usos e peso; clicar no nome mostra a descrição (sempre dentro da tela).
//   Os botões de cada linha: ⚔️ Equipar (da mochila/bolso para os slots equipados), 🎒 Guardar (do equipado para a mochila),
//   🧷 Bolso, ✨ Usar (curar, antídoto, comida, lanterna… pelo módulo de itens).
// • No controle: alavanca ou direcional percorrem os botões, A aperta, B fecha (o painel entra na lista de janelas do controle).
// • Respeita o limite de peso de cada compartimento (mas NUNCA bloqueia uma mudança que só diminui o peso). Em combate por
//   turnos custa 1 Ação; em tempo real atrasa a recarga. Grava na ficha do personagem (como o inventário da aba Ficha).
// Módulo à parte: se falhar, o mapa e a aba de inventário seguem normais.

import {efeitoDoItem,usosRestantes} from './mesa-uso-itens.js?v=192';
const clean=v=>JSON.parse(JSON.stringify(v??null));
export const COMPARTIMENTOS=[{id:'equipado',nome:'Equipado',icone:'⚔️',slots:12},{id:'bolso',nome:'Bolso',icone:'🧷',slots:2},{id:'mochila',nome:'Mochila',icone:'🎒',slots:20}];
export const compDe=id=>COMPARTIMENTOS.find(c=>c.id===id)||null;
// Primeiro espaço vazio do compartimento (respeitando o número de slots); -1 se está cheio.
export function primeiroLivre(lista,slots){const a=Array.isArray(lista)?lista:[];for(let i=0;i<slots;i++)if(!a[i])return i;return -1;}
// Move um item entre compartimentos (puro). Devolve {inv,para,erro}; o inventário dado não é alterado.
export const ehMochila=i=>!!i&&/mochila|backpack/.test(String(i.nome||i.nome_en||i.idBanco||i.id||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase());
export function moverItem(inventario,de,indice,para){
 const inv=clean(inventario||{}),A=compDe(de),B=compDe(para);if(!A||!B)return {inv,erro:'Compartimento inválido.'};
 if(de===para)return {inv,erro:'Já está aí.'};
 for(const c of COMPARTIMENTOS){inv[c.id]=Array.isArray(inv[c.id])?inv[c.id]:[];while(inv[c.id].length<c.slots)inv[c.id].push(null);}
 const item=inv[de][indice];if(!item)return {inv,erro:'Não há item neste lugar.'};
 if(para==='mochila'&&!(inv.equipado||[]).some(ehMochila))return {inv,erro:'Equipe uma mochila para liberar os espaços da Mochila.'};
 const livre=primeiroLivre(inv[para],B.slots);if(livre<0)return {inv,erro:B.nome+' está cheio(a).'};
 inv[para][livre]=item;inv[de][indice]=null;return {inv,para:livre,item};
}
// Pode aceitar a mudança de peso? Só recusa o compartimento que passa do limite E ficou mais pesado que antes
// (tirar coisa de uma mochila que já estava pesada demais nunca é recusado).
export const pesoAceito=(depois,antes,limite)=>!Number.isFinite(limite)||depois<=limite+1e-9||depois<=antes+1e-9;
export function listaDoCompartimento(inventario,comp){const c=compDe(comp);return (Array.isArray(inventario?.[comp])?inventario[comp]:[]).slice(0,c?.slots||0).map((item,indice)=>({comp,indice,item})).filter(x=>x.item);}
// Ações possíveis de um item, conforme onde ele está.
export function acoesDoItem(comp,temEfeito){
 const out=[];
 if(comp!=='equipado')out.push({id:'equipado',rotulo:'Equipar',icone:'⚔️'});
 if(comp!=='mochila')out.push({id:'mochila',rotulo:'Guardar',icone:'🎒'});
 if(comp==='mochila')out.push({id:'bolso',rotulo:'Bolso',icone:'🧷'});
 if(temEfeito)out.push({id:'usar',rotulo:'Usar',icone:'✨'});
 return out;
}

// ---------------------------------------------------------------- instalação (navegador)
import {iconeParaItem} from './mesa-icones-itens.js?v=201';
export function instalarEquipar(dep){
 const root=dep.root||document,win=root.defaultView||window,rF=p=>{try{return globalThis.mesaTreinoRotaV205?.(p)||p;}catch(_){return p;}},D=p=>dep.doc(dep.db,rF(p)); // v205: duelo de treino usa a cópia da sessão
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 let painel=null,aberto=false,ficha=null,fichaId='',msg='',ocupado=false,detalhe='',foco=null;
 const ESTILO=`#eqPainel{position:fixed;right:12px;top:70px;bottom:12px;z-index:9996;width:min(440px,calc(100vw - 24px));display:flex;flex-direction:column;border-radius:14px;background:rgba(10,18,32,.97);border:1px solid #6b83a8;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.55)}
#eqPainel[hidden]{display:none}#eqPainel .eq-topo{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.1)}#eqPainel .eq-topo b{flex:1;color:#8ee7ff;font-size:14px}
#eqPainel .eq-corpo{overflow:auto;padding:8px 10px;flex:1}#eqPainel h5{margin:10px 0 4px;color:#ffd447;font-size:12.5px;display:flex;justify-content:space-between;gap:8px}#eqPainel h5 small{color:#9fb3cc;font-weight:400}
#eqPainel .eq-linha{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;margin:4px 0}#eqPainel .eq-nome{display:flex;gap:8px;align-items:center;text-align:left;min-width:0;width:100%}
#eqPainel button{border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;font:600 12px 'Segoe UI',Arial,sans-serif;padding:6px 9px}
#eqPainel button:disabled{opacity:.5;cursor:wait}#eqPainel button:focus-visible,#eqPainel button.ctl-foco{outline:3px solid #ffd447;outline-offset:1px}
#eqPainel .eq-img{width:32px;height:32px;flex:none;border-radius:7px;background:#0b1424;border:1px solid #2f4664;display:grid;place-items:center;overflow:hidden;font-size:18px}#eqPainel .eq-img img{width:100%;height:100%;object-fit:contain}
#eqPainel .eq-txt{min-width:0;overflow:hidden}#eqPainel .eq-txt span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#eqPainel .eq-txt small{color:#9fb3cc}
#eqPainel .eq-acoes{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}#eqPainel .eq-desc{grid-column:1/-1;margin:0 0 2px;padding:7px 9px;border-radius:8px;background:#0b1424;border:1px solid #2f4664;color:#cfe0f5;line-height:1.4;max-height:30vh;overflow:auto;overflow-wrap:anywhere;white-space:pre-wrap}
#eqPainel .eq-aviso{padding:6px 12px;color:#ffe9a8;border-top:1px solid rgba(255,255,255,.1);min-height:1.4em}#eqPainel .eq-vazio{color:#7f90a8;padding:4px 2px}
#eqBotao{position:absolute;right:48px;bottom:8px;z-index:38;width:34px;height:34px;border-radius:50%;border:1px solid #ffd447;background:rgba(10,18,32,.9);color:#fff;font-size:17px;cursor:pointer;padding:0}
@media(max-width:560px){#eqPainel{top:8px;right:8px;left:8px;bottom:8px;width:auto}}`;
 if(!root.getElementById('eqCss')){const st=root.createElement('style');st.id='eqCss';st.textContent=ESTILO;root.head.append(st);}
 const ator=()=>{try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}};
 const ehPJ=t=>!!t&&!decodeURIComponent(String(t.id||'')).startsWith('sync')&&!decodeURIComponent(String(t.id||'')).startsWith('dummy:');
 const toast=t=>{msg=t;const x=painel?.querySelector('.eq-aviso');if(x)x.textContent=t;setTimeout(()=>{if(msg===t){msg='';const y=painel?.querySelector('.eq-aviso');if(y)y.textContent='';}},5000);};
 async function carregar(t){const id=decodeURIComponent(String(t.id));try{const s=await dep.getDoc(D('personagens/'+id));ficha=s.exists()?{id,...s.data()}:null;fichaId=id;}catch(_){ficha=null;}return ficha;}
 const imagemDe=it=>String(it?.imagem||dep.imagemItem?.(it)||iconeParaItem(dep.nomeItem?.(it)||it?.nome||it?.name||''));
 const nomeDe=it=>String(dep.nomeItem?.(it)||it?.nome||it?.name||it?.idBanco||'Item');
 const pesoDe=it=>{try{return Number(dep.pesoItem?.(it))||0;}catch(_){return 0;}};
 const efeitoDe=it=>efeitoDoItem(it);
 const usosDe=it=>{const ef=efeitoDe(it);if(!ef)return '';const u=usosRestantes(it,ef);return u===Infinity?'liga/desliga':u+(u>1?' usos':' uso');};
 const emojiDe=it=>{const n=String(nomeDe(it)).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();return /pistola|rifle|carabina|blaster|laser|arma/.test(n)?'🔫':/espada|sabre|faca|lamina|machado|adaga|lanca/.test(n)?'⚔️':/medic|kit|nanogel|antidoto/.test(n)?'🩹':/bateria|celula|municao|cartucho/.test(n)?'🔋':/armadura|colete|capacete|roupa|bota/.test(n)?'🦺':/comida|racao|refeicao|agua|cafe|cerveja/.test(n)?'🍲':'📦';};
 function desenhar(){
  if(!painel||!aberto)return;const t=ator();
  if(!t||!ehPJ(t)){painel.innerHTML='<div class="eq-topo"><b>🎒 Equipamento</b><button type="button" data-x>✕</button></div><div class="eq-corpo"><div class="eq-vazio">Escolha o seu personagem de jogador para ver o equipamento.</div></div>';return;}
  const inv=ficha?.inventario||{},pesoLinha=c=>{try{const p=dep.pesoEfetivo?.(ficha,inv,c.id),l=dep.limitePeso?.(ficha,c.id);return Number.isFinite(l)?`${(+p).toFixed(1)} / ${(+l).toFixed(1)} kg`:`${(+p||0).toFixed(1)} kg`;}catch(_){return '';}};
  const sec=COMPARTIMENTOS.map(c=>{const itens=listaDoCompartimento(inv,c.id);
   const linhas=itens.length?itens.map(({indice,item})=>{const ef=efeitoDe(item),id=`${c.id}:${indice}`,img=imagemDe(item),aco=acoesDoItem(c.id,!!ef&&usosRestantes(item,ef)>0);
    return `<div class="eq-linha"><button type="button" class="eq-nome" data-d="${id}" aria-expanded="${detalhe===id}" title="Ver descrição"><span class="eq-img">${img?`<img src="${esc(img)}" alt="" draggable="false">`:emojiDe(item)}</span><span class="eq-txt"><span>${esc(nomeDe(item))}</span><small>${[usosDe(item),pesoDe(item)?pesoDe(item).toFixed(1).replace('.',',')+' kg':''].filter(Boolean).join(' · ')||'&nbsp;'}</small></span></button>
     <span class="eq-acoes">${aco.map(a=>`<button type="button" data-a="${a.id}" data-c="${c.id}" data-i="${indice}" ${ocupado?'disabled':''} title="${a.rotulo}">${a.icone} ${a.rotulo}</button>`).join('')}</span>
     ${detalhe===id?`<div class="eq-desc">${esc(String(dep.descricaoItem?.(item)||item.descricao||'Sem descrição.'))}</div>`:''}</div>`;}).join(''):'<div class="eq-vazio">Vazio</div>';
   return `<h5><span>${c.icone} ${c.nome} (${itens.length}/${c.slots})</span><small>${esc(pesoLinha(c))}</small></h5>${linhas}`;}).join('');
  const h=`<div class="eq-topo"><b>🎒 Equipamento · ${esc(String(ficha?.nome||t.nome||''))}</b><button type="button" data-x title="Fechar (B / Esc)">✕</button></div><div class="eq-corpo">${sec}</div><div class="eq-aviso">${esc(msg)}</div>`;
  if(painel.dataset.h!==h){const f=root.activeElement&&painel.contains(root.activeElement)?root.activeElement.dataset?.a?`[data-a="${root.activeElement.dataset.a}"][data-c="${root.activeElement.dataset.c}"][data-i="${root.activeElement.dataset.i}"]`:root.activeElement.dataset?.d?`[data-d="${root.activeElement.dataset.d}"]`:'':'';const rol=painel.querySelector('.eq-corpo')?.scrollTop||0;painel.innerHTML=h;painel.dataset.h=h;const c=painel.querySelector('.eq-corpo');if(c)c.scrollTop=rol;if(f)painel.querySelector(f)?.focus?.({preventScroll:true});}
 }
 async function acao(comp,indice,id,btn){
  if(ocupado)return;const t=ator();if(!t||!ficha)return;ocupado=true;desenhar();
  try{
   const item=(ficha.inventario?.[comp]||[])[indice];if(!item)throw Error('O item mudou de lugar.');
   if(id==='usar'){const u=win.mesaUsoItens;if(!u?.pedir)throw Error('Uso de itens indisponível.');await u.pedir(comp,indice,item.instanciaId||'');toast('✨ '+nomeDe(item)+': pedido enviado.');setTimeout(async()=>{await carregar(t);desenhar();},900);return;}
   const c=ctl();if(c?.emCombate?.()&&!(await c.gastarAcao?.(t.id))){throw Error('No combate por turnos, mexer no equipamento gasta 1 Ação: espere a sua vez.');}
   const r=moverItem(ficha.inventario,comp,indice,id);if(r.erro)throw Error(r.erro);
   // peso: antes e depois de cada compartimento mexido
   for(const k of [comp,id]){const antes=dep.pesoEfetivo?.(ficha,ficha.inventario,k),depois=dep.pesoEfetivo?.(ficha,r.inv,k),lim=dep.limitePeso?.(ficha,k);if(antes!==undefined&&!pesoAceito(depois,antes,lim))throw Error(`${compDe(k).nome} passaria do limite de peso (${(+depois).toFixed(1)} / ${(+lim).toFixed(1)} kg).`);}
   await dep.setDoc(D('personagens/'+fichaId),{inventario:r.inv},{merge:true});ficha={...ficha,inventario:r.inv};dep.aposMudar?.(fichaId,r.inv);
   try{win.mesaTempoRealV111?.atrasar?.(t.id,1);}catch(_){}
   toast(`${id==='equipado'?'⚔️ Equipou':id==='bolso'?'🧷 No bolso':'🎒 Guardou'}: ${nomeDe(item)}`);
  }catch(e){toast('⚠️ '+String(e?.message||e));}
  finally{ocupado=false;desenhar();}
 }
 function abrir(sim){
  aberto=sim===undefined?!aberto:!!sim;const t=ator();
  if(!painel){painel=root.createElement('div');painel.id='eqPainel';painel.hidden=true;painel.addEventListener('pointerdown',e=>e.stopPropagation());
   painel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.x!==undefined)return abrir(false);
    if(b.dataset.d){detalhe=detalhe===b.dataset.d?'':b.dataset.d;painel.dataset.h='';return desenhar();}
    if(b.dataset.a)void acao(b.dataset.c,Number(b.dataset.i),b.dataset.a,b);});
   root.addEventListener('keydown',e=>{if(aberto&&e.key==='Escape'){abrir(false);}});root.body.append(painel);}
  painel.hidden=!aberto;if(aberto){painel.dataset.h='';(async()=>{if(t&&ehPJ(t))await carregar(t);desenhar();setTimeout(()=>painel.querySelector('button[data-a],button[data-d]')?.focus?.({preventScroll:true}),30);})();}
 }
 function botao(){
  const b=root.getElementById('novaSyncBoard'),t=ator();let bt=root.getElementById('eqBotao');
  if(!b||!t||!ehPJ(t)||root.getElementById('uiBotao')){bt?.remove();return;} // o 🎒 do módulo de itens já abre este painel
  if(!bt){const sc=b.parentElement;bt=root.createElement('button');bt.type='button';bt.id='eqBotao';bt.textContent='🧰';bt.title='Equipamento e mochila (E)';bt.setAttribute('aria-label','Equipamento e mochila');bt.addEventListener('pointerdown',e=>e.stopPropagation());bt.addEventListener('click',()=>abrir());if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(bt);}
 }
 const vigia=setInterval(()=>{try{botao();if(aberto){const t=ator();if(t&&ehPJ(t)&&Date.now()%3000<650)void carregar(t).then(desenhar);else desenhar();}}catch(e){console.warn('[Equipar]',e);}},650);
 const api={abrir,carregar:async()=>{const t=ator();return t?carregar(t):null;},aberto:()=>aberto,acao};win.mesaEquipar=api;
 return {...api,parar(){clearInterval(vigia);painel?.remove();root.getElementById('eqBotao')?.remove();if(win.mesaEquipar===api)delete win.mesaEquipar;}};
}
