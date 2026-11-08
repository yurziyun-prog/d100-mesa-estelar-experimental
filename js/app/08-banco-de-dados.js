// ============================================
// FUNÇÕES DO BANCO DE DADOS
// ============================================
function escaparBanco_(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// v95: o Banco de Dados acompanha o idioma ativo. Os valores dos outros
// idiomas continuam salvos, mas deixam de ocupar a tela quando não estão em uso.
function valorIdiomaBanco_(obj,base){
    if(!obj)return '';
    if(idiomaAtual==='en')return obj[`${base}_en`]||obj[base]||obj[`${base}_zh`]||'';
    if(idiomaAtual==='zh')return obj[`${base}_zh`]||obj[base]||obj[`${base}_en`]||'';
    return obj[base]||obj[`${base}_en`]||obj[`${base}_zh`]||'';
}
function rotuloIdiomaBanco_(pt,en,zh){return idiomaAtual==='en'?en:idiomaAtual==='zh'?zh:pt;}
function idCampoIdiomaBanco_(pt,en,zh){return idiomaAtual==='en'?en:idiomaAtual==='zh'?zh:pt;}
function aplicarIdiomaCamposBanco_(){
    const grupos=[
      ['dbScenarioNome','dbScenarioNomeEn','dbScenarioNomeZh'],
      ['dbScenarioLocal','dbScenarioLocalEn','dbScenarioLocalZh'],
      ['dbScenarioTipo','dbScenarioTipoEn','dbScenarioTipoZh'],
      ['dbScenarioDescJog','dbScenarioDescJogEn','dbScenarioDescJogZh'],
      ['dbScenarioDescGM','dbScenarioDescGMEn','dbScenarioDescGMZh'],
      ['dbScenarioObjetivo','dbScenarioObjetivoEn','dbScenarioObjetivoZh'],
      ['dbScenarioSegredos','dbScenarioSegredosEn','dbScenarioSegredosZh'],
      ['dbScenarioObs','dbScenarioObsEn','dbScenarioObsZh'],
      ['dbSkillNome','dbSkillNomeEn','dbSkillNomeZh'],
      ['dbSkillDescricao','dbSkillDescricaoEn','dbSkillDescricaoZh'],
      ['dbItemNome','dbItemNomeEn','dbItemNomeZh'],
      ['dbItemDescricao','dbItemDescricaoEn','dbItemDescricaoZh']
    ];
    const ativo=idiomaAtual==='en'?1:idiomaAtual==='zh'?2:0;
    for(const ids of grupos){
      ids.forEach((id,i)=>{
        const campo=document.getElementById(id);if(!campo)return;
        const caixa=campo.closest('.form-group')||campo.parentElement;
        if(caixa)caixa.style.display=i===ativo?'':'none';
      });
    }
}
window.aplicarIdiomaCamposBanco_=aplicarIdiomaCamposBanco_;

function tabelaBancoNomes_(cabecalhos, linhas) {
    return `<div class="db-table-wrap"><table class="db-name-table"><thead><tr>${cabecalhos.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${linhas.join('')}</tbody></table></div>`;
}

function renderizarBancoPericias() {
    const el=document.getElementById('listaBancoPericias');if(!el)return;
    const linhas=[...periciasDB]
      .filter(p=>!p?.legadoEscola&&String(valorIdiomaBanco_(p,'nome')||'').trim())
      .sort((a,b)=>String(valorIdiomaBanco_(a,'nome')).localeCompare(String(valorIdiomaBanco_(b,'nome')),idiomaAtual==='pt'?'pt-BR':idiomaAtual))
      .map(p=>{const disp=p.disponivelCampanha!==false;return `<tr class="${disp?'':'db-campaign-off'}"><td>${escaparBanco_(valorIdiomaBanco_(p,'nome'))}</td><td>${escaparBanco_(p.categoria||'')}</td><td>${escaparBanco_(p.tipo||'')}</td><td>${escaparBanco_(p.formula||'')}</td><td>${escaparBanco_(p.penalidadeArmadura??'')}</td><td><button class="btn-small db-availability ${disp?'btn-select':''}" onclick="alternarDisponibilidadeBanco_('pericias','${escaparBanco_(p.id)}')">${disp?'✅ Disponível':'⛔ Guardada'}</button></td><td class="actions"><button class="btn-small btn-select" onclick="editarPericia('${escaparBanco_(p.id)}')">Editar</button> <button class="btn-small btn-delete" onclick="removerPericia('${escaparBanco_(p.id)}')">Remover</button></td></tr>`;});
    el.innerHTML=tabelaBancoNomes_([rotuloIdiomaBanco_('Nome','Name','名称'),'Categoria','Tipo','Fórmula','Pen. Armadura','Campanha','Ações'],linhas);
}

function renderizarBancoOrigens() {
    const el = document.getElementById('listaBancoOrigens');
    if (!el) return;
    const linhas = [...origensDB].sort((a,b)=>String(valorIdiomaBanco_(a,'nome')).localeCompare(String(valorIdiomaBanco_(b,'nome')),idiomaAtual==='pt'?'pt-BR':idiomaAtual)).map(o => `
        <tr>
            <td>${escaparBanco_(valorIdiomaBanco_(o,'nome'))}</td>
            <td>${escaparBanco_((o.periciasBasicas || []).join(', '))}</td>
            <td class="actions"><button class="btn-small btn-select" onclick="editarOrigem('${escaparBanco_(o.id)}')">Editar</button> <button class="btn-small btn-delete" onclick="removerOrigem('${escaparBanco_(o.id)}')">Remover</button></td>
        </tr>`);
    el.innerHTML = tabelaBancoNomes_([rotuloIdiomaBanco_('Nome','Name','名称'),'Perícias / Opções da Origem','Ações'], linhas);
}

function renderizarBancoCarreiras() {
    const el = document.getElementById('listaBancoCarreiras');
    if (!el) return;
    const linhas = [...carreirasDB].sort((a,b)=>String(valorIdiomaBanco_(a,'nome')).localeCompare(String(valorIdiomaBanco_(b,'nome')),idiomaAtual==='pt'?'pt-BR':idiomaAtual)).map(c => `
        <tr>
            <td>${escaparBanco_(valorIdiomaBanco_(c,'nome'))}</td>
            <td>${escaparBanco_((c.periciasBasicas || []).join(', '))}</td>
            <td>${escaparBanco_((c.periciasProfissionais || []).join(', '))}</td>
            <td>${escaparBanco_((c.especializacoes || []).join(', ') || 'Nenhuma')}</td>
            <td class="actions"><button class="btn-small btn-select" onclick="editarCarreira('${escaparBanco_(c.id)}')">Editar</button> <button class="btn-small btn-delete" onclick="removerCarreira('${escaparBanco_(c.id)}')">Remover</button></td>
        </tr>`);
    el.innerHTML = tabelaBancoNomes_([rotuloIdiomaBanco_('Nome','Name','名称'),'Básicas','Profissionais','Especializações','Ações'], linhas);
}

function renderizarBancoEspecializacoes() {
    const el=document.getElementById('listaBancoEspecializacoes');if(!el)return;
    const linhas=[...especializacoesDB].filter(e=>String(valorIdiomaBanco_(e,'nome')||'').trim()).sort((a,b)=>String(valorIdiomaBanco_(a,'nome')).localeCompare(String(valorIdiomaBanco_(b,'nome')),idiomaAtual==='pt'?'pt-BR':idiomaAtual)).map(e=>{const disp=e.disponivelCampanha!==false;return `<tr class="${disp?'':'db-campaign-off'}"><td>${escaparBanco_(valorIdiomaBanco_(e,'nome'))}</td><td>${escaparBanco_(e.tipo||'')}</td><td>${escaparBanco_(e.formula||'')}</td><td>${escaparBanco_(e.uso||'')}</td><td><button class="btn-small db-availability ${disp?'btn-select':''}" onclick="alternarDisponibilidadeBanco_('especializacoes','${escaparBanco_(e.id)}')">${disp?'✅ Disponível':'⛔ Guardada'}</button></td><td class="actions"><button class="btn-small btn-select" onclick="editarEspecializacao('${escaparBanco_(e.id)}')">Editar</button> <button class="btn-small btn-delete" onclick="removerEspecializacao('${escaparBanco_(e.id)}')">Remover</button></td></tr>`;});
    el.innerHTML=tabelaBancoNomes_([rotuloIdiomaBanco_('Nome','Name','名称'),'Tipo','Fórmula','Uso','Campanha','Ações'],linhas);
}

function renderizarBancoPoderesPsi() {
    const el = document.getElementById('listaBancoPoderesPsi');
    if (!el) return;
    const linhas = [...poderesPsiDB]
        .sort((a,b) => (String(a.esfera||'')+String(a.arco||0)+String(valorIdiomaBanco_(a,'nome'))).localeCompare(String(b.esfera||'')+String(b.arco||0)+String(valorIdiomaBanco_(b,'nome')),idiomaAtual==='pt'?'pt-BR':idiomaAtual))
        .map(p => `
        <tr>
            <td>${escaparBanco_(valorIdiomaBanco_(p,'nome'))}</td>
            <td>${escaparBanco_(p.esfera || '')}</td>
            <td>${Number(p.arco || 1)}</td>
            <td>${Number(p.custo || 0)}</td>
            <td>${escaparBanco_(valorIdiomaBanco_(p,'observacao'))}</td>
            <td class="actions"><button class="btn-small btn-select" onclick="editarPoderPsi('${escaparBanco_(p.id)}')">Editar</button> <button class="btn-small btn-delete" onclick="removerPoderPsi('${escaparBanco_(p.id)}')">Remover</button></td>
        </tr>`);
    el.innerHTML = tabelaBancoNomes_([rotuloIdiomaBanco_('Nome','Name','名称'),'Esfera','Arco','Custo',rotuloIdiomaBanco_('Observação','Observation','说明'),'Ações'], linhas);
}

function campoNomeAtivoBanco_(){return idiomaAtual==='en'?'nome_en':idiomaAtual==='zh'?'nome_zh':'nome';}
function campoObservacaoAtivoBanco_(){return idiomaAtual==='en'?'observacao_en':idiomaAtual==='zh'?'observacao_zh':'observacao';}
function promptNomeBancoAtivo_(atual={}){
    const campo=campoNomeAtivoBanco_();
    const rotulo=rotuloIdiomaBanco_('Nome','Name','名称');
    const valor=prompt(`${rotulo}:`,atual[campo]||atual.nome||'');
    if(valor===null||!String(valor).trim())return null;
    const out={nome:String(atual.nome||''),nome_en:String(atual.nome_en||''),nome_zh:String(atual.nome_zh||'')};
    out[campo]=String(valor).trim();
    if(!out.nome)out.nome=out[campo];
    return out;
}

window.adicionarPoderPsi = async () => {
    if (!userData || userData.role !== 'mestre') return;
    const nomes=promptNomeBancoAtivo_();if(!nomes)return;
    const esfera = prompt('Esfera (Sentidos/Mente/Matéria):','Sentidos') || 'Sentidos';
    const arco = Math.max(1, Math.min(3, parseInt(prompt('Arco (1-3):','1')) || 1));
    const custo = Math.max(0, Number(prompt('Custo mínimo em PP:','1')) || 0);
    const campoObs=campoObservacaoAtivoBanco_();
    const obsRotulo=rotuloIdiomaBanco_('Observação / regra','Observation / rule','说明 / 规则');
    const obs=prompt(`${obsRotulo}:`,'')||'';
    const obj={id:slugId_(nomes.nome),...nomes,esfera,arco,custo,observacao:'',observacao_en:'',observacao_zh:''};
    obj[campoObs]=obs;
    if(!obj.observacao)obj.observacao=obs;
    await setDoc(doc(db,'poderesPsi',obj.id),obj);
    await carregarBancosDeDados();
};

window.editarPoderPsi = async (id) => {
    if (!userData || userData.role !== 'mestre') return;
    const p = poderesPsiDB.find(x=>x.id===id); if (!p) return;
    const nomes=promptNomeBancoAtivo_(p);if(!nomes)return;
    const esfera = prompt('Esfera:',p.esfera||'Sentidos') || p.esfera || 'Sentidos';
    const arco = Math.max(1,Math.min(3,parseInt(prompt('Arco (1-3):',String(p.arco||1)))||1));
    const custo = Math.max(0,Number(prompt('Custo mínimo em PP:',String(p.custo||0)))||0);
    const campoObs=campoObservacaoAtivoBanco_();
    const obsRotulo=rotuloIdiomaBanco_('Observação / regra','Observation / rule','说明 / 规则');
    const obs=prompt(`${obsRotulo}:`,p[campoObs]||p.observacao||'');
    const atualizado={...p,...nomes,esfera,arco,custo};
    if(obs!==null)atualizado[campoObs]=String(obs);
    if(!atualizado.observacao)atualizado.observacao=atualizado[campoObs]||'';
    await setDoc(doc(db,'poderesPsi',id),atualizado);
    await carregarBancosDeDados();
};

window.removerPoderPsi = async (id) => {
    if (!userData || userData.role !== 'mestre') return;
    if (!confirm('Remover este poder psiônico?')) return;
    await deleteDoc(doc(db,'poderesPsi',id));
    poderesPsiDB = poderesPsiDB.filter(p=>p.id!==id);
    renderizarBancoPoderesPsi();
};


function renderizarBancoItens() {
    const container = document.getElementById('listaBancoItens');
    if (!container) return;

    if (!itensDB.length) {
        container.innerHTML = '<p style="color:#aaa;">Nenhum item cadastrado</p>';
        return;
    }

    const esc = escaparBanco_;
    const linhas = [...itensDB]
        .sort((a, b) => String(valorIdiomaBanco_(a,'nome')).localeCompare(String(valorIdiomaBanco_(b,'nome')), idiomaAtual==='pt'?'pt-BR':idiomaAtual))
        .map(i => {
            const nome=valorIdiomaBanco_(i,'nome');
            const img = i.imagem
                ? `<img class="db-item-thumb" src="${esc(i.imagem)}" alt="${esc(nome)}"${miniAttr_(i)}>`
                : `<div class="db-item-thumb placeholder">${miniaturaOuCaixa_(i, '')}</div>`;
            const desc = valorIdiomaBanco_(i,'descricao') || i.observacoes || '';
            const meta = [
                i.peso !== undefined ? `${Number(i.peso || 0)} kg` : '',
                `PA: ${Number(i.pa || 0)}`,
                `PV: ${Number(i.pv ?? 1)}`,
                i.preco !== undefined ? `Preço: ${Number(i.preco || 0)}` : '',
                i.alcance ? `Alcance: ${i.alcance}` : '',
                i.dano ? `Dano: ${i.dano}` : '',
                String(i.categoria||'').toLowerCase()==='armas' ? `Pen.: ${Number(i.penetracao || 0)}` : '',
                i.municao ? `Munição: ${i.municao}` : '',
                i.uso !== undefined && i.uso !== '' ? `Uso: ${i.uso}` : '',
                (i.nivelAcesso || i.acesso) ? `Acesso: ${i.nivelAcesso || i.acesso}` : '',
                i.material ? `Material: ${i.material}` : ''
            ].filter(Boolean).map(esc).join(' &nbsp;|&nbsp; ');

            return `
                <tr class="db-item-main-row ${i.disponivelCampanha===false?'db-campaign-off':''}">
                    <td rowspan="2">${img}</td>
                    <td class="name-current">${esc(nome)}</td>
                    <td>${esc(i.categoria || 'Diversos')}</td>
                    <td class="db-item-description">${esc(desc)}</td>
                </tr>
                <tr class="db-item-meta-row">
                    <td colspan="2">${meta}</td>
                    <td class="actions">
                        <button class="btn-small db-availability ${i.disponivelCampanha===false?'':'btn-select'}" onclick="alternarDisponibilidadeItemBanco_('${esc(i.id)}')">${i.disponivelCampanha===false?'⛔ Guardado':'✅ Disponível'}</button> <button class="btn-small btn-select" onclick="editarItemBanco('${esc(i.id)}')">Editar</button>
                        <button class="btn-small btn-delete" onclick="removerItemBanco('${esc(i.id)}')">Remover</button>
                    </td>
                </tr>`;
        }).join('');

    container.innerHTML = `
        <div class="db-table-wrap">
            <table class="db-table" style="min-width:850px;">
                <thead>
                    <tr>
                        <th>Imagem</th>
                        <th>${rotuloIdiomaBanco_('Nome','Name','名称')}</th>
                        <th>Categoria</th>
                        <th>${rotuloIdiomaBanco_('Descrição / Observações','Description / Notes','说明 / 备注')}</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>`;
}

function renderizarBancoCenarios() {
    const container=document.getElementById('listaBancoCenarios');
    if(!container)return;
    if(!cenariosDB.length){container.innerHTML='<p style="color:#aaa;">Nenhum cenário cadastrado.</p>';return;}
    const esc=escaparBanco_;
    const linhas=[...cenariosDB].sort((a,b)=>String(a.id||'').localeCompare(String(b.id||''))).map(c=>{
        const nome=valorIdiomaBanco_(c,'nome'),local=valorIdiomaBanco_(c,'local'),tipo=valorIdiomaBanco_(c,'tipo');
        const descJog=valorIdiomaBanco_(c,'descricaoJogadores'),descGM=valorIdiomaBanco_(c,'descricaoGM');
        const img=c.imagem?`<img class="db-item-thumb" src="${esc(c.imagem)}" alt="${esc(nome)}">`:`<div class="db-item-thumb placeholder">🪐</div>`;
        const destinos=[c.destino1,c.destino2,c.destino3].filter(Boolean).join(' · ');
        return `<tr>
            <td>${img}</td><td><strong>${esc(c.id||'')}</strong></td>
            <td><strong>${esc(nome)}</strong><br><small style="color:#888;">${esc(local)}</small></td>
            <td>${esc(tipo)}</td><td>${esc(c.estadoInicial||'')}</td>
            <td style="max-width:360px;">${esc(descJog)}</td>
            <td style="max-width:360px;color:#ffd6a0;">${esc(descGM)}</td>
            <td>${esc(c.npcsCena||'')}</td><td>${esc(destinos)}</td>
            <td class="actions"><button class="btn-small btn-select" onclick="editarCenarioBanco('${esc(c.id)}')">Editar</button>
            <button class="btn-small btn-delete" onclick="removerCenarioBanco('${esc(c.id)}')">Remover</button></td>
        </tr>`;
    }).join('');
    container.innerHTML=`<div class="db-table-wrap"><table class="db-table" style="min-width:1650px;">
        <thead><tr><th>Imagem</th><th>ID</th><th>${rotuloIdiomaBanco_('Cenário / Local','Scenario / Location','场景 / 地点')}</th><th>${rotuloIdiomaBanco_('Tipo','Type','类型')}</th><th>Estado</th><th>${rotuloIdiomaBanco_('Descrição Jogadores','Player Description','玩家描述')}</th><th>${rotuloIdiomaBanco_('Descrição GM','GM Description','主持人描述')}</th><th>NPCs</th><th>Destinos</th><th>Ações</th></tr></thead>
        <tbody>${linhas}</tbody></table></div>`;
}


let vinculosCenarioModal_=new Map();

function personagensDisponiveisParaCenario_(){
    return [...(userCharacters||[])]
      .filter(c=>String(c.tipo||'pc').toLowerCase()!=='monstro')
      .map(c=>({...c,__cenarioId:String(c.id),__cenarioTipo:c.dono===currentUserUid?'PM':'PC'}));
}

function npcsDisponiveisParaCenario_(){
    return [...(npcsDB||[])]
      .filter(n=>n&&String(n.id||'').trim())
      .map(n=>({...n,__cenarioId:`npcdb:${n.id}`,__cenarioTipo:'NPC'}));
}

function mapaVinculosCenario_(cenario=null){
    if(vinculosCenarioModal_ instanceof Map)return vinculosCenarioModal_;
    return new Map((Array.isArray(cenario?.personagensCena)?cenario.personagensCena:[]).map(x=>[String(x.id),!!x.visivel]));
}

function cardVinculoCenario_(c,vinculados){
    const marcado=vinculados.has(String(c.__cenarioId));
    const visivel=vinculados.get(String(c.__cenarioId))===true;
    const img=c.imagem
      ? `<img src="${escaparBanco_(c.imagem)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`
      : `<div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);">👤</div>`;
    const tipo=c.__cenarioTipo||'NPC';
    return `<div style="padding:9px;border-radius:9px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:center;">
        ${img}
        <div>
            <label style="display:flex;align-items:center;gap:6px;color:#fff;">
                <input type="checkbox" class="cenario-personagem-check" value="${escaparBanco_(c.__cenarioId)}" ${marcado?'checked':''} onchange="atualizarVisibilidadePersonagemCenario_(this)">
                <strong>${escaparBanco_(c.nome||'Sem Nome')}</strong> <small style="color:#888;">${tipo}</small>
            </label>
            <label style="display:flex;align-items:center;gap:6px;margin-top:5px;color:#9fd3ff;font-size:.82em;">
                <input type="checkbox" class="cenario-personagem-visivel" data-id="${escaparBanco_(c.__cenarioId)}" ${visivel?'checked':''} ${marcado?'':'disabled'} onchange="atualizarVinculoVisibilidadeCenario_(this)">
                Visível para jogadores
            </label>
        </div>
    </div>`;
}

function renderizarSeletorPersonagensCenario_(cenario=null){
    const alvo=document.getElementById('dbScenarioPersonagensVinculados');
    if(!alvo)return;
    const vinculados=mapaVinculosCenario_(cenario);
    const disponiveis=personagensDisponiveisParaCenario_();
    alvo.innerHTML=disponiveis.length
      ? disponiveis.map(c=>cardVinculoCenario_(c,vinculados)).join('')
      : '<div style="color:#888;">Nenhum PJ/PM disponível para vincular.</div>';
}

function renderizarSeletorNPCsCenario_(cenario=null){
    const alvo=document.getElementById('dbScenarioNPCsVinculados');
    if(!alvo)return;
    const vinculados=mapaVinculosCenario_(cenario);
    const q=normalizarTextoCombate_(document.getElementById('dbScenarioNPCBusca')?.value||'');
    const disponiveis=npcsDisponiveisParaCenario_().filter(n=>!q||normalizarTextoCombate_(`${n.nome||''} ${n.tipo||''} ${n.raca||''} ${n.id||''}`).includes(q));
    if(!(npcsDB||[]).length){
        alvo.innerHTML='<div style="color:#888;">Nenhum NPC carregado do Banco de NPCs.</div>';
        return;
    }
    alvo.innerHTML=disponiveis.length
      ? disponiveis.map(c=>cardVinculoCenario_(c,vinculados)).join('')
      : '<div style="color:#888;">Nenhum NPC corresponde à busca.</div>';
}

function cenarioAbertoNoModal_(){
    const original=String(document.getElementById('dbScenarioIdOriginal')?.value||'');
    return original?(cenariosDB||[]).find(x=>String(x.id)===original)||null:null;
}
function atualizarVinculosCenarioModalSeAberto_(){
    const modal=document.getElementById('dbScenarioModal');
    if(!modal?.classList.contains('active'))return;
    const c=cenarioAbertoNoModal_();
    renderizarSeletorPersonagensCenario_(c);
    renderizarSeletorNPCsCenario_(c);
}

window.renderizarSeletorNPCsCenarioAtual_=()=>renderizarSeletorNPCsCenario_(cenarioAbertoNoModal_());

window.atualizarVisibilidadePersonagemCenario_=(check)=>{
    const id=String(check.value||'');
    const v=document.querySelector(`.cenario-personagem-visivel[data-id="${CSS.escape(id)}"]`);
    if(!v)return;
    v.disabled=!check.checked;
    if(!check.checked){v.checked=false;vinculosCenarioModal_.delete(id);}
    else vinculosCenarioModal_.set(id,!!v.checked);
};
window.atualizarVinculoVisibilidadeCenario_=(check)=>{
    const id=String(check.dataset?.id||'');if(!id)return;
    const principal=document.querySelector(`.cenario-personagem-check[value="${CSS.escape(id)}"]`);
    if(principal?.checked)vinculosCenarioModal_.set(id,!!check.checked);
};

function lerPersonagensVinculadosCenario_(){
    return [...vinculosCenarioModal_.entries()].map(([id,visivel])=>({id,visivel:!!visivel}));
}

window.vincularNomesCenarioAutomaticamente=()=>{
    const texto=String(document.getElementById('dbScenarioNPCs')?.value||'');
    const norm=normalizarTextoCombate_(texto);
    let encontradosPJPM=0,encontradosNPC=0;
    [...personagensDisponiveisParaCenario_(),...npcsDisponiveisParaCenario_()].forEach(c=>{
        const nomeNorm=normalizarTextoCombate_(c.nome||'');
        const id=String(c.__cenarioId||'');
        if(!nomeNorm||!norm.includes(nomeNorm)||vinculosCenarioModal_.has(id))return;
        vinculosCenarioModal_.set(id,false);
        if(id.startsWith('npcdb:'))encontradosNPC++;else encontradosPJPM++;
    });
    renderizarSeletorPersonagensCenario_(cenarioAbertoNoModal_());
    renderizarSeletorNPCsCenario_(cenarioAbertoNoModal_());
    const total=encontradosPJPM+encontradosNPC;
    alert(total
      ? `${total} vínculo(s) criado(s): ${encontradosPJPM} PJ/PM e ${encontradosNPC} NPC.`
      : 'Nenhum nome escrito no campo de referências coincidiu com PJ, PM ou NPC cadastrado.');
};

function obterPersonagemCenarioPorId_(id){
    if(String(id).startsWith('npcdb:')){
        const n=npcBancoPorId_(String(id).slice(6));
        return n?{...n,tipo:'npc',__cenarioTipo:'NPC'}:null;
    }
    return (userCharacters||[]).find(c=>String(c.id)===String(id))||null;
}

function cardsPersonagensCenario_(cenario,permitirControle=false){
    const vinculados=Array.isArray(cenario?.personagensCena)?cenario.personagensCena:[];
    if(!vinculados.length)return '<div style="color:#888;">Nenhum personagem vinculado.</div>';

    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px;">`+
      vinculados.map(v=>{
        const p=obterPersonagemCenarioPorId_(v.id);
        if(!p)return '';
        const img=p.imagem
          ? `<img src="${escaparHtmlInventario_(p.imagem)}" style="width:54px;height:54px;border-radius:50%;object-fit:cover;">`
          : `<div style="width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);font-size:1.5em;">👤</div>`;
        return `<div style="padding:10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid ${v.visivel?'rgba(40,167,69,.45)':'rgba(255,255,255,.08)'};">
            <div style="display:flex;gap:9px;align-items:center;">${img}<div><strong>${escaparHtmlInventario_(p.nome||'Sem Nome')}</strong><br>
            <small style="color:${v.visivel?'#8ff0a8':'#999'};">${v.visivel?'👁 Visível':'🙈 Oculto'}</small></div></div>
            ${permitirControle?`<button class="btn-small" style="margin-top:8px;" onclick="alternarVisibilidadePersonagemCenario_('${escaparHtmlInventario_(v.id)}')">${v.visivel?'Ocultar':'Tornar visível'}</button>`:''}
        </div>`;
      }).join('')+'</div>';
}

window.alternarVisibilidadePersonagemCenario_=async(id)=>{
    const c=obterCenarioSelecionadoMestre_();
    if(!c)return;
    const arr=Array.isArray(c.personagensCena)?c.personagensCena:[];
    const v=arr.find(x=>x.id===id);
    if(!v)return;
    v.visivel=!v.visivel;
    await setDoc(doc(db,'cenarios',c.id),{personagensCena:arr},{merge:true});
    if(String(c.id)===String(estadoCampanhaMestre?.cenarioId))await publicarCampanhaAtual_();
    renderizarCenarioMestre_();
    somSalvar_();
};


function preencherModalCenarioBanco_(c=null){
    const set=(id,v='')=>{const el=document.getElementById(id);if(el)el.value=v??'';};
    set('dbScenarioIdOriginal',c?.id||'');
    set('dbScenarioNome',c?.nome||'');set('dbScenarioNomeEn',c?.nome_en||'');set('dbScenarioNomeZh',c?.nome_zh||'');
    set('dbScenarioLocal',c?.local||'');set('dbScenarioLocalEn',c?.local_en||'');set('dbScenarioLocalZh',c?.local_zh||'');
    set('dbScenarioTipo',c?.tipo||'');set('dbScenarioTipoEn',c?.tipo_en||'');set('dbScenarioTipoZh',c?.tipo_zh||'');
    set('dbScenarioDescJog',c?.descricaoJogadores||'');set('dbScenarioDescJogEn',c?.descricaoJogadores_en||'');set('dbScenarioDescJogZh',c?.descricaoJogadores_zh||'');
    set('dbScenarioDescGM',c?.descricaoGM||'');set('dbScenarioDescGMEn',c?.descricaoGM_en||'');set('dbScenarioDescGMZh',c?.descricaoGM_zh||'');
    set('dbScenarioObjetivo',c?.objetivo||'');set('dbScenarioObjetivoEn',c?.objetivo_en||'');set('dbScenarioObjetivoZh',c?.objetivo_zh||'');
    set('dbScenarioSegredos',c?.segredos||'');set('dbScenarioSegredosEn',c?.segredos_en||'');set('dbScenarioSegredosZh',c?.segredos_zh||'');
    set('dbScenarioTestes',c?.testesSugeridos||'');set('dbScenarioEstado',c?.estadoInicial||'');set('dbScenarioNPCs',c?.npcsCena||'');
    set('dbScenarioEventos',c?.eventos||'');set('dbScenarioEncontros',c?.encontros||'');
    set('dbScenarioObs',c?.observacoes||'');set('dbScenarioObsEn',c?.observacoes_en||'');set('dbScenarioObsZh',c?.observacoes_zh||'');
    set('dbScenarioDestino1',c?.destino1||'');set('dbScenarioCondicao1',c?.condicao1||'');
    set('dbScenarioDestino2',c?.destino2||'');set('dbScenarioCondicao2',c?.condicao2||'');
    set('dbScenarioDestino3',c?.destino3||'');set('dbScenarioCondicao3',c?.condicao3||'');
    set('dbScenarioImagem',c?.imagem||'');
    set('dbScenarioMapaId',c?.mapaId||'');
    const f=document.getElementById('dbScenarioImagemArquivo');if(f)f.value='';
    document.getElementById('dbScenarioModalTitulo').textContent=c?`Editar Cenário — ${valorIdiomaBanco_(c,'nome')}`:'Adicionar Cenário';
    vinculosCenarioModal_=new Map((Array.isArray(c?.personagensCena)?c.personagensCena:[]).map(x=>[String(x.id),!!x.visivel]));
    const buscaNpc=document.getElementById('dbScenarioNPCBusca');if(buscaNpc)buscaNpc.value='';
    renderizarSeletorPersonagensCenario_(c);
    renderizarSeletorNPCsCenario_(c);
    aplicarIdiomaCamposBanco_();
    atualizarPreviewCenarioBanco();
}
window.atualizarPreviewCenarioBanco=()=>{
    const url=String(document.getElementById('dbScenarioImagem')?.value||'').trim();
    const p=document.getElementById('dbScenarioImagemPreview');if(!p)return;
    p.innerHTML=url?`<img src="${escaparBanco_(url)}" alt="Preview" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='⚠️'">`:'🪐';
};
window.handleDbScenarioImageUpload=async(event)=>{
    if(!userData||userData.role!=='mestre'){alert('Apenas o mestre pode enviar imagens.');return;}
    const file=event.target.files?.[0];if(!file)return;
    try{
        const storageRef=ref(storage,`personagens/${currentUserUid}/cenario_${Date.now()}_${file.name}`);
        const snapshot=await uploadBytes(storageRef,file);
        const url=await getDownloadURL(snapshot.ref);
        document.getElementById('dbScenarioImagem').value=url;
        atualizarPreviewCenarioBanco();
    }catch(error){
        console.error('Erro no upload de imagem do cenário:',error);
        const codigo=error?.code ? `\n${error.code}` : '';
        alert(`Não foi possível enviar a imagem do cenário.${codigo}`);
    }
};
window.adicionarCenarioBanco=()=>{
    preencherModalCenarioBanco_(null);document.getElementById('dbScenarioModal').classList.add('active');
};
window.editarCenarioBanco=(id)=>{
    const c=cenariosDB.find(x=>x.id===id);if(!c)return;
    preencherModalCenarioBanco_(c);document.getElementById('dbScenarioModal').classList.add('active');
};
window.fecharCenarioBancoModal=()=>document.getElementById('dbScenarioModal').classList.remove('active');
window.salvarCenarioBancoModal=async()=>{
    if(!userData||userData.role!=='mestre')return;
    const val=id=>String(document.getElementById(id)?.value||'').trim();
    const nomeAtivo=val(idCampoIdiomaBanco_('dbScenarioNome','dbScenarioNomeEn','dbScenarioNomeZh'));
    if(!nomeAtivo){alert(rotuloIdiomaBanco_('Informe o nome do cenário.','Enter the scenario name.','请输入场景名称。'));return;}
    const nome=val('dbScenarioNome')||nomeAtivo;
    const id=val('dbScenarioIdOriginal')||slugId_(nome);
    const c={id,nome,nome_en:val('dbScenarioNomeEn'),nome_zh:val('dbScenarioNomeZh'),
        local:val('dbScenarioLocal'),local_en:val('dbScenarioLocalEn'),local_zh:val('dbScenarioLocalZh'),
        tipo:val('dbScenarioTipo'),tipo_en:val('dbScenarioTipoEn'),tipo_zh:val('dbScenarioTipoZh'),
        descricaoJogadores:val('dbScenarioDescJog'),descricaoJogadores_en:val('dbScenarioDescJogEn'),descricaoJogadores_zh:val('dbScenarioDescJogZh'),
        descricaoGM:val('dbScenarioDescGM'),descricaoGM_en:val('dbScenarioDescGMEn'),descricaoGM_zh:val('dbScenarioDescGMZh'),
        objetivo:val('dbScenarioObjetivo'),objetivo_en:val('dbScenarioObjetivoEn'),objetivo_zh:val('dbScenarioObjetivoZh'),
        segredos:val('dbScenarioSegredos'),segredos_en:val('dbScenarioSegredosEn'),segredos_zh:val('dbScenarioSegredosZh'),
        testesSugeridos:val('dbScenarioTestes'),estadoInicial:val('dbScenarioEstado'),
        eventos:val('dbScenarioEventos'),encontros:val('dbScenarioEncontros'),
        observacoes:val('dbScenarioObs'),observacoes_en:val('dbScenarioObsEn'),observacoes_zh:val('dbScenarioObsZh'),
        destino1:val('dbScenarioDestino1'),condicao1:val('dbScenarioCondicao1'),destino2:val('dbScenarioDestino2'),condicao2:val('dbScenarioCondicao2'),
        destino3:val('dbScenarioDestino3'),condicao3:val('dbScenarioCondicao3'),
        npcsCena:val('dbScenarioNPCs'),personagensCena:lerPersonagensVinculadosCenario_(),mapaId:val('dbScenarioMapaId'),imagem:val('dbScenarioImagem')};
    await setDoc(doc(db,'cenarios',id),c,{merge:true});
    const ix=cenariosDB.findIndex(x=>x.id===id);if(ix>=0)cenariosDB[ix]=c;else cenariosDB.push(c);
    fecharCenarioBancoModal();renderizarBancoCenarios();renderizarCampanhaMestre_();renderizarCenarioMestre_();somSalvar_();
};
window.removerCenarioBanco=async(id)=>{
    if(!confirm('Remover este cenário?'))return;
    await deleteDoc(doc(db,'cenarios',id));cenariosDB=cenariosDB.filter(c=>c.id!==id);
    renderizarBancoCenarios();renderizarCampanhaMestre_();renderizarCenarioMestre_();
};




let gmEntidadesFiltro_='criatura',gmEntidadeSelecionada_={tipo:'criatura',id:''};
window.selecionarFiltroEntidadesMestre_=function(tipo){
    gmEntidadesFiltro_=tipo==='npc'?'npc':'criatura';
    if(gmEntidadeSelecionada_.tipo!==gmEntidadesFiltro_)gmEntidadeSelecionada_={tipo:gmEntidadesFiltro_,id:''};
    renderizarFichasEntidadesMestre_();
};
function gmEntModeloAtual_(){const l=gmEntidadeSelecionada_.tipo==='npc'?(npcsDB||[]):(criaturasDB||[]);return l.find(x=>String(x.id)===String(gmEntidadeSelecionada_.id))||null;}
function gmEntFormulaPadrao_(m,a){return String(m?.formulasAtributos?.[a]||m?.[a]||'');}
window.renderizarFichasEntidadesMestre_=function(){
 if(!batalhaEhMestre_())return;
 document.getElementById('gmEntFiltroCriaturas')?.classList.toggle('btn-select',gmEntidadesFiltro_==='criatura');
 document.getElementById('gmEntFiltroNPCs')?.classList.toggle('btn-select',gmEntidadesFiltro_==='npc');
 renderizarListaModelosEntidades_();renderizarFichaModeloEntidade_();renderizarInstanciasEntidades_();
};
window.renderizarListaModelosEntidades_=function(){
 const el=document.getElementById('gmEntListaModelos');if(!el)return;
 const q=normalizarTextoCombate_(document.getElementById('gmEntBusca')?.value||'');
 const l=(gmEntidadesFiltro_==='npc'?(npcsDB||[]):(criaturasDB||[])).filter(x=>!q||normalizarTextoCombate_(`${x.nome||''} ${x.tipo||''} ${x.especie||''}`).includes(q)).sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
 el.innerHTML=l.length?l.map(m=>`<button type="button" onclick="selecionarModeloEntidade_('${gmEntidadesFiltro_}','${String(m.id).replace(/'/g,"\\'")}')" style="width:100%;text-align:left;margin:0 0 6px;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.035);color:#eee;cursor:pointer;"><b>${escaparBanco_(m.nome||'Sem nome')}</b><br><small style="color:#999;">${modeloUsaAtributosRolados_(m)?'🎲 Rolado':'📌 Fixo'} · ${escaparBanco_(m.tipo||gmEntidadesFiltro_)}</small></button>`).join(''):'<div style="color:#888;">Nenhum modelo.</div>';
};
window.selecionarModeloEntidade_=function(tipo,id){gmEntidadeSelecionada_={tipo,id};gmEntidadesFiltro_=tipo;renderizarFichasEntidadesMestre_();};
window.renderizarFichaModeloEntidade_=function(){
 const el=document.getElementById('gmEntFichaModelo'),m=gmEntModeloAtual_();if(!el)return;if(!m){el.innerHTML='<div style="color:#888;">Selecione um modelo à esquerda.</div>';return;}
 const attrs=['FOR','CON','TAM','DES','INT','POD','CAR'],tipo=gmEntidadeSelecionada_.tipo;
 el.innerHTML=`<div style="display:flex;gap:12px;align-items:flex-start;">${m.imagem?`<img src="${escaparBanco_(m.imagem)}" style="width:105px;height:105px;border-radius:12px;object-fit:cover;">`:''}<div><div style="font-size:.72em;color:#8feaff;font-weight:700;letter-spacing:.06em;">MODELO DO BANCO</div><h3 style="margin:2px 0 0;">${escaparBanco_(m.nome)}</h3><div style="color:#999;">${escaparBanco_(m.especie||m.tipo||'')}</div><div style="margin-top:7px;">${modeloUsaAtributosRolados_(m)?'🎲 Atributos rolados por indivíduo':'📌 Atributos fixos'}</div></div></div>
 <div style="margin-top:13px;padding:11px;border-radius:9px;background:rgba(255,255,255,.035);"><label><input id="gmEntRolado" type="checkbox" ${modeloUsaAtributosRolados_(m)?'checked':''}> <b>Gerar atributos diferentes para cada indivíduo</b></label>
 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:10px;margin-top:10px;">${attrs.map(a=>`<div><small>${a}</small><input id="gmEntFormula${a}" value="${escaparBanco_(gmEntFormulaPadrao_(m,a))}" style="width:100%;"></div>`).join('')}</div><small style="color:#888;">Aceita fórmulas como 3d6+18, 2d6 e 1d6+3.</small></div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px;"><div><label>Peso / massa</label><input id="gmEntPeso" value="${escaparBanco_(m.pesoCorporal||'')}" style="width:100%;"></div><div><label>Tipo</label><input id="gmEntTipo" value="${escaparBanco_(m.tipo||'')}" style="width:100%;"></div></div>
 <div style="margin-top:9px;"><label>Imagem (URL)</label><input id="gmEntImagem" value="${escaparBanco_(m.imagem||'')}" style="width:100%;" placeholder="https://..."><small style="color:#888;">Ao salvar o modelo, a imagem também é atualizada no Banco de Dados e será usada em novos indivíduos.</small></div>
 <div style="margin-top:9px;"><label>${tipo==='criatura'?'Armas / ataques naturais':'Armas / ataques próprios'}</label><textarea id="gmEntArmas" rows="2" style="width:100%;" placeholder="${tipo==='criatura'?'Mordida:1d8+MD|Garras:1d6+MD':'Combate Desarmado'}">${escaparBanco_(m.armasTexto||'')}</textarea></div>
 <div style="margin-top:9px;"><label>Alcance dos ataques naturais / próprios</label><input id="gmEntAlcances" value="${escaparBanco_(m.alcancesAtaques||'')}" style="width:100%;" placeholder="Mordida:1.5|Pescoço:3|Jato Ácido:12"><small style="color:#888;">Guardado em metros para o futuro mapa métrico.</small></div>
 <div style="margin-top:9px;"><label>Habilidades especiais</label><textarea id="gmEntHabilidades" rows="3" style="width:100%;" placeholder="Engolfar|Atropelar|Eco da Matilha">${escaparBanco_(m.habilidadesTexto||'')}</textarea></div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px;">
   <div><label>Armadura natural (PA)</label><input id="gmEntArmaduraNatural" type="number" min="0" value="${Number(m.armaduraNatural||0)}" style="width:100%;"><small style="color:#888;">Pele, escamas, rocha etc. Não é equipamento.</small></div>
   <div><label>AÇ máxima especial</label><input id="gmEntAcoesMaxEspecial" type="number" min="0" value="${Number(m.acoesMaxEspecial||0)}" style="width:100%;"><small style="color:#888;">0 = calcular normalmente. Cila usa 6.</small></div>
 </div>
 <div style="display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:9px;margin-top:9px;">
   <div><label>Mov. terrestre (m/AÇ)</label><input id="gmEntMovTerra" type="number" min="0" step="0.5" value="${Number(m.movimentoTerrestre??m.movimentoBase??3)}" style="width:100%;"></div>
   <div><label>Voo (m/AÇ)</label><input id="gmEntMovVoo" type="number" min="0" step="0.5" value="${Number(m.movimentoVoo||0)}" style="width:100%;"></div>
   <div><label>Natação (m/AÇ)</label><input id="gmEntMovNatacao" type="number" min="0" step="0.5" value="${Number(m.movimentoNatacao||0)}" style="width:100%;"></div>
 </div>
 <div style="margin-top:9px;"><label>Vínculo perícia → ataques</label><input id="gmEntVinculos" value="${escaparBanco_(m.vinculosAtaquesPericias||'')}" style="width:100%;" placeholder="Combate Desarmado:Mordida,Garras|Bote/Salto:Bote e Constrição"><small style="color:#888;">Permite várias perícias, inclusive não combativas. Apenas as vinculadas a ataques aparecem como ataque.</small></div>
 <div style="margin-top:9px;"><label>Equipamento-base</label><textarea id="gmEntEquipBase" rows="2" style="width:100%;" placeholder="Pistola|Colete|Kit Médico">${escaparBanco_(m.equipamentoBaseTexto||'')}</textarea><small style="color:#888;">Equipamento é separado dos ataques. Ao gerar um indivíduo, estes itens podem ir para o inventário dele.</small></div>
 <div style="margin-top:9px;"><label>Descrição</label><textarea id="gmEntDescricao" rows="4" style="width:100%;">${escaparBanco_(m.descricao||'')}</textarea></div>
 <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;"><button class="btn-save" onclick="salvarFichaModeloEntidade_()">💾 Salvar modelo</button><button class="btn-small" onclick="rolarPreviewEntidade_()">🎲 Gerar exemplo</button><button class="btn-small" onclick="${tipo==='npc'?'editarNPCBanco_':'editarCriaturaBanco_'}('${String(m.id).replace(/'/g,"\\'")}')">🛠️ Editor completo</button></div><div id="gmEntPreviewRolagem" style="margin-top:9px;"></div>`;
};
window.rolarPreviewEntidade_=function(){const m=gmEntModeloAtual_();if(!m)return;const a={};for(const k of ['FOR','CON','TAM','DES','INT','POD','CAR'])a[k]=rolarFormulaAtributo_(document.getElementById('gmEntFormula'+k)?.value,m[k]||10);const e=document.getElementById('gmEntPreviewRolagem');if(e)e.innerHTML=`<div style="padding:8px;border:1px solid rgba(0,212,255,.25);border-radius:8px;background:rgba(0,212,255,.07);"><b>Exemplo:</b> ${Object.entries(a).map(([k,v])=>`${k} ${v}`).join(' · ')}</div>`;};
window.salvarFichaModeloEntidade_=async function(){const m=gmEntModeloAtual_();if(!m||!batalhaEhMestre_())return;const f={};for(const a of ['FOR','CON','TAM','DES','INT','POD','CAR'])f[a]=String(document.getElementById('gmEntFormula'+a)?.value||'').trim();const temFormulaDados=Object.values(f).some(x=>/\d*d\d+/i.test(String(x||'')));
const p={
    atributosRolados:!!document.getElementById('gmEntRolado')?.checked||temFormulaDados,
    formulasAtributos:f,
    pesoCorporal:String(document.getElementById('gmEntPeso')?.value||'').trim(),
    tipo:String(document.getElementById('gmEntTipo')?.value||'').trim()||m.tipo||'',
    armasTexto:String(document.getElementById('gmEntArmas')?.value||'').trim(),
    habilidadesTexto:String(document.getElementById('gmEntHabilidades')?.value||'').trim(),
    armaduraNatural:Math.max(0,Number(document.getElementById('gmEntArmaduraNatural')?.value||0)),
    acoesMaxEspecial:Math.max(0,Number(document.getElementById('gmEntAcoesMaxEspecial')?.value||0)),
    movimentoTerrestre:Math.max(0,Number(document.getElementById('gmEntMovTerra')?.value||0)),
    movimentoVoo:Math.max(0,Number(document.getElementById('gmEntMovVoo')?.value||0)),
    movimentoNatacao:Math.max(0,Number(document.getElementById('gmEntMovNatacao')?.value||0)),
    vinculosAtaquesPericias:String(document.getElementById('gmEntVinculos')?.value||'').trim(),
    equipamentoBaseTexto:String(document.getElementById('gmEntEquipBase')?.value||'').trim(),
    alcancesAtaques:String(document.getElementById('gmEntAlcances')?.value||'').trim(),
    imagem:String(document.getElementById('gmEntImagem')?.value||'').trim(),
    descricao:String(document.getElementById('gmEntDescricao')?.value||'').trim()
};
try{
    const colecao=gmEntidadeSelecionada_.tipo==='npc'?'npcs':'criaturas';
    await setDoc(doc(db,colecao,String(m.id)),p,{merge:true});
    Object.assign(m,p);
    somSalvar_();
    if(gmEntidadeSelecionada_.tipo==='criatura')renderizarBancoCriaturas_();
    else renderizarBancoNPCs();
    notificar_('Modelo salvo no Banco de Dados. Novos indivíduos usarão estes valores.','info');
    renderizarFichasEntidadesMestre_();
}catch(err){
    console.error('Erro ao salvar modelo pela ficha:',err);
    notificar_('Não foi possível salvar o modelo no Banco de Dados.','erro');
}};
function gmEntInstanciaChar_(p){return p?.npcBancoId?criarNPCCombateDoBanco_(npcBancoPorId_(p.npcBancoId),p):p?.criaturaBancoId?criarCriaturaCombateDoBanco_(criaturaBancoPorId_(p.criaturaBancoId),p):null;}
window.renderizarInstanciasEntidades_=function(){
 const el=document.getElementById('gmEntInstanciasAtivas');if(!el)return;const ps=(batalhaEstado_?.participantes||[]).filter(p=>p.npcBancoId||p.criaturaBancoId);
 if(!ps.length){el.innerHTML='<div style="color:#888;">Nenhum indivíduo temporário em batalha.</div>';return;}
 el.innerHTML=ps.map(p=>{const c=gmEntInstanciaChar_(p),a=c?.atributos||{},inv=c?.inventario||{},eq=(inv.equipado||[]).filter(Boolean),mo=(inv.mochila||[]).filter(Boolean);return `<div style="padding:10px;margin-bottom:8px;border-radius:9px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.10);"><div style="display:flex;gap:8px;align-items:center;"><div style="flex:1;"><b>${escaparBanco_(p.nome)}</b><br><small style="color:#8feaff;">INDIVÍDUO EM BATALHA</small></div><button class="btn-small" onclick="restaurarInstanciaEntidade_('${String(p.id).replace(/'/g,"\\'")}')">❤️ Restaurar este indivíduo</button></div><div style="margin-top:6px;font-size:.9em;">${['FOR','CON','TAM','DES','INT','POD','CAR'].map(k=>`${k} <b>${a[k]??'—'}</b>`).join(' · ')}</div><div style="color:#999;font-size:.85em;margin-top:5px;">Equipado: ${eq.length?eq.map(x=>escaparBanco_(getNome(x)||x.nome||'item')).join(', '):'—'} · Mochila: ${mo.length}/${(inv.mochila||[]).length||20}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px;"><select id="gmEntItem_${p.id}" style="min-width:200px;"><option value="">Adicionar item...</option>${(itensDB||[]).map(it=>`<option value="${escaparBanco_(it.id)}">${escaparBanco_(getNome(it)||it.nome||it.id)}</option>`).join('')}</select><select id="gmEntDestino_${p.id}"><option value="equipado">Equipado</option><option value="mochila">Mochila</option><option value="bolso">Bolso</option></select><button class="btn-small" onclick="adicionarItemInstanciaEntidade_('${String(p.id).replace(/'/g,"\\'")}')">➕ Colocar</button></div></div>`;}).join('');
};
window.adicionarItemInstanciaEntidade_=async function(id){const p=batalhaParticipante_(id),c=gmEntInstanciaChar_(p);if(!p||!c||!batalhaEhMestre_())return;const itemId=document.getElementById(`gmEntItem_${id}`)?.value,d=document.getElementById(`gmEntDestino_${id}`)?.value||'mochila',base=(itensDB||[]).find(x=>String(x.id)===String(itemId));if(!base)return notificar_('Escolha um item.','aviso');c.inventario=c.inventario||{};c.inventario[d]=Array.isArray(c.inventario[d])?c.inventario[d]:(d==='equipado'?Array(12).fill(null):d==='bolso'?Array(2).fill(null):Array(20).fill(null));const ix=c.inventario[d].findIndex(x=>!x);if(ix<0)return notificar_('Compartimento cheio.','aviso');const mc=cargaMaxArma_(base);c.inventario[d][ix]={...JSON.parse(JSON.stringify(base)),idBanco:String(base.id),instanciaId:`ent_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,pvAtual:Number(base.pv||1),...(mc>0?{cargaAtual:mc,cargaMax:mc}:{})};if(p.npcBancoId)p.npcInventario=JSON.parse(JSON.stringify(c.inventario));else p.criaturaInventario=JSON.parse(JSON.stringify(c.inventario));await batalhaSalvarEstado_();renderizarInstanciasEntidades_();};
window.restaurarInstanciaEntidade_=async function(id){const p=batalhaParticipante_(id),c=gmEntInstanciaChar_(p);if(!p||!c||!batalhaEhMestre_())return;c.combate=c.combate||{};c.combate.hitLocations={};c.combate.morto=false;c.combate.incapacitado=false;c.combate.inconsciente=false;c.combate.caido=false;c.combate.sangramentoAtivo=false;c.combate.ferimentos={};if(p.npcBancoId)p.npcCombate=JSON.parse(JSON.stringify(c.combate));else p.criaturaCombate=JSON.parse(JSON.stringify(c.combate));batalhaSincronizarStatusPublico_(c,p);await batalhaSalvarEstado_();renderizarInstanciasEntidades_();renderizarBatalhaCompartilhada_();notificar_('Indivíduo restaurado.','info');};
window.abrirAdminNoEscudo_=function(tipo,btn){
    if(!batalhaEhMestre_())return;
    document.querySelectorAll('.gm-sub-content').forEach(e=>e.classList.add('hidden'));
    document.querySelectorAll('.gm-subtab-btn').forEach(e=>e.classList.remove('active','btn-select'));
    if(btn)btn.classList.add('active','btn-select');
    let h=document.getElementById('gm-admin-host');
    if(!h){
        h=document.createElement('div');h.id='gm-admin-host';h.className='gm-sub-content';
        document.querySelector('#escudo .form-section')?.appendChild(h);
    }
    // Não apagar o painel administrativo ao alternar Banco/Configurações.
    // h.innerHTML='' destruía o próprio Banco de Dados depois que ele era movido para cá.
    for(const filho of [...h.children])filho.classList.remove('active');
    const p=document.getElementById(tipo);
    if(!p){notificar_('Painel administrativo não encontrado. Recarregue a página.','aviso');return;}
    h.classList.remove('hidden');p.classList.add('active');h.appendChild(p);
    if(tipo==='banco')renderizarBancoDados();
};
function criaturaBancoPorId_(id){garantirCriaturasTestePsi_();return (criaturasDB||[]).find(x=>String(x.id)===String(id))||null;}
function renderizarBancoCriaturas_(){garantirCriaturasTestePsi_();
 const e=document.getElementById('listaBancoCriaturas');if(!e)return;
 const l=[...criaturasDB].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
 e.innerHTML=l.length?`<div class="db-table-wrap"><table class="db-table"><thead><tr><th style="width:76px;">Imagem</th><th>Nome</th><th>Tipo</th><th>Atributos</th><th>Ataques</th><th>Ações</th></tr></thead><tbody>${l.map(n=>`<tr><td>${n.imagem?`<img src="${escaparBanco_(n.imagem)}" style="width:58px;height:58px;object-fit:cover;border-radius:9px;">`:`<div style="width:58px;height:58px;border-radius:9px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:1.5em;">🦖</div>`}</td><td><b>${escaparBanco_(n.nome)}</b><br><small>${escaparBanco_(n.especie||'')}</small></td><td>${escaparBanco_(n.tipo||'Criatura')}<br><small>${escaparBanco_(n.habitat||'')}</small></td><td>FOR ${n.FOR||0} · CON ${n.CON||0} · TAM ${n.TAM||0} · DES ${n.DES||0}<br>INT ${n.INT||0} · POD ${n.POD||0} · CAR ${n.CAR||0}</td><td>${escaparBanco_(n.armasTexto||'—')}<br><small>${escaparBanco_(n.propriedadesAtaques||'')}</small></td><td><button class="btn-small" onclick="editarCriaturaBanco_('${n.id}')">✏️ Editar</button> <button class="btn-small" onclick="duplicarCriaturaBanco_('${n.id}')">📑 Duplicar</button></td></tr>`).join('')}</tbody></table></div>`:'<p style="color:#aaa">Banco vazio.</p>';
}
function crSet_(id,v){const e=document.getElementById(id);if(e)e.value=v??'';}
let novaLerTreinos_=null;
function crFill_(n={}){crSet_('crOrig',n.id||'');crSet_('crId',n.id||'');crSet_('crNome',n.nome||'');crSet_('crTipo',n.tipo||'Criatura');crSet_('crEspecie',n.especie||'');crSet_('crHabitat',n.habitat||'');crSet_('crComportamento',n.comportamento||'');crSet_('crAltura',n.altura||'');crSet_('crTamanho',n.tamanho||'');crSet_('crPeso',n.pesoCorporal||'');for(const a of ['FOR','CON','TAM','DES','INT','POD','CAR']){
    crSet_('cr'+a,n[a]??10);
    crSet_('crFormula'+a,n.formulasAtributos?.[a]||'');
}
const rol=document.getElementById('crAtributosRolados');if(rol)rol.checked=modeloUsaAtributosRolados_(n);
crSet_('crPericias',n.periciasTexto||'');crSet_('crEspec',n.especializacoesTexto||'');novaLerTreinos_=montarTreinos(document,n,novaBaseCriatura_);crSet_('crArmas',n.armasTexto||'');
crSet_('crAlcances',n.alcancesAtaques||'');crSet_('crHabilidades',n.habilidadesTexto||'');
crSet_('crArmaduraNatural',Number(n.armaduraNatural||0));crSet_('crAcoesMaxEspecial',Number(n.acoesMaxEspecial||0));
crSet_('crDeslocamento',Number(n.deslocamento??n.movimentoTerrestre??n.movimentoBase??3));crSet_('crAcoes',Number(n.acoes??n.acoesMax??n.acoesMaxEspecial??2));
crSet_('crVinculos',vinculosCriatura(n));
crSet_('crEquipBase',n.equipamentoBaseTexto||'');crSet_('crProps',n.propriedadesAtaques||'');crSet_('crImagem',n.imagem||'');crSet_('crDescricao',n.descricao||'');const sel=document.getElementById('crSelecionavel');if(sel)sel.checked=n.selecionavelCombate!==false;const arq=document.getElementById('crImagemArquivo');if(arq)arq.value='';atualizarPreviewCriaturaBanco_();const d=document.getElementById('crDelete');if(d)d.style.display=n.id?'':'none';}

window.atualizarPreviewCriaturaBanco_=()=>{
    const url=String(document.getElementById('crImagem')?.value||'').trim();
    const p=document.getElementById('crImagemPreview');if(!p)return;
    p.innerHTML=url
      ? `<img src="${escaparBanco_(url)}" alt="Criatura" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='⚠️'">`
      : '🦖';
};
window.handleDbCreatureImageUpload_=async(event)=>{
    if(!userData||userData.role!=='mestre'){notificar_('Apenas o mestre pode enviar imagens de criaturas.','aviso');return;}
    const file=event.target.files?.[0];if(!file)return;
    const btn=event.target.closest('label');
    try{
        if(btn){btn.style.opacity='.6';btn.style.pointerEvents='none';}
        notificar_('Enviando imagem da criatura...','info',1800);
        const url=await uploadImagemBanco_(file,'banco-criaturas');
        const campo=document.getElementById('crImagem');
        if(campo)campo.value=url;
        atualizarPreviewCriaturaBanco_();
        notificar_('Imagem da criatura enviada.','info');
    }catch(error){
        console.error('Erro no upload da imagem da criatura:',error);
        notificar_(`Não foi possível enviar a imagem da criatura: ${error?.code||error?.message||error}`,'erro',7000);
    }finally{
        if(btn){btn.style.opacity='';btn.style.pointerEvents='';}
        event.target.value='';
    }
};

window.adicionarCriaturaBanco_=()=>{crFill_();document.getElementById('dbCriaturaModal')?.classList.add('active');};
window.editarCriaturaBanco_=id=>{const n=criaturaBancoPorId_(id);if(n){crFill_(n);document.getElementById('dbCriaturaModal')?.classList.add('active');}};
window.fecharCriaturaBanco_=()=>document.getElementById('dbCriaturaModal')?.classList.remove('active');
window.salvarCriaturaBanco_=async()=>{
    const v=id=>String(document.getElementById(id)?.value||'').trim(),
          orig=v('crOrig'),nome=v('crNome'),id=v('crId')||npcSlugPericia_(nome);
    if(!nome){notificar_('Informe o nome da criatura.','aviso');return;}
    const formulas={};for(const a of ['FOR','CON','TAM','DES','INT','POD','CAR'])formulas[a]=v('crFormula'+a);
    const temDados=Object.values(formulas).some(x=>/\d*d\d+/i.test(x));
    const n={
        id,nome,tipo:v('crTipo')||'Criatura',especie:v('crEspecie'),habitat:v('crHabitat'),comportamento:v('crComportamento'),
        altura:v('crAltura'),tamanho:v('crTamanho'),pesoCorporal:v('crPeso'),
        FOR:+v('crFOR')||10,CON:+v('crCON')||10,TAM:+v('crTAM')||10,DES:+v('crDES')||10,INT:+v('crINT')||5,POD:+v('crPOD')||10,CAR:+v('crCAR')||5,
        atributosRolados:!!document.getElementById('crAtributosRolados')?.checked||temDados,
        formulasAtributos:formulas,
        periciasTexto:v('crPericias'),especializacoesTexto:v('crEspec'),
        armasTexto:v('crArmas'),alcancesAtaques:v('crAlcances'),habilidadesTexto:v('crHabilidades'),
        armaduraNatural:Math.max(0,Number(v('crArmaduraNatural'))||0),acoesMaxEspecial:Math.max(0,Number(v('crAcoesMaxEspecial'))||0),
        deslocamento:Math.max(0,Number(v('crDeslocamento'))||0),acoes:Math.max(0,Number(v('crAcoes'))||0),
        // Compatibilidade com fichas e exportações antigas.
        movimentoTerrestre:Math.max(0,Number(v('crDeslocamento'))||0),
        vinculosAtaquesPericias:v('crVinculos'),equipamentoBaseTexto:v('crEquipBase'),
        propriedadesAtaques:v('crProps'),imagem:v('crImagem'),descricao:v('crDescricao'),
        selecionavelCombate:!!document.getElementById('crSelecionavel')?.checked,
        estadoCombate:null
    };
    try{
        Object.assign(n,novaLerTreinos_?.()||{});
        await setDoc(doc(db,'criaturas',id),n,{merge:true});
        if(orig&&orig!==id)await deleteDoc(doc(db,'criaturas',orig));
        criaturasDB=criaturasDB.filter(x=>x.id!==orig&&x.id!==id);criaturasDB.push(n);
        fecharCriaturaBanco_();renderizarBancoCriaturas_();renderizarFichasEntidadesMestre_();somSalvar_();
    }catch(e){console.error(e);notificar_('Não foi possível salvar a criatura. Verifique as regras do Firestore para /criaturas.','erro',7000);}
};
window.removerCriaturaBanco_=async()=>{const id=String(document.getElementById('crOrig')?.value||'');if(id&&confirm('Remover criatura?')){try{await deleteDoc(doc(db,'criaturas',id));criaturasDB=criaturasDB.filter(x=>x.id!==id);fecharCriaturaBanco_();renderizarBancoCriaturas_();}catch(e){console.error(e);notificar_('Não foi possível remover a criatura.','erro');}}};
window.duplicarCriaturaBanco_=async id=>{const o=criaturaBancoPorId_(id);if(!o)return;let k=2,base=String(o.nome).replace(/\s+\d+$/,'');while(criaturasDB.some(x=>x.nome===`${base} ${k}`))k++;const n={...JSON.parse(JSON.stringify(o)),id:npcSlugPericia_(`${base}_${k}`),nome:`${base} ${k}`};try{await setDoc(doc(db,'criaturas',n.id),n);criaturasDB.push(n);renderizarBancoCriaturas_();}catch(e){console.error(e);notificar_('Não foi possível duplicar a criatura.','erro');}};

function renderizarBancoNPCs_(){
 const e=document.getElementById('listaBancoNPCs');if(!e)return;
 const lista=[...npcsDB].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'}));
 e.innerHTML=lista.length?`<div class="db-table-wrap"><table class="db-table" style="min-width:1450px;"><thead><tr>
 <th style="width:76px;">Imagem</th><th style="width:140px;">Nome</th><th style="width:245px;">Dados</th><th style="width:210px;">Atributos</th>
 <th style="width:300px;">Perícias</th><th style="width:300px;">Especializações / armas</th><th style="width:105px;">Combate</th><th>Ações</th></tr></thead><tbody>
 ${lista.map(n=>`<tr>
 <td>${n.imagem?`<img src="${escaparBanco_(n.imagem)}" style="width:58px;height:58px;object-fit:cover;border-radius:9px;">`:`<div style="width:58px;height:58px;border-radius:9px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:1.5em;">🎭</div>`}</td>
 <td><strong>${escaparBanco_(n.nome)}</strong></td>
 <td><small>${escaparBanco_(n.tipo||'NPC')} · ${escaparBanco_(n.raca||'—')} · Sexo ${escaparBanco_(n.sexo||'—')} · Idade ${escaparBanco_(n.idade||'—')}<br>${escaparBanco_(n.origem||'—')} · ${escaparBanco_(n.carreira||'—')}<br>${escaparBanco_(n.conceito||'')}</small></td>
 <td style="line-height:1.4;">FOR ${n.FOR||10} · CON ${n.CON||10} · TAM ${n.TAM||10}<br>DES ${n.DES||10} · INT ${n.INT||10} · POD ${n.POD||10} · CAR ${n.CAR||10}</td>
 <td style="max-width:300px;font-size:.87em;overflow-wrap:anywhere;">${escaparBanco_(n.periciasTexto||'—')}</td>
 <td style="max-width:300px;font-size:.87em;overflow-wrap:anywhere;"><b>Esp.:</b> ${escaparBanco_(n.especializacoesTexto||'—')}<br><b>Armas:</b> ${escaparBanco_(n.armasTexto||'—')}</td>
 <td><label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
   <input type="checkbox" ${n.selecionavelCombate!==false?'checked':''} onchange="toggleNPCSelecionavelCombate_('${n.id}',this.checked)">
   <span>${n.selecionavelCombate!==false?'Selecionável':'Oculto'}</span>
 </label></td>
 <td><button class="btn-small btn-select" onclick="editarNPCBanco_('${n.id}')">✏️ Editar</button>
 <button class="btn-small" onclick="duplicarNPCBanco_('${n.id}')">📑 Duplicar</button>
 <button class="btn-small" onclick="converterNPCemPM_('${n.id}')">Converter em PM</button>
 <button class="btn-small" onclick="restaurarNPCBanco_('${n.id}')">❤️ Restaurar este indivíduo</button></td></tr>`).join('')}
 </tbody></table></div>`:'<p style="color:#aaa">Nenhum NPC.</p>';
}


function preencherModalNPCBanco_(n=null){
 const set=(id,v='')=>{const e=document.getElementById(id);if(e)e.value=v??'';};
 set('dbNPCIdOriginal',n?.id||'');set('dbNPCId',n?.id||'');set('dbNPCNome',n?.nome||'');set('dbNPCTipo',n?.tipo||'NPC');
 set('dbNPCRaca',n?.raca||'');set('dbNPCSexo',n?.sexo||'');set('dbNPCIdade',n?.idade||'');set('dbNPCOrigem',n?.origem||'');
 set('dbNPCCarreira',n?.carreira||'');set('dbNPCConceito',n?.conceito||'');set('dbNPCSociedade',n?.sociedade||'');set('dbNPCClasse',n?.classeSocial||'');
 set('dbNPCRecursos',n?.recursos||'');set('dbNPCAltura',n?.altura||'');set('dbNPCTamanho',n?.tamanho||'');set('dbNPCPesoCorporal',n?.pesoCorporal||'');
 for(const a of ['FOR','CON','TAM','DES','INT','POD','CAR']){
    set(`dbNPC${a}`,n?.[a]??10);set(`dbNPCFormula${a}`,n?.formulasAtributos?.[a]||'');
 }
 const rolNPC=document.getElementById('dbNPCAtributosRolados');if(rolNPC)rolNPC.checked=modeloUsaAtributosRolados_(n||{});
 set('dbNPCPericias',n?.periciasTexto||'');set('dbNPCEspecializacoes',n?.especializacoesTexto||'');set('dbNPCArmas',n?.armasTexto||'');
 set('dbNPCAlcances',n?.alcancesAtaques||'');set('dbNPCHabilidades',n?.habilidadesTexto||'');set('dbNPCEquipBase',n?.equipamentoBaseTexto||'');
 set('dbNPCInventario',n?.inventarioTexto||'');set('dbNPCMotivacao',n?.motivacao||'');set('dbNPCValorMotivacao',n?.valorMotivacao||'');
 set('dbNPCImagem',n?.imagem||'');set('dbNPCDescricao',n?.descricao||'');
 const arqNPC=document.getElementById('dbNPCImagemArquivo');if(arqNPC)arqNPC.value='';
 atualizarPreviewNPCBanco_();
 document.getElementById('dbNPCSelecionavel').checked=n?.selecionavelCombate!==false;
 document.getElementById('dbNPCModalTitulo').textContent=n?`Editar NPC — ${n.nome}`:'Adicionar NPC';
 document.getElementById('dbNPCRemoverBtn').style.display=n?'':'none';
}

window.atualizarPreviewNPCBanco_=()=>{
    const url=String(document.getElementById('dbNPCImagem')?.value||'').trim();
    const p=document.getElementById('dbNPCImagemPreview');if(!p)return;
    p.innerHTML=url
      ? `<img src="${escaparBanco_(url)}" alt="NPC" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='⚠️'">`
      : '🎭';
};
function nomeArquivoStorageSeguro_(nome='imagem'){
    return String(nome||'imagem')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-zA-Z0-9._-]+/g,'_')
      .slice(-120);
}
async function uploadImagemBanco_(file,pasta){
    if(!file)throw new Error('Nenhum arquivo selecionado.');
    if(!currentUserUid)throw new Error('Usuário não autenticado.');
    if(!String(file.type||'').startsWith('image/'))throw new Error('O arquivo selecionado não é uma imagem.');
    const nome=nomeArquivoStorageSeguro_(file.name);
    // Usa a mesma árvore autenticada já utilizada pelas imagens de personagens/cenários.
    const caminho=`personagens/${currentUserUid}/${pasta}/${Date.now()}_${nome}`;
    const storageRef=ref(storage,caminho);
    const snapshot=await uploadBytes(storageRef,file);
    return await getDownloadURL(snapshot.ref);
}
window.handleDbNPCImageUpload_=async(event)=>{
    if(!userData||userData.role!=='mestre'){notificar_('Apenas o mestre pode enviar imagens de NPCs.','aviso');return;}
    const file=event.target.files?.[0];if(!file)return;
    const btn=event.target.closest('label');
    try{
        if(btn){btn.style.opacity='.6';btn.style.pointerEvents='none';}
        notificar_('Enviando imagem do NPC...','info',1800);
        const url=await uploadImagemBanco_(file,'banco-npcs');
        const campo=document.getElementById('dbNPCImagem');
        if(campo)campo.value=url;
        atualizarPreviewNPCBanco_();
        notificar_('Imagem do NPC enviada.','info');
    }catch(error){
        console.error('Erro no upload da imagem do NPC:',error);
        notificar_(`Não foi possível enviar a imagem do NPC: ${error?.code||error?.message||error}`,'erro',7000);
    }finally{
        if(btn){btn.style.opacity='';btn.style.pointerEvents='';}
        event.target.value='';
    }
};

