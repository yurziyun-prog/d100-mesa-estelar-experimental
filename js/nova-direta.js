// Movimento livre: uma posição por personagem, sem sessão-mestre ou fila de comandos.
import {saldoMovimento,moverNoTurno,iniciarIniciativa,acaoIniciativa} from './nova-turnos.js?v=18';
export const POSITION_PATH='combatesAtivos/mapaMesaSyncDireta/posicoes';
export const MAP_PATH='combatesAtivos/mapaMesaSyncDireta';
export function mountDirectPositionLab({user,characters,mapas=()=>[],loadMap=async()=>null,renderMap=()=>'',loadCombatants=async()=>{throw new Error('Não foi possível carregar as fichas');},database,root=document}) {
 const el=id=>root.getElementById(id), tokens=new Map(), previews=new Map(), queues=new Map();
 let stop=null,stopMap=null,account='',error='',generation=0,mapPacket=null,mapData=null,renderedMap=null,mapRequest=0;
 let changingTurn=false,lastSelectedTurn='';
 const canView=t=>!!t&&!!user()&&(user().master||user().uid===t.donoUid);
 const controlled=t=>!!t&&!!user()&&(user().uid===t.donoUid||(user().master&&!t.donoUid));
 function status(){
  el('novaSyncStatus').textContent=(queues.size?'Sincronização direta 18 · salvando posição…':error)||`Sincronização direta 18 · ${tokens.size} personagem(ns) · clique no destino para caminhar`;
  const alert=el('novaSyncErro');
  if(alert){alert.hidden=!error;alert.textContent=error;}
  const c=mapPacket?.combat,t=tokens.get(c?.activeId),panel=el('novaSyncTurno');
  if(panel)panel.textContent=c?.active?(c.schema===2?
   `Turno ${c.round} · Vez de ${t?.nome||'personagem'} · Ações: ${c.actors[c.activeId].remaining} / ${c.initial[c.activeId].remaining} · Passagens: ${c.actors[c.activeId].passes} / 2 · Movimento: ${saldoMovimento(previews.get(c.activeId)||t,c).toFixed(2)} / 6 m`:
   'Combate da versão anterior: encerre e inicie novamente para rolar a iniciativa.'):'Fora de combate · movimento livre. Ao iniciar, a iniciativa será rolada uma vez para cada personagem.';
  const list=el('novaSyncOrdem');
  if(list)list.textContent=c?.active&&c.schema===2?'Iniciativa: '+c.order.map(id=>`${tokens.get(id)?.nome||id}: ${c.rolls[id].die} + ${c.rolls[id].initiative} = ${c.rolls[id].total} (${c.actors[id].remaining} Ações; ${c.actors[id].passes>=2?'encerrou':c.actors[id].passes+' passagem(ns)'})`).join(' → '):'';
  for(const [id,available]of [['novaSyncStart',user()?.master&&!c?.active],['novaSyncNext',c?.active&&c.schema===2&&controlled(t)],['novaSyncSpend',c?.active&&c.schema===2&&controlled(t)],['novaSyncEnd',user()?.master&&c?.active]]){
   const b=el(id);if(b){b.hidden=false;b.disabled=!available||queues.size>0||changingTurn;}
  }
  const roleHint=el('novaSyncTurnoHint');
  if(roleHint)roleHint.textContent='Passar ação preserva as Ações na primeira passagem; a segunda encerra sua participação neste turno. Registrar 1 Ação apenas desconta o gasto, sem resolver ataques ou testes.';
  if(el('novaSyncMapa'))el('novaSyncMapa').disabled=!!c?.active||!user()?.master;
  if(el('novaSyncInit'))el('novaSyncInit').disabled=!!c?.active;
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
  select.replaceChildren(...mine.map(t=>{const o=root.createElement('option');o.value=t.id;o.textContent=t.nome;return o;}));
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
    const label=root.createElement('span');label.textContent=t.nome;label.style.cssText='position:absolute;top:46px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#172337;font-size:12px';node.append(label);board.append(node);
   }
   const p=previews.get(t.id)||t;
   node.style.left=`${p.x/28*100}%`;node.style.top=`${p.y/14*100}%`;
   node.style.cursor=controlled(t)?'grab':'default';node.style.borderColor=t.id===select.value?'#ffd447':'#00d4ff';
  }
  drawMap();status();
 }
 function fail(e){
  const detail=String(e.code||e.message||e);
  error=detail.includes('permission-denied')?
   'O Firebase recusou salvar o movimento/turno (permission-denied). A posição voltou ao último ponto salvo. Publique as regras de turnos no Firestore; enviar o código ao GitHub não atualiza essas regras.':
   `Não foi possível salvar/sincronizar: ${detail}. O movimento não confirmado volta ao último ponto salvo.`;
  status();console.error('[Sync direta]',e);
 }
 function close(){generation++;stop?.();stopMap?.();stop=null;stopMap=null;account='';tokens.clear();previews.clear();queues.clear();mapPacket=null;mapData=null;renderedMap=null;mapRequest++;}
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
   const request=++mapRequest;
   try{
    if(p?.mapId===mapPacket?.mapId){mapPacket=p||null;draw();return;}
    const loaded=p?.mapId?await loadMap(p.mapId):null;
    if(g!==generation||request!==mapRequest)return;
    mapPacket=p||null;mapData=loaded;draw();
   }catch(e){if(g===generation&&request===mapRequest)fail(e);}
  },fail);
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
 // Apenas uma gravação em andamento por personagem. Durante a espera,
 // substitui pontos intermediários pelo destino mais recente, sem perder o final.
 async function save(id,point){
  if(!controlled(tokens.get(id)||{}))return;
  const expectedTurn=mapPacket?.combat?.active?mapPacket.combat.turnId:null;
  const existing=queues.get(id);if(existing){if(expectedTurn)existing.points.push(point);else existing.points=[point];return;}
  const q={points:[point]},g=generation;queues.set(id,q);status();
  try{
   while(q.points.length&&g===generation){
    const next=q.points.shift();
    const saved=await database.transact(async tx=>{
     const state=await tx.get(MAP_PATH);
     const path=POSITION_PATH+'/'+id,t=await tx.get(path);
     if(!t)throw new Error('Personagem não encontrado');
     const moved=moverNoTurno({...t,id},next,state,expectedTurn);
     const {id:ignored,...value}=moved;
     value.revision=t.revision+1;tx.set(path,value);return value;
    });
    if(g!==generation)return;
    error='';
    if(!tokens.has(id)||saved.revision>=tokens.get(id).revision)tokens.set(id,{...saved,id});
   }
  }catch(e){if(g===generation)fail(e);}
  finally{if(g===generation){queues.delete(id);previews.delete(id);draw();}}
 }
 const board=el('novaSyncBoard');
 function point(e){const r=board.getBoundingClientRect();return {x:Math.max(.7,Math.min(27.3,(e.clientX-r.left)/r.width*28)),y:Math.max(.8,Math.min(13.2,(e.clientY-r.top)/r.height*14))};}
 board.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  const clicked=e.target.closest('[data-token]')?.dataset.token;
  if(clicked){
   if(canView(tokens.get(clicked)||{})){el('novaSyncPersonagem').value=clicked;draw();}
   return;
  }
  const id=el('novaSyncPersonagem').value, t=tokens.get(id);
  if(!t||!controlled(t))return;
  e.preventDefault();
  try{
   const p=moverNoTurno(previews.get(id)||t,point(e),mapPacket,mapPacket?.combat?.active?mapPacket.combat.turnId:null);
   previews.set(id,p);draw();save(id,{x:p.x,y:p.y});
  }catch(e){error=e.message;status();}
 });
 el('novaSyncPersonagem').addEventListener('change',()=>{
  if(mapPacket?.combat?.active&&mapPacket.combat.schema===2){draw();return;}
  draw();
 });
 el('novaSyncMapa')?.addEventListener('change',()=>{if(user()?.master){const m=(mapas()||[]).find(x=>String(x.id)===String(el('novaSyncMapa').value));if(m)database.writeMap(MAP_PATH,{mapId:String(m.id),nome:String(m.nome||m.id),fundo:String(m.fundo||''),larguraM:Number(m.larguraM)||28,alturaM:Number(m.alturaM)||14}).catch(fail);}});
 async function changeTurn(action){
  if(queues.size||changingTurn)return;
  if(['start','end'].includes(action)?!user()?.master:!controlled(tokens.get(mapPacket?.combat?.activeId)))return;
  const expected=mapPacket?.combat?.turnId||null;
  const g=generation;
  changingTurn=true;status();
  try{
   const started=action==='start'?iniciarIniciativa(await loadCombatants([...tokens.values()]),crypto.randomUUID()):null;
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
   error='';status();
  }catch(e){fail(e);}
  finally{changingTurn=false;status();}
 }
 for(const [id,action]of [['novaSyncStart','start'],['novaSyncNext','pass'],['novaSyncSpend','spend'],['novaSyncEnd','end']])el(id)?.addEventListener('click',()=>changeTurn(action));
 status();
 return {open,close,initialize};
}
