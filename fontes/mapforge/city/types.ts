/**
 * Tipos do documento de CIDADE — geometria vetorial em metros, versionada.
 * Diferente da dungeon: ruas (polilinhas largas), quarteirões, praças,
 * parques, prédios (retângulos alinhados à rua) e adereços urbanos.
 */

import type { Rect, Vec } from '../types';

export interface CityStreet {
  id: string;
  /** eixo da via (polilinha, em metros) */
  path: Vec[];
  /** largura da pista (metros) */
  width: number;
  kind: 'main' | 'secondary';
  /** extremidade que toca a borda do mapa = portão da cidade */
  gate?: 'start' | 'end' | 'both';
}

export interface CityPlaza {
  id: string;
  rect: Rect;
  label: string;
}

export interface CityPark {
  id: string;
  rect: Rect;
}

export interface CityBuilding {
  id: string;
  rect: Rect;
  /** lado de onde fica a porta (voltado à rua) */
  facing: 'n' | 's' | 'e' | 'w';
  stories: number;
  variant: number;
  /** largura da porta (metros) */
  doorWidth: number;
  /** função do edifício no mundo (taverna, mercado, residência…) — lore urbana */
  usage?: string;
  /** nome próprio do estabelecimento ("O Átomo Dourado") */
  name?: string;
}

export interface CityProp {
  id: string;
  type: string;
  pos: Vec;
  rot: 0 | 1 | 2 | 3;
  w: number;
  h: number;
  variant: number;
}

export interface CityDoc {
  version: 1;
  kind: 'city';
  seed: number;
  styleId: string;
  bounds: { w: number; h: number };
  conservation: 'novo' | 'usado' | 'abandonado' | 'arruinado';
  lighting: number;
  streets: CityStreet[];
  /** áreas de quarteirão (calçada/passeio) entre as ruas */
  blocks: Rect[];
  plazas: CityPlaza[];
  parks: CityPark[];
  buildings: CityBuilding[];
  props: CityProp[];
  /** ponto de nascimento dos personagens (centro da praça principal) */
  spawn: Vec;
  /** portões de saída da cidade (nas bordas) */
  exits: Vec[];
}

export type { Rect, Vec };
