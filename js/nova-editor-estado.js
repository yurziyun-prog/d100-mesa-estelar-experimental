import {normalizarObjeto} from './nova-objetos.js?v=47';
// Reaplica somente as edições do mestre sobre o estado mais recente do combate.
export function aplicarEdicoes(scene,edits){
 const value={...(scene||{objects:[]})}; // v196: cópia rasa — cada edição troca só o que muda; o resto mantém a referência (o desenho da mesa é incremental)
 for(const e of edits){
  if(e.kind==='add')value.objects=[...(value.objects||[]),e.object];
  if(e.kind==='remove')value.objects=(value.objects||[]).filter(o=>o.id!==e.id);
  if(e.kind==='layer'||e.kind==='properties')value.objects=(value.objects||[]).map(o=>o.id===e.id?{...o,...(e.properties||{camada:e.camada})}:o);
  if(e.kind==='object')value.objects=(value.objects||[]).map(o=>o.id===e.id?{...o,x:Math.max(0,Math.min(28,o.x+e.dx)),y:Math.max(0,Math.min(14,o.y+e.dy))}:o);
  if(e.kind==='native'){const p=value.offsets?.[e.id]||{x:0,y:0};value.offsets={...value.offsets,[e.id]:{x:p.x+e.dx,y:p.y+e.dy}};}
  if(e.kind==='hide')value.hiddenElements=[...new Set([...(value.hiddenElements||[]),e.id])];
  if(e.kind==='removeStroke')value.strokes=(value.strokes||[]).filter(s=>s.id!==e.id);
  if(e.kind==='draw')value.strokes=[...(value.strokes||[]),e.stroke];
 }
 return value;
}
export function formaMesa(kind,start,end,map,style){
 let w=Math.max(.1,Math.abs(end.x-start.x)),h=Math.max(.1,Math.abs(end.y-start.y));
 if(kind==='square'||kind==='circle'){const side=Math.min(w*(map.larguraM||28)/28,h*(map.alturaM||14)/14);w=side*28/(map.larguraM||28);h=side*14/(map.alturaM||14);}
 return normalizarObjeto({id:crypto.randomUUID(),nome:style.nome||'Forma',forma:kind,x:Math.min(start.x,end.x)+w/2,y:Math.min(start.y,end.y)+h/2,larguraM:w*(map.larguraM||28)/28,alturaM:h*(map.alturaM||14)/14,...style});
}
