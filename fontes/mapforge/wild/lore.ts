/**
 * Lore de EXTERIORES — pontos de interesse nomeados por bioma, no espírito
 * dos geradores de região clássicos: cada mapa aberto ganha 1–2 locais com
 * nome próprio que dão gancho de aventura (acampamentos, ermidas, veios de
 * minério…). Os nomes de Calico (Mesa Estelar) entram por fusão nas tabelas
 * do estilo híbrido. Conteúdo 100% original.
 */

import { CALICO_POIS } from '../calico';

export const BIOME_POIS: Record<string, string[]> = {
  floresta: [
    'Clareira dos Cervos',
    'Pedra do Velho Corvo',
    'Acampamento Abandonado',
    'Árvore-Mãe',
    'Toca do Javali Cinzento',
    'Fonte Esquecida',
    'Cercado de Estacas',
    'Trilha dos Caçadores',
    ...CALICO_POIS.floresta,
  ],
  penhasco: [
    'Ninho do Trovão',
    'Passo do Andarilho',
    'Ermida de Pedra',
    'Ponte de Cordinhas',
    'Alto das Águias',
    'Refúgio do Faroleiro',
    'Laje Ecoante',
    'Cairn dos Sete',
    ...CALICO_POIS.penhasco,
  ],
  campo: [
    'Poço dos Três Ventos',
    'Fazenda Esquecida',
    'Moinho Quebrado',
    'Cruzeiro de Estrada',
    'Olival Solitário',
    'Cercado Caído',
    'Fonte do Mercador',
    'Colina dos Sinos',
    ...CALICO_POIS.campo,
  ],
  mina: [
    'Galeria Colapsada',
    'Poço de Extração VII',
    'Acampamento dos Prospectores',
    'Veta de Cristal Bruto',
    'Oficina dos Ferros',
    'Elevador de Carga',
    'Túnel Inundado',
    'Memorial da Caveira',
    ...CALICO_POIS.mina,
  ],
};

const FALLBACK = BIOME_POIS.floresta;

/** nomes disponíveis por bioma (para testes e UI) — retorna cópia: o gerador
 *  embaralha a lista, e o array-fonte do módulo não pode ser mutado */
export function listPoiNames(biome: string): string[] {
  return [...(BIOME_POIS[biome] ?? FALLBACK)];
}