window.adicionarNPCBanco_=()=>{preencherModalNPCBanco_(null);document.getElementById('dbNPCModal').classList.add('active');};
window.editarNPCBanco_=(id)=>{const n=npcsDB.find(x=>x.id===id);if(!n)return;preencherModalNPCBanco_(n);document.getElementById('dbNPCModal').classList.add('active');};
window.fecharNPCBancoModal_=()=>document.getElementById('dbNPCModal').classList.remove('active');
window.salvarNPCBanco_=async()=>{
 const v=id=>document.getElementById(id)?.value?.trim()||'',orig=v('dbNPCIdOriginal');
 const id=v('dbNPCId')||normalizarTextoCombate_(v('dbNPCNome')).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 if(!id||!v('dbNPCNome'))return alert('Informe ID e nome.');
 const formulas={};for(const a of ['FOR','CON','TAM','DES','INT','POD','CAR'])formulas[a]=v('dbNPCFormula'+a);
 const temDados=Object.values(formulas).some(x=>/\d*d\d+/i.test(x));
 const n={id,nome:v('dbNPCNome'),nome_en:'',nome_zh:'',tipo:v('dbNPCTipo')||'NPC',raca:v('dbNPCRaca'),origem:v('dbNPCOrigem'),idade:v('dbNPCIdade'),sexo:v('dbNPCSexo'),
 altura:v('dbNPCAltura'),tamanho:v('dbNPCTamanho'),pesoCorporal:v('dbNPCPesoCorporal'),sociedade:v('dbNPCSociedade'),carreira:v('dbNPCCarreira'),conceito:v('dbNPCConceito'),
 classeSocial:v('dbNPCClasse'),recursos:v('dbNPCRecursos'),FOR:Number(v('dbNPCFOR'))||10,CON:Number(v('dbNPCCON'))||10,TAM:Number(v('dbNPCTAM'))||10,
 DES:Number(v('dbNPCDES'))||10,INT:Number(v('dbNPCINT'))||10,POD:Number(v('dbNPCPOD'))||10,CAR:Number(v('dbNPCCAR'))||10,
 atributosRolados:!!document.getElementById('dbNPCAtributosRolados')?.checked||temDados,formulasAtributos:formulas,
 motivacao:v('dbNPCMotivacao'),valorMotivacao:Number(v('dbNPCValorMotivacao'))||0,
 periciasTexto:v('dbNPCPericias'),especializacoesTexto:v('dbNPCEspecializacoes'),armasTexto:v('dbNPCArmas'),
 alcancesAtaques:v('dbNPCAlcances'),habilidadesTexto:v('dbNPCHabilidades'),equipamentoBaseTexto:v('dbNPCEquipBase'),
 inventarioTexto:v('dbNPCInventario'),selecionavelCombate:document.getElementById('dbNPCSelecionavel').checked,imagem:v('dbNPCImagem'),descricao:v('dbNPCDescricao')};
 if(orig&&orig!==id)await deleteDoc(doc(db,'npcs',orig));
 // estadoCombate legado é deliberadamente descartado: o banco representa o modelo, não um indivíduo ferido.
 await setDoc(doc(db,'npcs',id),n,{merge:false});
 const ix=npcsDB.findIndex(x=>x.id===orig||x.id===id);if(ix>=0)npcsDB[ix]=n;else npcsDB.push(n);
 npcsDB.sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));fecharNPCBancoModal_();renderizarBancoNPCs_();renderizarFichasEntidadesMestre_();renderizarBatalhaCompartilhada_();somSalvar_();
};

