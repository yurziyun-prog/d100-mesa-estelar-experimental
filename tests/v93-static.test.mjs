import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=lerApp();
const direct=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('v93 mapa ausente da miniatura não segue câmera do mestre em exploração',()=>{
  assert.match(direct,/sharedMapPacket\?\.combat\?\.active\?sharedMapPacket\?\.mapId:''/);
  assert.doesNotMatch(direct,/const tokenMapId=t=>String\(t\?\.mapaId\|\|sharedMapPacket\?\.mapId\|\|''\)/);
});

test('v93 migração usa cenário da entidade e não câmera do mestre para personagens',()=>{
  assert.match(app,/let mapId='',raw=''/);
  assert.match(app,/if\(n\)mapId=String\(n\.localizacaoMapaId\|\|''\)/);
  assert.match(app,/if\(c\)mapId=String\(c\.localizacaoMapaId\|\|''\)/);
  assert.match(app,/reposicionar\.push\(\{tipo,e,c\}\)/);
  assert.match(app,/moverTokenParaMapaV92_\(item\.tipo,item\.e,item\.c\)/);
});

test('v93 vínculo automático mapa-cenário nasce desligado',()=>{
  assert.match(app,/localStorage\.getItem\('mesa_cenario_mapa_auto_v80'\)==='1'/);
  assert.match(app,/catch\(_\)\{return false;\}/);
});
