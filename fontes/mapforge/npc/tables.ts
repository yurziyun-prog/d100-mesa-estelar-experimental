/**
 * Tabelas d100 do mestre para Calico — traços, motivações, equipamento,
 * clima, encontros, complicações, armadilhas, charadas, recompensas e
 * descrições de cenário. Rolagens determinísticas via RNG do gerador.
 */

// ---- personalidade (2 traços: um forte, uma quirk) ----

export const TRACOS_PERSONALIDADE = [
  'fala pouco e mede cada palavra', 'coleciona moedas de estações passadas',
  'conta a mesma história de glória em todo taberna', 'desconfia de toda autoridade do Arquivo Cívico',
  'fascinado por tecnologia antiga da Cidade Alta', 'cumprimenta estranhos com uma reverência tribal',
  'ri alto demais das próprias piadas', 'anota tudo em um caderno de couro de cila',
  'ama negociar mais do que lucrar', 'tem pavor de galerias profundas desde a Mina',
  'semeia boatos por puro tédio', 'devoto das fases da lua, não trabalha na Lua Escura',
  'gentil com crianças e feras', 'ciumento do próprio ofício',
  'gabarola sobre parentesco distante com a Cidade Alta', 'sempre com fome, cheira toda comida antes',
  'supersticioso com números de estações', 'fala com o equipamento como se fosse gente',
  'nunca esquece uma cara — nem um desaforo', 'nostálgico da Estação dos Meteoros',
  'metódico a ponto de irritar aliados', 'impulsivo, aposta em qualquer coisa',
  'protege refugiados de tribos estrangeiras', 'coleciona grafias de grafite de Véspera',
  'voz mansa, mãos duras', 'conta prazos em dias de Calico (10 dias)',
  'tem um mapa falso da Cidade Baixa e jura que é real', 'simpatiza com metamorfos perseguidos',
  'odeia o som de trombetas (trauma com dragões)', 'guarda segredos como moeda',
  'filósofo de balcão sobre o destino de Calico', 'ansioso, verifica saídas ao entrar em qualquer sala',
  'orgulhoso de uma cicatriz de vespa de vidro', 'sedutor profissional, vende informação e charme',
  'leal a um chefe que talvez nem exista', 'trata robôs com cortesia cerimoniosa',
];

export const MOTIVACOES = [
  'quitar uma dívida com o Mercado das Cavidades',
  'encontrar um parente perdido na Cidade Baixa',
  'juntar créditos para passagem orbital',
  'vingar a queda de um mentor',
  'provar que a Cidade Alta esconde água potável',
  'escapar de um contrato com o Arquivo Cívico',
  'caçar a fera que destruiu sua caravana',
  'proteger um segredo tribal a qualquer custo',
  'recuperar uma relíquia roubada de sua gente',
  'ser reconhecido pelo próprio clã',
  'desvendar a origem das criaturas do Limo',
  'pagar a cura de um ente querido na Clínica',
  'livrar-se de um parasita silencioso',
  'comprar a liberdade de um camarada preso',
  'mapear um trecho inexplorado do Mar de Pedras',
  'encontrar um comprador para um artefato proibido',
  'esquecer o que viu nas Ruas Escavadas',
  'ascender de classe social, a qualquer preço',
  'manter a promessa feita sob a Lua Cheia',
  'impedir que um inimigo antigo volte a Véspera',
];

// ---- equipamento por papel (somado ao da carreira) ----

export const EQUIP_PLEBEU = [
  'saco de tecido com rações de viagem', 'cantil de água filtrada de Calico',
  'ferramenta simples do ofício', 'manta gasta contra as brumas',
  'moedas miúdas de estações antigas', 'corda de 10 metros',
  'lanterna de íon de segunda mão', 'amuleto tribal contra metamorfos',
];

export const EQUIP_MERCADOR = [
  'balança portátil e pesos certificados', 'caderno de débitos cifrado',
  'amostras de especiarias do Mercado das Mil Panelas', 'selos do Arquivo Cívico (alguns falsos)',
  'caixa forte pequena com fecho de íon', 'mapa de rotas de caravana desatualizado',
  'moedas de três sociedades diferentes', 'um bem de luxo proibido embrulhado',
];

export const EQUIP_COMBATE = [
  'lâmina curta de cerâmica', 'escudo de chapa dobrada',
  'bastão de choque de carga limitada', 'colete acolchoado reforçado',
  'binóculo de campanha', 'kit de primeiros socorros de campanha',
  'granada de fumaça turquesa', 'símbolo de unidade da guarda',
];

export const EQUIP_ELITE = [
  'arma de energia com reserva selada', 'blindagem leve de liga de Calico',
  'comunicador criptografado da Cidade Alta', 'contrato assinado pelo Arquivo Cívico',
  'drôme de escuta dobrável', 'antídoto para veneno de serpente sanguessuga',
  'chave mestra de um setor administrativo', 'relógio de pulso de fase lunar',
];

// ---- clima por estação (Estação dos Ventos etc., de calico.ts) ----

