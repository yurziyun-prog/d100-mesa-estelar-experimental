/**
 * Dados compilados dos bancos da Mesa Estelar (CSV → TS por
 * `scripts/build-npc-data.py`). GERADO — não editar à mão; reexecute o script
 * quando os bancos forem atualizados. Origem: `dados/banco_*.csv`.
 */

export interface SilabasRaca { inicio: string[]; meio: string[]; fim: string[] }

export interface RacaData {
  nome: string;
  sociedade: string;
  descricaoFisica: string;
  nomesExemplo: string[];
  silabas: SilabasRaca;
}

export interface CarreiraData {
  nome: string;
  classes: string[];
  conceitos: string[];
  pericias: { nome: string; valor: number }[];
}

export interface CriaturaData {
  id: string;
  nome: string;
  especie: string;
  habitat: string;
  comportamento: string;
  tamanho: string;
  atributos: { FOR: number; CON: number; TAM: number; DES: number; INT: number; POD: number; CAR: number };
  pericias: Record<string, number>;
  armas: string[];
  habilidades: string[];
  armaduraNatural: number;
  deslocamento: number;
  movimentoVoo: number;
  movimentoNatacao: number;
  descricao: string;
}

export interface PericiaData {
  id: string;
  nome: string;
  categoria: string;
  formula: string;
}

export const RACAS: RacaData[] = [
  {
    "nome": "Arisian",
    "sociedade": "Vesperana",
    "descricaoFisica": "Arisian adulto cuja forma biológica se assemelha a um grande organismo cerebral com pequenos apêndices.",
    "nomesExemplo": [
      "Aren Se"
    ],
    "silabas": {
      "inicio": [
        "A",
        "S"
      ],
      "meio": [
        "ae",
        "r"
      ],
      "fim": [
        "Om",
        "e",
        "en"
      ]
    }
  },
  {
    "nome": "Reptiliano",
    "sociedade": "Vesperana",
    "descricaoFisica": "Reptiliano velho e paciente que administra quartos para viajantes.",
    "nomesExemplo": [
      "Boro Tann"
    ],
    "silabas": {
      "inicio": [
        "B",
        "G",
        "T"
      ],
      "meio": [
        "an",
        "o",
        "r"
      ],
      "fim": [
        "n",
        "o",
        "ok"
      ]
    }
  },
  {
    "nome": "Humanoide",
    "sociedade": "Vesperana",
    "descricaoFisica": "Soldado profissional treinado para manter a calma sob fogo e operar em equipe.",
    "nomesExemplo": [
      "Daren Holt"
    ],
    "silabas": {
      "inicio": [
        "D",
        "H",
        "K",
        "L",
        "M",
        "N",
        "R",
        "S",
        "T",
        "V",
        "Y"
      ],
      "meio": [
        "a",
        "ae",
        "e",
        "en",
        "es",
        "ex",
        "i",
        "ol",
        "or",
        "os"
      ],
      "fim": [
        "a",
        "an",
        "ek",
        "en",
        "ey",
        "ia",
        "ir",
        "n",
        "o",
        "os",
        "r",
        "s",
        "t",
        "uk"
      ]
    }
  },
  {
    "nome": "Insetoide",
    "sociedade": "Vesperana",
    "descricaoFisica": "Insetoide de quatro braços que trabalha no Portão de Véspera.",
    "nomesExemplo": [
      "Denzel"
    ],
    "silabas": {
      "inicio": [
        "D",
        "K",
        "T",
        "V"
      ],
      "meio": [
        "en",
        "es",
        "k",
        "or"
      ],
      "fim": [
        "a",
        "ar",
        "el",
        "h",
        "ik"
      ]
    }
  },
  {
    "nome": "Humana",
    "sociedade": "Vesperana",
    "descricaoFisica": "Médica experiente da Clínica das Três Arcadas, prática e pouco paciente com desperdício de suprimentos.",
    "nomesExemplo": [
      "Dra. Ilya Nemer"
    ],
    "silabas": {
      "inicio": [
        "Il",
        "K",
        "N",
        "S",
        "V"
      ],
      "meio": [
        "a",
        "e",
        "en",
        "i",
        "or",
        "y"
      ],
      "fim": [
        "a",
        "er",
        "n",
        "r"
      ]
    }
  },
  {
    "nome": "Humanoide parasitado",
    "sociedade": "Vesperana",
    "descricaoFisica": "Hospedeiro morto pouco antes da infestação.",
    "nomesExemplo": [
      "Eren Vos"
    ],
    "silabas": {
      "inicio": [
        "E",
        "S",
        "V"
      ],
      "meio": [
        "a",
        "e",
        "r"
      ],
      "fim": [
        "e",
        "en",
        "ik",
        "os"
      ]
    }
  },
  {
    "nome": "Robô",
    "sociedade": "0",
    "descricaoFisica": "Máquina colossal concebida para enfrentar ameaças de escala militar e criaturas gigantes.",
    "nomesExemplo": [
      "GXR-01"
    ],
    "silabas": {
      "inicio": [
        "G",
        "K",
        "UT"
      ],
      "meio": [
        "X"
      ],
      "fim": [
        "R",
        "UT"
      ]
    }
  },
  {
    "nome": "Blyntzyn",
    "sociedade": "Vesperana",
    "descricaoFisica": "Blyntzyn minúscula e orgânica que administra uma loja de suprimentos em Véspera.",
    "nomesExemplo": [
      "Hessa Varn"
    ],
    "silabas": {
      "inicio": [
        "H",
        "V"
      ],
      "meio": [
        "ar",
        "es"
      ],
      "fim": [
        "a",
        "n"
      ]
    }
  },
  {
    "nome": "Robô pilotado",
    "sociedade": "0",
    "descricaoFisica": "Chassis robótico humanoide utilizado por Hessa Varn.",
    "nomesExemplo": [
      "HV-4"
    ],
    "silabas": {
      "inicio": [
        "H"
      ],
      "meio": [],
      "fim": [
        "V"
      ]
    }
  },
  {
    "nome": "Nymari",
    "sociedade": "Vesperana",
    "descricaoFisica": "Nymari de anatomia claramente alienígena, com feições apenas discretamente leporinas, sem parecer um coelho ou goblin.",
    "nomesExemplo": [
      "Meral-Ti"
    ],
    "silabas": {
      "inicio": [
        "M",
        "R"
      ],
      "meio": [
        "e",
        "h"
      ],
      "fim": [
        "el",
        "i"
      ]
    }
  },
  {
    "nome": "Grey Alto",
    "sociedade": "Vesperana",
    "descricaoFisica": "Grey alto de membros extremamente longos que trabalha levando documentos e pequenas encomendas entre os diferentes níveis de Véspera.",
    "nomesExemplo": [
      "Omm"
    ],
    "silabas": {
      "inicio": [
        "Om",
        "Z"
      ],
      "meio": [
        "ar"
      ],
      "fim": [
        "m",
        "n"
      ]
    }
  },
  {
    "nome": "Talássio",
    "sociedade": "Vesperana",
    "descricaoFisica": "Alienígena anfíbio de pele azul-acinzentada.",
    "nomesExemplo": [
      "Oru Pell"
    ],
    "silabas": {
      "inicio": [
        "O",
        "P"
      ],
      "meio": [
        "el",
        "r"
      ],
      "fim": [
        "l",
        "u"
      ]
    }
  },
  {
    "nome": "Grey Pequeno",
    "sociedade": "Vesperana",
    "descricaoFisica": "Grey pequeno de corpo franzino, cabeça grande e olhos negros.",
    "nomesExemplo": [
      "Pell Aru"
    ],
    "silabas": {
      "inicio": [
        "A",
        "P"
      ],
      "meio": [
        "el",
        "r"
      ],
      "fim": [
        "l",
        "u"
      ]
    }
  },
  {
    "nome": "Aeral",
    "sociedade": "Estrangeira",
    "descricaoFisica": "Alienígena de ossatura leve e membranas planadoras.",
    "nomesExemplo": [
      "Seyra Keth"
    ],
    "silabas": {
      "inicio": [
        "K",
        "S"
      ],
      "meio": [
        "et",
        "ey"
      ],
      "fim": [
        "a",
        "h"
      ]
    }
  },
  {
    "nome": "Zutariano",
    "sociedade": "Vesperana",
    "descricaoFisica": "Pequeno Zutariano, um humanoide alienígena de pele esverdeada, que trabalha nas pedreiras e túneis próximos de Véspera.",
    "nomesExemplo": [
      "Tor Vask"
    ],
    "silabas": {
      "inicio": [
        "R",
        "T",
        "Ul",
        "V"
      ],
      "meio": [
        "as",
        "k"
      ],
      "fim": [
        "a",
        "en",
        "k",
        "or"
      ]
    }
  },
  {
    "nome": "Robô imperial",
    "sociedade": "Vesperana",
    "descricaoFisica": "Robô imperial gasto pelo tempo que administra A Última Bateria.",
    "nomesExemplo": [
      "UR-17"
    ],
    "silabas": {
      "inicio": [
        "UR"
      ],
      "meio": [],
      "fim": [
        "UR"
      ]
    }
  }
];

