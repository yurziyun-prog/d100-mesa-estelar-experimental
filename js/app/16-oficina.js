// ============================================================
// V46.77.0 — Oficina recortável, modos exclusivos, fogo ambiental
//            e pequenos ajustes de interface
// ============================================================

// 1) Banco de músicas: Momento antes de Nome e rótulos estáveis acima.
const musicaBancoGarantirAba520Base_=musicaBancoGarantirAba510_;
musicaBancoGarantirAba510_=function(){
    musicaBancoGarantirAba520Base_();
    const grid=document.querySelector('#banco-musicas .music-grid-510');
    if(!grid||grid.dataset.v520)return;
    grid.dataset.v520='1';
    const nome=document.getElementById('mus510Nome')?.closest('label');
    const momento=document.getElementById('mus510Momento')?.closest('label');
    if(nome&&momento)grid.insertBefore(momento,nome);
    for(const lab of grid.querySelectorAll('label')){
        lab.style.display='flex';lab.style.flexDirection='column';lab.style.gap='5px';
        lab.style.justifyContent='flex-end';
    }
};

// 2) Desenhar e Selecionar formas são modos mutuamente exclusivos.
const gmOficinaV2Toggle520Base_=window.gmOficinaV2Toggle_;
window.gmOficinaV2Toggle_=function(){
    const vaiAtivar=!gmOficinaV2Cfg_.ativo;
    if(vaiAtivar){
        gmVetSelectAtivo501_=false;
        const cb=document.querySelector('#gmVetSelectToggle501 input');if(cb)cb.checked=false;
        gmVet490_.selectedId='';gmVet490_.tool='select';
    }
    const r=gmOficinaV2Toggle520Base_();
    gmVet501AtualizarCamadas_();
    try{gmVet490Render_();}catch(_){}
    return r;
};
const gmVet501ToggleSelect520Base_=window.gmVet501ToggleSelect_;
window.gmVet501ToggleSelect_=function(checked){
    if(checked&&gmOficinaV2Cfg_.ativo){
        gmOficinaV2Cfg_.ativo=false;gmOficinaV2Stroke_=null;
        gmOficinaV2SyncUI_();
    }
    const r=gmVet501ToggleSelect520Base_(checked);
    gmVet501AtualizarCamadas_();
    return r;
};

// 3) Transformar em objeto passa a pedir um RECORTE manual.
let gmRecorte520_=null;
function gmRecorte520Limpar_(){document.getElementById('gmRecorte520Overlay')?.remove();gmRecorte520_=null;}
window.gmRecorte520Cancelar_=gmRecorte520Limpar_;
window.gmRecorte520Iniciar_=function(){
    const map=document.getElementById('gmOficinaV2Map');if(!map)return;
    gmOficinaV2Cfg_.ativo=false;gmVetSelectAtivo501_=false;gmOficinaV2SyncUI_();gmVet501AtualizarCamadas_();
    const cb=document.querySelector('#gmVetSelectToggle501 input');if(cb)cb.checked=false;
    gmRecorte520Limpar_();
    const ov=document.createElement('div');ov.id='gmRecorte520Overlay';
    ov.style.cssText='position:absolute;inset:0;z-index:40;cursor:crosshair;background:rgba(40,180,255,.035);touch-action:none;';
    ov.innerHTML='<div id="gmRecorte520Box" style="display:none;position:absolute;border:2px dashed #5ee7ff;background:rgba(30,180,255,.13);box-shadow:0 0 0 9999px rgba(0,0,0,.20);pointer-events:none"></div>';
    map.appendChild(ov);
    let ini=null;
    const pos=e=>{const r=map.getBoundingClientRect();return{x:Math.max(0,Math.min(r.width,e.clientX-r.left)),y:Math.max(0,Math.min(r.height,e.clientY-r.top))};};
    ov.onpointerdown=e=>{e.preventDefault();ini=pos(e);ov.setPointerCapture?.(e.pointerId);};
    ov.onpointermove=e=>{if(!ini)return;const p=pos(e),b=document.getElementById('gmRecorte520Box');if(!b)return;const x=Math.min(ini.x,p.x),y=Math.min(ini.y,p.y),w=Math.abs(p.x-ini.x),h=Math.abs(p.y-ini.y);b.style.display='block';b.style.left=x+'px';b.style.top=y+'px';b.style.width=w+'px';b.style.height=h+'px';};
    ov.onpointerup=async e=>{if(!ini)return;const p=pos(e),ppm=gmVet490Ppm_();const x=Math.min(ini.x,p.x),y=Math.min(ini.y,p.y),w=Math.abs(p.x-ini.x),h=Math.abs(p.y-ini.y);ini=null;if(w<12||h<12){notificar_('Arraste uma área maior para criar o objeto.','aviso');gmRecorte520Limpar_();return;}gmRecorte520_={minX:x/ppm,minY:y/ppm,maxX:(x+w)/ppm,maxY:(y+h)/ppm,w:w/ppm,h:h/ppm};await gmRecorte520Criar_();};
    notificar_('🎨 Arraste sobre a Oficina para recortar somente a área que virará objeto.','info',4200);
};
async function gmRecorte520Raster_(b){
    const ppm=gmVet490Ppm_(),pad=2,w=Math.max(8,Math.ceil(b.w*ppm)),h=Math.max(8,Math.ceil(b.h*ppm));
    const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);
    const source=document.getElementById('gmOficinaV2Canvas');
    if(source)ctx.drawImage(source,b.minX*ppm,b.minY*ppm,w,h,0,0,w,h);
    const shapes=(gmOficinaEstado_.formas||[]).map(f=>gmVet500SvgShape_(f,ppm,b)).join('');
    if(shapes){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${shapes}</svg>`;const blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);try{const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url;});ctx.drawImage(img,0,0);}finally{URL.revokeObjectURL(url);}}
    let data=c.toDataURL('image/webp',.9);if(data.length>105000)data=c.toDataURL('image/webp',.7);
    return {data,wM:b.w,hM:b.h};
}
async function gmRecorte520Criar_(){
    const b=gmRecorte520_;if(!b)return;const rr=await gmRecorte520Raster_(b);gmRecorte520Limpar_();
    const nome=prompt('Nome do objeto criado a partir deste recorte:','Estrutura futurista');if(!nome?.trim())return;
    const fixo=confirm('Este objeto deve ser FIXO AO MAPA?\n\nOK = estrutura fixa (bar, parede, balcão, edifício)\nCancelar = objeto móvel.');
    try{garantirObjetosMapaPadrao_();const lista=JSON.parse(JSON.stringify(objetosMapaDB||[]));let id=labMapaSlug_(nome)||`objeto_${Date.now()}`,base=id,n=2;while(lista.some(x=>String(x.id)===id))id=`${base}_${n++}`;const o={id,nome:nome.trim(),imagem:rr.data,tipoVisual:'personalizado',larguraM:Math.max(.1,rr.wM),alturaM:Math.max(.1,rr.hM),pvMax:fixo?30:10,dureza:fixo?5:2,pesoKg:fixo?500:10,destrutivel:true,inflamavel:false,inflamabilidade:0,bloqueiaMovimento:true,bloqueiaVisao:false,fixoAoMapa:fixo,rascunho:true};await setDoc(doc(db,'configuracoes',objetoMapaDocId_(id)),o,{merge:false});lista.push(o);await setDoc(doc(db,'configuracoes','objetosMapa'),{formato:'docs-v1',ids:lista.map(x=>x.id),atualizadoEm:new Date().toISOString()},{merge:false});objetosMapaDB=lista;renderizarBancoObjetosMapa_();gmOficinaV2PopularObjetos_?.();notificar_(`✂️ “${o.nome}” criado somente a partir do recorte selecionado.`,'sucesso',3800);}catch(e){console.error(e);notificar_(`Não consegui criar o objeto: ${e?.message||e}`,'erro',6000);}
}
const gmVet490InstalarUI520Base_=gmVet490InstalarUI_;
gmVet490InstalarUI_=function(){gmVet490InstalarUI520Base_();const old=document.getElementById('gmVet501CompBtn');if(old){old.textContent='✂️ Recortar e transformar em objeto';old.setAttribute('onclick','gmRecorte520Iniciar_()');}};

// 4) Fogo visual: elimina os emojis/badges antigos e mantém apenas chama + fumaça inferior.
const labObjetoHtml520Base_=labObjetoHtml_;
labObjetoHtml_=function(o,ppm){
    const id=String(o?.id||''),fx=labEstado_.efeitosObjetosLab?.[id],aceso=!!(o?.pegandoFogoLab||fx?.pegandoFogoLab)&&!o?.destruido;
    const oldO=o?.pegandoFogoLab,oldF=fx?.pegandoFogoLab;
    if(o)o.pegandoFogoLab=false;if(fx)fx.pegandoFogoLab=false;
    let h=labObjetoHtml520Base_(o,ppm);
    if(o)o.pegandoFogoLab=oldO;if(fx)fx.pegandoFogoLab=oldF;
    // Remove restos de overlays antigos caso alguma camada anterior os tenha produzido.
    h=h.replace(/<div class="lab-object-fire-v2">[\s\S]*?<\/div>/g,'').replace(/<span class="lab-fire-490">[\s\S]*?<\/span>/g,'').replace(/<span class="lab-fire-real-510">[\s\S]*?<\/span>/g,'');
    if(aceso)h=h.replace(/<\/div>\s*$/i,`<span class="lab-fire-real-510"><i class="fl f1"></i><i class="fl f2"></i><i class="fl f3"></i><i class="sm"></i></span></div>`);
    return h;
};window.labObjetoHtml_=labObjetoHtml_;
// O render antigo de emojis fica neutralizado.
labRenderFogoObjetos481_=function(){document.querySelectorAll('.lab-fire-overlay-481').forEach(x=>x.remove());};

// 5) Incêndio ambiental: dano, propagação e risco para seres vivos.
function labFogoDistBordas520_(a,b){
    const ax=Math.max(.05,Number(a?.larguraM||a?.diametroM||.8)/2),ay=Math.max(.05,Number(a?.alturaM||a?.diametroM||.8)/2),bx=Math.max(.05,Number(b?.larguraM||b?.diametroM||.8)/2),by=Math.max(.05,Number(b?.alturaM||b?.diametroM||.8)/2);
    const dx=Math.max(0,Math.abs(Number(a?.x||0)-Number(b?.x||0))-ax-bx),dy=Math.max(0,Math.abs(Number(a?.y||0)-Number(b?.y||0))-ay-by);return Math.hypot(dx,dy);
}
function labFogoDanoObjeto520_(o){
    const infl=Math.max(1,labInflamabilidadeObjeto481_(o));const dano=Math.max(1,Math.ceil(infl/2));const antes=Number(o.pvAtual??o.pvMax??0);o.pvAtual=Math.max(0,antes-dano);labAdicionarFloat_(o,-dano,'dano');if(o.pvAtual<=0){o.destruido=true;o.pegandoFogoLab=false;}return dano;
}
function labFogoDanoToken520_(t,dano=1){
    const st=labGarantirSnapshotCombate_(t);if(!st||st.morto)return 0;const locs=Object.keys(st.hitMax||{});if(!locs.length)return 0;const loc=locs.includes('PV Global')?'PV Global':locs[Math.floor(Math.random()*locs.length)];st.hit[loc]=Number(st.hit?.[loc]??st.hitMax?.[loc]??0)-dano;try{labReavaliarFerimento_(t,loc);}catch(_){}labAdicionarFloat_(t,-dano,'dano');t.ultimoResultadoProprioLab=`Calor/incêndio: -${dano} PV em ${loc}.`;return dano;
}
function labFogoPropagar520_(fontes){
    const objs=labEstado_.objetosLab||[];
    for(const alvo of objs){if(alvo.destruido||alvo.pegandoFogoLab)continue;const infl=labInflamabilidadeObjeto481_(alvo);if(infl<=0)continue;let melhor=Infinity;for(const f of fontes)if(String(f.id)!==String(alvo.id))melhor=Math.min(melhor,labFogoDistBordas520_(f,alvo));const alcance=.25+infl*.22;if(melhor>alcance)continue;const chance=Math.max(.05,Math.min(.95,infl*.16+(alcance-melhor)*.22));if(Math.random()<chance){alvo.pegandoFogoLab=true;alvo.inflamabilidadeLab=infl;labFogoSom520_(true);}}
}
let labFogoAudioCtx520_=null;
function labFogoSom520_(ignicao=false){
    if(!labAudioAtivado490_)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ac=labFogoAudioCtx520_||(labFogoAudioCtx520_=new AC());if(ac.state==='suspended')ac.resume();const dur=ignicao?.38:.22,n=Math.max(1,Math.floor(ac.sampleRate*dur)),buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++){const env=(1-i/n);d[i]=(Math.random()*2-1)*env*(Math.random()>.94?.8:.12);}const src=ac.createBufferSource(),fil=ac.createBiquadFilter(),g=ac.createGain();fil.type='bandpass';fil.frequency.value=ignicao?1250:720;fil.Q.value=.7;g.gain.value=Math.min(.12,(labAudioVolume500_||50)/100*.12);src.buffer=buf;src.connect(fil);fil.connect(g);g.connect(ac.destination);src.start();}catch(_){}
}
function labProcessarFogoObjetos520_(){
    if(labEstado_.fase!=='combate')return;const rodada=Number(labEstado_.rodada||0);const fontes=(labEstado_.objetosLab||[]).filter(o=>o.pegandoFogoLab&&!o.destruido);if(!fontes.length)return;
    let processou=false;for(const o of fontes){if(Number(o.fogoUltimaRodadaLab)===rodada)continue;o.fogoUltimaRodadaLab=rodada;labFogoDanoObjeto520_(o);processou=true;}
    if(!processou)return;
    labFogoPropagar520_(fontes);
    for(const t of (labEstado_.tokens||[])){const st=labGarantirSnapshotCombate_(t);if(st?.morto)continue;let dist=Infinity;for(const f of fontes)dist=Math.min(dist,labFogoDistBordas520_(f,t));if(dist<=.15)labFogoDanoToken520_(t,2);else if(dist<=.45&&Math.random()<.45)labFogoDanoToken520_(t,1);}
    labFogoSom520_(false);
}
// Substitui o processador simples anterior (1 PV fixo) pela versão ambiental.
labProcessarFogoObjetosV247_=labProcessarFogoObjetos520_;

// 6) Extintor: ação contextual quando o ator tem um extintor equipado.
window.labExtinguirObjeto520_=function(id){
    labObjetoAcao_('extinguir',id);
};
const labObjetoMicroPainelHtml520Base_=labObjetoMicroPainelHtml_;
labObjetoMicroPainelHtml_=function(o,ppm){let h=labObjetoMicroPainelHtml520Base_(o,ppm);if(!h||!o?.pegandoFogoLab)return h;const ator=labTokenAtual_(),ext=ator&&labEquipadoRegex_(ator,/extintor|extinguisher|灭火器/);if(ext)h=h.replace('</div>',`<button class="btn-small" onclick="labExtinguirObjeto520_('${String(o.id).replace(/'/g,"\\'")}')" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">🧯 Apagar fogo</button></div>`);return h;};

// 7) Restaurar limpa também o estado público dos efeitos de objetos.
window.labRestaurarParticipantes_=async function(){
    if(!batalhaEhMestre_())return;
    if(!confirm('Restaurar toda a Mesa de testes? PCs, NPCs, monstros, criaturas e objetos voltarão ao estado inicial de combate.'))return;
    for(const t of labEstado_.tokens||[])labRestaurarTokenCompleto490_(t);
    for(const o of labEstado_.objetosLab||[]){
        o.pvAtual=Number(o.pvMax??o.pvAtual??0);o.destruido=false;o.pegandoFogoLab=false;o.despedacadoLab=false;o.explodindoLab=false;o.fogoUltimaRodadaLab=-1;o.sangrando=false;o.derrubado=false;o.atordoado=false;
    }
    labEstado_.efeitosObjetosLab={};labEstado_.pendenciaLab=null;labEstado_.danoPendenteLab=null;
    labSalvarLocal_();labAgendarSyncRemoto_();labRender_();notificar_('♻️ Mesa restaurada por completo, inclusive incêndios e efeitos.','sucesso',3500);
};

// Reinstala pequenos ajustes quando a Oficina/Banco forem redesenhados.
const labRender520Base_=labRender_;
window.labRender_=labRender_;




// ============================================================
// V46.77.0
// Oficina: retângulo arredondado + opacidades independentes
// Música: estado Play/Stop visível
// Mesa: entrada livre para jogadores
// Incêndio: contato imediato, dano por rodada e restauração forte
// ============================================================

// ------------------------------------------------------------
// 1) Oficina — retângulo arredondado e opacidades separadas
// ------------------------------------------------------------
function gmVet530Opacidades_(f){
    const legado=Number(f?.opacity??.65);
    return {
        stroke:Math.max(0,Math.min(1,Number(f?.strokeOpacity??legado))),
        fill:Math.max(0,Math.min(1,Number(f?.fillOpacity??legado)))
    };
}

gmVet490SvgEl_=function(f,ppm){
    const id=String(f.id).replace(/'/g,"\\'");
    const stroke=f.stroke||'#00d4ff',fill=f.tipo==='linha'?'none':(f.fill||'transparent');
    const op=gmVet530Opacidades_(f),sw=Number(f.strokeWidth||3);
    const x=Number(f.x||0)*ppm,y=Number(f.y||0)*ppm,w=Number(f.w||0)*ppm,h=Number(f.h||0)*ppm;
    const cx=(Number(f.x||0)+Number(f.w||0)/2)*ppm,cy=(Number(f.y||0)+Number(f.h||0)/2)*ppm;
    const common=`stroke="${stroke}" stroke-opacity="${op.stroke}" stroke-width="${sw}" fill="${fill}" fill-opacity="${op.fill}" transform="rotate(${Number(f.rot||0)} ${cx} ${cy})" data-vet-id="${escaparHtmlInventario_(f.id)}" class="${String(f.id)===String(gmVet490_.selectedId)?'gm-vector-selected':''}" onpointerdown="gmVet490PointerForma_(event,'${id}')"`;
    if(f.tipo==='linha')return `<line x1="${x}" y1="${y}" x2="${Number(f.x2??f.x)*ppm}" y2="${Number(f.y2??f.y)*ppm}" ${common}/>`;
    if(f.tipo==='circulo'){
        const d=Math.max(Math.abs(w),Math.abs(h));
        return `<ellipse cx="${x+d/2}" cy="${y+d/2}" rx="${d/2}" ry="${d/2}" ${common}/>`;
    }
    if(f.tipo==='elipse')return `<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${Math.abs(w)/2}" ry="${Math.abs(h)/2}" ${common}/>`;
    if(f.tipo==='triangulo')return `<polygon points="${x+w/2},${y} ${x+w},${y+h} ${x},${y+h}" ${common}/>`;
    if(f.tipo==='arredondado'){
        const rx=Math.max(2,Math.min(Math.abs(w),Math.abs(h))/2,Number(f.radius||.25)*ppm);
        return `<rect x="${x}" y="${y}" width="${Math.abs(w)}" height="${Math.abs(h)}" rx="${Math.min(rx,Math.abs(w)/2,Math.abs(h)/2)}" ry="${Math.min(rx,Math.abs(w)/2,Math.abs(h)/2)}" ${common}/>`;
    }
    return `<rect x="${x}" y="${y}" width="${Math.abs(w)}" height="${Math.abs(h)}" ${common}/>`;
};

gmVet500SvgShape_=function(f,scale,b){
    const shiftX=x=>(Number(x||0)-b.minX)*scale,shiftY=y=>(Number(y||0)-b.minY)*scale;
    const stroke=f.stroke||'#00d4ff',fill=f.tipo==='linha'?'none':(f.fill||'transparent');
    const op=gmVet530Opacidades_(f),sw=Math.max(1,Number(f.strokeWidth||3));
    const x=shiftX(f.x),y=shiftY(f.y),w=Number(f.w||0)*scale,h=Number(f.h||0)*scale;
    const cx=x+w/2,cy=y+h/2,rot=Number(f.rot||0);
    const common=`stroke="${stroke}" stroke-opacity="${op.stroke}" stroke-width="${sw}" fill="${fill}" fill-opacity="${op.fill}" transform="rotate(${rot} ${cx} ${cy})"`;
    if(f.tipo==='linha')return `<line x1="${x}" y1="${y}" x2="${shiftX(f.x2)}" y2="${shiftY(f.y2)}" ${common}/>`;
    if(f.tipo==='circulo'){const d=Math.max(Math.abs(w),Math.abs(h));return `<ellipse cx="${x+d/2}" cy="${y+d/2}" rx="${d/2}" ry="${d/2}" ${common}/>`;}
    if(f.tipo==='elipse')return `<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${Math.abs(w)/2}" ry="${Math.abs(h)/2}" ${common}/>`;
    if(f.tipo==='triangulo')return `<polygon points="${x+w/2},${y} ${x+w},${y+h} ${x},${y+h}" ${common}/>`;
    if(f.tipo==='arredondado'){
        const rx=Math.max(2,Number(f.radius||.25)*scale);
        return `<rect x="${x}" y="${y}" width="${Math.abs(w)}" height="${Math.abs(h)}" rx="${Math.min(rx,Math.abs(w)/2,Math.abs(h)/2)}" ry="${Math.min(rx,Math.abs(w)/2,Math.abs(h)/2)}" ${common}/>`;
    }
    return `<rect x="${x}" y="${y}" width="${Math.abs(w)}" height="${Math.abs(h)}" ${common}/>`;
};

gmVet490Inspector_=function(){
    const box=document.getElementById('gmVet490Inspector');if(!box)return;
    const f=gmVet490Sel_();
    if(!f){box.innerHTML='<span style="color:#9fb4c8">Selecione uma forma para mover, redimensionar, girar ou recolorir.</span>';return;}
    const op=gmVet530Opacidades_(f);
    box.innerHTML=`
      <strong style="color:#ffd54a">${escaparHtmlInventario_(f.tipo)}</strong>
      <label><small>X m</small><input type="number" step=".1" value="${Number(f.x||0)}" onchange="gmVet490Prop_('x',this.value)"></label>
      <label><small>Y m</small><input type="number" step=".1" value="${Number(f.y||0)}" onchange="gmVet490Prop_('y',this.value)"></label>
      ${f.tipo==='linha'
        ? `<label><small>X2 m</small><input type="number" step=".1" value="${Number(f.x2||0)}" onchange="gmVet490Prop_('x2',this.value)"></label>
           <label><small>Y2 m</small><input type="number" step=".1" value="${Number(f.y2||0)}" onchange="gmVet490Prop_('y2',this.value)"></label>`
        : `<label><small>Largura m</small><input type="number" min=".1" step=".1" value="${Number(f.w||1)}" onchange="gmVet490Prop_('w',this.value)"></label>
           <label><small>Altura m</small><input type="number" min=".1" step=".1" value="${Number(f.h||1)}" onchange="gmVet490Prop_('h',this.value)"></label>
           <label><small>Rotação°</small><input type="number" step="5" value="${Number(f.rot||0)}" onchange="gmVet490Prop_('rot',this.value)"></label>
           ${f.tipo==='arredondado'?`<label><small>Raio canto (m)</small><input type="number" min=".05" step=".05" value="${Number(f.radius||.25)}" onchange="gmVet490Prop_('radius',this.value)"></label>`:''}`}
      <label><small>Borda</small><input type="color" value="${f.stroke||'#00d4ff'}" onchange="gmVet490Prop_('stroke',this.value)"></label>
      ${f.tipo==='linha'?'':`<label><small>Preenchimento</small><input type="color" value="${f.fill||'#34537a'}" onchange="gmVet490Prop_('fill',this.value)"></label>`}
      <span class="opacity-group-530">
        <label><small>Transp. borda</small><input type="number" min="0" max="1" step=".05" value="${op.stroke}" onchange="gmVet490Prop_('strokeOpacity',this.value)"></label>
        ${f.tipo==='linha'?'':`<label><small>Transp. conteúdo</small><input type="number" min="0" max="1" step=".05" value="${op.fill}" onchange="gmVet490Prop_('fillOpacity',this.value)"></label>`}
      </span>
      <label><small>Borda px</small><input type="number" min="1" max="20" step="1" value="${Number(f.strokeWidth||3)}" onchange="gmVet490Prop_('strokeWidth',this.value)"></label>
      <button class="btn-small" onclick="gmVet490Duplicar_()">⧉ Duplicar</button>
      <button class="btn-small btn-danger" onclick="gmVet490Excluir_()">🗑 Excluir</button>`;
};

const gmVet490InstalarUI530Base_=gmVet490InstalarUI_;
gmVet490InstalarUI_=function(){
    gmVet490InstalarUI530Base_();
    const row=document.getElementById('gmVet490Tools')?.querySelector('div');
    if(row&&!document.getElementById('gmVetRounded530')){
        const ref=[...row.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("gmVet490Tool_('retangulo')"));
        const b=document.createElement('button');b.id='gmVetRounded530';b.className='btn-small';b.textContent='▢ Retângulo arredondado';
        b.setAttribute('onclick',"gmVet490Tool_('arredondado')");
        if(ref)ref.insertAdjacentElement('afterend',b);else row.appendChild(b);
    }
};

// ------------------------------------------------------------
// 2) Música — seleção + botão que mostra claramente Play/Stop
// ------------------------------------------------------------
let gmMusicaSelecao530_={tipo:'',valor:''};

window.gmMusicaSelecionar530_=function(tipo,valor){
    gmMusicaSelecao530_={tipo:String(tipo||''),valor:String(valor||'')};
    gmMusicaSelectorRender510_();
};
window.gmMusicaToggle530_=function(){
    const st=labEstado_.audioMesaLab||{};
    if(st.playing){gmMusicaParar490_();gmMusicaSelectorRender510_();return;}
    const sel=gmMusicaSelecao530_;
    if(sel.tipo==='momento'&&sel.valor)gmMusicaTocarMomento510_(sel.valor);
    else if(sel.tipo==='musica'&&sel.valor)gmMusicaTocarId510_(sel.valor);
    else{
        const atual=String(st.id||'');
        if(atual)gmMusicaTocarId510_(atual);
        else notificar_('Selecione uma música ou um momento primeiro.','aviso',3000);
    }
    setTimeout(gmMusicaSelectorRender510_,80);
};

gmMusicaSelectorRender510_=function(){
    const box=document.getElementById('gmMusica510');if(!box)return;
    const list=[...(trilhasMesaDB490_||[])].sort((a,b)=>Number(a.ordem||0)-Number(b.ordem||0)||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    const momentos=[...new Set(list.map(x=>String(x.categoria||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const st=labEstado_.audioMesaLab||{},playing=!!st.playing;
    if(!gmMusicaSelecao530_.valor){
        if(st.mode==='moment'&&st.momento)gmMusicaSelecao530_={tipo:'momento',valor:String(st.momento)};
        else if(st.id)gmMusicaSelecao530_={tipo:'musica',valor:String(st.id)};
    }
    const sm=gmMusicaSelecao530_.tipo==='momento'?gmMusicaSelecao530_.valor:'';
    const ss=gmMusicaSelecao530_.tipo==='musica'?gmMusicaSelecao530_.valor:'';
    box.innerHTML=`<h3 style="margin-top:0">🎵 Música da Mesa</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">
        <label style="margin:0"><small>Momento / playlist</small>
          <select onchange="gmMusicaSelecionar530_('momento',this.value)" style="margin:3px 0 0">
            <option value="">— selecionar momento —</option>${momentos.map(m=>`<option value="${escaparHtmlInventario_(m)}" ${m===sm?'selected':''}>${escaparHtmlInventario_(m)}</option>`).join('')}
          </select></label>
        <label style="margin:0"><small>Música única</small>
          <select onchange="gmMusicaSelecionar530_('musica',this.value)" style="margin:3px 0 0">
            <option value="">— selecionar música —</option>${list.map(t=>`<option value="${escaparHtmlInventario_(t.id)}" ${String(t.id)===ss?'selected':''}>${escaparHtmlInventario_(t.nome)}${t.categoria?` · ${escaparHtmlInventario_(t.categoria)}`:''}</option>`).join('')}
          </select></label>
        <button id="gmMusicaToggle530" class="btn-small ${playing?'playing':''}" onclick="gmMusicaToggle530_()">${playing?'■ Parar':'▶ Tocar'}</button>
        <span id="gmMusicaStatus530">${playing?`● Tocando: ${escaparHtmlInventario_(st.nome||st.momento||'trilha')}`:'○ Parado'}</span>
      </div>
      <div style="margin-top:7px;color:#9fc6d8">Cadastro e organização ficam em Banco de Dados → Músicas.</div>`;
};

// ------------------------------------------------------------
// 3) Entrada livre — checkbox do mestre + botão do jogador
// ------------------------------------------------------------
function labEntradaLivreInstalar530_(){
    const edit=document.getElementById('labEditMapToggleWrap');
    const controls=document.getElementById('labMasterGameControls');
    if(edit&&controls&&!document.getElementById('labFreeEntryWrap530')){
        const lab=document.createElement('label');lab.id='labFreeEntryWrap530';
        lab.title='Quando ativo, jogadores podem colocar o próprio personagem nesta mesa sem o mestre adicioná-los manualmente.';
        lab.innerHTML='<input id="labFreeEntry530" type="checkbox" onchange="labEntradaLivreToggle530_(this.checked)"> 🚪 Entrada livre';
        edit.insertAdjacentElement('afterend',lab);
    }
    const toolbar=document.querySelector('#laboratorio-combate .lab-toolbar-row');
    if(toolbar&&!document.getElementById('labPlayerJoin530')){
        const d=document.createElement('div');d.id='labPlayerJoin530';
        toolbar.insertAdjacentElement('afterend',d);
    }
}
window.labEntradaLivreToggle530_=function(v){
    if(!batalhaEhMestre_())return;
    labEstado_.entradaLivreLab=!!v;
    labSalvarLocal_();labAgendarSyncRemoto_();labEntradaLivreAtualizar530_();
    notificar_(v?'🚪 Entrada livre ativada.':'🔒 Entrada livre desativada.',v?'sucesso':'info',2200);
};
function labEntradaLivreAtualizar530_(){
    labEntradaLivreInstalar530_();
    const cb=document.getElementById('labFreeEntry530');
    const wrap=document.getElementById('labFreeEntryWrap530');
    if(cb)cb.checked=!!labEstado_.entradaLivreLab;
    if(wrap)wrap.style.display=batalhaEhMestre_()?'flex':'none';

    const d=document.getElementById('labPlayerJoin530');if(!d)return;
    if(batalhaEhMestre_()||!labEstado_.entradaLivreLab){d.style.display='none';return;}
    const chars=(userCharacters||[]).filter(c=>String(c.dono||c.donoUid||'')===String(currentUserUid||'')&&String(c.tipo||'pc').toLowerCase()==='pc');
    const emMesa=new Set((labEstado_.tokens||[]).map(t=>String(t.origemId||t.id)));
    const disponiveis=chars.filter(c=>!emMesa.has(String(c.id)));
    if(!disponiveis.length){d.style.display='flex';d.innerHTML='<span style="color:#9fc6d8">✅ Seu personagem já está nesta mesa.</span>';return;}
    let escolhido=String(currentCharId||'');
    if(!disponiveis.some(c=>String(c.id)===escolhido))escolhido=String(disponiveis[0].id);
    d.style.display='flex';
    d.innerHTML=`<strong style="color:#8ff0a8">🚪 Entrada livre</strong>
      <select id="labPlayerJoinChar530">${disponiveis.map(c=>`<option value="${escaparHtmlInventario_(c.id)}" ${String(c.id)===escolhido?'selected':''}>${escaparHtmlInventario_(c.nome||'Personagem')}</option>`).join('')}</select>
      <button class="btn-small btn-select" onclick="labPlayerJoin530_()">Entrar no mapa</button>`;
}
window.labPlayerJoin530_=async function(){
    if(batalhaEhMestre_()||!labEstado_.entradaLivreLab)return;
    const id=String(document.getElementById('labPlayerJoinChar530')?.value||currentCharId||'');
    const c=(userCharacters||[]).find(x=>String(x.id)===id);
    if(!c){notificar_('Escolha um personagem seu.','aviso');return;}
    if((labEstado_.tokens||[]).some(t=>String(t.origemId||t.id)===id)){notificar_('Esse personagem já está no mapa.','info');return;}
    try{
        await setDoc(doc(db,'combatesAtivos','mapaMesaExperimental','acoes',id),{
            personagemId:id,donoUid:String(currentUserUid||currentUser?.uid||''),tipo:'entrar_mapa',
            payload:{personagemId:id},nonce:`${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
            status:'novo',criadoEm:new Date().toISOString()
        },{merge:false});
        notificar_('🚪 Pedido de entrada enviado para a Mesa.','sucesso',2500);
    }catch(e){console.error(e);notificar_('Não foi possível entrar na Mesa.','erro',4500);}
};

const labProcessarComandoJogador530Base_=labProcessarComandoJogador_;


// ------------------------------------------------------------
// 4) Fogo — contato de personagens realmente aplica dano
// ------------------------------------------------------------
function labFogoFonteMaisPerto530_(t){
    const fontes=(labEstado_.objetosLab||[]).filter(o=>o.pegandoFogoLab&&!o.destruido);
    let melhor=null,dist=Infinity;
    for(const f of fontes){
        const d=labFogoDistBordas520_(f,t);
        if(d<dist){dist=d;melhor=f;}
    }
    return {fonte:melhor,dist};
}
function labFogoContatoToken530_(t,forcar=false){
    if(!t||labEstado_.fase!=='combate')return false;
    const st=labGarantirSnapshotCombate_(t);if(!st||st.morto)return false;
    const rodada=Number(labEstado_.rodada||0),p=labFogoFonteMaisPerto530_(t);
    if(!p.fonte||p.dist>.45)return false;

    const chave=`${rodada}:${String(p.fonte.id)}`;
    if(!forcar&&String(t.fogoContatoChave530||'')===chave)return false;

    let dano=0;
    if(p.dist<=.05)dano=2;                    // tocando/por cima do foco
    else if(p.dist<=.22)dano=1;               // muito perto
    else if(p.dist<=.45&&Math.random()<.45)dano=1;

    t.fogoContatoChave530=chave;
    if(dano>0){
        labFogoDanoToken520_(t,dano);
        labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];
        labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`🔥 ${t.nome} sofreu ${dano} de dano por contato com o incêndio de ${p.fonte.nome||'um objeto'}.`});
        labFogoSom520_(false);
        return true;
    }
    return false;
}
function labFogoContatoImediato530_(){
    if(!batalhaEhMestre_()||labEstado_.fase!=='combate')return;
    let mudou=false;
    for(const t of (labEstado_.tokens||[]))if(labFogoContatoToken530_(t,false))mudou=true;
    if(mudou){labSalvarLocal_();labAgendarSyncRemoto_();}
}

function labProcessarFogoObjetos530_(){
    if(labEstado_.fase!=='combate')return;
    const rodada=Number(labEstado_.rodada||0);
    let fontes=(labEstado_.objetosLab||[]).filter(o=>o.pegandoFogoLab&&!o.destruido);
    if(!fontes.length)return;
    let fogoMudou=false;

    for(const o of fontes){
        if(Number(o.fogoUltimaRodadaLab)===rodada)continue;
        o.fogoUltimaRodadaLab=rodada;
        labFogoDanoObjeto520_(o);
        fogoMudou=true;
    }

    fontes=(labEstado_.objetosLab||[]).filter(o=>o.pegandoFogoLab&&!o.destruido);
    if(fogoMudou&&fontes.length)labFogoPropagar520_(fontes);

    for(const t of (labEstado_.tokens||[]))labFogoContatoToken530_(t,false);
    if(fogoMudou)labFogoSom520_(false);
}
labProcessarFogoObjetosV247_=labProcessarFogoObjetos530_;

// ------------------------------------------------------------
// 5) Restaurar — limpa local, público e Firestore imediatamente
// ------------------------------------------------------------
window.labRestaurarParticipantes_=async function(){
    if(!batalhaEhMestre_())return;
    if(!confirm('Restaurar toda a Mesa de testes? PCs, NPCs, monstros, criaturas e objetos voltarão ao estado inicial de combate.'))return;

    for(const t of labEstado_.tokens||[]){
        labRestaurarTokenCompleto490_(t);
        t.fogoContatoChave530='';
    }
    for(const o of labEstado_.objetosLab||[]){
        o.pvAtual=Number(o.pvMax??o.pvAtual??0);
        o.destruido=false;o.pegandoFogoLab=false;o.despedacadoLab=false;o.explodindoLab=false;
        o.fogoUltimaRodadaLab=-1;o.sangrando=false;o.derrubado=false;o.atordoado=false;
    }
    labEstado_.efeitosObjetosLab={};
    labEstado_.pendenciaLab=null;labEstado_.danoPendenteLab=null;

    // Remove visual antigo imediatamente, antes mesmo do novo snapshot chegar.
    document.querySelectorAll('.lab-fire-real-510,.lab-fire-overlay-481,.lab-object-fire-v2,.lab-fire-490').forEach(x=>x.remove());

    labSalvarLocal_();labRender_();
    try{
        await setDoc(LAB_MAPA_MESA_REF_(),{estado:labEstadoPublico_(),atualizadoEm:new Date().toISOString()},{merge:false});
    }catch(e){console.warn('Restauração remota da Mesa',e);labAgendarSyncRemoto_();}
    notificar_('♻️ Mesa restaurada por completo, inclusive incêndios, PV e estados.','sucesso',3500);
};

// ------------------------------------------------------------
// 6) Render final desta versão
// ------------------------------------------------------------
const labRender530Base_=labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.77.0
// Corrige floats fantasmas, aviso de queimadura, estabilidade
// vertical da Mesa, ataque a mortos e entrada livre automática.
// ============================================================

// ------------------------------------------------------------
// 1) Números de dano: nunca reaparecem "fantasmas"
// ------------------------------------------------------------
function labFloatTimestamp540_(f){
    const m=String(f?.id||'').match(/^f_(\d{10,})_/);
    return m?Number(m[1]):0;
}
const labFloatHtml540Base_=labFloatHtml_;
labFloatHtml_=function(f,ppm){
    const ts=labFloatTimestamp540_(f);
    if(ts&&Date.now()-ts>1900)return '';
    return labFloatHtml540Base_(f,ppm);
};

const labEstadoPublico540Base_=labEstadoPublico_;
labEstadoPublico_=function(){
    const c=labEstadoPublico540Base_();
    // Só números realmente recentes entram no snapshot público.
    c.floatsLab=(c.floatsLab||[]).filter(f=>{
        const ts=labFloatTimestamp540_(f);
        return ts&&Date.now()-ts<1750;
    });
    return c;
};
function labLimparFloatsAntigos540_(){
    const agora=Date.now();
    labEstado_.floatsLab=(labEstado_.floatsLab||[]).filter(f=>{
        const ts=labFloatTimestamp540_(f);
        return ts&&agora-ts<2000;
    });
}

// ------------------------------------------------------------
// 2) Fogo: quem está queimando recebe aviso privado visível
// ------------------------------------------------------------
const labFogoDanoToken540Base_=labFogoDanoToken520_;
labFogoDanoToken520_=function(t,dano=1){
    const aplicado=labFogoDanoToken540Base_(t,dano);
    if(aplicado>0){
        t.fogoAvisoTsLab=Date.now();
        t.ultimoResultadoRecebidoLab=`🔥 Você está sendo queimado! Sofreu ${aplicado} de dano. Saia das chamas.`;
        t.ultimoResultadoRecebidoTsLab=t.fogoAvisoTsLab;
    }
    return aplicado;
};

let labFogoAvisoVisto540_=0;
function labAvisarJogadorQueimando540_(){
    if(batalhaEhMestre_())return;
    const meus=(labEstado_.tokens||[]).filter(t=>{
        try{return labPodeControlarToken_(t);}catch(_){return false;}
    });
    for(const t of meus){
        const ts=Number(t.fogoAvisoTsLab||0);
        if(ts>labFogoAvisoVisto540_){
            labFogoAvisoVisto540_=ts;
            notificar_(`🔥 ${t.nome}: você está sendo queimado. Saia das chamas!`,'aviso',5200);
        }
    }
}

// ------------------------------------------------------------
// 3) Restaurar: remove também floats, avisos e fogo sincronizado
// ------------------------------------------------------------
const labRestaurarParticipantes540Base_=window.labRestaurarParticipantes_;
window.labRestaurarParticipantes_=async function(){
    // Limpa os transitórios ANTES e DEPOIS do restaurar anterior.
    labEstado_.floatsLab=[];
    for(const t of (labEstado_.tokens||[])){
        t.fogoAvisoTsLab=0;
        t.fogoContatoChave530='';
    }
    await labRestaurarParticipantes540Base_();
    labEstado_.floatsLab=[];
    labEstado_.efeitosObjetosLab={};
    for(const o of (labEstado_.objetosLab||[])){
        o.pegandoFogoLab=false;
        o.fogoUltimaRodadaLab=-1;
    }
    document.querySelectorAll('[data-lab-float],.lab-fire-real-510,.lab-fire-overlay-481,.lab-object-fire-v2,.lab-fire-490').forEach(x=>x.remove());
    labSalvarLocal_();
};

// ------------------------------------------------------------
// 4) Alvo morto: seleção manual é respeitada e ataque causa dano
// ------------------------------------------------------------
const labGarantirPrefsAtaque540Base_=labGarantirPrefsAtaque_;
labGarantirPrefsAtaque_=function(t){
    if(!t)return;
    const escolhido=String(t.alvoLab||'');
    const alvoEscolhido=escolhido?labAlvoAtaquePorId_(escolhido):null;
    const manualMorto=!!t._alvoMortoManual510 && !!alvoEscolhido;
    labGarantirPrefsAtaque540Base_(t);
    if(manualMorto)t.alvoLab=escolhido;
};

// Se o alvo morto for selecionado no menu, não deixa outro saneador trocá-lo.
const labUniversalAlvo540Base_=window.labUniversalAlvo_;
window.labUniversalAlvo_=function(v){
    const t=labTokenAtual_();
    if(t&&t.universalModoLab==='combate'){
        const a=labAlvoAtaquePorId_(v);
        t._alvoMortoManual510=!!labAlvoInerte490_(a);
        t.alvoLab=String(v||'');
    }
    return labUniversalAlvo540Base_(v);
};

// ------------------------------------------------------------
// 5) Entrada livre: é automática; não existe "aprovação do mestre"
// ------------------------------------------------------------
function labCharPertenceAoUid540_(c,uid){
    if(!c)return false;
    const donos=[
        c.donoUid,c.dono,c.uid,c.userUid,c.usuarioUid,c.ownerUid,c.ownerId,c.criadoPor
    ].filter(v=>v!==undefined&&v!==null&&String(v)!=='').map(String);
    // Se o documento não registra proprietário, a lista local do próprio
    // jogador já foi a fonte da solicitação; não bloqueia a entrada livre.
    return !donos.length||donos.includes(String(uid||''));
}

const labEntradaLivreAtualizar540Base_=labEntradaLivreAtualizar530_;
labEntradaLivreAtualizar530_=function(){
    labEntradaLivreAtualizar540Base_();
    const d=document.getElementById('labPlayerJoin530');
    if(!d||batalhaEhMestre_()||!labEstado_.entradaLivreLab)return;

    // userCharacters já é a coleção acessível ao usuário atual.
    const chars=(userCharacters||[]).filter(c=>String(c.tipo||'pc').toLowerCase()==='pc');
    const emMesa=new Set((labEstado_.tokens||[]).map(t=>String(t.origemId||t.id)));
    const disponiveis=chars.filter(c=>!emMesa.has(String(c.id)));
    if(!disponiveis.length){
        d.style.display='flex';
        d.classList.remove('joining-540');
        d.innerHTML='<span style="color:#9fc6d8">✅ Seu personagem já está nesta mesa.</span>';
        return;
    }
    let escolhido=String(currentCharId||'');
    if(!disponiveis.some(c=>String(c.id)===escolhido))escolhido=String(disponiveis[0].id);
    d.style.display='flex';
    d.classList.remove('joining-540');
    d.innerHTML=`<strong style="color:#8ff0a8">🚪 Entrada livre</strong>
      <select id="labPlayerJoinChar530">${disponiveis.map(c=>`<option value="${escaparHtmlInventario_(c.id)}" ${String(c.id)===escolhido?'selected':''}>${escaparHtmlInventario_(c.nome||'Personagem')}</option>`).join('')}</select>
      <button class="btn-small btn-select" onclick="labPlayerJoin540_()">Entrar agora</button>`;
};

window.labPlayerJoin540_=async function(){
    if(batalhaEhMestre_()||!labEstado_.entradaLivreLab)return;
    const id=String(document.getElementById('labPlayerJoinChar530')?.value||currentCharId||'');
    const c=(userCharacters||[]).find(x=>String(x.id)===id);
    if(!c){notificar_('Escolha um personagem seu.','aviso');return;}
    if((labEstado_.tokens||[]).some(t=>String(t.origemId||t.id)===id))return;

    const d=document.getElementById('labPlayerJoin530');
    if(d){
        d.classList.add('joining-540');
        d.innerHTML='<span style="color:#8ff0a8">🚪 Entrando na Mesa…</span>';
    }
    try{
        // Continua usando a fila segura do Firestore, porém o mestre não
        // aprova nada: o cliente do mestre processa automaticamente.
        await setDoc(doc(db,'combatesAtivos','mapaMesaExperimental','acoes',id),{
            personagemId:id,
            donoUid:String(currentUserUid||currentUser?.uid||''),
            tipo:'entrar_mapa',
            payload:{personagemId:id,entradaLivre:true},
            nonce:`${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
            status:'novo',criadoEm:new Date().toISOString()
        },{merge:false});
        // Sem mensagem de "pedido ao mestre": entrada livre não é pedido.
    }catch(e){
        console.error(e);
        notificar_('Não foi possível entrar na Mesa.','erro',4500);
        labEntradaLivreAtualizar530_();
    }
};
window.labPlayerJoin530_=window.labPlayerJoin540_;

const labProcessarComandoJogador540Base_=labProcessarComandoJogador_;


// ------------------------------------------------------------
// 6) O mapa não muda de posição na tela quando painel/log muda
// ------------------------------------------------------------
const labRender540Base_=labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.77.0 — Oficina: estilos de traço exclusivos + prévia real
// ============================================================
window.gmOficinaV2StrokeStyle_=function(v){
    const x=String(v||'redondo');
    const brushes=['redondo','quadrado','irregular','caligrafico','spray'];
    const textures=['pontilhada','giz','ranhura','areia','cascalho','grama','folhas','neve','fumaca'];
    if(brushes.includes(x)){
        gmOficinaV2Cfg_.pincel=x;
        gmOficinaV2Cfg_.texturaTraco='solida';
    }else if(textures.includes(x)){
        // Uma textura é um estilo completo: não pode coexistir com Spray/Irregular/etc.
        gmOficinaV2Cfg_.pincel='redondo';
        gmOficinaV2Cfg_.texturaTraco=x;
    }else{
        gmOficinaV2Cfg_.pincel='redondo';gmOficinaV2Cfg_.texturaTraco='solida';
    }
    gmOficinaV2Cfg_.ativo=true;
    gmOficinaRender_();
};

function gmOficinaV2Preview550_(){
    const cv=document.getElementById('gmOficinaV2BrushPreview');if(!cv)return;
    const dpr=Math.max(1,window.devicePixelRatio||1),w=150,h=38;
    if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
    const ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    ctx.fillStyle='rgba(255,255,255,.035)';ctx.fillRect(0,0,w,h);
    const color=gmOficinaV2Cfg_.cor||'#ffcf4d',size=Math.max(2,Math.min(24,Number(gmOficinaV2Cfg_.tamanho||7))),opacity=Math.max(.05,Math.min(1,Number(gmOficinaV2Cfg_.opacidade||1)));
    const pts=[];for(let x=10;x<=140;x+=3)pts.push({x:x,y:19+Math.sin(x/17)*3});
    ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineJoin='round';ctx.lineCap='round';
    const brush=gmOficinaV2Cfg_.pincel||'redondo',texture=gmOficinaV2Cfg_.texturaTraco||'solida';
    if(texture!=='solida')labDesenhoAplicarTextura_(ctx,texture,pts,0,size,color,1,brush);
    else if(brush==='spray'){
        for(let j=0;j<pts.length;j++){const p=pts[j],dots=Math.max(4,Math.round(size*.8));for(let k=0;k<dots;k++){const a=labDesenhoRand_(j*97+k*13)*Math.PI*2,r=Math.sqrt(labDesenhoRand_(j*193+k*29))*size*.8,rr=Math.max(.7,size*(.045+.08*labDesenhoRand_(j*71+k*41)));ctx.beginPath();ctx.arc(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,rr,0,Math.PI*2);ctx.fill();}}
    }else if(brush==='quadrado'){for(const p of pts)ctx.fillRect(p.x-size/2,p.y-size/2,size,size);}
    else if(brush==='irregular'){
        ctx.lineWidth=size;ctx.beginPath();for(let j=0;j<pts.length;j++){const wob=size*.70,x=pts[j].x+(labDesenhoRand_(j*151+3)-.5)*wob,y=pts[j].y+(labDesenhoRand_(j*211+9)-.5)*wob;if(!j)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
    }else{
        ctx.lineWidth=brush==='caligrafico'?Math.max(1,size*.42):size;ctx.lineCap=brush==='caligrafico'?'butt':'round';ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();
    }
    ctx.restore();
}

const gmOficinaV2SyncUI550Base_=gmOficinaV2SyncUI_;
gmOficinaV2SyncUI_=function(){
    gmOficinaV2SyncUI550Base_();
    const sel=document.getElementById('gmOficinaV2StrokeStyle');if(sel)sel.value=gmOficinaV2EstiloAtual550_();
    gmOficinaV2Preview550_();
};

// Controles antigos continuam aceitos por compatibilidade com mapas salvos, mas
// qualquer chamada direta também passa a obedecer exclusividade.
window.gmOficinaV2Brush_=function(v){
    const x=['redondo','quadrado','spray','irregular','caligrafico'].includes(String(v))?String(v):'redondo';
    gmOficinaV2Cfg_.pincel=x;gmOficinaV2Cfg_.texturaTraco='solida';gmOficinaV2Cfg_.ativo=true;gmOficinaRender_();
};
window.gmOficinaV2StrokeTexture_=function(v){
    const x=['pontilhada','giz','ranhura','areia','cascalho','grama','folhas','neve','fumaca'].includes(String(v))?String(v):'solida';
    gmOficinaV2Cfg_.texturaTraco=x;gmOficinaV2Cfg_.pincel='redondo';gmOficinaV2Cfg_.ativo=true;gmOficinaRender_();
};

// Prévia reage instantaneamente a cor/tamanho/opacidade sem redesenhar a Oficina inteira.
const gmOficinaV2Color550Base_=window.gmOficinaV2Color_;
window.gmOficinaV2Color_=function(v){gmOficinaV2Color550Base_(v);gmOficinaV2Preview550_();};
const gmOficinaV2BrushSize550Base_=window.gmOficinaV2BrushSize_;
window.gmOficinaV2BrushSize_=function(v){gmOficinaV2BrushSize550Base_(v);gmOficinaV2Preview550_();};
const gmOficinaV2Opacity550Base_=window.gmOficinaV2Opacity_;
window.gmOficinaV2Opacity_=function(v){gmOficinaV2Opacity550Base_(v);gmOficinaV2Preview550_();};



// ============================================================
// V46.77.0
// Corrige formas vetoriais aparentemente transparentes mesmo com
// opacidade de conteúdo = 1.
// ============================================================

function gmVet551CorOpaca_(cor, fallback='#34537a'){
    let c=String(cor||fallback).trim();
    if(!c || c==='transparent' || c==='none') return fallback;

    // Converte rgba(...,a) em rgb(...), removendo alpha embutido.
    const rgba=c.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i);
    if(rgba){
        const r=Math.max(0,Math.min(255,Number(rgba[1])||0));
        const g=Math.max(0,Math.min(255,Number(rgba[2])||0));
        const b=Math.max(0,Math.min(255,Number(rgba[3])||0));
        return `rgb(${r},${g},${b})`;
    }

    // #RRGGBBAA -> #RRGGBB
    if(/^#[0-9a-f]{8}$/i.test(c)) return c.slice(0,7);
    // #RGBA -> #RGB
    if(/^#[0-9a-f]{4}$/i.test(c)) return '#'+c[1]+c[2]+c[3];

    return c;
}

const gmVet490SvgEl551Base_ = gmVet490SvgEl_;
gmVet490SvgEl_ = function(f, ppm){
    const copia = {...f};

    // Para qualquer forma fechada, a transparência passa a ser controlada
    // exclusivamente por fillOpacity. A própria cor nunca carrega alpha.
    if(copia.tipo !== 'linha'){
        copia.fill = gmVet551CorOpaca_(copia.fill || '#34537a');
        if(copia.fillOpacity === undefined || copia.fillOpacity === null || copia.fillOpacity === ''){
            copia.fillOpacity = (copia.opacity === undefined ? 1 : Number(copia.opacity));
        }
        copia.fillOpacity = Math.max(0,Math.min(1,Number(copia.fillOpacity)));
    }

    copia.stroke = gmVet551CorOpaca_(copia.stroke || '#00d4ff','#00d4ff');
    if(copia.strokeOpacity === undefined || copia.strokeOpacity === null || copia.strokeOpacity === ''){
        copia.strokeOpacity = (copia.opacity === undefined ? 1 : Number(copia.opacity));
    }
    copia.strokeOpacity = Math.max(0,Math.min(1,Number(copia.strokeOpacity)));

    return gmVet490SvgEl551Base_(copia, ppm);
};

const gmVet500SvgShape551Base_ = gmVet500SvgShape_;
gmVet500SvgShape_ = function(f, scale, b){
    const copia = {...f};
    if(copia.tipo !== 'linha'){
        copia.fill = gmVet551CorOpaca_(copia.fill || '#34537a');
        if(copia.fillOpacity === undefined || copia.fillOpacity === null || copia.fillOpacity === ''){
            copia.fillOpacity = (copia.opacity === undefined ? 1 : Number(copia.opacity));
        }
        copia.fillOpacity = Math.max(0,Math.min(1,Number(copia.fillOpacity)));
    }
    copia.stroke = gmVet551CorOpaca_(copia.stroke || '#00d4ff','#00d4ff');
    if(copia.strokeOpacity === undefined || copia.strokeOpacity === null || copia.strokeOpacity === ''){
        copia.strokeOpacity = (copia.opacity === undefined ? 1 : Number(copia.opacity));
    }
    copia.strokeOpacity = Math.max(0,Math.min(1,Number(copia.strokeOpacity)));
    return gmVet500SvgShape551Base_(copia, scale, b);
};

// Também normaliza formas já existentes quando o inspetor altera opacidade/cor.
const gmVet490Prop551Base_ = gmVet490Prop_;
gmVet490Prop_ = function(k,v){
    const f = gmVet490Sel_?.();
    if(f){
        if(k==='fill') v = gmVet551CorOpaca_(v,'#34537a');
        if(k==='stroke') v = gmVet551CorOpaca_(v,'#00d4ff');
        if(k==='fillOpacity' || k==='strokeOpacity'){
            v = Math.max(0,Math.min(1,Number(v)));
        }
    }
    return gmVet490Prop551Base_(k,v);
};
window.gmVet490Prop_ = gmVet490Prop_;



// ============================================================
// V46.77.0 — Oficina: cores digitáveis, borda zero e espessura fina
// ============================================================

function gmCor552Hex_(v, fallback='#000000'){
    let x=String(v??'').trim();
    if(!x) return fallback;
    if(!x.startsWith('#')) x='#'+x;
    if(/^#[0-9a-f]{3}$/i.test(x)) x='#'+x[1]+x[1]+x[2]+x[2]+x[3]+x[3];
    return /^#[0-9a-f]{6}$/i.test(x) ? x.toUpperCase() : fallback;
}
function gmCor552Rgb_(hex){
    const h=gmCor552Hex_(hex,'#000000').slice(1);
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
function gmCor552DeRgb_(r,g,b){
    const c=n=>Math.max(0,Math.min(255,Math.round(Number(n)||0))).toString(16).padStart(2,'0');
    return ('#'+c(r)+c(g)+c(b)).toUpperCase();
}
window.gmVet552CorHex_=function(k,v){
    const f=gmVet490Sel_(); if(!f)return;
    const atual=f[k] || (k==='fill'?'#34537A':'#00D4FF');
    const hex=gmCor552Hex_(v,gmCor552Hex_(atual));
    gmVet490Prop_(k,hex); gmVet490Render_();
};
window.gmVet552CorRgb_=function(k,idx,v){
    const f=gmVet490Sel_(); if(!f)return;
    const atual=f[k] || (k==='fill'?'#34537A':'#00D4FF');
    const rgb=gmCor552Rgb_(atual); rgb[idx]=Math.max(0,Math.min(255,Number(v)||0));
    gmVet490Prop_(k,gmCor552DeRgb_(...rgb)); gmVet490Render_();
};
window.gmVet552NovaHex_=function(k,v){
    const atual=gmVet490_[k] || (k==='fill'?'#34537A':'#00D4FF');
    gmVet490_[k]=gmCor552Hex_(v,gmCor552Hex_(atual));
    gmVet552AtualizarNovaCor_();
};
window.gmVet552NovaRgb_=function(k,idx,v){
    const rgb=gmCor552Rgb_(gmVet490_[k] || (k==='fill'?'#34537A':'#00D4FF'));
    rgb[idx]=Math.max(0,Math.min(255,Number(v)||0));
    gmVet490_[k]=gmCor552DeRgb_(...rgb);
    gmVet552AtualizarNovaCor_();
};
window.gmVet552AtualizarNovaCor_=function(){
    for(const k of ['stroke','fill']){
        const h=gmCor552Hex_(gmVet490_[k],k==='fill'?'#34537A':'#00D4FF');
        const rgb=gmCor552Rgb_(h);
        const cp=document.getElementById('gmVet552New_'+k+'_picker');
        const tx=document.getElementById('gmVet552New_'+k+'_hex');
        if(cp)cp.value=h;if(tx)tx.value=h;
        rgb.forEach((n,i)=>{const el=document.getElementById('gmVet552New_'+k+'_rgb'+i);if(el)el.value=n;});
    }
};

const gmVet490Inspector552Base_=gmVet490Inspector_;
gmVet490Inspector_=function(){
    const box=document.getElementById('gmVet490Inspector'); if(!box)return;
    const f=gmVet490Sel_();
    if(!f){gmVet490Inspector552Base_();return;}
    const op=gmVet530Opacidades_(f);
    const stroke=gmCor552Hex_(f.stroke,'#00D4FF'), fill=gmCor552Hex_(f.fill,'#34537A');
    const sr=gmCor552Rgb_(stroke), fr=gmCor552Rgb_(fill);
    const colorCtl=(k,label,hex,rgb)=>`
      <span style="display:inline-flex;gap:4px;align-items:end;flex-wrap:wrap">
        <label><small>${label}</small><input type="color" value="${hex}" onchange="gmVet552CorHex_('${k}',this.value)" style="width:45px;height:32px;padding:2px"></label>
        <label><small>HEX</small><input type="text" value="${hex}" maxlength="7" onchange="gmVet552CorHex_('${k}',this.value)" style="width:78px"></label>
        <label><small>R</small><input type="number" min="0" max="255" value="${rgb[0]}" onchange="gmVet552CorRgb_('${k}',0,this.value)" style="width:58px"></label>
        <label><small>G</small><input type="number" min="0" max="255" value="${rgb[1]}" onchange="gmVet552CorRgb_('${k}',1,this.value)" style="width:58px"></label>
        <label><small>B</small><input type="number" min="0" max="255" value="${rgb[2]}" onchange="gmVet552CorRgb_('${k}',2,this.value)" style="width:58px"></label>
      </span>`;
    box.innerHTML=`
      <strong style="color:#ffd54a">${escaparHtmlInventario_(f.tipo)}</strong>
      <label><small>X m</small><input type="number" step=".1" value="${Number(f.x||0)}" onchange="gmVet490Prop_('x',this.value)"></label>
      <label><small>Y m</small><input type="number" step=".1" value="${Number(f.y||0)}" onchange="gmVet490Prop_('y',this.value)"></label>
      ${f.tipo==='linha'
        ? `<label><small>X2 m</small><input type="number" step=".1" value="${Number(f.x2||0)}" onchange="gmVet490Prop_('x2',this.value)"></label>
           <label><small>Y2 m</small><input type="number" step=".1" value="${Number(f.y2||0)}" onchange="gmVet490Prop_('y2',this.value)"></label>`
        : `<label><small>Largura m</small><input type="number" min=".1" step=".1" value="${Number(f.w||1)}" onchange="gmVet490Prop_('w',this.value)"></label>
           <label><small>Altura m</small><input type="number" min=".1" step=".1" value="${Number(f.h||1)}" onchange="gmVet490Prop_('h',this.value)"></label>
           <label><small>Rotação°</small><input type="number" step="5" value="${Number(f.rot||0)}" onchange="gmVet490Prop_('rot',this.value)"></label>
           ${f.tipo==='arredondado'?`<label><small>Raio canto (m)</small><input type="number" min=".05" step=".05" value="${Number(f.radius||.25)}" onchange="gmVet490Prop_('radius',this.value)"></label>`:''}`}
      ${colorCtl('stroke','Borda',stroke,sr)}
      ${f.tipo==='linha'?'':colorCtl('fill','Preenchimento',fill,fr)}
      <span class="opacity-group-530">
        <label><small>Transp. borda</small><input type="number" min="0" max="1" step=".05" value="${op.stroke}" onchange="gmVet490Prop_('strokeOpacity',this.value)"></label>
        ${f.tipo==='linha'?'':`<label><small>Transp. conteúdo</small><input type="number" min="0" max="1" step=".05" value="${op.fill}" onchange="gmVet490Prop_('fillOpacity',this.value)"></label>`}
      </span>
      <label><small>Borda px</small><input type="number" min="0" max="20" step="1" value="${Number(f.strokeWidth??3)}" onchange="gmVet490Prop_('strokeWidth',this.value)"></label>
      <button class="btn-small" onclick="gmVet490Duplicar_()">⧉ Duplicar</button>
      <button class="btn-small btn-danger" onclick="gmVet490Excluir_()">🗑 Excluir</button>`;
};

const gmVet490InstalarUI552Base_=gmVet490InstalarUI_;
gmVet490InstalarUI_=function(){
    gmVet490InstalarUI552Base_();
    const panel=document.getElementById('gmVet490Tools'); if(!panel || document.getElementById('gmVet552NewColors'))return;
    const row=panel.querySelector('div'); if(!row)return;
    // Oculta os dois controles antigos, mantendo-os apenas por compatibilidade.
    [...row.querySelectorAll('label')].forEach(l=>{
        const t=(l.textContent||'').trim();
        if(t.startsWith('Borda nova')||t.startsWith('Preenchimento')) l.style.display='none';
    });
    const wrap=document.createElement('div');wrap.id='gmVet552NewColors';
    wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;align-items:end;width:100%;margin-top:5px';
    const make=(k,label)=>{
        const h=gmCor552Hex_(gmVet490_[k],k==='fill'?'#34537A':'#00D4FF'), rgb=gmCor552Rgb_(h);
        return `<span style="display:inline-flex;gap:4px;align-items:end;flex-wrap:wrap;padding:5px;border:1px solid rgba(255,255,255,.10);border-radius:7px">
          <label><small>${label}</small><input id="gmVet552New_${k}_picker" type="color" value="${h}" onchange="gmVet552NovaHex_('${k}',this.value)" style="width:45px;height:32px;padding:2px"></label>
          <label><small>HEX</small><input id="gmVet552New_${k}_hex" type="text" value="${h}" maxlength="7" onchange="gmVet552NovaHex_('${k}',this.value)" style="width:78px"></label>
          ${rgb.map((n,i)=>`<label><small>${'RGB'[i]}</small><input id="gmVet552New_${k}_rgb${i}" type="number" min="0" max="255" value="${n}" onchange="gmVet552NovaRgb_('${k}',${i},this.value)" style="width:58px"></label>`).join('')}
        </span>`;
    };
    wrap.innerHTML=make('stroke','Borda nova')+make('fill','Preenchimento');
    row.appendChild(wrap);
};

// Permite borda realmente zero também na rasterização/exportação.
const gmVet500SvgShape552Base_=gmVet500SvgShape_;
gmVet500SvgShape_=function(f,scale,b){
    const c={...f};
    if(c.strokeWidth===undefined||c.strokeWidth===null||c.strokeWidth==='') c.strokeWidth=3;
    // A versão anterior forçava mínimo 1 na exportação.
    const html=gmVet500SvgShape552Base_(c,scale,b);
    if(Number(c.strokeWidth)===0) return html.replace(/stroke-width="[^"]*"/,'stroke-width="0"');
    return html;
};

// O controle de espessura do pincel passa a aceitar 1 px.
function gmOficina552EspessuraMinima_(){
    const esp=document.getElementById('gmOficinaEsp');
    if(esp){esp.min='1';esp.step='1';}
}
const labRender552Base_=labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.77.0 — Oficina: seleção discreta, objetos opacos, sombras e camadas
// ============================================================

let gmOficinaObjSel553_='';

function gm553ShadowCss_(x){
    const tipo=String(x?.sombraOficina||'nenhuma');
    if(tipo==='nenhuma')return '';
    const dir=String(x?.sombraDirecao||'SE');
    const dist=Math.max(1,Number(x?.sombraDist||4));
    const vec={N:[0,-1],NE:[1,-1],E:[1,0],SE:[1,1],S:[0,1],SO:[-1,1],O:[-1,0],NO:[-1,-1]}[dir]||[1,1];
    const blur=tipo==='suave'?7:tipo==='forte'?3:5;
    const alpha=tipo==='suave'?.30:tipo==='forte'?.62:.45;
    return `drop-shadow(${vec[0]*dist}px ${vec[1]*dist}px ${blur}px rgba(0,0,0,${alpha}))`;
}
function gm553OpacoFilter_(o){
    const opaco=(o?.opacoOficina!==false);
    const sh=gm553ShadowCss_(o);
    return `${opaco?'url(#gmOpaqueAlpha553) ':''}${sh}`.trim();
}
function gm553InstalarFiltro_(){
    if(document.getElementById('gmOpaqueDefs553'))return;
    const holder=document.createElement('div');
    holder.id='gmOpaqueDefs553';
    holder.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    holder.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
      <filter id="gmOpaqueAlpha553" color-interpolation-filters="sRGB">
        <feComponentTransfer>
          <feFuncA type="discrete" tableValues="0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1"/>
        </feComponentTransfer>
      </filter>
    </svg>`;
    document.body.appendChild(holder);
}
gm553InstalarFiltro_();

function gm553ObjSelecionado_(){
    return (gmOficinaEstado_.objetos||[]).find(o=>String(o.id)===String(gmOficinaObjSel553_));
}
function gm553PersistRender_(){
    gmOficinaPersistir_();gmOficinaRender_();
}
window.gm553ObjProp_=function(k,v){
    const o=gm553ObjSelecionado_();if(!o)return;
    if(k==='opacoOficina')o[k]=!!v;
    else if(['sombraDist'].includes(k))o[k]=Number(v);
    else o[k]=String(v);
    gm553PersistRender_();
};
window.gm553ObjCamada_=function(dir){
    const a=gmOficinaEstado_.objetos||[],i=a.findIndex(o=>String(o.id)===String(gmOficinaObjSel553_));
    if(i<0)return;
    const o=a.splice(i,1)[0];
    if(dir==='frente')a.push(o);else a.unshift(o);
    gm553PersistRender_();
};
window.gm553ObjExcluir_=function(){
    const o=gm553ObjSelecionado_();if(!o)return;
    if(!confirm(`Remover “${o.nome||'objeto'}” da Oficina?`))return;
    gmOficinaEstado_.objetos=(gmOficinaEstado_.objetos||[]).filter(x=>String(x.id)!==String(o.id));
    gmOficinaObjSel553_='';gm553PersistRender_();
};
window.gm553AlternarPlano_=function(v){
    gmOficinaEstado_.objetosAcimaFormas=!!v;
    gm553PersistRender_();
};

function gm553ObjInspector_(){
    let box=document.getElementById('gmObjInspector553');
    const tools=document.getElementById('gmVet490Tools');
    if(!tools)return;
    if(!box){
        box=document.createElement('div');box.id='gmObjInspector553';
        box.style.cssText='margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.10)';
        tools.appendChild(box);
    }
    const o=gm553ObjSelecionado_();
    if(!o){box.innerHTML='<span style="color:#9fb4c8">Clique num objeto da Oficina para editar sua aparência e camada.</span>';return;}
    box.innerHTML=`
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:end">
        <strong style="color:#cfeeff">🧱 ${escaparHtmlInventario_(o.nome||'Objeto')}</strong>
        <label><small>Pixels visíveis opacos</small><input type="checkbox" ${o.opacoOficina!==false?'checked':''} onchange="gm553ObjProp_('opacoOficina',this.checked)"></label>
        <label><small>Sombra</small><select onchange="gm553ObjProp_('sombraOficina',this.value)">
          ${['nenhuma','suave','media','forte'].map(v=>`<option value="${v}" ${String(o.sombraOficina||'nenhuma')===v?'selected':''}>${v==='media'?'média':v}</option>`).join('')}
        </select></label>
        <label><small>Direção</small><select onchange="gm553ObjProp_('sombraDirecao',this.value)">
          ${['N','NE','E','SE','S','SO','O','NO'].map(v=>`<option ${String(o.sombraDirecao||'SE')===v?'selected':''}>${v}</option>`).join('')}
        </select></label>
        <label><small>Distância px</small><input type="number" min="1" max="30" step="1" value="${Number(o.sombraDist||4)}" onchange="gm553ObjProp_('sombraDist',this.value)" style="width:72px"></label>
        <button class="btn-small" onclick="gm553ObjCamada_('frente')">⬆ Frente</button>
        <button class="btn-small" onclick="gm553ObjCamada_('tras')">⬇ Trás</button>
        <button class="btn-small btn-danger" onclick="gm553ObjExcluir_()">🗑 Excluir</button>
      </div>`;
}

// Renderiza objetos com opacidade real, sombra opcional, ordem e seleção discreta.
gmOficinaV2RenderObjetos_=function(){
    const layer=document.getElementById('gmOficinaV2Objects');if(!layer)return;
    const ppm=gmOficinaV2Ppm_();
    layer.innerHTML=(gmOficinaEstado_.objetos||[]).map((o,i)=>{
        const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(o.modeloId)),img=o.imagem||m?.imagem||'';
        const w=Math.max(18,Number(o.larguraM||1)*ppm),h=Math.max(18,Number(o.alturaM||1)*ppm);
        const sel=String(o.id)===String(gmOficinaObjSel553_);
        const filtro=gm553OpacoFilter_(o);
        return `<div class="${sel?'gm-oficina-object-selected-553':''}" data-of2="${escaparHtmlInventario_(o.id)}"
          onpointerdown="gmOficinaV2ArrastarObjeto_(event,'${String(o.id).replace(/'/g,"\\'")}')"
          style="position:absolute;left:${o.x*ppm-w/2}px;top:${o.y*ppm-h/2}px;width:${w}px;height:${h}px;z-index:${8+i};cursor:${gmOficinaV2Cfg_.ativo?'default':'grab'};touch-action:none;pointer-events:auto;transform:rotate(${Number(o.angulo||0)}deg);transform-origin:center">
          ${img?`<img src="${img}" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none;opacity:1;filter:${filtro||'none'}">`:'🧱'}
        </div>`;
    }).join('');
    gm553ObjInspector_();
};

const gmOficinaV2ArrastarObjeto553Base_=window.gmOficinaV2ArrastarObjeto_;
window.gmOficinaV2ArrastarObjeto_=function(ev,id){
    gmOficinaObjSel553_=String(id);
    gmVet490_.selectedId='';
    gm553ObjInspector_();
    return gmOficinaV2ArrastarObjeto553Base_(ev,id);
};

// Seleção de forma cancela seleção de objeto.
const gmVet490PointerForma553Base_=window.gmVet490PointerForma_;
window.gmVet490PointerForma_=function(ev,id){
    gmOficinaObjSel553_='';
    const r=gmVet490PointerForma553Base_(ev,id);
    gm553ObjInspector_();
    return r;
};

// Camadas das formas.
window.gm553FormaCamada_=function(dir){
    const a=gmVet490Formas_(),i=a.findIndex(f=>String(f.id)===String(gmVet490_.selectedId));
    if(i<0)return;
    gmVet490Hist_();const f=a.splice(i,1)[0];
    if(dir==='frente')a.push(f);else a.unshift(f);
    gmOficinaPersistir_();gmVet490Render_();
};
window.gm553FormaShadow_=function(k,v){
    const f=gmVet490Sel_();if(!f)return;
    gmVet490Hist_();
    if(k==='sombraDist')f[k]=Number(v);else f[k]=String(v);
    gmOficinaPersistir_();gmVet490Render_();
};

const gmVet490SvgEl553Base_=gmVet490SvgEl_;
gmVet490SvgEl_=function(f,ppm){
    let h=gmVet490SvgEl553Base_(f,ppm);
    const sh=gm553ShadowCss_(f);
    if(sh){
        h=h.replace(/\/>$/,` style="filter:${sh}"/>`);
    }
    return h;
};

const gmVet490Inspector553Base_=gmVet490Inspector_;
gmVet490Inspector_=function(){
    gmVet490Inspector553Base_();
    const box=document.getElementById('gmVet490Inspector'),f=gmVet490Sel_();
    if(!box||!f)return;
    box.insertAdjacentHTML('beforeend',`
      <span style="display:inline-flex;gap:5px;align-items:end;flex-wrap:wrap;margin-left:5px">
        <label><small>Sombra</small><select onchange="gm553FormaShadow_('sombraOficina',this.value)">
          ${['nenhuma','suave','media','forte'].map(v=>`<option value="${v}" ${String(f.sombraOficina||'nenhuma')===v?'selected':''}>${v==='media'?'média':v}</option>`).join('')}
        </select></label>
        <label><small>Direção</small><select onchange="gm553FormaShadow_('sombraDirecao',this.value)">
          ${['N','NE','E','SE','S','SO','O','NO'].map(v=>`<option ${String(f.sombraDirecao||'SE')===v?'selected':''}>${v}</option>`).join('')}
        </select></label>
        <label><small>Distância px</small><input type="number" min="1" max="30" step="1" value="${Number(f.sombraDist||4)}" onchange="gm553FormaShadow_('sombraDist',this.value)" style="width:72px"></label>
        <button class="btn-small" onclick="gm553FormaCamada_('frente')">⬆ Frente</button>
        <button class="btn-small" onclick="gm553FormaCamada_('tras')">⬇ Trás</button>
      </span>`);
};

function gm553AplicarPlano_(){
    const svg=document.getElementById('gmOficinaVectorLayer'),objs=document.getElementById('gmOficinaV2Objects');
    const acima=gmOficinaEstado_.objetosAcimaFormas!==false;
    if(svg)svg.style.zIndex=acima?'7':'9';
    if(objs)objs.style.zIndex=acima?'8':'6';
}
function gm553InstalarPlanoUI_(){
    const tools=document.getElementById('gmVet490Tools');
    if(!tools||document.getElementById('gm553Plano'))return;
    const d=document.createElement('label');d.id='gm553Plano';
    d.style.cssText='display:inline-flex;align-items:center;gap:6px;margin:8px 0 0;color:#cfe0ee';
    d.innerHTML=`<input type="checkbox" ${gmOficinaEstado_.objetosAcimaFormas!==false?'checked':''} onchange="gm553AlternarPlano_(this.checked)"> Objetos acima das formas`;
    tools.appendChild(d);
}

// CSS: remove completamente o brilho amarelo herdado; usa contorno discreto.
if(!document.getElementById('gm553Css')){
    const st=document.createElement('style');st.id='gm553Css';
    st.textContent=`
      #gmOficinaV2Map .gm-vector-selected{
        filter:none!important;
        stroke-dasharray:6 4;
      }
      #gmOficinaV2Map .gm-oficina-object-selected-553{
        outline:1px dashed rgba(235,245,255,.92)!important;
        outline-offset:3px!important;
        box-shadow:none!important;
        filter:none!important;
      }
      #gmOficinaV2Map .gm-oficina-object-selected-553::after{
        content:"";
        position:absolute;inset:-4px;
        border:1px solid rgba(90,180,220,.42);
        pointer-events:none;
      }`;
    document.head.appendChild(st);
}

const gmOficinaRender553Base_=window.gmOficinaRender_;
window.gmOficinaRender_=function(){
    const r=gmOficinaRender553Base_();
    try{
        gm553InstalarFiltro_();
        gm553InstalarPlanoUI_();
        gm553AplicarPlano_();
        gm553ObjInspector_();
    }catch(e){console.warn('Oficina 553',e);}
    return r;
};

// Publicado na Mesa: respeita "pixels opacos" e sombra do objeto.
const labObjetoHtml553Base_=labObjetoHtml_;
labObjetoHtml_=function(o,ppm){
    let h=labObjetoHtml553Base_(o,ppm);
    if(o?.opacoOficina!==false || o?.sombraOficina){
        const filtro=gm553OpacoFilter_(o);
        h=h.replace(/<img([^>]*?)style="([^"]*)"/, (m,a,style)=>{
            const clean=style.replace(/filter:[^;"]*;?/g,'');
            return `<img${a}style="${clean};filter:${filtro||'none'}"`;
        });
    }
    return h;
};
window.labObjetoHtml_=labObjetoHtml_;



// ============================================================
// V46.77.0 — Oficina: escala px/m como zoom uniforme verdadeiro
// ============================================================

function gm554Zoom_(){
    return gmOficinaV2Ppm_()/32;
}
function gm554Px_(v,min=0){
    return Math.max(min,Number(v||0)*gm554Zoom_());
}

// 1) Desenho raster: espessura dos pincéis acompanha a escala.
// Reimplementa o renderer da Oficina usando tamanho visual normalizado.
gmOficinaV2DesenharCanvas_=function(){
    const cv=document.getElementById('gmOficinaV2Canvas');if(!cv)return;
    const ppm=gmOficinaV2Ppm_(),z=gm554Zoom_();
    const w=Math.round(gmOficinaEstado_.larguraM*ppm),h=Math.round(gmOficinaEstado_.alturaM*ppm);
    if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';

    for(const st of (gmOficinaEstado_.desenhos||[])){
        const pts=Array.isArray(st.pts)?st.pts:[];if(!pts.length)continue;
        const tool=st.tool||st.ferramenta||'traco';
        // O valor salvo continua sendo o mesmo; só a representação em tela escala.
        const size=Math.max(.5,Number(st.size||st.esp||7)*z);
        const color=st.color||st.cor||'#ffcf4d';
        const opacity=Math.max(.02,Math.min(1,Number(st.opacity??st.opacidade??1)));
        const brush=st.brush||st.pincel||'redondo';
        const texture=st.texture||st.textura||'solida';

        ctx.save();
        if(tool==='borracha'){
            ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.strokeStyle='#000';ctx.lineWidth=size;
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);
            for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);
            if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);
            ctx.stroke();ctx.restore();continue;
        }

        ctx.globalAlpha=opacity;ctx.strokeStyle=color;ctx.fillStyle=color;
        if(texture!=='solida'){
            labDesenhoAplicarTextura_(ctx,texture,pts,0,size,color,ppm,brush);
        }else if(brush==='spray'){
            for(let j=0;j<pts.length;j++){
                const p=pts[j],dots=Math.max(5,Math.round(size*.85));
                for(let k=0;k<dots;k++){
                    const a=labDesenhoRand_(j*97+k*13)*Math.PI*2;
                    const rr0=Math.sqrt(labDesenhoRand_(j*193+k*29))*size*.82;
                    const rr=Math.max(.45,size*(.05+.07*labDesenhoRand_(j*71+k*41)));
                    ctx.beginPath();ctx.arc(p.x*ppm+Math.cos(a)*rr0,p.y*ppm+Math.sin(a)*rr0,rr,0,Math.PI*2);ctx.fill();
                }
            }
        }else if(brush==='quadrado'){
            for(const p of pts)ctx.fillRect(p.x*ppm-size/2,p.y*ppm-size/2,size,size);
        }else if(brush==='irregular'){
            ctx.lineWidth=size;ctx.beginPath();
            pts.forEach((p,j)=>{
                const wob=size*.7;
                const x=p.x*ppm+(labDesenhoRand_(j*151+3)-.5)*wob;
                const y=p.y*ppm+(labDesenhoRand_(j*211+9)-.5)*wob;
                j?ctx.lineTo(x,y):ctx.moveTo(x,y);
            });
            ctx.stroke();
        }else{
            ctx.lineWidth=brush==='caligrafico'?Math.max(.5,size*.42):size;
            ctx.lineCap=brush==='caligrafico'?'butt':'round';
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);
            for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);
            if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);
            ctx.stroke();
        }
        ctx.restore();
    }
};

// 2) Formas vetoriais: borda em px também escala junto com o desenho.
const gmVet490SvgEl554Base_=gmVet490SvgEl_;
gmVet490SvgEl_=function(f,ppm){
    const copia={...f};
    const original=Number(copia.strokeWidth??3);
    copia.strokeWidth=original*gm554Zoom_();
    return gmVet490SvgEl554Base_(copia,ppm);
};

// 3) Objetos: remove o mínimo fixo de 18 px, que alterava a proporção
// de objetos pequenos ao trocar a escala.
const gmOficinaV2RenderObjetos554Base_=gmOficinaV2RenderObjetos_;
gmOficinaV2RenderObjetos_=function(){
    const layer=document.getElementById('gmOficinaV2Objects');if(!layer)return;
    const ppm=gmOficinaV2Ppm_(),z=gm554Zoom_();
    layer.innerHTML=(gmOficinaEstado_.objetos||[]).map((o,i)=>{
        const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(o.modeloId)),img=o.imagem||m?.imagem||'';
        const w=Math.max(2*z,Number(o.larguraM||1)*ppm),h=Math.max(2*z,Number(o.alturaM||1)*ppm);
        const sel=String(o.id)===String(gmOficinaObjSel553_);
        // Sombra acompanha o zoom, sem mudar o valor salvo.
        const sombraOriginal=o.sombraDist;
        const copia={...o,sombraDist:Number(o.sombraDist||4)*z};
        const filtro=gm553OpacoFilter_(copia);
        return `<div class="${sel?'gm-oficina-object-selected-553':''}" data-of2="${escaparHtmlInventario_(o.id)}"
          onpointerdown="gmOficinaV2ArrastarObjeto_(event,'${String(o.id).replace(/'/g,"\\'")}')"
          style="position:absolute;left:${o.x*ppm-w/2}px;top:${o.y*ppm-h/2}px;width:${w}px;height:${h}px;z-index:${8+i};cursor:${gmOficinaV2Cfg_.ativo?'default':'grab'};touch-action:none;pointer-events:auto;transform:rotate(${Number(o.angulo||0)}deg);transform-origin:center">
          ${img?`<img src="${img}" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none;opacity:1;filter:${filtro||'none'}">`:'🧱'}
        </div>`;
    }).join('');
    gm553ObjInspector_();
};

// 4) A seleção discreta acompanha o zoom, para não parecer maior/menor
// em relação à composição.
function gm554AtualizarSelecaoCss_(){
    const z=gm554Zoom_();
    let st=document.getElementById('gm554ScaleCss');
    if(!st){st=document.createElement('style');st.id='gm554ScaleCss';document.head.appendChild(st);}
    st.textContent=`
      #gmOficinaV2Map .gm-oficina-object-selected-553{
        outline-width:${Math.max(.6,z)}px!important;
        outline-offset:${Math.max(2,3*z)}px!important;
      }
    `;
}

// 5) Trocar px/m preserva o ponto da Oficina que está no centro da viewport.
// Assim a composição apenas cresce/encolhe, sem "pular" visualmente.
window.gmOficinaV2Escala_=function(v){
    const map=document.getElementById('gmOficinaV2Map');
    const scroller=map?.parentElement;
    const oldPpm=gmOficinaV2Ppm_();
    let centroM=null;
    if(map&&scroller){
        centroM={
            x:(scroller.scrollLeft+scroller.clientWidth/2)/oldPpm,
            y:(scroller.scrollTop+scroller.clientHeight/2)/oldPpm
        };
    }
    gmOficinaEstado_.escalaPxM=Math.max(18,Math.min(72,Number(v)||32));
    gmOficinaPersistir_();gmOficinaRender_();
    gm554AtualizarSelecaoCss_();

    if(centroM&&scroller){
        const novo=gmOficinaV2Ppm_();
        requestAnimationFrame(()=>{
            scroller.scrollLeft=Math.max(0,centroM.x*novo-scroller.clientWidth/2);
            scroller.scrollTop=Math.max(0,centroM.y*novo-scroller.clientHeight/2);
        });
    }
};

const gmOficinaRender554Base_=window.gmOficinaRender_;
window.gmOficinaRender_=function(){
    const r=gmOficinaRender554Base_();
    try{
        gmVet490Render_();
        gm554AtualizarSelecaoCss_();
    }catch(e){console.warn('Oficina escala 554',e);}
    return r;
};



// ============================================================
// V46.77.0 — Oficina simplificada
// - 10x10 e 50x40
// - HEX no desenho
// - Hexágono, Estrela e U
// - rotação simples
// - linha por comprimento/ângulo
// - raio de canto funcional e intuitivo
// - ferramentas trocam de modo automaticamente
// - giz recupera textura estável ao mudar px/m
// ============================================================

function gm555Hex_(v,fb='#FFCF4D'){
    let x=String(v||'').trim();
    if(!x)return fb;
    if(!x.startsWith('#'))x='#'+x;
    if(/^#[0-9a-f]{3}$/i.test(x))x='#'+x[1]+x[1]+x[2]+x[2]+x[3]+x[3];
    return /^#[0-9a-f]{6}$/i.test(x)?x.toUpperCase():fb;
}
window.gm555DrawHex_=function(v){
    const raw=String(v||'').trim();
    if(!/^#?[0-9a-fA-F]{6}$/.test(raw))return;
    gmOficinaV2Cfg_.cor=gm555Hex_(raw,gmOficinaV2Cfg_.cor||'#FFCF4D');
    gmOficinaV2SyncUI_();
    try{gmOficinaV2Preview550_();}catch(_){}
};

const gmOficinaV2SyncUI555Base_=gmOficinaV2SyncUI_;
gmOficinaV2SyncUI_=function(){
    gmOficinaV2SyncUI555Base_();
    const h=document.getElementById('gmOficinaV2HexInput555');
    if(h && document.activeElement!==h)h.value=gm555Hex_(gmOficinaV2Cfg_.cor||'#FFCF4D');
};

// ---------------- Giz: mantém a aparência ao alterar o zoom ----------------
function gm555Giz_(ctx,pts,sizeVisual,color,ppm,sizeBase){
    if(!pts?.length)return;
    const base=Math.max(2,Number(sizeBase||7));
    const z=Math.max(.1,sizeVisual/base);
    ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineCap='round';ctx.lineJoin='round';

    // Corpo seco contínuo.
    ctx.save();ctx.globalAlpha*=.25;ctx.lineWidth=sizeVisual*.72;
    ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x*ppm,pts[i].y*ppm);
    ctx.stroke();ctx.restore();

    // Fibras no sentido do traço; a densidade depende do pincel salvo, não do zoom.
    const fibras=Math.max(5,Math.min(14,Math.round(base*.58)));
    for(let k=0;k<fibras;k++){
        const off=((k/(Math.max(1,fibras-1)))-.5)*base*.72*z;
        ctx.save();
        ctx.globalAlpha*=.18+.25*labDesenhoRand_(k*31+7);
        ctx.lineWidth=Math.max(.35*z,base*.025*z);
        ctx.beginPath();let aberto=false;
        for(let i=1;i<pts.length;i++){
            if(labDesenhoRand_(i*83+k*47)<.09){aberto=false;continue;}
            const p=pts[i],q=pts[i-1];
            const dx=(p.x-q.x)*ppm,dy=(p.y-q.y)*ppm,L=Math.hypot(dx,dy)||1;
            const nx=-dy/L,ny=dx/L;
            const jitter=(labDesenhoRand_(i*61+k*19)-.5)*base*.07*z;
            const x=p.x*ppm+nx*(off+jitter),y=p.y*ppm+ny*(off+jitter);
            if(!aberto){ctx.moveTo(x,y);aberto=true;}else ctx.lineTo(x,y);
        }
        ctx.stroke();ctx.restore();
    }

    // Pouco pó lateral, para não virar spray.
    for(let i=0;i<pts.length;i+=8){
        const p=pts[i];
        const n=Math.max(1,Math.min(3,Math.round(base*.1)));
        for(let k=0;k<n;k++){
            const a=labDesenhoRand_(i*17+k*29)*Math.PI*2;
            const rr=base*(.28+.14*labDesenhoRand_(i*43+k*11))*z;
            ctx.save();ctx.globalAlpha*=.08+.12*labDesenhoRand_(i*37+k*13);
            ctx.beginPath();ctx.arc(p.x*ppm+Math.cos(a)*rr,p.y*ppm+Math.sin(a)*rr,Math.max(.3*z,base*.018*z),0,Math.PI*2);ctx.fill();ctx.restore();
        }
    }
    ctx.restore();
}

gmOficinaV2DesenharCanvas_=function(){
    const cv=document.getElementById('gmOficinaV2Canvas');if(!cv)return;
    const ppm=gmOficinaV2Ppm_(),z=gm554Zoom_();
    const w=Math.round(gmOficinaEstado_.larguraM*ppm),h=Math.round(gmOficinaEstado_.alturaM*ppm);
    if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';

    for(const st of (gmOficinaEstado_.desenhos||[])){
        const pts=Array.isArray(st.pts)?st.pts:[];if(!pts.length)continue;
        const tool=st.tool||st.ferramenta||'traco';
        const sizeBase=Math.max(.5,Number(st.size||st.esp||7)),size=sizeBase*z;
        const color=st.color||st.cor||'#ffcf4d';
        const opacity=Math.max(.02,Math.min(1,Number(st.opacity??st.opacidade??1)));
        const brush=st.brush||st.pincel||'redondo';
        const texture=st.texture||st.textura||'solida';

        ctx.save();
        if(tool==='borracha'){
            ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.strokeStyle='#000';ctx.lineWidth=size;
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);
            for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);
            if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);
            ctx.stroke();ctx.restore();continue;
        }
        ctx.globalAlpha=opacity;ctx.strokeStyle=color;ctx.fillStyle=color;
        if(texture==='giz'){
            gm555Giz_(ctx,pts,size,color,ppm,sizeBase);
        }else if(texture!=='solida'){
            labDesenhoAplicarTextura_(ctx,texture,pts,0,size,color,ppm,brush);
        }else if(brush==='spray'){
            for(let j=0;j<pts.length;j++){
                const p=pts[j],dots=Math.max(5,Math.round(sizeBase*.85));
                for(let k=0;k<dots;k++){
                    const a=labDesenhoRand_(j*97+k*13)*Math.PI*2;
                    const rr0=Math.sqrt(labDesenhoRand_(j*193+k*29))*size*.82;
                    const rr=Math.max(.45*z,sizeBase*(.05+.07*labDesenhoRand_(j*71+k*41))*z);
                    ctx.beginPath();ctx.arc(p.x*ppm+Math.cos(a)*rr0,p.y*ppm+Math.sin(a)*rr0,rr,0,Math.PI*2);ctx.fill();
                }
            }
        }else if(brush==='quadrado'){
            for(const p of pts)ctx.fillRect(p.x*ppm-size/2,p.y*ppm-size/2,size,size);
        }else if(brush==='irregular'){
            ctx.lineWidth=size;ctx.beginPath();
            pts.forEach((p,j)=>{
                const wob=sizeBase*.7*z;
                const x=p.x*ppm+(labDesenhoRand_(j*151+3)-.5)*wob;
                const y=p.y*ppm+(labDesenhoRand_(j*211+9)-.5)*wob;
                j?ctx.lineTo(x,y):ctx.moveTo(x,y);
            });ctx.stroke();
        }else{
            ctx.lineWidth=brush==='caligrafico'?Math.max(.5*z,size*.42):size;
            ctx.lineCap=brush==='caligrafico'?'butt':'round';
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);
            for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);
            if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);
            ctx.stroke();
        }
        ctx.restore();
    }
};

// ---------------- Formas adicionais ----------------
function gm555PolyHex_(x,y,w,h){
    return [[.25,0],[.75,0],[1,.5],[.75,1],[.25,1],[0,.5]].map(p=>`${x+p[0]*w},${y+p[1]*h}`).join(' ');
}
function gm555PolyStar_(x,y,w,h){
    const cx=x+w/2,cy=y+h/2,rx=Math.abs(w)/2,ry=Math.abs(h)/2,a=[];
    for(let i=0;i<10;i++){
        const ang=-Math.PI/2+i*Math.PI/5,r=i%2===0?1:.43;
        a.push(`${cx+Math.cos(ang)*rx*r},${cy+Math.sin(ang)*ry*r}`);
    }
    return a.join(' ');
}
function gm555PolyU_(x,y,w,h){
    const t=Math.max(1,Math.min(Math.abs(w),Math.abs(h))*.23);
    return `${x},${y} ${x+t},${y} ${x+t},${y+h-t} ${x+w-t},${y+h-t} ${x+w-t},${y} ${x+w},${y} ${x+w},${y+h} ${x},${y+h}`;
}

const gmVet490SvgEl555Base_=gmVet490SvgEl_;
gmVet490SvgEl_=function(f,ppm){
    if(f.tipo==='arredondado'){
        const c={...f};
        // Corrige bug antigo: Math.max forçava sempre um semicírculo.
        const id=String(c.id).replace(/'/g,"\\'");
        const stroke=c.stroke||'#00d4ff',fill=c.fill||'transparent',op=gmVet530Opacidades_(c);
        const sw=Number(c.strokeWidth??3)*gm554Zoom_();
        const x=Number(c.x||0)*ppm,y=Number(c.y||0)*ppm,w=Number(c.w||0)*ppm,h=Number(c.h||0)*ppm;
        const cx=x+w/2,cy=y+h/2;
        const rx=Math.max(0,Math.min(Number(c.radius??.25)*ppm,Math.abs(w)/2,Math.abs(h)/2));
        const sh=gm553ShadowCss_(c);
        return `<rect x="${x}" y="${y}" width="${Math.abs(w)}" height="${Math.abs(h)}" rx="${rx}" ry="${rx}" stroke="${stroke}" stroke-opacity="${op.stroke}" stroke-width="${sw}" fill="${fill}" fill-opacity="${op.fill}" transform="rotate(${Number(c.rot||0)} ${cx} ${cy})" data-vet-id="${escaparHtmlInventario_(c.id)}" class="${String(c.id)===String(gmVet490_.selectedId)?'gm-vector-selected':''}" onpointerdown="gmVet490PointerForma_(event,'${id}')" ${sh?`style="filter:${sh}"`:''}/>`;
    }
    if(!['hexagono','estrela','u'].includes(String(f.tipo)))return gmVet490SvgEl555Base_(f,ppm);
    const id=String(f.id).replace(/'/g,"\\'"),op=gmVet530Opacidades_(f);
    const stroke=f.stroke||'#00d4ff',fill=f.fill||'transparent',sw=Number(f.strokeWidth??3)*gm554Zoom_();
    const x=Number(f.x||0)*ppm,y=Number(f.y||0)*ppm,w=Number(f.w||0)*ppm,h=Number(f.h||0)*ppm,cx=x+w/2,cy=y+h/2;
    const pts=f.tipo==='hexagono'?gm555PolyHex_(x,y,w,h):f.tipo==='estrela'?gm555PolyStar_(x,y,w,h):gm555PolyU_(x,y,w,h);
    const sh=gm553ShadowCss_(f);
    return `<polygon points="${pts}" stroke="${stroke}" stroke-opacity="${op.stroke}" stroke-width="${sw}" fill="${fill}" fill-opacity="${op.fill}" transform="rotate(${Number(f.rot||0)} ${cx} ${cy})" data-vet-id="${escaparHtmlInventario_(f.id)}" class="${String(f.id)===String(gmVet490_.selectedId)?'gm-vector-selected':''}" onpointerdown="gmVet490PointerForma_(event,'${id}')" ${sh?`style="filter:${sh}"`:''}/>`;
};

const gmVet500SvgShape555Base_=gmVet500SvgShape_;
gmVet500SvgShape_=function(f,scale,b){
    if(f.tipo==='arredondado'){
        const op=gmVet530Opacidades_(f),stroke=f.stroke||'#00d4ff',fill=f.fill||'transparent';
        const x=(Number(f.x||0)-b.minX)*scale,y=(Number(f.y||0)-b.minY)*scale,w=Number(f.w||0)*scale,h=Number(f.h||0)*scale;
        const cx=x+w/2,cy=y+h/2,rx=Math.max(0,Math.min(Number(f.radius??.25)*scale,Math.abs(w)/2,Math.abs(h)/2));
        return `<rect x="${x}" y="${y}" width="${Math.abs(w)}" height="${Math.abs(h)}" rx="${rx}" ry="${rx}" stroke="${stroke}" stroke-opacity="${op.stroke}" stroke-width="${Math.max(0,Number(f.strokeWidth??3))}" fill="${fill}" fill-opacity="${op.fill}" transform="rotate(${Number(f.rot||0)} ${cx} ${cy})"/>`;
    }
    if(!['hexagono','estrela','u'].includes(String(f.tipo)))return gmVet500SvgShape555Base_(f,scale,b);
    const op=gmVet530Opacidades_(f),stroke=f.stroke||'#00d4ff',fill=f.fill||'transparent';
    const x=(Number(f.x||0)-b.minX)*scale,y=(Number(f.y||0)-b.minY)*scale,w=Number(f.w||0)*scale,h=Number(f.h||0)*scale,cx=x+w/2,cy=y+h/2;
    const pts=f.tipo==='hexagono'?gm555PolyHex_(x,y,w,h):f.tipo==='estrela'?gm555PolyStar_(x,y,w,h):gm555PolyU_(x,y,w,h);
    return `<polygon points="${pts}" stroke="${stroke}" stroke-opacity="${op.stroke}" stroke-width="${Math.max(0,Number(f.strokeWidth??3))}" fill="${fill}" fill-opacity="${op.fill}" transform="rotate(${Number(f.rot||0)} ${cx} ${cy})"/>`;
};

// ---------------- Modo automático: sem ficar desligando "Desenhar" ----------------
function gm555ModoForma_(){
    gmOficinaV2Cfg_.ativo=false;
    gmOficinaV2Stroke_=null;
    gmVetSelectAtivo501_=true;
    const cb=document.querySelector('#gmVetSelectToggle501 input');if(cb)cb.checked=true;
    try{gmOficinaV2SyncUI_();gmVet501AtualizarCamadas_();}catch(_){}
}
const gmVet490Tool555Base_=gmVet490Tool_;
gmVet490Tool_=function(tool){
    gm555ModoForma_();
    const r=gmVet490Tool555Base_(tool);
    try{gmOficinaV2SyncUI_();gmVet501AtualizarCamadas_();}catch(_){}
    return r;
};
window.gmVet490Tool_=gmVet490Tool_;

// Ao terminar de desenhar uma forma, volta automaticamente para selecionar.
// As novas formas usam o mesmo fluxo.
const gmVet490PointerCanvas555Base_=gmVet490PointerCanvas_;
gmVet490PointerCanvas_=function(ev){
    if(!['hexagono','estrela','u'].includes(String(gmVet490_.tool)))return gmVet490PointerCanvas555Base_(ev);
    ev.preventDefault();ev.stopPropagation();gmVet490Hist_();
    const svg=ev.currentTarget,r=svg.getBoundingClientRect(),ppm=gmVet490Ppm_();
    const pt=e=>({x:gmVet490Clamp_((e.clientX-r.left)/ppm,0,gmOficinaEstado_.larguraM),y:gmVet490Clamp_((e.clientY-r.top)/ppm,0,gmOficinaEstado_.alturaM)});
    const p0=pt(ev),id=`vet:${Date.now()}:${Math.random().toString(36).slice(2,5)}`;
    const f={id,tipo:gmVet490_.tool,x:p0.x,y:p0.y,w:.1,h:.1,rot:0,stroke:gmVet490_.stroke,fill:gmVet490_.fill,opacity:gmVet490_.opacity,strokeWidth:gmVet490_.strokeWidth,strokeOpacity:1,fillOpacity:1};
    gmVet490Formas_().push(f);gmVet490Criando_=f;gmVet490_.selectedId=id;
    const move=e=>{const p=pt(e);f.w=p.x-f.x;f.h=p.y-f.y;gmVet490Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmVet490Criando_=null;gmOficinaPersistir_();gmVet490_.tool='select';gmVet490Render_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};

// Clicar numa forma seleciona e move; não exige botão "Selecionar" antes.
const gmVet490PointerForma555Base_=gmVet490PointerForma_;
gmVet490PointerForma_=function(ev,id){
    if(gmVet490_.tool!=='select')gmVet490_.tool='select';
    gm555ModoForma_();
    return gmVet490PointerForma555Base_(ev,id);
};
window.gmVet490PointerForma_=gmVet490PointerForma_;

// ---------------- Linhas por comprimento e ângulo ----------------
function gm555Linha_(f){
    const x1=Number(f.x||0),y1=Number(f.y||0),x2=Number(f.x2??x1),y2=Number(f.y2??y1),dx=x2-x1,dy=y2-y1;
    return {cx:(x1+x2)/2,cy:(y1+y2)/2,len:Math.max(.01,Math.hypot(dx,dy)),ang:Math.atan2(dy,dx)*180/Math.PI};
}
window.gm555LinhaLen_=function(v){
    const f=gmVet490Sel_();if(!f||f.tipo!=='linha')return;
    gmVet490Hist_();const d=gm555Linha_(f),L=Math.max(.05,Number(v)||.05),a=d.ang*Math.PI/180,hx=Math.cos(a)*L/2,hy=Math.sin(a)*L/2;
    f.x=d.cx-hx;f.y=d.cy-hy;f.x2=d.cx+hx;f.y2=d.cy+hy;gmOficinaPersistir_();gmVet490Render_();
};
window.gm555LinhaAng_=function(v){
    const f=gmVet490Sel_();if(!f||f.tipo!=='linha')return;
    gmVet490Hist_();const d=gm555Linha_(f),a=(Number(v)||0)*Math.PI/180,hx=Math.cos(a)*d.len/2,hy=Math.sin(a)*d.len/2;
    f.x=d.cx-hx;f.y=d.cy-hy;f.x2=d.cx+hx;f.y2=d.cy+hy;gmOficinaPersistir_();gmVet490Render_();
};
window.gm555Girar_=function(delta){
    const f=gmVet490Sel_();if(!f)return;
    if(f.tipo==='linha')return gm555LinhaAng_(gm555Linha_(f).ang+Number(delta||0));
    gmVet490Prop_('rot',(Number(f.rot||0)+Number(delta||0)+360)%360);
};

// ---------------- Inspector simplificado, sem X/Y ----------------
gmVet490Inspector_=function(){
    const box=document.getElementById('gmVet490Inspector');if(!box)return;
    const f=gmVet490Sel_();
    if(!f){box.innerHTML='<span style="color:#9fb4c8">Clique diretamente numa forma para editar. Arraste a própria forma para movê-la.</span>';return;}
    const op=gmVet530Opacidades_(f);
    const stroke=gmCor552Hex_(f.stroke,'#00D4FF'),fill=gmCor552Hex_(f.fill,'#34537A'),sr=gmCor552Rgb_(stroke),fr=gmCor552Rgb_(fill);
    const cor=(k,label,h,rgb)=>`<span style="display:inline-flex;gap:4px;align-items:end;flex-wrap:wrap">
      <label><small>${label}</small><input type="color" value="${h}" onchange="gmVet552CorHex_('${k}',this.value)" style="width:44px;height:32px;padding:2px"></label>
      <label><small>HEX</small><input type="text" value="${h}" maxlength="7" onchange="gmVet552CorHex_('${k}',this.value)" style="width:78px"></label>
      <label><small>R</small><input type="number" min="0" max="255" value="${rgb[0]}" onchange="gmVet552CorRgb_('${k}',0,this.value)" style="width:55px"></label>
      <label><small>G</small><input type="number" min="0" max="255" value="${rgb[1]}" onchange="gmVet552CorRgb_('${k}',1,this.value)" style="width:55px"></label>
      <label><small>B</small><input type="number" min="0" max="255" value="${rgb[2]}" onchange="gmVet552CorRgb_('${k}',2,this.value)" style="width:55px"></label>
    </span>`;
    let tamanho='';
    if(f.tipo==='linha'){
        const d=gm555Linha_(f);
        tamanho=`<label><small>Comprimento (m)</small><input type="number" min=".05" step=".05" value="${d.len.toFixed(2)}" onchange="gm555LinhaLen_(this.value)"></label>
                 <label><small>Ângulo</small><input type="number" step="5" value="${Math.round(d.ang)}" onchange="gm555LinhaAng_(this.value)"></label>`;
    }else{
        tamanho=`<label><small>Largura (m)</small><input type="number" min=".05" step=".05" value="${Math.abs(Number(f.w||1)).toFixed(2)}" onchange="gmVet490Prop_('w',Math.sign(Number(${f.w||1}))*(Number(this.value)||.05))"></label>
                 <label><small>Altura (m)</small><input type="number" min=".05" step=".05" value="${Math.abs(Number(f.h||1)).toFixed(2)}" onchange="gmVet490Prop_('h',Math.sign(Number(${f.h||1}))*(Number(this.value)||.05))"></label>
                 <label><small>Giro</small><input type="number" step="5" value="${Number(f.rot||0)}" onchange="gmVet490Prop_('rot',this.value)"></label>
                 <button class="btn-small" onclick="gm555Girar_(-15)">↶ 15°</button><button class="btn-small" onclick="gm555Girar_(15)">↷ 15°</button>`;
        if(f.tipo==='arredondado'){
            const maxR=Math.max(.05,Math.min(Math.abs(Number(f.w||1)),Math.abs(Number(f.h||1)))/2);
            tamanho+=`<label><small>Cantos redondos</small><input type="range" min="0" max="${maxR}" step=".05" value="${Math.min(maxR,Math.max(0,Number(f.radius??.25)))}" oninput="gmVet490Prop_('radius',this.value)" style="width:150px"><span style="font-size:.75em;color:#9fb4c8">${Number(f.radius??.25).toFixed(2)} m</span></label>`;
        }
    }
    box.innerHTML=`<strong style="color:#ffd54a">${escaparHtmlInventario_(f.tipo)}</strong>
      ${tamanho}
      ${cor('stroke','Borda',stroke,sr)}
      ${f.tipo==='linha'?'':cor('fill','Preenchimento',fill,fr)}
      <label><small>Opac. borda</small><input type="number" min="0" max="1" step=".05" value="${op.stroke}" onchange="gmVet490Prop_('strokeOpacity',this.value)"></label>
      ${f.tipo==='linha'?'':`<label><small>Opac. conteúdo</small><input type="number" min="0" max="1" step=".05" value="${op.fill}" onchange="gmVet490Prop_('fillOpacity',this.value)"></label>`}
      <label><small>Borda px</small><input type="number" min="0" max="20" step="1" value="${Number(f.strokeWidth??3)}" onchange="gmVet490Prop_('strokeWidth',this.value)"></label>
      <label><small>Sombra</small><select onchange="gm553FormaShadow_('sombraOficina',this.value)">${['nenhuma','suave','media','forte'].map(v=>`<option value="${v}" ${String(f.sombraOficina||'nenhuma')===v?'selected':''}>${v==='media'?'média':v}</option>`).join('')}</select></label>
      <button class="btn-small" onclick="gm553FormaCamada_('frente')">⬆ Frente</button>
      <button class="btn-small" onclick="gm553FormaCamada_('tras')">⬇ Trás</button>
      <button class="btn-small" onclick="gmVet490Duplicar_()">⧉ Duplicar</button>
      <button class="btn-small btn-danger" onclick="gmVet490Excluir_()">🗑 Excluir</button>`;
};

// ---------------- UI mais curta ----------------
function gm555SimplificarUI_(){
    const panel=document.getElementById('gmVet490Tools');if(!panel)return;
    const row=panel.querySelector('div');
    if(row && !document.getElementById('gm555HexBtn')){
        const add=(id,txt,tool)=>{
            if(document.getElementById(id))return;
            const b=document.createElement('button');b.id=id;b.className='btn-small';b.textContent=txt;b.onclick=()=>gmVet490Tool_(tool);row.appendChild(b);
        };
        add('gm555HexBtn','⬡ Hexágono','hexagono');
        add('gm555StarBtn','★ Estrela','estrela');
        add('gm555UBtn','∪ U','u');
    }

    // "Selecionar formas" deixa de ser uma etapa obrigatória: fica oculto,
    // pois a seleção agora é automática ao clicar na forma.
    const sel=document.getElementById('gmVetSelectToggle501');
    if(sel)sel.style.display='none';

    // O botão Selecionar antigo também deixa de ser necessário.
    if(row){
        [...row.querySelectorAll('button')].forEach(b=>{
            if((b.getAttribute('onclick')||'').includes("gmVet490Tool_('select')"))b.style.display='none';
        });
    }
    try{gmVetSelectAtivo501_=true;gmVet501AtualizarCamadas_();}catch(_){}
}

const gmVet490InstalarUI555Base_=gmVet490InstalarUI_;
gmVet490InstalarUI_=function(){
    gmVet490InstalarUI555Base_();
    gm555SimplificarUI_();
};
const gmOficinaRender555Base_=gmOficinaRender_;
gmOficinaRender_=function(){
    const r=gmOficinaRender555Base_();
    try{gm555SimplificarUI_();gmOficinaV2SyncUI_();}catch(_){}
    return r;
};



// ============================================================
// V46.77.0 — Oficina: objetos realmente opacos + painel de camadas
// ============================================================

const gm556OpaqueCache_ = new Map();

function gm556OpaqueSrc_(src){
    if(!src) return src;
    const cached = gm556OpaqueCache_.get(src);
    if(cached) return cached;
    if(gm556OpaqueCache_.get(src) === null) return src;

    gm556OpaqueCache_.set(src, null);
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
        try{
            const cv = document.createElement('canvas');
            cv.width = im.naturalWidth || im.width;
            cv.height = im.naturalHeight || im.height;
            const ctx = cv.getContext('2d', {willReadFrequently:true});
            ctx.drawImage(im,0,0);
            const data = ctx.getImageData(0,0,cv.width,cv.height);
            // Mantém apenas transparência real do fundo. Qualquer pixel visível
            // passa a 100% opaco, preservando sua cor.
            for(let i=3;i<data.data.length;i+=4){
                if(data.data[i] > 8) data.data[i] = 255;
                else data.data[i] = 0;
            }
            ctx.putImageData(data,0,0);
            const out = cv.toDataURL('image/png');
            gm556OpaqueCache_.set(src,out);
            requestAnimationFrame(()=>{ try{ gmOficinaV2RenderObjetos_(); }catch(_){} });
        }catch(e){
            console.warn('Não foi possível opacificar objeto:',e);
            gm556OpaqueCache_.set(src,src);
        }
    };
    im.onerror = () => gm556OpaqueCache_.set(src,src);
    im.src = src;
    return src;
}

// Ordem unificada simples entre objetos e formas.
// Cada item recebe um campo camadaOficina inteiro.
function gm556GarantirCamadas_(){
    let n=10;
    for(const f of (gmVet490Formas_()||[])){
        if(!Number.isFinite(Number(f.camadaOficina))) f.camadaOficina=n++;
    }
    for(const o of (gmOficinaEstado_.objetos||[])){
        if(!Number.isFinite(Number(o.camadaOficina))) o.camadaOficina=n++;
    }
}
function gm556Todos_(){
    gm556GarantirCamadas_();
    const a=[];
    for(const f of (gmVet490Formas_()||[])) a.push({tipo:'forma',id:f.id,nome:f.tipo||'Forma',ref:f});
    for(const o of (gmOficinaEstado_.objetos||[])) a.push({tipo:'objeto',id:o.id,nome:o.nome||'Objeto',ref:o});
    return a.sort((x,y)=>Number(x.ref.camadaOficina||0)-Number(y.ref.camadaOficina||0));
}
window.gm556MoverCamada_=function(tipo,id,delta){
    const todos=gm556Todos_();
    const i=todos.findIndex(x=>x.tipo===tipo && String(x.id)===String(id));
    if(i<0)return;
    const j=Math.max(0,Math.min(todos.length-1,i+Number(delta||0)));
    if(j===i)return;
    const a=todos[i].ref,b=todos[j].ref;
    const ca=Number(a.camadaOficina||i), cb=Number(b.camadaOficina||j);
    a.camadaOficina=cb;b.camadaOficina=ca;
    gmOficinaPersistir_();gmOficinaRender_();
};
window.gm556TopoCamada_=function(tipo,id){
    const todos=gm556Todos_(),alvo=todos.find(x=>x.tipo===tipo&&String(x.id)===String(id));if(!alvo)return;
    alvo.ref.camadaOficina=Math.max(...todos.map(x=>Number(x.ref.camadaOficina||0)),0)+1;
    gmOficinaPersistir_();gmOficinaRender_();
};
window.gm556FundoCamada_=function(tipo,id){
    const todos=gm556Todos_(),alvo=todos.find(x=>x.tipo===tipo&&String(x.id)===String(id));if(!alvo)return;
    alvo.ref.camadaOficina=Math.min(...todos.map(x=>Number(x.ref.camadaOficina||0)),0)-1;
    gmOficinaPersistir_();gmOficinaRender_();
};
window.gm556SelecionarCamada_=function(tipo,id){
    if(tipo==='forma'){
        gmVet490_.selectedId=String(id);gmOficinaObjSel553_='';
        gm555ModoForma_();
        gmVet490Render_();
    }else{
        gmOficinaObjSel553_=String(id);gmVet490_.selectedId='';
        gmOficinaV2RenderObjetos_();
    }
    gm556RenderCamadas_();
};

function gm556RenderCamadas_(){
    let box=document.getElementById('gm556Layers');
    const tools=document.getElementById('gmVet490Tools');
    if(!tools)return;
    if(!box){
        box=document.createElement('div');box.id='gm556Layers';
        box.style.cssText='margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.12)';
        tools.appendChild(box);
    }
    const todos=gm556Todos_().slice().reverse(); // topo primeiro
    box.innerHTML=`<div style="font-weight:700;color:#d9edf7;margin-bottom:6px">🗂 Camadas <span style="font-weight:400;color:#8fa7b8">(topo primeiro)</span></div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto">
      ${todos.map(x=>{
        const sel=x.tipo==='forma'?String(gmVet490_.selectedId)===String(x.id):String(gmOficinaObjSel553_)===String(x.id);
        return `<div style="display:flex;gap:4px;align-items:center;padding:4px 5px;border-radius:6px;background:${sel?'rgba(90,180,220,.16)':'rgba(255,255,255,.035)'}">
          <button class="btn-small" style="min-width:28px" onclick="gm556SelecionarCamada_('${x.tipo}','${String(x.id).replace(/'/g,"\\'")}')">${x.tipo==='forma'?'◇':'▣'}</button>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escaparHtmlInventario_(x.nome)}</span>
          <button class="btn-small" title="Subir uma camada" onclick="gm556MoverCamada_('${x.tipo}','${String(x.id).replace(/'/g,"\\'")}',1)">↑</button>
          <button class="btn-small" title="Descer uma camada" onclick="gm556MoverCamada_('${x.tipo}','${String(x.id).replace(/'/g,"\\'")}',-1)">↓</button>
          <button class="btn-small" title="Trazer ao topo" onclick="gm556TopoCamada_('${x.tipo}','${String(x.id).replace(/'/g,"\\'")}')">⇈</button>
          <button class="btn-small" title="Enviar ao fundo" onclick="gm556FundoCamada_('${x.tipo}','${String(x.id).replace(/'/g,"\\'")}')">⇊</button>
        </div>`;
      }).join('')}
      </div>`;
}

// Objetos agora usam imagem realmente opacificada, quando a opção está ativa.
// Também usa z-index individual de camada.
gmOficinaV2RenderObjetos_=function(){
    const layer=document.getElementById('gmOficinaV2Objects');if(!layer)return;
    gm556GarantirCamadas_();
    const ppm=gmOficinaV2Ppm_(),z=gm554Zoom_();
    layer.innerHTML=(gmOficinaEstado_.objetos||[]).map((o,i)=>{
        const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(o.modeloId));
        const original=o.imagem||m?.imagem||'';
        const img=(o.opacoOficina!==false)?gm556OpaqueSrc_(original):original;
        const w=Math.max(2*z,Number(o.larguraM||1)*ppm),h=Math.max(2*z,Number(o.alturaM||1)*ppm);
        const sel=String(o.id)===String(gmOficinaObjSel553_);
        const copia={...o,sombraDist:Number(o.sombraDist||4)*z};
        const sh=gm553ShadowCss_(copia);
        const zidx=100+Number(o.camadaOficina||0);
        return `<div class="${sel?'gm-oficina-object-selected-553':''}" data-of2="${escaparHtmlInventario_(o.id)}"
          onpointerdown="gmOficinaV2ArrastarObjeto_(event,'${String(o.id).replace(/'/g,"\\'")}')"
          style="position:absolute;left:${o.x*ppm-w/2}px;top:${o.y*ppm-h/2}px;width:${w}px;height:${h}px;z-index:${zidx};cursor:${gmOficinaV2Cfg_.ativo?'default':'grab'};touch-action:none;pointer-events:auto;transform:rotate(${Number(o.angulo||0)}deg);transform-origin:center">
          ${img?`<img src="${img}" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none;opacity:1;filter:${sh||'none'}">`:'🧱'}
        </div>`;
    }).join('');
    gm553ObjInspector_();gm556RenderCamadas_();
};

// Formas: cada forma ganha z-order dentro do SVG pela ordem do array.
// Reordenamos o array conforme camadaOficina antes de renderizar.
const gmVet490Render556Base_=gmVet490Render_;
gmVet490Render_=function(){
    gm556GarantirCamadas_();
    const arr=gmVet490Formas_();
    if(Array.isArray(arr))arr.sort((a,b)=>Number(a.camadaOficina||0)-Number(b.camadaOficina||0));
    const r=gmVet490Render556Base_();
    gm556RenderCamadas_();
    return r;
};

// Objetos e SVG ficam no mesmo plano visual geral; o SVG não deve ficar todo
// acima ou todo abaixo dos objetos.
function gm556CamadasDom_(){
    const svg=document.getElementById('gmOficinaVectorLayer');
    const objs=document.getElementById('gmOficinaV2Objects');
    if(svg){svg.style.zIndex='100';svg.style.pointerEvents='auto';}
    if(objs){objs.style.zIndex='100';}
}
const gmOficinaRender556Base_=gmOficinaRender_;
gmOficinaRender_=function(){
    const r=gmOficinaRender556Base_();
    try{gm556CamadasDom_();gm556RenderCamadas_();}catch(_){}
    return r;
};



// ============================================================
// V46.77.0 — Oficina: composição real por ordem de adição
// Arquitetura simplificada:
//   raster/desenho = fundo
//   formas + objetos = UM MESMO SVG, ordenados cronologicamente
//   último elemento adicionado = topo
// ============================================================

function gm560TimestampId_(id){
    const m=String(id||'').match(/(?:vet|ofobj|obj)[:_\-](\d{10,})/i);
    return m ? Number(m[1]) : 0;
}
function gm560GarantirOrdem_(){
    const itens=[];
    for(const f of (gmVet490Formas_()||[])) itens.push({ref:f,t:gm560TimestampId_(f.id)});
    for(const o of (gmOficinaEstado_.objetos||[])) itens.push({ref:o,t:gm560TimestampId_(o.id)});
    let fallback=Date.now()-itens.length*10;
    itens.sort((a,b)=>(a.t||0)-(b.t||0));
    for(const it of itens){
        if(!Number.isFinite(Number(it.ref.ordemOficina))){
            it.ref.ordemOficina=it.t || fallback++;
        }
    }
}
function gm560Itens_(){
    gm560GarantirOrdem_();
    const a=[];
    for(const f of (gmVet490Formas_()||[])) a.push({tipo:'forma',id:f.id,nome:f.tipo||'Forma',ref:f});
    for(const o of (gmOficinaEstado_.objetos||[])) a.push({tipo:'objeto',id:o.id,nome:o.nome||'Objeto',ref:o});
    return a.sort((x,y)=>Number(x.ref.ordemOficina||0)-Number(y.ref.ordemOficina||0));
}
function gm560Topo_(ref){
    const all=gm560Itens_();
    const mx=Math.max(Date.now(),...all.map(x=>Number(x.ref.ordemOficina||0)));
    ref.ordemOficina=mx+1;
}
function gm560Esc_(x){ return escaparHtmlInventario_(String(x??'')); }

function gm560ObjetoSvg_(o,ppm){
    const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(o.modeloId));
    const img=o.imagem||m?.imagem||'';
    const w=Math.max(.05,Number(o.larguraM||1))*ppm;
    const h=Math.max(.05,Number(o.alturaM||1))*ppm;
    const x=Number(o.x||0)*ppm-w/2, y=Number(o.y||0)*ppm-h/2;
    const cx=x+w/2,cy=y+h/2,rot=Number(o.angulo||0);
    const sel=String(o.id)===String(gmOficinaObjSel553_);
    const id=String(o.id).replace(/'/g,"\\'");
    const shadow=gm553ShadowCss_(o);
    // Sem filtro de "opacificar tudo": a opacidade do próprio objeto permanece 1.
    // A transparência do arquivo PNG continua apenas onde a imagem realmente é transparente.
    return `<g data-of2="${gm560Esc_(o.id)}" transform="rotate(${rot} ${cx} ${cy})"
              onpointerdown="gmOficinaV2ArrastarObjeto_(event,'${id}')"
              style="cursor:grab;pointer-events:auto;${shadow?`filter:${shadow};`:''}">
        ${img?`<image href="${gm560Esc_(img)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" opacity="1"/>`
              :`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#777"/>`}
        ${sel?`<rect x="${x-2}" y="${y-2}" width="${w+4}" height="${h+4}" fill="none" stroke="#41d9f5" stroke-width="1.5" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" pointer-events="none"/>`:''}
    </g>`;
}

function gm560RenderUnificado_(){
    const svg=document.getElementById('gmOficinaVectorLayer');
    if(!svg)return;
    gm560GarantirOrdem_();
    const ppm=gmOficinaV2Ppm_();
    const html=gm560Itens_().map(it=>{
        if(it.tipo==='forma') return gmVet490SvgEl_(it.ref,ppm);
        return gm560ObjetoSvg_(it.ref,ppm);
    }).join('');
    svg.innerHTML=html;
    svg.style.display='block';
    svg.style.zIndex='12';
    svg.style.pointerEvents='auto';

    // A antiga camada HTML de objetos causava o problema: formas e objetos
    // pertenciam a stacking contexts diferentes e não podiam intercalar.
    const old=document.getElementById('gmOficinaV2Objects');
    if(old){ old.innerHTML=''; old.style.display='none'; old.style.pointerEvents='none'; }

    gm560RenderCamadas_();
}

// Render principal vetorial agora sempre termina na composição unificada.
const gmVet490Render560Base_=gmVet490Render_;
gmVet490Render_=function(){
    // deixa rotinas antigas atualizarem inspector/estado, mas substitui o resultado visual
    try{gmVet490Render560Base_();}catch(e){console.warn('render base vetorial',e);}
    gm560RenderUnificado_();
};

// Não renderiza mais a camada HTML separada de objetos.
gmOficinaV2RenderObjetos_=function(){
    gm560RenderUnificado_();
    try{gm553ObjInspector_();}catch(_){}
};

// Arraste de objeto diretamente dentro do SVG unificado.
window.gmOficinaV2ArrastarObjeto_=function(ev,id){
    if(gmOficinaV2Cfg_.ativo)return;
    ev.preventDefault();ev.stopPropagation();
    try{gmOficinaV2Historico_();}catch(_){}
    const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));
    const map=document.getElementById('gmOficinaV2Map');
    if(!o||!map)return;

    gmOficinaObjSel553_=String(id);
    gmVet490_.selectedId='';
    const rect=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();

    const move=e=>{
        o.x=Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-rect.left)/ppm));
        o.y=Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-rect.top)/ppm));
        gm560RenderUnificado_();
    };
    const up=()=>{
        window.removeEventListener('pointermove',move);
        gmOficinaPersistir_();
        gm560RenderUnificado_();
        try{gm553ObjInspector_();}catch(_){}
    };
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerup',up,{once:true});
};

// Selecionar uma forma continua permitindo arrastá-la, mas agora no mesmo plano.
const gmVet490PointerForma560Base_=window.gmVet490PointerForma_;
window.gmVet490PointerForma_=function(ev,id){
    gmOficinaObjSel553_='';
    return gmVet490PointerForma560Base_(ev,id);
};

// Último elemento criado vai automaticamente para o topo.
// Objetos:
const gmOficinaV2AddObjeto560Base_=window.gmOficinaV2AddObjeto_;
window.gmOficinaV2AddObjeto_=function(){
    const antes=new Set((gmOficinaEstado_.objetos||[]).map(o=>String(o.id)));
    gmOficinaV2AddObjeto560Base_();
    const novo=(gmOficinaEstado_.objetos||[]).find(o=>!antes.has(String(o.id)));
    if(novo){gm560Topo_(novo);gmOficinaPersistir_();gm560RenderUnificado_();}
};
// Formas: detecta a nova forma na renderização e completa a ordem pelo timestamp do id.

// Camadas manuais, sem alterar opacidade.
window.gm560LayerMove_=function(tipo,id,delta){
    const a=gm560Itens_();
    const i=a.findIndex(x=>x.tipo===tipo&&String(x.id)===String(id));
    if(i<0)return;
    const j=Math.max(0,Math.min(a.length-1,i+Number(delta||0)));
    if(i===j)return;
    const oi=Number(a[i].ref.ordemOficina),oj=Number(a[j].ref.ordemOficina);
    a[i].ref.ordemOficina=oj;a[j].ref.ordemOficina=oi;
    gmOficinaPersistir_();gm560RenderUnificado_();
};
window.gm560LayerTop_=function(tipo,id){
    const x=gm560Itens_().find(x=>x.tipo===tipo&&String(x.id)===String(id));if(!x)return;
    gm560Topo_(x.ref);gmOficinaPersistir_();gm560RenderUnificado_();
};
window.gm560LayerBottom_=function(tipo,id){
    const a=gm560Itens_(),x=a.find(x=>x.tipo===tipo&&String(x.id)===String(id));if(!x)return;
    x.ref.ordemOficina=Math.min(...a.map(y=>Number(y.ref.ordemOficina||0)),Date.now())-1;
    gmOficinaPersistir_();gm560RenderUnificado_();
};
window.gm560LayerSelect_=function(tipo,id){
    if(tipo==='forma'){
        gmVet490_.selectedId=String(id);gmOficinaObjSel553_='';
        gm555ModoForma_();
    }else{
        gmOficinaObjSel553_=String(id);gmVet490_.selectedId='';
    }
    gm560RenderUnificado_();
    try{gmVet490Inspector_();gm553ObjInspector_();}catch(_){}
};

function gm560RenderCamadas_(){
    let box=document.getElementById('gm556Layers');
    const tools=document.getElementById('gmVet490Tools');
    if(!tools)return;
    if(!box){
        box=document.createElement('div');box.id='gm556Layers';
        box.style.cssText='margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.12)';
        tools.appendChild(box);
    }
    const a=gm560Itens_().slice().reverse();
    box.innerHTML=`<div style="font-weight:700;color:#d9edf7;margin-bottom:6px">🗂 Ordem dos elementos <span style="font-weight:400;color:#8fa7b8">• último adicionado fica no topo</span></div>
    <div style="display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto">
    ${a.map(x=>{
        const sel=x.tipo==='forma'?String(gmVet490_.selectedId)===String(x.id):String(gmOficinaObjSel553_)===String(x.id);
        const iid=String(x.id).replace(/'/g,"\\'");
        return `<div style="display:flex;gap:4px;align-items:center;padding:4px 5px;border-radius:6px;background:${sel?'rgba(65,217,245,.14)':'rgba(255,255,255,.035)'}">
          <button class="btn-small" onclick="gm560LayerSelect_('${x.tipo}','${iid}')">${x.tipo==='forma'?'◇':'▣'}</button>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${gm560Esc_(x.nome)}</span>
          <button class="btn-small" title="Subir" onclick="gm560LayerMove_('${x.tipo}','${iid}',1)">↑</button>
          <button class="btn-small" title="Descer" onclick="gm560LayerMove_('${x.tipo}','${iid}',-1)">↓</button>
          <button class="btn-small" title="Topo" onclick="gm560LayerTop_('${x.tipo}','${iid}')">⇈</button>
          <button class="btn-small" title="Fundo" onclick="gm560LayerBottom_('${x.tipo}','${iid}')">⇊</button>
        </div>`;
    }).join('')}</div>`;
}

// Remove controles antigos que davam a impressão de opacidade global.
function gm560LimparUIAntiga_(){
    const old=document.getElementById('gm553Plano');if(old)old.style.display='none';
    const inspector=document.getElementById('gmObjInspector553');
    if(inspector){
        const lbl=[...inspector.querySelectorAll('label')].find(l=>(l.textContent||'').includes('Pixels visíveis opacos'));
        if(lbl)lbl.style.display='none';
    }
}

// O inspector de objeto deixa explícito que transparência é propriedade da imagem,
// não da pilha de camadas.
const gm553ObjInspector560Base_=gm553ObjInspector_;
gm553ObjInspector_=function(){
    gm553ObjInspector560Base_();
    gm560LimparUIAntiga_();
};

// Render geral.
const gmOficinaRender560Base_=gmOficinaRender_;
gmOficinaRender_=function(){
    const r=gmOficinaRender560Base_();
    try{
        gm560GarantirOrdem_();
        gm560RenderUnificado_();
        gm560LimparUIAntiga_();
    }catch(e){console.warn('Oficina v46.77.0',e);}
    return r;
};

// Garantia inicial/migração.
setTimeout(()=>{try{gm560GarantirOrdem_();gmOficinaPersistir_();gm560RenderUnificado_();}catch(_){}},300);



// ============================================================
// V46.77.0 — REFORMA DA OFICINA
// Interface única + pilha cronológica real para desenho, formas e objetos.
// ============================================================

const gm570_ = {
    borderColor:'#111111',
    borderOpacity:1,
    borderWidth:0,
    edit:false,
    selected:{type:'',id:''},
    strokeCache:new Map(),
    internalClipboard:null,
    lineType:'linha',
    mode:'brush'
};

function gm570Id_(prefix='el'){ return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2,7)}`; }
function gm570Hex_(v,fb='#000000'){
    let x=String(v||'').trim();
    if(!x)return fb;
    if(!x.startsWith('#'))x='#'+x;
    if(/^#[0-9a-f]{3}$/i.test(x)) x='#'+x[1]+x[1]+x[2]+x[2]+x[3]+x[3];
    return /^#[0-9a-f]{6}$/i.test(x)?x.toUpperCase():fb;
}
function gm570Rgb_(hex){
    const h=gm570Hex_(hex).slice(1);
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
function gm570RgbHex_(v){
    const m=String(v||'').match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);
    if(!m)return null;
    return '#'+[m[1],m[2],m[3]].map(n=>Math.max(0,Math.min(255,Number(n)||0)).toString(16).padStart(2,'0')).join('').toUpperCase();
}
function gm570Esc_(x){ return escaparHtmlInventario_(String(x??'')); }

function gm570EnsureOrder_(){
    let seq=Date.now()-100000;
    const shapes=gmVet490Formas_()||[], objs=gmOficinaEstado_.objetos||[], draws=gmOficinaEstado_.desenhos||[];
    const known=[...shapes,...objs].map(x=>Number(x.ordemOficina||gm560TimestampId_(x.id)||0)).filter(Boolean);
    let maxKnown=known.length?Math.max(...known):seq;

    for(const f of shapes){
        if(!f.id)f.id=gm570Id_('vet');
        if(!Number.isFinite(Number(f.ordemOficina))) f.ordemOficina=Number(gm560TimestampId_(f.id)||++seq);
    }
    for(const o of objs){
        if(!o.id)o.id=gm570Id_('ofobj');
        if(!Number.isFinite(Number(o.ordemOficina))) o.ordemOficina=Number(gm560TimestampId_(o.id)||++seq);
    }
    // Migração dos desenhos antigos: coloca-os acima das formas/objetos existentes.
    // Isso recupera os riscos que "sumiram" na 46.56.
    for(const d of draws){
        if(!d.id)d.id=gm570Id_('draw');
        if(!Number.isFinite(Number(d.ordemOficina))) d.ordemOficina=++maxKnown;
    }
}
function gm570Items_(){
    gm570EnsureOrder_();
    const a=[];
    (gmOficinaEstado_.desenhos||[]).forEach(x=>a.push({type:'draw',id:x.id,ref:x,nome:'Desenho'}));
    (gmVet490Formas_()||[]).forEach(x=>a.push({type:'shape',id:x.id,ref:x,nome:x.tipo||'Forma'}));
    (gmOficinaEstado_.objetos||[]).forEach(x=>a.push({type:'object',id:x.id,ref:x,nome:x.nome||'Objeto'}));
    return a.sort((a,b)=>Number(a.ref.ordemOficina||0)-Number(b.ref.ordemOficina||0));
}
function gm570SelectedRef_(){
    const s=gm570_.selected;
    if(!s?.id)return null;
    return gm570Items_().find(x=>x.type===s.type&&String(x.id)===String(s.id))||null;
}
function gm570Select_(type,id){
    gm570_.selected={type:String(type||''),id:String(id||'')};
    gmVet490_.selectedId=type==='shape'?String(id):'';
    gmOficinaObjSel553_=type==='object'?String(id):'';
    gm570Render_();
    gm570Inspector_();
}

// ---------- NOVA INTERFACE ----------
function gm570ToolbarHtml_(){
    const basic=['#FFFFFF','#111111','#FF5252','#FFCF4D','#56F08A','#45B7FF','#B56CFF'];
    const brushOpts=[
      ['redondo','Pincel'],['quadrado','Pincel de ladrilhos'],['espelhado','Pincel espelhado'],
      ['caligrafico','Caligrafia'],['caneta','Caneta'],['lapis','Lápis'],['serpentina','Serpentina'],
      ['seta','Seta'],['curso','Curso / curva'],['linha','Linha livre'],['giz_cera','Giz de cera'],
      ['spray','Tinta spray'],['carimbo','Carimbo'],['pele','Pele / pelos'],['esboco','Esboço'],
      ['espirografo','Espirógrafo'],['teia','Teia'],['irregular','Irregular'],
      ['pontilhada','Pontilhado'],['ranhura','Ranhura'],['areia','Areia'],
      ['cascalho','Cascalho'],['grama','Grama'],['folhas','Folhas'],['neve','Neve'],
      ['fumaca','Fumaça'],['borracha','Borracha']
    ];
    const otherShapes=[
      ['hexagono','Hexágono'],['pentagono','Pentágono'],['losango','Losango'],
      ['estrela','Estrela'],['pentagrama','Pentagrama'],['hexagrama','Hexagrama'],
      ['heptagrama','Heptagrama'],['u','U'],['coracao','Coração'],['meialua','Meia-lua'],
      ['semicirculo','Semicírculo']
    ];
    return `
    <div id="gm570Toolbar" style="display:flex;flex-direction:column;gap:8px;margin:8px 0 10px;padding:10px;border:1px solid rgba(126,231,255,.20);border-radius:11px;background:rgba(0,0,0,.13)">
      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
        <label style="margin:0"><small>Tamanho</small><select id="gmOficinaV2Size" onchange="gmOficinaV2Tamanho_(this.value)" style="margin:3px 0 0">
          <option value="10x10">10 × 10 m</option><option value="20x12">20 × 12 m</option><option value="28x14">28 × 14 m</option><option value="36x20">36 × 20 m</option><option value="50x30">50 × 30 m</option><option value="50x40">50 × 40 m</option>
        </select></label>
        <label style="margin:0"><small>Escala</small><select id="gmOficinaV2Scale" onchange="gmOficinaV2Escala_(this.value)" style="margin:3px 0 0">
          ${[18,24,32,40,48,60,72].map(x=>`<option value="${x}">${x} px/m</option>`).join('')}
        </select></label>
        <label style="margin:0"><small>Fundo</small><input id="gmOficinaV2Fundo" type="color" onchange="gmOficinaV2Fundo_(this.value)" style="width:50px;height:36px;padding:2px"></label>
        <label style="margin:0"><small>Grade</small><input id="gmOficinaV2GradeCor" type="color" onchange="gmOficinaV2GradeCor_(this.value)" style="width:50px;height:36px;padding:2px"></label>
        <label style="display:flex;align-items:center;gap:5px;margin:0 4px 7px 0"><input id="gmOficinaV2GradeVis" type="checkbox" onchange="gmOficinaV2GradeVis_(this.checked)"> Grade</label>
        <label style="margin:0"><small>Textura do terreno</small><select id="gmOficinaV2Terreno" onchange="gmOficinaV2Terreno_(this.value)" style="width:220px;margin:3px 0 0">
          <option value="nenhuma">Nenhuma</option><option value="concreto">Concreto</option><option value="areia">Areia</option><option value="terra">Terra</option><option value="grama">Grama</option><option value="floresta">Floresta</option><option value="rochas">Rochas</option><option value="neve">Neve</option><option value="agua">Água</option><option value="vulcanico">Vulcânico</option><option value="metal">Metal / nave</option><option value="ruinas">Ruínas</option><option value="alien">Biomassa alienígena</option><option value="nevoa">Névoa</option>
        </select></label>
        <button class="btn-small" onclick="gmOficinaV2Undo_()">↶</button>
        <button class="btn-small" onclick="gmOficinaV2Redo_()">↷</button>
      </div>

      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
        <label style="margin:0"><small>Pincel / estilo</small><select id="gm570Brush" onchange="gm570Brush_(this.value)" style="min-width:180px;margin:3px 0 0">
          ${brushOpts.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}
        </select></label>
        <label style="margin:0"><small>Prévia</small><canvas id="gmOficinaV2BrushPreview" width="150" height="38" style="display:block;width:150px;height:38px;border:1px solid rgba(255,255,255,.18);border-radius:7px;background:rgba(255,255,255,.06)"></canvas></label>
        <label style="margin:0"><small>Cor</small><input id="gmOficinaV2Color" type="color" onchange="gm570Color_(this.value)" style="width:48px;height:36px;padding:2px"></label>
        <label style="margin:0"><small>RGB</small><input id="gmOficinaV2Rgb" type="text" onchange="gm570RgbInput_(this.value)" style="width:100px"></label>
        <label style="margin:0"><small>HEX</small><input id="gmOficinaV2HexInput555" type="text" maxlength="7" onchange="gm570Color_(this.value)" style="width:86px"></label>
        <span style="display:flex;gap:3px;padding-bottom:7px">${basic.map(c=>`<button onclick="gm570Color_('${c}')" style="width:21px;height:21px;min-width:21px;padding:0;border-radius:50%;background:${c}"></button>`).join('')}</span>
        <label style="margin:0"><small>Tamanho</small><input id="gmOficinaV2BrushSize" type="range" min="1" max="100" value="7" oninput="gmOficinaV2BrushSize_(this.value);gm570Sync_()" style="width:110px"><span id="gmOficinaV2BrushSizeVal">7</span></label>
        <label style="margin:0"><small>Opacidade</small><input id="gmOficinaV2Opacity" type="range" min="0" max="100" step="5" value="100" oninput="gmOficinaV2Opacity_(this.value);gm570Sync_()" style="width:100px"><span id="gmOficinaV2OpacityVal">100%</span></label>
      </div>

      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;padding-top:5px;border-top:1px solid rgba(255,255,255,.08)">
        <strong style="align-self:center;color:#cfeeff">Borda</strong>
        <label style="margin:0"><small>Cor</small><input id="gm570BorderColor" type="color" value="${gm570_.borderColor}" onchange="gm570BorderColor_(this.value)" style="width:48px;height:36px;padding:2px"></label>
        <label style="margin:0"><small>RGB</small><input id="gm570BorderRgb" type="text" onchange="gm570BorderRgb_(this.value)" style="width:100px"></label>
        <label style="margin:0"><small>HEX</small><input id="gm570BorderHex" type="text" maxlength="7" onchange="gm570BorderColor_(this.value)" style="width:86px"></label>
        <label style="margin:0"><small>Grossura</small><input id="gm570BorderWidth" type="range" min="0" max="20" step="1" value="${gm570_.borderWidth}" oninput="gm570_.borderWidth=Number(this.value);gm570Sync_()" style="width:100px"><span id="gm570BorderWidthVal">${gm570_.borderWidth}</span></label>
        <label style="margin:0"><small>Opacidade</small><input id="gm570BorderOpacity" type="range" min="0" max="100" step="5" value="${gm570_.borderOpacity*100}" oninput="gm570_.borderOpacity=Number(this.value)/100;gm570Sync_()" style="width:100px"><span id="gm570BorderOpacityVal">${Math.round(gm570_.borderOpacity*100)}%</span></label>
      </div>

      <div style="display:flex;gap:7px;align-items:end;flex-wrap:wrap;padding-top:5px;border-top:1px solid rgba(255,255,255,.08)">
        <strong style="align-self:center;color:#ffd54a">Formas</strong>
        <button class="btn-small" onclick="gm570ShapeTool_('retangulo')">▭ Retângulo</button>
        <button class="btn-small" onclick="gm570ShapeTool_('arredondado')">▢ Retângulo arredondado</button>
        <button class="btn-small" onclick="gm570ShapeTool_('quadrado')">□ Quadrado</button>
        <button class="btn-small" onclick="gm570ShapeTool_('triangulo')">△ Triângulo</button>
        <button class="btn-small" onclick="gm570ShapeTool_('circulo')">○ Círculo</button>
        <button class="btn-small" onclick="gm570ShapeTool_('elipse')">⬭ Elipse</button>
        <label style="margin:0"><small>Outras formas</small><select id="gm570OtherShape" onchange="if(this.value){gm570ShapeTool_(this.value);this.value=''}" style="margin:3px 0 0"><option value="">— escolher —</option>${otherShapes.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></label>
        <label style="margin:0"><small>Linhas</small><select id="gm570LineType" onchange="gm570LineTool_(this.value)" style="margin:3px 0 0">
          <option value="">— escolher —</option><option value="linha">Linha reta</option><option value="linha_sinuosa">Linha sinuosa</option><option value="linha_pontilhada">Linha pontilhada</option><option value="linha_curva">Linha com ponto de curva</option>
        </select></label>
      </div>

      <div style="display:flex;gap:7px;align-items:end;flex-wrap:wrap;padding-top:5px;border-top:1px solid rgba(255,255,255,.08)">
        <strong style="align-self:center;color:#cfeeff">Objetos do banco</strong>
        <select id="gm570ObjMulti" multiple size="4" style="min-width:280px;max-width:420px"></select>
        <button class="btn-small" onclick="gm570AddObjects_()">＋ Adicionar selecionados</button>
        <span style="font-size:.82em;color:#9fb4c8">Ctrl/⌘ para múltipla seleção</span>
      </div>

      <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;padding-top:5px;border-top:1px solid rgba(255,255,255,.08)">
        <button id="gm570EditBtn" class="btn-small" onclick="gm570ToggleEdit_()">✥ Editar forma</button>
        <button class="btn-small" onclick="gm570Front_()">⬆ Frente</button>
        <button class="btn-small" onclick="gm570Back_()">⬇ Trás</button>
        <button class="btn-small" onclick="gm570Duplicate_()">⧉ Duplicar</button>
        <button class="btn-small btn-danger" onclick="gm570Delete_()">🗑 Excluir</button>
        <span style="font-size:.82em;color:#9fb4c8">Ctrl + arrastar move • Ctrl+C / Ctrl+V copia e cola • Ctrl+V também aceita imagem externa</span>
      </div>
      <div id="gm570Inspector" style="display:flex;gap:7px;align-items:end;flex-wrap:wrap"></div>
      <div id="gmVet490Inspector" style="display:none"></div>
      <select id="gmOficinaV2Objeto" style="display:none"></select>
      <select id="gmOficinaV2Tool" style="display:none"><option value="traco">Traço</option></select>
      <select id="gmOficinaV2StrokeStyle" style="display:none"><option value="redondo">redondo</option></select>
    </div>`;
}
function gm570BuildUI_(){
    const root=document.getElementById('gm-sub-oficina-mapas'), viewport=document.getElementById('gmOficinaV2Viewport');
    if(!root||!viewport)return;
    const old=document.getElementById('gm570Toolbar');if(old)old.remove();
    viewport.insertAdjacentHTML('beforebegin',gm570ToolbarHtml_());
    const legacy=document.getElementById('gmVet490Tools');if(legacy)legacy.style.display='none';
    gm570PopulateObjects_();gm570Sync_();
}
function gm570PopulateObjects_(){
    const sel=document.getElementById('gm570ObjMulti');if(!sel)return;
    const selected=new Set([...sel.selectedOptions].map(o=>o.value));
    const lista=[...(objetosMapaDB||[])].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    sel.innerHTML=lista.map(o=>`<option value="${gm570Esc_(o.id)}">${gm570Esc_(o.nome||o.id)}</option>`).join('');
    [...sel.options].forEach(o=>{if(selected.has(o.value))o.selected=true;});
}
function gm570Sync_(){
    const set=(id,val,prop='value')=>{const e=document.getElementById(id);if(e&&document.activeElement!==e)e[prop]=val;};
    set('gmOficinaV2Color',gm570Hex_(gmOficinaV2Cfg_.cor||'#FFCF4D'));
    set('gmOficinaV2HexInput555',gm570Hex_(gmOficinaV2Cfg_.cor||'#FFCF4D'));
    set('gmOficinaV2Rgb',gm570Rgb_(gmOficinaV2Cfg_.cor||'#FFCF4D').join('/'));
    set('gmOficinaV2BrushSize',gmOficinaV2Cfg_.tamanho);
    const bsv=document.getElementById('gmOficinaV2BrushSizeVal');if(bsv)bsv.textContent=String(gmOficinaV2Cfg_.tamanho);
    set('gmOficinaV2Opacity',Math.round(gmOficinaV2Cfg_.opacidade*100));
    const opv=document.getElementById('gmOficinaV2OpacityVal');if(opv)opv.textContent=`${Math.round(gmOficinaV2Cfg_.opacidade*100)}%`;
    set('gm570BorderColor',gm570_.borderColor);set('gm570BorderHex',gm570_.borderColor);set('gm570BorderRgb',gm570Rgb_(gm570_.borderColor).join('/'));
    set('gm570BorderWidth',gm570_.borderWidth);const bw=document.getElementById('gm570BorderWidthVal');if(bw)bw.textContent=String(gm570_.borderWidth);
    set('gm570BorderOpacity',Math.round(gm570_.borderOpacity*100));const bo=document.getElementById('gm570BorderOpacityVal');if(bo)bo.textContent=`${Math.round(gm570_.borderOpacity*100)}%`;
    const sc=document.getElementById('gmOficinaV2Scale');if(sc)sc.value=String(gmOficinaV2Ppm_());
    const size=document.getElementById('gmOficinaV2Size');if(size){const v=`${gmOficinaEstado_.larguraM}x${gmOficinaEstado_.alturaM}`;if([...size.options].some(o=>o.value===v))size.value=v;}
    const f=document.getElementById('gmOficinaV2Fundo');if(f)f.value=gmOficinaEstado_.fundo||'#d7d7d7';
    const g=document.getElementById('gmOficinaV2GradeCor');if(g)g.value=gmOficinaEstado_.corGrade||'#777';
    const gv=document.getElementById('gmOficinaV2GradeVis');if(gv)gv.checked=gmOficinaEstado_.gradeVisivel!==false;
    const tr=document.getElementById('gmOficinaV2Terreno');if(tr)tr.value=gmOficinaEstado_.textura||'nenhuma';
    try{gmOficinaV2Preview550_();}catch(_){}
}
window.gm570Color_=function(v){gmOficinaV2Cfg_.cor=gm570Hex_(v,gmOficinaV2Cfg_.cor);gm570Sync_();};
window.gm570RgbInput_=function(v){const h=gm570RgbHex_(v);if(h)gm570Color_(h);};
window.gm570BorderColor_=function(v){gm570_.borderColor=gm570Hex_(v,gm570_.borderColor);gm570Sync_();};
window.gm570BorderRgb_=function(v){const h=gm570RgbHex_(v);if(h)gm570BorderColor_(h);};

// ---------- PINCÉIS ----------
function gm570BrushConfig_(v){
    const x=String(v||'redondo');
    gmOficinaV2Cfg_.ferramenta=x==='borracha'?'borracha':'traco';
    gmOficinaV2Cfg_.pincel=['quadrado','spray','irregular','caligrafico'].includes(x)?x:'redondo';
    gmOficinaV2Cfg_.texturaTraco=['pontilhada','giz','ranhura','areia','cascalho','grama','folhas','neve','fumaca'].includes(x)?x:'solida';
    gmOficinaV2Cfg_.estilo570=x;
}
window.gm570Brush_=function(v){
    gm570_.mode='brush';gm570BrushConfig_(v);gmOficinaV2Cfg_.ativo=true;
    gm570_.edit=false;gm570Sync_();gm570Render_();
};
const gmOficinaV2BrushSize570Base_=window.gmOficinaV2BrushSize_;
window.gmOficinaV2BrushSize_=function(v){gmOficinaV2Cfg_.tamanho=Math.max(1,Math.min(100,Number(v)||7));gm570Sync_();};
const gmOficinaV2Opacity570Base_=window.gmOficinaV2Opacity_;
window.gmOficinaV2Opacity_=function(v){gmOficinaV2Cfg_.opacidade=Math.max(0,Math.min(1,Number(v)/100));gm570Sync_();};

// ---------- FORMAS E LINHAS ----------
function gm570PrepareShape_(){
    gm570_.mode='shape';gmOficinaV2Cfg_.ativo=false;
    gmVet490_.stroke=gm570_.borderColor;
    gmVet490_.fill=gmOficinaV2Cfg_.cor;
    gmVet490_.opacity=gmOficinaV2Cfg_.opacidade;
    gmVet490_.strokeWidth=gm570_.borderWidth;
}
window.gm570ShapeTool_=function(tipo){
    gm570PrepareShape_();
    gmVet490Tool_(tipo);
    gmVetSelectAtivo501_=true;
    try{gmVet501AtualizarCamadas_();}catch(_){}
};
window.gm570LineTool_=function(tipo){
    if(!tipo)return;
    gm570PrepareShape_();gm570_.lineType=tipo;
    gmVet490Tool_(tipo==='linha'?'linha':tipo);
};

function gm570Poly_(tipo,x,y,w,h){
    const cx=x+w/2,cy=y+h/2;
    const pts=(n,shift=-Math.PI/2,r2=null)=>{
        const a=[];const count=r2?n*2:n;
        for(let i=0;i<count;i++){
            const a0=shift+i*Math.PI*2/count;
            const rr=r2?(i%2===0?1:r2):1;
            a.push(`${cx+Math.cos(a0)*w/2*rr},${cy+Math.sin(a0)*h/2*rr}`);
        }return a.join(' ');
    };
    if(tipo==='pentagono')return pts(5);
    if(tipo==='losango')return `${cx},${y} ${x+w},${cy} ${cx},${y+h} ${x},${cy}`;
    if(tipo==='pentagrama'||tipo==='estrela')return pts(5,-Math.PI/2,.43);
    if(tipo==='heptagrama')return pts(7,-Math.PI/2,.48);
    if(tipo==='hexagono')return pts(6);
    return '';
}
function gm570ExtraShapeSvg_(f,ppm){
    const op=gmVet530Opacidades_(f),stroke=f.stroke||gm570_.borderColor,fill=f.fill||gmOficinaV2Cfg_.cor;
    const sw=Math.max(0,Number(f.strokeWidth??0))*gm554Zoom_();
    const x=Number(f.x||0)*ppm,y=Number(f.y||0)*ppm,w=Number(f.w||0)*ppm,h=Number(f.h||0)*ppm,cx=x+w/2,cy=y+h/2,rot=Number(f.rot||0);
    const id=String(f.id).replace(/'/g,"\\'"),common=`stroke="${stroke}" stroke-opacity="${op.stroke}" stroke-width="${sw}" fill="${fill}" fill-opacity="${op.fill}" transform="rotate(${rot} ${cx} ${cy})" data-vet-id="${gm570Esc_(f.id)}" onpointerdown="gm570ShapeDown_(event,'${id}')"`;
    if(['hexagono','pentagono','losango','estrela','pentagrama','heptagrama'].includes(f.tipo)){
        if(f.tipo==='hexagrama'){
            const p1=gm570Poly_('triangulo',x,y,w,h); // fallback below
        }
        return `<polygon points="${gm570Poly_(f.tipo,x,y,w,h)}" ${common}/>`;
    }
    if(f.tipo==='hexagrama'){
        const pA=`${cx},${y} ${x+w},${y+h*.75} ${x},${y+h*.75}`;
        const pB=`${cx},${y+h} ${x+w},${y+h*.25} ${x},${y+h*.25}`;
        return `<g ${common.replace(/fill="[^"]*"/,'fill="none"')}><polygon points="${pA}" fill="${fill}" fill-opacity="${op.fill}"/><polygon points="${pB}" fill="${fill}" fill-opacity="${op.fill}"/></g>`;
    }
    if(f.tipo==='u'){
        const t=Math.max(2,Math.min(Math.abs(w),Math.abs(h))*.22);
        const p=`${x},${y} ${x+t},${y} ${x+t},${y+h-t} ${x+w-t},${y+h-t} ${x+w-t},${y} ${x+w},${y} ${x+w},${y+h} ${x},${y+h}`;
        return `<polygon points="${p}" ${common}/>`;
    }
    if(f.tipo==='coracao'){
        const d=`M ${cx} ${y+h*.92} C ${x+w*.05} ${y+h*.52}, ${x+w*.05} ${y+h*.12}, ${cx} ${y+h*.34} C ${x+w*.95} ${y+h*.12}, ${x+w*.95} ${y+h*.52}, ${cx} ${y+h*.92} Z`;
        return `<path d="${d}" ${common}/>`;
    }
    if(f.tipo==='semicirculo'){
        const d=`M ${x} ${y+h} A ${Math.abs(w)/2} ${Math.abs(h)} 0 0 1 ${x+w} ${y+h} L ${x} ${y+h} Z`;
        return `<path d="${d}" ${common}/>`;
    }
    if(f.tipo==='meialua'){
        const d=`M ${x+w*.78} ${y+h*.05} A ${w*.48} ${h*.48} 0 1 0 ${x+w*.78} ${y+h*.95} A ${w*.38} ${h*.42} 0 0 1 ${x+w*.78} ${y+h*.05} Z`;
        return `<path d="${d}" ${common}/>`;
    }
    return '';
}
function gm570LineSvg_(f,ppm){
    const op=gmVet530Opacidades_(f),stroke=f.stroke||gm570_.borderColor,sw=Math.max(1,Number(f.strokeWidth||gmOficinaV2Cfg_.tamanho))*gm554Zoom_();
    const x1=Number(f.x||0)*ppm,y1=Number(f.y||0)*ppm,x2=Number(f.x2??f.x)*ppm,y2=Number(f.y2??f.y)*ppm;
    const id=String(f.id).replace(/'/g,"\\'"),sel=gm570_.selected.type==='shape'&&String(gm570_.selected.id)===String(f.id);
    const common=`fill="none" stroke="${stroke}" stroke-opacity="${op.stroke}" stroke-width="${sw}" stroke-linecap="round" data-vet-id="${gm570Esc_(f.id)}" onpointerdown="gm570ShapeDown_(event,'${id}')"`;
    if(f.tipo==='linha_pontilhada')return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${common} stroke-dasharray="${sw*.3} ${sw*1.8}"/>`;
    if(f.tipo==='linha_sinuosa'){
        const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,parts=10,amp=Math.min(18,L*.07);
        let d=`M ${x1} ${y1}`;
        for(let i=1;i<=parts;i++){const t=i/parts,off=Math.sin(t*Math.PI*6)*amp;d+=` L ${x1+dx*t+nx*off} ${y1+dy*t+ny*off}`;}
        return `<path d="${d}" ${common}/>`;
    }
    if(f.tipo==='linha_curva'){
        const mx=Number(f.cx??((Number(f.x||0)+Number(f.x2??f.x))/2))*ppm,my=Number(f.cy??((Number(f.y||0)+Number(f.y2??f.y))/2))*ppm;
        return `<path d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" ${common}/>`;
    }
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${common}/>`;
}

// Criação de formas customizadas.
const gmVet490PointerCanvas570Base_=gmVet490PointerCanvas_;
gmVet490PointerCanvas_=function(ev){
    const tipo=String(gmVet490_.tool||'');
    const customs=['hexagono','pentagono','losango','estrela','pentagrama','hexagrama','heptagrama','u','coracao','meialua','semicirculo','linha_sinuosa','linha_pontilhada','linha_curva'];
    if(!customs.includes(tipo))return gmVet490PointerCanvas570Base_(ev);
    ev.preventDefault();ev.stopPropagation();gmVet490Hist_();
    const svg=ev.currentTarget,r=svg.getBoundingClientRect(),ppm=gmVet490Ppm_();
    const point=e=>({x:gmVet490Clamp_((e.clientX-r.left)/ppm,0,gmOficinaEstado_.larguraM),y:gmVet490Clamp_((e.clientY-r.top)/ppm,0,gmOficinaEstado_.alturaM)});
    const p0=point(ev),id=gm570Id_('vet');
    const line=tipo.startsWith('linha_');
    const f={id,tipo,x:p0.x,y:p0.y,w:.1,h:.1,x2:p0.x+.1,y2:p0.y+.1,rot:0,
      stroke:gm570_.borderWidth>0?gm570_.borderColor:gmOficinaV2Cfg_.cor,
      fill:gmOficinaV2Cfg_.cor,strokeWidth:line?Math.max(1,gmOficinaV2Cfg_.tamanho):gm570_.borderWidth,
      strokeOpacity:line?gmOficinaV2Cfg_.opacidade:gm570_.borderOpacity,fillOpacity:gmOficinaV2Cfg_.opacidade,
      opacity:1,ordemOficina:Date.now(),radius:.25};
    gmVet490Formas_().push(f);gmVet490Criando_=f;gm570Select_('shape',id);
    const move=e=>{const p=point(e);if(line){f.x2=p.x;f.y2=p.y;if(tipo==='linha_curva'){f.cx=(p0.x+p.x)/2;f.cy=(p0.y+p.y)/2-.5;}}else{f.w=p.x-f.x;f.h=p.y-f.y;}gm570Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmVet490Criando_=null;gmVet490_.tool='select';gmOficinaPersistir_();gm570Render_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};

// Após criação de formas normais, sincroniza propriedades compartilhadas.
const gmVet490Tool570Base_=gmVet490Tool_;
gmVet490Tool_=function(tool){
    gm570PrepareShape_();
    return gmVet490Tool570Base_(tool);
};

// ---------- DESENHOS COMO ELEMENTOS DA MESMA PILHA ----------
function gm570DrawStroke_(ctx,st,ppm,ox=0,oy=0){
    const pts=(st.pts||[]).map(p=>({x:p.x*ppm-ox,y:p.y*ppm-oy}));
    if(!pts.length)return;
    const z=gm554Zoom_(),base=Math.max(1,Number(st.size||7)),size=base*z,color=st.color||'#000',alpha=Math.max(0,Math.min(1,Number(st.opacity??1)));
    const style=st.estilo570||st.brush||st.texture||'redondo';
    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineCap='round';ctx.lineJoin='round';

    const path=(lw=size,jitter=0)=>{
        ctx.lineWidth=lw;ctx.beginPath();
        pts.forEach((p,i)=>{let x=p.x,y=p.y;if(jitter){x+=(labDesenhoRand_(i*71+3)-.5)*jitter;y+=(labDesenhoRand_(i*53+9)-.5)*jitter;}i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
        if(pts.length===1)ctx.lineTo(pts[0].x+.1,pts[0].y+.1);ctx.stroke();
    };
    if(style==='giz'){ // usa algoritmo de giz restaurado
        const mpts=(st.pts||[]).map(p=>({x:p.x-ox/ppm,y:p.y-oy/ppm}));
        gm555Giz_(ctx,mpts,size,color,ppm,base);
    }else if(style==='spray'){
        for(let i=0;i<pts.length;i+=1){const p=pts[i],n=Math.max(5,Math.round(base*.9));for(let k=0;k<n;k++){const a=labDesenhoRand_(i*97+k*13)*Math.PI*2,r=Math.sqrt(labDesenhoRand_(i*193+k*29))*size*.75;ctx.globalAlpha=alpha*(.25+.45*labDesenhoRand_(i*17+k));ctx.beginPath();ctx.arc(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,Math.max(.5,size*.04),0,Math.PI*2);ctx.fill();}}
    }else if(style==='quadrado'){
        for(const p of pts)ctx.fillRect(p.x-size/2,p.y-size/2,size,size);
    }else if(style==='caligrafico'){ctx.lineCap='butt';path(Math.max(1,size*.38));}
    else if(style==='caneta'){path(Math.max(1,size*.32));}
    else if(style==='lapis'){ctx.globalAlpha*=.55;path(Math.max(1,size*.26),size*.08);path(Math.max(.6,size*.12),size*.16);}
    else if(style==='serpentina'){
        if(pts.length>1){ctx.lineWidth=Math.max(1,size*.35);ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++){const p=pts[i],q=pts[i-1],dx=p.x-q.x,dy=p.y-q.y,L=Math.hypot(dx,dy)||1,off=Math.sin(i*.9)*size*.45;ctx.lineTo(p.x-dy/L*off,p.y+dx/L*off);}ctx.stroke();}
    }else if(style==='seta'){path(Math.max(1,size*.35));if(pts.length>1){const a=pts[pts.length-1],b=pts[Math.max(0,pts.length-4)],ang=Math.atan2(a.y-b.y,a.x-b.x),r=size*.9;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-Math.cos(ang-.55)*r,a.y-Math.sin(ang-.55)*r);ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-Math.cos(ang+.55)*r,a.y-Math.sin(ang+.55)*r);ctx.stroke();}}
    else if(style==='curso'){ctx.lineWidth=Math.max(1,size*.28);ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length-1;i++){const mx=(pts[i].x+pts[i+1].x)/2,my=(pts[i].y+pts[i+1].y)/2;ctx.quadraticCurveTo(pts[i].x,pts[i].y,mx,my);}ctx.stroke();}
    else if(style==='giz_cera'){ctx.globalAlpha*=.65;path(size*.72,size*.05);ctx.globalAlpha*=.6;path(size*.35,size*.16);}
    else if(style==='carimbo'){for(let i=0;i<pts.length;i+=Math.max(1,Math.round(base/3))){const p=pts[i];ctx.globalAlpha=alpha*.85;ctx.beginPath();ctx.arc(p.x,p.y,size*.36,0,Math.PI*2);ctx.fill();}}
    else if(style==='pele'){for(let i=0;i<pts.length;i+=2){const p=pts[i];for(let k=0;k<5;k++){const a=(-1.7+labDesenhoRand_(i*11+k)*.9),r=size*(.45+.45*labDesenhoRand_(i*19+k));ctx.globalAlpha=alpha*.45;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r);ctx.stroke();}}}
    else if(style==='esboco'){ctx.globalAlpha*=.35;for(let k=0;k<4;k++)path(Math.max(.6,size*.16),size*.28);}
    else if(style==='espirografo'){for(let i=0;i<pts.length;i+=4){const p=pts[i];ctx.globalAlpha=alpha*.28;ctx.beginPath();ctx.ellipse(p.x,p.y,size*.45,size*.18,i*.37,0,Math.PI*2);ctx.stroke();}}
    else if(style==='teia'){ctx.globalAlpha*=.35;path(Math.max(.6,size*.12));for(let i=6;i<pts.length;i+=7){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[Math.max(0,i-6)].x,pts[Math.max(0,i-6)].y);ctx.stroke();}}
    else if(style==='pontilhada'){for(let i=0;i<pts.length;i+=3){const p=pts[i];ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.6,size*.18),0,Math.PI*2);ctx.fill();}}
    else if(['ranhura','areia','cascalho','grama','folhas','neve','fumaca'].includes(style)){
        // Usa a rotina procedural existente.
        const orig=(st.pts||[]).map(p=>({x:p.x-ox/ppm,y:p.y-oy/ppm}));
        labDesenhoAplicarTextura_(ctx,style,orig,0,size,color,ppm,'redondo');
    }else if(style==='espelhado'){
        path(size);ctx.save();ctx.translate((gmOficinaEstado_.larguraM*ppm)-2*ox,0);ctx.scale(-1,1);path(size);ctx.restore();
    }else if(style==='irregular'){path(size,size*.35);}
    else path(size);
    ctx.restore();
}
function gm570StrokeRaster_(st,ppm){
    const pts=st.pts||[];if(!pts.length)return null;
    const pad=Math.max(12,(Number(st.size||7)*gm554Zoom_())*2.2);
    const xs=pts.map(p=>p.x*ppm),ys=pts.map(p=>p.y*ppm);
    const minX=Math.max(0,Math.min(...xs)-pad),minY=Math.max(0,Math.min(...ys)-pad);
    const maxX=Math.min(gmOficinaEstado_.larguraM*ppm,Math.max(...xs)+pad),maxY=Math.min(gmOficinaEstado_.alturaM*ppm,Math.max(...ys)+pad);
    const w=Math.max(2,Math.ceil(maxX-minX)),h=Math.max(2,Math.ceil(maxY-minY));
    const last=pts[pts.length-1],key=`${st.id}:${ppm}:${st.size}:${st.color}:${st.opacity}:${st.estilo570||st.brush||st.texture}:${pts.length}:${last.x.toFixed(3)}:${last.y.toFixed(3)}`;
    const c=gm570_.strokeCache.get(key);if(c)return c;
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');
    gm570DrawStroke_(ctx,st,ppm,minX,minY);
    const out={href:cv.toDataURL('image/png'),x:minX,y:minY,w,h};
    if(gm570_.strokeCache.size>120)gm570_.strokeCache.clear();
    gm570_.strokeCache.set(key,out);return out;
}
function gm570EraserMask_(ppm,w,h){
    const er=(gmOficinaEstado_.desenhos||[]).filter(d=>(d.estilo570||d.tool)==='borracha'||d.tool==='borracha');
    if(!er.length)return '';
    return `<mask id="gm570EraserMask"><rect x="0" y="0" width="${w}" height="${h}" fill="white"/>${er.map(st=>{
        const pts=st.pts||[];if(!pts.length)return '';
        const d=pts.map((p,i)=>`${i?'L':'M'} ${p.x*ppm} ${p.y*ppm}`).join(' ');
        return `<path d="${d}" fill="none" stroke="black" stroke-width="${Math.max(1,Number(st.size||7)*gm554Zoom_())}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('')}</mask>`;
}
function gm570DrawSvg_(d,ppm){
    if((d.estilo570||d.tool)==='borracha'||d.tool==='borracha')return '';
    const r=gm570StrokeRaster_(d,ppm);if(!r)return '';
    const id=String(d.id).replace(/'/g,"\\'"),sel=gm570_.selected.type==='draw'&&String(gm570_.selected.id)===String(d.id);
    const sh=gm553ShadowCss_(d);
    return `<g data-draw-id="${gm570Esc_(d.id)}" onpointerdown="gm570DrawDown_(event,'${id}')" style="pointer-events:auto;cursor:default;${sh?`filter:${sh};`:''}">
      <image href="${r.href}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" opacity="1" mask="url(#gm570EraserMask)"/>
      ${sel?`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="#41d9f5" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" pointer-events="none"/>`:''}
    </g>`;
}

// Nova gravação: cada traço recebe id + ordem + estilo.
window.gmOficinaV2PointerDown_=function(ev){
    if(!gmOficinaV2Cfg_.ativo||ev.button===2)return;
    ev.preventDefault();ev.stopPropagation();gmOficinaV2Historico_();
    const cv=document.getElementById('gmOficinaV2Canvas'),rect=cv.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    const point=e=>({x:Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-rect.left)/ppm)),y:Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-rect.top)/ppm))});
    gmOficinaV2Stroke_={id:gm570Id_('draw'),ordemOficina:Date.now(),tool:gmOficinaV2Cfg_.ferramenta,color:gmOficinaV2Cfg_.cor,size:gmOficinaV2Cfg_.tamanho,opacity:gmOficinaV2Cfg_.opacidade,brush:gmOficinaV2Cfg_.pincel,texture:gmOficinaV2Cfg_.texturaTraco,estilo570:gmOficinaV2Cfg_.estilo570||'redondo',pts:[point(ev)]};
    gmOficinaEstado_.desenhos.push(gmOficinaV2Stroke_);
    const move=e=>{const p=point(e),last=gmOficinaV2Stroke_.pts.at(-1),dx=(p.x-last.x)*ppm,dy=(p.y-last.y)*ppm;if(dx*dx+dy*dy<2.2)return;gmOficinaV2Stroke_.pts.push(p);gm570_.strokeCache.clear();gm570Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaV2Stroke_=null;gmOficinaPersistir_();gm570Render_();gmOficinaV2Status_();};
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up,{once:true});
};

// O canvas antigo vira apenas superfície de captura; não pinta conteúdo final.
gmOficinaV2DesenharCanvas_=function(){
    const cv=document.getElementById('gmOficinaV2Canvas');if(!cv)return;
    const ppm=gmOficinaV2Ppm_(),w=Math.round(gmOficinaEstado_.larguraM*ppm),h=Math.round(gmOficinaEstado_.alturaM*ppm);
    if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;
    cv.getContext('2d').clearRect(0,0,w,h);
};

// ---------- RENDER UNIFICADO ----------
function gm570ObjectSvg_(o,ppm){
    const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(o.modeloId)),img=o.imagem||m?.imagem||'';
    const w=Math.max(.05,Number(o.larguraM||1))*ppm,h=Math.max(.05,Number(o.alturaM||1))*ppm,x=Number(o.x||0)*ppm-w/2,y=Number(o.y||0)*ppm-h/2,cx=x+w/2,cy=y+h/2;
    const id=String(o.id).replace(/'/g,"\\'"),rot=Number(o.angulo||0),sel=gm570_.selected.type==='object'&&String(gm570_.selected.id)===String(o.id),sh=gm553ShadowCss_(o);
    return `<g data-of2="${gm570Esc_(o.id)}" transform="rotate(${rot} ${cx} ${cy})" onpointerdown="gm570ObjectDown_(event,'${id}')" style="pointer-events:auto;cursor:default;${sh?`filter:${sh};`:''}">
      ${img?`<image href="${gm570Esc_(img)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" opacity="1"/>`:`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#777"/>`}
      ${sel?`<rect x="${x-2}" y="${y-2}" width="${w+4}" height="${h+4}" fill="none" stroke="#41d9f5" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>`:''}
    </g>`;
}
function gm570BaseShapeSvg_(f,ppm){
    if(f.tipo.startsWith('linha'))return gm570LineSvg_(f,ppm);
    const extra=gm570ExtraShapeSvg_(f,ppm);if(extra)return extra;
    // força evento novo no SVG já produzido
    let h=gmVet490SvgEl_(f,ppm);
    const id=String(f.id).replace(/'/g,"\\'");
    h=h.replace(/onpointerdown="[^"]*"/,`onpointerdown="gm570ShapeDown_(event,'${id}')"`);
    return h;
}
function gm570Handles_(f,ppm){
    if(!f||f.tipo.startsWith('linha')){
        if(f?.tipo==='linha_curva'&&gm570_.edit){
            const cx=Number(f.cx??((Number(f.x)+Number(f.x2))/2))*ppm,cy=Number(f.cy??((Number(f.y)+Number(f.y2))/2))*ppm;
            return `<circle cx="${cx}" cy="${cy}" r="7" fill="#fff" stroke="#19cfe8" stroke-width="2" onpointerdown="gm570CurveHandle_(event,'${String(f.id).replace(/'/g,"\\'")}')" style="cursor:move"/>`;
        }
        return '';
    }
    const x=Number(f.x||0)*ppm,y=Number(f.y||0)*ppm,w=Number(f.w||0)*ppm,h=Number(f.h||0)*ppm,cx=x+w/2,cy=y+h/2;
    let out=`<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y-28}" stroke="#19cfe8" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
      <circle cx="${cx}" cy="${y-32}" r="7" fill="#fff" stroke="#19cfe8" stroke-width="2" onpointerdown="gm570RotateHandle_(event,'${String(f.id).replace(/'/g,"\\'")}')" style="cursor:grab"/>`;
    if(gm570_.edit){
        const hs=[['nw',x,y],['n',cx,y],['ne',x+w,y],['e',x+w,cy],['se',x+w,y+h],['s',cx,y+h],['sw',x,y+h],['w',x,cy]];
        out+=hs.map(q=>`<circle cx="${q[1]}" cy="${q[2]}" r="6" fill="#fff" stroke="#19cfe8" stroke-width="2" onpointerdown="gm570ResizeHandle_(event,'${String(f.id).replace(/'/g,"\\'")}','${q[0]}')" style="cursor:nwse-resize"/>`).join('');
        if(f.tipo==='arredondado'||f.tipo==='retangulo'){
            const rr=Math.max(0,Number(f.radius||0))*ppm;
            out+=`<circle cx="${x+Math.min(Math.abs(w)/2,rr+12)}" cy="${y+12}" r="6" fill="#ffd54a" stroke="#222" stroke-width="1.5" onpointerdown="gm570RadiusHandle_(event,'${String(f.id).replace(/'/g,"\\'")}')" style="cursor:ew-resize"/>`;
        }
    }
    return out;
}
function gm570Render_(){
    const map=document.getElementById('gmOficinaV2Map');if(!map)return;
    gm570EnsureOrder_();
    let svg=document.getElementById('gmOficinaVectorLayer');
    if(!svg){svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='gmOficinaVectorLayer';map.appendChild(svg);}
    const ppm=gmOficinaV2Ppm_(),w=gmOficinaEstado_.larguraM*ppm,h=gmOficinaEstado_.alturaM*ppm;
    svg.setAttribute('width',w);svg.setAttribute('height',h);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    svg.style.cssText=`position:absolute;inset:0;width:${w}px;height:${h}px;z-index:8;pointer-events:auto;touch-action:none`;
    svg.onpointerdown=gmVet490PointerCanvas_;
    const defs=`<defs>${gm570EraserMask_(ppm,w,h)}</defs>`;
    const items=gm570Items_().map(it=>it.type==='draw'?gm570DrawSvg_(it.ref,ppm):it.type==='shape'?gm570BaseShapeSvg_(it.ref,ppm):gm570ObjectSvg_(it.ref,ppm)).join('');
    const sel=gm570SelectedRef_();
    const handles=sel?.type==='shape'?gm570Handles_(sel.ref,ppm):'';
    svg.innerHTML=defs+items+handles;

    const cv=document.getElementById('gmOficinaV2Canvas');
    if(cv){cv.style.zIndex='20';cv.style.pointerEvents=gmOficinaV2Cfg_.ativo?'auto':'none';cv.style.cursor=gmOficinaV2Cfg_.ativo?(gmOficinaV2Cfg_.ferramenta==='borracha'?'cell':'crosshair'):'default';}
    const old=document.getElementById('gmOficinaV2Objects');if(old){old.style.display='none';old.innerHTML='';}
    gm570Inspector_();
}

// Override renderers antigos.
gmVet490Render_=gm570Render_;
gmOficinaV2RenderObjetos_=gm570Render_;

// ---------- SELEÇÃO, MOVIMENTO, EDIÇÃO ----------
window.gm570ShapeDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();const f=gmVet490Forma_(id);if(!f)return;
    gm570Select_('shape',id);
    if(!ev.ctrlKey)return;
    gmVet490Hist_();
    const map=document.getElementById('gmOficinaV2Map'),r=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY;
    const start={x:Number(f.x||0),y:Number(f.y||0),x2:Number(f.x2??f.x),y2:Number(f.y2??f.y),cx:Number(f.cx||0),cy:Number(f.cy||0)};
    const move=e=>{const dx=(e.clientX-sx)/ppm,dy=(e.clientY-sy)/ppm;f.x=start.x+dx;f.y=start.y+dy;if(f.tipo.startsWith('linha')){f.x2=start.x2+dx;f.y2=start.y2+dy;if(f.tipo==='linha_curva'){f.cx=start.cx+dx;f.cy=start.cy+dy;}}gm570Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
window.gm570ObjectDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));if(!o)return;
    gm570Select_('object',id);if(!ev.ctrlKey)return;
    gmOficinaV2Historico_();const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY,ox=Number(o.x||0),oy=Number(o.y||0);
    const move=e=>{o.x=ox+(e.clientX-sx)/ppm;o.y=oy+(e.clientY-sy)/ppm;gm570Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
window.gm570DrawDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();const d=(gmOficinaEstado_.desenhos||[]).find(x=>String(x.id)===String(id));if(!d)return;
    gm570Select_('draw',id);if(!ev.ctrlKey)return;
    gmOficinaV2Historico_();const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY,orig=(d.pts||[]).map(p=>({...p}));
    const move=e=>{const dx=(e.clientX-sx)/ppm,dy=(e.clientY-sy)/ppm;d.pts=orig.map(p=>({x:p.x+dx,y:p.y+dy}));gm570_.strokeCache.clear();gm570Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
window.gm570RotateHandle_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();const f=gmVet490Forma_(id);if(!f)return;
    gmVet490Hist_();const map=document.getElementById('gmOficinaV2Map'),r=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    const cx=(Number(f.x||0)+Number(f.w||0)/2)*ppm+r.left,cy=(Number(f.y||0)+Number(f.h||0)/2)*ppm+r.top;
    const move=e=>{f.rot=(Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90+360)%360;gm570Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
window.gm570ResizeHandle_=function(ev,id,which){
    ev.preventDefault();ev.stopPropagation();const f=gmVet490Forma_(id);if(!f)return;
    gmVet490Hist_();const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY,st={x:Number(f.x),y:Number(f.y),w:Number(f.w),h:Number(f.h)};
    const move=e=>{const dx=(e.clientX-sx)/ppm,dy=(e.clientY-sy)/ppm;
      if(which.includes('e'))f.w=Math.max(.05,st.w+dx);
      if(which.includes('s'))f.h=Math.max(.05,st.h+dy);
      if(which.includes('w')){f.x=st.x+dx;f.w=Math.max(.05,st.w-dx);}
      if(which.includes('n')){f.y=st.y+dy;f.h=Math.max(.05,st.h-dy);}
      gm570Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
window.gm570RadiusHandle_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();const f=gmVet490Forma_(id);if(!f)return;
    gmVet490Hist_();const map=document.getElementById('gmOficinaV2Map'),r=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_(),x=Number(f.x)*ppm+r.left,max=Math.min(Math.abs(Number(f.w)),Math.abs(Number(f.h)))/2;
    const move=e=>{f.radius=Math.max(0,Math.min(max,(e.clientX-x)/ppm));gm570Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
window.gm570CurveHandle_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();const f=gmVet490Forma_(id);if(!f)return;
    const map=document.getElementById('gmOficinaV2Map'),r=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    const move=e=>{f.cx=(e.clientX-r.left)/ppm;f.cy=(e.clientY-r.top)/ppm;gm570Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
window.gm570ToggleEdit_=function(){gm570_.edit=!gm570_.edit;const b=document.getElementById('gm570EditBtn');if(b)b.classList.toggle('btn-select',gm570_.edit);gm570Render_();};

// ---------- AÇÕES COMUNS ----------
function gm570MoveOrder_(dir){
    const sel=gm570SelectedRef_();if(!sel)return;
    const a=gm570Items_(),i=a.findIndex(x=>x.type===sel.type&&String(x.id)===String(sel.id)),j=Math.max(0,Math.min(a.length-1,i+dir));if(i<0||i===j)return;
    const t=a[i].ref.ordemOficina;a[i].ref.ordemOficina=a[j].ref.ordemOficina;a[j].ref.ordemOficina=t;gmOficinaPersistir_();gm570Render_();
}
window.gm570Front_=()=>gm570MoveOrder_(1);
window.gm570Back_=()=>gm570MoveOrder_(-1);
window.gm570Duplicate_=function(){
    const sel=gm570SelectedRef_();if(!sel)return;const cp=JSON.parse(JSON.stringify(sel.ref));cp.id=gm570Id_(sel.type);cp.ordemOficina=Date.now()+1;
    if(sel.type==='shape'){cp.x=Number(cp.x||0)+.5;cp.y=Number(cp.y||0)+.5;if(cp.x2!=null){cp.x2+=.5;cp.y2+=.5;}gmVet490Formas_().push(cp);}
    if(sel.type==='object'){cp.x=Number(cp.x||0)+.5;cp.y=Number(cp.y||0)+.5;(gmOficinaEstado_.objetos||[]).push(cp);}
    if(sel.type==='draw'){cp.pts=(cp.pts||[]).map(p=>({x:p.x+.5,y:p.y+.5}));(gmOficinaEstado_.desenhos||[]).push(cp);}
    gm570Select_(sel.type,cp.id);gmOficinaPersistir_();
};
window.gm570Delete_=function(){
    const sel=gm570SelectedRef_();if(!sel)return;
    if(sel.type==='shape')gmOficinaEstado_.formas=(gmVet490Formas_()||[]).filter(x=>String(x.id)!==String(sel.id));
    if(sel.type==='object')gmOficinaEstado_.objetos=(gmOficinaEstado_.objetos||[]).filter(x=>String(x.id)!==String(sel.id));
    if(sel.type==='draw')gmOficinaEstado_.desenhos=(gmOficinaEstado_.desenhos||[]).filter(x=>String(x.id)!==String(sel.id));
    gm570_.selected={type:'',id:''};gm570_.strokeCache.clear();gmOficinaPersistir_();gm570Render_();
};

// ---------- MULTI-OBJETO ----------
window.gm570AddObjects_=function(){
    const sel=document.getElementById('gm570ObjMulti');if(!sel)return;
    const ids=[...sel.selectedOptions].map(o=>o.value);if(!ids.length)return;
    gmOficinaV2Historico_();
    let n=0;
    for(const id of ids){
        const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(id));if(!m)continue;
        const o={...JSON.parse(JSON.stringify(m)),id:gm570Id_('ofobj'),modeloId:m.id,x:gmOficinaEstado_.larguraM/2+(n%5)*.65,y:gmOficinaEstado_.alturaM/2+Math.floor(n/5)*.65,angulo:0,ordemOficina:Date.now()+n};
        gmOficinaEstado_.objetos.push(o);n++;
    }
    gmOficinaPersistir_();gm570Render_();
};

// ---------- CLIPBOARD INTERNO + IMAGEM EXTERNA ----------
function gm570CopySelected_(){
    const s=gm570SelectedRef_();if(!s)return false;
    gm570_.internalClipboard={type:s.type,data:JSON.parse(JSON.stringify(s.ref))};return true;
}
function gm570PasteInternal_(){
    const c=gm570_.internalClipboard;if(!c)return false;
    const d=JSON.parse(JSON.stringify(c.data));d.id=gm570Id_(c.type);d.ordemOficina=Date.now();
    if(c.type==='shape'){d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;if(d.x2!=null){d.x2+=.5;d.y2+=.5;}gmVet490Formas_().push(d);}
    else if(c.type==='object'){d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;gmOficinaEstado_.objetos.push(d);}
    else {d.pts=(d.pts||[]).map(p=>({x:p.x+.5,y:p.y+.5}));gmOficinaEstado_.desenhos.push(d);}
    gm570Select_(c.type,d.id);gmOficinaPersistir_();return true;
}
async function gm570AddClipboardImage_(file){
    const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});
    const dims=await new Promise(res=>{const im=new Image();im.onload=()=>res([im.naturalWidth||1,im.naturalHeight||1]);im.onerror=()=>res([1,1]);im.src=data;});
    const base=3,ratio=dims[0]/dims[1],w=ratio>=1?base:base*ratio,h=ratio>=1?base/ratio:base;
    const o={id:gm570Id_('ofobj'),nome:'Imagem colada',imagem:data,x:gmOficinaEstado_.larguraM/2,y:gmOficinaEstado_.alturaM/2,larguraM:Math.max(.4,w),alturaM:Math.max(.4,h),angulo:0,ordemOficina:Date.now(),sombraOficina:'nenhuma'};
    gmOficinaEstado_.objetos.push(o);gm570Select_('object',o.id);gmOficinaPersistir_();
}
document.addEventListener('copy',e=>{
    if(!document.getElementById('gmOficinaV2Map'))return;
    if(gm570CopySelected_()){e.preventDefault();try{e.clipboardData.setData('text/plain','MesaEstelar:Object');}catch(_){}}
});
document.addEventListener('cut',e=>{
    if(!document.getElementById('gmOficinaV2Map'))return;
    if(gm570CopySelected_()){e.preventDefault();gm570Delete_();}
});
document.addEventListener('paste',e=>{
    if(!document.getElementById('gmOficinaV2Map'))return;
    const items=[...(e.clipboardData?.items||[])];
    const img=items.find(i=>i.type?.startsWith('image/'));
    if(img){e.preventDefault();const f=img.getAsFile();if(f)gm570AddClipboardImage_(f);return;}
    if(gm570_.internalClipboard){e.preventDefault();gm570PasteInternal_();}
});
document.addEventListener('keydown',e=>{
    if(!document.getElementById('gmOficinaV2Map'))return;
    if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='d'){e.preventDefault();gm570Duplicate_();}
    if(e.key==='Delete'&&document.activeElement?.tagName!=='INPUT'&&document.activeElement?.tagName!=='TEXTAREA'){e.preventDefault();gm570Delete_();}
});

// ---------- INSPECTOR + SOMBRA PRESERVADA ----------
function gm570Inspector_(){
    const box=document.getElementById('gm570Inspector');if(!box)return;
    const sel=gm570SelectedRef_();
    if(!sel){box.innerHTML='<span style="color:#9fb4c8">Selecione uma forma, desenho ou objeto. Segure Ctrl para arrastar.</span>';return;}
    const x=sel.ref;
    const hasShadow=sel.type!=='draw'||true;
    box.innerHTML=`
      <strong style="color:#ffd54a">${sel.type==='shape'?'Forma':sel.type==='object'?'Objeto':'Desenho'}: ${gm570Esc_(x.nome||x.tipo||'selecionado')}</strong>
      <label style="margin:0"><small>Sombra</small><select onchange="gm570Shadow_('sombraOficina',this.value)">
        ${['nenhuma','suave','media','forte'].map(v=>`<option value="${v}" ${String(x.sombraOficina||'nenhuma')===v?'selected':''}>${v==='media'?'média':v}</option>`).join('')}
      </select></label>
      <label style="margin:0"><small>Direção</small><select onchange="gm570Shadow_('sombraDirecao',this.value)">
        ${['N','NE','E','SE','S','SO','O','NO'].map(v=>`<option ${String(x.sombraDirecao||'SE')===v?'selected':''}>${v}</option>`).join('')}
      </select></label>
      <label style="margin:0"><small>Distância</small><input type="number" min="1" max="30" value="${Number(x.sombraDist||4)}" onchange="gm570Shadow_('sombraDist',this.value)" style="width:70px"></label>
      ${sel.type==='object'?`<label style="margin:0"><small>Rotação°</small><input type="number" value="${Number(x.angulo||0)}" onchange="gm570ObjectRot_(this.value)" style="width:76px"></label>`:''}
      ${sel.type==='shape'&&!String(x.tipo).startsWith('linha')?`<label style="margin:0"><small>Rotação°</small><input type="number" value="${Number(x.rot||0)}" onchange="gm570ShapeRot_(this.value)" style="width:76px"></label>`:''}`;
}
window.gm570Shadow_=function(k,v){const s=gm570SelectedRef_();if(!s)return;s.ref[k]=k==='sombraDist'?Number(v):v;gmOficinaPersistir_();gm570Render_();};
window.gm570ObjectRot_=function(v){const s=gm570SelectedRef_();if(s?.type==='object'){s.ref.angulo=Number(v)||0;gmOficinaPersistir_();gm570Render_();}};
window.gm570ShapeRot_=function(v){const s=gm570SelectedRef_();if(s?.type==='shape'){s.ref.rot=Number(v)||0;gmOficinaPersistir_();gm570Render_();}};

// ---------- PATCH DE CRIAÇÃO NORMAL ----------
const gmVet490PointerCanvas571Base_=gmVet490PointerCanvas_;
gmVet490PointerCanvas_=function(ev){
    const before=new Set((gmVet490Formas_()||[]).map(x=>String(x.id)));
    gmVet490PointerCanvas571Base_(ev);
    setTimeout(()=>{
        const novo=(gmVet490Formas_()||[]).find(x=>!before.has(String(x.id)));
        if(novo){
            novo.ordemOficina=Date.now();
            novo.fill=gmOficinaV2Cfg_.cor;
            novo.fillOpacity=gmOficinaV2Cfg_.opacidade;
            novo.stroke=gm570_.borderColor;
            novo.strokeOpacity=gm570_.borderOpacity;
            novo.strokeWidth=gm570_.borderWidth;
            novo.opacity=1;
            if(novo.tipo==='linha'){novo.stroke=gmOficinaV2Cfg_.cor;novo.strokeOpacity=gmOficinaV2Cfg_.opacidade;novo.strokeWidth=Math.max(1,gmOficinaV2Cfg_.tamanho);}
            gm570Select_('shape',novo.id);gmOficinaPersistir_();
        }
    },0);
};

// ---------- RENDER/INSTALAÇÃO ----------
const gmOficinaRender570Base_=gmOficinaRender_;
gmOficinaRender_=function(){
    const r=gmOficinaRender570Base_();
    try{
        const root=document.getElementById('gm-sub-oficina-mapas'),view=document.getElementById('gmOficinaV2Viewport');
        if(root&&view&&!document.getElementById('gm570Toolbar'))gm570BuildUI_();
        const legacy=document.getElementById('gmVet490Tools');if(legacy)legacy.style.display='none';
        gm570EnsureOrder_();gmOficinaV2DesenharCanvas_();gm570Render_();gm570PopulateObjects_();gm570Sync_();
    }catch(e){console.warn('Oficina 46.57',e);}
    return r;
};

// Esconde os controles antigos assim que a nova barra existir.
const gmVet490InstalarUI570Base_=gmVet490InstalarUI_;
gmVet490InstalarUI_=function(){
    try{gmVet490InstalarUI570Base_();}catch(_){}
    const p=document.getElementById('gmVet490Tools');if(p)p.style.display='none';
    if(!document.getElementById('gm570Toolbar'))gm570BuildUI_();
};

// Novo mapa mantém os novos defaults.
const gmOficinaV2Novo570Base_=window.gmOficinaV2Novo_;
window.gmOficinaV2Novo_=function(){
    gm570_.edit=false;gm570_.selected={type:'',id:''};gm570_.strokeCache.clear();
    return gmOficinaV2Novo570Base_();
};

// Salvar encerra edição.
const gmOficinaSalvar570Base_=window.gmOficinaSalvarComoMapa_;
window.gmOficinaSalvarComoMapa_=async function(){
    gm570_.edit=false;gm570_.selected={type:'',id:''};gm570Render_();
    return gmOficinaSalvar570Base_();
};

// CSS
if(!document.getElementById('gm570Css')){
    const st=document.createElement('style');st.id='gm570Css';
    st.textContent=`
      #gm570Toolbar select,#gm570Toolbar input{max-width:100%}
      #gm570Toolbar small{display:block;color:#b9c9d6;margin-bottom:2px}
      #gm570Toolbar button{white-space:nowrap}
      #gmOficinaV2Canvas{background:transparent!important}
    `;
    document.head.appendChild(st);
}

setTimeout(()=>{try{gm570BuildUI_();gm570EnsureOrder_();gmOficinaPersistir_();gm570Render_();}catch(e){console.warn(e)}},400);



// ============================================================
// V46.77.0 — reconstrução limpa da barra da Oficina
// Base: 46.77.0 funcional. Não usa varredura agressiva do DOM.
// ============================================================
const gm573_ = {
  mode:'select',
  selection:new Set(),
  borderColor:'#111111',
  borderWidth:0,
  borderOpacity:1
};

function gm573Key_(t,id){ return `${t}§${id}`; }
function gm573Esc_(v){ return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function gm573LegacyPanel_(){
  // Painel original imediatamente antes do viewport. Escondemos SOMENTE ele.
  const view=document.getElementById('gmOficinaV2Viewport');
  if(!view)return null;
  let p=view.previousElementSibling;
  while(p){
    if(p.id==='gm573Toolbar') return null;
    if(p.id==='gmVet490Tools' || p.querySelector?.('#gmOficinaV2Size,#gmOficinaV2Tool,#gmOficinaV2Objeto')) return p;
    p=p.previousElementSibling;
  }
  return null;
}

function gm573ToolbarHtml_(){
 const basic=['#FFFFFF','#111111','#FF5252','#FFCF4D','#56F08A','#45B7FF','#B56CFF'];
 const tools=[
 ['select','Selecionar'],
 ['redondo','Pincel'],['quadrado','Pincel de ladrilhos'],['espelhado','Pincel espelhado'],
 ['caligrafico','Caligrafia'],['caneta','Caneta'],['lapis','Lápis'],['serpentina','Serpentina'],
 ['seta','Seta'],['curso','Curso / curva livre'],['giz_cera','Giz'],['spray','Tinta spray'],
 ['carimbo','Carimbo'],['pele','Pele / pelos'],['esboco','Esboço'],['espirografo','Espirógrafo'],
 ['teia','Teia'],['irregular','Irregular'],['pontilhada','Pontilhado'],
 ['ranhura','Ranhura'],['areia','Areia'],['cascalho','Cascalho'],['grama','Grama'],
 ['folhas','Folhas'],['neve','Neve'],['fumaca','Fumaça'],['borracha','Borracha']
 ];
 const other=[
 ['hexagono','Hexágono'],['pentagono','Pentágono'],['losango','Losango'],['estrela','Estrela'],
 ['pentagrama','Pentagrama'],['hexagrama','Hexagrama'],['heptagrama','Heptagrama'],['u','U'],
 ['coracao','Coração'],['meialua','Meia-lua'],['semicirculo','Semicírculo']
 ];
 return `<div id="gm573Toolbar" style="display:flex;flex-direction:column;gap:9px;margin:8px 0 10px;padding:10px;border:1px solid rgba(126,231,255,.20);border-radius:11px;background:rgba(0,0,0,.13)">
 <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
   <label><small>Tamanho</small><select id="gm573Size" onchange="gmOficinaV2Tamanho_(this.value)">
    <option value="10x10">10 × 10 m</option><option value="20x12">20 × 12 m</option><option value="28x14">28 × 14 m</option><option value="36x20">36 × 20 m</option><option value="50x30">50 × 30 m</option><option value="50x40">50 × 40 m</option>
   </select></label>
   <label><small>Escala</small><select id="gm573Scale" onchange="gmOficinaV2Escala_(this.value)">${[18,24,32,40,48,60,72].map(x=>`<option value="${x}">${x} px/m</option>`).join('')}</select></label>
   <label><small>Fundo</small><input id="gm573Bg" type="color" onchange="gmOficinaV2Fundo_(this.value)"></label>
   <label><small>Grade</small><input id="gm573GridColor" type="color" onchange="gmOficinaV2GradeCor_(this.value)"></label>
   <label style="display:flex;gap:5px;align-items:center"><input id="gm573Grid" type="checkbox" onchange="gmOficinaV2GradeVis_(this.checked)"> Mostrar grade</label>
   <label><small>Textura do terreno</small><select id="gm573Terrain" onchange="gmOficinaV2Terreno_(this.value)" style="width:190px">
    <option value="nenhuma">Nenhuma</option><option value="concreto">Concreto</option><option value="areia">Areia</option><option value="terra">Terra</option><option value="grama">Grama</option><option value="floresta">Floresta</option><option value="rochas">Rochas</option><option value="neve">Neve</option><option value="agua">Água</option><option value="vulcanico">Vulcânico</option><option value="metal">Metal / nave</option><option value="ruinas">Ruínas</option><option value="alien">Biomassa alienígena</option><option value="nevoa">Névoa</option>
   </select></label>
   <button class="btn-small" onclick="gmOficinaV2Undo_()">↶</button><button class="btn-small" onclick="gmOficinaV2Redo_()">↷</button>
 </div>

 <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.08);padding-top:7px">
   <label><small>Ferramenta</small><select id="gm573Tool" onchange="gm573Tool_(this.value)" style="min-width:220px">${tools.map((x,i)=>`<option value="${x[0]}" ${i===0?'selected':''}>${x[1]}</option>`).join('')}</select></label>
   <label><small>Prévia</small><canvas id="gm573Preview" width="150" height="38" style="width:150px;height:38px;border:1px solid rgba(255,255,255,.18);border-radius:7px;background:rgba(255,255,255,.06)"></canvas></label>
 </div>

 <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
   <strong style="color:#cfeeff;align-self:center">Preenchimento / traço</strong>
   <label><small>Cor</small><input id="gm573Color" type="color" value="#111111" onchange="gm573Color_(this.value)"></label>
   <label><small>RGB</small><input id="gm573Rgb" type="text" value="17/17/17" onchange="gm573Rgb_(this.value)" style="width:100px"></label>
   <label><small>HEX</small><input id="gm573Hex" type="text" value="#111111" maxlength="7" onchange="gm573Color_(this.value)" style="width:86px"></label>
   <span style="display:flex;gap:3px;padding-bottom:7px">${basic.map(c=>`<button onclick="gm573Color_('${c}')" style="width:21px;height:21px;min-width:21px;padding:0;border-radius:50%;background:${c}"></button>`).join('')}</span>
   <label><small>Tamanho</small><input id="gm573BrushSize" type="range" min="1" max="100" value="7" oninput="gm573BrushSize_(this.value)" style="width:110px"><span id="gm573BrushSizeVal">7</span></label>
   <label><small>Opacidade</small><input id="gm573Opacity" type="range" min="0" max="100" value="100" oninput="gm573Opacity_(this.value)" style="width:100px"><span id="gm573OpacityVal">100%</span></label>
 </div>

 <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
   <strong style="color:#ffd54a;align-self:center">Borda</strong>
   <label><small>Cor</small><input id="gm573BorderColor" type="color" value="#111111" onchange="gm573BorderColor_(this.value)"></label>
   <label><small>RGB</small><input id="gm573BorderRgb" type="text" value="17/17/17" onchange="gm573BorderRgb_(this.value)" style="width:100px"></label>
   <label><small>HEX</small><input id="gm573BorderHex" type="text" value="#111111" maxlength="7" onchange="gm573BorderColor_(this.value)" style="width:86px"></label>
   <label><small>Grossura</small><input id="gm573BorderWidth" type="range" min="0" max="20" value="0" oninput="gm573BorderWidth_(this.value)" style="width:100px"><span id="gm573BorderWidthVal">0</span></label>
   <label><small>Opacidade</small><input id="gm573BorderOpacity" type="range" min="0" max="100" value="100" oninput="gm573BorderOpacity_(this.value)" style="width:100px"><span id="gm573BorderOpacityVal">100%</span></label>
 </div>

 <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.08);padding-top:7px">
   <strong style="color:#cfeeff;align-self:center">Linhas</strong>
   <select id="gm573Line" onchange="gm573Line_(this.value)"><option value="">— escolher —</option><option value="linha">Linha reta</option><option value="linha_sinuosa">Linha sinuosa</option><option value="linha_pontilhada">Linha pontilhada</option><option value="linha_curva">Linha com ponto de curva</option></select>
 </div>

 <div style="display:flex;gap:7px;align-items:end;flex-wrap:wrap">
   <strong style="color:#cfeeff;align-self:center">Formas</strong>
   <button class="btn-small" onclick="gm573Shape_('retangulo')">▭ Retângulo</button>
   <button class="btn-small" onclick="gm573Shape_('arredondado')">▢ Retângulo arredondado</button>
   <button class="btn-small" onclick="gm573Shape_('quadrado')">□ Quadrado</button>
   <button class="btn-small" onclick="gm573Shape_('triangulo')">△ Triângulo</button>
   <button class="btn-small" onclick="gm573Shape_('circulo')">○ Círculo</button>
   <button class="btn-small" onclick="gm573Shape_('elipse')">⬭ Elipse</button>
   <label><small>Outras formas</small><select id="gm573Other" onchange="if(this.value){gm573Shape_(this.value);this.value=''}"><option value="">— escolher —</option>${other.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></label>
 </div>

 <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:7px">
   <div style="display:flex;justify-content:space-between;align-items:center;max-width:650px"><strong style="color:#cfeeff">Objetos do banco</strong><label style="font-size:.82em"><input type="checkbox" onchange="gm573CheckAll_(this.checked)"> Selecionar todos</label></div>
   <div id="gm573ObjectBank" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px;max-width:650px;max-height:150px;overflow:auto;padding:5px;border:1px solid rgba(255,255,255,.1);border-radius:7px"></div>
   <button class="btn-small" style="margin-top:6px" onclick="gm573AddObjects_()">＋ Adicionar marcados</button>
 </div>

 <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.08);padding-top:7px">
   <button id="gm573EditBtn" class="btn-small" onclick="gm570ToggleEdit_?.()">✥ Editar forma</button>
   <button class="btn-small" onclick="gm570Front_?.()">⬆ Frente</button><button class="btn-small" onclick="gm570Back_?.()">⬇ Trás</button>
   <button class="btn-small" onclick="gm570Duplicate_?.()">⧉ Duplicar</button><button class="btn-small btn-danger" onclick="gm570Delete_?.()">🗑 Excluir</button>
   <span style="font-size:.82em;color:#9fb4c8">Selecionar é o padrão. Ctrl+arrastar move. Ctrl+C / Ctrl+V copia e cola.</span>
 </div>
 <div id="gm573Inspector"></div>
 </div>`;
}

function gm573Build_(){
 const view=document.getElementById('gmOficinaV2Viewport');
 if(!view || document.getElementById('gm573Toolbar')) return;
 const legacy=gm573LegacyPanel_();
 if(legacy) legacy.style.display='none';
 view.insertAdjacentHTML('beforebegin',gm573ToolbarHtml_());
 gm573PopulateBank_();
 gm573Sync_();
 gm573Tool_('select');
}

function gm573PopulateBank_(){
 const box=document.getElementById('gm573ObjectBank'); if(!box)return;
 const lista=[...(window.objetosMapaDB||[])].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
 box.innerHTML=lista.map(o=>`<label style="display:flex;align-items:center;gap:5px;font-size:.83em;padding:3px 4px;background:rgba(255,255,255,.035);border-radius:4px"><input class="gm573Obj" type="checkbox" value="${gm573Esc_(o.id)}"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${gm573Esc_(o.nome||o.id)}</span></label>`).join('');
}
window.gm573CheckAll_=v=>document.querySelectorAll('.gm573Obj').forEach(x=>x.checked=!!v);
window.gm573AddObjects_=function(){
 const ids=[...document.querySelectorAll('.gm573Obj:checked')].map(x=>x.value); if(!ids.length)return;
 ids.forEach((id,i)=>{
   const sel=document.getElementById('gmOficinaV2Objeto'); if(sel){sel.value=id; gmOficinaV2AdicionarObjeto_?.();}
 });
 gm573PopulateBank_();
};

function gm573SetLegacy_(id,val,evt='change'){
 const el=document.getElementById(id); if(!el)return;
 el.value=val; el.dispatchEvent(new Event(evt,{bubbles:true}));
}
window.gm573Tool_=function(v){
 gm573_.mode=v;
 const free=v!=='select';
 if(v==='select'){
   if(window.gm570_) gm570_.mode='select';
   if(window.gmOficinaV2Cfg_) gmOficinaV2Cfg_.ativo=false;
   gm573SetLegacy_('gmOficinaV2Tool','traco');
 } else {
   gm573SetLegacy_('gmOficinaV2Tool','traco');
   gm573SetLegacy_('gmOficinaV2StrokeStyle',v);
   if(window.gmOficinaV2Cfg_) gmOficinaV2Cfg_.ativo=true;
 }
 const cv=document.getElementById('gmOficinaV2Canvas');
 if(cv)cv.style.pointerEvents=free?'auto':'none';
 gm573Preview_();
};
window.gm573Line_=function(v){
 if(!v)return;
 if(typeof gm570LineTool_==='function')gm570LineTool_(v);
 else if(typeof gmVet490Tool_==='function')gmVet490Tool_(v);
};
window.gm573Shape_=function(v){
 if(!v)return;
 if(typeof gm570ShapeTool_==='function')gm570ShapeTool_(v);
 else if(typeof gmVet490Tool_==='function')gmVet490Tool_(v);
};

function gm573HexRgb_(hex){
 hex=String(hex||'#000000').replace('#',''); if(hex.length===3)hex=hex.split('').map(x=>x+x).join('');
 const n=parseInt(hex,16)||0; return [(n>>16)&255,(n>>8)&255,n&255];
}
function gm573RgbHex_(v){
 const a=String(v||'').match(/\d+/g)?.slice(0,3).map(x=>Math.max(0,Math.min(255,+x)))||[0,0,0];
 return '#'+a.map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
}
window.gm573Color_=function(v){
 if(!/^#[0-9a-f]{6}$/i.test(v))return;
 const [r,g,b]=gm573HexRgb_(v);
 ['gm573Color','gm573Hex'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=v;});
 const rgb=document.getElementById('gm573Rgb');if(rgb)rgb.value=`${r}/${g}/${b}`;
 gm573SetLegacy_('gmOficinaV2Color',v);
};
window.gm573Rgb_=v=>gm573Color_(gm573RgbHex_(v));
window.gm573BrushSize_=function(v){document.getElementById('gm573BrushSizeVal').textContent=v;gm573SetLegacy_('gmOficinaV2BrushSize',v,'input');gm573Preview_();};
window.gm573Opacity_=function(v){document.getElementById('gm573OpacityVal').textContent=v+'%';gm573SetLegacy_('gmOficinaV2Opacity',v,'input');};
window.gm573BorderColor_=function(v){gm573_.borderColor=v;const [r,g,b]=gm573HexRgb_(v);document.getElementById('gm573BorderHex').value=v;document.getElementById('gm573BorderRgb').value=`${r}/${g}/${b}`; if(window.gm570_)gm570_.borderColor=v;};
window.gm573BorderRgb_=v=>gm573BorderColor_(gm573RgbHex_(v));
window.gm573BorderWidth_=function(v){gm573_.borderWidth=+v;document.getElementById('gm573BorderWidthVal').textContent=v;if(window.gm570_)gm570_.borderWidth=+v;};
window.gm573BorderOpacity_=function(v){gm573_.borderOpacity=+v/100;document.getElementById('gm573BorderOpacityVal').textContent=v+'%';if(window.gm570_)gm570_.borderOpacity=+v/100;};

function gm573Preview_(){
 const c=document.getElementById('gm573Preview');if(!c)return;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
 x.globalAlpha=+(document.getElementById('gm573Opacity')?.value||100)/100;
 x.strokeStyle=document.getElementById('gm573Color')?.value||'#111';x.lineWidth=Math.min(26,Math.max(1,+document.getElementById('gm573BrushSize')?.value||7));x.lineCap='round';
 x.beginPath();x.moveTo(8,22);x.bezierCurveTo(42,8,85,31,142,17);x.stroke();x.globalAlpha=1;
}
function gm573Sync_(){
 const st=window.gmOficinaEstado_||{};
 const size=document.getElementById('gm573Size');if(size){const k=`${st.larguraM||50}x${st.alturaM||30}`;if([...size.options].some(o=>o.value===k))size.value=k;}
 const sc=document.getElementById('gm573Scale');if(sc)sc.value=String(st.pxPorMetro||24);
 const bg=document.getElementById('gm573Bg');if(bg)bg.value=st.fundo||'#d0d0d0';
 const gc=document.getElementById('gm573GridColor');if(gc)gc.value=st.corGrade||'#808080';
 const gr=document.getElementById('gm573Grid');if(gr)gr.checked=st.mostrarGrade!==false;
 const tr=document.getElementById('gm573Terrain');if(tr)tr.value=st.texturaTerreno||'nenhuma';
 gm573Preview_();
}

// A barra nova é inserida sem alterar a estrutura do Escudo do Mestre.
const gmOficinaRender573Base_=window.gmOficinaRender_;
if(typeof gmOficinaRender573Base_==='function'){
 window.gmOficinaRender_=function(){
   const r=gmOficinaRender573Base_.apply(this,arguments);
   setTimeout(()=>{try{gm573Build_();gm573PopulateBank_();gm573Sync_();}catch(e){console.warn('Oficina 57.3',e)}},0);
   return r;
 };
}
if(!document.getElementById('gm573Css')){
 const st=document.createElement('style');st.id='gm573Css';
 st.textContent=`#gm573Toolbar small{display:block;color:#b9c9d6;margin-bottom:2px}#gm573Toolbar label{margin:0}#gm573Toolbar button{white-space:nowrap}`;
 document.head.appendChild(st);
}
setTimeout(()=>{try{gm573Build_();gm573Sync_();}catch(e){console.warn('Oficina 57.3 init',e)}},500);



// ============================================================
// V46.77.0 — Oficina consolidada conforme especificação de 16 pontos
// Base visual estável: 46.77.0
// ============================================================



function gm580EnsureOrder_(){
  if(typeof gm570EnsureOrder_==='function')gm570EnsureOrder_();
  let max=Date.now()-100000;
  for(const arr of [gmOficinaEstado_.desenhos||[],gmVet490Formas_()||[],gmOficinaEstado_.objetos||[]]){
    for(const x of arr){
      if(!x.id)x.id=`el:${Date.now()}:${Math.random().toString(36).slice(2,6)}`;
      if(!Number.isFinite(Number(x.ordemOficina)))x.ordemOficina=++max;
      max=Math.max(max,Number(x.ordemOficina));
    }
  }
}
function gm580Items_(){
  gm580EnsureOrder_();
  const a=[];
  (gmOficinaEstado_.desenhos||[]).forEach(x=>a.push({type:'draw',id:x.id,ref:x}));
  (gmVet490Formas_()||[]).forEach(x=>a.push({type:'shape',id:x.id,ref:x}));
  (gmOficinaEstado_.objetos||[]).forEach(x=>a.push({type:'object',id:x.id,ref:x}));
  return a.sort((a,b)=>Number(a.ref.ordemOficina||0)-Number(b.ref.ordemOficina||0));
}
function gm580Selected_(){
  const all=gm580Items_();
  return all.filter(x=>gm580_.selection.has(gm580Key_(x.type,x.id)));
}
function gm580Primary_(){
  return gm580Selected_().at(-1)||null;
}
function gm580Select_(type,id,add=false){
  const k=gm580Key_(type,id);
  if(!add)gm580_.selection.clear();
  if(add && gm580_.selection.has(k))gm580_.selection.delete(k);
  else gm580_.selection.add(k);

  const p=gm580Primary_();
  if(window.gm570_){
    gm570_.selected=p?{type:p.type,id:String(p.id)}:{type:'',id:''};
  }
  gmVet490_.selectedId=p?.type==='shape'?String(p.id):'';
  gmOficinaObjSel553_=p?.type==='object'?String(p.id):'';
  gm580Render_();
  gm580Inspector_();
}
function gm580ClearSel_(){
  gm580_.selection.clear();
  if(window.gm570_)gm570_.selected={type:'',id:''};
  gmVet490_.selectedId='';gmOficinaObjSel553_='';
  gm580Render_();gm580Inspector_();
}

// ---------- Interface única ----------
function gm580BuildUI_(){
  const view=document.getElementById('gmOficinaV2Viewport');if(!view)return;
  document.getElementById('gm573Toolbar')?.remove();
  document.getElementById('gm580Toolbar')?.remove();

  // Remove apenas painéis antigos conhecidos da Oficina.
  ['gmVet490Tools','gm570Toolbar'].forEach(id=>document.getElementById(id)?.remove());

  // Uma única barra de ferramentas, imediatamente antes do mapa.
  view.insertAdjacentHTML('beforebegin',gm580ToolbarHtml_());
  gm580PopulateObjects_();
  gm580Sync_();
  gm580Tool_('select');
}
function gm580PopulateObjects_(){
  const box=document.getElementById('gm580ObjectBank');if(!box)return;
  const checked=new Set([...box.querySelectorAll('input:checked')].map(x=>x.value));
  const lista=[...(objetosMapaDB||[])].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
  box.innerHTML=lista.map(o=>`<label style="display:flex;align-items:center;gap:5px;font-size:.83em;padding:3px 4px;background:rgba(255,255,255,.035);border-radius:4px">
    <input type="checkbox" class="gm580Obj" value="${gm580Esc_(o.id)}" ${checked.has(String(o.id))?'checked':''}>
    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${gm580Esc_(o.nome||o.id)}</span>
  </label>`).join('');
}
window.gm580CheckAllObjects_=function(v){document.querySelectorAll('.gm580Obj').forEach(x=>x.checked=!!v);};
window.gm580AddObjects_=function(){
  const ids=[...document.querySelectorAll('.gm580Obj:checked')].map(x=>x.value);if(!ids.length)return;
  gmOficinaV2Historico_();let n=0;
  for(const id of ids){
    const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(id));if(!m)continue;
    const o={...JSON.parse(JSON.stringify(m)),id:`ofobj:${Date.now()+n}:${Math.random().toString(36).slice(2,5)}`,modeloId:m.id,
      x:gmOficinaEstado_.larguraM/2+(n%5)*.65,y:gmOficinaEstado_.alturaM/2+Math.floor(n/5)*.65,
      angulo:0,ordemOficina:Date.now()+n,sombraOficina:'nenhuma'};
    gmOficinaEstado_.objetos.push(o);n++;
  }
  gmOficinaPersistir_();gm580Render_();
};

function gm580Sync_(){
  const st=gmOficinaEstado_;
  const size=document.getElementById('gm580Size');if(size){const v=`${st.larguraM}x${st.alturaM}`;if([...size.options].some(o=>o.value===v))size.value=v;}
  const sc=document.getElementById('gm580Scale');if(sc)sc.value=String(gmOficinaV2Ppm_());
  const bg=document.getElementById('gm580Bg');if(bg)bg.value=st.fundo||'#d7d7d7';
  const gc=document.getElementById('gm580GridColor');if(gc)gc.value=st.corGrade||'#777777';
  const gv=document.getElementById('gm580Grid');if(gv)gv.checked=st.gradeVisivel!==false;
  const tr=document.getElementById('gm580Terrain');if(tr)tr.value=st.textura||'nenhuma';

  const col=gm580Hex_(gmOficinaV2Cfg_.cor||'#111111');
  const [r,g,b]=gm580Rgb_(col);
  for(const [id,val] of [['gm580Color',col],['gm580Hex',col],['gm580Rgb',`${r}/${g}/${b}`]]){
    const e=document.getElementById(id);if(e&&document.activeElement!==e)e.value=val;
  }
  const bs=document.getElementById('gm580SizeBrush');if(bs)bs.value=gmOficinaV2Cfg_.tamanho;
  const bsv=document.getElementById('gm580SizeVal');if(bsv)bsv.textContent=String(gmOficinaV2Cfg_.tamanho);
  const op=document.getElementById('gm580Opacity');if(op)op.value=Math.round(gmOficinaV2Cfg_.opacidade*100);
  const opv=document.getElementById('gm580OpacityVal');if(opv)opv.textContent=`${Math.round(gmOficinaV2Cfg_.opacidade*100)}%`;

  const bc=document.getElementById('gm580BorderColor');if(bc)bc.value=gm580_.borderColor;
  const [br,bg2,bb]=gm580Rgb_(gm580_.borderColor);
  const bh=document.getElementById('gm580BorderHex');if(bh&&document.activeElement!==bh)bh.value=gm580_.borderColor;
  const brgb=document.getElementById('gm580BorderRgb');if(brgb&&document.activeElement!==brgb)brgb.value=`${br}/${bg2}/${bb}`;
  const bw=document.getElementById('gm580BorderWidth');if(bw)bw.value=gm580_.borderWidth;
  const bwv=document.getElementById('gm580BorderWidthVal');if(bwv)bwv.textContent=String(gm580_.borderWidth);
  const bop=document.getElementById('gm580BorderOpacity');if(bop)bop.value=Math.round(gm580_.borderOpacity*100);
  const bopv=document.getElementById('gm580BorderOpacityVal');if(bopv)bopv.textContent=`${Math.round(gm580_.borderOpacity*100)}%`;
  gm580Preview_();
}
function gm580Preview_(){
  const cv=document.getElementById('gm580Preview');if(!cv)return;
  const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);
  ctx.globalAlpha=gmOficinaV2Cfg_.opacidade;ctx.strokeStyle=gmOficinaV2Cfg_.cor;ctx.fillStyle=gmOficinaV2Cfg_.cor;
  ctx.lineWidth=Math.min(26,Math.max(1,gmOficinaV2Cfg_.tamanho));ctx.lineCap='round';
  const style=gm580_.mode;
  if(style==='spray'){
    for(let i=0;i<90;i++){const x=12+Math.random()*126,y=19+(Math.random()-.5)*20;ctx.globalAlpha=gmOficinaV2Cfg_.opacidade*.45;ctx.fillRect(x,y,1.4,1.4);}
  }else if(style==='pontilhada'){
    for(let x=12;x<140;x+=12){ctx.beginPath();ctx.arc(x,19,Math.max(1,ctx.lineWidth*.15),0,Math.PI*2);ctx.fill();}
  }else{
    ctx.beginPath();ctx.moveTo(8,22);ctx.bezierCurveTo(42,8,85,31,142,17);ctx.stroke();
  }
  ctx.globalAlpha=1;
}

window.gm580Color_=function(v){
  const c=gm580Hex_(v,gmOficinaV2Cfg_.cor||'#111111');
  gmOficinaV2Cfg_.cor=c;
  if(gm580_.mode==='select'){
    for(const it of gm580Selected_()){
      if(it.type==='draw')it.ref.color=c;
      else if(it.type==='shape'){
        if(String(it.ref.tipo||'').startsWith('linha'))it.ref.stroke=c;
        else it.ref.fill=c;
      }
    }
    if(window.gm570_)gm570_.strokeCache?.clear?.();
    gmOficinaPersistir_();gm580Render_();
  }
  gm580Sync_();
};
window.gm580RgbInput_=function(v){const h=gm580RgbHex_(v);if(h)gm580Color_(h);};
window.gm580BrushSize_=function(v){
  gmOficinaV2Cfg_.tamanho=Math.max(1,Math.min(100,Number(v)||7));
  if(gm580_.mode==='select'){
    for(const it of gm580Selected_()){
      if(it.type==='draw')it.ref.size=gmOficinaV2Cfg_.tamanho;
      if(it.type==='shape'&&String(it.ref.tipo||'').startsWith('linha'))it.ref.strokeWidth=gmOficinaV2Cfg_.tamanho;
    }
    gmOficinaPersistir_();gm580Render_();
  }
  gm580Sync_();
};
window.gm580Opacity_=function(v){
  gmOficinaV2Cfg_.opacidade=Math.max(0,Math.min(1,Number(v)/100));
  if(gm580_.mode==='select'){
    for(const it of gm580Selected_()){
      if(it.type==='draw')it.ref.opacity=gmOficinaV2Cfg_.opacidade;
      else if(it.type==='shape'){
        if(String(it.ref.tipo||'').startsWith('linha'))it.ref.strokeOpacity=gmOficinaV2Cfg_.opacidade;
        else it.ref.fillOpacity=gmOficinaV2Cfg_.opacidade;
      }
    }
    gmOficinaPersistir_();gm580Render_();
  }
  gm580Sync_();
};
window.gm580BorderColor_=function(v){
  gm580_.borderColor=gm580Hex_(v,gm580_.borderColor);
  if(window.gm570_)gm570_.borderColor=gm580_.borderColor;
  if(gm580_.mode==='select'){
    for(const it of gm580Selected_())if(it.type==='shape')it.ref.stroke=gm580_.borderColor;
    gmOficinaPersistir_();gm580Render_();
  }
  gm580Sync_();
};
window.gm580BorderRgb_=function(v){const h=gm580RgbHex_(v);if(h)gm580BorderColor_(h);};
window.gm580BorderWidth_=function(v){
  gm580_.borderWidth=Math.max(0,Math.min(20,Number(v)||0));
  if(window.gm570_)gm570_.borderWidth=gm580_.borderWidth;
  if(gm580_.mode==='select'){
    for(const it of gm580Selected_())if(it.type==='shape'&&!String(it.ref.tipo||'').startsWith('linha'))it.ref.strokeWidth=gm580_.borderWidth;
    gmOficinaPersistir_();gm580Render_();
  }
  gm580Sync_();
};
window.gm580BorderOpacity_=function(v){
  gm580_.borderOpacity=Math.max(0,Math.min(1,Number(v)/100));
  if(window.gm570_)gm570_.borderOpacity=gm580_.borderOpacity;
  if(gm580_.mode==='select'){
    for(const it of gm580Selected_())if(it.type==='shape'&&!String(it.ref.tipo||'').startsWith('linha'))it.ref.strokeOpacity=gm580_.borderOpacity;
    gmOficinaPersistir_();gm580Render_();
  }
  gm580Sync_();
};

window.gm580Tool_=function(v){
  gm580_.mode=String(v||'select');
  gmOficinaV2Cfg_.ativo=false;
  if(v==='select'){
    gmVet490_.tool='select';
  }else{
    if(typeof gm570BrushConfig_==='function')gm570BrushConfig_(v);
    else{
      gmOficinaV2Cfg_.ferramenta=v==='borracha'?'borracha':'traco';
      gmOficinaV2Cfg_.pincel=['quadrado','spray','irregular','caligrafico'].includes(v)?v:'redondo';
      gmOficinaV2Cfg_.texturaTraco=['pontilhada','giz','ranhura','areia','cascalho','grama','folhas','neve','fumaca'].includes(v)?v:'solida';
      gmOficinaV2Cfg_.estilo570=v;
    }
    gmOficinaV2Cfg_.ativo=true;
  }
  const cv=document.getElementById('gmOficinaV2Canvas');
  if(cv){cv.style.pointerEvents=gmOficinaV2Cfg_.ativo?'auto':'none';cv.style.cursor=v==='borracha'?'cell':gmOficinaV2Cfg_.ativo?'crosshair':'default';}
  gm580Sync_();gm580Render_();
};
window.gm580Line_=function(v){
  if(!v)return;
  gm580_.mode='line';gmOficinaV2Cfg_.ativo=false;
  if(window.gm570_){
    gm570_.borderColor=gm580_.borderColor;gm570_.borderWidth=gm580_.borderWidth;gm570_.borderOpacity=gm580_.borderOpacity;
  }
  if(typeof gm570LineTool_==='function')gm570LineTool_(v);else gmVet490Tool_(v);
};
window.gm580Shape_=function(v){
  if(!v)return;
  gm580_.mode='shape';gmOficinaV2Cfg_.ativo=false;
  if(window.gm570_){
    gm570_.borderColor=gm580_.borderColor;gm570_.borderWidth=gm580_.borderWidth;gm570_.borderOpacity=gm580_.borderOpacity;
  }
  if(typeof gm570ShapeTool_==='function')gm570ShapeTool_(v);else gmVet490Tool_(v);
};

// ---------- render unified + multi selection ----------
function gm580SelectionOutlines_(ppm){
  return gm580Selected_().map(it=>{
    const b=gm580BBox_(it);
    return `<rect x="${b.x*ppm}" y="${b.y*ppm}" width="${Math.max(1,b.w*ppm)}" height="${Math.max(1,b.h*ppm)}"
      fill="none" stroke="#41d9f5" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
  }).join('');
}
function gm580Render_(){
  if(typeof gm570Render_==='function')gm570Render_();
  else if(typeof gmVet490Render_==='function')gmVet490Render_();

  const svg=document.getElementById('gmOficinaVectorLayer');
  if(svg){
    svg.querySelectorAll('[data-gm580-outline]').forEach(x=>x.remove());
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('data-gm580-outline','1');
    g.innerHTML=gm580SelectionOutlines_(gmOficinaV2Ppm_());
    svg.appendChild(g);
    gm580InstallMarquee_();
  }
  gm580Inspector_();
}
function gm580InstallMarquee_(){
  const svg=document.getElementById('gmOficinaVectorLayer');
  if(!svg||svg.dataset.gm580Marquee)return;
  svg.dataset.gm580Marquee='1';
  svg.addEventListener('pointerdown',ev=>{
    if(gm580_.mode!=='select'||ev.target!==svg)return;
    ev.preventDefault();ev.stopPropagation();
    const r=svg.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    const x0=(ev.clientX-r.left)/ppm,y0=(ev.clientY-r.top)/ppm;
    const box=document.createElementNS('http://www.w3.org/2000/svg','rect');
    box.setAttribute('fill','rgba(65,217,245,.10)');box.setAttribute('stroke','#41d9f5');box.setAttribute('stroke-dasharray','6 4');
    box.style.pointerEvents='none';svg.appendChild(box);
    const move=e=>{
      const x=(e.clientX-r.left)/ppm,y=(e.clientY-r.top)/ppm;
      box.setAttribute('x',Math.min(x0,x)*ppm);box.setAttribute('y',Math.min(y0,y)*ppm);
      box.setAttribute('width',Math.abs(x-x0)*ppm);box.setAttribute('height',Math.abs(y-y0)*ppm);
    };
    const up=e=>{
      window.removeEventListener('pointermove',move);box.remove();
      const x=(e.clientX-r.left)/ppm,y=(e.clientY-r.top)/ppm;
      const q={x:Math.min(x0,x),y:Math.min(y0,y),w:Math.abs(x-x0),h:Math.abs(y-y0)};
      if(q.w<.08&&q.h<.08){gm580ClearSel_();return;}
      gm580_.selection.clear();
      gm580Items_().filter(it=>gm580Intersects_(gm580BBox_(it),q)).forEach(it=>gm580_.selection.add(gm580Key_(it.type,it.id)));
      const p=gm580Primary_();
      if(window.gm570_)gm570_.selected=p?{type:p.type,id:String(p.id)}:{type:'',id:''};
      gm580Render_();gm580Inspector_();
    };
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerup',up,{once:true});
  });
}

// selection click / ctrl move
function gm580DragSelected_(ev){
  if(!(ev.ctrlKey||ev.metaKey))return;
  const items=gm580Selected_();if(!items.length)return;
  const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY;
  const starts=items.map(it=>({it,data:JSON.parse(JSON.stringify(it.ref))}));
  const move=e=>{
    const dx=(e.clientX-sx)/ppm,dy=(e.clientY-sy)/ppm;
    for(const q of starts){
      const r=q.it.ref,st=q.data;
      if(q.it.type==='object'){r.x=Number(st.x||0)+dx;r.y=Number(st.y||0)+dy;}
      else if(q.it.type==='draw'){r.pts=(st.pts||[]).map(p=>({x:p.x+dx,y:p.y+dy}));}
      else{
        r.x=Number(st.x||0)+dx;r.y=Number(st.y||0)+dy;
        if(String(r.tipo||'').startsWith('linha')){
          r.x2=Number(st.x2||0)+dx;r.y2=Number(st.y2||0)+dy;
          if(r.tipo==='linha_curva'){r.cx=Number(st.cx||0)+dx;r.cy=Number(st.cy||0)+dy;}
        }
      }
    }
    if(window.gm570_)gm570_.strokeCache?.clear?.();
    gm580Render_();
  };
  const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('pointerup',up,{once:true});
}
window.gm570ShapeDown_=function(ev,id){
  ev.preventDefault();ev.stopPropagation();
  gm580Select_('shape',id,ev.ctrlKey||ev.metaKey);
  gm580DragSelected_(ev);
};
window.gm570ObjectDown_=function(ev,id){
  ev.preventDefault();ev.stopPropagation();
  gm580Select_('object',id,ev.ctrlKey||ev.metaKey);
  gm580DragSelected_(ev);
};
window.gm570DrawDown_=function(ev,id){
  ev.preventDefault();ev.stopPropagation();
  gm580Select_('draw',id,ev.ctrlKey||ev.metaKey);
  gm580DragSelected_(ev);
};

// actions group
function gm580MoveOrder_(dir){
  const arr=gm580Items_(),sel=new Set(gm580Selected_().map(x=>gm580Key_(x.type,x.id)));if(!sel.size)return;
  if(dir>0){
    for(let i=arr.length-2;i>=0;i--){
      const a=gm580Key_(arr[i].type,arr[i].id),b=gm580Key_(arr[i+1].type,arr[i+1].id);
      if(sel.has(a)&&!sel.has(b)){const t=arr[i].ref.ordemOficina;arr[i].ref.ordemOficina=arr[i+1].ref.ordemOficina;arr[i+1].ref.ordemOficina=t;}
    }
  }else{
    for(let i=1;i<arr.length;i++){
      const a=gm580Key_(arr[i].type,arr[i].id),b=gm580Key_(arr[i-1].type,arr[i-1].id);
      if(sel.has(a)&&!sel.has(b)){const t=arr[i].ref.ordemOficina;arr[i].ref.ordemOficina=arr[i-1].ref.ordemOficina;arr[i-1].ref.ordemOficina=t;}
    }
  }
  gmOficinaPersistir_();gm580Render_();
}
window.gm580Front_=()=>gm580MoveOrder_(1);
window.gm580Back_=()=>gm580MoveOrder_(-1);

window.gm580Delete_=function(){
  const sel=gm580Selected_();if(!sel.length)return;
  const keys=new Set(sel.map(x=>gm580Key_(x.type,x.id)));
  gmOficinaEstado_.desenhos=(gmOficinaEstado_.desenhos||[]).filter(x=>!keys.has(gm580Key_('draw',x.id)));
  gmOficinaEstado_.objetos=(gmOficinaEstado_.objetos||[]).filter(x=>!keys.has(gm580Key_('object',x.id)));
  gmOficinaEstado_.formas=(gmVet490Formas_()||[]).filter(x=>!keys.has(gm580Key_('shape',x.id)));
  gm580_.selection.clear();if(window.gm570_)gm570_.strokeCache?.clear?.();
  gmOficinaPersistir_();gm580Render_();
};
window.gm580Duplicate_=function(){
  const sel=gm580Selected_();if(!sel.length)return;
  gm580_.selection.clear();
  sel.forEach((it,n)=>{
    const d=JSON.parse(JSON.stringify(it.ref));d.id=`${it.type}:${Date.now()+n}:${Math.random().toString(36).slice(2,5)}`;d.ordemOficina=Date.now()+n;
    if(it.type==='object'){d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;gmOficinaEstado_.objetos.push(d);}
    else if(it.type==='draw'){d.pts=(d.pts||[]).map(p=>({x:p.x+.5,y:p.y+.5}));gmOficinaEstado_.desenhos.push(d);}
    else{d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;if(d.x2!=null){d.x2+=.5;d.y2+=.5;}gmVet490Formas_().push(d);}
    gm580_.selection.add(gm580Key_(it.type,d.id));
  });
  gmOficinaPersistir_();gm580Render_();
};

// edit form + radius + rotation reuses 57.0 handles
window.gm580ToggleEdit_=function(){
  if(typeof gm570ToggleEdit_==='function')gm570ToggleEdit_();
  const b=document.getElementById('gm580EditBtn');
  if(b&&window.gm570_)b.classList.toggle('btn-select',!!gm570_.edit);
};

// clipboard group + external image
gm580_.clipboard=null;
function gm580Copy_(){
  const s=gm580Selected_();if(!s.length)return false;
  gm580_.clipboard=s.map(it=>({type:it.type,data:JSON.parse(JSON.stringify(it.ref))}));
  return true;
}
function gm580Paste_(){
  if(!gm580_.clipboard?.length)return false;
  gm580_.selection.clear();
  gm580_.clipboard.forEach((it,n)=>{
    const d=JSON.parse(JSON.stringify(it.data));d.id=`${it.type}:${Date.now()+n}:${Math.random().toString(36).slice(2,5)}`;d.ordemOficina=Date.now()+n;
    if(it.type==='object'){d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;gmOficinaEstado_.objetos.push(d);}
    else if(it.type==='draw'){d.pts=(d.pts||[]).map(p=>({x:p.x+.5,y:p.y+.5}));gmOficinaEstado_.desenhos.push(d);}
    else{d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;if(d.x2!=null){d.x2+=.5;d.y2+=.5;}gmVet490Formas_().push(d);}
    gm580_.selection.add(gm580Key_(it.type,d.id));
  });
  gmOficinaPersistir_();gm580Render_();return true;
}
document.addEventListener('copy',e=>{
  if(!document.getElementById('gm580Toolbar'))return;
  if(gm580Copy_()){e.preventDefault();try{e.clipboardData.setData('text/plain','MesaEstelar:Selection')}catch(_){}}
},true);
document.addEventListener('cut',e=>{
  if(!document.getElementById('gm580Toolbar'))return;
  if(gm580Copy_()){e.preventDefault();gm580Delete_();}
},true);
document.addEventListener('paste',e=>{
  if(!document.getElementById('gm580Toolbar'))return;
  const item=[...(e.clipboardData?.items||[])].find(i=>i.type?.startsWith('image/'));
  if(item){
    e.preventDefault();
    const f=item.getAsFile();
    if(f&&typeof gm570AddClipboardImage_==='function')gm570AddClipboardImage_(f);
    return;
  }
  if(gm580_.clipboard){e.preventDefault();gm580Paste_();}
},true);
document.addEventListener('keydown',e=>{
  if(!document.getElementById('gm580Toolbar'))return;
  const tag=document.activeElement?.tagName;
  if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
  if(e.key==='Delete'){e.preventDefault();gm580Delete_();}
  if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='d'){e.preventDefault();gm580Duplicate_();}
});

// ---------- Inspector with shadow preserved ----------
function gm580Inspector_(){
  const box=document.getElementById('gm580Inspector');if(!box)return;
  const s=gm580Selected_();
  if(!s.length){box.innerHTML='<span style="color:#9fb4c8">Nenhum elemento selecionado.</span>';return;}
  if(s.length>1){
    box.innerHTML=`<strong style="color:#ffd54a">${s.length} elementos selecionados</strong>
      <span style="color:#9fb4c8">Cor, tamanho, opacidade, frente/trás, duplicar, excluir e copiar agem sobre o grupo.</span>`;
    return;
  }
  const it=s[0],r=it.ref;
  box.innerHTML=`<div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
    <strong style="color:#ffd54a">${it.type==='shape'?'Forma':it.type==='object'?'Objeto':'Desenho'}</strong>
    <label><small>Sombra</small><select onchange="gm580Shadow_('sombraOficina',this.value)">
      ${['nenhuma','suave','media','forte'].map(v=>`<option value="${v}" ${String(r.sombraOficina||'nenhuma')===v?'selected':''}>${v==='media'?'média':v}</option>`).join('')}
    </select></label>
    <label><small>Direção</small><select onchange="gm580Shadow_('sombraDirecao',this.value)">
      ${['N','NE','E','SE','S','SO','O','NO'].map(v=>`<option ${String(r.sombraDirecao||'SE')===v?'selected':''}>${v}</option>`).join('')}
    </select></label>
    <label><small>Distância</small><input type="number" min="1" max="30" value="${Number(r.sombraDist||4)}" onchange="gm580Shadow_('sombraDist',this.value)" style="width:70px"></label>
  </div>`;
}
window.gm580Shadow_=function(k,v){
  const s=gm580Selected_();if(!s.length)return;
  for(const it of s)it.ref[k]=k==='sombraDist'?Number(v):v;
  gmOficinaPersistir_();gm580Render_();
};

// ---------- hook creation so last-created always top ----------
const gm580PointerBase_=window.gmOficinaV2PointerDown_;
window.gmOficinaV2PointerDown_=function(ev){
  const before=(gmOficinaEstado_.desenhos||[]).length;
  const r=gm580PointerBase_?.(ev);
  const d=(gmOficinaEstado_.desenhos||[])[before];
  if(d){if(!d.id)d.id=`draw:${Date.now()}:${Math.random().toString(36).slice(2,5)}`;d.ordemOficina=Date.now();d.estilo570=gm580_.mode;}
  return r;
};

// ---------- installation ----------
function gm580Install_(){
  const view=document.getElementById('gmOficinaV2Viewport');if(!view)return;
  if(!document.getElementById('gm580Toolbar'))gm580BuildUI_();
  const legacy=document.getElementById('gmVet490Tools');if(legacy)legacy.style.display='none';
  document.getElementById('gm573Toolbar')?.remove();
  gm580PopulateObjects_();gm580Sync_();gm580Render_();
}
const gmOficinaRender580Base_=window.gmOficinaRender_;
if(typeof gmOficinaRender580Base_==='function'){
  window.gmOficinaRender_=function(){
    const r=gmOficinaRender580Base_.apply(this,arguments);
    setTimeout(()=>{try{gm580Install_();}catch(e){console.warn('Oficina 58.0',e)}},0);
    return r;
  };
}

if(!document.getElementById('gm580Css')){
  const st=document.createElement('style');st.id='gm580Css';
  st.textContent=`#gm580Toolbar small{display:block;color:#b9c9d6;margin-bottom:2px}#gm580Toolbar label{margin:0}#gm580Toolbar button{white-space:nowrap}`;
  document.head.appendChild(st);
}
setTimeout(()=>{try{gm580Install_();gm580Tool_('select');}catch(e){console.warn('Oficina 58.0 init',e)}},550);



// ============================================================
// V46.77.0 — OFICINA REESTRUTURADA
// Modelo único de composição: desenho + forma + objeto participam
// da mesma pilha cronológica visual, em coordenadas métricas.
// ============================================================

const gm600_ = {
  installed:false,
  version:'46.77.0'
};

// A Oficina nova assume integralmente a interface da 58, evitando que
// controles antigos reapareçam quando outras rotinas da Mesa renderizam.
function gm600HideLegacy_(){
  const ids=['gm570Toolbar','gm573Toolbar','gmVet490Tools'];
  ids.forEach(id=>{
    const el=document.getElementById(id);
    if(el && id!=='gm580Toolbar') el.style.display='none';
  });
  const tb=document.getElementById('gm580Toolbar');
  if(tb) tb.style.display='flex';
}

// Garante ordem total única. Em empates antigos, normaliza sem mudar
// a ordem visual existente.
function gm600NormalizeStack_(){
  if(typeof gm580Items_!=='function') return;
  const items=gm580Items_();
  let seq=Date.now()-items.length-1000;
  const used=new Set();
  for(const it of items){
    let z=Number(it.ref.ordemOficina);
    if(!Number.isFinite(z) || used.has(z)) z=++seq;
    used.add(z);
    it.ref.ordemOficina=z;
  }
}

// Todo elemento novo recebe topo real da pilha, não apenas Date.now()
// isoladamente. Isso evita empates quando vários elementos são inseridos
// no mesmo milissegundo.
function gm600NextOrder_(){
  let max=0;
  try{
    for(const it of gm580Items_()) max=Math.max(max,Number(it.ref.ordemOficina)||0);
  }catch(_){}
  return Math.max(Date.now(),max+1);
}

// Corrige inserção múltipla do banco para preservar ordem inequívoca.
window.gm580AddObjects_=function(){
  const ids=[...document.querySelectorAll('.gm580Obj:checked')].map(x=>x.value);
  if(!ids.length)return;
  gmOficinaV2Historico_();
  let z=gm600NextOrder_(),n=0;
  for(const id of ids){
    const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(id));
    if(!m)continue;
    const o={
      ...JSON.parse(JSON.stringify(m)),
      id:`ofobj:${Date.now()+n}:${Math.random().toString(36).slice(2,6)}`,
      modeloId:m.id,
      x:gmOficinaEstado_.larguraM/2+(n%5)*.65,
      y:gmOficinaEstado_.alturaM/2+Math.floor(n/5)*.65,
      angulo:0,
      ordemOficina:z++,
      sombraOficina:'nenhuma'
    };
    gmOficinaEstado_.objetos.push(o);n++;
  }
  gmOficinaPersistir_();
  gm580Render_();
};

// Duplicação em grupo também respeita topo absoluto.
window.gm580Duplicate_=function(){
  const sel=gm580Selected_();
  if(!sel.length)return;
  gmOficinaV2Historico_();
  gm580_.selection.clear();
  let z=gm600NextOrder_();
  sel.forEach((it,n)=>{
    const d=JSON.parse(JSON.stringify(it.ref));
    d.id=`${it.type}:${Date.now()+n}:${Math.random().toString(36).slice(2,6)}`;
    d.ordemOficina=z++;
    if(it.type==='object'){
      d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;
      gmOficinaEstado_.objetos.push(d);
    }else if(it.type==='draw'){
      d.pts=(d.pts||[]).map(p=>({x:p.x+.5,y:p.y+.5}));
      gmOficinaEstado_.desenhos.push(d);
    }else{
      d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;
      if(d.x2!=null){d.x2=Number(d.x2)+.5;d.y2=Number(d.y2)+.5;}
      if(d.cx!=null){d.cx=Number(d.cx)+.5;d.cy=Number(d.cy)+.5;}
      gmVet490Formas_().push(d);
    }
    gm580_.selection.add(gm580Key_(it.type,d.id));
  });
  gmOficinaPersistir_();gm580Render_();
};

// Frente/Trás passam a mover a seleção inteira para o extremo da pilha.
// Isto corresponde ao comportamento esperado em editores gráficos.
window.gm580Front_=function(){
  const sel=gm580Selected_(); if(!sel.length)return;
  gmOficinaV2Historico_();
  const chosen=new Set(sel.map(x=>gm580Key_(x.type,x.id)));
  const all=gm580Items_();
  const rest=all.filter(x=>!chosen.has(gm580Key_(x.type,x.id)));
  const picked=all.filter(x=>chosen.has(gm580Key_(x.type,x.id)));
  let z=1;
  [...rest,...picked].forEach(x=>x.ref.ordemOficina=z++);
  gmOficinaPersistir_();gm580Render_();
};
window.gm580Back_=function(){
  const sel=gm580Selected_(); if(!sel.length)return;
  gmOficinaV2Historico_();
  const chosen=new Set(sel.map(x=>gm580Key_(x.type,x.id)));
  const all=gm580Items_();
  const picked=all.filter(x=>chosen.has(gm580Key_(x.type,x.id)));
  const rest=all.filter(x=>!chosen.has(gm580Key_(x.type,x.id)));
  let z=1;
  [...picked,...rest].forEach(x=>x.ref.ordemOficina=z++);
  gmOficinaPersistir_();gm580Render_();
};

// Colagem interna usa a mesma política de topo.
const gm600PasteBase_=typeof gm580Paste_==='function'?gm580Paste_:null;
gm580Paste_=function(){
  if(!gm580_.clipboard?.length)return false;
  gmOficinaV2Historico_();
  gm580_.selection.clear();
  let z=gm600NextOrder_();
  gm580_.clipboard.forEach((it,n)=>{
    const d=JSON.parse(JSON.stringify(it.data));
    d.id=`${it.type}:${Date.now()+n}:${Math.random().toString(36).slice(2,6)}`;
    d.ordemOficina=z++;
    if(it.type==='object'){
      d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;
      gmOficinaEstado_.objetos.push(d);
    }else if(it.type==='draw'){
      d.pts=(d.pts||[]).map(p=>({x:p.x+.5,y:p.y+.5}));
      gmOficinaEstado_.desenhos.push(d);
    }else{
      d.x=Number(d.x||0)+.5;d.y=Number(d.y||0)+.5;
      if(d.x2!=null){d.x2=Number(d.x2)+.5;d.y2=Number(d.y2)+.5;}
      if(d.cx!=null){d.cx=Number(d.cx)+.5;d.cy=Number(d.cy)+.5;}
      gmVet490Formas_().push(d);
    }
    gm580_.selection.add(gm580Key_(it.type,d.id));
  });
  gmOficinaPersistir_();gm580Render_();return true;
};

// Rotação também para objetos. A alça aparece no modo Editar forma,
// sem transformar o objeto em "forma".
function gm600ObjectHandle_(o,ppm){
  if(!window.gm570_?.edit)return '';
  const w=Math.max(.05,Number(o.larguraM||1))*ppm;
  const h=Math.max(.05,Number(o.alturaM||1))*ppm;
  const cx=Number(o.x||0)*ppm, cy=Number(o.y||0)*ppm;
  const id=String(o.id).replace(/'/g,"\\'");
  return `<g pointer-events="none">
    <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="none" stroke="#19cfe8" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>
    <line x1="${cx}" y1="${cy-h/2}" x2="${cx}" y2="${cy-h/2-28}" stroke="#19cfe8" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
    <circle cx="${cx}" cy="${cy-h/2-32}" r="7" fill="#ffd54a" stroke="#222" stroke-width="1.5" pointer-events="auto"
      onpointerdown="gm600RotateObject_(event,'${id}')" style="cursor:grab"/>
  </g>`;
}
window.gm600RotateObject_=function(ev,id){
  ev.preventDefault();ev.stopPropagation();
  const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));if(!o)return;
  gmOficinaV2Historico_();
  const map=document.getElementById('gmOficinaV2Map'),r=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
  const cx=Number(o.x||0)*ppm+r.left,cy=Number(o.y||0)*ppm+r.top;
  const move=e=>{o.angulo=(Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90+360)%360;gm580Render_();};
  const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('pointerup',up,{once:true});
};

// Acrescenta a alça de rotação do objeto depois do render unificado.
const gm600RenderBase_=gm580Render_;
gm580Render_=function(){
  gm600RenderBase_();
  const svg=document.getElementById('gmOficinaVectorLayer');
  const p=gm580Primary_();
  if(svg && p?.type==='object'){
    const holder=document.createElementNS('http://www.w3.org/2000/svg','g');
    holder.setAttribute('data-gm600-object-handle','1');
    holder.innerHTML=gm600ObjectHandle_(p.ref,gmOficinaV2Ppm_());
    svg.appendChild(holder);
  }
  gm600HideLegacy_();
};

// Ao terminar um traço, força topo inequívoco.
const gm600PointerBase_=window.gmOficinaV2PointerDown_;
window.gmOficinaV2PointerDown_=function(ev){
  const before=(gmOficinaEstado_.desenhos||[]).length;
  const r=gm600PointerBase_?.(ev);
  const d=(gmOficinaEstado_.desenhos||[])[before];
  if(d)d.ordemOficina=gm600NextOrder_();
  return r;
};

// A seleção continua sendo o estado inicial sempre que a Oficina abre.
function gm600Install_(){
  if(!document.getElementById('gmOficinaV2Viewport'))return;
  gm600HideLegacy_();
  gm600NormalizeStack_();
  if(typeof gm580Install_==='function')gm580Install_();
  if(typeof gm580Tool_==='function')gm580Tool_('select');
  const tool=document.getElementById('gm580Tool');if(tool)tool.value='select';
  gm600_.installed=true;
}

const gm600OpenBase_=window.gmOficinaRender_;
if(typeof gm600OpenBase_==='function'){
  window.gmOficinaRender_=function(){
    const r=gm600OpenBase_.apply(this,arguments);
    setTimeout(()=>{try{gm600Install_();}catch(e){console.warn('Oficina 46.60',e)}},0);
    return r;
  };
}

setTimeout(()=>{try{gm600Install_();gm580Render_();}catch(e){console.warn('Oficina 46.60 init',e)}},700);



// ============================================================
// V46.77.0 — HOTFIX: elimina o pisca-pisca/reconstrução da Oficina
// A interface é montada uma vez por abertura, e render do mapa NÃO
// reconstrói nem reposiciona a toolbar.
// ============================================================
(function(){
  // Cancela o instalador 60.0 como rotina de renderização.
  // Mantemos seus recursos, mas a montagem da UI passa a ser idempotente.
  let mounting=false;

  window.gm600Install_=function(){
    if(mounting)return;
    const view=document.getElementById('gmOficinaV2Viewport');
    if(!view)return;
    mounting=true;
    try{
      // Nunca remove/reinsere a toolbar se ela já existe.
      let tb=document.getElementById('gm580Toolbar');
      if(!tb){
        if(typeof gm580BuildUI_==='function')gm580BuildUI_();
        tb=document.getElementById('gm580Toolbar');
      }

      // A toolbar nova fica SEMPRE imediatamente antes do viewport.
      if(tb && tb.nextElementSibling!==view){
        view.parentNode.insertBefore(tb,view);
      }
      if(tb)tb.style.display='flex';

      // Oculta de modo determinístico apenas barras antigas conhecidas.
      ['gm570Toolbar','gm573Toolbar','gmVet490Tools'].forEach(id=>{
        const el=document.getElementById(id);
        if(el)el.style.display='none';
      });

      // Evita que um painel antigo ocupe espaço e depois reapareça.
      const candidates=[...view.parentElement.children];
      candidates.forEach(el=>{
        if(el===tb||el===view)return;
        if(el.id==='gmVet490Tools'||el.id==='gm573Toolbar'||el.id==='gm570Toolbar'){
          el.style.display='none';
        }
      });

      if(typeof gm600NormalizeStack_==='function')gm600NormalizeStack_();
      gm600_.installed=true;
    } finally {
      mounting=false;
    }
  };

  // Render estável: desenha; não remonta UI.
  const stableRender=gm600RenderBase_;
  window.gm580Render_=function(){
    stableRender();
    const svg=document.getElementById('gmOficinaVectorLayer');
    svg?.querySelectorAll('[data-gm600-object-handle]').forEach(x=>x.remove());
    const p=typeof gm580Primary_==='function'?gm580Primary_():null;
    if(svg&&p?.type==='object'){
      const holder=document.createElementNS('http://www.w3.org/2000/svg','g');
      holder.setAttribute('data-gm600-object-handle','1');
      holder.innerHTML=gm600ObjectHandle_(p.ref,gmOficinaV2Ppm_());
      svg.appendChild(holder);
    }
  };

  // Neutraliza os timeouts de "instalar de novo" das versões anteriores
  // através de CSS persistente e uma montagem única após a página estabilizar.
  if(!document.getElementById('gm601Css')){
    const st=document.createElement('style');st.id='gm601Css';
    st.textContent=`
      #gm570Toolbar,#gm573Toolbar,#gmVet490Tools{display:none!important}
      #gm580Toolbar{display:flex!important}
    `;
    document.head.appendChild(st);
  }
  // v46.62: observador global removido; a Oficina monta apenas quando chamada.
setTimeout(()=>{
    try{
      gm600Install_();
      if(typeof gm580Tool_==='function'){
        gm580_.mode='select';
        gmOficinaV2Cfg_.ativo=false;
        const tool=document.getElementById('gm580Tool');if(tool)tool.value='select';
      }
      gm580Render_();
    }catch(e){console.warn('Oficina 60.1 init',e)}
  },900);
})();



// ============================================================
// V46.77.0 — Oficina realmente única
// ============================================================
(function(){
  function gm610CleanLegacy_(){
    ['gmVet490Tools','gm570Toolbar','gm573Toolbar'].forEach(id=>document.getElementById(id)?.remove());

    // Remove SOMENTE controles antigos identificáveis caso alguma rotina histórica os injete.
    const oldIds=[
      'gmOficinaV2DrawBtn','gmOficinaV2Tool','gmOficinaV2Color','gmOficinaV2Rgb',
      'gmOficinaV2HexInput555','gmOficinaV2BrushSize','gmOficinaV2Opacity',
      'gmOficinaV2StrokeStyle','gmOficinaV2BrushPreview','gmOficinaV2Objeto'
    ];
    oldIds.forEach(id=>{
      const el=document.getElementById(id);
      if(!el)return;
      const panel=el.closest('[data-gm-old-workshop-panel]');
      if(panel)panel.remove();
    });
  }

  const oldInstall=window.gm600Install_;
  window.gm600Install_=function(){
    const view=document.getElementById('gmOficinaV2Viewport');if(!view)return;
    gm610CleanLegacy_();

    let tb=document.getElementById('gm580Toolbar');
    if(!tb && typeof gm580BuildUI_==='function')gm580BuildUI_();
    tb=document.getElementById('gm580Toolbar');

    if(tb && tb.nextElementSibling!==view)view.parentNode.insertBefore(tb,view);
    if(tb)tb.style.display='flex';

    if(typeof gm600NormalizeStack_==='function')gm600NormalizeStack_();
    gm600_.installed=true;
  };

  if(!document.getElementById('gm610Css')){
    const st=document.createElement('style');st.id='gm610Css';
    st.textContent=`
      #gm580Toolbar{display:flex!important}
      #gmVet490Tools,#gm570Toolbar,#gm573Toolbar{display:none!important}
    `;
    document.head.appendChild(st);
  }

  setTimeout(()=>{
    try{
      gm610CleanLegacy_();
      gm600Install_();
    }catch(e){console.warn('Oficina 46.61 init',e)}
  },950);
})();



// ============================================================
// V46.77.0 — edição persistente de formas/objetos + histórico completo
// ============================================================
(function(){
  const gm620_ = {
    activeShape:'',
    lastStyleHistory:0
  };

  function gm620Hist_(){
    try{gmOficinaV2Historico_();}catch(_){}
  }

  // ---------- histórico completo ----------
  window.gmOficinaV2Snapshot_=function(){
    return JSON.parse(JSON.stringify({
      desenhos:gmOficinaEstado_.desenhos||[],
      objetos:gmOficinaEstado_.objetos||[],
      formas:gmOficinaEstado_.formas||[]
    }));
  };
  window.gmOficinaV2Undo_=function(){
    if(!gmOficinaV2Undo_.length)return;
    gmOficinaV2Redo_.push(gmOficinaV2Snapshot_());
    const x=gmOficinaV2Undo_.pop();
    gmOficinaEstado_.desenhos=x.desenhos||[];
    gmOficinaEstado_.objetos=x.objetos||[];
    gmOficinaEstado_.formas=x.formas||[];
    gm580_.selection?.clear?.();
    gm570_.selected={type:'',id:''};
    gm570_.strokeCache?.clear?.();
    gmOficinaPersistir_();gmOficinaRender_();
  };
  window.gmOficinaV2Redo_=function(){
    if(!gmOficinaV2Redo_.length)return;
    gmOficinaV2Undo_.push(gmOficinaV2Snapshot_());
    const x=gmOficinaV2Redo_.pop();
    gmOficinaEstado_.desenhos=x.desenhos||[];
    gmOficinaEstado_.objetos=x.objetos||[];
    gmOficinaEstado_.formas=x.formas||[];
    gm580_.selection?.clear?.();
    gm570_.selected={type:'',id:''};
    gm570_.strokeCache?.clear?.();
    gmOficinaPersistir_();gmOficinaRender_();
  };

  // ---------- retângulo único, com raio editável ----------
  const gm620BaseShapeSvg_=gm570BaseShapeSvg_;
  gm570BaseShapeSvg_=function(f,ppm){
    if(f && (f.tipo==='retangulo'||f.tipo==='arredondado')){
      const op=gmVet530Opacidades_(f);
      const x=Number(f.x||0)*ppm,y=Number(f.y||0)*ppm,w=Math.abs(Number(f.w||0))*ppm,h=Math.abs(Number(f.h||0))*ppm;
      const cx=x+w/2,cy=y+h/2,rot=Number(f.rot||0);
      const rx=Math.min(w/2,h/2,Math.max(0,Number(f.radius||0))*ppm);
      const stroke=f.stroke||gm570_.borderColor,fill=f.fill||gmOficinaV2Cfg_.cor;
      const sw=Math.max(0,Number(f.strokeWidth??0))*gm554Zoom_();
      const id=String(f.id).replace(/'/g,"\\'");
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}"
        stroke="${stroke}" stroke-opacity="${op.stroke}" stroke-width="${sw}"
        fill="${fill}" fill-opacity="${op.fill}"
        transform="rotate(${rot} ${cx} ${cy})"
        data-vet-id="${gm570Esc_(f.id)}"
        onpointerdown="gm570ShapeDown_(event,'${id}')"
        style="pointer-events:auto;cursor:move"/>`;
    }
    return gm620BaseShapeSvg_(f,ppm);
  };

  const gm620HandlesBase_=gm570Handles_;
  gm570Handles_=function(f,ppm){
    let h=gm620HandlesBase_(f,ppm);
    // A bolinha de arredondamento é sempre branca.
    h=h.replace(/fill="#ffd54a" stroke="#222"/g,'fill="#fff" stroke="#19cfe8"');
    return h;
  };

  // ---------- seleção carrega o estilo da própria forma ----------
  function gm620LoadStyle_(it){
    if(!it)return;
    if(it.type==='shape'){
      const f=it.ref;
      const line=String(f.tipo||'').startsWith('linha');
      gmOficinaV2Cfg_.cor=line?(f.stroke||gmOficinaV2Cfg_.cor):(f.fill||gmOficinaV2Cfg_.cor);
      gmOficinaV2Cfg_.opacidade=line?Number(f.strokeOpacity??f.opacity??1):Number(f.fillOpacity??f.opacity??1);
      gm570_.borderColor=f.stroke||gm570_.borderColor;
      gm570_.borderWidth=Math.max(0,Number(f.strokeWidth??0));
      gm570_.borderOpacity=Number(f.strokeOpacity??1);
      gm570_.edit=!line;
    }
    gm580Sync_?.();
  }

  const gm620SelectBase_=gm580Select_;
  gm580Select_=function(type,id,add=false){
    gm620SelectBase_(type,id,add);
    gm620LoadStyle_(gm580Primary_());
    gm620RefreshButtons_();
  };

  const gm620Select570Base_=gm570Select_;
  gm570Select_=function(type,id){
    gm620Select570Base_(type,id);
    const it=gm570SelectedRef_();
    gm620LoadStyle_(it);
    gm620RefreshButtons_();
  };

  // ---------- alterações do menu atuam sobre a seleção ----------
  function gm620SelectedShapes_(){
    try{return gm580Selected_().filter(x=>x.type==='shape');}catch(_){return [];}
  }
  function gm620ApplyStyle_(kind,val){
    const shapes=gm620SelectedShapes_();
    if(!shapes.length)return false;
    gm620Hist_();
    for(const it of shapes){
      const f=it.ref,line=String(f.tipo||'').startsWith('linha');
      if(kind==='color'){
        if(line)f.stroke=val; else f.fill=val;
      }else if(kind==='opacity'){
        if(line)f.strokeOpacity=val; else f.fillOpacity=val;
      }else if(kind==='borderColor') f.stroke=val;
      else if(kind==='borderWidth') f.strokeWidth=val;
      else if(kind==='borderOpacity') f.strokeOpacity=val;
    }
    gmOficinaPersistir_();gm580Render_();return true;
  }

  const c580=window.gm580Color_;
  window.gm580Color_=function(v){
    const c=gm580Hex_(v,gmOficinaV2Cfg_.cor||'#111111');
    gmOficinaV2Cfg_.cor=c;
    if(!gm620ApplyStyle_('color',c)) c580?.(c);
    gm580Sync_?.();
  };
  const o580=window.gm580Opacity_;
  window.gm580Opacity_=function(v){
    const x=Math.max(0,Math.min(1,Number(v)/100));gmOficinaV2Cfg_.opacidade=x;
    if(!gm620ApplyStyle_('opacity',x)) o580?.(v);
    gm580Sync_?.();
  };
  const bc580=window.gm580BorderColor_;
  window.gm580BorderColor_=function(v){
    const c=gm580Hex_(v,gm570_.borderColor||'#111111');gm570_.borderColor=c;gm580_.borderColor=c;
    if(!gm620ApplyStyle_('borderColor',c)) bc580?.(c);
    gm580Sync_?.();
  };
  const bw580=window.gm580BorderWidth_;
  window.gm580BorderWidth_=function(v){
    const x=Math.max(0,Math.min(20,Number(v)||0));gm570_.borderWidth=x;gm580_.borderWidth=x;
    if(!gm620ApplyStyle_('borderWidth',x)) bw580?.(v);
    gm580Sync_?.();
  };
  const bo580=window.gm580BorderOpacity_;
  window.gm580BorderOpacity_=function(v){
    const x=Math.max(0,Math.min(1,Number(v)/100));gm570_.borderOpacity=x;gm580_.borderOpacity=x;
    if(!gm620ApplyStyle_('borderOpacity',x)) bo580?.(v);
    gm580Sync_?.();
  };

  // ---------- botões de formas: ferramenta persistente ----------
  function gm620ShapeButtons_(){
    const tb=document.getElementById('gm580Toolbar');if(!tb)return [];
    return [...tb.querySelectorAll('button')].filter(b=>(b.getAttribute('onclick')||'').includes("gm580Shape_"));
  }
  function gm620RefreshButtons_(){
    for(const b of gm620ShapeButtons_()){
      const m=(b.getAttribute('onclick')||'').match(/gm580Shape_\('([^']+)'\)/);
      b.classList.toggle('btn-select',!!m&&m[1]===gm620_.activeShape);
    }
  }
  window.gm580Shape_=function(tipo){
    tipo=String(tipo||'');
    if(tipo==='arredondado')tipo='retangulo';
    gm620_.activeShape=tipo;
    gm580_.mode='shape';
    gmOficinaV2Cfg_.ativo=false;
    gmVet490_.tool='select';
    gm570_.edit=true;
    const cv=document.getElementById('gmOficinaV2Canvas');if(cv)cv.style.pointerEvents='none';
    gm620RefreshButtons_();gm580Render_();
  };

  // ---------- criar forma com um clique em espaço vazio ----------
  function gm620CreateShapeAt_(ev){
    if(!gm620_.activeShape)return false;
    const svg=document.getElementById('gmOficinaVectorLayer');if(!svg||ev.target!==svg)return false;
    ev.preventDefault();ev.stopPropagation();gm620Hist_();
    const r=svg.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    const px=Math.max(0,Math.min(gmOficinaEstado_.larguraM,(ev.clientX-r.left)/ppm));
    const py=Math.max(0,Math.min(gmOficinaEstado_.alturaM,(ev.clientY-r.top)/ppm));
    const tipo=gm620_.activeShape;
    const one=1;
    const f={
      id:`vet:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,tipo,
      x:Math.max(0,px-one/2),y:Math.max(0,py-one/2),w:one,h:one,rot:0,radius:0,
      stroke:gm570_.borderColor,fill:gmOficinaV2Cfg_.cor,
      strokeWidth:gm570_.borderWidth,strokeOpacity:gm570_.borderOpacity,
      fillOpacity:gmOficinaV2Cfg_.opacidade,opacity:1,
      ordemOficina:gm600NextOrder_()
    };
    gmVet490Formas_().push(f);
    gm580_.selection.clear();gm580_.selection.add(gm580Key_('shape',f.id));
    gm570_.selected={type:'shape',id:f.id};gmVet490_.selectedId=f.id;
    gm570_.edit=true;
    gmOficinaPersistir_();gm580Render_();gm620LoadStyle_({type:'shape',ref:f});
    return true;
  }

  // ---------- mover formas e objetos sem Ctrl quando estão selecionáveis ----------
  window.gm570ShapeDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();
    const f=gmVet490Forma_(id);if(!f)return;
    gm580Select_('shape',id,ev.ctrlKey||ev.metaKey);
    if(ev.ctrlKey||ev.metaKey)return; // Ctrl reservado à multi-seleção
    gm620Hist_();
    gm570_.edit=true;
    const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY;
    const st={x:Number(f.x||0),y:Number(f.y||0),x2:Number(f.x2??f.x),y2:Number(f.y2??f.y),cx:Number(f.cx||0),cy:Number(f.cy||0)};
    const move=e=>{
      const dx=(e.clientX-sx)/ppm,dy=(e.clientY-sy)/ppm;
      f.x=st.x+dx;f.y=st.y+dy;
      if(String(f.tipo||'').startsWith('linha')){
        f.x2=st.x2+dx;f.y2=st.y2+dy;
        if(f.tipo==='linha_curva'){f.cx=st.cx+dx;f.cy=st.cy+dy;}
      }
      gm580Render_();
    };
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };

  window.gm570ObjectDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();
    const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));if(!o)return;
    gm580Select_('object',id,ev.ctrlKey||ev.metaKey);
    if(ev.ctrlKey||ev.metaKey)return;
    gm620Hist_();
    const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY,ox=Number(o.x||0),oy=Number(o.y||0);
    const move=e=>{o.x=ox+(e.clientX-sx)/ppm;o.y=oy+(e.clientY-sy)/ppm;gm580Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };

  // ---------- redimensionamento de objetos preservando proporção ----------
  function gm620ObjectHandles_(o,ppm){
    const w=Math.max(.05,Number(o.larguraM||1))*ppm,h=Math.max(.05,Number(o.alturaM||1))*ppm;
    const cx=Number(o.x||0)*ppm,cy=Number(o.y||0)*ppm,x=cx-w/2,y=cy-h/2;
    const id=String(o.id).replace(/'/g,"\\'");
    const hs=[['nw',x,y],['ne',x+w,y],['se',x+w,y+h],['sw',x,y+h]];
    return `<g data-gm620-object-handles="1">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#19cfe8" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>
      ${hs.map(q=>`<circle cx="${q[1]}" cy="${q[2]}" r="6" fill="#fff" stroke="#19cfe8" stroke-width="2" pointer-events="auto" onpointerdown="gm620ResizeObject_(event,'${id}','${q[0]}')" style="cursor:nwse-resize"/>`).join('')}
      <line x1="${cx}" y1="${y}" x2="${cx}" y2="${y-28}" stroke="#19cfe8" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
      <circle cx="${cx}" cy="${y-32}" r="7" fill="#fff" stroke="#19cfe8" stroke-width="2" pointer-events="auto" onpointerdown="gm600RotateObject_(event,'${id}')" style="cursor:grab"/>
    </g>`;
  }
  window.gm620ResizeObject_=function(ev,id,corner){
    ev.preventDefault();ev.stopPropagation();
    const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));if(!o)return;
    gm620Hist_();
    const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY;
    const sw=Math.max(.05,Number(o.larguraM||1)),sh=Math.max(.05,Number(o.alturaM||1)),ratio=sw/sh;
    const cx=Number(o.x||0),cy=Number(o.y||0);
    const signX=corner.includes('e')?1:-1,signY=corner.includes('s')?1:-1;
    const anchorX=cx-signX*sw/2,anchorY=cy-signY*sh/2;
    const move=e=>{
      let nw=Math.max(.1,Math.abs((e.clientX-sx)/ppm + signX*sw));
      let nh=nw/ratio;
      const dy=Math.abs((e.clientY-sy)/ppm + signY*sh);
      if(dy>nh){nh=Math.max(.1,dy);nw=nh*ratio;}
      o.larguraM=nw;o.alturaM=nh;
      o.x=anchorX+signX*nw/2;o.y=anchorY+signY*nh/2;
      gm580Render_();
    };
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };

  // ---------- render final: canvas vazio cria forma; objeto selecionado ganha alças ----------
  const gm620RenderBase_=gm580Render_;
  gm580Render_=function(){
    gm620RenderBase_();
    const svg=document.getElementById('gmOficinaVectorLayer');
    if(svg){
      svg.onpointerdown=function(ev){
        if(gm620CreateShapeAt_(ev))return;
        if(gm580_.mode==='select' && ev.target===svg){gm580ClearSel_();}
      };
      svg.querySelectorAll('[data-gm620-object-handles]').forEach(x=>x.remove());
      const p=gm580Primary_();
      if(p?.type==='object'){
        const g=document.createElementNS('http://www.w3.org/2000/svg','g');
        g.innerHTML=gm620ObjectHandles_(p.ref,gmOficinaV2Ppm_());
        svg.appendChild(g);
      }
    }
    gm620RefreshButtons_();
  };

  // ---------- desenho livre desliga edição de formas ----------
  const gm620ToolBase_=window.gm580Tool_;
  window.gm580Tool_=function(v){
    gm620_.activeShape='';
    gm620ToolBase_(v);
    gm620RefreshButtons_();
  };

  // ---------- remover botão redundante "Retângulo arredondado" ----------
  function gm620CleanShapeUI_(){
    const tb=document.getElementById('gm580Toolbar');if(!tb)return;
    [...tb.querySelectorAll('button')].forEach(b=>{
      const oc=b.getAttribute('onclick')||'';
      if(oc.includes("gm580Shape_('arredondado')"))b.remove();
    });
  }

  // ---------- imagem colada: proporção + remover fundo ----------
  const gm620ClipBase_=gm570AddClipboardImage_;
  gm570AddClipboardImage_=async function(file){
    const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});
    const dims=await new Promise(res=>{const im=new Image();im.onload=()=>res([im.naturalWidth||1,im.naturalHeight||1]);im.onerror=()=>res([1,1]);im.src=data;});
    const ratio=dims[0]/dims[1],base=3,w=ratio>=1?base:base*ratio,h=ratio>=1?base/ratio:base;
    gm620Hist_();
    const o={id:`ofobj:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,nome:'Imagem colada',imagem:data,
      x:gmOficinaEstado_.larguraM/2,y:gmOficinaEstado_.alturaM/2,
      larguraM:Math.max(.2,w),alturaM:Math.max(.2,h),aspectRatio:ratio,
      angulo:0,ordemOficina:gm600NextOrder_(),sombraOficina:'nenhuma',coladoClipboard:true};
    gmOficinaEstado_.objetos.push(o);
    gm580_.selection.clear();gm580_.selection.add(gm580Key_('object',o.id));gm570_.selected={type:'object',id:o.id};
    gmOficinaPersistir_();gm580Render_();
  };

  window.gm620RemoveBg_=async function(){
    const p=gm580Primary_();if(p?.type!=='object')return;
    const o=p.ref,src=String(o.imagem||'').trim();if(!src)return;
    const tol=Math.max(1,Math.min(90,Number(document.getElementById('gm620BgTol')?.value||38)));
    try{
      gm620Hist_();
      const im=new Image();if(/^https?:/i.test(String(src)))im.crossOrigin='anonymous';
      await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=src;});
      const c=bancoRemoverFundoCanvas_(im,tol);
      o.imagem=c.toDataURL('image/png');
      gmOficinaPersistir_();gm580Render_();gm580Inspector_();
      notificar_?.('Fundo removido da imagem colada.','sucesso',2200);
    }catch(e){
      console.error(e);
      notificar_?.('Não consegui remover o fundo desta imagem.','erro',3500);
    }
  };

  function gm620SetObjSize_(axis,v){
    const p=gm580Primary_();if(p?.type!=='object')return;
    const o=p.ref,ratio=Math.max(.0001,Number(o.aspectRatio||((Number(o.larguraM)||1)/(Number(o.alturaM)||1))));
    gm620Hist_();
    if(axis==='w'){o.larguraM=Math.max(.1,Number(v)||.1);o.alturaM=o.larguraM/ratio;}
    else{o.alturaM=Math.max(.1,Number(v)||.1);o.larguraM=o.alturaM*ratio;}
    gmOficinaPersistir_();gm580Render_();gm580Inspector_();
  }
  window.gm620SetObjSize_=gm620SetObjSize_;

  const gm620InspectorBase_=gm580Inspector_;
  gm580Inspector_=function(){
    gm620InspectorBase_();
    const box=document.getElementById('gm580Inspector'),p=gm580Primary_();if(!box||p?.type!=='object')return;
    const o=p.ref;
    box.insertAdjacentHTML('beforeend',`
      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.08)">
        <strong style="color:#8ee7ff">Tamanho do objeto</strong>
        <label><small>Largura (m)</small><input type="number" min=".1" step=".1" value="${Number(o.larguraM||1).toFixed(2)}" onchange="gm620SetObjSize_('w',this.value)" style="width:86px"></label>
        <label><small>Altura (m)</small><input type="number" min=".1" step=".1" value="${Number(o.alturaM||1).toFixed(2)}" onchange="gm620SetObjSize_('h',this.value)" style="width:86px"></label>
        ${o.coladoClipboard||String(o.nome||'')==='Imagem colada'?`
          <label><small>Tolerância fundo</small><input id="gm620BgTol" type="range" min="8" max="90" value="38"></label>
          <button class="btn-small" onclick="gm620RemoveBg_()">✂️ Remover fundo</button>`:''}
        <span style="color:#9fb4c8;font-size:.82em">1 quadrado da grade = 1 m × 1 m. O redimensionamento mantém a proporção.</span>
      </div>`);
  };

  // ---------- corrigir histórico antes de handles de forma ----------
  const rHandle=window.gm570ResizeHandle_;
  window.gm570ResizeHandle_=function(ev,id,which){gm620Hist_();return rHandle(ev,id,which);};
  const radHandle=window.gm570RadiusHandle_;
  window.gm570RadiusHandle_=function(ev,id){gm620Hist_();return radHandle(ev,id);};
  const rotHandle=window.gm570RotateHandle_;
  window.gm570RotateHandle_=function(ev,id){gm620Hist_();return rotHandle(ev,id);};
  const curveHandle=window.gm570CurveHandle_;
  window.gm570CurveHandle_=function(ev,id){gm620Hist_();return curveHandle(ev,id);};

  // ---------- montagem ----------
  function gm620Install_(){
    gm620CleanShapeUI_();
    gm620RefreshButtons_();
    // Sem observer global. Apenas instala quando a Oficina existe.
  }
  const renderOpen=window.gmOficinaRender_;
  window.gmOficinaRender_=function(){
    const r=renderOpen.apply(this,arguments);
    requestAnimationFrame(()=>{try{gm620Install_();gm580Render_();}catch(e){console.warn('Oficina 46.62',e)}});
    return r;
  };
  setTimeout(()=>{try{gm620Install_();}catch(_){ }},1000);
})();



// ============================================================
// V46.77.0 — estados separados, undo/redo real, sombra persistente,
// fixar formas, ferramenta persistente e feedback de carregamento
// ============================================================
(function(){
  const gm630_ = {
    tool:'select',
    shape:'',
    line:'',
    objectId:'',
    suppressHistory:false,
    loadingStartedAt:0
  };

  function gm630Snapshot_(){
    return JSON.parse(JSON.stringify({
      desenhos:gmOficinaEstado_.desenhos||[],
      objetos:gmOficinaEstado_.objetos||[],
      formas:gmOficinaEstado_.formas||[],
      larguraM:gmOficinaEstado_.larguraM,
      alturaM:gmOficinaEstado_.alturaM,
      pxPorMetro:gmOficinaEstado_.pxPorMetro,
      fundo:gmOficinaEstado_.fundo,
      corGrade:gmOficinaEstado_.corGrade,
      gradeVisivel:gmOficinaEstado_.gradeVisivel,
      textura:gmOficinaEstado_.textura
    }));
  }
  function gm630PushHistory_(){
    if(gm630_.suppressHistory)return;
    gmOficinaV2Undo_.push(gm630Snapshot_());
    if(gmOficinaV2Undo_.length>120)gmOficinaV2Undo_.shift();
    gmOficinaV2Redo_.length=0;
  }
  function gm630Restore_(snap){
    gm630_.suppressHistory=true;
    try{
      gmOficinaEstado_.desenhos=snap.desenhos||[];
      gmOficinaEstado_.objetos=snap.objetos||[];
      gmOficinaEstado_.formas=snap.formas||[];
      if(snap.larguraM!=null)gmOficinaEstado_.larguraM=snap.larguraM;
      if(snap.alturaM!=null)gmOficinaEstado_.alturaM=snap.alturaM;
      if(snap.pxPorMetro!=null)gmOficinaEstado_.pxPorMetro=snap.pxPorMetro;
      if(snap.fundo!=null)gmOficinaEstado_.fundo=snap.fundo;
      if(snap.corGrade!=null)gmOficinaEstado_.corGrade=snap.corGrade;
      if(snap.gradeVisivel!=null)gmOficinaEstado_.gradeVisivel=snap.gradeVisivel;
      if(snap.textura!=null)gmOficinaEstado_.textura=snap.textura;
      gm580_.selection?.clear?.();
      gm570_.selected={type:'',id:''};
      gmVet490_.selectedId='';
      gmOficinaObjSel553_='';
      gm570_.strokeCache?.clear?.();
      gmOficinaPersistir_();
      gmOficinaRender_();
    } finally {
      gm630_.suppressHistory=false;
    }
  }
  window.gmOficinaV2Historico_=gm630PushHistory_;
  window.gmOficinaV2Undo_=function(){
    if(!gmOficinaV2Undo_.length)return;
    gmOficinaV2Redo_.push(gm630Snapshot_());
    gm630Restore_(gmOficinaV2Undo_.pop());
  };
  window.gmOficinaV2Redo_=function(){
    if(!gmOficinaV2Redo_.length)return;
    gmOficinaV2Undo_.push(gm630Snapshot_());
    gm630Restore_(gmOficinaV2Redo_.pop());
  };

  function gm630ApplySelection_(type,id,add=false){
    const key=gm580Key_(type,id);
    if(!add)gm580_.selection.clear();
    if(add && gm580_.selection.has(key))gm580_.selection.delete(key);
    else gm580_.selection.add(key);
    const p=gm580Primary_();
    gm570_.selected=p?{type:p.type,id:String(p.id)}:{type:'',id:''};
    gmVet490_.selectedId=p?.type==='shape'?String(p.id):'';
    gmOficinaObjSel553_=p?.type==='object'?String(p.id):'';
    if(p?.type==='shape'){
      gm570_.edit=true;
      gm630LoadStyleFromElement_(p);
    }
    gm580Render_();gm580Inspector_();
  }
  window.gm580Select_=gm630ApplySelection_;
  window.gm570Select_=function(type,id){gm630ApplySelection_(type,id,false);};

  function gm630ClearSelection_(){
    gm580_.selection.clear();
    gm570_.selected={type:'',id:''};
    gmVet490_.selectedId='';
    gmOficinaObjSel553_='';
    gm580Render_();gm580Inspector_();
  }

  function gm630LoadStyleFromElement_(it){
    if(!it)return;
    const r=it.ref;
    if(it.type==='shape'){
      const line=String(r.tipo||'').startsWith('linha');
      gmOficinaV2Cfg_.cor=line?(r.stroke||gmOficinaV2Cfg_.cor):(r.fill||gmOficinaV2Cfg_.cor);
      gmOficinaV2Cfg_.opacidade=line?Number(r.strokeOpacity??1):Number(r.fillOpacity??1);
      gm570_.borderColor=r.stroke||gm570_.borderColor;
      gm570_.borderWidth=Math.max(0,Number(r.strokeWidth??0));
      gm570_.borderOpacity=Number(r.strokeOpacity??1);
    }
    if(r.sombraOficina)gm580_.shadowPreset=r.sombraOficina;
    if(r.sombraDirecao)gm580_.shadowDir=r.sombraDirecao;
    if(r.sombraDist!=null)gm580_.shadowDist=Number(r.sombraDist);
    gm580Sync_?.();gm580Inspector_?.();
  }

  function gm630CurrentShadow_(){
    const p=gm580Primary_();
    return {
      preset:p?.ref?.sombraOficina ?? gm580_.shadowPreset ?? 'nenhuma',
      dir:p?.ref?.sombraDirecao ?? gm580_.shadowDir ?? 'SE',
      dist:Number(p?.ref?.sombraDist ?? gm580_.shadowDist ?? 4)
    };
  }

  window.gm580Shadow_=function(k,v){
    const sel=gm580Selected_();
    if(sel.length){
      gm630PushHistory_();
      for(const it of sel){
        if(k==='sombraOficina')it.ref.sombraOficina=v;
        else if(k==='sombraDirecao')it.ref.sombraDirecao=v;
        else if(k==='sombraDist')it.ref.sombraDist=Number(v);
      }
      gmOficinaPersistir_();gm580Render_();gm580Inspector_();
    }else{
      if(k==='sombraOficina')gm580_.shadowPreset=v;
      else if(k==='sombraDirecao')gm580_.shadowDir=v;
      else if(k==='sombraDist')gm580_.shadowDist=Number(v);
    }
  };

  const inspector630base=gm580Inspector_;
  gm580Inspector_=function(){
    const box=document.getElementById('gm580Inspector');if(!box)return;
    const s=gm580Selected_();
    if(!s.length){
      const sh=gm630CurrentShadow_();
      box.innerHTML=`<div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
        <strong style="color:#8ee7ff">Próximos elementos</strong>
        <label><small>Sombra</small><select onchange="gm580Shadow_('sombraOficina',this.value)">
          ${['nenhuma','suave','media','forte'].map(v=>`<option value="${v}" ${sh.preset===v?'selected':''}>${v==='media'?'média':v}</option>`).join('')}
        </select></label>
        <label><small>Direção</small><select onchange="gm580Shadow_('sombraDirecao',this.value)">
          ${['N','NE','E','SE','S','SO','O','NO'].map(v=>`<option ${sh.dir===v?'selected':''}>${v}</option>`).join('')}
        </select></label>
        <label><small>Distância</small><input type="number" min="1" max="30" value="${sh.dist}" onchange="gm580Shadow_('sombraDist',this.value)" style="width:70px"></label>
      </div>`;
      return;
    }
    inspector630base();
    const p=gm580Primary_();if(!p)return;
    const locked=!!p.ref.fixada;
    box.insertAdjacentHTML('beforeend',`
      <div style="margin-top:7px">
        <button class="btn-small ${locked?'btn-select':''}" onclick="gm630ToggleLock_()">🔒 ${locked?'Desafixar':'Fixar'} elemento</button>
      </div>`);
  };

  window.gm630ToggleLock_=function(){
    const p=gm580Primary_();if(!p)return;
    gm630PushHistory_();
    p.ref.fixada=!p.ref.fixada;
    gmOficinaPersistir_();gm580Render_();gm580Inspector_();
  };

  function gm630ShadowProps_(){
    const sh=gm630CurrentShadow_();
    return {sombraOficina:sh.preset,sombraDirecao:sh.dir,sombraDist:sh.dist};
  }

  function gm630MarkTools_(){
    const tb=document.getElementById('gm580Toolbar');if(!tb)return;
    [...tb.querySelectorAll('button')].forEach(b=>{
      const oc=b.getAttribute('onclick')||'';
      if(oc.includes('gm580Shape_')){
        const m=oc.match(/gm580Shape_\('([^']+)'\)/);
        b.classList.toggle('btn-select',!!m&&gm630_.tool==='shape'&&m[1]===gm630_.shape);
      }
    });
    const toolSel=document.getElementById('gm580Tool');
    if(toolSel&&gm630_.tool==='select')toolSel.value='select';
    if(toolSel&&gm630_.tool==='draw')toolSel.value=gm580_.mode;
  }

  const toolBase630=window.gm580Tool_;
  window.gm580Tool_=function(v){
    gm630ClearSelection_();
    gm630_.shape='';gm630_.line='';gm630_.objectId='';
    if(v==='select'){
      gm630_.tool='select';gm580_.mode='select';gmOficinaV2Cfg_.ativo=false;
    }else{
      gm630_.tool='draw';gm580_.mode=v;toolBase630(v);
    }
    gm630MarkTools_();
  };

  window.gm580Shape_=function(tipo){
    tipo=String(tipo||'');
    if(tipo==='arredondado')tipo='retangulo';
    gm630ClearSelection_();
    gm630_.tool='shape';gm630_.shape=tipo;gm630_.line='';gm630_.objectId='';
    gm580_.mode='shape';gmOficinaV2Cfg_.ativo=false;gmVet490_.tool='select';gm570_.edit=true;
    const cv=document.getElementById('gmOficinaV2Canvas');if(cv)cv.style.pointerEvents='none';
    gm630MarkTools_();gm580Render_();
  };

  window.gm580Line_=function(v){
    if(!v)return;
    gm630ClearSelection_();
    gm630_.tool='line';gm630_.line=v;gm630_.shape='';gm630_.objectId='';
    gm580_.mode='line';gmOficinaV2Cfg_.ativo=false;
    if(typeof gm570LineTool_==='function')gm570LineTool_(v);else gmVet490Tool_(v);
  };

  function gm630ShapeAt_(x,y,w=1,h=1){
    const tipo=gm630_.shape;if(!tipo)return null;
    const f={
      id:`vet:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,tipo,
      x,y,w,h,rot:0,radius:0,
      stroke:gm570_.borderColor,fill:gmOficinaV2Cfg_.cor,
      strokeWidth:gm570_.borderWidth,strokeOpacity:gm570_.borderOpacity,
      fillOpacity:gmOficinaV2Cfg_.opacidade,opacity:1,
      ordemOficina:gm600NextOrder_(),...gm630ShadowProps_()
    };
    gmVet490Formas_().push(f);return f;
  }

  function gm630PointHitsUnlockedShape_(mx,my){
    const shapes=[...(gmVet490Formas_()||[])].sort((a,b)=>Number(b.ordemOficina||0)-Number(a.ordemOficina||0));
    return shapes.find(f=>{
      if(f.fixada)return false;
      const b=gm580BBox_({type:'shape',ref:f});
      return mx>=b.x&&mx<=b.x+b.w&&my>=b.y&&my<=b.y+b.h;
    })||null;
  }

  function gm630InstallStageEvents_(){
    const svg=document.getElementById('gmOficinaVectorLayer');if(!svg||svg.dataset.gm630)return;
    svg.dataset.gm630='1';
    svg.addEventListener('pointerdown',ev=>{
      const r=svg.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
      const sx=(ev.clientX-r.left)/ppm,sy=(ev.clientY-r.top)/ppm;

      if(gm630_.tool==='shape'&&gm630_.shape){
        const hit=gm630PointHitsUnlockedShape_(sx,sy);
        if(hit){
          gm630ApplySelection_('shape',hit.id,false);
          return;
        }
        ev.preventDefault();ev.stopPropagation();
        gm630PushHistory_();
        let created=null,moved=false;
        const move=e=>{
          moved=true;
          const ex=(e.clientX-r.left)/ppm,ey=(e.clientY-r.top)/ppm;
          if(!created)created=gm630ShapeAt_(sx,sy,.05,.05);
          created.x=Math.min(sx,ex);created.y=Math.min(sy,ey);
          created.w=Math.max(.05,Math.abs(ex-sx));created.h=Math.max(.05,Math.abs(ey-sy));
          gm580Render_();
        };
        const up=()=>{
          window.removeEventListener('pointermove',move);
          if(!moved)created=gm630ShapeAt_(Math.max(0,sx-.5),Math.max(0,sy-.5),1,1);
          if(created){
            gm580_.selection.clear();gm580_.selection.add(gm580Key_('shape',created.id));
            gm570_.selected={type:'shape',id:created.id};gmVet490_.selectedId=created.id;gm570_.edit=true;
          }
          gmOficinaPersistir_();gm580Render_();
        };
        window.addEventListener('pointermove',move,{passive:true});
        window.addEventListener('pointerup',up,{once:true});
        return;
      }

      if(gm630_.tool==='select'&&ev.target===svg)gm630ClearSelection_();
    },true);
  }

  window.gm570ShapeDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();
    const f=gmVet490Forma_(id);if(!f)return;
    gm630ApplySelection_('shape',id,ev.ctrlKey||ev.metaKey);
    if(f.fixada)return;
    gm630PushHistory_();
    const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY;
    const ox=Number(f.x||0),oy=Number(f.y||0);
    const move=e=>{f.x=ox+(e.clientX-sx)/ppm;f.y=oy+(e.clientY-sy)/ppm;gm580Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };
  window.gm570ObjectDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();
    const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));if(!o)return;
    gm630ApplySelection_('object',id,ev.ctrlKey||ev.metaKey);
    if(o.fixada)return;
    gm630PushHistory_();
    const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY,ox=Number(o.x||0),oy=Number(o.y||0);
    const move=e=>{o.x=ox+(e.clientX-sx)/ppm;o.y=oy+(e.clientY-sy)/ppm;gm580Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };

  function gm630CanEditSelection_(){return gm630_.tool==='select'&&gm580Selected_().length>0;}

  const c630=window.gm580Color_;
  window.gm580Color_=function(v){
    if(!gm630CanEditSelection_()){gmOficinaV2Cfg_.cor=gm580Hex_(v,gmOficinaV2Cfg_.cor||'#111111');gm580Sync_();return;}
    c630(v);
  };
  const o630=window.gm580Opacity_;
  window.gm580Opacity_=function(v){
    if(!gm630CanEditSelection_()){gmOficinaV2Cfg_.opacidade=Math.max(0,Math.min(1,Number(v)/100));gm580Sync_();return;}
    o630(v);
  };
  const bc630=window.gm580BorderColor_;
  window.gm580BorderColor_=function(v){
    if(!gm630CanEditSelection_()){
      gm570_.borderColor=gm580Hex_(v,gm570_.borderColor||'#111111');gm580_.borderColor=gm570_.borderColor;gm580Sync_();return;
    }
    bc630(v);
  };
  const bw630=window.gm580BorderWidth_;
  window.gm580BorderWidth_=function(v){
    if(!gm630CanEditSelection_()){gm570_.borderWidth=Math.max(0,Number(v)||0);gm580_.borderWidth=gm570_.borderWidth;gm580Sync_();return;}
    bw630(v);
  };
  const bo630=window.gm580BorderOpacity_;
  window.gm580BorderOpacity_=function(v){
    if(!gm630CanEditSelection_()){gm570_.borderOpacity=Math.max(0,Math.min(1,Number(v)/100));gm580_.borderOpacity=gm570_.borderOpacity;gm580Sync_();return;}
    bo630(v);
  };

  function gm630Roundable_(tipo){
    return !['circulo','elipse','coracao','meialua','semicirculo'].includes(String(tipo||''));
  }
  const handles630base=gm570Handles_;
  gm570Handles_=function(f,ppm){
    let h=handles630base_(f,ppm);
    if(!gm630Roundable_(f.tipo))return h;
    if(!h.includes('gm570RadiusHandle_')){
      const x=Number(f.x||0)*ppm,y=Number(f.y||0)*ppm,w=Math.abs(Number(f.w||1))*ppm,hgt=Math.abs(Number(f.h||1))*ppm;
      const id=String(f.id).replace(/'/g,"\\'");
      h+=`<circle cx="${x+Math.min(w,hgt)*.22}" cy="${y+Math.min(w,hgt)*.22}" r="7" fill="#fff" stroke="#19cfe8" stroke-width="2"
        pointer-events="auto" onpointerdown="gm570RadiusHandle_(event,'${id}')" style="cursor:nwse-resize"/>`;
    }
    return h;
  };

  function gm630BusyBtn_(btn,on,label){
    if(!btn)return;
    if(on){
      if(!btn.dataset.gm630Text)btn.dataset.gm630Text=btn.textContent;
      btn.dataset.gm630Busy='1';
      btn.style.boxShadow='inset 0 0 0 2px rgba(255,255,255,.28),0 0 16px rgba(0,212,255,.7)';
      btn.style.transform='translateY(1px)';
      btn.style.opacity='.88';
      btn.disabled=true;
      if(label)btn.textContent=label;
    }else{
      btn.style.boxShadow='';btn.style.transform='';btn.style.opacity='';btn.disabled=false;
      if(btn.dataset.gm630Text){btn.textContent=btn.dataset.gm630Text;delete btn.dataset.gm630Text;}
      delete btn.dataset.gm630Busy;
    }
  }
  function gm630WrapAsyncButton_(selector,words){
    document.querySelectorAll(selector).forEach(btn=>{
      if(btn.dataset.gm630Wrapped)return;
      const t=(btn.textContent||'').toLowerCase();
      if(!words.some(w=>t.includes(w)))return;
      btn.dataset.gm630Wrapped='1';
      btn.addEventListener('click',()=>{
        gm630BusyBtn_(btn,true,'Carregando…');
        setTimeout(()=>{if(btn.dataset.gm630Busy)gm630BusyBtn_(btn,false)},180000);
      },true);
    });
  }
  function gm630InstallBusyButtons_(){
    gm630WrapAsyncButton_('button',['entrar','login','criar personagem','criar conta','cadastrar']);
  }

  function gm630Mark_(name){
    const now=performance.now();
    if(!gm630_.loadingStartedAt)gm630_.loadingStartedAt=now;
    console.info(`[Mesa Estelar] ${name}: ${((now-gm630_.loadingStartedAt)/1000).toFixed(1)}s`);
  }
  window.gm630Mark_=gm630Mark_;

  const render630base=gm580Render_;
  gm580Render_=function(){
    render630base();
    gm630InstallStageEvents_();
    gm630MarkTools_();
  };

  const open630base=window.gmOficinaRender_;
  window.gmOficinaRender_=function(){
    const r=open630base.apply(this,arguments);
    requestAnimationFrame(()=>{gm630InstallStageEvents_();gm630MarkTools_();});
    return r;
  };

  setInterval(gm630InstallBusyButtons_,1200);
  setTimeout(()=>{gm630InstallBusyButtons_();gm630Mark_('interface carregada');},1000);
})();



// ============================================================
// V46.77.0 — hotfix Ctrl+V duplicado + corte de imagens
// ============================================================
(function(){
  // Há dois listeners históricos de paste na Oficina. Para IMAGENS,
  // este listener em capture assume a operação uma única vez e impede
  // que os listeners antigos recebam o mesmo evento.
  document.addEventListener('paste',function(e){
    const oficina=document.getElementById('gm580Toolbar')||document.getElementById('gmOficinaV2Map');
    if(!oficina)return;
    const items=[...(e.clipboardData?.items||[])];
    const img=items.find(i=>i.kind==='file' && i.type?.startsWith('image/'));
    if(!img)return; // texto / clipboard interno continua nas rotinas normais
    e.preventDefault();
    e.stopImmediatePropagation();
    const f=img.getAsFile();
    if(f&&typeof gm570AddClipboardImage_==='function')gm570AddClipboardImage_(f);
  },true);

  // Guarda fonte original da imagem colada para permitir novo recorte.
  const clip631base=window.gm570AddClipboardImage_;
  window.gm570AddClipboardImage_=async function(file){
    const before=new Set((gmOficinaEstado_.objetos||[]).map(o=>String(o.id)));
    await clip631base(file);
    const novo=(gmOficinaEstado_.objetos||[]).find(o=>!before.has(String(o.id)));
    if(novo){
      novo.imagemOriginal631=novo.imagem;
      novo.crop631={left:0,right:0,top:0,bottom:0};
      gmOficinaPersistir_();
      gm580Render_();
      gm580Inspector_?.();
    }
  };

  function gm631CropValues_(){
    const get=id=>Math.max(0,Math.min(45,Number(document.getElementById(id)?.value||0)));
    return {
      left:get('gm631CropL'),right:get('gm631CropR'),
      top:get('gm631CropT'),bottom:get('gm631CropB')
    };
  }
  function gm631CropValid_(c){
    return c.left+c.right<95 && c.top+c.bottom<95;
  }
  window.gm631CropPreview_=function(){
    const p=gm580Primary_();if(p?.type!=='object')return;
    const c=gm631CropValues_();
    const txt=document.getElementById('gm631CropInfo');
    if(txt)txt.textContent=gm631CropValid_(c)
      ? `Área restante: ${100-c.left-c.right}% × ${100-c.top-c.bottom}%`
      : 'Recorte excessivo.';
  };
  window.gm631ResetCrop_=function(){
    const p=gm580Primary_();if(p?.type!=='object')return;
    const o=p.ref;
    if(!o.imagemOriginal631)return;
    gmOficinaV2Historico_();
    o.imagem=o.imagemOriginal631;
    if(o.aspectRatioOriginal631){
      const area=Math.max(.1,Number(o.larguraM||1)*Number(o.alturaM||1));
      const r=o.aspectRatioOriginal631;
      o.larguraM=Math.sqrt(area*r);o.alturaM=o.larguraM/r;
      o.aspectRatio=r;
    }
    o.crop631={left:0,right:0,top:0,bottom:0};
    gmOficinaPersistir_();gm580Render_();gm580Inspector_();
  };
  window.gm631ApplyCrop_=async function(){
    const p=gm580Primary_();if(p?.type!=='object')return;
    const o=p.ref,src=o.imagemOriginal631||o.imagem;
    if(!src)return;
    const c=gm631CropValues_();
    if(!gm631CropValid_(c)){
      notificar_?.('O corte remove praticamente toda a imagem. Reduza as margens.','erro',3200);
      return;
    }
    try{
      gmOficinaV2Historico_();
      const im=new Image();if(/^https?:/i.test(String(src)))im.crossOrigin='anonymous';
      await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=src;});
      if(!o.imagemOriginal631)o.imagemOriginal631=src;
      if(!o.aspectRatioOriginal631)o.aspectRatioOriginal631=(im.naturalWidth||1)/(im.naturalHeight||1);

      const sx=Math.round(im.naturalWidth*c.left/100);
      const sy=Math.round(im.naturalHeight*c.top/100);
      const sw=Math.max(1,Math.round(im.naturalWidth*(100-c.left-c.right)/100));
      const sh=Math.max(1,Math.round(im.naturalHeight*(100-c.top-c.bottom)/100));

      const cv=document.createElement('canvas');cv.width=sw;cv.height=sh;
      const cx=cv.getContext('2d');cx.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);
      o.imagem=cv.toDataURL('image/png');
      o.crop631=c;
      const oldArea=Math.max(.01,Number(o.larguraM||1)*Number(o.alturaM||1));
      const ratio=sw/sh;
      o.aspectRatio=ratio;
      // Mantém aproximadamente a área ocupada no mapa, mas adapta a moldura
      // à nova proporção. Depois ainda pode ser redimensionada pelas alças.
      o.larguraM=Math.sqrt(oldArea*ratio);
      o.alturaM=o.larguraM/ratio;

      gmOficinaPersistir_();gm580Render_();gm580Inspector_();
      notificar_?.('Imagem recortada.','sucesso',1800);
    }catch(err){
      console.error(err);
      notificar_?.('Não consegui recortar esta imagem.','erro',3200);
    }
  };

  const insp631base=gm580Inspector_;
  gm580Inspector_=function(){
    insp631base();
    const box=document.getElementById('gm580Inspector'),p=gm580Primary_();
    if(!box||p?.type!=='object')return;
    const o=p.ref;
    const isImage=!!String(o.imagem||'').trim();
    if(!isImage)return;
    const c=o.crop631||{left:0,right:0,top:0,bottom:0};
    box.insertAdjacentHTML('beforeend',`
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.09)">
        <strong style="color:#ffd54a">✂️ Cortar imagem</strong>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:7px;margin-top:6px">
          <label><small>Esquerda %</small><input id="gm631CropL" type="range" min="0" max="45" value="${Number(c.left||0)}" oninput="gm631CropPreview_()"></label>
          <label><small>Direita %</small><input id="gm631CropR" type="range" min="0" max="45" value="${Number(c.right||0)}" oninput="gm631CropPreview_()"></label>
          <label><small>Topo %</small><input id="gm631CropT" type="range" min="0" max="45" value="${Number(c.top||0)}" oninput="gm631CropPreview_()"></label>
          <label><small>Base %</small><input id="gm631CropB" type="range" min="0" max="45" value="${Number(c.bottom||0)}" oninput="gm631CropPreview_()"></label>
        </div>
        <div id="gm631CropInfo" style="font-size:.8em;color:#9fb4c8;margin:5px 0">Ajuste as quatro bordas e aplique o corte.</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn-small" onclick="gm631ApplyCrop_()">✂️ Aplicar corte</button>
          ${o.imagemOriginal631?`<button class="btn-small" onclick="gm631ResetCrop_()">↺ Restaurar imagem</button>`:''}
        </div>
      </div>`);
    gm631CropPreview_();
  };
})();



// ============================================================
// V46.77.0 — Oficina compacta + ferramenta persistente + crop por alças
// + Ctrl+V sem duplicação
// ============================================================
(function(){
  const gm640_={
    tool:'select', // select|draw|shape|line|object
    shape:'',
    line:'',
    objectIds:[],
    pasteSig:'',
    pasteAt:0
  };

  // ---------- Ctrl+V: deduplicação no ponto único de entrada ----------
  window.gm570AddClipboardImage_=async function(file){
    const sig=[file?.name||'',file?.type||'',file?.size||0,file?.lastModified||0].join('|');
    const now=Date.now();
    if(sig && gm640_.pasteSig===sig && now-gm640_.pasteAt<1800)return;
    gm640_.pasteSig=sig;gm640_.pasteAt=now;

    const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});
    const dims=await new Promise(res=>{const im=new Image();im.onload=()=>res([im.naturalWidth||1,im.naturalHeight||1]);im.onerror=()=>res([1,1]);im.src=data;});
    const ratio=dims[0]/dims[1],base=3,w=ratio>=1?base:base*ratio,h=ratio>=1?base/ratio:base;
    gmOficinaV2Historico_();
    const o={
      id:`ofobj:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,
      nome:'Imagem colada',imagem:data,imagemOriginal631:data,
      x:gmOficinaEstado_.larguraM/2,y:gmOficinaEstado_.alturaM/2,
      larguraM:Math.max(.2,w),alturaM:Math.max(.2,h),
      aspectRatio:ratio,aspectRatioOriginal631:ratio,
      angulo:0,ordemOficina:gm600NextOrder_(),
      sombraOficina:gm580_.shadowPreset||'nenhuma',
      sombraDirecao:gm580_.shadowDir||'SE',sombraDist:Number(gm580_.shadowDist||4),
      coladoClipboard:true,cropMode640:true,crop631:{left:0,right:0,top:0,bottom:0}
    };
    gmOficinaEstado_.objetos.push(o);
    gm580_.selection.clear();gm580_.selection.add(gm580Key_('object',o.id));
    gm570_.selected={type:'object',id:o.id};gmOficinaObjSel553_=o.id;
    gmOficinaPersistir_();gm580Render_();gm580Inspector_?.();
  };

  // ---------- crop-mode: desliga ao abandonar a imagem ----------
  function gm640DeactivateCropExcept_(id=''){
    for(const o of gmOficinaEstado_.objetos||[]){
      if(o.coladoClipboard && String(o.id)!==String(id))o.cropMode640=false;
    }
  }
  const select640base=window.gm580Select_;
  window.gm580Select_=function(type,id,add=false){
    const old=gm580Primary_();
    if(old?.type==='object'&&old.ref?.coladoClipboard&&String(old.id)!==String(id))old.ref.cropMode640=false;
    gm640DeactivateCropExcept_(type==='object'?id:'');
    const r=select640base(type,id,add);
    gm580Inspector_?.();return r;
  };
  const select570_640base=window.gm570Select_;
  window.gm570Select_=function(type,id){
    return gm580Select_(type,id,false);
  };

  // ---------- crop real sobre a fonte original ----------
  async function gm640ApplyCropData_(o){
    const src=o.imagemOriginal631||o.imagem;if(!src)return;
    const c=o.crop631||{left:0,right:0,top:0,bottom:0};
    if(c.left+c.right>=95||c.top+c.bottom>=95)return;
    const im=new Image();if(/^https?:/i.test(String(src)))im.crossOrigin='anonymous';
    await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=src;});
    const sx=Math.round(im.naturalWidth*c.left/100),sy=Math.round(im.naturalHeight*c.top/100);
    const sw=Math.max(1,Math.round(im.naturalWidth*(100-c.left-c.right)/100));
    const sh=Math.max(1,Math.round(im.naturalHeight*(100-c.top-c.bottom)/100));
    const cv=document.createElement('canvas');cv.width=sw;cv.height=sh;
    cv.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,sw,sh);
    o.imagem=cv.toDataURL('image/png');o.aspectRatio=sw/sh;
  }

  // ---------- alças de crop: lados cortam para dentro, movem para fora ----------
  function gm640ImageHandles_(o,ppm){
    const w=Math.max(.05,Number(o.larguraM||1))*ppm,h=Math.max(.05,Number(o.alturaM||1))*ppm;
    const cx=Number(o.x||0)*ppm,cy=Number(o.y||0)*ppm,x=cx-w/2,y=cy-h/2;
    const id=String(o.id).replace(/'/g,"\\'");
    const rot=`<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y-28}" stroke="#19cfe8" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
      <circle cx="${cx}" cy="${y-32}" r="7" fill="#fff" stroke="#19cfe8" stroke-width="2" pointer-events="auto"
        onpointerdown="gm600RotateObject_(event,'${id}')" style="cursor:grab"><title>Girar</title></circle>`;
    if(!o.cropMode640)return `<g data-gm640-img-handles="1">${rot}</g>`;
    const side=[
      ['l',x,cy,'ew-resize'],['r',x+w,cy,'ew-resize'],
      ['t',cx,y,'ns-resize'],['b',cx,y+h,'ns-resize']
    ].map(q=>`<rect x="${q[1]-5}" y="${q[2]-5}" width="10" height="10" rx="2" fill="#fff" stroke="#19cfe8" stroke-width="2"
       pointer-events="auto" onpointerdown="gm640CropSide_(event,'${id}','${q[0]}')" style="cursor:${q[3]}"><title>Cortar pela borda</title></rect>`).join('');
    const corners=[
      ['nw',x,y],['ne',x+w,y],['se',x+w,y+h],['sw',x,y+h]
    ].map(q=>`<circle cx="${q[1]}" cy="${q[2]}" r="6" fill="#fff" stroke="#19cfe8" stroke-width="2"
       pointer-events="auto" onpointerdown="gm640ScaleImage_(event,'${id}','${q[0]}')" style="cursor:nwse-resize"><title>Redimensionar proporcionalmente</title></circle>`).join('');
    return `<g data-gm640-img-handles="1">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#19cfe8" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>
      ${side}${corners}${rot}
    </g>`;
  }

  window.gm640CropSide_=function(ev,id,side){
    ev.preventDefault();ev.stopPropagation();
    const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));if(!o)return;
    gmOficinaV2Historico_();
    const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY;
    const st={x:Number(o.x),y:Number(o.y),w:Number(o.larguraM),h:Number(o.alturaM),crop:{...(o.crop631||{left:0,right:0,top:0,bottom:0})}};
    const remX=Math.max(1,100-st.crop.left-st.crop.right),remY=Math.max(1,100-st.crop.top-st.crop.bottom);
    const move=e=>{
      const dx=(e.clientX-sx)/ppm,dy=(e.clientY-sy)/ppm;
      if(side==='l'){
        if(dx>0){const d=Math.min(st.w-.1,dx);o.larguraM=st.w-d;o.x=st.x+d/2;o.crop631={...st.crop,left:Math.min(94-st.crop.right,st.crop.left+(d/st.w)*remX)};}
        else{o.x=st.x+dx;}
      }else if(side==='r'){
        if(dx<0){const d=Math.min(st.w-.1,-dx);o.larguraM=st.w-d;o.x=st.x-d/2;o.crop631={...st.crop,right:Math.min(94-st.crop.left,st.crop.right+(d/st.w)*remX)};}
        else{o.x=st.x+dx;}
      }else if(side==='t'){
        if(dy>0){const d=Math.min(st.h-.1,dy);o.alturaM=st.h-d;o.y=st.y+d/2;o.crop631={...st.crop,top:Math.min(94-st.crop.bottom,st.crop.top+(d/st.h)*remY)};}
        else{o.y=st.y+dy;}
      }else if(side==='b'){
        if(dy<0){const d=Math.min(st.h-.1,-dy);o.alturaM=st.h-d;o.y=st.y-d/2;o.crop631={...st.crop,bottom:Math.min(94-st.crop.top,st.crop.bottom+(d/st.h)*remY)};}
        else{o.y=st.y+dy;}
      }
      gm580Render_();
    };
    const up=async()=>{window.removeEventListener('pointermove',move);await gm640ApplyCropData_(o);gmOficinaPersistir_();gm580Render_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };

  window.gm640ScaleImage_=function(ev,id,corner){
    ev.preventDefault();ev.stopPropagation();
    const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));if(!o)return;
    gmOficinaV2Historico_();
    const ppm=gmOficinaV2Ppm_(),ratio=Math.max(.0001,Number(o.aspectRatio||o.larguraM/o.alturaM||1));
    const sw=Number(o.larguraM),sh=Number(o.alturaM),cx=Number(o.x),cy=Number(o.y);
    const east=corner.includes('e'),south=corner.includes('s');
    const ax=cx+(east?-1:1)*sw/2,ay=cy+(south?-1:1)*sh/2;
    const move=e=>{
      const map=document.getElementById('gmOficinaV2Map').getBoundingClientRect();
      const mx=(e.clientX-map.left)/ppm,my=(e.clientY-map.top)/ppm;
      let nw=Math.max(.1,Math.abs(mx-ax)),nh=nw/ratio;
      const rawH=Math.max(.1,Math.abs(my-ay));
      if(rawH>nh){nh=rawH;nw=nh*ratio;}
      o.larguraM=nw;o.alturaM=nh;
      o.x=ax+(east?1:-1)*nw/2;o.y=ay+(south?1:-1)*nh/2;
      gm580Render_();
    };
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };

  window.gm640ToggleCrop_=function(){
    const p=gm580Primary_();if(p?.type!=='object'||!p.ref.coladoClipboard)return;
    p.ref.cropMode640=!p.ref.cropMode640;
    gm580Render_();gm580Inspector_();
  };

  // ---------- ferramenta persistente ----------
  const tool640base=window.gm580Tool_;
  window.gm580Tool_=function(v){
    gm640DeactivateCropExcept_();
    gm640_.shape='';gm640_.line='';gm640_.objectIds=[];
    if(v==='select'){gm640_.tool='select';}
    else{gm640_.tool='draw';}
    tool640base(v);gm640CompactState_();
  };
  window.gm580Shape_=function(tipo){
    gm640DeactivateCropExcept_();
    tipo=String(tipo||'');if(tipo==='arredondado')tipo='retangulo';
    gm640_.tool='shape';gm640_.shape=tipo;gm640_.line='';gm640_.objectIds=[];
    gm580_.mode='shape';gmOficinaV2Cfg_.ativo=false;gmVet490_.tool='select';gm570_.edit=true;
    gm580_.selection.clear();gm570_.selected={type:'',id:''};gmVet490_.selectedId='';
    gm580Render_();gm640CompactState_();
  };
  window.gm580Line_=function(v){
    if(!v)return;
    gm640DeactivateCropExcept_();
    gm640_.tool='line';gm640_.line=v;gm640_.shape='';gm640_.objectIds=[];
    gm580_.mode='line';gmOficinaV2Cfg_.ativo=false;
    gm580_.selection.clear();gm570_.selected={type:'',id:''};
    gm580Render_();gm640CompactState_();
  };

  // seleção existente pode ser editada enquanto a ferramenta ativa for forma/linha compatível.
  function gm640CanEditSelection_(){
    const p=gm580Primary_();if(!p)return false;
    if(gm640_.tool==='select')return true;
    if(gm640_.tool==='shape'&&p.type==='shape'&&!String(p.ref.tipo||'').startsWith('linha'))return true;
    if(gm640_.tool==='line'&&p.type==='shape'&&String(p.ref.tipo||'').startsWith('linha'))return true;
    return false;
  }
  function gm640ApplyToShapes_(kind,val){
    if(!gm640CanEditSelection_())return false;
    const sel=gm580Selected_().filter(x=>x.type==='shape');if(!sel.length)return false;
    gmOficinaV2Historico_();
    for(const it of sel){
      const f=it.ref,line=String(f.tipo||'').startsWith('linha');
      if(kind==='color'){if(line)f.stroke=val;else f.fill=val;}
      if(kind==='opacity'){if(line)f.strokeOpacity=val;else f.fillOpacity=val;}
      if(kind==='borderColor')f.stroke=val;
      if(kind==='borderWidth')f.strokeWidth=val;
      if(kind==='borderOpacity')f.strokeOpacity=val;
    }
    gmOficinaPersistir_();gm580Render_();return true;
  }
  window.gm580Color_=function(v){
    const c=gm580Hex_(v,gmOficinaV2Cfg_.cor||'#111111');gmOficinaV2Cfg_.cor=c;
    if(!gm640ApplyToShapes_('color',c)){gm580_.selection.size&&gm640_.tool!=='select'&&gm580_.selection.clear();}
    gm580Sync_();
  };
  window.gm580Opacity_=function(v){
    const x=Math.max(0,Math.min(1,Number(v)/100));gmOficinaV2Cfg_.opacidade=x;gm640ApplyToShapes_('opacity',x);gm580Sync_();
  };
  window.gm580BorderColor_=function(v){
    const c=gm580Hex_(v,gm570_.borderColor||'#111111');gm570_.borderColor=c;gm580_.borderColor=c;gm640ApplyToShapes_('borderColor',c);gm580Sync_();
  };
  window.gm580BorderWidth_=function(v){
    const x=Math.max(0,Math.min(20,Number(v)||0));gm570_.borderWidth=x;gm580_.borderWidth=x;gm640ApplyToShapes_('borderWidth',x);gm580Sync_();
  };
  window.gm580BorderOpacity_=function(v){
    const x=Math.max(0,Math.min(1,Number(v)/100));gm570_.borderOpacity=x;gm580_.borderOpacity=x;gm640ApplyToShapes_('borderOpacity',x);gm580Sync_();
  };

  // ---------- criação persistente de forma/linha/objeto ----------
  function gm640Point_(ev){
    const map=document.getElementById('gmOficinaV2Map').getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    return {x:(ev.clientX-map.left)/ppm,y:(ev.clientY-map.top)/ppm,ppm};
  }
  function gm640Hit_(x,y){
    const items=gm580Items_().slice().reverse();
    return items.find(it=>{
      if(it.ref.fixada)return false;
      const b=gm580BBox_(it);
      return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
    })||null;
  }
  function gm640NewShape_(tipo,x,y,w,h){
    return {
      id:`vet:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,tipo,
      x,y,w,h,rot:0,radius:0,stroke:gm570_.borderColor,fill:gmOficinaV2Cfg_.cor,
      strokeWidth:gm570_.borderWidth,strokeOpacity:gm570_.borderOpacity,
      fillOpacity:gmOficinaV2Cfg_.opacidade,opacity:1,ordemOficina:gm600NextOrder_(),
      sombraOficina:gm580_.shadowPreset||'nenhuma',sombraDirecao:gm580_.shadowDir||'SE',sombraDist:Number(gm580_.shadowDist||4)
    };
  }
  function gm640CreateObjectsAt_(x,y){
    if(!gm640_.objectIds.length)return;
    gmOficinaV2Historico_();
    let z=gm600NextOrder_();
    gm640_.objectIds.forEach((id,n)=>{
      const m=(objetosMapaDB||[]).find(q=>String(q.id)===String(id));if(!m)return;
      gmOficinaEstado_.objetos.push({...JSON.parse(JSON.stringify(m)),
        id:`ofobj:${Date.now()+n}:${Math.random().toString(36).slice(2,5)}`,modeloId:m.id,
        x:x+(n%4)*.45,y:y+Math.floor(n/4)*.45,angulo:0,ordemOficina:z++,
        sombraOficina:gm580_.shadowPreset||'nenhuma',sombraDirecao:gm580_.shadowDir||'SE',sombraDist:Number(gm580_.shadowDist||4)
      });
    });
    gmOficinaPersistir_();gm580Render_();
  }
  const addObj640base=window.gm580AddObjects_;
  window.gm580AddObjects_=function(){
    const ids=[...document.querySelectorAll('.gm580Obj:checked')].map(x=>x.value);if(!ids.length)return;
    gm640_.tool='object';gm640_.objectIds=ids;gm640_.shape='';gm640_.line='';
    addObj640base();gm640CompactState_();
  };

  function gm640InstallMapCapture_(){
    const map=document.getElementById('gmOficinaV2Map');if(!map||map.dataset.gm640capture)return;
    map.dataset.gm640capture='1';
    map.addEventListener('pointerdown',ev=>{
      if(!['shape','line','object'].includes(gm640_.tool))return;
      // handles continuam funcionando normalmente
      if(ev.target.closest?.('[data-gm640-img-handles]'))return;
      const p=gm640Point_(ev),hit=gm640Hit_(p.x,p.y);
      if(hit){
        ev.preventDefault();ev.stopImmediatePropagation();
        gm580Select_(hit.type,hit.id,false);
        return;
      }
      ev.preventDefault();ev.stopImmediatePropagation();

      if(gm640_.tool==='object'){gm640CreateObjectsAt_(p.x,p.y);return;}

      gmOficinaV2Historico_();
      let el=null,moved=false;
      const move=e=>{
        moved=true;const q=gm640Point_(e);
        if(gm640_.tool==='shape'){
          if(!el){el=gm640NewShape_(gm640_.shape,p.x,p.y,.05,.05);gmVet490Formas_().push(el);}
          el.x=Math.min(p.x,q.x);el.y=Math.min(p.y,q.y);el.w=Math.max(.05,Math.abs(q.x-p.x));el.h=Math.max(.05,Math.abs(q.y-p.y));
        }else if(gm640_.tool==='line'){
          if(!el){
            el=gm640NewShape_(gm640_.line,p.x,p.y,0,0);el.x2=p.x;el.y2=p.y;
            if(gm640_.line==='linha_curva'){el.cx=p.x;el.cy=p.y;}
            gmVet490Formas_().push(el);
          }
          el.x2=q.x;el.y2=q.y;
          if(el.tipo==='linha_curva'){el.cx=(p.x+q.x)/2;el.cy=(p.y+q.y)/2-.6;}
        }
        gm580Render_();
      };
      const up=e=>{
        window.removeEventListener('pointermove',move);
        if(!moved){
          if(gm640_.tool==='shape'){el=gm640NewShape_(gm640_.shape,p.x-.5,p.y-.5,1,1);gmVet490Formas_().push(el);}
          else{el=gm640NewShape_(gm640_.line,p.x,p.y,0,0);el.x2=p.x+1;el.y2=p.y;if(el.tipo==='linha_curva'){el.cx=p.x+.5;el.cy=p.y-.5;}gmVet490Formas_().push(el);}
        }
        if(el){gm580_.selection.clear();gm580_.selection.add(gm580Key_('shape',el.id));gm570_.selected={type:'shape',id:el.id};gmVet490_.selectedId=el.id;gm570_.edit=true;}
        gmOficinaPersistir_();gm580Render_();gm640CompactState_();
      };
      window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
    },true);
  }

  // ---------- conta-gotas ----------
  window.gm640PickColor_=async function(border=false){
    if(!window.EyeDropper){notificar_?.('Este navegador não oferece conta-gotas de tela.','erro',3000);return;}
    try{
      const r=await new EyeDropper().open();
      if(border)gm580BorderColor_(r.sRGBHex);else gm580Color_(r.sRGBHex);
    }catch(_){}
  };

  // ---------- inspetor: tesoura simples, sem sliders antigos ----------
  const insp640base=gm580Inspector_;
  gm580Inspector_=function(){
    insp640base();
    const box=document.getElementById('gm580Inspector'),p=gm580Primary_();if(!box)return;
    // remove o painel antigo de sliders de corte da 63.1
    [...box.querySelectorAll('strong')].filter(x=>x.textContent.includes('Cortar imagem')).forEach(st=>st.parentElement?.remove());
    if(p?.type==='object'&&p.ref.coladoClipboard){
      box.insertAdjacentHTML('beforeend',`
        <div style="display:flex;gap:6px;align-items:center;margin-top:6px">
          <button class="btn-small ${p.ref.cropMode640?'btn-select':''}" title="Ativar corte e redimensionamento" onclick="gm640ToggleCrop_()">✂️</button>
          <span style="font-size:.78em;color:#9fb4c8">${p.ref.cropMode640?'Corte ativo: lados cortam; cantos redimensionam.':'Imagem travada em tamanho: arraste para mover. Clique ✂️ para editar.'}</span>
        </div>`);
    }
  };

  // ---------- render: usa nossas alças para imagens coladas ----------
  const render640base=gm580Render_;
  gm580Render_=function(){
    render640base();
    const svg=document.getElementById('gmOficinaVectorLayer');
    if(svg){
      gm640InstallMapCapture_();
      const p=gm580Primary_();
      if(p?.type==='object'&&p.ref.coladoClipboard){
        svg.querySelectorAll('[data-gm620-object-handles],[data-gm600-object-handle],[data-gm640-img-handles]').forEach(x=>x.remove());
        const g=document.createElementNS('http://www.w3.org/2000/svg','g');
        g.innerHTML=gm640ImageHandles_(p.ref,gmOficinaV2Ppm_());svg.appendChild(g);
      }
    }
    gm640CompactState_();gm580Inspector_();
  };

  // ---------- interface compacta estilo ribbon ----------
  function gm640Compactify_(){
    const tb=document.getElementById('gm580Toolbar');if(!tb||tb.dataset.gm640compact)return;
    tb.dataset.gm640compact='1';
    tb.classList.add('gm640-toolbar');

    // botões de formas em símbolo, com tooltip.
    const map={
      'Retângulo':'▭','Quadrado':'□','Triângulo':'△','Círculo':'○','Elipse':'⬭',
      'Editar forma':'✥','Frente':'↑','Trás':'↓','Duplicar':'⧉','Excluir':'🗑'
    };
    [...tb.querySelectorAll('button')].forEach(b=>{
      const txt=(b.textContent||'').trim();
      for(const [name,ico] of Object.entries(map)){
        if(txt.includes(name)){b.title=name;b.textContent=ico;b.classList.add('gm640-iconbtn');break;}
      }
    });

    // títulos curtos para controles.
    const titles={
      gm580Size:'Tamanho do mapa',gm580Scale:'Escala visual',gm580Bg:'Cor do fundo',gm580GridColor:'Cor da grade',
      gm580Grid:'Mostrar grade',gm580Terrain:'Textura do terreno',gm580Tool:'Ferramenta',
      gm580Color:'Cor de preenchimento/traço',gm580BorderColor:'Cor da borda',
      gm580SizeBrush:'Tamanho',gm580Opacity:'Opacidade',gm580BorderWidth:'Grossura da borda',gm580BorderOpacity:'Opacidade da borda',
      gm580Line:'Linhas',gm580Other:'Outras formas'
    };
    for(const [id,title] of Object.entries(titles)){const el=document.getElementById(id);if(el)el.title=title;}

    // conta-gotas ao lado das cores
    const addDrop=(id,border)=>{
      const el=document.getElementById(id);if(!el||el.parentElement.querySelector('.gm640-dropper'))return;
      el.insertAdjacentHTML('afterend',`<button class="btn-small gm640-dropper gm640-iconbtn" title="Conta-gotas: copiar cor da tela" onclick="gm640PickColor_(${border})">💧</button>`);
    };
    addDrop('gm580Color',false);addDrop('gm580BorderColor',true);

    // RGB/HEX ficam recolhidos, mas continuam disponíveis.
    [...tb.querySelectorAll('label')].forEach(l=>{
      const sm=l.querySelector('small')?.textContent?.trim();
      if(sm==='RGB'||sm==='HEX')l.classList.add('gm640-advanced');
    });
    const adv=document.createElement('button');adv.className='btn-small gm640-iconbtn';adv.title='Mostrar/ocultar RGB e HEX';adv.textContent='⋯';
    adv.onclick=()=>tb.classList.toggle('gm640-show-advanced');
    const preview=document.getElementById('gm580Preview');preview?.parentElement?.insertAdjacentElement('afterend',adv);
  }
  window.gm640CompactState_=function(){
    gm640Compactify_();
    const tb=document.getElementById('gm580Toolbar');if(!tb)return;
    [...tb.querySelectorAll('button')].forEach(b=>{
      const oc=b.getAttribute('onclick')||'';
      if(oc.includes('gm580Shape_')){
        const m=oc.match(/gm580Shape_\('([^']+)'\)/);
        b.classList.toggle('btn-select',!!m&&gm640_.tool==='shape'&&m[1]===gm640_.shape);
      }
    });
    const add=[...tb.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('gm580AddObjects_'));
    if(add){add.classList.toggle('btn-select',gm640_.tool==='object');add.title=gm640_.tool==='object'?'Objeto ativo: clique na grade para repetir':'Adicionar objetos marcados';}
  };

  if(!document.getElementById('gm640Css')){
    const st=document.createElement('style');st.id='gm640Css';
    st.textContent=`
      #gm580Toolbar.gm640-toolbar{
        position:sticky;top:4px;z-index:45;
        gap:3px!important;padding:5px 7px!important;margin:4px 0 6px!important;
        background:rgba(20,18,42,.96)!important;backdrop-filter:blur(8px);
        box-shadow:0 4px 14px rgba(0,0,0,.28);
      }
      #gm580Toolbar.gm640-toolbar>div{gap:4px!important;padding-top:2px!important;align-items:center!important}
      #gm580Toolbar.gm640-toolbar small{font-size:9px!important;line-height:10px!important;margin:0!important;color:#9fb4c8!important}
      #gm580Toolbar.gm640-toolbar strong{font-size:11px!important;white-space:nowrap}
      #gm580Toolbar.gm640-toolbar select{font-size:11px!important;padding:4px 6px!important;min-width:0!important;max-width:170px}
      #gm580Toolbar.gm640-toolbar input[type=text]{font-size:10px!important;padding:3px 5px!important;width:76px!important}
      #gm580Toolbar.gm640-toolbar input[type=color]{width:30px!important;height:25px!important;padding:1px!important}
      #gm580Toolbar.gm640-toolbar input[type=range]{width:78px!important}
      #gm580Toolbar.gm640-toolbar .btn-small{font-size:11px!important;padding:4px 7px!important;min-height:27px}
      #gm580Toolbar .gm640-iconbtn{width:29px!important;min-width:29px!important;padding:3px!important;font-size:15px!important}
      #gm580Toolbar #gm580Preview{width:78px!important;height:27px!important}
      #gm580Toolbar #gm580ObjectBank{max-height:70px!important;max-width:100%!important;grid-template-columns:repeat(auto-fill,minmax(115px,1fr))!important;font-size:10px}
      #gm580Toolbar .gm640-advanced{display:none!important}
      #gm580Toolbar.gm640-show-advanced .gm640-advanced{display:block!important}
      #gm580Toolbar #gm580Size{width:110px} #gm580Toolbar #gm580Scale{width:85px}
      #gm580Toolbar #gm580Terrain{width:135px!important} #gm580Toolbar #gm580Tool{width:150px!important}
      #gm580Toolbar #gm580Line{width:150px!important}
      #gm580Toolbar label{font-size:10px!important}
    `;
    document.head.appendChild(st);
  }

  const open640base=window.gmOficinaRender_;
  window.gmOficinaRender_=function(){
    const r=open640base.apply(this,arguments);
    requestAnimationFrame(()=>{gm640Compactify_();gm640InstallMapCapture_();gm640CompactState_();});
    return r;
  };

  setTimeout(()=>{try{gm640Compactify_();gm640InstallMapCapture_();gm640CompactState_();}catch(e){console.warn('Oficina 46.64',e)}},1000);
})();



// ============================================================
// V46.77.0 — layout da Oficina baseado no mockup do usuário
// barra superior compacta + formas à esquerda + banco embaixo
// rolagem natural: nada fica sticky sobre o mapa
// ============================================================
(function(){
  window.gm580ToolbarHtml_=function(){
    const tools=[
      ['select','Selecionar'],['solido','Pincel'],['ladrilhos','Ladrilhos'],['espelhado','Espelhado'],
      ['caligrafia','Caligrafia'],['caneta','Caneta'],['lapis','Lápis'],['serpentina','Serpentina'],
      ['seta','Seta'],['curso','Curso'],['giz_cera','Giz de cera'],['spray','Spray'],['carimbo','Carimbo'],
      ['pele','Pelos'],['esboco','Esboço'],['espirografo','Espirógrafo'],['teia','Teia'],['irregular','Irregular'],
      ['pontilhado','Pontilhado'],['giz','Giz'],['ranhura','Ranhura'],['areia','Areia'],['cascalho','Cascalho'],
      ['grama','Grama'],['folhas','Folhas'],['neve','Neve'],['fumaca','Fumaça'],['borracha','Borracha']
    ];
    const other=[
      ['hexagono','Hexágono'],['pentagono','Pentágono'],['losango','Losango'],['estrela','Estrela'],
      ['pentagrama','Pentagrama'],['hexagrama','Hexagrama'],['heptagrama','Heptagrama'],['u','U'],
      ['coracao','Coração'],['meialua','Meia-lua'],['semicirculo','Semicírculo']
    ];
    const colors=['#ffffff','#111111','#ff5555','#ffd15c','#59e391','#4fc3f7','#b56cff'];

    return `
    <div id="gm580Toolbar" class="gm650-toolbar">
      <div class="gm650-ribbon gm650-ribbon-a">
        <label><small>Tamanho</small><select id="gm580Size" onchange="gmOficinaV2Tamanho_(this.value)">
          <option value="10x10">10 × 10 m</option><option value="20x12">20 × 12 m</option><option value="28x14">28 × 14 m</option>
          <option value="36x20">36 × 20 m</option><option value="50x30">50 × 30 m</option><option value="50x40">50 × 40 m</option>
        </select></label>
        <label><small>Escala</small><select id="gm580Scale" onchange="gmOficinaV2Escala_(this.value)">${[18,24,32,40,48,60,72].map(x=>`<option value="${x}">${x} px/m</option>`).join('')}</select></label>
        <label class="gm650-color"><small>Fundo</small><input id="gm580Bg" type="color" onchange="gmOficinaV2Fundo_(this.value)"></label>
        <label class="gm650-color"><small>Grade</small><input id="gm580GridColor" type="color" onchange="gmOficinaV2GradeCor_(this.value)"></label>
        <label class="gm650-check" title="Mostrar ou ocultar grade"><input id="gm580Grid" type="checkbox" onchange="gmOficinaV2GradeVis_(this.checked)"> Grade</label>
        <label class="gm650-terrain"><small>Textura do terreno</small><select id="gm580Terrain" onchange="gmOficinaV2Terreno_(this.value)">
          <option value="nenhuma">Nenhuma</option><option value="concreto">Concreto</option><option value="areia">Areia</option><option value="terra">Terra</option>
          <option value="grama">Grama</option><option value="floresta">Floresta</option><option value="rochas">Rochas</option><option value="neve">Neve</option>
          <option value="agua">Água</option><option value="vulcanico">Vulcânico</option><option value="metal">Metal / nave</option><option value="ruinas">Ruínas</option>
          <option value="alien">Biomassa alienígena</option><option value="nevoa">Névoa</option>
        </select></label>
        <button class="gm650-icon" title="Desfazer" onclick="gmOficinaV2Undo_()">↶</button>
        <button class="gm650-icon" title="Refazer" onclick="gmOficinaV2Redo_()">↷</button>
        <span class="gm650-sep"></span>
        <label class="gm650-tool"><small>Ferramenta</small><select id="gm580Tool" onchange="gm580Tool_(this.value)">${tools.map((x,i)=>`<option value="${x[0]}" ${i===0?'selected':''}>${x[1]}</option>`).join('')}</select></label>
        <label class="gm650-preview"><small>Prévia</small><canvas id="gm580Preview" width="120" height="30"></canvas></label>
      </div>

      <div class="gm650-ribbon gm650-ribbon-b">
        <strong>Preenchimento / traço</strong>
        <label class="gm650-color"><small>Cor</small><input id="gm580Color" type="color" value="#111111" onchange="gm580Color_(this.value)"></label>
        <button class="gm650-icon" title="Conta-gotas do preenchimento/traço" onclick="gm640PickColor_(false)">💧</button>
        <label class="gm650-advanced"><small>RGB</small><input id="gm580Rgb" type="text" value="17/17/17" onchange="gm580RgbInput_(this.value)"></label>
        <label class="gm650-advanced"><small>HEX</small><input id="gm580Hex" type="text" value="#111111" maxlength="7" onchange="gm580Color_(this.value)"></label>
        <span class="gm650-swatches">${colors.map(c=>`<button title="${c}" onclick="gm580Color_('${c}')" style="background:${c}"></button>`).join('')}</span>
        <label><small>Tamanho</small><span class="gm650-range"><input id="gm580SizeBrush" type="range" min="1" max="100" value="7" oninput="gm580BrushSize_(this.value)"><b id="gm580SizeVal">7</b></span></label>
        <label><small>Opacidade</small><span class="gm650-range"><input id="gm580Opacity" type="range" min="0" max="100" step="5" value="100" oninput="gm580Opacity_(this.value)"><b id="gm580OpacityVal">100%</b></span></label>

        <span class="gm650-sep"></span><strong class="gm650-yellow">Borda</strong>
        <label class="gm650-color"><small>Cor</small><input id="gm580BorderColor" type="color" value="#111111" onchange="gm580BorderColor_(this.value)"></label>
        <button class="gm650-icon" title="Conta-gotas da borda" onclick="gm640PickColor_(true)">💧</button>
        <label class="gm650-advanced"><small>RGB</small><input id="gm580BorderRgb" type="text" value="17/17/17" onchange="gm580BorderRgb_(this.value)"></label>
        <label class="gm650-advanced"><small>HEX</small><input id="gm580BorderHex" type="text" value="#111111" maxlength="7" onchange="gm580BorderColor_(this.value)"></label>
        <label><small>Grossura</small><span class="gm650-range"><input id="gm580BorderWidth" type="range" min="0" max="20" value="0" oninput="gm580BorderWidth_(this.value)"><b id="gm580BorderWidthVal">0</b></span></label>
        <label><small>Opacidade</small><span class="gm650-range"><input id="gm580BorderOpacity" type="range" min="0" max="100" step="5" value="100" oninput="gm580BorderOpacity_(this.value)"><b id="gm580BorderOpacityVal">100%</b></span></label>

        <label class="gm650-lines"><small>Linhas</small><select id="gm580Line" onchange="gm580Line_(this.value)">
          <option value="">— escolher —</option><option value="linha">Reta</option><option value="linha_sinuosa">Sinuosa</option>
          <option value="linha_pontilhada">Pontilhada</option><option value="linha_curva">Curva editável</option>
        </select></label>
        <span class="gm650-actions">
          <button class="gm650-icon" title="Editar forma" id="gm580EditBtn" onclick="gm580ToggleEdit_()">✥</button>
          <button class="gm650-icon" title="Trazer para frente" onclick="gm580Front_()">↑</button>
          <button class="gm650-icon" title="Enviar para trás" onclick="gm580Back_()">↓</button>
          <button class="gm650-icon" title="Duplicar" onclick="gm580Duplicate_()">⧉</button>
          <button class="gm650-icon" title="Excluir" onclick="gm580Delete_()">🗑</button>
          <button class="gm650-icon gm650-more" title="Mostrar/ocultar RGB e HEX" onclick="document.getElementById('gm580Toolbar').classList.toggle('gm650-show-advanced')">⋯</button>
        </span>
      </div>

      <div id="gm650Side" class="gm650-side">
        <strong title="Formas">Formas</strong>
        <button title="Retângulo" onclick="gm580Shape_('retangulo')">▭</button>
        <button title="Quadrado" onclick="gm580Shape_('quadrado')">□</button>
        <button title="Triângulo" onclick="gm580Shape_('triangulo')">△</button>
        <button title="Círculo" onclick="gm580Shape_('circulo')">○</button>
        <button title="Elipse" onclick="gm580Shape_('elipse')">⬭</button>
        <label title="Outras formas"><small>Outras</small><select id="gm580Other" onchange="if(this.value){gm580Shape_(this.value);this.value=''}">
          <option value="">⌄</option>${other.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}
        </select></label>
        <div id="gm580Inspector"></div>
      </div>

      <div id="gm650Bank" class="gm650-bank">
        <div class="gm650-bankhead">
          <strong>Objetos do banco</strong>
          <label><input type="checkbox" onchange="gm580CheckAllObjects_(this.checked)"> Selecionar todos</label>
        </div>
        <div id="gm580ObjectBank"></div>
        <button class="btn-small" onclick="gm580AddObjects_()">＋ Adicionar marcados</button>
      </div>
    </div>`;
  };

  window.gm580BuildUI_=function(){
    const view=document.getElementById('gmOficinaV2Viewport');if(!view)return;
    document.getElementById('gm573Toolbar')?.remove();
    document.getElementById('gm580Toolbar')?.remove();
    document.getElementById('gm650Workspace')?.replaceWith(view);
    ['gmVet490Tools','gm570Toolbar'].forEach(id=>document.getElementById(id)?.remove());

    view.insertAdjacentHTML('beforebegin',gm580ToolbarHtml_());
    const tb=document.getElementById('gm580Toolbar');
    const side=document.getElementById('gm650Side');
    const bank=document.getElementById('gm650Bank');

    const workspace=document.createElement('div');
    workspace.id='gm650Workspace';
    workspace.className='gm650-workspace';
    view.parentNode.insertBefore(workspace,view);
    workspace.appendChild(side);
    workspace.appendChild(view);
    workspace.insertAdjacentElement('afterend',bank);

    gm580PopulateObjects_();
    gm580Sync_();
    gm580Tool_('select');
  };

  function gm650EnsureLayout_(){
    const view=document.getElementById('gmOficinaV2Viewport');
    if(!view)return;
    if(!document.getElementById('gm580Toolbar') || !document.getElementById('gm650Workspace')){
      gm580BuildUI_();
    }
  }

  const css=document.createElement('style');
  css.id='gm650Css';
  css.textContent=`
    #gm580Toolbar.gm650-toolbar{
      position:static!important; top:auto!important; z-index:auto!important;
      display:block!important; margin:6px 0 0!important; padding:0!important;
      border:1px solid rgba(126,231,255,.18)!important; border-radius:8px 8px 0 0!important;
      background:rgba(16,17,40,.78)!important; box-shadow:none!important; backdrop-filter:none!important;
      overflow:visible!important;
    }
    .gm650-ribbon{
      display:flex!important; align-items:flex-end!important; gap:5px!important; flex-wrap:wrap!important;
      padding:5px 7px!important; min-height:42px; border-bottom:1px solid rgba(255,255,255,.08);
    }
    .gm650-ribbon label{display:flex;flex-direction:column;gap:1px;min-width:0}
    .gm650-ribbon small,.gm650-side small{font-size:8px!important;line-height:9px!important;color:#aebdd0!important}
    .gm650-ribbon strong{font-size:11px!important;line-height:28px;white-space:nowrap;color:#d7efff}
    .gm650-yellow{color:#ffd84f!important}
    .gm650-ribbon select{height:27px!important;font-size:11px!important;padding:2px 22px 2px 6px!important;border-radius:6px!important}
    #gm580Size{width:112px!important} #gm580Scale{width:88px!important}
    #gm580Terrain{width:145px!important} #gm580Tool{width:150px!important} #gm580Line{width:150px!important}
    .gm650-color input[type=color]{width:34px!important;height:27px!important;padding:1px!important}
    .gm650-check{flex-direction:row!important;align-items:center!important;height:27px;padding-top:8px;font-size:10px!important;white-space:nowrap}
    .gm650-icon{width:30px!important;min-width:30px!important;height:28px!important;padding:2px!important;font-size:14px!important;border-radius:5px!important}
    .gm650-preview canvas{width:100px!important;height:27px!important;border:1px solid rgba(255,255,255,.18);border-radius:6px;background:rgba(255,255,255,.05)}
    .gm650-sep{height:28px;width:1px;background:rgba(255,255,255,.12);margin:0 2px}
    .gm650-swatches{display:flex;gap:3px;align-items:center;height:27px}
    .gm650-swatches button{width:20px!important;min-width:20px!important;height:20px!important;padding:0!important;border-radius:50%!important}
    .gm650-range{display:flex;align-items:center;gap:3px;height:27px}
    .gm650-range input{width:82px!important}
    .gm650-range b{font-size:10px;min-width:27px}
    .gm650-advanced{display:none!important}
    .gm650-show-advanced .gm650-advanced{display:flex!important}
    .gm650-advanced input{width:70px!important;height:27px!important;font-size:10px!important;padding:3px!important}
    .gm650-actions{display:flex;gap:4px;align-items:flex-end;margin-left:auto}

    .gm650-workspace{
      display:grid; grid-template-columns:44px minmax(0,1fr); align-items:start;
      width:100%; margin:0!important; padding:0!important;
    }
    .gm650-side{
      position:static!important; width:44px; min-width:44px; align-self:stretch;
      display:flex; flex-direction:column; align-items:center; gap:5px;
      padding:7px 4px; background:rgba(16,17,40,.86); border:1px solid rgba(126,231,255,.18); border-top:0;
      overflow:visible;
    }
    .gm650-side>strong{font-size:8px!important;color:#d7efff;writing-mode:horizontal-tb}
    .gm650-side>button{width:29px!important;min-width:29px!important;height:29px!important;padding:1px!important;font-size:15px!important;border-radius:5px!important}
    .gm650-side>label{width:36px;text-align:center}
    .gm650-side select{width:36px!important;height:25px!important;padding:1px!important;font-size:9px!important}
    .gm650-side #gm580Inspector{
      width:40px!important; margin-top:5px; font-size:8px!important; overflow:visible;
    }
    .gm650-side #gm580Inspector>div{
      width:40px!important; display:flex!important; flex-direction:column!important; gap:3px!important; padding:0!important;
    }
    .gm650-side #gm580Inspector label{width:40px!important;font-size:8px!important}
    .gm650-side #gm580Inspector select,.gm650-side #gm580Inspector input[type=number]{
      width:40px!important;min-width:40px!important;height:24px!important;font-size:9px!important;padding:1px!important
    }
    .gm650-side #gm580Inspector button{width:36px!important;min-width:36px!important;padding:2px!important;font-size:9px!important}
    #gmOficinaV2Viewport{
      margin:0!important; border-radius:0!important; min-width:0;
    }

    .gm650-bank{
      position:static!important; width:100%; margin:0!important; padding:5px 8px 7px!important;
      background:rgba(16,17,40,.86); border:1px solid rgba(126,231,255,.18); border-top:1px solid rgba(255,255,255,.12);
      border-radius:0 0 8px 8px;
    }
    .gm650-bankhead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px}
    .gm650-bankhead strong{font-size:11px;color:#d7efff}.gm650-bankhead label{font-size:10px}
    #gm580ObjectBank{
      display:grid!important;grid-template-columns:repeat(auto-fill,minmax(115px,1fr))!important;
      gap:3px!important;max-width:none!important;max-height:78px!important;overflow:auto!important;
      padding:3px!important;border:0!important;border-radius:4px!important;font-size:9px!important;
    }
    #gm580ObjectBank label{font-size:9px!important;min-height:20px!important;padding:2px 4px!important}
    .gm650-bank>.btn-small{margin-top:4px!important;font-size:10px!important;padding:4px 7px!important}

    @media(max-width:1100px){
      .gm650-workspace{grid-template-columns:40px minmax(0,1fr)}
      .gm650-side{width:40px;min-width:40px}
      .gm650-ribbon{gap:4px!important}
      #gm580Terrain{width:125px!important} #gm580Tool{width:130px!important}
    }
  `;
  document.head.appendChild(css);

  // A regra antiga da 46.64 tornava a barra sticky. Esta chamada reconstrói
  // a Oficina com a nova estrutura e deixa toda a página rolar naturalmente.
  setTimeout(()=>{try{gm580BuildUI_();gm650EnsureLayout_();}catch(e){console.warn('Oficina 46.65',e)}},700);

  const render650base=window.gmOficinaRender_;
  window.gmOficinaRender_=function(){
    const r=render650base.apply(this,arguments);
    requestAnimationFrame(()=>{try{gm650EnsureLayout_();}catch(_){}});
    return r;
  };
})();



// ============================================================
// V46.77.0 — corrige aplicação real do layout 46.65
// ============================================================
(function(){
  // Captura as implementações novas que a 46.65.0 colocou em window.
  const gm651ToolbarNew_ = window.gm580ToolbarHtml_;
  const gm651BuildNew_   = window.gm580BuildUI_;

  try{
    // IMPORTANTE: estes são os bindings léxicos realmente usados pelas rotinas antigas.
    // Reatribuir somente window.* não surtia efeito em <script type="module">.
    if(typeof gm651ToolbarNew_==='function') gm580ToolbarHtml_ = gm651ToolbarNew_;
    if(typeof gm651BuildNew_==='function')   gm580BuildUI_ = gm651BuildNew_;
  }catch(e){
    console.warn('Oficina 46.77.0: falha ao substituir bindings',e);
  }

  function gm651ForceRebuild_(){
    const view=document.getElementById('gmOficinaV2Viewport');
    if(!view)return;

    // Remove somente a UI da Oficina, preservando o mapa/canvas/estado.
    document.getElementById('gm580Toolbar')?.remove();
    document.getElementById('gm650Bank')?.remove();

    const ws=document.getElementById('gm650Workspace');
    if(ws && view.parentNode===ws){
      ws.parentNode.insertBefore(view,ws);
      ws.remove();
    }

    try{
      gm580BuildUI_();
      gm580Sync_?.();
      gm580PopulateObjects_?.();
      gm580Render_?.();
    }catch(e){
      console.warn('Oficina 46.77.0 rebuild',e);
    }
  }

  // Garante que CSS antigo sticky não prevaleça.
  const old640=document.getElementById('gm640Css');
  if(old640)old640.disabled=true;

  // O layout novo precisa estar no fluxo normal.
  if(!document.getElementById('gm651Css')){
    const st=document.createElement('style');st.id='gm651Css';
    st.textContent=`
      #gm580Toolbar{position:static!important;top:auto!important;z-index:auto!important}
      #gm650Workspace,#gm650Bank{position:static!important}
      #gmOficinaV2Viewport{position:relative!important}
    `;
    document.head.appendChild(st);
  }

  setTimeout(gm651ForceRebuild_,850);
})();



// ============================================================
// V46.77.0 — arrumação visual da Oficina
// 1 conta-gotas por setor, 1 banco de objetos, RGB/HEX visíveis,
// sem "..." redundantes e sem alterar a lógica das ferramentas.
// ============================================================
(function(){
  const gm652PipetteSvg_=()=>`
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M15.8 3.2a2.8 2.8 0 0 1 4 4l-2.1 2.1 1 1a1 1 0 0 1 0 1.4l-1 1-2.4-2.4-7.9 7.9-3.7.8.8-3.7 7.9-7.9-2.4-2.4 1-1a1 1 0 0 1 1.4 0l1 1 2.1-2.1Z"
        fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  function gm652RemoveDuplicates_(){
    // Mantém apenas um banco de objetos.
    const banks=[...document.querySelectorAll('#gm650Bank')];
    banks.slice(1).forEach(x=>x.remove());

    // Mantém apenas um workspace.
    const workspaces=[...document.querySelectorAll('#gm650Workspace')];
    workspaces.slice(1).forEach(x=>x.remove());

    // Remove conta-gotas e botão "..." injetados pela 46.64.
    document.querySelectorAll('.gm640-dropper').forEach(x=>x.remove());
    [...document.querySelectorAll('button')].forEach(b=>{
      const title=(b.getAttribute('title')||'').toLowerCase();
      if(b.classList.contains('gm640-iconbtn') && title.includes('rgb e hex')) b.remove();
    });

    // O botão "..." da 46.65 também deixa de ser necessário.
    document.querySelectorAll('.gm650-more').forEach(x=>x.remove());
  }

  function gm652DressPipettes_(){
    const tb=document.getElementById('gm580Toolbar');if(!tb)return;
    [...tb.querySelectorAll('button')].forEach(b=>{
      const oc=b.getAttribute('onclick')||'';
      if(oc.includes('gm640PickColor_(false)')){
        b.innerHTML=gm652PipetteSvg_();
        b.title='Conta-gotas do preenchimento / traço';
        b.classList.add('gm652-pipette');
      } else if(oc.includes('gm640PickColor_(true)')){
        b.innerHTML=gm652PipetteSvg_();
        b.title='Conta-gotas da borda';
        b.classList.add('gm652-pipette');
      }
    });
  }

  function gm652ArrangeBank_(){
    const ws=document.getElementById('gm650Workspace');
    const bank=document.getElementById('gm650Bank');
    if(ws&&bank&&bank.previousElementSibling!==ws){
      ws.insertAdjacentElement('afterend',bank);
    }
  }

  function gm652Clean_(){
    gm652RemoveDuplicates_();
    gm652DressPipettes_();
    gm652ArrangeBank_();

    // RGB e HEX ficam sempre visíveis, como no mockup.
    document.getElementById('gm580Toolbar')?.classList.add('gm650-show-advanced');
  }

  // Corrige a própria construção para que uma nova renderização não
  // recrie bancos antigos.
  const build652base=gm580BuildUI_;
  gm580BuildUI_=function(){
    document.querySelectorAll('#gm650Bank').forEach(x=>x.remove());
    const ws=document.getElementById('gm650Workspace');
    const view=document.getElementById('gmOficinaV2Viewport');
    if(ws&&view&&view.parentNode===ws){
      ws.parentNode.insertBefore(view,ws);
      ws.remove();
    }
    const r=build652base.apply(this,arguments);
    gm652Clean_();
    return r;
  };

  const render652base=window.gmOficinaRender_;
  window.gmOficinaRender_=function(){
    const r=render652base.apply(this,arguments);
    requestAnimationFrame(gm652Clean_);
    return r;
  };

  if(!document.getElementById('gm652Css')){
    const st=document.createElement('style');st.id='gm652Css';
    st.textContent=`
      #gm580Toolbar .gm650-advanced{display:flex!important}
      #gm580Toolbar .gm650-more,.gm640-dropper{display:none!important}
      #gm580Toolbar .gm652-pipette{
        width:30px!important;min-width:30px!important;height:28px!important;
        padding:5px!important;color:#111!important;background:#f4f4f4!important;
      }
      #gm580Toolbar .gm652-pipette svg{display:block;margin:auto}
      #gm580Toolbar .gm650-advanced input{
        width:72px!important;height:27px!important;font-size:10px!important;padding:3px 4px!important;
      }
      #gm650Bank{display:block!important}
    `;
    document.head.appendChild(st);
  }

  setTimeout(gm652Clean_,700);
})();



// ============================================================
// V46.77.0 — remove conta-gotas extras e coloca HEX compacto
// ============================================================
(function(){
  function gm653Arrange_(){
    const tb=document.getElementById('gm580Toolbar');
    if(!tb)return;

    // Remove todos os botões extras de conta-gotas.
    tb.querySelectorAll('.gm652-pipette,.gm640-dropper').forEach(x=>x.remove());
    [...tb.querySelectorAll('button')].forEach(b=>{
      const oc=b.getAttribute('onclick')||'';
      if(oc.includes('gm640PickColor_'))b.remove();
    });

    // Reposiciona HEX imediatamente depois do seletor de cor.
    const moveHex=(colorId,hexId)=>{
      const color=document.getElementById(colorId);
      const hex=document.getElementById(hexId);
      if(!color||!hex)return;
      const label=hex.closest('label');
      if(!label)return;
      label.classList.remove('gm650-advanced','gm640-advanced');
      label.classList.add('gm653-hexbox');
      label.querySelector('small')?.remove();
      color.closest('label')?.insertAdjacentElement('afterend',label);
      hex.title='Digite o código HEX da cor';
    };
    moveHex('gm580Color','gm580Hex');
    moveHex('gm580BorderColor','gm580BorderHex');

    // RGB continua oculto para manter o ribbon enxuto.
    const rgbIds=['gm580Rgb','gm580BorderRgb'];
    rgbIds.forEach(id=>{
      const el=document.getElementById(id);
      const lab=el?.closest('label');
      if(lab)lab.style.display='none';
    });
  }

  const render653base=window.gmOficinaRender_;
  window.gmOficinaRender_=function(){
    const r=render653base.apply(this,arguments);
    requestAnimationFrame(gm653Arrange_);
    return r;
  };

  if(!document.getElementById('gm653Css')){
    const st=document.createElement('style');
    st.id='gm653Css';
    st.textContent=`
      #gm580Toolbar .gm652-pipette,
      #gm580Toolbar .gm640-dropper{display:none!important}

      #gm580Toolbar .gm653-hexbox{
        display:flex!important;
        flex-direction:row!important;
        align-items:center!important;
        margin:0!important;
      }
      #gm580Toolbar .gm653-hexbox input{
        width:68px!important;
        height:27px!important;
        padding:3px 5px!important;
        font-size:10px!important;
        text-align:center!important;
        border-radius:5px!important;
      }
    `;
    document.head.appendChild(st);
  }

  setTimeout(gm653Arrange_,700);
})();



// ============================================================
// V46.77.0 — estabilização funcional da Oficina
// seleção real + formas persistentes + alças + borda 0 + undo/redo por ação
// ============================================================
(function(){
  const gm660_={
    tool:'select',       // select | shape | line | draw | object
    shape:'',
    line:'',
    objectIds:[],
    undo:[],
    redo:[],
    restoring:false
  };

  // ---------- HISTÓRICO NOVO, ISOLADO DOS REMENDOS ANTIGOS ----------
  function gm660Snapshot_(){
    return JSON.parse(JSON.stringify({
      desenhos:gmOficinaEstado_.desenhos||[],
      objetos:gmOficinaEstado_.objetos||[],
      formas:gmOficinaEstado_.formas||[],
      larguraM:gmOficinaEstado_.larguraM,
      alturaM:gmOficinaEstado_.alturaM,
      fundo:gmOficinaEstado_.fundo,
      corGrade:gmOficinaEstado_.corGrade,
      gradeVisivel:gmOficinaEstado_.gradeVisivel,
      textura:gmOficinaEstado_.textura
    }));
  }
  function gm660History_(){
    if(gm660_.restoring)return;
    gm660_.undo.push(gm660Snapshot_());
    if(gm660_.undo.length>150)gm660_.undo.shift();
    gm660_.redo.length=0;
  }
  function gm660Restore_(x){
    if(!x)return;
    gm660_.restoring=true;
    try{
      gmOficinaEstado_.desenhos=x.desenhos||[];
      gmOficinaEstado_.objetos=x.objetos||[];
      gmOficinaEstado_.formas=x.formas||[];
      if(x.larguraM!=null)gmOficinaEstado_.larguraM=x.larguraM;
      if(x.alturaM!=null)gmOficinaEstado_.alturaM=x.alturaM;
      if(x.fundo!=null)gmOficinaEstado_.fundo=x.fundo;
      if(x.corGrade!=null)gmOficinaEstado_.corGrade=x.corGrade;
      if(x.gradeVisivel!=null)gmOficinaEstado_.gradeVisivel=x.gradeVisivel;
      if(x.textura!=null)gmOficinaEstado_.textura=x.textura;
      gm660ClearSelection_(false);
      gm570_.strokeCache?.clear?.();
      gmOficinaPersistir_();
      gmOficinaRender_();
    }finally{gm660_.restoring=false;}
  }
  window.gmOficinaV2Undo_=function(){
    if(!gm660_.undo.length)return;
    gm660_.redo.push(gm660Snapshot_());
    gm660Restore_(gm660_.undo.pop());
  };
  window.gmOficinaV2Redo_=function(){
    if(!gm660_.redo.length)return;
    gm660_.undo.push(gm660Snapshot_());
    gm660Restore_(gm660_.redo.pop());
  };

  // ---------- SELEÇÃO ÚNICA E CONFIÁVEL ----------
  function gm660Item_(type,id){
    if(type==='shape'){
      const ref=(gmVet490Formas_()||[]).find(x=>String(x.id)===String(id));
      return ref?{type:'shape',id:ref.id,ref}:null;
    }
    if(type==='object'){
      const ref=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));
      return ref?{type:'object',id:ref.id,ref}:null;
    }
    if(type==='draw'){
      const ref=(gmOficinaEstado_.desenhos||[]).find(x=>String(x.id)===String(id));
      return ref?{type:'draw',id:ref.id,ref}:null;
    }
    return null;
  }
  function gm660Selected_(){
    const s=gm570_.selected;
    return s?.type&&s?.id?gm660Item_(s.type,s.id):null;
  }
  function gm660ClearSelection_(render=true){
    gm570_.selected={type:'',id:''};
    gmVet490_.selectedId='';
    gmOficinaObjSel553_='';
    gm580_.selection?.clear?.();
    if(render){gm580Render_();gm580Inspector_?.();}
  }
  function gm660Select_(type,id){
    const it=gm660Item_(type,id);if(!it)return;
    gm570_.selected={type,id:String(id)};
    gmVet490_.selectedId=type==='shape'?String(id):'';
    gmOficinaObjSel553_=type==='object'?String(id):'';
    gm580_.selection?.clear?.();
    gm580_.selection?.add?.(gm580Key_(type,id));
    if(type==='shape')gm570_.edit=true;
    if(typeof gm630LoadStyleFromElement_==='function'){
      try{gm630LoadStyleFromElement_(it);}catch(_){}
    }
    gm580Render_();gm580Inspector_?.();
  }
  window.gm580Select_=function(type,id){gm660Select_(type,id);};
  window.gm570Select_=function(type,id){gm660Select_(type,id);};

  // ---------- BORDA ZERO DE VERDADE ----------
  const gm660ShapeSvgBase_=gm570BaseShapeSvg_;
  gm570BaseShapeSvg_=function(f,ppm){
    let h=gm660ShapeSvgBase_(f,ppm);
    if(!f||String(f.tipo||'').startsWith('linha'))return h;
    const sw=Math.max(0,Number(f.strokeWidth??0))*gm554Zoom_();
    // Só mexe no SVG da própria forma, não nas alças.
    h=h.replace(/stroke-width="[^"]*"/,`stroke-width="${sw}"`);
    if(sw===0){
      h=h.replace(/stroke-opacity="[^"]*"/,'stroke-opacity="0"');
    }
    return h;
  };

  // ---------- ALÇAS: SEMPRE AO SELECIONAR UMA FORMA ----------
  const gm660HandlesBase_=gm570Handles_;
  gm570Handles_=function(f,ppm){
    if(!f)return '';
    gm570_.edit=true;
    return gm660HandlesBase_(f,ppm);
  };

  // ---------- FERRAMENTAS ----------
  function gm660MarkUI_(){
    const tb=document.getElementById('gm580Toolbar');if(!tb)return;
    const sel=document.getElementById('gm580Tool');
    if(sel){
      if(gm660_.tool==='select')sel.value='select';
      else if(gm660_.tool==='draw')sel.value=gm580_.mode;
    }
    [...tb.querySelectorAll('button')].forEach(b=>{
      const oc=b.getAttribute('onclick')||'';
      if(oc.includes('gm580Shape_')){
        const m=oc.match(/gm580Shape_\('([^']+)'\)/);
        b.classList.toggle('btn-select',!!m&&gm660_.tool==='shape'&&m[1]===gm660_.shape);
      }
    });
    const edit=document.getElementById('gm580EditBtn');
    if(edit){
      edit.textContent='↖';
      edit.title='Selecionar / editar elemento';
      edit.setAttribute('onclick',"gm580Tool_('select')");
      edit.classList.toggle('btn-select',gm660_.tool==='select');
    }
  }

  const gm660ToolBase_=window.gm580Tool_;
  window.gm580Tool_=function(v){
    gm660ClearSelection_(false);
    gm660_.shape='';gm660_.line='';gm660_.objectIds=[];
    if(v==='select'){
      gm660_.tool='select';gm580_.mode='select';gmOficinaV2Cfg_.ativo=false;
      const cv=document.getElementById('gmOficinaV2Canvas');if(cv)cv.style.pointerEvents='none';
    }else{
      gm660_.tool='draw';gm580_.mode=v;
      gm660ToolBase_(v);
    }
    gm660MarkUI_();gm580Render_();
  };

  window.gm580Shape_=function(tipo){
    tipo=String(tipo||'');if(tipo==='arredondado')tipo='retangulo';
    gm660ClearSelection_(false);
    gm660_.tool='shape';gm660_.shape=tipo;gm660_.line='';gm660_.objectIds=[];
    gm580_.mode='shape';gmOficinaV2Cfg_.ativo=false;gm570_.edit=true;
    const cv=document.getElementById('gmOficinaV2Canvas');if(cv)cv.style.pointerEvents='none';
    gm660MarkUI_();gm580Render_();
  };

  window.gm580Line_=function(v){
    if(!v)return;
    gm660ClearSelection_(false);
    gm660_.tool='line';gm660_.line=String(v);gm660_.shape='';gm660_.objectIds=[];
    gm580_.mode='line';gmOficinaV2Cfg_.ativo=false;
    const cv=document.getElementById('gmOficinaV2Canvas');if(cv)cv.style.pointerEvents='none';
    gm660MarkUI_();gm580Render_();
  };

  // Banco: depois de "Adicionar marcados", a escolha continua ativa para novos cliques.
  const gm660AddObjBase_=window.gm580AddObjects_;
  window.gm580AddObjects_=function(){
    const ids=[...document.querySelectorAll('.gm580Obj:checked')].map(x=>x.value);
    if(!ids.length)return;
    gm660_.tool='object';gm660_.objectIds=ids;gm660_.shape='';gm660_.line='';
    gm660AddObjBase_();
    gm660MarkUI_();
  };

  // ---------- GEOMETRIA / HIT TEST ----------
  function gm660Point_(ev){
    const map=document.getElementById('gmOficinaV2Map'),r=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    return {x:(ev.clientX-r.left)/ppm,y:(ev.clientY-r.top)/ppm,ppm};
  }
  function gm660BBox_(it){
    return gm580BBox_(it);
  }
  function gm660Hit_(x,y){
    const all=gm580Items_().slice().reverse();
    return all.find(it=>{
      if(it.ref.fixada)return false;
      const b=gm660BBox_(it);
      return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
    })||null;
  }

  function gm660NewShape_(tipo,x,y,w,h){
    return {
      id:`vet:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,
      tipo,x,y,w,h,rot:0,radius:0,
      fill:gmOficinaV2Cfg_.cor,
      fillOpacity:gmOficinaV2Cfg_.opacidade,
      stroke:gm570_.borderColor,
      strokeWidth:Math.max(0,Number(gm570_.borderWidth||0)),
      strokeOpacity:Math.max(0,Math.min(1,Number(gm570_.borderOpacity??1))),
      opacity:1,
      ordemOficina:gm600NextOrder_(),
      sombraOficina:gm580_.shadowPreset||'nenhuma',
      sombraDirecao:gm580_.shadowDir||'SE',
      sombraDist:Number(gm580_.shadowDist||4)
    };
  }

  function gm660CreateObjectsAt_(x,y){
    if(!gm660_.objectIds.length)return;
    gm660History_();
    let z=gm600NextOrder_();
    gm660_.objectIds.forEach((id,n)=>{
      const m=(objetosMapaDB||[]).find(q=>String(q.id)===String(id));if(!m)return;
      gmOficinaEstado_.objetos.push({
        ...JSON.parse(JSON.stringify(m)),
        id:`ofobj:${Date.now()+n}:${Math.random().toString(36).slice(2,5)}`,
        modeloId:m.id,x:x+(n%4)*.45,y:y+Math.floor(n/4)*.45,angulo:0,ordemOficina:z++,
        sombraOficina:gm580_.shadowPreset||'nenhuma',
        sombraDirecao:gm580_.shadowDir||'SE',
        sombraDist:Number(gm580_.shadowDist||4)
      });
    });
    gmOficinaPersistir_();gm580Render_();
  }

  // ---------- CONTROLADOR ÚNICO DO MAPA ----------
  function gm660InstallController_(){
    const map=document.getElementById('gmOficinaV2Map');
    if(!map||map.dataset.gm660)return;
    map.dataset.gm660='1';

    map.addEventListener('pointerdown',ev=>{
      // Alças de edição têm prioridade.
      if(ev.target.closest?.('[data-gm640-img-handles]'))return;
      const inline=ev.target.getAttribute?.('onpointerdown')||'';
      if(/gm570(Rotate|Resize|Radius|Curve)Handle_|gm600RotateObject_|gm640(CropSide|ScaleImage)_/.test(inline))return;

      const p=gm660Point_(ev);
      const shapeNode=ev.target.closest?.('[data-vet-id]');
      const objNode=ev.target.closest?.('[data-of2]');
      const shapeId=shapeNode?.getAttribute('data-vet-id');
      const objId=objNode?.getAttribute('data-of2');

      // SELECIONAR: qualquer forma/objeto antigo volta a ser editável.
      if(gm660_.tool==='select'){
        if(shapeId){
          ev.preventDefault();ev.stopImmediatePropagation();gm660Select_('shape',shapeId);return;
        }
        if(objId){
          ev.preventDefault();ev.stopImmediatePropagation();gm660Select_('object',objId);return;
        }
        if(ev.target.id==='gmOficinaVectorLayer'){
          ev.preventDefault();ev.stopImmediatePropagation();gm660ClearSelection_();return;
        }
        return;
      }

      // Forma ativa: clicar em forma existente seleciona, vazio cria.
      if(gm660_.tool==='shape'&&gm660_.shape){
        if(shapeId){
          ev.preventDefault();ev.stopImmediatePropagation();gm660Select_('shape',shapeId);return;
        }
        ev.preventDefault();ev.stopImmediatePropagation();
        gm660History_();
        const start={x:p.x,y:p.y};
        let f=null,dragged=false;

        const move=e=>{
          dragged=true;const q=gm660Point_(e);
          if(!f){
            f=gm660NewShape_(gm660_.shape,start.x,start.y,.05,.05);
            gmVet490Formas_().push(f);
          }
          f.x=Math.min(start.x,q.x);f.y=Math.min(start.y,q.y);
          f.w=Math.max(.05,Math.abs(q.x-start.x));f.h=Math.max(.05,Math.abs(q.y-start.y));
          gm580Render_();
        };
        const up=()=>{
          window.removeEventListener('pointermove',move);
          if(!dragged){
            f=gm660NewShape_(gm660_.shape,start.x-.5,start.y-.5,1,1);
            gmVet490Formas_().push(f);
          }
          gm660Select_('shape',f.id);
          // MUITO IMPORTANTE: mantém gm660_.tool='shape'; próximo clique cria de novo.
          gmOficinaPersistir_();gm660MarkUI_();
        };
        window.addEventListener('pointermove',move,{passive:true});
        window.addEventListener('pointerup',up,{once:true});
        return;
      }

      // Linha ativa: persiste até trocar de ferramenta.
      if(gm660_.tool==='line'&&gm660_.line){
        if(shapeId){
          ev.preventDefault();ev.stopImmediatePropagation();gm660Select_('shape',shapeId);return;
        }
        ev.preventDefault();ev.stopImmediatePropagation();
        gm660History_();
        const start={x:p.x,y:p.y};
        let f=gm660NewShape_(gm660_.line,start.x,start.y,0,0);
        f.x2=start.x;f.y2=start.y;
        if(f.tipo==='linha_curva'){f.cx=start.x;f.cy=start.y;}
        gmVet490Formas_().push(f);
        let dragged=false;
        const move=e=>{
          dragged=true;const q=gm660Point_(e);
          f.x2=q.x;f.y2=q.y;
          if(f.tipo==='linha_curva'){f.cx=(start.x+q.x)/2;f.cy=(start.y+q.y)/2-.5;}
          gm580Render_();
        };
        const up=()=>{
          window.removeEventListener('pointermove',move);
          if(!dragged){f.x2=start.x+1;f.y2=start.y;}
          gm660Select_('shape',f.id);gmOficinaPersistir_();gm660MarkUI_();
        };
        window.addEventListener('pointermove',move,{passive:true});
        window.addEventListener('pointerup',up,{once:true});
        return;
      }

      if(gm660_.tool==='object'){
        if(objId){
          ev.preventDefault();ev.stopImmediatePropagation();gm660Select_('object',objId);return;
        }
        ev.preventDefault();ev.stopImmediatePropagation();
        gm660CreateObjectsAt_(p.x,p.y);return;
      }
    },true);
  }

  // ---------- MOVER SELECIONADOS ----------
  window.gm570ShapeDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();
    const f=gmVet490Forma_(id);if(!f)return;
    gm660Select_('shape',id);
    if(f.fixada)return;
    gm660History_();
    const p=gm660Point_(ev),ox=Number(f.x||0),oy=Number(f.y||0),x2=Number(f.x2??f.x),y2=Number(f.y2??f.y),cx=Number(f.cx||0),cy=Number(f.cy||0);
    const move=e=>{
      const q=gm660Point_(e),dx=q.x-p.x,dy=q.y-p.y;
      f.x=ox+dx;f.y=oy+dy;
      if(String(f.tipo||'').startsWith('linha')){
        f.x2=x2+dx;f.y2=y2+dy;
        if(f.tipo==='linha_curva'){f.cx=cx+dx;f.cy=cy+dy;}
      }
      gm580Render_();
    };
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };

  window.gm570ObjectDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();
    const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id));if(!o)return;
    gm660Select_('object',id);if(o.fixada)return;
    gm660History_();
    const p=gm660Point_(ev),ox=Number(o.x||0),oy=Number(o.y||0);
    const move=e=>{const q=gm660Point_(e);o.x=ox+q.x-p.x;o.y=oy+q.y-p.y;gm580Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };

  // ---------- ALÇAS COM 1 PASSO DE HISTÓRICO ----------
  window.gm570RotateHandle_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();const f=gmVet490Forma_(id);if(!f)return;
    gm660History_();
    const map=document.getElementById('gmOficinaV2Map'),r=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    const cx=(Number(f.x||0)+Number(f.w||0)/2)*ppm+r.left,cy=(Number(f.y||0)+Number(f.h||0)/2)*ppm+r.top;
    const move=e=>{f.rot=(Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90+360)%360;gm580Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };
  window.gm570ResizeHandle_=function(ev,id,which){
    ev.preventDefault();ev.stopPropagation();const f=gmVet490Forma_(id);if(!f)return;
    gm660History_();
    const ppm=gmOficinaV2Ppm_(),sx=ev.clientX,sy=ev.clientY,st={x:Number(f.x),y:Number(f.y),w:Number(f.w),h:Number(f.h)};
    const move=e=>{const dx=(e.clientX-sx)/ppm,dy=(e.clientY-sy)/ppm;
      if(which.includes('e'))f.w=Math.max(.05,st.w+dx);
      if(which.includes('s'))f.h=Math.max(.05,st.h+dy);
      if(which.includes('w')){const nw=Math.max(.05,st.w-dx);f.x=st.x+st.w-nw;f.w=nw;}
      if(which.includes('n')){const nh=Math.max(.05,st.h-dy);f.y=st.y+st.h-nh;f.h=nh;}
      gm580Render_();
    };
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };
  window.gm570RadiusHandle_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();const f=gmVet490Forma_(id);if(!f)return;
    gm660History_();
    const map=document.getElementById('gmOficinaV2Map'),r=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_(),x=Number(f.x)*ppm+r.left,max=Math.min(Math.abs(Number(f.w)),Math.abs(Number(f.h)))/2;
    const move=e=>{f.radius=Math.max(0,Math.min(max,(e.clientX-x)/ppm));gm580Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };
  window.gm570CurveHandle_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();const f=gmVet490Forma_(id);if(!f)return;
    gm660History_();
    const map=document.getElementById('gmOficinaV2Map'),r=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    const move=e=>{f.cx=(e.clientX-r.left)/ppm;f.cy=(e.clientY-r.top)/ppm;gm580Render_();};
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
  };

  // ---------- AÇÕES TAMBÉM ENTRAM NO CTRL+Z ----------
  const del660base=window.gm580Delete_;
  window.gm580Delete_=function(){if(gm660Selected_())gm660History_();return del660base();};
  const dup660base=window.gm580Duplicate_;
  window.gm580Duplicate_=function(){if(gm660Selected_())gm660History_();return dup660base();};
  const fr660base=window.gm580Front_;
  window.gm580Front_=function(){if(gm660Selected_())gm660History_();return fr660base();};
  const bk660base=window.gm580Back_;
  window.gm580Back_=function(){if(gm660Selected_())gm660History_();return bk660base();};

  // ---------- RENDER / INSTALAÇÃO ----------
  const render660base=gm580Render_;
  gm580Render_=function(){
    render660base();
    gm660InstallController_();
    gm660MarkUI_();
  };

  function gm660Install_(){
    gm660InstallController_();
    gm660MarkUI_();
    // Começa sem histórico velho/poluído de versões anteriores.
    gm660_.undo.length=0;gm660_.redo.length=0;
  }

  const open660base=window.gmOficinaRender_;
  window.gmOficinaRender_=function(){
    const r=open660base.apply(this,arguments);
    requestAnimationFrame(()=>{gm660InstallController_();gm660MarkUI_();});
    return r;
  };

  setTimeout(()=>{try{gm660Install_();gm580Render_();}catch(e){console.warn('Oficina 46.66',e)}},900);
})();



