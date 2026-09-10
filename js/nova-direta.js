// Movimento livre: uma posição por personagem, sem sessão-mestre ou fila de comandos.
import {saldoMovimento,moverNoTurno,iniciarIniciativa,acaoIniciativa} from './nova-turnos.js?v=18';
import {destinoSemColisao,TOKEN_DIAMETER} from './nova-colisao.js?v=25';
import {criarPainelAcoes} from './nova-painel.js?v=27';
import {conectarAtaques,HEALTH_PATH} from './nova-ataques.js?v=27';
import {mostrarAtaque} from './nova-efeitos.js?v=27';
export const POSITION_PATH='combatesAtivos/mapaMesaSyncDireta/posicoes';
export const MAP_PATH='combatesAtivos/mapaMesaSyncDireta';
export const SCENE_PATH='combatesAtivos/mapaMesaSyncDiretaCena';
export function mountDirectPositionLab({user,characters,catalog=characters,mapas=()=>[],loadMap=async()=>null,renderMap=()=>'',loadProp=async o=>o,loadActions=async()=>({skills:[]}),prepareAttack=null,restoreHealth=async()=>({}),playAttackSound=()=>{},unlockSound=()=>{},rollTest=()=>({die:0,grau:'Indisponível'}),loadCombatants=async()=>{throw new Error('Não foi possível carregar as fichas');},database,root=document}) {
 const el=id=>root.getElementById(id), displayName=t=>String(t?.nome||'').replace(/^(NPC|Monstro|PJ|PM|Objeto|Item)\s*[·:-]\s*/i,''), tokens=new Map(), previews=new Map(), queues=new Map();
 let stop=null,stopMap=null,account='',error='',generation=0,mapPacket=null,mapData=null,renderedMap=null,mapRequest=0;
 let changingTurn=false,lastSelectedTurn='';
 let held=null,frame=0,placing=false,placementChoice='';
 let catalogKey='',catalogLimit=48,sceneRef=null,sceneMapId=null;
 const quickChoices=new Map();
 let stopScene=null,sceneData=null,sceneRequest=0;
 const propCache=new Map();
 let attacks=null,health={actors:{},revision:0},attacking=false,managing=false,lastEffect='',selectedTarget='';
 function drawCatalog(){
  const select=el('novaSyncMestrePersonagem');if(!select)return;
  const details=el('novaSyncCatalog');if(details)details.hidden=!user()?.master;
  const old=select.value;
  const type=el('novaSyncMestreTipo')?.value,search=(el('novaSyncCatalogSearch')?.value||'').toLocaleLowerCase('pt-BR');
  const key=JSON.stringify([type,search,old,details?.open,placing,placementChoice,!!mapPacket?.combat?.active,user()?.master,[...tokens.keys()],catalogLimit]);
  if(key===catalogKey)return;catalogKey=key;
  const placeholder=root.createElement('option');placeholder.value='';placeholder.textContent='Escolher personagem para colocar no mapa';
  const list=(user()?.master?catalog():[]).filter(t=>(!type||t.catalogType===type)&&String(t.nome).toLocaleLowerCase('pt-BR').includes(search));
  select.replaceChildren(placeholder,...list.map(t=>{const o=root.createElement('option');o.value=t.id;o.textContent=displayName(t);o.disabled=tokens.has(encodeURIComponent(t.id));if(o.disabled)o.textContent+=' (já está no mapa)';return o;}));
  select.value=old;select.disabled=!user()?.master||!!mapPacket?.combat?.active||placing;
  if(el('novaSyncMestreTipo'))el('novaSyncMestreTipo').disabled=select.disabled;
  if(select.disabled)placementChoice='';
  const button=el('novaSyncAdicionar');
  if(button){button.disabled=select.disabled||!select.value||tokens.has(encodeURIComponent(select.value));button.textContent=placementChoice?'Cancelar colocação':'Adicionar ao mapa';}
  const hint=el('novaSyncAdicionarHint');if(hint)hint.textContent=!user()?.master?'O mestre adiciona personagens ao mapa.':placing?'Adicionando personagem…':placementChoice?'Clique no mapa para escolher a posição.':mapPacket?.combat?.active?'Adicione personagens fora de combate.':'Escolha o tipo e o personagem, depois clique em Adicionar ao mapa.';
  const grid=el('novaSyncCatalogGrid');
  if(grid){
   grid.replaceChildren();
   if(details?.open&&user()?.master)for(const [i,t] of list.slice(0,catalogLimit).entries()){
    const card=root.createElement('button');card.type='button';card.disabled=select.disabled||tokens.has(encodeURIComponent(t.id));card.setAttribute('aria-pressed',String(select.value===String(t.id)));
    if(t.imagem){const img=root.createElement('img');img.src=t.imagem;img.loading='lazy';img.decoding='async';img.alt='';card.append(img);}
    const name=root.createElement('span');name.textContent=(i+1)+'. '+t.nome+(card.disabled&&tokens.has(encodeURIComponent(t.id))?' (no mapa)':'');card.append(name);
    card.addEventListener('click',()=>{select.value=t.id;placementChoice='';drawCatalog();status();});grid.append(card);
   }
   if(details?.open&&!list.length)grid.textContent='Nenhum resultado para este filtro.';
  }
  const more=el('novaSyncCatalogMore');if(more)more.hidden=!details?.open||list.length<=catalogLimit;
 }
 const canView=t=>!!t&&!!user()&&(user().master||user().uid===t.donoUid);
 const controlled=t=>!!t&&!!user()&&(user().uid===t.donoUid||(user().master&&!t.donoUid));
 const updateActions=criarPainelAcoes({root,load:loadActions,roll:rollTest,unlock:unlockSound,attack:async payload=>{
  if(!attacks||attacking||queues.size||managing)throw Error('Aguarde a sincronização.');
  if(!controlled(tokens.get(payload.actorId)))throw Error('Você não controla este personagem.');
  release();attacking=true;status();
  try{return await attacks.attack({...payload,mapId:mapPacket?.mapId||''});}finally{attacking=false;status();}
 },spend:async(id,turn)=>{
  if(mapPacket?.combat?.activeId!==id||mapPacket.combat.turnId!==turn)return false;
  return changeTurn('spend');
 }});
 function status(){
  el('novaSyncStatus').textContent=(queues.size?'Sincronização direta 27 · salvando posição…':error)||`Sincronização direta 27 · ${tokens.size} personagem(ns) · mantenha o mouse pressionado para caminhar`;
  if(held)el('novaSyncStatus').textContent='Solte o botão do mouse para parar · 3 m/s';
  else if(placementChoice)el('novaSyncStatus').textContent='Clique no mapa para colocar o personagem escolhido.';
  const masterPanel=el('novaSyncMasterPanel'),playerInfo=el('novaSyncPlayerInfo');
  if(masterPanel)masterPanel.hidden=false;
  const masterTitle=el('novaSyncMasterTitle');if(masterTitle)masterTitle.textContent=user()?.master?'Painel do mestre · combate':'Sessão de combate · somente leitura';
  if(masterPanel&&!user()?.master)for(const control of masterPanel.querySelectorAll('button,select'))control.disabled=true;
  const selected=tokens.get(el('novaSyncPersonagem')?.value),joined=mapPacket?.joined||{};
  const join=el('novaSyncJoin');
  if(join){join.hidden=!!user()?.master;join.textContent=joined[selected?.id]===false?'Entrar no combate':'Sair do combate';join.disabled=!!mapPacket?.combat?.active||!selected||selected.donoUid!==user()?.uid;}
  if(playerInfo)playerInfo.hidden=true;
  const alert=el('novaSyncErro');
  if(alert){alert.hidden=!error;alert.textContent=error;}
  const c=mapPacket?.combat,t=tokens.get(c?.activeId),panel=el('novaSyncTurno');
  if(panel)panel.textContent=c?.active?(c.schema===2?
   `Turno ${c.round} · Vez de ${t?.nome||'personagem'} · Ações: ${c.actors[c.activeId].remaining} / ${c.initial[c.activeId].remaining} · Passagens: ${c.actors[c.activeId].passes} / 2 · Movimento: ${saldoMovimento(previews.get(c.activeId)||t,c).toFixed(2)} / 6 m`:
   'Combate da versão anterior: encerre e inicie novamente para rolar a iniciativa.'):'Fora de combate · movimento livre. Ao iniciar, a iniciativa será rolada uma vez para cada personagem.';
  if(panel&&!user()?.master)panel.textContent=c?.active?'Turno de combate iniciado · Turno '+c.round+'. Aguarde sua vez para agir.':'Modo explorador · movimento livre. O mestre controla o combate.';
  const list=el('novaSyncOrdem');
  if(list)list.textContent=user()?.master&&c?.active&&c.schema===2?'Iniciativa: '+c.order.map(id=>`${tokens.get(id)?.nome||id}: ${c.rolls[id].die} + ${c.rolls[id].initiative} = ${c.rolls[id].total} (${c.actors[id].remaining} Ações; ${c.actors[id].passes>=2?'encerrou':c.actors[id].passes+' passagem(ns)'})`).join(' → '):'';
  for(const [id,available]of [['novaSyncStart',user()?.master&&!c?.active],['novaSyncNext',c?.active&&c.schema===2&&controlled(t)],['novaSyncSpend',c?.active&&c.schema===2&&controlled(t)],['novaSyncEnd',user()?.master&&c?.active]]){
   const b=el(id);if(b){b.hidden=id==='novaSyncStart'?!!c?.active:id==='novaSyncEnd'?!c?.active:false;b.disabled=!available||queues.size>0||changingTurn||attacking||managing;}
  }
  const roleHint=el('novaSyncTurnoHint');
  if(roleHint)roleHint.textContent='Passar ação preserva as Ações na primeira passagem; a segunda encerra sua participação neste turno. Registrar 1 Ação apenas desconta o gasto, sem resolver ataques ou testes.';
  if(el('novaSyncMapa'))el('novaSyncMapa').disabled=!!c?.active||!user()?.master;
  if(el('novaSyncInit'))el('novaSyncInit').disabled=!!c?.active;
  const quick=el('novaSyncQuickSearch'),quickAdd=el('novaSyncQuickAdd');
  if(quick)quick.disabled=!user()?.master||!!c?.active||placing;
  if(quickAdd)quickAdd.disabled=!user()?.master||!!c?.active||placing||!quickChoices.has(quick?.value);
  for(const id of ['novaSyncRandom','novaSyncClear','novaSyncRestore'])if(el(id))el(id).disabled=!user()?.master||!!c?.active||managing||attacking||queues.size>0;
  updateActions(selected,c,controlled(selected)&&(!c?.active||c.activeId===selected?.id)&&!queues.size&&!changingTurn&&!attacking&&!managing,{tokens:[...tokens.values()],health:health.actors?.[selected?.id],revision:health.revision,event:health.event});
 }
 function drawMap(){
  const board=el('novaSyncBoard'),select=el('novaSyncMapa'); if(!board||!select)return;
  const list=mapas()||[],old=select.value;
  select.replaceChildren(...list.map(m=>{const o=root.createElement('option');o.value=m.id;o.textContent=m.nome||m.id;return o;}));
  if(mapPacket?.mapId&&!list.some(m=>String(m.id)===String(mapPacket.mapId))){const o=root.createElement('option');o.value=mapPacket.mapId;o.textContent=mapPacket.nome||mapPacket.mapId;select.append(o);}
  select.value=mapPacket?.mapId||old||'';
  const fundo=String(mapPacket?.fundo||mapData?.fundo||mapData?.oficina2State?.bg||'');
  board.style.backgroundImage=/^(#|rgb|hsl|linear-gradient)/i.test(fundo)?'none':(fundo?`url("${fundo.replaceAll('"','%22')}")`:'linear-gradient(135deg,#20314c,#18233a)');
  board.style.backgroundColor=/^(#|rgb|hsl)/i.test(fundo)?fundo:'#20314c';
  board.style.backgroundSize='cover';board.style.backgroundPosition='center';
  if(mapPacket?.larguraM&&mapPacket?.alturaM){board.dataset.mapWidth=mapPacket.larguraM;board.dataset.mapHeight=mapPacket.alturaM;}
  let layer=board.querySelector('[data-map-layer]');
  if(!layer){layer=root.createElement('div');layer.dataset.mapLayer='';layer.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden';board.prepend(layer);}
  if(renderedMap===mapData&&layer.firstChild)return;
  layer.innerHTML=mapData?renderMap(mapData):'';
  const svg=layer.querySelector('svg');
  if(svg){svg.style.cssText='display:block;width:100%;height:100%';svg.setAttribute('preserveAspectRatio','none');}
  renderedMap=mapData;
 }
 function draw(){
  const board=el('novaSyncBoard'),select=el('novaSyncPersonagem'),old=select.value;
  const mine=[...tokens.values()].filter(canView);
  select.replaceChildren(...mine.map(t=>{const o=root.createElement('option');o.value=t.id;o.textContent=displayName(t);return o;}));
  select.value=mine.some(t=>t.id===old)?old:mine[0]?.id||'';
  if(mapPacket?.combat?.active&&mapPacket.combat.schema===2&&canView(tokens.get(mapPacket.combat.activeId))){
   // Durante o combate, o painel acompanha quem tem a vez.
   select.value=mapPacket.combat.activeId;
  }else if(mapPacket?.combat?.turnId!==lastSelectedTurn){
   lastSelectedTurn=mapPacket?.combat?.turnId||'';
  }
  el('novaSyncInit').style.display=user()?.master?'':'none';
  for(const node of [...board.children])if(node.dataset.token&&!tokens.has(node.dataset.token))node.remove();
  for(const t of tokens.values()){
   let node=[...board.children].find(n=>n.dataset.token===t.id);
   if(!node){
    node=root.createElement('div');node.dataset.token=t.id;
    node.style.cssText='position:absolute;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:50%;border:3px solid #00d4ff;background:#263d62;touch-action:none;user-select:none;transition:left .28s linear,top .28s linear';
    if(t.imagem){const img=root.createElement('img');img.src=t.imagem;img.draggable=false;img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none';node.append(img);}
    const label=root.createElement('span');label.textContent=displayName(t);label.style.cssText='position:absolute;top:46px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#172337;font-size:12px';node.append(label);board.append(node);
   }
   const p=previews.get(t.id)||t;
   const tokenDiameterM=/besta\s+ululante/i.test(String(t.nome||''))?2.4:1.4;
   node.style.boxSizing='border-box';
   node.style.width=tokenDiameterM/(Number(mapPacket?.larguraM)||28)*board.clientWidth+'px';
   node.style.height=tokenDiameterM/(Number(mapPacket?.alturaM)||14)*board.clientHeight+'px';
   node.style.transition=previews.has(t.id)?'none':'left .2s linear,top .2s linear';
   node.style.left=`${p.x/28*100}%`;node.style.top=`${p.y/14*100}%`;
   node.dataset.x=p.x;node.dataset.y=p.y;
   node.style.cursor=controlled(t)?'grab':'default';node.style.borderColor=t.id===select.value?'#ffd447':'#00d4ff';
   node.querySelectorAll('[data-map-action]').forEach(n=>n.remove());
   if(mapPacket?.combat?.active&&select.value&&t.id!==select.value&&controlled(tokens.get(select.value))){
    const actor=tokens.get(select.value);
    const action=root.createElement('button');action.type='button';action.dataset.mapAction='attack';action.textContent='⚔';action.title='Atacar '+actor.nome;
    action.style.cssText='position:absolute;left:50%;transform:translateX(-50%);'+(p.y<2.2?'top:calc(100% + 4px);':'bottom:calc(100% + 4px);')+'z-index:12;padding:2px 5px;font-size:11px;line-height:1;border:1px solid #ffd447;border-radius:5px;background:#18233a;color:#fff;cursor:pointer;';
    action.addEventListener('pointerdown',e=>e.stopPropagation());
    action.addEventListener('click',e=>{e.stopPropagation();el('novaSyncPersonagem').value=actor.id;draw();updateActions.setTarget(t.id);updateActions.triggerAttack();});
    node.append(action);
   }
  }
  drawMap();drawScene();drawCatalog();status();
 }
 function drawScene(){
  const board=el('novaSyncBoard'),scene=sceneData;
  if(sceneRef===scene&&sceneMapId===mapPacket?.mapId)return;sceneRef=scene;sceneMapId=mapPacket?.mapId;
  for(const node of board.querySelectorAll('[data-scene-object]'))node.remove();
  if(scene?.mapId!==(mapPacket?.mapId||''))return;
  for(const o of scene.objects||[]){
   const node=root.createElement('div');node.dataset.sceneObject=o.id;node.title=o.nome;
   node.style.cssText='position:absolute;pointer-events:none;transform:translate(-50%,-50%);';
   node.style.left=o.x/28*100+'%';node.style.top=o.y/14*100+'%';
   node.style.width=o.larguraM/(Number(mapPacket?.larguraM)||28)*100+'%';node.style.height=o.alturaM/(Number(mapPacket?.alturaM)||14)*100+'%';
   if(o.imagem){const img=root.createElement('img');img.src=o.imagem;img.alt=o.nome;img.style.cssText='width:100%;height:100%;object-fit:contain';node.append(img);}else{node.textContent=o.nome;node.style.background='#37455b';}
   const firstToken=board.querySelector('[data-token]');board.insertBefore(node,firstToken);
  }
 }
 function fail(e){
  const detail=String(e.code||e.message||e);
  error=detail.includes('permission-denied')?
   'O Firebase recusou salvar o movimento/turno (permission-denied). A posição voltou ao último ponto salvo. Publique as regras de turnos no Firestore; enviar o código ao GitHub não atualiza essas regras.':
   `Não foi possível salvar/sincronizar: ${detail}. O movimento não confirmado volta ao último ponto salvo.`;
  status();console.error('[Sync direta]',e);
 }
 function close(){attacks?.close();attacks=null;health={actors:{},revision:0};held=null;placementChoice='';cancelAnimationFrame(frame);generation++;stop?.();stopMap?.();stopScene?.();stopScene=null;sceneData=null;sceneRequest++;stop=null;stopMap=null;account='';tokens.clear();previews.clear();queues.clear();mapPacket=null;mapData=null;renderedMap=null;mapRequest++;}
 function open(){
  const u=user();if(!u)return;if(account===u.uid&&stop)return;close();account=u.uid;error='';const g=generation;
  stop=database.subscribe(POSITION_PATH,rows=>{
   if(g!==generation)return;
   for(const row of rows){
    if(row.removed){tokens.delete(row.id);continue;}
    const t={...row.data,id:row.id},old=tokens.get(row.id);
    if(!old||t.revision>=old.revision)tokens.set(row.id,t);
   }
   draw();
  },fail);
  stopMap=database.subscribeDoc(MAP_PATH,async p=>{
   if(g!==generation)return;
   if(p?.combat?.session===mapPacket?.combat?.session&&Number(p?.combat?.sequence)<Number(mapPacket?.combat?.sequence))return;
   const request=++mapRequest;
   try{
    if(p?.mapId===mapPacket?.mapId){mapPacket=p||null;draw();return;}
    const loaded=p?.mapId?await loadMap(p.mapId):null;
    if(g!==generation||request!==mapRequest)return;
    mapPacket=p||null;mapData=loaded;draw();
   }catch(e){if(g===generation&&request===mapRequest)fail(e);}
  },fail);
  stopScene=database.subscribeDoc(SCENE_PATH,async scene=>{
   const request=++sceneRequest;
   try{
    const objects=await Promise.all((scene?.objects||[]).map(async o=>{
     if(!propCache.has(o.modeloId))propCache.set(o.modeloId,loadProp(o).catch(e=>{propCache.delete(o.modeloId);throw e;}));
     return {...await propCache.get(o.modeloId),...o};
    }));
    if(g!==generation||request!==sceneRequest)return;
    sceneData=scene?{...scene,objects}:null;drawScene();
   }catch(e){if(g===generation)fail(e);}
  },fail);
  if(prepareAttack)attacks=conectarAtaques({database,user,tokens:()=>[...tokens.values()],prepare:prepareAttack,onError:fail,onHealth:value=>{
   if(g!==generation)return;health=value;status();const event=value.event;
   if(event&&event.id!==lastEffect){lastEffect=event.id;if(Date.now()-event.ts<5000){mostrarAtaque(board,event);try{playAttackSound(event);}catch(_){}}}
  }});
  draw();
 }
 async function initialize(){
  open();if(!user()?.master||mapPacket?.combat?.active)return;
 try{
   const mapaId=el('novaSyncMapa')?.value;
   if(mapaId){const m=(mapas()||[]).find(x=>String(x.id)===String(mapaId));if(m)await database.writeMap(MAP_PATH,{mapId:String(m.id),nome:String(m.nome||m.id),fundo:String(m.fundo||''),larguraM:Number(m.larguraM)||28,alturaM:Number(m.alturaM)||14});}
   const legacy=await database.get('combatesAtivos/mapaMesaSyncNova');
   const source=legacy?.estado?.tokens?.length?legacy.estado.tokens:characters();
   for(const [i,t] of source.entries()){
    if(!t.id)continue;
    const id=String(t.id),path=POSITION_PATH+'/'+encodeURIComponent(id);
    await database.transact(async tx=>{
     if(await tx.get(path))return;
     tx.set(path,{nome:String(t.nome||'Personagem'),imagem:String(t.imagem||''),donoUid:String(t.donoUid||t.dono||''),
      x:Math.max(.7,Math.min(27.3,Number.isFinite(t.x)?t.x:4+i*3)),y:Math.max(.8,Math.min(13.2,Number.isFinite(t.y)?t.y:7)),revision:0});
    });
   }
  }catch(e){fail(e);}
 }
 // Keep every segment of the preview. One transaction batches the waiting
 // segments, so latency cannot turn a detour into a chord through a character.
 async function save(id,points){
  if(!controlled(tokens.get(id)||{}))return;
  if(!points.length)return;
  const expectedTurn=mapPacket?.combat?.active?mapPacket.combat.turnId:null;
  const existing=queues.get(id);if(existing){existing.points.push(...points);return;}
  const q={points:[...points]},g=generation;queues.set(id,q);status();
  try{
   while(q.points.length&&g===generation){
    const pathPoints=q.points.splice(0);
    const result=await database.transact(async tx=>{
     const state=await tx.get(MAP_PATH);
     const path=POSITION_PATH+'/'+id,t=await tx.get(path);
     if(!t)throw new Error('Personagem não encontrado');
     const others=await Promise.all([...tokens.keys()].filter(key=>key!==id).map(async key=>{const value=await tx.get(POSITION_PATH+'/'+key);return value?{...value,id:key}:null;}));
     let moved={...t,id},blocked=false;
     for(const next of pathPoints){
      const destination=destinoSemColisao(moved,next,others.filter(Boolean),state);
      moved=moverNoTurno(moved,destination,state,expectedTurn);
      if(Math.hypot(moved.x-next.x,moved.y-next.y)>.001){blocked=true;break;}
     }
     const {id:ignored,...value}=moved;
     value.revision=t.revision+1;tx.set(path,value);return {value,blocked};
    });
    if(g!==generation)return;
    const saved=result.value;
    error='';
    if(!tokens.has(id)||saved.revision>=tokens.get(id).revision)tokens.set(id,{...saved,id});
    if(result.blocked){
     q.points.length=0;if(held?.id===id){held=null;cancelAnimationFrame(frame);}
     error='Movimento interrompido: o caminho foi ocupado ou o movimento disponível terminou.';
    }
   }
  }catch(e){if(g===generation){held=null;cancelAnimationFrame(frame);fail(e);}}
  finally{if(g===generation){queues.delete(id);if(held?.id!==id)previews.delete(id);draw();}}
 }
 const board=el('novaSyncBoard');
 function point(e){const r=board.getBoundingClientRect();return {x:Math.max(.7,Math.min(27.3,(e.clientX-r.left)/r.width*28)),y:Math.max(.8,Math.min(13.2,(e.clientY-r.top)/r.height*14))};}
 function release(){
  const h=held;if(!h)return;held=null;cancelAnimationFrame(frame);
  if(h.trail.length)save(h.id,h.trail.splice(0));
  else if(!queues.has(h.id)){previews.delete(h.id);draw();}
  status();
 }
 function step(now){
  const h=held;if(!h)return;
  const dt=Math.min(.05,(now-h.time)/1000);h.time=now;
  const t=previews.get(h.id)||tokens.get(h.id);
  const w=Number(mapPacket?.larguraM)||28,height=Number(mapPacket?.alturaM)||14;
  const distance=Math.hypot((h.target.x-t.x)*w/28,(h.target.y-t.y)*height/14);
  try{
   if(distance>0){
    const ratio=Math.min(1,3*dt/distance);
    const dest=destinoSemColisao(t,{x:t.x+(h.target.x-t.x)*ratio,y:t.y+(h.target.y-t.y)*ratio},[...tokens.values()].map(t=>previews.get(t.id)||t),mapPacket);
    const p=moverNoTurno(t,dest,mapPacket,h.turn);
    if(p.x!==t.x||p.y!==t.y){
     previews.set(h.id,p);draw();
     h.trail.push({x:p.x,y:p.y});
     if(now-h.sent>=200){h.sent=now;save(h.id,h.trail.splice(0));}
    }
   }
  }catch(e){release();error=e.message;status();return;}
  frame=requestAnimationFrame(step);
 }
 board.addEventListener('pointermove',e=>{if(held&&e.pointerId===held.pointer){if(!(e.buttons&1))release();else held.target=point(e);}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])board.addEventListener(event,release);
 root.defaultView?.addEventListener('blur',release);
 root.addEventListener('visibilitychange',()=>{if(root.hidden)release();});
 board.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  if(attacking||managing)return;
  const chosen=placementChoice;
  if(chosen&&user()?.master&&!mapPacket?.combat?.active){place(chosen,point(e));return;}
  const clicked=e.target.closest('[data-token]')?.dataset.token;
  if(clicked){
   if(canView(tokens.get(clicked)||{})){el('novaSyncPersonagem').value=clicked;draw();}
   return;
  }
  const id=el('novaSyncPersonagem').value, t=tokens.get(id);
  if(!t||!controlled(t))return;
  e.preventDefault();
  try{
   const turn=mapPacket?.combat?.active?mapPacket.combat.turnId:null;
   moverNoTurno(previews.get(id)||t,{x:t.x,y:t.y},mapPacket,turn);
   release();held={id,target:point(e),turn,pointer:e.pointerId,time:performance.now(),sent:performance.now(),trail:[]};
   board.setPointerCapture(e.pointerId);frame=requestAnimationFrame(step);
  }catch(e){error=e.message;status();}
 });
 async function place(chosen,p){
  if(placing)return;const t=catalog().find(t=>String(t.id)===chosen);if(!t)return;
  placing=true;drawCatalog();
  try{
   const id=encodeURIComponent(t.id);
   await database.transact(async tx=>{
    const s=await tx.get(MAP_PATH),existing=await tx.get(POSITION_PATH+'/'+id);
    if(s?.combat?.active)throw new Error('Coloque personagens fora de combate.');
    if(['objeto','item'].includes(t.catalogType)){
     const scene=await tx.get(SCENE_PATH),objects=scene?.mapId===(s?.mapId||'')?scene.objects:[];
     const object={id:crypto.randomUUID(),nome:String(t.nome),tipo:t.catalogType,modeloId:String(t.id),larguraM:Math.max(.1,Number(t.larguraM)||1),alturaM:Math.max(.1,Number(t.alturaM)||1),pvMax:Number(t.pvMax||t.pv)||0,dureza:Number(t.dureza)||0,...p};
     tx.set(SCENE_PATH,{mapId:s?.mapId||'',objects:[...objects,object]});return;
    }
    if(existing)throw new Error('Este personagem já está no mapa.');
    tx.set(POSITION_PATH+'/'+id,{nome:String(t.nome||'Personagem'),imagem:String(t.imagem||''),donoUid:String(t.donoUid||t.dono||''),...p,revision:0});
   });
   el('novaSyncMestrePersonagem').value='';placementChoice='';error='';
  }catch(e){fail(e);}finally{placing=false;draw();}
 }
 el('novaSyncMestrePersonagem')?.addEventListener('change',()=>{release();placementChoice='';drawCatalog();status();});
 el('novaSyncMestreTipo')?.addEventListener('change',()=>{placementChoice='';el('novaSyncMestrePersonagem').value='';drawCatalog();status();});
 el('novaSyncCatalog')?.addEventListener('toggle',()=>{catalogKey='';drawCatalog();});
 el('novaSyncCatalogSearch')?.addEventListener('input',()=>{catalogLimit=48;placementChoice='';drawCatalog();status();});
 el('novaSyncCatalogMore')?.addEventListener('click',()=>{catalogLimit+=48;drawCatalog();});
 el('novaSyncQuickSearch')?.addEventListener('focus',()=>{
  if(!user()?.master)return;quickChoices.clear();const options=el('novaSyncQuickOptions');options.replaceChildren();
  const labels={pj:'PJ',pm:'PM',npc:'NPC',monstro:'Monstro',objeto:'Objeto',item:'Item'};
  for(const t of catalog()){
   if(tokens.has(encodeURIComponent(t.id)))continue;
   const base=t.nome+' · '+(labels[t.catalogType]||'Personagem');let label=base,n=2;while(quickChoices.has(label))label=base+' ('+(n++)+')';
   quickChoices.set(label,t.id);const option=root.createElement('option');option.value=label;options.append(option);
  }
 });
 el('novaSyncQuickSearch')?.addEventListener('input',status);
 el('novaSyncQuickAdd')?.addEventListener('click',async()=>{
  if(!user()?.master||mapPacket?.combat?.active||placing)return;
  const input=el('novaSyncQuickSearch'),id=quickChoices.get(input.value);if(!id)return;
  const entry=catalog().find(t=>t.id===id);let p={x:14,y:7};
  if(!['objeto','item'].includes(entry?.catalogType)){
   const w=(Number(mapPacket?.larguraM)||28)/28,h=(Number(mapPacket?.alturaM)||14)/14;
   const candidates=[];for(let y=.8;y<=13.2;y+=.8)for(let x=.8;x<=27.2;x+=.8)candidates.push({x,y});
   candidates.sort((a,b)=>Math.hypot((a.x-14)*w,(a.y-7)*h)-Math.hypot((b.x-14)*w,(b.y-7)*h));
   p=candidates.find(p=>[...tokens.values()].every(t=>Math.hypot((p.x-t.x)*w,(p.y-t.y)*h)>=TOKEN_DIAMETER));
   if(!p){error='Não há espaço livre para outra miniatura.';status();return;}
  }
  await place(id,p);input.value='';quickChoices.clear();status();
 });
 el('novaSyncAdicionar')?.addEventListener('click',()=>{
  if(!user()?.master||mapPacket?.combat?.active||placing)return;
  release();placementChoice=placementChoice?'':el('novaSyncMestrePersonagem').value;drawCatalog();status();
 });
 el('novaSyncPersonagem').addEventListener('change',()=>{
  if(mapPacket?.combat?.active&&mapPacket.combat.schema===2){draw();return;}
  draw();
 });
 el('novaSyncMapa')?.addEventListener('change',()=>{if(user()?.master){const m=(mapas()||[]).find(x=>String(x.id)===String(el('novaSyncMapa').value));if(m)database.writeMap(MAP_PATH,{mapId:String(m.id),nome:String(m.nome||m.id),fundo:String(m.fundo||''),larguraM:Number(m.larguraM)||28,alturaM:Number(m.alturaM)||14}).catch(fail);}});
 async function changeTurn(action){
  if(queues.size||changingTurn||managing||attacking)return;
  if(['start','end'].includes(action)?!user()?.master:!controlled(tokens.get(mapPacket?.combat?.activeId)))return;
  const expected=mapPacket?.combat?.turnId||null;
  const g=generation;
  changingTurn=true;status();
  try{
   const joined=mapPacket?.joined||{};
   const started=action==='start'?iniciarIniciativa(await loadCombatants([...tokens.values()].filter(t=>joined[t.id]!==false)),crypto.randomUUID()):null;
   await database.transact(async tx=>{
    if(g!==generation)throw new Error('A sessão mudou');
    const state=await tx.get(MAP_PATH)||{},c=state.combat;
    if((c?.turnId||null)!==expected)throw new Error('O turno mudou. Confira a tela antes de avançar.');
    let combat;
    if(action==='start'){
     if(c?.active)return;
     combat=started;
    }else{
     if(!c?.active)return;
     if(action!=='end'&&!controlled(tokens.get(c.activeId)))throw new Error('Você não controla este personagem.');
     combat=action==='end'?{...c,active:false,turnId:crypto.randomUUID()}:acaoIniciativa(c,action,expected);
    }
    tx.set(MAP_PATH,{...state,combat});
   });
   error='';status();return true;
  }catch(e){fail(e);}
  finally{changingTurn=false;status();}
 }
 for(const [id,action]of [['novaSyncStart','start'],['novaSyncNext','pass'],['novaSyncSpend','spend'],['novaSyncEnd','end']])el(id)?.addEventListener('click',e=>{if(e.detail<2){unlockSound();changeTurn(action);}});
 async function manage(action){
  if(!user()?.master||mapPacket?.combat?.active||managing||attacking||queues.size)return;
  if(action==='clear'&&!root.defaultView.confirm('Limpar os participantes e o estado de combate? O mapa e seus objetos permanecem.'))return;
  if(action==='restore'&&!root.defaultView.confirm('Restaurar o estado de combate dos participantes e objetos atuais?'))return;
  release();managing=true;status();
  try{
   const ids=[...tokens.keys()],restored=action==='restore'?await restoreHealth([...tokens.values()]):null;
   await database.transact(async tx=>{
    const state=await tx.get(MAP_PATH)||{},healthState=await tx.get(HEALTH_PATH)||{},scene=await tx.get(SCENE_PATH);
    const values=await Promise.all(ids.map(id=>tx.get(POSITION_PATH+'/'+id)));
    if(state.combat?.active)throw Error('Encerre o combate antes de reorganizar a mesa.');
    if(action==='random'){
     const placed=[],w=(Number(state.larguraM)||28)/28,h=(Number(state.alturaM)||14)/14;
     for(const [i,t]of values.entries())if(t){
      let point;for(let k=0;k<600;k++){const candidate={x:.8+Math.random()*26.4,y:.8+Math.random()*12.4};if(placed.every(p=>Math.hypot((candidate.x-p.x)*w,(candidate.y-p.y)*h)>=TOKEN_DIAMETER+.1)){point=candidate;break;}}
      if(!point)throw Error('Não há espaço para distribuir todas as miniaturas sem sobreposição.');
      placed.push(point);tx.set(POSITION_PATH+'/'+ids[i],{...t,...point,revision:t.revision+1});
     }
    }else if(action==='clear'){
     for(const id of ids)tx.delete(POSITION_PATH+'/'+id);
     const {combat,joined,...kept}=state;tx.set(MAP_PATH,kept);tx.set(HEALTH_PATH,{actors:{},revision:(healthState.revision||0)+1});
    }else{
     tx.set(HEALTH_PATH,{actors:restored,revision:(healthState.revision||0)+1});
     if(scene)tx.set(SCENE_PATH,{...scene,objects:(scene.objects||[]).map(o=>({...o,pvAtual:o.pvMax||0,destruido:false}))});
    }
   });error='';
  }catch(e){fail(e);}finally{managing=false;draw();}
 }
 for(const [id,action]of [['novaSyncRandom','random'],['novaSyncClear','clear'],['novaSyncRestore','restore']])el(id)?.addEventListener('click',()=>manage(action));
 el('novaSyncJoin')?.addEventListener('click',async()=>{
  const t=tokens.get(el('novaSyncPersonagem')?.value);if(!t||t.donoUid!==user()?.uid||mapPacket?.combat?.active)return;
  try{await database.transact(async tx=>{const s=await tx.get(MAP_PATH)||{};tx.set(MAP_PATH,{...s,joined:{...(s.joined||{}),[t.id]:(s.joined||{})[t.id]===false}});});error='';status();}catch(e){fail(e);}
 });
 status();
 return {open,close,initialize};
}
