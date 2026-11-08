// ============================================================
// v46.41 — IMPORTAÇÃO VISUAL EM LOTE + REMOÇÃO DE FUNDO
// ============================================================
function bancoNomeDeArquivo_(nome){return String(nome||'imagem').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim()||'Novo registro';}
function bancoIdUnico_(base,lista){let id=slugId_(base)||`registro_${Date.now()}`,b=id,n=2;while((lista||[]).some(x=>String(x.id)===id))id=`${b}_${n++}`;return id;}
function bancoStatusLoteId_(tipo){return tipo==='itens'?'importItensImagensStatus':tipo==='npcs'?'importNpcsImagensStatus':'importCriaturasImagensStatus';}
async function importarBancoUmaImagem_(tipo,file){
    const nome=bancoNomeDeArquivo_(file.name),lista=tipo==='itens'?itensDB:tipo==='npcs'?npcsDB:criaturasDB,id=bancoIdUnico_(nome,lista),pasta=tipo==='itens'?'banco-itens':tipo==='npcs'?'banco-npcs':'banco-criaturas',imagem=await uploadImagemBanco_(file,pasta);
    let reg;
    if(tipo==='itens')reg={id,nome,nome_en:'',nome_zh:'',categoria:'Diversos',peso:0,preco:0,pa:0,pv:1,alcance:'',dano:'',penetracao:0,municao:'',uso:0,qualidade:'Básica',material:'',unidade:'',destino:'',locaisProtegidos:'',imagem,descricao:'',descricao_en:'',descricao_zh:''};
    else if(tipo==='npcs')reg={id,nome,nome_en:'',nome_zh:'',tipo:'NPC',raca:'',origem:'',idade:'',sexo:'',altura:'',tamanho:'Médio',pesoCorporal:'',sociedade:'',carreira:'',conceito:'',classeSocial:'',recursos:'',FOR:10,CON:10,TAM:10,DES:10,INT:10,POD:10,CAR:10,atributosRolados:false,formulasAtributos:{},motivacao:'',valorMotivacao:0,periciasTexto:'',especializacoesTexto:'',armasTexto:'',alcancesAtaques:'',habilidadesTexto:'',equipamentoBaseTexto:'',inventarioTexto:'',selecionavelCombate:false,imagem,descricao:''};
    else reg={id,nome,tipo:'Criatura',especie:'',habitat:'',comportamento:'',altura:'',tamanho:'Médio',pesoCorporal:'',FOR:10,CON:10,TAM:10,DES:10,INT:5,POD:10,CAR:5,atributosRolados:false,formulasAtributos:{},periciasTexto:'',especializacoesTexto:'',armasTexto:'',alcancesAtaques:'',habilidadesTexto:'',armaduraNatural:0,acoesMaxEspecial:0,deslocamento:3,acoes:2,movimentoTerrestre:3,movimentoVoo:0,movimentoNatacao:0,vinculosAtaquesPericias:'',equipamentoBaseTexto:'',propriedadesAtaques:'',imagem,descricao:'',selecionavelCombate:false,estadoCombate:null};
    await setDoc(doc(db,tipo,id),reg,{merge:false});lista.push(reg);return reg;
}
window.importarBancoImagensLote_=async function(tipo,ev){
    if(userData?.role!=='mestre')return;const files=[...(ev?.target?.files||[])].filter(f=>String(f.type||'').startsWith('image/'));if(!files.length)return;const st=document.getElementById(bancoStatusLoteId_(tipo));let feitos=0,falhas=0,idx=0;
    const worker=async()=>{while(idx<files.length){const i=idx++,f=files[i];if(st)st.textContent=`⏳ ${feitos+falhas}/${files.length} · ${f.name}`;try{await importarBancoUmaImagem_(tipo,f);feitos++;}catch(e){falhas++;console.error('Importação visual',tipo,f.name,e);}}};
    await Promise.all(Array.from({length:Math.min(3,files.length)},worker));
    if(tipo==='itens')renderizarBancoItens();else if(tipo==='npcs'){renderizarBancoNPCs_();renderizarFichasEntidadesMestre_();}else{renderizarBancoCriaturas_();renderizarFichasEntidadesMestre_();}
    if(st)st.textContent='';if(ev?.target)ev.target.value='';notificar_(`🖼️ ${feitos} ${tipo} criado(s) em lote${falhas?` · ${falhas} falha(s)`:''}.`,'sucesso',5000);
};
function bancoRemoverFundoCanvas_(im,tol){
    const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(im,0,0,c.width,c.height);const img=ctx.getImageData(0,0,c.width,c.height),d=img.data,w=c.width,h=c.height,refs=[];
    for(const [x,y] of [[0,0],[w-1,0],[0,h-1],[w-1,h-1],[Math.floor(w/2),0],[Math.floor(w/2),h-1],[0,Math.floor(h/2)],[w-1,Math.floor(h/2)]]){const i=(y*w+x)*4;if(d[i+3]>0)refs.push([d[i],d[i+1],d[i+2]]);}if(!refs.length)return c;
    const seen=new Uint8Array(w*h),qx=new Int32Array(w*h),qy=new Int32Array(w*h);let head=0,tail=0;const perto=i=>refs.some(r=>Math.hypot(d[i]-r[0],d[i+1]-r[1],d[i+2]-r[2])<=tol);const add=(x,y)=>{if(x<0||y<0||x>=w||y>=h)return;const n=y*w+x;if(seen[n])return;const i=n*4;if(!perto(i))return;seen[n]=1;qx[tail]=x;qy[tail]=y;tail++;};for(let x=0;x<w;x++){add(x,0);add(x,h-1)}for(let y=0;y<h;y++){add(0,y);add(w-1,y)}while(head<tail){const x=qx[head],y=qy[head++],i=(y*w+x)*4;d[i+3]=0;add(x+1,y);add(x-1,y);add(x,y+1);add(x,y-1)}ctx.putImageData(img,0,0);return c;
}
window.removerFundoBancoImagem_=async function(tipo){
    if(userData?.role!=='mestre')return;const cfg=tipo==='item'?{campo:'dbItemImagem',tol:'dbItemBgTol',pasta:'banco-itens',preview:'atualizarPreviewItemBanco'}:tipo==='npc'?{campo:'dbNPCImagem',tol:'dbNPCBgTol',pasta:'banco-npcs',preview:'atualizarPreviewNPCBanco_'}:{campo:'crImagem',tol:'crBgTol',pasta:'banco-criaturas',preview:'atualizarPreviewCriaturaBanco_'};const campo=document.getElementById(cfg.campo),src=String(campo?.value||'').trim();if(!src){notificar_('Carregue ou informe uma imagem primeiro.','aviso');return;}notificar_('✂️ Removendo fundo...','info',1800);
    try{const im=new Image();im.crossOrigin='anonymous';await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=src;});const c=bancoRemoverFundoCanvas_(im,Math.max(1,Number(document.getElementById(cfg.tol)?.value||38)));const blob=await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Falha ao gerar PNG')),'image/png'));const file=new File([blob],`sem_fundo_${Date.now()}.png`,{type:'image/png'}),url=await uploadImagemBanco_(file,cfg.pasta);campo.value=url;if(typeof window[cfg.preview]==='function')window[cfg.preview]();notificar_('Fundo removido. Confira a prévia e salve o registro.','sucesso',3200);}catch(e){console.error('Remover fundo banco',e);notificar_('Não foi possível ler os pixels desta imagem. Se ela veio de um site externo, baixe o arquivo e faça upload antes de remover o fundo.','erro',6500);}
};