function proximoNomeDuplicadoNPC_(nome){
    const base=String(nome||'NPC').replace(/\s+\d+$/,'').trim();
    const usados=new Set((npcsDB||[]).map(n=>normalizarTextoCombate_(n.nome||'')));
    let n=2;
    while(usados.has(normalizarTextoCombate_(`${base} ${n}`)))n++;
    return `${base} ${n}`;
}

window.toggleNPCSelecionavelCombate_=async(id,valor)=>{
    if(userData?.role!=='mestre')return;
    const n=(npcsDB||[]).find(x=>String(x.id)===String(id));if(!n)return;
    n.selecionavelCombate=!!valor;
    await setDoc(doc(db,'npcs',String(id)),{selecionavelCombate:!!valor},{merge:true});
    renderizarBancoNPCs_();renderizarBatalhaCompartilhada_();
};

window.duplicarNPCBanco_=async(id)=>{
    if(userData?.role!=='mestre')return;
    const orig=(npcsDB||[]).find(x=>String(x.id)===String(id));if(!orig)return;
    const copia=JSON.parse(JSON.stringify(orig));
    copia.nome=proximoNomeDuplicadoNPC_(orig.nome);
    copia.id=normalizarTextoCombate_(copia.nome).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||`npc_${Date.now()}`;
    copia.estadoCombate={hitLocations:{},armor:{},fadiga:'Fresh',armas:[],municao:[],ferimentos:{},inconsciente:false,incapacitado:false,morto:false,ataquesBloqueadosTurnos:0,sangramentoAtivo:false,caido:false};
    delete copia.estadoCombate.primeirosSocorrosEmAndamento;
    await setDoc(doc(db,'npcs',copia.id),copia,{merge:false});
    npcsDB.push(copia);
    npcsDB.sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'}));
    renderizarBancoNPCs_();renderizarBatalhaCompartilhada_();
    notificar_(`${orig.nome} duplicado como ${copia.nome}.`,'info');
};

