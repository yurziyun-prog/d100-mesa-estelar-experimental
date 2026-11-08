// ============================================
// INVENTÁRIO - MODAL
// ============================================
window.editarItem = (compartment, index) => {
    currentEditSlot = { compartment, index };
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    
    const inv = char.inventario || {};
    const items = inv[compartment] || [];
    const item = items[index];
    
    document.getElementById('modalItemNome').value = item ? item.nome || '' : '';
    document.getElementById('modalItemImg').value = item ? item.imagem || '' : '';
    document.getElementById('modalItemDesc').value = item ? item.descricao || '' : '';
    const protegeBox=document.getElementById('modalItemProtegeBox'),protege=document.getElementById('modalItemProtege');
    if(protegeBox&&protege){
        if(item&&itemEhArmadura_(item)){
            protegeBox.style.display='';
            protege.textContent=locaisProtegidosItem_(item,['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda']).join(', ');
        }else protegeBox.style.display='none';
    }
    document.getElementById('modalItemPeso').value = item ? item.peso || '' : '';
    document.getElementById('modalItemPA').value = item ? item.pa || '' : '';
    document.getElementById('modalItemPV').value = item ? item.pv || '' : '';
    document.getElementById('modalItemDano').value = item ? item.dano || '' : '';
    const btnConsumir=document.getElementById('modalItemConsumirBtn');if(btnConsumir)btnConsumir.style.display=item&&consumivelAtivo_(item)?'':'none';
    
    document.getElementById('itemModal').classList.add('active');
};

window.consumirItemModalAtual_=async()=>{
    if(!currentEditSlot)return;
    fecharModal();
    await usarConsumivel_(currentEditSlot.compartment,currentEditSlot.index);
};

window.salvarItem = async () => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    
    const inv = normalizarInventario_(char);
    if (!inv[currentEditSlot.compartment]) {
        const tamanho = ({ equipado: 12, bolso: 2, mochila: 20, veiculo: 50, casa: 100 })[currentEditSlot.compartment] || 20;
        inv[currentEditSlot.compartment] = Array(tamanho).fill(null);
    }
    
    const itemAnterior = inv[currentEditSlot.compartment][currentEditSlot.index] || null;
    const novoItem = {
        nome: document.getElementById('modalItemNome').value.trim(),
        imagem: document.getElementById('modalItemImg').value.trim() || uploadedItemImage,
        descricao: document.getElementById('modalItemDesc').value.trim(),
        peso: parseFloat(document.getElementById('modalItemPeso').value) || 0,
        pa: parseInt(document.getElementById('modalItemPA').value) || 0,
        pv: parseInt(document.getElementById('modalItemPV').value) || 0,
        dano: document.getElementById('modalItemDano').value.trim()
    };
    inv[currentEditSlot.compartment][currentEditSlot.index] = novoItem;
    if (!validarPesoCompartimento_(char, inv, currentEditSlot.compartment, true)) {
        inv[currentEditSlot.compartment][currentEditSlot.index] = itemAnterior;
        return;
    }
    
    await setDoc(doc(db, "personagens", currentCharId), { inventario: inv }, { merge: true });
    somSalvar_();
    await carregarPersonagens();
    fecharModal();
};

window.removerItemAtual = async () => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    
    const inv = char.inventario || {};
    if (inv[currentEditSlot.compartment]) {
        inv[currentEditSlot.compartment][currentEditSlot.index] = null;
        await setDoc(doc(db, "personagens", currentCharId), { inventario: inv }, { merge: true });
        await carregarPersonagens();
    }
    fecharModal();
};

window.fecharModal = () => {
    document.getElementById('itemModal').classList.remove('active');
    uploadedItemImage = null;
};

