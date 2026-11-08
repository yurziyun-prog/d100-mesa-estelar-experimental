import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as C from '../js/mesa-conversas.js';
const ler=p=>/(^|\/)app\.js$/.test(p)?lerApp():readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('v147: testes de conversa dos NPCs de nome', ()=>{
 const m=C.testesDoNpc('Maelia Varen');assert.ok(m.some(t=>t.titulo==='Pedir uma audiência'&&!t.oculto));assert.ok(m.some(t=>t.pericia==='Psicologia'&&t.oculto));
 assert.ok(C.testesDoNpc('Darek Sol').some(t=>/prisioneiros/.test(t.titulo)));assert.ok(C.testesDoNpc('Nilo').some(t=>/cantil/.test(t.titulo)));
 assert.ok(C.testesDoNpc('Tessan Vey').some(t=>t.titulo==='Conversar com Tessan Vey'));
 const per=new Set(C.testesDoNpc('Fulano de Tal').map(t=>t.pericia));for(const p of per)assert.ok(['Influência','Psicologia','Intimidação','Enganação','Comércio','Percepção','Intuição'].includes(p),p);
 assert.equal(C.chance(60,'Difícil'),40);assert.equal(C.chance(60,'Padrão'),60);
 assert.match(C.retratoDe({nome:'Maelia Varen'},{imagem:'blob:abc'}),/^data:image\/svg/);assert.equal(C.retratoDe({imagem:'https://x/y.png'}),'https://x/y.png');
});
test('v147: instalado, só fora de combate, ocultos em doc do mestre', ()=>{
 const s=ler('js/mesa-conversas.js');assert.match(s,/emCombate\(\)/);assert.match(s,/seg_/);assert.match(s,/mesaDialogoNPC_/);
 assert.match(ler('js/app.js'),/mesa-conversas\.js\?v=1[4-9][0-9]/);
});
