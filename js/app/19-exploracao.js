// ============================================================
// EXP-EXPLORACAO-4 — materiais no mesmo ES module do banco/Firebase
// ============================================================
const OBJ_MATERIAIS_PADRAO_E4=['Madeira','Pedra','Metal','Vidro','Plástico','Papel','Carne','Osso','Gelo','Tecido','Líquido'];
let objMateriaisE4_=[];
function objMaterialLimparE4_(v){return String(v||'').trim().replace(/\s+/g,' ');}
function objMaterialUnicosE4_(arr){const out=[],seen=new Set();for(const raw of (arr||[])){const v=objMaterialLimparE4_(raw);if(!v)continue;const k=normalizarTextoCombate_(v);if(seen.has(k))continue;seen.add(k);out.push(v);}return out;}
function objMaterialPopularE4_(valor){const sel=document.getElementById('objMapaMaterial');if(!sel)return;const atual=valor!==undefined?String(valor||''):String(sel.value||'');const lista=objMateriaisE4_.length?objMateriaisE4_:OBJ_MATERIAIS_PADRAO_E4;sel.innerHTML='<option value="">— Não classificado —</option>'+lista.map(v=>`<option value="${escaparHtmlInventario_(v)}">${escaparHtmlInventario_(v)}</option>`).join('');if(atual&&!lista.includes(atual)){const op=document.createElement('option');op.value=atual;op.textContent=atual+' (fora da lista)';sel.appendChild(op);}sel.value=atual;}
async function objMaterialCarregarE4_(){objMateriaisE4_=OBJ_MATERIAIS_PADRAO_E4.slice();try{const ds=await getDoc(doc(db,'configuracoes','materiaisObjetosMapa'));const lista=ds.exists()?ds.data()?.lista:null;if(Array.isArray(lista)&&lista.length)objMateriaisE4_=objMaterialUnicosE4_(lista);}catch(e){console.warn('Materiais de objetos',e);}objMaterialPopularE4_();}
window.objMapaEditarMateriais800_=async function(){if(userData?.role!=='mestre')return;const txt=prompt('Edite a lista de materiais. Use um material por linha:',(objMateriaisE4_.length?objMateriaisE4_:OBJ_MATERIAIS_PADRAO_E4).join('\n'));if(txt===null)return;const lista=objMaterialUnicosE4_(txt.split(/[\n,;]+/));if(!lista.length)return notificar_('A lista precisa ter pelo menos um material.','aviso',3000);objMateriaisE4_=lista;objMaterialPopularE4_();try{await setDoc(doc(db,'configuracoes','materiaisObjetosMapa'),{lista,atualizadoEm:new Date().toISOString()},{merge:false});notificar_('Lista de materiais atualizada.','sucesso',2200);}catch(e){console.warn('Salvar materiais',e);notificar_('Lista alterada localmente, mas não foi sincronizada.','aviso',3500);}};
const preencherEditorObjetoMapaE4Base_=preencherEditorObjetoMapa_;
preencherEditorObjetoMapa_=function(o){const r=preencherEditorObjetoMapaE4Base_.apply(this,arguments);objMaterialPopularE4_(o?.material||'');return r;};
window.preencherEditorObjetoMapa_=preencherEditorObjetoMapa_;
const salvarObjetoMapaEditorE4Base_=window.salvarObjetoMapaEditor_;
window.salvarObjetoMapaEditor_=async function(){const idAntes=String(document.getElementById('objMapaEditId')?.value||''),nomeAntes=String(document.getElementById('objMapaNome')?.value||'').trim(),material=objMaterialLimparE4_(document.getElementById('objMapaMaterial')?.value||'');await salvarObjetoMapaEditorE4Base_.apply(this,arguments);const o=(objetosMapaDB||[]).find(x=>String(x.id)===idAntes)||[...(objetosMapaDB||[])].reverse().find(x=>String(x.nome||'')===nomeAntes);if(!o)return;o.material=material;try{await setDoc(doc(db,'configuracoes',objetoMapaDocId_(o.id)),{material},{merge:true});}catch(e){console.warn('Persistir material',e);}try{renderizarBancoObjetosMapa_();}catch(_){}};
setTimeout(()=>{objMaterialCarregarE4_().catch(()=>{});},700);

