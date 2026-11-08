// ============================================================
// EXP-ATUAR-CAMERA-6
// Autoridade da conta separada do ator efetivo da Mesa.
// - Mestre fora do combate: escolhe Mestre/PM/PJ/NPC/Monstro em "Atuar como".
// - Em combate: PM/NPC/Monstro do mestre seguem automaticamente a iniciativa;
//   PJ de outra conta continua sob controle do jogador.
// - Movimento de exploração: por arrasto, limitado a movimento por AÇ × AÇ máximas.
// - Câmera segue o ator; modo Mestre mantém rolagem manual pelas barras.
// - Jogadores usam sempre 48 px/m.
// - Jogadores carregam por referência o mesmo mapa salvo do mestre.
// ============================================================

const LAB_ATUAR_MESTRE_E6='__mestre__';
let labMapaRemotoSigE6_='';
let labCameraUltimoAtorE6_='';
const labCameraUltimaPosE6_=new Map();

function labGrupoTokenE6_(t){
    if(!t||String(t.id||'').startsWith('dummy:'))return null;
    const tipo=normalizarTextoCombate_(String(t.tipo||t.charLab?.tipo||''));
    if(t.criaturaBancoId||t.charLab?.criaturaBancoId||/criatura|monstro/.test(tipo))return 'Monstro';
    if(t.npcBancoId||t.charLab?.npcBancoId||tipo==='npc'||tipo==='npc rapido'||tipo==='npc_rapido')return 'NPC';
    const dono=String(t.donoUid||t.charLab?.donoUid||t.charLab?.dono||'');
    return dono&&String(dono)===String(currentUserUid||'')?'PM':'PJ';
}
function labGrupoOrdemE6_(g){return ({PM:0,PJ:1,NPC:2,Monstro:3})[g]??99;}
function labAtuarComoValorE6_(){
    let v=String(labEstado_.atuarComoE6||LAB_ATUAR_MESTRE_E6);
    if(v!==LAB_ATUAR_MESTRE_E6&&!labTokenPorId_(v))v=LAB_ATUAR_MESTRE_E6;
    return v;
}
function labMestreControlaTurnoE6_(t){
    if(!batalhaEhMestre_()||!t)return false;
    return ['PM','NPC','Monstro'].includes(labGrupoTokenE6_(t));
}
function labAtorEfetivoE6_(){
    // v206: na aba "diretor" (mestre vendo como jogador) o ator é sempre o token escolhido
    const dirTok=window.mesaDiretorV206_?labTokenPorId_(window.mesaDiretorV206_):null;
    if(dirTok)return dirTok;
    if(labEstado_.fase==='combate'){
        const atual=labTokenAtual_();
        if(!atual)return null;
        if(batalhaEhMestre_())return labMestreControlaTurnoE6_(atual)?atual:null;
        return labPodeVerDetalhesToken_(atual)?atual:null;
    }

    if(batalhaEhMestre_()){
        const v=labAtuarComoValorE6_();
        if(v===LAB_ATUAR_MESTRE_E6)return null;
        return labTokenPorId_(v);
    }

    const uid=String(currentUserUid||currentUser?.uid||'');
    const meus=(labEstado_.tokens||[]).filter(t=>uid&&String(t.donoUid||'')===uid);
    if(!meus.length)return null;
    const sid=String(labEstado_.selecionadoId||'');
    return meus.find(t=>String(t.id)===sid)
        || meus.find(t=>String(t.origemId||t.id)===String(currentCharId||''))
        || meus[0];
}
function labModoMestreE6_(){
    return batalhaEhMestre_()&&labEstado_.fase!=='combate'&&labAtuarComoValorE6_()===LAB_ATUAR_MESTRE_E6;
}
function labCameraAtorE6_(){
    if(batalhaEhMestre_()){
        if(labModoMestreE6_())return null;
        if(labEstado_.fase==='combate')return labTokenAtual_();
        return labAtorEfetivoE6_();
    }
    return labAtorEfetivoE6_();
}

// A antiga permissão "mestre controla tudo" deixa de definir ações.
// A conta continua mestre administrativamente, mas o ator efetivo é quem age.
const labPodeControlarTokenE6Base_=labPodeControlarToken_;
labPodeControlarToken_=function(t){
    if(!t)return false;
    if(!batalhaEhMestre_()){
        // v206: a aba diretor controla o próprio token fora de combate; o combate continua
        // sendo conduzido na janela do mestre (turnos de lá não mudam).
        if(window.mesaDiretorV206_&&labEstado_.fase!=='combate'&&String(t.id)===String(window.mesaDiretorV206_))return true;
        return labPodeControlarTokenE6Base_(t);
    }

    if(labEstado_.fase==='combate'){
        const atual=labTokenAtual_();
        return !!atual
            && String(atual.id)===String(t.id)
            && labMestreControlaTurnoE6_(atual);
    }

    const ator=labAtorEfetivoE6_();
    return !!ator&&String(ator.id)===String(t.id);
};

// A exploração passa a usar explicitamente o ator escolhido.
labAtorInteracaoE4_=labAtorEfetivoE6_;

// O velho toggle Controlar PJ fica definitivamente obsoleto.
labEstado_.mestreControlaPJLab=true;
window.labMestreControlaPJToggle760_=function(){labEstado_.mestreControlaPJLab=true;};
function labRemoverControlePjE6_(){
    const old=document.getElementById('labMasterPJWrap760');
    if(old)old.remove();
}

// ------------------------------------------------------------
// Seletor "Atuar como"
// ------------------------------------------------------------
function labInstalarAtuarComoE6_(){
    if(!batalhaEhMestre_())return;
    labRemoverControlePjE6_();
    const free=document.getElementById('labFreeEntryWrap530');
    if(!free)return;

    let wrap=document.getElementById('labActAsWrapE6');
    if(!wrap){
        wrap=document.createElement('label');
        wrap.id='labActAsWrapE6';
        wrap.innerHTML='<span>🎭 Atuar como</span><select id="labActAsE6" onchange="labAtuarComoE6_(this.value)"></select>';
        free.insertAdjacentElement('afterend',wrap);
    }

    const quick=document.getElementById('labQuickTools760');
    if(quick&&wrap.nextElementSibling!==quick)wrap.insertAdjacentElement('afterend',quick);
}
function labAtualizarAtuarComoE6_(){
    if(!batalhaEhMestre_()){
        document.getElementById('labActAsWrapE6')?.remove();
        labRemoverControlePjE6_();
        return;
    }
    labInstalarAtuarComoE6_();
    const wrap=document.getElementById('labActAsWrapE6'),sel=document.getElementById('labActAsE6');
    if(!wrap||!sel)return;

    if(labEstado_.fase==='combate'){
        const t=labTokenAtual_(),g=labGrupoTokenE6_(t);
        const texto=t
            ? `${g||'Participante'} · ${t.nome||'Sem nome'}${g==='PJ'?' · jogador':' · automático'}`
            : '— sem participante —';
        sel.innerHTML=`<option value="">${escaparHtmlInventario_(texto)}</option>`;
        sel.disabled=true;
        wrap.classList.add('is-auto');
        wrap.title='Durante o combate, o ator do mestre segue automaticamente a iniciativa. PJ pertencentes a outra conta continuam sob controle do jogador.';
        return;
    }

    wrap.classList.remove('is-auto');
    wrap.title='Mestre: posicionamento e administração. Escolher um personagem limita o controle a ele e habilita suas interações.';
    sel.disabled=false;

    const grupos={PM:[],PJ:[],NPC:[],Monstro:[]};
    for(const t of (labEstado_.tokens||[])){
        const g=labGrupoTokenE6_(t);
        if(g&&grupos[g])grupos[g].push(t);
    }
    for(const g of Object.keys(grupos)){
        grupos[g].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'}));
    }

    const atual=labAtuarComoValorE6_();
    sel.innerHTML=`<option value="${LAB_ATUAR_MESTRE_E6}">👑 Mestre</option>`
        + ['PM','PJ','NPC','Monstro'].filter(g=>grupos[g].length).map(g=>{
            const label=g==='Monstro'?'Monstros':g;
            return `<optgroup label="${label}">${grupos[g].map(t=>`<option value="${escaparHtmlInventario_(String(t.id))}">${escaparHtmlInventario_(t.nome||'Sem nome')}</option>`).join('')}</optgroup>`;
        }).join('');

    sel.value=[...sel.options].some(o=>o.value===atual)?atual:LAB_ATUAR_MESTRE_E6;
    if(sel.value!==atual)labEstado_.atuarComoE6=sel.value;
}
window.labAtuarComoE6_=function(v){
    if(!batalhaEhMestre_()||labEstado_.fase==='combate')return;
    const valor=String(v||LAB_ATUAR_MESTRE_E6);
    labEstado_.atuarComoE6=valor;
    labEstado_.exploracaoAtorId=valor===LAB_ATUAR_MESTRE_E6?'':valor;
    labEstado_.objetoSelecionadoId='';
    if(valor===LAB_ATUAR_MESTRE_E6){
        labEstado_.selecionadoId='';
    }else{
        const t=labTokenPorId_(valor);
        labEstado_.selecionadoId=t?String(t.id):'';
    }
    labSalvarLocal_();
    labRender_();
};

// Início/fim do combate preserva a escolha de exploração e passa ao modo automático.
const labIniciarCombateE6Base_=window.labIniciarCombate_;
window.labIniciarCombate_=function(){
    if(labEstado_.fase!=='combate')labEstado_.atuarComoAntesCombateE6=labAtuarComoValorE6_();
    const r=labIniciarCombateE6Base_.apply(this,arguments);
    if(labEstado_.fase==='combate')labAtualizarAtuarComoE6_();
    return r;
};
const labVoltarPreparacaoE6Base_=window.labVoltarPreparacao_;
window.labVoltarPreparacao_=function(){
    const r=labVoltarPreparacaoE6Base_.apply(this,arguments);
    if(labEstado_.fase!=='combate'){
        const antigo=String(labEstado_.atuarComoAntesCombateE6||LAB_ATUAR_MESTRE_E6);
        labEstado_.atuarComoE6=(antigo===LAB_ATUAR_MESTRE_E6||labTokenPorId_(antigo))?antigo:LAB_ATUAR_MESTRE_E6;
        labEstado_.exploracaoAtorId=labEstado_.atuarComoE6===LAB_ATUAR_MESTRE_E6?'':labEstado_.atuarComoE6;
        labSalvarLocal_();
        labAtualizarAtuarComoE6_();
    }
    return r;
};

// ------------------------------------------------------------
// Movimento de exploração: limite por arrasto = movimento/AÇ × AÇ máximas.
// ------------------------------------------------------------
function labMovimentoExploracaoMaxE6_(t){
    if(!t)return 0;
    const porAcao=Math.max(0,Number(labMovimentoPorAcao_(t)||0));
    const acoes=Math.max(0,Number(t.acoesMaxLab||0));
    return porAcao*Math.max(1,acoes);
}
function labClampMovimentoE6_(origem,x,y,maxM){
    let nx=Number(x),ny=Number(y);
    const dx=nx-origem.x,dy=ny-origem.y,dist=Math.hypot(dx,dy);
    if(Number.isFinite(maxM)&&maxM>=0&&dist>maxM&&dist>0){
        const f=maxM/dist;
        nx=origem.x+dx*f;ny=origem.y+dy*f;
    }
    return {
        x:Math.max(0,Math.min(labEstado_.larguraM,nx)),
        y:Math.max(0,Math.min(labEstado_.alturaM,ny))
    };
}

// ------------------------------------------------------------
// Câmera: ao cruzar a metade do viewport na direção do movimento,
// o mapa rola junto. Modo Mestre nunca recebe câmera automática.
// ------------------------------------------------------------
function labCameraSeguirE6_(t,forcarCentro=false){
    const vp=document.getElementById('labMapViewport'),map=document.getElementById('labMetricMap');
    if(!vp||!map||!t)return;
    if(batalhaEhMestre_()&&labModoMestreE6_())return;

    const ppm=Number(labEstado_.pxPorMetro||48);
    const id=String(t.id||'');
    const last=labCameraUltimaPosE6_.get(id);
    const novo={x:Number(t.x||0),y:Number(t.y||0)};
    const trocou=labCameraUltimoAtorE6_!==id;
    const cx=novo.x*ppm,cy=novo.y*ppm;
    const sx=cx-vp.scrollLeft,sy=cy-vp.scrollTop;
    const meioX=Math.max(1,vp.clientWidth/2),meioY=Math.max(1,vp.clientHeight/2);

    let left=vp.scrollLeft,top=vp.scrollTop;
    if(forcarCentro||trocou||!last){
        left=cx-meioX;top=cy-meioY;
    }else{
        const dx=novo.x-last.x,dy=novo.y-last.y;
        if(dx>0.0005&&sx>meioX)left+=sx-meioX;
        else if(dx<-.0005&&sx<meioX)left-=meioX-sx;
        if(dy>0.0005&&sy>meioY)top+=sy-meioY;
        else if(dy<-.0005&&sy<meioY)top-=meioY-sy;
    }

    const maxLeft=Math.max(0,vp.scrollWidth-vp.clientWidth);
    const maxTop=Math.max(0,vp.scrollHeight-vp.clientHeight);
    vp.scrollLeft=Math.max(0,Math.min(maxLeft,left));
    vp.scrollTop=Math.max(0,Math.min(maxTop,top));
    labCameraUltimaPosE6_.set(id,novo);
    labCameraUltimoAtorE6_=id;
}
function labCameraAtualizarE6_(){
    const t=labCameraAtorE6_();
    if(!t){labCameraUltimoAtorE6_='';return;}
    requestAnimationFrame(()=>labCameraSeguirE6_(t,false));
}
function labCameraDuranteDragE6_(t){
    if(!t)return;
    let raf=0;
    const mover=()=>{
        if(raf)return;
        raf=requestAnimationFrame(()=>{raf=0;labCameraSeguirE6_(t,false);});
    };
    const fim=()=>{
        window.removeEventListener('pointermove',mover);
        if(raf)cancelAnimationFrame(raf);
        requestAnimationFrame(()=>labCameraSeguirE6_(t,false));
    };
    window.addEventListener('pointermove',mover,{passive:true});
    window.addEventListener('pointerup',fim,{once:true});
}

function labArrastarExploracaoE6_(ev,t){
    if(!t||ev.button===2)return;
    ev.preventDefault();ev.stopPropagation();

    const map=document.getElementById('labMetricMap');
    if(!map)return;
    const origem={x:Number(t.x||0),y:Number(t.y||0)};
    const maxM=labMovimentoExploracaoMaxE6_(t);
    if(maxM<=0){
        notificar_(`${t.nome} não possui deslocamento disponível.`,'aviso',2600);
        return;
    }

    labEstado_.selecionadoId=String(t.id);
    labEstado_.objetoSelecionadoId='';
    const rect=map.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48);
    const node=map.querySelector(`.lab-token[data-id="${CSS.escape(String(t.id))}"]`);
    const d=node?node.offsetWidth:Math.max(24,Number(t.diametroM||.9)*ppm);
    let raf=0,pendente=null;

    const aplicar=()=>{
        raf=0;if(!pendente)return;
        const q=pendente;pendente=null;
        const alvo=labClampMovimentoE6_(origem,(q.x-rect.left)/ppm,(q.y-rect.top)/ppm,maxM);
        t.x=alvo.x;t.y=alvo.y;
        if(node){node.style.left=`${t.x*ppm-d/2}px`;node.style.top=`${t.y*ppm-d/2}px`;}
        labCameraSeguirE6_(t,false);
    };
    const move=e=>{pendente={x:e.clientX,y:e.clientY};if(!raf)raf=requestAnimationFrame(aplicar);};
    const up=()=>{
        window.removeEventListener('pointermove',move);
        if(pendente){if(raf){cancelAnimationFrame(raf);raf=0;}aplicar();}
        const dx=t.x-origem.x,dy=t.y-origem.y,dist=Math.hypot(dx,dy);
        if(dist>.08){let deg=Math.atan2(dx,-dy)*180/Math.PI;if(deg<0)deg+=360;t.angulo=Math.round(deg);}

        labEnviarComandoJogador_('movimento',{x:t.x,y:t.y},t);
    };
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerup',up,{once:true});
}

// Mestre em modo Mestre posiciona livremente; como personagem respeita a ficha.
// Em combate, a iniciativa determina automaticamente quem o mestre controla.
window.labPointerDown_=function(ev,id){
    const t=labTokenPorId_(id);if(!t)return;
    const combate=labEstado_.fase==='combate';

    if(batalhaEhMestre_()){
        if(!combate&&labModoMestreE6_())return labArrastarLivreMestreE4_(ev,id,false);

        if(!combate){
            const ator=labAtorEfetivoE6_();
            if(ator&&String(ator.id)===String(t.id))return labArrastarExploracaoE6_(ev,t);
            ev.preventDefault();ev.stopPropagation();
            labEstado_.selecionadoId=String(t.id);labEstado_.objetoSelecionadoId='';
            labSalvarLocal_();labRender_();return;
        }

        const atual=labTokenAtual_();
        if(!atual||String(atual.id)!==String(t.id)||!labMestreControlaTurnoE6_(atual)){
            ev.preventDefault();ev.stopPropagation();
            labEstado_.selecionadoId=String(t.id);labEstado_.objetoSelecionadoId='';
            labRender_();return;
        }

        const r=labPointerDownE4Base_.apply(this,arguments);
        labCameraDuranteDragE6_(t);
        return r;
    }

    if(!combate){
        const ator=labAtorEfetivoE6_();
        if(ator&&String(ator.id)===String(t.id))return labArrastarExploracaoE6_(ev,t);
        ev.preventDefault();ev.stopPropagation();
        labEstado_.selecionadoId=String(t.id);labEstado_.objetoSelecionadoId='';
        labRender_();return;
    }

    const r=labPointerDownE4Base_.apply(this,arguments);
    if(labPodeControlarToken_(t))labCameraDuranteDragE6_(t);
    return r;
};

