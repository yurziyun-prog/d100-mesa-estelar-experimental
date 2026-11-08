// Mesa Estelar v206 — 🗓️ Sessão pronta (preparação rápida para a mesa de amanhã).
//
// Painel do mestre (botão 🗓️ na barra de ferramentas) que confere e prepara, com um clique e de forma
// idempotente, a estrutura da sessão: os cinco mapas principais ligados entre si (Palácio de Ilü-Mus-Ki,
// Cidade, Espaço-porto, Cidade em ruínas + Masmorra, Theriom), comerciantes na cidade, história pronta
// (NPCs, missões, criaturas da noite) e tesouros recheados nos mapas de cenário.
//
// • 🚪 Entrada automática: as saídas (portas) entre os mapas da sessão passam a valer "andar e entrar" —
//   chegou perto da porta com o personagem, a mesa leva você para o mapa interno sozinha (mesmo pedido
//   oficial de viagem usado pelo botão 🚶 da saída). Inspiração: transição direta porta → interior.
// • Tudo usa APIs oficiais já existentes (Estrutura v190, Recheio, Roteiros v181, Comerciantes v141,
//   Ligações v205, Masmorra v184). Módulo à parte: se falhar, o jogo segue igual.

(function(){
'use strict';
// v218: o app é montado e às vezes avaliado fora do navegador (testes de importação/CSV).
// Sem DOM não há painel para montar; sair aqui evita quebrar a carga do restante do app.
if(typeof document==='undefined')return;
const SEM=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LIGACOES_PATH='combatesAtivos/mesaLigacoes';
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
const MARCA='combatesAtivos/mesaSessaoV206';

// ---------------------------------------------------------------- os cinco mapas da sessão
const MAPAS_SESSAO=[
 {chave:'palacio',rotulo:'🏛️ Palácio de Ilü-Mus-Ki',ids:['v145_residencia_ilu','v95_residencia_ilu'],re:/residencia|palaci|palácio|mus.?ki/},
 {chave:'cidade',rotulo:'🏙️ Cidade (Ruas e Praça)',ids:['v145_praca_cidade_alta','cenario_c002'],re:/praça da cidade|ruas escavadas|cenario_c002/},
 {chave:'porto',rotulo:'🚀 Espaço-porto',ids:['v138_espacoporto'],re:/espa[cç]o.?porto|espacoporto/},
 {chave:'ruinas',rotulo:'🏜️ Cidade em ruínas',ids:['cidade_sem_nome_20261013'],re:/cidade sem nome|sem.?nome/},
 {chave:'theriom',rotulo:'🌴 Theriom',ids:['therion_arte_20261013','therion_oficina_20261013'],re:/therion|theriom/},
];
const ID_MASMORRA='v184_masmorra';
const mapasTodos=()=>{try{return (typeof mapasDB!=='undefined'?mapasDB:[])||[];}catch(_){return [];}};
const npcsTodos=()=>{try{return (typeof npcsDB!=='undefined'?npcsDB:[])||[];}catch(_){return [];}};
const ehMestre=()=>{try{return typeof batalhaEhMestre_==='function'?!!batalhaEhMestre_():(typeof userData!=='undefined'&&!!userData&&userData.role==='mestre');}catch(_){return false;}};
const meuUid=()=>{try{return String(typeof currentUserUid!=='undefined'?currentUserUid||'':'');}catch(_){return '';}};
const ctl=()=>{try{return window.novaSyncController_||null;}catch(_){return null;}};

function resolverMapa(def){
 const ms=mapasTodos();
 for(const id of def.ids){const m=ms.find(x=>String(x.id)===id);if(m)return m;}
 return ms.find(m=>def.re.test(SEM((m.nome||'')+' '+(m.id||''))))||null;
}
const mapaSessao=()=>{const out={};for(const d of MAPAS_SESSAO)out[d.chave]=resolverMapa(d);out.masmorra=mapasTodos().find(m=>String(m.id)===ID_MASMORRA)||mapasTodos().find(m=>/masmorra/i.test(String(m.nome||'')))||null;return out;};

// ---------------------------------------------------------------- utilidades de banco
async function getDoc_(p){try{return await getDoc(doc(db,p));}catch(e){console.warn('[Sessão]',e);return {exists:()=>false,data:()=>null};}}
async function setDoc_(p,d,op){try{return await setDoc(doc(db,p),d,op);}catch(e){console.warn('[Sessão]',e);throw e;}}

// ---------------------------------------------------------------- interface (só o mestre vê o botão)
let painel=null,logEl=null,statusEl=null,tentativasBotao=0;
const ESTILO=`
#ssBtn{border:1px solid #ffd98a;background:#241c08;color:#ffe9b8;border-radius:8px;cursor:pointer;padding:4px 9px;font:600 12.5px 'Segoe UI',Arial,sans-serif}
#ssBtn:hover{background:#33270c}
#ssPainel{position:fixed;right:12px;top:64px;z-index:10030;width:min(430px,calc(100vw - 24px));max-height:calc(100vh - 90px);overflow:auto;box-sizing:border-box;padding:12px 14px;border-radius:14px;background:#0e1322;border:1px solid #ffd98a;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 16px 50px #000d}
#ssPainel[hidden]{display:none}
#ssPainel h3{margin:0 0 8px;color:#ffd98a;font-size:15px;display:flex;justify-content:space-between;align-items:center}
#ssPainel h3 button{background:none;border:1px solid #3b5878;color:#c6d3e6;border-radius:8px;cursor:pointer;padding:1px 8px}
#ssPainel .ss-linha{display:flex;gap:6px;align-items:center;padding:5px 6px;border-radius:9px;background:rgba(255,255,255,.04);margin:4px 0;flex-wrap:wrap}
#ssPainel .ss-linha b{flex:1;min-width:0}
#ssPainel .ss-linha small{color:#9fb3cc;flex-basis:100%}
#ssPainel .ss-ok{color:#7ee0a0}#ssPainel .ss-falta{color:#ffb27a}
#ssPainel button.ss-abrir{border:1px solid #3b5878;background:#16233a;color:#e8eefc;border-radius:8px;cursor:pointer;padding:2px 8px;font-size:12px}
#ssPainel .ss-acoes{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 6px}
#ssPainel .ss-acoes button{border-radius:10px;cursor:pointer;padding:6px 10px;font:600 12.5px 'Segoe UI',Arial,sans-serif;border:1px solid #c9a85a;background:#241c08;color:#ffe9b8}
#ssPainel .ss-acoes button:disabled{opacity:.5;cursor:wait}
#ssPainel .ss-log{white-space:pre-line;color:#c6d3e6;font-size:12.5px;border-top:1px solid #2a3550;margin-top:8px;padding-top:6px;max-height:180px;overflow:auto}
#ssPainel .ss-st{color:#9fb3cc;font-size:12px;min-height:1.2em;margin-top:6px}
`;
function injetarCss(){if(document.getElementById('ssCssV206'))return;const st=document.createElement('style');st.id='ssCssV206';st.textContent=ESTILO;document.head.append(st);}
function injetarBotao(){
 if(!ehMestre()||!meuUid())return;
 if(document.getElementById('ssBtn'))return;
 const anc=document.querySelector('#sincronizacao-nova .nova-view-tools')||document.querySelector('#labMasterGameControls');
 if(!anc){tentativasBotao++;if(tentativasBotao>20&&!document.getElementById('ssBtn')){const fl=document.createElement('button');fl.type='button';fl.id='ssBtn';fl.textContent='🗓️ Sessão';fl.title='Sessão pronta';fl.style.cssText='position:fixed;left:10px;bottom:10px;z-index:10029;border:1px solid #ffd98a;background:#241c08;color:#ffe9b8;border-radius:8px;cursor:pointer;padding:4px 9px;font:600 12.5px Segoe UI,Arial,sans-serif';fl.addEventListener('click',()=>abrirPainel());document.body.append(fl);}return;}
 const b=document.createElement('button');b.type='button';b.id='ssBtn';b.textContent='🗓️ Sessão';b.title='Sessão pronta: conferir e preparar os mapas de amanhã';
 b.addEventListener('click',()=>abrirPainel());anc.append(b);
}
function linhaMapa(def,m){
 const st=m?`<span class="ss-ok">✅</span>`:`<span class="ss-falta">⚠️ não encontrado</span>`;
 const abrir=m?` <button type="button" class="ss-abrir" data-abrir="${esc(m.id)}">abrir na mesa</button>`:'';
 return `<div class="ss-linha"><b>${esc(def.rotulo)}</b> ${st}${abrir}${m?`<small>${esc(m.nome||m.id)} · ${Number(m.larguraM)||28}×${Number(m.alturaM)||14} m</small>`:''}</div>`;
}
function abrirPainel(){
 injetarCss();
 if(!painel){painel=document.createElement('section');painel.id='ssPainel';painel.setAttribute('data-mapa-painel','temporario');painel.setAttribute('aria-label','Sessão pronta');document.body.append(painel);
  painel.addEventListener('click',aoClicar);}
 const M=mapaSessao();
 const masmorraOk=!!M.masmorra,rota=window.mesaRoteirosV181?.estado?.()?.R?.missoes?.some(x=>String(x.id)==='m_perdidos');
 painel.innerHTML=`<h3>🗓️ Sessão pronta <button type="button" data-fechar title="Fechar">✖</button></h3>
  ${MAPAS_SESSAO.map(d=>linhaMapa(d,M[d.chave])).join('')}
  <div class="ss-linha"><b>🏰 Masmorra (debaixo das ruínas)</b> ${masmorraOk?'<span class="ss-ok">✅</span>':'<span class="ss-falta">⚠️ não encontrada</span>'}</div>
  <div class="ss-linha"><b>📜 História pronta (NPCs, missões, criaturas)</b> ${rota?'<span class="ss-ok">✅ instalada</span>':'<span class="ss-falta">⚠️ não instalada</span>'}</div>
  <div class="ss-acoes">
   <button type="button" data-preparar>⚡ Preparar sessão</button>
   <button type="button" data-portas>🚪 Portas automáticas</button>
   <button type="button" data-geral>🕸️ Mapa geral</button>
  </div>
  <div class="ss-st" data-st></div>
  <div class="ss-log" data-log></div>`;
 painel.hidden=false;logEl=painel.querySelector('[data-log]');statusEl=painel.querySelector('[data-st]');
}
function fecharPainel(){if(painel)painel.hidden=true;}
function log(t){if(logEl)logEl.textContent+=t+'\n';}
function st(t){if(statusEl)statusEl.textContent=t||'';}
async function aoClicar(e){
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.fechar!==undefined)return fecharPainel();
 if(b.dataset.abrir){try{await window.abrirMapaBancoNaMesa_?.(b.dataset.abrir);}catch(err){log('⚠️ '+(err?.message||err));}return;}
 if(b.dataset.geral!==undefined){try{window.mesaLigacoes?.abrirGeral?.();}catch(err){log('⚠️ '+(err?.message||err));}return;}
 if(b.dataset.portas!==undefined){b.disabled=true;st('Marcando as portas…');try{const n=await marcarPortasAutomaticas();log(`🚪 ${n} saída(s) entre os mapas da sessão agora entram ao chegar perto.`);st('');}catch(err){log('⚠️ '+(err?.message||err));st('');}b.disabled=false;return;}
 if(b.dataset.preparar!==undefined){b.disabled=true;try{await prepararSessao();st('✔ preparação concluída');}catch(err){log('⚠️ '+(err?.message||err));st('');}b.disabled=false;const logSalvo=logEl?.textContent||'';abrirPainel();if(logEl&&logSalvo)logEl.textContent=logSalvo;return;}
}

// ---------------------------------------------------------------- preparação (idempotente, passo a passo)
async function prepararSessao(){
 log('— preparação da sessão —');
 // 1) estrutura das ligações (audita, conserta e liga mapas soltos; v190)
 try{if(window.mesaEstrutura?.conferir){const r=await window.mesaEstrutura.conferir();log(`🕸️ ligações: ${r?.depois?.ligacoes??'?'} no total, ${r?.novas?.length||0} novas, ${r?.removidas?.length||0} quebradas removidas, ${r?.ajustadas||0} ajustadas.`);}
 else log('🕸️ módulo de estrutura ainda carregando — tente de novo em instantes.');}catch(e){log('⚠️ estrutura: '+(e?.message||e));}
 // 2) masmorra montada (monstros, armadilhas, jaulas)
 try{if(window.mesaMasmorra){if(window.mesaMasmorra.feito?.())log('🏰 masmorra já montada (monstros no lugar).');else{await window.mesaMasmorra.montar?.();log('🏰 masmorra montada com monstros e armadilhas.');}}
 else log('🏰 módulo da masmorra ainda carregando.');}catch(e){log('⚠️ masmorra: '+(e?.message||e));}
 // 3) história pronta (NPCs Varra/Cronam/encapuzado, missões, criaturas da noite)
 try{const R=window.mesaRoteirosV181?.estado?.()?.R;
  if(R?.missoes?.some(x=>String(x.id)==='m_perdidos'))log('📜 história pronta já instalada.');
  else if(window.mesaRoteirosV181?.instalarHistoria){await window.mesaRoteirosV181.instalarHistoria();log('📜 história instalada: cidade sem nome → Therion, com NPCs e missões.');}
  else log('📜 roteiros ainda carregando.');}catch(e){log('⚠️ história: '+(e?.message||e));}
 // 4) comerciantes na cidade
 try{await colocarComerciantes();}catch(e){log('⚠️ comerciantes: '+(e?.message||e));}
 // 5) recheio dos mapas (baús, itens, bilhetes com pistas)
 try{if(window.mesaRecheio?.rechear){let n=0;await window.mesaRecheio.rechear(t=>{n++;log('🎁 '+t);});if(!n)log('🎁 mapas já recheados (baús e pistas no lugar).');}
 else log('🎁 recheio ainda carregando.');}catch(e){log('⚠️ recheio: '+(e?.message||e));}
 // 6) portas automáticas entre os mapas da sessão
 try{const n=await marcarPortasAutomaticas();log(`🚪 ${n} porta(s) com entrada automática.`);}catch(e){log('⚠️ portas: '+(e?.message||e));}
}

// comerciantes genéricos perto das barracas do mapa da cidade (uma vez por mapa)
async function colocarComerciantes(){
 const M=mapaSessao(),alvo=M.cidade||M.porto;
 if(!alvo){log('🏪 cidade não encontrada — comerciantes não colocados.');return;}
 const marc=await getDoc_(MARCA),md=marc.data()||{};
 if(md.comerciantes?.[String(alvo.id)]){log('🏪 comerciantes já estão na cidade.');return;}
 try{await window.mesaComerciantes?.garantirModelos?.();}catch(e){console.warn('[Sessão] modelos',e);}
 const modelos=npcsTodos().filter(n=>/^comerciante_generico_/.test(String(n.id||'')));
 if(!modelos.length){log('🏪 modelos de comerciante não encontrados no banco.');return;}
 let barracas=[];
 try{const cena=await getDoc_('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(String(alvo.id)));
  const objs=cena.exists()?(cena.data()?.objects||[]):[];
  barracas=objs.filter(o=>/barraca|tenda|banca|estande|mercado|loja/i.test(String(o.nome||'')+' '+String(o.modeloId||''))).slice(0,10);}catch(_){}
 const W=Number(alvo.larguraM)||28,H=Number(alvo.alturaM)||14;
 const norm=o=>({x:+(Number(o.x)*28/W).toFixed(3),y:+(Number(o.y)*14/H).toFixed(3)});
 const pontos=[];
 if(barracas.length)for(const b of barracas){if(pontos.length>=6)break;
  const p0=norm(b),p={x:p0.x,y:+(p0.y+((Number(b.alturaM)||2)/2+1.0)*14/H).toFixed(3)};
  p.y=Math.min(13.4,p.y);
  if(!pontos.some(q=>Math.hypot((q.x-p.x)*W/28,(q.y-p.y)*H/14)<3.5))pontos.push(p);}
 for(let i=pontos.length;i<6;i++)pontos.push({x:+(3+i*4.0).toFixed(3),y:+(12.4-(i%2)*1.4).toFixed(3)});
 let colocados=0;
 for(let i=0;i<pontos.length;i++){const m=modelos[i%modelos.length],k=Math.floor(i/modelos.length)+1;
  const tid=encodeURIComponent('syncnpc:'+String(m.id)+'~'+k);
  try{const ant=await getDoc_(POS+'/'+tid);if(ant.exists())continue;
   await setDoc_(POS+'/'+tid,{nome:'Comerciante '+(i+1),imagem:String(m.miniatura?.url||m.imagem||''),donoUid:'',x:+pontos[i].x.toFixed(3),y:+pontos[i].y.toFixed(3),revision:0,facing:Math.PI/2,camada:3,mapaId:String(alvo.id),diametroM:1});
   colocados++;}catch(err){console.warn('[Sessão] comerciante',err);}}
 await setDoc_(MARCA,{comerciantes:{[String(alvo.id)]:{em:new Date().toISOString(),quantidade:colocados}}},{merge:true});
 log(`🏪 ${colocados} comerciante(s) colocados em “${alvo.nome||alvo.id}”.`);
}

// marca as saídas entre os mapas da sessão como "entra ao chegar perto" (idempotente)
async function marcarPortasAutomaticas(){
 const M=mapaSessao(),ids=new Set(Object.values(M).filter(Boolean).map(m=>String(m.id)));
 if(ids.size<2)return 0;
 const ref=doc(db,LIGACOES_PATH),snap=await getDoc(ref);
 if(!snap.exists())return 0;
 const v=snap.data()||{},ligs=v.ligacoes||[];let n=0;
 for(const l of ligs){
  if(l?.portaAutoV206)continue;
  const a=ids.has(String(l?.a?.mapa||'')),b=ids.has(String(l?.b?.mapa||''));
  if(!a||!b)continue;
  l.portaAutoV206=true;l.auto=true;n++;
 }
 if(n)await setDoc(ref,{...v,ligacoes:ligs,atualizadoEm:Date.now()});
 return n;
}

// ---------------------------------------------------------------- 🚪 entrada automática (todos os navegadores)
// Quem controla o personagem chega perto de uma saída marcada → a mesa leva o personagem para o outro
// mapa sozinha (mesmo pedido oficial do botão 🚶). Só dispara de novo depois de sair da zona da porta.
const zona={lid:'',foraEm:0};
let ultMove=0;
// v206b: o "andou" agora é global (qualquer passo em direção à porta conta, não só dentro da zona) —
// quem chega à soleira e para entra do mesmo jeito; quem nasce parado na porta não é puxado.
let posGeral=null;
function registraMovimento_(){
 try{
  const c=ctl();if(!c)return;
  const t=c.ator?.();if(!t)return;
  const p={x:t.x,y:t.y};
  if(posGeral&&Math.hypot(p.x-posGeral.x,p.y-posGeral.y)>.004)ultMove=Date.now();
  posGeral=p;
 }catch(e){/* sem diagnóstico em produção */}
}
function portaAqui(){
 const c=ctl();if(!c)return null;
 const mapa=String(c.mapaAtual?.()||'');if(!mapa)return null;
 try{if(c.emCombate?.())return null;}catch(_){}
 const t=c.ator?.();if(!t||!c.controla?.(t))return null;
 if(String(t.donoUid||'')!==meuUid())return null;
 const m=mapasTodos().find(x=>String(x.id)===mapa),W=Number(m?.larguraM)||28,H=Number(m?.alturaM)||14;
 const ligs=window.mesaLigacoes?.ligacoes?.()||[];
 for(const l of ligs){if(!l?.portaAutoV206&&!l?.interiorV164)continue;
  const p=String(l.a?.mapa)===mapa?l.a:String(l.b?.mapa)===mapa?l.b:null;
  if(!p)continue;
  const d=Math.hypot((Number(t.x)-Number(p.x))*W/28,(Number(t.y)-Number(p.y))*H/14)-(Number(t.diametroM)||1)/2;
  if(d<=1.6)return {l,t,p};}
 return null;
}
async function tentarEntrar(){
 if(!meuUid())return;
 registraMovimento_();
 const alvo=portaAqui();
 if(!alvo){if(zona.lid&&Date.now()-zona.foraEm>2500)zona.lid='';return;}
 const andou=ultMove>0&&Date.now()-ultMove<2000;
 if(!andou)return; // parado há mais de 2 s (ex.: nasceu na porta): espera dar um passo
 if(zona.lid===String(alvo.l.id))return;
 zona.lid=String(alvo.l.id);zona.foraEm=Date.now();
 try{
  const nome=String(alvo.t.nome||'').replace(/^(NPC|Monstro|PJ|PM|Criatura)\s*[·:-]\s*/i,'');
  await setDoc(doc(db,LIGACOES_PATH+'/acoes','ssp'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),{donoUid:meuUid(),personagemId:String(alvo.t.id),nome,ligacao:alvo.l.id,de:String(alvo.t.mapaId||ctl()?.mapaAtual?.()||''),criadoEm:Date.now()});
 }catch(e){console.warn('[Sessão] porta',e);zona.lid='';}
}

// ---------------------------------------------------------------- ⚡ preparação automática (zero cliques)
// Quando o mestre abre o jogo, a sessão se arruma sozinha: uma vez por dia, assim que os módulos
// oficiais (Estrutura, Masmorra, Roteiros, Recheio, Comerciantes) estiverem carregados, roda a
// preparação completa em silêncio e avisa só com um balão temporário. O botão 🗓️ continua valendo
// para re-executar manualmente a qualquer momento.
const hojeISO=()=>new Date().toISOString().slice(0,10);
let autoRodando=false;
function toast(msg,ms){
 try{
  let t=document.getElementById('ssToastV206');
  if(!t){t=document.createElement('div');t.id='ssToastV206';t.setAttribute('data-mapa-painel','temporario');t.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10040;padding:8px 14px;border-radius:12px;background:#0e1322;border:1px solid #ffd98a;color:#ffe9b8;font:600 13px Segoe UI,Arial,sans-serif;box-shadow:0 10px 30px #000c;transition:opacity .4s;max-width:min(90vw,560px);text-align:center;pointer-events:none';document.body.append(t);}
  t.textContent=msg;t.style.opacity='1';t.hidden=false;
  clearTimeout(toast._t);toast._t=setTimeout(()=>{t.style.opacity='0';setTimeout(()=>{t.hidden=true;},450);},ms||6000);
 }catch(e){console.warn('[Sessão] toast',e);}
}
function modulosProntos_(){
 try{return !!(window.mesaEstrutura?.conferir&&window.mesaMasmorra&&window.mesaRoteirosV181?.instalarHistoria&&window.mesaRecheio?.rechear&&window.mesaComerciantes?.garantirModelos);}catch(_){return false;}
}
async function autoPreparar(){
 if(autoRodando||!ehMestre()||!meuUid())return;
 try{
  const marc=await getDoc_(MARCA),md=marc.data()||{};
  if(md.auto?.em===hojeISO())return; // sessão já arrumada hoje
  if(!modulosProntos_())return; // módulos ainda carregando — tenta no próximo tick
  autoRodando=true;
  toast('🗓️ Sessão pronta: arrumando os mapas, NPCs e masmorra…',9000);
  await prepararSessao();
  await setDoc_(MARCA,{auto:{em:hojeISO(),emISO:new Date().toISOString()}},{merge:true});
  toast('✅ Sessão pronta! Palácio, cidade, espaço-porto, ruínas, masmorra e Theriom ligados e recheados. Boa mesa!',10000);
 }catch(e){console.warn('[Sessão] auto',e);}
 finally{autoRodando=false;}
}

// ---------------------------------------------------------------- liga
injetarCss();
setInterval(()=>{try{autoPreparar();}catch(e){console.warn('[Sessão]',e);}},20000);
setInterval(()=>{try{injetarBotao();}catch(e){console.warn('[Sessão]',e);}},2000);
setInterval(()=>{try{tentarEntrar();}catch(e){console.warn('[Sessão]',e);}},600);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&painel&&!painel.hidden)fecharPainel();});
window.mesaSessaoV206={abrir:()=>{if(ehMestre())abrirPainel();},preparar:prepararSessao,marcarPortas:marcarPortasAutomaticas,mapas:mapaSessao};
})();