// ============================================
// IDIOMA
// ============================================
window.mudarIdioma = (lang) => {
    idiomaAtual = lang;
    localStorage.setItem('idiomaPreferido', lang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((lang === 'pt' && btn.textContent === 'PT') || (lang === 'en' && btn.textContent === 'EN') || (lang === 'zh' && btn.textContent === '中文')) {
            btn.classList.add('active');
        }
    });
    const t = traducoes[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
    if (userData) {
        const roleText = userData.role === 'mestre' ? t.mestre : t.jogador;
        document.getElementById('userRole').textContent = roleText;
        document.getElementById('configTabBtn')?.style && (document.getElementById('configTabBtn').style.display = userData.role === 'mestre' ? 'block' : 'none');
        document.getElementById('bancoTabBtn')?.classList.toggle('hidden', userData.role !== 'mestre');
        document.getElementById('escudoTabBtn').classList.toggle('hidden', userData.role !== 'mestre');
            document.getElementById('laboratorioTabBtn')?.classList.remove('hidden');
            document.getElementById('batalhaTabBtn')?.classList.add('hidden');
    }
    if (currentCharId) {
        const char = userCharacters.find(c => c.id === currentCharId);
        if (char) {
            atualizarVisualizacao(char);
            preencherFormulario(char);
        }
    }
    renderizarListaPersonagens();
    if (document.getElementById('marketGrid')) renderizarMercado();
    if (document.getElementById('regrasViewMode')) renderizarRegras();
    if (currentCharId) {
        const charAtual = userCharacters.find(c => c.id === currentCharId);
        if (charAtual) {
            popularSelects();
            renderizarPericias(charAtual);
            renderizarCombate(charAtual);
            renderizarPsiRolagem_(charAtual);
            renderizarHistoricoCombate_(charAtual);
            renderizarHistoricoGeral_(charAtual);
            popularEquipamentosCombate_(charAtual);
            atualizarListaPericias();
        }
    }
    aplicarIdiomaCamposBanco_();
    if(userData?.role==='mestre')renderizarBancoDados();
};

window.addEventListener('DOMContentLoaded', () => {
    const idiomaSalvo = localStorage.getItem('idiomaPreferido') || 'pt';
    mudarIdioma(idiomaSalvo);
});

// ============================================
// CONFIGURAÇÕES
// ============================================
window.salvarConfiguracoes = async () => {
    if (userData.role !== 'mestre') { alert('Apenas o mestre!'); return; }
    configuracoes = {
        etapa1: parseInt(document.getElementById('configEtapa1').value),
        etapa2: parseInt(document.getElementById('configEtapa2').value),
        etapa3: parseInt(document.getElementById('configEtapa3').value),
        etapa4: parseInt(document.getElementById('configEtapa4').value),
        minAttr: parseInt(document.getElementById('configMinAttr').value),
        minAttrINT: parseInt(document.getElementById('configMinAttrINT').value),
        maxAttr: parseInt(document.getElementById('configMaxAttr').value),
        maxTreino: parseInt(document.getElementById('configMaxTreino').value),
        recursosIniciais: Math.max(0, Math.floor(Number(document.getElementById('configRecursosIniciais').value) || 0)),
        modoCombate: document.getElementById('configModoCombate').value === 'simplificado' ? 'simplificado' : 'tatico'
    };
    await setDoc(doc(db, "configuracoes", "sistema"), configuracoes);
    const charAtual = userCharacters.find(c => c.id === currentCharId);
    if (charAtual) renderizarCombate(charAtual);
    alert('Configurações salvas!');
};

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================
window.novoPersonagem = novoPersonagem;
window.selecionarPersonagem = selecionarPersonagem;
window.deletarPersonagem = deletarPersonagem;
window.salvarPersonagem = salvarPersonagem;
window.validarAtributos = validarAtributos;
window.calcularTotal = calcularTotal;
window.calcularDerivados = calcularDerivados;
window.calcularAlturaPesoAutomatico = calcularAlturaPesoAutomatico;
window.salvarAlturaPeso = salvarAlturaPeso;
window.salvarRecursos = salvarRecursos;
window.renderizarMercado = renderizarMercado;
window.comprarItemMercado = comprarItemMercado;
window.mostrarAba = mostrarAba;
window.mostrarCharAba = mostrarCharAba;
window.mostrarBancoAba = mostrarBancoAba;
window.salvarConfiguracoes = salvarConfiguracoes;
window.mudarIdioma = mudarIdioma;
window.mudarEtapaPericias = mudarEtapaPericias;
window.atualizarTreinoPericia = atualizarTreinoPericia;
window.atualizarTreinoEspecializacao = atualizarTreinoEspecializacao;
window.salvarPericias = salvarPericias;
window.salvarAnotacoes = salvarAnotacoes;
window.adicionarPericia = adicionarPericia;
window.editarPericia = editarPericia;
window.removerPericia = removerPericia;
window.adicionarOrigem = adicionarOrigem;
window.editarOrigem = editarOrigem;
window.removerOrigem = removerOrigem;
window.adicionarCarreira = adicionarCarreira;
window.editarCarreira = editarCarreira;
window.removerCarreira = removerCarreira;
window.adicionarEspecializacao = adicionarEspecializacao;
window.editarEspecializacao = editarEspecializacao;
window.removerEspecializacao = removerEspecializacao;
window.adicionarPoderPsi = adicionarPoderPsi;
window.editarPoderPsi = editarPoderPsi;
window.removerPoderPsi = removerPoderPsi;
window.usarPoderPsi = usarPoderPsi;
window.renderizarPsiRolagem_ = renderizarPsiRolagem_;
window.atualizarPoderesPsiRolagem = atualizarPoderesPsiRolagem;
window.atualizarDetalhePsiRolagem = atualizarDetalhePsiRolagem;
window.usarPoderPsiRolagem = usarPoderPsiRolagem;
window.adicionarItemBanco = adicionarItemBanco;
window.editarItemBanco = editarItemBanco;
window.removerItemBanco = removerItemBanco;
window.fecharItemBancoModal = fecharItemBancoModal;
window.salvarItemBancoModal = salvarItemBancoModal;
window.editarRegras = editarRegras;
window.salvarRegras = salvarRegras;
window.cancelarEdicaoRegras = cancelarEdicaoRegras;
window.editarEscudo = editarEscudo;
window.salvarEscudo = salvarEscudo;
window.cancelarEdicaoEscudo = cancelarEdicaoEscudo;
window.editarItem = editarItem;
window.salvarItem = salvarItem;
window.removerItemAtual = removerItemAtual;
window.fecharModal = fecharModal;
window.salvarCombate = salvarCombate;
window.salvarPATotal = salvarPATotal;
window.mostrarDanoEquipamentoCombate = mostrarDanoEquipamentoCombate;
window.atualizarPainelCombate = atualizarPainelCombate;
window.rolarCombateD100 = rolarCombateD100;
window.rolarDanoCombate = rolarDanoCombate;
window.rolarLocalizacaoCombate = rolarLocalizacaoCombate;
window.rolarIniciativaCombate = rolarIniciativaCombate;
window.atualizarListaPericias = atualizarListaPericias;
window.mostrarValorPericia = mostrarValorPericia;
window.salvarFadiga = salvarFadiga;
window.rolarDado = rolarDado;
window.rolarFormula = rolarFormula;
window.rolarPericia = rolarPericia;
window.rolarDanoArma = rolarDanoArma;
window.handleItemImageUpload = handleItemImageUpload;
window.importarPlanilha = importarPlanilha;
window.baixarTemplate = baixarTemplate;

