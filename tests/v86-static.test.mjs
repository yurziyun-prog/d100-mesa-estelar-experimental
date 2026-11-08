import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('v86 adds ships database and owned ship collections',()=>{assert.match(app,/NAVES_COL_V86_='naves'/);assert.match(app,/NAVES_POS_V86_='navesPossuidas'/);assert.match(app,/Banco de Naves/);});
test('v86 ship models have type class and core ship fields',()=>{assert.match(app,/tipo:String\(v\.tipo/);assert.match(app,/classe:String\(v\.classe/);assert.match(app,/cascoMax/);assert.match(app,/escudoMax/);assert.match(app,/sensores/);assert.match(app,/slotsArmas/);});
test('v86 crew roles include command flight gunnery and engineering',()=>{for(const role of ['Capitão','Piloto','Navegador','Artilheiro','Engenheiro','Sensorista','Tripulante'])assert.match(app,new RegExp(role));});
test('v86 shared ship hold integrates with inventory drag both ways',()=>{assert.match(app,/renderizarCargaNaveInventarioV86_/);assert.match(app,/iniciarArrastoNaveV86_/);assert.match(app,/soltarInventarioNaveV86_/);assert.match(app,/soltarNaveEmInventarioV86_/);assert.match(app,/entityType:'ship'/);});
test('v86 ship inventory block remains separate from vehicle block',()=>{assert.match(html,/id="inventoryVehicleSharedV85"/);assert.match(html,/id="inventoryShipSharedV85"/);assert.match(html,/selecionarNaveInventarioV86_/);});
test('v86 linked players can update only shared cargo fields in rules',()=>{assert.match(rules,/match \/naves\/\{documento\}/);assert.match(rules,/match \/navesPossuidas\/\{documento\}/);assert.match(rules,/request\.auth\.uid in resource\.data\.usuariosPermitidos/);assert.match(rules,/hasOnly\(\['cargaItens', 'atualizadoEm'\]\)/);});
test('v86 ships update live and appear in character sidebar',()=>{assert.match(app,/where\('usuariosPermitidos','array-contains',currentUserUid\)/);assert.match(app,/onSnapshot\(fonteNaves/);assert.match(app,/charShipsV86/);assert.match(app,/renderizarNavesPersonagemV86_/);});
