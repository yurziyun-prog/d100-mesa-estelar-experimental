// ============================================================================
// v90 · LOCALIZAÇÃO DINÂMICA · CENÁRIO ↔ MAPA
// A localização persistente passa a viver nas entidades. Os arrays
// personagensCena dos cenários continuam sendo mantidos como espelho de
// compatibilidade, e o Mapa da Mesa pode sincronizar automaticamente as
// miniaturas visíveis do cenário ligado ao mapa atual.
// ============================================================================
(()=>{
  const V90_PUBLIC_DOC='cenariosPublicosV90';
  const V90_WORLD_DOC='localizacoesMundoV90';
  const V90_MAP_PATH=['combatesAtivos','mapaMesaSyncDireta'];
  let cenariosPublicosV90_=[];
  let cenariosPublicosUnsubV90_=null;
  let charsLocUnsubV90_=null;
  let npcsLocUnsubV90_=null;
  let reconciliandoLocV90_=false;
  let timerReconciliarV90_=null;
  let timerMapaV90_=null;
  let playerLocUnsubV92_=null;
  let playerLocWatchIdV92_='';

  function escV90_(v){return typeof escaparHtmlInventario_==='function'?escaparHtmlInventario_(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function locIdV90_(e){return String(e?.localizacaoCenarioId||e?.localizacao?.cenarioId||'').trim();}
  function refCharV90_(id){return `char:${String(id||'')}`;}
  function refNpcV90_(id){return `npc:${String(id||'')}`;}
  function refLegadoV90_(tipo,id){return tipo==='npc'?`npcdb:${id}`:String(id||'');}
  function parseRefV90_(ref){
    const s=String(ref||'');
    if(s.startsWith('npc:'))return {tipo:'npc',id:s.slice(4)};
    if(s.startsWith('npcdb:'))return {tipo:'npc',id:s.slice(6)};
    if(s.startsWith('char:'))return {tipo:'char',id:s.slice(5)};
    return {tipo:'char',id:s};
  }
  function entidadeV90_(ref){const r=parseRefV90_(ref);return r.tipo==='npc'?(npcsDB||[]).find(x=>String(x.id)===r.id):(userCharacters||[]).find(x=>String(x.id)===r.id);}
  function cenarioDeMapaV154_(cid){const s=String(cid||'');if(!s.startsWith('mapa:'))return null;const mid=s.slice(5),m=(mapasDB||[]).find(x=>String(x.id)===mid);return {id:s,mapaId:mid,nome:m?.nome||mid,virtualV154:true};}
  window.__mesaCenarioDeMapaV154_=cenarioDeMapaV154_;
  function cenarioNomeV90_(id){const c=(cenariosDB||[]).find(x=>String(x.id)===String(id))||cenarioDeMapaV154_(id);return c?.nome||String(id||'—');}
  function linkCenarioV90_(cenario,ref){
    const r=parseRefV90_(ref),legacy=refLegadoV90_(r.tipo,r.id);
    return (Array.isArray(cenario?.personagensCena)?cenario.personagensCena:[]).find(x=>String(x.id)===legacy)||null;
  }
  function localizacaoEntidadeV90_(tipo,e){
    const explicit=locIdV90_(e);if(explicit)return explicit;
    const legacy=refLegadoV90_(tipo,e?.id);
    const ativo=String(estadoCampanhaMestre?.cenarioId||campanhaPublica_?.cenarioId||'');
    const matches=(cenariosDB||[]).filter(c=>(c.personagensCena||[]).some(v=>String(v.id)===legacy));
    return (matches.find(c=>String(c.id)===ativo)||matches[0])?.id||'';
  }
  function entidadesNoCenarioV90_(cenarioId,{somenteVisiveis=false}={}){
    const cid=String(cenarioId||''),c=(cenariosDB||[]).find(x=>String(x.id)===cid),out=[];
    for(const p of (userCharacters||[])){
      if(localizacaoEntidadeV90_('char',p)!==cid)continue;
      const link=linkCenarioV90_(c,refCharV90_(p.id));const vis=link?link.visivel!==false:true;
      if(!somenteVisiveis||vis)out.push({tipo:'char',id:String(p.id),ref:refCharV90_(p.id),legacyId:String(p.id),nome:p.nome||'Sem nome',imagem:p.imagem||'',donoUid:String(p.donoUid||p.dono||''),visivel:vis,entidade:p});
    }
    for(const n of (npcsDB||[])){
      if(localizacaoEntidadeV90_('npc',n)!==cid)continue;
      const link=linkCenarioV90_(c,refNpcV90_(n.id));const vis=link?link.visivel!==false:true;
      if(!somenteVisiveis||vis)out.push({tipo:'npc',id:String(n.id),ref:refNpcV90_(n.id),legacyId:`npcdb:${n.id}`,nome:n.nome||'NPC',imagem:n.imagem||'',donoUid:'',visivel:vis,entidade:n});
    }
    return out;
  }

  async function publicarCatalogoCenariosV90_(){
    if(userData?.role!=='mestre')return;
    const cenarios=(cenariosDB||[]).map(c=>{
      const destinos=[[c.destino1,c.condicao1],[c.destino2,c.condicao2],[c.destino3,c.condicao3]]
        .filter(([id])=>String(id||'').trim())
        .map(([id,condicao])=>{const d=(cenariosDB||[]).find(x=>String(x.id)===String(id));return d?{id:String(d.id),nome:d.nome||String(d.id),local:d.local||'',condicao:String(condicao||'')}:null;})
        .filter(Boolean);
      const presentes=entidadesNoCenarioV90_(c.id,{somenteVisiveis:true});
      const acoes=(typeof parseInteracoesCenarioV76_==='function'?parseInteracoesCenarioV76_(c.interacoesTexto):[]).map(a=>({id:a.id,titulo:a.titulo,icone:a.icone,pericia:a.pericia,pericias:Array.isArray(a.pericias)?a.pericias:[],dificuldade:a.dificuldade,evidente:a.evidente,sucesso:a.sucesso,critico:a.critico,falha:a.falha}));
      const comerciantes=presentes.filter(x=>x.tipo==='npc').map(x=>typeof comerciantePublicoV73_==='function'?comerciantePublicoV73_(x.entidade):null).filter(Boolean);
      return {
        id:String(c.id),nome:c.nome||c.id,local:c.local||'',tipo:c.tipo||'',imagem:c.imagem||'',descricaoJogadores:c.descricaoJogadores||'',mapaId:c.mapaId||'',destinos,
        personagensVisiveis:presentes.map(x=>({id:x.legacyId,nome:x.nome,imagem:x.imagem,tipo:x.tipo==='npc'?'NPC':(x.entidade?.dono===currentUserUid?'PM':'PC')})),
        interacoes:{acoes,comerciantes}
      };
    });
    try{await setDoc(doc(db,'configuracoes',V90_PUBLIC_DOC),{cenarios,atualizadoEm:new Date().toISOString()},{merge:false});cenariosPublicosV90_=cenarios;}catch(e){console.warn('Publicar catálogo de cenários v91',e);}
  }
  function iniciarCatalogoPublicoV90_(){
    if(cenariosPublicosUnsubV90_||!currentUserUid)return;
    cenariosPublicosUnsubV90_=onSnapshot(doc(db,'configuracoes',V90_PUBLIC_DOC),s=>{cenariosPublicosV90_=Array.isArray(s.data()?.cenarios)?s.data().cenarios:[];try{renderizarCenarioAtualPublico_();}catch(_){}},e=>console.warn('Catálogo público v90',e));
  }

  // v92: o mestre pode mover uma ficha remotamente. O jogador escuta somente os
  // campos de localização do personagem ativo para que Cenário Atual acompanhe
  // a mudança sem precisar recarregar toda a ficha ou interferir no combate.
  function observarLocalizacaoPersonagemAtivoV92_(){
    if(userData?.role==='mestre'){if(playerLocUnsubV92_){try{playerLocUnsubV92_();}catch(_){ }playerLocUnsubV92_=null;}playerLocWatchIdV92_='';return;}
    const id=String(currentCharId||'');if(!id||!currentUserUid)return;
    if(playerLocUnsubV92_&&playerLocWatchIdV92_===id)return;
    if(playerLocUnsubV92_){try{playerLocUnsubV92_();}catch(_){ }playerLocUnsubV92_=null;}
    playerLocWatchIdV92_=id;
    playerLocUnsubV92_=onSnapshot(doc(db,'personagens',id),snap=>{
      if(!snap.exists()||String(currentCharId||'')!==id)return;
      const data=snap.data()||{},char=(userCharacters||[]).find(x=>String(x.id)===id);if(!char)return;
      let mudou=false,mudouAprovacao=false;for(const k of ['localizacaoCenarioId','localizacaoMapaId','localizacaoMapaDefinidaV92','localizacaoAnteriorCenarioId','localizacaoHistoricoV91','localizacaoAtualizadaEm']){
        if(JSON.stringify(char[k]??null)!==JSON.stringify(data[k]??null)){char[k]=data[k];mudou=true;}
      }
      for(const k of ['fichaAprovada','fichaStatus','fichaAprovadaEm','fichaReabertaEm','fichaAtualizadaEm','criacaoConcluida']){
        if(JSON.stringify(char[k]??null)!==JSON.stringify(data[k]??null)){char[k]=data[k];mudouAprovacao=true;}
      }
      if(mudou){
        try{renderizarCenarioAtualPublico_();}catch(_){}
        try{window.dispatchEvent(new CustomEvent('personagem-localizacao-alterada-v93',{detail:{personagemId:id,mapaId:String(char.localizacaoMapaId||''),cenarioId:String(char.localizacaoCenarioId||'')}}));}catch(_){}
        try{novaSyncController_?.refreshView?.();}catch(_){}
        setTimeout(()=>{try{anexarLocalizacaoPublicaV90_();}catch(_){}},0);
      }
      if(mudouAprovacao){
        aplicarBloqueioCriacao_(char);renderizarAvisosProgressao_(char);renderizarListaPersonagens();
        if(fichaAprovadaV96_(char))notificar_('🔒 O mestre aprovou sua ficha. A criação foi bloqueada para edição.','sucesso',5200);
        else if(statusAprovacaoFichaV96_(char)==='reaberta')notificar_('🔓 O mestre reabriu sua ficha para edição.','info',5200);
      }
    },e=>console.warn('watch localização do personagem ativo v92',e));
  }

  async function migrarLocalizacoesLegadasV90_(){
    if(userData?.role!=='mestre')return;
    const batch=writeBatch(db);let mudancas=0;
    const priorizar=(tipo,e)=>{if(locIdV90_(e))return '';const legacy=refLegadoV90_(tipo,e.id),matches=(cenariosDB||[]).filter(c=>(c.personagensCena||[]).some(v=>String(v.id)===legacy));if(!matches.length)return '';const ativo=String(estadoCampanhaMestre?.cenarioId||'');return String((matches.find(c=>String(c.id)===ativo)||matches[0]).id);};
    for(const p of (userCharacters||[])){const cid=priorizar('char',p);if(!cid)continue;p.localizacaoCenarioId=cid;p.localizacaoAtualizadaEm=new Date().toISOString();batch.set(doc(db,'personagens',String(p.id)),{localizacaoCenarioId:cid,localizacaoAtualizadaEm:p.localizacaoAtualizadaEm},{merge:true});mudancas++;}
    for(const n of (npcsDB||[])){const cid=priorizar('npc',n);if(!cid)continue;n.localizacaoCenarioId=cid;n.localizacaoAtualizadaEm=new Date().toISOString();batch.set(doc(db,'npcs',String(n.id)),{localizacaoCenarioId:cid,localizacaoAtualizadaEm:n.localizacaoAtualizadaEm},{merge:true});mudancas++;}
    if(mudancas)try{await batch.commit();}catch(e){console.warn('Migração localizações v90',e);}
  }

  async function reconciliarCenariosLocalizacaoV90_(){
    if(userData?.role!=='mestre'||reconciliandoLocV90_)return;
    reconciliandoLocV90_=true;
    try{
      const explicit=new Map();
      for(const p of (userCharacters||[])){const cid=locIdV90_(p);if(cid)explicit.set(String(p.id),cid);}
      for(const n of (npcsDB||[])){const cid=locIdV90_(n);if(cid)explicit.set(`npcdb:${n.id}`,cid);}
      const batch=writeBatch(db);let mudou=false;
      for(const c of (cenariosDB||[])){
        const old=Array.isArray(c.personagensCena)?c.personagensCena:[],visOld=new Map(old.map(x=>[String(x.id),x.visivel!==false]));
        const keep=old.filter(x=>!explicit.has(String(x.id)));
        const add=[];for(const [ref,cid] of explicit.entries())if(String(cid)===String(c.id))add.push({id:ref,visivel:visOld.has(ref)?visOld.get(ref):true});
        const seen=new Set(),next=[...keep,...add].filter(x=>{const k=String(x.id);if(seen.has(k))return false;seen.add(k);return true;});
        if(JSON.stringify(old)!==JSON.stringify(next)){c.personagensCena=next;batch.set(doc(db,'cenarios',String(c.id)),{personagensCena:next},{merge:true});mudou=true;}
      }
      if(mudou)await batch.commit();
      await publicarCatalogoCenariosV90_();
      if(userData?.role==='mestre')await publicarCampanhaAtual_();
      try{renderizarCenarioMestre_();}catch(_){}
    }catch(e){console.warn('Reconciliar localizações v90',e);}finally{reconciliandoLocV90_=false;}
  }
  function agendarReconciliacaoV90_(){clearTimeout(timerReconciliarV90_);timerReconciliarV90_=setTimeout(()=>reconciliarCenariosLocalizacaoV90_(),240);}

  function iniciarObservadoresLocalizacaoV90_(){
    if(userData?.role!=='mestre')return;
    if(!charsLocUnsubV90_)charsLocUnsubV90_=onSnapshot(collection(db,'personagens'),snap=>{let hit=false,hitFicha=false;for(const d of snap.docs){const data=d.data()||{},loc=String(data.localizacaoCenarioId||''),p=(userCharacters||[]).find(x=>String(x.id)===String(d.id));if(!p)continue;const locMudou=loc!==String(p.localizacaoCenarioId||'')||String(data.localizacaoMapaId||'')!==String(p.localizacaoMapaId||'');const fichaMudou=JSON.stringify([p.fichaAprovada,p.fichaStatus,p.fichaAtualizadaEm,p.updatedAt])!==JSON.stringify([data.fichaAprovada,data.fichaStatus,data.fichaAtualizadaEm,data.updatedAt]);if(locMudou){p.localizacaoCenarioId=loc;p.localizacaoMapaId=String(data.localizacaoMapaId||'');p.localizacaoMapaDefinidaV92=!!data.localizacaoMapaDefinidaV92;p.localizacaoAtualizadaEm=data.localizacaoAtualizadaEm||'';hit=true;}if(fichaMudou){Object.assign(p,data);hitFicha=true;}}if(hit)agendarReconciliacaoV90_();if(hitFicha)renderizarListaPersonagens();},e=>console.warn('watch personagens localização/aprovação v96',e));
    if(!npcsLocUnsubV90_)npcsLocUnsubV90_=onSnapshot(collection(db,'npcs'),snap=>{let hit=false;for(const d of snap.docs){const data=d.data()||{},loc=String(data.localizacaoCenarioId||''),n=(npcsDB||[]).find(x=>String(x.id)===String(d.id));if(n&&(loc!==String(n.localizacaoCenarioId||'')||String(data.localizacaoMapaId||'')!==String(n.localizacaoMapaId||''))){n.localizacaoCenarioId=loc;n.localizacaoMapaId=String(data.localizacaoMapaId||'');n.localizacaoMapaDefinidaV92=!!data.localizacaoMapaDefinidaV92;n.localizacaoAtualizadaEm=data.localizacaoAtualizadaEm||'';hit=true;}}if(hit)agendarReconciliacaoV90_();},e=>console.warn('watch NPC localização v92',e));
  }

  function historicoLocalizacaoV91_(e){return Array.isArray(e?.localizacaoHistoricoV91)?e.localizacaoHistoricoV91.map(String).filter(Boolean):[];}
  function pushHistoricoLocalizacaoV91_(e,cid){const h=historicoLocalizacaoV91_(e);const id=String(cid||'');if(id&&h[h.length-1]!==id)h.push(id);return h.slice(-12);}
  async function moverEntidadeV90_(ref,cenarioId,{silencioso=false}={}){
    if(userData?.role!=='mestre')return false;const r=parseRefV90_(ref),cid=String(cenarioId||''),e=entidadeV90_(r.tipo==='npc'?refNpcV90_(r.id):refCharV90_(r.id));if(!e||!cid)return false;
    const alvo=(cenariosDB||[]).find(c=>String(c.id)===cid)||cenarioDeMapaV154_(cid);if(!alvo)return false;
    const anterior=localizacaoEntidadeV90_(r.tipo,e),historico=(anterior&&anterior!==cid)?pushHistoricoLocalizacaoV91_(e,anterior):historicoLocalizacaoV91_(e);
    const patch={localizacaoCenarioId:cid,localizacaoMapaId:String(alvo.mapaId||''),localizacaoMapaDefinidaV92:true,localizacaoAnteriorCenarioId:anterior&&anterior!==cid?String(anterior):String(e.localizacaoAnteriorCenarioId||''),localizacaoHistoricoV91:historico,localizacaoAtualizadaEm:new Date().toISOString()};
    await setDoc(doc(db,r.tipo==='npc'?'npcs':'personagens',r.id),patch,{merge:true});Object.assign(e,patch);
    await moverTokenParaMapaV92_(r.tipo,e,alvo);
    await reconciliarCenariosLocalizacaoV90_();
    if(!silencioso)notificar_(`📍 ${e.nome||'Entidade'} agora está em ${alvo.nome||alvo.id}${alvo.mapaId?' · mapa atualizado':''}.`,'sucesso',3200);return true;
  }
  window.moverEntidadeParaCenarioV90_=async function(cenarioId){const ref=String(document.getElementById('v90EntitySelect')?.value||'');if(!ref)return notificar_('Escolha um personagem ou NPC.','aviso');await moverEntidadeV90_(ref,cenarioId);};
  window.selecionarPresentesV91_=function(valor=true){document.querySelectorAll('#gmLocationV90 .v91-move-check').forEach(x=>x.checked=!!valor);};
  window.moverGrupoCenarioV90_=async function(origemId,ativar=false){
    if(userData?.role!=='mestre')return;const dest=String(document.getElementById('v90GroupTarget')?.value||'');if(!dest)return notificar_('Escolha o destino.','aviso');
    const refs=[...document.querySelectorAll('#gmLocationV90 .v91-move-check:checked')].map(x=>String(x.value||'')).filter(Boolean),presentes=entidadesNoCenarioV90_(origemId),grupo=refs.length?presentes.filter(x=>refs.includes(String(x.ref))):[];
    if(!grupo.length)return notificar_('Selecione pelo menos um personagem ou NPC presente.','aviso');
    for(const x of grupo)await moverEntidadeV90_(x.ref,dest,{silencioso:true});
    if(ativar){window.selecionarCenarioMestre?.(dest);await window.ativarCenarioMestre?.();}
    else{await reconciliarCenariosLocalizacaoV90_();agendarSyncMapaV90_('grupo');}
    notificar_(`🧭 ${grupo.length} entidade(s) movida(s) para ${cenarioNomeV90_(dest)}${ativar?' e cenário ativado':''}.`,'sucesso',4200);
  };

  function optionsEntidadesV90_(){
    const chars=(userCharacters||[]).map(p=>({ref:refCharV90_(p.id),nome:p.nome||'Sem nome',tipo:p.dono===currentUserUid?'PM':'PJ',loc:localizacaoEntidadeV90_('char',p)}));
    const npcs=(npcsDB||[]).map(n=>({ref:refNpcV90_(n.id),nome:n.nome||'NPC',tipo:'NPC',loc:localizacaoEntidadeV90_('npc',n)}));
    return [...chars,...npcs].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  }
  function anexarPainelLocalizacaoMestreV90_(){
    if(userData?.role!=='mestre')return;const host=document.getElementById('gmScenarioDetail'),c=obterCenarioSelecionadoMestre_();if(!host||!c)return;host.querySelector('#gmLocationV90')?.remove();
    const presentes=entidadesNoCenarioV90_(c.id),entities=optionsEntidadesV90_(),destinos=[...(cenariosDB||[])].filter(x=>String(x.id)!==String(c.id)).sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    const faltantes=[[c.destino1,c.condicao1],[c.destino2,c.condicao2],[c.destino3,c.condicao3]].filter(([id])=>String(id||'').trim()&&!(cenariosDB||[]).some(x=>String(x.id)===String(id)));
    const box=document.createElement('div');box.id='gmLocationV90';box.className='v90-world-box';box.innerHTML=`<div class="v90-world-head"><div><b>🌐 Localização dinâmica</b><small>Presença persistente entre Cenário Atual e Mapa da Mesa.</small></div><span>${presentes.length} presente${presentes.length===1?'':'s'}</span></div>
      ${faltantes.length?`<div class="v91-route-warning">⚠️ Este cenário aponta para destino(s) ainda não cadastrados: <b>${faltantes.map(([id])=>escV90_(id)).join(', ')}</b>. Eles não serão oferecidos como viagem aos jogadores até existirem no Banco de Cenários.</div>`:''}
      <div class="v91-select-tools"><button class="btn-small" onclick="selecionarPresentesV91_(true)">☑ Todos</button><button class="btn-small" onclick="selecionarPresentesV91_(false)">☐ Nenhum</button><span>Marque personagens e NPCs que deseja mover em conjunto.</span></div>
      <div class="v90-present-grid">${presentes.length?presentes.map(x=>`<label class="v90-present v91-present-select"><input class="v91-move-check" type="checkbox" value="${escV90_(x.ref)}"><span>${x.imagem?`<img src="${escV90_(x.imagem)}" alt="">`:'👤'}</span><div><b>${escV90_(x.nome)}</b><small>${x.tipo==='npc'?'NPC':(x.entidade?.dono===currentUserUid?'PM':'PJ')} · ${x.visivel?'visível':'oculto'}</small></div></label>`).join(''):'<i>Ninguém registrado neste local.</i>'}</div>
      <div class="v90-controls"><label>Adicionar / mover uma entidade para este cenário<select id="v90EntitySelect"><option value="">— escolher —</option>${entities.map(x=>`<option value="${escV90_(x.ref)}">${escV90_(x.nome)} · ${x.tipo}${x.loc?` · atualmente: ${escV90_(cenarioNomeV90_(x.loc))}`:''}</option>`).join('')}</select></label><button class="btn-small btn-select" onclick="moverEntidadeParaCenarioV90_('${String(c.id).replace(/'/g,"\'")}')">📍 Mover para cá</button></div>
      <div class="v90-controls"><label>Mover selecionados para<select id="v90GroupTarget"><option value="">— destino —</option>${destinos.map(d=>`<option value="${escV90_(d.id)}">${escV90_(d.nome||d.id)}</option>`).join('')}</select></label><button class="btn-small" onclick="moverGrupoCenarioV90_('${String(c.id).replace(/'/g,"\'")}',false)">🚶 Mover selecionados</button><button class="btn-small btn-select" onclick="moverGrupoCenarioV90_('${String(c.id).replace(/'/g,"\'")}',true)">🗺️ Mover + ativar</button>${c.mapaId?`<button class="btn-small" onclick="sincronizarMapaLocalizacaoV90_(true)">🔄 Sincronizar mapa</button>`:''}</div>`;
    host.appendChild(box);
  }

  function publicoCenarioPorIdV90_(id){return (cenariosPublicosV90_||[]).find(c=>String(c.id)===String(id))||null;}
  function localAtualJogadorV90_(char){return String(char?.localizacaoCenarioId||v102GroupLocation_?.cenarioId||campanhaPublica_?.cenarioId||'');}
  function cenarioLocalJogadorV91_(){const char=typeof obterPersonagemAtual_==='function'?obterPersonagemAtual_():null;return char?publicoCenarioPorIdV90_(localAtualJogadorV90_(char)):null;}
  window.obterInteracoesContextuaisV91_=function(){
    if(userData?.role==='mestre')return campanhaPublica_?.interacoes||{};
    // v161: comerciantes do lugar + os publicados para todos (genéricos, robôs, caravanas…) — antes os do lugar escondiam os outros
    const local=cenarioLocalJogadorV91_(),loc=local?.interacoes||null,glob=campanhaPublica_?.interacoes||{};if(!loc)return glob;
    const lc=loc.comerciantes||[],gc=(glob.comerciantes||[]).filter(m=>!lc.some(x=>String(x.id)===String(m.id)));return {...loc,comerciantes:[...lc,...gc]};
  };
  function destinoAnteriorValidoV91_(char){
    const atual=localAtualJogadorV90_(char),h=historicoLocalizacaoV91_(char);for(let i=h.length-1;i>=0;i--){const id=String(h[i]||'');if(id&&id!==atual&&publicoCenarioPorIdV90_(id))return {id,index:i};}
    const prev=String(char?.localizacaoAnteriorCenarioId||'');return prev&&prev!==atual&&publicoCenarioPorIdV90_(prev)?{id:prev,index:-1}:null;
  }
  async function persistirViagemJogadorV91_(char,destinoId,{voltar=false}={}){
    const atualId=localAtualJogadorV90_(char),dest=publicoCenarioPorIdV90_(destinoId);if(!dest)return notificar_('Esse cenário ainda não está cadastrado/publicado. A viagem foi bloqueada para não deixar o personagem preso em um destino inválido.','aviso',6000);
    let hist=historicoLocalizacaoV91_(char);
    if(voltar){const found=destinoAnteriorValidoV91_(char);if(found?.index>=0)hist=hist.slice(0,found.index);else hist=hist.filter(id=>String(id)!==String(destinoId));}
    else if(atualId&&String(atualId)!==String(destinoId))hist=pushHistoricoLocalizacaoV91_(char,atualId);
    const patch={localizacaoCenarioId:String(destinoId),localizacaoMapaId:String(dest.mapaId||''),localizacaoMapaDefinidaV92:true,localizacaoAnteriorCenarioId:String(atualId||''),localizacaoHistoricoV91:hist,localizacaoAtualizadaEm:new Date().toISOString()};
    await setDoc(doc(db,'personagens',String(char.id)),patch,{merge:true});Object.assign(char,patch);
    await moverTokenParaMapaV92_('char',char,dest);
    try{await registrarHistoricoGeral_('Localização',`${char.nome||'Personagem'} ${voltar?'retornou':'viajou'} para ${dest.nome||dest.id}.`,{subtipo:'viagem_cenario',cenarioOrigem:atualId,cenarioDestino:String(destinoId),voltar:!!voltar});}catch(_){ }
    renderizarCenarioAtualPublico_();notificar_(`🚶 ${char.nome||'Personagem'} ${voltar?'retornou':'viajou'} para ${dest.nome||dest.id}.`,'sucesso',4200);return true;
  }
  window.viajarCenarioV90_=async function(destinoId){
    const char=obterPersonagemAtual_();if(!char||userData?.role==='mestre')return;const atual=publicoCenarioPorIdV90_(localAtualJogadorV90_(char));if(!atual)return notificar_('Sua localização atual não existe mais no catálogo de cenários. Peça ao mestre para reposicionar o personagem.','aviso',6500);
    const dest=(atual?.destinos||[]).find(d=>String(d.id)===String(destinoId));if(!dest)return notificar_('Esse destino não está disponível diretamente a partir daqui.','aviso');
    if(!publicoCenarioPorIdV90_(dest.id))return notificar_('O destino apontado ainda não existe no Banco de Cenários. A viagem foi bloqueada.','aviso',6000);
    const msg=`Viajar para ${dest.nome||dest.id}?${dest.condicao?`\nCondição: ${dest.condicao}`:''}`;if(!confirm(msg))return;
    try{await persistirViagemJogadorV91_(char,dest.id,{voltar:false});}catch(e){console.error(e);notificar_('Não foi possível registrar a viagem.','erro');}
  };
  window.voltarCenarioV91_=async function(){
    const char=obterPersonagemAtual_();if(!char||userData?.role==='mestre')return;const back=destinoAnteriorValidoV91_(char);if(!back)return notificar_('Não há um cenário anterior válido para retornar.','aviso');const dest=publicoCenarioPorIdV90_(back.id);if(!confirm(`Voltar para ${dest?.nome||back.id}?`))return;
    try{await persistirViagemJogadorV91_(char,back.id,{voltar:true});}catch(e){console.error(e);notificar_('Não foi possível retornar ao cenário anterior.','erro');}
  };
  function htmlPresencasLocalV91_(c){const arr=c?.personagensVisiveis||[];if(!arr.length)return'';return `<div class="v91-local-presence"><h4>👥 Personagens presentes</h4><div class="v90-present-grid">${arr.map(x=>`<div class="v90-present"><span>${x.imagem?`<img src="${escV90_(x.imagem)}" alt="">`:'👤'}</span><div><b>${escV90_(x.nome)}</b><small>${escV90_(x.tipo||'')}</small></div></div>`).join('')}</div></div>`;}
  function htmlViagemLocalV91_(char,c){
    const back=destinoAnteriorValidoV91_(char),diretos=c?.destinos||[];return `<div class="v90-travel"><b>🚶 Viagem</b>${back?`<button class="btn-small v91-back-btn" onclick="voltarCenarioV91_()">↩ Voltar para ${escV90_(publicoCenarioPorIdV90_(back.id)?.nome||back.id)}</button>`:''}${diretos.map(d=>`<button class="btn-small" onclick="viajarCenarioV90_('${String(d.id).replace(/'/g,"\\'")}')">${escV90_(d.nome||d.id)}${d.condicao?`<small>${escV90_(d.condicao)}</small>`:''}</button>`).join('')}${!back&&!diretos.length?'<span class="v90-no-travel">Nenhum destino direto cadastrado a partir daqui.</span>':''}</div>`;
  }
  function htmlCenarioLocalCompletoV91_(char,c){
    const p=campanhaPublica_||{},img=c.imagem?`<img class="v91-local-hero" src="${escV90_(c.imagem)}" alt="${escV90_(c.nome||'Cenário')}">`:`<div class="v91-local-placeholder">🪐</div>`;
    return `<div class="v91-local-full">${img}<div class="v91-local-title"><div><h3>📍 ${escV90_(c.nome||c.id)}</h3><span>${escV90_(c.local||'')}</span></div><div class="v91-local-meta">Dia ${Number(p.diaCampanha||1)}${c.mapaId?' · 🗺️ mapa vinculado':''}</div></div><div class="v90-local-description">${escV90_(c.descricaoJogadores||'Nenhuma descrição pública disponível.')}</div>${htmlPresencasLocalV91_(c)}${htmlViagemLocalV91_(char,c)}<div class="v90-away-note">🎭 A mesa está compartilhando <b>${escV90_(p.cenario||'outro cenário')}</b>, mas esta ficha está em <b>${escV90_(c.nome||c.id)}</b>. As interações abaixo pertencem à localização real deste personagem.</div></div>`;
  }
  function anexarLocalizacaoPublicaV90_(){
    if(userData?.role==='mestre')return;const char=obterPersonagemAtual_();if(!char)return;const cid=localAtualJogadorV90_(char),c=publicoCenarioPorIdV90_(cid);if(!c)return;
    const alvos=['globalCurrentScenarioPublic','charCurrentScenarioPublic'].map(id=>document.getElementById(id)).filter(Boolean),mismatch=String(cid)!==String(campanhaPublica_?.cenarioId||'');
    for(const host of alvos){
      host.querySelector('.v90-player-location')?.remove();
      if(mismatch){host.innerHTML=htmlCenarioLocalCompletoV91_(char,c);}
      else{const box=document.createElement('div');box.className='v90-player-location';box.innerHTML=`<div class="v90-world-head"><div><b>📍 Sua localização · ${escV90_(c.nome||c.id)}</b><small>${escV90_(c.local||'')}</small></div>${c.mapaId?'<span>🗺️ mapa vinculado</span>':''}</div>${htmlViagemLocalV91_(char,c)}`;host.prepend(box);}
    }
    setTimeout(()=>{try{anexarInteracoesCenarioV73_();}catch(e){console.warn('Interações contextuais v91',e);}},0);
  }

  function tokenIdV90_(x){return encodeURIComponent(x.tipo==='npc'?`syncnpc:${x.id}`:x.id);}
  function pontosSpawnV90_(ocupados=[]){const pts=[];for(let y=.9;y<=12.9;y+=1.35)for(let x=.9;x<=27.1;x+=1.35)if(ocupados.every(p=>Math.hypot(x-Number(p.x||0),y-Number(p.y||0))>1.05)){pts.push({x,y});ocupados.push({x,y});}return pts;}

  // v92: a posição pertence a um mapa. Trocar o mapa aberto pelo mestre não muda
  // a localização das miniaturas. Mover/viajar é que altera mapa + cenário.
  async function moverTokenParaMapaV92_(tipo,e,cenario){
    if(!e?.id)return false;
    const mapaId=String(cenario?.mapaId||''),id=tokenIdV90_({tipo,id:e.id}),ref=doc(db,...V90_MAP_PATH,'posicoes',id),snap=await getDoc(ref),old=snap.exists()?snap.data():null;
    // Se a miniatura já está no mapa correto, não a teleporta para o ponto de entrada.
    // Isso também permite salvar/editar o cenário sem embaralhar posições que o grupo já ajustou.
    if(old&&String(old.mapaId||'')===mapaId)return true;
    const todos=await getDocs(collection(db,...V90_MAP_PATH,'posicoes')),ocupados=[];
    todos.forEach(d=>{if(d.id===id)return;const v=d.data();if(String(v.mapaId||'')===mapaId&&mapaId)ocupados.push(v);});
    const spawn=(pontosSpawnV90_(ocupados)[0]||{x:1.2,y:1.2});
    try{
      if(old){
        // Atualização mínima: um jogador pode viajar sem precisar ter permissão para
        // regravar nome/imagem/camada do token. A revisão força os clientes a redesenhar.
        await setDoc(ref,{mapaId,x:Number(spawn.x),y:Number(spawn.y),revision:Number(old.revision||0)+1},{merge:true});
      }else{
        const dono=String(e.donoUid||e.dono||'');
        await setDoc(ref,{nome:String(e.nome||'Personagem'),imagem:String(e.miniatura?.url||e.imagem||''),donoUid:tipo==='npc'?'':dono,mapaId,x:Number(spawn.x),y:Number(spawn.y),facing:0,camada:3,revision:0});
      }
      return true;
    }catch(err){console.warn('Mover token entre mapas v92',err);throw err;}
  }

  async function migrarMapasLocalizacaoV92_(){
    if(userData?.role!=='mestre')return;
    const patchEnt=[],reposicionar=[];
    for(const [tipo,lista,col] of [['char',userCharacters||[],'personagens'],['npc',npcsDB||[],'npcs']])for(const e of lista){
      const cid=locIdV90_(e),cReal=(cenariosDB||[]).find(x=>String(x.id)===String(cid)),cVirt=cReal?null:cenarioDeMapaV154_(cid),c=cReal,mapaId=String(cReal?.mapaId||cVirt?.mapaId||'');
      // v154: mapa é o local. Sem cenário conhecido, nunca apaga um mapa já definido.
      if(!cReal&&!cVirt&&e.localizacaoMapaDefinidaV92===true&&String(e.localizacaoMapaId||''))continue;
      const mudouMapa=e.localizacaoMapaDefinidaV92!==true||String(e.localizacaoMapaId||'')!==mapaId;
      if(!mudouMapa)continue;
      e.localizacaoMapaId=mapaId;e.localizacaoMapaDefinidaV92=true;
      patchEnt.push(setDoc(doc(db,col,String(e.id)),{localizacaoMapaId:mapaId,localizacaoMapaDefinidaV92:true},{merge:true}));
      // Se o cenário ganhou/trocou de mapa, a miniatura acompanha a localização real,
      // não o mapa que por acaso estiver aberto na tela do mestre.
      if(c)reposicionar.push({tipo,e,c});
    }
    if(patchEnt.length)await Promise.allSettled(patchEnt);
    for(const item of reposicionar){try{await moverTokenParaMapaV92_(item.tipo,item.e,item.c);}catch(err){console.warn('Reposicionar token por localização v93',item.e?.id,err);}}

    const main=await getDoc(doc(db,...V90_MAP_PATH)),fallbackDesconhecido=String(main.data()?.mapId||''),pos=await getDocs(collection(db,...V90_MAP_PATH,'posicoes')),writes=[];
    pos.forEach(d=>{
      const v=d.data();if(Object.prototype.hasOwnProperty.call(v,'mapaId'))return;
      let mapId='',raw='';try{raw=decodeURIComponent(d.id);}catch(_){raw=d.id;}
      if(raw.startsWith('syncnpc:')){
        const n=(npcsDB||[]).find(x=>String(x.id)===raw.slice(8).split('~')[0]);if(n)mapId=String(n.localizacaoMapaId||'');
      }else if(!raw.startsWith('sync')){
        const c=(userCharacters||[]).find(x=>String(x.id)===raw);if(c)mapId=String(c.localizacaoMapaId||'');
      }else{
        // Criaturas/objetos legados não possuem uma ficha de localização. Para eles,
        // congelamos uma única vez no mapa atualmente aberto, em vez de usar fallback visual eterno.
        mapId=fallbackDesconhecido;
      }
      writes.push(setDoc(doc(db,...V90_MAP_PATH,'posicoes',d.id),{mapaId:String(mapId||'')},{merge:true}));
    });
    if(writes.length)await Promise.allSettled(writes);
  }

  window.trazerPersonagensAtivosMapaV92_=async function(){
    if(userData?.role!=='mestre')return;
    try{
      const main=await getDoc(doc(db,...V90_MAP_PATH)),mapaId=String(main.data()?.mapId||'');if(!mapaId)return notificar_('Abra primeiro o mapa de destino.','aviso');
      const c=(cenariosDB||[]).find(x=>String(x.mapaId||'')===mapaId);if(!c)return notificar_('Este mapa não está vinculado a nenhum cenário. Vincule-o antes de trazer personagens.','aviso',6000);
      const us=await getDocs(collection(db,'usuarios')),ids=new Set();us.forEach(d=>{const id=String(d.data()?.personagemAtivo||'');if(id)ids.add(id);});
      const ativos=(userCharacters||[]).filter(ch=>ids.has(String(ch.id))&&personagemAtivoCampanhaV102_(ch));if(!ativos.length)return notificar_('Nenhum usuário possui personagem ativo selecionado.','aviso');
      const nomes=ativos.map(x=>x.nome||x.id).join(', ');if(!confirm(`Trazer ${ativos.length} personagem(ns) ativo(s) para ${c.nome||c.id}?\n\n${nomes}`))return;
      for(const ch of ativos)await moverEntidadeV90_(refCharV90_(ch.id),String(c.id),{silencioso:true});
      notificar_(`📍 ${ativos.length} personagem(ns) ativo(s) foram trazidos para ${c.nome||c.id}. As telas dos jogadores acompanharão o mapa de cada personagem.`,'sucesso',5200);
    }catch(err){console.error('Trazer ativos v92',err);notificar_('Não foi possível trazer os personagens ativos: '+(err?.message||err),'erro',6500);}
  };
  async function sincronizarMapaLocalizacaoV90_(manual=false){
    if(userData?.role!=='mestre')return;try{
      const mainRef=doc(db,...V90_MAP_PATH),mainSnap=await getDoc(mainRef),state=mainSnap.exists()?mainSnap.data():{};if(state?.combat?.active){if(manual)notificar_('Encerre o combate antes de sincronizar/reorganizar personagens entre mapas.','aviso');return;}
      const mapaId=String(state?.mapId||'');if(!mapaId){if(manual)notificar_('Nenhum mapa está aberto na Mesa.','aviso');return;}
      const c=(cenariosDB||[]).find(x=>String(x.mapaId||'')===mapaId);if(!c){if(manual)notificar_('O mapa aberto não está vinculado a um cenário.','aviso');return;}
      const desejados=entidadesNoCenarioV90_(c.id,{somenteVisiveis:true});for(const x of desejados)await moverTokenParaMapaV92_(x.tipo,x.entidade,c);
      await setDoc(doc(db,'configuracoes',V90_WORLD_DOC),{mapaId,cenarioId:String(c.id),tokensGerenciados:desejados.map(tokenIdV90_),atualizadoEm:new Date().toISOString()},{merge:true});
      if(manual)notificar_(`🔄 ${desejados.length} personagem(ns)/NPC(s) presentes foram colocados no mapa de ${c.nome||c.id}. Ninguém de outros mapas foi movido.`,'sucesso',4800);
    }catch(e){console.error('Sincronizar mapa/localização v92',e);if(manual)notificar_('Não foi possível sincronizar o mapa: '+(e?.message||e),'erro',6500);}
  }
  window.sincronizarMapaLocalizacaoV90_=sincronizarMapaLocalizacaoV90_;
  function agendarSyncMapaV90_(motivo=''){clearTimeout(timerMapaV90_);timerMapaV90_=setTimeout(()=>migrarMapasLocalizacaoV92_().catch(e=>console.warn('Migração multi-mapa v92',motivo,e)),350);}

  function instalarEstilosV90_(){if(document.getElementById('v90WorldStyles'))return;const s=document.createElement('style');s.id='v90WorldStyles';s.textContent=`
    .v90-world-box,.v90-player-location{margin-top:14px;padding:14px;border-radius:12px;background:linear-gradient(135deg,rgba(0,212,255,.055),rgba(155,89,182,.055));border:1px solid rgba(0,212,255,.22)}
    .v90-world-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.v90-world-head b{color:#8feaff;font-size:1.02rem}.v90-world-head small{display:block;color:#91a3ba;margin-top:3px}.v90-world-head>span{padding:4px 8px;border-radius:999px;background:rgba(0,212,255,.08);color:#9fdff3;font-size:.8rem}
    .v90-present-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:7px}.v90-present{display:flex;gap:8px;align-items:center;padding:8px;border-radius:9px;background:rgba(255,255,255,.035)}.v90-present>span{width:38px;height:38px;display:grid;place-items:center}.v90-present img{width:38px;height:38px;border-radius:50%;object-fit:cover}.v90-present small{display:block;color:#8fa2b8}
    .v90-controls{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:10px}.v90-controls label{flex:1;min-width:240px;margin:0}.v90-controls select{margin:4px 0 0;width:100%}
    .v90-local-description{white-space:pre-wrap;color:#ccd4df;line-height:1.45;margin:8px 0}.v90-travel{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:12px}.v90-travel>b{color:#ffd166;margin-right:3px}.v90-travel button small{display:block;color:#aab5c5;font-size:.72em}.v90-no-travel{color:#8090a2;font-size:.85rem}.v90-away-note{padding:11px;border-radius:9px;background:rgba(255,193,7,.06);border:1px solid rgba(255,193,7,.22);color:#e8d9a0}.v91-route-warning{padding:9px 10px;margin:8px 0;border-radius:8px;background:rgba(255,193,7,.07);border:1px solid rgba(255,193,7,.2);color:#e8d9a0}.v91-select-tools{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:8px 0;color:#8fa2b8;font-size:.84rem}.v91-present-select{cursor:pointer}.v91-present-select>input{width:auto;margin:0 2px 0 0}.v91-local-full{padding:14px;border-radius:12px;background:linear-gradient(135deg,rgba(0,212,255,.045),rgba(155,89,182,.06));border:1px solid rgba(0,212,255,.2)}.v91-local-hero{width:100%;max-height:390px;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,.12)}.v91-local-placeholder{height:190px;border-radius:12px;background:rgba(0,0,0,.18);display:grid;place-items:center;font-size:4em}.v91-local-title{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-top:12px}.v91-local-title h3{margin:0;color:#d8b4ff}.v91-local-title span{color:#999}.v91-local-meta{color:#8fa2b8;font-size:.84rem;white-space:nowrap}.v91-local-presence h4{color:#8feaff;margin:14px 0 8px}.v91-back-btn{border-color:rgba(255,209,102,.35)!important;background:rgba(255,209,102,.08)!important;color:#ffe4a3!important}
  `;document.head.appendChild(s);}

  // O editor de cenário passa a tratar a lista vinculada como presença atual.
  const salvarCenarioV90Base_=window.salvarCenarioBancoModal;
  if(typeof salvarCenarioV90Base_==='function')window.salvarCenarioBancoModal=async function(){
    const idAntes=String(document.getElementById('dbScenarioIdOriginal')?.value||'').trim(),nome=String(document.getElementById('dbScenarioNome')?.value||'').trim(),cid=idAntes||slugId_(nome),links=typeof lerPersonagensVinculadosCenario_==='function'?lerPersonagensVinculadosCenario_():[];
    const old=(cenariosDB||[]).find(c=>String(c.id)===String(cid)),oldIds=new Set((old?.personagensCena||[]).map(x=>String(x.id)));const r=await salvarCenarioV90Base_.apply(this,arguments);if(userData?.role!=='mestre'||!cid)return r;
    try{for(const l of links){const pr=parseRefV90_(l.id);await setDoc(doc(db,pr.tipo==='npc'?'npcs':'personagens',pr.id),{localizacaoCenarioId:cid,localizacaoMapaId:String((cenariosDB||[]).find(c=>String(c.id)===String(cid))?.mapaId||''),localizacaoMapaDefinidaV92:true,localizacaoAtualizadaEm:new Date().toISOString()},{merge:true});const e=entidadeV90_(pr.tipo==='npc'?refNpcV90_(pr.id):refCharV90_(pr.id));if(e){e.localizacaoCenarioId=cid;const alvo=(cenariosDB||[]).find(c=>String(c.id)===String(cid));e.localizacaoMapaId=String(alvo?.mapaId||'');e.localizacaoMapaDefinidaV92=true;if(alvo)await moverTokenParaMapaV92_(pr.tipo,e,alvo);}oldIds.delete(String(l.id));}for(const lost of oldIds){const pr=parseRefV90_(lost),e=entidadeV90_(pr.tipo==='npc'?refNpcV90_(pr.id):refCharV90_(pr.id));if(e&&locIdV90_(e)===cid){await setDoc(doc(db,pr.tipo==='npc'?'npcs':'personagens',pr.id),{localizacaoCenarioId:'',localizacaoMapaId:'',localizacaoMapaDefinidaV92:true,localizacaoAtualizadaEm:new Date().toISOString()},{merge:true});e.localizacaoCenarioId='';e.localizacaoMapaId='';e.localizacaoMapaDefinidaV92=true;await moverTokenParaMapaV92_(pr.tipo,e,{mapaId:''});}}await reconciliarCenariosLocalizacaoV90_();agendarSyncMapaV90_('editor');}catch(e){console.warn('Sincronizar localização do editor v90',e);}return r;
  };

  const renderCenarioMestreV90Base_=(typeof renderizarCenarioMestre_==='function')?renderizarCenarioMestre_:null;
  if(renderCenarioMestreV90Base_)renderizarCenarioMestre_=function(){const r=renderCenarioMestreV90Base_.apply(this,arguments);try{anexarPainelLocalizacaoMestreV90_();}catch(e){console.warn('painel localização mestre v90',e);}return r;};
  const renderPublicoV90Base_=(typeof renderizarCenarioAtualPublico_==='function')?renderizarCenarioAtualPublico_:null;
  if(renderPublicoV90Base_)renderizarCenarioAtualPublico_=function(){const r=renderPublicoV90Base_.apply(this,arguments);setTimeout(()=>{try{anexarLocalizacaoPublicaV90_();}catch(e){console.warn('localização pública v90',e);}},0);return r;};
  const iniciarCampanhaV90Base_=(typeof iniciarCampanhaPublica_==='function')?iniciarCampanhaPublica_:null;
  if(iniciarCampanhaV90Base_)iniciarCampanhaPublica_=function(){const r=iniciarCampanhaV90Base_.apply(this,arguments);iniciarCatalogoPublicoV90_();return r;};
  const carregarBancosV90Base_=(typeof carregarBancosDeDados==='function')?carregarBancosDeDados:null;
  if(carregarBancosV90Base_)carregarBancosDeDados=async function(){const r=await carregarBancosV90Base_.apply(this,arguments);if(userData?.role==='mestre'){await migrarLocalizacoesLegadasV90_();await migrarMapasLocalizacaoV92_();await reconciliarCenariosLocalizacaoV90_();iniciarObservadoresLocalizacaoV90_();}else iniciarCatalogoPublicoV90_();return r;};
  const carregarPersonagensV90Base_=(typeof carregarPersonagens==='function')?carregarPersonagens:null;
  if(carregarPersonagensV90Base_)carregarPersonagens=async function(){const r=await carregarPersonagensV90Base_.apply(this,arguments);if(userData?.role==='mestre'){await migrarLocalizacoesLegadasV90_();await migrarMapasLocalizacaoV92_();await reconciliarCenariosLocalizacaoV90_();iniciarObservadoresLocalizacaoV90_();}try{renderizarCenarioAtualPublico_();}catch(_){}return r;};
  const ativarCenarioV90Base_=window.ativarCenarioMestre;
  if(typeof ativarCenarioV90Base_==='function')window.ativarCenarioMestre=async function(){const r=await ativarCenarioV90Base_.apply(this,arguments);await publicarCatalogoCenariosV90_();agendarSyncMapaV90_('ativar');return r;};
  const openMapV90Base_=(typeof novaSyncController_!=='undefined'&&typeof novaSyncController_.openMap==='function')?novaSyncController_.openMap.bind(novaSyncController_):null;
  if(openMapV90Base_)novaSyncController_.openMap=async function(id){return await openMapV90Base_(id);};

  function iniciarV90_(){instalarEstilosV90_();iniciarCatalogoPublicoV90_();observarLocalizacaoPersonagemAtivoV92_();if(userData?.role==='mestre'){iniciarObservadoresLocalizacaoV90_();migrarMapasLocalizacaoV92_().catch(e=>console.warn('Migração multi-mapa v92',e));setTimeout(()=>{try{anexarPainelLocalizacaoMestreV90_();}catch(_){}},400);}setTimeout(()=>{try{anexarLocalizacaoPublicaV90_();}catch(_){}},500);}
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciarV90_,1100));else setTimeout(iniciarV90_,1100);}
  if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>setTimeout(()=>{try{observarLocalizacaoPersonagemAtivoV92_();renderizarCenarioAtualPublico_();}catch(_){}},40));
  // v100: operações internas de localização expostas somente para a camada cenário ↔ mapa.
  // Abrir um mapa como mestre continua sendo apenas navegação; transporte exige ação explícita.
  window.__mesaMoverEntidadeCenario_=moverEntidadeV90_;
  window.__mesaReconciliarCenarios_=reconciliarCenariosLocalizacaoV90_;
  window.__mesaPublicarCatalogoCenarios_=publicarCatalogoCenariosV90_;
  window.__mesaPersistirViagemCenario_=persistirViagemJogadorV91_;
  // Compatibilidade de marcadores históricos: v90-localizacao-dinamica · v91-localizacao-viagens · v92-multimapa-localizacao · v93-multimapa-localizacao · v94-movimento-multimapa
  console.info('[Mesa Estelar] v97 aprovação e layout de fichas carregados');
  window.__MESA_PATCH__='v97-aprovacao-layout';
})();


