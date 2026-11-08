/**
 * Motor do gerador de NPCs e criaturas de Calico (Mesa Estelar).
 *
 * Sistema d100 (M-Space/Mythras): atributos FOR/CON/TAM/DES/INT/POD/CAR,
 * perícias percentuais. Todo o conteúdo vem dos bancos compilados em
 * `data.ts` (raças, carreiras, criaturas, perícias reais do jogo) e das
 * tabelas d100 de `tables.ts`. Determinístico por seed.
 */

import { RNG } from '../rng';
import {
  RACAS, CARREIRAS, CRIATURAS, PERICIAS,
  type CriaturaData, type RacaData,
} from './data';
import {
  POOL_ATRIBUTOS, distribuirAtributos, basePericia, pvPorLocal,
  sorteDe, pontosMagiaDe, modDanoDe, modExperienciaDe, taxaRecuperacaoDe,
} from './system';
import { ESPECIALIZACOES, ESPECIALIZACOES_POR_CARREIRA } from './especializacoes';
import {
  TRACOS_PERSONALIDADE, MOTIVACOES,
  EQUIP_PLEBEU, EQUIP_MERCADOR, EQUIP_COMBATE, EQUIP_ELITE,
  CLIMA_POR_ESTACAO,
  ENCONTROS_SOCIAIS, COMPLICACOES, ARMADILHAS, CHARADAS,
  RECOMPENSAS_CREDITOS, RECOMPENSAS_ITENS, DESCRICOES_CENARIO,
} from './tables';
import { CALICO_ESTACOES } from '../calico';

// ---------- tipos ----------

export const PODERES = [
  { nivel: 1, rotulo: 'Fraco', descricao: 'cai com um golpe; pressão moral ou numérica' },
  { nivel: 2, rotulo: 'Comum', descricao: 'equivalente a um civil armado' },
  { nivel: 3, rotulo: 'Veterano', descricao: 'soldado experiente; ameaça para um herói' },
  { nivel: 4, rotulo: 'Perigoso', descricao: 'exige o grupo inteiro concentrado' },
  { nivel: 5, rotulo: 'Elite', descricao: 'rival de peso; pode derrubar um herói por rodada' },
  { nivel: 6, rotulo: 'Lendário', descricao: 'chefe de sessão; o grupo deve se preparar' },
] as const;

export type PapelNpc =
  | 'plebeu' | 'profissional' | 'mercador' | 'elite'
  | 'combatente' | 'inimigo' | 'acompanhante';

export const PAPEIS: { id: PapelNpc; rotulo: string }[] = [
  { id: 'plebeu', rotulo: 'Plebeu (descartável)' },
  { id: 'profissional', rotulo: 'Profissional' },
  { id: 'mercador', rotulo: 'Mercador' },
  { id: 'elite', rotulo: 'Elite' },
  { id: 'combatente', rotulo: 'Combatente' },
  { id: 'inimigo', rotulo: 'Inimigo' },
  { id: 'acompanhante', rotulo: 'Acompanhante do grupo' },
];

export interface Atributos {
  FOR: number; CON: number; TAM: number; DES: number; INT: number; POD: number; CAR: number;
}

export interface NpcFicha {
  id: string;
  tipo: 'npc' | 'criatura';
  nome: string;
  papel: PapelNpc | 'criatura';
  poder: number; // 1..6
  poderRotulo: string;
  raca?: string;
  carreira?: string;
  conceito?: string;
  classeSocial?: string;
  idade?: number;
  sexo?: string;
  tamanho?: string;
  atributos: Atributos;
  pericias: { nome: string; valor: number }[];
  pv: number;
  /** sub-atributos derivados, pelas fórmulas do jogo */
  sorte: number;
  pontosMagia: number;
  modDano: string;
  modExperiencia: number;
  taxaRecuperacao: number;
  /** PV máximos por localização (ficha completa estilo jogador) */
  locais?: Record<string, number>;
  /** especializações de carreira com valor percentual */
  especializacoes?: { nome: string; valor: number }[];
  /** XP acumulado disponível para investir (promoção a personagem) */
  xp?: number;
  motivacao?: string;
  tracos: string[];
  equipamento: string[];
  armas?: string[];
  habilidades?: string[];
  armaduraNatural?: number;
  deslocamento?: number;
  voo?: boolean;
  natacao?: boolean;
  descricao: string;
  habitat?: string;
  comportamento?: string;
  lealdade?: string; // acompanhantes
  /** id da espécie no bestiário (criaturas) — liga à miniatura oficial */
  especieId?: string;
}

