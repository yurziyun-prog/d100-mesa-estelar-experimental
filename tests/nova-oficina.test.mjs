import test from 'node:test';import assert from 'node:assert/strict';
import {estadoOficinaMesa,prepararPublicacaoOficina,publicarOficina,compactarPublicacaoOficina,hidratarReferenciasOficina,mapaComCenaOficina,validarTamanhoOficina} from '../js/nova-oficina.js';
const config={w:28,h:14,ppm:32,bg:'#777777',elements:[]};const bounds=e=>({x:e.x,y:e.y,w:e.w,h:e.h});
test('Oficina reaproveita objetos existentes e converte desenho antigo em pincel editável',()=>{const s=estadoOficinaMesa(config,{objects:[{id:'box',nome:'Caixa',x:4,y:4,larguraM:2,alturaM:2,camada:3,angulo:20}],strokes:[{id:'old',color:'#ffffff',points:[{x:1,y:1},{x:2,y:2}]}]});assert.equal(s.elements[0].type,'path');assert.equal(s.elements[1].mesaObjectId,'box');assert.equal(s.elements[1].x,3);assert.equal(s.elements[1].rot,20);});
test('publicação preserva dano, fogo, movimento recente e objetos criados durante edição',()=>{
 const base={objects:[{id:'box',x:4,y:4,larguraM:2,alturaM:2,angulo:0,pvMax:10,pvAtual:10,pegandoFogo:false,camada:3}]};const st=estadoOficinaMesa(config,base);st.elements[0].fill='#123456';const pub=prepararPublicacaoOficina(st,base,bounds);
 const fresh={...base,objects:[{...base.objects[0],x:8,pvAtual:4,pegandoFogo:true},{id:'new',clock:{remaining:42}}]};const saved=publicarOficina(fresh,base,pub);assert.equal(saved.objects[0].pvAtual,4);assert.equal(saved.objects[0].pegandoFogo,true);assert.equal(saved.objects[0].x,8);assert.equal(saved.objects[1].id,'new');assert.equal(saved.editorRevision,1);
 assert.throws(()=>publicarOficina(saved,base,pub),/Outro mestre/);
});
test('muro mantém pincel, opacidade e camada ao reabrir',()=>{const st={...config,elements:[{id:'wall',type:'shape',kind:'retangulo',x:2,y:3,w:4,h:1,fill:'#ffffff',opacity:.4,camada:3,bloqueiaMovimento:true,rot:30}]};const pub=prepararPublicacaoOficina(st,{objects:[]},bounds);const scene=publicarOficina({objects:[]},{objects:[]},pub);const opened=estadoOficinaMesa(config,scene);assert.equal(opened.elements[0].opacity,.4);assert.equal(opened.elements[0].camada,3);assert.equal(opened.elements[0].bloqueiaMovimento,true);assert.equal(opened.elements[0].rot,30);});
test('mapa com imagens repetidas de 500 KB salva referências e remoções, sem snapshots antigos',async()=>{
 const src='data:image/png;base64,'+'A'.repeat(500000),model={id:'tree',imagem:src};
 const base={mapId:'map',objects:Array.from({length:12},(_,i)=>({id:'tree'+i,modeloId:'tree',imagem:src,src,dadosBanco:model,x:i+1,y:3,larguraM:1,alturaM:1,pvMax:10,pvAtual:6}))};
 const st=estadoOficinaMesa(config,base);st.elements.pop();st.elements.push({id:'square',type:'shape',kind:'quadrado',x:2,y:2,w:1,h:1,fill:'#111111'});
 const raw=prepararPublicacaoOficina(st,base,bounds);assert.ok(JSON.stringify(raw).length>1000000);
 let uploads=0;const pub=await compactarPublicacaoOficina(raw,{modelFor:()=>model,uploadImage:()=>{uploads++;throw Error('Imagem do banco não deve ser reenviada');}});
 const scene=publicarOficina(base,base,pub),map=mapaComCenaOficina({oficina2State:{...config,elements:[{src}]},objetos:[{imagem:src}],formato:'partes-v1',partes:8},scene);
 validarTamanhoOficina(scene);validarTamanhoOficina(map);assert.ok(JSON.stringify(map).length<40000);assert.equal(uploads,0);
 assert.equal(scene.objects.length,12);assert.equal(scene.objects.some(o=>o.id==='tree11'),false);assert.equal(scene.objects[0].pvAtual,6);assert.equal(scene.objects[0].oficinaElement.mapRef,true);assert.equal(JSON.stringify(map).includes(src),false);assert.equal(map.partes,0);assert.notEqual(map.formato,'partes-v1');
 const reopened=estadoOficinaMesa(config,{...scene,objects:scene.objects.map(o=>({...o,imagem:o.modeloId?src:''}))});assert.equal(reopened.elements[0].src,src);
});
test('imagem importada é enviada uma vez; URL e desenho sobrevivem ao salvamento',async()=>{
 const src='data:image/png;base64,'+'A'.repeat(900000),state={...config,elements:[0,1].map(i=>({id:'image'+i,type:'image',src,x:i,y:2,w:3,h:4}))};let uploads=0;
 const pub=await compactarPublicacaoOficina(prepararPublicacaoOficina(state,{objects:[]},bounds),{uploadImage:async data=>{assert.equal(data,src);uploads++;return 'https://example.test/image.png';}});
 const scene=publicarOficina({objects:[]},{objects:[]},pub);validarTamanhoOficina(scene);assert.equal(uploads,1);assert.equal(scene.objects[0].oficinaElement.src,'https://example.test/image.png');assert.equal(scene.objects[0].imagem,undefined);assert.equal(state.elements[0].src,src);
 await assert.rejects(()=>compactarPublicacaoOficina(prepararPublicacaoOficina(state,{objects:[]},bounds),{uploadImage:async()=>{throw Error('Falha no envio');}}),/Falha no envio/);
});