export const CLIMA_POR_ESTACAO: Record<string, string[]> = {
  'Estação dos Ventos': [
    'rajadas constantes carregando poeira turquesa dos planaltos',
    'vendaval de três dias derruba tendas de mercado',
    'vento frio do Mar de Pedras traz eco de trombetas distantes',
  ],
  'Estação das Brumas': [
    'névoa densa até meio-dia; predadores de névoa caçam mais perto dos trilhos',
    'garoa fina e fria, visibilidade de poucos metros',
    'bruma luminosa que faz luzes dançarem — os mais velhos dizem que é íon livre',
  ],
  'Estação das Flores': [
    'calor suave e pólen dourado cobrindo telhados de chapa',
    'chuvas curtas à tarde, cheiro de terra molhada nas Ruas Escavadas',
    'enxames de abelhas de vidro sobrevoam as plantações',
  ],
  'Estação do Sol Alto': [
    'sol implacável, sombra vale mais que água',
    'temperatura que derreita selante de portas de íon',
    'noites quentes com meteoros finos cruzando o céu',
  ],
  'Estação das Tempestades': [
    'tempestade de raios roxos anunciada por cheiro de ozônio',
    'chuva ácida leve — capuzes e selantes obrigatórios',
    'ciclone de poeira fecha estradas de caravana por dias',
  ],
  'Estação das Folhas': [
    'folhas de vidro-pálido caem como confete fosco',
    'manhãs frias, tardes mornas, geada nas sombras',
    'ventos secos levantam espirais de folhas perto do Bosque',
  ],
  'Estação dos Meteoros': [
    'chuva de meteoros visível a olho nu por três noites',
    'restos de meteoro esquentam carregamentos da Última Bateria',
    'céu verde-ferrugem; superstições dobram o preço de amuletos',
  ],
  'Estação das Estrelas': [
    'céu limpo e frio, estrelas duplas de Calico nítidas',
    'geada de íon cristaliza nas superfícies metálicas ao amanhecer',
    'silêncio estranho: até os dragões-trombeta calam',
  ],
};

// ---- encontros (genéricos + de criatura) ----

export const ENCONTROS_SOCIAIS = [
  'caravana de transportadores pede escolta até o próximo portão',
  'pregão improvisado do Mercado das Cavidades bloqueia a passagem',
  'patrulha da guarda urbana revista documentos de circulação',
  'peregrino tribal pede água e oferece uma previsão de lua em troca',
  'apostadores do Ringue das Cavidades recrutam para uma luta',
  'mensageira da Cidade Alta entrega um pacote selado a um dos heróis',
  'refugiados de um assentamento atacado pedem guia até Véspera',
  'antiquário oferece "o mapa verdadeiro" das Ruas Escavadas',
  'agente do Arquivo Cívico compra silêncio sobre o que o grupo viu',
  'grupo de mineradores em greve bloqueia a entrada da Mina',
];

export const COMPLICACOES = [
  'o encontro é uma emboscada disfarçada', 'uma terceira parte chega no pior momento',
  'o chão cede e revela uma galeria abaixo', 'um alarme de íon dispara e chama reforços',
  'a fera marcada retorna com a matilha inteira', 'alguém do grupo é reconhecido de um passado incômodo',
  'a negociação vira assalto em um instante', 'o guia some com o pagamento adiantado',
  'uma tempestade fecha as rotas de fuga', 'o que parecia vivo era um isco; o predador observa',
  'o caminho de volta mudou desde que passaram', 'uma criatura de névoa se alimenta do medo deles',
];

// ---- armadilhas ----

export const ARMADILHAS = [
  { nome: 'Placa de Pressão de Mina', gatilho: 'peso sobre placa disfarçada de laje',
    efeito: 'detona carga de demolição sob a vítima', evitar: 'Percepção ou Mineração', dano: '2d6+2' },
  { nome: 'Fio de Íon', gatilho: 'fio fino entre batentes de uma porta',
    efeito: 'arco elétrico atravessa quem passa', evitar: 'Percepção ou Operação Técnica', dano: '1d8+elétrico' },
  { nome: 'Poça de Limo', gatilho: 'película que finge ser piso sólido',
    efeito: 'afoga e dissolve lentamente', evitar: 'Percepção ou Atletismo para escapar', dano: '1d6/rodada' },
  { nome: 'Dardo de Cerâmica', gatilho: 'degrau falso em escada',
    efeito: 'dardos envenenados de paredes', evitar: 'Percepção ou Esquiva', dano: '1d4 + veneno' },
  { nome: 'Névoa Soporífera', gatilho: 'válvula no chão libera gás de bruma',
    efeito: 'sonolência e visões; adormecer é fatal', evitar: 'Resistência ou Vontade', dano: 'sopor' },
  { nome: 'Colmeia Falsa', gatilho: 'vaso ornamentado removido do pedestal',
    efeito: 'enxame mordedor emerge do teto', evitar: 'Conhecimento (fauna) ou furtividade', dano: '1d4/rodada (enxame)' },
  { nome: 'Porta Esmagadora', gatilho: 'mecanismo antigo ao abrir a fechadura errada',
    efeito: 'folha de pedra desliza e prende', evitar: 'Engenharia ou FOR Difícil', dano: '2d6 + aprisionar' },
  { nome: 'Eco de Pânico', gatilho: 'câmara ressonante no fim de corredor',
    efeito: 'som amplificado semeia pavor', evitar: 'Vontade ou Plugar ouvidos', dano: 'pânico' },
  { nome: 'Fenda Oculta', gatilho: 'laje solta sobre poço de ventilação',
    efeito: 'queda de 6 a 10 metros', evitar: 'Percepção ou Esquiva', dano: '1d6 por 3 m de queda' },
  { nome: 'Selo Psíquico', gatilho: 'símbolo gravado lido em voz alta',
    efeito: 'atordoamento mental de duração longa', evitar: 'Vontade ou não ler', dano: 'atordoamento' },
];