// ===== v98 · refinamentos de interface, objetivos e navegação =====
(function(){
  const V='v98-ui-objetivos-navegacao';
  function addStyleV98_(){
    if(document.getElementById('mesaV98Styles'))return;
    const st=document.createElement('style');st.id='mesaV98Styles';st.textContent=`
      /* Ficha: avisos descem para depois do botão Salvar, para não desalinharem avatar e atributos. */
      #charPostSaveMessagesV98{display:grid;gap:10px;margin-top:12px;}
      #charPostSaveMessagesV98>#masterCharacterControlBanner,
      #charPostSaveMessagesV98>#charProgressionBanner{margin:0!important;}
      #char-personagem .form-section .char-image-editor-v98{display:grid;grid-template-columns:140px minmax(260px,1fr);gap:16px;align-items:center;margin:8px 0 12px;}
      #char-personagem .char-image-editor-v98 .avatar{margin:0!important;}
      #char-personagem .char-image-editor-v98 .char-image-fields-v98{display:grid;gap:10px;}
      #char-personagem .char-image-editor-v98 .form-group{margin:0!important;}
      @media(max-width:720px){#char-personagem .form-section .char-image-editor-v98{grid-template-columns:1fr;}#editCharImagePreview{justify-self:center;}}
      /* Mapa da Mesa: controles de visualização no topo, sem subtítulo redundante. */
      #sincronizacao-nova>.form-section>p{display:none!important;}
      #novaSyncHistoryToggle{display:none!important;}
      #novaMapTopV68{justify-content:flex-end!important;margin-top:-2px!important;}
      #novaMapTopV68 .nova-map-title-v98{display:none!important;}
      #novaMapTopV68 #novaSyncFocus{height:34px!important;padding:5px 10px!important;font-size:13px!important;}
      #novaMapTopV68 #novaSyncPillV68{margin-left:0;}
      /* Regras: cards e tabelas mais regulares. */
      .regras-view{font-family:Arial,sans-serif!important;white-space:normal!important;line-height:1.62!important;background:rgba(8,12,29,.54)!important;border:1px solid rgba(0,212,255,.18)!important;border-radius:14px!important;padding:20px!important;}
      .regras-view h1,.regras-view h2,.regras-view h3{font-family:inherit!important;letter-spacing:.01em;}
      .regras-view h2{margin-top:20px!important;padding:10px 12px;border-radius:11px;background:linear-gradient(90deg,rgba(0,212,255,.12),rgba(155,89,182,.10));border:1px solid rgba(0,212,255,.20);}
      .regras-view h3{margin-top:16px!important;color:#8cf1ff!important;}
      .regras-view table{width:100%;border-collapse:collapse;margin:12px 0 18px;background:rgba(0,0,0,.18);border-radius:12px;overflow:hidden;}
      .regras-view th,.regras-view td{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08);vertical-align:top;}
      .regras-view th{background:rgba(0,212,255,.13);color:#e7fbff;text-align:left;}
      .regras-view tr:last-child td{border-bottom:0;}
      .regras-view ul,.regras-view ol{padding-left:1.25rem;}
      .regras-view p{margin:.55rem 0;max-width:1100px;}
      /* Objetivos de personagem. */
      .char-objectives-v98{margin:18px 0;padding:14px;border-radius:12px;background:rgba(255,215,0,.06);border:1px solid rgba(255,215,0,.20);}
      .char-objectives-v98 h3{margin:0 0 6px!important;color:#ffe071!important;}
      .char-objectives-v98 small{display:block;color:#b9aacd;margin-bottom:10px;}
      .char-objectives-v98 .objective-grid{display:grid;gap:8px;}
      .char-objectives-v98 input{margin:0!important;}
      /* Banco de itens: botões de imagem iguais aos objetos do mapa. */
      .item-image-tools-v98{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:7px 0;padding:8px 9px;border-radius:9px;background:rgba(0,0,0,.12);}
      .item-image-tools-v98 button{margin:0!important;}
    `;document.head.appendChild(st);
  }
  function moverAvisosFichaV98_(){
    const save=document.getElementById('saveCharacterBtn');if(!save)return;
    let box=document.getElementById('charPostSaveMessagesV98');
    if(!box){box=document.createElement('div');box.id='charPostSaveMessagesV98';save.insertAdjacentElement('afterend',box);}
    ['masterCharacterControlBanner','charProgressionBanner'].forEach(id=>{const el=document.getElementById(id);if(el&&el.parentElement!==box)box.appendChild(el);});
  }
  function reorganizarImagemFichaV98_(){
    const preview=document.getElementById('editCharImagePreview'),url=document.getElementById('editCharImage'),file=document.getElementById('editCharImageFile');
    if(!preview||!url||!file||document.getElementById('charImageEditorV98'))return;
    const gUrl=url.closest('.form-group'),gFile=file.closest('.form-group'),gPrev=preview.closest('.form-group');
    if(!gUrl||!gFile||!gPrev)return;
    const wrap=document.createElement('div');wrap.id='charImageEditorV98';wrap.className='char-image-editor-v98';
    const fields=document.createElement('div');fields.className='char-image-fields-v98';
    gUrl.parentElement.insertBefore(wrap,gUrl);
    wrap.appendChild(gPrev);wrap.appendChild(fields);fields.append(gUrl,gFile);
  }
  function ajustarMapaTopoV98_(){
    const top=document.getElementById('novaMapTopV68'),focus=document.getElementById('novaSyncFocus'),pill=document.getElementById('novaSyncPillV68'),hist=document.getElementById('novaSyncHistoryToggle');
    if(hist)hist.remove();
    if(top){
      [...top.childNodes].forEach(n=>{if(n.nodeType===1&&!['novaSyncFocus','novaSyncPillV68'].includes(n.id)){n.classList?.add('nova-map-title-v98');}});
      if(focus&&focus.parentElement!==top)top.insertBefore(focus,pill||top.firstChild);
      if(pill&&pill.parentElement!==top)top.appendChild(pill);
    }
  }
  function garantirObjetivosV98_(){
    const notes=document.getElementById('charAnotacoes');if(!notes||document.getElementById('charObjectivesV98'))return;
    const box=document.createElement('div');box.id='charObjectivesV98';box.className='char-objectives-v98';
    box.innerHTML=`<h3>🎯 Objetivos do personagem</h3><small>Anote até três objetivos atuais. Por enquanto eles são apenas registro narrativo; pontos e recompensas serão definidos depois.</small><div class="objective-grid"><input id="charObjetivo1" placeholder="Objetivo 1"><input id="charObjetivo2" placeholder="Objetivo 2"><input id="charObjetivo3" placeholder="Objetivo 3"></div>`;
    const eventosTitle=notes.parentElement?.querySelector('[data-i18n="specialEventsTitle"]');
    if(eventosTitle)notes.parentElement.insertBefore(box,eventosTitle);else notes.insertAdjacentElement('afterend',box);
  }
  function preencherAnotacoesV98_(char){
    if(!char)return;garantirObjetivosV98_();
    const a=document.getElementById('charAnotacoes'),e=document.getElementById('charEventos');
    if(a)a.value=char.anotacoes||'';if(e)e.value=char.eventos||'';
    const obj=Array.isArray(char.objetivosPersonagem)?char.objetivosPersonagem:(Array.isArray(char.objetivos)?char.objetivos:[]);
    for(let i=1;i<=3;i++){const el=document.getElementById('charObjetivo'+i);if(el)el.value=String(obj[i-1]||'');}
  }
  function instalarObjetivosSaveV98_(){
    if(window.salvarAnotacoes?.__v98)return;
    const base=window.salvarAnotacoes;
    window.salvarAnotacoes=async function(){
      if(!currentCharId)return;
      const anotacoes=document.getElementById('charAnotacoes')?.value||'';
      const eventos=document.getElementById('charEventos')?.value||'';
      const objetivos=[1,2,3].map(i=>document.getElementById('charObjetivo'+i)?.value||'');
      await setDoc(doc(db,'personagens',currentCharId),{anotacoes,eventos,objetivosPersonagem:objetivos},{merge:true});
      const c=(userCharacters||[]).find(x=>String(x.id)===String(currentCharId));if(c){c.anotacoes=anotacoes;c.eventos=eventos;c.objetivosPersonagem=objetivos;}
      try{somSalvar_();}catch(_){}
      if(typeof notificar_==='function')notificar_('Anotações e objetivos salvos.','sucesso',2400);else alert('Salvo!');
    };
    window.salvarAnotacoes.__v98=true;
  }
  async function itemImagemCanvasV98_(){
    const campo=document.getElementById('dbItemImagem');const src=String(campo?.value||'').trim();
    if(!src)throw new Error('Carregue ou informe uma imagem primeiro.');
    const im=new Image();if(/^https?:/i.test(src))im.crossOrigin='anonymous';
    await new Promise((res,rej)=>{im.onload=res;im.onerror=()=>rej(new Error('Não foi possível ler os pixels da imagem.'));im.src=src;});
    const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c;
  }
  async function itemAplicarCanvasV98_(canvas,msg){
    let c=canvas;if(typeof objMapaCropAlphaCanvasV64_==='function')c=objMapaCropAlphaCanvasV64_(c,6);
    const blob=await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Falha ao gerar PNG')),'image/png'));
    const file=new File([blob],`item_img_${Date.now()}.png`,{type:'image/png'});
    const url=await uploadImagemBanco_(file,'banco-itens');
    const campo=document.getElementById('dbItemImagem');if(campo)campo.value=url;
    window.atualizarPreviewItemBanco?.();notificar_(msg||'Imagem atualizada. Confira a prévia e salve o item.','sucesso',3600);
  }
  window.itemBancoCortarMargensV98_=async function(){
    if(userData?.role!=='mestre')return;try{notificar_('📐 Cortando margens transparentes...','info',1600);await itemAplicarCanvasV98_(await itemImagemCanvasV98_(),'Margens cortadas. Salve o item para gravar.');}catch(e){console.error('Cortar item',e);notificar_(e?.message||'Não foi possível cortar a imagem.','erro',5200);}
  };
  let itemMaskV98_=null;
  function itemMaskModalV98_(){
    let m=document.getElementById('itemMaskModalV98');if(m)return m;
    m=document.createElement('div');m.id='itemMaskModalV98';m.style.cssText='display:none;position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.72);padding:26px;overflow:auto;';
    m.innerHTML=`<div style="max-width:980px;margin:auto;background:#1b1730;color:#fff;border:1px solid rgba(0,212,255,.35);border-radius:14px;padding:18px;"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;"><h3 style="margin:0;color:#8cf1ff;">🧽 Limpeza manual do item</h3><button class="btn-small" id="itemMaskCloseV98">Fechar</button></div><p style="color:#bbb;margin:8px 0 12px;">Apague partes indesejadas ou restaure a imagem antes de salvar o item.</p><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;"><button type="button" class="btn-small btn-select" id="itemMaskEraseV98">Apagar</button><button type="button" class="btn-small" id="itemMaskRestoreV98">Restaurar</button><button type="button" class="btn-small" id="itemMaskUndoV98">Desfazer</button><button type="button" class="btn-small" id="itemMaskResetV98">Reset</button><label style="display:flex;align-items:center;gap:7px;margin:0;">Pincel <input id="itemMaskBrushV98" type="range" min="4" max="90" value="24" style="width:130px;margin:0;"></label></div><div style="display:flex;justify-content:center;align-items:center;min-height:340px;max-height:65vh;overflow:auto;border-radius:12px;border:1px solid rgba(255,255,255,.16);padding:16px;background-color:#d7d7d7;background-image:linear-gradient(45deg,#aaa 25%,transparent 25%),linear-gradient(-45deg,#aaa 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#aaa 75%),linear-gradient(-45deg,transparent 75%,#aaa 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0px;"><canvas id="itemMaskCanvasV98" style="max-width:100%;height:auto;touch-action:none;cursor:crosshair;box-shadow:0 0 0 1px rgba(0,0,0,.25);"></canvas></div><div style="display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap;margin-top:13px;"><button type="button" class="btn-small" id="itemMaskCancelV98">Cancelar</button><button type="button" class="btn-save" id="itemMaskApplyV98">✅ Aplicar e enviar</button></div></div>`;
    document.body.appendChild(m);
    const close=()=>{m.style.display='none';itemMaskV98_=null;};
    m.querySelector('#itemMaskCloseV98').onclick=close;m.querySelector('#itemMaskCancelV98').onclick=close;
    m.querySelector('#itemMaskEraseV98').onclick=()=>{if(itemMaskV98_)itemMaskV98_.modo='apagar';m.querySelector('#itemMaskEraseV98').classList.add('btn-select');m.querySelector('#itemMaskRestoreV98').classList.remove('btn-select');};
    m.querySelector('#itemMaskRestoreV98').onclick=()=>{if(itemMaskV98_)itemMaskV98_.modo='restaurar';m.querySelector('#itemMaskRestoreV98').classList.add('btn-select');m.querySelector('#itemMaskEraseV98').classList.remove('btn-select');};
    m.querySelector('#itemMaskUndoV98').onclick=()=>{const s=itemMaskV98_;if(s?.undo?.length)s.canvas.getContext('2d').putImageData(s.undo.pop(),0,0);};
    m.querySelector('#itemMaskResetV98').onclick=()=>{const s=itemMaskV98_;if(!s)return;const ctx=s.canvas.getContext('2d');s.undo.push(ctx.getImageData(0,0,s.canvas.width,s.canvas.height));ctx.clearRect(0,0,s.canvas.width,s.canvas.height);ctx.drawImage(s.original,0,0);};
    m.querySelector('#itemMaskApplyV98').onclick=async()=>{const s=itemMaskV98_;if(!s)return;try{await itemAplicarCanvasV98_(s.canvas,'Limpeza manual aplicada. Salve o item para gravar.');close();}catch(e){console.error('item manual',e);notificar_(e?.message||'Não foi possível aplicar a limpeza manual.','erro',5200);}};
    const canvas=m.querySelector('#itemMaskCanvasV98');let draw=false,last=null;
    const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*(canvas.width/Math.max(1,r.width)),y:(e.clientY-r.top)*(canvas.height/Math.max(1,r.height))};};
    const paint=(a,b)=>{const s=itemMaskV98_;if(!s)return;const ctx=s.canvas.getContext('2d'),brush=Math.max(2,Number(m.querySelector('#itemMaskBrushV98')?.value||24)),dist=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(dist/Math.max(1,brush*.24)));if(s.modo==='apagar'){ctx.save();ctx.globalCompositeOperation='destination-out';for(let i=0;i<=steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;ctx.beginPath();ctx.arc(x,y,brush/2,0,Math.PI*2);ctx.fill();}ctx.restore();}else{ctx.save();ctx.beginPath();for(let i=0;i<=steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;ctx.moveTo(x+brush/2,y);ctx.arc(x,y,brush/2,0,Math.PI*2);}ctx.clip();ctx.clearRect(0,0,s.canvas.width,s.canvas.height);ctx.drawImage(s.original,0,0);ctx.restore();}};
    canvas.addEventListener('pointerdown',e=>{if(!itemMaskV98_)return;canvas.setPointerCapture?.(e.pointerId);const ctx=canvas.getContext('2d');itemMaskV98_.undo.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(itemMaskV98_.undo.length>20)itemMaskV98_.undo.shift();draw=true;last=point(e);paint(last,last);e.preventDefault();});
    canvas.addEventListener('pointermove',e=>{if(!draw||!last)return;const p=point(e);paint(last,p);last=p;e.preventDefault();});
    const stop=e=>{draw=false;last=null;try{canvas.releasePointerCapture?.(e.pointerId);}catch(_){}};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
    return m;
  }
  window.itemBancoLimparManualV98_=async function(){
    if(userData?.role!=='mestre')return;try{const c=await itemImagemCanvasV98_();const m=itemMaskModalV98_(),canvas=m.querySelector('#itemMaskCanvasV98');canvas.width=c.width;canvas.height=c.height;canvas.getContext('2d').drawImage(c,0,0);const original=document.createElement('canvas');original.width=c.width;original.height=c.height;original.getContext('2d').drawImage(c,0,0);itemMaskV98_={canvas,original,modo:'apagar',undo:[]};m.style.display='block';}catch(e){console.error('Abrir limpeza item',e);notificar_(e?.message||'Não foi possível abrir a imagem.','erro',5200);}
  };
  function melhorarFerramentasItemV98_(){
    const tol=document.getElementById('dbItemBgTol');if(!tol||document.getElementById('itemImageToolsV98'))return;
    const bloco=tol.closest('div');if(!bloco)return;bloco.id='itemImageToolsV98';bloco.classList.add('item-image-tools-v98');
    if(!document.getElementById('dbItemTrimBtnV98')){const b=document.createElement('button');b.type='button';b.id='dbItemTrimBtnV98';b.className='btn-small';b.textContent='📐 Cortar margens transparentes';b.onclick=()=>window.itemBancoCortarMargensV98_();bloco.insertBefore(b,bloco.children[1]||null);}
    if(!document.getElementById('dbItemManualBtnV98')){const b=document.createElement('button');b.type='button';b.id='dbItemManualBtnV98';b.className='btn-small';b.textContent='🧽 Limpar manualmente';b.onclick=()=>window.itemBancoLimparManualV98_();bloco.insertBefore(b,bloco.children[2]||null);}
  }
  function instalarHistoricoAbasV98_(){
    if(window.__tabsHistoryV98)return;window.__tabsHistoryV98=true;let popping=false;
    const current=()=>document.querySelector('.tab-content.active')?.id||'ficha';
    try{history.replaceState({mesaTab:current()},'',location.href);}catch(_){ }
    const base=window.mostrarAba;
    if(typeof base==='function')window.mostrarAba=function(abaId,btn){const r=base.apply(this,arguments);if(!popping&&abaId&&document.getElementById(abaId)?.classList.contains('active')){try{history.pushState({mesaTab:abaId},'',location.href);}catch(_){}}return r;};
    window.addEventListener('popstate',ev=>{const id=ev.state?.mesaTab;if(!id||!document.getElementById(id))return;popping=true;try{const btn=[...document.querySelectorAll('.tab-btn')].find(b=>String(b.getAttribute('onclick')||'').includes(`'${id}'`)||String(b.getAttribute('onclick')||'').includes(`"${id}"`));window.mostrarAba(id,btn||null);}finally{popping=false;}});
  }
  function iniciarV98_(){addStyleV98_();moverAvisosFichaV98_();reorganizarImagemFichaV98_();ajustarMapaTopoV98_();garantirObjetivosV98_();instalarObjetivosSaveV98_();melhorarFerramentasItemV98_();instalarHistoricoAbasV98_();}
  const baseMostrarAba=window.mostrarAba;if(typeof baseMostrarAba==='function')window.mostrarAba=function(){const r=baseMostrarAba.apply(this,arguments);setTimeout(iniciarV98_,0);return r;};
  const baseSelecionar=window.selecionarPersonagem;if(typeof baseSelecionar==='function')window.selecionarPersonagem=async function(){const r=await baseSelecionar.apply(this,arguments);const c=(userCharacters||[]).find(x=>String(x.id)===String(currentCharId));preencherAnotacoesV98_(c);setTimeout(iniciarV98_,0);return r;};
  try{if(typeof atualizarVisualizacao==='function'){const baseAtualizar=atualizarVisualizacao;atualizarVisualizacao=function(data){const r=baseAtualizar.apply(this,arguments);preencherAnotacoesV98_(data);setTimeout(iniciarV98_,0);return r;};}}catch(e){console.warn('v98 hook atualizarVisualizacao',e);}
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarV98_);else iniciarV98_();setTimeout(iniciarV98_,350);setTimeout(iniciarV98_,1200);}
  console.info('[Mesa Estelar] '+V+' carregado');window.__MESA_PATCH__=V;
})();