export interface Geracao {
  seed: number;
  fichas: NpcFicha[];
}

// ---------- helpers de tabela ----------

function carreirasPorPapel(papel: PapelNpc, rng: RNG): string[] {
  const combate = ['Soldado', 'Guarda urbana', 'Guarda do portão', 'Lutador', 'Mercenário', 'Caçador', 'Arma estratégica', 'Combate'];
  const suporte = ['Médico', 'Técnico de energia', 'Técnico de instrumentos', 'Técnico portuário', 'Mecânica', 'Mecânico', 'Minerador'];
  const sociais = ['Comerciante', 'Mercador Ambulante', 'Mercante', 'Cambista', 'Estalajadeiro', 'Atendente', 'Administrador de taberna'];
  const mistas = ['Agente', 'Mensageiro', 'Mensageira', 'Transportador', 'Antiquário', 'Analista psíquico', 'Conselheira', 'Chassis civil', 'Bisca', 'Trabalho/Manutencão'];
  switch (papel) {
    case 'plebeu': return [...sociais, ...mistas];
    case 'mercador': return sociais;
    case 'combatente': case 'inimigo': return combate;
    case 'acompanhante': return [...suporte, ...combate, 'Caçador'];
    case 'elite': return ['Agente', 'Arma estratégica', 'Conselheira', 'Analista psíquico', ...combate];
    default: {
      // profissional: filtra carreiras reais disponíveis
      const todas = CARREIRAS.map((c) => c.nome).filter((n) => n !== '0');
      return rng.shuffle([...todas]);
    }
  }
}

/**
 * Atributos pela criação de personagem do sistema (80 pts no nível herói,
 * mín 3 / mín 6 em TAM e INT, teto 18). O pool cresce com o nível de poder
 * e os pesos inclinam para a vocação do papel. Acima de 18 só poder 5-6
 * (elite/lendário), em 1-2 atributos-chave — heróis e vilões de destaque.
 */
function rolarAtributos(rng: RNG, papel: PapelNpc, poder: number): Atributos {
  const pesos: Record<PapelNpc, Record<string, number>> = {
    plebeu:      { INT: 1.2, CAR: 1.2, POD: 1, FOR: 0.8, DES: 0.9, CON: 0.9, TAM: 0.8 },
    profissional:{ INT: 1.4, DES: 1.1, POD: 1.1, CAR: 1, FOR: 0.9, CON: 1, TAM: 0.9 },
    mercador:    { CAR: 1.5, INT: 1.3, POD: 1, FOR: 0.7, DES: 0.9, CON: 0.9, TAM: 0.8 },
    combatente:  { FOR: 1.5, CON: 1.4, DES: 1.4, POD: 1, INT: 0.8, CAR: 0.8, TAM: 1 },
    inimigo:     { FOR: 1.5, CON: 1.4, DES: 1.4, POD: 1.1, INT: 0.8, CAR: 0.8, TAM: 1 },
    elite:       { FOR: 1.3, CON: 1.3, DES: 1.3, INT: 1.2, POD: 1.2, CAR: 1.1, TAM: 1 },
    acompanhante:{ DES: 1.3, INT: 1.2, POD: 1.2, FOR: 1, CON: 1.1, CAR: 1, TAM: 0.9 },
  };
  const total = POOL_ATRIBUTOS[Math.min(6, Math.max(1, poder)) - 1];
  const maxExtra = poder >= 6 ? 4 : poder === 5 ? 2 : 0;
  return distribuirAtributos(rng, total, pesos[papel], maxExtra) as Atributos;
}

/** básicas comuns de "origem" para o miolo da ficha */
const PERICIAS_COMUNS = [
  'Percepção', 'Furtividade', 'Idiomas', 'Conhecimentos gerais',
  'Sobrevivência', 'Arte/Artesanato', 'Primeiros socorros', 'Navegação',
];

/**
 * Perícias no perfil d100 descrito pelo mestre: pelo menos uma especialidade
 * acima de 50% (a da profissão), algumas boas, várias médias e uma ou duas
 * fracas (aprendizado que nunca terminou). Valores-base vêm da fórmula da
 * perícia com os atributos (igual ao jogo), depois o investimento por faixa.
 */
