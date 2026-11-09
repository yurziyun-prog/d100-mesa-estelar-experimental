import {miniaturaDeItem} from './mesa-itens-mini.js?v=194';
// v193: item sem imagem mostra a miniatura dele (desenho de cima, no traço do mapa) em vez da caixa
// imagem que não carrega (link quebrado) vira a miniatura do item
const miniAttr_=item=>{const m=miniaturaDeItem(item);return m?` data-mini="${m}" onerror="this.onerror=null;this.src=this.dataset.mini;this.classList.add('item-mini')"`:'';};
const miniaturaOuCaixa_=(item,nome='')=>{const m=miniaturaDeItem(item);return m?`<img class="item-mini" src="${m}" alt="${nome}">`:'📦';};
import {estadoOficinaMesa,prepararPublicacaoOficina,compactarPublicacaoOficina,hidratarReferenciasOficina,publicarOficina,mapaComCenaOficina,validarTamanhoOficina} from './nova-oficina.js?v=201';
import {criarRecuperacaoSenha,textosRecuperacao} from './recuperar-senha.js?v=51';
import {ignicao,apagarFogo} from './nova-fogo.js?v=50';
import {distanciaObjeto,danoObjeto} from './nova-dano-objetos.js?v=50';
import {linhaBloqueadaPorObjetos} from './nova-colisao.js?v=59';
import {colunasObjetos,importarModelos,camadaPadrao,normalizarObjeto} from './nova-objetos.js?v=79';
// Integração única do protocolo confirmado com as regras existentes.
// labEstado_ continua atendendo os controles antigos; nunca é a origem de
// um comando remoto. O redutor recebe uma cópia do estado lido na transação.
let labTransport_=null,labLeaseTimer_=null,labConfirmedPacket_=null;
let labReducing_=false,labDrawing_=false,labDraftGeneration_=0;
let labSuspensoParaNova_=false;
const labVisualMovement_=new Map();
const labRuleHandlers_=new Map();
const LAB_SESSION_SYNC_=crypto.randomUUID();
const LAB_SYNC_STATE_PATH_='combatesAtivos/mapaMesaExperimental';
const LAB_SYNC_COMMAND_PATH_=LAB_SYNC_STATE_PATH_+'/acoes';
// Usa a subcoleção já autorizada (/acoes), mantendo IDs e tipos de comando
// separados sem exigir mudança imediata nas regras do Firebase.
const LAB_SYNC_MOVEMENT_PATH_=LAB_SYNC_COMMAND_PATH_;

import {copy as mesaCopy, opportunity as mesaOpportunity, move as mesaMove, advance as mesaAdvance, acceptSnapshot as mesaAcceptSnapshot} from './mesa-sync-core.js';
import {createTransport as createMesaTransport} from './mesa-sync-transport.js?v=4';
import {
  gmOficinaV2Cfg_,
  gm580_,
  gmOficinaV2CorRgb_,
  gmOficinaV2Hex_,
  gm580Key_,
  gm580Esc_,
  gm580Hex_,
  gm580Rgb_,
  gm580RgbHex_,
  gm580BBox_,
  gm580Intersects_,
  gm580ToolbarHtml_,
  gmOficinaV2EstiloAtual550_,
  gmOficinaV2SnapshotEstado_,
  gmOficinaV2BackgroundEstado_
} from './oficina2.js?v=46.83.2';


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, writeBatch, onSnapshot, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


function notificar_(mensagem, tipo='info', duracao=3000){
    let host=document.getElementById('mesaToastHost');
    if(!host){
        host=document.createElement('div');
        host.id='mesaToastHost';
        host.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99999;display:flex;flex-direction:column;gap:8px;max-width:min(420px,calc(100vw - 36px));pointer-events:none;';
        document.body.appendChild(host);
    }
    const el=document.createElement('div');
    const borda=tipo==='erro'?'rgba(255,90,90,.75)':tipo==='aviso'?'rgba(255,193,7,.75)':'rgba(0,212,255,.65)';
    el.style.cssText=`padding:11px 14px;border-radius:10px;background:rgba(20,21,34,.96);border:1px solid ${borda};box-shadow:0 8px 30px rgba(0,0,0,.35);color:#fff;font-size:.94em;line-height:1.35;opacity:0;transform:translateY(6px);transition:.18s ease;`;
    el.textContent=String(mensagem??'');
    host.appendChild(el);
    requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateY(0)';});
    setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(6px)';setTimeout(()=>el.remove(),220);},Math.max(1200,Number(duracao)||3000));
}
// Informational alerts should not freeze play. Destructive choices still use confirm().
window.alert=(mensagem)=>notificar_(mensagem,'info',3200);

const firebaseConfig = {
    apiKey: "AIzaSyDw_DB5qhwyqPI7_q6NgVA-U90atRGJ4mQ",
    authDomain: "d100-mesa-estelar.firebaseapp.com",
    projectId: "d100-mesa-estelar",
    storageBucket: "d100-mesa-estelar.firebasestorage.app",
    messagingSenderId: "1000414403401",
    appId: "1:1000414403401:web:fae7d2feaad04cc8bd9898"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.info('[Mesa Estelar] build MESA-V62 carregado');
window.__MESA_BUILD__ = 'MESA-V62';

let currentUserUid = null;
let userData = null;
let idiomaAtual = 'pt';
let currentCharId = null;
let userCharacters = [];
let configuracoes = { etapa1: 80, etapa2: 100, etapa3: 100, etapa4: 150, minAttr: 3, minAttrINT: 6, maxAttr: 18, maxTreino: 30, recursosIniciais: 1000, modoCombate: 'tatico' };
let periciasDB = [];
let origensDB = [];
let carreirasDB = [];
let especializacoesDB = [];
let poderesPsiDB = [];
let itensDB = [];
let cenariosDB = [];
let mapasDB = [];
let objetosMapaDB = [];
let npcsDB = [];
let criaturasDB = [];

const CRIATURAS_TESTE_PSI_ = [
{id:'vampiro_generico',nome:'Vampiro Genérico',nome_en:'Generic Vampire',nome_zh:'通用吸血鬼',tipo:'Criatura',especie:'Hospedeiro racional parasitado',habitat:'Assentamentos e ruínas habitadas',comportamento:'Predador racional; preserva inteligência e memórias do hospedeiro',altura:'1.80',tamanho:'Médio',pesoCorporal:'75',FOR:15,CON:15,TAM:12,DES:14,INT:12,POD:12,CAR:8,periciasTexto:'Atletismo:58|Esquiva:55|Furtividade:62|Percepção:58',especializacoesTexto:'Combate Desarmado:65',armasTexto:'Mordida:1d6+MD|Garras:1d6+MD',alcancesAtaques:'Mordida:0.8|Garras:1.5',propriedadesAtaques:'Mordida:infeccioso,drenagem_sangue|Garras:sangramento',habilidadesTexto:'parasita_vampirico|regeneracao|hematofagia|vulneravel_sol_intenso|coracao_paralisante|vulneravel_prata',habilidadesEspeciais:'parasita_vampirico|regeneracao|drenagem_sangue|vulneravel_sol_intenso|coracao_paralisante|vulneravel_prata',vinculosAtaquesPericias:'Combate Desarmado:Mordida,Garras',acoesMaxEspecial:3,armaduraNatural:1,movimentoTerrestre:5,movimentoVoo:0,movimentoNatacao:0,selecionavelCombate:true,imagem:'',descricao:'Hospedeiro racional vivo transformado pelo parasita. Mantém inteligência e parte ou totalidade das memórias. Precisa beber sangue da própria espécie. O parasita se aloja no coração e no cérebro.'},
{id:'vampiro_psiquico',nome:'Vampiro Psíquico',nome_en:'Psychic Vampire',nome_zh:'灵能吸血鬼',tipo:'Criatura',especie:'Hospedeiro racional parasitado',habitat:'Assentamentos e ruínas habitadas',comportamento:'Predador racional, manipulador e sensitivo',altura:'1.80',tamanho:'Médio',pesoCorporal:'75',FOR:14,CON:14,TAM:12,DES:14,INT:14,POD:17,CAR:10,periciasTexto:'Atletismo:52|Esquiva:55|Furtividade:65|Percepção:65',especializacoesTexto:'Combate Desarmado:60|Psiquismo (Mente):30|Psiquismo (Sentidos):30',armasTexto:'Mordida:1d6+MD|Garras:1d6+MD',alcancesAtaques:'Mordida:0.8|Garras:1.5',propriedadesAtaques:'Mordida:infeccioso,drenagem_sangue|Garras:sangramento',habilidadesTexto:'parasita_vampirico|regeneracao|hematofagia|vulneravel_sol_intenso|coracao_paralisante|vulneravel_prata|psiquico',habilidadesEspeciais:'parasita_vampirico|regeneracao|drenagem_sangue|vulneravel_sol_intenso|coracao_paralisante|vulneravel_prata',poderesPsiIds:'cura_psi|detectar|intuicao|medo|telepatia|ler_mente|influenciar_mente|ocultar_mente|grito_psiquico',vinculosAtaquesPericias:'Combate Desarmado:Mordida,Garras',acoesMaxEspecial:3,armaduraNatural:1,movimentoTerrestre:5,movimentoVoo:0,movimentoNatacao:0,selecionavelCombate:true,imagem:'',descricao:'Variante vampírica em que a simbiose parasitária manifesta capacidades psíquicas, sobretudo nas esferas Mente e Sentidos.'},
{id:'metamorfo_generico',nome:'Metamorfo Genérico',nome_en:'Generic Shapeshifter',nome_zh:'通用变形体',tipo:'Criatura',especie:'Animal parasitado / quimera',habitat:'Variável',comportamento:'Predador adaptativo; incorpora traços das presas',altura:'1.70',tamanho:'Médio',pesoCorporal:'85',FOR:16,CON:15,TAM:13,DES:15,INT:8,POD:12,CAR:5,periciasTexto:'Atletismo:65|Esquiva:58|Furtividade:68|Percepção:58',especializacoesTexto:'Combate Desarmado:68',armasTexto:'Mordida:1d6+MD|Garras:1d8+MD',alcancesAtaques:'Mordida:1|Garras:1.8',propriedadesAtaques:'Mordida:infeccioso|Garras:sangramento',habilidadesTexto:'parasita_metamorfo|metamorfose|incorporar_presa|imitacao_humana_apos_consumo|vulneravel_sol_intenso|coracao_paralisante|vulneravel_prata',habilidadesEspeciais:'metamorfose_preparada|incorporar_presa|imitacao_humana_apos_consumo|vulneravel_sol_intenso|coracao_paralisante|vulneravel_prata',vinculosAtaquesPericias:'Combate Desarmado:Mordida,Garras',acoesMaxEspecial:3,armaduraNatural:1,movimentoTerrestre:6,movimentoVoo:0,movimentoNatacao:0,selecionavelCombate:true,imagem:'',descricao:'Animal transformado pelo parasita. Alimenta-se de qualquer criatura e pode incorporar formas e características das presas. Depois de consumir um humano, pode aprender imitação humana. A metamorfose está cadastrada para futura implementação no mapa.'},
{id:'metamorfo_psiquico',nome:'Metamorfo Psíquico',nome_en:'Psychic Shapeshifter',nome_zh:'灵能变形体',tipo:'Criatura',especie:'Animal parasitado / quimera psíquica',habitat:'Variável',comportamento:'Predador adaptativo e psíquico',altura:'1.70',tamanho:'Médio',pesoCorporal:'85',FOR:15,CON:14,TAM:13,DES:16,INT:10,POD:17,CAR:6,periciasTexto:'Atletismo:60|Esquiva:62|Furtividade:72|Percepção:66',especializacoesTexto:'Combate Desarmado:62|Psiquismo (Mente):30|Psiquismo (Sentidos):30',armasTexto:'Mordida:1d6+MD|Garras:1d8+MD',alcancesAtaques:'Mordida:1|Garras:1.8',propriedadesAtaques:'Mordida:infeccioso|Garras:sangramento',habilidadesTexto:'parasita_metamorfo|metamorfose|incorporar_presa|imitacao_humana_apos_consumo|psiquico|vulneravel_sol_intenso|coracao_paralisante|vulneravel_prata',habilidadesEspeciais:'metamorfose_preparada|incorporar_presa|imitacao_humana_apos_consumo|vulneravel_sol_intenso|coracao_paralisante|vulneravel_prata',poderesPsiIds:'detectar|intuicao|empatia|medo|ocultar_mente|ilusao',vinculosAtaquesPericias:'Combate Desarmado:Mordida,Garras',acoesMaxEspecial:3,armaduraNatural:1,movimentoTerrestre:6,movimentoVoo:0,movimentoNatacao:0,selecionavelCombate:true,imagem:'',descricao:'Metamorfo em que a infecção também produz capacidades psíquicas. Metamorfose preparada para futura troca de forma, retrato, tamanho e aparência do token.'},
{id:'larva_interdimensional',nome:'Larva Interdimensional',nome_en:'Interdimensional Larva',nome_zh:'异维幼体',tipo:'Criatura',especie:'Fauna psíquica extradimensional',habitat:'Regiões isoladas e locais de anomalia',comportamento:'Curiosa, evasiva e enigmática; raramente hostil',altura:'1.35',tamanho:'Médio',pesoCorporal:'55',FOR:7,CON:13,TAM:11,DES:13,INT:8,POD:20,CAR:10,periciasTexto:'Esquiva:62|Furtividade:58|Percepção:78',especializacoesTexto:'Combate Desarmado:28|Psiquismo (Sentidos):30|Psiquismo (Matéria):30',armasTexto:'Toque:1d3',alcancesAtaques:'Toque:1',propriedadesAtaques:'',habilidadesTexto:'passagem_interdimensional|desaparecer_dimensional|reaparecer_dimensional|misteriosa|nao_predatoria',habilidadesEspeciais:'passagem_interdimensional_preparada|fora_da_dimensao_inatingivel|reaparecimento',poderesPsiIds:'detectar|intuicao|visao_distante|psicometria|salto|impulso',vinculosAtaquesPericias:'Combate Desarmado:Toque',acoesMaxEspecial:3,armaduraNatural:0,movimentoTerrestre:3,movimentoVoo:0,movimentoNatacao:0,selecionavelCombate:true,imagem:'',descricao:'Criatura semelhante ao mesmo tempo a uma coruja e a uma larva de borboleta. Seu aparente teletransporte é interpretado como entrada em uma dimensão desconhecida seguida de retorno ao espaço observável. É sobretudo um mistério ecológico, não uma ameaça. A passagem dimensional fica preparada para futura mecânica de desaparecer e reaparecer no mapa.'},
{id:'cavalgante_prismatico',nome:'Cavalgante Prismático',nome_en:'Prismatic Strider',nome_zh:'棱彩行兽',tipo:'Criatura',especie:'Fauna psíquica',habitat:'Planícies e regiões abertas',comportamento:'Social, sensitivo e potencialmente domesticável',altura:'2.40',tamanho:'Grande',pesoCorporal:'420',FOR:17,CON:16,TAM:18,DES:15,INT:7,POD:18,CAR:12,periciasTexto:'Atletismo:72|Esquiva:50|Percepção:72',especializacoesTexto:'Combate Desarmado:52|Psiquismo (Sentidos):30|Psiquismo (Mente):20',armasTexto:'Coice:1d8+MD|Chifrada Sensorial:1d6+MD',alcancesAtaques:'Coice:2|Chifrada Sensorial:2.2',propriedadesAtaques:'Coice:impacto,derrubar',habilidadesTexto:'antenas_psiquicas|empatia_de_manada|montaria|sensor_hostilidade',habilidadesEspeciais:'montaria|empatia_de_manada|sensor_hostilidade',poderesPsiIds:'detectar|intuicao|empatia|telepatia',vinculosAtaquesPericias:'Combate Desarmado:Coice,Chifrada Sensorial',acoesMaxEspecial:3,armaduraNatural:2,movimentoTerrestre:8,movimentoVoo:0,movimentoNatacao:0,selecionavelCombate:true,imagem:'',descricao:'Grande herbívoro alienígena multicolorido, de longas antenas sensoriais e anatomia adequada à montaria. Percebe emoções, hostilidade e a intenção de indivíduos próximos; grupos parecem compartilhar sinais mentais simples.'}
];
function garantirCriaturasTestePsi_(){
    const ids=new Set((criaturasDB||[]).map(x=>String(x.id)));
    for(const c of CRIATURAS_TESTE_PSI_)if(!ids.has(String(c.id)))criaturasDB.push(JSON.parse(JSON.stringify(c)));
}

let mercadoLocalConfig_ = {cenarioId:'',cenarioNome:'',estabelecimentoNome:'',estabelecimentoTipo:'',itens:[],servicos:[],prestadores:[],vincularNPCsCenario:false,precosServicos:{reparo:0,cura:0,primeiros_socorros:0}};
let mercadoLocalUnsub_ = null;
let mercadoLocalNegociacao_ = {};
let marketSubtabAtual_ = 'comprar';
let campanhaPublica_ = {};
let campanhaPublicaUnsub_ = null;
let regrasTexto = '';
let regrasTextoPT = '';
let regrasTextoEN = '';
let regrasTextoZH = '';

const REGRAS_PADRAO_EN = `# D100 System Rules - Mesa Estelar RPG

## Character Creation

### Stage 1 - Characteristics (80 pts)
Distribute points among STR, CON, SIZ, DEX, INT, POW and CHA.
- Minimum 3 (6 for INT and SIZ).
- The total at creation is 80 points.

### Stage 2 - Origin
Origin represents the environment and culture in which the character was raised. Invest in the Basic and Professional skills allowed by that Origin.

### Stage 3 - Career
Career represents formal or practical professional training. Invest in the skills and specializations available to that Career.

### Stage 4 - Hobby
Hobby points represent interests, informal training and abilities developed outside origin and career.

## D100 Tests
Roll 1d100 against the effective skill value.
- Critical: roll within the critical range.
- Success: roll equal to or below the skill.
- Failure: roll above the skill.
- Fumble: 100.

Circumstantial difficulty modifies the effective value. Fatigue and using an unsuitable weapon can shift difficulty further.

## Combat
Combat uses Actions. Each combat D100 action spends 1 Action Point. When the current pool reaches zero, a new turn begins and the pool is restored.

Weapons should normally be used with the appropriate combat specialization. A related weapon imposes +1 difficulty step; a substantially different weapon of the same broad combat mode imposes +2 steps.

Damage, armor and Hit Points are tracked by body location.

## Fatigue
Fatigue progressively worsens tests and may reduce movement, Initiative and Actions. Severe fatigue can prevent action entirely.

## Luck Points
Spend 1 Luck Point immediately after an eligible d100 test to reroll it. The new roll replaces the previous result, including its consequences. Luck cannot be chained repeatedly on the same test.

## Psychism
Psychic spheres are Senses, Mind and Matter. Training unlocks powers by Arc:
- 1-14: Arc 1
- 15-29: Arc 2
- 30+: Arc 3
Using powers spends Magic Points.

## Inventory and Market
Equipment is stored in Equipped, Pocket, Backpack, Vehicle/Ship or Home/Base. Weight and slot limits apply where appropriate. Purchases spend the character's Resources.

## Derived Characteristics
Actions, Initiative, Damage Modifier, Experience Modifier, Healing Rate, Movement, Luck Points and location HP are derived from the character's characteristics according to the system tables.
`;

const REGRAS_PADRAO_ZH = `# D100系统规则 - 星际桌游RPG

## 角色创建

### 阶段1 - 属性（80点）
在力量、体质、体型、敏捷、智力、意志和魅力之间分配点数。
- 最低为3（智力和体型最低为6）。
- 创建角色时总计80点。

### 阶段2 - 起源
起源代表角色成长的环境与文化。角色可在该起源允许的基础技能和专业技能中投入点数。

### 阶段3 - 职业
职业代表正式或实践性的专业训练。角色可在该职业允许的技能与专长中投入点数。

### 阶段4 - 爱好
爱好点代表角色在起源和职业之外培养的兴趣、非正式训练与能力。

## D100检定
掷1d100，与技能的有效数值比较。
- 大成功：骰值落在大成功范围内。
- 成功：骰值小于或等于技能值。
- 失败：骰值高于技能值。
- 大失败：掷出100。

情境难度会调整有效技能值。疲劳以及使用不合适的武器还会进一步提高难度。

## 战斗
战斗使用行动点。每次战斗D100行动消耗1点行动点。当当前行动点降至0时，新回合开始并恢复行动点。

武器通常应使用对应的战斗专长。使用相关武器提高1级难度；使用同一大类战斗方式中明显不同的武器提高2级难度。

伤害、护甲与生命值按身体部位分别记录。

## 疲劳
疲劳会逐步提高检定难度，并可能降低移动、先攻和行动点。严重疲劳时角色可能完全无法行动。

## 幸运点
在一次可重掷的D100检定后立即消耗1点幸运，即可重新掷骰。新结果取代旧结果及其后果。同一次检定不能连续多次使用幸运重掷。

## 灵能
灵能分为感知、心智与物质三个领域。训练值按阶段解锁能力：
- 1-14：阶段1
- 15-29：阶段2
- 30+：阶段3
使用能力会消耗魔法点。

## 物品栏与市场
装备可存放于已装备、口袋、背包、载具/飞船或住所/基地。适用时受到重量与格数限制。购买物品会消耗角色的资源。

## 衍生属性
行动点、先攻、伤害修正、经验修正、恢复率、移动、幸运点与各部位生命值均根据角色属性和系统表计算。
`;
let escudoTexto = '';
let estadoCampanhaMestre = {
    nome:'', planeta:'', cidade:'', clima:'', cenario:'', dataJogo:'', diaCampanha:1, resumo:'',
    calico:{
        hora:'12:00',
        diaMes:1,
        diaSemana:'Aurora',
        lua:'Lua Nova',
        estacao:'Estação dos Ventos',
        climaCondicao:'Céu limpo',
        temperatura:20,
        umidade:40
    }
};
let estadoCombateMestre = {
    ativo:false,
    rodada:1,
    ciclo:1,
    turnoIndex:0,
    participantes:[]
};
let gmCombatDragId_ = '';

let currentEditSlot = { compartment: null, index: null };
let uploadedItemImage = null;

function gerarEstrelas() {
    const container = document.getElementById('starsContainer');
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
        star.style.setProperty('--delay', Math.random() * 5 + 's');
        container.appendChild(star);
    }
}
gerarEstrelas();

const traducoes = {
    pt: { title: 'D100 - Mesa Estelar RPG', subtitle: 'Sistema de RPG Sci-Fi d100', emailPlaceholder: 'Email', passwordPlaceholder: 'Senha (mínimo 6 caracteres)', loginBtn: 'Entrar', registerBtn: 'Criar Conta', logoutBtn: 'Sair', appTitle: 'D100 - Mesa Estelar RPG', tabFicha: ' Ficha', tabConfig: '⚙️ Config', tabBanco: '📚 Banco de Dados', tabRegras: '📖 Regras', tabMercado: '🛒 Mercado', marketTitle: '🛒 Mercado', marketIntro: 'Compre itens do banco de dados para o personagem atualmente selecionado.', resourcesLabel: 'Recursos', FOR: 'FOR', CON: 'CON', TAM: 'TAM', DES: 'DES', INT: 'INT', POD: 'POD', CAR: 'CAR', pa: 'Ações', iniciativa: 'Iniciativa', modDano: 'Mod. Dano', modExp: 'Mod. Experiência', taxaRecup: 'Taxa de Recuperação', pontosSorte: 'Pontos de Sorte', altura: 'Altura', peso: 'Peso', myCharacters: 'Meus Personagens', newChar: ' Novo Personagem', editChar: 'Editar Personagem', charName: 'Nome do Personagem:', race: 'Raça:', concept: 'Conceito:', sex: 'Sexo:', age: 'Idade:', origin: 'Origem:', career: 'Carreira:', socialClass: 'Classe Social:', bodyType: 'Tipo Corporal:', charImage: 'Imagem do Personagem:', attributes: 'Atributos', saveChar: '💾 Salvar Personagem', configTitle: '️ Configurações do Sistema (Mestre)', pointsEtapa1: 'Etapa 1 - Características:', pointsEtapa2: 'Origem:', pointsEtapa3: 'Carreira:', pointsEtapa4: 'Hobbie:', saveConfig: ' Salvar Configurações', loginError: 'Erro no login. Verifique email e senha.', registerError: 'Erro ao criar conta.', saved: 'Salvo com sucesso!', pointsExceeded: 'Total de pontos excedido! Máximo: ', confirmDelete: 'Tem certeza que deseja deletar?', deleted: 'Deletado!', mestre: '👑 Mestre', jogador: ' Jogador', selectChar: 'Selecionar', deleteChar: 'Deletar', noChars: 'Nenhum personagem criado.', uploading: 'Enviando...', uploadSuccess: 'Enviado!', uploadError: 'Erro!', etapaAtual: 'Etapa Atual:', etapaDesc: 'Distribua seus pontos de características' },
    en: { title: 'D100 - Stellar Table RPG', subtitle: 'Sci-Fi d100 RPG System', emailPlaceholder: 'Email', passwordPlaceholder: 'Password (min 6 characters)', loginBtn: 'Login', registerBtn: 'Create Account', logoutBtn: 'Logout', appTitle: 'D100 - Stellar Table RPG', tabFicha: '📋 Sheet', tabConfig: '️ Config', tabBanco: '📚 Database', tabRegras: '📖 Rules', tabMercado: '🛒 Market', marketTitle: '🛒 Market', marketIntro: 'Buy database items for the currently selected character.', resourcesLabel: 'Resources', FOR: 'STR', CON: 'CON', TAM: 'SIZ', DES: 'DEX', INT: 'INT', POD: 'POW', CAR: 'CHA', pa: 'Actions', iniciativa: 'Initiative', modDano: 'Damage Mod', modExp: 'Experience Mod', taxaRecup: 'Healing Rate', pontosSorte: 'Luck Points', altura: 'Height', peso: 'Weight', myCharacters: 'My Characters', newChar: '➕ New Character', editChar: 'Edit Character', charName: 'Character Name:', race: 'Race:', concept: 'Concept:', sex: 'Sex:', age: 'Age:', origin: 'Origin:', career: 'Career:', socialClass: 'Social Class:', bodyType: 'Body Type:', charImage: 'Character Image:', attributes: 'Attributes', saveChar: '💾 Save Character', configTitle: '⚙️ System Settings (GM)', pointsEtapa1: 'Step 1 - Characteristics:', pointsEtapa2: 'Origin:', pointsEtapa3: 'Career:', pointsEtapa4: 'Hobby:', saveConfig: '💾 Save Settings', loginError: 'Login error.', registerError: 'Error creating account.', saved: 'Saved!', pointsExceeded: 'Points exceeded! Max: ', confirmDelete: 'Delete?', deleted: 'Deleted!', mestre: '👑 GM', jogador: ' Player', selectChar: 'Select', deleteChar: 'Delete', noChars: 'No characters.', uploading: 'Uploading...', uploadSuccess: 'Uploaded!', uploadError: 'Error!', etapaAtual: 'Current Step:', etapaDesc: 'Distribute your characteristic points' },
    zh: { title: 'D100 - 星际桌游', subtitle: '科幻d100角色扮演系统', emailPlaceholder: '邮箱', passwordPlaceholder: '密码（至少6个字符）', loginBtn: '登录', registerBtn: '创建账户', logoutBtn: '退出', appTitle: 'D100 - 星际桌游', tabFicha: ' 角色卡', tabConfig: '️ 设置', tabBanco: ' 数据库', tabRegras: ' 规则', tabMercado: '🛒 市场', marketTitle: '🛒 市场', marketIntro: '为当前选择的角色购买数据库中的物品。', resourcesLabel: '资源', FOR: '力量', CON: '体质', TAM: '体型', DES: '敏捷', INT: '智力', POD: '意志', CAR: '魅力', pa: '行动点', iniciativa: '先攻', modDano: '伤害修正', modExp: '经验修正', taxaRecup: '恢复率', pontosSorte: '幸运点', altura: '身高', peso: '体重', myCharacters: '我的角色', newChar: '➕ 新建角色', editChar: '编辑角色', charName: '角色名称：', race: '种族：', concept: '概念：', sex: '性别：', age: '年龄：', origin: '起源：', career: '职业：', socialClass: '社会阶级：', bodyType: '体型：', charImage: '角色图像：', attributes: '属性', saveChar: '💾 保存角色', configTitle: '⚙️ 系统设置（主持人）', pointsEtapa1: '阶段1 - 特征：', pointsEtapa2: '起源：', pointsEtapa3: '职业：', pointsEtapa4: '爱好：', saveConfig: '💾 保存设置', loginError: '登录错误。', registerError: '创建账户错误。', saved: '保存成功！', pointsExceeded: '点数超限！最大值：', confirmDelete: '删除？', deleted: '已删除！', mestre: '👑 主持人', jogador: '👤 玩家', selectChar: '选择', deleteChar: '删除', noChars: '尚未创建角色。', uploading: '正在上传...', uploadSuccess: '上传成功！', uploadError: '错误！', etapaAtual: '当前阶段：', etapaDesc: '分配您的特征点' }

};

