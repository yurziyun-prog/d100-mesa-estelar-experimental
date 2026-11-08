/**
 * Especializações de carreira, copiadas dos dados padrão do jogo
 * (js/app/02-dados-padrao.js — carreirasDB.especializacoes e
 * especializacoesDB). GERADO — não editar à mão.
 */

export interface EspecializacaoData {
  id: string;
  nome: string;
  /** fórmula-base com atributos (ex.: 'DES*2') */
  formula: string;
}

export const ESPECIALIZACOES: EspecializacaoData[] = [
  { id: 'combate_pistola_laser', nome: "Combate com Pistola Laser", formula: "DES*2" },
  { id: 'atirador_elite', nome: "Atirador de Elite", formula: "DES+INT" },
  { id: 'arma_laser_pesada', nome: "Arma Laser Pesada", formula: "FOR+DES" },
  { id: 'luta_gravidade_zero', nome: "Luta em Gravidade Zero", formula: "DES+INT" },
  { id: 'guarda_costas_arma_longa', nome: "Guarda-Costas (Arma Longa/Escudo)", formula: "FOR+DES" },
  { id: 'combate_traje_espacial', nome: "Combate em Traje Espacial", formula: "DES+CON" },
  { id: 'psiquismo_materia', nome: "Psiquismo (Matéria)", formula: "INT+POD" },
  { id: 'psiquismo_mente', nome: "Psiquismo (Mente)", formula: "INT+POD" },
  { id: 'psiquismo_sentidos', nome: "Psiquismo (Sentidos)", formula: "INT+POD" },
];

/** nome da carreira → ids de especializações possíveis */
export const ESPECIALIZACOES_POR_CARREIRA: Record<string, string[]> = {
  "Caçador de Recompensas": ['combate_pistola_laser', 'atirador_elite'],
  "Pirata Espacial": ['luta_gravidade_zero', 'arma_laser_pesada'],
  "Guarda-Costas": ['guarda_costas_arma_longa', 'combate_pistola_laser'],
  "Militar": ['soldado_infantaria', 'arma_laser_pesada'],
  "Médico": [],
  "Engenheiro": [],
  "Piloto de Nave Estelar": ['combate_traje_espacial'],
};
