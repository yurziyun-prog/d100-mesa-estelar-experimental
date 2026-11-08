// ============================================================================
// 25-gerador-rapido.js — Gerador de NPCs e criaturas para o mestre (v1)
//
// Adiciona um botão "🎲 Gerar NPC/criatura" à barra do Laboratório de Combate,
// visível apenas para o mestre. Gera indivíduos completos a partir das
// tabelas do próprio jogo (atributos por pool, perícias em porcentagem =
// chance de acerto, equipamento do banco de itens) e os introduz no mapa
// como tokens com as miniaturas artísticas novas (imagens/sprites/).
//
// Também substitui a arte antiga dos tokens criados pelo seletor normal
// quando existe sprite novo para aquela espécie.
//
// Não altera nenhum módulo existente: tudo aqui é injetado em tempo de
// execução e atrás do portão batalhaEhMestre_().
// ============================================================================

(function () {
  'use strict';

  // --- sprites novos por id de espécie (arte gerada por IA no estilo aprovado)
  const SPRITES_CRIATURAS = {
    besta_ululante: 1, cadaver_de_chefe: 1, cila: 1,
    criatura1: 1, criatura2: 1, criatura3: 1, criatura4: 1, criatura5: 1,
    criatura6: 1, criatura7: 1, criatura_de_calico_2: 1, macacodecalico: 1,
    dragao_trombeta_alado_domesticado: 1, dragao_trombeta_alado_selvagem: 1,
    dragao_trombeta_corredor_domesticado: 1, dragao_trombeta_corredor_selvagem: 1,
    metamorfo1: 1, metamorfo2: 1, metamorfo3: 1, metamorfo4: 1,
    montariapterodatil: 1, predador_de_nevoa: 1, serpente_sanguessuga: 1, zumbi_1: 1,
  };
  const spriteCriatura = (id) => (SPRITES_CRIATURAS[id] ? `/imagens/sprites/${id}.png` : '');

  // sprites genéricos para NPCs gerados, por papel
  const SPRITES_NPC = {
    combatente: '/imagens/sprites/npc_combatente.png',
    inimigo: '/imagens/sprites/npc_combatente.png',
    elite: '/imagens/sprites/npc_inimigo.png',
    profissional: '/imagens/sprites/npc_medico.png',
    acompanhante: '/imagens/sprites/npc_combatente.png',
    mercador: '/imagens/sprites/npc_mercador.png',
    plebeu: '/imagens/sprites/npc_mercador.png',
  };

  // --- nomes (sabor Calico)
  const NOMES = ['Aro','Bel','Cassia','Doran','Elu','Faria','Gor','Hala','Ivo','Jana','Kell','Lio','Mara','Niko','Ota','Pia','Quim','Ravi','Sena','Talo','Ura','Vik','Wanda','Xan','Yara','Zelo','Antero','Bia','Ciro','Dessa','Emil','Faro','Gina','Hugo','Ilsa','Jonas','Keila','Lopo','Mira','Nael'];
  const SOBRENOMES = ['Vasquez','Torrado','Amaral','Kreg','Solis','Fonseca','Vidal','Brant','Cury','Moraes','Dakka','Pires','Lund','Reyes','Sato','Ferraz','Nogueira','Kroll','Bex','Andrade','Volkov','Sales','Irra','Mota','Cerrado','Porto','Leme','Duarte','Salles','Vega'];
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const escolhe = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const nomeNovo = () => `${escolhe(NOMES)} ${escolhe(SOBRENOMES)}`;

  // --- atributos: pool conforme poder (média ~80 no poder 4), mínimos 3/6, teto 18
  function atributosGerados(poder) {
    const pool = 52 + poder * 7; // 59..94
    const chaves = ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'];
    const min = { FOR: 3, CON: 3, TAM: 6, DES: 3, INT: 6, POD: 3, CAR: 3 };
    const a = {};
    let resto = pool;
    for (const k of chaves) { a[k] = min[k]; resto -= min[k]; }
    let guarda = 0;
    while (resto > 0 && guarda++ < 800) {
      const k = escolhe(chaves);
      if (a[k] < 18) { a[k]++; resto--; }
    }
    return a;
  }

  // --- perícias: 1 especialidade alta (>50%), algumas médias, algumas fracas
  function periciasGeradas(poder) {
    const fonte = (typeof periciasDB !== 'undefined' ? periciasDB : []).filter((p) => p && p.nome);
    if (!fonte.length) return { periciasTexto: '', especializacoesTexto: '' };
    const pega = (n, exc) => {
      const copia = fonte.filter((p) => !exc.has(p.nome));
      const out = [];
      while (out.length < n && copia.length) {
        const i = Math.floor(Math.random() * copia.length);
        out.push(copia.splice(i, 1)[0]);
      }
      out.forEach((p) => exc.add(p.nome));
      return out;
    };
    const usadas = new Set();
    const esp = pega(1, usadas)[0];
    const especializacoesTexto = esp ? `${esp.nome}:${Math.min(95, 45 + poder * 5 + ri(0, 8))}` : '';
    const medias = pega(2 + ri(0, 2), usadas).map((p) => `${p.nome}:${22 + poder * 3 + ri(0, 8)}`);
    const fracas = pega(1 + ri(0, 2), usadas).map((p) => `${p.nome}:${ri(8, 18)}`);
    return { periciasTexto: [...medias, ...fracas].join('|'), especializacoesTexto };
  }

  // --- equipamento por papel (nomes do banco de itens do jogo)
  const EQUIP_NPC = {
    combatente: 'Rifle Blaster|Colete Blast',
    inimigo: 'Rifle de Assalto 5,56 mm|Colete Balístico',
    elite: 'Rifle Gauss|Colete Blast',
    profissional: 'Pistola 9 mm',
    acompanhante: 'Carabina Blaster|Colete Blast',
    mercador: 'Pistola Blaster',
    plebeu: 'Faca Utilitária',
  };
  const CARREIRAS_NPC = {
    combatente: 'Caçador de recompensas', inimigo: 'Capanga armado', elite: 'Assassino de elite',
    profissional: 'Técnico', acompanhante: 'Guarda-costas', mercador: 'Comerciante', plebeu: 'Colonista',
  };

  function modeloNpcGerado(papel, poder) {
    const atr = atributosGerados(poder);
    const { periciasTexto, especializacoesTexto } = periciasGeradas(poder);
    return {
      id: `gerado_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nome: nomeNovo(),
      tipo: CARREIRAS_NPC[papel] || 'Cidadão',
      atributosRolados: '', FOR: String(atr.FOR), CON: String(atr.CON), TAM: String(atr.TAM),
      DES: String(atr.DES), INT: String(atr.INT), POD: String(atr.POD), CAR: String(atr.CAR),
      periciasTexto, especializacoesTexto,
      armasTexto: '', equipamentoBaseTexto: EQUIP_NPC[papel] || '',
      habilidadesTexto: '', descricao: `NPC gerado (${papel}, poder ${poder})`,
      acoes: poder >= 5 ? 3 : 2, acoesMax: poder >= 5 ? 3 : 2,
      armaduraNatural: 0, deslocamento: 3, movimentoTerrestre: 3, movimentoVoo: 0, movimentoNatacao: 0,
      imagem: SPRITES_NPC[papel] || '',
    };
  }

  // --- poder aproximado de uma criatura do banco (1..6)
  function poderDaCriatura(m) {
    const n = (v) => Number(String(v ?? '').replace(',', '.')) || 10;
    const maxPer = Math.max(0, ...String(m.periciasTexto || '').split('|')
      .map((x) => Number(String(x.split(':')[1] || '').replace(',', '.')) || 0));
    const score = (n(m.FOR) + n(m.CON) + n(m.TAM) - 20) / 9 + maxPer / 35 + Number(m.armaduraNatural || 0) / 4;
    return Math.max(1, Math.min(6, Math.round(score)));
  }

  function escolheCriatura(poderAlvo) {
    const pool = (typeof criaturasDB !== 'undefined' ? criaturasDB : [])
      .filter((c) => c && c.selecionavelCombate !== false);
    if (!pool.length) return null;
    if (!poderAlvo) return escolhe(pool);
    const dentro = pool.filter((c) => Math.abs(poderDaCriatura(c) - poderAlvo) <= 1);
    return escolhe(dentro.length ? dentro : pool);
  }

  // --- introduz um personagem/criatura no mapa (mesmo protocolo do seletor oficial)
  function colocarNoMapa(c, origemId, poder) {
    if (!c || typeof labEstado_ === 'undefined' || !labEstado_) return null;
    if (typeof batalhaNomeUnicoInstancia_ === 'function' && (c.__npcTemporario || c.__criaturaTemporaria)) {
      c.nome = batalhaNomeUnicoInstancia_(c.nome, (labEstado_.tokens || []));
    }
    let t = labTokenDeCharDireto_(c, origemId, (labEstado_.tokens || []).length);
    if ((labEstado_.tokens || []).some((x) => String(x.id) === String(t.id))) {
      t.id = `${t.id}:g:${Date.now()}:${Math.random().toString(36).slice(2, 5)}`;
    }
    if (c.tipo === 'npc' && SPRITES_NPC[origemId]) t.imagem = SPRITES_NPC[origemId];
    else if (c.criaturaBancoId && spriteCriatura(c.criaturaBancoId)) t.imagem = spriteCriatura(c.criaturaBancoId);
    else if (c.imagem) t.imagem = c.imagem;
    const atorAntes = labTokenAtual_()?.id || '';
    if (labEstado_.fase === 'combate') {
      t.iniciativaLab = 1 + Math.floor(Math.random() * 10) + Number(t.iniciativaBonus || 0);
      const ids = (labEstado_.ordemIniciativa || []).filter((id0) =>
        (labEstado_.tokens || []).some((x) => String(x.id) === String(id0)));
      if (!ids.some((id0) => String(id0) === String(t.id))) ids.push(String(t.id));
      ids.sort((ia, ib) => {
        const a = labTokenPorId_(ia), b = labTokenPorId_(ib);
        return Number(b?.iniciativaLab || 0) - Number(a?.iniciativaLab || 0)
          || Number(b?.iniciativaBonus || 0) - Number(a?.iniciativaBonus || 0)
          || String(a?.nome || '').localeCompare(String(b?.nome || ''));
      });
      labEstado_.ordemIniciativa = ids;
      const idx = ids.findIndex((x) => String(x) === String(atorAntes));
      if (idx >= 0) labEstado_.turnoIndex = idx;
      labEstado_.logLab = Array.isArray(labEstado_.logLab) ? labEstado_.logLab : [];
      labEstado_.logLab.unshift({ ts: new Date().toLocaleTimeString(), texto: `${t.nome} entrou no combate · INI ${t.iniciativaLab}` });
    }
    labEstado_.tokens.push(t);
    labEstado_.selecionadoId = t.id;
    labSalvarLocal_();
    labRender_();
    return t;
  }

  // --- arte nova também para criaturas adicionadas pelo seletor oficial
  const addOriginal = window.labAdicionarParticipanteSelecionado_;
  if (typeof addOriginal === 'function' && !addOriginal.__geradorEnvolvido) {
    const envolvida = function () {
      const antes = (labEstado_.tokens || []).length;
      addOriginal.call(this);
      const novos = (labEstado_.tokens || []).slice(antes);
      let mudou = false;
      for (const t of novos) {
        const alvo = spriteCriatura(String(t.origemId || ''));
        if (alvo && t.imagem !== alvo) { t.imagem = alvo; mudou = true; }
      }
      if (mudou) { labSalvarLocal_(); labRender_(); }
    };
    envolvida.__geradorEnvolvido = true;
    window.labAdicionarParticipanteSelecionado_ = envolvida;
  }

  // ============================================================================
  // Interface
  // ============================================================================
  const CSS = `
  <style id="geradorRapidoCss">
  .lab-token{overflow:visible}
  .lab-token img[src*="/imagens/sprites/"]{
    object-fit:contain!important;width:auto!important;height:236%!important;
    position:absolute;left:50%;bottom:4%;transform:translateX(-50%);
    filter:drop-shadow(0 5px 6px rgba(0,0,0,.5));pointer-events:none;
  }
  #geradorRapidoPainel{
    position:fixed;right:16px;top:70px;width:340px;z-index:9990;
    background:rgba(13,17,29,.97);border:1px solid rgba(0,212,255,.35);border-radius:14px;
    box-shadow:0 12px 40px rgba(0,0,0,.6);padding:14px;color:#dfe6f2;
    font-size:.88em;display:none;
  }
  #geradorRapidoPainel.aberto{display:block}
  #geradorRapidoPainel h3{margin:0 0 10px;font-size:1.05em;color:#7fe7ff}
  #geradorRapidoPainel .grg-linha{display:flex;gap:8px;margin-bottom:8px;align-items:center}
  #geradorRapidoPainel label{min-width:82px;color:#9fb0c8}
  #geradorRapidoPainel select,#geradorRapidoPainel input{
    flex:1;background:#0a0f1c;color:#dfe6f2;border:1px solid #2c3a55;border-radius:8px;padding:6px 8px;
  }
  #geradorRapidoPainel .grg-acoes{display:flex;gap:8px;margin:10px 0}
  #geradorRapidoPainel button{
    cursor:pointer;border:none;border-radius:8px;padding:8px 12px;font-weight:600;
  }
  #geradorRapidoGerar{background:linear-gradient(135deg,#00d4ff,#0099cc);color:#fff;flex:1}
  #geradorRapidoFechar{background:#2c3a55;color:#dfe6f2}
  #geradorRapidoResultado{max-height:300px;overflow:auto;display:flex;flex-direction:column;gap:8px}
  .grg-card{display:flex;gap:10px;background:rgba(255,255,255,.05);border-radius:10px;padding:8px;align-items:center}
  .grg-card img{width:52px;height:52px;object-fit:contain;background:radial-gradient(circle at 50% 60%,#23314d,#10151f);border-radius:8px}
  .grg-card .grg-nome{font-weight:700;color:#fff}
  .grg-card .grg-info{font-size:.82em;color:#9fb0c8}
  #geradorRapidoBtn{
    background:linear-gradient(135deg,#7b2ff7,#00d4ff)!important;color:#fff;border:none;font-weight:700;
  }
  </style>`;

  const PAPEIS = [
    ['plebeu', 'Plebeu'], ['profissional', 'Profissional'], ['mercador', 'Mercador'],
    ['combatente', 'Combatente'], ['inimigo', 'Inimigo'], ['elite', 'Elite'], ['acompanhante', 'Acompanhante'],
  ];
  const PODERES = [['', 'Qualquer'], ['1', '1 · Fraco'], ['2', '2 · Comum'], ['3', '3 · Veterano'], ['4', '4 · Perigoso'], ['5', '5 · Terrível'], ['6', '6 · Lendário']];

  function htmlPainel() {
    return `${CSS}
    <div id="geradorRapidoPainel">
      <h3>🎲 Gerador rápido <span style="float:right;cursor:pointer;color:#9fb0c8" onclick="geradorRapidoFechar_()">✕</span></h3>
      <div class="grg-linha"><label>Tipo</label>
        <select id="grgTipo" onchange="geradorRapidoAtualizar_()">
          <option value="criatura">Criatura do bestiário</option>
          <option value="npc">NPC (pessoa)</option>
        </select></div>
      <div class="grg-linha" id="grgLinhaPapel"><label>Papel</label>
        <select id="grgPapel">${PAPEIS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></div>
      <div class="grg-linha"><label>Nível</label>
        <select id="grgPoder">${PODERES.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></div>
      <div class="grg-linha"><label>Quantidade</label>
        <input id="grgQtd" type="number" min="1" max="6" value="1"></div>
      <div class="grg-acoes">
        <button id="geradorRapidoGerar" onclick="geradorRapidoGerar_()">⚔ Gerar e colocar na mesa</button>
      </div>
      <div id="geradorRapidoResultado"></div>
    </div>`;
  }

  function injetar() {
    if (document.getElementById('geradorRapidoPainel')) return;
    const ancora = document.getElementById('labMasterGameControls');
    if (!ancora) return;
    document.body.insertAdjacentHTML('beforeend', htmlPainel());
    const btn = document.createElement('button');
    btn.className = 'btn-small';
    btn.id = 'geradorRapidoBtn';
    btn.textContent = '🎲 Gerar NPC/criatura';
    btn.title = 'Gera NPCs ou criaturas completas e as coloca na mesa (somente mestre)';
    btn.onclick = () => geradorRapidoAbrir_();
    const colocar = [...ancora.querySelectorAll('button')].find((b) => /Colocar na mesa/.test(b.textContent));
    if (colocar) colocar.after(btn);
    else ancora.appendChild(btn);
  }

  // injeta quando o laboratório existir (a aba pode ser montada depois)
  const observador = new MutationObserver(() => injetar());
  observador.observe(document.documentElement, { childList: true, subtree: true });
  injetar();

  window.geradorRapidoAbrir_ = function () {
    if (typeof batalhaEhMestre_ === 'function' && !batalhaEhMestre_()) {
      notificar_('Somente o mestre pode usar o gerador.', 'aviso');
      return;
    }
    injetar();
    document.getElementById('geradorRapidoPainel')?.classList.add('aberto');
  };
  window.geradorRapidoFechar_ = function () {
    document.getElementById('geradorRapidoPainel')?.classList.remove('aberto');
  };
  window.geradorRapidoAtualizar_ = function () {
    const tipo = document.getElementById('grgTipo')?.value;
    const linha = document.getElementById('grgLinhaPapel');
    if (linha) linha.style.display = tipo === 'npc' ? 'flex' : 'none';
  };

  window.geradorRapidoGerar_ = function () {
    if (typeof batalhaEhMestre_ === 'function' && !batalhaEhMestre_()) {
      notificar_('Somente o mestre pode usar o gerador.', 'aviso');
      return;
    }
    if (typeof labEstado_ === 'undefined' || !labEstado_) {
      notificar_('Abra o Mapa da Mesa (Laboratório de Combate) primeiro.', 'aviso');
      return;
    }
    const tipo = document.getElementById('grgTipo')?.value || 'criatura';
    const papel = document.getElementById('grgPapel')?.value || 'plebeu';
    const poderRaw = document.getElementById('grgPoder')?.value || '';
    const poder = poderRaw ? Number(poderRaw) : 0;
    const qtd = Math.max(1, Math.min(6, Number(document.getElementById('grgQtd')?.value || 1)));
    const res = document.getElementById('geradorRapidoResultado');
    if (tipo === 'criatura') {
      const vistos = new Set();
      for (let i = 0; i < qtd; i++) {
        let m = null, tentativas = 0;
        do {
          m = escolheCriatura(poder);
          tentativas++;
        } while (m && vistos.has(m.id) && tentativas < 12);
        if (!m) { notificar_('Bestiário vazio ou indisponível.', 'erro'); break; }
        vistos.add(m.id);
        const c = criarCriaturaCombateDoBanco_(m);
        const t = colocarNoMapa(c, m.id, poder);
        if (t) {
          res.insertAdjacentHTML('afterbegin', cardHtml(t, `${m.especie || 'Criatura'} · poder ~${poderDaCriatura(m)}`, spriteCriatura(m.id) || t.imagem));
        }
      }
      notificar_(`${qtd} criatura(s) colocada(s) na mesa.`, 'sucesso');
    } else {
      const nivel = poder || ri(1, 4);
      for (let i = 0; i < qtd; i++) {
        const modelo = modeloNpcGerado(papel, nivel);
        const c = criarNPCCombateDoBanco_(modelo);
        c.imagem = SPRITES_NPC[papel] || '';
        const t = colocarNoMapa(c, papel, nivel);
        if (t) {
          const atr = c.atributos || {};
          res.insertAdjacentHTML('afterbegin', cardHtml(t,
            `${modelo.tipo} · FOR ${atr.FOR ?? '?'} DES ${atr.DES ?? '?'} INT ${atr.INT ?? '?'} · ${modelo.periciasTexto ? modelo.periciasTexto.split('|')[0] : 'sem perícias'}`,
            SPRITES_NPC[papel] || ''));
        }
      }
      notificar_(`${qtd} NPC(s) colocado(s) na mesa.`, 'sucesso');
    }
  };

  function cardHtml(t, info, img) {
    const esc = (typeof escaparHtmlInventario_ === 'function') ? escaparHtmlInventario_ : ((s) => String(s));
    return `<div class="grg-card">
      ${img ? `<img src="${esc(img)}" alt="">` : '<img alt="" style="object-fit:none">'}
      <div><div class="grg-nome">${esc(t.nome)}</div>
      <div class="grg-info">${esc(info)}</div></div>
    </div>`;
  }
})();