Object.assign(traducoes.pt, {
  charTabCharacter:'📄 Personagem', charTabSkills:'📚 Perícias', charTabInventory:'🎒 Inventário', charTabCombat:'⚔️ Combate',
  charTabNotes:'📔 Anotações', charTabRolls:'🎲 Rolagem', tabGM:'🛡️ Escudo do Mestre',
  editChar2:'Editar Personagem', nameLabel:'Nome:', genderLabel:'Gênero:', charImageUrl:'Imagem do Personagem (URL):',
  orUpload:'Ou fazer upload:', saveSimple:'💾 Salvar', skillsTitle:'📚 Perícias', investmentLabel:'Investimento:',
  availablePoints:'Pontos disponíveis:', investedCategory:'Total investido nesta categoria:', viewSkillsFrom:'Ver perícias de:',
  originOption:'Origem', careerOption:'Carreira', hobbyOption:'Hobbie', allOption:'Todas',
  investedSkills:'Perícias com Investimento', basicSkillsAvailable:'Perícias Básicas Disponíveis',
  professionalSkillsAvailable:'Perícias Profissionais Disponíveis', specializations:'Especializações',
  skillCol:'Perícia', formulaCol:'Fórmula', baseCol:'Base', trainingCol:'Treino', totalCol:'Total',
  specializationCol:'Especialização', typeFormulaCol:'Tipo / Fórmula', saveSkills:'💾 Salvar Perícias',
  inventoryTitle:'🎒 Inventário', combatTitle:'⚔️ Combate', hpTitle:'Pontos de Vida', maxHp:'PV Máx',
  currentHp:'PV Atual', armorTitle:'Armadura (PA)', fatigueTitle:'Fadiga', combatPanel:'🎯 Painel de Combate',
  combatSkillLabel:'Perícia de combate:', circDifficulty:'Dificuldade circunstancial:', equipmentLabel:'Equipamento:',
  valueLabel:'Valor:', damageLabel:'Dano:', ammoCharge:'Munição / Carga', reloadBtn:'🔋 Recarregar',
  combatRollBtn:'🎲 D100 de Combate', damageBtn:'💥 Dano', hitLocationBtn:'🎯 Localização D20',
  initiativeBtn:'⚡ Iniciativa', diceRollTitle:'🎲 Rolagem de Dados', skillTestTitle:'📊 Teste de Perícia', skillLabel:'Perícia:',
  movement:'Movimento', magicPoints:'Pontos de Magia', marketSearchPlaceholder:'Buscar item...', allCategories:'Todas as categorias',
  backpack:'Mochila', pocket:'Bolso', vehicleShip:'Veículo/Nave', homeBase:'Casa/Base',
  noEquipment:'Nenhum equipamento', fists:'Punhos', noCompatibleEquipment:'Nenhum equipamento compatível',
  mismatch1:'⚠️ +1 grau', mismatch2:'⚠️ +2 graus'
});
Object.assign(traducoes.en, {
  charTabCharacter:'📄 Character', charTabSkills:'📚 Skills', charTabInventory:'🎒 Inventory', charTabCombat:'⚔️ Combat',
  charTabNotes:'📔 Notes', charTabRolls:'🎲 Rolls', tabGM:'🛡️ GM Screen',
  editChar2:'Edit Character', nameLabel:'Name:', genderLabel:'Gender:', charImageUrl:'Character Image (URL):',
  orUpload:'Or upload:', saveSimple:'💾 Save', skillsTitle:'📚 Skills', investmentLabel:'Investment:',
  availablePoints:'Available points:', investedCategory:'Total invested in this category:', viewSkillsFrom:'View skills from:',
  originOption:'Origin', careerOption:'Career', hobbyOption:'Hobby', allOption:'All',
  investedSkills:'Invested Skills', basicSkillsAvailable:'Available Basic Skills',
  professionalSkillsAvailable:'Available Professional Skills', specializations:'Specializations',
  skillCol:'Skill', formulaCol:'Formula', baseCol:'Base', trainingCol:'Training', totalCol:'Total',
  specializationCol:'Specialization', typeFormulaCol:'Type / Formula', saveSkills:'💾 Save Skills',
  inventoryTitle:'🎒 Inventory', combatTitle:'⚔️ Combat', hpTitle:'Hit Points', maxHp:'Max HP',
  currentHp:'Current HP', armorTitle:'Armor (AP)', fatigueTitle:'Fatigue', combatPanel:'🎯 Combat Panel',
  combatSkillLabel:'Combat skill:', circDifficulty:'Circumstantial difficulty:', equipmentLabel:'Equipment:',
  valueLabel:'Value:', damageLabel:'Damage:', ammoCharge:'Ammo / Charge', reloadBtn:'🔋 Reload',
  combatRollBtn:'🎲 Combat D100', damageBtn:'💥 Damage', hitLocationBtn:'🎯 Hit Location D20',
  initiativeBtn:'⚡ Initiative', diceRollTitle:'🎲 Dice Roller', skillTestTitle:'📊 Skill Test', skillLabel:'Skill:',
  movement:'Movement', magicPoints:'Magic Points', marketSearchPlaceholder:'Search item...', allCategories:'All categories',
  backpack:'Backpack', pocket:'Pocket', vehicleShip:'Vehicle/Ship', homeBase:'Home/Base',
  noEquipment:'No equipment', fists:'Fists', noCompatibleEquipment:'No compatible equipment',
  mismatch1:'⚠️ +1 step', mismatch2:'⚠️ +2 steps'
});
Object.assign(traducoes.zh, {
  charTabCharacter:'📄 角色', charTabSkills:'📚 技能', charTabInventory:'🎒 物品栏', charTabCombat:'⚔️ 战斗',
  charTabNotes:'📔 笔记', charTabRolls:'🎲 掷骰', tabGM:'🛡️ 主持人屏幕',
  editChar2:'编辑角色', nameLabel:'姓名：', genderLabel:'性别：', charImageUrl:'角色图片（URL）：',
  orUpload:'或上传：', saveSimple:'💾 保存', skillsTitle:'📚 技能', investmentLabel:'投入：',
  availablePoints:'可用点数：', investedCategory:'本类别已投入：', viewSkillsFrom:'查看技能来源：',
  originOption:'起源', careerOption:'职业', hobbyOption:'爱好', allOption:'全部',
  investedSkills:'已投入技能', basicSkillsAvailable:'可用基础技能',
  professionalSkillsAvailable:'可用专业技能', specializations:'专长',
  skillCol:'技能', formulaCol:'公式', baseCol:'基础', trainingCol:'训练', totalCol:'总值',
  specializationCol:'专长', typeFormulaCol:'类型／公式', saveSkills:'💾 保存技能',
  inventoryTitle:'🎒 物品栏', combatTitle:'⚔️ 战斗', hpTitle:'生命值', maxHp:'最大生命',
  currentHp:'当前生命', armorTitle:'护甲（AP）', fatigueTitle:'疲劳', combatPanel:'🎯 战斗面板',
  combatSkillLabel:'战斗技能：', circDifficulty:'情境难度：', equipmentLabel:'装备：',
  valueLabel:'数值：', damageLabel:'伤害：', ammoCharge:'弹药／能量', reloadBtn:'🔋 装填',
  combatRollBtn:'🎲 战斗D100', damageBtn:'💥 伤害', hitLocationBtn:'🎯 命中部位D20',
  initiativeBtn:'⚡ 先攻', diceRollTitle:'🎲 掷骰', skillTestTitle:'📊 技能检定', skillLabel:'技能：',
  movement:'移动', magicPoints:'魔法点', marketSearchPlaceholder:'搜索物品...', allCategories:'全部类别',
  backpack:'背包', pocket:'口袋', vehicleShip:'载具／飞船', homeBase:'住所／基地',
  noEquipment:'无装备', fists:'拳脚', noCompatibleEquipment:'没有兼容装备',
  mismatch1:'⚠️ +1级', mismatch2:'⚠️ +2级'
});

function getNome(item) {
    const key = `nome_${idiomaAtual}`;
    return item[key] || item.nome;
}


let audioCtxMesaEstelar_ = null;
function obterAudioCtx_() {
    try {
        if (!audioCtxMesaEstelar_) audioCtxMesaEstelar_ = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtxMesaEstelar_.state === 'suspended') audioCtxMesaEstelar_.resume();
        return audioCtxMesaEstelar_;
    } catch (_) { return null; }
}
function somDado_() {
    if(labReducing_)return;
    const ctx = obterAudioCtx_(); if (!ctx) return;
    const agora = ctx.currentTime;
    for (let i=0;i<5;i++) {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130 + Math.random()*220, agora+i*.035);
        gain.gain.setValueAtTime(.055, agora+i*.035);
        gain.gain.exponentialRampToValueAtTime(.001, agora+i*.035+.07);
        osc.connect(gain).connect(ctx.destination);
        osc.start(agora+i*.035); osc.stop(agora+i*.035+.075);
    }
}
function somMagico_() {
    if(labReducing_)return;
    const ctx = obterAudioCtx_(); if (!ctx) return;
    const agora = ctx.currentTime;
    [523.25,659.25,783.99,1046.5].forEach((freq,i)=>{
        const osc=ctx.createOscillator(), gain=ctx.createGain();
        osc.type='sine'; osc.frequency.value=freq;
        gain.gain.setValueAtTime(.001,agora+i*.06);
        gain.gain.linearRampToValueAtTime(.07,agora+i*.06+.025);
        gain.gain.exponentialRampToValueAtTime(.001,agora+i*.06+.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(agora+i*.06); osc.stop(agora+i*.06+.37);
    });
}

function somSalvar_() {
    if(labReducing_)return;
    const ctx = obterAudioCtx_(); if (!ctx) return;
    const agora = ctx.currentTime;
    [440,554.37,659.25].forEach((freq,i)=>{
        const osc=ctx.createOscillator(), gain=ctx.createGain();
        osc.type='sine'; osc.frequency.value=freq;
        gain.gain.setValueAtTime(.001,agora+i*.045);
        gain.gain.linearRampToValueAtTime(.035,agora+i*.045+.018);
        gain.gain.exponentialRampToValueAtTime(.001,agora+i*.045+.20);
        osc.connect(gain).connect(ctx.destination);
        osc.start(agora+i*.045); osc.stop(agora+i*.045+.22);
    });
}
function somEspada_() {
    if(labReducing_)return;
    const ctx=obterAudioCtx_(); if(!ctx) return;
    const t=ctx.currentTime, osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type='sawtooth'; osc.frequency.setValueAtTime(1250,t); osc.frequency.exponentialRampToValueAtTime(220,t+.18);
    gain.gain.setValueAtTime(.055,t); gain.gain.exponentialRampToValueAtTime(.001,t+.20);
    osc.connect(gain).connect(ctx.destination); osc.start(t); osc.stop(t+.21);
}
function somLaser_(plasma=false) {
    if(labReducing_)return;
    const ctx=obterAudioCtx_(); if(!ctx) return;
    const t=ctx.currentTime, osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=plasma?'sawtooth':'square';
    osc.frequency.setValueAtTime(plasma?230:880,t); osc.frequency.exponentialRampToValueAtTime(plasma?85:180,t+(plasma?.30:.18));
    gain.gain.setValueAtTime(plasma?.055:.035,t); gain.gain.exponentialRampToValueAtTime(.001,t+(plasma?.32:.20));
    osc.connect(gain).connect(ctx.destination); osc.start(t); osc.stop(t+(plasma?.33:.21));
}

function somSoco_() {
    if(labReducing_)return;
    const ctx = obterAudioCtx_(); if (!ctx) return;
    const agora = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate*.10), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0;i<data.length;i++) {
        const env = Math.exp(-i/(ctx.sampleRate*.018));
        data[i] = (Math.random()*2-1) * env;
    }
    const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    filter.type='lowpass'; filter.frequency.value=520;
    gain.gain.value=.12;
    src.buffer=buffer; src.connect(filter).connect(gain).connect(ctx.destination); src.start(agora);
}


function somFiasco_(){
    if(labReducing_)return;
    const ctx=obterAudioCtx_(); if(!ctx)return;
    const t=ctx.currentTime;
    [0,.06,.12].forEach((d,i)=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.type=i===2?'sawtooth':'square';
        o.frequency.setValueAtTime(i===2?105:420-i*120,t+d);
        o.frequency.exponentialRampToValueAtTime(i===2?48:85,t+d+.12);
        g.gain.setValueAtTime(i===2?.075:.045,t+d);
        g.gain.exponentialRampToValueAtTime(.001,t+d+.16);
        o.connect(g).connect(ctx.destination);o.start(t+d);o.stop(t+d+.17);
    });
}
function somCriticoArma_(item, nomeEquip='') {
    if(labReducing_)return;
    const tipo = tipoSomArma_(item, nomeEquip);
    const tocar = () => {
        if (tipo === 'plasma') return somLaser_(true);
        if (tipo === 'laser') return somLaser_(false);
        if (tipo === 'espada') return somEspada_();
        if (tipo === 'soco') return somSoco_();
        return somDado_();
    };
    tocar(); setTimeout(tocar, 105); setTimeout(tocar, 210);
}

function tipoSomArma_(item,nomeEquip='') {
    const texto=[nomeEquip,item?.nome,item?.nome_en,item?.nome_zh,item?.categoria,item?.dano,item?.municao]
      .filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(texto.includes('punho') || texto.includes('soco') || texto.includes('desarmado') || texto.includes('unarmed')) return 'soco';
    if(texto.includes('plasma')) return 'plasma';
    if(texto.includes('laser')||texto.includes('blaster')||texto.includes('energia')) return 'laser';
    if(['espada','sabre','adaga','faca','lamina','vibro','machado'].some(x=>texto.includes(x))) return 'espada';
    return 'dado';
}
function tocarSomDano_(item,nomeEquip) {
    if(labReducing_)return;
    const tipo=tipoSomArma_(item,nomeEquip);
    if(tipo==='plasma') return somLaser_(true);
    if(tipo==='laser') return somLaser_(false);
    if(tipo==='espada') return somEspada_();
    if(tipo==='soco') return somSoco_();
    return somDado_();
}

function somCaixaRegistradora_() {
    if(labReducing_)return;
    const ctx = obterAudioCtx_(); if (!ctx) return;
    const t = ctx.currentTime;

    // Gaveta abrindo: dois cliques secos.
    [0, .075].forEach((atraso, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(i ? 105 : 165, t + atraso);
        g.gain.setValueAtTime(.055, t + atraso);
        g.gain.exponentialRampToValueAtTime(.001, t + atraso + .045);
        o.connect(g).connect(ctx.destination);
        o.start(t + atraso); o.stop(t + atraso + .05);
    });

    // O clássico "cha-ching": duas campainhas metálicas em sequência.
    [1174.66, 1567.98].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        const inicio = t + .12 + i*.095;
        g.gain.setValueAtTime(.001, inicio);
        g.gain.linearRampToValueAtTime(.07, inicio + .012);
        g.gain.exponentialRampToValueAtTime(.001, inicio + .52);
        o.connect(g).connect(ctx.destination);
        o.start(inicio); o.stop(inicio + .55);
    });
}




Object.assign(traducoes.pt, {
  notesTitle:'📔 Anotações', specialEventsTitle:'⭐ Eventos Especiais', rollSkillBtn:'🎲 Rolar Perícia',
  luckLabel:'Sorte:', spendLuckBtn:'⭐ Gastar', clickToRoll:'Clique para rolar', formulaLabel:'Fórmula:',
  rollFormulaBtn:'🎲 Rolar Fórmula', psiPowerTitle:'🔮 Poder Psiônico', sphereLabel:'Esfera:',
  powerLabel:'Poder:', ppSpendLabel:'PP a gastar:', usePowerBtn:'✨ Usar Poder',
  psiUsageHelp:'O custo e o uso são registrados automaticamente. Até a automação individual de cada poder, o efeito específico é aplicado narrativamente pelo jogador/mestre.',
  psiTrainingHelp:'Os poderes disponíveis dependem do treino na esfera: 1–14 = Arco 1, 15–29 = Arco 2, 30+ = Arco 3. O gasto é descontado dos Pontos de Magia.',
  psychismTitle:'🔮 Psiquismo', diffVeryEasy:'Muito Fácil', diffEasy:'Fácil', diffStandard:'Padrão',
  diffHard:'Difícil', diffFormidable:'Formidável', diffHerculean:'Hercúleo',
  fatFresh:'Descansado', fatWinded:'Ofegante', fatTired:'Cansado',
  fatWearied:'Fatigado', fatExhausted:'Exausto', fatDebilitated:'Debilitado',
  fatIncapacitated:'Incapacitado', fatSemiConscious:'Semiconsciente',
  fatComatose:'Comatoso', fatDead:'Morto',
  testsLabel:'Testes:', movementLabel:'Movimento:', initiativeLabel:'Iniciativa:', actionPointsLabel:'AÇ:',
  recoveryLabel:'Recuperação:', noPenalty:'Sem penalidade', noPenalties:'Sem penalidades', noActivity:'Nenhuma atividade',
  noActivityPossible:'Nenhuma atividade possível', half:'Metade', immobile:'Imóvel', never:'Nunca',
  minutes15:'15 minutos', hours3:'3 horas', hours6:'6 horas', hours12:'12 horas', hours18:'18 horas',
  hours24:'24 horas', hours36:'36 horas', hours48:'48 horas',
  bodyHead:'Cabeça', bodyChest:'Peito', bodyAbdomen:'Abdômen', bodyRightArm:'Braço Direito',
  bodyLeftArm:'Braço Esquerdo', bodyRightLeg:'Perna Direita', bodyLeftLeg:'Perna Esquerda',
  useBtn:'Usar', arc:'Arco', trainingWord:'Treino', magicPointsLabel:'Pontos de Magia',
  noPowerAvailable:'Nenhum poder disponível', noPowerForArc:'Nenhum poder disponível para esta esfera/arco.',
  minimumCost:'custo mínimo'
});
Object.assign(traducoes.en, {
  notesTitle:'📔 Notes', specialEventsTitle:'⭐ Special Events', rollSkillBtn:'🎲 Roll Skill',
  luckLabel:'Luck:', spendLuckBtn:'⭐ Spend', clickToRoll:'Click to roll', formulaLabel:'Formula:',
  rollFormulaBtn:'🎲 Roll Formula', psiPowerTitle:'🔮 Psionic Power', sphereLabel:'Sphere:',
  powerLabel:'Power:', ppSpendLabel:'PP to spend:', usePowerBtn:'✨ Use Power',
  psiUsageHelp:'Cost and use are recorded automatically. Until each power is individually automated, its specific effect is applied narratively by the player/GM.',
  psiTrainingHelp:'Available powers depend on training in the sphere: 1–14 = Arc 1, 15–29 = Arc 2, 30+ = Arc 3. The cost is deducted from Magic Points.',
  psychismTitle:'🔮 Psychism', diffVeryEasy:'Very Easy', diffEasy:'Easy', diffStandard:'Standard',
  diffHard:'Hard', diffFormidable:'Formidable', diffHerculean:'Herculean',
  fatFresh:'Fresh', fatWinded:'Winded', fatTired:'Tired', fatWearied:'Wearied', fatExhausted:'Exhausted',
  fatDebilitated:'Debilitated', fatIncapacitated:'Incapacitated', fatSemiConscious:'Semi-Conscious',
  fatComatose:'Comatose', fatDead:'Dead',
  testsLabel:'Tests:', movementLabel:'Movement:', initiativeLabel:'Initiative:', actionPointsLabel:'Actions:',
  recoveryLabel:'Recovery:', noPenalty:'No penalty', noPenalties:'No penalties', noActivity:'No activity',
  noActivityPossible:'No activity possible', half:'Half', immobile:'Immobile', never:'Never',
  minutes15:'15 minutes', hours3:'3 hours', hours6:'6 hours', hours12:'12 hours', hours18:'18 hours',
  hours24:'24 hours', hours36:'36 hours', hours48:'48 hours',
  bodyHead:'Head', bodyChest:'Chest', bodyAbdomen:'Abdomen', bodyRightArm:'Right Arm',
  bodyLeftArm:'Left Arm', bodyRightLeg:'Right Leg', bodyLeftLeg:'Left Leg',
  useBtn:'Use', arc:'Arc', trainingWord:'Training', magicPointsLabel:'Magic Points',
  noPowerAvailable:'No power available', noPowerForArc:'No power available for this sphere/arc.',
  minimumCost:'minimum cost'
});
Object.assign(traducoes.zh, {
  notesTitle:'📔 笔记', specialEventsTitle:'⭐ 特殊事件', rollSkillBtn:'🎲 技能检定',
  luckLabel:'幸运：', spendLuckBtn:'⭐ 使用', clickToRoll:'点击掷骰', formulaLabel:'公式：',
  rollFormulaBtn:'🎲 掷公式', psiPowerTitle:'🔮 灵能力量', sphereLabel:'领域：',
  powerLabel:'能力：', ppSpendLabel:'消耗PP：', usePowerBtn:'✨ 使用能力',
  psiUsageHelp:'消耗与使用会自动记录。在每项能力完成独立自动化之前，具体效果由玩家或主持人根据叙事情况应用。',
  psiTrainingHelp:'可用能力取决于该领域的训练值：1–14 = 阶段1，15–29 = 阶段2，30+ = 阶段3。消耗从魔法点中扣除。',
  psychismTitle:'🔮 灵能', diffVeryEasy:'非常容易', diffEasy:'容易', diffStandard:'标准',
  diffHard:'困难', diffFormidable:'艰巨', diffHerculean:'极难',
  fatFresh:'精力充沛', fatWinded:'气喘', fatTired:'疲倦', fatWearied:'疲劳', fatExhausted:'精疲力竭',
  fatDebilitated:'虚弱', fatIncapacitated:'失去行动能力', fatSemiConscious:'半昏迷',
  fatComatose:'昏迷', fatDead:'死亡',
  testsLabel:'检定：', movementLabel:'移动：', initiativeLabel:'先攻：', actionPointsLabel:'行动点：',
  recoveryLabel:'恢复：', noPenalty:'无惩罚', noPenalties:'无惩罚', noActivity:'无法行动',
  noActivityPossible:'无法进行任何行动', half:'减半', immobile:'无法移动', never:'永不',
  minutes15:'15分钟', hours3:'3小时', hours6:'6小时', hours12:'12小时', hours18:'18小时',
  hours24:'24小时', hours36:'36小时', hours48:'48小时',
  bodyHead:'头部', bodyChest:'胸部', bodyAbdomen:'腹部', bodyRightArm:'右臂',
  bodyLeftArm:'左臂', bodyRightLeg:'右腿', bodyLeftLeg:'左腿',
  useBtn:'使用', arc:'阶段', trainingWord:'训练', magicPointsLabel:'魔法点',
  noPowerAvailable:'没有可用能力', noPowerForArc:'此领域／阶段没有可用能力。',
  minimumCost:'最低消耗'
});


Object.assign(traducoes.pt, {
  combatHistoryTitle:'🧾 Histórico de rolagens', generalHistoryTitle:'🧾 Histórico de testes e dados',
  last50:'últimas 50', noRolls:'Nenhuma rolagem registrada.', rollType:'Rolagem', testType:'Teste',
  dieType:'Dado', formulaType:'Fórmula', psychismType:'Psiquismo', damageType:'Dano',
  locationType:'Localização', initiativeType:'Iniciativa', ammoType:'Munição', energyType:'Energia',
  newTurnType:'Novo turno', luckType:'Sorte', success:'Sucesso', failure:'Falha', critical:'Crítico',
  fumble:'Fiasco', marginWord:'Margem', difficultyWord:'Dificuldade', fatigueWord:'Fadiga',
  weaponCompatibility:'Compatibilidade de arma', spentWord:'Gasto', remainingWord:'Restante',
  restoredAP:'Ações restaurados', insufficientActivity:'nenhuma atividade possível',
  blockedByFatigue:'bloqueado por fadiga', chosenDifficulty:'Dificuldade escolhida',
  rulesTitle:'📖 Regras do Sistema', editRulesBtn:'✏️ Editar Regras', saveRulesBtn:'💾 Salvar Regras',
  cancelBtn:'❌ Cancelar', physicalEffortTitle:'Tabela de Esforço Físico', effortCol:'Esforço',
  durationCol:'Por quanto tempo?', exampleCol:'Exemplo', skillTestCol:'Teste de perícia',
  effortLight:'Leve', effortMedium:'Médio', effortStrenuous:'Extenuante',
  lightDuration:'CON em horas', mediumDuration:'CON em minutos',
  strenuousDuration:'CON em segundos, arredondado para a próxima Rodada de Combate',
  lightExample:'Atividade que não impõe esforço ao corpo. Atividades razoáveis em ritmo constante.',
  mediumExample:'Trabalho manual; exercício físico sustentado.',
  strenuousExample:'Combate; lutar contra os elementos; atividade física em circunstâncias extremamente adversas.',
  lightTest:'Teste Muito Fácil contra Atletismo, Força Bruta ou Resistência, conforme a tarefa.',
  mediumTest:'Como acima, mas em grau Fácil.',
  strenuousTest:'Teste Padrão contra Atletismo, Força Bruta ou Resistência, conforme a tarefa.',
  effortNote:'Atletismo para exercício, Força Bruta para levantamento pesado e Resistência para atividades gerais/combate, conforme a situação.',
  derivedSummary:'Resumo de Derivados (Mythras)'
});
Object.assign(traducoes.en, {
  combatHistoryTitle:'🧾 Roll History', generalHistoryTitle:'🧾 Test & Dice History',
  last50:'last 50', noRolls:'No rolls recorded.', rollType:'Roll', testType:'Test',
  dieType:'Die', formulaType:'Formula', psychismType:'Psychism', damageType:'Damage',
  locationType:'Hit Location', initiativeType:'Initiative', ammoType:'Ammo', energyType:'Energy',
  newTurnType:'New Turn', luckType:'Luck', success:'Success', failure:'Failure', critical:'Critical',
  fumble:'Fumble', marginWord:'Margin', difficultyWord:'Difficulty', fatigueWord:'Fatigue',
  weaponCompatibility:'Weapon mismatch', spentWord:'Spent', remainingWord:'Remaining',
  restoredAP:'Actions restored', insufficientActivity:'no activity possible',
  blockedByFatigue:'blocked by fatigue', chosenDifficulty:'Chosen difficulty',
  rulesTitle:'📖 System Rules', editRulesBtn:'✏️ Edit Rules', saveRulesBtn:'💾 Save Rules',
  cancelBtn:'❌ Cancel', physicalEffortTitle:'Physical Effort Table', effortCol:'Effort',
  durationCol:'For how long?', exampleCol:'Example', skillTestCol:'Skill test',
  effortLight:'Light', effortMedium:'Medium', effortStrenuous:'Strenuous',
  lightDuration:'CON in hours', mediumDuration:'CON in minutes',
  strenuousDuration:'CON in seconds, rounded to the next Combat Round',
  lightExample:'Activity that places little strain on the body. Reasonable activities at a steady pace.',
  mediumExample:'Manual labor; sustained physical exercise.',
  strenuousExample:'Combat; fighting the elements; physical activity in extremely adverse conditions.',
  lightTest:'Very Easy test against Athletics, Brawn or Endurance, depending on the task.',
  mediumTest:'As above, but at Easy difficulty.',
  strenuousTest:'Standard test against Athletics, Brawn or Endurance, depending on the task.',
  effortNote:'Use Athletics for exercise, Brawn for heavy lifting, and Endurance for general/combat activity, as appropriate.',
  derivedSummary:'Derived Characteristics Summary (Mythras)'
});
Object.assign(traducoes.zh, {
  combatHistoryTitle:'🧾 掷骰记录', generalHistoryTitle:'🧾 检定与骰子记录',
  last50:'最近50次', noRolls:'尚无掷骰记录。', rollType:'掷骰', testType:'检定',
  dieType:'骰子', formulaType:'公式', psychismType:'灵能', damageType:'伤害',
  locationType:'命中部位', initiativeType:'先攻', ammoType:'弹药', energyType:'能量',
  newTurnType:'新回合', luckType:'幸运', success:'成功', failure:'失败', critical:'大成功',
  fumble:'大失败', marginWord:'差值', difficultyWord:'难度', fatigueWord:'疲劳',
  weaponCompatibility:'武器不匹配', spentWord:'消耗', remainingWord:'剩余',
  restoredAP:'行动点已恢复', insufficientActivity:'无法行动',
  blockedByFatigue:'因疲劳而无法进行', chosenDifficulty:'所选难度',
  rulesTitle:'📖 系统规则', editRulesBtn:'✏️ 编辑规则', saveRulesBtn:'💾 保存规则',
  cancelBtn:'❌ 取消', physicalEffortTitle:'体力消耗表', effortCol:'强度',
  durationCol:'持续多久？', exampleCol:'示例', skillTestCol:'技能检定',
  effortLight:'轻度', effortMedium:'中度', effortStrenuous:'剧烈',
  lightDuration:'以CON计小时', mediumDuration:'以CON计分钟',
  strenuousDuration:'以CON计秒，并向上取整至下一战斗轮',
  lightExample:'对身体几乎没有负担的活动。以稳定节奏进行的一般活动。',
  mediumExample:'体力劳动；持续性的体育活动。',
  strenuousExample:'战斗；对抗恶劣环境；在极端不利条件下进行体力活动。',
  lightTest:'根据任务，以非常容易难度检定运动、蛮力或耐力。',
  mediumTest:'同上，但难度为容易。',
  strenuousTest:'根据任务，以标准难度检定运动、蛮力或耐力。',
  effortNote:'锻炼使用运动，重物搬运使用蛮力，一般活动或战斗耐久使用耐力，视情况而定。',
  derivedSummary:'衍生属性摘要（Mythras）'
});


Object.assign(traducoes.pt, {
  allCharacters:'Todos os Personagens', noCharactersMaster:'Nenhum personagem cadastrado.',
  playerCharacterBadge:'Jogador', masterCharacterBadge:'Meu personagem', npcBadge:'NPC',
  unnamedCharacter:'Sem Nome', masterEditingPlayerSheet:'Você está controlando a ficha de outro jogador. Alterações serão salvas diretamente na ficha dele.',
  deleteOtherCharacterWarning:'ATENÇÃO: esta ficha pertence a outro jogador. Deseja realmente apagá-la?',
  cannotUndo:'Esta ação não pode ser desfeita.'
});
Object.assign(traducoes.en, {
  allCharacters:'All Characters', noCharactersMaster:'No characters registered.',
  playerCharacterBadge:'Player', masterCharacterBadge:'My character', npcBadge:'NPC',
  unnamedCharacter:'Unnamed', masterEditingPlayerSheet:"You are controlling another player's sheet. Changes are saved directly to their character.",
  deleteOtherCharacterWarning:"WARNING: this sheet belongs to another player. Do you really want to delete it?",
  cannotUndo:'This action cannot be undone.'
});
Object.assign(traducoes.zh, {
  allCharacters:'全部角色', noCharactersMaster:'尚无角色。',
  playerCharacterBadge:'玩家', masterCharacterBadge:'我的角色', npcBadge:'NPC',
  unnamedCharacter:'未命名', masterEditingPlayerSheet:'你正在控制另一名玩家的角色卡。所做修改会直接保存到该角色。',
  deleteOtherCharacterWarning:'警告：此角色卡属于另一名玩家。确定要删除吗？',
  cannotUndo:'此操作无法撤销。'
});


Object.assign(traducoes.pt, {
  initialResourcesConfig:'Recursos iniciais para novos personagens:',
  initialResourcesHelp:'Aplicado apenas quando uma nova ficha é criada. Alterações posteriores são individuais.',
  combatModeConfig:'Modo de combate:',
  combatModeTactical:'Tático — PV e PA por partes do corpo',
  combatModeSimple:'Simplificado — PV e PA gerais',
  combatModeHelp:'A mudança vale para fichas de jogadores e NPCs. Os valores do outro modo são preservados ao alternar.',
  masterOnlyField:'Somente o mestre pode alterar este campo.'
});
Object.assign(traducoes.en, {
  initialResourcesConfig:'Starting resources for new characters:',
  initialResourcesHelp:'Applied only when a new sheet is created. Later changes are individual.',
  combatModeConfig:'Combat mode:',
  combatModeTactical:'Tactical — HP and AP by body location',
  combatModeSimple:'Simplified — general HP and AP',
  combatModeHelp:'This change applies to player and NPC sheets. Values from the other mode are preserved when switching.',
  masterOnlyField:'Only the GM can change this field.'
});
Object.assign(traducoes.zh, {
  initialResourcesConfig:'新角色初始资源：',
  initialResourcesHelp:'仅在创建新角色卡时应用。之后的资源修改按角色单独进行。',
  combatModeConfig:'战斗模式：',
  combatModeTactical:'战术 — 按身体部位计算生命值与护甲',
  combatModeSimple:'简化 — 使用总生命值与总护甲',
  combatModeHelp:'此设置同时适用于玩家与NPC角色卡。切换模式时会保留另一模式的数据。',
  masterOnlyField:'只有主持人可以修改此字段。'
});

