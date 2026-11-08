/* GERADO por scripts/empacotar-npc-motor.cjs a partir de fontes/mapforge (MapForge, MIT). Não edite aqui. */
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// fontes/mapforge/rng.ts
var RNG = class {
  constructor(seed) {
    __publicField(this, "s");
    this.s = seed >>> 0;
  }
  /** float em [0, 1) */
  next() {
    this.s = this.s + 1831565813 >>> 0;
    let t = this.s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(min, max) {
    return min + this.next() * (max - min);
  }
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  chance(p) {
    return this.next() < p;
  }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  /** gaussiano aproximado em [-1, 1] */
  jitter(amount) {
    return (this.next() + this.next() + this.next() - 1.5) * amount;
  }
};
function hashSeed(str) {
  let h1 = 3735928559;
  let h2 = 1103547991;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return (h2 >>> 0) * 2 + (h1 >>> 31);
}

// fontes/mapforge/npc/data.ts
var RACAS = [
  {
    "nome": "Arisian",
    "sociedade": "Vesperana",
    "descricaoFisica": "Arisian adulto cuja forma biol\xF3gica se assemelha a um grande organismo cerebral com pequenos ap\xEAndices.",
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
    "descricaoFisica": "Insetoide de quatro bra\xE7os que trabalha no Port\xE3o de V\xE9spera.",
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
    "descricaoFisica": "M\xE9dica experiente da Cl\xEDnica das Tr\xEAs Arcadas, pr\xE1tica e pouco paciente com desperd\xEDcio de suprimentos.",
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
    "descricaoFisica": "Hospedeiro morto pouco antes da infesta\xE7\xE3o.",
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
    "nome": "Rob\xF4",
    "sociedade": "0",
    "descricaoFisica": "M\xE1quina colossal concebida para enfrentar amea\xE7as de escala militar e criaturas gigantes.",
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
    "descricaoFisica": "Blyntzyn min\xFAscula e org\xE2nica que administra uma loja de suprimentos em V\xE9spera.",
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
    "nome": "Rob\xF4 pilotado",
    "sociedade": "0",
    "descricaoFisica": "Chassis rob\xF3tico humanoide utilizado por Hessa Varn.",
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
    "descricaoFisica": "Nymari de anatomia claramente alien\xEDgena, com fei\xE7\xF5es apenas discretamente leporinas, sem parecer um coelho ou goblin.",
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
    "descricaoFisica": "Grey alto de membros extremamente longos que trabalha levando documentos e pequenas encomendas entre os diferentes n\xEDveis de V\xE9spera.",
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
    "nome": "Tal\xE1ssio",
    "sociedade": "Vesperana",
    "descricaoFisica": "Alien\xEDgena anf\xEDbio de pele azul-acinzentada.",
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
    "descricaoFisica": "Grey pequeno de corpo franzino, cabe\xE7a grande e olhos negros.",
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
    "descricaoFisica": "Alien\xEDgena de ossatura leve e membranas planadoras.",
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
    "descricaoFisica": "Pequeno Zutariano, um humanoide alien\xEDgena de pele esverdeada, que trabalha nas pedreiras e t\xFAneis pr\xF3ximos de V\xE9spera.",
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
    "nome": "Rob\xF4 imperial",
    "sociedade": "Vesperana",
    "descricaoFisica": "Rob\xF4 imperial gasto pelo tempo que administra A \xDAltima Bateria.",
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
var CARREIRAS = [
  {
    "nome": "Administrador de taberna",
    "classes": [
      "Mercante"
    ],
    "conceitos": [
      "Rob\xF4 antigo que administra A \xDAltima Bateria e quartos anexos"
    ],
    "pericias": [
      {
        "nome": "Com\xE9rcio",
        "valor": 32
      },
      {
        "nome": "Influ\xEAncia",
        "valor": 18
      },
      {
        "nome": "Insight",
        "valor": 30
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 48
      },
      {
        "nome": "Percep\xE7\xE3o",
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
        "nome": "Engana\xE7\xE3o",
        "valor": 38
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 32
      },
      {
        "nome": "Insight",
        "valor": 29
      },
      {
        "nome": "Influ\xEAncia",
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
    "nome": "Analista ps\xEDquico",
    "classes": [
      "Profissional"
    ],
    "conceitos": [
      "Intelectual itinerante em tanque ambulante"
    ],
    "pericias": [
      {
        "nome": "Medita\xE7\xE3o",
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
        "nome": "Influ\xEAncia",
        "valor": 35
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 19
      },
      {
        "nome": "Costumes",
        "valor": 17
      }
    ]
  },
  {
    "nome": "Antiqu\xE1rio",
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
        "nome": "Hist\xF3ria",
        "valor": 32
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 29
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 23
      },
      {
        "nome": "Insight",
        "valor": 26
      },
      {
        "nome": "Com\xE9rcio",
        "valor": 23
      },
      {
        "nome": "Costumes",
        "valor": 27
      }
    ]
  },
  {
    "nome": "Arma estrat\xE9gica",
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
        "nome": "Percep\xE7\xE3o",
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
        "nome": "Navega\xE7\xE3o",
        "valor": 32
      },
      {
        "nome": "Resist\xEAncia",
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
      "Atendente da \xDAltima Bateria"
    ],
    "pericias": [
      {
        "nome": "Influ\xEAncia",
        "valor": 28
      },
      {
        "nome": "Insight",
        "valor": 30
      },
      {
        "nome": "Com\xE9rcio",
        "valor": 18
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 36
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 26
      }
    ]
  },
  {
    "nome": "Bisca",
    "classes": [
      "P\xE1ria"
    ],
    "conceitos": [
      "Crian\xE7a de rua esperta"
    ],
    "pericias": [
      {
        "nome": "Furtividade",
        "valor": 31
      },
      {
        "nome": "Prestidigita\xE7\xE3o",
        "valor": 31
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 31
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 32
      },
      {
        "nome": "Engana\xE7\xE3o",
        "valor": 27
      },
      {
        "nome": "Atletismo",
        "valor": 33
      },
      {
        "nome": "Influ\xEAncia",
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
      "Intermedi\xE1rio de moedas e mercadorias estrangeiras"
    ],
    "pericias": [
      {
        "nome": "Com\xE9rcio",
        "valor": 36
      },
      {
        "nome": "Insight",
        "valor": 34
      },
      {
        "nome": "Influ\xEAncia",
        "valor": 29
      },
      {
        "nome": "Engana\xE7\xE3o",
        "valor": 26
      },
      {
        "nome": "Costumes",
        "valor": 30
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 29
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 23
      }
    ]
  },
  {
    "nome": "Ca\xE7ador",
    "classes": [
      "Tribal"
    ],
    "conceitos": [
      "Ca\xE7ador-coletor tribal"
    ],
    "pericias": [
      {
        "nome": "Atletismo",
        "valor": 25
      },
      {
        "nome": "Percep\xE7\xE3o",
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
        "nome": "Sobreviv\xEAncia",
        "valor": 34
      },
      {
        "nome": "Arremesso",
        "valor": 19
      },
      {
        "nome": "Resist\xEAncia",
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
      "Corpo rob\xF3tico de intera\xE7\xE3o social e trabalho"
    ],
    "pericias": [
      {
        "nome": "Atletismo",
        "valor": 19
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 42
      },
      {
        "nome": "Opera\xE7\xE3o T\xE9cnica",
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
      "Unidade aut\xF4noma de elimina\xE7\xE3o"
    ],
    "pericias": [
      {
        "nome": "Percep\xE7\xE3o",
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
        "nome": "Estrat\xE9gia",
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
      "Mercadora que opera atrav\xE9s de um chassis humanoide",
      "Corretora de contrabando e armas",
      "Mercador insetoide residente"
    ],
    "pericias": [
      {
        "nome": "Com\xE9rcio",
        "valor": 36
      },
      {
        "nome": "Influ\xEAncia",
        "valor": 28
      },
      {
        "nome": "Insight",
        "valor": 28
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 25
      },
      {
        "nome": "Costumes",
        "valor": 22
      },
      {
        "nome": "Locale (V\xE9spera)",
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
        "nome": "Influ\xEAncia",
        "valor": 25
      },
      {
        "nome": "Insight",
        "valor": 32
      },
      {
        "nome": "Com\xE9rcio",
        "valor": 25
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 35
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 23
      }
    ]
  },
  {
    "nome": "Guarda do port\xE3o",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Veterano do controle de entrada"
    ],
    "pericias": [
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 30
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 33
      },
      {
        "nome": "Insight",
        "valor": 22
      },
      {
        "nome": "Influ\xEAncia",
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
        "nome": "Percep\xE7\xE3o",
        "valor": 24
      },
      {
        "nome": "Locale (V\xE9spera)",
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
        "nome": "Percep\xE7\xE3o",
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
        "nome": "Resist\xEAncia",
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
      "Combatente t\xE9cnica e favorita das apostas"
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
        "nome": "Percep\xE7\xE3o",
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
    "nome": "Mec\xE2nica",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Especialista em motores e ve\xEDculos leves"
    ],
    "pericias": [
      {
        "nome": "Mec\xE2nica",
        "valor": 34
      },
      {
        "nome": "Engenharia",
        "valor": 27
      },
      {
        "nome": "Opera\xE7\xE3o T\xE9cnica",
        "valor": 31
      },
      {
        "nome": "Com\xE9rcio",
        "valor": 24
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 28
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 25
      },
      {
        "nome": "Pesquisa",
        "valor": 16
      }
    ]
  },
  {
    "nome": "Mec\xE2nico",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "T\xE9cnico de ve\xEDculos e m\xE1quinas antigas"
    ],
    "pericias": [
      {
        "nome": "Engenharia",
        "valor": 30
      },
      {
        "nome": "Opera\xE7\xE3o T\xE9cnica",
        "valor": 36
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 24
      },
      {
        "nome": "Com\xE9rcio",
        "valor": 23
      },
      {
        "nome": "Locale (V\xE9spera)",
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
      "Correio e informante alien\xEDgena"
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
        "nome": "Percep\xE7\xE3o",
        "valor": 35
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 31
      },
      {
        "nome": "Insight",
        "valor": 28
      },
      {
        "nome": "Engana\xE7\xE3o",
        "valor": 26
      },
      {
        "nome": "Influ\xEAncia",
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
      "Entregador especializado nos n\xEDveis verticais da cidade"
    ],
    "pericias": [
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 40
      },
      {
        "nome": "Atletismo",
        "valor": 33
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 31
      },
      {
        "nome": "Condu\xE7\xE3o",
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
      "Respons\xE1vel por uma pequena rede de caravanas"
    ],
    "pericias": [
      {
        "nome": "Com\xE9rcio",
        "valor": 32
      },
      {
        "nome": "Influ\xEAncia",
        "valor": 25
      },
      {
        "nome": "Log\xEDstica",
        "valor": 32
      },
      {
        "nome": "Conduzir",
        "valor": 26
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 28
      },
      {
        "nome": "Percep\xE7\xE3o",
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
        "nome": "Com\xE9rcio",
        "valor": 32
      },
      {
        "nome": "Influ\xEAncia",
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
        "nome": "Locale (V\xE9spera)",
        "valor": 29
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 18
      },
      {
        "nome": "Engana\xE7\xE3o",
        "valor": 19
      }
    ]
  },
  {
    "nome": "Mercen\xE1rio",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Veterano de conflitos p\xF3s-imperiais"
    ],
    "pericias": [
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 26
      },
      {
        "nome": "Atletismo",
        "valor": 23
      },
      {
        "nome": "Resist\xEAncia",
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
        "nome": "Sobreviv\xEAncia",
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
      "Oper\xE1rio especializado em galerias estreitas"
    ],
    "pericias": [
      {
        "nome": "Minera\xE7\xE3o",
        "valor": 39
      },
      {
        "nome": "Atletismo",
        "valor": 23
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 30
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 25
      },
      {
        "nome": "Resist\xEAncia",
        "valor": 26
      },
      {
        "nome": "Sobreviv\xEAncia",
        "valor": 22
      },
      {
        "nome": "Opera\xE7\xE3o T\xE9cnica",
        "valor": 29
      }
    ]
  },
  {
    "nome": "M\xE9dico",
    "classes": [
      "Profissional"
    ],
    "conceitos": [
      "Respons\xE1vel pela Cl\xEDnica das Tr\xEAs Arcadas"
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
        "nome": "Percep\xE7\xE3o",
        "valor": 28
      },
      {
        "nome": "Insight",
        "valor": 26
      },
      {
        "nome": "Com\xE9rcio",
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
        "nome": "Percep\xE7\xE3o",
        "valor": 20
      },
      {
        "nome": "Resist\xEAncia",
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
    "nome": "Trabalho/Manuten\xE7\xE3o",
    "classes": [
      "0"
    ],
    "conceitos": [
      "Unidade t\xE9cnica utilit\xE1ria"
    ],
    "pericias": [
      {
        "nome": "Opera\xE7\xE3o T\xE9cnica",
        "valor": 51
      },
      {
        "nome": "Engenharia",
        "valor": 49
      },
      {
        "nome": "Percep\xE7\xE3o",
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
      "Motorista de carga e operador de ve\xEDculos"
    ],
    "pericias": [
      {
        "nome": "Condu\xE7\xE3o",
        "valor": 36
      },
      {
        "nome": "Navega\xE7\xE3o",
        "valor": 30
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 32
      },
      {
        "nome": "Com\xE9rcio",
        "valor": 25
      },
      {
        "nome": "Mec\xE2nica",
        "valor": 23
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 28
      },
      {
        "nome": "Sobreviv\xEAncia",
        "valor": 20
      }
    ]
  },
  {
    "nome": "T\xE9cnico de energia",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Manuten\xE7\xE3o da infraestrutura urbana"
    ],
    "pericias": [
      {
        "nome": "Opera\xE7\xE3o T\xE9cnica",
        "valor": 30
      },
      {
        "nome": "Engenharia",
        "valor": 25
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 22
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 23
      },
      {
        "nome": "Atletismo",
        "valor": 20
      }
    ]
  },
  {
    "nome": "T\xE9cnico de instrumentos",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Reparador de sensores e equipamentos pequenos"
    ],
    "pericias": [
      {
        "nome": "Eletr\xF4nica",
        "valor": 32
      },
      {
        "nome": "Engenharia",
        "valor": 24
      },
      {
        "nome": "Opera\xE7\xE3o T\xE9cnica",
        "valor": 29
      },
      {
        "nome": "Percep\xE7\xE3o",
        "valor": 27
      },
      {
        "nome": "Com\xE9rcio",
        "valor": 19
      },
      {
        "nome": "Locale (V\xE9spera)",
        "valor": 19
      },
      {
        "nome": "Pesquisa",
        "valor": 14
      }
    ]
  },
  {
    "nome": "T\xE9cnico portu\xE1rio",
    "classes": [
      "Trabalhador"
    ],
    "conceitos": [
      "Anf\xEDbio especializado em sistemas hidr\xE1ulicos"
    ],
    "pericias": [
      {
        "nome": "Opera\xE7\xE3o T\xE9cnica",
        "valor": 40
      },
      {
        "nome": "Engenharia",
        "valor": 34
      },
      {
        "nome": "Percep\xE7\xE3o",
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
        "nome": "Locale (V\xE9spera)",
        "valor": 32
      }
    ]
  }
];
var CRIATURAS = [
  {
    "id": "besta_ululante",
    "nome": "Besta Ululante",
    "especie": "Predador quim\xE9rico aparentado ao Drag\xE3o-Trombeta",
    "habitat": "Plan\xEDcies, ermos rochosos, florestas abertas e regi\xF5es de ca\xE7a",
    "comportamento": "\xC1pice predat\xF3rio; ca\xE7a por persegui\xE7\xE3o, atropelamento e desorienta\xE7\xE3o ac\xFAstica",
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
      "Percep\xE7\xE3o": 62,
      "Furtividade": 28,
      "Esquiva": 46,
      "Resist\xEAncia": 68,
      "Vontade": 48,
      "Combate Desarmado": 69
    },
    "armas": [
      "Mordida de Serpente:1d8+MD",
      "Patada/Pisotear:1d10+MD",
      "Eco da Matilha:0"
    ],
    "habilidades": [
      "quadrupede,grande,robusto; Eco da Matilha \xE9 um efeito sonoro especial e n\xE3o o alcance normal das armas naturais."
    ],
    "armaduraNatural": 4,
    "deslocamento": 8,
    "movimentoVoo": 0,
    "movimentoNatacao": 2,
    "descricao": "Grande predador quim\xE9rico aparentado ao Drag\xE3o-Trombeta."
  },
  {
    "id": "ca\xE7ador_de_nevoa",
    "nome": "Ca\xE7ador de N\xE9voa",
    "especie": "Predador crepuscular",
    "habitat": "P\xE2ntanos e regi\xF5es de neblina",
    "comportamento": "Emboscador silencioso",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 60,
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
    "descricao": "Predador gen\xE9rico para regi\xF5es \xFAmidas ou de baixa visibilidade."
  },
  {
    "id": "cadaver_de_chefe",
    "nome": "Cad\xE1ver Chefe",
    "especie": "Humanoide parasitado",
    "habitat": "Arredores de V\xE9spera",
    "comportamento": "Alimentar-se",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 21,
      "Resist\xEAncia": 33,
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
      "bipede,morto_vivo_parasitado; mordida exige contato muito pr\xF3ximo."
    ],
    "armaduraNatural": 0,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 1,
    "descricao": "Cad\xE1ver relativamente recente animado pelo parasita."
  },
  {
    "id": "zumbi_1",
    "nome": "Cad\xE1ver de trabalhador",
    "especie": "Humanoide parasitado",
    "habitat": "Arredores de V\xE9spera",
    "comportamento": "Alimentar-se",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 21,
      "Resist\xEAncia": 33,
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
      "bipede,morto_vivo_parasitado; mordida exige contato muito pr\xF3ximo."
    ],
    "armaduraNatural": 0,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 1,
    "descricao": "Cad\xE1ver relativamente recente animado pelo parasita."
  },
  {
    "id": "carrapato_de_ferro",
    "nome": "Carrapato de Ferro",
    "especie": "Parasita de carapa\xE7a",
    "habitat": "T\xFAneis, sucata, ninhos e carca\xE7as",
    "comportamento": "Aproxima-se escondido, fixa-se no alvo e tenta permanecer preso",
    "tamanho": "Min\xFAsculo",
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
      "Percep\xE7\xE3o": 32,
      "Escalada": 50,
      "Resist\xEAncia": 35,
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
    "descricao": "Parasita gen\xE9rico resistente e discreto."
  },
  {
    "id": "cavalgante_prismatico",
    "nome": "Cavalgante Prism\xE1tico",
    "especie": "Fauna ps\xEDquica",
    "habitat": "Plan\xEDcies e regi\xF5es abertas",
    "comportamento": "Social, sensitivo e potencialmente domestic\xE1vel",
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
      "Percep\xE7\xE3o": 72
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
    "descricao": "Grande herb\xEDvoro alien\xEDgena multicolorido, de longas antenas sensoriais e anatomia adequada \xE0 montaria."
  },
  {
    "id": "cila",
    "nome": "Cila",
    "especie": "Organismo animal s\xE9ssil de crescimento lit\xF3filo",
    "habitat": "Ilhas, fal\xE9sias, montanhas, cavernas, asteroides e estruturas rochosas no espa\xE7o",
    "comportamento": "Territorial e s\xE9ssil; seis pesco\xE7os ca\xE7am independentemente dentro da zona de alcance",
    "tamanho": "Tit\xE2nico",
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
      "Percep\xE7\xE3o": 72,
      "Resist\xEAncia": 82,
      "Vontade": 64
    },
    "armas": [
      "Bote de Presa Cir\xFArgico:1d10+MD"
    ],
    "habilidades": [
      "sessil,titanico,imune_derrubar,camuflagem_rochosa; im\xF3vel depois do in\xEDcio do combate, mas livremente posicion\xE1vel na prepara\xE7\xE3o."
    ],
    "armaduraNatural": 8,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Organismo colossal de carne que ocupa um nicho semelhante ao de uma planta s\xE9ssil: fixa-se permanentemente a rocha, montanha, fal\xE9sia, asteroide ou outro substrato e se reproduz por estruturas semelhantes a sementes que brotam."
  },
  {
    "id": "dragao_trombeta_alado_domesticado",
    "nome": "Drag\xE3o-Trombeta Alado Domesticado",
    "especie": "Trombet\xEDdeo alado domesticado",
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
      "Percep\xE7\xE3o": 55,
      "Resist\xEAncia": 62,
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
    "descricao": "Variante domesticada do trombet\xEDdeo alado."
  },
  {
    "id": "dragao_trombeta_alado_selvagem",
    "nome": "Drag\xE3o-Trombeta Alado Selvagem",
    "especie": "Trombet\xEDdeo alado",
    "habitat": "Ermos, escarpas e plan\xEDcies abertas",
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
      "Percep\xE7\xE3o": 60,
      "Resist\xEAncia": 70,
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
    "descricao": "Grande trombet\xEDdeo selvagem."
  },
  {
    "id": "dragao_trombeta_corredor_domesticado",
    "nome": "Drag\xE3o-Trombeta Corredor Domesticado",
    "especie": "Trombet\xEDdeo corredor domesticado",
    "habitat": "Assentamentos e criadouros",
    "comportamento": "Treinado, alerta e relativamente manej\xE1vel",
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
      "Percep\xE7\xE3o": 58,
      "Furtividade": 45,
      "Esquiva": 54,
      "Resist\xEAncia": 52,
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
    "descricao": "Forma domesticada e reduzida do trombet\xEDdeo corredor."
  },
  {
    "id": "dragao_trombeta_corredor_selvagem",
    "nome": "Drag\xE3o-Trombeta Corredor Selvagem",
    "especie": "Trombet\xEDdeo corredor",
    "habitat": "Campos secos, ru\xEDnas e matas abertas",
    "comportamento": "Ca\xE7ador b\xEDpede veloz, geralmente investe ap\xF3s o bramido",
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
      "Percep\xE7\xE3o": 62,
      "Furtividade": 52,
      "Esquiva": 58,
      "Resist\xEAncia": 58,
      "Combate Desarmado": 68
    },
    "armas": [
      "Mordida:1d10+MD",
      "Garras:1d6+MD",
      "Trombeta:1d6"
    ],
    "habilidades": [
      "bipede,corredor,grande; sem asas; dois bra\xE7os pequenos; Trombeta causa surdez por 1d20 rodadas."
    ],
    "armaduraNatural": 3,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 2,
    "descricao": "Trombet\xEDdeo b\xEDpede n\xE3o alado, de silhueta semelhante \xE0 de um grande predador corredor."
  },
  {
    "id": "enxame_mordedor",
    "nome": "Enxame Mordedor",
    "especie": "Enxame de pequenos organismos",
    "habitat": "Qualquer ambiente onde existam alimento e abrigo",
    "comportamento": "Cerca fontes de alimento e recua diante de fogo, fuma\xE7a ou perturba\xE7\xF5es intensas",
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
      "Percep\xE7\xE3o": 30,
      "Esquiva": 45,
      "Sobreviv\xEAncia": 40,
      "Resist\xEAncia": 30,
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
    "descricao": "Modelo gen\xE9rico para representar dezenas ou centenas de pequenos animais como uma \xFAnica amea\xE7a de combate."
  },
  {
    "id": "escavador_de_carapaca",
    "nome": "Escavador de Carapa\xE7a",
    "especie": "Fauna escavadora blindada",
    "habitat": "Desertos rochosos, minas e galerias subterr\xE2neas",
    "comportamento": "Defende territ\xF3rio e reage violentamente a vibra\xE7\xF5es",
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
      "Percep\xE7\xE3o": 38,
      "Resist\xEAncia": 48,
      "Atletismo": 30,
      "Sobreviv\xEAncia": 45,
      "Combate Desarmado": 42
    },
    "armas": [
      "Mand\xEDbulas:1d10+MD",
      "Investida:1d8+MD"
    ],
    "habilidades": [
      "quadrupede,grande,robusto,escavador"
    ],
    "armaduraNatural": 6,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Modelo gen\xE9rico de criatura grande e resistente para encontros em t\xFAneis ou terreno aberto."
  },
  {
    "id": "insetoide_predador",
    "nome": "Insetoide Predador",
    "especie": "Insetoide",
    "habitat": "Subterr\xE2neo, ru\xEDnas e zonas industriais",
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
      "Percep\xE7\xE3o": 58,
      "Furtividade": 62,
      "Resist\xEAncia": 55
    },
    "armas": [
      "Mand\xEDbulas:1d8+MD",
      "Garras:1d6+MD"
    ],
    "habilidades": [
      "insetoide,bipede"
    ],
    "armaduraNatural": 3,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Modelo gen\xE9rico de criatura insetoide predat\xF3ria."
  },
  {
    "id": "larva_interdimensional",
    "nome": "Larva Interdimensional",
    "especie": "Fauna ps\xEDquica extradimensional",
    "habitat": "Regi\xF5es isoladas e locais de anomalia",
    "comportamento": "Curiosa, evasiva e enigm\xE1tica; raramente hostil",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 78
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
    "comportamento": "Consumir mat\xE9ria org\xE2nica e evitar ambientes hostis",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 34,
      "Resist\xEAncia": 42,
      "Sobreviv\xEAncia": 44,
      "Combate Desarmado": 35
    },
    "armas": [
      "Engolfar:1d6+MD",
      "Pseud\xF3pode:1d6+MD"
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
    "comportamento": "Defender territ\xF3rio, alimento e grupo",
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
      "Percep\xE7\xE3o": 49,
      "Sobreviv\xEAncia": 44,
      "Resist\xEAncia": 31,
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
    "descricao": "Grande criatura semi-inteligente de Calico, vagamente primatoide, com quatro bra\xE7os poderosos e corpo adaptado a escalada e deslocamento entre forma\xE7\xF5es rochosas."
  },
  {
    "id": "metamorfo_generico",
    "nome": "Metamorfo Gen\xE9rico",
    "especie": "Animal parasitado / quimera",
    "habitat": "Vari\xE1vel",
    "comportamento": "Predador adaptativo; incorpora tra\xE7os das presas",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 58
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
    "nome": "Metamorfo Ps\xEDquico",
    "especie": "Animal parasitado / quimera ps\xEDquica",
    "habitat": "Vari\xE1vel",
    "comportamento": "Predador adaptativo e ps\xEDquico",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 66
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
    "descricao": "Metamorfo em que a infec\xE7\xE3o tamb\xE9m produz capacidades ps\xEDquicas."
  },
  {
    "id": "montariapterodatil",
    "nome": "Montaria Pterod\xE1tilo",
    "especie": "",
    "habitat": "",
    "comportamento": "",
    "tamanho": "M\xE9dio",
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
    "especie": "Artr\xF3pode parasita",
    "habitat": "Cad\xE1veres, esgotos e dep\xF3sitos org\xE2nicos",
    "comportamento": "Aglomera-se sobre feridos e carni\xE7a",
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
      "Percep\xE7\xE3o": 42
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
    "descricao": "Pequeno parasita gen\xE9rico para encontros em enxames ou \xE1reas contaminadas."
  },
  {
    "id": "predador_couracado",
    "nome": "Predador Coura\xE7ado",
    "especie": "R\xE9ptil coura\xE7ado",
    "habitat": "Desertos rochosos e ermos",
    "comportamento": "Territorial; investe quando amea\xE7ado",
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
      "Percep\xE7\xE3o": 46,
      "Resist\xEAncia": 68
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
    "descricao": "Predador pesado gen\xE9rico de Calico, adequado para ser duplicado e especializado."
  },
  {
    "id": "predador_de_nevoa",
    "nome": "Predador de N\xE9voa",
    "especie": "Ca\xE7ador de emboscada",
    "habitat": "P\xE2ntanos, florestas \xFAmidas e \xE1reas de baixa visibilidade",
    "comportamento": "Evita confronto aberto, aproxima-se oculto e ataca alvos separados",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 46,
      "Rastrear": 50,
      "Atletismo": 36,
      "Esquiva": 38,
      "Resist\xEAncia": 34,
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
    "descricao": "Predador gen\xE9rico de emboscada."
  },
  {
    "id": "insetoide_predador_1",
    "nome": "Predador de V\xE9spera",
    "especie": "Insetoide",
    "habitat": "Ermos de V\xE9spera",
    "comportamento": "Ca\xE7ar, alimentar-se e defender o ninho",
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
      "Percep\xE7\xE3o": 57,
      "Furtividade": 45,
      "Atletismo": 35,
      "Resist\xEAncia": 36,
      "Rastrear": 45,
      "Vontade": 34,
      "Esquiva": 25,
      "Sobreviv\xEAncia": 47,
      "Combate Desarmado": 35
    },
    "armas": [
      "Mand\xEDbulas:1d8+MD",
      "Garras:1d6+MD",
      "Ferr\xE3o:1d6+MD"
    ],
    "habilidades": [
      "insetoide,grande,robusto"
    ],
    "armaduraNatural": 4,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 0,
    "descricao": "Predador hex\xE1pode de carapa\xE7a escura que ca\xE7a por vibra\xE7\xE3o e odor."
  },
  {
    "id": "rastejante_de_cinzas",
    "nome": "Rastejante de Cinzas",
    "especie": "Predador hex\xE1pode",
    "habitat": "Ru\xEDnas, cavernas e zonas industriais",
    "comportamento": "Ca\xE7a em pequenos grupos e recua quando isolado",
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
      "Percep\xE7\xE3o": 42,
      "Atletismo": 38,
      "Esquiva": 40,
      "Rastrear": 35,
      "Resist\xEAncia": 28,
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
    "descricao": "Modelo gen\xE9rico de predador pequeno e \xE1gil."
  },
  {
    "id": "serpente_sanguessuga",
    "nome": "Serpente Sanguessuga",
    "especie": "Parasita anf\xEDbio; poss\xEDvel parentesco remoto com a linhagem parasit\xE1ria de vampiros, zumbis e metamorfos",
    "habitat": "Masmorras, florestas densas, p\xE2ntanos, cavernas e outros planetas; tolera exposi\xE7\xE3o ao v\xE1cuo",
    "comportamento": "Emboscador parasit\xE1rio; prende membros, usa o hospedeiro como prote\xE7\xE3o e drena sangue e fluidos",
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
      "Resist\xEAncia": 32,
      "Percep\xE7\xE3o": 27,
      "Vontade": 30
    },
    "armas": [
      "Bote e Constri\xE7\xE3o:1d4",
      "Drenagem de Sangue:1d6"
    ],
    "habilidades": [
      "anfibio,parasita,alongado,aderente; imune ao parasita de vampiros/zumbis/metamorfos; sobrevive ao v\xE1cuo."
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 0,
    "movimentoNatacao": 6,
    "descricao": "Parasita anf\xEDbio extremamente \xE1gil."
  },
  {
    "id": "vampiro_generico",
    "nome": "Vampiro Gen\xE9rico",
    "especie": "Hospedeiro racional parasitado",
    "habitat": "Assentamentos e ru\xEDnas habitadas",
    "comportamento": "Predador racional; preserva intelig\xEAncia e mem\xF3rias do hospedeiro",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 58
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
    "nome": "Vampiro Ps\xEDquico",
    "especie": "Hospedeiro racional parasitado",
    "habitat": "Assentamentos e ru\xEDnas habitadas",
    "comportamento": "Predador racional, manipulador e sensitivo",
    "tamanho": "M\xE9dio",
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
      "Percep\xE7\xE3o": 65
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
    "descricao": "Variante vamp\xEDrica em que a simbiose parasit\xE1ria manifesta capacidades ps\xEDquicas, sobretudo nas esferas Mente e Sentidos."
  },
  {
    "id": "vespa_de_vidro",
    "nome": "Vespa de Vidro",
    "especie": "Insetoide voador",
    "habitat": "Penhascos, estruturas altas e \xE1reas quentes",
    "comportamento": "Territorial; ataca rapidamente e tenta manter dist\xE2ncia",
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
      "Percep\xE7\xE3o": 45,
      "Esquiva": 50,
      "Furtividade": 32,
      "Resist\xEAncia": 24,
      "Combate Desarmado": 38
    },
    "armas": [
      "Ferr\xE3o:1d4",
      "Mand\xEDbulas:1d3"
    ],
    "habilidades": [
      "voador,pequeno"
    ],
    "armaduraNatural": 1,
    "deslocamento": 0,
    "movimentoVoo": 7,
    "movimentoNatacao": 0,
    "descricao": "Modelo gen\xE9rico de predador voador."
  }
];
var PERICIAS = [
  {
    "id": "adestramento",
    "nome": "Adestramento",
    "categoria": "Animais",
    "formula": "CAR+POD"
  },
  {
    "id": "agricultura",
    "nome": "Agricultura",
    "categoria": "Sobreviv\xEAncia",
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
    "categoria": "Sobreviv\xEAncia",
    "formula": "INT+CAR"
  },
  {
    "id": "armeiro",
    "nome": "Armeiro",
    "categoria": "T\xE9cnica",
    "formula": "INT+DES"
  },
  {
    "id": "arte",
    "nome": "Arte",
    "categoria": "T\xE9cnica",
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
    "nome": "Astronavega\xE7\xE3o",
    "categoria": "Ve\xEDculos",
    "formula": "INT*2"
  },
  {
    "id": "atletismo",
    "nome": "Atletismo",
    "categoria": "F\xEDsica",
    "formula": "FOR+DES"
  },
  {
    "id": "avaliacao",
    "nome": "Avalia\xE7\xE3o",
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
    "categoria": "Ve\xEDculos",
    "formula": "DES+CAR"
  },
  {
    "id": "cibernetica",
    "nome": "Cibern\xE9tica",
    "categoria": "T\xE9cnica",
    "formula": "INT+DES"
  },
  {
    "id": "ciber_seguranca",
    "nome": "Ciberseguran\xE7a",
    "categoria": "T\xE9cnica",
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
    "nome": "Com\xE9rcio",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "computadores",
    "nome": "Computa\xE7\xE3o",
    "categoria": "T\xE9cnica",
    "formula": "INT*2"
  },
  {
    "id": "comunicacoes",
    "nome": "Comunica\xE7\xF5es",
    "categoria": "T\xE9cnica",
    "formula": "INT+CAR"
  },
  {
    "id": "conduzir",
    "nome": "Condu\xE7\xE3o de Ve\xEDculos",
    "categoria": "Ve\xEDculos",
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
    "categoria": "T\xE9cnica",
    "formula": "INT*2"
  },
  {
    "id": "danca",
    "nome": "Dan\xE7a",
    "categoria": "Social",
    "formula": "DES+CAR"
  },
  {
    "id": "demolicoes",
    "nome": "Demoli\xE7\xF5es",
    "categoria": "T\xE9cnica",
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
    "categoria": "Manipula\xE7\xE3o",
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
    "nome": "Eletr\xF4nica",
    "categoria": "T\xE9cnica",
    "formula": "INT+DES"
  },
  {
    "id": "dissimulacao",
    "nome": "Engana\xE7\xE3o",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "engenharia",
    "nome": "Engenharia",
    "categoria": "T\xE9cnica",
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
    "nome": "Estrat\xE9gia",
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
    "categoria": "T\xE9cnica",
    "formula": "INT*2"
  },
  {
    "id": "falsificacao",
    "nome": "Falsifica\xE7\xE3o",
    "categoria": "Manipula\xE7\xE3o",
    "formula": "DES+INT"
  },
  {
    "id": "bancario",
    "nome": "Finan\xE7as",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "forca_bruta",
    "nome": "For\xE7a Bruta",
    "categoria": "F\xEDsica",
    "formula": "FOR+TAM"
  },
  {
    "id": "forca_vontade",
    "nome": "For\xE7a de Vontade",
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
    "nome": "Hist\xF3ria",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "genealogia",
    "nome": "Hist\xF3ria [Genealogia]",
    "categoria": "Acad\xEAmica",
    "formula": "INT*2"
  },
  {
    "id": "heraldismo",
    "nome": "Hist\xF3ria [Heraldismo]",
    "categoria": "Acad\xEAmica",
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
    "nome": "Idiomas [L\xEDngua Antiga]",
    "categoria": "Conhecimento",
    "formula": "INT+CAR"
  },
  {
    "id": "influencia",
    "nome": "Influ\xEAncia",
    "categoria": "Social",
    "formula": "CAR*2"
  },
  {
    "id": "interrogatorio",
    "nome": "Interrogat\xF3rio",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "intimidacao",
    "nome": "Intimida\xE7\xE3o",
    "categoria": "Social",
    "formula": "POD+MAIOR"
  },
  {
    "id": "intuicao",
    "nome": "Intui\xE7\xE3o",
    "categoria": "Percep\xE7\xE3o",
    "formula": "INT+POD"
  },
  {
    "id": "ganhos_jogos",
    "nome": "Jogos e Apostas",
    "categoria": "Manipula\xE7\xE3o",
    "formula": "INT+POD"
  },
  {
    "id": "comando",
    "nome": "Lideran\xE7a",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "lingua_nativa",
    "nome": "L\xEDngua Nativa",
    "categoria": "Conhecimento",
    "formula": "INT+CAR+40"
  },
  {
    "id": "linguistica",
    "nome": "Lingu\xEDstica",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "logistica",
    "nome": "Log\xEDstica",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "mecanica",
    "nome": "Mec\xE2nica",
    "categoria": "T\xE9cnica",
    "formula": "INT+DES"
  },
  {
    "id": "mecanismos",
    "nome": "Mecanismos",
    "categoria": "T\xE9cnica",
    "formula": "DES+INT"
  },
  {
    "id": "medicina",
    "nome": "Medicina",
    "categoria": "T\xE9cnica",
    "formula": "INT*2"
  },
  {
    "id": "meditacao",
    "nome": "Medita\xE7\xE3o",
    "categoria": "Psi",
    "formula": "CON+POD"
  },
  {
    "id": "transe",
    "nome": "Medita\xE7\xE3o [Transe]",
    "categoria": "Mental",
    "formula": "CON+POD"
  },
  {
    "id": "mineracao",
    "nome": "Minera\xE7\xE3o",
    "categoria": "T\xE9cnica",
    "formula": "INT+FOR"
  },
  {
    "id": "musica",
    "nome": "M\xFAsica",
    "categoria": "Social",
    "formula": "DES+CAR"
  },
  {
    "id": "natacao",
    "nome": "Nata\xE7\xE3o",
    "categoria": "F\xEDsica",
    "formula": "FOR+CON"
  },
  {
    "id": "navegacao",
    "nome": "Navega\xE7\xE3o",
    "categoria": "Ve\xEDculos",
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
    "nome": "Orat\xF3ria",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "percepcao",
    "nome": "Percep\xE7\xE3o",
    "categoria": "Percep\xE7\xE3o",
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
    "categoria": "Ve\xEDculos",
    "formula": "DES+INT"
  },
  {
    "id": "politica",
    "nome": "Pol\xEDtica",
    "categoria": "Social",
    "formula": "INT+CAR"
  },
  {
    "id": "primeiros_socorros",
    "nome": "Primeiros Socorros",
    "categoria": "T\xE9cnica",
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
    "categoria": "Sobreviv\xEAncia",
    "formula": "INT+POD"
  },
  {
    "id": "regiao",
    "nome": "Regi\xE3o",
    "categoria": "Conhecimento",
    "formula": "INT*2"
  },
  {
    "id": "resistencia",
    "nome": "Resist\xEAncia",
    "categoria": "Sobreviv\xEAncia",
    "formula": "CON*2"
  },
  {
    "id": "robotica",
    "nome": "Rob\xF3tica",
    "categoria": "T\xE9cnica",
    "formula": "INT+DES"
  },
  {
    "id": "seducao",
    "nome": "Sedu\xE7\xE3o",
    "categoria": "Social",
    "formula": "POD+CAR"
  },
  {
    "id": "seguranca",
    "nome": "Seguran\xE7a",
    "categoria": "T\xE9cnica",
    "formula": "INT+DES"
  },
  {
    "id": "cofres_fechaduras",
    "nome": "Seguran\xE7a [Cofres e Fechaduras]",
    "categoria": "T\xE9cnica",
    "formula": "INT+DES"
  },
  {
    "id": "sensoriamento",
    "nome": "Sensoriamento",
    "categoria": "T\xE9cnica",
    "formula": "INT*2"
  },
  {
    "id": "sistemas_defensivos",
    "nome": "Sistemas Defensivos",
    "categoria": "T\xE9cnica",
    "formula": "INT+DES"
  },
  {
    "id": "sistemas_escudo",
    "nome": "Sistemas Defensivos [Legado]",
    "categoria": "T\xE9cnica",
    "formula": "INT+DES"
  },
  {
    "id": "sobrevivencia",
    "nome": "Sobreviv\xEAncia",
    "categoria": "Sobreviv\xEAncia",
    "formula": "INT+CON"
  },
  {
    "id": "sobrevivencia_espacial",
    "nome": "Sobreviv\xEAncia [Espacial]",
    "categoria": "Sobreviv\xEAncia",
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
    "nome": "T\xE1tica",
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
    "nome": "Tradi\xE7\xE3o",
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

// fontes/mapforge/npc/system.ts
var ATRIBUTOS = ["FOR", "CON", "TAM", "DES", "INT", "POD", "CAR"];
var MIN_ATTR = 3;
var MIN_ATTR_TAM_INT = 6;
var MAX_ATTR = 18;
var POOL_ATRIBUTOS = [65, 70, 76, 80, 88, 96];
function sorteDe(pod) {
  const p = Math.max(0, Math.floor(pod));
  if (p <= 6) return 1;
  if (p <= 12) return 2;
  if (p <= 18) return 3;
  return 3 + Math.floor((p - 18) / 6);
}
function taxaRecuperacaoDe(con) {
  const c = Math.max(0, Math.floor(con));
  if (c <= 18) return 3;
  return 3 + Math.floor((c - 18) / 6);
}
function pontosMagiaDe(pod) {
  return Math.max(0, Math.floor(pod));
}
function modExperienciaDe(car) {
  const c = Math.max(0, Math.floor(car));
  if (c <= 6) return -1;
  if (c <= 12) return 0;
  if (c <= 18) return 1;
  return 1 + Math.floor((c - 18) / 6);
}
function modDanoDe(forca, tam) {
  const soma = Number(forca || 0) + Number(tam || 0);
  if (soma <= 5) return "-1d8";
  if (soma <= 10) return "-1d6";
  if (soma <= 15) return "-1d4";
  if (soma <= 20) return "-1d2";
  if (soma <= 25) return "+0";
  if (soma <= 30) return "+1d2";
  if (soma <= 35) return "+1d4";
  if (soma <= 40) return "+1d6";
  if (soma <= 45) return "+1d8";
  if (soma <= 50) return "+1d10";
  if (soma <= 60) return "+1d12";
  if (soma <= 70) return "+2d6";
  if (soma <= 80) return "+1d8+1d6";
  if (soma <= 90) return "+2d8";
  if (soma <= 100) return "+1d10+1d8";
  if (soma <= 110) return "+2d10";
  if (soma <= 120) return "+2d10+1d2";
  if (soma <= 130) return "+2d10+1d4";
  const extra = Math.floor((soma - 121) / 10);
  return `+2d10+1d${Math.min(12, 4 + extra * 2)}`;
}
function pvPorLocal(con, tam) {
  const x = (Number(con) || 10) + (Number(tam) || 10);
  const k = x <= 5 ? 0 : x <= 10 ? 1 : x <= 15 ? 2 : x <= 20 ? 3 : x <= 25 ? 4 : x <= 30 ? 5 : x <= 35 ? 6 : 7;
  const i = x > 40 ? Math.ceil((x - 40) / 5) : 0;
  const t = {
    l: [1, 2, 3, 4, 5, 6, 7, 8],
    a: [2, 3, 4, 5, 6, 7, 8, 9],
    c: [3, 4, 5, 6, 7, 8, 9, 10],
    b: [1, 1, 2, 3, 4, 5, 6, 7]
  };
  return {
    "Cabe\xE7a": t.l[k] + i,
    "Peito": t.c[k] + i,
    "Abd\xF4men": t.a[k] + i,
    "Bra\xE7o Direito": t.b[k] + i,
    "Bra\xE7o Esquerdo": t.b[k] + i,
    "Perna Direita": t.l[k] + i,
    "Perna Esquerda": t.l[k] + i
  };
}
function distribuirAtributos(rng, total, pesos = {}, maxExtra = 0) {
  const valores = {};
  let gasto = 0;
  for (const a of ATRIBUTOS) {
    valores[a] = a === "TAM" || a === "INT" ? MIN_ATTR_TAM_INT : MIN_ATTR;
    gasto += valores[a];
  }
  const restante = Math.max(0, total - gasto);
  const alvos = { ...valores };
  const pesosLista = ATRIBUTOS.map((a) => ({ a, w: Math.max(0.1, pesos[a] ?? 1) }));
  const somaPesos = pesosLista.reduce((s, p) => s + p.w, 0);
  let distribuido = 0;
  for (const p of pesosLista) {
    alvos[p.a] = Math.min(MAX_ATTR, valores[p.a] + Math.round(restante * p.w / somaPesos));
    distribuido += alvos[p.a] - valores[p.a];
  }
  let dif = restante - distribuido;
  const ordem = rng.shuffle([...ATRIBUTOS]);
  for (const a of ordem) {
    if (dif === 0) break;
    if (dif > 0 && alvos[a] < MAX_ATTR) {
      alvos[a]++;
      dif--;
    } else if (dif < 0 && alvos[a] > valores[a]) {
      alvos[a]--;
      dif++;
    }
  }
  if (maxExtra > 0) {
    const chaves = rng.shuffle(ATRIBUTOS.filter((a) => alvos[a] >= 14)).slice(0, 2);
    for (const a of chaves) {
      alvos[a] = Math.min(MAX_ATTR + maxExtra, alvos[a] + rng.int(1, maxExtra));
    }
  }
  return alvos;
}
function basePericia(formula, atr) {
  let expr = String(formula || "0");
  if (expr.includes("MAIOR")) {
    const chaves = ["FOR", "TAM", "DES", "INT", "CAR"];
    const maior = Math.max(...chaves.map((k) => Number(atr[k] || 0)));
    expr = expr.replace(/MAIOR/g, String(maior));
  }
  for (const a of ATRIBUTOS) {
    expr = expr.replace(new RegExp(a, "g"), String(atr[a] ?? 0));
  }
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return 0;
  try {
    return Math.round(Function(`"use strict"; return (${expr})`)());
  } catch {
    return 0;
  }
}

// fontes/mapforge/npc/especializacoes.ts
var ESPECIALIZACOES = [
  { id: "combate_pistola_laser", nome: "Combate com Pistola Laser", formula: "DES*2" },
  { id: "atirador_elite", nome: "Atirador de Elite", formula: "DES+INT" },
  { id: "arma_laser_pesada", nome: "Arma Laser Pesada", formula: "FOR+DES" },
  { id: "luta_gravidade_zero", nome: "Luta em Gravidade Zero", formula: "DES+INT" },
  { id: "guarda_costas_arma_longa", nome: "Guarda-Costas (Arma Longa/Escudo)", formula: "FOR+DES" },
  { id: "combate_traje_espacial", nome: "Combate em Traje Espacial", formula: "DES+CON" },
  { id: "psiquismo_materia", nome: "Psiquismo (Mat\xE9ria)", formula: "INT+POD" },
  { id: "psiquismo_mente", nome: "Psiquismo (Mente)", formula: "INT+POD" },
  { id: "psiquismo_sentidos", nome: "Psiquismo (Sentidos)", formula: "INT+POD" }
];
var ESPECIALIZACOES_POR_CARREIRA = {
  "Ca\xE7ador de Recompensas": ["combate_pistola_laser", "atirador_elite"],
  "Pirata Espacial": ["luta_gravidade_zero", "arma_laser_pesada"],
  "Guarda-Costas": ["guarda_costas_arma_longa", "combate_pistola_laser"],
  "Militar": ["soldado_infantaria", "arma_laser_pesada"],
  "M\xE9dico": [],
  "Engenheiro": [],
  "Piloto de Nave Estelar": ["combate_traje_espacial"]
};

// fontes/mapforge/npc/tables.ts
var TRACOS_PERSONALIDADE = [
  "fala pouco e mede cada palavra",
  "coleciona moedas de esta\xE7\xF5es passadas",
  "conta a mesma hist\xF3ria de gl\xF3ria em todo taberna",
  "desconfia de toda autoridade do Arquivo C\xEDvico",
  "fascinado por tecnologia antiga da Cidade Alta",
  "cumprimenta estranhos com uma rever\xEAncia tribal",
  "ri alto demais das pr\xF3prias piadas",
  "anota tudo em um caderno de couro de cila",
  "ama negociar mais do que lucrar",
  "tem pavor de galerias profundas desde a Mina",
  "semeia boatos por puro t\xE9dio",
  "devoto das fases da lua, n\xE3o trabalha na Lua Escura",
  "gentil com crian\xE7as e feras",
  "ciumento do pr\xF3prio of\xEDcio",
  "gabarola sobre parentesco distante com a Cidade Alta",
  "sempre com fome, cheira toda comida antes",
  "supersticioso com n\xFAmeros de esta\xE7\xF5es",
  "fala com o equipamento como se fosse gente",
  "nunca esquece uma cara \u2014 nem um desaforo",
  "nost\xE1lgico da Esta\xE7\xE3o dos Meteoros",
  "met\xF3dico a ponto de irritar aliados",
  "impulsivo, aposta em qualquer coisa",
  "protege refugiados de tribos estrangeiras",
  "coleciona grafias de grafite de V\xE9spera",
  "voz mansa, m\xE3os duras",
  "conta prazos em dias de Calico (10 dias)",
  "tem um mapa falso da Cidade Baixa e jura que \xE9 real",
  "simpatiza com metamorfos perseguidos",
  "odeia o som de trombetas (trauma com drag\xF5es)",
  "guarda segredos como moeda",
  "fil\xF3sofo de balc\xE3o sobre o destino de Calico",
  "ansioso, verifica sa\xEDdas ao entrar em qualquer sala",
  "orgulhoso de uma cicatriz de vespa de vidro",
  "sedutor profissional, vende informa\xE7\xE3o e charme",
  "leal a um chefe que talvez nem exista",
  "trata rob\xF4s com cortesia cerimoniosa"
];
var MOTIVACOES = [
  "quitar uma d\xEDvida com o Mercado das Cavidades",
  "encontrar um parente perdido na Cidade Baixa",
  "juntar cr\xE9ditos para passagem orbital",
  "vingar a queda de um mentor",
  "provar que a Cidade Alta esconde \xE1gua pot\xE1vel",
  "escapar de um contrato com o Arquivo C\xEDvico",
  "ca\xE7ar a fera que destruiu sua caravana",
  "proteger um segredo tribal a qualquer custo",
  "recuperar uma rel\xEDquia roubada de sua gente",
  "ser reconhecido pelo pr\xF3prio cl\xE3",
  "desvendar a origem das criaturas do Limo",
  "pagar a cura de um ente querido na Cl\xEDnica",
  "livrar-se de um parasita silencioso",
  "comprar a liberdade de um camarada preso",
  "mapear um trecho inexplorado do Mar de Pedras",
  "encontrar um comprador para um artefato proibido",
  "esquecer o que viu nas Ruas Escavadas",
  "ascender de classe social, a qualquer pre\xE7o",
  "manter a promessa feita sob a Lua Cheia",
  "impedir que um inimigo antigo volte a V\xE9spera"
];
var EQUIP_PLEBEU = [
  "saco de tecido com ra\xE7\xF5es de viagem",
  "cantil de \xE1gua filtrada de Calico",
  "ferramenta simples do of\xEDcio",
  "manta gasta contra as brumas",
  "moedas mi\xFAdas de esta\xE7\xF5es antigas",
  "corda de 10 metros",
  "lanterna de \xEDon de segunda m\xE3o",
  "amuleto tribal contra metamorfos"
];
var EQUIP_MERCADOR = [
  "balan\xE7a port\xE1til e pesos certificados",
  "caderno de d\xE9bitos cifrado",
  "amostras de especiarias do Mercado das Mil Panelas",
  "selos do Arquivo C\xEDvico (alguns falsos)",
  "caixa forte pequena com fecho de \xEDon",
  "mapa de rotas de caravana desatualizado",
  "moedas de tr\xEAs sociedades diferentes",
  "um bem de luxo proibido embrulhado"
];
var EQUIP_COMBATE = [
  "l\xE2mina curta de cer\xE2mica",
  "escudo de chapa dobrada",
  "bast\xE3o de choque de carga limitada",
  "colete acolchoado refor\xE7ado",
  "bin\xF3culo de campanha",
  "kit de primeiros socorros de campanha",
  "granada de fuma\xE7a turquesa",
  "s\xEDmbolo de unidade da guarda"
];
var EQUIP_ELITE = [
  "arma de energia com reserva selada",
  "blindagem leve de liga de Calico",
  "comunicador criptografado da Cidade Alta",
  "contrato assinado pelo Arquivo C\xEDvico",
  "dr\xF4me de escuta dobr\xE1vel",
  "ant\xEDdoto para veneno de serpente sanguessuga",
  "chave mestra de um setor administrativo",
  "rel\xF3gio de pulso de fase lunar"
];
var CLIMA_POR_ESTACAO = {
  "Esta\xE7\xE3o dos Ventos": [
    "rajadas constantes carregando poeira turquesa dos planaltos",
    "vendaval de tr\xEAs dias derruba tendas de mercado",
    "vento frio do Mar de Pedras traz eco de trombetas distantes"
  ],
  "Esta\xE7\xE3o das Brumas": [
    "n\xE9voa densa at\xE9 meio-dia; predadores de n\xE9voa ca\xE7am mais perto dos trilhos",
    "garoa fina e fria, visibilidade de poucos metros",
    "bruma luminosa que faz luzes dan\xE7arem \u2014 os mais velhos dizem que \xE9 \xEDon livre"
  ],
  "Esta\xE7\xE3o das Flores": [
    "calor suave e p\xF3len dourado cobrindo telhados de chapa",
    "chuvas curtas \xE0 tarde, cheiro de terra molhada nas Ruas Escavadas",
    "enxames de abelhas de vidro sobrevoam as planta\xE7\xF5es"
  ],
  "Esta\xE7\xE3o do Sol Alto": [
    "sol implac\xE1vel, sombra vale mais que \xE1gua",
    "temperatura que derreita selante de portas de \xEDon",
    "noites quentes com meteoros finos cruzando o c\xE9u"
  ],
  "Esta\xE7\xE3o das Tempestades": [
    "tempestade de raios roxos anunciada por cheiro de oz\xF4nio",
    "chuva \xE1cida leve \u2014 capuzes e selantes obrigat\xF3rios",
    "ciclone de poeira fecha estradas de caravana por dias"
  ],
  "Esta\xE7\xE3o das Folhas": [
    "folhas de vidro-p\xE1lido caem como confete fosco",
    "manh\xE3s frias, tardes mornas, geada nas sombras",
    "ventos secos levantam espirais de folhas perto do Bosque"
  ],
  "Esta\xE7\xE3o dos Meteoros": [
    "chuva de meteoros vis\xEDvel a olho nu por tr\xEAs noites",
    "restos de meteoro esquentam carregamentos da \xDAltima Bateria",
    "c\xE9u verde-ferrugem; supersti\xE7\xF5es dobram o pre\xE7o de amuletos"
  ],
  "Esta\xE7\xE3o das Estrelas": [
    "c\xE9u limpo e frio, estrelas duplas de Calico n\xEDtidas",
    "geada de \xEDon cristaliza nas superf\xEDcies met\xE1licas ao amanhecer",
    "sil\xEAncio estranho: at\xE9 os drag\xF5es-trombeta calam"
  ]
};
var ENCONTROS_SOCIAIS = [
  "caravana de transportadores pede escolta at\xE9 o pr\xF3ximo port\xE3o",
  "preg\xE3o improvisado do Mercado das Cavidades bloqueia a passagem",
  "patrulha da guarda urbana revista documentos de circula\xE7\xE3o",
  "peregrino tribal pede \xE1gua e oferece uma previs\xE3o de lua em troca",
  "apostadores do Ringue das Cavidades recrutam para uma luta",
  "mensageira da Cidade Alta entrega um pacote selado a um dos her\xF3is",
  "refugiados de um assentamento atacado pedem guia at\xE9 V\xE9spera",
  'antiqu\xE1rio oferece "o mapa verdadeiro" das Ruas Escavadas',
  "agente do Arquivo C\xEDvico compra sil\xEAncio sobre o que o grupo viu",
  "grupo de mineradores em greve bloqueia a entrada da Mina"
];
var COMPLICACOES = [
  "o encontro \xE9 uma emboscada disfar\xE7ada",
  "uma terceira parte chega no pior momento",
  "o ch\xE3o cede e revela uma galeria abaixo",
  "um alarme de \xEDon dispara e chama refor\xE7os",
  "a fera marcada retorna com a matilha inteira",
  "algu\xE9m do grupo \xE9 reconhecido de um passado inc\xF4modo",
  "a negocia\xE7\xE3o vira assalto em um instante",
  "o guia some com o pagamento adiantado",
  "uma tempestade fecha as rotas de fuga",
  "o que parecia vivo era um isco; o predador observa",
  "o caminho de volta mudou desde que passaram",
  "uma criatura de n\xE9voa se alimenta do medo deles"
];
var ARMADILHAS = [
  {
    nome: "Placa de Press\xE3o de Mina",
    gatilho: "peso sobre placa disfar\xE7ada de laje",
    efeito: "detona carga de demoli\xE7\xE3o sob a v\xEDtima",
    evitar: "Percep\xE7\xE3o ou Minera\xE7\xE3o",
    dano: "2d6+2"
  },
  {
    nome: "Fio de \xCDon",
    gatilho: "fio fino entre batentes de uma porta",
    efeito: "arco el\xE9trico atravessa quem passa",
    evitar: "Percep\xE7\xE3o ou Opera\xE7\xE3o T\xE9cnica",
    dano: "1d8+el\xE9trico"
  },
  {
    nome: "Po\xE7a de Limo",
    gatilho: "pel\xEDcula que finge ser piso s\xF3lido",
    efeito: "afoga e dissolve lentamente",
    evitar: "Percep\xE7\xE3o ou Atletismo para escapar",
    dano: "1d6/rodada"
  },
  {
    nome: "Dardo de Cer\xE2mica",
    gatilho: "degrau falso em escada",
    efeito: "dardos envenenados de paredes",
    evitar: "Percep\xE7\xE3o ou Esquiva",
    dano: "1d4 + veneno"
  },
  {
    nome: "N\xE9voa Sopor\xEDfera",
    gatilho: "v\xE1lvula no ch\xE3o libera g\xE1s de bruma",
    efeito: "sonol\xEAncia e vis\xF5es; adormecer \xE9 fatal",
    evitar: "Resist\xEAncia ou Vontade",
    dano: "sopor"
  },
  {
    nome: "Colmeia Falsa",
    gatilho: "vaso ornamentado removido do pedestal",
    efeito: "enxame mordedor emerge do teto",
    evitar: "Conhecimento (fauna) ou furtividade",
    dano: "1d4/rodada (enxame)"
  },
  {
    nome: "Porta Esmagadora",
    gatilho: "mecanismo antigo ao abrir a fechadura errada",
    efeito: "folha de pedra desliza e prende",
    evitar: "Engenharia ou FOR Dif\xEDcil",
    dano: "2d6 + aprisionar"
  },
  {
    nome: "Eco de P\xE2nico",
    gatilho: "c\xE2mara ressonante no fim de corredor",
    efeito: "som amplificado semeia pavor",
    evitar: "Vontade ou Plugar ouvidos",
    dano: "p\xE2nico"
  },
  {
    nome: "Fenda Oculta",
    gatilho: "laje solta sobre po\xE7o de ventila\xE7\xE3o",
    efeito: "queda de 6 a 10 metros",
    evitar: "Percep\xE7\xE3o ou Esquiva",
    dano: "1d6 por 3 m de queda"
  },
  {
    nome: "Selo Ps\xEDquico",
    gatilho: "s\xEDmbolo gravado lido em voz alta",
    efeito: "atordoamento mental de dura\xE7\xE3o longa",
    evitar: "Vontade ou n\xE3o ler",
    dano: "atordoamento"
  }
];
var CHARADAS = [
  {
    pergunta: "Tenho cidades sem casas, rios sem \xE1gua e florestas sem \xE1rvores. O que sou?",
    resposta: "Um mapa (e em Calico, um mapa BOM custa caro)"
  },
  {
    pergunta: "Quanto mais voc\xEA tira de mim, maior eu fico. O que sou?",
    resposta: "Uma cova (pergunte \xE0 Mina das Costelas de Ferro)"
  },
  {
    pergunta: "Corro sem pernas, grito sem boca, nasci da pedra e morro no vento. O que sou?",
    resposta: "Um eco de trombeta"
  },
  {
    pergunta: "Todos me carregam, ningu\xE9m me v\xEA; sem mim a noite de Calico n\xE3o tem mar\xE9. O que sou?",
    resposta: "A lua (as fases governam mar\xE9s e supersti\xE7\xF5es)"
  },
  {
    pergunta: "Falo todas as l\xEDnguas sem boca, conto todos os segredos sem ouvido. O que sou?",
    resposta: "Um livro do Arquivo C\xEDvico"
  },
  {
    pergunta: "Duas irm\xE3s gemem sem voz, uma cega e outra surda; juntas m\xF3em o que ningu\xE9m v\xEA. O que s\xE3o?",
    resposta: "As duas pedras de moinho"
  },
  {
    pergunta: "Subo sempre e nunca chego, brilho de dia e morro \xE0 noite. O que sou?",
    resposta: "O p\xF3 de \xEDon suspenso sobre as Ruas Escavadas"
  },
  {
    pergunta: "Quanto mais se enche, mais leve fica. O que sou?",
    resposta: "Um bal\xE3o de observa\xE7\xE3o da Cidade Alta"
  }
];
var RECOMPENSAS_CREDITOS = [
  [20, "uma bolsa mi\xFAda: o pagamento some em d\xEDvidas no mesmo dia"],
  [50, "cr\xE9ditos suficientes para uma semana de taberna e informa\xE7\xE3o"],
  [120, "o equivalente a um sal\xE1rio mensal de t\xE9cnico de V\xE9spera"],
  [300, "paga uma passagem orbital ou compra sil\xEAncio de um agente"],
  [800, "fortuna de caravana: muda a vida de um plebeu para sempre"],
  [2e3, "tesouro de contrabando: a Cidade Alta vai querer saber"]
];
var RECOMPENSAS_ITENS = [
  "rel\xEDquia tribal com gravuras da chegada a Calico",
  "n\xFAcleo de \xEDon bruto do tamanho de um punho",
  "mapa autenticado das Ruas Escavadas (trecho in\xE9dito)",
  "arma de cer\xE2mica cerimonial da guarda do port\xE3o",
  "frasco de ess\xEAncia de trombeta (valor incalcul\xE1vel para alquimistas)",
  "dr\xF4me de escuta da Cidade Alta, ainda funcional",
  "pedra lunar polida que brilha na Lua Escura",
  "contrato de d\xEDvida assinado por algu\xE9m importante",
  "cristal de vidro-p\xE1lido cultivado (raro em tamanho grande)",
  "selo de passagem livre pelo Port\xE3o de V\xE9spera"
];
var DESCRICOES_CENARIO = [
  "Restos de acampamento de prospectores: cinzas frias, tr\xEAs marcas de tenda e um mapa rasgado pregado num espeto.",
  'Um letreiro de \xEDon pisca "FEIRA SEM LUZ \u2192" apontando para um t\xFAnel que cheira a oz\xF4nio.',
  "Lajes de pedra antigas sustentam cabos de energia novos; a Cidade Alta cresceu por cima da velha V\xE9spera.",
  "Marcas de garras altas demais para qualquer fera conhecida cruzam o caminho de leste a oeste.",
  "Uma carro\xE7a abandonada, ainda com carga lacrada: ningu\xE9m voltou para busc\xE1-la.",
  "Pilares de uma era anterior formam um p\xE1tio onde o mercado improvisado monta e desmonta a cada lua.",
  "\xC1gua escura pinga de um cano rompido, formando uma po\xE7a que reflete uma lua que n\xE3o est\xE1 no c\xE9u.",
  'Grafite recente: "OS METEOROS MENTEM" \u2014 abaixo, selo do Arquivo C\xEDvico tentando cobri-lo.',
  "Ossos de cila limpos pelo sol jazem em c\xEDrculo perfeito, como se algu\xE9m os tivesse arrumado.",
  "Uma banca de mercador intacta: moedas na gaveta, poeira em tudo, e nenhuma pegada saindo do local."
];

// fontes/mapforge/calico.ts
var CALICO_ESTACOES = [
  "Esta\xE7\xE3o dos Ventos",
  "Esta\xE7\xE3o das Brumas",
  "Esta\xE7\xE3o das Flores",
  "Esta\xE7\xE3o do Sol Alto",
  "Esta\xE7\xE3o das Tempestades",
  "Esta\xE7\xE3o das Folhas",
  "Esta\xE7\xE3o dos Meteoros",
  "Esta\xE7\xE3o das Estrelas"
];

// fontes/mapforge/npc/generator.ts
var PODERES = [
  { nivel: 1, rotulo: "Fraco", descricao: "cai com um golpe; press\xE3o moral ou num\xE9rica" },
  { nivel: 2, rotulo: "Comum", descricao: "equivalente a um civil armado" },
  { nivel: 3, rotulo: "Veterano", descricao: "soldado experiente; amea\xE7a para um her\xF3i" },
  { nivel: 4, rotulo: "Perigoso", descricao: "exige o grupo inteiro concentrado" },
  { nivel: 5, rotulo: "Elite", descricao: "rival de peso; pode derrubar um her\xF3i por rodada" },
  { nivel: 6, rotulo: "Lend\xE1rio", descricao: "chefe de sess\xE3o; o grupo deve se preparar" }
];
var PAPEIS = [
  { id: "plebeu", rotulo: "Plebeu (descart\xE1vel)" },
  { id: "profissional", rotulo: "Profissional" },
  { id: "mercador", rotulo: "Mercador" },
  { id: "elite", rotulo: "Elite" },
  { id: "combatente", rotulo: "Combatente" },
  { id: "inimigo", rotulo: "Inimigo" },
  { id: "acompanhante", rotulo: "Acompanhante do grupo" }
];
function carreirasPorPapel(papel, rng) {
  const combate = ["Soldado", "Guarda urbana", "Guarda do port\xE3o", "Lutador", "Mercen\xE1rio", "Ca\xE7ador", "Arma estrat\xE9gica", "Combate"];
  const suporte = ["M\xE9dico", "T\xE9cnico de energia", "T\xE9cnico de instrumentos", "T\xE9cnico portu\xE1rio", "Mec\xE2nica", "Mec\xE2nico", "Minerador"];
  const sociais = ["Comerciante", "Mercador Ambulante", "Mercante", "Cambista", "Estalajadeiro", "Atendente", "Administrador de taberna"];
  const mistas = ["Agente", "Mensageiro", "Mensageira", "Transportador", "Antiqu\xE1rio", "Analista ps\xEDquico", "Conselheira", "Chassis civil", "Bisca", "Trabalho/Manutenc\xE3o"];
  switch (papel) {
    case "plebeu":
      return [...sociais, ...mistas];
    case "mercador":
      return sociais;
    case "combatente":
    case "inimigo":
      return combate;
    case "acompanhante":
      return [...suporte, ...combate, "Ca\xE7ador"];
    case "elite":
      return ["Agente", "Arma estrat\xE9gica", "Conselheira", "Analista ps\xEDquico", ...combate];
    default: {
      const todas = CARREIRAS.map((c) => c.nome).filter((n) => n !== "0");
      return rng.shuffle([...todas]);
    }
  }
}
function rolarAtributos(rng, papel, poder) {
  const pesos = {
    plebeu: { INT: 1.2, CAR: 1.2, POD: 1, FOR: 0.8, DES: 0.9, CON: 0.9, TAM: 0.8 },
    profissional: { INT: 1.4, DES: 1.1, POD: 1.1, CAR: 1, FOR: 0.9, CON: 1, TAM: 0.9 },
    mercador: { CAR: 1.5, INT: 1.3, POD: 1, FOR: 0.7, DES: 0.9, CON: 0.9, TAM: 0.8 },
    combatente: { FOR: 1.5, CON: 1.4, DES: 1.4, POD: 1, INT: 0.8, CAR: 0.8, TAM: 1 },
    inimigo: { FOR: 1.5, CON: 1.4, DES: 1.4, POD: 1.1, INT: 0.8, CAR: 0.8, TAM: 1 },
    elite: { FOR: 1.3, CON: 1.3, DES: 1.3, INT: 1.2, POD: 1.2, CAR: 1.1, TAM: 1 },
    acompanhante: { DES: 1.3, INT: 1.2, POD: 1.2, FOR: 1, CON: 1.1, CAR: 1, TAM: 0.9 }
  };
  const total = POOL_ATRIBUTOS[Math.min(6, Math.max(1, poder)) - 1];
  const maxExtra = poder >= 6 ? 4 : poder === 5 ? 2 : 0;
  return distribuirAtributos(rng, total, pesos[papel], maxExtra);
}
var PERICIAS_COMUNS = [
  "Percep\xE7\xE3o",
  "Furtividade",
  "Idiomas",
  "Conhecimentos gerais",
  "Sobreviv\xEAncia",
  "Arte/Artesanato",
  "Primeiros socorros",
  "Navega\xE7\xE3o"
];
function montarPericias(rng, carreiraData, atributos, poder) {
  const base = (nome) => {
    const p = PERICIAS.find((pp) => pp.nome === nome);
    return p ? Math.max(5, basePericia(p.formula, atributos)) : 25;
  };
  const escolhidas = /* @__PURE__ */ new Map();
  const profissionais = [...carreiraData?.pericias ?? []];
  const nEspec = Math.min(profissionais.length, poder >= 5 ? 2 : 1);
  for (const p of rng.shuffle([...profissionais]).slice(0, nEspec)) {
    const alvo = Math.min(95, 48 + poder * 5 + rng.int(0, 9));
    escolhidas.set(p.nome, Math.max(alvo, base(p.nome)));
  }
  const restantes = profissionais.filter((p) => !escolhidas.has(p.nome));
  for (const p of rng.shuffle(restantes).slice(0, 2)) {
    escolhidas.set(p.nome, Math.min(90, base(p.nome) + 18 + rng.int(0, 8)));
  }
  const medias = rng.shuffle(PERICIAS_COMUNS.filter((n) => !escolhidas.has(n)));
  for (const nome of medias.slice(0, rng.int(2, 3))) {
    escolhidas.set(nome, Math.min(80, base(nome) + 8 + rng.int(0, 8)));
  }
  const fracas = rng.shuffle([
    ...PERICIAS_COMUNS.filter((n) => !escolhidas.has(n)),
    ...restantes.filter((p) => !escolhidas.has(p.nome))
  ]);
  for (const nome of fracas.slice(0, rng.int(1, 2))) {
    const n = typeof nome === "string" ? nome : nome.nome;
    escolhidas.set(n, Math.max(5, Math.min(20, base(n) + rng.int(-6, 2))));
  }
  return [...escolhidas.entries()].map(([nome, valor]) => ({ nome, valor: Math.min(99, Math.round(valor)) })).sort((a, b) => b.valor - a.valor);
}
function subAtributos(a) {
  return {
    sorte: sorteDe(a.POD),
    pontosMagia: pontosMagiaDe(a.POD),
    modDano: modDanoDe(a.FOR, a.TAM),
    modExperiencia: modExperienciaDe(a.CAR),
    taxaRecuperacao: taxaRecuperacaoDe(a.CON)
  };
}
function nomePorRaca(raca, rng) {
  const syl = raca.silabas;
  const tem = syl.inicio.length > 0 && syl.fim.length > 0;
  if (!tem) return rng.pick(raca.nomesExemplo.length ? raca.nomesExemplo : ["Sem Nome"]);
  const partes = rng.int(1, 2);
  const palavra = () => {
    let w = rng.pick(syl.inicio);
    if (syl.meio.length && rng.chance(0.55)) w += rng.pick(syl.meio);
    w += rng.pick(syl.fim);
    return w[0].toUpperCase() + w.slice(1);
  };
  const nome = Array.from({ length: partes }, palavra).join(" ");
  return nome;
}
function equipamentoPorPapel(papel, rng) {
  const tabela = papel === "elite" ? EQUIP_ELITE : papel === "combatente" || papel === "inimigo" ? EQUIP_COMBATE : papel === "mercador" ? EQUIP_MERCADOR : EQUIP_PLEBEU;
  return rng.shuffle([...tabela]).slice(0, rng.int(2, 3));
}
function gerarNpc(opcoes) {
  const rng = new RNG(opcoes.seed >>> 0);
  const fichas = [];
  for (let i = 0; i < Math.max(1, opcoes.quantidade); i++) {
    const raca = opcoes.racaId && opcoes.racaId !== "aleatoria" ? RACAS.find((r) => r.nome === opcoes.racaId) : rng.pick(RACAS);
    const carreiraPool = carreirasPorPapel(opcoes.papel, rng);
    const carreiraNome = opcoes.carreira && opcoes.carreira !== "aleatoria" ? opcoes.carreira : rng.pick(carreiraPool);
    const carreiraData = CARREIRAS.find((c) => c.nome === carreiraNome);
    const atributos = rolarAtributos(rng, opcoes.papel, opcoes.poder);
    const pericias = montarPericias(rng, carreiraData, atributos, opcoes.poder);
    const especIds = ESPECIALIZACOES_POR_CARREIRA[carreiraNome] ?? [];
    const especializacoes = rng.shuffle([...especIds]).map((sid) => ESPECIALIZACOES.find((x) => x.id === sid)).filter((e) => !!e).slice(0, 2).map((e) => ({
      nome: e.nome,
      valor: Math.min(95, basePericia(e.formula, atributos) + 15 + opcoes.poder * 3 + rng.int(0, 8))
    }));
    const tracos = rng.shuffle([...TRACOS_PERSONALIDADE]).slice(0, 2);
    const conceito = carreiraData && carreiraData.conceitos.length ? rng.pick(carreiraData.conceitos) : void 0;
    const idade = opcoes.papel === "plebeu" ? rng.int(17, 60) : rng.int(20, 70);
    fichas.push({
      id: `npc-${opcoes.seed}-${i}`,
      tipo: "npc",
      nome: nomePorRaca(raca, rng),
      papel: opcoes.papel,
      poder: opcoes.poder,
      poderRotulo: PODERES[opcoes.poder - 1].rotulo,
      raca: raca.nome,
      carreira: carreiraNome,
      conceito,
      classeSocial: carreiraData?.classes[0],
      idade,
      sexo: rng.pick(["N", "F", "M"]),
      atributos,
      pericias,
      pv: Math.ceil((atributos.CON + atributos.TAM) / 2),
      ...subAtributos(atributos),
      locais: pvPorLocal(atributos.CON, atributos.TAM),
      especializacoes: especializacoes.length ? especializacoes : void 0,
      xp: opcoes.poder * 2 + rng.int(0, opcoes.poder),
      motivacao: opcoes.papel === "acompanhante" ? "lealdade ao grupo \u2014 at\xE9 que a sorte os separe" : rng.pick(MOTIVACOES),
      tracos,
      equipamento: equipamentoPorPapel(opcoes.papel, rng),
      descricao: raca.descricaoFisica,
      lealdade: opcoes.papel === "acompanhante" ? rng.pick(["ferrenha", "contratada (leal enquanto paga)", "devotada", "cautelosa, ainda em avalia\xE7\xE3o"]) : void 0
    });
  }
  return { seed: opcoes.seed, fichas };
}
function poderAproximado(c) {
  const soma = c.atributos.FOR + c.atributos.CON + c.atributos.TAM + c.atributos.DES;
  if (soma >= 95) return 6;
  if (soma >= 75) return 5;
  if (soma >= 55) return 4;
  if (soma >= 40) return 3;
  if (soma >= 28) return 2;
  return 1;
}
function gerarCriaturas(opcoes) {
  const rng = new RNG(opcoes.seed >>> 0);
  let pool = CRIATURAS;
  if (opcoes.habitat && opcoes.habitat !== "qualquer") {
    const filtrado = pool.filter((c) => c.habitat.toLowerCase().includes(opcoes.habitat.toLowerCase()));
    if (filtrado.length) pool = filtrado;
  }
  if (opcoes.poderMin) {
    const filtrado = pool.filter((c) => poderAproximado(c) >= opcoes.poderMin);
    if (filtrado.length) pool = filtrado;
  }
  const base = opcoes.criaturaId && opcoes.criaturaId !== "aleatoria" ? CRIATURAS.find((c) => c.id === opcoes.criaturaId) : rng.pick(pool);
  const fichas = [];
  const n = Math.max(1, opcoes.quantidade);
  for (let i = 0; i < n; i++) {
    const jitterAtr = () => rng.jitter(2) | 0;
    const atributos = {
      FOR: Math.max(3, base.atributos.FOR + jitterAtr()),
      CON: Math.max(3, base.atributos.CON + jitterAtr()),
      TAM: Math.max(3, base.atributos.TAM + jitterAtr()),
      DES: Math.max(3, base.atributos.DES + jitterAtr()),
      INT: Math.max(3, base.atributos.INT + jitterAtr()),
      POD: Math.max(3, base.atributos.POD + jitterAtr()),
      CAR: Math.max(3, base.atributos.CAR + jitterAtr())
    };
    const poder = poderAproximado(base);
    fichas.push({
      id: `cria-${opcoes.seed}-${i}`,
      tipo: "criatura",
      nome: n > 1 ? `${base.nome} ${i + 1}` : base.nome,
      papel: "criatura",
      poder,
      poderRotulo: PODERES[poder - 1].rotulo,
      tamanho: base.tamanho,
      atributos,
      pericias: Object.entries(base.pericias).map(([nome, valor]) => ({ nome, valor: Math.min(95, Math.round(valor + rng.jitter(4))) })),
      pv: Math.ceil((atributos.CON + atributos.TAM) / 2) + base.armaduraNatural,
      ...subAtributos(atributos),
      locais: pvPorLocal(atributos.CON, atributos.TAM),
      tracos: n > 1 ? ["age em grupo, coordenado por instinto ou comando alfa"] : [],
      equipamento: [],
      armas: base.armas,
      habilidades: base.habilidades,
      armaduraNatural: base.armaduraNatural,
      deslocamento: base.deslocamento,
      voo: base.movimentoVoo > 0,
      natacao: base.movimentoNatacao > 0,
      descricao: base.descricao,
      habitat: base.habitat,
      comportamento: base.comportamento,
      especieId: base.id
    });
  }
  return { seed: opcoes.seed, fichas };
}
function rolarClima(seed, estacao) {
  const rng = new RNG(seed >>> 0);
  const est = estacao && estacao !== "aleatoria" ? estacao : rng.pick([...CALICO_ESTACOES]);
  const tabela = CLIMA_POR_ESTACAO[est] ?? CLIMA_POR_ESTACAO[CALICO_ESTACOES[0]];
  return { estacao: est, condicao: rng.pick(tabela) };
}
function gerarEncontro(seed) {
  const rng = new RNG(seed >>> 0);
  const clima = rolarClima(rng.int(0, 1e9));
  return {
    encontro: rng.pick(ENCONTROS_SOCIAIS),
    complicacao: rng.pick(COMPLICACOES),
    clima
  };
}
function gerarArmadilha(seed) {
  return new RNG(seed >>> 0).pick(ARMADILHAS);
}
function gerarCharada(seed) {
  return new RNG(seed >>> 0).pick(CHARADAS);
}
function gerarRecompensa(seed, poder = 3) {
  const rng = new RNG(seed >>> 0);
  const idx = Math.min(RECOMPENSAS_CREDITOS.length - 1, Math.max(0, Math.round((poder - 1) / 5 * (RECOMPENSAS_CREDITOS.length - 1) + rng.jitter(0.5))));
  const [creditos, nota] = RECOMPENSAS_CREDITOS[idx];
  return { creditos, nota, item: rng.pick(RECOMPENSAS_ITENS) };
}
function gerarCenarioDescricao(seed) {
  return new RNG(seed >>> 0).pick(DESCRICOES_CENARIO);
}
function habitatsDeCriaturas() {
  const set = /* @__PURE__ */ new Set();
  for (const c of CRIATURAS) {
    for (const h of c.habitat.split(",")) {
      const t = h.trim();
      if (t) set.add(t);
    }
  }
  return [...set].slice(0, 24);
}

// fontes/mapforge/npc/ai.ts
var REGRAS = [
  {
    match: /enxame/i,
    ai: {
      tipo: "enxame",
      agressividade: [0.6, 0.9],
      raio: [6, 14],
      iniciaHostil: true,
      conduta: "move-se como um s\xF3 organismo; se um ataca, todos atacam"
    }
  },
  {
    match: /emboscada|apanhar desprevenido|espera|imóvel|séssil/i,
    ai: {
      tipo: "emboscador",
      agressividade: [0.5, 0.85],
      raio: [1.5, 4],
      iniciaHostil: true,
      conduta: "permanece im\xF3vel e camuflado; ataca quando a presa est\xE1 ao alcance"
    }
  },
  {
    match: /territorial|defende|protege o ninho|guarda/i,
    ai: {
      tipo: "territorial",
      agressividade: [0.55, 0.9],
      raio: [4, 10],
      iniciaHostil: true,
      conduta: "patrulha o territ\xF3rio e ataca invasores sem aviso"
    }
  },
  {
    match: /persegui|caça|predador|atropelamento|veloz/i,
    ai: {
      tipo: "predador",
      agressividade: [0.6, 0.95],
      raio: [10, 22],
      iniciaHostil: true,
      conduta: "persegui\xE7\xE3o persistente; escolhe a presa mais lenta e n\xE3o desiste f\xE1cil"
    }
  },
  {
    match: /foge|evita|covard|oportunista|pequeno/i,
    ai: {
      tipo: "oportunista",
      agressividade: [0.15, 0.4],
      raio: [8, 16],
      iniciaHostil: false,
      conduta: "evita confronto; ataca apenas o isolado e desprevenido, foge se resistir"
    }
  },
  {
    match: /observa|hesita|tímido|curioso/i,
    ai: {
      tipo: "hesitante",
      agressividade: [0.2, 0.5],
      raio: [8, 14],
      iniciaHostil: false,
      conduta: "observa de longe; s\xF3 se aproxima se sentir vantagem esmagadora"
    }
  }
];
function rngDe(id) {
  return (hashSeed(id) >>> 0) / 4294967296;
}
function aiDaFicha(ficha) {
  const r = rngDe(ficha.id);
  if (ficha.tipo === "criatura") {
    const texto = `${ficha.comportamento ?? ""} ${ficha.especieId ?? ""} ${ficha.habitat ?? ""}`;
    for (const regra of REGRAS) {
      if (regra.match.test(texto)) {
        const { agressividade, raio, ...resto } = regra.ai;
        return {
          ...resto,
          agressividade: +(agressividade[0] + r * (agressividade[1] - agressividade[0])).toFixed(2),
          raio: +(raio[0] + r * (raio[1] - raio[0])).toFixed(1)
        };
      }
    }
    const forte = ficha.atributos.FOR + ficha.atributos.TAM >= 40;
    return forte ? {
      tipo: "territorial",
      agressividade: +(0.5 + r * 0.35).toFixed(2),
      raio: +(5 + r * 6).toFixed(1),
      iniciaHostil: true,
      conduta: "fera de disposi\xE7\xE3o bruta: defende seu espa\xE7o com for\xE7a"
    } : {
      tipo: "oportunista",
      agressividade: +(0.2 + r * 0.25).toFixed(2),
      raio: +(8 + r * 6).toFixed(1),
      iniciaHostil: false,
      conduta: "criatura arisca: evita contato e foge ao menor sinal de for\xE7a"
    };
  }
  switch (ficha.papel) {
    case "inimigo":
    case "combatente":
      return {
        tipo: "territorial",
        agressividade: +(0.6 + r * 0.3).toFixed(2),
        raio: +(6 + r * 6).toFixed(1),
        iniciaHostil: true,
        conduta: "hostil ao grupo; luta at\xE9 cair ou receber ordem de recuar"
      };
    case "elite":
      return {
        tipo: "predador",
        agressividade: +(0.65 + r * 0.3).toFixed(2),
        raio: +(8 + r * 8).toFixed(1),
        iniciaHostil: true,
        conduta: "ca\xE7a o grupo com m\xE9todo; usa o terreno e recuos t\xE1ticos"
      };
    case "acompanhante":
      return {
        tipo: "passivo",
        agressividade: 0,
        raio: 3,
        iniciaHostil: false,
        conduta: "segue o grupo; s\xF3 combate em defesa pr\xF3pria ou ordem direta"
      };
    case "plebeu":
    case "mercador":
      return {
        tipo: "oportunista",
        agressividade: +(0.05 + r * 0.15).toFixed(2),
        raio: +(6 + r * 6).toFixed(1),
        iniciaHostil: false,
        conduta: "civil: foge do perigo; pode negociar se encurralado"
      };
    default:
      return {
        tipo: "hesitante",
        agressividade: +(0.15 + r * 0.25).toFixed(2),
        raio: +(6 + r * 6).toFixed(1),
        iniciaHostil: false,
        conduta: "n\xE3o provoca; reage conforme tratado pelo grupo"
      };
  }
}
export {
  CARREIRAS,
  CRIATURAS,
  PAPEIS,
  PERICIAS,
  PODERES,
  RACAS,
  aiDaFicha,
  gerarArmadilha,
  gerarCenarioDescricao,
  gerarCharada,
  gerarCriaturas,
  gerarEncontro,
  gerarNpc,
  gerarRecompensa,
  habitatsDeCriaturas,
  hashSeed,
  rolarClima
};
