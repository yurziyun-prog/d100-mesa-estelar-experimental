import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v202 — lanterna em cone: com fonte de luz equipada, a visão na névoa vira um cone na
// direção que o personagem olha (facing) + luz de proximidade; sem lanterna, círculo como antes.
import {gradeVisao,poligonoVisao,dentroPoligono,temLanterna,tapaVista} from '../js/mesa-nevoa.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const nevoa=fs.readFileSync(new URL('../js/mesa-nevoa.js',import.meta.url),'utf8');
const app22=fs.readFileSync(new URL('../js/app/22-mesa-e-modulos.js',import.meta.url),'utf8');
const W=28,H=14,P={x:14,y:7};
const paredeLeste={x:18,y:7,larguraM:.6,alturaM:4,angulo:0,bloqueiaVisao:true,nome:'Parede'};
const grade=(objs=[])=>gradeVisao(objs,W,H);
test('v202 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-/);
});
test('sem direção: visão continua círculo inteiro (comportamento antigo)',()=>{
 const poli=poligonoVisao(grade(),P);
 assert.ok(dentroPoligono({x:6,y:7},poli),'8 m a oeste visíveis (círculo)');
 assert.ok(dentroPoligono({x:14,y:12.9},poli),'perto da borda sul visível (círculo)');
});
test('com direção (lanterna): cone longo à frente, só proximidade atrás',()=>{
 const poli=poligonoVisao(grade(),P,16,180,0); // olhando para leste
 assert.ok(dentroPoligono({x:22,y:7},poli),'8 m à frente no cone visível');
 assert.ok(!dentroPoligono({x:6,y:7},poli),'8 m atrás fora do cone');
 assert.ok(dentroPoligono({x:12,y:7},poli),'2 m atrás dentro da luz de proximidade');
 assert.ok(!dentroPoligono({x:14,y:11},poli),'4 m ao sul fora do arco e da proximidade');
 assert.ok(dentroPoligono({x:17,y:8.2},poli),'frente-leve-sul dentro do arco');
});
test('luz do cone não ultrapassa parede',()=>{
 const poli=poligonoVisao(grade([paredeLeste]),P,16,180,0);
 assert.ok(dentroPoligono({x:16,y:7},poli),'antes da parede visível');
 assert.ok(!dentroPoligono({x:20,y:7},poli),'atrás da parede escuro');
});
test('temLanterna: equipado e bolso contam, mochila guardada não',()=>{
 assert.equal(temLanterna(null),false,'sem ficha');
 assert.equal(temLanterna({inventario:{equipado:[{nome:'Espada laser'}]}}),false,'sem fonte de luz');
 assert.equal(temLanterna({inventario:{equipado:[{nome:'Lanterna de mão'}]}}),true,'lanterna equipada');
 assert.equal(temLanterna({inventario:{bolso:[{nome:'Tocha'}],equipado:[]}}),true,'tocha no bolso');
 assert.equal(temLanterna({inventario:{mochila:[{nome:'Lanterna'}],equipado:[]}}),false,'lanterna na mochila não ilumina');
});
test('porta aberta continua não cortando a visão',()=>{
 assert.equal(tapaVista({nome:'Porta',bloqueiaMovimento:true,bloqueiaVisao:true,estadoInterativo:{aberto:true}}),false);
 assert.equal(tapaVista({nome:'Porta',bloqueiaMovimento:true,bloqueiaVisao:true,estadoInterativo:{aberto:false}}),true);
});
test('névoa usa facing do token e recebe fichaDe; app/22 liga userCharacters e sobe o ?v=',()=>{
 assert.match(nevoa,/const dir=a&&temLanterna\(ficha\)\?\(Number\.isFinite\(Number\(a\.facing\)\)\?Number\(a\.facing\):0\):null/);
 assert.match(nevoa,/export function temLanterna\(ficha\)/);
 assert.match(app22,/mesa-nevoa\.js\?v=204/);
 assert.match(app22,/fichaDe:\(id\)=>\{const raw=String\(id\|\|''\)/);
 assert.match(app22,/userCharacters\|\|\[\]\)\.find\(p=>String\(p\.id\)===raw/);
});
