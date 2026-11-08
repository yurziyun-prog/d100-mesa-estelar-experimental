// ============================================
// FUNÇÕES DE PERÍCIAS
// ============================================
function normalizarChaveInvestimento_(chave) {
    const mapa = { '2': 'origem', '3': 'carreira', '4': 'hobbie', origem: 'origem', carreira: 'carreira', hobbie: 'hobbie' };
    return mapa[String(chave || '').toLowerCase()] || 'origem';
}

function obterInvestimentosPericia_(dados = {}) {
    if (dados.investimentos && typeof dados.investimentos === 'object') {
        return {
            origem: Math.max(0, parseInt(dados.investimentos.origem) || 0),
            carreira: Math.max(0, parseInt(dados.investimentos.carreira) || 0),
            hobbie: Math.max(0, parseInt(dados.investimentos.hobbie) || 0),
            xp: Math.max(0, parseInt(dados.investimentos.xp) || 0)
        };
    }

    // Compatibilidade com personagens criados pela versão antiga.
    const legado = Math.max(0, parseInt(dados.treinoTotal ?? dados.treinoEtapa) || 0);
    const chaveLegada = normalizarChaveInvestimento_(dados.etapa);
    return {
        origem: chaveLegada === 'origem' ? legado : 0,
        carreira: chaveLegada === 'carreira' ? legado : 0,
        hobbie: chaveLegada === 'hobbie' ? legado : 0,
        xp: Math.max(0, parseInt(dados.xpTreino) || 0)
    };
}

function totalTreinoPericia_(dados = {}) {
    const inv = obterInvestimentosPericia_(dados);
    return inv.origem + inv.carreira + inv.hobbie + inv.xp;
}

function listaIds_(valor) {
    if (Array.isArray(valor)) return valor.filter(Boolean);
    if (!valor) return [];
    return String(valor).split(/[|,]/).map(v => v.trim()).filter(Boolean);
}

let rascunhoPericias_={};

function rascunhoPericiasChar_(char){
    if(!char)return null;
    const id=String(char.id||currentCharId||'');
    if(!rascunhoPericias_[id]){
        rascunhoPericias_[id]={
            pericias:JSON.parse(JSON.stringify(char.pericias||{})),
            especializacoes:JSON.parse(JSON.stringify(char.especializacoes||{})),
            sujo:false
        };
    }
    return rascunhoPericias_[id];
}
function limparRascunhoPericias_(charId){
    delete rascunhoPericias_[String(charId||'')];
}

