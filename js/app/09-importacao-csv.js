// ============================================
// IMPORTAÇÃO CSV
// ============================================
function slugId_(texto) {
    return String(texto || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function parseBoolean_(valor) {
    if (typeof valor === 'boolean') return valor;
    return ['1', 'true', 'sim', 'yes', 'x'].includes(String(valor || '').trim().toLowerCase());
}

function parseNumero_(valor, padrao = 0) {
    if (valor === null || valor === undefined || String(valor).trim() === '') return padrao;
    const n = Number(String(valor).replace(',', '.'));
    return Number.isFinite(n) ? n : padrao;
}

function normalizarLinhaImportacao_(tipo, bruto) {
    const nome = String(bruto.nome || bruto.nome_pt || '').trim();
    const id = String(bruto.id || '').trim() || slugId_(nome);
    if (!nome || !id) return null;

    const comum = {
        id,
        nome,
        nome_en: String(bruto.nome_en || '').trim(),
        nome_zh: String(bruto.nome_zh || '').trim()
    };

    if (tipo === 'pericias') {
        return {
            ...comum,
            categoria: String(bruto.categoria || 'Geral').trim(),
            tipo: String(bruto.tipo || 'Profissional').trim(),
            formula: String(bruto.formula || '').trim(),
            especializavel: parseBoolean_(bruto.especializavel),
            exigeEscola: parseBoolean_(bruto.exigeEscola || bruto.exige_escola),
            escolas: listaIds_(bruto.escolas), familias: listaIds_(bruto.familias),
            disponivelCampanha: bruto.disponivelCampanha===''||bruto.disponivelCampanha===undefined ? true : parseBoolean_(bruto.disponivelCampanha),
            penalidadeArmadura: parseNumero_(bruto.penalidadeArmadura, 0),
            descricao: String(bruto.descricao || '').trim(),
            descricao_en: String(bruto.descricao_en || '').trim(),
            descricao_zh: String(bruto.descricao_zh || '').trim()
        };
    }

    if (tipo === 'origens' || tipo === 'carreiras') {
        return {
            ...comum,
            periciasBasicas: listaIds_(bruto.periciasBasicas),
            periciasProfissionais: listaIds_(bruto.periciasProfissionais),
            especializacoes: listaIds_(bruto.especializacoes),
            descricao: String(bruto.descricao || '').trim(),
            descricao_en: String(bruto.descricao_en || '').trim(),
            descricao_zh: String(bruto.descricao_zh || '').trim()
        };
    }

    if (tipo === 'especializacoes') {
        return {
            ...comum,
            tipo: String(bruto.tipo || 'Combate').trim(),
            uso: String(bruto.uso || bruto.usoCombate || 'Teste').trim(),
            formula: String(bruto.formula || '').trim(),
            disponivelCampanha: bruto.disponivelCampanha===''||bruto.disponivelCampanha===undefined ? true : parseBoolean_(bruto.disponivelCampanha),
            familiaArma: String(bruto.familiaArma || bruto.familia_arma || '').trim(),
            grausOutrasArmas: Math.max(0, Math.trunc(parseNumero_(bruto.grausOutrasArmas ?? bruto.graus_outras_armas, 0))),
            descricao: String(bruto.descricao || '').trim(),
            descricao_en: String(bruto.descricao_en || '').trim(),
            descricao_zh: String(bruto.descricao_zh || '').trim()
        };
    }

    if (tipo === 'poderesPsi') {
        return {
            ...comum,
            esfera: String(bruto.esfera || '').trim(),
            arco: Math.max(1, Math.min(3, parseInt(bruto.arco) || 1)),
            custo: Math.max(0, parseNumero_(bruto.custo, 0)),
            observacao: String(bruto.observacao || bruto.descricao || '').trim(),
            observacao_en: String(bruto.observacao_en || bruto.descricao_en || '').trim(),
            observacao_zh: String(bruto.observacao_zh || bruto.descricao_zh || '').trim()
        };
    }

    if (tipo === 'cenarios') {
        return {
            ...comum,
            local:String(bruto.local||'').trim(), local_en:String(bruto.local_en||'').trim(), local_zh:String(bruto.local_zh||'').trim(),
            tipo:String(bruto.tipo||'').trim(), tipo_en:String(bruto.tipo_en||'').trim(), tipo_zh:String(bruto.tipo_zh||'').trim(),
            descricaoJogadores:String(bruto.descricaoJogadores||bruto.descricao_jogadores||'').trim(),
            descricaoJogadores_en:String(bruto.descricaoJogadores_en||bruto.descricao_jogadores_en||'').trim(),
            descricaoJogadores_zh:String(bruto.descricaoJogadores_zh||bruto.descricao_jogadores_zh||'').trim(),
            descricaoGM:String(bruto.descricaoGM||bruto.descricao_gm||'').trim(),
            descricaoGM_en:String(bruto.descricaoGM_en||bruto.descricao_gm_en||'').trim(),
            descricaoGM_zh:String(bruto.descricaoGM_zh||bruto.descricao_gm_zh||'').trim(),
            objetivo:String(bruto.objetivo||'').trim(), objetivo_en:String(bruto.objetivo_en||'').trim(), objetivo_zh:String(bruto.objetivo_zh||'').trim(),
            segredos:String(bruto.segredos||'').trim(), segredos_en:String(bruto.segredos_en||'').trim(), segredos_zh:String(bruto.segredos_zh||'').trim(),
            testesSugeridos:String(bruto.testesSugeridos||bruto.testes_sugeridos||'').trim(),
            interacoesTexto:String(bruto.interacoesTexto||bruto.interacoes_texto||'').trim(),
            estadoInicial:String(bruto.estadoInicial||bruto.estado_inicial||'').trim(),
            eventos:String(bruto.eventos||bruto.eventosAleatorios||'').trim(),
            encontros:String(bruto.encontros||bruto.encontrosPossiveis||'').trim(),
            observacoes:String(bruto.observacoes||'').trim(), observacoes_en:String(bruto.observacoes_en||'').trim(), observacoes_zh:String(bruto.observacoes_zh||'').trim(),
            destino1:String(bruto.destino1||'').trim(), condicao1:String(bruto.condicao1||'').trim(),
            destino2:String(bruto.destino2||'').trim(), condicao2:String(bruto.condicao2||'').trim(),
            destino3:String(bruto.destino3||'').trim(), condicao3:String(bruto.condicao3||'').trim(),
            npcsCena:String(bruto.npcsCena||bruto.npcs_cena||'').trim(),
            mapaId:String(bruto.mapaId||bruto.mapa_id||'').trim(),
            personagensCena: (() => {
                const ids=String(bruto.personagensCenaIds||bruto.personagens_cena_ids||'').split('|').map(x=>x.trim()).filter(Boolean);
                const vis=new Set(String(bruto.personagensVisiveisIds||bruto.personagens_visiveis_ids||'').split('|').map(x=>x.trim()).filter(Boolean));
                return ids.map(id=>({id,visivel:vis.has(id)}));
            })(),
            imagem:String(bruto.imagem||bruto.urlImagem||'').trim()
        };
    }

    if(tipo==='npcs')return {...comum,tipo:String(bruto.tipo||'NPC'),raca:String(bruto.raca||'Humano'),origem:String(bruto.origem||''),idade:String(bruto.idade||''),sexo:String(bruto.sexo||''),altura:String(bruto.altura||''),tamanho:String(bruto.tamanho||''),pesoCorporal:String(bruto.pesoCorporal||''),sociedade:String(bruto.sociedade||''),carreira:String(bruto.carreira||bruto.tipo||''),conceito:String(bruto.conceito||''),classeSocial:String(bruto.classeSocial||''),recursos:String(bruto.recursos||''),FOR:parseNumero_(bruto.FOR,10),CON:parseNumero_(bruto.CON,10),TAM:parseNumero_(bruto.TAM,10),DES:parseNumero_(bruto.DES,10),INT:parseNumero_(bruto.INT,10),POD:parseNumero_(bruto.POD,10),CAR:parseNumero_(bruto.CAR,10),motivacao:String(bruto.motivacao||''),valorMotivacao:parseNumero_(bruto.valorMotivacao,0),periciasTexto:String(bruto.periciasTexto||bruto.pericias||''),especializacoesTexto:String(bruto.especializacoesTexto||bruto.especializacoes||''),armasTexto:String(bruto.armasTexto||bruto.armas||''),inventarioTexto:String(bruto.inventarioTexto||bruto.inventario||''),comerciante:parseBoolean_(bruto.comerciante),comercioNome:String(bruto.comercioNome||''),comercioCompraPct:parseNumero_(bruto.comercioCompraPct,100),comercioVendaPct:parseNumero_(bruto.comercioVendaPct,50),comercioBarganha:bruto.comercioBarganha===''||bruto.comercioBarganha===undefined?true:parseBoolean_(bruto.comercioBarganha),comercioResistencia:parseNumero_(bruto.comercioResistencia,50),comercioCompraJogador:bruto.comercioCompraJogador===''||bruto.comercioCompraJogador===undefined?true:parseBoolean_(bruto.comercioCompraJogador),estoqueComercio:String(bruto.estoqueComercio||''),comercioMercadoNegro:parseBoolean_(bruto.comercioMercadoNegro),prestadorServicos:parseBoolean_(bruto.prestadorServicos),servicosComercio:String(bruto.servicosComercio||''),selecionavelCombate:bruto.selecionavelCombate===''?true:parseBoolean_(bruto.selecionavelCombate),imagem:String(bruto.imagem||''),descricao:String(bruto.descricao||'')};
    if(tipo==='criaturas'){
        const anterior=criaturasDB.find(n=>n.id===comum.id);
        const formulas={};
        for(const a of ['FOR','CON','TAM','DES','INT','POD','CAR']){
            const f=String(bruto[`${a}_formula`]||bruto[`formula_${a}`]||'').trim();
            if(f)formulas[a]=f;
        }
        if(!Object.keys(bruto).some(k=>/_formula$|^formula_/.test(k)))Object.assign(formulas,anterior?.formulasAtributos||{});
        const atributosRolados=Object.hasOwn(bruto,'atributosRolados')?parseBoolean_(bruto.atributosRolados):!!anterior?.atributosRolados||Object.values(formulas).some(f=>/\d*d\d+/i.test(f));
        const model={
            ...comum,
            tipo:String(bruto.tipo||'Criatura'),
            especie:String(bruto.especie||bruto.raca||''),
            habitat:String(bruto.habitat||bruto.origem||''),
            comportamento:String(bruto.comportamento||bruto.motivacao||''),
            altura:String(bruto.altura||''),
            tamanho:String(bruto.tamanho||''),
            pesoCorporal:String(bruto.pesoCorporal||''),
            FOR:parseNumero_(bruto.FOR,10),
            CON:parseNumero_(bruto.CON,10),
            TAM:parseNumero_(bruto.TAM,10),
            DES:parseNumero_(bruto.DES,10),
            INT:parseNumero_(bruto.INT,5),
            POD:parseNumero_(bruto.POD,10),
            CAR:parseNumero_(bruto.CAR,5),
            atributosRolados,
            formulasAtributos:formulas,
            periciasTexto:String(bruto.periciasTexto||bruto.pericias||''),
            especializacoesTexto:String(bruto.especializacoesTexto||bruto.especializacoes||''),
            armasTexto:String(bruto.armasTexto||bruto.armas||''),
            alcancesAtaques:String(bruto.alcancesAtaques||bruto.alcances||''),
            habilidadesTexto:String(bruto.habilidadesTexto||bruto.habilidades||''),
            armaduraNatural:Math.max(0,parseNumero_(bruto.armaduraNatural,0)),
            acoesMaxEspecial:Math.max(0,parseNumero_(bruto.acoesMaxEspecial,0)),
            deslocamento:Math.max(0,parseNumero_(bruto.deslocamento??bruto.movimentoTerrestre??bruto.movimentoBase,3)),
            acoes:Math.max(0,parseNumero_(bruto.acoes??bruto.acoesMax??bruto.acoesMaxEspecial,2)),
            movimentoTerrestre:Math.max(0,parseNumero_(bruto.deslocamento??bruto.movimentoTerrestre??bruto.movimentoBase,3)),
            movimentoVoo:Math.max(0,parseNumero_(bruto.movimentoVoo,0)),
            movimentoNatacao:Math.max(0,parseNumero_(bruto.movimentoNatacao,0)),
            vinculosAtaquesPericias:String(bruto.vinculosAtaquesPericias||bruto.vinculos||''),
            equipamentoBaseTexto:String(bruto.equipamentoBaseTexto||bruto.equipamentoBase||''),
            propriedadesAtaques:String(bruto.propriedadesAtaques||bruto.propriedades||''),
            selecionavelCombate:bruto.selecionavelCombate===''?true:parseBoolean_(bruto.selecionavelCombate),
            imagem:String(bruto.imagem||bruto.urlImagem||''),
            descricao:String(bruto.descricao||'')
        };
        if(Number(bruto.periciasSchema)===2){model.periciasSchema=2;model.periciasTreino=JSON.parse(bruto.periciasTreino||'[]');model.especializacoesTreino=JSON.parse(bruto.especializacoesTreino||'[]');}
        model.vinculosAtaquesPericias=vinculosCriatura(model);return {...model,...migrarTreinos(model,novaBaseCriatura_)};
    }
    if (tipo === 'itens') {
        const usoBruto = bruto.uso ?? bruto.quantidade ?? '';
        return {
            ...comum,
            categoria: String(bruto.categoria || 'Diversos').trim(),
            peso: parseNumero_(bruto.peso, 0),
            pa: parseNumero_(bruto.pa ?? bruto.PA, 0),
            pv: parseNumero_(bruto.pv ?? bruto.PV, 1),
            preco: parseNumero_(bruto.preco ?? bruto.valor ?? bruto.valorBase, 0),
            alcance: String(bruto.alcance || '').trim(),
            dano: String(bruto.dano || '').trim(),
            penetracao: Math.max(0, Math.trunc(parseNumero_(bruto.penetracao ?? bruto.penetration, 0))),
            municao: String(bruto.municao || bruto.recurso || '').trim(),
            uso: String(usoBruto).trim(),
            quantidade: parseNumero_(bruto.quantidade, 0),
            destinoLocal: String(bruto.destinoLocal || bruto.destino || bruto.local || '').trim(),
            locaisProtegidos: String(bruto.locaisProtegidos || bruto.protege || bruto.protecao || '').trim(),
            nivelAcesso: String(bruto.nivelAcesso || bruto.acesso || '').trim(),
            material: String(bruto.material || '').trim(),
            unidade: String(bruto.unidade || '').trim(),
            disponivelCampanha: bruto.disponivelCampanha===''||bruto.disponivelCampanha===undefined ? true : parseBoolean_(bruto.disponivelCampanha),
            familiaArma: String(bruto.familiaArma || bruto.familia_arma || '').trim(),
            plataforma: String(bruto.plataforma || '').trim(),
            tecnologia: String(bruto.tecnologia || '').trim(),
            alcanceMetros: parseNumero_(bruto.alcanceMetros ?? bruto.alcance_metros, 0),
            municoesCompativeis: String(bruto.municoesCompativeis || bruto.municoes_compativeis || '').trim(),
            consumoPorUso: parseNumero_(bruto.consumoPorUso ?? bruto.consumo_por_uso, 0),
            perfilVisual: String(bruto.perfilVisual || bruto.perfil_visual || '').trim(),
            perfilSom: String(bruto.perfilSom || bruto.perfil_som || '').trim(),
            inflamabilidade: Math.max(0, Math.min(5, Math.trunc(parseNumero_(bruto.inflamabilidade, 0)))),
            empuxo: Math.max(0, parseNumero_(bruto.empuxo, 0)),
            imagem: String(bruto.imagem || bruto.urlImagem || '').trim(),
            descricao: String(bruto.descricao || bruto.observacoes || '').trim(),
            descricao_en: String(bruto.descricao_en || '').trim(),
            descricao_zh: String(bruto.descricao_zh || '').trim()
        };
    }

    return { ...bruto, ...comum };
}


window.selecionarImportacaoBanco_ = (inputId, substituir=false) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.dataset.modo = substituir ? 'substituir' : 'atualizar';
    input.value = '';
    input.click();
};

function chaveNomeBanco_(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

async function substituirColecaoPorDados_(tipo, dados) {
    const existentes = await getDocs(collection(db, tipo));

    // Firestore limita batches a 500 operações.
    const totalOperacoes = existentes.size + dados.length;
    if (totalOperacoes > 450) {
        throw new Error(`Substituição segura excede o limite desta versão (${totalOperacoes} operações).`);
    }

    // Preserva imagens existentes quando o CSV deixa a imagem vazia.
    if (tipo === 'itens' || tipo === 'cenarios' || tipo === 'npcs' || tipo === 'criaturas') {
        const porId = new Map();
        const porNome = new Map();
        existentes.forEach(snap => {
            const d = { id:snap.id, ...snap.data() };
            porId.set(String(d.id), d);
            porNome.set(chaveNomeBanco_(d.nome), d);
        });

        dados = dados.map(novo => {
            if (String(novo.imagem || '').trim()) return novo;
            const antigo = porId.get(String(novo.id)) || porNome.get(chaveNomeBanco_(novo.nome));
            const imagemAntiga = String(antigo?.imagem || antigo?.urlImagem || '').trim();
            return imagemAntiga ? { ...novo, imagem: imagemAntiga } : novo;
        });
    }

    // Uma única transação de escrita: ou tudo muda, ou nada muda.
    const batch = writeBatch(db);
    existentes.forEach(snap => batch.delete(doc(db, tipo, snap.id)));
    for (const item of dados) {
        batch.set(doc(db, tipo, item.id), item);
    }
    await batch.commit();

    // Verificação pós-importação.
    const depois = await getDocs(collection(db, tipo));
    const idsEsperados = new Set(dados.map(d => String(d.id)));
    const idsObtidos = new Set(depois.docs.map(d => String(d.id)));
    const faltando = [...idsEsperados].filter(id => !idsObtidos.has(id));
    const extras = [...idsObtidos].filter(id => !idsEsperados.has(id));

    if (faltando.length || extras.length || depois.size !== dados.length) {
        throw new Error(`Verificação falhou. Esperados=${dados.length}, encontrados=${depois.size}, faltando=${faltando.join(',')}, extras=${extras.join(',')}`);
    }

    return { apagados: existentes.size, gravados: depois.size };
}

window.importarPlanilha = async (tipo, input, substituir=false) => {
    if (!userData || userData.role !== 'mestre') {
        alert('Apenas o mestre pode importar bancos do sistema.');
        input.value = '';
        return;
    }

    const file = input.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: '', // autodetecta vírgula, ponto e vírgula ou tabulação
        transformHeader: h => String(h || '').trim(),
        complete: async (results) => {
            try {
                const dados = results.data
                    .map(linha => normalizarLinhaImportacao_(tipo, linha))
                    .filter(Boolean);

                if (!dados.length) {
                    alert('❌ Planilha vazia ou inválida. Verifique se existe a coluna nome (ou nome_pt).');
                    return;
                }

                if (substituir) {
                    const aviso =
`⚠️ SUBSTITUIR BANCO: ${tipo}

O banco atual será apagado e recriado usando SOMENTE os ${dados.length} registros deste CSV.

Use esta opção para eliminar duplicatas e registros antigos.
Personagens existentes não serão apagados, mas referências a IDs removidos podem deixar de encontrar o registro correspondente.

Deseja continuar?`;
                    if (!confirm(aviso)) return;

                    const resultado = await substituirColecaoPorDados_(tipo, dados);
                    somSalvar_();
                    alert(`✅ Banco ${tipo} substituído e verificado: ${resultado.apagados} registros antigos removidos e ${resultado.gravados} registros gravados.`);
                } else {
                    for (const itemOriginal of dados) {
                        const item = { ...itemOriginal };
                        if ((tipo === 'itens' || tipo === 'cenarios' || tipo === 'npcs' || tipo === 'criaturas') && !String(item.imagem || '').trim()) delete item.imagem;
                        await setDoc(doc(db, tipo, item.id), item, { merge: true });
                    }
                    somSalvar_();
                    alert(`✅ ${dados.length} registros de ${tipo} importados/atualizados.`);
                }
                await carregarBancosDeDados();
            } catch (erro) {
                console.error('Erro na importação:', erro);
                alert('❌ Erro ao importar. Veja o console do navegador para detalhes.');
            } finally {
                input.value = '';
            }
        },
        error: (erro) => {
            console.error('Erro CSV:', erro);
            alert('❌ Não foi possível ler o arquivo CSV.');
            input.value = '';
        }
    });
};


