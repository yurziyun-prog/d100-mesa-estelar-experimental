// ============================================================
// v46.37.0 — progressão, conclusão de ficha e ferramentas de campanha
// ============================================================
function personagemEhPCJogador_(c){return !!c && String(c.tipo||'pc').toLowerCase()==='pc' && c.dono!==currentUserUid;}
function fichaAprovadaV96_(c){return !!c?.fichaAprovada || String(c?.fichaStatus||'')==='aprovada';}
function personagemCriacaoConcluida_(c){return fichaAprovadaV96_(c);}
function statusAprovacaoFichaV96_(c){
    if(fichaAprovadaV96_(c))return 'aprovada';
    const s=String(c?.fichaStatus||'').toLowerCase();
    if(['pendente','reaberta','rascunho'].includes(s))return s;
    return c?.criacaoConcluida?'pendente':'rascunho';
}
function statusFichaV96_(c){
    const st=statusAprovacaoFichaV96_(c),lang=idiomaAtual||'pt';
    const labels={
      pt:{aprovada:'Aprovada',pendente:'Aguardando aprovação',reaberta:'Edição reaberta',rascunho:'Em criação'},
      en:{aprovada:'Approved',pendente:'Awaiting approval',reaberta:'Editing reopened',rascunho:'In creation'},
      zh:{aprovada:'已批准',pendente:'等待批准',reaberta:'已重新开放编辑',rascunho:'创建中'}
    }[lang]||null;
    const rotulo=(labels||{aprovada:'Aprovada',pendente:'Aguardando aprovação',reaberta:'Edição reaberta',rascunho:'Em criação'})[st]||st;
    const cfg={
      aprovada:{icone:'🔒',estilo:'background:rgba(40,167,69,.16);border:1px solid rgba(40,167,69,.45);color:#9cf5b0'},
      pendente:{icone:'⏳',estilo:'background:rgba(255,193,7,.15);border:1px solid rgba(255,193,7,.42);color:#ffe08a'},
      reaberta:{icone:'🔓',estilo:'background:rgba(0,212,255,.12);border:1px solid rgba(0,212,255,.35);color:#9eeeff'},
      rascunho:{icone:'✏️',estilo:'background:rgba(155,89,182,.15);border:1px solid rgba(155,89,182,.38);color:#e2c4ff'}
    }[st]||{};
    return {st,rotulo,icone:cfg.icone||'•',estilo:cfg.estilo||''};
}
async function migrarAprovacaoFichaV96_(char){
    if(!char||String(char.tipo||'pc').toLowerCase()!=='pc'||Object.prototype.hasOwnProperty.call(char,'fichaAprovada')||char.fichaStatus)return false;
    // v96: nenhuma ficha antiga foi aprovada manualmente, porque esse fluxo ainda não existia.
    // As fichas que a versão anterior travou automaticamente voltam como pendentes para revisão do mestre.
    if(userData?.role==='mestre'&&String(char.dono||'')===String(currentUserUid||''))return false;
    const legadoConcluido=!!char.criacaoConcluida,agora=new Date().toISOString();
    const patch={fichaAprovada:false,fichaStatus:legadoConcluido?'pendente':'rascunho',migracaoAprovacaoV96:true,criacaoConcluida:false};
    if(legadoConcluido){patch.fichaEnviadaEm=char.criacaoConcluidaEm||agora;patch.fichaAtualizadaEm=agora;}
    try{await setDoc(doc(db,'personagens',char.id),patch,{merge:true});Object.assign(char,patch);return true;}catch(e){console.warn('Migração de aprovação v96',char.id,e);return false;}
}
function totaisCriacao_(char){
    const atr=Object.values(char?.atributos||{}).reduce((s,v)=>s+(Number(v)||0),0);
    const tot={origem:0,carreira:0,hobbie:0};
    for(const d of [...Object.values(char?.pericias||{}),...Object.values(char?.especializacoes||{})]){
        const i=obterInvestimentosPericia_(d);tot.origem+=i.origem;tot.carreira+=i.carreira;tot.hobbie+=i.hobbie;
    }
    return {atributos:atr,...tot};
}
function diagnosticoCriacaoV97_(char){
    const t=totaisCriacao_(char),faltas=[],nome=String(char?.nome||'').trim();
    if(!nome||nome.toLowerCase()==='novo personagem')faltas.push('nome definitivo');
    if(!String(char?.origem||'').trim())faltas.push('Origem');
    if(!String(char?.carreira||'').trim())faltas.push('Carreira');
    const metas={atributos:Number(configuracoes.etapa1||80),origem:Number(configuracoes.etapa2||100),carreira:Number(configuracoes.etapa3||100),hobbie:Number(configuracoes.etapa4||150)};
    for(const k of ['atributos','origem','carreira','hobbie'])if(Number(t[k])!==Number(metas[k]))faltas.push(`${k}: ${Number(t[k])}/${Number(metas[k])}`);
    return {pronta:faltas.length===0,faltas,totais:t,metas};
}
function criacaoPronta_(char){return diagnosticoCriacaoV97_(char).pronta;}
async function verificarEConcluirCriacao_(char){
    if(!char||fichaAprovadaV96_(char)||userData?.role==='mestre'||String(char.tipo||'pc').toLowerCase()!=='pc')return false;
    const pronta=criacaoPronta_(char),agora=new Date().toISOString(),antes=statusAprovacaoFichaV96_(char);
    const patch={fichaAprovada:false,fichaStatus:pronta?'pendente':'rascunho',fichaAtualizadaEm:agora,criacaoConcluida:false};
    if(pronta&&!char.fichaEnviadaEm)patch.fichaEnviadaEm=agora;
    await setDoc(doc(db,'personagens',char.id),patch,{merge:true});Object.assign(char,patch);
    aplicarBloqueioCriacao_(char);renderizarAvisosProgressao_(char);renderizarListaPersonagens();
    if(pronta){
      notificar_(antes==='pendente'?'📨 Atualização da ficha enviada ao mestre. Ela continua editável até ser aprovada.':'📨 Ficha completa enviada ao mestre para aprovação. Ela continua editável enquanto aguarda.','sucesso',6500);
    }
    return pronta;
}
window.aprovarFichaV96_=async function(id){
    if(userData?.role!=='mestre')return;
    try{
      await carregarConfiguracoes();
      const snap=await getDoc(doc(db,'personagens',String(id)));if(!snap.exists())return notificar_('Ficha não encontrada.','erro');
      const c={id:snap.id,...snap.data()};
      if(String(c.tipo||'pc').toLowerCase()!=='pc'||String(c.dono||'')===String(currentUserUid||''))return;
      const diag=diagnosticoCriacaoV97_(c);
      if(!diag.pronta){
        const detalhe=diag.faltas.slice(0,8).join('\n• ');
        const ok=confirm(`O sistema ainda considera a ficha de ${c.nome||'personagem'} incompleta.\n\n• ${detalhe}\n\nFichas antigas podem não ter registrado corretamente de onde vieram os pontos de perícia. Se você conferiu a ficha e quer aceitá-la como está, pode aprová-la mesmo assim.\n\nAprovar e bloquear a edição do jogador?`);
        if(!ok)return;
      }
      const agora=new Date().toISOString(),patch={fichaAprovada:true,fichaStatus:'aprovada',fichaAprovadaEm:agora,fichaAprovadaPor:String(currentUserUid||''),criacaoConcluida:true,criacaoConcluidaEm:agora,fichaAprovacaoForcada:!diag.pronta};
      await setDoc(doc(db,'personagens',String(id)),patch,{merge:true});
      const local=(userCharacters||[]).find(x=>String(x.id)===String(id));if(local)Object.assign(local,patch);
      renderizarListaPersonagens();notificar_(`✅ ${c.nome||'Personagem'} aprovado. A edição estrutural do jogador foi bloqueada.`,'sucesso',5200);
    }catch(e){console.error('Aprovar ficha v96',e);notificar_('Não foi possível aprovar a ficha: '+(e?.message||e),'erro',6500);}
};
window.reabrirFichaV96_=async function(id){
    if(userData?.role!=='mestre')return;
    try{
      const snap=await getDoc(doc(db,'personagens',String(id)));if(!snap.exists())return notificar_('Ficha não encontrada.','erro');
      const c={id:snap.id,...snap.data()};if(String(c.tipo||'pc').toLowerCase()!=='pc')return;
      if(!confirm(`Reabrir a ficha de ${c.nome||'personagem'} para edição do jogador?`))return;
      const agora=new Date().toISOString(),patch={fichaAprovada:false,fichaStatus:'reaberta',fichaReabertaEm:agora,fichaReabertaPor:String(currentUserUid||''),criacaoConcluida:false};
      await setDoc(doc(db,'personagens',String(id)),patch,{merge:true});
      const local=(userCharacters||[]).find(x=>String(x.id)===String(id));if(local)Object.assign(local,patch);
      renderizarListaPersonagens();notificar_(`🔓 ${c.nome||'Personagem'} pode editar a ficha novamente. Ao salvar uma ficha completa, ela voltará para aprovação.`,'info',6000);
    }catch(e){console.error('Reabrir ficha v96',e);notificar_('Não foi possível reabrir a ficha: '+(e?.message||e),'erro',6500);}
};
function aplicarBloqueioCriacao_(char){
    const lock=fichaAprovadaV96_(char)&&userData?.role!=='mestre';
    const ids=['editName','editRace','editSex','editOrigin','editCareer','editBodyType','editFOR','editCON','editTAM','editDES','editINT','editPOD','editCAR','editCharImage','editCharImageFile','editAltura','editPeso'];
    ids.forEach(id=>{const e=document.getElementById(id);if(e){e.disabled=lock;e.dataset.creationField='1';}});
    const b=document.getElementById('saveCharacterBtn');if(b){b.disabled=lock;b.title=lock?'Ficha aprovada pelo mestre. Peça que a edição seja reaberta para alterar a criação.':'';}
    const bar=document.getElementById('charCreationGuideBar');if(bar)bar.classList.toggle('hidden',lock||userData?.role==='mestre');
    document.getElementById('characterSection')?.classList.toggle('creation-locked',lock);
}
function renderizarAvisosProgressao_(char){
    const b=document.getElementById('charProgressionBanner');if(!b||!char)return;
    const grants=(char.xpPendentes||[]).filter(g=>Number(g.restantes||0)>0),partes=[],st=statusAprovacaoFichaV96_(char);
    if(st==='aprovada')partes.push('🔒 <b>Ficha aprovada pelo mestre.</b> A criação está bloqueada para edição. XP concedido pelo mestre continua podendo ser investido normalmente.');
    else if(st==='pendente')partes.push('⏳ <b>Ficha completa aguardando aprovação.</b> Você ainda pode editar e salvar; cada novo salvamento atualiza a versão que o mestre verá.');
    else if(st==='reaberta')partes.push('🔓 <b>Edição reaberta pelo mestre.</b> Faça as alterações necessárias e salve. Quando a ficha estiver completa, ela voltará para aprovação.');
    if(grants.length){const n=grants.reduce((s,g)=>s+Number(g.restantes||0),0);partes.push(`⭐ <b>Você ganhou ${n} ponto(s) de XP ainda não investidos.</b> Abra a aba Perícias para escolher entre as opções autorizadas pelo mestre.`);}
    if(!partes.length){b.classList.add('hidden');b.innerHTML='';return;}b.classList.remove('hidden');b.innerHTML=partes.join('<br>');
}

