import {normalizarObjeto} from './nova-objetos.js?v=80';
const clone=x=>structuredClone(x);
// O documento do cenário contém geometria e referências, não cópias do banco.
export function limparObjetoOficina(o){
 const next=clone(o);
 delete next.dadosBanco;delete next.src;delete next.image;
 if(next.oficinaElement){
  const e=next.oficinaElement;
  delete e.dadosBanco;delete e.imagem;delete e.image;
  if(e.mapRef)delete e.src;
  // A fonte independente existe uma única vez, dentro do elemento visual.
  delete next.imagem;
 }
 return next;
}
export async function compactarPublicacaoOficina(publication,{modelFor=()=>null,uploadImage=async src=>src}={}){
 const out=clone(publication),cache=new Map();
 const image=async src=>{if(!String(src||'').startsWith('data:image/'))return src;if(!cache.has(src))cache.set(src,Promise.resolve(uploadImage(src)));return cache.get(src);};
 out.objects=await Promise.all(out.objects.map(async original=>{
  const o=limparObjetoOficina(original),e=o.oficinaElement;
  if(e){
   const m=await modelFor(o),src=e.src||original.imagem||'';
   if(o.modeloId&&m&&(src===(m.imagem||m.image)||(!src&&e.mapRef))){
    e.mapRef=true;e.modeloId=o.modeloId;delete e.src;
   }else{delete e.mapRef;e.src=await image(src);}
  }else if(o.imagem)o.imagem=await image(o.imagem);
  return o;
 }));
 return out;
}
export function hidratarReferenciasOficina(scene,{modelFor=()=>null}={}){
 const out=clone(scene||{});
 out.objects=(out.objects||[]).map(o=>{
  const model=modelFor(o)||null,src=String(model?.imagem||model?.image||'');
  if(!src)return o;
  if(!o.imagem)o.imagem=src;
  if(o.oficinaElement&&!o.oficinaElement.src)o.oficinaElement.src=src;
  return o;
 });
 return out;
}
export function mapaComCenaOficina(stored,scene){
 // Remove a representação visual anterior, inclusive imagens que foram apagadas.
 return {...stored,mesaScene:scene,oficina2State:estadoOficinaMesa(scene.oficinaConfig,scene),objetos:[],formas:[],desenhos:[],formato:'cena-oficina-v1',partes:0,oficina2:true};
}
export function validarTamanhoOficina(data){
 const bytes=new TextEncoder().encode(JSON.stringify(data)).length;
 if(bytes>850000)throw Error('O cenário preparado tem '+Math.ceil(bytes/1024)+' KB e excede o limite seguro de 830 KB. As edições continuam no rascunho.');
}
export function estadoOficinaMesa(base,scene){
 const state=clone(scene?.oficinaConfig||base);state.elements=[];
 if(!scene?.oficinaConfig){
  state.elements=clone(base.elements||[]).filter(e=>e.type!=='object'&&!scene?.hiddenElements?.includes(e.id)&&!scene?.objects?.some(o=>o.mapObjectId===e.id));
  for(const e of state.elements){const offset=scene?.offsets?.[e.id];if(offset){const dx=offset.x*state.w/28,dy=offset.y*state.h/14;if(e.points)e.points=e.points.map(p=>({...p,x:p.x+dx,y:p.y+dy}));else{e.x=(e.x||0)+dx;e.y=(e.y||0)+dy;if(e.x2!==undefined){e.x2+=dx;e.y2+=dy;}}}}
  for(const s of scene?.strokes||[])state.elements.push({id:s.id,type:'path',brush:'redondo',points:s.points.map(p=>({x:p.x*state.w/28,y:p.y*state.h/14})),stroke:s.color,strokeWidth:3,strokeWidthM:3/state.ppm,strokeOpacity:1,z:100});
 }else state.elements=clone(scene.oficinaErasers||[]);
 const kinds={rect:'retangulo',square:'quadrado',circle:'circulo',ellipse:'elipse',triangle:'triangulo'};
 for(const o of scene?.objects||[]){
  if(o.clock||o.tipo==='ilusao')continue;
  const x=o.x*state.w/28-o.larguraM/2,y=o.y*state.h/14-o.alturaM/2;
  let e=o.oficinaElement?clone(o.oficinaElement):{id:o.id,type:o.forma?'shape':'object',kind:kinds[o.forma],src:o.imagem||'',fill:o.cor||'#666666',stroke:o.borda||'#111111',strokeWidth:o.bordaLargura||0};
  if(['object','image','shape'].includes(e.type))Object.assign(e,{x,y,w:o.larguraM,h:o.alturaM,rot:o.angulo||0});
  Object.assign(e,{mesaObjectId:o.id,camada:o.camada??1,bloqueiaMovimento:!!o.bloqueiaMovimento,bloqueiaVisao:!!o.bloqueiaVisao,nome:o.nome,name:o.nome,opacity:o.oficinaElement?(e.opacity??1):(o.opacity??1),locked:!!o.fixoAoMapa,z:o.ordemOficina??e.z??1,modeloId:o.modeloId||'',src:o.imagem||e.src||'',
   pvMax:Number(o.pvMax||0),pvAtual:Number(o.pvAtual??o.pvMax??0),dureza:Number(o.dureza||0),destrutivel:o.destrutivel!==false&&Number(o.pvMax||0)>0,destruido:!!o.destruido});
  state.elements.push(e);
 }
 return state;
}
export function prepararPublicacaoOficina(state,baseScene,bounds){
 const baseObjects=new Map((baseScene?.objects||[]).map(o=>[o.id,o]));
 const objects=state.elements.filter(e=>e.type!=='eraser').map(e=>{
  const id=e.mesaObjectId||'oficina:'+e.id,old=baseObjects.get(id)||{},b=bounds(e);
  const pvMax=Math.max(0,Number(e.pvMax??old.pvMax??0)||0);
  const destrutivel=e.destrutivel!==undefined?!!e.destrutivel:(old.destrutivel!==undefined?!!old.destrutivel:pvMax>0);
  const pvAtual=destrutivel?Math.max(0,Math.min(pvMax,Number(e.pvAtual??old.pvAtual??pvMax)||0)):0;
  return normalizarObjeto({...old,id,nome:e.nome||e.name||old.nome||(e.type==='path'?'Desenho':'Forma'),imagem:e.src||old.imagem||'',modeloId:e.modeloId||old.modeloId||'',oficinaElement:clone(e),oficinaBounds:b,ordemOficina:e.z||0,x:(b.x+b.w/2)*28/state.w,y:(b.y+b.h/2)*14/state.h,larguraM:Math.max(.05,b.w),alturaM:Math.max(.05,b.h),angulo:e.rot||0,camada:e.camada??(e.type==='object'?3:1),bloqueiaMovimento:!!e.bloqueiaMovimento,bloqueiaVisao:!!e.bloqueiaVisao,fixoAoMapa:!!e.locked,opacity:1,
   pvMax,pvAtual,dureza:Math.max(0,Number(e.dureza??old.dureza??0)||0),destrutivel,destruido:destrutivel?!!(e.destruido??old.destruido):false});
 });
 const {elements,...config}=state;
 return {objects,config,erasers:clone(elements.filter(e=>e.type==='eraser'))};
}
export function publicarOficina(fresh,base,publication){
 if((fresh?.editorRevision||0)!==(base?.editorRevision||0))throw Error('Outro mestre salvou o cenário. Reabra a edição para carregar essa versão.');
 const old=new Map((base?.objects||[]).map(o=>[o.id,o])),next=new Map(publication.objects.map(o=>[o.id,o]));
 const keep=(fresh?.objects||[]).filter(o=>!old.has(o.id)||next.has(o.id)||o.clock);
 const merged=keep.map(o=>{
  const edited=next.get(o.id);if(!edited)return o;
  const {pvAtual,pvMax,pegandoFogo,estadoFogo,destruido,...visual}=edited;
  const before=old.get(o.id)||{};const patch=Object.fromEntries(Object.entries(visual).filter(([k,v])=>JSON.stringify(v)!==JSON.stringify(before[k])));return {...o,...patch};
 });
 for(const o of publication.objects)if(!old.has(o.id)&&!merged.some(v=>v.id===o.id))merged.push(o);
 return {...fresh,objects:merged.map(limparObjetoOficina),oficinaConfig:publication.config,oficinaErasers:publication.erasers,offsets:{},strokes:[],hiddenElements:[],objetosMapaImportados:true,editorRevision:(fresh?.editorRevision||0)+1};
}