function renderizarPericias(char) {
    const attrsBase = char.atributos || {};
    const bonus = char.bonus || {};
    const attrs = {};
    ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'].forEach(a => {
        attrs[a] = (parseInt(attrsBase[a]) || 10) + (parseInt(bonus[a]) || 0);
    });

    const periciasSalvas = char.pericias || {};
    const especializacoesSalvas = char.especializacoes || {};
    const rascunho=rascunhoPericiasChar_(char);
    const pericias = rascunho?.pericias || periciasSalvas;
    const especializacoes = rascunho?.especializacoes || especializacoesSalvas;
    const seletorVisao=document.getElementById('periciasEtapa');
    if(personagemCriacaoConcluida_(char)&&userData?.role!=='mestre'&&seletorVisao)seletorVisao.value='todas';
    const visao = String(seletorVisao?.value || 'origem').toLowerCase();
    const origem = origensDB.find(o => o.id === char.origem);
    const carreira = carreirasDB.find(c => c.id === char.carreira);
    const isMaster = userData && userData.role === 'mestre';
    const maxTreinoCategoria = isMaster ? 999 : (configuracoes.maxTreino || 30);
    const pontosPorVisao = {
        origem: configuracoes.etapa2 || 100,
        carreira: configuracoes.etapa3 || 100,
        hobbie: configuracoes.etapa4 || 150
    };

    let periciasDisponiveis = [];
    let especializacoesDisponiveis = [];
    const aliasPericiaCampanha_={cofres_fechaduras:'seguranca',genealogia:'historia',heraldismo:'historia',lingua_antiga:'idiomas',saber_lore:'conhecimentos_gerais',sobrevivencia_espacial:'sobrevivencia',transe:'meditacao'};
    const idsComAlias_=xs=>listaIds_(xs).map(id=>aliasPericiaCampanha_[id]||id);

    if (visao === 'origem' && origem) {
        const idsBasicas = idsComAlias_(origem.periciasBasicas);
        // Regra Mesa Estelar: Origem não libera Perícias Profissionais.
        // Mantemos os campos no banco para compatibilidade/importação, mas eles não são treináveis nesta etapa.
        periciasDisponiveis = periciasDB.filter(p => idsBasicas.includes(p.id) && p.tipo === 'Básica');
        especializacoesDisponiveis = [];
    } else if (visao === 'carreira' && carreira) {
        const idsBasicas = idsComAlias_(carreira.periciasBasicas);
        const idsProf = idsComAlias_(carreira.periciasProfissionais);
        const idsEsp = listaIds_(carreira.especializacoes);
        periciasDisponiveis = periciasDB.filter(p => idsBasicas.includes(p.id) || idsProf.includes(p.id));
        especializacoesDisponiveis = especializacoesDB.filter(e => idsEsp.includes(e.id));
    } else if (visao === 'hobbie') {
        periciasDisponiveis = [...periciasDB];
        especializacoesDisponiveis = [...especializacoesDB];
    } else if (visao === 'todas') {
        // Na visão geral, todas as básicas continuam visíveis; profissionais e
        // especializações aparecem quando o personagem possui investimento.
        periciasDisponiveis = periciasDB.filter(p => p.tipo === 'Básica' || totalTreinoPericia_(pericias[p.id]) > 0);
        especializacoesDisponiveis = especializacoesDB.filter(e => totalTreinoPericia_(especializacoes[e.id]) > 0);
    }
    periciasDisponiveis = periciasDisponiveis.filter(p => isMaster || p.disponivelCampanha!==false || totalTreinoPericia_(pericias[p.id])>0);
    especializacoesDisponiveis = especializacoesDisponiveis.filter(e => isMaster || e.disponivelCampanha!==false || totalTreinoPericia_(especializacoes[e.id])>0);

    const calcularFormula = (formula, valores) => {
        try {
            let expr = String(formula || '0');
            if(expr.includes('MAIOR')){ const maior=Math.max(...['FOR','TAM','DES','INT','CAR'].map(k=>Number(valores?.[k]||0))); expr=expr.replace(/MAIOR/g,String(maior)); }
            ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'].forEach(a => {
                expr = expr.replace(new RegExp(a, 'g'), valores[a] || 0);
            });
            if (!/^[0-9+\-*/().\s]+$/.test(expr)) return 0;
            return Math.round(Function(`"use strict"; return (${expr})`)());
        } catch (e) {
            console.warn('Fórmula inválida:', formula, e);
            return 0;
        }
    };

    const investimentoNaVisao = (dados) => {
        const inv = obterInvestimentosPericia_(dados);
        if (visao === 'todas') return totalTreinoPericia_(dados);
        return inv[visao] || 0;
    };

    const totalInvestidoCategoria = visao === 'todas' ? 0 : [
        ...Object.values(pericias), ...Object.values(especializacoes)
    ].reduce((soma, dados) => soma + investimentoNaVisao(dados), 0);

    const rotulos = { origem: 'Origem', carreira: 'Carreira', hobbie: 'Hobbie', todas: 'Todas' };
    document.getElementById('periciasEtapaLabel').textContent = rotulos[visao] || 'Origem';

    const pontosBox = document.getElementById('pontosRestantesBox');
    if (visao === 'todas') {
        document.getElementById('periciasPontosRestantes').textContent = '—';
        document.getElementById('periciasPontosTotal').textContent = '—';
        document.getElementById('periciasTotalInvestido').textContent = Object.values(pericias).reduce((s, d) => s + totalTreinoPericia_(d), 0) + Object.values(especializacoes).reduce((s, d) => s + totalTreinoPericia_(d), 0);
        pontosBox.classList.remove('over');
    } else {
        const pontosTotal = pontosPorVisao[visao] || 100;
        document.getElementById('periciasPontosRestantes').textContent = Math.max(0, pontosTotal - totalInvestidoCategoria);
        document.getElementById('periciasPontosTotal').textContent = pontosTotal;
        document.getElementById('periciasTotalInvestido').textContent = totalInvestidoCategoria;
        pontosBox.classList.toggle('over', totalInvestidoCategoria > pontosTotal);
    }

    const corpoInvestidas = document.getElementById('corpoPericiasInvestidas');
    const corpoBasicas = document.getElementById('corpoPericiasBasicas');
    const corpoProfissionais = document.getElementById('corpoPericiasProfissionais');
    const corpoEspecializacoes = document.getElementById('corpoEspecializacoes');
    corpoInvestidas.innerHTML = '';
    corpoBasicas.innerHTML = '';
    corpoProfissionais.innerHTML = '';
    corpoEspecializacoes.innerHTML = '';

    const renderLinhaPericia = (p, somenteLeitura = false) => {
        const base = calcularFormula(p.formula, attrs);
        const dados = pericias[p.id] || {};
        const treinoTotal = totalTreinoPericia_(dados);
        const treinoVisao = visao === 'todas' ? treinoTotal : investimentoNaVisao(dados);
        const total = base + treinoTotal;
        const input = somenteLeitura
            ? `<span>${treinoTotal}</span>`
            : `<input type="number" value="${treinoVisao}" min="0" max="${maxTreinoCategoria}" oninput="atualizarTreinoPericia('${p.id}', this.value, '${p.tipo}', '${visao}')">`;
        const escolaAtual=dados.escola||'';
        const escolaBloqueada=personagemCriacaoConcluida_(char)&&!isMaster;
        const seletorEscola=(p.exigeEscola&&treinoTotal>0)?`<div style="margin-top:5px"><select onchange="definirEscolaPericia_('${p.id}',this.value)" ${escolaBloqueada?'disabled title="Após concluir a ficha, somente o mestre pode alterar esta especialização."':''} style="max-width:220px"><option value="">— escolher escola —</option>${(p.escolas||[]).map(x=>`<option value="${x}" ${x===escolaAtual?'selected':''}>${x}</option>`).join('')}</select></div>`:'';
        const desc=getDescricao(p)||'';const dica=desc?` class="skill-help" data-skill-tip="${escaparBanco_(desc)}"`:'';
        return `<tr class="${treinoTotal > 0 ? 'skill-invested' : ''}"><td${dica}>${getNome(p)}${seletorEscola}</td><td>${formatarFormulaIdioma_(p.formula)}</td><td>${base}</td><td>${input}</td><td class="skill-total">${total}</td></tr>`;
    };

    const renderLinhaEspecializacao = (e, somenteLeitura = false) => {
        const base = calcularFormula(e.formula, attrs);
        const dados = especializacoes[e.id] || {};
        const treinoTotal = totalTreinoPericia_(dados);
        const treinoVisao = visao === 'todas' ? treinoTotal : investimentoNaVisao(dados);
        const total = base + treinoTotal;
        const input = somenteLeitura
            ? `<span>${treinoTotal}</span>`
            : `<input type="number" value="${treinoVisao}" min="0" max="${maxTreinoCategoria}" oninput="atualizarTreinoEspecializacao('${e.id}', this.value, '${visao}')">`;
        const desc=getDescricao(e)||'';const dica=desc?` class="skill-help" data-skill-tip="${escaparBanco_(desc)}"`:'';
        return `<tr class="${treinoTotal > 0 ? 'skill-invested' : ''}"><td${dica}>${getNome(e)}</td><td>${e.tipo} - ${formatarFormulaIdioma_(e.formula)}</td><td>${base}</td><td>${input}</td><td class="skill-total">${total}</td></tr>`;
    };

    const estaInvestidaSalvaNestaVisao = (dados) => {
        if(visao==='todas')return totalTreinoPericia_(dados)>0;
        const inv=obterInvestimentosPericia_(dados);
        return Number(inv[visao]||0)>0;
    };
    const somenteLeitura = visao === 'todas' || (personagemCriacaoConcluida_(char) && !isMaster);

    // Enquanto edita, a linha permanece onde estava. Só "sobe" para
    // Perícias com Investimento depois de clicar Salvar Perícias.
    const periciasInvestidas = periciasDisponiveis.filter(p => estaInvestidaSalvaNestaVisao(periciasSalvas[p.id] || {}));
    const espInvestidas = especializacoesDisponiveis.filter(e => estaInvestidaSalvaNestaVisao(especializacoesSalvas[e.id] || {}));
    const periciasNaoInvestidasBasicas = periciasDisponiveis.filter(p => p.tipo === 'Básica' && !estaInvestidaSalvaNestaVisao(periciasSalvas[p.id] || {}));
    const periciasNaoInvestidasProfissionais = periciasDisponiveis.filter(p => p.tipo === 'Profissional' && !estaInvestidaSalvaNestaVisao(periciasSalvas[p.id] || {}));
    const espNaoInvestidas = especializacoesDisponiveis.filter(e => !estaInvestidaSalvaNestaVisao(especializacoesSalvas[e.id] || {}));

    periciasInvestidas.forEach(p => corpoInvestidas.innerHTML += renderLinhaPericia(p, somenteLeitura));
    espInvestidas.forEach(e => corpoInvestidas.innerHTML += renderLinhaEspecializacao(e, somenteLeitura));
    periciasNaoInvestidasBasicas.forEach(p => corpoBasicas.innerHTML += renderLinhaPericia(p, somenteLeitura));
    periciasNaoInvestidasProfissionais.forEach(p => corpoProfissionais.innerHTML += renderLinhaPericia(p, somenteLeitura));
    espNaoInvestidas.forEach(e => corpoEspecializacoes.innerHTML += renderLinhaEspecializacao(e, somenteLeitura));
    const secProf=corpoProfissionais?.closest('table')?.previousElementSibling;
    const tabProf=corpoProfissionais?.closest('table');
    if(secProf)secProf.style.display=(visao==='origem'||(!periciasNaoInvestidasProfissionais.length&&!periciasInvestidas.some(p=>p.tipo==='Profissional')))?'none':'';
    if(tabProf)tabProf.style.display=(visao==='origem'||!periciasNaoInvestidasProfissionais.length)?'none':'';
    const secEsp=corpoEspecializacoes?.closest('table')?.previousElementSibling;
    const tabEsp=corpoEspecializacoes?.closest('table');
    if(secEsp)secEsp.style.display=(visao==='origem'||(!espNaoInvestidas.length&&!espInvestidas.length))?'none':'';
    if(tabEsp)tabEsp.style.display=(visao==='origem'||!espNaoInvestidas.length)?'none':'';
    renderizarXpPendente_(char);
}

