// Shared geometric descriptions for Canvas and WebGL. Coordinates are x, height, z.
export function geometry() {
  const parts = [];
  return {
    parts,
    box: (x, y, z, w, h, d, c, m = 'wood') => parts.push({
      kind: 'box',
      x,
      y,
      z,
      w,
      h,
      d,
      c,
      m
    }),
    orb: (x, y, z, w, h, d, c) => parts.push({
      kind: 'orb',
      x,
      y,
      z,
      w,
      h,
      d,
      c
    }),
    rod: (a, b, r, c) => parts.push({
      kind: 'rod',
      a,
      b,
      r,
      c
    }),
    face: (p, c, m = 'plain') => parts.push({
      kind: 'face',
      p,
      c,
      m
    })
  };
}
export function treeGeometry(type, size = 1) {
  const g = geometry(),
    {
      box,
      orb,
      rod,
      face
    } = g;
  const bark = type === 'birch' ? '#d6d3be' : type === 'spiral' ? '#8b65a2' : '#71614b';
  if (type === 'crystal') {
    for (let i = 0; i < 5; i++) {
      const x = Math.sin(i * 2.4) * .32,
        z = Math.cos(i * 2.4) * .32,
        h = 1.5 + i * .27;
      for (let j = 0; j < 6; j++) {
        const a = j * Math.PI / 3,
          b = (j + 1) * Math.PI / 3;
        face([[x, h, z], [x + Math.cos(a) * .18, .1, z + Math.sin(a) * .18], [x + Math.cos(b) * .18, .1, z + Math.sin(b) * .18]], j % 2 ? '#a36ec5' : '#6b528f');
      }
    }
  } else if (type === 'cactus') {
    rod([0, 0, 0], [0, 2.6, 0], .15, '#6b9277');
    for (const sign of [-1, 1]) {
      rod([0, 1.1, 0], [sign * .5, 1.1, 0], .11, '#6b9277');
      rod([sign * .5, 1.1, 0], [sign * .5, 1.9, 0], .11, '#7eab80');
    }
    for (let i = 0; i < 15; i++) rod([.14, i * .16, 0], [.21, i * .16 + .03, 0], .006, '#c0c5a2');
  } else {
    rod([0, 0, 0], [0, 2.3, 0], type === 'palm' ? .09 : .12, bark);
    for (let i = 0; i < 11; i++) rod([-.1, i * .19, .05], [.10, i * .19 + .03, .05], .008, type === 'birch' ? '#55524a' : '#a58b61');
    if (['pine', 'cedar', 'cypress'].includes(type)) {
      for (let k = 0; k < 6; k++) {
        const y = .7 + k * .34,
          r = type === 'cypress' ? .3 : .85 - k * .12;
        for (let j = 0; j < 10; j++) {
          const a = j * Math.PI / 5,
            b = (j + 1) * Math.PI / 5;
          face([[0, y + .9, 0], [Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(b) * r, y, Math.sin(b) * r]], j % 2 ? '#41695b' : '#527c61');
        }
      }
    } else if (type === 'palm') {
      for (let i = 0; i < 9; i++) {
        const a = i * 2 * Math.PI / 9,
          dx = Math.cos(a),
          dz = Math.sin(a);
        rod([0, 2.3, 0], [dx * 1.25, 1.9, dz * 1.25], .018, '#a5ac60');
        for (let j = 1; j < 6; j++) {
          const f = j / 6;
          face([[dx * f, 2.5 - f * .3, dz * f], [dx * f - dz * .25, 2.1 - f * .2, dz * f + dx * .25], [dx * (f + .25), 2.4 - f * .4, dz * (f + .25)]], i % 2 ? '#648451' : '#7b9c5a');
        }
      }
    } else if (type === 'fungus') {
      orb(0, 2.1, 0, 1.0, .35, 1.0, '#8c5b9d');
      orb(0, 1.98, 0, .88, .09, .88, '#b8d6b1');
      for (let i = 0; i < 14; i++) {
        const a = i * 2.4;
        orb(Math.cos(a) * .7, 2.25, Math.sin(a) * .7, .07, .035, .07, '#d7c8e7');
      }
    } else {
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4,
          dx = Math.cos(a) * .57,
          dz = Math.sin(a) * .57,
          h = 1.7 + i * .15;
        rod([0, 1.2, 0], [dx, h, dz], .035, bark);
        orb(dx, h + .2, dz, type === 'willow' ? .65 : .46, type === 'spiral' ? .19 : .47, .46, type === 'lantern' ? '#537e91' : type === 'spiral' ? '#967bb0' : i % 2 ? '#769462' : '#50765c');
        if (type === 'willow' || type === 'lantern') for (let j = 0; j < 3; j++) {
          rod([dx + j * .12, h, dz], [dx + j * .12, h - .9, dz + .08], .012, type === 'lantern' ? '#80dfc9' : '#698b55');
          if (type === 'lantern') orb(dx + j * .12, h - .9, dz + .08, .055, .12, .055, '#b7f2cf');
        }
      }
    }
  }
  return g.parts.map(p => scalePart(p, size));
}
function scalePart(p, k) {
  const q = {
    ...p
  };
  for (const key of ['x', 'y', 'z', 'w', 'h', 'd', 'r']) if (q[key] !== undefined) q[key] *= k;
  for (const key of ['a', 'b']) if (q[key]) q[key] = q[key].map(v => v * k);
  if (q.p) q.p = q.p.map(v => v.map(n => n * k));
  return q;
}
export function actorGeometry(spec, look = {}, phase = 0) {
  const g = geometry(),
    {
      box,
      orb,
      rod,
      face
    } = g,
    c = look.color || spec.color,
    skin = look.skin || spec.skin,
    shape = spec.shape;
  if (['human', 'alien', 'robot'].includes(shape)) {
    const robot = shape === 'robot',
      head = shape === 'alien' ? 1.6 : 1.48;
    for (const sign of [-1, 1]) {
      const step = Math.sin(phase) * .09 * sign;
      rod([sign * .13, .74, 0], [sign * .13, .38, step], .085, look.pants || '#343c50');
      rod([sign * .13, .38, step], [sign * .13, .09, -step], .07, look.pants || '#49536a');
      box(sign * .13 - .09, .02, -.14 - step, .18, .12, .28, '#303942');
      rod([sign * .27, 1.27, 0], [sign * .34, .92, step], .065, c);
      rod([sign * .34, .92, step], [sign * .31, .7, .1], .05, skin);
      orb(sign * .31, .68, .1, .065, .08, .06, skin);
    }
    if(look.rounded&&!robot){orb(0,1.08,0,.23,.28,.15,c);orb(0,.8,0,.21,.18,.14,c);rod([-.18,.76,.13],[.18,.76,.13],.018,'#8c7453');}
    else {box(-.23,.69,-.13,.46,.65,.27,c,robot?'metal':'plain');box(-.25,.7,-.14,.5,.05,.3,'#b4905d','metal');}
    for (let i = 0; i < 4; i++) orb(.035, .84 + i * .1, .15, .018, .018, .014, '#d9bd79');
    if (!robot) {
      face([[-.23, 1.28, .15], [-.05, 1.08, .17], [-.02, 1.34, .13]], '#a99878');
      face([[.23, 1.28, .15], [.08, 1.08, .17], [.02, 1.34, .13]], '#665477');
    }
    orb(0, head, 0, robot ? .21 : .18, shape === 'alien' ? .27 : .23, .17, skin);
    if (robot) {
      box(-.19, head - .05, .13, .38, .11, .05, '#172d3a', 'metal');
      rod([-.12, head, .19], [.12, head, .19], .02, '#8cffe0');
      orb(-.23, head, 0, .05, .09, .09, '#be9560');
    } else {
      for (const sign of [-1, 1]) {
        orb(sign * .07, head + .02, .16, .035, .025, .012, '#e6ddd0');
        orb(sign * .07, head + .02, .174, .013, .019, .008, look.eyes || '#253941');
      }
      orb(0, head - .04, .18, .025, .04, .03, skin);
      rod([-.04, head - .11, .16], [.04, head - .11, .16], .008, '#6b4c48');
      if (shape === 'human') {if(look.hairStyle!=='bald')orb(0, head + .16, -.02, .19, .1, .17, look.hair || '#443b40');if(look.hairStyle==='long')orb(0,head-.04,-.12,.2,.27,.1,look.hair||'#443b40');}else for (const sign of [-1, 1]) rod([sign * .15, head, 0], [sign * .3, head + .17, -.04], .028, skin);
    }
    // Equipment remains attached to the same local body frame in every view.
    if(look.backpack){box(-.19,.82,-.29,.38,.39,.17,'#51485e');rod([-.16,1.3,-.1],[-.16,.8,-.1],.025,'#b49a68');rod([.16,1.3,-.1],[.16,.8,-.1],.025,'#b49a68');}
    if(['pistol','laserRifle','bow'].includes(look.weapon)){rod([.31,.73,.1],[.31,.73,look.weapon==='pistol'?.38:.72],.035,'#424858');if(look.weapon==='laserRifle')rod([.31,.75,.35],[.31,.75,.7],.012,'#8adbe9');}
    if(['longsword','lightsaber','spear','staff'].includes(look.weapon)){rod([.31,.6,.1],[.31,look.weapon==='spear'?2.1:1.7,.1],look.weapon==='lightsaber'?.026:.018,look.weapon==='lightsaber'?'#97eaf4':'#c5cbd2');rod([.22,.86,.1],[.4,.86,.1],.02,'#b9a16d');}
    if (look.beard) {
      for (let i = 0; i < 5; i++) rod([(i - 2) * .04, head - .1, .16], [(i - 2) * .025, head - (look.beardStyle==='short'?.22:.45), .18], .027, '#eee9dc');
    }
    if (spec.hat || look.accessory === 'hat') {
      orb(0, head + .2, 0, .31, .025, .26, '#4e4655');
      box(-.17, head + .19, -.14, .34, .18, .28, '#5c5260');
    }
    if (spec.goggles) box(-.18, head + .11, .13, .36, .08, .045, '#bb985f', 'metal');
    if (look.outfitStyle==='robe')box(-.22,.22,-.13,.44,.55,.27,c);
    if (look.outfitStyle==='coat')for(const sign of [-1,1])box(sign<0?-.23:.04,.5,-.12,.19,.31,.26,c);
    if (spec.armor || look.outfitStyle==='armor') {
      for (const sign of [-1, 1]) orb(sign * .26, 1.25, 0, .16, .1, .19, '#7a8794');
    }
    if (look.accessory === 'crest') for (let i = 0; i < 5; i++) rod([0, head + .2, -.12 + i * .06], [0, head + .4, -.12 + i * .06], .022, c);
    if (look.accessory === 'antenna') {
      rod([.1, head + .18, 0], [.16, head + .45, 0], .015, '#c9ae6b');
      orb(.16, head + .45, 0, .035, .035, .035, '#87e6d1');
    }
  } else if (shape === 'drone') {
    orb(0, 1.0, 0, .4, .24, .4, c);
    orb(0, 1, .35, .14, .12, .08, '#e9ac61');
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      rod([0, 1, 0], [Math.cos(a) * .65, 1, Math.sin(a) * .65], .03, '#b1a382');
      orb(Math.cos(a) * .65, 1, Math.sin(a) * .65, .2, .025, .2, skin);
    }
    rod([0, .8, 0], [0, .45, 0], .018, '#85d7e5');
  } else if (shape === 'spore') {
    rod([0, .1, 0], [0, 1.4, 0], .18, skin);
    orb(0, 1.45, 0, .6, .25, .55, c);
    for (const sign of [-1, 1]) {
      rod([0, .7, 0], [sign * .4, .3, .1], .07, skin);
      rod([sign * .1, .25, 0], [sign * .2, .02, .1], .08, skin);
    }
    for (let i = 0; i < 8; i++) orb(Math.cos(i * 2.4) * .4, 1.6, Math.sin(i * 2.4) * .3, .06, .025, .06, '#d4e7a7');
  } else {
    const insect = shape === 'scarab';
    orb(0, .5, 0, .35, .28, .62, c);
    orb(0, .55, .58, .23, .19, .28, skin);
    for (const sign of [-1, 1]) {
      orb(sign * .13, .62, .79, .035, .035, .03, '#e8bf6e');
      for (let j = 0; j < (insect ? 3 : 2); j++) {
        const z = (j - (insect ? 1 : .5)) * .55,
          wave = Math.sin(phase + j) * .06;
        rod([sign * .25, .45, z], [sign * .48, .25, z + wave], .05, c);
        rod([sign * .48, .25, z + wave], [sign * .48, .04, z + .12], .035, skin);
      }
    }
    for (let j = 0; j < 6; j++) orb(0, .74, -.4 + j * .15, .26, .04, .08, skin);
    rod([0, .45, -.5], [.2, .15, -1.05], .065, c);
    if (shape === 'drake') for (let j = 0; j < 5; j++) face([[-.07, .7, -.4 + j * .2], [0, 1, -.3 + j * .2], [.07, .7, -.4 + j * .2]], skin);
  }
  const width=look.bodyStyle==='strong'?1.16:look.bodyStyle==='slim'?.85:1;
  if(width!==1)for(const p of g.parts){if(p.x!==undefined)p.x*=width;if(p.w!==undefined)p.w*=width;if(p.a)p.a[0]*=width;if(p.b)p.b[0]*=width;if(p.p)for(const q of p.p)q[0]*=width;}
  return g.parts.map(p => scalePart(p, look.scale || 1));
}