// ============================================================
// v46.31 — OBJETOS DE MAPA
// Modelos no Banco de Dados + instâncias destrutíveis na mesa.
// ============================================================
function objetoSvgData_(tipo){
    const svgs={
      arvore:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><radialGradient id="a" cx="38%" cy="31%"><stop stop-color="#9bd36b"/><stop offset=".45" stop-color="#4f963f"/><stop offset="1" stop-color="#214f2c"/></radialGradient><filter id="s"><feDropShadow dx="3" dy="5" stdDeviation="5" flood-opacity=".42"/></filter></defs><g filter="url(#s)"><path d="M126 17c22 3 31 17 41 30 23-5 43 6 48 26 20 9 29 28 21 49 13 20 6 45-15 56-1 25-22 43-48 42-15 20-43 24-63 10-24 12-51 3-61-20-25-4-39-27-33-50-16-17-14-43 4-58-7-25 8-48 34-53 9-24 35-36 58-26 5-5 9-7 14-6Z" fill="url(#a)" stroke="#183b21" stroke-width="5"/><path d="M80 76c17-19 42-28 63-17M57 130c26-16 49-14 69-2M116 194c24-5 41-18 54-38M170 89c17 16 21 37 14 58" fill="none" stroke="#b8df83" stroke-opacity=".34" stroke-width="8" stroke-linecap="round"/><circle cx="129" cy="129" r="15" fill="#68472b"/><path d="M128 128 93 94m35 34 43-38m-43 38-32 46m32-46 45 36" stroke="#765033" stroke-width="7" stroke-linecap="round" opacity=".8"/></g></svg>`,
      rocha:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient id="r" x1=".15" y1=".1" x2=".85" y2=".9"><stop stop-color="#c4c2bb"/><stop offset=".46" stop-color="#858781"/><stop offset="1" stop-color="#50534f"/></linearGradient><filter id="rs"><feDropShadow dx="5" dy="7" stdDeviation="6" flood-opacity=".45"/></filter></defs><g filter="url(#rs)"><path d="M31 151 43 86 83 39 143 27 202 58 229 115 205 184 151 222 81 211 38 184Z" fill="url(#r)" stroke="#454943" stroke-width="6"/><path d="M55 106 89 56l51-13 38 24-49 18-31 43Z" fill="#dedbd2" opacity=".47"/><path d="m99 128 35-43 48-17 28 52-40 10-26 42Z" fill="#6c706b" opacity=".54"/><path d="m62 167 43-24 39 29-27 27-43-5Z" fill="#4d514d" opacity=".58"/><path d="M92 64 78 102m70-51-9 32m46 16-40 32m-26 30-18 31" stroke="#454844" stroke-width="4" stroke-linecap="round" opacity=".65"/></g></svg>`,
      caixa:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c58a4a"/><stop offset="1" stop-color="#74451f"/></linearGradient><filter id="cs"><feDropShadow dx="4" dy="6" stdDeviation="5" flood-opacity=".4"/></filter></defs><g filter="url(#cs)"><rect x="31" y="31" width="194" height="194" rx="7" fill="url(#c)" stroke="#4f2f18" stroke-width="8"/><path d="M39 70h178M39 186h178M71 39v178M185 39v178" stroke="#e1ad6b" stroke-opacity=".72" stroke-width="10"/><path d="M48 48 208 208M208 48 48 208" stroke="#59361d" stroke-width="9" opacity=".72"/><path d="M83 86h90v84H83z" fill="none" stroke="#d3a05f" stroke-width="5" opacity=".48"/></g></svg>`
    };
    const svg=svgs[tipo]||svgs.caixa;return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
function objetosMapaPadrao_(){return [
 {id:'arvore_media',nome:'Árvore média',tipoVisual:'arvore',imagem:objetoSvgData_('arvore'),larguraM:2.2,alturaM:2.2,pvMax:30,dureza:5,pesoKg:600,destrutivel:true,inflamavel:true,bloqueiaMovimento:true,bloqueiaVisao:true},
 {id:'rocha_media',nome:'Rocha média',tipoVisual:'rocha',imagem:objetoSvgData_('rocha'),larguraM:1.5,alturaM:1.3,pvMax:45,dureza:9,pesoKg:450,destrutivel:true,inflamavel:false,bloqueiaMovimento:true,bloqueiaVisao:false},
 {id:'caixa_madeira',nome:'Caixa de madeira',tipoVisual:'caixa',imagem:objetoSvgData_('caixa'),larguraM:1,alturaM:1,pvMax:15,dureza:3,pesoKg:30,destrutivel:true,inflamavel:true,bloqueiaMovimento:true,bloqueiaVisao:false},
 {id:'boneco_treino_objeto',nome:'Boneco de treino',tipoVisual:'personalizado',imagem:'',larguraM:0.8,alturaM:0.8,pvMax:20,dureza:2,pesoKg:35,destrutivel:true,inflamavel:false,bloqueiaMovimento:false,bloqueiaVisao:false}
];}
function garantirObjetosMapaPadrao_(){
    objetosMapaDB=Array.isArray(objetosMapaDB)?objetosMapaDB:[];
    const defs=objetosMapaPadrao_();
    for(const d of defs){
        const existente=objetosMapaDB.find(o=>String(o.id)===String(d.id));
        if(!existente)objetosMapaDB.push(d);
        else if(String(existente.tipoVisual||'')===String(d.tipoVisual||''))existente.imagem=d.imagem;
    }
}
window.garantirObjetosMapaPadrao_=garantirObjetosMapaPadrao_;
function objetoMapaDocId_(id){return `objetoMapa_${String(id||'objeto').replace(/[^a-zA-Z0-9_-]/g,'_')}`;}
async function salvarObjetosMapaLista_(lista){
    if(!batalhaEhMestre_())throw new Error('Apenas o mestre pode salvar objetos.');
    const limpos=(lista||[]).map(o=>JSON.parse(JSON.stringify(o)));
    // Cada objeto fica em seu próprio documento. Imagens PNG/WebP em data URL não
    // fazem mais todos os objetos competirem pelo limite de 1 MiB de um único documento.
    for(const o of limpos)await setDoc(doc(db,'configuracoes',objetoMapaDocId_(o.id)),o,{merge:false});
    await setDoc(doc(db,'configuracoes','objetosMapa'),{formato:'docs-v1',ids:limpos.map(o=>o.id),atualizadoEm:new Date().toISOString()},{merge:false});
}
async function salvarObjetosMapaDB_(){
    try{await salvarObjetosMapaLista_(objetosMapaDB);}
    catch(e){console.error('Objetos de mapa',e);notificar_(`Não foi possível salvar o objeto: ${e?.message||'erro no Firestore'}.`,'erro',6500);throw e;}
}
function objetoNumero_(v,padrao,min=0){const n=Number(v);return Number.isFinite(n)?Math.max(min,n):padrao;}
window.renderizarBancoObjetosMapa_=function(){
    garantirObjetosMapaPadrao_();
    const e=document.getElementById('listaBancoObjetosMapa');if(!e)return;
    e.innerHTML=`<div class="db-table-wrap"><table class="db-table" style="min-width:1180px"><thead><tr><th>Objeto</th><th>Tamanho m</th><th>Peso</th><th>PV</th><th>Dureza</th><th>Propriedades</th><th>Ações</th></tr></thead><tbody>${objetosMapaDB.map(o=>`<tr>
    <td><div style="display:flex;align-items:center;gap:10px"><img src="${o.imagem||''}" style="width:58px;height:58px;object-fit:contain;background:rgba(255,255,255,.05);border-radius:8px"><div><b>${escaparBanco_(o.nome||o.id)}</b><br><small style="color:#888">${escaparBanco_(o.id||'')}</small></div></div></td>
    <td>${Number(o.larguraM||1)} × ${Number(o.alturaM||1)}</td><td>${Number(o.pesoKg||Math.max(1,Number(o.larguraM||1)*Number(o.alturaM||1)*20)).toFixed(1)} kg</td><td>${Number(o.pvMax||0)}</td><td>${Number(o.dureza||0)}</td>
    <td><small>${o.destrutivel!==false?'💥 destrutível':'♾️ indestrutível'} · ${o.inflamavel?'🔥 inflamável':'🚫🔥'} · ${o.bloqueiaMovimento?'🚧 bloqueia movimento':'passável'} · ${o.bloqueiaVisao?'👁️ bloqueia visão':'visão livre'}</small></td>
    <td><button class="btn-small" onclick="editarObjetoMapaBanco_('${String(o.id).replace(/'/g,"\\'")}')">✏️ Editar</button> <button class="btn-small btn-delete" onclick="excluirObjetoMapaBanco_('${String(o.id).replace(/'/g,"\\'")}')">🗑️ Excluir</button></td></tr>`).join('')}</tbody></table></div>`;
    labAtualizarSelectObjetosMapa_();
};
window.fecharEditorObjetoMapa_=function(){const e=document.getElementById('editorObjetoMapaBanco');if(e)e.style.display='none';};
function preencherEditorObjetoMapa_(o){
    const e=document.getElementById('editorObjetoMapaBanco');if(!e)return;e.style.display='block';
    document.getElementById('editorObjetoMapaTitulo').textContent=o?.id?'Editar objeto':'Novo objeto';document.getElementById('objMapaEditId').value=o?.id||'';
    document.getElementById('objMapaNome').value=o?.nome||'';document.getElementById('objMapaLargura').value=o?.larguraM||1;document.getElementById('objMapaAltura').value=o?.alturaM||1;
    document.getElementById('objMapaCamada').value=o?.camada??camadaPadrao(o||{});
    document.getElementById('objMapaPV').value=o?.pvMax??10;document.getElementById('objMapaDureza').value=o?.dureza??2;document.getElementById('objMapaPesoKg').value=o?.pesoKg??Math.max(1,Number(o?.larguraM||1)*Number(o?.alturaM||1)*20);document.getElementById('objMapaDestrutivel').checked=o?.destrutivel!==false;
    document.getElementById('objMapaInflamavel').checked=!!o?.inflamavel;document.getElementById('objMapaBloqueiaMov').checked=o?.bloqueiaMovimento!==false;document.getElementById('objMapaBloqueiaVisao').checked=!!o?.bloqueiaVisao;
    const url=document.getElementById('objMapaImagemUrl'),prev=document.getElementById('objMapaImagemPreview'),file=document.getElementById('objMapaImagemFile');url.value=(o?.imagem&&/^https?:/i.test(o.imagem))?o.imagem:'';
    const img=o?.imagem||objetoSvgData_('caixa');prev.src=img;prev.dataset.imagem=img;if(file)file.value='';e.scrollIntoView({behavior:'smooth',block:'nearest'});
}
window.novoObjetoMapaBanco_=function(){preencherEditorObjetoMapa_(null);};
window.editarObjetoMapaBanco_=function(id){const o=objetosMapaDB.find(x=>String(x.id)===String(id));if(o)preencherEditorObjetoMapa_(o);};
window.objMapaPreviewUrl_=function(v){const p=document.getElementById('objMapaImagemPreview');if(!p)return;const x=String(v||'').trim();if(x){p.crossOrigin='anonymous';p.src=x;p.dataset.imagem=x;}};
window.objMapaLerImagem_=function(ev){
    const f=ev?.target?.files?.[0];if(!f||!f.type.startsWith('image/'))return;const rd=new FileReader();
    rd.onload=()=>{const im=new Image();im.onload=()=>{let max=320,scale=Math.min(1,max/Math.max(im.width,im.height)),data='';
        for(let tentativa=0;tentativa<4;tentativa++){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(im,0,0,c.width,c.height);try{data=c.toDataURL('image/webp',Math.max(.55,.82-tentativa*.09));}catch(_){data=c.toDataURL('image/png');}if(data.length<95000)break;scale*=.78;}
        const p=document.getElementById('objMapaImagemPreview');p.src=data;p.dataset.imagem=data;document.getElementById('objMapaImagemUrl').value='';
    };im.src=rd.result;};rd.readAsDataURL(f);
};
window.objMapaRemoverFundoSimples_=function(){
    const p=document.getElementById('objMapaImagemPreview');if(!p||!p.dataset.imagem){notificar_('Carregue uma imagem primeiro.','aviso');return;}
    const im=new Image();im.onload=()=>{
        const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;
        const ctx=c.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(im,0,0,c.width,c.height);
        const img=ctx.getImageData(0,0,c.width,c.height),d=img.data,w=c.width,h=c.height,tol=Math.max(1,Number(document.getElementById('objMapaBgTol')?.value||38));
        const refs=[];for(const [x,y] of [[0,0],[w-1,0],[0,h-1],[w-1,h-1],[Math.floor(w/2),0],[Math.floor(w/2),h-1],[0,Math.floor(h/2)],[w-1,Math.floor(h/2)]]){const i=(y*w+x)*4;if(d[i+3]>0)refs.push([d[i],d[i+1],d[i+2]]);}
        if(!refs.length)return;
        const seen=new Uint8Array(w*h),q=new Int32Array(w*h),qx=new Int32Array(w*h);let head=0,tail=0;
        const perto=(i)=>refs.some(r=>Math.hypot(d[i]-r[0],d[i+1]-r[1],d[i+2]-r[2])<=tol);
        const add=(x,y)=>{if(x<0||y<0||x>=w||y>=h)return;const n=y*w+x;if(seen[n])return;const i=n*4;if(!perto(i))return;seen[n]=1;q[tail]=x;qx[tail]=y;tail++;};
        for(let x=0;x<w;x++){add(x,0);add(x,h-1);}for(let y=0;y<h;y++){add(0,y);add(w-1,y);}
        while(head<tail){const x=q[head],y=qx[head++],i=(y*w+x)*4;d[i+3]=0;add(x+1,y);add(x-1,y);add(x,y+1);add(x,y-1);}
        ctx.putImageData(img,0,0);const data=c.toDataURL('image/png');p.src=data;p.dataset.imagem=data;document.getElementById('objMapaImagemUrl').value='';notificar_('Fundo simples removido. Confira a prévia antes de salvar.','sucesso',3000);
    };im.onerror=()=>notificar_('Não foi possível processar esta imagem.','erro',4000);im.src=p.dataset.imagem;
};

