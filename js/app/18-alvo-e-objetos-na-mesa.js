// ============================================================
// V46.77.0 — correções finais desta rodada
// ============================================================

// Um alvo explicitamente escolhido nunca deve ser trocado por "primeiro alvo válido"
// durante a preparação do ataque, inclusive bonecos de treino.
const labGarantirPrefsAtaque740Base_=labGarantirPrefsAtaque_;
labGarantirPrefsAtaque_=function(t){
 if(!t)return labGarantirPrefsAtaque740Base_(t);
 const fixo=String(t._alvoComandoFixadoLab||t._alvoManualFixadoLab||t.alvoLab||'');
 const valido=fixo&&labAlvosAtaque_(t).some(a=>String(a.id)===fixo);
 labGarantirPrefsAtaque740Base_(t);
 if(valido)t.alvoLab=fixo;
};

const labRolarAtaque740Base_=window.labRolarAtaque_;
window.labRolarAtaque_=function(){
 const t=labTokenAtual_(),fixo=t?String(t._alvoComandoFixadoLab||t._alvoManualFixadoLab||t.alvoLab||''):'';
 if(t&&fixo&&labAlvoAtaquePorId_(fixo))t.alvoLab=fixo;
 const r=labRolarAtaque740Base_();
 if(t){t._alvoComandoFixadoLab='';/* manual permanece até usuário escolher outro alvo */}
 return r;
};

// O editor antigo da Mesa fica definitivamente aposentado.
// Até a Oficina 2 ser acoplada ao botão Editar mapa, ficam somente carregamento,
// escala e controles de combate.
try{
 const oldToggle=window.labAlternarModoCriacaoMapa_;
 window.labAlternarModoCriacaoMapa_=function(){
   labEstado_.modoCriacaoMapa=false;
   const box=document.getElementById('labMapCreationControls');if(box)box.style.setProperty('display','none','important');
   const ck=document.getElementById('labModoCriarMapa');if(ck)ck.checked=false;
   if(typeof labSalvarLocal_==='function')labSalvarLocal_();
   if(typeof labRender_==='function')labRender_();
 };
}catch(_){}

// Mantém o seletor de mapas da Oficina 2 atualizado quando o banco é recarregado.
try{
 const recBase740_=window.recarregarBancoMapas_;
 if(recBase740_)window.recarregarBancoMapas_=async function(){
   const r=await recBase740_.apply(this,arguments);
   try{gm2populateMapSelect();}catch(_){}
   return r;
 };
}catch(_){}


// ============================================================
// V46.77.0 — rollback seguro + alvo de objetos endurecido
// ============================================================

// A integração experimental da Oficina 2 no Mapa da Mesa foi retirada desta versão.
// Mantemos a Oficina 2 separada e estável. O editor antigo da Mesa continua oculto.
// Isto evita interferência no carregamento de personagens, cenário e inicialização geral.

const labGarantirPrefsAtaque752Base_=labGarantirPrefsAtaque_;
labGarantirPrefsAtaque_=function(t){
 if(!t)return labGarantirPrefsAtaque752Base_(t);

 // Se o usuário acabou de selecionar um objeto no mapa, essa seleção visual é a autoridade.
 const objId=String(labEstado_?.objetoSelecionadoId||'');
 const obj=objId?labObjetoPorId_(objId):null;
 if(obj && obj.destrutivel!==false){
   t.alvoLab=objId;
   t._alvoManualFixadoLab=objId;
 }

 const escolhido=String(t._alvoComandoFixadoLab||t._alvoManualFixadoLab||t.alvoLab||'');
 const valido=escolhido&&labAlvosAtaque_(t).some(a=>String(a.id)===escolhido);

 labGarantirPrefsAtaque752Base_(t);

 if(valido)t.alvoLab=escolhido;
};

// Antes de atacar, reaplica a seleção visível do objeto.
// Isso impede o painel de voltar silenciosamente para outro personagem.
const labRolarAtaque752Base_=window.labRolarAtaque_;
window.labRolarAtaque_=function(){
 const t=labTokenAtual_();
 if(t){
   const objId=String(labEstado_?.objetoSelecionadoId||'');
   const obj=objId?labObjetoPorId_(objId):null;
   if(obj && obj.destrutivel!==false){
     t.alvoLab=objId;
     t._alvoManualFixadoLab=objId;
   }
 }
 return labRolarAtaque752Base_.apply(this,arguments);
};

// Se o mestre/jogador clicar no fundo, limpamos também o alvo manual do objeto.
const labCliqueFundoMapa752Base_=window.labCliqueFundoMapa_;
window.labCliqueFundoMapa_=function(ev){
 const t=labTokenAtual_();
 if(t && !ev?.target?.closest?.('.lab-map-object'))t._alvoManualFixadoLab='';
 return labCliqueFundoMapa752Base_.apply(this,arguments);
};

// ============================================================
// V46.77.0
// seta temporária + risco persistente + controle PJ pelo mestre
// + alcance recortado + alvo destruído preservado + painel compacto
// ============================================================

// ---------- Alvo selecionado é autoridade, inclusive objeto destruído ----------
const labUniversalGarantir760Base_=labUniversalGarantir_;
labUniversalGarantir_=function(t){
  if(!t)return labUniversalGarantir760Base_(t);
  const objId=String(labEstado_?.objetoSelecionadoId||'');
  const obj=objId?labObjetoPorId_(objId):null;
  if(obj&&obj.destrutivel!==false){
    t.alvoLab=objId;
    t._alvoManualFixadoLab=objId;
    t._alvoMortoManual510=!!labAlvoInerte490_(obj);
  }
  const r=labUniversalGarantir760Base_(t);
  if(obj&&obj.destrutivel!==false)t.alvoLab=objId;
  return r;
};

const labGarantirPrefsAtaque760Base_=labGarantirPrefsAtaque_;
labGarantirPrefsAtaque_=function(t){
  if(!t)return labGarantirPrefsAtaque760Base_(t);
  const objId=String(labEstado_?.objetoSelecionadoId||'');
  const obj=objId?labObjetoPorId_(objId):null;
  const fixo=String(obj?.id||t._alvoComandoFixadoLab||t._alvoManualFixadoLab||t.alvoLab||'');
  if(obj){
    t._alvoMortoManual510=!!labAlvoInerte490_(obj);
    t._alvoManualFixadoLab=fixo;
    t.alvoLab=fixo;
  }
  const valido=fixo&&labAlvosAtaque_(t).some(a=>String(a.id)===fixo);
  const r=labGarantirPrefsAtaque760Base_(t);
  if(valido)t.alvoLab=fixo;
  return r;
};

const labRolarAtaque760Base_=window.labRolarAtaque_;
window.labRolarAtaque_=function(){
  const t=labTokenAtual_();
  if(t){
    const objId=String(labEstado_?.objetoSelecionadoId||'');
    const obj=objId?labObjetoPorId_(objId):null;
    if(obj&&obj.destrutivel!==false){
      t.alvoLab=objId;
      t._alvoManualFixadoLab=objId;
      t._alvoMortoManual510=!!labAlvoInerte490_(obj);
    }
  }
  return labRolarAtaque760Base_.apply(this,arguments);
};

// ---------- Mestre só controla PJ quando autorizado ----------
function labEhPJ760_(t){
  if(!t||String(t.id||'').startsWith('dummy:'))return false;
  return !!String(t.donoUid||'').trim();
}
function labMestrePodeControlarPJ760_(){
  return !!labEstado_.mestreControlaPJLab;
}
const labPodeControlarToken760Base_=labPodeControlarToken_;
labPodeControlarToken_=function(t){
  if(!batalhaEhMestre_())return labPodeControlarToken760Base_(t);
  if(labEhPJ760_(t))return labMestrePodeControlarPJ760_();
  return true;
};
window.labMestreControlaPJToggle760_=function(v){
  if(!batalhaEhMestre_())return;
  labEstado_.mestreControlaPJLab=!!v;
  labSalvarLocal_();labAgendarSyncRemoto_();labRender_();
  notificar_(v?'🎭 Controle dos PJ pelo mestre ativado.':'🔒 Controle dos PJ pelo mestre desativado.',v?'sucesso':'info',2200);
};

function labInstalarControlePJ760_(){
  const free=document.getElementById('labFreeEntryWrap530');
  if(!free||document.getElementById('labMasterPJWrap760'))return;
  const w=document.createElement('label');w.id='labMasterPJWrap760';
  w.title='Quando desligado, o mestre não pode mover, atacar, defender ou escolher ações pelos personagens dos jogadores.';
  w.innerHTML='<input id="labMasterPJ760" type="checkbox" onchange="labMestreControlaPJToggle760_(this.checked)"> 🎭 Controlar PJ';
  free.insertAdjacentElement('afterend',w);
}
function labAtualizarControlePJ760_(){
  labInstalarControlePJ760_();
  const w=document.getElementById('labMasterPJWrap760'),cb=document.getElementById('labMasterPJ760');
  if(w)w.style.display=batalhaEhMestre_()?'flex':'none';
  if(cb)cb.checked=!!labEstado_.mestreControlaPJLab;
}

