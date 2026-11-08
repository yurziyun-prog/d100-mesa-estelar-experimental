/**
 * Tema de exterior — a "pele" aplicada sobre o WildDoc: tiles de terreno
 * (grama, terra, rocha, areia, plantação), cores de escarpa e pintores de
 * adereços naturais/artesanais, análogo ao CityTheme.
 */

import type { CanvasFactory, Ctx, TileOpts } from '../render/textures';
import type { SpriteEnv } from '../render/sprites';

export type WildTilePainter = (create: CanvasFactory, o: TileOpts) => HTMLCanvasElement;

export interface WildTheme {
  id: string;
  label: string;

  // ---- terreno (tiles world-aligned) ----
  grass: WildTilePainter;
  dirt: WildTilePainter;
  rock: WildTilePainter;
  sand: WildTilePainter;
  field: WildTilePainter;
  /** preenchimento e brilho da água (desenhados direto pelo renderizador) */
  waterBase: string;
  waterHi: string;
  waterEdge: string;

  // ---- escarpa ----
  cliffFace: string;
  cliffTop: string;

  // ---- adereços ----
  propPainters: Record<string, (x: Ctx, w: number, h: number, env: SpriteEnv) => void>;
  propLight: Record<string, { r: number; strength: number }>;
  propGlow: Record<string, { r: number; alpha: number; color: string }>;

  // ---- iluminação ----
  darknessColor: string;
}