function montarPericias(
  rng: RNG,
  carreiraData: (typeof CARREIRAS)[number] | undefined,
  atributos: Atributos,
  poder: number,
): { nome: string; valor: number }[] {
  const base = (nome: string) => {
    const p = PERICIAS.find((pp) => pp.nome === nome);
    return p ? Math.max(5, basePericia(p.formula, atributos)) : 25;
  };
  const escolhidas = new Map<string, number>();
  const profissionais = [...(carreiraData?.pericias ?? [])];

  // especialidade da profissão (1-2): sempre acima de 50%
  const nEspec = Math.min(profissionais.length, poder >= 5 ? 2 : 1);
  for (const p of rng.shuffle([...profissionais]).slice(0, nEspec)) {
    const alvo = Math.min(95, 48 + poder * 5 + rng.int(0, 9));
    escolhidas.set(p.nome, Math.max(alvo, base(p.nome)));
  }
  // boas: até 2 outras profissionais
  const restantes = profissionais.filter((p) => !escolhidas.has(p.nome));
  for (const p of rng.shuffle(restantes).slice(0, 2)) {
    escolhidas.set(p.nome, Math.min(90, base(p.nome) + 18 + rng.int(0, 8)));
  }
  // médias: 2-3 básicas comuns de origem/hobbie
  const medias = rng.shuffle(PERICIAS_COMUNS.filter((n) => !escolhidas.has(n)));
  for (const nome of medias.slice(0, rng.int(2, 3))) {
    escolhidas.set(nome, Math.min(80, base(nome) + 8 + rng.int(0, 8)));
  }
  // fracas: 1-2 aprendizados inacabados
  const fracas = rng.shuffle([
    ...PERICIAS_COMUNS.filter((n) => !escolhidas.has(n)),
    ...restantes.filter((p) => !escolhidas.has(p.nome)),
  ]);
  for (const nome of fracas.slice(0, rng.int(1, 2))) {
    const n = typeof nome === 'string' ? nome : nome.nome;
    escolhidas.set(n, Math.max(5, Math.min(20, base(n) + rng.int(-6, 2))));
  }

  return [...escolhidas.entries()]
    .map(([nome, valor]) => ({ nome, valor: Math.min(99, Math.round(valor)) }))
    .sort((a, b) => b.valor - a.valor);
}

/** sub-atributos derivados (fórmulas do jogo) */
function subAtributos(a: Atributos) {
  return {
    sorte: sorteDe(a.POD),
    pontosMagia: pontosMagiaDe(a.POD),
    modDano: modDanoDe(a.FOR, a.TAM),
    modExperiencia: modExperienciaDe(a.CAR),
    taxaRecuperacao: taxaRecuperacaoDe(a.CON),
  };
}

function nomePorRaca(raca: RacaData, rng: RNG): string {
  const syl = raca.silabas;
  const tem = syl.inicio.length > 0 && syl.fim.length > 0;
  if (!tem) return rng.pick(raca.nomesExemplo.length ? raca.nomesExemplo : ['Sem Nome']);
  const partes = rng.int(1, 2);
  const palavra = () => {
    let w = rng.pick(syl.inicio);
    if (syl.meio.length && rng.chance(0.55)) w += rng.pick(syl.meio);
    w += rng.pick(syl.fim);
    return w[0].toUpperCase() + w.slice(1);
  };
  const nome = Array.from({ length: partes }, palavra).join(' ');
  return nome;
}

function equipamentoPorPapel(papel: PapelNpc, rng: RNG): string[] {
  const tabela = papel === 'elite' ? EQUIP_ELITE
    : papel === 'combatente' || papel === 'inimigo' ? EQUIP_COMBATE
      : papel === 'mercador' ? EQUIP_MERCADOR
        : EQUIP_PLEBEU;
  return rng.shuffle([...tabela]).slice(0, rng.int(2, 3));
}

// ---------- gerador principal ----------

export interface OpcoesGeracao {
  seed: number;
  papel: PapelNpc;
  poder: number; // 1..6
  quantidade: number; // matilha, grupo etc.
  racaId?: string;    // fixar raça ('aleatoria' para sortear)
  carreira?: string;  // fixar carreira
}

