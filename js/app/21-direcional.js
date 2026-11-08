// ============================================================
// EXP-DIRECIONAL-1
// Base estável RECOVERY23 + primeiro núcleo do novo combate.
// - Defesas separadas das AÇ e automáticas.
// - Defesa ativa escolhível; Esquiva é o padrão.
// - Ataque por direção: botão direito ou tecla A.
// - Clique esquerdo no mapa muda a direção; segurar move nessa direção.
// - Setas e teclado numérico movem o personagem controlado.
// - Objetos imóveis atingidos pela linha recebem dano sem teste de acerto.
// - Botões Atacar são retirados do mapa/painel.
// - Mineração técnica só aparece com investimento real em Mineração.
// ============================================================

function labTemPericiaTreinadaExataD1_(t,id){
    const c=labCharToken_(t);if(!c)return false;
    const reg=c?.pericias?.[id];
    return totalTreinoPericia_(reg||{})>0;
}
function labMineracaoTreinadaD1_(t){return labTemPericiaTreinadaExataD1_(t,'mineracao');}

// Remove Mineração técnica quando não houve investimento real.
const labObjetoMicroPainelD1Base_=labObjetoMicroPainelHtml_;
labObjetoMicroPainelHtml_=function(o,ppm){
    let h=labObjetoMicroPainelD1Base_.apply(this,arguments);
    const ator=labAtorEfetivoE6_();
    if(!h||!ator||labMineracaoTreinadaD1_(ator))return h;
    h=h.replace(/<button[^>]*onclick="labObjetoAcao_\('minerar_pericia',[\s\S]*?<\/button>/g,'');
    h=h.replace(/<button[^>]*onclick="labObjetoAcao_\('minerar_forca',([^>]*)>⛏️ Força<\/button>/g,
                '<button class="btn-small btn-select" onclick="labObjetoAcao_(\'minerar_forca\',$1>⛏️ Minerar</button>');
    return h;
};

const labObjetoAcaoD1Base_=window.labObjetoAcao_;
window.labObjetoAcao_=function(tipo,id){
    const t=labAtorInteracaoE4_();
    if(String(tipo)==='minerar_pericia'&&!labMineracaoTreinadaD1_(t)){
        notificar_('Este personagem não possui Mineração treinada.','aviso',2600);return;
    }
    return labObjetoAcaoD1Base_.apply(this,arguments);
};

// ------------------------------------------------------------
// Autoridade de controle do participante atual.
// ------------------------------------------------------------
function labAtorControlavelD1_(){
    if(labEstado_.fase==='combate'){
        const t=labTokenAtual_();if(!t)return null;
        if(batalhaEhMestre_())return labTokenMestre19_(t)?t:null;
        return labEhTokenDoJogador23_(t)?t:null;
    }
    const t=batalhaEhMestre_()?labAtorEfetivoE6_():labTokenPainelJogador21_();
    if(!t)return null;
    if(batalhaEhMestre_()&&labModoMestreE6_())return null;
    return t;
}

// ------------------------------------------------------------
// Reservas de defesa.
// ------------------------------------------------------------
function labGarantirDefesasD1_(t){
    if(!t||labDrawing_)return;
    const mx=Math.max(0,Number(t.acoesMaxLab||0));
    if(!Number.isFinite(Number(t.defesasMaxLab)))t.defesasMaxLab=mx;
    if(!Number.isFinite(Number(t.defesasAtuaisLab)))t.defesasAtuaisLab=Number(t.defesasMaxLab||mx);
    if(!t.defesaAtivaD1){
        const defs=labDefesasDisponiveis_(t)||[];
        const esquiva=defs.find(p=>normalizarTextoCombate_(`${p.id||''} ${getNome(p)||''}`).includes('esquiva'))||defs[0];
        t.defesaAtivaD1=esquiva?batalhaTokenPericia_(esquiva):'';
    }
}
function labReporDefesasD1_(){
    for(const t of labTokensCombatentes_()){
        t.defesasMaxLab=Math.max(0,Number(t.acoesMaxLab||0));
        t.defesasAtuaisLab=t.defesasMaxLab;
        t.movimentoUsadoDirecionalD1=0;
        labGarantirDefesasD1_(t);
    }
}
const labPrepararNovaRodadaD1Base_=labPrepararNovaRodada_;
labPrepararNovaRodada_=function(){
    const r=labPrepararNovaRodadaD1Base_.apply(this,arguments);
    labReporDefesasD1_();
    return r;
};
const labIniciarCombateD1Base_=window.labIniciarCombate_;
window.labIniciarCombate_=function(){
    const r=labIniciarCombateD1Base_.apply(this,arguments);
    if(labEstado_.fase==='combate')labReporDefesasD1_();
    labSalvarLocal_();labRender_();
    return r;
};

function labDefesasValidasD1_(t,itemAtaque=null){
    let defs=labDefesasDisponiveis_(t)||[];
    if(itemAtaque&&labAtaqueEhDistancia_(itemAtaque)){
        defs=defs.filter(p=>normalizarTextoCombate_(`${p.id||''} ${getNome(p)||''}`).includes('esquiva'));
    }
    return defs;
}
function labDefesaAtivaD1_(t,itemAtaque=null){
    labGarantirDefesasD1_(t);
    const defs=labDefesasValidasD1_(t,itemAtaque);
    if(!defs.length)return null;
    let p=defs.find(x=>batalhaTokenPericia_(x)===String(t.defesaAtivaD1||''));
    if(!p)p=defs.find(x=>normalizarTextoCombate_(`${x.id||''} ${getNome(x)||''}`).includes('esquiva'))||defs[0];
    t.defesaAtivaD1=batalhaTokenPericia_(p);
    return p;
}
window.labMudarDefesaAtivaD1_=function(v){
    const t=labTokenPainel21_()||labAtorControlavelD1_();if(!t)return;
    t.defesaAtivaD1=String(v||'');
    if(!batalhaEhMestre_()){
        labEnviarComandoJogador_('defesa_ativa_d1',{defesaAtivaD1:t.defesaAtivaD1},t);
    }else{labSalvarLocal_();try{labAgendarSyncRemoto_();}catch(_){}}
    labRender_();
};

// ------------------------------------------------------------
// Auto-defesa. Reutiliza o resolvedor já testado, mas preserva AÇ.
// ------------------------------------------------------------
const labResponderDefesaD1Base_=window.labResponderDefesa_;
function labAutoResolverDefesaD1_(){
    if(!batalhaEhMestre_())return false;
    const pend=labEstado_.pendenciaLab;if(!pend)return false;
    const d=labTokenPorId_(pend.defensorId);if(!d)return false;
    labGarantirDefesasD1_(d);
    const st=labGarantirSnapshotCombate_(d);
    if(st?.morto||st?.inconsciente||Number(d.defesasAtuaisLab||0)<=0){
        labResponderDefesaD1Base_(false);return true;
    }
    const per=labDefesaAtivaD1_(d,pend.item);
    if(!per){labResponderDefesaD1Base_(false);return true;}

    const acoesAntes=Number(d.acoesAtuaisLab||0);
    const psiAntes=Number(d.acoesDefensivasPsiLab||0);
    d.defesaLab=batalhaTokenPericia_(per);
    d.acoesAtuaisLab=Math.max(1,acoesAntes);
    d.acoesDefensivasPsiLab=0;
    d.defesasAtuaisLab=Math.max(0,Number(d.defesasAtuaisLab||0)-1);
    try{labResponderDefesaD1Base_(true);}finally{
        d.acoesAtuaisLab=acoesAntes;
        d.acoesDefensivasPsiLab=psiAntes;
    }
    labSalvarLocal_();try{labAgendarSyncRemoto_();}catch(_){ }
    labRender_();
    return true;
}

// ------------------------------------------------------------
// Geometria do ataque por direção.
// ------------------------------------------------------------
function labVetorFrenteD1_(t){
    const rad=Number(t?.angulo||0)*Math.PI/180;
    return {dx:Math.sin(rad),dy:-Math.cos(rad)};
}
function labRaioAlvoD1_(a){
    if(!a)return .4;
    if(labEhAlvoObjeto_(a)){
        const w=Math.max(.1,Number(a.larguraM||1)),h=Math.max(.1,Number(a.alturaM||1));
        return Math.max(.18,Math.min(2.5,Math.max(w,h)/2));
    }
    return Math.max(.25,Number(a.diametroM||.9)/2);
}
function labPrimeiroAlvoNaDirecaoD1_(t,alc){
    const {dx,dy}=labVetorFrenteD1_(t),ox=Number(t.x||0),oy=Number(t.y||0);
    const candidatos=[
        ...(labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t.id)),
        ...(labEstado_.objetosLab||[]).filter(o=>!o.destruido&&o.destrutivel!==false)
    ];
    let melhor=null,melhorProj=Infinity;
    for(const a of candidatos){
        const vx=Number(a.x||0)-ox,vy=Number(a.y||0)-oy;
        const proj=vx*dx+vy*dy;
        if(proj<=0||proj>Number(alc||0)+labRaioAlvoD1_(a))continue;
        const perp=Math.abs(vx*dy-vy*dx);
        const margem=labRaioAlvoD1_(a)+.12;
        if(perp>margem)continue;
        if(proj<melhorProj){melhor=a;melhorProj=proj;}
    }
    return melhor;
}
function labEhAtaqueCorpoD1_(item){return !labAtaqueEhDistancia_(item);}

function labConsumirAtaqueVazioD1_(t,item){
    if(Number(t.acoesAtuaisLab||0)<=0)return false;
    if(labEhArmaMuniciada_(item)&&labMunicaoAtual_(t,item)<=0){notificar_(`${getNome(item)} está sem munição.`,'aviso');return false;}
    if(labEhArmaMuniciada_(item))labConsumirMunicao_(t,item,1);
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);
    const txt=labAtaqueEhDistancia_(item)?`${t.nome} disparou sem atingir um alvo.`:`${t.nome} golpeou o vazio.`;
    labRegistrarResultadoProprio_(t,txt);
    labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:txt});
    labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();
    return true;
}
function labAtaqueObjetoDiretoD1_(t,o,item){
    if(Number(t.acoesAtuaisLab||0)<=0)return false;
    if(labEhArmaMuniciada_(item)&&labMunicaoAtual_(t,item)<=0){notificar_(`${getNome(item)} está sem munição.`,'aviso');return false;}
    if(labEhArmaMuniciada_(item))labConsumirMunicao_(t,item,1);
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);
    const expr=labExpressaoDano_(t,item)||String(item?.dano||'');
    const dr=expr?rolarExpressaoDanoCombate_(expr):null;
    if(!dr){notificar_('Não foi possível interpretar o dano da arma.','aviso');return false;}
    const bruto=Math.max(0,Number(dr.total||0)),duro=Math.max(0,Number(o.dureza||0)),final=Math.max(0,bruto-duro);
    o.pvAtual=Math.max(0,Number(o.pvAtual??o.pvMax??0)-final);if(o.pvAtual<=0)o.destruido=true;
    try{labSomAtaque_(item,'Sucesso');labDispararEfeitoVisualAtaque_(t,o,item,true,'Sucesso');}catch(_){ }
    labRegistrarResultadoProprio_(t,`${getNome(item)}: ${bruto} bruto · Dureza ${duro} · dano ${final} em ${o.nome}.${o.destruido?' Objeto destruído.':''}`);
    labEstado_.ultimoResultadoLab=`${t.nome} atingiu ${o.nome}: ${final} de dano${o.destruido?' · destruído':''}.`;
    labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:labEstado_.ultimoResultadoLab});
    if(final>0)labAdicionarFloat_(o,-final,'dano');
    labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();
    return true;
}

const labRolarAtaqueD1Base_=window.labRolarAtaque_;
function labExecutarAtaqueDirecionalMestreD1_(t,alvoId=''){
    if(!batalhaEhMestre_()||labEstado_.fase!=='combate'||!t)return false;
    if(labEstado_.pendenciaLab||labEstado_.danoPendenteLab)return false;
    if(String(labTokenAtual_()?.id||'')!==String(t.id)||Number(t.acoesAtuaisLab||0)<=0)return false;
    labGarantirPrefsAtaque_(t);
    const item=labItemSelecionado_(t);if(!item)return false;
    const alvo=alvoId?labAlvoAtaquePorId_(alvoId):null;
    if(!alvo)return labConsumirAtaqueVazioD1_(t,item);
    const dist=labDistanciaEntre_(t,alvo),alc=labAlcanceAtaque_(t,item);
    if(dist>alc+labRaioAlvoD1_(alvo)+.01)return labConsumirAtaqueVazioD1_(t,item);
    if(labEhAlvoObjeto_(alvo))return labAtaqueObjetoDiretoD1_(t,alvo,item);
    t.alvoLab=String(alvo.id);t._alvoManualFixadoLab=String(alvo.id);t._alvoComandoFixadoLab=String(alvo.id);t._alvoSelecionadoMapa763=true;
    labRolarAtaqueD1Base_();
    if(labEstado_.pendenciaLab)labAutoResolverDefesaD1_();
    return true;
}