window.restaurarNPCBanco_=async id=>{
    const n=npcBancoPorId_(id);if(!n)return;
    if(!confirm(`Restaurar completamente ${n.nome}?`))return;
    const estado={hitLocations:{},armor:{},fadiga:'Fresh',armas:[],municao:[],ferimentos:{},inconsciente:false,incapacitado:false,morto:false,ataquesBloqueadosTurnos:0,sangramentoAtivo:false};
    n.estadoCombate=estado;
    await setDoc(doc(db,'npcs',String(id)),{estadoCombate:estado},{merge:true});
    for(const p of batalhaEstado_?.participantes||[])if(String(p.npcBancoId)===String(id))p.npcCombate=JSON.parse(JSON.stringify(estado));
    if(batalhaEstado_?.ativo)await batalhaSalvarEstado_();
    renderizarBancoNPCs_();renderizarBatalhaCompartilhada_();
    notificar_(`${n.nome} restaurado.`,'info');
};
window.restaurarTodosNPCsBanco_=async()=>{
    if(userData?.role!=='mestre'||!npcsDB.length)return;
    if(!confirm(`Restaurar PV, fadiga e estados de combate de todos os ${npcsDB.length} NPCs?`))return;
    const estado=()=>({hitLocations:{},armor:{},fadiga:'Fresh',armas:[],municao:[],ferimentos:{},inconsciente:false,incapacitado:false,morto:false,ataquesBloqueadosTurnos:0,sangramentoAtivo:false,caido:false,primeirosSocorrosEmAndamento:null});
    for(const n of npcsDB){
        n.estadoCombate=estado();
        await setDoc(doc(db,'npcs',String(n.id)),{estadoCombate:n.estadoCombate},{mergeFields:['estadoCombate']});
    }
    for(const p of batalhaEstado_?.participantes||[]){
        if(p.npcBancoId)p.npcCombate=estado();
    }
    if(batalhaEstado_?.ativo)await batalhaSalvarEstado_();
    renderizarBancoNPCs_();renderizarBatalhaCompartilhada_();
    notificar_('Todos os NPCs foram restaurados.','info');
};



