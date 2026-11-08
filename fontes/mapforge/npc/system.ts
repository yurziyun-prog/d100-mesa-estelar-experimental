/**
 * Regras do sistema d100 da Mesa Estelar (M-Space/Mythras/BRP), portadas dos
 * fontes do jogo (`js/app/01-nucleo.js`, `07-pericias.js`):
 *
 * - Criação de personagem: 80 pontos entre os 7 atributos; mínimo 3 (mínimo 6
 *   em TAM e INT); máximo 18 — acima disso só heróis/vilões de destaque.
 * - Perícias: valor-base = fórmula com atributos (ex.: "FOR+DES"); pools de
 *   pontos Origem 100 / Carreira 100 / Hobbie 150; treino máx. 30 por pool.
 * - Sub-atributos derivados: Sorte e Taxa de Recuperação escalam por faixas
 *   de 6; Pontos de Magia = POD; Mod. de Dano pela soma FOR+TAM; Mod. de
 *   Experiência pela CAR.
 */

import type { RNG } from '../rng';

export const ATRIBUTOS = ['FOR', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'] as const;
export type AtributoId = typeof ATRIBUTOS[number];

export const MIN_ATTR = 3;
export const MIN_ATTR_TAM_INT = 6; // TAM e INT nunca abaixo de 6
export const MAX_ATTR = 18;       // excepcional; acima só poder 5-6

/** pool de pontos de atributo por nível de poder (herói iniciante = 80) */
export const POOL_ATRIBUTOS = [65, 70, 76, 80, 88, 96];

// ---------- sub-atributos (fórmulas idênticas às do jogo) ----------

/** Pontos de Sorte: POD ≤6=1; 7–12=2; 13–18=3; +1 a cada 6 acima de 18 */
export function sorteDe(pod: number): number {
  const p = Math.max(0, Math.floor(pod));
  if (p <= 6) return 1;
  if (p <= 12) return 2;
  if (p <= 18) return 3;
  return 3 + Math.floor((p - 18) / 6);
}

/** Taxa de Recuperação: mesmo formato, base 3 */
export function taxaRecuperacaoDe(con: number): number {
  const c = Math.max(0, Math.floor(con));
  if (c <= 18) return 3;
  return 3 + Math.floor((c - 18) / 6);
}

/** Pontos de Magia (psi) = POD */
export function pontosMagiaDe(pod: number): number {
  return Math.max(0, Math.floor(pod));
}

/** Mod. de Experiência: CAR ≤6=-1; 7–12=0; 13–18=+1; +1 a cada 6 acima */
export function modExperienciaDe(car: number): number {
  const c = Math.max(0, Math.floor(car));
  if (c <= 6) return -1;
  if (c <= 12) return 0;
  if (c <= 18) return 1;
  return 1 + Math.floor((c - 18) / 6);
}

/** Mod. de Dano pela soma FOR+TAM (tabela do jogo) */
export function modDanoDe(forca: number, tam: number): string {
  const soma = Number(forca || 0) + Number(tam || 0);
  if (soma <= 5) return '-1d8';
  if (soma <= 10) return '-1d6';
  if (soma <= 15) return '-1d4';
  if (soma <= 20) return '-1d2';
  if (soma <= 25) return '+0';
  if (soma <= 30) return '+1d2';
  if (soma <= 35) return '+1d4';
  if (soma <= 40) return '+1d6';
  if (soma <= 45) return '+1d8';
  if (soma <= 50) return '+1d10';
  if (soma <= 60) return '+1d12';
  if (soma <= 70) return '+2d6';
  if (soma <= 80) return '+1d8+1d6';
  if (soma <= 90) return '+2d8';
  if (soma <= 100) return '+1d10+1d8';
  if (soma <= 110) return '+2d10';
  if (soma <= 120) return '+2d10+1d2';
  if (soma <= 130) return '+2d10+1d4';
  const extra = Math.floor((soma - 121) / 10);
  return `+2d10+1d${Math.min(12, 4 + extra * 2)}`;
}

// ---------- atributos ----------

/**
 * PV máximos por localização (tabela `pvMaxLocais_` do jogo, corpo humanoide):
 * índice k pela soma CON+TAM, bônus i acima de 40.
 */
export function pvPorLocal(con: number, tam: number): Record<string, number> {
  const x = (Number(con) || 10) + (Number(tam) || 10);
  const k = x <= 5 ? 0 : x <= 10 ? 1 : x <= 15 ? 2 : x <= 20 ? 3 : x <= 25 ? 4 : x <= 30 ? 5 : x <= 35 ? 6 : 7;
  const i = x > 40 ? Math.ceil((x - 40) / 5) : 0;
  const t = {
    l: [1, 2, 3, 4, 5, 6, 7, 8],
    a: [2, 3, 4, 5, 6, 7, 8, 9],
    c: [3, 4, 5, 6, 7, 8, 9, 10],
    b: [1, 1, 2, 3, 4, 5, 6, 7],
  };
  return {
    'Cabeça': t.l[k] + i,
    'Peito': t.c[k] + i,
    'Abdômen': t.a[k] + i,
    'Braço Direito': t.b[k] + i,
    'Braço Esquerdo': t.b[k] + i,
    'Perna Direita': t.l[k] + i,
    'Perna Esquerda': t.l[k] + i,
  };
}

export interface PesosAtributos { [k: string]: number }

/**
 * Distribui `total` pontos pelos 7 atributos respeitando os mínimos do
 * sistema (3 geral, 6 em TAM/INT) e o teto de 18. `pesos` inclina a
 * distribuição (ex.: combatente puxa FOR/CON/DES); `maxExtra` permite que
 * até `maxExtra` atributos ultrapassem 18 (heróis e vilões de destaque).
 */
export function distribuirAtributos(
  rng: RNG,
  total: number,
  pesos: PesosAtributos = {},
  maxExtra = 0,
): Record<AtributoId, number> {
  const valores = {} as Record<AtributoId, number>;
  let gasto = 0;
  for (const a of ATRIBUTOS) {
    valores[a] = (a === 'TAM' || a === 'INT') ? MIN_ATTR_TAM_INT : MIN_ATTR;
    gasto += valores[a];
  }
  const restante = Math.max(0, total - gasto);
  // sorteia incrementos proporcionais aos pesos; teto 18 (+ extra raro)
  const alvos = { ...valores };
  const pesosLista = ATRIBUTOS.map((a) => ({ a, w: Math.max(0.1, pesos[a] ?? 1) }));
  const somaPesos = pesosLista.reduce((s, p) => s + p.w, 0);
  let distribuido = 0;
  for (const p of pesosLista) {
    alvos[p.a] = Math.min(MAX_ATTR, valores[p.a] + Math.round((restante * p.w) / somaPesos));
    distribuido += alvos[p.a] - valores[p.a];
  }
  // ajuste fino de arredondamento
  let dif = restante - distribuido;
  const ordem = rng.shuffle([...ATRIBUTOS]);
  for (const a of ordem) {
    if (dif === 0) break;
    if (dif > 0 && alvos[a] < MAX_ATTR) { alvos[a]++; dif--; }
    else if (dif < 0 && alvos[a] > valores[a]) { alvos[a]--; dif++; }
  }
  // exceções acima de 18 (elite/lendário): eleva 1-2 atributos-chave
  if (maxExtra > 0) {
    const chaves = rng.shuffle(ATRIBUTOS.filter((a) => alvos[a] >= 14)).slice(0, 2);
    for (const a of chaves) {
      alvos[a] = Math.min(MAX_ATTR + maxExtra, alvos[a] + rng.int(1, maxExtra));
    }
  }
  return alvos;
}

// ---------- perícias ----------

/**
 * Avalia a fórmula-base de uma perícia (ex.: "FOR+DES", "INT*2") com os
 * atributos dados — mesma mecânica do módulo de perícias do jogo.
 */
export function basePericia(formula: string, atr: Partial<Record<AtributoId, number>>): number {
  let expr = String(formula || '0');
  if (expr.includes('MAIOR')) {
    const chaves: AtributoId[] = ['FOR', 'TAM', 'DES', 'INT', 'CAR'];
    const maior = Math.max(...chaves.map((k) => Number(atr[k] || 0)));
    expr = expr.replace(/MAIOR/g, String(maior));
  }
  for (const a of ATRIBUTOS) {
    expr = expr.replace(new RegExp(a, 'g'), String(atr[a] ?? 0));
  }
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return 0;
  try {
    return Math.round(Function(`"use strict"; return (${expr})`)());
  } catch {
    return 0;
  }
}
