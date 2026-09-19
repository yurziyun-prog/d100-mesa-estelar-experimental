import fs from 'node:fs';import vm from 'node:vm';
import test from 'node:test';import assert from 'node:assert/strict';
import {normalizarObjeto,criarObjeto,objetosDoMapa,prepararCena,importarModelos} from '../js/nova-objetos.js';
const model={id:'arvore',nome:'Árvore',pvMax:40,dureza:5,material:'madeira',pesoKg:600,inflamabilidade:3,inflamavel:true,destrutivel:true,camada:4,bloqueiaMovimento:false,bloqueiaVisao:true,imagem:'data:image/svg+xml,x'};
test('catálogo preserva propriedades, cria estados separados e não duplica imagem do modelo',()=>{
 const a=criarObjeto(model,{id:'a',x:1,y:1}),b=criarObjeto(model,{id:'b',x:2,y:1});assert.equal(a.pvAtual,40);assert.equal(a.material,'madeira');assert.equal(a.camada,4);assert.equal(a.imagem,undefined);a.pvAtual=12;a.estadoFogo.intensidade=2;assert.equal(b.pvAtual,40);assert.deepEqual(b.estadoFogo,{});assert.equal(normalizarObjeto(a,model).imagem,model.imagem);
});
test('hidratação preserva zero, false e campos próprios da instância mesmo com modelo alterado',()=>{
 const o=normalizarObjeto({id:'a',pvAtual:0,destruido:true,bloqueiaVisao:false,pesoKg:0,camada:0,estadoFogo:{rodadas:2},recursosRestantes:0},model);assert.equal(o.pvAtual,0);assert.equal(o.bloqueiaVisao,false);assert.equal(o.pesoKg,0);assert.equal(o.camada,0);assert.equal(o.recursosRestantes,0);assert.equal(o.estadoFogo.rodadas,2);assert.equal(normalizarObjeto(o,{...model,pvMax:100}).pvMax,40);
});
test('mapa salvo usa centros e escala, deduplica referências da oficina e migra uma só vez',()=>{
 const map={id:'m',larguraM:56,alturaM:28,objetos:[{id:'a',modeloId:'arvore',pvAtual:12}],oficina2State:{elements:[{id:'a',type:'object',modeloId:'arvore',x:8,y:4,w:4,h:2,rot:90}]}};
 const seeds=objetosDoMapa(map);assert.equal(seeds.length,1);assert.equal(seeds[0].x,5);assert.equal(seeds[0].y,2.5);assert.equal(seeds[0].pvAtual,12);const models=new Map([['arvore',model]]),scene=prepararCena(null,map,seeds,models);assert.equal(scene.objects[0].pvAtual,12);assert.equal(scene.objects[0].angulo,90);assert.equal(scene.objects[0].camada,4);assert.deepEqual(prepararCena(scene,map,seeds,models),scene);scene.objects=[];assert.equal(prepararCena(scene,map,seeds,models).objects.length,0);
});
test('CSV atualiza por ID, preserva imagens/campos ausentes e aceita vírgula, zero e false',()=>{
 const [o]=importarModelos([{id:'arvore',pvMax:'0',pesoKg:'2,5',bloqueiaVisao:'false',camada:'2'}],[model]);assert.equal(o.imagem,model.imagem);assert.equal(o.material,'madeira');assert.equal(o.pvMax,0);assert.equal(o.pesoKg,2.5);assert.equal(o.bloqueiaVisao,false);assert.equal(o.camada,2);
 for(const rows of [[{id:'bad/id',nome:'X'}],[{id:'a',nome:'A'},{id:'a',nome:'B'}],[{id:'a',nome:'A',pvMax:'x'}],[{id:'a',nome:'A',inflamabilidade:6}],[{id:'a',nome:'A',bloqueiaVisao:'talvez'}]])assert.throws(()=>importarModelos(rows));
});

test('camadas antigas dependem de propriedades, sem adivinhar pelo nome',()=>{
 assert.equal(normalizarObjeto({nome:'Árvore',bloqueiaMovimento:true}).camada,3);assert.equal(normalizarObjeto({nome:'Tapete',bloqueiaMovimento:false}).camada,2);assert.equal(normalizarObjeto({tipo:'terreno'}).camada,1);assert.throws(()=>importarModelos([{id:'a',nome:'A',camada:1.5}]));
});

test('renderizador real remove só objetos migrados, mantendo pincéis e fundo sem alterar mapa',()=>{
 const file=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8'),block=file.slice(file.indexOf('window.novaSyncRenderMap_=function'),file.indexOf('function map803LegacyRefs_'));
 const c={window:{},map803HidratarEstado_:x=>structuredClone(x),gm2staticMesaSvg_:x=>x};vm.createContext(c);vm.runInContext(block,c);
 const map={oficina2State:{elements:[{id:'tree',type:'object'},{id:'ink',type:'path'}]}};const result=c.window.novaSyncRenderMap_(map,{separateObjects:true});assert.equal(result.elements.length,1);assert.equal(result.elements[0].id,'ink');assert.equal(map.oficina2State.elements.length,2);assert.equal(c.window.novaSyncRenderMap_(map).elements.length,2);
});
