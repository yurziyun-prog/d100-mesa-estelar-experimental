// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
import { clipIndoorWeather } from '../rendering/occlusion.js';
export function initialize116() {
  runtime.glCanvas = document.getElementById('glView');
  runtime.weatherCanvas = document.getElementById('weatherView');
  runtime.wc = runtime.weatherCanvas.getContext('2d');
}
export function initialize117() {
  runtime.visual3D = false;
  runtime.worldRenderer = null;
  runtime.weatherParticles = [];
  runtime.meteorTrails = [];
}
export function initialize118() {
  runtime.climate = {
    hour: 9,
    weather: 'clear',
    auto: true,
    speed: 3,
    weatherAuto: true,
    days: 0
  };
}
export function initialize119() {
  try {
    const saved = JSON.parse(localStorage.getItem('orla-visual-climate') || 'null');
    if (saved && typeof saved === 'object') Object.assign(runtime.climate, saved);
    if (typeof runtime.climate.weatherAuto !== 'boolean') runtime.climate.weatherAuto = true;
  } catch (_) {}
}
export function initialize120() {
  runtime.allowedWeather = {
    clear: true,
    rain: true,
    wind: true,
    sand: true,
    meteor: true,
    snow: true
  };
}
export function initialize121() {
  try {
    Object.assign(runtime.allowedWeather, JSON.parse(localStorage.getItem('orla-weather-allowed') || '{}'));
  } catch (_) {}
}
export function initialize122() {
  runtime.weatherTypes = [['clear', '☀️ Limpo'], ['rain', '🌧️ Chuva'], ['wind', '💨 Vento'], ['sand', '🏜️ Areia'], ['meteor', '☄️ Meteoros'], ['snow', '❄️ Neve']];
}
export function initialize123() {
  runtime.climateBox = document.getElementById('climate');
  runtime.timePanel = document.getElementById('timePanel');
}
export function initialize124() {
  runtime.climateButton = document.getElementById('climateBtn');
  runtime.graphicsButton = document.createElement('button');
}
export function initialize125() {
  runtime.clockSlider = document.getElementById('clockSlider');
  runtime.cycleToggle = document.getElementById('cycleToggle');
  runtime.speedSlider = document.getElementById('speedSlider');
}
export function initialize126() {
  runtime.climateClock = document.getElementById('clockLabel');
  runtime.weatherAutoControl = document.getElementById('weatherAuto');
}
export function naturalWeather() {
  const r = Math.random();
  const choice = r < .60 ? 'clear' : r < .78 ? 'rain' : r < .90 ? 'wind' : r < .968 ? 'sand' : r < .996 ? 'snow' : 'meteor';
  return runtime.allowedWeather[choice] ? choice : Object.keys(runtime.allowedWeather).filter(k => runtime.allowedWeather[k])[0] || 'clear';
}
export function switchWeather(value) {
  runtime.climate.weather = value;
  runtime.weatherParticles = [];
  runtime.meteorTrails = [];
  runtime.saveClimate();
  runtime.climateSync();
}
export function saveClimate() {
  try {
    localStorage.setItem('orla-visual-climate', JSON.stringify(runtime.climate));
  } catch (_) {}
}
export function clockText() {
  const m = Math.round((runtime.climate.hour % 24 + 24) % 24 * 60);
  return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
export function daylight() {
  const h = runtime.climate.hour % 24;
  return Math.max(0, Math.min(1, (h - 5) / 2, (20 - h) / 2, 1));
}
export function climateSync() {
  const day = runtime.daylight();
  const label = runtime.weatherTypes.find(x => x[0] === runtime.climate.weather)?.[1] || 'Limpo';
  runtime.timePanel.textContent = (day > .28 ? '☀️' : '🌙') + ' ' + runtime.clockText() + ' · ' + label;
  runtime.climateButton.textContent = (day > .28 ? '☀️' : '🌙') + ' Clima';
  runtime.clockSlider.value = String(Math.floor(runtime.climate.hour * 60));
  runtime.climateClock.textContent = runtime.clockText();
  runtime.cycleToggle.checked = runtime.climate.auto;
  runtime.weatherAutoControl.checked = runtime.climate.weatherAuto;
  runtime.speedSlider.value = runtime.climate.speed;
  document.querySelectorAll('#weatherChoices button').forEach(b => b.classList.toggle('active', b.dataset.weather === runtime.climate.weather));
}
export function initialize127() {
  for (const [name, label] of runtime.weatherTypes) {
    const b = document.createElement('button');
    b.textContent = label;
    b.dataset.weather = name;
    b.onclick = () => {
      if (runtime.role !== 'god') return runtime.toast('Somente Deus controla o clima.');
      runtime.climate.weatherAuto = false;
      runtime.switchWeather(name);
    };
    document.getElementById('weatherChoices').append(b);
  }
}
export function initialize128() {
  for (const [id, label] of runtime.weatherTypes) {
    const x = document.createElement('label');
    x.style.cssText = 'font-size:11px;white-space:nowrap';
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.checked = runtime.allowedWeather[id];
    c.onchange = () => {
      if (!runtime.godMode()) {
        c.checked = runtime.allowedWeather[id];
        return;
      }
      runtime.allowedWeather[id] = c.checked;
      try {
        localStorage.setItem('orla-weather-allowed', JSON.stringify(runtime.allowedWeather));
      } catch (_) {}
      ;
    };
    x.append(c, document.createTextNode(' ' + label));
    document.getElementById('weatherAllowed').append(x);
  }
}
export function initialize129() {
  runtime.weatherAutoControl.onchange = e => {
    if (runtime.role !== 'god') {
      runtime.weatherAutoControl.checked = runtime.climate.weatherAuto;
      return runtime.toast('Somente Deus escolhe o clima.');
    }
    runtime.climate.weatherAuto = e.target.checked;
    if (runtime.climate.weatherAuto) runtime.switchWeather(runtime.naturalWeather());
    runtime.saveClimate();
    runtime.climateSync();
  };
}
export function closeClimate() {
  runtime.climateBox.classList.remove('open');
}
export function initialize130() {
  runtime.climateButton.onclick = () => {
    runtime.climateBox.classList.toggle('open');
    runtime.climateSync();
  };
}
export function initialize131() {
  runtime.clockSlider.oninput = e => {
    if (runtime.role !== 'god') {
      runtime.climateSync();
      return runtime.toast('Somente Deus muda o horário.');
    }
    runtime.climate.hour = Number(e.target.value) / 60;
    runtime.climate.auto = false;
    runtime.saveClimate();
    runtime.climateSync();
  };
}
export function initialize132() {
  runtime.cycleToggle.onchange = e => {
    if (runtime.role !== 'god') {
      runtime.climateSync();
      return runtime.toast('Somente Deus controla o tempo.');
    }
    runtime.climate.auto = e.target.checked;
    runtime.saveClimate();
    runtime.climateSync();
  };
}
export function initialize133() {
  runtime.speedSlider.oninput = e => {
    if (runtime.role !== 'god') {
      runtime.climateSync();
      return runtime.toast('Somente Deus controla o tempo.');
    }
    runtime.climate.speed = Number(e.target.value);
    runtime.saveClimate();
    runtime.climateSync();
  };
}
export function weatherSize() {
  const rect = runtime.canvas.getBoundingClientRect();
  const pixel = Math.min(2, window.devicePixelRatio || 1);
  runtime.weatherCanvas.width = Math.max(1, Math.round(rect.width * pixel));
  runtime.weatherCanvas.height = Math.max(1, Math.round(rect.height * pixel));
  runtime.weatherCanvas.style.width = rect.width + 'px';
  runtime.weatherCanvas.style.height = rect.height + 'px';
  runtime.wc.setTransform(pixel, 0, 0, pixel, 0, 0);
}
export function weatherTick(dt) {
  runtime.snowAccum = Math.max(0, Math.min(1.2, (runtime.snowAccum || 0) + (runtime.climate.weather === "snow" ? dt * .027 : -dt * .004)));
  const w = runtime.weatherCanvas.clientWidth || window.innerWidth,
    h = runtime.weatherCanvas.clientHeight || window.innerHeight;
  runtime.wc.clearRect(0, 0, w, h);
  if (runtime.climate.auto) {
    const oldHour = runtime.climate.hour;
    runtime.climate.hour = (runtime.climate.hour + dt * (4e-3 + runtime.climate.speed * 0.014)) % 24;
    if (runtime.climate.hour < oldHour) {
      runtime.climate.days = (runtime.climate.days || 0) + 1;
      if (runtime.climate.weatherAuto) runtime.switchWeather(runtime.naturalWeather());
      runtime.saveClimate();
    }
  }
  const sunlight = runtime.daylight();
  if (sunlight < 0.98) {
    runtime.wc.fillStyle = "rgba(9,18,47," + Math.min(0.62, (1 - sunlight) * 0.58).toFixed(3) + ")";
    runtime.wc.fillRect(0, 0, w, h);
  }
  if (runtime.climate.weather === "sand") {
    runtime.wc.fillStyle = "rgba(168,114,40,.16)";
    runtime.wc.fillRect(0, 0, w, h);
  }
  if (sunlight < 0.85) {
    runtime.wc.save();
    runtime.wc.globalCompositeOperation = "destination-out";
    const lamps = runtime.reveal() ? runtime.fixedSolids.filter(o => o.label === "luminaria" && !o.hidden) : [];
    for (let i = 0; i < lamps.length; i++) {
      if (!runtime.game.lamps[i]) continue;
      const lamp = lamps[i],
        pt = runtime.P(lamp.x + lamp.w / 2, lamp.z + lamp.d / 2, 0.9);
      const radius = runtime.scale * runtime.zoom * 2.75;
      const grad = runtime.wc.createRadialGradient(pt[0], pt[1], 5, pt[0], pt[1], radius);
      grad.addColorStop(0, "rgba(0,0,0,.9)");
      grad.addColorStop(0.4, "rgba(0,0,0,.65)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      runtime.wc.fillStyle = grad;
      runtime.wc.beginPath();
      runtime.wc.arc(pt[0], pt[1], radius, 0, Math.PI * 2);
      runtime.wc.fill();
    }
    runtime.wc.restore();
  }
  // Clima com coordenadas reais no mapa: ao girar a camera, partículas não giram junto.
  if (["rain", "wind", "sand", "snow"].includes(runtime.climate.weather)) {
    const kind = runtime.climate.weather;
    const count = kind === 'rain' ? 245 : kind === 'snow' ? 185 : 140;
    const radius = 26;
    while (runtime.weatherParticles.length < count) runtime.weatherParticles.push({
      x: runtime.camX + (Math.random() - .5) * radius * 2,
      z: runtime.camZ + (Math.random() - .5) * radius * 2,
      y: 1 + Math.random() * 13,
      v: .55 + Math.random() * 1.3,
      seed: Math.random() * 100
    });
    runtime.weatherParticles.length = count;
    runtime.wc.save();
    clipIndoorWeather(runtime.wc);
    runtime.wc.lineCap = 'round';
    for (const p of runtime.weatherParticles) {
      const snow = kind === 'snow',
        rain = kind === 'rain';
      const windX = rain ? -.55 : kind === 'sand' ? 2.15 : snow ? .21 : 1.5;
      const windZ = rain ? .12 : kind === 'sand' ? .45 : snow ? -.12 : -.28;
      p.x += dt * windX * p.v;
      p.z += dt * windZ * p.v;
      p.y -= dt * (rain ? 11 : snow ? 1.15 : kind === 'sand' ? .42 : .2) * p.v;
      if (p.y < 0 || Math.abs(p.x - runtime.camX) > radius || Math.abs(p.z - runtime.camZ) > radius) {
        p.x = runtime.camX + (Math.random() - .5) * radius * 2;
        p.z = runtime.camZ + (Math.random() - .5) * radius * 2;
        p.y = 4 + Math.random() * 11;
      }
      const [px, py] = runtime.P(p.x, p.z, p.y);
      if (px < -30 || px > w + 30 || py < -60 || py > h + 40) continue;
      runtime.wc.strokeStyle = snow ? 'rgba(250,252,255,.88)' : rain ? 'rgba(186,216,250,.54)' : kind === 'sand' ? 'rgba(222,180,112,.68)' : 'rgba(219,239,215,.35)';
      if (snow) {
        runtime.wc.fillStyle = 'rgba(250,251,255,.90)';
        runtime.wc.beginPath();
        runtime.wc.arc(px, py, 1.15 + p.v * .5, 0, Math.PI * 2);
        runtime.wc.fill();
      } else {
        const end = runtime.P(p.x + windX * .16, p.z + windZ * .16, p.y - (rain ? .62 : .1));
        runtime.wc.lineWidth = rain ? 1.15 : 1.8;
        runtime.wc.beginPath();
        runtime.wc.moveTo(px, py);
        runtime.wc.lineTo(end[0], end[1]);
        runtime.wc.stroke();
      }
    }
    runtime.wc.restore();
  } else runtime.weatherParticles = [];
  if (runtime.climate.weather === 'meteor') {
    if (runtime.meteorTrails.length < 3 && Math.random() < dt * .6) runtime.meteorTrails.push({
      x: runtime.camX + (Math.random() - .5) * 30,
      z: runtime.camZ + (Math.random() - .5) * 30,
      y: 10 + Math.random() * 6,
      life: 1.5,
      vel: 6 + Math.random() * 4
    });
    for (let i = runtime.meteorTrails.length - 1; i >= 0; i--) {
      const m = runtime.meteorTrails[i];
      m.x -= dt * m.vel * .8;
      m.y -= dt * m.vel * 1.5;
      m.life -= dt;
      const from = runtime.P(m.x, m.z, m.y),
        to = runtime.P(m.x + 1.8, m.z, m.y + 1.6);
      runtime.wc.strokeStyle = 'rgba(255,211,135,' + Math.min(1, Math.max(0, m.life)) + ')';
      runtime.wc.lineWidth = 2.8;
      runtime.wc.beginPath();
      runtime.wc.moveTo(from[0], from[1]);
      runtime.wc.lineTo(to[0], to[1]);
      runtime.wc.stroke();
      if (m.life <= 0 || m.y < 0) runtime.meteorTrails.splice(i, 1);
    }
  } else if (runtime.meteorTrails.length) runtime.meteorTrails = [];
  runtime.timePanel.textContent = (sunlight > 0.28 ? "\u2600\uFE0F" : "\u{1F319}") + " " + runtime.clockText() + " \xB7 " + (runtime.weatherTypes.find(x => x[0] === runtime.climate.weather)?.[1] || "Limpo");
  if (runtime.climateBox.classList.contains("open")) {
    runtime.climateClock.textContent = runtime.clockText();
    runtime.clockSlider.value = String(Math.floor(runtime.climate.hour * 60));
  }
}
// No external dependency. Geometry is rasterized by the GPU and uses the depth buffer.
export function initialize134() {
  // Renderizador WebGL experimental pausado: preservar o cenário isométrico detalhado.
  runtime.worldRenderer = null;
}
export function initialize135() {
  if (!runtime.worldRenderer) {
    runtime.visual3D = false;
    runtime.graphicsButton.textContent = '2D (sem WebGL)';
    runtime.graphicsButton.title = 'WebGL indisponível neste navegador';
    runtime.graphicsButton.disabled = true;
  }
}
export function initialize136() {
  runtime.graphicsButton.onclick = () => runtime.setVisual3D(!runtime.visual3D);
}
export function refreshVisuals(dt) {
  if (runtime.visual3D && runtime.worldRenderer) runtime.worldRenderer.draw();
  runtime.weatherTick(dt);
}
export function initialize137() {
  window.addEventListener('resize', runtime.weatherSize);
}
export function initialize138() {
  runtime.weatherSize();
}
export function initialize139() {
  runtime.setVisual3D(false);
}
export function initialize140() {
  runtime.climateSync();
}
