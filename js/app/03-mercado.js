// ============================================
// MERCADO
// ============================================
function resolverPersonagemAtual_(){
    const atual=userCharacters.find(c=>String(c.id)===String(currentCharId));
    const salvo=userCharacters.find(c=>String(c.id)===String(userData?.personagemAtivo));
    const escolhido=atual||salvo||(userCharacters.length===1?userCharacters[0]:null);
    currentCharId=escolhido?.id??null;
    return escolhido;
}
function obterPersonagemAtual_(){return resolverPersonagemAtual_();}

function atualizarCompradorMercado_(){
    resolverPersonagemAtual_();
    const select=document.getElementById('marketCharacter');if(!select)return;
    select.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Selecione quem vai comprar';select.append(placeholder);
    for(const char of userCharacters){const option=document.createElement('option');option.value=char.id;option.textContent=char.nome||'Personagem';select.append(option);}
    select.value=userCharacters.some(c=>c.id===currentCharId)?currentCharId:'';
}
window.selecionarCompradorMercado_=async id=>{
    const escolhido=userCharacters.find(c=>String(c.id)===String(id));if(!escolhido)return;
    return window.selecionarPersonagem(escolhido.id);
};
function atualizarCategoriasMercado_() {
    const select = document.getElementById('marketCategory');
    if (!select) return;
    const atual = select.value;
    const categorias = categoriasUnicasMercado_(itensDB.map(i => i.categoria)); // v200: "Itens médicos" e "Itens Médicos" são a mesma categoria
    select.innerHTML = '<option value="" data-i18n="allCategories">Todas as categorias</option>' + categorias.map(c => `<option value="${escaparBanco_(c.chave)}">${escaparBanco_(c.rotulo)}</option>`).join('');
    if ([...select.options].some(o => o.value === atual)) select.value = atual;
}


