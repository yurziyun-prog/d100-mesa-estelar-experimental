// Mesa Estelar v110 — Gerador de mapas (painel do mestre).
//
// Botão 🗺️ nas ferramentas do mapa: escolhe o tipo, gera, vê a prévia e salva — direto
// no Banco de Mapas, sem arquivo. Também preenche os mapas vazios ligados a cenários.
// Paredes e obstáculos são gravados como cena da mesa (bloqueiam movimento e visão).

import {TIPOS_MAPA,TAMANHOS,gerarMapa,sugerirTipo,resumoMapa,ESTILOS,sugerirEstilo} from './mesa-gerador-mapas.js?v=141';
import {prepararPublicacaoOficina} from './nova-oficina.js?v=201';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const LIMITE_CENA=650000; // bytes: acima disso salva só o desenho (sem colisão das formas)

export function limites(e){
 if(e.type==='path'){const pts=e.points||[],m=(Number(e.strokeWidthM)||.5)/2;const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  if(!pts.length)return {x:0,y:0,w:.1,h:.1};const x=Math.min(...xs)-m,y=Math.min(...ys)-m;return {x,y,w:Math.max(...xs)+m-x,h:Math.max(...ys)+m-y};}
 return {x:Number(e.x)||0,y:Number(e.y)||0,w:Math.max(.05,Number(e.w)||1),h:Math.max(.05,Number(e.h)||1)};
}
// Cena da mesa a partir do estado da Oficina (mesma conversão da "Oficina na mesa").
export function cenaDoEstado(state,mapId){
 const pub=prepararPublicacaoOficina(state,null,limites);
 return {mapId:String(mapId),objetoSchema:1,objects:pub.objects,oficinaConfig:pub.config,oficinaErasers:pub.erasers,offsets:{},strokes:[],hiddenElements:[],objetosMapaImportados:true,editorRevision:1};
}
// Mapas em partes (partes-v1) só têm o cabeçalho na lista: o tamanho serializado diz se há desenho.
export const mapaVazio=m=>{
 if(!m||m.__carregando)return false;
 if(m.formato==='partes-v1'&&!m.oficina2State&&!m.objetos)return Number(m.tamanhoSerializado||0)>0&&Number(m.tamanhoSerializado)<120;
 return !((m.oficina2State?.elements||[]).length)&&!((m.objetos||[]).length)&&!((m.desenhos||[]).length)&&!((m.mesaScene?.objects||[]).length);
};

const ESTILO=`
#mgModal{position:fixed;inset:0;z-index:10002;background:rgba(3,6,14,.72);display:flex;align-items:center;justify-content:center;padding:12px}
#mgModal[hidden],#mgModal [hidden]{display:none!important}
#mgModal .mg-caixa{width:min(1180px,100%);max-height:calc(100vh - 24px);overflow:auto;background:#101828;border:1px solid #49668a;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;padding:14px;box-shadow:0 18px 50px rgba(0,0,0,.6)}
#mgModal .mg-topo{display:flex;align-items:center;gap:8px;margin-bottom:10px}
#mgModal .mg-topo h3{margin:0;flex:1;color:#8ee7ff;font-size:15px}
#mgModal .mg-grade{display:grid;grid-template-columns:260px 1fr;gap:14px}
@media (max-width:760px){#mgModal .mg-grade{grid-template-columns:1fr}}
#mgModal label{display:block;margin:8px 0 3px;color:#9fb3cc;font-size:12px}
#mgModal select,#mgModal input{width:100%;box-sizing:border-box}
#mgModal .mg-linha{display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap}
#mgModal .mg-linha>*{flex:1}
#mgModal .mg-previa{aspect-ratio:2/1;background:#0a0f1a;border:1px solid #2f4664;border-radius:10px;overflow:hidden;display:grid;place-items:center;color:#6f86a6}
#mgModal .mg-previa svg{width:100%;height:100%;display:block}
#mgModal .mg-st{min-height:1.3em;color:#c6d3e6;margin-top:8px;white-space:pre-line}
#mgModal .mg-vazios{margin-top:14px;border-top:1px solid rgba(255,255,255,.08);padding-top:10px}
#mgModal .mg-vazio{display:flex;gap:6px;align-items:center;padding:6px 8px;border-radius:9px;background:rgba(255,255,255,.04);margin:5px 0}
#mgModal .mg-vazio b{flex:1 1 40%;min-width:0}
#mgModal .mg-vazio select{flex:1 1 45%;width:auto}
`;