window.labAtacarDirecaoD1_=function(){
    const t=labAtorControlavelD1_();if(!t||labEstado_.fase!=='combate')return;
    if(labEstado_.pendenciaLab||labEstado_.danoPendenteLab)return;
    labGarantirPrefsAtaque_(t);
    const item=labItemSelecionado_(t);if(!item)return notificar_('Escolha uma arma/ataque no painel.','aviso',2500);
    const alc=labAlcanceAtaque_(t,item),alvo=labPrimeiroAlvoNaDirecaoD1_(t,alc);
    const alvoId=String(alvo?.id||'');
    if(batalhaEhMestre_())return labExecutarAtaqueDirecionalMestreD1_(t,alvoId);
    labEnviarComandoJogador_('ataque_direcional_d1',{alvoId},t);
};

// ------------------------------------------------------------
// Movimento por direção.
// ------------------------------------------------------------
function labAnguloDeVetorD1_(dx,dy){let d=Math.atan2(dx,-dy)*180/Math.PI;if(d<0)d+=360;return Math.round(d);}
function labMoverPassoD1_(dx,dy,dist=.5){
    const t=labAtorControlavelD1_();if(!t)return false;
    const n=Math.hypot(dx,dy)||1;dx/=n;dy/=n;
    const passo=Math.max(.1,Number(dist||.5));
    t.angulo=labAnguloDeVetorD1_(dx,dy);

    if(labEstado_.fase!=='combate'){
        t.x=Math.max(0,Math.min(labEstado_.larguraM,Number(t.x||0)+dx*passo));
        t.y=Math.max(0,Math.min(labEstado_.alturaM,Number(t.y||0)+dy*passo));
        if(batalhaEhMestre_()){labSalvarLocal_();try{labAgendarSyncRemoto_();}catch(_){}}
        else labEnviarComandoJogador_('movimento',{x:t.x,y:t.y},t);
        labRender_();return true;
    }

    if(Number(t.acoesAtuaisLab||0)<=0&&t.movimentoGratisDisponivel===false)return false;
    const p=Math.max(.1,labMovimentoPorAcao_(t));if(p<=0)return false;
    const usado=Math.max(0,Number(t.movimentoUsadoDirecionalD1||0));
    const gratis=t.movimentoGratisDisponivel!==false?1:0;
    const custoAntes=Math.max(0,Math.ceil((Math.max(0,usado-gratis)-.0001)/p));
    const novoUsado=usado+passo;
    const custoDepois=Math.max(0,Math.ceil((Math.max(0,novoUsado-gratis)-.0001)/p));
    const extra=Math.max(0,custoDepois-custoAntes);
    if(extra>Number(t.acoesAtuaisLab||0))return false;
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-extra);
    if(novoUsado>=1-.001)t.movimentoGratisDisponivel=false;
    t.movimentoUsadoDirecionalD1=novoUsado;
    t.x=Math.max(0,Math.min(labEstado_.larguraM,Number(t.x||0)+dx*passo));
    t.y=Math.max(0,Math.min(labEstado_.alturaM,Number(t.y||0)+dy*passo));
    if(batalhaEhMestre_()){labSalvarLocal_();try{labAgendarSyncRemoto_();}catch(_){}}
    else labEnviarComandoJogador_('movimento',{x:t.x,y:t.y},t);
    labRender_();labAutoAvancarSeSemAcoes_();return true;
}

function labVirarParaPontoD1_(clientX,clientY){
    const t=labAtorControlavelD1_(),map=document.getElementById('labMetricMap');if(!t||!map)return false;
    const rect=map.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48);
    const px=(clientX-rect.left)/ppm,py=(clientY-rect.top)/ppm,dx=px-Number(t.x||0),dy=py-Number(t.y||0);
    if(Math.hypot(dx,dy)<.02)return false;
    t.angulo=labAnguloDeVetorD1_(dx,dy);
    if(batalhaEhMestre_()){labSalvarLocal_();try{labAgendarSyncRemoto_();}catch(_){}}
    labRender_();return true;
}

// ------------------------------------------------------------
// Comandos remotos adicionais.
// ------------------------------------------------------------
const labProcessarComandoJogadorD1Base_=labProcessarComandoJogador_;


// ------------------------------------------------------------
// UI: Defesa ativa e remoção dos botões Atacar.
// ------------------------------------------------------------
function labAnexarDefesaAtivaD1_(){
    const el=document.getElementById('labActionPanel');if(!el)return;
    const t=labTokenPainel21_();if(!t||labEstado_.fase!=='combate')return;
    labGarantirDefesasD1_(t);
    if(el.querySelector('.lab-defesa-ativa-d1'))return;
    const defs=labDefesasDisponiveis_(t)||[];
    if(!defs.length)return;
    const row=document.createElement('div');row.className='lab-defesa-ativa-d1';
    row.style.cssText='display:flex;gap:8px;align-items:center;margin-top:6px;padding:5px 7px;border-radius:7px;background:rgba(255,255,255,.035);font-size:.82em;';
    row.innerHTML=`<label style="display:flex;align-items:center;gap:6px;margin:0;"><span>Defesa ativa</span><select onchange="labMudarDefesaAtivaD1_(this.value)" style="margin:0;height:32px;padding:2px 7px;">${defs.map(p=>`<option value="${batalhaTokenPericia_(p)}" ${batalhaTokenPericia_(p)===String(t.defesaAtivaD1||'')?'selected':''}>${escaparHtmlInventario_(getNome(p))}</option>`).join('')}</select></label><span>Defesas <b>${Number(t.defesasAtuaisLab||0)}/${Number(t.defesasMaxLab||0)}</b></span>`;
    const pv=el.querySelector('.lab-pv-title');
    if(pv&&pv.parentElement)pv.parentElement.insertBefore(row,pv);else el.appendChild(row);
}
function labRemoverBotoesAtacarD1_(){
    const map=document.getElementById('labMetricMap');
    if(map){for(const b of [...map.querySelectorAll('button')])if(/^\s*⚔️?\s*Atacar/i.test(b.textContent||''))b.remove();}
    const painel=document.getElementById('labActionPanel');
    if(painel){for(const b of [...painel.querySelectorAll('button')])if(/Atacar\s*\(/i.test(b.textContent||''))b.remove();}
}

// ------------------------------------------------------------
// Mouse/teclado.
// ------------------------------------------------------------
let labMouseMoverTimerD1_=null,labMouseMoveIntervalD1_=null,labMousePontoD1_=null;
function labPararMouseD1_(){if(labMouseMoverTimerD1_){clearTimeout(labMouseMoverTimerD1_);labMouseMoverTimerD1_=null;}if(labMouseMoveIntervalD1_){clearInterval(labMouseMoveIntervalD1_);labMouseMoveIntervalD1_=null;}labMousePontoD1_=null;}
function labInstalarControlesD1_(){
    const map=document.getElementById('labMetricMap');if(!map||map.dataset.direcionalD1==='1')return;
    map.dataset.direcionalD1='1';
    map.addEventListener('contextmenu',ev=>{ev.preventDefault();ev.stopPropagation();window.labAtacarDirecaoD1_();});
    map.addEventListener('pointerdown',ev=>{
        if(ev.button!==0)return;
        if(ev.target.closest('button,select,input,textarea,.lab-token,.lab-map-object,.lab-micro-actions,.lab-facing-frame'))return;
        labMousePontoD1_={x:ev.clientX,y:ev.clientY};
        labVirarParaPontoD1_(ev.clientX,ev.clientY);
        labMouseMoverTimerD1_=setTimeout(()=>{
            labMouseMoveIntervalD1_=setInterval(()=>{
                const t=labAtorControlavelD1_(),m=document.getElementById('labMetricMap');if(!t||!m||!labMousePontoD1_)return labPararMouseD1_();
                const rect=m.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48),px=(labMousePontoD1_.x-rect.left)/ppm,py=(labMousePontoD1_.y-rect.top)/ppm;
                const dx=px-Number(t.x||0),dy=py-Number(t.y||0);if(Math.hypot(dx,dy)<.18)return;
                labMoverPassoD1_(dx,dy,.35);
            },120);
        },220);
    });
    map.addEventListener('pointermove',ev=>{if(labMousePontoD1_){labMousePontoD1_={x:ev.clientX,y:ev.clientY};}});
    map.addEventListener('pointerup',()=>labPararMouseD1_());
    map.addEventListener('pointerleave',()=>labPararMouseD1_());
}
if(!window.__labTeclasD1){
    window.__labTeclasD1=true;
    window.addEventListener('keydown',ev=>{
        const tag=String(ev.target?.tagName||'').toLowerCase();
        if(['input','textarea','select'].includes(tag)||ev.target?.isContentEditable)return;
        const mapAtivoD1=document.getElementById('labMetricMap');
        if(!mapAtivoD1||mapAtivoD1.offsetParent===null)return;
        const k=ev.key;
        if(k==='a'||k==='A'){ev.preventDefault();window.labAtacarDirecaoD1_();return;}
        const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],'8':[0,-1],'2':[0,1],'4':[-1,0],'6':[1,0],'7':[-1,-1],'9':[1,-1],'1':[-1,1],'3':[1,1]};
        const d=dirs[k];if(!d)return;
        ev.preventDefault();labMoverPassoD1_(d[0],d[1],1);
    });
}

const labRenderD1Base_=labRender_;

window.labRender_=labRender_;



// ============================================================
// EXP-DIRECIONAL-2
// Correção do travamento do movimento contínuo.
// DIRECIONAL-1 fazia labRender_() a cada 120 ms. Como labRender_ reconstrói
// o mapa, o listener de pointerup era destruído enquanto o setInterval antigo
// continuava vivo, podendo deixar movimento/renderização em ciclo permanente.
// Agora:
// - movimento segurando mouse usa requestAnimationFrame e atualização DOM leve;
// - render completo ocorre só ao terminar o movimento;
// - sincronização remota é limitada a ~4 vezes por segundo;
// - pointerup/pointercancel/blur param o movimento mesmo se o mapa for recriado;
// - velocidade contínua = 3 m/s.
// ============================================================

try{ labPararMouseD1_(); }catch(_){}

// Impede que o instalador antigo acrescente novamente os listeners que
// reconstruíam o mapa durante o movimento.
labInstalarControlesD1_=function(){};

const LAB_VELOCIDADE_MOUSE_D2_=3.0;
const LAB_SYNC_MOVIMENTO_D2_MS_=500;

let labMouseD2_={
    ativo:false,
    segurando:false,
    x:0,
    y:0,
    pointerId:null,
    inicio:0,
    ultimoFrame:0,
    ultimoSync:0,
    raf:0,
    holdTimer:0
};

function labAtualizarTokenDomD2_(t){
    if(!t)return;
    const ppm=Number(labEstado_.pxPorMetro||48);
    const el=document.querySelector(`#labMetricMap .lab-token[data-id="${CSS.escape(String(t.id))}"]`);
    if(!el)return;
    const w=el.offsetWidth||Math.max(24,Number(t.diametroM||.9)*ppm);
    const h=el.offsetHeight||w;
    el.style.left=`${Number(t.x||0)*ppm-w/2}px`;
    el.style.top=`${Number(t.y||0)*ppm-h/2}px`;
    const face=el.querySelector('.lab-facing-frame');
    if(face)face.style.transform=`rotate(${Number(t.angulo||0)}deg)`;
}





function labMoverPassoD2_(dx,dy,dist=.5,{renderizar=true,sincronizar=true}={}){
    const t=labAtorControlavelD1_();
    if(!t)return false;
    const ok=labAplicarMovimentoEstadoD2_(t,dx,dy,dist);
    if(!ok)return false;

    labAtualizarTokenDomD2_({...t,...labVisualMovement_.get(String(t.id))});
    if(sincronizar)labSincronizarMovimentoD2_(t,renderizar);

    if(renderizar){
        labRender_();
        if(labEstado_.fase==='combate'&&batalhaEhMestre_())labAutoAvancarSeSemAcoes_();
    }
    return true;
}

