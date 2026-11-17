// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
import { assignObjectIds } from '../persistence/object-state.js';
import { createHouseModels } from '../construction/models.js';

export function initialize001() {
  runtime.canvas = document.getElementById('game');
  runtime.ctx = runtime.canvas.getContext('2d', {
    alpha: false
  });
}
export function initialize002() {
  runtime.roofButton = document.getElementById('roof');
  runtime.toastEl = document.getElementById('toast');
}
export function initialize003() {
  runtime.W = 0;
  runtime.H = 0;
  runtime.dpr = 1;
  runtime.scale = 35;
  runtime.zoom = 1;
  runtime.target = null;
  runtime.roofMode = 0;
  runtime.frame = 0;
  runtime.last = 0;
  runtime.toastTime = 0;
  runtime.helpOpen = false;
}
export function initialize004() {
  runtime.cameraYaw = 0;
  runtime.cameraGoal = 0;
  runtime.dragRotate = null;
  runtime.walking = false;
  runtime.neutralJumpTimer = 0;
}
export function initialize005() {
  runtime.editMode = false;
  runtime.role = 'traveler';
  runtime.selected = null;
  runtime.editPlacing = null;
  runtime.editDragging = null;
}
export function initialize006() {
  runtime.handItem = null;
  runtime.mouseScreen = {
    x: 0,
    y: 0
  };
}
export function initialize007() {
  runtime.looks = {
    traveler: {
      skin: '#dca26b',
      hair: '#bd7539',
      outfit: '#713843',
      pants: '#303a4b',
      eyes: '#43342f',
      hairStyle: 'short',
      outfitStyle: 'tunic',
      bodyStyle: 'normal',
      beardStyle: 'none'
    },
    god: {
      skin: '#d5b692',
      hair: '#ded6bd',
      outfit: '#29394d',
      pants: '#3b4657',
      eyes: '#75b7d3',
      hairStyle: 'long',
      outfitStyle: 'robe',
      bodyStyle: 'strong',
      beardStyle: 'long'
    }
  };
}
export function initialize008() {
  runtime.godPresence = 'normal';
}
export function initialize009() {
  runtime.godMode = () => runtime.role === 'god';
}
export function initialize010() {
  runtime.godPhasing = () => runtime.godMode() && runtime.godPresence === 'ethereal';
}
export function initialize011() {
  runtime.SHEETS = {
    traveler: {
      name: 'Viajante',
      FOR: 11,
      DES: 13,
      CON: 12,
      INT: 12,
      PER: 11,
      VON: 10,
      CAR: 10,
      PV: 12,
      PM: 10,
      mov: 5
    },
    god: {
      name: 'Deus',
      FOR: 100,
      DES: 100,
      CON: 100,
      INT: 100,
      PER: 100,
      VON: 100,
      CAR: 100,
      PV: '∞',
      PM: '∞',
      mov: '∞'
    }
  };
}
export function initialize012() {
  runtime.kgLoad = () => runtime.SHEETS.traveler.FOR * 4;
}
export function initialize013() {
  runtime.player = {
    x: 6.5,
    z: 2.6,
    dir: 1,
    step: 0,
    walkBlend: 0,
    faceX: 1,
    faceY: .2,
    r: .22,
    elevation: 0,
    jumpY: 0,
    jump: null
  };
  runtime.keys = new Set();
}
export function initialize014() {
  runtime.camX = runtime.player.x;
  runtime.camZ = runtime.player.z;
}
export function initialize015() {
  runtime.METRE = 1;
}
export function initialize016() {
  runtime.WALL_THICKNESS = .15 * runtime.METRE;
  runtime.DOOR_THICKNESS = .05 * runtime.METRE;
}
export function initialize017() {
  runtime.house = {
    x: 0,
    z: 0,
    w: 10,
    h: 5,
    doorX1: 3.05,
    doorX2: 4.23,
    doorZ: 5
  };
}
export function initialize018() {
  runtime.foliage = [[-6, -3, 1.1], [-2, -4, .88], [6, -4, .9], [9, -2, .98], [13, 3, 1.18], [-5, 3, 1.12], [-4, 8, .8], [9, 8, 1.05], [13, 6, .76], [-1, -5, .75], [3, -5, .67], [15, 0, .8], [15, 8, .92], [12, 10, .84], [-6, 10, .86]];
}
export function initialize019() {
  runtime.shrubs = [[-1, 6, .95], [11, 4.8, 1.02], [8, -1, .92], [-1, -1, .96], [-3, 0, .88], [10, 7, 1.02], [13, 1, .92], [12, 9, .88], [-5, 7, .84]];
}
export function initialize020() {
  runtime.fixedSolids = [{
    label: 'cama',
    x: .12,
    z: .20,
    w: 1.6,
    d: .92,
    h: .35,
    movable: true,
    mass: 90,
    rot: 0
  }, {
    label: 'armario',
    x: 7.55,
    z: .28,
    w: .74,
    d: 1.56,
    h: 1.95,
    rot: 0,
    movable: true,
    mass: 115
  }, {
    label: 'bau',
    x: 8.18,
    z: 3.10,
    w: .96,
    d: .66,
    h: .54,
    rot: 2,
    movable: true,
    mass: 75
  }, {
    label: 'escrivaninha',
    x: 4.62,
    z: 4.08,
    w: 1.2,
    d: .72,
    h: .66,
    rot: 0,
    movable: true,
    mass: 65
  }, {
    label: 'chamine',
    x: 9.56,
    z: 1.22,
    w: .42,
    d: .92,
    h: 2.74,
    rot: 0,
    movable: false,
    mass: 999
  }, {
    label: 'luminaria',
    x: .78,
    z: 2.18,
    w: .18,
    d: .18,
    h: 1.34,
    movable: true,
    mass: 12
  }, {
    label: 'luminaria',
    x: 8.68,
    z: 2.44,
    w: .18,
    d: .18,
    h: 1.34,
    movable: true,
    mass: 12
  }];
}
export function initialize021() {
  runtime.editDecor = [];
}
export function initialize022() {
  runtime.pushables = [{
    label: 'mesa',
    x: 5.62,
    z: .46,
    w: 1.12,
    d: .58,
    h: .58,
    rot: 0,
    movable: true,
    mass: 23
  }, {
    label: 'banquinho',
    x: 5.96,
    z: 1.12,
    w: .42,
    d: .42,
    h: .42,
    rot: 0,
    movable: true,
    mass: 7
  }];
}
export function initialize023() {
  assignObjectIds(runtime.fixedSolids,'fixed');
  assignObjectIds(runtime.pushables,'moveable');
  runtime.houseModels=createHouseModels(runtime.fixedSolids,runtime.pushables);
  runtime.houseOneBlueprint = {
    id: 'casa-1',
    name: 'Casa 1',
    width: 7,
    depth: 5,
    wallHeight: 2.96,
    roof: 'gable-red',
    rooms: 2,
    features: ['porta', 'janelas', 'lareira', 'chaminé', 'parede interna', 'móveis', 'baú', 'luminárias'],
    fixedFurniture: runtime.houseModels.house1.fixed.map(o => ({
      ...o
    })),
    moveableFurniture: runtime.houseModels.house1.moveable.map(o => ({
      ...o
    })),
    layout: {
      innerWall: {
        x: 3.6,
        z1: .1,
        z2: 2.28
      },
      entrance: {
        x1: 3.05,
        x2: 4.23,
        z: 5
      }
    },
    sourceVersion: 'v0.46',
    kind: 'house1'
  };
}
export function initialize024() {
  runtime.houseTwoBlueprint = {
    fixedFurniture: runtime.houseModels.house2.fixed.map(o=>({...o})),
    moveableFurniture: runtime.houseModels.house2.moveable.map(o=>({...o})),
    id: 'casa-2',
    name: 'Casa 2',
    width: 10,
    depth: 5,
    wallHeight: 2.96,
    roof: 'gable-red',
    rooms: 3,
    kind: 'house2',
    features: ['sala ampliada', 'mesma linguagem da casa original', 'espaço central livre para escada', 'lareira', 'janelas', 'móveis compartilhados']
  };
}
export function initialize025() {
  runtime.useHouseTwoBase = true;
}
export function initialize026() {
  runtime.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
}
export function initialize027() {
  runtime.rnd = n => {
    let x = Math.sin(n * 126.93 + 14.17) * 43758.5453;
    return x - Math.floor(x);
  };
}
export function shade(hex, delta) {
  if (!hex || hex[0] !== '#') return hex;
  let s = hex.slice(1);
  if (s.length === 3) s = s.split('').map(c => c + c).join('');
  const nums = [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16));
  return '#' + nums.map(n => runtime.clamp(Math.round(n + delta), 0, 255).toString(16).padStart(2, '0')).join('');
}
export function initialize028() {
  runtime.inside = (x, z) => x > .12 && x < runtime.currentHouseWidth() - .12 && z > .12 && z < 4.88;
}
export function initialize029() {
  runtime.reveal = () => runtime.roofMode === 2 || runtime.roofMode === 0 && runtime.inside(runtime.player.x, runtime.player.z);
}
export function initialize030() {
  runtime.game = {
    door: {
      locked: true,
      open: false
    },
    chest: {
      locked: true,
      open: false
    },
    loot: {
      coins: false,
      gem: false
    },
    deskLoot: {
      paper: false,
      book: false
    },
    items: {
      houseKey: false,
      chestKey: false
    },
    booksTaken: 0,
    booksLeft: 6,
    lamps: [true, true],
    rug: {
      collected: false,
      placed: true,
      x: .45,
      z: 1.8
    },
    droppedItems: [],
    placedDeskBook: false,
    placedDeskPaper: false,
    groundKeys: {
      house: {
        x: 6.7,
        z: 3.2
      },
      chest: {
        x: 2.75,
        z: 1.35
      }
    },
    pending: null,
    fireplace: {
      wood: 0,
      lit: false,
      burn: 0
    }
  };
}
export function initialize031() {
  runtime.ITEM_SPEC = {
    backpack: {
      name: 'Mochila',
      litres: 18
    },
    clothing: {
      name: 'Roupa simples',
      litres: 2
    },
    coins: {
      name: '12 moedas',
      litres: .18
    },
    gem: {
      name: 'Cristal azul',
      litres: .25
    },
    paper: {
      name: 'Papéis',
      litres: .15
    },
    deskBook: {
      name: 'Livro antigo',
      litres: 1.6
    },
    book: {
      name: 'Livro da estante',
      litres: 1.6
    },
    rug: {
      name: 'Tapete',
      litres: 24
    },
    houseKey: {
      name: 'Chave da casa',
      litres: .05
    },
    chestKey: {
      name: 'Chave do baú',
      litres: .05
    },
    apple: {
      name: 'Maçã',
      litres: .35
    },
    cup: {
      name: 'Copo',
      litres: .28
    },
    mug: {
      name: 'Xícara',
      litres: .30
    },
    axe: {
      name: 'Machado',
      litres: 3.5
    },
    pickaxe: {
      name: 'Picareta',
      litres: 4.0
    },
    shovel: {
      name: 'Pá',
      litres: 3.0
    },
    wood: {
      name: 'Lenha',
      litres: 3
    },
    ore: {
      name: 'Minério',
      litres: 1.4
    },
    stoneChunk: {
      name: 'Pedra',
      litres: 1.8
    },
    soil: {
      name: 'Terra',
      litres: 1.5
    },
    treasure: {
      name: 'Tesouro',
      litres: 1.2
    }
  };
}
export function initialize032() {
  runtime.STORAGE_LIMIT = {
    inventory: 40,
    chest: 65,
    drawerTop: 5,
    drawerBottom: 7,
    shelf: 18,
    table: 9,
    deskTop: 7,
    bed: 20,
    floor: 9999
  };
}
export function initialize033() {
  runtime.INVENTORY_SLOT_LITRES = 2;
}
export function initialize034() {
  runtime.emptyDragImage = (() => {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    return c;
  })();
}
export function initialize035() {
  runtime.game.stores = {
    inventory: [],
    chest: ['coins', 'gem'],
    drawerTop: ['paper'],
    drawerBottom: ['deskBook'],
    shelf: Array(6).fill('book'),
    table: ['apple', 'cup', 'mug'],
    deskTop: ['paper'],
    bed: [],
    floor: ['rug']
  };
}
export function initialize036() {
  runtime.game.drawerOpen = [false, false];
}
export function initialize037() {
  runtime.shelfRows = [2, 2, 2];
}
export function initialize038() {
  runtime.workAnimation = {
    kind: null,
    until: 0,
    x: 0,
    z: 0
  };
}
export function startWorkAnimation(kind, x, z) {
  runtime.workAnimation = {
    kind,
    until: performance.now() + 600,
    x,
    z
  };
}
export function initialize039() {
  runtime.gathering = {
    trees: [],
    rocks: [{
      x: -1.8,
      z: 5.1,
      hp: 5,
      hard: 3,
      max: 5
    }, {
      x: 8.7,
      z: 5.8,
      hp: 5,
      hard: 3,
      max: 5
    }],
    mound: {
      x: 8.6,
      z: 7.1,
      work: 0,
      dug: false,
      chestOpen: false
    },
    activeTool: null
  };
}
export function initialize040() {
  for (let i = 0; i < runtime.foliage.length; i++) runtime.gathering.trees.push({
    hp: 6,
    hard: 4,
    max: 6,
    fallen: false
  });
  // Equipamentos e ferramentas estão fisicamente no mapa, não equipados de graça.
}
export function initialize041() {
  runtime.equipment = {
    clothing: 'clothing',
    left: null,
    right: null,
    backpack: null
  };
}
export function initialize042() {
  runtime.initialEquipmentDrops = [{
    type: 'backpack',
    x: 3.0,
    z: 7.3
  }, {
    type: 'axe',
    x: 2.4,
    z: 7.35
  }, {
    type: 'pickaxe',
    x: 2.1,
    z: 8.05
  }, {
    type: 'shovel',
    x: 3.0,
    z: 8.85
  }];
}
export function initialize043() {
  for (const o of runtime.initialEquipmentDrops) {
    runtime.game.droppedItems.push({
      ...o
    });
    runtime.game.stores.floor.push(o.type);
  }
}
