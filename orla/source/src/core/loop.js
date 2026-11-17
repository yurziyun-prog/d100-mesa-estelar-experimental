import {movementProfile} from '../physics/motion.js';
// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';
export function turnCamera(delta) {
  runtime.cameraGoal += delta;
  runtime.target = null;
}
export function tick(t) {
  let dt = Math.min(0.05, (t - runtime.last) / 1e3 || 0);
  runtime.last = t;
  if (!runtime.godMode() && !runtime.sprinting) runtime.fatigue = Math.min(runtime.maxFatigue || 100, (runtime.fatigue || 0) + dt * 2.15);
  if (runtime.godMode()) runtime.fatigue = runtime.maxFatigue || 100;
  runtime.sprinting = false;
  const angleDiff = runtime.cameraGoal - runtime.cameraYaw;
  runtime.cameraYaw += angleDiff * Math.min(1, dt * 9);
  if (Math.abs(runtime.cameraGoal - runtime.cameraYaw) < 8e-5) runtime.cameraYaw = runtime.cameraGoal;
  runtime.walking = false;
  runtime.doorSwing += (Number(runtime.game.door.open) - runtime.doorSwing) * Math.min(1, dt * 3.1);
  if (runtime.game.fireplace.lit && runtime.game.fireplace.wood > 0) {
    runtime.game.fireplace.burn = (runtime.game.fireplace.burn || 0) - dt;
    if (runtime.game.fireplace.burn <= 0) {
      runtime.game.fireplace.wood = Math.max(0, (runtime.game.fireplace.wood || 0) - 1);
      if (runtime.game.fireplace.wood > 0) runtime.game.fireplace.burn += 42;else {
        runtime.game.fireplace.lit = false;
        runtime.game.fireplace.burn = 0;
        runtime.toast("A lareira apagou quando a lenha acabou.");
      }
    }
  } else if (runtime.game.fireplace.wood > 0 && runtime.game.fireplace.burn <= 0) {
    runtime.game.fireplace.burn = 42;
  }
  if (Math.abs(runtime.doorSwing - Number(runtime.game.door.open)) < 2e-3) runtime.doorSwing = Number(runtime.game.door.open);
  if (!runtime.helpOpen && (runtime.godMode() || !runtime.combat || runtime.combat.hp > 0)) {
    if (runtime.player.jump) runtime.tickJump(dt);else {
      let sx = 0,
        sy = 0;
      if (runtime.keys.has("w") || runtime.keys.has("arrowup")) sy -= 1;
      if (runtime.keys.has("s") || runtime.keys.has("arrowdown")) sy += 1;
      if (runtime.keys.has("a") || runtime.keys.has("arrowleft")) sx -= 1;
      if (runtime.keys.has("d") || runtime.keys.has("arrowright")) sx += 1;
      if (sx || sy) {
        runtime.target = null;
        const [dx, dz] = runtime.unrotate(sx + sy, sy - sx);
        runtime.move(dx, dz, dt);
      } else if (runtime.target) {
        const vx = runtime.target.x - runtime.player.x,
          vz = runtime.target.z - runtime.player.z;
        const dist = Math.hypot(vx, vz);
        const step = movementProfile().speed * dt;
        if (dist <= Math.max(0.08, step * 0.95)) {
          if (runtime.canWalk(runtime.target.x, runtime.target.z)) {
            runtime.player.x = runtime.target.x;
            runtime.player.z = runtime.target.z;
            runtime.player.elevation = runtime.supportHeight(runtime.player.x, runtime.player.z);
          }
          runtime.target = null;
        } else {
          const px = runtime.player.x,
            pz = runtime.player.z;
          runtime.move(vx, vz, Math.min(dt,dist/movementProfile().speed));
          if (Math.hypot(px - runtime.player.x, pz - runtime.player.z) < 1e-5 || Math.hypot(runtime.target.x - runtime.player.x, runtime.target.z - runtime.player.z) > dist + 1e-3) runtime.target = null;
        }
      }
    }
  }
  runtime.rescueFromOverlap();
  if (!runtime.player.jump) runtime.player.elevation = runtime.supportHeight(runtime.player.x, runtime.player.z);
  if (t - runtime.lastPositionSaveAt > 1e4 && Math.hypot(runtime.player.x - runtime.lastSavedPosition.x, runtime.player.z - runtime.lastSavedPosition.z) > 0.22) {
    runtime.lastPositionSaveAt = t;
    runtime.lastSavedPosition = {
      x: runtime.player.x,
      z: runtime.player.z
    };
    runtime.saveGame();
  }
  if (runtime.dialogOrigin && Math.hypot(runtime.player.x - runtime.dialogOrigin.x, runtime.player.z - runtime.dialogOrigin.z) > 1.45) runtime.closeDialog();
  if (runtime.game.pending) {
    const kind = runtime.game.pending;
    const at = kind === "door" ? runtime.inside(runtime.player.x, runtime.player.z) ? {
      x: 3.64,
      z: 4.48
    } : {
      x: 3.64,
      z: 5.66
    } : kind === "house" ? runtime.game.groundKeys.house : kind === "chest" ? {
      x: runtime.chestPos().x,
      z: runtime.chestPos().z + 0.64
    } : runtime.game.groundKeys.chest;
    if (Math.hypot(runtime.player.x - at.x, runtime.player.z - at.z) < 0.85) {
      runtime.game.pending = null;
      runtime.target = null;
      ({
        door: () => runtime.quickDoorAction(!!runtime.game.pendingLockMode),
        house: () => runtime.pickKey("house"),
        chest: () => runtime.quickChestAction(!!runtime.game.pendingLockMode),
        chestKey: () => runtime.pickKey("chest")
      })[kind]();
      runtime.game.pendingLockMode = false;
    } else if (!runtime.target) {
      runtime.game.pending = null;
    }
  }
  runtime.player.walkBlend += (Number(runtime.walking) - runtime.player.walkBlend) * Math.min(1, dt * 12);
  const follow = Math.min(1, dt * 7);
  runtime.camX += (runtime.player.x - runtime.camX) * follow;
  runtime.camZ += (runtime.player.z - runtime.camZ) * follow;
  runtime.combatTick?.(dt);
  runtime.draw();
  runtime.refreshVisuals(dt);
  requestAnimationFrame(runtime.tick);
}

// src/objects/interactions.js
