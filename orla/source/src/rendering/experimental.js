// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';

export
// No external dependency. Geometry is rasterized by the GPU and uses the depth buffer.
function init3D() {
  const gl = runtime.glCanvas.getContext('webgl2', {
    antialias: true,
    alpha: false,
    depth: true
  });
  if (!gl) return null;
  const vert = `#version 300 es\nin vec3 aPos;in vec3 aCol;uniform vec2 uSize;uniform vec2 uCenter;uniform vec2 uRot;uniform float uScale;out vec3 vCol;void main(){vec3 p=aPos;p.x-=uCenter.x;p.z-=uCenter.y;vec2 r=vec2(p.x*uRot.x-p.z*uRot.y,p.x*uRot.y+p.z*uRot.x);float sx=(r.x-r.y)*.87*uScale;float sy=(r.x+r.y)*.45*uScale-p.y*uScale;float dep=(r.x+r.y)*.5+p.y*.62;gl_Position=vec4(sx/uSize.x*2.0, -sy/uSize.y*2.0-0.12, -dep/48.0,1.0);vCol=aCol;}`;
  const frag = `#version 300 es\nprecision mediump float;in vec3 vCol;out vec4 outColor;void main(){outColor=vec4(vCol,1.0);}`;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(prog));
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const attrPos = gl.getAttribLocation(prog, 'aPos'),
    attrCol = gl.getAttribLocation(prog, 'aCol');
  gl.enableVertexAttribArray(attrPos);
  gl.vertexAttribPointer(attrPos, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(attrCol);
  gl.vertexAttribPointer(attrCol, 3, gl.FLOAT, false, 24, 12);
  const uniSize = gl.getUniformLocation(prog, 'uSize'),
    uniCenter = gl.getUniformLocation(prog, 'uCenter'),
    uniRot = gl.getUniformLocation(prog, 'uRot'),
    uniScale = gl.getUniformLocation(prog, 'uScale');
  let verts = [];
  function color(c) {
    const h = c.replace('#', '');
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }
  function tri(a, b, c, col) {
    const rgb = color(col);
    for (const p of [a, b, c]) verts.push(p[0], p[1], p[2], ...rgb);
  }
  function quad(a, b, c, d, col) {
    tri(a, b, c, col);
    tri(a, c, d, col);
  }
  function cube(x, z, y, w, d, h, front = '#957858', right = '#806145', top = '#b99b77') {
    const A = [x, y, z],
      B = [x + w, y, z],
      C = [x + w, y, z + d],
      D = [x, y, z + d],
      E = [x, y + h, z],
      F = [x + w, y + h, z],
      G = [x + w, y + h, z + d],
      H = [x, y + h, z + d];
    quad(A, B, F, E, front);
    quad(B, C, G, F, right);
    quad(C, D, H, G, front);
    quad(D, A, E, H, right);
    quad(E, F, G, H, top);
  }
  function disc(x, z, y, r, colorMain = '#ae8a65', n = 9) {
    const center = [x, y, z],
      c = colorMain;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2,
        b = (i + 1) / n * Math.PI * 2;
      tri(center, [x + Math.cos(a) * r, y, z + Math.sin(a) * r], [x + Math.cos(b) * r, y, z + Math.sin(b) * r], c);
    }
  }
  function sphere(x, z, y, r, c) {
    const stack = 5,
      seg = 9;
    for (let j = 0; j < stack; j++) {
      const th = j * Math.PI / stack,
        th2 = (j + 1) * Math.PI / stack;
      for (let i = 0; i < seg; i++) {
        const a = i * Math.PI * 2 / seg,
          b = (i + 1) * Math.PI * 2 / seg;
        const q = (t, a) => [x + Math.sin(t) * Math.cos(a) * r, y + Math.cos(t) * r, z + Math.sin(t) * Math.sin(a) * r];
        const colorC = j % 2 === 0 ? c : '#5c975a';
        quad(q(th, a), q(th, b), q(th2, b), q(th2, a), colorC);
      }
    }
  }
  function simpleItem(type, x, z, y) {
    const colors = {
      apple: '#bd4034',
      cup: '#d5d9dc',
      mug: '#e0c6a3',
      paper: '#e5e0c4',
      book: '#674b8c',
      deskBook: '#8e333c',
      coins: '#d6b55e',
      gem: '#55c5d3',
      houseKey: '#d6bf65',
      chestKey: '#bdd9d2',
      rug: '#7f345d'
    };
    const c = colors[type] || '#b58c5e';
    if (type === 'apple') sphere(x, z, y + .07, .095, c);else cube(x - .075, z - .06, y, .15, .12, .13, c, c, c);
  }
  function furniture(o) {
    if (o.hidden) return;
    const {
        x,
        z,
        w,
        d
      } = o,
      h = o.h;
    switch (o.label) {
      case 'cama':
        cube(x, z, 0, w, d, .24, '#795437', '#876039', '#b84d4b');
        cube(x + .1, z + .08, .24, .5, d - .16, .05, '#cfbea5', '#cfbea5', '#e7d8c5');
        break;
      case 'escrivaninha':
      case 'mesa':
        for (const xx of [x + .1, x + w - .19]) for (const zz of [z + .09, z + d - .18]) cube(xx, zz, 0, .10, .10, Math.max(.1, h - .09), '#68462f', '#765139', '#8a6040');
        cube(x - .02, z - .02, h - .10, w + .04, d + .04, .10, '#92653f', '#91603c', '#c39b65');
        if (o.label === 'escrivaninha') cube(x + w - .35, z + .04, .10, .30, d - .08, h - .18, '#79543a', '#60442e', '#b68b60');
        break;
      case 'armario':
        cube(x, z, 0, w, d, h, '#583a2c', '#664631', '#987354');
        for (let i = 0; i < 3; i++) cube(x - .03, z + .06, i * .46 + .20, .045, d - .12, .055, '#826044', '#8a674e', '#b5926a');
        for (let i = 0; i < runtime.game.stores.shelf.filter(v => v === 'book').length; i++) {
          const row = Math.floor(i / 5),
            col = i % 5;
          cube(x - .065, z + .1 + col * .12, row * .48 + .27, .06, .09, .25, ['#a8534a', '#6a8c7b', '#d0a251'][i % 3], '#60422f', '#dfb66e');
        }
        break;
      case 'bau':
        cube(x, z, 0, w, d, .43, '#262833', '#34323d', '#48414c');
        if (runtime.game.chest.open) {
          cube(x, z, .42, w, .06, .78, '#35323b', '#34313a', '#504b57');
          for (let i = 0; i < runtime.game.stores.chest.length; i++) simpleItem(runtime.game.stores.chest[i], x + .18 + i * .17, z + .3, .45);
        } else cube(x, z, .42, w, d, .14, '#33333e', '#35343b', '#66616a');
        break;
      case 'luminaria':
        cube(x, z, 0, .09, .09, 1.1, '#56452e', '#62503a', '#806f50');
        cube(x - .07, z - .07, 1.10, .24, .24, .29, runtime.game.lamps[0] ? '#d6b75b' : '#a29769', '#c3a851', '#f3dc8a');
        break;
      default:
        cube(x, z, 0, w, d, h, '#805435', '#95663f', '#b48753');
    }
  }
  function walls() {
    const wall = '#d8c09c',
      t = .12;
    cube(0, 0, 0, 7, t, 2.92, wall, wall, '#e8d9c1');
    cube(0, 0, 0, t, 5, 2.92, wall, wall, '#e8d9c1');
    cube(7 - t, 0, 0, t, 5, 2.92, wall, wall, '#e8d9c1');
    cube(0, 5 - t, 0, 3.05, t, 2.92, wall, wall, '#e8d9c1');
    cube(4.23, 5 - t, 0, 2.77, t, 2.92, wall, wall, '#e8d9c1');
    cube(3.05, 5 - t, 2.58, 1.18, t, .34, wall, wall, '#e8d9c1');
    cube(3.53, .08, 0, .14, 2.25, 1.64, '#d3ba93', '#c3a981', '#eadac2');
  }
  function addRoof() {
    const red = '#b4543a',
      dark = '#8f3c2e';
    const xa = -.28,
      xb = 7.28;
    quad([xa, 2.96, -.37], [xb, 2.96, -.37], [xb, 4.18, 2.5], [xa, 4.18, 2.5], red);
    quad([xa, 4.18, 2.5], [xb, 4.18, 2.5], [xb, 2.96, 5.39], [xa, 2.96, 5.39], dark);
  }
  function drawModel() {
    verts = [];
    const daylightValue = runtime.daylight(),
      wall = '#b6a17e';
    cube(-14, -12, -.12, 36, 34, .10, '#56854b', '#578f4d', '#6b995c');
    cube(0, 0, -.08, 7, 5, .08, '#8d6039', '#8d6039', '#a77b4e');
    // Exterior lawn pathway
    cube(3.13, 5, -.055, .68, 5, .035, '#aba38e', '#aea58d', '#d4c6ac');
    for (let i = 0; i < runtime.foliage.length; i++) {
      const [x, z, s] = runtime.foliage[i];
      cube(x - .12 * s, z - .12 * s, 0, .24 * s, .24 * s, 1.45 * s, '#755135', '#6d462c', '#916748');
      sphere(x, z, 2.0 * s, .7 * s, '#4f8646');
    }
    for (const [x, z, s] of runtime.shrubs) sphere(x, z, .24 * s, .40 * s, '#60984c');
    for (const o of runtime.editDecor) {
      if (o.kind === 'tree') {
        cube(o.x, o.z, 0, .15, .15, 1.2, '#73513c', '#70513b', '#73513c');
        sphere(o.x, o.z, 1.65, .6, '#548b53');
      } else cube(o.x, o.z, 0, o.w, o.d, o.h, '#7a6350', '#97826b', '#c0a58b');
    }
    const interior = runtime.reveal();
    if (interior) {
      const wallsVisible = runtime.roofMode !== 2;
      if (wallsVisible) {
        const c = Math.cos(runtime.cameraYaw),
          si = Math.sin(runtime.cameraYaw);
        cube(0, 0, 0, 7, .12, 2.92, '#d7c2a2', '#d7c2a2', '#e6d8bd');
        if (c + si > 0) cube(0, 0, 0, .12, 5, 2.92, '#d7c2a2', '#d7c2a2', '#e6d8bd');else cube(6.88, 0, 0, .12, 5, 2.92, '#d7c2a2', '#d7c2a2', '#e6d8bd');
      }
      cube(3.52, .10, 0, .16, 2.25, 1.64, '#d0b58f', '#bea17b', '#e8d6b7');
      cube(0, 4.94, 0, 3.05, .08, .55, '#bda787', '#af9877', '#dfc29d');
      cube(4.23, 4.94, 0, 2.77, .08, .55, '#bda787', '#af9877', '#dfc29d');
      for (const o of runtime.fixedSolids) if (o.label !== 'chamine') furniture(o);
      for (const o of runtime.pushables) furniture(o);
      cube(6.63, 2.0, 0, .37, .95, 2.75, '#927d68', '#aa9079', '#d5b9a0');
      cube(6.42, 2.06, .0, .22, .83, .23, '#9a826e', '#ab937b', '#dac3a5');
      cube(6.39, 2.2, .28, .06, .53, .93, '#191719', '#211c1d', '#312827');
      cube(6.39, 2.0, 1.20, .30, .96, .12, '#704e37', '#75553c', '#a87a55');
      if (runtime.game.door.open) cube(3.03, 3.98, 0, .08, 1.02, 2.53, '#64402e', '#704834', '#946547');else cube(3.05, 4.94, 0, 1.18, .07, 2.53, '#64402e', '#704834', '#946547');
      if (!runtime.game.items.chestKey) simpleItem('chestKey', runtime.game.groundKeys.chest.x, runtime.game.groundKeys.chest.z, .04);
      if (runtime.game.rug.placed) cube(runtime.game.rug.x, runtime.game.rug.z, .02, 2.4, 1.65, .025, '#7b2e52', '#7b2e52', '#a66a64');
      for (const [loc, o] of [['table', runtime.pushables.find(x => x.label === 'mesa')], ['deskTop', runtime.deskObject], ['bed', runtime.bedObject]]) {
        if (!o) continue;
        for (const [i, type] of (runtime.game.stores[loc] || []).entries()) simpleItem(type, o.x + .22 + i * .20, o.z + .24, o.h + .03);
      }
      for (const o of runtime.game.droppedItems.filter(x => runtime.inside(x.x, x.z))) simpleItem(o.type, o.x, o.z, .03);
    } else {
      walls();
      if (runtime.game.door.open) cube(3.03, 3.98, 0, .08, 1.02, 2.53, '#64402e', '#704834', '#946547');else cube(3.05, 4.94, 0, 1.18, .07, 2.53, '#64402e', '#704834', '#946547');
      addRoof();
      cube(7.0, 2.0, 0, .44, .9, 3.3, '#947b68', '#ad9581', '#d5bba4');
      cube(7.05, 2.1, 3.26, .42, .7, 1.25, '#9a8771', '#b5a08a', '#dbc6aa');
    }
    if (!runtime.game.items.houseKey) simpleItem('houseKey', runtime.game.groundKeys.house.x, runtime.game.groundKeys.house.z, .04);
    // A character with actual depth geometry; no 2D sprite overlapping furniture.
    const py = runtime.player.elevation + runtime.player.jumpY;
    cube(runtime.player.x - .13, runtime.player.z - .10, py, .26, .20, .68, runtime.role === 'god' ? '#3d455a' : '#6b3145', runtime.role === 'god' ? '#414b61' : '#83394f', runtime.role === 'god' ? '#515c78' : '#9f5866');
    cube(runtime.player.x - .1, runtime.player.z - .08, py - .36, .085, .13, .39, '#3b4350', '#3b4350', '#525868');
    cube(runtime.player.x + .02, runtime.player.z - .08, py - .36, .085, .13, .39, '#3b4350', '#3b4350', '#525868');
    sphere(runtime.player.x, runtime.player.z, py + .91, .23, runtime.role === 'god' ? '#c0a68e' : '#d39c6e');
    if (runtime.role === 'god') cube(runtime.player.x - .09, runtime.player.z - .13, py + .55, .18, .15, .24, '#c2c0ae', '#c2c0ae', '#ded6c8');
    // Direct 3D field objects persist at their world positions.
    for (const o of runtime.game.droppedItems.filter(x => !runtime.inside(x.x, x.z))) simpleItem(o.type, o.x, o.z, .03);
  }
  function drawFrame() {
    const pw = runtime.canvas.clientWidth || window.innerWidth,
      ph = runtime.canvas.clientHeight || window.innerHeight;
    if (runtime.glCanvas.width !== Math.round(pw * runtime.dpr) || runtime.glCanvas.height !== Math.round(ph * runtime.dpr)) {
      runtime.glCanvas.width = Math.round(pw * runtime.dpr);
      runtime.glCanvas.height = Math.round(ph * runtime.dpr);
    }
    gl.viewport(0, 0, runtime.glCanvas.width, runtime.glCanvas.height);
    const day = runtime.daylight();
    gl.clearColor(.11 + day * .29, .14 + day * .44, .20 + day * .16, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawModel();
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    gl.uniform2f(uniSize, pw, ph);
    gl.uniform2f(uniCenter, runtime.camX, runtime.camZ);
    gl.uniform2f(uniRot, Math.cos(runtime.cameraYaw), Math.sin(runtime.cameraYaw));
    gl.uniform1f(uniScale, runtime.scale * runtime.zoom);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length / 6);
  }
  return {
    draw: drawFrame
  };
}
// Renderizador WebGL experimental pausado: preservar o cenário isométrico detalhado.
export function setVisual3D(on) {
  runtime.visual3D = !!on && !!runtime.worldRenderer;
  runtime.glCanvas.style.display = runtime.visual3D ? 'block' : 'none';
  runtime.graphicsButton.textContent = runtime.visual3D ? '🧊 3D' : '🖌️ 2D';
}