// Teclado do DIRECIONAL-1 já chama este nome. Reaproveitamos o mesmo atalho,
// agora com a rotina otimizada.
labMoverPassoD1_=function(dx,dy,dist=.5){
    return labMoverPassoD2_(dx,dy,dist,{renderizar:true,sincronizar:true});
};

function labVirarParaPontoD2_(clientX,clientY,{renderizar=false,sincronizar=false}={}){
    const t=labAtorControlavelD1_(),map=document.getElementById('labMetricMap');
    if(!t||!map)return false;
    const rect=map.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48);
    const px=(clientX-rect.left)/ppm,py=(clientY-rect.top)/ppm;
    const dx=px-Number(t.x||0),dy=py-Number(t.y||0);
    if(Math.hypot(dx,dy)<.02)return false;
    t.angulo=labAnguloDeVetorD1_(dx,dy);
    labAtualizarTokenDomD2_(t);
    if(sincronizar)labSincronizarMovimentoD2_(t,true);
    if(renderizar)labRender_();
    return true;
}

function labPararMouseD2_(renderizar=true){
    if(labMouseD2_.holdTimer){
        clearTimeout(labMouseD2_.holdTimer);
        labMouseD2_.holdTimer=0;
    }
    if(labMouseD2_.raf){
        cancelAnimationFrame(labMouseD2_.raf);
        labMouseD2_.raf=0;
    }

    const estavaAtivo=labMouseD2_.ativo||labMouseD2_.segurando;
    const t=labAtorControlavelD1_();

    labMouseD2_.ativo=false;
    labMouseD2_.segurando=false;
    labMouseD2_.pointerId=null;
    labMouseD2_.ultimoFrame=0;

    if(estavaAtivo&&t){
        labSincronizarMovimentoD2_(t,true);
        if(renderizar){
            labRender_();
            if(labEstado_.fase==='combate'&&batalhaEhMestre_())labAutoAvancarSeSemAcoes_();
        }
    }
}

function labLoopMouseD2_(ts){
    if(!labMouseD2_.segurando)return;

    const t=labAtorControlavelD1_(),map=document.getElementById('labMetricMap');
    if(!t||!map){
        labPararMouseD2_(false);
        return;
    }

    if(!labMouseD2_.ultimoFrame)labMouseD2_.ultimoFrame=ts;
    const dt=Math.min(.05,Math.max(.001,(ts-labMouseD2_.ultimoFrame)/1000));
    labMouseD2_.ultimoFrame=ts;

    const rect=map.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48);
    const alvoX=(labMouseD2_.x-rect.left)/ppm;
    const alvoY=(labMouseD2_.y-rect.top)/ppm;
    const pose=labVisualMovement_.get(String(t.id))||t;
    const dx=alvoX-Number(pose.x||0),dy=alvoY-Number(pose.y||0);
    const restante=Math.hypot(dx,dy);

    if(restante>.06){
        const passo=Math.min(restante,LAB_VELOCIDADE_MOUSE_D2_*dt);
        const ok=labMoverPassoD2_(dx,dy,passo,{renderizar:false,sincronizar:false});
        if(!ok){
            labPararMouseD2_(true);
            return;
        }
        labSincronizarMovimentoD2_(t,false);
    }else{
        // Continua segurando, mas sem gerar trabalho enquanto já chegou ao cursor.
        labVirarParaPontoD2_(labMouseD2_.x,labMouseD2_.y,{renderizar:false,sincronizar:false});
    }

    labMouseD2_.raf=requestAnimationFrame(labLoopMouseD2_);
}

function labComecarMouseD2_(ev){
    if(ev.button!==0)return;
    if(ev.target.closest('button,select,input,textarea,.lab-token,.lab-map-object,.lab-micro-actions,.lab-facing-frame'))return;
    const t=labAtorControlavelD1_();
    if(!t)return;

    labPararMouseD2_(false);
    labMouseD2_.ativo=true;
    labMouseD2_.pointerId=ev.pointerId;
    labMouseD2_.x=ev.clientX;
    labMouseD2_.y=ev.clientY;
    labMouseD2_.inicio=performance.now();
    labMouseD2_.ultimoSync=0;

    // Clique simples: apenas vira.
    labVirarParaPontoD2_(ev.clientX,ev.clientY,{renderizar:false,sincronizar:false});

    // Segurar por um instante: começa a caminhar suavemente.
    labMouseD2_.holdTimer=setTimeout(()=>{
        if(!labMouseD2_.ativo)return;
        labMouseD2_.segurando=true;
        labMouseD2_.ultimoFrame=0;
        labMouseD2_.raf=requestAnimationFrame(labLoopMouseD2_);
    },180);
}

function labInstalarControlesD2_(){
    const map=document.getElementById('labMetricMap');
    if(!map||map.dataset.direcionalD2==='1')return;
    map.dataset.direcionalD2='1';

    map.addEventListener('contextmenu',ev=>{
        ev.preventDefault();
        ev.stopPropagation();
        window.labAtacarDirecaoD1_();
    });

    map.addEventListener('pointerdown',labComecarMouseD2_);
}

// Eventos globais sobrevivem a qualquer reconstrução do mapa.
if(!window.__labGlobaisD2){
    window.__labGlobaisD2=true;

    window.addEventListener('pointermove',ev=>{
        if(!labMouseD2_.ativo)return;
        if(labMouseD2_.pointerId!==null && ev.pointerId!==labMouseD2_.pointerId)return;
        labMouseD2_.x=ev.clientX;
        labMouseD2_.y=ev.clientY;
    },true);

    window.addEventListener('pointerup',ev=>{
        if(!labMouseD2_.ativo)return;
        if(labMouseD2_.pointerId!==null && ev.pointerId!==labMouseD2_.pointerId)return;
        labPararMouseD2_(true);
    },true);

    window.addEventListener('pointercancel',()=>labPararMouseD2_(true),true);
    window.addEventListener('blur',()=>labPararMouseD2_(true));

    document.addEventListener('visibilitychange',()=>{
        if(document.hidden)labPararMouseD2_(true);
    });
}

const labRenderD2Base_=labRender_;

window.labRender_=labRender_;

// Garante que a primeira árvore DOM aberta depois do carregamento já use D2.
setTimeout(()=>{
    try{
        labPararMouseD1_();
        labRender_();
    }catch(e){console.warn('[DIRECIONAL2] inicialização',e);}
},0);




// ============================================================
// EXP-DIRECIONAL-3
// Estabilidade multi-navegador + redução de carga do movimento.
// ============================================================

// ------------------------------------------------------------
// 1) Hover compacto. Sem retrato grande e sem ficha lateral.
// ------------------------------------------------------------
function labHoverConteudoD3_(t){
    if(!t)return '';
    const st=labGarantirSnapshotCombate_(t);
    const estados=[
        st?.morto?'💀 Morto':'',
        st?.inconsciente?'💤 Inconsciente':'',
        st?.sangrando?'🩸 Sangrando':'',
        st?.derrubado?'💥 Derrubado':''
    ].filter(Boolean).join(' · ');
    return `<div style="font-size:.86em;font-weight:800;color:#fff;white-space:nowrap;">${escaparHtmlInventario_(t.nome||'')}</div>${estados?`<div style="margin-top:2px;font-size:.72em;color:#ffb0b0;white-space:nowrap;">${estados}</div>`:''}`;
}
window.labHoverShow_=function(ev,id){
    const t=labTokenPorId_(id),el=document.getElementById('labHoverCard');
    if(!t||!el)return;
    el.innerHTML=labHoverConteudoD3_(t);
    el.style.cssText='display:block;position:fixed;z-index:99999;pointer-events:none;width:auto;max-width:220px;overflow:hidden;border:1px solid rgba(0,212,255,.42);border-radius:7px;background:rgba(12,14,33,.94);padding:5px 7px;box-shadow:0 5px 16px rgba(0,0,0,.35);';
    labHoverMove_(ev);
};
window.labHoverMove_=function(ev){
    const el=document.getElementById('labHoverCard');if(!el||el.style.display==='none')return;
    const pad=10,w=el.offsetWidth||120,h=el.offsetHeight||34;
    let x=Number(ev.clientX||0)+14,y=Number(ev.clientY||0)-h-10;
    if(x+w>window.innerWidth-pad)x=Number(ev.clientX||0)-w-14;
    if(y<pad)y=Number(ev.clientY||0)+14;
    el.style.left=`${Math.max(pad,x)}px`;el.style.top=`${Math.max(pad,y)}px`;
};

// ------------------------------------------------------------
// 2) Teclado: nesta etapa somente A permanece como atalho de ataque.
// Setas e teclado numérico voltam ao comportamento normal do navegador.
// ------------------------------------------------------------
if(!window.__labBloqueioMovTecladoD3){
    window.__labBloqueioMovTecladoD3=true;
    window.addEventListener('keydown',ev=>{
        const tag=String(ev.target?.tagName||'').toLowerCase();
        if(['input','textarea','select'].includes(tag)||ev.target?.isContentEditable)return;
        const map=document.getElementById('labMetricMap');
        if(!map||map.offsetParent===null)return;
        const ks=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','1','2','3','4','6','7','8','9']);
        if(ks.has(ev.key))ev.stopImmediatePropagation();
    },true);
}

// ------------------------------------------------------------
// 3) Limite por gesto no movimento de exploração.
// O personagem pode percorrer movimento/AÇ × AÇ máximas em cada gesto.
// ------------------------------------------------------------
const labAplicarMovimentoEstadoD3Base_=labAplicarMovimentoEstadoD2_;


const labComecarMouseD3Anterior_=labComecarMouseD2_;
try{document.getElementById('labMetricMap')?.removeEventListener('pointerdown',labComecarMouseD3Anterior_);}catch(_){}
labComecarMouseD2_=function(ev){
    const t=labAtorControlavelD1_();
    if(t){labMouseD2_.origemX=Number(t.x||0);labMouseD2_.origemY=Number(t.y||0);}
    return labComecarMouseD3Anterior_.apply(this,arguments);
};
const labPararMouseD3Anterior_=labPararMouseD2_;
labPararMouseD2_=function(){
    const r=labPararMouseD3Anterior_.apply(this,arguments);
    labMouseD2_.origemX=NaN;labMouseD2_.origemY=NaN;
    return r;
};

// Reinstala o pointerdown atual no mapa já existente.
try{
    const m=document.getElementById('labMetricMap');
    if(m){
        m.dataset.direcionalD2='';
        labInstalarControlesD2_();
    }
}catch(_){}

// ------------------------------------------------------------
// 4) Movimento remoto sem redesenhar toda a Mesa a cada pacote.
// O render completo ocorre após uma pequena pausa no deslocamento.
// ------------------------------------------------------------
let labRenderMovimentoRemotoD3Timer_=null;
function labAgendarRenderMovimentoRemotoD3_(){
    if(labReducing_)return;
    clearTimeout(labRenderMovimentoRemotoD3Timer_);
    labRenderMovimentoRemotoD3Timer_=setTimeout(()=>{
        try{labRender_();}catch(e){console.warn('[DIRECIONAL3] render pós-movimento',e);}
    },420);
}

const labProcessarComandoJogadorD3Base_=labProcessarComandoJogador_;


// ------------------------------------------------------------
// 5) Firestore passa a ser a fonte compartilhada também para sessões do mestre.
// Antes, uma nova janela de mestre ignorava o remoto e publicava seu localStorage
// vazio. Isso explica a grade cinza em um terceiro navegador.
// ------------------------------------------------------------
let labD3EstadoInicializado_=false;
let labD3CenaInicializada_=false;

const labAgendarSyncRemotoD3Base_=labAgendarSyncRemoto_;


const labSync13AgendarCenaD3Base_=labSync13AgendarCena_;
labSync13AgendarCena_=function(){
    if(batalhaEhMestre_()&&!labD3CenaInicializada_)return;
    return labSync13AgendarCenaD3Base_.apply(this,arguments);
};



