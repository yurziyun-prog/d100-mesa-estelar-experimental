/**
 * Lore de DUNGEON — detalhes sensoriais por estilo, no espírito dos
 * geradores de salas aleatórias clássicos: cada sala pode ganhar uma nota de
 * atmosfera (cheiro, som, marca, vestígio) que o mestre lê no export e narra
 * aos jogadores. Não é renderizado no mapa — vive só nos dados do jogo.
 * Conteúdo 100% original.
 */

import type { RNG } from './rng';
import { CALICO_DETALHES } from './calico';

const DETAILS: Record<string, string[]> = {
  retrofuturista: [
    'cheiro de ozônio queimado paira no ar',
    'um letreiro de néon pisca: FECHE A PORTA',
    'fios expostos crepitam sob uma grade solta',
    'máquina de venda automática ainda está quente',
    'grafite em vermelho: NÃO ABRA',
    'o chão treme com um zumbido grave e contínuo',
    'copos de milk-shake empoeirados sobre uma mesa',
    'um rádio de válvulas sintoniza só estática',
    'faixas de piso descascadas revelam cabos grossos',
    'cartaz promocional: "O amanhã começa hoje!"',
  ],
  futurista: [
    'o ar cheira a plástico recém-impresso',
    'um drone de limpeza gira em círculos, sem saída',
    'holograma defeituoso repete: senha incorreta',
    'rastros magnéticos de botas atravessam o piso',
    'a iluminação reage ao movimento, um segundo atrasada',
    'cápsulas de sono entreabertas exalam frio',
    'painel de vidro rachado do lado de dentro',
    'um enxame de microdrones observa, mas não age',
    'registro de acesso apagado há três minutos',
    'o silêncio é total — nem ventilação, nada',
  ],
  medieval: [
    'cheiro de cera e ferro velho',
    'velas derreteiras ainda fumegam no castiçal',
    'carrascos de graveto pendurados por um fio',
    'poça rasa com reflexo de uma tocha apagada',
    'marca de bota ensanguentada leva à parede',
    'pão duro e queijo sobre um pano dobrado',
    'um coro de ratos corre atrás da estante',
    'inscrição rústica: aqui dorme o vigia',
    'cadeiras viradas como se a mesa fosse erguida',
    'rastro de lama que secou em espiral',
  ],
  hiboriano: [
    'cheiro de mirra e suor seco',
    'símbolos de Set cinzelados no batente',
    'areia fina cobre o piso em dunas pequenas',
    'um elmo com crista partida serve de cinzeiro',
    'cordas de tripa secam penduradas no teto',
    'pegadas de sandália desaparecem no centro da sala',
    'cerâmica quebrada com piche ainda pegajoso',
    'ragnarr de cobre tilinta ao vento que não existe',
    'marca de garra de três pontas na parede',
    'um tapete enrolado esconde algo pesado',
  ],
  hibrido: [
    'cheiro de pedra molhada e circuito quente',
    'um conduíte de néon atravessa o teto de pedra',
    'entalhe antigo reaproveitado como terminal de dados',
    'faíscas azuis dançam sobre runas cobertas de musgo',
    'cadeira de madeira encarada a uma cápsula de vidro',
    'inscrição dupla: runa por baixo, código por cima',
    'o eco dos passos sai com meio segundo de atraso',
    'cobre e cristal crescem juntos da parede',
    'um sino de bronze está ligado a um sensor',
    'poeira de duas cores — cinza e turquesa',
    // vocabulário de Calico (Mesa Estelar)
    ...CALICO_DETALHES,
  ],
};

const FALLBACK = DETAILS.hiboriano;

/** lista os detalhes de um estilo (para testes) */
export function listDetails(styleId: string): string[] {
  return DETAILS[styleId] ?? FALLBACK;
}

/** sorteia um detalhe sensorial; ~35% das salas ganham um */
export function pickDetail(styleId: string, rng: RNG): string | undefined {
  if (!rng.chance(0.35)) return undefined;
  const table = DETAILS[styleId] ?? FALLBACK;
  return rng.pick(table);
}