window.atualizarTreinoPericia = (periciaId, valor, tipo, categoria) => {
    if (!currentCharId || categoria === 'todas') return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const draft=rascunhoPericiasChar_(char);
    const pericias = draft.pericias;
    const atual = { ...(pericias[periciaId] || {}) };
    const inv = obterInvestimentosPericia_(atual);
    const limite = userData && userData.role === 'mestre' ? 999 : (configuracoes.maxTreino || 30);
    const pontosDisponiveis = { origem: configuracoes.etapa2 || 100, carreira: configuracoes.etapa3 || 100, hobbie: configuracoes.etapa4 || 150 };
    let valorNum = Math.max(0, Math.min(parseInt(valor) || 0, limite));

    const totalOutras = [
        ...Object.entries(pericias).filter(([id]) => id !== periciaId).map(([, d]) => obterInvestimentosPericia_(d)[categoria] || 0),
        ...Object.values(draft.especializacoes || {}).map(d => obterInvestimentosPericia_(d)[categoria] || 0)
    ].reduce((a, b) => a + b, 0);
    valorNum = Math.min(valorNum, Math.max(0, (pontosDisponiveis[categoria] || 9999) - totalOutras));

    inv[categoria] = valorNum;
    atual.investimentos = inv;
    atual.treinoTotal = inv.origem + inv.carreira + inv.hobbie + inv.xp;
    atual.tipo = tipo;
    delete atual.treinoTotalAnterior;
    pericias[periciaId] = atual;
    draft.sujo=true;
    renderizarPericias(char);
};

