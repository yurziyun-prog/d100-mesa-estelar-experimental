/**
 * Miniaturas (tokens) procedurais dos NPCs/criaturas — estilo VTT:
 * disco circular com borda de papel (aliado/neutro/inimigo), fundo em
 * gradiente derivado do id (cor estável por personagem) e monograma do
 * nome. Funciona no browser e no node-canvas (prévias/testes).
 */

import { hashSeed } from '../rng';
import type { NpcFicha, PapelNpc } from './generator';
import { getTokenImage } from './tokenimg';

export type CriadorCanvas = (w: number, h: number) => HTMLCanvasElement;

const COR_POR_PAPEL: Record<string, string> = {
  plebeu: '#8a93a3', profissional: '#5f9e6e', mercador: '#c9a227',
  elite: '#7a5fd0', combatente: '#b0653a', inimigo: '#b03a4a',
  acompanhante: '#3a8fb0', criatura: '#6e4a8f',
};

function corBase(id: string): [number, number, number] {
  const h = hashSeed(id) >>> 0;
  const hue = h % 360;
  // saturação/tom controlados para não brigar com o mapa
  const s = 0.32 + ((h >>> 9) % 20) / 100;
  const l = 0.38 + ((h >>> 17) % 16) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgb([r, g, b]: [number, number, number], f = 1): string {
  return `rgb(${Math.min(255, Math.round(r * f))},${Math.min(255, Math.round(g * f))},${Math.min(255, Math.round(b * f))})`;
}

/**
 * Desenha o token de um personagem em um contexto já posicionado (0,0 =
 * centro), com diâmetro `d` em unidades de desenho atuais (metros).
 */
export function drawNpcToken(
  x: CanvasRenderingContext2D, ficha: NpcFicha, d: number,
): void {
  const r = d / 2;
  const base = corBase(ficha.id);
  const anel = COR_POR_PAPEL[ficha.papel as PapelNpc | 'criatura'] ?? COR_POR_PAPEL.criatura;
  const img = getTokenImage(ficha.especieId);

  // sombra no chão
  x.save();
  x.fillStyle = 'rgba(0,0,0,0.35)';
  x.beginPath();
  x.ellipse(0.05 * d, 0.09 * d, r * 0.95, r * 0.82, 0, 0, Math.PI * 2);
  x.fill();
  x.restore();

  // disco com gradiente (fica atrás da arte como fundo)
  const g = x.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, rgb(base, 1.45));
  g.addColorStop(1, rgb(base, 0.72));
  x.fillStyle = g;
  x.beginPath();
  x.arc(0, 0, r, 0, Math.PI * 2);
  x.fill();

  if (img) {
    // miniatura oficial do jogo: crop circular cobrindo o disco
    const sc = Math.max((d * 0.94) / img.width, (d * 0.94) / img.height);
    const dw = img.width * sc, dh = img.height * sc;
    x.save();
    x.beginPath();
    x.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    x.clip();
    x.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    x.restore();
    // vinheta para assentar a arte no disco
    const v = x.createRadialGradient(0, 0, r * 0.55, 0, 0, r * 0.9);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.4)');
    x.save();
    x.beginPath();
    x.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    x.clip();
    x.fillStyle = v;
    x.fillRect(-r, -r, d, d);
    x.restore();
  } else {
    // monograma: iniciais do nome (1–2 letras)
    const iniciais = ficha.nome
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('');
    x.fillStyle = 'rgba(255,255,255,0.92)';
    x.font = `bold ${r * 0.72}px system-ui, sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(iniciais, 0, r * 0.04);
  }

  // anel de papel
  x.lineWidth = r * 0.14;
  x.strokeStyle = anel;
  x.beginPath();
  x.arc(0, 0, r * 0.9, 0, Math.PI * 2);
  x.stroke();
  x.lineWidth = r * 0.05;
  x.strokeStyle = 'rgba(255,255,255,0.75)';
  x.beginPath();
  x.arc(0, 0, r * 0.76, 0, Math.PI * 2);
  x.stroke();

  // marca de poder: pontos no arco (1..6)
  x.fillStyle = 'rgba(255,255,255,0.9)';
  const n = Math.min(6, ficha.poder);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42;
    x.beginPath();
    x.arc(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r * 0.06, 0, Math.PI * 2);
    x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.45)';
    x.lineWidth = r * 0.02;
    x.stroke();
  }
}

/** raio padrão do token em metros, por tipo/tamanho */
export function tokenDiameter(ficha: NpcFicha): number {
  if (ficha.tipo === 'criatura') {
    const tam = (ficha.tamanho ?? '').toLowerCase();
    if (tam.includes('enorme') || tam.includes('colossal')) return 3;
    if (tam.includes('grande')) return 1.8;
    if (tam.includes('médio') || tam.includes('medio')) return 1.2;
    return 0.9;
  }
  return 1;
}

/** gera uma miniatura PNG em dataURL (para a ficha exibida no painel) */
export function tokenDataUrl(ficha: NpcFicha, create: CriadorCanvas, px = 96): string {
  const c = create(px, px);
  const x = c.getContext('2d') as CanvasRenderingContext2D;
  x.translate(px / 2, px / 2);
  const d = px * 0.86;
  drawNpcToken(x, ficha, d);
  return (c as HTMLCanvasElement).toDataURL('image/png');
}
