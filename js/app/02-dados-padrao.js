// ============================================
// DADOS PADRÃO (com tradução PT/EN/ZH)
// ============================================
const periciasPadrao = [
    { id: 'atletismo', nome: 'Atletismo', nome_en: 'Athletics', nome_zh: '运动', categoria: 'Física', tipo: 'Básica', formula: 'FOR+DES', especializavel: false, penalidadeArmadura: 1 },
    { id: 'navegacao_remo', nome: 'Navegação a Remo', disponivelCampanha: false, nome_en: 'Rowing', nome_zh: '划船', categoria: 'Veículos', tipo: 'Básica', formula: 'FOR+CON', especializavel: false, penalidadeArmadura: 1 },
    { id: 'forca_bruta', nome: 'Força Bruta', nome_en: 'Brute Force', nome_zh: '蛮力', categoria: 'Física', tipo: 'Básica', formula: 'FOR+TAM', especializavel: false, penalidadeArmadura: 1 },
    { id: 'ocultar_itens', nome: 'Ocultar Itens', nome_en: 'Hide Items', nome_zh: '隐藏物品', categoria: 'Furtividade', tipo: 'Básica', formula: 'DES*2', especializavel: false, penalidadeArmadura: 0.5 },
    { id: 'costumes', nome: 'Tradição', nome_en: 'Tradition', nome_zh: '传统', categoria: 'Conhecimento', tipo: 'Básica', formula: 'INT*2+40', especializavel: true, penalidadeArmadura: 0 },
    { id: 'danca', nome: 'Dança', nome_en: 'Dance', nome_zh: '舞蹈', categoria: 'Social', tipo: 'Básica', formula: 'DES+CAR', especializavel: true, penalidadeArmadura: 0.5 },
    { id: 'dissimulacao', nome: 'Enganação', nome_en: 'Deception', nome_zh: '欺骗', categoria: 'Social', tipo: 'Básica', formula: 'INT+CAR', especializavel: true, penalidadeArmadura: 0.5 },
    { id: 'conduzir', nome: 'Condução de Veículos', nome_en: 'Vehicle Operation', nome_zh: '车辆驾驶', categoria: 'Veículos', tipo: 'Básica', formula: 'DES+INT', especializavel: true, penalidadeArmadura: 0.5 },
    { id: 'resistencia', nome: 'Resistência', nome_en: 'Endurance', nome_zh: '耐力', categoria: 'Sobrevivência', tipo: 'Básica', formula: 'CON*2', especializavel: false, penalidadeArmadura: 1 },
    { id: 'esquiva', nome: 'Esquiva', nome_en: 'Dodge', nome_zh: '闪避', categoria: 'Combate', tipo: 'Básica', formula: 'DES*2', especializavel: false, penalidadeArmadura: 1 },
    { id: 'primeiros_socorros', nome: 'Primeiros Socorros', nome_en: 'First Aid', nome_zh: '急救', categoria: 'Técnica', tipo: 'Básica', formula: 'INT+DES', especializavel: true, penalidadeArmadura: 0.5 },
    { id: 'influencia', nome: 'Influência', nome_en: 'Influence', nome_zh: '影响力', categoria: 'Social', tipo: 'Básica', formula: 'CAR*2', especializavel: true, penalidadeArmadura: 0 },
    { id: 'intuicao', nome: 'Intuição', nome_en: 'Intuition', nome_zh: '直觉', categoria: 'Percepção', tipo: 'Básica', formula: 'INT+POD', especializavel: false, penalidadeArmadura: 0 },
    { id: 'regiao', nome: 'Região', nome_en: 'Region', nome_zh: '地区', categoria: 'Conhecimento', tipo: 'Básica', formula: 'INT*2', especializavel: true, penalidadeArmadura: 0 },
    { id: 'lingua_nativa', nome: 'Língua Nativa', nome_en: 'Native Language', nome_zh: '母语', categoria: 'Conhecimento', tipo: 'Básica', formula: 'INT+CAR+40', especializavel: true, penalidadeArmadura: 0 },
    { id: 'percepcao', nome: 'Percepção', nome_en: 'Perception', nome_zh: '感知', categoria: 'Percepção', tipo: 'Básica', formula: 'INT+POD', especializavel: false, penalidadeArmadura: 0.5 },
    { id: 'cavalgar', nome: 'Cavalgar', nome_en: 'Ride', nome_zh: '骑乘', categoria: 'Animais', tipo: 'Básica', formula: 'DES+CAR', especializavel: true, penalidadeArmadura: 1 },
    { id: 'canto', nome: 'Canto', nome_en: 'Singing', nome_zh: '唱歌', categoria: 'Social', tipo: 'Básica', formula: 'CAR+POD', especializavel: true, penalidadeArmadura: 0.5 },
    { id: 'furtividade', nome: 'Furtividade', nome_en: 'Stealth', nome_zh: '潜行', categoria: 'Furtividade', tipo: 'Básica', formula: 'DES+INT', especializavel: false, penalidadeArmadura: 1 },
    { id: 'natacao', nome: 'Natação', nome_en: 'Swimming', nome_zh: '游泳', categoria: 'Física', tipo: 'Básica', formula: 'FOR+CON', especializavel: false, penalidadeArmadura: 1 },
    { id: 'combate_desarmado', nome: 'Combate Desarmado', nome_en: 'Unarmed Combat', nome_zh: '徒手格斗', categoria: 'Combate', tipo: 'Básica', formula: 'FOR+DES', especializavel: true, penalidadeArmadura: 1 },
    { id: 'forca_vontade', nome: 'Força de Vontade', nome_en: 'Willpower', nome_zh: '意志力', categoria: 'Psi', tipo: 'Básica', formula: 'POD*2', especializavel: false, penalidadeArmadura: 0 },
    { id: 'arte', nome: 'Arte', nome_en: 'Art', nome_zh: '艺术', categoria: 'Técnica', tipo: 'Profissional', formula: 'INT+CAR', especializavel: true, penalidadeArmadura: 0 },
    { id: 'comercio', nome: 'Comércio', nome_en: 'Commerce', nome_zh: '商业', categoria: 'Social', tipo: 'Profissional', formula: 'INT+CAR', especializavel: true, penalidadeArmadura: 0 },
    { id: 'engenharia', nome: 'Engenharia', nome_en: 'Engineering', nome_zh: '工程', categoria: 'Técnica', tipo: 'Profissional', formula: 'INT*2', especializavel: true, penalidadeArmadura: 0.5 },
    { id: 'medicina', nome: 'Medicina', nome_en: 'Medicine', nome_zh: '医学', categoria: 'Medicina', tipo: 'Profissional', formula: 'INT*2', especializavel: true, penalidadeArmadura: 0.5 },
    { id: 'pilotagem', nome: 'Pilotagem', nome_en: 'Piloting', nome_zh: '驾驶', categoria: 'Veículos', tipo: 'Profissional', formula: 'DES+INT', especializavel: true, penalidadeArmadura: 0 },
    { id: 'sobrevivencia', nome: 'Sobrevivência', nome_en: 'Survival', nome_zh: '生存', categoria: 'Sobrevivência', tipo: 'Profissional', formula: 'INT+CON', especializavel: true, penalidadeArmadura: 0 },
    { id: 'tatica', nome: 'Tática', nome_en: 'Tactics', nome_zh: '战术', categoria: 'Combate', tipo: 'Profissional', formula: 'INT+POD', especializavel: true, penalidadeArmadura: 0 },
    { id: 'armeiro', nome: 'Armeiro', nome_en: 'Gunsmith', nome_zh: '枪械师', categoria: 'Técnica', tipo: 'Profissional', formula: 'INT+DES', especializavel: true, penalidadeArmadura: 0 },
    { id: 'interrogatorio', nome: 'Interrogatório', nome_en: 'Interrogation', nome_zh: '审讯', categoria: 'Social', tipo: 'Profissional', formula: 'INT+CAR', especializavel: true, penalidadeArmadura: 0 },
    { id: 'rastrear', nome: 'Rastrear', nome_en: 'Tracking', nome_zh: '追踪', categoria: 'Sobrevivência', tipo: 'Profissional', formula: 'INT+POD', especializavel: true, penalidadeArmadura: 1 },
    { id: 'submundo', nome: 'Submundo', nome_en: 'Underworld', nome_zh: '地下世界', categoria: 'Furtividade', tipo: 'Profissional', formula: 'POD+CAR', especializavel: true, penalidadeArmadura: 1 },
    { id: 'astronavegacao', nome: 'Astronavegação', nome_en: 'Astrogation', nome_zh: '星际导航', categoria: 'Veículos', tipo: 'Profissional', formula: 'INT*2', especializavel: true, penalidadeArmadura: 0 },
    { id: 'mecanica', nome: 'Mecânica', nome_en: 'Mechanics', nome_zh: '机械', categoria: 'Técnica', tipo: 'Profissional', formula: 'INT+DES', especializavel: true, penalidadeArmadura: 1 },
    { id: 'eletronica', nome: 'Eletrônica', nome_en: 'Electronics', nome_zh: '电子', categoria: 'Técnica', tipo: 'Profissional', formula: 'INT+DES', especializavel: true, penalidadeArmadura: 0.5 },
    { id: 'computadores', nome: 'Computadores', nome_en: 'Computers', nome_zh: '计算机', categoria: 'Técnica', tipo: 'Profissional', formula: 'INT*2', especializavel: true, penalidadeArmadura: 0 },
    { id: 'sobrevivencia_espacial', nome: 'Sobrevivência Espacial', nome_en: 'Space Survival', nome_zh: '太空生存', categoria: 'Sobrevivência', tipo: 'Profissional', formula: 'INT+POD', especializavel: true, penalidadeArmadura: 0.5 },
    { id: 'sistemas_escudo', nome: 'Sistemas de Escudo/Sensores', nome_en: 'Shield/Sensor Systems', nome_zh: '护盾/传感器', categoria: 'Técnica', tipo: 'Profissional', formula: 'INT+POD', especializavel: true, penalidadeArmadura: 0 },
    { id: 'logistica', nome: 'Logística', nome_en: 'Logistics', nome_zh: '物流', categoria: 'Estratégica', tipo: 'Profissional', formula: 'INT*2', especializavel: true, penalidadeArmadura: 0.5 }
];