// Se o turno é de um PJ e o controle está desligado, mestre apenas observa.
const labRenderActionPanel760Base_=labRenderActionPanel_;
labRenderActionPanel_=function(){
  const t=labTokenAtual_(),el=document.getElementById('labActionPanel');
  if(batalhaEhMestre_()&&t&&labEhPJ760_(t)&&!labMestrePodeControlarPJ760_()
     &&!labEstado_.pendenciaLab&&!labEstado_.danoPendenteLab){
    if(el){
      el.style.display='block';
      el.innerHTML=`<div style="display:flex;align-items:center;gap:9px;min-height:36px">
        <strong style="color:#ffd54a">🎯 Ação de ${escaparHtmlInventario_(t.nome)}</strong>
        <span style="color:#9fc6d8">Controle do PJ está desligado. O jogador controla este personagem.</span>
      </div>`;
    }
    return;
  }
  return labRenderActionPanel760Base_.apply(this,arguments);
};
window.labRenderActionPanel_=labRenderActionPanel_;

// ---------- Ferramentas rápidas do mestre ----------
let labQuickTool760_='';
let labQuickDrawing760_=null;

function labQuickToolsInstall760_(){
  const free=document.getElementById('labFreeEntryWrap530');
  if(!free||document.getElementById('labQuickTools760'))return;
  const d=document.createElement('div');d.id='labQuickTools760';
  d.innerHTML=`
    <button id="labPointTool760" class="btn-small" title="Seta temporária: clique no mapa; desaparece em 6 segundos" onclick="labQuickToolToggle760_('seta')">➤</button>
    <button id="labLineTool760" class="btn-small" title="Risco persistente: arraste no mapa para desenhar" onclick="labQuickToolToggle760_('linha')">✎</button>
    <button class="btn-small" title="Limpar riscos persistentes" onclick="labQuickClearLines760_()">⌫</button>`;
  const pj=document.getElementById('labMasterPJWrap760');
  (pj||free).insertAdjacentElement('afterend',d);
}
function labQuickToolsUpdate760_(){
  labQuickToolsInstall760_();
  const d=document.getElementById('labQuickTools760');
  if(d)d.style.display=batalhaEhMestre_()?'flex':'none';
  document.getElementById('labPointTool760')?.classList.toggle('active',labQuickTool760_==='seta');
  document.getElementById('labLineTool760')?.classList.toggle('active',labQuickTool760_==='linha');
  const map=document.getElementById('labMetricMap');
  if(map){
    if(labQuickTool760_==='seta')map.style.cursor='crosshair';
    else if(labQuickTool760_==='linha')map.style.cursor='crosshair';
    else map.style.cursor='';
  }
}
window.labQuickToolToggle760_=function(tool){
  if(!batalhaEhMestre_())return;
  labQuickTool760_=labQuickTool760_===tool?'':tool;
  labQuickToolsUpdate760_();
};
window.labQuickClearLines760_=function(){
  if(!batalhaEhMestre_())return;
  labEstado_.riscosRapidosLab=[];
  labSalvarLocal_();labAgendarSyncRemoto_();labRender_();
};

