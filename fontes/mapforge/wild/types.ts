/**
 * Tipos do gerador de EXTERIORES — mapas abertos (floresta, penhasco,
 * campo, mina) nos quais os jogadores exploram entre dungeons e cidades.
 * Mesma filosofia do resto do motor: geometria vetorial em metros,
 * determinística por seed, com terreno em grade editável.
 */

export type Biome = 'floresta' | 'penhasco' | 'campo' | 'mina';

export const BIOMES: Biome[] = ['floresta', 'penhasco', 'campo', 'mina'];

export const BIOME_LABELS: Record<Biome, string> = {
  floresta: 'Floresta',
  penhasco: 'Penhasco',
  campo: 'Campo aberto',
  mina: 'Mina / pedreira',
};

/** tipos de terreno da grade (índice estável — usado no JSON) */
export const TERRAINS = ['grass', 'dirt', 'rock', 'water', 'sand', 'field'] as const;
export type TerrainKind = (typeof TERRAINS)[number];

export interface Vec { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

/** grade de terreno: células quadradas `cell` metros, linha-major */
export interface TerrainGrid {
  cell: number;
  cols: number;
  rows: number;
  /** TERRAINS.index, linha-major: data[y * cols + x] */
  data: TerrainKind[];
}

export interface WildTrail {
  id: string;
  /** largura do caminho (m) */
  width: number;
  /** polilinha do caminho; trails[0] sai do spawn, uma por saída */
  path: Vec[];
  /** se true, leva a uma saída de borda (senão é atalho/ramal) */
  toExit?: boolean;
}

/** escarpa/penhasco: polilinha com lado alto indicado pela normal a->b */
export interface WildCliff {
  id: string;
  path: Vec[];
  /** altura da face (m) — espessura da parede no export */
  height: number;
}

export interface WildWater {
  id: string;
  polygon: Vec[];
}

export interface WildField {
  id: string;
  rect: Rect;
}

export interface WildProp {
  id: string;
  type: string;
  pos: Vec;
  rot: 0 | 1 | 2 | 3;
  w: number;
  h: number;
  variant: number;
}

/** ponto de interesse nomeado (gancho de aventura no mapa aberto) */
export interface WildPoi {
  id: string;
  pos: Vec;
  label: string;
}

export interface WildDoc {
  version: 1;
  kind: 'wild';
  seed: number;
  styleId: string;
  biome: Biome;
  bounds: { w: number; h: number };
  conservation: 'novo' | 'usado' | 'abandonado' | 'arruinado';
  lighting: number;
  grid: TerrainGrid;
  trails: WildTrail[];
  cliffs: WildCliff[];
  waters: WildWater[];
  fields: WildField[];
  props: WildProp[];
  /** pontos de interesse nomeados (1–2 por mapa, encostados em trilhas) */
  pois: WildPoi[];
  /** ponto de chegada dos personagens */
  spawn: Vec;
  /** saídas de borda (para outros mapas) */
  exits: Vec[];
}

/** dimensões padrão dos adereços de exterior (metros) */
export const WILD_PROP_DIMS: Record<string, { w: number; h: number }> = {
  broadleaf: { w: 2.0, h: 2.0 },
  pine: { w: 1.9, h: 1.9 },
  bush: { w: 1.3, h: 1.3 },
  rock: { w: 1.5, h: 1.3 },
  stump: { w: 1.0, h: 1.0 },
  log: { w: 2.4, h: 0.9 },
  flowers: { w: 1.2, h: 1.2 },
  oak: { w: 2.2, h: 2.2 },
  haystack: { w: 1.8, h: 1.8 },
  fence: { w: 2.4, h: 0.45 },
  crystal: { w: 1.2, h: 1.2 },
  cart: { w: 2.2, h: 1.4 },
  timber: { w: 2.0, h: 0.8 },
  lantern: { w: 0.7, h: 0.7 },
  entrance: { w: 5.0, h: 4.0 },
  shard: { w: 1.0, h: 1.0 },
};