function objMapaNomeArquivo_(nome){return String(nome||'objeto').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim()||'Objeto';}
function objMapaArquivoParaData_(f){return new Promise((resolve,reject)=>{const rd=new FileReader();rd.onerror=reject;rd.onload=()=>{const im=new Image();im.onerror=reject;im.onload=()=>{let scale=Math.min(1,320/Math.max(im.width,im.height)),data='';for(let tentativa=0;tentativa<4;tentativa++){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(im,0,0,c.width,c.height);try{data=c.toDataURL('image/webp',Math.max(.55,.82-tentativa*.09));}catch(_){data=c.toDataURL('image/png');}if(data.length<95000)break;scale*=.78;}resolve(data);};im.src=rd.result;};rd.readAsDataURL(f);});}
window.importarObjetosMapaImagensLote_=async function(ev){
    if(userData?.role!=='mestre')return;const files=[...(ev?.target?.files||[])].filter(f=>f.type.startsWith('image/'));if(!files.length)return;
    garantirObjetosMapaPadrao_();const status=document.getElementById('objMapaLoteStatus'),lista=JSON.parse(JSON.stringify(objetosMapaDB||[]));let feitos=0,falhas=0;
    if(status)status.textContent=`Preparando 0/${files.length}…`;
    for(const f of files){try{const nome=objMapaNomeArquivo_(f.name),imagem=await objMapaArquivoParaData_(f);let id=labMapaSlug_(nome)||`objeto_${Date.now()}`,base=id,n=2;while(lista.some(x=>String(x.id)===id))id=`${base}_${n++}`;const o={id,nome,imagem,tipoVisual:'personalizado',larguraM:1,alturaM:1,pvMax:10,dureza:2,pesoKg:10,destrutivel:true,inflamavel:false,bloqueiaMovimento:true,bloqueiaVisao:false,rascunho:true};await setDoc(doc(db,'configuracoes',objetoMapaDocId_(id)),o,{merge:false});lista.push(o);feitos++;}catch(e){console.error('Importação de objeto em lote',f?.name,e);falhas++;}if(status)status.textContent=`Salvando ${feitos+falhas}/${files.length}…`;}
    try{await setDoc(doc(db,'configuracoes','objetosMapa'),{formato:'docs-v1',ids:lista.map(x=>x.id),atualizadoEm:new Date().toISOString()},{merge:false});objetosMapaDB=lista;renderizarBancoObjetosMapa_();notificar_(`🖼️ ${feitos} objeto(s) criado(s) em lote${falhas?` · ${falhas} falha(s)`:''}. Edite cada um quando quiser.`,'sucesso',5000);}catch(e){console.error(e);notificar_('As imagens foram processadas, mas não foi possível atualizar o índice do banco.','erro',6000);}finally{if(status)status.textContent='';if(ev?.target)ev.target.value='';}
};
window.salvarObjetoMapaEditor_=async function(){
    garantirObjetosMapaPadrao_();
    const editId=String(document.getElementById('objMapaEditId')?.value||''),nome=String(document.getElementById('objMapaNome')?.value||'').trim();
    if(!nome){notificar_('Dê um nome ao objeto.','aviso');return;}
    const lista=JSON.parse(JSON.stringify(objetosMapaDB||[]));
    let o=editId?lista.find(x=>String(x.id)===editId):null;
    if(!o){let id=labMapaSlug_(nome)||`objeto_${Date.now()}`,b=id,n=2;while(lista.some(x=>String(x.id)===id))id=`${b}_${n++}`;o={id};lista.push(o);}
    const prev=document.getElementById('objMapaImagemPreview'),img=String(prev?.dataset?.imagem||prev?.src||'').trim()||objetoSvgData_('caixa');
    Object.assign(o,{nome,imagem:img,tipoVisual:o.tipoVisual||'personalizado',larguraM:objetoNumero_(document.getElementById('objMapaLargura')?.value,1,.1),alturaM:objetoNumero_(document.getElementById('objMapaAltura')?.value,1,.1),pvMax:objetoNumero_(document.getElementById('objMapaPV')?.value,10,0),dureza:objetoNumero_(document.getElementById('objMapaDureza')?.value,2,0),pesoKg:objetoNumero_(document.getElementById('objMapaPesoKg')?.value,10,.1),destrutivel:!!document.getElementById('objMapaDestrutivel')?.checked,inflamavel:!!document.getElementById('objMapaInflamavel')?.checked,bloqueiaMovimento:!!document.getElementById('objMapaBloqueiaMov')?.checked,bloqueiaVisao:!!document.getElementById('objMapaBloqueiaVisao')?.checked});
    const botao=document.querySelector('#editorObjetoMapaBanco .btn-save');
    const textoBotao=botao?.innerHTML||'💾 Salvar objeto';
    if(botao){botao.disabled=true;botao.innerHTML='⏳ Salvando...';}
    try{
        // Salva SOMENTE o objeto editado. A versão anterior regravava toda a biblioteca
        // (incluindo todas as imagens) a cada clique, tornando o salvamento cada vez mais lento.
        await setDoc(doc(db,'configuracoes',objetoMapaDocId_(o.id)),JSON.parse(JSON.stringify(o)),{merge:false});
        // O índice é pequeno: contém apenas os IDs, nunca as imagens.
        await setDoc(doc(db,'configuracoes','objetosMapa'),{formato:'docs-v1',ids:lista.map(x=>x.id),atualizadoEm:new Date().toISOString()},{merge:false});
        objetosMapaDB=lista;renderizarBancoObjetosMapa_();fecharEditorObjetoMapa_();notificar_(`Objeto “${nome}” salvo.`,'sucesso',2800);
    }catch(e){
        console.error('Salvar objeto de mapa',e);
        notificar_(`Não foi possível salvar “${nome}”. ${e?.message||''}`,'erro',7000);
    }finally{
        if(botao){botao.disabled=false;botao.innerHTML=textoBotao;}
    }
};
window.excluirObjetoMapaBanco_=async function(id){
    const o=objetosMapaDB.find(x=>String(x.id)===String(id));if(!o||!confirm(`Excluir o modelo “${o.nome}”? Objetos já colocados nos mapas não serão removidos.`))return;
    const lista=objetosMapaDB.filter(x=>String(x.id)!==String(id));
    try{await salvarObjetosMapaLista_(lista);try{await deleteDoc(doc(db,'configuracoes',objetoMapaDocId_(id)));}catch(_){}objetosMapaDB=lista;renderizarBancoObjetosMapa_();}
    catch(e){console.error(e);notificar_('Não foi possível excluir o objeto.','erro',5000);}
};
window.restaurarObjetosMapaPadrao_=async function(){const defs=objetosMapaPadrao_(),ids=new Set(defs.map(x=>x.id));objetosMapaDB=(objetosMapaDB||[]).filter(x=>!ids.has(String(x.id)));objetosMapaDB.push(...defs);await salvarObjetosMapaDB_();renderizarBancoObjetosMapa_();notificar_('Modelos básicos restaurados com os visuais atuais.','sucesso',2500);};
window.labAtualizarSelectObjetosMapa_=function(){
    garantirObjetosMapaPadrao_();const s=document.getElementById('labObjetoModeloSelect');if(!s)return;const v=s.value;
    s.innerHTML='<option value="">— objeto —</option>'+objetosMapaDB.map(o=>`<option value="${escaparHtmlInventario_(o.id)}">${escaparHtmlInventario_(o.nome||o.id)}</option>`).join('');
    if(objetosMapaDB.some(o=>String(o.id)===String(v)))s.value=v;
};

