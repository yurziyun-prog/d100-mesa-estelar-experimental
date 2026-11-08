/**
 * Miniaturas reais das criaturas, copiadas dos bancos da Mesa Estelar
 * (`public/tokens/<especieId>.png`, arte original do jogo). Mesma mecânica
 * da spritelib: browser carrega com `loadTokenImages()`, headless injeta com
 * `provideTokenImage()`; ausência cai no token procedural.
 */

import type { SpriteImg } from '../render/spritelib';

/** espécies com miniatura oficial baixada (ver scripts de importação) */
export const TOKEN_IMAGE_KEYS = [
  'besta_ululante', 'cadaver_de_chefe', 'zumbi_1', 'cila',
  'criatura1', 'criatura2', 'criatura3', 'criatura4', 'criatura5', 'criatura6', 'criatura7',
  'dragao_trombeta_alado_domesticado', 'dragao_trombeta_alado_selvagem',
  'dragao_trombeta_corredor_domesticado', 'dragao_trombeta_corredor_selvagem',
  'criatura_de_calico_2', 'macacodecalico',
  'metamorfo1', 'metamorfo2', 'metamorfo3', 'metamorfo4',
  'montariapterodatil', 'predador_de_nevoa', 'serpente_sanguessuga',
] as const;

const images = new Map<string, SpriteImg>();

export function provideTokenImage(especieId: string, img: SpriteImg): void {
  images.set(especieId, img);
}

export async function loadTokenImages(baseUrl = '/tokens/'): Promise<void> {
  if (typeof document === 'undefined') return;
  await Promise.all(TOKEN_IMAGE_KEYS.map(async (key) => {
    try {
      const res = await fetch(`${baseUrl}${key}.png`);
      if (!res.ok) return;
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      provideTokenImage(key, bmp as unknown as SpriteImg);
    } catch {
      /* sem miniatura: token procedural */
    }
  }));
}

export function getTokenImage(especieId: string | undefined): SpriteImg | null {
  if (!especieId) return null;
  const img = images.get(especieId);
  return img && img.width ? img : null;
}