(function(){
'use strict';

console.log('[PATCH2] hidratação simples iniciada');
// PATCH2 limpo: sem Proxy, sem __patched__ e preservando pvAtual=0 de objetos destruídos.

function hidratarObjeto(obj){
  if(!obj || typeof obj!=='object' || !obj.modeloId) return obj;

  const modelo=(objetosMapaDB||[]).find(
    m=>String(m?.id)===String(obj.modeloId)
  );

  if(!modelo) return obj;

  const pvModelo=Math.max(
    0,
    Number(modelo.pvMax ?? modelo.pv ?? modelo.vidaMax ?? modelo.vida ?? 0)
  );

  const durezaModelo=Math.max(
    0,
    Number(modelo.dureza ?? modelo.hardness ?? 0)
  );

  const pesoModelo=Math.max(
    0,
    Number(modelo.pesoKg ?? modelo.peso ?? modelo.weightKg ?? 0)
  );

  return {
    ...obj,

    pvMax:
      Number(obj.pvMax)>0
        ? Number(obj.pvMax)
        : pvModelo,

    pvAtual:
      obj.pvAtual !== undefined && obj.pvAtual !== null && Number.isFinite(Number(obj.pvAtual))
        ? Math.max(0, Number(obj.pvAtual))
        : (
            Number(obj.pvMax)>0
              ? Number(obj.pvMax)
              : pvModelo
          ),

    dureza:
      Number(obj.dureza)>0
        ? Number(obj.dureza)
        : durezaModelo,

    pesoKg:
      Number(obj.pesoKg)>0
        ? Number(obj.pesoKg)
        : pesoModelo,

    material:
      obj.material || modelo.material || '',

    inflamabilidade:
      Number(
        obj.inflamabilidade ??
        modelo.inflamabilidade ??
        0
      ),

    inflamavel:
      obj.inflamavel ??
      Boolean(modelo.inflamavel),

    destrutivel:
      obj.destrutivel ??
      Boolean(modelo.destrutivel),

    bloqueiaMovimento:
      obj.bloqueiaMovimento ??
      Boolean(modelo.bloqueiaMovimento),

    bloqueiaVisao:
      obj.bloqueiaVisao ??
      Boolean(modelo.bloqueiaVisao),

    imagem:
      obj.imagem ||
      modelo.imagem ||
      ''
  };
}

function hidratarArray(arr){
  if(!Array.isArray(arr)) return [];
  return arr.map(hidratarObjeto);
}

function hidratarMesaAgora(){
  if(typeof labEstado_==='undefined' || !labEstado_)
    return 0;

  const antes=
    Array.isArray(labEstado_.objetosLab)
      ? labEstado_.objetosLab
      : [];

  labEstado_.objetosLab=
    hidratarArray(antes);

  return labEstado_.objetosLab.length;
}

const renderBase=
  typeof labRender_==='function'
    ? labRender_
    : null;

if(renderBase){
  

  window.labRender_=labRender_;
}

const carregarBase=
  typeof labCarregarMapaBanco_==='function'
    ? labCarregarMapaBanco_
    : null;

if(carregarBase){

  labCarregarMapaBanco_=async function(...args){

    const r=
      await carregarBase.apply(
        this,
        args
      );

    try{

      hidratarMesaAgora();

      if(typeof labSalvarLocal_==='function')
        labSalvarLocal_();

      if(typeof labRender_==='function')
        labRender_();

    }catch(e){

      console.warn(
        '[PATCH2] hidratação pós-carregamento falhou',
        e
      );
    }

    return r;
  };

  window.labCarregarMapaBanco_=
    labCarregarMapaBanco_;
}

window.__hidratarObjeto=
  hidratarObjeto;

window.__hidratarArray=
  hidratarArray;

window.__hidratarMesaAgora=
  hidratarMesaAgora;

console.log(
  '[PATCH2] hidratação simples instalada'
);

})();

