// Ponto de entrada dos GERADORES DE MAPA do MapForge para o site (empacotado em js/mesa-mapforge-motor.js, carregado só quando o mestre abre o gerador).
export { generateDungeon } from './generator';
export { generateCity } from './city/generator';
export { generateWild } from './wild/generator';
export { exportGameData } from './gamedata';
export { exportCityGameData } from './city/gamedata';
export { exportWildGameData } from './wild/gamedata';
export { mobiliarSalas } from './furnish';
export { listStyles } from './styles';
export { BIOMES, BIOME_LABELS } from './wild/types';
export type { GameMapData } from './gamedata';