export const CARREIRAS: CarreiraData[] = [
  {
    "nome": "Administrador de taberna",
    "classes": [
      "Mercante"
    ],
    "conceitos": [
      "Robô antigo que administra A Última Bateria e quartos anexos"
    ],
    "pericias": [
      {
        "nome": "Comércio",
        "valor": 32
      },
      {
        "nome": "Influência",
        "valor": 18
      },
      {
        "nome": "Insight",
        "valor": 30
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 48
      },
      {
        "nome": "Percepção",
        "valor": 30
      },
      {
        "nome": "Pesquisa",
        "valor": 28
      }
    ]
  },
  {
    "nome": "Agente",
    "classes": [
      "0",
      "Profissional"
    ],
    "conceitos": [
      "Operativa clandestina",
      "Servo consciente do Lorde"
    ],
    "pericias": [
      {
        "nome": "Furtividade",
        "valor": 36
      },
      {
        "nome": "Enganação",
        "valor": 38
      },
      {
        "nome": "Percepção",
        "valor": 32
      },
      {
        "nome": "Insight",
        "valor": 29
      },
      {
        "nome": "Influência",
        "valor": 30
      },
      {
        "nome": "Costumes",
        "valor": 28
      },
      {
        "nome": "Atletismo",
        "valor": 29
      }
    ]
  },
  {
    "nome": "Analista psíquico",
    "classes": [
      "Profissional"
    ],
    "conceitos": [
      "Intelectual itinerante em tanque ambulante"
    ],
    "pericias": [
      {
        "nome": "Meditação",
        "valor": 45
      },
      {
        "nome": "Insight",
        "valor": 35
      },
      {
        "nome": "Pesquisa",
        "valor": 32
      },
      {
        "nome": "Influência",
        "valor": 35
      },
      {
        "nome": "Percepção",
        "valor": 19
      },
      {
        "nome": "Costumes",
        "valor": 17
      }
    ]
  },
  {
    "nome": "Antiquário",
    "classes": [
      "Profissional"
    ],
    "conceitos": [
      "Historiador amador e colecionador"
    ],
    "pericias": [
      {
        "nome": "Pesquisa",
        "valor": 34
      },
      {
        "nome": "História",
        "valor": 32
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 29
      },
      {
        "nome": "Percepção",
        "valor": 23
      },
      {
        "nome": "Insight",
        "valor": 26
      },
      {
        "nome": "Comércio",
        "valor": 23
      },
      {
        "nome": "Costumes",
        "valor": 27
      }
    ]
  },
  {
    "nome": "Arma estratégica",
    "classes": [
      "0"
    ],
    "conceitos": [
      "Plataforma de combate gigante"
    ],
    "pericias": [
      {
        "nome": "Artilharia",
        "valor": 53
      },
      {
        "nome": "Pilotagem",
        "valor": 68
      },
      {
        "nome": "Percepção",
        "valor": 47
      },
      {
        "nome": "Engenharia",
        "valor": 33
      },
      {
        "nome": "Atletismo",
        "valor": 0
      },
      {
        "nome": "Navegação",
        "valor": 32
      },
      {
        "nome": "Resistência",
        "valor": 0
      }
    ]
  },
  {
    "nome": "Atendente",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Atendente da Última Bateria"
    ],
    "pericias": [
      {
        "nome": "Influência",
        "valor": 28
      },
      {
        "nome": "Insight",
        "valor": 30
      },
      {
        "nome": "Comércio",
        "valor": 18
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 36
      },
      {
        "nome": "Percepção",
        "valor": 26
      }
    ]
  },
  {
    "nome": "Bisca",
    "classes": [
      "Pária"
    ],
    "conceitos": [
      "Criança de rua esperta"
    ],
    "pericias": [
      {
        "nome": "Furtividade",
        "valor": 31
      },
      {
        "nome": "Prestidigitação",
        "valor": 31
      },
      {
        "nome": "Percepção",
        "valor": 31
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 32
      },
      {
        "nome": "Enganação",
        "valor": 27
      },
      {
        "nome": "Atletismo",
        "valor": 33
      },
      {
        "nome": "Influência",
        "valor": 18
      }
    ]
  },
  {
    "nome": "Cambista",
    "classes": [
      "Mercante"
    ],
    "conceitos": [
      "Intermediário de moedas e mercadorias estrangeiras"
    ],
    "pericias": [
      {
        "nome": "Comércio",
        "valor": 36
      },
      {
        "nome": "Insight",
        "valor": 34
      },
      {
        "nome": "Influência",
        "valor": 29
      },
      {
        "nome": "Enganação",
        "valor": 26
      },
      {
        "nome": "Costumes",
        "valor": 30
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 29
      },
      {
        "nome": "Percepção",
        "valor": 23
      }
    ]
  },
  {
    "nome": "Caçador",
    "classes": [
      "Tribal"
    ],
    "conceitos": [
      "Caçador-coletor tribal"
    ],
    "pericias": [
      {
        "nome": "Atletismo",
        "valor": 25
      },
      {
        "nome": "Percepção",
        "valor": 37
      },
      {
        "nome": "Furtividade",
        "valor": 13
      },
      {
        "nome": "Rastrear",
        "valor": 17
      },
      {
        "nome": "Sobrevivência",
        "valor": 34
      },
      {
        "nome": "Arremesso",
        "valor": 19
      },
      {
        "nome": "Resistência",
        "valor": 21
      }
    ]
  },
  {
    "nome": "Chassis civil",
    "classes": [
      "0"
    ],
    "conceitos": [
      "Corpo robótico de interação social e trabalho"
    ],
    "pericias": [
      {
        "nome": "Atletismo",
        "valor": 19
      },
      {
        "nome": "Percepção",
        "valor": 42
      },
      {
        "nome": "Operação Técnica",
        "valor": 22
      },
      {
        "nome": "Combate Desarmado",
        "valor": 13
      }
    ]
  },
  {
    "nome": "Combate",
    "classes": [
      "0"
    ],
    "conceitos": [
      "Unidade autônoma de eliminação"
    ],
    "pericias": [
      {
        "nome": "Percepção",
        "valor": 55
      },
      {
        "nome": "Engenharia",
        "valor": 49
      },
      {
        "nome": "Atletismo",
        "valor": 1
      },
      {
        "nome": "Esquiva",
        "valor": 18
      },
      {
        "nome": "Estratégia",
        "valor": 14
      },
      {
        "nome": "Conduzir",
        "valor": 57
      },
      {
        "nome": "Furtividade",
        "valor": 26
      }
    ]
  },
  {
    "nome": "Comerciante",
    "classes": [
      "Mercante"
    ],
    "conceitos": [
      "Mercadora que opera através de um chassis humanoide",
      "Corretora de contrabando e armas",
      "Mercador insetoide residente"
    ],
    "pericias": [
      {
        "nome": "Comércio",
        "valor": 36
      },
      {
        "nome": "Influência",
        "valor": 28
      },
      {
        "nome": "Insight",
        "valor": 28
      },
      {
        "nome": "Percepção",
        "valor": 25
      },
      {
        "nome": "Costumes",
        "valor": 22
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 25
      },
      {
        "nome": "Furtividade",
        "valor": 22
      }
    ]
  },
  {
    "nome": "Conselheira",
    "classes": [
      "aristocrata"
    ],
    "conceitos": [
      "chefe da cidade"
    ],
    "pericias": []
  },
  {
    "nome": "Estalajadeiro",
    "classes": [
      "Mercante"
    ],
    "conceitos": [
      "Dono de hospedaria modesta"
    ],
    "pericias": [
      {
        "nome": "Influência",
        "valor": 25
      },
      {
        "nome": "Insight",
        "valor": 32
      },
      {
        "nome": "Comércio",
        "valor": 25
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 35
      },
      {
        "nome": "Percepção",
        "valor": 23
      }
    ]
  },
  {
    "nome": "Guarda do portão",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Veterano do controle de entrada"
    ],
    "pericias": [
      {
        "nome": "Percepção",
        "valor": 30
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 33
      },
      {
        "nome": "Insight",
        "valor": 22
      },
      {
        "nome": "Influência",
        "valor": 22
      },
      {
        "nome": "Vontade",
        "valor": 24
      },
      {
        "nome": "Combate Desarmado",
        "valor": 20
      }
    ]
  },
  {
    "nome": "Guarda urbana",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Patrulheira comum"
    ],
    "pericias": [
      {
        "nome": "Percepção",
        "valor": 24
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 27
      },
      {
        "nome": "Atletismo",
        "valor": 19
      },
      {
        "nome": "Vontade",
        "valor": 19
      }
    ]
  },
  {
    "nome": "Lutador",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Brutamontes profissional disciplinado",
      "Veterano calculista de alcance incomum"
    ],
    "pericias": [
      {
        "nome": "Atletismo",
        "valor": 28
      },
      {
        "nome": "Percepção",
        "valor": 30
      },
      {
        "nome": "Vontade",
        "valor": 28
      },
      {
        "nome": "Combate Desarmado",
        "valor": 34
      },
      {
        "nome": "Resistência",
        "valor": 33
      },
      {
        "nome": "Insight",
        "valor": 30
      }
    ]
  },
  {
    "nome": "Lutadora",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Combatente técnica e favorita das apostas"
    ],
    "pericias": [
      {
        "nome": "Atletismo",
        "valor": 36
      },
      {
        "nome": "Esquiva",
        "valor": 29
      },
      {
        "nome": "Percepção",
        "valor": 26
      },
      {
        "nome": "Insight",
        "valor": 23
      },
      {
        "nome": "Vontade",
        "valor": 25
      },
      {
        "nome": "Combate Desarmado",
        "valor": 37
      }
    ]
  },
  {
    "nome": "Mecânica",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Especialista em motores e veículos leves"
    ],
    "pericias": [
      {
        "nome": "Mecânica",
        "valor": 34
      },
      {
        "nome": "Engenharia",
        "valor": 27
      },
      {
        "nome": "Operação Técnica",
        "valor": 31
      },
      {
        "nome": "Comércio",
        "valor": 24
      },
      {
        "nome": "Percepção",
        "valor": 28
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 25
      },
      {
        "nome": "Pesquisa",
        "valor": 16
      }
    ]
  },
  {
    "nome": "Mecânico",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Técnico de veículos e máquinas antigas"
    ],
    "pericias": [
      {
        "nome": "Engenharia",
        "valor": 30
      },
      {
        "nome": "Operação Técnica",
        "valor": 36
      },
      {
        "nome": "Percepção",
        "valor": 24
      },
      {
        "nome": "Comércio",
        "valor": 23
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 21
      }
    ]
  },
  {
    "nome": "Mensageira",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Correio e informante alienígena"
    ],
    "pericias": [
      {
        "nome": "Furtividade",
        "valor": 33
      },
      {
        "nome": "Atletismo",
        "valor": 39
      },
      {
        "nome": "Percepção",
        "valor": 35
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 31
      },
      {
        "nome": "Insight",
        "valor": 28
      },
      {
        "nome": "Enganação",
        "valor": 26
      },
      {
        "nome": "Influência",
        "valor": 24
      }
    ]
  },
  {
    "nome": "Mensageiro",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Entregador especializado nos níveis verticais da cidade"
    ],
    "pericias": [
      {
        "nome": "Locale (Véspera)",
        "valor": 40
      },
      {
        "nome": "Atletismo",
        "valor": 33
      },
      {
        "nome": "Percepção",
        "valor": 31
      },
      {
        "nome": "Condução",
        "valor": 23
      },
      {
        "nome": "Furtividade",
        "valor": 18
      },
      {
        "nome": "Insight",
        "valor": 21
      }
    ]
  },
  {
    "nome": "Mercador Ambulante",
    "classes": [
      "Mercante"
    ],
    "conceitos": [
      "Responsável por uma pequena rede de caravanas"
    ],
    "pericias": [
      {
        "nome": "Comércio",
        "valor": 32
      },
      {
        "nome": "Influência",
        "valor": 25
      },
      {
        "nome": "Logística",
        "valor": 32
      },
      {
        "nome": "Conduzir",
        "valor": 26
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 28
      },
      {
        "nome": "Percepção",
        "valor": 20
      }
    ]
  },
  {
    "nome": "Mercante",
    "classes": [
      "Mercante"
    ],
    "conceitos": [
      "Comerciante estabelecido"
    ],
    "pericias": [
      {
        "nome": "Comércio",
        "valor": 32
      },
      {
        "nome": "Influência",
        "valor": 25
      },
      {
        "nome": "Insight",
        "valor": 25
      },
      {
        "nome": "Costumes",
        "valor": 31
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 29
      },
      {
        "nome": "Percepção",
        "valor": 18
      },
      {
        "nome": "Enganação",
        "valor": 19
      }
    ]
  },
  {
    "nome": "Mercenário",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Veterano de conflitos pós-imperiais"
    ],
    "pericias": [
      {
        "nome": "Percepção",
        "valor": 26
      },
      {
        "nome": "Atletismo",
        "valor": 23
      },
      {
        "nome": "Resistência",
        "valor": 24
      },
      {
        "nome": "Vontade",
        "valor": 22
      },
      {
        "nome": "Furtividade",
        "valor": 20
      },
      {
        "nome": "Primeiros Socorros",
        "valor": 18
      },
      {
        "nome": "Sobrevivência",
        "valor": 19
      }
    ]
  },
  {
    "nome": "Minerador",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Minerador veterano que evita galerias profundas",
      "Operário especializado em galerias estreitas"
    ],
    "pericias": [
      {
        "nome": "Mineração",
        "valor": 39
      },
      {
        "nome": "Atletismo",
        "valor": 23
      },
      {
        "nome": "Percepção",
        "valor": 30
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 25
      },
      {
        "nome": "Resistência",
        "valor": 26
      },
      {
        "nome": "Sobrevivência",
        "valor": 22
      },
      {
        "nome": "Operação Técnica",
        "valor": 29
      }
    ]
  },
  {
    "nome": "Médico",
    "classes": [
      "Profissional"
    ],
    "conceitos": [
      "Responsável pela Clínica das Três Arcadas"
    ],
    "pericias": [
      {
        "nome": "Medicina",
        "valor": 40
      },
      {
        "nome": "Primeiros Socorros",
        "valor": 42
      },
      {
        "nome": "Pesquisa",
        "valor": 30
      },
      {
        "nome": "Percepção",
        "valor": 28
      },
      {
        "nome": "Insight",
        "valor": 26
      },
      {
        "nome": "Comércio",
        "valor": 12
      }
    ]
  },
  {
    "nome": "Soldado",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Infante experiente"
    ],
    "pericias": [
      {
        "nome": "Atletismo",
        "valor": 21
      },
      {
        "nome": "Percepção",
        "valor": 20
      },
      {
        "nome": "Resistência",
        "valor": 23
      },
      {
        "nome": "Primeiros Socorros",
        "valor": 14
      },
      {
        "nome": "Conduzir",
        "valor": 20
      },
      {
        "nome": "Furtividade",
        "valor": 14
      },
      {
        "nome": "Vontade",
        "valor": 26
      }
    ]
  },
  {
    "nome": "Trabalho/Manutenção",
    "classes": [
      "0"
    ],
    "conceitos": [
      "Unidade técnica utilitária"
    ],
    "pericias": [
      {
        "nome": "Operação Técnica",
        "valor": 51
      },
      {
        "nome": "Engenharia",
        "valor": 49
      },
      {
        "nome": "Percepção",
        "valor": 37
      },
      {
        "nome": "Atletismo",
        "valor": 11
      },
      {
        "nome": "Furtividade",
        "valor": 11
      },
      {
        "nome": "Pilotagem",
        "valor": 26
      },
      {
        "nome": "Insight",
        "valor": 22
      }
    ]
  },
  {
    "nome": "Transportador",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Motorista de carga e operador de veículos"
    ],
    "pericias": [
      {
        "nome": "Condução",
        "valor": 36
      },
      {
        "nome": "Navegação",
        "valor": 30
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 32
      },
      {
        "nome": "Comércio",
        "valor": 25
      },
      {
        "nome": "Mecânica",
        "valor": 23
      },
      {
        "nome": "Percepção",
        "valor": 28
      },
      {
        "nome": "Sobrevivência",
        "valor": 20
      }
    ]
  },
  {
    "nome": "Técnico de energia",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Manutenção da infraestrutura urbana"
    ],
    "pericias": [
      {
        "nome": "Operação Técnica",
        "valor": 30
      },
      {
        "nome": "Engenharia",
        "valor": 25
      },
      {
        "nome": "Percepção",
        "valor": 22
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 23
      },
      {
        "nome": "Atletismo",
        "valor": 20
      }
    ]
  },
  {
    "nome": "Técnico de instrumentos",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Reparador de sensores e equipamentos pequenos"
    ],
    "pericias": [
      {
        "nome": "Eletrônica",
        "valor": 32
      },
      {
        "nome": "Engenharia",
        "valor": 24
      },
      {
        "nome": "Operação Técnica",
        "valor": 29
      },
      {
        "nome": "Percepção",
        "valor": 27
      },
      {
        "nome": "Comércio",
        "valor": 19
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 19
      },
      {
        "nome": "Pesquisa",
        "valor": 14
      }
    ]
  },
  {
    "nome": "Técnico portuário",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Anfíbio especializado em sistemas hidráulicos"
    ],
    "pericias": [
      {
        "nome": "Operação Técnica",
        "valor": 40
      },
      {
        "nome": "Engenharia",
        "valor": 34
      },
      {
        "nome": "Percepção",
        "valor": 27
      },
      {
        "nome": "Insight",
        "valor": 23
      },
      {
        "nome": "Atletismo",
        "valor": 23
      },
      {
        "nome": "Costumes",
        "valor": 26
      },
      {
        "nome": "Locale (Véspera)",
        "valor": 32
      }
    ]
  }
];

