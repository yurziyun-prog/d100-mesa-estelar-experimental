// ============================================
// REGRAS E ESCUDO
// ============================================

function renderizarTabelaCompatibilidadeCombate_(){
    const alvo=document.getElementById('combatCompatibilityRules');
    if(!alvo)return;
    const linhas=[
      ['Armas Brancas Curtas','Facas, adagas','Lâminas tecnológicas equivalentes (plasma/vibro/energia)','Armas de outras famílias'],
      ['Armas Brancas Longas','Espadas, sabres, machados','Espadas/lâminas plasma, vibro ou energia','Armas de outras famílias'],
      ['Armas de Haste','Lanças, alabardas e armas de haste','Armas tecnológicas de haste equivalentes','Armas de outras famílias'],
      ['Pistolas e Revólveres','Pistolas e revólveres convencionais','Submetralhadoras','Demais armas'],
      ['Fuzis e Carabinas','Fuzis e carabinas convencionais','Rifles de precisão / sniper','Demais armas'],
      ['Escopetas','Escopetas','—','Demais armas'],
      ['Submetralhadoras','Submetralhadoras','Pistolas e revólveres','Demais armas'],
      ['Armas Pesadas','Armas pesadas convencionais','—','Demais armas'],
      ['Atirador de Elite','Rifles de precisão / sniper','Fuzis e carabinas','Demais armas'],
      ['Pistolas Laser','Pistolas laser','Blaster, phaser e outras armas de energia','Demais armas'],
      ['Rifles Laser','Rifles e carabinas laser','Armas de energia e laser pesado','Demais armas'],
      ['Arma Laser Pesada','Armas laser pesadas','Rifles laser e armas de energia','Demais armas'],
      ['Armas de Energia','Blaster, phaser, disruptor e similares','Pistolas laser, rifles laser e laser pesado','Demais armas'],
      ['Esgrima Plasma/Vibro','Espadas e lâminas plasma/vibro/energia','Armas brancas convencionais equivalentes','Armas de funcionamento muito diferente']
    ];
    alvo.innerHTML=`<div style="padding:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:10px;">
      <h3 style="color:#00d4ff;margin:0 0 8px;">⚔️ Compatibilidade entre Perícias e Armas</h3>
      <p style="color:#aaa;margin:0 0 14px;">A arma da família treinada não altera a dificuldade. Armas relacionadas aumentam 1 grau; armas de famílias diferentes aumentam 2 graus.</p>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;min-width:850px;">
        <thead><tr style="background:rgba(0,212,255,.13);">
          <th style="padding:10px;text-align:left;">Perícia</th>
          <th style="padding:10px;text-align:left;color:#8ff0a8;">0 graus</th>
          <th style="padding:10px;text-align:left;color:#ffd166;">+1 grau</th>
          <th style="padding:10px;text-align:left;color:#ff8f8f;">+2 graus</th>
        </tr></thead>
        <tbody>${linhas.map(r=>`<tr>${r.map((c,i)=>`<td style="padding:9px;border-top:1px solid rgba(255,255,255,.08);${i===0?'font-weight:700;':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <small style="display:block;color:#aaa;margin-top:10px;">A penalidade da arma se combina com outras restrições. A fadiga estabelece a dificuldade mínima permitida para o personagem.</small>
    </div>`;
}

function renderizarRegras() {
    regrasTexto = idiomaAtual === 'en' ? (regrasTextoEN || REGRAS_PADRAO_EN)
               : idiomaAtual === 'zh' ? (regrasTextoZH || REGRAS_PADRAO_ZH)
               : (regrasTextoPT || regrasTexto || '');
    document.getElementById('regrasViewMode').innerHTML = formatarMarkdown(regrasTexto);
    const esforco = document.getElementById('physicalEffortRules');
    if (esforco) {
        const attr = idiomaAtual === 'en'
          ? {STR:'STR',CON:'CON',SIZ:'SIZ',DEX:'DEX',INT:'INT',POW:'POW',CHA:'CHA'}
          : idiomaAtual === 'zh'
          ? {STR:'力量',CON:'体质',SIZ:'体型',DEX:'敏捷',INT:'智力',POW:'意志',CHA:'魅力'}
          : {STR:'FOR',CON:'CON',SIZ:'TAM',DEX:'DES',INT:'INT',POW:'POD',CHA:'CAR'};
        const derived = idiomaAtual === 'en' ? [
          `<strong>Actions:</strong> ${attr.INT}+${attr.DEX}: ≤12=1; 13–24=2; 25–36=3; +1 per 12.`,
          `<strong>Initiative:</strong> average of ${attr.INT} and ${attr.DEX}; combat roll uses 1d10 + Initiative.`,
          `<strong>Luck Points:</strong> ${attr.POW} ≤6=1; 7–12=2; 13–18=3; +1 per 6 ${attr.POW}. Spend 1 point to reroll the most recent test; the new roll replaces the old result and must be used immediately, before another action/test.`,
          `<strong>Magic Points:</strong> equal to ${attr.POW} for characters able to use powers.`,
          `<strong>Healing Rate:</strong> ${attr.CON} ≤6=1; 7–12=2; 13–18=3; +1 per 6 ${attr.CON}.`,
          `<strong>Experience Mod.:</strong> ${attr.CHA} ≤6=-1; 7–12=0; 13–18=+1; +1 per 6 ${attr.CHA}.`,
          `<strong>Damage Mod.:</strong> determined by ${attr.STR}+${attr.SIZ} using the official table.`,
          `<strong>Movement:</strong> species base value; standard human = 6 m.`,
          `<strong>HP by location:</strong> derived from ${attr.CON}+${attr.SIZ} and the body-location table.`,
          `<strong>Height/Weight:</strong> range determined by ${attr.SIZ} and body type; automatic values use the midpoint and may be edited.`
        ] : idiomaAtual === 'zh' ? [
          `<strong>行动点：</strong>${attr.INT}+${attr.DEX}：≤12=1；13–24=2；25–36=3；之后每12点+1。`,
          `<strong>先攻：</strong>${attr.INT}与${attr.DEX}的平均值；战斗先攻掷1d10 + 先攻。`,
          `<strong>幸运点：</strong>${attr.POW}≤6=1；7–12=2；13–18=3；之后每6点${attr.POW}+1。消耗1点幸运可重掷刚刚完成的检定，新结果取代旧结果；必须在其他行动或检定发生前立即使用。`,
          `<strong>魔法点：</strong>能够使用能力的角色，其魔法点等于${attr.POW}。`,
          `<strong>恢复率：</strong>${attr.CON}≤6=1；7–12=2；13–18=3；之后每6点${attr.CON}+1。`,
          `<strong>经验修正：</strong>${attr.CHA}≤6=-1；7–12=0；13–18=+1；之后每6点${attr.CHA}+1。`,
          `<strong>伤害修正：</strong>按照官方表由${attr.STR}+${attr.SIZ}决定。`,
          `<strong>移动：</strong>由物种基础值决定；标准人类为6米。`,
          `<strong>各部位生命值：</strong>根据${attr.CON}+${attr.SIZ}及身体部位表计算。`,
          `<strong>身高/体重：</strong>由${attr.SIZ}和体型决定范围；自动值取区间中点且可编辑。`
        ] : [
          `<strong>Ações:</strong> ${attr.INT}+${attr.DEX}: ≤12=1; 13–24=2; 25–36=3; +1 a cada 12.`,
          `<strong>Iniciativa:</strong> média de ${attr.INT} e ${attr.DEX}; a rolagem de combate usa 1d10 + Iniciativa.`,
          `<strong>Pontos de Sorte:</strong> ${attr.POW} ≤6=1; 7–12=2; 13–18=3; +1 a cada 6 ${attr.POW}. Gaste 1 ponto para rerrolar o último teste; a nova rolagem substitui a anterior e deve ser usada imediatamente, antes de outra ação ou teste.`,
          `<strong>Pontos de Magia:</strong> iguais ao ${attr.POW} para personagens capazes de utilizar poderes.`,
          `<strong>Recuperação:</strong> ${attr.CON} ≤6=1; 7–12=2; 13–18=3; +1 a cada 6 ${attr.CON}.`,
          `<strong>Mod. Experiência:</strong> ${attr.CHA} ≤6=-1; 7–12=0; 13–18=+1; +1 a cada 6 ${attr.CHA}.`,
          `<strong>Mod. Dano:</strong> determinado por ${attr.STR}+${attr.SIZ} conforme a tabela oficial.`,
          `<strong>Movimento:</strong> valor-base da espécie; humano padrão = 6 m.`,
          `<strong>PV por localização:</strong> derivados de ${attr.CON}+${attr.SIZ} e da tabela de localização corporal.`,
          `<strong>Altura/Peso:</strong> faixa determinada por ${attr.SIZ} e tipo corporal; os valores automáticos usam o centro da faixa e podem ser editados.`
        ];
        esforco.innerHTML = `
            <div style="padding:18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:10px;">
                <h3 style="color:#00d4ff;margin:0 0 14px;">${tr_('physicalEffortTitle')}</h3>
                <div style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;min-width:760px;">
                        <thead><tr style="background:rgba(0,212,255,0.13);">
                            <th style="padding:10px;text-align:left;">${tr_('effortCol')}</th>
                            <th style="padding:10px;text-align:left;">${tr_('durationCol')}</th>
                            <th style="padding:10px;text-align:left;">${tr_('exampleCol')}</th>
                            <th style="padding:10px;text-align:left;">${tr_('skillTestCol')}</th>
                        </tr></thead>
                        <tbody>
                            <tr><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);"><strong>${tr_('effortLight')}</strong></td><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);">${tr_('lightDuration')}</td><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);">${tr_('lightExample')}</td><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);">${tr_('lightTest')}</td></tr>
                            <tr><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);"><strong>${tr_('effortMedium')}</strong></td><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);">${tr_('mediumDuration')}</td><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);">${tr_('mediumExample')}</td><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);">${tr_('mediumTest')}</td></tr>
                            <tr><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);"><strong>${tr_('effortStrenuous')}</strong></td><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);">${tr_('strenuousDuration')}</td><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);">${tr_('strenuousExample')}</td><td style="padding:10px;border-top:1px solid rgba(255,255,255,.08);">${tr_('strenuousTest')}</td></tr>
                        </tbody>
                    </table>
                </div>
                <small style="display:block;color:#aaa;margin-top:10px;">${tr_('effortNote')}</small>
                <div style="margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,.12);">
                    <h3 style="color:#00d4ff;margin:0 0 12px;">${tr_('derivedSummary')}</h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;color:#ddd;">
                        ${derived.map(x=>`<div>${x}</div>`).join('')}
                    </div>
                </div>
            </div>`;
    }
    renderizarRegrasD100_();
    renderizarTabelaCompatibilidadeCombate_();
    renderizarTabelaFadigaCompleta_();
    renderizarTabelaFerimentosCompleta_();
    renderizarRegrasInventarioCombate_();
    renderizarRegrasPrimeirosSocorros_();
    renderizarRegrasNutricao_();
    const btnEditar = document.getElementById('btnEditarRegras');
    if (userData && userData.role === 'mestre') btnEditar.style.display = 'block';
    else btnEditar.style.display = 'none';
}

window.mostrarSubAbaMestre = (nome,btn) => {
    if (!(userData && userData.role==='mestre')) return;
    document.querySelectorAll('.gm-sub-content').forEach(el=>el.classList.add('hidden'));
    document.getElementById('gm-admin-host')?.classList.add('hidden');
    document.querySelectorAll('.gm-subtab-btn').forEach(el=>el.classList.remove('active','btn-select'));
    document.getElementById(`gm-sub-${nome}`)?.classList.remove('hidden');
    if (btn) btn.classList.add('active','btn-select');
    if (nome==='campanha') renderizarCampanhaMestre_();
    if (nome==='historico') renderizarHistoricoMestre_();
    if (nome==='cenario') renderizarCenarioMestre_();
    if (nome==='rolagem') renderizarRolagensCalico_();
    if (nome==='combate') renderizarCombateMestre_();
    if (nome==='entidades') renderizarFichasEntidadesMestre_();
};

function cartaoNumeroMestre_(valor,rotulo,icone='') {
    return `<div style="padding:13px;border-radius:10px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10);">
        <div style="color:#888;font-size:.78em;">${icone} ${rotulo}</div>
        <strong style="display:block;color:#00d4ff;font-size:1.55em;margin-top:4px;">${valor}</strong>
    </div>`;
}

function estatisticasMestre_() {
    const chars=userCharacters||[];
    const pcs=chars.filter(c=>c.dono!==currentUserUid && !['npc','npc_rapido','monstro'].includes(String(c.tipo||'pc').toLowerCase())).length;
    const pms=chars.filter(c=>c.dono===currentUserUid && !['npc','npc_rapido','monstro'].includes(String(c.tipo||'pc').toLowerCase())).length;
    const npcsPersonagem=chars.filter(c=>['npc','npc_rapido'].includes(String(c.tipo||'').toLowerCase())).length;
    const npcsBanco=(npcsDB||[]).length;
    const npcs=npcsPersonagem+npcsBanco;
    const monstros=chars.filter(c=>String(c.tipo||'').toLowerCase()==='monstro').length;
    return {pcs,pms,npcs,monstros};
}


function obterDiaCampanha_(){
    const n=Number(estadoCampanhaMestre?.diaCampanha||1);
    return Math.max(1,Math.floor(Number.isFinite(n)?n:1));
}
function renderizarDiaCampanhaFicha_(){
    const el=document.getElementById('charCampaignDay');
    if(el)el.textContent=obterDiaCampanha_();
}

function taxaRecuperacao_(c){let x=Number(c?.atributos?.CON||10)+Number(c?.bonus?.CON||0);return x<=6?1:x<=12?2:x<=18?3:x<=24?4:x<=30?5:x<=36?6:6+Math.ceil((x-36)/6);}
function pvMaxLocais_(c){let x=(c.atributos?.CON||10)+(c.bonus?.CON||0)+(c.atributos?.TAM||10)+(c.bonus?.TAM||0),k=x<=5?0:x<=10?1:x<=15?2:x<=20?3:x<=25?4:x<=30?5:x<=35?6:7,i=x>40?Math.ceil((x-40)/5):0,t={l:[1,2,3,4,5,6,7,8],a:[2,3,4,5,6,7,8,9],c:[3,4,5,6,7,8,9,10],b:[1,1,2,3,4,5,6,7]};return {'Cabeça':t.l[k]+i,'Peito':t.c[k]+i,'Abdômen':t.a[k]+i,'Braço Direito':t.b[k]+i,'Braço Esquerdo':t.b[k]+i,'Perna Direita':t.l[k]+i,'Perna Esquerda':t.l[k]+i};}
async function curaNatural_(c,a,b){
    c.combate=c.combate||{};c.combate.hitLocations=c.combate.hitLocations||{};c.combate.curaNatural=c.combate.curaNatural||{};
    const h=taxaRecuperacao_(c),ms=pvMaxLocais_(c);
    for(const [l,m] of Object.entries(ms)){
        let v=Object.hasOwn(c.combate.hitLocations,l)?Number(c.combate.hitLocations[l]):m;
        if(v>=m)continue;
        const reg=c.combate.curaNatural[l]||{};
        let ciclos=0;
        if(v<=-m){
            if(!reg.graveTratado)continue;
            ciclos=Math.max(0,Math.floor(b/30)-Math.floor(a/30));
        }else if(v<=0){
            ciclos=Math.max(0,Math.floor(b/7)-Math.floor(a/7));
        }else{
            ciclos=Math.max(0,b-a);
        }
        if(ciclos<=0)continue;
        let ganho=ciclos*h;
        if(Number(reg.bonusProximaRecuperacao||0)>0){
            ganho+=Number(reg.bonusProximaRecuperacao||0);
            delete reg.bonusProximaRecuperacao;
        }
        v+=ganho;
        c.combate.hitLocations[l]=Math.min(m,v);
        c.combate.curaNatural[l]=reg;
    }
    await setDoc(doc(db,'personagens',c.id),{combate:c.combate},{merge:true});
};


function renderizarCenarioAtualPublico_(){
    const alvos=['globalCurrentScenarioPublic','charCurrentScenarioPublic'].map(id=>document.getElementById(id)).filter(Boolean);
    if(!alvos.length)return;
    const p=campanhaPublica_||{};
    const img=p.imagem
        ? `<img src="${escaparHtmlInventario_(p.imagem)}" alt="${escaparHtmlInventario_(p.cenario||'Cenário')}" style="width:100%;max-height:390px;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,.12);">`
        : `<div style="height:190px;border-radius:12px;background:rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;font-size:4em;">🪐</div>`;
    const html=`${img}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:12px;">
        <div class="stat-box"><div class="stat-label">Campanha</div><div>${escaparHtmlInventario_(p.nomeCampanha||'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Planeta</div><div>${escaparHtmlInventario_(p.planeta||'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Cidade / região</div><div>${escaparHtmlInventario_(p.cidade||'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Hora</div><div>${escaparHtmlInventario_(p.calico?.hora||'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Dia do mês</div><div>${escaparHtmlInventario_(p.calico?.diaMes??'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Dia da semana</div><div>${escaparHtmlInventario_(p.calico?.diaSemana||'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Fase da lua</div><div>${escaparHtmlInventario_(p.calico?.lua||'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Estação</div><div>${escaparHtmlInventario_(p.calico?.estacao||'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Clima</div><div>${escaparHtmlInventario_(p.calico?calicoClimaTexto_(p.calico):'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Condições locais</div><div>${escaparHtmlInventario_(p.clima||'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Data / período</div><div>${escaparHtmlInventario_(p.dataJogo||'—')}</div></div>
        <div class="stat-box"><div class="stat-label">Dia de campanha</div><div>${Number(p.diaCampanha||1)}</div></div>
      </div>
      <div style="margin-top:14px;padding:14px;border-radius:10px;background:rgba(155,89,182,.07);border:1px solid rgba(155,89,182,.24);">
        <h3 style="margin:0 0 5px;color:#d8b4ff;">🪐 ${escaparHtmlInventario_(p.cenario||'Nenhum cenário ativo')}</h3>
        ${p.local?`<div style="color:#999;margin-bottom:10px;">📍 ${escaparHtmlInventario_(p.local)}</div>`:''}
        <div style="white-space:pre-wrap;line-height:1.55;color:#ddd;">${escaparHtmlInventario_(p.descricaoJogadores||'Nenhuma descrição pública disponível.')}</div>
      </div>
      ${(p.personagensVisiveis||[]).length?`<div style="margin-top:14px;"><h4 style="color:#8feaff;margin:0 0 8px;">👥 Personagens presentes</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px;">
        ${(p.personagensVisiveis||[]).map(x=>`<div style="display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);">
          ${x.imagem?`<img src="${escaparHtmlInventario_(x.imagem)}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;">`:`<div style="width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);">👤</div>`}
          <div><strong>${escaparHtmlInventario_(x.nome)}</strong><br><small style="color:#999;">${escaparHtmlInventario_(x.tipo||'')}</small></div>
        </div>`).join('')}</div></div>`:''}`;
    alvos.forEach(el=>el.innerHTML=html);
}
function iniciarCampanhaPublica_(){
    if(campanhaPublicaUnsub_){try{campanhaPublicaUnsub_();}catch(e){}}
    if(!currentUserUid)return;
    campanhaPublicaUnsub_=onSnapshot(doc(db,'configuracoes','campanhaPublica'),snap=>{
        campanhaPublica_=snap.exists()?snap.data():{};
        renderizarCenarioAtualPublico_();
    },err=>console.warn('Campanha pública:',err));
}
async function publicarCampanhaAtual_(){
    if(userData?.role!=='mestre')return;
    let cenario=(cenariosDB||[]).find(c=>c.id===estadoCampanhaMestre?.cenarioId);
    if(!cenario && estadoCampanhaMestre?.cenario){
        const q=normalizarTextoCombate_(estadoCampanhaMestre.cenario);
        cenario=(cenariosDB||[]).find(c=>normalizarTextoCombate_(c.nome||c.id)===q);
    }
    const dados={
        nomeCampanha:estadoCampanhaMestre?.nome||'',
        planeta:estadoCampanhaMestre?.planeta||'',
        cidade:estadoCampanhaMestre?.cidade||'',
        clima:estadoCampanhaMestre?.clima||'',
        calico:{...calicoPadrao_(),...(estadoCampanhaMestre?.calico||{})},
        dataJogo:estadoCampanhaMestre?.dataJogo||'',
        diaCampanha:obterDiaCampanha_(),
        cenarioId:cenario?.id||estadoCampanhaMestre?.cenarioId||'',
        cenario:cenario?.nome||estadoCampanhaMestre?.cenario||'',
        mapaId:cenario?.mapaId||'',
        local:cenario?.local||'',
        imagem:cenario?.imagem||'',
        descricaoJogadores:cenario?.descricaoJogadores||'',
        personagensVisiveis:(cenario?.personagensCena||[]).filter(x=>x.visivel).map(v=>{
            const p=obterPersonagemCenarioPorId_(v.id);
            return p?{id:v.id,nome:p.nome||'Sem nome',imagem:p.imagem||'',tipo:p.__cenarioTipo||(p.dono===currentUserUid?'PM':'PC')} : null;
        }).filter(Boolean),
        atualizadoEm:new Date().toISOString()
    };
    campanhaPublica_=dados;
    await setDoc(doc(db,'configuracoes','campanhaPublica'),dados,{merge:false});
    renderizarCenarioAtualPublico_();
}
function popularAlvosFadigaMestre_(){
    const sel=document.getElementById('gmFadigaAlvo');if(!sel)return;
    const atual=sel.value;
    const pcs=(userCharacters||[]).filter(c=>String(c.tipo||'pc')==='pc');
    sel.innerHTML='<option value="">Escolher personagem...</option>'+pcs.map(c=>`<option value="${escaparHtmlInventario_(c.id)}">${escaparHtmlInventario_(c.nome||'Sem nome')}</option>`).join('');
    if(pcs.some(c=>c.id===atual))sel.value=atual;
}
window.aplicarFadigaSelecionado_=async()=>{
    if(userData?.role!=='mestre')return;
    const id=document.getElementById('gmFadigaAlvo')?.value||'';
    const nivel=document.getElementById('gmFadigaGeral')?.value||'Fresh';
    const c=(userCharacters||[]).find(x=>x.id===id);
    if(!c){notificar_('Escolha um personagem.','aviso');return;}
    c.combate=c.combate||{};c.combate.fadiga=nivel;
    await setDoc(doc(db,'personagens',c.id),{combate:c.combate},{merge:true});
    const atual=obterPersonagemAtual_();if(atual?.id===c.id)renderizarCombate(atual);
    renderizarBatalhaCompartilhada_();
    notificar_(`Fadiga aplicada a ${c.nome}.`,'info');
};
window.aplicarFadigaGeral_=async()=>{
    if(userData?.role!=='mestre')return;
    const nivel=document.getElementById('gmFadigaGeral')?.value||'Fresh';
    const alvos=(userCharacters||[]).filter(c=>String(c.tipo||'pc')==='pc');
    for(const c of alvos){
        c.combate=c.combate||{};c.combate.fadiga=nivel;
        await setDoc(doc(db,'personagens',c.id),{combate:c.combate},{merge:true});
    }
    const atual=obterPersonagemAtual_();if(atual)renderizarCombate(atual);
    renderizarBatalhaCompartilhada_();
    notificar_(`Fadiga aplicada a ${alvos.length} personagem(ns).`,'info');
};
window.avancarDiaCampanha_=async(qtd=1)=>{
    if(userData?.role!=='mestre')return;
    const antes=obterDiaCampanha_(),depois=antes+Math.max(1,Math.floor(Number(qtd)||1)),resumo=[];
    for(const c of (userCharacters||[])){
        await curaNatural_(c,antes,depois);
        const eventos=processarNutricaoDias_(c,antes+1,depois);
        await setDoc(doc(db,'personagens',c.id),{inventario:c.inventario,combate:c.combate},{merge:true});
        resumo.push(`${c.nome}: ${eventos.filter(x=>x.includes('+1 nível')).length} dia(s) sem suprimentos completos`);
    }
    estadoCampanhaMestre={...(estadoCampanhaMestre||{}),diaCampanha:depois};
    await setDoc(doc(db,'configuracoes','escudoMestre'),{campanha:estadoCampanhaMestre},{merge:true});
    await publicarCampanhaAtual_();
    const campo=document.getElementById('gmCampanhaDia');if(campo)campo.value=depois;
    renderizarDiaCampanhaFicha_();const atual=obterPersonagemAtual_();if(atual){renderizarInventario(atual);renderizarCombate(atual);}
    renderizarBatalhaCompartilhada_();await processarReparosConcluidos_();
    notificar_(`Dia de campanha ${depois}. Consumo: 2 alimento + 2 água por personagem/dia. ${resumo.join(' · ')}`,'info',6500);
};
window.novaSessaoCampanha_=async()=>{
    if(userData?.role!=='mestre')return;
    for(const c of (userCharacters||[]).filter(x=>String(x.tipo||'pc')==='pc')){
        c.pontosSorte=pontosSorteMax_(c);c.pontosSorteDerivadoV15=true;
        await setDoc(doc(db,'personagens',c.id),{pontosSorte:c.pontosSorte,pontosSorteDerivadoV15:true},{merge:true});
    }
    const atual=obterPersonagemAtual_();if(atual)atualizarVisualizacao(atual);
    notificar_('Pontos de Sorte restaurados para a nova sessão.','info');
};

function preencherEstadoCampanha_() {
    const e=estadoCampanhaMestre||{};
    const campos={
        gmCampanhaNome:'nome',gmCampanhaPlaneta:'planeta',gmCampanhaCidade:'cidade',
        gmCampanhaClima:'clima',gmCampanhaCenario:'cenario',gmCampanhaData:'dataJogo',gmCampanhaDia:'diaCampanha',gmCampanhaResumo:'resumo'
    };
    Object.entries(campos).forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.value=e[k]||'';});
    const dia=document.getElementById('gmCampanhaDia');if(dia)dia.value=obterDiaCampanha_();
}