export function gerarNpc(opcoes: OpcoesGeracao): Geracao {
  const rng = new RNG(opcoes.seed >>> 0);
  const fichas: NpcFicha[] = [];

  for (let i = 0; i < Math.max(1, opcoes.quantidade); i++) {
    const raca = opcoes.racaId && opcoes.racaId !== 'aleatoria'
      ? RACAS.find((r) => r.nome === opcoes.racaId)!
      : rng.pick(RACAS);
    const carreiraPool = carreirasPorPapel(opcoes.papel, rng);
    const carreiraNome = opcoes.carreira && opcoes.carreira !== 'aleatoria'
      ? opcoes.carreira
      : rng.pick(carreiraPool);
    const carreiraData = CARREIRAS.find((c) => c.nome === carreiraNome);
    const atributos = rolarAtributos(rng, opcoes.papel, opcoes.poder);
    const pericias = montarPericias(rng, carreiraData, atributos, opcoes.poder);
    // ficha completa estilo jogador: localizações, especializações da carreira, XP
    const especIds = ESPECIALIZACOES_POR_CARREIRA[carreiraNome] ?? [];
    const especializacoes = rng.shuffle([...especIds])
      .map((sid) => ESPECIALIZACOES.find((x) => x.id === sid))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .slice(0, 2)
      .map((e) => ({
        nome: e.nome,
        valor: Math.min(95, basePericia(e.formula, atributos) + 15 + opcoes.poder * 3 + rng.int(0, 8)),
      }));
    const tracos = rng.shuffle([...TRACOS_PERSONALIDADE]).slice(0, 2);
    const conceito = carreiraData && carreiraData.conceitos.length
      ? rng.pick(carreiraData.conceitos) : undefined;
    const idade = opcoes.papel === 'plebeu' ? rng.int(17, 60) : rng.int(20, 70);

    fichas.push({
      id: `npc-${opcoes.seed}-${i}`,
      tipo: 'npc',
      nome: nomePorRaca(raca, rng),
      papel: opcoes.papel,
      poder: opcoes.poder,
      poderRotulo: PODERES[opcoes.poder - 1].rotulo,
      raca: raca.nome,
      carreira: carreiraNome,
      conceito,
      classeSocial: carreiraData?.classes[0],
      idade,
      sexo: rng.pick(['N', 'F', 'M']),
      atributos,
      pericias,
      pv: Math.ceil((atributos.CON + atributos.TAM) / 2),
      ...subAtributos(atributos),
      locais: pvPorLocal(atributos.CON, atributos.TAM),
      especializacoes: especializacoes.length ? especializacoes : undefined,
      xp: opcoes.poder * 2 + rng.int(0, opcoes.poder),
      motivacao: opcoes.papel === 'acompanhante'
        ? 'lealdade ao grupo — até que a sorte os separe'
        : rng.pick(MOTIVACOES),
      tracos,
      equipamento: equipamentoPorPapel(opcoes.papel, rng),
      descricao: raca.descricaoFisica,
      lealdade: opcoes.papel === 'acompanhante'
        ? rng.pick(['ferrenha', 'contratada (leal enquanto paga)', 'devotada', 'cautelosa, ainda em avaliação'])
        : undefined,
    });
  }
  return { seed: opcoes.seed, fichas };
}

// ---------- criaturas ----------

export interface OpcoesCriatura {
  seed: number;
  quantidade: number;
  criaturaId?: string; // fixar espécie; senão sorteia
  habitat?: string;    // filtra por habitat (bioma do mapa)
  poderMin?: number;   // filtra por força aproximada
}

function poderAproximado(c: CriaturaData): number {
  const soma = c.atributos.FOR + c.atributos.CON + c.atributos.TAM + c.atributos.DES;
  if (soma >= 95) return 6;
  if (soma >= 75) return 5;
  if (soma >= 55) return 4;
  if (soma >= 40) return 3;
  if (soma >= 28) return 2;
  return 1;
}