// Reforma de perícias v46.44: escolas, famílias, disponibilidade e sinergias.
const reformaPericiasV4644_ = {
  resistencia:{descricao:'Suporta exaustão, dor e ambientes hostis. Também participa dos testes de vida após ferimentos graves.',familias:['Física']},
  esquiva:{descricao:'Defesa ativa baseada em reflexos e deslocamento. É a perícia geral de Destreza.',familias:['Combate']},
  forca_bruta:{descricao:'Aplicação geral de força física. Pode substituir tarefas técnicas puramente físicas, como mineração bruta, com dificuldade maior.',familias:['Física']},
  influencia:{descricao:'Capacidade social geral baseada em presença e carisma.',familias:['Social']},
  forca_vontade:{descricao:'Autocontrole, determinação e resistência mental. É a perícia geral de Poder.',familias:['Mental']},
  natacao:{familias:['Física'],sinergias:{atletismo:.20,navegacao_remo:.20}},
  atletismo:{familias:['Física'],sinergias:{natacao:.20}},
  navegacao_remo:{disponivelCampanha:false,familias:['Veículos','Física'],sinergias:{natacao:.20}},
  cavalgar:{formula:'DES+CAR',familias:['Animais'],descricao:'Controlar e conduzir uma montaria. Carisma representa comunicação, presença e vínculo com o animal.'},
  ocultar_itens:{formula:'DES*2',familias:['Infiltração']},
  costumes:{nome:'Tradição',nome_en:'Tradition',nome_zh:'传统',familias:['Cultura'],exigeEscola:true,escolas:['Cultura de origem','Tradição regional','Tradição religiosa','Tradição profissional']},
  dissimulacao:{nome:'Enganação',familias:['Social','Infiltração']},
  conduzir:{nome:'Condução de Veículos',nome_en:'Vehicle Operation',nome_zh:'车辆驾驶',formula:'DES+INT',familias:['Veículos'],exigeEscola:true,escolas:['Veículos terrestres','Motocicletas','Veículos pesados','Veículos aquáticos','Veículos exóticos']},
  sobrevivencia:{familias:['Exploração'],exigeEscola:true,escolas:['Urbana','Rural','Florestas','Desertos','Montanhas','Mares e Costas','Polar','Subterrânea','Espacial','Ambientes Exóticos'],sinergias:{rastrear:.20}},
  rastrear:{familias:['Exploração'],sinergias:{sobrevivencia:.20}},
  medicina:{formula:'INT*2',familias:['Medicina'],exigeEscola:true,escolas:['Clínica Geral','Cirurgia','Traumatologia','Medicina de Emergência','Psiquiatria','Medicina Espacial','Xenomedicina'],sinergias:{primeiros_socorros:.20}},
  primeiros_socorros:{familias:['Medicina'],sinergias:{medicina:.10}},
  pesquisa:{formula:'INT*2',familias:['Acadêmica'],sinergias:{historia:.10,ensino:.10}},
  ensino:{familias:['Acadêmica'],sinergias:{historia:.05,pesquisa:.10}},
  historia:{formula:'INT*2',familias:['Acadêmica'],exigeEscola:true,escolas:['História do Império','História Planetária','História Militar','História Política','História da Tecnologia','História Econômica','História Social','História da Arte','Genealogia','Heraldismo','Arqueologia'],sinergias:{pesquisa:.05,ensino:.05}},
  saber:{nome:'Conhecimentos Gerais',nome_en:'General Knowledge',nome_zh:'通识',formula:'INT*2',familias:['Acadêmica'],exigeEscola:true,escolas:['Cultura Imperial','Ciências','Humanidades','Tecnologia','Sociedade e Atualidades'],penalidadeForaEscola:2},
  conhecimentos_gerais:{nome:'Conhecimentos Gerais',nome_en:'General Knowledge',nome_zh:'通识',formula:'INT*2',familias:['Acadêmica'],exigeEscola:true,escolas:['Cultura Imperial','Ciências','Humanidades','Tecnologia','Sociedade e Atualidades'],penalidadeForaEscola:2},
  pilotagem:{formula:'DES+INT',familias:['Veículos','Navegação'],exigeEscola:true,escolas:['Naves pequenas','Naves capitais','Aeronaves','VTOL/Gravíticos','Mechas'],sinergias:{astronavegacao:.20}},
  astronavegacao:{formula:'INT*2',familias:['Navegação'],sinergias:{pilotagem:.20}},
  navegacao:{formula:'INT*2',familias:['Navegação'],exigeEscola:true,escolas:['Terrestre','Marítima','Aérea','Subterrânea']},
  mecanica:{familias:['Tecnologia'],exigeEscola:true,escolas:['Veículos','Naves','Industrial','Mecatrônica','Máquinas Exóticas'],sinergias:{robotica:.20,eletronica:.10}},
  eletronica:{familias:['Tecnologia'],exigeEscola:true,escolas:['Sistemas gerais','Comunicações','Sensores','Controle','Potência'],sinergias:{robotica:.20,cibernetica:.10}},
  computadores:{nome:'Computação',nome_en:'Computing',nome_zh:'计算技术',formula:'INT*2',familias:['Tecnologia'],sinergias:{ciberseguranca:.20,robotica:.10}},
  ciber_seguranca:{nome:'Cibersegurança',nome_en:'Cybersecurity',nome_zh:'网络安全',formula:'INT*2',familias:['Tecnologia'],sinergias:{computadores:.20}},
  logistica:{formula:'INT*2',familias:['Estratégica'],sinergias:{tatica:.20,estrategia:.20,lideranca:.20}},
  tatica:{familias:['Estratégica'],sinergias:{estrategia:.20,logistica:.20,lideranca:.20}},
  estrategia:{formula:'INT+POD',familias:['Estratégica'],sinergias:{tatica:.20,logistica:.20,lideranca:.20}},
  comando:{nome:'Liderança',nome_en:'Leadership',nome_zh:'领导力',formula:'INT+CAR',familias:['Estratégica','Social'],sinergias:{tatica:.20,estrategia:.20,logistica:.20}},
  seducao:{formula:'POD+CAR',familias:['Social']},
  avaliacao:{formula:'INT+POD',familias:['Conhecimento']},
  intimidacao:{nome:'Intimidação',nome_en:'Intimidation',nome_zh:'威吓',formula:'POD+MAIOR',tipo:'Básica',categoria:'Social',familias:['Social'],descricao:'Intimida usando POD somado ao maior entre FOR, TAM, DES, INT e CAR. Interprete a abordagem conforme o atributo escolhido: força física, porte, velocidade, intelecto ou presença.'},
  mineracao:{formula:'INT+FOR',familias:['Exploração','Técnica'],exigeEscola:true,escolas:['Minérios metálicos','Cristais e gemas','Combustíveis e minerais','Mineração subterrânea','Mineração espacial']},
  meditacao:{familias:['Mental','Psi'],exigeEscola:true,escolas:['Transe','Contemplativa','Respiratória','Psi']},
  arte:{familias:['Artes'],sinergias:{danca:.20,canto:.20,musica:.20,teatro:.20}},
  danca:{familias:['Artes'],sinergias:{arte:.20,canto:.20,musica:.20,teatro:.20}},
  canto:{familias:['Artes'],sinergias:{arte:.20,danca:.20,musica:.20,teatro:.20}},
  musica:{familias:['Artes'],sinergias:{arte:.20,danca:.20,canto:.20,teatro:.20}},
  teatro:{familias:['Artes','Representação'],sinergias:{arte:.20,danca:.20,canto:.20,musica:.20,disfarce:.20,dissimulacao:.20}},
  disfarce:{familias:['Representação','Infiltração'],sinergias:{teatro:.20,dissimulacao:.20}},
  interrogatorio:{familias:['Psicologia','Social'],sinergias:{psicologia:.20}},
  psicologia:{familias:['Psicologia'],sinergias:{interrogatorio:.10}},
  robotica:{nome:'Robótica',nome_en:'Robotics',nome_zh:'机器人学',formula:'INT+DES',tipo:'Profissional',categoria:'Técnica',familias:['Tecnologia'],exigeEscola:true,escolas:['Drones','Robôs industriais','Robôs humanoides','Autômatos militares'],sinergias:{mecanica:.20,eletronica:.20,computadores:.10}},
  cibernetica:{nome:'Cibernética',nome_en:'Cybernetics',nome_zh:'控制论与义体',formula:'INT+DES',tipo:'Profissional',categoria:'Técnica',familias:['Tecnologia','Medicina'],exigeEscola:true,escolas:['Próteses','Implantes neurais','Interfaces homem-máquina','Órgãos artificiais'],sinergias:{eletronica:.10,medicina:.10}},
  comunicacoes:{nome:'Comunicações',nome_en:'Communications',nome_zh:'通信',formula:'INT+CAR',tipo:'Profissional',categoria:'Técnica',familias:['Tecnologia'],exigeEscola:true,escolas:['Rádio','Comunicações espaciais','Redes táticas','Interferência e contramedidas']},
  sensoriamento:{nome:'Sensoriamento',nome_en:'Sensor Operations',nome_zh:'传感器操作',formula:'INT*2',tipo:'Profissional',categoria:'Técnica',familias:['Tecnologia','Espacial'],exigeEscola:true,escolas:['Radar/Lidar','Espectroscopia','Varredura espacial','Sensores planetários']},
  sistemas_escudo:{nome:'Sistemas Defensivos [Legado]',nome_en:'Defensive Systems [Legacy]',nome_zh:'防御系统[旧]',formula:'INT+DES',familias:['Tecnologia','Espacial'],descricao:'Registro legado preservado para não perder investimentos antigos. Novos personagens usam Sistemas Defensivos e Sensoriamento.'},
  sistemas_defensivos:{nome:'Sistemas Defensivos',nome_en:'Defensive Systems',nome_zh:'防御系统',formula:'INT+DES',tipo:'Profissional',categoria:'Técnica',familias:['Tecnologia','Espacial'],exigeEscola:true,escolas:['Escudos','Contramedidas','Defesa eletrônica','Defesa de ponto']},
  seguranca:{nome:'Segurança',nome_en:'Security',nome_zh:'安保技术',formula:'INT+DES',tipo:'Profissional',categoria:'Técnica',familias:['Tecnologia','Infiltração'],exigeEscola:true,escolas:['Cofres e Fechaduras','Alarmes','Controle de Acesso','Vigilância']}
};