// Objetos são arrastáveis diretamente apenas no modo Mestre fora do combate.
// Como personagem, clicar no objeto é seleção/interação, não reposicionamento administrativo.
window.labObjetoPointerDown_=function(ev,id){
    if(batalhaEhMestre_()&&labEstado_.fase!=='combate'&&labModoMestreE6_())return labArrastarLivreMestreE4_(ev,id,true);
    ev.preventDefault();ev.stopPropagation();
    labSelecionarObjeto_(id);
};

// O ator escolhido não muda só porque o mestre clicou em outro token.
const labSelecionarE6Base_=window.labSelecionar_;
window.labSelecionar_=function(id){
    if(batalhaEhMestre_()&&labEstado_.fase!=='combate'){
        const t=labTokenPorId_(id);
        labEstado_.selecionadoId=t?String(t.id):'';
        labEstado_.objetoSelecionadoId='';
        labSalvarLocal_();labRender_();return;
    }
    return labSelecionarE6Base_.apply(this,arguments);
};

// Objetos em exploração: Material define a ação existente;
// a ferramenta é validada ao executar, não ao decidir se o botão aparece.
labObjetoMicroPainelHtml_=function(o,ppm){
    if(!o||o.destruido||String(labEstado_.objetoSelecionadoId||'')!==String(o.id))return '';
    const combate=labEstado_.fase==='combate',ator=labAtorEfetivoE6_();
    if(!ator||!labPodeControlarToken_(ator))return '';
    if(combate&&Number(ator.acoesAtuaisLab||0)<=0)return '';

    const nat=labObjetoNatureza_(o),
          ext=labEquipadoRegex_(ator,/extintor|extinguisher|灭火器/),
          perMineracao=labPericiaRegex_(ator,/mineracao|mineração|mining/),
          psis=combate?labPsiPoderesParaAlvo_(ator,o):[];

    const meiaH=Math.max(18,Number(o.alturaM||1)*ppm)/2,
          posMicro=labMicroPosicaoVertical_(o.y*ppm,meiaH,ppm,48),
          top=posMicro.top,left=o.x*ppm,oid=String(o.id).replace(/'/g,"\\'"),
          bs='min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;';

    const botoes=[];

    if(combate){
        if(o.destrutivel!==false)botoes.push(`<button class="btn-small btn-select" onclick="labAtacarObjetoContextual_('${oid}')" style="${bs}">⚔️ Atacar</button>`);
        botoes.push(`<button class="btn-small" onclick="labObjetoAcao_('mover','${oid}')" style="${bs}">💪 Mover</button>`);
        for(const p of psis)botoes.push(`<button class="btn-small lab-psi-action" onclick="${p.id==='mover_objeto'?`labUsarPsiContextualRapido_('${String(p.id).replace(/'/g,"\\'")}','${oid}')`:`labAbrirPsiContextual_('${String(p.id).replace(/'/g,"\\'")}','${oid}')`}" style="${bs}">🔮 ${escaparHtmlInventario_(getNome(p))}</button>`);
    }else{
        botoes.push(`<button class="btn-small" onclick="labObjetoAcao_('mover','${oid}')" style="${bs}">💪 Mover</button>`);

        if(nat==='rocha'){
            if(perMineracao){
                botoes.push(`<button class="btn-small btn-select" onclick="labObjetoAcao_('minerar_forca','${oid}')" title="Minerar com Força Bruta" style="${bs}">⛏️ Força</button>`);
                botoes.push(`<button class="btn-small" onclick="labObjetoAcao_('minerar_pericia','${oid}')" title="Minerar com a perícia Mineração" style="${bs}">⛏️ Mineração</button>`);
            }else{
                botoes.push(`<button class="btn-small btn-select" onclick="labObjetoAcao_('minerar_forca','${oid}')" title="Requer picareta equipada" style="${bs}">⛏️ Minerar</button>`);
            }
        }

        if(nat==='arvore')botoes.push(`<button class="btn-small btn-select" onclick="labObjetoAcao_('cortar','${oid}')" title="Requer machado equipado" style="${bs}">🪓 Lenhar</button>`);
    }

    if(o.pegandoFogoLab)botoes.push(`<button class="btn-small" onclick="labObjetoAcao_('extinguir','${oid}')" title="${ext?'Usar extintor':'Requer extintor equipado'}" style="${bs}">🧯 Apagar</button>`);
    if(!botoes.length)return '';

    return `<div class="lab-micro-actions" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" style="position:absolute;left:${left}px;top:${top}px;transform:${posMicro.transform};z-index:28;padding:3px;border-radius:7px;background:rgba(10,13,30,.96);border:1px solid rgba(126,231,255,.45);display:flex;gap:2px;align-items:center;justify-content:center;flex-wrap:wrap;max-width:300px;">${botoes.join('')}</div>`;
};

// O mestre, quando está agindo como personagem, não recebe o painel administrativo
// de dano/restauração/remoção do objeto. Vê apenas a informação.
const labRenderObjetoPainelE6Base_=window.labRenderObjetoPainel_;
window.labRenderObjetoPainel_=function(){
    const e=document.getElementById('labObjetoPainel');
    const o=labObjetoPorId_(labEstado_.objetoSelecionadoId);

    if(!batalhaEhMestre_() || labModoMestreE6_()){
        return labRenderObjetoPainelE6Base_.apply(this,arguments);
    }

    if(!e)return;
    e.style.display='flex';
    if(!o){e.innerHTML='';return;}

    const ator=labAtorEfetivoE6_();
    const modelo=labObjetoModelo_(o);
    const material=String(o?.material||modelo?.material||'').trim()||'—';
    const nat=labObjetoNatureza_(o);
    const oid=String(o.id).replace(/'/g,"\\'");
    const combate=labEstado_.fase==='combate';
    let acoes='';

    if(ator){
        if(!combate){
            acoes+=`<button class="btn-small" onclick="labObjetoAcao_('mover','${oid}')">💪 Mover</button>`;
            if(nat==='rocha')acoes+=`<button class="btn-small btn-select" onclick="labObjetoAcao_('minerar','${oid}')" title="A ferramenta é verificada ao executar">⛏️ Minerar</button>`;
            if(nat==='arvore')acoes+=`<button class="btn-small btn-select" onclick="labObjetoAcao_('cortar','${oid}')" title="A ferramenta é verificada ao executar">🪓 Lenhar</button>`;
            if(o.pegandoFogoLab)acoes+=`<button class="btn-small" onclick="labObjetoAcao_('extinguir','${oid}')">🧯 Apagar fogo</button>`;
        }else{
            acoes+=`<span style="color:#9fc6d8">As ações de combate aparecem junto ao mapa.</span>`;
        }
    }else{
        acoes+=`<span style="color:#ffd18b">🎭 Atuar como Mestre: escolha um personagem para usar perícias.</span>`;
    }

    e.innerHTML=`
      <strong>${escaparHtmlInventario_(o.nome||'Objeto')}</strong>
      <span>PV <b>${Math.max(0,Number(o.pvAtual??o.pvMax??0))}/${Math.max(0,Number(o.pvMax??0))}</b></span>
      <span>Dureza <b>${Math.max(0,Number(o.dureza||0))}</b></span>
      <span>Peso <b>${Math.max(0,Number(o.pesoKg||0)).toFixed(1)} kg</b></span>
      <span>Material <b>${escaparHtmlInventario_(material)}</b></span>
      ${ator?`<span style="color:#9fdfff">Ator <b>${escaparHtmlInventario_(ator.nome||'—')}</b></span>`:''}
      ${acoes}`;
};

// ------------------------------------------------------------
// Ações de combate do mestre: PJ de outra conta = aguardar jogador.
// ------------------------------------------------------------
const labRenderActionPanelE6Base_=labRenderActionPanel_;
labRenderActionPanel_=function(){
    if(batalhaEhMestre_()&&labEstado_.fase==='combate'){
        const t=labTokenAtual_(),el=document.getElementById('labActionPanel');
        if(t&&!labMestreControlaTurnoE6_(t)){
            if(el){
                el.style.display='block';
                el.innerHTML=`<div style="display:flex;align-items:center;gap:8px;min-height:30px"><strong style="color:#ffd54a">🎯 ${escaparHtmlInventario_(t.nome)}</strong><span style="color:#9fc6d8">PJ de outra conta: aguardando a ação do jogador.</span></div>`;
            }
            return;
        }
    }
    return labRenderActionPanelE6Base_.apply(this,arguments);
};
window.labRenderActionPanel_=labRenderActionPanel_;

// ------------------------------------------------------------
// Status e informação secundária.
// ------------------------------------------------------------
const labAtualizarStatusCombateE6Base_=labAtualizarStatusCombate_;
labAtualizarStatusCombate_=function(){
    const r=labAtualizarStatusCombateE6Base_.apply(this,arguments);
    const el=document.getElementById('labCombatStatus');
    if(!el||labEstado_.fase==='combate')return r;
    if(labModoMestreE6_()){
        el.innerHTML='<strong>🧭 Exploração · Mestre:</strong> posicionamento administrativo livre. Selecione um personagem em <b>Atuar como</b> para usar suas perícias.';
    }else{
        const t=labAtorEfetivoE6_(),max=t?labMovimentoExploracaoMaxE6_(t):0;
        el.innerHTML=`<strong>🧭 Exploração${t?` · ${escaparHtmlInventario_(t.nome)}`:''}:</strong> até <b>${max.toFixed(1)} m</b> por arrasto. Não há turnos; cada novo arrasto renova esse limite. Trabalho físico usa fadiga.`;
    }
    return r;
};
window.labAtualizarStatusCombate_=labAtualizarStatusCombate_;

const labAtualizarInfoE6Base_=labAtualizarInfo_;
labAtualizarInfo_=function(){
    const r=labAtualizarInfoE6Base_.apply(this,arguments);
    const e=document.getElementById('labInfo');
    if(e&&labEstado_.fase!=='combate'){
        const t=labTokenPorId_(labEstado_.selecionadoId);
        if(t){
            const ator=labAtorEfetivoE6_(),max=ator&&String(ator.id)===String(t.id)?labMovimentoExploracaoMaxE6_(t):0;
            e.querySelectorAll('span').forEach(s=>{
                if(/posicionamento livre/i.test(s.textContent||'')){
                    s.innerHTML=labModoMestreE6_()?'<b>posicionamento livre do mestre</b>':(max>0?`<b>até ${max.toFixed(1)} m por arrasto</b>`:'<b>somente inspeção</b>');
                }
            });
        }
    }
    return r;
};
window.labAtualizarInfo_=labAtualizarInfo_;

// ------------------------------------------------------------
// Movimento remoto do jogador fora do combate recebe o MESMO limite.
// ------------------------------------------------------------
const labProcessarComandoJogadorE6Base_=labProcessarComandoJogador_;


// ------------------------------------------------------------
// Jogador: escala fixa de 48 px/m. Mestre mantém zoom livre.
// ------------------------------------------------------------
const labMudarZoomE6Base_=window.labMudarZoom_;
window.labMudarZoom_=function(v){
    if(!batalhaEhMestre_()){
        labEstado_.pxPorMetro=48;
        const z=document.getElementById('labZoom');if(z)z.value='48';
        labRender_();return;
    }
    return labMudarZoomE6Base_.apply(this,arguments);
};
function labAtualizarZoomE6_(){
    const z=document.getElementById('labZoom');if(!z)return;
    if(!batalhaEhMestre_()){
        if(Number(labEstado_.pxPorMetro)!==48)labEstado_.pxPorMetro=48;
        z.value='48';z.disabled=true;z.title='Jogadores usam a escala fixa de 48 px/m.';
    }else{
        z.disabled=false;z.title='O mestre pode alterar livremente a escala do mapa.';
    }
}

// ------------------------------------------------------------
// Sincronização: jogador carrega o mesmo MAPA SALVO por referência.
// O documento ao vivo leva apenas estado dinâmico/tokens/objetos.
// ------------------------------------------------------------
function labMapaIdAtualE7_(){
    const candidatos=[
        labEstado_?.mapaCompartilhadoIdE7,
        labMapaSelecionado_,
        labEstado_?.oficina2State?.mapId,
        (typeof gm2!=='undefined'&&gm2?.st?.mapId)?gm2.st.mapId:''
    ].map(x=>String(x||'')).filter(Boolean);
    return candidatos[0]||'';
}
function labMapaRefAtualE6_(){
    const id=labMapaIdAtualE7_();
    if(!id)return null;
    const m=(mapasDB||[]).find(x=>String(x.id)===id);
    const rev=String(
        labEstado_?.mapaCompartilhadoRevE7 ||
        m?.atualizadoEm ||
        m?.tamanhoSerializado ||
        m?.partes ||
        ''
    );
    return {id,rev};
}
const labEstadoPublicoE6Base_=labEstadoPublico_;
labEstadoPublico_=function(){
    const clone=labEstadoPublicoE6Base_();
    const ref=labMapaRefAtualE6_();
    clone.mapaCompartilhadoRefE6=ref;
    clone.mapaCompartilhadoRefE7=ref;
    delete clone.atuarComoE6;delete clone.atuarComoAntesCombateE6;delete clone.exploracaoAtorId;delete clone.mestreControlaPJLab;
    clone.logLab=(clone.logLab||[]).slice(0,40);
    clone.floatsLab=[];

    if(ref?.id){
        delete clone.oficina2State;
        clone.desenhosLab=[];
        clone.formasLab=[];
    }else if(clone.oficina2State&&typeof clone.oficina2State==='object'){
        const st={...clone.oficina2State};
        delete st.history;delete st.undo;delete st.redo;delete st.clipboard;delete st.selection;delete st.selectedIds;delete st.hoverId;
        clone.oficina2State=st;
    }
    return clone;
};

async function labAplicarCenarioCompartilhadoE6_(ref){
    if(batalhaEhMestre_()||!ref?.id)return false;
    const sig=`${String(ref.id)}|${String(ref.rev||'')}`;
    if(sig===labMapaRemotoSigE6_)return true;
    try{
        const snap=await getDoc(doc(db,'mapas',String(ref.id)));
        if(!snap.exists())throw new Error(`Mapa ${ref.id} não encontrado.`);
        let m={id:String(ref.id),...snap.data()};
        m=await labMapaHidratar_(m);

        labEstado_.larguraM=Math.max(4,Number(m.larguraM||labEstado_.larguraM||28));
        labEstado_.alturaM=Math.max(4,Number(m.alturaM||labEstado_.alturaM||14));
        labEstado_.fundo=String(m.fundo||labEstado_.fundo||'#d7d7d7');
        labEstado_.corGrade=String(m.corGrade||labEstado_.corGrade||'#777777');
        labEstado_.gradeVisivel=m.gradeVisivel!==false;
        labEstado_.textura=String(m.textura||'nenhuma');
        labEstado_.pxPorMetro=48; // jogador sempre em escala padrão
        labEstado_.oficina2State=m.oficina2State?JSON.parse(JSON.stringify(m.oficina2State)):null;
        labEstado_.desenhosLab=m.oficina2State?[]:JSON.parse(JSON.stringify(m.desenhos||[]));
        labEstado_.formasLab=m.oficina2State?[]:JSON.parse(JSON.stringify(m.formas||[]));
        labMapaSelecionado_=String(ref.id);
        labMapaRemotoSigE6_=sig;
        await labCarregarModelosObjetosFaltantes_(labEstado_.objetosLab||[]);
        if(document.getElementById('laboratorio-combate')?.classList.contains('active'))labRender_();
        return true;
    }catch(e){
        console.error('[SYNC E6] Falha ao carregar cenário compartilhado',e);
        notificar_('Não foi possível carregar o mesmo cenário usado pelo mestre.','erro',5000);
        return false;
    }
}



// ------------------------------------------------------------
// Render final: UI, câmera, zoom e limpeza do toggle antigo.
// ------------------------------------------------------------
const labRenderE6Base_=labRender_;

window.labRender_=labRender_;

// Primeira normalização desta versão.
if(!labEstado_.atuarComoE6)labEstado_.atuarComoE6=LAB_ATUAR_MESTRE_E6;
setTimeout(()=>{try{labRender_();}catch(e){console.warn('Inicialização EXP-ATUAR-CAMERA-6',e);}},900);




// ============================================================
// EXP-COREFIX-8
// Correções de núcleo:
// 1) religa objetos antigos ao Banco sem inferir material pelo nome;
// 2) publica uma cópia live leve e explícita do cenário atual;
// 3) jogador nunca vê metadados mecânicos de objetos;
// 4) ações de objeto continuam diretas no mapa.
// ============================================================

function labNomeChaveE8_(v){
    return String(v||'').trim().toLocaleLowerCase('pt-BR');
}
function labImagemChaveE8_(v){
    const s=String(v||'').trim();
    return s && !s.startsWith('data:') ? s : '';
}
function labModeloObjetoE8_(o){
    if(!o)return null;

    const ids=[
        o.modeloId,
        o.objetoBancoId,
        o.dadosBanco?.id,
        o.idBanco
    ].map(x=>String(x||'').trim()).filter(Boolean);

    for(const id of ids){
        const m=(objetosMapaDB||[]).find(x=>String(x?.id||'')===id);
        if(m)return m;
    }

    return null;
}

function labRepararObjetoBancoE8_(o){
    if(!o||typeof o!=='object')return false;
    const m=labModeloObjetoE8_(o);
    if(!m)return false;

    const mid=String(m.id||'');
    let mudou=false;

    if(mid && String(o.modeloId||'')!==mid){o.modeloId=mid;mudou=true;}
    if(mid && String(o.objetoBancoId||'')!==mid){o.objetoBancoId=mid;mudou=true;}

    const copiar=(k,v)=>{
        if(v===undefined)return;
        if(o[k]!==v){o[k]=v;mudou=true;}
    };

    // Propriedades do modelo vêm do Banco.
    copiar('material',String(m.material||''));
    copiar('dureza',Math.max(0,Number(m.dureza??m.hardness??o.dureza??0)));
    copiar('pesoKg',Math.max(0,Number(m.pesoKg??m.peso??m.weightKg??o.pesoKg??0)));
    copiar('pvMax',Math.max(0,Number(m.pvMax??m.pv??o.pvMax??0)));
    copiar('destrutivel',m.destrutivel!==false);
    copiar('inflamavel',!!m.inflamavel);
    copiar('inflamabilidade',Math.max(0,Math.min(5,Number(m.inflamabilidade??0))));
    copiar('bloqueiaMovimento',m.bloqueiaMovimento!==false);
    copiar('bloqueiaVisao',!!m.bloqueiaVisao);

    if(!o.imagem && m.imagem){o.imagem=m.imagem;mudou=true;}
    if(!o.nome && m.nome){o.nome=m.nome;mudou=true;}

    if(o.pvAtual===undefined || o.pvAtual===null || !Number.isFinite(Number(o.pvAtual))){
        o.pvAtual=Math.max(0,Number(o.pvMax||0));mudou=true;
    }else if(Number(o.pvAtual)>Number(o.pvMax||0) && Number(o.pvMax||0)>=0){
        o.pvAtual=Number(o.pvMax||0);mudou=true;
    }
    return mudou;
}

function labRepararObjetosMesaE8_(){
    let n=0;
    for(const o of (labEstado_.objetosLab||[])){
        if(labRepararObjetoBancoE8_(o))n++;
    }
    return n;
}

// A função oficial de modelo passa a incluir os fallbacks de compatibilidade.
labObjetoModelo_=function(o){return labModeloObjetoE8_(o);};

// ------------------------------------------------------------
// Jogador: objeto só revela nome no hover e não abre ficha mecânica.
// Mestre continua vendo dados do objeto.
// ------------------------------------------------------------
const labObjetoHtmlE8Base_=labObjetoHtml_;
labObjetoHtml_=function(o,ppm){
    let h=labObjetoHtmlE8Base_.apply(this,arguments);
    if(!batalhaEhMestre_()){
        const nome=escaparHtmlInventario_(o?.nome||labObjetoModelo_(o)?.nome||'Objeto');
        h=h.replace(/\stitle="[^"]*"/,` title="${nome}"`);
    }
    return h;
};
window.labObjetoHtml_=labObjetoHtml_;

const labRenderObjetoPainelE8Base_=window.labRenderObjetoPainel_;
window.labRenderObjetoPainel_=function(){
    const e=document.getElementById('labObjetoPainel');
    if(!batalhaEhMestre_()){
        if(e){e.style.display='flex';e.innerHTML='';}
        return;
    }
    return labRenderObjetoPainelE8Base_.apply(this,arguments);
};

// Seleção fora de combate continua direta no mapa e conserva o ator atual.
const labSelecionarObjetoE8Base_=window.labSelecionarObjeto_;
window.labSelecionarObjeto_=function(id){
    if(labEstado_.fase!=='combate'){
        const o=labObjetoPorId_(id);if(!o)return;
        labRepararObjetoBancoE8_(o);
        labEstado_.objetoSelecionadoId=String(id);
        labSalvarLocal_();
        labRender_();
        return;
    }
    return labSelecionarObjetoE8Base_.apply(this,arguments);
};

// ------------------------------------------------------------
// Cena live dedicada.
// Não depende do seletor "Mapas salvos" nem de o mapa ter sido salvo manualmente.
// ------------------------------------------------------------
function labCenaLiveIdE8_(){
    const uid=String(currentUserUid||'mestre').replace(/[^a-zA-Z0-9_-]+/g,'_');
    return `__mesa_live__${uid}`;
}

async function labSalvarCenaLiveE8_(){
    if(!batalhaEhMestre_() || typeof gm2==='undefined' || !gm2?.st)return null;

    const id=labCenaLiveIdE8_();
    const agora=new Date().toISOString();

    const slim=await map803EstadoSlim_(gm2.st,id);
    const dados={
        id,
        nome:'Mesa ao vivo',
        larguraM:slim.state.w,
        alturaM:slim.state.h,
        pxPorMetro:slim.state.ppm,
        fundo:slim.state.bg,
        corGrade:slim.state.grid,
        gradeVisivel:slim.state.showGrid,
        textura:slim.state.texture,
        desenhos:[],
        formas:[],
        objetos:map803LegacyRefs_(slim.state),
        oficina2State:slim.state,
        formatoObjetos:'refs-v1',
        criadoPor:currentUserUid||'',
        atualizadoEm:agora,
        oficina2:true,
        hiddenMesaLive:true
    };

    let antigas=0;
    try{
        const cab=await getDoc(doc(db,'mapas',id));
        antigas=Number(cab.exists()?cab.data()?.partes||0:0);
    }catch(_){}

    await labMapaSalvarFirestore_(dados,antigas);

    labEstado_.mapaCompartilhadoIdE8=id;
    labEstado_.mapaCompartilhadoRevE8=agora;
    return {id,rev:agora};
}

// Snapshot ao vivo SEM o cenário pesado. O cenário vem pela referência E8.
const labEstadoPublicoE8Base_=labEstadoPublico_;
labEstadoPublico_=function(){
    const clone=labEstadoPublicoE8Base_();

    delete clone.oficina2State;
    clone.desenhosLab=[];
    clone.formasLab=[];

    const id=String(labEstado_.mapaCompartilhadoIdE8||'');
    const rev=String(labEstado_.mapaCompartilhadoRevE8||'');
    clone.mapaCompartilhadoRefE8=id?{id,rev}:null;

    // Controle do mestre nunca é transmitido ao jogador.
    delete clone.atuarComoE6;
    delete clone.atuarComoAntesCombateE6;
    delete clone.exploracaoAtorId;
    delete clone.mestreControlaPJLab;

    return clone;
};

// Jogador carrega sempre a referência E8 primeiro.
async function labAplicarCenaLiveE8_(ref){
    if(batalhaEhMestre_()||!ref?.id)return false;
    const sig=`${String(ref.id)}|${String(ref.rev||'')}`;
    if(window.__LAB_CENA_E8_SIG__===sig)return true;

    try{
        const snap=await getDoc(doc(db,'mapas',String(ref.id)));
        if(!snap.exists())return false;
        let m={id:String(ref.id),...snap.data()};
        m=await labMapaHidratar_(m);

        labEstado_.larguraM=Math.max(4,Number(m.larguraM||28));
        labEstado_.alturaM=Math.max(4,Number(m.alturaM||14));
        labEstado_.fundo=String(m.fundo||'#d7d7d7');
        labEstado_.corGrade=String(m.corGrade||'#777777');
        labEstado_.gradeVisivel=m.gradeVisivel!==false;
        labEstado_.textura=String(m.textura||'nenhuma');
        labEstado_.pxPorMetro=48;
        labEstado_.oficina2State=m.oficina2State?JSON.parse(JSON.stringify(m.oficina2State)):null;
        labEstado_.desenhosLab=[];
        labEstado_.formasLab=[];
        window.__LAB_CENA_E8_SIG__=sig;
        return true;
    }catch(e){
        console.warn('[E8] cena live',e);
        return false;
    }
}

// Reescreve o listener final para aplicar estado dinâmico + cena live.


// ------------------------------------------------------------
// Pós-render: reparar vínculos antigos silenciosamente.
// ------------------------------------------------------------
const labRenderE8Base_=labRender_;

window.labRender_=labRender_;

// Primeira reparação e sincronização curta.
setTimeout(()=>{
    try{
        if(labRepararObjetosMesaE8_()){
            labSalvarLocal_();
            if(batalhaEhMestre_())labAgendarSyncRemoto_();
        }
        labRender_();
    }catch(e){console.warn('[E8] init',e);}
},1100);




// ============================================================
// EXP-TRABALHO-SYNC-10
// Sincronização da Mesa usando labEstado_.oficina2State, que é o
// cenário realmente publicado na Mesa. Não acessa gm2 fora da Oficina 2.
// ============================================================

let labCenaSync10Sig_='';
let labCenaSync10Ref_=null;
let labSync10Timer_=null;

function labHashCenaSync10_(texto){
    let h=2166136261>>>0;
    const passo=Math.max(1,Math.floor(texto.length/12000));
    for(let i=0;i<texto.length;i+=passo){
        h^=texto.charCodeAt(i);
        h=Math.imul(h,16777619)>>>0;
    }
    return `${texto.length}:${h.toString(16)}`;
}

function labCenaSync10Id_(){
    const uid=String(currentUserUid||'mestre').replace(/[^a-zA-Z0-9_-]+/g,'_');
    return `__mesa_live__${uid}`;
}

async function labGarantirCenaSync10_(){
    if(!batalhaEhMestre_())return labCenaSync10Ref_;

    const st=labEstado_?.oficina2State;
    if(!st||typeof st!=='object'){
        labCenaSync10Ref_=null;
        labCenaSync10Sig_='';
        return null;
    }

    const texto=JSON.stringify(st);
    const sig=labHashCenaSync10_(texto);
    if(labCenaSync10Ref_&&sig===labCenaSync10Sig_)return labCenaSync10Ref_;

    const id=labCenaSync10Id_();
    const agora=new Date().toISOString();
    let partesAntigas=0;
    try{
        const cab=await getDoc(doc(db,'mapas',id));
        if(cab.exists())partesAntigas=Number(cab.data()?.partes||0);
    }catch(_){}

    const dados={
        id,
        nome:'Mesa ao vivo',
        larguraM:Math.max(4,Number(st.w||labEstado_.larguraM||28)),
        alturaM:Math.max(4,Number(st.h||labEstado_.alturaM||14)),
        pxPorMetro:Number(st.ppm||labEstado_.pxPorMetro||48),
        fundo:String(st.bg||labEstado_.fundo||'#d7d7d7'),
        corGrade:String(st.grid||labEstado_.corGrade||'#777777'),
        gradeVisivel:st.showGrid!==false,
        textura:String(st.texture||labEstado_.textura||'nenhuma'),
        desenhos:[],
        objetos:[],
        oficina2State:JSON.parse(texto),
        criadoPor:currentUserUid||'',
        atualizadoEm:agora,
        hiddenMesaLive:true
    };

    await labMapaSalvarFirestore_(dados,partesAntigas);
    labCenaSync10Sig_=sig;
    labCenaSync10Ref_={id,rev:agora,sig};
    return labCenaSync10Ref_;
}

function labEstadoPublicoSync10_(){
    const clone=JSON.parse(JSON.stringify(labEstado_||{}));

    // O terreno pesado viaja por referência própria.
    delete clone.oficina2State;
    clone.desenhosLab=[];
    clone.formasLab=[];

    // Estado privado/local não vai para jogadores.
    clone.selecionadoId='';
    clone.objetoSelecionadoId='';
    clone.modoCriacaoMapa=false;
    delete clone.atuarComoE6;
    delete clone.atuarComoAntesCombateE6;
    delete clone.exploracaoAtorId;
    delete clone.mestreControlaPJLab;

    clone.tokens=(clone.tokens||[]).map(t=>{
        const x={...t};
        delete x.charLab;
        
        delete x.attrs;
        delete x.psiSelecaoLab;
        delete x.psSelecaoLab;
        return x;
    });

    clone.objetosLab=(clone.objetosLab||[]).map(o=>{
        const x={...o};
        delete x.imagem;
        return x;
    });

    clone.floatsLab=(clone.floatsLab||[]).slice(-12);
    clone.logLab=(clone.logLab||[]).slice(0,30);
    clone.mapaCompartilhadoRefSync10=labCenaSync10Ref_;
    return clone;
}

// Substitui o escritor remoto por uma versão que primeiro garante
// que o cenário atual da Mesa exista no Firestore e depois publica
// apenas o estado dinâmico.


async function labAplicarCenaSync10_(ref){
    if(batalhaEhMestre_()||!ref?.id)return false;
    const sig=`${String(ref.id)}|${String(ref.rev||ref.sig||'')}`;
    if(window.__LAB_CENA_SYNC10__===sig)return true;

    const snap=await getDoc(doc(db,'mapas',String(ref.id)));
    if(!snap.exists())return false;

    let m={id:String(ref.id),...snap.data()};
    m=await labMapaHidratar_(m);
    if(!m?.oficina2State)return false;

    labEstado_.larguraM=Math.max(4,Number(m.larguraM||m.oficina2State.w||28));
    labEstado_.alturaM=Math.max(4,Number(m.alturaM||m.oficina2State.h||14));
    labEstado_.fundo=String(m.fundo||m.oficina2State.bg||'#d7d7d7');
    labEstado_.corGrade=String(m.corGrade||m.oficina2State.grid||'#777777');
    labEstado_.gradeVisivel=m.gradeVisivel!==false;
    labEstado_.textura=String(m.textura||m.oficina2State.texture||'nenhuma');
    labEstado_.pxPorMetro=48;
    labEstado_.oficina2State=JSON.parse(JSON.stringify(m.oficina2State));
    labEstado_.desenhosLab=[];
    labEstado_.formasLab=[];
    window.__LAB_CENA_SYNC10__=sig;
    return true;
}



// Força uma primeira publicação curta após o módulo terminar.
setTimeout(()=>{if(batalhaEhMestre_())labAgendarSyncRemoto_();},1200);




// ============================================================
// EXP-CENA-DIRETA-12
// Sincronização do CENÁRIO isolada do restante da Mesa.
// O mestre publica labEstado_.oficina2State num mapa Firestore fixo;
// o jogador escuta esse documento diretamente.
// Não depende do snapshot de combate, mapa selecionado ou handshake de referência.
// ============================================================

const LAB_CENA_DIRETA12_ID_='__mesa_live__experimental_scene_v12';
let labCenaDireta12Unsub_=null;
let labCenaDireta12UltimoEstadoRef_=null;
let labCenaDireta12SavePromise_=null;
let labCenaDireta12Pendente_=false;
let labCenaDireta12UltimaRev_='';

function labCenaDireta12Slim_(estado){
    const st=JSON.parse(JSON.stringify(estado||{}));
    // Objetos do Banco já são sincronizados pela camada dinâmica da Mesa;
    // a camada de terreno nem sequer os renderiza.
    st.elements=(st.elements||[]).map(e=>{
        if(e?.type!=='object')return e;
        return {
            id:String(e.id||''),
            type:'object',
            modeloId:String(e.modeloId||e.objetoBancoId||e.dadosBanco?.id||''),
            objetoBancoId:String(e.objetoBancoId||e.modeloId||e.dadosBanco?.id||''),
            x:Number(e.x||0),y:Number(e.y||0),w:Number(e.w||1),h:Number(e.h||1),
            rot:Number(e.rot||0),z:Number(e.z||0),locked:!!e.locked,
            opacity:Number(e.opacity??1),shadow:e.shadow||'nenhuma',
            shadowDir:e.shadowDir||'SE',shadowDist:Number(e.shadowDist||4)
        };
    });
    return st;
}

async function labCenaDireta12SalvarAgora_(){
    if(!batalhaEhMestre_())return false;
    const fonte=labEstado_?.oficina2State;
    if(!fonte||typeof fonte!=='object')return false;

    // Identidade do objeto é suficiente: publicar/substituir mapa troca a referência;
    // mover tokens e resolver combate não.
    if(fonte===labCenaDireta12UltimoEstadoRef_&&!labCenaDireta12Pendente_)return true;

    if(labCenaDireta12SavePromise_){
        labCenaDireta12Pendente_=true;
        return labCenaDireta12SavePromise_;
    }

    const estadoRef=fonte;
    const estado=labCenaDireta12Slim_(fonte);
    labCenaDireta12Pendente_=false;

    labCenaDireta12SavePromise_=(async()=>{
        const agora=new Date().toISOString();
        let antigas=0;
        try{
            const cab=await getDoc(doc(db,'mapas',LAB_CENA_DIRETA12_ID_));
            if(cab.exists())antigas=Number(cab.data()?.partes||0);
        }catch(_){}

        const dados={
            id:LAB_CENA_DIRETA12_ID_,
            nome:'Mesa experimental ao vivo',
            larguraM:Math.max(4,Number(estado.w||labEstado_.larguraM||28)),
            alturaM:Math.max(4,Number(estado.h||labEstado_.alturaM||14)),
            pxPorMetro:Number(estado.ppm||labEstado_.pxPorMetro||48),
            fundo:String(estado.bg||labEstado_.fundo||'#d7d7d7'),
            corGrade:String(estado.grid||labEstado_.corGrade||'#777777'),
            gradeVisivel:estado.showGrid!==false,
            textura:String(estado.texture||labEstado_.textura||'nenhuma'),
            desenhos:[],
            objetos:[],
            oficina2State:estado,
            criadoPor:currentUserUid||'',
            atualizadoEm:agora,
            oficina2:true,
            hiddenMesaLive:true,
            syncCenaDireta12:true
        };

        await labMapaSalvarFirestore_(dados,antigas);
        labCenaDireta12UltimoEstadoRef_=estadoRef;
        labCenaDireta12UltimaRev_=agora;
        console.info('[SYNC12] cenário publicado',agora);
        return true;
    })();

    try{
        return await labCenaDireta12SavePromise_;
    }catch(e){
        console.error('[SYNC12] falha ao publicar cenário',e);
        return false;
    }finally{
        labCenaDireta12SavePromise_=null;
        if(labCenaDireta12Pendente_){
            labCenaDireta12Pendente_=false;
            setTimeout(()=>labCenaDireta12SalvarAgora_(),80);
        }
    }
}

function labCenaDireta12Agendar_(){
    if(!batalhaEhMestre_())return;
    clearTimeout(window.__LAB_CENA12_TIMER__);
    window.__LAB_CENA12_TIMER__=setTimeout(()=>labCenaDireta12SalvarAgora_(),180);
}

async function labCenaDireta12Aplicar_(cabecalho){
    if(batalhaEhMestre_()||!cabecalho)return false;
    const rev=String(cabecalho.atualizadoEm||'');
    if(rev&&window.__LAB_CENA12_REV__===rev)return true;

    let m={id:LAB_CENA_DIRETA12_ID_,...cabecalho};
    m=await labMapaHidratar_(m);
    const st=m?.oficina2State;
    if(!st||typeof st!=='object')return false;

    labAplicandoRemoto_=true;
    try{
        labEstado_.larguraM=Math.max(4,Number(m.larguraM||st.w||28));
        labEstado_.alturaM=Math.max(4,Number(m.alturaM||st.h||14));
        labEstado_.fundo=String(m.fundo||st.bg||'#d7d7d7');
        labEstado_.corGrade=String(m.corGrade||st.grid||'#777777');
        labEstado_.gradeVisivel=m.gradeVisivel!==false;
        labEstado_.textura=String(m.textura||st.texture||'nenhuma');
        labEstado_.pxPorMetro=48;
        labEstado_.oficina2State=JSON.parse(JSON.stringify(st));
        labEstado_.desenhosLab=[];
        labEstado_.formasLab=[];
        window.__LAB_CENA12_REV__=rev||Date.now().toString();
    }finally{
        labAplicandoRemoto_=false;
    }

    console.info('[SYNC12] cenário recebido',rev);
    if(document.getElementById('laboratorio-combate')?.classList.contains('active'))labRender_();
    return true;
}

function labCenaDireta12Escutar_(){
    if(labCenaDireta12Unsub_){labCenaDireta12Unsub_();labCenaDireta12Unsub_=null;}
    if(!currentUserUid||batalhaEhMestre_())return;

    labCenaDireta12Unsub_=onSnapshot(
        doc(db,'mapas',LAB_CENA_DIRETA12_ID_),
        snap=>{
            if(!snap.exists())return;
            labCenaDireta12Aplicar_(snap.data()).catch(e=>console.error('[SYNC12] falha ao receber cenário',e));
        },
        e=>console.error('[SYNC12] listener do cenário',e)
    );
}

// Toda alteração local relevante passa por labSalvarLocal_.
// Só haverá gravação de cenário se oficina2State tiver sido substituído.
const labSalvarLocalCena12Base_=labSalvarLocal_;


// A função de login já chama iniciarMapaMesaCompartilhado_.
// Acrescentamos a escuta independente do cenário ao mesmo ponto.
const iniciarMapaMesaCompartilhadoCena12Base_=window.iniciarMapaMesaCompartilhado_;


// Se a autenticação já tiver terminado antes desta camada ser instalada.
setTimeout(()=>{
    if(!currentUserUid)return;
    if(batalhaEhMestre_())labCenaDireta12Agendar_();
    else labCenaDireta12Escutar_();
},1000);




// ============================================================
// EXP-SYNC-13
// Sincronização isolada e corrigida.
// - remove campos Firestore inválidos (__...__) do estado dinâmico;
// - cenário não usa mais a coleção /mapas, que jogadores não podem ler;
// - cenário é dividido em partes dentro de /combatesAtivos;
// - combate/tokens e cenário são sincronizados por canais independentes.
// ============================================================

const LAB_SYNC13_CANAL_='experimental-v13';
const LAB_SYNC13_CENA_HEADER_ID_='mapaMesaExperimentalCena13';
const LAB_SYNC13_CENA_PARTE_PREFIX_='mapaMesaExperimentalCena13_';
const LAB_SYNC13_CHUNK_=480000;

let labSync13SceneUnsub_=null;
let labSync13SceneTimer_=null;
let labSync13SceneSaving_=false;
let labSync13ScenePending_=false;
let labSync13LastSceneRef_=null;
let labSync13LastSceneHash_='';
let labSync13DynamicTimer_=null;

function labSync13Hash_(texto){
    let h=2166136261>>>0;
    const passo=Math.max(1,Math.floor(texto.length/16000));
    for(let i=0;i<texto.length;i+=passo){
        h^=texto.charCodeAt(i);
        h=Math.imul(h,16777619)>>>0;
    }
    return `${texto.length}:${h.toString(16)}`;
}

function labSync13LimparChavesInvalidas_(valor,visitados=new WeakSet()){
    if(valor===null||valor===undefined)return valor;
    if(typeof valor!=='object')return valor;
    if(visitados.has(valor))return null;
    visitados.add(valor);

    if(Array.isArray(valor)){
        for(let i=0;i<valor.length;i++){
            const v=valor[i];
            if(typeof v==='function'||v===undefined){valor[i]=null;continue;}
            valor[i]=labSync13LimparChavesInvalidas_(v,visitados);
        }
        return valor;
    }

    for(const k of Object.keys(valor)){
        if(/^__.*__$/.test(k)){
            delete valor[k];
            continue;
        }
        const v=valor[k];
        if(typeof v==='function'||v===undefined){
            delete valor[k];
            continue;
        }
        valor[k]=labSync13LimparChavesInvalidas_(v,visitados);
    }
    return valor;
}

function labSync13EstadoPublico_(){
    let clone;
    try{
        clone=labEstadoPublicoSync10_();
    }catch(_){
        clone=JSON.parse(JSON.stringify(labEstado_||{}));
        delete clone.oficina2State;
        clone.desenhosLab=[];
        clone.formasLab=[];
    }

    // Referências das tentativas anteriores não participam mais do protocolo.
    delete clone.mapaCompartilhadoRefSync10;
    delete clone.mapaCompartilhadoRefE8;
    delete clone.mapaCompartilhadoRefE7;
    delete clone.mapaCompartilhadoRefE6;

    return labSync13LimparChavesInvalidas_(clone);
}

function labSync13PurgarEstadoLocal_(){
    try{
        labSync13LimparChavesInvalidas_(labEstado_);
        if(Object.prototype.hasOwnProperty.call(labEstado_,'__patched__'))delete labEstado_.__patched__;
        localStorage.setItem('mesaEstelarLabCombate',JSON.stringify(labEstado_));
    }catch(e){
        console.warn('[SYNC13] limpeza local',e);
    }
}

// Desativa o listener/gravação SYNC12 em /mapas, que falhava por permissão.
try{
    if(labCenaDireta12Unsub_){labCenaDireta12Unsub_();labCenaDireta12Unsub_=null;}
    labCenaDireta12Agendar_=function(){};
    labCenaDireta12Escutar_=function(){};
}catch(_){}

// Cancela escrita antiga pendente, se houver.
try{clearTimeout(labSync10Timer_);}catch(_){}

// ------------------------------------------------------------
// Estado dinâmico: mesmo documento compartilhado já usado pela Mesa.
// ------------------------------------------------------------


// ------------------------------------------------------------
// Cenário: JSON em partes dentro de /combatesAtivos.
// Header é salvo por último, então jogador nunca lê partes incompletas.
// ------------------------------------------------------------
function labSync13CenaSlim_(){
    const fonte=labEstado_?.oficina2State;
    if(!fonte||typeof fonte!=='object')return null;

    const st=JSON.parse(JSON.stringify(fonte));
    st.elements=(st.elements||[]).map(e=>{
        if(e?.type!=='object')return e;
        return {
            id:String(e.id||''),
            type:'object',
            modeloId:String(e.modeloId||e.objetoBancoId||e.dadosBanco?.id||''),
            objetoBancoId:String(e.objetoBancoId||e.modeloId||e.dadosBanco?.id||''),
            x:Number(e.x||0),y:Number(e.y||0),
            w:Number(e.w||1),h:Number(e.h||1),
            rot:Number(e.rot||0),z:Number(e.z||0),
            locked:!!e.locked,opacity:Number(e.opacity??1),
            shadow:e.shadow||'nenhuma',
            shadowDir:e.shadowDir||'SE',
            shadowDist:Number(e.shadowDist||4)
        };
    });
    return st;
}

async function labSync13PublicarCenaAgora_(){
    if(!batalhaEhMestre_())return false;
    if(labSync13SceneSaving_){
        labSync13ScenePending_=true;
        return false;
    }

    const fonte=labEstado_?.oficina2State;
    if(!fonte||typeof fonte!=='object')return false;

    const cena=labSync13CenaSlim_();
    if(!cena)return false;

    const texto=JSON.stringify(cena);
    const hash=labSync13Hash_(texto);

    if(hash===labSync13LastSceneHash_)return true;

    const partes=[];
    for(let i=0;i<texto.length;i+=LAB_SYNC13_CHUNK_)partes.push(texto.slice(i,i+LAB_SYNC13_CHUNK_));
    const rev=new Date().toISOString();

    labSync13SceneSaving_=true;
    try{
        for(let i=0;i<partes.length;i++){
            await setDoc(
                doc(db,'combatesAtivos',`${LAB_SYNC13_CENA_PARTE_PREFIX_}${i}`),
                {canal:LAB_SYNC13_CANAL_,rev,indice:i,dados:partes[i]},
                {merge:false}
            );
        }

        await setDoc(
            doc(db,'combatesAtivos',LAB_SYNC13_CENA_HEADER_ID_),
            {
                canal:LAB_SYNC13_CANAL_,
                rev,
                partes:partes.length,
                hash,
                larguraM:Number(cena.w||labEstado_.larguraM||28),
                alturaM:Number(cena.h||labEstado_.alturaM||14)
            },
            {merge:false}
        );

        labSync13LastSceneRef_=fonte;
        labSync13LastSceneHash_=hash;
        console.info(`[SYNC13] cenário publicado (${partes.length} parte${partes.length===1?'':'s'})`);
        return true;
    }catch(e){
        console.error('[SYNC13] cenário',e);
        return false;
    }finally{
        labSync13SceneSaving_=false;
        if(labSync13ScenePending_){
            labSync13ScenePending_=false;
            setTimeout(()=>labSync13PublicarCenaAgora_(),100);
        }
    }
}

function labSync13AgendarCena_(){
    if(!batalhaEhMestre_())return;
    const fonte=labEstado_?.oficina2State;
    if(!fonte||typeof fonte!=='object')return;

    clearTimeout(labSync13SceneTimer_);
    labSync13SceneTimer_=setTimeout(()=>labSync13PublicarCenaAgora_(),260);
}

async function labSync13ReceberCena_(header){
    if(batalhaEhMestre_()||!header||header.canal!==LAB_SYNC13_CANAL_)return false;

    const rev=String(header.rev||'');
    if(rev&&window.__LAB_SYNC13_CENA_REV__===rev)return true;

    const total=Math.max(0,Number(header.partes||0));
    if(!total)return false;

    const pedaços=[];
    for(let i=0;i<total;i++){
        const snap=await getDoc(doc(db,'combatesAtivos',`${LAB_SYNC13_CENA_PARTE_PREFIX_}${i}`));
        if(!snap.exists())throw new Error(`Parte ${i+1}/${total} do cenário não encontrada.`);
        const d=snap.data()||{};
        if(d.canal!==LAB_SYNC13_CANAL_||String(d.rev||'')!==rev)throw new Error(`Parte ${i+1}/${total} pertence a outra revisão.`);
        pedaços.push(String(d.dados||''));
    }

    const texto=pedaços.join('');
    if(header.hash&&labSync13Hash_(texto)!==String(header.hash))throw new Error('Cenário recebido com hash diferente.');

    const st=JSON.parse(texto);

    labAplicandoRemoto_=true;
    try{
        labEstado_.larguraM=Math.max(4,Number(st.w||header.larguraM||28));
        labEstado_.alturaM=Math.max(4,Number(st.h||header.alturaM||14));
        labEstado_.fundo=String(st.bg||'#d7d7d7');
        labEstado_.corGrade=String(st.grid||'#777777');
        labEstado_.gradeVisivel=st.showGrid!==false;
        labEstado_.textura=String(st.texture||'nenhuma');
        labEstado_.pxPorMetro=48;
        labEstado_.oficina2State=st;
        labEstado_.desenhosLab=[];
        labEstado_.formasLab=[];
        window.__LAB_SYNC13_CENA_REV__=rev||Date.now().toString();
    }finally{
        labAplicandoRemoto_=false;
    }

    console.info(`[SYNC13] cenário recebido (${total} parte${total===1?'':'s'})`);
    if(document.getElementById('laboratorio-combate')?.classList.contains('active'))labRender_();
    return true;
}

function labSync13EscutarCena_(){
    if(labSync13SceneUnsub_){labSync13SceneUnsub_();labSync13SceneUnsub_=null;}
    if(!currentUserUid||batalhaEhMestre_())return;

    labSync13SceneUnsub_=onSnapshot(
        doc(db,'combatesAtivos',LAB_SYNC13_CENA_HEADER_ID_),
        snap=>{
            if(!snap.exists())return;
            labSync13ReceberCena_(snap.data()).catch(e=>console.error('[SYNC13] receber cenário',e));
        },
        e=>console.error('[SYNC13] listener cenário',e)
    );
}

// ------------------------------------------------------------
// Listener final do estado dinâmico.
// Preserva o cenário recebido pelo canal de cena.
// ------------------------------------------------------------


// Toda troca/publicação de cenário acaba passando por labSalvarLocal_.
// O wrapper apenas agenda a cena quando a referência realmente mudou.
const labSalvarLocalSync13Base_=labSalvarLocal_;


// Limpa agora o resíduo __patched__ que aparece no erro do Firestore.
labSync13PurgarEstadoLocal_();

// Se autenticação já terminou antes da instalação desta camada.
setTimeout(()=>{
    if(!currentUserUid)return;
    window.iniciarMapaMesaCompartilhado_();
},700);




// ============================================================
// EXP-SYNC-14
// - Defesa do jogador é enviada ao mestre e resolvida na instância autoritativa.
// - Cenário é rechecado por conteúdo, não por referência de objeto.
// ============================================================

const labResponderDefesaSync14Base_=window.labResponderDefesa_;

window.labResponderDefesa_=function(defender=true){
    if(batalhaEhMestre_()){
        return labResponderDefesaSync14Base_.apply(this,arguments);
    }

    const pend=labEstado_.pendenciaLab;
    if(!pend)return;

    const defensor=labTokenPorId_(pend.defensorId);
    if(!defensor||!labPodeControlarToken_(defensor))return;

    const payload={
        defender:!!defender,
        defesaLab:String(defensor.defesaLab||''),
        atacanteId:String(pend.atacanteId||''),
        defensorId:String(pend.defensorId||'')
    };

    // Não rola localmente. O mestre resolve e devolve o novo estado.
    labEnviarComandoJogador_('defesa',payload,defensor).then(ok=>{
        if(ok)notificar_('Defesa enviada.','info',1200);
    });
};

const labProcessarComandoJogadorSync14Base_=labProcessarComandoJogador_;


// Rechecagens após a página terminar de restaurar/carregar o cenário.
// O hash impede gravações duplicadas quando nada mudou.
setTimeout(()=>{if(batalhaEhMestre_())labSync13AgendarCena_();},1600);
setTimeout(()=>{if(batalhaEhMestre_())labSync13AgendarCena_();},3600);
setTimeout(()=>{if(batalhaEhMestre_())labSync13AgendarCena_();},6500);




// ============================================================
// EXP-SYNC-15
// - Jogador vê no painel superior somente os dados do próprio PJ.
// - Clicar em outro token durante sua oportunidade fixa o alvo de verdade.
// - Reações de PM/NPC/Monstro têm prioridade no painel do mestre,
//   mesmo quando a oportunidade pertence a um PJ de outra conta.
// - SYNC14 (defesa enviada ao mestre) permanece ativo.
// ============================================================

function labTokenProprioJogador15_(){
    if(batalhaEhMestre_())return null;
    const uid=String(currentUserUid||currentUser?.uid||'');
    const meus=(labEstado_.tokens||[]).filter(t=>uid&&String(t.donoUid||'')===uid);
    if(!meus.length)return null;

    const atualChar=String(currentCharId||'');
    if(atualChar){
        const exato=meus.find(t=>
            String(t.id||'')===atualChar ||
            String(t.origemId||'')===atualChar ||
            String(t.charLab?.id||'')===atualChar
        );
        if(exato)return exato;
    }
    return meus[0];
}

function labTokenPertenceAoJogador15_(t){
    if(!t||batalhaEhMestre_())return false;
    const uid=String(currentUserUid||currentUser?.uid||'');
    return !!uid&&String(t.donoUid||'')===uid;
}

// ------------------------------------------------------------
// Barra secundária: jogador nunca troca os próprios dados pelos do alvo.
// ------------------------------------------------------------
const labAtualizarInfoSync15Base_=labAtualizarInfo_;
labAtualizarInfo_=function(){
    if(batalhaEhMestre_())return labAtualizarInfoSync15Base_.apply(this,arguments);

    const meu=labTokenProprioJogador15_();
    const salvo=labEstado_.selecionadoId;
    try{
        labEstado_.selecionadoId=meu?String(meu.id):'';
        return labAtualizarInfoSync15Base_.apply(this,arguments);
    }finally{
        labEstado_.selecionadoId=salvo;
    }
};
window.labAtualizarInfo_=labAtualizarInfo_;

// ------------------------------------------------------------
// Clique em alvo: marca a flag exigida pelo sistema de ataque.
// O wrapper anterior selecionava visualmente o token, mas não preenchia
// _alvoSelecionadoMapa763, então o botão Atacar recusava o alvo.
// ------------------------------------------------------------
const labPointerDownSync15Base_=window.labPointerDown_;
window.labPointerDown_=function(ev,id){
    const alvo=labTokenPorId_(id);
    const ator=labTokenAtual_();

    if(
        labEstado_.fase==='combate' &&
        alvo && ator &&
        String(alvo.id)!==String(ator.id) &&
        !labEstado_.pendenciaLab &&
        !labEstado_.danoPendenteLab
    ){
        const podeEscolher=
            (!batalhaEhMestre_() && labTokenPertenceAoJogador15_(ator)) ||
            (batalhaEhMestre_() && labMestreControlaTurnoE6_(ator));

        if(podeEscolher){
            ev.preventDefault();
            ev.stopPropagation();
            labMarcarAlvoMapa763_(String(alvo.id));
            labRender_();
            return;
        }
    }

    return labPointerDownSync15Base_.apply(this,arguments);
};

// ------------------------------------------------------------
// Painel de ação:
// mestre resolve primeiro qualquer reação dos seus próprios participantes;
// jogador nunca recebe ficha/PV de um alvo que não lhe pertence.
// ------------------------------------------------------------
const labRenderActionPanelSync15Base_=labRenderActionPanel_;
labRenderActionPanel_=function(){
    const el=document.getElementById('labActionPanel');
    if(!el)return;

    const pend=labEstado_.pendenciaLab;

    if(batalhaEhMestre_()){
        if(pend){
            const defensor=labTokenPorId_(pend.defensorId);
            const grupo=labGrupoTokenE6_(defensor);

            if(defensor && ['PM','NPC','Monstro'].includes(grupo)){
                const defs=labDefesasDisponiveis_(defensor)||[];
                const semAcao=
                    Number(defensor.acoesAtuaisLab||0)<=0 &&
                    Number(defensor.acoesDefensivasPsiLab||0)<=0;

                if(!defs.length || semAcao){
                    el.style.display='block';
                    el.innerHTML='<div style="min-height:30px;color:#9fc6d8">Resolvendo ataque…</div>';
                    0;
                    return;
                }

                // Ignora o aviso "aguardando PJ" porque agora quem precisa reagir
                // é um participante controlado pelo mestre.
                return labRenderActionPanelE6Base_.apply(this,arguments);
            }
        }

        return labRenderActionPanelSync15Base_.apply(this,arguments);
    }

    const meu=labTokenProprioJogador15_();
    const meuId=String(meu?.id||'');

    if(pend){
        const defensor=labTokenPorId_(pend.defensorId);
        const atacante=labTokenPorId_(pend.atacanteId);

        // Só mostra a interface de defesa quando o próprio PJ é o defensor.
        if(defensor && String(defensor.id)===meuId){
            return labRenderActionPanelE6Base_.apply(this,arguments);
        }

        // Se o PJ atacou outra pessoa, não revela ficha, PV, defesa ou AÇ do alvo.
        if(atacante && String(atacante.id)===meuId){
            el.style.display='block';
            el.innerHTML='<div style="min-height:30px;color:#9fc6d8">Aguardando reação do alvo…</div>';
            return;
        }

        el.style.display='none';
        el.innerHTML='';
        return;
    }

    return labRenderActionPanelSync15Base_.apply(this,arguments);
};
window.labRenderActionPanel_=labRenderActionPanel_;

// Garante que o pós-render use as versões finais acima.
const labRenderSync15Base_=labRender_;

window.labRender_=labRender_;




// ============================================================
// EXP-SYNC-16
// Contexto de combate do mestre:
// - turno de PM/NPC/Monstro -> painel completo desse participante;
// - reação de PM/NPC/Monstro -> painel completo do defensor;
// - turno de PJ externo -> mestre apenas aguarda o jogador;
// - barra de informações acompanha o contexto efetivo do combate.
// ============================================================

function labDonoToken16_(t){
    const c=labCharToken_(t);
    return String(
        t?.donoUid ||
        t?.dono ||
        t?.charLab?.donoUid ||
        t?.charLab?.dono ||
        c?.donoUid ||
        c?.dono ||
        ''
    );
}

function labTipoToken16_(t){
    if(!t)return '';
    const c=labCharToken_(t);
    const tipo=normalizarTextoCombate_(String(
        t?.tipo ||
        t?.charLab?.tipo ||
        c?.tipo ||
        ''
    ));

    if(t?.criaturaBancoId || t?.charLab?.criaturaBancoId || /criatura|monstro/.test(tipo))
        return 'Monstro';

    if(t?.npcBancoId || t?.charLab?.npcBancoId || tipo==='npc' || tipo==='npc rapido' || tipo==='npc_rapido')
        return 'NPC';

    const dono=labDonoToken16_(t);
    if(dono && dono===String(currentUserUid||''))return 'PM';
    return 'PJ';
}

function labTokenControladoMestre16_(t){
    if(!batalhaEhMestre_()||!t)return false;
    const g=labTipoToken16_(t);
    return g==='PM'||g==='NPC'||g==='Monstro';
}

// Unifica a classificação usada pelo seletor "Atuar como" e pelo combate.
labGrupoTokenE6_=function(t){return labTipoToken16_(t);};
labMestreControlaTurnoE6_=function(t){return labTokenControladoMestre16_(t);};

// Contexto que o mestre deve enxergar no painel/barra superior.
function labContextoCombateMestre16_(){
    if(!batalhaEhMestre_()||labEstado_.fase!=='combate')return null;

    const pend=labEstado_.pendenciaLab;
    if(pend){
        const defensor=labTokenPorId_(pend.defensorId);
        if(labTokenControladoMestre16_(defensor)){
            return {tipo:'defesa',token:defensor};
        }
    }

    const dp=labEstado_.danoPendenteLab;
    if(dp){
        const atacante=labTokenPorId_(dp.atacanteId);
        if(labTokenControladoMestre16_(atacante)){
            return {tipo:'dano',token:atacante};
        }
    }

    const atual=labTokenAtual_();
    if(atual){
        return {
            tipo:labTokenControladoMestre16_(atual)?'turno_mestre':'turno_jogador',
            token:atual
        };
    }
    return null;
}

// ------------------------------------------------------------
// Barra de informações do mestre acompanha turno/reação, não o último clique.
// Jogador continua vendo somente seu próprio PJ pela camada SYNC15.
// ------------------------------------------------------------
const labAtualizarInfoSync16Base_=labAtualizarInfo_;
labAtualizarInfo_=function(){
    if(!batalhaEhMestre_()){
        return labAtualizarInfoSync16Base_.apply(this,arguments);
    }

    if(labEstado_.fase!=='combate'){
        return labAtualizarInfoSync16Base_.apply(this,arguments);
    }

    const ctx=labContextoCombateMestre16_();
    const salvo=labEstado_.selecionadoId;
    try{
        labEstado_.selecionadoId=ctx?.token?String(ctx.token.id):'';
        return labAtualizarInfoSync16Base_.apply(this,arguments);
    }finally{
        labEstado_.selecionadoId=salvo;
    }
};
window.labAtualizarInfo_=labAtualizarInfo_;

// ------------------------------------------------------------
// Painel do mestre reconstruído diretamente da implementação original.
// Isto contorna os wrappers antigos que mostravam "aguardando PJ"
// antes de verificar uma defesa de PM/NPC/Monstro.
// ------------------------------------------------------------
const labRenderActionPanelSync16Fallback_=labRenderActionPanel_;

labRenderActionPanel_=function(){
    const el=document.getElementById('labActionPanel');
    if(!el)return;

    if(!batalhaEhMestre_()){
        return labRenderActionPanelSync16Fallback_.apply(this,arguments);
    }

    if(labEstado_.fase!=='combate'){
        el.style.display='none';
        el.innerHTML='';
        return;
    }

    const pend=labEstado_.pendenciaLab;

    if(pend){
        const defensor=labTokenPorId_(pend.defensorId);

        // Defesa de PM/NPC/Monstro: sempre reconstruir o painel do defensor.
        if(labTokenControladoMestre16_(defensor)){
            const defs=labDefesasDisponiveis_(defensor)||[];
            const temAcao=
                Number(defensor?.acoesAtuaisLab||0)>0 ||
                Number(defensor?.acoesDefensivasPsiLab||0)>0;

            // Sem reação real: não manter uma pendência impossível.
            if(!defs.length || !temAcao){
                el.style.display='block';
                el.innerHTML='<div style="min-height:30px;color:#9fc6d8">Resolvendo ataque…</div>';
                0;
                return;
            }

            // Chama a função original, anterior ao wrapper "aguardando PJ".
            return labRenderActionPanelE6Base_.apply(this,arguments);
        }

        // Defesa pertencente a um PJ externo.
        el.style.display='block';
        el.innerHTML='<div style="min-height:30px;color:#9fc6d8">Aguardando reação do jogador…</div>';
        return;
    }

    const dp=labEstado_.danoPendenteLab;
    if(dp){
        const atacante=labTokenPorId_(dp.atacanteId);

        if(labTokenControladoMestre16_(atacante)){
            return labRenderActionPanelE6Base_.apply(this,arguments);
        }

        // O atacante é PJ externo. O mestre continua autoritativo para o estado,
        // mas não substitui o painel do turno por ficha de outro participante.
        el.style.display='block';
        el.innerHTML='<div style="min-height:30px;color:#9fc6d8">Aguardando resolução do ataque do jogador…</div>';
        return;
    }

    const atual=labTokenAtual_();
    if(!atual){
        el.style.display='none';
        el.innerHTML='';
        return;
    }

    // Turno de PM/NPC/Monstro: painel completo do participante da iniciativa.
    if(labTokenControladoMestre16_(atual)){
        return labRenderActionPanelE6Base_.apply(this,arguments);
    }

    // Turno de PJ de outra conta.
    el.style.display='block';
    el.innerHTML=`<div style="display:flex;align-items:center;gap:8px;min-height:30px">
        <strong style="color:#ffd54a">🎯 ${escaparHtmlInventario_(atual.nome||'PJ')}</strong>
        <span style="color:#9fc6d8">Aguardando a ação do jogador.</span>
    </div>`;
};
window.labRenderActionPanel_=labRenderActionPanel_;

// ------------------------------------------------------------
// Se surgir uma pendência impossível por estado antigo/incompleto,
// resolver sem exigir clique manual.
// ------------------------------------------------------------
function labSanearReacaoMestre16_(){
    if(!batalhaEhMestre_()||labEstado_.fase!=='combate')return;
    const pend=labEstado_.pendenciaLab;
    if(!pend)return;

    const defensor=labTokenPorId_(pend.defensorId);
    if(!labTokenControladoMestre16_(defensor))return;

    const defs=labDefesasDisponiveis_(defensor)||[];
    const temAcao=
        Number(defensor?.acoesAtuaisLab||0)>0 ||
        Number(defensor?.acoesDefensivasPsiLab||0)>0;

    if(!defs.length||!temAcao){
        0;
    }
}

// Pós-render final.
const labRenderSync16Base_=labRender_;

window.labRender_=labRender_;




// ============================================================
// EXP-SYNC-17
// Interações automáticas de exploração do jogador.
// Lenhar, Minerar, Mover objeto e Apagar fogo não abrem pedido ao mestre.
// A conta do mestre continua sendo a autoridade técnica, mas resolve a ação
// silenciosamente e devolve o resultado pelo estado sincronizado.
// ============================================================

const labObjetoAcaoSync17Base_=window.labObjetoAcao_;

window.labObjetoAcao_=function(tipo,id){
    const ator=labAtorInteracaoE4_();
    const objeto=labObjetoPorId_(id);

    if(!ator||!objeto||!labPodeControlarToken_(ator)){
        notificar_('Selecione primeiro o personagem que fará a ação.','aviso',2200);
        return;
    }

    // Mestre ou combate seguem a implementação já existente.
    if(batalhaEhMestre_() || labEstado_.fase==='combate'){
        return labObjetoAcaoSync17Base_.apply(this,arguments);
    }

    // Exploração do jogador: execução automática, sem mensagem/pedido para o mestre.
    if(ator._acaoObjetoPendente17)return;
    ator._acaoObjetoPendente17={
        tipo:String(tipo||''),
        objetoId:String(id),
        iniciadoEm:Date.now()
    };

    labEnviarComandoJogador_(
        'acao_objeto_auto17',
        {tipo:String(tipo||''),objetoId:String(id)},
        ator
    ).then(ok=>{
        if(!ok)delete ator._acaoObjetoPendente17;
    });
};

// Mestre processa automaticamente a interação recebida.
// Não depende de iniciativa, Atuar como ou seleção do mestre.
const labProcessarComandoJogadorSync17Base_=labProcessarComandoJogador_;



// Quando o estado novo chega ao jogador, libera imediatamente a próxima ação.
// O resultado já vem em ultimoResultadoProprioLab/historicoPrivadoLab.
const iniciarMapaMesaCompartilhadoSync17Base_=window.iniciarMapaMesaCompartilhado_;



// Não deixa a flag local de "aguardando" viajar para o Firestore.
const labSync13EstadoPublicoSync17Base_=labSync13EstadoPublico_;
labSync13EstadoPublico_=function(){
    const clone=labSync13EstadoPublicoSync17Base_.apply(this,arguments);
    for(const t of (clone.tokens||[]))delete t._acaoObjetoPendente17;
    return clone;
};




// ============================================================

function labPericiasExploracao22_(t){
    const lista=(labUniversalPericiasGerais_(t)||[]).slice();
    const ps=labPrimeirosSocorrosPericia_(t);
    if(ps&&!lista.some(p=>String(p.id)===String(ps.id)))lista.push(ps);
    return lista.sort((a,b)=>
        Number(labValorTeste_(t,b)||0)-Number(labValorTeste_(t,a)||0)
        || String(getNome(a)||'').localeCompare(String(getNome(b)||''),'pt-BR')
    );
}

// EXP-SYNC-18
// 1) Painel de ações também fora de combate.
// 2) Testes de arma fora de combate: rolagem + dano, sem alvo/efeitos.
// 3) Perícias e Psi fora de combate continuam disponíveis.
// 4) Ataque do PJ enviado ao mestre fixa corretamente o alvo no motor.
// 5) PM do mestre é reconhecido também pelo cadastro local do mestre.
// ============================================================

const labExplorarUi18_=new Map();

function labExplorarAtor18_(){
    if(labEstado_.fase==='combate')return null;
    return labAtorEfetivoE6_();
}

function labExplorarCfg18_(t){
    if(!t)return null;
    const id=String(t.id);
    if(!labExplorarUi18_.has(id)){
        labExplorarUi18_.set(id,{
            modo:'combate',
            periciaAtaque:'',
            equipamento:'',
            periciaGeral:'',
            poderId:'',
            pp:0,
            alvoId:''
        });
    }
    const cfg=labExplorarUi18_.get(id);
    const c=labCharToken_(t);
    const ataques=labPericiasAtaque_(t)||[];
    const gerais=labPericiasExploracao22_(t);
    const poderes=labPsiPoderes_(t)||[];

    if(!ataques.some(p=>batalhaTokenPericia_(p)===cfg.periciaAtaque))
        cfg.periciaAtaque=batalhaTokenPericia_(ataques[0]||{});
    const perAtk=ataques.find(p=>batalhaTokenPericia_(p)===cfg.periciaAtaque)||ataques[0]||null;
    const eq=perAtk&&c?batalhaEquipamentos_(c,perAtk,cfg.equipamento):[];
    if(!eq.some(x=>String(x.valor)===String(cfg.equipamento)))
        cfg.equipamento=String(eq[0]?.valor||'');

    if(!gerais.some(p=>String(p.id)===String(cfg.periciaGeral)))
        cfg.periciaGeral=String(gerais[0]?.id||'');

    if(!poderes.some(p=>String(p.id)===String(cfg.poderId)))
        cfg.poderId=String(poderes[0]?.id||'');

    const poder=poderes.find(p=>String(p.id)===String(cfg.poderId))||null;
    if(poder){
        const alvos=labPsiAlvos_(t,poder)||[];
        if(alvos.length===1&&String(alvos[0].id)===String(t.id))cfg.alvoId=String(t.id);
        if(cfg.alvoId&&!alvos.some(a=>String(a.id)===String(cfg.alvoId)))cfg.alvoId='';
        const alvo=cfg.alvoId?labPsiAlvoPorId_(cfg.alvoId):null;
        const min=poder.id==='mover_objeto'&&alvo?labPsiMoverCustoKg_(poder,alvo):Math.max(0,Number(poder.custo||0));
        if(!Number.isFinite(Number(cfg.pp))||Number(cfg.pp)<min)cfg.pp=min;
    }
    return cfg;
}

window.labExplorarModo18_=function(v){
    const t=labExplorarAtor18_();if(!t)return;
    const cfg=labExplorarCfg18_(t);cfg.modo=String(v||'combate');
    labRender_();
};
window.labExplorarSegundo18_=function(v){
    const t=labExplorarAtor18_();if(!t)return;
    const cfg=labExplorarCfg18_(t);
    if(cfg.modo==='outras')cfg.periciaGeral=String(v||'');
    else if(cfg.modo==='psi'){cfg.poderId=String(v||'');cfg.alvoId='';cfg.pp=0;}
    else{cfg.equipamento=String(v||'');}
    labExplorarCfg18_(t);
    labRender_();
};
window.labExplorarPrimeiro18_=function(v){
    const t=labExplorarAtor18_();if(!t)return;
    const cfg=labExplorarCfg18_(t);
    if(v==='__outras__')cfg.modo='outras';
    else if(v==='__psi__')cfg.modo='psi';
    else{cfg.modo='combate';cfg.periciaAtaque=String(v||'');cfg.equipamento='';}
    labExplorarCfg18_(t);
    labRender_();
};
window.labExplorarPP18_=function(v){
    const t=labExplorarAtor18_();if(!t)return;
    const cfg=labExplorarCfg18_(t);
    cfg.pp=Math.max(0,Math.floor(Number(v)||0));
    labExplorarCfg18_(t);
    labRender_();
};

function labExplorarAnotar18_(t,txt){
    const final=`${txt} jogador não está em combate.`;
    labRegistrarResultadoProprio_(t,final);
    labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${t.nome}: ${final}`});
    if(labEstado_.logLab.length>120)labEstado_.logLab.length=120;
    return final;
}

function labExplorarResolverPericia18_(t,payload){
    const per=labPericiasExploracao22_(t).find(p=>String(p.id)===String(payload.periciaGeral));
    if(!per)return false;
    const valor=Math.max(0,Number(labValorTeste_(t,per)||0));
    const roll=1+Math.floor(Math.random()*100);
    const r=classificarD100_(valor,roll);
    labExplorarAnotar18_(t,`Teste: ${getNome(per)} ${roll}/${valor} → ${r.grau}.`);
    try{somDado_();if(r.grau==='Crítico')somCritico_();else if(r.grau==='Fiasco')somFiasco_();}catch(_){}
    return true;
}

function labExplorarResolverArma18_(t,payload){
    const c=labCharToken_(t);if(!c)return false;
    const ataques=labPericiasAtaque_(t)||[];
    const per=ataques.find(p=>batalhaTokenPericia_(p)===String(payload.periciaAtaque))||ataques[0];
    if(!per)return false;

    t.periciaLab=batalhaTokenPericia_(per);
    t.equipamentoLab=String(payload.equipamento||'');
    const eq=batalhaEquipamentos_(c,per,t.equipamentoLab)||[];
    if(!eq.some(x=>String(x.valor)===String(t.equipamentoLab)))
        t.equipamentoLab=String(eq[0]?.valor||'');
    const item=labItemSelecionado_(t);
    if(!item)return false;

    const valor=Math.max(0,Number(labValorPericiaAtaque_(c,per,null,item)||0));
    const roll=1+Math.floor(Math.random()*100);
    const r=classificarD100_(valor,roll);
    const expr=String(item?.dano||item?.damage||'').trim();
    const dr=expr?rolarExpressaoDanoCombate_(expr):null;
    const dano=dr&&Number.isFinite(Number(dr.total))?` · dano ${Number(dr.total)}`:'';
    labExplorarAnotar18_(t,`Teste de arma: ${getNome(per)} ${roll}/${valor} → ${r.grau} · ${getNome(item)}${dano}.`);
    try{somDado_();if(r.grau==='Crítico')somCritico_();else if(r.grau==='Fiasco')somFiasco_();}catch(_){}
    return true;
}

function labExplorarResolverPsi18_(t,payload){
    const p=(labPsiPoderes_(t)||[]).find(x=>String(x.id)===String(payload.poderId));
    if(!p)return false;

    let alvo=payload.alvoId?labPsiAlvoPorId_(payload.alvoId):null;
    const validos=labPsiAlvos_(t,p)||[];
    if(!alvo&&validos.length===1&&String(validos[0].id)===String(t.id))alvo=t;
    if(!alvo||!validos.some(x=>String(x.id)===String(alvo.id)))return false;

    const feridas=labPsiEhCura_(p)?labFeridasTrataveis_(alvo):[];
    const oldAcoes=Number(t.acoesAtuaisLab||0);
    const oldTokenAtual=labTokenAtual_;
    const oldSync=labAgendarSyncRemoto_;

    t.acoesAtuaisLab=Math.max(1,oldAcoes);
    t.acaoAuxLab={
        tipo:'psiquismo',
        poderId:String(p.id),
        alvoId:String(alvo.id),
        custo:Math.max(0,Number(payload.pp||p.custo||0)),
        local:feridas[0]?.local||''
    };

    let antes=String(t.ultimoResultadoProprioLab||'');
    try{
        labTokenAtual_=()=>t;
        
        labUsarPsiExecutar_();
    }finally{
        labTokenAtual_=oldTokenAtual;
        
        t.acoesAtuaisLab=oldAcoes;
    }

    const atual=String(t.ultimoResultadoProprioLab||'');
    if(atual&&atual!==antes&&!/jogador não está em combate/i.test(atual)){
        t.ultimoResultadoProprioLab=`${atual} jogador não está em combate.`;
        if(Array.isArray(t.historicoPrivadoLab)&&t.historicoPrivadoLab.length){
            const h=t.historicoPrivadoLab[0];
            if(typeof h==='string'&&!/jogador não está em combate/i.test(h))t.historicoPrivadoLab[0]=`${h} jogador não está em combate.`;
            else if(h&&typeof h==='object'&&h.texto&&!/jogador não está em combate/i.test(h.texto))h.texto=`${h.texto} jogador não está em combate.`;
        }
        if(Array.isArray(labEstado_.logLab)&&labEstado_.logLab.length){
            const h=labEstado_.logLab[0];
            if(h?.texto&&!/jogador não está em combate/i.test(h.texto))h.texto=`${h.texto} jogador não está em combate.`;
        }
    }
    return true;
}

function labExplorarResolver18_(t,payload){
    if(!t||labEstado_.fase==='combate')return false;
    let ok=false;
    if(payload.modo==='outras')ok=labExplorarResolverPericia18_(t,payload);
    else if(payload.modo==='psi')ok=labExplorarResolverPsi18_(t,payload);
    else ok=labExplorarResolverArma18_(t,payload);

    if(ok){
        labSalvarLocal_();
        if(batalhaEhMestre_())labAgendarSyncRemoto_();
        labRender_();
    }
    return ok;
}

window.labExplorarExecutar18_=function(){
    const t=labExplorarAtor18_();if(!t)return;
    const cfg=labExplorarCfg18_(t);
    const payload={
        modo:cfg.modo,
        periciaAtaque:cfg.periciaAtaque,
        equipamento:cfg.equipamento,
        periciaGeral:cfg.periciaGeral,
        poderId:cfg.poderId,
        pp:cfg.pp,
        alvoId:cfg.alvoId
    };

    if(batalhaEhMestre_()){
        labExplorarResolver18_(t,payload);
        return;
    }

    labEnviarComandoJogador_('explorar_auto18',payload,t);
};

// ------------------------------------------------------------
// Escolha de alvo Psi fora de combate diretamente no mapa.
// ------------------------------------------------------------
function labExplorarTentarAlvo18_(alvo){
    const ator=labExplorarAtor18_();
    if(!ator||!alvo)return false;
    const cfg=labExplorarCfg18_(ator);
    if(cfg.modo!=='psi')return false;
    const p=(labPsiPoderes_(ator)||[]).find(x=>String(x.id)===String(cfg.poderId));
    if(!p)return false;
    const validos=labPsiAlvos_(ator,p)||[];
    if(!validos.some(x=>String(x.id)===String(alvo.id)))return false;
    if(String(alvo.id)===String(ator.id))return false;
    cfg.alvoId=String(alvo.id);
    labRender_();
    return true;
}

const labPointerDownSync18Base_=window.labPointerDown_;
window.labPointerDown_=function(ev,id){
    if(labEstado_.fase!=='combate'){
        const alvo=labTokenPorId_(id);
        if(alvo&&labExplorarTentarAlvo18_(alvo)){
            ev.preventDefault();ev.stopPropagation();return;
        }
    }
    return labPointerDownSync18Base_.apply(this,arguments);
};

const labObjetoPointerDownSync18Base_=window.labObjetoPointerDown_;
window.labObjetoPointerDown_=function(ev,id){
    if(labEstado_.fase!=='combate'){
        const alvo=labObjetoPorId_(id);
        if(alvo&&labExplorarTentarAlvo18_(alvo)){
            ev.preventDefault();ev.stopPropagation();return;
        }
    }
    return labObjetoPointerDownSync18Base_.apply(this,arguments);
};

// ------------------------------------------------------------
// Painel fora de combate.
// ------------------------------------------------------------
function labRenderPainelExploracao18_(el,t){
    if(labReducing_)return;
    const c=labCharToken_(t);
    if(!c){el.style.display='none';el.innerHTML='';return;}

    const cfg=labExplorarCfg18_(t);
    const ataques=labPericiasAtaque_(t)||[];
    const gerais=labPericiasExploracao22_(t);
    const poderes=labPsiPoderes_(t)||[];

    const primeiro=[
        ...ataques.map(p=>({v:batalhaTokenPericia_(p),n:`${getNome(p)} (${labValorPericiaAtaque_(c,p,null,null)}%)`})),
        {v:'__outras__',n:'🎲 Outras Perícias'},
        ...(temPsiquismoInvestido_(c)?[{v:'__psi__',n:`🔮 Psiquismo · ${labPsiRestantes_(t)}/${labPsiMax_(t)} PP`}]:[])
    ];

    let segundo=[],segValor='',descricao='',extra='',botao='';

    if(cfg.modo==='outras'){
        segundo=gerais.map(p=>({v:p.id,n:`${getNome(p)} (${labValorTeste_(t,p)}%)`}));
        segValor=cfg.periciaGeral;
        const per=gerais.find(p=>String(p.id)===String(segValor));
        descricao=getDescricao(per);
        botao=`<button class="btn-small btn-select" onclick="labExplorarExecutar18_()" ${!per?'disabled':''} style="width:100%;height:42px;margin:0;">🎲 Usar</button>`;
    }else if(cfg.modo==='psi'){
        segundo=poderes.map(p=>({v:p.id,n:`${getNome(p)} · ${p.esfera} A${Number(p.arco||1)}`}));
        segValor=cfg.poderId;
        const p=poderes.find(x=>String(x.id)===String(segValor));
        const alvo=cfg.alvoId?labPsiAlvoPorId_(cfg.alvoId):null;
        descricao=labDescricaoTraduzidaPsi_(p);
        const min=p?.id==='mover_objeto'&&alvo?labPsiMoverCustoKg_(p,alvo):Math.max(0,Number(p?.custo||0));
        const max=Math.max(min,labPsiRestantes_(t));
        extra=`<label style="margin:0;"><small style="display:block;margin-bottom:4px;">PP</small><input type="number" min="${min}" max="${max}" value="${Math.max(min,Number(cfg.pp||min))}" onchange="labExplorarPP18_(this.value)" style="width:100%;height:42px;margin:0;box-sizing:border-box;text-align:center;"></label>`;
        botao=`<button class="btn-small btn-select" onclick="labExplorarExecutar18_()" ${!p||!cfg.alvoId?'disabled':''} style="width:100%;height:42px;margin:0;">✨ Usar</button>`;
    }else{
        const per=ataques.find(p=>batalhaTokenPericia_(p)===cfg.periciaAtaque)||ataques[0];
        const eq=per?batalhaEquipamentos_(c,per,cfg.equipamento):[];
        segundo=eq.map(x=>({v:x.valor,n:x.rotulo}));
        segValor=cfg.equipamento;
        t.periciaLab=per?batalhaTokenPericia_(per):'';
        t.equipamentoLab=segValor;
        const item=labItemSelecionado_(t);
        descricao=[getDescricao(per),getDescricao(item),item?.dano?`🎲 Dano ${item.dano}`:''].filter(Boolean).join(' · ');
        botao=`<button class="btn-small btn-select" onclick="labExplorarExecutar18_()" ${!per||!item?'disabled':''} style="width:100%;height:42px;margin:0;">🎲 Testar</button>`;
    }

    const primeiroValor=cfg.modo==='outras'?'__outras__':cfg.modo==='psi'?'__psi__':cfg.periciaAtaque;
    const alvoPsi=cfg.modo==='psi'&&cfg.alvoId?labPsiAlvoPorId_(cfg.alvoId):null;

    el.style.display='block';
    el.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px;">
        <strong style="color:#ffd54a;">🎯 Ação de ${escaparHtmlInventario_(t.nome)}</strong>
        ${cfg.modo==='psi'?`<span style="font-size:.82em;color:#9fc6d8;">${alvoPsi?`🎯 ${escaparHtmlInventario_(alvoPsi.nome||alvoPsi.name||labObjetoModelo_(alvoPsi)?.nome||'Alvo')}`:'🎯 Clique no alvo, se necessário'}</span>`:''}
      </div>
      <div style="display:grid;grid-template-columns:minmax(180px,1.15fr) minmax(220px,1.25fr) minmax(100px,.55fr) minmax(120px,.6fr);gap:8px;align-items:end;">
        <label style="margin:0;"><small style="display:block;margin-bottom:4px;">Ação / Perícia</small><select onchange="labExplorarPrimeiro18_(this.value)" style="width:100%;margin:0;">${primeiro.map(x=>`<option value="${escaparHtmlInventario_(x.v)}" ${String(x.v)===String(primeiroValor)?'selected':''}>${escaparHtmlInventario_(x.n)}</option>`).join('')}</select></label>
        <label style="margin:0;"><small style="display:block;margin-bottom:4px;">${cfg.modo==='psi'?'Poder':cfg.modo==='outras'?'Perícia':'Arma / ataque'}</small><select onchange="labExplorarSegundo18_(this.value)" style="width:100%;margin:0;">${segundo.map(x=>`<option value="${escaparHtmlInventario_(x.v)}" ${String(x.v)===String(segValor)?'selected':''}>${escaparHtmlInventario_(x.n)}</option>`).join('')||'<option>—</option>'}</select></label>
        <div>${extra}</div>
        <div>${botao}</div>
      </div>
      ${descricao?`<div class="lab-action-description-inline" style="margin-top:7px;"><b style="margin-right:5px">ℹ️</b>${escaparHtmlInventario_(descricao)}</div>`:''}
      ${labResumoPVHtml_(t,'SEUS PV')}
      ${t?.ultimoResultadoProprioLab?`<div style="margin-top:7px;padding:6px 8px;border-radius:7px;background:rgba(255,255,255,.05);">${escaparHtmlInventario_(t.ultimoResultadoProprioLab)}</div>`:''}`;
}

const labRenderActionPanelSync18Base_=labRenderActionPanel_;
labRenderActionPanel_=function(){
    if(labEstado_.fase!=='combate'){
        const el=document.getElementById('labActionPanel');if(!el)return;
        const t=labExplorarAtor18_();
        if(!t){el.style.display='none';el.innerHTML='';return;}
        return labRenderPainelExploracao18_(el,t);
    }
    return labRenderActionPanelSync18Base_.apply(this,arguments);
};
window.labRenderActionPanel_=labRenderActionPanel_;

// ------------------------------------------------------------
// PM/NPC/Monstro do mestre: classificação robusta.
// Personagens existentes em userCharacters da conta mestre são PM.
// ------------------------------------------------------------
const labTipoTokenSync18Base_=labTipoToken16_;
labTipoToken16_=function(t){
    if(!t)return '';
    const base=labTipoTokenSync18Base_(t);
    if(base==='NPC'||base==='Monstro')return base;

    if(batalhaEhMestre_()){
        const ids=new Set([String(t.id||''),String(t.origemId||''),String(t.charLab?.id||'')].filter(Boolean));
        if((userCharacters||[]).some(c=>ids.has(String(c.id||''))))return 'PM';
    }
    return base;
};
labTokenControladoMestre16_=function(t){
    if(!batalhaEhMestre_()||!t)return false;
    return ['PM','NPC','Monstro'].includes(labTipoToken16_(t));
};
labGrupoTokenE6_=function(t){return labTipoToken16_(t);};
labMestreControlaTurnoE6_=function(t){return labTokenControladoMestre16_(t);};

// ------------------------------------------------------------
// Ataque/defesa enviados pelo PJ: processamento final e explícito.
// ------------------------------------------------------------
function labUidPertenceToken18_(t,uid){
    const alvo=String(uid||'');
    if(!t||!alvo)return false;
    const c=labCharToken_(t);
    return [
        t.donoUid,t.dono,t.charLab?.donoUid,t.charLab?.dono,c?.donoUid,c?.dono
    ].some(v=>String(v||'')===alvo);
}

const labProcessarComandoJogadorSync18Base_=labProcessarComandoJogador_;


// Pós-render final usa painel da exploração/combatente atual.
const labRenderSync18Base_=labRender_;

window.labRender_=labRender_;




// ============================================================
// EXP-SYNC-19
// Combate remoto autoritativo sem tirar decisões do jogador:
// - efeitos especiais ganhos pelo PJ são escolhidos pelo próprio jogador;
// - localização especial também é escolhida pelo jogador;
// - rolagem de dano do PJ é solicitada pelo jogador e resolvida no mestre;
// - PM/NPC/Monstro do mestre recebem o painel completo no próprio turno
//   e quando precisam reagir/defender;
// - PJ externo nunca é tratado como personagem controlado pelo mestre.
// ============================================================

function labTokenMestre19_(t){
    if(!batalhaEhMestre_()||!t)return false;

    const tipo=normalizarTextoCombate_(String(
        t.tipo || t.charLab?.tipo || ''
    ));
    if(t.criaturaBancoId || t.charLab?.criaturaBancoId || /criatura|monstro/.test(tipo))return true;
    if(t.npcBancoId || t.charLab?.npcBancoId || tipo==='npc' || tipo==='npc rapido' || tipo==='npc_rapido')return true;

    const uid=String(currentUserUid||currentUser?.uid||'');
    const donos=[
        t.donoUid,t.dono,
        t.charLab?.donoUid,t.charLab?.dono
    ].map(v=>String(v||'')).filter(Boolean);
    if(uid&&donos.includes(uid))return true;

    const ids=new Set([
        String(t.id||''),
        String(t.origemId||''),
        String(t.charLab?.id||'')
    ].filter(Boolean));

    const local=(userCharacters||[]).find(c=>ids.has(String(c?.id||'')));
    if(local){
        const dono=String(local.donoUid||local.dono||'');
        if(!dono || dono===uid)return true;
    }

    const c=labCharToken_(t);
    if(c){
        const dono=String(c.donoUid||c.dono||'');
        if(dono&&dono===uid)return true;
        if((userCharacters||[]).some(x=>String(x?.id||'')===String(c.id||'')))return true;
    }

    return false;
}

function labGrupo19_(t){
    if(!t)return '';
    const tipo=normalizarTextoCombate_(String(t.tipo||t.charLab?.tipo||''));
    if(t.criaturaBancoId||t.charLab?.criaturaBancoId||/criatura|monstro/.test(tipo))return 'Monstro';
    if(t.npcBancoId||t.charLab?.npcBancoId||tipo==='npc'||tipo==='npc rapido'||tipo==='npc_rapido')return 'NPC';
    return labTokenMestre19_(t)?'PM':'PJ';
}

labTipoToken16_=function(t){return labGrupo19_(t);};
labTokenControladoMestre16_=function(t){return labTokenMestre19_(t);};
labGrupoTokenE6_=function(t){return labGrupo19_(t);};
labMestreControlaTurnoE6_=function(t){return labTokenMestre19_(t);};

// ------------------------------------------------------------
// Efeitos especiais e dano do jogador: o jogador decide,
// o mestre apenas executa no estado autoritativo.
// ------------------------------------------------------------
const labEscolherEfeitoSync19Base_=window.labEscolherEfeito_;
const labConfirmarLocalizacaoSync19Base_=window.labConfirmarLocalizacao_;
const labPularEfeitosSync19Base_=window.labPularEfeitos_;
const labRolarDanoSync19Base_=window.labRolarDano_;

function labAtacantePendenteDoJogador19_(){
    if(batalhaEhMestre_())return null;
    const dp=labEstado_.danoPendenteLab;
    if(!dp)return null;
    const t=labTokenPorId_(dp.atacanteId);
    return t&&labTokenPertenceAoJogador15_(t)?t:null;
}

function labEnviarResolucaoAtaque19_(tipo,payload={}){
    const t=labAtacantePendenteDoJogador19_();
    const dp=labEstado_.danoPendenteLab;
    if(!t||!dp)return;
    labEnviarComandoJogador_(
        tipo,
        {...payload,danoPendenteId:String(dp.id||'')},
        t
    );
}

window.labEscolherEfeito_=function(id){
    if(batalhaEhMestre_())return labEscolherEfeitoSync19Base_.apply(this,arguments);
    if(!labAtacantePendenteDoJogador19_())return;

    const efeito=String(id||'');
    labEnviarResolucaoAtaque19_('efeito_especial19',{efeito});
};

window.labConfirmarLocalizacao_=function(loc){
    if(batalhaEhMestre_())return labConfirmarLocalizacaoSync19Base_.apply(this,arguments);
    if(!labAtacantePendenteDoJogador19_())return;

    labEnviarResolucaoAtaque19_('efeito_localizacao19',{local:String(loc||'')});
};

window.labPularEfeitos_=function(){
    if(batalhaEhMestre_())return labPularEfeitosSync19Base_.apply(this,arguments);
    if(!labAtacantePendenteDoJogador19_())return;

    labEnviarResolucaoAtaque19_('efeito_pular19',{});
};

window.labRolarDano_=function(){
    if(batalhaEhMestre_())return labRolarDanoSync19Base_.apply(this,arguments);
    if(!labAtacantePendenteDoJogador19_())return;

    labEnviarResolucaoAtaque19_('dano19',{});
};

// ------------------------------------------------------------
// Processamento no mestre das decisões do atacante PJ.
// ------------------------------------------------------------
const labProcessarComandoJogadorSync19Base_=labProcessarComandoJogador_;



// ------------------------------------------------------------
// Depois de um ataque remoto, limpar efeitos impossíveis sem
// transferir uma escolha real para o mestre.
// ------------------------------------------------------------
function labSanearEfeitosPJ19_(){
    if(!batalhaEhMestre_())return;
    const dp=labEstado_.danoPendenteLab;
    if(!dp||Number(dp.efeitosRestantes||0)<=0||dp.escolhendoLocalizacao)return;

    const a=labTokenPorId_(dp.atacanteId);
    if(!a||labTokenMestre19_(a))return;

    let efs=[];
    try{efs=labEfeitosDisponiveis_(dp)||[];}catch(_){}
    if(!efs.length){
        dp.efeitosRestantes=0;
        labSalvarLocal_();
        labAgendarSyncRemoto_();
    }
}

// ------------------------------------------------------------
// Painel especial do PJ atacante.
// ------------------------------------------------------------
function labRenderResolucaoPJ19_(el,dp,a,d){
    if(labReducing_)return;
    const rest=Math.max(0,Number(dp.efeitosRestantes||0));

    if(rest>0){
        if(dp.escolhendoLocalizacao){
            const st=d?labGarantirSnapshotCombate_(d):null;
            const locs=Object.keys(st?.hitMax||{});
            el.style.display='block';
            el.innerHTML=`<div>
                <strong style="color:#ffd54a;">🎯 Escolher localização</strong>
                <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;">
                    ${locs.map(loc=>`<button class="btn-small" onclick="labConfirmarLocalizacao_('${String(loc).replace(/'/g,"\\'")}')" style="min-height:42px;">${escaparHtmlInventario_(loc)}</button>`).join('')}
                </div>
            </div>`;
            return;
        }

        let efs=[];
        try{efs=labEfeitosDisponiveis_(dp)||[];}catch(_){}

        if(!efs.length){
            el.style.display='block';
            el.innerHTML='<div style="color:#9fc6d8;">Resolvendo ataque…</div>';
            const key=String(dp.id||'');
            if(window.__LAB_SKIP19__!==key){
                window.__LAB_SKIP19__=key;
                0;
            }
            return;
        }

        el.style.display='block';
        el.innerHTML=`<div>
            <strong style="color:#ffd54a;">✨ ${rest} efeito(s) especial(is)</strong>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px;">
                ${efs.map(e=>`<button class="btn-small btn-select" onclick="labEscolherEfeito_('${e.id}')" style="min-height:44px;">${e.nome}</button>`).join('')}
                <button class="btn-small" onclick="labPularEfeitos_()" style="min-height:44px;">Ignorar efeitos</button>
            </div>
        </div>`;
        return;
    }

    const expr=labExpressaoDano_(a,dp.item);
    el.style.display='block';
    el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div>
            <strong style="color:#ffd54a;">💥 Ataque acertou</strong>
            <br><small style="color:#bbb;">${escaparHtmlInventario_(getNome(dp.item)||dp.item?.nome||'Ataque')} · dano ${escaparHtmlInventario_(expr||'—')}</small>
        </div>
        <button class="btn-small btn-select" onclick="labRolarDano_()" style="height:48px;min-width:170px;padding:0 20px;font-size:1em;">💥 Rolar dano</button>
    </div>`;
}

// ------------------------------------------------------------
// Painel de combate final.
// ------------------------------------------------------------
const labRenderActionPanelSync19Base_=labRenderActionPanel_;

labRenderActionPanel_=function(){
    const el=document.getElementById('labActionPanel');
    if(!el)return;

    // Fora de combate permanece a implementação da SYNC18.
    if(labEstado_.fase!=='combate'){
        return labRenderActionPanelSync19Base_.apply(this,arguments);
    }

    const pend=labEstado_.pendenciaLab;
    const dp=labEstado_.danoPendenteLab;

    // CONTA DO JOGADOR
    if(!batalhaEhMestre_()){
        const meu=labTokenProprioJogador15_();
        const meuId=String(meu?.id||'');

        if(pend){
            const d=labTokenPorId_(pend.defensorId);
            const a=labTokenPorId_(pend.atacanteId);

            if(d&&String(d.id)===meuId){
                return labRenderActionPanelE6Base_.apply(this,arguments);
            }

            if(a&&String(a.id)===meuId){
                el.style.display='block';
                el.innerHTML='<div style="min-height:30px;color:#9fc6d8;">Aguardando reação do alvo…</div>';
                return;
            }

            el.style.display='none';
            el.innerHTML='';
            return;
        }

        if(dp){
            const a=labTokenPorId_(dp.atacanteId);
            const d=labTokenPorId_(dp.defensorId);

            if(a&&String(a.id)===meuId){
                return labRenderResolucaoPJ19_(el,dp,a,d);
            }

            el.style.display='none';
            el.innerHTML='';
            return;
        }

        const atual=labTokenAtual_();
        if(atual&&String(atual.id)===meuId){
            return labRenderActionPanelE6Base_.apply(this,arguments);
        }

        el.style.display='none';
        el.innerHTML='';
        return;
    }

    // CONTA DO MESTRE
    if(pend){
        const d=labTokenPorId_(pend.defensorId);

        if(d&&labTokenMestre19_(d)){
            // A implementação original reconstrói o painel de defesa completo.
            return labRenderActionPanelE6Base_.apply(this,arguments);
        }

        el.style.display='block';
        el.innerHTML='<div style="min-height:30px;color:#9fc6d8;">Aguardando reação do jogador…</div>';
        return;
    }

    if(dp){
        const a=labTokenPorId_(dp.atacanteId);

        if(a&&labTokenMestre19_(a)){
            // Efeitos especiais e dano de PM/NPC/Monstro são decididos no mestre.
            return labRenderActionPanelE6Base_.apply(this,arguments);
        }

        el.style.display='block';
        el.innerHTML='<div style="min-height:30px;color:#9fc6d8;">Aguardando resolução do jogador…</div>';
        return;
    }

    const atual=labTokenAtual_();
    if(!atual){
        el.style.display='none';
        el.innerHTML='';
        return;
    }

    if(labTokenMestre19_(atual)){
        // Painel completo do PM/NPC/Monstro da oportunidade.
        return labRenderActionPanelE6Base_.apply(this,arguments);
    }

    el.style.display='block';
    el.innerHTML=`<div style="min-height:30px;color:#9fc6d8;">
        <strong style="color:#ffd54a;">${escaparHtmlInventario_(atual.nome||'PJ')}</strong>
        · aguardando a ação do jogador.
    </div>`;
};
window.labRenderActionPanel_=labRenderActionPanel_;

// ------------------------------------------------------------
// Barra superior do mestre acompanha a mesma autoridade do painel.
// ------------------------------------------------------------
const labAtualizarInfoSync19Base_=labAtualizarInfo_;
labAtualizarInfo_=function(){
    if(!batalhaEhMestre_()||labEstado_.fase!=='combate'){
        return labAtualizarInfoSync19Base_.apply(this,arguments);
    }

    let ctx=null;
    if(labEstado_.pendenciaLab){
        const d=labTokenPorId_(labEstado_.pendenciaLab.defensorId);
        if(d&&labTokenMestre19_(d))ctx=d;
    }
    if(!ctx&&labEstado_.danoPendenteLab){
        const a=labTokenPorId_(labEstado_.danoPendenteLab.atacanteId);
        if(a&&labTokenMestre19_(a))ctx=a;
    }
    if(!ctx){
        const atual=labTokenAtual_();
        if(atual&&labTokenMestre19_(atual))ctx=atual;
    }

    if(!ctx)return labAtualizarInfoSync19Base_.apply(this,arguments);

    const salvo=labEstado_.selecionadoId;
    try{
        labEstado_.selecionadoId=String(ctx.id);
        return labAtualizarInfoE6Base_.apply(this,arguments);
    }finally{
        labEstado_.selecionadoId=salvo;
    }
};
window.labAtualizarInfo_=labAtualizarInfo_;

// ------------------------------------------------------------
// Render final.
// ------------------------------------------------------------
const labRenderSync19Base_=labRender_;

window.labRender_=labRender_;




// ============================================================
// EXP-SYNC-20
// Correção de autoridade: PJ de outra conta nunca pode ser reclassificado
// como PM só porque sua ficha aparece em userCharacters na conta do mestre.
// O donoUid explícito tem prioridade absoluta.
// ============================================================

function labOwnerUid20_(t){
    if(!t)return '';
    const c=labCharToken_(t);
    return String(
        t?.donoUid ||
        t?.charLab?.donoUid ||
        c?.donoUid ||
        t?.dono ||
        t?.charLab?.dono ||
        c?.dono ||
        ''
    );
}

const labTokenMestreSync20Base_=labTokenMestre19_;
labTokenMestre19_=function(t){
    if(!batalhaEhMestre_()||!t)return false;

    const tipo=normalizarTextoCombate_(String(t.tipo||t.charLab?.tipo||''));
    if(t.criaturaBancoId||t.charLab?.criaturaBancoId||/criatura|monstro/.test(tipo))return true;
    if(t.npcBancoId||t.charLab?.npcBancoId||tipo==='npc'||tipo==='npc rapido'||tipo==='npc_rapido')return true;

    const mestreUid=String(currentUserUid||currentUser?.uid||'');
    const dono=labOwnerUid20_(t);

    // Regra decisiva: se existe dono explícito e não é o mestre, é PJ externo.
    if(dono && mestreUid && dono!==mestreUid)return false;

    // Se o dono explícito é o mestre, é PM.
    if(dono && mestreUid && dono===mestreUid)return true;

    // Só quando NÃO há dono explícito usamos o fallback de ficha local.
    return labTokenMestreSync20Base_(t);
};

labGrupo19_=function(t){
    if(!t)return '';
    const tipo=normalizarTextoCombate_(String(t.tipo||t.charLab?.tipo||''));

    if(t.criaturaBancoId||t.charLab?.criaturaBancoId||/criatura|monstro/.test(tipo))return 'Monstro';
    if(t.npcBancoId||t.charLab?.npcBancoId||tipo==='npc'||tipo==='npc rapido'||tipo==='npc_rapido')return 'NPC';

    const mestreUid=String(currentUserUid||currentUser?.uid||'');
    const dono=labOwnerUid20_(t);

    if(batalhaEhMestre_() && dono && mestreUid && dono!==mestreUid)return 'PJ';
    if(batalhaEhMestre_() && dono && mestreUid && dono===mestreUid)return 'PM';

    return labTokenMestre19_(t)?'PM':'PJ';
};

labTipoToken16_=function(t){return labGrupo19_(t);};
labTokenControladoMestre16_=function(t){return labTokenMestre19_(t);};
labGrupoTokenE6_=function(t){return labGrupo19_(t);};
labMestreControlaTurnoE6_=function(t){return labTokenMestre19_(t);};

// Re-render final para corrigir imediatamente rótulo/painel após snapshots.
const labRenderSync20Base_=labRender_;

window.labRender_=labRender_;




// ============================================================
// EXP-SYNC-21
// Painel de personagem persistente.
// - PJ/PM/NPC/Monstro mantêm painel de perícias visível.
// - Só some para o mestre quando "Atuar como Mestre" fora de combate.
// - Jogador: no próprio turno, o painel troca automaticamente para o PJ da vez;
//   fora do próprio turno, mostra o PJ selecionado/local.
// - Mestre: durante combate, painel acompanha turno/reação automaticamente.
// - Quando o usuário não é a autoridade daquele participante, o painel fica
//   visível para consulta, mas sem executar ações.
// ============================================================

let labJogadorPainelSelecionado21_='';

function labEhTokenDoJogador21_(t){
    if(!t||batalhaEhMestre_())return false;
    const uid=String(currentUserUid||currentUser?.uid||'');
    return !!uid && String(labOwnerUid20_(t)||t.donoUid||'')===uid;
}

function labTokensDoJogador21_(){
    if(batalhaEhMestre_())return [];
    return (labEstado_.tokens||[]).filter(labEhTokenDoJogador21_);
}

function labTokenPainelJogador21_(){
    const meus=labTokensDoJogador21_();
    if(!meus.length)return null;

    // Durante o turno de um PJ desta conta, ele tem prioridade absoluta.
    if(labEstado_.fase==='combate'){
        const atual=labTokenAtual_();
        if(atual&&labEhTokenDoJogador21_(atual)){
            labJogadorPainelSelecionado21_=String(atual.id);
            return atual;
        }

        // Se o próprio PJ estiver defendendo ou resolvendo seu ataque, ele também
        // tem prioridade sobre a seleção manual.
        const pend=labEstado_.pendenciaLab;
        if(pend){
            const d=labTokenPorId_(pend.defensorId);
            if(d&&labEhTokenDoJogador21_(d)){
                labJogadorPainelSelecionado21_=String(d.id);
                return d;
            }
        }

        const dp=labEstado_.danoPendenteLab;
        if(dp){
            const a=labTokenPorId_(dp.atacanteId);
            if(a&&labEhTokenDoJogador21_(a)){
                labJogadorPainelSelecionado21_=String(a.id);
                return a;
            }
        }
    }

    const local=labJogadorPainelSelecionado21_
        ? meus.find(t=>String(t.id)===String(labJogadorPainelSelecionado21_))
        : null;
    if(local)return local;

    const sid=String(labEstado_.selecionadoId||'');
    const sel=meus.find(t=>String(t.id)===sid);
    if(sel){
        labJogadorPainelSelecionado21_=String(sel.id);
        return sel;
    }

    const cid=String(currentCharId||'');
    const atual=meus.find(t=>
        String(t.id||'')===cid ||
        String(t.origemId||'')===cid ||
        String(t.charLab?.id||'')===cid
    );
    if(atual){
        labJogadorPainelSelecionado21_=String(atual.id);
        return atual;
    }

    labJogadorPainelSelecionado21_=String(meus[0].id);
    return meus[0];
}

function labTokenPainelMestre21_(){
    if(!batalhaEhMestre_())return null;

    if(labEstado_.fase!=='combate'){
        if(labModoMestreE6_())return null;
        return labAtorEfetivoE6_();
    }

    const pend=labEstado_.pendenciaLab;
    if(pend){
        const d=labTokenPorId_(pend.defensorId);
        if(d)return d;
    }

    const dp=labEstado_.danoPendenteLab;
    if(dp){
        const a=labTokenPorId_(dp.atacanteId);
        if(a)return a;
    }

    return labTokenAtual_();
}

function labTokenPainel21_(){
    return batalhaEhMestre_()?labTokenPainelMestre21_():labTokenPainelJogador21_();
}

function labUsuarioPodeAgirComPainel21_(t){
    if(!t)return false;

    if(labEstado_.fase!=='combate'){
        if(batalhaEhMestre_())return !labModoMestreE6_() && String(labAtorEfetivoE6_()?.id||'')===String(t.id);
        return labEhTokenDoJogador21_(t);
    }

    if(batalhaEhMestre_()){
        const pend=labEstado_.pendenciaLab;
        if(pend&&String(pend.defensorId)===String(t.id))return labTokenMestre19_(t);

        const dp=labEstado_.danoPendenteLab;
        if(dp&&String(dp.atacanteId)===String(t.id))return labTokenMestre19_(t);

        const atual=labTokenAtual_();
        return !!atual && String(atual.id)===String(t.id) && labTokenMestre19_(t);
    }

    const pend=labEstado_.pendenciaLab;
    if(pend&&String(pend.defensorId)===String(t.id))return labEhTokenDoJogador21_(t);

    const dp=labEstado_.danoPendenteLab;
    if(dp&&String(dp.atacanteId)===String(t.id))return labEhTokenDoJogador21_(t);

    const atual=labTokenAtual_();
    return !!atual && String(atual.id)===String(t.id) && labEhTokenDoJogador21_(t);
}

function labRenderPainelConsulta21_(el,t){
    if(labReducing_)return;
    if(!el||!t)return;

    // Reaproveita o painel de perícias da exploração para manter todas as
    // especializações/perícias/psi visíveis durante a espera.
    labRenderPainelExploracao18_(el,t);

    // Em combate, se não for a vez/reação deste usuário, o painel fica apenas
    // consultivo. Seletores permanecem visíveis; ações não podem ser executadas.
    if(labEstado_.fase==='combate'){
        for(const b of el.querySelectorAll('button')){
            b.disabled=true;
        }
    }
}

function labRenderPainelPersistente21_(){
    if(labReducing_)return;
    const el=document.getElementById('labActionPanel');
    if(!el)return;

    const t=labTokenPainel21_();

    // Único caso em que o mestre fica sem painel.
    if(batalhaEhMestre_() && labEstado_.fase!=='combate' && labModoMestreE6_()){
        el.style.display='none';
        el.innerHTML='';
        return;
    }

    if(!t){
        el.style.display='none';
        el.innerHTML='';
        return;
    }

    const podeAgir=labUsuarioPodeAgirComPainel21_(t);

    // Fora de combate, sempre usa o painel de exploração completo.
    if(labEstado_.fase!=='combate'){
        return labRenderPainelExploracao18_(el,t);
    }

    // Durante combate, se este usuário controla o contexto atual, usa o painel
    // completo de combate, inclusive ataque, defesa, efeitos e dano.
    if(podeAgir){
        // Jogador resolvendo efeito especial/dano do próprio ataque.
        if(!batalhaEhMestre_() && labEstado_.danoPendenteLab
           && String(labEstado_.danoPendenteLab.atacanteId)===String(t.id)){
            const dp=labEstado_.danoPendenteLab;
            const d=labTokenPorId_(dp.defensorId);
            return labRenderResolucaoPJ19_(el,dp,t,d);
        }

        // Painel original é o mais completo para turno e defesa.
        return labRenderActionPanelE6Base_.apply(this,arguments);
    }

    // Outro participante está agindo. O painel do personagem continua visível,
    // mas apenas para consulta.
    return labRenderPainelConsulta21_(el,t);
}

// ------------------------------------------------------------
// Seleção local de PJ para contas que porventura tenham mais de um no mapa.
// O turno de combate continua tendo prioridade sobre esta seleção.
// ------------------------------------------------------------
const labSelecionarSync21Base_=window.labSelecionar_;
window.labSelecionar_=function(id){
    const t=labTokenPorId_(id);
    if(!batalhaEhMestre_()&&t&&labEhTokenDoJogador21_(t)){
        labJogadorPainelSelecionado21_=String(t.id);
    }
    const r=labSelecionarSync21Base_.apply(this,arguments);
    try{labRenderPainelPersistente21_();}catch(_){}
    return r;
};

// ------------------------------------------------------------
// "Atuar como" do mestre continua automático durante combate,
// mas o painel mostrado acompanha a mesma pessoa da iniciativa/reação.
// ------------------------------------------------------------
const labAtualizarAtuarComoSync21Base_=labAtualizarAtuarComoE6_;
labAtualizarAtuarComoE6_=function(){
    const r=labAtualizarAtuarComoSync21Base_.apply(this,arguments);

    if(batalhaEhMestre_()&&labEstado_.fase==='combate'){
        const sel=document.getElementById('labActAsE6');
        const t=labTokenPainelMestre21_();
        if(sel&&t){
            const g=labGrupo19_(t)||'Participante';
            const sufixo=(g==='PJ')?' · jogador':' · automático';
            sel.innerHTML=`<option value="">${escaparHtmlInventario_(`${g} · ${t.nome||'Sem nome'}${sufixo}`)}</option>`;
            sel.disabled=true;
        }
    }
    return r;
};

// ------------------------------------------------------------
// Painel final: não some entre oportunidades.
// ------------------------------------------------------------
labRenderActionPanel_=function(){
    return labRenderPainelPersistente21_();
};
window.labRenderActionPanel_=labRenderActionPanel_;

// ------------------------------------------------------------
// Barra de informações acompanha o mesmo personagem que o painel.
// ------------------------------------------------------------
const labAtualizarInfoSync21Base_=labAtualizarInfo_;
labAtualizarInfo_=function(){
    const t=labTokenPainel21_();
    if(!t)return labAtualizarInfoSync21Base_.apply(this,arguments);

    const salvo=labEstado_.selecionadoId;
    try{
        labEstado_.selecionadoId=String(t.id);
        return labAtualizarInfoE6Base_.apply(this,arguments);
    }finally{
        labEstado_.selecionadoId=salvo;
    }
};
window.labAtualizarInfo_=labAtualizarInfo_;

// ------------------------------------------------------------
// Mini painel contextual:
// a opção Atacar só aparece para quem realmente está na vez,
// mas nunca depende de o painel superior estar visível.
// ------------------------------------------------------------
const labMicroPainelSync21Base_=labMicroPainelHtml_;
labMicroPainelHtml_=function(alvoVisual,ppm,d){
    if(labEstado_.fase!=='combate'||!alvoVisual)return '';

    const atual=labTokenAtual_();
    if(!atual)return '';

    let autorizado=false;
    if(batalhaEhMestre_())autorizado=labTokenMestre19_(atual);
    else autorizado=labEhTokenDoJogador21_(atual);

    if(!autorizado)return '';

    return labMicroPainelSync21Base_.apply(this,arguments);
};

// ------------------------------------------------------------
// Render final.
// ------------------------------------------------------------
const labRenderSync21Base_=labRender_;

window.labRender_=labRender_;




// ============================================================
// EXP-SYNC-22
// Primeiros Socorros remoto + PV do alvo para o mestre.
// ============================================================

const labPSIniciarSync22Base_=window.labPSIniciar_;
const labPSContinuarSync22Base_=window.labPSContinuar_;
const labPSConcluirSync22Base_=window.labPSConcluir_;

window.labPSIniciar_=function(){
    if(batalhaEhMestre_())return labPSIniciarSync22Base_.apply(this,arguments);
    const t=labTokenAtual_(),a=t?.acaoAuxLab;
    if(!t||!a||a.tipo!=='primeiros_socorros')return;
    labEnviarComandoJogador_('ps_iniciar22',{alvoId:String(a.alvoId||''),local:String(a.local||'')},t);
};

window.labPSContinuar_=function(){
    if(batalhaEhMestre_())return labPSContinuarSync22Base_.apply(this,arguments);
    const t=labTokenAtual_();
    if(!t?.primeirosSocorrosLab)return;
    labEnviarComandoJogador_('ps_continuar22',{},t);
};

window.labPSConcluir_=function(){
    if(batalhaEhMestre_())return labPSConcluirSync22Base_.apply(this,arguments);
    const t=labTokenAtual_();
    if(!t?.primeirosSocorrosLab)return;
    labEnviarComandoJogador_('ps_concluir22',{},t);
};

const labProcessarComandoJogadorSync22Base_=labProcessarComandoJogador_;


// Mestre vê PV completos do último alvo/selecionado sem expor isso ao jogador.
function labAnexarPVAlvoMestre22_(){
    if(!batalhaEhMestre_()||labEstado_.fase!=='combate')return;
    const el=document.getElementById('labActionPanel');
    if(!el)return;

    let alvo=null;
    if(labEstado_.pendenciaLab)alvo=labTokenPorId_(labEstado_.pendenciaLab.defensorId);
    if(!alvo&&labEstado_.danoPendenteLab)alvo=labTokenPorId_(labEstado_.danoPendenteLab.defensorId);

    const atual=labTokenAtual_();
    if(!alvo&&atual?.alvoLab)alvo=labTokenPorId_(atual.alvoLab);
    if(!alvo&&labEstado_.ultimoAlvoDanoId22)alvo=labTokenPorId_(labEstado_.ultimoAlvoDanoId22);
    if(!alvo)return;

    const txt=el.textContent||'';
    if(txt.includes(`PV DO ALVO · ${alvo.nome}`)||txt.includes(`SEUS PV · ${alvo.nome}`))return;

    const box=document.createElement('div');
    box.className='lab-target-pv-master-22';
    box.style.marginTop='6px';
    box.innerHTML=labResumoPVHtml_(alvo,'PV DO ALVO');
    el.appendChild(box);
}

// Pequena redução do debounce do estado de combate.
// Mantém margem para evitar tempestade de writes, mas reduz a espera perceptível.
try{
    const labAgendarSyncRemoto22Base_=labAgendarSyncRemoto_;
    
}catch(_){}

const labRenderSync22Base_=labRender_;

window.labRender_=labRender_;




// ============================================================
// EXP-SYNC-23
// - seleção local de alvo do PJ não se perde com snapshots;
// - privacidade rígida do painel do jogador;
// - rótulo do token acima da miniatura, apenas hover/seleção/turno;
// - propriedade do PJ calculada sem usar fallbacks ambíguos;
// - mantém a autoridade do mestre sobre mutações compartilhadas.
// ============================================================

const labAlvoLocalJogador23_=new Map();

function labEhTokenDoJogador23_(t){
    if(!t||batalhaEhMestre_())return false;
    const uid=String(currentUserUid||currentUser?.uid||'');
    if(!uid)return false;

    // Dono UID explícito é a fonte mais forte.
    const donoExplicito=String(
        t?.donoUid ||
        t?.charLab?.donoUid ||
        ''
    );
    if(donoExplicito)return donoExplicito===uid;

    // Fallback seguro: a conta do jogador só mantém em userCharacters
    // as próprias fichas carregadas pelo listener de dono.
    const ids=new Set([
        String(t.id||''),
        String(t.origemId||''),
        String(t.charLab?.id||'')
    ].filter(Boolean));

    return (userCharacters||[]).some(c=>{
        const cid=String(c?.id||'');
        const dono=String(c?.donoUid||c?.dono||'');
        return ids.has(cid) && (!dono || dono===uid);
    });
}

labEhTokenDoJogador21_=labEhTokenDoJogador23_;

function labGuardarAlvoLocal23_(id){
    if(batalhaEhMestre_()||labEstado_.fase!=='combate')return;
    const ator=labTokenAtual_(),alvo=labAlvoAtaquePorId_(id);
    if(!ator||!labEhTokenDoJogador23_(ator)||!alvo||String(alvo.id)===String(ator.id))return;

    labAlvoLocalJogador23_.set(String(ator.id),String(alvo.id));
    labMarcarAlvoMapa763_(String(alvo.id));
}

const labSelecionarSync23Base_=window.labSelecionar_;
window.labSelecionar_=function(id){
    const r=labSelecionarSync23Base_.apply(this,arguments);
    if(labEstado_.fase==='combate'){
        const alvo=labTokenPorId_(id),ator=labTokenAtual_();
        if(!batalhaEhMestre_()&&alvo&&ator&&String(alvo.id)!==String(ator.id)&&labEhTokenDoJogador23_(ator)){
            labGuardarAlvoLocal23_(String(alvo.id));
            labRender_();
        }
    }
    return r;
};

const labSelecionarObjetoSync23Base_=window.labSelecionarObjeto_;
window.labSelecionarObjeto_=function(id){
    const r=labSelecionarObjetoSync23Base_.apply(this,arguments);
    if(labEstado_.fase==='combate'&&!batalhaEhMestre_()){
        labGuardarAlvoLocal23_(String(id));
        labRender_();
    }
    return r;
};

const labRolarAtaqueSync23Base_=window.labRolarAtaque_;
window.labRolarAtaque_=function(){
    if(!batalhaEhMestre_()&&labEstado_.fase==='combate'){
        const t=labTokenAtual_();
        if(t&&labEhTokenDoJogador23_(t)){
            const id=String(labAlvoLocalJogador23_.get(String(t.id))||'');
            const alvo=id?labAlvoAtaquePorId_(id):null;
            if(alvo){
                t.alvoLab=id;
                t._alvoManualFixadoLab=id;
                t._alvoSelecionadoMapa763=true;
                t._alvoMortoManual510=!!labAlvoInerte490_(alvo);
                if(labEhAlvoObjeto_(alvo)){
                    labEstado_.objetoSelecionadoId=id;
                    labEstado_.selecionadoId='';
                }else{
                    labEstado_.objetoSelecionadoId='';
                    labEstado_.selecionadoId=id;
                }
            }
        }
    }
    return labRolarAtaqueSync23Base_.apply(this,arguments);
};

// Quando muda a oportunidade, o alvo local antigo deixa de valer.
const labEncerrarOportunidadeSync23Base_=window.labEncerrarOportunidade_;
window.labEncerrarOportunidade_=function(){
    const atual=labTokenAtual_();
    if(atual)labAlvoLocalJogador23_.delete(String(atual.id));
    return labEncerrarOportunidadeSync23Base_.apply(this,arguments);
};

function labRenderPainelPrivadoJogador23_(el){
    if(labReducing_)return;
    const meu=labTokenPainelJogador21_();
    if(!meu){
        el.style.display='none';
        el.innerHTML='';
        return;
    }

    if(labEstado_.fase!=='combate'){
        return labRenderPainelExploracao18_(el,meu);
    }

    const pend=labEstado_.pendenciaLab;
    if(pend){
        const meuId=String(meu.id);
        const atacante=labTokenPorId_(pend.atacanteId);
        const defensor=labTokenPorId_(pend.defensorId);

        // O próprio PJ está defendendo: o painel original pode mostrar
        // apenas a própria ficha e suas opções defensivas.
        if(defensor&&String(defensor.id)===meuId){
            return labRenderActionPanelE6Base_.apply(this,arguments);
        }

        // O próprio PJ está atacando: não mostrar defesa, PV, PA,
        // perícias ou AÇ do adversário.
        if(atacante&&String(atacante.id)===meuId){
            labRenderPainelConsulta21_(el,meu);
            const aviso=document.createElement('div');
            aviso.style.cssText='margin:6px 0 0;padding:6px 8px;border-radius:7px;background:rgba(80,150,220,.10);color:#9fc6d8;font-size:.86em;';
            aviso.textContent='Aguardando a reação do alvo.';
            el.prepend(aviso);
            return;
        }

        return labRenderPainelConsulta21_(el,meu);
    }

    const dp=labEstado_.danoPendenteLab;
    if(dp){
        const atacante=labTokenPorId_(dp.atacanteId);
        const defensor=labTokenPorId_(dp.defensorId);

        if(atacante&&String(atacante.id)===String(meu.id)){
            return labRenderResolucaoPJ19_(el,dp,meu,defensor);
        }

        return labRenderPainelConsulta21_(el,meu);
    }

    const atual=labTokenAtual_();
    if(atual&&String(atual.id)===String(meu.id)){
        return labRenderActionPanelE6Base_.apply(this,arguments);
    }

    return labRenderPainelConsulta21_(el,meu);
}

const labRenderPainelPersistenteSync23Base_=labRenderPainelPersistente21_;
labRenderPainelPersistente21_=function(){
    const el=document.getElementById('labActionPanel');
    if(!el)return;

    if(!batalhaEhMestre_()){
        return labRenderPainelPrivadoJogador23_(el);
    }

    return labRenderPainelPersistenteSync23Base_.apply(this,arguments);
};

function labAjustarRotulosTokens23_(){
    const map=document.getElementById('labMetricMap');
    if(!map)return;

    for(const node of map.querySelectorAll('.lab-token')){
        const id=String(node.dataset.id||'');
        const t=labTokenPorId_(id);
        if(!t)continue;

        // O último DIV do token legado é o rótulo do nome.
        const filhos=[...node.children];
        const label=filhos.reverse().find(x=>x.tagName==='DIV'&&!x.classList.contains('lab-facing-frame'));
        if(!label)continue;

        label.classList.add('lab-token-name-23');
        label.style.left='50%';
        label.style.top='-5px';
        label.style.bottom='auto';
        label.style.transform='translate(-50%,-100%)';
        label.style.pointerEvents='none';
        label.style.transition='opacity .12s ease';
        label.style.opacity='0';

        const selecionado=
            String(labEstado_.selecionadoId||'')===id ||
            String(labTokenAtual_()?.id||'')===id;

        node.classList.toggle('lab-token-selected-23',selecionado);
    }

    if(!document.getElementById('lab-token-style-23')){
        const st=document.createElement('style');
        st.id='lab-token-style-23';
        st.textContent=`
          #labMetricMap .lab-token:hover .lab-token-name-23,
          #labMetricMap .lab-token.lab-token-selected-23 .lab-token-name-23{
            opacity:1 !important;
          }
        `;
        document.head.appendChild(st);
    }
}

const labRenderSync23Base_=labRender_;

window.labRender_=labRender_;