// ---- charadas de Calico ----

export const CHARADAS = [
  { pergunta: 'Tenho cidades sem casas, rios sem água e florestas sem árvores. O que sou?',
    resposta: 'Um mapa (e em Calico, um mapa BOM custa caro)' },
  { pergunta: 'Quanto mais você tira de mim, maior eu fico. O que sou?',
    resposta: 'Uma cova (pergunte à Mina das Costelas de Ferro)' },
  { pergunta: 'Corro sem pernas, grito sem boca, nasci da pedra e morro no vento. O que sou?',
    resposta: 'Um eco de trombeta' },
  { pergunta: 'Todos me carregam, ninguém me vê; sem mim a noite de Calico não tem maré. O que sou?',
    resposta: 'A lua (as fases governam marés e superstições)' },
  { pergunta: 'Falo todas as línguas sem boca, conto todos os segredos sem ouvido. O que sou?',
    resposta: 'Um livro do Arquivo Cívico' },
  { pergunta: 'Duas irmãs gemem sem voz, uma cega e outra surda; juntas móem o que ninguém vê. O que são?',
    resposta: 'As duas pedras de moinho' },
  { pergunta: 'Subo sempre e nunca chego, brilho de dia e morro à noite. O que sou?',
    resposta: 'O pó de íon suspenso sobre as Ruas Escavadas' },
  { pergunta: 'Quanto mais se enche, mais leve fica. O que sou?',
    resposta: 'Um balão de observação da Cidade Alta' },
];

// ---- recompensas ----

export const RECOMPENSAS_CREDITOS: [number, string][] = [
  [20, 'uma bolsa miúda: o pagamento some em dívidas no mesmo dia'],
  [50, 'créditos suficientes para uma semana de taberna e informação'],
  [120, 'o equivalente a um salário mensal de técnico de Véspera'],
  [300, 'paga uma passagem orbital ou compra silêncio de um agente'],
  [800, 'fortuna de caravana: muda a vida de um plebeu para sempre'],
  [2000, 'tesouro de contrabando: a Cidade Alta vai querer saber'],
];

export const RECOMPENSAS_ITENS = [
  'relíquia tribal com gravuras da chegada a Calico',
  'núcleo de íon bruto do tamanho de um punho',
  'mapa autenticado das Ruas Escavadas (trecho inédito)',
  'arma de cerâmica cerimonial da guarda do portão',
  'frasco de essência de trombeta (valor incalculável para alquimistas)',
  'drôme de escuta da Cidade Alta, ainda funcional',
  'pedra lunar polida que brilha na Lua Escura',
  'contrato de dívida assinado por alguém importante',
  'cristal de vidro-pálido cultivado (raro em tamanho grande)',
  'selo de passagem livre pelo Portão de Véspera',
];

// ---- descrições de cenário rápidas ----

export const DESCRICOES_CENARIO = [
  'Restos de acampamento de prospectores: cinzas frias, três marcas de tenda e um mapa rasgado pregado num espeto.',
  'Um letreiro de íon pisca "FEIRA SEM LUZ →" apontando para um túnel que cheira a ozônio.',
  'Lajes de pedra antigas sustentam cabos de energia novos; a Cidade Alta cresceu por cima da velha Véspera.',
  'Marcas de garras altas demais para qualquer fera conhecida cruzam o caminho de leste a oeste.',
  'Uma carroça abandonada, ainda com carga lacrada: ninguém voltou para buscá-la.',
  'Pilares de uma era anterior formam um pátio onde o mercado improvisado monta e desmonta a cada lua.',
  'Água escura pinga de um cano rompido, formando uma poça que reflete uma lua que não está no céu.',
  'Grafite recente: "OS METEOROS MENTEM" — abaixo, selo do Arquivo Cívico tentando cobri-lo.',
  'Ossos de cila limpos pelo sol jazem em círculo perfeito, como se alguém os tivesse arrumado.',
  'Uma banca de mercador intacta: moedas na gaveta, poeira em tudo, e nenhuma pegada saindo do local.',
];