// ===== v99 · Sorte como rerrolagem do último teste =====
(()=>{
  const V='v99-sorte-rerrolagem';
  console.info('[Mesa Estelar] '+V+' carregado');
  window.__MESA_PATCH__=V;
})();


// ===== v100 · Cenário ↔ mapa unificado (etapa 2) =====
(()=>{
  const V='v100-cenario-mapa-unificado';
  const MAP_PATH_V100_=['combatesAtivos','mapaMesaSyncDireta'];
  let sincronizandoV100_=false,timerV100_=null,tokenMapUnsubV100_=null,tokenMapProntoV100_=false;
  const tokenMapaAnteriorV100_=new Map();

  function chaveV100_(v){
    return normalizarTextoCombate_(String(v||''))
      .replace(/\b(?:mapa|cenario|cenário|v\d+|de|da|do|das|dos|a|o)\b/g,' ')
      .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,'_');
  }
  function mapasReaisV100_(){
    return (mapasDB||[]).filter(m=>m?.tipo!=='mapa-parte'&&!m?.hiddenMesaLive&&!String(m?.id||'').startsWith('__mesa_live__'));
  }
  function mapaPorIdV100_(id){return mapasReaisV100_().find(m=>String(m.id)===String(id||''))||null;}
  function cenarioPorMapaV100_(mapaId){if(window.__mesaCenarioParaMapaV156_)return window.__mesaCenarioParaMapaV156_(mapaId);return (cenariosDB||[]).find(c=>String(c.mapaId||'')===String(mapaId||''))||null;}
  function idMapaPadraoV100_(cenario){
    let base=`cenario_${String(cenario?.id||chaveV100_(cenario?.nome)||Date.now()).replace(/[^a-zA-Z0-9_-]+/g,'_')}`.toLowerCase(),id=base,n=2;
    while(mapaPorIdV100_(id))id=`${base}_${n++}`;
    return id;
  }
  // Ordem conservadora: vínculo explícito atual > backref exato > nome exato.
  // Não fazemos associação aproximada: se houver dúvida, criamos um mapa básico novo
  // e preservamos todos os mapas antigos sem apagá-los.
  function candidatoMapaV100_(cenario,usados){
    const mapas=mapasReaisV100_(),explicit=mapaPorIdV100_(cenario?.mapaId);
    if(explicit&&!usados.has(String(explicit.id)))return explicit;
    const back=mapas.find(m=>String(m.cenarioId||'')===String(cenario.id)&&!usados.has(String(m.id)));if(back)return back;
    const ck=chaveV100_(cenario?.nome||cenario?.id);
    if(!ck)return null;
    return mapas.find(m=>!usados.has(String(m.id))&&chaveV100_(m.nome||'')===ck)||null;
  }
  async function criarMapaPadraoV100_(cenario){
    const id=idMapaPadraoV100_(cenario),dados={
      id,nome:String(cenario?.nome||cenario?.id||'Cenário'),cenarioId:String(cenario?.id||''),
      larguraM:28,alturaM:18,pxPorMetro:32,fundo:'#303740',corGrade:'#697582',gradeVisivel:true,textura:'nenhuma',
      desenhos:[],objetos:[],formas:[],mapaPadraoCenarioV100:true,criadoPor:currentUserUid||'',atualizadoEm:new Date().toISOString()
    };
    const salvo=await labMapaSalvarFirestore_(dados,0);mapasDB.push(salvo);return salvo;
  }
  async function vincularMapaCenarioV100_(cenario,mapa){
    if(!cenario||!mapa)return {renomeado:false,vinculado:false};
    const nome=String(cenario.nome||cenario.id||mapa.nome||mapa.id),renomeado=String(mapa.nome||'')!==nome,vinculado=String(cenario.mapaId||'')!==String(mapa.id),backref=String(mapa.cenarioId||'')!==String(cenario.id);
    if(renomeado||backref){
      await setDoc(doc(db,'mapas',String(mapa.id)),{nome,cenarioId:String(cenario.id),atualizadoEm:new Date().toISOString()},{merge:true});
      mapa.nome=nome;mapa.cenarioId=String(cenario.id);
    }
    if(vinculado){await setDoc(doc(db,'cenarios',String(cenario.id)),{mapaId:String(mapa.id)},{merge:true});cenario.mapaId=String(mapa.id);}
    return {renomeado,vinculado};
  }
  async function limparBackrefsOrfaosV100_(pares){
    const desejado=new Map([...pares.entries()].map(([cid,mid])=>[String(mid),String(cid)])),jobs=[];
    for(const m of mapasReaisV100_()){
      const cid=String(m.cenarioId||'');if(!cid)continue;
      if(desejado.get(String(m.id))===cid)continue;
      // O mapa permanece intacto. Só retiramos o vínculo reverso obsoleto.
      jobs.push(setDoc(doc(db,'mapas',String(m.id)),{cenarioId:'',atualizadoEm:new Date().toISOString()},{merge:true}).then(()=>{m.cenarioId='';}));
    }
    if(jobs.length)await Promise.allSettled(jobs);
  }
  async function sincronizarEntidadesComMapasV100_(){
    if(userData?.role!=='mestre'||typeof window.__mesaMoverEntidadeCenario_!=='function')return 0;
    let n=0;
    for(const p of (userCharacters||[])){
      const cid=String(p.localizacaoCenarioId||''),c=(cenariosDB||[]).find(x=>String(x.id)===cid);if(!c?.mapaId)continue;
      if(String(p.localizacaoMapaId||'')!==String(c.mapaId)){await window.__mesaMoverEntidadeCenario_(`char:${p.id}`,cid,{silencioso:true});n++;}
    }
    for(const npc of (npcsDB||[])){
      const cid=String(npc.localizacaoCenarioId||''),c=(cenariosDB||[]).find(x=>String(x.id)===cid);if(!c?.mapaId)continue;
      if(String(npc.localizacaoMapaId||'')!==String(c.mapaId)){await window.__mesaMoverEntidadeCenario_(`npc:${npc.id}`,cid,{silencioso:true});n++;}
    }
    return n;
  }
  async function garantirMapasDosCenariosV100_({avisar=false}={}){
    if(userData?.role!=='mestre'||sincronizandoV100_||!(cenariosDB||[]).length)return;
    sincronizandoV100_=true;let criados=0,vinculos=0,renomeados=0;
    try{
      const usados=new Set(),pares=new Map();
      const lista=[...(cenariosDB||[])].sort((a,b)=>Number(!!b.mapaId)-Number(!!a.mapaId)||String(a.id).localeCompare(String(b.id)));
      for(const c of lista){
        let m=candidatoMapaV100_(c,usados);if(!m){m=await criarMapaPadraoV100_(c);criados++;}
        const r=await vincularMapaCenarioV100_(c,m);if(r.renomeado)renomeados++;if(r.vinculado)vinculos++;
        usados.add(String(m.id));pares.set(String(c.id),String(m.id));
      }
      await limparBackrefsOrfaosV100_(pares);
      const relocados=await sincronizarEntidadesComMapasV100_();
      try{await window.__mesaReconciliarCenarios_?.();}catch(_){}
      try{await window.__mesaPublicarCatalogoCenarios_?.();}catch(_){}
      try{renderizarBancoCenarios();renderizarBancoMapas_();labAtualizarSelectMapas_();sincronizarSelectMapaDiretoV78_();}catch(_){}
      if(avisar)notificar_(`🗺️ Cenários e mapas sincronizados: ${criados} mapa(s) básico(s) criado(s), ${vinculos} vínculo(s) corrigido(s), ${renomeados} nome(s) alinhado(s)${relocados?`, ${relocados} entidade(s) reposicionada(s)`:''}. Nenhum mapa foi apagado.`,'sucesso',7000);
    }catch(e){console.error('Cenário ↔ mapa v100',e);if(avisar)notificar_('Não foi possível sincronizar cenários e mapas: '+(e?.message||e),'erro',7000);}
    finally{sincronizandoV100_=false;}
  }
  function agendarMapasCenariosV100_(avisar=false){clearTimeout(timerV100_);timerV100_=setTimeout(()=>garantirMapasDosCenariosV100_({avisar}),350);}
  window.sincronizarCenariosMapasV100_=()=>garantirMapasDosCenariosV100_({avisar:true});

  function ajustarEditorMapaCenarioV100_(){
    const sel=document.getElementById('dbScenarioMapaId');if(!sel)return;
    sel.disabled=true;sel.title='O vínculo de mapa é automático e exclusivo deste cenário.';
    const group=sel.closest('.form-group'),small=group?.querySelector('small');
    if(small)small.textContent='Automático: todo cenário possui um mapa próprio. Se não houver um mapa vinculado, o sistema cria um quadriculado básico com o mesmo nome. Mapas existentes nunca são apagados.';
  }
  const preencherCenarioV100Base_=(typeof preencherModalCenarioBanco_==='function')?preencherModalCenarioBanco_:null;
  if(preencherCenarioV100Base_)preencherModalCenarioBanco_=function(){const r=preencherCenarioV100Base_.apply(this,arguments);setTimeout(ajustarEditorMapaCenarioV100_,0);return r;};
  const salvarCenarioV100Base_=window.salvarCenarioBancoModal;
  if(typeof salvarCenarioV100Base_==='function')window.salvarCenarioBancoModal=async function(){
    const r=await salvarCenarioV100Base_.apply(this,arguments);if(userData?.role==='mestre')await garantirMapasDosCenariosV100_({avisar:false});return r;
  };
  const removerCenarioV100Base_=window.removerCenarioBanco;
  if(typeof removerCenarioV100Base_==='function')window.removerCenarioBanco=async function(){const r=await removerCenarioV100Base_.apply(this,arguments);if(userData?.role==='mestre')agendarMapasCenariosV100_(false);return r;};

  window.trazerJogadoresParaCenarioV100_=async function(cenarioId){
    if(userData?.role!=='mestre')return;await garantirMapasDosCenariosV100_({avisar:false});
    const cid=String(cenarioId||''),c=(cenariosDB||[]).find(x=>String(x.id)===cid);if(!c)return;
    try{
      const us=await getDocs(collection(db,'usuarios')),ids=new Set();us.forEach(d=>{const id=String(d.data()?.personagemAtivo||'');if(id)ids.add(id);});
      const ativos=(userCharacters||[]).filter(ch=>ids.has(String(ch.id))&&personagemAtivoCampanhaV102_(ch));if(!ativos.length)return notificar_('Nenhum jogador possui personagem ativo selecionado.','aviso');
      if(!confirm(`Trazer ${ativos.length} personagem(ns) ativo(s) para “${c.nome||c.id}” e para o mapa vinculado?\n\n${ativos.map(x=>x.nome||x.id).join(', ')}`))return;
      for(const ch of ativos)await window.__mesaMoverEntidadeCenario_?.(`char:${ch.id}`,cid,{silencioso:true});
      await window.__mesaReconciliarCenarios_?.();
      notificar_(`👥 ${ativos.length} personagem(ns) foram trazidos para ${c.nome||c.id}. Cenário Atual e Mapa da Mesa acompanharão a localização individual de cada ficha.`,'sucesso',5600);
    }catch(e){console.error('Trazer jogadores ao cenário v100',e);notificar_('Não foi possível trazer os jogadores: '+(e?.message||e),'erro',6500);}
  };
  function anexarBotaoTrazerCenarioV100_(){
    if(userData?.role!=='mestre')return;const c=typeof obterCenarioSelecionadoMestre_==='function'?obterCenarioSelecionadoMestre_():null,box=document.getElementById('gmLocationV90');if(!c||!box||box.querySelector('#v100BringPlayers'))return;
    const controls=document.createElement('div');controls.className='v100-scenario-map-actions';controls.innerHTML=`<button id="v100BringPlayers" type="button" class="btn-small btn-select" onclick="trazerJogadoresParaCenarioV100_('${String(c.id).replace(/'/g,"\\'")}')">👥 Trazer jogadores</button><button type="button" class="btn-small" onclick="abrirMapaVinculadoCenarioV80_('${String(c.id).replace(/'/g,"\\'")}')">🗺️ Abrir mapa</button><span>🗺️ ${escaparHtmlInventario_(c.nome||c.id)}</span>`;
    box.insertBefore(controls,box.children[1]||null);
  }
  const renderCenarioMestreV100Base_=(typeof renderizarCenarioMestre_==='function')?renderizarCenarioMestre_:null;
  if(renderCenarioMestreV100Base_)renderizarCenarioMestre_=function(){const r=renderCenarioMestreV100Base_.apply(this,arguments);setTimeout(anexarBotaoTrazerCenarioV100_,0);return r;};

  // Se uma miniatura mudar de mapa por qualquer ferramenta do mestre, a ficha passa
  // automaticamente para o cenário dono daquele mapa. Movimento dentro do mesmo mapa
  // não dispara nada. Esta ponte também prepara o caminho para portas entre mapas.
  async function sincronizarEntidadePeloMapaV100_(docId,mapaId){
    if(userData?.role!=='mestre'||!mapaId)return;const c=cenarioPorMapaV100_(mapaId);if(!c)return;
    let raw='';try{raw=decodeURIComponent(String(docId||''));}catch(_){raw=String(docId||'');}
    let ref='';if(raw.startsWith('syncnpc:'))ref='npc:'+raw.slice(8).split('~')[0];else if(raw.startsWith('sync'))return;else ref='char:'+raw;
    const ent=ref.startsWith('npc:')?(npcsDB||[]).find(n=>String(n.id)===ref.slice(4)):(userCharacters||[]).find(p=>String(p.id)===ref.slice(5));if(!ent)return;
    if(String(ent.localizacaoCenarioId||'')===String(c.id)&&String(ent.localizacaoMapaId||'')===String(mapaId))return;
    await window.__mesaMoverEntidadeCenario_?.(ref,String(c.id),{silencioso:true});
  }
  function iniciarObservadorMapaParaCenarioV100_(){
    if(userData?.role!=='mestre'||tokenMapUnsubV100_)return;
    tokenMapUnsubV100_=onSnapshot(collection(db,...MAP_PATH_V100_,'posicoes'),snap=>{
      const primeira=!tokenMapProntoV100_;
      for(const d of snap.docs){const mapId=String(d.data()?.mapaId||''),old=tokenMapaAnteriorV100_.get(d.id);tokenMapaAnteriorV100_.set(d.id,mapId);if(!primeira&&old!==undefined&&old!==mapId)sincronizarEntidadePeloMapaV100_(d.id,mapId).catch(e=>console.warn('Mapa → cenário v100',e));}
      tokenMapProntoV100_=true;
    },e=>console.warn('Observer mapa → cenário v100',e));
  }
  // Gancho para a próxima etapa (portas): mover para um mapa conhecido já equivale
  // a viajar para o cenário correspondente e usa as mesmas regras de persistência.
  window.viajarPersonagemParaMapaV100_=async function(mapaId){
    if(userData?.role==='mestre')return false;const char=obterPersonagemAtual_(),c=cenarioPorMapaV100_(mapaId);if(!char||!c)return false;
    if(typeof window.__mesaPersistirViagemCenario_==='function')return await window.__mesaPersistirViagemCenario_(char,String(c.id),{voltar:false});
    return false;
  };

  function addStyleV100_(){if(document.getElementById('mesaV100Styles'))return;const s=document.createElement('style');s.id='mesaV100Styles';s.textContent=`
    .v100-scenario-map-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0 12px;padding:9px 10px;border-radius:9px;background:rgba(0,212,255,.055);border:1px solid rgba(0,212,255,.16)}
    .v100-scenario-map-actions span{color:#8fa8bc;font-size:.84rem;margin-left:auto}
    #dbScenarioMapaId:disabled{opacity:.82;cursor:not-allowed;background:rgba(255,255,255,.035)}
  `;document.head.appendChild(s);}
  const carregarBancosV100Base_=(typeof carregarBancosDeDados==='function')?carregarBancosDeDados:null;
  if(carregarBancosV100Base_)carregarBancosDeDados=async function(){const r=await carregarBancosV100Base_.apply(this,arguments);if(userData?.role==='mestre'){iniciarObservadorMapaParaCenarioV100_();await garantirMapasDosCenariosV100_({avisar:false});}return r;};
  const carregarPersonagensV100Base_=(typeof carregarPersonagens==='function')?carregarPersonagens:null;
  if(carregarPersonagensV100Base_)carregarPersonagens=async function(){const r=await carregarPersonagensV100Base_.apply(this,arguments);if(userData?.role==='mestre'){iniciarObservadorMapaParaCenarioV100_();agendarMapasCenariosV100_(false);}return r;};
  function iniciarV100_(){addStyleV100_();ajustarEditorMapaCenarioV100_();if(userData?.role==='mestre'){iniciarObservadorMapaParaCenarioV100_();agendarMapasCenariosV100_(false);}setTimeout(anexarBotaoTrazerCenarioV100_,350);}
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciarV100_,1350));else setTimeout(iniciarV100_,1350);}
  console.info('[Mesa Estelar] '+V+' carregado');window.__MESA_PATCH__=V;
})();

