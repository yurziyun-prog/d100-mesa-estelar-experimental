import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {ataquesRapidos,separarPericias,partesDoCorpo,ehArea} from '../js/mesa-acoes-mapa.js';
import {precisaMini} from '../js/mesa-conteudo.js';
const sheet={skills:[{id:'desarmado',nome:'Combate Desarmado',valor:69,attack:true,weapons:[{id:'mordida',nome:'Mordida',dano:'1d8'},{id:'eco',nome:'Eco da Matilha',descricao:'Cone de 8 m'}]},{id:'percepcao',nome:'Percepção',valor:40,weapons:[]}]};
test('v122: ataques numerados para 1–9 e perícias separadas',()=>{
 const r=ataquesRapidos(sheet);assert.deepEqual(r.map(a=>a.weaponId),['mordida','eco']);assert.equal(r[1].area,true);assert.equal(r[0].area,false);
 const {ataques,testes}=separarPericias(sheet);assert.equal(ataques.length,1);assert.equal(testes[0].id,'percepcao');
 assert.ok(ehArea({nome:'Granada',descricao:'explosão em raio de 3 m'}));
});
test('v122: partes do corpo em ordem e com estado',()=>{
 const p=partesDoCorpo({hit:{Peito:0,'Cabeça':2},hitMax:{Peito:3,'Cabeça':2},armor:{Peito:1}});
 assert.deepEqual(p.map(x=>x.parte+':'+x.estado),['Cabeça:ok','Peito:zerada']);assert.equal(p[1].pa,1);
});
test('v122: monstros com foto antiga ganham miniatura desenhada; arte dos jogadores fica',()=>{
 assert.equal(precisaMini('criaturas',{id:'cila',miniatura:{url:'https://x/foto.png',tipo:'imagem'}}),true);
 assert.equal(precisaMini('criaturas',{id:'cila',miniatura:{url:'https://x/a.svg#mini',tipo:'montada',spec:{corpo:'quadrupede'}}}),true);
 assert.equal(precisaMini('criaturas',{id:'cila',miniatura:{url:'https://x/a.svg#mini',tipo:'montada',spec:{corpo:'sessil'}}}),false);
 assert.equal(precisaMini('personagens',{id:'pj',miniatura:{url:'https://x/foto.png'}}),false);
 assert.equal(precisaMini('npcs',{id:'n'}),true);
});
test('v122: painel envia ataque no tempo real e expõe o estado para o balão',()=>{
 const p=readFileSync(new URL('../js/nova-painel.js',import.meta.url),'utf8');
 assert.match(p,/else if\(target&&skill\.attack\)\{ \/\/ v122/,'v205: com alvo e arma o painel sempre envia o ataque (antes só com turno ou tempo real ligado)');assert.match(p,/update\.escolher=/);assert.match(p,/update\.executar=/);
});
