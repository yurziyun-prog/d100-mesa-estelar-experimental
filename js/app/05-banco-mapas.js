// ============================================================
// BANCO DE MAPAS — v46.28
// A biblioteca apenas administra os mapas salvos. A edição
// continua sendo feita diretamente no Mapa da Mesa.
// ============================================================
function mapaBancoDataFormatada_(valor){
    if(!valor)return '—';
    try{
        const d=valor?.toDate?valor.toDate():new Date(valor);
        if(Number.isNaN(d.getTime()))return '—';
        return d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
    }catch(_){return '—';}
}

function renderizarBancoMapas_(){
    const e=document.getElementById('listaBancoMapas');
    if(!e)return;
    if(!userData||userData.role!=='mestre'){
        e.innerHTML='<p style="color:#aaa">Banco exclusivo do mestre.</p>';
        return;
    }
    const lista=[...(mapasDB||[])].filter(m=>!m?.hiddenMesaLive&&!String(m?.id||'').startsWith('__mesa_live__')).sort((a,b)=>String(a.nome||a.id||'').localeCompare(String(b.nome||b.id||''),'pt-BR',{sensitivity:'base'}));
    if(!lista.length){
        e.innerHTML='<div style="padding:18px;border:1px dashed rgba(255,255,255,.18);border-radius:10px;color:#999;">Nenhum mapa salvo ainda. Crie ou edite um mapa no Mapa da Mesa e use <b>Salvar mapa</b>.</div>';
        return;
    }
    e.innerHTML=`<div class="db-table-wrap"><table class="db-table" style="min-width:1050px;">
      <thead><tr><th>Nome</th><th>Tamanho</th><th>Grade</th><th>Textura</th><th>Atualizado</th><th>Armazenamento</th><th>Ações</th></tr></thead>
      <tbody>${lista.map(m=>{
        const grade=m.gradeVisivel===false?'Oculta':'Visível';
        const armazenamento=m.__local?'💻 Local':'☁️ Firestore';
        return `<tr>
          <td><b>${escaparBanco_(m.nome||m.id||'Mapa sem nome')}</b><br><small style="color:#888">${escaparBanco_(m.id||'')}</small></td>
          <td>${Number(m.larguraM||28)} × ${Number(m.alturaM||14)} m</td>
          <td>${grade}<br><small>${escaparBanco_(m.corGrade||'#777777')}</small></td>
          <td>${escaparBanco_(m.textura||'nenhuma')}</td>
          <td>${mapaBancoDataFormatada_(m.atualizadoEm)}</td>
          <td>${armazenamento}</td>
          <td class="actions" style="min-width:320px;">
            <button class="btn-small btn-select" onclick="abrirMapaBancoNaMesa_('${String(m.id).replace(/'/g,"\\'")}')">🗺️ Abrir na Mesa</button>
            <button class="btn-small" onclick="renomearMapaBanco_('${String(m.id).replace(/'/g,"\\'")}')">✏️ Renomear</button>
            <button class="btn-small" onclick="duplicarMapaBanco_('${String(m.id).replace(/'/g,"\\'")}')">📑 Duplicar</button>
            <button class="btn-small btn-delete" onclick="excluirMapaBancoAdmin_('${String(m.id).replace(/'/g,"\\'")}')">🗑️ Excluir</button>
          </td>
        </tr>`;
      }).join('')}</tbody></table></div>`;
}

// Estado da leitura, separado da lista: zero mapas NÃO significa necessariamente
// ausência de dados, especialmente quando Firestore está temporariamente inacessível.
window.mesaEstadoBancoMapasV235_={status:'aguardando',erro:'',atualizadoEm:0};
window.recarregarBancoMapas_=async function({silencioso=false}={}){
    if(!userData||userData.role!=='mestre')return false;
    const estado=window.mesaEstadoBancoMapasV235_;
    if(estado.status==='carregando')return false;
    estado.status='carregando';estado.erro='';
    try{
        const q=await getDocs(collection(db,'mapas'));
        const novos=[];q.forEach(d=>{const x={id:d.id,...d.data()};if(x.tipo!=='mapa-parte')novos.push(x);});
        novos.sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'}));
        mapasDB=novos;
        if(typeof labMesclarMapasLocais_==='function')labMesclarMapasLocais_();
        estado.status='pronto';estado.atualizadoEm=Date.now();
        renderizarBancoMapas_();
        if(typeof labAtualizarSelectMapas_==='function')labAtualizarSelectMapas_();
        if(!silencioso)notificar_('Banco de mapas atualizado.','info',2500);
        return true;
    }catch(e){
        // Preservar a lista anterior; nunca transformar um erro de rede em
        // suposta exclusão de mapas.
        console.error('Atualizar mapas',e);
        estado.status='erro';estado.erro=String(e?.code||e?.message||'Falha de leitura');
        if(!silencioso)notificar_('Não foi possível ler mapas: '+estado.erro,'erro',4500);
        return false;
    }
};

