// Mesa Estelar v163 — O que cada comerciante vende.
//
// Antes, todo "Comerciante N" da mesma raça usava o estoque do mesmo modelo (e quase sempre era tecnologia).
// Agora cada comerciante do mapa tem a SUA loja: um ou mais ramos (água, comida, mantimentos, armas, peças, remédios…)
// que puxam os itens do banco pela categoria, mais itens que o mestre põe ou tira à mão.
//  - Padrão: lojas do portão pelo nome (Água e comida, Peças, Armas, Cristais), caravaneiros vendem mantimentos e os
//    outros comerciantes recebem um ramo em rodízio, começando por comida e água (o que mais falta na travessia).
//  - Feira grande = um vendedor para cada coisa: cada vendedor tem um ramo só.
//  - O mestre muda tudo: na própria loja (painel "O que vende") ou no botão 🧾 da barra, que lista os comerciantes do mapa.
// A configuração fica em combatesAtivos/mesaComerciantes (nomes.<token>.loja), que os jogadores já leem.

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=v=>JSON.parse(JSON.stringify(v??null));
export const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

const temCat=(c,...k)=>k.some(x=>c.includes(x));
const ehAgua=(n,c)=>/\bagua\b|bolsa_agua|bolsa de agua|cantil|suco|\bcha\b/.test(n)&&!/maquina|purificad/.test(n);
const ehBebida=(n,c)=>ehAgua(n,c)||/cafe|cerveja|vinho|licor|bebida|refrigerante|energetic/.test(n)||c.includes('bebida')&&!/racao|refeic|comida/.test(n);
const ehComida=(n,c)=>/racao|refeic|comida|pao|fruta|carne|espetinho|petisco|sopa|graos|biscoito|rango|alimento/.test(n)||(temCat(c,'comida','alimento')&&!ehBebida(n,c));
export const RAMOS={
 agua:{nome:'Água e bebidas',ic:'💧',f:(n,c)=>ehBebida(n,c)},
 comida:{nome:'Comida',ic:'🍖',f:(n,c)=>ehComida(n,c)},
 mantimentos:{nome:'Mantimentos de viagem',ic:'🎒',f:(n,c)=>ehAgua(n,c)||/racao|bolsa/.test(n)&&ehComida(n,c)||temCat(c,'sobreviv')||/\bcapa\b|capa_|chapeu|roupa_viajante|roupa de viajante|lanterna|kit_sobreviv|kit de sobreviv|respirador|corda|mochila/.test(n)},
 armas:{nome:'Armas e munição',ic:'⚔️',f:(n,c)=>/(^|\s)(armas?|munic)/.test(c)&&!temCat(c,'armadura')},
 protecao:{nome:'Armaduras e proteção',ic:'🛡️',f:(n,c)=>temCat(c,'armadura','protec')||/capacete|colete|escudo/.test(n)},
 pecas:{nome:'Peças e ferramentas',ic:'🔧',f:(n,c)=>temCat(c,'ferrament','energia','minera','peca')||/bateria|celula de energia|cabo/.test(n)},
 tecnologia:{nome:'Tecnologia',ic:'📡',f:(n,c)=>temCat(c,'tecnolog','comunica','cientif','eletron')},
 remedios:{nome:'Remédios',ic:'🩹',f:(n,c)=>temCat(c,'medic','remed','saude')||/antidoto|nanogel|curativo|primeiros socorros/.test(n)},
 roupas:{nome:'Roupas',ic:'🧥',f:(n,c)=>temCat(c,'roupa','vestu')||/\bcapa\b|capa_|chapeu|botas|cinto/.test(n)},
 exploracao:{nome:'Exploração',ic:'🧭',f:(n,c)=>temCat(c,'explora','sobreviv')||/kit de escalada|kit_escalada|binoculo|navegador|lanterna/.test(n)},
 curiosidades:{nome:'Curiosidades',ic:'🔮',f:(n,c)=>temCat(c,'divers','cientif','reliqu','cristal')},
 bar:{nome:'Bar e refeições',ic:'🍺',f:(n,c)=>/cafe|cerveja|vinho|licor|refeic|petisco|espetinho/.test(n)},
 // v171: concessionária e estaleiro (abrem a vitrine de veículos/naves, não a loja de itens)
 veiculos:{nome:'Veículos',ic:'🚗',f:()=>false,vitrine:'veiculos'},
 naves:{nome:'Naves',ic:'🚀',f:()=>false,vitrine:'naves'},
 montarias:{nome:'Montarias e animais',ic:'🐉',f:()=>false,vitrine:'montarias'}
};
export const ORDEM_RAMOS=Object.keys(RAMOS);
// rodízio para comerciantes sem loja definida: comida e água primeiro
export const RODIZIO=['comida','agua','mantimentos','roupas','pecas','remedios','exploracao','tecnologia'];
// lojas dos mapas do portão (v160/v161/v162) → ramos
export const LOJA_PARA_RAMOS={agua:['agua','comida'],comida:['comida'],pecas:['pecas'],armas:['armas','protecao'],cristais:['curiosidades','tecnologia'],remedios:['remedios'],roupas:['roupas'],mantimentos:['mantimentos']};

