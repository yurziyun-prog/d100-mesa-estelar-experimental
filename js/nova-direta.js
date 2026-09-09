// Movimento livre: uma posição por personagem, sem sessão-mestre ou fila de comandos.
export const POSITION_PATH='combatesAtivos/mapaMesaSyncDireta/posicoes';
export function mountDirectPositionLab({user,characters,database,root=document}) {
 const el=id=>root.getElementById(id), tokens=new Map(), previews=new Map(), queues=new Map();
 let stop=null,account='',drag=null,error='',generation=0;
 const controlled=t=>!!user()&&(user().master||user().uid===t.donoUid);
 function status(){el('novaSyncStatus').textContent=error||`Sincronização direta 5 · ${tokens.size} personagem(ns) · ${queues.size?'salvando posições…':'arraste pelo mouse'}`;}
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
    node.style.cssText='position:absolute;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:50%;border:3px solid #00d4ff;background:#263d62;touch-action:none;user-select:none';
    if(t.imagem){const img=root.createElement('img');img.src=t.imagem;img.draggable=false;img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none';node.append(img);}
    const label=root.createElement('span');label.textContent=t.nome;label.style.cssText='position:absolute;top:46px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#172337;font-size:12px';node.append(label);board.append(node);
   }
   const p=previews.get(t.id)||t;
   node.style.left=`${p.x/28*100}%`;node.style.top=`${p.y/14*100}%`;
   node.style.cursor=controlled(t)?'grab':'default';node.style.borderColor=t.id===select.value?'#ffd447':'#00d4ff';
  }
  status();
 }
 function fail(e){error=`Não foi possível salvar/sincronizar: ${e.code||e.message||e}`;status();console.error('[Sync direta]',e);}
 function close(){generation++;stop?.();stop=null;account='';tokens.clear();previews.clear();queues.clear();drag=null;}
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
  },fail);draw();
 }
 async function initialize(){
  open();if(!user()?.master)return;
  try{
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
  finally{if(g===generation){queues.delete(id);if(drag?.id!==id)previews.delete(id);draw();}}
 }
 const board=el('novaSyncBoard');
 function point(e){const r=board.getBoundingClientRect();return {x:Math.max(.7,Math.min(27.3,(e.clientX-r.left)/r.width*28)),y:Math.max(.8,Math.min(13.2,(e.clientY-r.top)/r.height*14))};}
 board.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  const id=e.target.closest('[data-token]')?.dataset.token;
  if(!id||!controlled(tokens.get(id)||{}))return;
  e.preventDefault();el('novaSyncPersonagem').value=id;drag={id,last:0,moved:false};board.setPointerCapture(e.pointerId);draw();
 });
 board.addEventListener('pointermove',e=>{
  if(!drag)return;e.preventDefault();drag.moved=true;
  const p=point(e);previews.set(drag.id,p);draw();
  if(performance.now()-drag.last>=150){drag.last=performance.now();save(drag.id,p);}
 });
 board.addEventListener('pointerup',e=>{
  if(!drag)return;const d=drag;drag=null;
  if(board.hasPointerCapture(e.pointerId))board.releasePointerCapture(e.pointerId);
  if(d.moved){const p=point(e);previews.set(d.id,p);save(d.id,p);}else draw();
 });
 board.addEventListener('pointercancel',()=>{if(drag){const id=drag.id;drag=null;if(!queues.has(id))previews.delete(id);draw();}});
 el('novaSyncPersonagem').addEventListener('change',draw);
 return {open,close,initialize};
}
