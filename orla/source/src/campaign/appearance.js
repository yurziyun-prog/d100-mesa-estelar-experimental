import { state as s } from '../core/state.js';
import { ACTORS } from './catalog.js';
import { actorGeometry } from './geometry.js';
import { drawParts } from './draw.js';
export function installCampaignAppearance() {
  const field = document.createElement('fieldset');
  field.innerHTML = '<legend>Variações de personagem</legend><label>Forma <select id="characterForm"><option value="original">Aparência original</option></select></label><label>Cor principal <input id="characterTint" type="color" value="#675276"></label><label>Pele / detalhes <input id="characterSkin" type="color" value="#b6c3ab"></label><label>Estatura <input id="characterScale" type="number" min="0.65" max="1.5" step="0.05" value="1"></label><label>Acessório <select id="characterAccessory"><option value="none">Nenhum</option><option value="hat">Chapéu</option><option value="crest">Crista</option><option value="antenna">Antena</option></select></label><button id="applyCharacterForm">Aplicar à personagem controlada</button>';
  document.getElementById('appearancePanel').append(field);
  for (const [id, a] of Object.entries(ACTORS)) field.querySelector('#characterForm').add(new Option(a.name, id));
  field.querySelector('button').onclick = () => {
    const type = field.querySelector('#characterForm').value;
    if (type === 'original') delete s.campaign.appearance[s.controlledId];else s.campaign.appearance[s.controlledId] = {
      type,
      color: field.querySelector('#characterTint').value,
      skin: field.querySelector('#characterSkin').value,
      scale: Number(field.querySelector('#characterScale').value),
      accessory: field.querySelector('#characterAccessory').value
    };
    s.saveGame();
  };
  const draw = (id, pose) => {
    const a = s.campaign.appearance[id];
    if (!a || !ACTORS[a.type]) return false;
    drawParts(actorGeometry(ACTORS[a.type], a, id===s.controlledId && s.walking ? s.player.step : 0), pose.x, pose.z, pose.elevation || 0, -Math.atan2(pose.faceX??0,pose.faceY??1));
    return true;
  };
  const character = s.character;
  s.character = () => {
    if (s.combat.hp <= 0 && !s.godMode()) return character();
    if (!draw(s.controlledId, s.player)) character();
  };
  const party = s.drawPartyCharacter;
  s.drawPartyCharacter = p => {
    if (p.hp <= 0 || !draw(p.id, p.position)) party(p);
  };
  const sync = s.syncLookInputs;
  s.syncLookInputs = () => {
    sync();
    const a = s.campaign.appearance[s.controlledId];
    field.querySelector('#characterForm').value = a?.type || 'original';
    if (a) {
      field.querySelector('#characterTint').value = a.color;
      field.querySelector('#characterSkin').value = a.skin;
      field.querySelector('#characterScale').value = a.scale;
      field.querySelector('#characterAccessory').value = a.accessory;
    }
  };
}