function renderizarCampanhaMestre_() {
    if (!(userData && userData.role==='mestre')) return;
    const alvo=document.getElementById('gmCampaignStats');
    if (!alvo) return;
    const n=estatisticasMestre_();
    alvo.innerHTML=[
        cartaoNumeroMestre_(n.pcs,'Personagens de jogadores','👤'),
        cartaoNumeroMestre_(n.pms,'PMs','🛡️'),
        cartaoNumeroMestre_(n.npcs,'NPCs','🎭'),
        cartaoNumeroMestre_(n.monstros,'Monstros','👾'),
        cartaoNumeroMestre_((periciasDB||[]).length,'Perícias','📚'),
        cartaoNumeroMestre_((especializacoesDB||[]).length,'Especializações','⚔️'),
        cartaoNumeroMestre_((itensDB||[]).length,'Itens','📦'),
        cartaoNumeroMestre_((carreirasDB||[]).length,'Carreiras','💼'),
        cartaoNumeroMestre_((origensDB||[]).length,'Origens','🌍'),
        cartaoNumeroMestre_((poderesPsiDB||[]).length,'Poderes Psi','🔮'),
        cartaoNumeroMestre_((cenariosDB||[]).length,'Cenários','🪐')
    ].join('');
    preencherEstadoCampanha_();
    popularAlvosFadigaMestre_();
    popularControlesProgressaoMestre_();
    renderizarDiaCampanhaFicha_();
}

window.salvarEstadoCampanha = async () => {
    if (!(userData && userData.role==='mestre')) return;
    estadoCampanhaMestre={
        nome:document.getElementById('gmCampanhaNome')?.value?.trim()||'',
        planeta:document.getElementById('gmCampanhaPlaneta')?.value?.trim()||'',
        cidade:document.getElementById('gmCampanhaCidade')?.value?.trim()||'',
        clima:document.getElementById('gmCampanhaClima')?.value?.trim()||'',
        cenario:document.getElementById('gmCampanhaCenario')?.value?.trim()||'',
        dataJogo:document.getElementById('gmCampanhaData')?.value?.trim()||'',
        diaCampanha:Math.max(1,Math.floor(Number(document.getElementById('gmCampanhaDia')?.value)||1)),
        resumo:document.getElementById('gmCampanhaResumo')?.value?.trim()||'',
        calico:{...calicoPadrao_(),...(estadoCampanhaMestre?.calico||{})}
    };
    await setDoc(doc(db,'configuracoes','escudoMestre'),{campanha:estadoCampanhaMestre},{merge:true});
    await publicarCampanhaAtual_();
    renderizarDiaCampanhaFicha_();
    await processarReparosConcluidos_();
    somSalvar_();
    alert('Estado da campanha salvo.');
};

function todosEventosMestre_() {
    const eventos=[];
    (userCharacters||[]).forEach(char=>{
        const privados=Array.isArray(char.historicoMestre)?char.historicoMestre:[];
        privados.forEach(r=>eventos.push({...r,__char:char,__origem:'mestre'}));

        // Compatibilidade retroativa: históricos antigos já aparecem imediatamente.
        const antigos=[...(char.historicoRolagens||[]),...(char.historicoRolagensGerais||[])];
        antigos.forEach(r=>{
            if (!privados.some(x=>x.id===r.id)) eventos.push({
                ...r,__char:char,__origem:'legado',
                categoriaMestre:classificarEventoMestre_(r.tipo,r)
            });
        });
    });
    eventos.sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')));
    return eventos;
}

function popularFiltroHistoricoMestre_() {
    const sel=document.getElementById('gmLogFiltroPersonagem');
    if(!sel)return;
    const atual=sel.value;
    sel.innerHTML='<option value="">Todos</option>'+(userCharacters||[]).map(c=>`<option value="${c.id}">${escaparHtmlInventario_(c.nome||'Sem Nome')}</option>`).join('');
    if([...sel.options].some(o=>o.value===atual))sel.value=atual;
}

