// Mesa Estelar v205 — Barra do mapa mais clara: (1) cada botão só-ícone ganha um nome curto ao lado (tirado do próprio título do botão), (2) os botões raros ficam recolhidos em
// "⋯ Mais" (nada é apagado: um clique mostra tudo de volta) e (3) "❓ Ajuda" lista TODOS os botões e o que cada um faz. Só aparência: nenhuma função muda, e se falhar a barra fica como era.
export const RAROS_ID=['elPanoramico','ljBotao','mlGeral','cpBotao','moSoltar','moTodos'];
export const RAROS_TITULO=/^(Desenhar ao vivo|Cor do desenho|Desfazer seu último desenho|Apagar seus desenhos)/i;
/** nome curto a partir do título do botão ("Colocar no mapa: criaturas…" → "Colocar") */
export const ROTULO_FIXO={ljBotao:'Lojas',miBotao:'Local',efSom:'Som',elPanoramico:'Panorâmico',mesaVisualBotao:'Visual',msBotao:'Sessão',mdBotao:'Diretor',moTodos:'Interativos'};
export function rotuloDoTitulo(t){
 const base=String(t||'').split(/[:(—–.]/)[0].replace(/\s+/g,' ').trim();if(!base)return '';
 const ign=new Set(['de','do','da','dos','das','no','na','o','a','os','as','e','para','um','uma','ao','seu','seus','sua','suas','neste','nesta','deste','desta','que','cada','todos','ações']);
 const ps=base.split(' ').filter(p=>p);const cur=ps.slice(0,2);if(cur.length===2&&ign.has(cur[1].toLowerCase()))cur.pop();
 const r=cur.join(' ');return r.length>14?r.slice(0,13)+'…':r;
}
const SOEMOJI=/^[^A-Za-zÀ-ÿ0-9]{1,8}$/;
export function instalarBarraOrganizada(dep={}){
 const root=dep.root||document,win=root.defaultView||window;
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let mais=false;try{mais=win.localStorage?.getItem('mesa:barraMais')==='1';}catch(_){}
 const CSS=`#novaSyncBoard{--x:0}.mb-rotulado{width:auto!important;min-width:40px;padding-left:10px!important;padding-right:12px!important;gap:5px;display:inline-flex!important;align-items:center;justify-content:center;white-space:nowrap}
.mb-rotulado::after{content:attr(data-rotulo);font:600 12px 'Segoe UI',Arial,sans-serif;opacity:.92}
.mb-raro{display:none!important}body.mb-mais .mb-raro{display:revert!important}body.mb-mais .mb-rotulado.mb-raro{display:inline-flex!important}#mbFerramentasV264[open] .mb-raro{display:inline-flex!important}#mbFerramentasV264[open] input.mb-raro{display:inline-block!important}
#mbMais,#mbAjuda{height:36px;padding:0 12px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;white-space:nowrap}#mbMais[aria-pressed=true]{background:#22406a;color:#fff;border-color:#8ee7ff}
#mbAjudaPainel{position:fixed;inset:0;z-index:10060;background:rgba(3,7,16,.72);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:4vh 12px}
#mbAjudaPainel>div{width:min(680px,100%);background:#101a2c;color:#e8eefc;border:1px solid #8ee7ff;border-radius:14px;padding:16px 18px;font:14px/1.4 'Segoe UI',Arial,sans-serif}
#mbAjudaPainel h3{margin:0 0 8px;display:flex;align-items:center}#mbAjudaPainel h3 span{flex:1}#mbAjudaPainel button{padding:6px 10px;border-radius:8px;border:1px solid #3e5a8f;background:#16253f;color:#fff;cursor:pointer}
#mbAjudaPainel .ma-l{display:grid;grid-template-columns:150px 1fr;gap:8px;padding:6px 0;border-bottom:1px solid #1e3050}#mbAjudaPainel .ma-l b{font-size:13px}#mbAjudaPainel .ma-l span{color:#b8c8de;font-size:13px}#mbAjudaPainel .ma-r{color:#e8c37a;font-size:11px}`;
 const topo=()=>{const b=root.getElementById('novaSyncBoard');return b?.parentElement?.parentElement||null;};
 const lista=()=>{
  const b=root.getElementById('novaSyncBoard'),t=topo();if(!b||!t)return [];const lim=b.getBoundingClientRect().top+10;
  return [...t.querySelectorAll('button,input[type=color]')].filter(e=>!e.closest('#mbAjudaPainel,#hubTeste,#rfPainel,#amModal')&&e.id!=='mbMais'&&e.id!=='mbAjuda'&&e.getBoundingClientRect().top<lim&&(e.title||e.getAttribute('aria-label')));
 };
 const ROTULAVEIS_TITULO=/^(Colocar no mapa|Modo mestre|Atuar como|Retirar do mapa|Desenhar ao vivo|Desfazer seu|Apagar seus)/i;
 const rotuloBotao=e=>{if(!(ROTULO_FIXO[e.id]||ROTULAVEIS_TITULO.test(e.title||'')))return '';const tx=(e.textContent||'').trim();if(tx&&!SOEMOJI.test(tx))return '';if(/^(Mapa anterior|Próximo mapa)/i.test(e.title||''))return '';
  if(/^Modo mestre/i.test(e.title||''))return 'Mover tudo'; /* v205: o botão ✋ move qualquer coisa (menos o chão de fundo); o nome Modo mestre confundia */return ROTULO_FIXO[e.id]||rotuloDoTitulo(e.title||e.getAttribute('aria-label'));};
 const raro=e=>RAROS_ID.includes(e.id)||RAROS_TITULO.test(e.title||'');
 function aplicar(){
  if(!root.getElementById('mbOrgCss')){const st=root.createElement('style');st.id='mbOrgCss';st.textContent=CSS;root.head.append(st);}
  const bs=lista();if(!bs.length)return;
  for(const e of bs){
   const r=e.tagName==='BUTTON'?rotuloBotao(e):'';if(r&&e.dataset.rotulo!==r){e.dataset.rotulo=r;e.classList.add('mb-rotulado');}
   if(raro(e)&&!e.classList.contains('mb-raro'))e.classList.add('mb-raro');
  }
  const painelAvancado=root.querySelector('#mbFerramentasV264 [data-conteudo-avancado]');
  root.body.classList.toggle('mb-mais',mais&&!painelAvancado);
  const hab=bs.filter(raro).length;
  // v265: um único menu de recursos ocasionais, sem botões "Mais" duplicados.
  const ancora=painelAvancado||root.getElementById('moTodos')?.parentElement||bs.find(e=>e.id==='amBotao')?.parentElement||bs[bs.length-1].parentElement;
  if(painelAvancado){
   for(const e of bs.filter(raro))if(e.parentElement!==painelAvancado)painelAvancado.append(e);
   root.getElementById('mbMais')?.remove();
  }
  let bm=root.getElementById('mbMais');if(!bm){bm=root.createElement('button');bm.id='mbMais';bm.type='button';bm.addEventListener('pointerdown',e=>e.stopPropagation());bm.addEventListener('click',()=>{mais=!mais;try{win.localStorage?.setItem('mesa:barraMais',mais?'1':'0');}catch(_){}aplicar();});}
  let ba=root.getElementById('mbAjuda');if(!ba){ba=root.createElement('button');ba.id='mbAjuda';ba.type='button';ba.textContent='❓ Ajuda';ba.title='O que cada botão faz';ba.addEventListener('pointerdown',e=>e.stopPropagation());ba.addEventListener('click',abrirAjuda);}
  if(!painelAvancado&&bm.parentElement!==ancora)ancora.append(bm);
  if(ba.parentElement!==ancora)ancora.append(ba);
  bm.textContent=mais?'⋯ Menos':'⋯ Mais ('+hab+')';bm.setAttribute('aria-pressed',String(mais));bm.title=mais?'Esconder os botões pouco usados':'Mostrar os botões pouco usados ('+hab+' escondidos): desenho ao vivo, mapa geral, companheiros, lojas, panorâmico…';
 }
 function abrirAjuda(){
  root.getElementById('mbAjudaPainel')?.remove();const d=root.createElement('div');d.id='mbAjudaPainel';
  const todos=[...new Set([...(topo()?.querySelectorAll('button,input[type=color]')||[])])].filter(e=>!e.closest('#mbAjudaPainel,#hubTeste,#rfPainel,#amModal')&&e.id!=='mbMais'&&e.id!=='mbAjuda'&&(e.title||e.getAttribute('aria-label')));
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  d.innerHTML='<div><h3><span>❓ O que cada botão faz</span><button type="button" data-x>✕</button></h3><p style="color:#9fb3cc;font-size:13px;margin:0 0 6px">Lista tirada dos próprios botões da tela. Os marcados "pouco usado" ficam em ⋯ Mais.</p>'+
   todos.map(e=>{const ic=(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,18)||'🎨',tit=e.title||e.getAttribute('aria-label')||'';return `<div class="ma-l"><b>${esc(ic)} ${esc(e.dataset.rotulo||'')}</b><span>${esc(tit)}${raro(e)?' <span class="ma-r">· pouco usado</span>':''}</span></div>`;}).join('')+'</div>';
  root.body.append(d);d.addEventListener('pointerdown',e=>e.stopPropagation());d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-x]'))d.remove();});
 }
 const iv=setInterval(()=>{try{aplicar();}catch(e){console.warn('[Barra]',e);}},1200);iv.unref?.();
 const api={aplicar,lista,abrirAjuda,mais:()=>mais,parar:()=>clearInterval(iv)};win.mesaBarraOrganizada=api;return api;
}
