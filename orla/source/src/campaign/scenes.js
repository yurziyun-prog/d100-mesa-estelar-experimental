import { state as s } from '../core/state.js';
import { BIOMES, copy, validateCampaign, makeActor } from './catalog.js';
export function installCampaign() {
  let navigating=false;
  s.campaign = validateCampaign(s.campaign) || {
    version: 1,
    active: 'home',
    scenes: [{
      id: 'home',
      name: 'Campina da Orla',
      biome: 'meadow',
      actors: [],
      plants: [],
      spawn: {
        x: 6.5,
        z: 2.6
      }
    }],
    party: [{
      id: 'traveler',
      name: 'Viajante'
    }, {
      id: 'god',
      name: 'Deus'
    }],
    appearance: {}
  };
  s.activeMap = () => s.campaign.scenes.find(o => o.id === s.campaign.active);
  s.baseHouseEnabled = s.activeMap().biome === 'meadow';
  s.saveGame();
  const baseline = JSON.parse(s.lastSaveData);
  delete baseline.campaign;
  s.createMap = (biome, name) => {
    if ((!s.godMode() && !navigating) || !BIOMES[biome] || s.campaign.scenes.length >= 20) return false;
    const id = 'map-' + crypto.randomUUID(),
      snapshot = copy(baseline);
    delete snapshot.campaign;
    snapshot.editDecor = [];
    snapshot.combat.enemy = {
      ...snapshot.combat.enemy,
      hp: biome === 'meadow' ? 24 : 0,
      x: 7,
      z: 13
    };
    snapshot.gathering.trees = [];
    snapshot.gathering.rocks = [];
    snapshot.playerPosition = {
      x: 6,
      z: 11
    };
    snapshot.storey = {
      upper: false,
      stairs: false,
      elevation: 0
    };
    snapshot.fixedMovables = snapshot.fixedMovables.map(o => ({
      ...o,
      hidden: biome !== 'meadow'
    }));
    snapshot.pushables = snapshot.pushables.map(o => ({
      ...o,
      hidden: biome !== 'meadow'
    }));
    snapshot.droppedItems = [];
    for (const key of Object.keys(snapshot.stores)) if (key !== 'inventory') snapshot.stores[key] = [];
    snapshot.items = {
      houseKey: true,
      chestKey: true
    };
    snapshot.rug.placed = false;
    snapshot.fireplace.lit = false;
    const map = {
      id,
      name: String(name || BIOMES[biome].name).slice(0, 70),
      biome,
      snapshot,
      actors: [],
      plants: [],
      spawn: {
        x: 6,
        z: 11
      },
      bar: biome === 'vespera'
    };
    if (map.bar) map.actors.push(makeActor('bartender', 4.5, 1.35, {
      attitude: 'friendly'
    }));
    s.campaign.scenes.push(map);
    s.saveGame();
    s.refreshCampaignUI?.();
    return id;
  };
  s.prepareMapTransition = id => {
    if ((!s.godMode() && !navigating) || id === s.campaign.active || !s.campaign.scenes.some(o => o.id === id)) return null;
    s.saveGame();
    const current = JSON.parse(s.lastSaveData),
      book = copy(s.campaign),
      old = book.scenes.find(o => o.id === book.active);
    delete current.campaign;
    old.snapshot = copy(current);
    const next = book.scenes.find(o => o.id === id),
      payload = copy(next.snapshot || baseline),
      arrival = next.spawn || {
        x: 6,
        z: 11
      };
    book.active = id;
    for (const key of ['equipment', 'handItem', 'looks', 'role']) payload[key] = copy(current[key] ?? null);
    payload.stores.inventory = copy(current.stores.inventory);
    payload.combat = {
      ...copy(current.combat),
      enemy: copy(payload.combat.enemy),
      cooldown: 0,
      log: []
    };
    if (payload.combat.corpse) payload.combat.corpse = {
      ...arrival,
      elevation: 0,
      upper: false,
      stairs: false
    };
    payload.playerPosition = {
      ...arrival
    };
    payload.storey = {
      upper: false,
      stairs: false,
      elevation: 0
    };
    for (const [i, p] of book.party.entries()) {
      p.sceneId = id;
      p.position = {
        x: arrival.x + i * .7,
        z: arrival.z,
        elevation: 0
      };
    }
    const activeParty = book.party.find(p => p.id === book.controlled);
    if (activeParty) payload.playerPosition = {
      x: activeParty.position.x,
      z: activeParty.position.z
    };
    const companions=new Set(s.selectedTravelActors||[]);
    if(old.actors.some(a=>a.id===book.controlled))companions.add(book.controlled);
    const carried=old.actors.filter(a=>companions.has(a.id));
    old.actors=old.actors.filter(a=>!companions.has(a.id));
    for(const [i,a] of carried.entries()){a.x=arrival.x+(i%4)*.7;a.z=arrival.z+1+Math.floor(i/4)*.7;a.elevation=0;next.actors.push(a);if(a.id===book.controlled)payload.playerPosition={x:a.x,z:a.z};}
    payload.campaign = book;
    return payload;
  };
  s.activateMap = id => {
    const payload = s.prepareMapTransition(id);
    if (!payload) return false;
    try {
      localStorage.setItem(s.saveKey, JSON.stringify(payload));
    } catch {
      s.toast('Não foi possível salvar a troca de mapa. Exporte a partida antes de continuar.');
      return false;
    }
    // A queued autosave must not overwrite the destination before navigation.
    s.mapTransitionPending = true;
    clearTimeout(s.furnitureSaveTimer);
    location.reload();
    return true;
  };
  s.visitScenario = key => {
    navigating=true;
    try {const id=s.campaign.scenes.find(m=>m.id===key||m.biome===key)?.id||s.createMap(key);return id?s.activateMap(id):false;}
    finally {navigating=false;}
  };
  const chooser=document.createElement('section');chooser.id='scenarioMenu';chooser.hidden=true;chooser.setAttribute('aria-label','Cenários');document.body.append(chooser);
  const brand=document.querySelector('#scenarioBtn');
  const refreshScenarios=()=>{
    chooser.replaceChildren();const online=document.createElement('a');online.textContent='✦ Entrar na sessão online 3D';online.href=location.protocol==='file:'?'https://d100-mesa-estelar-experimental.pages.dev/orla/online/':'./online/';online.style.cssText='display:block;padding:12px;color:#d6edff;border:1px solid #8b73ab;border-radius:8px;margin-bottom:10px';chooser.append(online);const title=document.createElement('h3');title.textContent='Cenários da campanha';chooser.append(title);
    const hint=document.createElement('p');hint.textContent='Deus e os personagens do grupo viajam juntos. NPCs ficam neste cenário, salvo os selecionados abaixo.';chooser.append(hint);
    const choices=new Map(Object.entries(BIOMES).map(([id,b])=>[id,b.name]));
    for(const m of s.campaign.scenes)choices.set(m.id,m.name+(m.id===s.campaign.active?' · atual':''));
    for(const [key,name] of choices){if(BIOMES[key]&&s.campaign.scenes.some(m=>m.biome===key))continue;const b=document.createElement('button');b.textContent=name;b.type='button';b.dataset.scenario=key;b.disabled=key===s.campaign.active;b.onclick=()=>s.visitScenario(key);chooser.append(b);}
    if(s.cast.length){const label=document.createElement('p');label.textContent='Levar também:';chooser.append(label);for(const a of s.cast){const row=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=(s.selectedTravelActors||[]).includes(a.id);check.onchange=()=>{s.selectedTravelActors=[...chooser.querySelectorAll('input:checked')].map(c=>c.value);};check.value=a.id;row.append(check,document.createTextNode(a.name));chooser.append(row);}}
  };
  brand.onclick=()=>{refreshScenarios();chooser.hidden=!chooser.hidden;brand.setAttribute('aria-expanded',String(!chooser.hidden));};
  document.addEventListener('pointerdown',e=>{if(!chooser.contains(e.target)&&!brand.contains(e.target)){chooser.hidden=true;brand.setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){chooser.hidden=true;brand.setAttribute('aria-expanded','false');}});
  s.registerPartyMember = (id, name) => {
    if (!s.godMode() || typeof id !== 'string' || s.campaign.party.length >= 12 || s.campaign.party.some(p => p.id === id)) return false;
    s.campaign.party.push({
      id,
      name: String(name || id).slice(0, 60),
      hp: 12,
      looks:copy(s.looks.traveler),
      maxHp: 12,
      inventory: [],
      equipment: {
        left: null,
        right: null,
        backpack: 'backpack',
        clothing: 'clothing'
      },
      sceneId: s.campaign.active,
      position: {
        x: Math.min(38, s.player.x + .8),
        z: s.player.z,
        elevation: s.player.elevation
      }
    });
    s.saveGame();
    return true;
  };
  const field = document.createElement('fieldset');
  field.id = 'campaignMaps';
  field.innerHTML = '<legend>Mapas da campanha</legend><label>Paisagem <select id="mapBiome"></select></label><label>Nome do mapa <input id="mapName" maxlength="70" placeholder="Nome opcional"></label><button id="createMap">Criar mapa</button><label>Mapas preparados <select id="mapSelect"></select></label><button id="activateMap">Ativar mapa e transportar o grupo</button><p>Deus e personagens dos jogadores vão juntos. NPCs e criaturas permanecem no mapa de origem. A partida é salva antes da viagem.</p><p id="activeMapName"></p>';
  document.getElementById('powersPanel').append(field);
  for (const [id, b] of Object.entries(BIOMES)) field.querySelector('#mapBiome').add(new Option(b.name, id));
  s.refreshCampaignUI = () => {
    const select = field.querySelector('#mapSelect'),
      old = select.value;
    select.replaceChildren(...s.campaign.scenes.map(m => new Option(m.name + (m.id === s.campaign.active ? ' · atual' : ''), m.id)));
    select.value = s.campaign.scenes.some(m => m.id === old) ? old : s.campaign.active;
    field.querySelector('#activeMapName').textContent = 'Mapa atual: ' + s.activeMap().name;
  };
  s.refreshCampaignUI();
  field.querySelector('#createMap').onclick = () => {
    const id = s.createMap(field.querySelector('#mapBiome').value, field.querySelector('#mapName').value);
    if (id) {
      field.querySelector('#mapSelect').value = id;
      s.toast('Mapa preparado. Ative-o para transportar o grupo.');
    }
  };
  field.querySelector('#activateMap').onclick = () => s.activateMap(field.querySelector('#mapSelect').value);
}