function tr_(key) { return (traducoes[idiomaAtual] || traducoes.pt)[key] || (traducoes.pt[key] || key); }

const BODY_LOC_KEYS_ = {
  'Cabeça':'bodyHead','Peito':'bodyChest','Abdômen':'bodyAbdomen',
  'Braço Direito':'bodyRightArm','Braço Esquerdo':'bodyLeftArm','Perna Direita':'bodyRightLeg','Perna Esquerda':'bodyLeftLeg'
};
function traduzirLocalCorpo_(nome) { return tr_(BODY_LOC_KEYS_[nome] || '') || nome; }

function traduzirDificuldadeNome_(idOuNome) {
  const txt = String(idOuNome || '');
  const map = {
    'muito_facil':'diffVeryEasy','Muito Fácil':'diffVeryEasy',
    'facil':'diffEasy','Fácil':'diffEasy',
    'padrao':'diffStandard','Padrão':'diffStandard',
    'dificil':'diffHard','Difícil':'diffHard',
    'formidavel':'diffFormidable','Formidável':'diffFormidable',
    'herculeo':'diffHerculean','Hercúleo':'diffHerculean',
    'Sem esperança':'noActivityPossible','Nenhuma atividade':'noActivity','Morto':'fatDead'
  };
  return tr_(map[txt] || '') || txt;
}
function traduzirMovimentoFadiga_(txt) {
  const map = {
    'Sem penalidade':'noPenalty','Sem penalidades':'noPenalties','Metade':'half','Imóvel':'immobile',
    'Nenhuma atividade possível':'noActivityPossible'
  };
  if (map[txt]) return tr_(map[txt]);
  if (/^-1 metro$/.test(txt)) return idiomaAtual==='en' ? '-1 meter' : idiomaAtual==='zh' ? '-1米' : txt;
  if (/^-2 metros$/.test(txt)) return idiomaAtual==='en' ? '-2 meters' : idiomaAtual==='zh' ? '-2米' : txt;
  return txt;
}
function traduzirRecuperacaoFadiga_(txt) {
  const map={'15 minutos':'minutes15','3 horas':'hours3','6 horas':'hours6','12 horas':'hours12','18 horas':'hours18','24 horas':'hours24','36 horas':'hours36','48 horas':'hours48','Nunca':'never'};
  return map[txt] ? tr_(map[txt]) : txt;
}
function traduzirNomeFadiga_(nivel) {
  const map={Fresh:'fatFresh',Winded:'fatWinded',Tired:'fatTired',Wearied:'fatWearied',Exhausted:'fatExhausted',Debilitated:'fatDebilitated',Incapacitated:'fatIncapacitated','Semi-Conscious':'fatSemiConscious',Comatose:'fatComatose',Dead:'fatDead'};
  return tr_(map[nivel] || '') || nivel;
}

function formatarFormulaIdioma_(formula) {
    let txt = String(formula || '').replace(/\*/g,'×');
    const mapa = idiomaAtual === 'en'
      ? {FOR:'STR',CON:'CON',TAM:'SIZ',DES:'DEX',INT:'INT',POD:'POW',CAR:'CHA'}
      : idiomaAtual === 'zh'
      ? {FOR:'力量',CON:'体质',TAM:'体型',DES:'敏捷',INT:'智力',POD:'意志',CAR:'魅力'}
      : {FOR:'FOR',CON:'CON',TAM:'TAM',DES:'DES',INT:'INT',POD:'POD',CAR:'CAR'};
    for (const [a,b] of Object.entries(mapa)) txt = txt.replace(new RegExp(a,'g'), b);
    return txt;
}

function getDescricao(item) {
    if (!item) return '';
    if (idiomaAtual === 'en') return item.descricao_en || item.descricao || '';
    if (idiomaAtual === 'zh') return item.descricao_zh || item.descricao || '';
    return item.descricao || '';
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUid = user.uid;
        document.getElementById('currentUser').textContent = user.email;
        // v224: Firebase Auth pode concluir mesmo quando o Firestore estiver lento/indisponível.
        // Não mantenha o usuário preso na tela de login esperando a leitura de perfil.
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appScreen').classList.remove('hidden');
        let userDoc;
        try {
            userDoc = await getDoc(doc(db, "usuarios", user.uid));
        } catch (erroPerfil) {
            console.error('[Mesa Estelar] autenticação concluída, mas perfil inacessível:', erroPerfil);
            const detalhe = String(erroPerfil?.code || erroPerfil?.message || 'erro de conexão');
            notificar_('Login realizado. Não foi possível carregar seu perfil: ' + detalhe, 'aviso', 9000);
        }
        if (userDoc?.exists?.()) {
            userData = userDoc.data();
            // v138/v206: o mestre pode abrir uma aba "como jogador" (?verComo=jogador → Kael Teste;
            // ?verComo=<id de token> → modo diretor: atua como aquele PJ/NPC/criatura)
            try{const vc=new URLSearchParams(location.search).get('verComo');if(userData?.role==='mestre'&&vc){window.mesaModoJogadorV138_=true;userData={...userData,role:'jogador',mestreReal:true};if(vc!=='jogador')window.mesaDiretorV206_=decodeURIComponent(vc);}}catch(_){}
            const t = traducoes[idiomaAtual];
            document.getElementById('userRole').textContent = userData.role === 'mestre' ? t.mestre : t.jogador;
            document.getElementById('configTabBtn')?.style && (document.getElementById('configTabBtn').style.display = userData.role === 'mestre' ? 'block' : 'none');
            document.getElementById('bancoTabBtn')?.classList.toggle('hidden', userData.role !== 'mestre');
            document.getElementById('escudoTabBtn').classList.toggle('hidden', userData.role !== 'mestre');
            document.getElementById('laboratorioTabBtn')?.classList.remove('hidden');
            document.getElementById('batalhaTabBtn')?.classList.add('hidden');
            // Configurações globais também afetam jogadores (recursos iniciais e modo de combate).
            // A aba continua escondida para jogadores; eles apenas leem os valores.
            await carregarConfiguracoes();
        }
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appScreen').classList.remove('hidden');
        try { await carregarBancosDeDados(); } catch (erro) { console.error('Erro parcial ao carregar bancos:', erro); }
        try { await carregarRegras(); } catch (erro) { console.error('Erro ao carregar regras:', erro); }
        try { await carregarEscudo(); } catch (erro) { console.error('Erro ao carregar escudo:', erro); }
        await carregarPersonagens();
        iniciarMercadoLocal_();
        iniciarCampanhaPublica_();
        iniciarBatalhaCompartilhada_();
        window.iniciarMapaMesaCompartilhado_();
        // A aba paralela precisa escutar o estado desde o login, inclusive
        // quando o jogador entra direto nela sem clicar novamente no botão.
        setTimeout(()=>window.novaSyncAbrir_?.(),500);
    } else {
        if(mercadoLocalUnsub_){mercadoLocalUnsub_();mercadoLocalUnsub_=null;}
        if(campanhaPublicaUnsub_){campanhaPublicaUnsub_();campanhaPublicaUnsub_=null;}
        if(labMapaMesaUnsub_){labMapaMesaUnsub_();labMapaMesaUnsub_=null;}
        novaSyncController_.close();
        currentUserUid = null; userData = null; userCharacters = []; currentCharId = null;
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('appScreen').classList.add('hidden');
    }
});

for(const [lang,texts] of Object.entries(textosRecuperacao))traducoes[lang].resetPassword= texts.label;
window.recuperarSenha=criarRecuperacaoSenha({auth,send:sendPasswordResetEmail,language:()=>idiomaAtual});
window.fazerLogin = async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const msgDiv = document.getElementById('loginMessage'); msgDiv.innerHTML = '';
    if (!email || !password) {
        msgDiv.textContent = 'Preencha o e-mail e a senha.';
        return;
    }
    const botao = document.querySelector('#loginScreen .btn-login');
    if (botao) botao.disabled = true;
    msgDiv.textContent = 'Conectando ao Firebase…';
    try {
        await signInWithEmailAndPassword(auth, email, password);
        msgDiv.textContent = '';
    } catch (error) {
        console.error('[Mesa Estelar] falha no login:', error);
        const code = String(error?.code || '');
        const mensagens = {
            'auth/invalid-credential': 'E-mail ou senha incorretos.',
            'auth/wrong-password': 'E-mail ou senha incorretos.',
            'auth/user-not-found': 'E-mail ou senha incorretos.',
            'auth/invalid-email': 'E-mail inválido.',
            'auth/too-many-requests': 'Muitas tentativas. Aguarde antes de tentar novamente.',
            'auth/network-request-failed': 'Falha de rede ao acessar o Firebase. Verifique sua conexão e eventuais bloqueios.',
            'auth/operation-not-allowed': 'Login por e-mail e senha não está habilitado no Firebase.'
        };
        msgDiv.textContent = (mensagens[code] || 'Não foi possível entrar. Código: ' + (code || 'erro desconhecido'));
        msgDiv.classList.add('message', 'error');
    } finally {
        if (botao) botao.disabled = false;
    }
};

window.fazerRegistro = async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const msgDiv = document.getElementById('loginMessage'); msgDiv.innerHTML = '';
    if (password.length < 6) { msgDiv.innerHTML = `<div class="message error">${traducoes[idiomaAtual].passwordPlaceholder}</div>`; return; }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const isMaster = email === 'yurziyun@gmail.com';
        await setDoc(doc(db, "usuarios", userCredential.user.uid), { email: email, nome: email.split('@')[0], role: isMaster ? 'mestre' : 'jogador' });
    } catch (error) { msgDiv.innerHTML = `<div class="message error">${traducoes[idiomaAtual].registerError}</div>`; }
};

window.fazerLogout = () => signOut(auth);
// v193: caixa de configurações do site (visual, idioma e conta)
window.mesaContaV193 = { email: () => auth.currentUser?.email || '', trocarSenha: async () => { const e = auth.currentUser?.email; if (!e) throw new Error('sem login'); await sendPasswordResetEmail(auth, e); return e; }, sair: () => signOut(auth) };

async function carregarBancosDeDados() {
    // v119: todas as coleções começam a carregar AO MESMO TEMPO (antes era uma depois da outra).
    const preV119_={};const preGetV119_=n=>{if(!preV119_[n]){preV119_[n]=getDocs(collection(db,n));preV119_[n].catch(()=>{});}return preV119_[n];};
    for(const n of ['pericias','origens','carreiras','especializacoes','poderesPsi','itens'])preGetV119_(n);
    if(userData?.role==='mestre')for(const n of ['cenarios','mapas','npcs','criaturas'])preGetV119_(n);
    const preObjV119_=currentUserUid?getDoc(doc(db,'configuracoes','objetosMapa')):null;preObjV119_?.catch(()=>{});
    const periciasSnap = await preGetV119_("pericias");
    if (periciasSnap.empty) {
        for (const p of periciasPadrao) await setDoc(doc(db, "pericias", p.id), p);
        periciasDB = [...periciasPadrao];
    } else {
        periciasDB = []; periciasSnap.forEach(doc => periciasDB.push({ id: doc.id, ...doc.data() }));
    }

    periciasDB = aplicarMetadadosReformaPericias_(periciasDB);

    const origensSnap = await preGetV119_("origens");
    if (origensSnap.empty) {
        for (const o of origensPadrao) await setDoc(doc(db, "origens", o.id), o);
        origensDB = [...origensPadrao];
    } else {
        origensDB = []; origensSnap.forEach(doc => origensDB.push({ id: doc.id, ...doc.data() }));
    }

    const carreirasSnap = await preGetV119_("carreiras");
    if (carreirasSnap.empty) {
        for (const c of carreirasPadrao) await setDoc(doc(db, "carreiras", c.id), c);
        carreirasDB = [...carreirasPadrao];
    } else {
        carreirasDB = []; carreirasSnap.forEach(doc => carreirasDB.push({ id: doc.id, ...doc.data() }));
    }

    const espSnap = await preGetV119_("especializacoes");
    if (espSnap.empty) {
        for (const e of especializacoesPadrao) await setDoc(doc(db, "especializacoes", e.id), e);
        especializacoesDB = [...especializacoesPadrao];
    } else {
        especializacoesDB = []; espSnap.forEach(doc => especializacoesDB.push({ id: doc.id, ...doc.data() }));
    }

    const reformaEsp={
      // IDs legados são preservados para não perder treino/XP dos personagens existentes.
      combate_pistola_laser:{nome:'Pistolas de Energia',nome_en:'Energy Pistols',nome_zh:'能量手枪',formula:'DES*2',familiaArma:'pistola_energia'},
      pistolas_laser:{nome:'Pistolas de Energia',nome_en:'Energy Pistols',nome_zh:'能量手枪',formula:'DES*2',familiaArma:'pistola_energia'},
      rifles_laser:{nome:'Rifles e Carabinas de Energia',nome_en:'Energy Rifles & Carbines',nome_zh:'能量步枪与卡宾枪',formula:'DES+INT',familiaArma:'rifle_energia'},
      arma_laser_pesada:{nome:'Armas Pesadas de Energia',nome_en:'Heavy Energy Weapons',nome_zh:'重型能量武器',formula:'FOR+DES',familiaArma:'energia_pesada'},
      pistolas_revolveres:{formula:'DES*2',disponivelCampanha:false}, fuzis_carabinas:{formula:'DES+INT',disponivelCampanha:false},
      escopetas:{disponivelCampanha:false}, submetralhadoras:{disponivelCampanha:false}, arqueiro:{disponivelCampanha:false}, artilharia:{disponivelCampanha:false},
      atirador_elite:{formula:'DES+INT'}, armas_energia:{formula:'DES+INT'},
      luta_gravidade_zero:{formula:'DES+INT'}, combate_traje_espacial:{formula:'DES+CON'},
      esgrima_plasma_vibro:{nome:'Lâminas de Energia / Vibrolâminas',nome_en:'Energy Blades / Vibroblades',nome_zh:'能量刃／振动刃',formula:'FOR+DES'},
      ninja:{nome:'Ataque Furtivo',nome_en:'Sneak Attack',nome_zh:'偷袭',formula:'DES+INT'},
      briga_taberna_pugilismo:{nome:'Pugilismo',nome_en:'Pugilism',nome_zh:'拳击',formula:'FOR+DES'}
    };
    especializacoesDB=(especializacoesDB||[]).map(e=>Object.assign(e,reformaEsp[e.id]||{}));

    try {
        const psiSnap = await preGetV119_("poderesPsi");
        if (psiSnap.empty) {
            poderesPsiDB = [...poderesPsiPadrao];
            if (userData && userData.role === 'mestre') {
                for (const p of poderesPsiPadrao) await setDoc(doc(db, "poderesPsi", p.id), p);
            }
        } else {
            poderesPsiDB = []; psiSnap.forEach(doc => poderesPsiDB.push({ id: doc.id, ...doc.data() }));
        }
    } catch (erro) {
        console.warn('Poderes Psi indisponíveis no Firestore; usando banco local temporário.', erro);
        poderesPsiDB = [...poderesPsiPadrao];
    }

    const itensSnap = await preGetV119_("itens");
    if (itensSnap.empty) {
        // Não recria mais automaticamente os itens antigos.
        // Bancos vazios devem permanecer vazios até importação explícita do mestre.
        itensDB = [];
    } else {
        itensDB = []; itensSnap.forEach(doc => itensDB.push({ id: doc.id, ...doc.data() }));
    }

    cenariosDB = [];
    if (userData && userData.role === 'mestre') {
        try {
            const cenariosSnap = await preGetV119_("cenarios");
            cenariosSnap.forEach(docSnap => cenariosDB.push({ id: docSnap.id, ...docSnap.data() }));
        } catch (erro) {
            console.warn('Banco de cenários indisponível. Verifique as regras Firestore de /cenarios.', erro);
        }
    }

    if(userData?.role==='mestre'){
        try{
            const qMapas=await preGetV119_('mapas');
            mapasDB=[];qMapas.forEach(d=>{const x={id:d.id,...d.data()};if(x.tipo!=='mapa-parte')mapasDB.push(x);});
            mapasDB.sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'}));
        }catch(e){console.warn('Banco de mapas indisponível. Verifique as regras Firestore de /mapas.',e);/* Preserve previous successful map list during transient failures. */window.mesaFalhaInicialMapasV235_=String(e?.code||e?.message||'falha de leitura');}
    }
    if(currentUserUid){
        try{
            const dObj=await (preObjV119_||getDoc(doc(db,'configuracoes','objetosMapa')));
            const idx=dObj.exists()?dObj.data():{};
            if(Array.isArray(idx?.ids)){
                // v104: leitura em paralelo (mesma ordem do índice), em vez de um documento por vez.
                const lidos=await Promise.all(idx.ids.map(async id=>{try{const ds=await getDoc(doc(db,'configuracoes',objetoMapaDocId_(id)));return ds.exists()?{id,...ds.data()}:null;}catch(e){console.warn('Objeto de mapa indisponível',id,e);return null;}}));
                const arr=lidos.filter(Boolean);
                objetosMapaDB=arr;try{for(const o of arr)map806LidosV119_.add(String(o.id));}catch(_){}
            }else objetosMapaDB=Array.isArray(idx?.lista)?idx.lista:[];
        }catch(e){console.warn('Banco de objetos de mapa indisponível:',e);objetosMapaDB=[];}
        garantirObjetosMapaPadrao_();
        try{labLiveRenderObjectBank770_();}catch(e){console.warn('Painel objetos Mesa v46.81.3',e);}
    }
    if(userData?.role==='mestre'){try{let q=await preGetV119_('npcs');npcsDB=[];q.forEach(d=>npcsDB.push({id:d.id,...d.data()}));}catch(e){console.warn(e);}}
    if(userData?.role==='mestre'){try{let q=await preGetV119_('criaturas');criaturasDB=[];q.forEach(d=>criaturasDB.push({id:d.id,...d.data()}));}catch(e){console.warn('Banco de criaturas indisponível:',e);criaturasDB=[];}}
    if(userData?.role==='mestre'){
        renderizarCampanhaMestre_();
        if(document.getElementById('batalha')?.classList.contains('active'))renderizarBatalhaCompartilhada_();
    }
    popularSelects();
    renderizarBancoDados();
    if (document.getElementById('marketGrid')) renderizarMercado();

    // Itens comprados são referências vivas ao banco: ao importar/editar o banco,
    // a ficha e a batalha passam a usar os novos dados sem recomprar.
    const atual=obterPersonagemAtual_?.();
    if(atual){
        normalizarInventario_(atual);
        if(document.getElementById('inventoryGrid')) renderizarInventario(atual);
        if(document.getElementById('char-combate')?.classList.contains('active')) renderizarCombate(atual);
    }
    if(document.getElementById('batalha')?.classList.contains('active')) renderizarBatalhaCompartilhada_();
    atualizarVinculosCenarioModalSeAberto_();
}

async function carregarConfiguracoes() {
    const defaults = {
        etapa1:80, etapa2:100, etapa3:100, etapa4:150,
        minAttr:3, minAttrINT:6, maxAttr:18, maxTreino:30,
        recursosIniciais:1000, modoCombate:'tatico'
    };
    const configDoc = await getDoc(doc(db, "configuracoes", "sistema"));
    configuracoes = configDoc.exists() ? { ...defaults, ...configDoc.data() } : { ...defaults };

    const setVal = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.value = valor;
    };
    setVal('configEtapa1', configuracoes.etapa1);
    setVal('configEtapa2', configuracoes.etapa2);
    setVal('configEtapa3', configuracoes.etapa3);
    setVal('configEtapa4', configuracoes.etapa4);
    setVal('configMinAttr', configuracoes.minAttr);
    setVal('configMinAttrINT', configuracoes.minAttrINT);
    setVal('configMaxAttr', configuracoes.maxAttr);
    setVal('configMaxTreino', configuracoes.maxTreino);
    setVal('configRecursosIniciais', Math.max(0, Math.floor(Number(configuracoes.recursosIniciais) || 0)));
    setVal('configModoCombate', configuracoes.modoCombate === 'simplificado' ? 'simplificado' : 'tatico');
}

async function carregarRegras() {
    const regrasDoc = await getDoc(doc(db, "configuracoes", "regras"));
    if (regrasDoc.exists()) {
        const rd = regrasDoc.data() || {};
        regrasTextoPT = rd.texto_pt || rd.texto || '';
        regrasTextoEN = rd.texto_en || REGRAS_PADRAO_EN;
        regrasTextoZH = rd.texto_zh || REGRAS_PADRAO_ZH;
    } else {
        regrasTextoPT = '# Regras do Sistema\n\nEm desenvolvimento...';
        regrasTextoEN = REGRAS_PADRAO_EN;
        regrasTextoZH = REGRAS_PADRAO_ZH;
        await setDoc(doc(db, "configuracoes", "regras"), {
            texto: regrasTextoPT, texto_pt: regrasTextoPT, texto_en: regrasTextoEN, texto_zh: regrasTextoZH
        });
    }
    regrasTexto = idiomaAtual === 'en' ? regrasTextoEN : idiomaAtual === 'zh' ? regrasTextoZH : regrasTextoPT;
    renderizarRegras();
}

async function carregarEscudo() {
    if (userData && userData.role !== 'mestre') return;
    const escudoDoc = await getDoc(doc(db, "configuracoes", "escudoMestre"));
    if (escudoDoc.exists()) {
        const dadosEscudo = escudoDoc.data() || {};
        escudoTexto = dadosEscudo.texto || '';
        const campanhaSalva=dadosEscudo.campanha||{};
        estadoCampanhaMestre = {
            ...estadoCampanhaMestre,
            ...campanhaSalva,
            calico:{
                ...(estadoCampanhaMestre.calico||{}),
                ...(campanhaSalva.calico||{})
            }
        };
        estadoCombateMestre = {
            ...estadoCombateMestre,
            ...(dadosEscudo.combate || {}),
            ciclo:Number(dadosEscudo.combate?.ciclo || 1),
            participantes:Array.isArray(dadosEscudo.combate?.participantes) ? dadosEscudo.combate.participantes : []
        };
    } else {
        escudoTexto = '# Escudo do Mestre\n\nAnotações privadas...';
        await setDoc(doc(db, "configuracoes", "escudoMestre"), {
            texto: escudoTexto,
            campanha: estadoCampanhaMestre,
            combate: estadoCombateMestre
        });
    }
    renderizarEscudo();
}

function popularSelects() {
    const selectOrigem = document.getElementById('editOrigin');
    selectOrigem.innerHTML = '<option value="">— escolha uma origem —</option>' + origensDB.map(o => `<option value="${o.id}">${getNome(o)}</option>`).join('');
    const selectCarreira = document.getElementById('editCareer');
    selectCarreira.innerHTML = '<option value="">— escolha uma profissão —</option>' + carreirasDB.map(c => `<option value="${c.id}">${getNome(c)}</option>`).join('');
}

function renderizarBancoDados() {
    renderizarBancoPericias();
    renderizarBancoOrigens();
    renderizarBancoCarreiras();
    renderizarBancoEspecializacoes();
    renderizarBancoPoderesPsi();
    renderizarBancoItens();
    renderizarBancoCenarios();
    renderizarBancoNPCs_();
    renderizarBancoCriaturas_();
    renderizarBancoObjetosMapa_();
    renderizarBancoMapas_();
}

function limparRascunhosMigradosV46441_(){ rascunhoPericias_={}; }

async function carregarPersonagens() {
    let querySnapshot;
    if (userData && userData.role === 'mestre') {
        // O mestre carrega todas as fichas. As regras do Firestore continuam sendo a barreira real de segurança.
        querySnapshot = await getDocs(collection(db, "personagens"));
    } else {
        const q = query(collection(db, "personagens"), where("dono", "==", currentUserUid));
        querySnapshot = await getDocs(q);
    }

    userCharacters = [];
    querySnapshot.forEach((docSnap) => {
        userCharacters.push({ id: docSnap.id, ...docSnap.data() });
    });
    // v138: na aba "como jogador" o mestre só vê (e controla) o personagem de teste
    if(window.mesaModoJogadorV138_&&!window.mesaDiretorV206_){try{if(!userCharacters.some(c=>c.testeV138))await window.criarPersonagemTesteV138_?.();}catch(e){console.warn('[Teste]',e);}userCharacters=userCharacters.filter(c=>c.testeV138);currentCharId=userCharacters[0]?.id||null;}
    // v206: no modo diretor, a ficha ativa é a do token escolhido, quando o mestre a possui
    if(window.mesaDiretorV206_){const m=String(window.mesaDiretorV206_);currentCharId=(userCharacters||[]).some(c=>String(c.id)===m)?m:null;}

    // Migração automática e idempotente das perícias antigas. Cada dono grava apenas suas fichas;
    // o mestre também consegue migrar as fichas às quais suas regras concedem escrita.
    for (const char of userCharacters) {
        await persistirMigracaoPersonagemV46441_(char);
        await migrarAprovacaoFichaV96_(char);
    }
    limparRascunhosMigradosV46441_();

    // Para o mestre, mantém as próprias fichas primeiro; depois jogadores/NPCs em ordem alfabética.
    userCharacters.sort((a,b) => {
        if (userData && userData.role === 'mestre') {
            const aMeu = a.dono === currentUserUid ? 0 : 1;
            const bMeu = b.dono === currentUserUid ? 0 : 1;
            if (aMeu !== bMeu) return aMeu - bMeu;
        }
        return String(a.nome || '').localeCompare(String(b.nome || ''), idiomaAtual === 'zh' ? 'zh' : idiomaAtual === 'en' ? 'en' : 'pt-BR');
    });

    // Não deixa uma seleção antiga apontar para uma ficha que já não está acessível.
    resolverPersonagemAtual_();

    renderizarListaPersonagens();
    renderizarDiaCampanhaFicha_();
    await processarReparosConcluidos_();
    if (userData && userData.role==='mestre' && document.getElementById('gmCampaignStats')) {
        renderizarCampanhaMestre_();
        renderizarHistoricoMestre_();
        renderizarCenarioMestre_();
        renderizarCombateMestre_();
    }
    atualizarVinculosCenarioModalSeAberto_();
}