// Migração segura v46.45.0.
// Mantém investimentos antigos intactos e converte referências legadas sem usar o Total antigo.
const migracaoPericiasV46441_ = {
  // Renomes 1:1 preservam o ID para não quebrar personagens/carreiras.
  dissimulacao:{id:'dissimulacao'}, computadores:{id:'computadores'}, conduzir:{id:'conduzir'},
  costumes:{id:'costumes'}, comando:{id:'comando'}, saber:{id:'saber'}, submundo:{id:'submundo'},
  // Antigas perícias que agora representam escolas. O ID legado é preservado como escola virtual,
  // pois personagens antigos podem ter investimento simultâneo no tronco e na escola.
  sobrevivencia_espacial:{id:'sobrevivencia_espacial',parentId:'sobrevivencia',escola:'Espacial'},
  genealogia:{id:'genealogia',parentId:'historia',escola:'Genealogia'},
  heraldismo:{id:'heraldismo',parentId:'historia',escola:'Heraldismo'},
  transe:{id:'transe',parentId:'meditacao',escola:'Transe'},
  cofres_fechaduras:{id:'cofres_fechaduras',parentId:'seguranca',escola:'Cofres e Fechaduras'},
  lingua_antiga:{id:'lingua_antiga',parentId:'idiomas',escola:'Língua Antiga'},
  saber_lore:{id:'saber_lore',parentId:'conhecimentos_gerais',escola:'Cultura Imperial'}
};