function labQuickPoint760_(ev){
  const map=document.getElementById('labMetricMap'),ppm=Number(labEstado_.pxPorMetro||48);
  const r=map.getBoundingClientRect();
  return {
    x:Math.max(0,Math.min(Number(labEstado_.larguraM||28),(ev.clientX-r.left)/ppm)),
    y:Math.max(0,Math.min(Number(labEstado_.alturaM||14),(ev.clientY-r.top)/ppm))
  };
}
function labQuickArrow760_(p){
  labEstado_.apontadoresRapidosLab=Array.isArray(labEstado_.apontadoresRapidosLab)?labEstado_.apontadoresRapidosLab:[];
  const id=`ptr:${Date.now()}:${Math.random().toString(36).slice(2,6)}`;
  labEstado_.apontadoresRapidosLab.push({id,x:p.x,y:p.y,ts:Date.now(),duracao:6000});
  labSalvarLocal_();labAgendarSyncRemoto_();labRender_();
  setTimeout(()=>{
    if(!batalhaEhMestre_())return;
    const antes=(labEstado_.apontadoresRapidosLab||[]).length;
    labEstado_.apontadoresRapidosLab=(labEstado_.apontadoresRapidosLab||[]).filter(a=>String(a.id)!==id);
    if((labEstado_.apontadoresRapidosLab||[]).length!==antes){
      labSalvarLocal_();labAgendarSyncRemoto_();labRender_();
    }
  },6500);
}
function labQuickPointerDown760_(ev){
  if(!batalhaEhMestre_()||!labQuickTool760_)return;
  const map=document.getElementById('labMetricMap');
  if(!map||!map.contains(ev.target))return;
  // Ferramenta ativa tem prioridade sobre tokens/objetos.
  ev.preventDefault();ev.stopImmediatePropagation();
  const p=labQuickPoint760_(ev);
  if(labQuickTool760_==='seta'){
    labQuickArrow760_(p);return;
  }
  if(labQuickTool760_==='linha'){
    const pts=[p];labQuickDrawing760_={pts};
    const mv=e=>{const q=labQuickPoint760_(e),last=pts.at(-1);if(!last||Math.hypot(q.x-last.x,q.y-last.y)>.035){pts.push(q);labQuickRender760_();}};
    const up=()=>{
      window.removeEventListener('pointermove',mv,true);
      if(pts.length>1){
        labEstado_.riscosRapidosLab=Array.isArray(labEstado_.riscosRapidosLab)?labEstado_.riscosRapidosLab:[];
        labEstado_.riscosRapidosLab.push({id:`risco:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,pts:JSON.parse(JSON.stringify(pts)),cor:'#ffd54a',larguraM:.07});
        labSalvarLocal_();labAgendarSyncRemoto_();
      }
      labQuickDrawing760_=null;labRender_();
    };
    window.addEventListener('pointermove',mv,true);window.addEventListener('pointerup',up,{once:true,capture:true});
  }
}
document.addEventListener('pointerdown',labQuickPointerDown760_,true);

function labQuickRender760_(){
    if(labReducing_)return;
  const map=document.getElementById('labMetricMap');if(!map)return;
  let ov=document.getElementById('labQuickOverlay760');
  if(!ov){ov=document.createElement('div');ov.id='labQuickOverlay760';map.appendChild(ov);}
  const ppm=Number(labEstado_.pxPorMetro||48),w=Number(labEstado_.larguraM||28)*ppm,h=Number(labEstado_.alturaM||14)*ppm;
  const now=Date.now();
  const arrows=(labEstado_.apontadoresRapidosLab||[]).filter(a=>now-Number(a.ts||0)<Number(a.duracao||6000));
  const lines=[...(labEstado_.riscosRapidosLab||[])];
  if(labQuickDrawing760_)lines.push({id:'preview',pts:labQuickDrawing760_.pts,cor:'#67e8f9',larguraM:.07});
  const lineSvg=lines.map(l=>{
    const pts=(l.pts||[]).map(p=>`${Number(p.x)*ppm},${Number(p.y)*ppm}`).join(' ');
    return pts?`<polyline points="${pts}" fill="none" stroke="${l.cor||'#ffd54a'}" stroke-width="${Math.max(2,Number(l.larguraM||.07)*ppm)}" stroke-linecap="round" stroke-linejoin="round"/>`:'';
  }).join('');
  ov.innerHTML=`<svg id="labQuickLinePreview760" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${lineSvg}</svg>`+
    arrows.map(a=>`<div class="lab-point-arrow760" style="left:${Number(a.x)*ppm}px;top:${Number(a.y)*ppm}px;animation-delay:-${Math.max(0,now-Number(a.ts||0))}ms">
      <svg viewBox="0 0 44 58"><path d="M22 56 L5 27 H14 V4 H30 V27 H39 Z" fill="#ffd54a" stroke="#111827" stroke-width="2.2" stroke-linejoin="round"/></svg>
    </div>`).join('');
}

// ---------- Alcance sempre sobre o mapa e recortado no limite ----------
const labOverlayMovimentoHtml760Base_=labOverlayMovimentoHtml_;
labOverlayMovimentoHtml_=function(t,ppm){
  const h=labOverlayMovimentoHtml760Base_(t,ppm);
  return String(h||'').replaceAll('<div style="','<div class="lab-range-overlay-760" style="z-index:8;');
};

// ---------- Atualização pós-render ----------
const labRender760Base_=labRender_;

window.labRender_=labRender_;

// instalação inicial sem depender de uma renderização específica
setTimeout(()=>{try{labAtualizarControlePJ760_();labQuickToolsUpdate760_();labQuickRender760_();}catch(_){}},800);

// ============================================================
// V46.77.0 — alvo mais recente vence
// O erro anterior era um "alvo pegajoso": objetoSelecionadoId antigo continuava
// tendo prioridade mesmo depois de o usuário escolher outro alvo.
// ============================================================
function labAlvoAtualAutoritativo761_(t){
 if(!t)return null;
 const id=String(t._alvoManualFixadoLab||t.alvoLab||'');
 return id?labAlvoAtaquePorId_(id):null;
}

const labUniversalGarantir761Base_=labUniversalGarantir_;
labUniversalGarantir_=function(t){
 if(!t)return labUniversalGarantir761Base_(t);
 const idAntes=String(t._alvoManualFixadoLab||t.alvoLab||'');
 const alvoAntes=idAntes?labAlvoAtaquePorId_(idAntes):null;

 // Se o alvo manual atual é token, qualquer objeto antigo deixa de ser "selecionado".
 if(alvoAntes && !labObjetoPorId_(idAntes)){
   labEstado_.objetoSelecionadoId='';
   labEstado_.selecionadoId=idAntes;
   t._alvoMortoManual510=false;
 }

 const r=labUniversalGarantir761Base_(t);

 // O saneador pode completar outras preferências, mas não pode trocar um alvo manual válido.
 if(alvoAntes){
   t.alvoLab=idAntes;
   t._alvoManualFixadoLab=idAntes;
 }
 return r;
};

const labGarantirPrefsAtaque761Base_=labGarantirPrefsAtaque_;
labGarantirPrefsAtaque_=function(t){
 if(!t)return labGarantirPrefsAtaque761Base_(t);
 const idAntes=String(t._alvoManualFixadoLab||t.alvoLab||'');
 const alvoAntes=idAntes?labAlvoAtaquePorId_(idAntes):null;

 if(alvoAntes && !labObjetoPorId_(idAntes)){
   labEstado_.objetoSelecionadoId='';
   labEstado_.selecionadoId=idAntes;
   t._alvoMortoManual510=false;
 }

 const r=labGarantirPrefsAtaque761Base_(t);

 if(alvoAntes && labAlvosAtaque_(t).some(a=>String(a.id)===idAntes)){
   t.alvoLab=idAntes;
   t._alvoManualFixadoLab=idAntes;
 }
 return r;
};

// Imediatamente antes da rolagem, o alvo escolhido por último é congelado.
// Também neutralizamos objetoSelecionadoId se ele for só resíduo visual de um alvo anterior.
const labRolarAtaque761Base_=window.labRolarAtaque_;
window.labRolarAtaque_=function(){
 const t=labTokenAtual_();
 if(t){
   const id=String(t._alvoManualFixadoLab||t.alvoLab||'');
   const alvo=id?labAlvoAtaquePorId_(id):null;
   if(alvo){
     if(labObjetoPorId_(id)){
       labEstado_.objetoSelecionadoId=id;
       labEstado_.selecionadoId='';
       t._alvoMortoManual510=!!labAlvoInerte490_(alvo);
     }else{
       labEstado_.objetoSelecionadoId='';
       labEstado_.selecionadoId=id;
       t._alvoMortoManual510=false;
     }
     t.alvoLab=id;
     t._alvoManualFixadoLab=id;
   }
 }
 return labRolarAtaque761Base_.apply(this,arguments);
};

// ============================================================
// V46.77.0 — objetos da Oficina 2 preservam propriedades de combate
// ============================================================
function gm2EnriquecerObjetosBanco762_(st){
 if(!st?.elements)return st;
 const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ');
 for(const e of st.elements){
   if(e.type!=='object')continue;
   const ids=[e.modeloId,e.objetoBancoId,e.dadosBanco?.id].filter(Boolean).map(String);
   const names=[e.nome,e.name,e.dadosBanco?.nome].filter(Boolean).map(norm);
   let m=(objetosMapaDB||[]).find(x=>ids.includes(String(x.id)));
   if(!m&&names.length)m=(objetosMapaDB||[]).find(x=>names.includes(norm(x.nome||x.name||x.id)));
   if(!m)continue;

   const antigoSemSnapshot=!e.dadosBanco;
   const visual={id:e.id,type:e.type,x:e.x,y:e.y,w:e.w,h:e.h,rot:e.rot,z:e.z,locked:e.locked,opacity:e.opacity,shadow:e.shadow,shadowDir:e.shadowDir,shadowDist:e.shadowDist,src:e.src||m.imagem};
   const banco=JSON.parse(JSON.stringify(m));
   Object.assign(e,banco,visual);
   e.dadosBanco=banco;
   e.modeloId=String(m.id);
   e.objetoBancoId=String(m.id);
   e.nome=e.nome||getNome(m)||m.nome||m.id||'Objeto';
   e.name=e.name||e.nome;
   e.pvMax=Number(m.pvMax||0);
   e.dureza=Number(m.dureza||0);
   e.pesoKg=Number(m.pesoKg||0);
   e.destrutivel=m.destrutivel!==false;
   e.inflamavel=!!m.inflamavel;
   e.bloqueiaMovimento=m.bloqueiaMovimento!==false;
   e.bloqueiaVisao=!!m.bloqueiaVisao;
   if(antigoSemSnapshot || !Number.isFinite(Number(e.pvAtual)) || (Number(e.pvMax)>0&&Number(e.pvAtual)<=0&&!e.destruido))e.pvAtual=e.pvMax;
   if(e.destruido===undefined)e.destruido=false;
   if(e.pegandoFogoLab===undefined)e.pegandoFogoLab=false;
   if(e.fogoUltimaRodadaLab===undefined)e.fogoUltimaRodadaLab=-1;
 }
 return st;
}
if(typeof gm2loadLibraryMap === 'function'){
 const gm2LoadLibraryMap762Base_=gm2loadLibraryMap;
 gm2loadLibraryMap=async function(id){
  const r=await gm2LoadLibraryMap762Base_(id);
  gm2EnriquecerObjetosBanco762_(gm2.st);
  gm2saveLocal();gm2render();
  return r;
 };
}else{
 console.warn('[EXPERIMENTO] gm2loadLibraryMap não existe neste escopo; patch legado 46.77 ignorado.');
}

if(typeof gm2publish === 'function'){
 const gm2Publish762Base_=gm2publish;
 gm2publish=function(){
  gm2EnriquecerObjetosBanco762_(gm2.st);
  return gm2Publish762Base_.apply(this,arguments);
 };
}else{
 console.warn('[EXPERIMENTO] gm2publish não existe neste escopo; patch legado 46.77 ignorado.');
}

// Ao carregar um mapa da Oficina 2 na Mesa, também corrige mapas antigos
// cujos objetos tinham apenas aparência/posição.
const labLoad762Base_=window.labCarregarMapaBanco_;
if(labLoad762Base_)window.labCarregarMapaBanco_=async function(){
 const r=await labLoad762Base_.apply(this,arguments);
 if(labEstado_?.oficina2State){
   gm2EnriquecerObjetosBanco762_(labEstado_.oficina2State);
   const antigos=new Map((labEstado_.objetosLab||[]).map(o=>[String(o.id),o]));
   const prev=gm2.st;
   try{
     gm2.st=gm2clone(labEstado_.oficina2State);
     const legacy=gm2toLegacy();
     labEstado_.objetosLab=(legacy.objetos||[]).filter(o=>!o.imagemImportada).map(o=>{
       const velho=antigos.get(String(o.id));
       return velho?{...o,pvAtual:velho.pvAtual??o.pvAtual,destruido:velho.destruido??o.destruido,pegandoFogoLab:velho.pegandoFogoLab??o.pegandoFogoLab,fogoUltimaRodadaLab:velho.fogoUltimaRodadaLab??o.fogoUltimaRodadaLab}:o;
     });
   }finally{gm2.st=prev;}
   labSalvarLocal_();labRender_();
 }
 return r;
};

// ============================================================
// V46.77.0 — alvo SOMENTE pelo mapa + objetos Oficina 2 funcionais
// + fogo/morte visuais robustos
// ============================================================

// 1) "Objeto" não pode depender do prefixo do ID.
// Os objetos vindos da Oficina 2 usam IDs próprios, portanto o teste antigo
// startsWith('obj:') os tratava como se não fossem objetos.
labEhAlvoObjeto_=function(a){
    if(!a||a.id==null)return false;
    return !!labObjetoPorId_(String(a.id));
};

// 2) Em combate, clicar/pressionar um objeto serve para SELECIONAR o alvo.
// Arrastar objetos diretamente fica reservado à preparação, evitando que o
// pointerdown do mestre engula o clique da árvore.
const labObjetoPointerDown763Base_=window.labObjetoPointerDown_;
window.labObjetoPointerDown_=function(ev,id){
    if(labEstado_.fase==='combate'&&!labEstado_.modoCriacaoMapa){
        // Jogadores apenas selecionam o objeto como alvo.
        if(!batalhaEhMestre_()){
            ev.preventDefault();
            ev.stopPropagation();
            labSelecionarObjeto_(id);
            return;
        }
        // O mestre continua podendo arrastar objetos mesmo com o combate ativo.
        return labObjetoPointerDown763Base_.apply(this,arguments);
    }
    return labObjetoPointerDown763Base_.apply(this,arguments);
};

function labMarcarAlvoMapa763_(id){
    const ator=labTokenAtual_();if(!ator)return;
    const alvo=labAlvoAtaquePorId_(id);
    if(!alvo||String(alvo.id)===String(ator.id))return;
    ator.alvoLab=String(alvo.id);
    ator._alvoManualFixadoLab=String(alvo.id);
    ator._alvoComandoFixadoLab='';
    ator._alvoSelecionadoMapa763=true;
    ator._alvoMortoManual510=!!labAlvoInerte490_(alvo);
    if(labEhAlvoObjeto_(alvo)){
        labEstado_.objetoSelecionadoId=String(alvo.id);
        labEstado_.selecionadoId='';
    }else{
        labEstado_.objetoSelecionadoId='';
        labEstado_.selecionadoId=String(alvo.id);
    }
    labApontarPara_(ator,alvo);
}

// Clique em token passa a ser a escolha oficial do alvo.
const labSelecionar763Base_=window.labSelecionar_;
window.labSelecionar_=function(id){
    const r=labSelecionar763Base_.apply(this,arguments);
    if(labEstado_.fase==='combate'&&!labEstado_.pendenciaLab&&!labEstado_.danoPendenteLab){
        const ator=labTokenAtual_(),alvo=labTokenPorId_(id);
        if(ator&&alvo&&String(ator.id)!==String(alvo.id))labMarcarAlvoMapa763_(id);
    }
    return r;
};

// Clique em objeto passa a ser a escolha oficial do alvo.
const labSelecionarObjeto763Base_=window.labSelecionarObjeto_;
window.labSelecionarObjeto_=function(id){
    const r=labSelecionarObjeto763Base_.apply(this,arguments);
    if(labEstado_.fase==='combate'&&!labEstado_.pendenciaLab&&!labEstado_.danoPendenteLab){
        const alvo=labObjetoPorId_(id);
        if(alvo)labMarcarAlvoMapa763_(id);
    }
    return r;
};

// 3) Nunca mais escolhe automaticamente o "primeiro alvo".
// Perícia/arma ainda recebem defaults, alvo NÃO.
const labGarantirPrefsAtaque763Base_=labGarantirPrefsAtaque_;
labGarantirPrefsAtaque_=function(t){
    if(!t)return labGarantirPrefsAtaque763Base_(t);
    const escolhido=String(t.alvoLab||'');
    const manual=!!t._alvoSelecionadoMapa763;
    const alvoAntes=manual?labAlvoAtaquePorId_(escolhido):null;

    labGarantirPrefsAtaque763Base_(t);

    if(manual&&alvoAntes){
        t.alvoLab=escolhido;
        t._alvoManualFixadoLab=escolhido;
    }else{
        t.alvoLab='';
        t._alvoManualFixadoLab='';
        t._alvoComandoFixadoLab='';
        t._alvoMortoManual510=false;
    }
};

// 4) Ataque só existe se o alvo foi clicado no mapa.
// Isso encerra definitivamente a disputa entre dropdown, objetoSelecionadoId
// e saneadores antigos.
const labRolarAtaque763Base_=window.labRolarAtaque_;
window.labRolarAtaque_=function(){
    const t=labTokenAtual_();
    if(!t)return;
    const id=String(t.alvoLab||'');
    const alvo=id?labAlvoAtaquePorId_(id):null;
    if(!t._alvoSelecionadoMapa763||!alvo){
        t.alvoLab='';t._alvoManualFixadoLab='';
        notificar_('🎯 Clique no alvo diretamente dentro do mapa antes de atacar.','aviso',3300);
        labRender_();
        return;
    }
    // Garante que seleção visual e alvo lógico sejam exatamente o mesmo.
    if(labEhAlvoObjeto_(alvo)){
        labEstado_.objetoSelecionadoId=id;labEstado_.selecionadoId='';
    }else{
        labEstado_.objetoSelecionadoId='';labEstado_.selecionadoId=id;
    }
    t._alvoManualFixadoLab=id;
    t._alvoMortoManual510=!!labAlvoInerte490_(alvo);
    return labRolarAtaque763Base_.apply(this,arguments);
};

// Cada nova oportunidade começa sem alvo. É obrigatório clicar novamente.
const labEncerrarOportunidade763Base_=window.labEncerrarOportunidade_;
window.labEncerrarOportunidade_=function(){
    const atual=labTokenAtual_();
    if(atual){
        atual.alvoLab='';
        atual._alvoManualFixadoLab='';
        atual._alvoComandoFixadoLab='';
        atual._alvoSelecionadoMapa763=false;
        atual._alvoMortoManual510=false;
    }
    labEstado_.objetoSelecionadoId='';
    const r=labEncerrarOportunidade763Base_.apply(this,arguments);
    const novo=labTokenAtual_();
    if(novo){
        novo.alvoLab='';
        novo._alvoManualFixadoLab='';
        novo._alvoComandoFixadoLab='';
        novo._alvoSelecionadoMapa763=false;
        novo._alvoMortoManual510=false;
    }
    return r;
};

// 5) Remove visualmente o seletor Alvo apenas em COMBATE.
// Psiquismo e outras perícias continuam podendo ter seus próprios alvos.
function labAlvoMapaUI763_(){
    const painel=document.getElementById('labActionPanel'),t=labTokenAtual_();
    if(!painel||!t||labEstado_.fase!=='combate'||labEstado_.pendenciaLab||labEstado_.danoPendenteLab)return;
    if((t.universalModoLab||'combate')!=='combate'&&painel.querySelector('[onchange*="labUniversalAlvo_"]'))return;

    const alvo=t._alvoSelecionadoMapa763?labAlvoAtaquePorId_(t.alvoLab):null;
    const labels=[...painel.querySelectorAll('label')];
    for(const lab of labels){
        const sm=lab.querySelector('small');
        const sel=lab.querySelector('select');
        if(!sm||!sel||sm.textContent.trim()!=='Alvo')continue;
        if(!/labSelecionarAlvo_|labUniversalAlvo_/.test(sel.getAttribute('onchange')||''))continue;
        const box=document.createElement('div');
        box.className='lab-target-map-only-763';
        box.style.cssText='min-height:38px;box-sizing:border-box;padding:6px 9px;border:1px solid rgba(126,231,255,.30);border-radius:8px;background:rgba(255,255,255,.045);display:flex;align-items:center;gap:7px;color:#cfe7ff;';
        box.innerHTML=alvo
          ? `🎯 <b>${escaparHtmlInventario_(alvo.nome||'Objeto')}</b> <span style="opacity:.68;font-size:.82em">selecionado no mapa</span>`
          : `🎯 <span style="color:#ffd98c">Clique no alvo dentro do mapa</span>`;
        lab.replaceWith(box);
    }
    const atacar=[...painel.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('labRolarAtaque_'));
    if(atacar){
        atacar.disabled=atacar.disabled||!alvo;
        atacar.title=alvo?'Atacar o alvo selecionado no mapa.':'Clique primeiro no alvo dentro do mapa.';
    }
}

// 6) Visuais de morto/destruído e fogo.
// Independente de qual camada histórica gerou o HTML, o estado final manda.
function labEstadosVisuais763_(){
    const map=document.getElementById('labMetricMap');if(!map)return;

    for(const t of (labEstado_.tokens||[])){
        let node=null;try{node=map.querySelector(`.lab-token[data-id="${CSS.escape(String(t.id))}"]`);}catch(_){}
        if(!node)continue;
        const morto=!!labAlvoInerte490_(t);
        if(morto){
            node.style.opacity='.42';
            node.style.filter='grayscale(.88) saturate(.45)';
        }
    }

    for(const o of (labEstado_.objetosLab||[])){
        let node=null;try{node=map.querySelector(`.lab-map-object[data-id="${CSS.escape(String(o.id))}"]`);}catch(_){}
        if(!node)continue;

        if(labAlvoInerte490_(o)){
            node.style.opacity='.42';
            node.style.filter='grayscale(.88) saturate(.45)';
        }

        // Reforço visual do sistema de incêndio existente.
        // Não cria fogo novo; só garante que pegandoFogoLab seja visível.
        if(o.pegandoFogoLab&&!o.destruido&&!node.querySelector('.lab-fire-real-510')){
            const fire=document.createElement('span');
            fire.className='lab-fire-real-510';
            fire.innerHTML='<i class="fl f1"></i><i class="fl f2"></i><i class="fl f3"></i><i class="sm"></i>';
            node.appendChild(fire);
        }
    }
}

// Render final desta correção.
const labRender763Base_=labRender_;

window.labRender_=labRender_;

// Zera alvos herdados de versões antigas ao abrir esta versão.
// Assim nenhum dropdown antigo começa a rodada com um alvo fantasma.
setTimeout(()=>{
    try{
        for(const t of (labEstado_.tokens||[])){
            t.alvoLab='';
            t._alvoManualFixadoLab='';
            t._alvoComandoFixadoLab='';
            t._alvoSelecionadoMapa763=false;
            t._alvoMortoManual510=false;
        }
        labEstado_.objetoSelecionadoId='';
        labSalvarLocal_();labRender_();
    }catch(_){}
},700);

// ============================================================
// V46.77.0 — seleção de alvo por mapa, captura direta
// ============================================================
function labSelecionarAlvoMapa764_(id){
    const ator=labTokenAtual_();
    if(!ator)return false;
    const alvo=labAlvoAtaquePorId_(String(id||''));
    if(!alvo||String(alvo.id)===String(ator.id))return false;

    ator.alvoLab=String(alvo.id);
    ator._alvoManualFixadoLab=String(alvo.id);
    ator._alvoComandoFixadoLab='';
    ator._alvoSelecionadoMapa763=true;
    ator._alvoMortoManual510=!!labAlvoInerte490_(alvo);

    if(labEhAlvoObjeto_(alvo)){
        labEstado_.objetoSelecionadoId=String(alvo.id);
        labEstado_.selecionadoId='';
    }else{
        labEstado_.objetoSelecionadoId='';
        labEstado_.selecionadoId=String(alvo.id);
    }

    labApontarPara_(ator,alvo);
    labEstado_.ultimoResultadoLab=`Alvo selecionado no mapa: ${alvo.nome||'alvo'}.`;
    labSalvarLocal_();
    labRender_();
    return true;
}

document.addEventListener('pointerdown',function(ev){
    if(labEstado_.fase!=='combate'||labEstado_.pendenciaLab||labEstado_.danoPendenteLab)return;
    if(typeof labQuickTool760_!=='undefined'&&labQuickTool760_)return;

    const map=document.getElementById('labMetricMap');
    if(!map||!map.contains(ev.target))return;

    const node=ev.target.closest?.('.lab-token,.lab-map-object');
    if(!node)return;

    const id=String(node.dataset.id||'');
    const ator=labTokenAtual_();
    if(!ator||!id)return;

    // No ataque comum, clicar no próprio token continua reservado ao movimento.
    // Em Psiquismo, o próprio token pode ser um alvo válido.
    const modo=String(ator.universalModoLab||'combate');
    if(node.classList.contains('lab-token')&&String(id)===String(ator.id)&&modo!=='psi'&&ator.acaoAuxLab?.tipo!=='psiquismo')return;

    // Qualquer token/objeto válido vira o alvo mais recente.
    if(labSelecionarAlvoMapa764_(id)){
        ev.preventDefault();
        ev.stopImmediatePropagation();
    }
},true);

// Remove qualquer resíduo visual de dropdown de ataque caso algum renderer antigo
// volte a produzir o painel por um caminho legado. Psi e outras ações não são tocadas.
function labRemoverDropdownAtaque764_(){
    const painel=document.getElementById('labActionPanel'),t=labTokenAtual_();
    if(!painel||!t||labEstado_.fase!=='combate')return;
    if((t.universalModoLab||'combate')!=='combate')return;

    for(const sel of [...painel.querySelectorAll('select')]){
        const fn=sel.getAttribute('onchange')||'';
        if(!/labSelecionarAlvo_|labUniversalAlvo_/.test(fn))continue;
        const lab=sel.closest('label');
        if(lab)lab.remove();
        else sel.remove();
    }
}
const labRender764Base_=labRender_;

window.labRender_=labRender_;

// ============================================================
// V46.77.0 — alvo único: SEM dropdown, clique no mapa é a autoridade
// ============================================================
function labNomeAlvo765_(a){
  return a?(a.nome||a.name||labObjetoModelo_(a)?.nome||getNome(a)||'Objeto'):'';
}

labSelecionarAlvoMapa764_=function(id){
    const ator=labTokenAtual_();if(!ator)return false;
    const alvo=labAlvoAtaquePorId_(String(id||''))||labPsiAlvoPorId_(String(id||''));
    if(!alvo)return false;

    const modo=String(ator.universalModoLab||'combate');

    // Painel Psi especializado.
    if(ator.acaoAuxLab?.tipo==='psiquismo'){
        const p=labPsiPoderes_(ator).find(x=>String(x.id)===String(ator.acaoAuxLab.poderId));
        const validos=p?labPsiAlvos_(ator,p):[];
        if(!validos.some(x=>String(x.id)===String(alvo.id)))return false;
        ator.acaoAuxLab.alvoId=String(alvo.id);
        ator.psiSelecaoLab=JSON.parse(JSON.stringify(ator.acaoAuxLab));
        if(p?.id==='mover_objeto')ator.acaoAuxLab.custo=Math.max(Number(ator.acaoAuxLab.custo||0),labPsiMoverCustoKg_(p,alvo));
        labEstado_.objetoSelecionadoId=labEhAlvoObjeto_(alvo)?String(alvo.id):'';
        labEstado_.selecionadoId=labEhAlvoObjeto_(alvo)?'':String(alvo.id);
        labSalvarLocal_();labRender_();return true;
    }

    // Psi universal.
    if(modo==='psi'){
        const p=labPsiPoderes_(ator).find(x=>String(x.id)===String(ator.universalPsiPoderIdLab));
        const validos=p?labPsiAlvos_(ator,p):[];
        if(!validos.some(x=>String(x.id)===String(alvo.id)))return false;
        ator.universalAlvoIdLab=String(alvo.id);
        if(p?.id==='mover_objeto')ator.universalPsiCustoLab=Math.max(Number(ator.universalPsiCustoLab||0),labPsiMoverCustoKg_(p,alvo));
        labEstado_.objetoSelecionadoId=labEhAlvoObjeto_(alvo)?String(alvo.id):'';
        labEstado_.selecionadoId=labEhAlvoObjeto_(alvo)?'':String(alvo.id);
        labSalvarLocal_();labRender_();return true;
    }

    // Outras perícias direcionadas.
    if(modo==='outras'){
        const validos=labUniversalAlvosGerais_(ator);
        if(!validos.some(x=>String(x.id)===String(alvo.id)))return false;
        ator.universalAlvoGeralLab=String(alvo.id);
        labEstado_.objetoSelecionadoId=labEhAlvoObjeto_(alvo)?String(alvo.id):'';
        labEstado_.selecionadoId=labEhAlvoObjeto_(alvo)?'':String(alvo.id);
        labSalvarLocal_();labRender_();return true;
    }

    // Ataque normal.
    if(String(alvo.id)===String(ator.id))return false;
    ator.alvoLab=String(alvo.id);
    ator._alvoManualFixadoLab=String(alvo.id);
    ator._alvoComandoFixadoLab='';
    ator._alvoSelecionadoMapa763=true;
    ator._alvoMortoManual510=!!labAlvoInerte490_(alvo);

    if(labEhAlvoObjeto_(alvo)){
        alvo.nome=alvo.nome||alvo.name||labObjetoModelo_(alvo)?.nome||'Objeto';
        alvo.name=alvo.name||alvo.nome;
        labEstado_.objetoSelecionadoId=String(alvo.id);
        labEstado_.selecionadoId='';
    }else{
        labEstado_.objetoSelecionadoId='';
        labEstado_.selecionadoId=String(alvo.id);
    }
    labApontarPara_(ator,alvo);
    labSalvarLocal_();labRender_();return true;
};

// Limpa a lógica de preferências de ataque sem chamar os wrappers pegajosos antigos.
labGarantirPrefsAtaque_=function(t){
    if(!t)return;
    const c=labCharToken_(t),skills=labPericiasAtaque_(t);
    if(!skills.length){t.periciaLab='';t.equipamentoLab='';t.alvoLab='';return;}
    if(!skills.some(p=>batalhaTokenPericia_(p)===t.periciaLab))t.periciaLab=batalhaTokenPericia_(skills[0]);
    const per=labPericiaPorToken_(t,t.periciaLab);
    const eq=batalhaEquipamentos_(c,per,t.equipamentoLab);
    if(!eq.some(x=>x.valor===t.equipamentoLab))t.equipamentoLab=eq[0]?.valor||'';
    const alvo=t._alvoSelecionadoMapa763?labAlvoAtaquePorId_(t.alvoLab):null;
    if(!alvo||String(alvo.id)===String(t.id)){
        t.alvoLab='';t._alvoManualFixadoLab='';t._alvoComandoFixadoLab='';t._alvoSelecionadoMapa763=false;t._alvoMortoManual510=false;
    }
};

// Remove qualquer campo de alvo que algum renderer histórico tente recolocar.
// Vale para combate, Psi e outras perícias.
function labRetirarTodoDropdownAlvo765_(){
    const painel=document.getElementById('labActionPanel');if(!painel)return;
    for(const lab of [...painel.querySelectorAll('label')]){
        const sm=lab.querySelector('small'),sel=lab.querySelector('select');
        if(!sm||!sel)continue;
        const titulo=String(sm.textContent||'').trim().toLowerCase();
        const fn=String(sel.getAttribute('onchange')||'');
        if(titulo==='alvo'||/labSelecionarAlvo_|labUniversalAlvo_|labPsiSelecionarAlvo_/.test(fn)){
            const ator=labTokenAtual_();
            let alvo=null;
            if(ator?.acaoAuxLab?.tipo==='psiquismo')alvo=labPsiAlvoPorId_(ator.acaoAuxLab.alvoId);
            else if(ator?.universalModoLab==='psi')alvo=labPsiAlvoPorId_(ator.universalAlvoIdLab);
            else if(ator?.universalModoLab==='outras')alvo=labPsiAlvoPorId_(ator.universalAlvoGeralLab);
            else alvo=labAlvoAtaquePorId_(ator?.alvoLab);
            const box=document.createElement('div');
            box.className='lab-map-target-status-765';
            box.style.cssText='min-height:38px;box-sizing:border-box;padding:6px 9px;border:1px solid rgba(126,231,255,.28);border-radius:8px;background:rgba(255,255,255,.045);display:flex;align-items:center;color:#cfe7ff;';
            box.innerHTML=alvo?`🎯 <b>${escaparHtmlInventario_(labNomeAlvo765_(alvo))}</b>&nbsp;<span style="opacity:.65;font-size:.82em">selecionado no mapa</span>`:`🎯 <span style="color:#ffd98c">Clique no alvo dentro do mapa</span>`;
            lab.replaceWith(box);
        }
    }
}

const labRenderActionPanel765Base_=labRenderActionPanel_;
labRenderActionPanel_=function(){
    const r=labRenderActionPanel765Base_.apply(this,arguments);
    labRetirarTodoDropdownAlvo765_();
    return r;
};
window.labRenderActionPanel_=labRenderActionPanel_;

// Também executa após labRender, caso um painel seja desenhado por uma resolução assíncrona.
const labRender765Base_=labRender_;

window.labRender_=labRender_;

// ============================================================
// V46.77.0 — banco de objetos também no Mapa da Mesa
// ============================================================
function labLiveRenderObjectBank770_(){
    if(labReducing_)return;
 const box=document.getElementById('labLiveObjectBank770'),list=document.getElementById('labLiveObjectList770');
 if(!box||!list)return;
 box.style.display=batalhaEhMestre_()?'block':'none';
 if(!batalhaEhMestre_())return;
 garantirObjetosMapaPadrao_();
 const listaMesa813=[...(objetosMapaDB||[])].sort((a,b)=>String(a.nome||a.id||'').localeCompare(String(b.nome||b.id||''),'pt-BR',{sensitivity:'base'}));
 list.innerHTML=listaMesa813.map(o=>{
   const pv=Number(o.pvMax||0),du=Number(o.dureza||0),infl=o.inflamavel?'🔥':'',img=o.imagem||'';
   return `<label title="${escaparHtmlInventario_(o.nome||o.id)}"><input class="lab-live-obj-check770" type="checkbox" value="${escaparHtmlInventario_(o.id)}">${img?`<img src="${escaparHtmlInventario_(img)}" draggable="false">`:''}<span class="lab-live-obj-meta770"><div class="lab-live-obj-name770">${escaparHtmlInventario_(o.nome||o.id)}</div><small>PV ${pv} · Dur ${du} ${infl}</small></span></label>`;
 }).join('');
 const all=document.getElementById('labLiveObjAll770');
 if(all&&!all.dataset.wired){all.dataset.wired='1';all.addEventListener('change',()=>document.querySelectorAll('.lab-live-obj-check770').forEach(c=>c.checked=all.checked));}
}

function labInstanciaObjetoBanco770_(m,x,y,offset=0){
 const snap=JSON.parse(JSON.stringify(m));
 const pv=Math.max(0,Number(m.pvMax||0));
 return {
   ...snap,
   dadosBanco:snap,
   id:`obj:${Date.now()}:${Math.floor(Math.random()*100000)}:${offset}`,
   modeloId:String(m.id),objetoBancoId:String(m.id),
   nome:m.nome||m.name||m.id||'Objeto',name:m.name||m.nome||m.id||'Objeto',
   x,y,angulo:0,pvMax:pv,pvAtual:pv,dureza:Number(m.dureza||0),pesoKg:Number(m.pesoKg||0),
   destrutivel:m.destrutivel!==false,inflamavel:!!m.inflamavel,bloqueiaMovimento:m.bloqueiaMovimento!==false,bloqueiaVisao:!!m.bloqueiaVisao,
   destruido:false,pegandoFogoLab:false,fogoUltimaRodadaLab:-1
 };
}
window.labLiveAdicionarObjetos770_=function(){
 if(!batalhaEhMestre_())return;
 const ids=[...document.querySelectorAll('.lab-live-obj-check770:checked')].map(c=>String(c.value));
 if(!ids.length){notificar_('Marque pelo menos um objeto do banco.','aviso',2500);return;}
 labEstado_.objetosLab=Array.isArray(labEstado_.objetosLab)?labEstado_.objetosLab:[];
 let off=0,last=null;
 for(const id of ids){
   const m=(objetosMapaDB||[]).find(o=>String(o.id)===id);if(!m)continue;
   const inst=labInstanciaObjetoBanco770_(m,Math.max(0,Math.min(labEstado_.larguraM,labEstado_.larguraM/2+off)),Math.max(0,Math.min(labEstado_.alturaM,labEstado_.alturaM/2+off)),off);
   labEstado_.objetosLab.push(inst);last=inst;off+=.35;
 }
 if(last){labEstado_.objetoSelecionadoId=last.id;labEstado_.selecionadoId='';}
 labSalvarLocal_();labAgendarSyncRemoto_();labRender_();
 notificar_(`${ids.length} objeto(s) adicionado(s) ao mapa.`,'sucesso',2200);
};

function labRepararObjetosBanco770_(){
 const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ');
 for(const o of (labEstado_.objetosLab||[])){
   const ids=[o.modeloId,o.objetoBancoId,o.dadosBanco?.id].filter(Boolean).map(String);
   const names=[o.nome,o.name,o.dadosBanco?.nome].filter(Boolean).map(norm);
   let m=(objetosMapaDB||[]).find(x=>ids.includes(String(x.id)));
   if(!m&&names.length)m=(objetosMapaDB||[]).find(x=>names.includes(norm(x.nome||x.name||x.id)));
   if(!m)continue;
   const lost=!o.dadosBanco||!Number.isFinite(Number(o.pvMax))||Number(o.pvMax)<=0;
   const state={id:o.id,x:o.x,y:o.y,angulo:o.angulo,larguraM:o.larguraM||m.larguraM,alturaM:o.alturaM||m.alturaM,destruido:!!o.destruido,pegandoFogoLab:!!o.pegandoFogoLab,fogoUltimaRodadaLab:Number(o.fogoUltimaRodadaLab??-1)};
   const snap=JSON.parse(JSON.stringify(m));
   Object.assign(o,snap,state);
   o.dadosBanco=snap;o.modeloId=String(m.id);o.objetoBancoId=String(m.id);o.nome=o.nome||m.nome||m.id;o.name=o.name||o.nome;
   o.pvMax=Number(m.pvMax||0);o.dureza=Number(m.dureza||0);o.pesoKg=Number(m.pesoKg||0);o.destrutivel=m.destrutivel!==false;o.inflamavel=!!m.inflamavel;o.bloqueiaMovimento=m.bloqueiaMovimento!==false;o.bloqueiaVisao=!!m.bloqueiaVisao;
   if(lost&&!o.destruido)o.pvAtual=o.pvMax;
   else if(!Number.isFinite(Number(o.pvAtual)))o.pvAtual=o.pvMax;
 }
}

const labRender770Base_=labRender_;

window.labRender_=labRender_;

setTimeout(()=>{try{labLiveRenderObjectBank770_();}catch(_){}},900);

// ============================================================
// V46.80.4 — referências do mapa são reidratadas na Mesa
// O mapa salvo guarda apenas modeloId + transformação; a Mesa recupera
// PV, dureza, material, imagem e demais propriedades no Banco de Objetos.
// ============================================================
function map804HidratarObjetoMesa_(o){
  if(!o||typeof o!=='object')return o;
  const mid=String(o.modeloId||o.objetoBancoId||'');
  if(!mid)return o;
  const m=(objetosMapaDB||[]).find(x=>String(x.id)===mid);
  if(!m)return o;

  // Estado espacial/dinâmico pertence à instância do mapa.
  const dyn={
    id:o.id,x:o.x,y:o.y,larguraM:o.larguraM,alturaM:o.alturaM,angulo:o.angulo,
    ordemOficina:o.ordemOficina,fixada:o.fixada,opacity:o.opacity,
    sombraOficina:o.sombraOficina,sombraDirecao:o.sombraDirecao,sombraDist:o.sombraDist,
    destruido:o.destruido,pegandoFogoLab:o.pegandoFogoLab,fogoUltimaRodadaLab:o.fogoUltimaRodadaLab,
    despedacadoLab:o.despedacadoLab,explodindoLab:o.explodindoLab,
    pvAtual:o.pvAtual
  };
  const tinhaPvAtual=Number.isFinite(Number(o.pvAtual));

  // Propriedades de modelo vêm sempre do Banco atual.
  o.modeloId=mid;o.objetoBancoId=mid;
  o.nome=m.nome||m.name||mid;o.name=o.nome;
  o.imagem=m.imagem||m.image||'';
  o.pvMax=Math.max(0,Number(m.pvMax||m.pv||0));
  o.dureza=Math.max(0,Number(m.dureza||0));
  o.pesoKg=Math.max(0,Number(m.pesoKg||m.peso||0));
  o.material=m.material||'';
  o.destrutivel=m.destrutivel!==false;
  o.inflamavel=!!m.inflamavel;
  o.inflamabilidade=Math.max(0,Math.min(5,Number(m.inflamabilidade||0)));
  o.bloqueiaMovimento=m.bloqueiaMovimento!==false;
  o.bloqueiaVisao=!!m.bloqueiaVisao;
  if(m.fixoAoMapa!==undefined)o.fixoAoMapa=!!m.fixoAoMapa;
  if(m.fonteLuz!==undefined)o.fonteLuz=!!m.fonteLuz;
  if(m.luzLarguraM!==undefined)o.luzLarguraM=Number(m.luzLarguraM||0);
  if(m.luzAlturaM!==undefined)o.luzAlturaM=Number(m.luzAlturaM||0);
  if(m.luzRaioM!==undefined)o.luzRaioM=Number(m.luzRaioM||0);

  // Reaplica transformação e estado da instância.
  if(dyn.id!=null)o.id=dyn.id;
  if(Number.isFinite(Number(dyn.x)))o.x=Number(dyn.x);
  if(Number.isFinite(Number(dyn.y)))o.y=Number(dyn.y);
  o.larguraM=Math.max(.05,Number(dyn.larguraM||m.larguraM||1));
  o.alturaM=Math.max(.05,Number(dyn.alturaM||m.alturaM||1));
  o.angulo=Number(dyn.angulo||0);o.ordemOficina=Number(dyn.ordemOficina||0);
  o.fixada=!!dyn.fixada;if(dyn.opacity!==undefined)o.opacity=Number(dyn.opacity);
  if(dyn.sombraOficina!==undefined)o.sombraOficina=dyn.sombraOficina;
  if(dyn.sombraDirecao!==undefined)o.sombraDirecao=dyn.sombraDirecao;
  if(dyn.sombraDist!==undefined)o.sombraDist=dyn.sombraDist;
  o.destruido=!!dyn.destruido;o.pegandoFogoLab=!!dyn.pegandoFogoLab;
  o.fogoUltimaRodadaLab=Number(dyn.fogoUltimaRodadaLab??-1);
  if(dyn.despedacadoLab!==undefined)o.despedacadoLab=dyn.despedacadoLab;
  if(dyn.explodindoLab!==undefined)o.explodindoLab=dyn.explodindoLab;
  o.pvAtual=tinhaPvAtual?Math.max(0,Number(dyn.pvAtual)):o.pvMax;
  if(o.pvAtual>o.pvMax&&o.pvMax>=0)o.pvAtual=o.pvMax;
  o.mapRef=true;
  return o;
}
function map804HidratarMesa_(){
  if(!labEstado_||!Array.isArray(labEstado_.objetosLab))return 0;
  let n=0;
  for(const o of labEstado_.objetosLab){
    if(String(o?.modeloId||o?.objetoBancoId||'')){
      const antes=Number(o.pvMax||0);
      map804HidratarObjetoMesa_(o);
      if(Number(o.pvMax||0)>0||antes>0)n++;
    }
  }
  return n;
}

// Última camada dentro do módulo, onde objetosMapaDB realmente está acessível.
const map804LoadMesaBase_=window.labCarregarMapaBanco_;
if(map804LoadMesaBase_){
  window.labCarregarMapaBanco_=async function(){
    const r=await map804LoadMesaBase_.apply(this,arguments);
    const n=map804HidratarMesa_();
    try{labSalvarLocal_();}catch(_){}
    try{labRender_();}catch(_){}
    if(n)notificar_(`Objetos do mapa reconstruídos do Banco: ${n}.`,'info',2200);
    return r;
  };
}

// Também reidrata quando o Banco termina de carregar depois do mapa.
const map804RenderBase_=labRender_;

window.labRender_=labRender_;
window.map804HidratarMesa_=map804HidratarMesa_;

setTimeout(()=>{try{if(map804HidratarMesa_()){labSalvarLocal_();labRender_();}}catch(_){}},1400);


// ============================================================
// V46.80.6 — referências da Oficina 2 viram INSTÂNCIAS FUNCIONAIS na Mesa
// Reusa o princípio do antigo editor da Mesa: o modelo do Banco é soberano
// para PV/dureza/propriedades; a referência do mapa só fornece geometria/estado.
// Não cacheia falhas de leitura.
// ============================================================
// v119: modelo já carregado do banco nesta sessão não é relido a cada objeto (e pedidos iguais simultâneos viram um só).
const map806PendentesV119_=new Map(),map806LidosV119_=new Set();
async function map806BuscarModelo_(mid){
  {const k=String(mid||'').trim();const loc=k&&(objetosMapaDB||[]).find(x=>String(x?.id)===k);
   if(loc&&map806LidosV119_.has(k))return loc;
   if(k&&map806PendentesV119_.has(k))return map806PendentesV119_.get(k);
   if(k){const p=map806BuscarModeloV119Base_(k).then(m=>{if(m)map806LidosV119_.add(k);return m;}).finally(()=>map806PendentesV119_.delete(k));map806PendentesV119_.set(k,p);return p;}}
  return null;
}
async function map806BuscarModeloV119Base_(mid){
  mid=String(mid||'').trim();
  if(!mid)return null;
  let local=(objetosMapaDB||[]).find(x=>String(x?.id)===mid)||null;
  let remoto=null;
  try{
    const ds=await getDoc(doc(db,'configuracoes',objetoMapaDocId_(mid)));
    if(ds.exists())remoto={id:mid,...ds.data()};
  }catch(e){
    console.warn('V46.80.6 leitura direta do modelo',mid,e);
  }
  const m=remoto?{...(local||{}),...remoto,id:mid}:local;
  if(m){
    const i=(objetosMapaDB||[]).findIndex(x=>String(x?.id)===mid);
    if(i>=0)objetosMapaDB[i]=m;else objetosMapaDB.push(m);
  }
  return m||null;
}
function map806Num_(...vals){
  for(const v of vals){const n=Number(v);if(Number.isFinite(n))return n;}
  return 0;
}
function map806InstanciaFuncional_(refObj,m){
  if(!refObj||!m)return refObj;
  const ref=JSON.parse(JSON.stringify(refObj));
  const snap=JSON.parse(JSON.stringify(m));
  const pvMax=Math.max(0,map806Num_(m.pvMax,m.pv,m.vidaMax,m.vida));
  const tinhaEstadoDinamico=ref.pvAtual!==undefined||ref.destruido===true||ref.pegandoFogoLab===true;
  const pvAtual=tinhaEstadoDinamico&&Number.isFinite(Number(ref.pvAtual))
    ?Math.max(0,Math.min(pvMax,Number(ref.pvAtual)))
    :pvMax;
  return {
    ...snap,
    // identidade/ligação ao Banco
    id:String(ref.id||`obj:${Date.now()}:${Math.floor(Math.random()*100000)}`),
    modeloId:String(m.id||ref.modeloId||ref.objetoBancoId||''),
    objetoBancoId:String(m.id||ref.objetoBancoId||ref.modeloId||''),
    dadosBanco:snap,
    nome:m.nome||m.name||ref.nome||ref.name||m.id||'Objeto',
    name:m.name||m.nome||ref.name||ref.nome||m.id||'Objeto',
    imagem:m.imagem||m.image||ref.imagem||'',
    // geometria é propriedade da instância do mapa
    x:map806Num_(ref.x,0),y:map806Num_(ref.y,0),
    larguraM:Math.max(.05,map806Num_(ref.larguraM,m.larguraM,m.largura,1)),
    alturaM:Math.max(.05,map806Num_(ref.alturaM,m.alturaM,m.altura,1)),
    angulo:map806Num_(ref.angulo,0),
    ordemOficina:map806Num_(ref.ordemOficina,0),
    fixada:ref.fixada!==undefined?!!ref.fixada:!!m.fixoAoMapa,
    opacity:Number.isFinite(Number(ref.opacity))?Number(ref.opacity):1,
    sombraOficina:ref.sombraOficina||'nenhuma',
    sombraDirecao:ref.sombraDirecao||'SE',
    sombraDist:map806Num_(ref.sombraDist,4),
    mapRef:true,
    // propriedades funcionais SEMPRE vêm do modelo atual do Banco
    pvMax,pvAtual,
    dureza:Math.max(0,map806Num_(m.dureza,m.hardness)),
    pesoKg:Math.max(0,map806Num_(m.pesoKg,m.peso,m.weightKg)),
    material:m.material||'',
    destrutivel:m.destrutivel!==false,
    inflamavel:!!m.inflamavel,
    inflamabilidade:Math.max(0,Math.min(5,map806Num_(m.inflamabilidade,m.inflamabilidadeLab))),
    bloqueiaMovimento:m.bloqueiaMovimento!==false,
    bloqueiaVisao:!!m.bloqueiaVisao,
    fixoAoMapa:m.fixoAoMapa!==undefined?!!m.fixoAoMapa:!!ref.fixoAoMapa,
    fonteLuz:!!m.fonteLuz,
    luzLarguraM:map806Num_(m.luzLarguraM,0),
    luzAlturaM:map806Num_(m.luzAlturaM,0),
    luzRaioM:map806Num_(m.luzRaioM,0),
    // preserva estado dinâmico apenas se ele realmente veio na instância
    destruido:!!ref.destruido,
    pegandoFogoLab:!!ref.pegandoFogoLab,
    fogoUltimaRodadaLab:map806Num_(ref.fogoUltimaRodadaLab,-1),
    despedacadoLab:!!ref.despedacadoLab,
    explodindoLab:!!ref.explodindoLab
  };
}
async function map806ReconstruirObjetosMesa_(){
  if(!labEstado_||!Array.isArray(labEstado_.objetosLab))return {ok:0,fail:[]};
  const nova=[];let ok=0;const fail=[];
  for(const o of labEstado_.objetosLab){
    const mid=String(o?.modeloId||o?.objetoBancoId||o?.dadosBanco?.id||'').trim();
    if(!mid||mid==='imagem_importada'){nova.push(o);continue;}
    const m=await map806BuscarModelo_(mid);
    if(!m){nova.push(o);fail.push(mid);continue;}
    nova.push(map806InstanciaFuncional_(o,m));ok++;
  }
  labEstado_.objetosLab=nova;
  return {ok,fail:[...new Set(fail)]};
}

// A reconstrução ocorre DEPOIS do carregador inteiro legado terminar. Assim qualquer
// wrapper antigo pode fazer sua conversão e, no final, substituímos as refs por objetos
// idênticos aos que o antigo editor da Mesa criava diretamente do Banco.
const map806LoadBase_=window.labCarregarMapaBanco_;
if(map806LoadBase_){
  window.labCarregarMapaBanco_=async function(){
    const r=await map806LoadBase_.apply(this,arguments);
    const rr=await map806ReconstruirObjetosMesa_();
    try{labSalvarLocal_();labRender_();}catch(e){console.warn('V46.80.6 render pós-instância',e);}
    if(rr.fail.length){
      notificar_(`⚠️ ${rr.ok} objeto(s) reconstruído(s); não encontrei no Banco: ${rr.fail.join(', ')}`,'aviso',8000);
    }else if(rr.ok){
      notificar_(`✅ ${rr.ok} objeto(s) reconstruído(s) como instâncias funcionais.`,'sucesso',3000);
    }
    return r;
  };
}
window.map806ReconstruirObjetosMesa_=map806ReconstruirObjetosMesa_;

// ============================================================
// V46.80.7 — carregador DIRETO de mapas refs-v1 para a Mesa
// Não passa pelo conversor legado. Cada referência é transformada em uma
// instância funcional ANTES de entrar em labEstado_.objetosLab.
// ============================================================
async function map807InstanciaDaRefMesa_(refObj){
  const mid=String(refObj?.modeloId||refObj?.objetoBancoId||'').trim();
  if(!mid||mid==='imagem_importada')return refObj;
  const m=await map806BuscarModelo_(mid);
  if(!m)return null;
  // Reusa o construtor funcional já validado nesta linha de desenvolvimento.
  const inst=map806InstanciaFuncional_(refObj,m);
  // refs-v1 são mapas preparados, não estado de combate persistente.
  // Ao CARREGAR o mapa, o objeto nasce íntegro, como no antigo editor da Mesa.
  inst.pvMax=Math.max(0,Number(m.pvMax||m.pv||m.vidaMax||m.vida||0));
  inst.pvAtual=inst.pvMax;
  inst.dureza=Math.max(0,Number(m.dureza||m.hardness||0));
  inst.pesoKg=Math.max(0,Number(m.pesoKg||m.peso||m.weightKg||0));
  inst.destruido=false;inst.pegandoFogoLab=false;inst.fogoUltimaRodadaLab=-1;
  return inst;
}
async function map807CarregarRefsNaMesa_(m){
  const refs=Array.isArray(m?.objetos)?m.objetos:[];
  const objs=[];const faltando=[];
  for(const r of refs){
    if(r?.imagemImportada||String(r?.modeloId||'')==='imagem_importada')continue;
    const inst=await map807InstanciaDaRefMesa_(r);
    if(inst)objs.push(inst);else faltando.push(String(r?.modeloId||r?.objetoBancoId||'?'));
  }
  labEstado_.larguraM=Math.max(4,Number(m.larguraM||28));
  labEstado_.alturaM=Math.max(4,Number(m.alturaM||14));
  labEstado_.fundo=String(m.fundo||'#d7d7d7');
  labEstado_.corGrade=String(m.corGrade||'#777777');
  labEstado_.gradeVisivel=m.gradeVisivel!==false;
  labEstado_.textura=String(m.textura||'nenhuma');
  if(m.pxPorMetro)labEstado_.pxPorMetro=Math.max(24,Math.min(96,Number(m.pxPorMetro)||48));
  labEstado_.oficina2State=m.oficina2State?JSON.parse(JSON.stringify(m.oficina2State)):null;
  labEstado_.desenhosLab=m.oficina2State?[]:JSON.parse(JSON.stringify(m.desenhos||[]));
  labEstado_.formasLab=JSON.parse(JSON.stringify(m.formas||[]));
  labEstado_.objetosLab=objs;
  labEstado_.objetoSelecionadoId='';
  labEstado_.selecionadoId='';
  for(const t of labEstado_.tokens||[]){
    t.x=Math.max(0,Math.min(labEstado_.larguraM,Number(t.x||0)));
    t.y=Math.max(0,Math.min(labEstado_.alturaM,Number(t.y||0)));
  }
  labDesenhoUndo_=[];labDesenhoRedo_=[];
  labSalvarLocal_();labRender_();
  return {ok:objs.length,faltando:[...new Set(faltando)]};
}

const map807LoadBase_=window.labCarregarMapaBanco_;
window.labCarregarMapaBanco_=async function(){
  const base=(mapasDB||[]).find(x=>String(x.id)===String(labMapaSelecionado_));
  if(!base)return map807LoadBase_.apply(this,arguments);
  let m=base;
  try{m=await labMapaHidratar_(base);}catch(e){
    console.error('V46.80.7 hidratar mapa',e);
    notificar_('Não foi possível carregar os dados completos deste mapa.','erro',6000);return;
  }
  const refs=String(m?.formatoObjetos||'')==='refs-v1' || String(m?.oficina2State?.formatoObjetos||'')==='refs-v1';
  if(!refs)return map807LoadBase_.apply(this,arguments);
  const rr=await map807CarregarRefsNaMesa_(m);
  if(rr.faltando.length)notificar_(`⚠️ Mapa carregado com ${rr.ok} objeto(s). Modelos não encontrados: ${rr.faltando.join(', ')}`,'aviso',8500);
  else notificar_(`✅ Mapa “${m.nome||m.id}” carregado · ${rr.ok} objeto(s) funcionais do Banco.`,'sucesso',3800);
};
window.map807CarregarRefsNaMesa_=map807CarregarRefsNaMesa_;

// V46.81.3 — refresco do painel dentro do MESMO módulo de objetosMapaDB.
document.addEventListener('toggle',function(ev){
  if(ev.target?.id==='labLiveObjectBank770' && ev.target.open){
    try{labLiveRenderObjectBank770_();}catch(e){console.warn('Abrir banco Mesa 46.81.3',e);}
  }
},true);