let filtroPersonagensMestre_='pm';
window.mudarFiltroPersonagensMestre_=function(v){filtroPersonagensMestre_=String(v||'pm');renderizarListaPersonagens();};
function personagemAtivoCampanhaV102_(c){return c?.ativoNaCampanha!==false;}
window.alternarPersonagemAtivoCampanhaV102_=async function(charId){
    if(userData?.role!=='mestre')return;
    const c=(userCharacters||[]).find(x=>String(x.id)===String(charId));if(!c)return;
    const novo=!personagemAtivoCampanhaV102_(c);
    try{
        await setDoc(doc(db,'personagens',String(c.id)),{ativoNaCampanha:novo,ativoNaCampanhaAlteradoEm:new Date().toISOString(),ativoNaCampanhaAlteradoPor:currentUserUid||''},{merge:true});
        c.ativoNaCampanha=novo;
        renderizarListaPersonagens();
        try{novaSyncController_?.refreshView?.();}catch(_){}
        notificar_(novo?`▶ ${c.nome||'Personagem'} está ativo na campanha.`:`⏸ ${c.nome||'Personagem'} foi marcado como inativo. Ele não será incluído em “Trazer personagens ativos”.`,novo?'sucesso':'aviso',4800);
    }catch(e){console.error('Alternar personagem ativo v102',e);notificar_('Não foi possível alterar o estado do personagem: '+(e?.message||e),'erro',6200);}
};
function ordemCriacaoPersonagem_(c){
    const d=Date.parse(c?.criadoEm||c?.createdAt||'');if(Number.isFinite(d))return d;
    const m=String(c?.id||'').match(/char_(\d{10,})/);return m?Number(m[1]):Number.MAX_SAFE_INTEGER;
}
function renderizarListaPersonagens() {
    const container = document.getElementById('charList');
    const t = traducoes[idiomaAtual];
    const isMaster = userData && userData.role === 'mestre';
    const titulo = document.querySelector('.char-manager h3');
    const filtroBar=document.getElementById('masterCharacterFilterBar');
    if(filtroBar)filtroBar.classList.toggle('hidden',!isMaster);
    const filtroSel=document.getElementById('masterCharacterFilter');if(filtroSel)filtroSel.value=filtroPersonagensMestre_;
    if (titulo) titulo.textContent = isMaster ? (filtroPersonagensMestre_==='pj'?'Personagens dos jogadores':filtroPersonagensMestre_==='aprovacao'?'Fichas aguardando aprovação':filtroPersonagensMestre_==='inativos'?'Personagens inativos':filtroPersonagensMestre_==='todos'?'Todos os Personagens':'PM — Meus Personagens') : t.myCharacters;
    let listaVisivel=[...userCharacters];
    if(isMaster){
        if(filtroPersonagensMestre_==='pm')listaVisivel=listaVisivel.filter(c=>c.dono===currentUserUid);
        else if(filtroPersonagensMestre_==='pj')listaVisivel=listaVisivel.filter(c=>c.dono!==currentUserUid&&String(c.tipo||'pc').toLowerCase()==='pc');
        else if(filtroPersonagensMestre_==='aprovacao')listaVisivel=listaVisivel.filter(c=>c.dono!==currentUserUid&&String(c.tipo||'pc').toLowerCase()==='pc'&&statusAprovacaoFichaV96_(c)==='pendente');
        else if(filtroPersonagensMestre_==='inativos')listaVisivel=listaVisivel.filter(c=>!personagemAtivoCampanhaV102_(c));
    }
    const filtroAprovacaoOpt=document.querySelector('#masterCharacterFilter option[value="aprovacao"]');
    if(filtroAprovacaoOpt&&isMaster){const n=(userCharacters||[]).filter(c=>c.dono!==currentUserUid&&String(c.tipo||'pc').toLowerCase()==='pc'&&statusAprovacaoFichaV96_(c)==='pendente').length;filtroAprovacaoOpt.textContent=`Aprovação pendente${n?` (${n})`:''}`;}
    listaVisivel.sort((a,b)=>ordemCriacaoPersonagem_(a)-ordemCriacaoPersonagem_(b)||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));

    if (listaVisivel.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:#aaa;padding:20px;">${isMaster ? tr_('noCharactersMaster') : t.noChars}</p>`;
        document.getElementById('characterSection').classList.add('hidden');
        return;
    }

    container.innerHTML = listaVisivel.map(char => {
        const isActive = char.id === currentCharId;
        const meu = char.dono === currentUserUid;
        const tipo = String(char.tipo || 'pc').toLowerCase();
        let badge = '';
        if (isMaster) {
            if (tipo === 'npc') {
                badge = `<div style="margin:6px 0 2px;"><span style="display:inline-block;padding:3px 8px;border-radius:999px;background:rgba(155,89,182,.22);border:1px solid rgba(155,89,182,.45);color:#e5c7ff;font-size:.75em;">${tr_('npcBadge')}</span></div>`;
            } else if (meu) {
                badge = `<div style="margin:6px 0 2px;"><span style="display:inline-block;padding:3px 8px;border-radius:999px;background:rgba(0,212,255,.14);border:1px solid rgba(0,212,255,.38);color:#8feaff;font-size:.75em;">${tr_('masterCharacterBadge')}</span></div>`;
            } else {
                const donoCurto = char.dono ? String(char.dono).slice(-6) : '—';
                const st=statusAprovacaoFichaV96_(char),info=statusFichaV96_(char);
                badge = `<div style="margin:6px 0 2px;display:flex;gap:5px;justify-content:center;align-items:center;flex-wrap:wrap;"><span style="display:inline-block;padding:3px 8px;border-radius:999px;background:rgba(40,167,69,.16);border:1px solid rgba(40,167,69,.4);color:#8ff0a8;font-size:.75em;">${tr_('playerCharacterBadge')}</span><span style="display:inline-block;padding:3px 8px;border-radius:999px;${info.estilo};font-size:.75em;">${info.icone} ${escaparHtmlInventario_(info.rotulo)}</span> <span title="${escaparHtmlInventario_(char.dono || '')}" style="color:#777;font-size:.72em;">#${escaparHtmlInventario_(donoCurto)}</span></div>`;
            }
        }

        if(isMaster&&!personagemAtivoCampanhaV102_(char)){
            badge += `<div style="margin:4px 0 2px;"><span style="display:inline-block;padding:3px 8px;border-radius:999px;background:rgba(255,193,7,.12);border:1px solid rgba(255,193,7,.38);color:#ffd98a;font-size:.75em;">⏸ Inativo</span></div>`;
        }
        const acaoMestreFicha=isMaster&&!meu&&tipo==='pc';
        const botaoFluxoFicha=acaoMestreFicha?(fichaAprovadaV96_(char)
            ?`<button class="btn-small" style="background:#f0ad4e;color:#17120a;" onclick="event.stopPropagation(); reabrirFichaV96_('${char.id}')">🔓 Abrir edição</button>`
            :`<button class="btn-small" style="background:#28a745;color:#fff;" title="${statusAprovacaoFichaV96_(char)==='pendente'?'Aprovar a ficha enviada pelo jogador':'Revisar e aprovar esta ficha; se o sistema ainda a considerar incompleta, será pedida confirmação'}" onclick="event.stopPropagation(); aprovarFichaV96_('${char.id}')">✅ Aprovar</button>`) : '';

        return `<div class="char-item ${isActive ? 'active' : ''}" onclick="selecionarPersonagem('${char.id}')">
            <div class="char-item-avatar">${char.imagem ? `<img src="${escaparHtmlInventario_(char.imagem)}" alt="${escaparHtmlInventario_(char.nome || '')}">` : '👤'}</div>
            <div class="char-item-name">${escaparHtmlInventario_(char.nome || tr_('unnamedCharacter'))}</div>
            ${badge}
            <div class="char-item-actions ${acaoMestreFicha?'char-item-actions-review':''}">
                <button class="btn-small btn-select" onclick="event.stopPropagation(); selecionarPersonagem('${char.id}')">${t.selectChar}</button>
                ${botaoFluxoFicha}
                ${isMaster?`<button class="btn-small icon-btn-v102" style="${personagemAtivoCampanhaV102_(char)?'background:rgba(255,193,7,.13);color:#ffd98a;':'background:rgba(40,167,69,.15);color:#8ff0a8;'}" title="${personagemAtivoCampanhaV102_(char)?'Marcar personagem como inativo':'Reativar personagem na campanha'}" onclick="event.stopPropagation(); alternarPersonagemAtivoCampanhaV102_('${char.id}')">${personagemAtivoCampanhaV102_(char)?'⏸':'▶'}</button>`:''}
                <button class="btn-small btn-delete" onclick="event.stopPropagation(); deletarPersonagem('${char.id}')">${t.deleteChar}</button>
            </div>
        </div>`;
    }).join('');

    if (currentCharId) {
        const char = userCharacters.find(c => c.id === currentCharId);
        if (char) {
            document.getElementById('characterSection').classList.remove('hidden');
            atualizarVisualizacao(char);
            preencherFormulario(char);
            renderizarDiaCampanhaFicha_();
        }
    } else {
        document.getElementById('characterSection').classList.add('hidden');
    }
}
window.selecionarPersonagem = async (charId) => {
    const escolhido=userCharacters.find(c=>String(c.id)===String(charId));if(!escolhido)return;
    charId=escolhido.id;currentCharId=charId;
    if(userData)userData.personagemAtivo=charId;
    // A compra segue a ficha imediatamente, sem esperar a gravação da preferência.


    // Limpa imediatamente controles que poderiam exibir dados do personagem anterior.
    const skillSelect = document.getElementById('skillSelect');
    const combatSkill = document.getElementById('combatSkillSelect');
    const combatWeapon = document.getElementById('combatWeaponSelect');
    if (skillSelect) skillSelect.innerHTML = '<option value="">Atualizando...</option>';
    if (combatSkill) combatSkill.innerHTML = '<option value="">Atualizando...</option>';
    if (combatWeapon) combatWeapon.innerHTML = '<option value="">Atualizando...</option>';

    // Renderiza primeiro localmente; salvar a preferência do usuário não deve atrasar a troca visual.
    renderizarListaPersonagens();
    for(const refresh of [renderizarMercado,window.renderizarVendaMercado_,window.renderizarMercadoLocal_]){
        try{refresh?.();}catch(erro){console.warn('Atualização do mercado:',erro);}
    }
    window.dispatchEvent(new CustomEvent('personagem-selecionado',{detail:charId}));
    const selecionado=userCharacters.find(c=>c.id===charId);
    if(selecionado){renderizarAlvosCombateJogador_(selecionado);renderizarReacaoCombateJogador_(selecionado);renderizarEfeitoEspecialJogador_(selecionado);}
    try {
        await setDoc(doc(db, "usuarios", currentUserUid), { personagemAtivo: charId }, { merge: true });
    } catch (erro) {
        console.warn('Não foi possível salvar personagem ativo:', erro);
    }
};

window.deletarPersonagem = async (charId) => {
    const t = traducoes[idiomaAtual];
    const alvo = userCharacters.find(c => c.id === charId);
    const isMaster = userData && userData.role === 'mestre';
    const ehDeOutro = isMaster && alvo && alvo.dono !== currentUserUid;
    const pergunta = ehDeOutro
        ? `${tr_('deleteOtherCharacterWarning')}\n\n${alvo.nome || tr_('unnamedCharacter')}\n\n${tr_('cannotUndo')}`
        : t.confirmDelete;
    if (!confirm(pergunta)) return;

    await deleteDoc(doc(db, "personagens", charId));
    if (charId === currentCharId) {
        currentCharId = null;
        await setDoc(doc(db, "usuarios", currentUserUid), { personagemAtivo: null }, { merge: true });
    }
    await carregarPersonagens();
    alert(t.deleted);
};

window.novoPersonagem = async () => {
    const maxChars = userData.role === 'mestre' ? 999 : 5;
    const meusPersonagens = userCharacters.filter(c => c.dono === currentUserUid);
    if (meusPersonagens.length >= maxChars) { alert(`Limite: ${maxChars}`); return; }

    // Busca o valor global mais recente imediatamente antes da criação.
    // Assim uma alteração feita pelo mestre em outra conta/aba já vale para o próximo personagem.
    try { await carregarConfiguracoes(); }
    catch (erro) { console.warn('Não foi possível atualizar configurações antes da criação; usando cache local.', erro); }

    const recursosIniciaisNovo = Math.max(0, Math.floor(Number(configuracoes.recursosIniciais ?? 1000) || 0));
    const charId = `char_${Date.now()}`;
    const newChar = { nome: 'Novo Personagem', raca: 'Humano', conceito: '', sexo: 'Masculino', idade: 25, origem: '', carreira: '', classeSocial: 'Pessoa Livre', tipoCorporal: 'Médio', imagem: null, recursos: recursosIniciaisNovo, pontosSorte: null, pontosMagiaGastos: 0, atributos: { FOR: 10, CON: 10, TAM: 10, DES: 10, INT: 10, POD: 10, CAR: 10 }, bonus: { FOR: 0, CON: 0, TAM: 0, DES: 0, INT: 0, POD: 0, CAR: 0 }, pericias: {}, especializacoes: {}, inventario: { equipado: Array(12).fill(null), bolso: Array(2).fill(null), mochila: Array(20).fill(null), veiculo: Array(50).fill(null), casa: Array(100).fill(null) }, combate: { hitLocations: {}, armor: {}, fadiga: 'Fresh', armas: [], municao: [] }, dono: currentUserUid, tipo: 'pc', etapaCriacao: 1, fichaAprovada:false, fichaStatus:'rascunho', criadoEm:new Date().toISOString(), anotacoes: '', eventos: '' };
    await setDoc(doc(db, "personagens", charId), newChar);
    currentCharId = charId;
    await setDoc(doc(db, "usuarios", currentUserUid), { personagemAtivo: charId }, { merge: true });
    await carregarPersonagens();

    // Verificação defensiva: confirma visualmente o valor salvo no documento recém-criado.
    const criado = userCharacters.find(c => c.id === charId);
    if (criado && Number(criado.recursos) !== recursosIniciaisNovo) {
        criado.recursos = recursosIniciaisNovo;
        await setDoc(doc(db, "personagens", charId), { recursos: recursosIniciaisNovo }, { merge:true });
    }
    const recursosInput = document.getElementById('editRecursos');
    if (recursosInput) recursosInput.value = recursosIniciaisNovo;
    if(userData?.role!=='mestre')setTimeout(()=>iniciarTutorialCriacao_(),500);
};

function personagemAtualEhNPC_() {
    const char = userCharacters.find(c => c.id === currentCharId);
    return !!(char && char.tipo === 'npc');
}

window.validarAtributos = () => {
    const ehNPC = personagemAtualEhNPC_();
    const attrs = ['FOR', 'CON', 'DES', 'POD', 'CAR'];
    const attrsMinMax6 = ['TAM', 'INT'];

    attrs.forEach(attr => {
        const input = document.getElementById(`edit${attr}`);
        let val = parseInt(input.value);
        if (!Number.isFinite(val)) val = 10;
        const min = ehNPC ? 1 : Number(configuracoes.minAttr ?? 3);
        const max = ehNPC ? 99 : Number(configuracoes.maxAttr ?? 18);
        input.value = Math.min(max, Math.max(min, val));
    });

    attrsMinMax6.forEach(attr => {
        const input = document.getElementById(`edit${attr}`);
        let val = parseInt(input.value);
        if (!Number.isFinite(val)) val = 10;
        const min = ehNPC ? 1 : Number(configuracoes.minAttrINT ?? 6);
        const max = ehNPC ? 99 : Number(configuracoes.maxAttr ?? 18);
        input.value = Math.min(max, Math.max(min, val));
    });

    calcularTotal();
};

window.calcularTotal = () => {
    let total = 0;
    ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'].forEach(attr => {
        total += parseInt(document.getElementById(`edit${attr}`).value) || 0;
    });
    const totalEl = document.getElementById('totalPoints');
    if (totalEl) {
        totalEl.textContent = total;
        const limite = Math.max(0, Number(configuracoes.etapa1 ?? 80));
        const excedeu = !personagemAtualEhNPC_() && total > limite;
        totalEl.style.color = excedeu ? '#ff6b6b' : '';
        totalEl.title = personagemAtualEhNPC_()
            ? 'NPC: sem limite de pontos de características'
            : `Limite de características: ${limite}`;
    }
    return total;
};

window.calcularDerivados = () => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const attrs = char.atributos || {};
    const bonus = {};
    ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'].forEach(attr => {
        bonus[attr] = parseInt(document.getElementById(`bonus${attr}`).value) || 0;
    });
    
    document.getElementById('statPA').textContent = calcularPA((attrs.INT || 10) + bonus.INT, (attrs.DES || 10) + bonus.DES);
    document.getElementById('statIniciativa').textContent = calcularIniciativa((attrs.INT || 10) + bonus.INT, (attrs.DES || 10) + bonus.DES);
    document.getElementById('statTaxaRecup').textContent = calcularTaxaRecuperacao((attrs.CON || 10) + bonus.CON);
    document.getElementById('statModExp').textContent = calcularModExperiencia((attrs.CAR || 10) + bonus.CAR);
    document.getElementById('statMovimento').textContent = Number(char.movimentoBase || 6);
    document.getElementById('statModDano').textContent = calcularModDano((attrs.FOR || 10) + bonus.FOR, (attrs.TAM || 10) + bonus.TAM);
    char.bonus = { ...(char.bonus || {}), ...bonus };
    atualizarPontosSorteEMagia_(char);
    renderizarInventario(char);
};

window.calcularAlturaPesoDoFormulario = () => {
    const tamInput = document.getElementById('editTAM');
    const tipoInput = document.getElementById('editBodyType');
    if (!tamInput || !tipoInput) return;
    const calc = calcularAlturaPeso(parseInt(tamInput.value) || 10, tipoInput.value);
    document.getElementById('editAltura').value = calc.altura;
    document.getElementById('editPeso').value = calc.peso;
};

window.calcularAlturaPesoAutomatico = () => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const attrs = char.atributos || {};
    const bonus = { TAM: parseInt(document.getElementById('bonusTAM').value) || 0 };
    const calc = calcularAlturaPeso((attrs.TAM || 10) + bonus.TAM, document.getElementById('editBodyType').value);
    document.getElementById('editAltura').value = calc.altura;
    document.getElementById('editPeso').value = calc.peso;
};

window.salvarAlturaPeso = async () => {
    if (!currentCharId) return;
    const charAtual=(userCharacters||[]).find(c=>c.id===currentCharId);
    if(charAtual&&fichaAprovadaV96_(charAtual)&&userData?.role!=='mestre')return notificar_('A ficha foi aprovada. Peça ao mestre para reabrir a edição antes de alterar altura ou peso.','aviso',5000);
    const alturaRaw = String(document.getElementById('editAltura').value||'').replace(',','.');
    const altura = Number.parseFloat(alturaRaw);
    const peso = Number.parseInt(document.getElementById('editPeso').value);
    if(!Number.isFinite(altura) || altura<=0)return notificar_('Informe uma altura válida em metros, por exemplo 1,80.','aviso');
    await setDoc(doc(db, "personagens", currentCharId), { altura:Number(altura.toFixed(2)), peso }, { merge: true });
    const char=userCharacters.find(c=>c.id===currentCharId);if(char){char.altura=Number(altura.toFixed(2));char.peso=peso;}
    somSalvar_();
};

window.salvarRecursos = async () => {
    if (!currentCharId) return;
    if (!userData || userData.role !== 'mestre') {
        const char = userCharacters.find(c => c.id === currentCharId);
        if (char) document.getElementById('editRecursos').value = Number(char.recursos || 0);
        return;
    }
    const recursos = Math.max(0, Math.floor(Number(document.getElementById('editRecursos').value) || 0));
    const char = userCharacters.find(c => c.id === currentCharId);
    if (char) char.recursos = recursos;
    await setDoc(doc(db, 'personagens', currentCharId), { recursos }, { merge: true });
    renderizarMercado();
    if(marketSubtabAtual_==='vender')renderizarVendaMercado_();
    if(marketSubtabAtual_==='local')renderizarMercadoLocal_();
};

window.salvarClasseSocial = async () => {
    if (!currentCharId || !(userData && userData.role === 'mestre')) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const classeSocial = String(document.getElementById('editClasseSocialFrente')?.value || '').trim();
    char.classeSocial = classeSocial;
    await setDoc(doc(db, 'personagens', currentCharId), { classeSocial }, { merge:true });
    somSalvar_();
};


function normalizarPsi_(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

function encontrarEspecializacaoPsi_(char, esfera) {
    const alvo = normalizarPsi_(esfera);
    const mapaPadrao = {
        sentidos:'psiquismo_sentidos',
        mente:'psiquismo_mente',
        materia:'psiquismo_materia'
    };
    const especializacoesChar = char?.especializacoes || {};
    const idPadrao = mapaPadrao[alvo];
    if (idPadrao && especializacoesChar[idPadrao]) {
        return { id:idPadrao, dados:especializacoesChar[idPadrao] };
    }

    // Compatibilidade com IDs importados/antigos: procura pelo banco e pelo próprio ID.
    for (const [id, dados] of Object.entries(especializacoesChar)) {
        const registro = especializacoesDB.find(e => e.id === id);
        const nomes = [
            id,
            registro?.nome,
            registro?.nome_en,
            registro?.nome_zh
        ].map(normalizarPsi_).join(' ');
        const ehPsi = nomes.includes('psiquismo') || nomes.includes('psychism') || nomes.includes('心灵');
        const ehEsfera = alvo === 'materia'
            ? (nomes.includes('materia') || nomes.includes('matter') || nomes.includes('物质'))
            : alvo === 'mente'
            ? (nomes.includes('mente') || nomes.includes('mind') || nomes.includes('心灵'))
            : (nomes.includes('sentidos') || nomes.includes('senses') || nomes.includes('感官'));
        if (ehPsi && ehEsfera) return { id, dados };
    }
    return null;
}

function treinoPsiEsfera_(char, esfera) {
    const achado = encontrarEspecializacaoPsi_(char, esfera);
    return achado ? totalTreinoPericia_(achado.dados || {}) : 0;
}

function temPsiquismoInvestido_(char) {
    return ['Sentidos','Mente','Matéria'].some(esfera => treinoPsiEsfera_(char, esfera) > 0);
}

function pontosMagiaMax_(char) {
    return Math.max(0, Math.floor(obterAtributoTotal_(char, 'POD')));
}

function pontosSorteMax_(char) {
    const pod = Math.max(0, Math.floor(obterAtributoTotal_(char, 'POD')));
    if (pod <= 6) return 1;
    if (pod <= 12) return 2;
    return Math.floor((pod - 13) / 6) + 3;
}

function pontosSorteAtuais_(char) {
    const max = pontosSorteMax_(char);
    // Migração da versão antiga, em que todo personagem começava incorretamente com 1 ponto.
    if (char?.pontosSorteDerivadoV15 !== true) return max;
    if (char?.pontosSorte === undefined || char?.pontosSorte === null) return max;
    return Math.max(0, Math.min(max, Math.floor(Number(char.pontosSorte) || 0)));
}

function atualizarPontosSorteEMagia_(char) {
    const maxSorte = pontosSorteMax_(char);
    const sorte = pontosSorteAtuais_(char);
    const input = document.getElementById('editPontosSorte');
    if (input) {
        input.value = sorte;
        input.max = maxSorte;
        input.title = `Máximo derivado do POD: ${maxSorte}`;
        input.disabled = !(userData && userData.role === 'mestre');
    }
    const rollLuck = document.getElementById('rollLuckPoints');
    if (rollLuck) rollLuck.textContent = sorte;

    const box = document.getElementById('statMagiaBox');
    const alvo = document.getElementById('statPontosMagia');
    const possuiPsi = temPsiquismoInvestido_(char);
    if (box) box.classList.toggle('hidden', !possuiPsi);
    if (alvo && possuiPsi) {
        const max = pontosMagiaMax_(char);
        const gastos = Math.max(0, Math.floor(Number(char?.pontosMagiaGastos || 0)));
        alvo.textContent = `${Math.max(0, max - gastos)} / ${max}`;
    }
}

window.salvarPontosSorte = async () => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    if (!userData || userData.role !== 'mestre') {
        atualizarPontosSorteEMagia_(char);
        return;
    }
    const valor = Math.max(0, Math.min(pontosSorteMax_(char), Math.floor(Number(document.getElementById('editPontosSorte')?.value) || 0)));
    char.pontosSorte = valor;
    char.pontosSorteDerivadoV15 = true;
    await setDoc(doc(db, 'personagens', currentCharId), { pontosSorte: valor, pontosSorteDerivadoV15: true }, { merge: true });
    atualizarPontosSorteEMagia_(char);
};

window.gastarPontoSorte = async () => {
    somMagico_();
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const atual = pontosSorteAtuais_(char);
    if (atual <= 0) {
        alert('O personagem não possui Pontos de Sorte disponíveis.');
        return;
    }
    const novo = atual - 1;
    char.pontosSorte = novo;
    char.pontosSorteDerivadoV15 = true;
    await setDoc(doc(db, 'personagens', currentCharId), { pontosSorte: novo, pontosSorteDerivadoV15: true }, { merge: true });
    atualizarPontosSorteEMagia_(char);
    await registrarHistoricoGeral_('Sorte', `Gastou 1 Ponto de Sorte · Restantes: ${novo}`, { subtipo:'sorte', gasto:1, restante:novo });
};

function atualizarVisualizacao(data) {
    const bannerMestre = document.getElementById('masterCharacterControlBanner');
    if (bannerMestre) {
        const controlandoOutro = userData && userData.role === 'mestre' && data.dono && data.dono !== currentUserUid;
        if (controlandoOutro) {
            bannerMestre.classList.remove('hidden');
            bannerMestre.textContent = `🛡️ ${tr_('masterEditingPlayerSheet')}`;
        } else {
            bannerMestre.classList.add('hidden');
            bannerMestre.textContent = '';
        }
    }

    document.getElementById('charName').textContent = data.nome || '-';
    document.getElementById('charRace').textContent = data.raca || '-';
    const origemObj = origensDB.find(o => o.id === data.origem);
    const carreiraObj = carreirasDB.find(c => c.id === data.carreira);
    document.getElementById('charOrigin').textContent = origemObj ? getNome(origemObj) : '-';
    document.getElementById('charCareer').textContent = carreiraObj ? getNome(carreiraObj) : '-';
    const avatarDiv = document.getElementById('charAvatar');
    if (data.imagem) { avatarDiv.innerHTML = `<img src="${data.imagem}">`; } else { avatarDiv.innerHTML = '<span></span>'; }
    
    const attrs = data.atributos || {};
    const bonus = data.bonus || {};
    ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'].forEach(attr => {
        document.getElementById(`val${attr}`).textContent = (attrs[attr] || 10) + (bonus[attr] || 0);
        document.getElementById(`bonus${attr}`).value = bonus[attr] || 0;
    });
    
    document.getElementById('statPA').textContent = calcularPA((attrs.INT || 10) + (bonus.INT || 0), (attrs.DES || 10) + (bonus.DES || 0));
    document.getElementById('statIniciativa').textContent = calcularIniciativa((attrs.INT || 10) + (bonus.INT || 0), (attrs.DES || 10) + (bonus.DES || 0));
    document.getElementById('statTaxaRecup').textContent = calcularTaxaRecuperacao((attrs.CON || 10) + (bonus.CON || 0));
    document.getElementById('statModExp').textContent = calcularModExperiencia((attrs.CAR || 10) + (bonus.CAR || 0));
    document.getElementById('statMovimento').textContent = Number(data.movimentoBase || 6);
    document.getElementById('statModDano').textContent = calcularModDano((attrs.FOR || 10) + (bonus.FOR || 0), (attrs.TAM || 10) + (bonus.TAM || 0));
    
    const calc = calcularAlturaPeso((attrs.TAM || 10) + (bonus.TAM || 0), data.tipoCorporal || 'Médio');
    let alturaSalva=Number(String(data.altura??'').replace(',','.'));
    if(alturaSalva>20)alturaSalva=alturaSalva/100; // legado antigo em centímetros
    if(!alturaSalva || (alturaSalva===1 && Number(data.atributos?.TAM||10)>=6))alturaSalva=calc.altura; // corrige truncamento antigo 1,xx → 1
    document.getElementById('editAltura').value = Number(alturaSalva.toFixed(2));
    document.getElementById('editPeso').value = data.peso || calc.peso;
    const recursosInput = document.getElementById('editRecursos');
    if (recursosInput) { recursosInput.value = Number(data.recursos || 0); recursosInput.disabled = !(userData && userData.role === 'mestre'); }

    const classeSocialFrente = document.getElementById('editClasseSocialFrente');
    if (classeSocialFrente) {
        classeSocialFrente.value = data.classeSocial || '';
        classeSocialFrente.disabled = !(userData && userData.role === 'mestre');
        classeSocialFrente.title = (userData && userData.role === 'mestre') ? '' : tr_('masterOnlyField');
    }
    atualizarPontosSorteEMagia_(data);
    renderizarPsiRolagem_(data);
    renderizarPsiquismo_(data);
    
    renderizarInventario(data);
    renderizarCombate(data);
    renderizarHistoricoGeral_(data);
}

function preencherFormulario(data) {
    document.getElementById('editName').value = data.nome || '';
    document.getElementById('editRace').value = data.raca || 'Humano';
    document.getElementById('editSex').value = data.sexo || 'Masculino';
    document.getElementById('editCharImage').value = data.imagem || '';
    previewImagemPersonagem();
    document.getElementById('editOrigin').value = data.origem || '';
    document.getElementById('editCareer').value = data.carreira || '';
    document.getElementById('editBodyType').value = data.tipoCorporal || 'Médio';
    
    const attrs = data.atributos || {};
    ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'].forEach(attr => {
        document.getElementById(`edit${attr}`).value = attrs[attr] || 10;
    });
    calcularTotal();
    aplicarBloqueioCriacao_(data);
    renderizarAvisosProgressao_(data);
}

window.salvarPersonagem = async () => {
    const existente=(userCharacters||[]).find(c=>c.id===currentCharId);
    if(existente && fichaAprovadaV96_(existente) && userData?.role!=='mestre'){notificar_('Esta ficha já foi aprovada pelo mestre. Para alterar a criação, peça que ela seja reaberta para edição.','aviso',5200);return;}
    const nome = document.getElementById('editName').value.trim();
    if (!nome) { alert('Preencha o nome'); return; }
    if(userData?.role!=='mestre'&&!personagemAtualEhNPC_()){
        if(!document.getElementById('editOrigin').value){notificar_('Escolha uma Origem antes de salvar.','aviso',4500);tutorialCriacaoIdx_=1;tutorialMostrarPasso_();return;}
        if(!document.getElementById('editCareer').value){notificar_('Escolha uma Profissão/Carreira antes de salvar.','aviso',4500);tutorialCriacaoIdx_=2;tutorialMostrarPasso_();return;}
    }
    
    const atributos = {};
    ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'].forEach(attr => {
        atributos[attr] = parseInt(document.getElementById(`edit${attr}`).value) || 10;
    });
    
    // PCs devem respeitar o total da Etapa 1; NPCs são exceção.
    try { await carregarConfiguracoes(); }
    catch (erro) { console.warn('Não foi possível atualizar configurações antes de salvar.', erro); }

    validarAtributos();
    ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'].forEach(attr => {
        atributos[attr] = parseInt(document.getElementById(`edit${attr}`).value) || 10;
    });

    const totalCaracteristicas = Object.values(atributos).reduce((soma, valor) => soma + Number(valor || 0), 0);
    const limiteCaracteristicas = Math.max(0, Number(configuracoes.etapa1 ?? 80));

    if (userData?.role !== 'mestre' && !personagemAtualEhNPC_() && totalCaracteristicas > limiteCaracteristicas) {
        const excesso = totalCaracteristicas - limiteCaracteristicas;
        const mensagens = {
            pt: `Não é possível salvar: as características somam ${totalCaracteristicas}, mas o limite atual é ${limiteCaracteristicas}. Reduza ${excesso} ponto(s).`,
            en: `Cannot save: characteristics total ${totalCaracteristicas}, but the current limit is ${limiteCaracteristicas}. Reduce them by ${excesso} point(s).`,
            zh: `无法保存：属性总值为 ${totalCaracteristicas}，当前上限为 ${limiteCaracteristicas}。请减少 ${excesso} 点。`
        };
        alert(mensagens[idiomaAtual] || mensagens.pt);
        return;
    }

    const personagemData = {
        nome,
        raca: document.getElementById('editRace').value.trim(),
        sexo: document.getElementById('editSex').value,
        imagem: document.getElementById('editCharImage').value.trim() || null,
        origem: document.getElementById('editOrigin').value,
        carreira: document.getElementById('editCareer').value,
        tipoCorporal: document.getElementById('editBodyType').value,
        atributos,
        updatedAt: new Date().toISOString()
    };
    
    if (!currentCharId) {
        currentCharId = `char_${Date.now()}`;
        await setDoc(doc(db, "personagens", currentCharId), personagemData);
        await setDoc(doc(db, "usuarios", currentUserUid), { personagemAtivo: currentCharId }, { merge: true });
    } else {
        await setDoc(doc(db, "personagens", currentCharId), personagemData, { merge: true });
    }
    
    await carregarPersonagens();
    const salvo=(userCharacters||[]).find(c=>c.id===currentCharId);
    if(salvo)await verificarEConcluirCriacao_(salvo);
    somSalvar_();
    alert('Salvo!');
};

function calcularPA(int, des) {
    const soma = Number(int || 0) + Number(des || 0);
    if (soma <= 12) return 1;
    if (soma <= 24) return 2;
    if (soma <= 36) return 3;
    return 3 + Math.floor((soma - 36) / 12);
}

function calcularIniciativa(int, des) {
    // Mythras: média de INT e DES. Arredondamos para cima para números .5.
    return Math.ceil((Number(int || 0) + Number(des || 0)) / 2);
}

function calcularTaxaRecuperacao(con) {
    con = Number(con || 0);
    if (con <= 6) return 1;
    if (con <= 12) return 2;
    if (con <= 18) return 3;
    return 3 + Math.floor((con - 13) / 6);
}

function calcularModExperiencia(car) {
    car = Number(car || 0);
    if (car <= 6) return -1;
    if (car <= 12) return 0;
    if (car <= 18) return 1;
    return 1 + Math.floor((car - 13) / 6);
}

function calcularModDano(forca, tam) {
    const soma = Number(forca || 0) + Number(tam || 0);
    if (soma <= 5) return '-1d8';
    if (soma <= 10) return '-1d6';
    if (soma <= 15) return '-1d4';
    if (soma <= 20) return '-1d2';
    if (soma <= 25) return '+0';
    if (soma <= 30) return '+1d2';
    if (soma <= 35) return '+1d4';
    if (soma <= 40) return '+1d6';
    if (soma <= 45) return '+1d8';
    if (soma <= 50) return '+1d10';
    if (soma <= 60) return '+1d12';
    if (soma <= 70) return '+2d6';
    if (soma <= 80) return '+1d8+1d6';
    if (soma <= 90) return '+2d8';
    if (soma <= 100) return '+1d10+1d8';
    if (soma <= 110) return '+2d10';
    if (soma <= 120) return '+2d10+1d2';
    if (soma <= 130) return '+2d10+1d4';
    // Continuação da progressão: a cada +10, aumenta um passo simples.
    const extra = Math.floor((soma - 121) / 10);
    return `+2d10+1d${Math.min(12, 4 + extra * 2)}`;
}

