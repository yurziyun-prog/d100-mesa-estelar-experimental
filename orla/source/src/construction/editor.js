// Extracted from the preserved v0.45 reference; shared state is explicit.
import { state as runtime } from '../core/state.js';

export function initialize083() {
  runtime.editor = document.getElementById('editor');
  runtime.editorActions = document.getElementById('editorActions');
  runtime.editorStatus = document.getElementById('editorStatus');
}
export function editorButton(label, fn, active = false) {
  const b = document.createElement('button');
  b.textContent = label;
  if (active) b.className = 'selected';
  b.onclick = fn;
  runtime.editorActions.append(b);
}
export function toggleEditor(force) {
  runtime.editMode = force ?? !runtime.editMode;
  runtime.editor.classList.toggle('open', runtime.editMode);
  document.getElementById('editBtn').textContent = runtime.editMode ? '✎ Jogar (Tab)' : '✎ Editar';
  runtime.editPlacing = null;
  runtime.target = null;
  runtime.renderEditor();
}
export function editorObjectName(o) {
  return o?.label || o?.kind || 'nada';
}
export function canEditSelected(o) {
  if (!o) return false;
  if (runtime.role === 'god') return true;
  if (o.kind) return false;
  return !!o.movable && (o.mass || 0) <= runtime.kgLoad() && runtime.canReachObject(o);
}
export function canRotateSelected(o) {
  return !!o && (runtime.role === 'god' || !o.kind && o.movable && runtime.canRotateObject(o) && runtime.canReachObject(o, 1.45));
}
export function selectAt(mx, my) {
  const o = runtime.objectAtScreen(mx, my);
  if (o) {
    runtime.selected = o;
    runtime.renderEditor();
    return true;
  }
  const p = runtime.worldAt(mx, my);
  if (runtime.role === 'god') {
    for (const [group, kind] of [[runtime.foliage, 'tree'], [runtime.shrubs, 'shrub']]) {
      const t = group.find(q => Math.hypot(q[0] - p.x, q[1] - p.z) < .55);
      if (t) {
        runtime.selected = {
          kind,
          x: t[0],
          z: t[1],
          w: .4,
          d: .4,
          h: kind === 'tree' ? 2.3 : .5,
          mass: 100,
          original: {
            group,
            entry: t
          }
        };
        runtime.renderEditor();
        return true;
      }
    }
  }
  const dec = [...runtime.editDecor].reverse().find(o => Math.hypot(p.x - o.x - (o.w || 0) / 2, p.z - o.z - (o.d || 0) / 2) < Math.max(.6, o.w || 0));
  if (dec) {
    runtime.selected = dec;
    runtime.renderEditor();
    return true;
  }
  return false;
}
export function renderEditor() {
  runtime.editorActions.replaceChildren();
  if (!runtime.editMode) return;
  const name = runtime.editorObjectName(runtime.selected);
  runtime.editorStatus.textContent = (runtime.role === 'god' ? '☁ Deus' : '🧙 Viajante') + ' · selecionado: ' + name + ' · Clique num objeto, depois escolha uma ação.';
  if (runtime.selected) {
    runtime.editorButton('↻ Girar 90°', () => runtime.editRotate(90));
    runtime.editorButton('↺ Girar −90°', () => runtime.editRotate(-90));
    runtime.editorButton('✥ Mover', () => {
      if (!runtime.canEditSelected(runtime.selected)) return runtime.toast('Fora de alcance ou acima da sua capacidade.');
      runtime.editPlacing = {
        kind: 'move'
      };
      runtime.toast('Clique onde deseja colocar.');
    });
    if (!runtime.selected.kind && runtime.selected.movable) runtime.editorButton('⇥ Encostar à parede', () => {
      if (runtime.role !== 'god' && !runtime.canRotateSelected(runtime.selected)) return runtime.toast('Aproxime-se do móvel.');
      runtime.encostarParede(runtime.selected);
      runtime.renderEditor();
    });
    if (runtime.godMode() && runtime.selected.kind === 'chest') runtime.editorButton('💰 Colocar tesouro', () => {
      runtime.selected.contents = runtime.selected.contents || [];
      runtime.selected.contents.push('treasure');
      runtime.saveGame();
      runtime.toast('Tesouro colocado neste baú (independente).');
    });
    runtime.editorButton('✕ Remover', () => runtime.editRemove());
  }
  if (runtime.role === 'god') for (const [kind, label] of [['tree', '+ Árvore'], ['shrub', '+ Arbusto'], ['stone', '+ Pedra'], ['house2', '+ Casa 2'], ['house1', '+ Casa 1'], ['table', '+ Mesa'], ['chair', '+ Cadeira'], ['bed', '+ Cama'], ['chest', '+ Baú'], ['shelf', '+ Estante'], ['barrel', '+ Barril'], ['lamp', '+ Lâmpada']]) runtime.editorButton(label, () => {
    runtime.editPlacing = {
      kind: 'create',
      item: kind
    };
    runtime.toast('Clique no chão para criar ' + label.slice(2).toLowerCase() + '.');
  });
  if (runtime.godMode()) {
    // Poderes de criação ficam no painel 👁 Poderes.
    // Teleporte fica concentrado no painel de poderes.
  }
  runtime.editorButton('💾 Salvar', () => {
    runtime.saveGame();
    try {
      localStorage.setItem('orla-blueprint-casa-1', JSON.stringify(runtime.houseModels.house1));
      localStorage.setItem('orla-blueprint-casa-2', JSON.stringify(runtime.houseModels.house2));
    } catch (_) {}
    runtime.toast('Cenário salvo. Modelos e instâncias independentes.');
  });
  runtime.editorButton('🎮 Jogar (Tab)', () => runtime.toggleEditor(false));
}
export function editRotate(degrees) {
  if (!runtime.canRotateSelected(runtime.selected)) return runtime.toast('Aproxime-se do móvel para girá-lo.');
  if (runtime.role === 'god') {
    const o = runtime.selected;
    if (!o) return;
    const cx = o.x + o.w / 2,
      cz = o.z + o.d / 2;
    if (Math.abs(degrees / 90) % 2 === 1) {
      const w = o.w;
      o.w = o.d;
      o.d = w;
    }
    o.x = cx - o.w / 2;
    o.z = cz - o.d / 2;
    o.rot = ((o.rot || 0) + degrees / 90 + 400) % 4;
    runtime.saveGame();
    runtime.renderEditor();
    runtime.toast('Objeto girado ' + degrees + '°.');
    return;
  }
  if (runtime.rotateObjectBy(runtime.selected, degrees)) runtime.renderEditor();
}
export function editRemove() {
  if (!runtime.canEditSelected(runtime.selected)) return runtime.toast('Sem permissão para remover este objeto.');
  if (runtime.selected.kind) {
    if (runtime.selected.original) {
      runtime.selected.original.group.splice(runtime.selected.original.group.indexOf(runtime.selected.original.entry), 1);
    } else runtime.editDecor.splice(runtime.editDecor.indexOf(runtime.selected), 1);
  } else if (runtime.role === 'god') {
    runtime.selected.hidden = true;
  } else {
    runtime.toast('Para recolher itens, arraste-os para a mochila.');
    return;
  }
  runtime.selected = null;
  runtime.saveGame();
  runtime.renderEditor();
}
export function editPlaceAt(mx, my) {
  const p = runtime.worldAt(mx, my);
  if (!runtime.editPlacing) return false;
  if (runtime.editPlacing.kind === 'teleport' && runtime.godMode()) {
    runtime.player.x = p.x;
    runtime.player.z = p.z;
    runtime.player.elevation = 0;
    runtime.editPlacing = null;
    runtime.target = null;
    runtime.toast('Teleporte concluído.');
    return true;
  }
  if (runtime.editPlacing.kind === 'create' && runtime.role === 'god') {
    const shapes = {
      tree: [.5, .5, 2.4],
      shrub: [.45, .45, .4],
      stone: [.65, .55, .5],
      house: [3, 2, 2.3],
      house1: [7, 5, 3.1],
      house2: [10, 5, 3.1],
      table: [1.15, .7, .65],
      chair: [.5, .5, .8],
      bed: [1.5, .9, .4],
      chest: [.9, .7, .55],
      shelf: [.65, 1.4, 1.9],
      barrel: [.5, .5, .8],
      lamp: [.25, .25, 1.3]
    };
    const [w, d, h] = shapes[runtime.editPlacing.item];
    if (runtime.editPlacing.item === 'house1' || runtime.editPlacing.item === 'house2') {
      const nx = p.x - w / 2,
        nz = p.z - d / 2;
      if (nx < 7.5 && nx + w > -.5 && nz < 5.5 && nz + d > -.5) return runtime.toast('Coloque a nova casa afastada da original.'), true;
      if (runtime.houseInstances().some(q => nx < q.x + q.w + .2 && nx + w > q.x - .2 && nz < q.z + q.d + .2 && nz + d > q.z - .2)) return runtime.toast('Há outra casa neste terreno.'), true;
    }
    const created = {
      kind: runtime.editPlacing.item,
      x: p.x - w / 2,
      z: p.z - d / 2,
      w,
      d,
      h,
      mass: 15,
      rot: 0,
      scale: 1,
      ...(runtime.editPlacing.item === 'chest' ? {
        chestState: {
          locked: false,
          open: false
        },
        contents: [],
        instanceId: 'chest-' + crypto.randomUUID()
      } : {}),
      ...(['house1', 'house2'].includes(runtime.editPlacing.item) ? {
        blueprint: runtime.editPlacing.item === 'house2' ? 'casa-2' : 'casa-1',
        modelVersion: 1,
        snapshot: runtime.captureHouseBlueprint(runtime.editPlacing.item),
        doorState: {
          open: false,
          locked: false
        },
        instanceId: 'casa-' + crypto.randomUUID()
      } : {})
    };
    runtime.editDecor.push(created);
    runtime.selected=created;
    if (created.kind === 'house1' || created.kind === 'house2') runtime.ensureHouseState(created);
    runtime.editPlacing = null;
    runtime.saveGame();
    runtime.renderEditor();
    runtime.toast(created.kind === 'house1' ? 'Casa 1 independente criada.' : created.kind === 'house2' ? 'Casa base ampliada criada.' : 'Objeto criado.');
    return true;
  }
  if (runtime.editPlacing.kind === 'move' && runtime.selected && runtime.canEditSelected(runtime.selected)) {
    const o = runtime.selected;
    if (runtime.role === 'traveler' && !runtime.withinReach(p.x, p.z, 1.45)) return runtime.toast('Destino fora do seu alcance.'), true;
    const nx = p.x - o.w / 2,
      nz = p.z - o.d / 2;
    if (runtime.role === 'traveler' && !runtime.canPlaceObjectAt(o, p.x, p.z)) return runtime.toast('Espaço bloqueado.'), true;
    if (o.original) {
      o.original.group.splice(o.original.group.indexOf(o.original.entry), 1);
      delete o.original;
      runtime.editDecor.push(o);
    }
    o.x = nx;
    o.z = nz;
    runtime.editPlacing = null;
    runtime.saveGame();
    runtime.renderEditor();
    runtime.toast('Objeto movido.');
    return true;
  }
  return true;
}