export function gerarCriaturas(opcoes: OpcoesCriatura): Geracao {
  const rng = new RNG(opcoes.seed >>> 0);
  let pool = CRIATURAS;
  if (opcoes.habitat && opcoes.habitat !== 'qualquer') {
    const filtrado = pool.filter((c) =>
      c.habitat.toLowerCase().includes(opcoes.habitat!.toLowerCase()));
    if (filtrado.length) pool = filtrado;
  }
  if (opcoes.poderMin) {
    const filtrado = pool.filter((c) => poderAproximado(c) >= opcoes.poderMin!);
    if (filtrado.length) pool = filtrado;
  }
  const base = opcoes.criaturaId && opcoes.criaturaId !== 'aleatoria'
    ? CRIATURAS.find((c) => c.id === opcoes.criaturaId)!
    : rng.pick(pool);

  const fichas: NpcFicha[] = [];
  const n = Math.max(1, opcoes.quantidade);
  for (let i = 0; i < n; i++) {
    const jitterAtr = (): number => rng.jitter(2) | 0;
    const atributos: Atributos = {
      FOR: Math.max(3, base.atributos.FOR + jitterAtr()),
      CON: Math.max(3, base.atributos.CON + jitterAtr()),
      TAM: Math.max(3, base.atributos.TAM + jitterAtr()),
      DES: Math.max(3, base.atributos.DES + jitterAtr()),
      INT: Math.max(3, base.atributos.INT + jitterAtr()),
      POD: Math.max(3, base.atributos.POD + jitterAtr()),
      CAR: Math.max(3, base.atributos.CAR + jitterAtr()),
    };
    const poder = poderAproximado(base);
    fichas.push({
      id: `cria-${opcoes.seed}-${i}`,
      tipo: 'criatura',
      nome: n > 1 ? `${base.nome} ${i + 1}` : base.nome,
      papel: 'criatura',
      poder,
      poderRotulo: PODERES[poder - 1].rotulo,
      tamanho: base.tamanho,
      atributos,
      pericias: Object.entries(base.pericias)
        .map(([nome, valor]) => ({ nome, valor: Math.min(95, Math.round(valor + rng.jitter(4))) })),
      pv: Math.ceil((atributos.CON + atributos.TAM) / 2) + base.armaduraNatural,
      ...subAtributos(atributos),
      locais: pvPorLocal(atributos.CON, atributos.TAM),
      tracos: n > 1 ? ['age em grupo, coordenado por instinto ou comando alfa'] : [],
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
      especieId: base.id,
    });
  }
  return { seed: opcoes.seed, fichas };
}

// ---------- ferramentas do mestre (clima, encontro, etc.) ----------

export function rolarClima(seed: number, estacao?: string): { estacao: string; condicao: string } {
  const rng = new RNG(seed >>> 0);
  const est = estacao && estacao !== 'aleatoria' ? estacao : rng.pick([...CALICO_ESTACOES]);
  const tabela = CLIMA_POR_ESTACAO[est] ?? CLIMA_POR_ESTACAO[CALICO_ESTACOES[0]];
  return { estacao: est, condicao: rng.pick(tabela) };
}

export function gerarEncontro(seed: number): {
  encontro: string; complicacao: string; clima: { estacao: string; condicao: string };
} {
  const rng = new RNG(seed >>> 0);
  const clima = rolarClima(rng.int(0, 1e9));
  return {
    encontro: rng.pick(ENCONTROS_SOCIAIS),
    complicacao: rng.pick(COMPLICACOES),
    clima,
  };
}

export function gerarArmadilha(seed: number) {
  return new RNG(seed >>> 0).pick(ARMADILHAS);
}

export function gerarCharada(seed: number) {
  return new RNG(seed >>> 0).pick(CHARADAS);
}

export function gerarRecompensa(seed: number, poder = 3): { creditos: number; nota: string; item: string } {
  const rng = new RNG(seed >>> 0);
  const idx = Math.min(RECOMPENSAS_CREDITOS.length - 1, Math.max(0, Math.round((poder - 1) / 5 * (RECOMPENSAS_CREDITOS.length - 1) + rng.jitter(0.5))));
  const [creditos, nota] = RECOMPENSAS_CREDITOS[idx];
  return { creditos, nota, item: rng.pick(RECOMPENSAS_ITENS) };
}

export function gerarCenarioDescricao(seed: number): string {
  return new RNG(seed >>> 0).pick(DESCRICOES_CENARIO);
}

/** lista de habitats/distritos para o filtro de criaturas */
export function habitatsDeCriaturas(): string[] {
  const set = new Set<string>();
  for (const c of CRIATURAS) {
    for (const h of c.habitat.split(',')) {
      const t = h.trim();
      if (t) set.add(t);
    }
  }
  return [...set].slice(0, 24);
}

export { CRIATURAS };