window.atualizarTreinoEspecializacao = (espId, valor, categoria) => {
    if (!currentCharId || categoria === 'todas') return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const draft=rascunhoPericiasChar_(char);
    const especializacoes = draft.especializacoes;
    const atual = { ...(especializacoes[espId] || {}) };
    const inv = obterInvestimentosPericia_(atual);
    const limite = userData && userData.role === 'mestre' ? 999 : (configuracoes.maxTreino || 30);
    const pontosDisponiveis = { origem: configuracoes.etapa2 || 100, carreira: configuracoes.etapa3 || 100, hobbie: configuracoes.etapa4 || 150 };
    let valorNum = Math.max(0, Math.min(parseInt(valor) || 0, limite));

    const totalOutras = [
        ...Object.values(draft.pericias || {}).map(d => obterInvestimentosPericia_(d)[categoria] || 0),
        ...Object.entries(especializacoes).filter(([id]) => id !== espId).map(([, d]) => obterInvestimentosPericia_(d)[categoria] || 0)
    ].reduce((a, b) => a + b, 0);
    valorNum = Math.min(valorNum, Math.max(0, (pontosDisponiveis[categoria] || 9999) - totalOutras));

    inv[categoria] = valorNum;
    atual.investimentos = inv;
    atual.treinoTotal = inv.origem + inv.carreira + inv.hobbie + inv.xp;
    delete atual.treinoTotalAnterior;
    especializacoes[espId] = atual;
    draft.sujo=true;
    renderizarPericias(char);
};

