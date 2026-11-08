import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tamanhoMiniaturaM,criaturaImovel,deslocamentoM,corrigirModelo,corrigirObjetoCena,TAMANHOS_OBJETOS} from '../js/mesa-tamanhos.js';
const app=lerApp();
const direta=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
const editor=fs.readFileSync(new URL('../js/nova-editor.js',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('v112 carrega a barra do mestre à parte',()=>{
 assert.match(app,/import\('\.\/mesa-barra\.js\?v=1\d\d'\)[\s\S]{0,900}\.catch\(/);
 assert.doesNotMatch(app,/^import .*mesa-barra/m);
 assert.match(direta,/place:\(chosen,p,opts\)=>place\(chosen,p,opts\)/);
 assert.match(direta,/import\('\.\/mesa-tamanhos\.js\?v=1\d\d'\)\.then\([\s\S]{0,60}\)\.catch\(/);
});
test('rascunho do editor salva sozinho e pode ser desligado',()=>{
 assert.match(editor,/mesaAutoSalvar===true/);
 assert.match(editor,/setTimeout\(function tentar\(\)/);
});
test('regras aceitam o tamanho da miniatura e os atributos do NPC',()=>{
 assert.match(rules,/'mapaId','diametroM','atributosIndividuo'(?:,'[A-Za-z0-9]+')*\]\) &&\n\s+d\.get\('diametroM',1\) is number/);
});
test('tamanho das miniaturas pela ficha',()=>{
 assert.equal(tamanhoMiniaturaM({tamanho:'Titânico',TAM:80}),8);
 assert.equal(tamanhoMiniaturaM({tamanho:'Médio',TAM:10,altura:'1,76'}),1);
 const besta=tamanhoMiniaturaM({tamanho:'Grande',altura:'2,4 m no ombro'});assert.ok(besta>2&&besta<2.5);
 assert.ok(tamanhoMiniaturaM({tamanho:'Minúsculo',altura:'0,25'})<.5);
 assert.ok(tamanhoMiniaturaM({tamanho:'Enorme',altura:'4,2 m'})>=3.5);
 assert.equal(tamanhoMiniaturaM({diametroM:3}),3);
 assert.equal(tamanhoMiniaturaM({}),1);
});
test('Cila não se move; deslocamento vazio não vira zero',()=>{
 assert.ok(criaturaImovel({nome:'Cila',descricao:'fixa-se ao substrato'}));
 assert.equal(deslocamentoM({deslocamento:'',movimentoTerrestre:0}),0);
 assert.equal(deslocamentoM({deslocamento:'',movimentoTerrestre:''}),6);
 assert.equal(deslocamentoM({deslocamento:8}),8);
 assert.match(app,/function deslocamentoFichaV112_\(c,nome='',t=null\)/);
 assert.doesNotMatch(app,/Number\(c\.deslocamento\?\?c\.movimentoTerrestre\)\|\|/);
});
test('móveis: só corrige quem está com a medida antiga',()=>{
 assert.deepEqual(corrigirModelo({id:'sofacinza1',larguraM:4,alturaM:4}),{id:'sofacinza1',larguraM:2.6,alturaM:2.6});
 assert.equal(corrigirModelo({id:'sofacinza1',larguraM:3.7,alturaM:3.58}),null);
 assert.equal(corrigirModelo({id:'carro1',larguraM:5,alturaM:2}),null);
 for(const r of Object.values(TAMANHOS_OBJETOS))assert.ok(Math.abs(r.de[0]/r.de[1]-r.para[0]/r.para[1])<.08,'proporção');
 const o={modeloId:'cadeira1',x:10,y:5,larguraM:1,alturaM:1,oficinaBounds:{x:3,y:4,w:1,h:1},oficinaElement:{x:3,y:4,w:1,h:1}};
 const n=corrigirObjetoCena(o);assert.equal(n.larguraM,.9);assert.equal(n.oficinaBounds.x+n.oficinaBounds.w/2,3.5);assert.equal(n.x,10);
});