window.removerNPCBancoEditado_=async()=>{const id=document.getElementById('dbNPCIdOriginal')?.value;if(!id||!confirm('Remover este NPC?'))return;await deleteDoc(doc(db,'npcs',id));npcsDB=npcsDB.filter(x=>x.id!==id);fecharNPCBancoModal_();renderizarBancoNPCs_();};

function preencherModalItemBanco_(item = null) {
    const set = (id, valor = '') => {
        const el = document.getElementById(id);
        if (el) el.value = valor ?? '';
    };

    set('dbItemIdOriginal', item?.id || '');
    set('dbItemNome', item?.nome || '');
    set('dbItemNomeEn', item?.nome_en || '');
    set('dbItemNomeZh', item?.nome_zh || '');
    set('dbItemCategoria', item?.categoria || 'Diversos');
    set('dbItemPeso', item?.peso ?? 0);
    set('dbItemPreco', item?.preco ?? 0);
    set('dbItemAcesso', item?.nivelAcesso || item?.acesso || '');
    const dispItem=document.getElementById('dbItemDisponivel'); if(dispItem) dispItem.checked=item?.disponivelCampanha!==false;
    set('dbItemPA', item?.pa ?? 0);
    set('dbItemPV', item?.pv ?? 1);
    set('dbItemAlcance', item?.alcance || '');
    set('dbItemDano', item?.dano || '');
    set('dbItemPenetracao', item?.penetracao ?? 0);
    set('dbItemMunicao', item?.municao || '');
    set('dbItemUso', item?.uso ?? item?.quantidade ?? '');
    set('dbItemQualidade', normalizarQualidade_(item?.qualidade || 'Básica'));
    set('dbItemMaterial', item?.material || '');
    set('dbItemUnidade', item?.unidade || '');
    set('dbItemDestino', item?.destinoLocal || item?.destino || '');
    set('dbItemLocaisProtegidos', item?.locaisProtegidos || item?.protege || '');
    set('dbItemImagem', item?.imagem || '');
    set('dbItemDescricao', item?.descricao || item?.observacoes || '');
    set('dbItemDescricaoEn', item?.descricao_en || '');
    set('dbItemDescricaoZh', item?.descricao_zh || '');
    atualizarPreviewItemBanco();

    const arquivo = document.getElementById('dbItemImagemArquivo');
    if (arquivo) arquivo.value = '';

    document.getElementById('dbItemModalTitulo').textContent = item ? `Editar Item — ${valorIdiomaBanco_(item,'nome')}` : 'Adicionar Item do Sistema';
    aplicarIdiomaCamposBanco_();
}

