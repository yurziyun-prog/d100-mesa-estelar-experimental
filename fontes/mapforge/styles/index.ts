/**
 * Registro de estilos — ponto de extensão para novos temas visuais.
 */

import type { MapStyle } from './style';
import { futurista } from './futurista';
import { retrofuturista } from './retrofuturista';
import { medieval } from './medieval';
import { hiboriano } from './hiboriano';
import { hibrido } from './hibrido';

const REGISTRY = new Map<string, MapStyle>(
  [retrofuturista, futurista, medieval, hiboriano, hibrido].map((s) => [s.id, s]),
);

export function getStyle(id: string): MapStyle {
  return REGISTRY.get(id) ?? retrofuturista;
}

export function hasStyle(id: string): boolean {
  return REGISTRY.has(id);
}

export function listStyles(): { id: string; label: string }[] {
  return [...REGISTRY.values()].map((s) => ({ id: s.id, label: s.label }));
}

export type { MapStyle, PropSpec, WallTrimSeg, TilePainter, PropPainter } from './style';
