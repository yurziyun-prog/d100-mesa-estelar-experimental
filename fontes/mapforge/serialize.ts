/**
 * Serialização versionada do MapDocument.
 * A exportação JSON é a "fonte da verdade" — a reimportação deve preservar
 * byte a byte a estrutura (testado em serialize.test.ts).
 */

import type { MapDocument } from './types';

export const FORMAT_VERSION = 1;

export function serializeMap(doc: MapDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function parseMap(json: string): MapDocument {
  const data = JSON.parse(json);
  if (typeof data !== 'object' || data === null) {
    throw new Error('Arquivo inválido: raiz não é um objeto.');
  }
  if (data.version !== FORMAT_VERSION) {
    throw new Error(`Versão de formato não suportada: ${data.version} (suportado: ${FORMAT_VERSION}).`);
  }
  const required = ['seed', 'bounds', 'rooms', 'doors', 'props', 'meta'];
  for (const key of required) {
    if (!(key in data)) throw new Error(`Arquivo inválido: campo obrigatório "${key}" ausente.`);
  }
  return data as MapDocument;
}

/** deep equality estrutural para testes de reprodutibilidade */
export function mapsEqual(a: MapDocument, b: MapDocument): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
