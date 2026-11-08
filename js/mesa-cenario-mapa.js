// Mesa Estelar v118 — O Cenário Atual dentro do Mapa da Mesa.
//
// Botão 📜 no canto do mapa (para todos) abre uma gaveta lateral com o cenário:
//  • jogadores: exatamente o que viam na aba "Cenário Atual" (descrição, pessoas, ações,
//    comércio…) — o mesmo conteúdo, movido para cá, com os mesmos botões;
//  • mestre: além disso, um bloco "🔒 Só o mestre" com o texto para ler em voz alta,
//    objetivo, descrição do mestre, segredos, eventos, encontros, NPCs e observações.
//    Esses dados vêm do banco de cenários, que só o mestre consegue ler.
// A aba "Cenário Atual" sai do topo. Módulo à parte: se falhar, a aba volta a aparecer.

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const txt=s=>esc(String(s||'').trim()).replace(/\s*\|\s*/g,' · ').replace(/\n/g,'<br>');

export function blocosMestre(c){
 if(!c)return [];
 return [['📢','Ler para os jogadores',c.descricaoJogadores,'ler'],['🎯','Objetivo',c.objetivo],['🕵️','O que está acontecendo',c.descricaoGM],['🤫','Segredos',c.segredos],
  ['🧩','Estado inicial',c.estadoInicial],['⚡','Eventos possíveis',c.eventos],['👾','Encontros',c.encontros],['🎭','NPCs da cena',c.npcsCena],['🎲','Testes sugeridos',c.testesSugeridos],['📝','Observações',c.observacoes]]
  .filter(([, ,v])=>String(v||'').trim());
}

const ESTILO_MC=`
#mcBotao{position:absolute;right:8px;top:8px;z-index:36;height:32px;padding:0 12px;border-radius:999px;border:1px solid #8ee7ff;background:rgba(10,16,30,.88);color:#e8eefc;font:600 13px 'Segoe UI',Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.45)}
#mcBotao[aria-pressed="true"]{background:#1f3f62}
#mcGaveta{position:fixed;top:70px;right:12px;bottom:12px;width:min(420px,calc(100vw - 24px));z-index:9988;display:flex;flex-direction:column;background:#101828;border:1px solid #49668a;border-radius:14px;color:#e8eefc;font:13px/1.45 'Segoe UI',Arial,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.6)}
#mcGaveta[hidden]{display:none}
#mcGaveta .mc-topo{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08)}
#mcGaveta .mc-topo h3{margin:0;flex:1;font-size:15px;color:#8ee7ff}
#mcGaveta .mc-corpo{flex:1;overflow:auto;padding:8px 12px 14px}
#mcGaveta .mc-mestre{border:1px solid rgba(255,209,102,.35);background:rgba(255,209,102,.05);border-radius:12px;padding:8px 10px;margin:4px 0 12px}
#mcGaveta .mc-mestre>b{color:#ffd166}
#mcGaveta .mc-bloco{margin:8px 0}
#mcGaveta .mc-bloco h4{margin:0 0 2px;font-size:12px;color:#c6d3e6;text-transform:uppercase;letter-spacing:.04em}
#mcGaveta .mc-ler{border-left:3px solid #57e3a1;padding:6px 10px;background:rgba(87,227,161,.07);border-radius:0 8px 8px 0;font-style:italic}
#mcGaveta .mc-sep{margin:10px 0 4px;color:#8ee7ff;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
#mcDescricao{position:absolute;left:8px;bottom:8px;z-index:34;max-width:min(520px,70%);font:13px/1.45 'Segoe UI',Arial,sans-serif;color:#e8eefc}
#mcDescricao[hidden]{display:none}
#mcDescricao .mc-chip{cursor:pointer;display:inline-flex;gap:6px;align-items:center;height:30px;padding:0 12px;border-radius:999px;background:rgba(10,16,30,.88);border:1px solid #57e3a1;font-weight:600;box-shadow:0 6px 18px rgba(0,0,0,.45)}
#mcDescricao .mc-texto{display:none;margin-top:6px;padding:10px 12px;border-radius:12px;background:rgba(10,16,30,.92);border:1px solid #2f4664;font-style:italic;max-height:40vh;overflow:auto;box-shadow:0 10px 26px rgba(0,0,0,.55)}
#mcDescricao:hover .mc-texto,#mcDescricao.aberto .mc-texto{display:block}
#mcGaveta #cenario-publico{display:block!important;padding:0!important;margin:0!important;background:none!important;border:0!important}
#mcGaveta #cenario-publico .form-section{padding:0!important;background:none!important;border:0!important;box-shadow:none!important}
#mcGaveta #cenario-publico .form-section>h2,#mcGaveta #cenario-publico .form-section>p:first-of-type{display:none}
`;

