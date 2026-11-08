// ============================================================
// PAINEL ÚNICO DE BATALHA V29
// ============================================================





let labEstado_={
    tokens:[],pxPorMetro:48,larguraM:28,alturaM:14,fundo:'#d7d7d7',
    corGrade:'#777777',gradeVisivel:true,textura:'nenhuma',selecionadoId:'',objetosLab:[],objetoSelecionadoId:'',
    fase:'preparacao',rodada:0,ordemIniciativa:[],turnoIndex:0,logLab:[],ultimoResultadoLab:'',pendenciaLab:null,danoPendenteLab:null
};
let labDrag_=null;
let labMapaMesaUnsub_=null,labSyncTimer_=null,labAplicandoRemoto_=false;
let labMapaAcoesUnsub_=null;
const labMapaComandosEmProcessamento_=new Set();
const LAB_MAPA_MESA_REF_=()=>doc(db,'combatesAtivos','mapaMesaExperimental');
const LAB_MAPA_ACOES_REF_=()=>collection(db,'combatesAtivos','mapaMesaExperimental','acoes');


function labIniciarEscutaComandosJogadores_(){
    if(labMapaAcoesUnsub_){labMapaAcoesUnsub_();labMapaAcoesUnsub_=null;}
    if(!batalhaEhMestre_()||!currentUserUid)return;
    labMapaAcoesUnsub_=onSnapshot(LAB_MAPA_ACOES_REF_(),snap=>{
        for(const ch of snap.docChanges()){if(ch.type!=='added'&&ch.type!=='modified')continue;const a=ch.doc.data();if(a?.status!=='novo')continue;labProcessarComandoJogador_(ch.doc.id,a);}
    },e=>console.warn('Fila de ações do Mapa da Mesa indisponível:',e));
}

function labEstadoPublico_(){
    const clone=JSON.parse(JSON.stringify(labEstado_||{}));
    clone.tokens=(clone.tokens||[]).map(t=>{const x={...t};delete x.charLab;delete x.attrs;delete x.psiSelecaoLab;delete x.psSelecaoLab;return x;});
    clone.objetosLab=(clone.objetosLab||[]).map(o=>{const x={...o};delete x.imagem;return x;});
    if(clone.oficina2State?.elements)clone.oficina2State.elements=clone.oficina2State.elements.map(e=>e.type==='object'?({...e,src:''}):e);
    clone.objetoSelecionadoId='';clone.selecionadoId='';clone.modoCriacaoMapa=false;return clone;
}
async function labCarregarModelosObjetosFaltantes_(objetos){
    if(!currentUserUid)return;const conhecidos=new Set((objetosMapaDB||[]).map(x=>String(x.id))),ids=[...new Set((objetos||[]).map(o=>String(o.modeloId||'')).filter(Boolean))].filter(id=>!conhecidos.has(id));if(!ids.length)return;let mudou=false;
    for(const id of ids){try{const ds=await getDoc(doc(db,'configuracoes',objetoMapaDocId_(id)));if(ds.exists()){objetosMapaDB.push({id,...ds.data()});mudou=true;}}catch(e){console.warn('Modelo de objeto remoto indisponível',id,e);}}
    if(mudou&&document.getElementById('laboratorio-combate')?.classList.contains('active'))labRender_();
}

let labLocalSaveHandle_=null,labLocalSavePendente_=false;
function labPersistirLocalAgora_(){
    labLocalSaveHandle_=null;if(!labLocalSavePendente_)return;labLocalSavePendente_=false;
    try{localStorage.setItem('mesaEstelarLabCombate',JSON.stringify(labEstado_));}catch(_){}
}

window.addEventListener('beforeunload',()=>{if(labLocalSavePendente_)labPersistirLocalAgora_();});

function labCarregarLocal_(){
    try{
        const v=JSON.parse(localStorage.getItem('mesaEstelarLabCombate')||'null');
        if(v&&typeof v==='object'){
            const eraPadraoAntigo=Number(v.larguraM||0)===24&&Number(v.alturaM||0)===14;
            labEstado_={...labEstado_,...v,tokens:Array.isArray(v.tokens)?v.tokens:[]};
            if(eraPadraoAntigo)labEstado_.larguraM=28;
            if(!labEstado_.fase)labEstado_.fase='preparacao';
            if(!Array.isArray(labEstado_.ordemIniciativa))labEstado_.ordemIniciativa=[];
            for(const t of labEstado_.tokens){
                if(t.angulo==null)t.angulo=0;
                if(t.acoesMaxLab==null)t.acoesMaxLab=Number(t.acoesMax||2)||2;
                if(t.acoesAtuaisLab==null)t.acoesAtuaisLab=t.acoesMaxLab;
                if(t.movimentoGratisDisponivel==null)t.movimentoGratisDisponivel=true;
                if(t.movimentoTerrestre==null)t.movimentoTerrestre=3;
                if(t.movimentoVoo==null)t.movimentoVoo=0;
                if(t.movimentoNatacao==null)t.movimentoNatacao=0;
                if(!t.modoMovimento)t.modoMovimento='terrestre';
                if(t.alcanceAtaqueMax==null)t.alcanceAtaqueMax=0;
                if(t.iniciativaLab===undefined)t.iniciativaLab=null;
                if(t.iniciativaBonus==null)t.iniciativaBonus=Math.floor((Number(t.attrs?.INT||10)+Number(t.attrs?.DES||10))/2);
            }
        }
    }catch(_){}
    labSanearEstado_();
}
// v112: deslocamento da ficha respeitando 0 (criaturas imóveis como a Cila) em vez de cair no padrão 6.
function deslocamentoFichaV112_(c,nome='',t=null){
 // Procura o valor no modelo do banco (a ficha montada transforma campo vazio em 0).
 const id=decodeURIComponent(String(t?.id||'')),base=id.split(':').slice(1).join(':').split('~')[0];
 const modelo=id.startsWith('synccriatura:')?(criaturasDB||[]).find(x=>String(x.id)===base):id.startsWith('syncnpc:')?(npcsDB||[]).find(x=>String(x.id)===base):null;
 const vals=modelo?[modelo.deslocamento,modelo.movimentoTerrestre,modelo.movimentoBase]:[c?.deslocamento,c?.movimentoTerrestre];
 for(const v of vals){if(v===undefined||v===null||String(v).trim()==='')continue;const n=Number(String(v).replace(',','.'));if(Number.isFinite(n)){if(n>0||modelo)return Math.max(0,n);}}
 const tx=normalizarTextoCombate_(String(nome||c?.nome||''));
 if(/(^|[^a-z])cila([^a-z]|$)/.test(tx))return 0;
 const sheet=Number(c?.deslocamento??c?.movimentoTerrestre);if(sheet>0)return sheet;
 return /besta\s+ululante/i.test(String(nome||''))?8:6;
}
function labTamanhoTokenM_(c){
    const tam=Number(c?.atributos?.TAM||10);
    if(tam>=70)return 3.2;if(tam>=35)return 2.1;if(tam>=20)return 1.45;if(tam<=6)return .65;return .95;
}
function labHeuristicaMovimento_(p,c){
    const nome=normalizarTextoCombate_(`${p?.nome||''} ${c?.carreira||''} ${c?.conceito||''}`);
    let terra=Number(c?.movimentoTerrestre),voo=Number(c?.movimentoVoo),nat=Number(c?.movimentoNatacao);
    if(!Number.isFinite(terra))terra=3;if(!Number.isFinite(voo))voo=0;if(!Number.isFinite(nat))nat=0;
    if(nome.includes('cila'))terra=0;
    // A Besta Ululante é uma criatura grande: seu deslocamento de referência é 8 m.
    if(nome.includes('besta_ululante'))terra=Math.max(terra,8);
    if(nome.includes('dragao_trombeta_corredor'))terra=Math.max(terra,4);
    if(nome.includes('dragao_trombeta_alado')){terra=Math.max(terra,3);voo=Math.max(voo,6);}
    if(nome.includes('serpente_sanguessuga')){terra=2;nat=Math.max(nat,3);}
    return {terra:Math.max(0,terra),voo:Math.max(0,voo),nat:Math.max(0,nat)};
}
function labAlcanceMax_(c){
    return Math.max(0,...(ataquesNaturaisChar_(c)||[]).map(a=>Number(a.alcanceMetros||0)).filter(Number.isFinite));
}

function labCriarSnapshotCombate_(c){
    if(!c)return {hitMax:{},hit:{},armor:{},ferimentos:{}};
    const a=c.atributos||{},b=c.bonus||{};
    const con=Number(a.CON||0)+Number(b.CON||0),tam=Number(a.TAM||0)+Number(b.TAM||0);
    const max=calcularHitLocations_(con,tam),locs=Object.keys(max);
    const armorEq=calcularPAEquipado_(c,locs);
    const atual={};
    for(const loc of locs){
        const salvo=c?.combate?.hitLocations?.[loc];
        atual[loc]=Number.isFinite(Number(salvo))?Number(salvo):Number(max[loc]||0);
    }
    return {
        hitMax:JSON.parse(JSON.stringify(max)),
        hit:atual,
        armor:Object.fromEntries(locs.map(loc=>[loc,Math.max(0,Number(armorEq?.[loc]||0)+Number(c?.combate?.armor?.[loc]||0))])),
        ferimentos:{},morto:false,inconsciente:false
    };
}
function labGarantirSnapshotCombate_(t){
    if(!t)return null;
    if(labDrawing_)return t.combateLab||{hitMax:{},hit:{},armor:{},ferimentos:{}};
    if(!t.combateLab){
        const c=labCharToken_(t);
        t.combateLab=c?labCriarSnapshotCombate_(c):{hitMax:{'PV Global':20},hit:{'PV Global':20},armor:{'PV Global':0},ferimentos:{}};
    }
    return t.combateLab;
}

function labSnapshotChar_(c){
    if(!c)return null;
    try{
        const inv=c.inventario||{};
        return {
            id:c.id,nome:c.nome,imagem:c.imagem,tipo:c.tipo,
            __npcTemporario:!!c.__npcTemporario,__criaturaTemporaria:!!c.__criaturaTemporaria,
            npcBancoId:c.npcBancoId,criaturaBancoId:c.criaturaBancoId,
            atributos:JSON.parse(JSON.stringify(c.atributos||{})),
            bonus:JSON.parse(JSON.stringify(c.bonus||{})),
            pericias:JSON.parse(JSON.stringify(c.pericias||{})),
            especializacoes:JSON.parse(JSON.stringify(c.especializacoes||{})),
            poderesPsiIds:JSON.parse(JSON.stringify(c.poderesPsiIds||[])),
            habilidadesEspeciais:JSON.parse(JSON.stringify(c.habilidadesEspeciais||[])),
            armasNaturais:JSON.parse(JSON.stringify(c.armasNaturais||[])),
            ataquesNaturais:JSON.parse(JSON.stringify(c.ataquesNaturais||[])),
            mapaPericiaAtaques:JSON.parse(JSON.stringify(c.mapaPericiaAtaques||{})),
            combate:JSON.parse(JSON.stringify(c.combate||{})),
            inventario:JSON.parse(JSON.stringify(inv||{})),
            pontosMagiaGastos:Math.max(0,Math.floor(Number(c.pontosMagiaGastos||0)))
        };
    }catch(_){return null;}
}
function labTokenDeParticipante_(p,i=0){
    const c=batalhaCharLocal_(p.id),mov=labHeuristicaMovimento_(p,c);
    const max=Math.max(0,Number(p?.acoesMax||obterPAMaxCombate_(c)||2));
    return {id:String(p.id),nome:String(p.nome||'Participante'),imagem:String(p.imagem||c?.imagem||''),tipo:String(p.tipo||''),donoUid:String(p.donoUid||p.dono||c?.donoUid||c?.dono||''),
        x:Math.min(labEstado_.larguraM-1,1.5+(i%8)*2.5),y:Math.min(labEstado_.alturaM-1,1.5+Math.floor(i/8)*2.5),
        diametroM:labTamanhoTokenM_(c),angulo:0,attrs:c?.atributos?JSON.parse(JSON.stringify(c.atributos)):{},
        acoesMaxLab:max,acoesAtuaisLab:max,movimentoGratisDisponivel:mov.terra>0||mov.voo>0||mov.nat>0,
        movimentoTerrestre:mov.terra,movimentoVoo:mov.voo,movimentoNatacao:mov.nat,
        modoMovimento:mov.terra>0?'terrestre':mov.voo>0?'voo':mov.nat>0?'natacao':'imovel',
        alcanceAtaqueMax:labAlcanceMax_(c),iniciativaLab:null,
        iniciativaBonus:Math.floor((Number(c?.atributos?.INT||10)+Number(c?.atributos?.DES||10))/2),
        combateLab:labCriarSnapshotCombate_(c),
        charLab:labSnapshotChar_(c),
        psiGastosLab:Math.max(0,Math.floor(Number(c?.pontosMagiaGastos||0)))};
}
window.labCarregarBatalhaAtual_=function(){
    if(!batalhaEhMestre_())return;
    const ps=batalhaEstado_?.participantes||[];if(!ps.length){notificar_('O combate atual não tem participantes.','aviso');return;}
    const haviaLayout=(labEstado_.tokens||[]).length>0;
    const antigos=new Map((labEstado_.tokens||[]).map(t=>[String(t.id),t]));
    labEstado_.tokens=ps.map((p,i)=>{const n=labTokenDeParticipante_(p,i),a=antigos.get(String(p.id));if(!a)return n;
        const valido=(a.modoMovimento==='voo'&&n.movimentoVoo>0)||(a.modoMovimento==='natacao'&&n.movimentoNatacao>0)||(a.modoMovimento==='terrestre'&&n.movimentoTerrestre>0);
        return {...n,x:a.x,y:a.y,angulo:a.angulo,acoesAtuaisLab:Number.isFinite(Number(a.acoesAtuaisLab))?Math.min(n.acoesMaxLab,Number(a.acoesAtuaisLab)):n.acoesMaxLab,
            movimentoGratisDisponivel:a.movimentoGratisDisponivel!==false,modoMovimento:valido?a.modoMovimento:n.modoMovimento,
            iniciativaLab:(a.iniciativaLab!==null&&a.iniciativaLab!==''&&Number.isFinite(Number(a.iniciativaLab)))?Number(a.iniciativaLab):null,
            combateLab:n.combateLab,
            charLab:n.charLab||a.charLab||null,
            periciaLab:a.periciaLab||n.periciaLab,equipamentoLab:a.equipamentoLab||n.equipamentoLab,alvoLab:a.alvoLab||n.alvoLab,
            ultimoResultadoProprioLab:'',
            microModoLab:a.microModoLab||'ataque',psiSelecaoLab:a.psiSelecaoLab||null,psSelecaoLab:a.psSelecaoLab||null,
            municaoLab:a.municaoLab||n.municaoLab||{},
            psiGastosLab:Number.isFinite(Number(a.psiGastosLab))?Number(a.psiGastosLab):n.psiGastosLab};});
    if(!haviaLayout && labEstado_.fase!=='combate'){
        // Primeira carga: espalha automaticamente, como no mapa antigo.
        const colocados=[];
        for(const t of labEstado_.tokens){
            const raio=Math.max(.3,Number(t.diametroM||.9)/2);
            let pos=null;
            for(let k=0;k<160;k++){
                const x=raio+.25+Math.random()*Math.max(.2,labEstado_.larguraM-2*(raio+.25));
                const y=raio+.25+Math.random()*Math.max(.2,labEstado_.alturaM-2*(raio+.25));
                if(colocados.every(o=>Math.hypot(x-o.x,y-o.y)>(raio+o.raio+.25))){pos={x,y};break;}
            }
            if(!pos)pos={x:1+Math.random()*Math.max(1,labEstado_.larguraM-2),y:1+Math.random()*Math.max(1,labEstado_.alturaM-2)};
            t.x=Math.round(pos.x*100)/100;t.y=Math.round(pos.y*100)/100;
            colocados.push({x:t.x,y:t.y,raio});
        }
    }
    labSalvarLocal_();labRender_();
};
window.labAdicionarBoneco_=function(){
    const n=(labEstado_.tokens||[]).filter(t=>String(t.id).startsWith('dummy:')).length+1;
    labEstado_.tokens.push({id:`dummy:${Date.now()}`,nome:`Boneco de treino ${n}`,imagem:'',tipo:'Alvo',x:3+n,y:3,diametroM:.9,angulo:0,attrs:{TAM:10},
        acoesMaxLab:0,acoesAtuaisLab:0,movimentoGratisDisponivel:false,movimentoTerrestre:0,movimentoVoo:0,movimentoNatacao:0,modoMovimento:'livre',
        alcanceAtaqueMax:0,livreMestre:true,iniciativaLab:null,iniciativaBonus:0,
        combateLab:{hitMax:{'PV Global':20},hit:{'PV Global':20},armor:{'PV Global':0},ferimentos:{},morto:false,inconsciente:false}});
    labSalvarLocal_();labRender_();
};
window.labLimpar_=function(){
    if(!confirm('Limpar os participantes e o estado de combate desta mesa? O mapa desenhado permanece.'))return;
    labEstado_={...labEstado_,tokens:[],selecionadoId:'',fase:'preparacao',rodada:0,ordemIniciativa:[],turnoIndex:0,pendenciaLab:null,danoPendenteLab:null,ultimoResultadoLab:''};labSalvarLocal_();labRender_();
};
window.labCentralizarTokens_=function(){
    if(labEstado_.fase==='combate'){notificar_('Reorganize os tokens na fase de preparação.','aviso');return;}
    (labEstado_.tokens||[]).forEach((t,i)=>{t.x=1.5+(i%8)*2.6;t.y=1.5+Math.floor(i/8)*2.6;});labSalvarLocal_();labRender_();
};

window.labPosicoesAleatorias_=function(){
    if(labEstado_.fase==='combate'){notificar_('As posições aleatórias só podem ser geradas durante a preparação.','aviso');return;}
    const colocados=[];
    for(const t of labEstado_.tokens||[]){
        const raio=Math.max(.3,Number(t.diametroM||.9)/2);
        let pos=null;
        for(let k=0;k<160;k++){
            const x=raio+.25+Math.random()*Math.max(.2,labEstado_.larguraM-2*(raio+.25));
            const y=raio+.25+Math.random()*Math.max(.2,labEstado_.alturaM-2*(raio+.25));
            if(colocados.every(o=>Math.hypot(x-o.x,y-o.y)>(raio+o.raio+.25))){pos={x,y};break;}
        }
        if(!pos)pos={x:1+Math.random()*Math.max(1,labEstado_.larguraM-2),y:1+Math.random()*Math.max(1,labEstado_.alturaM-2)};
        t.x=Math.round(pos.x*100)/100;t.y=Math.round(pos.y*100)/100;colocados.push({x:t.x,y:t.y,raio});
    }
    labSalvarLocal_();labRender_();
};
window.labResetarAcoes_=function(){
    for(const t of labEstado_.tokens||[]){t.acoesAtuaisLab=Math.max(0,Number(t.acoesMaxLab||0));t.movimentoGratisDisponivel=!t.livreMestre&&labMovimentoPorAcao_(t)>0;}
    labSalvarLocal_();labRender_();
};

function labSanearEstado_(){
    labEstado_.tokens=Array.isArray(labEstado_.tokens)?labEstado_.tokens:[];
    labEstado_.objetosLab=Array.isArray(labEstado_.objetosLab)?labEstado_.objetosLab:[];
    if(!Array.isArray(labEstado_.ordemIniciativa))labEstado_.ordemIniciativa=[];
    const ids=new Set(labEstado_.tokens.map(t=>String(t.id)));
    labEstado_.ordemIniciativa=labEstado_.ordemIniciativa.filter(id=>ids.has(String(id)));
    if(labEstado_.fase==='combate'&&!labEstado_.ordemIniciativa.length){
        // A page reload must not leave the UI claiming there is a combat
        // without a usable initiative order.
        const cs=labEstado_.tokens.filter(t=>!String(t.id).startsWith('dummy:')&&t.iniciativaLab!==null&&t.iniciativaLab!==undefined);
        cs.sort((a,b)=>Number(b.iniciativaLab||0)-Number(a.iniciativaLab||0));
        labEstado_.ordemIniciativa=cs.map(t=>String(t.id));
        if(!labEstado_.ordemIniciativa.length)labEstado_.fase='preparacao';
    }
    if(labEstado_.turnoIndex<0||labEstado_.turnoIndex>=Math.max(1,labEstado_.ordemIniciativa.length))labEstado_.turnoIndex=0;

    const pend=labEstado_.pendenciaLab;
    if(pend&&(!ids.has(String(pend.atacanteId))||!ids.has(String(pend.defensorId))))labEstado_.pendenciaLab=null;
    const dano=labEstado_.danoPendenteLab;
    if(dano&&(!ids.has(String(dano.atacanteId))||!ids.has(String(dano.defensorId))))labEstado_.danoPendenteLab=null;

    if(labEstado_.selecionadoId&&!ids.has(String(labEstado_.selecionadoId)))labEstado_.selecionadoId='';
    const atual=labEstado_.fase==='combate'?labTokenAtual_():null;
    if(atual&&!labEstado_.selecionadoId)labEstado_.selecionadoId=String(atual.id);
}
function labTokensCombatentes_(){return (labEstado_.tokens||[]).filter(t=>!String(t.id).startsWith('dummy:'));}
function labTokenAtual_(){
    if(labEstado_.fase!=='combate'||!labEstado_.ordemIniciativa?.length)return null;
    const id=labEstado_.ordemIniciativa[Math.max(0,Math.min(labEstado_.ordemIniciativa.length-1,Number(labEstado_.turnoIndex||0)))];
    return (labEstado_.tokens||[]).find(t=>String(t.id)===String(id))||null;
}
function labPrepararNovaRodada_(){for(const t of labTokensCombatentes_()){const st=labGarantirSnapshotCombate_(t)||{},central=['Cabeça','Peito','Abdômen'].some(loc=>{const max=Number(st.hitMax?.[loc]||0);return max>0&&Number(st.hit?.[loc]||0)<=max/2});const deb=Math.max(0,Number(t.penalidadeAcaoProximaLab||0),central&&Number(st.penalidadeAcoesFerimento||0)>0?1:0);t.acoesAtuaisLab=Math.max(0,Number(t.acoesMaxLab||0)-deb);t.penalidadeAcaoProximaLab=0;t.movimentoGratisDisponivel=labMovimentoPorAcao_(t)>0;t.movimentoBonusLab=0;t.passagensLab=0;}}
window.labIniciarCombate_=function(){
    const cs=labTokensCombatentes_();if(!cs.length){notificar_('Adicione participantes antes de iniciar o combate.','aviso');return;}
    for(const t of labEstado_.tokens||[]){
        if(String(t.id).startsWith('dummy:')){
            t.combateLab={hitMax:{'PV Global':20},hit:{'PV Global':20},armor:{'PV Global':0},ferimentos:{},morto:false,inconsciente:false,derrubado:false,sangrando:false};
        }else{
            const c=labCharToken_(t)||t.charLab;
            if(c)t.combateLab=labCriarSnapshotCombate_(c);
        }
        t.primeirosSocorrosLab=null;t.acaoAuxLab=null;t.ultimoResultadoProprioLab='';
        const psiChar=labCharToken_(t)||t.charLab;
        t.psiGastosLab=Math.max(0,Math.floor(Number(psiChar?.pontosMagiaGastos||0)));
    }
    labEstado_.ultimoResultadoLab='';
    for(const t of cs)t.iniciativaLab=1+Math.floor(Math.random()*10)+Number(t.iniciativaBonus||0);
    cs.sort((a,b)=>Number(b.iniciativaLab||0)-Number(a.iniciativaLab||0)||Number(b.iniciativaBonus||0)-Number(a.iniciativaBonus||0)||String(a.nome).localeCompare(String(b.nome)));
    labEstado_.ordemIniciativa=cs.map(t=>String(t.id));labEstado_.turnoIndex=0;labEstado_.rodada=1;labEstado_.fase='combate';labEstado_.pendenciaLab=null;labEstado_.danoPendenteLab=null;labPrepararNovaRodada_();
    const atual=labTokenAtual_();if(atual)labEstado_.selecionadoId=String(atual.id);labSalvarLocal_();labRender_();
};

window.labPassarAcao_=function(){
    if(labEstado_.fase!=='combate'||labEstado_.pendenciaLab||labEstado_.danoPendenteLab)return;
    const t=labTokenAtual_();if(!t)return;
    const n=Math.max(0,Number(t.passagensLab||0));
    if(n>0){
        if(Number(t.acoesAtuaisLab||0)<=0)return;
        t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);
        t.ultimoResultadoProprioLab='Passou novamente: 1 AÇ gasta.';
    }else t.ultimoResultadoProprioLab='Passou a primeira oportunidade da rodada sem gastar AÇ.';
    t.passagensLab=n+1;
    labSalvarLocal_();
    window.labEncerrarOportunidade_();
};

window.labEncerrarOportunidade_=function(){
    if(labEstado_.fase!=='combate')return;
    if(labEstado_.pendenciaLab||labEstado_.danoPendenteLab){notificar_('Resolva a defesa e o dano pendentes antes de encerrar a oportunidade.','aviso');return;}
    const encerrando=labTokenAtual_(),stEnc=labGarantirSnapshotCombate_(encerrando);
    if(stEnc&&Number(stEnc.ataquesBloqueadosTurnos||0)>0)stEnc.ataquesBloqueadosTurnos=Math.max(0,Number(stEnc.ataquesBloqueadosTurnos||0)-1);
    if(stEnc?.atordoado&&stEnc?.atordoadoAteOportunidade){stEnc.atordoado=false;stEnc.atordoadoAteOportunidade=false;}
    const ordem=labEstado_.ordemIniciativa||[];if(!ordem.length)return;
    labEstado_.turnoIndex++;
    if(labEstado_.turnoIndex>=ordem.length){labEstado_.turnoIndex=0;labEstado_.rodada++;labPrepararNovaRodada_();notificar_(`Rodada ${labEstado_.rodada} iniciada. AÇ e 1 m gratuito foram repostos.`,'info',4200);}
    let atual=labTokenAtual_();
    // Participantes mortos/inconscientes não recebem uma oportunidade ativa.
    // Avança pela ordem até encontrar alguém capaz de agir.
    let seguranca=0;
    while(atual && seguranca<(labEstado_.ordemIniciativa||[]).length){
        const st=labGarantirSnapshotCombate_(atual);
        if(!st?.morto&&!st?.inconsciente&&!st?.incapacitado)break;
        labEstado_.turnoIndex++;
        if(labEstado_.turnoIndex>=ordem.length){
            labEstado_.turnoIndex=0;labEstado_.rodada++;labPrepararNovaRodada_();
        }
        atual=labTokenAtual_();seguranca++;
    }
    if(atual)labEstado_.selecionadoId=String(atual.id);labSalvarLocal_();labRender_();
};

let labAutoAvancoArmado_=false;

window.labVoltarPreparacao_=function(){
    if(labEstado_.fase==='combate'&&!confirm('Encerrar combate? As posições serão mantidas, mas rodada, turnos e iniciativa serão encerrados.'))return;
    labEstado_.fase='preparacao';labEstado_.rodada=0;labEstado_.turnoIndex=0;labEstado_.ordemIniciativa=[];labEstado_.pendenciaLab=null;labEstado_.danoPendenteLab=null;for(const t of labEstado_.tokens||[])t.iniciativaLab=null;labSalvarLocal_();try{labAgendarSyncRemoto_();}catch(_){}labRender_();
};
window.labMudarFundo_=function(v){labEstado_.fundo=String(v||'#d7d7d7');labSalvarLocal_();labRender_();};
window.labMudarCorGrade_=function(v){labEstado_.corGrade=String(v||'#777777');labSalvarLocal_();labRender_();};
window.labAlternarGrade_=function(v){labEstado_.gradeVisivel=!!v;labSalvarLocal_();labRender_();};
window.labMudarTextura_=function(v){labEstado_.textura=String(v||'nenhuma');labSalvarLocal_();labRender_();};
window.labMudarTamanhoMapa_=function(v){const m=String(v||'28x14').match(/^(\d+)x(\d+)$/);if(!m)return;labEstado_.larguraM=Number(m[1]);labEstado_.alturaM=Number(m[2]);labSalvarLocal_();labRender_();};
window.labMudarZoom_=function(v){labEstado_.pxPorMetro=Math.max(30,Math.min(90,Number(v)||48));labSalvarLocal_();labRender_();};

function labAnguloPara_(origem,alvo){
    if(!origem||!alvo)return Number(origem?.angulo||0);
    const dx=Number(alvo.x||0)-Number(origem.x||0),dy=Number(alvo.y||0)-Number(origem.y||0);
    if(Math.hypot(dx,dy)<.001)return Number(origem.angulo||0);
    let deg=Math.atan2(dx,-dy)*180/Math.PI;
    if(deg<0)deg+=360;
    return Math.round(deg);
}
function labApontarPara_(origem,alvo){
    if(!origem||!alvo)return;
    // Facing automático só pode mudar na oportunidade do próprio participante.
    if(labEstado_.fase==='combate'&&String(labTokenAtual_()?.id)===String(origem.id)){
        origem.angulo=labAnguloPara_(origem,alvo);
    }
}
window.labSelecionar_=function(id){
    const sid=String(id);
    if(labEstado_.fase==='combate'){
        const atual=labTokenAtual_();
        if(atual && sid!==String(atual.id)){
            const alvo=(labEstado_.tokens||[]).find(t=>String(t.id)===sid);
            atual.alvoLab=sid;
            labApontarPara_(atual,alvo);
            labEstado_.selecionadoId=sid;
            labEstado_.ultimoResultadoLab=`Alvo selecionado: ${alvo?.nome||'alvo'}.`;
            labSalvarLocal_();labRender_();return;
        }
    }
    labEstado_.selecionadoId=sid;labSalvarLocal_();labRender_();
};
window.labMudarModoMovimento_=function(v){
    const t=(labEstado_.tokens||[]).find(x=>String(x.id)===String(labEstado_.selecionadoId));if(!t||t.livreMestre)return;
    const ok=(v==='terrestre'&&t.movimentoTerrestre>0)||(v==='voo'&&t.movimentoVoo>0)||(v==='natacao'&&t.movimentoNatacao>0);if(ok){t.modoMovimento=v;labSalvarLocal_();labRender_();}
};
function labMovimentoPorAcao_(t){if(!t)return 0;if(t.livreMestre)return 999;if(t.modoMovimento==='voo')return Number(t.movimentoVoo||0);if(t.modoMovimento==='natacao')return Number(t.movimentoNatacao||0);if(t.modoMovimento==='terrestre')return Number(t.movimentoTerrestre||0);return 0;}
function labMovimentoMaxM_(t){
    if(!t)return 0;if(t.livreMestre)return 999;
    const p=labMovimentoPorAcao_(t),bonus=Math.max(0,Number(t.movimentoBonusLab||0));
    if(p<=0)return bonus;
    const normal=Math.max(Number(t.acoesAtuaisLab||0)*p,t.movimentoGratisDisponivel!==false?Math.min(1,p):0);
    return bonus+normal;
}
function labCustoMovimento_(t,dist){
    if(t?.livreMestre)return {acoes:0,usaGratis:false,usaBonus:0};
    if(dist<=.001)return {acoes:0,usaGratis:false,usaBonus:0};
    const bonus=Math.max(0,Number(t?.movimentoBonusLab||0)),usaBonus=Math.min(bonus,dist),rest=Math.max(0,dist-usaBonus);
    if(rest<=.001)return {acoes:0,usaGratis:false,usaBonus};
    const p=labMovimentoPorAcao_(t);if(p<=0)return {acoes:0,usaGratis:false,usaBonus};
    if(rest<=1.0001&&t.movimentoGratisDisponivel!==false)return {acoes:0,usaGratis:true,usaBonus};
    return {acoes:Math.max(1,Math.ceil((rest-.0001)/p)),usaGratis:false,usaBonus};
}

function labCharToken_(t){
    if(t?.__novaFicha)return t.charLab||null;
    if(!t||String(t.id).startsWith('dummy:'))return null;
    const vivo=batalhaCharLocal_(t.id);
    if(vivo){
        // Refresh the local snapshot opportunistically whenever the real
        // character is available.
        const snap=labSnapshotChar_(vivo);
        if(snap)t.charLab=snap;
        return vivo;
    }
    return t.charLab||null;
}
function labPericiasAtaque_(t){
    const c=labCharToken_(t);if(!c)return [];
    return (batalhaListaPericias_(c)||[]).filter(p=>periciaCriaturaPodeAtacar_(c,p)||(!c.__npcTemporario&&!c.__criaturaTemporaria&&periciaEhOfensiva_(p)));
}
function labPericiaPorToken_(t,token){
    const c=labCharToken_(t);if(!c)return null;
    let p=batalhaResolverPericia_(token);
    if(!p && String(token||'').replace(/^per:/,'')==='esquiva'){
        p={id:'esquiva',nome:'Esquiva',tipo:'Defesa',uso:'defesa',__especializacao:false,__labSynthetic:true};
    }
    if(p&&(c.__npcTemporario||c.__criaturaTemporaria)){
        const reg=(p.__especializacao?c.especializacoes:c.pericias)?.[p.id];
        if(reg?.nomeOriginal)p={...p,nome:reg.nomeOriginal};
    }
    return p;
}
function labAlvosAtaque_(t){
    // A lista existe para validações, mas não escolhe nada automaticamente.
    // Objetos destruídos continuam selecionáveis manualmente para ataques posteriores.
    return [
      ...(labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t?.id)),
      ...(labEstado_.objetosLab||[]).filter(o=>o.destrutivel!==false)
    ];
}
function labAlvoAtaquePorId_(id){return labTokenPorId_(id)||labObjetoPorId_(id)||null;}
function labEhAlvoObjeto_(a){return !!a&&a.id!=null&&!!labObjetoPorId_(String(a.id));}
function labGarantirPrefsAtaque_(t){
    if(!t)return;
    const c=labCharToken_(t),skills=labPericiasAtaque_(t);
    if(!skills.length){t.periciaLab='';t.equipamentoLab='';return;}
    if(!skills.some(p=>batalhaTokenPericia_(p)===t.periciaLab))t.periciaLab=batalhaTokenPericia_(skills[0]);
    const per=labPericiaPorToken_(t,t.periciaLab);
    const eq=batalhaEquipamentos_(c,per,t.equipamentoLab);
    if(!eq.some(x=>x.valor===t.equipamentoLab))t.equipamentoLab=eq[0]?.valor||'';
    // CRÍTICO: alvo nunca recebe fallback. Só um clique no mapa define alvoLab.
    const alvo=labAlvoAtaquePorId_(t.alvoLab);
    if(!t._alvoSelecionadoMapa763||!alvo||String(alvo.id)===String(t.id)){
        t.alvoLab='';
        t._alvoManualFixadoLab='';
        t._alvoComandoFixadoLab='';
        t._alvoSelecionadoMapa763=false;
    }
}
function labItemSelecionado_(t){
    const c=labCharToken_(t);if(!c)return null;
    const per=labPericiaPorToken_(t,t.periciaLab);
    const ops=batalhaEquipamentos_(c,per,t.equipamentoLab);
    return ops.find(x=>x.valor===t.equipamentoLab)?.item||null;
}
function labDistanciaEntre_(a,b){
    if(!a||!b)return Infinity;
    return Math.hypot(Number(a.x||0)-Number(b.x||0),Number(a.y||0)-Number(b.y||0));
}

function labDistanciaInteracaoObjeto_(ator,objeto){
    if(!ator||!objeto)return Infinity;

    const ax=Number(ator.x||0), ay=Number(ator.y||0);
    const ox=Number(objeto.x||0), oy=Number(objeto.y||0);

    const largura=Math.max(0.05,Number(objeto.larguraM||1));
    const altura=Math.max(0.05,Number(objeto.alturaM||1));
    const ang=-Number(objeto.angulo||0)*Math.PI/180;

    const dx=ax-ox, dy=ay-oy;
    const lx=dx*Math.cos(ang)-dy*Math.sin(ang);
    const ly=dx*Math.sin(ang)+dy*Math.cos(ang);

    const foraX=Math.max(Math.abs(lx)-largura/2,0);
    const foraY=Math.max(Math.abs(ly)-altura/2,0);

    const raioAtor=Math.max(0,Number(ator.diametroM||0.9)/2);
    return Math.max(0,Math.hypot(foraX,foraY)-raioAtor);
}

function labAlcanceAtaque_(t,item){
    if(!item)return 1.5;
    const explicito=Number(item.alcanceMetros);
    if(Number.isFinite(explicito)&&explicito>0)return explicito;
    const nome=normalizarTextoCombate_(item.nome||'');
    if(nome.includes('bote_de_presa_cirurgico'))return 15;
    if(nome.includes('trombeta')||nome.includes('eco_da_matilha'))return 15;
    if(nome.includes('mordida_de_serpente'))return 3;
    if(item.natural===true){
        // Humanoid bites require very close contact; large natural weapons are revised
        // explicitly in the creature bank instead of inheriting one universal reach.
        if(nome==='mordida')return 0.8;
        if(/garra|pisot|pseudopode|punho|mandib/.test(nome))return 1.8;
        return 2;
    }
    const a=Number(item.alcance||0);
    if(a>2)return a;
    if(String(item.municao||'').trim())return Math.max(10,a||20);
    return 1.8;
}

function labAlcanceSelecionado_(t){
    if(!t)return 0;
    labGarantirPrefsAtaque_(t);
    const item=labItemSelecionado_(t);
    return item?labAlcanceAtaque_(t,item):0;
}

function labModeloTexto_(t){
    const c=labCharToken_(t),m=t?.criaturaBancoId?criaturaBancoPorId_(t.criaturaBancoId):null;
    return normalizarTextoCombate_(`${t?.nome||''} ${t?.tipo||''} ${c?.especie||''} ${c?.tipo||''} ${m?.habilidadesTexto||c?.habilidadesTexto||''}`);
}
function labSemCostas_(t){return /sessil|radial|amorfo|sem_costas|cila/.test(labModeloTexto_(t));}
function labAnguloAtaqueRelativo_(atacante,defensor){
    if(!atacante||!defensor||labSemCostas_(defensor))return 0;
    const dx=Number(atacante.x||0)-Number(defensor.x||0),dy=Number(atacante.y||0)-Number(defensor.y||0);
    let rumo=Math.atan2(dx,-dy)*180/Math.PI;if(rumo<0)rumo+=360;
    let d=Math.abs((((rumo-Number(defensor.angulo||0))+540)%360)-180);
    return d;
}
function labGrausCostas_(atacante,defensor){
    const a=labAnguloAtaqueRelativo_(atacante,defensor);
    if(a>=150)return 2;   // aproximadamente 60° centrais nas costas
    if(a>=110)return 1;   // traseira diagonal
    return 0;             // lados/frente sem penalidade por enquanto
}
function labGrausTamanhoAlvoDistancia_(atacante,defensor,item){
    if(!labAtaqueEhDistancia_(item)||!atacante||!defensor)return 0;
    const ta=Math.max(.2,Number(atacante.diametroM||.9)),td=Math.max(.2,Number(defensor.diametroM||.9)),r=td/ta;
    if(r>=4)return 2;
    if(r>=1.75)return 1;
    return 0;
}
function labEmTratamento_(t){
    if(!t)return false;
    if(t.primeirosSocorrosLab)return true;
    return (labEstado_.tokens||[]).some(x=>String(x?.primeirosSocorrosLab?.alvoId||'')===String(t.id));
}
function labPenalidadeEstadoGraus_(t){
    const st=labGarantirSnapshotCombate_(t);
    return (st?.atordoado?1:0)+(labEmTratamento_(t)?1:0);
}
function labEhArmaMuniciada_(item){
    if(!item||item.natural===true)return false;
    const m=String(item.municao||'').trim();
    return !!m&&m!=='∞'&&m.toLowerCase()!=='infinito';
}
function labChaveArma_(item){return String(item?.instanciaId||item?.idInstancia||item?.idBanco||item?.id||getNome(item)||'arma');}
function labCapacidadeArma_(item){
    const n=Number(item?.uso??item?.capacidade??item?.cargas??0);
    return Number.isFinite(n)&&n>0?Math.floor(n):0;
}
function labMunicaoAtual_(t,item){
    if(!labEhArmaMuniciada_(item))return Infinity;
    t.municaoLab=t.municaoLab||{};
    const k=labChaveArma_(item);
    if(t.municaoLab[k]==null)t.municaoLab[k]=labCapacidadeArma_(item);
    return Math.max(0,Number(t.municaoLab[k]||0));
}
function labConsumirMunicao_(t,item,q=1){
    if(!labEhArmaMuniciada_(item))return true;
    const atual=labMunicaoAtual_(t,item);if(atual<q)return false;
    t.municaoLab[labChaveArma_(item)]=atual-q;return true;
}
function labRecarregarLocal_(t,item){
    if(!t||!item||!labEhArmaMuniciada_(item)||Number(t.acoesAtuaisLab||0)<=0)return false;
    const cap=labCapacidadeArma_(item);if(cap<=0){notificar_('Esta arma não possui capacidade de munição cadastrada no campo Uso.','aviso');return false;}
    t.municaoLab=t.municaoLab||{};t.municaoLab[labChaveArma_(item)]=cap;
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);
    t.ultimoResultadoProprioLab=`${getNome(item)} recarregada: ${cap}/${cap}. A recarga é simulada/local e não altera o inventário real.`;
    try{somClique_();}catch(_){}
    labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();return true;
}
window.labRecarregar_=function(){const t=labTokenAtual_();if(!t)return;labGarantirPrefsAtaque_(t);labRecarregarLocal_(t,labItemSelecionado_(t));};

function labValorPericiaAtaque_(c,per,alvo=null,item=null){
    if(!c||!per)return 0;
    const baseOriginal=obterValorRegistroPericia_(c,per.id,per.__especializacao);
    const arm=valorPericiaComArmadura_(c,per,baseOriginal);
    const token=(labEstado_.tokens||[]).find(t=>String(t.id)===String(c.id));
    let graus=Math.max(batalhaPenalidadeFerimento_(c,per),labPenalidadeFerimentoLab22_(token,per))+batalhaPenalidadeCaido_(c)+batalhaPenalidadeInfeccao_(c)+labPenalidadeEstadoGraus_(token);
    if(alvo&&item)graus-=labGrausTamanhoAlvoDistancia_(token,alvo,item);
    const ajuste=aplicarDificuldadeEFadiga_(c,arm.valor,token?.bonusDificuldadeFacilPsiLab?'facil':'padrao',graus);
    return Math.max(0,Math.round(Number(ajuste.valor||0)*(token?.luckPrepared?1.5:1))+Math.max(0,Number(token?.bonusIntuicaoPendenteLab||0))); // v200: Sorte ativa = +50% da perícia
}
window.labMudarAtaquePref_=function(campo,v){
    const t=labTokenAtual_();if(!t)return;
    t.microModoLab='ataque';t[campo]=String(v||'');
    if(campo==='periciaLab')t.equipamentoLab='';
    labGarantirPrefsAtaque_(t);if(batalhaEhMestre_())labSalvarLocal_();labRender_();
};
window.labSelecionarAlvo_=function(v){
    const t=labTokenAtual_();if(!t)return;
    const id=String(v||'');
    t.alvoLab=id;t._alvoManualFixadoLab=id;t._alvoComandoFixadoLab='';
    const alvo=labAlvoAtaquePorId_(id);
    if(alvo&&labObjetoPorId_(id)){
        labEstado_.objetoSelecionadoId=id;labEstado_.selecionadoId='';
        t._alvoMortoManual510=!!labAlvoInerte490_(alvo);
    }else{
        labEstado_.objetoSelecionadoId='';
        labEstado_.selecionadoId=id;
        t._alvoMortoManual510=false;
    }
    labApontarPara_(t,alvo);
    if(batalhaEhMestre_())labSalvarLocal_();labRender_();
};


function labSomAtaque_(item,grau=''){
    if(labReducing_)return;
    try{
        const nome=getNome(item)||item?.nome||'';
        if(String(grau).toLowerCase().includes('crít')||String(grau).toLowerCase().includes('crit')){
            somCriticoArma_(item,nome);
        }else{
            tocarSomDano_(item,nome);
        }
    }catch(_){try{somDado_();}catch(__){}}
}
function labSomDefesa_(){try{somDado_();}catch(_){}}
function labSomDanoAplicado_(item){
    try{
        const tipo=tipoSomArma_(item,getNome(item)||item?.nome||'');
        // O ataque já toca o som da arma. No dano usamos um impacto curto,
        // evitando repetir exatamente o mesmo disparo.
        if(tipo==='soco'||tipo==='espada')somSoco_();
        else somDado_();
    }catch(_){}
}
function labDefesasDisponiveis_(t){
    const c=labCharToken_(t);if(!c)return [];
    let lista=batalhaListaPericiasDefesa_(c)||[];
    if(!lista.some(p=>normalizarTextoCombate_(p.id||getNome(p))==='esquiva')){
        lista=[{id:'esquiva',nome:'Esquiva',tipo:'Defesa',uso:'defesa',__especializacao:false,__labSynthetic:true},...lista];
    }
    const vistos=new Set();
    return lista.filter(p=>{const k=`${p.__especializacao?'e':'p'}:${p.id}`;if(vistos.has(k))return false;vistos.add(k);return true;});
}
function labValorDefesa_(c,per){
    if(!c||!per)return 0;
    let bruto;
    if(per.__labSynthetic&&per.id==='esquiva'){
        bruto=Number(c?.atributos?.DES||10)*2+Number(c?.pericias?.esquiva?.treino||0);
    }else{
        bruto=obterValorRegistroPericia_(c,per.id,per.__especializacao);
    }
    const arm=valorPericiaComArmadura_(c,per,bruto);
    const token=(labEstado_.tokens||[]).find(t=>String(t.id)===String(c.id));
    const pend=labEstado_.pendenciaLab,atacante=pend?labTokenPorId_(pend.atacanteId):null;
    const costas=atacante&&token?labGrausCostas_(atacante,token):0;
    const extra=Math.max(batalhaPenalidadeFerimento_(c,per),labPenalidadeFerimentoLab22_(token,per))+batalhaPenalidadeCaido_(c)+(typeof batalhaPenalidadeTratamento_==='function'?batalhaPenalidadeTratamento_(c):0)+labPenalidadeEstadoGraus_(token)+costas+batalhaPenalidadeInfeccao_(c);
    return Math.max(0,Math.round(Number(aplicarDificuldadeEFadiga_(c,arm.valor,token?.bonusDificuldadeFacilPsiLab?'facil':'padrao',extra).valor||0)*(token?.luckPrepared?1.5:1))+Math.max(0,Number(token?.bonusIntuicaoPendenteLab||0))); // v200: Sorte ativa = +50% da perícia
}
window.labMudarDefesa_=function(v){
    const pend=labEstado_.pendenciaLab;if(!pend)return;
    const d=(labEstado_.tokens||[]).find(t=>String(t.id)===String(pend.defensorId));if(!d)return;
    d.defesaLab=String(v||'');labSalvarLocal_();labRender_();
};



function labPericiasTeste_(t){
    const c=labCharToken_(t);if(!c)return [];
    return (batalhaListaPericias_(c)||[]).filter(p=>{
        if(p?.__especializacao)return false;
        const nome=normalizarTextoCombate_(`${p?.id||''} ${getNome(p)||''}`);
        // Primeiros Socorros tem fluxo próprio no combate.
        if(/primeiros socorros|first aid|急救/.test(nome))return false;
        const reg=c?.pericias?.[p.id];
        return totalTreinoPericia_(reg)>0;
    }).sort((a,b)=>getNome(a).localeCompare(getNome(b)));
}
function labValorTeste_(t,per){
    const c=labCharToken_(t);if(!c||!per)return 0;
    const bruto=obterValorRegistroPericia_(c,per.id,!!per.__especializacao),arm=valorPericiaComArmadura_(c,per,bruto);
    const extra=Math.max(batalhaPenalidadeFerimento_(c,per),labPenalidadeFerimentoLab22_(t,per))+batalhaPenalidadeCaido_(c)+batalhaPenalidadeInfeccao_(c);
    return Math.max(0,Math.round(Number(aplicarDificuldadeEFadiga_(c,arm.valor,t?.bonusDificuldadeFacilPsiLab?'facil':'padrao',extra).valor||0)*(t?.luckPrepared?1.5:1))); // v200: Sorte ativa = +50% da perícia
}
window.labAbrirTeste_=function(){const t=labTokenAtual_();if(!t||t.primeirosSocorrosLab)return;const ps=labPericiasTeste_(t);if(!ps.length)return;t.acaoAuxLab={tipo:'teste_pericia',periciaToken:batalhaTokenPericia_(ps[0])};labSalvarLocal_();labRender_();};
window.labTesteSelecionar_=function(v){const t=labTokenAtual_();if(t?.acaoAuxLab)t.acaoAuxLab.periciaToken=String(v||'');labSalvarLocal_();labRender_();};
window.labExecutarTeste_=function(){
    const t=labTokenAtual_(),a=t?.acaoAuxLab;if(!t||a?.tipo!=='teste_pericia'||Number(t.acoesAtuaisLab||0)<=0)return;
    const per=labPericiasTeste_(t).find(p=>batalhaTokenPericia_(p)===a.periciaToken);if(!per)return;
    if(!batalhaEhMestre_()){labEnviarComandoJogador_('teste_pericia',{periciaToken:a.periciaToken},t).then(ok=>{if(ok)notificar_(`Teste de ${getNome(per)} enviado ao mestre.`,'info',1800);});return;}
    const bonusInt=Math.max(0,Number(t.bonusIntuicaoPendenteLab||0)),bonusMente=Number(t.menteAceleradaCargasLab||0)>0&&/INT/.test(String(per.formula||''))?Math.max(0,Number(t.menteAceleradaBonusLab||20)):0,valor=labValorTeste_(t,per)+bonusInt+bonusMente,roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll);if(bonusInt>0)t.bonusIntuicaoPendenteLab=0;if(t.luckPrepared)t.luckPrepared=false;if(bonusMente>0)t.menteAceleradaCargasLab=Math.max(0,Number(t.menteAceleradaCargasLab||0)-1);if(t.bonusDificuldadeFacilPsiLab)t.bonusDificuldadeFacilPsiLab=0;
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);if(r.grau==='Crítico')t.acoesAtuaisLab=Math.min(Number(t.acoesMaxLab||0)+6,Number(t.acoesAtuaisLab||0)+1);else if(r.grau==='Fiasco'){if(Number(t.acoesAtuaisLab||0)>0)t.acoesAtuaisLab--;else t.penalidadeAcaoProximaLab=Math.max(1,Number(t.penalidadeAcaoProximaLab||0));}t.acaoAuxLab=null;
    let efeito='';
    const nome=normalizarTextoCombate_(getNome(per)),sucesso=batalhaResultadoGradeValor_(r.grau)>=2;
    if(sucesso&&/atlet/.test(nome)){t.movimentoBonusLab=Math.max(0,Number(t.movimentoBonusLab||0))+9;efeito=' · Corrida: ganha 9 m de deslocamento adicional nesta oportunidade.';}
    else if(sucesso&&/percep|observ|vigil|sentid/.test(nome)){t.bonusPercepcaoLab=1;efeito=' · Percepção: vantagem informacional até o fim desta oportunidade (base para ocultação/furtividade).';}
    else if(sucesso&&/furtiv|stealth/.test(nome)){t.furtivoLab=true;efeito=' · Furtividade: estado furtivo provisório ativado; será confrontado por Percepção quando implementarmos linha de visão.';}
    else if(sucesso&&/forca|força|muscul|briga/.test(nome)){t.bonusForcaLab=1;efeito=' · Esforço físico bem-sucedido; pode ser usado pelo mestre para empurrar, romper ou escapar de agarrões.';}
    const resultadoTeste=`Teste: ${getNome(per)} ${roll}/${valor} → ${r.grau}${bonusInt?` · Intuição +${bonusInt}%`:''}${bonusMente?` · Mente Acelerada +${bonusMente}%`:''}${efeito}.`;
    labRegistrarResultadoProprio_(t,resultadoTeste);labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${t.nome}: ${resultadoTeste}`});if(labEstado_.logLab.length>120)labEstado_.logLab.length=120;
    try{somDado_();if(r.grau==='Crítico')somCritico_();else if(r.grau==='Fiasco')somFiasco_();}catch(_){}
    labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();
};
function labResultadoPrivadoDoUsuario_(){
    if(batalhaEhMestre_())return null;const uid=String(currentUserUid||currentUser?.uid||'');
    const meus=(labEstado_.tokens||[]).filter(t=>String(t.donoUid||'')===uid);if(!meus.length)return null;
    const atual=labTokenAtual_();return meus.find(t=>String(t.id)===String(atual?.id))||meus.find(t=>t.ultimoResultadoProprioLab||t.ultimoResultadoRecebidoLab)||meus[0];
}
let labUltimoResultadoNotificado_='';
let labResultadoPrivadoInicializado_=false;
function labRenderResultadoPrivado_(){
    if(labReducing_)return;
    const el=document.getElementById('labPlayerPrivateResult');if(!el)return;
    if(batalhaEhMestre_()){el.style.display='none';el.innerHTML='';return;}
    const t=labResultadoPrivadoDoUsuario_();
    const proprio=String(t?.ultimoResultadoProprioLab||''),recebido=String(t?.ultimoResultadoRecebidoLab||'');
    const txt=proprio||recebido||'';
    const ts=proprio?Number(t?.ultimoResultadoProprioTsLab||0):Number(t?.ultimoResultadoRecebidoTsLab||0);
    const assinatura=`${proprio?'P':'R'}|${ts}|${txt}`;
    if(!txt){
        el.style.display='none';el.innerHTML='';
        if(!labResultadoPrivadoInicializado_)labResultadoPrivadoInicializado_=true;
        return;
    }
    el.style.display='block';
    el.innerHTML=`<b>🎲 Seu último resultado:</b> ${escaparHtmlInventario_(txt)}`;
    // Ao carregar/recarregar a página, apenas mostra o último resultado salvo.
    // Toast só é disparado para um resultado novo surgido durante esta sessão.
    if(!labResultadoPrivadoInicializado_){
        labResultadoPrivadoInicializado_=true;
        labUltimoResultadoNotificado_=assinatura;
        return;
    }
    if(assinatura!==labUltimoResultadoNotificado_){
        labUltimoResultadoNotificado_=assinatura;
        notificar_(`🎲 ${txt}`,'info',6500);
    }
}
function labRegistrarResultadoProprio_(t,texto){
    if(!t)return;const msg=String(texto||'');t.ultimoResultadoProprioLab=msg;t.ultimoResultadoProprioTsLab=Date.now();
    t.historicoPrivadoLab=Array.isArray(t.historicoPrivadoLab)?t.historicoPrivadoLab:[];
    if(msg)t.historicoPrivadoLab.unshift({ts:new Date().toLocaleTimeString(),texto:msg});
    if(t.historicoPrivadoLab.length>60)t.historicoPrivadoLab.length=60;
}
function labRenderHistoricoMesa_(){
    if(labReducing_)return;
    const el=document.getElementById('labHistoricoMesa');if(!el)return;
    let linhas=[];
    if(batalhaEhMestre_()){
        linhas=(labEstado_.logLab||[]).slice(0,45).map(x=>({ts:x.ts||'',texto:x.texto||''}));
        for(const t of (labEstado_.tokens||[]))for(const h of (t.historicoPrivadoLab||[]).slice(0,12))linhas.push({ts:h.ts||'',texto:`${t.nome}: ${h.texto||''}`});
    }else{
        const t=labResultadoPrivadoDoUsuario_();linhas=(t?.historicoPrivadoLab||[]).slice(0,45);
    }
    if(!linhas.length){el.style.display='none';el.innerHTML='';return;}
    el.style.display='block';
    el.innerHTML=`<div style="font-weight:800;color:#9ee7ff;margin-bottom:7px;">📜 ${batalhaEhMestre_()?'Histórico da Mesa':'Seu histórico'}</div>${linhas.map(h=>`<div style="padding:5px 0;border-top:1px solid rgba(255,255,255,.07);font-size:.84em;"><span style="color:#8197b8;margin-right:7px;">${escaparHtmlInventario_(h.ts||'')}</span>${escaparHtmlInventario_(h.texto||'')}</div>`).join('')}`;
}
function labPsiMax_(t){const c=labCharToken_(t)||t?.charLab;return c?Math.max(0,pontosMagiaMax_(c)):0;}
function labPsiRestantes_(t){return Math.max(0,labPsiMax_(t)-Math.max(0,Number(t?.psiGastosLab||0)));}
function labPsiPoderes_(t){
    const c=labCharToken_(t)||t?.charLab;if(!c)return [];
    const permitidos=Array.isArray(c.poderesPsiIds)&&c.poderesPsiIds.length?new Set(c.poderesPsiIds.map(String)):null;
    return (poderesPsiDB||[]).filter(p=>{const treino=treinoPsiEsfera_(c,p.esfera),arco=arcoPsiPorTreino_(treino);return treino>0&&Number(p.arco||1)<=arco&&(!permitidos||permitidos.has(String(p.id)));}).map(p=>p.id==='aceleracao'?{...p,custo:4}:p)
      .sort((a,b)=>String(a.esfera).localeCompare(String(b.esfera))||Number(a.arco||1)-Number(b.arco||1)||getNome(a).localeCompare(getNome(b)));
}
function labPsiValor_(t,poder){
    const c=labCharToken_(t)||t?.charLab;if(!c||!poder)return 0;const ach=encontrarEspecializacaoPsi_(c,poder.esfera);if(!ach)return 0;
    const esp=(especializacoesDB||[]).find(e=>e.id===ach.id)||{id:ach.id,nome:`Psiquismo (${poder.esfera})`,__especializacao:true};
    const bruto=obterValorRegistroPericia_(c,ach.id,true),arm=valorPericiaComArmadura_(c,esp,bruto);
    const extra=batalhaPenalidadeFerimento_(c,esp)+batalhaPenalidadeCaido_(c)+batalhaPenalidadeInfeccao_(c);
    return Math.max(0,Number(aplicarDificuldadeEFadiga_(c,arm.valor,'padrao',extra).valor||0));
}
window.labAbrirPsi_=function(){
    const t=labTokenAtual_();if(!t||t.primeirosSocorrosLab)return;t.microModoLab='psi';const todos=labPsiPoderes_(t),poderes=todos.filter(p=>labPsiAlvos_(t,p).some(x=>String(x.id)===String(t.id)));if(!poderes.length){notificar_('Não há poder psíquico aplicável diretamente a si mesmo. Selecione um alvo no mapa para ver poderes contextuais.','aviso');return;}
    const p=poderes[0];t.acaoAuxLab={tipo:'psiquismo',poderId:p.id,alvoId:String(t.id),custo:Math.max(0,Number(p.custo||0)),local:''};labSalvarLocal_();labRender_();
};

function labPsiAlvoPorId_(id){return labTokenPorId_(id)||labObjetoPorId_(id)||null;}
function labPsiAlvos_(t,p){
    if(!t||!p)return [];
    if(p.id==='mover_objeto'||p.id==='localizar_psi'||p.id==='psicometria')return (labEstado_.objetosLab||[]).filter(o=>!o.destruido);
    if(p.id==='ilusao')return [...(labEstado_.tokens||[]),...(labEstado_.objetosLab||[]).filter(o=>!o.destruido)];
    if(['teletransporte','salto','meditacao_psi','meditacao_batalha','reflexos','fluxo_marcial','agilidade_psi','aceleracao','ocultar_mente','mente_acelerada','circulo_protecao','defesa_mental','mimetismo_psi','anoitecer'].includes(p.id))return [t,...(p.id==='mimetismo_psi'?[...(labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t.id)),...(labEstado_.objetosLab||[]).filter(o=>!o.destruido)]:[])];
    if(['impulso','amizade','medo','controlar_mente','influenciar_mente','ler_mente','atordoar_psi','empatia'].includes(p.id))return (labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t.id));
    return [t,...(labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t.id))];
}
function labPsiEhObjeto_(x){return !!x&&String(x.id||'').startsWith('obj:');}
function labObjetoPesoKg_(o){return Math.max(.1,Number(o?.pesoKg||Math.max(1,Number(o?.larguraM||1)*Number(o?.alturaM||1)*20)));}
function labPsiMoverCustoKg_(p,o){if(p?.id!=='mover_objeto'||!o)return Math.max(0,Number(p?.custo||0));const base=Math.max(0,Number(p?.custo||3)),kg=labObjetoPesoKg_(o);return base+Math.max(0,Math.ceil(Math.log2(Math.max(1,kg/80))));}
function labPsiMoverCapacidadeKg_(p,gasto){const base=Math.max(0,Number(p?.custo||3)),extra=Math.max(0,Math.floor(Number(gasto||0))-base);return 80*Math.pow(2,extra);}
function labPsiEhCura_(p){return p?.id==='cura_psi'||normalizarTextoCombate_(getNome(p)||'')==='cura';}
function labPsiCuraFalta_(alvo,local){
    const st=labGarantirSnapshotCombate_(alvo);if(!st||!local)return 0;
    return Math.max(0,Number(st.hitMax?.[local]||0)-Number(st.hit?.[local]??st.hitMax?.[local]??0));
}
function labPsiCuraLimite_(t,p,alvo,local){
    const min=Math.max(0,Number(p?.custo||0)),rest=labPsiRestantes_(t),falta=labPsiCuraFalta_(alvo,local);
    if(falta<=0)return 0;
    return Math.max(min,Math.min(rest,falta));
}
function labPsiAjustarCura_(t){
    const a=t?.acaoAuxLab;if(!t||a?.tipo!=='psiquismo')return;
    const p=labPsiPoderes_(t).find(x=>x.id===a.poderId);if(!labPsiEhCura_(p))return;
    const alvo=labTokenPorId_(a.alvoId)||t,feridas=labFeridasTrataveis_(alvo);
    if(!feridas.some(x=>x.local===a.local))a.local=feridas[0]?.local||'';
    const lim=labPsiCuraLimite_(t,p,alvo,a.local),min=Math.max(0,Number(p?.custo||0));
    if(lim<=0)a.custo=min;
    else a.custo=Math.max(min,Math.min(lim,Math.floor(Number(a.custo||min))));
}
window.labPsiSelecionarPoder_=function(v){const t=labTokenAtual_();if(!t?.acaoAuxLab)return;const p=labPsiPoderes_(t).find(x=>x.id===String(v||''));if(!p)return;t.acaoAuxLab.poderId=p.id;t.acaoAuxLab.custo=Math.max(0,Number(p.custo||0));t.acaoAuxLab.local='';const alvos=labPsiAlvos_(t,p);if(!alvos.some(x=>String(x.id)===String(t.acaoAuxLab.alvoId)))t.acaoAuxLab.alvoId='';if(!t.acaoAuxLab.alvoId&&alvos.length===1&&String(alvos[0].id)===String(t.id))t.acaoAuxLab.alvoId=String(t.id);labPsiAjustarCura_(t);t.psiSelecaoLab=JSON.parse(JSON.stringify(t.acaoAuxLab));labSalvarLocal_();labRender_();};
window.labPsiSelecionarAlvo_=function(v){const t=labTokenAtual_();if(t?.acaoAuxLab){t.acaoAuxLab.alvoId=String(v||'');const p=labPsiPoderes_(t).find(x=>x.id===t.acaoAuxLab.poderId),alvo=labPsiAlvoPorId_(t.acaoAuxLab.alvoId);if(p?.id==='mover_objeto'&&alvo)t.acaoAuxLab.custo=Math.max(Number(t.acaoAuxLab.custo||0),labPsiMoverCustoKg_(p,alvo));}labPsiAjustarCura_(t);t.psiSelecaoLab=JSON.parse(JSON.stringify(t.acaoAuxLab));labSalvarLocal_();labRender_();};
window.labPsiSelecionarLocal_=function(v){const t=labTokenAtual_();if(t?.acaoAuxLab)t.acaoAuxLab.local=String(v||'');labPsiAjustarCura_(t);t.psiSelecaoLab=JSON.parse(JSON.stringify(t.acaoAuxLab));labSalvarLocal_();labRender_();};
window.labPsiCusto_=function(v){
    const t=labTokenAtual_();if(!t?.acaoAuxLab)return;
    t.acaoAuxLab.custo=Math.max(0,Math.floor(Number(v)||0));labPsiAjustarCura_(t);labSalvarLocal_();labRender_();
};
function labPsiEmpurrar_(origem,alvo,metros=5){let dx=Number(alvo.x||0)-Number(origem.x||0),dy=Number(alvo.y||0)-Number(origem.y||0),d=Math.hypot(dx,dy);if(d<.01){dx=0;dy=1;d=1;}alvo.x=Math.max(0,Math.min(labEstado_.larguraM,Number(alvo.x||0)+dx/d*metros));alvo.y=Math.max(0,Math.min(labEstado_.alturaM,Number(alvo.y||0)+dy/d*metros));}
function labUsarPsiExecutar_(){
    const t=labTokenAtual_(),a=t?.acaoAuxLab;if(!t||a?.tipo!=='psiquismo'||Number(t.acoesAtuaisLab||0)<=0)return;
    const p=labPsiPoderes_(t).find(x=>x.id===a.poderId),alvo=labPsiAlvoPorId_(a.alvoId)||t;if(!p||!alvo)return;
    const minimoBase=Math.max(0,Number(p.custo||0)),minimo=p.id==='mover_objeto'&&labPsiEhObjeto_(alvo)?labPsiMoverCustoKg_(p,alvo):minimoBase;
    let gasto=Math.max(minimo,Math.floor(Number(a.custo||0)));
    if(labPsiEhCura_(p)){
        labPsiAjustarCura_(t);
        const limite=labPsiCuraLimite_(t,p,alvo,a.local);
        if(limite<=0){notificar_('Escolha uma localização que ainda tenha PV para recuperar.','aviso');return;}
        gasto=Math.min(gasto,limite);
    }
    if(p.id==='meditacao_psi'&&labEstado_.fase==='combate'){notificar_('Meditação exige concentração prolongada e ainda não está liberada durante combate nesta versão. Fora de combate ela será integrada ao modo de exploração.','aviso',5500);return;}
    if(gasto>labPsiRestantes_(t)){notificar_(`PP insuficientes. Disponíveis: ${labPsiRestantes_(t)}.`,'aviso');return;}
    if(p.id==='mover_objeto'&&labPsiEhObjeto_(alvo)&&labObjetoPesoKg_(alvo)>labPsiMoverCapacidadeKg_(p,gasto)+.001){notificar_(`Objeto pesado demais: ${labObjetoPesoKg_(alvo).toFixed(1)} kg. Com ${gasto} PP a capacidade é ${labPsiMoverCapacidadeKg_(p,gasto).toFixed(0)} kg.`,'aviso',5000);return;}
    const valor=labPsiValor_(t,p),roll=1+Math.floor(Math.random()*100),r=classificarD100_(valor,roll);
    if(p.id!=='intuicao_psi')t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);t.psiGastosLab=Math.max(0,Number(t.psiGastosLab||0))+gasto;
    let efeito='O poder não produziu efeito.';
    if(r.grau==='Fiasco'&&labPsiRestantes_(t)>0){t.psiGastosLab++;efeito='Fiasco psíquico: perde 1 PP adicional.';}
    if(batalhaResultadoGradeValor_(r.grau)>=2){
        if(labPsiEhCura_(p)){
            const st=labGarantirSnapshotCombate_(alvo),feridas=labFeridasTrataveis_(alvo);let loc=a.local&&feridas.some(x=>x.local===a.local)?a.local:feridas[0]?.local;
            if(loc){const antes=Number(st.hit?.[loc]||0),max=Number(st.hitMax?.[loc]||0),cura=Math.min(gasto,Math.max(0,max-antes));st.hit[loc]=Math.min(max,antes+cura);labReavaliarFerimento_(alvo,loc);if(cura>0)labAdicionarFloat_(alvo,cura,'cura');efeito=`Cura psíquica restaurou ${cura} PV em ${loc}.`;}else efeito='O alvo não possui ferimento tratável.';
        }else if(p.id==='mover_objeto'){if(!labPsiEhObjeto_(alvo)){efeito='Mover Objeto exige um objeto de cenário como alvo.';}else{const metros=Math.max(2,Math.min(10,2+(gasto-minimo)*2));labPsiEmpurrar_(t,alvo,metros);efeito=`${alvo.nome} (${labObjetoPesoKg_(alvo).toFixed(1)} kg) foi movido telecineticamente cerca de ${metros} m.`;}}
        else if(p.id==='impulso'){if(labPsiEhObjeto_(alvo)){efeito='Impulso exige um ser/alvo corporal, não um objeto de cenário.';}else{labPsiEmpurrar_(t,alvo,5);efeito=`${alvo.nome} foi impulsionado aproximadamente 5 m.`;}}
        else if(p.id==='intuicao_psi'){t.bonusIntuicaoPendenteLab=Math.max(0,Number(t.bonusIntuicaoPendenteLab||0))+gasto;efeito=`Intuição ativa: +${gasto}% acumulado no próximo teste de perícia, inclusive combate.`;}
        else if(p.id==='atordoar_psi'||p.id==='grito_psiquico'){const stA=labGarantirSnapshotCombate_(alvo);stA.atordoado=true;stA.atordoadoAteOportunidade=true;efeito=`${alvo.nome} ficou Atordoado: +1 grau de dificuldade em ações e reações até o fim da próxima oportunidade.`;}
        else if(p.id==='salto'){t.saltoPsiPendenteLab=Math.max(1,10+Math.max(0,gasto-minimo)*2);efeito=`Salto preparado: arraste seu token até ${t.saltoPsiPendenteLab} m na direção desejada antes de encerrar a oportunidade.`;}
        else{
            const pn=normalizarTextoCombate_(`${p.id||''} ${getNome(p)} ${p.esfera||''}`);
            if(/escudo|barreira|protec|defesa/.test(pn)){labGarantirSnapshotCombate_(t).escudoPsi=Math.max(1,gasto);efeito=`Escudo psíquico ativo: ${Math.max(1,gasto)} ponto(s) de proteção psíquica provisória.`;}
            else if(/telepat|mente|mental|ler mente/.test(pn)){labGarantirSnapshotCombate_(alvo).marcadoPsi=true;efeito=`Contato mental estabelecido com ${alvo.nome}; o mestre pode revelar informação compatível com o poder.`;}
            else if(/telecin|telek|empurr|mover/.test(pn)){labPsiEmpurrar_(t,alvo,Math.max(2,Math.min(10,gasto*2)));efeito=`${alvo.nome} foi deslocado telecineticamente ${Math.max(2,Math.min(10,gasto*2))} m.`;}
            else if(/dor|ataque|choque|raio|ferir/.test(pn)){const st=labGarantirSnapshotCombate_(alvo),locs=Object.keys(st.hitMax||{});const loc=locs[Math.floor(Math.random()*Math.max(1,locs.length))];if(loc){const dano=Math.max(1,gasto);st.hit[loc]=Number(st.hit?.[loc]||0)-dano;labReavaliarFerimento_(alvo,loc);labAdicionarFloat_(alvo,-dano,'dano');efeito=`Ataque psíquico causou ${dano} de dano em ${loc}.`;} }
            else efeito=`${getNome(p)} ativado com sucesso; o gasto de PP e o teste já foram aplicados, mas este poder ainda exige adjudicação narrativa do mestre.`;
        }
    }
    if(labPsiEhCura_(p)&&batalhaResultadoGradeValor_(r.grau)<2)efeito=`Falha: ${gasto} PP consumidos e 0 PV recuperados.`;
    const resultadoPsi=`Psiquismo: ${getNome(p)} · ${p.esfera} ${roll}/${valor} → ${r.grau} · gasto ${gasto} PP. ${efeito}`;
    labRegistrarResultadoProprio_(t,resultadoPsi);labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${t.nome}: ${resultadoPsi}`});if(labEstado_.logLab.length>120)labEstado_.logLab.length=120;
    // Mantém o mesmo poder/alvo/local selecionado após o uso.
    t.acaoAuxLab={tipo:'psiquismo',poderId:p.id,alvoId:String(alvo.id),custo:Math.max(0,Number(p.custo||0)),local:a.local||''};
    t.psiSelecaoLab=JSON.parse(JSON.stringify(t.acaoAuxLab));labPsiAjustarCura_(t);
    try{somMagico_();}catch(_){}
    labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();
};
window.labUsarPsi_=function(){
    const t=labTokenAtual_(),a=t?.acaoAuxLab;if(!t||a?.tipo!=='psiquismo')return;
    if(!batalhaEhMestre_()){
        labEnviarComandoJogador_('psiquismo',{poderId:a.poderId,alvoId:a.alvoId,custo:a.custo,local:a.local||''},t).then(ok=>{if(ok)notificar_('Ação psíquica enviada ao mestre.','info',1800);});return;
    }
    labUsarPsiExecutar_();
};
function labTokenPorId_(id){return (labEstado_.tokens||[]).find(t=>String(t.id)===String(id))||null;}
function labFeridasTrataveis_(t){
    const st=labGarantirSnapshotCombate_(t);if(!st||st.morto)return [];
    return Object.keys(st.hitMax||{}).map(local=>({
        local,max:Number(st.hitMax?.[local]||0),atual:Number(st.hit?.[local]??st.hitMax?.[local]??0)
    })).filter(x=>x.atual<x.max);
}
function labPrimeirosSocorrosPericia_(t){
    const c=labCharToken_(t);if(!c)return null;
    return batalhaPrimeirosSocorrosPericia_(c);
}
function labPrimeirosSocorrosValor_(t,dificuldade='padrao'){
    const c=labCharToken_(t),per=labPrimeirosSocorrosPericia_(t);
    if(!c||!per)return {valor:0,nome:'Primeiros Socorros',aj:null};
    const base=obterValorRegistroPericia_(c,per.id,!!per.__especializacao);
    const aj=aplicarDificuldadeEFadiga_(c,base,dificuldade,0);
    return {valor:Math.max(0,Number(aj?.valor||0)),nome:getNome(per)||'Primeiros Socorros',aj};
}
function labTemKitPrimeirosSocorros_(t){
    const c=labCharToken_(t);if(!c)return false;
    try{return !!batalhaKitPrimeirosSocorros_(c);}catch(_){return false;}
}
function labPodePrimeirosSocorros_(t){
    const st=labGarantirSnapshotCombate_(t);
    return !!t&&!String(t.id).startsWith('dummy:')&&!st?.morto&&!st?.inconsciente&&!!labPrimeirosSocorrosPericia_(t);
}
window.labLevantar_=function(){
    if(labEstado_.fase!=='combate'||labEstado_.pendenciaLab||labEstado_.danoPendenteLab)return;
    const t=labTokenAtual_(),st=labGarantirSnapshotCombate_(t);if(!t||!st?.derrubado)return;
    if(t.primeirosSocorrosLab){notificar_('Primeiros Socorros em andamento impedem outra ação proativa.','aviso');return;}
    if(Number(t.acoesAtuaisLab||0)<=0){notificar_('Sem AÇ para levantar.','aviso');return;}
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);st.derrubado=false;
    labEstado_.ultimoResultadoLab=`${t.nome} gastou 1 AÇ e se levantou.`;
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:labEstado_.ultimoResultadoLab});
    labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();
};
window.labAbrirPrimeirosSocorros_=function(){
    const t=labTokenAtual_();if(!labPodePrimeirosSocorros_(t))return;t.microModoLab='socorros';
    if(t.primeirosSocorrosLab)return;
    const alvos=(labEstado_.tokens||[]).filter(x=>labFeridasTrataveis_(x).length&&!labGarantirSnapshotCombate_(x)?.morto);
    if(!alvos.length){notificar_('Não há ferimentos tratáveis no combate.','aviso');return;}
    const atual=alvos.find(x=>String(x.id)===String(t.id))||alvos[0];
    const feridas=labFeridasTrataveis_(atual);
    t.acaoAuxLab={tipo:'primeiros_socorros',alvoId:String(atual.id),local:feridas[0]?.local||''};
    labSalvarLocal_();labRender_();
};
window.labCancelarAcaoAux_=function(){
    const t=labTokenAtual_();if(!t)return;t.acaoAuxLab=null;labSalvarLocal_();labRender_();
};
window.labPSSelecionarAlvo_=function(v){
    const t=labTokenAtual_();if(!t?.acaoAuxLab)return;
    t.acaoAuxLab.alvoId=String(v||'');
    const alvo=labTokenPorId_(t.acaoAuxLab.alvoId),f=labFeridasTrataveis_(alvo);
    t.acaoAuxLab.local=f[0]?.local||'';
    labSalvarLocal_();labRender_();
};
window.labPSSelecionarLocal_=function(v){
    const t=labTokenAtual_();if(!t?.acaoAuxLab)return;t.acaoAuxLab.local=String(v||'');labSalvarLocal_();labRender_();
};
window.labPSIniciar_=function(){
    if(labEstado_.fase!=='combate'||labEstado_.pendenciaLab||labEstado_.danoPendenteLab)return;
    const t=labTokenAtual_();if(!t||!labPodePrimeirosSocorros_(t)||Number(t.acoesAtuaisLab||0)<=0)return;
    const a=t.acaoAuxLab,alvo=labTokenPorId_(a?.alvoId);
    if(!a||!alvo||!labFeridasTrataveis_(alvo).some(x=>x.local===a.local)){
        notificar_('Escolha um alvo e uma localização ferida.','aviso');return;
    }
    if(String(alvo.id)!==String(t.id)&&labDistanciaEntre_(t,alvo)>1.5){
        notificar_(`Primeiros Socorros exige proximidade. Aproxime-se de ${alvo.nome} até 1,5 m.`,'aviso');return;
    }
    t.psSelecaoLab=JSON.parse(JSON.stringify(a));
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);
    t.primeirosSocorrosLab={alvoId:String(alvo.id),alvoNome:alvo.nome,local:a.local,turnosInvestidos:1};
    t.acaoAuxLab=null;
    labEstado_.ultimoResultadoLab=`${t.nome} iniciou Primeiros Socorros em ${alvo.nome} (${a.local}). A oportunidade termina; na próxima poderá concluir ou continuar.`;
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:labEstado_.ultimoResultadoLab});
    labSalvarLocal_();labRender_();
    0;
};
window.labPSContinuar_=function(){
    const t=labTokenAtual_(),ps=t?.primeirosSocorrosLab;if(!t||!ps||Number(t.acoesAtuaisLab||0)<=0)return;
    const alvo=labTokenPorId_(ps.alvoId);if(alvo&&String(alvo.id)!==String(t.id)&&labDistanciaEntre_(t,alvo)>1.5){notificar_('Você se afastou do paciente. Volte a até 1,5 m para continuar o atendimento.','aviso');return;}
    const n=Math.max(1,Number(ps.turnosInvestidos||1));if(n>=3)return;
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);ps.turnosInvestidos=n+1;
    labEstado_.ultimoResultadoLab=`${t.nome} continuou Primeiros Socorros em ${ps.alvoNome} (${ps.local}). Tempo: ${ps.turnosInvestidos}/3 turnos.`;
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:labEstado_.ultimoResultadoLab});
    labSalvarLocal_();labRender_();
    0;
};
function labReavaliarFerimento_(t,local){
    const st=labGarantirSnapshotCombate_(t);if(!st)return;
    const max=Math.max(1,Number(st.hitMax?.[local]||1)),at=Number(st.hit?.[local]??max);
    if(at>max/2){delete st.ferimentos?.[local];delete st.resistenciaFerimentos?.[local];}
    else if(at<=0){
        st.ferimentos=st.ferimentos||{};st.ferimentos[local]='Grave';
        if(/Cabeça|Peito|Abdômen/.test(local)){st.morto=true;st.inconsciente=false;}
    }else{
        st.ferimentos=st.ferimentos||{};st.ferimentos[local]='Sério';
    }
}
window.labPSConcluir_=function(){
    const t=labTokenAtual_(),ps=t?.primeirosSocorrosLab;if(!t||!ps||Number(t.acoesAtuaisLab||0)<=0)return;
    const alvo=labTokenPorId_(ps.alvoId),st=labGarantirSnapshotCombate_(alvo);
    if(!alvo||!st||st.morto){t.primeirosSocorrosLab=null;labSalvarLocal_();labRender_();notificar_('O alvo não pode mais receber este atendimento.','aviso');return;}
    if(String(alvo.id)!==String(t.id)&&labDistanciaEntre_(t,alvo)>1.5){notificar_('Você precisa estar a até 1,5 m do paciente para concluir Primeiros Socorros.','aviso');return;}
    const max=Math.max(1,Number(st.hitMax?.[ps.local]||1)),atual=Number(st.hit?.[ps.local]??max);
    const kit=labTemKitPrimeirosSocorros_(t),turnos=Math.max(1,Math.min(3,Number(ps.turnosInvestidos||1)));
    const dif=kit?(turnos>=3?'muito_facil':turnos===2?'facil':'padrao'):'padrao';
    const info=labPrimeirosSocorrosValor_(t,dif),roll=1+Math.floor(Math.random()*100),r=classificarD100_(info.valor,roll);
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);
    try{somDado_();if(r.grau==='Crítico')somMagico_();else if(r.grau==='Fiasco')somFiasco_();}catch(_){}
    let res='Falha: nenhum benefício.';
    if(r.grau==='Fiasco'){
        st.hit[ps.local]=atual-1;labReavaliarFerimento_(alvo,ps.local);res='Fiasco: +1 de dano na localização.';
    }else if(batalhaResultadoGradeValor_(r.grau)>=2){
        st.sangrando=false;st.tratados=st.tratados||{};
        if(r.grau==='Crítico'){
            const ganho=Math.max(0,max-atual);st.hit[ps.local]=max;if(ganho>0)labAdicionarFloat_(alvo,ganho,'cura');delete st.ferimentos?.[ps.local];delete st.tratados?.[ps.local];
            if(/Cabeça|Peito|Abdômen/.test(ps.local))st.inconsciente=false;
            res=`Crítico: ${ps.local} restaurado totalmente.`;
        }else if(atual>0){
            const cura=1+Math.floor(Math.random()*3),real=Math.min(cura,max-atual);
            st.hit[ps.local]=Math.min(max,atual+cura);if(real>0)labAdicionarFloat_(alvo,real,'cura');res=`Recuperou ${real} PV.`;
        }else if(atual>-max){
            st.tratados[ps.local]=true;
            if(/Cabeça|Peito|Abdômen/.test(ps.local))st.inconsciente=false;
            res='Ferimento Sério estabilizado; nenhuma recuperação imediata de PV.';
        }else{
            st.tratados[ps.local]=true;res='Ferimento Grave estabilizado; nenhuma recuperação imediata de PV.';
        }
        labReavaliarFerimento_(alvo,ps.local);
        if(st.tratados?.[ps.local]&&/Cabeça|Peito|Abdômen/.test(ps.local)&&!st.morto)st.inconsciente=false;
    }
    const resultadoPS=`${t.nome}: Primeiros Socorros em ${alvo.nome} (${ps.local}) ${roll}/${info.valor} → ${r.grau}. ${res} ${kit?'Com kit':'Sem kit'} · tempo ${turnos}/3.`;
    labEstado_.ultimoResultadoLab=resultadoPS;
    labRegistrarResultadoProprio_(t,resultadoPS.replace(`${t.nome}: `,''));
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:resultadoPS});
    t.primeirosSocorrosLab=null;
    if(t.microModoLab==='socorros'&&t.psSelecaoLab)t.acaoAuxLab=JSON.parse(JSON.stringify(t.psSelecaoLab));
    labSalvarLocal_();labRender_();
    0;
};
function labEfeitosQuantidade_(grauAtaque,grauDefesa='Falha',semDefesa=false){
    const ag=batalhaResultadoGradeValor_(grauAtaque);
    const dg=semDefesa?1:batalhaResultadoGradeValor_(grauDefesa);
    return ag>=2?Math.max(0,ag-dg):0;
}
function labAtaqueEhDistancia_(item){
    if(!item)return false;
    if(item.natural===true){
        const a=Number(item.alcanceMetros||0);
        return a>4;
    }
    const alc=Number(item.alcance||item.alcanceMetros||0);
    if(alc>4)return true;
    if(String(item.municao||'').trim())return true;
    const txt=normalizarTextoCombate_(`${item.categoria||''} ${item.tipo||''} ${getNome(item)||item.nome||''}`);
    return /laser|rifle|pistola|fuzil|carabina|arco|arremesso|blaster|distancia|projetil/.test(txt);
}
function labPodeDerrubar_(pend){
    if(!pend)return false;
    const atacante=(labEstado_.tokens||[]).find(t=>String(t.id)===String(pend.atacanteId));
    const defensor=(labEstado_.tokens||[]).find(t=>String(t.id)===String(pend.defensorId));
    if(!atacante||!defensor)return false;
    const item=pend.item||{},txtItem=normalizarTextoCombate_(`${getNome(item)||item.nome||''} ${item.propriedades||item.tags||''}`);
    // Ataques à distância comuns não derrubam. Armas com propriedade explícita de impacto
    // poderão fazê-lo quando forem cadastradas.
    if(labAtaqueEhDistancia_(item) && !/derrubar|impacto|concuss|knockdown|bash/.test(txtItem))return false;
    const a=labCharToken_(atacante),d=labCharToken_(defensor);
    const tamA=Number(a?.atributos?.TAM||atacante?.attrs?.TAM||10);
    const tamD=Number(d?.atributos?.TAM||defensor?.attrs?.TAM||10);
    const modeloD=defensor?.criaturaBancoId?criaturaBancoPorId_(defensor.criaturaBancoId):null;
    const nomeD=normalizarTextoCombate_(`${defensor.nome||''} ${d?.especie||''} ${d?.tipo||''} ${modeloD?.habilidadesTexto||d?.habilidadesTexto||''}`);
    if(/imune_derrubar|sessil|cila/.test(nomeD))return false;
    const robusto=/besta_ululante|dragao|quadrup|muito_grande|enorme|colossal|titan|robusto/.test(nomeD);
    const critico=batalhaResultadoGradeValor_(pend.grauAtaque)>=3;
    const limite=robusto?(critico?1.50:1.10):(critico?2.0:1.5);
    return tamD<=Math.max(1,tamA*limite);
}

function labAtaquePodeSangrar_(pend){
    if(!pend?.item)return false;
    const item=pend.item||{};
    const nome=getNome(item)||item.nome||'';
    const proxy={
        equipamento:nome,
        familia:`${item.familia||''} ${item.categoria||''} ${item.tipo||''} ${item.propriedades||''}`,
        grau:pend.grauAtaque
    };
    // Reuse the established Mesa Estelar rule:
    // laser/plasma/blaster/energia/vibro cauterize and cannot cause Sangrar.
    return batalhaArmaPodeSangrar_(proxy);
}
function labEfeitosDisponiveis_(pend){
    if(!pend)return [];
    const critico=batalhaResultadoGradeValor_(pend.grauAtaque)>=3;
    const out=[];
    // In Mesa Estelar, ranged attacks may choose a hit location only on a
    // Critical. Melee attacks retain normal access when a special effect is earned.
    if(!labAtaqueEhDistancia_(pend.item)||critico)out.push({id:'escolher_localizacao',nome:'🎯 Escolher Localização'});
    if(labAtaquePodeSangrar_(pend))out.push({id:'sangrar',nome:'🩸 Sangrar'});
    if(labPodeDerrubar_(pend))out.push({id:'derrubar',nome:'💥 Derrubar'});
    if(critico)out.push({id:'contornar_armadura',nome:'🛡️ Contornar Armadura'});
    const defensor=(labEstado_.tokens||[]).find(t=>String(t.id)===String(pend.defensorId)),c=labCharToken_(defensor);
    if(c&&obterItensEquipados_(c).some(itemEhArmaOuEscudo_))out.push({id:'danificar_arma',nome:'⚔️ Danificar Arma'});
    return out;
}
window.labEscolherEfeito_=function(id){
    const dp=labEstado_.danoPendenteLab;if(!dp||Number(dp.efeitosRestantes||0)<=0)return;
    const efeito=String(id||'');
    if(efeito==='escolher_localizacao'){dp.escolhendoLocalizacao=true;labSalvarLocal_();labRender_();return;}
    dp.efeitosEscolhidos=Array.isArray(dp.efeitosEscolhidos)?dp.efeitosEscolhidos:[];
    if(efeito==='contornar_armadura')dp.ignorarArmadura=true;
    if(efeito==='sangrar')dp.aplicarSangrar=true;
    if(efeito==='derrubar')dp.aplicarDerrubar=true;
    if(efeito==='danificar_arma')dp.danificarArma=true;
    dp.efeitosEscolhidos.push(efeito);dp.efeitosRestantes=Math.max(0,Number(dp.efeitosRestantes||0)-1);
    labSalvarLocal_();labRender_();
    if(Number(dp.efeitosRestantes||0)<=0){
        0;
    }
};
window.labConfirmarLocalizacao_=function(loc){
    const dp=labEstado_.danoPendenteLab;if(!dp||!dp.escolhendoLocalizacao)return;
    dp.localForcada=String(loc||'');dp.escolhendoLocalizacao=false;
    dp.efeitosEscolhidos=Array.isArray(dp.efeitosEscolhidos)?dp.efeitosEscolhidos:[];
    dp.efeitosEscolhidos.push('escolher_localizacao');dp.efeitosRestantes=Math.max(0,Number(dp.efeitosRestantes||0)-1);
    labSalvarLocal_();labRender_();
    if(Number(dp.efeitosRestantes||0)<=0){
        0;
    }
};
window.labPularEfeitos_=function(){
    const dp=labEstado_.danoPendenteLab;if(!dp)return;
    dp.efeitosRestantes=0;dp.escolhendoLocalizacao=false;labSalvarLocal_();labRender_();
    0;
};
window.labResponderDefesa_=function(defender=true){
    const pend=labEstado_.pendenciaLab;if(!pend)return;
    const defensor=labTokenPorId_(pend.defensorId),atacante=labTokenPorId_(pend.atacanteId);
    if(!defensor||!atacante){labEstado_.pendenciaLab=null;labSalvarLocal_();labRender_();return;}
    let dg=1,txtPublico='Não defendeu',grauDef='Falha',rollDef=null,valorDef=null,per=null;
    if(defender){
        if(Number(defensor.acoesAtuaisLab||0)<=0&&Number(defensor.acoesDefensivasPsiLab||0)<=0){notificar_(`${defensor.nome} não possui AÇ para defender.`,'aviso');return;}
        const c=labCharToken_(defensor),defs=labDefesasDisponiveis_(defensor);
        if(!defs.length){notificar_('Nenhuma defesa disponível.','aviso');return;}
        if(!defs.some(p=>batalhaTokenPericia_(p)===defensor.defesaLab))defensor.defesaLab=batalhaTokenPericia_(defs[0]);
        per=labPericiaPorToken_(defensor,defensor.defesaLab);
        const bonusInt=Math.max(0,Number(defensor.bonusIntuicaoPendenteLab||0)),bonusMente=Number(defensor.menteAceleradaCargasLab||0)>0&&/INT/.test(String(per.formula||''))?Math.max(0,Number(defensor.menteAceleradaBonusLab||20)):0;valorDef=labValorDefesa_(c,per)+bonusMente;rollDef=1+Math.floor(Math.random()*100);
        const r=classificarD100_(valorDef,rollDef);if(bonusInt>0)defensor.bonusIntuicaoPendenteLab=0;if(defensor.luckPrepared)defensor.luckPrepared=false;if(bonusMente>0)defensor.menteAceleradaCargasLab=Math.max(0,Number(defensor.menteAceleradaCargasLab||0)-1);if(defensor.bonusDificuldadeFacilPsiLab)defensor.bonusDificuldadeFacilPsiLab=0;labSomDefesa_();
        dg=batalhaResultadoGradeValor_(r.grau);grauDef=r.grau;
        const usouDefPsi=Number(defensor.acoesDefensivasPsiLab||0)>0;if(usouDefPsi)defensor.acoesDefensivasPsiLab=Math.max(0,Number(defensor.acoesDefensivasPsiLab||0)-1);else defensor.acoesAtuaisLab=Math.max(0,Number(defensor.acoesAtuaisLab||0)-1);if(r.grau==='Crítico'){if(usouDefPsi)defensor.acoesDefensivasPsiLab++;else defensor.acoesAtuaisLab=Math.min(Number(defensor.acoesMaxLab||0)+6,Number(defensor.acoesAtuaisLab||0)+1);}else if(r.grau==='Fiasco'){if(Number(defensor.acoesAtuaisLab||0)>0)defensor.acoesAtuaisLab--;else defensor.penalidadeAcaoProximaLab=Math.max(1,Number(defensor.penalidadeAcaoProximaLab||0));}
        labRegistrarResultadoProprio_(defensor,`Defesa contra ${atacante.nome}: ${getNome(per)} ${rollDef}/${valorDef} → ${r.grau}${bonusInt?` · Intuição +${bonusInt}%`:''}${bonusMente?` · Mente Acelerada +${bonusMente}%`:''}.`);
        txtPublico=`${getNome(per)}: ${r.grau}`;
    }

    const ag=batalhaResultadoGradeValor_(pend.grauAtaque);
    const nomeDef=normalizarTextoCombate_(per?.id||getNome(per)||'');
    const ehEsquiva=defender&&nomeDef.includes('esquiva');
    let acertou=false;

    if(!defender){
        acertou=ag>=2;
    }else if(ehEsquiva){
        if(ag>dg)acertou=true;
        else if(ag<dg)acertou=false;
        else if(ag>=2&&dg>=2){
            // Mesa Estelar house rule: same success level -> larger success margin wins.
            // Exact margin tie -> higher skill value wins; exact tie again favours defender.
            const margemAtaque=Number(pend.valorAtaque||0)-Number(pend.rolagemAtaque||0);
            const margemDefesa=Number(valorDef||0)-Number(rollDef||0);
            if(margemAtaque!==margemDefesa)acertou=margemAtaque>margemDefesa;
            else if(Number(pend.valorAtaque||0)!==Number(valorDef||0))acertou=Number(pend.valorAtaque||0)>Number(valorDef||0);
            else acertou=false;
        }else{
            acertou=ag>=2;
        }
    }else{
        // Parry remains a differential defence. Equal success level does not make
        // the attack vanish; weapon-size damage reduction is the next refinement.
        acertou=ag>=2&&ag>=dg;
    }

    if(acertou&&defender&&Number(defensor.acoesDefensivasPsiLab||0)>0){
        pend.tentativasDefesaPsi=Math.max(1,Number(pend.tentativasDefesaPsi||0)+1);labEstado_.ultimoResultadoLab=`${defensor.nome} ainda foi superado, mas Guerreiro Inexpugnável permite tentar outra defesa (${defensor.acoesDefensivasPsiLab} AÇ defensiva(s) restantes).`;labRegistrarResultadoProprio_(defensor,labEstado_.ultimoResultadoLab);labSalvarLocal_();labRender_();return;
    }
    if(acertou){
        const qtd=labEfeitosQuantidade_(pend.grauAtaque,grauDef,!defender);
        labEstado_.danoPendenteLab={...pend,defesaTexto:txtPublico,grauDefesa:grauDef,rolagemDefesa:rollDef,valorDefesa:valorDef,
            defesaTipo:ehEsquiva?'esquiva':(defender?'aparar':'nenhuma'),efeitosRestantes:qtd,efeitosEscolhidos:[],danoAutomatico:false};
        atacante.ultimoResultadoProprioLab=`Ataque contra ${defensor.nome}: ${pend.pericia} ${pend.rolagemAtaque}/${pend.valorAtaque} → ${pend.grauAtaque}. ${ehEsquiva?`Defesa adversária: ${grauDef}. `:''}Ataque atingiu o alvo.${qtd?` ${qtd} efeito(s) especial(is).`:''}`;
        labEstado_.ultimoResultadoLab=`${atacante.nome} atingiu ${defensor.nome}.${qtd?` ${qtd} efeito(s) especial(is) disponível(is).`:''}`;
    }else{
        labEstado_.danoPendenteLab=null;
        atacante.ultimoResultadoProprioLab=`Ataque contra ${defensor.nome}: ${pend.pericia} ${pend.rolagemAtaque}/${pend.valorAtaque} → ${pend.grauAtaque}. O alvo evitou o golpe.`;
        labEstado_.ultimoResultadoLab=`${defensor.nome} evitou o ataque.`;
    }
    labEstado_.pendenciaLab=null;
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:labEstado_.ultimoResultadoLab});
    labEstado_.logLab=labEstado_.logLab.slice(0,60);
    labSalvarLocal_();labRender_();
    if(!labEstado_.danoPendenteLab)labAutoAvancarSeSemAcoes_();
};
function labExpressaoDano_(atacante,item){
    let expr=String(item?.dano||'').trim();
    if(!expr)return '';
    if(/MD/i.test(expr)){
        const c=labCharToken_(atacante),a=c?.atributos||{},b=c?.bonus||{};
        const mod=String(calcularModDano(Number(a.FOR||0)+Number(b.FOR||0),Number(a.TAM||0)+Number(b.TAM||0))||'0').trim();
        expr=expr.replace(/\+?MD/ig,mod&&mod!=='0'&&mod!=='+0'?(mod.startsWith('+')||mod.startsWith('-')?mod:`+${mod}`):'');
    }
    return expr;
}

function labLocalizacaoD20_(){
    const roll=1+Math.floor(Math.random()*20);
    let local='Cabeça';
    if(roll<=3)local='Perna Direita';
    else if(roll<=6)local='Perna Esquerda';
    else if(roll<=9)local='Abdômen';
    else if(roll<=12)local='Peito';
    else if(roll<=15)local='Braço Direito';
    else if(roll<=18)local='Braço Esquerdo';
    return {roll,local};
}

function labPenalidadeFerimentoLab22_(t,per){
    if(!t||!per)return 0;
    const st=labGarantirSnapshotCombate_(t),fs=st?.ferimentos||{};
    const ehSerio=loc=>{
        const v=fs?.[loc];
        return !!(v==='Sério'||v==='Grave'||v?.serio||v?.grave);
    };
    let deg=0;
    const id=normalizarTextoCombate_(per.id||'');
    const nome=normalizarTextoCombate_(getNome(per)||'');
    const ofensiva=periciaEhOfensiva_(per);

    if(ehSerio('Cabeça')||ehSerio('Peito')||ehSerio('Abdômen'))deg=Math.max(deg,1);
    if(ofensiva){
        deg+=Number(ehSerio('Braço Direito'))+Number(ehSerio('Braço Esquerdo'));
    }
    if(id.includes('esquiva')||id.includes('atlet')||nome.includes('atlet')){
        deg+=Number(ehSerio('Perna Direita'))+Number(ehSerio('Perna Esquerda'));
    }
    return Math.min(2,deg);
}

function labRolarResistenciaFerimento22_(defensor,opcoes={}){
    const c=labCharToken_(defensor);
    if(!c)return {passou:false,roll:100,valor:0,grau:'Falha',pericia:'Resistência'};
    if(Number.isFinite(opcoes.valorAtaque)){
        const per=batalhaPericiaPorNomes_(c,['resistência','resistencia','endurance']);
        const valor=per?novaValorPericiaTotal_(c,per):0,r=testeComSorte(defensor,valor,max=>1+Math.floor(Math.random()*max)),roll=r.die;
        return {passou:r.sucesso&&!ataqueSuperaDefesa({grau:opcoes.grauAtaque,valor:opcoes.valorAtaque,die:opcoes.rolagemAtaque},{grau:r.grau,valor,die:roll}),roll,valor,grau:r.grau,sorte:!!r.sorte,pericia:'Resistência'};
    }
    return batalhaRolarResistenciaFerimento_(c,{
        grau:String(opcoes.grauAtaque||'Sucesso'),
        rolagem:Number(opcoes.rolagemAtaque||100)
    });
}

function labAplicarDanoLocal_(defensor,total,item,opcoes={}){
    const st=labGarantirSnapshotCombate_(defensor);
    if(!st)return null;

    const locs=Object.keys(st.hitMax||{});
    let roll=null,local='';

    if(locs.length===1&&locs[0]==='PV Global'){
        local='PV Global';
    }else if(opcoes.localForcada&&locs.includes(opcoes.localForcada)){
        local=opcoes.localForcada;
    }else{
        const lr=labLocalizacaoD20_();
        roll=lr.roll;local=lr.local;
        if(!locs.includes(local))local=locs[Math.floor(Math.random()*locs.length)];
    }

    const antes=Number(st.hit?.[local]??st.hitMax?.[local]??0);
    const pa=Math.max(0,Number(st.armor?.[local]||0));
    const pen=Math.max(0,Number(obterPenetracaoArma_(item)||0));
    const paEf=opcoes.ignorarArmadura?0:Math.max(0,pa-pen);
    const final=Math.max(0,Number(total||0)-paEf);
    const depois=antes-final;

    st.hit[local]=depois;
    st.ferimentos=st.ferimentos||{};
    st.resistenciaFerimentos=st.resistenciaFerimentos||{};
    st.membrosInuteis=st.membrosInuteis||{};

    const max=Math.max(1,Number(st.hitMax?.[local]||1));
    let ferimento='',resistencia=null,stunTurnos=0;

    if(local==='PV Global'){
        if(depois<=0){
            resistencia=labRolarResistenciaFerimento22_(defensor,opcoes);
            if(!resistencia.passou){
                st.morto=true;st.inconsciente=false;ferimento='Morto';
            }else{
                st.inconsciente=true;ferimento='Inconsciente';
            }
        }
    }else{
        const limiteSerio=max/2;
        const antesSerio=antes<=limiteSerio;
        const antesGrave=antes<=0;
        const agoraSerio=depois<=limiteSerio;
        const agoraGrave=depois<=0;

        if(agoraSerio){
            st.ferimentos[local]=agoraGrave?'Grave':'Sério';
            ferimento=agoraGrave?'Ferimento Grave':'Ferimento Sério';

            if(!antesSerio){
                stunTurnos=1+Math.floor(Math.random()*3);
                st.ataquesBloqueadosTurnos=Math.max(Number(st.ataquesBloqueadosTurnos||0),stunTurnos);

                resistencia=labRolarResistenciaFerimento22_(defensor,opcoes);
                st.resistenciaFerimentos[local]={
                    serio:resistencia,
                    stunTurnos
                };

                if(!resistencia.passou){
                    if(/Braço|Perna/.test(local))st.membrosInuteis[local]=true;
                    else st.penalidadeAcoesFerimento=Math.max(1,Number(st.penalidadeAcoesFerimento||0));
                }
            }
        }

        if(agoraGrave&&!antesGrave){
            st.ferimentos[local]='Grave';
            const grave=labRolarResistenciaFerimento22_(defensor,opcoes);
            resistencia=grave;
            st.resistenciaFerimentos[local]={
                ...(st.resistenciaFerimentos[local]||{}),
                grave
            };

            if(!grave.passou){
                st.inconsciente=true;
                if(/Cabeça|Peito|Abdômen/.test(local)&&depois<=-max){
                    st.morto=true;st.inconsciente=false;ferimento='Morto';
                }else if(/Braço|Perna/.test(local)){
                    st.membrosInuteis[local]=true;ferimento='Ferimento Grave · membro inutilizado · inconsciente';
                }else ferimento='Ferimento Grave · inconsciente';
            }else{
                st.inconsciente=false;
                if(/Braço|Perna/.test(local))st.membrosInuteis[local]=true;
                ferimento='Ferimento Grave · consciente';
            }
        }

        if(!agoraSerio){
            delete st.ferimentos[local];
            delete st.resistenciaFerimentos[local];
            delete st.membrosInuteis[local];
        }
    }

    return {
        roll,local,antes,depois,pa,pen,paEf,
        bruto:Number(total||0),final,ferimento,
        resistencia,stunTurnos
    };
}
const LAB_ORDEM_CORPO_23=[
    'Cabeça','Peito','Abdômen',
    'Braço Direito','Braço Esquerdo',
    'Perna Direita','Perna Esquerda'
];

function labLocaisOrdenados23_(st){
    const ks=Object.keys(st?.hitMax||{});
    if(ks.length===1&&ks[0]==='PV Global')return ['PV Global'];
    const out=LAB_ORDEM_CORPO_23.filter(k=>ks.includes(k));
    for(const k of ks)if(!out.includes(k))out.push(k);
    return out;
}

function labResumoPVHtml_(t,titulo='PV DO PERSONAGEM'){
    const st=labGarantirSnapshotCombate_(t);if(!st)return '';
    const locs=labLocaisOrdenados23_(st);if(!locs.length)return '';
    const estados=[
        st.sangrando?'🩸 Sangrando':'',
        st.derrubado?'💥 Derrubado':'',
        st.armaDanificada?'⚔️ Arma danificada':'',
        st.inconsciente?'💤 Inconsciente':'',
        st.morto?'💀 Morto':''
    ].filter(Boolean).join(' · ');

    return `<div class="lab-pv-title" style="color:#aee8ff;font-weight:700;">${escaparHtmlInventario_(titulo)} · ${escaparHtmlInventario_(t.nome)}${estados?` · <span style="color:#ffb0b0;">${estados}</span>`:''}</div>
    <div class="lab-pv-grid" style="display:grid;grid-template-columns:repeat(${Math.min(locs.length,7)},minmax(62px,1fr));">
    ${locs.map(loc=>{
        const at=Number(st.hit?.[loc]??0),
              mx=Number(st.hitMax?.[loc]??0),
              pa=Number(st.armor?.[loc]||0),
              bad=at<=0;
        const curto=loc
          .replace('Braço Direito','Braço D.')
          .replace('Braço Esquerdo','Braço E.')
          .replace('Perna Direita','Perna D.')
          .replace('Perna Esquerda','Perna E.');
        return `<div class="lab-pv-cell" style="text-align:center;background:${bad?'rgba(231,76,60,.16)':'rgba(255,255,255,.045)'};border:1px solid ${bad?'rgba(231,76,60,.4)':'rgba(255,255,255,.08)'};">
            <small style="display:block;color:#aaa">${escaparHtmlInventario_(curto)}</small>
            <b style="display:block;color:${bad?'#ff9b93':'#fff'}">PV ${at}/${mx}</b>
            <small style="display:block;color:#8fc9e8">PA ${pa}</small>
        </div>`;
    }).join('')}
    </div>`;
}
function labEstadoPublicoAlvoHtml_(t){
    if(!t)return '';
    const st=labGarantirSnapshotCombate_(t);if(!st)return '';
    const graves=Object.values(st.ferimentos||{}).filter(x=>x==='Grave').length;
    const serios=Object.values(st.ferimentos||{}).filter(x=>x==='Sério').length;
    const estados=[
        st.morto?'💀 Morto':'',
        !st.morto&&st.inconsciente?'💤 Inconsciente':'',
        graves?'🔴 Gravemente ferido':'',
        !graves&&serios?'🟠 Seriamente ferido':'',
        st.sangrando?'🩸 Sangrando':'',
        st.derrubado?'💥 Derrubado':'',
        st.armaDanificada?'⚔️ Arma/equipamento danificado':'',
        st.atordoado?'✨ Atordoado':''
    ].filter(Boolean);
    return `<div style="margin-top:8px;padding:7px 9px;border-radius:7px;background:rgba(255,255,255,.04);color:#d9d9e8;"><strong>Estado visível de ${escaparHtmlInventario_(t.nome)}:</strong> ${estados.length?estados.join(' · '):'sem condição evidente'}</div>`;
}
window.labRolarDano_=function(){
    const dp=labEstado_.danoPendenteLab;if(!dp)return;
    const atacante=(labEstado_.tokens||[]).find(t=>String(t.id)===String(dp.atacanteId));
    const defensor=(labEstado_.tokens||[]).find(t=>String(t.id)===String(dp.defensorId));
    if(!atacante||!defensor){labEstado_.danoPendenteLab=null;labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();return;}
    const item=dp.item||{},expr=labExpressaoDano_(atacante,item);
    const critico=String(dp.grauAtaque||'').toLowerCase().includes('crít')||String(dp.grauAtaque||'').toLowerCase().includes('crit');
    const r=critico?maximizarExpressaoDanoCombate_(expr):rolarExpressaoDanoCombate_(expr);
    if(!r){notificar_(`Não foi possível interpretar o dano: ${expr||'sem dano'}`,'aviso');return;}
    const ap=labAplicarDanoLocal_(defensor,r.total,item,{localForcada:dp.localForcada||'',ignorarArmadura:!!dp.ignorarArmadura,grauAtaque:dp.grauAtaque,rolagemAtaque:dp.rolagemAtaque});
    if(!ap){notificar_('Não foi possível aplicar o dano no estado de simulação.','aviso');return;}
    const stDef=labGarantirSnapshotCombate_(defensor);
    if(dp.aplicarSangrar&&ap.final>0)stDef.sangrando=true;
    if(dp.aplicarDerrubar)stDef.derrubado=true;
    if(dp.danificarArma)stDef.armaDanificada=true;
    labSomDanoAplicado_(item);
    const armTxt=ap.pa?` · PA ${ap.pa}${ap.pen?` - Pen ${ap.pen}`:''} = ${ap.paEf}`:'';
    const locTxt=ap.roll?`Localização d20 [${ap.roll}] → ${ap.local}`:ap.local;
    const publicoFerimento=stDef.morto?'💀 Morto':stDef.inconsciente?'💤 Inconsciente':ap.ferimento||'Ferido';
    const resistTxt=ap.resistencia?` · Resistência ${ap.resistencia.roll}/${ap.resistencia.valor} → ${ap.resistencia.grau}${ap.resistencia.passou?' (resistiu)':' (falhou)'}`:'';
    atacante.ultimoResultadoProprioLab=`${getNome(item)||item.nome||'Ataque'}: ${r.detalhes.join(' · ')} → ${r.total} bruto · ${ap.local}${ap.pa?` · PA ${ap.pa}${ap.pen?` / Pen ${ap.pen}`:''}`:''} · dano final ${ap.final}${ap.ferimento?` · ${ap.ferimento}`:''}${resistTxt}.`;
    labEstado_.ultimoResultadoLab=`${getNome(item)||item.nome||'Ataque'} contra ${defensor.nome}: acerto em ${ap.local}${ap.final>0?` · dano aplicado`:''} · ${publicoFerimento}${stDef.sangrando?' · 🩸 Sangrando':''}${stDef.derrubado?' · 💥 Derrubado':''}.`;
    labEstado_.ultimoAlvoDanoId22=String(defensor.id);
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:labEstado_.ultimoResultadoLab});
    labEstado_.logLab=labEstado_.logLab.slice(0,60);
    // Sincroniza o dano do Mapa da Mesa com "Outras Características" da ficha.
    try{
        const cReal=labCharToken_(defensor);
        if(cReal&&!cReal.__npcTemporario&&!cReal.__criaturaTemporaria&&cReal.id){
            cReal.combate=cReal.combate||{};
            cReal.combate.hitLocations={...(stDef.hit||{})};
            cReal.combate.inconsciente=!!stDef.inconsciente;
            cReal.combate.incapacitado=!!stDef.incapacitado;
            cReal.combate.morto=!!stDef.morto;
            cReal.combate.sangramentoAtivo=!!stDef.sangrando;
            cReal.combate.caido=!!stDef.derrubado;
            cReal.combate.ferimentos=JSON.parse(JSON.stringify(stDef.ferimentos||{}));
            setDoc(doc(db,'personagens',String(cReal.id)),{
                'combate.hitLocations':cReal.combate.hitLocations,
                'combate.inconsciente':cReal.combate.inconsciente,
                'combate.incapacitado':cReal.combate.incapacitado,
                'combate.morto':cReal.combate.morto,
                'combate.sangramentoAtivo':cReal.combate.sangramentoAtivo,
                'combate.caido':cReal.combate.caido,
                'combate.ferimentos':cReal.combate.ferimentos
            },{merge:true}).catch(e=>console.warn('[SYNC23] persistência de PV',e));
        }
    }catch(e){console.warn('[SYNC23] espelho de PV',e);}
    labEstado_.danoPendenteLab=null;
    if(ap.final>0){defensor.ultimoResultadoRecebidoLab=`Você sofreu ${ap.final} de dano em ${ap.local}${ap.pa?` (PA ${ap.pa})`:''}.`;defensor.ultimoResultadoRecebidoTsLab=Date.now();labAdicionarFloat_(defensor,-ap.final,'dano');}
    labSalvarLocal_();labRender_();
    labAutoAvancarSeSemAcoes_();
};
window.labRolarAtaque_=function(){
    try{
    labSanearEstado_();
    const atualModo=labTokenAtual_();if(atualModo)atualModo.microModoLab='ataque';
    if(labEstado_.fase!=='combate'){notificar_('O Mapa da Mesa não está ativo.','aviso');return;}
    if(labEstado_.pendenciaLab||labEstado_.danoPendenteLab){
        notificar_('Há uma resolução de ataque pendente. Resolva-a antes de iniciar outro ataque.','aviso');labRender_();return;
    }
    const t=labTokenAtual_(),c=labCharToken_(t);
    if(!t){notificar_('Não foi possível localizar o participante da oportunidade atual.','erro');return;}
    if(!c){
        notificar_(`Os dados de ${t.nome} ainda não foram carregados. Recarregue os participantes do combate uma vez.`,'aviso',5000);return;
    }
    const stAtacante22=labGarantirSnapshotCombate_(t);
    if(stAtacante22?.morto||stAtacante22?.inconsciente||stAtacante22?.incapacitado){
        notificar_('Este participante não pode atacar neste estado.','aviso');return;
    }
    if(Number(stAtacante22?.ataquesBloqueadosTurnos||0)>0){
        notificar_(`Choque da ferida: não pode atacar por ${Number(stAtacante22.ataquesBloqueadosTurnos)} oportunidade(s).`,'aviso',3200);return;
    }
    if(Number(t.acoesAtuaisLab||0)<=0){notificar_('Sem AÇ restantes.','aviso');return;}
    labGarantirPrefsAtaque_(t);
    const per=labPericiaPorToken_(t,t.periciaLab),item=labItemSelecionado_(t);
    const alvo=labAlvoAtaquePorId_(t.alvoLab);
    if(!per||!item||!alvo){notificar_('Selecione perícia, ataque/arma e alvo.','aviso');return;}
    labApontarPara_(t,alvo);
    const dist=labDistanciaEntre_(t,alvo),alc=labAlcanceAtaque_(t,item);
    if(dist>alc+.001){
        labEstado_.ultimoResultadoLab=`Fora de alcance: ${dist.toFixed(2)} m; ${getNome(item)} alcança ${alc.toFixed(1)} m.`;
        labSalvarLocal_();labRender_();notificar_(labEstado_.ultimoResultadoLab,'aviso',4500);return;
    }
    if(labEhArmaMuniciada_(item)&&labMunicaoAtual_(t,item)<=0){notificar_(`${getNome(item)} está sem munição. Recarregue antes de atacar.`,'aviso');labRender_();return;}
    if(!batalhaEhMestre_()){
        labEnviarComandoJogador_('ataque',{periciaLab:t.periciaLab,equipamentoLab:t.equipamentoLab,alvoId:String(alvo.id)},t);
        return;
    }
    const bonusInt=Math.max(0,Number(t.bonusIntuicaoPendenteLab||0)),bonusMente=Number(t.menteAceleradaCargasLab||0)>0&&/INT/.test(String(per.formula||''))?Math.max(0,Number(t.menteAceleradaBonusLab||20)):0,valor=labValorPericiaAtaque_(c,per,alvo,item)+bonusMente,roll=labRolarD100MapaD5_(),r=classificarD100_(valor,roll);if(bonusInt>0)t.bonusIntuicaoPendenteLab=0;if(t.luckPrepared)t.luckPrepared=false;if(bonusMente>0)t.menteAceleradaCargasLab=Math.max(0,Number(t.menteAceleradaCargasLab||0)-1);if(t.bonusDificuldadeFacilPsiLab)t.bonusDificuldadeFacilPsiLab=0;
    labConsumirMunicao_(t,item,1);
    labSomAtaque_(item,r.grau);
    labDispararEfeitoVisualAtaque_(t,alvo,item,r.sucesso,r.grau);
    // Cada ataque confirmado custa exatamente 1 AÇ, inclusive crítico/fiasco.
    t.acoesAtuaisLab=Math.max(0,Number(t.acoesAtuaisLab||0)-1);
    const base=`${t.nome} → ${alvo.nome}: ${getNome(per)} ${roll}/${valor} → ${r.grau} · ${dist.toFixed(2)} m · ${getNome(item)}.`;
    labRegistrarResultadoProprio_(t,`Ataque contra ${alvo.nome}: ${getNome(per)} ${roll}/${valor} → ${r.grau}${bonusInt?` · Intuição +${bonusInt}%`:''}.`);
    let danoAutomatico=false;
    if(r.sucesso&&labEhAlvoObjeto_(alvo)){
        const expr=String(item?.dano||item?.damage||'').trim(),dr=expr?rolarExpressaoDanoCombate_(expr):null;
        if(dr){const bruto=Math.max(0,Number(dr.total||0)),duro=Math.max(0,Number(alvo.dureza||0)),final=Math.max(0,bruto-duro);alvo.pvAtual=Math.max(0,Number(alvo.pvAtual??alvo.pvMax??0)-final);if(alvo.pvAtual<=0)alvo.destruido=true;t.ultimoResultadoProprioLab=`Ataque: ${getNome(per)} ${roll}/${valor} → ${r.grau}. Dano ${bruto} - Dureza ${duro} = ${final} em ${alvo.nome}.${alvo.destruido?' Objeto destruído.':''}`;labEstado_.ultimoResultadoLab=`${t.nome} atingiu ${alvo.nome}: ${final} de dano${alvo.destruido?' · 💥 destruído':''}.`;labAdicionarFloat_(alvo,-final,'dano');}
        else labEstado_.ultimoResultadoLab=`${t.nome} acertou ${alvo.nome}, mas o dano da arma não pôde ser interpretado.`;
        labSalvarLocal_();labRender_();labAutoAvancarSeSemAcoes_();return;
    }
    if(r.sucesso){
        const pend={id:`lab_${Date.now()}`,atacanteId:String(t.id),defensorId:String(alvo.id),grauAtaque:r.grau,
            rolagemAtaque:roll,valorAtaque:valor,pericia:getNome(per),item:JSON.parse(JSON.stringify(item)),distancia:dist,alcance:alc};
        const stAlvo=labGarantirSnapshotCombate_(alvo);
        const defesasPossiveis=String(alvo.id).startsWith('dummy:')?[]:labDefesasDisponiveis_(alvo);
        const semReacao=String(alvo.id).startsWith('dummy:')
            || Number(alvo.defesasAtuaisLab||0)<=0
            || !defesasPossiveis.length
            || !!stAlvo?.morto
            || !!stAlvo?.inconsciente;
        if(semReacao){
            const qtd=(stAlvo?.morto||stAlvo?.inconsciente)?0:labEfeitosQuantidade_(r.grau,'Falha',true);
            labEstado_.danoPendenteLab={...pend,efeitosRestantes:qtd,efeitosEscolhidos:[],danoAutomatico:true};
            const motivo=stAlvo?.morto?'alvo já incapacitado/morto':stAlvo?.inconsciente?'alvo inconsciente':Number(alvo.defesasAtuaisLab||0)<=0?'sem Defesas restantes':!defesasPossiveis.length?'sem defesa possível':'alvo sem reação';
            labEstado_.ultimoResultadoLab=base+` ${motivo}; ${qtd?`${qtd} efeito(s) especial(is) antes do dano automático.`:'dano automático.'}`;
            danoAutomatico=qtd===0;
        }else{
            labEstado_.pendenciaLab=pend;labEstado_.ultimoResultadoLab=base+` Aguardando defesa de ${alvo.nome}.`;
        }
    }else{
        labEstado_.ultimoResultadoLab=base+' O ataque falhou.';
    }
    labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:labEstado_.ultimoResultadoLab});
    labEstado_.logLab=labEstado_.logLab.slice(0,60);
    labSalvarLocal_();labRender_();
    if(danoAutomatico){
        0;
    }else if(!labEstado_.pendenciaLab&&!labEstado_.danoPendenteLab){
        labAutoAvancarSeSemAcoes_();
    }
    }catch(err){
        console.error('Mapa da Mesa · ataque',err);
        notificar_(`O ataque não pôde ser concluído: ${err?.message||err}`,'erro',5500);
    }
};
function labRenderActionPanel_(){
    if(labReducing_)return;
    const el=document.getElementById('labActionPanel');if(!el)return;
    if(labEstado_.fase!=='combate'){el.style.display='none';el.innerHTML='';return;}
    if(!batalhaEhMestre_()){
        const at=labTokenAtual_(),pend=labEstado_.pendenciaLab,dp=labEstado_.danoPendenteLab;
        const autorizado=(at&&labPodeControlarToken_(at))||(pend&&labPodeControlarToken_(labTokenPorId_(pend.defensorId)))||(dp&&labPodeControlarToken_(labTokenPorId_(dp.atacanteId)));
        if(!autorizado){el.style.display='none';el.innerHTML='';return;}
    }
    el.style.display='block';

    if(labEstado_.pendenciaLab){
        const p=labEstado_.pendenciaLab,d=(labEstado_.tokens||[]).find(t=>String(t.id)===String(p.defensorId)),a=(labEstado_.tokens||[]).find(t=>String(t.id)===String(p.atacanteId));
        const c=labCharToken_(d),defs=labDefesasDisponiveis_(d);
        if(d&&defs.length&&!defs.some(x=>batalhaTokenPericia_(x)===d.defesaLab))d.defesaLab=batalhaTokenPericia_(defs[0]);
        const per=d?labPericiaPorToken_(d,d.defesaLab):null,valor=per?labValorDefesa_(c,per):0;
        el.innerHTML=`<div style="padding:3px 0;"><strong style="color:#ff9b93;">🛡️ ${escaparHtmlInventario_(d?.nome||'Alvo')} está sendo atacado por ${escaparHtmlInventario_(a?.nome||'Atacante')}</strong>
          <div style="margin-top:5px;color:#ccc;">Ataque: <b>${escaparHtmlInventario_(p.grauAtaque)}</b> · ${Number(p.distancia||0).toFixed(2)} m · AÇ do defensor: <b>${Number(d?.acoesAtuaisLab||0)}/${Number(d?.acoesMaxLab||0)}</b></div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;">
            <select onchange="labMudarDefesa_(this.value)" style="height:48px;width:auto;min-width:250px;">${defs.map(x=>`<option value="${batalhaTokenPericia_(x)}" ${batalhaTokenPericia_(x)===d?.defesaLab?'selected':''}>${escaparHtmlInventario_(getNome(x))} (${labValorDefesa_(c,x)}%)</option>`).join('')||'<option>Sem defesa disponível</option>'}</select>
            ${defs.length&&Number(d?.acoesAtuaisLab||0)>0
              ? `<button class="btn-small btn-select" onclick="labResponderDefesa_(true)" style="height:48px;min-width:180px;padding:0 20px;font-size:1.02em;">🎲 Defender (1 AÇ)</button><button class="btn-small" onclick="labResponderDefesa_(false)" style="height:48px;min-width:180px;padding:0 20px;font-size:1.02em;">✋ Não defender</button>`
              : `<span style="color:#ffb0b0;font-weight:700;">Sem reação possível · dano será automático</span>`}
          </div>${d?labResumoPVHtml_(d,'SEUS PV'):''}</div>`;
        return;
    }

    if(labEstado_.danoPendenteLab){
        const p=labEstado_.danoPendenteLab,a=(labEstado_.tokens||[]).find(t=>String(t.id)===String(p.atacanteId)),d=(labEstado_.tokens||[]).find(t=>String(t.id)===String(p.defensorId));
        let efs=[];
        try{efs=labEfeitosDisponiveis_(p)||[];}catch(err){
            console.error('Mapa da Mesa · efeitos',err);
            efs=[];
        }
        const expr=labExpressaoDano_(a,p.item),rest=Math.max(0,Number(p.efeitosRestantes||0));
        const st=labGarantirSnapshotCombate_(d),locs=Object.keys(st?.hitMax||{});
        if(rest>0){
            if(!p.escolhendoLocalizacao&&!efs.length){
                p.efeitosRestantes=0;
                labSalvarLocal_();
                0;
                el.innerHTML='<div style="color:#9fffb0;font-weight:700;">Nenhum efeito especial aplicável. Resolvendo dano…</div>';
                return;
            }
            if(p.escolhendoLocalizacao){
                el.innerHTML=`<div><strong style="color:#ffd54a;">🎯 Escolher Localização</strong><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;">${locs.map(loc=>`<button class="btn-small" onclick="labConfirmarLocalizacao_('${String(loc).replace(/'/g,"\\'")}')" style="min-height:42px;">${escaparHtmlInventario_(loc)}</button>`).join('')}</div></div>`;
            }else{
                el.innerHTML=`<div><strong style="color:#ffd54a;">✨ ${rest} efeito(s) especial(is) disponível(is)</strong> · ${escaparHtmlInventario_(a?.nome||'Atacante')} → ${escaparHtmlInventario_(d?.nome||'Alvo')}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px;">${efs.map(e=>`<button class="btn-small btn-select" onclick="labEscolherEfeito_('${e.id}')" style="min-height:44px;">${e.nome}</button>`).join('')}<button class="btn-small" onclick="labPularEfeitos_()" style="min-height:44px;">Ignorar efeitos</button></div>${d?labEstadoPublicoAlvoHtml_(d):''}</div>`;
            }
            return;
        }
        el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;"><div><strong style="color:#ffd54a;">💥 Ataque acertou</strong> · ${escaparHtmlInventario_(a?.nome||'Atacante')} → ${escaparHtmlInventario_(d?.nome||'Alvo')}<br><small style="color:#bbb;">${escaparHtmlInventario_(getNome(p.item)||p.item?.nome||'Ataque')} · dano ${escaparHtmlInventario_(expr||'—')}</small></div>${p.danoAutomatico?'<span style="color:#9fffb0;font-weight:700;">Dano automático…</span>':`<button class="btn-small btn-select" onclick="labRolarDano_()" style="height:48px;min-width:170px;padding:0 20px;font-size:1em;">💥 Rolar dano</button>`}</div>${d?labEstadoPublicoAlvoHtml_(d):''}`;
        return;
    }

    const t=labTokenAtual_(),c=labCharToken_(t);
    if(!t||!c){el.style.display='none';return;}


    if(t.acaoAuxLab?.tipo==='teste_pericia'){
        const ps=labPericiasTeste_(t),per=ps.find(p=>batalhaTokenPericia_(p)===t.acaoAuxLab.periciaToken)||ps[0];if(per)t.acaoAuxLab.periciaToken=batalhaTokenPericia_(per);
        el.innerHTML=`<div><strong style="color:#9ee7ff;">🎲 Teste de Perícia</strong><div style="display:grid;grid-template-columns:minmax(260px,1fr) auto auto;gap:8px;align-items:end;margin-top:8px;">
          <label style="margin:0;"><small style="display:block;margin-bottom:4px;">Perícia</small><select onchange="labTesteSelecionar_(this.value)" style="width:100%;margin:0;">${ps.map(x=>`<option value="${batalhaTokenPericia_(x)}" ${batalhaTokenPericia_(x)===t.acaoAuxLab.periciaToken?'selected':''}>${escaparHtmlInventario_(getNome(x))} (${labValorTeste_(t,x)}%)</option>`).join('')}</select></label>
          <button class="btn-small btn-select" onclick="labExecutarTeste_()" style="height:48px;min-width:180px;">🎲 Testar (1 AÇ)</button><button class="btn-small" onclick="labCancelarAcaoAux_()" style="height:48px;min-width:110px;">Cancelar</button></div>${labResumoPVHtml_(t,'SEUS PV')}</div>`;return;
    }

    if(t.acaoAuxLab?.tipo==='psiquismo'){
        const contexto=labPsiAlvoPorId_(t.acaoAuxLab.alvoId),todosPsi=labPsiPoderes_(t),poderes=todosPsi,p=poderes.find(x=>x.id===t.acaoAuxLab.poderId)||poderes[0];if(!p){t.acaoAuxLab=null;labSalvarLocal_();labRender_();return;}
        const alvosPsi=labPsiAlvos_(t,p);
        if(!alvosPsi.some(x=>String(x.id)===String(t.acaoAuxLab.alvoId)))t.acaoAuxLab.alvoId='';
        if(!t.acaoAuxLab.alvoId&&alvosPsi.length===1&&String(alvosPsi[0].id)===String(t.id))t.acaoAuxLab.alvoId=String(t.id);
        t.acaoAuxLab.poderId=p.id;const alvos=alvosPsi,alvo=t.acaoAuxLab.alvoId?labPsiAlvoPorId_(t.acaoAuxLab.alvoId):null,feridas=alvo&&labPsiEhObjeto_(alvo)?[]:(alvo?labFeridasTrataveis_(alvo):[]);
        if(labPsiEhCura_(p)){labPsiAjustarCura_(t);}
        const minBase=Math.max(0,Number(p.custo||0)),min=p.id==='mover_objeto'&&labPsiEhObjeto_(alvo)?labPsiMoverCustoKg_(p,alvo):minBase,rest=labPsiRestantes_(t),valor=labPsiValor_(t,p);if(Number(t.acaoAuxLab.custo||0)<min)t.acaoAuxLab.custo=min;
        const curaLimite=labPsiEhCura_(p)?labPsiCuraLimite_(t,p,alvo,t.acaoAuxLab.local):rest;
        const ppMax=p.id==='intuicao_psi'?Math.min(4,rest):(labPsiEhCura_(p)?Math.max(min,curaLimite):rest);
        el.innerHTML=`<div><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;"><strong style="color:#d8b4ff;">🔮 Psiquismo</strong><span style="color:#e6d4ff;font-weight:700;">PP ${rest}/${labPsiMax_(t)}</span></div>
          <div style="display:grid;grid-template-columns:minmax(210px,1.25fr) 100px ${labPsiEhCura_(p)?'minmax(150px,.9fr) ':''}auto auto;gap:8px;align-items:end;margin-top:8px;">
          <label style="margin:0;"><small style="display:block;margin-bottom:4px;">Poder</small><select onchange="labPsiSelecionarPoder_(this.value)" style="width:100%;margin:0;">${poderes.map(x=>`<option value="${escaparHtmlInventario_(x.id)}" ${x.id===p.id?'selected':''}>${escaparHtmlInventario_(getNome(x))} · ${x.esfera} · A${Number(x.arco||1)}</option>`).join('')}</select></label>
          <label style="margin:0;"><small style="display:block;margin-bottom:4px;">PP</small><input type="number" min="${min}" max="${ppMax}" value="${Math.min(ppMax,Math.max(min,Number(t.acaoAuxLab.custo||min)))}" onchange="labPsiCusto_(this.value)" style="width:100%;height:48px;margin:0;text-align:center;"></label>
          ${labPsiEhCura_(p)?`<label style="margin:0;"><small style="display:block;margin-bottom:4px;">Local</small><select onchange="labPsiSelecionarLocal_(this.value)" style="width:100%;margin:0;">${feridas.map(x=>`<option value="${escaparHtmlInventario_(x.local)}" ${x.local===t.acaoAuxLab.local?'selected':''}>${escaparHtmlInventario_(x.local)}</option>`).join('')||'<option value="">Sem ferida</option>'}</select></label>`:''}
          <button class="btn-small btn-select" onclick="labUsarPsi_()" ${rest<min||(labPsiEhCura_(p)&&curaLimite<=0)?'disabled':''} style="height:48px;min-width:165px;">✨ Usar ${p.id==='intuicao_psi'?'(sem AÇ)':'(1 AÇ)'}</button><button class="btn-small" onclick="labCancelarAcaoAux_()" style="height:48px;min-width:100px;">Cancelar</button></div>
          <div style="margin-top:7px;color:#b9add8;">${alvo?`🎯 <b>${escaparHtmlInventario_(alvo.nome||alvo.name||labObjetoModelo_(alvo)?.nome||'Objeto')}</b> selecionado no mapa · `:'🎯 <b style="color:#ffd98c">Clique no alvo dentro do mapa</b> · '}<b>Teste ${valor}%</b> · custo mínimo ${min} PP${p.id==='mover_objeto'&&labPsiEhObjeto_(alvo)?` · ${labObjetoPesoKg_(alvo).toFixed(1)} kg · capacidade com ${Math.max(min,Number(t.acaoAuxLab.custo||min))} PP: ${labPsiMoverCapacidadeKg_(p,Math.max(min,Number(t.acaoAuxLab.custo||min))).toFixed(0)} kg`:''} · ${escaparHtmlInventario_(getObservacaoPsi_(p))}${labPsiEhCura_(p)&&t.acaoAuxLab.local?` · <b>máx. nesta localização: ${curaLimite} PP</b>`:''}</div>${labResumoPVHtml_(t,'SEUS PV')}${alvo&&!labPsiEhObjeto_(alvo)&&String(alvo.id)!==String(t.id)?labEstadoPublicoAlvoHtml_(alvo):''}</div>`;return;
    }

    if(t.primeirosSocorrosLab){
        const ps=t.primeirosSocorrosLab,alvo=labTokenPorId_(ps.alvoId),st=labGarantirSnapshotCombate_(alvo);
        if(!alvo||!st||st.morto){
            t.primeirosSocorrosLab=null;labSalvarLocal_();
        }else{
            const kit=labTemKitPrimeirosSocorros_(t),n=Math.max(1,Math.min(3,Number(ps.turnosInvestidos||1)));
            const dif=kit?(n>=3?'Muito Fácil':n===2?'Fácil':'Padrão'):'Padrão';
            el.innerHTML=`<div style="padding:2px 0;">
              <strong style="color:#9ee7ff;">🩹 Primeiros Socorros ${n}/3</strong> · ${escaparHtmlInventario_(t.nome)} tratando ${escaparHtmlInventario_(alvo.nome)} (${escaparHtmlInventario_(ps.local)})
              <div style="margin-top:5px;color:#c7c7d2;">${kit?'Kit disponível':'Sem kit'} · dificuldade-base na conclusão: <b>${dif}</b>. Enquanto trata, defesas sofrem +2 graus de dificuldade.</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px;">
                <button class="btn-small btn-select" onclick="labPSConcluir_()" ${Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="height:48px;min-width:190px;font-size:1em;">🩹 Concluir (1 AÇ)</button>
                ${n<3?`<button class="btn-small" onclick="labPSContinuar_()" ${Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="height:48px;min-width:220px;font-size:1em;">⌛ Continuar atendimento (${n}/3)</button>`:''}
              </div>
              ${labResumoPVHtml_(t,'SEUS PV')}
              ${labEstadoPublicoAlvoHtml_(alvo)}
            </div>`;
            return;
        }
    }

    if(t.acaoAuxLab?.tipo==='primeiros_socorros'){
        const alvos=(labEstado_.tokens||[]).filter(x=>labFeridasTrataveis_(x).length&&!labGarantirSnapshotCombate_(x)?.morto);
        const alvo=labTokenPorId_(t.acaoAuxLab.alvoId),feridas=labFeridasTrataveis_(alvo);
        if(!alvos.length){t.acaoAuxLab=null;labSalvarLocal_();}
        else{
            if(!alvo||!alvos.some(x=>String(x.id)===String(alvo.id))){
                t.acaoAuxLab.alvoId=String(alvos[0].id);t.acaoAuxLab.local=labFeridasTrataveis_(alvos[0])[0]?.local||'';
            }
            const alvo2=labTokenPorId_(t.acaoAuxLab.alvoId),feridas2=labFeridasTrataveis_(alvo2);
            if(!feridas2.some(x=>x.local===t.acaoAuxLab.local))t.acaoAuxLab.local=feridas2[0]?.local||'';
            el.innerHTML=`<div><strong style="color:#9ee7ff;">🩹 Iniciar Primeiros Socorros</strong>
              <div style="display:grid;grid-template-columns:minmax(180px,1fr) minmax(180px,1fr) auto auto;gap:8px;align-items:end;margin-top:8px;">
                <label style="margin:0;"><small style="display:block;margin-bottom:4px;">Paciente</small><select onchange="labPSSelecionarAlvo_(this.value)" style="width:100%;margin:0;">${alvos.map(x=>`<option value="${escaparHtmlInventario_(x.id)}" ${String(x.id)===String(t.acaoAuxLab.alvoId)?'selected':''}>${escaparHtmlInventario_(x.nome)}</option>`).join('')}</select></label>
                <label style="margin:0;"><small style="display:block;margin-bottom:4px;">Localização</small><select onchange="labPSSelecionarLocal_(this.value)" style="width:100%;margin:0;">${feridas2.map(x=>`<option value="${escaparHtmlInventario_(x.local)}" ${x.local===t.acaoAuxLab.local?'selected':''}>${escaparHtmlInventario_(x.local)}</option>`).join('')}</select></label>
                <button class="btn-small btn-select" onclick="labPSIniciar_()" style="height:48px;min-width:200px;font-size:1em;">🩹 Iniciar (1 AÇ)</button>
                <button class="btn-small" onclick="labCancelarAcaoAux_()" style="height:48px;min-width:110px;font-size:1em;">Cancelar</button>
              </div>
              <div style="margin-top:7px;color:#bbb;">Iniciar o atendimento encerra automaticamente esta oportunidade. Na próxima oportunidade, escolha concluir ou continuar. Máximo 3 turnos.</div>
              ${labResumoPVHtml_(t,'SEUS PV')}
            </div>`;
            return;
        }
    }

    labGarantirPrefsAtaque_(t);
    const skills=labPericiasAtaque_(t),per=labPericiaPorToken_(t,t.periciaLab),eq=batalhaEquipamentos_(c,per,t.equipamentoLab);
    const alvos=labAlvosAtaque_(t);
    const alvo=alvos.find(x=>String(x.id)===String(t.alvoLab)),item=labItemSelecionado_(t);
    const dist=alvo?labDistanciaEntre_(t,alvo):Infinity,alc=item?labAlcanceAtaque_(t,item):0;
    el.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:7px;">
        <strong style="color:#ffd54a;">🎯 Ação de ${escaparHtmlInventario_(t.nome)}</strong><span style="font-size:.86em;color:#9fc6d8;">🔊 sons de combate ativos</span>
        <span style="color:${alvo?(dist<=alc?'#9fffb0':'#ff9b93'):'#ffd98c'}">${alvo?`🎯 ${escaparHtmlInventario_(alvo.nome)} · ${dist.toFixed(2)} m · alcance ${alc.toFixed(1)} m`:'🎯 Clique no alvo dentro do mapa'}</span>
      </div>
      <div style="display:grid;grid-template-columns:minmax(145px,1.15fr) minmax(160px,1.25fr) minmax(145px,.58fr);gap:8px;align-items:start;">
        <label style="margin:0;"><small style="display:block;margin-bottom:4px;">Perícia</small><select onchange="labMudarAtaquePref_('periciaLab',this.value)" style="width:100%;margin:0;">${skills.map(p=>`<option value="${batalhaTokenPericia_(p)}" ${batalhaTokenPericia_(p)===t.periciaLab?'selected':''}>${escaparHtmlInventario_(getNome(p))} (${labValorPericiaAtaque_(c,p,alvo,item)}%)</option>`).join('')}</select></label>
        <label style="margin:0;"><small style="display:block;margin-bottom:4px;">Arma / ataque</small><select onchange="labMudarAtaquePref_('equipamentoLab',this.value)" style="width:100%;margin:0;">${eq.map(x=>`<option value="${escaparHtmlInventario_(x.valor)}" ${x.valor===t.equipamentoLab?'selected':''}>${escaparHtmlInventario_(x.rotulo)}</option>`).join('')||'<option>—</option>'}</select></label>
        <label style="margin:0;"><small style="display:block;margin-bottom:4px;visibility:hidden;">Ação</small><button class="btn-small btn-select" onclick="labRolarAtaque_()" ${!per||!item||!alvo||Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="width:100%;height:48px;min-width:0;padding:0 12px;font-size:1em;margin:0;box-sizing:border-box;white-space:nowrap;">🎲 Testar</button></label>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px;">
        <button class="btn-small" onclick="labPassarAcao_()" ${Number(t.acoesAtuaisLab||0)<=0?'disabled':''} title="${Number(t.passagensLab||0)===0?'Primeira passagem da rodada: não gasta AÇ.':'Passagens seguintes nesta rodada custam 1 AÇ.'}" style="height:44px;min-width:185px;font-size:.96em;">⏭ ${Number(t.passagensLab||0)===0?'Passar (grátis)':'Passar (1 AÇ)'}</button>
        ${item&&labEhArmaMuniciada_(item)?`<button class="btn-small" onclick="labRecarregar_()" ${Number(t.acoesAtuaisLab||0)<=0?'disabled':''} title="Recarga local/simulada. Capacidade definida pelo campo Uso da arma." style="height:44px;min-width:170px;font-size:.96em;">🔋 Recarregar · ${labMunicaoAtual_(t,item)}/${labCapacidadeArma_(item)}</button>`:''}
        <button class="btn-small" onclick="labLevantar_()" ${!labGarantirSnapshotCombate_(t)?.derrubado||Number(t.acoesAtuaisLab||0)<=0?'disabled':''} title="${labGarantirSnapshotCombate_(t)?.derrubado?'Gasta 1 AÇ para se levantar.':'Disponível quando o personagem estiver Derrubado.'}" style="height:44px;min-width:160px;font-size:.96em;">⬆️ Levantar (1 AÇ)</button>
        <button class="btn-small" onclick="labAbrirTeste_()" ${Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="height:44px;min-width:160px;font-size:.96em;">🎲 Teste (1 AÇ)</button>
        ${temPsiquismoInvestido_(labCharToken_(t)||t.charLab)?`<button class="btn-small" onclick="labAbrirPsi_()" ${Number(t.acoesAtuaisLab||0)<=0?'disabled':''} style="height:44px;min-width:180px;font-size:.96em;color:#4b176b;font-weight:800;">🔮 Psiquismo · ${labPsiRestantes_(t)}/${labPsiMax_(t)} PP</button>`:''}
        ${labPrimeirosSocorrosPericia_(t)?`<button class="btn-small" onclick="labAbrirPrimeirosSocorros_()" ${!labPodePrimeirosSocorros_(t)||Number(t.acoesAtuaisLab||0)<=0||!(labEstado_.tokens||[]).some(x=>labFeridasTrataveis_(x).length&&!labGarantirSnapshotCombate_(x)?.morto)?'disabled':''} title="Escolha paciente e localização ferida. Iniciar custa 1 AÇ e encerra a oportunidade." style="height:44px;min-width:210px;font-size:.96em;">🩹 Primeiros Socorros</button>`:''}
      </div>
      ${t?labResumoPVHtml_(t,'SEUS PV'):''}
      ${alvo?(labEhAlvoObjeto_(alvo)?`<div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.045);color:#cfe7ff;">🧱 <b>${escaparHtmlInventario_(alvo.nome||'Objeto')}</b> · PV ${Number(alvo.pvAtual??alvo.pvMax??0)}/${Number(alvo.pvMax||0)} · Dureza ${Number(alvo.dureza||0)} · ${Number(alvo.pesoKg||0).toFixed(1)} kg</div>`:labEstadoPublicoAlvoHtml_(alvo)):''}
      ${t?.ultimoResultadoProprioLab?`<div style="margin-top:7px;padding:6px 8px;border-radius:7px;background:rgba(255,255,255,.05);">${escaparHtmlInventario_(t.ultimoResultadoProprioLab)}</div>`:''}`;
}
function labBackgroundImage_(){
    const c=labEstado_.corGrade||'#777777';const grid=labEstado_.gradeVisivel!==false?`linear-gradient(to right,${c} 1px,transparent 1px),linear-gradient(to bottom,${c} 1px,transparent 1px)`:'';
    const tex={nenhuma:'',concreto:'radial-gradient(circle at 20% 30%,rgba(255,255,255,.08) 0 1px,transparent 2px),radial-gradient(circle at 70% 65%,rgba(0,0,0,.10) 0 1px,transparent 2px)',
    areia:'radial-gradient(circle,rgba(255,248,205,.22) 0 1px,transparent 1.6px)',terra:'radial-gradient(circle at 30% 20%,rgba(65,30,10,.22) 0 2px,transparent 3px)',
    grama:'repeating-linear-gradient(78deg,rgba(30,90,35,.18) 0 2px,transparent 2px 8px)',floresta:'radial-gradient(circle at 15% 25%,rgba(18,85,35,.34) 0 7px,transparent 8px),radial-gradient(circle at 75% 70%,rgba(32,105,43,.30) 0 9px,transparent 10px)',
    rochas:'radial-gradient(ellipse at 20% 30%,rgba(70,70,75,.28) 0 7px,transparent 8px),radial-gradient(ellipse at 70% 65%,rgba(35,35,40,.20) 0 10px,transparent 11px)',
    neve:'radial-gradient(circle,rgba(255,255,255,.55) 0 2px,transparent 2.6px)',agua:'repeating-radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.10) 0 2px,transparent 3px 11px)',
    vulcanico:'radial-gradient(circle at 25% 35%,rgba(255,95,0,.24) 0 2px,transparent 3px)',metal:'repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 3px,rgba(0,0,0,.05) 3px 6px)',
    nevoa:'radial-gradient(ellipse at 20% 35%,rgba(255,255,255,.18),transparent 35%)'}[labEstado_.textura||'nenhuma']||'';return [grid,tex].filter(Boolean).join(',');
}
function labAtualizarStatusCombate_(){
    const el=document.getElementById('labCombatStatus');if(!el)return;
    const em=labEstado_.fase==='combate',startBtn=document.getElementById('labStartBtn');
    if(startBtn){
        startBtn.classList.remove('hidden');
        startBtn.textContent=em?'⏹ Encerrar combate':'⚡ Iniciar combate';
        startBtn.classList.toggle('btn-delete',em);
        startBtn.classList.toggle('btn-select',!em);
    }
    document.getElementById('labNextBtn')?.classList.toggle('hidden',!em);
    const stop=document.getElementById('labStopBtn');if(stop)stop.classList.add('hidden');
    if(!em){
        el.innerHTML='<strong>🧭 Exploração:</strong> movimentação livre. Ações de trabalho usam fadiga, não AÇ.';
        return;
    }
    const a=labTokenAtual_(),ord=(labEstado_.ordemIniciativa||[]).map(id=>labEstado_.tokens.find(t=>String(t.id)===String(id))).filter(Boolean);
    el.innerHTML=`<strong>⚔️ Rodada ${labEstado_.rodada}</strong> · oportunidade de <strong style="color:#ffd54a">${escaparHtmlInventario_(a?.nome||'—')}</strong>${a?` · AÇ ${a.acoesAtuaisLab}/${a.acoesMaxLab} · INI ${a.iniciativaLab}`:''}<div style="margin-top:3px;font-size:.86em;color:#cfc5de">Ordem: ${ord.map((t,i)=>`${i===labEstado_.turnoIndex?'<b style="color:#ffd54a">':''}${escaparHtmlInventario_(t.nome)} ${t.iniciativaLab}${i===labEstado_.turnoIndex?'</b>':''}`).join(' → ')}</div>`;
}
window.labAlternarCombate_=function(){
    if(labEstado_.fase==='combate')return window.labVoltarPreparacao_();
    return window.labIniciarCombate_();
};
function labAtualizarInfo_(){
    const el=document.getElementById('labInfo');if(!el)return;const t=labEstado_.tokens.find(x=>String(x.id)===String(labEstado_.selecionadoId));
    if(!t){el.innerHTML='';el.style.display='flex';return;}
    const a=t.attrs||{},cInfo=labCharToken_(t),fadInfo=traduzirNomeFadiga_(cInfo?.combate?.fadiga||'Fresh'),p=labMovimentoPorAcao_(t),mov=labMovimentoMaxM_(t),prep=labEstado_.fase!=='combate',at=labTokenAtual_(),eh=String(at?.id)===String(t.id);
    const alc=eh?labAlcanceSelecionado_(t):0;
    const modos=[t.movimentoTerrestre>0?`<option value="terrestre" ${t.modoMovimento==='terrestre'?'selected':''}>Terrestre ${t.movimentoTerrestre} m/AÇ</option>`:'',t.movimentoVoo>0?`<option value="voo" ${t.modoMovimento==='voo'?'selected':''}>Voo ${t.movimentoVoo} m/AÇ</option>`:'',t.movimentoNatacao>0?`<option value="natacao" ${t.modoMovimento==='natacao'?'selected':''}>Natação ${t.movimentoNatacao} m/AÇ</option>`:''].join('');
    el.innerHTML=`<div style="display:flex;gap:8px 14px;align-items:center;flex-wrap:wrap;">
      <strong>${escaparHtmlInventario_(t.nome)}</strong>
      <span>posição <b>${t.x.toFixed(2)} m, ${t.y.toFixed(2)} m</b></span>
      <span>frente <b>${Math.round(t.angulo||0)}°</b></span>
      <span>AÇ <b>${t.acoesAtuaisLab}/${t.acoesMaxLab}</b></span>
      ${Number.isFinite(Number(t.iniciativaLab))?`<span>INI <b>${t.iniciativaLab}</b></span>`:''}
      ${prep?'<span style="color:#9fffb0"><b>posicionamento livre</b></span>':
        t.livreMestre?'<span><b>posicionamento livre do mestre</b></span>':
        p>0?`<label style="display:inline-flex;align-items:center;gap:6px;margin:0;"><span>Movimento</span><select onchange="labMudarModoMovimento_(this.value)" ${!eh?'disabled':''} style="width:auto;min-width:150px;max-width:230px;min-height:34px;margin:0;">${modos}</select></label><span><b>${p} m/AÇ</b></span><span>disponível <b>${eh?mov.toFixed(1):'0.0'} m</b></span>`:
        '<span style="color:#ffb0b0"><b>imóvel</b></span>'}
      ${alc>0?`<span style="color:#ffb0b0">alcance <b>${alc.toFixed(1)} m</b></span>`:''}
      <span>Fadiga <b>${escaparHtmlInventario_(fadInfo)}</b></span>
      <span style="color:#9fdfff">${['FOR','CON','TAM','DES'].filter(k=>a[k]!=null).map(k=>`${k} ${a[k]}`).join(' · ')}</span>
    </div>`;
}
let labTokenArrastandoId_='';
function labOverlayMovimentoHtml_(t,ppm){
    if(!t)return '';
    if(!batalhaEhMestre_()&&!labPodeVerDetalhesToken_(t))return '';
    let h='';const atual=labTokenAtual_(),ativo=String(labEstado_.selecionadoId||'')===String(t.id)||String(labTokenArrastandoId_||'')===String(t.id),ehAtual=labEstado_.fase==='combate'&&String(atual?.id)===String(t.id);
    if(!ehAtual||!ativo)return '';
    const max=labMovimentoMaxM_(t);
    if(max>0&&max<100){const r=max*ppm;h+=`<div style="position:absolute;left:${t.x*ppm-r}px;top:${t.y*ppm-r}px;width:${2*r}px;height:${2*r}px;border-radius:50%;background:rgba(70,170,255,.10);border:2px dashed rgba(90,195,255,.65);pointer-events:none"></div>`;}
    const alc=labAlcanceSelecionado_(t);if(alc>0){const r=alc*ppm;h+=`<div style="position:absolute;left:${t.x*ppm-r}px;top:${t.y*ppm-r}px;width:${2*r}px;height:${2*r}px;border-radius:50%;border:2px dotted rgba(255,105,105,.82);pointer-events:none"></div>`;}return h;
}

function labPodeVerDetalhesToken_(t){
    if(!t)return false;
    if(batalhaEhMestre_())return true;
    const uid=String(currentUserUid||currentUser?.uid||'');
    return !!uid&&String(t.donoUid||'')===uid;
}
function labPodeControlarToken_(t){return batalhaEhMestre_()||labPodeVerDetalhesToken_(t);}
function labHoverConteudo_(t){
    if(!t)return '';
    const st=labGarantirSnapshotCombate_(t);
    const img=t.imagem?`<img src="${escaparHtmlInventario_(t.imagem)}" style="width:100%;height:190px;object-fit:contain;background:rgba(255,255,255,.04);border-radius:9px;">`
        :`<div style="height:100px;display:flex;align-items:center;justify-content:center;font-size:48px;">${String(t.id).startsWith('dummy:')?'🎯':'👤'}</div>`;
    const estados=[st?.morto?'💀 Morto':'',st?.inconsciente?'💤 Inconsciente':'',st?.sangrando?'🩸 Sangrando':'',st?.derrubado?'💥 Derrubado':'',st?.atordoado?'✨ Atordoado':''].filter(Boolean).join(' · ');
    let detalhes='';
    if(labPodeVerDetalhesToken_(t)&&st){
        const locs=Object.keys(st.hitMax||{});
        detalhes=`<div style="margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.12);">
          <div style="font-size:.78em;color:#ffd166;font-weight:700;margin-bottom:4px;">${batalhaEhMestre_()?'VISÃO DO MESTRE':'SEU PERSONAGEM'} · PV / ARMADURA</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;font-size:.78em;">${locs.map(loc=>`<span>${escaparHtmlInventario_(loc)}</span><span style="text-align:right;"><b>${Number(st.hit?.[loc]??0)}/${Number(st.hitMax?.[loc]??0)}</b> · PA ${Number(st.armor?.[loc]||0)}</span>`).join('')}</div>
          <div style="margin-top:7px;font-size:.76em;color:#b8dfff;">AÇ ${Number(t.acoesAtuaisLab||0)}/${Number(t.acoesMaxLab||0)}${labPsiMax_(t)>0?` · PP ${labPsiRestantes_(t)}/${labPsiMax_(t)}`:''}</div>
        </div>`;
    }
    return `${img}<div style="margin-top:7px;font-size:1.05em;font-weight:800;color:#fff;">${escaparHtmlInventario_(t.nome)}</div>
      <div style="font-size:.82em;color:#9fdfff;">${escaparHtmlInventario_(t.tipo||'')}</div>
      ${estados?`<div style="margin-top:5px;color:#ffb0b0;font-size:.82em;">${estados}</div>`:''}${detalhes}`;
}
window.labHoverShow_=function(ev,id){const t=labTokenPorId_(id),el=document.getElementById('labHoverCard');if(!t||!el)return;el.innerHTML=labHoverConteudo_(t);el.style.display='block';labHoverMove_(ev);};
window.labHoverMove_=function(ev){
    const el=document.getElementById('labHoverCard');if(!el||el.style.display==='none')return;
    const pad=18,w=el.offsetWidth||300,h=el.offsetHeight||300;
    // Fica ancorado à direita da janela para não atravessar o centro do campo.
    const x=Math.max(pad,window.innerWidth-w-26);
    let y=Number(ev.clientY||0)-Math.min(90,h*.25);
    if(y+h>window.innerHeight-pad)y=window.innerHeight-h-pad;
    el.style.left=`${x}px`;el.style.top=`${Math.max(pad,y)}px`;
};
window.labHoverHide_=function(){const el=document.getElementById('labHoverCard');if(el)el.style.display='none';};


function labMicroModo_(t){return t?.microModoLab||'ataque';}
function labMicroNomeAcao_(t){
    const modo=labMicroModo_(t);
    if(modo==='psi'){
        const a=t?.acaoAuxLab,p=labPsiPoderes_(t).find(x=>x.id===a?.poderId)||labPsiPoderes_(t)[0];
        if(!p)return 'Usar poder';
        const n=getNome(p)||'Usar poder';
        return labPsiEhCura_(p)?'Curar':(/^mover/i.test(n)?'Mover':(/^grito/i.test(n)?'Gritar':n));
    }
    if(modo==='socorros')return t?.primeirosSocorrosLab?'Continuar 1º socorros':'1º socorros';
    const item=labItemSelecionado_(t);
    const n=getNome(item)||item?.nome||'';
    if(item?.natural===true&&n)return n;
    return 'Atacar';
}
window.labMicroModoSelecionar_=function(modo){
    const t=labTokenAtual_();if(!t)return;
    modo=String(modo||'ataque');
    t.microModoLab=modo;
    if(modo==='ataque'){
        // O painel superior volta às opções normais, mas as escolhas de Psi ficam guardadas.
        if(t.acaoAuxLab?.tipo==='psiquismo')t.psiSelecaoLab=JSON.parse(JSON.stringify(t.acaoAuxLab));
        if(t.acaoAuxLab?.tipo==='primeiros_socorros')t.psSelecaoLab=JSON.parse(JSON.stringify(t.acaoAuxLab));
        t.acaoAuxLab=null;
    }else if(modo==='psi'){
        if(t.acaoAuxLab?.tipo!=='psiquismo'){
            const alvoCtx=labTokenPorId_(labEstado_.selecionadoId)||labObjetoPorId_(labEstado_.objetoSelecionadoId)||t;
            const salvo=t.psiSelecaoLab,p=labPsiPoderSelecionado_(t);
            if(!p){notificar_('Este participante não possui poder psíquico disponível.','aviso');t.microModoLab='ataque';return;}
            const alvos=labPsiAlvos_(t,p);
            const alvoEscolhido=alvos.some(x=>String(x.id)===String(alvoCtx?.id))?alvoCtx:(alvos[0]||null);
            if(!alvoEscolhido){notificar_('O poder psíquico selecionado não possui alvo válido neste momento.','aviso');t.microModoLab='ataque';return;}
            if(salvo?.tipo==='psiquismo'&&String(salvo.poderId)===String(p.id))t.acaoAuxLab=JSON.parse(JSON.stringify(salvo));
            else t.acaoAuxLab={tipo:'psiquismo',poderId:p.id,alvoId:String(alvoEscolhido.id),custo:Math.max(0,Number(p.custo||0)),local:''};
            t.acaoAuxLab.alvoId=String(alvoEscolhido.id);
            if(p.id==='mover_objeto'&&labPsiEhObjeto_(alvoEscolhido))t.acaoAuxLab.custo=Math.max(Number(t.acaoAuxLab.custo||0),labPsiMoverCustoKg_(p,alvoEscolhido));
            labPsiAjustarCura_(t);
        }
    }else if(modo==='socorros'){
        if(!labPrimeirosSocorrosPericia_(t)){notificar_('Este participante não possui Primeiros Socorros.','aviso');t.microModoLab='ataque';return;}
        if(!t.primeirosSocorrosLab&&t.acaoAuxLab?.tipo!=='primeiros_socorros'){
            const salvo=t.psSelecaoLab;
            if(salvo?.tipo==='primeiros_socorros')t.acaoAuxLab=JSON.parse(JSON.stringify(salvo));
            else window.labAbrirPrimeirosSocorros_();if(t.acaoAuxLab?.tipo==='primeiros_socorros'&&labEstado_.selecionadoId)t.acaoAuxLab.alvoId=String(labEstado_.selecionadoId);
        }
    }
    labSalvarLocal_();labRender_();
};
window.labMicroExecutar_=function(){
    const t=labTokenAtual_();if(!t||Number(t.acoesAtuaisLab||0)<=0)return;
    const modo=labMicroModo_(t);
    if(modo==='psi'){
        if(t.acaoAuxLab?.tipo!=='psiquismo')window.labMicroModoSelecionar_('psi');
        else window.labUsarPsi_();
        return;
    }
    if(modo==='socorros'){
        if(t.primeirosSocorrosLab){
            window.labPSConcluir_();
        }else if(t.acaoAuxLab?.tipo==='primeiros_socorros'){
            window.labPSIniciar_();
        }else window.labMicroModoSelecionar_('socorros');
        return;
    }
    window.labRolarAtaque_();
};
// V46.79.0 — painéis contextuais nunca ficam escondidos para fora da borda inferior do mapa.
function labMicroPosicaoVertical_(centroPx,meiaAlturaPx,ppm,alturaPainelPx=52){
    return {
      top:Math.max(2,Number(centroPx||0)-Number(meiaAlturaPx||0)-7),
      transform:'translate(-50%,-100%)'
    };
}
function labMicroPainelHtml_(alvoVisual,ppm,d){
    if(labEstado_.fase!=='combate'||!alvoVisual)return '';
    const ator=labTokenAtual_();if(!ator||!labPodeControlarToken_(ator))return '';
    const pend=labEstado_.pendenciaLab,dp=labEstado_.danoPendenteLab;
    const posMicro=labMicroPosicaoVertical_(alvoVisual.y*ppm,d/2,ppm,68),topBaixo=posMicro.top,left=alvoVisual.x*ppm;

    if(pend&&String(pend.defensorId)===String(alvoVisual.id)&&labPodeControlarToken_(alvoVisual)){
        const defs=labDefesasDisponiveis_(alvoVisual),c=labCharToken_(alvoVisual);
        if(defs.length&&!defs.some(x=>batalhaTokenPericia_(x)===alvoVisual.defesaLab))alvoVisual.defesaLab=batalhaTokenPericia_(defs[0]);
        const per=labPericiaPorToken_(alvoVisual,alvoVisual.defesaLab),valor=per?labValorDefesa_(c,per):0;
        return `<div class="lab-micro-actions" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" style="position:absolute;left:${left}px;top:${topBaixo}px;transform:${posMicro.transform};z-index:24;padding:4px;border-radius:8px;background:rgba(10,13,30,.96);border:1px solid rgba(255,117,117,.62);display:flex;gap:4px;white-space:nowrap;">
          <button class="btn-small btn-select" onclick="labResponderDefesa_(true)" ${Number(alvoVisual.acoesAtuaisLab||0)<=0&&Number(alvoVisual.acoesDefensivasPsiLab||0)<=0?'disabled':''} title="${escaparHtmlInventario_(per?getNome(per):'Defesa')} ${valor}%" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">🛡️ Defender</button>
          <button class="btn-small" onclick="labResponderDefesa_(false)" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">✋ Não</button>
        </div>`;
    }

    if(dp&&String(dp.defensorId)===String(alvoVisual.id)&&String(dp.atacanteId)===String(ator.id)&&Number(dp.efeitosRestantes||0)>0&&!dp.escolhendoLocalizacao){
        const efs=labEfeitosDisponiveis_(dp),top=Math.max(2,alvoVisual.y*ppm-d/2-7);
        return `<div class="lab-micro-actions" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" style="position:absolute;left:${left}px;top:${top}px;transform:translate(-50%,-100%);z-index:24;padding:4px;border-radius:8px;background:rgba(10,13,30,.97);border:1px solid rgba(255,213,74,.65);display:flex;gap:3px;flex-wrap:wrap;justify-content:center;max-width:330px;">
          ${efs.map(e=>`<button class="btn-small" onclick="labEscolherEfeito_('${e.id}')" style="min-height:21px;padding:1px 5px;font-size:.62em;line-height:1.1;">${escaparHtmlInventario_(e.nome)}</button>`).join('')}
          <button class="btn-small" onclick="labPularEfeitos_()" style="min-height:21px;padding:1px 5px;font-size:.62em;line-height:1.1;">Pular</button>
        </div>`;
    }

    if(String(labEstado_.selecionadoId||'')!==String(alvoVisual.id)||Number(ator.acoesAtuaisLab||0)<=0)return '';
    const psiCtx=labPsiPoderesParaAlvo_(ator,alvoVisual),psi=psiCtx.length>0,ps=!!labPrimeirosSocorrosPericia_(ator),modo=labMicroModo_(ator);
    const ehProprio=String(alvoVisual.id)===String(ator.id),item=labItemSelecionado_(ator),ataqueNome=item?.natural===true?(getNome(item)||'Atacar'):'Atacar';
    const podePS=ps&&labFeridasTrataveis_(alvoVisual).length>0&&(ehProprio||labDistanciaEntre_(ator,alvoVisual)<=1.5);
    return `<div class="lab-micro-actions" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" style="position:absolute;left:${left}px;top:${topBaixo}px;transform:${posMicro.transform};z-index:20;padding:4px;border-radius:8px;background:rgba(10,13,30,.95);border:1px solid rgba(126,231,255,.45);display:flex;gap:3px;align-items:center;justify-content:center;flex-wrap:wrap;max-width:310px;">
      ${!ehProprio?`<button class="btn-small btn-select" onclick="labMicroModoSelecionar_('ataque');labMicroExecutar_()" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">⚔️ ${escaparHtmlInventario_(ataqueNome)}</button>`:''}
      ${psi?psiCtx.map(p=>`<button class="btn-small lab-psi-action" onclick="${labPsiEhCura_(p)?`labAbrirPsiContextual_('${String(p.id).replace(/'/g,"\'")}','${String(alvoVisual.id).replace(/'/g,"\'")}')`:`labUsarPsiContextualRapido_('${String(p.id).replace(/'/g,"\'")}','${String(alvoVisual.id).replace(/'/g,"\'")}')`}" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">🔮 ${escaparHtmlInventario_(getNome(p))}</button>`).join(''):''}
      ${podePS?`<button class="btn-small ${modo==='socorros'?'btn-select':''}" onclick="${modo==='socorros'?'labMicroExecutar_()':"labMicroModoSelecionar_('socorros')"}" style="min-height:22px;padding:1px 5px;font-size:.64em;line-height:1.1;">🩹 ${modo==='socorros'?escaparHtmlInventario_(labMicroNomeAcao_(ator)):'Primeiros Socorros'}</button>`:''}
    </div>`;
}

let labDesenhoUndo_=[];
let labDesenhoRedo_=[];
let labMapaSelecionado_='';

function labDesenhoSnapshot_(){
    return JSON.parse(JSON.stringify(Array.isArray(labEstado_.desenhosLab)?labEstado_.desenhosLab:[]));
}
function labDesenhoRegistrarHistorico_(){
    labDesenhoUndo_.push(labDesenhoSnapshot_());
    if(labDesenhoUndo_.length>60)labDesenhoUndo_.shift();
    labDesenhoRedo_=[];
}
window.labDesenhoDesfazer_=function(){
    if(!labDesenhoUndo_.length)return;
    labDesenhoRedo_.push(labDesenhoSnapshot_());
    labEstado_.desenhosLab=labDesenhoUndo_.pop();
    labSalvarLocal_();labRender_();
};
window.labDesenhoRefazer_=function(){
    if(!labDesenhoRedo_.length)return;
    labDesenhoUndo_.push(labDesenhoSnapshot_());
    labEstado_.desenhosLab=labDesenhoRedo_.pop();
    labSalvarLocal_();labRender_();
};
window.labDesenhoBorracha_=function(){
    const c=labDesenhoConfig_();
    c.ativo=true;c.ferramenta='borracha';
    labSalvarLocal_();labRender_();
};
function labMapaSlug_(nome){
    const x=normalizarTextoCombate_(String(nome||'mapa')).replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    return x||`mapa_${Date.now()}`;
}
function labMapaDadosAtuais_(nome,id=''){
    return {
        id:id||labMapaSlug_(nome),
        nome:String(nome||'Mapa sem nome').trim()||'Mapa sem nome',
        larguraM:Number(labEstado_.larguraM||28),
        alturaM:Number(labEstado_.alturaM||14),
        fundo:String(labEstado_.fundo||'#d7d7d7'),
        corGrade:String(labEstado_.corGrade||'#777777'),
        gradeVisivel:labEstado_.gradeVisivel!==false,
        textura:String(labEstado_.textura||'nenhuma'),
        desenhos:labDesenhoSnapshot_(),
        objetos:JSON.parse(JSON.stringify(labEstado_.objetosLab||[])),
        criadoPor:currentUserUid||'',
        atualizadoEm:new Date().toISOString()
    };
}

// Mapas grandes não cabem de forma confiável em um único documento Firestore.
// O cabeçalho fica em /mapas/{id}; desenho/objetos são serializados e divididos
// em documentos irmãos /mapas/{id}__parte__0001, todos cobertos pelas mesmas regras /mapas.
const LAB_MAPA_PARTE_CHARS_=360000;
function labMapaParteId_(id,indice){return `${id}__parte__${String(indice+1).padStart(4,'0')}`;}
function labMapaSepararPayload_(dados){
    const meta={...dados};
    const payload={desenhos:meta.desenhos||[],objetos:meta.objetos||[],oficina2State:meta.oficina2State||null};
    delete meta.desenhos;delete meta.objetos;delete meta.oficina2State;delete meta.__local;
    const texto=JSON.stringify(payload),partes=[];
    for(let i=0;i<texto.length;i+=LAB_MAPA_PARTE_CHARS_)partes.push(texto.slice(i,i+LAB_MAPA_PARTE_CHARS_));
    if(!partes.length)partes.push('{}');
    return {meta:{...meta,formato:'partes-v1',partes:partes.length,tamanhoSerializado:texto.length,tipo:'mapa'},partes};
}
async function labMapaApagarPartesAntigas_(id,quantidade){
    for(let i=0;i<Number(quantidade||0);i++){
        try{await deleteDoc(doc(db,'mapas',labMapaParteId_(id,i)));}catch(e){console.warn('Não foi possível remover parte antiga do mapa',id,i,e);}
    }
}
async function labMapaSalvarFirestore_(dados,partesAntigas=0){
    const {meta,partes}=labMapaSepararPayload_(dados);
    // Grava primeiro as partes e só então publica o cabeçalho. Assim um cabeçalho nunca
    // aponta para uma gravação incompleta caso uma parte falhe.
    for(let i=0;i<partes.length;i++){
        await setDoc(doc(db,'mapas',labMapaParteId_(dados.id,i)),{tipo:'mapa-parte',mapaId:dados.id,indice:i,dados:partes[i],atualizadoEm:meta.atualizadoEm},{merge:false});
    }
    await setDoc(doc(db,'mapas',String(dados.id)),meta,{merge:false});
    if(Number(partesAntigas||0)>partes.length){
        for(let i=partes.length;i<Number(partesAntigas||0);i++){
            try{await deleteDoc(doc(db,'mapas',labMapaParteId_(dados.id,i)));}catch(e){console.warn('Parte antiga excedente',e);}
        }
    }
    return {...meta,desenhos:dados.desenhos,objetos:dados.objetos,formas:dados.formas||[],oficina2State:dados.oficina2State||null};
}
async function labMapaHidratar_(m){
    if(!m)return null;
    if(m.formato!=='partes-v1')return m;
    const n=Math.max(1,Number(m.partes||1));let texto='';
    for(let i=0;i<n;i++){
        const snap=await getDoc(doc(db,'mapas',labMapaParteId_(m.id,i)));
        if(!snap.exists())throw new Error(`Parte ${i+1}/${n} do mapa não encontrada.`);
        texto+=String(snap.data()?.dados||'');
    }
    const payload=JSON.parse(texto||'{}');
    return {...m,desenhos:Array.isArray(payload.desenhos)?payload.desenhos:[],objetos:Array.isArray(payload.objetos)?payload.objetos:[],oficina2State:payload.oficina2State||null};
}

function labMapasLocaisLer_(){try{return JSON.parse(localStorage.getItem('mesa_estelar_mapas_locais_v1')||'[]')||[];}catch(_){return [];}}
function labMapasLocaisSalvar_(lista){try{localStorage.setItem('mesa_estelar_mapas_locais_v1',JSON.stringify(lista||[]));return true;}catch(_){return false;}}
function labMesclarMapasLocais_(){const ids=new Set((mapasDB||[]).map(m=>String(m.id)));for(const m of labMapasLocaisLer_())if(!ids.has(String(m.id)))mapasDB.push({...m,__local:true});}
labMesclarMapasLocais_();
function labAtualizarSelectMapas_(){
    const sel=document.getElementById('labMapaSalvoSelect');if(!sel)return;
    const atual=String(labMapaSelecionado_||sel.value||'');
    const lista=[...(mapasDB||[])].filter(m=>!m?.hiddenMesaLive&&!String(m?.id||'').startsWith('__mesa_live__')).sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'}));
    sel.innerHTML='<option value="">— nenhum —</option>'+lista.map(m=>`<option value="${escaparHtmlInventario_(m.id)}">${m.__local?'💻 ':''}${escaparHtmlInventario_(m.nome||m.id)}</option>`).join('');
    if(lista.some(m=>String(m.id)===atual)){sel.value=atual;labMapaSelecionado_=atual;}
    else {sel.value='';labMapaSelecionado_='';}
}
window.labSelecionarMapaSalvo_=function(id){
    labMapaSelecionado_=String(id||'');
    if(labMapaSelecionado_){
        labEstado_.mapaCompartilhadoIdE7=labMapaSelecionado_;
        labEstado_.mapaCompartilhadoRevE7=Date.now();
    }
};
async function labPersistirMapaNovo_(nome){
    nome=String(nome||'').trim();if(!nome)return null;
    let id=labMapaSlug_(nome),base=id,n=2;while((mapasDB||[]).some(m=>String(m.id)===String(id)))id=`${base}_${n++}`;
    const dados=labMapaDadosAtuais_(nome,id);
    try{
        const salvo=await labMapaSalvarFirestore_(dados,0);
        mapasDB.push(salvo);labMapaSelecionado_=id;labAtualizarSelectMapas_();
        if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();
        notificar_(`Novo mapa “${dados.nome}” salvo.`,'sucesso',4200);return salvo;
    }catch(e){
        console.error('Falha ao salvar mapa no Firestore',e);
        const locais=labMapasLocaisLer_(),local={...dados,__local:true};locais.push(local);
        if(labMapasLocaisSalvar_(locais)){
            mapasDB.push(local);labMapaSelecionado_=id;labAtualizarSelectMapas_();if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();
            notificar_(`Firestore falhou; “${dados.nome}” foi salvo localmente neste navegador.`,'aviso',6500);return local;
        }
        notificar_('Não foi possível salvar o mapa. O navegador também ficou sem espaço local. Veja o console para o erro do Firestore.','erro',7500);return null;
    }
}
window.labSalvarMapaComoNovo_=async function(){if(!batalhaEhMestre_())return;const nome=prompt('Nome para o novo mapa:','');if(nome==null||!String(nome).trim())return;await labPersistirMapaNovo_(nome);};
window.labSalvarMapaBanco_=async function(){
    if(!batalhaEhMestre_())return;
    const existente=(mapasDB||[]).find(m=>String(m.id)===String(labMapaSelecionado_));
    if(!existente){const nome=prompt('Nenhum mapa está selecionado. Nome para criar um novo mapa:','');if(nome==null||!String(nome).trim())return;await labPersistirMapaNovo_(nome);return;}
    const nome=prompt('Nome do mapa:',existente.nome||'');if(nome==null||!String(nome).trim())return;
    const dados=labMapaDadosAtuais_(nome,existente.id);
    try{
        const salvo=await labMapaSalvarFirestore_(dados,Number(existente.partes||0));
        const ix=mapasDB.findIndex(m=>String(m.id)===String(existente.id));if(ix>=0)mapasDB[ix]=salvo;
        labMapaSelecionado_=String(existente.id);labAtualizarSelectMapas_();if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();
        notificar_(`Alterações de “${dados.nome}” salvas.`,'sucesso',4200);
    }catch(e){
        console.error('Falha ao salvar alterações do mapa',e);
        const locais=labMapasLocaisLer_(),ix=locais.findIndex(m=>String(m.id)===String(existente.id)),local={...dados,__local:true};
        if(ix>=0)locais[ix]=local;else locais.push(local);
        if(labMapasLocaisSalvar_(locais)){
            const j=mapasDB.findIndex(m=>String(m.id)===String(existente.id));if(j>=0)mapasDB[j]=local;else mapasDB.push(local);
            labMapaSelecionado_=String(existente.id);labAtualizarSelectMapas_();if(typeof renderizarBancoMapas_==='function')renderizarBancoMapas_();
            notificar_(`Firestore falhou; alterações de “${dados.nome}” foram salvas localmente.`,'aviso',6500);
        }else notificar_('Não foi possível salvar o mapa. O navegador também ficou sem espaço local. Veja o console para o erro do Firestore.','erro',7500);
    }
};
window.labCarregarMapaBanco_=async function(){
    const m0=(mapasDB||[]).find(x=>String(x.id)===String(labMapaSelecionado_));
    if(!m0){notificar_('Selecione um mapa salvo.','aviso');return;}
    let m=m0;try{m=await labMapaHidratar_(m0);}catch(e){console.error('Carregar partes do mapa',e);notificar_('Não foi possível carregar os dados completos deste mapa.','erro',6000);return;}
    if((labEstado_.desenhosLab||[]).length&&!confirm(`Carregar “${m.nome}”? O terreno/desenho atual será substituído. Os participantes não serão removidos.`))return;
    labEstado_.larguraM=Math.max(4,Number(m.larguraM||28));
    labEstado_.alturaM=Math.max(4,Number(m.alturaM||14));
    labEstado_.fundo=String(m.fundo||'#d7d7d7');
    labEstado_.corGrade=String(m.corGrade||'#777777');
    labEstado_.gradeVisivel=m.gradeVisivel!==false;
    labEstado_.textura=String(m.textura||'nenhuma');
    labEstado_.oficina2State=m.oficina2State?JSON.parse(JSON.stringify(m.oficina2State)):null;
    if(m.oficina2State&&m.pxPorMetro)labEstado_.pxPorMetro=Number(m.pxPorMetro)||labEstado_.pxPorMetro;
    labEstado_.desenhosLab=m.oficina2State?[]:JSON.parse(JSON.stringify(m.desenhos||[]));
    labEstado_.formasLab=m.oficina2State?[]:JSON.parse(JSON.stringify(m.formas||[]));
    labEstado_.objetosLab=JSON.parse(JSON.stringify(m.objetos||[])).filter(o=>!m.oficina2State||!o.imagemImportada);
    labEstado_.objetoSelecionadoId='';
    // Mantém tokens, combate, PV e iniciativa. O terreno e os objetos de cenário são trocados.
    for(const t of labEstado_.tokens||[]){
        t.x=Math.max(0,Math.min(labEstado_.larguraM,Number(t.x||0)));
        t.y=Math.max(0,Math.min(labEstado_.alturaM,Number(t.y||0)));
    }
    labDesenhoUndo_=[];labDesenhoRedo_=[];
    labSalvarLocal_();labRender_();
    notificar_(`Mapa “${m.nome}” carregado.`,'info',3500);
};
window.labExcluirMapaBanco_=async function(){
    if(!batalhaEhMestre_())return;
    const m=(mapasDB||[]).find(x=>String(x.id)===String(labMapaSelecionado_));
    if(!m){notificar_('Selecione um mapa salvo.','aviso');return;}
    if(!confirm(`Excluir permanentemente o mapa “${m.nome}” do banco?`))return;
    try{
        if(!m.__local)await labMapaApagarPartesAntigas_(m.id,Number(m.partes||0));
        await deleteDoc(doc(db,'mapas',String(m.id)));
        mapasDB=mapasDB.filter(x=>String(x.id)!==String(m.id));
        labMapaSelecionado_='';labAtualizarSelectMapas_();
        notificar_(`Mapa “${m.nome}” excluído.`,'info');
    }catch(e){
        console.error('Excluir mapa',e);
        notificar_('Não foi possível excluir o mapa do banco.','erro');
    }
};
function labDesenhoConfig_(){
    labEstado_.desenhoCfg=labEstado_.desenhoCfg||{ativo:false,ferramenta:'traco',cor:'#ffcf4d',tamanho:7,opacidade:1,pincel:'redondo',texturaTraco:'solida'};
    const dc=labEstado_.desenhoCfg;
    if(!Number.isFinite(Number(dc.opacidade)))dc.opacidade=1;
    dc.opacidade=Math.max(.05,Math.min(1,Number(dc.opacidade)));
    if(!['redondo','quadrado','spray','irregular','caligrafico'].includes(dc.pincel))dc.pincel='redondo';
    if(!['solida','pontilhada','giz','ranhura','areia','cascalho','grama','folhas','neve','fumaca'].includes(dc.texturaTraco))dc.texturaTraco='solida';
    labEstado_.desenhosLab=Array.isArray(labEstado_.desenhosLab)?labEstado_.desenhosLab:[];
    return labEstado_.desenhoCfg;
}
window.labDesenhoAlternar_=function(){const c=labDesenhoConfig_();if(c.ferramenta==='borracha')c.ferramenta='traco';c.ativo=!c.ativo;if(c.ativo){labEstado_.objetoSelecionadoId='';labRenderObjetoPainel_();}labSalvarLocal_();labRender_();};
window.labDesenhoFerramenta_=function(v){const c=labDesenhoConfig_();c.ferramenta=String(v||'traco');c.ativo=true;labEstado_.objetoSelecionadoId='';labRenderObjetoPainel_();labSalvarLocal_();labRender_();};
function labCorHexParaRgb_(hex){
    const h=String(hex||'').trim().replace('#','');
    if(!/^[0-9a-fA-F]{6}$/.test(h))return null;
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
function labCorRgbParaHex_(r,g,b){
    const c=n=>Math.max(0,Math.min(255,Math.round(Number(n)||0))).toString(16).padStart(2,'0');
    return `#${c(r)}${c(g)}${c(b)}`;
}
window.labDesenhoCor_=function(v){labDesenhoConfig_().cor=String(v||'#ffcf4d');labSalvarLocal_();labRender_();};
window.labDesenhoCorRGB_=function(v){
    const partes=String(v||'').trim().split(/[\s,;\/]+/).filter(Boolean);
    if(partes.length!==3)return;
    const nums=partes.map(Number);
    if(nums.some(n=>!Number.isFinite(n)||n<0||n>255))return;
    const cor=labCorRgbParaHex_(nums[0],nums[1],nums[2]);
    labDesenhoConfig_().cor=cor;
    const picker=document.getElementById('labDrawColor');if(picker)picker.value=cor;
    labSalvarLocal_();
    labDesenhoRender_();
};
window.labDesenhoTamanho_=function(v){labDesenhoConfig_().tamanho=Math.max(2,Math.min(34,Number(v)||7));labSalvarLocal_();};
window.labDesenhoOpacidade_=function(v){const c=labDesenhoConfig_();c.opacidade=Math.max(.05,Math.min(1,(Number(v)||100)/100));const out=document.getElementById('labDrawOpacityValue');if(out)out.textContent=`${Math.round(c.opacidade*100)}%`;labSalvarLocal_();};
window.labDesenhoPincel_=function(v){const c=labDesenhoConfig_();c.pincel=['redondo','quadrado','spray','irregular','caligrafico'].includes(String(v))?String(v):'redondo';c.ativo=true;labSalvarLocal_();labRender_();};
window.labDesenhoTexturaTraco_=function(v){const c=labDesenhoConfig_();const t=String(v||'solida');c.texturaTraco=['solida','pontilhada','giz','ranhura','areia','cascalho','grama','folhas','neve','fumaca'].includes(t)?t:'solida';c.ativo=true;labSalvarLocal_();labRender_();};
window.labDesenhoLimpar_=function(){
    if(!batalhaEhMestre_())return;
    if(!labEstado_.desenhosLab?.length)return;
    if(confirm('Apagar todos os desenhos do mapa? Você ainda poderá usar ↶ para desfazer.')){
        labDesenhoRegistrarHistorico_();
        labEstado_.desenhosLab=[];labSalvarLocal_();labRender_();
    }
};
function labDesenhoRand_(n){
    const x=Math.sin(Number(n||0)*12.9898+78.233)*43758.5453;
    return x-Math.floor(x);
}

function labDesenhoAplicarTextura_(ctx,texture,pts,inicio,size,color,ppm,brush='redondo'){
    const a=Math.max(0,Number(inicio)||0);
    if(texture==='solida')return false;
    const spread=brush==='spray'?1.15:brush==='irregular' ? .95 : brush==='caligrafico' ? .48 : brush==='quadrado' ? .70 : .72;
    const passo=Math.max(1,Math.round(Math.max(1,size*.20)));
    // Mantém a mesma fase da textura tanto no desenho incremental quanto na recomposição final.
    // Antes, cada frame recomeçava o espaçamento em `inicio`, então durante o arraste apareciam
    // muitos tufos/folhas; ao soltar, a renderização completa usava outra fase e quase tudo sumia.
    const inicioAlinhado=(stride)=>{stride=Math.max(1,Math.floor(stride||1));return a+((stride-(a%stride))%stride);};
    const jitter=(j,k,esc=1)=>({
        x:(labDesenhoRand_(j*83+k*29)-.5)*size*spread*esc,
        y:(labDesenhoRand_(j*131+k*17)-.5)*size*spread*esc
    });
    if(texture==='pontilhada'){
        for(let j=inicioAlinhado(Math.max(1,passo));j<pts.length;j+=Math.max(1,passo)){const p=pts[j];ctx.beginPath();ctx.arc(p.x*ppm,p.y*ppm,Math.max(1.2,size*.24),0,Math.PI*2);ctx.fill();}
        return true;
    }
    if(texture==='giz'){
        // Giz = faixa contínua, seca e fibrosa. Não usa nuvem radial como o spray.
        // Faz várias fibras longitudinais com pequenas falhas e um pouco de pó nas bordas.
        const p0=pts[Math.max(0,a-1)]||pts[0];
        ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
        ctx.globalAlpha*=.30;ctx.lineWidth=Math.max(1,size*.78);
        ctx.beginPath();ctx.moveTo(p0.x*ppm,p0.y*ppm);for(let j=a;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);ctx.stroke();
        ctx.restore();
        const fibras=Math.max(5,Math.min(16,Math.round(size*.8)));
        for(let k=0;k<fibras;k++){
            const off=(k/(Math.max(1,fibras-1))-.5)*size*.82;
            ctx.save();ctx.lineCap='butt';ctx.lineJoin='round';ctx.lineWidth=Math.max(.55,size*(.035+.025*labDesenhoRand_(k+17)));
            ctx.globalAlpha*=.25+.35*labDesenhoRand_(k*31+9);
            let aberto=false;ctx.beginPath();
            for(let j=Math.max(1,a);j<pts.length;j++){
                const p=pts[j],q=pts[j-1],dx=(p.x-q.x)*ppm,dy=(p.y-q.y)*ppm,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
                const falha=labDesenhoRand_(j*103+k*47)<.16;
                const jitterLong=(labDesenhoRand_(j*59+k*13)-.5)*size*.10;
                const x=p.x*ppm+nx*(off+jitterLong),y=p.y*ppm+ny*(off+jitterLong);
                if(falha){aberto=false;continue;}
                if(!aberto){ctx.moveTo(x,y);aberto=true;}else ctx.lineTo(x,y);
            }
            ctx.stroke();ctx.restore();
        }
        // grãos pequenos apenas nas bordas, bem menos dispersos que o spray
        const stride=Math.max(2,Math.round(size*.28));
        for(let j=inicioAlinhado(stride);j<pts.length;j+=stride){
            const p=pts[j],n=Math.max(2,Math.round(size*.18));
            for(let k=0;k<n;k++){
                const side=labDesenhoRand_(j*41+k*19)<.5?-1:1;
                const ang=(labDesenhoRand_(j*67+k*23)-.5)*Math.PI*2;
                const rr=size*(.34+.16*labDesenhoRand_(j*71+k*11));
                const x=p.x*ppm+Math.cos(ang)*rr*side,y=p.y*ppm+Math.sin(ang)*rr;
                ctx.save();ctx.globalAlpha*=.18+.24*labDesenhoRand_(j*89+k*7);ctx.beginPath();ctx.arc(x,y,Math.max(.45,size*.025),0,Math.PI*2);ctx.fill();ctx.restore();
            }
        }
        return true;
    }
    if(texture==='ranhura'){
        ctx.save();ctx.globalAlpha*=.55;ctx.lineWidth=Math.max(1,size*.16);ctx.lineCap='butt';
        for(let j=Math.max(1,inicioAlinhado(Math.max(1,passo)));j<pts.length;j+=Math.max(1,passo)){
            const p=pts[j],q=pts[j-1],ang=Math.atan2((p.y-q.y)*ppm,(p.x-q.x)*ppm)+Math.PI/2,cx=p.x*ppm,cy=p.y*ppm,len=size*(.70+spread*.35);
            ctx.beginPath();ctx.moveTo(cx-Math.cos(ang)*len/2,cy-Math.sin(ang)*len/2);ctx.lineTo(cx+Math.cos(ang)*len/2,cy+Math.sin(ang)*len/2);ctx.stroke();
        }
        ctx.restore();return true;
    }
    if(texture==='areia'){
        for(let j=inicioAlinhado(Math.max(1,passo));j<pts.length;j+=Math.max(1,passo)){const p=pts[j],n=Math.max(6,Math.round(size*.9));for(let k=0;k<n;k++){const q=jitter(j,k,1.25),r=Math.max(.45,size*.035);ctx.beginPath();ctx.arc(p.x*ppm+q.x,p.y*ppm+q.y,r,0,Math.PI*2);ctx.fill();}}return true;
    }
    if(texture==='cascalho'){
        for(let j=inicioAlinhado(Math.max(1,passo*2));j<pts.length;j+=Math.max(1,passo*2)){const p=pts[j],n=Math.max(3,Math.round(size*.28));for(let k=0;k<n;k++){const q=jitter(j,k,1.05),rr=Math.max(1.1,size*(.07+.08*labDesenhoRand_(j*89+k*41)));ctx.save();ctx.rotate(0);ctx.beginPath();ctx.ellipse(p.x*ppm+q.x,p.y*ppm+q.y,rr,rr*(.55+.35*labDesenhoRand_(j+k+5)),0,0,Math.PI*2);ctx.stroke();ctx.restore();}}return true;
    }
    if(texture==='grama'){
        ctx.save();ctx.lineWidth=Math.max(.8,size*.075);ctx.lineCap='round';
        for(let j=inicioAlinhado(Math.max(1,passo*2));j<pts.length;j+=Math.max(1,passo*2)){const p=pts[j],n=Math.max(2,Math.round(size*.22));for(let k=0;k<n;k++){const q=jitter(j,k,.9),cx=p.x*ppm+q.x,cy=p.y*ppm+q.y,len=Math.max(2,size*(.35+.25*labDesenhoRand_(j*97+k*17))),lean=(labDesenhoRand_(j*79+k*31)-.5)*.9;for(const off of [-.20,0,.20]){const ang=-Math.PI/2+lean+off;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);ctx.stroke();}}}
        ctx.restore();return true;
    }
    if(texture==='folhas'){
        for(let j=inicioAlinhado(Math.max(1,passo*2));j<pts.length;j+=Math.max(1,passo*2)){const p=pts[j],n=Math.max(3,Math.round(size*.30));for(let k=0;k<n;k++){const q=jitter(j,k,1.0),rx=Math.max(1.8,size*.16),ry=Math.max(1,size*.075),ang=labDesenhoRand_(j*53+k*29)*Math.PI;ctx.save();ctx.translate(p.x*ppm+q.x,p.y*ppm+q.y);ctx.rotate(ang);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha*=.55;ctx.lineWidth=Math.max(.45,size*.035);ctx.beginPath();ctx.moveTo(-rx*.65,0);ctx.lineTo(rx*.65,0);ctx.stroke();ctx.restore();}}return true;
    }
    if(texture==='neve'){
        for(let j=inicioAlinhado(Math.max(1,passo*2));j<pts.length;j+=Math.max(1,passo*2)){const p=pts[j],n=Math.max(4,Math.round(size*.42));for(let k=0;k<n;k++){const q=jitter(j,k,1.05),rr=Math.max(1.2,size*(.075+.07*labDesenhoRand_(j*109+k*13)));ctx.save();ctx.globalAlpha*=.55+.35*labDesenhoRand_(j+k+9);ctx.beginPath();ctx.arc(p.x*ppm+q.x,p.y*ppm+q.y,rr,0,Math.PI*2);ctx.fill();ctx.restore();}}return true;
    }
    if(texture==='fumaca'){
        for(let j=inicioAlinhado(Math.max(1,passo*3));j<pts.length;j+=Math.max(1,passo*3)){const p=pts[j],n=Math.max(2,Math.round(size*.16));for(let k=0;k<n;k++){const q=jitter(j,k,.9),rr=Math.max(3,size*(.28+.20*labDesenhoRand_(j*41+k*31)));ctx.save();ctx.globalAlpha*=.10+.18*labDesenhoRand_(j*97+k*7);ctx.beginPath();ctx.arc(p.x*ppm+q.x,p.y*ppm+q.y,rr,0,Math.PI*2);ctx.fill();ctx.restore();}}return true;
    }
    return false;
}
function labDesenhoRender_(){
    if(labReducing_)return;
    const cv=document.getElementById('labDrawCanvas'),map=document.getElementById('labMetricMap');if(!cv||!map)return;
    const ppm=Number(labEstado_.pxPorMetro||48),w=Math.round(labEstado_.larguraM*ppm),h=Math.round(labEstado_.alturaM*ppm);
    cv.width=w;cv.height=h;cv.style.width=`${w}px`;cv.style.height=`${h}px`;
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
    for(const st of labEstado_.desenhosLab||[]){
        const pts=Array.isArray(st.pts)?st.pts:[];if(pts.length<1)continue;
        const tool=st.tool||'traco',size=Math.max(1,Number(st.size||6)),color=st.color||'#ffcf4d';
        const opacity=Math.max(.02,Math.min(1,Number(st.opacity??st.opacidade??(tool==='textura'?.38:1))));
        const brush=['redondo','quadrado','spray','irregular','caligrafico'].includes(st.brush||st.pincel)?(st.brush||st.pincel):(tool==='textura'?'spray':'redondo');
        const texture=['solida','pontilhada','giz','ranhura','areia','cascalho','grama','folhas','neve','fumaca'].includes(st.texture||st.texturaTraco)?(st.texture||st.texturaTraco):'solida';
        ctx.save();
        if(tool==='borracha'){
            ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.strokeStyle='rgba(0,0,0,1)';ctx.lineWidth=size;
            ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);ctx.stroke();ctx.restore();continue;
        }
        ctx.globalAlpha=opacity;ctx.fillStyle=color;ctx.strokeStyle=color;
        if(texture!=='solida'){
            labDesenhoAplicarTextura_(ctx,texture,pts,0,size,color,ppm,brush);
        }else if(brush==='spray'){
            for(let j=0;j<pts.length;j+=1){
                const p=pts[j],cx=p.x*ppm,cy=p.y*ppm,dots=Math.max(4,Math.round(size*.8));
                for(let k=0;k<dots;k++){
                    const a=labDesenhoRand_(j*97+k*13)*Math.PI*2,r=Math.sqrt(labDesenhoRand_(j*193+k*29))*size*.8;
                    const rr=Math.max(.7,size*(.045+.08*labDesenhoRand_(j*71+k*41)));
                    ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,rr,0,Math.PI*2);ctx.fill();
                }
            }
        }else if(brush==='irregular'){
            ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';
            ctx.beginPath();
            for(let j=0;j<pts.length;j++){
                const wob=size*.70,ox=(labDesenhoRand_(j*151+3)-.5)*wob,oy=(labDesenhoRand_(j*211+9)-.5)*wob,x=pts[j].x*ppm+ox,y=pts[j].y*ppm+oy;
                if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
            }
            if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);ctx.stroke();
            for(let j=0;j<pts.length;j+=2){const rr=Math.max(1,size*(.18+.2*labDesenhoRand_(j+17)));ctx.beginPath();ctx.arc(pts[j].x*ppm+(labDesenhoRand_(j+31)-.5)*size*.65,pts[j].y*ppm+(labDesenhoRand_(j+47)-.5)*size*.65,rr,0,Math.PI*2);ctx.fill();}
        }else if(brush==='quadrado'){
            for(let j=0;j<pts.length;j++){const p=pts[j];ctx.fillRect(p.x*ppm-size/2,p.y*ppm-size/2,size,size);}
        }else if(brush==='caligrafico'){
            ctx.lineWidth=Math.max(1,size*.42);ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);ctx.stroke();
        }else{
            ctx.lineWidth=size;ctx.beginPath();ctx.moveTo(pts[0].x*ppm,pts[0].y*ppm);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);ctx.stroke();
        }
        ctx.restore();
    }
}
// v46.32.2 — pintura otimizada: durante um traço, desenhamos apenas o trecho novo.
// O mapa completo só é recomposto ao finalizar o traço ou quando realmente necessário.
let labDesenhoRaf_=0;
function labDesenhoRenderTrecho_(st,inicio){
    if(labReducing_)return;
    const cv=document.getElementById('labDrawCanvas');if(!cv)return;
    const ctx=cv.getContext('2d'),ppm=Number(labEstado_.pxPorMetro||48),pts=Array.isArray(st?.pts)?st.pts:[];
    if(!pts.length)return;
    const tool=st.tool||'traco',size=Math.max(1,Number(st.size||6)),color=st.color||'#ffcf4d';
    const opacity=Math.max(.02,Math.min(1,Number(st.opacity??st.opacidade??(tool==='textura'?.38:1))));
    const brush=['redondo','quadrado','spray','irregular','caligrafico'].includes(st.brush||st.pincel)?(st.brush||st.pincel):(tool==='textura'?'spray':'redondo');
    const texture=['solida','pontilhada','giz','ranhura','areia','cascalho','grama','folhas','neve','fumaca'].includes(st.texture||st.texturaTraco)?(st.texture||st.texturaTraco):'solida';
    const a=Math.max(0,Math.min(pts.length-1,Number(inicio)||0));
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(tool==='borracha'){
        ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.strokeStyle='rgba(0,0,0,1)';ctx.lineWidth=size;
        const p0=pts[Math.max(0,a-1)];ctx.beginPath();ctx.moveTo(p0.x*ppm,p0.y*ppm);
        for(let j=a;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);
        if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);ctx.stroke();ctx.restore();return;
    }
    ctx.globalAlpha=opacity;ctx.fillStyle=color;ctx.strokeStyle=color;
    if(texture!=='solida'){
        labDesenhoAplicarTextura_(ctx,texture,pts,a,size,color,ppm,brush);
    }else if(brush==='spray'){
        for(let j=a;j<pts.length;j++){
            const p=pts[j],cx=p.x*ppm,cy=p.y*ppm,dots=Math.max(4,Math.round(size*.8));
            for(let k=0;k<dots;k++){
                const ang=labDesenhoRand_(j*97+k*13)*Math.PI*2,r=Math.sqrt(labDesenhoRand_(j*193+k*29))*size*.8;
                const rr=Math.max(.7,size*(.045+.08*labDesenhoRand_(j*71+k*41)));
                ctx.beginPath();ctx.arc(cx+Math.cos(ang)*r,cy+Math.sin(ang)*r,rr,0,Math.PI*2);ctx.fill();
            }
        }
    }else if(brush==='irregular'){
        ctx.lineWidth=size;
        const j0=Math.max(0,a-1),p0=pts[j0],wob=size*.70;
        const ox0=(labDesenhoRand_(j0*151+3)-.5)*wob,oy0=(labDesenhoRand_(j0*211+9)-.5)*wob;
        ctx.beginPath();ctx.moveTo(p0.x*ppm+ox0,p0.y*ppm+oy0);
        for(let j=Math.max(a,1);j<pts.length;j++){
            const ox=(labDesenhoRand_(j*151+3)-.5)*wob,oy=(labDesenhoRand_(j*211+9)-.5)*wob;
            ctx.lineTo(pts[j].x*ppm+ox,pts[j].y*ppm+oy);
        }
        if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);ctx.stroke();
        for(let j=a;j<pts.length;j+=2){const rr=Math.max(1,size*(.18+.2*labDesenhoRand_(j+17)));ctx.beginPath();ctx.arc(pts[j].x*ppm+(labDesenhoRand_(j+31)-.5)*size*.65,pts[j].y*ppm+(labDesenhoRand_(j+47)-.5)*size*.65,rr,0,Math.PI*2);ctx.fill();}
    }else if(brush==='quadrado'){
        for(let j=a;j<pts.length;j++){const p=pts[j];ctx.fillRect(p.x*ppm-size/2,p.y*ppm-size/2,size,size);}
    }else if(brush==='caligrafico'){
        ctx.lineWidth=Math.max(1,size*.42);ctx.lineCap='butt';const p0=pts[Math.max(0,a-1)];ctx.beginPath();ctx.moveTo(p0.x*ppm,p0.y*ppm);for(let j=a;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);ctx.stroke();
    }else{
        ctx.lineWidth=size;const p0=pts[Math.max(0,a-1)];ctx.beginPath();ctx.moveTo(p0.x*ppm,p0.y*ppm);
        for(let j=a;j<pts.length;j++)ctx.lineTo(pts[j].x*ppm,pts[j].y*ppm);
        if(pts.length===1)ctx.lineTo(pts[0].x*ppm+.1,pts[0].y*ppm+.1);ctx.stroke();
    }
    ctx.restore();
}
window.labDesenhoPointerDown_=function(ev){
    const cfg=labDesenhoConfig_();if(!cfg.ativo||!batalhaEhMestre_())return;
    ev.preventDefault();ev.stopPropagation();labEstado_.objetoSelecionadoId='';labRenderObjetoPainel_();
    const map=document.getElementById('labMetricMap'),rect=map.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48);
    const ponto=e=>({x:Math.max(0,Math.min(labEstado_.larguraM,(e.clientX-rect.left)/ppm)),y:Math.max(0,Math.min(labEstado_.alturaM,(e.clientY-rect.top)/ppm))});
    labDesenhoRegistrarHistorico_();
    const stroke={tool:cfg.ferramenta,color:cfg.cor,size:cfg.tamanho,opacity:cfg.opacidade,brush:cfg.pincel,texture:cfg.texturaTraco,pts:[ponto(ev)]};
    labEstado_.desenhosLab.push(stroke);
    let renderizadoAte=0;
    const agendar=()=>{
        if(labDesenhoRaf_)return;
        labDesenhoRaf_=requestAnimationFrame(()=>{labDesenhoRaf_=0;const ini=renderizadoAte;renderizadoAte=stroke.pts.length;labDesenhoRenderTrecho_(stroke,ini);});
    };
    agendar();
    const move=e=>{
        const p=ponto(e),ant=stroke.pts[stroke.pts.length-1];
        const dx=(p.x-ant.x)*ppm,dy=(p.y-ant.y)*ppm;
        // Descarta micro-movimentos: reduz drasticamente pontos sem alterar visualmente o traço.
        const minPx=Math.max(1.5,Math.min(4,Number(cfg.tamanho||7)*.12));
        if(dx*dx+dy*dy<minPx*minPx)return;
        stroke.pts.push(p);agendar();
    };
    const up=()=>{
        window.removeEventListener('pointermove',move);
        if(labDesenhoRaf_){cancelAnimationFrame(labDesenhoRaf_);labDesenhoRaf_=0;}
        if(renderizadoAte<stroke.pts.length)labDesenhoRenderTrecho_(stroke,renderizadoAte);
        labGuardarUltimaConstrucao_('desenho',stroke);labSalvarLocal_();labRender_();
    };
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up,{once:true});
};

function labAdicionarFloat_(t,valor,tipo='dano'){
    if(!t||!Number(valor))return;
    labEstado_.floatsLab=Array.isArray(labEstado_.floatsLab)?labEstado_.floatsLab:[];
    const id=`f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    labEstado_.floatsLab.push({id,tokenId:String(t.id),valor:Number(valor),tipo});
    setTimeout(()=>{labEstado_.floatsLab=(labEstado_.floatsLab||[]).filter(x=>x.id!==id);document.querySelector(`[data-lab-float="${id}"]`)?.remove();},1450);
}
function labFloatHtml_(f,ppm){
    const t=labTokenPorId_(f.tokenId)||labObjetoPorId_(f.tokenId);if(!t)return '';
    const cura=f.tipo==='cura'||Number(f.valor)>0,txt=`${cura?'+':'−'}${Math.abs(Number(f.valor))}`;
    return `<div data-lab-float="${f.id}" style="position:absolute;left:${t.x*ppm}px;top:${t.y*ppm-8}px;transform:translate(-50%,-50%);z-index:40;pointer-events:none;font-size:25px;font-weight:900;color:${cura?'#56f08a':'#ff5252'};text-shadow:0 2px 5px #000;animation:labFloatUp 1.4s ease-out forwards;">${txt}</div>`;
}
if(!document.getElementById('labFloatStyle')){const st=document.createElement('style');st.id='labFloatStyle';st.textContent='@keyframes labFloatUp{0%{opacity:0;transform:translate(-50%,-20%) scale(.8)}15%{opacity:1;transform:translate(-50%,-55%) scale(1.12)}100%{opacity:0;transform:translate(-50%,-155%) scale(.95)}}';document.head.appendChild(st);}
window.labAlternarModoCriacaoMapa_=function(ativo){
    if(!batalhaEhMestre_())return;
    labEstado_.modoCriacaoMapa=!!ativo;
    if(!ativo){const cfg=labDesenhoConfig_();if(cfg.ativo)cfg.ativo=false;}
    labSalvarLocal_();labAtualizarModoCriacaoMapa_();labRender_();
};
function labAtualizarModoCriacaoMapa_(){
    const mestre=batalhaEhMestre_(),on=mestre&&!!labEstado_.modoCriacaoMapa;
    const box=document.getElementById('labMapCreationControls'),ck=document.getElementById('labModoCriarMapa');
    const wrap=document.getElementById('labEditMapToggleWrap'),game=document.getElementById('labMasterGameControls'),loader=document.getElementById('labMasterMapLoader');
    if(box)box.style.display=on?'flex':'none';if(ck)ck.checked=on;
    if(wrap)wrap.style.display=mestre?'flex':'none';if(game)game.style.display=mestre?'flex':'none';if(loader)loader.style.display=mestre?'flex':'none';
}
let labParticipanteSelectSig_='';
function labAtualizarParticipantesSelect_(){
    const sel=document.getElementById('labParticipanteSelect');if(!sel||!batalhaEhMestre_())return;
    const atual=sel.value,emMesa=new Set((labEstado_.tokens||[]).map(t=>String(t.origemId||t.id)));
    const pcs=(userCharacters||[]).filter(c=>!emMesa.has(String(c.id))).map(c=>({v:`pc:${c.id}`,n:c.nome||'Sem nome',g:'Personagens'}));
    const ns=(npcsDB||[]).filter(n=>n.selecionavelCombate!==false).map(n=>({v:`npc:${n.id}`,n:n.nome||'NPC',g:'NPCs'}));
    const cs=(criaturasDB||[]).filter(c=>c.selecionavelCombate!==false).map(c=>({v:`criatura:${c.id}`,n:c.nome||'Criatura',g:'Criaturas'}));
    const grupos=[['Personagens',pcs],['NPCs',ns],['Criaturas',cs]];
    const sig=JSON.stringify(grupos.map(([g,l])=>[g,l.map(x=>x.v)]));if(sig===labParticipanteSelectSig_)return;labParticipanteSelectSig_=sig;
    sel.innerHTML='<option value="">— personagem / NPC / criatura —</option>'+grupos.filter(x=>x[1].length).map(([g,l])=>`<optgroup label="${escaparHtmlInventario_(g)}">${l.map(x=>`<option value="${escaparHtmlInventario_(x.v)}">${escaparHtmlInventario_(x.n)}</option>`).join('')}</optgroup>`).join('');
    if([...sel.options].some(o=>o.value===atual))sel.value=atual;
}
function labTokenDeCharDireto_(c,origemId,i=0){
    const p={id:String(c.id||origemId),nome:String(c.nome||'Participante'),imagem:String(c.imagem||''),tipo:String(c.tipo||''),donoUid:String(c.donoUid||c.dono||'')};
    const mov=labHeuristicaMovimento_(p,c),max=Math.max(0,Number(obterPAMaxCombate_(c)||2));
    return {id:String(c.id||`lab:${Date.now()}:${Math.random().toString(36).slice(2,7)}`),origemId:String(origemId||c.id||''),nome:p.nome,imagem:p.imagem,tipo:p.tipo,donoUid:p.donoUid,
        x:Math.min(labEstado_.larguraM-1,1.5+(i%8)*2.5),y:Math.min(labEstado_.alturaM-1,1.5+Math.floor(i/8)*2.5),diametroM:labTamanhoTokenM_(c),angulo:0,attrs:c?.atributos?JSON.parse(JSON.stringify(c.atributos)):{},
        acoesMaxLab:max,acoesAtuaisLab:max,movimentoGratisDisponivel:mov.terra>0||mov.voo>0||mov.nat>0,movimentoTerrestre:mov.terra,movimentoVoo:mov.voo,movimentoNatacao:mov.nat,
        modoMovimento:mov.terra>0?'terrestre':mov.voo>0?'voo':mov.nat>0?'natacao':'imovel',alcanceAtaqueMax:labAlcanceMax_(c),iniciativaLab:null,
        iniciativaBonus:Math.floor((Number(c?.atributos?.INT||10)+Number(c?.atributos?.DES||10))/2),combateLab:labCriarSnapshotCombate_(c),charLab:labSnapshotChar_(c),psiGastosLab:Math.max(0,Math.floor(Number(c?.pontosMagiaGastos||0)))};
}

window.labRetirarParticipanteSelecionado_=function(){
    if(!batalhaEhMestre_())return;
    const id=String(labEstado_.selecionadoId||'');
    const t=labTokenPorId_(id);
    if(!t){notificar_('Selecione primeiro o jogador, NPC ou criatura que deseja retirar da grid.','aviso');return;}
    if(!confirm(`Retirar “${t.nome}” da grid? A ficha não será apagada.`))return;
    const atorAntes=labTokenAtual_();
    const eraAtual=String(atorAntes?.id||'')===String(t.id);
    labEstado_.tokens=(labEstado_.tokens||[]).filter(x=>String(x.id)!==String(t.id));
    labEstado_.ordemIniciativa=(labEstado_.ordemIniciativa||[]).filter(x=>String(x)!==String(t.id));
    for(const x of (labEstado_.tokens||[])){if(String(x.alvoLab||'')===String(t.id))x.alvoLab='';}
    labEstado_.selecionadoId='';
    if(labEstado_.fase==='combate'){
        if(!labEstado_.ordemIniciativa.length){
            labEstado_.turnoIndex=0;
        }else if(eraAtual){
            labEstado_.turnoIndex=Math.min(Number(labEstado_.turnoIndex||0),labEstado_.ordemIniciativa.length-1);
        }else{
            const atualId=String(atorAntes?.id||'');
            const novoIdx=labEstado_.ordemIniciativa.findIndex(x=>String(x)===atualId);
            if(novoIdx>=0)labEstado_.turnoIndex=novoIdx;
            else labEstado_.turnoIndex=Math.min(Number(labEstado_.turnoIndex||0),labEstado_.ordemIniciativa.length-1);
        }
    }
    labEstado_.ultimoResultadoLab=`${t.nome} foi retirado da grid.`;
    labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];
    labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${t.nome} foi retirado da grid.`});
    labParticipanteSelectSig_='';
    labSalvarLocal_();labRender_();
};
window.labAdicionarParticipanteSelecionado_=function(){
    if(!batalhaEhMestre_())return;const v=String(document.getElementById('labParticipanteSelect')?.value||'');if(!v){notificar_('Escolha um personagem, NPC ou criatura.','aviso');return;}
    const [tipo,id]=v.split(':',2);let c=null;
    if(tipo==='pc')c=(userCharacters||[]).find(x=>String(x.id)===String(id));
    else if(tipo==='npc'){const m=npcBancoPorId_(id);if(m)c=criarNPCCombateDoBanco_(m);}
    else if(tipo==='criatura'){const m=criaturaBancoPorId_(id);if(m)c=criarCriaturaCombateDoBanco_(m);}
    if(!c){notificar_('Não foi possível carregar esse participante.','erro');return;}
    if(c.__npcTemporario||c.__criaturaTemporaria)c.nome=batalhaNomeUnicoInstancia_(c.nome,(labEstado_.tokens||[]));
    let t=labTokenDeCharDireto_(c,id,(labEstado_.tokens||[]).length);
    if((labEstado_.tokens||[]).some(x=>String(x.id)===String(t.id)))t.id=`${t.id}:lab:${Date.now()}`;
    const atorAntes=labTokenAtual_()?.id||'';
    if(labEstado_.fase==='combate')t.iniciativaLab=1+Math.floor(Math.random()*10)+Number(t.iniciativaBonus||0);
    labEstado_.tokens.push(t);
    if(labEstado_.fase==='combate'){
        const ids=(labEstado_.ordemIniciativa||[]).filter(id0=>(labEstado_.tokens||[]).some(x=>String(x.id)===String(id0)));
        if(!ids.some(id0=>String(id0)===String(t.id)))ids.push(String(t.id));
        ids.sort((ia,ib)=>{const a=labTokenPorId_(ia),b=labTokenPorId_(ib);return Number(b?.iniciativaLab||0)-Number(a?.iniciativaLab||0)||Number(b?.iniciativaBonus||0)-Number(a?.iniciativaBonus||0)||String(a?.nome||'').localeCompare(String(b?.nome||''));});
        labEstado_.ordemIniciativa=ids;
        const idx=ids.findIndex(x=>String(x)===String(atorAntes));if(idx>=0)labEstado_.turnoIndex=idx;
        labEstado_.ultimoResultadoLab=`${t.nome} entrou no combate com iniciativa ${t.iniciativaLab}.`;
        labEstado_.logLab=Array.isArray(labEstado_.logLab)?labEstado_.logLab:[];
        labEstado_.logLab.unshift({ts:new Date().toLocaleTimeString(),texto:`${t.nome} entrou no combate · INI ${t.iniciativaLab}`});
    }
    labEstado_.selecionadoId=t.id;labSalvarLocal_();labRender_();
};

function labDesenharBase_(){
    labAtualizarModoCriacaoMapa_();
    labAtualizarParticipantesSelect_();
    const map=document.getElementById('labMetricMap');if(!map)return;const ppm=Number(labEstado_.pxPorMetro||48);
    map.style.width=`${labEstado_.larguraM*ppm}px`;map.style.height=`${labEstado_.alturaM*ppm}px`;map.style.backgroundColor=labEstado_.fundo;map.style.backgroundImage=labBackgroundImage_();map.style.backgroundSize=`${ppm}px ${ppm}px,${ppm}px ${ppm}px,56px 56px`;
    const st=labEstado_.tokens.find(t=>String(t.id)===String(labEstado_.selecionadoId)),overlay=labOverlayMovimentoHtml_(st,ppm);
    const drawCfg=labDesenhoConfig_();
    const cursorDesenho=!drawCfg.ativo?'default':drawCfg.ferramenta==='borracha'?'cell':'crosshair';
    const drawCanvas=`<canvas id="labDrawCanvas" onpointerdown="labDesenhoPointerDown_(event)" style="position:absolute;inset:0;z-index:2;pointer-events:${drawCfg.ativo?'auto':'none'};cursor:${cursorDesenho};"></canvas>`;
    const objetos=(labEstado_.objetosLab||[]).map(o=>labObjetoHtml_(o,ppm)).join('');
    const tokens=labEstado_.tokens.map(t=>{const d=Math.max(24,t.diametroM*ppm),sel=String(t.id)===String(labEstado_.selecionadoId),turno=labEstado_.fase==='combate'&&String(labTokenAtual_()?.id)===String(t.id);
        const img=t.imagem?`<img src="${escaparHtmlInventario_(t.imagem)}" draggable="false" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none">`:`<span>${String(t.id).startsWith('dummy:')?'🎯':'👤'}</span>`;
        const alvoAtual=labEstado_.fase==='combate'&&String(labTokenAtual_()?.alvoLab)===String(t.id);
        return `<div class="lab-token" data-id="${escaparHtmlInventario_(t.id)}" style="position:absolute;left:${t.x*ppm-d/2}px;top:${t.y*ppm-d/2}px;width:${d}px;height:${d}px;border-radius:50%;background:#23314d;border:${turno?'4px solid #ffd54a':alvoAtual?'4px solid #ff5b66':sel?'3px solid #ffd54a':'2px solid rgba(9,12,20,.55)'};box-shadow:${turno?'0 0 14px 4px rgba(255,213,74,.5),0 3px 12px rgba(0,0,0,.45)':alvoAtual?'0 0 12px 3px rgba(255,70,85,.4),0 3px 12px rgba(0,0,0,.45)':'0 3px 10px rgba(0,0,0,.4)'};display:flex;align-items:center;justify-content:center;cursor:grab;z-index:${turno?27:sel?25:23};touch-action:none" onmouseenter="labHoverShow_(event,this.dataset.id)" onmousemove="labHoverMove_(event)" onmouseleave="labHoverHide_()" onpointerdown="labPointerDown_(event,'${String(t.id).replace(/'/g,"\\'")}')" onclick="labSelecionar_('${String(t.id).replace(/'/g,"\\'")}')">${img}<div class="lab-facing-frame" style="position:absolute;inset:-4px;pointer-events:none;transform:rotate(${t.angulo||0}deg);transform-origin:50% 50%"><div onpointerdown="labRotacaoPointerDown_(event,'${String(t.id).replace(/'/g,"\\'")}')" style="position:absolute;left:50%;top:-12px;transform:translateX(-50%);width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:18px solid #ffd54a;pointer-events:auto;cursor:crosshair"></div></div><div style="position:absolute;left:50%;bottom:-5px;transform:translate(-50%,100%);white-space:nowrap;padding:2px 5px;border-radius:5px;background:rgba(10,12,25,.82);color:white;font-size:11px;pointer-events:none">${escaparHtmlInventario_(t.nome)}${t.iniciativaLab!==null&&t.iniciativaLab!==''&&Number.isFinite(Number(t.iniciativaLab))?` · INI ${t.iniciativaLab}`:''}${labEstadoTokenRotuloD4_(t)}</div></div>`;}).join('');
    let microToken=null;
    if(labEstado_.pendenciaLab)microToken=labTokenPorId_(labEstado_.pendenciaLab.defensorId);
    else if(labEstado_.danoPendenteLab)microToken=labTokenPorId_(labEstado_.danoPendenteLab.defensorId);
    else microToken=labTokenPorId_(labEstado_.selecionadoId)||labTokenAtual_();
    const dMicro=microToken?Math.max(24,Number(microToken.diametroM||.9)*ppm):0;
    const microObj=labObjetoPorId_(labEstado_.objetoSelecionadoId),micro=(microToken?labMicroPainelHtml_(microToken,ppm,dMicro):'')+(microObj?labObjetoMicroPainelHtml_(microObj,ppm):'');
    const floats=(labEstado_.floatsLab||[]).map(f=>labFloatHtml_(f,ppm)).join('');
    map.innerHTML=drawCanvas+overlay+objetos+tokens+micro+floats;
    labDesenhoRender_();
    const cfg=labDesenhoConfig_(),tg=document.getElementById('labDrawToggle'),eb=document.getElementById('labEraserBtn'),ft=document.getElementById('labDrawTool'),cc=document.getElementById('labDrawColor'),rgb=document.getElementById('labDrawRgb'),sz=document.getElementById('labDrawSize'),op=document.getElementById('labDrawOpacity'),opv=document.getElementById('labDrawOpacityValue'),br=document.getElementById('labDrawBrush'),stx=document.getElementById('labDrawStrokeTexture'),ub=document.getElementById('labUndoBtn'),rb=document.getElementById('labRedoBtn');
    if(tg){tg.textContent=cfg.ativo&&cfg.ferramenta!=='borracha'?'✅ Desenhando':'✏️ Desenhar';tg.classList.toggle('btn-select',cfg.ativo&&cfg.ferramenta!=='borracha');}
    if(eb)eb.classList.toggle('btn-select',cfg.ativo&&cfg.ferramenta==='borracha');
    if(ub)ub.disabled=!labDesenhoUndo_.length;if(rb)rb.disabled=!labDesenhoRedo_.length;
    if(ft)ft.value=cfg.ferramenta;if(cc)cc.value=cfg.cor;if(rgb){const v=labCorHexParaRgb_(cfg.cor);if(v&&document.activeElement!==rgb)rgb.value=v.join('/');}if(sz)sz.value=cfg.tamanho;if(op)op.value=String(Math.round(cfg.opacidade*100));if(opv)opv.textContent=`${Math.round(cfg.opacidade*100)}%`;if(br)br.value=cfg.pincel;if(stx)stx.value=cfg.texturaTraco;
    labAtualizarSelectMapas_();
    labAtualizarSelectObjetosMapa_();
    labRenderObjetoPainel_();
    labRenderResultadoPrivado_();labRenderHistoricoMesa_();
    const bg=document.getElementById('labBgColor'),gc=document.getElementById('labGridColor'),gv=document.getElementById('labGridVisible'),tx=document.getElementById('labTexture'),ms=document.getElementById('labMapSize'),zm=document.getElementById('labZoom');
    if(bg)bg.value=labEstado_.fundo||'#d7d7d7';if(gc)gc.value=labEstado_.corGrade||'#777777';if(gv)gv.checked=labEstado_.gradeVisivel!==false;if(tx)tx.value=labEstado_.textura||'nenhuma';
    if(ms){const v=`${labEstado_.larguraM}x${labEstado_.alturaM}`;if([...ms.options].some(o=>o.value===v))ms.value=v;}
    if(zm)zm.value=String(labEstado_.pxPorMetro||48);
    labAtualizarStatusCombate_();labRenderActionPanel_();labAtualizarInfo_();if(!batalhaEhMestre_()){
        const op=document.getElementById('labObjetoPainel');if(op){op.style.display='flex';op.innerHTML='';}
        const ap=document.getElementById('labActionPanel'),at=labTokenAtual_(),pend=labEstado_.pendenciaLab,dp=labEstado_.danoPendenteLab;
        const podeAgir=at&&labPodeControlarToken_(at);
        const podeDefender=pend&&labPodeControlarToken_(labTokenPorId_(pend.defensorId));
        const podeResolverDano=dp&&labPodeControlarToken_(labTokenPorId_(dp.atacanteId));
        const tp=labEstado_.psiTestePendenteLab,alvoPsi=tp&&labTokenPorId_(tp.alvoId),podePsi=!!tp&&!!alvoPsi&&String(alvoPsi.donoUid||'')===String(currentUserUid||currentUser?.uid||'');
        if(ap&&!podeAgir&&!podeDefender&&!podeResolverDano&&!podePsi)ap.style.display='none';
    }else labAutoAvancarSeSemAcoes_();
}
window.labRotacaoPointerDown_=function(ev,id){
    ev.preventDefault();ev.stopPropagation();if(!batalhaEhMestre_())return;
    const map=document.getElementById('labMetricMap'),t=labEstado_.tokens.find(x=>String(x.id)===String(id));if(!map||!t)return;
    const atual=labTokenAtual_();
    if(labEstado_.fase!=='combate'||String(atual?.id)!==String(t.id)){
        notificar_('A orientação só pode ser alterada durante a oportunidade desse participante.','aviso',4000);return;
    }
    labEstado_.selecionadoId=String(id);
    const ppm=labEstado_.pxPorMetro,rect=map.getBoundingClientRect(),cx=rect.left+t.x*ppm,cy=rect.top+t.y*ppm,node=map.querySelector(`.lab-token[data-id="${CSS.escape(String(id))}"]`);
    const move=e=>{let deg=Math.atan2(e.clientX-cx,-(e.clientY-cy))*180/Math.PI;if(deg<0)deg+=360;t.angulo=Math.round(deg);const f=node?.querySelector('.lab-facing-frame');if(f)f.style.transform=`rotate(${t.angulo}deg)`;labAtualizarInfo_();};
    const up=()=>{window.removeEventListener('pointermove',move);labSalvarLocal_();labRender_();};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
};
window.labPointerDown_=function(ev,id){
    if(ev.button===2)return;
    ev.preventDefault();
    const map=document.getElementById('labMetricMap'),t=labEstado_.tokens.find(x=>String(x.id)===String(id));if(!map||!t)return;
    const mestre=batalhaEhMestre_(),prep=labEstado_.fase!=='combate',at=labTokenAtual_(),controla=labPodeControlarToken_(t);

    // Jogador clicando em outro token durante sua oportunidade: escolhe o alvo.
    if(!mestre&&!controla){
        if(!prep&&at&&labPodeControlarToken_(at)&&String(at.id)!==String(t.id)){
            at.alvoLab=String(t.id);at._alvoManualFixadoLab=String(t.id);at._alvoMortoManual510=false;labEstado_.objetoSelecionadoId='';labEstado_.selecionadoId=String(t.id);labApontarPara_(at,t);labRender_();return;
        }
        labEstado_.selecionadoId=String(id);labRender_();return;
    }
    // Fora de sua oportunidade, o jogador pode inspecionar o próprio token, mas não movê-lo.
    if(!mestre&&!prep&&String(at?.id)!==String(t.id)){labEstado_.selecionadoId=String(id);labRender_();return;}

    labEstado_.selecionadoId=String(id);labEstado_.objetoSelecionadoId='';labTokenArrastandoId_=String(id);labRenderObjetoPainel_();labHoverHide_();
    const rect=map.getBoundingClientRect(),ppm=Number(labEstado_.pxPorMetro||48),origem={x:t.x,y:t.y};
    if(mestre&&!prep&&String(at?.id)!==String(t.id)&&!String(t.id).startsWith('dummy:')){
        at.alvoLab=String(t.id);at._alvoManualFixadoLab=String(t.id);at._alvoMortoManual510=false;labEstado_.objetoSelecionadoId='';labApontarPara_(at,t);labEstado_.selecionadoId=String(t.id);labSalvarLocal_();labRender_();return;
    }
    if(!prep&&t.primeirosSocorrosLab){notificar_('Primeiros Socorros em andamento impedem deslocamento e outras ações proativas.','aviso');return;}
    const saltoMax=Math.max(0,Number(t.saltoPsiPendenteLab||0));const maxM=saltoMax>0?saltoMax:(prep||(mestre&&(t.livreMestre||String(t.id).startsWith('dummy:'))))?999:labMovimentoMaxM_(t);if(!prep&&maxM<=0&&!(mestre&&(t.livreMestre||String(t.id).startsWith('dummy:')))){notificar_(`${t.nome} não possui movimento disponível nesta oportunidade.`,'aviso');return;}
    const node=map.querySelector(`.lab-token[data-id="${CSS.escape(String(id))}"]`),d=node?node.offsetWidth:Math.max(24,Number(t.diametroM||.9)*ppm);
    if(node){node.style.cursor='grabbing';node.style.zIndex='31';}
    let raf=0,pendente=null;
    const aplicar=()=>{
        raf=0;if(!pendente)return;let {clientX,clientY}=pendente;pendente=null;
        let x=(clientX-rect.left)/ppm,y=(clientY-rect.top)/ppm,dx=x-origem.x,dy=y-origem.y,dist=Math.hypot(dx,dy);
        if(!prep&&!(mestre&&(t.livreMestre||String(t.id).startsWith('dummy:')))&&dist>maxM&&dist>0){const f=maxM/dist;x=origem.x+dx*f;y=origem.y+dy*f;}
        t.x=Math.max(0,Math.min(labEstado_.larguraM,x));t.y=Math.max(0,Math.min(labEstado_.alturaM,y));
        if(node){node.style.left=`${t.x*ppm-d/2}px`;node.style.top=`${t.y*ppm-d/2}px`;}
    };
    const move=e=>{pendente={clientX:e.clientX,clientY:e.clientY};if(!raf)raf=requestAnimationFrame(aplicar);};
    const up=()=>{
        window.removeEventListener('pointermove',move);labTokenArrastandoId_='';if(pendente){if(raf){cancelAnimationFrame(raf);raf=0;}aplicar();}
        if(!mestre){
            const destino={x:Number(t.x),y:Number(t.y)};
            labEnviarComandoJogador_('movimento',destino,t).then(ok=>{if(!ok){t.x=origem.x;t.y=origem.y;labRender_();}});
            return;
        }
        const dx=t.x-origem.x,dy=t.y-origem.y,dist=Math.hypot(dx,dy),usouSalto=Number(t.saltoPsiPendenteLab||0)>0,c=(prep||usouSalto)?{acoes:0}:labCustoMovimento_(t,dist);
        if(!prep&&dist>.08){let deg=Math.atan2(dx,-dy)*180/Math.PI;if(deg<0)deg+=360;t.angulo=Math.round(deg);}
        if(usouSalto)t.saltoPsiPendenteLab=0;if(!prep&&!usouSalto){if(c.usaBonus>0)t.movimentoBonusLab=Math.max(0,Number(t.movimentoBonusLab||0)-Number(c.usaBonus||0));if(c.usaGratis)t.movimentoGratisDisponivel=false;if(c.acoes>0)t.acoesAtuaisLab=Math.max(0,t.acoesAtuaisLab-c.acoes);}
        labSalvarLocal_();labRender_();if(!prep)labAutoAvancarSeSemAcoes_();
    };
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{once:true});
};
labCarregarLocal_();
setTimeout(()=>{try{labSanearEstado_();labRender_();}catch(_){}},250);
window.addEventListener('load',()=>setTimeout(()=>{try{labSanearEstado_();labRender_();}catch(_){}},700));





const BATALHA_DOC_REF = () => doc(db,'combatesAtivos','mesa');
const BATALHA_ACOES_REF = () => collection(db,'combatesAtivos','mesa','acoes');

let batalhaEstado_ = null;
let batalhaUnsub_ = null;
let batalhaAcoesUnsub_ = null;
let batalhaPersonagensUnsub_ = null;
let batalhaProcessandoAcoes_ = false;
let batalhaPrefsMestre_ = {};
let batalhaPrefsJogador_ = {};
let batalhaMovimentoIntentoJogador_ = {};
let batalhaSelecaoMestre_ = new Set();

function batalhaEhMestre_(){ return !!(userData && userData.role==='mestre'); }

function batalhaTipoChar_(c){
    const tipo=String(c?.tipo||'pc').toLowerCase();
    if(tipo==='criatura'||tipo==='monstro')return 'Criatura';
    if(tipo==='npc'||tipo==='npc_rapido')return 'NPC';
    return c?.dono===currentUserUid?'PM':'PJ';
}

function npcBancoPorId_(id){
    return (npcsDB||[]).find(n=>String(n.id)===String(id))||null;
}
function npcSlugPericia_(nome){
    return normalizarTextoCombate_(nome||'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}
function npcIdPericiaSistema_(nome){
    const q=normalizarTextoCombate_(nome||'');
    const aliases={
      'armas_de_haste':'armas_haste','pistolas_e_revolveres':'pistolas_revolveres','pistolas_laser':'pistolas_laser','rifles_laser':'rifles_laser','armas_de_energia':'armas_energia',
      'fuzis_e_carabinas':'fuzis_carabinas','armas_brancas_curtas':'armas_brancas_curtas',
      'armas_brancas_longas':'armas_brancas_longas','armas_pesadas':'armas_pesadas',
      'atirador_de_elite':'atirador_elite','pistolas_laser':'pistolas_laser','rifles_laser':'rifles_laser',
      'arma_laser_pesada':'arma_laser_pesada','armas_de_energia':'armas_energia',
      'esgrima_plasma_vibro':'esgrima_plasma_vibro','combate_desarmado':'combate_desarmado',
      'primeiros_socorros':'primeiros_socorros'
    };
    const slug=npcSlugPericia_(q);
    if(aliases[slug])return aliases[slug];
    const banco=[...(periciasDB||[]),...(especializacoesDB||[])];
    const achou=banco.find(x=>normalizarTextoCombate_(getNome(x)||x.nome||'')===q);
    return achou?.id||slug;
}
function npcPericiasParaCombate_(texto){
    const out={};
    String(texto||'').split('|').forEach(par=>{
        const pos=par.lastIndexOf(':');
        if(pos<0)return;
        const nome=par.slice(0,pos).trim();
        const resto=par.slice(pos+1).trim();
        const partes=resto.split('@').map(x=>x.trim()).filter(Boolean);
        const investimento=Number(partes[0])||0;
        const tags=(partes.slice(1).join(',')||'').split(',').map(normalizarTextoCombate_).filter(Boolean);
        if(!nome)return;
        out[npcIdPericiaSistema_(nome)]={
            base:0,treino:investimento,nomeOriginal:nome,
            tags,
            ofensiva:tags.includes('ataque')||tags.includes('ofensiva'),
            defensiva:tags.includes('defesa')||tags.includes('aparar'),
            naoCombate:tags.includes('nao_combate')||tags.includes('utilidade')
        };
    });
    return out;
}

function rolarFormulaAtributo_(formula,fallback=10){
    const txt=String(formula??'').trim().toLowerCase().replace(/\s+/g,'');
    if(!txt)return Number(fallback||0);
    if(/^-?\d+$/.test(txt))return Number(txt);
    const m=txt.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if(!m)return Number(fallback||0);
    const qtd=Math.max(1,Math.min(50,Number(m[1]||1))),faces=Math.max(2,Math.min(1000,Number(m[2]||6))),mod=Number(m[3]||0);
    let total=mod;for(let k=0;k<qtd;k++)total+=Math.floor(Math.random()*faces)+1;return total;
}
function modeloUsaAtributosRolados_(modelo){
    if(modelo?.atributosRolados)return true;
    const f=modelo?.formulasAtributos||{};
    return ['FOR','CON','TAM','DES','INT','POD','CAR'].some(a=>/\d*d\d+/i.test(String(f[a]||'')));
}
function atributoModeloOuRolado_(modelo,chave,fallback=10){
    const f=modelo?.formulasAtributos?.[chave];
    return modeloUsaAtributosRolados_(modelo)&&String(f||'').trim()
        ? rolarFormulaAtributo_(f,modelo?.[chave]??fallback)
        : Number(modelo?.[chave]??fallback);
}
function atributosIndividuoDoModelo_(modelo,participante=null,tipo='npc'){
    if(participante?.atributosIndividuo&&typeof participante.atributosIndividuo==='object')return JSON.parse(JSON.stringify(participante.atributosIndividuo));
    const d=tipo==='criatura'?{FOR:10,CON:10,TAM:10,DES:10,INT:5,POD:10,CAR:5}:{FOR:10,CON:10,TAM:10,DES:10,INT:10,POD:10,CAR:10},r={};
    for(const a of ['FOR','CON','TAM','DES','INT','POD','CAR'])r[a]=atributoModeloOuRolado_(modelo,a,d[a]);return r;
}
function criarNPCCombateDoBanco_(modelo,participante=null){
    if(!modelo)return null;
    // O banco é somente o MODELO. Ferimentos/PV pertencem exclusivamente ao INDIVÍDUO.
    const combateSalvo=participante?.npcCombate&&typeof participante.npcCombate==='object'
        ? JSON.parse(JSON.stringify(participante.npcCombate))
        : {hitLocations:{},armor:{},fadiga:'Fresh',armas:[],municao:[],ferimentos:{},inconsciente:false,incapacitado:false,morto:false,ataquesBloqueadosTurnos:0,sangramentoAtivo:false,caido:false};
    if(!participante)delete combateSalvo.primeirosSocorrosEmAndamento;
    return {
        id:participante?.id||`npc:${modelo.id}:${Date.now()}:${Math.random().toString(36).slice(2,7)}`,
        npcBancoId:modelo.id,
        nome:modelo.nome||'NPC',
        imagem:modelo.imagem||'',
        tipo:'npc',
        dono:currentUserUid,
        atributos:atributosIndividuoDoModelo_(modelo,participante,'npc'),
        bonus:{FOR:0,CON:0,TAM:0,DES:0,INT:0,POD:0,CAR:0},
        pericias:npcPericiasParaCombate_(modelo.periciasTexto),especializacoes:npcPericiasParaCombate_(modelo.especializacoesTexto),
        armasNaturais:String(modelo.armasTexto||'').split('|').map(x=>x.trim()).filter(x=>ataqueNaturalPorNome_(x)).map(x=>ataqueNaturalPorNome_(x).nome),
        inventario:(()=>{
            if(participante?.npcInventario&&typeof participante.npcInventario==='object'){
                return JSON.parse(JSON.stringify(participante.npcInventario));
            }
            const inv={equipado:Array(12).fill(null),bolso:Array(2).fill(null),mochila:Array(20).fill(null),veiculo:Array(50).fill(null),casa:Array(100).fill(null)};
            let slot=0;
            const fonteEquip=String(modelo.equipamentoBaseTexto||'').trim()||String(modelo.armasTexto||'');
            for(const nome of fonteEquip.split('|').map(x=>x.trim()).filter(Boolean)){
                const q=normalizarTextoCombate_(nome);
                const b=(itensDB||[]).find(i=>{
                    const nomes=[i.nome,i.nome_en,i.nome_zh,i.id].filter(Boolean).map(normalizarTextoCombate_);
                    return nomes.includes(q)||nomes.some(x=>x.replace(/_/g,' ')===q);
                });
                if(b&&slot<12){
                    const maxCarga=cargaMaxArma_(b);
                    inv.equipado[slot++]={...b,idBanco:String(b.id),instanciaId:`npc_${modelo.id}_${slot}`,pvAtual:Number(b.pv||1),cargaAtual:maxCarga,cargaMax:maxCarga};
                }
            }
            return inv;
        })(),
        combate:combateSalvo,
        conceito:modelo.descricao||'',
        carreira:modelo.tipo||'NPC',
        habilidadesTexto:modelo.habilidadesTexto||'',
        vinculosAtaquesPericias:modelo.vinculosAtaquesPericias||'',
        acoesMaxEspecial:Number(modelo.acoesMaxEspecial||0)||0,
        acoesMax:Number(modelo.acoes ?? modelo.acoesMax ?? modelo.acoesMaxEspecial ?? 0)||0,
        armaduraNatural:Number(modelo.armaduraNatural||0)||0,
        deslocamento:Number(modelo.deslocamento??modelo.movimentoTerrestre??modelo.movimentoBase??3),
        movimentoTerrestre:Number(modelo.deslocamento??modelo.movimentoTerrestre??modelo.movimentoBase??3),
        movimentoVoo:Number(modelo.movimentoVoo||0),
        movimentoNatacao:Number(modelo.movimentoNatacao||0),
        __npcTemporario:true
    };
}
function criarCriaturaCombateDoBanco_(modelo,participante=null){
    if(!modelo)return null;
    // O banco é somente o MODELO. Cada criatura adicionada à batalha nasce como um INDIVÍDUO limpo.
    const combateSalvo=participante?.criaturaCombate&&typeof participante.criaturaCombate==='object'
        ? JSON.parse(JSON.stringify(participante.criaturaCombate))
        : {hitLocations:{},armor:{},fadiga:'Fresh',armas:[],municao:[],ferimentos:{},inconsciente:false,incapacitado:false,morto:false,ataquesBloqueadosTurnos:0,sangramentoAtivo:false,caido:false};
    if(!participante)delete combateSalvo.primeirosSocorrosEmAndamento;

    const props={};
    String(modelo.propriedadesAtaques||'').split('|').map(x=>x.trim()).filter(Boolean).forEach(reg=>{
        const ix=reg.indexOf(':');
        if(ix<0)return;
        const nome=normalizarTextoCombate_(reg.slice(0,ix));
        props[nome]=reg.slice(ix+1).split(',').map(x=>normalizarTextoCombate_(x)).filter(Boolean);
    });
    const alcances={};
    String(modelo.alcancesAtaques||'').split('|').map(x=>x.trim()).filter(Boolean).forEach(reg=>{
        const ix=reg.indexOf(':');if(ix<0)return;
        alcances[normalizarTextoCombate_(reg.slice(0,ix))]=Number(String(reg.slice(ix+1)).replace(',','.'))||0;
    });
    const ataques=String(modelo.armasTexto||'').split('|').map(x=>x.trim()).filter(Boolean).map(reg=>{
        const ix=reg.indexOf(':');
        const nome=(ix>=0?reg.slice(0,ix):reg).trim();
        const dano=(ix>=0?reg.slice(ix+1):'').trim();
        const base=ataqueNaturalPorNome_(nome);
        const danoFinal=/^0+(?:[.,]0+)?$/.test(dano)?(base?.dano||'1d6+MD'):(dano||base?.dano||'1d6+MD');
        const ps=props[normalizarTextoCombate_(nome)]||[];
        return {
            ...(base||{}),
            nome,
            id:`criatura_${npcSlugPericia_(nome)}`,
            dano:danoFinal,
            penetracao:Number(base?.penetracao||0),
            categoria:'Arma natural',familia:'natural',natural:true,pa:0,pv:999,
            propriedades:ps,
            infeccioso:ps.includes('infeccioso'),
            sonoro:ps.includes('sonoro')||ps.includes('trombeta')||ps.includes('cone_sonoro'),
            alcanceMetros:Number(alcances[normalizarTextoCombate_(nome)]||base?.alcanceMetros||0)
        };
    });

    const periciasModelo=npcPericiasParaCombate_(modelo.periciasTexto);
    const especializacoesModelo=npcPericiasParaCombate_(modelo.especializacoesTexto);
    const mapaLinks=mapaPericiaAtaques_(modelo);
    if(mapaLinks.combate_desarmado?.length && !periciasModelo.combate_desarmado){
        periciasModelo.combate_desarmado={base:0,treino:0,nomeOriginal:'Combate Desarmado',tags:['ataque'],ofensiva:true,defensiva:false,naoCombate:false};
    }

    return {
        id:participante?.id||`criatura:${modelo.id}:${Date.now()}:${Math.random().toString(36).slice(2,7)}`,
        criaturaBancoId:modelo.id,nome:modelo.nome||'Criatura',imagem:modelo.imagem||'',tipo:'criatura',dono:currentUserUid,
        atributos:atributosIndividuoDoModelo_(modelo,participante,'criatura'),
        bonus:{FOR:0,CON:0,TAM:0,DES:0,INT:0,POD:0,CAR:0},
        pericias:periciasModelo,
        especializacoes:especializacoesModelo,
        // Criaturas podem possuir Psiquismo exatamente como personagens.
        // Os campos abaixo também deixam habilidades especiais preparadas para futuras mecânicas.
        poderesPsiIds:String(modelo.poderesPsiIds||'').split('|').map(x=>x.trim()).filter(Boolean),
        habilidadesEspeciais:String(modelo.habilidadesEspeciais||modelo.habilidadesTexto||'').split('|').map(x=>x.trim()).filter(Boolean),
        armasNaturais:ataques,
        inventario:(()=>{
            if(participante?.criaturaInventario&&typeof participante.criaturaInventario==='object')return JSON.parse(JSON.stringify(participante.criaturaInventario));
            const inv={equipado:Array(12).fill(null),bolso:Array(2).fill(null),mochila:Array(20).fill(null),veiculo:Array(50).fill(null),casa:Array(100).fill(null)};
            let slot=0;
            for(const nome of String(modelo.equipamentoBaseTexto||'').split('|').map(x=>x.trim()).filter(Boolean)){
                const q=normalizarTextoCombate_(nome),b=(itensDB||[]).find(i=>[i.nome,i.nome_en,i.nome_zh,i.id].filter(Boolean).map(normalizarTextoCombate_).includes(q));
                if(b&&slot<12){const maxCarga=cargaMaxArma_(b);inv.equipado[slot++]={...JSON.parse(JSON.stringify(b)),idBanco:String(b.id),instanciaId:`cri_${modelo.id}_${slot}`,pvAtual:Number(b.pv||1),cargaAtual:maxCarga,cargaMax:maxCarga};}
            }
            return inv;
        })(),
        combate:combateSalvo,conceito:modelo.descricao||'',carreira:modelo.tipo||'Criatura',
        habitat:modelo.habitat||'',comportamento:modelo.comportamento||'',habilidadesTexto:modelo.habilidadesTexto||'',
        vinculosAtaquesPericias:modelo.vinculosAtaquesPericias||'',
        acoesMaxEspecial:Number(modelo.acoesMaxEspecial||0)||0,
        acoesMax:Number(modelo.acoes ?? modelo.acoesMax ?? modelo.acoesMaxEspecial ?? 0)||0,
        armaduraNatural:Number(modelo.armaduraNatural||0)||0,
        deslocamento:Number(modelo.deslocamento??modelo.movimentoTerrestre??modelo.movimentoBase??3),
        movimentoTerrestre:Number(modelo.deslocamento??modelo.movimentoTerrestre??modelo.movimentoBase??3),
        movimentoVoo:Number(modelo.movimentoVoo||0),
        movimentoNatacao:Number(modelo.movimentoNatacao||0),
        __criaturaTemporaria:true
    };
}

function batalhaCharLocal_(id){
    const normal=(userCharacters||[]).find(c=>String(c.id)===String(id));
    if(normal)return normal;
    const p=(batalhaEstado_?.participantes||[]).find(x=>String(x.id)===String(id));
    if(p?.npcBancoId){
        return criarNPCCombateDoBanco_(npcBancoPorId_(p.npcBancoId),p);
    }
    if(p?.criaturaBancoId){
        return criarCriaturaCombateDoBanco_(criaturaBancoPorId_(p.criaturaBancoId),p);
    }
    return null;
}
function batalhaParticipante_(id){ return (batalhaEstado_?.participantes||[]).find(p=>String(p.id)===String(id))||null; }

function batalhaLimparPendenciasInvalidas_(estado=batalhaEstado_){
    if(!estado)return false;
    const ids=new Set((estado.participantes||[]).map(p=>String(p.id)));
    let alterou=false;
    if(estado.pendencia){
        if(!ids.has(String(estado.pendencia.atacanteId||''))||!ids.has(String(estado.pendencia.defensorId||''))){
            estado.pendencia=null;alterou=true;
        }
    }
    if(estado.danoPendente){
        if(!ids.has(String(estado.danoPendente.atacanteId||''))||!ids.has(String(estado.danoPendente.defensorId||''))){
            estado.danoPendente=null;alterou=true;
        }
    }
    return alterou;
}


function batalhaIniBase_(c){
    const a=c?.atributos||{}, b=c?.bonus||{};
    return calcularIniciativa(Number(a.INT||0)+Number(b.INT||0),Number(a.DES||0)+Number(b.DES||0));
}
function batalhaAcoesMax_(c){
    const info=garantirPontosAcaoCombate_(c);
    return Math.max(0,Number(info.max||0));
}

function batalhaStatusPublicoDoChar_(char){
    const c=char?.combate||{}, partes=[];
    if(c.morto)partes.push('☠️ Morto');
    else if(c.incapacitado)partes.push('🩸 Incapacitado');
    if(c.inconsciente&&!c.morto)partes.push('💤 Inconsciente');
    if(c.caido)partes.push('💥 Derrubado');
    if(c.sangramentoAtivo)partes.push('🩸 Sangrando');
    const feridos=Object.entries(c.ferimentos||{});
    if(feridos.some(([,f])=>f?.grave))partes.push('🔴 Ferido gravemente');
    else if(feridos.some(([,f])=>f?.serio))partes.push('🟠 Ferido seriamente');
    // Primeiros Socorros em andamento é estado transitório da batalha, nunca da ficha permanente.
    return partes;
}
function batalhaSincronizarStatusPublico_(char,participante){
    if(!participante||!char)return;
    participante.statusPublico=batalhaStatusPublicoDoChar_(char);
    // Estado público da arma atualmente selecionada/equipável, sem expor inventário.
    const prefs=batalhaPrefsChar_(char);
    const arma=encontrarEquipamentoCombate_(prefs?.equipamento);
    participante.armaIncapacitada=!!(arma&&(arma.inutilizavel||Number(arma.pvAtual??arma.pv??1)<=0));
    participante.armaIncapacitadaNome=participante.armaIncapacitada?String(getNome(arma)||'Arma'):'';
}
function batalhaStatusPublicoHtml_(p){
    const partes=[...(p?.statusPublico||[])];
    if(p?.armaIncapacitada)partes.push(`🔧 Arma incapacitada: ${escaparHtmlInventario_(p.armaIncapacitadaNome||'arma')}`);
    if(!partes.length)return '';
    return `<div style="margin-top:8px;color:#ffb4a8;font-size:.9em;font-weight:700;">${partes.join(' · ')}</div>`;
}

function batalhaSanitizarParticipante_(c){
    return {
        id:c.id,
        donoUid:String(c.dono||''),
        nome:String(c.nome||'Sem nome'),
        imagem:String(c.imagem||''),
        tipo:batalhaTipoChar_(c),
        iniciativa:null,
        acoesAtuais:batalhaAcoesMax_(c),
        acoesMax:batalhaAcoesMax_(c),
        gridX:null,
        gridY:null,
        movimentoPendente:null,
        movimentoGratisUsadoRodada:0,
        passagensNaRodada:0,
        dificuldadeMestre:null,
        primeirosSocorrosEmAndamento:null,
        statusPublico:batalhaStatusPublicoDoChar_(c),
        ...(c.__npcTemporario?{
            npcBancoId:String(c.npcBancoId||''),
            atributosIndividuo:JSON.parse(JSON.stringify(c.atributos||{})),
            npcCombate:JSON.parse(JSON.stringify(c.combate||{})),
            npcInventario:JSON.parse(JSON.stringify(c.inventario||{}))
        }:c.__criaturaTemporaria?{
            criaturaBancoId:String(c.criaturaBancoId||''),
            atributosIndividuo:JSON.parse(JSON.stringify(c.atributos||{})),
            criaturaCombate:JSON.parse(JSON.stringify(c.combate||{})),
            criaturaInventario:JSON.parse(JSON.stringify(c.inventario||{}))
        }:{})
    };
}


function batalhaTemIniciativa_(p){
    if(!p)return false;
    const v=p.iniciativa;
    return v!==null && v!==undefined && v!=='' && Number.isFinite(Number(v));
}

function batalhaIniciativasProntas_(){
    const ps=batalhaEstado_?.participantes||[];
    return ps.length>0 && ps.every(batalhaTemIniciativa_);
}

function batalhaOrdenarPorIniciativaInterno_(){
    if(!batalhaEstado_)return;
    batalhaEstado_.participantes=(batalhaEstado_.participantes||[]).sort((a,b)=>{
        const ai=batalhaTemIniciativa_(a)?Number(a.iniciativa):-999999;
        const bi=batalhaTemIniciativa_(b)?Number(b.iniciativa):-999999;
        return bi-ai;
    });
    batalhaEstado_.turnoIndex=0;
    batalhaEstado_.ciclo=1;
}

function batalhaMargem_(valor,roll){
    return Number(valor||0)-Number(roll||0);
}
function batalhaMargemTexto_(valor,roll){
    const m=batalhaMargem_(valor,roll);
    return `Margem ${m>=0?'+':''}${m}`;
}

function batalhaLocalizacaoD20_(){
    const roll=Math.floor(Math.random()*20)+1;
    let local;
    if(roll<=3)local='Perna Direita';
    else if(roll<=6)local='Perna Esquerda';
    else if(roll<=9)local='Abdômen';
    else if(roll<=12)local='Peito';
    else if(roll<=15)local='Braço Direito';
    else if(roll<=18)local='Braço Esquerdo';
    else local='Cabeça';
    return {roll,local};
}

function batalhaLogPush_(estado,textoPublico,tipo='info',dados={}){
    estado.logPublico=Array.isArray(estado.logPublico)?estado.logPublico:[];
    estado.logPublico.unshift({
        id:`log_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        texto:String(textoPublico||''),
        textoPublico:String(textoPublico||''),
        textoDetalhado:String(dados.textoDetalhado||textoPublico||''),
        textoAtor:String(dados.textoAtor||dados.textoDetalhado||textoPublico||''),
        textoAlvo:String(dados.textoAlvo||textoPublico||''),
        actorId:String(dados.actorId||''),
        targetId:String(dados.targetId||''),
        tipo,
        timestamp:new Date().toISOString()
    });
    estado.logPublico=estado.logPublico.slice(0,80);
}

function batalhaPodeVerDetalheLog_(entry){
    if(batalhaEhMestre_())return true;
    if(!entry?.actorId)return false;
    const c=batalhaCharLocal_(entry.actorId);
    return !!c && String(c.dono||'')===String(currentUserUid||'');
}

function batalhaTextoLogVisivel_(entry){
    if(batalhaEhMestre_())return entry.textoDetalhado||entry.textoPublico||entry.texto||'';
    const uid=String(currentUserUid||'');
    const ator=entry?.actorId?batalhaCharLocal_(entry.actorId):null;
    const alvo=entry?.targetId?batalhaCharLocal_(entry.targetId):null;
    if(ator && String(ator.dono||'')===uid){
        return entry.textoAtor||entry.textoPublico||entry.texto||'';
    }
    if(alvo && String(alvo.dono||'')===uid){
        return entry.textoAlvo||entry.textoPublico||entry.texto||'';
    }
    return entry.textoPublico||entry.texto||'';
}

async function batalhaSalvarEstado_(estado=batalhaEstado_){
    if(!batalhaEhMestre_()||!estado)return;
    estado.atualizadoEm=new Date().toISOString();
    batalhaEstado_=estado;
    await setDoc(BATALHA_DOC_REF(),estado,{merge:false});
}

function batalhaPodeControlar_(p){
    if(!p)return false;
    if(batalhaEhMestre_())return true;
    return String(p.donoUid||'')===String(currentUserUid||'');
}

function batalhaPrefsChar_(char){
    if(!char)return {pericia:'',dificuldade:'padrao',equipamento:'',alvo:''};
    const defaults={pericia:'',dificuldade:'padrao',equipamento:'',alvo:''};
    if(batalhaEhMestre_()){
        batalhaPrefsMestre_[char.id]=batalhaPrefsMestre_[char.id]||{...defaults};
        return batalhaPrefsMestre_[char.id];
    }
    // A seleção visível do jogador fica local durante a oportunidade.
    // Firestore continua recebendo uma cópia para o mestre saber a arma empunhada,
    // mas snapshots atrasados não podem mais trocar Perícia/Alvo na interface.
    if(!batalhaPrefsJogador_[char.id]){
        batalhaPrefsJogador_[char.id]={...defaults,...(char?.combate?.batalhaPrefs||{})};
    }
    return batalhaPrefsJogador_[char.id];
}

async function batalhaSalvarPrefs_(char){
    if(!char)return;
    if(batalhaEhMestre_())return;
    const prefs={...batalhaPrefsChar_(char)};
    char.combate=char.combate||{};
    char.combate.batalhaPrefs={...prefs};
    await setDoc(doc(db,'personagens',char.id),{'combate.batalhaPrefs':prefs},{merge:true});
}

function batalhaTokenPericia_(p){ return `${p.__especializacao?'esp':'per'}:${p.id}`; }
function batalhaResolverPericia_(token){
    const [tipo,id]=String(token||'').split(':');
    const banco=tipo==='esp'?especializacoesDB:periciasDB;
    const p=(banco||[]).find(x=>x.id===id);
    if(p&&tipo==='esp')return {...p,__especializacao:true};
    if(p)return p;
    if(tipo==='esp'){
        const conhecido=especializacaoCombateFallback_(id);
        if(conhecido)return conhecido;
        // Criaturas/NPCs podem ter perícias de combate próprias do modelo
        // (Mordida, Pisotear, Bote de Presa Cirúrgico etc.).
        return {id,nome:id.replace(/_/g,' '),tipo:'Combate',uso:'combate',__especializacao:true,__fallbackNPC:true};
    }
    return null;
}

function batalhaListaPericias_(char){
    const lista=obterPericiasCombate_(char)||[];
    if(char?.__npcTemporario||char?.__criaturaTemporaria){
        return lista.map(p=>{
            const reg=(p.__especializacao?char.especializacoes:char.pericias)?.[p.id];
            return reg?.nomeOriginal?{...p,nome:reg.nomeOriginal}:p;
        });
    }
    return lista;
}

function batalhaValorEquip_(item,idx){
    return String(item.instanciaId||item.instanceId||item.idInstancia||item.id||`equipado_${idx}`);
}


function itemCombateInutilizavel_(item){
    if(!item)return false;
    const max=Math.max(0,Number(item.pv||0));
    const atual=Number(item.pvAtual??max);
    return item.inutilizavel===true || (max>0 && atual<=0);
}
function batalhaPrefsDefensor_(char){
    // Para o alvo, prefira a seleção realmente gravada na ficha; o mestre
    // não deve sobrescrever isso com sua preferência local só para descobrir a arma empunhada.
    return char?.combate?.batalhaPrefs || batalhaPrefsChar_(char);
}
function batalhaArmaAtualDefensor_(dp){
    const alvo=batalhaCharLocal_(dp?.defensorId);
    if(!alvo)return null;
    const prefs=batalhaPrefsDefensor_(alvo);
    if(!prefs || ['desarmado','nenhum',''].includes(String(prefs.equipamento||'')))return null;
    const item=encontrarEquipamentoCombateChar_(alvo,prefs.equipamento);
    if(!item || !itemEhArmaOuEscudo_(item) || itemCombateInutilizavel_(item))return null;
    return item;
}


function mapaPericiaAtaques_(modeloOuChar){
    const txt=String(modeloOuChar?.vinculosAtaquesPericias||modeloOuChar?.ataquesPorPericia||'');
    const out={};
    for(const bloco of txt.split('|').map(x=>x.trim()).filter(Boolean)){
        const pos=bloco.indexOf(':');if(pos<0)continue;
        const per=npcIdPericiaSistema_(bloco.slice(0,pos).trim());
        const ataques=bloco.slice(pos+1).split(',').map(x=>normalizarTextoCombate_(x)).filter(Boolean);
        out[per]=ataques;
    }
    return out;
}
function periciaCriaturaPodeAtacar_(char,per){
    if(!char||!per)return false;
    if(!char.__npcTemporario&&!char.__criaturaTemporaria)return periciaEhOfensiva_(per);
    const reg=(per.__especializacao?char.especializacoes:char.pericias)?.[per.id];
    if(reg?.naoCombate)return false;
    if(reg?.ofensiva)return true;
    const mapa=mapaPericiaAtaques_(char);
    if((mapa[per.id]||[]).length)return true;
    const nome=normalizarTextoCombate_(getNome(per));
    return /combate|mordida|garra|bote|constr|pisot|ataque|tiro|laser|arma/.test(nome);
}
function periciaCriaturaPodeDefender_(char,per){
    if(!char||!per)return false;
    if(!char.__npcTemporario&&!char.__criaturaTemporaria)return periciaPodeAparar_(per);
    if(per.id==='esquiva')return true;
    const reg=(per.__especializacao?char.especializacoes:char.pericias)?.[per.id];
    if(reg?.naoCombate)return false;
    if(reg?.defensiva)return true;
    // Ataques naturais não viram defesa automaticamente.
    return false;
}
const ATAQUES_NATURAIS_={
  'punhos':{nome:'Punhos',dano:'1d3+MD',penetracao:0},
  'mordida':{nome:'Mordida',dano:'1d6+MD',penetracao:0},
  'mandibulas':{nome:'Mandíbulas',dano:'1d6+MD',penetracao:0},
  'garras':{nome:'Garras',dano:'1d6+MD',penetracao:1},
  'ferrao':{nome:'Ferrão',dano:'1d4+MD',penetracao:2},
  'cauda':{nome:'Cauda',dano:'1d6+MD',penetracao:0},
  'pseudopode':{nome:'Pseudópode',dano:'1d6+MD',penetracao:0},
  'engolfar':{nome:'Engolfar',dano:'1d8+MD',penetracao:0},
  'punho mecanico':{nome:'Punho mecânico',dano:'1d6+MD',penetracao:1},
  'braco manipulador':{nome:'Braço manipulador',dano:'1d4+MD',penetracao:0}
};
function ataqueNaturalPorNome_(nome){
    const q=normalizarTextoCombate_(nome||'');
    const chave=Object.keys(ATAQUES_NATURAIS_).find(k=>normalizarTextoCombate_(k)===q);
    if(!chave)return null;
    return {...ATAQUES_NATURAIS_[chave],id:`natural_${chave.replace(/\s+/g,'_')}`,categoria:'Arma natural',familia:'natural',natural:true,pa:0,pv:999};
}
function ataquesNaturaisChar_(char){
    const nomes=Array.isArray(char?.armasNaturais)?char.armasNaturais:[];
    const arr=nomes.map(entrada=>{
        if(entrada&&typeof entrada==='object')return entrada;
        const base=ataqueNaturalPorNome_(entrada);
        if(base)return base;
        const slug=npcSlugPericia_(entrada);
        return {nome:String(entrada),dano:'1d6+MD',penetracao:0,id:`natural_${slug}`,categoria:'Arma natural',familia:'natural',natural:true,pa:0,pv:999,propriedades:[]};
    }).filter(Boolean);
    if(!arr.some(x=>normalizarTextoCombate_(x.nome)==='punhos') && !char?.__npcTemporario && !char?.__criaturaTemporaria)return [ataqueNaturalPorNome_('Punhos'),...arr];
    return arr.length?arr:[ataqueNaturalPorNome_('Punhos')];
}
function ataqueNaturalPorValor_(char,valor){
    const id=String(valor||'').replace(/^natural:/,'');
    return ataquesNaturaisChar_(char).find(x=>String(x.id)===id||`natural:${x.id}`===String(valor))||null;
}

function batalhaEquipamentos_(char,pericia,selecionado=''){
    if(!pericia)return [];
    if(char?.__npcTemporario||char?.__criaturaTemporaria){
        const naturais=ataquesNaturaisChar_(char);
        const mapa=mapaPericiaAtaques_(char);
        const chaveId=npcIdPericiaSistema_(pericia.id||'');
        const chaveNome=npcIdPericiaSistema_(getNome(pericia)||'');
        const vinculados=mapa[chaveId]||mapa[chaveNome];
        if(Array.isArray(vinculados)&&vinculados.length){
            return naturais.filter(item=>vinculados.includes(normalizarTextoCombate_(item.nome))).map(item=>({
                valor:`natural:${item.id}`,rotulo:item.nome,item,graus:0
            }));
        }
        if(pericia.id==='combate_desarmado'){
            return naturais.map(item=>({valor:`natural:${item.id}`,rotulo:item.nome,item,graus:0}));
        }
    }
    if(pericia.id==='combate_desarmado'){
        return ataquesNaturaisChar_(char).map(item=>({
            valor:`natural:${item.id}`,rotulo:item.nome,item,graus:0
        }));
    }
    if(pericia.id==='esquiva')return [{valor:'nenhum',rotulo:'— sem arma —',item:null,graus:0}];

    const eq=obterItensEquipados_(char)||[];
    return eq.map((item,idx)=>({item,idx}))
        .filter(x=>itemEhArmaOuEscudo_(x.item) && !itemCombateInutilizavel_(x.item))
        .map(({item,idx})=>{
            const graus=penalidadeCompatibilidadeArma_(pericia,item);
            return {
                valor:batalhaValorEquip_(item,idx),
                rotulo:`${getNome(item)}${Number(item.pv||0)>0?` [PV ${Number(item.pvAtual??item.pv)}/${Number(item.pv)}]`:''}${graus?` ⚠ +${graus} grau${graus>1?'s':''}`:''}`,
                item,graus
            };
        });
}

function batalhaGarantirPrefsValidas_(char,prefs){
    const skills=batalhaListaPericias_(char);
    if(!skills.length){prefs.pericia='';prefs.equipamento='';return prefs;}

    if(!skills.some(x=>batalhaTokenPericia_(x)===prefs.pericia)){
        prefs.pericia=batalhaTokenPericia_(skills[0]);
    }
    if(!prefs.dificuldade)prefs.dificuldade='padrao';
    if(!batalhaEhMestre_() && !dificuldadePermitidaPelaFadiga_(char,prefs.dificuldade)){
        const minIx=Math.min(indiceMinimoDificuldadeFadiga_(char),GRAUS_DIFICULDADE.length-1);
        prefs.dificuldade=GRAUS_DIFICULDADE[minIx]?.id||'herculeo';
    }

    let per=batalhaResolverPericia_(prefs.pericia);
    if(per&&(char?.__npcTemporario||char?.__criaturaTemporaria)){
        const reg=(per.__especializacao?char.especializacoes:char.pericias)?.[per.id];
        if(reg?.nomeOriginal)per={...per,nome:reg.nomeOriginal};
    }
    const ops=batalhaEquipamentos_(char,per,prefs.equipamento);

    if(per?.id==='combate_desarmado'){
        if(!ops.some(x=>x.valor===prefs.equipamento))prefs.equipamento=ops[0]?.valor||'natural:natural_punhos';
    }
    else if(per?.id==='esquiva')prefs.equipamento='nenhum';
    else if(!ops.some(x=>x.valor===prefs.equipamento)){
        const zero=ops.find(x=>x.graus===0);
        prefs.equipamento=(zero||ops[0])?.valor||'';
    }

    const outros=(batalhaEstado_?.participantes||[]).filter(x=>x.id!==char.id);
    if(!outros.some(x=>x.id===prefs.alvo))prefs.alvo=outros[0]?.id||'';
    return prefs;
}

function batalhaPvTexto_(char){
    const r=pvResumoCombateMestre_(char);
    if(r&&typeof r==='object')return r.texto||`${r.atual??'?'}${r.max!=null?`/${r.max}`:''}`;
    return String(r??'—');
}

function batalhaLocaisHtml_(char){
    if(modoCombateAtual_()==='simplificado')return '';
    return resumoLocaisCompactoCombateMestre_(char);
}

function batalhaDificuldadeOptions_(v,char){
    const vals=[
        ['muito_facil','Muito Fácil'],['facil','Fácil'],['padrao','Padrão'],
        ['dificil','Difícil'],['formidavel','Formidável'],['herculeo','Hercúleo']
    ];
    const mestre=batalhaEhMestre_();
    return vals.map(([id,n])=>{
        const permitido=dificuldadePermitidaPelaFadiga_(char,id);
        const bloqueio=!mestre&&!permitido?'disabled':'';
        const cor=!permitido?'style="color:#ff6b6b;background:#2b1622;"':'';
        const aviso=!permitido?' ⚠ fadiga':'';
        return `<option value="${id}" ${id===v?'selected':''} ${bloqueio} ${cor}>${n}${aviso}</option>`;
    }).join('');
}


const BATALHA_LOCAIS_=['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda'];

function batalhaWoundState_(char){
    char.combate=char.combate||{};
    char.combate.ferimentos=char.combate.ferimentos||{};
    return char.combate.ferimentos;
}
function batalhaFerimentoLocal_(char,local){
    return batalhaWoundState_(char)?.[local]||{};
}
function batalhaEstaInconsciente_(char){
    return !!(char?.combate?.inconsciente||char?.combate?.incapacitado||char?.combate?.morto);
}
function batalhaAtaqueBloqueadoFerimento_(char){
    return batalhaEstaInconsciente_(char)||Number(char?.combate?.ataquesBloqueadosTurnos||0)>0;
}
function batalhaDescricaoBloqueioFerimento_(char){
    if(char?.combate?.morto)return 'Morto';
    if(char?.combate?.incapacitado)return 'Incapacitado por Ferimento Grave';
    if(char?.combate?.inconsciente)return 'Inconsciente';
    const n=Number(char?.combate?.ataquesBloqueadosTurnos||0);
    return n>0?`Choque da ferida: não pode atacar por ${n} turno(s)`:'';
}
function batalhaPenalidadeFerimento_(char,per){
    if(!char||!per)return 0;
    const fs=batalhaWoundState_(char);
    let deg=0;
    const id=normalizarTextoCombate_(per.id||'');
    const nome=normalizarTextoCombate_(getNome(per)||'');
    const ofensiva=periciaEhOfensiva_(per);
    const usaCorpo=ofensiva||id.includes('esquiva')||id.includes('atlet')||nome.includes('atlet');
    if(fs['Cabeça']?.serio||fs['Peito']?.serio||fs['Abdômen']?.serio)deg=Math.max(deg,1);
    if(ofensiva){
        deg+=Number(!!fs['Braço Direito']?.serio)+Number(!!fs['Braço Esquerdo']?.serio);
    }
    if(id.includes('esquiva')||id.includes('atlet')||nome.includes('atlet')){
        deg+=Number(!!fs['Perna Direita']?.serio)+Number(!!fs['Perna Esquerda']?.serio);
    }
    return Math.min(2,deg);
}
function batalhaPericiaPorNomes_(char,nomes){
    let all=[...(batalhaListaPericiasDefesa_(char)||[])];
    if(char?.__npcTemporario){
        for(const [id,d] of Object.entries(char.pericias||{})){
            if(all.some(x=>x.id===id))continue;
            const real=(periciasDB||[]).find(x=>x.id===id);
            all.push(real?{...real,__especializacao:false}:{id,nome:d?.nomeOriginal||id,__especializacao:false});
        }
    }else{
        all=[...all,...(periciasDB||[]).filter(x=>!all.some(y=>y.id===x.id)).map(x=>({...x,__especializacao:false}))];
    }
    for(const alvo of nomes){
        const q=normalizarTextoCombate_(alvo);
        const p=all.find(x=>normalizarTextoCombate_(getNome(x)||x.nome||x.id||'').includes(q)||normalizarTextoCombate_(x.id||'').includes(q));
        if(p)return p;
    }
    return null;
}
function batalhaTesteOpostoPassou_(grauDef,rollDef,grauAtaque,rollAtaque){
    const d=batalhaResultadoGradeValor_(grauDef),a=batalhaResultadoGradeValor_(grauAtaque);
    if(d!==a)return d>a;
    if(d<=1)return false;
    return Number(rollDef)>=Number(rollAtaque);
}
function batalhaRolarResistenciaFerimento_(char,ataque){
    const per=batalhaPericiaPorNomes_(char,['resistência','resistencia','endurance']);
    if(!per)return {passou:false,roll:100,valor:0,grau:'Falha',pericia:'Resistência'};
    const base=obterValorRegistroPericia_(char,per.id,per.__especializacao);
    const roll=Math.floor(Math.random()*100)+1,r=classificarD100_(base,roll);
    return {passou:batalhaTesteOpostoPassou_(r.grau,roll,ataque?.grau,ataque?.rolagem),roll,valor:base,grau:r.grau,pericia:getNome(per)};
}
function batalhaConsumirTurnoBloqueioFerimento_(char){
    if(!char?.combate)return;
    const n=Number(char.combate.ataquesBloqueadosTurnos||0);
    if(n>0)char.combate.ataquesBloqueadosTurnos=Math.max(0,n-1);
}
function batalhaEstadoPersistenteNPC_(combate){
    const estado=JSON.parse(JSON.stringify(combate||{}));
    // Estados de procedimento pertencem somente à batalha atual.
    delete estado.primeirosSocorrosEmAndamento;
    return estado;
}
async function batalhaPersistirCombateChar_(char,participante){
    if(participante){
        participante.primeirosSocorrosEmAndamento=char?.combate?.primeirosSocorrosEmAndamento
            ? JSON.parse(JSON.stringify(char.combate.primeirosSocorrosEmAndamento))
            : null;
        batalhaSincronizarStatusPublico_(char,participante);
    }
    if(char?.__npcTemporario){
        const estadoSessao=JSON.parse(JSON.stringify(char.combate||{}));
        if(participante){
            participante.npcCombate=estadoSessao;
            participante.npcInventario=JSON.parse(JSON.stringify(char.inventario||{}));
            participante.atributosIndividuo=JSON.parse(JSON.stringify(char.atributos||{}));
        }
        // Importante: não gravar dano/ferimentos no modelo /npcs.
    }else if(char?.__criaturaTemporaria){
        const estadoSessao=JSON.parse(JSON.stringify(char.combate||{}));
        if(participante){
            participante.criaturaCombate=estadoSessao;
            participante.criaturaInventario=JSON.parse(JSON.stringify(char.inventario||{}));
            participante.atributosIndividuo=JSON.parse(JSON.stringify(char.atributos||{}));
        }
        // Importante: não gravar dano/ferimentos no modelo /criaturas.
    }else if(char?.id){
        // Estado temporário de Primeiros Socorros vive somente na batalha compartilhada.
        if(char.combate)delete char.combate.primeirosSocorrosEmAndamento;
        await setDoc(doc(db,'personagens',char.id),{combate:char.combate},{merge:true});
    }
}
function batalhaArmaEhDistancia_(ataque){
    const txt=normalizarTextoCombate_(`${ataque?.familia||''} ${ataque?.pericia||''} ${ataque?.especializacao||''} ${ataque?.equipamento||''}`);
    // Famílias explicitamente corpo a corpo têm prioridade sobre o campo numérico de alcance.
    // Isso impede lanças/armas de haste de serem tratadas como armas à distância só por terem alcance > 2.
    if(/armas?_de?_haste|armas? de haste|armas?_brancas?_curtas?|armas? brancas? curtas?|armas?_brancas?_longas?|armas? brancas? longas?|esgrima.*(plasma|vibro)|combate_desarmado|combate desarmado/.test(txt))return false;
    if(/arremesso|pistola|revolver|rifle|fuzil|escopeta|submetralhadora|carabina|blaster|arma.*distancia|armas.*distancia/.test(txt))return true;
    return !!ataque?.distancia;
}
function batalhaArmaPodeSangrar_(ataque){
    const n=normalizarTextoCombate_(`${ataque?.equipamento||''} ${ataque?.familia||''}`);
    if(/laser|plasma|blaster|phaser|energia|vibro/.test(n))return false;
    if(/faca|adaga|espada|sabre|lamina|machado|corte|garra|mordida/.test(n))return true;
    return /rifle|pistola|revolver|fuzil|escopeta|submetralhadora|gauss/.test(n)
        && batalhaResultadoGradeValor_(ataque?.grau)>=3;
}
function batalhaEspeciaisDisponiveis_(dp){
    const arr=[];
    const ataque=dp?.ataque||{};
    const crit=batalhaResultadoGradeValor_(ataque.grau)>=3;
    const defensor=batalhaCharLocal_(dp?.defensorId);
    if(!batalhaArmaEhDistancia_(ataque)||crit)arr.push({id:'localizacao',nome:'🎯 Escolher localização'});
    if(batalhaArmaPodeSangrar_(ataque))arr.push({id:'sangrar',nome:'🩸 Sangrar'});
    if(dp?.defensorTemArma || batalhaArmaAtualDefensor_(dp))arr.push({id:'danificar_arma',nome:'🗡️ Danificar arma'});
    if(!batalhaArmaEhDistancia_(ataque) && !defensor?.combate?.caido && !batalhaEstaInconsciente_(defensor))arr.push({id:'derrubar',nome:'💥 Derrubar'});
    if(crit)arr.push({id:'ignorar_armadura',nome:'🛡️ Ignorar armadura'});
    if(ataque.infeccioso)arr.push({id:'infectar',nome:'🦠 Infectar'});
    if(ataque.sonoro)arr.push({id:'trombeta_sonora',nome:'📯 Trombeta sonora'});
    return arr;
}
function batalhaEspeciaisHtml_(p,dp){
    if(!dp||String(dp.atacanteId)!==String(p.id)||Number(dp.especiaisRestantes||0)<=0)return '';
    const disponiveis=batalhaEspeciaisDisponiveis_(dp);
    // Se o ataque tecnicamente gerou um efeito, mas nenhum efeito é aplicável
    // ao contexto/arma/alvo, não mostramos uma etapa vazia.
    if(!disponiveis.length)return '';
    return `<div style="margin-top:11px;padding:11px;border-radius:10px;background:rgba(255,193,7,.09);border:1px solid rgba(255,193,7,.40);">
      <strong style="color:#ffd166;">⭐ ${Number(dp.especiaisRestantes)} Efeito(s) Especial(is)</strong>
      <div style="color:#bbb;margin-top:4px;">Escolha antes de rolar o dano.</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px;">
        ${disponiveis.map(e=>`<button class="btn-small" onclick="batalhaEscolherEspecial_('${p.id}','${e.id}')">${e.nome}</button>`).join('')}
        <button class="btn-small" onclick="batalhaEscolherEspecial_('${p.id}','pular')">↪ Não usar</button>
      </div>
    </div>`;
}
async function batalhaAplicarTrip_(dp){
    const alvo=batalhaCharLocal_(dp.defensorId),p=batalhaParticipante_(dp.defensorId);if(!alvo||!p)return;
    const per=batalhaPericiaPorNomes_(alvo,['esquiva','atletismo']);
    if(!per){alvo.combate.caido=true;await batalhaPersistirCombateChar_(alvo,p);return;}
    const val=obterValorRegistroPericia_(alvo,per.id,per.__especializacao);
    const roll=Math.floor(Math.random()*100)+1,r=classificarD100_(val,roll);
    const resistiu=batalhaTesteOpostoPassou_(r.grau,roll,dp.ataque?.grau,dp.ataque?.rolagem);
    if(!resistiu){
        alvo.combate.caido=true;
        // Derrubar altera posição, não consciência nem AÇ.
        alvo.combate.inconsciente=!!alvo.combate.inconsciente;
    }
    batalhaLogPush_(batalhaEstado_,`${p.nome}: ${getNome(per)} ${roll}/${val} → ${r.grau}; ${resistiu?'permaneceu de pé':'caiu no chão'}.`,'efeito',{targetId:p.id});
    await batalhaPersistirCombateChar_(alvo,p);
}
async function batalhaAplicarEscolhaEspecialMestre_(atacanteId,tipo,localInformado=''){
    const dp=batalhaEstado_?.danoPendente,p=batalhaParticipante_(atacanteId);
    if(!batalhaEhMestre_()||!dp||String(dp.atacanteId)!==String(atacanteId)||!p||Number(dp.especiaisRestantes||0)<=0)return;
    const disponiveis=batalhaEspeciaisDisponiveis_(dp).map(x=>x.id);
    if(tipo!=='pular'&&!disponiveis.includes(tipo))return;
    let escolha={tipo,timestamp:new Date().toISOString()};
    if(tipo==='localizacao'){
        let loc=localInformado;
        if(!BATALHA_LOCAIS_.includes(loc)){
            const atacante=batalhaCharLocal_(dp.atacanteId);
            const somentePernas=!!atacante?.combate?.caido && !batalhaArmaEhDistancia_(dp.ataque);
            if(somentePernas)loc='Perna Direita'; else loc='Peito';
        }
        escolha.local=loc;dp.localEscolhido=loc;
    }else if(tipo==='ignorar_armadura')dp.ignorarArmadura=true;
    else if(tipo==='sangrar')dp.sangrar=true;
    else if(tipo==='derrubar')await batalhaAplicarTrip_(dp);
    else if(tipo==='danificar_arma')dp.danificarArma=true;
    else if(tipo==='infectar')dp.infectar=true;
    else if(tipo==='trombeta_sonora')dp.trombetaSonora=true;
    dp.escolhasEspeciais=[...(dp.escolhasEspeciais||[]),escolha];
    dp.especiaisRestantes=Math.max(0,Number(dp.especiaisRestantes||0)-1);
    batalhaLogPush_(batalhaEstado_,`${p.nome} escolheu efeito especial: ${tipo}.`,'efeito',{actorId:p.id,targetId:dp.defensorId});
    await batalhaSalvarEstado_();
}

window.batalhaEscolherEspecial_=async(atacanteId,tipo)=>{
    const dp=batalhaEstado_?.danoPendente,p=batalhaParticipante_(atacanteId);
    if(!dp||String(dp.atacanteId)!==String(atacanteId)||!p||!batalhaPodeControlar_(p)||Number(dp.especiaisRestantes||0)<=0)return;
    let local='';
    if(tipo==='localizacao'){
        const atacante=batalhaCharLocal_(dp.atacanteId);
        const somentePernas=!!atacante?.combate?.caido && !batalhaArmaEhDistancia_(dp.ataque);
        if(somentePernas){
            const txt=prompt('Caído em combate corpo a corpo: só é possível alcançar as pernas.\n1 Perna Direita\n2 Perna Esquerda','1');
            if(txt===null)return;
            local=Number(txt)===2?'Perna Esquerda':'Perna Direita';
        }else{
            const txt=prompt('Escolha a localização:\n1 Cabeça\n2 Peito\n3 Abdômen\n4 Braço Direito\n5 Braço Esquerdo\n6 Perna Direita\n7 Perna Esquerda','2');
            if(txt===null)return;
            local=BATALHA_LOCAIS_[Math.max(0,Math.min(6,(Number(txt)||2)-1))];
        }
    }
    if(batalhaEhMestre_()){
        await batalhaAplicarEscolhaEspecialMestre_(atacanteId,tipo,local);
    }else{
        await batalhaEnviarAcao_(atacanteId,'efeito_especial',{tipo,local});
        batalhaUltimoResultado_[atacanteId]='Efeito especial enviado ao mestre...';
        renderizarBatalhaCompartilhada_();
    }
};

function batalhaPublicCard_(p){
    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)]?.id===p.id;
    return `<div style="padding:13px;border-radius:12px;border:1px solid ${atual?'rgba(255,193,7,.68)':'rgba(255,255,255,.11)'};background:${atual?'rgba(255,193,7,.08)':'rgba(255,255,255,.035)'};">
        <div style="display:flex;gap:10px;align-items:center;">
            ${p.imagem?`<img src="${escaparHtmlInventario_(p.imagem)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'">`:''}
            <div style="min-width:0;">
                <strong>${escaparHtmlInventario_(p.nome||'Sem nome')}</strong>
                <div style="color:#aaa;font-size:.88em;">INI ${p.iniciativa??'—'}${atual?' · ▶ agora':''}</div>
                ${batalhaStatusPublicoHtml_(p)}
            </div>
        </div>
    </div>`;
}



function batalhaPenalidadeInfeccao_(char){return char?.combate?.infectado?.ativo?1:0;}
function batalhaStatusCriaturaEfeitosHtml_(char){
    const partes=[];
    if(char?.combate?.infectado?.ativo)partes.push('🦠 <strong>Infectado</strong> · +1 grau de dificuldade em todos os testes até tratamento.');
    const surdez=Number(char?.combate?.surdoRodadas||0);
    if(surdez>0)partes.push(`🔇 <strong>Surdo</strong> · ${surdez} rodada(s) restante(s); comunicação sonora indisponível.`);
    if(!partes.length)return '';
    return `<div style="margin-top:9px;padding:8px 10px;border-radius:8px;background:rgba(155,89,182,.10);border:1px solid rgba(155,89,182,.40);color:#e6c8ff;">${partes.join('<br>')}</div>`;
}
function batalhaPenalidadeCaido_(char){
    return char?.combate?.caido ? 2 : 0;
}
function batalhaStatusCaidoHtml_(char){
    if(!char?.combate?.caido)return '';
    return `<div style="margin-top:9px;padding:8px 10px;border-radius:8px;background:rgba(255,193,7,.09);border:1px solid rgba(255,193,7,.35);color:#ffd88a;">
      💥 <strong>Caído</strong> · ataques e defesas +2 graus de dificuldade · ataques corpo a corpo só alcançam as pernas do alvo.
    </div>`;
}
window.batalhaLevantar_=async(id)=>{
    const p=batalhaParticipante_(id),char=batalhaCharLocal_(id);
    if(!p||!char||!batalhaPodeControlar_(p)||!char.combate?.caido)return;
    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)];
    if(!atual||String(atual.id)!==String(id))return notificar_('Só é possível levantar na própria oportunidade.','aviso');
    if(batalhaEstado_?.pendencia||batalhaEstado_?.danoPendente)return notificar_('Resolva a ação pendente primeiro.','aviso');
    if(Number(p.acoesAtuais||0)<=0)return notificar_('Sem AÇ para levantar.','aviso');
    p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-1);
    char.combate.caido=false;
    await batalhaPersistirCombateChar_(char,p);
    batalhaLogPush_(batalhaEstado_,`${p.nome} gastou 1 AÇ e se levantou.`,'levantar',{actorId:p.id});
    await batalhaSalvarEstado_();
};


function batalhaPrimeirosSocorrosPericia_(char){
    return (periciasDB||[]).find(x=>x.id==='primeiros_socorros')
      ||(periciasDB||[]).find(x=>normalizarTextoCombate_(getNome(x)||'').includes('primeiros socorros'))||null;
}
function batalhaPodePrimeirosSocorros_(char){return !!batalhaPrimeirosSocorrosPericia_(char)&&!batalhaEstaInconsciente_(char);}
function batalhaTratamentoPrimeirosSocorros_(char){
    if(!char)return null;
    const p=batalhaParticipante_(char.id);
    if(p)return p.primeirosSocorrosEmAndamento||null;
    // Fora de uma batalha compartilhada, não ressuscitar estados temporários antigos.
    return null;
}
function batalhaEstaTratandoPrimeirosSocorros_(char){return !!batalhaTratamentoPrimeirosSocorros_(char);}
function batalhaPenalidadeTratamento_(char){return batalhaEstaTratandoPrimeirosSocorros_(char)?2:0;}
function batalhaStatusPrimeirosSocorrosHtml_(char){
    const t=batalhaTratamentoPrimeirosSocorros_(char);if(!t)return '';
    const msg=t.fase==='executando'
      ? `🩹 <strong>Primeiros Socorros prontos para conclusão</strong> em ${escaparHtmlInventario_(t.alvoNome)} (${escaparHtmlInventario_(t.local)}). O personagem pode concluir ou abandonar o atendimento.`
      : `🩹 <strong>Primeiros Socorros iniciados</strong> em ${escaparHtmlInventario_(t.alvoNome)} (${escaparHtmlInventario_(t.local)}). O início encerrou o turno automaticamente.`;
    const p=batalhaParticipante_(char?.id);
    const podeCancelar=p&&(batalhaEhMestre_()||batalhaPodeControlar_(p));
    return `<div style="margin-top:9px;padding:9px 11px;border-radius:8px;background:rgba(72,202,228,.09);border:1px solid rgba(72,202,228,.35);color:#b8edf7;">${msg}<br><small>Enquanto mantém o atendimento, defesas sofrem +2 graus de dificuldade. Iniciar e continuar são escolhas voluntárias.</small>${podeCancelar?` <button class="btn-small" style="margin-left:8px;padding:3px 7px;" onclick="batalhaCancelarPrimeirosSocorros_('${p.id}')">✕ Abandonar atendimento</button>`:''}</div>`;
}
async function batalhaCancelarPrimeirosSocorrosMestre_(id){
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id);if(!p||!c)return false;
    c.combate=c.combate||{};delete c.combate.primeirosSocorrosEmAndamento;p.primeirosSocorrosEmAndamento=null;
    await batalhaPersistirCombateChar_(c,p);
    batalhaUltimoResultado_[id]='Primeiros Socorros abandonados.';
    batalhaLogPush_(batalhaEstado_,`${p.nome} abandonou o atendimento de Primeiros Socorros.`,'primeiros_socorros',{actorId:p.id});
    await batalhaSalvarEstado_();renderizarBatalhaCompartilhada_();return true;
}
window.batalhaCancelarPrimeirosSocorros_=async function(id){
    const p=batalhaParticipante_(id);if(!p||!batalhaPodeControlar_(p))return;
    if(!confirm('Abandonar este atendimento de Primeiros Socorros? A AÇ já gasta não será devolvida.'))return;
    if(batalhaEhMestre_())await batalhaCancelarPrimeirosSocorrosMestre_(id);
    else await batalhaEnviarAcao_(id,'primeiros_socorros_cancelar',{});
};

function batalhaKitPrimeirosSocorros_(char){
    const ok=new Set(['equipado','bolso','mochila']);
    return percorrerInventarioItens_(char).find(r=>{
        if(!ok.has(r.comp))return false;
        const n=normalizarTextoCombate_(`${r.item?.idBanco||r.item?.id||''} ${getNome(r.item)||''}`);
        return /kit_medico|kit medico|medical kit|primeiros socorros|first aid/.test(n)&&Number(r.item?.pvAtual??r.item?.pv??0)>0;
    })||null;
}
function batalhaConsumirKitPrimeirosSocorros_(char,r){
    if(!r)return false;const inv=normalizarInventario_(char),i=inv?.[r.comp]?.[r.index];if(!i)return false;
    const a=Number(i.pvAtual??i.pv??0);if(a<=0)return false;i.pvAtual=Math.max(0,a-1);char.inventario=inv;return true;
}
function batalhaEscolherAlvoPrimeirosSocorros_(atorId){
    const ps=(batalhaEstado_?.participantes||[]).filter(p=>batalhaCharLocal_(p.id));
    const q=prompt(`Primeiros Socorros: quem será tratado?\n\n${ps.map((p,i)=>`${i+1}. ${p.nome}${String(p.id)===String(atorId)?' (você)':''}`).join('\n')}`,'1');
    if(q===null)return null;return ps[Math.max(0,Math.min(ps.length-1,(Number(q)||1)-1))]||null;
}
function batalhaLocaisFeridosPrimeirosSocorros_(char){
    return Object.entries(pvMaxLocais_(char)).map(([local,max])=>({local,max,atual:Number(char?.combate?.hitLocations?.[local]??max)})).filter(x=>x.atual<x.max);
}
function batalhaEscolherLocalPrimeirosSocorros_(char){
    const f=batalhaLocaisFeridosPrimeirosSocorros_(char);if(!f.length)return null;
    const q=prompt(`Escolha a parte do corpo a tratar:\n\n${f.map((x,i)=>`${i+1}. ${x.local} (${x.atual}/${x.max} PV)`).join('\n')}`,'1');
    if(q===null)return null;return f[Math.max(0,Math.min(f.length-1,(Number(q)||1)-1))]||null;
}
function batalhaAplicarFiascoPrimeirosSocorros_(alvo,x){
    alvo.combate.hitLocations=alvo.combate.hitLocations||{};
    alvo.combate.hitLocations[x.local]=Math.max(-x.max,Number(alvo.combate.hitLocations[x.local]??x.max)-1);
}
function batalhaAplicarSucessoPrimeirosSocorros_(alvo,x,critico=false){
    alvo.combate.hitLocations=alvo.combate.hitLocations||{};const atual=Number(alvo.combate.hitLocations[x.local]??x.max);
    if(critico){alvo.combate.hitLocations[x.local]=x.max;delete batalhaWoundState_(alvo)[x.local];alvo.combate.inconsciente=false;return `Crítico: ${x.local} restaurado totalmente.`;}
    if(atual>0){const cura=Math.floor(Math.random()*3)+1;alvo.combate.hitLocations[x.local]=Math.min(x.max,atual+cura);return `Recuperou ${Math.min(cura,x.max-atual)} PV.`;}
    if(atual>-x.max){const f=batalhaWoundState_(alvo);f[x.local]=f[x.local]||{};f[x.local].inutil=false;if(['Cabeça','Peito','Abdômen'].includes(x.local))alvo.combate.inconsciente=false;return 'Ferimento Sério estabilizado; funcionalidade parcial restaurada.';}
    alvo.combate.curaNatural=alvo.combate.curaNatural||{};alvo.combate.curaNatural[x.local]={...(alvo.combate.curaNatural[x.local]||{}),graveTratado:true};return 'Ferimento Grave estabilizado/tratado.';
}
async function batalhaIniciarPrimeirosSocorrosMestre_(id,alvoId,local){
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id),ap=batalhaParticipante_(alvoId),alvo=batalhaCharLocal_(alvoId);
    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)];
    if(!p||!c||!ap||!alvo||String(atual?.id)!==String(id)||Number(p.acoesAtuais||0)<=0||batalhaEstaTratandoPrimeirosSocorros_(c))return false;
    if(!batalhaLocaisFeridosPrimeirosSocorros_(alvo).some(x=>x.local===local))return false;
    p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-1);
    c.combate=c.combate||{};
    const tratamento={alvoId:String(alvoId),alvoNome:ap.nome,local,fase:'aguardando',turnosInvestidos:1};
    delete c.combate.primeirosSocorrosEmAndamento;
    p.primeirosSocorrosEmAndamento=JSON.parse(JSON.stringify(tratamento));
    await batalhaPersistirCombateChar_(c,p);
    batalhaLogPush_(batalhaEstado_,`${p.nome} iniciou voluntariamente Primeiros Socorros em ${ap.nome} (${local}). O turno foi encerrado automaticamente; na próxima oportunidade poderá concluir ou investir mais um turno no atendimento.`,'primeiros_socorros',{actorId:p.id,targetId:ap.id});
    batalhaUltimoResultado_[p.id]='Primeiros Socorros iniciados. O turno foi encerrado automaticamente.';
    await batalhaAvancarTurnoInterno_();
    await batalhaSalvarEstado_();return true;
}
async function batalhaContinuarPrimeirosSocorrosMestre_(id){
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id);
    if(!p||!c)return false;
    const t=p.primeirosSocorrosEmAndamento||c?.combate?.primeirosSocorrosEmAndamento||null;
    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)];
    if(!t||String(atual?.id)!==String(id)||Number(p.acoesAtuais||0)<=0)return false;
    const n=Math.max(1,Number(t.turnosInvestidos||1));
    if(n>=3)return false;
    p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-1);
    const novo={...t,turnosInvestidos:n+1,fase:'aguardando'};
    c.combate=c.combate||{};
    delete c.combate.primeirosSocorrosEmAndamento;
    p.primeirosSocorrosEmAndamento=JSON.parse(JSON.stringify(novo));
    await batalhaPersistirCombateChar_(c,p);
    batalhaLogPush_(batalhaEstado_,`${p.nome} continuou o atendimento em ${novo.alvoNome} (${novo.local}). Tempo investido: ${novo.turnosInvestidos}/3 turnos.`,'primeiros_socorros',{actorId:p.id,targetId:novo.alvoId});
    batalhaUltimoResultado_[p.id]=`Atendimento continuado: ${novo.turnosInvestidos}/3 turnos.`;
    await batalhaAvancarTurnoInterno_();
    await batalhaSalvarEstado_();
    return true;
}
window.batalhaContinuarPrimeirosSocorros_=async id=>{
    if(batalhaEhMestre_())await batalhaContinuarPrimeirosSocorrosMestre_(id);
    else await batalhaEnviarAcao_(id,'primeiros_socorros_continuar',{});
};
async function batalhaConcluirPrimeirosSocorrosMestre_(id){
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id);
    if(!p||!c)return false;

    // O estado compartilhado da batalha é a fonte de verdade. Isso evita o mestre
    // rejeitar a conclusão por estar com uma cópia antiga da ficha do jogador.
    const t=p.primeirosSocorrosEmAndamento||c?.combate?.primeirosSocorrosEmAndamento||null;
    if(!t)return false;

    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)];
    if(String(atual?.id)!==String(id))return false;

    const ap=batalhaParticipante_(t.alvoId),alvo=batalhaCharLocal_(t.alvoId);
    if(!ap||!alvo){
        c.combate=c.combate||{};
        delete c.combate.primeirosSocorrosEmAndamento;
        p.primeirosSocorrosEmAndamento=null;
        await batalhaPersistirCombateChar_(c,p);
        batalhaUltimoResultado_[p.id]='Primeiros Socorros cancelados: o alvo original não está mais nesta batalha.';
        await batalhaAvancarTurnoInterno_();
        await batalhaSalvarEstado_();
        return false;
    }

    // Compatibilidade com sessões que ficaram presas em "aguardando":
    // ao clicar Concluir no turno do tratador, promovemos para executando e concluímos.
    if(t.fase!=='executando'){
        t.fase='executando';
    }

    p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-1);
    const max=pvMaxLocais_(alvo)[t.local],
          x={local:t.local,max,atual:Number(alvo.combate?.hitLocations?.[t.local]??max)};
    const per=batalhaPrimeirosSocorrosPericia_(c),
          base=obterValorRegistroPericia_(c,per.id,per.__especializacao),
          kit=batalhaKitPrimeirosSocorros_(c),
          turnos=Math.max(1,Math.min(3,Number(t.turnosInvestidos||1))),
          dificuldadeTempo=kit?(turnos>=3?'muito_facil':turnos===2?'facil':'padrao'):'padrao';
    // Sem kit, tempo extra não melhora além de Padrão. Fadiga e outras limitações
    // continuam podendo tornar a dificuldade efetiva pior.
    const aj=aplicarDificuldadeEFadiga_(c,base,dificuldadeTempo,0),
          roll=Math.floor(Math.random()*100)+1,
          r=classificarD100_(aj.valor,roll);

    if(kit)batalhaConsumirKitPrimeirosSocorros_(c,kit);
    somDado_();
    if(r.grau==='Crítico')somMagico_();
    else if(r.grau==='Fiasco')somFiasco_();

    let res;
    if(r.grau==='Fiasco'){
        batalhaAplicarFiascoPrimeirosSocorros_(alvo,x);
        res='Falha crítica: +1 de dano na localização.';
    }else if(batalhaResultadoGradeValor_(r.grau)>=2){
        if(alvo.combate?.sangramentoAtivo){
            alvo.combate.sangramentoAtivo=false;
            delete alvo.combate.sangramentoOrigem;
        }
        res=batalhaAplicarSucessoPrimeirosSocorros_(alvo,x,r.grau==='Crítico');
    }else{
        res='Falha: nenhum benefício.';
    }

    c.combate=c.combate||{};
    delete c.combate.primeirosSocorrosEmAndamento;
    p.primeirosSocorrosEmAndamento=null;

    await batalhaPersistirCombateChar_(alvo,ap);
    await batalhaPersistirCombateChar_(c,p);
    if(!c.__npcTemporario&&!c.__criaturaTemporaria){
        await setDoc(doc(db,'personagens',c.id),{inventario:c.inventario,combate:c.combate},{merge:true});
    }

    batalhaLogPush_(
        batalhaEstado_,
        `${p.nome} concluiu Primeiros Socorros em ${ap.nome} (${t.local}) ${roll}/${aj.valor} → ${r.grau}. ${res}${kit?` Kit: ${Number(kit.item.pvAtual??0)} PV restantes.`:' Sem kit.'} Tempo: ${turnos}/3 turno(s); dificuldade-base ${aj.escolhida.nome}.`,
        'primeiros_socorros',
        {actorId:p.id,targetId:ap.id}
    );
    batalhaUltimoResultado_[p.id]=`${r.grau}: ${res}`;
    await batalhaAvancarTurnoInterno_();
    await batalhaSalvarEstado_();
    return true;
}
window.batalhaConcluirPrimeirosSocorros_=async id=>{
    if(batalhaEhMestre_())await batalhaConcluirPrimeirosSocorrosMestre_(id);
    else await batalhaEnviarAcao_(id,'primeiros_socorros_concluir',{});
};
window.batalhaPrimeirosSocorros_=async id=>{
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id),atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)];
    if(!p||!c||!batalhaPodeControlar_(p)||batalhaEstaTratandoPrimeirosSocorros_(c)||String(atual?.id)!==String(id)||Number(p.acoesAtuais||0)<=0)return;
    const ap=batalhaEscolherAlvoPrimeirosSocorros_(id);if(!ap)return;const alvo=batalhaCharLocal_(ap.id),x=batalhaEscolherLocalPrimeirosSocorros_(alvo);
    if(!x)return notificar_(`${ap.nome} não possui localização ferida.`,'aviso');
    if(batalhaEhMestre_())await batalhaIniciarPrimeirosSocorrosMestre_(id,ap.id,x.local);
    else await batalhaEnviarAcao_(id,'primeiros_socorros_iniciar',{alvoId:ap.id,local:x.local});
};
function batalhaControlCard_(p,char){
    if(!batalhaEstado_?.danoPendente && /enviado|aguardando aplica/i.test(String(batalhaUltimoResultado_[p.id]||''))){
        batalhaUltimoResultado_[p.id]='Pronto.';
    }

    const prefs=batalhaGarantirPrefsValidas_(char,batalhaPrefsChar_(char));
    const skills=batalhaListaPericias_(char);
    let per=batalhaResolverPericia_(prefs.pericia);
    if(per&&(char?.__npcTemporario||char?.__criaturaTemporaria)){
        const reg=(per.__especializacao?char.especializacoes:char.pericias)?.[per.id];
        if(reg?.nomeOriginal)per={...per,nome:reg.nomeOriginal};
    }
    const equips=batalhaEquipamentos_(char,per,prefs.equipamento);
    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)]?.id===p.id;
    const pend=batalhaEstado_?.pendencia;
    const defendendo=pend?.status==='aguardando_defesa'&&String(pend?.defensorId)===String(p.id);
    const danoLiberado=batalhaEstado_?.danoPendente?.atacanteId===p.id;
    const dpAtual=batalhaEstado_?.danoPendente;
    const especiaisPendentes=danoLiberado
        && Number(dpAtual?.especiaisRestantes||0)>0
        && batalhaEspeciaisDisponiveis_(dpAtual).length>0;
    const tratandoPS=batalhaEstaTratandoPrimeirosSocorros_(char),tratamentoExecutando=tratandoPS&&batalhaTratamentoPrimeirosSocorros_(char)?.fase==='executando';
    const ataqueBloqueado=danoLiberado||(pend?.atacanteId===p.id)||batalhaAtaqueBloqueadoFerimento_(char)||tratandoPS;

    const skillOptions=skills.map(x=>{
        const valor=obterValorRegistroPericia_(char,x.id,!!x.__especializacao);
        return `<option value="${batalhaTokenPericia_(x)}" ${batalhaTokenPericia_(x)===prefs.pericia?'selected':''}>${escaparHtmlInventario_(getNome(x))} (${valor}%)</option>`;
    }).join('');
    const equipOptions=equips.map(x=>`<option value="${escaparHtmlInventario_(x.valor)}" ${x.valor===prefs.equipamento?'selected':''}>${escaparHtmlInventario_(x.rotulo)}</option>`).join('');
    const targetOptions=(batalhaEstado_?.participantes||[]).filter(x=>x.id!==p.id)
        .map(x=>`<option value="${x.id}" ${x.id===prefs.alvo?'selected':''}>${escaparHtmlInventario_(x.nome)}</option>`).join('');

    const fullPrivacy=batalhaEhMestre_()||String(p.donoUid)===String(currentUserUid);

    return `<div style="padding:15px;border-radius:14px;border:1px solid ${atual?'rgba(255,193,7,.70)':'rgba(0,212,255,.23)'};background:${atual?'linear-gradient(90deg,rgba(255,193,7,.10),rgba(0,212,255,.04))':'rgba(0,212,255,.035)'};">
        <div style="display:grid;grid-template-columns:64px minmax(145px,.9fr) 65px 90px 75px 75px minmax(145px,1fr) minmax(110px,.75fr) minmax(150px,1fr) minmax(140px,.9fr);gap:10px;align-items:end;">
            <div>${p.imagem?`<img src="${escaparHtmlInventario_(p.imagem)}" style="width:58px;height:58px;border-radius:50%;object-fit:cover;border:2px solid ${atual?'#ffd166':'rgba(0,212,255,.45)'};" onerror="this.style.display='none'">`:''}</div>
            <div style="align-self:center;"><strong style="font-size:1.18em;">${escaparHtmlInventario_(p.nome)}</strong><br><small style="color:#aaa;">${escaparHtmlInventario_(p.tipo||'')}</small></div>
            <div><small style="color:#888;">INI</small><br><strong style="color:#ffd166;">${p.iniciativa??'—'}</strong></div>
            <div><small style="color:#888;">PV</small><br><strong>${batalhaPvTexto_(char)}</strong></div>
            <div><small style="color:#888;">PA</small><br><strong>${paResumoCombateMestre_(char)}</strong></div>
            <div><small style="color:#888;">AÇ</small><br><strong style="color:${Number(p.acoesAtuais||0)<=0?'#ff8f8f':'#8ff0a8'};">${Number(p.acoesAtuais||0)}/${Number(p.acoesMax||0)}</strong></div>
            <div><small style="color:#888;">P. Cmbt.</small><select id="battleSkill_${p.id}" style="width:100%;margin-top:4px;" onchange="batalhaMudarPref_('${p.id}','pericia',this.value)">${skillOptions}</select></div>
            <div><small style="color:#888;">Dif.</small><select id="battleDiff_${p.id}" style="width:100%;margin-top:4px;" onchange="batalhaMudarDificuldade_('${p.id}',this.value)">${batalhaDificuldadeOptions_(prefs.dificuldade,char)}</select></div>
            <div><small style="color:#888;">Equipamento</small><select id="battleEquip_${p.id}" style="width:100%;margin-top:4px;" onchange="batalhaMudarPref_('${p.id}','equipamento',this.value)">${equipOptions||'<option value="">—</option>'}</select></div>
            <div><small style="color:#888;">Alvo</small><select id="battleTarget_${p.id}" style="width:100%;margin-top:4px;" onchange="batalhaMudarPref_('${p.id}','alvo',this.value)">${targetOptions||'<option value="">—</option>'}</select></div>
        </div>

        ${(batalhaEhMestre_()&&(char?.__npcTemporario||char?.__criaturaTemporaria))?`<div style="margin-top:9px;padding:7px 9px;border-radius:8px;background:rgba(0,212,255,.055);border:1px solid rgba(0,212,255,.16);font-size:.86em;color:#cfefff;"><strong>Atributos:</strong> ${['FOR','CON','TAM','DES','INT','POD','CAR'].map(a=>`${a} ${Number(char?.atributos?.[a]??0)}`).join(' · ')}</div>`:''}
        ${fullPrivacy?batalhaLocaisHtml_(char):''}
        ${batalhaStatusPublicoHtml_(p)}

        ${defendendo?batalhaDefesaHtml_(p,char,pend):''}
        ${batalhaEspeciaisHtml_(p,batalhaEstado_?.danoPendente)}
        ${batalhaDescricaoBloqueioFerimento_(char)?`<div style="margin-top:9px;padding:8px 10px;border-radius:8px;background:rgba(231,76,60,.10);border:1px solid rgba(231,76,60,.35);color:#ffb0a8;">🩸 ${escaparHtmlInventario_(batalhaDescricaoBloqueioFerimento_(char))}</div>`:''}
        ${batalhaStatusCaidoHtml_(char)}${batalhaStatusCriaturaEfeitosHtml_(char)}
        ${batalhaStatusPrimeirosSocorrosHtml_(char)}

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:11px;">
            <button class="btn-small btn-select" ${Number(p.acoesAtuais||0)<=0||!batalhaIniciativasProntas_()||ataqueBloqueado?'disabled':''} onclick="batalhaRolarD100_('${p.id}')">🎲 Teste D100</button>
            ${char?.combate?.caido?`<button class="btn-small" ${!atual||Number(p.acoesAtuais||0)<=0||batalhaEstado_?.pendencia||batalhaEstado_?.danoPendente||tratandoPS?'disabled':''} onclick="batalhaLevantar_('${p.id}')">⬆️ Levantar (1 AÇ)</button>`:''}
            <button class="btn-small btn-delete" ${!danoLiberado||especiaisPendentes?'disabled':''} onclick="batalhaRolarDano_('${p.id}')">💥 Rolar dano</button>
            <button class="btn-small" ${!atual||Number(p.acoesAtuais||0)<=0||tratandoPS?'disabled':''} onclick="batalhaMovimento_('${p.id}')">👣 Movimento (1 AÇ)</button>
            <button class="btn-small" ${batalhaTemIniciativa_(p)?'disabled':''} onclick="batalhaRolarIniciativa_('${p.id}')">⚡ ${batalhaTemIniciativa_(p)?'Iniciativa rolada':'Iniciativa'}</button>
            <span style="margin-left:auto;"></span>
            ${atual&&tratamentoExecutando?`
                <button class="btn-small btn-select" onclick="batalhaConcluirPrimeirosSocorros_('${p.id}')">🩹 Concluir atendimento</button>
                ${Math.max(1,Number(batalhaTratamentoPrimeirosSocorros_(char)?.turnosInvestidos||1))<3?`<button class="btn-small" onclick="batalhaContinuarPrimeirosSocorros_('${p.id}')">⏳ Continuar atendimento (${Math.max(1,Number(batalhaTratamentoPrimeirosSocorros_(char)?.turnosInvestidos||1))}/3)</button>`:''}
            `:atual?`<button class="btn-small" onclick="batalhaProximo_('${p.id}')">${Number(p.passagensNaRodada||0)>0?'⏭ Passar (-1 AÇ)':'⏭ Adiar'}</button>`:''}
            <span style="width:14px;"></span>
            ${batalhaPodePrimeirosSocorros_(char)&&!tratandoPS?`<button class="btn-small" ${!atual||Number(p.acoesAtuais||0)<=0||batalhaEstado_?.pendencia||batalhaEstado_?.danoPendente?'disabled':''} onclick="batalhaPrimeirosSocorros_('${p.id}')" title="Ação opcional: escolha se deseja iniciar o tratamento.">🩹 Iniciar Primeiros Socorros</button>`:''}
            ${batalhaEhMestre_()?`<button class="btn-small btn-delete" onclick="batalhaRemoverParticipante_('${p.id}')">✕ Remover</button>`:''}
        </div>
        <div style="margin-top:9px;padding:9px 11px;border-radius:8px;background:rgba(0,0,0,.18);color:#bbb;">${escaparHtmlInventario_(batalhaUltimoResultado_[p.id]||'Pronto.')}</div>
    </div>`;
}

function batalhaDefesaHtml_(p,char,pend){
    const ac=Number(p.acoesAtuais||0);
    if(batalhaEstaInconsciente_(char)){
        return `<div style="margin-top:11px;padding:12px;border-radius:10px;background:rgba(231,76,60,.11);border:1px solid rgba(231,76,60,.40);color:#ffaaa0;">
          💤 <strong>${escaparHtmlInventario_(p.nome)}</strong> está inconsciente/incapacitado e não pode defender.
        </div>`;
    }
    const skills=[...(batalhaListaPericiasDefesa_(char)||[])].sort((a,b)=>{
        if(a.id==='esquiva'&&b.id!=='esquiva')return -1;
        if(b.id==='esquiva'&&a.id!=='esquiva')return 1;
        return getNome(a).localeCompare(getNome(b));
    });
    const opts=skills.map(x=>{
        const bruto=obterValorRegistroPericia_(char,x.id,!!x.__especializacao);
        const arm=valorPericiaComArmadura_(char,x,bruto).valor;
        const efet=aplicarDificuldadeEFadiga_(char,arm,'padrao',batalhaPenalidadeCaido_(char)+batalhaPenalidadeTratamento_(char)+batalhaPenalidadeInfeccao_(char)).valor;
        return `<option value="${batalhaTokenPericia_(x)}">${escaparHtmlInventario_(getNome(x))} (${efet}%)</option>`;
    }).join('');
    const padrao=skills[0];
    const valorPadraoBruto=padrao?obterValorRegistroPericia_(char,padrao.id,padrao.__especializacao):0;
    const valorPadraoArm=padrao?valorPericiaComArmadura_(char,padrao,valorPadraoBruto).valor:0;
    const valorPadrao=padrao?aplicarDificuldadeEFadiga_(char,valorPadraoArm,'padrao',batalhaPenalidadeCaido_(char)+batalhaPenalidadeTratamento_(char)+batalhaPenalidadeInfeccao_(char)).valor:0;
    return `<div style="margin-top:11px;padding:12px;border-radius:10px;background:rgba(231,76,60,.11);border:1px solid rgba(231,76,60,.40);">
        <strong style="color:#ff9c90;">⚔️ ${escaparHtmlInventario_(pend.atacanteNome||'Atacante')} está atacando ${escaparHtmlInventario_(p.nome)}</strong>
        <div style="margin-top:6px;color:#ddd;">Ataque: <strong>${escaparHtmlInventario_(pend.ataque?.grau||'')}</strong> · AÇ disponíveis: <strong>${ac}/${p.acoesMax}</strong></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:9px;">
            <select id="battleDefenseSkill_${p.id}" style="min-width:220px;" onchange="batalhaAtualizarValorDefesa_('${p.id}',this.value)">${opts}</select>
            <span style="padding:8px 10px;border-radius:8px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.25);">Valor: <strong id="battleDefenseValue_${p.id}" style="color:#00d4ff;">${valorPadrao}</strong></span>
            <button class="btn-small btn-select" ${ac<=0?'disabled':''} onclick="batalhaResponderDefesa_('${p.id}',true)">🎲 Defender</button>
            <button class="btn-small btn-delete" onclick="batalhaResponderDefesa_('${p.id}',false)">✋ Não defender</button>
        </div>
        <small style="display:block;color:#aaa;margin-top:7px;">Esquiva é a opção padrão. Você pode escolher outra perícia de combate apropriada para aparar.</small>
    </div>`;
}

let batalhaUltimoResultado_={};

window.batalhaAtualizarValorDefesa_=(id,token)=>{
    const c=batalhaCharLocal_(id);
    const p=batalhaResolverPericia_(token);
    const el=document.getElementById(`battleDefenseValue_${id}`);
    if(!c||!p||!el)return;
    const bruto=obterValorRegistroPericia_(c,p.id,p.__especializacao);
    const aj=valorPericiaComArmadura_(c,p,bruto);
    const efetivo=aplicarDificuldadeEFadiga_(c,aj.valor,'padrao',batalhaPenalidadeCaido_(c)+batalhaPenalidadeTratamento_(c)+batalhaPenalidadeInfeccao_(c));
    el.textContent=efetivo.valor+(aj.pct?` (-${aj.pct.toFixed(aj.pct%1?1:0)}%)`:'')+(c.combate?.caido?' · Caído +2 graus':'')+(batalhaEstaTratandoPrimeirosSocorros_(c)?' · Tratando +2 graus':'');
};



window.batalhaMudarPref_=async(id,campo,valor)=>{
    const p=batalhaParticipante_(id),char=batalhaCharLocal_(id);
    if(!p||!char||!batalhaPodeControlar_(p))return;
    const prefs=batalhaPrefsChar_(char);

    // Captura o estado real dos quatro controles antes de redesenhar o card.
    // Assim alterar Alvo nunca altera Perícia, e alterar Perícia nunca altera Alvo.
    const skillEl=document.getElementById(`battleSkill_${id}`);
    const diffEl=document.getElementById(`battleDiff_${id}`);
    const equipEl=document.getElementById(`battleEquip_${id}`);
    const targetEl=document.getElementById(`battleTarget_${id}`);
    if(skillEl)prefs.pericia=String(skillEl.value||'');
    if(diffEl)prefs.dificuldade=String(diffEl.value||'padrao');
    if(equipEl)prefs.equipamento=String(equipEl.value||'');
    if(targetEl)prefs.alvo=String(targetEl.value||'');

    if(campo==='dificuldade' && !batalhaEhMestre_() && !dificuldadePermitidaPelaFadiga_(char,String(valor||''))){
        notificar_(`A fadiga atual exige no mínimo ${obterRegraFadiga_(char).grau}.`,'aviso');
        renderizarBatalhaCompartilhada_();
        return;
    }
    prefs[campo]=String(valor||'');

    // Somente a troca de Perícia pode reajustar Equipamento.
    if(campo==='pericia'){
        const per=batalhaResolverPericia_(prefs.pericia);
        if(per?.id==='combate_desarmado')prefs.equipamento='desarmado';
        else if(per?.id==='esquiva')prefs.equipamento='nenhum';
        else{
            const ops=batalhaEquipamentos_(char,per,prefs.equipamento);
            if(!ops.some(x=>x.valor===prefs.equipamento)){
                prefs.equipamento=(ops.find(x=>x.graus===0)||ops[0])?.valor||'';
            }
        }
    }
    await batalhaSalvarPrefs_(char);
    renderizarBatalhaCompartilhada_();
};
window.batalhaMudarDificuldade_=async function(id,valor){
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id);
    if(!p||!c||!batalhaPodeControlar_(p))return;
    const prefs=batalhaPrefsChar_(c);
    prefs.dificuldade=valor;
    if(batalhaEhMestre_()){
        // A escolha manual do mestre é uma regra persistente da batalha.
        p.dificuldadeMestre=valor;
        batalhaPrefsMestre_[c.id]={...prefs};
        await batalhaSalvarEstado_();
    }else{
        await batalhaSalvarPrefs_(c);
    }
    renderizarBatalhaCompartilhada_();
};


function renderizarBatalhaCandidatos_(){
    const box=document.getElementById('battleMasterCandidates');
    const setup=document.getElementById('battleMasterSetup');
    if(!box||!setup)return;
    setup.style.display=batalhaEhMestre_()?'block':'none';
    if(!batalhaEhMestre_())return;
    const atuais=new Set((batalhaEstado_?.participantes||[]).map(x=>String(x.id)));
    const ordemTipo={PJ:0,PC:0,PM:1,NPC:2};
    const chars=(userCharacters||[]).filter(c=>!atuais.has(String(c.id))).map(c=>({
        token:String(c.id),nome:c.nome||'Sem nome',imagem:c.imagem||'',tipo:batalhaTipoChar_(c)
    })).sort((a,b)=>(ordemTipo[a.tipo]??1)-(ordemTipo[b.tipo]??1)||String(a.nome).localeCompare(String(b.nome),'pt-BR',{sensitivity:'base'}));
    const modelos=(npcsDB||[]).filter(n=>n.selecionavelCombate!==false).map(n=>({
        token:`npcdb:${n.id}`,nome:n.nome||'NPC',imagem:n.imagem||'',tipo:'NPC'
    })).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR',{sensitivity:'base'}));
    const criaturas=(criaturasDB||[]).filter(n=>n.selecionavelCombate!==false).map(n=>({
        token:`crdb:${n.id}`,nome:n.nome||'Criatura',imagem:n.imagem||'',tipo:'Criatura'
    })).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR',{sensitivity:'base'}));
    const candidatos=[...chars,...modelos,...criaturas];
    box.innerHTML=candidatos.map(c=>`
        <label style="display:flex;gap:9px;align-items:center;padding:8px;border-radius:9px;background:rgba(255,255,255,.035);">
            <input type="checkbox" onchange="batalhaSelecionarCandidato_('${c.token}',this.checked)" ${batalhaSelecaoMestre_.has(c.token)?'checked':''}>
            ${c.imagem?`<img src="${escaparHtmlInventario_(c.imagem)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">`:''}
            <span><strong>${escaparHtmlInventario_(c.nome)}</strong><br><small style="color:#888;">${c.tipo}</small></span>
        </label>`).join('')||'<div style="color:#888;">Nenhum participante disponível.</div>';
}
window.batalhaSelecionarCandidato_=(id,v)=>{ if(v)batalhaSelecaoMestre_.add(id);else batalhaSelecaoMestre_.delete(id); };


function batalhaNomeUnicoInstancia_(nome,participantes=[]){
    const base=String(nome||'Criatura').replace(/\s+\d+$/,'').trim()||'Criatura';
    const usados=new Set((participantes||[]).map(p=>normalizarTextoCombate_(p.nome||'')));
    if(!usados.has(normalizarTextoCombate_(base)))return base;
    let n=2;while(usados.has(normalizarTextoCombate_(`${base} ${n}`)))n++;
    return `${base} ${n}`;
}
window.batalhaAdicionarSelecionados_=async()=>{
    if(!batalhaEhMestre_())return;
    const ids=[...batalhaSelecaoMestre_];if(!ids.length){notificar_('Selecione pelo menos um personagem.','aviso');return;}
    const estavaInativa=!batalhaEstado_?.ativo;
    let estado=batalhaEstado_||{ativo:true,rodada:1,ciclo:1,turnoIndex:0,participantes:[],pendencia:null,danoPendente:null,logPublico:[]};
    if(estavaInativa){
        estado={ativo:true,rodada:1,ciclo:1,turnoIndex:0,participantes:[],pendencia:null,danoPendente:null,logPublico:[],atualizadoEm:new Date().toISOString()};
        Object.keys(batalhaUltimoResultado_).forEach(k=>delete batalhaUltimoResultado_[k]);
        Object.keys(batalhaPrefsMestre_).forEach(k=>delete batalhaPrefsMestre_[k]);
        Object.keys(batalhaPrefsJogador_).forEach(k=>delete batalhaPrefsJogador_[k]);
    }else{
        estado.ativo=true;
        estado.participantes=Array.isArray(estado.participantes)?estado.participantes:[];
        batalhaLimparPendenciasInvalidas_(estado);
    }
    for(const id of ids){
        let c=null;
        if(String(id).startsWith('npcdb:')){
            const modelo=npcBancoPorId_(String(id).slice(6));
            c=criarNPCCombateDoBanco_(modelo);
        }else if(String(id).startsWith('crdb:')){
            const modelo=criaturaBancoPorId_(String(id).slice(5));
            c=criarCriaturaCombateDoBanco_(modelo);
        }else{
            c=batalhaCharLocal_(id);
        }
        if(!c)continue;
        if(!c.__npcTemporario&&!c.__criaturaTemporaria){
            reconciliarFerimentosComPVManual_(c);
            await setDoc(doc(db,'personagens',c.id),{combate:c.combate},{merge:true});
        }
        if(c.__npcTemporario||c.__criaturaTemporaria)c.nome=batalhaNomeUnicoInstancia_(c.nome,estado.participantes);
        const participante=batalhaSanitizarParticipante_(c);
        if(estado.participantes.some(p=>String(p.id)===String(participante.id)))continue;
        const posInicial=batalhaPosicaoAleatoriaLivre_(estado);
        participante.gridX=posInicial.x;
        participante.gridY=posInicial.y;
        estado.participantes.push(participante);
        batalhaLogPush_(estado,`${c.nome||'Personagem'} entrou na batalha.`,'entrada');
    }
    try{
        await batalhaSalvarEstado_(estado);
        batalhaSelecaoMestre_.clear();
        renderizarBatalhaCompartilhada_();
    }catch(e){
        console.error('Erro ao adicionar participantes à batalha:',e);
        notificar_(`Não foi possível adicionar os participantes: ${e?.message||e}`,'erro',7000);
    }
};

window.batalhaRemoverParticipante_=async(id)=>{
    if(!batalhaEhMestre_())return;
    const p=batalhaParticipante_(id);if(!p)return;
    if(!confirm(`Remover ${p.nome} da batalha?`))return;
    batalhaEstado_.participantes=(batalhaEstado_.participantes||[]).filter(x=>x.id!==id);
    if(Number(batalhaEstado_.turnoIndex||0)>=batalhaEstado_.participantes.length)batalhaEstado_.turnoIndex=0;
    if(batalhaEstado_.pendencia && [batalhaEstado_.pendencia.atacanteId,batalhaEstado_.pendencia.defensorId].map(String).includes(String(id)))batalhaEstado_.pendencia=null;
    if(batalhaEstado_.danoPendente && [batalhaEstado_.danoPendente.atacanteId,batalhaEstado_.danoPendente.defensorId].map(String).includes(String(id))){
        const atacanteId=batalhaEstado_.danoPendente.atacanteId;
        batalhaEstado_.danoPendente=null;
        batalhaUltimoResultado_[atacanteId]='Ataque cancelado: o alvo saiu da batalha antes da resolução do dano.';
    }
    batalhaLogPush_(batalhaEstado_,`${p.nome} saiu da batalha.`,'saida');
    await batalhaSalvarEstado_();
};

window.batalhaOrdenarIniciativa_=async()=>{
    if(!batalhaEhMestre_()||!batalhaEstado_)return;
    batalhaOrdenarPorIniciativaInterno_();
    await batalhaSalvarEstado_();
};

function batalhaParticipantePodeReceberTurno_(p){
    if(!p||Number(p.acoesAtuais||0)<=0)return false;
    const c=batalhaCharLocal_(p.id);
    // CAÍDO NÃO remove a oportunidade. Só inconsciência/incapacitação/morte pulam o turno.
    if(!c)return true;
    return !(c.combate?.inconsciente||c.combate?.incapacitado||c.combate?.morto);
}
function batalhaPrimeiroTurnoValido_(){
    const ps=batalhaEstado_?.participantes||[];
    return ps.findIndex(p=>batalhaParticipantePodeReceberTurno_(p));
}
function batalhaDificuldadeBaseTurno_(p,char){
    // Se o mestre impôs uma dificuldade, ela permanece durante toda a batalha
    // até ele mudar de novo. Caso contrário, começa no mais próximo de Padrão
    // permitido pelas limitações atuais, especialmente Fadiga.
    if(p?.dificuldadeMestre)return p.dificuldadeMestre;
    const idxPadrao=Math.max(0,GRAUS_DIFICULDADE.findIndex(g=>g.id==='padrao'));
    const idxFadiga=Math.max(0,Math.min(indiceMinimoDificuldadeFadiga_(char),GRAUS_DIFICULDADE.length-1));
    return GRAUS_DIFICULDADE[Math.max(idxPadrao,idxFadiga)]?.id||'padrao';
}
async function batalhaResetarSelecoesNovoTurno_(p){
    if(!p)return;
    const c=batalhaCharLocal_(p.id);if(!c)return;
    // Perícia, equipamento e alvo permanecem como estavam.
    // A dificuldade retorna ao valor mais próximo de Padrão permitido pelas
    // penalidades atuais, exceto quando existe uma dificuldade imposta pelo mestre.
    const atuais={...batalhaPrefsChar_(c)};
    const dificuldadeTurno=batalhaDificuldadeBaseTurno_(p,c);
    const novas={...atuais,dificuldade:dificuldadeTurno};
    batalhaGarantirPrefsValidas_(c,novas);
    novas.dificuldade=dificuldadeTurno;

    if(batalhaEhMestre_())batalhaPrefsMestre_[p.id]={...novas};
    else batalhaPrefsJogador_[p.id]={...novas};

    if(!c.__npcTemporario&&!c.__criaturaTemporaria){
        c.combate=c.combate||{};
        c.combate.batalhaPrefs={...novas};
        await setDoc(doc(db,'personagens',c.id),{'combate.batalhaPrefs':novas},{merge:true});
    }
}
async function batalhaAvancarTurnoInterno_(){
    const ps=batalhaEstado_?.participantes||[];if(!ps.length)return;

    const algumPodeAgir=ps.some(p=>batalhaParticipantePodeReceberTurno_(p));
    if(!algumPodeAgir){
        await batalhaNovaRodada_(false);
        return;
    }

    let idx=Number(batalhaEstado_.turnoIndex||0);
    for(let i=0;i<ps.length;i++){
        idx=(idx+1)%ps.length;
        if(idx===0)batalhaEstado_.ciclo=Math.max(1,Number(batalhaEstado_.ciclo||1)+1);
        if(batalhaParticipantePodeReceberTurno_(ps[idx])){
            batalhaEstado_.turnoIndex=idx;
            await batalhaResetarSelecoesNovoTurno_(ps[idx]);
            const c=batalhaCharLocal_(ps[idx].id),t=batalhaTratamentoPrimeirosSocorros_(c);
            if(t?.fase==='aguardando'){
                const exec={...t,fase:'executando'};
                c.combate=c.combate||{};
                c.combate.primeirosSocorrosEmAndamento=exec;
                ps[idx].primeirosSocorrosEmAndamento=JSON.parse(JSON.stringify(exec));
                await batalhaPersistirCombateChar_(c,ps[idx]);
                batalhaUltimoResultado_[ps[idx].id]='Primeiros Socorros em andamento: escolha Concluir atendimento ou Abandonar atendimento para agir normalmente.';
            }
            return;
        }
    }
}

function batalhaAplicarPassagem_(p){
    if(!p)return {custo:0,numero:0};
    const numero=Math.max(0,Number(p.passagensNaRodada||0))+1;
    p.passagensNaRodada=numero;
    const custo=numero>=2 && Number(p.acoesAtuais||0)>0 ? 1 : 0;
    if(custo)p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-1);
    return {custo,numero};
}

window.batalhaProximo_=async(id)=>{
    const p=batalhaParticipante_(id);if(!p||!batalhaPodeControlar_(p))return;
    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)];
    if(!atual||atual.id!==id){notificar_('Não é a oportunidade deste personagem.','aviso');return;}
    // Mesmo inconsciente/incapacitado, o participante atual pode ser passado adiante pelo mestre.
    if(batalhaEstado_?.pendencia){notificar_('Resolva a reação pendente antes de avançar.','aviso');return;}
    if(batalhaEstado_?.danoPendente){notificar_('Resolva os efeitos especiais e o dano pendente antes de avançar.','aviso');return;}
    const cTrat=batalhaCharLocal_(id);
    if(batalhaTratamentoPrimeirosSocorros_(cTrat)?.fase==='executando'){
        notificar_('Escolha Concluir atendimento ou Continuar atendimento.','aviso');
        return;
    }
    if(batalhaEhMestre_()){
        const c=batalhaCharLocal_(id);
        const passagem=batalhaAplicarPassagem_(p);
        if(c){
            batalhaConsumirTurnoBloqueioFerimento_(c);
            await batalhaPersistirCombateChar_(c,p);
        }
        batalhaUltimoResultado_[id]=passagem.custo
            ?`Passou novamente e abdicou de 1 AÇ. Restam ${p.acoesAtuais}/${p.acoesMax}.`
            :'Ação adiada. Se passar novamente nesta rodada, perderá 1 AÇ.';
        batalhaLogPush_(batalhaEstado_,passagem.custo
            ?`${p.nome} passou e abdicou de 1 AÇ.`
            :`${p.nome} adiou sua ação.`, 'passar',{actorId:p.id});
        await batalhaAvancarTurnoInterno_();await batalhaSalvarEstado_();
    }else{
        await batalhaEnviarAcao_(id,'proximo',{});
    }
};


function batalhaPiorarFadigaUmNivel_(char){
    const ordem=['Fresh','Winded','Tired','Wearied','Exhausted','Debilitated','Incapacitated','Semi-Conscious','Comatose','Dead'];
    const i=ordem.indexOf(char?.combate?.fadiga||'Fresh');
    if(i<0||i>=ordem.length-1)return;
    char.combate.fadiga=ordem[i+1];
}
window.batalhaNovaRodada_=async(confirmar=false)=>{
    if(!batalhaEhMestre_()||!batalhaEstado_)return;
    if(confirmar&&!confirm('Iniciar uma nova rodada e restaurar as AÇ de todos?'))return;
    batalhaEstado_.rodada=Math.max(1,Number(batalhaEstado_.rodada||1)+1);
    batalhaEstado_.ciclo=1;batalhaEstado_.turnoIndex=0;batalhaEstado_.pendencia=null;batalhaEstado_.danoPendente=null;
    for(const p of batalhaEstado_.participantes||[]){
        const c=batalhaCharLocal_(p.id);
        if(c?.combate?.sangramentoAtivo){
            batalhaPiorarFadigaUmNivel_(c);
            batalhaLogPush_(batalhaEstado_,`${p.nome} perde 1 nível de Fadiga por sangramento.`,'sangramento',{targetId:p.id});
            await batalhaPersistirCombateChar_(c,p);
        }
        p.acoesMax=c?batalhaAcoesMax_(c):Number(p.acoesMax||0);
        p.acoesAtuais=batalhaEstaInconsciente_(c)?0:p.acoesMax;
        p.movimentoPendente=null;
        p.movimentoGratisUsadoRodada=0;
        p.passagensNaRodada=0;
        delete batalhaMovimentoIntentoJogador_[String(p.id)];
        if(c){
            c.combate=c.combate||{};
            delete c.combate.primeirosSocorrosEmAndamento;
            await batalhaPersistirCombateChar_(c,p);
        }
    }
    const primeiroValido=batalhaPrimeiroTurnoValido_();
    if(primeiroValido>=0)batalhaEstado_.turnoIndex=primeiroValido;
    if(primeiroValido>=0)await batalhaResetarSelecoesNovoTurno_(batalhaEstado_.participantes[primeiroValido]);
    batalhaLogPush_(batalhaEstado_,`Rodada ${batalhaEstado_.rodada} iniciada.`,'rodada');
    await batalhaSalvarEstado_();
};

window.batalhaEncerrar_=async()=>{
    if(!batalhaEhMestre_()||!batalhaEstado_)return;
    if(!confirm('Encerrar a batalha atual?'))return;
    Object.keys(batalhaUltimoResultado_).forEach(k=>delete batalhaUltimoResultado_[k]);
    Object.keys(batalhaPrefsMestre_).forEach(k=>delete batalhaPrefsMestre_[k]);
    Object.keys(batalhaPrefsJogador_).forEach(k=>delete batalhaPrefsJogador_[k]);
    const encerrada={ativo:false,rodada:1,ciclo:1,turnoIndex:0,participantes:[],pendencia:null,danoPendente:null,logPublico:[],atualizadoEm:new Date().toISOString()};
    batalhaEstado_=encerrada;
    renderizarBatalhaCompartilhada_();
    await batalhaSalvarEstado_(encerrada);
};


window.batalhaMovimento_=async function(id){
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id);
    if(!p||!c||!batalhaPodeControlar_(p))return;
    const atual=(batalhaEstado_?.participantes||[])[Number(batalhaEstado_?.turnoIndex||0)];
    if(String(atual?.id)!==String(id)){notificar_('Movimento só pode ser usado no turno atual.','aviso');return;}
    if(batalhaEstado_?.pendencia){
        notificar_('Há uma defesa pendente. Resolva a defesa antes de iniciar outro movimento.','aviso',5000);return;
    }
    if(batalhaEstado_?.danoPendente){
        const dp=batalhaEstado_.danoPendente;
        const alvo=batalhaParticipante_(dp.defensorId);
        const efeitos=Number(dp.especiaisRestantes||0);
        notificar_(efeitos>0
            ? `O ataque anterior ainda tem ${efeitos} efeito(s) especial(is) para resolver${alvo?.nome?` contra ${alvo.nome}`:''}. Resolva-os e o dano antes de se mover.`
            : `O dano do ataque anterior ainda precisa ser resolvido${alvo?.nome?` contra ${alvo.nome}`:''}.`,
            'aviso',6500);
        return;
    }
    if(batalhaEstaTratandoPrimeirosSocorros_(c)){notificar_('O personagem está ocupado com Primeiros Socorros.','aviso');return;}
    if(Number(p.acoesAtuais||0)<=0){notificar_('Sem AÇ para movimento.','aviso');return;}

    if(batalhaEhMestre_()){
        if(p.movimentoPendente){notificar_('Já existe um Movimento aguardando deslocamento no mapa.','aviso');return;}
        p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-1);
        p.movimentoPendente={tipo:'pago',rodada:Number(batalhaEstado_.rodada||1),origemX:Number(p.gridX),origemY:Number(p.gridY),max:2};
        batalhaUltimoResultado_[id]='Movimento preparado: arraste até 2 casas.';
        batalhaLogPush_(batalhaEstado_,`${p.nome} gastou 1 AÇ em Movimento (até 2 casas).`,'movimento',{actorId:p.id});
        await batalhaSalvarEstado_();
    }else{
        const chave=String(id);
        if(batalhaMovimentoIntentoJogador_[chave]){
            delete batalhaMovimentoIntentoJogador_[chave];
            notificar_('Movimento de 1 AÇ cancelado.','info');
        }else{
            batalhaMovimentoIntentoJogador_[chave]={
                origemX:Number(p.gridX),origemY:Number(p.gridY),rodada:Number(batalhaEstado_.rodada||1)
            };
            batalhaUltimoResultado_[id]='Movimento preparado: arraste até 2 casas. A AÇ será gasta quando o deslocamento for confirmado.';
            notificar_('👣 Movimento preparado: arraste até 2 casas.','info',3000);
        }
        renderizarBatalhaCompartilhada_();
    }
};
async function batalhaEnviarAcao_(personagemId,tipo,payload){
    const c=batalhaCharLocal_(personagemId);if(!c)return;
    const acao={
        personagemId,
        donoUid:String(currentUserUid||''),
        tipo,
        payload:payload||{},
        nonce:`${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        status:'novo',
        criadoEm:new Date().toISOString()
    };
    await setDoc(doc(db,'combatesAtivos','mesa','acoes',personagemId),acao,{merge:false});
}

function batalhaResultadoGradeValor_(grau){
    const g=String(grau||'').toLowerCase();
    if(g.includes('crít')||g.includes('crit'))return 3;
    if(g.includes('sucesso')||g==='success')return 2;
    if(g.includes('falha')||g==='failure')return 1;
    return 0;
}


function batalhaLocalFiascoNatural_(item){
    const n=normalizarTextoCombate_(getNome(item)||item?.nome||'punhos');
    if(/mordida|mandibula/.test(n))return 'Cabeça';
    if(/cauda|pseudopode|engolfar/.test(n))return 'Abdômen';
    if(/ferrao/.test(n))return 'Abdômen';
    if(/garra|punho|braco manipulador/.test(n))return Math.random()<0.5?'Braço Direito':'Braço Esquerdo';
    return Math.random()<0.5?'Braço Direito':'Braço Esquerdo';
}
function batalhaAplicarUmDanoDireto_(char,local){
    char.combate=char.combate||{};
    if(modoCombateAtual_()==='simplificado'){
        const max=calcularPVGlobalMax_(char);
        if(!Number.isFinite(Number(char.combate.pvGlobalAtual)))char.combate.pvGlobalAtual=max;
        const antes=Math.max(0,Number(char.combate.pvGlobalAtual||0));
        char.combate.pvGlobalAtual=Math.max(0,antes-1);
        return {local:'PV Global',antes,depois:char.combate.pvGlobalAtual};
    }
    const maxs=pvMaxLocais_(char),max=Number(maxs[local]||1);
    char.combate.hitLocations=char.combate.hitLocations||{};
    const antes=Number(char.combate.hitLocations[local]??max),depois=antes-1;
    char.combate.hitLocations[local]=depois;
    return {local,antes,depois};
}
async function batalhaAplicarFiascoAtaque_(p,char,item){
    if(!p||!char)return '';
    if(item && !item.natural){
        const max=Math.max(1,Number(item.pv||1));
        const antes=Number(item.pvAtual??max);
        item.pvAtual=Math.max(0,antes-1);
        if(item.pvAtual<=0){item.inutilizavel=true;item.quebradoEm=new Date().toISOString();}
        if(char.__npcTemporario){
            p.npcInventario=JSON.parse(JSON.stringify(char.inventario||{}));
        }else{
            await setDoc(doc(db,'personagens',char.id),{inventario:char.inventario},{merge:true});
        }
        const txt=`Fiasco: ${getNome(item)} perdeu 1 PV (${item.pvAtual}/${max})${item.pvAtual<=0?' e ficou INUTILIZÁVEL':''}.`;
        batalhaLogPush_(batalhaEstado_,`${p.nome}: ${txt}`,'fiasco',{actorId:p.id});
        return txt;
    }
    const natural=item||ataqueNaturalPorNome_('Punhos');
    const local=batalhaLocalFiascoNatural_(natural);
    const d=batalhaAplicarUmDanoDireto_(char,local);
    await batalhaPersistirCombateChar_(char,p);
    const txt=`Fiasco: sofreu 1 de dano em ${d.local} (${d.antes} → ${d.depois} PV) ao errar com ${getNome(natural)||natural.nome||'ataque natural'}.`;
    batalhaLogPush_(batalhaEstado_,`${p.nome}: ${txt}`,'fiasco',{actorId:p.id,targetId:p.id});
    return txt;
}

async function batalhaExecutarAtaqueMestre_(id,requestPayload=null){
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id);if(!p||!c)return;
    if(Number(p.acoesAtuais||0)<=0){batalhaUltimoResultado_[id]='Sem AÇ restantes.';return;}
    if(batalhaEstado_?.danoPendente?.atacanteId===id){batalhaUltimoResultado_[id]='Resolva o dano do ataque anterior antes de atacar novamente.';return;}
    if(batalhaEstado_?.pendencia){batalhaUltimoResultado_[id]='Há uma reação pendente.';return;}
    if(batalhaAtaqueBloqueadoFerimento_(c)){batalhaUltimoResultado_[id]=batalhaDescricaoBloqueioFerimento_(c)||'Ferimentos impedem o ataque.';return;}

    const prefs=requestPayload?.prefs||batalhaGarantirPrefsValidas_(c,batalhaPrefsChar_(c));
    let per=batalhaResolverPericia_(prefs.pericia);if(!per)return;
    if(c?.__npcTemporario||c?.__criaturaTemporaria){
        const reg=(per.__especializacao?c.especializacoes:c.pericias)?.[per.id];
        if(reg?.nomeOriginal)per={...per,nome:reg.nomeOriginal};
    }
    const alvoId=prefs.alvo;
    if(periciaEhOfensiva_(per)&&!alvoId){batalhaUltimoResultado_[id]='Selecione um alvo.';return;}

    let item=null,graus=0;
    if(String(prefs.equipamento||'').startsWith('natural:')){
        item=ataqueNaturalPorValor_(c,prefs.equipamento);
    }else if(!['desarmado','nenhum',''].includes(prefs.equipamento)){
        item=encontrarEquipamentoCombateChar_(c,prefs.equipamento);
        if(itemCombateInutilizavel_(item)){
            batalhaUltimoResultado_[id]=`${getNome(item)} está inutilizável (0 PV). Troque de arma.`;
            return;
        }
        if(item)graus=penalidadeCompatibilidadeArma_(per,item);
    }
    if(!['combate_desarmado','esquiva'].includes(per.id)&&!item){
        batalhaUltimoResultado_[id]='Selecione um equipamento.';
        return;
    }

    const baseOriginal=obterValorRegistroPericia_(c,per.id,per.__especializacao);
    const armaduraAjuste=valorPericiaComArmadura_(c,per,baseOriginal);
    const base=armaduraAjuste.valor;
    const grausFerimento=batalhaPenalidadeFerimento_(c,per);
    const grausCaido=batalhaPenalidadeCaido_(c);
    const grausInfeccao=batalhaPenalidadeInfeccao_(c);
    const ajuste=aplicarDificuldadeEFadiga_(c,base,prefs.dificuldade||'padrao',graus+grausFerimento+grausCaido+grausInfeccao);
    if(ajuste.bloqueado){batalhaUltimoResultado_[id]='Ação bloqueada por fadiga.';return;}

    const roll=requestPayload?.roll ?? (Math.floor(Math.random()*100)+1);
    const r=classificarD100_(ajuste.valor,roll);
    if(r.grau==='Crítico')somCriticoArma_(item,item?getNome(item):'Dado'); else if(r.grau==='Fiasco')somFiasco_();
    const margem=batalhaMargem_(ajuste.valor,roll);
    p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-1);
    batalhaUltimoResultado_[id]=`${getNome(per)}: ${roll}/${ajuste.valor} → ${r.grau} · ${batalhaMargemTexto_(ajuste.valor,roll)}${armaduraAjuste.pct?` · Armadura -${armaduraAjuste.pct.toFixed(armaduraAjuste.pct%1?1:0)}%`:''}`;

    if(periciaEhOfensiva_(per)&&r.grau==='Fiasco'){
        const efeitoFiasco=await batalhaAplicarFiascoAtaque_(p,c,item);
        batalhaUltimoResultado_[id]+=` · ${efeitoFiasco}`;
    }

    if(periciaEhOfensiva_(per)&&r.sucesso&&alvoId){
        const alvo=batalhaParticipante_(alvoId);
        const ataqueInfo={
            grau:r.grau,rolagem:roll,valor:ajuste.valor,margem,
            pericia:getNome(per),equipamento:item?getNome(item):'Punhos',
            penetracao:item?obterPenetracaoArma_(item):0,
            distancia:!!(item&&(Number(item.alcance||0)>2||String(item.municao||'').trim())),
            familia:String(item?.familia||item?.tipo||item?.categoria||''),
            propriedades:Array.isArray(item?.propriedades)?item.propriedades:[],
            infeccioso:!!item?.infeccioso,
            sonoro:!!item?.sonoro,
            atacanteCaido:!!c.combate?.caido
        };
        const alvoChar=batalhaCharLocal_(alvoId);
        if(Number(alvo?.acoesAtuais||0)<=0 || batalhaEstaInconsciente_(alvoChar)){
            batalhaEstado_.pendencia=null;
            const especiais=Math.max(0,batalhaResultadoGradeValor_(r.grau)-1);
            batalhaEstado_.danoPendente={
                id:`dmg_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
                atacanteId:id,defensorId:alvoId,ataque:ataqueInfo,
                defensorTemArma:!!batalhaArmaAtualDefensor_({defensorId:alvoId}),
                especiaisRestantes:especiais,escolhasEspeciais:[],
                criadoEm:new Date().toISOString()
            };
            batalhaUltimoResultado_[id]+=' · Alvo sem reação possível: dano liberado.';
            batalhaLogPush_(
                batalhaEstado_,
                `${p.nome} atacou ${alvo?.nome||'o alvo'} → ${r.grau}; alvo sem reação possível.`,
                'acerto',
                {
                    actorId:p.id,
                    targetId:alvoId,
                    textoDetalhado:`${p.nome}: ${getNome(per)} ${roll}/${ajuste.valor} → ${r.grau} · ${batalhaMargemTexto_(ajuste.valor,roll)}; alvo sem reação possível.`
                }
            );
        }else{
            batalhaEstado_.pendencia={
                id:`def_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                status:'aguardando_defesa',
                atacanteId:id,atacanteNome:p.nome,
                defensorId:alvoId,defensorNome:alvo?.nome||'Alvo',
                ataque:ataqueInfo
            };
            batalhaUltimoResultado_[id]+=` · ⏳ Aguardando defesa de ${alvo?.nome||'Alvo'}.`;
            batalhaLogPush_(
                batalhaEstado_,
                `${p.nome} atacou ${alvo?.nome||'o alvo'} → ${r.grau}.`,
                'ataque',
                {
                    actorId:p.id,
                    targetId:alvoId,
                    textoDetalhado:`${p.nome}: ${getNome(per)} ${roll}/${ajuste.valor} → ${r.grau} · ${batalhaMargemTexto_(ajuste.valor,roll)} · alvo ${alvo?.nome||'—'}.`
                }
            );
        }
    }else{
        if(periciaEhOfensiva_(per) && !r.sucesso){
            batalhaUltimoResultado_[id]+=' · O ataque falhou; não há defesa a resolver.';
        }
        batalhaLogPush_(
            batalhaEstado_,
            `${p.nome}: ${getNome(per)} → ${r.grau}.`,
            'teste',
            {
                actorId:p.id,
                textoDetalhado:`${p.nome}: ${getNome(per)} ${roll}/${ajuste.valor} → ${r.grau} · ${batalhaMargemTexto_(ajuste.valor,roll)}.`
            }
        );
    }

    if(Number(p.acoesAtuais)<=0 && !batalhaEstado_.pendencia && !batalhaEstado_.danoPendente){
        await batalhaAvancarTurnoInterno_();
    }
    await batalhaSalvarEstado_();
}

window.batalhaRolarD100_=async(id)=>{
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id);if(!p||!c||!batalhaPodeControlar_(p))return;
    if(!batalhaIniciativasProntas_()){
        notificar_('Todos os participantes precisam rolar iniciativa antes do primeiro turno.','aviso');
        return;
    }
    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)];
    if(atual?.id!==id){notificar_(`Agora é a oportunidade de ${atual?.nome||'outro personagem'}.`,'aviso');return;}
    if(batalhaEstado_?.danoPendente?.atacanteId===id){notificar_('Resolva os efeitos especiais e o dano do ataque anterior antes de atacar novamente.','aviso');return;}
    if(batalhaAtaqueBloqueadoFerimento_(c)){notificar_(batalhaDescricaoBloqueioFerimento_(c)||'Ferimentos impedem o ataque.','aviso');return;}
    const prefs=batalhaGarantirPrefsValidas_(c,batalhaPrefsChar_(c));
    if(batalhaEhMestre_()){
        somDado_();
        await batalhaExecutarAtaqueMestre_(id,{prefs});
    }else{
        somDado_();
        await batalhaEnviarAcao_(id,'teste',{prefs});
        // Não mostrar uma mensagem que pareça uma etapa mecânica real.
        // O resultado verdadeiro virá do mestre via estado compartilhado:
        // Falha/Fiasco ou "Aguardando defesa..." quando houver reação.
        batalhaUltimoResultado_[id]='Rolando teste...';
        renderizarBatalhaCompartilhada_();
    }
};

window.batalhaRolarIniciativa_=async(id)=>{
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id);if(!p||!c||!batalhaPodeControlar_(p))return;
    if(batalhaTemIniciativa_(p)){
        notificar_('A iniciativa deste personagem já foi rolada nesta batalha.','aviso');
        return;
    }
    const d10=Math.floor(Math.random()*10)+1,base=batalhaIniBase_(c),total=d10+base;
    somDado_();

    if(batalhaEhMestre_()){
        p.iniciativa=total;
        batalhaUltimoResultado_[id]=`Iniciativa: 1d10 [${d10}] + ${base} = ${total}`;
        batalhaLogPush_(batalhaEstado_,`${p.nome} rolou iniciativa ${total}.`,'iniciativa',{actorId:p.id});
        batalhaOrdenarPorIniciativaInterno_();
        await batalhaSalvarEstado_();
    }else{
        // Atualização visual imediata enquanto o mestre processa a ação.
        p.iniciativa=total;
        batalhaOrdenarPorIniciativaInterno_();
        await batalhaEnviarAcao_(id,'iniciativa',{d10,base,total});
        batalhaUltimoResultado_[id]=`Iniciativa enviada: 1d10 [${d10}] + ${base} = ${total}`;
        renderizarBatalhaCompartilhada_();
    }
};

window.batalhaResponderDefesa_=async(id,defender)=>{
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id),pend=batalhaEstado_?.pendencia;
    if(!p||!c||!pend||String(pend.defensorId)!==String(id)||!batalhaPodeControlar_(p))return;
    if(batalhaEstaInconsciente_(c)){
        if(batalhaEhMestre_())await batalhaProcessarDefesa_({personagemId:id,payload:{resposta:{defendeu:false,grau:'Falha',motivo:'inconsciente'}}});
        return;
    }

    let resposta={defendeu:false,grau:'Falha'};
    if(defender){
        if(Number(p.acoesAtuais||0)<=0){notificar_('Sem AÇ para defender.','aviso');return;}
        const token=document.getElementById(`battleDefenseSkill_${id}`)?.value||'';
        const per=batalhaResolverPericia_(token);if(!per)return;
        const baseBruto=obterValorRegistroPericia_(c,per.id,per.__especializacao);
        const base=valorPericiaComArmadura_(c,per,baseBruto).valor;
        const ajuste=aplicarDificuldadeEFadiga_(c,base,'padrao',batalhaPenalidadeCaido_(c)+batalhaPenalidadeTratamento_(c)+batalhaPenalidadeInfeccao_(c));
        const roll=Math.floor(Math.random()*100)+1;
        const r=classificarD100_(ajuste.valor,roll);
        const margem=batalhaMargem_(ajuste.valor,roll);
        somDado_();
        resposta={defendeu:true,grau:r.grau,rolagem:roll,valor:ajuste.valor,margem,pericia:getNome(per)};
        batalhaUltimoResultado_[id]=`${getNome(per)}: ${roll}/${ajuste.valor} → ${r.grau} · ${batalhaMargemTexto_(ajuste.valor,roll)}`;
    }

    if(batalhaEhMestre_()){
        await batalhaProcessarDefesa_({personagemId:id,payload:{resposta}});
    }else{
        await batalhaEnviarAcao_(id,'defesa',{resposta});
        batalhaUltimoResultado_[id]='Resposta de defesa enviada...';
        renderizarBatalhaCompartilhada_();
    }
};

async function batalhaProcessarDefesa_(acao){
    const pend=batalhaEstado_?.pendencia;if(!pend||pend.status!=='aguardando_defesa')return;
    if(String(pend.defensorId)!==String(acao.personagemId))return;

    const defensor=batalhaParticipante_(pend.defensorId);
    const atacante=batalhaParticipante_(pend.atacanteId);
    const resp=acao.payload?.resposta||{defendeu:false,grau:'Falha'};

    if(resp.defendeu){
        if(Number(defensor.acoesAtuais||0)<=0)return;
        defensor.acoesAtuais=Math.max(0,Number(defensor.acoesAtuais||0)-1);
        batalhaUltimoResultado_[defensor.id]=`${resp.pericia||'Defesa'}: ${resp.rolagem}/${resp.valor} → ${resp.grau} · ${batalhaMargemTexto_(resp.valor,resp.rolagem)}`;
    }else{
        batalhaUltimoResultado_[defensor.id]='Optou por não defender.';
    }

    if(resp.defendeu){
        batalhaLogPush_(
            batalhaEstado_,
            `${defensor?.nome||'Defensor'}: ${resp.pericia||'Defesa'} → ${resp.grau}.`,
            'defesa',
            {
                actorId:defensor?.id||pend.defensorId,
                textoDetalhado:`${defensor?.nome||'Defensor'}: ${resp.pericia||'Defesa'} ${resp.rolagem}/${resp.valor} → ${resp.grau} · ${batalhaMargemTexto_(resp.valor,resp.rolagem)}.`
            }
        );
    }else{
        batalhaLogPush_(batalhaEstado_,`${defensor?.nome||'Defensor'} optou por não defender.`,'defesa',{actorId:defensor?.id||pend.defensorId});
    }

    const ag=batalhaResultadoGradeValor_(pend.ataque?.grau);
    const dg=resp.defendeu?batalhaResultadoGradeValor_(resp.grau):1;
    const acertou=ag>=2 && (!resp.defendeu || ag>dg);

    if(acertou){
        const especiais=Math.max(0,ag-dg);
        batalhaEstado_.danoPendente={
            id:`dmg_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
            atacanteId:pend.atacanteId,
            defensorId:pend.defensorId,
            ataque:pend.ataque,
            defensorTemArma:!!batalhaArmaAtualDefensor_({defensorId:pend.defensorId}),
            especiaisRestantes:especiais,
            escolhasEspeciais:[],
            criadoEm:new Date().toISOString()
        };
        const dpCriado=batalhaEstado_.danoPendente;
        const temEspecialAplicavel=especiais>0 && batalhaEspeciaisDisponiveis_(dpCriado).length>0;
        if(especiais>0 && !temEspecialAplicavel)dpCriado.especiaisRestantes=0;
        batalhaUltimoResultado_[pend.atacanteId]=temEspecialAplicavel
            ?`Ataque acertou. ${especiais} efeito(s) especial(is) antes do dano.`
            :'Ataque acertou. Dano liberado.';
        batalhaLogPush_(batalhaEstado_,`${atacante?.nome||'Atacante'} acertou ${defensor?.nome||'o alvo'}.`,'acerto',{actorId:atacante?.id||pend.atacanteId,targetId:defensor?.id||pend.defensorId});
    }else{
        batalhaEstado_.danoPendente=null;
        batalhaUltimoResultado_[pend.atacanteId]='Ataque defendido.';
        batalhaLogPush_(batalhaEstado_,`${defensor?.nome||'Defensor'} evitou o ataque.`,'defesa',{actorId:defensor?.id||pend.defensorId,targetId:atacante?.id||pend.atacanteId});
    }
    batalhaEstado_.pendencia=null;

    if(atacante && Number(atacante.acoesAtuais||0)<=0){
        await batalhaAvancarTurnoInterno_();
    }
    await batalhaSalvarEstado_();
}


async function batalhaAplicarDanoNoAlvo_(atacanteId,total,nomeArma='Arma'){
    const dp=batalhaEstado_?.danoPendente;
    if(!dp||String(dp.atacanteId)!==String(atacanteId))return null;
    const defensor=batalhaParticipante_(dp.defensorId);
    const alvo=batalhaCharLocal_(dp.defensorId);
    if(!defensor||!alvo){
        batalhaEstado_.danoPendente=null;
        batalhaUltimoResultado_[atacanteId]='Ataque cancelado: o alvo não está mais na batalha.';
        batalhaLogPush_(batalhaEstado_,'Dano pendente cancelado porque o alvo não está mais na batalha.','sistema',{actorId:atacanteId});
        await batalhaSalvarEstado_();
        return null;
    }

    const locRoll=batalhaLocalizacaoD20_();
    const roll=locRoll.roll;
    let local=dp.localEscolhido||locRoll.local;
    if(dp.ataque?.atacanteCaido && !batalhaArmaEhDistancia_(dp.ataque)){
        if(!['Perna Direita','Perna Esquerda'].includes(local)){
            local=Math.random()<0.5?'Perna Direita':'Perna Esquerda';
        }
    }
    const penetracao=Math.max(0,Number(dp.ataque?.penetracao||0));
    alvo.combate=alvo.combate||{};
    let pa=0,paEfetivo=0,danoFinal=0,pvAntes=0,pvDepois=0;

    if(modoCombateAtual_()==='simplificado'){
        const max=calcularPVGlobalMax_(alvo);
        if(!Number.isFinite(Number(alvo.combate.pvGlobalAtual)))alvo.combate.pvGlobalAtual=max;
        pvAntes=Math.max(0,Number(alvo.combate.pvGlobalAtual||0));
        pa=Math.max(0,Number(alvo.combate.armorGlobalManual||0)+Number(calcularPAGlobalEquipado_(alvo)||0));
        paEfetivo=dp.ignorarArmadura?0:Math.max(0,pa-penetracao);
        danoFinal=Math.max(0,Number(total||0)-paEfetivo);
        pvDepois=Math.max(0,pvAntes-danoFinal);
        alvo.combate.pvGlobalAtual=pvDepois;
    }else{
        const attrs=alvo.atributos||{},bonus=alvo.bonus||{};
        const con=(attrs.CON||10)+(bonus.CON||0),tam=(attrs.TAM||10)+(bonus.TAM||0);
        const maxLoc=calcularHitLocations_(con,tam);
        alvo.combate.hitLocations=alvo.combate.hitLocations||{};
        alvo.combate.armor=alvo.combate.armor||{};
        pvAntes=Object.prototype.hasOwnProperty.call(alvo.combate.hitLocations,local)
            ?Number(alvo.combate.hitLocations[local]||0)
            :Number(maxLoc[local]||0);
        const paEq=calcularPAEquipado_(alvo,Object.keys(maxLoc));
        pa=Math.max(0,Number(alvo.combate.armor[local]||0)+Number(paEq[local]||0));
        paEfetivo=dp.ignorarArmadura?0:Math.max(0,pa-penetracao);
        danoFinal=Math.max(0,Number(total||0)-paEfetivo);
        pvDepois=pvAntes-danoFinal;
        alvo.combate.hitLocations[local]=pvDepois;

        const maxLocal=Number(maxLoc[local]||1);
        const antesSerio=pvAntes<=0;
        const antesGrave=pvAntes<=-maxLocal;
        const agoraSerio=pvDepois<=0;
        const agoraGrave=pvDepois<=-maxLocal;
        const ferimentos=batalhaWoundState_(alvo);
        ferimentos[local]=ferimentos[local]||{};
        if(agoraSerio){
            ferimentos[local].serio=true;
            ferimentos[local].grave=agoraGrave;
            if(!antesSerio){
                const stun=Math.floor(Math.random()*3)+1;
                alvo.combate.ataquesBloqueadosTurnos=Math.max(Number(alvo.combate.ataquesBloqueadosTurnos||0),stun);
                const end=batalhaRolarResistenciaFerimento_(alvo,dp.ataque);
                ferimentos[local].resistencia=end;
                ferimentos[local].stunTurnos=stun;
                const membro=/Braço|Perna/.test(local);
                if(!end.passou){
                    if(membro)ferimentos[local].inutil=true;
                    else alvo.combate.inconsciente=true;
                }
                batalhaLogPush_(batalhaEstado_,`${defensor.nome}: Ferimento Sério em ${local}; não pode atacar por ${stun} turno(s). Resistência ${end.roll}/${end.valor} → ${end.grau}${end.passou?' (resistiu)':' (falhou)'}.`,'ferimento',{targetId:defensor.id});
            }
        }
        if(agoraGrave&&!antesGrave){
            ferimentos[local].grave=true;
            alvo.combate.incapacitado=true;
            defensor.acoesAtuais=0;
            const end=batalhaRolarResistenciaFerimento_(alvo,dp.ataque);
            ferimentos[local].resistenciaGrave=end;
            if(!end.passou){
                if(/Cabeça|Peito|Abdômen/.test(local)){
                    alvo.combate.morto=true;
                    alvo.combate.fadiga='Dead';
                }else{
                    ferimentos[local].inutil=true;
                    alvo.combate.inconsciente=true;
                }
            }
            batalhaLogPush_(batalhaEstado_,`${defensor.nome}: FERIMENTO GRAVE em ${local}. ${end.passou?'Sobreviveu ao teste de Resistência, mas está incapacitado.':(/Cabeça|Peito|Abdômen/.test(local)?'Falhou na Resistência: morte imediata.':'Falhou na Resistência: membro destruído e inconsciência.')}`,'ferimento_grave',{targetId:defensor.id});
        }else if(!agoraSerio){
            delete ferimentos[local];
        }
    }

    // Bleed: only if the hit actually penetrated and injured.
    if(dp.sangrar && danoFinal>0){
        const end=batalhaRolarResistenciaFerimento_(alvo,dp.ataque);
        if(!end.passou){
            alvo.combate.sangramentoAtivo=true;
            alvo.combate.sangramentoOrigem={ataque:dp.ataque,local,iniciadoRodada:Number(batalhaEstado_?.rodada||1)};
            batalhaLogPush_(batalhaEstado_,`${defensor.nome} começou a sangrar (${end.roll}/${end.valor} → ${end.grau}).`,'sangramento',{targetId:defensor.id});
        }else{
            batalhaLogPush_(batalhaEstado_,`${defensor.nome} resistiu ao efeito Sangrar.`,'sangramento',{targetId:defensor.id});
        }
    }

    
    // Propriedades especiais de criaturas só entram em vigor quando o golpe causa dano.
    if(dp.infectar && danoFinal>0 && !alvo.combate?.infectado?.ativo){
        alvo.combate.infectado={ativo:true,origem:dp.ataque?.equipamento||nomeArma,iniciadoRodada:Number(batalhaEstado_?.rodada||1)};
        batalhaLogPush_(batalhaEstado_,`${defensor.nome} foi infectado: +1 grau de dificuldade em todos os testes até tratamento.`,'infeccao',{targetId:defensor.id});
    }
    if(dp.trombetaSonora && danoFinal>0){
        const rodadas=Math.floor(Math.random()*20)+1;
        alvo.combate.surdoRodadas=Math.max(Number(alvo.combate.surdoRodadas||0),rodadas);
        alvo.combate.empurradoPorSom=true;
        batalhaLogPush_(batalhaEstado_,`${defensor.nome} foi atingido pela Trombeta sonora: empurre/reposicione o alvo manualmente no grid e ele fica surdo por ${rodadas} rodada(s).`,'som',{targetId:defensor.id});
    }

// Damage Weapon: o equipamento, e não a mão, recebe o dano.
    let inventarioAlterado=false;
    if(dp.danificarArma){
        const armaAlvo=batalhaArmaAtualDefensor_(dp);
        if(armaAlvo&&Number(armaAlvo.pv||0)>0){
            const apItem=Math.max(0,Number(armaAlvo.pa||0));
            const danoArma=Math.max(0,Number(total||0)-apItem);
            const maxItem=Math.max(1,Number(armaAlvo.pv||1));
            armaAlvo.pvAtual=Math.max(0,Number(armaAlvo.pvAtual??maxItem)-danoArma);
            inventarioAlterado=true;
            if(armaAlvo.pvAtual<=0){
                armaAlvo.inutilizavel=true;
                defensor.armaIncapacitada=true;
                defensor.armaIncapacitadaNome=String(getNome(armaAlvo)||'Arma');
                armaAlvo.quebradoEm=new Date().toISOString();
                batalhaLogPush_(batalhaEstado_,`${getNome(armaAlvo)} chegou a 0 PV e ficou INUTILIZÁVEL. O personagem precisa trocar de arma.`,'arma_quebrada',{targetId:defensor.id});
            }else{
                batalhaLogPush_(batalhaEstado_,`${getNome(armaAlvo)} sofreu ${danoArma} de dano (PV ${armaAlvo.pvAtual}/${maxItem}).`,'danificar_arma',{targetId:defensor.id});
            }
        }
    }

    batalhaSincronizarStatusPublico_(alvo,defensor);
    if(alvo.__npcTemporario){
        defensor.npcCombate=JSON.parse(JSON.stringify(alvo.combate||{}));
        defensor.npcInventario=JSON.parse(JSON.stringify(alvo.inventario||{}));
    }else if(alvo.__criaturaTemporaria){
        defensor.criaturaCombate=JSON.parse(JSON.stringify(alvo.combate||{}));
    }else{
        const dadosSalvar={combate:alvo.combate};
        if(inventarioAlterado)dadosSalvar.inventario=alvo.inventario;
        await setDoc(doc(db,'personagens',alvo.id),dadosSalvar,{merge:true});
    }

    const resultado={
        d20:roll,local,bruto:Number(total||0),penetracao,pa,paEfetivo,danoFinal,pvAntes,pvDepois,
        defensorId:alvo.id,defensorNome:defensor.nome,nomeArma
    };

    batalhaUltimoResultado_[atacanteId]=`${nomeArma}: ${total} bruto · D20 ${roll} → ${local} · PA ${pa}${penetracao?` − Pen ${penetracao} = ${paEfetivo}`:''} · dano ${danoFinal}`;
    batalhaUltimoResultado_[alvo.id]=`Atingido em ${local}: ${pvAntes} → ${pvDepois} PV`;

    batalhaLogPush_(
        batalhaEstado_,
        `${batalhaParticipante_(atacanteId)?.nome||'Atacante'} atingiu ${defensor.nome} em ${local} (D20 ${roll}) · dano recebido ${danoFinal}.`,
        'dano',
        {
            actorId:atacanteId,
            targetId:defensor.id,
            textoAtor:`${batalhaParticipante_(atacanteId)?.nome||'Atacante'} atingiu ${defensor.nome} em ${local} (D20 ${roll}) · dano causado ${danoFinal}.`,
            textoAlvo:`${batalhaParticipante_(atacanteId)?.nome||'Atacante'} atingiu ${defensor.nome} em ${local} (D20 ${roll}) · dano recebido ${danoFinal} · PV ${pvAntes} → ${pvDepois}.`,
            textoDetalhado:`${batalhaParticipante_(atacanteId)?.nome||'Atacante'} atingiu ${defensor.nome} em ${local} (D20 ${roll}) · dano bruto ${Number(total||0)} · PA ${pa}${penetracao?` − Pen ${penetracao} = ${paEfetivo}`:''} · dano final ${danoFinal} · PV ${pvAntes} → ${pvDepois}.`
        }
    );
    batalhaEstado_.danoPendente=null;

    const atacante=batalhaParticipante_(atacanteId);
    if(atacante&&Number(atacante.acoesAtuais||0)<=0)await batalhaAvancarTurnoInterno_();
    await batalhaSalvarEstado_();
    return resultado;
}

window.batalhaRolarDano_=async(id)=>{
    const p=batalhaParticipante_(id),c=batalhaCharLocal_(id),dp=batalhaEstado_?.danoPendente;
    if(!p||!c||!dp||dp.atacanteId!==id||!batalhaPodeControlar_(p))return;
    if(Number(dp.especiaisRestantes||0)>0){
        const disponiveis=batalhaEspeciaisDisponiveis_(dp);
        if(disponiveis.length){
            notificar_('Escolha ou descarte todos os Efeitos Especiais antes de rolar o dano.','aviso');return;
        }
        // Nunca bloquear o jogador por um efeito que seu cliente não consegue apresentar.
        dp.especiaisRestantes=0;
    }
    const prefs=batalhaGarantirPrefsValidas_(c,batalhaPrefsChar_(c));
    const per=batalhaResolverPericia_(prefs.pericia);

    let expr='',nome='Punhos',item=null;
    const equipamentoNatural=String(prefs.equipamento||'').startsWith('natural:');
    if(equipamentoNatural || per?.id==='combate_desarmado'){
        item=ataqueNaturalPorValor_(c,prefs.equipamento);
        if(!item && per?.id==='combate_desarmado')item=ataqueNaturalPorNome_('Punhos');
        if(!item){notificar_('Ataque natural não encontrado. Selecione novamente o ataque.','aviso');return;}
        expr=String(item?.dano||'1d3+MD');nome=getNome(item)||item.nome||'Ataque natural';
    }else{
        item=encontrarEquipamentoCombateChar_(c,prefs.equipamento);
        if(!item){notificar_('Selecione uma arma.','aviso');return;}
        if(itemCombateInutilizavel_(item)){notificar_(`${getNome(item)} está inutilizável (0 PV). Troque de arma.`,'aviso');return;}
        expr=String(item.dano||'').trim();nome=getNome(item);
    }
    if(/MD/i.test(expr)){
        const a=c.atributos||{},b=c.bonus||{};
        const mod=String(calcularModDano(Number(a.FOR||0)+Number(b.FOR||0),Number(a.TAM||0)+Number(b.TAM||0))||'0').trim();
        expr=expr.replace(/\+?MD/ig,mod&&mod!=='0'&&mod!=='+0'?(mod.startsWith('+')||mod.startsWith('-')?mod:`+${mod}`):'');
    }
    if(!expr){notificar_('Dano não cadastrado.','aviso');return;}
    const r=rolarExpressaoDanoCombate_(expr);
    if(!r){notificar_(`Não foi possível interpretar o dano: ${expr}`,'aviso');return;}
    tocarSomDano_(item,nome);

    if(batalhaEhMestre_()){
        await batalhaAplicarDanoNoAlvo_(id,r.total,nome);
        batalhaUltimoResultado_[id]=`${nome}: ${r.detalhes.join(' · ')} → ${r.total} bruto`;
        renderizarBatalhaCompartilhada_();
    }else{
        await batalhaEnviarAcao_(id,'dano',{total:r.total,expr,nome,detalhes:r.detalhes,danoPendenteId:String(dp.id||'')});
        batalhaUltimoResultado_[id]=`${nome}: ${r.detalhes.join(' · ')} → ${r.total} (aguardando aplicação)`;
        renderizarBatalhaCompartilhada_();
    }
};

async function batalhaProcessarAcaoJogador_(acao,refDoc){
    if(!batalhaEhMestre_()||!acao||acao.status!=='novo'||!batalhaEstado_?.ativo)return;
    const p=batalhaParticipante_(acao.personagemId);
    const c=batalhaCharLocal_(acao.personagemId);
    if(!p||!c)return;
    if(String(p.donoUid)!==String(acao.donoUid))return;

    try{
        if(acao.tipo==='iniciativa'){
            if(!batalhaTemIniciativa_(p)){
                p.iniciativa=Number(acao.payload?.total);
                batalhaUltimoResultado_[p.id]=`Iniciativa: 1d10 [${Number(acao.payload?.d10||0)}] + ${Number(acao.payload?.base||0)} = ${p.iniciativa}`;
                batalhaLogPush_(batalhaEstado_,`${p.nome} rolou iniciativa ${p.iniciativa}.`,'iniciativa',{actorId:p.id});
                batalhaOrdenarPorIniciativaInterno_();
                await batalhaSalvarEstado_();
            }
        }else if(acao.tipo==='teste'){
            const atual=batalhaEstado_.participantes?.[Number(batalhaEstado_.turnoIndex||0)];
            if(String(atual?.id)===String(p.id)){
                await batalhaExecutarAtaqueMestre_(p.id,{prefs:acao.payload?.prefs});
                renderizarBatalhaCompartilhada_();
            }
        }else if(acao.tipo==='defesa'){
            await batalhaProcessarDefesa_(acao);
        }else if(acao.tipo==='primeiros_socorros_iniciar'){
            const atual=batalhaEstado_.participantes?.[Number(batalhaEstado_.turnoIndex||0)];
            if(atual?.id===p.id)await batalhaIniciarPrimeirosSocorrosMestre_(p.id,acao.payload?.alvoId,acao.payload?.local);
        }else if(acao.tipo==='primeiros_socorros_continuar'){
            const atual=batalhaEstado_.participantes?.[Number(batalhaEstado_.turnoIndex||0)];
            if(atual?.id===p.id)await batalhaContinuarPrimeirosSocorrosMestre_(p.id);
        }else if(acao.tipo==='primeiros_socorros_concluir'){
            const atual=batalhaEstado_.participantes?.[Number(batalhaEstado_.turnoIndex||0)];
            if(atual?.id===p.id)await batalhaConcluirPrimeirosSocorrosMestre_(p.id);
        }else if(acao.tipo==='primeiros_socorros_cancelar'){
            await batalhaCancelarPrimeirosSocorrosMestre_(p.id);
        }else if(acao.tipo==='proximo'){
            const atual=batalhaEstado_.participantes?.[Number(batalhaEstado_.turnoIndex||0)];
            if(atual?.id===p.id && !batalhaEstado_.pendencia && !batalhaEstado_.danoPendente){
                const passagem=batalhaAplicarPassagem_(p);
                batalhaConsumirTurnoBloqueioFerimento_(c);
                await batalhaPersistirCombateChar_(c,p);
                batalhaUltimoResultado_[p.id]=passagem.custo
                    ?`Passou novamente e abdicou de 1 AÇ. Restam ${p.acoesAtuais}/${p.acoesMax}.`
                    :'Ação adiada. Se passar novamente nesta rodada, perderá 1 AÇ.';
                batalhaLogPush_(batalhaEstado_,passagem.custo
                    ?`${p.nome} passou e abdicou de 1 AÇ.`
                    :`${p.nome} adiou sua ação.`, 'passar',{actorId:p.id});
                await batalhaAvancarTurnoInterno_();
                await batalhaSalvarEstado_();
            }
        }else if(acao.tipo==='efeito_especial'){
            if(batalhaEstado_.danoPendente?.atacanteId===p.id){
                await batalhaAplicarEscolhaEspecialMestre_(p.id,String(acao.payload?.tipo||'pular'),String(acao.payload?.local||''));
            }
        }else if(acao.tipo==='dano'){
            const dp=batalhaEstado_.danoPendente;
            const mesmoAtacante=String(dp?.atacanteId||'')===String(p.id);
            const mesmoDano=!acao.payload?.danoPendenteId || String(dp?.id||'')===String(acao.payload.danoPendenteId);
            if(mesmoAtacante&&mesmoDano){
                const total=Number(acao.payload?.total||0);
                await batalhaAplicarDanoNoAlvo_(p.id,total,acao.payload?.nome||'Dano');
            }else{
                batalhaUltimoResultado_[p.id]='Rolagem de dano antiga descartada.';
            }
        }else if(acao.tipo==='posicao'){
            const gx=acao.payload?.gridX,gy=acao.payload?.gridY;
            if(gx===null||gy===null){
                if(!batalhaTemIniciativa_(p)){
                    p.gridX=null;p.gridY=null;
                    await batalhaSalvarEstado_();
                }
            }else{
                const x=Number(gx),y=Number(gy);
                const valido=Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<BATALHA_GRID_COLS_&&y>=0&&y<BATALHA_GRID_ROWS_;
                const ocupado=valido?batalhaCelulaOcupada_(x,y,p.id):true;
                if(valido&&!ocupado){
                    let permitido=false,tipo=String(acao.payload?.tipoMovimento||'');
                    const ox=Number(p.gridX),oy=Number(p.gridY);
                    if(!batalhaTemIniciativa_(p)){
                        permitido=true;tipo='livre';
                    }else if(batalhaIniciativasProntas_()){
                        const turno=batalhaEstado_.participantes?.[Number(batalhaEstado_.turnoIndex||0)];
                        if(String(turno?.id)===String(p.id)&&Number.isInteger(ox)&&Number.isInteger(oy)){
                            const dist=batalhaDistanciaCasas_(ox,oy,x,y);
                            if(tipo==='pago'&&dist<=2&&Number(p.acoesAtuais||0)>=1&&!batalhaEstado_.pendencia&&!batalhaEstado_.danoPendente&&!batalhaEstaTratandoPrimeirosSocorros_(c)){
                                p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-1);
                                permitido=true;
                            }else if(tipo!=='pago'&&dist<=1&&Number(p.movimentoGratisUsadoRodada||0)!==Number(batalhaEstado_.rodada||1)){
                                tipo='gratis';
                                p.movimentoGratisUsadoRodada=Number(batalhaEstado_.rodada||1);
                                permitido=true;
                            }
                        }
                    }
                    if(permitido){
                        p.gridX=x;p.gridY=y;p.movimentoPendente=null;
                        batalhaLogPush_(batalhaEstado_,`${p.nome} mudou de posição no mapa${tipo==='gratis'?' (movimento gratuito)':tipo==='pago'?' (Movimento 1 AÇ)':''}.`,'posicao',{actorId:p.id});
                        if(tipo==='pago'){
                            batalhaUltimoResultado_[p.id]=`Movimento concluído. Restam ${Number(p.acoesAtuais||0)}/${Number(p.acoesMax||0)} AÇ; você pode continuar agindo.`;
                        }else if(tipo==='gratis'){
                            batalhaUltimoResultado_[p.id]='Movimento gratuito concluído; você ainda pode agir.';
                        }
                        // Movimento consome AÇ, mas não encerra a oportunidade.
                        // O personagem pode gastar outras AÇ em novos movimentos, ataques ou outras ações.
                        await batalhaSalvarEstado_();
                        if(tipo==='pago'&&Number(p.acoesAtuais||0)<=0&&!batalhaEstado_.pendencia&&!batalhaEstado_.danoPendente){
                            await batalhaAvancarTurnoInterno_();
                            await batalhaSalvarEstado_();
                        }
                    }
                }
            }
        }else if(acao.tipo==='movimento'){
            const atual=batalhaEstado_.participantes?.[Number(batalhaEstado_.turnoIndex||0)];
            if(atual?.id===p.id && !batalhaEstado_.pendencia && !batalhaEstado_.danoPendente && Number(p.acoesAtuais||0)>=1 && !batalhaEstaTratandoPrimeirosSocorros_(c)){
                p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-1);
                p.movimentoPendente={tipo:'pago',rodada:Number(batalhaEstado_.rodada||1),origemX:Number(acao.payload?.origemX??p.gridX),origemY:Number(acao.payload?.origemY??p.gridY),max:2};
                batalhaUltimoResultado_[p.id]='Movimento: 1 AÇ gasto. Arraste até 2 casas em qualquer direção.';
                batalhaLogPush_(batalhaEstado_,`${p.nome} gastou 1 AÇ em Movimento (até 2 casas).`,'movimento',{actorId:p.id});
                await batalhaSalvarEstado_();
            }
        }else if(acao.tipo==='inventario_acao'){
            const atual=batalhaEstado_.participantes?.[Number(batalhaEstado_.turnoIndex||0)];
            const custo=Math.max(1,Math.floor(Number(acao.payload?.custo)||1));
            if(atual?.id===p.id && !batalhaEstado_.pendencia && !batalhaEstado_.danoPendente && Number(p.acoesAtuais||0)>=custo){
                p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-custo);
                batalhaLogPush_(batalhaEstado_,`${p.nome}: ${String(acao.payload?.motivo||'ação de inventário')} (${custo} AÇ).`,'inventario_combate',{actorId:p.id});
                if(Number(p.acoesAtuais||0)<=0 && !batalhaEstado_.pendencia && !batalhaEstado_.danoPendente){
                    await batalhaAvancarTurnoInterno_();
                }
                await batalhaSalvarEstado_();
            }
        }
    }finally{
        await setDoc(refDoc,{...acao,status:'processado',processadoEm:new Date().toISOString()},{merge:false});
    }
}


const BATALHA_GRID_COLS_=24,BATALHA_GRID_ROWS_=12;
function batalhaPodeMoverToken_(p){
    if(!p||!currentUserUid)return false;
    if(batalhaEhMestre_())return true;
    // O token do próprio jogador pode iniciar o gesto de arrastar.
    // A autorização real ocorre no DROP, onde turno, distância, passo grátis e AÇ
    // são validados. Isso evita o HTML draggable ficar preso por snapshots atrasados.
    return String(p.donoUid||'')===String(currentUserUid);
}
function batalhaDistanciaCasas_(x1,y1,x2,y2){
    // Regra simples escolhida para Mesa Estelar: diagonal, horizontal e vertical custam igual.
    return Math.max(Math.abs(Number(x2)-Number(x1)),Math.abs(Number(y2)-Number(y1)));
}
function batalhaValidarMovimentoJogador_(p,x,y){
    if(!batalhaTemIniciativa_(p))return {ok:true,tipo:'livre'};
    if(!batalhaIniciativasProntas_())return {ok:false,msg:'Sua iniciativa já foi rolada. Aguarde o início dos turnos para se mover.'};
    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)];
    if(String(atual?.id)!==String(p.id))return {ok:false,msg:'Você só pode mover durante seu turno.'};
    const ox=Number(p.gridX),oy=Number(p.gridY);
    if(!Number.isInteger(ox)||!Number.isInteger(oy))return {ok:false,msg:'O personagem precisa estar posicionado no mapa.'};

    const intentoLocal=batalhaMovimentoIntentoJogador_[String(p.id)];
    const pago=!!p.movimentoPendente||!!intentoLocal;
    if(pago){
        const origemX=Number(p.movimentoPendente?.origemX ?? intentoLocal?.origemX ?? ox);
        const origemY=Number(p.movimentoPendente?.origemY ?? intentoLocal?.origemY ?? oy);
        const dist=batalhaDistanciaCasas_(origemX,origemY,x,y);
        return dist<=2?{ok:true,tipo:'pago'}:{ok:false,msg:'Movimento de 1 AÇ permite no máximo 2 casas.'};
    }

    if(Number(p.movimentoGratisUsadoRodada||0)===Number(batalhaEstado_?.rodada||1))
        return {ok:false,msg:'O movimento gratuito desta rodada já foi usado. Clique em Movimento (1 AÇ) para mover novamente.'};

    const dist=batalhaDistanciaCasas_(ox,oy,x,y);
    return dist<=1?{ok:true,tipo:'gratis'}:{ok:false,msg:'O movimento gratuito permite 1 casa adjacente. Para mover até 2 casas, clique em Movimento (1 AÇ).'};
}
function batalhaPosGridValida_(p){
    const x=Number(p?.gridX),y=Number(p?.gridY);
    return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<BATALHA_GRID_COLS_&&y>=0&&y<BATALHA_GRID_ROWS_;
}
function batalhaCelulaOcupada_(x,y,excetoId=''){
    return (batalhaEstado_?.participantes||[]).find(p=>String(p.id)!==String(excetoId)&&batalhaPosGridValida_(p)&&Number(p.gridX)===x&&Number(p.gridY)===y);
}
function batalhaPosicaoAleatoriaLivre_(estado){
    const ocupadas=new Set(
        (estado?.participantes||[])
          .filter(batalhaPosGridValida_)
          .map(p=>`${Number(p.gridX)},${Number(p.gridY)}`)
    );
    const livres=[];
    for(let y=0;y<BATALHA_GRID_ROWS_;y++){
        for(let x=0;x<BATALHA_GRID_COLS_;x++){
            if(!ocupadas.has(`${x},${y}`))livres.push({x,y});
        }
    }
    if(!livres.length)return {x:null,y:null};
    return livres[Math.floor(Math.random()*livres.length)];
}
window.batalhaDragToken_=function(ev,id){
    const p=batalhaParticipante_(id);
    if(!batalhaPodeMoverToken_(p)){ev.preventDefault();return;}
    ev.dataTransfer.setData('text/plain',String(id));
    ev.dataTransfer.effectAllowed='move';
};
window.batalhaGridDragOver_=function(ev){ev.preventDefault();ev.currentTarget.classList.add('drag-over');};
window.batalhaGridDragLeave_=function(ev){ev.currentTarget.classList.remove('drag-over');};
window.batalhaGridDrop_=async function(ev,x,y){
    ev.preventDefault();ev.currentTarget.classList.remove('drag-over');
    const id=ev.dataTransfer.getData('text/plain'),p=batalhaParticipante_(id);
    if(!p||!batalhaPodeMoverToken_(p))return;
    const ocupado=batalhaCelulaOcupada_(x,y,id);
    if(ocupado){notificar_(`A casa já está ocupada por ${ocupado.nome}.`,'aviso');return;}

    if(batalhaEhMestre_()){
        const eraMovimentoPago=!!p.movimentoPendente;
        p.gridX=x;p.gridY=y;
        if(p.movimentoPendente)p.movimentoPendente=null;
        batalhaLogPush_(batalhaEstado_,`${p.nome} mudou de posição no mapa${eraMovimentoPago?' (Movimento 1 AÇ)':''}.`,'posicao',{actorId:p.id});
        if(eraMovimentoPago)batalhaUltimoResultado_[p.id]=`Movimento concluído. Restam ${Number(p.acoesAtuais||0)}/${Number(p.acoesMax||0)} AÇ; você pode continuar agindo.`;
        renderizarBatalhaPosicoes_();
        // Movimento pago só encerra a oportunidade quando consumir a última AÇ disponível.
        await batalhaSalvarEstado_();
        if(eraMovimentoPago&&Number(p.acoesAtuais||0)<=0&&!batalhaEstado_.pendencia&&!batalhaEstado_.danoPendente){
            await batalhaAvancarTurnoInterno_();
            await batalhaSalvarEstado_();
        }
    }else{
        const regra=batalhaValidarMovimentoJogador_(p,x,y);
        if(!regra.ok){notificar_(regra.msg,'aviso');return;}
        const origemX=p.gridX,origemY=p.gridY;
        p.gridX=x;p.gridY=y;
        if(regra.tipo==='gratis')p.movimentoGratisUsadoRodada=Number(batalhaEstado_.rodada||1);
        if(regra.tipo==='pago'){
            p.movimentoPendente=null;
            delete batalhaMovimentoIntentoJogador_[String(id)];
        }
        renderizarBatalhaPosicoes_();
        await batalhaEnviarAcao_(id,'posicao',{gridX:x,gridY:y,origemX,origemY,tipoMovimento:regra.tipo});
    }
};
window.batalhaGridRemover_=async function(ev){
    ev.preventDefault();
    const id=ev.dataTransfer.getData('text/plain'),p=batalhaParticipante_(id);
    if(!p||!batalhaPodeMoverToken_(p))return;
    if(!batalhaEhMestre_()&&batalhaTemIniciativa_(p)){
        notificar_('Depois de rolar a iniciativa o personagem não pode ser retirado livremente do mapa.','aviso');
        return;
    }
    p.gridX=null;p.gridY=null;
    renderizarBatalhaPosicoes_();
    if(batalhaEhMestre_())await batalhaSalvarEstado_();
    else await batalhaEnviarAcao_(id,'posicao',{gridX:null,gridY:null,tipoMovimento:'livre'});
};

function batalhaTokenDadosVisuais_(id){
    const p=batalhaParticipante_(id);
    if(!p)return null;
    const c=batalhaCharLocal_(id);
    return {
        id:String(p.id),
        nome:String(p.nome||c?.nome||'Personagem'),
        imagem:String(p.imagem||c?.imagem||''),
        tipo:String(p.tipo||batalhaTipoChar_(c)||'')
    };
}
window.batalhaTokenPreviewMostrar_=function(ev,id){
    if(!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches)return;
    const d=batalhaTokenDadosVisuais_(id);
    const box=document.getElementById('battleTokenPreview');
    if(!d||!box)return;
    box.innerHTML=`${d.imagem
        ? `<img src="${escaparHtmlInventario_(d.imagem)}" alt="${escaparHtmlInventario_(d.nome)}">`
        : `<div class="battle-token-modal-fallback" style="min-height:180px;">👤</div>`}
      <div class="battle-token-preview-name">${escaparHtmlInventario_(d.nome)}</div>
      <div class="battle-token-preview-type">${escaparHtmlInventario_(d.tipo)}</div>`;
    box.classList.add('visible');
    box.setAttribute('aria-hidden','false');
    batalhaTokenPreviewMover_(ev);
};
window.batalhaTokenPreviewMover_=function(ev){
    const box=document.getElementById('battleTokenPreview');
    if(!box||!box.classList.contains('visible'))return;
    const margem=14;
    const w=box.offsetWidth||220,h=box.offsetHeight||280;
    let x=Number(ev.clientX||0)+18,y=Number(ev.clientY||0)+18;
    if(x+w+margem>window.innerWidth)x=Math.max(margem,Number(ev.clientX||0)-w-18);
    if(y+h+margem>window.innerHeight)y=Math.max(margem,Number(ev.clientY||0)-h-18);
    box.style.left=`${x}px`;
    box.style.top=`${y}px`;
};
window.batalhaTokenPreviewEsconder_=function(){
    const box=document.getElementById('battleTokenPreview');
    if(!box)return;
    box.classList.remove('visible');
    box.setAttribute('aria-hidden','true');
};
window.batalhaAbrirTokenPreview_=function(id){
    batalhaTokenPreviewEsconder_();
    const d=batalhaTokenDadosVisuais_(id);
    if(!d)return;
    document.getElementById('battleTokenModal')?.remove();
    const modal=document.createElement('div');
    modal.id='battleTokenModal';
    modal.className='battle-token-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-label',`Visualização de ${d.nome}`);
    modal.innerHTML=`<div class="battle-token-modal-card" onclick="event.stopPropagation()">
        ${d.imagem
          ? `<img src="${escaparHtmlInventario_(d.imagem)}" alt="${escaparHtmlInventario_(d.nome)}">`
          : `<div class="battle-token-modal-fallback">👤</div>`}
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:11px;">
          <div style="min-width:0;">
            <div style="font-size:1.3em;font-weight:800;color:#fff;">${escaparHtmlInventario_(d.nome)}</div>
            <div style="color:#aaa;margin-top:2px;">${escaparHtmlInventario_(d.tipo)}</div>
          </div>
          <button type="button" class="btn-small" onclick="document.getElementById('battleTokenModal')?.remove()">✕ Fechar</button>
        </div>
      </div>`;
    modal.addEventListener('click',()=>modal.remove());
    document.body.appendChild(modal);
};
function batalhaTokenHtml_(p){
    const pode=batalhaPodeMoverToken_(p),atual=(batalhaEstado_?.participantes||[])[Number(batalhaEstado_?.turnoIndex||0)]?.id===p.id;
    const iniciais=String(p.nome||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
    return `<div class="battle-token ${atual?'current':''}"
        draggable="${pode?'true':'false'}"
        ${pode?`ondragstart="batalhaTokenPreviewEsconder_();batalhaDragToken_(event,'${p.id}')"`:''}
        onmouseenter="batalhaTokenPreviewMostrar_(event,'${p.id}')"
        onmousemove="batalhaTokenPreviewMover_(event)"
        onmouseleave="batalhaTokenPreviewEsconder_()"
        onclick="batalhaAbrirTokenPreview_('${p.id}')"
        title="${escaparHtmlInventario_(p.nome)}${pode?' · arraste para mover · clique para ampliar':' · clique para ampliar'}">
      ${p.imagem?`<img src="${escaparHtmlInventario_(p.imagem)}" alt="${escaparHtmlInventario_(p.nome)}">`:`<span>${escaparHtmlInventario_(iniciais||'👤')}</span>`}
    </div>`;
}
function renderizarBatalhaPosicoes_(){
    const el=document.getElementById('battlePositionPanel');if(!el)return;
    if(!batalhaEstado_?.ativo||!(batalhaEstado_.participantes||[]).length){el.innerHTML='';return;}
    const ps=batalhaEstado_.participantes||[],fora=ps.filter(p=>!batalhaPosGridValida_(p));
    let cells='';
    for(let y=0;y<BATALHA_GRID_ROWS_;y++){
        for(let x=0;x<BATALHA_GRID_COLS_;x++){
            const p=ps.find(q=>batalhaPosGridValida_(q)&&Number(q.gridX)===x&&Number(q.gridY)===y);
            cells+=`<div class="battle-grid-cell" ondragover="batalhaGridDragOver_(event)" ondragleave="batalhaGridDragLeave_(event)" ondrop="batalhaGridDrop_(event,${x},${y})">${p?batalhaTokenHtml_(p):''}</div>`;
        }
    }
    el.innerHTML=`<div style="padding:13px;border-radius:12px;background:rgba(0,0,0,.13);border:1px solid rgba(255,255,255,.10);">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:7px">
        <h3 style="margin:0;color:#b8c8ff;">🗺️ Mapa do combate</h3>
        <small style="color:#888;">24 × 12 casas · cada personagem se posiciona livremente até rolar sua própria iniciativa · depois: só no turno, 1 casa grátis/rodada ou até 2 casas por 1 AÇ.</small>
      </div>
      ${fora.length?`<div><small style="color:#aaa;">Aguardando posicionamento:</small><div class="battle-unplaced" ondragover="event.preventDefault()" ondrop="batalhaGridRemover_(event)">${fora.map(batalhaTokenHtml_).join('')}</div></div>`:''}
      <div class="battle-grid-wrap"><div class="battle-grid">${cells}</div></div>
      <small style="display:block;color:#777;margin-top:7px;">Movimento: 1 casa adjacente grátis por rodada; Movimento (1 AÇ) libera até 2 casas. Diagonal, vertical e horizontal têm o mesmo custo. O mestre mantém reposicionamento livre.</small>
    </div>`;
}


function batalhaPendenciaDefesaMestreHtml_(){
    if(!batalhaEhMestre_())return '';
    const pend=batalhaEstado_?.pendencia;
    if(!pend||pend.status!=='aguardando_defesa')return '';
    const p=batalhaParticipante_(pend.defensorId),c=batalhaCharLocal_(pend.defensorId);
    if(!p||!c)return '';
    return `<div style="margin:0 0 12px;padding:12px;border-radius:10px;background:rgba(231,76,60,.11);border:1px solid rgba(231,76,60,.45);">
      <div style="font-weight:700;color:#ffaca4;">⚔️ Defesa pendente: ${escaparHtmlInventario_(p.nome)} está sendo atacado por ${escaparHtmlInventario_(pend.atacanteNome||'um atacante')}.</div>
      <div style="margin-top:8px;">${batalhaDefesaHtml_(p,c,pend)}</div>
    </div>`;
}
function renderizarBatalhaCompartilhada_(){
    const badge=document.getElementById('battleRoundBadge');
    const cards=document.getElementById('battleParticipantCards');
    const log=document.getElementById('battlePublicLog');
    const pend=document.getElementById('battlePendingGlobal');
    if(!badge||!cards)return;

    renderizarBatalhaCandidatos_();
    renderizarBatalhaPosicoes_();

    if(!batalhaEstado_?.ativo || !(batalhaEstado_.participantes||[]).length){
        badge.textContent='Fora de combate';
        cards.innerHTML='<div style="padding:24px;border-radius:12px;border:1px dashed rgba(255,255,255,.18);color:#888;">Nenhuma batalha ativa. O mestre pode adicionar participantes acima.</div>';
        if(log)log.innerHTML='<div style="color:#888;">Sem eventos.</div>';
        if(pend)pend.innerHTML='';
        return;
    }

    badge.textContent=`Rodada ${batalhaEstado_.rodada||1} · Ciclo ${batalhaEstado_.ciclo||1}`;

    const html=[];
    for(const p of batalhaEstado_.participantes||[]){
        const controla=batalhaPodeControlar_(p);
        const c=batalhaCharLocal_(p.id);
        if(controla&&c)html.push(batalhaControlCard_(p,c));
        else html.push(batalhaPublicCard_(p));
    }
    cards.innerHTML=html.join('');

    if(pend){
        const pe=batalhaEstado_.pendencia;
        if(pe){
            const pd=batalhaParticipante_(pe.defensorId),cd=batalhaCharLocal_(pe.defensorId);
            const controles=(batalhaEhMestre_()&&pd&&cd)
                ? `<div style="margin-top:9px;">${batalhaDefesaHtml_(pd,cd,pe)}</div>`
                : '';
            pend.innerHTML=`<div style="padding:10px 12px;border-radius:9px;background:rgba(255,193,7,.08);border:1px solid rgba(255,193,7,.30);color:#ddd;">⏳ <strong>Aguardando defesa</strong> de <strong>${escaparHtmlInventario_(pe.defensorNome||'defensor')}</strong> contra o ataque de <strong>${escaparHtmlInventario_(pe.atacanteNome||'atacante')}</strong>.${controles}</div>`;
        }else pend.innerHTML='';
    }

    if(log){
        const itens=batalhaEstado_.logPublico||[];
        log.innerHTML=itens.length?itens.map(x=>`<div style="padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.035);color:#ccc;"><small style="color:#777;">${new Date(x.timestamp).toLocaleTimeString()}</small> · ${escaparHtmlInventario_(batalhaTextoLogVisivel_(x))}</div>`).join(''):'<div style="color:#888;">Sem eventos.</div>';
    }
}

function iniciarBatalhaCompartilhada_(){
    if(batalhaUnsub_){try{batalhaUnsub_();}catch(e){} batalhaUnsub_=null;}
    if(batalhaAcoesUnsub_){try{batalhaAcoesUnsub_();}catch(e){} batalhaAcoesUnsub_=null;}
    if(batalhaPersonagensUnsub_){try{batalhaPersonagensUnsub_();}catch(e){} batalhaPersonagensUnsub_=null;}
    if(!currentUserUid)return;

    batalhaUnsub_=onSnapshot(BATALHA_DOC_REF(),snap=>{
        batalhaEstado_=snap.exists()?snap.data():null;
        if(batalhaEstado_?.participantes){
            batalhaEstado_.participantes.forEach(p=>{
                if(p.iniciativa===undefined)p.iniciativa=null;
                const temGX=p.gridX!==null&&p.gridX!==undefined&&p.gridX!=='';
                const temGY=p.gridY!==null&&p.gridY!==undefined&&p.gridY!=='';
                const gx=temGX?Number(p.gridX):NaN,gy=temGY?Number(p.gridY):NaN;
                p.gridX=Number.isInteger(gx)&&gx>=0&&gx<BATALHA_GRID_COLS_?gx:null;
                p.gridY=Number.isInteger(gy)&&gy>=0&&gy<BATALHA_GRID_ROWS_?gy:null;
                if(p.gridX===null||p.gridY===null){p.gridX=null;p.gridY=null;}
                delete p.posicao;
            });
        }
        const limpou=batalhaLimparPendenciasInvalidas_(batalhaEstado_);
        if(limpou&&batalhaEhMestre_())batalhaSalvarEstado_().catch(e=>console.warn('Limpeza de pendência inválida:',e));
        renderizarBatalhaCompartilhada_();
    },err=>{
        console.warn('Batalha compartilhada:',err);
        notificar_('Não foi possível acessar o painel compartilhado. Verifique as regras do Firestore.','erro',5000);
    });

    if(!batalhaEhMestre_()){
        const qProprios=query(collection(db,'personagens'),where('dono','==',currentUserUid));
        batalhaPersonagensUnsub_=onSnapshot(qProprios,snap=>{
            snap.docChanges().forEach(ch=>{
                if(ch.type==='removed')return;
                const novo={id:ch.doc.id,...ch.doc.data()};
                const ix=(userCharacters||[]).findIndex(x=>x.id===novo.id);
                if(ix>=0)userCharacters[ix]={...userCharacters[ix],...novo};
            });
            renderizarBatalhaCompartilhada_();
            const charAtual=(userCharacters||[]).find(c=>c.id===currentCharId);
            if(charAtual&&document.getElementById('char-combate')?.classList.contains('active'))renderizarCombate(charAtual);
        },err=>console.warn('Fichas próprias em tempo real:',err));
    }

    if(batalhaEhMestre_()){
        batalhaAcoesUnsub_=onSnapshot(BATALHA_ACOES_REF(),async snap=>{
            if(batalhaProcessandoAcoes_)return;
            batalhaProcessandoAcoes_=true;
            try{
                for(const ch of snap.docChanges()){
                    if(ch.type==='removed')continue;
                    const acao=ch.doc.data();
                    if(acao?.status==='novo')await batalhaProcessarAcaoJogador_(acao,ch.doc.ref);
                }
            }finally{
                batalhaProcessandoAcoes_=false;
            }
        },err=>console.warn('Ações da batalha:',err));
    }
}


