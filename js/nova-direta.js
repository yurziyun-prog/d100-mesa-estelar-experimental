// Movimento livre: uma posição por personagem, sem sessão-mestre ou fila de comandos.
export const POSITION_PATH='combatesAtivos/mapaMesaSyncDireta/posicoes';
export const MAP_PATH='combatesAtivos/mapaMesaSyncDireta';
function normalizeMap(raw){
 if(!raw)return null;
 let dados=raw.dados;
 if(typeof dados==='string'){try{dados=JSON.parse(dados);}catch(_){dados=null;}}
 const state=raw.oficina2State||dados?.oficina2State||dados||raw;
 const elements=state?.elements||state?.elementos||raw.elements||raw.elementos||[];
 return {...raw,larguraM:Number(raw.larguraM||state?.w||28),alturaM:Number(raw.alturaM||state?.h||14),
  fundo:raw.fundo||state?.bg||state?.fundo||'',oficina2State:{...(raw.oficina2State||{}),elements:Array.isArray(elements)?elements:[]}};
}
export function mountDirectPositionLab({user,characters,mapas=()=>[],loadMap=async()=>null,database,root=document}) {
 const el=id=>root.getElementById(id), tokens=new Map(), previews=new Map(), queues=new Map();
 let stop=null,stopMap=null,account='',error='',generation=0,mapPacket=null,mapData=null;
 const controlled=t=>!!user()&&(user().master||user().uid===t.donoUid);
 function status(){el('novaSyncStatus').textContent=error||`Sincronização direta 6 · ${tokens.size} personagem(ns) · ${queues.size?'salvando posição…':'clique no destino para caminhar'}`;}
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
  const mw=Number(mapData?.larguraM||mapPacket?.larguraM||28),mh=Number(mapData?.alturaM||mapPacket?.alturaM||14);
  layer.replaceChildren(...(mapData?.oficina2State?.elements||[]).filter(e=>e.type==='image'&&e.src).map(e=>{const img=root.createElement('img');img.src=e.src;img.draggable=false;img.style.cssText=`position:absolute;left:${Number(e.x||0)/mw*100}%;top:${Number(e.y||0)/mh*100}%;width:${Number(e.w||1)/mw*100}%;height:${Number(e.h||1)/mh*100}%;object-fit:fill;opacity:${Number(e.opacity??1)}`;return img;}));
 }
 function draw(){
  const board=el('novaSyncBoard'),select=el('novaSyncPersonagem'),old=select.value;
  const mine=[...tokens.values()].filter(controlled);
  select.replaceChildren(...mine.map(t=>{const o=root.createElement('option');o.value=t.id;o.textContent=t.nome;return o;}));
  select.value=mine.some(t=>t.id===old)?old:mine[0]?.id||'';
  el('novaSyncInit').style.display=user()?.master?'':'none';
  for(const node of [...board.children])if(!tokens.has(node.dataset.token))node.remove();
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
 function fail(e){error=`Não foi possível salvar/sincronizar: ${e.code||e.message||e}`;status();console.error('[Sync direta]',e);}
 function close(){generation++;stop?.();stopMap?.();stop=null;stopMap=null;account='';tokens.clear();previews.clear();queues.clear();mapPacket=null;}
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
  stopMap=database.subscribeDoc(MAP_PATH,async p=>{if(g!==generation)return;mapPacket=p||null;mapData=mapPacket?.mapId?normalizeMap(await loadMap(mapPacket.mapId).catch(fail)):null;draw();},fail);
  draw();
 }
 async function initialize(){
  open();if(!user()?.master)return;
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
  const existing=queues.get(id);if(existing){existing.next=point;return;}
  const q={next:point},g=generation;queues.set(id,q);error='';status();
  try{
   while(q.next&&g===generation){
    const next=q.next;q.next=null;
    const saved=await database.transact(async tx=>{
     const path=POSITION_PATH+'/'+id,t=await tx.get(path);
     if(!t)throw new Error('Personagem não encontrado');
     const value={...t,...next,revision:t.revision+1};tx.set(path,value);return value;
    });
    if(g!==generation)return;
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
   if(controlled(tokens.get(clicked)||{})){el('novaSyncPersonagem').value=clicked;draw();}
   return;
  }
  const id=el('novaSyncPersonagem').value, t=tokens.get(id);
  if(!t||!controlled(t))return;
  e.preventDefault();
  const p=point(e);previews.set(id,p);draw();save(id,p);
 });
 el('novaSyncPersonagem').addEventListener('change',draw);
 el('novaSyncMapa')?.addEventListener('change',()=>{if(user()?.master){const m=(mapas()||[]).find(x=>String(x.id)===String(el('novaSyncMapa').value));if(m)database.writeMap(MAP_PATH,{mapId:String(m.id),nome:String(m.nome||m.id),fundo:String(m.fundo||''),larguraM:Number(m.larguraM)||28,alturaM:Number(m.alturaM)||14}).catch(fail);}});
 return {open,close,initialize};
}