window.renderizarHistoricoMestre_ = () => {
    if (!(userData && userData.role==='mestre')) return;
    popularFiltroHistoricoMestre_();
    const alvo=document.getElementById('gmHistoricoCentral');
    if(!alvo)return;
    const charId=document.getElementById('gmLogFiltroPersonagem')?.value||'';
    const tipo=document.getElementById('gmLogFiltroTipo')?.value||'';
    let eventos=todosEventosMestre_();
    if(charId)eventos=eventos.filter(e=>e.__char?.id===charId);
    if(tipo)eventos=eventos.filter(e=>(e.categoriaMestre||'')===tipo);
    eventos=eventos.slice(0,800);
    alvo.innerHTML=eventos.map(e=>{
        const c=e.__char||{};
        const data=e.timestamp?new Date(e.timestamp):null;
        const horario=data&&!isNaN(data)?data.toLocaleString('pt-BR'):'';
        let texto=e.texto||'';
        if(e.__origem==='legado'){
            try { texto=formatarRegistroHistorico_(e,true)||texto; } catch(_){}
        }
        return `<div style="display:grid;grid-template-columns:145px minmax(120px,190px) 110px 1fr;gap:9px;align-items:start;padding:9px 10px;border-radius:8px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.065);">
            <span style="color:#777;font-size:.82em;">${escaparHtmlInventario_(horario)}</span>
            <strong style="color:#d8c7ff;">${escaparHtmlInventario_(c.nome||'')}</strong>
            <span style="color:#8feaff;font-size:.86em;">${escaparHtmlInventario_(e.tipo||'Evento')}</span>
            <span style="color:#ddd;">${escaparHtmlInventario_(texto)}</span>
        </div>`;
    }).join('')||'<div style="color:#888;padding:12px;">Nenhum evento registrado.</div>';
};

window.atualizarHistoricoMestre = async () => {
    await carregarPersonagens();
    renderizarHistoricoMestre_();
};



let cenarioSelecionadoMestreId_ = '';

function listaTextoCenario_(texto) {
    return String(texto || '')
        .split(/\r?\n|\s*\|\s*/)
        .map(x => x.trim())
        .filter(Boolean);
}

function obterCenarioSelecionadoMestre_() {
    const id = cenarioSelecionadoMestreId_ || document.getElementById('gmScenarioSelect')?.value || '';
    return (cenariosDB || []).find(c => c.id === id) || null;
}

function popularSelectCenariosMestre_() {
    const sel = document.getElementById('gmScenarioSelect');
    if (!sel) return;
    const atual = cenarioSelecionadoMestreId_ || sel.value || '';
    const ordenados = [...(cenariosDB || [])].sort((a,b)=>String(a.id||'').localeCompare(String(b.id||'')));
    sel.innerHTML = ordenados.length
        ? ordenados.map(c=>`<option value="${escaparHtmlInventario_(c.id)}">${escaparHtmlInventario_(c.id)} · ${escaparHtmlInventario_(c.nome||'Sem nome')}</option>`).join('')
        : '<option value="">Nenhum cenário cadastrado</option>';
    if (ordenados.some(c=>c.id===atual)) sel.value = atual;
    else if (estadoCampanhaMestre?.cenarioId && ordenados.some(c=>c.id===estadoCampanhaMestre.cenarioId)) sel.value = estadoCampanhaMestre.cenarioId;
    cenarioSelecionadoMestreId_ = sel.value || '';
}

function conexoesCenarioHtml_(c) {
    const conexoes = [
        [c.destino1,c.condicao1],
        [c.destino2,c.condicao2],
        [c.destino3,c.condicao3]
    ].filter(([d])=>String(d||'').trim());
    if (!conexoes.length) return '<span style="color:#888;">Nenhuma conexão cadastrada.</span>';
    return conexoes.map(([dest,cond],i)=>{
        const alvo=(cenariosDB||[]).find(x=>x.id===dest);
        const nome=alvo ? `${dest} · ${alvo.nome}` : dest;
        return `<div style="padding:9px 10px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);margin-bottom:7px;">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
                <strong>${escaparHtmlInventario_(nome)}</strong>
                ${alvo ? `<button class="btn-small btn-select" onclick="selecionarCenarioMestre('${escaparHtmlInventario_(dest)}')">Abrir</button>` : ''}
            </div>
            ${cond ? `<small style="color:#aaa;">Condição: ${escaparHtmlInventario_(cond)}</small>` : ''}
        </div>`;
    }).join('');
}

window.selecionarCenarioMestre = (id) => {
    cenarioSelecionadoMestreId_ = id || '';
    const sel=document.getElementById('gmScenarioSelect');
    if(sel && sel.value!==id && [...sel.options].some(o=>o.value===id)) sel.value=id;
    renderizarCenarioMestre_();
};

function renderizarCenarioMestre_() {
    if (!(userData && userData.role==='mestre')) return;
    popularSelectCenariosMestre_();
    const c = obterCenarioSelecionadoMestre_();
    const detalhe = document.getElementById('gmScenarioDetail');
    const ativo = document.getElementById('gmScenarioActiveSummary');
    if (ativo) {
        const ac = (cenariosDB||[]).find(x=>x.id===estadoCampanhaMestre?.cenarioId);
        ativo.innerHTML = ac
            ? `<strong style="color:#fff;">${escaparHtmlInventario_(ac.nome||ac.id)}</strong><br><small>${escaparHtmlInventario_(ac.local||'')}</small>`
            : (estadoCampanhaMestre?.cenario ? escaparHtmlInventario_(estadoCampanhaMestre.cenario) : 'Nenhum.');
    }
    if (!detalhe) return;
    if (!c) {
        detalhe.innerHTML='<div style="padding:22px;border-radius:12px;background:rgba(0,0,0,.15);border:1px dashed rgba(0,212,255,.35);color:#aaa;">Nenhum cenário cadastrado.</div>';
        return;
    }

    const img = c.imagem
      ? `<img src="${escaparHtmlInventario_(c.imagem)}" alt="${escaparHtmlInventario_(c.nome||'')}" style="width:100%;height:310px;object-fit:cover;border-radius:12px;">`
      : `<div style="height:230px;border-radius:12px;background:rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;font-size:4em;">🪐</div>`;

    const bloco=(titulo,conteudo,cor='#00d4ff')=>`<div style="padding:14px;border-radius:10px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.075);">
        <strong style="color:${cor};display:block;margin-bottom:7px;">${titulo}</strong>
        <div style="white-space:pre-wrap;line-height:1.45;color:#ddd;">${escaparHtmlInventario_(conteudo||'—')}</div>
    </div>`;

    detalhe.innerHTML = `
      ${img}
      <div style="margin:14px 0 12px;">
        <h3 style="margin:0;color:#fff;">${escaparHtmlInventario_(c.nome||'')}</h3>
        <div style="color:#aaa;margin-top:4px;">${escaparHtmlInventario_(c.id||'')} · ${escaparHtmlInventario_(c.local||'')} · ${escaparHtmlInventario_(c.tipo||'')}</div>
        ${c.estadoInicial ? `<div style="margin-top:7px;"><span style="padding:3px 8px;border-radius:999px;background:rgba(0,212,255,.12);border:1px solid rgba(0,212,255,.28);color:#8feaff;">${escaparHtmlInventario_(c.estadoInicial)}</span></div>` : ''}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${bloco('👁️ Descrição para jogadores',c.descricaoJogadores)}
        ${bloco('🛡️ Descrição do Mestre',c.descricaoGM,'#ffd166')}
        ${bloco('🎯 Objetivo',c.objetivo)}
        ${bloco('🔒 Segredos',c.segredos,'#ff8f8f')}
        ${bloco('🎲 Testes sugeridos',c.testesSugeridos)}
        ${bloco('👥 NPCs / nomes de referência',c.npcsCena,'#d8b4ff')}
        <div style="padding:14px;border-radius:10px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.075);">
            <strong style="color:#d8b4ff;display:block;margin-bottom:8px;">🧑‍🚀 Personagens vinculados</strong>
            ${cardsPersonagensCenario_(c,true)}
        </div>
        ${bloco('📝 Observações',c.observacoes)}
        <div style="padding:14px;border-radius:10px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.075);">
            <strong style="color:#00d4ff;display:block;margin-bottom:7px;">🧭 Conexões</strong>
            ${conexoesCenarioHtml_(c)}
        </div>
      </div>

      <div style="margin-top:12px;padding:14px;border-radius:10px;background:rgba(40,167,69,.07);border:1px solid rgba(40,167,69,.28);">
        <strong style="color:#8ff0a8;display:block;margin-bottom:8px;">👁 Prévia pública futura</strong>
        <div style="color:#bbb;margin-bottom:10px;">Somente estes dados seriam publicados para os jogadores: imagem, descrição para jogadores e personagens marcados como visíveis.</div>
        ${cardsPersonagensCenario_({...c,personagensCena:(c.personagensCena||[]).filter(x=>x.visivel)},false)}
      </div>`;
}

window.ativarCenarioMestre = async () => {
    const c = obterCenarioSelecionadoMestre_();
    if (!c) return;
    estadoCampanhaMestre = {
        ...(estadoCampanhaMestre||{}),
        cenarioId:c.id,
        cenario:c.nome || c.id
    };
    await setDoc(doc(db,'configuracoes','escudoMestre'),{campanha:estadoCampanhaMestre},{merge:true});
    await publicarCampanhaAtual_();
    preencherEstadoCampanha_();
    renderizarCenarioMestre_();
    somSalvar_();
};

window.editarCenarioAtivoNoBanco = () => {
    const c = obterCenarioSelecionadoMestre_();
    if (!c) return;
    editarCenarioBanco(c.id);
};

window.rolarEventoCenarioMestre = () => {
    const c=obterCenarioSelecionadoMestre_();
    const alvo=document.getElementById('gmScenarioRollResult');
    if(!c||!alvo)return;
    const lista=listaTextoCenario_(c.eventos);
    if(!lista.length){alvo.textContent='Este cenário ainda não possui eventos cadastrados.';return;}
    const i=Math.floor(Math.random()*lista.length);
    alvo.innerHTML=`<strong>Evento ${i+1}/${lista.length}:</strong> ${escaparHtmlInventario_(lista[i])}`;
};

window.rolarEncontroCenarioMestre = () => {
    const c=obterCenarioSelecionadoMestre_();
    const alvo=document.getElementById('gmScenarioRollResult');
    if(!c||!alvo)return;

    const vinculados=(Array.isArray(c.personagensCena)?c.personagensCena:[])
        .map(v=>({v,p:obterPersonagemCenarioPorId_(v.id)}))
        .filter(x=>x.p);

    if(vinculados.length){
        const sorte=vinculados[Math.floor(Math.random()*vinculados.length)];
        const p=sorte.p;
        const img=p.imagem
          ? `<img src="${escaparHtmlInventario_(p.imagem)}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;">`
          : `<div style="width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);">👤</div>`;
        alvo.innerHTML=`<div style="display:flex;gap:10px;align-items:center;">${img}<div><strong>${escaparHtmlInventario_(p.nome||'Sem Nome')}</strong><br><small style="color:${sorte.v.visivel?'#8ff0a8':'#aaa'};">${sorte.v.visivel?'Visível aos jogadores':'Oculto aos jogadores'}</small></div></div>`;
        return;
    }

    let lista=listaTextoCenario_(c.encontros);
    if(!lista.length) lista=listaTextoCenario_(c.npcsCena);
    if(!lista.length){alvo.textContent='Este cenário ainda não possui encontros ou NPCs cadastrados.';return;}
    const i=Math.floor(Math.random()*lista.length);
    alvo.innerHTML=`<strong>Encontro ${i+1}/${lista.length}:</strong> ${escaparHtmlInventario_(lista[i])}`;
};




function grauCombateValor_(grau){
    const g=String(grau||'').toLowerCase();
    if(g.includes('crít')||g.includes('crit'))return 3;
    if(g.includes('sucesso')||g==='success')return 2;
    if(g.includes('falha')||g==='failure')return 1;
    return 0;
}
function periciaEhOfensiva_(pericia){return !!pericia && pericia.id!=='esquiva';}

function obterPenetracaoArma_(item){
    if(!item)return 0;
    const explicita=Number(item.penetracao ?? item.penetration);
    if(Number.isFinite(explicita)&&explicita>=0)return Math.floor(explicita);
    const n=normalizarTextoCombate_([item.nome,item.nome_en,item.categoria,item.municao].filter(Boolean).join(' '));
    if(n.includes('gauss'))return n.includes('rifle')?8:5;
    if(n.includes('laser')){
        if(n.includes('pesad'))return 6;
        if(n.includes('rifle'))return 5;
        if(n.includes('carabina'))return 4;
        return 3;
    }
    if(n.includes('blaster'))return (n.includes('rifle')||n.includes('carabina'))?4:2;
    if(n.includes('phaser'))return n.includes('rifle')?5:3;
    if(n.includes('556')||n.includes('5,56'))return 2;
    if(n.includes('9mm')||n.includes('9 mm'))return 1;
    if(n.includes('escopeta'))return 1;
    return 0;
}

async function sincronizarSessaoPublicaCombateMestre_(){
    if(!(userData&&userData.role==='mestre'))return;
    const participantes=(estadoCombateMestre.participantes||[]).map(p=>{
        const c=(userCharacters||[]).find(x=>x.id===p.id);
        return c?{id:c.id,nome:c.nome||'Sem nome',imagem:c.imagem||'',tipo:tipoPersonagemCombateMestre_(c),iniciativa:Number.isFinite(Number(p.iniciativa))?Number(p.iniciativa):null}:null;
    }).filter(Boolean);
    const sessao={
        ativo:!!estadoCombateMestre.ativo,
        rodada:Number(estadoCombateMestre.rodada||1),
        ciclo:Number(estadoCombateMestre.ciclo||1),
        participanteAtualId:estadoCombateMestre.participantes?.[estadoCombateMestre.turnoIndex]?.id||'',
        participantes,
        atualizadoEm:new Date().toISOString()
    };
    for(const p of estadoCombateMestre.participantes||[]){
        const c=(userCharacters||[]).find(x=>x.id===p.id);if(!c)continue;
        c.combate=c.combate||{};c.combate.sessaoMesa=sessao;
        await setDoc(doc(db,'personagens',c.id),{'combate.sessaoMesa':sessao},{merge:true});
    }
}

function alvoAtualCombateJogador_(char){
    const sess=char?.combate?.sessaoMesa;if(!sess?.ativo)return '';
    const ids=new Set((sess.participantes||[]).map(x=>x.id));
    const salvo=String(char?.combate?.alvoPreferido||'');
    return salvo!==char.id&&ids.has(salvo)?salvo:'';
}
function renderizarAlvosCombateJogador_(char){
    const sel=document.getElementById('combatTargetSelect');if(!sel)return;
    const sess=char?.combate?.sessaoMesa;
    if(!sess?.ativo){sel.innerHTML='<option value="">— fora de combate —</option>';sel.disabled=true;return;}
    const outros=(sess.participantes||[]).filter(x=>x.id!==char.id);
    let alvo=alvoAtualCombateJogador_(char);
    if(!alvo&&outros.length){alvo=outros[0].id;char.combate=char.combate||{};char.combate.alvoPreferido=alvo;}
    sel.disabled=false;
    sel.innerHTML=outros.map(x=>`<option value="${escaparHtmlInventario_(x.id)}" ${x.id===alvo?'selected':''}>${escaparHtmlInventario_(x.nome)}</option>`).join('')||'<option value="">— sem alvo —</option>';
}
window.salvarAlvoCombateJogador_=async(alvoId)=>{
    const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(!c)return;
    c.combate=c.combate||{};c.combate.alvoPreferido=String(alvoId||'');
    await setDoc(doc(db,'personagens',c.id),{'combate.alvoPreferido':c.combate.alvoPreferido},{merge:true});
};