function definicoesLegadasEscolas_(){
  return [
    {id:'sobrevivencia_espacial',nome:'Sobrevivência [Espacial]',nome_en:'Survival [Space]',nome_zh:'生存[太空]',categoria:'Sobrevivência',tipo:'Profissional',formula:'INT+CON',especializavel:false,penalidadeArmadura:.5,parentId:'sobrevivencia',escola:'Espacial',familias:['Exploração'],legadoEscola:true,sinergias:{rastrear:.20}},
    {id:'genealogia',nome:'História [Genealogia]',nome_en:'History [Genealogy]',nome_zh:'历史[谱系学]',categoria:'Acadêmica',tipo:'Profissional',formula:'INT*2',especializavel:false,penalidadeArmadura:0,parentId:'historia',escola:'Genealogia',familias:['Acadêmica'],legadoEscola:true},
    {id:'heraldismo',nome:'História [Heraldismo]',nome_en:'History [Heraldry]',nome_zh:'历史[纹章学]',categoria:'Acadêmica',tipo:'Profissional',formula:'INT*2',especializavel:false,penalidadeArmadura:0,parentId:'historia',escola:'Heraldismo',familias:['Acadêmica'],legadoEscola:true},
    {id:'transe',nome:'Meditação [Transe]',nome_en:'Meditation [Trance]',nome_zh:'冥想[入定]',categoria:'Mental',tipo:'Profissional',formula:'CON+POD',especializavel:false,penalidadeArmadura:0,parentId:'meditacao',escola:'Transe',familias:['Mental','Psi'],legadoEscola:true},
    {id:'cofres_fechaduras',nome:'Segurança [Cofres e Fechaduras]',nome_en:'Security [Locks & Safes]',nome_zh:'安保[锁具与保险柜]',categoria:'Técnica',tipo:'Profissional',formula:'INT+DES',especializavel:false,penalidadeArmadura:0,parentId:'seguranca',escola:'Cofres e Fechaduras',familias:['Tecnologia','Infiltração'],legadoEscola:true},
    {id:'lingua_antiga',nome:'Idiomas [Língua Antiga]',nome_en:'Languages [Ancient Language]',nome_zh:'语言[古代语言]',categoria:'Conhecimento',tipo:'Profissional',formula:'INT+CAR',especializavel:false,penalidadeArmadura:0,parentId:'idiomas',escola:'Língua Antiga',familias:['Linguagem'],legadoEscola:true},
    {id:'saber_lore',nome:'Conhecimentos Gerais [Cultura Imperial]',nome_en:'General Knowledge [Imperial Culture]',nome_zh:'通识[帝国文化]',categoria:'Conhecimento',tipo:'Profissional',formula:'INT*2',especializavel:false,penalidadeArmadura:0,parentId:'conhecimentos_gerais',escola:'Cultura Imperial',familias:['Acadêmica'],legadoEscola:true}
  ];
}

function garantirDefinicoesLegadasInvestidas_(lista){
  const mapa=new Map((lista||[]).map(p=>[p.id,p]));
  for(const p of definicoesLegadasEscolas_()) if(!mapa.has(p.id)) mapa.set(p.id,p);
  return [...mapa.values()];
}

function normalizarRegistroTreinoMigracao_(dados){
  const d={...(dados||{})};
  const inv=obterInvestimentosPericia_(d);
  d.investimentos={origem:Number(inv.origem||0),carreira:Number(inv.carreira||0),hobbie:Number(inv.hobbie||0),xp:Number(inv.xp||0)};
  d.treinoTotal=d.investimentos.origem+d.investimentos.carreira+d.investimentos.hobbie+d.investimentos.xp;
  return d;
}

function migrarPersonagemPericiasV46441_(char){
  if(!char)return {alterado:false,char};
  let alterado=false;
  char.pericias=char.pericias||{};
  // Converte apenas a estrutura do registro e anota a escola. Nunca recalcula nem grava Total.
  for(const [id,meta] of Object.entries(migracaoPericiasV46441_)){
    if(!char.pericias[id])continue;
    const antes=JSON.stringify(char.pericias[id]);
    const d=normalizarRegistroTreinoMigracao_(char.pericias[id]);
    if(meta.escola){d.escola=meta.escola;d.parentId=meta.parentId;d.legadoEscola=true;}
    char.pericias[id]=d;
    if(JSON.stringify(d)!==antes)alterado=true;
  }
  // Escolas obrigatórias já investidas recebem a primeira opção somente quando não existe
  // uma escola explícita. Isso segue a regra definida para personagens antigos.
  for(const p of (periciasDB||[])){
    if(!p?.exigeEscola)continue;
    const d=char.pericias[p.id];
    if(d&&totalTreinoPericia_(d)>0&&!d.escola){d.escola=escolaPadraoPericia_(p);alterado=true;}
  }
  if(char.migracaoPericiasVersao!=='46.44.4'){char.migracaoPericiasVersao='46.44.4';alterado=true;}
  return {alterado,char};
}

async function persistirMigracaoPersonagemV46441_(char){
  const r=migrarPersonagemPericiasV46441_(char);
  if(!r.alterado)return false;
  try{
    await setDoc(doc(db,'personagens',char.id),{pericias:char.pericias,migracaoPericiasVersao:'46.44.4'},{merge:true});
    return true;
  }catch(err){console.warn('Migração de perícias não pôde ser persistida para',char.id,err);return false;}
}