// ===== v101 · comércio de cenário: Avaliação + negociação separada de compra/venda =====
(()=>{
  const V='v101-comercio-avaliacao';
  // Alguns testes unitários carregam apenas a cauda do app em isolamento.
  // Nesses contextos o módulo de comércio não existe e esta camada deve ficar inerte.
  if(typeof periciasNegociacaoLocal_!=='function'||typeof estadoNegV73_!=='function'||typeof renderComercioCenarioV73_!=='function')return;

  // Avaliação passa a ser uma perícia legítima para negociar valor, ao lado das
  // perícias sociais já usadas pelo sistema. Isso vale para Mercado Local e NPCs.
  const periciasNegociacaoV101Base_=periciasNegociacaoLocal_;
  periciasNegociacaoLocal_=function(char){
    const ids=['comercio','avaliacao','influencia','submundo'];
    return ids.map(id=>{
      const p=(periciasDB||[]).find(x=>String(x.id)===id);if(!p)return null;
      const val=obterValorRegistroPericia_(char,p.id,false);
      return {p,val};
    }).filter(x=>x&&x.val>0);
  };

  // O efeito da negociação agora é persistido junto do limite diário. Assim,
  // recarregar a página não apaga um desconto já obtido enquanto mantém a perícia usada.
  const estadoNegV101Base_=estadoNegV73_;
  estadoNegV73_=function(charId,merchantId){
    const emMemoria=estadoNegV101Base_(charId,merchantId);if(emMemoria)return emMemoria;
    const char=obterPersonagemAtual_();if(!char||String(char.id)!==String(charId))return null;
    const st=comercioBarganhaEstadoPersistenteV77_(char,merchantId);
    return st?.modificadores&&typeof st.modificadores==='object'?st.modificadores:null;
  };

  function alvoNegociacaoV101_(){
    const v=String(document.getElementById('cenarioComercioObjetivoV101')?.value||'compra');
    return v==='venda'?'venda':'compra';
  }
  function textoAlvoV101_(alvo){return alvo==='venda'?'vender mais caro':'comprar mais barato';}
  function resumoNegV101_(state,alvo){
    const x=state?.[alvo+'Resumo'];
    if(x)return x;
    const mult=Number(state?.[alvo+'Mult']||1);
    if(Math.abs(mult-1)<.001)return alvo==='venda'?'Preço normal de venda.':'Preço normal de compra.';
    const pct=Math.round(Math.abs(mult-1)*100);
    return alvo==='venda'?`Venda ${pct}% melhor.`:`Compra ${pct}% mais barata.`;
  }

  // Substitui apenas a resolução da barganha de NPC. O restante do mercado,
  // estoque, compra, venda, serviços e limites diários permanece o mesmo.
  window.rolarBarganhaCenarioV73_=async function(id){
    const m=comerciantePublicoPorIdV73_(id),char=obterPersonagemAtual_();if(!m||!char||!m.barganha)return;
    const pid=String(document.getElementById('cenarioComercioSkillV73')?.value||''),p=(periciasDB||[]).find(x=>String(x.id)===pid);if(!p)return;
    const alvo=alvoNegociacaoV101_();
    if(alvo==='venda'&&!m.compraJogador){notificar_('Este comerciante não compra itens dos personagens.','aviso');return;}
    const status=comercioNpcDiaV77_(char,m.id,true);
    if(status.bloqueado){notificar_('Uma falha crítica encerrou as tentativas de barganha com este comerciante neste dia.','aviso',5200);return;}
    if(status.usadas?.[pid]){notificar_('Esta perícia já foi usada para barganhar com este comerciante hoje.','aviso',4200);return;}

    const bruto=obterValorRegistroPericia_(char,p.id,false),arm=valorPericiaComArmadura_(char,p,bruto),aj=aplicarDificuldadeEFadiga_(char,arm.valor,'padrao',0);
    if(aj.bloqueado){notificar_('A fadiga impede a negociação.','aviso');return;}
    const rollP=Math.floor(Math.random()*100)+1,rollN=Math.floor(Math.random()*100)+1;
    const rp=classificarD100_(aj.valor,rollP),rn=classificarD100_(Math.max(1,Number(m.resistencia||50)),rollN),venceu=comercioResultadoOpostoV73_(rp,rn);
    const anterior=estadoNegV73_(char.id,m.id)||{};
    let compraMult=Number(anterior.compraMult||1),vendaMult=Number(anterior.vendaMult||1),txt='Sem alteração de preço.';
    let compraResumo=anterior.compraResumo||'',vendaResumo=anterior.vendaResumo||'';
    const fiasco=/fiasco|falha crítica|falha critica/i.test(String(rp.grau||''));

    if(venceu){
      const crit=rp.grau==='Crítico';
      if(alvo==='compra'){
        const novo=crit?.80:.90;compraMult=Math.min(compraMult,novo);
        txt=crit?'Excelente acordo: 20% de desconto nas compras.':'Acordo favorável: 10% de desconto nas compras.';
        compraResumo=`${getNome(p)}: ${crit?'20%':'10%'} de desconto.`;
      }else{
        const novo=crit?1.20:1.10;vendaMult=Math.max(vendaMult,novo);
        txt=crit?'Excelente acordo: você recebe 20% a mais nas vendas.':'Acordo favorável: você recebe 10% a mais nas vendas.';
        vendaResumo=`${getNome(p)}: ${crit?'20%':'10%'} a mais na venda.`;
      }
    }else if(fiasco){
      txt=`Falha crítica ao tentar ${textoAlvoV101_(alvo)}: a negociação azedou e novas tentativas ficam bloqueadas hoje.`;
    }else{
      txt=`A tentativa de ${textoAlvoV101_(alvo)} não mudou os preços.`;
    }

    status.usadas[pid]={em:new Date().toISOString(),grau:String(rp.grau||''),roll:rollP,valor:aj.valor,objetivo:alvo};
    if(fiasco){status.bloqueado=true;status.fiasco=true;status.bloqueadoEm=new Date().toISOString();}
    const estado={compraMult,vendaMult,compraResumo,vendaResumo,player:{roll:rollP,valor:aj.valor,grau:rp.grau,pericia:getNome(p),objetivo:alvo},npc:{roll:rollN,valor:Number(m.resistencia||50),grau:rn.grau},txt};
    comercioCenarioNegociacaoV73_[chaveNegV73_(char.id,m.id)]=estado;
    status.modificadores={...estado};
    try{await salvarComercioDiarioV77_(char);}catch(e){console.warn('Salvar negociação v101',e);}
    somDado_();renderComercioCenarioV73_(id);
    notificar_(`${getNome(p)} ${rollP}/${aj.valor} × comerciante ${rollN}/${m.resistencia}: ${txt}`,'info',6500);
  };

  // Acrescenta o objetivo da negociação sem reescrever todo o modal existente.
  const renderComercioV101Base_=renderComercioCenarioV73_;
  renderComercioCenarioV73_=function(id){
    const r=renderComercioV101Base_.apply(this,arguments);
    setTimeout(()=>{
      const sel=document.getElementById('cenarioComercioSkillV73');if(!sel)return;
      const m=comerciantePublicoPorIdV73_(id),linha=sel.parentElement;if(!linha)return;
      let alvo=document.getElementById('cenarioComercioObjetivoV101');
      if(!alvo){
        alvo=document.createElement('select');alvo.id='cenarioComercioObjetivoV101';
        alvo.innerHTML=`<option value="compra">🛒 Comprar mais barato</option>${m?.compraJogador?'<option value="venda">💰 Vender mais caro</option>':''}`;
        const btn=linha.querySelector('button[onclick*="rolarBarganhaCenarioV73"]');linha.insertBefore(alvo,btn||null);
        if(btn)btn.textContent='🎲 Negociar';
      }
      const char=obterPersonagemAtual_(),st=char?estadoNegV73_(char.id,id):null;
      let info=linha.parentElement?.querySelector('.comercio-v101-resumo');
      if(!info){info=document.createElement('div');info.className='comercio-v101-resumo';linha.parentElement?.appendChild(info);}
      if(info)info.innerHTML=`<span>Compra: ${escaparHtmlInventario_(resumoNegV101_(st,'compra'))}</span><span>Venda: ${escaparHtmlInventario_(resumoNegV101_(st,'venda'))}</span><small>Avaliação, Comércio, Influência e Submundo podem ser usados. Cada perícia só pode tentar uma vez por comerciante em cada dia de campanha.</small>`;
    },0);
    return r;
  };

  function addStyleV101_(){if(document.getElementById('mesaV101Styles'))return;const s=document.createElement('style');s.id='mesaV101Styles';s.textContent=`
    #cenarioComercioObjetivoV101{min-width:190px}
    .comercio-v101-resumo{display:flex;gap:8px 14px;flex-wrap:wrap;margin-top:7px;padding:7px 9px;border-radius:7px;background:rgba(0,212,255,.045);border:1px solid rgba(0,212,255,.13);color:#b9d6e6;font-size:.84em}
    .comercio-v101-resumo small{flex-basis:100%;color:#879bac;line-height:1.35}
  `;document.head.appendChild(s);}
  if(typeof document!=='undefined'){addStyleV101_();}
  console.info('[Mesa Estelar] '+V+' carregado');window.__MESA_PATCH__=V;
})();

