/**
 * API pública do motor — ponto de integração para o site Mesa Estelar.
 */
export { RNG, hashSeed } from './rng';
export type { GenConfig } from './generator';
export { generateDungeon, reanchorCorridors, isOnFloor } from './generator';
export type {
  Vec, Rect, Side, RoomKind, DoorType, Door, CapsuleRoom, Room, Prop,
  ExtraWall, MapMeta, MapDocument,
} from './types';
export {
  SIDES, sideLength, sideOrigin, sideDir, sideOutward, doorPos, roomCenter,
  propFootprint, rectsOverlap, pointInRect, distToSegment, distToPath,
} from './types';
export { validateMap, isValid, summarize } from './validate';
export type { Issue } from './validate';
export { serializeMap, parseMap, mapsEqual, FORMAT_VERSION } from './serialize';
export {
  exportGameData, exportGameDataJson, serializeGameData, isGameMapData,
  capsuleOutline, GAME_EXPORT_VERSION,
} from './gamedata';
export type {
  GameMapData, GameFloorArea, GameWallSegment, GameWallGap, GameDoor,
  GameObject, GameMarker, GameLink, ObjectCategory,
} from './gamedata';
export { renderMap } from './render/renderer';
export type { RenderOptions, RenderEnv } from './render/renderer';
export { PROP_PAINTERS, paintDoor, paintCorridorCap } from './render/sprites';
export { getStyle, hasStyle, listStyles } from './styles';
export type { MapStyle, PropSpec } from './styles';
// ---- cidade ----
export { generateCity, CITY_PROP_DIMS } from './city/generator';
export type { CityConfig } from './city/generator';
export type {
  CityDoc, CityStreet, CityPlaza, CityPark, CityBuilding, CityProp,
} from './city/types';
export { renderCity } from './city/render';
export { getCityTheme, listCityThemes } from './city/themes';
export { exportCityGameData, exportCityGameDataJson } from './city/gamedata';
// ---- exteriores (floresta, penhasco, campo, mina) ----
export { generateWild } from './wild/generator';
export type { WildConfig } from './wild/generator';
export type {
  WildDoc, WildTrail, WildCliff, WildWater, WildField, WildProp,
  Biome, TerrainKind, TerrainGrid,
} from './wild/types';
export { BIOMES, BIOME_LABELS, TERRAINS, WILD_PROP_DIMS } from './wild/types';
export { renderWild } from './wild/render';
export { getWildTheme, listWildThemes } from './wild/themes';
export { exportWildGameData, exportWildGameDataJson } from './wild/gamedata';
// ---- NPCs e criaturas de Calico ----
export {
  gerarNpc, gerarCriaturas, rolarClima, gerarEncontro, gerarArmadilha,
  gerarCharada, gerarRecompensa, gerarCenarioDescricao, habitatsDeCriaturas,
  PODERES, PAPEIS, CRIATURAS,
} from './npc/generator';
export type {
  NpcFicha, Geracao, Atributos, PapelNpc, OpcoesGeracao, OpcoesCriatura,
} from './npc/generator';
export { RACAS, CARREIRAS, PERICIAS } from './npc/data';
export type { RacaData, CarreiraData, CriaturaData, PericiaData } from './npc/data';
export { drawNpcToken, tokenDiameter, tokenDataUrl } from './npc/token';
export type { CriadorCanvas } from './npc/token';
export { CALICO_ESTACOES, CALICO_LUGARES, CALICO_FASES_LUA, CALICO_DIAS_SEMANA } from './calico';
export { makeToken, hitToken, spawnPositions } from './npc/token-layer';
export type { MapToken } from './npc/token-layer';
