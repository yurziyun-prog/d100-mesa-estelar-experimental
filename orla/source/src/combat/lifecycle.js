import {state} from '../core/state.js';
export function installOrla057() {
  const panel = document.getElementById('combatPanel'),
    effects = document.getElementById('actionEffects');
  const content = panel?.querySelector('.combat-content'),
    c = state.combat;
  if (!panel || !content || !c) return;
  // Unificar o painel e manter os efeitos acessíveis somente ao Deus.
  if (effects) content.append(effects);
  const actions = document.createElement('div');
  actions.className = 'orla-healing';
  const serum = document.createElement('button');
  serum.type = 'button';
  serum.textContent = '💉 Usar ampola de ressurreição';
  const godRaise = document.createElement('button');
  godRaise.type = 'button';
  godRaise.textContent = '✨ Deus: ressuscitar viajante';
  const godRaiseEnemy = document.createElement('button');
  godRaiseEnemy.type = 'button';
  godRaiseEnemy.textContent = '✨ Deus: reviver criatura';
  actions.append(serum, godRaise, godRaiseEnemy);
  content.insertBefore(actions, content.querySelector('details'));
  const audio = document.createElement('button');
  audio.type = 'button';
  audio.className = 'orla-audio';
  let enabled = localStorage.getItem('orla-v057-audio') !== 'off';
  const syncAudio = () => {
    audio.textContent = enabled ? '🔊 Som' : '🔇 Mudo';
    audio.title = 'Ativar ou desativar sons de combate e clima';
  };
  syncAudio();
  content.prepend(audio);
  let ctx = null,
    ambience = null,
    lastAmbient = '';
  const audioContext = () => {
    if (!enabled) return null;
    try {
      ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (_) {
      return null;
    }
  };
  // Síntese original de efeitos, funciona sem download e offline.
  const chirp = (f = 330, end = 100, duration = .12, wave = 'triangle', gain = .08) => {
    const a = audioContext();
    if (!a) return;
    try {
      const o = a.createOscillator(),
        g = a.createGain(),
        t = a.currentTime;
      o.type = wave;
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, end), t + duration);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + .009);
      g.gain.exponentialRampToValueAtTime(.0001, t + duration);
      o.connect(g).connect(a.destination);
      o.start(t);
      o.stop(t + duration + .02);
    } catch (_) {}
  };
  state.orlaCombatSound = kind => {
    if (!enabled) return;
    if (['laser', 'plasma'].includes(kind)) chirp(1050, 165, .23, 'sawtooth', .045);else if (['shot', 'fire'].includes(kind)) chirp(210, 55, .14, 'square', .065);else if (kind === 'hit') chirp(145, 65, .105, 'triangle', .055);else if (kind === 'death') chirp(330, 48, .72, 'sawtooth', .042);else if (kind === 'resurrect') {
      chirp(320, 840, .38, 'sine', .045);
      setTimeout(() => chirp(520, 1190, .33, 'sine', .035), 110);
    } else if (kind === 'enemy') chirp(175, 88, .18, 'sawtooth', .055);else chirp(370, 115, .14, 'triangle', .055);
  };
  // Som contínuo sutil de vento/chuva/neve com ruído filtrado. Em browsers modernos
  // o contexto só é iniciado depois do primeiro gesto do usuário.
  const ensureAmbient = () => {
    const a = audioContext();
    if (!a || ambience) return;
    const buffer = a.createBuffer(1, a.sampleRate * 2, a.sampleRate),
      samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * .52;
    const source = a.createBufferSource(),
      filter = a.createBiquadFilter(),
      gain = a.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 680;
    gain.gain.value = .00001;
    source.connect(filter).connect(gain).connect(a.destination);
    source.start();
    ambience = {
      source,
      filter,
      gain
    };
  };
  const updateAmbient = () => {
    if (!enabled) {
      if (ambience) ambience.gain.gain.setTargetAtTime(.00001, ctx.currentTime, .22);
      return;
    }
    if (!ctx) return;
    ensureAmbient();
    if (!ambience) return;
    const weather = state.climate?.weather || 'clear';
    const target = weather === 'rain' ? .055 : weather === 'wind' ? .038 : weather === 'sand' ? .043 : weather === 'snow' ? .012 : 0.00001;
    ambience.filter.frequency.setTargetAtTime(weather === 'rain' ? 1900 : weather === 'sand' ? 430 : weather === 'snow' ? 400 : 850, ctx.currentTime, .45);
    ambience.gain.gain.setTargetAtTime(target, ctx.currentTime, .42);
    lastAmbient = weather;
  };
  setInterval(updateAmbient, 700);
  audio.onclick = () => {
    enabled = !enabled;
    localStorage.setItem('orla-v057-audio', enabled ? 'on' : 'off');
    syncAudio();
    if (enabled) {
      ensureAmbient();
      chirp(580, 770, .13, 'sine', .025);
    } else updateAmbient();
  };
  document.addEventListener('pointerdown', () => {
    if (enabled && ctx?.state === 'suspended') ctx.resume();
  }, {
    passive: true
  });
  state.ITEM_SPEC.reviveSerum = {
    name: 'Ampola de ressurreição',
    litres: .2
  };
  const ownsSerum = () => state.game.stores.inventory.includes('reviveSerum') || state.handItem?.type === 'reviveSerum';
  const revive = hp => {
    if (c.hp > 0) return state.toast('O viajante já está vivo.');
    c.hp = Math.max(1, Math.min(c.maxHp, hp));
    c.cooldown = 0;
    if(!state.godMode())c.corpse=null;
    c.enemy.cooldown=2;
    state.player.jump = null;
    state.player.jumpY = 0;
    state.target = null;
    state.orlaDiedAt = 0;
    state.orlaCombatSound('resurrect');
    state.toast('O viajante voltou à vida.');
    state.saveGame();
    state.renderCombat();
  };
  serum.id='useReviveSerum';
  serum.onclick = () => {
    if (c.hp > 0) return state.toast('Guarde a ampola para quando precisar.');
    if (!ownsSerum()) return state.toast('Encontre uma ampola no baú de armas da casa.');
    if (state.handItem?.type === 'reviveSerum') state.handItem = null;else state.game.stores.inventory.splice(state.game.stores.inventory.indexOf('reviveSerum'), 1);
    revive(Math.ceil(c.maxHp * .5));
    state.inventoryDraw?.();
  };
  godRaise.id='godReviveTraveler';godRaiseEnemy.id='godReviveEnemy';
  godRaise.onclick = () => state.godMode() ? revive(c.maxHp) : state.toast('Somente Deus pode ressuscitar sem item.');
  godRaiseEnemy.onclick = () => {
    if (!state.godMode()) return state.toast('Somente Deus pode ressuscitar criaturas.');
    if (c.enemy.hp > 0) return state.toast('O Rastejante já está vivo.');
    c.enemy.hp = c.enemy.maxHp;
    c.enemy.cooldown = 0;
    c.enemy.alert = false;
    // Revive the existing body at its actual world position.
    state.orlaCombatSound('resurrect');
    state.toast('A criatura foi ressuscitada.');
    state.saveGame();
    state.renderCombat();
  };
  const powers = document.getElementById('powersPanel');
  if (powers) {
    const raise = godRaise.cloneNode(true),
      raiseEnemy = godRaiseEnemy.cloneNode(true);
    raise.removeAttribute('id');raiseEnemy.removeAttribute('id');
    raise.onclick = () => godRaise.click();
    raiseEnemy.onclick = () => godRaiseEnemy.click();
    powers.append(raise, raiseEnemy);
  }
  state.refreshLifeUI = () => {
    serum.hidden = c.hp > 0 || state.godMode();
    godRaise.hidden = !state.godMode() || c.hp > 0;
    godRaiseEnemy.hidden = !state.godMode() || c.enemy.hp > 0;
    // Se o jogador estiver morto, manter o painel acessível sem cobrir o mapa.
    if (effects) effects.hidden = !state.godMode();
    requestAnimationFrame(state.refreshLifeUI);
  };
  state.refreshLifeUI();
  const oldCharacter = state.character;
  state.drawTravelerCorpse=pose=>{
      const ctx2 = state.ctx,
        u = state.scale * state.zoom,
        p = state.P(pose.x, pose.z, pose.elevation);
      const elapsed = state.orlaDiedAt ? performance.now() - state.orlaDiedAt : 1000,
        k = Math.min(1, elapsed / 700);
      ctx2.save();
      ctx2.translate(p[0], p[1] - u * .28 * (1 - k));
      ctx2.rotate(-Math.PI / 2 * k);
      ctx2.fillStyle = '#1b253380';
      ctx2.beginPath();
      ctx2.ellipse(0, u * .3, u * .49, u * .13, 0, 0, 7);
      ctx2.fill();
      ctx2.fillStyle = '#39475f';
      ctx2.fillRect(-u * .15, -u * .72, u * .3, u * .66);
      ctx2.fillStyle = '#884d63';
      ctx2.fillRect(-u * .14, -u * .49, u * .28, u * .24);
      ctx2.fillStyle = '#d3a47c';
      ctx2.beginPath();
      ctx2.arc(0, -u * .82, u * .21, 0, 7);
      ctx2.fill();
      ctx2.strokeStyle = '#465265';
      ctx2.lineWidth = u * .09;
      for (const sign of [-1, 1]) {
        ctx2.beginPath();
        ctx2.moveTo(sign * u * .07, -u * .06);
        ctx2.lineTo(sign * u * .14, u * .22);
        ctx2.stroke();
      }
      ctx2.restore();

  };
  const oldEntities=state.combatEntities;
  state.combatEntities=()=>[...oldEntities(),...(state.godMode()&&c.hp<=0&&c.corpse?[{x:c.corpse.x,z:c.corpse.z,kind:'corpse',draw:()=>state.drawTravelerCorpse(c.corpse)}]:[])];
  const oldRole=state.setRole;
  state.setRole=kind=>{
    if(c.hp<=0&&!state.godMode()&&!c.corpse)c.corpse={x:state.player.x,z:state.player.z,elevation:state.player.elevation,upper:state.secondFloor,stairs:state.onStairs};
    if(kind==='traveler'&&state.godMode()&&c.corpse){Object.assign(state.player,{x:c.corpse.x,z:c.corpse.z,elevation:c.corpse.elevation});state.secondFloor=c.corpse.upper;state.onStairs=c.corpse.stairs;if(c.hp>0)c.corpse=null;}
    oldRole(kind);
  };
  state.character = function () {
    if(c.hp<=0&&!state.godMode()){state.drawTravelerCorpse(c.corpse||state.player);return;}
    oldCharacter();
    if (state.godMode()) return;
    const fx = state.orlaAttackFX,
      now = performance.now();
    if (fx && now < fx.until) {
      const t = 1 - (fx.until - now) / 470,
        ctx2 = state.ctx,
        u = state.scale * state.zoom;
      const p = state.P(state.player.x, state.player.z, state.player.elevation + .68),
        target = state.P(fx.target.x, fx.target.z, .55);
      const vx = target[0] - p[0],
        vy = target[1] - p[1],
        a = Math.atan2(vy, vx);
      ctx2.save();
      ctx2.translate(p[0], p[1]);
      ctx2.rotate(a - .55 * Math.sin(t * Math.PI));
      const ranged = ['pistol', 'laserRifle', 'bow'].includes(fx.weapon),
        reach = ranged ? .48 : .68;
      ctx2.strokeStyle = fx.weapon === 'laserRifle' ? '#59e8ff' : '#d8d0c7';
      ctx2.lineWidth = u * (ranged ? .08 : .062);
      ctx2.lineCap = 'round';
      ctx2.shadowColor = fx.weapon === 'laserRifle' ? '#55e9ff' : '#e8bfff';
      ctx2.shadowBlur = ranged ? 5 : 9;
      ctx2.beginPath();
      ctx2.moveTo(u * .02, u * .02);
      ctx2.lineTo(u * reach, 0);
      ctx2.stroke();
      ctx2.strokeStyle = '#332e4d';
      ctx2.lineWidth = u * .12;
      ctx2.beginPath();
      ctx2.moveTo(0, u * .04);
      ctx2.lineTo(u * .18, u * .04);
      ctx2.stroke();
      ctx2.restore();
      if (!ranged) {
        ctx2.save();
        ctx2.strokeStyle = '#d8c8ff';
        ctx2.globalAlpha = (1 - t) * .65;
        ctx2.lineWidth = u * .04;
        ctx2.beginPath();
        ctx2.arc(target[0], target[1], u * .47, -2.2 + t * 1.8, -.15 + t * 1.8);
        ctx2.stroke();
        ctx2.restore();
      }
    }
    if (state.orlaHurtAt && now < state.orlaHurtAt) {
      const p = state.P(state.player.x, state.player.z, state.player.elevation + .75);
      ctx2Safe(state.ctx, p[0], p[1], state.scale * state.zoom * (state.orlaHurtAt - now) / 350);
    }
  };
  function ctx2Safe(g, x, y, r) {
    g.save();
    g.strokeStyle = '#ff6e88';
    g.globalAlpha = .6;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x, y, Math.max(1, r * .4), 0, 7);
    g.stroke();
    g.restore();
  }
  // Unificação arquitetônica: pilares de canto sem interrupção entre pavimentos.
  // Não é um substituto de malhas 3D, apenas elimina a leitura de dois volumes soltos.
  const oldUpper = state.drawUpperExterior051;
  if (typeof oldUpper === 'function') state.drawUpperExterior051 = function () {
    oldUpper();
    if (state.currentHouseWidth() < 9) return;
    const hw = state.currentHouseWidth();
    for (const [x, z] of [[0, 0], [0, 5], [hw, 0], [hw, 5]]) {
      state.line3([x, z, .04], [x, z, 5.80], '#655368', 3.8);
    }
  };
}
