/**
 * Sprites (peças) da Mesa Estelar — mesma mecânica da texturelib:
 *
 *  - Navegador: `loadSprites()` busca os PNGs em `public/sprites/` e registra;
 *    o app aguarda antes de montar (main.tsx).
 *  - Headless (prévias PNG / testes): injeção manual via `provideSprite()`.
 *
 * O render pergunta `getSprite(key)`; se a peça não estiver disponível,
 * segue com o painter procedural do tema (fallback automático).
 */

export type SpriteImg = CanvasImageSource & { width: number; height: number };

const sprites = new Map<string, SpriteImg>();

/** peças usadas pelo mapeamento de adereços (nome do arquivo sem .png) */
export const SPRITE_KEYS = [
  // mobiliário e carga
  'caixa', 'caixas-agrupadas', 'barril', 'barris', 'banco-madeira', 'mesa-vazia',
  // escadas
  'escada-metal', 'escada-pedra', 'escada-pedra-cinza', 'escada-pedra-larga',
  'escada-madeira-longa',
  // grande porte / decoração
  'gerador', 'sucata', 'sujeira-pedrinhas', 'estatua', 'fonte',
  // vegetação e terreno
  'palmeira-grande', 'palmeira-pequena', 'arbusto', 'rochas',
  // mercado
  'barraca-azul', 'barraca-creme', 'barraca-verde', 'barraca-vermelha',
] as const;

export function provideSprite(key: string, img: SpriteImg): void {
  sprites.set(key, img);
}

/** carrega todas as peças mapeadas a partir de um diretório base (browser) */
export async function loadSprites(baseUrl = '/sprites/'): Promise<void> {
  if (typeof document === 'undefined') return; // headless: só injeção manual
  await Promise.all(SPRITE_KEYS.map(async (key) => {
    try {
      const res = await fetch(`${baseUrl}${key}.png`);
      if (!res.ok) return;
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      provideSprite(key, bmp as unknown as SpriteImg);
    } catch {
      /* peça ausente: fallback procedural silencioso */
    }
  }));
}

/** imagem registrada ou null (fallback procedural) */
export function getSprite(key: string): SpriteImg | null {
  const s = sprites.get(key);
  return s && s.width ? s : null;
}