const disponivel=i=>i&&i.id&&Number(i.preco)>0&&!(i.disponivelCampanha===false||String(i.disponivelCampanha)==='false');
const militar=i=>/militar/.test(sem(i?.nivelAcesso));
export function itensDoRamo(ramo,itens=[],{militares=false}={}){
 const R=RAMOS[ramo];if(!R)return [];
 return itens.filter(i=>disponivel(i)&&(militares||!militar(i))&&R.f(sem(String(i.nome||'')+' '+String(i.id||'')),sem(i.categoria||'')));
}
// ids do estoque: ramos + incluídos − excluídos
export function estoqueDaLoja(cfg={},itens=[]){
 const ids=new Set();
 for(const r of cfg.ramos||[])for(const i of itensDoRamo(r,itens,{militares:!!cfg.militares}))ids.add(String(i.id));
 for(const id of cfg.incluir||[])ids.add(String(id));
 for(const id of cfg.excluir||[])ids.delete(String(id));
 return [...ids];
}
export const numeroDoToken=id=>Number((/~(\d+)$/.exec(decodeURIComponent(String(id||'')))||[])[1]||1);
export const ehGenericoTok=id=>/^syncnpc:comerciante_generico_[a-z]+(~\d+)?$/.test(decodeURIComponent(String(id||'')));
// loja padrão de um comerciante (sem nada escolhido pelo mestre)
export function lojaPadrao(tokenId,meta={}){
 const L=meta.lojaV160||meta.lojaV161||meta.lojaV162;
 if(L&&LOJA_PARA_RAMOS[L])return {ramos:LOJA_PARA_RAMOS[L],nome:meta.lojaNome||'',padrao:true};
 if(meta.caravanaV160)return {ramos:['mantimentos'],nome:'Mantimentos da caravana',padrao:true};
 if(!ehGenericoTok(tokenId))return null; // comerciante com nome (UR-17, Hessa…): fica com o estoque do banco
 const r=RODIZIO[(numeroDoToken(tokenId)-1)%RODIZIO.length];return {ramos:[r],nome:'',padrao:true};
}
export function lojaDoToken(tokenId,meta={}){
 const c=meta.loja;if(c&&(c.ramos?.length||c.incluir?.length))return {...c,padrao:false};
 const p=lojaPadrao(tokenId,meta);if(!p)return null;
 return c?{...p,...c,ramos:c.ramos?.length?c.ramos:p.ramos,padrao:!c.ramos?.length}:p;
}
export const nomeDaLoja=cfg=>String(cfg?.nome||'').trim()||(cfg?.ramos||[]).map(r=>RAMOS[r]?.nome).filter(Boolean).join(' · ')||'Barraca';
export const idLoja=tokenId=>'loja:'+encodeURIComponent(decodeURIComponent(String(tokenId||'')));
export const tokenDaLoja=id=>String(id||'').startsWith('loja:')?decodeURIComponent(String(id).slice(5)):'';