function renderizarXpPendente_(char){
    const box=document.getElementById('xpPendingPanel');if(!box)return;
    const grants=(char?.xpPendentes||[]).filter(g=>Number(g.restantes||0)>0);
    if(!grants.length){box.classList.add('hidden');box.innerHTML='';return;}
    box.classList.remove('hidden');
    box.innerHTML=`<h3 style="color:#d8b4ff;margin:0 0 8px;">⭐ XP para investir</h3><p style="color:#bbb;margin:0 0 10px;">Estes pontos só podem ser gastos nas perícias autorizadas pelo mestre e o aviso permanece até todo o XP ser investido.</p>`+grants.map(g=>{
        const allowed=(g.permitidos||[]);
        return `<div class="xp-grant-card"><b>${Number(g.restantes||0)} ponto(s) restantes</b>${g.mensagem?` · ${escaparHtmlInventario_(g.mensagem)}`:''}<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:9px;">${allowed.map(a=>`<label style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0;padding:7px 9px;background:rgba(0,0,0,.15);border-radius:8px;"><span>${escaparHtmlInventario_(a.nome||a.id)}</span><input class="xp-alloc" data-grant="${escaparHtmlInventario_(g.id)}" data-tipo="${escaparHtmlInventario_(a.tipo)}" data-id="${escaparHtmlInventario_(a.id)}" type="number" min="0" max="${Number(g.restantes||0)}" value="0" style="width:72px;margin:0;"></label>`).join('')}</div><button class="btn-small" style="margin-top:9px;" onclick="investirXpPendente_('${String(g.id).replace(/'/g,"\\'")}')">Aplicar investimento de XP</button></div>`;
    }).join('');
}
window.investirXpPendente_=async function(grantId){
    const char=(userCharacters||[]).find(c=>c.id===currentCharId);if(!char)return;
    const grants=Array.isArray(char.xpPendentes)?char.xpPendentes:[];const g=grants.find(x=>String(x.id)===String(grantId));if(!g)return;
    const ins=[...document.querySelectorAll(`.xp-alloc[data-grant="${CSS.escape(String(grantId))}"]`)];
    const alocs=ins.map(i=>({tipo:i.dataset.tipo,id:i.dataset.id,q:Math.max(0,Math.floor(Number(i.value)||0))})).filter(x=>x.q>0);
    const total=alocs.reduce((s,x)=>s+x.q,0);if(total<=0){notificar_('Informe quantos pontos deseja investir.','aviso');return;}if(total>Number(g.restantes||0)){notificar_('O investimento excede o XP disponível nesta concessão.','aviso');return;}
    char.pericias=char.pericias||{};char.especializacoes=char.especializacoes||{};
    for(const a of alocs){const colecao=a.tipo==='especializacao'?char.especializacoes:char.pericias;const d={...(colecao[a.id]||{})};const inv=obterInvestimentosPericia_(d);inv.xp=(inv.xp||0)+a.q;d.investimentos=inv;d.treinoTotal=inv.origem+inv.carreira+inv.hobbie+inv.xp;colecao[a.id]=d;}
    g.restantes=Math.max(0,Number(g.restantes||0)-total);char.xpPendentes=grants.filter(x=>Number(x.restantes||0)>0);
    await setDoc(doc(db,'personagens',char.id),{pericias:char.pericias,especializacoes:char.especializacoes,xpPendentes:char.xpPendentes},{merge:true});
    limparRascunhoPericias_(char.id);renderizarPericias(char);renderizarAvisosProgressao_(char);somSalvar_();notificar_(`⭐ ${total} ponto(s) de XP investidos.`,'sucesso',3500);
};

