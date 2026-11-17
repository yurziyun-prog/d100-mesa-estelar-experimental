import { stairPoint, stairFrame } from '../physics/stairs.js';
import { withMaterial } from '../rendering/materials.js';
import { drawUpperWalls } from '../rendering/upper-walls.js';
import { installStoreyMovement } from '../physics/storey-movement.js';
import { state } from '../core/state.js';
export
// src/construction/storeys.js
function installOrla051() {
  const rise = 2.84,
    wallX2 = 3.6;
  const stair = {
    x: 0.40,
    z: 0.65,
    w: 1.12,
    d: 3.48,
    dir: 0,
    layoutVersion: 4
  };
  try {
    const saved = JSON.parse(localStorage.getItem("orla-casa2-stair") || "{}");
    if (saved && saved.layoutVersion === 4) Object.assign(stair, saved);
  } catch (_) {}
  const savedArchitecture = state.savedArchitecture || {};
  if (savedArchitecture.stair?.layoutVersion === 4) {
    const a = savedArchitecture.stair;
    if (["x", "z", "w", "d"].every(k => Number.isFinite(a[k])) && a.w > 0.5 && a.d > 0.5 && a.x >= 0.3 && a.z >= 0.3 && a.x + a.w < 9.8 && a.z + a.d < 4.8) Object.assign(stair, a);
  }
  state.stairArea = stair;
  try {
    state.constructionPreferences = {
      material: "wood",
      tint: "#b7a58a",
      ...JSON.parse(localStorage.getItem("orla-build-prefs") || "{}")
    };
  } catch (_) {
    state.constructionPreferences = {
      material: "wood",
      tint: "#b7a58a"
    };
  }
  try {
    state.houseFinish = JSON.parse(localStorage.getItem("orla-casa2-finish") || "null") || null;
  } catch (_) {
    state.houseFinish = null;
  }
  try {
    state.baseFloorFinish = JSON.parse(localStorage.getItem("orla-casa2-floor-finish") || "null") || null;
  } catch (_) {
    state.baseFloorFinish = null;
  }
  for (const k of ["constructionPreferences", "houseFinish", "baseFloorFinish"]) if (savedArchitecture[k]) state[k] = savedArchitecture[k];
  state.secondFloor = !!state.savedStorey?.upper && state.inside(state.player.x, state.player.z);
  state.onStairs = !!state.savedStorey?.stairs && state.inside(state.player.x, state.player.z);
  if (state.secondFloor) state.player.elevation = rise;
  state.fatigue = state.maxFatigue = Math.max(35, state.SHEETS.traveler.CON * 8);
  const fatigue = document.getElementById("orlaFatigue");
  const fatigueText = document.getElementById("orlaFatigueValue");
  const fatigueBar = document.getElementById("orlaFatigueBar");
  const popupIds = ["climate", "inventory", "equipment", "sheet", "appearancePanel", "powersPanel", "interaction"];
  const buttonToPanel = {
    climateBtn: "climate",
    inventoryBtn: "inventory",
    equipmentBtn: "equipment",
    sheetBtn: "sheet",
    appearanceBtn: "appearancePanel",
    powersBtn: "powersPanel"
  };
  const positionPanels = () => {
    const h = document.getElementById("top").getBoundingClientRect();
    document.documentElement.style.setProperty("--orla-panel-top", Math.max(58, Math.ceil(h.bottom) + 8) + "px");
  };
  positionPanels();
  window.addEventListener("resize", positionPanels);
  if (typeof ResizeObserver === "function") new ResizeObserver(positionPanels).observe(document.getElementById("top"));
  document.addEventListener("pointerdown", e => {
    const b = e.target.closest?.("button");
    const panel = e.target.closest?.("#" + popupIds.join(",#"));
    if (panel) return;
    const keep = b ? buttonToPanel[b.id] : null;
    for (const id of popupIds) if (id !== keep) document.getElementById(id)?.classList.remove("open");
  }, true);
  const onRamp = (x, z) => x >= stair.x - 0.17 && x <= stair.x + stair.w + 0.17 && z >= stair.z - 0.06 && z <= stair.z + stair.d + 0.22;
  const progress = (x, z) => [(stair.z + stair.d - z) / stair.d, (x - stair.x) / stair.w, (z - stair.z) / stair.d, (stair.x + stair.w - x) / stair.w][(stair.dir || 0) % 4];
  const rampY = (x, z) => Math.max(0, Math.min(rise, progress(x, z) * rise));
  const bottomPoint = () => stair.dir === 0 ? [stair.x + stair.w / 2, stair.z + stair.d] : stair.dir === 1 ? [stair.x, stair.z + stair.d / 2] : stair.dir === 2 ? [stair.x + stair.w / 2, stair.z] : [stair.x + stair.w, stair.z + stair.d / 2];
  const topPoint = () => stair.dir === 0 ? [stair.x + stair.w / 2, stair.z] : stair.dir === 1 ? [stair.x + stair.w, stair.z + stair.d / 2] : stair.dir === 2 ? [stair.x + stair.w / 2, stair.z + stair.d] : [stair.x, stair.z + stair.d / 2];
  const oldRender = state.drawInnerScene;
  installStoreyMovement(stair);
  const oldWorldAt = state.worldAt;
  state.worldAt = (mx, my) => oldWorldAt(mx, my + ((state.secondFloor || state.onStairs) && !state.editMode ? state.player.elevation * state.scale * state.zoom : 0));
  function drawStair() {
    const count = 15,
      tread = (stair.dir || 0) % 2 === 1 ? stair.w / count : stair.d / count;
    for (let i = 0; i < count; i++) {
      const top = (i + 1) / count * rise,
        th = Math.max(0.12, rise / count * 0.9);
      const horizontal = (stair.dir || 0) % 2 === 1;
      const reversed = (stair.dir || 0) === 0 || (stair.dir || 0) === 3;
      if (horizontal) {
        const x = reversed ? stair.x + stair.w - (i + 1) * stair.w / count : stair.x + i * stair.w / count;
        state.box3(x, stair.z, stair.w / count + 0.01, stair.d, th, ["#6f4e34", "#966d49", "#cca06a"], top - th);
      } else {
        const z = reversed ? stair.z + stair.d - (i + 1) * stair.d / count : stair.z + i * tread;
        state.box3(stair.x, z, stair.w, tread + 0.01, th, ["#6f4e34", "#966d49", "#cca06a"], top - th);
      }
    }
    const [bx, bz] = bottomPoint(),
      [tx, tz] = topPoint();
    const offset = (stair.dir || 0) % 2 === 1 ? [0, stair.d * 0.49] : [stair.w * 0.49, 0];
    for (const sign of [-1, 1]) {
      const dx = offset[0] * sign,
        dz = offset[1] * sign;
      state.line3([bx + dx, bz + dz, 0.9], [tx + dx, tz + dz, rise + 0.9], "#e5d0b1", 2.8);
      state.line3([bx + dx, bz + dz, 0.2], [tx + dx, tz + dz, rise + 0.2], "#936f51", 2.2);
    }
  }
  function upperFloor() {
    const hw = state.currentHouseWidth();
    const proj = state.P;
    const at = fn => {
      state.P = (x, z, y = 0) => proj(x, z, y + rise);
      try {
        fn();
      } finally {
        state.P = proj;
      }
    };
    at(() => {
      const x1 = stair.x - 0.09,
        x2 = stair.x + stair.w + 0.09,
        z1 = stair.z - 0.03,
        z2 = stair.z + stair.d + 0.05;
      const wood = "#977049";
      for (const [x, z, w, d] of [[0.1, 0.1, x1 - 0.1, 4.8], [x2, 0.1, hw - x2 - 0.1, 4.8], [x1, 0.1, x2 - x1, z1 - 0.1], [x1, z2, x2 - x1, 4.9 - z2]]) {
        if (w > 0.03 && d > 0.03) {
          withMaterial(state.baseFloorFinish?.material || "wood", () => state.rectFloor(x, z, w, d, state.baseFloorFinish?.color || wood));
          for (let row = z + 0.22; row < z + d; row += 0.28) state.line3([x, row, 0.02], [x + w, row, 0.02], "#674d36", 1);
        }
      }
      const frame = stairFrame(stair, stair.x, stair.z),
        rail = (u1, v1, u2, v2) => {
          const a = stairPoint(stair, u1, v1),
            b = stairPoint(stair, u2, v2);
          state.quad3([...a, 0], [...b, 0], [...b, 0.73], [...a, 0.73], "#d7b68a", "#a08562");
        };
      if (!stair.dir) {
        state.wallX(x1, z1, z2, 0.73, "#d7b68a");
        state.wallX(x2, z1, z2, 0.73, "#d7b68a");
        state.wallZ(z2, x1, x2, 0.7, "#d7b68a");
      } else {
        rail(-0.09, -0.03, -0.09, frame.length);
        rail(frame.width + 0.09, -0.03, frame.width + 0.09, frame.length);
        rail(-0.09, -0.03, frame.width + 0.09, -0.03);
      }
    });
  }
  state.drawInnerScene = () => {
    if (state.houseContext) return oldRender();
    if (state.secondFloor) {
      const savedX = state.player.x,
        savedZ = state.player.z;
      state.player.x = -90;
      state.player.z = -90;
      try {
        // O piso inferior permanece fechado por fachadas opacas, sem exibir os móveis por baixo.
        state.drawOuterShell();
      } finally {
        state.player.x = savedX;
        state.player.z = savedZ;
      }
      upperFloor();
      drawUpperWalls(true);
      state.drawExternalChimney();
      state.character();
    } else {
      oldRender();
      drawStair();
      if (state.onStairs || onRamp(state.player.x, state.player.z)) state.character();
    }
  };
  const previousEditPlace = state.editPlaceAt;
  state.editPlaceAt = (mx, my) => {
    if (state.editPlacing?.kind === "moveBaseStair") {
      const p = state.worldAt(mx, my);
      if (p.x - stair.w / 2 < 0.20 || p.x + stair.w / 2 > state.currentHouseWidth() - 0.12 || p.z - stair.d / 2 < 0.16 || p.z + stair.d / 2 > 4.82) {
        state.toast("Escada fora dos limites.");
        return true;
      }
      stair.x = p.x - stair.w / 2;
      stair.z = p.z - stair.d / 2;
      state.editPlacing = null;
      localStorage.setItem("orla-casa2-stair", JSON.stringify(stair));
      state.saveGame();
      state.renderEditor();
      state.toast("Escada realocada.");
      return true;
    }
    return previousEditPlace(mx, my);
  };
  const oldEditor = state.renderEditor;
  let editorCategory = "Estrutura";
  const categories = ["Estrutura", "Aberturas", "M\xF3veis", "Mundo", "A\xE7\xF5es"];
  function categoryFor(label) {
    if (/Parede|Escada|Piso|Telhado|Casa/i.test(label)) return "Estrutura";
    if (/Porta|Janela/i.test(label)) return "Aberturas";
    if (/Mesa|Cama|Baú|Estante|Lâmpada|Cadeira|Barril|Armário/i.test(label)) return "M\xF3veis";
    if (/Árvore|Arbusto|Pedra/i.test(label)) return "Mundo";
    return "A\xE7\xF5es";
  }
  state.renderEditor = () => {
    oldEditor();
    document.body.classList.toggle("orla-editor", !!state.editMode);
    if (!state.editMode || !state.godMode()) return;
    const bar = state.editorActions;
    state.editorButton("\u2725 Mover escada da Casa 2", () => {
      state.editPlacing = {
        kind: "moveBaseStair"
      };
      state.toast("Clique no local para mover a escada. Esc cancela.");
    });
    state.editorButton("\u27F3 Girar escada 90\xB0", () => {
      const cx = stair.x + stair.w / 2,
        cz = stair.z + stair.d / 2;
      [stair.w, stair.d] = [stair.d, stair.w];
      stair.x = cx - stair.w / 2;
      stair.z = cz - stair.d / 2;
      stair.dir = ((stair.dir || 0) + 1) % 4;
      localStorage.setItem("orla-casa2-stair", JSON.stringify(stair));
      state.saveGame();
      state.renderEditor();
    });
    const buttons = Array.from(bar.querySelectorAll(":scope > button"));
    const tabs = document.createElement("div");
    tabs.id = "orlaEditorGroups";
    const contents = document.createElement("div");
    contents.id = "orlaEditorContents";
    for (const label of categories) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.classList.toggle("selected", label === editorCategory);
      b.onclick = () => {
        editorCategory = label;
        state.renderEditor();
      };
      tabs.append(b);
    }
    for (const b of buttons) if (categoryFor(b.textContent) === editorCategory) contents.append(b);
    const panels = Array.from(bar.children).filter(n => n.tagName !== "BUTTON");
    const common = buttons.filter(b => /Desfazer|Refazer|Girar 90|Remover|Mover selecionado/.test(b.textContent));
    bar.replaceChildren(tabs, contents, ...common, ...panels);
  };
  const hearth = state.chimneyObject;
  const closeToHearth = () => state.inside(state.player.x, state.player.z) && Math.hypot(state.player.x - (hearth.x + 0.18), state.player.z - (hearth.z + 0.4)) < 2.15;
  const hearthAction = () => {
    if (!closeToHearth()) return state.toast("Aproxime-se da lareira.");
    const f = state.game.fireplace;
    const inv = state.game.stores.inventory;
    const consumeWood = () => {
      if (state.handItem?.type === "wood") {
        state.handItem = null;
        return true;
      }
      const i = inv.indexOf("wood");
      if (i < 0) return false;
      inv.splice(i, 1);
      return true;
    };
    if (!f.lit) {
      if (f.wood < 1) {
        if (!consumeWood()) return state.toast("\xC9 preciso ter madeira na mochila ou na m\xE3o para acender a lareira.");
        f.wood = 1;
        f.burn = 42;
      }
      f.lit = true;
      state.toast("A lareira est\xE1 acesa. Restam " + f.wood + " por\xE7\xF5es de madeira.");
    } else if (state.handItem?.type === "wood" || inv.includes("wood")) {
      consumeWood();
      f.wood++;
      f.burn += 42;
      state.toast("Voc\xEA alimentou o fogo. Madeira: " + f.wood + ".");
    } else {
      f.lit = false;
      state.toast("Voc\xEA apagou a lareira.");
    }
    state.inventoryDraw();
    state.saveGame();
  };
  document.addEventListener("contextmenu", e => {
    if (e.target?.id !== "game" || !closeToHearth() || state.editMode) return;
    const mx = e.clientX,
      my = e.clientY;
    const at = state.P(hearth.x + 0.21, hearth.z + 0.45, 0.9);
    if (Math.hypot(mx - at[0], my - at[1]) > Math.max(80, state.scale * state.zoom * 1.4)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    hearthAction();
  }, true);
  document.addEventListener("keydown", e => {
    if (e.key.toLowerCase() === "e" && !e.repeat && !state.editMode && !e.target.closest?.("input,textarea,select") && closeToHearth()) {
      e.stopImmediatePropagation();
      e.preventDefault();
      hearthAction();
    }
  }, true);
  function status() {
    document.body.classList.toggle("orla-god", state.godMode());
    document.body.classList.toggle("orla-editor", !!state.editMode);
    fatigue.style.display = state.godMode() || state.editMode ? "none" : "";
    if (!state.godMode()) {
      const v = Math.max(0, Math.round(state.fatigue || 0));
      fatigueText.textContent = `${v}/${state.maxFatigue}`;
      fatigueBar.max = state.maxFatigue;
      fatigueBar.value = v;
    }
    requestAnimationFrame(status);
  }
  status();
  state.renderEditor();
  state.__orla051 = {
    stair,
    hearthAction,
    categoryFor,
    upperFloor,
    drawStair
  };
}

// src/rendering/furniture.js
