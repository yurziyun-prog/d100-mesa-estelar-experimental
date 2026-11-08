/**
 * Pacote de mundo CALICO — conteúdo copiado (somente leitura) da Mesa
 * Estelar para dar ao gerador o vocabulário do planeta onde os jogadores
 * atuam. Fonte: js/app/12-calico-mundo.js, dados/banco_cenarios_*.csv e
 * _historia/historia-do-jogo.txt do projeto Mesa Estelar.
 *
 * O estilo `hibrido` (pedra + tecnologia) é a estética de Calico; por isso
 * os acréscimos de Calico são fundidos nas tabelas do estilo híbrido.
 */

// ---- calendário de Calico (de 12-calico-mundo.js) ----

export const CALICO_DIAS_SEMANA = [
  'Aurora', 'Vela', 'Forja', 'Peregrino', 'Coroa',
  'Nexo', 'Véspera', 'Farol', 'Órbita', 'Repouso',
] as const;

export const CALICO_ESTACOES = [
  'Estação dos Ventos', 'Estação das Brumas', 'Estação das Flores',
  'Estação do Sol Alto', 'Estação das Tempestades', 'Estação das Folhas',
  'Estação dos Meteoros', 'Estação das Estrelas',
] as const;

export const CALICO_FASES_LUA = [
  'Lua Nova', 'Fio de Prata', 'Crescente', 'Meia-lua Ascendente', 'Gibosa Clara',
  'Lua Cheia', 'Gibosa Tardia', 'Meia-lua Descendente', 'Minguante', 'Lua Escura',
] as const;

// ---- lugares do cenário (de banco_cenarios e da história) ----
// Usados como POIs de exterior e nomes de estabelecimentos/cenário.

export const CALICO_LUGARES = [
  'Bosque de Vidro-Pálido',
  'Feira Sem Luz',
  'Galeria de Íon',
  'Mar de Pedras',
  'Mercado das Cavidades',
  'Mercado das Mil Panelas',
  'Mina das Costelas de Ferro',
  'Palácio de Vaelkor',
  'Pátio das Sete Rodas',
  'Portão de Véspera',
  'Praça de Vallotton',
  'Ringue das Cavidades',
  'Ruas Escavadas de Véspera',
  'Serra dos Dentes Negros',
  'Arquivo Cívico de Véspera',
  'Clínica das Três Arcadas',
  'Cidade Baixa',
  'Cidade Alta',
] as const;

// ---- estabelecimentos do vocabulário de Véspera/Calico ----
// { usage, names, weight } — mesmo formato das tabelas de city/lore.ts.

export const CALICO_ESTABELECIMENTOS: { usage: string; names: string[]; weight: number }[] = [
  { usage: 'Arquivo cívico', names: ['Arquivo Cívico de Véspera', 'Cartório do Farol'], weight: 3 },
  { usage: 'Galeria de íon', names: ['Galeria de Íon', 'Salão das Arcadas'], weight: 4 },
  { usage: 'Mercado das cavidades', names: ['Mercado das Cavidades', 'Banca do Profundo'], weight: 6 },
  { usage: 'Mercado de panelas', names: ['Mercado das Mil Panelas', 'Panelas & Fios'], weight: 5 },
  { usage: 'Clínica', names: ['Clínica das Três Arcadas', 'Posto do Bálsamo'], weight: 4 },
  { usage: 'Ringue', names: ['Ringue das Cavidades', 'Arena do Trovão'], weight: 3 },
  { usage: 'Bateria de energia', names: ['A Última Bateria', 'Célula do Litoral'], weight: 3 },
  { usage: 'Armazém de caravana', names: ['Casa da Caravana', 'Armazém das Sete Rodas'], weight: 4 },
];

// ---- POIs de exterior por bioma, no vocabulário de Calico ----

export const CALICO_POIS: Record<string, string[]> = {
  floresta: ['Bosque de Vidro-Pálido', 'Clareira das Mil Panelas', 'Fonte das Três Arcadas'],
  penhasco: ['Mar de Pedras', 'Serra dos Dentes Negros', 'Laje do Farol'],
  campo: ['Pátio das Sete Rodas', 'Estrada da Caravana', 'Poço de Véspera'],
  mina: ['Mina das Costelas de Ferro', 'Galeria Quebrada do Íon', 'Carregamento da Última Bateria'],
};

// ---- detalhes sensoriais de dungeon no vocabulário de Calico ----

export const CALICO_DETALHES = [
  'poeira turquesa brilha nas frestas do piso de pedra',
  'um carimbo de Véspera marca a parede: seta e três pontos',
  'cabo de íon corrói entre blocos de cantaria antiga',
  'cheiro de ozônio misturado a incenso de forja',
  'graffiti: "a Cidade Alta observa"',
  'restos de fogueira de prospectores sobre lajes polidas',
  'um selo do Arquivo Cívico, rasgado, grudado na porta',
  'cristal bruto cresce através de um cano partido',
  'vozes baixas vindas de um ducto — ou só o vento de Calico',
  'marca de ferradura de caravana impressa no concreto mole',
];