async function labReceberCenaD3_(header){
    if(!header||header.canal!==LAB_SYNC13_CANAL_)return false;
    const rev=String(header.rev||'');
    if(rev&&window.__LAB_SYNC13_CENA_REV__===rev)return true;
    const total=Math.max(0,Number(header.partes||0));if(!total)return false;
    const pedacos=[];
    for(let i=0;i<total;i++){
        const snap=await getDoc(doc(db,'combatesAtivos',`${LAB_SYNC13_CENA_PARTE_PREFIX_}${i}`));
        if(!snap.exists())throw new Error(`Parte ${i+1}/${total} do cenário não encontrada.`);
        const d=snap.data()||{};
        if(d.canal!==LAB_SYNC13_CANAL_||String(d.rev||'')!==rev)throw new Error(`Parte ${i+1}/${total} pertence a outra revisão.`);
        pedacos.push(String(d.dados||''));
    }
    const texto=pedacos.join('');
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
        if(!batalhaEhMestre_())labEstado_.pxPorMetro=48;
        labEstado_.oficina2State=st;
        labEstado_.desenhosLab=[];
        labEstado_.formasLab=[];
        window.__LAB_SYNC13_CENA_REV__=rev||Date.now().toString();
        labSync13LastSceneHash_=String(header.hash||labSync13Hash_(texto));
    }finally{labAplicandoRemoto_=false;}
    if(document.getElementById('laboratorio-combate')?.classList.contains('active'))labRender_();
    return true;
}

function labEscutarCenaD3_(){
    if(labSync13SceneUnsub_){try{labSync13SceneUnsub_();}catch(_){}labSync13SceneUnsub_=null;}
    if(!currentUserUid)return;
    labSync13SceneUnsub_=onSnapshot(
        doc(db,'combatesAtivos',LAB_SYNC13_CENA_HEADER_ID_),
        snap=>{
            if(!snap.exists()){
                if(batalhaEhMestre_()){
                    labD3CenaInicializada_=true;
                    labSync13AgendarCenaD3Base_();
                }
                return;
            }
            labReceberCenaD3_(snap.data()).then(()=>{labD3CenaInicializada_=true;}).catch(e=>{
                console.error('[DIRECIONAL3] receber cenário',e);
                labD3CenaInicializada_=true;
            });
        },
        e=>{console.error('[DIRECIONAL3] listener cenário',e);labD3CenaInicializada_=true;}
    );
}



// Se a autenticação já ocorreu, troca imediatamente para o listener D3.
setTimeout(()=>{
    if(currentUserUid)window.iniciarMapaMesaCompartilhado_();
},0);





// ============================================================
// EXP-DIRECIONAL-4
// Movimento mais estável e sem "voltar para trás":
// - comandos de movimento recebem sequência monotônica;
// - snapshots remotos mais antigos não sobrescrevem a posição local;
// - durante movimento contínuo não há render completo;
// - o mestre publica o estado compartilhado principalmente no fim do gesto;
// - remove o balão extra de hover;
// - o rótulo já existente passa a mostrar também o estado do personagem.
// ============================================================

function labEstadoTokenRotuloD4_(t){
    if(!t)return '';
    const st=t.combateLab||labGarantirSnapshotCombate_(t)||{};
    const estados=[
        st.morto?'💀 Morto':'',
        st.inconsciente?'💤 Inconsciente':'',
        st.incapacitado?'⛔ Incapacitado':'',
        st.sangrando?'🩸 Sangrando':'',
        st.derrubado?'💥 Caído':''
    ].filter(Boolean);
    return estados.length?` · ${estados.join(' · ')}`:'';
}

// O balão separado deixa de existir. Fica apenas o rótulo junto da miniatura.
window.labHoverShow_=function(){
    const el=document.getElementById('labHoverCard');
    if(el)el.style.display='none';
};
window.labHoverMove_=function(){};
try{window.labHoverHide_();}catch(_){}

let labMovSeqD4_=0;
let labMovProtegidoAteD4_=0;
let labEstadoRemotoPendenteD4_=null;
let labPublicarMovimentoD4Timer_=null;

function labTokenDoUsuarioAtualD4_(t){
    if(!t||batalhaEhMestre_())return false;
    const uid=String(currentUserUid||currentUser?.uid||'');
    const dono=String(t.donoUid||t.charLab?.donoUid||'');
    return !!uid && !!dono && uid===dono;
}

function labAgendarPublicacaoMovimentoD4_(imediato=false){
    if(!batalhaEhMestre_())return;
    clearTimeout(labPublicarMovimentoD4Timer_);
    if(imediato){
        try{labSalvarLocal_();}catch(_){}
        try{labAgendarSyncRemoto_();}catch(_){}
        return;
    }
    labPublicarMovimentoD4Timer_=setTimeout(()=>{
        try{labSalvarLocal_();}catch(_){}
        try{labAgendarSyncRemoto_();}catch(_){}
    },650);
}

// Substitui a sincronização D2.
// Durante o movimento do mestre: não escreve o estado inteiro a cada pacote.
// Durante o movimento do jogador: envia posição leve com sequência.


// Movimento remoto recebido pelo mestre:
// - ignora sequência antiga;
// - atualiza DOM sem render completo;
// - publica o estado compartilhado no fim do gesto ou após pausa.
const labProcessarComandoJogadorD4Base_=labProcessarComandoJogador_;


// Evita que um snapshot compartilhado atrasado faça a miniatura do próprio
// jogador "voltar" depois que ele já avançou.
const labAplicarEstadoRemotoD4Base_=labAplicarEstadoRemotoD3_;


// Ao terminar o movimento local, aplica qualquer estado remoto que ficou pendente,
// mas preserva a posição local até o mestre confirmar a mesma sequência.
const labPararMouseD4Base_=labPararMouseD2_;
labPararMouseD2_=function(){
    const r=labPararMouseD4Base_.apply(this,arguments);

    if(!batalhaEhMestre_()&&labEstadoRemotoPendenteD4_){
        const pend=labEstadoRemotoPendenteD4_;
        labEstadoRemotoPendenteD4_=null;
        setTimeout(()=>{
            try{labAplicarEstadoRemotoD3_(pend);}catch(e){console.warn('[DIRECIONAL4] aplicar remoto pendente',e);}
        },120);
    }
    return r;
};

// O listener D3 continua sendo a fonte do estado, mas agora a função acima
// protege a posição local e evita renders durante o gesto.
const labRenderD4Base_=labRender_;

window.labRender_=labRender_;





// ============================================================
// EXP-DIRECIONAL-5
// Combate responsivo:
// - a própria conta do PJ rola o d100 de ataque imediatamente;
// - o mestre reutiliza exatamente essa rolagem para resolver o ataque;
// - munição do token é sincronizada;
// - auto-defesa usa Defesas, não AÇ;
// - dano automático não trava após snapshots;
// - eventos visuais ficam numa pequena fila compartilhada;
// - a sessão do mestre ignora o eco dos próprios writes no Firestore;
// - outras sessões do mestre continuam recebendo os updates.
// ============================================================

function labMesmaPendenciaD5_(ref){
    const atual=labEstado_.danoPendenteLab;
    if(!atual||!ref)return false;
    const a=String(atual.id||''),b=String(ref.id||'');
    return a&&b?a===b:atual===ref;
}

let labRollForcadoD5_=null;
function labRolarD100MapaD5_(){
    const f=Number(labRollForcadoD5_);
    if(Number.isFinite(f)&&f>=1&&f<=100){
        labRollForcadoD5_=null;
        return Math.floor(f);
    }
    return 1+Math.floor(Math.random()*100);
}

