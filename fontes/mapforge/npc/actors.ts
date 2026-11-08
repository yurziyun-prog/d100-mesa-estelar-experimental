/**
 * Serialização dos tokens de NPC/criatura para o "Dados de jogo" — camada
 * `actors`, pronta para o Mesa Estelar ler e dar vida aos atores.
 */

import type { Vec } from '../types';
import type { NpcFicha } from './generator';
import type { MapToken } from './token-layer';
import { aiDaFicha, type ActorAi } from './ai';
import { TOKEN_IMAGE_KEYS } from './tokenimg';

export interface GameActor {
  id: string;
  kind: 'npc' | 'criatura';
  name: string;
  papel: string;
  /** 1..6 — Fraco..Lendário */
  poder: number;
  pos: Vec;
  /** diâmetro do token em metros (tamanho do ator no mapa) */
  diameter: number;
  /** caminho da miniatura oficial em public/tokens/, quando houver */
  tokenImage?: string;
  atributos: NpcFicha['atributos'];
  pv: number;
  pericias: { nome: string; valor: number }[];
  /** raça/carreira/espécie conforme o tipo */
  raca?: string;
  carreira?: string;
  especie?: string;
  armas?: string[];
  habilidades?: string[];
  tracos?: string[];
  motivacao?: string;
  descricao: string;
  /** comportamento autônomo para o motor do jogo */
  ai: ActorAi;
}

export function tokenToActor(t: MapToken): GameActor {
  const f = t.ficha;
  const actor: GameActor = {
    id: t.id,
    kind: f.tipo,
    name: f.nome,
    papel: f.papel,
    poder: f.poder,
    pos: { x: t.x, y: t.y },
    diameter: t.d,
    atributos: f.atributos,
    pv: f.pv,
    pericias: f.pericias,
    descricao: f.descricao,
    ai: aiDaFicha(f),
  };
  if (f.especieId && (TOKEN_IMAGE_KEYS as readonly string[]).includes(f.especieId)) {
    actor.tokenImage = `/tokens/${f.especieId}.png`;
  }
  if (f.raca) actor.raca = f.raca;
  if (f.carreira) actor.carreira = f.carreira;
  if (f.tipo === 'criatura') actor.especie = f.nome.replace(/\s+\d+$/, '');
  if (f.armas?.length) actor.armas = f.armas;
  if (f.habilidades?.length) actor.habilidades = f.habilidades;
  if (f.tracos?.length) actor.tracos = f.tracos;
  if (f.motivacao) actor.motivacao = f.motivacao;
  return actor;
}

export function tokensToActors(tokens: MapToken[]): GameActor[] {
  return tokens.map(tokenToActor);
}
