/**
 * Mobiliador automático de salas — preenche salas retangulares ainda vazias
 * com conjuntos de props coerentes com a função da sala (armazém → caixotes,
 * alojamento → leitos, laboratório → consoles…). Um clique do mestre deixa a
 * masmorra habitada, sem tocar em salas já mobiliadas nem em corredores,
 * entradas ou saídas. Posições respeitam margem de parede e distância de
 * portas; nada sobrepõe props existentes.
 */

import { RNG } from './rng';
import { getStyle } from './styles';
import { doorPos } from './types';
import type { MapDocument, Prop, Room, Vec } from './types';

/** pegadas (largura × profundidade, antes da rotação) dos props mobiliados */
const DIMS: Record<string, { w: number; h: number }> = {
  console: { w: 1.9, h: 0.9 },
  serverRack: { w: 1.0, h: 2.0 },
  crate: { w: 1.2, h: 1.2 },
  barrel: { w: 1.1, h: 1.1 },
  powerCell: { w: 1.1, h: 1.1 },
  generator: { w: 2.6, h: 1.7 },
  holotable: { w: 2.4, h: 2.4 },
  cryopod: { w: 1.0, h: 2.3 },
  bench: { w: 2.0, h: 0.9 },
  bed: { w: 2.2, h: 1.1 },
  longTable: { w: 3.0, h: 1.3 },
  pipeRun: { w: 2.4, h: 0.6 },
  floorLamp: { w: 1.3, h: 1.3 },
  vent: { w: 1.0, h: 1.0 },
  brazier: { w: 1.0, h: 1.0 },
  banner: { w: 0.4, h: 0.4 },
  chest: { w: 1.4, h: 1.0 },
  urn: { w: 0.9, h: 0.9 },
  weaponRack: { w: 1.8, h: 0.8 },
  idol: { w: 1.2, h: 1.2 },
  altar: { w: 2.2, h: 1.2 },
  torch: { w: 0.5, h: 0.5 },
  cauldron: { w: 1.3, h: 1.3 },
};

/**
 * Conjuntos por função de sala — um por estilo, para a mobília combinar com
 * a estética do período. O híbrido (pedra + tecnologia) usa o genérico, que
 * é filtrado pelos painters que o estilo efetivamente tem.
 */
const CONJUNTOS_POR_ESTILO: Record<string, Record<string, string[]>> = {
  retrofuturista: {
    storage: ['crate', 'crate', 'powerCell', 'serverRack'],
    quarters: ['cryopod', 'cryopod', 'bench', 'floorLamp'],
    lab: ['console', 'holotable', 'serverRack', 'crate', 'console'],
    utility: ['pipeRun', 'vent', 'generator', 'powerCell'],
    hall: ['holotable', 'bench', 'console', 'floorLamp', 'crate'],
  },
  futurista: {
    storage: ['crate', 'crate', 'powerCell', 'serverRack'],
    quarters: ['cryopod', 'bench', 'floorLamp'],
    lab: ['console', 'holotable', 'serverRack', 'crate'],
    utility: ['pipeRun', 'vent', 'generator', 'powerCell'],
    hall: ['holotable', 'bench', 'console', 'floorLamp'],
  },
  hiboriano: {
    storage: ['chest', 'urn', 'chest', 'weaponRack'],
    quarters: ['bench', 'torch', 'brazier', 'urn'],
    lab: ['altar', 'idol', 'brazier', 'urn'],
    utility: ['urn', 'torch', 'brazier'],
    hall: ['brazier', 'weaponRack', 'idol', 'bench', 'altar'],
  },
  medieval: {
    storage: ['barrel', 'chest', 'barrel'],
    quarters: ['bed', 'bed', 'bench', 'cauldron'],
    lab: ['cauldron', 'chest', 'bench'],
    utility: ['barrel', 'cauldron'],
    hall: ['bench', 'bench', 'cauldron', 'chest'],
  },
};

/** fallback para estilos sem tabela própria (ex.: o híbrido) */
const CONJUNTOS_GENERICOS: Record<string, string[]> = {
  storage: ['crate', 'crate', 'chest', 'barrel', 'powerCell'],
  quarters: ['bed', 'cryopod', 'bench', 'floorLamp', 'torch'],
  lab: ['console', 'holotable', 'cauldron', 'altar', 'serverRack'],
  utility: ['pipeRun', 'vent', 'barrel', 'urn', 'generator'],
  hall: ['longTable', 'bench', 'brazier', 'holotable', 'console'],
};

