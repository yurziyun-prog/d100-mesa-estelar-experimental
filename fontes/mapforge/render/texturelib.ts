/**
 * Biblioteca de texturas bitmap da Mesa Estelar (copiadas para
 * `public/textures/*.png`). Duas vias de provimento:
 *
 *  - Navegador: `loadTextures()` busca os arquivos e registra; o app aguarda
 *    antes de montar (main.tsx) para que o primeiro render já saia texturizado.
 *  - Headless (prévias PNG / testes): o script injeta as imagens via
 *    `provideTexture()` usando node-canvas.
 *
 * O render pede um *tile* já redimensionado (`getTextureTile(key, px)`), que é
 * usado como pattern como qualquer tile procedural — se a textura não estiver
 * disponível, retorna null e o render segue 100% procedural (fallback).
 */

type Ctx = CanvasRenderingContext2D;

const sources = new Map<string, CanvasImageSource & { width: number; height: number }>();
const tileCache = new Map<string, HTMLCanvasElement>();

/** texturas que o render usa (nome do arquivo sem .png) */
export const TEXTURE_KEYS = [
  'grama', 'grama_seca', 'chao_floresta', 'chao_conifera', 'chao_arbustal',
  'terra', 'terra_batida', 'terra_rachada',
  'areia', 'areia_deserto', 'rocha', 'pedregulhos', 'pedra',
  'agua', 'agua_rasa', 'agua_profunda', 'lama', 'palha',
  'metal', 'metal_ferrugem', 'madeira', 'tijolo', 'telha',
  'marmore_branco', 'marmore_negro', 'marmore_vermelho', 'sucata',
] as const;

export function provideTexture(
  key: string, img: CanvasImageSource & { width: number; height: number },
): void {
  sources.set(key, img);
  // invalida tiles já derivados dessa textura
  for (const k of [...tileCache.keys()]) if (k.startsWith(`${key}@`)) tileCache.delete(k);
}

/** carrega todas as texturas a partir de um diretório base (browser) */
export async function loadTextures(baseUrl = '/textures/'): Promise<void> {
  if (typeof document === 'undefined') return; // headless: só injeção manual
  await Promise.all(TEXTURE_KEYS.map(async (key) => {
    try {
      const res = await fetch(`${baseUrl}${key}.png`);
      if (!res.ok) return;
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      provideTexture(key, bmp as unknown as CanvasImageSource & { width: number; height: number });
    } catch {
      /* textura ausente: fallback procedural silencioso */
    }
  }));
}

/**
 * Tile quadrado da textura com cover-crop para `px` (device pixels),
 * pronto para virar pattern. Null se a textura não foi provida.
 * `createCanvas` vem do RenderEnv (funciona no browser e no node-canvas).
 */
export function getTextureTile(
  key: string, px: number,
  createCanvas: (w: number, h: number) => HTMLCanvasElement,
): HTMLCanvasElement | null {
  const src = sources.get(key);
  if (!src || !src.width || !src.height) return null;
  const cacheKey = `${key}@${px}`;
  let tile = tileCache.get(cacheKey);
  if (tile) return tile;
  tile = createCanvas(px, px);
  const tx = tile.getContext('2d') as Ctx;
  const scale = Math.max(px / src.width, px / src.height);
  const w = src.width * scale;
  const h = src.height * scale;
  tx.drawImage(src as CanvasImageSource, (px - w) / 2, (px - h) / 2, w, h);
  if (tileCache.size > 200) tileCache.clear();
  tileCache.set(cacheKey, tile);
  return tile;
}