function escaparCSV_(valor) {
    if (valor === null || valor === undefined) return '';
    let s = String(valor);
    // Como usamos ; como separador, protege ;, aspas e quebras de linha.
    if (/[;"\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
}

function linhaCSV_(cabecalhos, objeto) {
    return cabecalhos.map(h => escaparCSV_(objeto[h])).join(';');
}

function dadosExportacaoBanco_(tipo) {
    if(tipo==='objetosMapa')return {dados:objetosMapaDB,cabecalhos:colunasObjetos,map:o=>normalizarObjeto(o)};
    const configs = {
        pericias: {
            dados: periciasDB,
            cabecalhos: ['id','nome','nome_en','nome_zh','categoria','tipo','formula','especializavel','exigeEscola','escolas','familias','disponivelCampanha','penalidadeArmadura','descricao','descricao_en','descricao_zh'],
            map: p => ({
                id:p.id||'', nome:p.nome||'', nome_en:p.nome_en||'', nome_zh:p.nome_zh||'',
                categoria:p.categoria||'', tipo:p.tipo||'', formula:p.formula||'',
                especializavel:!!p.especializavel, exigeEscola:!!p.exigeEscola,
                escolas:(p.escolas||[]).join('|'), familias:(p.familias||[]).join('|'), disponivelCampanha:p.disponivelCampanha!==false,
                penalidadeArmadura:p.penalidadeArmadura ?? 0,
                descricao:p.descricao||'', descricao_en:p.descricao_en||'', descricao_zh:p.descricao_zh||''
            })
        },
        origens: {
            dados: origensDB,
            cabecalhos: ['id','nome','nome_en','nome_zh','periciasBasicas','periciasProfissionais','especializacoes','descricao','descricao_en','descricao_zh'],
            map: o => ({
                id:o.id||'', nome:o.nome||'', nome_en:o.nome_en||'', nome_zh:o.nome_zh||'',
                periciasBasicas:(o.periciasBasicas||[]).join('|'),
                periciasProfissionais:(o.periciasProfissionais||[]).join('|'),
                especializacoes:(o.especializacoes||[]).join('|'),
                descricao:o.descricao||'', descricao_en:o.descricao_en||'', descricao_zh:o.descricao_zh||''
            })
        },
        carreiras: {
            dados: carreirasDB,
            cabecalhos: ['id','nome','nome_en','nome_zh','periciasBasicas','periciasProfissionais','especializacoes','descricao','descricao_en','descricao_zh'],
            map: c => ({
                id:c.id||'', nome:c.nome||'', nome_en:c.nome_en||'', nome_zh:c.nome_zh||'',
                periciasBasicas:(c.periciasBasicas||[]).join('|'),
                periciasProfissionais:(c.periciasProfissionais||[]).join('|'),
                especializacoes:(c.especializacoes||[]).join('|'),
                descricao:c.descricao||'', descricao_en:c.descricao_en||'', descricao_zh:c.descricao_zh||''
            })
        },
        especializacoes: {
            dados: especializacoesDB,
            cabecalhos: ['id','nome','nome_en','nome_zh','tipo','uso','formula','disponivelCampanha','familiaArma','grausOutrasArmas','descricao','descricao_en','descricao_zh'],
            map: e => ({
                id:e.id||'', nome:e.nome||'', nome_en:e.nome_en||'', nome_zh:e.nome_zh||'',
                tipo:e.tipo||'', uso:e.uso||'', formula:e.formula||'', disponivelCampanha:e.disponivelCampanha!==false,
                familiaArma:e.familiaArma||'', grausOutrasArmas:e.grausOutrasArmas??0,
                descricao:e.descricao||'', descricao_en:e.descricao_en||'', descricao_zh:e.descricao_zh||''
            })
        },
        poderesPsi: {
            dados: poderesPsiDB,
            cabecalhos: ['id','nome','nome_en','nome_zh','esfera','arco','custo','observacao','observacao_en','observacao_zh'],
            map: p => ({
                id:p.id||'', nome:p.nome||'', nome_en:p.nome_en||'', nome_zh:p.nome_zh||'',
                esfera:p.esfera||'', arco:p.arco ?? 1, custo:p.custo ?? 0,
                observacao:p.observacao||'', observacao_en:p.observacao_en||'', observacao_zh:p.observacao_zh||''
            })
        },
        cenarios: {
            dados: cenariosDB,
            cabecalhos: ['id','nome','nome_en','nome_zh','local','local_en','local_zh','tipo','tipo_en','tipo_zh','descricaoJogadores','descricaoJogadores_en','descricaoJogadores_zh','descricaoGM','descricaoGM_en','descricaoGM_zh','objetivo','objetivo_en','objetivo_zh','segredos','segredos_en','segredos_zh','testesSugeridos','interacoesTexto','estadoInicial','eventos','encontros','observacoes','observacoes_en','observacoes_zh','destino1','condicao1','destino2','condicao2','destino3','condicao3','npcsCena','mapaId','personagensCenaIds','personagensVisiveisIds','imagem'],
            map:c=>({
                id:c.id||'',nome:c.nome||'',nome_en:c.nome_en||'',nome_zh:c.nome_zh||'',
                local:c.local||'',local_en:c.local_en||'',local_zh:c.local_zh||'',
                tipo:c.tipo||'',tipo_en:c.tipo_en||'',tipo_zh:c.tipo_zh||'',
                descricaoJogadores:c.descricaoJogadores||'',descricaoJogadores_en:c.descricaoJogadores_en||'',descricaoJogadores_zh:c.descricaoJogadores_zh||'',
                descricaoGM:c.descricaoGM||'',descricaoGM_en:c.descricaoGM_en||'',descricaoGM_zh:c.descricaoGM_zh||'',
                objetivo:c.objetivo||'',objetivo_en:c.objetivo_en||'',objetivo_zh:c.objetivo_zh||'',
                segredos:c.segredos||'',segredos_en:c.segredos_en||'',segredos_zh:c.segredos_zh||'',
                testesSugeridos:c.testesSugeridos||'',interacoesTexto:c.interacoesTexto||'',estadoInicial:c.estadoInicial||'',eventos:c.eventos||'',encontros:c.encontros||'',
                observacoes:c.observacoes||'',observacoes_en:c.observacoes_en||'',observacoes_zh:c.observacoes_zh||'',
                destino1:c.destino1||'',condicao1:c.condicao1||'',destino2:c.destino2||'',condicao2:c.condicao2||'',destino3:c.destino3||'',condicao3:c.condicao3||'',
                npcsCena:c.npcsCena||'',mapaId:c.mapaId||'',
                personagensCenaIds:Array.isArray(c.personagensCena)?c.personagensCena.map(x=>x.id).filter(Boolean).join('|'):'',
                personagensVisiveisIds:Array.isArray(c.personagensCena)?c.personagensCena.filter(x=>x.visivel).map(x=>x.id).filter(Boolean).join('|'):'',
                imagem:c.imagem||''
            })
        },
        npcs:{dados:npcsDB,cabecalhos:['id','nome','nome_en','nome_zh','tipo','raca','origem','idade','sexo','altura','tamanho','pesoCorporal','sociedade','carreira','conceito','classeSocial','recursos','FOR','CON','TAM','DES','INT','POD','CAR','motivacao','valorMotivacao','periciasTexto','especializacoesTexto','armasTexto','inventarioTexto','comerciante','comercioNome','comercioCompraPct','comercioVendaPct','comercioBarganha','comercioResistencia','comercioCompraJogador','estoqueComercio','comercioMercadoNegro','prestadorServicos','servicosComercio','selecionavelCombate','imagem','descricao'],map:n=>n},
        criaturas:{dados:criaturasDB,cabecalhos:['periciasSchema','periciasTreino','especializacoesTreino','atributosRolados','FOR_formula','CON_formula','TAM_formula','DES_formula','INT_formula','POD_formula','CAR_formula','id','nome','nome_en','nome_zh','tipo','especie','habitat','comportamento','altura','tamanho','pesoCorporal','FOR','CON','TAM','DES','INT','POD','CAR','periciasTexto','especializacoesTexto','armasTexto','propriedadesAtaques','alcancesAtaques','habilidadesTexto','vinculosAtaquesPericias','acoesMaxEspecial','armaduraNatural','deslocamento','acoes','movimentoTerrestre','movimentoVoo','movimentoNatacao','selecionavelCombate','imagem','descricao'],map:n=>({...n,periciasTreino:JSON.stringify(n.periciasTreino||[]),especializacoesTreino:JSON.stringify(n.especializacoesTreino||[]),...Object.fromEntries(Object.entries(n.formulasAtributos||{}).map(([k,v])=>[k+'_formula',v]))})},
        itens: {
            dados: itensDB,
            cabecalhos: ['id','nome','nome_en','nome_zh','categoria','peso','preco','pa','pv','alcance','dano','penetracao','municao','uso','destinoLocal','locaisProtegidos','nivelAcesso','material','unidade','disponivelCampanha','familiaArma','plataforma','tecnologia','alcanceMetros','municoesCompativeis','consumoPorUso','perfilVisual','perfilSom','inflamabilidade','empuxo','imagem','descricao','descricao_en','descricao_zh'],
            map: i => ({
                id:i.id||'', nome:i.nome||'', nome_en:i.nome_en||'', nome_zh:i.nome_zh||'',
                categoria:i.categoria||'Diversos',
                peso:i.peso ?? 0,
                preco:i.preco ?? i.valor ?? i.valorBase ?? 0,
                pa:i.pa ?? i.PA ?? 0,
                pv:i.pv ?? i.PV ?? 1,
                alcance:i.alcance||'',
                dano:i.dano||'',
                penetracao:i.penetracao ?? 0,
                municao:i.municao||i.recurso||'',
                uso:i.uso ?? i.quantidade ?? '',
                destinoLocal:i.destinoLocal||i.destino||i.local||'',
                locaisProtegidos:i.locaisProtegidos||i.protege||i.protecao||'',
                nivelAcesso:i.nivelAcesso||i.acesso||'',
                material:i.material||'',
                unidade:i.unidade||'',
                disponivelCampanha:i.disponivelCampanha!==false,
                familiaArma:i.familiaArma||'', plataforma:i.plataforma||'', tecnologia:i.tecnologia||'',
                alcanceMetros:i.alcanceMetros??'', municoesCompativeis:i.municoesCompativeis||'',
                consumoPorUso:i.consumoPorUso??'', perfilVisual:i.perfilVisual||'', perfilSom:i.perfilSom||'',
                inflamabilidade:i.inflamabilidade??0, empuxo:i.empuxo??0,
                imagem:i.imagem||i.urlImagem||'',
                descricao:i.descricao||i.observacoes||'',
                descricao_en:i.descricao_en||'',
                descricao_zh:i.descricao_zh||''
            })
        }
    };
    return configs[tipo] || null;
}

window.exportarBancoCSV = (tipo) => {
    if (!userData || userData.role !== 'mestre') {
        alert('Apenas o mestre pode exportar os bancos do sistema.');
        return;
    }

    const cfg = dadosExportacaoBanco_(tipo);
    if (!cfg) {
        alert('Banco desconhecido.');
        return;
    }

    const dados = [...(cfg.dados || [])]
        .sort((a,b) => String(a.nome||'').localeCompare(String(b.nome||''),'pt'))
        .map(cfg.map);

    if (!dados.length) {
        alert('Este banco está vazio.');
        return;
    }

    const linhas = [
        cfg.cabecalhos.join(';'),
        ...dados.map(obj => linhaCSV_(cfg.cabecalhos, obj))
    ];
    const conteudo = '\uFEFF' + linhas.join('\r\n');
    const blob = new Blob([conteudo], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const agora = new Date();
    const data = [
        agora.getFullYear(),
        String(agora.getMonth()+1).padStart(2,'0'),
        String(agora.getDate()).padStart(2,'0')
    ].join('-');
    a.download = `banco_${tipo}_${data}.csv`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    somSalvar_();
};

window.baixarTemplate = (tipo) => {
    const templates = {
        pericias: 'id;nome;nome_en;nome_zh;categoria;tipo;formula;especializavel;penalidadeArmadura;descricao;descricao_en;descricao_zh\natletismo;Atletismo;Athletics;运动;Física;Básica;FOR+DES;false;1;;;',
        origens: 'id;nome;nome_en;nome_zh;periciasBasicas;periciasProfissionais;especializacoes;descricao;descricao_en;descricao_zh\nurbano;Urbano;Urban;城市;costumes|dissimulacao|percepcao;;; ;;;',
        carreiras: 'id;nome;nome_en;nome_zh;periciasBasicas;periciasProfissionais;especializacoes;descricao;descricao_en;descricao_zh\nmilitar;Militar;Military;军事;atletismo|esquiva|combate_desarmado;armeiro|tatica;soldado_infantaria|arma_laser_pesada;;;',
        especializacoes: 'id;nome;nome_en;nome_zh;tipo;uso;formula;descricao;descricao_en;descricao_zh\ncombate_pistola_laser;Combate com Pistola Laser;Laser Pistol Combat;激光手枪战斗;Combate;Distância;DES+POD;;;',
        poderesPsi: 'id;nome;nome_en;nome_zh;esfera;arco;custo;observacao;observacao_en;observacao_zh\nevitar_dano;Evitar Dano;Avoid Damage;避免伤害;Sentidos;1;1;1 PP por ponto de dano absorvido;;',
        cenarios: 'id;nome;nome_en;nome_zh;local;local_en;local_zh;tipo;tipo_en;tipo_zh;descricaoJogadores;descricaoJogadores_en;descricaoJogadores_zh;descricaoGM;descricaoGM_en;descricaoGM_zh;objetivo;objetivo_en;objetivo_zh;segredos;segredos_en;segredos_zh;testesSugeridos;estadoInicial;eventos;encontros;observacoes;observacoes_en;observacoes_zh;destino1;condicao1;destino2;condicao2;destino3;condicao3;npcsCena;mapaId;imagem\nC001;Exemplo;;;Local;;;Social;;;Descrição pública;;;Descrição GM;;;Objetivo;;;Segredo;;;Percepção|Influência;Ativo;Evento 1|Evento 2;Encontro 1|Encontro 2;;;;C002;Seguir adiante;;;;;NPC Exemplo;;https://...',
        npcs: 'id;nome;nome_en;nome_zh;tipo;raca;FOR;CON;TAM;DES;INT;POD;CAR;periciasTexto;especializacoesTexto;comerciante;comercioNome;comercioCompraPct;comercioVendaPct;comercioBarganha;comercioResistencia;comercioCompraJogador;estoqueComercio;comercioMercadoNegro;prestadorServicos;servicosComercio;selecionavelCombate;imagem;descricao\nseguranca;Segurança Genérico;;;Humano;Humano;12;12;12;12;10;10;9;atletismo:45|esquiva:40;fuzis_carabinas:50;false;;100;50;true;50;true;;false;false;;true;;Sem armadura',
        criaturas: 'id;nome;nome_en;nome_zh;tipo;especie;habitat;comportamento;altura;tamanho;pesoCorporal;FOR;CON;TAM;DES;INT;POD;CAR;periciasTexto;especializacoesTexto;armasTexto;propriedadesAtaques;selecionavelCombate;imagem;descricao\nrastejante;Rastejante Genérico;;;Criatura;Predador;Ruínas;Emboscador;0,8;Pequeno;30;9;11;8;16;4;9;2;Furtividade:48|Percepção:42;Combate Desarmado:34;Mordida|Garras;;true;;Modelo genérico de criatura',
        itens: 'id;nome;nome_en;nome_zh;categoria;peso;preco;pa;pv;alcance;dano;penetracao;municao;uso;destinoLocal;locaisProtegidos;nivelAcesso;material;unidade;imagem;descricao;descricao_en;descricao_zh\npistola_laser;Pistola Laser;Laser Pistol;激光手枪;Armas;2;9000;4;5;60 m;2d6;3;Bateria;100;Armas laser;;Restrito;Liga metálica;Peça;;;;'
    };

    const conteudo = '\uFEFF' + (templates[tipo] || '');
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${tipo}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

