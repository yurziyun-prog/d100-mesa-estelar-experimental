/* Mesa Estelar v46.82.3
   Camada DOM independente para entidades interativas.
   Não usa labEstado_.objetosLab, labObjetoHtml_, gm2toLegacy ou renderer legado. */
export function createMapEntities(api){
  const entities=[];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const modelById=id=>(api.getModels?.()||[]).find(m=>String(m.id)===String(id))||null;

  function create(modelId,data={}){
    const m=modelById(modelId);
    if(!m) throw new Error(`Modelo não encontrado: ${modelId}`);
    const snap=clone(m);
    const pvMax=Math.max(0,num(data.pvMax ?? m.pvMax ?? m.pv,0));
    return {
      ...snap,
      id:data.id||`ment:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
      modeloId:String(m.id),
      nome:m.nome||m.name||m.id||'Objeto',
      imagem:m.imagem||m.image||'',
      x:num(data.x,1.5), y:num(data.y,1.5),
      larguraM:Math.max(.1,num(data.larguraM ?? m.larguraM ?? m.largura,1)),
      alturaM:Math.max(.1,num(data.alturaM ?? m.alturaM ?? m.altura,1)),
      angulo:num(data.angulo,0),
      pvMax,
      pvAtual:Math.max(0,num(data.pvAtual,pvMax)),
      dureza:Math.max(0,num(data.dureza ?? m.dureza,0)),
      pesoKg:Math.max(0,num(data.pesoKg ?? m.pesoKg ?? m.peso,0)),
      destruido:!!data.destruido,
      __mapEntity823:true
    };
  }

  function mapEl(){ return document.getElementById('labMetricMap'); }

  function ensureLayer(){
    const map=mapEl();
    if(!map) return null;
    let layer=map.querySelector(':scope > #mapEntitiesLayer823');
    if(!layer){
      layer=document.createElement('div');
      layer.id='mapEntitiesLayer823';
      layer.setAttribute('data-map-entities','46.82.3');
      layer.style.cssText='position:absolute;inset:0;z-index:999;pointer-events:none;overflow:hidden;';
      map.appendChild(layer);
    }
    return layer;
  }

  function render(){
    const map=mapEl();
    const layer=ensureLayer();
    if(!map||!layer) return false;
    const info=api.getMapInfo?.()||{};
    const larguraM=Math.max(.1,num(info.larguraM,28));
    const alturaM=Math.max(.1,num(info.alturaM,14));
    // Deriva a escala do próprio DOM sempre que possível.
    const ppmX=(map.clientWidth||0)/larguraM;
    const ppmY=(map.clientHeight||0)/alturaM;
    const ppm=(ppmX>1&&ppmY>1)?Math.min(ppmX,ppmY):Math.max(1,num(info.ppm,48));

    layer.innerHTML='';
    for(const o of entities){
      if(o.destruido) continue;
      const w=Math.max(18,o.larguraM*ppm), h=Math.max(18,o.alturaM*ppm);
      const el=document.createElement('div');
      el.className='map-entity-823';
      el.dataset.entityId=o.id;
      el.style.cssText=`position:absolute;left:${o.x*ppm-w/2}px;top:${o.y*ppm-h/2}px;width:${w}px;height:${h}px;transform:rotate(${o.angulo}deg);transform-origin:center;pointer-events:auto;cursor:grab;z-index:1;`;

      if(o.imagem){
        const img=document.createElement('img');
        img.src=o.imagem;
        img.alt=o.nome||'Objeto';
        img.draggable=false;
        img.style.cssText='width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55));';
        el.appendChild(img);
      }else{
        el.textContent='🧱';
        el.style.fontSize=`${Math.max(20,Math.min(w,h)*.65)}px`;
        el.style.display='grid';el.style.placeItems='center';
      }

      const badge=document.createElement('div');
      badge.textContent=`${o.nome} · PV ${o.pvAtual}/${o.pvMax} · Dur ${o.dureza}`;
      badge.style.cssText='position:absolute;left:50%;bottom:-20px;transform:translateX(-50%);white-space:nowrap;background:rgba(7,12,25,.92);border:1px solid rgba(110,210,255,.65);border-radius:5px;color:#e9f7ff;padding:2px 5px;font:700 10px/1.2 Arial,sans-serif;pointer-events:none;';
      el.appendChild(badge);

      // Arraste totalmente independente do motor legado.
      el.addEventListener('pointerdown',ev=>{
        if(ev.button!==0) return;
        ev.preventDefault();ev.stopPropagation();
        const rect=map.getBoundingClientRect();
        el.setPointerCapture?.(ev.pointerId);
        const move=e=>{
          o.x=Math.max(0,Math.min(larguraM,(e.clientX-rect.left)/ppm));
          o.y=Math.max(0,Math.min(alturaM,(e.clientY-rect.top)/ppm));
          el.style.left=`${o.x*ppm-w/2}px`;
          el.style.top=`${o.y*ppm-h/2}px`;
        };
        const up=()=>{
          window.removeEventListener('pointermove',move,true);
          window.removeEventListener('pointerup',up,true);
          api.onChange?.(entities);
        };
        window.addEventListener('pointermove',move,true);
        window.addEventListener('pointerup',up,true);
      });

      layer.appendChild(el);
    }
    return true;
  }

  function add(modelId,data={}){
    const o=create(modelId,data);
    entities.push(o);
    render();
    api.onChange?.(entities);
    return o;
  }
  function getAll(){return entities;}
  function get(id){return entities.find(o=>String(o.id)===String(id))||null;}
  function clear(){entities.splice(0);render();api.onChange?.(entities);}

  // Se o renderer antigo substituir o mapa inteiro, recria nossa camada sozinho.
  const root=document.getElementById('labMapContainer') || document.body;
  const observer=new MutationObserver(()=>{
    if(entities.length && !document.querySelector('#labMetricMap > #mapEntitiesLayer823')){
      queueMicrotask(render);
    }
  });
  observer.observe(root,{childList:true,subtree:true});

  return Object.freeze({add,get,getAll,clear,create,modelById,render});
}
