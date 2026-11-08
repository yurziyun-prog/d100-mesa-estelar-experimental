import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v87 sidebar follows natural page scroll',()=>{assert.match(app,/#charContextV66\{position:relative!important;top:auto!important/);assert.match(app,/max-height:none!important;overflow:visible!important/);});
test('v87 compacts character identity and background fields',()=>{assert.match(app,/charIdentityGridV87/);assert.match(app,/charBackgroundGridV87/);assert.match(app,/char-core-grid-v87/);});
test('v87 ship models gain module slots and special characteristics',()=>{assert.match(app,/slotsModulos/);assert.match(app,/caracteristicas/);assert.match(app,/v87SlotsModulos/);assert.match(app,/v87Caracteristicas/);});
test('v87 owned ships can edit crew roles after creation',()=>{assert.match(app,/abrirEditarNavePossuidaV87_/);assert.match(app,/v87OwnedCrewRole/);assert.match(app,/salvarNavePossuidaV87_/);for(const r of ['Capitão','Piloto','Navegador','Artilheiro','Engenheiro','Sensorista'])assert.match(app,new RegExp(r));});
test('v87 owned ships support individual image and current stats',()=>{assert.match(app,/imagemIndividual/);assert.match(app,/v87OwnedImage/);assert.match(app,/v87OwnedHull/);assert.match(app,/v87OwnedShield/);assert.match(app,/v87OwnedEnergy/);});
test('v87 separates installed weapons and modules from cargo',()=>{assert.match(app,/armasInstaladas/);assert.match(app,/modulosInstalados/);assert.match(app,/Armas instaladas/);assert.match(app,/Módulos instalados/);assert.match(app,/Inventário → Nave/);});
