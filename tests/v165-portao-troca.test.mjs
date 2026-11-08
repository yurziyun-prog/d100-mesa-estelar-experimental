import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const r=readFileSync(new URL('../js/mesa-remodelagem.js',import.meta.url),'utf8');
test('v165: o portão da imagem IA vira o Portão de Véspera (mesmo id), com cópia, Denzel, saídas e sem mapa duplicado',()=>{
 const f=r.slice(r.indexOf('async function montar165'));
 assert.match(f,/configuracoes\/portaoTrocaV165/);assert.match(f,/backupMapa_'\+ID\+'_v165/);assert.match(f,/const ID='cenario_c001'/);
 assert.match(f,/portaoIAV163/,'espera o mapa IA ficar pronto');assert.match(f,/deleteDoc\(D\('mapas\/'\+IA\)\)/);assert.match(f,/_ia163/);
 assert.ok(f.indexOf('acomodar(ID')<f.indexOf("moverToken(denOrig"),'Denzel vai para o portão depois de acomodar os outros');
 assert.match(r,/portaoV165\)\)\{feito163=true/,'o mapa IA não é recriado depois da troca');
});