function renderizarRegrasD100_(){
    let el=document.getElementById('d100CoreRules');
    if(!el){
        const base=document.getElementById('combatCompatibilityRules');if(!base)return;
        el=document.createElement('div');el.id='d100CoreRules';el.style.marginTop='22px';base.insertAdjacentElement('beforebegin',el);
    }
    el.innerHTML=`<h3>🎲 Resultados D100</h3><table style="width:100%;border-collapse:collapse;"><thead><tr><th>Resultado</th><th>Regra</th></tr></thead><tbody>
      <tr><td>Crítico</td><td>1/10 da perícia efetiva, arredondado para cima.</td></tr>
      <tr><td>Sucesso</td><td>Igual ou abaixo da perícia efetiva.</td></tr>
      <tr><td>Falha</td><td>Acima da perícia efetiva.</td></tr>
      <tr><td>Fiasco</td><td>99 ou 00. Se a perícia efetiva exceder 100%, somente 00 é Fiasco. Em ataques, o atacante sofre um acidente: arma usada perde 1 PV; ataques naturais causam 1 dano na parte corporal correspondente.</td></tr>
      </tbody></table>`;
}

function renderizarTabelaFadigaCompleta_(){
    const el=document.getElementById('fatigueRulesFull');if(!el)return;
    const rows=[['Fresh','Nenhuma'],['Winded','Difícil'],['Tired','Difícil'],['Wearied','Formidável'],['Exhausted','Formidável'],['Debilitated','Hercúleo'],['Incapacitated','Hercúleo'],['Semi-Conscious','Sem atividades'],['Comatose','Sem ações'],['Dead','Morto']];
    el.innerHTML=`<h3>😮‍💨 Fadiga</h3><table style="width:100%"><thead><tr><th>Estado</th><th>Efeito</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>`;
}


function renderizarRegrasPrimeirosSocorros_(){
    let el=document.getElementById('firstAidCombatRules');
    if(!el){
        const base=document.getElementById('inventoryCombatRules')||document.getElementById('woundRulesFull');
        if(!base)return;
        el=document.createElement('div');el.id='firstAidCombatRules';el.style.marginTop='22px';base.insertAdjacentElement('afterend',el);
    }
    el.innerHTML=`<h3>🩹 Primeiros Socorros em combate</h3>
      <table style="width:100%;border-collapse:collapse;"><thead><tr><th>Situação</th><th>Regra</th></tr></thead><tbody>
      <tr><td>Duração</td><td>Iniciar custa 1 AÇ. Na próxima oportunidade do personagem, o atendimento ocupa a oportunidade inteira, custa mais 1 AÇ e só então o teste/recuperação são resolvidos.</td></tr><tr><td>Enquanto trata</td><td>Pode receber ataques e defender, mas a defesa sofre +2 graus de dificuldade. Não pode realizar outras ações proativas antes de concluir.</td></tr>
      <tr><td>Kit Médico Básico</td><td>Se houver um kit acessível (equipado, bolso ou mochila) com PV restantes, ele perde 1 PV automaticamente. Sem kit utilizável, o teste recebe +1 grau de dificuldade.</td></tr>
      <tr><td>Sucesso · ferimento leve</td><td>Recupera 1d3 PV na localização.</td></tr>
      <tr><td>Sucesso · ferimento sério</td><td>Restaura funcionalidade parcial; não devolve PV imediatamente.</td></tr>
      <tr><td>Sucesso · ferimento grave</td><td>Estabiliza/trata a localização; não devolve PV imediatamente.</td></tr>
      <tr><td>Crítico</td><td>Regra da campanha: restaura completamente os PV da localização escolhida.</td></tr>
      <tr><td>Falha crítica</td><td>Regra da campanha: causa +1 de dano na localização tratada.</td></tr>
      </tbody></table>`;
}


