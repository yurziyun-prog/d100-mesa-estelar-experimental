import { state as s } from '../core/state.js';
export
// src/combat/creature.js
function drawEnemy() {
  const e = s.combat.enemy,
    p = s.P(e.x, e.z),
    u = s.scale * s.zoom,
    c = s.ctx,
    dead = e.hp <= 0,
    t = s.combatTime || 0;
  c.save();
  c.translate(...p);
  c.fillStyle = "#14201d85";
  c.beginPath();
  c.ellipse(0, 0, u * 0.5, u * 0.18, 0, 0, 7);
  c.fill();
  if (dead) {
    c.rotate(-1.25);
    c.translate(0, u * .19);
    c.globalAlpha = 0.78;
  } else if (s.orlaEnemyStrikeAt && performance.now() < s.orlaEnemyStrikeAt) {
    const t = 1 - (s.orlaEnemyStrikeAt - performance.now()) / 390;
    c.translate(0, -Math.sin(Math.PI * t) * u * .2);
  }
  const bounce = dead ? 0 : Math.sin(t * 5) * u * 0.018;
  c.translate(0, bounce);
  const face = s.screenVector(s.player.x - e.x, s.player.z - e.z);
  if (face[0] < 0) c.scale(-1, 1);
  c.lineCap = "round";
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = (i - 1) * u * 0.22,
      wave = dead ? 0 : Math.sin(t * 6 + i + side) * u * 0.04;
    c.strokeStyle = side < 0 ? "#334b4f" : "#52696a";
    c.lineWidth = u * 0.06;
    c.beginPath();
    c.moveTo(x, -u * 0.31);
    c.lineTo(x - side * u * 0.16, -u * 0.15 + wave);
    c.lineTo(x + side * u * 0.15, -u * 0.03);
    c.stroke();
    c.strokeStyle = "#b3bda2";
    c.lineWidth = u * 0.018;
    c.beginPath();
    c.moveTo(x + side * u * 0.15, -u * 0.03);
    c.lineTo(x + side * u * 0.2, u * 0.015);
    c.stroke();
  }
  c.strokeStyle = "#536866";
  c.lineWidth = u * 0.09;
  c.beginPath();
  c.moveTo(-u * 0.26, -u * 0.32);
  c.bezierCurveTo(-u * 0.75, -u * 0.45, -u * 0.65, -u * 0.15, -u * 0.85, -u * 0.21);
  c.stroke();
  const g = c.createLinearGradient(0, -u * 0.8, 0, 0);
  g.addColorStop(0, "#84958a");
  g.addColorStop(0.5, "#405e62");
  g.addColorStop(1, "#253a43");
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, -u * 0.38, u * 0.43, u * 0.27, -0.1, 0, 7);
  c.fill();
  for (let i = 0; i < 6; i++) {
    c.strokeStyle = "#b1b99a66";
    c.lineWidth = u * 0.02;
    c.beginPath();
    c.ellipse((i - 2.5) * u * 0.1, -u * 0.41, u * 0.065, u * 0.17, -0.2, 3.2, 6);
    c.stroke();
  }
  c.fillStyle = "#617c79";
  c.beginPath();
  c.ellipse(u * 0.37, -u * 0.46, u * 0.22, u * 0.18, -0.15, 0, 7);
  c.fill();
  c.fillStyle = dead ? "#343b36" : "#f3aa49";
  for (const y of [-0.52, -0.43]) {
    c.beginPath();
    c.ellipse(u * 0.48, u * y, u * 0.035, u * 0.023, 0, 0, 7);
    c.fill();
  }
  c.strokeStyle = "#dfd5b5";
  c.lineWidth = u * 0.025;
  for (const z of [-1, 1]) {
    c.beginPath();
    c.moveTo(u * 0.48, -u * 0.35);
    c.quadraticCurveTo(u * 0.66, -u * (0.33 + z * 0.05), u * 0.57, -u * 0.24);
    c.stroke();
  }
  c.restore();
  if (!dead) {
    c.save();
    const w = 64;
    c.fillStyle = "#172328";
    c.fillRect(p[0] - w / 2, p[1] - u * 0.95, w, 5);
    c.fillStyle = "#d58856";
    c.fillRect(p[0] - w / 2, p[1] - u * 0.95, w * e.hp / e.maxHp, 5);
    c.font = "12px system-ui";
    c.textAlign = "center";
    c.fillStyle = "#f2dfbe";
    c.fillText(e.name, p[0], p[1] - u * 1.02);
    c.restore();
  }
}

// src/combat/combat.js