test('referência do banco recupera a imagem só para exibição, sem inflar o cenário salvo',()=>{
 const scene={objects:[{id:'tree',modeloId:'syncobjeto:tree',oficinaElement:{id:'tree-e',type:'object',mapRef:true,modeloId:'syncobjeto:tree'},oficinaBounds:{x:1,y:1,w:2,h:2}}]};
 const hydrated=hidratarReferenciasOficina(scene,{modelFor:o=>String(o.modeloId).endsWith(':tree')?{id:'tree',imagem:'https://example.test/tree.png'}:null});
 assert.equal(hydrated.objects[0].imagem,'https://example.test/tree.png');assert.equal(hydrated.objects[0].oficinaElement.src,'https://example.test/tree.png');
 assert.equal(scene.objects[0].imagem,undefined);assert.equal(scene.objects[0].oficinaElement.src,undefined);
});

test('formas da Oficina preservam PV, dureza e estado destrutível quando publicados',()=>{
 const st={...config,elements:[{id:'wall',type:'shape',kind:'retangulo',x:2,y:2,w:2,h:.5,camada:3,bloqueiaMovimento:true,pvMax:12,pvAtual:12,dureza:4,destrutivel:true}]};
 const pub=prepararPublicacaoOficina(st,{objects:[]},bounds);assert.equal(pub.objects[0].pvMax,12);assert.equal(pub.objects[0].pvAtual,12);assert.equal(pub.objects[0].dureza,4);assert.equal(pub.objects[0].destrutivel,true);
 const ind={...config,elements:[{id:'wall2',type:'shape',kind:'retangulo',x:1,y:1,w:1,h:1,camada:3,bloqueiaMovimento:true,pvMax:0,dureza:7,destrutivel:false}]};
 const pub2=prepararPublicacaoOficina(ind,{objects:[]},bounds);assert.equal(pub2.objects[0].pvMax,0);assert.equal(pub2.objects[0].dureza,7);assert.equal(pub2.objects[0].destrutivel,false);
});
