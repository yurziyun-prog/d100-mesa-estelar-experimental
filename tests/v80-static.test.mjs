import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=lerApp();
const direct=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const oficina=fs.readFileSync(new URL('../js/nova-oficina.js',import.meta.url),'utf8');

test('v80 publica vínculo opcional cenário mapa',()=>{
 assert.match(html,/dbScenarioMapaId/);
 assert.match(html,/gmScenarioMapAutoV80/);
 assert.match(app,/v80-cenario-mapa/);
 assert.match(app,/mapaId:String\(bruto\.mapaId/);
 assert.match(app,/abrirMapaVinculadoCenarioV80_/);
});

test('v80 evita geometria indefinida em objetos importados',()=>{
 assert.match(app,/visual\.oficinaBounds\?\.w \?\? raw\.w \?\? visual\.larguraM/);
 assert.match(app,/Objeto da Oficina sem geometria completa; usando fallback visual/);
});

test('v80 força cache novo dos módulos de mapa',()=>{
 assert.match(html,/app\.js\?v=[^"']+/);
 assert.match(app,/nova-direta\.js\?v=(?:8[0-9]|9[0-9]|[1-9][0-9]{2,})/);
 assert.match(direct,/nova-objetos\.js\?v=80/);
 assert.match(oficina,/nova-objetos\.js\?v=80/);
});