window.salvarPericias = async () => {
    if(!currentCharId)return;
    const char=userCharacters.find(c=>c.id===currentCharId);
    if(!char)return;
    if(fichaAprovadaV96_(char) && userData?.role!=='mestre'){notificar_('A ficha aprovada só recebe novos pontos pelas concessões de XP, salvo se o mestre reabrir a edição.','aviso',5000);return;}
    const draft=rascunhoPericiasChar_(char);
    if(!draft)return;
    for(const p of (periciasDB||[])){
      const d=draft.pericias?.[p.id]; const treino=totalTreinoPericia_(d||{});
      if(p.exigeEscola&&treino>0&&!d?.escola){
        const antigo=(char.pericias?.[p.id]&&totalTreinoPericia_(char.pericias[p.id])>0);
        if(antigo){ d.escola=escolaPadraoPericia_(p); }
        else { notificar_(`Escolha uma escola para ${getNome(p)} antes de salvar.`,'aviso',5000); renderizarPericias(char); return; }
      }
    }
    char.pericias=JSON.parse(JSON.stringify(draft.pericias||{}));
    char.especializacoes=JSON.parse(JSON.stringify(draft.especializacoes||{}));
    await setDoc(doc(db,'personagens',currentCharId),{
        pericias:char.pericias,
        especializacoes:char.especializacoes
    },{merge:true});
    limparRascunhoPericias_(currentCharId);
    somSalvar_();
    notificar_('Perícias salvas. Os investimentos foram organizados.','info',2600);
    await verificarEConcluirCriacao_(char);
    renderizarPericias(char);
};
window.mudarEtapaPericias = () => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (char) renderizarPericias(char);
};

