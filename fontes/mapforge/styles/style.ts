/**
 * Interface de um estilo de mapa.
 *
 * Um estilo é a "pele" artística e temática sobre a geometria do MapDocument:
 * texturas de piso/parede, sprites dos objetos, portas, iluminação, fundo,
 * atmosfera E o vocabulário de geração (mobiliário por tipo de sala, rótulos,
 * tipos de porta). O gerador estrutural é agnóstico de estilo — a mesma
 * geometria pode ser gerada/pintada com qualquer estilo registrado.
 */

import type { RNG } from '../rng';
import type { RoomKind, DoorType, Room, Vec } from '../types';
import type { CanvasFactory, Ctx, TileOpts } from '../render/textures';
import type { SpriteEnv, DoorEnv } from '../render/sprites';

export type TilePainter = (create: CanvasFactory, o: TileOpts) => HTMLCanvasElement;
export type PropPainter = (x: Ctx, w: number, h: number, env: SpriteEnv) => void;

/** especificação de mobiliário: tipo semântico + pegada (metros) */
export interface PropSpec {
  type: string;
  w: number;
  h: number;
}

/** trecho livre de parede (entre portas) a receber detalhe arquitetônico */
export interface WallTrimSeg {
  /** origem do lado da sala (mundo, metros) */
  o: Vec;
  /** direção unitária ao longo do lado */
  d: Vec;
  /** distâncias ao longo do lado delimitando o trecho */
  a0: number;
  a1: number;
  /** vetor unitário apontando para dentro da parede */
  inW: Vec;
  /** espessura da parede (metros) */
  t: number;
}

export interface MapStyle {
  id: string;
  label: string;

  // ---- texturas (tiles world-aligned) ----
  /** pintores de piso por chave floorStyle do Room */
  floors: Record<string, TilePainter>;
  /** chave floorStyle usada quando a sala não tem uma conhecida */
  defaultFloor: string;
  /** textura da parede (faixa escura) */
  wall: TilePainter;
  /** superfície do "convés" — tudo que fica fora das salas */
  hull: TilePainter;

  // ---- céu/fundo (camada 1, em pixels de tela) ----
  paintBackground(x: Ctx, w: number, h: number, seed: number): void;
  /** overlay final (vinheta/grão), gerado por dimensão de saída */
  atmosphere(create: CanvasFactory, w: number, h: number, seed: number): HTMLCanvasElement;
  /** cor da escuridão ambiente (formato "r,g,b") — sombras frias ou quentes */
  darknessColor: string;

  // ---- acabamento de piso por sala ----
  /** cor de tinta sutil por sala (quebra monotonia) ou null */
  floorTint(room: Room, rng: RNG): string | null;
  /** estilo dos rótulos pintados no piso */
  labelStyle: {
    font(sizePx: number): string;
    color: string;
    codeColor: string;
    /** código do setor exibido abaixo do nome (ex.: "SEÇÃO R1") */
    code(room: Room): string;
  };

  // ---- paredes ----
  /** detalhe arquitetônico por trecho livre de parede */
  paintWallTrim(x: Ctx, seg: WallTrimSeg, wear: number, rng: RNG): void;
  /** parede livre desenhada pelo editor */
  paintExtraWall(x: Ctx, a: Vec, b: Vec, t: number): void;

  // ---- portas e extremidades ----
  paintDoor(x: Ctx, env: DoorEnv): void;
  paintCorridorCap(x: Ctx, kind: 'dock' | 'bulkhead', width: number): void;
  doorLight: { r: number; strength: number };
  doorGlow: { r: number; alpha: number; color: string };

  // ---- objetos ----
  propPainters: Record<string, PropPainter>;
  /** pools de luz por tipo de prop (furam a escuridão) */
  propLight: Record<string, { r: number; strength: number }>;
  /** brilho emissivo aditivo por tipo de prop */
  propGlow: Record<string, { r: number; alpha: number; color: string }>;

  // ---- vocabulário de geração ----
  /** mobiliário por tipo de sala (kind do Room) */
  catalog: Record<string, PropSpec[]>;
  /** props que devem ficar no centro da sala (não junto à parede) */
  centerProps: string[];
  /** tipo da prop de iluminação — o gerador garante ao menos uma por sala */
  lightProp: string;
  /** decoração ocasional em corredores (null = nenhuma) */
  corridorDecor: PropSpec | null;
  /** rótulos temáticos por tipo de sala */
  labels: Record<string, string[]>;
  floorStyleFor(kind: RoomKind): string;
  /** tipos de porta interna (duplicatas ponderam a escolha) */
  doorTypes: DoorType[];
  /** tipos de porta dos stubs de borda (entrada/saída do mapa) */
  stubTypes: { entry: DoorType; exit: DoorType };
}