function opcoesDefesaReacao_(char){
    const skills=[...(obterPericiasCombate_(char)||[])].sort((a,b)=>a.id==='esquiva'?-1:b.id==='esquiva'?1:getNome(a).localeCompare(getNome(b)));
    return skills.map(p=>`<option value="${p.__especializacao?'esp':'per'}:${p.id}">${escaparHtmlInventario_(getNome(p))}</option>`).join('');
}
function renderizarReacaoCombateJogador_(char){
    const box=document.getElementById('combatReactionPanel');if(!box)return;
    const conf=char?.combate?.confrontoPendente;
    if(!conf||conf.status!=='aguardando_defesa'||conf.defensorId!==char.id){box.style.display='none';box.innerHTML='';return;}
    const ac=garantirPontosAcaoCombate_(char);
    box.style.display='block';
    box.innerHTML=`<strong style="color:#ff9c90;">⚔️ ${escaparHtmlInventario_(conf.atacanteNome||'Atacante')} está atacando você</strong>
    <div style="margin-top:7px;">Ataque: <strong>${escaparHtmlInventario_(conf.ataque?.grau||'')}</strong> · AÇ ${ac.atual}/${ac.max}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;">
      <select id="playerDefenseSkillSelect" style="min-width:220px;">${opcoesDefesaReacao_(char)}</select>
      <button class="btn-small btn-select" ${ac.atual<=0?'disabled':''} onclick="responderDefesaJogador_(true)">🛡️ Defender</button>
      <button class="btn-small btn-delete" onclick="responderDefesaJogador_(false)">✋ Não defender</button>
    </div>`;
}
window.responderDefesaJogador_=async(defender)=>{
    const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(!c)return;
    const conf=c?.combate?.confrontoPendente;if(!conf||conf.status!=='aguardando_defesa')return;
    let resposta={defendeu:false,grau:'Falha',rolagem:null,valor:null,timestamp:new Date().toISOString()};
    if(defender){
        const ac=garantirPontosAcaoCombate_(c);if(ac.atual<=0)return;
        const tok=document.getElementById('playerDefenseSkillSelect')?.value||'';const [tipo,id]=tok.split(':');
        const per=(tipo==='esp'?especializacoesDB:periciasDB).find(x=>x.id===id);if(!per)return;
        const base=obterValorRegistroPericia_(c,id,tipo==='esp'),aj=aplicarDificuldadeEFadiga_(c,base,'padrao',0);if(aj.bloqueado)return;
        somDado_();const roll=Math.floor(Math.random()*100)+1,r=classificarD100_(aj.valor,roll);
        resposta={defendeu:true,periciaId:id,grau:r.grau,rolagem:roll,valor:aj.valor,timestamp:new Date().toISOString()};
        c.combate.pontosAcaoAtuais=Math.max(0,ac.atual-1);
        await registrarHistoricoCombate_('Defesa',`${getNome(per)}: ${roll}/${aj.valor} → ${r.grau}`,{subtipo:'defesaCombate',periciaId:id,rolagem:roll,valorEfetivo:aj.valor,grau:r.grau});
    }
    c.combate.confrontoPendente={...conf,status:'respondido',resposta};
    await setDoc(doc(db,'personagens',c.id),{'combate.confrontoPendente':c.combate.confrontoPendente,'combate.pontosAcaoAtuais':c.combate.pontosAcaoAtuais},{merge:true});
    renderizarReacaoCombateJogador_(c);atualizarVisualPontosAcao_(c);
};

function efeitosDisponiveisCombate_(pend){
    const arr=[
      {id:'localizacao',nome:'🎯 Escolher localização'},
      {id:'sangrar',nome:'🩸 Sangrar'},
      {id:'danificar_arma',nome:'🗡️ Danificar arma'},
      {id:'derrubar',nome:'💥 Derrubar'}
    ];
    if(String(pend?.ataque?.grau||'')==='Crítico')arr.push({id:'ignorar_armadura',nome:'🛡️ Ignorar armadura'});
    return arr;
}
function renderizarEfeitoEspecialJogador_(char){
    const box=document.getElementById('combatSpecialEffectPanel');if(!box)return;
    const pend=char?.combate?.efeitoEspecialPendente;
    if(!pend||Number(pend.restantes||0)<=0){box.style.display='none';box.innerHTML='';return;}
    box.style.display='block';
    box.innerHTML=`<strong style="color:#ffd166;">⭐ ${pend.restantes} Efeito(s) Especial(is) pendente(s)</strong>
      <div style="margin-top:6px;">Resolva antes de fazer outro teste.</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;">${efeitosDisponiveisCombate_(pend).map(e=>`<button class="btn-small" onclick="escolherEfeitoEspecialJogador_('${e.id}')">${e.nome}</button>`).join('')}</div>`;
}
window.escolherEfeitoEspecialJogador_=async(tipo)=>{
    const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(!c)return;
    const pend=c?.combate?.efeitoEspecialPendente;if(!pend||pend.restantes<=0)return;
    let detalhe='';if(tipo==='localizacao'){detalhe=normalizarLocalCorpo_(prompt('Localização','Peito')||'')||'';if(!detalhe)return;}
    pend.escolhas=[...(pend.escolhas||[]),{tipo,detalhe,timestamp:new Date().toISOString()}];
    pend.restantes=Math.max(0,Number(pend.restantes||0)-1);
    await setDoc(doc(db,'personagens',c.id),{'combate.efeitoEspecialPendente':pend},{merge:true});
    c.combate.efeitoEspecialPendente=pend;renderizarEfeitoEspecialJogador_(c);
};
function ataqueBloqueadoPorEfeito_(char){return Number(char?.combate?.efeitoEspecialPendente?.restantes||0)>0;}

