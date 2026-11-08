// Mesa Estelar v117 — Conta do mestre: abas na ordem do mestre e "Todas as fichas".
//
// • Escudo do Mestre vira a primeira aba (e abre ao entrar); a Ficha vai para o fim.
// • Na aba Ficha, nenhuma ficha vem escolhida: um painel "📚 Todas as fichas" dá acesso a
//   jogadores, NPCs (inclusive os de ficha avançada, antigos PDMs) e monstros, para abrir,
//   editar e criar.
// • PDMs = NPCs com ficha avançada: aparecem junto dos NPCs; o NPC do banco com o mesmo nome
//   (duplicado) é escondido das listas, sem apagar nada.
// Só age na conta do mestre. Módulo à parte: se falhar, tudo segue como antes.

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const normNome=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/^(dra?|sr|sra|srta|lord|lady|capitao|cap)\.?\s+/,'').replace(/[^a-z0-9]+/g,' ').trim();

// Separa as fichas do jogo em jogadores, NPCs (avançados + do banco, sem duplicados) e monstros.
export function organizarFichas({personagens=[],npcs=[],criaturas=[],mestreUid=''}){
 const dono=c=>String(c?.dono||c?.donoUid||'');
 const avancados=personagens.filter(c=>mestreUid&&dono(c)===mestreUid);
 const jogadores=personagens.filter(c=>!(mestreUid&&dono(c)===mestreUid));
 const nomesAv=new Set(avancados.map(c=>normNome(c.nome)));
 const npcsBanco=npcs.filter(n=>!nomesAv.has(normNome(n.nome)));
 const duplicados=npcs.filter(n=>nomesAv.has(normNome(n.nome)));
 return {jogadores,avancados,npcsBanco,duplicados,criaturas};
}

const CSS_MESTRE=`
#mmFichas{margin:0 0 14px;padding:12px;border-radius:14px;background:rgba(10,16,30,.6);border:1px solid #2f4664;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif}
#mmFichas .mm-topo{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#mmFichas h3{margin:0;flex:1;color:#8ee7ff;font-size:15px;min-width:160px}
#mmFichas input[type=search]{flex:1 1 220px;height:32px;border-radius:9px;border:1px solid #3b5878;background:#0b1322;color:#e8eefc;padding:0 10px}
#mmFichas .mm-abas{display:flex;gap:6px;margin:10px 0 8px;flex-wrap:wrap}
#mmFichas .mm-aba{height:30px;padding:0 12px;border-radius:999px;border:1px solid #3b5878;background:#16233a;color:#c6d3e6;cursor:pointer}
#mmFichas .mm-aba[aria-pressed="true"]{background:#1f3f62;border-color:#8ee7ff;color:#fff}
#mmFichas .mm-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;max-height:340px;overflow:auto;padding:2px}
#mmFichas .mm-card{display:flex;gap:8px;align-items:center;padding:7px;border-radius:10px;border:1px solid #2f4664;background:rgba(255,255,255,.04);cursor:pointer;color:#e8eefc;text-align:left;min-height:52px}
#mmFichas .mm-card:hover{border-color:#8ee7ff}
#mmFichas .mm-card img{width:38px;height:38px;object-fit:contain;flex:none}
#mmFichas .mm-card .mm-sem{width:38px;height:38px;display:grid;place-items:center;flex:none;font-size:20px}
#mmFichas .mm-card b{display:block;font-size:12px;line-height:1.2;overflow:hidden;text-overflow:ellipsis}
#mmFichas .mm-card small{color:#9fb3cc;font-size:11px}
#mmFichas .mm-novo{display:flex;gap:6px;flex-wrap:wrap}
`;

