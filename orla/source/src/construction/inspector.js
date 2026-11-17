import { state as s } from '../core/state.js';
import { COMPONENTS, createComponent, updateComponent } from './components.js';
import { isFurnitureInstance } from '../rendering/furniture.js';
import { captureHouseInstance, downloadHouseInstance } from './house-export.js';
const clone = value => JSON.parse(JSON.stringify(value));
const past = [],
  future = [];
const snapshot = () => clone({
  fixed: s.fixedSolids,
  moving: s.pushables,
  decor: s.editDecor,
  addedWindows: s.game.addedWindows || []
});
let transactionDepth = 0;
function restore(value) {
  for (const [list, saved] of [[s.fixedSolids, value.fixed], [s.pushables, value.moving]]) list.forEach((o, i) => {
    for (const key of Object.keys(o)) delete o[key];
    Object.assign(o, saved[i]);
  });
  s.editDecor.splice(0, s.editDecor.length, ...clone(value.decor));
  s.selected = null;
  s.editPlacing = null;
  s.saveGame();
  s.renderEditor();
  s.game.addedWindows = clone(value.addedWindows || []);
  s.saveGame();
}
export function sceneTransaction(action) {
  if (transactionDepth) return action();
  const before = snapshot();
  transactionDepth++;
  try {
    const result = action();
    if (JSON.stringify(before) !== JSON.stringify(snapshot())) {
      past.push(before);
      if (past.length > 40) past.shift();
      future.length = 0;
    }
    return result;
  } finally {
    transactionDepth--;
  }
}
export function undoScene() {
  if (!s.godMode() || !past.length) return;
  future.push(snapshot());
  restore(past.pop());
}
export function redoScene() {
  if (!s.godMode() || !future.length) return;
  past.push(snapshot());
  restore(future.pop());
}
// src/rendering/furniture.js

function inspector() {
  document.getElementById("orlaMaterialPalette")?.remove();
  document.getElementById("componentInspector")?.remove();
  if (!s.editMode || !s.godMode()) return;
  s.editorButton("\u21B6 Desfazer", undoScene);
  s.editorButton("\u21B7 Refazer", redoScene);
  s.editorButton("Exportar Casa 2 base", () => downloadHouseInstance());
  if (["house1", "house2"].includes(s.selected?.kind)) s.editorButton("Exportar casa selecionada", () => downloadHouseInstance(s.selected));
  for (const [kind, spec] of Object.entries(COMPONENTS)) s.editorButton("+ " + spec.name, () => {
    s.editPlacing = {
      kind: "component",
      item: kind
    };
    s.toast("Clique no terreno para adicionar " + spec.name.toLowerCase() + ". Esc cancela.");
  });
  // O material escolhido vale para a proxima peca, nao apenas para um objeto ja selecionado.
  const materials = [['wood', 'Madeira'], ['plaster', 'Reboco'], ['stone', 'Pedra'], ['metal', 'Metal'], ['brick', 'Tijolos'], ['ceramic', 'Ceramica'], ['concrete', 'Concreto']];
  s.constructionPreferences ||= {
    material: 'wood',
    tint: '#b7a58a'
  };
  const defaults = document.createElement('div');
  defaults.id = 'orlaMaterialPalette';
  const title = document.createElement('strong');
  title.textContent = 'Material das novas pecas';
  defaults.append(title);
  const choice = document.createElement('select');
  choice.title = 'Material das novas construcoes';
  for (const [value, name] of materials) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = name;
    choice.append(opt);
  }
  choice.value = s.constructionPreferences.material;
  const pick = document.createElement('input');
  pick.type = 'color';
  pick.title = 'Cor das novas construcoes';
  pick.value = s.constructionPreferences.tint;
  choice.addEventListener('change', () => {
    s.constructionPreferences.material = choice.value;
    (() => {
      try {
        localStorage.setItem('orla-build-prefs', JSON.stringify(s.constructionPreferences));
      } catch (_) {}
    })();
  });
  pick.addEventListener('input', () => {
    s.constructionPreferences.tint = pick.value;
    (() => {
      try {
        localStorage.setItem('orla-build-prefs', JSON.stringify(s.constructionPreferences));
      } catch (_) {}
    })();
  });
  const applySelected = document.createElement('button');
  applySelected.textContent = 'Aplicar em selecionado';
  applySelected.type = 'button';
  applySelected.onclick = () => {
    if (s.selected?.component) {
      sceneTransaction(() => updateComponent(s.selected, {
        material: choice.value,
        tint: pick.value
      }));
      s.saveGame();
      s.renderEditor();
    } else s.toast('Selecione uma parede, piso ou teto modular para aplicar.');
  };
  const base = document.createElement('button');
  base.type = 'button';
  base.textContent = 'Pintar paredes da Casa 2';
  base.onclick = () => {
    const colors = {
      wood: '#b68f68',
      plaster: '#e6d3b1',
      stone: '#a2a396',
      metal: '#8aa3a9',
      brick: '#b77b62',
      ceramic: '#c6dadb',
      concrete: '#aab3ae'
    };
    s.houseFinish = {
      material: choice.value,
      color: pick.value === '#b7a58a' ? colors[choice.value] : pick.value
    };
    try {
      localStorage.setItem('orla-casa2-finish', JSON.stringify(s.houseFinish));
    } catch (_) {}
    ;
    s.saveGame();
    s.toast('Paredes externas da Casa 2 atualizadas.');
  };
  const baseFloor = document.createElement('button');
  baseFloor.type = 'button';
  baseFloor.textContent = 'Pintar piso da Casa 2';
  baseFloor.onclick = () => {
    const colors = {
      wood: '#94683e',
      plaster: '#bfb39c',
      stone: '#898b80',
      metal: '#667e81',
      brick: '#a3654c',
      ceramic: '#87abb6',
      concrete: '#888e8c'
    };
    s.baseFloorFinish = {
      material: choice.value,
      color: pick.value === '#b7a58a' ? colors[choice.value] : pick.value
    };
    try {
      localStorage.setItem('orla-casa2-floor-finish', JSON.stringify(s.baseFloorFinish));
    } catch (_) {}
    ;
    s.saveGame();
    s.toast('Piso da Casa 2 atualizado.');
  };
  defaults.append(choice, pick, applySelected, base, baseFloor);
  s.editor.append(defaults);
  const o = s.selected;
  if (!o?.component && !isFurnitureInstance(o)) return;
  const form = document.createElement("form");
  form.id = "componentInspector";
  const fields = {};
  for (const [key, label2] of [["x", "X"], ["z", "Z"], ["w", "Largura"], ["d", "Profundidade"], ["h", "Altura"], ["baseY", "Eleva\xE7\xE3o"]]) {
    const el = document.createElement("label");
    el.textContent = label2 + " (m)";
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.value = o[key] || 0;
    input.name = key;
    input.required = true;
    fields[key] = input;
    el.append(input);
    form.append(el);
  }
  const label = document.createElement("label");
  label.textContent = "Material";
  const material = document.createElement("select");
  material.name = "material";
  for (const [value, title] of [["wood", "Madeira"], ["plaster", "Reboco"], ["stone", "Pedra"], ["metal", "Liga met\xE1lica"], ["brick", "Tijolos"], ["ceramic", "Cerâmica"], ["concrete", "Concreto"]]) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = title;
    material.append(opt);
  }
  material.value = o.material;
  label.append(material);
  form.append(label);
  if (!o.material) material.value = "wood";
  const colorLabel = document.createElement("label");
  colorLabel.textContent = "Cor";
  const tint = document.createElement("input");
  tint.type = "color";
  tint.name = "tint";
  tint.value = o.tint || "#b7a58a";
  colorLabel.append(tint);
  form.append(colorLabel);
  const apply = document.createElement("button");
  apply.textContent = "Aplicar propriedades";
  apply.type = "submit";
  form.append(apply);
  form.onsubmit = e => {
    e.preventDefault();
    const patch = Object.fromEntries(Object.entries(fields).map(([k, input]) => [k, Number(input.value)]));
    patch.material = material.value;
    patch.tint = tint.value;
    try {
      sceneTransaction(() => updateComponent(o, patch));
      s.saveGame();
      s.renderEditor();
    } catch (error) {
      s.toast(error.message);
    }
  };
  s.editor.append(form);
}