function labGuardarUltimaConstrucao_(tipo,dado){labEstado_.ultimaConstrucaoLab={tipo:String(tipo||''),dado:JSON.parse(JSON.stringify(dado||{}))};}
function labOffsetAoLado_(xs,ys){let dx=1,dy=0;const maxX=Math.max(...xs,0),minX=Math.min(...xs,0),maxY=Math.max(...ys,0);if(maxX+1>labEstado_.larguraM){dx=-(Math.max(1,maxX-minX+1));if(minX+dx<0){dx=0;dy=maxY+1<=labEstado_.alturaM?1:-1;}}return {dx,dy};}
window.labRepetirAoLado_=function(){
    if(!batalhaEhMestre_())return;const u=labEstado_.ultimaConstrucaoLab;if(!u?.tipo){notificar_('Ainda não há uma colocação ou pintura para repetir.','aviso');return;}
    if(u.tipo==='objeto'){
        const src=JSON.parse(JSON.stringify(u.dado||{}));const off=labOffsetAoLado_([Number(src.x||0)],[Number(src.y||0)]);src.id=`obj:${Date.now()}:${Math.floor(Math.random()*10000)}`;src.x=Math.max(0,Math.min(labEstado_.larguraM,Number(src.x||0)+off.dx));src.y=Math.max(0,Math.min(labEstado_.alturaM,Number(src.y||0)+off.dy));labEstado_.objetosLab=Array.isArray(labEstado_.objetosLab)?labEstado_.objetosLab:[];labEstado_.objetosLab.push(src);labEstado_.objetoSelecionadoId=src.id;labGuardarUltimaConstrucao_('objeto',src);
    }else if(u.tipo==='desenho'){
        const st=JSON.parse(JSON.stringify(u.dado||{})),pts=Array.isArray(st.pts)?st.pts:[];if(!pts.length)return;const off=labOffsetAoLado_(pts.map(p=>Number(p.x||0)),pts.map(p=>Number(p.y||0)));st.pts=pts.map(p=>({x:Math.max(0,Math.min(labEstado_.larguraM,Number(p.x||0)+off.dx)),y:Math.max(0,Math.min(labEstado_.alturaM,Number(p.y||0)+off.dy))}));labDesenhoRegistrarHistorico_();labEstado_.desenhosLab.push(st);labGuardarUltimaConstrucao_('desenho',st);
    }
    labSalvarLocal_();labRender_();
};
window.labAdicionarObjetoSelecionado_=function(){
    if(!batalhaEhMestre_())return;garantirObjetosMapaPadrao_();const id=document.getElementById('labObjetoModeloSelect')?.value;
    const m=objetosMapaDB.find(x=>String(x.id)===String(id));if(!m){notificar_('Escolha um objeto de mapa.','aviso');return;}
    labEstado_.objetosLab=Array.isArray(labEstado_.objetosLab)?labEstado_.objetosLab:[];
    const inst={...JSON.parse(JSON.stringify(m)),id:`obj:${Date.now()}:${Math.floor(Math.random()*10000)}`,modeloId:m.id,x:labEstado_.larguraM/2,y:labEstado_.alturaM/2,angulo:0,pvAtual:Number(m.pvMax||0),destruido:false};
    labEstado_.objetosLab.push(inst);labEstado_.objetoSelecionadoId=inst.id;labEstado_.selecionadoId='';labGuardarUltimaConstrucao_('objeto',inst);labSalvarLocal_();labRender_();
};
function labObjetoPorId_(id){return (labEstado_.objetosLab||[]).find(o=>String(o.id)===String(id))||null;}
function labObjetoModelo_(o){
    const ref=String(o?.modeloId||o?.objetoBancoId||'');
    return (objetosMapaDB||[]).find(m=>String(m.id)===ref)||null;
}
function labPsiPoderSelecionado_(ator){
    const todos=labPsiPoderes_(ator);
    const id=String(ator?.acaoAuxLab?.tipo==='psiquismo'?ator.acaoAuxLab.poderId:(ator?.psiSelecaoLab?.poderId||''));
    return todos.find(p=>String(p.id)===id)||todos[0]||null;
}
function labPsiPoderAplicavelAoAlvo_(ator,p,alvo){
    return !!p&&!!alvo&&labPsiAlvos_(ator,p).some(x=>String(x.id)===String(alvo.id));
}
function labPsiPoderesParaAlvo_(ator,alvo){
    if(!ator||!alvo)return [];
    const todos=labPsiPoderes_(ator),out=[],add=p=>{if(p&&labPsiPoderAplicavelAoAlvo_(ator,p,alvo)&&!out.some(x=>String(x.id)===String(p.id)))out.push(p);};
    // Regra principal: o botão contextual acompanha o poder escolhido no painel superior.
    add(labPsiPoderSelecionado_(ator));
    // Exceção contextual realmente útil: Mover Objeto quando o alvo é um objeto.
    if(labPsiEhObjeto_(alvo))add(todos.find(p=>p.id==='mover_objeto'));
    // Exceção contextual realmente útil: Cura quando o alvo corporal está ferido.
    if(!labPsiEhObjeto_(alvo)&&labFeridasTrataveis_(alvo).length>0)add(todos.find(p=>labPsiEhCura_(p)));
    return out;
}
window.labAbrirPsiContextual_=function(poderId,alvoId){
    const t=labTokenAtual_(),alvo=labPsiAlvoPorId_(alvoId);if(!t||!alvo||!labPodeControlarToken_(t))return;
    const p=labPsiPoderesParaAlvo_(t,alvo).find(x=>String(x.id)===String(poderId));if(!p)return;
    const min=p.id==='mover_objeto'&&labPsiEhObjeto_(alvo)?labPsiMoverCustoKg_(p,alvo):Math.max(0,Number(p.custo||0));
    t.microModoLab='psi';t.acaoAuxLab={tipo:'psiquismo',poderId:p.id,alvoId:String(alvo.id),custo:min,local:''};t.psiSelecaoLab=JSON.parse(JSON.stringify(t.acaoAuxLab));
    if(labPsiEhObjeto_(alvo)){labEstado_.objetoSelecionadoId=String(alvo.id);labEstado_.selecionadoId='';}else labEstado_.selecionadoId=String(alvo.id);
    labSalvarLocal_();labRender_();
};
window.labUsarPsiContextualRapido_=function(poderId,alvoId){
    const t=labTokenAtual_(),alvo=labPsiAlvoPorId_(alvoId);if(!t||!alvo||!labPodeControlarToken_(t))return;
    const p=labPsiPoderesParaAlvo_(t,alvo).find(x=>String(x.id)===String(poderId));if(!p)return;
    const min=p.id==='mover_objeto'&&labPsiEhObjeto_(alvo)?labPsiMoverCustoKg_(p,alvo):Math.max(0,Number(p.custo||0));
    t.microModoLab='psi';t.acaoAuxLab={tipo:'psiquismo',poderId:p.id,alvoId:String(alvo.id),custo:min,local:''};
    t.psiSelecaoLab=JSON.parse(JSON.stringify(t.acaoAuxLab));
    if(labPsiEhObjeto_(alvo)){labEstado_.objetoSelecionadoId=String(alvo.id);labEstado_.selecionadoId='';}
    else {labEstado_.selecionadoId=String(alvo.id);labEstado_.objetoSelecionadoId='';}
    window.labUsarPsi_();
};
window.labAtacarObjetoContextual_=function(objetoId){
    const t=labTokenAtual_(),o=labObjetoPorId_(objetoId);if(!t||!o||!labPodeControlarToken_(t))return;
    t.alvoLab=String(o.id);t._alvoManualFixadoLab=String(o.id);t._alvoMortoManual510=!!labAlvoInerte490_(o);t.microModoLab='ataque';t.acaoAuxLab=null;
    labEstado_.objetoSelecionadoId=String(o.id);labEstado_.selecionadoId='';
    labSalvarLocal_();window.labRolarAtaque_();
};
window.labCliqueFundoMapa_=function(ev){
    const map=document.getElementById('labMetricMap');if(!map)return;
    const alvo=ev?.target;
    if(alvo?.closest?.('.lab-token,.lab-map-object,.lab-micro-actions'))return;
    labEstado_.selecionadoId='';labEstado_.objetoSelecionadoId='';
    const t=labTokenAtual_();if(t&&labPodeControlarToken_(t))t.alvoLab='';
    labTokenArrastandoId_='';
    labSalvarLocal_();labRender_();
};
function labObjetoNatureza_(o){
    const m=labObjetoModelo_(o);

    // O Banco de Objetos é a fonte da verdade.
    // Não inferimos mais o tipo pelo nome, ID, imagem ou descrição.
    const material=normalizarTextoCombate_(
        String(o?.material || m?.material || '')
    );

    if(material==='madeira' || material==='wood')
        return 'arvore';

    if(
        material==='pedra' ||
        material==='rocha' ||
        material==='stone' ||
        material==='rock' ||
        material==='mineral' ||
        material==='minerio' ||
        material==='ore'
    )
        return 'rocha';

    return 'outro';
}
function labEquipadoRegex_(t,re){
    const c=labCharToken_(t);
    if(!c)return null;
    try{
        return (obterItensEquipados_(c)||[]).find(i=>{
            const txt=normalizarTextoCombate_([
                getNome(i),i?.nome,i?.nome_en,i?.nome_zh,i?.idBanco,i?.id,
                i?.tipo,i?.categoria,i?.familiaArma,i?.descricao
            ].filter(Boolean).join(' '));
            return re.test(txt);
        })||null;
    }catch(_){
        return null;
    }
}
function labPericiaDisponivelTeste23_(c,p){
    if(!c||!p)return false;
    if(p.__especializacao)return totalTreinoPericia_(c?.especializacoes?.[p.id]||{})>0;
    const tipo=normalizarTextoCombate_(p?.tipo||'');
    const basica=/basica|basic/.test(tipo);
    if(basica)return true;
    return totalTreinoPericia_(c?.pericias?.[p.id]||{})>0;
}
function labPericiaRegex_(t,re){
    const c=labCharToken_(t);if(!c)return null;
    return (batalhaListaPericias_(c)||[]).find(p=>
        labPericiaDisponivelTeste23_(c,p) &&
        re.test(normalizarTextoCombate_(`${p.id||''} ${getNome(p)||''}`))
    )||null;
}
function labObjetoAplicarDanoDireto_(o,bruto,fonte='Ação'){const duro=Math.max(0,Number(o.dureza||0)),final=Math.max(0,Math.floor(Number(bruto||0))-duro);o.pvAtual=Math.max(0,Number(o.pvAtual??o.pvMax??0)-final);if(o.pvAtual<=0)o.destruido=true;return {bruto:Math.floor(Number(bruto||0)),duro,final};}
function labObjetoAplicarDanoFerramenta_(o,bruto,durezaEfetiva){
    const duro=Math.max(0,Number(durezaEfetiva||0));
    const b=Math.max(0,Math.floor(Number(bruto||0)));
    const final=Math.max(0,b-duro);
    o.pvAtual=Math.max(0,Number(o.pvAtual??o.pvMax??0)-final);
    if(o.pvAtual<=0)o.destruido=true;
    return {bruto:b,duro,final};
}
function labTextoItemMesa_(i){
    return normalizarTextoCombate_([
        getNome(i),i?.nome,i?.nome_en,i?.nome_zh,i?.idBanco,i?.id,
        i?.tipo,i?.categoria,i?.descricao
    ].filter(Boolean).join(' '));
}
function labExtintorUsosMax_(ext){
    return Math.max(0,Math.floor(Number(ext?.uso??ext?.cargas??ext?.capacidade??0)));
}
function labExtintorUsosAtuais_(ext){
    if(!ext)return 0;
    const max=labExtintorUsosMax_(ext);
    if(!Number.isFinite(Number(ext.usoAtual)))ext.usoAtual=max;
    ext.usoAtual=Math.max(0,Math.min(max,Math.floor(Number(ext.usoAtual)||0)));
    return ext.usoAtual;
}
async function labPersistirInventarioAtorObjeto_(ator){
    const c=labCharToken_(ator);
    if(!c)return;
    try{
        if(c.id&&!c.__npcTemporario&&!c.__criaturaTemporaria&&c.inventario){
            await setDoc(doc(db,'personagens',String(c.id)),{inventario:c.inventario},{merge:true});
        }
    }catch(e){console.warn('Persistir uso de equipamento',e);}
    try{
        if(typeof batalhaSalvarEstado_==='function')await batalhaSalvarEstado_();
    }catch(e){console.warn('Persistir equipamento na batalha',e);}
}
function labObjetoExtinguirExecutar_(ator,objeto){
    if(!objeto?.pegandoFogoLab){
        notificar_('Este objeto não está em chamas.','aviso',2600);
        return;
    }
    if(labDistanciaInteracaoObjeto_(ator,objeto)>1.5){
        notificar_('O extintor só pode ser usado a até 1,5 m do alvo.','aviso',3600);
        return;
    }
    const ext=labEquipadoRegex_(ator,/extintor|extinguisher|灭火器/);
    if(!ext){
        notificar_('É necessário ter um extintor equipado.','aviso',3000);
        return;
    }
    const usos=labExtintorUsosAtuais_(ext);
    if(usos<=0){
        notificar_('O extintor está sem carga.','aviso',3200);
        return;
    }
    if(Number(ator.acoesAtuaisLab||0)<=0)return;

    const peso=Math.max(1,labObjetoPesoKg_(objeto));
    let restante=Number(objeto.extincaoRestanteKgLab);
    if(!Number.isFinite(restante)||restante<=0||restante>peso)restante=peso;

    restante=Math.max(0,restante-100);
    ext.usoAtual=usos-1;
    ator.acoesAtuaisLab=Math.max(0,Number(ator.acoesAtuaisLab||0)-1);

    let txt='';
    if(restante<=0){
        objeto.pegandoFogoLab=false;
        objeto.fogoUltimaRodadaLab=-1;
        delete objeto.extincaoRestanteKgLab;
        txt=`Extintor: o fogo em ${objeto.nome||'objeto'} foi apagado. Carga restante: ${ext.usoAtual}/${labExtintorUsosMax_(ext)}.`;
        notificar_('🧯 Fogo apagado.','sucesso',2400);
    }else{
        objeto.extincaoRestanteKgLab=restante;
        const faltam=Math.ceil(restante/100);
        txt=`Extintor: ${objeto.nome||'objeto'} ainda requer ${faltam} uso(s) para apagar o fogo. Carga restante: ${ext.usoAtual}/${labExtintorUsosMax_(ext)}.`;
        notificar_(`🧯 Extinção em andamento: faltam ${faltam} uso(s).`,'info',2800);
    }

    labRegistrarResultadoProprio_(ator,txt);
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${ator.nome}: ${txt}`});
    labSalvarLocal_();
    try{labAgendarSyncRemoto_();}catch(_){}
    labRender_();
    Promise.resolve(labPersistirInventarioAtorObjeto_(ator)).catch(()=>{});
    labAutoAvancarSeSemAcoes_();
}
function labObjetoAcaoExecutar_(ator,objeto,tipo){
    if(!ator||!objeto||Number(ator.acoesAtuaisLab||0)<=0)return;

    if(tipo==='extinguir'){
        labObjetoExtinguirExecutar_(ator,objeto);
        return;
    }

    let per=null,equip=null,dif='padrao',rotulo='',bruto=0;
    const nat=labObjetoNatureza_(objeto),c=labCharToken_(ator),
          forca=Number(c?.atributos?.FOR||ator?.attrs?.FOR||10),
          tam=Number(c?.atributos?.TAM||ator?.attrs?.TAM||10),
          peso=labObjetoPesoKg_(objeto);

    if(tipo==='mover'){
        per=labPericiaRegex_(ator,/forca bruta|força bruta|brute force|蛮力/);
        rotulo='Mover objeto';
        const cap=Math.max(10,(forca+tam)*5);
        dif=peso<=cap?'padrao':peso<=cap*2?'dificil':'formidavel';
    }else if(tipo==='minerar'){
        if(nat!=='rocha')return;
        if(labDistanciaInteracaoObjeto_(ator,objeto)>1.5){
            notificar_('Você precisa estar a até 1,5 m da pedra para minerar.','aviso',3400);
            return;
        }
        per=labPericiaRegex_(ator,/forca bruta|força bruta|brute force|蛮力/);
        equip=labEquipadoRegex_(ator,/picareta|pickaxe|mining pick|矿镐|鹤嘴锄/);
        rotulo='Minerar';
        if(!equip){
            notificar_('Minerar exige uma picareta equipada.','aviso',4200);
            return;
        }
    }else if(tipo==='cortar'){
        if(nat!=='arvore')return;
        if(labDistanciaInteracaoObjeto_(ator,objeto)>1.5){
            notificar_('Você precisa estar a até 1,5 m da madeira para lenhar.','aviso',3400);
            return;
        }
        per=labPericiaRegex_(ator,/forca bruta|força bruta|brute force|蛮力/);
        equip=labEquipadoRegex_(ator,/machado|axe|hatchet|斧/);
        rotulo='Lenhar';
        if(!equip){
            notificar_('Lenhar exige um machado equipado.','aviso',4200);
            return;
        }
    }

    if(!per){
        notificar_(`Não encontrei a perícia necessária para ${rotulo.toLowerCase()}.`,'aviso',4200);
        return;
    }

    const base=labValorTeste_(ator,per),
          aj=aplicarDificuldadeEFadiga_(c,base,dif,0),
          valor=Math.max(0,Number(aj?.valor||base)),
          roll=1+Math.floor(Math.random()*100),
          r=classificarD100_(valor,roll),
          sucesso=batalhaResultadoGradeValor_(r.grau)>=2;

    ator.acoesAtuaisLab=Math.max(0,Number(ator.acoesAtuaisLab||0)-1);
    let efeito='';

    if(sucesso&&tipo==='mover'){
        const metros=Math.max(.5,Math.min(2.5,1.5*(Math.max(10,(forca+tam)*5)/Math.max(1,peso))));
        labPsiEmpurrar_(ator,objeto,metros);
        efeito=` ${objeto.nome} foi deslocado ${metros.toFixed(1)} m.`;
    }else if(sucesso&&(tipo==='minerar'||tipo==='cortar')){
        bruto=(1+Math.floor(Math.random()*6))+Math.max(0,Math.floor(forca/5));
        const durezaBase=Math.max(0,Number(objeto.dureza||0));
        let durezaEfetiva=durezaBase;

        if(tipo==='minerar'){
            const industrial=/industrial/.test(labTextoItemMesa_(equip));
            durezaEfetiva=Math.ceil(durezaBase*(industrial?1/3:1/2));
        }else if(tipo==='cortar'){
            durezaEfetiva=Math.ceil(durezaBase/3);
        }

        const d=labObjetoAplicarDanoFerramenta_(objeto,bruto,durezaEfetiva);
        efeito=` Dano de trabalho ${d.bruto} - Dureza efetiva ${d.duro} = ${d.final}.${objeto.destruido?' Objeto destruído.':''}`;
        if(d.final>0)labAdicionarFloat_(objeto,-d.final,'dano');
    }else{
        efeito=' Nenhum efeito.';
    }

    const txt=`${rotulo}: ${roll}/${valor} → ${r.grau}.${efeito}`;
    labRegistrarResultadoProprio_(ator,txt);
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${ator.nome}: ${txt}`});
    try{somDado_();}catch(_){}
    labSalvarLocal_();
    try{labAgendarSyncRemoto_();}catch(_){}
    labRender_();
    labAutoAvancarSeSemAcoes_();
}
window.labObjetoAcao_=function(tipo,id){const ator=labTokenAtual_(),o=labObjetoPorId_(id);if(!ator||!o||!labPodeControlarToken_(ator))return;if(!batalhaEhMestre_()){labEnviarComandoJogador_('acao_objeto',{tipo:String(tipo||''),objetoId:String(id)},ator).then(ok=>{if(ok)notificar_('Ação sobre o objeto enviada ao mestre.','info',1500);});return;}labObjetoAcaoExecutar_(ator,o,String(tipo||''));};
function labObjetoMicroPainelHtml_(o,ppm){
    if(labEstado_.fase!=='combate'||!o||o.destruido||String(labEstado_.objetoSelecionadoId||'')!==String(o.id))return '';
    const ator=labTokenAtual_();if(!ator||!labPodeControlarToken_(ator)||Number(ator.acoesAtuaisLab||0)<=0)return '';
    const psis=labPsiPoderesParaAlvo_(ator,o),
      nat=labObjetoNatureza_(o),
      pic=labEquipadoRegex_(ator,/picareta|pickaxe|mining pick|矿镐|鹤嘴锄/),
      axe=labEquipadoRegex_(ator,/machado|axe|hatchet|斧/);
    const meiaH=Math.max(18,Number(o.alturaM||1)*ppm)/2,posMicro=labMicroPosicaoVertical_(o.y*ppm,meiaH,ppm,72),top=posMicro.top,left=o.x*ppm;
    return `<div class="lab-micro-actions" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" style="position:absolute;left:${left}px;top:${top}px;transform:${posMicro.transform};z-index:28;padding:4px;border-radius:8px;background:rgba(10,13,30,.96);border:1px solid rgba(126,231,255,.45);display:flex;gap:3px;align-items:center;justify-content:center;flex-wrap:wrap;max-width:410px;">${o.destrutivel!==false?`<button class="btn-small btn-select" onclick="labAtacarObjetoContextual_('${String(o.id).replace(/'/g,"\\'")}')" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">⚔️ Atacar</button>`:''}<button class="btn-small" onclick="labObjetoAcao_('mover','${String(o.id).replace(/'/g,"\\'")}')" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">💪 Mover</button>${nat==='rocha'&&pic?`<button class="btn-small" onclick="labObjetoAcao_('minerar','${String(o.id).replace(/'/g,"\\'")}')" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">⛏️ Minerar</button>`:''}${nat==='arvore'&&axe?`<button class="btn-small" onclick="labObjetoAcao_('cortar','${String(o.id).replace(/'/g,"\\'")}')" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">🪓 Lenhar</button>`:''}${psis.map(p=>`<button class="btn-small lab-psi-action" onclick="${p.id==='mover_objeto'?`labUsarPsiContextualRapido_('${String(p.id).replace(/'/g,"\\'")}','${String(o.id).replace(/'/g,"\\'")}')`:`labAbrirPsiContextual_('${String(p.id).replace(/'/g,"\\'")}','${String(o.id).replace(/'/g,"\\'")}')`}" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">🔮 ${escaparHtmlInventario_(getNome(p))}</button>`).join('')}</div>`;
}
function labObjetoHtml_(o,ppm){
    const w=Math.max(18,Number(o.larguraM||1)*ppm),h=Math.max(18,Number(o.alturaM||1)*ppm),cfg=labDesenhoConfig_(),sel=!!labEstado_.modoCriacaoMapa&&!cfg.ativo&&String(o.id)===String(labEstado_.objetoSelecionadoId),dead=!!o.destruido;
    const at=labTokenAtual_(),alvoCombate=!!at&&String(at.alvoLab||'')===String(o.id),modelo=labObjetoModelo_(o),imagem=o.imagem||modelo?.imagem||'';
    const img=imagem?`<img src="${imagem}" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none">`:`<span style="font-size:28px">🧱</span>`;
    const outline=sel?'3px solid #56f08a':alvoCombate?'4px solid #ff5b66':'none';
    return `<div class="lab-map-object" data-id="${escaparHtmlInventario_(o.id)}" title="${escaparHtmlInventario_(o.nome||modelo?.nome||'Objeto')} · PV ${Number((o.pvAtual??o.pvMax)||0)}/${Number(o.pvMax||0)} · Dureza ${Number(o.dureza||0)} · ${Number(o.pesoKg||modelo?.pesoKg||0).toFixed(1)} kg" style="position:absolute;left:${o.x*ppm-w/2}px;top:${o.y*ppm-h/2}px;width:${w}px;height:${h}px;transform:rotate(${Number(o.angulo||0)}deg);transform-origin:center;z-index:${sel?14:alvoCombate?13:10};display:flex;align-items:center;justify-content:center;cursor:${batalhaEhMestre_()?'grab':'crosshair'};opacity:${dead ? .42 : 1};filter:${dead?'grayscale(.8)':''};outline:${outline};outline-offset:2px;touch-action:none" onpointerdown="labObjetoPointerDown_(event,'${String(o.id).replace(/'/g,"\'")}')" onclick="labSelecionarObjeto_('${String(o.id).replace(/'/g,"\'")}')">${img}${dead?'<span style="position:absolute;font-size:26px">💥</span>':''}</div>`;
}
window.labObjetoHtml_=labObjetoHtml_;
window.labSelecionarObjeto_=function(id){
    const o=labObjetoPorId_(id);if(!o)return;
    const at=labTokenAtual_();
    if(!batalhaEhMestre_()){
        if(at&&labPodeControlarToken_(at)){at.alvoLab=String(id);at._alvoManualFixadoLab=String(id);at._alvoMortoManual510=!!labAlvoInerte490_(o);labEstado_.selecionadoId='';labEstado_.objetoSelecionadoId=String(id);labRender_();notificar_(`Objeto selecionado: ${o.nome||'objeto'}.`,'info',1600);}return;
    }
    if(labEstado_.fase==='combate'&&!labEstado_.modoCriacaoMapa){if(at){at.alvoLab=String(id);at._alvoManualFixadoLab=String(id);at._alvoMortoManual510=!!labAlvoInerte490_(o);labApontarPara_(at,o);labEstado_.selecionadoId='';labEstado_.objetoSelecionadoId=String(id);labSalvarLocal_();labRender_();return;}}
    labEstado_.objetoSelecionadoId=String(id||'');labEstado_.selecionadoId='';labSalvarLocal_();labRenderObjetoPainel_();labRender_();
};
window.labObjetoPointerDown_=function(ev,id){
    if(!batalhaEhMestre_())return;ev.preventDefault();ev.stopPropagation();const o=labObjetoPorId_(id),map=document.getElementById('labMetricMap');if(!o||!map)return;
    labEstado_.objetoSelecionadoId=String(id);labEstado_.selecionadoId='';const rect=map.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48);
    const n=map.querySelector(`.lab-map-object[data-id="${CSS.escape(String(id))}"]`);let raf=0,p=null;
    const aplicar=()=>{raf=0;if(!p)return;const q=p;p=null;o.x=Math.max(0,Math.min(labEstado_.larguraM,(q.x-rect.left)/ppm));o.y=Math.max(0,Math.min(labEstado_.alturaM,(q.y-rect.top)/ppm));if(n){const w=n.offsetWidth,h=n.offsetHeight;n.style.left=`${o.x*ppm-w/2}px`;n.style.top=`${o.y*ppm-h/2}px`;}};
    const move=e=>{p={x:e.clientX,y:e.clientY};if(!raf)raf=requestAnimationFrame(aplicar);};
    const up=()=>{window.removeEventListener('pointermove',move);if(p){if(raf){cancelAnimationFrame(raf);raf=0;}aplicar();}labSalvarLocal_();labRender_();};window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
