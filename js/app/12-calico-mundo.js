// ============================================================
// CALICO — estado de mundo persistente v46.3
// O mestre pode rolar OU selecionar. Só "Aplicar ao cenário"
// publica os valores, evitando horários/datas contraditórios.
// ============================================================
const CALICO_DIAS_SEMANA_=[
    'Aurora','Vela','Forja','Peregrino','Coroa',
    'Nexo','Véspera','Farol','Órbita','Repouso'
];
const CALICO_ESTACOES_=[
    {nome:'Estação dos Ventos',dias:44},
    {nome:'Estação das Brumas',dias:44},
    {nome:'Estação das Flores',dias:44},
    {nome:'Estação do Sol Alto',dias:44},
    {nome:'Estação das Tempestades',dias:44},
    {nome:'Estação das Folhas',dias:44},
    {nome:'Estação dos Meteoros',dias:44},
    {nome:'Estação das Estrelas',dias:42}
];
const CALICO_FASES_LUA_=[
    'Lua Nova','Fio de Prata','Crescente','Meia-lua Ascendente','Gibosa Clara',
    'Lua Cheia','Gibosa Tardia','Meia-lua Descendente','Minguante','Lua Escura'
];
const CALICO_CONDICOES_=[
    'Céu limpo','Parcialmente nublado','Nublado','Chuva fraca','Chuva forte',
    'Neblina','Ventos fortes','Tempestade','Calor seco','Frio seco'
];