window.atualizarPreviewItemBanco = () => {
    const url = String(document.getElementById('dbItemImagem')?.value || '').trim();
    const preview = document.getElementById('dbItemImagemPreview');
    if (!preview) return;
    if (!url) {
        preview.innerHTML = '📦';
        return;
    }
    preview.innerHTML = `<img src="${escaparBanco_(url)}" alt="Preview" style="width:100%;height:100%;object-fit:contain;background:rgba(0,0,0,.2);" onerror="this.parentElement.innerHTML='⚠️'">`;
};

window.handleDbItemImageUpload = async (event) => {
    if (!userData || userData.role !== 'mestre') {
        alert('Apenas o mestre pode enviar imagens para o banco.');
        return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        const storageRef = ref(storage, `banco-itens/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        document.getElementById('dbItemImagem').value = url;
        atualizarPreviewItemBanco();
    } catch (error) {
        console.error('Erro ao enviar imagem do item:', error);
        alert('Não foi possível enviar a imagem.');
    }
};

window.adicionarItemBanco = () => {
    if (!userData || userData.role !== 'mestre') {
        alert('Apenas o mestre pode alterar o banco de itens.');
        return;
    }
    preencherModalItemBanco_(null);
    document.getElementById('dbItemModal').classList.add('active');
};

window.editarItemBanco = (id) => {
    if (!userData || userData.role !== 'mestre') {
        alert('Apenas o mestre pode alterar o banco de itens.');
        return;
    }
    const item = itensDB.find(x => x.id === id);
    if (!item) return;
    preencherModalItemBanco_(item);
    document.getElementById('dbItemModal').classList.add('active');
};

window.fecharItemBancoModal = () => {
    document.getElementById('dbItemModal').classList.remove('active');
};

window.salvarItemBancoModal = async () => {
    if (!userData || userData.role !== 'mestre') {
        alert('Apenas o mestre pode alterar o banco de itens.');
        return;
    }

    const val = id => String(document.getElementById(id)?.value || '').trim();
    const num = (id, padrao = 0) => {
        const bruto = val(id).replace(',', '.');
        if (!bruto) return padrao;
        const n = Number(bruto);
        return Number.isFinite(n) ? n : padrao;
    };

    const nomeAtivo=val(idCampoIdiomaBanco_('dbItemNome','dbItemNomeEn','dbItemNomeZh'));
    if(!nomeAtivo){
        alert(rotuloIdiomaBanco_('Informe o nome do item.','Enter the item name.','请输入物品名称。'));
        return;
    }
    const nome=val('dbItemNome')||nomeAtivo;

    const idOriginal = val('dbItemIdOriginal');
    const id = idOriginal || slugId_(nome);
    if (!id) return;

    const item = {
        id,
        nome,
        nome_en: val('dbItemNomeEn'),
        nome_zh: val('dbItemNomeZh'),
        categoria: val('dbItemCategoria') || 'Diversos',
        peso: num('dbItemPeso', 0),
        preco: num('dbItemPreco', 0),
        pa: Math.max(0, Math.trunc(num('dbItemPA', 0))),
        pv: Math.max(0, Math.trunc(num('dbItemPV', 1))),
        alcance: val('dbItemAlcance'),
        dano: val('dbItemDano'),
        penetracao: Math.max(0, Math.trunc(num('dbItemPenetracao', 0))),
        municao: val('dbItemMunicao'),
        uso: val('dbItemUso'),
        qualidade: normalizarQualidade_(val('dbItemQualidade') || 'Básica'),
        nivelAcesso: val('dbItemAcesso'),
        disponivelCampanha: !!document.getElementById('dbItemDisponivel')?.checked,
        material: val('dbItemMaterial'),
        unidade: val('dbItemUnidade'),
        destinoLocal: val('dbItemDestino'),
        locaisProtegidos: val('dbItemLocaisProtegidos'),
        imagem: val('dbItemImagem'),
        descricao: val('dbItemDescricao')||val(idCampoIdiomaBanco_('dbItemDescricao','dbItemDescricaoEn','dbItemDescricaoZh')),
        descricao_en: val('dbItemDescricaoEn'),
        descricao_zh: val('dbItemDescricaoZh')
    };

    await setDoc(doc(db, 'itens', id), item, { merge: true });
    document.getElementById('dbItemModal').classList.remove('active');
    await carregarBancosDeDados();
};

// Adicionar / editar bancos multilíngues
function pedirNomeMultilingue_(atual = {}) {
    return promptNomeBancoAtivo_(atual);
}


window.adicionarPericia=async()=>abrirSkillBancoModal_('pericias',{tipo:'Profissional',categoria:'Geral',formula:'INT*2',disponivelCampanha:true});

window.adicionarOrigem = async () => {
    const nomes = pedirNomeMultilingue_(); if (!nomes) return;
    const periciasStr = prompt('Perícias básicas/opções (IDs separados por vírgula):', '') || '';
    const periciasBasicas = periciasStr.split(',').map(s=>s.trim()).filter(Boolean);
    const id = slugId_(nomes.nome);
    const nova = { id, ...nomes, periciasBasicas };
    await setDoc(doc(db, 'origens', id), nova); await carregarBancosDeDados(); popularSelects();
};

window.adicionarCarreira = async () => {
    const nomes = pedirNomeMultilingue_(); if (!nomes) return;
    const basicasStr = prompt('Perícias básicas (IDs, vírgula):', '') || '';
    const profissionaisStr = prompt('Perícias profissionais (IDs, vírgula):', '') || '';
    const especializacoesStr = prompt('Especializações (IDs, vírgula):', '') || '';
    const id = slugId_(nomes.nome);
    const nova = { id, ...nomes,
        periciasBasicas: basicasStr.split(',').map(s=>s.trim()).filter(Boolean),
        periciasProfissionais: profissionaisStr.split(',').map(s=>s.trim()).filter(Boolean),
        especializacoes: especializacoesStr.split(',').map(s=>s.trim()).filter(Boolean)
    };
    await setDoc(doc(db, 'carreiras', id), nova); await carregarBancosDeDados(); popularSelects();
};

window.adicionarEspecializacao=async()=>abrirSkillBancoModal_('especializacoes',{tipo:'Combate',uso:'Teste',formula:'DES+INT',disponivelCampanha:true});

function listaCampoSkill_(v){return (Array.isArray(v)?v:String(v||'').split(/[|\n]/)).map(x=>String(x).trim()).filter(Boolean);}
function abrirSkillBancoModal_(kind,obj){const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v??'';};document.getElementById('dbSkillKind').value=kind;set('dbSkillOrigId',obj?.id||'');set('dbSkillNome',obj?.nome||'');set('dbSkillNomeEn',obj?.nome_en||'');set('dbSkillNomeZh',obj?.nome_zh||'');set('dbSkillCategoria',obj?.categoria||'');set('dbSkillTipo',obj?.tipo||'');set('dbSkillFormula',obj?.formula||'');set('dbSkillUso',obj?.uso||'');set('dbSkillPen',obj?.penalidadeArmadura??0);set('dbSkillEscolas',(obj?.escolas||[]).join('\n'));set('dbSkillFamilias',(obj?.familias||[]).join('\n'));set('dbSkillDescricao',obj?.descricao||'');set('dbSkillDescricaoEn',obj?.descricao_en||'');set('dbSkillDescricaoZh',obj?.descricao_zh||'');document.getElementById('dbSkillDisponivel').checked=obj?.disponivelCampanha!==false;document.getElementById('dbSkillExigeEscola').checked=!!obj?.exigeEscola;const per=kind==='pericias';document.getElementById('dbSkillPericiaExtra').style.display=per?'':'none';document.getElementById('dbSkillPenBox').style.display=per?'':'none';document.getElementById('dbSkillUsoBox').style.display=per?'none':'';document.getElementById('dbSkillModalTitulo').textContent=(per?'Editar Perícia':'Editar Especialização')+(obj?.nome?` — ${valorIdiomaBanco_(obj,'nome')}`:'');aplicarIdiomaCamposBanco_();document.getElementById('dbSkillModal').classList.add('active');}
window.fecharSkillBancoModal_=()=>document.getElementById('dbSkillModal')?.classList.remove('active');
window.editarPericia=async id=>{const p=periciasDB.find(x=>x.id===id);if(p)abrirSkillBancoModal_('pericias',p);};

window.editarOrigem = async (id) => {
    const o = origensDB.find(x=>x.id===id); if (!o) return;
    const nomes = pedirNomeMultilingue_(o); if (!nomes) return;
    const lista = prompt('Perícias básicas/opções (IDs):', (o.periciasBasicas||[]).join(', ')) ?? '';
    await setDoc(doc(db,'origens',id), {...o,...nomes,periciasBasicas:lista.split(',').map(s=>s.trim()).filter(Boolean)});
    await carregarBancosDeDados(); popularSelects();
};

window.editarCarreira = async (id) => {
    const c = carreirasDB.find(x=>x.id===id); if (!c) return;
    const nomes = pedirNomeMultilingue_(c); if (!nomes) return;
    const bas = prompt('Perícias básicas (IDs):',(c.periciasBasicas||[]).join(', ')) ?? '';
    const prof = prompt('Perícias profissionais (IDs):',(c.periciasProfissionais||[]).join(', ')) ?? '';
    const esp = prompt('Especializações (IDs):',(c.especializacoes||[]).join(', ')) ?? '';
    await setDoc(doc(db,'carreiras',id), {...c,...nomes,
        periciasBasicas:bas.split(',').map(s=>s.trim()).filter(Boolean),
        periciasProfissionais:prof.split(',').map(s=>s.trim()).filter(Boolean),
        especializacoes:esp.split(',').map(s=>s.trim()).filter(Boolean)
    });
    await carregarBancosDeDados(); popularSelects();
};

window.editarEspecializacao=async id=>{const e=especializacoesDB.find(x=>x.id===id);if(e)abrirSkillBancoModal_('especializacoes',e);};
window.salvarSkillBancoModal_=async function(){if(userData?.role!=='mestre')return;const val=id=>String(document.getElementById(id)?.value||'').trim(),kind=val('dbSkillKind')||'pericias',idOriginal=val('dbSkillOrigId'),nomeAtivo=val(idCampoIdiomaBanco_('dbSkillNome','dbSkillNomeEn','dbSkillNomeZh')),nome=val('dbSkillNome')||nomeAtivo;if(!nomeAtivo){notificar_(rotuloIdiomaBanco_('Informe o nome da perícia/especialização.','Enter the skill/specialization name.','请输入技能/专长名称。'),'aviso');return;}const id=idOriginal||slugId_(nome),base=(kind==='pericias'?periciasDB:especializacoesDB).find(x=>x.id===idOriginal)||{};const obj={...base,id,nome,nome_en:val('dbSkillNomeEn'),nome_zh:val('dbSkillNomeZh'),tipo:val('dbSkillTipo'),formula:val('dbSkillFormula'),descricao:val('dbSkillDescricao')||val(idCampoIdiomaBanco_('dbSkillDescricao','dbSkillDescricaoEn','dbSkillDescricaoZh')),descricao_en:val('dbSkillDescricaoEn'),descricao_zh:val('dbSkillDescricaoZh'),disponivelCampanha:!!document.getElementById('dbSkillDisponivel')?.checked};if(kind==='pericias'){obj.categoria=val('dbSkillCategoria')||'Geral';obj.penalidadeArmadura=Number(document.getElementById('dbSkillPen')?.value)||0;obj.exigeEscola=!!document.getElementById('dbSkillExigeEscola')?.checked;obj.especializavel=obj.exigeEscola||!!base.especializavel;obj.escolas=listaCampoSkill_(val('dbSkillEscolas'));obj.familias=listaCampoSkill_(val('dbSkillFamilias'));}else obj.uso=val('dbSkillUso')||'Teste';await setDoc(doc(db,kind,id),obj,{merge:false});fecharSkillBancoModal_();await carregarBancosDeDados();notificar_('Registro salvo no banco.','sucesso',2200);};
window.alternarDisponibilidadeBanco_=async function(kind,id){if(userData?.role!=='mestre')return;const banco=kind==='especializacoes'?especializacoesDB:periciasDB,obj=banco.find(x=>x.id===id);if(!obj)return;const novo=obj.disponivelCampanha===false;await setDoc(doc(db,kind,id),{disponivelCampanha:novo},{merge:true});obj.disponivelCampanha=novo;if(kind==='especializacoes')renderizarBancoEspecializacoes();else renderizarBancoPericias();};

// Remover
window.removerPericia = async (id) => { if (!confirm('Remover?')) return; await deleteDoc(doc(db, "pericias", id)); periciasDB = periciasDB.filter(p => p.id !== id); renderizarBancoPericias(); };
window.removerOrigem = async (id) => { if (!confirm('Remover?')) return; await deleteDoc(doc(db, "origens", id)); origensDB = origensDB.filter(o => o.id !== id); popularSelects(); renderizarBancoOrigens(); };
window.removerCarreira = async (id) => { if (!confirm('Remover?')) return; await deleteDoc(doc(db, "carreiras", id)); carreirasDB = carreirasDB.filter(c => c.id !== id); popularSelects(); renderizarBancoCarreiras(); };
window.removerEspecializacao = async (id) => { if (!confirm('Remover?')) return; await deleteDoc(doc(db, "especializacoes", id)); especializacoesDB = especializacoesDB.filter(e => e.id !== id); renderizarBancoEspecializacoes(); };
window.alternarDisponibilidadeItemBanco_=async function(id){if(userData?.role!=='mestre')return;const obj=(itensDB||[]).find(x=>x.id===id);if(!obj)return;const novo=obj.disponivelCampanha===false;await setDoc(doc(db,'itens',id),{disponivelCampanha:novo},{merge:true});obj.disponivelCampanha=novo;renderizarBancoItens();renderizarMercado();};
window.removerItemBanco = async (id) => { if (!confirm('Remover?')) return; await deleteDoc(doc(db, "itens", id)); itensDB = itensDB.filter(i => i.id !== id); renderizarBancoItens(); };