const LAB_SESSAO_D5_=`d5_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
let labSyncD5Timer_=null;

// O próprio mestre não precisa receber e reaplicar o snapshot que ele acabou
// de publicar. Isso reduzia desempenho e podia invalidar timeouts por recriar
// danoPendenteLab no meio da resolução.
const labAplicarEstadoRemotoD5Base_=labAplicarEstadoRemotoD3_;


// Debounce curto para combate. Movimento contínuo continua sendo amortecido
// pela DIRECIONAL4 antes de chegar aqui.


// ------------------------------------------------------------
// Fila curta de FX: evita perder o tiro quando outro estado é publicado
// imediatamente depois dele.
// ------------------------------------------------------------
const labFxVistosD5_=new Set();
let labFxIdForcadoD5_='';

function labPushFxD5_(fx){
    if(!fx?.id)return;
    labEstado_.efeitosVisuaisD5=Array.isArray(labEstado_.efeitosVisuaisD5)
        ?labEstado_.efeitosVisuaisD5:[];
    labEstado_.efeitosVisuaisD5.push(JSON.parse(JSON.stringify(fx)));
    labEstado_.efeitosVisuaisD5=labEstado_.efeitosVisuaisD5
        .filter(x=>Date.now()-Number(x?.ts||0)<8000)
        .slice(-8);
}

function labRenderUmFxD5_(fx){
    if(labReducing_)return;
    if(!fx?.id||labFxVistosD5_.has(String(fx.id)))return false;
    if(Date.now()-Number(fx.ts||0)>6500){
        labFxVistosD5_.add(String(fx.id));
        return false;
    }

    let ok=false;
    try{
        if(fx.tipo==='energia_melee'){
            const a=labTokenPorId_(fx.atacanteId);
            const d=labAlvoAtaquePorId_(fx.alvoId);
            const item=encontrarItemCombatePorId_(fx.itemId);
            if(a&&d&&item){
                labMostrarGolpeEnergiaV247_(a,d,item,fx.acertou);
                ok=true;
            }
        }else{
            ok=!!labLaserCriarBodyV3_(fx);
        }
    }catch(_){}

    if(ok){labFxVistosD5_.add(String(fx.id));
        const item=encontrarItemCombatePorId_(fx.itemId);if(item)labSomAtaque_(item,fx.grau||'');
    }
    return ok;
}

function labRenderEventosVisuaisD5_(){
    if(labReducing_)return;
    for(const fx of (labEstado_.efeitosVisuaisD5||[])){
        if(labFxVistosD5_.has(String(fx?.id||'')))continue;
        if(!labRenderUmFxD5_(fx)){
            // DOM pode ainda estar terminando o render do mapa.
            setTimeout(()=>labRenderUmFxD5_(fx),80);
            setTimeout(()=>labRenderUmFxD5_(fx),180);
        }
    }
}

const labDispararEfeitoVisualAtaqueD5Base_=labDispararEfeitoVisualAtaque_;
labDispararEfeitoVisualAtaque_=function(atacante,alvo,item,acertou,grau){
    const anterior=labEstado_.efeitoVisualLab?.id;
    const r=labDispararEfeitoVisualAtaqueD5Base_.apply(this,arguments);
    try{
        if(atacante&&alvo&&!labAtaqueEhDistancia_(item)&&labEstado_.efeitoVisualLab?.id===anterior){
            labEstado_.efeitoVisualLab={id:`melee8_${Date.now()}_${Math.random()}`,tipo:'energia_melee',
                atacanteId:String(atacante.id),alvoId:String(alvo.id),itemId:String(item.id||item.idBanco||''),
                acertou:!!acertou,grau:String(grau||''),ts:Date.now()};
            labRenderUmFxD5_(labEstado_.efeitoVisualLab);
        }
        const fx=labEstado_.efeitoVisualLab;
        if(fx?.id){
            if(labFxIdForcadoD5_){
                fx.id=String(labFxIdForcadoD5_);
                labFxIdForcadoD5_='';
            }
            if(!fx.itemId&&item?.id)fx.itemId=String(item.id);
            if(!fx.itemId&&item?.idBanco)fx.itemId=String(item.idBanco);
            labPushFxD5_(fx);
        }
    }catch(_){}
    return r;
};

// ------------------------------------------------------------
// Auto-defesa: depois da defesa automática, se não houver efeitos,
// o dano é resolvido automaticamente. A reserva é Defesas, não AÇ.
// ------------------------------------------------------------
const labAutoResolverDefesaD5Base_=labAutoResolverDefesaD1_;
labAutoResolverDefesaD1_=function(){
    const pendAntes=labEstado_.pendenciaLab
        ?JSON.parse(JSON.stringify(labEstado_.pendenciaLab))
        :null;

    const r=labAutoResolverDefesaD5Base_.apply(this,arguments);

    const dp=labEstado_.danoPendenteLab;
    if(dp){
        if(Number(dp.efeitosRestantes||0)<=0&&!dp.escolhendoLocalizacao){
            dp.danoAutomatico=true;
            const id=String(dp.id||'');
            0;
        }
    }

    labAgendarSyncRemoto_();
    return r;
};

// ------------------------------------------------------------
// Ataque do jogador: d100 e feedback local imediatos.
// O mestre recebe a rolagem e a reutiliza.
// ------------------------------------------------------------
function labFxPreviewD5_(t,alvo,item,grau,fxId){
    if(!t||!alvo||!item||!fxId)return;
    const tipo=!labAtaqueEhDistancia_(item)?'energia_melee':labTipoVisualArma_(item);
    if(!tipo)return;

    const fx={
        id:String(fxId),
        tipo:tipo==='energia_melee'?'energia_melee':'laser',
        atacanteId:String(t.id||''),
        alvoId:String(alvo.id||''),
        itemId:String(item.id||item.idBanco||''),
        cor:tipo==='energia_melee'?labEnergyMeleeCorV247_(item):labCorVisualArma_(item),
        acertou:!/falha|fiasco/i.test(String(grau||'')),
        grau:String(grau||''),
        ts:Date.now()
    };
    if(labRenderUmFxD5_(fx))labFxVistosD5_.add(String(fx.id));
}

window.labAtacarDirecaoD1_=async function(){
    const t=labAtorControlavelD1_();
    if(!t||labEstado_.fase!=='combate')return;
    if(labEstado_.pendenciaLab||labEstado_.danoPendenteLab)return;
    if(window.__LAB_ATK_PEND_D5__)return;

    labGarantirPrefsAtaque_(t);
    const item=labItemSelecionado_(t);
    if(!item)return notificar_('Escolha uma arma/ataque no painel.','aviso',2500);

    if(Number(t.acoesAtuaisLab||0)<=0){
        notificar_('Sem AÇ restantes.','aviso',2200);
        return;
    }
    if(labEhArmaMuniciada_(item)&&labMunicaoAtual_(t,item)<=0){
        notificar_(`${getNome(item)} está sem munição.`,'aviso',2500);
        return;
    }

    const alc=labAlcanceAtaque_(t,item);
    const alvo=labPrimeiroAlvoNaDirecaoD1_(t,alc);
    const alvoId=String(alvo?.id||'');

    if(batalhaEhMestre_()){
        return labExecutarAtaqueDirecionalMestreD1_(t,alvoId);
    }

    const per=labPericiaPorToken_(t,t.periciaLab);
    const c=labCharToken_(t);
    let rollLocal=null,valorLocal=null,grauLocal='';
    const seq=`atk5_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const fxId=`fxd5_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

    // Ataque contra personagem: o próprio PJ já conhece sua rolagem.
    if(alvo&&!labEhAlvoObjeto_(alvo)&&per&&c){
        valorLocal=labValorPericiaAtaque_(c,per,alvo,item);
        rollLocal=1+Math.floor(Math.random()*100);
        grauLocal=classificarD100_(valorLocal,rollLocal).grau;
        labRegistrarResultadoProprio_(
            t,
            `Ataque contra ${alvo.nome}: ${getNome(per)} ${rollLocal}/${valorLocal} → ${grauLocal}.`
        );
        labFxPreviewD5_(t,alvo,item,grauLocal,fxId);
    }else if(alvo){
        labRegistrarResultadoProprio_(t,`${getNome(item)} contra ${alvo.nome}.`);
    }else{
        labRegistrarResultadoProprio_(
            t,
            labAtaqueEhDistancia_(item)?`${getNome(item)}: disparo sem alvo.`:`${getNome(item)}: golpe sem alvo.`
        );
    }

    // Munição tem prévia local; AÇ aguardam a confirmação do mestre.
    // O comando pendente impede outro ataque até essa confirmação.
    const acoesAntes=Number(t.acoesAtuaisLab||0);
    const munAntes=labEhArmaMuniciada_(item)?labMunicaoAtual_(t,item):Infinity;
    if(labEhArmaMuniciada_(item))labConsumirMunicao_(t,item,1);
    window.__LAB_ATK_PEND_D5__=seq;
    labRender_();

    const ok=await labEnviarComandoJogador_(
        'ataque_direcional_d1',
        {
            alvoId,
            periciaLab:String(t.periciaLab||''),
            equipamentoLab:String(t.equipamentoLab||''),
            rolagemD5:rollLocal,
            valorPreviewD5:valorLocal,
            ataqueSeqD5:seq,
            oportunidadeD8:labChaveOportunidadeD8_(),
            fxIdD5:fxId
        },
        t
    );

    if(!ok){
        if(labEhArmaMuniciada_(item)){
            t.municaoLab=t.municaoLab||{};
            t.municaoLab[labChaveArma_(item)]=munAntes;
        }
        window.__LAB_ATK_PEND_D5__='';
        labRender_();
    }
};

// Mestre intercepta o comando direcional antes da camada DIRECIONAL1.
const labProcessarComandoJogadorD5Base_=labProcessarComandoJogador_;


// ------------------------------------------------------------
// Render final: FX pendentes e balões acima do token.
// ------------------------------------------------------------
const labRenderD5Base_=labRender_;

window.labRender_=labRender_;




// ============================================================
// EXP-DIRECIONAL-6
// Correção específica da sincronização do movimento pelo mouse.
// Problemas corrigidos:
// 1) movSeqD4 reiniciava em 0 a cada recarga. O mestre podia ter seq antigo
//    maior e ignorar TODOS os movimentos novos do jogador.
// 2) movimento usava o mesmo documento da fila e o mestre o apagava depois
//    de processar. Um delete atrasado podia apagar uma atualização mais nova.
// 3) o cliente do jogador podia avançar a oportunidade localmente antes de
//    o mestre confirmar AÇ e posição, criando estados divergentes.
// Agora:
// - sequência usa relógio e continua monotônica após reload;
// - documento de movimento NÃO é apagado;
// - mestre processa posição absoluta e AÇ;
// - mestre é quem encerra a oportunidade quando o movimento zera AÇ;
// - snapshots antigos não fazem o token local voltar para trás.
// ============================================================

let labMovSeqD6Ultimo_=0;
const labMovPendentesD6_=new Map();

function labNovaSeqMovD6_(){
    let s=Date.now()*100;
    if(s<=labMovSeqD6Ultimo_)s=labMovSeqD6Ultimo_+1;
    labMovSeqD6Ultimo_=s;
    return s;
}

function labMovPendD6_(t,seq,final){
    if(!t)return;
    labMovPendentesD6_.set(String(t.id),{
        seq:Number(seq||0),
        x:Number(t.x||0),
        y:Number(t.y||0),
        angulo:Number(t.angulo||0),
        acoesAtuaisLab:Number(t.acoesAtuaisLab||0),
        movimentoUsadoDirecionalD1:Number(t.movimentoUsadoDirecionalD1||0),
        movimentoGratisDisponivel:t.movimentoGratisDisponivel,
        ate:performance.now()+(final?5000:2500)
    });
}

function labMovConfirmarD6_(id,seq){
    const p=labMovPendentesD6_.get(String(id));
    if(p&&Number(seq||0)>=Number(p.seq||0))labMovPendentesD6_.delete(String(id));
}

// Substitui apenas a sincronização do movimento contínuo.
// Movimento do mestre continua publicando o estado compartilhado.
// Movimento do jogador usa a fila, mas com sequência persistente.


// A camada D6 intercepta movimento antes das camadas antigas.
// Importante: não apaga o documento de movimento. O próximo setDoc o modifica,
// e o onSnapshot recebe a nova sequência sem risco de um delete atrasado.
const labProcessarComandoJogadorD6Base_=labProcessarComandoJogador_;


// Protege a posição local até o snapshot do mestre confirmar a mesma seq.
// Isso impede que outro write do mestre carregando a posição antiga faça o PJ
// "teletransportar" para trás enquanto o movimento ainda está sendo confirmado.
const labAplicarEstadoRemotoD6Base_=labAplicarEstadoRemotoD3_;


// Garante confirmação final mesmo se o pointerup ocorrer logo após a última
// amostra intermediária.
const labPararMouseD6Base_=labPararMouseD2_;
labPararMouseD2_=function(){
    const t=labAtorControlavelD1_();
    const r=labPararMouseD6Base_.apply(this,arguments);

    // A função-base já chamou labSincronizarMovimentoD2_(..., true).
    // Aqui apenas evita qualquer autoavanço local do jogador.
    if(t&&!batalhaEhMestre_()&&labEstado_.fase==='combate'){
        try{labRender_();}catch(_){}
    }
    return r;
};

window.labRender_=labRender_;




// ============================================================
// EXP-DIRECIONAL-7
// Ajustes de combate e autoridade visual:
// - mestre comum não reconstrói painel de PJ de outra conta;
// - seleção de ataque do jogador é local e não volta ao primeiro item;
// - defesa ativa mostra %; aparo só vale corpo a corpo e dentro do alcance;
// - efeitos especiais inexistentes são pulados sem abrir balão;
// - Resistência de ferimento entra no histórico privado do defensor;
// - Levantar reaparece quando necessário;
// - Testar ao lado de Sorte repete o ataque direcional (A);
// - som do ataque é imediato também na conta do jogador.
// ============================================================

// ------------------------------------------------------------
// 1) Modo do mestre: painel somente de PM / NPC / Monstro.
// Um PJ só vira "visão de jogador" quando foi explicitamente selecionado
// como personagem atual antes de entrar na Mesa.
// ------------------------------------------------------------
function labTokenPorCurrentCharD7_(){
    const cid=String(currentCharId||'');
    if(!cid)return null;
    return (labEstado_.tokens||[]).find(t=>
        String(t?.id||'')===cid ||
        String(t?.origemId||'')===cid ||
        String(t?.charLab?.id||'')===cid
    )||null;
}
function labMestrePJSelecionadoD7_(){
    if(!batalhaEhMestre_())return null;
    const t=labTokenPorCurrentCharD7_();
    return t&&labGrupo19_(t)==='PJ'?t:null;
}
function labMestreEspelhoPJD7_(){
    return !!labMestrePJSelecionadoD7_();
}

const labTokenPainelMestreD7Base_=labTokenPainelMestre21_;
labTokenPainelMestre21_=function(){
    if(!batalhaEhMestre_())return null;

    const espelho=labMestrePJSelecionadoD7_();
    if(espelho)return espelho;

    if(labEstado_.fase!=='combate'){
        return labTokenPainelMestreD7Base_.apply(this,arguments);
    }

    const pend=labEstado_.pendenciaLab;
    if(pend){
        const d=labTokenPorId_(pend.defensorId);
        if(d&&['PM','NPC','Monstro'].includes(labGrupo19_(d)))return d;
        const a=labTokenPorId_(pend.atacanteId);
        if(a&&['PM','NPC','Monstro'].includes(labGrupo19_(a)))return a;
        return null;
    }

    const dp=labEstado_.danoPendenteLab;
    if(dp){
        const a=labTokenPorId_(dp.atacanteId);
        if(a&&['PM','NPC','Monstro'].includes(labGrupo19_(a)))return a;
        return null;
    }

    const atual=labTokenAtual_();
    return atual&&['PM','NPC','Monstro'].includes(labGrupo19_(atual))?atual:null;
};

const labUsuarioPodeAgirComPainelD7Base_=labUsuarioPodeAgirComPainel21_;
labUsuarioPodeAgirComPainel21_=function(t){
    if(
        batalhaEhMestre_() &&
        labMestreEspelhoPJD7_() &&
        t &&
        String(t.id)===String(labMestrePJSelecionadoD7_()?.id||'')
    ){
        if(labEstado_.fase!=='combate')return true;
        const pend=labEstado_.pendenciaLab;
        if(pend&&String(pend.defensorId)===String(t.id))return true;
        const dp=labEstado_.danoPendenteLab;
        if(dp&&String(dp.atacanteId)===String(t.id))return true;
        return String(labTokenAtual_()?.id||'')===String(t.id);
    }
    return labUsuarioPodeAgirComPainelD7Base_.apply(this,arguments);
};

const labAtorControlavelD7Base_=labAtorControlavelD1_;
labAtorControlavelD1_=function(){
    if(batalhaEhMestre_()&&labMestreEspelhoPJD7_()){
        const t=labMestrePJSelecionadoD7_();
        if(!t)return null;
        if(labEstado_.fase!=='combate')return t;
        return String(labTokenAtual_()?.id||'')===String(t.id)?t:null;
    }
    return labAtorControlavelD7Base_.apply(this,arguments);
};

const labAtualizarAtuarComoD7Base_=labAtualizarAtuarComoE6_;
labAtualizarAtuarComoE6_=function(){
    const r=labAtualizarAtuarComoD7Base_.apply(this,arguments);
    if(!batalhaEhMestre_())return r;

    const sel=document.getElementById('labActAsE6');
    if(!sel)return r;

    const espelho=labMestrePJSelecionadoD7_();
    if(espelho){
        sel.innerHTML=`<option value="">${escaparHtmlInventario_(`PJ · ${espelho.nome||'Personagem'} · visão de jogador`)}</option>`;
        sel.disabled=true;
        return r;
    }

    if(labEstado_.fase==='combate'){
        const atual=labTokenAtual_();
        if(atual&&labGrupo19_(atual)==='PJ'){
            sel.innerHTML=`<option value="">${escaparHtmlInventario_(`👑 Mestre · turno de ${atual.nome||'PJ'}`)}</option>`;
            sel.disabled=true;
        }
    }
    return r;
};

// ------------------------------------------------------------
// 2) Preferências de ataque ficam no navegador que controla o PJ.
// Snapshot do mestre não volta a perícia/arma para a primeira opção.
// ------------------------------------------------------------
const labPrefsLocaisD7_=new Map();

function labGuardarPrefsD7_(t){
    if(!t)return;
    labPrefsLocaisD7_.set(String(t.id),{
        universalModoLab:String(t.universalModoLab||'combate'),
        periciaLab:String(t.periciaLab||''),
        equipamentoLab:String(t.equipamentoLab||''),
        universalPericiaIdLab:String(t.universalPericiaIdLab||''),
        universalPsiPoderIdLab:String(t.universalPsiPoderIdLab||''),
        universalPsiCustoLab:t.universalPsiCustoLab,
        defesaAtivaD1:String(t.defesaAtivaD1||'')
    });
}
function labAplicarPrefsD7_(rt,p){
    if(!rt||!p)return;
    rt.universalModoLab=p.universalModoLab;
    rt.periciaLab=p.periciaLab;
    rt.equipamentoLab=p.equipamentoLab;
    rt.universalPericiaIdLab=p.universalPericiaIdLab;
    rt.universalPsiPoderIdLab=p.universalPsiPoderIdLab;
    rt.universalPsiCustoLab=p.universalPsiCustoLab;
    if(p.defesaAtivaD1)rt.defesaAtivaD1=p.defesaAtivaD1;
}

const labAplicarEstadoRemotoD7Base_=labAplicarEstadoRemotoD3_;


function labTokenEscolhaPainelD7_(){
    return labTokenPainel21_()||labTokenAtual_();
}

window.labUniversalPrimeiro_=function(v){
    const t=labTokenEscolhaPainelD7_();if(!t)return;
    if(v==='__outras__'){
        t.universalModoLab='outras';t.acaoAuxLab=null;
    }else if(v==='__psi__'){
        t.universalModoLab='psi';t.acaoAuxLab=null;t.sortePreparadaLab=false;
    }else{
        t.universalModoLab='combate';
        t.periciaLab=String(v||'');
        t.equipamentoLab='';
        t.acaoAuxLab=null;
        labGarantirPrefsAtaque_(t);
    }
    labUniversalGarantir_(t);
    labGuardarPrefsD7_(t);
    try{labSalvarLocal_();}catch(_){}
    labRender_();
};

window.labUniversalSegundo_=function(v){
    const t=labTokenEscolhaPainelD7_();if(!t)return;
    if(t.universalModoLab==='outras'){
        t.universalPericiaIdLab=String(v||'');
    }else if(t.universalModoLab==='psi'){
        t.universalPsiPoderIdLab=String(v||'');
        t.universalPsiCustoLab=NaN;
        const p=labPsiPoderes_(t).find(x=>String(x.id)===String(v));
        const alvos=p?labPsiAlvos_(t,p):[];
        t.universalAlvoIdLab=(alvos.length===1&&String(alvos[0].id)===String(t.id))
            ?String(t.id):'';
    }else{
        t.equipamentoLab=String(v||'');
        labGarantirPrefsAtaque_(t);
    }
    labUniversalGarantir_(t);
    labGuardarPrefsD7_(t);
    try{labSalvarLocal_();}catch(_){}
    labRender_();
};

window.labMudarAtaquePref_=function(campo,v){
    const t=labTokenEscolhaPainelD7_();if(!t)return;
    t.microModoLab='ataque';
    t[campo]=String(v||'');
    if(campo==='periciaLab')t.equipamentoLab='';
    labGarantirPrefsAtaque_(t);
    labGuardarPrefsD7_(t);
    try{labSalvarLocal_();}catch(_){}
    labRender_();
};

const labMudarDefesaAtivaD7Base_=window.labMudarDefesaAtivaD1_;
window.labMudarDefesaAtivaD1_=function(v){
    const r=labMudarDefesaAtivaD7Base_.apply(this,arguments);
    const t=labTokenEscolhaPainelD7_();
    if(t)labGuardarPrefsD7_(t);
    return r;
};

// ------------------------------------------------------------
// 3) Defesa ativa: porcentagem, aparo e fallback automático para Esquiva.
// A escolha de aparo permanece selecionada depois de um ataque à distância.
// ------------------------------------------------------------
function labEhEsquivaD7_(p){
    return normalizarTextoCombate_(`${p?.id||''} ${getNome(p)||''}`).includes('esquiva');
}
function labAparoAlcanceD7_(t,p){
    if(!t||!p||labEhEsquivaD7_(p))return Infinity;
    const c=labCharToken_(t);if(!c)return 0;
    let max=0;
    try{
        for(const x of (batalhaEquipamentos_(c,p,'')||[])){
            const item=x?.item;
            if(item)max=Math.max(max,Number(labAlcanceAtaque_(t,item)||0));
        }
    }catch(_){}
    const n=normalizarTextoCombate_(`${p.id||''} ${getNome(p)||''}`);
    if(/combate desarmado|combate_desarmado/.test(n))max=Math.max(max,1.5);
    return max||1.8;
}

labDefesaAtivaD1_=function(t,itemAtaque=null){
    labGarantirDefesasD1_(t);
    const defs=labDefesasDisponiveis_(t)||[];
    if(!defs.length)return null;

    const esquiva=defs.find(labEhEsquivaD7_)||null;
    let escolhida=defs.find(x=>batalhaTokenPericia_(x)===String(t.defesaAtivaD1||''));

    if(!escolhida){
        escolhida=esquiva||defs[0];
        if(escolhida)t.defesaAtivaD1=batalhaTokenPericia_(escolhida);
    }

    if(itemAtaque&&labAtaqueEhDistancia_(itemAtaque)){
        return esquiva;
    }

    if(itemAtaque&&escolhida&&!labEhEsquivaD7_(escolhida)){
        const dist=Number(labEstado_.pendenciaLab?.distancia);
        const alcance=labAparoAlcanceD7_(t,escolhida);
        if(Number.isFinite(dist)&&dist>alcance+.05){
            return esquiva;
        }
    }

    return escolhida||esquiva||defs[0];
};

function labAtualizarDefesaUID7_(){
    const row=document.querySelector('#labActionPanel .lab-defesa-ativa-d1');
    const t=labTokenPainel21_();
    if(!row||!t)return;

    const sel=row.querySelector('select');
    const c=labCharToken_(t);
    const defs=labDefesasDisponiveis_(t)||[];

    if(sel&&c){
        const atual=String(t.defesaAtivaD1||'');
        sel.innerHTML=defs.map(p=>{
            const k=batalhaTokenPericia_(p);
            const valor=labValorDefesa_(c,p);
            return `<option value="${escaparHtmlInventario_(k)}" ${k===atual?'selected':''}>${escaparHtmlInventario_(getNome(p))} (${valor}%)</option>`;
        }).join('');
    }

    let nota=row.querySelector('.lab-defesa-nota-d7');
    if(!nota){
        nota=document.createElement('span');
        nota.className='lab-defesa-nota-d7';
        nota.style.cssText='margin-left:auto;color:#9fc6d8;font-size:.93em;text-align:right;max-width:520px;';
        row.appendChild(nota);
    }

    const ativa=defs.find(p=>batalhaTokenPericia_(p)===String(t.defesaAtivaD1||''));
    if(ativa&&!labEhEsquivaD7_(ativa)){
        const alcance=labAparoAlcanceD7_(t,ativa);
        nota.textContent=`Aparar: corpo a corpo, alcance ${alcance.toFixed(1)} m. Contra ataque à distância ou fora do alcance, usa Esquiva.`;
        nota.style.display='';
    }else{
        nota.textContent='';
        nota.style.display='none';
    }
}

// ------------------------------------------------------------
// 4) Sem efeito especial real = dano direto, sem balão "Pular".
// ------------------------------------------------------------
const labAutoSemEfeitoD7_=new Set();

function labAgendarDanoSemEfeitoD7_(){
    if(!batalhaEhMestre_())return;
    const dp=labEstado_.danoPendenteLab;
    if(!dp||dp.escolhendoLocalizacao||Number(dp.efeitosRestantes||0)<=0)return;

    let efs=[];
    try{efs=labEfeitosDisponiveis_(dp)||[];}catch(_){}
    if(efs.length)return;

    const id=String(dp.id||`${dp.atacanteId}:${dp.defensorId}`);
    if(labAutoSemEfeitoD7_.has(id))return;
    labAutoSemEfeitoD7_.add(id);

    dp.efeitosRestantes=0;
    dp.danoAutomatico=true;
    try{labSalvarLocal_();labAgendarSyncRemoto_();}catch(_){}

    0;
}

const labRenderResolucaoPJD7Base_=labRenderResolucaoPJ19_;
labRenderResolucaoPJ19_=function(el,dp,a,d){
    if(dp&&Number(dp.efeitosRestantes||0)>0&&!dp.escolhendoLocalizacao){
        let efs=[];
        try{efs=labEfeitosDisponiveis_(dp)||[];}catch(_){}
        if(!efs.length){
            el.style.display='none';
            el.innerHTML='';
            return;
        }
    }
    return labRenderResolucaoPJD7Base_.apply(this,arguments);
};

const labMicroPainelD7Base_=labMicroPainelHtml_;
labMicroPainelHtml_=function(alvoVisual,ppm,d){
    const dp=labEstado_.danoPendenteLab;
    const ator=labAtorControlavelD1_();
    if(
        dp&&ator&&alvoVisual &&
        String(dp.defensorId)===String(alvoVisual.id) &&
        String(dp.atacanteId)===String(ator.id) &&
        Number(dp.efeitosRestantes||0)>0 &&
        !dp.escolhendoLocalizacao
    ){
        let efs=[];
        try{efs=labEfeitosDisponiveis_(dp)||[];}catch(_){}
        if(!efs.length)return '';
    }
    return labMicroPainelD7Base_.apply(this,arguments);
};

// ------------------------------------------------------------
// 5) Resistência do choque/ferimento entra no histórico de quem sofreu.
// ------------------------------------------------------------
const labAplicarDanoLocalD7Base_=labAplicarDanoLocal_;
labAplicarDanoLocal_=function(defensor,total,item,opcoes={}){
    const r=labAplicarDanoLocalD7Base_.apply(this,arguments);
    if(defensor&&r?.resistencia){
        const x=r.resistencia;
        const choque=Number(r.stunTurnos||0)>0
            ?` · choque ${Number(r.stunTurnos)} oportunidade(s)`
            :'';
        labRegistrarResultadoProprio_(
            defensor,
            `Resistência: ${Number(x.roll)}/${Number(x.valor)} → ${x.grau}${choque}.`
        );
    }
    return r;
};

// ------------------------------------------------------------
// 6) Testar no painel = tecla A, quando há alvo, perícia e arma.
// ------------------------------------------------------------
function labAlvoSelecionadoAtaqueD7_(t){
    if(!t)return null;

    let id='';
    if(!batalhaEhMestre_()){
        try{id=String(labAlvoLocalJogador23_.get(String(t.id))||'');}catch(_){}
    }
    if(!id)id=String(t.alvoLab||'');
    if(!id&&String(labEstado_.selecionadoId||'')!==String(t.id)){
        id=String(labEstado_.selecionadoId||'');
    }
    return id?labAlvoAtaquePorId_(id):null;
}

window.labTestarAtaqueD7_=function(){
    const t=labAtorControlavelD1_();if(!t||labEstado_.fase!=='combate')return;
    labGarantirPrefsAtaque_(t);
    const per=labPericiaPorToken_(t,t.periciaLab);
    const item=labItemSelecionado_(t);
    const alvo=labAlvoSelecionadoAtaqueD7_(t);
    if(!per||!item||!alvo){
        notificar_('Selecione alvo, perícia de ataque e arma.','aviso',2400);
        return;
    }

    t.alvoLab=String(alvo.id);
    t._alvoManualFixadoLab=String(alvo.id);
    t._alvoSelecionadoMapa763=true;
    try{labApontarPara_(t,alvo);}catch(_){}
    return window.labAtacarDirecaoD1_();
};

function labGarantirBotaoTestarD7_(){
    if(labEstado_.fase!=='combate')return;
    const el=document.getElementById('labActionPanel');
    const t=labTokenPainel21_();
    if(!el||!t||t.universalModoLab==='outras'||t.universalModoLab==='psi')return;
    if(!labUsuarioPodeAgirComPainel21_(t))return;

    const per=labPericiaPorToken_(t,t.periciaLab);
    const item=labItemSelecionado_(t);
    const alvo=labAlvoSelecionadoAtaqueD7_(t);
    const habilitado=!!per&&!!item&&!!alvo&&Number(t.acoesAtuaisLab||0)>0&&!window.__LAB_ATK_PEND_D5__&&!labEstado_.pendenciaLab&&!labEstado_.danoPendenteLab;

    let b=[...el.querySelectorAll('button')].find(x=>/^\s*🎲?\s*Testar\s*$/i.test(String(x.textContent||'').trim()));
    if(!b){
        const sorte=[...el.querySelectorAll('button')].find(x=>/Sorte|Preparada/.test(x.textContent||''));
        if(!sorte)return;
        const slot=sorte.parentElement?.nextElementSibling;
        b=document.createElement('button');
        b.className='btn-small btn-select lab-testar-ataque-d7';
        b.textContent='🎲 Testar';
        b.style.cssText='width:100%;height:48px;margin:0;';
        if(slot&&slot.children.length===0)slot.appendChild(b);
        else sorte.parentElement?.after(b);
    }
    for(const extra of [...el.querySelectorAll('button')]){
        if(extra!==b&&/^(?:🎲\s*)?(?:Testar|Atacar(?: \(1 AÇ\))?)$/.test(String(extra.textContent||'').trim()))extra.remove();
    }
    b.onclick=()=>window.labTestarAtaqueD7_();
    b.disabled=!habilitado;
    b.classList.add('lab-testar-ataque-d7');
}

// ------------------------------------------------------------
// 7) Levantar nunca desaparece quando o personagem controlado está caído.
// ------------------------------------------------------------
function labGarantirLevantarD7_(){
    if(labEstado_.fase!=='combate')return;
    const el=document.getElementById('labActionPanel');
    const t=labTokenPainel21_();
    if(!el||!t||!labUsuarioPodeAgirComPainel21_(t))return;

    const caido=!!labGarantirSnapshotCombate_(t)?.derrubado;
    if(!caido)return;

    let b=[...el.querySelectorAll('button')].find(x=>/Levantar/i.test(x.textContent||''));
    if(b){
        b.disabled=Number(t.acoesAtuaisLab||0)<=0;
        return;
    }

    const row=[...el.querySelectorAll('div')].find(x=>
        [...x.children].some(c=>c.tagName==='BUTTON'&&/Passar/i.test(c.textContent||''))
    );
    if(!row)return;

    b=document.createElement('button');
    b.className='btn-small lab-levantar-d7';
    b.textContent='⬆️ Levantar';
    b.disabled=Number(t.acoesAtuaisLab||0)<=0;
    b.style.height='42px';
    b.onclick=()=>window.labLevantar_();
    row.appendChild(b);
}

// ------------------------------------------------------------
// 8) Feedback de som imediato no navegador do jogador.
// FX de acerto/falha já é gerado pela DIRECIONAL5 e compartilhado.
// ------------------------------------------------------------
const labAtacarDirecaoD7Base_=window.labAtacarDirecaoD1_;
window.labAtacarDirecaoD1_=async function(){
    if(!batalhaEhMestre_()){
        const t=labAtorControlavelD1_();
        const item=t?labItemSelecionado_(t):null;
        if(t&&item&&!window.__LAB_ATK_PEND_D5__&&!labEstado_.pendenciaLab&&!labEstado_.danoPendenteLab&&Number(t.acoesAtuaisLab||0)>0){
            try{labSomAtaque_(item,'');}catch(_){}
        }
    }
    return labAtacarDirecaoD7Base_.apply(this,arguments);
};

// ------------------------------------------------------------
// Pós-render D7.
// ------------------------------------------------------------
const labRenderD7Base_=labRender_;

window.labRender_=labRender_;


// EXP-SYNC-CONSISTENTE-1: identidade da oportunidade e autoridade do avanço.

const labIniciarCombateD8Base_=window.labIniciarCombate_;
window.labIniciarCombate_=function(){
    if(!batalhaEhMestre_())return;
    labEstado_.combateIdD8=`combate_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return labIniciarCombateD8Base_.apply(this,arguments);
};
const labEncerrarOportunidadeD8Base_=window.labEncerrarOportunidade_;
window.labEncerrarOportunidade_=function(){
    if(!batalhaEhMestre_()||labEstado_.fase!=='combate'||labEstado_.pendenciaLab||labEstado_.danoPendenteLab)return;
    const r=labEncerrarOportunidadeD8Base_.apply(this,arguments);
    labAgendarSyncRemoto_();
    return r;
};