// v200: categoria sem diferenciar maiúsculas, acentos nem espaços sobrando; o rótulo mostrado é a grafia mais usada
function chaveCategoriaMercado_(c){return String(c ?? '').trim().replace(/\s+/g,' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'') || 'diversos';}
function categoriasUnicasMercado_(lista){
    const m = new Map();
    for(const bruta of lista){const rot = String(bruta ?? '').trim().replace(/\s+/g,' ') || 'Diversos', k = chaveCategoriaMercado_(rot), g = m.get(k) || {chave:k, grafias:new Map()};g.grafias.set(rot,(g.grafias.get(rot)||0)+1);m.set(k,g);}
    return [...m.values()].map(g => ({chave:g.chave, rotulo:[...g.grafias].sort((a,b) => b[1]-a[1])[0][0]})).sort((a,b) => a.rotulo.localeCompare(b.rotulo));
}
function normalizarAcesso_(valor){
    return String(valor||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]+/g,' ').trim();
}
function nivelAcessoNormalizado_(item){
    const raw=String(item?.nivelAcesso||'Livre').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(!raw || /livre|comum|sem restr/.test(raw))return 'Livre';
    if(/militar/.test(raw))return 'Militar';
    return 'Restrito';
}
function rankAcesso_(item){
    return ({Livre:0,Restrito:1,Militar:2})[nivelAcessoNormalizado_(item)]??0;
}
function textoPersonagemAcesso_(char){
    const origem=origensDB.find(o=>o.id===char?.origem);
    const carreira=carreirasDB.find(c=>c.id===char?.carreira);
    return `${char?.origem||''} ${origem?.id||''} ${origem?.nome||''} ${char?.carreira||''} ${carreira?.id||''} ${carreira?.nome||''} ${char?.conceito||''}`.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function nivelMaxAcessoPersonagem_(char){
    const t=textoPersonagemAcesso_(char);
    const origemMilitar=String(char?.origem||'')==='militar';
    const origemArist=String(char?.origem||'')==='aristocratico';
    const carreiraMilitar=/\b(militar|soldad|polic|agente|agente secreto|agente de inteligencia|espia|espiao|spy|inteligencia|intelligence|marinha|exercito|forcas armadas)\b/.test(t);
    const carreiraRestrita=carreiraMilitar || /\b(pirata|bandido|crim|contraband|submundo|mercen|cacador de recompensas|cacador_recompensas|guarda-costas|guarda_costas|seguranca)\b/.test(t);
    if(origemMilitar||carreiraMilitar)return 'Militar';
    if(origemArist||carreiraRestrita)return 'Restrito';
    return 'Livre';
}
function acessoPermitidoItem_(char,item){
    const max=({Livre:0,Restrito:1,Militar:2})[nivelMaxAcessoPersonagem_(char)]??0;
    const rank=rankAcesso_(item);
    if(rank<=max)return true;
    // Autorizações profissionais são específicas: não transformam uma carreira em passe universal para itens Restritos.
    const pessoa=normalizarAcesso_(textoPersonagemAcesso_(char));
    const itemTxt=normalizarAcesso_(`${getNome(item)||''} ${item?.categoria||''} ${item?.tipo||''} ${item?.descricao||''} ${item?.acessoProfissional||item?.acessosProfissionais||''}`);
    const medico=/\b(medic[oa]s?|cirurg|paramedic|enferm)\b/.test(pessoa);
    // Inclui formas flexionadas/adjetivais: médico, médica, médicos e biomédico.
    // A categoria “Itens Médicos” deve conceder a mesma autorização profissional
    // que um nome explicitamente médico, sem transformar a carreira em passe geral.
    const itemMedico=/\b(medic[oa]s?|antidoto|nanogel|farmac|cirurg|kit medico|primeiros socorros)\b/.test(itemTxt)||/biomedic[oa]s?/.test(itemTxt);
    if(medico&&itemMedico&&rank<=1)return true;
    const detetive=/\b(detetiv|investigador|investigacao)\b/.test(pessoa);
    if(detetive&&rank<=1){
        const armaCurta=/\b(pistola|revolver|blaster de palma|arma curta|laser leve|incapacit|stun|atordo)\b/.test(itemTxt);
        const policial=/\b(algema|scanner|investig|forense|comunicador|gravador)\b/.test(itemTxt);
        if(armaCurta||policial)return true;
    }
    return false;
}
function badgeAcesso_(item,permitido=true){
    const n=nivelAcessoNormalizado_(item);
    const cor=n==='Livre'?'#8ff0a8':n==='Restrito'?'#ffd166':'#ff8f8f';
    return `<span style="display:inline-block;padding:2px 7px;border-radius:999px;border:1px solid ${cor};color:${cor};font-size:.78em;">${n}${permitido?'':' · sem acesso'}</span>`;
}

function percorrerInventarioItens_(char){
    const inv=normalizarInventario_(char);
    const out=[];
    for(const [comp,arr] of Object.entries(inv)){
        (arr||[]).forEach((item,index)=>{if(item)out.push({item,comp,index});});
    }
    return out;
}

function estadoReparos_(char){
    if(!Array.isArray(char.reparosPendentes))char.reparosPendentes=[];
    return char.reparosPendentes;
}

function reparavel_(i){let c=normalizarTextoCombate_(i?.categoria||''),n=normalizarTextoCombate_(i?.nome||'');return Number(i?.pv||0)>1&&!/alimento|bebida|comida|municao|medic|consum/.test(c)&&!/cafe|cerveja|agua|racao|refeicao|nanogel/.test(n);}

function itemEhAguaConsumo_(i){
    const n=normalizarTextoCombate_(`${i?.idBanco||i?.id||''} ${getNome(i)||''}`);
    return /agua|water/.test(n);
}
function itemEhAlimentoConsumo_(i){
    const n=normalizarTextoCombate_(`${i?.idBanco||i?.id||''} ${getNome(i)||''}`);
    const c=normalizarTextoCombate_(i?.categoria||'');
    if(itemEhAguaConsumo_(i)||/cafe|cerveja|beer|coffee/.test(n))return false;
    return /comida|alimento|food|racao|refeicao|meal/.test(`${c} ${n}`);
}
function itemEhBebidaFadiga_(i){
    const n=normalizarTextoCombate_(`${i?.idBanco||i?.id||''} ${getNome(i)||''}`);
    return /cafe|cerveja|beer|coffee/.test(n);
}
function itemEhRecursoNutritivo_(i){return itemEhAguaConsumo_(i)||itemEhAlimentoConsumo_(i);}
function maxPontosConsumo_(i){
    if(!i)return 0;
    const uso=Math.max(0,Number(i.uso||0)),pv=Math.max(0,Number(i.pv||0));
    return itemEhRecursoNutritivo_(i)&&uso>pv?uso:Math.max(1,pv);
}
function pontosConsumoAtuais_(i){
    if(!i)return 0;
    if(Object.prototype.hasOwnProperty.call(i,'pvConsumoAtual'))return Math.max(0,Number(i.pvConsumoAtual)||0);
    if(itemEhRecursoNutritivo_(i)&&Number(i.uso||0)>Number(i.pv||0))return maxPontosConsumo_(i);
    return Math.max(0,Number(i.pvAtual??i.pv??maxPontosConsumo_(i))||0);
}
function definirPontosConsumo_(i,v){
    v=Math.max(0,Number(v)||0);
    if(itemEhRecursoNutritivo_(i)&&Number(i.uso||0)>Number(i.pv||0))i.pvConsumoAtual=v;
    else i.pvAtual=v;
}
function gastarPontosConsumo_(i,qtd=1){
    const antes=pontosConsumoAtuais_(i),gasto=Math.min(antes,Math.max(0,Number(qtd)||0));
    definirPontosConsumo_(i,antes-gasto);return gasto;
}
function consumivelAtivo_(i){
    const n=normalizarTextoCombate_(i?.nome||''),c=normalizarTextoCombate_(i?.categoria||'');
    return /cafe|cerveja|nanogel|energetic/.test(n)||c.includes('bebida')||itemEhAguaConsumo_(i)||itemEhAlimentoConsumo_(i);
}
function melhorarFadigaUmNivelConsumo_(c,dia){
    c.combate=c.combate||{};
    if(c.combate.recuperacaoConsumoDia===dia)return {ok:false,motivo:'Alimentos e bebidas só recuperam 1 nível de Fadiga por dia.'};
    const ordem=['Fresh','Winded','Tired','Wearied','Exhausted','Debilitated','Incapacitated','Semi-Conscious','Comatose'];
    const ix=ordem.indexOf(c.combate.fadiga||'Fresh');
    if(ix<=0)return {ok:false,motivo:'Já está Descansado.'};
    c.combate.fadiga=ordem[ix-1];c.combate.recuperacaoConsumoDia=dia;return {ok:true};
}
// v139: comer e beber água até 4 vezes por dia cada, café 1 vez; cada uso vale algumas horas de descanso (menos que dormir).
const CONSUMO_V139_={cafe:{limite:1,horas:3,nome:'café'},agua:{limite:4,horas:1.5,nome:'água'},comida:{limite:4,horas:2,nome:'comida'},bebida:{limite:4,horas:1,nome:'bebida'}};
const HORAS_FADIGA_V139_={Winded:.25,Tired:3,Wearied:6,Exhausted:12,Debilitated:18,Incapacitated:24,'Semi-Conscious':36,Comatose:48};
function tipoConsumoV139_(i){const n=normalizarTextoCombate_(i?.nome||'');if(/cafe/.test(n))return 'cafe';if(itemEhAguaConsumo_(i))return 'agua';if(itemEhAlimentoConsumo_(i))return 'comida';return 'bebida';}
function recuperarFadigaConsumoV139_(c,i,dia){
    c.combate=c.combate||{};const tipo=tipoConsumoV139_(i),R=CONSUMO_V139_[tipo];
    const usos=c.combate.consumoDiaV139?.dia===dia?{...(c.combate.consumoDiaV139.usos||{})}:{};
    if(Number(usos[tipo]||0)>=R.limite)return {ok:false,motivo:`Hoje já foi ${R.limite===1?'1 vez':R.limite+' vezes'} de ${R.nome} (limite por dia).`};
    const ordem=['Fresh','Winded','Tired','Wearied','Exhausted','Debilitated','Incapacitated','Semi-Conscious','Comatose'];
    let n=ordem.includes(c.combate.fadiga)?c.combate.fadiga:'Fresh',a=Number(c.combate.descansoHoras)||0;const antes=n;a+=R.horas;
    while(n!=='Fresh'&&a>=HORAS_FADIGA_V139_[n]){a-=HORAS_FADIGA_V139_[n];n=ordem[ordem.indexOf(n)-1];}if(n==='Fresh')a=0;
    usos[tipo]=Number(usos[tipo]||0)+1;c.combate.consumoDiaV139={dia,usos};c.combate.fadiga=n;c.combate.descansoHoras=a;
    // v145: fome e sede (sobem com as horas do jogo): comer zera a fome; água zera a sede; café e outras bebidas tiram 1 de sede
    {const nc={fome:0,sede:0,hFome:0,hSede:0,...(c.necessidades||{})};if(tipo==='comida'){nc.fome=0;nc.hFome=0;}else if(tipo==='agua'){nc.sede=0;nc.hSede=0;}else nc.sede=Math.max(0,nc.sede-1);c.necessidades=nc;
     try{const k=encodeURIComponent(String(c.id||''));const d=doc(db,'combatesAtivos','mesaNecessidades');setDoc(d,{tokens:{[k]:{fome:nc.fome,sede:nc.sede}}},{merge:true}).catch(()=>{});}catch(_){}}
    return {ok:true,usos:usos[tipo],limite:R.limite,texto:n!==antes?'Fadiga melhorou':'descansou um pouco (a Fadiga melhora com mais descanso)'};
}
window.usarConsumivel_=async(comp,ix)=>{
    const c=obterPersonagemAtual_();if(!c)return;
    const inv=normalizarInventario_(c),i=inv?.[comp]?.[ix];if(!i)return;
    const n=normalizarTextoCombate_(i.nome||'');c.combate=c.combate||{};
    if(n.includes('nanogel')){
        const ms=pvMaxLocais_(c),ls=Object.entries(ms).filter(([l,m])=>Number(c.combate.hitLocations?.[l]??m)<m);
        if(!ls.length)return notificar_('Nenhuma área ferida.','aviso');
        const q=prompt(ls.map(([l,m],j)=>`${j+1}. ${l} (${c.combate.hitLocations?.[l]??m}/${m})`).join('\n')),z=ls[(+q||0)-1];if(!z)return;
        const [l,m]=z,w=Math.floor((obterDiaCampanha_()-1)/7)+1;c.combate.nanogelSemana=c.combate.nanogelSemana||{};
        if(c.combate.nanogelSemana[l]===w)return notificar_('Essa área já recebeu Nanogel nesta semana.','aviso');
        c.combate.hitLocations=c.combate.hitLocations||{};c.combate.hitLocations[l]=Math.min(m,Number(c.combate.hitLocations[l]??m)+1);c.combate.nanogelSemana[l]=w;
        inv[comp][ix]=null;
    }else{
        if(pontosConsumoAtuais_(i)<=0)return notificar_(`${getNome(i)} está vazio/esgotado.`,'aviso');
        const r=recuperarFadigaConsumoV139_(c,i,obterDiaCampanha_());if(!r.ok)return notificar_(r.motivo,'aviso');
        gastarPontosConsumo_(i,1);inv[comp][ix]=i;
        notificar_(`${getNome(i)} consumido (${r.usos}/${r.limite} hoje): ${r.texto} · ${pontosConsumoAtuais_(i)} ponto(s) restantes.`,'info');
    }
    c.inventario=inv;
    await setDoc(doc(db,'personagens',c.id),{inventario:inv,combate:c.combate,...(c.necessidades?{necessidades:c.necessidades}:{})},{merge:true});
    renderizarInventario(c);renderizarCombate(c);renderizarVendaMercado_();
};
function consumirRecursoDiario_(char,tipo,qtd){
    const inv=normalizarInventario_(char);let falta=Math.max(0,Number(qtd)||0);
    for(const comp of ['equipado','bolso','mochila','veiculo','casa']){
        for(let ix=0;ix<(inv[comp]||[]).length&&falta>0;ix++){
            const item=inv[comp][ix];if(!item)continue;
            const serve=tipo==='agua'?itemEhAguaConsumo_(item):itemEhAlimentoConsumo_(item);if(!serve)continue;
            falta-=gastarPontosConsumo_(item,falta);inv[comp][ix]=item;
        }
    }
    char.inventario=inv;return {consumido:Math.max(0,qtd-falta),faltou:falta};
}
function processarNutricaoDias_(char,primeiroDia,ultimoDia){
    char.combate=char.combate||{};const eventos=[];
    for(let dia=primeiroDia;dia<=ultimoDia;dia++){
        const alimento=consumirRecursoDiario_(char,'alimento',2),agua=consumirRecursoDiario_(char,'agua',2);
        if(alimento.faltou>0||agua.faltou>0){
            batalhaPiorarFadigaUmNivel_(char);
            eventos.push(`Dia ${dia}: falta de suprimentos → +1 nível de Fadiga.`);
        }else eventos.push(`Dia ${dia}: 2 alimento + 2 água consumidos.`);
        char.combate.ultimoConsumoDiario=dia;
    }
    return eventos;
}

function previewReparo_(item,local=false){
    const banco=itensDB.find(x=>String(x.id)===String(item.idBanco||item.id))||item;
    const pvMax=Math.max(0,Number(banco.pv??item.pv??0));
    const pvAtual=Math.max(0,Number(item.pvAtual??pvMax));
    const perdidos=Math.max(0,pvMax-pvAtual);
    const frac= pvMax>0 ? perdidos/pvMax : 0;
    const precoOriginal=Math.max(0,Number(item.precoPago??banco.preco??item.preco??0));
    let custo=Math.max(0,Math.floor(precoOriginal*0.80*frac));
    if(local)custo=Math.max(0,Math.floor(custo*0.90));
    return {pvMax,pvAtual,perdidos,frac,precoOriginal,custo};
}
function rolarPrazoReparo_(item){
    const p=previewReparo_(item,false);
    const dados=[0,0,0].map(()=>Math.floor(Math.random()*20)+1);
    const horasDano=Math.ceil(p.frac*24);
    const horas=dados.reduce((a,b)=>a+b,0)+horasDano;
    const diasCalendario=Math.max(1,Math.ceil(horas/24));
    // Ex.: no dia 1, 49 h cai no dia 3.
    const entregaDia=obterDiaCampanha_()+diasCalendario-1;
    return {dados,horasDano,horas,diasCalendario,entregaDia};
}
async function iniciarReparoItem_(comp,index,local=false){
    const char=obterPersonagemAtual_();if(!char)return;
    const inv=normalizarInventario_(char),item=inv?.[comp]?.[index];if(!item)return;
    const p=previewReparo_(item,local);
    if(p.perdidos<=0){notificar_('Este item está com PV completos.','aviso');return;}
    if(Number(char.recursos||0)<p.custo){notificar_('Recursos insuficientes para o reparo.','aviso');return;}
    const prazo=rolarPrazoReparo_(item);
    const dadosTxt=prazo.dados.join('+');
    if(!confirm(`Reparar ${getNome(item)} por ${p.custo} recursos?\nPrazo: 3d20 (${dadosTxt}) + ${prazo.horasDano} h por dano = ${prazo.horas} h.\nEntrega no dia de campanha ${prazo.entregaDia}.`))return;

    char.recursos=Number(char.recursos||0)-p.custo;
    const reparos=estadoReparos_(char);
    reparos.push({
        id:`rep_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        item:{...item},origemComp:comp,origemIndex:index,
        iniciadoDia:obterDiaCampanha_(),entregaDia:prazo.entregaDia,
        horas:prazo.horas,dadosPrazo:prazo.dados,horasDano:prazo.horasDano,
        custo:p.custo,local:!!local
    });
    inv[comp][index]=null;
    char.inventario=inv;
    await setDoc(doc(db,'personagens',char.id),{inventario:inv,reparosPendentes:reparos,recursos:char.recursos},{merge:true});
    const r=document.getElementById('editRecursos');if(r)r.value=char.recursos;
    renderizarInventario(char);renderizarVendaMercado_();renderizarMercadoLocal_();renderizarMercado();
    notificar_(`${getNome(item)} enviado para reparo. Entrega no dia ${prazo.entregaDia}.`,'info');
}
window.iniciarReparoMercado_=async(comp,index)=>iniciarReparoItem_(comp,index,false);
window.iniciarReparoMercadoLocal_=async(comp,index)=>iniciarReparoItem_(comp,index,true);

async function processarReparosConcluidos_(){
    const dia=obterDiaCampanha_();
    const chars=(userData?.role==='mestre' ? userCharacters : [obterPersonagemAtual_()]).filter(Boolean);
    for(const char of chars){
        const reparos=Array.isArray(char.reparosPendentes)?char.reparosPendentes:[];
        const concluidos=reparos.filter(r=>Number(r.entregaDia||999999)<=dia);
        if(!concluidos.length)continue;
        const inv=normalizarInventario_(char);
        const entregues=new Set();
        for(const r of concluidos){
            const item=atualizarInstanciaPeloBanco_({...r.item});
            const banco=itensDB.find(x=>String(x.id)===String(item.idBanco||item.id))||item;
            item.pvAtual=Math.max(0,Number(banco.pv??item.pv??0));
            let destino=(r.origemComp&&Array.isArray(inv[r.origemComp]))?r.origemComp:'mochila';
            let slot=inv[destino].findIndex(x=>!x);
            if(slot<0){
                for(const c of ['mochila','bolso','veiculo','casa','equipado']){
                    const ix=inv[c].findIndex(x=>!x);
                    if(ix>=0){destino=c;slot=ix;break;}
                }
            }
            if(slot>=0){inv[destino][slot]=item;entregues.add(r.id);}
            else r.entregaDia=dia+1;
        }
        char.reparosPendentes=reparos.filter(r=>!entregues.has(r.id));
        char.inventario=inv;
        await setDoc(doc(db,'personagens',char.id),{inventario:inv,reparosPendentes:char.reparosPendentes},{merge:true});
    }
    const atual=obterPersonagemAtual_();
    if(atual){renderizarInventario(atual);renderizarVendaMercado_();renderizarMercadoLocal_();}
}
function reparosPendentesHtml_(char){
    const rs=Array.isArray(char?.reparosPendentes)?char.reparosPendentes:[];
    if(!rs.length)return '';
    return `<div style="margin:10px 0 14px;padding:10px;border:1px solid rgba(255,209,102,.28);border-radius:9px;background:rgba(255,209,102,.05);">
      <strong style="color:#ffd166;">🛠️ Itens em reparo</strong>
      ${rs.map(r=>`<div style="margin-top:6px;color:#ccc;">${escaparHtmlInventario_(getNome(r.item))} · entrega no dia <strong>${r.entregaDia}</strong> · ${r.horas} h · ${Number(r.custo||0).toLocaleString('pt-BR')} recursos</div>`).join('')}
    </div>`;
}

function precoVendaNormal_(registro){
    const item=registro.item;
    const banco=itensDB.find(x=>String(x.id)===String(item.idBanco||item.id));
    const precoPago=Math.max(0,Number(item.precoPago ?? banco?.preco ?? item.preco ?? 0));
    const pvMax=Math.max(0,Number(banco?.pv ?? item.pv ?? 0));
    const pvAtual=Math.max(0,Number(item.pvAtual ?? pvMax));
    const cond=pvMax>0?Math.max(0,Math.min(1,pvAtual/pvMax)):1;
    return Math.max(0,Math.floor(precoPago*0.80*cond));
}
function precoBaseLocalCompra_(item,mult=0.90){
    const q='Básica';
    return Math.max(0,Math.floor(precoComQualidade_(item,q)*mult));
}
function precoBaseLocalVenda_(registro,mult=0.90){
    const item=registro.item,banco=itensDB.find(x=>String(x.id)===String(item.idBanco||item.id));
    const precoPago=Math.max(0,Number(item.precoPago ?? banco?.preco ?? item.preco ?? 0));
    const pvMax=Math.max(0,Number(banco?.pv ?? item.pv ?? 0));
    const pvAtual=Math.max(0,Number(item.pvAtual ?? pvMax));
    const cond=pvMax>0?Math.max(0,Math.min(1,pvAtual/pvMax)):1;
    return Math.max(0,Math.floor(precoPago*mult*cond));
}

window.mostrarSubAbaMercado_=(aba)=>{
    marketSubtabAtual_=aba||'comprar';
    ['comprar','vender','local'].forEach(x=>{
        document.getElementById(`marketPane${x[0].toUpperCase()+x.slice(1)}`)?.classList.toggle('hidden',x!==marketSubtabAtual_);
        const b=document.getElementById(`marketSubtab${x[0].toUpperCase()+x.slice(1)}`);
        if(b)b.classList.toggle('btn-select',x===marketSubtabAtual_);
    });
    if(aba==='vender')renderizarVendaMercado_();
    else if(aba==='local')renderizarMercadoLocal_();
    else renderizarMercado();
};

function atualizarCategoriasVenda_(){
    const sel=document.getElementById('marketSellCategory'),char=obterPersonagemAtual_();if(!sel||!char)return;
    const atual=sel.value;
    const cats=categoriasUnicasMercado_(percorrerInventarioItens_(char).map(r=>r.item.categoria));
    sel.innerHTML='<option value="">Todas as categorias</option>'+cats.map(c=>`<option value="${escaparBanco_(c.chave)}">${escaparBanco_(c.rotulo)}</option>`).join('');
    if(cats.some(c=>c.chave===atual))sel.value=atual;
}
window.renderizarVendaMercado_=()=>{
    const grid=document.getElementById('marketSellGrid'),notice=document.getElementById('marketSellNotice'),bal=document.getElementById('marketSellBalance');
    if(!grid||!notice||!bal)return;
    const char=obterPersonagemAtual_();bal.textContent=char?Number(char.recursos||0).toLocaleString('pt-BR'):'—';
    if(!char){grid.innerHTML='';notice.textContent='Selecione um personagem.';return;}
    atualizarCategoriasVenda_();
    const busca=String(document.getElementById('marketSellSearch')?.value||'').toLowerCase();
    const cat=String(document.getElementById('marketSellCategory')?.value||'');
    const regs=percorrerInventarioItens_(char).filter(r=>{
        const n=`${r.item.nome||''} ${r.item.nome_en||''}`.toLowerCase();
        return (!busca||n.includes(busca))&&(!cat||chaveCategoriaMercado_(r.item.categoria)===cat);
    }).sort((a,b)=>getNome(a.item).localeCompare(getNome(b.item)));
    notice.innerHTML=`${escaparHtmlInventario_(char.nome)} • ${regs.length} item(ns) listado(s).`+reparosPendentesHtml_(char);
    grid.innerHTML=regs.map(r=>{
        const item=r.item,nome=escaparBanco_(getNome(item)),preco=precoVendaNormal_(r);
        const banco=itensDB.find(x=>String(x.id)===String(item.idBanco||item.id));
        const pvMax=Number(banco?.pv??item.pv??0),pvAtual=Number(item.pvAtual??pvMax);
        const imagem=item.imagem?`<img src="${escaparBanco_(item.imagem)}" alt="${nome}"${miniAttr_(item)}>`:`<div class="market-card-placeholder">${miniaturaOuCaixa_(item,nome)}</div>`;
        return `<div class="market-card">${imagem}<div><h4>${nome}</h4>
          <div class="market-meta">${escaparBanco_(item.categoria||'')} • ${escaparBanco_(r.comp)} • PV ${pvAtual}/${pvMax}</div>
          <div style="margin:8px 0;"><strong>${preco.toLocaleString('pt-BR')}</strong> recursos</div>
          ${consumivelAtivo_(item)?`<button class="btn-small btn-select" onclick="usarConsumivel_('${r.comp}',${r.index})">🥤 Usar/Consumir</button>`:''}
          <button class="market-buy" ${preco<=0?'disabled':''} onclick="venderItemMercado_('${r.comp}',${r.index})">Vender</button>
          ${reparavel_(item)?`<button class="btn-small" style="margin-top:6px;" ${pvAtual>=pvMax?'disabled':''} onclick="iniciarReparoMercado_('${r.comp}',${r.index})">🛠️ Reparar</button>`:''}
          ${pvAtual<pvMax?`<small style="display:block;color:#aaa;margin-top:5px;">Custo-base: 80% do preço × fração dos PV perdidos. Prazo: 3d20 h + dano.</small>`:''}
          <button class="btn-small btn-delete" style="margin-top:6px;" onclick="descartarItemMercado_('${r.comp}',${r.index})">Descartar</button>
        </div></div>`;
    }).join('')||'<p style="color:#aaa;">Nenhum item encontrado.</p>';
};
window.venderItemMercado_=async(comp,index)=>{
    const char=obterPersonagemAtual_();if(!char)return;
    const inv=normalizarInventario_(char),item=inv?.[comp]?.[index];if(!item)return;
    const registro={item,comp,index},preco=precoVendaNormal_(registro);
    if(preco<=0){notificar_('Este item vale 0. Você pode descartá-lo.','aviso');return;}
    inv[comp][index]=null;char.recursos=Math.max(0,Number(char.recursos||0))+preco;char.inventario=inv;
    await setDoc(doc(db,'personagens',char.id),{inventario:inv,recursos:char.recursos},{merge:true});
    await registrarEventoMestreNoPersonagem_(char,'Mercado',`${getNome(item)} vendido por ${preco}`,{subtipo:'venda',itemId:item.idBanco||item.id,preco});
    somCaixaRegistradora_();renderizarInventario(char);renderizarVendaMercado_();renderizarMercado();
    notificar_(`${getNome(item)} vendido por ${preco}.`,'info');
};
window.descartarItemMercado_=async(comp,index)=>{
    const char=obterPersonagemAtual_();if(!char)return;const inv=normalizarInventario_(char),item=inv?.[comp]?.[index];if(!item)return;
    if(!confirm(`Descartar ${getNome(item)}?`))return;
    inv[comp][index]=null;char.inventario=inv;
    await setDoc(doc(db,'personagens',char.id),{inventario:inv},{merge:true});
    renderizarInventario(char);renderizarVendaMercado_();renderizarMercadoLocal_();
};

function iniciarMercadoLocal_(){
    if(mercadoLocalUnsub_){mercadoLocalUnsub_();mercadoLocalUnsub_=null;}
    mercadoLocalUnsub_=onSnapshot(doc(db,'configuracoes','mercadoLocal'),snap=>{
        mercadoLocalConfig_=snap.exists()?{cenarioId:'',cenarioNome:'',estabelecimentoNome:'',estabelecimentoTipo:'',itens:[],servicos:[],prestadores:[],vincularNPCsCenario:false,precosServicos:{reparo:0,cura:0,primeiros_socorros:0},...snap.data()}:{cenarioId:'',cenarioNome:'',estabelecimentoNome:'',estabelecimentoTipo:'',itens:[],servicos:[],prestadores:[],precosServicos:{reparo:0,cura:0,primeiros_socorros:0}};
        if(document.getElementById('mercado')?.classList.contains('active')&&marketSubtabAtual_==='local')renderizarMercadoLocal_();
    },err=>console.warn('Mercado local indisponível',err));
}
function periciasNegociacaoLocal_(char){
    const ids=['comercio','influencia','submundo'];
    return ids.map(id=>{
        const p=periciasDB.find(x=>x.id===id);if(!p)return null;
        const val=obterValorRegistroPericia_(char,p.id,false);
        return {p,val};
    }).filter(x=>x&&x.val>0);
}
function resultadoNegociacaoLocal_(grau,tipo){
    const g=normalizarTextoCombate_(grau);
    if(tipo==='compra'){
        if(g.includes('crit'))return .80;
        if(g.includes('sucesso'))return .85;
        if(g.includes('fiasco')||g.includes('falha critica'))return 1.10;
        return 1.00;
    }
    if(g.includes('crit'))return 1.00;
    if(g.includes('sucesso'))return .95;
    if(g.includes('fiasco')||g.includes('falha critica'))return .70;
    return .80;
}
window.rolarNegociacaoMercadoLocal_=async(tipo)=>{
    const char=obterPersonagemAtual_();if(!char)return;
    const token=document.getElementById('marketLocalSkill')?.value||'';
    const p=periciasDB.find(x=>x.id===token);if(!p)return;
    const bruto=obterValorRegistroPericia_(char,p.id,false),ajArm=valorPericiaComArmadura_(char,p,bruto);
    const aj=aplicarDificuldadeEFadiga_(char,ajArm.valor,'padrao',0);
    if(aj.bloqueado){notificar_('A fadiga impede a negociação.','aviso');return;}
    const roll=Math.floor(Math.random()*100)+1,r=classificarD100_(aj.valor,roll);
    const mult=resultadoNegociacaoLocal_(r.grau,tipo);
    mercadoLocalNegociacao_[char.id]=mercadoLocalNegociacao_[char.id]||{};
    mercadoLocalNegociacao_[char.id][tipo]={mult,grau:r.grau,roll,valor:aj.valor,pericia:getNome(p)};
    somDado_();renderizarMercadoLocal_();
    notificar_(`${getNome(p)}: ${roll}/${aj.valor} → ${r.grau}.`,'info');
};

function normalizarChaveServico_(t){return normalizarTextoCombate_(t||'').replace(/\s+/g,'_');}
function periciasNPCMap_(npc){
    const out={};
    String(npc?.periciasTexto||'').split('|').forEach(par=>{
        const [k,v]=par.split(':');
        if(k&&v!==undefined)out[normalizarChaveServico_(k)]=Number(v)||0;
    });
    String(npc?.especializacoesTexto||'').split('|').forEach(par=>{
        const [k,v]=par.split(':');
        if(k&&v!==undefined)out[normalizarChaveServico_(k)]=Math.max(out[normalizarChaveServico_(k)]||0,Number(v)||0);
    });
    return out;
}
function valorPrestadorServico_(prestador,tipo){
    const p=periciasNPCMap_(prestador);
    const candidatos = tipo==='reparo'
      ? ['mecanica','engenharia','tecnologia','reparos','manutencao']
      : tipo==='cura'
        ? ['medicina','medicine','cirurgia','primeiros_socorros']
        : ['primeiros_socorros','first_aid','medicina'];
    return candidatos.reduce((m,k)=>Math.max(m,Number(p[k]||0)),0);
}
function bonusPrestadorServico_(prestador,tipo){
    const valor=valorPrestadorServico_(prestador,tipo);
    // O prestador profissional pode tentar repetidas vezes; a perícia mede eficiência, não chance final.
    const reducaoTempo=Math.min(.50,Math.max(0,valor/200)); // 80 => 40% mais rápido
    const bonusRecuperacao=Math.max(0,Math.floor(valor/30)); // 60 => +2 no próximo ciclo de recuperação
    return {valor,reducaoTempo,bonusRecuperacao};
}
function prestadoresPublicados_(tipo){
    return (mercadoLocalConfig_.prestadores||[]).filter(p=>{
        const v=valorPrestadorServico_(p,tipo);
        return v>0 || (p.servicos||[]).includes(tipo);
    });
}
function optionsPrestadores_(tipo,selecionado=''){
    const ps=prestadoresPublicados_(tipo);
    return ps.map(p=>`<option value="${escaparBanco_(p.id)}" ${String(p.id)===String(selecionado)?'selected':''}>${escaparHtmlInventario_(p.nome)} · ${valorPrestadorServico_(p,tipo)||'profissional'}</option>`).join('');
}
function prestadorPublicadoPorId_(id){return (mercadoLocalConfig_.prestadores||[]).find(p=>String(p.id)===String(id));}
function precoServico_(tipo){
    return Math.max(0,Number(mercadoLocalConfig_?.precosServicos?.[tipo]||0));
}
function locaisFeridosServico_(char){
    const maxs=pvMaxLocais_(char);
    return Object.entries(maxs).map(([loc,max])=>({
        loc,max,atual:Number(char?.combate?.hitLocations?.[loc]??max)
    })).filter(x=>x.atual<x.max);
}
function itensReparaveisServico_(char){
    return percorrerInventarioItens_(char).filter(r=>{
        const banco=itensDB.find(x=>String(x.id)===String(r.item.idBanco||r.item.id))||r.item;
        const max=Number(banco.pv??r.item.pv??0),atual=Number(r.item.pvAtual??max);
        return reparavel_(r.item)&&atual<max;
    });
}
function selectPrestadorHtml_(tipo,idSelect){
    const opts=optionsPrestadores_(tipo);
    return `<select id="${idSelect}" style="min-width:220px;">${opts||'<option value="">Nenhum prestador disponível</option>'}</select>`;
}
function renderizarServicosMercadoLocal_(char){
    const el=document.getElementById('marketLocalServices');if(!el)return;
    const servicos=mercadoLocalConfig_.servicos||[];
    if(!servicos.length){el.innerHTML='';return;}
    if(!char){el.innerHTML='<div class="form-section"><h3>🧰 Serviços disponíveis</h3><p style="color:#aaa;">Selecione um personagem para usar serviços.</p></div>';return;}

    const blocos=[];
    if(servicos.includes('reparo')){
        const itens=itensReparaveisServico_(char);
        const prest=prestadoresPublicados_('reparo');
        blocos.push(`<div style="padding:14px;border:1px solid rgba(255,209,102,.25);border-radius:12px;background:rgba(255,209,102,.04);">
          <h4 style="margin:0 0 8px;">🛠️ Oficina</h4>
          <small style="color:#aaa;">Escolha um item danificado do inventário e quem fará o serviço. A perícia do prestador reduz o prazo.</small>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <select id="serviceRepairItem" style="min-width:240px;">${itens.map(r=>{
                const banco=itensDB.find(x=>String(x.id)===String(r.item.idBanco||r.item.id))||r.item;
                const max=Number(banco.pv??r.item.pv??0),atual=Number(r.item.pvAtual??max);
                return `<option value="${r.comp}|${r.index}">${escaparHtmlInventario_(getNome(r.item))} · PV ${atual}/${max}</option>`;
            }).join('')||'<option value="">Nenhum item danificado</option>'}</select>
            ${selectPrestadorHtml_('reparo','serviceRepairProvider')}
            <button class="btn-small btn-select" ${(!itens.length||!prest.length)?'disabled':''} onclick="contratarReparoLocal_()">Contratar · ${precoServico_('reparo')} rec.</button>
          </div>
        </div>`);
    }

    if(servicos.includes('cura')){
        const locais=locaisFeridosServico_(char),prest=prestadoresPublicados_('cura');
        blocos.push(`<div style="padding:14px;border:1px solid rgba(72,202,228,.25);border-radius:12px;background:rgba(72,202,228,.04);">
          <h4 style="margin:0 0 8px;">🏥 Tratamento médico</h4>
          <small style="color:#aaa;">Escolha a parte do corpo e o profissional. O tratamento habilita ferimentos graves para recuperação e melhora o próximo ciclo de cura natural.</small>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <select id="serviceMedicalLocation" style="min-width:230px;">${locais.map(x=>`<option value="${escaparBanco_(x.loc)}">${escaparHtmlInventario_(x.loc)} · PV ${x.atual}/${x.max}</option>`).join('')||'<option value="">Nenhuma localização ferida</option>'}</select>
            ${selectPrestadorHtml_('cura','serviceMedicalProvider')}
            <button class="btn-small btn-select" ${(!locais.length||!prest.length)?'disabled':''} onclick="contratarTratamentoLocal_('cura')">Tratar · ${precoServico_('cura')} rec.</button>
          </div>
        </div>`);
    }

    if(servicos.includes('primeiros_socorros')){
        const locais=locaisFeridosServico_(char),prest=prestadoresPublicados_('primeiros_socorros');
        blocos.push(`<div style="padding:14px;border:1px solid rgba(128,255,176,.22);border-radius:12px;background:rgba(128,255,176,.035);">
          <h4 style="margin:0 0 8px;">🩹 Primeiros Socorros profissional</h4>
          <small style="color:#aaa;">Atendimento rápido. O prestador é considerado capaz de repetir a tentativa até obter sucesso; sua perícia melhora a eficiência.</small>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <select id="serviceFirstAidLocation" style="min-width:230px;">${locais.map(x=>`<option value="${escaparBanco_(x.loc)}">${escaparHtmlInventario_(x.loc)} · PV ${x.atual}/${x.max}</option>`).join('')||'<option value="">Nenhuma localização ferida</option>'}</select>
            ${selectPrestadorHtml_('primeiros_socorros','serviceFirstAidProvider')}
            <button class="btn-small btn-select" ${(!locais.length||!prest.length)?'disabled':''} onclick="contratarTratamentoLocal_('primeiros_socorros')">Atender · ${precoServico_('primeiros_socorros')} rec.</button>
          </div>
        </div>`);
    }

    el.innerHTML=`<div class="form-section" style="margin-top:18px;"><h3 style="margin-top:0;">🧰 Serviços disponíveis</h3>
      <div style="display:grid;gap:12px;">${blocos.join('')}</div></div>`;
}
window.contratarReparoLocal_=async()=>{
    const char=obterPersonagemAtual_();if(!char)return;
    const token=document.getElementById('serviceRepairItem')?.value||'',pid=document.getElementById('serviceRepairProvider')?.value||'';
    if(!token||!pid)return;
    const [comp,ixTxt]=token.split('|'),index=Number(ixTxt),prest=prestadorPublicadoPorId_(pid);
    const inv=normalizarInventario_(char),item=inv?.[comp]?.[index];if(!item||!prest)return;
    const custo=precoServico_('reparo');
    if(Number(char.recursos||0)<custo){notificar_('Recursos insuficientes.','aviso');return;}
    const base=rolarPrazoReparo_(item),b=bonusPrestadorServico_(prest,'reparo');
    const horas=Math.max(1,Math.ceil(base.horas*(1-b.reducaoTempo)));
    const dias=Math.max(1,Math.ceil(horas/24)),entrega=obterDiaCampanha_()+dias-1;
    if(!confirm(`${prest.nome} reparará ${getNome(item)} por ${custo} recursos.\nPrazo base ${base.horas} h; perícia ${b.valor} reduz para ${horas} h.\nEntrega no dia ${entrega}.`))return;
    char.recursos=Number(char.recursos||0)-custo;
    const reps=estadoReparos_(char);
    reps.push({id:`rep_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,item:{...item},origemComp:comp,origemIndex:index,iniciadoDia:obterDiaCampanha_(),entregaDia:entrega,horas,horasBase:base.horas,custo,local:true,prestadorId:prest.id,prestadorNome:prest.nome,periciaPrestador:b.valor});
    inv[comp][index]=null;char.inventario=inv;
    await setDoc(doc(db,'personagens',char.id),{inventario:inv,reparosPendentes:reps,recursos:char.recursos},{merge:true});
    renderizarInventario(char);renderizarMercadoLocal_();renderizarVendaMercado_();notificar_('Item enviado à oficina.','info');
};
window.contratarTratamentoLocal_=async(tipo)=>{
    const char=obterPersonagemAtual_();if(!char)return;
    const locId=tipo==='cura'?'serviceMedicalLocation':'serviceFirstAidLocation';
    const provId=tipo==='cura'?'serviceMedicalProvider':'serviceFirstAidProvider';
    const loc=document.getElementById(locId)?.value||'',pid=document.getElementById(provId)?.value||'';
    const prest=prestadorPublicadoPorId_(pid);if(!loc||!prest)return;
    const custo=precoServico_(tipo);
    if(Number(char.recursos||0)<custo){notificar_('Recursos insuficientes.','aviso');return;}
    const b=bonusPrestadorServico_(prest,tipo),maxs=pvMaxLocais_(char),max=maxs[loc];
    char.combate=char.combate||{};char.combate.hitLocations=char.combate.hitLocations||{};
    char.combate.curaNatural=char.combate.curaNatural||{};
    char.combate.curaNatural[loc]=char.combate.curaNatural[loc]||{};
    const atual=Number(char.combate.hitLocations[loc]??max);

    // Serviço profissional é tratado como sucesso eventual. A perícia mede qualidade/eficiência.
    if(tipo==='primeiros_socorros'){
        const cura=Math.max(1,Math.min(3,1+Math.floor(b.valor/50)));
        if(atual>-max)char.combate.hitLocations[loc]=Math.min(max,atual+cura);
        if(atual<=-max)char.combate.curaNatural[loc].graveTratado=true;
    }else{
        char.combate.curaNatural[loc].graveTratado=true;
        char.combate.curaNatural[loc].bonusProximaRecuperacao=Math.max(char.combate.curaNatural[loc].bonusProximaRecuperacao||0,b.bonusRecuperacao);
        char.combate.curaNatural[loc].prestador=prest.nome;
    }
    char.recursos=Number(char.recursos||0)-custo;
    await setDoc(doc(db,'personagens',char.id),{combate:char.combate,recursos:char.recursos},{merge:true});
    renderizarCombate(char);renderizarInventario(char);renderizarMercadoLocal_();
    notificar_(`${prest.nome}: atendimento concluído em ${loc}.`,'info');
};


function npcsVisiveisCenarioAtivo_(){
    const c=(cenariosDB||[]).find(x=>String(x.id)===String(estadoCampanhaMestre?.cenarioId));
    if(!c)return [];
    return (c.personagensCena||[])
      .filter(v=>v.visivel && String(v.id).startsWith('npcdb:'))
      .map(v=>npcBancoPorId_(String(v.id).slice(6)))
      .filter(Boolean);
}
function prestadorSeguroNPC_(n,servicos=[]){
    return {id:n.id,nome:n.nome||'NPC',imagem:n.imagem||'',tipo:n.tipo||'NPC',
      periciasTexto:n.periciasTexto||'',especializacoesTexto:n.especializacoesTexto||'',servicos};
}

function pdmsDisponiveisMercado_(){
    // PMs são personagens controlados pelo mestre. No texto da interface usamos PDM,
    // nomenclatura preferida para personagens do mestre.
    return (userCharacters||[])
      .filter(c=>c && c.dono===currentUserUid && String(c.tipo||'pc').toLowerCase()!=='monstro')
      .sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
}
function textoPericiasPrestadorPDM_(c,ehEspecializacao=false){
    const banco=ehEspecializacao?especializacoesDB:periciasDB;
    return (banco||[]).map(p=>{
        const v=obterValorRegistroPericia_(c,p.id,ehEspecializacao);
        return v>0?`${p.nome||p.id}:${Math.round(v)}`:'';
    }).filter(Boolean).join('|');
}
function prestadorSeguroPDM_(c,servicos=[]){
    return {
      id:`pdm:${c.id}`,personagemId:c.id,nome:c.nome||'PDM',imagem:c.imagem||'',
      tipo:'PDM',periciasTexto:textoPericiasPrestadorPDM_(c,false),
      especializacoesTexto:textoPericiasPrestadorPDM_(c,true),servicos
    };
}

window.salvarMercadoLocalMestre_=async()=>{
    if(!(userData&&userData.role==='mestre'))return;
    const ativos=[...document.querySelectorAll('.market-local-item-check:checked')].map(x=>x.value);
    const servicos=[...document.querySelectorAll('.market-local-service-check:checked')].map(x=>x.value);
    const prestadorIds=[...document.querySelectorAll('.market-local-provider-check:checked')].map(x=>x.value);
    let prestadores=prestadorIds.map(id=>{
        if(String(id).startsWith('pdm:')){
            const cid=String(id).slice(4);
            const c=pdmsDisponiveisMercado_().find(x=>String(x.id)===cid);
            return c?prestadorSeguroPDM_(c,servicos):null;
        }
        const n=npcsDB.find(x=>String(x.id)===String(id));
        return n?prestadorSeguroNPC_(n,servicos):null;
    }).filter(Boolean);
    const vincularNPCsCenario=!!document.getElementById('marketLocalLinkScenarioNPCs')?.checked;
    if(vincularNPCsCenario){
        for(const n of npcsVisiveisCenarioAtivo_()){
            if(!prestadores.some(p=>String(p.id)===String(n.id)))prestadores.push(prestadorSeguroNPC_(n,servicos));
        }
    }
    const estabelecimentoNome=document.getElementById('marketLocalEstablishmentName')?.value?.trim()||'';
    const estabelecimentoTipo=document.getElementById('marketLocalEstablishmentType')?.value?.trim()||'';
    const precosServicos={
      reparo:Math.max(0,Number(document.getElementById('marketLocalPriceRepair')?.value)||0),
      cura:Math.max(0,Number(document.getElementById('marketLocalPriceHeal')?.value)||0),
      primeiros_socorros:Math.max(0,Number(document.getElementById('marketLocalPriceFirstAid')?.value)||0)
    };
    const cenarioId=estadoCampanhaMestre?.cenarioId||'';
    const cenario=(cenariosDB||[]).find(x=>x.id===cenarioId);
    const dados={cenarioId,cenarioNome:cenario?.nome||estadoCampanhaMestre?.cenario||'',estabelecimentoNome,estabelecimentoTipo,itens:ativos,servicos,prestadores,vincularNPCsCenario,precosServicos,atualizadoEm:new Date().toISOString()};
    await setDoc(doc(db,'configuracoes','mercadoLocal'),dados,{merge:false});
    mercadoLocalConfig_=dados;notificar_('Mercado local publicado para o cenário ativo.','info');renderizarMercadoLocal_();
};

window.renderizarMercadoLocal_=()=>{
    const grid=document.getElementById('marketLocalGrid'),header=document.getElementById('marketLocalHeader'),
      neg=document.getElementById('marketLocalNegotiation'),gm=document.getElementById('marketLocalMasterControls');
    if(!grid||!header||!neg||!gm)return;
    const char=obterPersonagemAtual_();
    const ids=new Set((mercadoLocalConfig_?.itens||[]).map(String));
    const nomeEst=mercadoLocalConfig_?.estabelecimentoNome||mercadoLocalConfig_?.cenarioNome||'Nenhum estabelecimento publicado';
    const tipoEst=mercadoLocalConfig_?.estabelecimentoTipo||'Mercado local';
    header.innerHTML=`<strong>🏪 ${escaparHtmlInventario_(nomeEst)}</strong> <span style="color:#aaa;">· ${escaparHtmlInventario_(tipoEst)}</span><br>
      <small>📍 Cenário: ${escaparHtmlInventario_(mercadoLocalConfig_?.cenarioNome||'—')} · Preço comum local: 90% do mercado geral.</small>
      ${reparosPendentesHtml_(char)}`;

    if(userData?.role==='mestre'){
        gm.classList.remove('hidden');
        const ativo=estadoCampanhaMestre?.cenarioId||'';
        gm.innerHTML=`<strong style="color:#ffd166;">Controle do mestre</strong>
          <div style="color:#aaa;margin:5px 0 10px;">Cenário ativo: ${escaparHtmlInventario_((cenariosDB||[]).find(x=>x.id===ativo)?.nome||ativo||'Nenhum')}. Marque apenas o que existe neste local.</div>
          <div style="max-height:220px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:5px;">
          ${[...itensDB].sort((a,b)=>getNome(a).localeCompare(getNome(b))).map(i=>`<label style="padding:6px 8px;background:rgba(255,255,255,.035);border-radius:6px;"><input class="market-local-item-check" type="checkbox" value="${escaparBanco_(i.id)}" ${ids.has(String(i.id))?'checked':''}> ${escaparBanco_(getNome(i))}</label>`).join('')}</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:12px 0;">
            <label>Nome do estabelecimento<input id="marketLocalEstablishmentName" value="${escaparBanco_(mercadoLocalConfig_.estabelecimentoNome||'')}" placeholder="Ex.: Hospital São Lázaro"></label>
            <label>Tipo<input id="marketLocalEstablishmentType" value="${escaparBanco_(mercadoLocalConfig_.estabelecimentoTipo||'')}" placeholder="Bar, hospital, oficina..."></label>
          </div>
          <div style="margin-top:10px;"><strong>Serviços disponíveis:</strong><br>
            <label style="margin-right:12px;"><input class="market-local-service-check" type="checkbox" value="reparo" ${(mercadoLocalConfig_.servicos||[]).includes('reparo')?'checked':''}> 🛠️ Oficina</label>
            <label style="margin-right:12px;"><input class="market-local-service-check" type="checkbox" value="cura" ${(mercadoLocalConfig_.servicos||[]).includes('cura')?'checked':''}> 🏥 Cura</label>
            <label><input class="market-local-service-check" type="checkbox" value="primeiros_socorros" ${(mercadoLocalConfig_.servicos||[]).includes('primeiros_socorros')?'checked':''}> 🩹 Primeiros Socorros</label>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-top:10px;">
            <label>Preço oficina<input id="marketLocalPriceRepair" type="number" min="0" value="${Number(mercadoLocalConfig_?.precosServicos?.reparo||0)}"></label>
            <label>Preço tratamento<input id="marketLocalPriceHeal" type="number" min="0" value="${Number(mercadoLocalConfig_?.precosServicos?.cura||0)}"></label>
            <label>Preço primeiros socorros<input id="marketLocalPriceFirstAid" type="number" min="0" value="${Number(mercadoLocalConfig_?.precosServicos?.primeiros_socorros||0)}"></label>
          </div>
          <label style="display:block;margin-top:12px;padding:8px;border-radius:8px;background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.18);">
            <input id="marketLocalLinkScenarioNPCs" type="checkbox" ${mercadoLocalConfig_?.vincularNPCsCenario?'checked':''}>
            🪐 Vincular aos NPCs visíveis do cenário ativo
            <small style="display:block;color:#999;margin-left:21px;">Quando marcado, NPCs do banco vinculados e visíveis neste cenário entram automaticamente como prestadores/testadores locais.</small>
          </label>
          <div style="margin-top:12px;"><strong>Prestadores NPC/PDM deste estabelecimento:</strong>
            <div style="margin-top:6px;max-height:180px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:5px;">
              ${[
                ...npcsDB.map(n=>({id:String(n.id),nome:n.nome,tipo:n.tipo||'NPC'})),
                ...pdmsDisponiveisMercado_().map(c=>({id:`pdm:${c.id}`,nome:c.nome,tipo:'PDM'}))
              ].map(n=>`<label style="padding:6px;background:rgba(255,255,255,.035);border-radius:6px;">
                <input class="market-local-provider-check" type="checkbox" value="${escaparBanco_(n.id)}" ${(mercadoLocalConfig_.prestadores||[]).some(p=>String(p.id)===String(n.id))?'checked':''}>
                ${escaparHtmlInventario_(n.nome)} <small style="color:#aaa;">${escaparHtmlInventario_(n.tipo)}</small>
              </label>`).join('')||'<span style="color:#888;">Nenhum NPC/PDM disponível.</span>'}
            </div>
          </div>
          <button class="btn-small btn-select" style="margin-top:10px;" onclick="salvarMercadoLocalMestre_()">💾 Publicar estabelecimento neste cenário</button>`;
    }else gm.classList.add('hidden');

    if(!char){neg.innerHTML='Selecione um personagem para negociar.';grid.innerHTML='';renderizarServicosMercadoLocal_(null);return;}
    const skills=periciasNegociacaoLocal_(char),state=mercadoLocalNegociacao_[char.id]||{};
    const resumo=(tipo)=>{
      const x=state[tipo];return x?`${x.pericia}: ${x.roll}/${x.valor} → ${x.grau} · ×${x.mult.toFixed(2)}`:'padrão ×0,90';
    };
    neg.innerHTML=`<strong>🤝 Negociação</strong>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;">
      <select id="marketLocalSkill">${skills.map(x=>`<option value="${x.p.id}">${escaparHtmlInventario_(getNome(x.p))} (${x.val})</option>`).join('')||'<option value="">Sem perícia disponível</option>'}</select>
      <button class="btn-small btn-select" ${skills.length?'':'disabled'} onclick="rolarNegociacaoMercadoLocal_('compra')">🎲 Negociar compra</button>
      <button class="btn-small" ${skills.length?'':'disabled'} onclick="rolarNegociacaoMercadoLocal_('venda')">🎲 Negociar venda</button>
      </div><small style="display:block;margin-top:7px;color:#aaa;">Compra: ${resumo('compra')} · Venda: ${resumo('venda')}</small>`;

    const compraMult=state.compra?.mult??.90,vendaMult=state.venda?.mult??.90;
    const itens=[...itensDB].filter(i=>ids.has(String(i.id))).sort((a,b)=>rankAcesso_(a)-rankAcesso_(b)||getNome(a).localeCompare(getNome(b)));
    const owned=percorrerInventarioItens_(char);
    const cards=[];
    itens.forEach(item=>{
        const permitido=acessoPermitidoItem_(char,item),preco=precoBaseLocalCompra_(item,compraMult),nome=escaparBanco_(getNome(item));
        const img=item.imagem?`<img src="${escaparBanco_(item.imagem)}" alt="${nome}"${miniAttr_(item)}>`:`<div class="market-card-placeholder">${miniaturaOuCaixa_(item,nome)}</div>`;
        cards.push(`<div class="market-card">${img}<div><h4>${nome}</h4>${badgeAcesso_(item,permitido)}
          <div class="market-meta" style="margin-top:5px;">Comprar localmente: <strong>${preco.toLocaleString('pt-BR')}</strong></div>
          <button class="market-buy" ${permitido?'':'disabled'} onclick="comprarItemMercadoLocal_('${escaparBanco_(item.id)}')">${permitido?'Comprar':'Sem acesso'}</button>
        </div></div>`);
        owned.filter(r=>String(r.item.idBanco||r.item.id)===String(item.id)).forEach(r=>{
            const pv=Number(r.item.pvAtual??r.item.pv??0);
            const venda=precoBaseLocalVenda_(r,vendaMult);
            cards.push(`<div class="market-card">${img}<div><h4>${nome} · seu item</h4>
              <div class="market-meta">PV ${pv}/${Number(item.pv||0)} • venda local <strong>${venda.toLocaleString('pt-BR')}</strong></div>
              <button class="market-buy" ${venda>0?'':'disabled'} onclick="venderItemMercadoLocal_('${r.comp}',${r.index})">Vender aqui</button>

            </div></div>`);
        });
    });
    grid.innerHTML=cards.join('')||'<p style="color:#aaa;">Nenhum item disponível neste mercado local.</p>';
    renderizarServicosMercadoLocal_(char);
};
window.comprarItemMercadoLocal_=async(itemId)=>{
    const char=obterPersonagemAtual_(),item=itensDB.find(i=>i.id===itemId);if(!char||!item)return;
    if(await novaCompraBloqueada_(char))return;
    if(!acessoPermitidoItem_(char,item)){notificar_('Este personagem não possui o nível de acesso necessário.','aviso');return;}
    const state=mercadoLocalNegociacao_[char.id]||{},mult=state.compra?.mult??.90,preco=precoBaseLocalCompra_(item,mult);
    const recursos=Number(char.recursos||0);if(recursos<preco){notificar_('Recursos insuficientes.','aviso');return;}
    const inv=normalizarInventario_(char),dest=(itemEhMochila_(item)&&!temMochilaEquipada_(inv)&&inv.equipado.some(x=>!x))?'equipado':'mochila',slot=inv[dest].findIndex(x=>!x);if(dest==='mochila'&&!temMochilaEquipada_(inv)){notificar_('Equipe uma mochila para liberar os espaços da Mochila.','aviso');return;}if(slot<0){notificar_('Mochila cheia.','aviso');return;}
    inv[dest][slot]={...item,idBanco:item.id,instanciaId:`item_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,pvAtual:Number(item.pv||0),origemAquisicao:'mercado_local',precoPago:preco,adquiridoEm:new Date().toISOString(),...(itemUsaMunicao_(item)?{cargaMax:cargaMaxArma_(item),cargaAtual:0}:{})};
    char.inventario=inv;char.recursos=recursos-preco;delete state.compra;
    await setDoc(doc(db,'personagens',char.id),{inventario:inv,recursos:char.recursos},{merge:true});
    somCaixaRegistradora_();renderizarInventario(char);renderizarMercadoLocal_();renderizarMercado();
};
window.venderItemMercadoLocal_=async(comp,index)=>{
    const char=obterPersonagemAtual_();if(!char)return;const inv=normalizarInventario_(char),item=inv?.[comp]?.[index];if(!item)return;
    const ids=new Set((mercadoLocalConfig_?.itens||[]).map(String));
    if(!ids.has(String(item.idBanco||item.id))){notificar_('Este mercado não negocia esse item.','aviso');return;}
    const state=mercadoLocalNegociacao_[char.id]||{},mult=state.venda?.mult??.90,preco=precoBaseLocalVenda_({item,comp,index},mult);
    if(preco<=0){notificar_('O item não possui valor de revenda.','aviso');return;}
    inv[comp][index]=null;char.inventario=inv;char.recursos=Number(char.recursos||0)+preco;delete state.venda;
    await setDoc(doc(db,'personagens',char.id),{inventario:inv,recursos:char.recursos},{merge:true});
    somCaixaRegistradora_();renderizarInventario(char);renderizarMercadoLocal_();renderizarVendaMercado_();
};

window.renderizarMercado = () => {
    atualizarCompradorMercado_();
    const grid = document.getElementById('marketGrid');
    const notice = document.getElementById('marketNotice');
    const balance = document.getElementById('marketBalance');
    if (!grid || !notice || !balance) return;

    atualizarCategoriasMercado_();
    const char = obterPersonagemAtual_();
    balance.textContent = char ? Number(char.recursos || 0).toLocaleString('pt-BR') : '—';
    notice.textContent = char ? `${char.nome || 'Personagem'} • Recursos disponíveis: ${Number(char.recursos || 0).toLocaleString('pt-BR')}` : 'Selecione um personagem na aba Ficha antes de comprar.';

    const busca = String(document.getElementById('marketSearch')?.value || '').trim().toLowerCase();
    const categoria = String(document.getElementById('marketCategory')?.value || '').trim();
    const filtrados = itensDB.filter(item => {
        if(item?.disponivelCampanha===false) return false;
        const nomes = `${item.nome || ''} ${item.nome_en || ''} ${item.nome_zh || ''}`.toLowerCase();
        return (!busca || nomes.includes(busca)) && (!categoria || chaveCategoriaMercado_(item.categoria) === categoria);
    }).sort((a,b) => rankAcesso_(a)-rankAcesso_(b) || getNome(a).localeCompare(getNome(b)));

    grid.innerHTML = filtrados.map(item => {
        const nome = escaparBanco_(getNome(item));
        const desc = escaparBanco_(getDescricao(item));
        const preco = Math.max(0, Number(item.preco || 0));
        const imagem = item.imagem ? `<img src="${escaparBanco_(item.imagem)}" alt="${nome}"${miniAttr_(item)}>` : `<div class="market-card-placeholder">${miniaturaOuCaixa_(item,nome)}</div>`;
        const detalhes = [item.categoria || '', item.peso != null ? `${item.peso} kg` : '', item.pa != null ? `PA ${item.pa}` : '', item.pv != null ? `PV ${item.pv}` : '', item.dano ? `Dano ${item.dano}` : '', categoriaNormalizada_(item)==='armas' ? `Pen. ${Number(item.penetracao ?? obterPenetracaoArma_(item) ?? 0)}` : '', item.nivelAcesso ? `Acesso ${item.nivelAcesso}` : ''].filter(Boolean).join(' • ');
        const ehArma = categoriaNormalizada_(item) === 'armas';
        const permitido=char?acessoPermitidoItem_(char,item):false;
        const qualidade = ehArma ? `<label style="display:block;margin:8px 0 4px;color:#aaa;font-size:.88em;">Qualidade</label><select id="marketQuality_${escaparBanco_(item.id)}" onchange="atualizarPrecoQualidadeMercado_('${escaparBanco_(item.id)}')" style="width:100%;padding:7px;border-radius:7px;background:rgba(255,255,255,.10);color:white;border:1px solid rgba(255,255,255,.18);"><option value="Básica">Básica ×1</option><option value="Média">Média ×2</option><option value="Superior">Superior ×4</option></select>` : '';
        return `<div class="market-card">${imagem}<div><h4>${nome}</h4>${badgeAcesso_(item,char?permitido:true)}<div class="market-meta" style="margin-top:5px;">${escaparBanco_(detalhes)}</div>${desc ? `<div class="market-desc">${desc}</div>` : ''}${qualidade}<div style="margin-top:8px;"><strong id="marketPrice_${escaparBanco_(item.id)}">${preco.toLocaleString('pt-BR')}</strong></div><button class="market-buy" ${permitido?'':'disabled'} onclick="comprarItemMercado('${escaparBanco_(item.id)}')">${!char?'Selecione um personagem':permitido?'Comprar':'Sem acesso'}</button></div></div>`;
    }).join('') || '<p style="color:#aaa;">Nenhum item encontrado.</p>';
};

window.atualizarPrecoQualidadeMercado_ = (itemId) => {
    const item = itensDB.find(i=>i.id===itemId); if(!item) return;
    const sel = document.getElementById(`marketQuality_${itemId}`);
    const out = document.getElementById(`marketPrice_${itemId}`);
    if(!out) return;
    const q = sel?.value || 'Básica';
    out.textContent = precoComQualidade_(item,q).toLocaleString('pt-BR');
};

window.comprarItemMercado = async (itemId) => {
    const char = obterPersonagemAtual_();
    if (!char) { alert('Selecione um personagem antes de comprar.'); return; }
    if(await novaCompraBloqueada_(char))return;
    const itemBanco = itensDB.find(i => i.id === itemId);
    if (!itemBanco) { alert('Item não encontrado no banco.'); return; }
    if(!acessoPermitidoItem_(char,itemBanco)){
        notificar_(`Acesso ${nivelAcessoNormalizado_(itemBanco)} não permitido para a origem/profissão deste personagem.`,'aviso');
        return;
    }
    const ehArma = categoriaNormalizada_(itemBanco) === 'armas';
    const qualidade = ehArma ? normalizarQualidade_(document.getElementById(`marketQuality_${itemId}`)?.value || 'Básica') : '';
    const preco = ehArma ? precoComQualidade_(itemBanco, qualidade) : Math.max(0, Number(itemBanco.preco || 0));
    const recursos = Math.max(0, Number(char.recursos || 0));
    if (recursos < preco) { alert(`Recursos insuficientes. Preço: ${preco} | Disponível: ${recursos}`); return; }

    let destino = String(document.getElementById('marketDestination')?.value || 'mochila');
    const inv = normalizarInventario_(char);
    if (!Array.isArray(inv[destino])) { alert('Destino de inventário inválido.'); return; }
    // v192: mochila comprada sem nenhuma equipada já vai equipada; sem mochila equipada, a aba Mochila está trancada
    if (itemEhMochila_(itemBanco) && !temMochilaEquipada_(inv) && inv.equipado.some(x => !x)) destino = 'equipado';
    else if (destino === 'mochila' && !temMochilaEquipada_(inv)) { alert('Equipe uma mochila para liberar os espaços da Mochila. Compre uma mochila ou escolha outro destino.'); return; }
    const slot = inv[destino].findIndex(x => !x);
    if (slot < 0) { alert('Não há espaço livre nesse compartimento.'); return; }

    const pesoNovo = pesoItem_(itemBanco);
    const limiteDestino = limitePesoCompartimento_(char, destino);
    if (Number.isFinite(limiteDestino) && pesoCompartimento_(inv, destino) + pesoNovo > limiteDestino + 1e-9) {
        alert(`A compra excederia a capacidade de peso do compartimento: ${(pesoCompartimento_(inv, destino) + pesoNovo).toFixed(1)} kg / ${limiteDestino.toFixed(1)} kg.`);
        return;
    }

    inv[destino][slot] = {
        ...itemBanco,
        idBanco: itemBanco.id,
        instanciaId: `item_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        pvAtual: Number(itemBanco.pv || 0),
        origemAquisicao: 'compra',
        precoPago: preco,
        adquiridoEm: new Date().toISOString(),
        ...(ehArma ? { qualidade } : {}),
        ...(itemUsaMunicao_(itemBanco) ? { cargaMax: cargaMaxArma_(itemBanco), cargaAtual: 0 } : {})
    };
    char.inventario = inv;
    char.recursos = recursos - preco;
    await setDoc(doc(db, 'personagens', currentCharId), { inventario: inv, recursos: char.recursos }, { merge: true });
    await registrarEventoMestreNoPersonagem_(
        char,
        'Mercado',
        `${getNome(itemBanco)} comprado por ${preco}`,
        {subtipo:'compra',itemId:itemBanco.id,preco,qualidade,destino,recursosRestantes:char.recursos}
    );
    somCaixaRegistradora_();
    renderizarInventario(char);
    const recursosInput = document.getElementById('editRecursos');
    if (recursosInput) recursosInput.value = char.recursos;
    renderizarMercado();
    notificar_(`${getNome(itemBanco)}${ehArma ? ` (${qualidade})` : ''} comprado por ${preco}.`,'info',2600);
};

