export function criarEditorMesa({board,root,database,scenePath,mapPath,positionPath,enabled,map,scene,fail,changed}){
 let gesture=null,tool='move',pending=false;
 let paintedScene,paintedActive,paintedTool,paintedBase,paintedPoints;
 const svgNS='http://www.w3.org/2000/svg';
 const point=event=>{const rect=board.getBoundingClientRect();return {x:Math.max(0,Math.min(28,(event.clientX-rect.left)/board.clientWidth*28)),y:Math.max(0,Math.min(14,(event.clientY-rect.top)/board.clientHeight*14))};};
 function paint(){
  const active=enabled(),currentScene=scene(),base=board.querySelector('[data-map-layer]')?.firstChild,points=gesture?.stroke?.points.length||0;
  if(paintedScene===currentScene&&paintedActive===active&&paintedTool===tool&&paintedBase===base&&paintedPoints===points)return;
  paintedScene=currentScene;paintedActive=active;paintedTool=tool;paintedBase=base;paintedPoints=points;board.dataset.editing=active?'true':'false';
  for(const element of board.querySelectorAll('[data-eid]')){
   const offset=scene()?.offsets?.[element.dataset.eid]||{x:0,y:0},svg=element.ownerSVGElement;
   element.setAttribute('transform','translate('+(offset.x*(svg.viewBox.baseVal.width||28)/28)+' '+(offset.y*(svg.viewBox.baseVal.height||14)/14)+')');
   element.style.pointerEvents=active&&tool==='move'?'all':'none';element.style.cursor=active?'move':'';
  }
  for(const element of board.querySelectorAll('[data-scene-object]')){element.style.pointerEvents=active&&tool==='move'?'auto':'none';element.style.cursor=active?'move':'';}
  let ink=board.querySelector('[data-ink-layer]');
  if(!ink){ink=root.createElementNS(svgNS,'svg');ink.dataset.inkLayer='';ink.setAttribute('viewBox','0 0 28 14');ink.setAttribute('preserveAspectRatio','none');ink.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4';board.append(ink);}
  ink.replaceChildren();
  const strokes=[...(scene()?.strokes||[])];if(gesture?.kind==='draw')strokes.push(gesture.stroke);
  for(const stroke of strokes){const path=root.createElementNS(svgNS,'polyline');path.setAttribute('points',stroke.points.map(item=>item.x+','+item.y).join(' '));path.setAttribute('fill','none');path.setAttribute('stroke',stroke.color);path.setAttribute('stroke-width','3');path.setAttribute('vector-effect','non-scaling-stroke');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');ink.append(path);}
  for(const [id,value]of [['novaSyncEditMove','move'],['novaSyncEditDraw','draw']])root.getElementById(id)?.setAttribute('aria-pressed',String(tool===value));
 }
 async function commit(edit){
  const expectedMap=edit.mapId??map()?.mapId??'';pending=true;changed();
  try{await database.transact(async transaction=>{
   const state=await transaction.get(mapPath)||{};
   if(state.combat?.active||(state.mapId||'')!==expectedMap)throw Error('O mapa ou o combate mudou. A edição foi cancelada.');
   if(edit.kind==='token'){
    const path=positionPath+'/'+edit.id,token=await transaction.get(path);if(!token)return;
    transaction.set(path,{...token,x:Math.max(.7,Math.min(27.3,token.x+edit.dx)),y:Math.max(.7,Math.min(13.3,token.y+edit.dy)),revision:token.revision+1});
   }else{
    const saved=await transaction.get(scenePath),value=saved?.mapId===expectedMap?saved:{mapId:expectedMap,objects:[]};
    if(edit.kind==='object')value.objects=(value.objects||[]).map(object=>object.id===edit.id?{...object,x:Math.max(0,Math.min(28,object.x+edit.dx)),y:Math.max(0,Math.min(14,object.y+edit.dy))}:object);
    if(edit.kind==='native'){const offset=value.offsets?.[edit.id]||{x:0,y:0};value.offsets={...value.offsets,[edit.id]:{x:offset.x+edit.dx,y:offset.y+edit.dy}};}
    if(edit.kind==='draw')value.strokes=[...(value.strokes||[]),edit.stroke];
    if(edit.kind==='undo')value.strokes=(value.strokes||[]).slice(0,-1);
    transaction.set(scenePath,value);
   }
  });}catch(error){fail(error);}finally{pending=false;changed();}
 }
 function begin(event){
  if(!enabled())return false;
  if(pending)return true;
  event.preventDefault();const start=point(event);
  const token=event.target.closest('[data-token]'),object=event.target.closest('[data-scene-object]'),native=event.target.closest('[data-eid]');
  if(tool==='draw')gesture={kind:'draw',stroke:{id:crypto.randomUUID(),color:root.getElementById('novaSyncInk')?.value||'#ffd447',points:[start]}};
  else{
   const element=token||object||native;if(!element)return true;
   gesture={kind:token?'token':object?'object':'native',id:token?.dataset.token||object?.dataset.sceneObject||native.dataset.eid,element,start,left:element.style.left,top:element.style.top,transform:element.getAttribute('transform')||'',dx:0,dy:0};
  }
  gesture.pointer=event.pointerId;gesture.mapId=map()?.mapId||'';board.setPointerCapture(event.pointerId);return true;
 }
 board.addEventListener('pointermove',event=>{
  if(!gesture||event.pointerId!==gesture.pointer)return;
  if(!enabled()||gesture.mapId!==(map()?.mapId||'')){cancel();return;}
  const next=point(event);
  if(gesture.kind==='draw'){
   const last=gesture.stroke.points.at(-1);
   if(Math.hypot(next.x-last.x,next.y-last.y)>.025&&gesture.stroke.points.length<2000){gesture.stroke.points.push(next);paint();}
  }else{
   gesture.dx=next.x-gesture.start.x;gesture.dy=next.y-gesture.start.y;
   if(gesture.kind==='native'){
    const bounds=gesture.element.ownerSVGElement.viewBox.baseVal;
    gesture.element.setAttribute('transform',gesture.transform+' translate('+gesture.dx*bounds.width/28+' '+gesture.dy*bounds.height/14+')');
   }else{gesture.element.style.transition='none';gesture.element.style.left=(parseFloat(gesture.left)+gesture.dx/28*100)+'%';gesture.element.style.top=(parseFloat(gesture.top)+gesture.dy/14*100)+'%';}
  }
 });
 function cancel(){gesture=null;paintedBase=null;changed();}
 board.addEventListener('pointerup',event=>{if(!gesture||event.pointerId!==gesture.pointer)return;const edit=gesture;gesture=null;paintedBase=null;if(enabled()&&edit.mapId===(map()?.mapId||'')&&(edit.kind==='draw'?edit.stroke.points.length>1:edit.dx||edit.dy))commit(edit);else changed();});
 board.addEventListener('pointercancel',cancel);board.addEventListener('lostpointercapture',()=>{if(gesture)cancel();});root.defaultView.addEventListener('blur',()=>{if(gesture)cancel();});
 for(const [id,value]of [['novaSyncEditMove','move'],['novaSyncEditDraw','draw']])root.getElementById(id)?.addEventListener('click',()=>{tool=value;paint();});
 root.getElementById('novaSyncEditUndo')?.addEventListener('click',()=>{if(enabled()&&!pending)commit({kind:'undo'});});
 return {begin,paint,close(){gesture=null;},get busy(){return pending;}};
}