function aplicarMetadadosReformaPericias_(lista){
  const mapa=new Map((lista||[]).map(x=>[x.id,x]));
  for(const [id,meta] of Object.entries(reformaPericiasV4644_)){
    if(mapa.has(id)) Object.assign(mapa.get(id),meta);
    else if(String(meta?.nome||'').trim()) mapa.set(id,{id,especializavel:!!meta.exigeEscola,penalidadeArmadura:0,...meta});
  }
  const legados={cofres_fechaduras:['Segurança [Cofres e Fechaduras]','Security [Locks & Safes]','安保[锁具与保险柜]'],genealogia:['História [Genealogia]','History [Genealogy]','历史[谱系学]'],heraldismo:['História [Heraldismo]','History [Heraldry]','历史[纹章学]'],lingua_antiga:['Idiomas [Língua Antiga]','Languages [Ancient Language]','语言[古代语言]'],saber_lore:['Conhecimentos Gerais [Cultura Imperial]','General Knowledge [Imperial Culture]','通识[帝国文化]'],sobrevivencia_espacial:['Sobrevivência [Espacial]','Survival [Space]','生存[太空]'],transe:['Meditação [Transe]','Meditation [Trance]','冥想[入定]']};
  for(const [id,nomes] of Object.entries(legados))if(mapa.has(id))Object.assign(mapa.get(id),{nome:nomes[0],nome_en:nomes[1],nome_zh:nomes[2],legadoEscola:true});
  return garantirDefinicoesLegadasInvestidas_([...mapa.values()]).filter(p=>String(p?.nome||p?.nome_en||p?.nome_zh||'').trim()).filter(p=>p.disponivelCampanha!==false || userData?.role==='mestre');
}
function escolaPadraoPericia_(p){return Array.isArray(p?.escolas)&&p.escolas.length?p.escolas[0]:'';}
window.definirEscolaPericia_=(id,valor)=>{const c=userCharacters.find(x=>x.id===currentCharId);if(!c)return;if(personagemCriacaoConcluida_(c)&&userData?.role!=='mestre'){notificar_('Após concluir a ficha, somente o mestre pode alterar a especialização.','aviso',3600);renderizarPericias(c);return;}const d=rascunhoPericiasChar_(c);d.pericias[id]={...(d.pericias[id]||{}),escola:String(valor||'')};d.sujo=true;renderizarPericias(c);};

const origensPadrao = [
    { id: 'urbano', nome: 'Urbano (Metrópole)', nome_en: 'Urban (Metropolis)', nome_zh: '城市', periciasBasicas: ['costumes', 'dissimulacao', 'conduzir', 'influencia', 'intuicao', 'regiao', 'percepcao'] },
    { id: 'rural', nome: 'Rural (Mundo Rural)', nome_en: 'Rural', nome_zh: '农村', periciasBasicas: ['atletismo', 'forca_bruta', 'resistencia', 'primeiros_socorros', 'regiao', 'percepcao', 'cavalgar'] },
    { id: 'selvagem', nome: 'Selvagem (Mundo Selvagem)', nome_en: 'Wild', nome_zh: '荒野', periciasBasicas: ['atletismo', 'forca_bruta', 'resistencia', 'esquiva', 'primeiros_socorros', 'intuicao', 'regiao', 'percepcao', 'furtividade', 'natacao'] },
    { id: 'militar', nome: 'Militar (Mundo Militarizado)', nome_en: 'Military', nome_zh: '军事', periciasBasicas: ['atletismo', 'forca_bruta', 'resistencia', 'esquiva', 'primeiros_socorros', 'percepcao', 'combate_desarmado', 'forca_vontade'] },
    { id: 'orbital', nome: 'Orbital (Habitat Orbital)', nome_en: 'Orbital', nome_zh: '轨道', periciasBasicas: ['atletismo', 'dissimulacao', 'conduzir', 'resistencia', 'intuicao', 'percepcao'] },
    { id: 'industrial', nome: 'Industrial (Colônia Industrial)', nome_en: 'Industrial', nome_zh: '工业', periciasBasicas: ['forca_bruta', 'conduzir', 'resistencia', 'primeiros_socorros', 'intuicao', 'percepcao'] },
    { id: 'aristocratico', nome: 'Aristocrático (Mundo Aristocrático)', nome_en: 'Aristocratic', nome_zh: '贵族', periciasBasicas: ['costumes', 'danca', 'dissimulacao', 'influencia', 'intuicao', 'regiao', 'cavalgar', 'canto'] },
    { id: 'nomade', nome: 'Nômade (Frota/Nave)', nome_en: 'Nomad', nome_zh: '游牧', periciasBasicas: ['atletismo', 'conduzir', 'resistencia', 'intuicao', 'regiao', 'percepcao', 'forca_vontade'] }
];

const carreirasPadrao = [
    { id: 'cacador_recompensas', nome: 'Caçador de Recompensas', nome_en: 'Bounty Hunter', nome_zh: '赏金猎人', periciasBasicas: ['atletismo', 'esquiva', 'furtividade', 'percepcao', 'forca_vontade'], periciasProfissionais: ['armeiro', 'interrogatorio', 'pilotagem', 'rastrear', 'submundo', 'sobrevivencia'], especializacoes: ['combate_pistola_laser', 'atirador_elite'] },
    { id: 'pirata_espacial', nome: 'Pirata Espacial', nome_en: 'Space Pirate', nome_zh: '太空海盗', periciasBasicas: ['atletismo', 'esquiva', 'furtividade', 'percepcao', 'resistencia'], periciasProfissionais: ['armeiro', 'astronavegacao', 'logistica', 'mecanica', 'pilotagem', 'submundo', 'sobrevivencia_espacial', 'tatica'], especializacoes: ['luta_gravidade_zero', 'arma_laser_pesada'] },
    { id: 'guarda_costas', nome: 'Guarda-Costas', nome_en: 'Bodyguard', nome_zh: '保镖', periciasBasicas: ['atletismo', 'esquiva', 'percepcao', 'resistencia', 'forca_vontade'], periciasProfissionais: ['armeiro', 'interrogatorio', 'medicina', 'rastrear', 'tatica'], especializacoes: ['guarda_costas_arma_longa', 'combate_pistola_laser'] },
    { id: 'militar', nome: 'Militar', nome_en: 'Military', nome_zh: '军人', periciasBasicas: ['atletismo', 'esquiva', 'forca_bruta', 'percepcao', 'resistencia', 'combate_desarmado'], periciasProfissionais: ['armeiro', 'comando', 'demolicoes', 'estrategia', 'logistica', 'medicina', 'sobrevivencia', 'tatica'], especializacoes: ['soldado_infantaria', 'arma_laser_pesada'] },
    { id: 'medico', nome: 'Médico', nome_en: 'Doctor', nome_zh: '医生', periciasBasicas: ['influencia', 'intuicao', 'percepcao', 'primeiros_socorros', 'forca_vontade'], periciasProfissionais: ['anatomia', 'medicina', 'pesquisa', 'psicologia', 'xenobiologia'], especializacoes: [] },
    { id: 'engenheiro', nome: 'Engenheiro', nome_en: 'Engineer', nome_zh: '工程师', periciasBasicas: ['percepcao', 'intuicao', 'costumes', 'regiao', 'forca_vontade'], periciasProfissionais: ['eletronica', 'engenharia', 'exotecnologia', 'logistica', 'mecanica', 'pesquisa', 'sistemas_escudo'], especializacoes: [] },
    { id: 'piloto', nome: 'Piloto de Nave Estelar', nome_en: 'Starship Pilot', nome_zh: '星舰飞行员', periciasBasicas: ['conduzir', 'resistencia', 'esquiva', 'regiao', 'percepcao', 'forca_vontade'], periciasProfissionais: ['astronavegacao', 'computadores', 'eletronica', 'mecanica', 'pilotagem', 'sistemas_escudo', 'sobrevivencia_espacial'], especializacoes: ['combate_traje_espacial'] }
];