window.labObjetoGirar_=function(delta){if(!batalhaEhMestre_())return;const o=labObjetoPorId_(labEstado_.objetoSelecionadoId);if(!o)return;o.angulo=(Number(o.angulo||0)+Number(delta||0)+360)%360;labSalvarLocal_();labRender_();};
window.labObjetoAplicarDano_=function(){
    if(!batalhaEhMestre_())return;
    const o=labObjetoPorId_(labEstado_.objetoSelecionadoId);if(!o||o.destrutivel===false)return;const inp=document.getElementById('labObjetoDanoInput'),bruto=Math.max(0,Number(inp?.value||0));
    const efetivo=Math.max(0,bruto-Number(o.dureza||0));o.pvAtual=Math.max(0,Number((o.pvAtual??o.pvMax)||0)-efetivo);if(o.pvAtual<=0)o.destruido=true;
    labSalvarLocal_();labRender_();notificar_(`${o.nome}: dano ${bruto}, dureza ${Number(o.dureza||0)}, perdeu ${efetivo} PV.`,'info',3500);
};
window.labObjetoRestaurar_=function(){if(!batalhaEhMestre_())return;const o=labObjetoPorId_(labEstado_.objetoSelecionadoId);if(!o)return;o.pvAtual=Number(o.pvMax||0);o.destruido=false;labSalvarLocal_();labRender_();};
window.labObjetoExcluir_=function(){if(!batalhaEhMestre_())return;const o=labObjetoPorId_(labEstado_.objetoSelecionadoId);if(!o)return;if(!confirm(`Remover “${o.nome}” deste mapa?`))return;labEstado_.objetosLab=labEstado_.objetosLab.filter(x=>String(x.id)!==String(o.id));labEstado_.objetoSelecionadoId='';labSalvarLocal_();labRender_();};
window.labRenderObjetoPainel_=function(){
    const e=document.getElementById('labObjetoPainel');if(!e)return;e.style.display='flex';e.style.alignItems='center';e.style.gap='7px';e.style.flexWrap='nowrap';
    if(!batalhaEhMestre_()){e.innerHTML='';return;}const o=labObjetoPorId_(labEstado_.objetoSelecionadoId);if(!o){e.innerHTML='';return;}
    e.innerHTML=`<b>🌳 ${escaparHtmlInventario_(o.nome||'Objeto')}</b><span>PV <b>${Number((o.pvAtual??o.pvMax)||0)}/${Number(o.pvMax||0)}</b></span><span>Dureza <b>${Number(o.dureza||0)}</b></span><span>Peso <b>${Number(o.pesoKg||Math.max(1,Number(o.larguraM||1)*Number(o.alturaM||1)*20)).toFixed(1)} kg</b></span>${o.destruido?'<span style="color:#ff8d8d">💥 destruído</span>':''}<button class="btn-small" onclick="labObjetoGirar_(-15)">↶ 15°</button><button class="btn-small" onclick="labObjetoGirar_(15)">↷ 15°</button><label style="display:flex;align-items:center;gap:5px;margin:0">Dano <input id="labObjetoDanoInput" type="number" min="0" value="5" style="width:70px;margin:0;padding:6px"></label><button class="btn-small" onclick="labObjetoAplicarDano_()" ${o.destrutivel===false?'disabled':''}>💥 Aplicar</button><button class="btn-small" onclick="labObjetoRestaurar_()">🛠️ Restaurar</button><button class="btn-small btn-delete" onclick="labObjetoExcluir_()">🗑️ Remover</button>`;
};
garantirObjetosMapaPadrao_();
setTimeout(()=>{try{labAtualizarSelectObjetosMapa_();renderizarBancoObjetosMapa_();}catch(_){}},500);


