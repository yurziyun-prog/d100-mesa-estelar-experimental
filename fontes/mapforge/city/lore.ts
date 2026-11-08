/**
 * Lore urbana — usos e nomes de estabelecimentos por estilo, no espírito dos
 * geradores de cidades clássicos de RPG: cada prédio ganha uma função no
 * mundo (taverna, ferraria, lanchonete atômica…) e um nome próprio, sempre no
 * vocabulário do período do estilo. Conteúdo 100% original.
 */

import type { RNG } from '../rng';
import { CALICO_ESTABELECIMENTOS } from '../calico';

export interface Establishment {
  usage: string;
  names: string[];
  /** peso relativo na escolha (residências dominam) */
  weight: number;
}

const RESIDENCE_NAMES = [
  'Casa dos Vale', 'Casa Ferrant', 'Casa Okafor', 'Casa Lindgren',
  'Casa Marchetti', 'Casa Duarte', 'Casa Halloway', 'Casa Quintana',
];

const TABLES: Record<string, Establishment[]> = {
  retrofuturista: [
    { usage: 'Residência', names: RESIDENCE_NAMES, weight: 42 },
    { usage: 'Lanchonete atômica', names: ['O Átomo Dourado', 'Lanche Órbita', 'Satélite dos Milk-shakes'], weight: 8 },
    { usage: 'Cinema drive-in', names: ['Estrela & Lua', 'Cine Nebulosa', 'Tela Turquesa'], weight: 5 },
    { usage: 'Barbearia', names: ['Corte Solar', 'Bigode de Júpiter'], weight: 6 },
    { usage: 'Farmácia', names: ['Dr. Radium', 'Gota Vita'], weight: 6 },
    { usage: 'Loja de discos', names: ['Vitrola Cósmica', 'Vinil & Valvulado'], weight: 5 },
    { usage: 'Mercado', names: ['Empório Solaris', 'Super Nova'], weight: 7 },
    { usage: 'Delegacia', names: ['Distrito 7', 'Oitava Precint'], weight: 4 },
    { usage: 'Posto de serviço', names: ['Gasosa Estelar', 'Turbo & Cromo'], weight: 5 },
    { usage: 'Escola', names: ['Instituto Novo Amanhecer'], weight: 3 },
    { usage: 'Salão de baile', names: ['Rosa Atômica', 'O Somatório'], weight: 4 },
    { usage: 'Banco', names: ['Caixa Solar', 'Poupança Sideral'], weight: 5 },
  ],
  futurista: [
    { usage: 'Residência', names: RESIDENCE_NAMES, weight: 44 },
    { usage: 'Bar de oxigênio', names: ['Respira', 'Câmara Azul'], weight: 7 },
    { usage: 'Oficina de drones', names: ['Enxame 9', 'Asas & Fios'], weight: 7 },
    { usage: 'Câmara de criogenia', names: ['Sono Longo Ltda.'], weight: 4 },
    { usage: 'Mercado sintético', names: ['Nutri-Cubo', 'Vat 44'], weight: 7 },
    { usage: 'Clínica neural', names: ['Sinapse', 'NeuroLar'], weight: 5 },
    { usage: 'Arsenal', names: ['Escudo Cinza'], weight: 4 },
    { usage: 'Estação de carga', names: ['Nexo de Energia'], weight: 6 },
    { usage: 'Lavanderia de trajes', names: ['Vácuo Limpo'], weight: 5 },
    { usage: 'Cantina', names: ['Ração Sete', 'O Picolé'], weight: 6 },
    { usage: 'Hub de dados', names: ['Nó Central'], weight: 5 },
  ],
  medieval: [
    { usage: 'Residência', names: RESIDENCE_NAMES, weight: 40 },
    { usage: 'Taverna', names: ['O Javali Dourado', 'A Cruz Dividida', 'Descanso do Peregrino'], weight: 9 },
    { usage: 'Ferraria', names: ['Bigorna & Brasa', 'Forja do Tomás'], weight: 7 },
    { usage: 'Mercado', names: ['Feira das Três Colheres', 'Estoque do Mestre Pato'], weight: 7 },
    { usage: 'Templo', names: ['Capela de São Argo', 'Altar da Luz Baixa'], weight: 5 },
    { usage: 'Alfaiataria', names: ['Agulha de Prata', 'O Casaco Certo'], weight: 5 },
    { usage: 'Herborista', names: ['Ervas da Vella', 'Pote & Poção'], weight: 5 },
    { usage: 'Estalagem', names: ['Travesseiro de Palha', 'A Última Lareira'], weight: 6 },
    { usage: 'Carpintaria', names: ['Serra & Verniz'], weight: 5 },
    { usage: 'Guilda dos curtidores', names: ['Couro & Sal'], weight: 4 },
    { usage: 'Cartógrafo', names: ['Mapas do Irmão Bento'], weight: 3 },
    { usage: 'Poço comunitário', names: ['Poço da Praça'], weight: 4 },
  ],
  hiboriano: [
    { usage: 'Residência', names: RESIDENCE_NAMES, weight: 38 },
    { usage: 'Taverna', names: ['A Serpente de Bronze', 'Jarro Rachado', 'O Camelo Sedento'], weight: 9 },
    { usage: 'Armeiro', names: ['Cora de Aço', 'Lâminas de Akhit'], weight: 7 },
    { usage: 'Mercado', names: ['Bazar das Especiarias', 'Tapetes de Zorath'], weight: 8 },
    { usage: 'Templo', names: ['Altar de Set', 'Casa das Quatro Luas'], weight: 6 },
    { usage: 'Casa de banhos', names: ['Vapor & Mármore'], weight: 5 },
    { usage: 'Adega', names: ['Barril Negro', 'Sangue da Vinha'], weight: 5 },
    { usage: 'Estábulo', names: ['Casco & Crina'], weight: 5 },
    { usage: 'Adivinha', names: ['Olhos de Ísis', 'Tenda da Névoa'], weight: 4 },
    { usage: 'Fundição', names: ['Bronze do Deserto'], weight: 5 },
    { usage: 'Estalagem', names: ['Oasis dos Viajantes'], weight: 5 },
    { usage: 'Escola de gládios', names: ['Areia & Aço'], weight: 3 },
  ],
  hibrido: [
    { usage: 'Residência', names: RESIDENCE_NAMES, weight: 40 },
    { usage: 'Taverna', names: ['O Turquesa', 'Pedra & Néon', 'A Última Cápsula'], weight: 9 },
    { usage: 'Oficina de conduítes', names: ['Fio & Pedra', 'Válvulas do Mestre'], weight: 7 },
    { usage: 'Mercado de cristais', names: ['Geodo & Cia.', 'Frascos do Horizonte'], weight: 7 },
    { usage: 'Cartógrafo', names: ['Mapas de Ambos os Mundos'], weight: 4 },
    { usage: 'Ferraria antiga', names: ['Brasa Ancestral'], weight: 6 },
    { usage: 'Casa de chá', names: ['Bule de Cobre', 'Vapor & Especiaria'], weight: 5 },
    { usage: 'Boticário', names: ['Ervas & Éter'], weight: 5 },
    { usage: 'Terminal de comunicação', names: ['Posto do Céu'], weight: 4 },
    { usage: 'Estalagem', names: ['A Lareira de Neon'], weight: 6 },
    { usage: 'Templo de pedra', names: ['Colunas de Aço'], weight: 4 },
    { usage: 'Arsenal', names: ['O Dorso de Ferro'], weight: 3 },
    // vocabulário de Calico (Mesa Estelar) — planeta dos jogadores
    ...CALICO_ESTABELECIMENTOS,
  ],
};

const FALLBACK = TABLES.hibrido;

/** escolhe um estabelecimento e um nome, ponderado por estilo.
 *  `usedNames` (opcional) evita nomes repetidos na mesma cidade. */
export function pickEstablishment(
  styleId: string, rng: RNG, usedNames?: Set<string>,
): { usage: string; name: string } {
  const table = TABLES[styleId] ?? FALLBACK;
  const total = table.reduce((acc, e) => acc + e.weight, 0);
  let roll = rng.range(0, total);
  let chosen = table[0];
  for (const e of table) {
    roll -= e.weight;
    if (roll <= 0) { chosen = e; break; }
  }
  let name = rng.pick(chosen.names);
  if (usedNames) {
    let guard = 0;
    while (usedNames.has(name) && guard++ < chosen.names.length * 2) {
      name = rng.pick(chosen.names);
    }
    usedNames.add(name);
  }
  return { usage: chosen.usage, name };
}

/** lista dos usos possíveis por estilo (para testes e UI) */
export function listUsages(styleId: string): string[] {
  return (TABLES[styleId] ?? FALLBACK).map((e) => e.usage);
}