async function criarConfrontoPendenteMestre_(atacante,pAtacante,alvoId,ataque,item){
    const alvo=(userCharacters||[]).find(x=>x.id===alvoId);if(!alvo)return;
    alvo.combate=alvo.combate||{};
    alvo.combate.confrontoPendente={
      id:`conf_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      atacanteId:atacante.id,atacanteNome:atacante.nome||'',defensorId:alvo.id,status:'aguardando_defesa',
      ataque:{grau:ataque.grau,rolagem:ataque.rolagem,valor:ataque.valor,periciaId:ataque.periciaId,equipamentoId:pAtacante.equipSelecionado||'',
        equipamentoNome:item?getNome(item):'Punhos',penetracao:obterPenetracaoArma_(item),timestamp:new Date().toISOString()}
    };
    await setDoc(doc(db,'personagens',alvo.id),{'combate.confrontoPendente':alvo.combate.confrontoPendente},{merge:true});
}

async function resolverConfrontosRespondidosMestre_(){
    for(const alvo of userCharacters||[]){
        const conf=alvo?.combate?.confrontoPendente;if(!conf||conf.status!=='respondido')continue;
        const atacante=(userCharacters||[]).find(x=>x.id===conf.atacanteId);if(!atacante)continue;
        const a=grauCombateValor_(conf.ataque?.grau),d=conf.resposta?.defendeu?grauCombateValor_(conf.resposta?.grau):1;
        const acertou=a>=2&&(!conf.resposta?.defendeu||a>d),especiais=acertou?Math.max(0,a-d):0;
        atacante.combate=atacante.combate||{};
        if(especiais>0){
            atacante.combate.efeitoEspecialPendente={confrontoId:conf.id,alvoId:alvo.id,alvoNome:alvo.nome||'',ataque:conf.ataque,restantes:especiais,escolhas:[],timestamp:new Date().toISOString()};
            await setDoc(doc(db,'personagens',atacante.id),{'combate.efeitoEspecialPendente':atacante.combate.efeitoEspecialPendente},{merge:true});
        }else if(acertou){
            atacante.combate.danoAutorizado={confrontoId:conf.id,alvoId:alvo.id,penetracao:Number(conf.ataque?.penetracao||0),timestamp:new Date().toISOString()};
            await setDoc(doc(db,'personagens',atacante.id),{'combate.danoAutorizado':atacante.combate.danoAutorizado},{merge:true});
        }
        conf.status='resolvido';conf.resultado={ataqueAcertou:acertou,especiais,defesa:conf.resposta||null,timestamp:new Date().toISOString()};
        alvo.combate.confrontoPendente=conf;await setDoc(doc(db,'personagens',alvo.id),{'combate.confrontoPendente':conf},{merge:true});
        const p=obterParticipanteCombateMestre_(atacante.id);
        if(p)p.ultimoResultado=acertou?(especiais?`Ataque acertou · ${especiais} Efeito(s) Especial(is) pendente(s).`:'Ataque acertou · dano liberado.'):'Ataque defendido.';
    }
}
async function aplicarEscolhasEfeitosMestre_(){
    for(const atacante of userCharacters||[]){
        const pend=atacante?.combate?.efeitoEspecialPendente;if(!pend||Number(pend.restantes||0)>0||pend.aplicado)continue;
        const alvo=(userCharacters||[]).find(x=>x.id===pend.alvoId);if(!alvo)continue;
        alvo.combate=alvo.combate||{};let ignorar=false,local='';
        for(const e of (pend.escolhas||[])){
            if(e.tipo==='localizacao')local=e.detalhe||'';
            else if(e.tipo==='sangrar')alvo.combate.sangramentoAtivo=true;
            else if(e.tipo==='danificar_arma')alvo.combate.armaDanificadaPendente=true;
            else if(e.tipo==='derrubar')alvo.combate.caido=true;
            else if(e.tipo==='ignorar_armadura')ignorar=true;
        }
        atacante.combate=atacante.combate||{};
        atacante.combate.danoAutorizado={confrontoId:pend.confrontoId,alvoId:alvo.id,penetracao:Number(pend.ataque?.penetracao||0),ignorarArmadura:ignorar,localEscolhido:local,timestamp:new Date().toISOString()};
        pend.aplicado=true;
        await setDoc(doc(db,'personagens',alvo.id),{combate:alvo.combate},{merge:true});
        await setDoc(doc(db,'personagens',atacante.id),{'combate.efeitoEspecialPendente':pend,'combate.danoAutorizado':atacante.combate.danoAutorizado},{merge:true});
    }
}

let sincronizadorCombateTimer_=null;
async function sincronizarCombateMultiplayer_(){
    if(!currentUserUid)return;
    try{
        if(userData?.role==='mestre'){
            const snap=await getDocs(collection(db,'personagens')),mapa=new Map();
            snap.forEach(d=>mapa.set(d.id,{id:d.id,...d.data()}));userCharacters=userCharacters.map(c=>mapa.get(c.id)||c);
            for(const atacante of userCharacters||[]){
                const req=atacante?.combate?.ataqueSolicitado;if(!req||req.status!=='novo')continue;
                const p=obterParticipanteCombateMestre_(atacante.id);if(!p||!obterParticipanteCombateMestre_(req.alvoId))continue;
                p.alvoId=req.alvoId;const item=encontrarEquipamentoCombateChar_(atacante,req.equipamentoId);
                await criarConfrontoPendenteMestre_(atacante,p,req.alvoId,{grau:req.grau,rolagem:req.rolagem,valor:req.valor,periciaId:req.periciaId},item);
                req.status='processado';await setDoc(doc(db,'personagens',atacante.id),{'combate.ataqueSolicitado':req},{merge:true});
            }
            await resolverConfrontosRespondidosMestre_();await aplicarEscolhasEfeitosMestre_();
            if(!estaEditandoSeletoresCombateMestre_())renderizarCombateMestre_();
        }else if(currentCharId){
            const snap=await getDoc(doc(db,'personagens',currentCharId));if(!snap.exists())return;
            const novo={id:snap.id,...snap.data()},ix=userCharacters.findIndex(x=>x.id===currentCharId);if(ix>=0)userCharacters[ix]=novo;
            renderizarAlvosCombateJogador_(novo);renderizarReacaoCombateJogador_(novo);renderizarEfeitoEspecialJogador_(novo);renderizarEstadoCaidoJogador_(novo);atualizarVisualPontosAcao_(novo);
        }
    }catch(err){console.warn('Sincronização de combate:',err);}
}
function iniciarSincronizadorCombate_(){if(sincronizadorCombateTimer_)clearInterval(sincronizadorCombateTimer_);sincronizadorCombateTimer_=setInterval(sincronizarCombateMultiplayer_,2200);}

async function salvarEstadoCombateMestre_(){
    if(!(userData&&userData.role==='mestre'))return;
    await setDoc(doc(db,'configuracoes','escudoMestre'),{combate:estadoCombateMestre},{merge:true});
    await sincronizarSessaoPublicaCombateMestre_();
}

function tipoPersonagemCombateMestre_(c){
    const tipo=String(c?.tipo||'pc').toLowerCase();
    if(['npc','npc_rapido','monstro'].includes(tipo)) return tipo==='monstro'?'Monstro':'NPC';
    return c?.dono===currentUserUid?'PM':'PC';
}

function obterParticipanteCombateMestre_(id){
    return (estadoCombateMestre.participantes||[]).find(p=>p.id===id)||null;
}

function obterUltimaIniciativaChar_(c){
    const u=c?.combate?.ultimaIniciativa;
    if(u && Number.isFinite(Number(u.total))) return u;
    const hist=Array.isArray(c?.historicoRolagens)?c.historicoRolagens:[];
    const r=hist.find(x=>x?.subtipo==='iniciativa' && Number.isFinite(Number(x.total)));
    return r ? {total:Number(r.total),timestamp:r.timestamp||'',dado:r.dado,iniciativaBase:r.iniciativaBase,iniciativaEfetiva:r.iniciativaEfetiva} : null;
}

function garantirParticipantesValidosCombateMestre_(){
    const ids=new Set((userCharacters||[]).map(c=>c.id));
    estadoCombateMestre.participantes=(estadoCombateMestre.participantes||[]).filter(p=>ids.has(p.id));
    if(estadoCombateMestre.turnoIndex>=estadoCombateMestre.participantes.length) estadoCombateMestre.turnoIndex=0;
}

function sincronizarIniciativasCombateMestre_(autoOrdenar=true){
    garantirParticipantesValidosCombateMestre_();
    let mudou=false;
    (estadoCombateMestre.participantes||[]).forEach(p=>{
        const c=(userCharacters||[]).find(x=>x.id===p.id);
        const u=obterUltimaIniciativaChar_(c);
        if(!u)return;
        const ts=String(u.timestamp||'');
        if(ts && ts!==String(p.iniciativaTimestamp||'')){
            p.iniciativa=Number(u.total);
            p.iniciativaTimestamp=ts;
            mudou=true;
        }else if(!Number.isFinite(Number(p.iniciativa)) && Number.isFinite(Number(u.total))){
            p.iniciativa=Number(u.total);
            p.iniciativaTimestamp=ts;
            mudou=true;
        }
    });
    if(mudou && autoOrdenar){
        const atualId=estadoCombateMestre.participantes[estadoCombateMestre.turnoIndex]?.id||'';
        estadoCombateMestre.participantes.sort((a,b)=>{
            const ia=Number.isFinite(Number(a.iniciativa))?Number(a.iniciativa):-9999;
            const ib=Number.isFinite(Number(b.iniciativa))?Number(b.iniciativa):-9999;
            return ib-ia;
        });
        const ix=estadoCombateMestre.participantes.findIndex(p=>p.id===atualId);
        estadoCombateMestre.turnoIndex=ix>=0?ix:0;
    }
    return mudou;
}


function calcularHitLocations_(conTotal,tamTotal){
    const soma=Number(conTotal||0)+Number(tamTotal||0);
    const coluna=soma<=5?0:soma<=10?1:soma<=15?2:soma<=20?3:soma<=25?4:soma<=30?5:soma<=35?6:7;
    const incremento=soma>40?Math.ceil((soma-40)/5):0;
    const tabela={
        perna:[1,2,3,4,5,6,7,8],
        abdomen:[2,3,4,5,6,7,8,9],
        peito:[3,4,5,6,7,8,9,10],
        braco:[1,1,2,3,4,5,6,7],
        cabeca:[1,2,3,4,5,6,7,8]
    };
    return {
        'Cabeça':tabela.cabeca[coluna]+incremento,
        'Peito':tabela.peito[coluna]+incremento,
        'Abdômen':tabela.abdomen[coluna]+incremento,
        'Braço Direito':tabela.braco[coluna]+incremento,
        'Braço Esquerdo':tabela.braco[coluna]+incremento,
        'Perna Direita':tabela.perna[coluna]+incremento,
        'Perna Esquerda':tabela.perna[coluna]+incremento
    };
}



function estaCaidoCombate_(char){return !!char?.combate?.caido;}
async function levantarPersonagemCombate_(char,origem='mestre'){
    if(!char)return false;
    char.combate=char.combate||{};
    if(!char.combate.caido)return true;
    const ac=garantirPontosAcaoCombate_(char);
    if(ac.atual<=0)return false;
    char.combate.pontosAcaoAtuais=Math.max(0,ac.atual-1);
    char.combate.caido=false;
    await setDoc(doc(db,'personagens',char.id),{'combate.caido':false,'combate.pontosAcaoAtuais':char.combate.pontosAcaoAtuais},{merge:true});
    if(origem==='mestre')await registrarHistoricoCombateCharMestre_(char,'Ação',`Levantou-se · AÇ ${char.combate.pontosAcaoAtuais}/${ac.max}`,{subtipo:'levantar',pontosAcao:char.combate.pontosAcaoAtuais});
    else await registrarHistoricoCombate_('Ação',`Levantou-se · AÇ ${char.combate.pontosAcaoAtuais}/${ac.max}`,{subtipo:'levantar',pontosAcao:char.combate.pontosAcaoAtuais});
    return true;
}
window.levantarCombateMestre_=async(id)=>{
    const c=(userCharacters||[]).find(x=>x.id===id);if(!c)return;
    if(!(await levantarPersonagemCombate_(c,'mestre'))){alert('Sem AÇ para se levantar.');return;}
    renderizarCombateMestre_();
};
window.levantarCombateJogador_=async()=>{
    const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(!c)return;
    if(!(await levantarPersonagemCombate_(c,'jogador'))){const r=document.getElementById('combatRollSummary');if(r)r.innerHTML='⚠️ Sem AÇ para se levantar.';return;}
    atualizarVisualPontosAcao_(c);renderizarEstadoCaidoJogador_(c);
};
function renderizarEstadoCaidoJogador_(char){
    const btn=document.getElementById('combatStandBtn');if(!btn)return;
    btn.style.display=estaCaidoCombate_(char)?'inline-flex':'none';
    btn.disabled=garantirPontosAcaoCombate_(char).atual<=0;
}
function acoesResumoCombateMestre_(char){
    const info=garantirPontosAcaoCombate_(char);
    return {atual:Number(info.atual||0),max:Number(info.max||0),texto:`${Number(info.atual||0)}/${Number(info.max||0)}`};
}

function todosSemAcoesCombateMestre_(){
    const participantes=estadoCombateMestre.participantes||[];
    if(!participantes.length)return false;
    return participantes.every(p=>{
        const c=(userCharacters||[]).find(x=>x.id===p.id);
        if(!c)return true;
        return acoesResumoCombateMestre_(c).atual<=0;
    });
}

async function registrarNovaRodadaNosParticipantesMestre_(rodada){
    for(const p of estadoCombateMestre.participantes||[]){
        const c=(userCharacters||[]).find(x=>x.id===p.id);
        if(!c)continue;
        await registrarHistoricoCombateCharMestre_(
            c,
            'Nova rodada',
            `Rodada ${rodada} iniciada · AÇ restauradas`,
            {subtipo:'novaRodada',rodada}
        );
    }
}

window.novaRodadaCombateMestre=async(forcada=false)=>{
    if(!(estadoCombateMestre.participantes||[]).length)return;
    if(forcada && !confirm('Iniciar uma nova rodada e restaurar as AÇ de todos os participantes?'))return;

    estadoCombateMestre.rodada=Math.max(1,Number(estadoCombateMestre.rodada||1)+1);
    estadoCombateMestre.ciclo=1;
    estadoCombateMestre.turnoIndex=0;
    estadoCombateMestre.ativo=true;

    for(const p of estadoCombateMestre.participantes){
        const c=(userCharacters||[]).find(x=>x.id===p.id);
        if(!c)continue;
        c.combate=c.combate||{};
        const max=obterPAMaxCombate_(c);
        c.combate.pontosAcaoAtuais=max;
        await setDoc(doc(db,'personagens',c.id),{'combate.pontosAcaoAtuais':max},{merge:true});
    }

    await registrarNovaRodadaNosParticipantesMestre_(estadoCombateMestre.rodada);
    await salvarEstadoCombateMestre_();
    renderizarCombateMestre_();
};

async function verificarFimRodadaPorAcoesMestre_(){
    if(todosSemAcoesCombateMestre_()){
        await novaRodadaCombateMestre(false);
        return true;
    }
    return false;
}

function pvResumoCombateMestre_(char){
    if(modoCombateAtual_()==='simplificado'){
        const max=calcularPVGlobalMax_(char);
        const atual=Number.isFinite(Number(char?.combate?.pvGlobalAtual))?Number(char.combate.pvGlobalAtual):max;
        return {atual,max,texto:`${Math.max(0,atual)}/${max}`};
    }
    const a=char?.atributos||{},b=char?.bonus||{};
    const maxLoc=calcularHitLocations_(Number(a.CON||10)+Number(b.CON||0),Number(a.TAM||10)+Number(b.TAM||0));
    const cur=char?.combate?.hitLocations||{};
    let atual=0,max=0;
    Object.entries(maxLoc).forEach(([loc,v])=>{
        max+=Number(v||0);
        atual+=Number.isFinite(Number(cur[loc]))?Number(cur[loc]):Number(v||0);
    });
    return {atual,max,texto:`${Math.max(0,atual)}/${max}`};
}

function paResumoCombateMestre_(char){
    if(modoCombateAtual_()==='simplificado'){
        const equip=calcularPAGlobalEquipado_(char);
        const manual=Math.max(0,Number(char?.combate?.armorGlobalManual||0));
        return manual+equip;
    }
    const locais=['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda'];
    const equip=calcularPAEquipado_(char,locais);
    const manual=char?.combate?.armor||{};
    const vals=locais.map(l=>Math.max(0,Number(equip?.[l]||0)+Number(manual?.[l]||0)));
    return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0;
}


function resumoLocaisCompactoCombateMestre_(char){
    if(modoCombateAtual_()==='simplificado') return '';

    const locais=[
        ['Cabeça','Cabeça'],['Peito','Peito'],['Abdômen','Abdômen'],
        ['Braço Direito','Braço D.'],['Braço Esquerdo','Braço E.'],
        ['Perna Direita','Perna D.'],['Perna Esquerda','Perna E.']
    ];

    const a=char.atributos||{}, b=char.bonus||{};
    const maxLoc=calcularHitLocations_(
        Number(a.CON||10)+Number(b.CON||0),
        Number(a.TAM||10)+Number(b.TAM||0)
    );
    const atuais=char?.combate?.hitLocations||{};
    const equipamento=calcularPAEquipado_(char,locais.map(x=>x[0]));
    const manual=char?.combate?.armor||{};

    return `<div style="display:grid;grid-template-columns:repeat(7,minmax(82px,1fr));gap:5px;margin-top:9px;">
        ${locais.map(([loc,rotulo])=>{
            const atual=Number.isFinite(Number(atuais[loc])) ? Number(atuais[loc]) : Number(maxLoc[loc]||1);
            const pa=Math.max(0,Number(manual[loc]||0)+Number(equipamento?.[loc]||0));
            const ferido=atual < Number(maxLoc[loc]||1);
            return `<div style="padding:5px 6px;border-radius:7px;background:${ferido?'rgba(231,76,60,.10)':'rgba(255,255,255,.035)'};border:1px solid ${ferido?'rgba(231,76,60,.30)':'rgba(255,255,255,.07)'};text-align:center;">
                <div style="font-size:.70em;color:#aaa;white-space:nowrap;">${rotulo}</div>
                <strong style="font-size:.92em;color:${ferido?'#ff9c90':'#fff'};">PV ${atual}</strong>
                <div style="font-size:.68em;color:#8fb9d8;">PA ${pa}</div>
            </div>`;
        }).join('')}
    </div>`;
}

function opcoesPericiasCombateMestre_(char,selecionado=''){
    return obterPericiasCombate_(char).map(p=>{
        const v=`${p.__especializacao?'esp':'per'}:${p.id}`;
        return `<option value="${escaparHtmlInventario_(v)}" ${v===selecionado?'selected':''}>${escaparHtmlInventario_(getNome(p))}</option>`;
    }).join('');
}

function obterPericiaCombateMestrePorValor_(valor){
    const [tipo,id]=String(valor||'').split(':');
    const banco=tipo==='esp'?especializacoesDB:periciasDB;
    const p=banco.find(x=>x.id===id);
    return p?{...p,__especializacao:tipo==='esp'}:null;
}

function equipamentosCombateChar_(char,pericia,selecionado=''){
    let opts=[];
    if(!pericia)return '<option value="">—</option>';
    if(pericia.id==='esquiva') opts=[{value:'nenhum',label:'Sem equipamento'}];
    else if(pericia.id==='combate_desarmado') opts=[{value:'desarmado',label:'Punhos'}];
    else{
        const equipados=obterItensEquipados_(char).filter(itemEhArmaOuEscudo_).filter(i=>equipamentoCompativelComPericia_(i,pericia));
        opts=equipados.map((item,i)=>{
            const id=item.instanciaId||item.instanceId||item.idInstancia||item.id||`equipado_${i}`;
            return {value:String(id),label:getNome(item)+rotuloCompatArma_(penalidadeCompatibilidadeArma_(pericia,item))};
        });
        if(!opts.length)opts=[{value:'',label:'Nenhum equipamento compatível'}];
    }
    return opts.map(o=>`<option value="${escaparHtmlInventario_(o.value)}" ${String(o.value)===String(selecionado)?'selected':''}>${escaparHtmlInventario_(o.label)}</option>`).join('');
}

function encontrarEquipamentoCombateChar_(char,valor){
    if(!char||!valor||['desarmado','nenhum'].includes(valor))return null;
    return obterItensEquipados_(char).find((item,i)=>{
        const id=item.instanciaId||item.instanceId||item.idInstancia||item.id||`equipado_${i}`;
        return String(id)===String(valor);
    })||null;
}

function detalhesPVPACombateMestre_(char){
    if(modoCombateAtual_()==='simplificado'){
        const max=calcularPVGlobalMax_(char);
        const atual=Number.isFinite(Number(char?.combate?.pvGlobalAtual))?Number(char.combate.pvGlobalAtual):max;
        const equip=calcularPAGlobalEquipado_(char);
        const manual=Math.max(0,Number(char?.combate?.armorGlobalManual||0));
        return `<div style="display:grid;grid-template-columns:repeat(2,minmax(120px,1fr));gap:8px;">
            <label>PV Geral <input type="number" min="0" max="${max}" value="${atual}" onchange="editarPVCombateMestre_('${char.id}','global',this.value)"></label>
            <label>PA manual <input type="number" min="0" value="${manual}" onchange="editarPACombateMestre_('${char.id}','global',this.value)"></label>
            <small style="color:#888;grid-column:1/-1;">PA de equipamento: ${equip}</small>
        </div>`;
    }
    const locais=['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda'];
    const a=char.atributos||{},b=char.bonus||{};
    const maxLoc=calcularHitLocations_(Number(a.CON||10)+Number(b.CON||0),Number(a.TAM||10)+Number(b.TAM||0));
    const cur=char?.combate?.hitLocations||{};
    const eq=calcularPAEquipado_(char,locais);
    const man=char?.combate?.armor||{};
    return `<div style="display:grid;grid-template-columns:1.4fr .8fr .8fr .8fr;gap:6px;align-items:center;font-size:.84em;">
        <strong>Local</strong><strong>PV</strong><strong>PA manual</strong><strong>PA total</strong>
        ${locais.map(loc=>{
            const atual=Number.isFinite(Number(cur[loc]))?Number(cur[loc]):Number(maxLoc[loc]||1);
            const manual=Math.max(0,Number(man[loc]||0));
            const total=manual+Math.max(0,Number(eq?.[loc]||0));
            return `<span>${traduzirLocalCorpo_(loc)}</span>
            <input type="number" min="0" max="${maxLoc[loc]||1}" value="${atual}" onchange="editarPVCombateMestre_('${char.id}','${loc}',this.value)">
            <input type="number" min="0" value="${manual}" onchange="editarPACombateMestre_('${char.id}','${loc}',this.value)">
            <strong>${total}</strong>`;
        }).join('')}
    </div>`;
}

const selecionadosCombateMestre_=new Set();
window.alternarSelecaoCombateMestre_=(id,marcado)=>{
    if(marcado)selecionadosCombateMestre_.add(String(id));
    else selecionadosCombateMestre_.delete(String(id));
};

window.iniciarArrastoCandidatoCombateMestre_=(event,id)=>{
    event.dataTransfer.effectAllowed='copy';
    event.dataTransfer.setData('application/x-mesa-combat-character',String(id));
    event.dataTransfer.setData('text/plain',String(id));
};
window.permitirDropCandidatoCombateMestre_=(event)=>{
    if(event.dataTransfer.types.includes('application/x-mesa-combat-character')){
        event.preventDefault();
        event.dataTransfer.dropEffect='copy';
    }
};
window.soltarCandidatoCombateMestre_=async(event)=>{
    const id=event.dataTransfer.getData('application/x-mesa-combat-character');
    if(!id)return;
    event.preventDefault();
    selecionadosCombateMestre_.add(String(id));
    await adicionarIdsCombateMestre_([String(id)]);
};
async function adicionarIdsCombateMestre_(ids){
    let adicionados=0;
    for(const id of ids){
        if(obterParticipanteCombateMestre_(id))continue;
        const c=(userCharacters||[]).find(x=>String(x.id)===String(id));if(!c)continue;
        const u=obterUltimaIniciativaChar_(c);
        estadoCombateMestre.participantes.push({
            id:c.id,iniciativa:u?.total??null,iniciativaTimestamp:u?.timestamp||'',
            skillSelecionada:'',equipSelecionado:'',detalhesAbertos:false,ultimoResultado:'',alvoId:''
        });
        adicionados++;
    }
    if(adicionados){
        if(!estadoCombateMestre.ativo){
            estadoCombateMestre.rodada=1;estadoCombateMestre.ciclo=1;estadoCombateMestre.turnoIndex=0;
        }
        estadoCombateMestre.ativo=true;
        sincronizarIniciativasCombateMestre_(true);
        ids.forEach(id=>selecionadosCombateMestre_.delete(String(id)));
        await salvarEstadoCombateMestre_();
    }
    renderizarCombateMestre_();
    return adicionados;
}

function renderizarCandidatosCombateMestre_(){
    const alvo=document.getElementById('gmCombatCandidateList');
    if(!alvo)return;
    const ativos=new Set((estadoCombateMestre.participantes||[]).map(p=>p.id));
    const lista=[...(userCharacters||[])].filter(c=>!ativos.has(c.id));
    alvo.innerHTML=lista.length?lista.map(c=>{
        const img=c.imagem?`<img src="${escaparHtmlInventario_(c.imagem)}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;">`:'👤';
        return `<label draggable="true" ondragstart="iniciarArrastoCandidatoCombateMestre_(event,'${escaparHtmlInventario_(c.id)}')" style="display:grid;grid-template-columns:auto auto 1fr;gap:8px;align-items:center;padding:7px 8px;border-radius:8px;background:rgba(255,255,255,.035);cursor:grab;">
            <input type="checkbox" class="gm-combat-candidate" value="${escaparHtmlInventario_(c.id)}" ${selecionadosCombateMestre_.has(String(c.id))?'checked':''} onchange="alternarSelecaoCombateMestre_(\'${escaparHtmlInventario_(c.id)}\',this.checked)">
            <span>${img}</span><span><strong>${escaparHtmlInventario_(c.nome||'Sem Nome')}</strong><br><small style="color:#888;">${tipoPersonagemCombateMestre_(c)}</small></span>
        </label>`;
    }).join(''):'<div style="color:#888;">Todos os personagens já estão no combate.</div>';
}

function renderizarControlesDanoCombateMestre_(){
    const alvoSel=document.getElementById('gmCombatDamageTarget');
    const locSel=document.getElementById('gmCombatDamageLocation');
    if(alvoSel){
        alvoSel.innerHTML=(estadoCombateMestre.participantes||[]).map(p=>{
            const c=(userCharacters||[]).find(x=>x.id===p.id);
            return c?`<option value="${escaparHtmlInventario_(c.id)}">${escaparHtmlInventario_(c.nome||'')}</option>`:'';
        }).join('');
    }
    if(locSel){
        const locais=['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda'];
        locSel.innerHTML=locais.map(l=>`<option value="${l}">${traduzirLocalCorpo_(l)}</option>`).join('');
        locSel.disabled=modoCombateAtual_()==='simplificado';
    }
}

function renderizarHistoricoCombateMestre_(){
    const alvo=document.getElementById('gmCombatHistory');
    if(!alvo)return;
    const ids=new Set((estadoCombateMestre.participantes||[]).map(p=>p.id));
    const eventos=[];

    (userCharacters||[]).filter(c=>ids.has(c.id)).forEach(c=>{
        const hist=[...(c.historicoRolagens||[]),...(c.historicoRolagensGerais||[])];
        hist.forEach(r=>{
            const st=String(r.subtipo||'').toLowerCase();
            const tipo=String(r.tipo||'').toLowerCase();
            const ehCombate =
                st.includes('combate') || st==='iniciativa' || st==='dano' || st==='danoaplicadomestre' ||
                st==='localizacao' || st==='novoturno' || st==='municao' || st==='energia' ||
                tipo.includes('d100') || tipo.includes('dano') || tipo.includes('iniciativa') || tipo.includes('localiza');
            if(ehCombate)eventos.push({...r,__char:c});
        });
    });

    eventos.sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')));
    alvo.innerHTML=eventos.slice(0,150).map(r=>{
        const c=r.__char;
        let texto=r.texto||'';
        try{
            const fmt=formatarRegistroHistorico_(r,true);
            if(fmt)texto=fmt;
        }catch(_){}
        return `<div style="display:grid;grid-template-columns:80px minmax(120px,180px) 105px 1fr;gap:8px;align-items:start;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.065);">
            <span style="color:#777;font-size:.82em;">${formatarHoraHistoricoCombate_(r.timestamp)}</span>
            <strong style="color:#d8c7ff;">${escaparHtmlInventario_(c.nome||'')}</strong>
            <span style="color:#8feaff;font-size:.84em;">${escaparHtmlInventario_(r.tipo||'Combate')}</span>
            <span style="color:#ddd;">${escaparHtmlInventario_(texto)}</span>
        </div>`;
    }).join('')||'<div style="color:#888;padding:12px;">Ainda não há rolagens de combate destes participantes.</div>';
}


let edicaoCombateMestreAte_=0;

window.iniciarEdicaoCombateMestre_=()=>{
    edicaoCombateMestreAte_=Date.now()+15000;
};
window.finalizarEdicaoCombateMestre_=()=>{
    // pequena margem para o onchange terminar de salvar antes de permitir
    // que a sincronização automática reconstrua o cartão.
    edicaoCombateMestreAte_=Date.now()+700;
};
function estaEditandoSeletoresCombateMestre_(){
    const ativo=document.activeElement;
    const focoEmSelect=!!(ativo && ativo.matches?.('.gm-combat-live-select'));
    return focoEmSelect || Date.now()<edicaoCombateMestreAte_;
}

function renderizarCombateMestre_(){
    if(!(userData&&userData.role==='mestre'))return;
    garantirParticipantesValidosCombateMestre_();
    sincronizarIniciativasCombateMestre_(true);
    renderizarCandidatosCombateMestre_();
    renderizarControlesDanoCombateMestre_();

    const round=document.getElementById('gmCombatRound');
    const cycle=document.getElementById('gmCombatCycle');
    const status=document.getElementById('gmCombatStatus');
    const rows=document.getElementById('gmCombatParticipantRows');
    if(round)round.textContent=estadoCombateMestre.rodada||1;
    if(cycle)cycle.textContent=estadoCombateMestre.ciclo||1;

    const participantes=estadoCombateMestre.participantes||[];
    if(status){
        status.textContent=participantes.length
            ? `${participantes.length} participante(s) · arraste os cartões para ajustar a ordem manualmente.`
            : 'Nenhum participante.';
    }
    if(!rows)return;

    const turno=Number(estadoCombateMestre.turnoIndex||0);
    const cards=[];

    participantes.forEach((p,i)=>{
        const c=(userCharacters||[]).find(x=>x.id===p.id);
        if(!c){
            cards.push(`<div style="padding:12px;border-radius:10px;background:rgba(255,80,80,.08);border:1px solid rgba(255,80,80,.25);">
                Participante não encontrado: <code>${escaparHtmlInventario_(p.id||'')}</code>
            </div>`);
            return;
        }

        try{
            const pv=pvResumoCombateMestre_(c);
            const pa=paResumoCombateMestre_(c);
            const acoes=acoesResumoCombateMestre_(c);
            const ativo=i===turno;
            const ini=Number.isFinite(Number(p.iniciativa))?Number(p.iniciativa):'—';
            const skills=obterPericiasCombate_(c)||[];
            const skillValue=p.skillSelecionada && skills.some(x=>`${x.__especializacao?'esp':'per'}:${x.id}`===p.skillSelecionada)
                ? p.skillSelecionada
                : (skills[0]?`${skills[0].__especializacao?'esp':'per'}:${skills[0].id}`:'');
            p.skillSelecionada=skillValue;
            const pericia=obterPericiaCombateMestrePorValor_(skillValue);
            let equip=String(p.equipSelecionado||'');
            const equipValido = equip==='desarmado' || equip==='nenhum' || !!encontrarEquipamentoCombateChar_(c,equip);
            if(!equipValido) equip='';
            if(!equip){
                if(pericia?.id==='combate_desarmado') equip='desarmado';
                else if(pericia?.id==='esquiva') equip='nenhum';
                else{
                    const primeira=obterItensEquipados_(c)
                        .filter(itemEhArmaOuEscudo_)
                        .find(item=>equipamentoCompativelComPericia_(item,pericia));
                    if(primeira){
                        const ix=obterItensEquipados_(c).indexOf(primeira);
                        equip=String(primeira.instanciaId||primeira.instanceId||primeira.idInstancia||primeira.id||`equipado_${ix}`);
                    }
                }
                p.equipSelecionado=equip;
            }
            const equipamentos=equipamentosCombateChar_(c,pericia,equip);
            const detalheAberto=!!p.detalhesAbertos;
            const outros=(estadoCombateMestre.participantes||[]).filter(x=>x.id!==c.id);
            if(p.alvoId && !outros.some(x=>x.id===p.alvoId))p.alvoId='';
            if(!p.alvoId && outros.length)p.alvoId=outros[0].id;
            const alvoOpts=outros.map(x=>{const ac=(userCharacters||[]).find(z=>z.id===x.id);return `<option value="${x.id}" ${x.id===p.alvoId?'selected':''}>${escaparHtmlInventario_(ac?.nome||x.id)}</option>`;}).join('');
            const efeitoPend=c?.combate?.efeitoEspecialPendente;
            const confDef=c?.combate?.confrontoPendente;
            const ultima=p.ultimoResultado?`<div style="margin-top:8px;padding:7px 9px;border-radius:7px;background:rgba(0,0,0,.15);color:#ddd;font-size:.86em;">${escaparHtmlInventario_(p.ultimoResultado)}</div>`:'';
            const img=c.imagem
                ? `<img src="${escaparHtmlInventario_(c.imagem)}" alt="${escaparHtmlInventario_(c.nome||'')}" style="width:62px;height:62px;border-radius:50%;object-fit:cover;border:2px solid ${ativo?'#ffd166':'rgba(255,255,255,.18)'};">`
                : `<div style="width:62px;height:62px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);font-size:1.8em;border:2px solid ${ativo?'#ffd166':'rgba(255,255,255,.12)'};">👤</div>`;

            cards.push(`<div draggable="true" ondragstart="iniciarArrastoCombateMestre_('${c.id}')" ondragover="event.preventDefault()" ondrop="soltarArrastoCombateMestre_('${c.id}')"
                style="padding:13px 14px;border-radius:12px;background:${ativo?'rgba(255,193,7,.13)':'rgba(255,255,255,.045)'};border:1px solid ${ativo?'rgba(255,193,7,.52)':'rgba(255,255,255,.09)'};box-shadow:${ativo?'0 0 18px rgba(255,193,7,.09)':'none'};">
                <div style="display:grid;grid-template-columns:72px minmax(140px,.85fr) 62px 78px 65px 65px minmax(138px,.85fr) minmax(138px,.85fr) minmax(138px,.85fr);gap:10px;align-items:center;">
                    <div style="position:relative;">
                        ${img}
                        <span style="position:absolute;right:0;bottom:-2px;min-width:26px;height:26px;border-radius:13px;background:${ativo?'#e6a600':'#445'};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;">${ativo?'▶':i+1}</span>
                    </div>
                    <div>
                        <strong style="font-size:1.08em;color:#fff;">${escaparHtmlInventario_(c.nome||'Sem Nome')}</strong><br>
                        <small style="color:#888;">${tipoPersonagemCombateMestre_(c)} · ${escaparHtmlInventario_(traduzirNomeFadiga_(c?.combate?.fadiga||'Fresh'))}${estaCaidoCombate_(c)?' · <span style="color:#ffb36b;">CAÍDO</span>':''}</small>
                    </div>
                    <div><small style="color:#888;">INI</small><br><strong style="font-size:1.15em;color:#ffd166;">${ini}</strong></div>
                    <div><small style="color:#888;">PV</small><br><strong style="font-size:1.1em;">${pv.texto}</strong></div>
                    <div><small style="color:#888;">PA</small><br><strong style="font-size:1.1em;">${pa}</strong></div>
                    <div><small style="color:#888;">AÇ</small><br><strong style="font-size:1.1em;color:${acoes.atual<=0?'#ff8f8f':'#8ff0a8'};">${acoes.texto}</strong></div>
                    <div style="align-self:stretch;display:flex;flex-direction:column;justify-content:center;">
                        <small style="color:#888;display:block;min-height:18px;">P. Cmbt.</small>
                        <select class="gm-combat-live-select" style="margin-top:4px;width:100%;" onpointerdown="iniciarEdicaoCombateMestre_()" onfocus="iniciarEdicaoCombateMestre_()" onblur="finalizarEdicaoCombateMestre_()" onchange="mudarPericiaCombateMestre_('${c.id}',this.value)">${opcoesPericiasCombateMestre_(c,skillValue)}</select>
                    </div>
                    <div style="align-self:stretch;display:flex;flex-direction:column;justify-content:center;">
                        <small style="color:#888;display:block;min-height:18px;">Equipamento</small>
                        <select class="gm-combat-live-select" style="margin-top:4px;width:100%;" onpointerdown="iniciarEdicaoCombateMestre_()" onfocus="iniciarEdicaoCombateMestre_()" onblur="finalizarEdicaoCombateMestre_()" onchange="mudarEquipCombateMestre_('${c.id}',this.value)">${equipamentos}</select>
                    </div>
                    <div style="align-self:stretch;display:flex;flex-direction:column;justify-content:center;">
                        <small style="color:#888;display:block;min-height:18px;">Alvo</small>
                        <select class="gm-combat-live-select" style="margin-top:4px;width:100%;" onpointerdown="iniciarEdicaoCombateMestre_()" onfocus="iniciarEdicaoCombateMestre_()" onblur="finalizarEdicaoCombateMestre_()" onchange="mudarAlvoCombateMestre_('${c.id}',this.value)">${alvoOpts||'<option value="">—</option>'}</select>
                    </div>
                </div>
                ${resumoLocaisCompactoCombateMestre_(c)}
                ${confDef?.status==='aguardando_defesa'?`<div style="margin-top:9px;padding:9px;border-radius:8px;background:rgba(231,76,60,.10);border:1px solid rgba(231,76,60,.35);">⚔️ Reação pendente contra <strong>${escaparHtmlInventario_(confDef.atacanteNome||'ataque')}</strong> <button class="btn-small btn-select" onclick="responderDefesaMestre_('${c.id}',true)">🛡️ Defender</button> <button class="btn-small btn-delete" onclick="responderDefesaMestre_('${c.id}',false)">✋ Não defender</button></div>`:''}
                ${efeitoPend&&Number(efeitoPend.restantes||0)>0?`<div style="margin-top:9px;padding:9px;border-radius:8px;background:rgba(255,193,7,.10);border:1px solid rgba(255,193,7,.35);">⭐ <strong>${efeitoPend.restantes}</strong> Efeito(s) Especial(is) pendente(s)<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px;">${efeitosDisponiveisCombate_(efeitoPend).map(e=>`<button class="btn-small" onclick="escolherEfeitoEspecialMestre_('${c.id}','${e.id}')">${e.nome}</button>`).join('')}</div></div>`:''}

                <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;">
                    ${estaCaidoCombate_(c)?`<button class="btn-small" onclick="levantarCombateMestre_('${c.id}')">🧍 Levantar (1 AÇ)</button>`:''}
                    <button class="btn-small btn-select" onclick="rolarTesteCombateMestre_('${c.id}')">🎲 Teste D100</button>
                    <button class="btn-small btn-delete" onclick="rolarDanoCombateMestre_('${c.id}')">💥 Rolar dano</button>
                    <button class="btn-small" onclick="rolarIniciativaMestre_('${c.id}')">⚡ Iniciativa</button>
                    <button class="btn-small" onclick="alternarDetalhesCombateMestre_('${c.id}')">${detalheAberto?'▲':'▼'} PV/PA detalhados</button>
                    <button class="btn-small btn-delete" style="margin-left:auto;" onclick="removerParticipanteCombateMestre_('${c.id}')">✕ Remover</button>
                </div>
                ${ultima}
                ${detalheAberto?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);">${detalhesPVPACombateMestre_(c)}</div>`:''}
            </div>`);
        }catch(err){
            console.error('Erro ao renderizar participante do combate',c?.nome,c?.id,err);
            cards.push(`<div style="padding:12px;border-radius:10px;background:rgba(255,80,80,.08);border:1px solid rgba(255,80,80,.25);">
                <strong>${escaparHtmlInventario_(c.nome||'Personagem')}</strong>: erro ao montar painel de combate.
                <div style="color:#ffb3b3;font-size:.82em;margin-top:5px;">${escaparHtmlInventario_(err?.message||String(err||'Erro desconhecido'))}</div>
            </div>`);
        }
    });

    rows.innerHTML=cards.join('')||'<div style="padding:20px;border-radius:10px;background:rgba(255,255,255,.025);color:#888;">Adicione personagens ao combate pela coluna da esquerda.</div>';
    renderizarHistoricoCombateMestre_();
}
window.adicionarSelecionadosCombateMestre=async()=>{
    const idsSet=new Set(selecionadosCombateMestre_);
    document.querySelectorAll('.gm-combat-candidate:checked').forEach(x=>idsSet.add(String(x.value||'')));
    const ids=[...idsSet].filter(Boolean);
    if(!ids.length){notificar_('Selecione pelo menos um personagem.','aviso');return;}
    await adicionarIdsCombateMestre_(ids);
};

window.adicionarCenarioAtivoAoCombate=async()=>{
    const cenario=(cenariosDB||[]).find(c=>c.id===estadoCampanhaMestre?.cenarioId);
    const ids=(cenario?.personagensCena||[]).map(x=>x.id).filter(Boolean);
    if(!ids.length){alert('O cenário ativo não possui personagens vinculados.');return;}
    ids.forEach(id=>{
        if(!obterParticipanteCombateMestre_(id) && (userCharacters||[]).some(c=>c.id===id)){
            const c=userCharacters.find(x=>x.id===id),u=obterUltimaIniciativaChar_(c);
            estadoCombateMestre.participantes.push({id,iniciativa:u?.total??null,iniciativaTimestamp:u?.timestamp||'',skillSelecionada:'',equipSelecionado:'',detalhesAbertos:false,ultimoResultado:''});
        }
    });
    estadoCombateMestre.ativo=true;
    sincronizarIniciativasCombateMestre_(true);
    await salvarEstadoCombateMestre_();
    renderizarCombateMestre_();
};

window.removerParticipanteCombateMestre_=async(id)=>{
    const idx=estadoCombateMestre.participantes.findIndex(p=>p.id===id);
    if(idx<0)return;
    estadoCombateMestre.participantes.splice(idx,1);
    if(estadoCombateMestre.turnoIndex>=estadoCombateMestre.participantes.length)estadoCombateMestre.turnoIndex=0;
    await salvarEstadoCombateMestre_();
    renderizarCombateMestre_();
};

window.iniciarArrastoCombateMestre_=(id)=>{gmCombatDragId_=id;};
window.soltarArrastoCombateMestre_=async(destId)=>{
    if(!gmCombatDragId_||gmCombatDragId_===destId)return;
    const arr=estadoCombateMestre.participantes;
    const atualId=arr[estadoCombateMestre.turnoIndex]?.id||'';
    const de=arr.findIndex(p=>p.id===gmCombatDragId_),para=arr.findIndex(p=>p.id===destId);
    if(de<0||para<0)return;
    const [mov]=arr.splice(de,1);arr.splice(para,0,mov);
    const ix=arr.findIndex(p=>p.id===atualId);estadoCombateMestre.turnoIndex=ix>=0?ix:0;
    gmCombatDragId_='';
    await salvarEstadoCombateMestre_();
    renderizarCombateMestre_();
};

window.ordenarCombatePorIniciativaMestre=async()=>{
    const atualId=estadoCombateMestre.participantes[estadoCombateMestre.turnoIndex]?.id||'';
    estadoCombateMestre.participantes.sort((a,b)=>(Number.isFinite(Number(b.iniciativa))?Number(b.iniciativa):-9999)-(Number.isFinite(Number(a.iniciativa))?Number(a.iniciativa):-9999));
    const ix=estadoCombateMestre.participantes.findIndex(p=>p.id===atualId);estadoCombateMestre.turnoIndex=ix>=0?ix:0;
    await salvarEstadoCombateMestre_();renderizarCombateMestre_();
};

window.limparIniciativasCombateMestre=async()=>{
    estadoCombateMestre.participantes.forEach(p=>{p.iniciativa=null;p.iniciativaTimestamp='';});
    await salvarEstadoCombateMestre_();renderizarCombateMestre_();
};

window.proximoTurnoCombateMestre=async()=>{
    const pendente=(userCharacters||[]).some(c=>c?.combate?.confrontoPendente?.status==='aguardando_defesa'||c?.combate?.confrontoPendente?.status==='respondido'||Number(c?.combate?.efeitoEspecialPendente?.restantes||0)>0);
    if(pendente){alert('Resolva a defesa ou o Efeito Especial pendente antes de avançar.');return;}
    const n=estadoCombateMestre.participantes.length;if(!n)return;
    estadoCombateMestre.turnoIndex=(Number(estadoCombateMestre.turnoIndex||0)+1)%n;
    if(estadoCombateMestre.turnoIndex===0){
        estadoCombateMestre.ciclo=Math.max(1,Number(estadoCombateMestre.ciclo||1)+1);
    }
    estadoCombateMestre.ativo=true;
    await salvarEstadoCombateMestre_();
    renderizarCombateMestre_();
};

window.encerrarCombateMestre=async()=>{
    if(!confirm('Encerrar o combate atual? A lista de participantes será limpa.'))return;
    for(const p of [...(estadoCombateMestre.participantes||[])]){const c=(userCharacters||[]).find(x=>x.id===p.id);if(!c)continue;c.combate=c.combate||{};c.combate.sessaoMesa={ativo:false,participantes:[],rodada:1,ciclo:1,atualizadoEm:new Date().toISOString()};await setDoc(doc(db,'personagens',c.id),{'combate.sessaoMesa':c.combate.sessaoMesa},{merge:true});}
    estadoCombateMestre={ativo:false,rodada:1,ciclo:1,turnoIndex:0,participantes:[]};
    await salvarEstadoCombateMestre_();renderizarCombateMestre_();
};

window.atualizarCombateMestre=async()=>{
    await carregarPersonagens();
    const mudou=sincronizarIniciativasCombateMestre_(true);
    if(mudou)await salvarEstadoCombateMestre_();
    renderizarCombateMestre_();
};


window.mudarAlvoCombateMestre_=async(id,alvoId)=>{
    iniciarEdicaoCombateMestre_();
    const p=obterParticipanteCombateMestre_(id);if(!p)return;
    p.alvoId=String(alvoId||'');
    await salvarEstadoCombateMestre_();
    finalizarEdicaoCombateMestre_();
};
window.responderDefesaMestre_=async(id,defender)=>{
    const c=(userCharacters||[]).find(x=>x.id===id);if(!c)return;const conf=c?.combate?.confrontoPendente;if(!conf||conf.status!=='aguardando_defesa')return;
    let resposta={defendeu:false,grau:'Falha',timestamp:new Date().toISOString()};
    if(defender){
        const ac=garantirPontosAcaoCombate_(c);if(ac.atual<=0){alert('Sem AÇ para defender.');return;}
        const skills=obterPericiasCombate_(c)||[],per=skills.find(x=>x.id==='esquiva')||skills[0];if(!per)return;
        const base=obterValorRegistroPericia_(c,per.id,per.__especializacao),aj=aplicarDificuldadeEFadiga_(c,base,'padrao',0);
        somDado_();const roll=Math.floor(Math.random()*100)+1,r=classificarD100_(aj.valor,roll);
        resposta={defendeu:true,periciaId:per.id,grau:r.grau,rolagem:roll,valor:aj.valor,timestamp:new Date().toISOString()};
        c.combate.pontosAcaoAtuais=Math.max(0,ac.atual-1);
        await registrarHistoricoCombateCharMestre_(c,'Defesa',`${getNome(per)}: ${roll}/${aj.valor} → ${r.grau}`,{subtipo:'defesaCombate',periciaId:per.id,rolagem:roll,valorEfetivo:aj.valor,grau:r.grau});
    }
    c.combate.confrontoPendente={...conf,status:'respondido',resposta};await setDoc(doc(db,'personagens',c.id),{combate:c.combate},{merge:true});
    await resolverConfrontosRespondidosMestre_();renderizarCombateMestre_();
};
window.escolherEfeitoEspecialMestre_=async(id,tipo)=>{
    const c=(userCharacters||[]).find(x=>x.id===id);if(!c)return;const pend=c?.combate?.efeitoEspecialPendente;if(!pend||pend.restantes<=0)return;
    let detalhe='';if(tipo==='localizacao'){detalhe=normalizarLocalCorpo_(prompt('Localização','Peito')||'')||'';if(!detalhe)return;}
    pend.escolhas=[...(pend.escolhas||[]),{tipo,detalhe,timestamp:new Date().toISOString()}];pend.restantes=Math.max(0,Number(pend.restantes||0)-1);
    await setDoc(doc(db,'personagens',c.id),{'combate.efeitoEspecialPendente':pend},{merge:true});c.combate.efeitoEspecialPendente=pend;
    await aplicarEscolhasEfeitosMestre_();renderizarCombateMestre_();
};
window.mudarPericiaCombateMestre_=async(id,valor)=>{
    iniciarEdicaoCombateMestre_();
    const p=obterParticipanteCombateMestre_(id);if(!p)return;
    p.skillSelecionada=String(valor||'');
    p.equipSelecionado='';
    await salvarEstadoCombateMestre_();
    finalizarEdicaoCombateMestre_();
    renderizarCombateMestre_();
};
window.mudarEquipCombateMestre_=async(id,valor)=>{
    iniciarEdicaoCombateMestre_();
    const p=obterParticipanteCombateMestre_(id);if(!p)return;
    p.equipSelecionado=String(valor||'');
    await salvarEstadoCombateMestre_();
    finalizarEdicaoCombateMestre_();
};
window.alternarDetalhesCombateMestre_=(id)=>{
    const p=obterParticipanteCombateMestre_(id);if(!p)return;
    p.detalhesAbertos=!p.detalhesAbertos;renderizarCombateMestre_();
};

async function registrarHistoricoCombateCharMestre_(char,tipo,texto,dados={}){
    const registro={id:`gmroll_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,tipo,texto,timestamp:new Date().toISOString(),...dados};
    const atual=Array.isArray(char.historicoRolagens)?char.historicoRolagens:[];
    char.historicoRolagens=[registro,...atual].slice(0,50);
    await setDoc(doc(db,'personagens',char.id),{historicoRolagens:char.historicoRolagens},{merge:true});
    await registrarEventoMestreNoPersonagem_(char,tipo,texto,dados);
}

