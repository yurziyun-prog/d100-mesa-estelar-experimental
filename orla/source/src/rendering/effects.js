import { state as s } from '../core/state.js';
// Palette and saber/beam shapes adapted from Mesa Estelar nova-efeitos.js.
export const EFFECTS = {
  shot: {
    label: 'Disparo',
    color: '#ffd447',
    duration: 350
  },
  arrow: {
    label: 'Flecha',
    color: '#cbbb91',
    duration: 450
  },
  attack: {
    label: 'Golpe',
    color: '#ffda80',
    duration: 550
  },
  laser: {
    label: 'Laser',
    color: '#ff4545',
    duration: 550
  },
  plasma: {
    label: 'Plasma',
    color: '#c56cff',
    duration: 700
  },
  fire: {
    label: 'Fogo',
    color: '#ff9c43',
    duration: 1100
  }
};
export function installEffects() {
  const active = [];
  s.visualEffects = active;
  let armed = null;
  s.triggerEffect = (kind, x, z) => {
    if (!EFFECTS[kind] || !Number.isFinite(x) || !Number.isFinite(z)) return false;
    const a = {
        x: s.player.x,
        z: s.player.z,
        y: s.player.elevation + 1
      },
      length = Math.min(kind === "attack" ? 1.5 : 8, Math.hypot(x - a.x, z - a.z)),
      angle = Math.atan2(z - a.z, x - a.x);
    let b = {
      ...a
    };
    for (let d = 0.12; d <= length; d += 0.12) {
      const tx = a.x + Math.cos(angle) * d,
        tz = a.z + Math.sin(angle) * d;
      if (s.wallBarriers().some(o => s.circleRect(tx, tz, 0.03, o))) break;
      b = {
        x: tx,
        z: tz,
        y: a.y
      };
    }
    if (active.length >= 24) active.shift();
    active.push({
      kind,
      a,
      b,
      start: performance.now()
    });
    return true;
  };
  const original = s.draw;
  s.draw = () => {
    original();
    const now = performance.now(),
      c = s.ctx;
    for (let i = active.length - 1; i >= 0; i--) {
      const e = active[i],
        style = EFFECTS[e.kind],
        t = (now - e.start) / style.duration;
      if (t >= 1) {
        active.splice(i, 1);
        continue;
      }
      const a = s.P(e.a.x, e.a.z, e.a.y),
        b = s.P(e.b.x, e.b.z, e.b.y);
      c.save();
      c.globalAlpha = 1 - t;
      c.strokeStyle = style.color;
      c.fillStyle = style.color;
      c.shadowColor = style.color;
      c.shadowBlur = 12;
      c.lineWidth = 3;
      c.beginPath();
      if (e.kind === "attack") {
        c.arc(b[0], b[1], s.scale * s.zoom * 0.35, -2 + t, 1 + t);
      } else if (e.kind === "fire") {
        for (let k = 0; k < 12; k++) {
          const phase = (t + k / 12) % 1,
            px = b[0] + Math.sin(k * 2.4 + phase * 3) * 12 * (1 - phase),
            py = b[1] - phase * 65;
          const g = c.createRadialGradient(px, py, 0, px, py, 8 * (1 - phase) + 2);
          g.addColorStop(0, "#fff1a4");
          g.addColorStop(0.4, "#ff9437");
          g.addColorStop(1, "#c1381200");
          c.fillStyle = g;
          c.fillRect(px - 10, py - 10, 20, 20);
        }
      } else {
        c.moveTo(...a);
        c.lineTo(...b);
      }
      c.stroke();
      c.shadowBlur = 0;
      if (e.kind !== "fire") {
        c.fillStyle = "#fff0cf";
        c.beginPath();
        c.arc(...b, 2 + 8 * (1 - t), 0, 7);
        c.fill();
      }
      c.restore();
    }
  };
  const controls = document.createElement("div");
  controls.id = "actionEffects";
  controls.innerHTML = '<button id="toggleEffects" type="button" aria-expanded="false">✦ Efeitos ▸</button><div id="effectsBody" hidden><label>Efeito visual <select id="effectKind"></select></label><button type="button" id="aimEffect">Mirar efeito</button><small>Clique no cenário · Esc cancela</small></div>';
  const sel = controls.querySelector("select");
  for (const [key, v] of Object.entries(EFFECTS)) sel.add(new Option(v.label, key));
  document.body.append(controls);
  const effectsBody = controls.querySelector('#effectsBody');
  controls.querySelector('#toggleEffects').onclick = () => {
    const open = effectsBody.hidden;
    effectsBody.hidden = !open;
    controls.querySelector('#toggleEffects').setAttribute('aria-expanded', String(open));
    controls.querySelector('#toggleEffects').textContent = open ? '✦ Efeitos ▾' : '✦ Efeitos ▸';
  };
  controls.querySelector("#aimEffect").onclick = () => {
    armed = sel.value;
    s.toast("Clique no alvo para " + EFFECTS[armed].label.toLowerCase() + ". Esc cancela.");
  };
  document.addEventListener("pointerdown", e => {
    if (!armed || e.target.id !== "game" || e.button !== 0) return;
    const p = s.worldAt(e.clientX, e.clientY);
    s.triggerEffect(armed, p.x, p.z);
    armed = null;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") armed = null;
  });
}

// src/characters/combatente-assets.json
