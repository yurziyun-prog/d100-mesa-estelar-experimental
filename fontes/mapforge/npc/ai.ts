/**
 * IA dos atores — derivada do comportamento declarado no bestiário da Mesa
 * Estelar (campo `comportamento`) e do papel do NPC. Exportada no "Dados de
 * jogo" para o Mesa Estelar executar, e usada aqui para o "passo de vida"
 * (simulação visual de patrulha no Map Forge).
 */

import { hashSeed } from '../rng';
import type { NpcFicha } from './generator';
import type { MapToken } from './token-layer';

export type AiTipo =
  | 'predador'      // persegue presas em campo aberto
  | 'emboscador'    // fica parado/atrapalhado até a presa chegar perto
  | 'territorial'   // patrulha um território fixo e expulsa invasores
  | 'enxame'        // move-se junto do grupo, coordenado
  | 'oportunista'   // evita confronto direto; ataca o mais fraco/foge
  | 'hesitante'     // observa de longe, recua se enfrentado
  | 'passivo';      // não inicia combate (plebeus, animais mansos)

export interface ActorAi {
  tipo: AiTipo;
  /** 0..1 — chance de iniciar hostilidades */
  agressividade: number;
  /** metros — raio do território/patrulha */
  raio: number;
  /** true = começa hostil ao ver os heróis */
  iniciaHostil: boolean;
  /** texto do mestre sobre como conduzir a criatura */
  conduta: string;
}

const REGRAS: { match: RegExp; ai: Omit<ActorAi, 'agressividade' | 'raio'> & { agressividade: [number, number]; raio: [number, number] } }[] = [
  {
    match: /enxame/i,
    ai: { tipo: 'enxame', agressividade: [0.6, 0.9], raio: [6, 14],
      iniciaHostil: true,
      conduta: 'move-se como um só organismo; se um ataca, todos atacam' },
  },
  {
    match: /emboscada|apanhar desprevenido|espera|imóvel|séssil/i,
    ai: { tipo: 'emboscador', agressividade: [0.5, 0.85], raio: [1.5, 4],
      iniciaHostil: true,
      conduta: 'permanece imóvel e camuflado; ataca quando a presa está ao alcance' },
  },
  {
    match: /territorial|defende|protege o ninho|guarda/i,
    ai: { tipo: 'territorial', agressividade: [0.55, 0.9], raio: [4, 10],
      iniciaHostil: true,
      conduta: 'patrulha o território e ataca invasores sem aviso' },
  },
  {
    match: /persegui|caça|predador|atropelamento|veloz/i,
    ai: { tipo: 'predador', agressividade: [0.6, 0.95], raio: [10, 22],
      iniciaHostil: true,
      conduta: 'perseguição persistente; escolhe a presa mais lenta e não desiste fácil' },
  },
  {
    match: /foge|evita|covard|oportunista|pequeno/i,
    ai: { tipo: 'oportunista', agressividade: [0.15, 0.4], raio: [8, 16],
      iniciaHostil: false,
      conduta: 'evita confronto; ataca apenas o isolado e desprevenido, foge se resistir' },
  },
  {
    match: /observa|hesita|tímido|curioso/i,
    ai: { tipo: 'hesitante', agressividade: [0.2, 0.5], raio: [8, 14],
      iniciaHostil: false,
      conduta: 'observa de longe; só se aproxima se sentir vantagem esmagadora' },
  },
];

function rngDe(id: string): number {
  return (hashSeed(id) >>> 0) / 4294967296;
}