const especializacoesPadrao = [
    { id: 'combate_pistola_laser', nome: 'Combate com Pistola Laser', nome_en: 'Laser Pistol Combat', nome_zh: '激光手枪战斗', tipo: 'Combate', uso: 'Distância', formula: 'DES*2' },
    { id: 'atirador_elite', nome: 'Atirador de Elite', nome_en: 'Elite Sniper', nome_zh: '精英狙击手', tipo: 'Combate', uso: 'Distância', formula: 'DES+INT' },
    { id: 'arma_laser_pesada', nome: 'Arma Laser Pesada', nome_en: 'Heavy Laser Weapon', nome_zh: '重型激光武器', tipo: 'Combate', uso: 'Distância', formula: 'FOR+DES' },
    { id: 'luta_gravidade_zero', nome: 'Luta em Gravidade Zero', nome_en: 'Zero-G Combat', nome_zh: '零重力战斗', tipo: 'Combate', uso: 'Corpo a corpo + Distância + Defesa', formula: 'DES+INT' },
    { id: 'guarda_costas_arma_longa', nome: 'Guarda-Costas (Arma Longa/Escudo)', nome_en: 'Bodyguard (Long Weapon/Shield)', nome_zh: '保镖', tipo: 'Combate', uso: 'Corpo a corpo + Defesa', formula: 'FOR+DES' },
    { id: 'combate_traje_espacial', nome: 'Combate em Traje Espacial', nome_en: 'Spacesuit Combat', nome_zh: '太空服战斗', tipo: 'Combate', uso: 'Corpo a corpo + Distância + Defesa', formula: 'DES+CON' },
    { id: 'psiquismo_materia', nome: 'Psiquismo (Matéria)', nome_en: 'Psychism (Matter)', nome_zh: '心灵感应(物质)', tipo: 'Psi', uso: 'Teste', formula: 'INT+POD' },
    { id: 'psiquismo_mente', nome: 'Psiquismo (Mente)', nome_en: 'Psychism (Mind)', nome_zh: '心灵感应(心灵)', tipo: 'Psi', uso: 'Teste', formula: 'INT+POD' },
    { id: 'psiquismo_sentidos', nome: 'Psiquismo (Sentidos)', nome_en: 'Psychism (Senses)', nome_zh: '心灵感应(感官)', tipo: 'Psi', uso: 'Teste', formula: 'INT+POD' }
];

