/**
 * Mapeamento de adereços (props) para peças reais da Mesa Estelar.
 *
 * Cada tabela é `estilo/bioma → tipo de prop → lista de peças`; quando há
 * mais de uma peça, a variante da prop escolhe entre elas (determinístico).
 * Tipos ausentes da tabela continuam 100% procedurais — o sprite é um
 * requinte, não um requisito.
 */

import { getSprite, type SpriteImg } from './spritelib';

export type SpriteMap = Record<string, Record<string, string[]>>;

/** resolve a peça para (tema, tipo de prop, variante) ou null */
export function spriteFor(
  map: SpriteMap, themeId: string, propType: string, variant: number,
): string | null {
  const byType = map[themeId];
  if (!byType) return null;
  const keys = byType[propType];
  if (!keys || keys.length === 0) return null;
  return keys[variant % keys.length];
}

/**
 * Desenha a peça centrada em (0,0) — o caller já aplicou translate/rotate —
 * com cover-crop para a caixa w×h (metros), sem distorcer a arte.
 */
export function paintSprite(x: CanvasRenderingContext2D, img: SpriteImg, w: number, h: number): void {
  const sc = Math.max(w / img.width, h / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  x.save();
  x.beginPath();
  x.rect(-w / 2, -h / 2, w, h);
  x.clip();
  x.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  x.restore();
}

/** tenta desenhar a peça mapeada; retorna true se desenhou */
export function tryPaintSprite(
  x: CanvasRenderingContext2D, map: SpriteMap, themeId: string,
  propType: string, variant: number, w: number, h: number,
): boolean {
  const key = spriteFor(map, themeId, propType, variant);
  if (!key) return false;
  const img = getSprite(key);
  if (!img) return false;
  paintSprite(x, img, w, h);
  return true;
}

// ---------- dungeons ----------

const SPRITES_MEDIEVAL: Record<string, string[]> = {
  barrel: ['barril', 'barris'],
  bench: ['banco-madeira'],
  longTable: ['mesa-vazia'],
  chest: ['caixa'],
  crate: ['caixa', 'caixas-agrupadas'],
  stairsDown: ['escada-pedra', 'escada-pedra-cinza'],
  rubble: ['sujeira-pedrinhas'],
};

const SPRITES_HIBORIANO: Record<string, string[]> = {
  chest: ['caixa'],
  crate: ['caixa'],
  idol: ['estatua'],
  bonePile: ['sujeira-pedrinhas'],
  stairsDown: ['escada-pedra'],
};

const SPRITES_ATOMIC: Record<string, string[]> = {
  crate: ['caixa', 'caixas-agrupadas'],
  generator: ['gerador'],
  stairsDown: ['escada-metal'],
};

const SPRITES_FUTURISTA: Record<string, string[]> = {
  crate: ['caixa'],
  generator: ['gerador'],
  rubble: ['sucata'],
  stairsDown: ['escada-metal'],
};

export const DUNGEON_SPRITES: SpriteMap = {
  medieval: SPRITES_MEDIEVAL,
  hiboriano: SPRITES_HIBORIANO,
  retrofuturista: SPRITES_ATOMIC,
  futurista: SPRITES_FUTURISTA,
  hibrido: {
    ...SPRITES_MEDIEVAL,
    ...SPRITES_ATOMIC,
    ...SPRITES_HIBORIANO,
    stairsDown: ['escada-pedra-larga', 'escada-pedra-cinza'],
    rubble: ['sujeira-pedrinhas', 'sucata'],
  },
};

// ---------- cidades ----------

const SPRITES_URBANOS: Record<string, string[]> = {
  fountain: ['fonte'],
  statue: ['estatua'],
  bench: ['banco-madeira'],
  stall: ['barraca-azul', 'barraca-creme', 'barraca-verde', 'barraca-vermelha'],
};

const SPRITES_URBANOS_PALMA = { ...SPRITES_URBANOS, tree: ['palmeira-grande', 'palmeira-pequena'] };

export const CITY_SPRITES: SpriteMap = {
  hibrido: SPRITES_URBANOS_PALMA,
  retrofuturista: SPRITES_URBANOS_PALMA,
  futurista: SPRITES_URBANOS_PALMA,
  medieval: SPRITES_URBANOS,
  hiboriano: SPRITES_URBANOS,
};

// ---------- exteriores (wild) ----------

const SPRITES_WILD_BASICO: Record<string, string[]> = {
  rock: ['rochas'],
  bush: ['arbusto'],
};

const SPRITES_WILD_PALMA: Record<string, string[]> = {
  ...SPRITES_WILD_BASICO,
  oak: ['palmeira-grande'],
  broadleaf: ['palmeira-grande', 'palmeira-pequena'],
  treeCrown: ['palmeira-grande', 'palmeira-pequena'],
};

export const WILD_SPRITES: SpriteMap = {
  hibrido: SPRITES_WILD_PALMA,
  retrofuturista: SPRITES_WILD_PALMA,
  futurista: { ...SPRITES_WILD_BASICO, broadleaf: ['palmeira-pequena'], treeCrown: ['palmeira-pequena'] },
  medieval: SPRITES_WILD_BASICO,
  hiboriano: SPRITES_WILD_BASICO,
};