window.rolarIniciativaMestre_=async(id)=>{
    somDado_();
    const c=(userCharacters||[]).find(x=>x.id===id);if(!c)return;
    const regra=obterRegraFadiga_(c);
    if(regra.iniciativa===null){alert(`${c.nome}: nenhuma atividade possível por fadiga.`);return;}
    const intT=Number(c.atributos?.INT||10)+Number(c.bonus?.INT||0);
    const desT=Number(c.atributos?.DES||10)+Number(c.bonus?.DES||0);
    const base=Math.ceil((intT+desT)/2);
    const penalidade=Number(regra.iniciativa||0);
    const efetiva=Math.max(0,base+penalidade);
    const dado=Math.floor(Math.random()*10)+1,total=efetiva+dado;
    c.combate=c.combate||{};
    c.combate.ultimaIniciativa={total,dado,iniciativaBase:base,penalidadeFadiga:penalidade,iniciativaEfetiva:efetiva,timestamp:new Date().toISOString()};
    await setDoc(doc(db,'personagens',id),{combate:c.combate},{merge:true});
    await registrarHistoricoCombateCharMestre_(c,'Iniciativa',`1d10 [${dado}] + ${efetiva} = ${total}`,{subtipo:'iniciativa',dado,iniciativaBase:base,penalidadeFadiga:penalidade,iniciativaEfetiva:efetiva,total});
    const p=obterParticipanteCombateMestre_(id);if(p){p.iniciativa=total;p.iniciativaTimestamp=c.combate.ultimaIniciativa.timestamp;}
    await ordenarCombatePorIniciativaMestre();
};

