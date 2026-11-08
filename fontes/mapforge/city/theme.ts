/**
 * Tema de cidade — a "pele" urbana aplicada sobre a geometria do CityDoc,
 * análoga ao MapStyle da dungeon. Cada estilo visual pode registrar um tema
 * urbano (pedra+neon, era atômica, medieval etc.) com pisos de rua/calçada,
 * pintores de telhado e adereços urbanos, iluminação e vocabulário.
 */

import type { CanvasFactory, Ctx, TileOpts } from '../render/textures';
import type { SpriteEnv } from '../render/sprites';
import type { CityBuilding, Rect } from './types';

export type CityTilePainter = (create: CanvasFactory, o: TileOpts) => HTMLCanvasElement;

export interface CityTheme {
  id: string;
  label: string;

  // ---- pisos (tiles world-aligned) ----
  /** terreno base entre os quarteirões (fora dos limites da cidade) */
  backdrop: CityTilePainter;
  /** piso das ruas */
  street: CityTilePainter;
  /** calçada dos quarteirões */
  sidewalk: CityTilePainter;
  /** piso das praças */
  plaza: CityTilePainter;
  /** grama dos parques */
  grass: CityTilePainter;

  // ---- prédios ----
  /** pinta o telhado do prédio; rect em metros, já em coords locais da base */
  paintBuildingRoof(x: Ctx, r: Rect, b: CityBuilding, env: SpriteEnv): void;
  /** cor do contorno/muro do prédio (metros, cor css) */
  buildingEdge: string;
  /** cor da moldura da porta desenhada no telhado */
  doorFrame: string;
  /** tipo semântico de porta exportado para o jogo */
  doorType: string;

  // ---- adereços urbanos ----
  propPainters: Record<string, (x: Ctx, w: number, h: number, env: SpriteEnv) => void>;
  propLight: Record<string, { r: number; strength: number }>;
  propGlow: Record<string, { r: number; alpha: number; color: string }>;

  // ---- iluminação ----
  darknessColor: string;
  /** espaçamento entre postes de rua (metros) */
  lampSpacing: number;
  /** rótulo da praça principal */
  plazaLabel: string;
}
