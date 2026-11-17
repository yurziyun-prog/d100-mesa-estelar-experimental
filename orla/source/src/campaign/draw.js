import { state as s } from '../core/state.js';
export function drawParts(parts, x = 0, z = 0, y = 0, yaw = 0) {
  const c = s.ctx,
    u = s.scale * s.zoom,
    cs = Math.cos(yaw),
    sn = Math.sin(yaw),
    point = p => [x + p[0] * cs - p[2] * sn, z + p[0] * sn + p[2] * cs, y + p[1]],
    project = p => s.P(...point(p));
  const depth = p => {
    const a = p.a || [(p.x || 0) + (p.kind === 'box' ? p.w / 2 : 0), p.y || 0, (p.z || 0) + (p.kind === 'box' ? p.d / 2 : 0)],
      q = point(a);
    return (p.layer || 0) + s.painterDepth(q[0], q[1]) + .02 * q[2];
  };
  c.save();
  for (const p of [...parts].sort((a, b) => depth(a) - depth(b))) {
    if (p.kind === 'box') {
      const {
          w,
          h,
          d
        } = p,
        at = (dx, dy, dz) => project([p.x + dx, p.y + dy, p.z + dz]);
      const faces = [[[0, 0, 0], [w, 0, 0], [w, h, 0], [0, h, 0]], [[w, 0, 0], [w, 0, d], [w, h, d], [w, h, 0]], [[w, 0, d], [0, 0, d], [0, h, d], [w, h, d]], [[0, 0, d], [0, 0, 0], [0, h, 0], [0, h, d]], [[0, h, 0], [w, h, 0], [w, h, d], [0, h, d]]];
      faces.sort((a, b) => {
        const center = f => f.reduce((r, v) => r + depth({
          x: p.x + v[0],
          y: p.y + v[1],
          z: p.z + v[2]
        }), 0);
        return center(a) - center(b);
      });
      for (const f of faces) s.poly(f.map(v => at(...v)), p.c, '#18202c35', .6);
    } else if (p.kind === 'orb') {
      const q = project([p.x, p.y, p.z]),
        r = Math.max(.1, p.w) * u,
        g = c.createRadialGradient(q[0] - r * .3, q[1] - r * .35, 0, q[0], q[1], r * 1.2);
      g.addColorStop(0, p.c);
      const color=/^#[0-9a-f]{6}$/i.test(p.c)?p.c:'#8e96a3';
      const shade='#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*.67).toString(16).padStart(2,'0')).join('');
      g.addColorStop(1, shade);
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(q[0], q[1], Math.max(1, p.w * u), Math.max(1, p.h * u), 0, 0, Math.PI * 2);
      c.fill();
    } else if (p.kind === 'rod') {
      c.strokeStyle = p.c;
      c.lineWidth = Math.max(.6, p.r * 2 * u);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(...project(p.a));
      c.lineTo(...project(p.b));
      c.stroke();
    } else if (p.kind === 'face') s.poly(p.p.map(project), p.c, '#17202d30', .5);else if (p.kind === 'text') {
      const q = project([p.x, p.y, p.z]);
      c.font = `bold ${Math.max(9, u * p.size)}px Georgia`;
      c.textAlign = 'center';
      c.fillStyle = p.c;
      c.fillText(p.text, ...q);
    }
  }
  c.restore();
}