window.rolarIniciativasFaltantesMestre=async()=>{
    for(const p of estadoCombateMestre.participantes){
        if(!Number.isFinite(Number(p.iniciativa))) await rolarIniciativaMestre_(p.id);
    }
    renderizarCombateMestre_();
};

window.rolarTesteCombateMestre_=async(id)=>{
    somDado_();
    const c=(userCharacters||[]).find(x=>x.id===id),p=obterParticipanteCombateMestre_(id);if(!c||!p)return;
    const pericia=obterPericiaCombateMestrePorValor_(p.skillSelecionada);
    if(!pericia)return;
    if(ataqueBloqueadoPorEfeito_(c)){p.ultimoResultado='Resolva o Efeito Especial pendente antes de outro teste.';renderizarCombateMestre_();return;}
    if(estaCaidoCombate_(c)&&periciaEhOfensiva_(pericia)){p.ultimoResultado='Está caído: gaste 1 AÇ para se levantar antes de atacar.';renderizarCombateMestre_();return;}
    if(periciaEhOfensiva_(pericia)&&!p.alvoId){p.ultimoResultado='Selecione um alvo antes de atacar.';renderizarCombateMestre_();return;}

    const acInfo=garantirPontosAcaoCombate_(c);
    if(acInfo.atual<=0){
        p.ultimoResultado='Sem AÇ restantes nesta rodada.';
        renderizarCombateMestre_();
        return;
    }

    // O select pode estar mostrando automaticamente a primeira arma compatível
    // mesmo antes de o onchange gravar p.equipSelecionado.
    if(!p.equipSelecionado){
        if(pericia.id==='combate_desarmado') p.equipSelecionado='desarmado';
        else if(pericia.id==='esquiva') p.equipSelecionado='nenhum';
        else{
            const primeira=obterItensEquipados_(c)
                .filter(itemEhArmaOuEscudo_)
                .find(i=>equipamentoCompativelComPericia_(i,pericia));
            if(primeira){
                const ix=obterItensEquipados_(c).indexOf(primeira);
                p.equipSelecionado=String(primeira.instanciaId||primeira.instanceId||primeira.idInstancia||primeira.id||`equipado_${ix}`);
            }
        }
    }

    const item=encontrarEquipamentoCombateChar_(c,p.equipSelecionado);
    if(!['esquiva','combate_desarmado'].includes(pericia.id) && !item){
        alert('Selecione equipamento compatível.');
        return;
    }
    if(item && itemUsaMunicao_(item)){
        const minimo=itemUsaEnergia_(item)?custoEnergiaDisparo_(item):1;
        if(cargaAtualArma_(item)<minimo){alert(`${getNome(item)} sem munição/energia suficiente.`);return;}
    }
    const base=obterValorRegistroPericia_(c,pericia.id,pericia.__especializacao);
    const graus=item?penalidadeCompatibilidadeArma_(pericia,item):0;
    const ajuste=aplicarDificuldadeEFadiga_(c,base,'padrao',graus);
    if(ajuste.bloqueado){p.ultimoResultado='Bloqueado por fadiga.';renderizarCombateMestre_();return;}
    const roll=Math.floor(Math.random()*100)+1,r=classificarD100_(ajuste.valor,roll),margem=Math.abs(ajuste.valor-roll);
    p.ultimoResultado=`${getNome(pericia)}: ${roll}/${ajuste.valor} → ${r.grau} · Margem ${margem}`;
    await registrarHistoricoCombateCharMestre_(c,'D100',p.ultimoResultado,{subtipo:'periciaCombate',periciaId:pericia.id,rolagem:roll,valorBase:base,valorEfetivo:ajuste.valor,grau:r.grau,margem,penalidadeCompatibilidade:graus,alvoId:p.alvoId||''});
    if(periciaEhOfensiva_(pericia)&&r.sucesso&&p.alvoId){
        await criarConfrontoPendenteMestre_(c,p,p.alvoId,{grau:r.grau,rolagem:roll,valor:ajuste.valor,periciaId:pericia.id},item);
        p.ultimoResultado+=` · aguardando defesa de ${(userCharacters||[]).find(x=>x.id===p.alvoId)?.nome||'alvo'}`;
    }

    if(item && itemUsaMunicao_(item)){
        if(itemUsaEnergia_(item)) consumirEnergiaDisparo_(item); else consumirMunicaoFisica_(item,1);
        await setDoc(doc(db,'personagens',id),{inventario:c.inventario},{merge:true});
    }
    c.combate=c.combate||{};
    const ac=garantirPontosAcaoCombate_(c);
    const atual=Math.max(0,Number(c.combate.pontosAcaoAtuais??ac.max)-1);
    c.combate.pontosAcaoAtuais=atual;
    await setDoc(doc(db,'personagens',id),{'combate.pontosAcaoAtuais':atual},{merge:true});
    await salvarEstadoCombateMestre_();

    if(!(await verificarFimRodadaPorAcoesMestre_())){
        renderizarCombateMestre_();
    }
};


