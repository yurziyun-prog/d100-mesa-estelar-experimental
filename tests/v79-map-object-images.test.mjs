import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizarObjeto,objetosDoMapa,prepararCena} from '../js/nova-objetos.js';

test('src vazio de referência não mascara imagem do modelo',()=>{
  const model={id:'arvore',nome:'Árvore',imagem:'data:image/png;base64,AAA',larguraM:2,alturaM:2};
  const hydrated=normalizarObjeto({id:'x',modeloId:'arvore',src:'',imagem:''},model);
  assert.equal(hydrated.imagem,model.imagem);
});

test('mapa importado preserva metadados visuais da Oficina e migra arquivo antigo',()=>{
  const map={id:'floresta',larguraM:28,alturaM:14,oficina2State:{w:28,h:14,elements:[{id:'o1',type:'object',modeloId:'arvore',objetoBancoId:'arvore',x:3,y:4,w:2,h:2,src:'',mapRef:true}]},objetos:[{id:'o1',modeloId:'arvore',objetoBancoId:'arvore',x:4,y:5,larguraM:2,alturaM:2}]};
  const model={id:'arvore',nome:'Árvore',imagem:'data:image/png;base64,AAA',larguraM:2,alturaM:2};
  const seeds=objetosDoMapa(map);
  assert.equal(seeds.length,1);
  assert.ok(seeds[0].oficinaElement);
  assert.deepEqual(seeds[0].oficinaBounds,{x:3,y:4,w:2,h:2});
  let scene=prepararCena({mapId:'floresta',objetosMapaImportados:true,objects:[{id:'map:o1',mapObjectId:'o1',modeloId:'arvore',tipo:'objeto',x:4,y:5,larguraM:2,alturaM:2,src:''}]},map,seeds,new Map([['arvore',model]]));
  assert.ok(scene.objects[0].oficinaElement,'arquivo antigo deve ganhar oficinaElement');
  const visual=normalizarObjeto(scene.objects[0],model);
  assert.equal(visual.imagem,model.imagem,'imagem do modelo deve reaparecer após sincronização');
});