function calcularAlturaPeso(tam, tipo) {
    // Tabela oficial de SIZ: usamos o ponto médio de cada faixa para autopreenchimento.
    // O usuário continua podendo editar altura e peso manualmente.
    const tabela = {
        1:{h:[1,45],l:[1,5],m:[1,7],p:[1,9]},
        2:{h:[46,80],l:[6,10],m:[8,14],p:[10,18]},
        3:{h:[81,105],l:[11,15],m:[15,21],p:[19,27]},
        4:{h:[106,120],l:[16,20],m:[22,28],p:[28,36]},
        5:{h:[121,130],l:[21,25],m:[29,35],p:[37,45]},
        6:{h:[131,140],l:[26,30],m:[36,42],p:[46,54]},
        7:{h:[141,150],l:[31,35],m:[43,49],p:[55,63]},
        8:{h:[151,155],l:[36,40],m:[50,56],p:[64,72]},
        9:{h:[156,160],l:[41,45],m:[57,63],p:[73,81]},
        10:{h:[161,165],l:[46,50],m:[64,70],p:[82,90]},
        11:{h:[166,170],l:[51,55],m:[71,77],p:[91,99]},
        12:{h:[171,175],l:[56,60],m:[78,84],p:[100,108]},
        13:{h:[176,180],l:[61,65],m:[85,91],p:[109,117]},
        14:{h:[181,185],l:[66,70],m:[92,98],p:[118,126]},
        15:{h:[186,190],l:[71,75],m:[99,105],p:[127,135]},
        16:{h:[191,195],l:[76,80],m:[106,112],p:[136,144]},
        17:{h:[196,200],l:[81,85],m:[113,119],p:[145,153]},
        18:{h:[201,205],l:[86,90],m:[120,126],p:[154,162]},
        19:{h:[206,210],l:[91,95],m:[127,133],p:[163,171]},
        20:{h:[211,215],l:[96,100],m:[134,140],p:[172,180]},
        21:{h:[216,220],l:[101,105],m:[141,147],p:[181,189]}
    };
    tam = Math.max(1, Math.round(Number(tam) || 10));
    let faixa = tabela[Math.min(tam,21)];
    if (tam > 21) {
        const extra = tam - 21;
        faixa = {
            h:[216 + extra*5,220 + extra*5],
            l:[101 + extra*5,105 + extra*5],
            m:[141 + extra*7,147 + extra*7],
            p:[181 + extra*9,189 + extra*9]
        };
    }
    const meio = a => Math.round((a[0]+a[1])/2);
    const chave = tipo === 'Leve' ? 'l' : tipo === 'Pesado' ? 'p' : 'm';
    return { altura: Number((meio(faixa.h)/100).toFixed(2)), peso: meio(faixa[chave]) };
}

function atualizarInstanciaPeloBanco_(item) {
    if (!item || typeof item !== 'object') return item;
    const idBanco = item.idBanco || item.id;
    if (!idBanco || !Array.isArray(itensDB) || !itensDB.length) return item;
    const banco = itensDB.find(x => String(x.id) === String(idBanco));
    if (!banco) return item;

    // O banco é a fonte de verdade para propriedades do item.
    // Estes campos pertencem à instância comprada e nunca são apagados pela atualização do banco.
    const estadoInstancia = {};
    [
        'idBanco','instanciaId','pvAtual','origemAquisicao','precoPago','adquiridoEm',
        'qualidade','cargaAtual','cargaMax','quantidade','notasInstancia','inutilizavel','quebradoEm','pvConsumoAtual','usoAtual','usosRestantes'
    ].forEach(k => {
        if (Object.prototype.hasOwnProperty.call(item,k)) estadoInstancia[k]=item[k];
    });

    const atualizado = {...item, ...banco, ...estadoInstancia, idBanco:String(banco.id)};
    if (Object.prototype.hasOwnProperty.call(atualizado,'pvAtual') && Number.isFinite(Number(banco.pv))) {
        atualizado.pvAtual = Math.min(Number(atualizado.pvAtual), Number(banco.pv));
    }
    if (Object.prototype.hasOwnProperty.call(atualizado,'cargaAtual')) {
        const novaCapacidade = cargaMaxArma_(atualizado);
        atualizado.cargaMax = novaCapacidade;
        atualizado.cargaAtual = Math.min(Math.max(0,Number(atualizado.cargaAtual)||0),novaCapacidade);
    }
    return atualizado;
}

function normalizarInventario_(char) {
    if (!char.inventario || typeof char.inventario !== 'object') char.inventario = {};
    const tamanhos = { equipado: 12, bolso: 2, mochila: 20, veiculo: 50, casa: 100 };

    Object.entries(tamanhos).forEach(([comp, tamanho]) => {
        let atual = Array.isArray(char.inventario[comp]) ? char.inventario[comp] : [];
        // Atualização dinâmica: dano, Pen, PA, peso, descrição, imagem etc. vêm do banco atual.
        atual = atual.map(item => item ? atualizarInstanciaPeloBanco_(item) : null);
        if (atual.length < tamanho) {
            char.inventario[comp] = atual.concat(Array(tamanho - atual.length).fill(null));
        } else {
            char.inventario[comp] = atual.slice(0, tamanho);
        }
    });
    equiparMochilaAuto_(char.inventario);
    return char.inventario;
}
// v192: a mochila equipada é que abre os espaços da aba Mochila. Sem mochila equipada, a primeira que o personagem tiver (em qualquer aba) vai para o Equipado sozinha.
function itemEhMochila_(item){return !!item&&/mochila|backpack/.test(normalizarTextoCombate_(item.nome||item.nome_en||item.idBanco||item.id||''));}
function temMochilaEquipada_(inv){return (inv?.equipado||[]).some(itemEhMochila_);}
function equiparMochilaAuto_(inv){
    if(!inv||temMochilaEquipada_(inv))return false;
    const livre=inv.equipado.findIndex(x=>!x);if(livre<0)return false;
    for(const comp of ['mochila','bolso','casa','veiculo']){const ix=(inv[comp]||[]).findIndex(itemEhMochila_);if(ix>=0){inv.equipado[livre]=inv[comp][ix];inv[comp][ix]=null;return true;}}
    return false;
}
function escaparHtmlInventario_(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function obterAtributoTotal_(char, nome) {
    return Number(char?.atributos?.[nome] || 10) + Number(char?.bonus?.[nome] || 0);
}

function pesoItem_(item) {
    return Math.max(0, Number(item?.peso || 0));
}
function bonusMochilaEspecial_(char){
    const equipados=(normalizarInventario_(char).equipado||[]).filter(Boolean);
    const bonus=equipados
      .filter(i=>/mochila|backpack/.test(normalizarTextoCombate_(i.nome||i.nome_en||'')) && Number(i.peso||0)<0)
      .map(i=>Math.abs(Number(i.peso||0)));
    return bonus.length?Math.max(...bonus):0;
}
function pesoCompartimento_(inv, comp) {
    return (Array.isArray(inv?.[comp]) ? inv[comp] : []).reduce((soma, item) => soma + (item ? pesoItem_(item) : 0), 0);
}
function pesoEfetivoCompartimento_(char,inv,comp){
    const bruto=pesoCompartimento_(inv,comp);
    return comp==='mochila'?Math.max(0,bruto-bonusMochilaEspecial_(char)):bruto;
}
function limitePesoCompartimento_(char, comp) {
    const forca = obterAtributoTotal_(char, 'FOR');
    const tam = obterAtributoTotal_(char, 'TAM');
    if (comp === 'bolso') return 2;
    if (comp === 'mochila') return temMochilaEquipada_(char?.inventario) ? Math.max(0, forca + tam) : 0;
    if (comp === 'equipado') return Math.max(0, forca + tam);
    return Infinity;
}

function validarPesoCompartimento_(char, inv, comp, mensagem = true, pesoAntes = null) {
    const limite = limitePesoCompartimento_(char, comp);
    if (!Number.isFinite(limite)) return true;
    const peso = pesoEfetivoCompartimento_(char,inv,comp);
    if (peso <= limite + 1e-9) return true;
    // v192: uma mudança que só diminui o peso nunca é recusada (antes, tirar item de uma mochila já pesada demais era barrado)
    if (pesoAntes !== null && Number.isFinite(Number(pesoAntes)) && peso <= Number(pesoAntes) + 1e-9) return true;
    if (mensagem) alert(comp === 'mochila' && !temMochilaEquipada_(inv) ? 'Equipe uma mochila para liberar os espaços da Mochila.' : `${comp === 'mochila' ? 'Mochila' : comp === 'equipado' ? 'Equipado' : 'Bolso'} excederia o limite de peso: ${peso.toFixed(1)} kg efetivos / ${limite.toFixed(1)} kg.`);
    return false;
}

function atualizarCapacidadesInventario_(char, inv) {
    const defs = {
        equipado: { id:'capacity-equipado', slots:12, nome:'Equipado' },
        bolso: { id:'capacity-bolso', slots:2, nome:'Bolso' },
        mochila: { id:'capacity-mochila', slots:20, nome:'Mochila' },
        veiculo: { id:'capacity-veiculo', slots:50, nome:'Veículo/Nave' },
        casa: { id:'capacity-casa', slots:100, nome:'Casa/Base' }
    };
    Object.entries(defs).forEach(([comp,d]) => {
        const alvo = document.getElementById(d.id);
        if (!alvo) return;
        const pesoBruto = pesoCompartimento_(inv, comp);
        const peso = pesoEfetivoCompartimento_(char,inv,comp);
        const usados = (inv[comp] || []).filter(item=>{
            if(!item)return false;
            // Mochilas/containers especiais de peso negativo representam capacidade,
            // não um volume de carga consumindo um dos próprios slots.
            const ehContainerBonus=/mochila|backpack/.test(normalizarTextoCombate_(item.nome||item.nome_en||'')) && Number(item.peso||0)<0;
            return !ehContainerBonus;
        }).length;
        const limite = limitePesoCompartimento_(char, comp);
        const bonus=comp==='mochila'?bonusMochilaEspecial_(char):0;
        if (Number.isFinite(limite)) {
            alvo.textContent = `${peso.toFixed(1)} / ${limite.toFixed(1)} kg${bonus?` (bruto ${pesoBruto.toFixed(1)}, mochila −${bonus.toFixed(1)})`:''} | ${usados}/${d.slots} itens`;
            alvo.style.color = peso > limite ? '#ff6b6b' : '';
        } else {
            alvo.textContent = `${peso.toFixed(1)} kg | ${usados}/${d.slots} itens | peso sem limite`;
            alvo.style.color = '';
        }
    });
}

function renderizarInventario(char) {
    const inv = normalizarInventario_(char);
    const tamanhos = { equipado: 12, bolso: 2, mochila: 20, veiculo: 50, casa: 100 };
    atualizarCapacidadesInventario_(char, inv);

    Object.keys(tamanhos).forEach(comp => {
        const container = document.getElementById(`inv-${comp}`);
        if (!container) return;
        const items = inv[comp] || [];
        const maxSlots = tamanhos[comp];

        container.innerHTML = Array(maxSlots).fill(0).map((_, i) => {
            const item = items[i];
            if (item && item.nome) {
                const nome = escaparHtmlInventario_(getNome(item));
                const desc = escaparHtmlInventario_(getDescricao(item));
                const img = item.imagem ? `<img src="${escaparHtmlInventario_(item.imagem)}" alt="${nome}"${miniAttr_(item)}>` : miniaturaOuCaixa_(item, nome);
                const badgeCarga=itemUsaMunicao_(item)
                    ? `<span style="position:absolute;right:3px;bottom:3px;padding:2px 5px;border-radius:7px;background:rgba(0,0,0,.82);border:1px solid rgba(0,212,255,.65);color:${cargaAtualArma_(item)>0?'#8ff0a8':'#ff8f8f'};font-size:.66em;font-weight:700;pointer-events:none;">${cargaAtualArma_(item)}/${cargaMaxArma_(item)}</span>`
                    : '';
                return `<div class="inventory-slot filled" draggable="true" style="position:relative;"
                    ondragstart="iniciarArrastoInventario(event, '${comp}', ${i})"
                    ondragend="finalizarArrastoInventario(event)"
                    ondragover="permitirSoltarInventario(event)"
                    ondrop="soltarInventario(event, '${comp}', ${i})"
                    onclick="editarItem('${comp}', ${i})">${img}${badgeCarga}
                    <div class="item-tooltip"><h5>${nome}</h5><p>${desc}</p><p>Peso: ${Number(item.peso || 0)}kg | PA: ${Number(item.pa || 0)} | PV: ${Number(item.pv || 0)}${categoriaNormalizada_(item)==='armas' ? ` | Pen.: ${Number(item.penetracao ?? obterPenetracaoArma_(item) ?? 0)} | Qualidade: ${normalizarQualidade_(item.qualidade)}` : ''}${itemUsaMunicao_(item) ? ` | Carga: ${cargaAtualArma_(item)}/${cargaMaxArma_(item)}` : (categoriaNormalizada_(item)==='municao' ? ` | Quantidade: ${Number(item.quantidade ?? item.uso ?? 1)}` : '')}</p>${itemEhArmadura_(item)?`<p style="color:#8feaff;"><strong>🛡️ Protege:</strong> ${locaisProtegidosItem_(item,['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda']).join(', ')}</p>`:''}${consumivelAtivo_(item)&&!normalizarTextoCombate_(item.nome||'').includes('nanogel')?`<p style="color:#a8f0b8;"><strong>🍽️ Consumo:</strong> ${pontosConsumoAtuais_(item)}/${maxPontosConsumo_(item)} ponto(s)</p>`:''}</div></div>`;
            }
            if (comp === 'mochila' && !temMochilaEquipada_(inv)) return `<div class="inventory-slot" style="opacity:.35;cursor:not-allowed;" onclick="alert('Equipe uma mochila para liberar estes espaços.')"><div class="item-tooltip"><h5>🔒 Bloqueado</h5><p>Equipe uma mochila para liberar os espaços.</p></div></div>`;
            return `<div class="inventory-slot"
                ondragover="permitirSoltarInventario(event)"
                ondrop="soltarInventario(event, '${comp}', ${i})"
                onclick="editarItem('${comp}', ${i})"><div class="item-tooltip"><h5>Vazio</h5><p>Arraste um item para cá ou clique para adicionar</p></div></div>`;
        }).join('');
    });
}

window.iniciarArrastoInventario = (event, compartment, index) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify({ compartment, index }));
    event.dataTransfer.setData('text/plain', `${compartment}:${index}`);
    event.currentTarget.classList.add('drag-source');
};

window.finalizarArrastoInventario = (event) => {
    if (event?.currentTarget) event.currentTarget.classList.remove('drag-source');
    document.querySelectorAll('.inventory-slot.drag-over').forEach(el => el.classList.remove('drag-over'));
};

window.permitirSoltarInventario = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    if (event.currentTarget) event.currentTarget.classList.add('drag-over');
};


function personagemEstaEmBatalha_(char){
    return !!(batalhaEstado_?.ativo && (batalhaEstado_?.participantes||[]).some(p=>String(p.id)===String(char?.id)));
}
function custoRecargaCombate_(arma){
    const n=normalizarTextoCombate_(`${arma?.nome||''} ${arma?.categoria||''}`);
    return /pesada|heavy|canhao|cannon|metralhadora pesada/.test(n)?2:1;
}
async function gastarAcaoInventarioEmCombate_(char,custo,motivo){
    if(!personagemEstaEmBatalha_(char))return true;
    const p=batalhaParticipante_(char.id);
    const atual=batalhaEstado_?.participantes?.[Number(batalhaEstado_?.turnoIndex||0)];
    if(!p||!atual||String(atual.id)!==String(char.id)){
        notificar_(`Em combate, ${motivo} só pode ser feito na própria oportunidade.`,'aviso',4200);
        return false;
    }
    if(batalhaEstado_?.pendencia||batalhaEstado_?.danoPendente){
        notificar_('Resolva a ação/reação pendente antes de mexer no equipamento.','aviso',4200);
        return false;
    }
    custo=Math.max(1,Math.floor(Number(custo)||1));
    if(Number(p.acoesAtuais||0)<custo){
        notificar_(`${motivo} exige ${custo} AÇ e não há AÇ suficientes.`,'aviso',4300);
        return false;
    }
    if(batalhaEhMestre_()){
        p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-custo);
        batalhaLogPush_(batalhaEstado_,`${p.nome}: ${motivo} (${custo} AÇ).`,'inventario_combate',{actorId:p.id});
        await batalhaSalvarEstado_();
    }else{
        p.acoesAtuais=Math.max(0,Number(p.acoesAtuais||0)-custo);
        await batalhaEnviarAcao_(char.id,'inventario_acao',{custo,motivo});
        renderizarBatalhaCompartilhada_();
    }
    notificar_(`⚔️ Em combate: ${motivo} consumiu ${custo} AÇ.`,'aviso',3800);
    return true;
}

async function recarregarSlotInventario_(char,destinoComp,destinoIndex,origemComp,origemIndex){
    if(!char)return null;
    // Depois de gastar AÇ pode chegar um snapshot do Firestore e substituir o objeto
    // que iniciou o arrasto. Resolve novamente a ficha atualmente viva na memória.
    const charAtual=userCharacters.find(c=>String(c.id)===String(char.id))||char;
    const inv=normalizarInventario_(charAtual);
    const arma=inv?.[destinoComp]?.[Number(destinoIndex)]||null;
    const mun=inv?.[origemComp]?.[Number(origemIndex)]||null;
    if(!arma||!mun||!itemUsaMunicao_(arma)||!nomesMunicaoCompativeis_(arma,mun))return null;

    const max=cargaMaxArma_(arma);
    const fornecida=cargaFornecidaMunicao_(arma,mun);
    const nova=itemUsaEnergia_(arma)
        ? Math.min(max,Math.max(0,fornecida))
        : Math.min(max,Math.max(cargaAtualArma_(arma),fornecida));
    definirCargaArma_(arma,nova);

    inv[origemComp][Number(origemIndex)]=null;
    charAtual.inventario=inv;
    if(char!==charAtual)char.inventario=inv;

    // Grava a instância fresca com cargaAtual antes de qualquer redesenho.
    await setDoc(doc(db,'personagens',charAtual.id),{inventario:inv},{merge:true});
    renderizarInventario(charAtual);
    renderizarCombate(charAtual);
    popularEquipamentosCombate_(charAtual);
    atualizarStatusMunicaoCombate_();
    const verificada=normalizarInventario_(charAtual)?.[destinoComp]?.[Number(destinoIndex)]||arma;
    return {arma:verificada,mun,carga:cargaAtualArma_(verificada),max:cargaMaxArma_(verificada)};
}

window.soltarInventario = async (event, destinoComp, destinoIndex) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget) event.currentTarget.classList.remove('drag-over');
    if (!currentCharId) return;

    let origem;
    try {
        const bruto = event.dataTransfer.getData('application/json');
        origem = bruto ? JSON.parse(bruto) : null;
    } catch (_) { origem = null; }
    if (!origem || origem.compartment == null || origem.index == null) return;

    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const inv = normalizarInventario_(char);
    const origemComp = origem.compartment;
    const origemIndex = Number(origem.index);
    destinoIndex = Number(destinoIndex);

    if (!inv[origemComp] || !inv[destinoComp]) return;
    if (origemComp === destinoComp && origemIndex === destinoIndex) return;

    const itemOrigem = inv[origemComp][origemIndex];
    if (!itemOrigem) return;
    try{if(await novaSyncController_.inventoryMove(char,{fromComp:origemComp,fromIndex:origemIndex,toComp:destinoComp,toIndex:destinoIndex,itemKey:identidadeItem(itemOrigem),targetKey:identidadeItem(inv[destinoComp][destinoIndex])})){renderizarInventario(char);renderizarCombate(char);return;}}catch(e){notificar_(e.message,'aviso');return;}

    const itemDestino = inv[destinoComp][destinoIndex] || null;

    // Atalho de recarga: arraste munição/bateria/célula diretamente sobre a arma.
    const origemEhMunicao=['municao','munição'].includes(categoriaNormalizada_(itemOrigem));
    if(origemEhMunicao && itemDestino && itemUsaMunicao_(itemDestino) && nomesMunicaoCompativeis_(itemDestino,itemOrigem)){
        if(personagemEstaEmBatalha_(char) && ['veiculo','casa'].includes(origemComp)){
            notificar_('Em combate, munição no veículo ou em casa está fora de alcance.','aviso',4300);
            return;
        }
        const custoRecarga=custoRecargaCombate_(itemDestino);
        if(!(await gastarAcaoInventarioEmCombate_(char,custoRecarga,`recarregar ${getNome(itemDestino)}`)))return;
        const recarga=await recarregarSlotInventario_(char,destinoComp,destinoIndex,origemComp,origemIndex);
        if(!recarga){
            notificar_('A recarga não pôde ser concluída. A munição não foi consumida.','erro',4500);
            return;
        }
        somSalvar_();
        notificar_(`${getNome(recarga.arma)} recarregada com ${getNome(recarga.mun)} → ${recarga.carga}/${recarga.max}`,'info',3200);
        await registrarEventoMestreNoPersonagem_(char,'Inventário',
            `${getNome(recarga.mun)} usado para recarregar ${getNome(recarga.arma)}`,
            {subtipo:'recargaArrasto',armaId:recarga.arma.idBanco||recarga.arma.id||'',municaoId:recarga.mun.idBanco||recarga.mun.id||'',carga:recarga.carga}
        );
        return;
    }

    if(personagemEstaEmBatalha_(char) && ['veiculo','casa'].includes(origemComp)){
        notificar_('Em combate, não é possível pegar equipamentos guardados no veículo ou em casa.','aviso',4300);
        return;
    }
    if(personagemEstaEmBatalha_(char) && destinoComp==='equipado'){
        const armaEntra=itemEhArmaOuEscudo_(itemOrigem),armaSai=itemDestino&&itemEhArmaOuEscudo_(itemDestino);
        let custo=0,motivo='';
        if(armaEntra){
            if(origemComp==='mochila'){custo=2;motivo=`retirar ${getNome(itemOrigem)} da mochila e equipar`;
            }else if(origemComp!=='equipado'){custo=1;motivo=`equipar ${getNome(itemOrigem)}`;
            }else if(armaSai&&String(itemDestino.instanciaId||itemDestino.id)!==String(itemOrigem.instanciaId||itemOrigem.id)){custo=1;motivo=`trocar para ${getNome(itemOrigem)}`;}
        }
        if(custo&&!(await gastarAcaoInventarioEmCombate_(char,custo,motivo)))return;
    }

    const pesoAntesDestino = pesoEfetivoCompartimento_(char, inv, destinoComp), pesoAntesOrigem = pesoEfetivoCompartimento_(char, inv, origemComp);
    inv[destinoComp][destinoIndex] = itemOrigem;
    inv[origemComp][origemIndex] = itemDestino;

    if (!validarPesoCompartimento_(char, inv, destinoComp, true, pesoAntesDestino) || !validarPesoCompartimento_(char, inv, origemComp, true, pesoAntesOrigem)) {
        inv[origemComp][origemIndex] = itemOrigem;
        inv[destinoComp][destinoIndex] = itemDestino;
        renderizarInventario(char);
        return;
    }

    char.inventario = inv;
    renderizarInventario(char);
    renderizarCombate(char);
    popularEquipamentosCombate_(char);

    try {
        await setDoc(doc(db, 'personagens', currentCharId), { inventario: inv }, { merge: true });
        await registrarEventoMestreNoPersonagem_(
            char,
            'Inventário',
            `${getNome(itemOrigem)}: ${origemComp} → ${destinoComp}`,
            {subtipo:'movimentoInventario',itemId:itemOrigem.idBanco||itemOrigem.id||'',origem:origemComp,destino:destinoComp}
        );
    } catch (erro) {
        console.error('Erro ao mover item:', erro);
        alert('Não foi possível salvar a movimentação do item. Recarregue a ficha para restaurar os dados do servidor.');
    }
};

function obterItensEquipados_(char) {
    const inv = normalizarInventario_(char);
    return (inv.equipado || []).filter(item => item && item.nome);
}