export const CRIATURAS: CriaturaData[] = [
  {
    "id": "besta_ululante",
    "nome": "Besta Ululante",
    "especie": "Predador quimérico aparentado ao Dragão-Trombeta",
    "habitat": "Planícies, ermos rochosos, florestas abertas e regiões de caça",
    "comportamento": "Ápice predatório; caça por perseguição, atropelamento e desorientação acústica",
    "tamanho": "Grande",
    "atributos": {
      "FOR": 28,
      "CON": 20,
      "TAM": 24,
      "DES": 16,
      "INT": 6,
      "POD": 12,
      "CAR": 4
    },
    "pericias": {
      "Atletismo": 58,
      "Percepção": 62,
      "Furtividade": 28,
      "Esquiva": 46,
      "Resistência": 68,
      "Vontade": 48,
      "Combate Desarmado": 69
    },
    "armas": [
      "Mordida de Serpente:1d8+MD",
      "Patada/Pisotear:1d10+MD",
      "Eco da Matilha:0"
    ],
    "habilidades": [
      "quadrupede,grande,robusto; Eco da Matilha é um efeito sonoro especial e não o alcance normal das armas naturais."
    ],
    "armaduraNatural": 4,
    "deslocamento": 8,
    "movimentoVoo": 0,
    "movimentoNatacao": 2,
    "descricao": "Grande predador quimérico aparentado ao Dragão-Trombeta."
  },
  {
    "id": "caçador_de_nevoa",
    "nome": "Caçador de Névoa",
    "especie": "Predador crepuscular",
    "habitat": "Pântanos e regiões de neblina",
    "comportamento": "Emboscador silencioso",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 13,
      "CON": 14,
      "TAM": 12,
      "DES": 20,
      "INT": 6,
      "POD": 11,
      "CAR": 4
    },
    "pericias": {
      "Furtividade": 70,
      "Percepção": 60,
      "Atletismo": 55
    },
    "armas": [
      "Garras:1d6+MD",
      "Mordida:1d6+MD"
    ],
    "habilidades": [
      "bipede,emboscador"
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Predador genérico para regiões úmidas ou de baixa visibilidade."
  },
  {
    "id": "cadaver_de_chefe",
    "nome": "Cadáver Chefe",
    "especie": "Humanoide parasitado",
    "habitat": "Arredores de Véspera",
    "comportamento": "Alimentar-se",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 13,
      "CON": 13,
      "TAM": 12,
      "DES": 10,
      "INT": 8,
      "POD": 8,
      "CAR": 7
    },
    "pericias": {
      "Combate Desarmado": 26,
      "Percepção": 21,
      "Resistência": 33,
      "Atletismo": 16,
      "Vontade": 26,
      "Furtividade": 16,
      "Rastrear": 22
    },
    "armas": [
      "Mordida:1d6+MD",
      "Garras:1d4+MD"
    ],
    "habilidades": [
      "bipede,morto_vivo_parasitado; mordida exige contato muito próximo."
    ],
    "armaduraNatural": 0,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 1,
    "descricao": "Cadáver relativamente recente animado pelo parasita."
  },
  {
    "id": "zumbi_1",
    "nome": "Cadáver de trabalhador",
    "especie": "Humanoide parasitado",
    "habitat": "Arredores de Véspera",
    "comportamento": "Alimentar-se",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 10,
      "CON": 10,
      "TAM": 10,
      "DES": 10,
      "INT": 10,
      "POD": 10,
      "CAR": 10
    },
    "pericias": {
      "Combate Desarmado": 26,
      "Percepção": 21,
      "Resistência": 33,
      "Atletismo": 16,
      "Vontade": 26,
      "Furtividade": 16,
      "Rastrear": 22
    },
    "armas": [
      "Mordida:1d6+MD",
      "Garras:1d4+MD"
    ],
    "habilidades": [
      "bipede,morto_vivo_parasitado; mordida exige contato muito próximo."
    ],
    "armaduraNatural": 0,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 1,
    "descricao": "Cadáver relativamente recente animado pelo parasita."
  },
  {
    "id": "carrapato_de_ferro",
    "nome": "Carrapato de Ferro",
    "especie": "Parasita de carapaça",
    "habitat": "Túneis, sucata, ninhos e carcaças",
    "comportamento": "Aproxima-se escondido, fixa-se no alvo e tenta permanecer preso",
    "tamanho": "Minúsculo",
    "atributos": {
      "FOR": 5,
      "CON": 13,
      "TAM": 3,
      "DES": 13,
      "INT": 2,
      "POD": 8,
      "CAR": 1
    },
    "pericias": {
      "Furtividade": 55,
      "Percepção": 32,
      "Escalada": 50,
      "Resistência": 35,
      "Combate Desarmado": 30
    },
    "armas": [
      "Mordida:1d3"
    ],
    "habilidades": [
      "minusculo,parasita,aderente"
    ],
    "armaduraNatural": 2,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Parasita genérico resistente e discreto."
  },
  {
    "id": "cavalgante_prismatico",
    "nome": "Cavalgante Prismático",
    "especie": "Fauna psíquica",
    "habitat": "Planícies e regiões abertas",
    "comportamento": "Social, sensitivo e potencialmente domesticável",
    "tamanho": "Grande",
    "atributos": {
      "FOR": 17,
      "CON": 16,
      "TAM": 18,
      "DES": 15,
      "INT": 7,
      "POD": 18,
      "CAR": 12
    },
    "pericias": {
      "Atletismo": 72,
      "Esquiva": 50,
      "Percepção": 72
    },
    "armas": [
      "Coice:1d8+MD",
      "Chifrada Sensorial:1d6+MD"
    ],
    "habilidades": [
      "antenas_psiquicas",
      "empatia_de_manada",
      "montaria",
      "sensor_hostilidade"
    ],
    "armaduraNatural": 2,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Grande herbívoro alienígena multicolorido, de longas antenas sensoriais e anatomia adequada à montaria."
  },
  {
    "id": "cila",
    "nome": "Cila",
    "especie": "Organismo animal séssil de crescimento litófilo",
    "habitat": "Ilhas, falésias, montanhas, cavernas, asteroides e estruturas rochosas no espaço",
    "comportamento": "Territorial e séssil; seis pescoços caçam independentemente dentro da zona de alcance",
    "tamanho": "Titânico",
    "atributos": {
      "FOR": 65,
      "CON": 50,
      "TAM": 80,
      "DES": 17,
      "INT": 7,
      "POD": 18,
      "CAR": 2
    },
    "pericias": {
      "Percepção": 72,
      "Resistência": 82,
      "Vontade": 64
    },
    "armas": [
      "Bote de Presa Cirúrgico:1d10+MD"
    ],
    "habilidades": [
      "sessil,titanico,imune_derrubar,camuflagem_rochosa; imóvel depois do início do combate, mas livremente posicionável na preparação."
    ],
    "armaduraNatural": 8,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Organismo colossal de carne que ocupa um nicho semelhante ao de uma planta séssil: fixa-se permanentemente a rocha, montanha, falésia, asteroide ou outro substrato e se reproduz por estruturas semelhantes a sementes que brotam."
  },
  {
    "id": "dragao_trombeta_alado_domesticado",
    "nome": "Dragão-Trombeta Alado Domesticado",
    "especie": "Trombetídeo alado domesticado",
    "habitat": "Assentamentos, criadouros e rotas",
    "comportamento": "Treinado; menos agressivo e menor que a forma selvagem",
    "tamanho": "Muito Grande",
    "atributos": {
      "FOR": 23,
      "CON": 21,
      "TAM": 25,
      "DES": 15,
      "INT": 8,
      "POD": 12,
      "CAR": 6
    },
    "pericias": {
      "Atletismo": 58,
      "Percepção": 55,
      "Resistência": 62,
      "Esquiva": 44,
      "Combate Desarmado": 64
    },
    "armas": [
      "Mordida:2d6+MD",
      "Garras:1d8+MD",
      "Trombeta:1d6"
    ],
    "habilidades": [
      "alado,muito_grande,robusto,domesticado; Trombeta afeta cone, arrasta/empurra e causa surdez por 1d20 rodadas."
    ],
    "armaduraNatural": 4,
    "deslocamento": 0,
    "movimentoVoo": 9,
    "movimentoNatacao": 0,
    "descricao": "Variante domesticada do trombetídeo alado."
  },
  {
    "id": "dragao_trombeta_alado_selvagem",
    "nome": "Dragão-Trombeta Alado Selvagem",
    "especie": "Trombetídeo alado",
    "habitat": "Ermos, escarpas e planícies abertas",
    "comportamento": "Predador territorial; usa o bramido antes da investida",
    "tamanho": "Enorme",
    "atributos": {
      "FOR": 28,
      "CON": 24,
      "TAM": 30,
      "DES": 14,
      "INT": 7,
      "POD": 14,
      "CAR": 5
    },
    "pericias": {
      "Atletismo": 65,
      "Percepção": 60,
      "Resistência": 70,
      "Esquiva": 48,
      "Combate Desarmado": 72
    },
    "armas": [
      "Mordida:2d8+MD",
      "Garras:1d10+MD",
      "Trombeta:1d8"
    ],
    "habilidades": [
      "alado,muito_grande,robusto; Trombeta afeta cone, arrasta/empurra e causa surdez por 1d20 rodadas."
    ],
    "armaduraNatural": 4,
    "deslocamento": 0,
    "movimentoVoo": 10,
    "movimentoNatacao": 0,
    "descricao": "Grande trombetídeo selvagem."
  },
  {
    "id": "dragao_trombeta_corredor_domesticado",
    "nome": "Dragão-Trombeta Corredor Domesticado",
    "especie": "Trombetídeo corredor domesticado",
    "habitat": "Assentamentos e criadouros",
    "comportamento": "Treinado, alerta e relativamente manejável",
    "tamanho": "Grande",
    "atributos": {
      "FOR": 16,
      "CON": 15,
      "TAM": 16,
      "DES": 20,
      "INT": 9,
      "POD": 11,
      "CAR": 6
    },
    "pericias": {
      "Atletismo": 70,
      "Percepção": 58,
      "Furtividade": 45,
      "Esquiva": 54,
      "Resistência": 52,
      "Combate Desarmado": 60
    },
    "armas": [
      "Mordida:1d8+MD",
      "Garras:1d4+MD",
      "Trombeta:1d4"
    ],
    "habilidades": [
      "bipede,corredor,grande,domesticado; ligeiramente maior que um humano; sem asas; Trombeta causa surdez por 1d20 rodadas."
    ],
    "armaduraNatural": 3,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 2,
    "descricao": "Forma domesticada e reduzida do trombetídeo corredor."
  },
  {
    "id": "dragao_trombeta_corredor_selvagem",
    "nome": "Dragão-Trombeta Corredor Selvagem",
    "especie": "Trombetídeo corredor",
    "habitat": "Campos secos, ruínas e matas abertas",
    "comportamento": "Caçador bípede veloz, geralmente investe após o bramido",
    "tamanho": "Grande",
    "atributos": {
      "FOR": 19,
      "CON": 17,
      "TAM": 18,
      "DES": 22,
      "INT": 8,
      "POD": 12,
      "CAR": 5
    },
    "pericias": {
      "Atletismo": 76,
      "Percepção": 62,
      "Furtividade": 52,
      "Esquiva": 58,
      "Resistência": 58,
      "Combate Desarmado": 68
    },
    "armas": [
      "Mordida:1d10+MD",
      "Garras:1d6+MD",
      "Trombeta:1d6"
    ],
    "habilidades": [
      "bipede,corredor,grande; sem asas; dois braços pequenos; Trombeta causa surdez por 1d20 rodadas."
    ],
    "armaduraNatural": 3,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 2,
    "descricao": "Trombetídeo bípede não alado, de silhueta semelhante à de um grande predador corredor."
  },
  {
    "id": "enxame_mordedor",
    "nome": "Enxame Mordedor",
    "especie": "Enxame de pequenos organismos",
    "habitat": "Qualquer ambiente onde existam alimento e abrigo",
    "comportamento": "Cerca fontes de alimento e recua diante de fogo, fumaça ou perturbações intensas",
    "tamanho": "Enxame",
    "atributos": {
      "FOR": 7,
      "CON": 12,
      "TAM": 8,
      "DES": 18,
      "INT": 2,
      "POD": 8,
      "CAR": 1
    },
    "pericias": {
      "Furtividade": 45,
      "Percepção": 30,
      "Esquiva": 45,
      "Sobrevivência": 40,
      "Resistência": 30,
      "Combate Desarmado": 32
    },
    "armas": [
      "Mordidas:1d4"
    ],
    "habilidades": [
      "enxame,imune_derrubar"
    ],
    "armaduraNatural": 0,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Modelo genérico para representar dezenas ou centenas de pequenos animais como uma única ameaça de combate."
  },
  {
    "id": "escavador_de_carapaca",
    "nome": "Escavador de Carapaça",
    "especie": "Fauna escavadora blindada",
    "habitat": "Desertos rochosos, minas e galerias subterrâneas",
    "comportamento": "Defende território e reage violentamente a vibrações",
    "tamanho": "Grande",
    "atributos": {
      "FOR": 23,
      "CON": 22,
      "TAM": 21,
      "DES": 8,
      "INT": 3,
      "POD": 12,
      "CAR": 2
    },
    "pericias": {
      "Percepção": 38,
      "Resistência": 48,
      "Atletismo": 30,
      "Sobrevivência": 45,
      "Combate Desarmado": 42
    },
    "armas": [
      "Mandíbulas:1d10+MD",
      "Investida:1d8+MD"
    ],
    "habilidades": [
      "quadrupede,grande,robusto,escavador"
    ],
    "armaduraNatural": 6,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Modelo genérico de criatura grande e resistente para encontros em túneis ou terreno aberto."
  },
  {
    "id": "insetoide_predador",
    "nome": "Insetoide Predador",
    "especie": "Insetoide",
    "habitat": "Subterrâneo, ruínas e zonas industriais",
    "comportamento": "Predador de emboscada",
    "tamanho": "Grande",
    "atributos": {
      "FOR": 16,
      "CON": 17,
      "TAM": 14,
      "DES": 18,
      "INT": 5,
      "POD": 10,
      "CAR": 3
    },
    "pericias": {
      "Atletismo": 55,
      "Percepção": 58,
      "Furtividade": 62,
      "Resistência": 55
    },
    "armas": [
      "Mandíbulas:1d8+MD",
      "Garras:1d6+MD"
    ],
    "habilidades": [
      "insetoide,bipede"
    ],
    "armaduraNatural": 3,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Modelo genérico de criatura insetoide predatória."
  },
  {
    "id": "larva_interdimensional",
    "nome": "Larva Interdimensional",
    "especie": "Fauna psíquica extradimensional",
    "habitat": "Regiões isoladas e locais de anomalia",
    "comportamento": "Curiosa, evasiva e enigmática; raramente hostil",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 7,
      "CON": 13,
      "TAM": 11,
      "DES": 13,
      "INT": 8,
      "POD": 20,
      "CAR": 10
    },
    "pericias": {
      "Esquiva": 62,
      "Furtividade": 58,
      "Percepção": 78
    },
    "armas": [
      "Toque:1d3"
    ],
    "habilidades": [
      "passagem_interdimensional",
      "desaparecer_dimensional",
      "reaparecer_dimensional",
      "misteriosa",
      "nao_predatoria"
    ],
    "armaduraNatural": 0,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Criatura semelhante ao mesmo tempo a uma coruja e a uma larva de borboleta."
  },
  {
    "id": "criatura_de_calico_2",
    "nome": "Limo de Calico",
    "especie": "Organismo amorfo",
    "habitat": "Calico",
    "comportamento": "Consumir matéria orgânica e evitar ambientes hostis",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 14,
      "CON": 20,
      "TAM": 13,
      "DES": 6,
      "INT": 4,
      "POD": 10,
      "CAR": 1
    },
    "pericias": {
      "Furtividade": 52,
      "Percepção": 34,
      "Resistência": 42,
      "Sobrevivência": 44,
      "Combate Desarmado": 35
    },
    "armas": [
      "Engolfar:1d6+MD",
      "Pseudópode:1d6+MD"
    ],
    "habilidades": [
      "amorfo,imune_derrubar,imune_sangramento"
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Massa colonial amorfa nativa de Calico."
  },
  {
    "id": "criatura_de_calico_1",
    "nome": "Macaco de Calico",
    "especie": "Fauna de Calico",
    "habitat": "Calico",
    "comportamento": "Defender território, alimento e grupo",
    "tamanho": "Enorme",
    "atributos": {
      "FOR": 28,
      "CON": 22,
      "TAM": 25,
      "DES": 11,
      "INT": 6,
      "POD": 12,
      "CAR": 4
    },
    "pericias": {
      "Atletismo": 39,
      "Combate Desarmado": 35,
      "Percepção": 49,
      "Sobrevivência": 44,
      "Resistência": 31,
      "Furtividade": 29
    },
    "armas": [
      "Punhos:1d8+MD",
      "Mordida:1d8+MD",
      "Pedra arremessada:1d8+MD"
    ],
    "habilidades": [
      "bipede,enorme,robusto"
    ],
    "armaduraNatural": 2,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Grande criatura semi-inteligente de Calico, vagamente primatoide, com quatro braços poderosos e corpo adaptado a escalada e deslocamento entre formações rochosas."
  },
  {
    "id": "metamorfo_generico",
    "nome": "Metamorfo Genérico",
    "especie": "Animal parasitado / quimera",
    "habitat": "Variável",
    "comportamento": "Predador adaptativo; incorpora traços das presas",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 16,
      "CON": 15,
      "TAM": 13,
      "DES": 15,
      "INT": 8,
      "POD": 12,
      "CAR": 5
    },
    "pericias": {
      "Atletismo": 65,
      "Esquiva": 58,
      "Furtividade": 68,
      "Percepção": 58
    },
    "armas": [
      "Mordida:1d6+MD",
      "Garras:1d8+MD"
    ],
    "habilidades": [
      "parasita_metamorfo",
      "metamorfose",
      "incorporar_presa",
      "imitacao_humana_apos_consumo",
      "vulneravel_sol_intenso",
      "coracao_paralisante",
      "vulneravel_prata"
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Animal transformado pelo parasita."
  },
  {
    "id": "metamorfo_psiquico",
    "nome": "Metamorfo Psíquico",
    "especie": "Animal parasitado / quimera psíquica",
    "habitat": "Variável",
    "comportamento": "Predador adaptativo e psíquico",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 15,
      "CON": 14,
      "TAM": 13,
      "DES": 16,
      "INT": 10,
      "POD": 17,
      "CAR": 6
    },
    "pericias": {
      "Atletismo": 60,
      "Esquiva": 62,
      "Furtividade": 72,
      "Percepção": 66
    },
    "armas": [
      "Mordida:1d6+MD",
      "Garras:1d8+MD"
    ],
    "habilidades": [
      "parasita_metamorfo",
      "metamorfose",
      "incorporar_presa",
      "imitacao_humana_apos_consumo",
      "psiquico",
      "vulneravel_sol_intenso",
      "coracao_paralisante",
      "vulneravel_prata"
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Metamorfo em que a infecção também produz capacidades psíquicas."
  },
  {
    "id": "montariapterodatil",
    "nome": "Montaria Pterodátilo",
    "especie": "",
    "habitat": "",
    "comportamento": "",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 10,
      "CON": 10,
      "TAM": 10,
      "DES": 10,
      "INT": 5,
      "POD": 10,
      "CAR": 5
    },
    "pericias": {},
    "armas": [],
    "habilidades": [],
    "armaduraNatural": 0,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": ""
  },
  {
    "id": "parasita_carniceiro",
    "nome": "Parasita Carniceiro",
    "especie": "Artrópode parasita",
    "habitat": "Cadáveres, esgotos e depósitos orgânicos",
    "comportamento": "Aglomera-se sobre feridos e carniça",
    "tamanho": "Pequeno",
    "atributos": {
      "FOR": 6,
      "CON": 10,
      "TAM": 5,
      "DES": 16,
      "INT": 2,
      "POD": 8,
      "CAR": 1
    },
    "pericias": {
      "Furtividade": 58,
      "Percepção": 42
    },
    "armas": [
      "Mordida:1d4"
    ],
    "habilidades": [
      "pequeno,parasita"
    ],
    "armaduraNatural": 0,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Pequeno parasita genérico para encontros em enxames ou áreas contaminadas."
  },
  {
    "id": "predador_couracado",
    "nome": "Predador Couraçado",
    "especie": "Réptil couraçado",
    "habitat": "Desertos rochosos e ermos",
    "comportamento": "Territorial; investe quando ameaçado",
    "tamanho": "Grande",
    "atributos": {
      "FOR": 22,
      "CON": 21,
      "TAM": 22,
      "DES": 11,
      "INT": 4,
      "POD": 12,
      "CAR": 3
    },
    "pericias": {
      "Atletismo": 48,
      "Percepção": 46,
      "Resistência": 68
    },
    "armas": [
      "Mordida:1d10+MD",
      "Cauda:1d8+MD"
    ],
    "habilidades": [
      "quadrupede,grande,robusto"
    ],
    "armaduraNatural": 7,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Predador pesado genérico de Calico, adequado para ser duplicado e especializado."
  },
  {
    "id": "predador_de_nevoa",
    "nome": "Predador de Névoa",
    "especie": "Caçador de emboscada",
    "habitat": "Pântanos, florestas úmidas e áreas de baixa visibilidade",
    "comportamento": "Evita confronto aberto, aproxima-se oculto e ataca alvos separados",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 16,
      "CON": 15,
      "TAM": 14,
      "DES": 17,
      "INT": 5,
      "POD": 13,
      "CAR": 3
    },
    "pericias": {
      "Furtividade": 58,
      "Percepção": 46,
      "Rastrear": 50,
      "Atletismo": 36,
      "Esquiva": 38,
      "Resistência": 34,
      "Combate Desarmado": 40
    },
    "armas": [
      "Garras:1d6+MD",
      "Mordida:1d6+MD"
    ],
    "habilidades": [
      "bipede,emboscador"
    ],
    "armaduraNatural": 0,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Predador genérico de emboscada."
  },
  {
    "id": "insetoide_predador_1",
    "nome": "Predador de Véspera",
    "especie": "Insetoide",
    "habitat": "Ermos de Véspera",
    "comportamento": "Caçar, alimentar-se e defender o ninho",
    "tamanho": "Pesado",
    "atributos": {
      "FOR": 20,
      "CON": 18,
      "TAM": 17,
      "DES": 15,
      "INT": 5,
      "POD": 13,
      "CAR": 2
    },
    "pericias": {
      "Percepção": 57,
      "Furtividade": 45,
      "Atletismo": 35,
      "Resistência": 36,
      "Rastrear": 45,
      "Vontade": 34,
      "Esquiva": 25,
      "Sobrevivência": 47,
      "Combate Desarmado": 35
    },
    "armas": [
      "Mandíbulas:1d8+MD",
      "Garras:1d6+MD",
      "Ferrão:1d6+MD"
    ],
    "habilidades": [
      "insetoide,grande,robusto"
    ],
    "armaduraNatural": 4,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Predador hexápode de carapaça escura que caça por vibração e odor."
  },
  {
    "id": "rastejante_de_cinzas",
    "nome": "Rastejante de Cinzas",
    "especie": "Predador hexápode",
    "habitat": "Ruínas, cavernas e zonas industriais",
    "comportamento": "Caça em pequenos grupos e recua quando isolado",
    "tamanho": "Pequeno",
    "atributos": {
      "FOR": 9,
      "CON": 11,
      "TAM": 8,
      "DES": 16,
      "INT": 4,
      "POD": 9,
      "CAR": 2
    },
    "pericias": {
      "Furtividade": 48,
      "Percepção": 42,
      "Atletismo": 38,
      "Esquiva": 40,
      "Rastrear": 35,
      "Resistência": 28,
      "Combate Desarmado": 34
    },
    "armas": [
      "Mordida:1d4+MD",
      "Garras:1d4+MD"
    ],
    "habilidades": [
      "pequeno,rastejante"
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Modelo genérico de predador pequeno e ágil."
  },
  {
    "id": "serpente_sanguessuga",
    "nome": "Serpente Sanguessuga",
    "especie": "Parasita anfíbio; possível parentesco remoto com a linhagem parasitária de vampiros, zumbis e metamorfos",
    "habitat": "Masmorras, florestas densas, pântanos, cavernas e outros planetas; tolera exposição ao vácuo",
    "comportamento": "Emboscador parasitário; prende membros, usa o hospedeiro como proteção e drena sangue e fluidos",
    "tamanho": "Pequeno e longo",
    "atributos": {
      "FOR": 18,
      "CON": 14,
      "TAM": 6,
      "DES": 18,
      "INT": 3,
      "POD": 10,
      "CAR": 1
    },
    "pericias": {
      "Furtividade": 64,
      "Atletismo": 44,
      "Esquiva": 44,
      "Resistência": 32,
      "Percepção": 27,
      "Vontade": 30
    },
    "armas": [
      "Bote e Constrição:1d4",
      "Drenagem de Sangue:1d6"
    ],
    "habilidades": [
      "anfibio,parasita,alongado,aderente; imune ao parasita de vampiros/zumbis/metamorfos; sobrevive ao vácuo."
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 6,
    "descricao": "Parasita anfíbio extremamente ágil."
  },
  {
    "id": "vampiro_generico",
    "nome": "Vampiro Genérico",
    "especie": "Hospedeiro racional parasitado",
    "habitat": "Assentamentos e ruínas habitadas",
    "comportamento": "Predador racional; preserva inteligência e memórias do hospedeiro",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 15,
      "CON": 15,
      "TAM": 12,
      "DES": 14,
      "INT": 12,
      "POD": 12,
      "CAR": 8
    },
    "pericias": {
      "Atletismo": 58,
      "Esquiva": 55,
      "Furtividade": 62,
      "Percepção": 58
    },
    "armas": [
      "Mordida:1d6+MD",
      "Garras:1d6+MD"
    ],
    "habilidades": [
      "parasita_vampirico",
      "regeneracao",
      "hematofagia",
      "vulneravel_sol_intenso",
      "coracao_paralisante",
      "vulneravel_prata"
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Hospedeiro racional vivo transformado pelo parasita."
  },
  {
    "id": "vampiro_psiquico",
    "nome": "Vampiro Psíquico",
    "especie": "Hospedeiro racional parasitado",
    "habitat": "Assentamentos e ruínas habitadas",
    "comportamento": "Predador racional, manipulador e sensitivo",
    "tamanho": "Médio",
    "atributos": {
      "FOR": 14,
      "CON": 14,
      "TAM": 12,
      "DES": 14,
      "INT": 14,
      "POD": 17,
      "CAR": 10
    },
    "pericias": {
      "Atletismo": 52,
      "Esquiva": 55,
      "Furtividade": 65,
      "Percepção": 65
    },
    "armas": [
      "Mordida:1d6+MD",
      "Garras:1d6+MD"
    ],
    "habilidades": [
      "parasita_vampirico",
      "regeneracao",
      "hematofagia",
      "vulneravel_sol_intenso",
      "coracao_paralisante",
      "vulneravel_prata",
      "psiquico"
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Variante vampírica em que a simbiose parasitária manifesta capacidades psíquicas, sobretudo nas esferas Mente e Sentidos."
  },
  {
    "id": "vespa_de_vidro",
    "nome": "Vespa de Vidro",
    "especie": "Insetoide voador",
    "habitat": "Penhascos, estruturas altas e áreas quentes",
    "comportamento": "Territorial; ataca rapidamente e tenta manter distância",
    "tamanho": "Pequeno",
    "atributos": {
      "FOR": 6,
      "CON": 9,
      "TAM": 5,
      "DES": 19,
      "INT": 3,
      "POD": 10,
      "CAR": 2
    },
    "pericias": {
      "Voo": 55,
      "Percepção": 45,
      "Esquiva": 50,
      "Furtividade": 32,
      "Resistência": 24,
      "Combate Desarmado": 38
    },
    "armas": [
      "Ferrão:1d4",
      "Mandíbulas:1d3"
    ],
    "habilidades": [
      "voador,pequeno"
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 7,
    "movimentoNatacao": 0,
    "descricao": "Modelo genérico de predador voador."
  }
];

export const PERICIAS: PericiaData[] = [
  {
    "id": "adestramento",
    "nome": "Adestramento",
    "categoria": "Animais",
    "formula": "CAR+POD"
  },
  {
    "id": "agricultura",
    "nome": "Agricultura",
    "categoria": "Sobrevivência",
    "formula": "INT+CON"
  },
  {
    "id": "anatomia",
    "nome": "Anatomia",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "animais",
    "nome": "Animais",
    "categoria": "Sobrevivência",
    "formula": "INT+CAR"
  },
  {
    "id": "armeiro",
    "nome": "Armeiro",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "arte",
    "nome": "Arte",
    "categoria": "Técnica",
    "formula": "INT+CAR"
  },
  {
    "id": "astrologia",
    "nome": "Astrologia",
    "categoria": "Conhecimento",
    "formula": "INT+POD"
  },
  {
    "id": "astronavegacao",
    "nome": "Astronavegação",
    "categoria": "Veículos",
    "formula": "INT*2"
  },
  {
    "id": "atletismo",
    "nome": "Atletismo",
    "categoria": "Física",
    "formula": "FOR+DES"
  },
  {
    "id": "avaliacao",
    "nome": "Avaliação",
    "categoria": "Conhecimento",
    "formula": "INT+POD"
  },
  {
    "id": "canto",
    "nome": "Canto",
    "categoria": "Social",
    "formula": "CAR+POD"
  },
  {
    "id": "cartografia",
    "nome": "Cartografia",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "cavalgar",
    "nome": "Cavalgar",
    "categoria": "Veículos",
    "formula": "DES+CAR"
  },
  {
    "id": "cibernetica",
    "nome": "Cibernética",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "ciber_seguranca",
    "nome": "Cibersegurança",
    "categoria": "Técnica",
    "formula": "INT*2"
  },
  {
    "id": "combate_desarmado",
    "nome": "Combate Desarmado",
    "categoria": "Combate",
    "formula": "FOR+DES"
  },
  {
    "id": "comercio",
    "nome": "Comércio",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "computadores",
    "nome": "Computação",
    "categoria": "Técnica",
    "formula": "INT*2"
  },
  {
    "id": "comunicacoes",
    "nome": "Comunicações",
    "categoria": "Técnica",
    "formula": "INT+CAR"
  },
  {
    "id": "conduzir",
    "nome": "Condução de Veículos",
    "categoria": "Veículos",
    "formula": "DES+INT"
  },
  {
    "id": "conhecimentos_gerais",
    "nome": "Conhecimentos Gerais",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "saber",
    "nome": "Conhecimentos Gerais",
    "categoria": "",
    "formula": "INT*2"
  },
  {
    "id": "saber_lore",
    "nome": "Conhecimentos Gerais [Cultura Imperial]",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "criptografia",
    "nome": "Criptografia",
    "categoria": "Técnica",
    "formula": "INT*2"
  },
  {
    "id": "danca",
    "nome": "Dança",
    "categoria": "Social",
    "formula": "DES+CAR"
  },
  {
    "id": "demolicoes",
    "nome": "Demolições",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "direito",
    "nome": "Direito",
    "categoria": "Conhecimento",
    "formula": "INT+CAR"
  },
  {
    "id": "disfarce",
    "nome": "Disfarce",
    "categoria": "Manipulação",
    "formula": "INT+CAR"
  },
  {
    "id": "economia",
    "nome": "Economia",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "eletronica",
    "nome": "Eletrônica",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "dissimulacao",
    "nome": "Enganação",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "engenharia",
    "nome": "Engenharia",
    "categoria": "Técnica",
    "formula": "INT*2"
  },
  {
    "id": "ensino",
    "nome": "Ensino",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "esquiva",
    "nome": "Esquiva",
    "categoria": "Combate",
    "formula": "DES*2"
  },
  {
    "id": "estrategia",
    "nome": "Estratégia",
    "categoria": "Conhecimento",
    "formula": "INT+POD"
  },
  {
    "id": "cortesia",
    "nome": "Etiqueta",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "exotecnologia",
    "nome": "Exotecnologia",
    "categoria": "Técnica",
    "formula": "INT*2"
  },
  {
    "id": "falsificacao",
    "nome": "Falsificação",
    "categoria": "Manipulação",
    "formula": "DES+INT"
  },
  {
    "id": "bancario",
    "nome": "Finanças",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "forca_bruta",
    "nome": "Força Bruta",
    "categoria": "Física",
    "formula": "FOR+TAM"
  },
  {
    "id": "forca_vontade",
    "nome": "Força de Vontade",
    "categoria": "Psi",
    "formula": "POD*2"
  },
  {
    "id": "furtividade",
    "nome": "Furtividade",
    "categoria": "Furtividade",
    "formula": "DES+INT"
  },
  {
    "id": "historia",
    "nome": "História",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "genealogia",
    "nome": "História [Genealogia]",
    "categoria": "Acadêmica",
    "formula": "INT*2"
  },
  {
    "id": "heraldismo",
    "nome": "História [Heraldismo]",
    "categoria": "Acadêmica",
    "formula": "INT*2"
  },
  {
    "id": "idiomas",
    "nome": "Idiomas",
    "categoria": "Conhecimento",
    "formula": "INT+CAR"
  },
  {
    "id": "lingua_antiga",
    "nome": "Idiomas [Língua Antiga]",
    "categoria": "Conhecimento",
    "formula": "INT+CAR"
  },
  {
    "id": "influencia",
    "nome": "Influência",
    "categoria": "Social",
    "formula": "CAR*2"
  },
  {
    "id": "interrogatorio",
    "nome": "Interrogatório",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "intimidacao",
    "nome": "Intimidação",
    "categoria": "Social",
    "formula": "POD+MAIOR"
  },
  {
    "id": "intuicao",
    "nome": "Intuição",
    "categoria": "Percepção",
    "formula": "INT+POD"
  },
  {
    "id": "ganhos_jogos",
    "nome": "Jogos e Apostas",
    "categoria": "Manipulação",
    "formula": "INT+POD"
  },
  {
    "id": "comando",
    "nome": "Liderança",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "lingua_nativa",
    "nome": "Língua Nativa",
    "categoria": "Conhecimento",
    "formula": "INT+CAR+40"
  },
  {
    "id": "linguistica",
    "nome": "Linguística",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "logistica",
    "nome": "Logística",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "mecanica",
    "nome": "Mecânica",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "mecanismos",
    "nome": "Mecanismos",
    "categoria": "Técnica",
    "formula": "DES+INT"
  },
  {
    "id": "medicina",
    "nome": "Medicina",
    "categoria": "Técnica",
    "formula": "INT*2"
  },
  {
    "id": "meditacao",
    "nome": "Meditação",
    "categoria": "Psi",
    "formula": "CON+POD"
  },
  {
    "id": "transe",
    "nome": "Meditação [Transe]",
    "categoria": "Mental",
    "formula": "CON+POD"
  },
  {
    "id": "mineracao",
    "nome": "Mineração",
    "categoria": "Técnica",
    "formula": "INT+FOR"
  },
  {
    "id": "musica",
    "nome": "Música",
    "categoria": "Social",
    "formula": "DES+CAR"
  },
  {
    "id": "natacao",
    "nome": "Natação",
    "categoria": "Física",
    "formula": "FOR+CON"
  },
  {
    "id": "navegacao",
    "nome": "Navegação",
    "categoria": "Veículos",
    "formula": "INT*2"
  },
  {
    "id": "ocultar_itens",
    "nome": "Ocultar Itens",
    "categoria": "Furtividade",
    "formula": "DES*2"
  },
  {
    "id": "oratoria",
    "nome": "Oratória",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "percepcao",
    "nome": "Percepção",
    "categoria": "Percepção",
    "formula": "INT+POD"
  },
  {
    "id": "pesquisa",
    "nome": "Pesquisa",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "pilotagem",
    "nome": "Pilotagem",
    "categoria": "Veículos",
    "formula": "DES+INT"
  },
  {
    "id": "politica",
    "nome": "Política",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "primeiros_socorros",
    "nome": "Primeiros Socorros",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "psicologia",
    "nome": "Psicologia",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "rastrear",
    "nome": "Rastrear",
    "categoria": "Sobrevivência",
    "formula": "INT+POD"
  },
  {
    "id": "regiao",
    "nome": "Região",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "resistencia",
    "nome": "Resistência",
    "categoria": "Sobrevivência",
    "formula": "CON*2"
  },
  {
    "id": "robotica",
    "nome": "Robótica",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "seducao",
    "nome": "Sedução",
    "categoria": "Social",
    "formula": "POD+CAR"
  },
  {
    "id": "seguranca",
    "nome": "Segurança",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "cofres_fechaduras",
    "nome": "Segurança [Cofres e Fechaduras]",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "sensoriamento",
    "nome": "Sensoriamento",
    "categoria": "Técnica",
    "formula": "INT*2"
  },
  {
    "id": "sistemas_defensivos",
    "nome": "Sistemas Defensivos",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "sistemas_escudo",
    "nome": "Sistemas Defensivos [Legado]",
    "categoria": "Técnica",
    "formula": "INT+DES"
  },
  {
    "id": "sobrevivencia",
    "nome": "Sobrevivência",
    "categoria": "Sobrevivência",
    "formula": "INT+CON"
  },
  {
    "id": "sobrevivencia_espacial",
    "nome": "Sobrevivência [Espacial]",
    "categoria": "Sobrevivência",
    "formula": "INT+CON"
  },
  {
    "id": "submundo",
    "nome": "Submundo",
    "categoria": "Furtividade",
    "formula": "POD+CAR"
  },
  {
    "id": "tatica",
    "nome": "Tática",
    "categoria": "Combate",
    "formula": "INT+POD"
  },
  {
    "id": "teatro",
    "nome": "Teatro",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "costumes",
    "nome": "Tradição",
    "categoria": "Conhecimento",
    "formula": "INT*2+40"
  },
  {
    "id": "xenobiologia",
    "nome": "Xenobiologia",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  }
];