function xpItemTemInvestimento_(char,tipo,id){
    const d=(tipo==='especializacao'?char?.especializacoes?.[id]:char?.pericias?.[id])||{};
    const inv=obterInvestimentosPericia_(d);return (inv.origem+inv.carreira+inv.hobbie+inv.xp)>0;
}
window.popularXpPermitidosMestre_=function(){
    if(userData?.role!=='mestre')return;const box=document.getElementById('gmXpPermitidos');if(!box)return;
    const cid=document.getElementById('gmXpAlvo')?.value||'',char=(userCharacters||[]).find(c=>c.id===cid),todas=!!document.getElementById('gmXpMostrarTodas')?.checked;
    if(!char){box.innerHTML='<div style="color:#888">Escolha um personagem acima.</div>';return;}
    const itens=[];
    for(const p of periciasDB||[]){const basica=String(p.tipo||'').toLowerCase().includes('básica')||String(p.tipo||'').toLowerCase().includes('basica');if(todas||basica||xpItemTemInvestimento_(char,'pericia',p.id))itens.push({tipo:'pericia',id:p.id,nome:getNome(p),basica});}
    for(const e of especializacoesDB||[]){if(todas||xpItemTemInvestimento_(char,'especializacao',e.id))itens.push({tipo:'especializacao',id:e.id,nome:getNome(e),basica:false});}
    itens.sort((a,b)=>(a.tipo==='pericia'?0:1)-(b.tipo==='pericia'?0:1)||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    box.innerHTML=itens.map(x=>`<label style="display:flex;align-items:center;gap:8px;margin:0;padding:5px 6px;border-radius:6px;"><input class="gm-xp-permitido" type="checkbox" value="${escaparHtmlInventario_(x.tipo+':'+x.id)}"> <span>${x.tipo==='especializacao'?'⚔️':'📚'} ${escaparHtmlInventario_(x.nome)}${x.basica?' · básica':''}</span></label>`).join('')||'<div style="color:#888">Nenhuma opção disponível.</div>';
};
function popularControlesProgressaoMestre_(){
    if(userData?.role!=='mestre')return;const pcs=(userCharacters||[]).filter(c=>String(c.tipo||'pc').toLowerCase()==='pc');
    for(const id of ['gmAjusteAlvo','gmXpAlvo']){const s=document.getElementById(id);if(!s)continue;const v=s.value;s.innerHTML='<option value="">Escolher personagem...</option>'+pcs.map(c=>`<option value="${escaparHtmlInventario_(c.id)}">${escaparHtmlInventario_(c.nome||'Sem nome')}</option>`).join('');if(pcs.some(c=>c.id===v))s.value=v;}
    popularXpPermitidosMestre_();
}

async function labRestaurarCharPersistente_(c){
    if(!c?.id)return;c.combate=c.combate||{};c.pontosMagiaGastos=0;c.pontosSorte=pontosSorteMax_(c);c.pontosSorteDerivadoV15=true;c.combate.fadiga='Fresh';c.combate.hitLocations={...pvMaxLocais_(c)};c.combate.pvGlobalAtual=calcularPVGlobalMax_(c);c.combate.municao=[];c.combate.inconsciente=false;c.combate.incapacitado=false;c.combate.morto=false;c.combate.sangramentoAtivo=false;c.combate.caido=false;c.combate.ferimentos={};await setDoc(doc(db,'personagens',c.id),{pontosMagiaGastos:0,pontosSorte:c.pontosSorte,pontosSorteDerivadoV15:true,combate:c.combate},{merge:true});
}
window.labRestaurarParticipantes_=async function(){
    if(!batalhaEhMestre_())return;if(!confirm('Restaurar PV, PP, Sorte, AÇ, fadiga, estados e munição de todos os participantes atuais da mesa?'))return;const ids=new Set();
    for(const t of labEstado_.tokens||[]){const cid=String(t.origemId||'');if(cid)ids.add(cid);t.psiGastosLab=0;t.municaoLab={};t.acoesAtuaisLab=Number(t.acoesMaxLab||t.acoesMax||2);t.movimentoGratisDisponivel=true;t.movimentoBonusLab=0;t.primeirosSocorrosLab=null;t.saltoPsiPendenteLab=0;t.bonusIntuicaoPendenteLab=0;const c=labCharToken_(t);if(c){try{t.combateLab=labCriarSnapshotCombate_(c);}catch(_){ }t.charLab={...(t.charLab||{}),...labSnapshotChar_(c),pontosMagiaGastos:0};}else if(t.combateLab){for(const k of Object.keys(t.combateLab.hitLocations||{})){const v=Number(t.combateLab.hitLocations[k]);if(v<0)t.combateLab.hitLocations[k]=Math.abs(v);}t.combateLab.morto=false;t.combateLab.inconsciente=false;t.combateLab.incapacitado=false;t.combateLab.sangrando=false;t.combateLab.derrubado=false;}}
    for(const id of ids){const c=(userCharacters||[]).find(x=>String(x.id)===id);if(c)try{await labRestaurarCharPersistente_(c);}catch(e){console.warn('Restaurar personagem',id,e);}}
    labSalvarLocal_();labAgendarSyncRemoto_();labRender_();notificar_('♻️ Participantes restaurados: PV, PP, Sorte, AÇ, fadiga, estados e munição.','sucesso',4500);
};

async function aplicarAjusteUm_(c,tipo,valor,local){
    c.combate=c.combate||{};
    if(tipo==='pv_total'){if(modoCombateAtual_()==='simplificado'){c.combate.pvGlobalAtual=calcularPVGlobalMax_(c);}else{const ms=pvMaxLocais_(c);c.combate.hitLocations={...ms};}return {combate:c.combate};}
    if(tipo==='pv'){
        if(modoCombateAtual_()==='simplificado'||local==='PV Global'){const max=calcularPVGlobalMax_(c),at=Number(c.combate.pvGlobalAtual??max);c.combate.pvGlobalAtual=Math.max(-max,Math.min(max,at+valor));}
        else{const ms=pvMaxLocais_(c),max=Number(ms[local]||1);c.combate.hitLocations=c.combate.hitLocations||{};const at=Number(c.combate.hitLocations[local]??max);c.combate.hitLocations[local]=Math.max(-max,Math.min(max,at+valor));}
        return {combate:c.combate};
    }
    if(tipo==='magia_total'){c.pontosMagiaGastos=0;return {pontosMagiaGastos:0};}
    if(tipo==='magia'){const max=pontosMagiaMax_(c),atu=max-Math.max(0,Number(c.pontosMagiaGastos||0)),novo=Math.max(0,Math.min(max,atu+valor));c.pontosMagiaGastos=max-novo;return {pontosMagiaGastos:c.pontosMagiaGastos};}
    if(tipo==='sorte_total'){const max=pontosSorteMax_(c);c.pontosSorte=max;c.pontosSorteDerivadoV15=true;return {pontosSorte:max,pontosSorteDerivadoV15:true};}
    if(tipo==='sorte'){const max=pontosSorteMax_(c),novo=Math.max(0,Math.min(max,pontosSorteAtuais_(c)+valor));c.pontosSorte=novo;c.pontosSorteDerivadoV15=true;return {pontosSorte:novo,pontosSorteDerivadoV15:true};}
    if(tipo==='dificuldade'){c.modDificuldadeMestre=Math.max(-3,Math.min(3,Math.floor(valor||0)));return {modDificuldadeMestre:c.modDificuldadeMestre};}
    return {};
}
function sincronizarAjusteCampanhaNaMesa_(c,tipo){
    if(!c)return;const ts=(labEstado_?.tokens||[]).filter(t=>String(t.origemId||t.id)===String(c.id));
    for(const t of ts){t.charLab={...(t.charLab||{}),...labSnapshotChar_(c)};if(tipo==='magia'||tipo==='magia_total')t.psiGastosLab=Math.max(0,Number(c.pontosMagiaGastos||0));if(tipo==='pv'||tipo==='pv_total')t.combateLab=JSON.parse(JSON.stringify(c.combate||t.combateLab||{}));}
    const bp=(batalhaEstado_?.participantes||[]).find(p=>String(p.id)===String(c.id)||String(p.origemId||'')===String(c.id));if(bp&&(tipo==='magia'||tipo==='magia_total'))bp.psiGastos=Math.max(0,Number(c.pontosMagiaGastos||0));
}
window.aplicarAjusteCampanha_=async function(todos=false){
    if(userData?.role!=='mestre')return;const tipo=document.getElementById('gmAjusteTipo')?.value||'pv',valor=Math.floor(Number(document.getElementById('gmAjusteValor')?.value)||0),local=document.getElementById('gmAjusteLocal')?.value||'PV Global';
    let alvos=(userCharacters||[]).filter(c=>String(c.tipo||'pc').toLowerCase()==='pc');if(!todos){const id=document.getElementById('gmAjusteAlvo')?.value;alvos=alvos.filter(c=>c.id===id);}if(!alvos.length){notificar_('Escolha um personagem.','aviso');return;}
    for(let i=0;i<alvos.length;i++){let c=alvos[i];try{const ds=await getDoc(doc(db,'personagens',c.id));if(ds.exists()){const vivo={id:ds.id,...ds.data()};Object.assign(c,vivo);}}catch(_){}const patch=await aplicarAjusteUm_(c,tipo,valor,local);await setDoc(doc(db,'personagens',c.id),patch,{merge:true});sincronizarAjusteCampanhaNaMesa_(c,tipo);}
    if(batalhaEhMestre_()){labSalvarLocal_();labAgendarSyncRemoto_();}
    const atual=obterPersonagemAtual_();if(atual){atualizarVisualizacao(atual);renderizarCombate(atual);}renderizarBatalhaCompartilhada_();notificar_(`Ajuste aplicado a ${alvos.length} personagem(ns).`,'sucesso',3200);
};
window.concederXpDirecionado_=async function(){
    if(userData?.role!=='mestre')return;const id=document.getElementById('gmXpAlvo')?.value||'',pts=Math.max(1,Math.floor(Number(document.getElementById('gmXpPontos')?.value)||1)),box=document.getElementById('gmXpPermitidos');const c=(userCharacters||[]).find(x=>x.id===id);if(!c){notificar_('Escolha um personagem.','aviso');return;}const vals=[...(box?.querySelectorAll('.gm-xp-permitido:checked')||[])].map(o=>o.value);if(!vals.length){notificar_('Selecione ao menos uma perícia ou especialização permitida.','aviso');return;}
    const permitidos=vals.map(v=>{const [tipo,...rest]=v.split(':');const pid=rest.join(':');const obj=tipo==='especializacao'?(especializacoesDB||[]).find(x=>x.id===pid):(periciasDB||[]).find(x=>x.id===pid);return {tipo,id:pid,nome:obj?getNome(obj):pid};});
    const grants=Array.isArray(c.xpPendentes)?c.xpPendentes:[];grants.push({id:`xp_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,pontos:pts,restantes:pts,permitidos,criadoEm:new Date().toISOString()});c.xpPendentes=grants;await setDoc(doc(db,'personagens',c.id),{xpPendentes:grants},{merge:true});if(box)box.querySelectorAll('.gm-xp-permitido').forEach(cb=>cb.checked=false);const pe=document.getElementById('gmXpPontos');if(pe)pe.value='1';notificar_(`⭐ ${pts} XP concedidos a ${c.nome}. As seleções foram limpas para evitar concessão duplicada.`,'sucesso',4200);
};

const TUTORIAL_CRIACAO_=[
    {tab:'personagem',target:'creationNameGroup',texto:'Comece pelo nome do personagem. Insira aqui o nome que será usado na ficha e no Mapa da Mesa.'},
    {tab:'personagem',target:'creationOriginGroup',texto:'Escolha a Origem. Ela representa a sociedade, família e ambiente em que o personagem cresceu e define as primeiras habilidades que alguém aprende nesse contexto.'},
    {tab:'personagem',target:'creationCareerGroup',texto:'Depois escolha a Profissão/Carreira. Ela libera as perícias e especializações aprendidas por treinamento profissional.'},
    {tab:'personagem',target:'creationAttributesGrid',texto:'Distribua todos os pontos de atributos. Para concluir a criação, a soma precisa usar exatamente o total disponível da Etapa 1.'},
    {tab:'pericias',visao:'origem',target:'periciasEtapa',texto:'Agora vá às Perícias. Comece por Origem: estes pontos representam as habilidades iniciais aprendidas na sociedade, família e ambiente de criação.'},
    {tab:'pericias',visao:'carreira',target:'periciasEtapa',texto:'Em seguida invista os pontos de Carreira nas habilidades profissionais permitidas pela profissão escolhida.'},
    {tab:'pericias',visao:'hobbie',target:'periciasEtapa',texto:'Depois use os pontos de Hobbie. Eles representam interesses, prática informal e capacidades desenvolvidas fora da formação principal.'},
    {tab:'pericias',visao:'hobbie',target:'saveSkillsBtn',texto:'Por fim, salve as perícias. Quando atributos, Origem, Carreira e Hobbie estiverem com todos os pontos distribuídos, a ficha será considerada concluída e ficará bloqueada. Depois disso, o jogador só aumenta perícias por XP concedido pelo mestre.'}
];
let tutorialCriacaoIdx_=0;
function fecharTutorialCriacao_(){document.querySelectorAll('.creation-guide-highlight').forEach(e=>e.classList.remove('creation-guide-highlight'));document.getElementById('creationGuideBubble')?.remove();}
function tutorialMostrarPasso_(){
    fecharTutorialCriacao_();const st=TUTORIAL_CRIACAO_[tutorialCriacaoIdx_];if(!st)return;
    const tabBtn=st.tab==='pericias'?document.getElementById('charSkillsTabBtn'):document.querySelector('.char-tab-btn[onclick*="personagem"]');if(tabBtn&&!document.getElementById(`char-${st.tab}`)?.classList.contains('active'))mostrarCharAba(st.tab,tabBtn);
    if(st.visao){const se=document.getElementById('periciasEtapa');if(se){se.value=st.visao;const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(c)renderizarPericias(c);}}
    setTimeout(()=>{const t=document.getElementById(st.target);if(!t)return;t.classList.add('creation-guide-highlight');t.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>{const r=t.getBoundingClientRect(),b=document.createElement('div');b.id='creationGuideBubble';b.innerHTML='<div style="font-size:28px;line-height:1;margin-bottom:4px">⬇️</div>'+`<div><b>Passo ${tutorialCriacaoIdx_+1}/${TUTORIAL_CRIACAO_.length}</b></div><div style="margin-top:6px;">${st.texto}</div><div class="guide-actions"><button class="btn-small" onclick="fecharTutorialCriacao_()">Fechar</button>${tutorialCriacaoIdx_>0?'<button class="btn-small" onclick="tutorialCriacaoAnterior_()">← Voltar</button>':''}<button class="btn-small btn-select" onclick="tutorialCriacaoProximo_()">${tutorialCriacaoIdx_===TUTORIAL_CRIACAO_.length-1?'Concluir guia':'Próximo →'}</button></div>`;document.body.appendChild(b);const br=b.getBoundingClientRect();let left=Math.max(10,Math.min(window.innerWidth-br.width-10,r.left)),top=r.bottom+10;if(top+br.height>window.innerHeight-10)top=Math.max(10,r.top-br.height-10);b.style.left=`${left}px`;b.style.top=`${top}px`;},320);},80);
}
function tutorialSincronizarRascunhoFicha_(c){
    if(!c)return;c.nome=String(document.getElementById('editName')?.value||c.nome||'');c.origem=String(document.getElementById('editOrigin')?.value||c.origem||'');c.carreira=String(document.getElementById('editCareer')?.value||c.carreira||'');c.atributos=c.atributos||{};
    for(const a of ['FOR','CON','TAM','DES','INT','POD','CAR']){const e=document.getElementById(`edit${a}`);if(e)c.atributos[a]=Number(e.value)||10;}
}
function tutorialAvancarAte_(idx){const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(!c||personagemCriacaoConcluida_(c)||userData?.role==='mestre')return;tutorialSincronizarRascunhoFicha_(c);tutorialCriacaoIdx_=Math.max(0,Math.min(TUTORIAL_CRIACAO_.length-1,idx));tutorialMostrarPasso_();}
document.addEventListener('change',ev=>{
    const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(!c||personagemCriacaoConcluida_(c)||userData?.role==='mestre')return;
    tutorialSincronizarRascunhoFicha_(c);
    if(ev.target?.id==='editName'&&String(ev.target.value||'').trim())tutorialAvancarAte_(1);
    else if(ev.target?.id==='editOrigin'&&ev.target.value)tutorialAvancarAte_(2);
    else if(ev.target?.id==='editCareer'&&ev.target.value)tutorialAvancarAte_(3);
});
document.addEventListener('input',ev=>{
    if(!/^edit(FOR|CON|TAM|DES|INT|POD|CAR)$/.test(String(ev.target?.id||'')))return;
    const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(!c||personagemCriacaoConcluida_(c)||userData?.role==='mestre')return;tutorialSincronizarRascunhoFicha_(c);
    const total=['FOR','CON','TAM','DES','INT','POD','CAR'].reduce((n,a)=>n+(Number(document.getElementById(`edit${a}`)?.value)||0),0),lim=Number(configuracoes.etapa1??80);
    if(total===lim&&document.getElementById('editOrigin')?.value&&document.getElementById('editCareer')?.value)setTimeout(()=>tutorialAvancarAte_(4),180);
});
window.iniciarTutorialCriacao_=function(){const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(!c||personagemCriacaoConcluida_(c))return;tutorialCriacaoIdx_=0;tutorialMostrarPasso_();};
window.tutorialCriacaoProximo_=function(){if(tutorialCriacaoIdx_>=TUTORIAL_CRIACAO_.length-1){fecharTutorialCriacao_();return;}tutorialCriacaoIdx_++;tutorialMostrarPasso_();};
window.tutorialCriacaoAnterior_=function(){tutorialCriacaoIdx_=Math.max(0,tutorialCriacaoIdx_-1);tutorialMostrarPasso_();};
window.fecharTutorialCriacao_=fecharTutorialCriacao_;