function categoriaNormalizada_(item) {
    return String(item?.categoria || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function itemEhArmadura_(item) {
    const cat = categoriaNormalizada_(item);
    return cat === 'armadura' || cat === 'armaduras';
}

function itemEhArmaOuEscudo_(item) {
    const cat = categoriaNormalizada_(item);
    return cat === 'arma' || cat === 'armas' || cat === 'escudo' || cat === 'escudos';
}

function normalizarLocalCorpo_(texto) {
    const t = String(texto || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mapa = {
        'cabeca': 'Cabeça',
        'peito': 'Peito',
        'abdomen': 'Abdômen',
        'braco direito': 'Braço Direito',
        'braco esquerdo': 'Braço Esquerdo',
        'perna direita': 'Perna Direita',
        'perna esquerda': 'Perna Esquerda'
    };
    return mapa[t] || null;
}

function locaisProtegidosItem_(item, todasLocalizacoes) {
    const bruto = String(item?.locaisProtegidos || item?.protege || '').trim();
    if (bruto) {
        if (/^(todas|todo|all)$/i.test(bruto)) return [...todasLocalizacoes];
        const locais = bruto.split(/[|,;]/).map(normalizarLocalCorpo_).filter(Boolean);
        if (locais.length) return [...new Set(locais)];
    }

    // Compatibilidade para armaduras antigas ainda sem o novo campo.
    const nome = String(item?.nome || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/capacete|elmo|helmet/.test(nome)) return ['Cabeça'];
    if (/coleto|vest/.test(nome)) return ['Peito', 'Abdômen'];
    if (/botas|boots/.test(nome)) return ['Perna Direita', 'Perna Esquerda'];
    if (/luvas|bracadeira|gauntlet/.test(nome)) return ['Braço Direito', 'Braço Esquerdo'];
    return [...todasLocalizacoes];
}

function calcularPAEquipado_(char, localizacoes) {
    const natural=Math.max(0,Number(char?.armaduraNatural||0));
    const resultado = Object.fromEntries(localizacoes.map(l => [l, natural]));
    obterItensEquipados_(char).filter(itemEhArmadura_).forEach(item => {
        const pa = Math.max(0, Number(item.pa || 0));
        if (!pa) return;
        locaisProtegidosItem_(item, localizacoes).forEach(loc => {
            if (resultado[loc] != null) resultado[loc] += pa;
        });
    });
    return resultado;
}


function penalidadePercentualItemArmadura_(item,pericia){
    if(!itemEhArmadura_(item))return 0;
    const desc=`${item.descricao||''} ${item.descricao_en||''}`.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    let pct=Number(item.penalidadePercentual??item.penalidadeArmaduraItem??NaN);
    if(!Number.isFinite(pct)){
        const m=desc.match(/-\s*(\d+(?:[.,]\d+)?)\s*%/);
        pct=m?Number(m[1].replace(',','.')):0;
    }
    if(!pct)return 0;

    const cat=normalizarTextoCombate_(pericia?.categoria||pericia?.tipo||'');
    const nome=normalizarTextoCombate_(pericia?.nome||'');
    const ehCombate=cat.includes('combate') || pericia?.__especializacao===true ||
        ['esquiva','combate_desarmado'].includes(pericia?.id);

    if(/percep|perception/.test(desc)){
        return (cat.includes('percep')||nome.includes('percep')) ? pct : 0;
    }
    if(/fisic|physical/.test(desc)){
        let fator=Number(pericia?.penalidadeArmadura);
        if(!Number.isFinite(fator))fator=ehCombate?1:0;
        return pct*Math.max(0,fator);
    }
    let fator=Number(pericia?.penalidadeArmadura);
    if(!Number.isFinite(fator))fator=ehCombate?1:0;
    return pct*Math.max(0,fator);
}

function penalidadeArmaduraTotal_(char,pericia){
    const total=obterItensEquipados_(char)
      .filter(itemEhArmadura_)
      .reduce((soma,item)=>soma+penalidadePercentualItemArmadura_(item,pericia),0);
    return Math.min(90,Math.max(0,total));
}

function valorPericiaComArmadura_(char,pericia,valorBase){
    const pct=penalidadeArmaduraTotal_(char,pericia);
    const valor=Math.max(1,Math.floor((Number(valorBase)||0)*(1-pct/100)));
    return {valor,pct};
}

function normalizarTextoCombate_(texto) {
    return String(texto || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function itemEhEscudo_(item) {
    const cat = categoriaNormalizada_(item);
    return cat === 'escudo' || cat === 'escudos';
}

function itemEhCorpoACorpo_(item) {
    return normalizarTextoCombate_(item?.alcance).includes('corpo a corpo');
}

function normalizarMunicao_(valor) {
    return String(valor || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function itemUsaMunicao_(item) {
    if (!item || itemEhCorpoACorpo_(item)) return false;
    const m = normalizarMunicao_(item.municao);
    return !!m && !['∞','infinito','infinita','nenhuma','none','-'].includes(m);
}

function itemUsaEnergia_(item) {
    const m = normalizarMunicao_(item?.municao);
    return m.includes('bateria') || m.includes('celula') || m.includes('battery') || m.includes('energy cell') || m.includes('energia');
}

function normalizarQualidade_(q) {
    const s = String(q || 'Básica').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    if (s.startsWith('sup') || s.startsWith('alta') || s.startsWith('high')) return 'Superior';
    if (s.startsWith('med') || s.startsWith('mid')) return 'Média';
    return 'Básica';
}

function multiplicadorPrecoQualidade_(q) {
    q = normalizarQualidade_(q);
    return q === 'Superior' ? 4 : q === 'Média' ? 2 : 1;
}

function classeEnergeticaArma_(item) {
    const txt = [item?.nome,item?.nome_en,item?.nome_zh,item?.categoria].filter(Boolean).join(' ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if (txt.includes('pesad') || txt.includes('heavy') || txt.includes('canhao') || txt.includes('cannon')) return 'pesada';
    if (txt.includes('rifle') || txt.includes('fuzil') || txt.includes('carabina') || txt.includes('carbine')) return 'rifle';
    return 'pistola';
}

function custoEnergiaDisparo_(item) {
    if (!itemUsaEnergia_(item)) return 0;
    const qualidade = normalizarQualidade_(item?.qualidade);
    const classe = classeEnergeticaArma_(item);
    const tabela = {
        pistola: { 'Básica':8, 'Média':4, 'Superior':2 },
        rifle:   { 'Básica':12,'Média':6, 'Superior':3 },
        pesada:  { 'Básica':16,'Média':8, 'Superior':4 }
    };
    return tabela[classe][qualidade];
}

function precoComQualidade_(item, qualidade) {
    return Math.max(0, Number(item?.preco || 0)) * multiplicadorPrecoQualidade_(qualidade);
}

function cargaMaxArma_(item) {
    if (!itemUsaMunicao_(item)) return Infinity;
    // "uso" é um campo genérico do item e, em armas de energia, pode representar
    // outra característica. Usá-lo como capacidade fazia uma pistola com uso=8
    // ter bateria máxima 8 e gastar os 8 pontos em um único disparo.
    const explicita = Number(item?.cargaMax ?? item?.capacidadeMunicao);
    if (Number.isFinite(explicita) && explicita > 0) return Math.floor(explicita);
    if(itemUsaEnergia_(item)) return 100;
    const legadoFisico=Number(item?.uso);
    if(Number.isFinite(legadoFisico)&&legadoFisico>0)return Math.floor(legadoFisico);
    return 20;
}

function cargaAtualArma_(item) {
    if (!itemUsaMunicao_(item)) return Infinity;
    const atual = Number(item?.cargaAtual);
    // Armas antigas sem o novo campo passam a ser consideradas descarregadas.
    return Number.isFinite(atual) ? Math.max(0, Math.floor(atual)) : 0;
}

function definirCargaArma_(item, valor) {
    if (!item || !itemUsaMunicao_(item)) return;
    const max = cargaMaxArma_(item);
    item.cargaMax = max;
    item.cargaAtual = Math.max(0, Math.min(max, Math.floor(Number(valor) || 0)));
}

function nomesMunicaoCompativeis_(arma, municaoItem) {
    if (!arma || !municaoItem) return false;
    const esperado = normalizarMunicao_(arma.municao);
    const nome = normalizarMunicao_([municaoItem.nome,municaoItem.nome_en,municaoItem.nome_zh,municaoItem.destinoLocal,municaoItem.categoria].filter(Boolean).join(' '));
    if (!esperado) return false;

    const energiaEsperada = /bateria|battery|celula|energy cell|energia/.test(esperado);
    const energiaItem = /bateria|battery|celula|energy cell|energia/.test(nome);
    if (energiaEsperada) return energiaItem;

    // Calibres físicos: não misturar 9 mm, 5,56 e calibre 12.
    if (/9\s*mm|9mm/.test(esperado)) return /9\s*mm|9mm/.test(nome);
    if (/5[,.]?56/.test(esperado)) return /5[,.]?56/.test(nome);
    if (/calibre\s*12|gauge\s*12|12\s*gauge/.test(esperado)) return /calibre\s*12|gauge\s*12|12\s*gauge/.test(nome);

    if (esperado.includes('flecha')) return nome.includes('flecha') || nome.includes('arrow');
    if (esperado.includes('virola')) return nome.includes('virola') || nome.includes('bolt');
    if (esperado.includes('cartucho')) return nome.includes('cartucho') || nome.includes('cartridge');
    if (esperado.includes('bala')) return nome.includes('bala') || nome.includes('bullet');
    return nome.includes(esperado) || esperado.includes(nome);
}

function cargaFornecidaMunicao_(arma, municaoItem) {
    // Uma bateria/célula é uma unidade de recarga, não "1 ponto" de energia.
    // Se houver carga energética explicitamente cadastrada, respeita-a; caso contrário,
    // uma célula compatível completa a capacidade da arma.
    if(itemUsaEnergia_(arma)){
        const explicita=Number(municaoItem?.cargaFornecida ?? municaoItem?.energia ?? municaoItem?.carga);
        if(Number.isFinite(explicita)&&explicita>0)return Math.floor(explicita);
        return cargaMaxArma_(arma);
    }
    const q = Number(municaoItem?.quantidade ?? municaoItem?.uso);
    if (Number.isFinite(q) && q > 0) return Math.floor(q);
    return 20;
}

function localizarInstanciaInventario_(char, instanciaId) {
    const inv = normalizarInventario_(char);
    for (const comp of Object.keys(inv)) {
        if (!Array.isArray(inv[comp])) continue;
        for (let i=0;i<inv[comp].length;i++) {
            const item = inv[comp][i];
            if (!item) continue;
            const id = item.instanciaId || item.instanceId || item.idInstancia || item.id;
            if (String(id) === String(instanciaId)) return {inv,comp,index:i,item};
        }
    }
    return null;
}

function encontrarMunicaoPessoal_(char, arma) {
    const inv = normalizarInventario_(char);
    for (const comp of ['bolso','mochila','equipado']) {
        const arr = inv[comp] || [];
        for (let i=0;i<arr.length;i++) {
            const item = arr[i];
            if (!item || item === arma) continue;
            const cat = categoriaNormalizada_(item);
            if ((cat === 'municao' || cat === 'munição') && nomesMunicaoCompativeis_(arma,item)) {
                return {comp,index:i,item,inv};
            }
        }
    }
    return null;
}

function atualizarStatusMunicaoCombate_() {
    const alvo = document.getElementById('combatAmmoStatus');
    const botao = document.getElementById('combatReloadBtn');
    if (!alvo || !botao) return;
    const valor = document.getElementById('combatWeaponSelect')?.value || '';
    const item = encontrarEquipamentoCombate_(valor);

    if (!item || !itemUsaMunicao_(item)) {
        alvo.textContent = item ? '∞' : '—';
        botao.style.display = 'none';
        return;
    }
    const atual = cargaAtualArma_(item), max = cargaMaxArma_(item);
    const custoTxt = itemUsaEnergia_(item) ? ` · ${normalizarQualidade_(item.qualidade)} · -${custoEnergiaDisparo_(item)}/disparo` : '';
    alvo.textContent = `${item.municao || 'Munição'}: ${atual} / ${max}${custoTxt}`;
    alvo.style.color = (itemUsaEnergia_(item) ? atual < custoEnergiaDisparo_(item) : atual <= 0) ? '#ff6b6b' : '#7ee2a8';
    botao.style.display = '';
}

async function salvarInventarioAtual_(char) {
    if (!char || !currentCharId) return;
    await setDoc(doc(db,'personagens',currentCharId),{inventario:char.inventario},{merge:true});
    renderizarInventario(char);
    atualizarStatusMunicaoCombate_();
}

window.recarregarArmaCombate = async () => {
    const char = userCharacters.find(c=>c.id===currentCharId);
    const valor = document.getElementById('combatWeaponSelect')?.value || '';
    const arma = encontrarEquipamentoCombate_(valor);
    if (!char || !arma || !itemUsaMunicao_(arma)) return;

    const alvo=localizarInstanciaInventario_(char,valor);
    const mun=encontrarMunicaoPessoal_(char,arma);
    if(!alvo){notificar_('Não foi possível localizar essa arma no inventário.','erro');return;}
    if (!mun) {
        alert(`Nenhuma munição compatível (${arma.municao}) no Bolso, Mochila ou Equipado.`);
        return;
    }

    const recarga=await recarregarSlotInventario_(char,alvo.comp,alvo.index,mun.comp,mun.index);
    if(!recarga){notificar_('A recarga não pôde ser concluída.','erro');return;}
    notificar_(`${getNome(recarga.arma)} recarregada → ${recarga.carga}/${recarga.max}`,'info',3200);
    somSalvar_();
    await registrarHistoricoCombate_(
        'Recarregar',
        `${getNome(recarga.arma)} recarregada com ${getNome(recarga.mun)} → ${recarga.carga}/${recarga.max}`,
        {subtipo:'recarregar',equipamento:getNome(recarga.arma),municao:getNome(recarga.mun),carga:recarga.carga}
    );
};

function consumirMunicaoFisica_(item, qtd=1) {
    if (!item || !itemUsaMunicao_(item) || itemUsaEnergia_(item)) return {ok:true,gasto:0,restante:Infinity};
    const atual = cargaAtualArma_(item);
    if (atual < qtd) return {ok:false,gasto:0,restante:atual};
    definirCargaArma_(item, atual-qtd);
    return {ok:true,gasto:qtd,restante:cargaAtualArma_(item)};
}

function consumirEnergiaDisparo_(item) {
    if (!item || !itemUsaEnergia_(item)) return {ok:true,gasto:0,restante:Infinity};
    const custo = custoEnergiaDisparo_(item);
    const antes = cargaAtualArma_(item);
    if (antes < custo) return {ok:false,gasto:0,restante:antes,custo};
    definirCargaArma_(item, antes-custo);
    return {ok:true,gasto:custo,restante:cargaAtualArma_(item),custo};
}

function calcularFormulaPersonagem_(formula, char) {
    const attrsBase = char?.atributos || {};
    const bonus = char?.bonus || {};
    try {
        let expr = String(formula || '0');
        ['FOR','CON','TAM','DES','INT','POD','CAR'].forEach(a => {
            const valor = (parseInt(attrsBase[a]) || 10) + (parseInt(bonus[a]) || 0);
            expr = expr.replace(new RegExp(a, 'g'), valor);
        });
        if (!/^[0-9+\-*/().\s]+$/.test(expr)) return 0;
        return Math.round(Function(`"use strict"; return (${expr})`)());
    } catch (e) {
        return 0;
    }
}


function baseNPCPericia_(char,nome){
    const a=char?.atributos||{};
    const FOR=Number(a.FOR||10),CON=Number(a.CON||10),DES=Number(a.DES||10),
          INT=Number(a.INT||10),POD=Number(a.POD||10),CAR=Number(a.CAR||10);
    const q=npcSlugPericia_(nome);
    if(q.includes('atletismo'))return FOR+DES;
    if(q.includes('resistencia'))return CON*2;
    if(q.includes('vontade'))return POD*2;
    if(q.includes('percepcao')||q.includes('insight'))return INT+POD;
    if(q.includes('furtividade'))return DES+INT;
    if(q.includes('enganacao'))return INT+CAR;
    if(q.includes('influencia'))return CAR*2;
    if(q.includes('primeiros_socorros'))return INT+DES;
    if(q.includes('operacao_tecnica'))return INT+DES;
    if(/engenharia|historia|pesquisa|estrategia|ciencia/.test(q))return INT*2;
    if(q.includes('comercio'))return INT+CAR;
    if(q.includes('locale')||q.includes('costumes'))return INT*2;
    if(q.includes('pilotagem'))return DES+INT;
    if(q.includes('conduc'))return DES+POD;
    if(q.includes('navegacao'))return INT+POD;
    if(q.includes('sobrevivencia')||q.includes('rastrear'))return INT+CON;
    if(q.includes('mineracao'))return FOR+INT;
    if(q.includes('mecanica')||q.includes('eletronica'))return INT+DES;
    if(q.includes('prestidigitacao'))return DES+CAR;
    if(q.includes('meditacao'))return POD+CON;
    if(q.includes('psiquismo'))return POD+INT;
    if(q.includes('arremesso'))return FOR+DES;
    if(q.includes('esquiva'))return DES*2;
    if(q.includes('combate')||q.includes('estilo_de_combate'))return FOR+DES;
    return INT+DES;
}

function obterValorRegistroPericia_(char, id, ehEspecializacao = false) {
    if(char?.__novaCriatura){const r=(ehEspecializacao?char.especializacoes:char.pericias)?.[id];return Number(r?.totalNova)||0;}
    if(char?.__npcTemporario || char?.__criaturaTemporaria){
        const fonte=ehEspecializacao ? char.especializacoes : char.pericias;
        const reg=fonte?.[id];
        if(reg){
            // NPCs genéricos e criaturas guardam no banco somente o INVESTIMENTO.
            // O valor final é recalculado a partir dos atributos rolados do indivíduo.
            return Math.max(0,baseNPCPericia_(char,reg.nomeOriginal||id)+Number(reg.treino||0));
        }
    }

    const banco = ehEspecializacao ? especializacoesDB : periciasDB;
    const registro = banco.find(x => x.id === id);
    if (!registro) return 0;
    const dados = (ehEspecializacao ? char.especializacoes : char.pericias)?.[id] || {};
    return calcularFormulaPersonagem_(registro.formula, char) + totalTreinoPericia_(dados);
}

const NPC_ESPECIALIZACOES_COMBATE_META_={
  armas_brancas_curtas:{nome:'Armas Brancas Curtas',uso:'corpo a corpo'},
  armas_brancas_longas:{nome:'Armas Brancas Longas',uso:'corpo a corpo'},
  armas_haste:{nome:'Armas de Haste',uso:'corpo a corpo'},
  armas_improvisadas:{nome:'Armas Improvisadas',uso:'corpo a corpo'},
  armas_arremesso:{nome:'Armas de Arremesso',uso:'distancia'},
  arqueiro:{nome:'Arqueiro',uso:'distancia'},
  pistolas_revolveres:{nome:'Pistolas e Revólveres',uso:'distancia'},
  fuzis_carabinas:{nome:'Fuzis e Carabinas',uso:'distancia'},
  escopetas:{nome:'Escopetas',uso:'distancia'},
  submetralhadoras:{nome:'Submetralhadoras',uso:'distancia'},
  armas_pesadas:{nome:'Armas Pesadas',uso:'distancia'},
  atirador_elite:{nome:'Atirador de Elite',uso:'distancia'},
  combate_pistola_laser:{nome:'Pistolas de Energia',uso:'distancia'},
  pistolas_laser:{nome:'Pistolas de Energia',uso:'distancia'},
  rifles_laser:{nome:'Rifles e Carabinas de Energia',uso:'distancia'},
  arma_laser_pesada:{nome:'Armas Pesadas de Energia',uso:'distancia'},
  armas_energia:{nome:'Armas de Energia',uso:'distancia'},
  esgrima_plasma_vibro:{nome:'Lâminas de Energia / Vibrolâminas',uso:'corpo a corpo'}
};
function especializacaoCombateFallback_(id){
    const m=NPC_ESPECIALIZACOES_COMBATE_META_[id];
    return m?{id,nome:m.nome,tipo:'Combate',uso:m.uso,usoCombate:m.uso,__especializacao:true,__fallbackNPC:true}:null;
}
function obterPericiasCombate_(char) {
    // Esquiva NÃO é uma opção de ataque. Ela é adicionada separadamente na defesa.
    const basicas = periciasDB.filter(p => p.id === 'combate_desarmado');

    if(char?.__npcTemporario || char?.__criaturaTemporaria){
        const especializacoes=Object.entries(char.especializacoes||{})
          .filter(([id,d])=>Number(d?.treino||0)>0)
          .map(([id,d])=>{
              const real=(especializacoesDB||[]).find(e=>e.id===id);
              return real?{...real,__especializacao:true}:(especializacaoCombateFallback_(id)||{id,nome:d?.nomeOriginal||id,tipo:'Combate',uso:'combate',__especializacao:true,__fallbackNPC:true});
          })
          .filter(p=>periciaCriaturaPodeAtacar_(char,p));
        const basicasCriatura=Object.entries(char.pericias||{})
          .map(([id,d])=>{
              const real=(periciasDB||[]).find(p=>p.id===id);
              return real?{...real,__especializacao:false}:{id,nome:d?.nomeOriginal||id,tipo:'Perícia',__especializacao:false,__fallbackNPC:true};
          })
          .filter(p=>periciaCriaturaPodeAtacar_(char,p));
        const unicas=new Map();
        for(const p of [...basicasCriatura,...especializacoes])unicas.set(`${p.__especializacao?'e':'p'}:${p.id}`,p);
        return [...unicas.values()];
    }

    const especializacoes = especializacoesDB.filter(e => {
        const treino = totalTreinoPericia_((char.especializacoes || {})[e.id] || {});
        const tipo = normalizarTextoCombate_(e.tipo);
        const uso = normalizarTextoCombate_(e.uso || e.usoCombate);
        return treino > 0 && tipo === 'combate' && uso !== 'teste';
    });
    return [...basicas.map(x=>({...x,__especializacao:false})),...especializacoes.map(x=>({...x,__especializacao:true}))];
}
function periciaPodeAparar_(p){
    if(!p)return false;
    if(p.id==='combate_desarmado')return true;
    const id=normalizarTextoCombate_(p.id||''),uso=normalizarTextoCombate_(p.uso||p.usoCombate||'');
    if(/pistola|revolver|rifle|fuzil|carabina|escopeta|submetralh|laser|energia|atirador|arremesso|arqueiro|pesada/.test(id))return false;
    if(uso.includes('distancia'))return false;
    return /branca|haste|plasma|vibro|improvisada|corpo/.test(`${id} ${uso}`) || p.__fallbackNPC===true;
}
function batalhaListaPericiasDefesa_(char){
    const esquiva=(periciasDB||[]).find(p=>p.id==='esquiva');
    const ofensivas=(obterPericiasCombate_(char)||[]).filter(p=>periciaCriaturaPodeDefender_(char,p));
    const lista=[...(esquiva?[{...esquiva,__especializacao:false}]:[]),...ofensivas];
    const vistos=new Set();
    return lista.filter(p=>{const k=`${p.__especializacao?'e':'p'}:${p.id}`;if(vistos.has(k))return false;vistos.add(k);return true;});
}


function familiaArmaCompat_(item) {
    if(item?.familiaArma) return normalizarTextoCombate_(item.familiaArma);
    const n = normalizarTextoCombate_([item?.id,item?.nome,item?.nome_en,item?.nome_zh,item?.descricao].filter(Boolean).join(' '));
    if (/escudo|shield/.test(n)) return 'escudo';
    if (/granada|grenade|arremesso|throw/.test(n)) return 'arremesso';
    if (/arco|bow/.test(n)) return 'arco';
    if (/escopeta|shotgun/.test(n)) return 'escopeta';
    if (/submetralhadora|submachine/.test(n)) return 'submetralhadora';
    if (/sniper|precisao|precision|anti.?material/.test(n)) return 'precisao';
    if (/(laser|blaster|plasma|phaser)/.test(n) && /(pesad|heavy|bazuca|bazooka|canhao portatil|launcher)/.test(n)) return 'energia_pesada';
    if (/(laser|blaster|phaser|plasma)/.test(n) && /(pistola|pistol|palma|palm)/.test(n)) return 'pistola_energia';
    if (/(laser|blaster|phaser|plasma)/.test(n) && /(rifle|fuzil|carabina|carbine)/.test(n)) return 'rifle_energia';
    if (/(gauss|railgun|coilgun)/.test(n)) return 'eletromagnetica';
    if (/(espada de forca|force sword|energy sword|espada de energia|energy blade|plasma|vibro)/.test(n) && /(espada|sword|blade|lamina)/.test(n)) return 'plasma_vibro';
    if (/blaster|phaser|disrupt|disintegr|sonic/.test(n)) return 'energia';
    if (/pistola|revolver|pistol|handgun|\.38|9mm|\.45|\.357|\.44/.test(n)) return 'pistola';
    if (/fuzil|rifle|carabina|carbine|5\.56|7\.62/.test(n)) return 'rifle';
    if (/metralhadora pesada|heavy machine|canhao portatil|launcher/.test(n)) return 'pesada';
    if (/plasma|vibro/.test(n) && /espada|sword|blade|lamina/.test(n)) return 'plasma_vibro';
    if (/lanca|alabarda|spear|halberd|polearm/.test(n)) return 'haste';
    if (/faca|adaga|dagger|knife/.test(n)) return 'branca_curta';
    if (/espada|sabre|saber|machado|sword|axe/.test(n)) return 'branca_longa';
    if (itemEhCorpoACorpo_(item)) return 'improvisada';
    return 'desconhecida';
}
const FAMILIAS_ESPECIALIZACAO_COMPAT_ = {
  armas_brancas_curtas:['branca_curta'], armas_brancas_longas:['branca_longa'], armas_haste:['haste'],
  armas_improvisadas:['improvisada'], armas_arremesso:['arremesso'], arqueiro:['arco'],
  pistolas_revolveres:['pistola'], fuzis_carabinas:['rifle'], escopetas:['escopeta'],
  submetralhadoras:['submetralhadora'], armas_pesadas:['pesada'], atirador_elite:['precisao'],
  combate_pistola_laser:['pistola_energia'], pistolas_laser:['pistola_energia'], rifles_laser:['rifle_energia'],
  arma_laser_pesada:['energia_pesada'], armas_energia:['energia'], esgrima_plasma_vibro:['plasma_vibro']
};
function penalidadeCompatibilidadeArma_(pericia, item) {
    if (!pericia || !item || ['esquiva','combate_desarmado','briga_pugilismo'].includes(pericia.id)) return 0;
    const fam = familiaArmaCompat_(item);
    const exatas = FAMILIAS_ESPECIALIZACAO_COMPAT_[pericia.id] || [];
    if (exatas.includes(fam)) return 0;
    const proximas = {
      atirador_elite:['rifle'], fuzis_carabinas:['precisao'],
      pistolas_revolveres:['submetralhadora'], submetralhadoras:['pistola'],
      combate_pistola_laser:['energia'], pistolas_laser:['energia'],
      rifles_laser:['energia','energia_pesada'], arma_laser_pesada:['rifle_energia','pistola_energia','energia'],
      armas_energia:['pistola_energia','rifle_energia','energia_pesada'],
      esgrima_plasma_vibro:['branca_curta','branca_longa','haste'],
      armas_brancas_curtas:['plasma_vibro'], armas_brancas_longas:['plasma_vibro'], armas_haste:['plasma_vibro']
    };
    if ((proximas[pericia.id] || []).includes(fam)) return 1;
    return 2;
}
function rotuloCompatArma_(graus) {
    if (!graus) return '';
    const t = traducoes[idiomaAtual] || traducoes.pt;
    return ' ' + (graus === 1 ? t.mismatch1 : t.mismatch2);
}

function equipamentoCompativelComPericia_(item, pericia) {
    if (!item || !pericia) return false;
    const uso = normalizarTextoCombate_(pericia.uso || pericia.usoCombate);
    if (itemEhEscudo_(item)) return uso.includes('defesa');
    if (itemEhCorpoACorpo_(item)) return uso.includes('corpo a corpo') || uso.includes('defesa');
    return uso.includes('distancia');
}

function popularPericiasCombate_(char) {
    const select = document.getElementById('combatSkillSelect');
    if (!select) return;
    const anterior = select.value;
    const lista = obterPericiasCombate_(char);
    select.innerHTML = lista.map(p => `<option value="${p.__especializacao ? 'esp:' : 'per:'}${escaparHtmlInventario_(p.id)}">${escaparHtmlInventario_(getNome(p))}</option>`).join('');
    if ([...select.options].some(o => o.value === anterior)) select.value = anterior;
}

function obterPericiaCombateSelecionada_() {
    const select = document.getElementById('combatSkillSelect');
    if (!select?.value) return null;
    const [tipo, id] = select.value.split(':');
    const banco = tipo === 'esp' ? especializacoesDB : periciasDB;
    const registro = banco.find(x => x.id === id);
    return registro ? {...registro, __especializacao: tipo === 'esp'} : null;
}

function popularEquipamentosCombate_(char) {
    popularPericiasCombate_(char);
    const select = document.getElementById('combatWeaponSelect');
    if (!select) return;
    const anterior = select.value;
    const pericia = obterPericiaCombateSelecionada_();
    const equipados = obterItensEquipados_(char).filter(itemEhArmaOuEscudo_);
    let opcoes = [];

    if (!pericia) {
        opcoes = [{value:'', label:'—'}];
    } else if (pericia.id === 'esquiva') {
        opcoes = [{value:'nenhum', label:(traducoes[idiomaAtual]||traducoes.pt).noEquipment}];
    } else if (pericia.id === 'combate_desarmado') {
        opcoes = [{value:'desarmado', label:(traducoes[idiomaAtual]||traducoes.pt).fists}];
    } else {
        const compativeis = equipados.filter(i => equipamentoCompativelComPericia_(i, pericia));
        opcoes = compativeis.map((item, i) => {
            const id = item.instanciaId || item.instanceId || item.idInstancia || item.id || `equipado_${i}`;
            return {value:String(id), label:getNome(item)+rotuloCompatArma_(penalidadeCompatibilidadeArma_(pericia,item))};
        });
        if (!opcoes.length) opcoes = [{value:'', label:(traducoes[idiomaAtual]||traducoes.pt).noCompatibleEquipment}];
    }

    select.innerHTML = opcoes.map(o => `<option value="${escaparHtmlInventario_(o.value)}">${escaparHtmlInventario_(o.label)}</option>`).join('');
    if ([...select.options].some(o => o.value === anterior)) select.value = anterior;
    atualizarPainelCombate();
    atualizarStatusMunicaoCombate_();
}

function encontrarEquipamentoCombate_(valor) {
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char || !valor || ['desarmado','nenhum'].includes(valor)) return null;
    return obterItensEquipados_(char).find((item, i) => {
        const id = item.instanciaId || item.instanceId || item.idInstancia || item.id || `equipado_${i}`;
        return String(id) === String(valor);
    }) || null;
}

function obterExpressaoDanoCombate_() {
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return '';
    const pericia = obterPericiaCombateSelecionada_();
    const valorEquip = document.getElementById('combatWeaponSelect')?.value || '';
    if (!pericia || pericia.id === 'esquiva') return '';
    const mod = calcularModDano(
        (char.atributos?.FOR || 10) + (char.bonus?.FOR || 0),
        (char.atributos?.TAM || 10) + (char.bonus?.TAM || 0)
    );
    const modLimpo = (!mod || mod === '+0' || mod === '0') ? '' : mod;
    if (pericia.id === 'combate_desarmado' || valorEquip === 'desarmado') return `1d3${modLimpo}`;
    const item = encontrarEquipamentoCombate_(valorEquip);
    if (!item || !item.dano) return '';
    return `${item.dano}${itemEhCorpoACorpo_(item) ? modLimpo : ''}`;
}

window.atualizarPainelCombate = () => {
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const pericia = obterPericiaCombateSelecionada_();
    const selectEquip = document.getElementById('combatWeaponSelect');
    if (!pericia) {
        document.getElementById('combatSkillValue').textContent = '—';
        document.getElementById('combatWeaponDamage').textContent = '—';
        return;
    }
    const valor = obterValorRegistroPericia_(char, pericia.id, pericia.__especializacao);
    document.getElementById('combatSkillValue').textContent = valor;

    // A troca de perícia redefine as opções de equipamento.
    if (selectEquip) {
        const atual = selectEquip.value;
        const equipados = obterItensEquipados_(char).filter(itemEhArmaOuEscudo_);
        let opcoes;
        if (pericia.id === 'esquiva') opcoes = [{value:'nenhum',label:'Nenhum equipamento'}];
        else if (pericia.id === 'combate_desarmado') opcoes = [{value:'desarmado',label:'Punhos'}];
        else {
            opcoes = equipados.filter(i => equipamentoCompativelComPericia_(i, pericia)).map((item,i) => ({
                value:String(item.instanciaId || item.instanceId || item.idInstancia || item.id || `equipado_${i}`),
                label:getNome(item)+rotuloCompatArma_(penalidadeCompatibilidadeArma_(pericia,item))
            }));
            if (!opcoes.length) opcoes = [{value:'',label:(traducoes[idiomaAtual]||traducoes.pt).noCompatibleEquipment}];
        }
        selectEquip.innerHTML = opcoes.map(o => `<option value="${escaparHtmlInventario_(o.value)}">${escaparHtmlInventario_(o.label)}</option>`).join('');
        if ([...selectEquip.options].some(o => o.value === atual)) selectEquip.value = atual;
    }
    window.mostrarDanoEquipamentoCombate();
};

window.mostrarDanoEquipamentoCombate = () => {
    const alvo = document.getElementById('combatWeaponDamage');
    if (!alvo) return;
    alvo.textContent = obterExpressaoDanoCombate_() || '—';
    const char = userCharacters.find(c => c.id === currentCharId);
    const pericia = obterPericiaCombateSelecionada_();
    const item = encontrarEquipamentoCombate_(document.getElementById('combatWeaponSelect')?.value || '');
    const valorEl = document.getElementById('combatSkillValue');
    if (char && pericia && valorEl) {
        const bruto = obterValorRegistroPericia_(char, pericia.id, pericia.__especializacao);
        const graus = item ? penalidadeCompatibilidadeArma_(pericia, item) : 0;
        if (graus > 0) {
            const idx = Math.min(GRAUS_DIFICULDADE.length - 1, 2 + graus);
            const efetivo = Math.max(1, Math.floor(bruto * GRAUS_DIFICULDADE[idx].multiplicador));
            valorEl.textContent = `${bruto} → ${efetivo}`;
        } else valorEl.textContent = bruto;
    }
    atualizarStatusMunicaoCombate_();
    const charSync=(userCharacters||[]).find(c=>c.id===currentCharId);
    if(charSync){renderizarAlvosCombateJogador_(charSync);renderizarReacaoCombateJogador_(charSync);renderizarEfeitoEspecialJogador_(charSync);renderizarEstadoCaidoJogador_(charSync);}
};

function classificarD100_(valor, rolagem) {
    const v = Math.max(0, Math.min(100, Number(valor) || 0));
    const critico = v * 0.1;
    // Mythras: 99 e 00 são Fiasco; se a perícia efetiva passar de 100, apenas 00.
    const fiasco = v > 100 ? rolagem === 100 : rolagem >= 99;
    if (fiasco) return {grau:'Fiasco', sucesso:false};
    if (rolagem < critico) return {grau:'Crítico', sucesso:true};
    if (rolagem <= v) return {grau:'Sucesso', sucesso:true};
    return {grau:'Falha', sucesso:false};
}

function formatarHoraHistoricoCombate_(iso) {
    const d = iso ? new Date(iso) : new Date();
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}


function traduzirGrauD100_(grau) {
    const m = {'Sucesso':'success','Falha':'failure','Crítico':'critical','Fiasco':'fumble',
               'Success':'success','Failure':'failure','Critical':'critical','Fumble':'fumble'};
    return tr_(m[grau] || '') || grau || '';
}
function traduzirTipoHistorico_(tipo) {
    const m = {
      'Rolagem':'rollType','D100':'rollType','Teste':'testType','Dado':'dieType','Fórmula':'formulaType',
      'Psiquismo':'psychismType','Dano':'damageType','Localização':'locationType','Iniciativa':'initiativeType',
      'Munição':'ammoType','Energia':'energyType','Novo turno':'newTurnType','Sorte':'luckType'
    };
    return tr_(m[tipo] || '') || tipo || tr_('rollType');
}
function procurarNomeBancoPorId_(id, bancos) {
    if (!id) return '';
    for (const banco of bancos) {
        const obj = (banco || []).find(x => x.id === id);
        if (obj) return getNome(obj);
    }
    return '';
}
function traduzirNomeEquipHistorico_(nome) {
    if (!nome) return '';
    if (nome === 'Punhos') return (traducoes[idiomaAtual]||traducoes.pt).fists || nome;
    const n = normalizarTextoCombate_(nome);
    const item = (itensDB || []).find(i => [i.nome,i.nome_en,i.nome_zh].some(v => normalizarTextoCombate_(v) === n));
    return item ? getNome(item) : nome;
}
function formatarRegistroHistorico_(reg, combate=false) {
    const d = reg || {};
    const subtipo = d.subtipo || '';
    if (subtipo === 'pericia' || subtipo === 'periciaCombate') {
        const nome = procurarNomeBancoPorId_(d.periciaId, [periciasDB, especializacoesDB]) || '';
        if (d.bloqueado) {
            return `${nome} ${tr_('blockedByFatigue')} · ${tr_('chosenDifficulty')}: ${traduzirDificuldadeNome_(d.dificuldadeEscolhida)}`;
        }
        if (Number.isFinite(Number(d.rolagem)) && Number.isFinite(Number(d.valorEfetivo))) {
            const grau = traduzirGrauD100_(d.grau);
            const margem = Number.isFinite(Number(d.margem)) ? ` · ${tr_('marginWord')} ${d.margem}` : '';
            const dif1 = traduzirDificuldadeNome_(d.dificuldadeEscolhida);
            const dif2 = traduzirDificuldadeNome_(d.dificuldadeEfetiva);
            const fad = Number(d.degrausFadiga||0) > 0 ? ` · ${tr_('fatigueWord')} +${d.degrausFadiga}` : '';
            const comp = Number(d.penalidadeCompatibilidade||0) > 0 ? ` · ${tr_('weaponCompatibility')} +${d.penalidadeCompatibilidade}` : '';
            const valores = Number.isFinite(Number(d.valorBase)) ? ` (${d.valorBase}→${d.valorEfetivo})` : '';
            return `${nome}: ${d.rolagem} / ${d.valorEfetivo} → ${grau}${margem} · ${tr_('difficultyWord')} ${dif1}${fad}${comp} → ${dif2}${valores}`;
        }
    }
    if (subtipo === 'psiquismo') {
        const poder = (poderesPsiDB || []).find(p => p.id === d.poderId);
        const nome = poder ? getNome(poder) : '';
        const esfera = traduzirEsferaPsi_(d.esfera || poder?.esfera || '');
        return `${nome} · ${esfera} · ${tr_('arc')} ${d.arco || 1} · ${tr_('spentWord')} ${d.gastoPP ?? 0} PP`;
    }
    if (subtipo === 'dadoLivre') return `${d.dado || ''} → ${d.resultado ?? ''}`;
    if (subtipo === 'formula') return `${d.formula || ''} = ${d.total ?? ''}${Array.isArray(d.detalhes)&&d.detalhes.length ? ` · ${d.detalhes.join(' + ')}` : ''}`;
    if (subtipo === 'localizacao') return `D20 ${d.rolagem ?? ''} → ${traduzirLocalCorpo_(d.local || '')}`;
    if (subtipo === 'iniciativa') {
        const fad = Number(d.penalidadeFadiga||0) ? ` (${tr_('fatigueWord')} ${d.penalidadeFadiga})` : '';
        return `1d10 [${d.dado ?? ''}] + ${d.iniciativaEfetiva ?? ''}${fad} = ${d.total ?? ''}`;
    }
    if (subtipo === 'dano') {
        const eq = traduzirNomeEquipHistorico_(d.equipamento || '');
        const crit = d.critico ? ` · ${tr_('critical')}` : '';
        return `${eq}: ${d.expressao || ''} → ${d.total ?? ''}${crit}${Array.isArray(d.detalhes)&&d.detalhes.length ? ` · ${d.detalhes.join(' · ')}` : ''}`;
    }
    if (subtipo === 'novoTurno') return `${tr_('restoredAP')}: ${d.pontosAcao ?? ''}`;
    if (subtipo === 'energia' || subtipo === 'municao') {
        const eq = traduzirNomeEquipHistorico_(d.equipamento || '');
        return `${eq} · ${tr_('spentWord')} ${d.gasto ?? ''} · ${tr_('remainingWord')} ${d.restante ?? ''}`;
    }
    if (subtipo === 'sorte') return `${tr_('spentWord')} ${d.gasto ?? 1} · ${tr_('remainingWord')} ${d.restante ?? ''}`;
    return d.texto || '';
}

function renderizarHistoricoCombate_(char) {
    const alvo = document.getElementById('combatRollHistory');
    if (!alvo) return;
    const historico = Array.isArray(char?.historicoRolagens) ? char.historicoRolagens : [];
    if (!historico.length) {
        alvo.innerHTML = `<div style="color:#888;">${escaparHtmlInventario_(tr_('noRolls'))}</div>`;
        return;
    }
    alvo.innerHTML = historico.slice(0, 50).map(reg => {
        const hora = formatarHoraHistoricoCombate_(reg.timestamp);
        const tipo = escaparHtmlInventario_(traduzirTipoHistorico_(reg.tipo || 'Rolagem'));
        const texto = escaparHtmlInventario_(formatarRegistroHistorico_(reg, true));
        return `<div style="display:grid;grid-template-columns:82px 120px 1fr;gap:10px;align-items:start;padding:8px 10px;background:rgba(255,255,255,0.035);border-radius:7px;border:1px solid rgba(255,255,255,0.06);">
            <span style="color:#888;font-size:0.88em;white-space:nowrap;">${hora}</span>
            <strong style="color:#d8c7ff;font-size:0.9em;">${tipo}</strong>
            <span style="color:#ddd;line-height:1.35;">${texto}</span>
        </div>`;
    }).join('');
}


function classificarEventoMestre_(tipo, dados={}) {
    const t = normalizarTextoCombate_(tipo || '');
    if (dados.subtipo === 'compra') return 'mercado';
    if (dados.subtipo === 'movimentoInventario' || /inventario|item|recarregar|municao|energia/.test(t)) return 'inventario';
    if (/teste|rolagem|d100|dado|formula|psi|dano|iniciativa|localizacao|sorte/.test(t) || dados.subtipo) return 'rolagem';
    return 'personagem';
}

async function registrarEventoMestreNoPersonagem_(char, tipo, texto, dados={}) {
    if (!char?.id && !currentCharId) return;
    const idChar = char?.id || currentCharId;
    const alvo = char || userCharacters.find(c=>c.id===idChar);
    if (!alvo) return;

    const registro = {
        id:`gm_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        timestamp:new Date().toISOString(),
        tipo:String(tipo||'Evento'),
        categoriaMestre:classificarEventoMestre_(tipo,dados),
        texto:String(texto||''),
        atorUid:currentUserUid || '',
        ...dados
    };
    const atual=Array.isArray(alvo.historicoMestre)?alvo.historicoMestre:[];
    const novo=[registro,...atual].slice(0,300);
    alvo.historicoMestre=novo;
    try {
        await setDoc(doc(db,'personagens',idChar),{historicoMestre:novo},{merge:true});
    } catch(e) {
        console.warn('Falha ao registrar evento privado do mestre:',e);
    }
}

async function registrarHistoricoCombate_(tipo, texto, dados = {}) {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const registro = {
        id: `roll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tipo: String(tipo || 'Rolagem'),
        texto: String(texto || ''),
        timestamp: new Date().toISOString(),
        ...dados
    };
    const atual = Array.isArray(char.historicoRolagens) ? char.historicoRolagens : [];
    const novo = [registro, ...atual].slice(0, 50);
    char.historicoRolagens = novo;
    renderizarHistoricoCombate_(char);
    try {
        await setDoc(doc(db, 'personagens', currentCharId), { historicoRolagens: novo }, { merge: true });
        await registrarEventoMestreNoPersonagem_(char, tipo, texto, dados);
    } catch (erro) {
        console.error('Erro ao salvar histórico de rolagens:', erro);
    }
}

window.rolarCombateD100 = async () => {
    somDado_();
    const char = userCharacters.find(c => c.id === currentCharId);
    const pericia = obterPericiaCombateSelecionada_();
    const resumo = document.getElementById('combatRollSummary');
    if (!char || !pericia || !resumo) return;
    if(ataqueBloqueadoPorEfeito_(char)){resumo.innerHTML='⭐ Resolva o Efeito Especial pendente antes de fazer outro teste.';return;}
    if(estaCaidoCombate_(char)&&periciaEhOfensiva_(pericia)){resumo.innerHTML='⚠️ Você está caído. Gaste 1 AÇ para se levantar antes de atacar.';renderizarEstadoCaidoJogador_(char);return;}
    const alvoId=document.getElementById('combatTargetSelect')?.value||alvoAtualCombateJogador_(char);
    if(periciaEhOfensiva_(pericia)&&char?.combate?.sessaoMesa?.ativo&&!alvoId){resumo.innerHTML='⚠️ Selecione um alvo antes de atacar.';return;}

    const fadiga = obterRegraFadiga_(char);
    const paInfo = garantirPontosAcaoCombate_(char);
    if (paInfo.max <= 0 || !fadiga.multiplicador) {
        resumo.innerHTML = `⚠️ ${escaparHtmlInventario_(fadiga.nome)}: nenhuma ação de combate é possível.`;
        return;
    }
    if (paInfo.atual <= 0) {
        resumo.innerHTML = `⚠️ Sem AÇ restantes nesta rodada.`;
        return;
    }

    const equip = document.getElementById('combatWeaponSelect')?.value || '';
    if (!['esquiva','combate_desarmado'].includes(pericia.id) && !equip) {
        resumo.innerHTML = '⚠️ Não há equipamento compatível equipado para esta perícia.';
        return;
    }

    const armaUsada = encontrarEquipamentoCombate_(equip);
    if (armaUsada && itemUsaMunicao_(armaUsada)) {
        const carga = cargaAtualArma_(armaUsada);
        const minimo = itemUsaEnergia_(armaUsada) ? custoEnergiaDisparo_(armaUsada) : 1;
        if (carga < minimo) {
            resumo.innerHTML = `⚠️ ${escaparHtmlInventario_(getNome(armaUsada))} não tem ${escaparHtmlInventario_(armaUsada.municao || 'munição')} suficiente. Necessário: ${minimo}; disponível: ${carga}.`;
            atualizarStatusMunicaoCombate_();
            return;
        }
    }

    const valorBaseOriginal = obterValorRegistroPericia_(char, pericia.id, pericia.__especializacao);
    const armaduraAjuste = valorPericiaComArmadura_(char,pericia,valorBaseOriginal);
    const valorBase = armaduraAjuste.valor;
    const dificuldadeEscolhidaId = document.getElementById('combatDifficultySelect')?.value || 'padrao';
    const grausCompatibilidade = armaUsada ? penalidadeCompatibilidadeArma_(pericia, armaUsada) : 0;
    const ajuste = aplicarDificuldadeEFadiga_(char, valorBase, dificuldadeEscolhidaId, grausCompatibilidade);
    if (ajuste.bloqueado) {
        resumo.innerHTML = `⚠️ ${escaparHtmlInventario_(ajuste.regra.nome)}: nenhuma atividade possível.`;
        await registrarHistoricoCombate_(
            'D100',
            `${getNome(pericia)} bloqueado por fadiga (${ajuste.regra.nome}) · Dificuldade escolhida: ${ajuste.escolhida.nome}`,
            { subtipo: 'periciaCombate', periciaId: pericia.id, bloqueado: true, fadiga: ajuste.regra.nome, dificuldadeEscolhida: ajuste.escolhida.nome }
        );
        resetarDificuldadeAposRolagem_('combatDifficultySelect');
        return;
    }
    const valor = ajuste.valor;
    const roll = Math.floor(Math.random()*100)+1;
    const r = classificarD100_(valor, roll);
    const margem = Math.abs(valor-roll);
    const nomePericia = getNome(pericia);
    const fadigaTxt = ajuste.degrausFadiga > 0 ? ` · Fadiga +${ajuste.degrausFadiga} degrau${ajuste.degrausFadiga > 1 ? 's' : ''}` : '';
    const compatTxt = grausCompatibilidade > 0 ? ` · Compatibilidade de arma +${grausCompatibilidade} grau${grausCompatibilidade > 1 ? 's' : ''}` : '';
    const armTxt = armaduraAjuste.pct>0 ? ` · Armadura -${armaduraAjuste.pct.toFixed(armaduraAjuste.pct%1?1:0)}% (${valorBaseOriginal}→${valorBase})` : '';
    resumo.innerHTML = `<strong>${escaparHtmlInventario_(nomePericia)}</strong> · D100 <strong>${roll}</strong> / ${valor} → <strong>${r.grau}</strong> · Margem ${margem}<br><small>Dificuldade: ${escaparHtmlInventario_(ajuste.escolhida.nome)}${fadigaTxt}${compatTxt}${armTxt} → <strong>${escaparHtmlInventario_(ajuste.efetiva.nome)}</strong> · ${valorBase} → ${valor}</small>`;

    await registrarHistoricoCombate_(
        'D100',
        `${nomePericia}: ${roll} / ${valor} → ${r.grau} · Margem ${margem} · Dificuldade ${ajuste.escolhida.nome}${fadigaTxt}${compatTxt} → ${ajuste.efetiva.nome} (${valorBase}→${valor})`,
        { subtipo: 'periciaCombate', periciaId: pericia.id, rolagem: roll, valorBase, valorEfetivo: valor, grau: r.grau, margem, fadiga: ajuste.regra.nome, dificuldadeEscolhida: ajuste.escolhida.nome, dificuldadeEfetiva: ajuste.efetiva.nome, degrausFadiga: ajuste.degrausFadiga, penalidadeCompatibilidade: grausCompatibilidade, alvoId:alvoId||'' }
    );

    char.combate = char.combate || {};
    if(periciaEhOfensiva_(pericia)&&r.sucesso&&alvoId){
        char.combate.ataqueSolicitado={id:`atk_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,atacanteId:char.id,alvoId,grau:r.grau,rolagem:roll,valor,periciaId:pericia.id,equipamentoId:equip,penetracao:obterPenetracaoArma_(armaUsada),status:'novo',timestamp:new Date().toISOString()};
        await setDoc(doc(db,'personagens',char.id),{'combate.ataqueSolicitado':char.combate.ataqueSolicitado},{merge:true});
        resumo.innerHTML+='<br><small style="color:#ffd166;">⚔️ Ataque enviado. Aguardando reação do alvo.</small>';
    }
    char.combate.danoPendente = null;
    char.combate.ultimoTesteDano = {
        equipamentoId: equip,
        periciaId: pericia.id,
        grau: r.grau,
        sucesso: !!r.sucesso,
        consumido: false,
        timestamp: new Date().toISOString()
    };
    await setDoc(doc(db,'personagens',currentCharId),{'combate.ultimoTesteDano':char.combate.ultimoTesteDano,'combate.danoPendente':null},{merge:true});

    if (armaUsada && itemUsaMunicao_(armaUsada)) {
        if (itemUsaEnergia_(armaUsada)) {
            const consumo = consumirEnergiaDisparo_(armaUsada);
            await setDoc(doc(db,'personagens',currentCharId),{inventario:char.inventario},{merge:true});
            await registrarHistoricoCombate_(
                'Energia',
                `${getNome(armaUsada)} (${normalizarQualidade_(armaUsada.qualidade)}) gastou ${consumo.gasto} de energia · restante ${consumo.restante}/${cargaMaxArma_(armaUsada)}`,
                {subtipo:'energia',equipamento:getNome(armaUsada),qualidade:normalizarQualidade_(armaUsada.qualidade),gasto:consumo.gasto,restante:consumo.restante}
            );
        } else {
            const consumo = consumirMunicaoFisica_(armaUsada,1);
            await setDoc(doc(db,'personagens',currentCharId),{inventario:char.inventario},{merge:true});
            await registrarHistoricoCombate_(
                'Munição',
                `${getNome(armaUsada)} gastou 1 ${armaUsada.municao || 'munição'} · restante ${consumo.restante}/${cargaMaxArma_(armaUsada)}`,
                {subtipo:'municao',equipamento:getNome(armaUsada),gasto:1,restante:consumo.restante}
            );
        }
        renderizarInventario(char);
        atualizarStatusMunicaoCombate_();
    }

    resetarDificuldadeAposRolagem_('combatDifficultySelect');

    let atual = Math.max(0, Number(char.combate.pontosAcaoAtuais ?? paInfo.max) - 1);
    char.combate.pontosAcaoAtuais = atual;
    await setDoc(doc(db, 'personagens', currentCharId), { 'combate.pontosAcaoAtuais': atual }, { merge: true });
    atualizarVisualPontosAcao_(char);


};

function rolarExpressaoDanoCombate_(expressao) {
    const tokens = String(expressao || '').match(/[+-]?[^+-]+/g) || [];
    let total = 0;
    const detalhes = [];
    const efeitos = [];
    tokens.forEach(token => {
        token = token.trim();
        let sinal = 1;
        if (token.startsWith('-')) { sinal = -1; token = token.slice(1).trim(); }
        else if (token.startsWith('+')) token = token.slice(1).trim();
        const dado = token.match(/^(\d*)d(\d+)$/i);
        if (dado) {
            const qtd = parseInt(dado[1]) || 1, faces = parseInt(dado[2]);
            const rolls = Array.from({length:qtd},()=>Math.floor(Math.random()*faces)+1);
            const soma = rolls.reduce((a,b)=>a+b,0) * sinal;
            total += soma;
            detalhes.push(`${sinal < 0 ? '-' : ''}${qtd}d${faces} [${rolls.join(', ')}]`);
            return;
        }
        if (/^\d+$/.test(token)) {
            total += sinal * parseInt(token);
            detalhes.push(`${sinal < 0 ? '-' : '+'}${token}`);
            return;
        }
        if (token) efeitos.push(token);
    });
    return {total:Math.max(0,total), bruto:total, detalhes, efeitos};
}

function maximizarExpressaoDanoCombate_(expressao) {
    const tokens = String(expressao || '').match(/[+-]?[^+-]+/g) || [];
    let total = 0;
    const detalhes = [];
    const efeitos = [];
    tokens.forEach(token => {
        token = token.trim();
        let sinal = 1;
        if (token.startsWith('-')) { sinal=-1; token=token.slice(1).trim(); }
        else if (token.startsWith('+')) token=token.slice(1).trim();
        const dado = token.match(/^(\d*)d(\d+)$/i);
        if (dado) {
            const qtd=parseInt(dado[1])||1, faces=parseInt(dado[2]);
            // Para obter o maior dano total possível: dados positivos no máximo; penalidades negativas no mínimo.
            const valorCada = sinal > 0 ? faces : 1;
            const soma = qtd*valorCada*sinal;
            total += soma;
            detalhes.push(`${sinal<0?'-':''}${qtd}d${faces} [${Array(qtd).fill(valorCada).join(', ')}] MÁX`);
            return;
        }
        if (/^\d+$/.test(token)) { total += sinal*parseInt(token); detalhes.push(`${sinal<0?'-':'+'}${token}`); return; }
        if (token) efeitos.push(token);
    });
    return {total:Math.max(0,total), bruto:total, detalhes, efeitos, critico:true};
}

window.rolarDanoCombate = async () => {
    const resumo = document.getElementById('combatRollSummary');
    const expr = obterExpressaoDanoCombate_();
    if (!resumo) return;
    if (!expr) {
        resumo.innerHTML = 'ℹ️ A ação/equipamento selecionado não possui dano.';
        return;
    }

    const char = userCharacters.find(c=>c.id===currentCharId);
    const equipValor = document.getElementById('combatWeaponSelect')?.value || '';
    const item = encontrarEquipamentoCombate_(equipValor);
    const nomeEquip = equipValor === 'desarmado' ? 'Punhos' : (item ? getNome(item) : 'Dano');
    const ultimo = char?.combate?.ultimoTesteDano;
    const critico = !!ultimo && ultimo.grau === 'Crítico' && !ultimo.consumido && String(ultimo.equipamentoId || '') === String(equipValor || '');

    const r = critico ? maximizarExpressaoDanoCombate_(expr) : rolarExpressaoDanoCombate_(expr);
    if (critico) somCriticoArma_(item,nomeEquip); else tocarSomDano_(item,nomeEquip);

    if (ultimo && !ultimo.consumido) {
        ultimo.consumido = true;
        char.combate.ultimoTesteDano = ultimo;
        await setDoc(doc(db,'personagens',currentCharId),{'combate.ultimoTesteDano':ultimo},{merge:true});
    }

    const seloCritico = critico ? ' 💥 <strong>CRÍTICO: dano máximo!</strong>' : '';
    resumo.innerHTML = `<strong>Dano ${escaparHtmlInventario_(expr)}</strong> → <strong>${r.total}</strong>${seloCritico}${r.detalhes.length ? `<br><small>${escaparHtmlInventario_(r.detalhes.join(' · '))}</small>` : ''}${r.efeitos.length ? `<br><small>Efeito: ${escaparHtmlInventario_(r.efeitos.join(', '))}</small>` : ''}`;
    const detalhesTexto = r.detalhes.length ? ` · ${r.detalhes.join(' · ')}` : '';
    const efeitosTexto = r.efeitos.length ? ` · Efeito: ${r.efeitos.join(', ')}` : '';
    await registrarHistoricoCombate_(
        'Dano',
        `${nomeEquip}: ${expr} → ${r.total}${critico ? ' · CRÍTICO: dano máximo' : ''}${detalhesTexto}${efeitosTexto}`,
        { subtipo:'dano', equipamento:nomeEquip, expressao:expr, total:r.total, critico, detalhes:r.detalhes, efeitos:r.efeitos }
    );
};

window.rolarLocalizacaoCombate = async () => {
    somDado_();
    const roll = Math.floor(Math.random()*20)+1;
    let local;
    if (roll <= 3) local = 'Perna Direita';
    else if (roll <= 6) local = 'Perna Esquerda';
    else if (roll <= 9) local = 'Abdômen';
    else if (roll <= 12) local = 'Peito';
    else if (roll <= 15) local = 'Braço Direito';
    else if (roll <= 18) local = 'Braço Esquerdo';
    else local = 'Cabeça';
    const resumo = document.getElementById('combatRollSummary');
    if (resumo) resumo.innerHTML = `🎯 D20 <strong>${roll}</strong> → <strong>${local}</strong>`;
    await registrarHistoricoCombate_(
        'Localização',
        `D20 ${roll} → ${local}`,
        { subtipo: 'localizacao', rolagem: roll, local }
    );
};

window.rolarIniciativaCombate = async () => {
    somDado_();
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const regra = obterRegraFadiga_(char);
    const resumo = document.getElementById('combatRollSummary');
    if (regra.iniciativa === null) {
        if (resumo) resumo.innerHTML = `⚠️ ${escaparHtmlInventario_(regra.nome)}: nenhuma atividade possível.`;
        return;
    }
    const intTotal = (char.atributos?.INT || 10) + (char.bonus?.INT || 0);
    const desTotal = (char.atributos?.DES || 10) + (char.bonus?.DES || 0);
    const iniciativaBase = Math.ceil((intTotal + desTotal) / 2);
    const penalidade = regra.iniciativa || 0;
    const iniciativaEfetiva = Math.max(0, iniciativaBase + penalidade);
    const dado = Math.floor(Math.random()*10)+1;
    const total = iniciativaEfetiva + dado;
    char.combate = char.combate || {};
    char.combate.ultimaIniciativa = {
        total,dado,iniciativaBase,penalidadeFadiga:penalidade,iniciativaEfetiva,
        timestamp:new Date().toISOString()
    };
    await setDoc(doc(db,'personagens',currentCharId),{combate:char.combate},{merge:true});
    const fadigaTxt = penalidade ? ` (${penalidade} por fadiga)` : '';
    if (resumo) resumo.innerHTML = `⚡ Iniciativa: 1d10 [<strong>${dado}</strong>] + ${iniciativaEfetiva}${fadigaTxt} = <strong>${total}</strong>`;
    await registrarHistoricoCombate_(
        'Iniciativa',
        `1d10 [${dado}] + ${iniciativaEfetiva}${fadigaTxt} = ${total}`,
        { subtipo: 'iniciativa', dado, iniciativaBase, penalidadeFadiga:penalidade, iniciativaEfetiva, total }
    );
};

function obterPericiasTesteGeral_(char) {
    const basicas = periciasDB.filter(p => p.tipo === 'Básica');
    const prof = periciasDB.filter(p => p.tipo !== 'Básica' && totalTreinoPericia_((char.pericias || {})[p.id] || {}) > 0);
    const esp = especializacoesDB.filter(e => totalTreinoPericia_((char.especializacoes || {})[e.id] || {}) > 0);
    return [
        ...basicas.map(x => ({...x,__especializacao:false})),
        ...prof.map(x => ({...x,__especializacao:false})),
        ...esp.map(x => ({...x,__especializacao:true}))
    ];
}

window.atualizarListaPericias = () => {
    const char = userCharacters.find(c => c.id === currentCharId);
    const select = document.getElementById('skillSelect');
    if (!char || !select) return;
    const anterior = select.value;
    const lista = obterPericiasTesteGeral_(char);
    select.innerHTML = lista.map(p => `<option value="${p.__especializacao ? 'esp:' : 'per:'}${escaparHtmlInventario_(p.id)}">${escaparHtmlInventario_(getNome(p))}</option>`).join('');
    if ([...select.options].some(o => o.value === anterior)) select.value = anterior;
    mostrarValorPericia();
};

window.mostrarValorPericia = () => {
    const char = userCharacters.find(c => c.id === currentCharId);
    const select = document.getElementById('skillSelect');
    const alvo = document.getElementById('skillValue');
    if (!char || !select || !alvo || !select.value) { if (alvo) alvo.textContent = '—'; return; }
    const [tipo,id] = select.value.split(':');
    alvo.textContent = obterValorRegistroPericia_(char,id,tipo === 'esp');
};


const REGRAS_FADIGA = {
    'Fresh': {
        nome: 'Descansado', grau: 'Padrão', multiplicador: 1,
        movimento: 'Sem penalidades', iniciativa: 0, pa: 0, recuperacao: '—',
        descricao: 'Sem penalidades.'
    },
    'Winded': {
        nome: 'Ofegante', grau: 'Difícil', multiplicador: 2/3,
        movimento: 'Sem penalidade', iniciativa: 0, pa: 0, recuperacao: '15 minutos',
        descricao: 'Todos os testes de perícia passam para grau Difícil.'
    },
    'Tired': {
        nome: 'Cansado', grau: 'Difícil', multiplicador: 2/3,
        movimento: '-1 metro', iniciativa: 0, pa: 0, recuperacao: '3 horas',
        descricao: 'Testes em grau Difícil e movimento reduzido em 1 metro.'
    },
    'Wearied': {
        nome: 'Fatigado', grau: 'Formidável', multiplicador: 1/2,
        movimento: '-2 metros', iniciativa: -2, pa: 0, recuperacao: '6 horas',
        descricao: 'Testes em grau Formidável, movimento -2 m e Iniciativa -2.'
    },
    'Exhausted': {
        nome: 'Exausto', grau: 'Formidável', multiplicador: 1/2,
        movimento: 'Metade', iniciativa: -4, pa: -1, recuperacao: '12 horas',
        descricao: 'Testes em grau Formidável, movimento pela metade, Iniciativa -4 e -1 Ponto de Ação.'
    },
    'Debilitated': {
        nome: 'Debilitado', grau: 'Hercúleo', multiplicador: 1/10,
        movimento: 'Metade', iniciativa: -6, pa: -2, recuperacao: '18 horas',
        descricao: 'Testes em grau Hercúleo, movimento pela metade, Iniciativa -6 e -2 Ações.'
    },
    'Incapacitated': {
        nome: 'Incapacitado', grau: 'Hercúleo', multiplicador: 1/10,
        movimento: 'Imóvel', iniciativa: -8, pa: -3, recuperacao: '24 horas',
        descricao: 'Testes em grau Hercúleo, personagem imóvel, Iniciativa -8 e -3 Ações.'
    },
    'Semi-Conscious': {
        nome: 'Semiconsciente', grau: 'Sem esperança', multiplicador: 0,
        movimento: 'Nenhuma atividade possível', iniciativa: null, pa: null, recuperacao: '36 horas',
        descricao: 'Nenhuma atividade é possível.'
    },
    'Comatose': {
        nome: 'Comatoso', grau: 'Nenhuma atividade', multiplicador: 0,
        movimento: 'Nenhuma atividade possível', iniciativa: null, pa: null, recuperacao: '48 horas',
        descricao: 'Nenhuma atividade é possível.'
    },
    'Dead': {
        nome: 'Morto', grau: 'Morto', multiplicador: 0,
        movimento: '—', iniciativa: null, pa: null, recuperacao: 'Nunca',
        descricao: 'O personagem está morto.'
    }
};

function obterRegraFadiga_(char) {
    const nivel = char?.combate?.fadiga || 'Fresh';
    return REGRAS_FADIGA[nivel] || REGRAS_FADIGA.Fresh;
}

const GRAUS_DIFICULDADE = [
    { id: 'muito_facil', nome: 'Muito Fácil', multiplicador: 2 },
    { id: 'facil', nome: 'Fácil', multiplicador: 1.5 },
    { id: 'padrao', nome: 'Padrão', multiplicador: 1 },
    { id: 'dificil', nome: 'Difícil', multiplicador: 2/3 },
    { id: 'formidavel', nome: 'Formidável', multiplicador: 1/2 },
    { id: 'herculeo', nome: 'Hercúleo', multiplicador: 1/10 }
];

function obterDegrausFadiga_(char) {
    const nivel = char?.combate?.fadiga || 'Fresh';
    const mapa = {
        Fresh: 0,
        Winded: 1,
        Tired: 1,
        Wearied: 2,
        Exhausted: 2,
        Debilitated: 3,
        Incapacitated: 3
    };
    return mapa[nivel] ?? 99;
}

function obterGrauDificuldade_(id) {
    return GRAUS_DIFICULDADE.find(g => g.id === id) || GRAUS_DIFICULDADE[2];
}

function indiceMinimoDificuldadeFadiga_(char) {
    const nivel = char?.combate?.fadiga || 'Fresh';
    const mapa = {
        Fresh: 0,          // sem mínimo
        Winded: 3,        // Difícil
        Tired: 3,         // Difícil
        Wearied: 4,       // Formidável
        Exhausted: 4,     // Formidável
        Debilitated: 5,   // Hercúleo
        Incapacitated: 5  // Hercúleo
    };
    return mapa[nivel] ?? 99;
}

function dificuldadePermitidaPelaFadiga_(char,dificuldadeId) {
    const min = indiceMinimoDificuldadeFadiga_(char);
    const ix = GRAUS_DIFICULDADE.findIndex(g=>g.id===dificuldadeId);
    return min < GRAUS_DIFICULDADE.length && ix >= min;
}

function aplicarDificuldadeEFadiga_(char, valorBase, dificuldadeId, degrausExtras = 0) {
    const regra = obterRegraFadiga_(char);
    if (!regra.multiplicador) {
        return { valor: 0, bloqueado: true, regra, escolhida: obterGrauDificuldade_(dificuldadeId), efetiva: null, degrausFadiga: 99 };
    }
    const escolhida = obterGrauDificuldade_(dificuldadeId);
    const indiceEscolhido = GRAUS_DIFICULDADE.findIndex(g => g.id === escolhida.id);
    const indiceFadiga = indiceMinimoDificuldadeFadiga_(char);
    const modMestre=parseInt(char?.modDificuldadeMestre)||0;
    const extrasBase = parseInt(degrausExtras)||0;

    // Fadiga estabelece o piso de dificuldade; incompatibilidade da arma agrava depois.
    const indiceBase = Math.max(indiceEscolhido, Math.min(indiceFadiga,GRAUS_DIFICULDADE.length-1));
    const indiceEfetivo = Math.max(0,Math.min(GRAUS_DIFICULDADE.length - 1, indiceBase + extrasBase + modMestre));
    const efetiva = GRAUS_DIFICULDADE[indiceEfetivo];
    const valor = Math.max(1, Math.floor((parseInt(valorBase) || 0) * efetiva.multiplicador));
    return {
        valor, bloqueado:false, regra, escolhida, efetiva,
        degrausFadiga:Math.max(0,indiceBase-indiceEscolhido),
        degrausExtras:extrasBase,
        modificadorMestre:modMestre,
        dificuldadeMinimaFadiga:GRAUS_DIFICULDADE[Math.min(indiceFadiga,GRAUS_DIFICULDADE.length-1)]?.id||'herculeo'
    };
}

function resetarDificuldadeAposRolagem_(idSelect) {
    const select = document.getElementById(idSelect);
    if (select) select.value = 'padrao';
}

function obterPAMaxCombate_(char) {
    const regra = obterRegraFadiga_(char);
    if (regra.pa === null) return 0;
    // Criaturas e NPCs podem declarar diretamente quantas ações possuem.
    // O campo antigo acoesMaxEspecial continua sendo aceito como fallback.
    if(Number(char?.acoesMax)>0){
        return Math.max(0,Number(char.acoesMax)+(regra.pa||0));
    }
    if(Number(char?.acoes)>0){
        return Math.max(0,Number(char.acoes)+(regra.pa||0));
    }
    if(Number(char?.acoesMaxEspecial||0)>0){
        return Math.max(0,Number(char.acoesMaxEspecial)+(regra.pa||0));
    }
    const attrs = char?.atributos || {};
    const bonus = char?.bonus || {};
    const base = calcularPA((attrs.INT || 10) + (bonus.INT || 0), (attrs.DES || 10) + (bonus.DES || 0));
    return Math.max(0, base + (regra.pa || 0));
}

function garantirPontosAcaoCombate_(char) {
    if (!char.combate) char.combate = {};
    const max = obterPAMaxCombate_(char);
    let atual = Number(char.combate.pontosAcaoAtuais);
    if (!Number.isFinite(atual) || atual < 0 || atual > max) atual = max;
    char.combate.pontosAcaoAtuais = atual;
    return { atual, max };
}

function atualizarVisualFadiga_(char) {
    const alvo = document.getElementById('fadigaDescricao');
    if (!alvo) return;
    const r = obterRegraFadiga_(char);
    const nivel = char?.combate?.fadiga || 'Fresh';
    const iniciativa = r.iniciativa === null ? tr_('noActivity') : (r.iniciativa === 0 ? tr_('noPenalty') : `${r.iniciativa}`);
    const pa = r.pa === null ? tr_('noActivity') : (r.pa === 0 ? tr_('noPenalty') : `${r.pa}`);
    alvo.innerHTML = `
        <strong style="color:#ffd166;">${escaparHtmlInventario_(traduzirNomeFadiga_(nivel))}</strong><br>
        <span><strong>${tr_('testsLabel')}</strong> ${escaparHtmlInventario_(traduzirDificuldadeNome_(r.grau))}</span><br>
        <span><strong>${tr_('movementLabel')}</strong> ${escaparHtmlInventario_(traduzirMovimentoFadiga_(r.movimento))}</span><br>
        <span><strong>${tr_('initiativeLabel')}</strong> ${escaparHtmlInventario_(iniciativa)}</span><br>
        <span><strong>${tr_('actionPointsLabel')}</strong> ${escaparHtmlInventario_(pa)}</span><br>
        <span><strong>${tr_('recoveryLabel')}</strong> ${escaparHtmlInventario_(traduzirRecuperacaoFadiga_(r.recuperacao))}</span>
    `;
}

function atualizarVisualPontosAcao_(char) {
    const alvo = document.getElementById('combatActionPoints');
    if (!alvo) return;
    const { atual, max } = garantirPontosAcaoCombate_(char);
    alvo.textContent = `${atual} / ${max}`;
}


function modoCombateAtual_() {
    return configuracoes?.modoCombate === 'simplificado' ? 'simplificado' : 'tatico';
}

function calcularPVGlobalMax_(char) {
    const a = char?.atributos || {};
    const b = char?.bonus || {};
    const con = Number(a.CON || 10) + Number(b.CON || 0);
    const tam = Number(a.TAM || 10) + Number(b.TAM || 0);
    return Math.max(1, Math.ceil((con + tam) / 2));
}

function calcularPAGlobalEquipado_(char) {
    const locais = ['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda'];
    const pa = calcularPAEquipado_(char, locais);
    // Média ponderada das regiões. Evita que apenas um capacete proteja o corpo inteiro,
    // mas permite que armaduras de torso tenham impacto relevante no modo simplificado.
    const pesos = {
        'Cabeça':0.10, 'Peito':0.25, 'Abdômen':0.20,
        'Braço Direito':0.10, 'Braço Esquerdo':0.10,
        'Perna Direita':0.125, 'Perna Esquerda':0.125
    };
    const media = locais.reduce((acc,loc)=>acc + Number(pa[loc] || 0) * pesos[loc], 0);
    return Math.max(0, Math.round(media));
}

function renderizarCombateSimplificado_(char) {
    const combat = char.combate || {};
    if (!char.combate) char.combate = combat;

    const pvMax = calcularPVGlobalMax_(char);
    if (!Number.isFinite(Number(combat.pvGlobalAtual))) combat.pvGlobalAtual = pvMax;
    combat.pvGlobalAtual = Math.max(0, Math.min(pvMax, Number(combat.pvGlobalAtual)));

    const paEquip = calcularPAGlobalEquipado_(char);
    const paManual = Math.max(0, Number(combat.armorGlobalManual || 0));
    const paTotal = paManual + paEquip;

    const hpTitle = idiomaAtual === 'en' ? 'General Hit Points' : idiomaAtual === 'zh' ? '总生命值' : 'Pontos de Vida Gerais';
    const apTitle = idiomaAtual === 'en' ? 'General Armor (AP)' : idiomaAtual === 'zh' ? '总护甲（AP）' : 'Armadura Geral (PA)';
    const maxTxt = idiomaAtual === 'en' ? 'Max' : idiomaAtual === 'zh' ? '最大' : 'Máx';
    const curTxt = idiomaAtual === 'en' ? 'Current' : idiomaAtual === 'zh' ? '当前' : 'Atual';

    document.getElementById('hitLocations').innerHTML = `
        <div style="padding:14px;background:rgba(0,0,0,.18);border-radius:10px;">
            <div style="color:#00d4ff;font-weight:700;margin-bottom:10px;">${hpTitle}</div>
            <div style="display:grid;grid-template-columns:1fr 110px 110px;gap:10px;align-items:center;">
                <strong>${hpTitle}</strong>
                <div><small style="color:#aaa;">${maxTxt}</small><input type="number" value="${pvMax}" readonly style="margin-top:4px;"></div>
                <div><small style="color:#aaa;">${curTxt}</small><input type="number" value="${combat.pvGlobalAtual}" class="damage" min="0" max="${pvMax}" onchange="salvarPVGlobal(this.value)" style="margin-top:4px;"></div>
            </div>
        </div>`;

    document.getElementById('armorLocations').innerHTML = `
        <div style="padding:14px;background:rgba(0,0,0,.18);border-radius:10px;">
            <div style="color:#00d4ff;font-weight:700;margin-bottom:10px;">${apTitle}</div>
            <div style="display:grid;grid-template-columns:1fr 130px;gap:10px;align-items:center;">
                <strong>${apTitle}</strong>
                <input type="number" value="${paTotal}" min="0" title="${paManual} manual + ${paEquip} equipamento" onchange="salvarPAGlobal(this.value, ${paEquip})">
            </div>
            <small style="display:block;color:#888;margin-top:8px;">${idiomaAtual==='en' ? `Equipment contribution: ${paEquip}` : idiomaAtual==='zh' ? `装备贡献：${paEquip}` : `Contribuição do equipamento: ${paEquip}`}</small>
        </div>`;

    const hpHeader = document.querySelector('#char-combate .combat-grid .combat-section:nth-child(1) .combat-title-row');
    const armorHeader = document.querySelector('#char-combate .combat-grid .combat-section:nth-child(2) .combat-title-row');
    if (hpHeader) hpHeader.style.display = 'none';
    if (armorHeader) armorHeader.style.display = 'none';

    const armorPenaltyInfo = document.getElementById('armorPenaltyInfo');
    if (armorPenaltyInfo) {
        const referenciaCombate={id:'__resumo_armadura__',nome:'Combate',categoria:'Combate',__especializacao:true,penalidadeArmadura:1};
        const pctCombate=penalidadeArmaduraTotal_(char,referenciaCombate);
        armorPenaltyInfo.innerHTML = pctCombate>0
            ? `<strong>Penalidade de armadura:</strong> −${pctCombate.toFixed(pctCombate%1?1:0)}% em testes de combate afetados pela armadura.`
            : `<strong>Penalidade de armadura:</strong> nenhuma.`;
    }

    document.getElementById('fadigaLevel').value = combat.fadiga || 'Fresh';
    document.getElementById('fadigaLevel').disabled = userData?.role!=='mestre';
    renderizarResumoFerimentos_(char);
    atualizarVisualFadiga_(char);
    atualizarVisualPontosAcao_(char);
    popularEquipamentosCombate_(char);
    renderizarHistoricoCombate_(char);
}

window.salvarPVGlobal = async (valor) => {
    if(userData?.role!=='mestre') return;
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    if (!char.combate) char.combate = {};
    const max = calcularPVGlobalMax_(char);
    char.combate.pvGlobalAtual = Math.max(0, Math.min(max, parseInt(valor) || 0));
    await setDoc(doc(db,'personagens',currentCharId), { combate:char.combate }, { merge:true });
    somSalvar_();
};

window.salvarPAGlobal = async (valorTotal, paEquipamento) => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    if (!char.combate) char.combate = {};
    char.combate.armorGlobalManual = Math.max(0, (parseInt(valorTotal) || 0) - (parseInt(paEquipamento) || 0));
    await setDoc(doc(db,'personagens',currentCharId), { combate:char.combate }, { merge:true });
    renderizarCombate(char);
};


function renderizarResumoFerimentos_(char){
    const el=document.getElementById('combatWoundInfo');if(!el)return;
    const f=char?.combate?.ferimentos||{},rows=[];
    for(const [loc,d] of Object.entries(f)){
        const tags=[];
        if(d?.grave)tags.push('FERIMENTO GRAVE'); else if(d?.serio)tags.push('Ferimento Sério');
        if(d?.inutil)tags.push('localização inutilizada');
        if(d?.stunTurnos)tags.push(`choque: ${d.stunTurnos} turno(s)`);
        if(tags.length)rows.push(`<tr><td>${escaparHtmlInventario_(loc)}</td><td>${tags.join(' · ')}</td></tr>`);
    }
    if(char?.combate?.sangramentoAtivo)rows.push('<tr><td>Geral</td><td>🩸 Sangramento ativo: -1 nível de Fadiga por rodada.</td></tr>');
    if(char?.combate?.inconsciente)rows.push('<tr><td>Estado</td><td>💤 Inconsciente</td></tr>');
    if(char?.combate?.incapacitado)rows.push('<tr><td>Estado</td><td>⛔ Incapacitado</td></tr>');
    el.innerHTML=rows.length?`<div style="margin-top:14px;padding:12px;border:1px solid rgba(255,100,100,.25);border-radius:10px;"><strong>🩸 Ferimentos e efeitos ativos</strong><table style="width:100%;margin-top:8px;">${rows.join('')}</table></div>`:'';
}
function renderizarCombate(char) {
    if (modoCombateAtual_() === 'simplificado') {
        renderizarCombateSimplificado_(char);
        return;
    }

    const hpHeader = document.querySelector('#char-combate .combat-grid .combat-section:nth-child(1) .combat-title-row');
    const armorHeader = document.querySelector('#char-combate .combat-grid .combat-section:nth-child(2) .combat-title-row');
    if (hpHeader) hpHeader.style.display = '';
    if (armorHeader) armorHeader.style.display = '';

    const attrs = char.atributos || {};
    const bonus = char.bonus || {};
    const conTotal = (attrs.CON || 10) + (bonus.CON || 0);
    const tamTotal = (attrs.TAM || 10) + (bonus.TAM || 0);
    const soma = conTotal + tamTotal;

    const colunaPV = soma <= 5 ? 0 : soma <= 10 ? 1 : soma <= 15 ? 2 : soma <= 20 ? 3 : soma <= 25 ? 4 : soma <= 30 ? 5 : soma <= 35 ? 6 : 7;
    const incrementoPV = soma > 40 ? Math.ceil((soma - 40) / 5) : 0;
    const tabelaPV = {
        perna:[1,2,3,4,5,6,7,8],
        abdomen:[2,3,4,5,6,7,8,9],
        peito:[3,4,5,6,7,8,9,10],
        braco:[1,1,2,3,4,5,6,7],
        cabeca:[1,2,3,4,5,6,7,8]
    };
    const hitLocations = {
        'Cabeça': tabelaPV.cabeca[colunaPV] + incrementoPV,
        'Peito': tabelaPV.peito[colunaPV] + incrementoPV,
        'Abdômen': tabelaPV.abdomen[colunaPV] + incrementoPV,
        'Braço Direito': tabelaPV.braco[colunaPV] + incrementoPV,
        'Braço Esquerdo': tabelaPV.braco[colunaPV] + incrementoPV,
        'Perna Direita': tabelaPV.perna[colunaPV] + incrementoPV,
        'Perna Esquerda': tabelaPV.perna[colunaPV] + incrementoPV
    };

    const combat = char.combate || { hitLocations: {}, armor: {}, fadiga: 'Fresh' };
    const locais = Object.keys(hitLocations);
    const paEquipado = calcularPAEquipado_(char, locais);

    document.getElementById('hitLocations').innerHTML = Object.entries(hitLocations).map(([loc, pv]) => {
        const temAtual = Object.prototype.hasOwnProperty.call(combat.hitLocations || {}, loc);
        const pvAtual = temAtual ? combat.hitLocations[loc] : pv;
        return `<div class="hit-location">
            <span class="hit-location-name">${traduzirLocalCorpo_(loc)}</span>
            <input type="number" value="${pv}" readonly>
            <input type="number" value="${pvAtual}" class="damage" ${userData?.role==='mestre'?`onchange="salvarCombate('hitLocations', '${loc}', this.value)"`:'readonly'}>
        </div>`;
    }).join('');

    document.getElementById('armorLocations').innerHTML = locais.map(loc => {
        const base = Number((combat.armor || {})[loc] || 0);
        const equipamento = Number(paEquipado[loc] || 0);
        const total = base + equipamento;
        const explicacao = equipamento > 0
            ? `PA total ${total} = ${base} natural/manual + ${equipamento} de equipamento`
            : `PA manual/natural: ${base}`;
        return `<div class="hit-location">
            <span class="hit-location-name">${traduzirLocalCorpo_(loc)}</span>
            <input type="number" value="${total}" min="0" title="${explicacao}" onchange="salvarPATotal('${loc}', this.value, ${equipamento})">
        </div>`;
    }).join('');

    const armorPenaltyInfo = document.getElementById('armorPenaltyInfo');
    if (armorPenaltyInfo) {
        const referenciaCombate={id:'__resumo_armadura__',nome:'Combate',categoria:'Combate',__especializacao:true,penalidadeArmadura:1};
        const pctCombate=penalidadeArmaduraTotal_(char,referenciaCombate);
        armorPenaltyInfo.innerHTML = pctCombate>0
            ? `<strong>Penalidade de armadura:</strong> −${pctCombate.toFixed(pctCombate%1?1:0)}% em testes de combate afetados pela armadura.`
            : `<strong>Penalidade de armadura:</strong> nenhuma.`;
    }

    document.getElementById('fadigaLevel').value = combat.fadiga || 'Fresh';
    document.getElementById('fadigaLevel').disabled = userData?.role!=='mestre';
    atualizarVisualFadiga_(char);
    atualizarVisualPontosAcao_(char);
    popularEquipamentosCombate_(char);
    renderizarHistoricoCombate_(char);
}

window.salvarPATotal = async (local, valorTotal, paEquipamento) => {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const combat = char.combate || { hitLocations: {}, armor: {}, fadiga: 'Fresh' };
    if (!combat.armor) combat.armor = {};
    combat.armor[local] = Math.max(0, (parseInt(valorTotal) || 0) - (parseInt(paEquipamento) || 0));
    char.combate = combat;
    await setDoc(doc(db, 'personagens', currentCharId), { combate: combat }, { merge: true });
    renderizarCombate(char);
};

function reconciliarFerimentosComPVManual_(char){
    if(!char)return;
    char.combate=char.combate||{};
    const combat=char.combate;
    const attrs=char.atributos||{},bonus=char.bonus||{};
    const maxLoc=calcularHitLocations_(
        Number(attrs.CON||10)+Number(bonus.CON||0),
        Number(attrs.TAM||10)+Number(bonus.TAM||0)
    );
    combat.hitLocations=combat.hitLocations||{};
    combat.ferimentos=combat.ferimentos||{};

    let existeGrave=false;
    let existeSerioCentral=false;
    let existeSerio=false;

    for(const [loc,max] of Object.entries(maxLoc)){
        const atual=Object.prototype.hasOwnProperty.call(combat.hitLocations,loc)
            ? Number(combat.hitLocations[loc])
            : Number(max||1);

        if(atual>0){
            delete combat.ferimentos[loc];
            continue;
        }

        const f=combat.ferimentos[loc]||{};
        f.serio=true;
        f.grave=atual<=-Number(max||1);
        if(!f.grave)delete f.resistenciaGrave;
        combat.ferimentos[loc]=f;

        existeSerio=true;
        if(f.grave)existeGrave=true;
        if(/Cabeça|Peito|Abdômen/.test(loc))existeSerioCentral=true;
    }

    if(!existeGrave){
        combat.incapacitado=false;
        combat.morto=false;
        if(combat.fadiga==='Dead')combat.fadiga='Fresh';
    }
    if(!existeSerioCentral && !existeGrave)combat.inconsciente=false;
    if(!existeSerio){
        combat.ataquesBloqueadosTurnos=0;
        combat.sangramentoAtivo=false;
        delete combat.sangramentoOrigem;
    }
}

window.salvarCombate = async (tipo, local, valor) => {
    if(userData?.role!=='mestre') return;
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;

    const combat = char.combate || { hitLocations: {}, armor: {}, fadiga: 'Fresh' };
    char.combate=combat;
    if (!combat[tipo]) combat[tipo] = {};
    combat[tipo][local] = parseInt(valor) || 0;

    if(tipo==='hitLocations')reconciliarFerimentosComPVManual_(char);

    await setDoc(doc(db, "personagens", currentCharId), { combate: combat }, { merge: true });

    const participante=batalhaParticipante_(currentCharId);
    if(participante && batalhaEstado_?.ativo){
        participante.acoesMax=batalhaAcoesMax_(char);
        if(!batalhaEstaInconsciente_(char) && Number(participante.acoesAtuais||0)<=0){
            participante.acoesAtuais=participante.acoesMax;
        }
        if(batalhaEhMestre_())await batalhaSalvarEstado_();
    }

    renderizarCombate(char);
    renderizarBatalhaCompartilhada_();
    somSalvar_();
};

window.salvarFadiga = async () => {
    if(userData?.role!=='mestre') return;
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const fadiga = document.getElementById('fadigaLevel').value;
    if (!char.combate) char.combate = {};
    char.combate.fadiga = fadiga;
    const max = obterPAMaxCombate_(char);
    const atual = Number(char.combate.pontosAcaoAtuais);
    char.combate.pontosAcaoAtuais = Number.isFinite(atual) ? Math.min(Math.max(0, atual), max) : max;
    await setDoc(doc(db, "personagens", currentCharId), { combate: char.combate }, { merge: true });
    atualizarVisualFadiga_(char);
    atualizarVisualPontosAcao_(char);
};


function renderizarHistoricoGeral_(char) {
    const alvo = document.getElementById('generalRollHistory');
    if (!alvo) return;
    const historico = Array.isArray(char?.historicoRolagensGerais) ? char.historicoRolagensGerais : [];
    if (!historico.length) {
        alvo.innerHTML = `<div style="color:#888;">${escaparHtmlInventario_(tr_('noRolls'))}</div>`;
        return;
    }
    alvo.innerHTML = historico.slice(0, 50).map(reg => {
        const hora = formatarHoraHistoricoCombate_(reg.timestamp);
        const tipo = escaparHtmlInventario_(traduzirTipoHistorico_(reg.tipo || 'Rolagem'));
        const texto = escaparHtmlInventario_(formatarRegistroHistorico_(reg, false));
        return `<div style="display:grid;grid-template-columns:82px 120px 1fr;gap:10px;align-items:start;padding:8px 10px;background:rgba(255,255,255,0.035);border-radius:7px;border:1px solid rgba(255,255,255,0.06);">
            <span style="color:#888;font-size:0.88em;white-space:nowrap;">${hora}</span>
            <strong style="color:#d8c7ff;font-size:0.9em;">${tipo}</strong>
            <span style="color:#ddd;line-height:1.35;">${texto}</span>
        </div>`;
    }).join('');
}

async function registrarHistoricoGeral_(tipo, texto, dados = {}) {
    if (!currentCharId) return;
    const char = userCharacters.find(c => c.id === currentCharId);
    if (!char) return;
    const registro = {
        id: `general_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tipo: String(tipo || 'Rolagem'),
        texto: String(texto || ''),
        timestamp: new Date().toISOString(),
        ...dados
    };
    const atual = Array.isArray(char.historicoRolagensGerais) ? char.historicoRolagensGerais : [];
    const novo = [registro, ...atual].slice(0, 50);
    char.historicoRolagensGerais = novo;
    renderizarHistoricoGeral_(char);
    try {
        await setDoc(doc(db, 'personagens', currentCharId), { historicoRolagensGerais: novo }, { merge: true });
        await registrarEventoMestreNoPersonagem_(char, tipo, texto, dados);
    } catch (erro) {
        console.error('Erro ao salvar histórico geral:', erro);
    }
}

window.salvarAnotacoes = async () => {
    if (!currentCharId) return;
    const anotacoes = document.getElementById('charAnotacoes').value;
    const eventos = document.getElementById('charEventos').value;
    await setDoc(doc(db, "personagens", currentCharId), { anotacoes, eventos }, { merge: true });
    somSalvar_();
    alert('Salvo!');
};

window.rolarDado = async (tipo) => {
    somDado_();
    const faces = parseInt(tipo.replace('d', ''));
    const resultado = Math.floor(Math.random() * faces) + 1;
    document.getElementById('diceDisplay').textContent = `🎲 ${resultado}`;
    document.getElementById('rollResult').textContent = `${tipo.toUpperCase()}: ${resultado}`;
    document.getElementById('rollResultBox').classList.remove('hidden');
    document.getElementById('rollResultText').innerHTML = `<strong>${tipo.toUpperCase()}:</strong> ${resultado}`;
    await registrarHistoricoGeral_('Dado', `${tipo.toUpperCase()} → ${resultado}`, { subtipo:'dadoLivre', dado:tipo.toUpperCase(), resultado });
};

window.rolarFormula = async () => {
    somDado_();
    const formula = document.getElementById('damageFormula').value || '1d100';
    const partes = formula.split('+').map(p => p.trim());
    let total = 0;
    let detalhes = [];
    partes.forEach(parte => {
        const match = parte.match(/(\d+)?d(\d+)/i);
        if (match) {
            const qtd = parseInt(match[1]) || 1;
            const faces = parseInt(match[2]);
            let soma = 0;
            const rolagens = [];
            for (let i = 0; i < qtd; i++) { const r = Math.floor(Math.random() * faces) + 1; soma += r; rolagens.push(r); }
            total += soma;
            detalhes.push(`${qtd}d${faces}: [${rolagens.join(', ')}] = ${soma}`);
        } else {
            const num = parseInt(parte);
            if (!isNaN(num)) { total += num; detalhes.push(`${num}`); }
        }
    });
    document.getElementById('diceDisplay').textContent = `🎲 ${total}`;
    document.getElementById('rollResult').textContent = `${formula} = ${total}`;
    document.getElementById('rollResultBox').classList.remove('hidden');
    document.getElementById('rollResultText').innerHTML = `<strong>${formula}</strong> = ${total}<br><small>${detalhes.join(' + ')}</small>`;
    await registrarHistoricoGeral_('Fórmula', `${formula} = ${total}${detalhes.length ? ` · ${detalhes.join(' + ')}` : ''}`, { subtipo:'formula', formula, total, detalhes });
};

window.rolarPericia = async () => {
    somDado_();
    const char = userCharacters.find(c => c.id === currentCharId);
    const select = document.getElementById('skillSelect');
    if (!char || !select?.value) return;
    const [tipo,id] = select.value.split(':');
    const banco = tipo === 'esp' ? especializacoesDB : periciasDB;
    const registro = banco.find(x => x.id === id);
    if (!registro) return;
    const valorBase = obterValorRegistroPericia_(char,id,tipo === 'esp');
    const dificuldadeEscolhidaId = document.getElementById('skillDifficultySelect')?.value || 'padrao';
    const ajuste = aplicarDificuldadeEFadiga_(char, valorBase, dificuldadeEscolhidaId);
    if (ajuste.bloqueado) {
        document.getElementById('rollResultText').innerHTML = `<strong>${escaparHtmlInventario_(getNome(registro))}</strong><br>⚠️ ${escaparHtmlInventario_(ajuste.regra.nome)}: nenhuma atividade possível.<br><small>Dificuldade escolhida: ${escaparHtmlInventario_(ajuste.escolhida.nome)}</small>`;
        document.getElementById('rollResultBox').classList.remove('hidden');
        await registrarHistoricoGeral_('Teste', `${getNome(registro)} bloqueado por fadiga (${ajuste.regra.nome}) · Dificuldade escolhida: ${ajuste.escolhida.nome}`, { subtipo:'pericia', periciaId:id, bloqueado:true, fadiga:ajuste.regra.nome, dificuldadeEscolhida:ajuste.escolhida.nome });
        resetarDificuldadeAposRolagem_('skillDifficultySelect');
        return;
    }
    const skillValue = ajuste.valor;
    const roll = Math.floor(Math.random() * 100) + 1;
    const r = classificarD100_(skillValue, roll);
    const margin = Math.abs(roll - skillValue);
    const fadigaTxt = ajuste.degrausFadiga > 0 ? ` + ${ajuste.degrausFadiga} degrau${ajuste.degrausFadiga > 1 ? 's' : ''} de fadiga` : '';
    document.getElementById('rollResultText').innerHTML = `
        <strong>${escaparHtmlInventario_(getNome(registro))}</strong><br>
        Valor: ${skillValue} | D100: ${roll}<br>
        <strong>${r.grau}</strong> | Margem: ${margin}<br>
        <small>Dificuldade: ${escaparHtmlInventario_(ajuste.escolhida.nome)}${escaparHtmlInventario_(fadigaTxt)} → <strong>${escaparHtmlInventario_(ajuste.efetiva.nome)}</strong> · ${valorBase} → ${skillValue}</small>
    `;
    document.getElementById('rollResultBox').classList.remove('hidden');
    await registrarHistoricoGeral_(
        'Teste',
        `${getNome(registro)}: ${roll} / ${skillValue} → ${r.grau} · Margem ${margin} · Dificuldade ${ajuste.escolhida.nome}${fadigaTxt} → ${ajuste.efetiva.nome} (${valorBase}→${skillValue})`,
        { subtipo:'pericia', periciaId:id, rolagem:roll, valorBase, valorEfetivo:skillValue, grau:r.grau, margem:margin, fadiga:ajuste.regra.nome, dificuldadeEscolhida:ajuste.escolhida.nome, dificuldadeEfetiva:ajuste.efetiva.nome, degrausFadiga:ajuste.degrausFadiga }
    );
    resetarDificuldadeAposRolagem_('skillDifficultySelect');
};

window.rolarDanoArma = () => {
    const weapon = document.getElementById('weaponSelect').value;
    let damageFormula = '1d3';
    
    if (weapon !== 'desarmado') {
        const armaObj = encontrarEquipamentoCombate_(weapon);
        if (armaObj?.dano) damageFormula = armaObj.dano;
    }
    
    const partes = damageFormula.split('+').map(p => p.trim());
    let total = 0;
    let detalhes = [];
    
    partes.forEach(parte => {
        const match = parte.match(/(\d+)?d(\d+)/i);
        if (match) {
            const qtd = parseInt(match[1]) || 1;
            const faces = parseInt(match[2]);
            let soma = 0;
            const rolagens = [];
            for (let i = 0; i < qtd; i++) {
                const r = Math.floor(Math.random() * faces) + 1;
                soma += r;
                rolagens.push(r);
            }
            total += soma;
            detalhes.push(`${qtd}d${faces}: [${rolagens.join(', ')}] = ${soma}`);
        }
    });
    
    document.getElementById('rollResultText').innerHTML = `
        <strong>Dano: ${damageFormula}</strong><br>
        ${detalhes.join(' + ')}<br>
        <strong>Total: ${total}</strong>
    `;
    document.getElementById('rollResultBox').classList.remove('hidden');
};

window.previewImagemPersonagem = () => {
    const input = document.getElementById('editCharImage');
    const preview = document.getElementById('editCharImagePreview');
    if (!input || !preview) return;
    const url = input.value.trim();
    preview.innerHTML = url ? `<img src="${url}" alt="Imagem do personagem" onerror="this.parentElement.innerHTML='<span>👤</span>'">` : '<span>👤</span>';
};

window.handleCharacterImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentUserUid) return;
    const charAtual=(userCharacters||[]).find(c=>c.id===currentCharId);
    if(charAtual&&fichaAprovadaV96_(charAtual)&&userData?.role!=='mestre'){event.target.value='';return notificar_('A ficha foi aprovada. Peça ao mestre para reabrir a edição antes de trocar a imagem.','aviso',5000);}
    const status = document.getElementById('charImageUploadStatus');
    try {
        if (status) status.textContent = 'Enviando imagem...';
        const storageRef = ref(storage, `personagens/${currentUserUid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        document.getElementById('editCharImage').value = url;
        previewImagemPersonagem();
        if (currentCharId) await setDoc(doc(db, 'personagens', currentCharId), { imagem: url }, { merge: true });
        if (status) status.textContent = 'Imagem enviada.';
    } catch (error) {
        console.error('Erro no upload da imagem do personagem:', error);
        if (status) status.textContent = 'Erro ao enviar imagem.';
        alert('Erro ao fazer upload da imagem do personagem.');
    }
};

window.salvarImagemPersonagemAtual_=async function(){
    const c=(userCharacters||[]).find(x=>x.id===currentCharId);if(!c)return;
    if(userData?.role!=='mestre'&&c.dono!==currentUserUid)return;
    if(fichaAprovadaV96_(c)&&userData?.role!=='mestre')return notificar_('A ficha foi aprovada. Peça ao mestre para reabrir a edição antes de trocar a imagem.','aviso',5000);
    const imagem=String(document.getElementById('editCharImage')?.value||'').trim()||null;
    try{await setDoc(doc(db,'personagens',c.id),{imagem},{merge:true});c.imagem=imagem;renderizarListaPersonagens();}
    catch(e){console.error(e);notificar_('Não foi possível salvar a imagem do personagem.','erro',4500);}
};

window.handleItemImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const storageRef = ref(storage, `itens/${currentUserUid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        uploadedItemImage = await getDownloadURL(snapshot.ref);
        document.getElementById('modalItemImg').value = uploadedItemImage;
    } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao fazer upload da imagem');
    }
};

function setupDragAndDrop() {
    document.querySelectorAll('.inventory-slot').forEach(slot => {
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.classList.add('drag-over');
        });
        
        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('drag-over');
        });
    });
}