function avaliarExpressaoDanoMestre_(expr){
    expr=String(expr||'').trim();
    if(!expr)return null;
    let total=0,detalhes=[];
    const termos=expr.replace(/\s+/g,'').match(/[+-]?[^+-]+/g)||[];
    for(const termoBruto of termos){
        let termo=termoBruto,sign=1;
        if(termo.startsWith('+'))termo=termo.slice(1);
        else if(termo.startsWith('-')){sign=-1;termo=termo.slice(1);}
        const m=termo.match(/^(\d*)d(\d+)$/i);
        if(m){
            const qtd=Math.max(1,Number(m[1]||1)),faces=Number(m[2]);
            const rols=Array.from({length:qtd},()=>Math.floor(Math.random()*faces)+1);
            const subtotal=rols.reduce((a,b)=>a+b,0);
            total+=sign*subtotal;
            detalhes.push(`${sign<0?'-':''}${qtd}d${faces} [${rols.join(', ')}]`);
        }else if(/^\d+$/.test(termo)){
            total+=sign*Number(termo);
            detalhes.push(`${sign<0?'-':''}${termo}`);
        }else{
            return null;
        }
    }
    return {total,detalhes};
}

window.rolarDanoCombateMestre_=async(id)=>{
    const c=(userCharacters||[]).find(x=>x.id===id);
    const p=obterParticipanteCombateMestre_(id);
    if(!c||!p)return;

    const pericia=obterPericiaCombateMestrePorValor_(p.skillSelecionada);

    if(!p.equipSelecionado){
        if(pericia?.id==='combate_desarmado') p.equipSelecionado='desarmado';
        else{
            const primeira=obterItensEquipados_(c)
                .filter(itemEhArmaOuEscudo_)
                .find(i=>equipamentoCompativelComPericia_(i,pericia));
            if(primeira){
                const ix=obterItensEquipados_(c).indexOf(primeira);
                p.equipSelecionado=String(primeira.instanciaId||primeira.instanceId||primeira.idInstancia||primeira.id||`equipado_${ix}`);
            }
        }
    }

    let expr='',nomeEquip='';

    if(pericia?.id==='combate_desarmado' || p.equipSelecionado==='desarmado'){
        expr='1d3';
        const forca=(c.atributos?.FOR||10)+(c.bonus?.FOR||0);
        const tam=(c.atributos?.TAM||10)+(c.bonus?.TAM||0);
        const mod=String(calcularModDano(forca,tam) || '').trim();
        if(mod && mod!=='0' && mod!=='+0') expr += mod.startsWith('-')||mod.startsWith('+') ? mod : `+${mod}`;
        nomeEquip='Punhos';
    }else{
        const item=encontrarEquipamentoCombateChar_(c,p.equipSelecionado);
        if(!item){alert('Selecione uma arma/equipamento para rolar dano.');return;}
        expr=String(item.dano||'').trim();
        nomeEquip=getNome(item);
        if(!expr){alert(`${nomeEquip} não possui fórmula de dano cadastrada.`);return;}
    }

    const r=avaliarExpressaoDanoMestre_(expr);
    if(!r){alert(`Não foi possível interpretar o dano: ${expr}`);return;}

    const itemSom=encontrarEquipamentoCombateChar_(c,p.equipSelecionado);
    tocarSomDano_(itemSom,nomeEquip);

    p.ultimoResultado=`${nomeEquip}: ${expr} → ${r.total} · ${r.detalhes.join(' · ')}`;
    const pen=obterPenetracaoArma_(itemSom),alvoSel=document.getElementById('gmCombatDamageTarget'),danoInp=document.getElementById('gmCombatDamageAmount'),penInp=document.getElementById('gmCombatDamagePenetration');
    if(alvoSel&&p.alvoId)alvoSel.value=p.alvoId;if(danoInp)danoInp.value=r.total;if(penInp)penInp.value=pen;
    const autoriz=c?.combate?.danoAutorizado;
    if(autoriz?.alvoId===p.alvoId){const locInp=document.getElementById('gmCombatDamageLocation');if(locInp&&autoriz.localEscolhido)locInp.value=autoriz.localEscolhido;if(penInp)penInp.value=autoriz.ignorarArmadura?9999:Number(autoriz.penetracao??pen);}
    await registrarHistoricoCombateCharMestre_(c,'Dano',p.ultimoResultado,{
        subtipo:'dano',equipamento:nomeEquip,expressao:expr,total:r.total,detalhes:r.detalhes
    });
    await salvarEstadoCombateMestre_();
    renderizarCombateMestre_();
};

window.editarPVCombateMestre_=async(id,local,valor)=>{
    const c=userCharacters.find(x=>x.id===id);if(!c)return;c.combate=c.combate||{};
    if(local==='global'){
        const max=calcularPVGlobalMax_(c);c.combate.pvGlobalAtual=Math.max(0,Math.min(max,Number(valor)||0));
    }else{
        const a=c.atributos||{},b=c.bonus||{},max=calcularHitLocations_(Number(a.CON||10)+Number(b.CON||0),Number(a.TAM||10)+Number(b.TAM||0));
        c.combate.hitLocations=c.combate.hitLocations||{};
        c.combate.hitLocations[local]=Math.max(0,Math.min(Number(max[local]||1),Number(valor)||0));
    }
    await setDoc(doc(db,'personagens',id),{combate:c.combate},{merge:true});
    await registrarEventoMestreNoPersonagem_(c,'Ficha',`PV alterado manualmente${local==='global'?'':` em ${local}`}.`,{subtipo:'pvManual',local,valor:Number(valor)||0});
    renderizarCombateMestre_();
};

window.editarPACombateMestre_=async(id,local,valor)=>{
    const c=userCharacters.find(x=>x.id===id);if(!c)return;c.combate=c.combate||{};
    if(local==='global')c.combate.armorGlobalManual=Math.max(0,Number(valor)||0);
    else{c.combate.armor=c.combate.armor||{};c.combate.armor[local]=Math.max(0,Number(valor)||0);}
    await setDoc(doc(db,'personagens',id),{combate:c.combate},{merge:true});
    await registrarEventoMestreNoPersonagem_(c,'Ficha',`PA manual alterado${local==='global'?'':` em ${local}`}.`,{subtipo:'paManual',local,valor:Number(valor)||0});
    renderizarCombateMestre_();
};

window.rolarLocalizacaoDanoMestre=()=>{
    const roll=Math.floor(Math.random()*20)+1;let local;
    if(roll<=3)local='Perna Direita';else if(roll<=6)local='Perna Esquerda';else if(roll<=9)local='Abdômen';else if(roll<=12)local='Peito';else if(roll<=15)local='Braço Direito';else if(roll<=18)local='Braço Esquerdo';else local='Cabeça';
    const sel=document.getElementById('gmCombatDamageLocation');if(sel&&!sel.disabled)sel.value=local;
    alert(`D20 ${roll} → ${local}`);
};

window.aplicarDanoCombateMestre=async()=>{
    const id=document.getElementById('gmCombatDamageTarget')?.value;
    const bruto=Math.max(0,Number(document.getElementById('gmCombatDamageAmount')?.value)||0);
    const c=userCharacters.find(x=>x.id===id);if(!c||bruto<=0)return;
    const local=document.getElementById('gmCombatDamageLocation')?.value||'Peito';
    const penetracao=Math.max(0,Number(document.getElementById('gmCombatDamagePenetration')?.value)||0);
    if(!confirm(`Aplicar ${bruto} de dano bruto em ${c.nome}${modoCombateAtual_()==='tatico'?` (${local})`:''}?\nPenetração: ${penetracao}`))return;
    c.combate=c.combate||{};
    let pa=0,paEfetivo=0,final=0;
    if(modoCombateAtual_()==='simplificado'){
        pa=Math.max(0,Number(c.combate.armorGlobalManual||0)+calcularPAGlobalEquipado_(c));
        paEfetivo=Math.max(0,pa-penetracao);
        final=Math.max(0,bruto-paEfetivo);
        const max=calcularPVGlobalMax_(c),atual=Number.isFinite(Number(c.combate.pvGlobalAtual))?Number(c.combate.pvGlobalAtual):max;
        c.combate.pvGlobalAtual=Math.max(0,atual-final);
    }else{
        const eq=calcularPAEquipado_(c,[local]);
        pa=Math.max(0,Number(c.combate?.armor?.[local]||0)+Number(eq?.[local]||0));
        paEfetivo=Math.max(0,pa-penetracao);
        final=Math.max(0,bruto-paEfetivo);
        const a=c.atributos||{},b=c.bonus||{},max=calcularHitLocations_(Number(a.CON||10)+Number(b.CON||0),Number(a.TAM||10)+Number(b.TAM||0));
        c.combate.hitLocations=c.combate.hitLocations||{};
        const atual=Number.isFinite(Number(c.combate.hitLocations[local]))?Number(c.combate.hitLocations[local]):Number(max[local]||1);
        c.combate.hitLocations[local]=Math.max(0,atual-final);
    }
    await setDoc(doc(db,'personagens',id),{combate:c.combate},{merge:true});
    await registrarHistoricoCombateCharMestre_(c,'Dano',`${bruto} bruto · PA ${pa} - Pen ${penetracao} = PA efetivo ${paEfetivo} → ${final}${modoCombateAtual_()==='tatico'?` em ${local}`:''}`,{subtipo:'danoAplicadoMestre',bruto,pa,penetracao,paEfetivo,total:final,local});
    renderizarCombateMestre_();
};


function renderizarEscudo() {
    const notas=document.getElementById('escudoViewMode');
    if(notas) notas.innerHTML = formatarMarkdown(escudoTexto);
    if(userData && userData.role==='mestre') {
        renderizarCampanhaMestre_();
        renderizarHistoricoMestre_();
        renderizarCombateMestre_();
    }
}

function formatarMarkdown(texto) {
    return texto
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\n/gim, '<br>');
}

window.editarRegras = () => {
    if (userData.role !== 'mestre') { alert('Apenas o mestre!'); return; }
    regrasTexto = idiomaAtual === 'en' ? regrasTextoEN : idiomaAtual === 'zh' ? regrasTextoZH : regrasTextoPT;
    document.getElementById('regrasTexto').value = regrasTexto;
    document.getElementById('regrasViewMode').classList.add('hidden');
    document.getElementById('regrasEditMode').classList.remove('hidden');
    document.getElementById('btnEditarRegras').classList.add('hidden');
    document.getElementById('btnSalvarRegras').classList.remove('hidden');
    document.getElementById('btnCancelarRegras').classList.remove('hidden');
};

window.salvarRegras = async () => {
    regrasTexto = document.getElementById('regrasTexto').value;
    if (idiomaAtual === 'en') regrasTextoEN = regrasTexto;
    else if (idiomaAtual === 'zh') regrasTextoZH = regrasTexto;
    else regrasTextoPT = regrasTexto;
    await setDoc(doc(db, "configuracoes", "regras"), {
        texto: regrasTextoPT, texto_pt: regrasTextoPT, texto_en: regrasTextoEN || REGRAS_PADRAO_EN, texto_zh: regrasTextoZH || REGRAS_PADRAO_ZH
    }, { merge:true });
    renderizarRegras();
    document.getElementById('regrasViewMode').classList.remove('hidden');
    document.getElementById('regrasEditMode').classList.add('hidden');
    document.getElementById('btnEditarRegras').classList.remove('hidden');
    document.getElementById('btnSalvarRegras').classList.add('hidden');
    document.getElementById('btnCancelarRegras').classList.add('hidden');
    alert('Regras salvas!');
};

window.cancelarEdicaoRegras = () => {
    document.getElementById('regrasViewMode').classList.remove('hidden');
    document.getElementById('regrasEditMode').classList.add('hidden');
    document.getElementById('btnEditarRegras').classList.remove('hidden');
    document.getElementById('btnSalvarRegras').classList.add('hidden');
    document.getElementById('btnCancelarRegras').classList.add('hidden');
};

window.editarEscudo = () => {
    document.getElementById('escudoTexto').value = escudoTexto;
    document.getElementById('escudoViewMode').classList.add('hidden');
    document.getElementById('escudoEditMode').classList.remove('hidden');
    document.getElementById('btnEditarEscudo').classList.add('hidden');
    document.getElementById('btnSalvarEscudo').classList.remove('hidden');
    document.getElementById('btnCancelarEscudo').classList.remove('hidden');
};

window.salvarEscudo = async () => {
    escudoTexto = document.getElementById('escudoTexto').value;
    await setDoc(doc(db, "configuracoes", "escudoMestre"), { texto: escudoTexto }, { merge:true });
    renderizarEscudo();
    document.getElementById('escudoViewMode').classList.remove('hidden');
    document.getElementById('escudoEditMode').classList.add('hidden');
    document.getElementById('btnEditarEscudo').classList.remove('hidden');
    document.getElementById('btnSalvarEscudo').classList.add('hidden');
    document.getElementById('btnCancelarEscudo').classList.add('hidden');
    alert('Escudo salvo!');
};

window.cancelarEdicaoEscudo = () => {
    document.getElementById('escudoViewMode').classList.remove('hidden');
    document.getElementById('escudoEditMode').classList.add('hidden');
    document.getElementById('btnEditarEscudo').classList.remove('hidden');
    document.getElementById('btnSalvarEscudo').classList.add('hidden');
    document.getElementById('btnCancelarEscudo').classList.add('hidden');
};