function renderizarRegrasNutricao_(){
    let el=document.getElementById('nutritionRules');
    if(!el){const base=document.getElementById('firstAidCombatRules')||document.getElementById('inventoryCombatRules')||document.getElementById('woundRulesFull');if(!base)return;el=document.createElement('div');el.id='nutritionRules';el.style.marginTop='22px';base.insertAdjacentElement('afterend',el);}
    el.innerHTML=`<h3>🍽️ Alimentação, água e Fadiga</h3><table style="width:100%;border-collapse:collapse;"><thead><tr><th>Situação</th><th>Regra</th></tr></thead><tbody>
      <tr><td>Consumo diário</td><td>2 pontos de alimento + 2 pontos de água por personagem/dia, consumidos automaticamente quando o Dia de Campanha avança.</td></tr>
      <tr><td>Falta</td><td>Se faltar alimento ou água para completar a necessidade diária, a Fadiga piora 1 nível naquele dia; acumula dia após dia.</td></tr>
      <tr><td>Uso manual</td><td>Café, cerveja, água e alimentos recuperam 1 nível de Fadiga, no máximo uma vez por dia no total.</td></tr>
      <tr><td>Porções</td><td>Cada uso gasta 1 ponto. Rações multiuso usam o campo Uso como quantidade de porções.</td></tr>
      </tbody></table>`;
}
function renderizarRegrasInventarioCombate_(){
    let el=document.getElementById('inventoryCombatRules');
    if(!el){
        const base=document.getElementById('woundRulesFull')||document.getElementById('combatCompatibilityRules');
        if(!base)return;
        el=document.createElement('div');el.id='inventoryCombatRules';el.style.marginTop='22px';base.insertAdjacentElement('afterend',el);
    }
    el.innerHTML=`<h3>🎒 Inventário durante combate</h3><table style="width:100%;border-collapse:collapse;">
      <thead><tr><th>Ação</th><th>Custo/restrição</th></tr></thead><tbody>
      <tr><td>Equipar item do bolso/mochila</td><td>1 AÇ por item.</td></tr>
      <tr><td>Equipar item de veículo/casa</td><td>Não permitido em combate.</td></tr>
      <tr><td>Recarregar arma</td><td>1 AÇ; armas pesadas exigem 2 AÇ.</td></tr>
      <tr><td>Usar munição de veículo/casa</td><td>Não permitido em combate.</td></tr>
      <tr><td>Fora de combate</td><td>Equipar e recarregar são ações livres.</td></tr>
      </tbody></table>`;
}

function renderizarTabelaFerimentosCompleta_(){
    const el=document.getElementById('woundRulesFull');if(!el)return;
    const rows=[
      ['Leve','PV > 0','Sem penalidade automática; cura diária.'],
      ['Sério','PV ≤ 0 e > -PV máximo','1d3 turnos sem atacar; teste oposto de Resistência; membro pode ficar inutilizado; cabeça/peito/abdômen podem causar inconsciência; cura semanal.'],
      ['Grave','PV ≤ -PV máximo','Incapacitação; novo teste de Resistência; pode destruir membro ou matar; cura mensal só após tratamento.'],
      ['Sangramento','Bleed','-1 nível de Fadiga por rodada até estancar. Armas laser/plasma/blaster/energia não causam Bleed nesta campanha.'],
      ['Caído','Estado','Ataques e defesas sofrem +2 graus de dificuldade. Em corpo a corpo, um atacante caído só alcança as pernas do adversário. Levantar custa 1 AÇ.'],
      ['Arma a 0 PV','Equipamento','A arma fica inutilizável e desaparece das opções de combate até ser reparada. Danificar Arma não pode ser escolhido contra Punhos/armas naturais.']];
    el.innerHTML=`<h3>🩸 Ferimentos por localização</h3><table style="width:100%"><thead><tr><th>Estado</th><th>Quando</th><th>Consequência</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

// v192: a descrição do item nunca ultrapassa a tela — ao passar o mouse, o balão é posicionado dentro da janela
document.addEventListener('mouseover', e => {
    const slot = e.target.closest?.('.inventory-slot');
    const tip = slot?.querySelector('.item-tooltip');
    if (!tip) return;
    tip.style.position = 'fixed'; tip.style.transform = 'none'; tip.style.bottom = 'auto';
    const r = slot.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const w = Math.min(tip.offsetWidth || 260, vw - 16), alt = tip.offsetHeight || 120;
    let x = r.left + r.width / 2 - w / 2; x = Math.max(8, Math.min(x, vw - w - 8));
    let y = r.top - alt - 6; if (y < 8) y = Math.min(r.bottom + 6, Math.max(8, vh - alt - 8));
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
}, { passive: true });
