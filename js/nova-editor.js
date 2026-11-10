import {ehChao} from './mesa-chao.js?v=200';
import {aplicarEdicoes,formaMesa} from './nova-editor-estado.js?v=55';
import {conterTokenNoMapa} from './nova-colisao.js?v=59';
export function criarEditorMesa({board,root,database,scenePath,mapPath,positionPath,enabled,map,scene,fail,changed,tokens=()=>new Map(),archivePath=id=>scenePath+id}){
 let gesture=null,tool='move',pending=false,selection=null,edits=[],redo=[],draftMap=null,previewSource=null,previewCache=null;
 const source=scene;
 function preview(){if(draftMap!==null&&map()&&draftMap!==(map()?.mapId||'')){edits=[];redo=[];draftMap=null;selection=null;previewSource=null;}
  const current=source();if(previewSource!==current||!previewCache){previewSource=current;previewCache=edits.length?aplicarEdicoes(current,edits):current;}return previewCache;
 }
 scene=preview;
 const toolbar=root.getElementById('novaSyncEditorTools');
 const extra=root.createElement('div');extra.style.cssText='display:flex;gap:6px;flex-wrap:wrap;align-items:center;width:100%';
 extra.innerHTML='<label>Forma <select id="novaSyncShape"><option value="move">Selecionar</option><option value="draw">Lápis</option><option value="rect">Retângulo</option><option value="square">Quadrado</option><option value="triangle">Triângulo</option><option value="circle">Círculo</option><option value="ellipse">Elipse</option></select></label><label>Nome <input id="novaEditName" value="Muro" size="9"></label><label>Opacidade <input id="novaEditOpacity" type="number" min="0" max="1" step="0.1" value="1" style="width:60px"></label><label>Borda <input id="novaEditBorder" type="color" value="#111111"></label><input id="novaEditBorderWidth" aria-label="Espessura da borda" type="number" min="0" value="1" style="width:55px"><label>Camada <input id="novaEditLayer" type="number" value="3" step="1" style="width:55px"></label><label><input id="novaEditBlock" type="checkbox" checked> Bloqueia movimento</label><label><input id="novaEditShadow" type="checkbox"> Sombra</label><label>Largura (m) <input id="novaEditWidth" type="number" min="0.1" step="0.1" value="1" style="width:60px"></label><label>Altura (m) <input id="novaEditHeight" type="number" min="0.1" step="0.1" value="1" style="width:60px"></label><label>Rotação <input id="novaEditAngle" type="number" value="0" style="width:65px"></label><button id="novaEditApply" type="button">Aplicar ao selecionado</button><button id="novaEditDuplicate" type="button">Duplicar</button><button id="novaEditRedo" type="button">Refazer</button><button id="novaEditDiscard" type="button">Descartar alterações</button><button id="novaEditSave" type="button">💾 Salvar mapa</button><span id="novaEditNotice" role="status"></span>';
 // Propriedades e comandos de formas são ocasionais: não ocupar a linha
 // principal do mapa permanentemente com dezenas de campos.
 const detalhesEditor=root.createElement('details');
 detalhesEditor.id='novaEditDetailsV263';
 detalhesEditor.style.cssText='width:100%;margin-top:5px;max-width:100%;padding:7px 9px;border:1px solid #4b657e;border-radius:8px;background:rgba(10,23,39,.72)';
 const tituloEditor=root.createElement('summary');
 tituloEditor.textContent='⚙️ Formas e propriedades do objeto';
 tituloEditor.style.cssText='cursor:pointer;font-weight:600;color:#d9eafa';
 detalhesEditor.append(tituloEditor,extra);
 toolbar?.append(detalhesEditor);
 const input=id=>root.getElementById(id),num=(id,fallback)=>{const n=Number(input(id).value);return Number.isFinite(n)?n:fallback;};
 function style(){return {nome:input('novaEditName').value||'Forma',cor:input('novaSyncInk').value,opacity:Math.max(0,Math.min(1,num('novaEditOpacity',1))),borda:input('novaEditBorder').value,bordaLargura:Math.max(0,num('novaEditBorderWidth',1)),camada:Math.trunc(num('novaEditLayer',3)),bloqueiaMovimento:input('novaEditBlock').checked,sombra:input('novaEditShadow').checked};}
 let autoTimer=null,optPorId=new Map(),optMapa='';
 // v143: o que o mestre move/retira fica registrado e é reaplicado se o mapa for refeito (mesa-fixos.js).
 function anotarMestreV143(a){if(!a)return;try{void root.defaultView.mesaFixosV143_?.anotar?.(a[0],a[1],a[2])?.catch?.(e=>console.warn('[Fixos]',e));}catch(_){}}
 // v112: salvamento automático do rascunho (1,5 s depois da última edição). Desligável: window.mesaAutoSalvar=false.
 function modified(cache=null){previewCache=cache;setTimeout(()=>{try{globalThis.dispatchEvent(new CustomEvent('mesa-rascunho-v197'));}catch(_){}},0);paintedScene=null;const auto=root.defaultView.mesaAutoSalvar===true;input('novaEditNotice').textContent=edits.length?(auto?'Salvando automaticamente…':'✏️ '+edits.length+' alteração(ões) ainda não salvas — clique em 💾 Salvar mapa.'):'';changed();
  clearTimeout(autoTimer);if(auto&&edits.length)autoTimer=setTimeout(function tentar(){if(!edits.length)return;if(pending||gesture||!enabled()){autoTimer=setTimeout(tentar,1200);return;}void save();},1500);
 }
 function selectObject(id){const o=scene()?.objects?.find(o=>o.id===id);if(!o)return;selection={kind:'object',id};objectSelect.value=id;showLayer();
  for(const [key,value]of Object.entries({novaEditName:o.nome,novaEditOpacity:o.opacity??1,novaEditLayer:o.camada,novaEditWidth:o.larguraM,novaEditHeight:o.alturaM,novaEditAngle:o.angulo,novaEditBorderWidth:o.bordaLargura??0}))input(key).value=value;
  input('novaEditBlock').checked=!!o.bloqueiaMovimento;input('novaEditShadow').checked=!!o.sombra;
 }
 input('novaSyncShape').onchange=()=>{tool=input('novaSyncShape').value;paint();};
 input('novaEditApply').onclick=()=>{if(enabled()&&selection?.kind==='native')convertNative();if(enabled()&&selection?.kind==='object')commit({kind:'properties',id:selection.id,properties:{...style(),larguraM:Math.max(.1,num('novaEditWidth',1)),alturaM:Math.max(.1,num('novaEditHeight',1)),angulo:num('novaEditAngle',0)}});};
 input('novaEditDuplicate').onclick=()=>{const o=scene()?.objects?.find(o=>o.id===selection?.id);if(enabled()&&o)commit({kind:'add',object:{...o,id:crypto.randomUUID(),x:Math.min(28,o.x+.5),y:Math.min(14,o.y+.5)}});};
 input('novaEditRedo').onclick=()=>{if(enabled()&&redo.length){edits.push(redo.pop());modified();}};
 input('novaEditDiscard').onclick=()=>{if(enabled()&&edits.length&&root.defaultView.confirm('Descartar as alterações ainda não salvas?')){edits=[];redo=[];lotes.length=0;refazLotes.length=0;modified();}};
 input('novaEditSave').onclick=save;
 /** v205: devolve {estado,...}: 'bloqueado-papel' (seletor fora de Mestre / sem permissão de mestre) · 'ocupado' (outra gravação em andamento) · 'sem-mudancas' · 'confirmado' · 'falhou' (com erro.code/erro.message originais). Antes devolvia undefined e o erro só ia para a barra de status. */
 async function save(){const op={id:'op_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),mapa:map()?.mapId||'',edicoes:edits.length,caminhos:[scenePath,(map()?.mapId||'')?archivePath(map()?.mapId||''):'',(map()?.mapId||'')?'mapas/'+(map()?.mapId||''):''].filter(Boolean)};
  if(!enabled())return {...op,estado:'bloqueado-papel'};if(pending)return {...op,estado:'ocupado'};if(!edits.length)return {...op,estado:'sem-mudancas'};
  pending=true;let anotarV143=null,resultado={...op,estado:'confirmado'};changed();const expected=map()?.mapId||'',batch=[...edits];
  try{await database.transact(async tx=>{const state=await tx.get(mapPath),fresh=await tx.get(scenePath),savedMap=expected?await tx.get('mapas/'+expected):null;
   if((state?.mapId||'')!==expected)throw Error('O mapa mudou. Abra novamente o cenário antes de salvar.');
   const antesV143=fresh?.mapId===expected?fresh:{mapId:expected,objects:[]};
   const next=aplicarEdicoes(antesV143,batch);next.mapId=expected;anotarV143=[expected,antesV143,next];
   tx.set(scenePath,next);if(expected){tx.set(archivePath(expected),next);if(savedMap)tx.set('mapas/'+expected,{...savedMap,mesaScene:next});}
  });edits=[];redo=[];lotes.length=0;refazLotes.length=0;previewCache=null;paintedScene=null;setTimeout(()=>{try{globalThis.dispatchEvent(new CustomEvent('mesa-rascunho-v197'));}catch(_){}},0);input('novaEditNotice').textContent='Mapa salvo e sincronizado.';anotarMestreV143(anotarV143);
  }catch(e){resultado={...op,estado:'falhou',erro:{code:String(e?.code||''),message:String(e?.message||e)}};fail(e);}finally{pending=false;changed();}
  return resultado;
 }
 function convertNative(){
  const element=[...board.querySelectorAll('[data-eid]')].find(n=>n.dataset.eid===selection?.id);if(!element)return;
  const svg=element.ownerSVGElement,bounds=element.getBBox(),vb=svg.viewBox.baseVal,offset=scene()?.offsets?.[selection.id]||{x:0,y:0};if(!bounds.width||!bounds.height)return;
  const copy=element.cloneNode(true);copy.removeAttribute('transform');copy.style.pointerEvents='none';copy.style.display='';
  const image='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+[bounds.x,bounds.y,bounds.width,bounds.height].join(' ')+'">'+[...svg.querySelectorAll('defs')].map(n=>n.outerHTML).join('')+copy.outerHTML+'</svg>';
  const id=crypto.randomUUID(),object={id,nome:'Elemento do mapa',imagem:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(image),x:(bounds.x+bounds.width/2)*28/vb.width+offset.x,y:(bounds.y+bounds.height/2)*14/vb.height+offset.y,larguraM:bounds.width/vb.width*(map()?.larguraM||28),alturaM:bounds.height/vb.height*(map()?.alturaM||14),angulo:0,camada:3};
  commit({kind:'hide',id:selection.id});commit({kind:'add',object});selection={kind:'object',id};
 }
 function removeSelected(){
  if(!enabled()||!selection||selection.kind==='token')return;
  const current={...selection};selection=null;
  if(current.kind==='object')void commit({kind:'remove',id:current.id,mapId:map()?.mapId||'',immediate:true});
  else commit({kind:'hide',id:current.id});
 }
 root.defaultView.addEventListener('beforeunload',event=>{if(edits.length){event.preventDefault();event.returnValue='';}});
 const objectSelect=root.createElement('select'),layerInput=root.createElement('input'),applyLayer=root.createElement('button');
 objectSelect.id='novaSyncObjectEdit';objectSelect.setAttribute('aria-label','Objeto para editar camada');objectSelect.style.maxWidth='180px';
 layerInput.id='novaSyncObjectLayer';layerInput.type='number';layerInput.step='1';layerInput.style.width='75px';layerInput.setAttribute('aria-label','Camada do objeto');layerInput.title='1 terreno · 2 piso · 3 obstáculos/personagens · 4 copa';
 applyLayer.id='novaSyncApplyLayer';applyLayer.type='button';applyLayer.textContent='Aplicar camada';
 root.getElementById('novaSyncEditorTools')?.append(objectSelect,layerInput,applyLayer);
 const showLayer=()=>{const o=scene()?.objects?.find(o=>o.id===objectSelect.value);layerInput.value=o?String(o.camada??3):'';layerInput.disabled=applyLayer.disabled=!o||pending;};
 objectSelect.addEventListener('change',()=>{selectObject(objectSelect.value);changed();});
 applyLayer.addEventListener('click',()=>{if(!enabled()||pending||!objectSelect.value)return;const camada=Number(layerInput.value);if(!Number.isSafeInteger(camada)||!layerInput.value){fail(Error('Informe uma camada inteira.'));return;}commit({kind:'layer',id:objectSelect.value,camada});});
 let paintedScene,paintedActive,paintedTool,paintedBase,paintedPoints;
 const svgNS='http://www.w3.org/2000/svg';
 const point=event=>{const rect=board.getBoundingClientRect();return {x:Math.max(0,Math.min(28,(event.clientX-rect.left)/board.clientWidth*28)),y:Math.max(0,Math.min(14,(event.clientY-rect.top)/board.clientHeight*14))};};
 function paint(){
  const active=enabled(),currentScene=scene(),base=board.querySelector('[data-map-layer]')?.firstChild,points=gesture?.stroke?.points.length||0;
  layerInput.disabled=applyLayer.disabled=pending||!objectSelect.value;
  if(paintedScene===currentScene&&paintedActive===active&&paintedTool===tool&&paintedBase===base&&paintedPoints===points)return;
  if(paintedScene!==currentScene){const selected=objectSelect.value,mapaDoSel=String(currentScene?.mapId||'');
   // v196: a lista de objetos é atualizada só no que mudou (antes era refeita inteira, com milhares de <option>, a cada peça posta)
   if(!objectSelect.options.length||optMapa!==mapaDoSel){objectSelect.replaceChildren();const empty=root.createElement('option');empty.value='';empty.textContent='Camada de objeto…';objectSelect.append(empty);optPorId=new Map();optMapa=mapaDoSel;}
   const vistos=new Set(),frag=root.createDocumentFragment();
   for(const o of currentScene?.objects||[]){const id=String(o.id),nome=o.nome||o.id;vistos.add(id);const ex=optPorId.get(id);if(!ex){const opt=root.createElement('option');opt.value=o.id;opt.textContent=nome;optPorId.set(id,opt);frag.append(opt);}else if(ex.textContent!==nome)ex.textContent=nome;}
   objectSelect.append(frag);for(const [id,opt] of [...optPorId])if(!vistos.has(id)){opt.remove();optPorId.delete(id);}
   objectSelect.value=selected;showLayer();}
  applyLayer.disabled=pending||!objectSelect.value;
  paintedScene=currentScene;paintedActive=active;paintedTool=tool;paintedBase=base;paintedPoints=points;board.dataset.editing=active?'true':'false';
  for(const element of board.querySelectorAll('[data-eid]')){
   element.style.display=scene()?.hiddenElements?.includes(element.dataset.eid)?'none':'';
   const offset=scene()?.offsets?.[element.dataset.eid]||{x:0,y:0},svg=element.ownerSVGElement;
   element.setAttribute('transform','translate('+(offset.x*(svg.viewBox.baseVal.width||28)/28)+' '+(offset.y*(svg.viewBox.baseVal.height||14)/14)+')');
   element.style.pointerEvents=active&&tool==='move'?'all':'none';element.style.cursor=active?'move':'';element.style.outline=active&&selection?.id===element.dataset.eid?'2px solid #00d4ff':'';
  }
  for(const element of board.querySelectorAll('[data-scene-object]')){element.style.pointerEvents=active&&tool==='move'?'auto':'none';element.style.cursor=active?'move':'';}
  let ink=board.querySelector('[data-ink-layer]');
  if(!ink){ink=root.createElementNS(svgNS,'svg');ink.dataset.inkLayer='';ink.setAttribute('viewBox','0 0 28 14');ink.setAttribute('preserveAspectRatio','none');ink.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4';board.append(ink);}
  ink.replaceChildren();
  const strokes=[...(scene()?.strokes||[])];if(gesture?.kind==='draw')strokes.push(gesture.stroke);
  for(const stroke of strokes){const path=root.createElementNS(svgNS,'polyline');path.setAttribute('points',stroke.points.map(item=>item.x+','+item.y).join(' '));path.setAttribute('fill','none');path.setAttribute('stroke',stroke.color);path.setAttribute('stroke-width','3');path.setAttribute('vector-effect','non-scaling-stroke');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');ink.append(path);}
  for(const [id,value]of [['novaSyncEditMove','move'],['novaSyncEditDraw','draw']])root.getElementById(id)?.setAttribute('aria-pressed',String(tool===value));
 }
 const filaV143=[];
 async function commit(edit){
  // v143: um segundo arraste durante a sincronização do primeiro entra na fila (antes era descartado e o objeto “voltava”).
  if(pending&&enabled()&&root.defaultView.mesaEditorImediato===true&&(edit.kind==='object'||(edit.kind==='remove'&&edit.immediate))){filaV143.push(edit);previewCache=aplicarEdicoes(previewCache||source(),[edit]);changed();return;}
  if(pending||!enabled())return;
  // Arrastar ou retirar um objeto diretamente na mesa é uma ação operacional
  // do mestre, não um rascunho: persiste imediatamente para que jogadores,
  // colisão e salvamentos passem a usar a mesma cena, sem “fantasmas”.
  if((edit.kind==='object'||(edit.kind==='remove'&&edit.immediate))&&root.defaultView.mesaEditorImediato===true){ // v193: mover/retirar também é rascunho (salva em Salvar mapa); window.mesaEditorImediato=true volta ao modo antigo
   const expectedMap=edit.mapId??map()?.mapId??'',current=source();
   previewSource=current;previewCache=aplicarEdicoes(current,[edit]);pending=true;let anotarV143=null;
   input('novaEditNotice').textContent=edit.kind==='remove'?'Retirando objeto e sincronizando…':'Sincronizando posição do objeto…';changed();
   try{await database.transact(async transaction=>{
    const state=await transaction.get(mapPath)||{},saved=await transaction.get(scenePath),savedMap=expectedMap?await transaction.get('mapas/'+expectedMap):null;
    if((state.mapId||'')!==expectedMap)throw Error('O mapa ou o combate mudou. A edição foi cancelada.');
    const base=saved?.mapId===expectedMap?saved:{mapId:expectedMap,objects:[]};
    if(!base.objects?.some(o=>o.id===edit.id))throw Error('Objeto não encontrado.');
    const next=aplicarEdicoes(base,[edit]);next.mapId=expectedMap;anotarV143=[expectedMap,base,next];
    transaction.set(scenePath,next);
    if(expectedMap){transaction.set(archivePath(expectedMap),next);if(savedMap)transaction.set('mapas/'+expectedMap,{...savedMap,mesaScene:next});}
   });
   input('novaEditNotice').textContent=edit.kind==='remove'?'Objeto retirado e sincronizado.':'Posição sincronizada.';anotarMestreV143(anotarV143);
   }catch(error){previewSource=null;previewCache=null;fail(error);}
   finally{pending=false;changed();if(filaV143.length){const prox=filaV143.shift();setTimeout(()=>void commit(prox),0);}}
   return;
  }
  if(edit.kind!=='token'){
   if(edit.kind==='undo'){if(edits.length)redo.push(edits.pop());else if(source()?.strokes?.length){draftMap=map()?.mapId||'';edits.push({kind:'removeStroke',id:source().strokes.at(-1).id});}}
   else{draftMap=map()?.mapId||'';edits.push(edit);redo=[];}
   modified();return;
  }
  const expectedMap=edit.mapId??map()?.mapId??'';pending=true;changed();
  try{await database.transact(async transaction=>{
   const state=await transaction.get(mapPath)||{};
   if((state.mapId||'')!==expectedMap)throw Error('O mapa ou o combate mudou. A edição foi cancelada.');
   const path=positionPath+'/'+edit.id,token=await transaction.get(path);if(!token)return;
   const pos=conterTokenNoMapa(token,{x:token.x+edit.dx,y:token.y+edit.dy},state);
   transaction.set(path,{...token,...pos,revision:Number(token.revision||0)+1});
  });}catch(error){fail(error);}finally{pending=false;changed();}
 }
 function begin(event){
  if(!enabled())return false;
  if(pending&&!event.target?.closest?.('[data-scene-object]'))return true;
  event.preventDefault();const start=point(event);
  const token=event.target.closest('[data-token]'),object=event.target.closest('[data-scene-object]'),native=event.target.closest('[data-eid]');
  if(tool==='draw')gesture={kind:'draw',stroke:{id:crypto.randomUUID(),color:root.getElementById('novaSyncInk')?.value||'#ffd447',points:[start]}};
  else if(!['move','draw'].includes(tool)){gesture={kind:'shape',start,end:start,shape:tool};}
  else{
   // v200: o chão não se arrasta: arrastar o chão move a visão do mapa (como o botão do meio)
   if(!token&&object&&tool==='move'){const o=scene()?.objects?.find(x=>x.id===object.dataset.sceneObject),m=map()||{};if(o&&ehChao(o,{W:m.larguraM,H:m.alturaM})){gesture={kind:'pan',x:event.clientX,y:event.clientY};try{board.style.cursor='grabbing';}catch(_){}gesture.pointer=event.pointerId;gesture.mapId=map()?.mapId||'';board.setPointerCapture(event.pointerId);return true;}}
   const element=token||object||native;if(!element){selection=null;changed();return true;}
   if(object)selectObject(object.dataset.sceneObject);
   else selection={kind:token?'token':'native',id:token?.dataset.token||native.dataset.eid};
   queueMicrotask(changed);
   gesture={kind:token?'token':object?'object':'native',id:token?.dataset.token||object?.dataset.sceneObject||native.dataset.eid,element,start,left:element.style.left,top:element.style.top,transform:element.getAttribute('transform')||'',dx:0,dy:0};
  }
  gesture.pointer=event.pointerId;gesture.mapId=map()?.mapId||'';board.setPointerCapture(event.pointerId);return true;
 }
 board.addEventListener('pointermove',event=>{
  if(!gesture||event.pointerId!==gesture.pointer)return;
  if(!enabled()||gesture.mapId!==(map()?.mapId||'')){cancel();return;}
  if(gesture.kind==='pan'){const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;gesture.x=event.clientX;gesture.y=event.clientY;root.defaultView.mesaCameraV144?.mover?.(dx,dy);return;}
  const next=point(event);
  if(gesture.kind==='shape'){gesture.end=next;let n=board.querySelector('[data-shape-preview]');if(!n){n=root.createElement('div');n.dataset.shapePreview='';n.style.cssText='position:absolute;pointer-events:none;border:2px dashed #00d4ff;background:#00d4ff33;z-index:100';board.append(n);}n.style.left=Math.min(next.x,gesture.start.x)/28*100+'%';n.style.top=Math.min(next.y,gesture.start.y)/14*100+'%';n.style.width=Math.abs(next.x-gesture.start.x)/28*100+'%';n.style.height=Math.abs(next.y-gesture.start.y)/14*100+'%';return;}
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
 function cancel(){gesture=null;try{board.style.cursor='';}catch(_){}board.querySelector('[data-shape-preview]')?.remove();paintedBase=null;changed();}
 board.addEventListener('pointerup',event=>{if(!gesture||event.pointerId!==gesture.pointer)return;let edit=gesture;gesture=null;if(edit.kind==='pan'){try{board.style.cursor='';}catch(_){}return;}board.querySelector('[data-shape-preview]')?.remove();paintedBase=null;if(edit.kind==='shape'){if(Math.hypot(edit.end.x-edit.start.x,edit.end.y-edit.start.y)<.05){changed();return;}edit={kind:'add',object:formaMesa(edit.shape,edit.start,edit.end,map()||{},style()),mapId:edit.mapId};}
  // v203: zona morta de clique — um clique (mesmo com jitter de pixel) só seleciona;
  // objeto/token só move se o arrasto passar de ~0,06 unidades (~6 cm no mapa).
  if(['object','native','token'].includes(edit.kind)&&Math.hypot(Number(edit.dx)||0,Number(edit.dy)||0)<.06){
   if(edit.element){edit.element.style.left=edit.left;edit.element.style.top=edit.top;if(edit.transform)edit.element.setAttribute('transform',edit.transform);}
   changed();return;}
  if(enabled()&&edit.mapId===(map()?.mapId||'')&&(edit.kind==='add'||(edit.kind==='draw'?edit.stroke.points.length>1:edit.dx||edit.dy)))commit(edit);else changed();});
 board.addEventListener('pointercancel',cancel);board.addEventListener('lostpointercapture',()=>{if(gesture)cancel();});root.defaultView.addEventListener('blur',()=>{if(gesture)cancel();});
 for(const [id,value]of [['novaSyncEditMove','move'],['novaSyncEditDraw','draw']])root.getElementById(id)?.addEventListener('click',()=>{tool=value;paint();});
 root.getElementById('novaSyncEditUndo')?.addEventListener('click',()=>{if(enabled()&&!pending)commit({kind:'undo'});});
 // v193: a Oficina 3.0 (construtor) grava no mesmo rascunho do editor: nada vai ao mapa até clicar em Salvar mapa
 // v197: quem anda sozinho (NPCs, companheiros, criaturas) enxerga também as paredes do rascunho, na aba do mestre
 globalThis.mesaRascunhoCenaV197_=c=>{try{if(!edits.length||!c||String(c.mapId||'')!==String(map()?.mapId||''))return c;const p=preview();return p&&String(p.mapId||'')===String(c.mapId||'')?{...c,objects:p.objects,editorRevision:Number(c.editorRevision||0)+edits.length}:c;}catch(_){return c;}};
 const avisarRascunho=()=>{try{globalThis.dispatchEvent(new CustomEvent('mesa-rascunho-v197'));}catch(_){}};
 const lotes=[],refazLotes=[]; // v197: cada gesto do editor rápido é um lote (desfazer/refazer de um gesto inteiro)
 const rascunho={empurrar(lista){if(!enabled()||!lista?.length)return false;draftMap=map()?.mapId||'';const base=preview();for(const x of lista)edits.push(x);redo=[];lotes.push([...lista]);refazLotes.length=0;previewSource=source();modified(aplicarEdicoes(base,lista));return true;},
  desfazerLote(){const l=lotes.pop();if(!l)return false;edits=edits.filter(e=>!l.includes(e));refazLotes.push(l);previewCache=null;modified();return true;},
  refazerLote(){const l=refazLotes.pop();if(!l)return false;edits.push(...l);lotes.push(l);previewCache=null;modified();return true;},
  get temLotes(){return lotes.length;},get temRefazer(){return refazLotes.length;},
  get pendentes(){return edits.length;},salvar(){return save();},descartar(){edits=[];redo=[];lotes.length=0;refazLotes.length=0;previewCache=null;modified();},mapaAtual:()=>map()?.mapId||'',objetosAtuais:()=>[...(scene()?.objects||[])],get ocupado(){return pending;},ativo:()=>enabled()};
 return {rascunho,begin,paint,preview,removeSelected,addObject:object=>commit({kind:'add',object}),get selection(){return enabled()?selection:null;},close({keepDraft=false}={}){gesture=null;if(!keepDraft){edits=[];redo=[];draftMap=null;}selection=null;previewCache=null;},get busy(){return pending;},canLeave(){return !edits.length||root.defaultView.confirm('Há edições não salvas. Trocar de mapa e descartá-las?');},get dirty(){return edits.length>0;}} ;
}
