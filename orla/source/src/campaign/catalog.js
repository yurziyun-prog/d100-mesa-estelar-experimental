export const BIOMES = {
  meadow: {
    name: 'Campina da Orla',
    ground: '#496257',
    accent: '#91a873',
    trees: ['oak', 'birch', 'willow'],
    home: true
  },
  desert: {
    name: 'Deserto de dunas',
    ground: '#c19b63',
    accent: '#efd2a0',
    trees: ['palm', 'cactus']
  },
  mountains: {
    name: 'Serra de granito',
    ground: '#717c73',
    accent: '#c2c8b5',
    trees: ['pine', 'cedar'],
    mountains: true
  },
  ruins: {
    name: 'Ruínas do observatório',
    ground: '#72745f',
    accent: '#a6a58b',
    trees: ['cypress', 'oak'],
    ruins: true
  },
  violet: {
    name: 'Deserto de ametista',
    ground: '#6b416f',
    accent: '#c38ad5',
    trees: ['crystal', 'cactus'],
    mountains: true
  },
  alien: {
    name: 'Floresta de lanternas',
    ground: '#263f50',
    accent: '#74e8cc',
    trees: ['lantern', 'spiral', 'fungus']
  },
  forest: {
    name: 'Bosque temperado',
    ground: '#3b5543',
    accent: '#9aaa67',
    trees: ['oak', 'birch', 'willow', 'pine', 'cedar', 'cypress']
  },
  tropical: {
    name: 'Floresta tropical',
    ground: '#365946',
    accent: '#b5bf67',
    trees: ['palm', 'oak', 'willow']
  },
  vespera: {
    name: 'Véspera · Cidade Baixa',
    ground: '#3e414c',
    accent: '#a68d79',
    trees: [],
    city: true
  }
};
export const TREES = {
  oak: 'Carvalho',
  birch: 'Bétula',
  willow: 'Salgueiro',
  pine: 'Pinheiro',
  cedar: 'Cedro',
  cypress: 'Cipreste',
  palm: 'Palmeira',
  cactus: 'Cacto',
  crystal: 'Cristal vivo',
  lantern: 'Árvore-lanterna',
  spiral: 'Árvore espiral',
  fungus: 'Cogumelo arbóreo'
};
export const ACTORS = {
  explorer: {
    name: 'Exploradora',
    shape: 'human',
    hp: 16,
    color: '#526e85',
    skin: '#c99571',
    dialogue: 'Há caminhos antigos entre as serras. Prepare provisões antes de partir.'
  },
  guard: {
    name: 'Guarda da Cidade Baixa',
    shape: 'human',
    hp: 24,
    color: '#504f72',
    skin: '#a97e62',
    armor: true,
    dialogue: 'Mantenha as armas guardadas dentro da Última Bateria.'
  },
  trader: {
    name: 'Mercador de relíquias',
    shape: 'human',
    hp: 14,
    color: '#9b634b',
    skin: '#c99b7c',
    hat: true,
    dialogue: 'Compro histórias de ruínas. As relíquias são assunto para depois.'
  },
  mechanic: {
    name: 'Mecânica de Véspera',
    shape: 'human',
    hp: 18,
    color: '#a37d45',
    skin: '#754f3e',
    goggles: true,
    dialogue: 'Se ainda produz uma faísca, eu consigo consertar.'
  },
  alien: {
    name: 'Peregrino astral',
    shape: 'alien',
    hp: 20,
    color: '#594675',
    skin: '#88bab0',
    dialogue: 'As árvores de luz escutam mais do que parece.'
  },
  robot: {
    name: 'Autômato de serviço',
    shape: 'robot',
    hp: 22,
    color: '#b98a58',
    skin: '#657c83',
    dialogue: 'Assistência disponível. Aguardando instruções do mestre.'
  },
  bartender: {
    name: 'UR-17 · administrador',
    shape: 'robot',
    hp: 30,
    color: '#a66e43',
    skin: '#6f858b',
    dialogue: 'Bem-vindo à Última Bateria. Bar no térreo, quartos no piso de cima. Enquanto houver carga, há abrigo.'
  },
  hound: {
    name: 'Cão de ferro',
    shape: 'hound',
    hp: 18,
    color: '#687987',
    skin: '#b6ab83'
  },
  scarab: {
    name: 'Escaravelho de vidro',
    shape: 'scarab',
    hp: 22,
    color: '#577d89',
    skin: '#bc84ca'
  },
  drake: {
    name: 'Lagarto das dunas',
    shape: 'drake',
    hp: 28,
    color: '#9b7b51',
    skin: '#e1c18a'
  },
  spore: {
    name: 'Andarilho de esporos',
    shape: 'spore',
    hp: 20,
    color: '#8b638b',
    skin: '#b3c797'
  },
  drone: {
    name: 'Sentinela flutuante',
    shape: 'drone',
    hp: 16,
    color: '#52677e',
    skin: '#dbad64'
  }
};
export const ATTITUDES = {
  hostile: 'Hostil',
  neutral: 'Neutra',
  friendly: 'Amigável'
};
export const copy = v => JSON.parse(JSON.stringify(v));
export const validColor = (v, fallback) => /^#[0-9a-f]{6}$/i.test(v || '') ? v : fallback;
export function makeActor(type, x, z, options = {}) {
  const spec = ACTORS[type];
  if (!spec || !Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 38 || Math.abs(z) > 38) return null;
  return {
    id: options.id || 'npc-' + crypto.randomUUID(),
    type,
    x,
    z,
    elevation: Number(options.elevation) || 0,
    name: String(options.name || spec.name).slice(0, 60),
    attitude: ATTITUDES[options.attitude] ? options.attitude : 'neutral',
    color: validColor(options.color, spec.color),
    skin: validColor(options.skin, spec.skin),
    scale: Math.max(.65, Math.min(1.5, Number(options.scale) || 1)),
    hp: spec.hp,
    maxHp: spec.hp,
    cooldown: 0,
    yaw: 0,
    inventory: type === 'bartender' ? [...Array(6).fill('coffee'), ...Array(6).fill('water'), ...Array(6).fill('beer'), ...Array(6).fill('ration')] : [],
    accessory: ['none', 'crest', 'hat', 'antenna'].includes(options.accessory) ? options.accessory : 'none'
  };
}
export function validateCampaign(v) {
  if (!v || v.version !== 1 || !Array.isArray(v.scenes)) return null;
  const scenes = v.scenes.filter(o => o && typeof o.id === 'string' && BIOMES[o.biome]).slice(0, 20).map(o => ({
    ...o,
    name: String(o.name || BIOMES[o.biome].name).slice(0, 70)
  }));
  if (!scenes.some(o => o.id === v.active)) return null;
  return {
    ...v,
    scenes,
    party: Array.isArray(v.party) ? v.party.slice(0, 12) : [],
    appearance: v.appearance || {}
  };
}