function especializacaoPsiIdPorEsfera_(esfera) {
    const chave = String(esfera || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if (chave === 'sentidos') return 'psiquismo_sentidos';
    if (chave === 'mente') return 'psiquismo_mente';
    if (chave === 'materia') return 'psiquismo_materia';
    return '';
}

function arcoPsiPorTreino_(treino) {
    treino = Math.max(0, Math.floor(Number(treino) || 0));
    if (treino <= 0) return 0;
    if (treino <= 14) return 1;
    if (treino <= 29) return 2;
    return 3;
}


function traduzirEsferaPsi_(esfera) {
    const n = normalizarPsi_(esfera);
    const mapas = {
      sentidos:{pt:'Sentidos',en:'Senses',zh:'感知'},
      mente:{pt:'Mente',en:'Mind',zh:'心智'},
      materia:{pt:'Matéria',en:'Matter',zh:'物质'}
    };
    return mapas[n]?.[idiomaAtual] || mapas[n]?.pt || esfera;
}
function getObservacaoPsi_(poder) {
    if (!poder) return '';
    if (idiomaAtual === 'en') return poder.observacao_en || poder.observacao || '';
    if (idiomaAtual === 'zh') return poder.observacao_zh || poder.observacao || '';
    return poder.observacao || '';
}


function renderizarPsiRolagem_(char) {
    const painel = document.getElementById('psiRollPanel');
    const esferaSel = document.getElementById('psiRollSphere');
    const pontos = document.getElementById('psiRollPoints');
    if (!painel || !esferaSel || !pontos) return;

    const esferas = ['Sentidos','Mente','Matéria'].filter(e => treinoPsiEsfera_(char, e) > 0);
    painel.classList.toggle('hidden', esferas.length === 0);
    if (!esferas.length) {
        esferaSel.innerHTML = '';
        const poderSel = document.getElementById('psiRollPower');
        const detalhe = document.getElementById('psiRollDetail');
        const custo = document.getElementById('psiRollCost');
        if (poderSel) poderSel.innerHTML = '';
        if (detalhe) detalhe.innerHTML = '';
        if (custo) { custo.value = 0; custo.disabled = true; }
        pontos.textContent = '';
        return;
    }

    const max = pontosMagiaMax_(char);
    const gastos = Math.max(0, Math.floor(Number(char?.pontosMagiaGastos || 0)));
    pontos.textContent = `PP: ${Math.max(0,max-gastos)} / ${max}`;

    const anterior = esferaSel.value;
    esferaSel.innerHTML = esferas.map(e => {
        const treino = treinoPsiEsfera_(char,e);
        const arco = arcoPsiPorTreino_(treino);
        return `<option value="${e}">${traduzirEsferaPsi_(e)} · ${tr_('arc')} ${arco}</option>`;
    }).join('');
    if (esferas.includes(anterior)) esferaSel.value = anterior;
    atualizarPoderesPsiRolagem();
}

window.atualizarPoderesPsiRolagem = () => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    const esferaSel = document.getElementById('psiRollSphere');
    const poderSel = document.getElementById('psiRollPower');
    if (!char || !esferaSel || !poderSel) return;

    const esfera = esferaSel.value;
    const treino = treinoPsiEsfera_(char, esfera);
    const arco = arcoPsiPorTreino_(treino);
    const poderes = poderesPsiDB
        .filter(p => normalizarPsi_(p.esfera) === normalizarPsi_(esfera) && Number(p.arco || 1) <= arco)
        .sort((a,b) => Number(a.arco||1)-Number(b.arco||1) || getNome(a).localeCompare(getNome(b)));

    poderSel.innerHTML = poderes.length
        ? poderes.map(p => `<option value="${escaparBanco_(p.id)}">${escaparBanco_(getNome(p))} · A${Number(p.arco||1)} · ${Number(p.custo||0)} PP</option>`).join('')
        : `<option value="">${tr_('noPowerAvailable')}</option>`;
    atualizarDetalhePsiRolagem();
};