// ============================================================
// EXP-EXPLORACAO-4 — exploração fora de combate e reposicionamento do mestre
// ============================================================
function labAtorInteracaoE4_(){
    if(labEstado_.fase==='combate')return labTokenAtual_();
    const ids=[labEstado_.exploracaoAtorId,labEstado_.selecionadoId].filter(Boolean).map(String);
    for(const id of ids){const t=labTokenPorId_(id);if(t&&labPodeControlarToken_(t))return t;}
    if(!batalhaEhMestre_())return (labEstado_.tokens||[]).find(t=>labPodeControlarToken_(t))||null;
    return null;
}
const labSelecionarE4Base_=window.labSelecionar_;
window.labSelecionar_=function(id){const t=labTokenPorId_(id);if(labEstado_.fase!=='combate'&&t&&labPodeControlarToken_(t))labEstado_.exploracaoAtorId=String(t.id);return labSelecionarE4Base_.apply(this,arguments);};
const labSelecionarObjetoE4Base_=window.labSelecionarObjeto_;
window.labSelecionarObjeto_=function(id){
    if(labEstado_.fase!=='combate'){
        const o=labObjetoPorId_(id);if(!o)return;
        labEstado_.objetoSelecionadoId=String(id);
        // Mantém selecionadoId/exploracaoAtorId: o personagem continua sendo o ator da exploração.
        labSalvarLocal_();labRender_();
        if(!batalhaEhMestre_())notificar_(`Objeto selecionado: ${o.nome||'objeto'}.`,'info',1200);
        return;
    }
    return labSelecionarObjetoE4Base_.apply(this,arguments);
};

const LAB_FADIGA_E4=['Fresh','Winded','Tired','Wearied','Exhausted','Debilitated','Incapacitated','Semi-Conscious','Comatose','Dead'];
async function labEsforcoExploracaoE4_(ator,rotulo,fator=1){
    const c=labCharToken_(ator);if(!c)return;
    const con=Math.max(1,Number(c?.atributos?.CON||ator?.attrs?.CON||10));
    const custo=Math.max(0.05,Number(fator||1));
    ator.esforcoExploracaoLab=Math.max(0,Number(ator.esforcoExploracaoLab||0))+custo;
    if(ator.esforcoExploracaoLab<con)return;
    ator.esforcoExploracaoLab=Math.max(0,ator.esforcoExploracaoLab-con);
    c.combate=c.combate||{};
    const atual=String(c.combate.fadiga||'Fresh'),i=Math.max(0,LAB_FADIGA_E4.indexOf(atual)),novo=LAB_FADIGA_E4[Math.min(LAB_FADIGA_E4.length-1,i+1)];
    if(novo===atual)return;
    c.combate.fadiga=novo;
    try{if(c.id&&!c.__npcTemporario&&!c.__criaturaTemporaria)await setDoc(doc(db,'personagens',String(c.id)),{'combate.fadiga':novo},{merge:true});}catch(e){console.warn('Fadiga de exploração',e);}
    notificar_(`🥵 ${ator.nome}: o esforço de ${rotulo.toLowerCase()} aumentou a fadiga para ${traduzirNomeFadiga_(novo)}.`,'aviso',4200);
}

