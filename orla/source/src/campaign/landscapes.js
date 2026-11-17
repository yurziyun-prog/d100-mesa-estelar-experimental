import {drawComponent} from '../rendering/components.js';
import { state as s } from '../core/state.js';
import { BIOMES, TREES } from './catalog.js';
import { geometry, treeGeometry } from './geometry.js';
import { drawParts } from './draw.js';
import { BAR, inBar, barGeometry, barBarriers } from './bar.js';
const landscapeCache = new Map();
export function landscapeProps(biome) {
  if (landscapeCache.has(biome)) return landscapeCache.get(biome);
  const b = BIOMES[biome],
    items = [];
  if (b.mountains) for (const [x, z, k] of [[-11, -7, 1], [17, -9, 1.3], [-12, 15, .9]]) {
    const g = geometry();
    for (let ring = 0; ring < 3; ring++) for (let j = 0; j < 9; j++) {
      const a = j * 2 * Math.PI / 9,
        c = (j + 1) * 2 * Math.PI / 9,
        r = (4 - ring * .8) * k,
        h = (7 - ring * 1.5) * k;
      g.face([[Math.cos(a) * r, 0, Math.sin(a) * r], [.3, h, -.3], [Math.cos(c) * r, 0, Math.sin(c) * r]], biome === 'violet' ? j % 2 ? '#8f65a0' : '#5a4a72' : j % 2 ? '#89928b' : '#626e75');
      if (biome === 'mountains' && ring === 0) g.face([[.3, h, -.3], [Math.cos(a) * r * .25, h * .73, Math.sin(a) * r * .25], [Math.cos(c) * r * .25, h * .73, Math.sin(c) * r * .25]], '#cbd0c5');
    }
    items.push({
      x,
      z,
      parts: g.parts,
      r: 4 * k
    });
  }
  if (b.ruins) for (const [x, z] of [[-5, 0], [14, 0], [-5, 12], [16, 14]]) {
    const g = geometry();
    for (let i = 0; i < 3; i++) {
      g.box(i * 1.3, 0, 0, .7, .2, .7, '#8c9082', 'stone');
      g.rod([i * 1.3 + .35, .2, .35], [i * 1.3 + .35, 2.8 - i * .4, .35], .19, '#a2a593');
      for (let y = .3; y < 2.7 - i * .4; y += .33) g.rod([i * 1.3 + .15, y, .35], [i * 1.3 + .55, y, .35], .014, '#5f6c61');
    }
    g.box(0, 2.7, 0, 2, .2, .7, '#a7a28d', 'stone');
    for (let i = 0; i < 8; i++) g.box(Math.sin(i * 2.3) * 1.3, .02, 1 + i * .16, .25, .15, .3, '#757d70', 'stone');
    items.push({
      x,
      z,
      parts: g.parts,
      r: .6
    });
  }
  if (b.city) for (const [x, z, w, h] of [[-10, -4, 5, 7], [-8, 8, 4, 5], [16, -3, 5, 9], [18, 9, 4, 6], [-2, -10, 12, 8]]) {
    const g = geometry();
    g.box(0, 0, 0, w, h, 4, '#454854', 'metal');
    for (let y = 1; y < h; y += 1.7) for (let xx = .5; xx < w - .5; xx += 1.2) {
      g.box(xx, y, 4.01, .65, .75, .03, '#a6845e', 'metal');
      g.rod([xx + .32, y, 4.05], [xx + .32, y + .75, 4.05], .018, '#353b4b');
    }
    g.rod([w - .3, 0, 4.1], [w - .3, h + 1, 4.1], .12, '#926c50');
    g.box(-.15, h, 0, w + .3, .18, 4.2, '#66677a', 'metal');
    items.push({
      x,
      z,
      parts: g.parts,
      r: w / 2
    });
  }
  landscapeCache.set(biome, items);
  return items;
}
export function installLandscapes() {
  const map = s.activeMap(),
    b = BIOMES[map.biome];
  s.landscapeProps = () => landscapeProps(s.activeMap().biome);
  s.treeType = (i = 0) => b.trees[i % b.trees.length] || 'oak';
  if (!s.baseHouseEnabled) {
    s.fixedSolids.forEach(o => o.hidden = true);
    s.pushables.forEach(o => o.hidden = true);
    s.game.items.houseKey = s.game.items.chestKey = true;
    s.game.rug.placed = false;
    if (b.city) s.gathering.rocks = [];
    const inside = s.inside;
    s.inside = (x, z) => s.houseContext ? inside(x, z) : false;
    s.reveal = () => false;
    s.foliage = b.city ? [] : s.foliage.filter((_, i) => !['desert', 'violet'].includes(map.biome) || i % 3 === 0);
    s.shrubs = b.city || ['desert', 'violet'].includes(map.biome) ? [] : s.shrubs;
    s.gathering.trees = s.foliage.map((_, i) => s.gathering.trees[i] || {
      hp: 5,
      max: 5,
      wood: 3,
      fallen: false
    });
    s.secondFloor = false;
    s.onStairs = false;
    if (map.bar && inBar(s.player.x, s.player.z)) s.player.elevation = s.savedStorey?.elevation || 0;else s.player.elevation = 0;
  }
  const ground = s.ground,
    tree = s.tree,
    bush = s.bush;
  s.ground = () => {
    if (s.baseHouseEnabled) return ground();
    const c = s.ctx;
    c.fillStyle = b.ground;
    c.fillRect(0, 0, s.W, s.H);
    for (let i = 0; i < 160; i++) {
      const x = -25 + s.rnd(i * 37) * 60,
        z = -25 + s.rnd(i * 53) * 60,
        p = s.P(x, z),
        r = s.scale * s.zoom * (1.2 + s.rnd(i * 17) * 2);
      const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      g.addColorStop(0, b.accent + '24');
      g.addColorStop(1, b.accent + '00');
      c.fillStyle = g;
      c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
    }
    for (let i = 0; i < 650; i++) {
      const x = -25 + s.rnd(i * 31) * 60,
        z = -25 + s.rnd(i * 71) * 60,
        p = s.P(x, z),
        u = s.scale * s.zoom;
      c.strokeStyle = b.accent + '55';
      c.lineWidth = .7;
      c.beginPath();
      c.moveTo(...p);
      c.lineTo(p[0] + u * (b.city ? .6 : .12 + s.rnd(i) * .25), p[1] + u * .02);
      c.stroke();
    }
    if (b.city) for (let x = -24; x < 30; x += 2) for (let z = -22; z < 30; z += 2) {
      s.line3([x, z, 0], [x + 2, z, 0], '#706c6e', .6);
      s.line3([x, z, 0], [x, z + 2, 0], '#706c6e', .6);
    }
  };
  const terrainDraw=s.ground;s.ground=()=>{terrainDraw();if(!s.baseHouseEnabled)for(const o of s.editDecor)if(o.component&&o.kind==='floor'&&!o.hidden)drawComponent(o);};
  s.tree = (x, z, size) => {
    if (s.baseHouseEnabled) return tree(x, z, size);
    const i = s.foliage.findIndex(p => p[0] === x && p[1] === z);
    drawParts(treeGeometry(s.treeType(i < 0 ? 0 : i), size), x, z);
  };
  s.bush = (...args) => s.baseHouseEnabled ? bush(...args) : drawParts(treeGeometry(b.trees[0] || 'cactus', .25), args[0], args[1]);
  const entities = s.combatEntities;
  s.combatEntities = () => [...entities().filter(e => s.baseHouseEnabled || e.kind !== 'enemy'), ...s.landscapeProps().map(o => ({
    ...o,
    kind: 'landscape',
    draw: () => drawParts(o.parts, o.x, o.z)
  })), ...(map.plants || []).map(o => ({
    ...o,
    kind: 'landscape',
    draw: () => drawParts(treeGeometry(o.type, o.scale), o.x, o.z)
  })), ...(map.bar ? [{
    x: 6,
    z: 4,
    kind: 'house-bar',
    draw: () => {
      const interior = inBar(s.player.x, s.player.z);
      drawParts(barGeometry({
        inside: interior,
        exteriorOnly: !interior,
        upper: s.player.elevation > 2.5,
        near: side => s.painterDepth(side === 'west' ? 0 : side === 'east' ? 12 : 6, side === 'north' ? 0 : side === 'south' ? 8 : 4) > s.painterDepth(6, 4)
      }));
      if (interior) {
        for (const a of s.cast || []) if (inBar(a.x, a.z) && a.id !== s.controlledId && Math.abs((a.elevation || 0) - s.player.elevation) < 1) s.drawCastActor(a);
        for (const p of s.partyCharacters?.() || []) if (p.id !== s.controlledId && inBar(p.position.x, p.position.z) && Math.abs(p.position.elevation - s.player.elevation) < 1) s.drawPartyCharacter(p);
        s.character();
      }
    }
  }] : [])];
  const barriers = s.wallBarriers;
  s.wallBarriers = () => [...barriers(), ...(map.bar ? barBarriers(s.player.elevation >= 2.7 ? 1 : 0) : []), ...s.landscapeProps().map(o => ({
    x: o.x - o.r,
    z: o.z - o.r,
    w: o.r * 2,
    d: o.r * 2
  }))];
  const walk = s.canWalk;
  s.canWalk = (x, z, ...rest) => {
    if ((map.plants || []).some(o => Math.hypot(x - o.x, z - o.z) < .22 * o.scale + s.player.r)) return false;
    return walk(x, z, ...rest);
  };
  if (map.bar) installBarNavigation();
  const field = document.createElement('fieldset');
  field.innerHTML = '<legend>Vegetação</legend><label>Espécie <select id="plantType"></select></label><button id="plantPlace">Colocar no cenário</button>';
  document.getElementById('powersPanel').append(field);
  for (const [id, name] of Object.entries(TREES)) field.querySelector('select').add(new Option(name, id));
  field.querySelector('button').onclick = () => s.armCampaignPlacement?.({
    kind: 'plant',
    type: field.querySelector('select').value
  });
  s.placePlant = (type, x, z) => {
    if (!s.godMode() || !TREES[type] || !Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 38 || Math.abs(z) > 38 || map.plants.length >= 150 || !s.canWalk(x, z) || map.bar && inBar(x, z)) return false;
    map.plants.push({
      id: crypto.randomUUID(),
      type,
      x,
      z,
      scale: 1
    });
    s.saveGame();
    return true;
  };
}
function installBarNavigation() {
  const move = s.move,
    can = s.canWalk,
    support = s.supportHeight,
    rescue = s.rescueFromOverlap,
    jump = s.jumpAllowedPoint,
    world = s.worldAt;
  const ramp = (x, z) => x >= 10 && x <= 11.2 && z >= 1 && z <= 6.8;
  s.barInside = inBar;
  s.supportHeight = (x, z) => inBar(x, z) ? ramp(x, z) && s.onBarStair ? (6.8 - z) / 5.8 * 2.84 : s.player.elevation >= 2.7 ? 2.84 : 0 : support(x, z);
  s.canWalk = (x, z, ...a) => {
    if (inBar(s.player.x, s.player.z) || inBar(x, z)) {
      if (s.player.elevation >= 2.7 && !inBar(x, z)) return false;
      if (s.wallBarriers().some(o => s.circleRect(x, z, s.player.r, o))) return false;
      if (s.player.elevation >= 2.7 && ramp(x, z) && !s.onBarStair) return false;
      return true;
    }
    return can(x, z, ...a);
  };
  s.move = (dx, dz, dt) => {
    if (!inBar(s.player.x, s.player.z)) return move(dx, dz, dt);
    if (s.combat.hp <= 0 && !s.godMode()) return;
    const l = Math.hypot(dx, dz);
    if (!l) return;
    dx /= l;
    dz /= l;
    const speed = (s.godMode() ? 3.9 : Math.max(1.5, s.SHEETS.traveler.mov * .5)) * (s.keys.has('c') ? 1.55 : 1),
      n = Math.max(1, Math.ceil(speed * dt / .04));
    for (let i = 0; i < n; i++) {
      const x = s.player.x + dx * speed * dt / n,
        z = s.player.z + dz * speed * dt / n,
        aligned = x > 10 + s.player.r && x < 11.2 - s.player.r,
        enterBottom = s.player.elevation < .1 && s.player.z >= 6.75 && z < 6.8,
        enterTop = s.player.elevation >= 2.7 && s.player.z <= 1.05 && z > 1;
      if (aligned && (s.onBarStair || enterBottom || enterTop)) {
        s.onBarStair = z >= 1 && z <= 6.8;
        s.player.x = x;
        s.player.z = z;
        s.player.elevation = Math.max(0, Math.min(2.84, (6.8 - z) / 5.8 * 2.84));
      } else if (!s.onBarStair && s.canWalk(x, z)) {
        s.player.x = x;
        s.player.z = z;
      }
    }
    s.walking = true;
    s.player.faceX = dx;
    s.player.faceY = dz;
    s.player.step += dt * 10;
  };
  s.rescueFromOverlap = () => inBar(s.player.x, s.player.z) ? undefined : rescue();
  s.jumpAllowedPoint = (x, z) => inBar(s.player.x, s.player.z) ? s.canWalk(x, z) : jump(x, z);
  s.worldAt = (x, y) => world(x, y + (inBar(s.player.x, s.player.z) ? s.player.elevation * s.scale * s.zoom : 0));
  s.onBarStair = ramp(s.player.x, s.player.z) && s.player.elevation > 0 && s.player.elevation < 2.84;
}