window.atualizarDetalhePsiRolagem = () => {
    const poderId = document.getElementById('psiRollPower')?.value || '';
    const poder = poderesPsiDB.find(p => p.id === poderId);
    const detalhe = document.getElementById('psiRollDetail');
    const custo = document.getElementById('psiRollCost');
    if (!detalhe || !custo) return;

    if (!poder) {
        detalhe.textContent = tr_('noPowerForArc');
        custo.value = 0;
        custo.min = 0;
        custo.disabled = true;
        return;
    }

    const minimo = Math.max(0, Number(poder.custo || 0));
    custo.disabled = false;
    custo.min = minimo;
    custo.value = minimo;
    const obs = getObservacaoPsi_(poder);
    detalhe.innerHTML = `<strong>${escaparBanco_(getNome(poder))}</strong> · ${escaparBanco_(traduzirEsferaPsi_(poder.esfera))} · ${tr_('arc')} ${Number(poder.arco||1)} · ${tr_('minimumCost')} ${minimo} PP<br><span style="color:#b9add8;">${escaparBanco_(obs)}</span>`;
};

window.usarPoderPsiRolagem = async () => {
    somMagico_();
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    const poderId = document.getElementById('psiRollPower')?.value || '';
    const poder = poderesPsiDB.find(p => p.id === poderId);
    if (!char || !poder) return;

    const treino = treinoPsiEsfera_(char, poder.esfera);
    const arco = arcoPsiPorTreino_(treino);
    if (treino <= 0 || Number(poder.arco || 1) > arco) {
        alert('O personagem ainda não tem acesso a este poder.');
        return;
    }

    const minimo = Math.max(0, Number(poder.custo || 0));
    const input = document.getElementById('psiRollCost');
    const gasto = Math.max(0, Math.floor(Number(input?.value ?? minimo) || 0));
    if (gasto < minimo) {
        alert(`O custo mínimo deste poder é ${minimo} PP.`);
        if (input) input.value = minimo;
        return;
    }

    const max = pontosMagiaMax_(char);
    const gastosAtuais = Math.max(0, Math.floor(Number(char.pontosMagiaGastos || 0)));
    const restantes = Math.max(0, max - gastosAtuais);
    if (gasto > restantes) {
        alert(`Pontos de Magia insuficientes. Disponíveis: ${restantes}.`);
        return;
    }

    char.pontosMagiaGastos = gastosAtuais + gasto;
    await setDoc(doc(db,'personagens',currentCharId),{pontosMagiaGastos:char.pontosMagiaGastos},{merge:true});
    await registrarHistoricoGeral_(
        'Psiquismo',
        `${getNome(poder)} · ${poder.esfera} · Arco ${Number(poder.arco||1)} · Gasto ${gasto} PP`,
        {subtipo:'psiquismo',poderId:poder.id,esfera:poder.esfera,arco:Number(poder.arco||1),gastoPP:gasto}
    );
    atualizarPontosSorteEMagia_(char);
    renderizarPsiRolagem_(char);
    renderizarPsiquismo_(char);
};