// Ações de objeto fora do combate não usam AÇ. Lenhar/minerar ficam exclusivos da exploração.
const labObjetoAcaoExecutarE4Base_=labObjetoAcaoExecutar_;
labObjetoAcaoExecutar_=function(ator,objeto,tipo){
    const combate=labEstado_.fase==='combate';
    if(!ator||!objeto)return;

    const tipoBase=(tipo==='minerar_forca'||tipo==='minerar_pericia')?'minerar':String(tipo||'');
    const viaMineracao=tipo==='minerar_pericia';

    if(combate&&(tipoBase==='minerar'||tipoBase==='cortar')){
        notificar_('Lenhar e minerar são ações de exploração, fora do combate.','aviso',3000);
        return;
    }
    if(combate)return labObjetoAcaoExecutarE4Base_.call(this,ator,objeto,tipoBase);

    if(tipoBase==='extinguir'){
        const antes=Number(ator.acoesAtuaisLab||0);
        if(antes<=0)ator.acoesAtuaisLab=1;
        labObjetoExtinguirExecutar_(ator,objeto);
        ator.acoesAtuaisLab=antes;
        labSalvarLocal_();labRender_();
        return;
    }

    if(!['mover','minerar','cortar'].includes(tipoBase))return;

    let per=null,equip=null,dif='padrao',rotulo='';
    const nat=labObjetoNatureza_(objeto),
          c=labCharToken_(ator),
          forca=Number(c?.atributos?.FOR||ator?.attrs?.FOR||10),
          tam=Number(c?.atributos?.TAM||ator?.attrs?.TAM||10),
          peso=labObjetoPesoKg_(objeto);

    if(tipoBase==='mover'){
        per=labPericiaRegex_(ator,/forca bruta|força bruta|brute force|蛮力/);
        rotulo='Mover objeto';
        const cap=Math.max(10,(forca+tam)*5);
        dif=peso<=cap?'padrao':peso<=cap*2?'dificil':'formidavel';
    }

    if(tipoBase==='minerar'){
        if(nat!=='rocha')return;
        if(labDistanciaInteracaoObjeto_(ator,objeto)>1.5)
            return notificar_('Você precisa estar a até 1,5 m da pedra para minerar.','aviso',3200);

        per=viaMineracao
            ? labPericiaRegex_(ator,/mineracao|mineração|mining/)
            : labPericiaRegex_(ator,/forca bruta|força bruta|brute force|蛮力/);

        equip=labEquipadoRegex_(ator,/picareta|pickaxe|mining pick|矿镐|鹤嘴锄/);
        rotulo=viaMineracao?'Minerar (Mineração)':'Minerar (Força Bruta)';

        if(viaMineracao&&!per)
            return notificar_('Este personagem não possui Mineração.','aviso',3000);
        if(!equip)
            return notificar_('Minerar exige uma picareta equipada.','aviso',3500);
    }

    if(tipoBase==='cortar'){
        if(nat!=='arvore')return;
        if(labDistanciaInteracaoObjeto_(ator,objeto)>1.5)
            return notificar_('Você precisa estar a até 1,5 m da madeira para lenhar.','aviso',3200);

        per=labPericiaRegex_(ator,/forca bruta|força bruta|brute force|蛮力/);
        equip=labEquipadoRegex_(ator,/machado|axe|hatchet|斧/);
        rotulo='Lenhar';
        if(!equip)
            return notificar_('Lenhar exige um machado equipado.','aviso',3500);
    }

    if(!per)
        return notificar_(`Não encontrei a perícia necessária para ${rotulo.toLowerCase()}.`,'aviso',3500);

    // Valor bruto -> armadura -> ferimentos/estado -> dificuldade/fadiga, UMA única vez.
    const brutoPer=obterValorRegistroPericia_(c,per.id,!!per.__especializacao);
    const arm=valorPericiaComArmadura_(c,per,brutoPer);
    const extras=
        Math.max(batalhaPenalidadeFerimento_(c,per),labPenalidadeFerimentoLab22_(ator,per))
        +batalhaPenalidadeCaido_(c)
        +batalhaPenalidadeInfeccao_(c)
        +labPenalidadeEstadoGraus_(ator);

    const aj=aplicarDificuldadeEFadiga_(c,arm.valor,dif,extras);
    if(aj?.bloqueado)
        return notificar_(`${traduzirNomeFadiga_(c?.combate?.fadiga||'Fresh')}: nenhuma atividade possível.`,'aviso',3500);

    const valor=Math.max(0,Number(aj?.valor||arm.valor)),
          roll=1+Math.floor(Math.random()*100),
          r=classificarD100_(valor,roll),
          sucesso=batalhaResultadoGradeValor_(r.grau)>=2;

    let efeito=' Nenhum efeito.';

    if(sucesso&&tipoBase==='mover'){
        const metros=Math.max(.5,Math.min(2.5,1.5*(Math.max(10,(forca+tam)*5)/Math.max(1,peso))));
        labPsiEmpurrar_(ator,objeto,metros);
        efeito=` ${objeto.nome} foi deslocado ${metros.toFixed(1)} m.`;
    }

    if((tipoBase==='minerar'||tipoBase==='cortar')&&equip){
        const bonusTrabalho=Math.max(0,Math.floor(forca/5));
        const brutoRolado=(1+Math.floor(Math.random()*6))+bonusTrabalho;
        const brutoMax=6+bonusTrabalho;
        const durezaBase=Math.max(0,Number(objeto.dureza||0));
        let durezaEfetiva=durezaBase;

        if(tipoBase==='minerar'){
            const industrial=/industrial/.test(labTextoItemMesa_(equip));
            durezaEfetiva=Math.ceil(durezaBase*(industrial?1/3:1/2));
        }else{
            durezaEfetiva=Math.ceil(durezaBase/3);
        }

        if(r.grau==='Crítico'){
            const final=brutoMax;
            objeto.pvAtual=Math.max(0,Number(objeto.pvAtual??objeto.pvMax??0)-final);
            if(objeto.pvAtual<=0)objeto.destruido=true;
            efeito=` Crítico: ${final} de dano; Dureza ignorada.${objeto.destruido?' Objeto destruído.':''}`;
            if(final>0)labAdicionarFloat_(objeto,-final,'dano');
            try{somCritico_();}catch(_){}
        }else if(r.grau==='Fiasco'){
            const danoQueIriaAoAlvo=Math.max(1,brutoRolado-durezaEfetiva);
            const pvMaxFerr=Math.max(1,Number(equip.pv||equip.pvMax||1));
            const antes=Math.max(0,Number(equip.pvAtual??pvMaxFerr));
            equip.pvAtual=Math.max(0,antes-danoQueIriaAoAlvo);
            if(equip.pvAtual<=0){
                equip.inutilizavel=true;
                equip.quebradoEm=new Date().toISOString();
            }
            efeito=` Fiasco: ${getNome(equip)||equip.nome||'Ferramenta'} sofreu ${danoQueIriaAoAlvo} de dano (${equip.pvAtual}/${pvMaxFerr} PV)${equip.inutilizavel?' e ficou inutilizável.':'.'}`;
            Promise.resolve(labPersistirInventarioAtorObjeto_(ator)).catch(()=>{});
            try{somFiasco_();}catch(_){}
        }else if(sucesso){
            // Força Bruta sempre arranca ao menos 1 PV; Mineração técnica não recebe esse mínimo.
            const final=viaMineracao
                ? Math.max(0,brutoRolado-durezaEfetiva)
                : (forca>=10
                    ? Math.max(1,brutoRolado-durezaEfetiva)
                    : Math.max(0,brutoRolado-durezaEfetiva));

            objeto.pvAtual=Math.max(0,Number(objeto.pvAtual??objeto.pvMax??0)-final);
            if(objeto.pvAtual<=0)objeto.destruido=true;
            efeito=` Dano de trabalho ${brutoRolado} - Dureza efetiva ${durezaEfetiva} = ${final}.${objeto.destruido?' Objeto destruído.':''}`;
            if(final>0)labAdicionarFloat_(objeto,-final,'dano');
        }
    }

    const txt=`${rotulo}: ${roll}/${valor} → ${r.grau}.${efeito}`;
    labRegistrarResultadoProprio_(ator,txt);
    labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${ator.nome}: ${txt}`});

    // Mineração técnica custa 1/4 do esforço de Força Bruta.
    const fatorFadiga=(tipoBase==='minerar'&&viaMineracao)?0.25:1;
    Promise.resolve(labEsforcoExploracaoE4_(ator,rotulo,fatorFadiga)).catch(()=>{});

    try{somDado_();}catch(_){}
    labSalvarLocal_();
    try{labAgendarSyncRemoto_();}catch(_){}
    labRender_();
};

window.labObjetoAcao_=function(tipo,id){const ator=labAtorInteracaoE4_(),o=labObjetoPorId_(id);if(!ator||!o||!labPodeControlarToken_(ator)){notificar_('Selecione primeiro o personagem que fará a ação.','aviso',2800);return;}if(!batalhaEhMestre_()){labEnviarComandoJogador_('acao_objeto',{tipo:String(tipo||''),objetoId:String(id)},ator).then(ok=>{if(ok)notificar_('Ação enviada ao mestre.','info',1200);});return;}labObjetoAcaoExecutar_(ator,o,String(tipo||''));};

// Mestre processa ações de exploração dos jogadores mesmo sem iniciativa ativa.
const labProcessarComandoJogadorE4Base_=labProcessarComandoJogador_;


// Painel contextual: exploração mostra trabalho; combate mostra ataque/movimento, nunca Lenhar/Minerar.
labObjetoMicroPainelHtml_=function(o,ppm){
    if(!o||o.destruido||String(labEstado_.objetoSelecionadoId||'')!==String(o.id))return '';
    const combate=labEstado_.fase==='combate',ator=labAtorInteracaoE4_();if(!ator||!labPodeControlarToken_(ator))return '';
    if(combate&&Number(ator.acoesAtuaisLab||0)<=0)return '';
    const nat=labObjetoNatureza_(o),pic=labEquipadoRegex_(ator,/picareta|pickaxe|mining pick|矿镐|鹤嘴锄/),axe=labEquipadoRegex_(ator,/machado|axe|hatchet|斧/),ext=labEquipadoRegex_(ator,/extintor|extinguisher|灭火器/),psis=combate?labPsiPoderesParaAlvo_(ator,o):[];
    const meiaH=Math.max(18,Number(o.alturaM||1)*ppm)/2,posMicro=labMicroPosicaoVertical_(o.y*ppm,meiaH,ppm,72),top=posMicro.top,left=o.x*ppm,oid=String(o.id).replace(/'/g,"\\'");
    const botoes=[];
    if(combate){if(o.destrutivel!==false)botoes.push(`<button class="btn-small btn-select" onclick="labAtacarObjetoContextual_('${oid}')">⚔️ Atacar</button>`);botoes.push(`<button class="btn-small" onclick="labObjetoAcao_('mover','${oid}')">💪 Mover</button>`);for(const p of psis)botoes.push(`<button class="btn-small lab-psi-action" onclick="${p.id==='mover_objeto'?`labUsarPsiContextualRapido_('${String(p.id).replace(/'/g,"\\'")}','${oid}')`:`labAbrirPsiContextual_('${String(p.id).replace(/'/g,"\\'")}','${oid}')`}">🔮 ${escaparHtmlInventario_(getNome(p))}</button>`);}else{botoes.push(`<button class="btn-small" onclick="labObjetoAcao_('mover','${oid}')">💪 Mover</button>`);if(nat==='rocha'&&pic)botoes.push(`<button class="btn-small btn-select" onclick="labObjetoAcao_('minerar','${oid}')">⛏️ Minerar</button>`);if(nat==='arvore'&&axe)botoes.push(`<button class="btn-small btn-select" onclick="labObjetoAcao_('cortar','${oid}')">🪓 Lenhar</button>`);}
    if(o.pegandoFogoLab&&ext)botoes.push(`<button class="btn-small" onclick="labObjetoAcao_('extinguir','${oid}')">🧯 Apagar fogo</button>`);
    if(!botoes.length)return '';
    return `<div class="lab-micro-actions" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" style="position:absolute;left:${left}px;top:${top}px;transform:${posMicro.transform};z-index:28;padding:4px;border-radius:8px;background:rgba(10,13,30,.96);border:1px solid rgba(126,231,255,.45);display:flex;gap:3px;align-items:center;justify-content:center;flex-wrap:wrap;max-width:410px;">${botoes.join('')}</div>`;
};