function centroNaSala(p: Prop, r: Room): boolean {
  const rect = r.rect!;
  return p.pos.x >= rect.x && p.pos.x <= rect.x + rect.w
    && p.pos.y >= rect.y && p.pos.y <= rect.y + rect.h;
}

function sobrepõe(a: Prop, b: Prop): boolean {
  const aw = a.rot % 2 === 1 ? a.h : a.w;
  const ah = a.rot % 2 === 1 ? a.w : a.h;
  const bw = b.rot % 2 === 1 ? b.h : b.w;
  const bh = b.rot % 2 === 1 ? b.w : b.h;
  return Math.abs(a.pos.x - b.pos.x) < (aw + bw) / 2 + 0.35
    && Math.abs(a.pos.y - b.pos.y) < (ah + bh) / 2 + 0.35;
}

/**
 * Quantidade-alvo de props por função de sala (o gerador base já espalha
 * alguns objetos; o mobiliador completa até o alvo, no máx. 3 por sala).
 */
const ALVO_POR_KIND: Record<string, number> = {
  storage: 3, quarters: 3, lab: 4, utility: 3, hall: 4,
};

/**
 * Completa a mobília das salas retangulares até a quantidade-alvo da função
 * da sala (armazém → caixotes, alojamento → cápsulas/leitos, laboratório →
 * consoles…). Respeita corredores, entradas e saídas; posições dentro da
 * sala com margem de parede, longe de portas e sem sobrepor props.
 * Recebe o draft do documento (muta `doc.props`) e devolve quantas props
 * foram adicionadas. Determinístico para a mesma seed.
 */
export function mobiliarSalas(doc: MapDocument, seed: number): number {
  const rng = new RNG(seed >>> 0);
  const pintores = Object.keys(getStyle(doc.styleId).propPainters);
  const adicionadas: Prop[] = [];
  let seq = 1;

  for (const room of doc.rooms) {
    if (!room.rect) continue; // corredores não se mobiliam
    if (room.kind === 'entry' || room.kind === 'exit' || room.kind === 'corridor') continue;
    const tabela = CONJUNTOS_POR_ESTILO[doc.styleId] ?? CONJUNTOS_GENERICOS;
    const conjunto = tabela[room.kind];
    if (!conjunto) continue;
    const alvo = ALVO_POR_KIND[room.kind] ?? 2;

    // quantas props a sala já tem (existentes ou recém-adicionadas)
    const existentes = [...doc.props, ...adicionadas].filter((p) => centroNaSala(p, room)).length;
    const faltam = Math.max(0, Math.min(alvo - existentes, 3));
    if (!faltam) continue;

    const rect = room.rect;
    const portas = doc.doors
      .filter((d) => d.roomId === room.id)
      .map((d) => {
        const r = doc.rooms.find((rr) => rr.id === d.roomId);
        return r?.rect ? doorPos(d, r) : null;
      })
      .filter((p): p is Vec => p !== null);

    let tentativas = 0;
    for (let i = 0; i < faltam && tentativas < 40; ) {
      tentativas++;
      const tipo = rng.pick(conjunto);
      if (!pintores.includes(tipo)) continue; // estilo não pinta esse prop
      const dims = DIMS[tipo] ?? { w: 1.2, h: 1.2 };
      const rot = rng.int(0, 3) as 0 | 1 | 2 | 3;
      // posição dentro da sala com margem de 1 m de parede
      const margem = 1;
      if (rect.w < dims.w + 2 * margem || rect.h < dims.h + 2 * margem) continue;
      const pos: Vec = {
        x: rect.x + margem + dims.w / 2 + rng.next() * (rect.w - dims.w - 2 * margem),
        y: rect.y + margem + dims.h / 2 + rng.next() * (rect.h - dims.h - 2 * margem),
      };
      // longe das portas (para a passagem livre)
      if (portas.some((p) => Math.hypot(p.x - pos.x, p.y - pos.y) < 1.8)) continue;
      // sem sobrepor props existentes nem as da própria sessão
      const candidata: Prop = {
        id: `fur-${room.id}-${seq++}`,
        type: tipo,
        pos: { x: Math.round(pos.x * 4) / 4, y: Math.round(pos.y * 4) / 4 },
        rot,
        w: dims.w,
        h: dims.h,
        variant: rng.int(0, 3),
      };
      if ([...doc.props, ...adicionadas].some((p) => sobrepõe(p, candidata))) continue;
      adicionadas.push(candidata);
      i++;
    }
  }

  doc.props.push(...adicionadas);
  return adicionadas.length;
}