// Passar e Levantar do PJ também são confirmados pelo mestre.
const labAcoesSimplesD8_={passar_d8:window.labPassarAcao_,levantar_d8:window.labLevantar_};
for(const [nome,tipo] of [['labPassarAcao_','passar_d8'],['labLevantar_','levantar_d8']]){
    window[nome]=function(){
        if(batalhaEhMestre_())return labAcoesSimplesD8_[tipo].apply(this,arguments);
        const t=labAtorControlavelD1_();
        if(!t||labEstado_.pendenciaLab||labEstado_.danoPendenteLab||window.__LAB_ATK_PEND_D5__)return;
        return labEnviarComandoJogador_(tipo,{oportunidadeD8:labChaveOportunidadeD8_()},t);
    };
}
const labProcessarSimplesD8Base_=labProcessarComandoJogador_;


function labComContextoLocal_(state, drawing, action){
    const previous=labEstado_,wasDrawing=labDrawing_,wasReducing=labReducing_;
    labEstado_=state;labDrawing_=drawing;labReducing_=!drawing;
    // Regras antigas agendavam a continuação por timer. Agora as continuações
    // de combate pertencem ao redutor, não ao tempo de vida de uma tela.
    const timer=window.setTimeout;
    if(!drawing)window.setTimeout=()=>0;
    try{return action();}
    finally{window.setTimeout=timer;labEstado_=previous;labDrawing_=wasDrawing;labReducing_=wasReducing;}
}