// src/rendering/components.js
export function installConstructionInspector() {
  const render = s.renderEditor;
  s.renderEditor = () => {
    render();
    inspector();
  };
  const select = s.selectAt;
  s.selectAt = (mx, my) => {
    if (s.godMode()) {
      const hit = [...s.editDecor].reverse().find(o => o.component && !o.hidden && s.screenHitsFurniture({
        ...o,
        h: o.h + (o.baseY || 0)
      }, mx, my));
      if (hit) {
        s.selected = hit;
        s.renderEditor();
        return true;
      }
    }
    return select(mx, my);
  };
  const place = s.editPlaceAt;
  s.editPlaceAt = (mx, my) => sceneTransaction(() => {
    if (s.editPlacing?.kind === 'component') {
      if (!s.godMode()) return false;
      const p = s.worldAt(mx, my),
        o = createComponent(s.editPlacing.item, p.x, p.z, crypto.randomUUID());
      s.editDecor.push(o);
      s.selected = o;
      s.editPlacing = null;
      s.saveGame();
      s.renderEditor();
      return true;
    }
    return place(mx, my);
  });
  for (const name of ['editRotate', 'editRemove']) {
    const action = s[name];
    s[name] = (...args) => sceneTransaction(() => {
      if (name === 'editRotate' && ['house1', 'house2'].includes(s.selected?.kind)) return s.toast('Rotação de casas completas depende da transformação das colisões.');
      if (name === 'editRotate' && s.selected && !s.selected.component && (isFurnitureInstance(s.selected) || s.selected.label) && s.godMode()) {
        const o = s.selected;
        o.angle = ((Number.isFinite(o.angle) ? o.angle : (o.rot || 0) * 90) + args[0] + 360) % 360;
        s.saveGame();
        s.renderEditor();
        return true;
      }
      return action(...args);
    });
  }
  s.undoScene = undoScene;
  s.redoScene = redoScene;
  s.captureHouseInstance = captureHouseInstance;
}