const poderesPsiPadrao = [
    {"id": "evitar_dano", "nome": "Evitar Dano", "nome_en": "Avoid Damage", "nome_zh": "避免伤害", "esfera": "Sentidos", "arco": 1, "custo": 1, "observacao": "1 PP por ponto de dano absorvido", "observacao_en": "", "observacao_zh": ""},
    {"id": "intuicao_psi", "nome": "Intuição", "nome_en": "Intuition", "nome_zh": "直觉", "esfera": "Sentidos", "arco": 1, "custo": 1, "observacao": "Adiciona 1% em uma perícia por PP gasto", "observacao_en": "", "observacao_zh": ""},
    {"id": "meditacao_psi", "nome": "Meditação", "nome_en": "Meditation", "nome_zh": "冥想", "esfera": "Sentidos", "arco": 1, "custo": 0, "observacao": "Recupera 1/4 dos PP em uma hora; apenas 1 vez por dia", "observacao_en": "", "observacao_zh": ""},
    {"id": "meditacao_batalha", "nome": "Meditação de Batalha", "nome_en": "Battle Meditation", "nome_zh": "战斗冥想", "esfera": "Sentidos", "arco": 2, "custo": 3, "observacao": "Após pelo menos 2 rodadas de concentração, a primeira ação de combate é Fácil", "observacao_en": "", "observacao_zh": ""},
    {"id": "psicometria", "nome": "Psicometria", "nome_en": "Psychometry", "nome_zh": "触物感知", "esfera": "Sentidos", "arco": 2, "custo": 3, "observacao": "3 PP para perceber alguns dias no passado; depois, 5 PP por mês adicional", "observacao_en": "", "observacao_zh": ""},
    {"id": "detectar_psi", "nome": "Detectar", "nome_en": "Detect", "nome_zh": "侦测", "esfera": "Sentidos", "arco": 2, "custo": 2, "observacao": "Detecta um psíquico próximo ou rastros deixados por ele", "observacao_en": "", "observacao_zh": ""},
    {"id": "visao_distante", "nome": "Visão Distante", "nome_en": "Remote Vision", "nome_zh": "远视", "esfera": "Sentidos", "arco": 3, "custo": 10, "observacao": "Produz impressões vagas de eventos distantes no tempo e/ou espaço", "observacao_en": "", "observacao_zh": ""},
    {"id": "amizade", "nome": "Amizade", "nome_en": "Friendship", "nome_zh": "友善", "esfera": "Mente", "arco": 1, "custo": 2, "observacao": "Melhora a disposição social de um ser inteligente", "observacao_en": "", "observacao_zh": ""},
    {"id": "defesa_mental", "nome": "Defesa Mental", "nome_en": "Mental Defense", "nome_zh": "精神防御", "esfera": "Mente", "arco": 1, "custo": 2, "observacao": "Proteção contra ataques psíquicos; 2 PP por cada 5 m²", "observacao_en": "", "observacao_zh": ""},
    {"id": "empatia", "nome": "Empatia", "nome_en": "Empathy", "nome_zh": "共情", "esfera": "Mente", "arco": 1, "custo": 2, "observacao": "Percebe sentimentos e atitudes gerais; renovar custa 1 PP", "observacao_en": "", "observacao_zh": ""},
    {"id": "grito_psiquico", "nome": "Grito Psíquico", "nome_en": "Psychic Scream", "nome_zh": "心灵尖啸", "esfera": "Mente", "arco": 1, "custo": 3, "observacao": "Interferência mental intensa; dificulta ou impede ações dos alvos", "observacao_en": "", "observacao_zh": ""},
    {"id": "ler_mente", "nome": "Ler Mente", "nome_en": "Read Mind", "nome_zh": "读心", "esfera": "Mente", "arco": 2, "custo": 5, "observacao": "5 PP para pensamentos superficiais; 10 PP para investigação profunda", "observacao_en": "", "observacao_zh": ""},
    {"id": "influenciar_mente", "nome": "Influenciar Mente", "nome_en": "Influence Mind", "nome_zh": "精神影响", "esfera": "Mente", "arco": 2, "custo": 5, "observacao": "O alvo segue uma sugestão simples sem hesitação", "observacao_en": "", "observacao_zh": ""},
    {"id": "ocultar_mente", "nome": "Ocultar Mente", "nome_en": "Hide Mind", "nome_zh": "隐藏心灵", "esfera": "Mente", "arco": 2, "custo": 1, "observacao": "Oculta a assinatura psíquica; 1 PP por minuto", "observacao_en": "", "observacao_zh": ""},
    {"id": "mente_acelerada", "nome": "Mente Acelerada", "nome_en": "Accelerated Mind", "nome_zh": "加速思维", "esfera": "Mente", "arco": 2, "custo": 5, "observacao": "Acelera compreensão, leitura, pesquisa e processos mentais", "observacao_en": "", "observacao_zh": ""},
    {"id": "amnesia", "nome": "Amnésia", "nome_en": "Amnesia", "nome_zh": "失忆", "esfera": "Mente", "arco": 2, "custo": 4, "observacao": "Faz esquecer um evento menor recente; eventos importantes podem custar o dobro", "observacao_en": "", "observacao_zh": ""},
    {"id": "controlar_mente", "nome": "Controlar Mente", "nome_en": "Control Mind", "nome_zh": "精神控制", "esfera": "Mente", "arco": 3, "custo": 10, "observacao": "Controla as ações de um ser inteligente; teste resistido contra Vontade", "observacao_en": "", "observacao_zh": ""},
    {"id": "medo", "nome": "Medo", "nome_en": "Fear", "nome_zh": "恐惧", "esfera": "Mente", "arco": 3, "custo": 10, "observacao": "Provoca terror intenso; alvo deve resistir com Vontade", "observacao_en": "", "observacao_zh": ""},
    {"id": "telepatia", "nome": "Telepatia", "nome_en": "Telepathy", "nome_zh": "心灵感应", "esfera": "Mente", "arco": 3, "custo": 2, "observacao": "Envia uma mensagem mental simples a um alvo; o mestre recebe a mensagem e pode filtrá-la antes da transmissão.", "observacao_en": "Sends a simple mental message to one target; the GM receives it and may filter it before transmission.", "observacao_zh": "向一个目标发送简单的心灵讯息；主持人会先收到讯息，并可在传递前进行筛选。"},
    {"id": "teletransporte_caotico", "nome": "Teletransporte Caótico", "nome_en": "Chaotic Teleport", "nome_zh": "混沌瞬移", "esfera": "Matéria", "arco": 1, "custo": 2, "observacao": "Teletransporta o próprio usuário para uma posição aleatória válida do mapa.", "observacao_en": "Teleports the user to a random valid position on the map.", "observacao_zh": "将施术者瞬移到地图上的一个随机有效位置。"},
    {"id": "cura_psi", "nome": "Cura", "nome_en": "Healing", "nome_zh": "治疗", "esfera": "Matéria", "arco": 1, "custo": 1, "observacao": "Recupera 1 PV por PP; usos de cura física prolongada possuem custo especial", "observacao_en": "", "observacao_zh": ""},
    {"id": "localizar_psi", "nome": "Localizar", "nome_en": "Locate", "nome_zh": "定位", "esfera": "Matéria", "arco": 1, "custo": 2, "observacao": "Localiza mentalmente um objeto conhecido, como uma bússola", "observacao_en": "", "observacao_zh": ""},
    {"id": "mover_objeto", "nome": "Mover Objeto", "nome_en": "Move Object", "nome_zh": "移动物体", "esfera": "Matéria", "arco": 1, "custo": 3, "observacao": "Move objeto até aproximadamente tamanho humano; custo aumenta com a massa", "observacao_en": "", "observacao_zh": ""},
    {"id": "ilusao", "nome": "Ilusão", "nome_en": "Illusion", "nome_zh": "幻觉", "esfera": "Matéria", "arco": 1, "custo": 2, "observacao": "Ilusão realista para todos os sentidos; 2 PP por rodada", "observacao_en": "", "observacao_zh": ""},
    {"id": "impulso", "nome": "Impulso", "nome_en": "Impulse", "nome_zh": "冲击", "esfera": "Matéria", "arco": 2, "custo": 2, "observacao": "Empurra violentamente um alvo de tamanho humano cerca de 5 metros", "observacao_en": "", "observacao_zh": ""},
    {"id": "salto", "nome": "Salto", "nome_en": "Leap", "nome_zh": "跳跃", "esfera": "Matéria", "arco": 2, "custo": 4, "observacao": "Salta até 10 m horizontal ou verticalmente ou amortece uma queda; distância extra exige mais PP", "observacao_en": "", "observacao_zh": ""},
    {"id": "reflexos", "nome": "Reflexos", "nome_en": "Reflexes", "nome_zh": "反射", "esfera": "Matéria", "arco": 2, "custo": 5, "observacao": "Reflexos extremamente rápidos; permite ações adicionais e reação contra disparos; custo por rodada", "observacao_en": "", "observacao_zh": ""},
    {"id": "atordoar_psi", "nome": "Atordoar", "nome_en": "Stun", "nome_zh": "震慑", "esfera": "Matéria", "arco": 2, "custo": 2, "observacao": "Forma focalizada do Grito Psíquico; 2 PP por pessoa afetada por rodada", "observacao_en": "", "observacao_zh": ""},
    {"id": "fluxo_marcial", "nome": "Fluxo Marcial", "nome_en": "Martial Flow", "nome_zh": "武流", "esfera": "Matéria", "arco": 2, "custo": 1, "observacao": "Após uma rolagem, gaste 1 PP por 1% para alterar o resultado em direção a um grau de sucesso melhor", "observacao_en": "", "observacao_zh": ""},
    {"id": "banimento_caotico", "nome": "Banimento Caótico", "nome_en": "Chaotic Banishment", "nome_zh": "混沌放逐", "esfera": "Matéria", "arco": 3, "custo": 6, "observacao": "Após vencer a resistência do alvo, teletransporta-o para uma posição aleatória válida do mapa.", "observacao_en": "After overcoming the target's resistance, teleports it to a random valid position on the map.", "observacao_zh": "在击败目标的抵抗后，将其瞬移到地图上的一个随机有效位置。"},
    {"id": "agilidade_psi", "nome": "Agilidade", "nome_en": "Agility", "nome_zh": "敏捷强化", "esfera": "Matéria", "arco": 3, "custo": 5, "observacao": "Adiciona 10% em Atletismo, Acrobacia ou Combate Desarmado na rodada para cada 5 PP", "observacao_en": "", "observacao_zh": ""},
    {"id": "aceleracao", "nome": "Aceleração", "nome_en": "Acceleration", "nome_zh": "加速", "esfera": "Matéria", "arco": 3, "custo": 4, "observacao": "Movimento extremamente rápido, Movimento 30 por uma rodada", "observacao_en": "", "observacao_zh": ""},
    {"id": "doador_vida", "nome": "Doador da Vida", "nome_en": "Life Giver", "nome_zh": "生命赐予者", "esfera": "Matéria", "arco": 3, "custo": 12, "observacao": "Restaura 1 PV a um ser morto por causa não natural, até 2 minutos após a morte", "observacao_en": "", "observacao_zh": ""}
];