function labErroSync_(error){
    console.error('[Mesa Sync]',error);
    notificar_('Sincronização não confirmada. A ação não foi aplicada no estado compartilhado.','erro',6000);
}

function labAvancarConfirmado_(state,expected,options={}){
    const t=labTokenAtual_();
    if(!mesaAdvance(state,expected,options))return false;
    if(t){
        const st=t.combateLab;
        if(st?.ataquesBloqueadosTurnos>0)st.ataquesBloqueadosTurnos--;
        if(st?.atordoadoAteOportunidade){st.atordoado=false;st.atordoadoAteOportunidade=false;}
        labPsiPassarDuracoesDoAtor_(t);
        t.alvoLab='';t._alvoManualFixadoLab='';t._alvoSelecionadoMapa763=false;
    }
    labEstado_.selecionadoId=String(labTokenAtual_()?.id||'');
    return true;
}

function labReceberConfirmado_(packet){
    // Estados criados pela versão anterior não tinham metadados do protocolo.
    // Tratamos o snapshot legado como a revisão inicial para que a primeira
    // confirmação não seja descartada e o cliente não volte à posição antiga.
    if(packet?.estado && packet.protocol!==1){
        packet={...packet,protocol:1,revision:Number.isSafeInteger(packet.revision)?packet.revision:0};
    }
    if(!mesaAcceptSnapshot(labConfirmedPacket_,packet))return;
    labConfirmedPacket_=packet;
    const previous=labEstado_,localTokens=previous.tokens||[];
    labEstado_=mesaCopy(packet.estado);
    labEstado_.oficina2State=previous.oficina2State;
    labEstado_.selecionadoId=previous.selecionadoId;
    labEstado_.objetoSelecionadoId=previous.objetoSelecionadoId;
    labEstado_.pxPorMetro=batalhaEhMestre_()?previous.pxPorMetro:48;
    for(const t of labEstado_.tokens||[]){
        const local=localTokens.find(x=>String(x.id)===String(t.id));
        if(local?.charLab)t.charLab=local.charLab;
        const pref=labPrefsLocaisD7_.get(String(t.id));
        if(pref)labAplicarPrefsD7_(t,pref);
        const visual=labVisualMovement_.get(String(t.id));
        if(visual&&(visual.opportunity!==mesaOpportunity(packet.estado)||
            (visual.final&&t.movementConfirmed?.gesture===visual.gesture&&t.movementConfirmed.sequence>=visual.lastSequence))){
            labVisualMovement_.delete(String(t.id));
        }
    }
    window.__LAB_ATK_PEND_D5__='';
    labDraftGeneration_++;
    labRender_();
}

function labResultadoAutomatico_(){
    labSanearPendenciasMortos490_();
    if(labEstado_.pendenciaLab)labAutoResolverDefesaD1_();
    const dp=labEstado_.danoPendenteLab;
    if(dp&&!dp.escolhendoLocalizacao){
        if(!(labEfeitosDisponiveis_(dp)||[]).length)dp.efeitosRestantes=0;
        if(Number(dp.efeitosRestantes||0)<=0)labRolarDanoSync19Base_();
    }
    const t=labTokenAtual_();
    if(t&&Number(t.acoesAtuaisLab||0)<=0&&!labEstado_.pendenciaLab&&!labEstado_.danoPendenteLab){
        labAvancarConfirmado_(labEstado_,mesaOpportunity(labEstado_));
    }
}