/** deriva a IA de uma ficha (criatura usa comportamento; NPC usa papel) */
export function aiDaFicha(ficha: NpcFicha): ActorAi {
  const r = rngDe(ficha.id);
  if (ficha.tipo === 'criatura') {
    const texto = `${ficha.comportamento ?? ''} ${ficha.especieId ?? ''} ${ficha.habitat ?? ''}`;
    for (const regra of REGRAS) {
      if (regra.match.test(texto)) {
        const { agressividade, raio, ...resto } = regra.ai;
        return { ...resto,
          agressividade: +(agressividade[0] + r * (agressividade[1] - agressividade[0])).toFixed(2),
          raio: +(raio[0] + r * (raio[1] - raio[0])).toFixed(1) };
      }
    }
    // fallback: perfil pelo tamanho/força — feras grandes são territoriais
    const forte = (ficha.atributos.FOR + ficha.atributos.TAM) >= 40;
    return forte
      ? { tipo: 'territorial', agressividade: +(0.5 + r * 0.35).toFixed(2), raio: +(5 + r * 6).toFixed(1),
          iniciaHostil: true, conduta: 'fera de disposição bruta: defende seu espaço com força' }
      : { tipo: 'oportunista', agressividade: +(0.2 + r * 0.25).toFixed(2), raio: +(8 + r * 6).toFixed(1),
          iniciaHostil: false, conduta: 'criatura arisca: evita contato e foge ao menor sinal de força' };
  }
  // NPCs
  switch (ficha.papel) {
    case 'inimigo': case 'combatente':
      return { tipo: 'territorial', agressividade: +(0.6 + r * 0.3).toFixed(2), raio: +(6 + r * 6).toFixed(1),
        iniciaHostil: true, conduta: 'hostil ao grupo; luta até cair ou receber ordem de recuar' };
    case 'elite':
      return { tipo: 'predador', agressividade: +(0.65 + r * 0.3).toFixed(2), raio: +(8 + r * 8).toFixed(1),
        iniciaHostil: true, conduta: 'caça o grupo com método; usa o terreno e recuos táticos' };
    case 'acompanhante':
      return { tipo: 'passivo', agressividade: 0, raio: 3, iniciaHostil: false,
        conduta: 'segue o grupo; só combate em defesa própria ou ordem direta' };
    case 'plebeu': case 'mercador':
      return { tipo: 'oportunista', agressividade: +(0.05 + r * 0.15).toFixed(2), raio: +(6 + r * 6).toFixed(1),
        iniciaHostil: false, conduta: 'civil: foge do perigo; pode negociar se encurralado' };
    default:
      return { tipo: 'hesitante', agressividade: +(0.15 + r * 0.25).toFixed(2), raio: +(6 + r * 6).toFixed(1),
        iniciaHostil: false, conduta: 'não provoca; reage conforme tratado pelo grupo' };
  }
}

/**
 * "Passo de vida": um tick de patrulha determinístico. Cada tipo de IA se
 * move de um jeito (órbita, vai-e-vem, deriva de enxame, imóvel). O token
 * precisa ter `ox`/`oy` (origem = onde foi introduzido no mapa).
 */
export function passoDeVida(token: MapToken & { ox?: number; oy?: number }, tick: number): { x: number; y: number } {
  const ai = aiDaFicha(token.ficha);
  const ox = token.ox ?? token.x;
  const oy = token.oy ?? token.y;
  const fase = ((hashSeed(token.id) >>> 8) % 628) / 100; // fase própria 0..2π
  const t = tick / 6; // passos suaves

  switch (ai.tipo) {
    case 'emboscador':
    case 'passivo':
      return { x: ox, y: oy }; // imóvel
    case 'territorial': {
      // órbita hexagonal do território
      const ang = fase + Math.floor(t) * (Math.PI / 3);
      const r = ai.raio * (0.55 + 0.45 * (((hashSeed(token.id + 'r') >>> 4) % 100) / 100));
      return { x: ox + Math.cos(ang) * r, y: oy + Math.sin(ang) * r };
    }
    case 'predador': {
      // vai-e-vem alongado
      const alvo = Math.sin(fase + t * 0.7) >= 0 ? 1 : -1;
      const dx = Math.cos(fase) * ai.raio * 0.8 * alvo;
      const dy = Math.sin(fase) * ai.raio * 0.8 * alvo;
      return { x: ox + dx, y: oy + dy };
    }
    case 'enxame': {
      // deriva coesa ao redor da origem do grupo
      const r = ai.raio * 0.25;
      return {
        x: ox + Math.cos(fase + t * 0.5) * r,
        y: oy + Math.sin(fase * 2 + t * 0.5) * r,
      };
    }
    default: { // oportunista / hesitante — zigue-zague curioso
      const px = Math.sin(fase + t) * ai.raio * 0.35;
      const py = Math.cos(fase * 1.7 + t * 0.8) * ai.raio * 0.35;
      return { x: ox + px, y: oy + py };
    }
  }
}
