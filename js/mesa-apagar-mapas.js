// Mesa Estelar v173 — 🗑️ Mapas: o mestre apaga vários mapas de uma vez, direto da mesa (sem ir ao banco de dados).
// Para cada mapa apagado: cópia de segurança (combatesAtivos/backupMapaApagado_<id>), as saídas que levavam a ele somem,
// personagens dos jogadores que estavam lá vão para o Portão de Véspera, NPCs/criaturas de lá saem, o cenário que usava
// o mapa fica sem mapa e, se a mesa estiver aberta nele, abre outro.

const clean=v=>JSON.parse(JSON.stringify(v??null));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes';
export const PRINCIPAIS=new Set(['cenario_c001','cenario_c002','v138_espacoporto']);
// o que acontece com as miniaturas de um mapa apagado (puro)
export function destinoDosTokens(tokens=[],id){
 const dec=t=>decodeURIComponent(String(t.id||''));const aqui=tokens.filter(t=>String(t.mapaId||'')===String(id));
 return {mover:aqui.filter(t=>!dec(t).startsWith('sync')),apagar:aqui.filter(t=>dec(t).startsWith('sync'))};
}
// v176: quais mapas guardar (sair do seletor) por padrão: fica o que o mestre pediu, onde há jogadores, o aberto,
// as casas por dentro (portas de interior) e os trajetos entre dois que ficam.
export const MANTER_V176=/musk|\bilu\b|il[uü]-|elv|cidade alta|cidade superior|praca.*alta|escadaria|pres[ií]dio|presidio|cust[oó]dia|prisao|pris[aã]o|cadeia|hospital|cl[ií]nica|clinica|cidade baixa|bateria|\bur.?17|port[aã]o de v[eé]spera$|portao de vespera$|espa[cç]o.?porto|espaco.?porto|therion|cidade sem nome/;
export function mapasParaGuardar(mapas=[],ligs=[],{tokens=[],aberto=''}={}){
 const nome=m=>String(m?.nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const fica=new Set(mapas.filter(m=>MANTER_V176.test(nome(m))&&!/nossa arte|imagem ia|teste/.test(nome(m))).map(m=>String(m.id)));
 for(const t of tokens){const d=decodeURIComponent(String(t.id||''));if(!d.startsWith('sync')&&t.mapaId)fica.add(String(t.mapaId));}
 if(aberto)fica.add(String(aberto));
 for(const id of ['cenario_c001','cenario_c002','v138_espacoporto','bar1_2','v145_escadaria_alta','v145_praca_cidade_alta','v145_residencia_ilu'])if(mapas.some(m=>String(m.id)===id))fica.add(id);
 for(let k=0;k<3;k++)for(const l of ligs){const a=String(l?.a?.mapa||''),b=String(l?.b?.mapa||'');if(l?.interiorV164){if(fica.has(a))fica.add(b);if(fica.has(b))fica.add(a);}}
 for(const m of mapas)if(m.intermediario&&fica.has(String(m.intermediario.a))&&fica.has(String(m.intermediario.b)))fica.add(String(m.id));
 return mapas.filter(m=>m?.id&&!fica.has(String(m.id))&&!m.arquivadoV176).map(m=>String(m.id));
}
export const semLigacoesPara=(ligs=[],ids=[])=>{const s=new Set(ids.map(String));return ligs.filter(l=>!s.has(String(l?.a?.mapa))&&!s.has(String(l?.b?.mapa)));};

const ESTILO=`
#amModal{position:fixed;inset:0;z-index:9990;background:rgba(3,8,18,.72);display:flex;align-items:center;justify-content:center}
#amModal[hidden]{display:none}
#amModal .am-c{width:min(720px,94vw);max-height:86vh;display:flex;flex-direction:column;background:#101a2e;border:1px solid #3b5878;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 40px #000a}
#amModal header{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #263a58}
#amModal header h3{margin:0;font-size:15px;flex:1;color:#8ee7ff}
#amModal .am-lista{overflow:auto;padding:6px 10px;flex:1}
#amModal .am-l{display:grid;grid-template-columns:54px 1fr 54px;gap:8px;align-items:center;padding:6px 6px;border-radius:8px}
#amModal .am-l:hover{background:#18284a}
#amModal .am-l small{color:#9fb3cc}
#amModal .am-l.am-guardado>span{opacity:.55}
#amModal .am-l label{display:flex;align-items:center;gap:3px;cursor:pointer;font-size:12px;color:#c6d3e6}
#amModal .am-cab{display:grid;grid-template-columns:54px 1fr 54px;gap:8px;padding:2px 6px;color:#8ee7ff;font-size:11.5px}
#amModal .am-tag{font-size:11px;padding:1px 6px;border-radius:8px;background:#22324f;color:#c6d3e6;margin-left:4px}
#amModal .am-tag.av{background:#5a3a12;color:#ffd9a0}
#amModal footer{display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px solid #263a58;flex-wrap:wrap}
#amModal input[type=search]{flex:1;min-width:160px;background:#0b1424;border:1px solid #2f4664;border-radius:8px;color:#e8eefc;padding:6px 8px}
#amModal button{border-radius:8px;border:1px solid #2f4664;background:#16233a;color:#d8e6ff;padding:6px 10px;cursor:pointer;font:600 13px 'Segoe UI',Arial,sans-serif}
#amModal button.am-perigo{background:#5a1620;border-color:#a3303f;color:#fff}
#amModal button:disabled{opacity:.5;cursor:default}
#amModal .am-st{color:#9fb3cc;width:100%}
`;

export function instalarApagarMapas(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const el=id=>root.getElementById(id);
 const D=p=>dep.doc(dep.db,...p.split('/'));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const mapas=()=>{try{return dep.mapas?.()||[];}catch(_){return [];}};
 if(!el('amCss')){const s=root.createElement('style');s.id='amCss';s.textContent=ESTILO;root.head.append(s);}
 let modal=null,marcados=new Set(),busca='',confirmar=false,ocupado=false,status='',ligs=[];
 function botao(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;let bt=el('amBotao');
  if(!ehMestre()||!sc){bt?.remove();return;}
  if(!bt){bt=root.createElement('button');bt.type='button';bt.id='amBotao';bt.textContent='🗂️ Mapas';bt.title='Mostrar ou guardar mapas no seletor, e apagar os que não servem mais';bt.className='btn-small';
   bt.style.cssText="border-radius:999px;border:1px solid #3b5878;background:#101a2e;color:#e8eefc;padding:6px 12px;font:600 13px 'Segoe UI',Arial,sans-serif;cursor:pointer";
   bt.addEventListener('pointerdown',e=>e.stopPropagation());bt.addEventListener('click',abrir);
   if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(bt);}
 }
 async function abrir(){
  if(!modal){modal=root.createElement('div');modal.id='amModal';modal.hidden=true;root.body.append(modal);
   modal.addEventListener('pointerdown',e=>{if(e.target===modal)fechar();});
   modal.addEventListener('click',aoClicar);modal.addEventListener('change',e=>{const g=e.target.closest('[data-mostrar]');if(g){void mostrar(g.dataset.mostrar,g.checked);return;}const c=e.target.closest('[data-id]');if(c){if(c.checked)marcados.add(c.dataset.id);else marcados.delete(c.dataset.id);confirmar=false;pintar(false);}});
   modal.addEventListener('input',e=>{if(e.target.matches('[data-busca]')){busca=e.target.value;pintar(false);}});}
  try{const s=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));ligs=s.exists()?(s.data()?.ligacoes||[]):[];}catch(_){ligs=[];}
  marcados=new Set();confirmar=false;status='';busca='';modal.hidden=false;pintar(true);
 }
 function fechar(){if(modal&&!ocupado)modal.hidden=true;}
 function pintar(tudo){
  if(!modal)return;
  const atual=String(ctl()?.mapaAtual?.()||''),toks=ctl()?.todosTokens?.()||[],cens=dep.cenarios?.()||[];
  const lista=mapas().filter(m=>m?.id&&!/^__/.test(String(m.id))&&(!busca||sem(m.nome+' '+m.id).includes(sem(busca)))).sort((a,b)=>(a.arquivadoV176?1:0)-(b.arquivadoV176?1:0)||String(a.nome||a.id).localeCompare(String(b.nome||b.id),'pt'));
  const linhas=lista.map(m=>{const id=String(m.id),n=toks.filter(t=>String(t.mapaId||'')===id).length,nl=ligs.filter(l=>String(l?.a?.mapa)===id||String(l?.b?.mapa)===id).length,c=cens.find(x=>String(x.mapaId||'')===id);
   const tags=[PRINCIPAIS.has(id)?'<span class="am-tag av">principal</span>':'',id===atual?'<span class="am-tag av">aberto agora</span>':'',m.intermediario?'<span class="am-tag">trajeto</span>':'',c?`<span class="am-tag">cenário: ${esc(c.nome||c.id)}</span>`:''].join('');
   return `<div class="am-l${m.arquivadoV176?' am-guardado':''}"><label title="Mostrar no seletor de mapas (desmarcado = guardado: não aparece, mas não é apagado)"><input type="checkbox" data-mostrar="${esc(id)}" ${m.arquivadoV176?'':'checked'}> 👁</label><span><b>${esc(m.nome||id)}</b>${m.arquivadoV176?'<span class="am-tag">🗄️ guardado</span>':''}${tags}<br><small>${esc(id)} · ${Number(m.larguraM)||28}×${Number(m.alturaM)||14} m · ${n} miniatura(s) · ${nl} saída(s)</small></span><label title="Marcar para apagar de vez"><input type="checkbox" data-id="${esc(id)}" ${marcados.has(id)?'checked':''}> 🗑️</label></div>`;}).join('')||'<div style="padding:10px;color:#9fb3cc">Nenhum mapa.</div>';
  if(tudo||!modal.querySelector('.am-c')){
   modal.innerHTML=`<div class="am-c"><header><h3>🗂️ Mapas</h3><button type="button" data-fechar>✕</button></header><div class="am-cab"><span>👁 mostrar</span><span>Desmarque 👁 para guardar o mapa (some do seletor, mas continua existindo; as portas para ele continuam). 🗑️ apaga de vez.</span><span>🗑️ apagar</span></div><div class="am-lista" data-lista></div>
    <footer><input type="search" data-busca placeholder="Procurar mapa…" value="${esc(busca)}"><button type="button" data-nenhum>Desmarcar</button><button type="button" data-limpar-guardados title="Tira os NPCs e monstros que ainda estão em mapas GUARDADOS (faz cópia antes). Personagens de jogadores não são tocados.">🧹 Tirar NPCs e monstros dos guardados</button><button type="button" data-guardar-todos title="Guarda (esconde do seletor, sem apagar) todos os mapas, menos o mapa de teste Ecossistema. Dá para mostrar de novo marcando 👁.">🗄️ Guardar todos (menos o de teste)</button><button type="button" class="am-perigo" data-apagar></button><div class="am-st" data-st></div></footer></div>`;}
  modal.querySelector('[data-lista]').innerHTML=linhas;
  const b=modal.querySelector('[data-apagar]'),n=marcados.size;
  b.disabled=!n||ocupado;b.textContent=confirmar?`⚠️ Confirmar: apagar ${n} mapa(s) de vez`:`🗑️ Apagar ${n} mapa(s)`;
  modal.querySelector('[data-st]').textContent=status||(n?'Uma cópia de cada mapa fica guardada (backupMapaApagado). Personagens dos jogadores vão para o Portão de Véspera.':`${mapas().filter(m=>m?.id&&!m.arquivadoV176).length} à mostra · ${mapas().filter(m=>m?.arquivadoV176).length} guardado(s).`);
 }
 async function mostrar(id,sim){
  const m=mapas().find(x=>String(x.id)===String(id));if(!m)return;
  try{await dep.setDoc(D('mapas/'+id),{arquivadoV176:!sim},{merge:true});m.arquivadoV176=!sim;status=sim?`👁 "${m.nome||id}" voltou para o seletor.`:`🗄️ "${m.nome||id}" guardado.`;}catch(err){status='⚠️ '+(err?.message||err);}
  try{win.labAtualizarSelectMapas_?.();}catch(_){}pintar(false);
 }
 /** v205: guarda TODOS os mapas (arquivadoV176) exceto o mapa de teste Ecossistema; nada é apagado e as portas continuam */
 let confirmarGuardar=false;
 const ehMapaDeTeste=m=>/ecossistema/i.test(String(m.id)+' '+String(m.nome||''));
 async function guardarTodos(){
  const alvo=mapas().filter(m=>m?.id&&!/^__/.test(String(m.id))&&!m.arquivadoV176&&!ehMapaDeTeste(m));
  if(!alvo.length){status='Nada a guardar: todos os outros mapas já estão guardados.';pintar(false);return;}
  if(!confirmarGuardar){confirmarGuardar=true;status=`⚠️ Vai guardar ${alvo.length} mapa(s) (sem apagar). Clique de novo em "Guardar todos" para confirmar.`;pintar(false);return;}
  confirmarGuardar=false;ocupado=true;let ok=0;const erros=[];
  for(const m of alvo){try{await dep.setDoc(D('mapas/'+m.id),{arquivadoV176:true},{merge:true});m.arquivadoV176=true;ok++;}catch(err){erros.push(String(m.id)+': '+(err?.message||err));}status=`Guardando ${ok}/${alvo.length}…`;pintar(false);}
  ocupado=false;status=`🗄️ ${ok} mapa(s) guardado(s); o de teste continua à mostra.${erros.length?' ⚠️ '+erros.join(' · '):''}`;try{win.labAtualizarSelectMapas_?.();}catch(_){}pintar(false);
 }
 /** v205: tira NPCs (syncnpc:) e monstros (synccriatura:) dos mapas GUARDADOS (arquivadoV176), exceto o mapa de teste. Cópia antes em combatesAtivos/backupTokensGuardados_<data>(_N) como texto JSON. Personagens de jogadores ficam. */
 let confirmarLimpar=false;
 const ehNpcOuMonstro=t=>{let id='';try{id=decodeURIComponent(String(t?.id||''));}catch(_){id=String(t?.id||'');}return /^sync(criatura|npc):/.test(id);};
 async function limparGuardados(){
  const guardados=new Set(mapas().filter(m=>m?.id&&m.arquivadoV176&&!ehMapaDeTeste(m)).map(m=>String(m.id)));
  const alvo=(ctl()?.todosTokens?.()||[]).filter(t=>guardados.has(String(t.mapaId||''))&&ehNpcOuMonstro(t));
  if(!alvo.length){status='Nenhum NPC ou monstro nos mapas guardados.';pintar(false);return;}
  if(!confirmarLimpar){confirmarLimpar=true;status='⚠️ Vai tirar '+alvo.length+' NPC(s)/monstro(s) de '+new Set(alvo.map(t=>t.mapaId)).size+' mapa(s) guardado(s) (com cópia antes). Clique de novo em "Tirar NPCs e monstros dos guardados" para confirmar.';pintar(false);return;}
  confirmarLimpar=false;ocupado=true;status='Fazendo a cópia…';pintar(false);
  try{
   const texto=JSON.stringify(alvo.map(t=>({...t})).map(t=>{const o={...t};return o;})),ts=new Date().toISOString().replace(/[:.]/g,'-');
   const partes=[];for(let i=0;i<texto.length;i+=600000)partes.push(texto.slice(i,i+600000));
   for(let i=0;i<partes.length;i++)await dep.setDoc(D('combatesAtivos/backupTokensGuardados_'+ts+'_'+(i+1)),{em:new Date().toISOString(),parte:i+1,de:partes.length,texto:partes[i]});
   let ok=0;const erros=[];
   for(const t of alvo){try{await dep.deleteDoc(D(POS+'/'+t.id));ok++;}catch(err){erros.push(String(t.id)+': '+(err?.message||err));}status='Tirando… '+ok+'/'+alvo.length;pintar(false);}
   status='🧹 '+ok+' NPC(s)/monstro(s) saíram dos mapas guardados (cópia em combatesAtivos/backupTokensGuardados_'+ts+').'+(erros.length?' ⚠️ '+erros.slice(0,3).join(' · '):'');
  }catch(err){status='⚠️ '+(err?.message||err);}
  ocupado=false;pintar(false);
 }
 async function aoClicar(e){
  if(e.target.closest('[data-fechar]'))return fechar();
  if(e.target.closest('[data-limpar-guardados]')){if(!ocupado)void limparGuardados();return;}
  if(e.target.closest('[data-guardar-todos]')){if(!ocupado)void guardarTodos();return;}
  if(e.target.closest('[data-nenhum]')){marcados.clear();confirmar=false;pintar(false);return;}
  if(!e.target.closest('[data-apagar]')||ocupado||!marcados.size)return;
  if(!confirmar){confirmar=true;pintar(false);return;}
  ocupado=true;confirmar=false;const ids=[...marcados];const feitos=[],erros=[];
  for(const id of ids){status=`Apagando ${feitos.length+1}/${ids.length}…`;pintar(false);
   try{await apagar(id);feitos.push(mapas().find(m=>String(m.id)===id)?.nome||id);}catch(err){console.warn('[Apagar mapas]',id,err);erros.push(id+': '+(err?.message||err));}}
  try{const s=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));if(s.exists()){const v=s.data()||{},nov=semLigacoesPara(v.ligacoes||[],ids);if(nov.length!==(v.ligacoes||[]).length)await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:nov,atualizadoEm:Date.now()}));ligs=nov;}}catch(err){erros.push('saídas: '+(err?.message||err));}
  marcados=new Set(ids.filter(i=>mapas().some(m=>String(m.id)===i)));ocupado=false;
  status=`✅ ${ids.length-erros.length} mapa(s) apagado(s).${erros.length?' ⚠️ '+erros.join(' · '):''}`;pintar(false);
 }
 async function apagar(id){
  const m=mapas().find(x=>String(x.id)===id);if(!m)return;
  const arqId='combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
  // cópia de segurança
  try{const r=await dep.getDoc(D('mapas/'+id)),c=await dep.getDoc(D(arqId));const bk={em:new Date().toISOString(),id,nome:String(m.nome||id)};
   const mp=r.exists()?r.data():null,cn=c.exists()?c.data():null;if(mp&&JSON.stringify(mp).length<700000)bk.mapa=mp;if(cn&&JSON.stringify(cn).length+JSON.stringify(bk).length<900000)bk.cena=cn;
   await dep.setDoc(D('combatesAtivos/backupMapaApagado_'+id.replace(/[^a-zA-Z0-9_-]/g,'_')),clean(bk));}catch(e){console.warn('[Apagar mapas] cópia',e);}
  // mesa aberta neste mapa → abre outro
  try{const sh=await dep.getDoc(D(MAP));if(sh.exists()&&String(sh.data()?.mapId||'')===id){const outro=['cenario_c001','cenario_c002','v138_espacoporto'].find(x=>x!==id&&!marcados.has(x)&&mapas().some(q=>String(q.id)===x))||mapas().find(q=>String(q.id)!==id&&!marcados.has(String(q.id)))?.id;if(outro)await ctl()?.openMap?.(String(outro));}}catch(e){console.warn('[Apagar mapas] abrir outro',e);}
  // miniaturas
  const {mover,apagar:fora}=destinoDosTokens(ctl()?.todosTokens?.()||[],id);
  const dest=['cenario_c001','cenario_c002'].find(x=>x!==id&&!marcados.has(x)&&mapas().some(q=>String(q.id)===x))||'';
  for(const t of fora)try{await dep.deleteDoc(D(POS+'/'+t.id));}catch(_){}
  let k=0;for(const t of mover)try{await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+t.id),s=await tx.get(r);if(!s.exists())return;tx.set(r,{...s.data(),mapaId:dest,x:13+(k%4)*.8,y:6+Math.floor(k/4)*.8,revision:Number(s.data().revision||0)+1});});k++;}catch(_){}
  // cena, marcas e registro do mestre
  for(const p of [arqId,'combatesAtivos/marcasMapa_'+encodeURIComponent(id)])try{await dep.deleteDoc(D(p));}catch(_){}
  try{const r=await dep.getDoc(D('combatesAtivos/mesaObjetosMestre'));if(r.exists()&&r.data()?.mapas?.[id]){const v=r.data();const mp={...(v.mapas||{})};delete mp[id];await dep.setDoc(D('combatesAtivos/mesaObjetosMestre'),clean({...v,mapas:mp}));}}catch(_){}
  // cenários que usavam o mapa
  for(const c of (dep.cenarios?.()||[]).filter(c=>String(c.mapaId||'')===id))try{await dep.setDoc(D('cenarios/'+c.id),{mapaId:''},{merge:true});c.mapaId='';}catch(_){}
  // o mapa
  await dep.apagarMapa(id);
 }
 const vigia=setInterval(botao,1000);botao();
 win.mesaApagarMapasV173={abrir,apagar,mostrar};
 return {parar(){clearInterval(vigia);}};
}