export function instalarMestre(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const el=id=>root.getElementById(id);
 if(!el('mmCssV117')){const st=root.createElement('style');st.id='mmCssV117';st.textContent=CSS_MESTRE;root.head.append(st);}
 let organizado=false,painel=null,aba='jogadores',limpo=false;

 // ------------------------------------------------------------ abas
 function organizarAbas(){
  if(organizado)return;const barra=root.querySelector('.tabs');const escudo=el('escudoTabBtn');
  if(!barra||!escudo||escudo.classList.contains('hidden'))return;
  const ficha=[...barra.querySelectorAll('.tab-btn')].find(b=>/mostrarAba\('ficha'/.test(b.getAttribute('onclick')||''));
  barra.prepend(escudo);if(ficha)barra.append(ficha);
  organizado=true;
  try{win.mostrarAba?.('escudo',escudo);}catch(e){console.warn('[Mestre] abas',e);}
 }

 // ------------------------------------------------------------ todas as fichas
 function fichas(){return organizarFichas({personagens:dep.personagens?.()||[],npcs:dep.npcs?.()||[],criaturas:dep.criaturas?.()||[],mestreUid:String(dep.uid?.()||'')});}
 function montarPainel(){
  const ficha=el('ficha');if(!ficha)return;
  if(painel?.isConnected)return;
  painel=root.createElement('div');painel.id='mmFichas';
  painel.innerHTML=`<div class="mm-topo"><h3>📚 Todas as fichas</h3><input type="search" data-busca placeholder="Buscar por nome…" aria-label="Buscar ficha">
   <div class="mm-novo"><button type="button" class="btn-small" data-novo="pc" title="Nova ficha completa (jogador ou NPC com ficha avançada)">➕ Ficha completa</button><button type="button" class="btn-small" data-novo="npc" title="Novo NPC simples do banco">➕ NPC</button><button type="button" class="btn-small" data-novo="monstro" title="Nova criatura">➕ Monstro</button></div></div>
   <div class="mm-abas">${[['jogadores','🧑 Jogadores'],['npcs','🎭 NPCs'],['monstros','👾 Monstros']].map(([k,n])=>`<button type="button" class="mm-aba" data-aba="${k}" aria-pressed="false">${n}</button>`).join('')}</div>
   <div class="mm-grade" data-grade></div>`;
  ficha.prepend(painel);
  painel.querySelector('[data-busca]').addEventListener('input',desenhar);
  painel.addEventListener('click',e=>{
   const a=e.target.closest('[data-aba]');if(a){aba=a.dataset.aba;desenhar();return;}
   const n=e.target.closest('[data-novo]');if(n){const f={pc:'novoPersonagem',npc:'adicionarNPCBanco_',monstro:'adicionarCriaturaBanco_'}[n.dataset.novo];try{win[f]?.();}catch(err){console.warn('[Mestre]',err);}return;}
   const c=e.target.closest('[data-abrir]');if(!c)return;
   const [tipo,id]=[c.dataset.tipo,c.dataset.abrir];
   try{
    if(tipo==='ficha'){win.selecionarPersonagem?.(id);el('characterSection')?.scrollIntoView({block:'start',behavior:'smooth'});}
    else if(tipo==='npc')win.editarNPCBanco_?.(id);
    else if(tipo==='monstro')win.editarCriaturaBanco_?.(id);
   }catch(err){console.warn('[Mestre] abrir',err);}
  });
  desenhar();
 }
 function cartao(x,tipo,rotulo){const img=x.miniatura?.url||x.imagem||'';return `<button type="button" class="mm-card" data-abrir="${esc(x.id)}" data-tipo="${tipo}" title="${esc(x.nome||x.id)}">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:'<span class="mm-sem">👤</span>'}<span><b>${esc(x.nome||x.id)}</b><small>${esc(rotulo)}</small></span></button>`;}
 function desenhar(){
  if(!painel)return;const f=fichas(),q=normNome(painel.querySelector('[data-busca]').value);
  const ok=x=>!q||normNome(x.nome).includes(q);
  painel.querySelectorAll('[data-aba]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.aba===aba?'true':'false'));
  let html='';
  if(aba==='jogadores')html=f.jogadores.filter(ok).map(c=>cartao(c,'ficha',[c.raca,c.carreira].filter(Boolean).join(' · ')||'Jogador')).join('');
  else if(aba==='npcs')html=[...f.avancados.filter(ok).map(c=>cartao(c,'ficha','📋 ficha avançada')),...f.npcsBanco.filter(ok).map(n=>cartao(n,'npc',[n.raca,n.carreira].filter(Boolean).join(' · ')||'NPC'))].join('');
  else html=f.criaturas.filter(ok).map(c=>cartao(c,'monstro',c.tamanho||'Criatura')).join('');
  const g=painel.querySelector('[data-grade]');const novo=html||'<div style="color:#9fb3cc">Nada encontrado.</div>';
  if(g.dataset.h!==novo){g.innerHTML=novo;g.dataset.h=novo;}
 }

 const vigia=setInterval(()=>{
  try{
   if(!ehMestre()){if(painel?.isConnected)painel.remove();return;}
   organizarAbas();montarPainel();
   if(!limpo&&(dep.personagens?.()||[]).length){limpo=true;try{dep.limparSelecao?.();}catch(e){console.warn('[Mestre] seleção',e);}}
   if(root.activeElement!==painel?.querySelector('[data-busca]'))desenhar();
  }catch(e){console.warn('[Mestre]',e);}
 },1200);
 return {fichas,abrir:()=>{montarPainel();},parar:()=>clearInterval(vigia)};
}