function renderizarPsiquismo_(char) {
    const painel = document.getElementById('psiPanel');
    const container = document.getElementById('psiPowersContainer');
    const resumo = document.getElementById('psiPointsSummary');
    if (!painel || !container || !resumo) return;
    const possui = temPsiquismoInvestido_(char);
    painel.classList.toggle('hidden', !possui);
    if (!possui) {
        container.innerHTML = '';
        resumo.textContent = '';
        return;
    }

    const max = pontosMagiaMax_(char);
    const gastos = Math.max(0, Math.floor(Number(char?.pontosMagiaGastos || 0)));
    const restantes = Math.max(0, max - gastos);
    resumo.textContent = `${tr_('magicPointsLabel')}: ${restantes} / ${max}`;

    const esferas = ['Sentidos','Mente','Matéria'];
    container.innerHTML = esferas.map(esfera => {
        const treino = treinoPsiEsfera_(char, esfera);
        if (treino <= 0) return '';
        const arco = arcoPsiPorTreino_(treino);
        const poderes = poderesPsiDB.filter(p => String(p.esfera||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase() === esfera.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase() && Number(p.arco||1) <= arco);
        const cards = poderes.map(p => {
            const custo = Math.max(0, Number(p.custo || 0));
            const obs = getObservacaoPsi_(p);
            return `<div style="padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.04);margin:8px 0;">
                <div><strong style="color:#fff;">${escaparBanco_(getNome(p))}</strong><div style="color:#aaa;font-size:.88em;margin-top:4px;">Arco ${Number(p.arco||1)} · custo mínimo ${custo} PP · ${escaparBanco_(obs)}</div></div>
            </div>`;
        }).join('');
        return `<div style="margin:16px 0 20px;"><h4 style="color:#d8b4ff;margin:0 0 8px;">${esfera} · Treino ${treino} · Arco ${arco}</h4>${cards || '<div style="color:#888;">Nenhum poder disponível no banco.</div>'}</div>`;
    }).join('');
}

window.usarPoderPsi = async (poderId) => {
    somMagico_();
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    const poder = poderesPsiDB.find(p => p.id === poderId);
    if (!char || !poder) return;
    const treino = treinoPsiEsfera_(char, poder.esfera);
    const arco = arcoPsiPorTreino_(treino);
    if (treino <= 0 || Number(poder.arco || 1) > arco) {
        alert('O personagem ainda não tem acesso a este poder.');
        return;
    }
    const minimo = Math.max(0, Number(poder.custo || 0));
    const input = document.getElementById(`psiCost_${poderId}`);
    const gasto = Math.max(0, Math.floor(Number(input?.value ?? minimo) || 0));
    if (gasto < minimo) {
        alert(`O custo mínimo deste poder é ${minimo} PP.`);
        if (input) input.value = minimo;
        return;
    }
    const max = pontosMagiaMax_(char);
    const gastosAtuais = Math.max(0, Math.floor(Number(char.pontosMagiaGastos || 0)));
    const restantes = Math.max(0, max - gastosAtuais);
    if (gasto > restantes) {
        alert(`Pontos de Magia insuficientes. Disponíveis: ${restantes}.`);
        return;
    }
    char.pontosMagiaGastos = gastosAtuais + gasto;
    await setDoc(doc(db,'personagens',currentCharId),{pontosMagiaGastos:char.pontosMagiaGastos},{merge:true});
    await registrarHistoricoGeral_('Psiquismo', `${getNome(poder)} · ${poder.esfera} · Arco ${poder.arco} · Gasto ${gasto} PP`, {subtipo:'psiquismo',poderId:poder.id,esfera:poder.esfera,arco:Number(poder.arco||1),gastoPP:gasto});
    atualizarPontosSorteEMagia_(char);
    renderizarPsiquismo_(char);
};

window.restaurarPontosMagia = async (quantidade) => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId); if (!char) return;
    const atual = Math.max(0, Math.floor(Number(char.pontosMagiaGastos || 0)));
    const q = Math.max(0, Math.floor(Number(quantidade) || 0));
    char.pontosMagiaGastos = Math.max(0, atual - q);
    await setDoc(doc(db,'personagens',currentCharId),{pontosMagiaGastos:char.pontosMagiaGastos},{merge:true});
    atualizarPontosSorteEMagia_(char); renderizarPsiquismo_(char);
}

