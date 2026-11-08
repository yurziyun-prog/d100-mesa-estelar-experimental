import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/mesa-retratos.js';
import {retratoDe} from '../js/mesa-conversas.js';
test('v148: retrato de perfil gerado para NPC sem imagem', ()=>{
 for(const n of [{id:'a',nome:'Maelia Varen',sexo:'F'},{id:'b',nome:'Ilü-Mus-Ki',raca:'Insetoide'},{id:'c',nome:'UR-17',conceito:'robo'},{id:'d',nome:'Kibi',raca:'Grey'},{id:'e',nome:'Ssarak',raca:'Reptiliano'}]){
  const u=R.retratoDoNpc(n);assert.match(u,/^data:image\/svg\+xml/);assert.ok(decodeURIComponent(u).includes('</svg>'));}
 assert.notEqual(R.retratoDoNpc({id:'a',nome:'A'}),R.retratoDoNpc({id:'b',nome:'B'}));
 assert.match(retratoDe({nome:'Darek Sol',imagem:'blob:x#mini'},{imagem:'blob:y#mini'}),/^data:image\/svg/);
 assert.equal(retratoDe({nome:'X',retrato:'https://site/x.png'}),'https://site/x.png');
});
