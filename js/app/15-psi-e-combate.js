// ============================================================
// V46.45 — PSI REESTRUTURADO + OFICINA DE MAPAS
// ============================================================
function labMargemSucesso_(valor,roll){return Math.max(0,Number(valor||0)-Number(roll||0));}
function labPsiFaixaMargem_(m){m=Math.max(0,Number(m||0));return m>=15?3:m>=10?2:m>=5?1:0;}
function labPsiGrauValor_(g){return {'Fiasco':0,'Falha':1,'Sucesso':2,'Crítico':3}[g]??0;}
function labPsiIdNome_(p){return normalizarTextoCombate_(`${p?.id||''} ${getNome(p)||''}`);}
function labPsiEhInformacional_(p){return ['detectar_psi','empatia','localizar_psi','psicometria','visao_distante','ler_mente'].includes(String(p?.id||''));}
function labPsiPericiaPorId_(t,id){const c=labCharToken_(t);if(!c)return null;return (batalhaListaPericias_(c)||[]).find(p=>String(p.id)===String(id)||normalizarTextoCombate_(getNome(p)||'')===normalizarTextoCombate_(id))||null;}
function labPsiValorResistencia_(t,id){const p=labPsiPericiaPorId_(t,id);return p?labValorTeste_(t,p):0;}
function labPsiConsumirAcao_(t){if(Number(t?.acoesAtuaisLab||0)<=0)return false;t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);return true;}
function labPsiRestituirAcao_(t,q=1){if(!t)return;t.acoesAtuaisLab=Math.min(Number(t.acoesMaxLab||0)+8,Number(t.acoesAtuaisLab||0)+Math.max(0,Number(q||0)));}
function labPsiCriticoAtivo_(t,r){if(r?.grau==='Crítico')labPsiRestituirAcao_(t,1);}
function labPsiMensagemMestre_(ator,poder,margem,texto=''){
    labEstado_.psiMensagensMestreLab=Array.isArray(labEstado_.psiMensagensMestreLab)?labEstado_.psiMensagensMestreLab:[];
    labEstado_.psiMensagensMestreLab.unshift({id:`psi-msg:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,atorId:String(ator.id),atorNome:ator.nome,poderId:String(poder.id),poderNome:getNome(poder),margem:Number(margem||0),texto:String(texto||''),respondida:false,ts:new Date().toISOString()});
    labEstado_.psiMensagensMestreLab=labEstado_.psiMensagensMestreLab.slice(0,40);
}
window.labPsiResponderMestre_=function(id){
    if(!batalhaEhMestre_())return;const m=(labEstado_.psiMensagensMestreLab||[]).find(x=>String(x.id)===String(id));if(!m)return;
    const ta=document.getElementById(`psiReply_${CSS.escape(String(id))}`),txt=String(ta?.value||'').trim();if(!txt)return;
    const t=labTokenPorId_(m.atorId);if(t){labRegistrarResultadoProprio_(t,`🔮 ${m.poderNome}: ${txt}`);t.ultimoResultadoRecebidoLab=txt;t.ultimoResultadoRecebidoTsLab=Date.now();}
    m.respondida=true;m.resposta=txt;m.respondidaEm=new Date().toISOString();labSalvarLocal_();labRender_();labRenderPsiInboxMestre_();
};
function labRenderPsiInboxMestre_(){
    if(labReducing_)return;
    const e=document.getElementById('gmPsiInbox');if(!e||!batalhaEhMestre_())return;
    const ms=(labEstado_.psiMensagensMestreLab||[]).filter(x=>!x.respondida).slice(0,12);
    e.innerHTML=ms.length?`<h4 style="color:#d8b4ff;margin:0 0 8px">🔮 Pedidos Psi ao mestre</h4>${ms.map(m=>`<div style="padding:9px;margin:7px 0;border-radius:9px;border:1px solid rgba(216,180,255,.28);background:rgba(50,22,78,.28)"><b>${escaparHtmlInventario_(m.atorNome)}</b> · ${escaparHtmlInventario_(m.poderNome)} · margem <b>${Number(m.margem||0)}</b><div style="font-size:.82em;color:#cbb9dd;margin:3px 0 7px">${escaparHtmlInventario_(m.texto||'Interprete o resultado e responda ao jogador.')}</div><textarea id="psiReply_${escaparHtmlInventario_(m.id)}" rows="2" placeholder="Resposta privada ao jogador..." style="width:100%;margin:0 0 6px"></textarea><button class="btn-small btn-select" onclick="labPsiResponderMestre_('${String(m.id).replace(/'/g,"\\'")}')">Enviar resposta</button></div>`).join('')}`:'<div style="color:#777">Nenhum pedido Psi pendente.</div>';
}

function labPsiResultadoResistido_(ataque,defesa){
    if(defesa.grau==='Crítico')return {atacanteVence:false,criticoDefesa:true,margemLiquida:0};
    if(ataque.grau==='Crítico'&&defesa.grau!=='Crítico')return {atacanteVence:true,criticoDefesa:false,margemLiquida:Math.max(1,ataque.margem)};
    if(!defesa.sucesso)return {atacanteVence:true,criticoDefesa:false,margemLiquida:Math.max(1,ataque.margem)};
    if(!ataque.sucesso)return {atacanteVence:false,criticoDefesa:false,margemLiquida:0};
    const ml=Number(ataque.margem||0)-Number(defesa.margem||0);return {atacanteVence:ml>0,criticoDefesa:false,margemLiquida:Math.max(0,ml)};
}
function labPsiAplicarEfeitoResistido_(atk,alvo,p,margem){
    const id=String(p.id),st=labGarantirSnapshotCombate_(alvo);margem=Math.max(0,Number(margem||0));
    if(id==='amizade'){alvo.amizadePsiLab={autorId:atk.id,margem,ativo:true};return `${alvo.nome} ficou mais receptivo ao usuário.`;}
    if(id==='atordoar_psi'){const perda=1+Math.floor(margem/10);alvo.acoesAtuaisLab=Math.max(0,Number(alvo.acoesAtuaisLab||0)-perda);st.atordoado=true;return `${alvo.nome} perdeu ${perda} AÇ e ficou Atordoado.`;}
    if(id==='grito_psiquico'){const perda=1+Math.floor(margem/10);alvo.acoesAtuaisLab=Math.max(0,Number(alvo.acoesAtuaisLab||0)-perda);st.atordoado=true;return `${alvo.nome} perdeu ${perda} AÇ pelo Grito Psíquico.`;}
    if(id==='medo'){const perda=1+Math.floor(margem/10);alvo.fugaPsiAcoesLab=perda;return `${alvo.nome} deve fugir por ${perda} AÇ.`;}
    if(id==='controlar_mente'){const turnos=1+Math.floor(margem/10);alvo.controlePsiLab={autorId:atk.id,turnos};return `${alvo.nome} fica controlado por ${turnos} turno(s).`;}
    if(id==='influenciar_mente'){alvo.sugestaoPsiLab={autorId:atk.id,margem};return `${alvo.nome} está suscetível a uma sugestão simples.`;}
    if(id==='amnesia'){alvo.amnesiaPsiLab={autorId:atk.id,margem};return `${alvo.nome} sofreu interferência de memória; o mestre define o evento esquecido.`;}
    return `${getNome(p)} venceu a resistência de ${alvo.nome}.`;
}
function labPsiFinalizarResistencia_(pend,defesa){
    const atk=labTokenPorId_(pend.atacanteId),alvo=labTokenPorId_(pend.alvoId),p=(poderesPsiDB||[]).find(x=>String(x.id)===String(pend.poderId));if(!atk||!alvo||!p){labEstado_.psiTestePendenteLab=null;return;}
    const res=labPsiResultadoResistido_({grau:pend.ataqueGrau,sucesso:true,margem:pend.ataqueMargem},defesa);let txt;
    if(res.atacanteVence)txt=labPsiAplicarEfeitoResistido_(atk,alvo,p,res.margemLiquida);
    else txt=`${alvo.nome} resistiu a ${getNome(p)}.`;
    labRegistrarResultadoProprio_(atk,`${getNome(p)}: ${txt}`);
    if(res.criticoDefesa){labRegistrarResultadoProprio_(alvo,`✨ Resistência crítica: você percebeu que ${atk.nome} tentou afetar sua mente com ${getNome(p)}.`);}
    labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`Psi: ${txt}`});labEstado_.psiTestePendenteLab=null;if(Array.isArray(labEstado_.psiTestesFilaLab)&&labEstado_.psiTestesFilaLab.length)labEstado_.psiTestePendenteLab=labEstado_.psiTestesFilaLab.shift();
}
function labPsiSolicitarResistencia_(atk,alvo,p,ataque,skill='forca_vontade'){
    const valor=labPsiValorResistencia_(alvo,skill)||labPsiValorResistencia_(alvo,skill==='percepcao'?'percepção':'força de vontade');
    const dono=String(alvo.donoUid||''),ehPJ=!!dono&&!String(alvo.id).startsWith('dummy:');
    if(ehPJ){const q={id:`psi-test:${Date.now()}:${Math.random().toString(36).slice(2,5)}`,atacanteId:String(atk.id),alvoId:String(alvo.id),alvoUid:dono,poderId:String(p.id),skillId:skill,ataqueGrau:ataque.grau,ataqueMargem:ataque.margem,criadoEm:Date.now()};if(labEstado_.psiTestePendenteLab){labEstado_.psiTestesFilaLab=Array.isArray(labEstado_.psiTestesFilaLab)?labEstado_.psiTestesFilaLab:[];labEstado_.psiTestesFilaLab.push(q);}else labEstado_.psiTestePendenteLab=q;return 'Aguardando resistência secreta do alvo.';}
    const roll=1+Math.floor(Math.random()*100),r=classificarD100_(Math.max(1,valor),roll),def={grau:r.grau,sucesso:r.sucesso,margem:r.sucesso?labMargemSucesso_(valor,roll):0};labPsiFinalizarResistencia_({atacanteId:atk.id,alvoId:alvo.id,poderId:p.id,ataqueGrau:ataque.grau,ataqueMargem:ataque.margem},def);return `Resistência de ${alvo.nome} resolvida secretamente.`;
}
window.labPsiResolverTestePendente_=function(){
    const q=labEstado_.psiTestePendenteLab;if(!q)return;const alvo=labTokenPorId_(q.alvoId);if(!alvo)return;
    if(!batalhaEhMestre_()&&String(q.alvoUid||'')!==String(currentUserUid||currentUser?.uid||''))return;
    const per=labPsiPericiaPorId_(alvo,q.skillId)||labPsiPericiaPorId_(alvo,q.skillId==='percepcao'?'Percepção':'Força de Vontade');if(!per){notificar_('A perícia exigida não foi encontrada. O mestre deve resolver manualmente.','aviso');return;}
    const valor=labValorTeste_(alvo,per),roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll),def={grau:r.grau,sucesso:r.sucesso,margem:r.sucesso?labMargemSucesso_(valor,roll):0};
    // A vítima não recebe seu número nem grau, exceto em crítico, quando identifica a origem.
    if(r.grau==='Crítico')labRegistrarResultadoProprio_(alvo,'✨ Sua resistência foi excepcional; por um instante você percebe a origem da interferência.');
    labPsiFinalizarResistencia_(q,def);labSalvarLocal_();labRender_();
};

const labRenderActionPanelV4645_=labRenderActionPanel_;
labRenderActionPanel_=function(){
    const atual=labTokenAtual_(),el0=document.getElementById('labActionPanel');
    if(atual?.meditacaoBatalhaPsiLab&&!atual.meditacaoBatalhaPsiLab.pronta&&labPodeControlarToken_(atual)){if(el0){el0.style.display='block';el0.innerHTML=`<div><strong style="color:#d8b4ff">🧘 Meditação de Batalha</strong><div style="margin:7px 0;color:#cfc5de">Você não sabe quanto tempo falta. Cada concentração consome 1 AÇ.</div><button class="btn-small btn-select" onclick="labPsiConcentrarMeditacaoBatalha_()" ${Number(atual.acoesAtuaisLab||0)<=0?'disabled':''} style="height:48px;min-width:230px">🧘 Continuar meditando (1 AÇ)</button></div>`;}return;}
    const q=labEstado_.psiTestePendenteLab,alvo=q&&labTokenPorId_(q.alvoId),uid=String(currentUserUid||currentUser?.uid||''),meu=!!q&&!!alvo&&!batalhaEhMestre_()&&String(q.alvoUid||'')===uid;
    if(meu){const el=document.getElementById('labActionPanel');if(!el)return;el.style.display='block';const per=labPsiPericiaPorId_(alvo,q.skillId)||labPsiPericiaPorId_(alvo,q.skillId==='percepcao'?'Percepção':'Força de Vontade');el.innerHTML=`<div><strong style="color:#ffcfef">◈ Uma força exige uma reação sua.</strong><div style="margin-top:8px;color:#cfc5de">Faça o teste indicado. A origem e o resultado ficam ocultos, salvo uma resistência crítica.</div><div style="display:flex;gap:8px;align-items:end;margin-top:9px;flex-wrap:wrap"><label style="margin:0"><small>Perícia obrigatória</small><select disabled style="min-width:260px;margin:3px 0 0"><option>${escaparHtmlInventario_(getNome(per)||q.skillId)}</option></select></label><button class="btn-small btn-select" onclick="labPsiResolverTestePendente_()" style="height:48px;min-width:180px">🎲 Fazer teste</button></div></div>`;return;}
    labRenderActionPanelV4645_();
};
window.labRenderActionPanel_=labRenderActionPanel_;

function labPsiCriarIlusao_(ator,fonte,margem){
    if(!fonte)return null;const isObj=labPsiEhObjeto_(fonte),modelo=isObj?labObjetoModelo_(fonte):null,imagem=fonte.imagem||modelo?.imagem||'';const op=Math.min(.98,.48+Math.max(0,margem)*.016);
    const o={id:`obj:ilusao:${Date.now()}`,nome:`Ilusão de ${fonte.nome||'forma'}`,imagem,modeloId:isObj?fonte.modeloId:'',x:Number(ator.x||0)+1.2,y:Number(ator.y||0),angulo:Number(fonte.angulo||0),larguraM:Number(fonte.larguraM||fonte.diametroM||1),alturaM:Number(fonte.alturaM||fonte.diametroM||1),pesoKg:0,pvMax:0,pvAtual:0,dureza:0,pa:0,destrutivel:true,ilusaoPsiLab:true,qualidadePsiLab:margem,opacidadePsiLab:op,donoUid:ator.donoUid||'',autorPsiId:ator.id};labEstado_.objetosLab.push(o);return o;
}
function labPsiTeletransportarPreparar_(t,gasto,minimo){t.teletransportePsiPendenteLab=Math.max(2,10+Math.max(0,gasto-minimo)*4);t.saltoPsiPendenteLab=t.teletransportePsiPendenteLab;return `Teletransporte preparado: gire a seta e arraste o token até ${t.teletransportePsiPendenteLab} m; o deslocamento será instantâneo.`;}
function labPsiBloqueadoPorCirculo_(ator,alvo){if(!ator||!alvo||String(ator.id)===String(alvo.id))return false;for(const z of (labEstado_.tokens||[])){const r=Number(z.circuloProtecaoPsiLab?.raio||0);if(r<=0)continue;const dentroAlvo=labDistanciaEntre_(z,alvo)<=r+.001,dentroAtor=labDistanciaEntre_(z,ator)<=r+.001;if(dentroAlvo&&!dentroAtor)return true;}return false;}
function labPsiAplicarDireto_(t,p,alvo,gasto,r,margem){
    const id=String(p.id),min=Math.max(0,Number(p.custo||0));
    if(id==='mover_objeto'){if(!labPsiEhObjeto_(alvo))return 'Mover Objeto exige um objeto.';const metros=Math.max(2,Math.min(10,2+(gasto-min)*2));labPsiEmpurrar_(t,alvo,metros);return `${alvo.nome} foi movido ${metros} m.`;}
    if(id==='impulso'){if(labPsiEhObjeto_(alvo))return 'Impulso exige alvo corporal.';labPsiEmpurrar_(t,alvo,5);return `${alvo.nome} foi impulsionado aproximadamente 5 m.`;}
    if(labPsiEhCura_(p)){const st=labGarantirSnapshotCombate_(alvo),loc=t.acaoAuxLab?.local;if(!st||!loc)return 'Escolha uma localização ferida.';const cura=Math.min(gasto,Math.max(0,Number(st.hitMax?.[loc]||0)-Number(st.hit?.[loc]||0)));st.hit[loc]=Number(st.hit?.[loc]||0)+cura;return `${alvo.nome} recuperou ${cura} PV em ${loc}.`;}
    if(id==='fluxo_marcial'){const chave=`${labEstado_.rodada}:${labEstado_.turnoIndex}`;if(t.guerreiroZenUsoChaveLab===chave)return 'Guerreiro Zen já foi tentado nesta oportunidade.';t.guerreiroZenUsoChaveLab=chave;labPsiRestituirAcao_(t,1);const bonus=labPsiFaixaMargem_(margem);if(bonus)labPsiRestituirAcao_(t,bonus);if(r.grau==='Crítico')labPsiRestituirAcao_(t,1);return `Guerreiro Zen: AÇ de ativação recuperada${bonus?` + ${bonus} AÇ pela margem`:''}${r.grau==='Crítico'?' + 1 AÇ pelo crítico':''}.`;}
    if(id==='reflexos'){labPsiRestituirAcao_(t,1);const deg=1+labPsiFaixaMargem_(margem),def=deg*2;t.acoesDefensivasPsiLab=Math.max(Number(t.acoesDefensivasPsiLab||0),def);t.defesasPsiJanelasLab=2;if(r.grau==='Crítico')labPsiRestituirAcao_(t,1);return `Guerreiro Inexpugnável: ${def} AÇ defensivas; válidas nesta oportunidade e na próxima.${r.grau==='Crítico'?' Crítico também recuperou 1 AÇ comum.':''}`;}
    if(id==='ilusao'){const o=labPsiCriarIlusao_(t,alvo,margem);return o?`Ilusão criada com Qualidade ${margem}; transparência visual ${Math.round(o.opacidadePsiLab*100)}%. Manutenção: ${Math.max(2,Number(p.custo||2))} PP/turno.`:'Não foi possível criar a ilusão.';}
    if(id==='teletransporte'||id==='salto')return labPsiTeletransportarPreparar_(t,gasto,min);
    if(id==='intuicao_psi'){const bonus=Math.min(20,Math.max(5,gasto*5));t.bonusIntuicaoPendenteLab=bonus;return `Intuição armazenou +${bonus}% para o próximo teste aplicável.`;}
    if(id==='meditacao_batalha'){t.meditacaoBatalhaPsiLab={restantes:1+Math.floor(Math.random()*6),pronta:false};t.acaoAuxLab=null;return 'Você inicia a busca silenciosa pela clareza. O tempo necessário é secreto.';}
    if(id==='mente_acelerada'){const cargas=1+Math.floor(margem/10);t.menteAceleradaCargasLab=(Number(t.menteAceleradaCargasLab||0)+cargas);t.menteAceleradaBonusLab=20;return `Mente Acelerada: ${cargas} carga(s) de +20% em testes baseados em INT.`;}
    if(id==='ocultar_mente'){t.cranioAcoLab={ativo:true,ppPorMinuto:1};return 'Crânio de Aço ativo: assinatura psíquica ocultada enquanto for mantido.';}
    if(id==='defesa_mental'||id==='circulo_protecao'){const raio=Math.max(2.5,gasto*2.5);t.circuloProtecaoPsiLab={raio,duracaoTurnos:Math.max(1,gasto)};return `Círculo de Proteção: raio ${raio.toFixed(1)} m por ${Math.max(1,gasto)} turno(s).`;}
    if(id==='aceleracao'){t.movimentoBonusLab=Math.max(Number(t.movimentoBonusLab||0),30);return 'Aceleração: Movimento 30 nesta rodada.';}
    if(id==='agilidade_psi'){t.agilidadePsiBonusLab=Math.floor(gasto/5)*10;t.agilidadePsiAteRodadaLab=labEstado_.rodada;return `Agilidade Psi: +${t.agilidadePsiBonusLab}% em perícias físicas compatíveis nesta rodada.`;}
    if(id==='evitar_dano'){t.evitarDanoPsiReservaLab=(Number(t.evitarDanoPsiReservaLab||0)+gasto);return `Reserva de Evitar Dano: ${gasto} ponto(s) de dano podem ser absorvidos.`;}
    if(id==='mimetismo_psi'){t.mimetismoPsiLab={fonteId:String(alvo?.id||''),nome:alvo?.nome||'',imagem:alvo?.imagem||labObjetoModelo_(alvo)?.imagem||'',margem};return `Mimetismo Psi: aparência copiada de ${alvo?.nome||'alvo'}.`;}
    if(id==='anoitecer'){t.anoitecerPsiLab={raio:Math.max(3,gasto*3),ppTurno:Math.max(1,Math.ceil(gasto/2))};return `Anoitecer: escuridão psíquica em raio de ${t.anoitecerPsiLab.raio} m.`;}
    if(id==='meditacao_psi')return 'Meditação iniciada fora de combate; após uma hora recupera 1/4 dos PP, uma vez por dia.';
    if(id==='doador_vida')return 'Doador da Vida teve sucesso; o mestre confirma se a morte ocorreu há até 2 minutos e por causa não natural.';
    if(id==='telepatia')return 'Telepatia estabelecida; use a mensagem privada/narrativa para transmitir a informação mental.';
    return `${getNome(p)} ativado com sucesso.`;
}

// Substitui a execução Psi anterior por um motor orientado por efeitos e margem.
labUsarPsiExecutar_=function(){
    const t=labTokenAtual_(),a=t?.acaoAuxLab;if(!t||a?.tipo!=='psiquismo'||Number(t.acoesAtuaisLab||0)<=0)return;
    const p=labPsiPoderes_(t).find(x=>x.id===a.poderId),alvo=labPsiAlvoPorId_(a.alvoId)||t;if(!p||!alvo)return;
    let minimo=p.id==='mover_objeto'&&labPsiEhObjeto_(alvo)?labPsiMoverCustoKg_(p,alvo):Math.max(0,Number(p.custo||0));let gasto=Math.max(minimo,Math.floor(Number(a.custo||minimo)));
    if(labPsiBloqueadoPorCirculo_(t,alvo)){notificar_('Círculo de Proteção bloqueia o efeito psíquico sobre este alvo.','aviso',4200);return;}
    if(p.id==='intuicao_psi')gasto=Math.max(1,Math.min(4,gasto));
    if(gasto>labPsiRestantes_(t)){notificar_(`PP insuficientes. Disponíveis: ${labPsiRestantes_(t)}.`,'aviso');return;}
    if(p.id==='fluxo_marcial'){const chave=`${labEstado_.rodada}:${labEstado_.turnoIndex}`;if(t.guerreiroZenUsoChaveLab===chave){notificar_('Guerreiro Zen só pode ser tentado uma vez por oportunidade.','aviso');return;}}
    const valor=labPsiValor_(t,p),roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll),margem=r.sucesso?labMargemSucesso_(valor,roll):0;
    const semAcao=false;if(!semAcao&&!labPsiConsumirAcao_(t))return;t.psiGastosLab=Math.max(0,Number(t.psiGastosLab||0))+gasto;
    let efeito='';
    if(r.grau==='Fiasco'){if(labPsiRestantes_(t)>0)t.psiGastosLab++;if(!semAcao){if(Number(t.acoesAtuaisLab||0)>0)t.acoesAtuaisLab--;else t.penalidadeAcaoProximaLab=Math.max(1,Number(t.penalidadeAcaoProximaLab||0));}efeito='Falha crítica psíquica: perde 1 PP adicional e sofre a penalidade geral de AÇ.';}
    else if(!r.sucesso)efeito='O poder falhou.';
    else {
        if(r.grau==='Crítico'&&!semAcao&&!['fluxo_marcial','reflexos'].includes(p.id))labPsiRestituirAcao_(t,1);
        const resistidos=['amizade','atordoar_psi','medo','controlar_mente','influenciar_mente','amnesia','banimento_caotico'];
        if(resistidos.includes(p.id))efeito=labPsiSolicitarResistencia_(t,alvo,p,{grau:r.grau,margem},'forca_vontade');
        else if(p.id==='grito_psiquico'){
            const alvos=(labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t.id)&&labDistanciaEntre_(t,x)<=20);for(const x of alvos)labPsiSolicitarResistencia_(t,x,p,{grau:r.grau,margem},'forca_vontade');efeito=`Grito Psíquico lançado em área; ${alvos.length} alvo(s) elegível(is).`;
        }else if(labPsiEhInformacional_(p)){
            const faixa=margem<10?'0–9: direção/impressão geral':margem<20?'10–19: informação aproximada':margem<30?'20–29: informação detalhada':'30+: informação muito precisa';labPsiMensagemMestre_(t,p,margem,`${getNome(p)} obteve margem ${margem}. Referência: ${faixa}. Responda privadamente ao jogador.`);efeito='Sucesso informacional enviado ao mestre para resposta privada.';
        }else efeito=labPsiAplicarDireto_(t,p,alvo,gasto,r,margem);
    }
    const resultado=`Psiquismo: ${getNome(p)} · ${p.esfera} A${Number(p.arco||1)} · ${roll}/${valor} → ${r.grau}${r.sucesso?` · margem ${margem}`:''} · gasto ${gasto} PP. ${efeito}`;
    labRegistrarResultadoProprio_(t,resultado);labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${t.nome}: ${resultado}`});labEstado_.logLab=labEstado_.logLab.slice(0,120);
    if(p.id!=='meditacao_batalha')t.acaoAuxLab={tipo:'psiquismo',poderId:p.id,alvoId:String(alvo.id),custo:Math.max(0,Number(p.custo||0)),local:a.local||''};if(t.acaoAuxLab)t.psiSelecaoLab=JSON.parse(JSON.stringify(t.acaoAuxLab));try{somMagico_();}catch(_){}labSalvarLocal_();labRender_();labRenderPsiInboxMestre_();labAutoAvancarSeSemAcoes_();
};

// Meditação de Batalha: o 1d6 é secreto; cada AÇ gasta em concentração reduz o contador.
window.labPsiConcentrarMeditacaoBatalha_=function(){
    const t=labTokenAtual_();if(!t?.meditacaoBatalhaPsiLab||Number(t.acoesAtuaisLab||0)<=0)return;t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);t.meditacaoBatalhaPsiLab.restantes=Math.max(0,Number(t.meditacaoBatalhaPsiLab.restantes||0)-1);
    if(t.meditacaoBatalhaPsiLab.restantes<=0){t.meditacaoBatalhaPsiLab.pronta=true;t.bonusDificuldadeFacilPsiLab=1;labRegistrarResultadoProprio_(t,'✨ Você encontrou a inspiração que procurava. Seus mentores estão ao seu lado. Vá e triunfe.');}
    else labRegistrarResultadoProprio_(t,'🧘 Você continua buscando o estado de clareza.');labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();
};

// Encerrar oportunidade também envelhece as AÇ defensivas Psi.
const labEncerrarOportunidadeV4645_=window.labEncerrarOportunidade_;
window.labEncerrarOportunidade_=function(){const t=labTokenAtual_();if(t){if(Number(t.defesasPsiJanelasLab||0)>0){t.defesasPsiJanelasLab--;if(t.defesasPsiJanelasLab<=0)t.acoesDefensivasPsiLab=0;}if(t.circuloProtecaoPsiLab?.duracaoTurnos){t.circuloProtecaoPsiLab.duracaoTurnos--;if(t.circuloProtecaoPsiLab.duracaoTurnos<=0)t.circuloProtecaoPsiLab=null;}if(t.anoitecerPsiLab){const c=Math.max(1,Number(t.anoitecerPsiLab.ppTurno||1));if(labPsiRestantes_(t)>=c)t.psiGastosLab+=c;else t.anoitecerPsiLab=null;}const ilus=(labEstado_.objetosLab||[]).filter(o=>o.ilusaoPsiLab&&String(o.autorPsiId)===String(t.id));for(const o of ilus){const c=2;if(labPsiRestantes_(t)>=c)t.psiGastosLab+=c;else labEstado_.objetosLab=labEstado_.objetosLab.filter(x=>String(x.id)!==String(o.id));}}return labEncerrarOportunidadeV4645_();};

// Objetos ilusórios exibem transparência proporcional à qualidade.
const labObjetoHtmlV4645_=window.labObjetoHtml_||labObjetoHtml_;
labObjetoHtml_=function(o,ppm){let h=labObjetoHtmlV4645_(o,ppm);if(o?.ilusaoPsiLab){h=h.replace(/opacity:[^;]+;/,`opacity:${Math.max(.2,Math.min(.99,Number(o.opacidadePsiLab||.65)))};`).replace('title="',`title="Ilusão · Qualidade ${Number(o.qualidadePsiLab||0)} · `);}return h;};window.labObjetoHtml_=labObjetoHtml_;

// ============================================================
// OFICINA DE MAPAS — estado privado/local, sem listener realtime
// ============================================================
let gmOficinaEstado_={larguraM:28,alturaM:14,fundo:'#d7d7d7',corGrade:'#777777',gradeVisivel:true,objetos:[],desenhos:[]};let gmOficinaDesenhando_=false,gmOficinaCorTraco_='#ffcf4d',gmOficinaEspessura_=4,gmOficinaTraçoAtual_=null;
function gmOficinaPersistir_(){try{localStorage.setItem('mesa_estelar_oficina_mapa_v1',JSON.stringify(gmOficinaEstado_));}catch(_){}}
function gmOficinaCarregar_(){try{const x=JSON.parse(localStorage.getItem('mesa_estelar_oficina_mapa_v1')||'null');if(x)gmOficinaEstado_={...gmOficinaEstado_,...x};}catch(_){}}
gmOficinaCarregar_();
function gmOficinaPopularObjetos_(){const s=document.getElementById('gmOficinaObjetoSelect');if(!s)return;const v=s.value;s.innerHTML='<option value="">— objeto do banco —</option>'+[...(objetosMapaDB||[])].sort((a,b)=>getNome(a).localeCompare(getNome(b))).map(o=>`<option value="${escaparHtmlInventario_(o.id)}">${escaparHtmlInventario_(getNome(o))}</option>`).join('');if([...s.options].some(o=>o.value===v))s.value=v;}
window.gmOficinaRender_=function(){
    if(!batalhaEhMestre_())return;gmOficinaPopularObjetos_();const box=document.getElementById('gmOficinaMapa');if(!box)return;const ppm=28,w=gmOficinaEstado_.larguraM*ppm,h=gmOficinaEstado_.alturaM*ppm,g=gmOficinaEstado_.corGrade;
    const draws=`<svg style="position:absolute;inset:0;width:${w}px;height:${h}px;pointer-events:none">${(gmOficinaEstado_.desenhos||[]).map(d=>`<polyline points="${(d.pts||[]).map(p=>`${p.x*ppm},${p.y*ppm}`).join(' ')}" fill="none" stroke="${d.cor||'#ffcf4d'}" stroke-width="${d.esp||4}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
    const objs=(gmOficinaEstado_.objetos||[]).map(o=>{const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(o.modeloId)),img=o.imagem||m?.imagem||'',ow=Math.max(18,Number(o.larguraM||1)*ppm),oh=Math.max(18,Number(o.alturaM||1)*ppm);return `<div data-gm-of-obj="${escaparHtmlInventario_(o.id)}" onpointerdown="gmOficinaArrastarObjeto_(event,'${String(o.id).replace(/'/g,"\\'")}')" style="position:absolute;left:${o.x*ppm-ow/2}px;top:${o.y*ppm-oh/2}px;width:${ow}px;height:${oh}px;cursor:grab;touch-action:none;z-index:4">${img?`<img src="${img}" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none">`:'🧱'}</div>`;}).join('');
    box.innerHTML=`<div id="gmOficinaCanvas" onpointerdown="gmOficinaPointerDown_(event)" style="position:relative;width:${w}px;height:${h}px;background-color:${gmOficinaEstado_.fundo};background-image:linear-gradient(to right,${g} 1px,transparent 1px),linear-gradient(to bottom,${g} 1px,transparent 1px);background-size:${ppm}px ${ppm}px;overflow:hidden;touch-action:none;">${draws}${objs}</div>`;
    const st=document.getElementById('gmOficinaStatus');if(st)st.textContent=`Rascunho privado · ${gmOficinaEstado_.larguraM} × ${gmOficinaEstado_.alturaM} m · ${(gmOficinaEstado_.objetos||[]).length} objetos · ${(gmOficinaEstado_.desenhos||[]).length} traços`;
    const b=document.getElementById('gmOficinaDesenharBtn');if(b)b.classList.toggle('btn-select',gmOficinaDesenhando_);const bg=document.getElementById('gmOficinaFundo'),gr=document.getElementById('gmOficinaGrade');if(bg)bg.value=gmOficinaEstado_.fundo;if(gr)gr.value=gmOficinaEstado_.corGrade;
};
window.gmOficinaNovo_=function(){if(!confirm('Limpar o rascunho privado da Oficina?'))return;gmOficinaEstado_={larguraM:28,alturaM:14,fundo:'#d7d7d7',corGrade:'#777777',gradeVisivel:true,objetos:[],desenhos:[]};gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaTamanho_=function(v){const m=String(v||'').match(/^(\d+)x(\d+)$/);if(!m)return;gmOficinaEstado_.larguraM=Number(m[1]);gmOficinaEstado_.alturaM=Number(m[2]);gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaCor_=function(k,v){gmOficinaEstado_[k]=String(v);gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaAlternarDesenho_=function(){gmOficinaDesenhando_=!gmOficinaDesenhando_;gmOficinaRender_();};
window.gmOficinaAdicionarObjeto_=function(){const id=document.getElementById('gmOficinaObjetoSelect')?.value,m=(objetosMapaDB||[]).find(x=>String(x.id)===String(id));if(!m)return;gmOficinaEstado_.objetos.push({...JSON.parse(JSON.stringify(m)),id:`ofobj:${Date.now()}`,modeloId:m.id,x:gmOficinaEstado_.larguraM/2,y:gmOficinaEstado_.alturaM/2,angulo:0});gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaDesfazer_=function(){gmOficinaEstado_.desenhos.pop();gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaPointerDown_=function(ev){if(!gmOficinaDesenhando_||ev.button===2||ev.target!==ev.currentTarget)return;ev.preventDefault();const el=ev.currentTarget,r=el.getBoundingClientRect(),ppm=28;const pt=e=>({x:Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-r.left)/ppm)),y:Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-r.top)/ppm))});gmOficinaTraçoAtual_={cor:gmOficinaCorTraco_,esp:gmOficinaEspessura_,pts:[pt(ev)]};gmOficinaEstado_.desenhos.push(gmOficinaTraçoAtual_);const mv=e=>{gmOficinaTraçoAtual_.pts.push(pt(e));gmOficinaRender_();};const up=()=>{window.removeEventListener('pointermove',mv);gmOficinaTraçoAtual_=null;gmOficinaPersistir_();gmOficinaRender_();};window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});};
window.gmOficinaArrastarObjeto_=function(ev,id){if(gmOficinaDesenhando_)return;ev.preventDefault();ev.stopPropagation();const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id)),canvas=document.getElementById('gmOficinaCanvas');if(!o||!canvas)return;const r=canvas.getBoundingClientRect(),ppm=28,mv=e=>{o.x=Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-r.left)/ppm));o.y=Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-r.top)/ppm));gmOficinaRender_();},up=()=>{window.removeEventListener('pointermove',mv);gmOficinaPersistir_();gmOficinaRender_();};window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});};
window.gmOficinaSalvarComoMapa_=async function(){if(!batalhaEhMestre_())return;const nome=prompt('Nome do mapa preparado:','');if(nome==null||!String(nome).trim())return;let id=labMapaSlug_(nome),base=id,n=2;while((mapasDB||[]).some(m=>String(m.id)===String(id)))id=`${base}_${n++}`;const dados={id,nome:String(nome).trim(),larguraM:gmOficinaEstado_.larguraM,alturaM:gmOficinaEstado_.alturaM,fundo:gmOficinaEstado_.fundo,corGrade:gmOficinaEstado_.corGrade,gradeVisivel:true,textura:'nenhuma',desenhos:JSON.parse(JSON.stringify(gmOficinaEstado_.desenhos||[])),objetos:JSON.parse(JSON.stringify(gmOficinaEstado_.objetos||[])),criadoPor:currentUserUid||'',atualizadoEm:new Date().toISOString()};try{const salvo=await labMapaSalvarFirestore_(dados,0);mapasDB.push(salvo);labAtualizarSelectMapas_();if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();notificar_(`Mapa “${dados.nome}” salvo na biblioteca.`,'sucesso',3500);}catch(e){console.error(e);notificar_('Não foi possível salvar o mapa preparado.','erro');}};
window.gmOficinaPublicarMesa_=function(){if(!batalhaEhMestre_())return;if(!confirm('Publicar este terreno na Mesa ao Vivo? Participantes serão mantidos.'))return;labEstado_.larguraM=gmOficinaEstado_.larguraM;labEstado_.alturaM=gmOficinaEstado_.alturaM;labEstado_.fundo=gmOficinaEstado_.fundo;labEstado_.corGrade=gmOficinaEstado_.corGrade;labEstado_.gradeVisivel=true;labEstado_.textura='nenhuma';labEstado_.desenhosLab=JSON.parse(JSON.stringify(gmOficinaEstado_.desenhos||[]));labEstado_.objetosLab=JSON.parse(JSON.stringify(gmOficinaEstado_.objetos||[])).map(o=>({...o,id:String(o.id).startsWith('obj:')?o.id:`obj:${Date.now()}:${Math.random().toString(36).slice(2,6)}`}));labSalvarLocal_();labRender_();notificar_('Terreno da Oficina publicado na Mesa ao Vivo.','sucesso',3500);};

// Caixa Psi no Escudo, criada de forma leve ao abrir/renderizar o mestre.
(function(){const camp=document.getElementById('gm-sub-campanha');if(camp&&!document.getElementById('gmPsiInbox')){const d=document.createElement('div');d.id='gmPsiInbox';d.style.cssText='margin-top:14px;padding:12px;border-radius:12px;background:rgba(0,0,0,.16);border:1px solid rgba(216,180,255,.20)';camp.appendChild(d);}})();
setTimeout(()=>{try{gmOficinaRender_();labRenderPsiInboxMestre_();}catch(_){}},500);
function labRenderPsiVisuais_(){
    if(labReducing_)return;const map=document.getElementById('labMetricMap');if(!map)return;map.querySelectorAll('.lab-psi-zone-v4645').forEach(e=>e.remove());const ppm=Number(labEstado_.pxPorMetro||48);for(const t of (labEstado_.tokens||[])){if(t.circuloProtecaoPsiLab?.raio){const r=Number(t.circuloProtecaoPsiLab.raio),d=document.createElement('div');d.className='lab-psi-zone-v4645';d.style.cssText=`position:absolute;left:${(t.x-r)*ppm}px;top:${(t.y-r)*ppm}px;width:${r*2*ppm}px;height:${r*2*ppm}px;border:2px solid rgba(110,180,255,.75);background:rgba(80,120,255,.09);border-radius:50%;pointer-events:none;z-index:2;box-shadow:0 0 18px rgba(110,180,255,.22)`;map.appendChild(d);}if(t.anoitecerPsiLab?.raio){const r=Number(t.anoitecerPsiLab.raio),d=document.createElement('div');d.className='lab-psi-zone-v4645';d.style.cssText=`position:absolute;left:${(t.x-r)*ppm}px;top:${(t.y-r)*ppm}px;width:${r*2*ppm}px;height:${r*2*ppm}px;border:1px solid rgba(160,120,220,.55);background:rgba(5,3,14,.72);border-radius:50%;pointer-events:none;z-index:12`;map.appendChild(d);}if(t.mimetismoPsiLab?.imagem){const n=map.querySelector(`.lab-token[data-id="${CSS.escape(String(t.id))}"] img`);if(n)n.src=t.mimetismoPsiLab.imagem;}}}
const labRenderV4645PsiVisual_=labRender_;window.labRender_=labRender_;



// ============================================================
// V46.47.2 — XP PSI, respostas flutuantes, resistências e Oficina completa
// ============================================================
// Um minuto de manutenção Psi equivale provisoriamente a 10 turnos de combate.
const PSI_TURNOS_POR_MINUTO_=10;

// XP fica sempre visível antes do catálogo Psi; o catálogo é somente leitura.
const renderizarPsiquismoV46451_=renderizarPsiquismo_;
renderizarPsiquismo_=function(char){
    renderizarPsiquismoV46451_(char);
    try{renderizarXpPendente_(char);}catch(_){}
};

// Mensagens Psi informacionais aparecem como janela flutuante ao mestre.
function labPsiModalMestre_(){
    let d=document.getElementById('labPsiModalMestre');
    if(!d){d=document.createElement('div');d.id='labPsiModalMestre';d.style.cssText='display:none;position:fixed;right:22px;bottom:22px;z-index:100000;width:min(520px,calc(100vw - 36px));max-height:72vh;overflow:auto;padding:15px;border:1px solid rgba(216,180,255,.65);border-radius:14px;background:rgba(25,14,45,.97);box-shadow:0 16px 50px rgba(0,0,0,.55);color:white';document.body.appendChild(d);}return d;
}
function labPsiRenderModalMestre_(){
    if(labReducing_)return;
    const d=labPsiModalMestre_();if(!batalhaEhMestre_()){d.style.display='none';return;}
    const m=(labEstado_.psiMensagensMestreLab||[]).find(x=>!x.respondida);
    const q=labEstado_.psiTestePendenteLab,alvo=q&&labTokenPorId_(q.alvoId),npc=q&&alvo&&!q.alvoUid;
    if(npc){
        const per=labPsiPericiaPorId_(alvo,q.skillId)||labPsiPericiaPorId_(alvo,q.skillId==='percepcao'?'Percepção':'Força de Vontade');
        d.style.display='block';d.innerHTML=`<div style="font-size:1.05em;font-weight:800;color:#ffd8ff">🛡️ Resistência exigida</div><div style="margin:7px 0 10px"><b>${escaparHtmlInventario_(alvo.nome)}</b> precisa resistir a um efeito oculto.</div><div style="color:#bbb;margin-bottom:10px">Perícia sugerida: <b>${escaparHtmlInventario_(per?getNome(per):(q.skillId||'Força de Vontade'))}</b>${per?` (${labValorTeste_(alvo,per)}%)`:''}</div><button class="btn-small btn-select" onclick="labPsiResolverNpcPendente_()">🎲 Rolar resistência</button>`;return;
    }
    if(!m){d.style.display='none';d.innerHTML='';return;}
    d.style.display='block';d.innerHTML=`<div style="font-size:1.05em;font-weight:800;color:#d8b4ff">🔮 ${escaparHtmlInventario_(m.poderNome)}</div><div style="margin:6px 0"><b>${escaparHtmlInventario_(m.atorNome)}</b> obteve margem <b>${Number(m.margem||0)}</b>.</div><div style="font-size:.88em;color:#cbb9dd;margin-bottom:9px">${escaparHtmlInventario_(m.texto||'Interprete o resultado e responda ao jogador.')}</div><textarea id="labPsiModalResposta" rows="3" placeholder="Resposta privada ao jogador..." style="width:100%;margin:0 0 8px"></textarea><button class="btn-small btn-select" onclick="labPsiResponderFlutuante_('${String(m.id).replace(/'/g,"\\'")}')">Enviar resposta privada</button>`;
}
window.labPsiResponderFlutuante_=function(id){const ta=document.getElementById('labPsiModalResposta'),txt=String(ta?.value||'').trim();if(!txt)return;const m=(labEstado_.psiMensagensMestreLab||[]).find(x=>String(x.id)===String(id));if(!m)return;const t=labTokenPorId_(m.atorId);if(t){labRegistrarResultadoProprio_(t,`🔮 ${m.poderNome}: ${txt}`);t.ultimoResultadoRecebidoLab=txt;t.ultimoResultadoRecebidoTsLab=Date.now();}m.respondida=true;m.resposta=txt;m.respondidaEm=new Date().toISOString();labSalvarLocal_();labAgendarSyncRemoto_();labRender_();notificar_('Resposta Psi enviada ao jogador.','sucesso',2600);};
window.labPsiResolverNpcPendente_=function(){const q=labEstado_.psiTestePendenteLab,alvo=q&&labTokenPorId_(q.alvoId);if(!q||!alvo||q.alvoUid)return;const per=labPsiPericiaPorId_(alvo,q.skillId)||labPsiPericiaPorId_(alvo,q.skillId==='percepcao'?'Percepção':'Força de Vontade');const valor=Math.max(1,per?labValorTeste_(alvo,per):labPsiValorResistencia_(alvo,q.skillId)||1),roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll),def={grau:r.grau,sucesso:r.sucesso,margem:r.sucesso?labMargemSucesso_(valor,roll):0};labPsiFinalizarResistencia_(q,def);labSalvarLocal_();labRender_();};

// NPCs/PMs não resolvem mais resistências silenciosamente: o mestre recebe a janela flutuante e rola por eles.
labPsiSolicitarResistencia_=function(atk,alvo,p,ataque,skill='forca_vontade'){
    const dono=String(alvo.donoUid||''),ehPJ=!!dono&&!String(alvo.id).startsWith('dummy:');
    const q={id:`psi-test:${Date.now()}:${Math.random().toString(36).slice(2,5)}`,atacanteId:String(atk.id),alvoId:String(alvo.id),alvoUid:ehPJ?dono:'',poderId:String(p.id),skillId:skill,ataqueGrau:ataque.grau,ataqueMargem:ataque.margem,criadoEm:Date.now()};
    if(labEstado_.psiTestePendenteLab){labEstado_.psiTestesFilaLab=Array.isArray(labEstado_.psiTestesFilaLab)?labEstado_.psiTestesFilaLab:[];labEstado_.psiTestesFilaLab.push(q);}else labEstado_.psiTestePendenteLab=q;
    return ehPJ?'Aguardando resistência secreta do alvo.':'Aguardando o mestre rolar a resistência do alvo.';
};

// Crânio de Aço e Mimetismo: manutenção provisória de 1 PP/minuto = 10 turnos.
const labPsiAplicarDiretoV46451_=labPsiAplicarDireto_;
labPsiAplicarDireto_=function(t,p,alvo,gasto,r,margem){
    const id=String(p?.id||'');
    if(id==='ocultar_mente'){t.cranioAcoLab={ativo:true,ppPorMinuto:1,turnosRestantes:PSI_TURNOS_POR_MINUTO_};return 'Crânio de Aço ativo por 1 minuto (10 turnos); renovar custa 1 PP.';}
    if(id==='mimetismo_psi'){t.mimetismoPsiLab={fonteId:String(alvo?.id||''),nome:alvo?.nome||'',imagem:alvo?.imagem||labObjetoModelo_(alvo)?.imagem||'',margem,turnosRestantes:PSI_TURNOS_POR_MINUTO_,ppPorMinuto:1};return `Mimetismo Psi: aparência copiada de ${alvo?.nome||'alvo'} por 1 minuto (10 turnos); renovar custa 1 PP.`;}
    return labPsiAplicarDiretoV46451_(t,p,alvo,gasto,r,margem);
};

// Oficina: mantém o estado privado, mas ganha o vocabulário de pincéis/texturas da Mesa.
let gmOficinaFerramentaAtual_='traco',gmOficinaOpacidade_=1,gmOficinaPincel_='redondo',gmOficinaTexturaTraco_='solida';
window.gmOficinaFerramenta_=function(v){gmOficinaFerramentaAtual_=String(v||'traco');gmOficinaDesenhando_=true;const s=document.getElementById('gmOficinaFerramenta');if(s)s.value=gmOficinaFerramentaAtual_;gmOficinaRender_();};
function gmOficinaDash_(t){return t==='pontilhada'?'2 9':t==='giz'?'7 5':t==='ranhura'?'12 5':t==='areia'||t==='cascalho'||t==='folhas'||t==='neve'?'1 7':t==='grama'?'5 4':t==='fumaca'?'14 9':'';}
const gmOficinaRenderV46451_=gmOficinaRender_;
gmOficinaRender_=function(){gmOficinaRenderV46451_();const svg=document.querySelector('#gmOficinaCanvas svg');if(svg){svg.innerHTML=(gmOficinaEstado_.desenhos||[]).map(d=>{const pts=(d.pts||[]).map(p=>`${p.x*28},${p.y*28}`).join(' '),erase=d.ferramenta==='borracha',cor=erase?gmOficinaEstado_.fundo:(d.cor||'#ffcf4d'),cap=d.pincel==='quadrado'?'square':d.pincel==='caligrafico'?'butt':'round',dash=gmOficinaDash_(d.textura||'solida');return `<polyline points="${pts}" fill="none" stroke="${cor}" stroke-opacity="${Number(d.opacidade??1)}" stroke-width="${d.esp||7}" stroke-linecap="${cap}" stroke-linejoin="round" ${dash?`stroke-dasharray="${dash}"`:''}/>`;}).join('');}labPsiRenderModalMestre_();};window.gmOficinaRender_=gmOficinaRender_;
window.gmOficinaPointerDown_=function(ev){if(!gmOficinaDesenhando_||ev.button===2||ev.target!==ev.currentTarget)return;ev.preventDefault();const el=ev.currentTarget,r=el.getBoundingClientRect(),ppm=28;const pt=e=>({x:Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-r.left)/ppm)),y:Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-r.top)/ppm))});gmOficinaTraçoAtual_={cor:gmOficinaCorTraco_,esp:gmOficinaEspessura_,opacidade:gmOficinaOpacidade_,pincel:gmOficinaPincel_,textura:gmOficinaTexturaTraco_,ferramenta:gmOficinaFerramentaAtual_,pts:[pt(ev)]};gmOficinaEstado_.desenhos.push(gmOficinaTraçoAtual_);const mv=e=>{gmOficinaTraçoAtual_.pts.push(pt(e));gmOficinaRender_();};const up=()=>{window.removeEventListener('pointermove',mv);gmOficinaTraçoAtual_=null;gmOficinaPersistir_();gmOficinaRender_();};window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});};

// O mapa salvo pela Oficina usa o mesmo formato da biblioteca da Mesa e pode ser carregado pelo seletor "Mapas salvos".
const gmOficinaSalvarComoMapaV46451_=gmOficinaSalvarComoMapa_;
gmOficinaSalvarComoMapa_=async function(){await gmOficinaSalvarComoMapaV46451_();labAtualizarSelectMapas_();};

// Render principal também atualiza a janela Psi, sem polling adicional.
const labRenderV46451_=labRender_;window.labRender_=labRender_;




// ============================================================
// V46.47.2 — estabilização Psi, testes no mapa e Oficina avançada
// ============================================================

// ---------- Identificação robusta de PJ real ----------
function labTokenEhPJReal_(t){
    if(!t)return false;
    const origem=String(t.origemId||t.id||'');
    return (userCharacters||[]).some(c=>String(c.id)===origem);
}
function labUsuarioControlaToken_(t){
    if(!t)return false;
    const uid=String(currentUserUid||currentUser?.uid||'');
    return !!uid&&String(t.donoUid||'')===uid;
}
function labPsiValorResistenciaSeguro_(t,skillId){
    const p=labPsiPericiaPorId_(t,skillId)||
      labPsiPericiaPorId_(t,skillId==='percepcao'?'Percepção':'Força de Vontade');
    if(p)return Math.max(1,labValorTeste_(t,p));
    const c=labCharToken_(t)||t?.charLab||{},a=c?.atributos||t?.attrs||{};
    if(skillId==='percepcao')return Math.max(1,Number(a.INT||10)+Number(a.POD||10));
    return Math.max(1,Number(a.POD||10)*2);
}

// ---------- Testes de perícia no mapa ----------
// Básicas sempre aparecem; profissionais/especializações, quando investidas.
labPericiasTeste_=function(t){
    const c=labCharToken_(t);if(!c)return [];
    return (batalhaListaPericias_(c)||[]).filter(p=>{
        if(p?.__especializacao)return totalTreinoPericia_(c?.especializacoes?.[p.id])>0;
        const nome=normalizarTextoCombate_(`${p?.id||''} ${getNome(p)||''}`);
        if(/primeiros socorros|first aid|急救/.test(nome))return false;
        const treino=totalTreinoPericia_(c?.pericias?.[p.id]);
        return String(p?.tipo||'').toLowerCase().includes('bás')||String(p?.tipo||'').toLowerCase().includes('basic')||treino>0;
    }).sort((a,b)=>getNome(a).localeCompare(getNome(b)));
};
window.labAbrirTeste_=function(){
    const t=labTokenAtual_();if(!t||t.primeirosSocorrosLab)return;
    const ps=labPericiasTeste_(t);
    if(!ps.length){notificar_('Nenhuma perícia disponível para teste neste participante.','aviso',2800);return;}
    t.acaoAuxLab={tipo:'teste_pericia',periciaToken:batalhaTokenPericia_(ps[0])};
    labSalvarLocal_();labRender_();
};

// ---------- Resistências Psi ----------
labPsiSolicitarResistencia_=function(atk,alvo,p,ataque,skill='forca_vontade'){
    const ehPJ=labTokenEhPJReal_(alvo);
    const dono=ehPJ?String(alvo.donoUid||''):'';
    const q={id:`psi-test:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,
      atacanteId:String(atk.id),alvoId:String(alvo.id),alvoUid:dono,poderId:String(p.id),
      skillId:skill,ataqueGrau:ataque.grau,ataqueMargem:ataque.margem,criadoEm:Date.now()};
    if(labEstado_.psiTestePendenteLab){
        labEstado_.psiTestesFilaLab=Array.isArray(labEstado_.psiTestesFilaLab)?labEstado_.psiTestesFilaLab:[];
        labEstado_.psiTestesFilaLab.push(q);
    }else labEstado_.psiTestePendenteLab=q;
    labAgendarSyncRemoto_();
    return ehPJ?'Aguardando resistência secreta do alvo.':'Aguardando o mestre rolar a resistência do alvo.';
};
window.labPsiResolverNpcPendente_=function(){
    const q=labEstado_.psiTestePendenteLab,alvo=q&&labTokenPorId_(q.alvoId);
    if(!q||!alvo||labTokenEhPJReal_(alvo))return;
    const valor=labPsiValorResistenciaSeguro_(alvo,q.skillId);
    const roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll);
    const def={grau:r.grau,sucesso:r.sucesso,margem:r.sucesso?labMargemSucesso_(valor,roll):0};
    labPsiFinalizarResistencia_(q,def);labSalvarLocal_();labAgendarSyncRemoto_();labRender_();
};

// Deixa o efeito visual do atordoamento/grito evidente no token.
const labPsiAplicarEfeitoResistidoV46452_=labPsiAplicarEfeitoResistido_;
labPsiAplicarEfeitoResistido_=function(atk,alvo,p,margem){
    const txt=labPsiAplicarEfeitoResistidoV46452_(atk,alvo,p,margem);
    if(['atordoar_psi','grito_psiquico'].includes(String(p?.id||''))){
        alvo.caidoPsiLab=true;
        alvo.caidoPsiAteRodadaLab=Number(labEstado_.rodada||0)+1;
    }
    return txt;
};

// ---------- Mensagem privada flutuante para quem recebe resposta Psi ----------
function labPsiModalJogador_(){
    let d=document.getElementById('labPsiModalJogador');
    if(!d){
        d=document.createElement('div');d.id='labPsiModalJogador';
        d.style.cssText='display:none;position:fixed;left:22px;bottom:22px;z-index:100001;width:min(500px,calc(100vw - 36px));padding:15px;border:1px solid rgba(143,234,255,.65);border-radius:14px;background:rgba(10,27,45,.97);box-shadow:0 16px 50px rgba(0,0,0,.55);color:white';
        document.body.appendChild(d);
    }return d;
}
function labPsiTokenMensagemParaUsuario_(){
    const uid=String(currentUserUid||currentUser?.uid||'');
    const meus=(labEstado_.tokens||[]).filter(t=>String(t.donoUid||'')===uid&&t.psiMensagemRecebidaLab&&!t.psiMensagemRecebidaLab.lida);
    if(meus.length)return meus[0];
    if(batalhaEhMestre_()){
        const atual=labTokenAtual_();
        if(atual?.psiMensagemRecebidaLab&&!atual.psiMensagemRecebidaLab.lida)return atual;
    }
    return null;
}
function labPsiRenderModalJogador_(){
    if(labReducing_)return;
    const d=labPsiModalJogador_(),t=labPsiTokenMensagemParaUsuario_();
    if(!t){d.style.display='none';d.innerHTML='';return;}
    const m=t.psiMensagemRecebidaLab;
    d.style.display='block';
    d.innerHTML=`<div style="font-size:1.06em;font-weight:800;color:#9ee7ff">🔮 ${escaparHtmlInventario_(m.titulo||'Mensagem psíquica')}</div>
      <div style="margin:8px 0 12px;line-height:1.45">${escaparHtmlInventario_(m.texto||'')}</div>
      <button class="btn-small btn-select" onclick="labPsiFecharMensagemJogador_('${String(t.id).replace(/'/g,"\\'")}')">Entendido</button>`;
}
window.labPsiFecharMensagemJogador_=function(id){
    const t=labTokenPorId_(id);if(!t?.psiMensagemRecebidaLab)return;
    t.psiMensagemRecebidaLab.lida=true;labSalvarLocal_();labAgendarSyncRemoto_();labPsiRenderModalJogador_();
};

// ---------- Telepatia: barata, filtrada pelo mestre ----------
function labPsiEnfileirarTelepatia_(ator,alvo,poder,margem,texto){
    labEstado_.psiMensagensMestreLab=Array.isArray(labEstado_.psiMensagensMestreLab)?labEstado_.psiMensagensMestreLab:[];
    labEstado_.psiMensagensMestreLab.unshift({
      id:`psi-msg:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,tipo:'telepatia',
      atorId:String(ator.id),atorNome:ator.nome,alvoId:String(alvo.id),alvoNome:alvo.nome,
      poderId:String(poder.id),poderNome:getNome(poder),margem:Number(margem||0),
      texto:`Mensagem mental proposta para ${alvo.nome}. O mestre pode filtrar ou reescrever antes de transmitir.`,
      rascunho:String(texto||''),respondida:false,ts:new Date().toISOString()
    });
    labEstado_.psiMensagensMestreLab=labEstado_.psiMensagensMestreLab.slice(0,40);
    labAgendarSyncRemoto_();
}
window.labTelepatiaRascunho_=function(v){
    const t=labTokenAtual_();if(t)t.telepatiaRascunhoLab=String(v||'');
};

// ---------- Círculo de Proteção: área fixa e impermeável nas duas direções ----------
labPsiBloqueadoPorCirculo_=function(ator,alvo){
    if(!ator||!alvo||String(ator.id)===String(alvo.id))return false;
    for(const z of (labEstado_.tokens||[])){
        const c=z.circuloProtecaoPsiLab,r=Number(c?.raio||0);if(r<=0)continue;
        const cx=Number(c.x??z.x),cy=Number(c.y??z.y);
        const da=Math.hypot(Number(ator.x||0)-cx,Number(ator.y||0)-cy);
        const db=Math.hypot(Number(alvo.x||0)-cx,Number(alvo.y||0)-cy);
        if((da<=r+.001)!==(db<=r+.001))return true;
    }return false;
};

// ---------- Teletransporte: alcance adicional ao movimento normal ----------
labPsiTeletransportarPreparar_=function(t,gasto,minimo){
    const mov=labMovimentoPorAcao_(t)||0;
    const extra=10+Math.max(0,Number(gasto||0)-Number(minimo||0))*4;
    t.teletransportePsiPendenteLab=Math.max(2,mov+extra);
    t.saltoPsiPendenteLab=t.teletransportePsiPendenteLab;
    t.teletransporteCliqueLab=true;
    return `Teletransporte preparado: clique em qualquer ponto do mapa a até ${t.teletransportePsiPendenteLab.toFixed(1)} m. O alcance inclui ${extra.toFixed(0)} m além do movimento normal.`;
};

// ---------- Oficina de Mapas: renderização real de pincéis/texturas ----------
function gmOficinaRenderDesenhos_(){
    const cv=document.getElementById('gmOficinaDrawCanvas');if(!cv)return;
    const ppm=28,w=Math.round(gmOficinaEstado_.larguraM*ppm),h=Math.round(gmOficinaEstado_.alturaM*ppm);
    cv.width=w;cv.height=h;cv.style.width=`${w}px`;cv.style.height=`${h}px`;
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,w,h);ctx.lineJoin='round';
    for(const st of gmOficinaEstado_.desenhos||[]){
        const pts=Array.isArray(st.pts)?st.pts:[];if(!pts.length)continue;
        const tool=st.ferramenta||st.tool||'traco',size=Math.max(1,Number(st.esp||st.size||7)),color=st.cor||st.color||'#ffcf4d';
        const opacity=Math.max(.02,Math.min(1,Number(st.opacidade??st.opacity??1)));
        const brush=st.pincel||st.brush||'redondo',texture=st.textura||st.texture||'solida';
        ctx.save();
        if(tool==='borracha'){
            ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.strokeStyle='black';ctx.lineWidth=size;ctx.lineCap='round';
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);ctx.stroke();ctx.restore();continue;
        }
        ctx.globalAlpha=opacity;ctx.strokeStyle=color;ctx.fillStyle=color;
        if(texture!=='solida'){labDesenhoAplicarTextura_(ctx,texture,pts,0,size,color,ppm,brush);}
        else if(brush==='spray'){
            for(let j=0;j<pts.length;j++){const p=pts[j],dots=Math.max(5,Math.round(size*.9));for(let k=0;k<dots;k++){const a=labDesenhoRand_(j*97+k*13)*Math.PI*2,r=Math.sqrt(labDesenhoRand_(j*193+k*29))*size*.8,rr=Math.max(.7,size*.06);ctx.beginPath();ctx.arc(p.x*ppm+Math.cos(a)*r,p.y*ppm+Math.sin(a)*r,rr,0,Math.PI*2);ctx.fill();}}
        }else if(brush==='quadrado'){for(const p of pts)ctx.fillRect(p.x*ppm-size/2,p.y*ppm-size/2,size,size);}
        else if(brush==='irregular'){
            ctx.lineWidth=size;ctx.lineCap='round';ctx.beginPath();
            pts.forEach((p,j)=>{const wob=size*.7,x=p.x*ppm+(labDesenhoRand_(j*151+3)-.5)*wob,y=p.y*ppm+(labDesenhoRand_(j*211+9)-.5)*wob;j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
        }else{
            ctx.lineWidth=brush==='caligrafico'?Math.max(1,size*.42):size;ctx.lineCap=brush==='caligrafico'?'butt':'round';
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);ctx.stroke();
        }
        ctx.restore();
    }
}
const gmOficinaRenderV46452_=gmOficinaRender_;
gmOficinaRender_=function(){
    gmOficinaRenderV46452_();
    const c=document.getElementById('gmOficinaCanvas');if(c){
        const svg=c.querySelector('svg');if(svg)svg.remove();
        let cv=document.getElementById('gmOficinaDrawCanvas');
        if(!cv){cv=document.createElement('canvas');cv.id='gmOficinaDrawCanvas';cv.style.cssText='position:absolute;inset:0;z-index:2;pointer-events:none';c.prepend(cv);}
        gmOficinaRenderDesenhos_();
    }
    labPsiRenderModalMestre_();labPsiRenderModalJogador_();
};window.gmOficinaRender_=gmOficinaRender_;

window.gmOficinaPointerDown_=function(ev){
    if(!gmOficinaDesenhando_||ev.button===2||ev.target!==ev.currentTarget)return;
    ev.preventDefault();const el=ev.currentTarget,r=el.getBoundingClientRect(),ppm=28;
    const pt=e=>({x:Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-r.left)/ppm)),y:Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-r.top)/ppm))});
    gmOficinaTraçoAtual_={cor:gmOficinaCorTraco_,esp:gmOficinaEspessura_,opacidade:gmOficinaOpacidade_,pincel:gmOficinaPincel_,textura:gmOficinaTexturaTraco_,ferramenta:gmOficinaFerramentaAtual_,pts:[pt(ev)]};
    gmOficinaEstado_.desenhos.push(gmOficinaTraçoAtual_);
    let raf=0;
    const mv=e=>{gmOficinaTraçoAtual_.pts.push(pt(e));if(!raf)raf=requestAnimationFrame(()=>{raf=0;gmOficinaRenderDesenhos_();});};
    const up=()=>{window.removeEventListener('pointermove',mv);if(raf)cancelAnimationFrame(raf);gmOficinaTraçoAtual_=null;gmOficinaPersistir_();gmOficinaRender_();};
    window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
};

// ---------- Efeitos Psi: Círculo, Anoitecer, Mimetismo, Grito ----------
const labPsiAplicarDiretoV46452_=labPsiAplicarDireto_;
labPsiAplicarDireto_=function(t,p,alvo,gasto,r,margem){
    const id=String(p?.id||''),min=Math.max(0,Number(p?.custo||0));
    if(id==='defesa_mental'||id==='circulo_protecao'){
        const raio=Math.max(2.5,2.5+Math.max(0,gasto-min)*2.5);
        t.circuloProtecaoPsiLab={x:Number(t.x||0),y:Number(t.y||0),raio,duracaoTurnos:Math.max(2,2+Math.max(0,gasto-min)*2)};
        return `Círculo de Proteção fixado neste ponto: raio ${raio.toFixed(1)} m por ${t.circuloProtecaoPsiLab.duracaoTurnos} turno(s). Efeitos Psi não atravessam a fronteira em nenhuma direção.`;
    }
    if(id==='anoitecer'){
        const extra=Math.max(0,gasto-min),raio=Math.max(3,3+Math.floor(Math.max(0,margem)/5)+extra*3);
        t.anoitecerPsiLab={x:Number(t.x||0),y:Number(t.y||0),raio,ppTurno:1+extra,autorUid:String(t.donoUid||'')};
        return `Anoitecer: raio ${raio} m. Manutenção ${1+extra} PP/turno; a margem e PP extras ampliam a zona.`;
    }
    if(id==='telepatia'){
        const texto=String(t.telepatiaRascunhoLab||'').trim();
        if(!texto)return 'Telepatia teve sucesso, mas nenhuma mensagem foi escrita.';
        labPsiEnfileirarTelepatia_(t,alvo,p,margem,texto);t.telepatiaRascunhoLab='';
        return `Mensagem telepática enviada ao mestre para filtragem antes de chegar a ${alvo.nome}.`;
    }
    return labPsiAplicarDiretoV46452_(t,p,alvo,gasto,r,margem);
};

// Grito agora usa cone de 60° na direção da seta, com 20 m.
function labPsiAlvosCone_(ator,alcance=20,aberturaGraus=60){
    const ang0=((Number(ator.angulo||0)-90)*Math.PI/180),half=(aberturaGraus*Math.PI/180)/2;
    return (labEstado_.tokens||[]).filter(x=>{
        if(String(x.id)===String(ator.id))return false;
        const dx=Number(x.x||0)-Number(ator.x||0),dy=Number(x.y||0)-Number(ator.y||0),d=Math.hypot(dx,dy);if(d>alcance||d<.001)return false;
        const a=Math.atan2(dy,dx);let dif=Math.atan2(Math.sin(a-ang0),Math.cos(a-ang0));
        return Math.abs(dif)<=half;
    });
}

// Reimplementa execução apenas nos ramos que precisavam de correção.
const labUsarPsiExecutarV46452_=labUsarPsiExecutar_;
labUsarPsiExecutar_=function(){
    const t=labTokenAtual_(),a=t?.acaoAuxLab;if(!t||a?.tipo!=='psiquismo')return;
    const p=labPsiPoderes_(t).find(x=>x.id===a.poderId);
    // Telepatia agora custa no máximo a nova base do banco; enquanto o banco antigo estiver carregado, força mínimo 2.
    if(p?.id==='telepatia'&&Number(a.custo||0)>2)a.custo=2;
    // Para Grito, usamos a execução-base, mas substituímos temporariamente a lista de alvos por um cone.
    if(p?.id!=='grito_psiquico'){return labUsarPsiExecutarV46452_();}
    if(Number(t.acoesAtuaisLab||0)<=0)return;
    const alvo=labPsiAlvoPorId_(a.alvoId)||t,min=Math.max(0,Number(p.custo||0)),gasto=Math.max(min,Math.floor(Number(a.custo||min)));
    if(gasto>labPsiRestantes_(t)){notificar_('PP insuficientes.','aviso');return;}
    const valor=labPsiValor_(t,p),roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll),margem=r.sucesso?labMargemSucesso_(valor,roll):0;
    if(!labPsiConsumirAcao_(t))return;t.psiGastosLab=Math.max(0,Number(t.psiGastosLab||0))+gasto;let efeito='';
    if(!r.sucesso)efeito='O poder falhou.';
    else{
        if(r.grau==='Crítico')labPsiRestituirAcao_(t,1);
        const alvos=labPsiAlvosCone_(t,20,60);
        for(const x of alvos)labPsiSolicitarResistencia_(t,x,p,{grau:r.grau,margem},'forca_vontade');
        efeito=`Grito Psíquico lançado em cone de 60°/20 m; ${alvos.length} alvo(s) precisam resistir.`;
    }
    const resultado=`Psiquismo: ${getNome(p)} · ${p.esfera} A${Number(p.arco||1)} · ${roll}/${valor} → ${r.grau}${r.sucesso?` · margem ${margem}`:''} · gasto ${gasto} PP. ${efeito}`;
    labRegistrarResultadoProprio_(t,resultado);labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${t.nome}: ${resultado}`});
    labSalvarLocal_();labAgendarSyncRemoto_();labRender_();
};

// ---------- Painel Psi: campo de mensagem para Telepatia ----------
const labRenderActionPanelV46452_=labRenderActionPanel_;
labRenderActionPanel_=function(){
    labRenderActionPanelV46452_();
    const t=labTokenAtual_(),a=t?.acaoAuxLab;if(a?.tipo!=='psiquismo')return;
    const p=labPsiPoderes_(t).find(x=>x.id===a.poderId);if(p?.id!=='telepatia')return;
    const el=document.getElementById('labActionPanel');if(!el||document.getElementById('labTelepatiaTexto'))return;
    const box=document.createElement('div');box.style.cssText='margin-top:9px;padding:9px;border:1px solid rgba(216,180,255,.22);border-radius:9px;background:rgba(35,18,55,.22)';
    box.innerHTML=`<small style="color:#d8b4ff">Mensagem mental proposta — o mestre poderá filtrar antes do envio</small><textarea id="labTelepatiaTexto" rows="2" oninput="labTelepatiaRascunho_(this.value)" style="width:100%;margin:6px 0 0" placeholder="Escreva a mensagem...">${escaparHtmlInventario_(t.telepatiaRascunhoLab||'')}</textarea>`;
    el.appendChild(box);
};window.labRenderActionPanel_=labRenderActionPanel_;

// ---------- Modal do mestre: prioridade para resistências de NPC e telepatia ----------
labPsiRenderModalMestre_=function(){
    const d=labPsiModalMestre_();if(!batalhaEhMestre_()){d.style.display='none';return;}
    const q=labEstado_.psiTestePendenteLab,alvo=q&&labTokenPorId_(q.alvoId);
    if(q&&alvo&&!labTokenEhPJReal_(alvo)){
        const valor=labPsiValorResistenciaSeguro_(alvo,q.skillId);
        d.style.display='block';d.innerHTML=`<div style="font-size:1.05em;font-weight:800;color:#ffd8ff">🛡️ Resistência Psi exigida</div>
          <div style="margin:7px 0 10px"><b>${escaparHtmlInventario_(alvo.nome)}</b> precisa resistir a um efeito.</div>
          <div style="color:#bbb;margin-bottom:10px">Teste: <b>${q.skillId==='percepcao'?'Percepção':'Força de Vontade'}</b> (${valor}%)</div>
          <button class="btn-small btn-select" onclick="labPsiResolverNpcPendente_()">🎲 Rolar resistência</button>`;return;
    }
    const m=(labEstado_.psiMensagensMestreLab||[]).find(x=>!x.respondida);
    if(!m){d.style.display='none';d.innerHTML='';return;}
    if(m.tipo==='telepatia'){
        d.style.display='block';d.innerHTML=`<div style="font-size:1.05em;font-weight:800;color:#d8b4ff">🧠 Telepatia</div>
          <div style="margin:6px 0"><b>${escaparHtmlInventario_(m.atorNome)}</b> → <b>${escaparHtmlInventario_(m.alvoNome)}</b></div>
          <div style="font-size:.86em;color:#cbb9dd;margin-bottom:6px">Mensagem proposta pelo emissor:</div>
          <div style="padding:8px;border-radius:8px;background:rgba(255,255,255,.06);margin-bottom:8px">${escaparHtmlInventario_(m.rascunho||'')}</div>
          <textarea id="labPsiModalResposta" rows="3" style="width:100%;margin:0 0 8px">${escaparHtmlInventario_(m.rascunho||'')}</textarea>
          <button class="btn-small btn-select" onclick="labPsiResponderFlutuante_('${String(m.id).replace(/'/g,"\\'")}')">Transmitir ao alvo</button>`;return;
    }
    d.style.display='block';d.innerHTML=`<div style="font-size:1.05em;font-weight:800;color:#d8b4ff">🔮 ${escaparHtmlInventario_(m.poderNome)}</div>
      <div style="margin:6px 0"><b>${escaparHtmlInventario_(m.atorNome)}</b> obteve margem <b>${Number(m.margem||0)}</b>.</div>
      <div style="font-size:.88em;color:#cbb9dd;margin-bottom:9px">${escaparHtmlInventario_(m.texto||'Interprete o resultado e responda ao jogador.')}</div>
      <textarea id="labPsiModalResposta" rows="3" placeholder="Resposta privada ao jogador..." style="width:100%;margin:0 0 8px"></textarea>
      <button class="btn-small btn-select" onclick="labPsiResponderFlutuante_('${String(m.id).replace(/'/g,"\\'")}')">Enviar resposta privada</button>`;
};
window.labPsiResponderFlutuante_=function(id){
    const ta=document.getElementById('labPsiModalResposta'),txt=String(ta?.value||'').trim();if(!txt)return;
    const m=(labEstado_.psiMensagensMestreLab||[]).find(x=>String(x.id)===String(id));if(!m)return;
    const destino=m.tipo==='telepatia'?labTokenPorId_(m.alvoId):labTokenPorId_(m.atorId);
    if(destino){
        destino.psiMensagemRecebidaLab={id:`psi-recv:${Date.now()}`,titulo:m.tipo==='telepatia'?'Telepatia':m.poderNome,texto:txt,lida:false,ts:Date.now()};
        labRegistrarResultadoProprio_(destino,`🔮 ${m.tipo==='telepatia'?'Telepatia':m.poderNome}: ${txt}`);
    }
    m.respondida=true;m.resposta=txt;m.respondidaEm=new Date().toISOString();
    labSalvarLocal_();labAgendarSyncRemoto_();labRender_();notificar_('Mensagem Psi enviada.','sucesso',2200);
};

// ---------- Visuais: círculo fixo, anoitecer por usuário e estados ----------
labRenderPsiVisuais_=function(){
    const map=document.getElementById('labMetricMap');if(!map)return;
    map.querySelectorAll('.lab-psi-zone-v4645,.lab-psi-zone-v46452').forEach(e=>e.remove());
    const ppm=Number(labEstado_.pxPorMetro||48),uid=String(currentUserUid||currentUser?.uid||'');
    for(const t of (labEstado_.tokens||[])){
        if(t.circuloProtecaoPsiLab?.raio){
            const c=t.circuloProtecaoPsiLab,r=Number(c.raio),cx=Number(c.x??t.x),cy=Number(c.y??t.y),d=document.createElement('div');
            d.className='lab-psi-zone-v46452';d.style.cssText=`position:absolute;left:${(cx-r)*ppm}px;top:${(cy-r)*ppm}px;width:${r*2*ppm}px;height:${r*2*ppm}px;border:2px solid rgba(110,180,255,.82);background:rgba(80,120,255,.08);border-radius:50%;pointer-events:none;z-index:2;box-shadow:0 0 18px rgba(110,180,255,.25)`;map.appendChild(d);
        }
        if(t.anoitecerPsiLab?.raio){
            const z=t.anoitecerPsiLab,r=Number(z.raio),cx=Number(z.x??t.x),cy=Number(z.y??t.y),autor=uid&&String(t.donoUid||'')===uid;
            const alpha=autor?.48:(batalhaEhMestre_()?.84:.985),d=document.createElement('div');
            d.className='lab-psi-zone-v46452';d.style.cssText=`position:absolute;left:${(cx-r)*ppm}px;top:${(cy-r)*ppm}px;width:${r*2*ppm}px;height:${r*2*ppm}px;border:1px solid rgba(160,120,220,.62);background:rgba(2,1,7,${alpha});border-radius:50%;pointer-events:none;z-index:22;box-shadow:inset 0 0 60px rgba(0,0,0,.75)`;map.appendChild(d);
        }
        if(t.mimetismoPsiLab?.imagem){const n=map.querySelector(`.lab-token[data-id="${CSS.escape(String(t.id))}"] img`);if(n)n.src=t.mimetismoPsiLab.imagem;}
        if(t.caidoPsiLab){const n=map.querySelector(`.lab-token[data-id="${CSS.escape(String(t.id))}"]`);if(n){n.style.transform='rotate(90deg)';n.style.transformOrigin='50% 50%';}}
    }
};

// Limpa "caído por Psi" após a rodada provisória.
const labEncerrarOportunidadeV46452_=labEncerrarOportunidade_;
labEncerrarOportunidade_=function(){
    const r=labEncerrarOportunidadeV46452_();
    for(const t of (labEstado_.tokens||[]))if(t.caidoPsiLab&&Number(labEstado_.rodada||0)>Number(t.caidoPsiAteRodadaLab||0))t.caidoPsiLab=false;
    labSalvarLocal_();return r;
};window.labEncerrarOportunidade_=labEncerrarOportunidade_;

// Render geral atualiza também mensagens e visuais.
const labRenderV46452_=labRender_;
window.labRender_=labRender_;




// ============================================================
// V46.47.2 — Teletransporte por clique e teletransportes caóticos
// ============================================================
function labPsiPosicaoAleatoriaValida_(alvo){
    const raio=Math.max(.3,Number(alvo?.diametroM||.9)/2);
    const outros=(labEstado_.tokens||[]).filter(x=>String(x.id)!==String(alvo?.id));
    for(let k=0;k<180;k++){
        const x=raio+.25+Math.random()*Math.max(.2,Number(labEstado_.larguraM||24)-2*(raio+.25));
        const y=raio+.25+Math.random()*Math.max(.2,Number(labEstado_.alturaM||14)-2*(raio+.25));
        const livre=outros.every(o=>{
            const ro=Math.max(.3,Number(o.diametroM||.9)/2);
            return Math.hypot(x-Number(o.x||0),y-Number(o.y||0))>(raio+ro+.18);
        });
        if(livre)return {x:Math.round(x*100)/100,y:Math.round(y*100)/100};
    }
    return {
        x:Math.round((.5+Math.random()*Math.max(1,Number(labEstado_.larguraM||24)-1))*100)/100,
        y:Math.round((.5+Math.random()*Math.max(1,Number(labEstado_.alturaM||14)-1))*100)/100
    };
}
function labPsiMoverAleatorio_(alvo){
    const p=labPsiPosicaoAleatoriaValida_(alvo);
    alvo.x=p.x;alvo.y=p.y;
    alvo.teletransportePsiPendenteLab=0;alvo.saltoPsiPendenteLab=0;alvo.teletransporteCliqueLab=false;
    return p;
}

// Alvos dos dois novos poderes.
const labPsiAlvosV46453_=labPsiAlvos_;
labPsiAlvos_=function(t,p){
    if(p?.id==='teletransporte_caotico')return [t];
    if(p?.id==='banimento_caotico')return (labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t.id));
    return labPsiAlvosV46453_(t,p);
};

// Aplicação direta: teletransporte caótico do próprio usuário.
const labPsiAplicarDiretoV46453_=labPsiAplicarDireto_;
labPsiAplicarDireto_=function(t,p,alvo,gasto,r,margem){
    if(p?.id==='teletransporte_caotico'){
        const pos=labPsiMoverAleatorio_(t);
        return `Teletransporte Caótico: você reapareceu em uma posição aleatória (${pos.x.toFixed(1)} m, ${pos.y.toFixed(1)} m).`;
    }
    return labPsiAplicarDiretoV46453_(t,p,alvo,gasto,r,margem);
};

// Aplicação resistida: banimento do alvo.
const labPsiAplicarEfeitoResistidoV46453_=labPsiAplicarEfeitoResistido_;
labPsiAplicarEfeitoResistido_=function(atk,alvo,p,margem){
    if(p?.id==='banimento_caotico'){
        const pos=labPsiMoverAleatorio_(alvo);
        return `${alvo.nome} foi banido para uma posição aleatória do mapa (${pos.x.toFixed(1)} m, ${pos.y.toFixed(1)} m).`;
    }
    return labPsiAplicarEfeitoResistidoV46453_(atk,alvo,p,margem);
};

// Enquanto há um Teletransporte normal preparado, clicar no token não inicia arraste.
// O jogador escolhe o destino clicando diretamente no chão.
const labPointerDownV46453_=window.labPointerDown_;
window.labPointerDown_=function(ev,id){
    const t=labTokenPorId_(id);
    if(t&&Number(t.teletransportePsiPendenteLab||0)>0&&labPodeControlarToken_(t)){
        ev.preventDefault();ev.stopPropagation();
        labEstado_.selecionadoId=String(t.id);
        notificar_('Teletransporte preparado: clique no ponto de destino dentro do círculo de alcance.','info',2600);
        labRender_();return;
    }
    return labPointerDownV46453_(ev,id);
};

// Clique no chão executa o Teletransporte normal.
const labCliqueFundoMapaV46453_=window.labCliqueFundoMapa_;
window.labCliqueFundoMapa_=function(ev){
    const t=labTokenAtual_(),map=document.getElementById('labMetricMap');
    if(t&&map&&labPodeControlarToken_(t)&&Number(t.teletransportePsiPendenteLab||0)>0){
        const alvo=ev?.target;
        if(alvo?.closest?.('.lab-token,.lab-map-object,.lab-micro-actions'))return;
        ev.preventDefault();ev.stopPropagation();
        const rect=map.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48);
        let x=(ev.clientX-rect.left)/ppm,y=(ev.clientY-rect.top)/ppm;
        const ox=Number(t.x||0),oy=Number(t.y||0),dx=x-ox,dy=y-oy,dist=Math.hypot(dx,dy),max=Math.max(0,Number(t.teletransportePsiPendenteLab||0));
        if(dist>max+.001){
            notificar_(`Destino fora do alcance. Máximo: ${max.toFixed(1)} m.`,'aviso',3000);return;
        }
        x=Math.max(0,Math.min(Number(labEstado_.larguraM||0),x));
        y=Math.max(0,Math.min(Number(labEstado_.alturaM||0),y));
        if(!batalhaEhMestre_()){
            labEnviarComandoJogador_('movimento',{x,y},t).then(ok=>{
                if(ok)notificar_('Destino do Teletransporte enviado ao mestre.','info',1500);
            });
            return;
        }
        t.x=Math.round(x*100)/100;t.y=Math.round(y*100)/100;
        t.teletransportePsiPendenteLab=0;t.saltoPsiPendenteLab=0;t.teletransporteCliqueLab=false;
        labEstado_.selecionadoId=String(t.id);labSalvarLocal_();labAgendarSyncRemoto_();labRender_();
        notificar_('✨ Teletransporte concluído.','sucesso',1800);
        return;
    }
    return labCliqueFundoMapaV46453_(ev);
};

// O processamento do comando de movimento já respeita o alcance salvo.
// Após a execução, o modo especial é limpo e o token volta a ser arrastável normalmente.

// Visual de alcance: reforça que agora se escolhe qualquer ponto dentro do círculo.
const labOverlayMovimentoHtmlV46453_=labOverlayMovimentoHtml_;
labOverlayMovimentoHtml_=function(t,ppm){
    if(t&&Number(t.teletransportePsiPendenteLab||0)>0){
        const r=Number(t.teletransportePsiPendenteLab||0);
        return `<div style="position:absolute;left:${(Number(t.x)-r)*ppm}px;top:${(Number(t.y)-r)*ppm}px;width:${r*2*ppm}px;height:${r*2*ppm}px;border-radius:50%;border:2px dashed rgba(210,155,255,.9);background:rgba(143,80,220,.08);box-shadow:0 0 25px rgba(190,120,255,.2);pointer-events:none;z-index:1"></div>`;
    }
    return labOverlayMovimentoHtmlV46453_(t,ppm);
};



// ============================================================
// V46.47.2 — roteamento de resistência Psi + nomes sempre retos
// ============================================================

// Qualquer token com donoUid é tratado como controlado por uma conta real.
// Não dependemos da lista userCharacters do navegador do mestre.
function labPsiUidControlador_(t){
    return String(t?.donoUid||t?.dono||'').trim();
}
function labPsiAlvoControladoPorUsuario_(t){
    return !!labPsiUidControlador_(t);
}

// Cria resistência:
// - alvo com donoUid -> somente a conta daquele jogador recebe a solicitação;
// - alvo sem donoUid -> resistência é resolvida automaticamente e em segredo.
labPsiSolicitarResistencia_=function(atk,alvo,p,ataque,skill='forca_vontade'){
    const dono=labPsiUidControlador_(alvo);
    if(dono){
        const q={
          id:`psi-test:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,
          atacanteId:String(atk.id),alvoId:String(alvo.id),alvoUid:dono,
          poderId:String(p.id),skillId:skill,ataqueGrau:ataque.grau,
          ataqueMargem:ataque.margem,criadoEm:Date.now()
        };
        if(labEstado_.psiTestePendenteLab){
            labEstado_.psiTestesFilaLab=Array.isArray(labEstado_.psiTestesFilaLab)?labEstado_.psiTestesFilaLab:[];
            labEstado_.psiTestesFilaLab.push(q);
        }else labEstado_.psiTestePendenteLab=q;
        labSalvarLocal_();labAgendarSyncRemoto_();
        return 'Aguardando resistência secreta do alvo.';
    }

    // NPC/criatura sem conta controladora: resolve secretamente, sem modal do mestre.
    const valor=labPsiValorResistenciaSeguro_(alvo,skill);
    const roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll);
    const def={grau:r.grau,sucesso:r.sucesso,margem:r.sucesso?labMargemSucesso_(valor,roll):0};
    labPsiFinalizarResistencia_(
      {atacanteId:atk.id,alvoId:alvo.id,poderId:p.id,ataqueGrau:ataque.grau,ataqueMargem:ataque.margem},
      def
    );
    return 'A resistência do alvo foi resolvida secretamente.';
};

// Corrige pendências antigas criadas por versões anteriores sem alvoUid.
// Se o token hoje possui donoUid, a pendência é redirecionada para essa conta.
function labPsiNormalizarPendenciaAtual_(){
    const q=labEstado_.psiTestePendenteLab;if(!q)return false;
    const alvo=labTokenPorId_(q.alvoId);if(!alvo)return false;
    const dono=labPsiUidControlador_(alvo);
    if(dono&&String(q.alvoUid||'')!==dono){
        q.alvoUid=dono;
        labSalvarLocal_();labAgendarSyncRemoto_();
        return true;
    }
    return false;
}

// Jogador alvo: mostra sempre a resistência, independentemente de quem está no turno.
// Mestre nunca recebe modal para uma resistência que pertence a uma conta de jogador.
const labRenderActionPanelV46454_=labRenderActionPanel_;
labRenderActionPanel_=function(){
    labPsiNormalizarPendenciaAtual_();

    const q=labEstado_.psiTestePendenteLab;
    const alvo=q&&labTokenPorId_(q.alvoId);
    const uid=String(currentUserUid||currentUser?.uid||'');
    const pertenceAoJogador=!!q&&!!alvo&&!!uid&&String(q.alvoUid||'')===uid;

    if(!batalhaEhMestre_()&&pertenceAoJogador){
        const el=document.getElementById('labActionPanel');if(!el)return;
        const per=labPsiPericiaPorId_(alvo,q.skillId)||
          labPsiPericiaPorId_(alvo,q.skillId==='percepcao'?'Percepção':'Força de Vontade');
        el.style.display='block';
        el.innerHTML=`<div>
          <strong style="color:#ffcfef">◈ Algo exige uma reação sua.</strong>
          <div style="margin-top:8px;color:#cfc5de">
            Faça o teste indicado. Você não sabe a origem nem verá o resultado, salvo em uma resistência crítica.
          </div>
          <div style="display:flex;gap:8px;align-items:end;margin-top:9px;flex-wrap:wrap">
            <label style="margin:0"><small>Perícia obrigatória</small>
              <select disabled style="min-width:260px;margin:3px 0 0">
                <option>${escaparHtmlInventario_(getNome(per)||q.skillId)}</option>
              </select>
            </label>
            <button class="btn-small btn-select" onclick="labPsiResolverTestePendente_()"
              style="height:48px;min-width:180px">🎲 Fazer teste</button>
          </div>
        </div>`;
        return;
    }

    labRenderActionPanelV46454_();
};

// Nunca mostrar resistência de PJ/PM controlado por usuário no navegador do mestre.
// O modal do mestre fica reservado a mensagens informacionais/Telepatia.
const labPsiRenderModalMestreV46454_=labPsiRenderModalMestre_;
labPsiRenderModalMestre_=function(){
    if(!batalhaEhMestre_())return labPsiRenderModalMestreV46454_();

    labPsiNormalizarPendenciaAtual_();
    const q=labEstado_.psiTestePendenteLab;
    const alvo=q&&labTokenPorId_(q.alvoId);

    if(q&&alvo&&labPsiUidControlador_(alvo)){
        // Há uma resistência pertencente a jogador: não revelar nem oferecer rolagem ao mestre.
        const d=labPsiModalMestre_();
        // Ainda pode haver uma mensagem informacional pendente; renderizamos apenas essa parte.
        const m=(labEstado_.psiMensagensMestreLab||[]).find(x=>!x.respondida);
        if(!m){d.style.display='none';d.innerHTML='';return;}
        if(m.tipo==='telepatia'){
            d.style.display='block';
            d.innerHTML=`<div style="font-size:1.05em;font-weight:800;color:#d8b4ff">🧠 Telepatia</div>
              <div style="margin:6px 0"><b>${escaparHtmlInventario_(m.atorNome)}</b> → <b>${escaparHtmlInventario_(m.alvoNome)}</b></div>
              <div style="font-size:.86em;color:#cbb9dd;margin-bottom:6px">Mensagem proposta pelo emissor:</div>
              <div style="padding:8px;border-radius:8px;background:rgba(255,255,255,.06);margin-bottom:8px">${escaparHtmlInventario_(m.rascunho||'')}</div>
              <textarea id="labPsiModalResposta" rows="3" style="width:100%;margin:0 0 8px">${escaparHtmlInventario_(m.rascunho||'')}</textarea>
              <button class="btn-small btn-select" onclick="labPsiResponderFlutuante_('${String(m.id).replace(/'/g,"\\'")}')">Transmitir ao alvo</button>`;
            return;
        }
        d.style.display='block';
        d.innerHTML=`<div style="font-size:1.05em;font-weight:800;color:#d8b4ff">🔮 ${escaparHtmlInventario_(m.poderNome)}</div>
          <div style="margin:6px 0"><b>${escaparHtmlInventario_(m.atorNome)}</b> obteve margem <b>${Number(m.margem||0)}</b>.</div>
          <div style="font-size:.88em;color:#cbb9dd;margin-bottom:9px">${escaparHtmlInventario_(m.texto||'Interprete o resultado e responda ao jogador.')}</div>
          <textarea id="labPsiModalResposta" rows="3" placeholder="Resposta privada ao jogador..." style="width:100%;margin:0 0 8px"></textarea>
          <button class="btn-small btn-select" onclick="labPsiResponderFlutuante_('${String(m.id).replace(/'/g,"\\'")}')">Enviar resposta privada</button>`;
        return;
    }

    // NPC sem conta não deve abrir uma janela manual; resolve sozinho se uma
    // pendência antiga desse tipo ainda existir.
    if(q&&alvo&&!labPsiUidControlador_(alvo)){
        const valor=labPsiValorResistenciaSeguro_(alvo,q.skillId);
        const roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll);
        const def={grau:r.grau,sucesso:r.sucesso,margem:r.sucesso?labMargemSucesso_(valor,roll):0};
        labPsiFinalizarResistencia_(q,def);
        labSalvarLocal_();labAgendarSyncRemoto_();
    }

    return labPsiRenderModalMestreV46454_();
};

// Ao concluir a resistência, sincroniza imediatamente para que a fila avance
// também nos demais navegadores.
const labPsiFinalizarResistenciaV46454_=labPsiFinalizarResistencia_;
labPsiFinalizarResistencia_=function(pend,defesa){
    const r=labPsiFinalizarResistenciaV46454_(pend,defesa);
    labSalvarLocal_();labAgendarSyncRemoto_();
    return r;
};

// ---------- Atordoado/caído: só a imagem gira; nome, seta e controles ficam retos ----------
const labRenderPsiVisuaisV46454_=labRenderPsiVisuais_;
labRenderPsiVisuais_=function(){
    labRenderPsiVisuaisV46454_();
    const map=document.getElementById('labMetricMap');if(!map)return;
    for(const t of (labEstado_.tokens||[])){
        const n=map.querySelector(`.lab-token[data-id="${CSS.escape(String(t.id))}"]`);
        if(!n)continue;

        // Remove rotação indevida aplicada por versões anteriores.
        n.style.transform='';
        n.style.transformOrigin='';

        const img=n.querySelector(':scope > img');
        if(t.caidoPsiLab){
            if(img){
                img.style.transform='rotate(90deg)';
                img.style.transformOrigin='50% 50%';
                img.style.filter=(img.style.filter?img.style.filter+' ':'')+'saturate(.65)';
            }
            if(!n.querySelector('.lab-psi-stunned-badge')){
                const b=document.createElement('div');
                b.className='lab-psi-stunned-badge';
                b.textContent='💫';
                b.style.cssText='position:absolute;right:-10px;top:-12px;font-size:18px;z-index:40;pointer-events:none;filter:drop-shadow(0 1px 3px #000)';
                n.appendChild(b);
            }
        }else{
            if(img){img.style.transform='';img.style.transformOrigin='';}
            n.querySelector('.lab-psi-stunned-badge')?.remove();
        }
    }
};

// Render final: garante que a pendência seja roteada e que o jogador receba
// o painel sem depender de estar selecionando o token ou de ser sua oportunidade.
const labRenderV46454_=labRender_;

window.labRender_=labRender_;
window.labRenderActionPanel_=labRenderActionPanel_;
window.labPsiRenderModalMestre_=labPsiRenderModalMestre_;



// ============================================================
// V46.47.2 — Oficina avançada + laser + perícias + Mimetismo
// ============================================================

// ---------- Testes de perícia gerais no Mapa da Mesa ----------
// O botão "Teste" não usa especializações de combate: elas já possuem
// o painel próprio. Mostra básicas e profissionais investidas.
labPericiasTeste_=function(t){
    const c=labCharToken_(t);if(!c)return [];
    const usados=new Set(),out=[];
    for(const p of (periciasDB||[])){
        if(!p?.id||p.disponivelCampanha===false)continue;
        const nome=normalizarTextoCombate_(`${p.id||''} ${getNome(p)||''}`);
        if(/primeiros socorros|first aid|急救/.test(nome))continue;
        const treino=totalTreinoPericia_(c?.pericias?.[p.id]);
        const tipo=String(p.tipo||'').toLowerCase();
        const basica=tipo.includes('bás')||tipo.includes('basic');
        if(!basica&&treino<=0)continue;
        // Especializações/estilos de combate ficam fora deste seletor.
        if(tipo.includes('combate')||tipo.includes('combat'))continue;
        usados.add(String(p.id));out.push(p);
    }
    // NPCs podem possuir uma perícia narrativa salva que ainda não exista
    // no banco global; preserva esses casos.
    for(const [id,reg] of Object.entries(c?.pericias||{})){
        if(usados.has(String(id))||totalTreinoPericia_(reg)<=0)continue;
        const nome=String(reg?.nomeOriginal||reg?.nome||id).replace(/_/g,' ');
        if(/primeiros socorros/i.test(nome))continue;
        out.push({id,nome,nome_en:nome,nome_zh:nome,tipo:'Profissional',formula:String(reg?.formula||'INT+POD')});
    }
    return out.sort((a,b)=>getNome(a).localeCompare(getNome(b),'pt'));
};

// ---------- Mimetismo Psi e Crânio de Aço: duração real ----------
function labPsiPassarDuracoesDoAtor_(t){
    if(!t)return;
    if(t.mimetismoPsiLab){
        let n=Number(t.mimetismoPsiLab.turnosRestantes);
        if(!Number.isFinite(n)||n<=0)n=PSI_TURNOS_POR_MINUTO_;
        n--;
        if(n<=0){
            t.mimetismoPsiLab=null;
            labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];
            labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${t.nome}: Mimetismo Psi terminou; sua aparência voltou ao normal.`});
            if(labEstado_.logLab.length>120)labEstado_.logLab.length=120;
        }else t.mimetismoPsiLab.turnosRestantes=n;
    }
    if(t.cranioAcoLab?.ativo){
        let n=Number(t.cranioAcoLab.turnosRestantes);
        if(!Number.isFinite(n)||n<=0)n=PSI_TURNOS_POR_MINUTO_;
        n--;
        if(n<=0)t.cranioAcoLab=null;
        else t.cranioAcoLab.turnosRestantes=n;
    }
}
const labEncerrarOportunidadeV46460_=window.labEncerrarOportunidade_;
window.labEncerrarOportunidade_=function(){
    const t=labTokenAtual_();
    labPsiPassarDuracoesDoAtor_(t);
    const r=labEncerrarOportunidadeV46460_();
    labSalvarLocal_();labAgendarSyncRemoto_();
    return r;
};

// ---------- Oficina de Mapas: motor detalhado ----------
let gmOficinaUndoV46460_=[],gmOficinaRedoV46460_=[];
function gmOficinaSnapshotV46460_(){
    return JSON.parse(JSON.stringify({desenhos:gmOficinaEstado_.desenhos||[],objetos:gmOficinaEstado_.objetos||[]}));
}
function gmOficinaHistoricoV46460_(){
    gmOficinaUndoV46460_.push(gmOficinaSnapshotV46460_());
    if(gmOficinaUndoV46460_.length>80)gmOficinaUndoV46460_.shift();
    gmOficinaRedoV46460_=[];
}
window.gmOficinaDesfazer_=function(){
    if(!gmOficinaUndoV46460_.length)return;
    gmOficinaRedoV46460_.push(gmOficinaSnapshotV46460_());
    const x=gmOficinaUndoV46460_.pop();gmOficinaEstado_.desenhos=x.desenhos;gmOficinaEstado_.objetos=x.objetos;
    gmOficinaPersistir_();gmOficinaRender_();
};
window.gmOficinaRefazer_=function(){
    if(!gmOficinaRedoV46460_.length)return;
    gmOficinaUndoV46460_.push(gmOficinaSnapshotV46460_());
    const x=gmOficinaRedoV46460_.pop();gmOficinaEstado_.desenhos=x.desenhos;gmOficinaEstado_.objetos=x.objetos;
    gmOficinaPersistir_();gmOficinaRender_();
};
window.gmOficinaAlternarGrade_=function(){
    gmOficinaEstado_.gradeVisivel=gmOficinaEstado_.gradeVisivel===false;
    gmOficinaPersistir_();gmOficinaRender_();
};
window.gmOficinaLimparPintura_=function(){
    if(!(gmOficinaEstado_.desenhos||[]).length)return;
    gmOficinaHistoricoV46460_();gmOficinaEstado_.desenhos=[];gmOficinaPersistir_();gmOficinaRender_();
};
window.gmOficinaCorRgb_=function(v){
    const m=String(v||'').match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);if(!m)return;
    const q=n=>Math.max(0,Math.min(255,Number(n)||0)).toString(16).padStart(2,'0');
    gmOficinaCorTraco_=`#${q(m[1])}${q(m[2])}${q(m[3])}`;
    const e=document.getElementById('gmOficinaCorTraco');if(e)e.value=gmOficinaCorTraco_;
};
window.gmOficinaAtualizarValores_=function(){
    const a=document.getElementById('gmOficinaEspValor'),b=document.getElementById('gmOficinaOpValor');
    if(a)a.textContent=String(Math.round(gmOficinaEspessura_));
    if(b)b.textContent=`${Math.round(gmOficinaOpacidade_*100)}%`;
};
window.gmOficinaRepetirAoLado_=function(){
    const objs=gmOficinaEstado_.objetos||[],ds=gmOficinaEstado_.desenhos||[];
    if(!objs.length&&!ds.length){notificar_('Nada para repetir na Oficina.','aviso');return;}
    gmOficinaHistoricoV46460_();
    if(objs.length){
        const cp=JSON.parse(JSON.stringify(objs[objs.length-1]));cp.id=`ofobj:${Date.now()}`;
        cp.x=Math.min(gmOficinaEstado_.larguraM,Number(cp.x||0)+1);objs.push(cp);
    }else{
        const cp=JSON.parse(JSON.stringify(ds[ds.length-1]));
        cp.pts=(cp.pts||[]).map(p=>({x:Math.min(gmOficinaEstado_.larguraM,p.x+1),y:p.y}));ds.push(cp);
    }
    gmOficinaPersistir_();gmOficinaRender_();
};

function gmOficinaInstalarControlesV46460_(){
    const root=document.getElementById('gm-sub-oficina-mapas');if(!root)return;
    const bar=root.querySelector('div[style*="align-items:end"]');if(!bar)return;
    const mk=html=>{const x=document.createElement('span');x.innerHTML=html.trim();return x.firstElementChild;};

    if(!document.getElementById('gmOficinaGradeBtn')){
        const grade=mk('<button id="gmOficinaGradeBtn" class="btn-small" style="height:42px" onclick="gmOficinaAlternarGrade_()"># Grade</button>');
        document.getElementById('gmOficinaGrade')?.parentElement?.after(grade);
    }
    if(!document.getElementById('gmOficinaRgb')){
        const rgb=mk('<label style="margin:0"><small>RGB</small><input id="gmOficinaRgb" type="text" value="255/207/77" placeholder="93/93/93" oninput="gmOficinaCorRgb_(this.value)" style="width:92px;margin:3px 0 0;padding:7px"></label>');
        document.getElementById('gmOficinaCorTraco')?.parentElement?.after(rgb);
    }
    const undo=[...bar.querySelectorAll('button')].find(b=>/Desfazer/.test(b.textContent||''));
    if(undo&&!document.getElementById('gmOficinaRefazerBtn')){
        undo.textContent='↶ Desfazer';
        undo.insertAdjacentHTML('afterend','<button id="gmOficinaRefazerBtn" class="btn-small" style="height:42px" onclick="gmOficinaRefazer_()">↷ Refazer</button>');
    }
    if(!document.getElementById('gmOficinaLimparPinturaBtn')){
        const objBtn=[...bar.querySelectorAll('button')].find(b=>/Objeto/.test(b.textContent||''));
        objBtn?.insertAdjacentHTML('afterend','<button class="btn-small" style="height:42px" onclick="gmOficinaRepetirAoLado_()">⧉ Repetir ao lado</button><button id="gmOficinaLimparPinturaBtn" class="btn-small" style="height:42px" onclick="gmOficinaLimparPintura_()">🗑️ Limpar pintura</button>');
    }
    const esp=document.getElementById('gmOficinaEsp');
    if(esp){esp.setAttribute('oninput','gmOficinaEspessura_=Number(this.value);gmOficinaAtualizarValores_()');if(!document.getElementById('gmOficinaEspValor'))esp.insertAdjacentHTML('afterend','<span id="gmOficinaEspValor" style="font-size:.78em;color:#bbb">7</span>');}
    const op=document.getElementById('gmOficinaOpacidade');
    if(op){op.setAttribute('oninput','gmOficinaOpacidade_=Number(this.value)/100;gmOficinaAtualizarValores_()');if(!document.getElementById('gmOficinaOpValor'))op.insertAdjacentHTML('afterend','<span id="gmOficinaOpValor" style="font-size:.78em;color:#bbb">100%</span>');}
    const gb=document.getElementById('gmOficinaGradeBtn');if(gb)gb.classList.toggle('btn-select',gmOficinaEstado_.gradeVisivel!==false);
    gmOficinaAtualizarValores_();
}

// Mesma lógica de pincéis e texturas usada pela Mesa principal.
function gmOficinaRenderDesenhosV46460_(){
    const cv=document.getElementById('gmOficinaDrawCanvas');if(!cv)return;
    const ppm=28,w=Math.round(gmOficinaEstado_.larguraM*ppm),h=Math.round(gmOficinaEstado_.alturaM*ppm);
    cv.width=w;cv.height=h;cv.style.width=`${w}px`;cv.style.height=`${h}px`;
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
    for(const st of gmOficinaEstado_.desenhos||[]){
        const pts=Array.isArray(st.pts)?st.pts:[];if(!pts.length)continue;
        const tool=st.tool||st.ferramenta||'traco',size=Math.max(1,Number(st.size||st.esp||6)),color=st.color||st.cor||'#ffcf4d';
        const opacity=Math.max(.02,Math.min(1,Number(st.opacity??st.opacidade??1)));
        const brush=st.brush||st.pincel||'redondo',texture=st.texture||st.textura||'solida';
        ctx.save();
        if(tool==='borracha'){
            ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.strokeStyle='#000';ctx.lineWidth=size;
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);ctx.stroke();ctx.restore();continue;
        }
        ctx.globalAlpha=opacity;ctx.fillStyle=color;ctx.strokeStyle=color;
        if(texture!=='solida')labDesenhoAplicarTextura_(ctx,texture,pts,0,size,color,ppm,brush);
        else if(brush==='spray'){
            for(let j=0;j<pts.length;j++){const p=pts[j],cx=p.x*ppm,cy=p.y*ppm,dots=Math.max(5,Math.round(size*.85));for(let k=0;k<dots;k++){const a=labDesenhoRand_(j*97+k*13)*Math.PI*2,r=Math.sqrt(labDesenhoRand_(j*193+k*29))*size*.82,rr=Math.max(.7,size*(.05+.07*labDesenhoRand_(j*71+k*41)));ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,rr,0,Math.PI*2);ctx.fill();}}
        }else if(brush==='quadrado'){for(const p of pts)ctx.fillRect(p.x*ppm-size/2,p.y*ppm-size/2,size,size);}
        else if(brush==='irregular'){
            ctx.lineWidth=size;ctx.beginPath();pts.forEach((p,j)=>{const wob=size*.7,x=p.x*ppm+(labDesenhoRand_(j*151+3)-.5)*wob,y=p.y*ppm+(labDesenhoRand_(j*211+9)-.5)*wob;j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
        }else{
            ctx.lineWidth=brush==='caligrafico'?Math.max(1,size*.42):size;ctx.lineCap=brush==='caligrafico'?'butt':'round';
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);ctx.stroke();
        }
        ctx.restore();
    }
}

window.gmOficinaRender_=function(){
    if(!batalhaEhMestre_())return;
    gmOficinaInstalarControlesV46460_();gmOficinaPopularObjetos_();
    const box=document.getElementById('gmOficinaMapa');if(!box)return;
    const ppm=28,w=gmOficinaEstado_.larguraM*ppm,h=gmOficinaEstado_.alturaM*ppm,g=gmOficinaEstado_.corGrade;
    const objs=(gmOficinaEstado_.objetos||[]).map(o=>{const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(o.modeloId)),img=o.imagem||m?.imagem||'',ow=Math.max(18,Number(o.larguraM||1)*ppm),oh=Math.max(18,Number(o.alturaM||1)*ppm);return `<div data-gm-of-obj="${escaparHtmlInventario_(o.id)}" onpointerdown="gmOficinaArrastarObjeto_(event,'${String(o.id).replace(/'/g,"\\'")}')" style="position:absolute;left:${o.x*ppm-ow/2}px;top:${o.y*ppm-oh/2}px;width:${ow}px;height:${oh}px;cursor:grab;touch-action:none;z-index:5">${img?`<img src="${img}" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none">`:'🧱'}</div>`;}).join('');
    const grid=gmOficinaEstado_.gradeVisivel===false?'none':`linear-gradient(to right,${g} 1px,transparent 1px),linear-gradient(to bottom,${g} 1px,transparent 1px)`;
    box.innerHTML=`<div id="gmOficinaCanvas" onpointerdown="gmOficinaPointerDown_(event)" style="position:relative;width:${w}px;height:${h}px;background-color:${gmOficinaEstado_.fundo};background-image:${grid};background-size:${ppm}px ${ppm}px;overflow:hidden;touch-action:none;"><canvas id="gmOficinaDrawCanvas" style="position:absolute;inset:0;z-index:2;pointer-events:none"></canvas>${objs}</div>`;
    gmOficinaRenderDesenhosV46460_();
    const b=document.getElementById('gmOficinaDesenharBtn');if(b)b.classList.toggle('btn-select',gmOficinaDesenhando_);
    const bg=document.getElementById('gmOficinaFundo'),gr=document.getElementById('gmOficinaGrade');if(bg)bg.value=gmOficinaEstado_.fundo;if(gr)gr.value=gmOficinaEstado_.corGrade;
    const st=document.getElementById('gmOficinaStatus');if(st)st.textContent=`Rascunho privado · ${(gmOficinaEstado_.desenhos||[]).length} traços · ${(gmOficinaEstado_.objetos||[]).length} objetos`;
};

window.gmOficinaPointerDown_=function(ev){
    if(!gmOficinaDesenhando_||ev.button===2||ev.target!==ev.currentTarget)return;
    ev.preventDefault();gmOficinaHistoricoV46460_();
    const el=ev.currentTarget,r=el.getBoundingClientRect(),ppm=28;
    const pt=e=>({x:Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-r.left)/ppm)),y:Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-r.top)/ppm))});
    gmOficinaTraçoAtual_={tool:gmOficinaFerramentaAtual_,color:gmOficinaCorTraco_,size:gmOficinaEspessura_,opacity:gmOficinaOpacidade_,brush:gmOficinaPincel_,texture:gmOficinaTexturaTraco_,pts:[pt(ev)]};
    gmOficinaEstado_.desenhos.push(gmOficinaTraçoAtual_);
    let raf=0;
    const mv=e=>{gmOficinaTraçoAtual_.pts.push(pt(e));if(!raf)raf=requestAnimationFrame(()=>{raf=0;gmOficinaRenderDesenhosV46460_();});};
    const up=()=>{window.removeEventListener('pointermove',mv);if(raf)cancelAnimationFrame(raf);gmOficinaTraçoAtual_=null;gmOficinaPersistir_();gmOficinaRender_();};
    window.addEventListener('pointermove',mv,{passive:true});window.addEventListener('pointerup',up,{once:true});
};

// Acrescenta histórico ao inserir/arrastar objeto sem substituir a lógica atual.
const gmOficinaAdicionarObjetoV46460_=window.gmOficinaAdicionarObjeto_;
window.gmOficinaAdicionarObjeto_=function(){gmOficinaHistoricoV46460_();return gmOficinaAdicionarObjetoV46460_();};
const gmOficinaArrastarObjetoV46460_=window.gmOficinaArrastarObjeto_;
window.gmOficinaArrastarObjeto_=function(ev,id){gmOficinaHistoricoV46460_();return gmOficinaArrastarObjetoV46460_(ev,id);};

// ---------- Laser ----------
let labUltimoEfeitoVisualId_='';
function labTipoVisualArma_(item){
    const txt=normalizarTextoCombate_([item?.id,item?.nome,item?.nome_en,item?.categoria,item?.tipo,item?.municao].filter(Boolean).join(' '));
    return /laser/.test(txt)?'laser':'';
}
function labCorVisualArma_(item){
    const txt=normalizarTextoCombate_([item?.id,item?.nome,item?.nome_en].filter(Boolean).join(' '));
    if(/pesad|heavy/.test(txt))return '#ff3030';
    if(/rifle|carabina/.test(txt))return '#ff4545';
    return '#ff2d2d';
}
function labDispararEfeitoVisualAtaque_(atacante,alvo,item,acertou,grau){
    if(!labTipoVisualArma_(item)||!atacante||!alvo)return;
    labEstado_.efeitoVisualLab={id:`fx:${Date.now()}:${Math.random().toString(36).slice(2,7)}`,
      x1:Number(atacante.x||0),y1:Number(atacante.y||0),x2:Number(alvo.x||0),y2:Number(alvo.y||0),
      cor:labCorVisualArma_(item),acertou:!!acertou,grau:String(grau||''),ts:Date.now()};
    labSalvarLocal_();labAgendarSyncRemoto_();labRenderEfeitoVisualAtaque_();
}
function labRenderEfeitoVisualAtaque_(){
    if(labReducing_)return;
    const fx=labEstado_.efeitoVisualLab,map=document.getElementById('labMetricMap');if(!fx||!map||String(fx.id)===labUltimoEfeitoVisualId_)return;
    if(Date.now()-Number(fx.ts||0)>4000){labUltimoEfeitoVisualId_=String(fx.id);return;}
    labUltimoEfeitoVisualId_=String(fx.id);
    const ppm=Number(labEstado_.pxPorMetro||48),x1=Number(fx.x1||0)*ppm,y1=Number(fx.y1||0)*ppm,x2=Number(fx.x2||0)*ppm,y2=Number(fx.y2||0)*ppm;
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*180/Math.PI,cor=fx.cor||'#ff2d2d';
    const beam=document.createElement('div');beam.className='lab-laser-beam';beam.style.left=`${x1}px`;beam.style.top=`${y1}px`;beam.style.width=`${len}px`;beam.style.transform=`rotate(${ang}deg)`;beam.style.background=cor;beam.style.color=cor;beam.innerHTML='<div class="lab-laser-core"></div>';map.appendChild(beam);
    const impact=document.createElement('div');impact.className='lab-laser-impact';impact.style.left=`${x2}px`;impact.style.top=`${y2}px`;impact.style.color=cor;impact.style.borderColor=cor;map.appendChild(impact);
    setTimeout(()=>{beam.remove();impact.remove();},520);
}

// Garante que clientes remotos renderizem o disparo recebido por sincronização.
const labRenderV46460_=labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.47.2 — correções reais: Força Bruta, laser e Oficina V2
// ============================================================

// ---------- 1) Força Bruta sempre disponível para mover objetos ----------
const labPericiaRegexV46461_ = labPericiaRegex_;
labPericiaRegex_ = function(t,re){
    const achou = labPericiaRegexV46461_(t,re);
    if(achou) return achou;
    // Perícias básicas continuam utilizáveis mesmo sem treino explícito.
    const banco = (periciasDB||[]).find(p=>re.test(normalizarTextoCombate_(`${p.id||''} ${getNome(p)||''}`)));
    if(banco) return banco;
    // Fallback defensivo específico para a perícia geral de força.
    if(re.test('forca bruta força bruta brute force 蛮力')){
        return {id:'forca_bruta',nome:'Força Bruta',nome_en:'Brute Force',nome_zh:'蛮力',tipo:'Básica',formula:'FOR+TAM',penalidadeArmadura:1};
    }
    return null;
};

// ---------- 2) Laser: não renderizar antes do rerender do mapa ----------
labDispararEfeitoVisualAtaque_ = function(atacante,alvo,item,acertou,grau){
    if(!labTipoVisualArma_(item)||!atacante||!alvo)return;
    labEstado_.efeitoVisualLab={
      id:`fx:${Date.now()}:${Math.random().toString(36).slice(2,7)}`,
      x1:Number(atacante.x||0),y1:Number(atacante.y||0),
      x2:Number(alvo.x||0),y2:Number(alvo.y||0),
      cor:labCorVisualArma_(item),acertou:!!acertou,grau:String(grau||''),ts:Date.now()
    };
    // Não chama labRenderEfeitoVisualAtaque_ aqui: o mapa ainda será rerenderizado
    // pela resolução do ataque e destruiria o feixe imediatamente.
    labSalvarLocal_();labAgendarSyncRemoto_();
};

// ---------- 3) Teste geral: básicas + profissionais investidas, sem armas ----------
labPericiasTeste_ = function(t){
    const c=labCharToken_(t);if(!c)return [];
    const out=[],vistos=new Set();
    const add=p=>{
        if(!p?.id||vistos.has(String(p.id)))return;
        const nome=normalizarTextoCombate_(`${p.id||''} ${getNome(p)||''}`);
        const tipo=normalizarTextoCombate_(p.tipo||'');
        if(/primeiros socorros|first aid|急救/.test(nome))return;
        if(/combate|combat/.test(tipo))return;
        if((especializacoesDB||[]).some(e=>String(e.id)===String(p.id)))return;
        vistos.add(String(p.id));out.push(p);
    };
    for(const p of (periciasDB||[])){
        if(p.disponivelCampanha===false)continue;
        const reg=c?.pericias?.[p.id];
        const tipo=normalizarTextoCombate_(p.tipo||'');
        const basica=/basica|basic|básica/.test(tipo);
        if(basica||totalTreinoPericia_(reg)>0)add(p);
    }
    // Registros antigos/internos investidos ainda podem ser testados se não forem combate.
    for(const [id,reg] of Object.entries(c?.pericias||{})){
        if(totalTreinoPericia_(reg)<=0||vistos.has(String(id)))continue;
        const p=(periciasDB||[]).find(x=>String(x.id)===String(id));
        if(p)add(p);
    }
    return out.sort((a,b)=>getNome(a).localeCompare(getNome(b),'pt'));
};
window.labAbrirTeste_=function(){
    const t=labTokenAtual_();if(!t||t.primeirosSocorrosLab)return;
    const ps=labPericiasTeste_(t);
    if(!ps.length){notificar_('Nenhuma perícia geral disponível para este personagem.','aviso',3200);return;}
    t.acaoAuxLab={tipo:'teste_pericia',periciaToken:batalhaTokenPericia_(ps[0])};
    labSalvarLocal_();labRender_();
};

// ---------- 4) Oficina de Mapas V2: implementação isolada e funcional ----------
let gmOficinaV2Undo_=[];
let gmOficinaV2Redo_=[];
let gmOficinaV2Stroke_=null;
let gmOficinaV2Raf_=0;

function gmOficinaV2Snapshot_(){
    return gmOficinaV2SnapshotEstado_(gmOficinaEstado_);
}
function gmOficinaV2Historico_(){
    gmOficinaV2Undo_.push(gmOficinaV2Snapshot_());
    if(gmOficinaV2Undo_.length>80)gmOficinaV2Undo_.shift();
    gmOficinaV2Redo_=[];
}
function gmOficinaV2Background_(){
    return gmOficinaV2BackgroundEstado_(gmOficinaEstado_);
}
function gmOficinaV2DesenharCanvas_(){
    const cv=document.getElementById('gmOficinaV2Canvas');if(!cv)return;
    const ppm=32,w=Math.round(gmOficinaEstado_.larguraM*ppm),h=Math.round(gmOficinaEstado_.alturaM*ppm);
    if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';

    for(const st of (gmOficinaEstado_.desenhos||[])){
        const pts=Array.isArray(st.pts)?st.pts:[];if(!pts.length)continue;
        const tool=st.tool||st.ferramenta||'traco';
        const size=Math.max(1,Number(st.size||st.esp||7));
        const color=st.color||st.cor||'#ffcf4d';
        const opacity=Math.max(.02,Math.min(1,Number(st.opacity??st.opacidade??1)));
        const brush=st.brush||st.pincel||'redondo';
        const texture=st.texture||st.textura||'solida';
        ctx.save();
        if(tool==='borracha'){
            ctx.globalCompositeOperation='destination-out';
            ctx.globalAlpha=1;ctx.strokeStyle='#000';ctx.lineWidth=size;
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
                    const rr=Math.max(.7,size*(.05+.07*labDesenhoRand_(j*71+k*41)));
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
            ctx.lineWidth=brush==='caligrafico'?Math.max(1,size*.42):size;
            ctx.lineCap=brush==='caligrafico'?'butt':'round';
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);
            for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);
            if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);
            ctx.stroke();
        }
        ctx.restore();
    }
}
function gmOficinaV2PopularObjetos_(){
    const sel=document.getElementById('gmOficinaV2Objeto');if(!sel)return;
    const atual=sel.value;
    sel.innerHTML='<option value="">— objeto do banco —</option>'+
      [...(objetosMapaDB||[])].sort((a,b)=>getNome(a).localeCompare(getNome(b))).map(o=>
        `<option value="${escaparHtmlInventario_(o.id)}">${escaparHtmlInventario_(getNome(o))}</option>`).join('');
    if([...sel.options].some(o=>o.value===atual))sel.value=atual;
}
function gmOficinaV2RenderObjetos_(){
    const layer=document.getElementById('gmOficinaV2Objects');if(!layer)return;
    const ppm=32;
    layer.innerHTML=(gmOficinaEstado_.objetos||[]).map(o=>{
        const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(o.modeloId)),img=o.imagem||m?.imagem||'';
        const w=Math.max(18,Number(o.larguraM||1)*ppm),h=Math.max(18,Number(o.alturaM||1)*ppm);
        return `<div data-of2="${escaparHtmlInventario_(o.id)}" onpointerdown="gmOficinaV2ArrastarObjeto_(event,'${String(o.id).replace(/'/g,"\\'")}')" style="position:absolute;left:${o.x*ppm-w/2}px;top:${o.y*ppm-h/2}px;width:${w}px;height:${h}px;z-index:8;cursor:${gmOficinaV2Cfg_.ativo?'default':'grab'};touch-action:none">${img?`<img src="${img}" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none">`:'🧱'}</div>`;
    }).join('');
}
function gmOficinaV2Status_(){
    const e=document.getElementById('gmOficinaV2Status');if(e)e.textContent=
      `Privado · ${gmOficinaEstado_.larguraM} × ${gmOficinaEstado_.alturaM} m · ${(gmOficinaEstado_.desenhos||[]).length} traços · ${(gmOficinaEstado_.objetos||[]).length} objetos`;
}
function gmOficinaV2ConstruirUI_(){
    const root=document.getElementById('gm-sub-oficina-mapas');if(!root)return false;
    root.innerHTML=`
      <div id="gmOficinaV2Shell" style="padding:4px 0 10px;">
        <h3 style="margin:0 0 5px;color:#8ee7ff">🗺️ Oficina de Mapas</h3>
        <div style="color:#aeb7c8;margin-bottom:10px">Editor privado do mestre. Usa o mesmo formato de desenho da Mesa da Mesa; mapas salvos aqui podem ser carregados normalmente depois.</div>

        <div id="gmOficinaV2TopActions" style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px">
          <button class="btn-small" onclick="gmOficinaV2Novo_()">🆕 Novo</button>
          <button class="btn-small btn-select" onclick="gmOficinaSalvarComoMapa_()">💾 Salvar na biblioteca</button>
          <button class="btn-small" onclick="gmOficinaPublicarMesa_()">📡 Publicar na Mesa</button>
        </div>

        <div id="gmOficinaV2Viewport" style="overflow:auto;max-width:100%;min-height:520px;padding:10px;border:1px solid rgba(126,231,255,.25);border-radius:12px;background:rgba(0,0,0,.20)">
          <div id="gmOficinaV2Map" style="position:relative;touch-action:none">
            <canvas id="gmOficinaV2Canvas" onpointerdown="gmOficinaV2PointerDown_(event)" style="position:absolute;inset:0;z-index:3;touch-action:none"></canvas>
            <div id="gmOficinaV2Objects" style="position:absolute;inset:0;z-index:8;pointer-events:none"></div>
          </div>
        </div>

        <div id="gmOficinaV2Status" style="margin-top:8px;color:#9fc6d8;font-size:.86em"></div>
      </div>`;
    return true;
}
function gmOficinaV2SyncUI_(){
    const size=document.getElementById('gmOficinaV2Size');if(size){const v=`${gmOficinaEstado_.larguraM}x${gmOficinaEstado_.alturaM}`;if([...size.options].some(o=>o.value===v))size.value=v;}
    const f=document.getElementById('gmOficinaV2Fundo');if(f)f.value=gmOficinaEstado_.fundo||'#d7d7d7';
    const g=document.getElementById('gmOficinaV2GradeCor');if(g)g.value=gmOficinaEstado_.corGrade||'#777777';
    const gv=document.getElementById('gmOficinaV2GradeVis');if(gv)gv.checked=gmOficinaEstado_.gradeVisivel!==false;
    const tr=document.getElementById('gmOficinaV2Terreno');if(tr)tr.value=gmOficinaEstado_.textura||'nenhuma';
    const db=document.getElementById('gmOficinaV2DrawBtn');if(db){db.classList.toggle('btn-select',gmOficinaV2Cfg_.ativo);db.textContent=gmOficinaV2Cfg_.ativo?'✅ Desenhando':'✏️ Desenhar';}
    const tool=document.getElementById('gmOficinaV2Tool');if(tool)tool.value=gmOficinaV2Cfg_.ferramenta;
    const col=document.getElementById('gmOficinaV2Color');if(col)col.value=gmOficinaV2Cfg_.cor;
    const rgb=document.getElementById('gmOficinaV2Rgb');if(rgb&&document.activeElement!==rgb)rgb.value=gmOficinaV2CorRgb_(gmOficinaV2Cfg_.cor);
    const bs=document.getElementById('gmOficinaV2BrushSize');if(bs)bs.value=gmOficinaV2Cfg_.tamanho;
    const bsv=document.getElementById('gmOficinaV2BrushSizeVal');if(bsv)bsv.textContent=String(gmOficinaV2Cfg_.tamanho);
    const op=document.getElementById('gmOficinaV2Opacity');if(op)op.value=Math.round(gmOficinaV2Cfg_.opacidade*100);
    const opv=document.getElementById('gmOficinaV2OpacityVal');if(opv)opv.textContent=`${Math.round(gmOficinaV2Cfg_.opacidade*100)}%`;
    const br=document.getElementById('gmOficinaV2Brush');if(br)br.value=gmOficinaV2Cfg_.pincel;
    const st=document.getElementById('gmOficinaV2StrokeTexture');if(st)st.value=gmOficinaV2Cfg_.texturaTraco;
}
window.gmOficinaRender_=function(){
    if(!batalhaEhMestre_())return;
    if(!document.getElementById('gmOficinaV2Map'))gmOficinaV2ConstruirUI_();
    const ppm=32,map=document.getElementById('gmOficinaV2Map');
    if(!map)return;
    const w=Math.round(gmOficinaEstado_.larguraM*ppm),h=Math.round(gmOficinaEstado_.alturaM*ppm);
    map.style.width=`${w}px`;map.style.height=`${h}px`;map.style.backgroundColor=gmOficinaEstado_.fundo||'#d7d7d7';
    map.style.backgroundImage=gmOficinaV2Background_();map.style.backgroundSize=`${ppm}px ${ppm}px`;
    const cv=document.getElementById('gmOficinaV2Canvas');if(cv){cv.style.width=`${w}px`;cv.style.height=`${h}px`;cv.style.pointerEvents=gmOficinaV2Cfg_.ativo?'auto':'none';cv.style.cursor=gmOficinaV2Cfg_.ferramenta==='borracha'?'cell':gmOficinaV2Cfg_.ativo?'crosshair':'default';}
    const layer=document.getElementById('gmOficinaV2Objects');if(layer){layer.style.width=`${w}px`;layer.style.height=`${h}px`;layer.style.pointerEvents='none';}
    gmOficinaV2DesenharCanvas_();gmOficinaV2RenderObjetos_();gmOficinaV2PopularObjetos_();gmOficinaV2SyncUI_();gmOficinaV2Status_();
};

window.gmOficinaV2Toggle_=function(){gmOficinaV2Cfg_.ativo=!gmOficinaV2Cfg_.ativo;if(gmOficinaV2Cfg_.ativo&&gmOficinaV2Cfg_.ferramenta==='borracha')gmOficinaV2Cfg_.ferramenta='traco';gmOficinaRender_();};
window.gmOficinaV2Tool_=function(v){gmOficinaV2Cfg_.ferramenta=['traco','textura','borracha'].includes(String(v))?String(v):'traco';gmOficinaV2Cfg_.ativo=true;gmOficinaRender_();};
window.gmOficinaV2Color_=function(v){gmOficinaV2Cfg_.cor=String(v||'#ffcf4d');gmOficinaV2SyncUI_();};
window.gmOficinaV2Rgb_=function(v){const m=String(v||'').match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);if(!m)return;gmOficinaV2Cfg_.cor=gmOficinaV2Hex_(m[1],m[2],m[3]);gmOficinaV2SyncUI_();};
window.gmOficinaV2BrushSize_=function(v){gmOficinaV2Cfg_.tamanho=Math.max(2,Math.min(48,Number(v)||7));gmOficinaV2SyncUI_();};
window.gmOficinaV2Opacity_=function(v){gmOficinaV2Cfg_.opacidade=Math.max(.05,Math.min(1,(Number(v)||100)/100));gmOficinaV2SyncUI_();};
window.gmOficinaV2Brush_=function(v){gmOficinaV2Cfg_.pincel=['redondo','quadrado','spray','irregular','caligrafico'].includes(String(v))?String(v):'redondo';gmOficinaV2Cfg_.ativo=true;gmOficinaRender_();};
window.gmOficinaV2StrokeTexture_=function(v){gmOficinaV2Cfg_.texturaTraco=['solida','pontilhada','giz','ranhura','areia','cascalho','grama','folhas','neve','fumaca'].includes(String(v))?String(v):'solida';gmOficinaV2Cfg_.ativo=true;gmOficinaRender_();};
window.gmOficinaV2Tamanho_=function(v){const m=String(v||'').match(/^(\d+)x(\d+)$/);if(!m)return;gmOficinaEstado_.larguraM=Number(m[1]);gmOficinaEstado_.alturaM=Number(m[2]);gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2Fundo_=function(v){gmOficinaEstado_.fundo=String(v||'#d7d7d7');gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2GradeCor_=function(v){gmOficinaEstado_.corGrade=String(v||'#777777');gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2GradeVis_=function(v){gmOficinaEstado_.gradeVisivel=!!v;gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2Terreno_=function(v){gmOficinaEstado_.textura=String(v||'nenhuma');gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2Undo_=function(){if(!gmOficinaV2Undo_.length)return;gmOficinaV2Redo_.push(gmOficinaV2Snapshot_());const x=gmOficinaV2Undo_.pop();gmOficinaEstado_.desenhos=x.desenhos;gmOficinaEstado_.objetos=x.objetos;gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2Redo_=function(){if(!gmOficinaV2Redo_.length)return;gmOficinaV2Undo_.push(gmOficinaV2Snapshot_());const x=gmOficinaV2Redo_.pop();gmOficinaEstado_.desenhos=x.desenhos;gmOficinaEstado_.objetos=x.objetos;gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2Clear_=function(){if(!(gmOficinaEstado_.desenhos||[]).length)return;gmOficinaV2Historico_();gmOficinaEstado_.desenhos=[];gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2Novo_=function(){if(!confirm('Limpar o rascunho privado da Oficina?'))return;gmOficinaEstado_={larguraM:28,alturaM:14,fundo:'#d7d7d7',corGrade:'#777777',gradeVisivel:true,textura:'nenhuma',objetos:[],desenhos:[]};gmOficinaV2Undo_=[];gmOficinaV2Redo_=[];gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2AddObjeto_=function(){const id=document.getElementById('gmOficinaV2Objeto')?.value,m=(objetosMapaDB||[]).find(x=>String(x.id)===String(id));if(!m)return;gmOficinaV2Historico_();gmOficinaEstado_.objetos.push({...JSON.parse(JSON.stringify(m)),id:`ofobj:${Date.now()}:${Math.random().toString(36).slice(2,5)}`,modeloId:m.id,x:gmOficinaEstado_.larguraM/2,y:gmOficinaEstado_.alturaM/2,angulo:0});gmOficinaPersistir_();gmOficinaRender_();};
window.gmOficinaV2Repeat_=function(){const objs=gmOficinaEstado_.objetos||[],ds=gmOficinaEstado_.desenhos||[];if(!objs.length&&!ds.length)return;gmOficinaV2Historico_();if(objs.length){const cp=JSON.parse(JSON.stringify(objs[objs.length-1]));cp.id=`ofobj:${Date.now()}`;cp.x=Math.min(gmOficinaEstado_.larguraM,Number(cp.x||0)+1);objs.push(cp);}else{const cp=JSON.parse(JSON.stringify(ds[ds.length-1]));cp.pts=(cp.pts||[]).map(p=>({x:Math.min(gmOficinaEstado_.larguraM,p.x+1),y:p.y}));ds.push(cp);}gmOficinaPersistir_();gmOficinaRender_();};

window.gmOficinaV2PointerDown_=function(ev){
    if(!gmOficinaV2Cfg_.ativo||ev.button===2)return;
    ev.preventDefault();ev.stopPropagation();gmOficinaV2Historico_();
    const cv=document.getElementById('gmOficinaV2Canvas'),rect=cv.getBoundingClientRect(),ppm=32;
    const ponto=e=>({x:Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-rect.left)/ppm)),y:Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-rect.top)/ppm))});
    gmOficinaV2Stroke_={tool:gmOficinaV2Cfg_.ferramenta,color:gmOficinaV2Cfg_.cor,size:gmOficinaV2Cfg_.tamanho,opacity:gmOficinaV2Cfg_.opacidade,brush:gmOficinaV2Cfg_.pincel,texture:gmOficinaV2Cfg_.texturaTraco,pts:[ponto(ev)]};
    gmOficinaEstado_.desenhos.push(gmOficinaV2Stroke_);
    const move=e=>{
        const p=ponto(e),ant=gmOficinaV2Stroke_.pts[gmOficinaV2Stroke_.pts.length-1];
        const dx=(p.x-ant.x)*ppm,dy=(p.y-ant.y)*ppm;
        if(dx*dx+dy*dy<2.25)return;
        gmOficinaV2Stroke_.pts.push(p);
        if(!gmOficinaV2Raf_)gmOficinaV2Raf_=requestAnimationFrame(()=>{gmOficinaV2Raf_=0;gmOficinaV2DesenharCanvas_();});
    };
    const up=()=>{
        window.removeEventListener('pointermove',move);
        if(gmOficinaV2Raf_){cancelAnimationFrame(gmOficinaV2Raf_);gmOficinaV2Raf_=0;}
        gmOficinaV2Stroke_=null;gmOficinaPersistir_();gmOficinaV2DesenharCanvas_();gmOficinaV2Status_();
    };
    window.addEventListener('pointermove',move,{passive:false});
    window.addEventListener('pointerup',up,{once:true});
};
window.gmOficinaV2ArrastarObjeto_=function(ev,id){
    if(gmOficinaV2Cfg_.ativo)return;
    ev.preventDefault();ev.stopPropagation();gmOficinaV2Historico_();
    const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id)),map=document.getElementById('gmOficinaV2Map');
    if(!o||!map)return;const rect=map.getBoundingClientRect(),ppm=32,node=map.querySelector(`[data-of2="${CSS.escape(String(id))}"]`);
    const move=e=>{
        o.x=Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-rect.left)/ppm));
        o.y=Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-rect.top)/ppm));
        if(node){const w=node.offsetWidth,h=node.offsetHeight;node.style.left=`${o.x*ppm-w/2}px`;node.style.top=`${o.y*ppm-h/2}px`;}
    };
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();gmOficinaV2Status_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};

// Salva e publica exatamente o terreno produzido pela Oficina V2.
window.gmOficinaSalvarComoMapa_=async function(){
    if(!batalhaEhMestre_())return;
    const nome=prompt('Nome do mapa preparado:','');if(nome==null||!String(nome).trim())return;
    let id=labMapaSlug_(nome),base=id,n=2;while((mapasDB||[]).some(m=>String(m.id)===String(id)))id=`${base}_${n++}`;
    const dados={id,nome:String(nome).trim(),larguraM:gmOficinaEstado_.larguraM,alturaM:gmOficinaEstado_.alturaM,fundo:gmOficinaEstado_.fundo,corGrade:gmOficinaEstado_.corGrade,gradeVisivel:gmOficinaEstado_.gradeVisivel!==false,textura:gmOficinaEstado_.textura||'nenhuma',desenhos:JSON.parse(JSON.stringify(gmOficinaEstado_.desenhos||[])),objetos:JSON.parse(JSON.stringify(gmOficinaEstado_.objetos||[])),criadoPor:currentUserUid||'',atualizadoEm:new Date().toISOString()};
    try{const salvo=await labMapaSalvarFirestore_(dados,0);mapasDB.push(salvo);labAtualizarSelectMapas_();if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();notificar_(`Mapa “${dados.nome}” salvo na biblioteca.`,'sucesso',3500);}catch(e){console.error(e);notificar_('Não foi possível salvar o mapa preparado.','erro');}
};
window.gmOficinaPublicarMesa_=function(){
    if(!batalhaEhMestre_())return;if(!confirm('Publicar este terreno na Mesa ao Vivo? Participantes serão mantidos.'))return;
    labEstado_.larguraM=gmOficinaEstado_.larguraM;labEstado_.alturaM=gmOficinaEstado_.alturaM;labEstado_.fundo=gmOficinaEstado_.fundo;labEstado_.corGrade=gmOficinaEstado_.corGrade;labEstado_.gradeVisivel=gmOficinaEstado_.gradeVisivel!==false;labEstado_.textura=gmOficinaEstado_.textura||'nenhuma';labEstado_.desenhosLab=JSON.parse(JSON.stringify(gmOficinaEstado_.desenhos||[]));labEstado_.objetosLab=JSON.parse(JSON.stringify(gmOficinaEstado_.objetos||[])).map(o=>({...o,id:String(o.id).startsWith('obj:')?o.id:`obj:${Date.now()}:${Math.random().toString(36).slice(2,6)}`}));
    labSalvarLocal_();labRender_();notificar_('Terreno da Oficina publicado na Mesa ao Vivo.','sucesso',3500);
};

// O layer de objetos precisa receber ponteiro apenas nos objetos.
const gmOficinaV2RenderObjetosBase_=gmOficinaV2RenderObjetos_;
gmOficinaV2RenderObjetos_=function(){
    gmOficinaV2RenderObjetosBase_();
    document.querySelectorAll('#gmOficinaV2Objects [data-of2]').forEach(n=>n.style.pointerEvents='auto');
};

// Renderiza o laser depois que o mapa terminou de ser recriado.
const labRenderV46461_ = labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.47.2 — painel compacto, escala da Oficina, armas corretas,
//             mapa estável e laser realmente visível
// ============================================================

// ---------- Painel do Mapa da Mesa mais limpo ----------
function labCompactarPainelMesaV46462_(){
    const root=document.getElementById('laboratorio-combate');if(!root)return;

    // Texto descritivo superior não precisa ocupar espaço durante o uso.
    const p=root.querySelector('.form-section > div:first-child p');
    if(p)p.style.display='none';

    // Em preparação, não exibe banner explicativo permanente.
    const status=document.getElementById('labCombatStatus');
    if(status && labEstado_.fase!=='combate'){
        status.style.display='none';
        status.innerHTML='';
    }else if(status){
        status.style.display='';
    }

    // A caixa "Clique num token..." só existe quando há informação útil.
    const info=document.getElementById('labInfo');
    if(info){
        const sel=labEstado_.tokens?.find(x=>String(x.id)===String(labEstado_.selecionadoId));
        info.style.display='flex';
    }

    const controls=document.getElementById('labMasterGameControls');
    const loader=document.getElementById('labMasterMapLoader');
    if(controls && loader && loader.parentElement){
        const label=loader.querySelector('label');
        if(label && label.parentElement!==controls){
            label.style.margin='0';
            controls.appendChild(label);
        }
        loader.querySelectorAll('button').forEach(b=>b.remove());
        loader.style.display='none';
    }

    // Escala e Editar mapa na mesma faixa dos controles do mestre.
    const zoom=document.getElementById('labZoom')?.closest('label');
    const edit=document.getElementById('labEditMapToggleWrap');
    if(controls && zoom && zoom.parentElement!==controls)controls.appendChild(zoom);
    if(controls && edit && edit.parentElement!==controls)controls.appendChild(edit);

    // Textos mais curtos.
    const restaurar=[...(controls?.querySelectorAll('button')||[])].find(b=>/Restaurar participantes/.test(b.textContent||''));
    if(restaurar)restaurar.textContent='♻️ Restaurar';
    const limpar=[...(controls?.querySelectorAll('button')||[])].find(b=>/Limpar mesa/.test(b.textContent||''));
    if(limpar)limpar.textContent='🧹 Limpar';
}
const labAtualizarStatusCombateV46462_=labAtualizarStatusCombate_;
labAtualizarStatusCombate_=function(){
    labAtualizarStatusCombateV46462_();
    labCompactarPainelMesaV46462_();
};
const labAtualizarInfoV46462_=labAtualizarInfo_;
labAtualizarInfo_=function(){
    labAtualizarInfoV46462_();
    labCompactarPainelMesaV46462_();
};

// Selecionar mapa já carrega automaticamente.
const labSelecionarMapaSalvoV46462_=window.labSelecionarMapaSalvo_;
window.labSelecionarMapaSalvo_=function(id){
    labSelecionarMapaSalvoV46462_(id);
    if(String(id||''))setTimeout(()=>labCarregarMapaBanco_(),0);
};

// ---------- Armas coerentes com a perícia ----------
const batalhaEquipamentosV46462_=batalhaEquipamentos_;
batalhaEquipamentos_=function(char,pericia,selecionado=''){
    const lista=batalhaEquipamentosV46462_(char,pericia,selecionado);
    if(!pericia)return lista;
    // Se a perícia é de ataque à distância, armas corpo a corpo nunca entram,
    // mesmo com penalidade de compatibilidade.
    return lista.filter(op=>{
        if(!op?.item)return true;
        return equipamentoCompativelComPericia_(op.item,pericia);
    });
};

// ---------- Oficina: escala visual verdadeira ----------
function gmOficinaV2Ppm_(){
    return Math.max(18,Math.min(72,Number(gmOficinaEstado_.escalaPxM||32)));
}
function gmOficinaV2InstalarEscala_(){
    if(document.getElementById('gmOficinaV2Scale'))return;
    const size=document.getElementById('gmOficinaV2Size')?.parentElement;
    if(!size)return;
    size.insertAdjacentHTML('afterend',`
      <label style="margin:0"><small>Escala</small>
        <select id="gmOficinaV2Scale" onchange="gmOficinaV2Escala_(this.value)" style="margin:3px 0 0">
          <option value="24">24 px/m</option>
          <option value="32">32 px/m</option>
          <option value="40">40 px/m</option>
          <option value="48">48 px/m</option>
          <option value="60">60 px/m</option>
        </select>
      </label>`);
}
window.gmOficinaV2Escala_=function(v){
    gmOficinaEstado_.escalaPxM=Math.max(18,Math.min(72,Number(v)||32));
    gmOficinaPersistir_();gmOficinaRender_();
};

const gmOficinaV2DesenharCanvasV46462_=gmOficinaV2DesenharCanvas_;
gmOficinaV2DesenharCanvas_=function(){
    const cv=document.getElementById('gmOficinaV2Canvas');if(!cv)return;
    const old=gmOficinaEstado_.escalaPxM;
    // A função anterior usa 32 fixo; renderizamos com escala convertendo
    // temporariamente as coordenadas para manter o mesmo motor.
    const ppm=gmOficinaV2Ppm_(),w=Math.round(gmOficinaEstado_.larguraM*ppm),h=Math.round(gmOficinaEstado_.alturaM*ppm);
    if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
    for(const st of (gmOficinaEstado_.desenhos||[])){
        const pts=Array.isArray(st.pts)?st.pts:[];if(!pts.length)continue;
        const tool=st.tool||st.ferramenta||'traco';
        const size=Math.max(1,Number(st.size||st.esp||7));
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
                    const rr=Math.max(.7,size*(.05+.07*labDesenhoRand_(j*71+k*41)));
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
            ctx.lineWidth=brush==='caligrafico'?Math.max(1,size*.42):size;
            ctx.lineCap=brush==='caligrafico'?'butt':'round';
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);
            for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);
            if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);
            ctx.stroke();
        }
        ctx.restore();
    }
};

const gmOficinaV2RenderObjetosV46462_=gmOficinaV2RenderObjetos_;
gmOficinaV2RenderObjetos_=function(){
    const layer=document.getElementById('gmOficinaV2Objects');if(!layer)return;
    const ppm=gmOficinaV2Ppm_();
    layer.innerHTML=(gmOficinaEstado_.objetos||[]).map(o=>{
        const m=(objetosMapaDB||[]).find(x=>String(x.id)===String(o.modeloId)),img=o.imagem||m?.imagem||'';
        const w=Math.max(18,Number(o.larguraM||1)*ppm),h=Math.max(18,Number(o.alturaM||1)*ppm);
        return `<div data-of2="${escaparHtmlInventario_(o.id)}" onpointerdown="gmOficinaV2ArrastarObjeto_(event,'${String(o.id).replace(/'/g,"\\'")}')" style="position:absolute;left:${o.x*ppm-w/2}px;top:${o.y*ppm-h/2}px;width:${w}px;height:${h}px;z-index:8;cursor:${gmOficinaV2Cfg_.ativo?'default':'grab'};touch-action:none;pointer-events:auto">${img?`<img src="${img}" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none">`:'🧱'}</div>`;
    }).join('');
};

const gmOficinaRenderV46462_=window.gmOficinaRender_;
window.gmOficinaRender_=function(){
    if(!document.getElementById('gmOficinaV2Map'))gmOficinaV2ConstruirUI_();
    gmOficinaV2InstalarEscala_();
    const ppm=gmOficinaV2Ppm_(),map=document.getElementById('gmOficinaV2Map');
    if(!map)return;
    const w=Math.round(gmOficinaEstado_.larguraM*ppm),h=Math.round(gmOficinaEstado_.alturaM*ppm);
    map.style.width=`${w}px`;map.style.height=`${h}px`;
    map.style.backgroundColor=gmOficinaEstado_.fundo||'#d7d7d7';
    map.style.backgroundImage=gmOficinaV2Background_();
    map.style.backgroundSize=`${ppm}px ${ppm}px`;
    const cv=document.getElementById('gmOficinaV2Canvas');
    if(cv){cv.style.width=`${w}px`;cv.style.height=`${h}px`;cv.style.pointerEvents=gmOficinaV2Cfg_.ativo?'auto':'none';}
    const layer=document.getElementById('gmOficinaV2Objects');
    if(layer){layer.style.width=`${w}px`;layer.style.height=`${h}px`;}
    gmOficinaV2DesenharCanvas_();gmOficinaV2RenderObjetos_();gmOficinaV2PopularObjetos_();gmOficinaV2SyncUI_();gmOficinaV2Status_();
    const sc=document.getElementById('gmOficinaV2Scale');if(sc)sc.value=String(gmOficinaV2Ppm_());
};

window.gmOficinaV2PointerDown_=function(ev){
    if(!gmOficinaV2Cfg_.ativo||ev.button===2)return;
    ev.preventDefault();ev.stopPropagation();gmOficinaV2Historico_();
    const cv=document.getElementById('gmOficinaV2Canvas'),rect=cv.getBoundingClientRect(),ppm=gmOficinaV2Ppm_();
    const ponto=e=>({x:Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-rect.left)/ppm)),y:Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-rect.top)/ppm))});
    gmOficinaV2Stroke_={tool:gmOficinaV2Cfg_.ferramenta,color:gmOficinaV2Cfg_.cor,size:gmOficinaV2Cfg_.tamanho,opacity:gmOficinaV2Cfg_.opacidade,brush:gmOficinaV2Cfg_.pincel,texture:gmOficinaV2Cfg_.texturaTraco,pts:[ponto(ev)]};
    gmOficinaEstado_.desenhos.push(gmOficinaV2Stroke_);
    const move=e=>{
        const p=ponto(e),ant=gmOficinaV2Stroke_.pts[gmOficinaV2Stroke_.pts.length-1];
        const dx=(p.x-ant.x)*ppm,dy=(p.y-ant.y)*ppm;
        if(dx*dx+dy*dy<2.25)return;
        gmOficinaV2Stroke_.pts.push(p);
        if(!gmOficinaV2Raf_)gmOficinaV2Raf_=requestAnimationFrame(()=>{gmOficinaV2Raf_=0;gmOficinaV2DesenharCanvas_();});
    };
    const up=()=>{window.removeEventListener('pointermove',move);if(gmOficinaV2Raf_){cancelAnimationFrame(gmOficinaV2Raf_);gmOficinaV2Raf_=0;}gmOficinaV2Stroke_=null;gmOficinaPersistir_();gmOficinaV2DesenharCanvas_();gmOficinaV2Status_();};
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up,{once:true});
};
window.gmOficinaV2ArrastarObjeto_=function(ev,id){
    if(gmOficinaV2Cfg_.ativo)return;
    ev.preventDefault();ev.stopPropagation();gmOficinaV2Historico_();
    const o=(gmOficinaEstado_.objetos||[]).find(x=>String(x.id)===String(id)),map=document.getElementById('gmOficinaV2Map');
    if(!o||!map)return;const rect=map.getBoundingClientRect(),ppm=gmOficinaV2Ppm_(),node=map.querySelector(`[data-of2="${CSS.escape(String(id))}"]`);
    const move=e=>{o.x=Math.max(0,Math.min(gmOficinaEstado_.larguraM,(e.clientX-rect.left)/ppm));o.y=Math.max(0,Math.min(gmOficinaEstado_.alturaM,(e.clientY-rect.top)/ppm));if(node){const w=node.offsetWidth,h=node.offsetHeight;node.style.left=`${o.x*ppm-w/2}px`;node.style.top=`${o.y*ppm-h/2}px`;}}; 
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();gmOficinaV2Status_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};

// Salvar/publicar preserva a escala escolhida.
const gmOficinaSalvarComoMapaV46462_=window.gmOficinaSalvarComoMapa_;
window.gmOficinaSalvarComoMapa_=async function(){
    if(!batalhaEhMestre_())return;
    const nome=prompt('Nome do mapa preparado:','');if(nome==null||!String(nome).trim())return;
    let id=labMapaSlug_(nome),base=id,n=2;while((mapasDB||[]).some(m=>String(m.id)===String(id)))id=`${base}_${n++}`;
    const dados={id,nome:String(nome).trim(),larguraM:gmOficinaEstado_.larguraM,alturaM:gmOficinaEstado_.alturaM,pxPorMetro:gmOficinaV2Ppm_(),fundo:gmOficinaEstado_.fundo,corGrade:gmOficinaEstado_.corGrade,gradeVisivel:gmOficinaEstado_.gradeVisivel!==false,textura:gmOficinaEstado_.textura||'nenhuma',desenhos:JSON.parse(JSON.stringify(gmOficinaEstado_.desenhos||[])),objetos:JSON.parse(JSON.stringify(gmOficinaEstado_.objetos||[])),criadoPor:currentUserUid||'',atualizadoEm:new Date().toISOString()};
    try{const salvo=await labMapaSalvarFirestore_(dados,0);mapasDB.push(salvo);labAtualizarSelectMapas_();if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();notificar_(`Mapa “${dados.nome}” salvo na biblioteca.`,'sucesso',3000);}catch(e){console.error(e);notificar_('Não foi possível salvar o mapa preparado.','erro');}
};
const gmOficinaPublicarMesaV46462_=window.gmOficinaPublicarMesa_;
window.gmOficinaPublicarMesa_=function(){
    labEstado_.pxPorMetro=gmOficinaV2Ppm_();
    return gmOficinaPublicarMesaV46462_();
};

// Mapa da Mesa passa a respeitar escala gravada no mapa salvo.
const labCarregarMapaBancoV46462_=window.labCarregarMapaBanco_;
window.labCarregarMapaBanco_=async function(){
    const id=String(labMapaSelecionado_||'');
    const m0=(mapasDB||[]).find(x=>String(x.id)===id);
    await labCarregarMapaBancoV46462_();
    if(m0?.pxPorMetro){
        labEstado_.pxPorMetro=Math.max(24,Math.min(96,Number(m0.pxPorMetro)||48));
        const z=document.getElementById('labZoom');if(z&&[...z.options].some(o=>Number(o.value)===Number(labEstado_.pxPorMetro)))z.value=String(labEstado_.pxPorMetro);
        labSalvarLocal_();labRender_();
    }
};

// ---------- Laser: agenda somente depois que o DOM do mapa estabiliza ----------
let labLaserTimerV46462_=null;
let labLaserAgendadoIdV46462_='';
labRenderEfeitoVisualAtaque_=function(){
    const fx=labEstado_.efeitoVisualLab;if(!fx)return;
    const id=String(fx.id||'');if(!id||id===labUltimoEfeitoVisualId_||id===labLaserAgendadoIdV46462_)return;
    if(Date.now()-Number(fx.ts||0)>4000){labUltimoEfeitoVisualId_=id;return;}
    labLaserAgendadoIdV46462_=id;
    clearTimeout(labLaserTimerV46462_);
    labLaserTimerV46462_=setTimeout(()=>{
        const atual=labEstado_.efeitoVisualLab,map=document.getElementById('labMetricMap');
        if(!atual||String(atual.id)!==id||!map){labLaserAgendadoIdV46462_='';return;}
        const ppm=Number(labEstado_.pxPorMetro||48);
        const x1=Number(atual.x1||0)*ppm,y1=Number(atual.y1||0)*ppm,x2=Number(atual.x2||0)*ppm,y2=Number(atual.y2||0)*ppm;
        const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*180/Math.PI,cor=atual.cor||'#ff2d2d';
        const beam=document.createElement('div');
        beam.className='lab-laser-beam';
        beam.style.left=`${x1}px`;beam.style.top=`${y1}px`;beam.style.width=`${len}px`;beam.style.transform=`rotate(${ang}deg)`;beam.style.background=cor;beam.style.color=cor;
        beam.innerHTML='<div class="lab-laser-core"></div>';
        const impact=document.createElement('div');
        impact.className='lab-laser-impact';impact.style.left=`${x2}px`;impact.style.top=`${y2}px`;impact.style.color=cor;impact.style.borderColor=cor;
        map.appendChild(beam);map.appendChild(impact);
        labUltimoEfeitoVisualId_=id;labLaserAgendadoIdV46462_='';
        setTimeout(()=>{beam.remove();impact.remove();},700);
    },70);
};

// ---------- Evita que o mapa "pule" na página ao aparecer/desaparecer painel ----------
const labRenderV46462_=labRender_;

window.labRender_=labRender_;
window.labAtualizarStatusCombate_=labAtualizarStatusCombate_;
window.labAtualizarInfo_=labAtualizarInfo_;



// ============================================================
// V46.47.2 — Laser em camada global, independente do rerender do mapa
// ============================================================
let labLaserBodyUltimoIdV3_='';
let labLaserBodyTimersV3_=[];

function labLaserElementoTokenV3_(id){
    if(!id)return null;
    try{
        return document.querySelector(`#labMetricMap .lab-token[data-id="${CSS.escape(String(id))}"]`);
    }catch(_){return null;}
}
function labLaserCentroRectV3_(el){
    if(!el)return null;
    const r=el.getBoundingClientRect();
    if(!r.width||!r.height)return null;
    return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};
}
function labLaserCriarBodyV3_(fx){
    if(labReducing_)return;
    if(!fx||!fx.id||String(fx.id)===labLaserBodyUltimoIdV3_)return false;
    const a=labLaserCentroRectV3_(labLaserElementoTokenV3_(fx.atacanteId));
    const b=labLaserCentroRectV3_(labLaserElementoTokenV3_(fx.alvoId));
    if(!a||!b)return false;

    let x2=b.x,y2=b.y;
    // Em falha, o disparo continua visível, mas passa ligeiramente ao lado do alvo.
    if(fx.acertou===false){
        const dx=b.x-a.x,dy=b.y-a.y,len=Math.max(1,Math.hypot(dx,dy));
        const nx=-dy/len,ny=dx/len;
        const off=Math.max(18,Math.min(42,b.w*.75));
        x2+=nx*off;y2+=ny*off;
    }

    const dx=x2-a.x,dy=y2-a.y,len=Math.hypot(dx,dy);
    const ang=Math.atan2(dy,dx)*180/Math.PI;
    const cor=fx.cor||'#ff3131';

    const beam=document.createElement('div');
    beam.className='lab-laser-body-v3';
    beam.style.left=`${a.x}px`;
    beam.style.top=`${a.y-2.5}px`;
    beam.style.width=`${len}px`;
    beam.style.transform=`rotate(${ang}deg)`;
    beam.style.background=cor;
    beam.style.color=cor;
    beam.style.boxShadow=`0 0 5px ${cor},0 0 14px ${cor},0 0 28px ${cor}`;

    const impact=document.createElement('div');
    impact.className='lab-laser-impact-body-v3';
    impact.style.left=`${x2}px`;
    impact.style.top=`${y2}px`;
    impact.style.color=cor;
    impact.style.borderColor=cor;
    impact.style.boxShadow=`0 0 10px ${cor},0 0 24px ${cor}`;

    document.body.appendChild(beam);
    document.body.appendChild(impact);
    labLaserBodyUltimoIdV3_=String(fx.id);

    const tm=setTimeout(()=>{beam.remove();impact.remove();},700);
    labLaserBodyTimersV3_.push(tm);
    if(labLaserBodyTimersV3_.length>8){
        const old=labLaserBodyTimersV3_.shift();clearTimeout(old);
    }
    return true;
}

function labLaserAgendarBodyV3_(fx, tentativas=8){
    if(!fx?.id||String(fx.id)===labLaserBodyUltimoIdV3_)return;
    let n=0;
    const tentar=()=>{
        if(String(fx.id)===labLaserBodyUltimoIdV3_)return;
        if(labLaserCriarBodyV3_(fx))return;
        n++;
        if(n<tentativas)setTimeout(tentar,80);
    };
    setTimeout(tentar,80);
}

// Substitui de vez a função de disparo: guarda IDs, não só coordenadas.
labDispararEfeitoVisualAtaque_=function(atacante,alvo,item,acertou,grau){
    if(!labTipoVisualArma_(item)||!atacante||!alvo)return;
    const fx={
      id:`fx3:${Date.now()}:${Math.random().toString(36).slice(2,7)}`,
      tipo:'laser',
      atacanteId:String(atacante.id||''),
      alvoId:String(alvo.id||''),
      x1:Number(atacante.x||0),y1:Number(atacante.y||0),
      x2:Number(alvo.x||0),y2:Number(alvo.y||0),
      cor:labCorVisualArma_(item),
      acertou:!!acertou,grau:String(grau||''),ts:Date.now()
    };
    labEstado_.efeitoVisualLab=fx;
    labSalvarLocal_();labAgendarSyncRemoto_();
    labLaserAgendarBodyV3_(fx);
};

// Para clientes remotos: ao receber o novo estado, a mesma animação é disparada.
const labRenderV46463_=labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.47.2 — painel universal de ação, Sorte, Agilidade Psi,
// combate desarmado, Anoitecer furtivo e FX por tipo de arma
// ============================================================

// ---------- Combate Desarmado: Punhos, Chute e Cabeçada ----------
ATAQUES_NATURAIS_['chute']={nome:'Chute',dano:'1d3+MD',penetracao:0};
ATAQUES_NATURAIS_['cabecada']={nome:'Cabeçada',dano:'1d3+MD',penetracao:0};

const ataquesNaturaisCharV46470_=ataquesNaturaisChar_;
ataquesNaturaisChar_=function(char){
    const arr=ataquesNaturaisCharV46470_(char)||[];
    if(char?.__npcTemporario||char?.__criaturaTemporaria)return arr;
    const precisa=['Punhos','Chute','Cabeçada'];
    for(const nome of precisa){
        if(!arr.some(x=>normalizarTextoCombate_(x?.nome||'')===normalizarTextoCombate_(nome))){
            const a=ataqueNaturalPorNome_(nome);if(a)arr.push(a);
        }
    }
    return arr;
};

const batalhaEquipamentosV46470_=batalhaEquipamentos_;
batalhaEquipamentos_=function(char,pericia,selecionado=''){
    if(pericia?.id==='combate_desarmado'&&!char?.__npcTemporario&&!char?.__criaturaTemporaria){
        return ['Punhos','Chute','Cabeçada'].map(nome=>{
            const item=ataqueNaturalPorNome_(nome);
            return {valor:`natural:${item.id}`,rotulo:nome,item,graus:0};
        });
    }
    return batalhaEquipamentosV46470_(char,pericia,selecionado);
};

// ---------- Agilidade Psi realmente modifica os testes ----------
function labAgilidadePsiBonusPara_(t,per){
    if(!t||!per)return 0;
    if(Number(t.agilidadePsiAteRodadaLab)!==Number(labEstado_.rodada))return 0;
    const nome=normalizarTextoCombate_(`${per.id||''} ${getNome(per)||''}`);
    return /atlet|acroba|combate_desarmado|combate desarmado/.test(nome)
        ? Math.max(0,Number(t.agilidadePsiBonusLab||0)) : 0;
}
const labValorTesteV46470_=labValorTeste_;
labValorTeste_=function(t,per){
    return Math.max(0,Number(labValorTesteV46470_(t,per)||0)+labAgilidadePsiBonusPara_(t,per));
};
const labValorPericiaAtaqueV46470_=labValorPericiaAtaque_;
labValorPericiaAtaque_=function(c,per,alvo=null,item=null){
    const t=(labEstado_.tokens||[]).find(x=>String(x.id)===String(c?.id));
    return Math.max(0,Number(labValorPericiaAtaqueV46470_(c,per,alvo,item)||0)+labAgilidadePsiBonusPara_(t,per));
};

// ---------- Sorte ----------
function labSorteCharToken_(t){return labCharToken_(t)||t?.charLab||null;}
function labSorteAtualToken_(t){const c=labSorteCharToken_(t);return c?pontosSorteAtuais_(c):0;}
function labSorteMaxToken_(t){const c=labSorteCharToken_(t);return c?pontosSorteMax_(c):0;}

window.labPrepararSorte_=async function(){
    const t=labTokenAtual_();
    if(t)t.sortePreparadaLab=false;
    notificar_('🍀 A regra atual de Sorte rerrola o último teste no Mapa da Mesa. O combate antigo não prepara sucesso automático.','info',4200);
};

// v99: o combate antigo não pode mais converter Sorte em sucesso automático.
// Os nomes abaixo permanecem somente para compatibilidade com extensões antigas.
let labSorteForcarNormalV46470_=false;
const classificarD100V46470_=classificarD100_;
classificarD100_=function(valor,rolagem){return classificarD100V46470_(valor,rolagem);};
function labSorteRodarBaseV46470_(t,valor,fn){if(t)t.sortePreparadaLab=false;return fn();}
const labRolarAtaqueV46470_=window.labRolarAtaque_;
window.labRolarAtaque_=function(){const t=labTokenAtual_();if(t)t.sortePreparadaLab=false;return labRolarAtaqueV46470_();};
const labResponderDefesaV46470_=window.labResponderDefesa_;
window.labResponderDefesa_=function(defender=true){const p=labEstado_.pendenciaLab,d=p&&labTokenPorId_(p.defensorId);if(d)d.sortePreparadaLab=false;return labResponderDefesaV46470_(defender);};

// ---------- Teste geral inline ----------
function labUniversalPericiasGerais_(t){
    return labPericiasTeste_(t).filter(p=>{
        const tipo=normalizarTextoCombate_(p?.tipo||'');
        return !/combate|combat/.test(tipo)&&!(especializacoesDB||[]).some(e=>String(e.id)===String(p.id));
    });
}
function labUniversalAlvosGerais_(t){
    return [
      {id:'',nome:'— sem alvo —'},
      ...(labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t.id)),
      ...(labEstado_.objetosLab||[]).filter(o=>!o.destruido)
    ];
}
function labDescricaoTraduzidaPsi_(p){
    if(!p)return '';
    if(idiomaAtual==='en')return p.observacao_en||p.descricao_en||p.observacao||p.descricao||'';
    if(idiomaAtual==='zh')return p.observacao_zh||p.descricao_zh||p.observacao||p.descricao||'';
    return p.observacao||p.descricao||'';
}
function labUniversalGarantir_(t){
    if(!t)return;
    t.universalModoLab=t.universalModoLab||'combate';
    if(t.universalModoLab==='outras'){
        const ps=labUniversalPericiasGerais_(t);
        if(!ps.some(p=>String(p.id)===String(t.universalPericiaIdLab)))t.universalPericiaIdLab=ps[0]?.id||'';
    }else if(t.universalModoLab==='psi'){
        const ps=labPsiPoderes_(t);
        if(!ps.some(p=>String(p.id)===String(t.universalPsiPoderIdLab)))t.universalPsiPoderIdLab=ps[0]?.id||'';
        const p=ps.find(x=>String(x.id)===String(t.universalPsiPoderIdLab));
        const alvos=p?labPsiAlvos_(t,p):[];
        const atual=labPsiAlvoPorId_(t.universalAlvoIdLab);
        if(!alvos.some(a=>String(a.id)===String(t.universalAlvoIdLab)))t.universalAlvoIdLab='';
        // Poder estritamente pessoal pode usar o próprio usuário sem clique.
        if(!t.universalAlvoIdLab&&alvos.length===1&&String(alvos[0].id)===String(t.id))t.universalAlvoIdLab=String(t.id);
        const alvoPsi=t.universalAlvoIdLab?labPsiAlvoPorId_(t.universalAlvoIdLab):null;
        const min=p?.id==='mover_objeto'&&alvoPsi?labPsiMoverCustoKg_(p,alvoPsi):Math.max(0,Number(p?.custo||0));
        if(!Number.isFinite(Number(t.universalPsiCustoLab))||Number(t.universalPsiCustoLab)<min)t.universalPsiCustoLab=min;
    }else{
        labGarantirPrefsAtaque_(t);
    }
}
window.labUniversalPrimeiro_=function(v){
    const t=labTokenAtual_();if(!t)return;
    if(v==='__outras__'){t.universalModoLab='outras';t.acaoAuxLab=null;}
    else if(v==='__psi__'){t.universalModoLab='psi';t.acaoAuxLab=null;t.sortePreparadaLab=false;}
    else{t.universalModoLab='combate';t.periciaLab=String(v||'');t.equipamentoLab='';t.acaoAuxLab=null;labGarantirPrefsAtaque_(t);}
    labUniversalGarantir_(t);labSalvarLocal_();labRender_();
};
window.labUniversalSegundo_=function(v){
    const t=labTokenAtual_();if(!t)return;
    if(t.universalModoLab==='outras')t.universalPericiaIdLab=String(v||'');
    else if(t.universalModoLab==='psi'){
        t.universalPsiPoderIdLab=String(v||'');t.universalPsiCustoLab=NaN;
        const p=labPsiPoderes_(t).find(x=>String(x.id)===String(v));
        const alvos=p?labPsiAlvos_(t,p):[];
        t.universalAlvoIdLab=(alvos.length===1&&String(alvos[0].id)===String(t.id))?String(t.id):'';
    }else{t.equipamentoLab=String(v||'');labGarantirPrefsAtaque_(t);}
    labUniversalGarantir_(t);labSalvarLocal_();labRender_();
};
window.labUniversalAlvo_=function(v){
    const t=labTokenAtual_();if(!t)return;
    if(t.universalModoLab==='psi')t.universalAlvoIdLab=String(v||'');
    else if(t.universalModoLab==='outras')t.universalAlvoGeralLab=String(v||'');
    else{
        const id=String(v||'');
        t.alvoLab=id;t._alvoManualFixadoLab=id;t._alvoComandoFixadoLab='';
        const a=labAlvoAtaquePorId_(id);
        if(a&&labObjetoPorId_(id)){
            labEstado_.objetoSelecionadoId=id;labEstado_.selecionadoId='';
            t._alvoMortoManual510=!!labAlvoInerte490_(a);
        }else{
            labEstado_.objetoSelecionadoId='';
            labEstado_.selecionadoId=id;
            t._alvoMortoManual510=false;
        }
        labApontarPara_(t,a);
    }
    labUniversalGarantir_(t);labSalvarLocal_();labRender_();
};
window.labUniversalPP_=function(v){
    const t=labTokenAtual_();if(!t)return;t.universalPsiCustoLab=Math.max(0,Math.floor(Number(v)||0));labUniversalGarantir_(t);labSalvarLocal_();labRender_();
};

window.labUniversalExecutarPericia_=function(){
    const t=labTokenAtual_();if(!t||Number(t.acoesAtuaisLab||0)<=0)return;
    const per=labUniversalPericiasGerais_(t).find(p=>String(p.id)===String(t.universalPericiaIdLab));if(!per)return;
    if(!batalhaEhMestre_()){
        // Continua usando a fila já existente.
        labEnviarComandoJogador_('teste_pericia',{periciaToken:batalhaTokenPericia_(per)},t).then(ok=>{if(ok)notificar_(`Teste de ${getNome(per)} enviado ao mestre.`,'info',1800);});
        return;
    }
    const bonusInt=Math.max(0,Number(t.bonusIntuicaoPendenteLab||0));
    const bonusMente=Number(t.menteAceleradaCargasLab||0)>0&&/INT/.test(String(per.formula||''))?Math.max(0,Number(t.menteAceleradaBonusLab||20)):0;
    const valor=labValorTeste_(t,per)+bonusInt+bonusMente;
    // v99: Sorte não prepara mais sucesso automático; no combate atual ela rerrola o último teste.
    t.sortePreparadaLab=false;
    const roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll);
    if(bonusInt>0)t.bonusIntuicaoPendenteLab=0;
    if(bonusMente>0)t.menteAceleradaCargasLab=Math.max(0,Number(t.menteAceleradaCargasLab||0)-1);
    if(t.bonusDificuldadeFacilPsiLab)t.bonusDificuldadeFacilPsiLab=0;
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);
    if(r.grau==='Crítico')t.acoesAtuaisLab=Math.min(Number(t.acoesMaxLab||0)+6,Number(t.acoesAtuaisLab||0)+1);
    else if(r.grau==='Fiasco'){if(Number(t.acoesAtuaisLab||0)>0)t.acoesAtuaisLab--;else t.penalidadeAcaoProximaLab=Math.max(1,Number(t.penalidadeAcaoProximaLab||0));}
    const alvo=labPsiAlvoPorId_(t.universalAlvoGeralLab);
    const agi=labAgilidadePsiBonusPara_(t,per);
    const txt=`Teste: ${getNome(per)} ${roll}/${valor} → ${r.grau}${agi?` · Agilidade Psi +${agi}%`:''}${alvo?` · alvo ${alvo.nome||'objeto'}`:''}.`;
    labRegistrarResultadoProprio_(t,txt);labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${t.nome}: ${txt}`});
    try{somDado_();}catch(_){}
    labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();
};
window.labUniversalExecutarPsi_=function(){
    const t=labTokenAtual_();if(!t||Number(t.acoesAtuaisLab||0)<=0)return;
    const p=labPsiPoderes_(t).find(x=>String(x.id)===String(t.universalPsiPoderIdLab));if(!p)return;
    const validos=labPsiAlvos_(t,p);
    let alvo=t.universalAlvoIdLab?labPsiAlvoPorId_(t.universalAlvoIdLab):null;
    if(!alvo&&validos.length===1&&String(validos[0].id)===String(t.id))alvo=t;
    if(!alvo||!validos.some(x=>String(x.id)===String(alvo.id))){
        notificar_('🎯 Clique no alvo diretamente no mapa antes de usar este poder.','aviso',3200);return;
    }
    t.acaoAuxLab={tipo:'psiquismo',poderId:p.id,alvoId:String(alvo.id),custo:Math.max(0,Number(t.universalPsiCustoLab||p.custo||0)),local:''};
    if(labPsiEhCura_(p)){
        const fer=labFeridasTrataveis_(alvo);t.acaoAuxLab.local=fer[0]?.local||'';
    }
    labUsarPsiExecutar_();
};

// ---------- Painel universal ----------
const labRenderActionPanelV46470_=labRenderActionPanel_;
labRenderActionPanel_=function(){
    const el=document.getElementById('labActionPanel');
    if(!el)return;
    // Resoluções, defesas, dano, socorros e interfaces especiais continuam usando o motor existente.
    const t=labTokenAtual_();
    if(labEstado_.pendenciaLab||labEstado_.danoPendenteLab||t?.acaoAuxLab?.tipo==='primeiros_socorros'||t?.primeirosSocorrosLab||t?.meditacaoBatalhaPsiLab){
        return labRenderActionPanelV46470_();
    }
    if(labEstado_.fase!=='combate'){el.style.display='none';el.innerHTML='';return;}
    if(!t||!labCharToken_(t)){return labRenderActionPanelV46470_();}
    if(!batalhaEhMestre_()&&!labPodeControlarToken_(t)){el.style.display='none';el.innerHTML='';return;}

    t.acaoAuxLab=null;
    labUniversalGarantir_(t);
    const c=labCharToken_(t),modo=t.universalModoLab||'combate';
    const comb=labPericiasAtaque_(t);
    const gerais=labUniversalPericiasGerais_(t);
    const poderes=labPsiPoderes_(t);
    const primeiro=[
      ...comb.map(p=>({v:batalhaTokenPericia_(p),n:`${getNome(p)} (${labValorPericiaAtaque_(c,p,null,null)}%)`})),
      {v:'__outras__',n:'🎲 Outras Perícias'},
      ...(temPsiquismoInvestido_(c)?[{v:'__psi__',n:`🔮 Psiquismo (${Math.max(0,...poderes.map(p=>labPsiValor_(t,p)))}%) · ${labPsiRestantes_(t)}/${labPsiMax_(t)} PP`}]:[])
    ];
    const primeiroValor=modo==='outras'?'__outras__':modo==='psi'?'__psi__':t.periciaLab;

    let segundo=[],alvos=[],segValor='',alvoValor='',descricao='',campoAlvo='',campo4='',final='',distTxt='';
    if(modo==='outras'){
        segundo=gerais.map(p=>({v:p.id,n:`${getNome(p)} (${labValorTeste_(t,p)}%)`}));
        segValor=t.universalPericiaIdLab;
        alvos=labUniversalAlvosGerais_(t).map(x=>({v:x.id,n:x.nome||x.name||'Objeto'}));alvoValor=t.universalAlvoGeralLab||'';
        const alvoG=alvoValor?labPsiAlvoPorId_(alvoValor):null;
        distTxt=alvoG?`🎯 ${alvoG.nome||alvoG.name||'Objeto'} selecionado no mapa`:'🎯 Clique no alvo dentro do mapa, se a ação exigir alvo';
        const per=gerais.find(p=>String(p.id)===String(segValor));descricao=getDescricao(per);
        campo4=`<button class="btn-small" disabled title="A Sorte agora rerrola o último teste no Mapa da Mesa." style="width:100%;height:48px;margin:0;white-space:nowrap;">🍀 Sorte ${labSorteAtualToken_(t)}/${labSorteMaxToken_(t)}</button>`;
        final=`<button class="btn-small btn-select" onclick="labUniversalExecutarPericia_()" ${!per||Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="width:100%;height:48px;margin:0;">🎲 Usar (1 AÇ)</button>`;
    }else if(modo==='psi'){
        segundo=poderes.map(p=>({v:p.id,n:`${getNome(p)} · ${p.esfera} A${Number(p.arco||1)}`}));
        segValor=t.universalPsiPoderIdLab;
        const p=poderes.find(x=>String(x.id)===String(segValor)),aa=p?labPsiAlvos_(t,p):[];
        alvos=aa.map(x=>({v:x.id,n:x.nome||labObjetoModelo_(x)?.nome||'Objeto'}));alvoValor=t.universalAlvoIdLab;
        descricao=labDescricaoTraduzidaPsi_(p);
        const alvoPsiAtual=alvoValor?labPsiAlvoPorId_(alvoValor):null;
        distTxt=alvoPsiAtual?`🎯 ${alvoPsiAtual.nome||alvoPsiAtual.name||labObjetoModelo_(alvoPsiAtual)?.nome||'Objeto'} selecionado no mapa`:'🎯 Clique no alvo dentro do mapa';
        const min=p?.id==='mover_objeto'&&alvoPsiAtual?labPsiMoverCustoKg_(p,alvoPsiAtual):Math.max(0,Number(p?.custo||0));
        const max=Math.max(min,labPsiRestantes_(t));
        campo4=`<label style="margin:0;"><small style="display:block;margin-bottom:4px;">PP</small><input type="number" min="${min}" max="${max}" value="${Math.max(min,Number(t.universalPsiCustoLab||min))}" onchange="labUniversalPP_(this.value)" style="width:100%;height:48px;margin:0;box-sizing:border-box;text-align:center;"></label>`;
        final=`<button class="btn-small btn-select" onclick="labUniversalExecutarPsi_()" ${!p||!alvoValor||Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="width:100%;height:48px;margin:0;">✨ Usar (1 AÇ)</button>`;
    }else{
        const per=labPericiaPorToken_(t,t.periciaLab),eq=batalhaEquipamentos_(c,per,t.equipamentoLab),aa=labAlvosAtaque_(t);
        segundo=eq.map(x=>({v:x.valor,n:x.rotulo}));segValor=t.equipamentoLab;
        alvos=aa.map(x=>({v:x.id,n:x.nome||'Objeto'}));alvoValor=t.alvoLab;
        const alvo=aa.find(x=>String(x.id)===String(alvoValor)),item=labItemSelecionado_(t);
        descricao=getDescricao(per);
        if(item?.descricao)descricao=[descricao,getDescricao(item)].filter(Boolean).join(' · ');
        if(item?.dano)descricao=[descricao,`🎲 Dano ${item.dano}${Number(item?.penetracao||0)?` · Pen. ${Number(item.penetracao)}`:''}`].filter(Boolean).join(' · ');
        if(alvo&&item){const d=labDistanciaEntre_(t,alvo),a=labAlcanceAtaque_(t,item);distTxt=`🎯 ${alvo.nome||'Alvo'} · ${d.toFixed(2)} m · alcance ${a.toFixed(1)} m`;}
        else distTxt='🎯 Clique no alvo dentro do mapa';
        campoAlvo='';
        campo4=`<button class="btn-small" disabled title="A Sorte agora rerrola o último teste no Mapa da Mesa." style="width:100%;height:48px;margin:0;white-space:nowrap;">🍀 Sorte ${labSorteAtualToken_(t)}/${labSorteMaxToken_(t)}</button>`;
        final=`<button class="btn-small btn-select" onclick="labRolarAtaque_()" ${!per||!labItemSelecionado_(t)||!alvo||Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="width:100%;height:48px;margin:0;">🎲 Testar</button>`;
    }

    // Alvos de combate, psiquismo e ações direcionadas são escolhidos no mapa.
    campoAlvo='';
    el.style.display='block';
    el.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:7px;">
      <strong style="color:#ffd54a;">🎯 Ação de ${escaparHtmlInventario_(t.nome)}</strong>
      <span style="font-size:.86em;color:#9fc6d8;">${escaparHtmlInventario_(distTxt)}</span>
    </div>
    <div style="display:grid;grid-template-columns:minmax(180px,1.15fr) minmax(220px,1.25fr) minmax(125px,.62fr) minmax(145px,.66fr);gap:8px;align-items:end;">
      <label style="margin:0;"><small style="display:block;margin-bottom:4px;">Ação / Perícia</small><select onchange="labUniversalPrimeiro_(this.value)" style="width:100%;margin:0;">${primeiro.map(x=>`<option value="${escaparHtmlInventario_(x.v)}" ${String(x.v)===String(primeiroValor)?'selected':''}>${escaparHtmlInventario_(x.n)}</option>`).join('')}</select></label>
      <label style="margin:0;"><small style="display:block;margin-bottom:4px;">${modo==='psi'?'Poder':modo==='outras'?'Perícia':'Arma / ataque'}</small><select onchange="labUniversalSegundo_(this.value)" style="width:100%;margin:0;">${segundo.map(x=>`<option value="${escaparHtmlInventario_(x.v)}" ${String(x.v)===String(segValor)?'selected':''}>${escaparHtmlInventario_(x.n)}</option>`).join('')||'<option>—</option>'}</select></label>
      ${campoAlvo}
      <div>${campo4}</div><div>${final}</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px;">
      <button class="btn-small" onclick="labPassarAcao_()" ${Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="height:42px;">⏭ ${Number(t.passagensLab||0)===0?'Passar (grátis)':'Passar (1 AÇ)'}</button>
      <button class="btn-small" onclick="labLevantar_()" ${!labGarantirSnapshotCombate_(t)?.derrubado||Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="height:42px;">⬆️ Levantar</button>
      ${modo==='combate'&&labItemSelecionado_(t)&&labEhArmaMuniciada_(labItemSelecionado_(t))?`<button class="btn-small" onclick="labRecarregar_()" style="height:42px;">🔋 Recarregar ${labMunicaoAtual_(t,labItemSelecionado_(t))}/${labCapacidadeArma_(labItemSelecionado_(t))}</button>`:''}
      ${labPrimeirosSocorrosPericia_(t)&&(labEstado_.tokens||[]).some(x=>labFeridasTrataveis_(x).length>0&&!labGarantirSnapshotCombate_(x)?.morto)?`<button class="btn-small" onclick="labAbrirPrimeirosSocorros_()" ${Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="height:42px;">🩹 Primeiros Socorros</button>`:''}
      ${descricao?`<div class="lab-action-description-inline"><b style="margin-right:5px">ℹ️</b>${escaparHtmlInventario_(descricao)}</div>`:''}
    </div>
    ${labResumoPVHtml_(t,'SEUS PV')}
    ${t?.ultimoResultadoProprioLab?`<div style="margin-top:7px;padding:6px 8px;border-radius:7px;background:rgba(255,255,255,.05);">${escaparHtmlInventario_(t.ultimoResultadoProprioLab)}</div>`:''}`;
};
window.labRenderActionPanel_=labRenderActionPanel_;

// ---------- Anoitecer: outros jogadores não veem posições dentro da sombra ----------
function labAplicarOcultacaoAnoitecerV46470_(){
    if(batalhaEhMestre_())return;
    const map=document.getElementById('labMetricMap');if(!map)return;
    const uid=String(currentUserUid||currentUser?.uid||'');
    const zonas=(labEstado_.tokens||[]).filter(t=>Number(t.anoitecerPsiLab?.raio||0)>0);
    if(!zonas.length)return;
    for(const alvo of (labEstado_.tokens||[])){
        const node=map.querySelector(`.lab-token[data-id="${CSS.escape(String(alvo.id))}"]`);if(!node)continue;
        // O usuário sempre consegue localizar o próprio token.
        if(uid&&String(alvo.donoUid||'')===uid){node.style.visibility='visible';continue;}
        let oculto=false;
        for(const autor of zonas){
            // O conjurador enxerga através da própria escuridão.
            if(uid&&String(autor.donoUid||'')===uid)continue;
            const z=autor.anoitecerPsiLab,r=Number(z.raio||0),cx=Number(z.x??autor.x),cy=Number(z.y??autor.y);
            if(Math.hypot(Number(alvo.x||0)-cx,Number(alvo.y||0)-cy)<=r){oculto=true;break;}
        }
        if(oculto)node.style.visibility='hidden';
    }
}

// ---------- Efeitos visuais por família de arma ----------
labTipoVisualArma_=function(item){
    const txt=normalizarTextoCombate_([item?.id,item?.nome,item?.nome_en,item?.categoria,item?.tipo,item?.municao,item?.propriedades].filter(Boolean).join(' '));
    if(/plasma/.test(txt))return 'plasma';
    if(/phaser|faser/.test(txt))return 'phaser';
    if(/blaster/.test(txt))return 'blaster';
    if(/laser/.test(txt))return 'laser';
    return '';
};
labCorVisualArma_=function(item){
    const tipo=labTipoVisualArma_(item);
    if(tipo==='blaster')return '#ffd447';
    if(tipo==='plasma')return '#49e7ff';
    if(tipo==='phaser')return '#b96cff';
    return '#ff3131';
};

// ---------- Objetos: nunca sangram; materiais podem incendiar/despedaçar ----------
function labObjetoTextoMaterialV46470_(o){
    const m=labObjetoModelo_(o);
    return normalizarTextoCombate_(`${o?.nome||''} ${o?.material||''} ${o?.descricao||''} ${m?.nome||''} ${m?.material||''} ${m?.descricao||''}`);
}
function labObjetoInflamavelV46470_(o){return /arvore|árvore|palmeira|palm|tree|wood|madeira|papel|paper|tecido|cloth|planta|folha|folhas|inflam/.test(labObjetoTextoMaterialV46470_(o));}
function labObjetoFragilV46470_(o){return /vidro|glass|cristal|crystal|ceram|porcel|rocha|rock|pedra|stone/.test(labObjetoTextoMaterialV46470_(o));}

const labEfeitosDisponiveisV46470_=labEfeitosDisponiveis_;
labEfeitosDisponiveis_=function(pend){
    let out=labEfeitosDisponiveisV46470_(pend)||[];
    const alvo=labAlvoAtaquePorId_(pend?.defensorId)||labObjetoPorId_(pend?.defensorId);
    if(!labEhAlvoObjeto_(alvo))return out;
    out=out.filter(e=>e.id!=='sangrar'&&e.id!=='derrubar'&&e.id!=='danificar_arma');
    const itemTxt=normalizarTextoCombate_(`${getNome(pend?.item)||''} ${pend?.item?.propriedades||''} ${pend?.item?.tags||''}`);
    if(labObjetoInflamavelV46470_(alvo)&&/incendi|fogo|flame|laser|plasma|blaster/.test(itemTxt))
        out.push({id:'pegar_fogo',nome:'🔥 Pegar Fogo'});
    if(labObjetoFragilV46470_(alvo))
        out.push({id:'despedacar',nome:'💥 Despedaçar'});
    if(labObjetoFragilV46470_(alvo)&&batalhaResultadoGradeValor_(pend?.grauAtaque)>=3)
        out.push({id:'explodir_objeto',nome:'💣 Explodir'});
    return out;
};

const labEscolherEfeitoV46470_=window.labEscolherEfeito_;
window.labEscolherEfeito_=function(id){
    const dp=labEstado_.danoPendenteLab,alvo=dp&&labObjetoPorId_(dp.defensorId);
    if(alvo&&['pegar_fogo','despedacar','explodir_objeto'].includes(String(id))){
        if(id==='pegar_fogo')alvo.pegandoFogoLab=true;
        if(id==='despedacar')alvo.despedacadoLab=true;
        if(id==='explodir_objeto')alvo.explodindoLab=true;
    }
    return labEscolherEfeitoV46470_(id);
};

const labObjetoHtmlV46470_=labObjetoHtml_;
labObjetoHtml_=function(o,ppm){
    let h=labObjetoHtmlV46470_(o,ppm);
    const badges=[
      o?.pegandoFogoLab?'🔥':'',
      o?.despedacadoLab?'💥':'',
      o?.explodindoLab?'💣':''
    ].filter(Boolean).join('');
    if(badges){
        h=h.replace('</div>',`<span style="position:absolute;right:-8px;top:-12px;font-size:19px;z-index:31;filter:drop-shadow(0 1px 3px #000)">${badges}</span></div>`);
    }
    return h;
};
window.labObjetoHtml_=labObjetoHtml_;

// Energia em objeto inflamável pode iniciar fogo diretamente num crítico,
// porque objetos atualmente usam resolução de dano direto.
const labDispararEfeitoVisualAtaqueV46470_=labDispararEfeitoVisualAtaque_;
labDispararEfeitoVisualAtaque_=function(atacante,alvo,item,acertou,grau){
    const r=labDispararEfeitoVisualAtaqueV46470_(atacante,alvo,item,acertou,grau);
    if(acertou&&labEhAlvoObjeto_(alvo)){
        const it=normalizarTextoCombate_(`${getNome(item)||''} ${item?.propriedades||''}`);
        const crit=batalhaResultadoGradeValor_(grau)>=3;
        if(labObjetoInflamavelV46470_(alvo)&&(/incendi|fogo|flame/.test(it)||(crit&&/laser|plasma|blaster/.test(it))))alvo.pegandoFogoLab=true;
        if(crit&&labObjetoFragilV46470_(alvo))alvo.despedacadoLab=true;
    }
    return r;
};

// ---------- Render final: ocultação do Anoitecer ----------
const labRenderV46470_=labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.47.2 — compatibilidade de armas + XP de especializações
// ============================================================

// ---------- Compatibilidade de armas: plataforma + tecnologia ----------
// A versão anterior classificava qualquer "blaster/phaser" apenas como
// "energia". Isso apagava a informação essencial de que a arma era uma
// pistola, rifle, carabina etc. Resultado: quase tudo recebia penalidade.
function familiasArmaCompatV46471_(item){
    const n=normalizarTextoCombate_([
        item?.id,item?.nome,item?.nome_en,item?.nome_zh,item?.descricao,
        item?.categoria,item?.tipo,item?.familia,item?.subtipo
    ].filter(Boolean).join(' '));
    const f=new Set();

    if(/escudo|shield/.test(n))f.add('escudo');
    if(/granada|grenade|arremesso|throw/.test(n))f.add('arremesso');
    if(/arco|bow/.test(n))f.add('arco');
    if(/escopeta|shotgun/.test(n))f.add('escopeta');
    if(/submetralhadora|submachine|smg/.test(n))f.add('submetralhadora');
    if(/sniper|precisao|precision|anti.?material/.test(n))f.add('precisao');

    const energia=/laser|blaster|phaser|faser|disrupt|disintegr|plasma|sonic|energia|energy/.test(n);
    if(energia)f.add('energia');
    if(/laser/.test(n))f.add('laser');

    if(/pesad|heavy|canhao|cannon|launcher/.test(n))f.add('pesada');

    // "Blaster de Palma" conta como arma curta/pistola.
    if(/pistola|pistol|revolver|handgun|palma|palm/.test(n))f.add('pistola');
    if(/rifle|fuzil|carabina|carbine/.test(n))f.add('rifle');

    if(f.has('pistola')&&energia)f.add('energia_pistola');
    if(f.has('rifle')&&energia)f.add('energia_rifle');
    if(f.has('pesada')&&energia)f.add('energia_pesada');

    if(/plasma|vibro/.test(n) && /espada|sword|blade|lamina/.test(n))f.add('plasma_vibro');
    if(/lanca|alabarda|spear|halberd|polearm/.test(n))f.add('haste');
    if(/faca|adaga|dagger|knife/.test(n))f.add('branca_curta');
    if(/espada|sabre|saber|machado|sword|axe/.test(n))f.add('branca_longa');
    if(itemEhCorpoACorpo_(item)&&![...f].some(x=>['branca_curta','branca_longa','haste','plasma_vibro'].includes(x)))f.add('improvisada');

    return f;
}

familiaArmaCompat_=function(item){
    const f=familiasArmaCompatV46471_(item);
    // Mantém compatibilidade com código antigo que ainda peça uma família única.
    for(const k of ['precisao','energia_pesada','energia_pistola','energia_rifle','pesada','pistola','rifle','escopeta','submetralhadora','arremesso','arco','plasma_vibro','haste','branca_curta','branca_longa','escudo','improvisada','energia'])
        if(f.has(k))return k;
    return 'desconhecida';
};

penalidadeCompatibilidadeArma_=function(pericia,item){
    if(!pericia||!item||['esquiva','combate_desarmado','briga_pugilismo'].includes(pericia.id))return 0;
    const f=familiasArmaCompatV46471_(item);
    const id=String(pericia.id||'');

    // Armas brancas.
    if(id==='armas_brancas_curtas')return f.has('branca_curta')?0:(f.has('plasma_vibro')?1:2);
    if(id==='armas_brancas_longas')return f.has('branca_longa')?0:(f.has('plasma_vibro')?1:2);
    if(id==='armas_haste')return f.has('haste')?0:(f.has('plasma_vibro')?1:2);
    if(id==='armas_improvisadas')return f.has('improvisada')?0:2;
    if(id==='esgrima_plasma_vibro')return f.has('plasma_vibro')?0:((f.has('branca_curta')||f.has('branca_longa')||f.has('haste'))?1:2);

    // Armas convencionais.
    if(id==='pistolas_revolveres')return f.has('pistola')&&!f.has('energia')?0:(f.has('pistola')?1:(f.has('submetralhadora')?1:2));
    if(id==='fuzis_carabinas')return f.has('rifle')&&!f.has('energia')?0:(f.has('rifle')?1:(f.has('precisao')?1:2));
    if(id==='escopetas')return f.has('escopeta')?0:2;
    if(id==='submetralhadoras')return f.has('submetralhadora')?0:(f.has('pistola')&&!f.has('energia')?1:2);
    if(id==='armas_pesadas')return f.has('pesada')&&!f.has('energia')?0:(f.has('pesada')?1:2);
    if(id==='armas_arremesso')return f.has('arremesso')?0:2;
    if(id==='arqueiro')return f.has('arco')?0:2;

    // Atirador de Elite treina o uso preciso de armas longas.
    // Sniper/precisão = 0; qualquer rifle/carabina = +1; demais = +2.
    if(id==='atirador_elite')return f.has('precisao')?0:(f.has('rifle')?1:2);

    // Energia por PLATAFORMA. Pistola Blaster/Phaser não deve parecer
    // uma arma completamente diferente de Pistola Laser.
    if(id==='combate_pistola_laser'||id==='pistolas_laser'){
        if(f.has('energia_pistola'))return 0;
        if(f.has('pistola')&&!f.has('energia'))return 1;
        if(f.has('energia'))return 1;
        return 2;
    }
    if(id==='rifles_laser'){
        if(f.has('energia_rifle'))return 0;
        if(f.has('rifle')&&!f.has('energia'))return 1;
        if(f.has('energia_pesada'))return 1;
        return 2;
    }
    if(id==='arma_laser_pesada'){
        if(f.has('energia_pesada'))return 0;
        if(f.has('energia_rifle')||f.has('energia'))return 1;
        return 2;
    }

    // Armas de Energia é a perícia ampla da tecnologia energética.
    // Qualquer arma energética usa 0 graus; armas convencionais similares +1.
    if(id==='armas_energia'){
        if(f.has('energia'))return 0;
        if(f.has('pistola')||f.has('rifle')||f.has('pesada'))return 1;
        return 2;
    }

    // Especializações futuras: tenta inferir pelo próprio nome/ID.
    const pn=normalizarTextoCombate_(`${id} ${getNome(pericia)||''}`);
    if(/pistola/.test(pn))return f.has('pistola')?0:2;
    if(/rifle|fuzil|carabina/.test(pn))return f.has('rifle')?0:2;
    if(/pesad/.test(pn))return f.has('pesada')?0:2;

    return 2;
};

// ---------- XP: salvar novas especializações sem risco de estado local velho ----------
function substituirCharLocalV46471_(fresco){
    if(!fresco?.id)return fresco;
    const i=(userCharacters||[]).findIndex(x=>String(x.id)===String(fresco.id));
    if(i>=0){
        // Preserva a identidade do objeto quando possível, pois outras telas
        // podem ter referência para ele.
        Object.keys(userCharacters[i]).forEach(k=>delete userCharacters[i][k]);
        Object.assign(userCharacters[i],fresco);
        return userCharacters[i];
    }
    userCharacters.push(fresco);
    return fresco;
}
function sincronizarXpCharNaMesaV46471_(char){
    if(!char)return;
    for(const t of (labEstado_?.tokens||[])){
        if(String(t.origemId||t.id)===String(char.id)){
            t.charLab={...(t.charLab||{}),...labSnapshotChar_(char)};
        }
    }
}

window.investirXpPendente_=async function(grantId){
    const local=(userCharacters||[]).find(c=>c.id===currentCharId);if(!local)return;
    const ins=[...document.querySelectorAll(`.xp-alloc[data-grant="${CSS.escape(String(grantId))}"]`)];
    const alocs=ins.map(i=>({
        tipo:String(i.dataset.tipo||''),
        id:String(i.dataset.id||''),
        q:Math.max(0,Math.floor(Number(i.value)||0))
    })).filter(x=>x.id&&x.q>0);
    const total=alocs.reduce((s,x)=>s+x.q,0);
    if(total<=0){notificar_('Informe quantos pontos deseja investir.','aviso');return;}

    try{
        // Busca a ficha mais recente do Firestore antes de modificar. Isso evita
        // que uma ficha local antiga apague uma especialização recém-criada.
        const snap=await getDoc(doc(db,'personagens',local.id));
        if(!snap.exists())throw new Error('Ficha não encontrada.');
        const char={id:snap.id,...snap.data()};
        const grants=Array.isArray(char.xpPendentes)?char.xpPendentes:[];
        const g=grants.find(x=>String(x.id)===String(grantId));
        if(!g){notificar_('Esta concessão de XP já não está disponível. Atualizei a ficha.','aviso',4000);substituirCharLocalV46471_(char);renderizarPericias(char);return;}
        if(total>Number(g.restantes||0)){notificar_('O investimento excede o XP disponível nesta concessão.','aviso');return;}

        const permitidos=new Set((g.permitidos||[]).map(a=>`${String(a.tipo)}:${String(a.id)}`));
        for(const a of alocs){
            if(!permitidos.has(`${a.tipo}:${a.id}`)){
                throw new Error(`Investimento não autorizado: ${a.id}`);
            }
        }

        char.pericias=char.pericias||{};
        char.especializacoes=char.especializacoes||{};

        for(const a of alocs){
            const ehEsp=a.tipo==='especializacao';
            const colecao=ehEsp?char.especializacoes:char.pericias;
            const d={...(colecao[a.id]||{})};
            const inv=obterInvestimentosPericia_(d);
            inv.xp=Math.max(0,Number(inv.xp||0))+a.q;
            d.investimentos=inv;
            d.treinoTotal=Number(inv.origem||0)+Number(inv.carreira||0)+Number(inv.hobbie||0)+Number(inv.xp||0);

            // Guarda metadados mínimos em novas especializações. Mesmo que o
            // banco seja recarregado mais tarde, o investimento não vira órfão.
            if(ehEsp){
                const meta=(especializacoesDB||[]).find(e=>String(e.id)===String(a.id));
                if(meta){
                    d.nomeOriginal=d.nomeOriginal||getNome(meta);
                    d.tipoOriginal=d.tipoOriginal||meta.tipo||'Combate';
                }
            }
            colecao[a.id]=d;
        }

        g.restantes=Math.max(0,Number(g.restantes||0)-total);
        char.xpPendentes=grants.filter(x=>Number(x.restantes||0)>0);

        await setDoc(doc(db,'personagens',char.id),{
            pericias:char.pericias,
            especializacoes:char.especializacoes,
            xpPendentes:char.xpPendentes
        },{merge:true});

        // Confirma lendo de volta. Não mostra "salvo" antes de verificar.
        const check=await getDoc(doc(db,'personagens',char.id));
        if(!check.exists())throw new Error('Não consegui confirmar a gravação.');
        const fresco={id:check.id,...check.data()};

        for(const a of alocs.filter(x=>x.tipo==='especializacao')){
            if(totalTreinoPericia_(fresco.especializacoes?.[a.id]||{})<=0)
                throw new Error(`A especialização ${a.id} não permaneceu gravada.`);
        }

        const atualizado=substituirCharLocalV46471_(fresco);
        limparRascunhoPericias_(atualizado.id);
        sincronizarXpCharNaMesaV46471_(atualizado);
        labSalvarLocal_();labAgendarSyncRemoto_();

        renderizarPericias(atualizado);
        renderizarAvisosProgressao_(atualizado);
        try{renderizarCombate(atualizado);}catch(_){}
        somSalvar_();
        notificar_(`⭐ ${total} ponto(s) de XP investidos e confirmados no banco de dados.`,'sucesso',4200);
    }catch(e){
        console.error('Falha ao investir XP',e);
        notificar_(`Não consegui salvar o investimento de XP: ${e?.message||e}`,'erro',6500);
    }
};



// ============================================================
// V46.47.2 — alcance corpo a corpo energético + FX persistentes
// ============================================================

// ---------- Espadas/armas energéticas corpo a corpo não são ataques à distância ----------
function labItemEnergiaCorpoACorpoV247_(item){
    if(!item)return false;
    const txt=normalizarTextoCombate_([
      item.id,item.nome,item.nome_en,item.nome_zh,item.categoria,item.tipo,item.alcance,
      item.propriedades,item.tags
    ].filter(Boolean).join(' '));
    const lamina=/espada|sabre|saber|blade|sword|vibro|lamina|lâmina/.test(txt);
    const energia=/laser|plasma|phaser|faser|energia|energy|luz|light/.test(txt);
    return lamina&&energia;
}

const itemEhCorpoACorpoV247_=itemEhCorpoACorpo_;
itemEhCorpoACorpo_=function(item){
    if(labItemEnergiaCorpoACorpoV247_(item))return true;
    return itemEhCorpoACorpoV247_(item);
};

const labAtaqueEhDistanciaV247_=labAtaqueEhDistancia_;
labAtaqueEhDistancia_=function(item){
    if(labItemEnergiaCorpoACorpoV247_(item))return false;
    return labAtaqueEhDistanciaV247_(item);
};

const labAlcanceAtaqueV247_=labAlcanceAtaque_;
labAlcanceAtaque_=function(t,item){
    if(labItemEnergiaCorpoACorpoV247_(item)){
        // Um pouco mais que socos/garras, mas claramente menor que uma arma de haste.
        return 2.2;
    }
    return labAlcanceAtaqueV247_(t,item);
};

// ---------- Arco luminoso para ataques corpo a corpo energéticos ----------
let labEnergySlashUltimoV247_='';
function labEnergyMeleeCorV247_(item){
    const txt=normalizarTextoCombate_([item?.id,item?.nome,item?.nome_en,item?.propriedades].filter(Boolean).join(' '));
    if(/phaser|faser/.test(txt))return '#bd6cff';
    if(/plasma/.test(txt))return '#4be8ff';
    if(/vibro/.test(txt))return '#f4f7ff';
    if(/laser|luz|light/.test(txt))return '#ff4545';
    return '#7fe8ff';
}
function labCentroAlvoV247_(id){
    try{
        const esc=CSS.escape(String(id));
        const el=document.querySelector(`#labMetricMap .lab-token[data-id="${esc}"],#labMetricMap .lab-map-object[data-id="${esc}"]`);
        if(!el)return null;
        const r=el.getBoundingClientRect();
        return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};
    }catch(_){return null;}
}
function labMostrarGolpeEnergiaV247_(atacante,alvo,item,acertou){
    if(labReducing_)return;
    if(!labItemEnergiaCorpoACorpoV247_(item)||!atacante||!alvo)return;
    const a=labCentroAlvoV247_(atacante.id),b=labCentroAlvoV247_(alvo.id);if(!a||!b)return;
    const cor=labEnergyMeleeCorV247_(item);
    let bx=b.x,by=b.y;
    if(acertou===false){
        const dx=b.x-a.x,dy=b.y-a.y,l=Math.max(1,Math.hypot(dx,dy));
        bx+=(-dy/l)*Math.max(18,b.w*.65);by+=(dx/l)*Math.max(18,b.h*.65);
    }
    const mx=(a.x+bx)/2,my=(a.y+by)/2,dx=bx-a.x,dy=by-a.y,l=Math.max(1,Math.hypot(dx,dy));
    const nx=-dy/l,ny=dx/l,curva=Math.max(22,Math.min(68,l*.25));
    const cx=mx+nx*curva,cy=my+ny*curva;

    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',`0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483100;overflow:visible';
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',`M ${a.x} ${a.y} Q ${cx} ${cy} ${bx} ${by}`);
    p.setAttribute('fill','none');p.setAttribute('stroke',cor);p.setAttribute('stroke-width','9');
    p.setAttribute('stroke-linecap','round');p.setAttribute('pathLength','180');
    p.style.cssText=`stroke-dasharray:180;stroke-dashoffset:180;filter:drop-shadow(0 0 4px ${cor}) drop-shadow(0 0 10px ${cor});animation:labEnergySlashIn .42s ease-out forwards`;
    const core=p.cloneNode(true);core.setAttribute('stroke','#fff');core.setAttribute('stroke-width','3');
    core.style.cssText='stroke-dasharray:180;stroke-dashoffset:180;animation:labEnergySlashIn .42s ease-out forwards';
    svg.appendChild(p);svg.appendChild(core);document.body.appendChild(svg);

    const impact=document.createElement('div');
    impact.className='lab-laser-impact-body-v3';
    impact.style.left=`${bx}px`;impact.style.top=`${by}px`;impact.style.color=cor;impact.style.borderColor=cor;
    impact.style.boxShadow=`0 0 10px ${cor},0 0 24px ${cor}`;document.body.appendChild(impact);
    setTimeout(()=>{svg.remove();impact.remove();},650);
}

// Disparo continua para armas à distância; armas energéticas corpo a corpo usam arco.
const labDispararEfeitoVisualAtaqueV247_=labDispararEfeitoVisualAtaque_;
labDispararEfeitoVisualAtaque_=function(atacante,alvo,item,acertou,grau){
    if(labItemEnergiaCorpoACorpoV247_(item)){
        const id=`slash:${Date.now()}:${Math.random().toString(36).slice(2,6)}`;
        labEstado_.efeitoVisualLab={id,tipo:'energia_melee',atacanteId:String(atacante?.id||''),alvoId:String(alvo?.id||''),itemId:String(item?.id||''),cor:labEnergyMeleeCorV247_(item),acertou:!!acertou,ts:Date.now()};
        labSalvarLocal_();labAgendarSyncRemoto_();
        setTimeout(()=>labMostrarGolpeEnergiaV247_(atacante,alvo,item,acertou),60);
        return;
    }
    return labDispararEfeitoVisualAtaqueV247_(atacante,alvo,item,acertou,grau);
};

// Clientes remotos também veem o arco de energia.
const labRenderV247FX_=labRender_;

window.labRender_=labRender_;

// ---------- Objetos: fogo, rachaduras e explosão ----------
function labObjetoInflamavelV247_(o){
    const m=labObjetoModelo_(o);
    if(o?.inflamavel===true||m?.inflamavel===true)return true;
    const txt=normalizarTextoCombate_(`${o?.nome||''} ${o?.material||''} ${m?.nome||''} ${m?.material||''} ${m?.descricao||''}`);
    return /arvore|árvore|palmeira|palm|tree|madeira|wood|papel|paper|tecido|cloth|planta|folha|folhas|inflam/.test(txt);
}
function labObjetoFragilV247_(o){
    const m=labObjetoModelo_(o);
    const txt=normalizarTextoCombate_(`${o?.nome||''} ${o?.material||''} ${m?.nome||''} ${m?.material||''} ${m?.descricao||''}`);
    return /vidro|glass|cristal|crystal|ceram|porcel|rocha|rock|pedra|stone/.test(txt);
}
function labObjetoEnergiaIncendiariaV247_(item){
    const txt=normalizarTextoCombate_(`${getNome(item)||''} ${item?.propriedades||''} ${item?.tags||''}`);
    return /incendi|fogo|flame|plasma|laser|blaster/.test(txt);
}
function labExplosaoVisualObjetoV247_(o){
    const el=(()=>{try{return document.querySelector(`#labMetricMap .lab-map-object[data-id="${CSS.escape(String(o.id))}"]`)}catch(_){return null}})();
    if(!el)return;
    const r=el.getBoundingClientRect(),d=document.createElement('div');
    d.className='lab-object-explosion-v2';d.style.left=`${r.left+r.width/2}px`;d.style.top=`${r.top+r.height/2}px`;
    document.body.appendChild(d);setTimeout(()=>d.remove(),750);
}

const labObjetoHtmlV247_=labObjetoHtml_;
labObjetoHtml_=function(o,ppm){
    let h=labObjetoHtmlV247_(o,ppm);
    let extras='';
    if(o?.pegandoFogoLab)extras+=`<div class="lab-object-fire-v2"><span>🔥</span><span>🔥</span><span>🔥</span></div>`;
    if(o?.despedacadoLab)extras+=`<div class="lab-object-crack-v2"></div>`;
    if(extras)h=h.replace(/<\/div>\s*$/i,extras+'</div>');
    return h;
};
window.labObjetoHtml_=labObjetoHtml_;

// Em objetos, ataque energético bem-sucedido pode incendiar; crítico também
// pode despedaçar materiais frágeis. Nada de "Sangrando".
const labDispararEfeitoVisualAtaqueV247Obj_=labDispararEfeitoVisualAtaque_;
labDispararEfeitoVisualAtaque_=function(atacante,alvo,item,acertou,grau){
    const r=labDispararEfeitoVisualAtaqueV247Obj_(atacante,alvo,item,acertou,grau);
    if(acertou&&labEhAlvoObjeto_(alvo)){
        const g=batalhaResultadoGradeValor_(grau);
        if(labObjetoInflamavelV247_(alvo)&&labObjetoEnergiaIncendiariaV247_(item)){
            // Em sucesso normal, só propriedades claramente incendiárias/plasma;
            // laser/blaster precisam crítico para acender materiais comuns.
            const txt=normalizarTextoCombate_(`${getNome(item)||''} ${item?.propriedades||''}`);
            if(/incendi|fogo|flame|plasma/.test(txt)||g>=3)alvo.pegandoFogoLab=true;
        }
        if(g>=3&&labObjetoFragilV247_(alvo))alvo.despedacadoLab=true;
        if(g>=4&&labObjetoFragilV247_(alvo)){
            alvo.explodindoLab=true;
            setTimeout(()=>labExplosaoVisualObjetoV247_(alvo),80);
        }
    }
    return r;
};

// ---------- Dano simples de fogo: 1 PV por rodada ----------
function labProcessarFogoObjetosV247_(){
    if(labEstado_.fase!=='combate')return;
    const rodada=Number(labEstado_.rodada||0);
    for(const o of (labEstado_.objetosLab||[])){
        if(!o.pegandoFogoLab||o.destruido)continue;
        if(Number(o.fogoUltimaRodadaLab)===rodada)continue;
        o.fogoUltimaRodadaLab=rodada;
        const antes=Number(o.pvAtual??o.pvMax??0);
        o.pvAtual=Math.max(0,antes-1);
        labAdicionarFloat_(o,-1,'dano');
        if(o.pvAtual<=0)o.destruido=true;
    }
}
const labEncerrarOportunidadeV247_=window.labEncerrarOportunidade_;
window.labEncerrarOportunidade_=function(){
    const r=labEncerrarOportunidadeV247_();
    labProcessarFogoObjetosV247_();
    labSalvarLocal_();labAgendarSyncRemoto_();
    return r;
};



// ============================================================
// V46.51.0 — lâminas de energia, alcance melee, som/FX e fogo
// ============================================================

// Reconhecimento explícito: "Espada de Força" é uma lâmina de energia,
// mesmo que seu nome não contenha laser/plasma/vibro.
function labEhLaminaEnergia481_(item){
    if(!item)return false;
    const txt=normalizarTextoCombate_([
      item.id,item.nome,item.nome_en,item.nome_zh,item.categoria,item.tipo,
      item.familiaArma,item.plataforma,item.tecnologia,item.propriedades,item.tags
    ].filter(Boolean).join(' '));
    const lamina=/espada|sabre|saber|sword|blade|lamina|lâmina|vibro/.test(txt);
    const energia=/forca|força|force|energia|energy|laser|plasma|phaser|faser|luz|light|vibro/.test(txt);
    return lamina&&energia;
}

// Substitui o detector legado usado pelas versões anteriores.
labItemEnergiaCorpoACorpoV247_=labEhLaminaEnergia481_;

const itemEhCorpoACorpo481Base_=itemEhCorpoACorpo_;
itemEhCorpoACorpo_=function(item){
    if(labEhLaminaEnergia481_(item))return true;
    return itemEhCorpoACorpo481Base_(item);
};

const labAtaqueEhDistancia481Base_=labAtaqueEhDistancia_;
labAtaqueEhDistancia_=function(item){
    if(labEhLaminaEnergia481_(item))return false;
    return labAtaqueEhDistancia481Base_(item);
};

const labAlcanceAtaque481Base_=labAlcanceAtaque_;
labAlcanceAtaque_=function(t,item){
    if(labEhLaminaEnergia481_(item))return 2.2;
    // Faca/adaga/espada corpo a corpo nunca herdam alcance de munição ou
    // um alcanceMetros antigo incorreto.
    const txt=normalizarTextoCombate_(`${item?.nome||''} ${item?.nome_en||''} ${item?.categoria||''}`);
    if(itemEhCorpoACorpo_(item)){
        if(/lanca|lança|spear|haste|polearm/.test(txt))return 3.0;
        if(/espada|sabre|sword|machado|axe/.test(txt))return 2.1;
        if(/faca|adaga|knife|dagger/.test(txt))return 1.8;
    }
    return labAlcanceAtaque481Base_(t,item);
};

// Compatibilidade: lâmina energética é +1 com Armas Brancas Longas e
// 0 com Lâminas de Energia/Vibrolâminas.
const familiasArmaCompat481Base_=familiasArmaCompatV46471_;
familiasArmaCompatV46471_=function(item){
    const f=familiasArmaCompat481Base_(item);
    if(labEhLaminaEnergia481_(item)){
        f.add('plasma_vibro');f.add('lamina_energia');f.add('branca_longa');f.add('energia');
    }
    return f;
};
const penalidadeCompatibilidadeArma481Base_=penalidadeCompatibilidadeArma_;
penalidadeCompatibilidadeArma_=function(pericia,item){
    const id=String(pericia?.id||'');
    const nomePericia=normalizarTextoCombate_(`${id} ${getNome(pericia)||''}`);
    // Especializações amplas de energia exótica cobrem blasters, disruptores,
    // phasers e demais emissores energéticos experimentais. A regra anterior
    // não reconhecia estes IDs novos e caía no fallback de +2 graus.
    if(/energia.*exot|exot.*energia/.test(nomePericia)&&familiasArmaCompatV46471_(item).has('energia'))return 0;
    if(labEhLaminaEnergia481_(item)){
        if(id==='esgrima_plasma_vibro'||id==='laminas_energia'||id==='laminas_energia_vibro')return 0;
        if(id==='armas_brancas_longas')return 1;
        if(id==='armas_brancas_curtas'||id==='armas_haste'||id==='armas_improvisadas')return 2;
    }
    return penalidadeCompatibilidadeArma481Base_(pericia,item);
};

// Som próprio de lâmina energética: zumbido + varredura.
// É original/procedural e não usa áudio de franquias externas.
function somLaminaEnergia481_(){
    if(labReducing_)return;
    const ctx=obterAudioCtx_();if(!ctx)return;
    const t=ctx.currentTime;

    const hum=ctx.createOscillator(),hg=ctx.createGain();
    hum.type='sawtooth';hum.frequency.setValueAtTime(92,t);hum.frequency.exponentialRampToValueAtTime(118,t+.24);
    hg.gain.setValueAtTime(.001,t);hg.gain.linearRampToValueAtTime(.045,t+.025);hg.gain.exponentialRampToValueAtTime(.001,t+.30);
    hum.connect(hg).connect(ctx.destination);hum.start(t);hum.stop(t+.31);

    const sw=ctx.createOscillator(),sg=ctx.createGain(),flt=ctx.createBiquadFilter();
    sw.type='triangle';sw.frequency.setValueAtTime(980,t+.035);sw.frequency.exponentialRampToValueAtTime(155,t+.24);
    flt.type='bandpass';flt.frequency.value=720;flt.Q.value=.8;
    sg.gain.setValueAtTime(.001,t+.03);sg.gain.linearRampToValueAtTime(.06,t+.055);sg.gain.exponentialRampToValueAtTime(.001,t+.27);
    sw.connect(flt).connect(sg).connect(ctx.destination);sw.start(t+.03);sw.stop(t+.28);
}
const labSomAtaque481Base_=labSomAtaque_;
labSomAtaque_=function(item,grau=''){
    if(labReducing_)return;
    if(labEhLaminaEnergia481_(item)){
        somLaminaEnergia481_();
        if(String(grau).toLowerCase().includes('crít')||String(grau).toLowerCase().includes('crit')){
            setTimeout(()=>{try{somCriticoArma_(item,getNome(item)||'');}catch(_){}},80);
        }
        return;
    }
    return labSomAtaque481Base_(item,grau);
};

// Visual corpo a corpo: força o arco luminoso para Espada de Força.
const labDispararEfeitoVisualAtaque481Base_=labDispararEfeitoVisualAtaque_;
labDispararEfeitoVisualAtaque_=function(atacante,alvo,item,acertou,grau){
    if(labEhLaminaEnergia481_(item)){
        const fx={
          id:`slash481:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,
          tipo:'energia_melee',atacanteId:String(atacante?.id||''),alvoId:String(alvo?.id||''),
          itemId:String(item?.id||''),cor:labEnergyMeleeCorV247_(item),acertou:!!acertou,
          grau:String(grau||''),ts:Date.now()
        };
        labEstado_.efeitoVisualLab=fx;
        labSalvarLocal_();labAgendarSyncRemoto_();
        setTimeout(()=>labMostrarGolpeEnergiaV247_(atacante,alvo,item,acertou),70);
        labAplicarEfeitoObjetoEnergia481_(alvo,item,acertou,grau);
        return;
    }
    const r=labDispararEfeitoVisualAtaque481Base_(atacante,alvo,item,acertou,grau);
    labAplicarEfeitoObjetoEnergia481_(alvo,item,acertou,grau);
    return r;
};

// Inflamabilidade 0–5. Se o banco já possuir o campo, ele é respeitado.
// Caso contrário, há um fallback semântico provisório.
function labInflamabilidadeObjeto481_(o){
    const m=labObjetoModelo_(o);
    const explicito=Number(o?.inflamabilidade??m?.inflamabilidade);
    if(Number.isFinite(explicito))return Math.max(0,Math.min(5,Math.round(explicito)));
    const txt=normalizarTextoCombate_(`${o?.nome||''} ${o?.material||''} ${m?.nome||''} ${m?.material||''} ${m?.descricao||''}`);
    if(/combustivel|fuel|gasolina|alcool|óleo|oleo|palha|papel seco/.test(txt))return 5;
    if(/galho seco|madeira seca|folha seca|papel|tecido/.test(txt))return 4;
    if(/madeira|wood/.test(txt))return 3;
    if(/arvore|árvore|tree|planta|folha/.test(txt))return 2;
    return 0;
}
function labCalorArma481_(item){
    const txt=normalizarTextoCombate_(`${getNome(item)||''} ${item?.nome_en||''} ${item?.propriedades||''} ${item?.tags||''}`);
    if(/incendi|fogo|flame/.test(txt))return 5;
    if(/plasma/.test(txt))return 4;
    if(labEhLaminaEnergia481_(item)||/laser/.test(txt))return 3;
    if(/blaster|phaser|faser/.test(txt))return 2;
    return 0;
}
function labAlvoJaInerte481_(alvo){
    if(!alvo)return false;
    if(labEhAlvoObjeto_(alvo))return !!alvo.destruido||Number(alvo.pvAtual??alvo.pvMax??1)<=0;
    if(alvo.morto===true||alvo.morta===true||alvo.derrotado===true)return true;
    const c=labCharToken_(alvo);
    if(c?.morto===true||c?.morta===true||c?.derrotado===true)return true;
    return false;
}
function labAplicarEfeitoObjetoEnergia481_(alvo,item,acertou,grau){
    if(!acertou||!labEhAlvoObjeto_(alvo)||labAlvoJaInerte481_(alvo))return;
    const inflam=labInflamabilidadeObjeto481_(alvo),calor=labCalorArma481_(item);
    if(inflam<=0||calor<=0)return;
    const crit=batalhaResultadoGradeValor_(grau)>=3;
    // Quanto mais inflamável, menor o calor necessário. Crítico soma 2.
    const necessario=Math.max(1,6-inflam);
    if(calor+(crit?2:0)>=necessario){
        alvo.pegandoFogoLab=true;
        alvo.inflamabilidadeLab=inflam;
    }
}

// Alvos mortos/destruídos ainda podem receber dano, mas não geram novos
// efeitos especiais.
const labEfeitosDisponiveis481Base_=labEfeitosDisponiveis_;
labEfeitosDisponiveis_=function(pend){
    const alvo=labAlvoAtaquePorId_(pend?.defensorId)||labObjetoPorId_(pend?.defensorId);
    if(labAlvoJaInerte481_(alvo))return [];
    return labEfeitosDisponiveis481Base_(pend);
};

// Objetos destruídos continuam na lista de alvos para permitir dano excedente.
const labAlvosAtaque481Base_=labAlvosAtaque_;
labAlvosAtaque_=function(t){
    const base=(labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t?.id));
    const objs=(labEstado_.objetosLab||[]).filter(o=>o.destrutivel!==false);
    return [...base,...objs];
};

// Overlay de fogo robusto aplicado depois do render, sem depender de
// substituição de HTML interno.
function labRenderFogoObjetos481_(){
    if(labReducing_)return;
    const map=document.getElementById('labMetricMap');if(!map)return;
    for(const o of (labEstado_.objetosLab||[])){
        let node=null;
        try{node=map.querySelector(`.lab-map-object[data-id="${CSS.escape(String(o.id))}"]`);}catch(_){}
        if(!node)continue;
        node.querySelectorAll('.lab-fire-overlay-481').forEach(x=>x.remove());
        if(o.pegandoFogoLab&&!o.destruido){
            const f=document.createElement('div');f.className='lab-fire-overlay-481';f.textContent='🔥🔥';
            node.appendChild(f);
        }
    }
}

const labRender481Base_=labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.51.0
// Alvos mortos, Restaurar total, fogo, Oficina vetorial/editável,
// carregar mapas na Oficina e música compartilhada.
// ============================================================

// ------------------------------------------------------------
// 1) Mortos/destruídos: ainda recebem dano, mas sem novos efeitos
// ------------------------------------------------------------
function labAlvoInerte490_(alvo){
    if(!alvo)return false;
    if(labEhAlvoObjeto_(alvo)){
        return !!alvo.destruido || Number(alvo.pvAtual??alvo.pvMax??1)<=0;
    }
    const st=alvo.combateLab || labGarantirSnapshotCombate_(alvo);
    return !!(st?.morto || alvo.morto || alvo.morta || alvo.derrotado);
}
function labLimparEfeitosInerte490_(alvo){
    if(!alvo)return;
    if(labEhAlvoObjeto_(alvo)){
        if(labAlvoInerte490_(alvo)){
            alvo.pegandoFogoLab=false;
            alvo.despedacadoLab=false;
            alvo.explodindoLab=false;
            alvo.sangrando=false;
            alvo.derrubado=false;
            alvo.atordoado=false;
        }
        return;
    }
    const st=alvo.combateLab || labGarantirSnapshotCombate_(alvo);
    if(st?.morto){
        st.sangrando=false;
        st.sangramentoAtivo=false;
        st.derrubado=false;
        st.caido=false;
        st.atordoado=false;
        st.armaDanificada=false;
    }
}

const labAplicarDanoLocal490Base_=labAplicarDanoLocal_;
labAplicarDanoLocal_=function(defensor,total,item,opcoes={}){
    const r=labAplicarDanoLocal490Base_(defensor,total,item,opcoes);
    if(labAlvoInerte490_(defensor))labLimparEfeitosInerte490_(defensor);
    return r;
};

const labEfeitosDisponiveis490Base_=labEfeitosDisponiveis_;
labEfeitosDisponiveis_=function(pend){
    const alvo=labAlvoAtaquePorId_(pend?.defensorId);
    if(labAlvoInerte490_(alvo))return [];
    return labEfeitosDisponiveis490Base_(pend);
};

function labSanearPendenciasMortos490_(){
    const dp=labEstado_.danoPendenteLab;
    if(dp&&labAlvoInerte490_(labAlvoAtaquePorId_(dp.defensorId))){
        dp.efeitosRestantes=0;
        dp.efeitosEscolhidos=[];
        dp.escolhendoLocalizacao=false;
        dp.aplicarSangrar=false;
        dp.aplicarDerrubar=false;
        dp.danificarArma=false;
    }
    for(const t of labEstado_.tokens||[])if(labAlvoInerte490_(t))labLimparEfeitosInerte490_(t);
    for(const o of labEstado_.objetosLab||[])if(labAlvoInerte490_(o))labLimparEfeitosInerte490_(o);
}

// Ao selecionar outro alvo, não deixa uma pendência antiga de um morto prender o painel.
const labSelecionar490Base_=window.labSelecionar_;
window.labSelecionar_=function(id){
    labSanearPendenciasMortos490_();
    const novo=labAlvoAtaquePorId_(id);
    const ator=labTokenAtual_();
    if(ator && novo && String(ator.id)!==String(novo.id) && !labEstado_.pendenciaLab && !labEstado_.danoPendenteLab){
        ator.alvoLab=String(novo.id);
    }
    return labSelecionar490Base_(id);
};

// Se o alvo escolhido deixou de ser válido para a preferência, não volta ao morto automaticamente.
const labGarantirPrefsAtaque490Base_=labGarantirPrefsAtaque_;
labGarantirPrefsAtaque_=function(t){
    const anterior=String(t?.alvoLab||'');
    labGarantirPrefsAtaque490Base_(t);
    if(!t)return;
    const alvos=labAlvosAtaque_(t);
    if(anterior && alvos.some(a=>String(a.id)===anterior))t.alvoLab=anterior;
};

// ------------------------------------------------------------
// 2) Restaurar = toda a mesa de testes
// ------------------------------------------------------------
function labRestaurarTokenCompleto490_(t){
    if(!t)return;
    const st=t.combateLab||labGarantirSnapshotCombate_(t);
    if(st){
        st.hit=JSON.parse(JSON.stringify(st.hitMax||st.hit||{}));
        st.ferimentos={};
        st.morto=false;st.inconsciente=false;st.incapacitado=false;
        st.sangrando=false;st.sangramentoAtivo=false;st.derrubado=false;st.caido=false;
        st.atordoado=false;st.armaDanificada=false;st.ataquesBloqueadosTurnos=0;
        st.fadiga='Fresh';
    }
    t.psiGastosLab=0;
    t.municaoLab={};
    t.acoesAtuaisLab=Number(t.acoesMaxLab||t.acoesMax||2);
    t.movimentoGratisDisponivel=true;
    t.movimentoBonusLab=0;
    t.primeirosSocorrosLab=null;
    t.bonusIntuicaoPendenteLab=0;
    t.sortePreparadaLab=false;
    t.caidoPsiLab=false;
    t.acoesDefensivasPsiLab=0;
    t.agilidadePsiBonusLab=0;
    t.agilidadePsiAteRodadaLab=-1;
    t.menteAceleradaCargasLab=0;
    t.meditacaoBatalhaPsiLab=null;
    t.medoPsiLab=null;
    t.mimetismoPsiLab=null;
    t.cranioAcoLab=null;
    t.circuloProtecaoPsiLab=null;
    t.anoitecerPsiLab=null;
    const c=labCharToken_(t);
    if(c){
        t.charLab={...(t.charLab||{}),...labSnapshotChar_(c),pontosMagiaGastos:0};
        try{t.charLab.pontosSorte=pontosSorteMax_(c);}catch(_){}
    }
}
window.labRestaurarParticipantes_=async function(){
    if(!batalhaEhMestre_())return;
    if(!confirm('Restaurar toda a Mesa de testes? PCs, NPCs, monstros, criaturas e objetos voltarão ao estado inicial de combate.'))return;
    for(const t of labEstado_.tokens||[])labRestaurarTokenCompleto490_(t);
    for(const o of labEstado_.objetosLab||[]){
        o.pvAtual=Number(o.pvMax??o.pvAtual??0);
        o.destruido=false;
        o.pegandoFogoLab=false;
        o.despedacadoLab=false;
        o.explodindoLab=false;
        o.fogoUltimaRodadaLab=-1;
        o.sangrando=false;o.derrubado=false;o.atordoado=false;
    }
    labEstado_.pendenciaLab=null;
    labEstado_.danoPendenteLab=null;
    labSalvarLocal_();labAgendarSyncRemoto_();labRender_();
    notificar_('♻️ Mesa restaurada por completo.','sucesso',3500);
};

// ------------------------------------------------------------
// 3) Inflamabilidade e fogo visível
// ------------------------------------------------------------
const preencherEditorObjetoMapa490Base_=preencherEditorObjetoMapa_;
preencherEditorObjetoMapa_=function(o){
    preencherEditorObjetoMapa490Base_(o);
    const e=document.getElementById('objMapaInflamabilidade');
    if(e)e.value=Number.isFinite(Number(o?.inflamabilidade))?Math.max(0,Math.min(5,Number(o.inflamabilidade))):(o?.inflamavel?3:0);
};

const salvarObjetoMapaEditor490Base_=window.salvarObjetoMapaEditor_;
window.salvarObjetoMapaEditor_=async function(){
    const e=document.getElementById('objMapaInflamabilidade');
    const valor=e?Math.max(0,Math.min(5,Math.trunc(Number(e.value)||0))):0;
    const cb=document.getElementById('objMapaInflamavel');
    if(cb)cb.checked=valor>0;
    await salvarObjetoMapaEditor490Base_();
    const id=String(document.getElementById('objMapaEditId')?.value||'');
    const nome=String(document.getElementById('objMapaNome')?.value||'').trim();
    const o=(objetosMapaDB||[]).find(x=>String(x.id)===id) || [...(objetosMapaDB||[])].reverse().find(x=>String(x.nome||'')===nome);
    if(o){
        o.inflamabilidade=valor;o.inflamavel=valor>0;
        try{await setDoc(doc(db,'configuracoes',objetoMapaDocId_(o.id)),JSON.parse(JSON.stringify(o)),{merge:true});}catch(err){console.warn('Inflamabilidade',err);}
    }
};

const labObjetoHtml490Base_=labObjetoHtml_;
labObjetoHtml_=function(o,ppm){
    if(labAlvoInerte490_(o))labLimparEfeitosInerte490_(o);
    let h=labObjetoHtml490Base_(o,ppm);
    if(o?.pegandoFogoLab&&!o?.destruido && !h.includes('lab-fire-490')){
        h=h.replace(/<\/div>\s*$/i,'<span class="lab-fire-490">🔥🔥</span></div>');
    }
    return h;
};
window.labObjetoHtml_=labObjetoHtml_;

// ------------------------------------------------------------
// 4) Mapas agora preservam formas vetoriais
// ------------------------------------------------------------
const labMapaSepararPayload490Base_=labMapaSepararPayload_;
labMapaSepararPayload_=function(dados){
    const r=labMapaSepararPayload490Base_(dados);
    // Recria as partes incluindo "formas", sem mudar o restante do formato.
    const meta={...dados};
    const payload={desenhos:meta.desenhos||[],objetos:meta.objetos||[],formas:meta.formas||[]};
    delete meta.desenhos;delete meta.objetos;delete meta.formas;delete meta.__local;
    const texto=JSON.stringify(payload),partes=[];
    for(let i=0;i<texto.length;i+=LAB_MAPA_PARTE_CHARS_)partes.push(texto.slice(i,i+LAB_MAPA_PARTE_CHARS_));
    if(!partes.length)partes.push('{}');
    return {meta:{...meta,formato:'partes-v1',partes:partes.length,tamanhoSerializado:texto.length,tipo:'mapa'},partes};
};

const labMapaHidratar490Base_=labMapaHidratar_;
labMapaHidratar_=async function(m){
    if(!m)return null;
    if(m.formato!=='partes-v1')return {...m,formas:Array.isArray(m.formas)?m.formas:[]};
    const n=Math.max(1,Number(m.partes||1));let texto='';
    for(let i=0;i<n;i++){
        const snap=await getDoc(doc(db,'mapas',labMapaParteId_(m.id,i)));
        if(!snap.exists())throw new Error(`Parte ${i+1}/${n} do mapa não encontrada.`);
        texto+=String(snap.data()?.dados||'');
    }
    const payload=JSON.parse(texto||'{}');
    return {...m,
      desenhos:Array.isArray(payload.desenhos)?payload.desenhos:[],
      objetos:Array.isArray(payload.objetos)?payload.objetos:[],
      formas:Array.isArray(payload.formas)?payload.formas:[]
    };
};

// ------------------------------------------------------------
// 5) Oficina: carregar/editar mapas + formas editáveis
// ------------------------------------------------------------
let gmOficinaMapaAtualId490_='';
const gmVet490_={tool:'select',stroke:'#00d4ff',fill:'#34537a',opacity:.65,strokeWidth:3,selectedId:''};
let gmVet490Criando_=null;
let gmVet490Undo_=[];

function gmVet490Formas_(){
    gmOficinaEstado_.formas=Array.isArray(gmOficinaEstado_.formas)?gmOficinaEstado_.formas:[];
    return gmOficinaEstado_.formas;
}
function gmVet490Ppm_(){return typeof gmOficinaV2Ppm_==='function'?gmOficinaV2Ppm_():32;}
function gmVet490Hist_(){gmVet490Undo_.push(JSON.parse(JSON.stringify(gmVet490Formas_())));if(gmVet490Undo_.length>60)gmVet490Undo_.shift();}
function gmVet490Forma_(id){return gmVet490Formas_().find(x=>String(x.id)===String(id));}
function gmVet490Sel_(){return gmVet490Forma_(gmVet490_.selectedId);}
function gmVet490Clamp_(v,min,max){return Math.max(min,Math.min(max,Number(v)||0));}

function gmVet490SvgEl_(f,ppm){
    const id=String(f.id).replace(/'/g,"\\'");
    const stroke=f.stroke||'#00d4ff',fill=f.tipo==='linha'?'none':(f.fill||'transparent');
    const op=Number(f.opacity??.65),sw=Number(f.strokeWidth||3);
    const x=Number(f.x||0)*ppm,y=Number(f.y||0)*ppm,w=Number(f.w||0)*ppm,h=Number(f.h||0)*ppm;
    const cx=(Number(f.x||0)+Number(f.w||0)/2)*ppm,cy=(Number(f.y||0)+Number(f.h||0)/2)*ppm;
    const common=`stroke="${stroke}" stroke-width="${sw}" fill="${fill}" opacity="${op}" transform="rotate(${Number(f.rot||0)} ${cx} ${cy})" data-vet-id="${escaparHtmlInventario_(f.id)}" class="${String(f.id)===String(gmVet490_.selectedId)?'gm-vector-selected':''}" onpointerdown="gmVet490PointerForma_(event,'${id}')"`;
    if(f.tipo==='linha')return `<line x1="${x}" y1="${y}" x2="${Number(f.x2??f.x)*ppm}" y2="${Number(f.y2??f.y)*ppm}" ${common}/>`;
    if(f.tipo==='circulo'){
        const d=Math.max(Math.abs(w),Math.abs(h));
        return `<ellipse cx="${x+d/2}" cy="${y+d/2}" rx="${d/2}" ry="${d/2}" ${common}/>`;
    }
    if(f.tipo==='elipse')return `<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${Math.abs(w)/2}" ry="${Math.abs(h)/2}" ${common}/>`;
    if(f.tipo==='triangulo')return `<polygon points="${x+w/2},${y} ${x+w},${y+h} ${x},${y+h}" ${common}/>`;
    return `<rect x="${x}" y="${y}" width="${Math.abs(w)}" height="${Math.abs(h)}" ${common}/>`;
}
function gmVet490Render_(){
    const map=document.getElementById('gmOficinaV2Map');if(!map)return;
    let svg=document.getElementById('gmOficinaVectorLayer');
    if(!svg){
        svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.id='gmOficinaVectorLayer';map.appendChild(svg);
    }
    const ppm=gmVet490Ppm_(),w=gmOficinaEstado_.larguraM*ppm,h=gmOficinaEstado_.alturaM*ppm;
    svg.setAttribute('width',w);svg.setAttribute('height',h);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    svg.style.cssText=`position:absolute;inset:0;width:${w}px;height:${h}px;z-index:7;pointer-events:auto;touch-action:none`;
    svg.onpointerdown=gmVet490PointerCanvas_;
    svg.innerHTML=gmVet490Formas_().map(f=>gmVet490SvgEl_(f,ppm)).join('');
    gmVet490Inspector_();
}
function gmVet490Inspector_(){
    const box=document.getElementById('gmVet490Inspector');if(!box)return;
    const f=gmVet490Sel_();
    if(!f){box.innerHTML='<span style="color:#9fb4c8">Selecione uma forma para mover, redimensionar, girar ou recolorir.</span>';return;}
    box.innerHTML=`
      <strong style="color:#ffd54a">${escaparHtmlInventario_(f.tipo)}</strong>
      <label><small>X m</small><input type="number" step=".1" value="${Number(f.x||0)}" onchange="gmVet490Prop_('x',this.value)"></label>
      <label><small>Y m</small><input type="number" step=".1" value="${Number(f.y||0)}" onchange="gmVet490Prop_('y',this.value)"></label>
      ${f.tipo==='linha'
        ? `<label><small>X2 m</small><input type="number" step=".1" value="${Number(f.x2||0)}" onchange="gmVet490Prop_('x2',this.value)"></label>
           <label><small>Y2 m</small><input type="number" step=".1" value="${Number(f.y2||0)}" onchange="gmVet490Prop_('y2',this.value)"></label>`
        : `<label><small>Largura m</small><input type="number" min=".1" step=".1" value="${Number(f.w||1)}" onchange="gmVet490Prop_('w',this.value)"></label>
           <label><small>Altura m</small><input type="number" min=".1" step=".1" value="${Number(f.h||1)}" onchange="gmVet490Prop_('h',this.value)"></label>
           <label><small>Rotação°</small><input type="number" step="5" value="${Number(f.rot||0)}" onchange="gmVet490Prop_('rot',this.value)"></label>`}
      <label><small>Borda</small><input type="color" value="${f.stroke||'#00d4ff'}" onchange="gmVet490Prop_('stroke',this.value)"></label>
      ${f.tipo==='linha'?'':`<label><small>Preenchimento</small><input type="color" value="${f.fill||'#34537a'}" onchange="gmVet490Prop_('fill',this.value)"></label>`}
      <label><small>Opacidade</small><input type="number" min=".05" max="1" step=".05" value="${Number(f.opacity??.65)}" onchange="gmVet490Prop_('opacity',this.value)"></label>
      <label><small>Borda px</small><input type="number" min="1" max="20" step="1" value="${Number(f.strokeWidth||3)}" onchange="gmVet490Prop_('strokeWidth',this.value)"></label>
      <button class="btn-small" onclick="gmVet490Duplicar_()">⧉ Duplicar</button>
      <button class="btn-small btn-danger" onclick="gmVet490Excluir_()">🗑 Excluir</button>`;
}
window.gmVet490Prop_=function(k,v){
    const f=gmVet490Sel_();if(!f)return;
    gmVet490Hist_();
    if(['stroke','fill'].includes(k))f[k]=String(v);
    else f[k]=Number(v);
    if(f.tipo==='quadrado'){
        if(k==='w')f.h=f.w;if(k==='h')f.w=f.h;
    }
    if(f.tipo==='circulo'){
        if(k==='w')f.h=f.w;if(k==='h')f.w=f.h;
    }
    gmOficinaPersistir_();gmVet490Render_();
};
window.gmVet490Tool_=function(tool){
    gmVet490_.tool=String(tool||'select');
    gmOficinaV2Cfg_.ativo=false;
    gmVet490Criando_=null;
    gmVet490Render_();
};
window.gmVet490Duplicar_=function(){
    const f=gmVet490Sel_();if(!f)return;
    gmVet490Hist_();const cp=JSON.parse(JSON.stringify(f));
    cp.id=`vet:${Date.now()}:${Math.random().toString(36).slice(2,5)}`;
    cp.x=Number(cp.x||0)+.5;cp.y=Number(cp.y||0)+.5;
    if(cp.tipo==='linha'){cp.x2=Number(cp.x2||0)+.5;cp.y2=Number(cp.y2||0)+.5;}
    gmVet490Formas_().push(cp);gmVet490_.selectedId=cp.id;gmOficinaPersistir_();gmVet490Render_();
};
window.gmVet490Excluir_=function(){
    const id=gmVet490_.selectedId;if(!id)return;
    gmVet490Hist_();gmOficinaEstado_.formas=gmVet490Formas_().filter(x=>String(x.id)!==String(id));
    gmVet490_.selectedId='';gmOficinaPersistir_();gmVet490Render_();
};
window.gmVet490PointerForma_=function(ev,id){
    if(gmVet490_.tool!=='select')return;
    ev.preventDefault();ev.stopPropagation();
    gmVet490_.selectedId=String(id);
    const f=gmVet490Sel_();if(!f)return;
    gmVet490Hist_();
    const ppm=gmVet490Ppm_(),sx=ev.clientX,sy=ev.clientY;
    const ox=Number(f.x||0),oy=Number(f.y||0),ox2=Number(f.x2||0),oy2=Number(f.y2||0);
    const move=e=>{
        const dx=(e.clientX-sx)/ppm,dy=(e.clientY-sy)/ppm;
        f.x=ox+dx;f.y=oy+dy;
        if(f.tipo==='linha'){f.x2=ox2+dx;f.y2=oy2+dy;}
        gmVet490Render_();
    };
    const up=()=>{window.removeEventListener('pointermove',move);gmOficinaPersistir_();gmVet490Render_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
function gmVet490PointerCanvas_(ev){
    if(ev.target!==ev.currentTarget && ev.target.closest?.('[data-vet-id]'))return;
    if(gmVet490_.tool==='select'){
        gmVet490_.selectedId='';gmVet490Render_();return;
    }
    if(!['linha','retangulo','arredondado','quadrado','circulo','elipse','triangulo'].includes(gmVet490_.tool))return;
    ev.preventDefault();ev.stopPropagation();gmVet490Hist_();
    const svg=ev.currentTarget,r=svg.getBoundingClientRect(),ppm=gmVet490Ppm_();
    const pt=e=>({x:gmVet490Clamp_((e.clientX-r.left)/ppm,0,gmOficinaEstado_.larguraM),y:gmVet490Clamp_((e.clientY-r.top)/ppm,0,gmOficinaEstado_.alturaM)});
    const p0=pt(ev),id=`vet:${Date.now()}:${Math.random().toString(36).slice(2,5)}`;
    const f={id,tipo:gmVet490_.tool,x:p0.x,y:p0.y,w:.1,h:.1,x2:p0.x,y2:p0.y,rot:0,stroke:gmVet490_.stroke,fill:gmVet490_.fill,opacity:gmVet490_.opacity,strokeWidth:gmVet490_.strokeWidth};
    gmVet490Formas_().push(f);gmVet490Criando_=f;gmVet490_.selectedId=id;
    const move=e=>{
        const p=pt(e);
        if(f.tipo==='linha'){f.x2=p.x;f.y2=p.y;}
        else{
            f.w=p.x-f.x;f.h=p.y-f.y;
            if(f.tipo==='quadrado'||f.tipo==='circulo'){
                const d=Math.max(Math.abs(f.w),Math.abs(f.h));
                f.w=(f.w<0?-d:d);f.h=(f.h<0?-d:d);
            }
        }
        gmVet490Render_();
    };
    const up=()=>{window.removeEventListener('pointermove',move);gmVet490Criando_=null;gmOficinaPersistir_();gmVet490_.tool='select';gmVet490Render_();};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
}

function gmVet490InstalarUI_(){
    const root=document.getElementById('gm-sub-oficina-mapas');
    if(!root||document.getElementById('gmVet490Tools'))return;
    const viewport=document.getElementById('gmOficinaV2Viewport');
    if(!viewport)return;
    const panel=document.createElement('div');panel.id='gmVet490Tools';
    panel.style.cssText='margin:9px 0;padding:9px;border:1px solid rgba(255,213,74,.22);border-radius:9px;background:rgba(0,0,0,.12)';
    panel.innerHTML=`
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:end">
        <strong style="color:#ffd54a;align-self:center">📐 Formas editáveis</strong>
        <button class="btn-small" onclick="gmVet490Tool_('select')">🖱 Selecionar</button>
        <button class="btn-small" onclick="gmVet490Tool_('linha')">╱ Linha reta</button>
        <button class="btn-small" onclick="gmVet490Tool_('retangulo')">▭ Retângulo</button>
        <button class="btn-small" onclick="gmVet490Tool_('quadrado')">□ Quadrado</button>
        <button class="btn-small" onclick="gmVet490Tool_('triangulo')">△ Triângulo</button>
        <button class="btn-small" onclick="gmVet490Tool_('circulo')">○ Círculo</button>
        <button class="btn-small" onclick="gmVet490Tool_('elipse')">⬭ Elipse</button>
        <label style="margin:0"><small>Borda nova</small><input type="color" value="${gmVet490_.stroke}" onchange="gmVet490_.stroke=this.value" style="width:48px;height:34px;margin:3px 0 0;padding:2px"></label>
        <label style="margin:0"><small>Preenchimento</small><input type="color" value="${gmVet490_.fill}" onchange="gmVet490_.fill=this.value" style="width:48px;height:34px;margin:3px 0 0;padding:2px"></label>
      </div>
      <div id="gmVet490Inspector"></div>`;
    viewport.parentElement.insertBefore(panel,viewport);
    gmVet490Render_();
}

function gmOficina490InstalarCarregador_(){
    const root=document.getElementById('gm-sub-oficina-mapas');
    if(!root||document.getElementById('gmOficinaMapaSalvo490'))return;
    const top=root.querySelector('h3')?.parentElement;
    if(!top)return;
    const bar=document.createElement('div');
    bar.style.cssText='display:flex;gap:7px;flex-wrap:wrap;align-items:end;margin:8px 0 10px;padding:9px;border-radius:9px;background:rgba(0,0,0,.12);border:1px solid rgba(126,231,255,.18)';
    bar.innerHTML=`<label style="margin:0;min-width:300px"><small>Editar mapa salvo</small><select id="gmOficinaMapaSalvo490" onchange="gmOficina490Carregar_(this.value)" style="width:100%;margin:3px 0 0"><option value="">— carregar mapa —</option></select></label>
      <button class="btn-small btn-select" onclick="gmOficina490SalvarAtual_()">💾 Salvar alterações</button>
      <span id="gmOficinaMapaNome490" style="color:#9fc6d8;align-self:center"></span>`;
    const firstControls=top.querySelector('div[style*="display:flex"]');
    top.insertBefore(bar,firstControls||top.children[2]||null);
    gmOficina490PopularMapas_();
}
function gmOficina490PopularMapas_(){
    const sel=document.getElementById('gmOficinaMapaSalvo490');if(!sel)return;
    const atual=String(gmOficinaMapaAtualId490_||'');
    const lista=[...(mapasDB||[])].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    sel.innerHTML='<option value="">— carregar mapa —</option>'+lista.map(m=>`<option value="${escaparHtmlInventario_(m.id)}">${escaparHtmlInventario_(m.nome||m.id)}</option>`).join('');
    if(lista.some(m=>String(m.id)===atual))sel.value=atual;
}
window.gmOficina490Carregar_=async function(id){
    if(!id)return;
    try{
        const base=(mapasDB||[]).find(m=>String(m.id)===String(id));if(!base)return;
        const m=await labMapaHidratar_(base);
        gmOficinaMapaAtualId490_=String(m.id);
        gmOficinaEstado_={
            larguraM:Number(m.larguraM||28),alturaM:Number(m.alturaM||14),
            escalaPxM:Number(m.pxPorMetro||32),
            fundo:m.fundo||'#d7d7d7',corGrade:m.corGrade||'#777777',
            gradeVisivel:m.gradeVisivel!==false,textura:m.textura||'nenhuma',
            objetos:JSON.parse(JSON.stringify(m.objetos||[])),
            desenhos:JSON.parse(JSON.stringify(m.desenhos||[])),
            formas:JSON.parse(JSON.stringify(m.formas||[]))
        };
        gmVet490_.selectedId='';gmOficinaPersistir_();gmOficinaRender_();
        const n=document.getElementById('gmOficinaMapaNome490');if(n)n.textContent=`Editando: ${m.nome||m.id}`;
        notificar_(`✏️ Mapa “${m.nome||m.id}” carregado na Oficina.`,'sucesso',3000);
    }catch(e){console.error(e);notificar_('Não consegui carregar esse mapa na Oficina.','erro',5000);}
};
window.gmOficina490SalvarAtual_=async function(){
    if(!gmOficinaMapaAtualId490_){return gmOficinaSalvarComoMapa_();}
    const antigo=(mapasDB||[]).find(m=>String(m.id)===String(gmOficinaMapaAtualId490_));
    if(!antigo)return gmOficinaSalvarComoMapa_();
    const dados={
        ...antigo,id:antigo.id,nome:antigo.nome,
        larguraM:gmOficinaEstado_.larguraM,alturaM:gmOficinaEstado_.alturaM,
        pxPorMetro:gmVet490Ppm_(),fundo:gmOficinaEstado_.fundo,corGrade:gmOficinaEstado_.corGrade,
        gradeVisivel:gmOficinaEstado_.gradeVisivel!==false,textura:gmOficinaEstado_.textura||'nenhuma',
        desenhos:JSON.parse(JSON.stringify(gmOficinaEstado_.desenhos||[])),
        objetos:JSON.parse(JSON.stringify(gmOficinaEstado_.objetos||[])),
        formas:JSON.parse(JSON.stringify(gmVet490Formas_())),
        atualizadoEm:new Date().toISOString()
    };
    try{
        const salvo=await labMapaSalvarFirestore_(dados,Number(antigo.partes||0));
        const i=mapasDB.findIndex(m=>String(m.id)===String(antigo.id));if(i>=0)mapasDB[i]=salvo;
        gmOficina490PopularMapas_();labAtualizarSelectMapas_();
        notificar_(`💾 Alterações salvas em “${dados.nome}”.`,'sucesso',3000);
    }catch(e){console.error(e);notificar_('Não foi possível salvar as alterações do mapa.','erro',5000);}
};

// Salvar como novo também leva as formas.
window.gmOficinaSalvarComoMapa_=async function(){
    if(!batalhaEhMestre_())return;
    const nome=prompt('Nome do mapa preparado:','');if(nome==null||!String(nome).trim())return;
    let id=labMapaSlug_(nome),base=id,n=2;while((mapasDB||[]).some(m=>String(m.id)===String(id)))id=`${base}_${n++}`;
    const dados={id,nome:String(nome).trim(),larguraM:gmOficinaEstado_.larguraM,alturaM:gmOficinaEstado_.alturaM,
      pxPorMetro:gmVet490Ppm_(),fundo:gmOficinaEstado_.fundo,corGrade:gmOficinaEstado_.corGrade,
      gradeVisivel:gmOficinaEstado_.gradeVisivel!==false,textura:gmOficinaEstado_.textura||'nenhuma',
      desenhos:JSON.parse(JSON.stringify(gmOficinaEstado_.desenhos||[])),objetos:JSON.parse(JSON.stringify(gmOficinaEstado_.objetos||[])),
      formas:JSON.parse(JSON.stringify(gmVet490Formas_())),criadoPor:currentUserUid||'',atualizadoEm:new Date().toISOString()};
    try{
        const salvo=await labMapaSalvarFirestore_(dados,0);mapasDB.push(salvo);
        gmOficinaMapaAtualId490_=id;gmOficina490PopularMapas_();labAtualizarSelectMapas_();
        notificar_(`Mapa “${dados.nome}” salvo na biblioteca.`,'sucesso',3000);
    }catch(e){console.error(e);notificar_('Não foi possível salvar o mapa preparado.','erro');}
};

// Publicar conserva formas, mas elas ficam estáticas na Mesa.
const gmOficinaPublicarMesa490Base_=window.gmOficinaPublicarMesa_;
window.gmOficinaPublicarMesa_=function(){
    labEstado_.formasLab=JSON.parse(JSON.stringify(gmVet490Formas_()));
    return gmOficinaPublicarMesa490Base_();
};

// Carregar mapa salvo na Mesa conserva formas.
const labCarregarMapaBanco490Base_=window.labCarregarMapaBanco_;
window.labCarregarMapaBanco_=async function(){
    const id=String(labMapaSelecionado_||'');
    const base=(mapasDB||[]).find(m=>String(m.id)===id);
    let m=null;try{if(base)m=await labMapaHidratar_(base);}catch(_){}
    const r=await labCarregarMapaBanco490Base_();
    if(m?.formas)labEstado_.formasLab=JSON.parse(JSON.stringify(m.formas));
    labSalvarLocal_();labRender_();return r;
};

function labRenderFormasMapa490_(){
    if(labReducing_)return;
    const map=document.getElementById('labMetricMap');if(!map)return;
    let svg=document.getElementById('labFormasMapa490');
    if(!svg){svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='labFormasMapa490';map.appendChild(svg);}
    const ppm=Number(labEstado_.pxPorMetro||48),w=Number(labEstado_.larguraM||24)*ppm,h=Number(labEstado_.alturaM||14)*ppm;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.style.cssText=`position:absolute;inset:0;width:${w}px;height:${h}px;z-index:3;pointer-events:none`;
    const formas=Array.isArray(labEstado_.formasLab)?labEstado_.formasLab:[];
    svg.innerHTML=formas.map(f=>gmVet490SvgEl_(f,ppm).replace(/\sdata-vet-id="[^"]*"/,'').replace(/\sonpointerdown="[^"]*"/,'').replace(/\sclass="[^"]*"/,'')).join('');
}

// Cada render da Oficina reinstala as extensões.
const gmOficinaRender490Base_=window.gmOficinaRender_;
window.gmOficinaRender_=function(){
    const r=gmOficinaRender490Base_();
    try{gmOficina490InstalarCarregador_();gmVet490InstalarUI_();gmVet490Render_();}catch(e){console.warn('Oficina 490',e);}
    return r;
};

// ------------------------------------------------------------
// 6) Música compartilhada por link (YouTube ou áudio direto)
// ------------------------------------------------------------
let labAudioAtivado490_=false;
let labAudioElemento490_=null;
let labAudioUltimaChave490_='';
let trilhasMesaDB490_=[];

function labYoutubeId490_(url){
    const s=String(url||'');
    let m=s.match(/[?&]v=([^&]+)/);if(m)return m[1];
    m=s.match(/youtu\.be\/([^?&/]+)/);if(m)return m[1];
    m=s.match(/youtube\.com\/shorts\/([^?&/]+)/);if(m)return m[1];
    m=s.match(/youtube\.com\/embed\/([^?&/]+)/);if(m)return m[1];
    return '';
}
function labAudioParar490_(){
    if(labAudioElemento490_){try{labAudioElemento490_.remove();}catch(_){}labAudioElemento490_=null;}
}
function labAudioAplicar490_(){
    const st=labEstado_.audioMesaLab;
    const key=JSON.stringify(st||{});
    if(key===labAudioUltimaChave490_)return;
    labAudioUltimaChave490_=key;
    labAudioParar490_();
    if(!labAudioAtivado490_||!st?.playing||!st?.url)return;
    const offset=Math.max(0,Math.floor((Date.now()-Number(st.inicioTs||Date.now()))/1000));
    const yid=labYoutubeId490_(st.url);
    if(yid){
        const iframe=document.createElement('iframe');
        iframe.allow='autoplay; encrypted-media';iframe.referrerPolicy='strict-origin-when-cross-origin';
        iframe.style.cssText='position:fixed;width:1px;height:1px;left:-10px;bottom:-10px;border:0;opacity:.01;pointer-events:none';
        iframe.src=`https://www.youtube.com/embed/${encodeURIComponent(yid)}?autoplay=1&start=${offset}&loop=1&playlist=${encodeURIComponent(yid)}&controls=0`;
        document.body.appendChild(iframe);labAudioElemento490_=iframe;
    }else if(/\.(mp3|ogg|wav|m4a)(\?|$)/i.test(st.url)){
        const a=document.createElement('audio');a.src=st.url;a.autoplay=true;a.loop=true;a.volume=Math.max(0,Math.min(1,Number(st.volume??.6)));
        a.style.display='none';document.body.appendChild(a);
        a.addEventListener('loadedmetadata',()=>{try{a.currentTime=Math.min(offset,a.duration||offset);a.play();}catch(_){}},{once:true});
        labAudioElemento490_=a;
    }
}
window.labAudioAtivar490_=function(){
    labAudioAtivado490_=true;
    localStorage.setItem('mesa_estelar_audio_ativado_v1','1');
    labAudioAplicar490_();labAudioFloat490_();
    notificar_('🔊 Áudio da Mesa ativado neste navegador.','sucesso',2500);
};
window.labAudioDesativar490_=function(){
    labAudioAtivado490_=false;localStorage.removeItem('mesa_estelar_audio_ativado_v1');labAudioParar490_();labAudioFloat490_();
};
function labAudioFloat490_(){
    let d=document.getElementById('labAudioMesaFloat');
    if(!d){d=document.createElement('div');d.id='labAudioMesaFloat';document.body.appendChild(d);}
    const st=labEstado_.audioMesaLab;
    if(!labAudioAtivado490_){
        d.innerHTML=`<button class="btn-small btn-select" onclick="labAudioAtivar490_()">🔊 Ativar áudio da mesa</button>${st?.nome?` <span>${escaparHtmlInventario_(st.nome)}</span>`:''}`;
    }else{
        d.innerHTML=`🔊 ${escaparHtmlInventario_(st?.nome||'Áudio da Mesa')} <button class="btn-small" onclick="labAudioDesativar490_()">Silenciar</button>`;
    }
}
async function labTrilhasCarregar490_(){
    if(!batalhaEhMestre_())return;
    try{
        const snap=await getDoc(doc(db,'configuracoes','trilhas_mesa_v1'));
        trilhasMesaDB490_=snap.exists()&&Array.isArray(snap.data()?.trilhas)?snap.data().trilhas:[];
    }catch(e){console.warn('trilhas',e);trilhasMesaDB490_=[];}
    labMusicaRender490_();
}
async function labTrilhasSalvar490_(){
    try{await setDoc(doc(db,'configuracoes','trilhas_mesa_v1'),{trilhas:trilhasMesaDB490_,atualizadoEm:new Date().toISOString()},{merge:false});}
    catch(e){console.error(e);notificar_('Não foi possível salvar o banco de trilhas.','erro');}
}
function labMusicaInstalar490_(){
    if(!batalhaEhMestre_())return;
    const root=document.getElementById('gm-sub-campanha');if(!root||document.getElementById('gmMusica490'))return;
    const box=document.createElement('div');box.id='gmMusica490';box.className='form-section';box.style.marginTop='14px';
    box.innerHTML=`<h3>🎵 Trilha / Ambiente Compartilhado</h3><div style="color:#aaa;margin-bottom:8px">Cole um link do YouTube ou um áudio direto. Os jogadores precisam clicar uma vez em “Ativar áudio da mesa” no próprio navegador.</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:end">
        <label style="margin:0"><small>Nome</small><input id="gmMusicaNome490" placeholder="Batalha em Véspera" style="margin:3px 0 0"></label>
        <label style="margin:0"><small>Momento</small><input id="gmMusicaCat490" placeholder="Batalha / Bar / Tempestade" style="margin:3px 0 0"></label>
        <label style="margin:0;min-width:320px;flex:1"><small>Link</small><input id="gmMusicaUrl490" placeholder="https://youtube.com/..." style="width:100%;margin:3px 0 0"></label>
        <button class="btn-small" onclick="gmMusicaAdicionar490_()">➕ Salvar trilha</button>
      </div>
      <div id="gmMusicaLista490" style="margin-top:9px"></div>`;
    root.appendChild(box);labTrilhasCarregar490_();
}
function labMusicaRender490_(){
    if(labReducing_)return;
    const el=document.getElementById('gmMusicaLista490');if(!el)return;
    el.innerHTML=trilhasMesaDB490_.length?trilhasMesaDB490_.map((t,i)=>`<div style="display:flex;gap:7px;align-items:center;padding:6px 0;border-top:1px solid rgba(255,255,255,.08)">
      <strong style="min-width:160px">${escaparHtmlInventario_(t.nome||'Trilha')}</strong><span style="color:#9fb4c8;min-width:100px">${escaparHtmlInventario_(t.categoria||'')}</span>
      <button class="btn-small btn-select" onclick="gmMusicaTocar490_(${i})">▶ Tocar para todos</button>
      <button class="btn-small" onclick="gmMusicaParar490_()">⏹ Parar</button>
      <button class="btn-small btn-danger" onclick="gmMusicaExcluir490_(${i})">Excluir</button></div>`).join(''):'<div style="color:#888">Nenhuma trilha salva.</div>';
}
window.gmMusicaAdicionar490_=async function(){
    const nome=String(document.getElementById('gmMusicaNome490')?.value||'').trim();
    const categoria=String(document.getElementById('gmMusicaCat490')?.value||'').trim();
    const url=String(document.getElementById('gmMusicaUrl490')?.value||'').trim();
    if(!nome||!url){notificar_('Informe nome e link da trilha.','aviso');return;}
    trilhasMesaDB490_.push({id:`trilha:${Date.now()}`,nome,categoria,url,volume:.6});
    await labTrilhasSalvar490_();labMusicaRender490_();
};
window.gmMusicaExcluir490_=async function(i){trilhasMesaDB490_.splice(Number(i),1);await labTrilhasSalvar490_();labMusicaRender490_();};
window.gmMusicaTocar490_=function(i){
    const t=trilhasMesaDB490_[Number(i)];if(!t)return;
    labEstado_.audioMesaLab={...t,playing:true,inicioTs:Date.now()};
    labSalvarLocal_();labAgendarSyncRemoto_();labAudioUltimaChave490_='';labAudioAplicar490_();labAudioFloat490_();
};
window.gmMusicaParar490_=function(){
    labEstado_.audioMesaLab={...(labEstado_.audioMesaLab||{}),playing:false,inicioTs:Date.now()};
    labSalvarLocal_();labAgendarSyncRemoto_();labAudioUltimaChave490_='';labAudioAplicar490_();labAudioFloat490_();
};

// ------------------------------------------------------------
// 7) Render geral
// ------------------------------------------------------------
const labRender490Base_=labRender_;

window.labRender_=labRender_;

// Estado inicial da preferência de áudio.
try{labAudioAtivado490_=localStorage.getItem('mesa_estelar_audio_ativado_v1')==='1';}catch(_){}



// ============================================================
// V46.51.0 — redimensionamento seguro da Oficina,
// YouTube via IFrame API, áudio compacto e formas -> objeto.
// ============================================================

// ------------------------------------------------------------
// 1) Redimensionamento da Oficina sem deformar o desenho
// ------------------------------------------------------------
let gmResizePendente500_=null;

function gmResizeAnchorFactors500_(anchor){
    const a=String(anchor||'center');
    const fx=/right/.test(a)?1:(/left/.test(a)?0:.5);
    const fy=/bottom/.test(a)?1:(/top/.test(a)?0:.5);
    return {fx,fy};
}
function gmResizeTransformar500_(oldW,oldH,newW,newH,modo,anchor){
    const {fx,fy}=gmResizeAnchorFactors500_(anchor);
    let sx=1,sy=1,dx=0,dy=0;

    if(modo==='scale'){
        const sc=Math.min(newW/Math.max(.001,oldW), newH/Math.max(.001,oldH));
        sx=sy=sc;
        const usedW=oldW*sc,usedH=oldH*sc;
        dx=(newW-usedW)*fx;
        dy=(newH-usedH)*fy;
    }else{
        dx=(newW-oldW)*fx;
        dy=(newH-oldH)*fy;
    }

    const tx=x=>Number(x||0)*sx+dx, ty=y=>Number(y||0)*sy+dy;

    for(const st of (gmOficinaEstado_.desenhos||[])){
        if(Array.isArray(st.pts))st.pts=st.pts.map(p=>({x:tx(p.x),y:ty(p.y)}));
        if(modo==='scale'){
            if(Number.isFinite(Number(st.size)))st.size=Math.max(1,Number(st.size)*sx);
            if(Number.isFinite(Number(st.esp)))st.esp=Math.max(1,Number(st.esp)*sx);
        }
    }

    for(const o of (gmOficinaEstado_.objetos||[])){
        o.x=tx(o.x);o.y=ty(o.y);
        if(modo==='scale'){
            if(Number.isFinite(Number(o.larguraM)))o.larguraM=Math.max(.05,Number(o.larguraM)*sx);
            if(Number.isFinite(Number(o.alturaM)))o.alturaM=Math.max(.05,Number(o.alturaM)*sy);
        }
    }

    for(const f of (gmOficinaEstado_.formas||[])){
        f.x=tx(f.x);f.y=ty(f.y);
        if(f.tipo==='linha'){
            f.x2=tx(f.x2);f.y2=ty(f.y2);
        }else{
            f.w=Number(f.w||0)*sx;f.h=Number(f.h||0)*sy;
        }
        if(modo==='scale'&&Number.isFinite(Number(f.strokeWidth))){
            f.strokeWidth=Math.max(1,Number(f.strokeWidth)*sx);
        }
    }
}
function gmResizeFechar500_(){
    document.getElementById('gmResizeModal500')?.remove();
    gmResizePendente500_=null;
    gmOficinaV2SyncUI_();
}
window.gmResizeAplicar500_=function(modo){
    const p=gmResizePendente500_;if(!p)return;
    const anchor=document.getElementById('gmResizeAnchor500')?.value||'center';
    gmOficinaV2Historico_?.();
    gmResizeTransformar500_(p.oldW,p.oldH,p.newW,p.newH,modo,anchor);
    gmOficinaEstado_.larguraM=p.newW;gmOficinaEstado_.alturaM=p.newH;
    gmOficinaPersistir_();gmResizeFechar500_();gmOficinaRender_();
};
window.gmResizeCancelar500_=function(){gmResizeFechar500_();};

window.gmOficinaV2Tamanho_=function(v){
    const m=String(v||'').match(/^(\d+)x(\d+)$/);if(!m)return;
    const newW=Number(m[1]),newH=Number(m[2]);
    const oldW=Number(gmOficinaEstado_.larguraM||28),oldH=Number(gmOficinaEstado_.alturaM||14);
    if(newW===oldW&&newH===oldH)return;
    document.getElementById('gmResizeModal500')?.remove();
    gmResizePendente500_={oldW,oldH,newW,newH};
    const d=document.createElement('div');d.id='gmResizeModal500';
    d.innerHTML=`<div class="card">
      <h3 style="margin-top:0;color:#8ee7ff">📐 Redimensionar mapa</h3>
      <div style="color:#c8d1df">De <b>${oldW} × ${oldH} m</b> para <b>${newW} × ${newH} m</b>.</div>
      <label style="display:block;margin-top:12px">Âncora
        <select id="gmResizeAnchor500" style="width:100%;margin-top:5px">
          <option value="top-left">Superior esquerda</option>
          <option value="top">Superior centro</option>
          <option value="top-right">Superior direita</option>
          <option value="left">Centro esquerda</option>
          <option value="center" selected>Centro</option>
          <option value="right">Centro direita</option>
          <option value="bottom-left">Inferior esquerda</option>
          <option value="bottom">Inferior centro</option>
          <option value="bottom-right">Inferior direita</option>
        </select>
      </label>
      <div class="opts">
        <button class="btn-small btn-select" onclick="gmResizeAplicar500_('preserve')"><b>Preservar metros</b><br><small>Não deforma lago, caminhos, objetos ou formas. Só adiciona/corta área nas bordas.</small></button>
        <button class="btn-small" onclick="gmResizeAplicar500_('scale')"><b>Escalar proporcionalmente</b><br><small>Aumenta/reduz todo o conteúdo sem alterar suas proporções.</small></button>
      </div>
      <button class="btn-small" onclick="gmResizeCancelar500_()">Cancelar</button>
    </div>`;
    document.body.appendChild(d);
};

// ------------------------------------------------------------
// 2) Converter as formas da Oficina em objeto top-view
// ------------------------------------------------------------
function gmVet500Bounds_(){
    const fs=gmVet490Formas_();if(!fs.length)return null;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const f of fs){
        if(f.tipo==='linha'){
            minX=Math.min(minX,Number(f.x||0),Number(f.x2||0));maxX=Math.max(maxX,Number(f.x||0),Number(f.x2||0));
            minY=Math.min(minY,Number(f.y||0),Number(f.y2||0));maxY=Math.max(maxY,Number(f.y||0),Number(f.y2||0));
        }else{
            const x1=Number(f.x||0),y1=Number(f.y||0),x2=x1+Number(f.w||0),y2=y1+Number(f.h||0);
            minX=Math.min(minX,x1,x2);maxX=Math.max(maxX,x1,x2);
            minY=Math.min(minY,y1,y2);maxY=Math.max(maxY,y1,y2);
        }
    }
    if(!Number.isFinite(minX))return null;
    return {minX,minY,maxX,maxY,w:Math.max(.1,maxX-minX),h:Math.max(.1,maxY-minY)};
}
function gmVet500SvgShape_(f,scale,b){
    const shiftX=x=>(Number(x||0)-b.minX)*scale,shiftY=y=>(Number(y||0)-b.minY)*scale;
    const stroke=f.stroke||'#00d4ff',fill=f.tipo==='linha'?'none':(f.fill||'transparent');
    const op=Number(f.opacity??.65),sw=Math.max(1,Number(f.strokeWidth||3));
    const x=shiftX(f.x),y=shiftY(f.y),w=Number(f.w||0)*scale,h=Number(f.h||0)*scale;
    const cx=x+w/2,cy=y+h/2,rot=Number(f.rot||0);
    const common=`stroke="${stroke}" stroke-width="${sw}" fill="${fill}" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"`;
    if(f.tipo==='linha')return `<line x1="${x}" y1="${y}" x2="${shiftX(f.x2)}" y2="${shiftY(f.y2)}" ${common}/>`;
    if(f.tipo==='circulo'){const d=Math.max(Math.abs(w),Math.abs(h));return `<ellipse cx="${x+d/2}" cy="${y+d/2}" rx="${d/2}" ry="${d/2}" ${common}/>`;}
    if(f.tipo==='elipse')return `<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${Math.abs(w)/2}" ry="${Math.abs(h)/2}" ${common}/>`;
    if(f.tipo==='triangulo')return `<polygon points="${x+w/2},${y} ${x+w},${y+h} ${x},${y+h}" ${common}/>`;
    return `<rect x="${x}" y="${y}" width="${Math.abs(w)}" height="${Math.abs(h)}" ${common}/>`;
}
async function gmVet500Rasterizar_(){
    const b=gmVet500Bounds_();if(!b)return null;
    const maxPx=320,scale=Math.min(100, maxPx/Math.max(b.w,b.h));
    const w=Math.max(24,Math.ceil(b.w*scale)+16),h=Math.max(24,Math.ceil(b.h*scale)+16);
    const shapes=gmVet490Formas_().map(f=>gmVet500SvgShape_(f,scale,{...b,minX:b.minX-8/scale,minY:b.minY-8/scale})).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${shapes}</svg>`;
    const blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);
    try{
        const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url;});
        const c=document.createElement('canvas');c.width=w;c.height=h;
        const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0);
        let data=c.toDataURL('image/webp',.86);
        if(data.length>95000)data=c.toDataURL('image/webp',.68);
        return {data,wM:b.w,hM:b.h};
    }finally{URL.revokeObjectURL(url);}
}
window.gmVet500SalvarObjeto_=async function(){
    if(!batalhaEhMestre_())return;
    if(!gmVet490Formas_().length){notificar_('Crie pelo menos uma forma antes de salvar como objeto.','aviso');return;}
    const nome=prompt('Nome do novo objeto top-view:','Objeto desenhado');if(!nome||!String(nome).trim())return;
    try{
        const rr=await gmVet500Rasterizar_();if(!rr)throw new Error('Nada para rasterizar.');
        garantirObjetosMapaPadrao_();
        const lista=JSON.parse(JSON.stringify(objetosMapaDB||[]));
        let id=labMapaSlug_(nome)||`objeto_${Date.now()}`,base=id,n=2;
        while(lista.some(x=>String(x.id)===id))id=`${base}_${n++}`;
        const o={id,nome:String(nome).trim(),imagem:rr.data,tipoVisual:'personalizado',
          larguraM:Math.max(.1,rr.wM),alturaM:Math.max(.1,rr.hM),pvMax:10,dureza:2,pesoKg:10,
          destrutivel:true,inflamavel:false,inflamabilidade:0,bloqueiaMovimento:true,bloqueiaVisao:false,rascunho:true};
        await setDoc(doc(db,'configuracoes',objetoMapaDocId_(id)),o,{merge:false});
        lista.push(o);
        await setDoc(doc(db,'configuracoes','objetosMapa'),{formato:'docs-v1',ids:lista.map(x=>x.id),atualizadoEm:new Date().toISOString()},{merge:false});
        objetosMapaDB=lista;renderizarBancoObjetosMapa_();gmOficinaV2PopularObjetos_?.();
        notificar_(`🧩 “${o.nome}” criado no Banco de Objetos com fundo transparente.`,'sucesso',4200);
    }catch(e){console.error(e);notificar_(`Não consegui criar o objeto: ${e?.message||e}`,'erro',6000);}
};

// Acrescenta botão ao painel vetorial já existente.
const gmVet490InstalarUI500Base_=gmVet490InstalarUI_;
gmVet490InstalarUI_=function(){
    gmVet490InstalarUI500Base_();
    const tools=document.getElementById('gmVet490Tools');if(!tools||document.getElementById('gmVet500ObjBtn'))return;
    const row=tools.querySelector('div');
    if(row)row.insertAdjacentHTML('beforeend','<button id="gmVet500ObjBtn" class="btn-small btn-select" onclick="gmVet500SalvarObjeto_()">🧩 Salvar formas como objeto</button>');
};

// ------------------------------------------------------------
// 3) YouTube real via IFrame API + áudio compacto
// ------------------------------------------------------------
let labYTPlayer500_=null;
let labYTReadyPromise500_=null;
let labAudioExpandido500_=false;
let labAudioVolume500_=Number(localStorage.getItem('mesa_estelar_audio_volume_v1')||60);

function labYTApi500_(){
    if(window.YT?.Player)return Promise.resolve(window.YT);
    if(labYTReadyPromise500_)return labYTReadyPromise500_;
    labYTReadyPromise500_=new Promise((resolve,reject)=>{
        const old=window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady=function(){
            try{if(typeof old==='function')old();}catch(_){}
            resolve(window.YT);
        };
        if(!document.querySelector('script[src*="youtube.com/iframe_api"]')){
            const sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';sc.async=true;
            sc.onerror=()=>reject(new Error('Não foi possível carregar a API do YouTube.'));
            document.head.appendChild(sc);
        }
        setTimeout(()=>{if(window.YT?.Player)resolve(window.YT);},1200);
    });
    return labYTReadyPromise500_;
}
function labYTDestroy500_(){
    if(labYTPlayer500_){try{labYTPlayer500_.destroy();}catch(_){}labYTPlayer500_=null;}
    document.getElementById('labYTMount500')?.remove();
}
function labAudioParar500_(){
    labYTDestroy500_();
    if(labAudioElemento490_){try{labAudioElemento490_.pause?.();labAudioElemento490_.remove();}catch(_){}labAudioElemento490_=null;}
}
function labAudioStatus500_(txt){
    const e=document.getElementById('labAudioStatus500');if(e)e.textContent=String(txt||'');
}
async function labAudioTocarYoutube500_(st,yid){
    const YT=await labYTApi500_();
    labYTDestroy500_();
    const mount=document.createElement('div');mount.id='labYTMount500';
    mount.style.cssText='position:fixed;left:-300px;bottom:-200px;width:200px;height:112px;opacity:.01;pointer-events:none;z-index:-1';
    document.body.appendChild(mount);
    const offset=Math.max(0,Math.floor((Date.now()-Number(st.inicioTs||Date.now()))/1000));
    labYTPlayer500_=new YT.Player('labYTMount500',{
        width:'200',height:'112',videoId:yid,
        playerVars:{autoplay:1,controls:0,disablekb:1,playsinline:1,start:offset,loop:1,playlist:yid,origin:location.origin},
        events:{
            onReady(ev){
                try{
                    ev.target.setVolume(Math.max(0,Math.min(100,labAudioVolume500_)));
                    ev.target.unMute();ev.target.playVideo();
                    labAudioStatus500_('Tocando via YouTube.');
                }catch(e){labAudioStatus500_('Clique no alto-falante e em Retomar áudio.');}
            },
            onStateChange(ev){
                if(ev.data===YT.PlayerState.PLAYING)labAudioStatus500_('Tocando via YouTube.');
            },
            onError(ev){
                labAudioStatus500_(`YouTube não permitiu reproduzir esta faixa (erro ${ev.data}).`);
            }
        }
    });
}
labAudioAplicar490_=function(){
    const st=labEstado_.audioMesaLab;
    const key=JSON.stringify(st||{});
    if(key===labAudioUltimaChave490_)return;
    labAudioUltimaChave490_=key;
    labAudioParar500_();
    if(!labAudioAtivado490_||!st?.playing||!st?.url)return;
    const yid=labYoutubeId490_(st.url);
    if(yid){
        labAudioTocarYoutube500_(st,yid).catch(e=>{console.warn(e);labAudioStatus500_(e.message||'Falha no YouTube.');});
        return;
    }
    if(/\.(mp3|ogg|wav|m4a)(\?|$)/i.test(st.url)){
        const a=document.createElement('audio');a.src=st.url;a.autoplay=true;a.loop=true;a.volume=Math.max(0,Math.min(1,labAudioVolume500_/100));
        a.style.display='none';document.body.appendChild(a);labAudioElemento490_=a;
        const offset=Math.max(0,Math.floor((Date.now()-Number(st.inicioTs||Date.now()))/1000));
        a.addEventListener('loadedmetadata',()=>{try{a.currentTime=Math.min(offset,a.duration||offset);a.play();labAudioStatus500_('Tocando áudio direto.');}catch(_){}},{once:true});
    }else{
        labAudioStatus500_('Formato não reconhecido. Use YouTube ou link direto MP3/OGG/WAV/M4A.');
    }
};
window.labAudioAtivar490_=function(){
    labAudioAtivado490_=true;labAudioExpandido500_=false;
    localStorage.setItem('mesa_estelar_audio_ativado_v1','1');
    // O clique do usuário também inicia o carregamento da API do YouTube.
    labYTApi500_().catch(()=>{});
    labAudioUltimaChave490_='';
    labAudioAplicar490_();labAudioFloat490_();
    notificar_('🔊 Áudio da Mesa ativado neste navegador.','sucesso',2200);
};
window.labAudioDesativar490_=function(){
    labAudioAtivado490_=false;labAudioExpandido500_=false;
    localStorage.removeItem('mesa_estelar_audio_ativado_v1');
    labAudioParar500_();labAudioFloat490_();
};
window.labAudioTogglePainel500_=function(){
    labAudioExpandido500_=!labAudioExpandido500_;labAudioFloat490_();
};
window.labAudioVolume500_=function(v){
    labAudioVolume500_=Math.max(0,Math.min(100,Number(v)||0));
    localStorage.setItem('mesa_estelar_audio_volume_v1',String(labAudioVolume500_));
    try{labYTPlayer500_?.setVolume(labAudioVolume500_);}catch(_){}
    if(labAudioElemento490_)labAudioElemento490_.volume=labAudioVolume500_/100;
};
window.labAudioRetomar500_=function(){
    try{labYTPlayer500_?.unMute();labYTPlayer500_?.playVideo();}catch(_){}
    try{labAudioElemento490_?.play();}catch(_){}
};
labAudioFloat490_=function(){
    let d=document.getElementById('labAudioMesaFloat');
    if(!d){d=document.createElement('div');d.id='labAudioMesaFloat';document.body.appendChild(d);}
    const st=labEstado_.audioMesaLab;
    if(!labAudioAtivado490_){
        d.className='audio-open-500';
        d.innerHTML=`<button class="btn-small btn-select" onclick="labAudioAtivar490_()">🔊 Ativar áudio da mesa</button>${st?.nome?` <span>${escaparHtmlInventario_(st.nome)}</span>`:''}`;
        return;
    }
    if(!labAudioExpandido500_){
        d.className='audio-mini-500';
        d.title=st?.nome?`Áudio: ${st.nome}`:'Áudio da Mesa';
        d.innerHTML='<span onclick="labAudioTogglePainel500_()" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">🔊</span>';
        return;
    }
    d.className='audio-open-500';
    d.innerHTML=`<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
      <button class="btn-small" onclick="labAudioTogglePainel500_()">◀</button>
      <strong style="flex:1">${escaparHtmlInventario_(st?.nome||'Áudio da Mesa')}</strong>
      <button class="btn-small" onclick="labAudioRetomar500_()">▶ Retomar</button>
      <button class="btn-small" onclick="labAudioDesativar490_()">🔇</button>
      <span>Vol.</span><input type="range" min="0" max="100" value="${labAudioVolume500_}" oninput="labAudioVolume500_(this.value)">
    </div><div id="labAudioStatus500"></div>`;
};

// O master também deve conseguir ouvir imediatamente ao clicar "tocar".
const gmMusicaTocar490Base500_=window.gmMusicaTocar490_;
window.gmMusicaTocar490_=function(i){
    gmMusicaTocar490Base500_(i);
    if(labAudioAtivado490_){labAudioUltimaChave490_='';labAudioAplicar490_();}
};

// ------------------------------------------------------------
// 4) Render final desta versão
// ------------------------------------------------------------
const labRender500Base_=labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.51.0 — Oficina híbrida, composição->objeto,
// ordenação de perícias, objeto fixo e fogo sincronizado.
// ============================================================

// ------------------------------------------------------------
// 1) Perícias ordenadas pelo valor real e melhor opção padrão
// ------------------------------------------------------------
const labPericiasAtaque501Base_=labPericiasAtaque_;
labPericiasAtaque_=function(t){
    const c=labCharToken_(t);
    return (labPericiasAtaque501Base_(t)||[]).slice().sort((a,b)=>
        Number(labValorPericiaAtaque_(c,b,null,null)||0)-Number(labValorPericiaAtaque_(c,a,null,null)||0)
        || String(getNome(a)||'').localeCompare(String(getNome(b)||''),'pt-BR')
    );
};

const labUniversalPericiasGerais501Base_=labUniversalPericiasGerais_;
labUniversalPericiasGerais_=function(t){
    return (labUniversalPericiasGerais501Base_(t)||[]).slice().sort((a,b)=>
        Number(labValorTeste_(t,b)||0)-Number(labValorTeste_(t,a)||0)
        || String(getNome(a)||'').localeCompare(String(getNome(b)||''),'pt-BR')
    );
};

function labPsiMelhorValor501_(t){
    const ps=labPsiPoderes_(t)||[];
    return ps.length?Math.max(...ps.map(p=>Number(labPsiValor_(t,p)||0))):0;
}
function labAutoSelecionarMelhor501_(t){
    if(!t||labEstado_.fase!=='combate')return;
    const rodada=Number(labEstado_.rodada||0);
    if(Number(t._manualPericiaRodada501)===rodada)return;
    if(Number(t._autoPericiaRodada501)===rodada)return;

    const comb=labPericiasAtaque_(t),c=labCharToken_(t);
    const melhorComb=comb[0]||null;
    const valorComb=melhorComb?Number(labValorPericiaAtaque_(c,melhorComb,null,null)||0):-1;
    const valorPsi=temPsiquismoInvestido_(c)?labPsiMelhorValor501_(t):-1;

    if(valorPsi>valorComb){
        t.universalModoLab='psi';
        const poderes=(labPsiPoderes_(t)||[]).slice().sort((a,b)=>labPsiValor_(t,b)-labPsiValor_(t,a));
        if(poderes.length)t.universalPsiPoderIdLab=poderes[0].id;
    }else if(melhorComb){
        t.universalModoLab='combate';
        t.periciaLab=batalhaTokenPericia_(melhorComb);
        t.equipamentoLab='';
        labGarantirPrefsAtaque_(t);
    }
    t._autoPericiaRodada501=rodada;
}
const labUniversalGarantir501Base_=labUniversalGarantir_;
labUniversalGarantir_=function(t){
    labAutoSelecionarMelhor501_(t);
    labUniversalGarantir501Base_(t);
    if(t?.universalModoLab==='outras'){
        const ps=labUniversalPericiasGerais_(t);
        if(!ps.some(p=>String(p.id)===String(t.universalPericiaIdLab)))t.universalPericiaIdLab=ps[0]?.id||'';
    }
};
const labUniversalPrimeiro501Base_=window.labUniversalPrimeiro_;
window.labUniversalPrimeiro_=function(v){
    const t=labTokenAtual_();
    if(t)t._manualPericiaRodada501=Number(labEstado_.rodada||0);
    return labUniversalPrimeiro501Base_(v);
};

// ------------------------------------------------------------
// 2) Inflamabilidade consistente + objeto fixo ao mapa
// ------------------------------------------------------------
const preencherEditorObjetoMapa501Base_=preencherEditorObjetoMapa_;
preencherEditorObjetoMapa_=function(o){
    preencherEditorObjetoMapa501Base_(o);
    const infl=document.getElementById('objMapaInflamabilidade');
    const cb=document.getElementById('objMapaInflamavel');
    const fix=document.getElementById('objMapaFixo');
    let grau=Number(o?.inflamabilidade);
    if(!Number.isFinite(grau))grau=o?.inflamavel?3:0;
    grau=Math.max(0,Math.min(5,Math.trunc(grau)));
    if(infl)infl.value=grau;
    if(cb)cb.checked=grau>0 || !!o?.inflamavel;
    if(fix)fix.checked=!!o?.fixoAoMapa;
};

window.salvarObjetoMapaEditor_=async function(){
    garantirObjetosMapaPadrao_();
    const editId=String(document.getElementById('objMapaEditId')?.value||'');
    const nome=String(document.getElementById('objMapaNome')?.value||'').trim();
    if(!nome){notificar_('Dê um nome ao objeto.','aviso');return;}

    const lista=JSON.parse(JSON.stringify(objetosMapaDB||[]));
    let o=editId?lista.find(x=>String(x.id)===editId):null;
    if(!o){
        let id=labMapaSlug_(nome)||`objeto_${Date.now()}`,b=id,n=2;
        while(lista.some(x=>String(x.id)===id))id=`${b}_${n++}`;
        o={id};lista.push(o);
    }

    const prev=document.getElementById('objMapaImagemPreview');
    const img=String(prev?.dataset?.imagem||prev?.src||'').trim()||objetoSvgData_('caixa');
    const cbInfl=!!document.getElementById('objMapaInflamavel')?.checked;
    let infl=Math.max(0,Math.min(5,Math.trunc(Number(document.getElementById('objMapaInflamabilidade')?.value)||0)));
    // Marcar "Inflamável" sem escolher grau dá um padrão útil em vez de salvar 0.
    if(cbInfl&&infl===0)infl=3;
    if(!cbInfl)infl=0;

    Object.assign(o,{
        nome,imagem:img,tipoVisual:o.tipoVisual||'personalizado',
        camada:objetoNumero_(document.getElementById('objMapaCamada')?.value,3,-1000),
        larguraM:objetoNumero_(document.getElementById('objMapaLargura')?.value,1,.1),
        alturaM:objetoNumero_(document.getElementById('objMapaAltura')?.value,1,.1),
        pvMax:objetoNumero_(document.getElementById('objMapaPV')?.value,10,0),
        dureza:objetoNumero_(document.getElementById('objMapaDureza')?.value,2,0),
        pesoKg:objetoNumero_(document.getElementById('objMapaPesoKg')?.value,10,.1),
        destrutivel:!!document.getElementById('objMapaDestrutivel')?.checked,
        inflamavel:infl>0,inflamabilidade:infl,
        bloqueiaMovimento:!!document.getElementById('objMapaBloqueiaMov')?.checked,
        bloqueiaVisao:!!document.getElementById('objMapaBloqueiaVisao')?.checked,
        fixoAoMapa:!!document.getElementById('objMapaFixo')?.checked
    });

    const botao=document.querySelector('#editorObjetoMapaBanco .btn-save'),txt=botao?.innerHTML||'💾 Salvar objeto';
    if(botao){botao.disabled=true;botao.innerHTML='⏳ Salvando...';}
    try{
        await setDoc(doc(db,'configuracoes',objetoMapaDocId_(o.id)),JSON.parse(JSON.stringify(o)),{merge:false});
        await setDoc(doc(db,'configuracoes','objetosMapa'),{formato:'docs-v1',ids:lista.map(x=>x.id),atualizadoEm:new Date().toISOString()},{merge:false});
        objetosMapaDB=lista;renderizarBancoObjetosMapa_();fecharEditorObjetoMapa_();
        notificar_(`Objeto “${nome}” salvo${infl?` · inflamabilidade ${infl}/5`:''}${o.fixoAoMapa?' · fixo ao mapa':''}.`,'sucesso',3200);
    }catch(e){
        console.error(e);notificar_(`Não foi possível salvar “${nome}”. ${e?.message||''}`,'erro',6500);
    }finally{if(botao){botao.disabled=false;botao.innerHTML=txt;}}
};

function labObjetoFixo501_(o){
    const m=labObjetoModelo_(o);
    return !!(o?.fixoAoMapa||m?.fixoAoMapa);
}

// Força Bruta / ações físicas não deslocam estruturas fixas.
const labObjetoAcaoExecutar501Base_=labObjetoAcaoExecutar_;
labObjetoAcaoExecutar_=function(ator,objeto,tipo){
    if(String(tipo)==='mover'&&labObjetoFixo501_(objeto)){
        notificar_(`${objeto.nome||'Este objeto'} é uma estrutura fixa e não pode ser deslocado por Força Bruta.`,'aviso',4200);
        return;
    }
    return labObjetoAcaoExecutar501Base_(ator,objeto,tipo);
};

// Mover Objeto Psi nem oferece estruturas fixas como alvo.
const labPsiAlvos501Base_=labPsiAlvos_;
labPsiAlvos_=function(t,p){
    const out=labPsiAlvos501Base_(t,p)||[];
    if(p?.id==='mover_objeto')return out.filter(x=>!labEhAlvoObjeto_(x)||!labObjetoFixo501_(x));
    return out;
};

// Badge discreto para estrutura fixa.
const labObjetoHtml501Base_=labObjetoHtml_;
labObjetoHtml_=function(o,ppm){
    let h=labObjetoHtml501Base_(o,ppm);
    if(labObjetoFixo501_(o)&&!h.includes('gm-fixed-badge-501')){
        h=h.replace(/<\/div>\s*$/i,'<span class="gm-fixed-badge-501" title="Estrutura fixa">⚓</span></div>');
    }
    return h;
};
window.labObjetoHtml_=labObjetoHtml_;

// ------------------------------------------------------------
// 3) Fogo compartilhado explicitamente com todos os clientes
// ------------------------------------------------------------
const labEstadoPublico501Base_=labEstadoPublico_;
labEstadoPublico_=function(){
    const clone=labEstadoPublico501Base_();
    clone.efeitosObjetosLab={};
    for(const o of (labEstado_.objetosLab||[])){
        clone.efeitosObjetosLab[String(o.id)]={
            pegandoFogoLab:!!o.pegandoFogoLab,
            despedacadoLab:!!o.despedacadoLab,
            explodindoLab:!!o.explodindoLab,
            fogoUltimaRodadaLab:Number(o.fogoUltimaRodadaLab??-1)
        };
    }
    return clone;
};
function labAplicarEfeitosObjetosPublicos501_(){
    const fx=labEstado_.efeitosObjetosLab||{};
    for(const o of (labEstado_.objetosLab||[])){
        const e=fx[String(o.id)];
        if(!e)continue;
        o.pegandoFogoLab=!!e.pegandoFogoLab;
        o.despedacadoLab=!!e.despedacadoLab;
        o.explodindoLab=!!e.explodindoLab;
        o.fogoUltimaRodadaLab=Number(e.fogoUltimaRodadaLab??o.fogoUltimaRodadaLab??-1);
    }
}
const labAplicarEfeitoObjetoEnergia501Base_=labAplicarEfeitoObjetoEnergia481_;
labAplicarEfeitoObjetoEnergia481_=function(alvo,item,acertou,grau){
    const r=labAplicarEfeitoObjetoEnergia501Base_(alvo,item,acertou,grau);
    if(labEhAlvoObjeto_(alvo)){
        labEstado_.efeitosObjetosLab=labEstado_.efeitosObjetosLab||{};
        labEstado_.efeitosObjetosLab[String(alvo.id)]={
            pegandoFogoLab:!!alvo.pegandoFogoLab,
            despedacadoLab:!!alvo.despedacadoLab,
            explodindoLab:!!alvo.explodindoLab,
            fogoUltimaRodadaLab:Number(alvo.fogoUltimaRodadaLab??-1)
        };
        labSalvarLocal_();
    }
    return r;
};

// ------------------------------------------------------------
// 4) Oficina: "Selecionar formas" é um modo, não prisão perpétua
// ------------------------------------------------------------
let gmVetSelectAtivo501_=false;

function gmVet501AtualizarCamadas_(){
    const svg=document.getElementById('gmOficinaVectorLayer');
    const cv=document.getElementById('gmOficinaV2Canvas');
    const criando=gmVet490_.tool!=='select';
    if(svg)svg.style.pointerEvents=(gmVetSelectAtivo501_||criando)?'auto':'none';
    // Desenho livre continua por cima das formas quando o modo selecionar está desligado.
    if(cv){
        cv.style.zIndex='9';
        if(gmOficinaV2Cfg_.ativo&&!gmVetSelectAtivo501_)cv.style.pointerEvents='auto';
    }
}
window.gmVet501ToggleSelect_=function(checked){
    gmVetSelectAtivo501_=!!checked;
    gmVet490_.tool='select';
    gmVet490_.selectedId='';
    gmVet490Render_();
    gmVet501AtualizarCamadas_();
};
const gmVet490Tool501Base_=window.gmVet490Tool_;
window.gmVet490Tool_=function(tool){
    if(String(tool)!=='select')gmVetSelectAtivo501_=false;
    const r=gmVet490Tool501Base_(tool);
    gmVet501AtualizarCamadas_();
    return r;
};
const gmVet490Render501Base_=gmVet490Render_;
gmVet490Render_=function(){
    const r=gmVet490Render501Base_();
    gmVet501AtualizarCamadas_();
    return r;
};

function gmVet501TrocarBotaoSelecao_(){
    const tools=document.getElementById('gmVet490Tools');if(!tools)return;
    const btn=[...tools.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("gmVet490Tool_('select')"));
    if(btn){
        const lab=document.createElement('label');lab.id='gmVetSelectToggle501';
        lab.innerHTML=`<input type="checkbox" ${gmVetSelectAtivo501_?'checked':''} onchange="gmVet501ToggleSelect_(this.checked)"> 🖱 Selecionar formas`;
        btn.replaceWith(lab);
    }
}
const gmVet490InstalarUI501Base_=gmVet490InstalarUI_;
gmVet490InstalarUI_=function(){
    gmVet490InstalarUI501Base_();
    gmVet501TrocarBotaoSelecao_();
    gmVet501AtualizarCamadas_();
    const row=document.getElementById('gmVet490Tools')?.querySelector('div');
    if(row&&!document.getElementById('gmVet501CompBtn')){
        row.insertAdjacentHTML('beforeend','<button id="gmVet501CompBtn" class="btn-small btn-select" onclick="gmVet501SalvarComposicao_()">🎨 Salvar composição como objeto</button>');
    }
};

// ------------------------------------------------------------
// 5) Salvar DESENHOS + FORMAS como objeto transparente
// ------------------------------------------------------------
function gmVet501BoundsComposicao_(){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    const add=(x,y)=>{x=Number(x);y=Number(y);if(!Number.isFinite(x)||!Number.isFinite(y))return;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);};
    for(const st of (gmOficinaEstado_.desenhos||[]))for(const p of (st.pts||[]))add(p.x,p.y);
    for(const f of (gmOficinaEstado_.formas||[])){
        if(f.tipo==='linha'){add(f.x,f.y);add(f.x2,f.y2);}
        else{add(f.x,f.y);add(Number(f.x||0)+Number(f.w||0),Number(f.y||0)+Number(f.h||0));}
    }
    if(!Number.isFinite(minX))return null;
    return {minX,minY,maxX,maxY,w:Math.max(.1,maxX-minX),h:Math.max(.1,maxY-minY)};
}
async function gmVet501RasterizarComposicao_(){
    const b=gmVet501BoundsComposicao_();if(!b)return null;
    const ppm=gmVet490Ppm_(),pad=10;
    const source=document.getElementById('gmOficinaV2Canvas');
    const w=Math.max(24,Math.ceil(b.w*ppm)+pad*2),h=Math.max(24,Math.ceil(b.h*ppm)+pad*2);
    const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
    ctx.clearRect(0,0,w,h);
    if(source){
        const sx=Math.max(0,b.minX*ppm-pad),sy=Math.max(0,b.minY*ppm-pad);
        const sw=Math.min(source.width-sx,w),sh=Math.min(source.height-sy,h);
        if(sw>0&&sh>0)ctx.drawImage(source,sx,sy,sw,sh,0,0,sw,sh);
    }
    const shapes=(gmOficinaEstado_.formas||[]).map(f=>gmVet500SvgShape_(f,ppm,{...b,minX:b.minX-pad/ppm,minY:b.minY-pad/ppm})).join('');
    if(shapes){
        const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${shapes}</svg>`;
        const blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);
        try{
            const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url;});
            ctx.drawImage(img,0,0);
        }finally{URL.revokeObjectURL(url);}
    }
    let data=c.toDataURL('image/webp',.88);
    if(data.length>105000)data=c.toDataURL('image/webp',.68);
    return {data,wM:b.w,hM:b.h};
}
window.gmVet501SalvarComposicao_=async function(){
    const rr=await gmVet501RasterizarComposicao_();
    if(!rr){notificar_('Não há desenhos ou formas para transformar em objeto.','aviso');return;}
    const nome=prompt('Nome do objeto criado a partir da composição:','Estrutura futurista');
    if(!nome||!String(nome).trim())return;
    const fixo=confirm('Este objeto deve ser FIXO AO MAPA?\n\nOK = estrutura fixa (bar, parede, balcão, edifício)\nCancelar = objeto móvel.');
    try{
        garantirObjetosMapaPadrao_();
        const lista=JSON.parse(JSON.stringify(objetosMapaDB||[]));
        let id=labMapaSlug_(nome)||`objeto_${Date.now()}`,base=id,n=2;
        while(lista.some(x=>String(x.id)===id))id=`${base}_${n++}`;
        const o={id,nome:String(nome).trim(),imagem:rr.data,tipoVisual:'personalizado',
          larguraM:Math.max(.1,rr.wM),alturaM:Math.max(.1,rr.hM),pvMax:fixo?30:10,dureza:fixo?5:2,pesoKg:fixo?500:10,
          destrutivel:true,inflamavel:false,inflamabilidade:0,bloqueiaMovimento:true,bloqueiaVisao:false,
          fixoAoMapa:fixo,rascunho:true};
        await setDoc(doc(db,'configuracoes',objetoMapaDocId_(id)),o,{merge:false});
        lista.push(o);
        await setDoc(doc(db,'configuracoes','objetosMapa'),{formato:'docs-v1',ids:lista.map(x=>x.id),atualizadoEm:new Date().toISOString()},{merge:false});
        objetosMapaDB=lista;renderizarBancoObjetosMapa_();gmOficinaV2PopularObjetos_?.();
        notificar_(`🎨 “${o.nome}” salvo como objeto${fixo?' fixo':''}, incluindo pintura e formas.`,'sucesso',4200);
    }catch(e){console.error(e);notificar_(`Não consegui criar o objeto: ${e?.message||e}`,'erro',6000);}
};

// ------------------------------------------------------------
// 6) Render: aplicar fogo remoto ANTES de montar os objetos
// ------------------------------------------------------------
const labRender501Base_=labRender_;

window.labRender_=labRender_;



// ============================================================
// V46.51.0 — áudio recolhido também quando desativado
// ============================================================
let labAudioAvisoExpandido502_=false;

window.labAudioAbrirDesativado502_=function(){
    labAudioAvisoExpandido502_=true;
    labAudioFloat490_();
};
window.labAudioFecharDesativado502_=function(){
    labAudioAvisoExpandido502_=false;
    labAudioFloat490_();
};

const labAudioAtivar502Base_=window.labAudioAtivar490_;
window.labAudioAtivar490_=function(){
    labAudioAvisoExpandido502_=false;
    return labAudioAtivar502Base_();
};
const labAudioDesativar502Base_=window.labAudioDesativar490_;
window.labAudioDesativar490_=function(){
    labAudioAvisoExpandido502_=false;
    const r=labAudioDesativar502Base_();
    labAudioFloat490_();
    return r;
};

labAudioFloat490_=function(){
    let d=document.getElementById('labAudioMesaFloat');
    if(!d){d=document.createElement('div');d.id='labAudioMesaFloat';document.body.appendChild(d);}
    const st=labEstado_.audioMesaLab;

    // Desativado também fica recolhido para não ocupar a tela.
    if(!labAudioAtivado490_){
        if(!labAudioAvisoExpandido502_){
            d.className='audio-mini-500';
            d.title='Áudio da Mesa desativado';
            d.innerHTML='<span onclick="labAudioAbrirDesativado502_()" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;opacity:.65">🔇</span>';
        }else{
            d.className='audio-open-500';
            d.innerHTML=`<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
              <button class="btn-small" onclick="labAudioFecharDesativado502_()">◀</button>
              <button class="btn-small btn-select" onclick="labAudioAtivar490_()">🔊 Ativar áudio da mesa</button>
              ${st?.nome?`<span style="color:#9fc6d8">${escaparHtmlInventario_(st.nome)}</span>`:''}
            </div>`;
        }
        return;
    }

    if(!labAudioExpandido500_){
        d.className='audio-mini-500';
        d.title=st?.nome?`Áudio: ${st.nome}`:'Áudio da Mesa';
        d.innerHTML='<span onclick="labAudioTogglePainel500_()" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">🔊</span>';
        return;
    }

    d.className='audio-open-500';
    d.innerHTML=`<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
      <button class="btn-small" onclick="labAudioTogglePainel500_()">◀</button>
      <strong style="flex:1">${escaparHtmlInventario_(st?.nome||'Áudio da Mesa')}</strong>
      <button class="btn-small" onclick="labAudioRetomar500_()">▶ Retomar</button>
      <button class="btn-small" onclick="labAudioDesativar490_()">🔇</button>
      <span>Vol.</span><input type="range" min="0" max="100" value="${labAudioVolume500_}" oninput="labAudioVolume500_(this.value)">
    </div><div id="labAudioStatus500"></div>`;
};



// ============================================================
// V46.51.0
// Banco de músicas, playlists por momento, ordenação do painel,
// navegação anterior/próximo, inflamabilidade persistente,
// fogo sincronizado/visual e seleção estável.
// ============================================================

// ------------------------------------------------------------
// 1) Armas: menor dificuldade primeiro; empate alfabético
// ------------------------------------------------------------
const batalhaEquipamentos510Base_=batalhaEquipamentos_;
batalhaEquipamentos_=function(char,pericia,selecionado=''){
    let out=(batalhaEquipamentos510Base_(char,pericia,selecionado)||[]).slice();

    // Se a arma selecionada quebrou, ela continua visível/selecionada.
    if(selecionado && !out.some(x=>String(x.valor)===String(selecionado)) && pericia){
        const eq=obterItensEquipados_(char)||[];
        eq.forEach((item,idx)=>{
            const valor=batalhaValorEquip_(item,idx);
            if(String(valor)!==String(selecionado)||!itemEhArmaOuEscudo_(item))return;
            const graus=penalidadeCompatibilidadeArma_(pericia,item);
            out.push({
                valor,
                rotulo:`${getNome(item)}${Number(item.pv||0)>0?` [PV ${Number(item.pvAtual??item.pv)}/${Number(item.pv)}]`:''}${itemCombateInutilizavel_(item)?' · QUEBRADA':''}${graus?` ⚠ +${graus} grau${graus>1?'s':''}`:''}`,
                item,graus
            });
        });
    }

    out.sort((a,b)=>Number(a.graus||0)-Number(b.graus||0)
        || String(getNome(a.item)||a.rotulo||'').localeCompare(String(getNome(b.item)||b.rotulo||''),'pt-BR',{sensitivity:'base'}));
    return out;
};

// ------------------------------------------------------------
// 2) Alvos: mais perto -> mais longe; seleção permanece até morte
// ------------------------------------------------------------
const labAlvosAtaque510Base_=labAlvosAtaque_;
labAlvosAtaque_=function(t){
    return (labAlvosAtaque510Base_(t)||[]).slice().sort((a,b)=>
        labDistanciaEntre_(t,a)-labDistanciaEntre_(t,b)
        || String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'})
    );
};

const labUniversalAlvo510Base_=window.labUniversalAlvo_;
window.labUniversalAlvo_=function(v){
    const t=labTokenAtual_();
    if(t&&t.universalModoLab==='combate'){
        const a=labAlvoAtaquePorId_(v);
        t._alvoMortoManual510=!!labAlvoInerte490_(a);
    }
    return labUniversalAlvo510Base_(v);
};

const labGarantirPrefsAtaque510Base_=labGarantirPrefsAtaque_;
labGarantirPrefsAtaque_=function(t){
    if(!t)return;
    const antes=String(t.alvoLab||'');
    labGarantirPrefsAtaque510Base_(t);

    const alvos=labAlvosAtaque_(t);
    let atual=labAlvoAtaquePorId_(t.alvoLab);
    const inerte=labAlvoInerte490_(atual);

    if(inerte && !t._alvoMortoManual510){
        const vivo=alvos.find(a=>!labAlvoInerte490_(a));
        if(vivo)t.alvoLab=String(vivo.id);
    }
    atual=labAlvoAtaquePorId_(t.alvoLab);
    if(atual&&!labAlvoInerte490_(atual))t._alvoMortoManual510=false;
};

// Pré-seleciona a melhor perícia/psi apenas UMA vez; depois respeita escolha.
labAutoSelecionarMelhor501_=function(t){
    if(!t||labEstado_.fase!=='combate'||t._autoInicialFeito510)return;
    const comb=labPericiasAtaque_(t),c=labCharToken_(t),melhorComb=comb[0]||null;
    const valorComb=melhorComb?Number(labValorPericiaAtaque_(c,melhorComb,null,null)||0):-1;
    const valorPsi=temPsiquismoInvestido_(c)?labPsiMelhorValor501_(t):-1;
    if(valorPsi>valorComb){
        t.universalModoLab='psi';
        const ps=(labPsiPoderes_(t)||[]).slice().sort((a,b)=>labPsiValor_(t,b)-labPsiValor_(t,a));
        if(ps.length)t.universalPsiPoderIdLab=ps[0].id;
    }else if(melhorComb){
        t.universalModoLab='combate';t.periciaLab=batalhaTokenPericia_(melhorComb);t.equipamentoLab='';
        labGarantirPrefsAtaque_(t);
    }
    t._autoInicialFeito510=true;
};

// ------------------------------------------------------------
// 3) Inflamabilidade: valor numérico é a autoridade e persiste
// ------------------------------------------------------------
const salvarObjetoMapaEditor510Base_=window.salvarObjetoMapaEditor_;
window.salvarObjetoMapaEditor_=async function(){
    const idAntes=String(document.getElementById('objMapaEditId')?.value||'');
    const nomeAntes=String(document.getElementById('objMapaNome')?.value||'').trim();
    const cb=!!document.getElementById('objMapaInflamavel')?.checked;
    let grau=Math.max(0,Math.min(5,Math.trunc(Number(document.getElementById('objMapaInflamabilidade')?.value)||0)));
    if(grau>0){
        const el=document.getElementById('objMapaInflamavel');if(el)el.checked=true;
    }else if(cb)grau=3;

    await salvarObjetoMapaEditor510Base_();

    const o=(objetosMapaDB||[]).find(x=>String(x.id)===idAntes)
        || [...(objetosMapaDB||[])].reverse().find(x=>String(x.nome||'')===nomeAntes);
    if(o){
        o.inflamabilidade=grau;o.inflamavel=grau>0;
        try{
            await setDoc(doc(db,'configuracoes',objetoMapaDocId_(o.id)),{inflamabilidade:grau,inflamavel:grau>0},{merge:true});
        }catch(e){console.warn('Persistência inflamabilidade',e);}
    }
};

// ------------------------------------------------------------
// 4) Fogo: renderiza também a partir do estado público remoto
// ------------------------------------------------------------
function labObjetoEmChamas510_(o){
    const fx=labEstado_.efeitosObjetosLab?.[String(o?.id||'')];
    return !!(o?.pegandoFogoLab || fx?.pegandoFogoLab) && !o?.destruido;
}
const labObjetoHtml510Base_=labObjetoHtml_;
labObjetoHtml_=function(o,ppm){
    let h=labObjetoHtml510Base_(o,ppm);
    if(labObjetoEmChamas510_(o)&&!h.includes('lab-fire-real-510')){
        h=h.replace(/<\/div>\s*$/i,`<span class="lab-fire-real-510"><i class="fl f1"></i><i class="fl f2"></i><i class="fl f3"></i><i class="sm"></i></span></div>`);
    }
    return h;
};
window.labObjetoHtml_=labObjetoHtml_;

// ------------------------------------------------------------
// 5) Banco de Músicas dedicado
// ------------------------------------------------------------
let musicaEditando510_='';

function musicaBancoGarantirAba510_(){
    const form=document.querySelector('#banco > .form-section')||document.querySelector('#banco .form-section');
    if(!form||document.getElementById('banco-musicas'))return;
    const d=document.createElement('div');d.id='banco-musicas';d.className='tab-content';
    d.innerHTML=`<h4 style="color:#fff;margin-bottom:8px">🎵 Banco de Músicas / Trilha Sonora</h4>
      <p style="color:#aaa">Cadastre as faixas aqui. O campo <b>Momento</b> agrupa músicas em playlists, como Batalha, Bar, Tempestade ou Suspense.</p>
      <div class="music-grid-510">
        <label>Nome<input id="mus510Nome" placeholder="Última Bateria"></label>
        <label>Momento<input id="mus510Momento" placeholder="Bar"></label>
        <label>Link YouTube / áudio<input id="mus510Url" placeholder="https://youtube.com/..."></label>
        <label>Ordem<input id="mus510Ordem" type="number" min="0" step="1" value="0"></label>
        <button class="btn-small btn-select" onclick="musicaBancoSalvar510_()">💾 Salvar</button>
      </div>
      <input id="mus510Id" type="hidden">
      <div id="mus510Lista"></div>`;
    form.appendChild(d);
}
function musicaBancoRender510_(){
    musicaBancoGarantirAba510_();
    const e=document.getElementById('mus510Lista');if(!e)return;
    const list=[...(trilhasMesaDB490_||[])].sort((a,b)=>
        String(a.categoria||'').localeCompare(String(b.categoria||''),'pt-BR',{sensitivity:'base'})
        || Number(a.ordem||0)-Number(b.ordem||0)
        || String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'})
    );
    e.innerHTML=list.length?`<div class="db-table-wrap"><table class="db-table">
      <thead><tr><th>Momento</th><th>Ordem</th><th>Nome</th><th>Fonte</th><th>Ações</th></tr></thead><tbody>
      ${list.map(t=>`<tr>
        <td><b>${escaparHtmlInventario_(t.categoria||'—')}</b></td>
        <td>${Number(t.ordem||0)}</td>
        <td>${escaparHtmlInventario_(t.nome||'Trilha')}</td>
        <td><small>${escaparHtmlInventario_(t.url||'')}</small></td>
        <td>
          <button class="btn-small" onclick="musicaBancoEditar510_('${String(t.id).replace(/'/g,"\\'")}')">Editar</button>
          <button class="btn-small btn-select" onclick="gmMusicaTocarId510_('${String(t.id).replace(/'/g,"\\'")}')">▶ Ouvir</button>
          <button class="btn-small btn-danger" onclick="musicaBancoExcluir510_('${String(t.id).replace(/'/g,"\\'")}')">Excluir</button>
        </td></tr>`).join('')}
      </tbody></table></div>`:'<div style="color:#888;padding:14px">Nenhuma música cadastrada.</div>';
}
window.musicaBancoEditar510_=function(id){
    const t=(trilhasMesaDB490_||[]).find(x=>String(x.id)===String(id));if(!t)return;
    musicaEditando510_=String(id);
    document.getElementById('mus510Id').value=id;
    document.getElementById('mus510Nome').value=t.nome||'';
    document.getElementById('mus510Momento').value=t.categoria||'';
    document.getElementById('mus510Url').value=t.url||'';
    document.getElementById('mus510Ordem').value=Number(t.ordem||0);
};
window.musicaBancoSalvar510_=async function(){
    const nome=String(document.getElementById('mus510Nome')?.value||'').trim();
    const categoria=String(document.getElementById('mus510Momento')?.value||'').trim();
    const url=String(document.getElementById('mus510Url')?.value||'').trim();
    const ordem=Math.max(0,Math.trunc(Number(document.getElementById('mus510Ordem')?.value)||0));
    if(!nome||!url){notificar_('Informe nome e link.','aviso');return;}
    let t=(trilhasMesaDB490_||[]).find(x=>String(x.id)===String(musicaEditando510_));
    if(t)Object.assign(t,{nome,categoria,url,ordem});
    else{
        t={id:`trilha:${Date.now()}`,nome,categoria,url,ordem,volume:.6};
        trilhasMesaDB490_.push(t);
    }
    await labTrilhasSalvar490_();
    musicaEditando510_='';
    for(const id of ['mus510Nome','mus510Momento','mus510Url']){const x=document.getElementById(id);if(x)x.value='';}
    const or=document.getElementById('mus510Ordem');if(or)or.value='0';
    musicaBancoRender510_();gmMusicaSelectorRender510_();
    notificar_('🎵 Música salva no banco.','sucesso',2200);
};
window.musicaBancoExcluir510_=async function(id){
    if(!confirm('Excluir esta música do banco?'))return;
    trilhasMesaDB490_=trilhasMesaDB490_.filter(x=>String(x.id)!==String(id));
    await labTrilhasSalvar490_();musicaBancoRender510_();gmMusicaSelectorRender510_();
};

// Integração com a aba padrão do Banco.
const mostrarBancoAba510Base_=window.mostrarBancoAba;
window.mostrarBancoAba=function(abaId,btn){
    if(abaId==='musicas')musicaBancoGarantirAba510_();
    const r=mostrarBancoAba510Base_(abaId,btn);
    if(abaId==='musicas'){
        if(!(trilhasMesaDB490_||[]).length)labTrilhasCarregar490_().then(()=>musicaBancoRender510_());
        else musicaBancoRender510_();
    }
    return r;
};

// ------------------------------------------------------------
// 6) Painel do Mestre: apenas selecionar Música ou Momento
// ------------------------------------------------------------
function gmMusicaSelectorRender510_(){
    const box=document.getElementById('gmMusica510');if(!box)return;
    const list=[...(trilhasMesaDB490_||[])].sort((a,b)=>Number(a.ordem||0)-Number(b.ordem||0)||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    const momentos=[...new Set(list.map(x=>String(x.categoria||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    box.innerHTML=`<h3 style="margin-top:0">🎵 Música da Mesa</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">
        <label style="margin:0"><small>Momento / playlist</small><select onchange="gmMusicaTocarMomento510_(this.value)" style="margin:3px 0 0"><option value="">— selecionar momento —</option>${momentos.map(m=>`<option>${escaparHtmlInventario_(m)}</option>`).join('')}</select></label>
        <label style="margin:0"><small>Música única</small><select onchange="gmMusicaTocarId510_(this.value)" style="margin:3px 0 0"><option value="">— selecionar música —</option>${list.map(t=>`<option value="${escaparHtmlInventario_(t.id)}">${escaparHtmlInventario_(t.nome)}${t.categoria?` · ${escaparHtmlInventario_(t.categoria)}`:''}</option>`).join('')}</select></label>
        <button class="btn-small" onclick="gmMusicaParar490_()">⏹ Parar</button>
        <span style="color:#9fc6d8">Cadastro e organização ficam em Banco de Dados → Músicas.</span>
      </div>`;
}
function gmMusicaInstalar510_(){
    if(!batalhaEhMestre_())return;
    const root=document.getElementById('gm-sub-campanha');if(!root)return;
    document.getElementById('gmMusica490')?.remove();
    let box=document.getElementById('gmMusica510');
    if(!box){
        box=document.createElement('div');box.id='gmMusica510';box.className='form-section';box.style.marginTop='14px';
        root.appendChild(box);
    }
    gmMusicaSelectorRender510_();
}
labMusicaInstalar490_=gmMusicaInstalar510_;

window.gmMusicaTocarId510_=function(id){
    if(!id)return;
    const t=(trilhasMesaDB490_||[]).find(x=>String(x.id)===String(id));if(!t)return;
    labEstado_.audioMesaLab={...t,mode:'single',playlist:[{...t}],playlistIndex:0,playing:true,inicioTs:Date.now()};
    labSalvarLocal_();labAudioUltimaChave490_='';labAudioAplicar490_();labAudioFloat490_();
};
window.gmMusicaTocarMomento510_=function(moment){
    if(!moment)return;
    const q=(trilhasMesaDB490_||[]).filter(x=>String(x.categoria||'')===String(moment))
      .sort((a,b)=>Number(a.ordem||0)-Number(b.ordem||0)||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    if(!q.length){notificar_('Nenhuma música nesse momento.','aviso');return;}
    const first=q[0];
    labEstado_.audioMesaLab={...first,mode:'moment',momento:moment,playlist:q.map(x=>({...x})),playlistIndex:0,playing:true,inicioTs:Date.now()};
    labSalvarLocal_();labAudioUltimaChave490_='';labAudioAplicar490_();labAudioFloat490_();
};

// ------------------------------------------------------------
// 7) Player: avança a playlist e repete no final
// ------------------------------------------------------------
function labAudioTrackAtual510_(st){
    const q=Array.isArray(st?.playlist)&&st.playlist.length?st.playlist:[st];
    const ix=Math.max(0,Math.min(q.length-1,Number(st?.playlistIndex||0)));
    return {q,ix,t:q[ix]};
}
function labAudioAvancar510_(){
    const st=labEstado_.audioMesaLab;if(!st?.playing)return;
    const {q,ix}=labAudioTrackAtual510_(st);
    const next=(ix+1)%q.length,t=q[next];
    st.playlistIndex=next;st.id=t.id;st.nome=t.nome;st.url=t.url;st.categoria=t.categoria;st.inicioTs=Date.now();
    labAudioUltimaChave490_='';
    if(batalhaEhMestre_())labSalvarLocal_();
    labAudioAplicar490_();
    labAudioFloat490_();
}
async function labAudioTocarYoutube510_(st,track,yid){
    const YT=await labYTApi500_();labYTDestroy500_();
    const mount=document.createElement('div');mount.id='labYTMount500';mount.style.cssText='position:fixed;left:-300px;bottom:-200px;width:200px;height:112px;opacity:.01;pointer-events:none;z-index:-1';document.body.appendChild(mount);
    const offset=Math.max(0,Math.floor((Date.now()-Number(st.inicioTs||Date.now()))/1000));
    labYTPlayer500_=new YT.Player('labYTMount500',{
        width:'200',height:'112',videoId:yid,
        playerVars:{autoplay:1,controls:0,disablekb:1,playsinline:1,start:offset,loop:0,origin:location.origin},
        events:{
            onReady(ev){try{ev.target.setVolume(labAudioVolume500_);ev.target.unMute();ev.target.playVideo();labAudioStatus500_('Tocando via YouTube.');}catch(_){}},
            onStateChange(ev){if(ev.data===YT.PlayerState.ENDED)labAudioAvancar510_();},
            onError(ev){labAudioStatus500_(`YouTube não permitiu reproduzir esta faixa (erro ${ev.data}).`);}
        }
    });
}
labAudioAplicar490_=function(){
    const st=labEstado_.audioMesaLab;
    const key=JSON.stringify(st||{});
    if(key===labAudioUltimaChave490_)return;
    labAudioUltimaChave490_=key;labAudioParar500_();
    if(!labAudioAtivado490_||!st?.playing)return;
    const {t}=labAudioTrackAtual510_(st);if(!t?.url)return;
    const yid=labYoutubeId490_(t.url);
    if(yid){labAudioTocarYoutube510_(st,t,yid).catch(e=>labAudioStatus500_(e.message||'Falha no YouTube.'));return;}
    if(/\.(mp3|ogg|wav|m4a)(\?|$)/i.test(t.url)){
        const a=document.createElement('audio');a.src=t.url;a.autoplay=true;a.volume=labAudioVolume500_/100;a.style.display='none';a.loop=false;
        a.addEventListener('ended',labAudioAvancar510_);
        document.body.appendChild(a);labAudioElemento490_=a;
        const offset=Math.max(0,Math.floor((Date.now()-Number(st.inicioTs||Date.now()))/1000));
        a.addEventListener('loadedmetadata',()=>{try{a.currentTime=Math.min(offset,a.duration||offset);a.play();}catch(_){}},{once:true});
    }
};

// ------------------------------------------------------------
// 8) Anterior / Próximo nos editores com modal/painel real
// ------------------------------------------------------------
let dbNav510_={kind:'',id:''};
function dbNavCfg510_(kind){
    const map={
      item:{list:()=>itensDB,edit:id=>window.editarItemBanco(id),save:()=>window.salvarItemBancoModal(),host:'#dbItemModal .modal-content'},
      objeto:{list:()=>objetosMapaDB,edit:id=>window.editarObjetoMapaBanco_(id),save:()=>window.salvarObjetoMapaEditor_(),host:'#editorObjetoMapaBanco'},
      npc:{list:()=>npcsDB,edit:id=>window.editarNPCBanco_(id),save:()=>window.salvarNPCBanco_(),host:'#dbNPCModal .modal-content'},
      criatura:{list:()=>criaturasDB,edit:id=>window.editarCriaturaBanco_(id),save:()=>window.salvarCriaturaBanco_(),host:'#dbCriaturaModal .modal-content'},
      pericia:{list:()=>periciasDB,edit:id=>window.editarPericia(id),save:()=>window.salvarSkillBancoModal_(),host:'#dbSkillModal .modal-content'},
      especializacao:{list:()=>especializacoesDB,edit:id=>window.editarEspecializacao(id),save:()=>window.salvarSkillBancoModal_(),host:'#dbSkillModal .modal-content'},
      cenario:{list:()=>cenariosDB,edit:id=>window.editarCenarioBanco(id),save:()=>window.salvarCenarioBancoModal(),host:'#dbScenarioModal .modal-content'}
    };
    return map[kind];
}
function dbNavLista510_(kind){
    const cfg=dbNavCfg510_(kind);return (cfg?.list?.()||[]).slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'}));
}
function dbNavRender510_(){
    document.querySelectorAll('.db-nav-510').forEach(x=>x.remove());
    const cfg=dbNavCfg510_(dbNav510_.kind);if(!cfg)return;
    const host=document.querySelector(cfg.host);if(!host)return;
    const list=dbNavLista510_(dbNav510_.kind),ix=list.findIndex(x=>String(x.id)===String(dbNav510_.id));
    const bar=document.createElement('div');bar.className='db-nav-510';
    bar.innerHTML=`<button class="btn-small" onclick="dbNavSalvarIr510_(-1)" ${ix<=0?'disabled':''}>💾 ◀ Salvar e anterior</button>
      <button class="btn-small btn-select" onclick="dbNavSalvarIr510_(1)" ${ix<0||ix>=list.length-1?'disabled':''}>💾 Salvar e próximo ▶</button>
      <span class="pos">${ix>=0?`${ix+1} / ${list.length}`:''}</span>`;
    const h=host.querySelector('h3,h4');if(h)h.insertAdjacentElement('afterend',bar);else host.prepend(bar);
}
function dbNavAtivar510_(kind,id){dbNav510_={kind,id:String(id||'')};setTimeout(dbNavRender510_,0);}
window.dbNavSalvarIr510_=async function(dir){
    const cfg=dbNavCfg510_(dbNav510_.kind);if(!cfg)return;
    const list=dbNavLista510_(dbNav510_.kind),ix=list.findIndex(x=>String(x.id)===String(dbNav510_.id)),next=list[ix+Number(dir)];
    if(!next)return;
    try{await cfg.save();}catch(e){console.warn('Salvar e navegar',e);}
    setTimeout(()=>cfg.edit(next.id),120);
};

// Wrappers dos editores.
const editarItemBanco510Base_=window.editarItemBanco;
window.editarItemBanco=function(id){const r=editarItemBanco510Base_(id);dbNavAtivar510_('item',id);return r;};
const editarObjetoMapaBanco510Base_=window.editarObjetoMapaBanco_;
window.editarObjetoMapaBanco_=function(id){const r=editarObjetoMapaBanco510Base_(id);dbNavAtivar510_('objeto',id);return r;};
const editarNPCBanco510Base_=window.editarNPCBanco_;
window.editarNPCBanco_=function(id){const r=editarNPCBanco510Base_(id);dbNavAtivar510_('npc',id);return r;};
const editarCriaturaBanco510Base_=window.editarCriaturaBanco_;
window.editarCriaturaBanco_=function(id){const r=editarCriaturaBanco510Base_(id);dbNavAtivar510_('criatura',id);return r;};
const editarPericia510Base_=window.editarPericia;
window.editarPericia=function(id){const r=editarPericia510Base_(id);dbNavAtivar510_('pericia',id);return r;};
const editarEspecializacao510Base_=window.editarEspecializacao;
window.editarEspecializacao=function(id){const r=editarEspecializacao510Base_(id);dbNavAtivar510_('especializacao',id);return r;};
const editarCenarioBanco510Base_=window.editarCenarioBanco;
window.editarCenarioBanco=function(id){const r=editarCenarioBanco510Base_(id);dbNavAtivar510_('cenario',id);return r;};

// ------------------------------------------------------------
// 9) Garantir painel musical após render do Escudo do Mestre
// ------------------------------------------------------------
const renderizarCampanhaMestre510Base_=renderizarCampanhaMestre_;
renderizarCampanhaMestre_=function(){
    const r=renderizarCampanhaMestre510Base_();
    setTimeout(async()=>{
        try{
            if(!(trilhasMesaDB490_||[]).length)await labTrilhasCarregar490_();
            gmMusicaInstalar510_();
        }catch(e){console.warn('painel musica',e);}
    },0);
    return r;
};

const labRender510Base_=labRender_;

window.labRender_=labRender_;


