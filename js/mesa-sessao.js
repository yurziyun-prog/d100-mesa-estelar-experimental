// Mesa Estelar v115 — 🎬 Preparar a sessão.
//
// Um clique e cada cenário fica pronto para jogar:
//  1) mapa: se o cenário não tem mapa (ou o mapa está vazio), gera um do tipo certo e liga ao cenário;
//  2) testes: se o cenário não tem ações (investigar, examinar…), cria a partir dos "testes sugeridos"
//     do próprio cenário ou de um conjunto pronto para o tipo de lugar;
//  3) pontos: fixa cada ação num ponto do mapa, perto do objeto que combina (comporta perto da grade,
//     cama no quarto, cartaz na parede…). Ações que já têm ponto não são mexidas.
// Nada que já existe é apagado. Módulo à parte: se falhar, a mesa segue igual.

import {TIPOS_MAPA,gerarMapa,sugerirTipo,sugerirEstilo,ABERTOS} from './mesa-gerador-mapas.js?v=141';
import {cenaDoEstado,mapaVazio,LIMITE_CENA} from './mesa-mapas-ui.js?v=141';
import {linhaAcao,acaoDoPonto,RAIO_PADRAO} from './mesa-interacoes.js?v=156';
import {TESTES_PRONTOS,acoesDosTestesSugeridos,escolherPontos} from './mesa-sessao-dados.js?v=117';
import {TESTES_CENARIOS} from './mesa-sessao-cenarios.js?v=117';
const testesDoCenario=c=>TESTES_CENARIOS[String(c?.id||'').toUpperCase()]||TESTES_CENARIOS[String(c?.mapaId||'').replace(/^cenario_/i,'').toUpperCase()]||null;

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const caminhoPontos=id=>'combatesAtivos/mesaPontos_'+encodeURIComponent(String(id||''));
const ESTILO_MS=`
#msModal{position:fixed;inset:0;z-index:10003;background:rgba(3,6,14,.72);display:flex;align-items:center;justify-content:center;padding:12px}
#msModal[hidden]{display:none}
#msModal .ms-caixa{width:min(900px,100%);max-height:calc(100vh - 24px);display:flex;flex-direction:column;background:#101828;border:1px solid #49668a;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.6)}
#msModal .ms-topo{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
#msModal .ms-topo h3{margin:0;flex:1;color:#8ee7ff;font-size:15px}
#msModal .ms-corpo{overflow:auto;padding:8px 14px}
#msModal .ms-linha{display:grid;grid-template-columns:24px 1fr 190px 210px;gap:8px;align-items:center;padding:7px 8px;border-radius:10px;background:rgba(255,255,255,.035);margin:5px 0}
#msModal .ms-linha b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#msModal .ms-st{font-size:12px;color:#9fb3cc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#msModal .ms-st .ok{color:#57e3a1}#msModal .ms-st .falta{color:#ffd166}
#msModal .ms-rodape{display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px solid rgba(255,255,255,.08)}
#msModal .ms-log{flex:1;min-height:1.3em;color:#c6d3e6;white-space:pre-line;max-height:120px;overflow:auto;font-size:12px}
@media (max-width:720px){#msModal .ms-linha{grid-template-columns:24px 1fr}#msModal .ms-linha select,#msModal .ms-st{grid-column:2}}
`;

