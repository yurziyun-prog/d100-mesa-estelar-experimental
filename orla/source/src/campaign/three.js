import * as T from '../vendor/three/three.module.js';
import { state as s } from '../core/state.js';
import { box, rod, sphere, face, material, disposeGroup } from '../rendering3d/primitives.js';
import { BIOMES, ACTORS } from './catalog.js';
import { treeGeometry, actorGeometry } from './geometry.js';
import { barGeometry, inBar } from './bar.js';
export function meshParts(parent, parts, x = 0, z = 0, y = 0) {
  const group = new T.Group();
  group.position.set(x, y, z);
  parent.add(group);
  for (const p of parts) {
    if (p.kind === 'box') box(group, p.x, p.y, p.z, p.w, p.h, p.d, p.c, p.m);else if (p.kind === 'orb') sphere(group, [p.x, p.y, p.z], [p.w, p.h, p.d], p.c);else if (p.kind === 'rod') rod(group, p.a, p.b, p.r, p.c);else if (p.kind === 'face') {
      const mesh = face(group, p.p, p.c, 'plain');
      if (p.m === 'glass') mesh.material = material(p.c, 'glass', true);
    } else if (p.kind === 'text') {
      const c = document.createElement('canvas');
      c.width = 768;
      c.height = 96;
      const ctx = c.getContext('2d');
      ctx.font = 'bold 48px Georgia';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.c;
      ctx.fillText(p.text, 384, 66);
      const texture = new T.CanvasTexture(c),
        mesh = new T.Mesh(new T.PlaneGeometry(4.5, .56), new T.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: T.DoubleSide
        }));
      mesh.userData.ownedMaterial = true;
      mesh.position.set(p.x, p.y + .1, p.z);
      group.add(mesh);
    }
  }
  return group;
}
export function buildCampaignLandscape(parent) {
  if (!s.activeMap) return;
  const map = s.activeMap();
  for (const o of s.landscapeProps()) meshParts(parent, o.parts, o.x, o.z);
  for (const o of map.plants || []) meshParts(parent, treeGeometry(o.type, o.scale), o.x, o.z);
  if (map.bar) {
    const inside = inBar(s.player.x, s.player.z);
    for (const [x, z] of [[3, 3], [8, 4]]) {
      const light = new T.PointLight('#ffdbad', 9, 12, 1.5);
      light.position.set(x, s.player.elevation > 2.5 ? 4.7 : 2.2, z);
      parent.add(light);
    }
    meshParts(parent, barGeometry({
      inside,
      upper: s.player.elevation > 2.5,
      near: side => s.painterDepth(side === 'west' ? 0 : side === 'east' ? 12 : 6, side === 'north' ? 0 : side === 'south' ? 8 : 4) > s.painterDepth(6, 4)
    }));
  }
}
export function makePopulationView(scene) {
  const nodes = new Map();
  return {
    update() {
      const current = new Set(),
        party = s.partyCharacters?.() || [],
        records = [...(s.cast || []), ...party.filter(p => p.id === 'god' || p.id !== s.controlledId || s.campaign.appearance[p.id])];
      for (const a of records) {
        current.add(a.id);
        const config = s.campaign.appearance[a.id],
          isParty = party.includes(a),
          spec = config ? ACTORS[config.type] : isParty ? ACTORS.explorer : ACTORS[a.type],
          look = config || isParty ? {
            color:a.looks?.outfit||(a.id === 'god' ? '#ece6d2' : '#675276'),
            skin:a.looks?.skin||'#cea786',
            hair: a.id === 'god' ? '#eee9dc' : '#443b40',
            beard: a.id === 'god',
            ...(config || {})
          } : a,
          key = JSON.stringify([spec, look.color, look.skin, look.scale, look.accessory, look.hair, look.beard]);
        let node = nodes.get(a.id);
        if (!node || node.key !== key) {
          if (node) {
            disposeGroup(node.group);
            scene.remove(node.group);
          }
          const group = meshParts(scene, actorGeometry(spec, look));
          node = {
            key,
            group
          };
          nodes.set(a.id, node);
        }
        const pose = a.id === s.controlledId ? s.player : a.position || a;
        node.group.position.set(pose.x, pose.elevation || 0, pose.z);
        node.group.rotation.y = Number.isFinite(pose.faceX)?Math.atan2(pose.faceX,pose.faceY):a.yaw || 0;
        node.group.rotation.z = a.hp <= 0 ? Math.PI / 2 : 0;
        if (a.hp <= 0) node.group.position.y += .2;
        node.group.visible = true;
      }
      for (const [id, node] of nodes) if (!current.has(id)) {
        disposeGroup(node.group);
        scene.remove(node.group);
        nodes.delete(id);
      }
    }
  };
}
export { BIOMES, treeGeometry };