export function instalarLojas(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const itens=()=>{try{return dep.itens?.()||[];}catch(_){return [];}};
 const metaDe=tokenId=>{const all=win.mesaComerciantes?.meta?.()||{};const d=decodeURIComponent(String(tokenId||''));return all[encodeURIComponent(d)]||all[d]||all[String(tokenId)]||{};};
 const tokenPorId=d=>(ctl()?.todosTokens?.()||[]).find(t=>decodeURIComponent(String(t.id))===d)||null;
 const nomeVisivel=(tid,nome)=>{try{return win.mesaNomeVisivelV141?.({id:tid,nome})||nome;}catch(_){return nome;}};
 // comerciante público (o objeto que a tela de comércio usa) para um token do mapa
 function paraToken(tokenId,base=null){
  const d=decodeURIComponent(String(tokenId||''));if(!d.startsWith('syncnpc:'))return null;
  const cfg=lojaDoToken(d,metaDe(d));if(!cfg)return null;
  const t=tokenPorId(d),enc=encodeURIComponent(d);
  return {...(base||{}),comerciante:true,id:idLoja(d),tokenId:enc,nome:nomeVisivel(enc,String(t?.nome||base?.nome||'Comerciante').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,'')),imagem:String(base?.imagem||t?.imagem||''),tipo:String(base?.tipo||'Comerciante'),
   comercioNome:nomeDaLoja(cfg),compraPct:Number(base?.compraPct)||100,vendaPct:Number(base?.vendaPct??50),barganha:base?.barganha!==false,resistencia:Number(base?.resistencia)||50,compraJogador:base?.compraJogador!==false,
   estoqueIds:estoqueDaLoja(cfg,itens()),lojaV163:cfg};
 }
 function porId(id){const d=tokenDaLoja(id);if(!d)return null;let base=null;try{base=win.mesaComerciantePorTokenBase_?.(encodeURIComponent(d))||null;}catch(_){}return paraToken(d,base);}
 async function gravar(tokenId,loja){
  if(!ehMestre())throw Error('Somente o mestre.');
  const enc=encodeURIComponent(decodeURIComponent(String(tokenId)));const {padrao,...l}=loja||{};loja=l;
  await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:{[enc]:{loja:{ramos:[],incluir:[],excluir:[],nome:'',militares:false,...loja}}}}),{merge:true});
  try{const all=win.mesaComerciantes?.meta?.();if(all){all[enc]={...(all[enc]||{}),loja:{...loja}};}}catch(_){}
 }

 // ------------------------------------------------------------ tela (mestre)
 const CSS=`.lj-p{margin:12px 0;padding:10px;border-radius:10px;background:rgba(255,209,102,.06);border:1px solid rgba(255,209,102,.3)}
.lj-p h4{margin:0 0 6px;color:#ffd166;font-size:14px}.lj-ch{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}
.lj-ch button{min-height:28px;padding:2px 9px;border-radius:999px;border:1px solid #3b5878;background:#16233a;color:#dfe8f5;cursor:pointer;font:12px 'Segoe UI',Arial,sans-serif}
.lj-ch button[aria-pressed=true]{background:#5a4512;border-color:#ffd166;color:#fff3c4}
.lj-p input[type=text]{width:100%;box-sizing:border-box;margin:4px 0;padding:5px 8px;border-radius:7px;border:1px solid #3b5878;background:#0e1626;color:#e8eefc}
.lj-it{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px;max-height:220px;overflow:auto;margin-top:6px}
.lj-it label{display:flex;gap:6px;align-items:center;font-size:12px;padding:3px 6px;border-radius:6px;background:rgba(255,255,255,.04);margin:0}
.lj-it label.fora{opacity:.5}.lj-it input{width:auto}
#ljPainel{position:fixed;z-index:9003;right:16px;top:90px;width:min(520px,calc(100vw - 24px));max-height:78vh;overflow:auto;padding:12px;border-radius:12px;background:rgba(9,15,29,.98);border:1px solid #ffd166;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.55)}
#ljPainel[hidden]{display:none}#ljPainel h3{margin:0 0 8px;color:#ffd166;display:flex;gap:6px;align-items:center;cursor:move}#ljPainel h3 span{flex:1}
#ljPainel .lj-l{display:grid;grid-template-columns:1fr;gap:6px}#ljPainel .lj-c{padding:7px 9px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid #2a3c58}
#ljPainel .lj-c b{color:#fff}#ljPainel small{color:#9fb3cc}
#ljBotao{min-width:34px;height:32px;border-radius:9px;border:1px solid #ffd166;background:rgba(32,24,6,.94);color:#ffe9a8;cursor:pointer;font-size:16px}`;
 if(!root.getElementById('ljCss')){const st=root.createElement('style');st.id='ljCss';st.textContent=CSS;root.head.append(st);}
 const chips=(cfg)=>ORDEM_RAMOS.map(r=>`<button type="button" data-ramo="${r}" aria-pressed="${(cfg.ramos||[]).includes(r)}" title="${esc(RAMOS[r].nome)}">${RAMOS[r].ic} ${esc(RAMOS[r].nome)}</button>`).join('');
 // painel dentro da tela de comércio
 let buscaPainel='';
 function painel(host,m){
  if(!ehMestre()||!host)return;const d=tokenDaLoja(m?.id);if(!d)return;
  const cfg=lojaDoToken(d,metaDe(d))||{ramos:[]},todos=itens(),est=new Set(estoqueDaLoja(cfg,todos));
  const box=root.createElement('div');box.className='lj-p';
  const desenhar=(filtro='')=>{
   const f=sem(filtro),lista=todos.filter(i=>i?.id&&(!f||sem(`${i.nome} ${i.categoria}`).includes(f))).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR')).slice(0,160);
   box.innerHTML=`<h4>🧾 O que este comerciante vende (só o mestre vê)${cfg.padrao?' · <small>padrão</small>':''}</h4>
    <div class="lj-ch">${chips(cfg)}</div>
    <input type="text" data-nome placeholder="Nome da loja (opcional): ${esc(nomeDaLoja({...cfg,nome:''}))}" value="${esc(cfg.nome||'')}">
    <label style="display:flex;gap:6px;align-items:center;font-size:12px;margin:2px 0"><input type="checkbox" data-mil ${cfg.militares?'checked':''} style="width:auto"> vende também itens de acesso Militar</label>
    <input type="text" data-busca placeholder="🔎 Procurar item para pôr ou tirar à mão…" value="${esc(filtro)}">
    <div class="lj-it">${lista.map(i=>`<label class="${est.has(String(i.id))?'':'fora'}"><input type="checkbox" data-item="${esc(i.id)}" ${est.has(String(i.id))?'checked':''}><span>${esc(i.nome)} <small>· ${esc(i.categoria||'')} · ${Number(i.preco||0)}</small></span></label>`).join('')}</div>`;
  };
  desenhar(buscaPainel);
  const salvarJa=async()=>{try{await gravar(d,cfg);cfg.padrao=false;try{win.renderComercioCenarioV73Publico_?.(m.id);}catch(_){}}catch(e){console.warn('[Lojas]',e);}};
  box.addEventListener('click',e=>{const b=e.target.closest('[data-ramo]');if(!b)return;const r=b.dataset.ramo,s=new Set(cfg.ramos||[]);s.has(r)?s.delete(r):s.add(r);cfg.ramos=[...s];void salvarJa();});
  box.addEventListener('change',e=>{const t=e.target;
   if(t.dataset.item!==undefined){const id=t.dataset.item,inc=new Set(cfg.incluir||[]),exc=new Set(cfg.excluir||[]);if(t.checked){exc.delete(id);inc.add(id);}else{inc.delete(id);exc.add(id);}cfg.incluir=[...inc];cfg.excluir=[...exc];if(!cfg.ramos)cfg.ramos=[];void salvarJa();}
   else if(t.dataset.nome!==undefined){cfg.nome=t.value.trim();void salvarJa();}
   else if(t.dataset.mil!==undefined){cfg.militares=t.checked;void salvarJa();}});
  let tm=null;box.addEventListener('input',e=>{if(e.target.dataset.busca===undefined)return;clearTimeout(tm);const v=e.target.value;buscaPainel=v;tm=setTimeout(()=>{desenhar(v);const i=box.querySelector('[data-busca]');i?.focus();i?.setSelectionRange(v.length,v.length);},250);});
  host.append(box);
 }
 // lista de todos os comerciantes do mapa (botão 🧾)
 let painelL=null,botao=null;
 const mapaVisto=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 function comerciantesDoMapa(){
  const mid=mapaVisto();
  return (ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===mid).map(t=>{const d=decodeURIComponent(String(t.id));if(!d.startsWith('syncnpc:'))return null;
   let base=null;try{base=win.mesaComerciantePorTokenBase_?.(t.id)||null;}catch(_){}const cfg=lojaDoToken(d,metaDe(d));if(!cfg&&!base)return null;return {t,d,cfg,base};}).filter(Boolean);
 }
 function desenharLista(){
  if(!painelL||painelL.hidden)return;
  const lista=comerciantesDoMapa();
  painelL.innerHTML=`<h3><span>🧾 Comerciantes deste mapa</span><button type="button" class="btn-small" data-x title="Fechar">✕</button></h3>
   <small>Clique nos ramos para escolher o que cada um vende. Feira grande: um vendedor para cada coisa. Para pôr ou tirar itens um a um, abra a loja do comerciante.</small>
   <div class="lj-l" style="margin-top:8px">${lista.map(({t,d,cfg,base})=>`<div class="lj-c" data-tok="${esc(d)}"><b>${esc(nomeVisivel(t.id,String(t.nome||'').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,'')))}</b> <small>· ${cfg?esc(nomeDaLoja(cfg))+(cfg.padrao?' (padrão)':''):'estoque do banco ('+((base?.estoqueIds||[]).length)+' itens)'}</small>
    <div class="lj-ch">${chips(cfg||{ramos:[]})}</div></div>`).join('')||'<small>Nenhum comerciante neste mapa.</small>'}</div>`;
 }
 function abrirLista(){
  if(!painelL){painelL=root.createElement('div');painelL.id='ljPainel';painelL.hidden=true;root.body.append(painelL);
   painelL.addEventListener('pointerdown',e=>e.stopPropagation());
   painelL.addEventListener('click',async e=>{if(e.target.closest('[data-x]')){painelL.hidden=true;return;}
    const b=e.target.closest('[data-ramo]'),c=e.target.closest('[data-tok]');if(!b||!c)return;const d=c.dataset.tok,cfg={...(lojaDoToken(d,metaDe(d))||{ramos:[]})};const s=new Set(cfg.ramos||[]);s.has(b.dataset.ramo)?s.delete(b.dataset.ramo):s.add(b.dataset.ramo);cfg.ramos=[...s];delete cfg.padrao;
    try{await gravar(d,cfg);}catch(err){console.warn('[Lojas]',err);}desenharLista();});
   arrastavel(painelL);}
  painelL.hidden=!painelL.hidden;desenharLista();
 }
 function arrastavel(el){let ini=null;el.addEventListener('pointerdown',e=>{if(!e.target.closest('h3')||e.target.closest('button'))return;const r=el.getBoundingClientRect();ini={dx:e.clientX-r.left,dy:e.clientY-r.top};el.setPointerCapture?.(e.pointerId);});
  el.addEventListener('pointermove',e=>{if(!ini)return;el.style.left=Math.max(0,e.clientX-ini.dx)+'px';el.style.top=Math.max(0,e.clientY-ini.dy)+'px';el.style.right='auto';});el.addEventListener('pointerup',()=>{ini=null;});}
 function garantirBotao(){
  if(!ehMestre()){botao?.remove();botao=null;return;}
  if(!root.getElementById('novaSyncBoard'))return;
  if(!botao||!botao.isConnected){botao=root.createElement('button');botao.type='button';botao.id='ljBotao';botao.textContent='🧾';botao.title='O que cada comerciante deste mapa vende';botao.addEventListener('click',abrirLista);(root.getElementById('mbTopo')?.querySelector('[data-g=esq]')||root.body).append(botao);}
 }
 // a tela de comércio é redesenhada por várias versões antigas: o painel do mestre entra sempre que ela muda
 let ultimaLoja='',obsLoja=null;
 function vigiarLoja(){
  const ab=win.abrirComercioCenarioV73_;if(typeof ab==='function'&&!ab.__lj){const novo=function(id){ultimaLoja=String(id||'');
   // v171: concessionária/estaleiro
   try{const d=tokenDaLoja(id);if(d){const cfg=lojaDoToken(d,metaDe(d));const v=(cfg?.ramos||[]).map(r=>RAMOS[r]?.vitrine).find(Boolean);if(v&&win.mesaConcessionariaV171?.abrir){win.mesaConcessionariaV171.abrir(v,nomeDaLoja(cfg));return;}}}catch(_){}
   return ab.apply(this,arguments);};novo.__lj=true;win.abrirComercioCenarioV73_=novo;}
  const host=root.getElementById('cenarioComercioConteudoV73');if(!host||obsLoja?.__host===host)return;
  obsLoja?.disconnect();obsLoja=new win.MutationObserver(()=>{if(ehMestre()&&ultimaLoja.startsWith('loja:')&&!host.querySelector('.lj-p')&&host.firstChild)try{painel(host,{id:ultimaLoja});}catch(e){console.warn('[Lojas] painel',e);}});
  obsLoja.__host=host;obsLoja.observe(host,{childList:true});
  if(ehMestre()&&ultimaLoja.startsWith('loja:')&&!host.querySelector('.lj-p')&&host.firstChild)try{painel(host,{id:ultimaLoja});}catch(_){}
 }
 const vigia=setInterval(()=>{try{garantirBotao();vigiarLoja();}catch(e){console.warn('[Lojas]',e);}},700);
 win.mesaLojasV163={paraToken,porId,painel,gravar,abrirLista,RAMOS};
 return {parar(){clearInterval(vigia);botao?.remove();painelL?.remove();}};
}
