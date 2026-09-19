// Modelo é referência; valores explícitos da instância, inclusive 0/false, prevalecem.
const present=v=>v!==undefined&&v!==null;
const number=(v,d=0)=>Number.isFinite(Number(v))&&v!==''?Number(v):d;
const bool=(v,d=false)=>!present(v)?d:typeof v==='string'?['true','1','sim','yes'].includes(v.toLowerCase().trim()):!!v;
const pick=(o,m,keys,d)=>{for(const src of [o,m])for(const k of keys)if(present(src[k]))return src[k];return d;};
export function camadaPadrao(o={}){return ['terreno','terrain'].includes(o.tipo)?1:o.bloqueiaMovimento===false?2:3;}
export function normalizarObjeto(o={},m={}){
 const get=(keys,d)=>pick(o,m,keys,d),pv=Math.max(0,number(get(['pvMax','pv'],0))),infl=Math.min(5,Math.max(0,number(get(['inflamabilidade'],bool(get(['inflamavel'],false))?3:0))));
 return {...structuredClone(o),objetoSchema:1,id:String(o.id||''),modeloId:String(get(['modeloId','objetoBancoId'],m.id||'')),tipo:String(get(['tipo'],'objeto')),nome:String(get(['nome'],'Objeto')),imagem:String(get(['imagem','src'],'')),
 x:number(o.x),y:number(o.y),larguraM:Math.max(.1,number(get(['larguraM','largura','w'],1),1)),alturaM:Math.max(.1,number(get(['alturaM','altura','h'],1),1)),angulo:number(get(['angulo','rot'],0)),camada:Math.trunc(number(get(['camada'],camadaPadrao({...m,...o})),3)),material:String(get(['material'],'')),pesoKg:Math.max(0,number(get(['pesoKg','peso'],0))),
 pvMax:pv,pvAtual:number(get(['pvAtual'],pv),pv),dureza:Math.max(0,number(get(['dureza','pa'],0))),destrutivel:bool(get(['destrutivel'],pv>0)),destruido:bool(get(['destruido'],false)),inflamabilidade:infl,inflamavel:bool(get(['inflamavel'],infl>0)),pegandoFogo:bool(get(['pegandoFogo','emChamas'],false)),estadoFogo:structuredClone(get(['estadoFogo','fogo'],{})),bloqueiaMovimento:bool(get(['bloqueiaMovimento'],false)),bloqueiaVisao:bool(get(['bloqueiaVisao'],false)),fixoAoMapa:bool(get(['fixoAoMapa','fixada','locked'],false))};
}
export function criarObjeto(model,{id,x,y,tipo='objeto'}){
 // Não copiar dados particulares do banco ou estado de outra instância.
 const base=normalizarObjeto({id,modeloId:model.id,tipo,x,y},model);
 // Imagem do modelo é hidratada na leitura, evitando duplicar data URLs no Firestore.
 delete base.imagem;return base;
}
export function objetosDoMapa(map){
 const w=number(map.larguraM||map.oficina2State?.w,28),h=number(map.alturaM||map.oficina2State?.h,14),out=new Map();
 for(const [i,o]of (map.objetos||[]).entries()){const id=String(o.id||'objeto-'+i);out.set(id,{...o,id:'map:'+id,mapObjectId:id,tipo:'objeto',modeloId:o.modeloId||o.objetoBancoId||'',x:number(o.x)*28/w,y:number(o.y)*14/h});}
 for(const [i,e]of (map.oficina2State?.elements||[]).entries()){
  if(e.type!=='object')continue;const id=String(e.id||'elemento-'+i),old=out.get(id)||{};
  out.set(id,{...old,...e,id:'map:'+id,mapObjectId:id,tipo:'objeto',modeloId:e.modeloId||e.objetoBancoId||old.modeloId||'',x:(number(e.x)+number(e.w,1)/2)*28/w,y:(number(e.y)+number(e.h,1)/2)*14/h,larguraM:number(e.w,1),alturaM:number(e.h,1),angulo:number(e.rot),imagem:e.imagem||e.src||old.imagem});
 }
 return [...out.values()].map(o=>Object.fromEntries(Object.entries(o).filter(([,v])=>v!==undefined)));
}
export function prepararCena(scene,map,seeds,models){
 const current=scene?.mapId===map.id?scene:{mapId:map.id,objects:[]};
 const objects=[...(current.objects||[])];
 if(!current.objetosMapaImportados){const ids=new Set(objects.map(o=>o.id));for(const o of seeds)if(!ids.has(o.id))objects.push(o);}
 return {...current,objetoSchema:1,objetosMapaImportados:true,objects:objects.map(o=>{
  const n=normalizarObjeto(o,models.get(o.modeloId)||{});
  if(!o.imagem&&o.modeloId)delete n.imagem;
  return n;
 })};
}
export const colunasObjetos=['id','nome','tipoVisual','larguraM','alturaM','camada','material','pesoKg','pvMax','dureza','destrutivel','inflamabilidade','inflamavel','bloqueiaMovimento','bloqueiaVisao','fixoAoMapa','imagem'];
export function importarModelos(rows,existing=[]){
 const seen=new Set();return rows.map((r,i)=>{
  const id=String(r.id||'').trim();if(!/^[a-zA-Z0-9_-]+$/.test(id))throw Error('Linha '+(i+2)+': ID obrigatório; use letras, números, _ ou -.');if(seen.has(id))throw Error('ID repetido: '+id);seen.add(id);
  const old=existing.find(o=>o.id===id)||{},next={...old,id};
  for(const k of colunasObjetos){const v=r[k];if(!present(v)||String(v).trim()==='')continue;
   if(['destrutivel','inflamavel','bloqueiaMovimento','bloqueiaVisao','fixoAoMapa'].includes(k)){if(!/^(true|false|1|0|sim|não|nao|yes|no)$/i.test(String(v).trim()))throw Error('Valor inválido em '+k+': '+id);next[k]=bool(v);}
   else if(['larguraM','alturaM','camada','pesoKg','pvMax','dureza','inflamabilidade'].includes(k)){const n=Number(String(v).replace(',','.'));if(!Number.isFinite(n)||(k==='camada'&&!Number.isInteger(n))||(k!=='camada'&&n<0)||(['larguraM','alturaM'].includes(k)&&n===0)||(k==='inflamabilidade'&&n>5))throw Error('Número inválido em '+k+': '+id);next[k]=n;}else next[k]=String(v);
  }
  if(!next.nome)throw Error('Nome obrigatório: '+id);
  const normalized=normalizarObjeto(next);for(const k of colunasObjetos)if(present(normalized[k]))next[k]=normalized[k];
  return next;
 });
}