// ===== v102 · mapa/cenário realmente acoplados + interface compacta + desenho colaborativo =====
(()=>{
  const V='v102-mapa-cenario-desenho-inativos';
  // Alguns testes carregam somente partes do app sem montar a Mesa.
  if(typeof novaSyncController_==='undefined')return;
  let groupStop=null,syncGuard=false;
  const WORLD_DOC='localizacoesMundoV90';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  function scenarioForMap(id){
    const mid=String(id||'');if(!mid)return null;
    const map=(mapasDB||[]).find(m=>String(m.id)===mid);
    // v156: vários cenários podem apontar para o mesmo mapa (ex.: Pavilhão de Custódia e Câmara). Vale o que o mapa indica,
    // depois o de mesmo nome do mapa; só então o primeiro da lista.
    const todos=(cenariosDB||[]).filter(c=>String(c.mapaId||'')===mid);
    const kn=norm(map?.nome||''),porId=map?.cenarioId?(cenariosDB||[]).find(c=>String(c.id)===String(map.cenarioId)):null;
    if(porId&&(!porId.mapaId||String(porId.mapaId)===mid))return porId;
    const porNome=kn?(cenariosDB||[]).find(c=>norm(c.nome||'')===kn&&(!c.mapaId||String(c.mapaId)===mid)):null;if(porNome)return porNome;
    if(todos.length)return todos.find(c=>kn&&(kn.includes(norm(c.nome||''))||norm(c.nome||'').includes(kn)))||todos[0];
    if(map?.cenarioId){const back=(cenariosDB||[]).find(c=>String(c.id)===String(map.cenarioId));if(back)return back;}
    const key=norm(map?.nome||'');return key?(cenariosDB||[]).find(c=>norm(c.nome||'')===key)||null:null;
  }
  // v154: mapa é o local — cenário de verdade se houver, senão o próprio mapa (mapa:<id>).
  window.__mesaLocalDoMapaV154_=id=>{const c=scenarioForMap(id);return c?String(c.id):'mapa:'+String(id||'');};
  window.__mesaCenarioParaMapaV156_=scenarioForMap;
  function mapForScenario(c){return c?.mapaId?(mapasDB||[]).find(m=>String(m.id)===String(c.mapaId))||null:null;}
  async function setGroupFallback(c,mapId){
    if(!c||!mapId)return;
    v102GroupLocation_={mapaId:String(mapId),cenarioId:String(c.id),atualizadoEm:new Date().toISOString()};
    await setDoc(doc(db,'configuracoes',WORLD_DOC),{...v102GroupLocation_,atualizadoPor:currentUserUid||''},{merge:true});
  }
  function watchGroupFallback(){
    if(groupStop)return;
    groupStop=onSnapshot(doc(db,'configuracoes',WORLD_DOC),snap=>{
      const d=snap.exists()?snap.data()||{}:{};
      v102GroupLocation_={mapaId:String(d.mapaId||''),cenarioId:String(d.cenarioId||''),atualizadoEm:String(d.atualizadoEm||'')};
      if(userData?.role!=='mestre'){
        const ch=typeof obterPersonagemAtual_==='function'?obterPersonagemAtual_():null;
        if(ch&&!String(ch.localizacaoMapaId||''))try{novaSyncController_?.refreshView?.();}catch(_){}
        if(ch&&!String(ch.localizacaoCenarioId||''))try{renderizarCenarioAtualPublico_();}catch(_){}
      }
    },e=>console.warn('fallback coletivo v102',e));
  }

  // Abrir um mapa muda o contexto do mestre para o cenário dono daquele mapa,
  // mas não transporta nenhuma miniatura.
  const openBase=novaSyncController_?.openMap?.bind(novaSyncController_);
  if(openBase)novaSyncController_.openMap=async function(id){
    const ownGuard=userData?.role==='mestre'&&!syncGuard;if(ownGuard)syncGuard=true;
    try{
      const r=await openBase(id);
      if(userData?.role==='mestre'&&ownGuard){
        const c=scenarioForMap(id);
        if(c&&String(estadoCampanhaMestre?.cenarioId||'')!==String(c.id))await ativarCenarioSemTrocarMapaV80_(c);
        else if(c){cenarioSelecionadoMestreId_=String(c.id);try{renderizarCenarioMestre_();}catch(_){}}
      }
      return r;
    }finally{if(ownGuard)syncGuard=false;}
  };
  window.addEventListener('mesa-mapa-aberto-v102',ev=>{
    if(userData?.role!=='mestre'||syncGuard)return;const c=scenarioForMap(ev.detail?.mapaId);if(!c)return;
    syncGuard=true;Promise.resolve(ativarCenarioSemTrocarMapaV80_(c)).catch(e=>console.warn('mapa → cenário v102',e)).finally(()=>{syncGuard=false;});
  });

  // Selecionar/ativar um cenário também muda a câmera do mestre para seu mapa,
  // sem mover jogadores. A localização dos jogadores continua individual.
  const selectBase=window.selecionarCenarioMestre;
  if(typeof selectBase==='function')window.selecionarCenarioMestre=function(id){
    const r=selectBase.apply(this,arguments);const c=(cenariosDB||[]).find(x=>String(x.id)===String(id));
    if(userData?.role==='mestre'&&c?.mapaId&&!syncGuard){syncGuard=true;Promise.resolve(novaSyncController_.openMap(String(c.mapaId))).catch(e=>console.warn('cenário → mapa v102',e)).finally(()=>{syncGuard=false;});}
    return r;
  };
  const activateBase=window.ativarCenarioMestre;
  if(typeof activateBase==='function')window.ativarCenarioMestre=async function(){
    const c=typeof obterCenarioSelecionadoMestre_==='function'?obterCenarioSelecionadoMestre_():null;
    const r=await activateBase.apply(this,arguments);
    if(userData?.role==='mestre'&&c?.mapaId&&!syncGuard){try{syncGuard=true;await novaSyncController_.openMap(String(c.mapaId));}finally{syncGuard=false;}}
    return r;
  };

  // Substitui o transporte pelo mapa por uma versão explícita que sempre grava
  // os dois lados da localização e também o fallback coletivo para fichas ainda sem posição.
  // v154: quem chega a um mapa aparece na saída que liga ao mapa de onde veio (ou no meio do mapa), num ponto livre,
  // nunca no canto/dentro da rocha.
  // Caminho pelas ligações: de qual mapa vizinho se chega a 'alvo' vindo de 'origem' (busca em largura).
  function prevV154_(ligs,origem,alvo){
    if(!origem||origem===alvo)return '';const viz=new Map();
    for(const l of ligs){const a=String(l?.a?.mapa||''),b=String(l?.b?.mapa||'');if(!a||!b)continue;(viz.get(a)||viz.set(a,[]).get(a)).push(b);(viz.get(b)||viz.set(b,[]).get(b)).push(a);}
    const prev=new Map([[origem,'']]),fila=[origem];
    while(fila.length){const x=fila.shift();if(x===alvo)return prev.get(x)||'';for(const y of viz.get(x)||[])if(!prev.has(y)){prev.set(y,x);fila.push(y);}}
    return '';
  }
  async function chegadaV154_(mapId,chegando,antes){
    if(!chegando.length)return;
    const L=await import('./mesa-ligacoes.js?v=154');
    const ls=await getDoc(doc(db,'combatesAtivos','mesaLigacoes')),ligs=(ls.exists()?ls.data()?.ligacoes:[])||[];
    const lado=l=>String(l?.a?.mapa)===mapId?{aqui:l.a,la:l.b}:String(l?.b?.mapa)===mapId?{aqui:l.b,la:l.a}:null;
    const minhas=ligs.map(lado).filter(Boolean);
    const ativa=await getDoc(doc(db,'combatesAtivos','mapaMesaSyncDiretaCena'));let cena=ativa.exists()?ativa.data():null;
    if(String(cena?.mapId||'')!==mapId){const ar=await getDoc(doc(db,'combatesAtivos','mapaMesaSyncCena_'+mapId));cena=ar.exists()?ar.data():null;}
    const objs=Array.isArray(cena?.objects)?cena.objects:[],m=(mapasDB||[]).find(x=>String(x.id)===mapId)||{},W=Number(m.larguraM)||28,H=Number(m.alturaM)||14;
    const ocupados=[];let i=0;
    for(const ch of chegando){
      const de=antes.get(String(ch.id))||'',viz=prevV154_(ligs,de,mapId),lig=minhas.find(x=>String(x.la?.mapa)===de)||(viz&&minhas.find(x=>String(x.la?.mapa)===viz))||minhas[0];
      const sx=Number(lig?.aqui?.x),sy=Number(lig?.aqui?.y),dd=Math.hypot(14-sx,(7-sy)*2)||1,base=lig?{x:Math.max(.9,Math.min(27.1,sx+(14-sx)/dd*1.6)),y:Math.max(.9,Math.min(13.1,sy+(7-sy)/dd*1.6))}:{x:14,y:7};
      const off=[[0,0],[1.1,0],[-1.1,0],[0,1.1],[0,-1.1],[1.1,1.1],[-1.1,1.1],[1.1,-1.1],[-1.1,-1.1]][i%9];i++;
      let q=L.livrePerto(objs,base.x+off[0]*28/W*2,base.y+off[1]*14/H*2,W,H);
      for(let k=0;k<6&&ocupados.some(o=>Math.hypot(o.x-q.x,o.y-q.y)<.9);k++)q=L.livrePerto(objs,q.x+.9,q.y,W,H);
      ocupados.push(q);
      const ref=doc(db,'combatesAtivos','mapaMesaSyncDireta','posicoes',encodeURIComponent(String(ch.id))),old=(await getDoc(ref)).data()||{};
      await setDoc(ref,{mapaId:mapId,x:+q.x.toFixed(3),y:+q.y.toFixed(3),revision:Number(old.revision||0)+1},{merge:true});
    }
  }
  window.trazerPersonagensAtivosMapaV92_=async function(){
    if(userData?.role!=='mestre')return;
    try{
      const s=await getDoc(doc(db,'combatesAtivos','mapaMesaSyncDireta')),mapId=String(s.data()?.mapId||'');
      if(!mapId)return notificar_('Abra primeiro o mapa de destino.','aviso');
      const c=scenarioForMap(mapId)||window.__mesaCenarioDeMapaV154_?.('mapa:'+mapId);if(!c)return notificar_('Mapa não encontrado.','aviso',6000);
      const us=await getDocs(collection(db,'usuarios')),ids=new Set();us.forEach(d=>{const id=String(d.data()?.personagemAtivo||'');if(id)ids.add(id);});
      const ativos=(userCharacters||[]).filter(ch=>ids.has(String(ch.id))&&personagemAtivoCampanhaV102_(ch));if(!ativos.length)return notificar_('Nenhum usuário possui personagem ativo selecionado.','aviso');
      if(!confirm(`Trazer ${ativos.length} personagem(ns) ativo(s) para “${c.nome||c.id}”?\n\n${ativos.map(x=>x.nome||x.id).join(', ')}`))return;
      const POSP=['combatesAtivos','mapaMesaSyncDireta','posicoes'],antes=new Map();
      for(const ch of ativos){try{const ps=await getDoc(doc(db,...POSP,encodeURIComponent(String(ch.id))));antes.set(String(ch.id),String(ps.data()?.mapaId||ch.localizacaoMapaId||''));}catch(_){antes.set(String(ch.id),String(ch.localizacaoMapaId||''));}}
      for(const ch of ativos)await window.__mesaMoverEntidadeCenario_?.(`char:${ch.id}`,String(c.id),{silencioso:true});
      try{await chegadaV154_(mapId,ativos.filter(ch=>antes.get(String(ch.id))!==String(mapId)),antes);}catch(e){console.warn('chegada v154',e);}
      await setGroupFallback(c,mapId);await window.__mesaReconciliarCenarios_?.();
      notificar_(`📍 ${ativos.length} personagem(ns) foram trazidos para ${c.nome||c.id}.`,'sucesso',5200);
    }catch(e){console.error('Trazer ativos v102',e);notificar_('Não foi possível trazer os personagens: '+(e?.message||e),'erro',6500);}
  };

  window.trazerJogadoresParaCenarioV100_=async function(cenarioId){
    if(userData?.role!=='mestre')return;
    const c=(cenariosDB||[]).find(x=>String(x.id)===String(cenarioId));if(!c)return;
    const map=mapForScenario(c);if(!map)return notificar_('Este cenário ainda não possui mapa vinculado.','aviso');
    try{
      const us=await getDocs(collection(db,'usuarios')),ids=new Set();us.forEach(d=>{const id=String(d.data()?.personagemAtivo||'');if(id)ids.add(id);});
      const ativos=(userCharacters||[]).filter(ch=>ids.has(String(ch.id))&&personagemAtivoCampanhaV102_(ch));if(!ativos.length)return notificar_('Nenhum jogador possui personagem ativo selecionado.','aviso');
      if(!confirm(`Trazer ${ativos.length} personagem(ns) para “${c.nome||c.id}” e seu mapa?\n\n${ativos.map(x=>x.nome||x.id).join(', ')}`))return;
      for(const ch of ativos)await window.__mesaMoverEntidadeCenario_?.(`char:${ch.id}`,String(c.id),{silencioso:true});
      await setGroupFallback(c,String(map.id));await window.__mesaReconciliarCenarios_?.();
      if(!syncGuard){try{syncGuard=true;await novaSyncController_.openMap(String(map.id));}finally{syncGuard=false;}}
      notificar_(`👥 Grupo trazido para ${c.nome||c.id}. Cenário e mapa agora apontam para o mesmo local.`,'sucesso',5200);
    }catch(e){console.error('Trazer jogadores v102',e);notificar_('Não foi possível trazer os jogadores: '+(e?.message||e),'erro',6500);}
  };

  function styleV102(){
    if(document.getElementById('mesaV102Styles'))return;
    const st=document.createElement('style');st.id='mesaV102Styles';st.textContent=`
      .icon-btn-v102{width:38px!important;min-width:38px!important;height:36px!important;min-height:36px!important;padding:0!important;display:inline-grid!important;place-items:center!important;font-size:17px!important;line-height:1!important;border-radius:8px!important}
      .nova-primary-v102{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:4px 0 6px}
      .nova-acting-row-v102{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:wrap!important;margin:0!important}
      .nova-acting-row-v102 .nova-acting-label{display:flex!important;align-items:center!important;gap:6px!important;margin:0!important;font-weight:700!important}
      .nova-acting-row-v102 select{height:36px!important;min-width:170px!important;margin:0!important;padding-top:4px!important;padding-bottom:4px!important}
      .nova-turno-v102{font-size:.76rem!important;line-height:1.2!important;color:#aebbd0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin-left:auto!important;max-width:630px!important;padding:0!important;background:none!important;border:0!important}
      .nova-organize-v102{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:7px 0;border-top:1px solid rgba(255,255,255,.08)}
      .nova-organize-v102 #novaSyncMapa{height:36px!important;width:210px!important;margin:0!important}
      .nova-organize-v102 #novaSyncQuickSearch{height:36px!important;min-width:180px;max-width:300px;margin:0!important;flex:1}
      .nova-shared-draw-v102{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 8px;margin:2px 0 7px;border-radius:9px;background:rgba(0,212,255,.045);border:1px solid rgba(0,212,255,.14)}
      .nova-shared-draw-v102>small{color:#879ab1;font-size:.72rem}.nova-shared-draw-v102 input[type=color]{width:38px;height:36px;padding:2px;margin:0;border-radius:8px}
      #novaSyncSharedDrawToggle[aria-pressed=true]{outline:2px solid #00d4ff;background:rgba(0,212,255,.18)!important}
      #novaSyncMasterTitle{display:none!important}#novaSyncInit{display:none!important}
      #novaSyncMasterPanel{padding-top:4px!important}
      .nova-workshop-toolbar-v102{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0}
      #novaOficinaPanel .gm2-row:first-of-type button.icon-btn-v102{margin:0!important}
      #novaMapTopV68 #novaSyncFocus{width:auto!important;min-width:30px!important;height:34px!important;padding:0 8px!important;font-size:14px!important}
      @media(max-width:900px){.nova-turno-v102{width:100%;max-width:none;margin-left:0!important}.nova-organize-v102 #novaSyncMapa{width:100%!important}}
    `;document.head.appendChild(st);
  }
  function compactTitles(){
    const focus=document.getElementById('novaSyncFocus');if(focus){focus.textContent='⛶';focus.title='Alternar foco no mapa';}
    const pull=document.getElementById('novaSyncPullActiveV92');if(pull)pull.title='Trazer personagens ativos para este mapa e cenário';
  }
  function initV102(){styleV102();compactTitles();watchGroupFallback();}
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initV102,1500));else setTimeout(initV102,1500);}
  const showBase=window.mostrarAba;if(typeof showBase==='function')window.mostrarAba=function(){const r=showBase.apply(this,arguments);setTimeout(compactTitles,0);return r;};
  console.info('[Mesa Estelar] '+V+' carregado');window.__MESA_PATCH__=V;
})();

// v160: Restaurar do mestre (mesa-limpeza) devolve a Sorte máxima de cada personagem
if(typeof window!=='undefined')window.__mesaSorteMaxV160_=c=>{try{return pontosSorteMax_(c);}catch(_){return null;}};