export function instalarCenarioNoMapa(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const el=id=>root.getElementById(id);
 if(!el('mcCssV118')){const st=root.createElement('style');st.id='mcCssV118';st.textContent=ESTILO_MC;root.head.append(st);}
 let gaveta=null,botao=null,erros=0,origem=null;

 function montar(){
  const b=el('novaSyncBoard'),host=b?.parentElement;if(!host)return false;
  if(getComputedStyle(host).position==='static')host.style.position='relative';
  if(!botao||!botao.isConnected){botao=root.createElement('button');botao.type='button';botao.id='mcBotao';botao.textContent='📜 Cenário';botao.title='Cenário atual: descrição, pessoas e ações deste local'+(ehMestre()?' (e notas só do mestre)':'');botao.setAttribute('aria-pressed','false');
   botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',()=>abrir(gaveta?.hidden!==false));host.append(botao);}
  if(!gaveta){gaveta=root.createElement('div');gaveta.id='mcGaveta';gaveta.hidden=true;
   gaveta.innerHTML=`<div class="mc-topo"><h3 data-titulo>📜 Cenário</h3><button type="button" class="btn-small" data-x title="Fechar">✕</button></div><div class="mc-corpo"><div data-mestre></div><div class="mc-sep" data-sep-publico>👀 O que os jogadores veem</div><div data-publico></div></div>`;
   root.body.append(gaveta);gaveta.querySelector('[data-x]').addEventListener('click',()=>abrir(false));
   gaveta.addEventListener('click',e=>{if(e.target.closest('[data-mostrar]')){void alternarDescricao();return;}const c=e.target.closest('[data-copiar]');if(c){try{win.navigator.clipboard?.writeText(c.dataset.copiar);c.textContent='✅ copiado';}catch(_){}}});}
  // o conteúdo público da antiga aba passa a morar na gaveta (mesmos ids e botões)
  const pub=el('cenario-publico');if(pub&&pub.parentElement!==gaveta.querySelector('[data-publico]')){if(!origem)origem={pai:pub.parentElement,depois:pub.nextSibling};gaveta.querySelector('[data-publico]').append(pub);}
  const aba=el('cenarioAtualTabBtn');if(aba&&aba.style.display!=='none')aba.style.display='none';
  return true;
 }
 function desenharMestre(){
  const caixa=gaveta?.querySelector('[data-mestre]');if(!caixa)return;
  const sep=gaveta.querySelector('[data-sep-publico]');
  if(!ehMestre()){if(caixa.innerHTML)caixa.innerHTML='';if(sep)sep.hidden=true;return;}
  if(sep)sep.hidden=false;
  const c=dep.cenarioMestre?.()||null,blocos=blocosMestre(c);
  const titulo=gaveta.querySelector('[data-titulo]'),t='📜 '+(c?.nome||'Cenário');if(titulo.textContent!==t)titulo.textContent=t;
  const html=c?`<div class="mc-mestre"><b>🔒 Só o mestre</b>${c.local?`<div style="color:#9fb3cc">${esc(c.local)}${c.tipo?' · '+esc(c.tipo):''}</div>`:''}
   ${blocos.map(([i,n,v,k])=>`<div class="mc-bloco"><h4>${i} ${esc(n)}${k==='ler'?` <button type="button" class="btn-small" data-copiar="${esc(String(v))}" style="float:right;padding:0 6px" title="Copiar">📋</button><button type="button" class="btn-small${descricao?.visivel?' btn-select':''}" data-mostrar style="float:right;padding:0 6px;margin-right:4px" title="Mostrar este texto aos jogadores, como descrição do local no mapa">${descricao?.visivel?'👁️ visível':'🙈 oculto'}</button>`:''}</h4><div class="${k==='ler'?'mc-ler':''}">${txt(v)}</div></div>`).join('')}</div>`
   :'<div class="mc-mestre"><b>🔒 Só o mestre</b><div style="color:#9fb3cc">Nenhum cenário do banco ligado a este mapa.</div></div>';
  if(caixa.dataset.h!==html){caixa.innerHTML=html;caixa.dataset.h=html;}
 }
 // ------------------------------------------------------------ v120: descrição do local visível aos jogadores
 let descricao=null,descMapa='',pararDesc=null,chip=null;
 const caminhoDesc=id=>['combatesAtivos','mesaDescricao_'+encodeURIComponent(String(id))];
 const mapaAtual=()=>String(el('novaSyncBoard')?.dataset.mapaVisivel||'');
 function observarDescricao(){
  const id=mapaAtual();if(id===descMapa||!dep.onSnapshot)return;descMapa=id;pararDesc?.();pararDesc=null;descricao=null;desenharChip();
  if(!id)return;pararDesc=dep.onSnapshot(dep.doc(dep.db,...caminhoDesc(id)),s=>{descricao=s.exists()?s.data():null;desenharChip();desenharMestre();},e=>console.warn('[Cenário] descrição',e));
 }
 async function alternarDescricao(){
  if(!ehMestre())return;const c=dep.cenarioMestre?.(),id=mapaAtual();if(!c||!id)return;
  const vis=!descricao?.visivel;
  await dep.setDoc(dep.doc(dep.db,...caminhoDesc(id)),{visivel:vis,titulo:String(c.nome||''),texto:String(c.descricaoJogadores||''),mapId:id,atualizadoEm:new Date().toISOString()});
 }
 function desenharChip(){
  const b=el('novaSyncBoard'),host=b?.parentElement;if(!host)return;
  if(!chip||!chip.isConnected){chip=root.createElement('div');chip.id='mcDescricao';chip.addEventListener('pointerdown',e=>e.stopPropagation());chip.addEventListener('click',e=>{if(e.target.closest('.mc-chip'))chip.classList.toggle('aberto');});host.append(chip);}
  const ok=!!(descricao?.visivel&&String(descricao.texto||'').trim());chip.hidden=!ok;if(!ok)return;
  const html=`<div class="mc-chip" title="Passe o mouse ou clique para ler">📖 ${esc(descricao.titulo||'Descrição do local')}</div><div class="mc-texto">${txt(descricao.texto)}</div>`;
  if(chip.dataset.h!==html){chip.innerHTML=html;chip.dataset.h=html;}
 }
 function abrir(sim=true){
  if(!montar())return;gaveta.hidden=!sim;botao.setAttribute('aria-pressed',sim?'true':'false');
  if(sim){desenharMestre();try{dep.render?.();}catch(e){console.warn('[Cenário] render',e);}}
 }
 const vigia=setInterval(()=>{
  try{if(!dep.logado?.())return;montar();observarDescricao();if(gaveta&&!gaveta.hidden)desenharMestre();erros=0;}
  catch(e){console.warn('[Cenário]',e);if(++erros>=6){clearInterval(vigia);const aba=el('cenarioAtualTabBtn');if(aba)aba.style.display='';const pub=el('cenario-publico');if(pub&&origem?.pai)origem.pai.insertBefore(pub,origem.depois||null);}}
 },1500);
 return {abrir,parar:()=>clearInterval(vigia)};
}
