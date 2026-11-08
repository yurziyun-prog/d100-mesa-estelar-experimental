import test from 'node:test';
import assert from 'node:assert/strict';
import {letrasComArmaAtiva} from '../js/mesa-equip-visual.js';
import {corCamadasPessoa,camadaVisivel,lerVisual} from '../js/mesa-arte3d.js';
const items=[{nome:'Capacete'},{nome:'Espada de Força',idBanco:'espada_forca',instanciaId:'sabre'},{nome:'Pistola Laser',instanciaId:'pistola'},{nome:'Fuzil',instanciaId:'fuzil'},{nome:'Mochila'}];
test('arma ativa muda só o que está na mão, mantendo armadura e acessórios',()=>{
 assert.equal(letrasComArmaAtiva(items,'sabre'),'EKMN');
 assert.equal(letrasComArmaAtiva(items,'pistola'),'KMP');
 assert.equal(letrasComArmaAtiva(items,'fuzil'),'GKM');
 assert.equal(letrasComArmaAtiva(items,'natural:soco'),'KM');
 assert.equal(letrasComArmaAtiva(items,'inexistente'),'KM');
});
test('arma da mochila não aparece; fallback de fichas antigas mantém equipamento',()=>{
 assert.equal(letrasComArmaAtiva([{nome:'Capacete'}],'sabre'),'K');
 assert.equal(letrasComArmaAtiva(items,undefined),'EGKMNP');
});
test('energia tem cor própria e trocar para pistola oculta a espada',()=>{
 const sword=lerVisual('z=EN','p'),gun=lerVisual('z=P','p');
 assert.equal(corCamadasPessoa(sword).ac_espada,'#86f3ff');
 assert.equal(camadaVisivel(gun,'ac_espada'),false);
 assert.equal(camadaVisivel(gun,'ac_pistola'),true);
});