export function instalarSessao(dep){
 const root=dep.root||document;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const api=()=>dep.api?.()||null,mapasApi=()=>dep.mapasApi?.()||null;
 if(!root.getElementById('msCssV115')){const st=root.createElement('style');st.id='msCssV115';st.textContent=ESTILO_MS;root.head.append(st);}
 let modal=null,ocupado=false;

 const cenarios=()=>(api()?.cenarios?.()||[]).filter(c=>c?.id);
 const mapaDo=c=>c?.mapaId?(mapasApi()?.mapas?.()||[]).find(m=>String(m.id)===String(c.mapaId))||null:null;
 const tipoDo=c=>{const t=sugerirTipo([c.nome,c.tipo,c.local,c.descricaoJogadores,c.descricao].filter(Boolean).join(' '));return TIPOS_MAPA[t]?t:'cidade';};
 async function pontosDe(mapId){try{const s=await dep.getDoc(dep.doc(dep.db,...caminhoPontos(mapId).split('/')));return s.exists()?(s.data()?.pontos||[]):[];}catch(_){return [];}}

 async function situacao(c){
  const m=mapaDo(c),acoes=api()?.parse?.(c.interacoesTexto)||[];
  const pts=m?await pontosDe(m.id):[];
  const semPonto=acoes.filter(a=>!pts.some(p=>acaoDoPonto(p,[a])));
  return {m,vazio:!m||mapaVazio(m),acoes,pts,semPonto};
 }
 function txtSituacao(s){
  const mapa=!s.m?'<span class="falta">sem mapa</span>':s.vazio?'<span class="falta">mapa vazio</span>':'<span class="ok">🗺️ mapa</span>';
  const ac=s.acoes.length?`<span class="ok">🧭 ${s.acoes.length} teste(s)</span>`:'<span class="falta">sem testes</span>';
  const pt=s.acoes.length?(s.semPonto.length?`<span class="falta">📍 ${s.semPonto.length} sem ponto</span>`:'<span class="ok">📍 ok</span>'):'';
  return [mapa,ac,pt].filter(Boolean).join(' · ');
 }

 // ------------------------------------------------------------ preparar um cenário
 async function preparar(c,tipo,log){
  const ma=mapasApi();if(!ma?.salvar)throw Error('O gerador de mapas ainda não carregou.');
  let s=await situacao(c),estado=null,mapId=s.m?.id||c.mapaId||('cenario_'+c.id);
  // 1) mapa
  if(s.vazio){
   const W=Number(s.m?.larguraM)||28,H=Number(s.m?.alturaM)||14;
   const amplo=ABERTOS.has(tipo)&&W<=28;estado=gerarMapa({tipo,largura:amplo?56:[28,36,42,56,84].includes(W)?W:28,altura:amplo?28:[14,18,21,28,42].includes(H)?H:14,objetos:ma.objetos?.()||[],nome:c.nome||'',estilo:sugerirEstilo((c.nome||'')+' '+(c.local||''))});
   const r=await ma.salvar({id:mapId,nome:s.m?.nome||c.nome||mapId,state:estado,cenaDe:id=>{const cena=cenaDoEstado(estado,id);return JSON.stringify(cena).length<=LIMITE_CENA?cena:null;}});
   mapId=r.id;log(`🗺️ ${c.nome}: mapa ${TIPOS_MAPA[tipo]?.nome||tipo} gerado.`);
   if(String(c.mapaId||'')!==mapId){await api().salvarCenario(c.id,{mapaId:mapId});c.mapaId=mapId;}
  }
  // 2) testes
  let acoes=api()?.parse?.(c.interacoesTexto)||[];
  if(!acoes.length){
   const proprios=testesDoCenario(c),base=proprios?[]:acoesDosTestesSugeridos(c.testesSugeridos);
   const lista=proprios||(base.length?base:(TESTES_PRONTOS[tipo]||TESTES_PRONTOS.cidade));
   const txt=lista.map(linhaAcao).join('\n');
   await api().salvarCenario(c.id,{interacoesTexto:txt});c.interacoesTexto=txt;
   acoes=api().parse(txt);log(`🧭 ${c.nome}: ${acoes.length} teste(s) ${proprios?'escritos para este cenário':base.length?'dos testes sugeridos do cenário':'prontos para '+(TIPOS_MAPA[tipo]?.nome||tipo)}.`);
  }
  // 3) pontos no mapa
  const pts=await pontosDe(mapId),faltam=acoes.filter(a=>!pts.some(p=>acaoDoPonto(p,[a])));
  if(faltam.length){
   if(!estado){try{const h=await api().hidratarMapa(mapId);estado=h?.oficina2State||null;}catch(e){console.warn('[Sessão] mapa',e);}}
   const W=Number(estado?.w)||Number(mapaDo(c)?.larguraM)||28,H=Number(estado?.h)||Number(mapaDo(c)?.alturaM)||14;
   // a ação gerada guarda em "perto" onde deve ficar; para ações antigas usa o título
   const prontos=[...Object.values(TESTES_CENARIOS).flat(),...Object.values(TESTES_PRONTOS).flat()];
   const comPerto=faltam.map(a=>({...a,perto:prontos.find(p=>p.titulo===a.titulo)?.perto||[]}));
   const lugares=escolherPontos(comPerto,estado,{W,H});
   const novos=faltam.map((a,i)=>({id:'p'+Math.random().toString(36).slice(2,9),acaoId:String(a.id),titulo:String(a.titulo||''),icone:String(a.icone||'🔎'),x:Number((lugares[i].x*28/W).toFixed(3)),y:Number((lugares[i].y*14/H).toFixed(3)),raio:RAIO_PADRAO}));
   await dep.setDoc(dep.doc(dep.db,...caminhoPontos(mapId).split('/')),{pontos:[...pts,...novos],mapId,atualizadoEm:new Date().toISOString()});
   log(`📍 ${c.nome}: ${novos.length} ponto(s) de teste fixado(s) no mapa.`);
  }
  return true;
 }

 // ------------------------------------------------------------ tela
 function abrir(){
  if(!modal){modal=root.createElement('div');modal.id='msModal';modal.hidden=true;root.body.append(modal);
   modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-x]'))modal.hidden=true;else if(e.target.closest('[data-ok]'))void executar();else if(e.target.closest('[data-todos]'))modal.querySelectorAll('[data-c]').forEach(k=>{k.checked=true;});});}
  modal.hidden=false;void desenhar();
 }
 async function desenhar(){
  const lista=cenarios().sort((a,b)=>String(a.nome||a.id).localeCompare(String(b.nome||b.id),'pt'));
  modal.innerHTML=`<div class="ms-caixa"><div class="ms-topo"><h3>🎬 Preparar a sessão</h3><button type="button" class="btn-small" data-x title="Fechar">✕</button></div>
   <div class="ms-corpo"><div style="color:#9fb3cc;margin:4px 0 8px">Para cada cenário marcado: gera o mapa se estiver faltando, cria testes prontos (investigar, examinar…) se não houver nenhum e fixa cada teste num ponto do mapa. Nada que já existe é apagado.</div>
   ${lista.map(c=>`<div class="ms-linha" data-linha="${esc(c.id)}"><input type="checkbox" data-c="${esc(c.id)}"><b title="${esc(c.nome||c.id)}">${esc(c.nome||c.id)}</b><select data-t="${esc(c.id)}" title="Tipo de lugar (para o mapa e os testes)">${Object.entries(TIPOS_MAPA).map(([k,t])=>`<option value="${k}"${k===tipoDo(c)?' selected':''}>${t.nome}</option>`).join('')}</select><span class="ms-st" data-s="${esc(c.id)}">verificando…</span></div>`).join('')||'<div style="color:#9fb3cc">Nenhum cenário no banco.</div>'}
   </div><div class="ms-rodape"><div class="ms-log" data-log></div><button type="button" class="btn-small" data-todos>Marcar todos</button><button type="button" class="btn-small btn-select" data-ok>🎬 Preparar marcados</button></div></div>`;
  for(const c of lista){const s=await situacao(c).catch(()=>null);const el=modal.querySelector(`[data-s="${CSS.escape(String(c.id))}"]`);if(!el||!s)continue;el.innerHTML=txtSituacao(s);
   const falta=s.vazio||!s.acoes.length||s.semPonto.length;const ck=modal.querySelector(`[data-c="${CSS.escape(String(c.id))}"]`);if(ck)ck.checked=!!falta;}
 }
 async function executar(){
  if(ocupado)return;ocupado=true;const lg=modal.querySelector('[data-log]'),log=t=>{lg.textContent+=(lg.textContent?'\n':'')+t;lg.scrollTop=1e6;};lg.textContent='';
  const b=modal.querySelector('[data-ok]');b.disabled=true;let n=0;
  for(const ck of [...modal.querySelectorAll('[data-c]:checked')]){
   const c=cenarios().find(x=>String(x.id)===ck.dataset.c);if(!c)continue;const tipo=modal.querySelector(`[data-t="${CSS.escape(String(c.id))}"]`)?.value||tipoDo(c);
   try{await preparar(c,tipo,log);n++;const s=await situacao(c);const el=modal.querySelector(`[data-s="${CSS.escape(String(c.id))}"]`);if(el)el.innerHTML=txtSituacao(s);ck.checked=false;}
   catch(e){console.warn('[Sessão]',c.id,e);log(`⚠️ ${c.nome||c.id}: ${e?.code||e?.message||e}`);}
  }
  log(`✅ ${n} cenário(s) prontos. Troque de mapa pela barra e jogue.`);b.disabled=false;ocupado=false;
 }
 function instalarBotao(){
  if(!ehMestre()||root.getElementById('msBotao'))return;
  const alvo=root.querySelector('#mbBarra [data-extras]')||root.querySelector('#sincronizacao-nova .nova-view-tools');if(!alvo)return;
  const b=root.createElement('button');b.type='button';b.id='msBotao';b.className='btn-small mb-b';b.textContent='🎬';b.title='Preparar a sessão: mapas, testes e pontos de cada cenário';
  b.addEventListener('click',abrir);alvo.append(b);
 }
 const vigia=setInterval(()=>{try{instalarBotao();}catch(e){console.warn('[Sessão]',e);}},1500);
 return {abrir,preparar,parar:()=>clearInterval(vigia)};
}
