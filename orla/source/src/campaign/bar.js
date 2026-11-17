import { geometry } from './geometry.js';
export const BAR = {
  x: 0,
  z: 0,
  w: 12,
  d: 8,
  rise: 2.84,
  stair: {
    x: 10,
    z: 1,
    w: 1.2,
    d: 5.8,
    dir: 0
  }
};
export const inBar = (x, z) => x > .15 && x < 11.85 && z > .15 && z < 7.85;
export function barBarriers(level = 0) {
  const walls = [{
    x: -.15,
    z: 0,
    w: .2,
    d: 8
  }, {
    x: 11.95,
    z: 0,
    w: .2,
    d: 8
  }, {
    x: 0,
    z: -.15,
    w: 12,
    d: .2
  }, {
    x: 0,
    z: 7.95,
    w: 5.2,
    d: .2
  }, {
    x: 6.8,
    z: 7.95,
    w: 5.2,
    d: .2
  }];
  if (level === 0) walls.push({
    x: 1,
    z: 2,
    w: 7,
    d: .75
  }, {
    x: 2,
    z: 5,
    w: 1.4,
    d: 1
  }, {
    x: 6,
    z: 5,
    w: 1.4,
    d: 1
  });else {
    for (const x of [1, 4, 7]) walls.push({
      x,
      z: 1,
      w: 1.6,
      d: 2.2
    });
    for (const x of [3.4, 6.4, 9.4]) walls.push({
      x,
      z: .2,
      w: .12,
      d: 3.8
    });
  }
  return walls;
}
export function barGeometry({
  inside = false,
  upper = false,
  near = () => false,
  exteriorOnly = false
} = {}) {
  const g = geometry(),
    {
      box,
      rod,
      orb,
      face
    } = g,
    wood = '#775744',
    copper = '#ae7b4e',
    wall = '#535564';
  box(0, -.15, 0, 12, .15, 8, wood);
  for (let i = 0; i < 60; i++) rod([i * .2, .008, 0], [i * .2, .008, 8], .005, '#a5825f');
  for (let level = 0; level < 2; level++) {
    if (inside && !upper && level === 1) continue;
    const y = level * 2.84;
    for (const side of ['north', 'south', 'east', 'west']) {
      const along = ['north', 'south'].includes(side),
        len = along ? 12 : 8,
        plane = side === 'south' ? 8 : side === 'east' ? 12 : 0,
        cut = inside && near(side),
        h = cut ? .42 : 2.84;
      const seg = (a, b, base, hh) => along ? box(a, y + base, plane - .06, b - a, hh, .12, wall, 'metal') : box(plane - .06, y + base, a, .12, hh, b - a, wall, 'metal');
      if (cut) {
        seg(0, len, 0, h);
        continue;
      }
      for (let i = 0; i < len; i += 2) {
        const end = Math.min(len, i + 2),
          door = side === 'south' && level === 0 && i === 4;
        if (door) {
          seg(i, 5.2, 0, 2.84);
          seg(5.2, 6, 2.3, .54);
          continue;
        }
        if (side === 'south' && level === 0 && i === 6) {
          seg(6, 6.8, 2.3, .54);
          seg(6.8, 8, 0, 2.84);
          continue;
        }
        seg(i, end, 0, 1.05);
        seg(i, end, 2.1, .74);
        seg(i, i + .22, 1.05, 1.05);
        seg(end - .22, end, 1.05, 1.05);
        const glass = along ? [[i + .22, y + 1.05, plane], [end - .22, y + 1.05, plane], [end - .22, y + 2.1, plane], [i + .22, y + 2.1, plane]] : [[plane, y + 1.05, i + .22], [plane, y + 1.05, end - .22], [plane, y + 2.1, end - .22], [plane, y + 2.1, i + .22]];
        face(glass, '#659ca8', 'glass');
        const p = (u, v) => along ? [u, y + v, plane + .03] : [plane + .03, y + v, u];
        for (const u of [i + .22, i + 1, end - .22]) rod(p(u, 1.05), p(u, 2.1), .025, copper);
        rod(p(i + .22, 1.6), p(end - .22, 1.6), .025, copper);
      }
    }
    for (const x of [0, 12]) for (const z of [0, 8]) box(x - .1, y, z - .1, .2, 2.84, .2, copper, 'metal');
  }
  if (!inside || upper) {
    for (const [x, z, w, d] of [[0, 0, 10, 8], [11.2, 0, .8, 8], [10, 0, 1.2, 1], [10, 6.8, 1.2, 1.2]]) box(x, 2.7, z, w, .14, d, '#84624b');
    for (const x of [3.4, 6.4, 9.4]) box(x, 2.84, .2, .12, 1.75, 3.8, '#686274');
    for (const x of [1, 4, 7]) {
      box(x, 2.84, 1, 1.6, .3, 2.2, '#4b3b39');
      box(x + .06, 3.14, 1.06, 1.48, .18, 2.08, '#b5ad9b');
      box(x + .08, 3.32, 1.72, 1.44, .035, 1.36, '#685e83');
      box(x + .22, 3.33, 1.12, 1.14, .12, .42, '#d6cbb0');
      box(x, 2.84, .97, 1.6, .9, .1, copper);
      box(x + 1.75, 2.84, 1, .55, .55, .55, '#81624e');
      orb(x + 2, 3.6, 1.25, .13, .15, .13, '#e6c08b');
    }
    for (const z of [1, 6.8]) rod([10, 3.6, z], [11.2, 3.6, z], .025, copper);
    rod([10, 3.6, 1], [10, 3.6, 6.8], .025, copper);
    for (let z = 1; z <= 6.8; z += .45) rod([10, 2.84, z], [10, 3.6, z], .015, copper);
  }
  for (let i = 0; i < 18; i++) {
    const z = 6.8 - (i + 1) * 5.8 / 18,
      y = (i + 1) / 18 * 2.84;
    box(10, y - .1, z, 1.2, .1, 5.8 / 18, '#a3835d');
  }
  for (const x of [10, 11.2]) {
    rod([x, .8, 6.8], [x, 3.64, 1], .03, copper);
    for (let i = 0; i < 7; i++) {
      const z = 6.8 - i * 5.8 / 6,
        y = i / 6 * 2.84;
      rod([x, y, z], [x, y + .8, z], .018, copper);
    }
  }
  if (!(inside && upper)) {
    box(1, 0, 2, 7, 1, .75, '#4a3e55');
    box(.94, 1, 1.95, 7.12, .1, .85, copper);
    for (let x = 1.2; x < 8; x += .4) rod([x, .1, 2.77], [x, .85, 2.77], .015, copper);
    for (let x = 1.6; x < 8; x += 1.3) {
      orb(x, .72, 3.35, .24, .07, .24, '#7c415b');
      rod([x, 0, 3.35], [x, .68, 3.35], .04, '#8c8b83');
      orb(x, .03, 3.35, .2, .025, .2, '#616b73');
    }
    box(1, 0, .2, 7, 1.9, .25, '#393847');
    for (let y = .65; y < 1.9; y += .5) {
      box(1, y, .2, 7, .05, .45, copper);
      for (let x = 1.2; x < 7.8; x += .42) {
        rod([x, y, .45], [x, y + .25, .45], .045, Math.round(x * 10) % 2 ? '#5e9a92' : '#b08557');
        rod([x, y + .25, .45], [x, y + .34, .45], .018, '#d3c5a2');
      }
    }
    for (const x of [2, 6]) {
      box(x, .7, 5, 1.4, .1, 1, wood);
      for (const dx of [.1, 1.2]) for (const dz of [.1, .8]) box(x + dx, 0, 5 + dz, .08, .7, .08, copper);
      for (const z of [4.55, 6.35]) {
        box(x + .4, .43, z, .5, .08, .5, '#65536c');
        for (const dx of [.43, .8]) box(x + dx, 0, z + .1, .05, .43, .3, copper);
      }
      orb(x + .65, .88, 5.5, .06, .08, .06, '#d0a766');
    }
  }
  if (!inside) {
    box(-.25, 5.68, -.25, 12.5, .2, 8.5, '#323c4c', 'metal');
    for (let x = 0; x < 12; x += .4) rod([x, 5.9, 0], [x, 5.9, 8], .02, copper);
    box(8, 5.9, 1, 2, .65, 1.5, '#6b7377', 'metal');
    for (let x = 8.2; x < 10; x += .2) rod([x, 6.56, 1.1], [x, 6.56, 2.4], .02, '#2d3d48');
    rod([1, 5.9, 1], [1, 7.3, 1], .025, copper);
    orb(1, 7.3, 1, .14, .14, .14, '#83c8c7');
  }
  box(3.6, 2.28, 8.1, 4.8, .45, .15, '#242e47', 'metal');
  g.parts.push({
    kind: 'text',
    x: 6,
    y: 2.43,
    z: 8.3,
    size: .27,
    text: 'ÚLTIMA BATERIA',
    c: '#e6b876'
  });
  return exteriorOnly ? g.parts.filter(p => {
    if (p.kind === 'text') return true;
    if (p.kind === 'rod') return p.a[1] >= 5.68 || p.a[0] <= .15 || p.a[0] >= 11.85 || p.a[2] <= .15 || p.a[2] >= 7.85;
    if (p.kind === 'orb') return p.y >= 5.68;
    if (p.kind === 'face') return true;
    return p.x <= .15 || p.x + p.w >= 11.85 || p.z <= .15 || p.z + p.d >= 7.85 || p.y >= 5.68;
  }).map(p => ({
    ...p,
    layer: p.y >= 5.68 || p.a?.[1] >= 5.68 ? 100 : p.kind === 'text' ? 200 : 0
  })) : g.parts;
}
