// Ponto de entrada do motor de NPCs e criaturas do MapForge para o site (empacotado em js/mesa-npc-motor.js).
export {
  gerarNpc, gerarCriaturas, PAPEIS, PODERES, rolarClima, gerarEncontro, gerarArmadilha, gerarCharada,
  gerarRecompensa, gerarCenarioDescricao, habitatsDeCriaturas, CRIATURAS,
} from './npc/generator';
export type { NpcFicha, Geracao, PapelNpc } from './npc/generator';
export { RACAS, CARREIRAS, PERICIAS } from './npc/data';
export { aiDaFicha } from './npc/ai';
export { hashSeed } from './rng';