window.abrirMapaDaMesa_=function(){
    mostrarAba('sincronizacao-nova',document.getElementById('syncLabTabBtn'));
    return window.novaSyncAbrir_();
};
// Navegação dos três visualizadores: troca SOMENTE o mapa do controlador,
// sem abrir a aba Mesa nem alterar o layout da sessão.
window.abrirMapaNosVisualizadores_=async function(id){
    if(!id)throw new Error('Selecione um mapa.');
    await novaSyncController_.openMap(String(id));
};
window.abrirMapaBancoNaMesa_=async function(id){
    try{
        // Ao abrir uma casa/interior enquanto um dos três visualizadores está ativo,
        // conservar a perspectiva escolhida e não pular para o Mapa da Mesa.
        if(window.mesaTresMapas?.aba?.()){
            await window.abrirMapaNosVisualizadores_(id);
        }else{
            await window.abrirMapaDaMesa_();
            await novaSyncController_.openMap(id);
        }
    }catch(e){notificar_(e.message,'aviso',4500);}
};

window.renomearMapaBanco_=async function(id){
    if(!userData||userData.role!=='mestre')return;
    const m=(mapasDB||[]).find(x=>String(x.id)===String(id));if(!m)return;
    const nome=prompt('Novo nome do mapa:',m.nome||m.id||'');
    if(nome==null||!String(nome).trim())return;
    const novoNome=String(nome).trim();
    try{
        if(m.__local){
            const locais=labMapasLocaisLer_();const ix=locais.findIndex(x=>String(x.id)===String(id));
            if(ix>=0){locais[ix]={...locais[ix],nome:novoNome,atualizadoEm:new Date().toISOString(),__local:true};labMapasLocaisSalvar_(locais);}
            Object.assign(m,{nome:novoNome,atualizadoEm:new Date().toISOString(),__local:true});
        }else{
            await setDoc(doc(db,'mapas',String(id)),{...m,nome:novoNome,atualizadoEm:new Date().toISOString()},{merge:false});
            Object.assign(m,{nome:novoNome,atualizadoEm:new Date().toISOString()});
        }
        renderizarBancoMapas_();if(typeof labAtualizarSelectMapas_==='function')labAtualizarSelectMapas_();
        notificar_(`Mapa “${novoNome}” renomeado.`,'sucesso',3000);
    }catch(e){console.error('Renomear mapa',e);notificar_('Não foi possível renomear o mapa.','erro');}
};

window.duplicarMapaBanco_=async function(id){
    if(!userData||userData.role!=='mestre')return;
    const m0=(mapasDB||[]).find(x=>String(x.id)===String(id));if(!m0)return;
    let m=m0;try{m=await labMapaHidratar_(m0);}catch(e){console.error(e);notificar_('Não foi possível ler o mapa para duplicar.','erro');return;}
    let nome=prompt('Nome da cópia:',`${m.nome||'Mapa'} - cópia`);if(nome==null||!String(nome).trim())return;nome=String(nome).trim();
    let novoId=labMapaSlug_(nome),base=novoId,n=2;while((mapasDB||[]).some(x=>String(x.id)===String(novoId)))novoId=`${base}_${n++}`;
    const copia={...JSON.parse(JSON.stringify(m)),id:novoId,nome,criadoPor:currentUserUid||'',atualizadoEm:new Date().toISOString()};delete copia.__local;
    try{
        const salva=await labMapaSalvarFirestore_(copia,0);
        mapasDB.push(salva);renderizarBancoMapas_();if(typeof labAtualizarSelectMapas_==='function')labAtualizarSelectMapas_();
        notificar_(`Mapa “${nome}” duplicado.`,'sucesso',3200);
    }catch(e){console.error('Duplicar mapa',e);notificar_('Não foi possível duplicar o mapa.','erro');}
};

window.excluirMapaBancoAdmin_=async function(id){
    if(!userData||userData.role!=='mestre')return;
    const m=(mapasDB||[]).find(x=>String(x.id)===String(id));if(!m)return;
    if(!confirm(`Excluir permanentemente o mapa “${m.nome||m.id}”?`))return;
    try{
        if(m.__local){
            const locais=labMapasLocaisLer_().filter(x=>String(x.id)!==String(id));labMapasLocaisSalvar_(locais);
        }else {await labMapaApagarPartesAntigas_(id,Number(m.partes||0));await deleteDoc(doc(db,'mapas',String(id)));}
        mapasDB=mapasDB.filter(x=>String(x.id)!==String(id));
        if(String(labMapaSelecionado_||'')===String(id))labMapaSelecionado_='';
        renderizarBancoMapas_();if(typeof labAtualizarSelectMapas_==='function')labAtualizarSelectMapas_();
        notificar_(`Mapa “${m.nome||m.id}” excluído.`,'info',3000);
    }catch(e){console.error('Excluir mapa',e);notificar_('Não foi possível excluir o mapa.','erro');}
};