const itensPadrao = [
    { id: 'pistola_laser', nome: 'Pistola Laser', nome_en: 'Laser Pistol', nome_zh: '激光手枪', categoria: 'Armas', peso: 2, pa: 0, pv: 5, dano: '2d6', alcance: '60m', municao: 'Bateria', preco: 9000 },
    { id: 'rifle_laser', nome: 'Rifle Laser', nome_en: 'Laser Rifle', nome_zh: '激光步枪', categoria: 'Armas', peso: 4, pa: 0, pv: 8, dano: '2d8', alcance: '300m', municao: 'Bateria', preco: 18000 },
    { id: 'espada_longa', nome: 'Espada Longa', nome_en: 'Longsword', nome_zh: '长剑', categoria: 'Armas', peso: 3, pa: 0, pv: 10, dano: '1d8+1', alcance: 'Corpo a corpo', municao: '∞', preco: 1500 },
    { id: 'sabre', nome: 'Sabre', nome_en: 'Sabre', nome_zh: '军刀', categoria: 'Armas', peso: 2, pa: 0, pv: 8, dano: '1d8', alcance: 'Corpo a corpo', municao: '', preco: 1300 },
    { id: 'adaga', nome: 'Adaga', nome_en: 'Dagger', nome_zh: '匕首', categoria: 'Armas', peso: 1, pa: 2, pv: 4, dano: '1d4+1', alcance: 'Corpo a corpo', municao: '∞', preco: 240 },
    { id: 'faca_utilitaria', nome: 'Faca Utilitária', nome_en: 'Utility Knife', nome_zh: '多功能刀', categoria: 'Armas', peso: 1, pa: 1, pv: 3, dano: '1d4', alcance: 'Corpo a corpo', municao: '', preco: 150 },
    { id: 'bateria', nome: 'Bateria', nome_en: 'Battery', nome_zh: '电池', categoria: 'Munição', peso: 1, pa: 0, pv: 1, quantidade: 100, preco: 900 },
    { id: 'celula_energia', nome: 'Célula de Energia', nome_en: 'Energy Cell', nome_zh: '能量电池', categoria: 'Munição', peso: 1, pa: 0, pv: 1, quantidade: 100, preco: 1500 },
    { id: 'racao_7_dias', nome: 'Ração de 7 dias', nome_en: '7-Day Ration', nome_zh: '7日口粮', categoria: 'Comida', peso: 7, pa: 0, pv: 1, preco: 60 },
    { id: 'bolsa_agua', nome: 'Bolsa de Água', nome_en: 'Water Bag', nome_zh: '水袋', categoria: 'Comida', peso: 2, pa: 0, pv: 1, preco: 20 },
    { id: 'kit_medico_basico', nome: 'Kit Médico Básico', nome_en: 'Basic Medkit', nome_zh: '基础医疗包', categoria: 'Itens Médicos', peso: 2, pa: 0, pv: 1, preco: 480 },
    { id: 'nanogel_regenerativo', nome: 'Nanogel Regenerativo', nome_en: 'Regenerative Nanogel', nome_zh: '再生纳米凝胶', categoria: 'Itens Médicos', peso: 1, pa: 0, pv: 1, preco: 4800 },
    { id: 'antidoto_universal', nome: 'Antídoto Universal', nome_en: 'Universal Antidote', nome_zh: '万能解毒剂', categoria: 'Itens Médicos', peso: 1, pa: 0, pv: 1, preco: 2000 },
    { id: 'mochila_avancada', nome: 'Mochila Avançada', nome_en: 'Advanced Backpack', nome_zh: '高级背包', categoria: 'Diversos', peso: 2, pa: 0, pv: 5, capacidade: -20, preco: 1400 },
    { id: 'kit_sobrevivencia', nome: 'Kit de Sobrevivência', nome_en: 'Survival Kit', nome_zh: '生存工具包', categoria: 'Ferramentas', peso: 5, pa: 0, pv: 3, preco: 750 },
    { id: 'binoculos', nome: 'Binóculos', nome_en: 'Binoculars', nome_zh: '双筒望远镜', categoria: 'Ferramentas', peso: 1, pa: 0, pv: 2, preco: 540 },
    { id: 'scanner_reconhecimento', nome: 'Scanner de Reconhecimento', nome_en: 'Recon Scanner', nome_zh: '侦察扫描仪', categoria: 'Tecnologia', peso: 1, pa: 0, pv: 3, preco: 12000 },
    { id: 'drone_reconhecimento', nome: 'Drone de Reconhecimento', nome_en: 'Recon Drone', nome_zh: '侦察无人机', categoria: 'Tecnologia', peso: 2, pa: 0, pv: 5, preco: 20000 },
    { id: 'comunicador_completo', nome: 'Comunicador Completo', nome_en: 'Full Communicator', nome_zh: '全功能通讯器', categoria: 'Comunicação', peso: 1, pa: 0, pv: 2, preco: 8400 },
    { id: 'reliquia_desconhecida', nome: 'Relíquia Desconhecida', nome_en: 'Unknown Relic', nome_zh: '未知遗物', categoria: 'Diversos', peso: 1, pa: 0, pv: 1, preco: 0 },
    { id: 'coleto_balistico', nome: 'Colete Balístico', nome_en: 'Ballistic Vest', nome_zh: '防弹背心', categoria: 'Armaduras', peso: 5, pa: 4, pv: 8, preco: 5600 },
    { id: 'roupa_viajante', nome: 'Roupa de Viajante', nome_en: 'Traveler Clothes', nome_zh: '旅行者服装', categoria: 'Roupas', peso: 2, pa: 0, pv: 3, preco: 120 },
    { id: 'cinto_utilitario', nome: 'Cinto Utilitário', nome_en: 'Utility Belt', nome_zh: '多功能腰带', categoria: 'Roupas', peso: 1, pa: 0, pv: 2, preco: 160 },
    { id: 'capa_viajante', nome: 'Capa de Viajante', nome_en: 'Traveler Cape', nome_zh: '旅行者斗篷', categoria: 'Roupas', peso: 2, pa: 0, pv: 3, preco: 200 },
    { id: 'chapeu', nome: 'Chapéu', nome_en: 'Hat', nome_zh: '帽子', categoria: 'Roupas', peso: 0, pa: 0, pv: 1, preco: 40 },
    { id: 'botas_couro', nome: 'Botas de Couro', nome_en: 'Leather Boots', nome_zh: '皮靴', categoria: 'Roupas', peso: 2, pa: 0, pv: 4, preco: 160 },
    { id: 'algemas_eletronicas', nome: 'Algemas Eletrônicas', nome_en: 'Electronic Handcuffs', nome_zh: '电子手铐', categoria: 'Diversos', peso: 1, pa: 3, pv: 2, preco: 800 },
    { id: 'tradutor_comunicador', nome: 'Tradutor-Comunicador', nome_en: 'Translator-Communicator', nome_zh: '翻译通讯器', categoria: 'Comunicação', peso: 1, pa: 0, pv: 2, preco: 7800 }
];