export function instalarGeradorMapas(dep){
 const root=dep.root||document;
 const api=()=>dep.api?.()||null;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 if(!root.getElementById('mgCssV110')){const st=root.createElement('style');st.id='mgCssV110';st.textContent=ESTILO;root.head.append(st);}
 let modal=null,atual=null,alvo=null,ocupado=false;

 function instalarBotao(){
  if(!ehMestre())return;
  const barra=root.querySelector('#sincronizacao-nova .nova-view-tools');if(!barra||root.getElementById('mgBotao'))return;
  const b=root.createElement('button');b.type='button';b.id='mgBotao';b.className='btn-small';b.textContent='🗺️';b.title='Gerador de mapas: esgoto, caverna, floresta, cidade, interior, arena…';
  b.addEventListener('click',()=>abrir());barra.append(b);
 }
 function abrir(){
  if(!modal){modal=root.createElement('div');modal.id='mgModal';root.body.append(modal);montar();}
  modal.hidden=false;desenharVazios();
 }
 function montar(){
  const tipos=Object.entries(TIPOS_MAPA).map(([k,t])=>`<option value="${k}">${t.nome}</option>`).join('');
  modal.innerHTML=`<div class="mg-caixa"><div class="mg-topo"><h3>🗺️ Gerador de mapas</h3><button type="button" class="btn-small" data-x title="Fechar">✕</button></div>
   <div class="mg-grade"><div>
    <label>Tipo de lugar</label><select data-tipo>${tipos}</select>
    <label>Estilo (v129)</label><select data-estilo><option value="">— padrão —</option>${Object.entries(ESTILOS).map(([k,e])=>`<option value="${k}">${e.nome}</option>`).join('')}</select>
    <label>Tamanho</label><select data-tam>${TAMANHOS.map(([w,h],i)=>`<option value="${i}">${w} × ${h} m</option>`).join('')}</select>
    <label>Semente (o mesmo número gera o mesmo mapa)</label><div class="mg-linha" style="margin:0"><input type="number" data-sem placeholder="aleatória"><button type="button" class="btn-small" data-dado title="Nova semente" style="flex:none">🎲</button></div>
    <label>Nome do mapa</label><input type="text" data-nome placeholder="Ex.: Esgoto da Rua 9">
    <div class="mg-linha"><button type="button" class="btn-small btn-select" data-gerar>🎲 Gerar</button></div>
    <div class="mg-linha"><button type="button" class="btn-small" data-salvar disabled>💾 Salvar como mapa novo</button></div>
    <div class="mg-linha" data-linha-alvo hidden><button type="button" class="btn-small btn-select" data-preencher disabled>📌 Preencher o mapa escolhido</button></div>
    <div class="mg-st" data-st></div>
   </div><div>
    <div class="mg-previa" data-previa>Escolha o tipo e clique em Gerar.</div>
    <div data-resumo style="color:#9fb3cc;margin-top:6px"></div>
    <div class="mg-vazios" data-vazios></div>
   </div></div></div>`;
  const $=q=>modal.querySelector(q);
  $('[data-x]').addEventListener('click',()=>{modal.hidden=true;});
  modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
  $('[data-dado]').addEventListener('click',()=>{$('[data-sem]').value=String(Math.floor(Math.random()*1e6));gerar();});
  $('[data-gerar]').addEventListener('click',()=>gerar());
  $('[data-salvar]').addEventListener('click',()=>salvar(null));
  $('[data-preencher]').addEventListener('click',()=>alvo&&salvar(alvo));
 }
 const st=t=>{const e=modal?.querySelector('[data-st]');if(e)e.textContent=t||'';};
 function gerar(opcoes={}){
  const $=q=>modal.querySelector(q);
  const tipo=opcoes.tipo||$('[data-tipo]').value,[w,h]=opcoes.tamanho||TAMANHOS[Number($('[data-tam]').value)||0];
  const semTxt=$('[data-sem]').value.trim(),sem=semTxt===''?null:semTxt;
  const nome=opcoes.nome??$('[data-nome]').value.trim();
  try{
   const estilo=opcoes.estilo??($('[data-estilo]')?.value||sugerirEstilo(nome));
   atual=gerarMapa({tipo,largura:w,altura:h,semente:sem,objetos:api()?.objetos?.()||[],nome,estilo});
   if(!semTxt)$('[data-sem]').value=String(atual.geradoV110.semente);
   const svg=api()?.render?.(atual)||'';
   $('[data-previa]').innerHTML=svg||'(sem prévia)';const s=$('[data-previa] svg');if(s){s.setAttribute('preserveAspectRatio','xMidYMid meet');}
   const r=resumoMapa(atual);$('[data-resumo]').textContent=`${TIPOS_MAPA[tipo].nome} · ${w}×${h} m · ${r.paredes} paredes/obstáculos · ${r.objetos} objetos do banco · ${r.formas} detalhes`;
   $('[data-salvar]').disabled=false;$('[data-preencher]').disabled=!alvo;st('');
  }catch(e){console.warn('[Gerador de mapas]',e);st('⚠️ '+(e?.message||e));}
 }
 async function salvar(idAlvo){
  if(!atual||ocupado)return;const $=q=>modal.querySelector(q);
  const base=idAlvo?(api()?.mapas?.()||[]).find(m=>String(m.id)===String(idAlvo)):null;
  const nome=base?.nome||$('[data-nome]').value.trim()||atual.name;
  if(!nome)return st('Dê um nome ao mapa.');
  if(base&&!mapaVazio(base)&&!root.defaultView.confirm(`“${nome}” já tem desenho. Substituir pelo mapa gerado?`))return;
  ocupado=true;st('Salvando…');
  try{
   const estado={...atual,name:nome};
   const r=await api().salvar({id:base?.id||null,nome,state:estado,cenaDe:(id)=>{const c=cenaDoEstado(estado,id);return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
   st(`✅ “${nome}” salvo${r?.comCena?' (paredes bloqueiam movimento e visão)':' (só o desenho: mapa grande demais para a cena)'}. Escolha-o no seletor de mapas da mesa.`);
   alvo=null;$('[data-linha-alvo]').hidden=true;desenharVazios();
  }catch(e){console.warn('[Gerador de mapas] salvar',e);st('⚠️ Não foi possível salvar: '+(e?.code||e?.message||e));}
  ocupado=false;
 }
 function desenharVazios(){
  const caixa=modal?.querySelector('[data-vazios]');if(!caixa)return;
  const vazios=(api()?.mapas?.()||[]).filter(m=>mapaVazio(m)&&(String(m.id).startsWith('cenario_')||m.cenarioId));
  caixa.innerHTML=`<b style="color:#8ee7ff">Mapas vazios (${vazios.length})</b><div style="color:#9fb3cc;margin:4px 0">Mapas criados para cenários mas ainda sem desenho. Gere um mapa para cada um com o tipo sugerido.</div>
   ${vazios.map(m=>{const t=sugerirTipo(m.nome||m.id);return `<div class="mg-vazio"><b>${esc(m.nome||m.id)}</b><select data-vt="${esc(m.id)}">${Object.entries(TIPOS_MAPA).map(([k,x])=>`<option value="${k}"${k===t?' selected':''}>${x.nome}</option>`).join('')}</select><button type="button" class="btn-small" data-ver="${esc(m.id)}" title="Gerar prévia para este mapa">👁️</button></div>`;}).join('')||'<div style="color:#9fb3cc">Nenhum. 🎉</div>'}
   ${vazios.length?`<div class="mg-linha"><button type="button" class="btn-small btn-select" data-todos>🗺️ Gerar e salvar todos (${vazios.length})</button></div>`:''}`;
  caixa.querySelectorAll('[data-ver]').forEach(b=>b.addEventListener('click',()=>{
   const m=vazios.find(x=>String(x.id)===b.dataset.ver);if(!m)return;alvo=m.id;
   modal.querySelector('[data-tipo]').value=caixa.querySelector(`[data-vt="${CSS.escape(m.id)}"]`).value;
   modal.querySelector('[data-nome]').value=m.nome||m.id;modal.querySelector('[data-sem]').value='';
   const i=TAMANHOS.findIndex(([w,h])=>w===Number(m.larguraM)&&h===Number(m.alturaM));if(i>=0)modal.querySelector('[data-tam]').value=String(i);
   modal.querySelector('[data-linha-alvo]').hidden=false;gerar();
   modal.querySelector('[data-preencher]').textContent=`📌 Preencher “${m.nome||m.id}”`;
  }));
  caixa.querySelector('[data-todos]')?.addEventListener('click',async e=>{
   if(ocupado)return;if(!root.defaultView.confirm(`Gerar e salvar ${vazios.length} mapa(s) com os tipos escolhidos?`))return;
   e.currentTarget.disabled=true;let n=0;
   for(const m of vazios){
    const tipo=caixa.querySelector(`[data-vt="${CSS.escape(m.id)}"]`)?.value||sugerirTipo(m.nome);
    const i=TAMANHOS.findIndex(([w,h])=>w===Number(m.larguraM)&&h===Number(m.alturaM));
    modal.querySelector('[data-sem]').value='';
    gerar({tipo,nome:m.nome||m.id,tamanho:i>=0?TAMANHOS[i]:TAMANHOS[0]});
    try{await salvar(m.id);n++;}catch(_){}
   }
   st(`✅ ${n} mapa(s) preenchido(s).`);desenharVazios();
  });
 }
 const vigia=setInterval(()=>{try{instalarBotao();}catch(e){console.warn('[Gerador de mapas]',e);}},2000);
 return {abrir,gerar:o=>{abrir();gerar(o);return atual;},parar:()=>clearInterval(vigia)};
}