function calicoAleatorio_(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function calicoPadrao_(){
    return {
        hora:'12:00',diaMes:1,diaSemana:'Aurora',lua:'Lua Nova',
        estacao:'Estação dos Ventos',climaCondicao:'Céu limpo',
        temperatura:20,umidade:40
    };
}
function calicoAtual_(){
    return {...calicoPadrao_(),...(estadoCampanhaMestre?.calico||{})};
}
function calicoLerControles_(){
    return {
        hora:document.getElementById('calicoHora')?.value||'12:00',
        diaMes:Math.max(1,Math.floor(Number(document.getElementById('calicoDiaMes')?.value)||1)),
        diaSemana:document.getElementById('calicoDiaSemana')?.value||'Aurora',
        lua:document.getElementById('calicoLua')?.value||'Lua Nova',
        estacao:document.getElementById('calicoEstacao')?.value||'Estação dos Ventos',
        climaCondicao:document.getElementById('calicoClimaCondicao')?.value||'Céu limpo',
        temperatura:Number(document.getElementById('calicoTemperatura')?.value||0),
        umidade:Math.max(0,Math.min(100,Number(document.getElementById('calicoUmidade')?.value||0)))
    };
}
function calicoClimaTexto_(c){
    const x={...calicoPadrao_(),...(c||{})};
    return `${x.climaCondicao} · ${Number(x.temperatura)} °C · umidade ${Number(x.umidade)}%`;
}
function calicoRolarCampo_(tipo,c){
    const x={...c};
    if(tipo==='hora')x.hora=`${String(calicoAleatorio_(0,23)).padStart(2,'0')}:${String(calicoAleatorio_(0,59)).padStart(2,'0')}`;
    else if(tipo==='diaMes')x.diaMes=calicoAleatorio_(1,35);
    else if(tipo==='diaSemana')x.diaSemana=CALICO_DIAS_SEMANA_[calicoAleatorio_(0,CALICO_DIAS_SEMANA_.length-1)];
    else if(tipo==='lua')x.lua=CALICO_FASES_LUA_[calicoAleatorio_(0,CALICO_FASES_LUA_.length-1)];
    else if(tipo==='estacao')x.estacao=CALICO_ESTACOES_[calicoAleatorio_(0,CALICO_ESTACOES_.length-1)].nome;
    else if(tipo==='clima'){
        const cond=CALICO_CONDICOES_[calicoAleatorio_(0,CALICO_CONDICOES_.length-1)];
        x.climaCondicao=cond;
        const faixas={
            'Céu limpo':[[16,27],[22,45]],'Parcialmente nublado':[[13,24],[35,60]],'Nublado':[[10,20],[50,72]],
            'Chuva fraca':[[8,18],[70,90]],'Chuva forte':[[7,16],[82,98]],'Neblina':[[5,15],[88,100]],
            'Ventos fortes':[[8,20],[30,65]],'Tempestade':[[5,16],[78,98]],'Calor seco':[[27,38],[12,32]],'Frio seco':[[-4,8],[20,45]]
        };
        const [t,u]=faixas[cond];
        x.temperatura=calicoAleatorio_(t[0],t[1]);x.umidade=calicoAleatorio_(u[0],u[1]);
    }
    return x;
}
function renderizarRolagensCalico_(dados=null){
    const el=document.getElementById('calicoWorldRolls');if(!el)return;
    const c={...calicoAtual_(),...(dados||{})};
    const opt=(arr,val)=>arr.map(x=>`<option value="${escaparHtmlInventario_(x)}" ${x===val?'selected':''}>${escaparHtmlInventario_(x)}</option>`).join('');
    el.innerHTML=`<div style="margin-top:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
        <div>
          <strong style="color:#00d4ff;">🌍 Mundo de Calico</strong>
          <div style="font-size:.82em;color:#888;margin-top:3px;">Dia de 24 h · semana de 10 dias · ano de 350 dias. Valores abaixo só viram "atuais" quando você aplicar ao cenário.</div>
        </div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <button type="button" class="btn-small" onclick="calicoRolarTudo_()">🎲 Rolar tudo</button>
          <button type="button" class="btn-small btn-select" onclick="calicoAplicarAoCenario_()">📌 Aplicar ao cenário</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px;">
        <div style="padding:10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);">
          <div style="font-size:.78em;color:#999;">🕒 Hora</div>
          <input id="calicoHora" type="time" value="${escaparHtmlInventario_(c.hora)}" style="width:100%;margin:6px 0;">
          <button type="button" class="btn-small" onclick="calicoRolar_('hora')">Rolar</button>
        </div>
        <div style="padding:10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);">
          <div style="font-size:.78em;color:#999;">🔢 Dia do mês</div>
          <input id="calicoDiaMes" type="number" min="1" step="1" value="${Number(c.diaMes||1)}" style="width:100%;margin:6px 0;">
          <button type="button" class="btn-small" onclick="calicoRolar_('diaMes')">Rolar</button>
        </div>
        <div style="padding:10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);">
          <div style="font-size:.78em;color:#999;">📅 Dia da semana</div>
          <select id="calicoDiaSemana" style="width:100%;margin:6px 0;">${opt(CALICO_DIAS_SEMANA_,c.diaSemana)}</select>
          <button type="button" class="btn-small" onclick="calicoRolar_('diaSemana')">Rolar</button>
        </div>
        <div style="padding:10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);">
          <div style="font-size:.78em;color:#999;">🌙 Fase da lua</div>
          <select id="calicoLua" style="width:100%;margin:6px 0;">${opt(CALICO_FASES_LUA_,c.lua)}</select>
          <button type="button" class="btn-small" onclick="calicoRolar_('lua')">Rolar</button>
        </div>
        <div style="padding:10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);">
          <div style="font-size:.78em;color:#999;">🍂 Estação</div>
          <select id="calicoEstacao" style="width:100%;margin:6px 0;">${opt(CALICO_ESTACOES_.map(x=>x.nome),c.estacao)}</select>
          <button type="button" class="btn-small" onclick="calicoRolar_('estacao')">Rolar</button>
        </div>
        <div style="padding:10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);">
          <div style="font-size:.78em;color:#999;">🌦️ Clima</div>
          <select id="calicoClimaCondicao" style="width:100%;margin:6px 0;">${opt(CALICO_CONDICOES_,c.climaCondicao)}</select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <input id="calicoTemperatura" type="number" value="${Number(c.temperatura||0)}" title="Temperatura °C">
            <input id="calicoUmidade" type="number" min="0" max="100" value="${Number(c.umidade||0)}" title="Umidade %">
          </div>
          <div style="font-size:.72em;color:#777;margin:4px 0 6px;">°C / umidade %</div>
          <button type="button" class="btn-small" onclick="calicoRolar_('clima')">Rolar</button>
        </div>
      </div>
      <div style="font-size:.78em;color:#777;margin-top:9px;">O número do dia pode ser ajustado manualmente; a divisão formal dos meses de Calico ainda não está fixada.</div>
    </div>`;
}
window.calicoRolar_=function(tipo){
    const atual=calicoLerControles_();
    renderizarRolagensCalico_(calicoRolarCampo_(tipo,atual));
};
window.calicoRolarTudo_=function(){
    let c=calicoLerControles_();
    for(const k of ['hora','diaMes','diaSemana','lua','estacao','clima'])c=calicoRolarCampo_(k,c);
    renderizarRolagensCalico_(c);
};
window.calicoAplicarAoCenario_=async function(){
    if(userData?.role!=='mestre')return;
    const c=calicoLerControles_();
    estadoCampanhaMestre={...(estadoCampanhaMestre||{}),calico:c};
    await setDoc(doc(db,'configuracoes','escudoMestre'),{campanha:estadoCampanhaMestre},{merge:true});
    await publicarCampanhaAtual_();
    notificar_('Estado de Calico aplicado ao cenário atual.','info',3500);
};
document.addEventListener('DOMContentLoaded',()=>renderizarRolagensCalico_());