// Mestre pode reposicionar qualquer token/objeto durante o combate. O toggle Controlar PJ continua valendo para AÇÕES, não para arraste de mestre.
function labArrastarLivreMestreE4_(ev,id,objeto=false){
    if(ev.button===2)return;ev.preventDefault();ev.stopPropagation();
    const map=document.getElementById('labMetricMap'),alvo=objeto?labObjetoPorId_(id):labTokenPorId_(id);if(!map||!alvo)return;
    if(objeto){labEstado_.objetoSelecionadoId=String(id);labEstado_.selecionadoId='';}else{labEstado_.selecionadoId=String(id);labEstado_.objetoSelecionadoId='';}
    const rect=map.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48),node=map.querySelector(objeto?`.lab-map-object[data-id="${CSS.escape(String(id))}"]`:`.lab-token[data-id="${CSS.escape(String(id))}"]`),w=node?.offsetWidth||24,h=node?.offsetHeight||24;
    let raf=0,p=null,moved=false,ox=Number(alvo.x||0),oy=Number(alvo.y||0);
    const aplicar=()=>{raf=0;if(!p)return;const q=p;p=null;alvo.x=Math.max(0,Math.min(labEstado_.larguraM,(q.x-rect.left)/ppm));alvo.y=Math.max(0,Math.min(labEstado_.alturaM,(q.y-rect.top)/ppm));if(Math.hypot(alvo.x-ox,alvo.y-oy)>.03)moved=true;if(node){node.style.left=`${alvo.x*ppm-w/2}px`;node.style.top=`${alvo.y*ppm-h/2}px`;}};
    const move=e=>{p={x:e.clientX,y:e.clientY};if(!raf)raf=requestAnimationFrame(aplicar);};
    const up=()=>{window.removeEventListener('pointermove',move);if(p){if(raf){cancelAnimationFrame(raf);raf=0;}aplicar();}labSalvarLocal_();try{labAgendarSyncRemoto_();}catch(_){}labRender_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
}
const labPointerDownE4Base_=window.labPointerDown_;
window.labPointerDown_=function(ev,id){if(batalhaEhMestre_()&&labEstado_.fase==='combate')return labArrastarLivreMestreE4_(ev,id,false);return labPointerDownE4Base_.apply(this,arguments);};
const labObjetoPointerDownE4Base_=window.labObjetoPointerDown_;
window.labObjetoPointerDown_=function(ev,id){if(batalhaEhMestre_()&&labEstado_.fase==='combate')return labArrastarLivreMestreE4_(ev,id,true);return labObjetoPointerDownE4Base_.apply(this,arguments);};

// Faixas secundárias nunca desaparecem; vazias continuam reservando o mesmo espaço.
const labRenderObjetoPainelE4Base_=window.labRenderObjetoPainel_;
window.labRenderObjetoPainel_=function(){const r=labRenderObjetoPainelE4Base_.apply(this,arguments),e=document.getElementById('labObjetoPainel');if(e)e.style.display='flex';return r;};
const labAtualizarInfoE4Base_=labAtualizarInfo_;
labAtualizarInfo_=function(){const r=labAtualizarInfoE4Base_.apply(this,arguments),e=document.getElementById('labInfo');if(e)e.style.display='flex';return r;};
window.labAtualizarInfo_=labAtualizarInfo_;