function labReduzirComando_(state,c){
    if(Date.now()-Number(c.createdAt)>60000)return false;
    return labComContextoLocal_(state,false,()=>{
        const t=labTokenPorId_(c.actor),p=c.payload||{};
        const own=c.uid===String(currentUserUid)&&batalhaEhMestre_();
        if(!t&&c.type!=='host:labIniciarCombate_')return false;
        if(t&&!own&&!labUidPertenceToken18_(t,c.uid))return false;
        if(state.fase==='combate'&&c.opportunity!==mesaOpportunity(state))return false;
        // Dados da ficha são locais, mas os recursos de combate vêm do estado.
        for(const token of state.tokens||[]){labGarantirSnapshotCombate_(token);labGarantirDefesasD1_(token);}
        if(c.type==='movement'){
            const ok=mesaMove(state,c,labMovimentoPorAcao_(t));
            if(ok){labFogoContatoImediato530_();labResultadoAutomatico_();}return ok;
        }
        if(c.type.startsWith('host:')){
            if(!own)return false;
            const name=c.type.slice(5),fn=labRuleHandlers_.get(name);
            if(!fn)return false;
            if(p.preferences&&t)Object.assign(t,p.preferences);
            const before=mesaOpportunity(state);
            fn(...(p.args||[]));
            if(/^labPS(Iniciar|Continuar|Concluir)_$/.test(name))labAvancarConfirmado_(state,before);
            labResultadoAutomatico_();return true;
        }
        const resolution=['efeito_especial19','efeito_localizacao19','efeito_pular19','dano19','defesa','defesa_ativa_d1'];
        if(state.fase==='combate'&&!resolution.includes(c.type)&&String(labTokenAtual_()?.id)!==String(t.id))return false;
        if(c.type==='ataque_direcional_d1'||c.type==='ataque'){
            if(state.fase!=='combate'||state.pendenciaLab||state.danoPendenteLab||Number(t.acoesAtuaisLab)<=0)return false;
            t.periciaLab=String(p.periciaLab||t.periciaLab||'');t.equipamentoLab=String(p.equipamentoLab||t.equipamentoLab||'');
            labRollForcadoD5_=Number(p.rolagemD5)||null;labFxIdForcadoD5_=String(p.fxIdD5||'');
            try{labExecutarAtaqueDirecionalMestreD1_(t,String(p.alvoId||''));}
            finally{labRollForcadoD5_=null;labFxIdForcadoD5_='';}
        }else if(c.type==='passar_d8')labAvancarConfirmado_(state,mesaOpportunity(state),{pass:true});
        else if(c.type==='levantar_d8')labRuleHandlers_.get('labLevantar_')();
        else if(c.type==='defesa_ativa_d1')t.defesaAtivaD1=String(p.defesaAtivaD1||'');
        else if(c.type==='ps_iniciar22'){t.acaoAuxLab={tipo:'primeiros_socorros',alvoId:p.alvoId,local:p.local};labPSIniciarSync22Base_();labAvancarConfirmado_(state,mesaOpportunity(state));}
        else if(c.type==='ps_continuar22'){labPSContinuarSync22Base_();labAvancarConfirmado_(state,mesaOpportunity(state));}
        else if(c.type==='ps_concluir22'){labPSConcluirSync22Base_();labAvancarConfirmado_(state,mesaOpportunity(state));}
        else if(c.type==='explorar_auto18'&&state.fase!=='combate')labExplorarResolver18_(t,p);
        else if(c.type==='acao_objeto'||c.type==='acao_objeto_auto17')labObjetoAcaoExecutar_(t,labObjetoPorId_(p.objetoId),p.tipo);
        else if(c.type==='teste_pericia'){t.acaoAuxLab={tipo:'teste_pericia',periciaToken:p.periciaToken};labExecutarTeste_();}
        else if(c.type==='psiquismo'){t.acaoAuxLab={tipo:'psiquismo',poderId:p.poderId,alvoId:p.alvoId,custo:p.custo,local:p.local};labUsarPsiExecutar_();}
        else if(resolution.includes(c.type)){
            const dp=state.danoPendenteLab;
            if(c.type==='defesa'){
                if(String(state.pendenciaLab?.defensorId)!==String(t.id))return false;
                labAutoResolverDefesaD1_();
            }else{
                if(!dp||String(dp.atacanteId)!==String(t.id)||String(dp.id)!==String(p.danoPendenteId))return false;
                if(c.type==='efeito_especial19'){
                    if(!(labEfeitosDisponiveis_(dp)||[]).some(e=>e.id===p.efeito))return false;
                    labEscolherEfeitoSync19Base_(p.efeito);
                }else if(c.type==='efeito_localizacao19'){
                    if(!dp.escolhendoLocalizacao||!Object.hasOwn(labGarantirSnapshotCombate_(labTokenPorId_(dp.defensorId)).hitMax,p.local))return false;
                    labConfirmarLocalizacaoSync19Base_(p.local);
                }else if(c.type==='efeito_pular19')labPularEfeitosSync19Base_();
                else if(c.type==='dano19'){if(dp.efeitosRestantes>0||dp.escolhendoLocalizacao)return false;labRolarDanoSync19Base_();}
            }
        }else return false;
        labResultadoAutomatico_();return true;
    });
}

function labIniciarTransporte_(){
    labTransport_?.close();clearInterval(labLeaseTimer_);
    labMapaMesaUnsub_?.();labMapaAcoesUnsub_?.();
    labMapaMesaUnsub_=null;labMapaAcoesUnsub_=null;
    labTransport_=null;
    if(!currentUserUid||labSuspensoParaNova_)return;
    labConfirmedPacket_=null;
    const reference=path=>doc(db,...path.split('/'));
    labTransport_=createMesaTransport({session:LAB_SESSION_SYNC_,uid:()=>currentUserUid,isMaster:batalhaEhMestre_,
        statePath:LAB_SYNC_STATE_PATH_,commandPath:LAB_SYNC_COMMAND_PATH_,movementPath:LAB_SYNC_MOVEMENT_PATH_,
        transact:fn=>runTransaction(db,async native=>fn({
            get:async path=>{const s=await native.get(reference(path));return s.exists()?s.data():null;},
            set:(path,value)=>native.set(reference(path),value)
        })),
        read:async path=>(await getDocs(query(collection(db,...path.split('/')),where('status','==','new')))).docs.map(d=>({path:d.ref.path,data:d.data()})),
        write:(path,value)=>setDoc(reference(path),value),
        remove:path=>deleteDoc(reference(path)),
        subscribe:(path,receive,many)=>many?
            onSnapshot(query(collection(db,...path.split('/')),where('status','==','new')),snap=>snap.docChanges().filter(c=>c.type!=='removed').forEach(c=>receive({path:c.doc.ref.path,data:c.doc.data()})),labErroSync_):
            onSnapshot(reference(path),snap=>{if(snap.exists())receive(snap.data());},labErroSync_),
        reduce:labReduzirComando_,onState:labReceberConfirmado_,onError:labErroSync_
    });
    labTransport_.start();
    const renew=()=>labTransport_?.renew().catch(labErroSync_);
    renew();labLeaseTimer_=setInterval(renew,4000);
    labEscutarCenaD3_();
}

async function labEnviarComandoJogador_(type,payload={},actor=null){
    if(labDrawing_||labReducing_)return false;
    const t=actor||labAtorControlavelD1_();if(!t||!labTransport_||!labConfirmedPacket_)return false;
    if(type==='movimento')return labEnviarMovimentoConfirmado_(t,payload,true);
    try{await labTransport_.send(type,String(t.id),mesaCopy(payload),mesaOpportunity(labConfirmedPacket_.estado));return true;}
    catch(e){labErroSync_(e);return false;}
}

function labSalvarLocal_(){
    if(labDrawing_||labReducing_)return;
    // Cache de recuperação somente. Não publica nem resolve consequências.
    if(labConfirmedPacket_)localStorage.setItem('mesaEstelarLabCombate',JSON.stringify(labConfirmedPacket_.estado));
}
function labAgendarSyncRemoto_(){
    // As alterações de jogo são publicadas somente por comandos/transações.
    // Chamadas de compatibilidade não têm efeitos de rede.
}
function labProcessarComandoJogador_(){/* processamento pertence ao transporte */}
function labAplicarEstadoRemotoD3_(){/* snapshots passam por labReceberConfirmado_ */}
function labAutoAvancarSeSemAcoes_(){return false;/* redutor conclui a ação */}
function labChaveOportunidadeD8_(){return mesaOpportunity(labEstado_);}

function labEnviarMovimentoConfirmado_(t,payload,final){
    if(!labConfirmedPacket_||!labTransport_)return false;
    let v=labVisualMovement_.get(String(t.id));
    const opportunity=mesaOpportunity(labConfirmedPacket_.estado);
    if(!v||v.opportunity!==opportunity){
        const confirmed=labConfirmedPacket_.estado.tokens.find(x=>String(x.id)===String(t.id));
        if(!confirmed)return false;
        v={x:confirmed.x,y:confirmed.y,distance:0,gesture:crypto.randomUUID(),opportunity,lastSent:0};
        labVisualMovement_.set(String(t.id),v);
    }
    if(payload){v.distance+=Math.hypot(payload.x-v.x,payload.y-v.y);v.x=payload.x;v.y=payload.y;v.angle=payload.angulo??t.angulo;}
    v.final=!!final;
    if(!final&&performance.now()-v.lastSent<200)return true;
    v.lastSent=performance.now();
    return labTransport_.send('movement',String(t.id),{x:v.x,y:v.y,distance:v.distance,angle:Number(v.angle||0),gesture:v.gesture,final},opportunity)
        .then(id=>{
            v.lastSequence=Number(id.slice(id.lastIndexOf('_')+1));
            if(final&&labConfirmedPacket_?.lastCommand?.id===id){labVisualMovement_.delete(String(t.id));labRender_();}
            return true;
        }).catch(e=>{labVisualMovement_.delete(String(t.id));labRender_();labErroSync_(e);return false;});
}
function labSincronizarMovimentoD2_(t,final=false){return labEnviarMovimentoConfirmado_(t,null,final);}

function labAplicarMovimentoEstadoD2_(t,dx,dy,dist){
    if(!t||!labConfirmedPacket_||labDrawing_||labReducing_)return false;
    const length=Math.hypot(dx,dy);if(length<.0001)return false;
    let visual=labVisualMovement_.get(String(t.id));
    if(!visual){
        visual={x:t.x,y:t.y,distance:0,gesture:crypto.randomUUID(),opportunity:mesaOpportunity(labConfirmedPacket_.estado),lastSent:0};
        labVisualMovement_.set(String(t.id),visual);
    }
    const candidate={...visual,x:visual.x+dx/length*dist,y:visual.y+dy/length*dist,distance:visual.distance+dist,
        angle:labAnguloDeVetorD1_(dx,dy)};
    const preview=mesaCopy(labConfirmedPacket_.estado);
    const command={actor:String(t.id),stream:LAB_SESSION_SYNC_,sequence:Number.MAX_SAFE_INTEGER,opportunity:visual.opportunity,payload:candidate};
    if(!mesaMove(preview,command,labMovimentoPorAcao_(t)))return false;
    const result=preview.tokens.find(x=>String(x.id)===String(t.id));
    if(Math.hypot(result.x-visual.x,result.y-visual.y)<.00001)return false;
    visual.distance+=Math.hypot(result.x-visual.x,result.y-visual.y);
    visual.x=result.x;visual.y=result.y;visual.angle=candidate.angle;
    return true;
}

function labRender_(){
    if(labDrawing_||labReducing_)return;
    const view=mesaCopy(labEstado_);
    for(const t of view.tokens||[]){const v=labVisualMovement_.get(String(t.id));if(v){t.x=v.x;t.y=v.y;t.angulo=v.angle;}}
    labComContextoLocal_(view,true,()=>{
        labDesenharBase_();
        const visuals=[window.labViewNativeInstall_,labRenderPainelPersistente21_,labEntradaLivreAtualizar530_,labAtualizarControlePJ760_,labQuickToolsUpdate760_,labAtualizarAtuarComoE6_,labAtualizarInfo_,
            labAtualizarDefesaUID7_,labGarantirBotaoTestarD7_,labGarantirLevantarD7_,labAjustarRotulosTokens23_,
            labRenderEventosVisuaisD5_,labRenderFogoObjetos481_,labRenderFormasMapa490_,labEstadosVisuais763_,
            labAplicarOcultacaoAnoitecerV46470_,labRenderPsiVisuais_,labPsiRenderModalMestre_,labPsiRenderModalJogador_,
            labRenderPsiInboxMestre_,labInstalarControlesD2_,labAnexarPVAlvoMestre22_,labCameraAtualizarE6_,labAtualizarZoomE6_];
        for(const visual of visuals){if(typeof visual!=='function')continue;try{visual();}catch(e){console.warn('[Mesa visual]',visual.name,e);}}
    });
}

function labInstalarAcoesConfirmadas_(){
    const names=['labIniciarCombate_','labVoltarPreparacao_','labLevantar_','labPassarAcao_','labEncerrarOportunidade_',
        'labAtacarDirecaoD1_','labRolarAtaque_','labEscolherEfeito_','labConfirmarLocalizacao_','labPularEfeitos_','labRolarDano_',
        'labPSIniciar_','labPSContinuar_','labPSConcluir_','labResetarAcoes_'];
    for(const name of names){
        const old=window[name];if(typeof old!=='function')continue;labRuleHandlers_.set(name,old);
        window[name]=function(...args){
            if(labDrawing_)return;
            if(labReducing_)return labRuleHandlers_.get(name)(...args);
            if(!batalhaEhMestre_())return old(...args);
            if(!labTransport_?.isLeader()||!labConfirmedPacket_){notificar_('Esta aba está observando. Aguarde a sessão do mestre confirmar a liderança.','aviso');return;}
            const t=labAtorControlavelD1_()||labTokenAtual_();
            const preferences=t?Object.fromEntries(['periciaLab','equipamentoLab','alvoLab','acaoAuxLab','defesaAtivaD1','sortePreparadaLab'].map(k=>[k,t[k]??null])):null;
            return labTransport_.send('host:'+name,String(t?.id||''),{args,preferences},mesaOpportunity(labConfirmedPacket_.estado)).catch(labErroSync_);
        };
    }
    // Turno e Passar têm uma só implementação e preservam a regra aprovada.
    labRuleHandlers_.set('labPassarAcao_',()=>labAvancarConfirmado_(labEstado_,mesaOpportunity(labEstado_),{pass:true}));
    labRuleHandlers_.set('labEncerrarOportunidade_',()=>labAvancarConfirmado_(labEstado_,mesaOpportunity(labEstado_)));
    window.iniciarMapaMesaCompartilhado_=labIniciarTransporte_;
    window.labRender_=labRender_;
}
labInstalarAcoesConfirmadas_();

