// ============================================
// FUNÇÕES DE NAVEGAÇÃO
// ============================================
window.mostrarAba = (abaId, btn) => {
    const abasMestre = ['config', 'banco', 'escudo', 'batalha'];
    if (abasMestre.includes(abaId) && (!userData || userData.role !== 'mestre')) {
        alert('Esta área é exclusiva do mestre.');
        return;
    }
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const alvo = document.getElementById(abaId);
    if (!alvo) return;
    alvo.classList.add('active');
    if (btn) btn.classList.add('active');
    if (abaId === 'mercado') {
        atualizarCompradorMercado_();
        if(marketSubtabAtual_==='vender')renderizarVendaMercado_();
        else if(marketSubtabAtual_==='local')renderizarMercadoLocal_();
        else renderizarMercado();
    }
    if (abaId === 'batalha') renderizarBatalhaCompartilhada_();
    if (abaId === 'laboratorio-combate') {
        labSuspensoParaNova_=false;
        if(!labTransport_)labIniciarTransporte_();
        labRender_();
    }
    if (abaId === 'cenario-publico') renderizarCenarioAtualPublico_();
};

window.mostrarCharAba = (abaId, btn) => {
    document.querySelectorAll('.char-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.char-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`char-${abaId}`).classList.add('active');
    btn.classList.add('active');
    
    if (currentCharId) {
        const char = userCharacters.find(c => c.id === currentCharId);
        if (char && abaId === 'pericias') {
            document.getElementById('periciasEtapa').value = personagemCriacaoConcluida_(char) ? 'todas' : 'origem';
            renderizarPericias(char);
        }
        if (char && abaId === 'combate') renderizarCombate(char);
        if (abaId === 'cenario-atual') renderizarCenarioAtualPublico_();
        if (char && abaId === 'rolagem') {
            atualizarListaPericias();
            renderizarPsiRolagem_(char);
        }
    }
};

window.mostrarBancoAba = (abaId, btn) => {
    if (!userData || userData.role !== 'mestre') {
        alert('O Banco de Dados é exclusivo do mestre.');
        return;
    }
    const painel = document.getElementById('banco');
    painel.querySelectorAll(':scope .form-section > .tab-content').forEach(tab => tab.classList.remove('active'));
    painel.querySelectorAll(':scope .form-section > .tabs > .tab-btn').forEach(b => b.classList.remove('active'));
    const alvo = document.getElementById(`banco-${abaId}`);
    if (!alvo) {
        console.warn('Aba do banco não encontrada:', abaId);
        return;
    }
    alvo.classList.add('active');
    btn.classList.add('active');
    if (abaId === 'pericias') renderizarBancoPericias();
    if (abaId === 'origens') renderizarBancoOrigens();
    if (abaId === 'carreiras') renderizarBancoCarreiras();
    if (abaId === 'especializacoes') renderizarBancoEspecializacoes();
    if (abaId === 'poderesPsi') renderizarBancoPoderesPsi();
    if (abaId === 'itens') renderizarBancoItens();
    if (abaId === 'npcs') renderizarBancoNPCs_();
    if (abaId === 'criaturas') renderizarBancoCriaturas_();
    if (abaId === 'cenarios') renderizarBancoCenarios();
    if (abaId === 'mapas') renderizarBancoMapas_();
    if (abaId === 'objetosMapa') renderizarBancoObjetosMapa_();
};



