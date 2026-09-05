/* Mesa Estelar v46.82.2
   Primeiro módulo ES real: entidades interativas independentes da Oficina 2. */
export function createMapEntities(api){
  const entities=[];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const modelById=id=>(api.getModels()||[]).find(m=>String(m.id)===String(id))||null;

  function create(modelId,data={}){
    const m=modelById(modelId);
    if(!m)throw new Error(`Modelo não encontrado: ${modelId}`);
    const snap=clone(m);
    const pvMax=Math.max(0,num(data.pvMax??m.pvMax??m.pv,0));
    return {
      ...snap,dadosBanco:snap,
      id:data.id||`ment:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
      modeloId:String(m.id),objetoBancoId:String(m.id),
      nome:m.nome||m.name||m.id||'Objeto',name:m.name||m.nome||m.id||'Objeto',
      imagem:m.imagem||m.image||'',
      x:num(data.x,1.3),y:num(data.y,1.3),
      larguraM:Math.max(.05,num(data.larguraM??m.larguraM??m.largura,1)),
      alturaM:Math.max(.05,num(data.alturaM??m.alturaM??m.altura,1)),
      angulo:num(data.angulo,0),
      pvMax,pvAtual:Math.max(0,num(data.pvAtual,pvMax)),
      dureza:Math.max(0,num(data.dureza??m.dureza,0)),
      pesoKg:Math.max(0,num(data.pesoKg??m.pesoKg??m.peso,0)),
      destruido:!!data.destruido,pegandoFogoLab:!!data.pegandoFogoLab,
      fogoUltimaRodadaLab:num(data.fogoUltimaRodadaLab,-1),
      __mapEntityES:true
    };
  }

  function ensureLayer(){
    const map=document.getElementById('labMetricMap');
    if(!map)return null;
    let layer=map.querySelector(':scope > #mapEntitiesLayer822');
    if(!layer){
      layer=document.createElement('div');
      layer.id='mapEntitiesLayer822';
      layer.style.cssText='position:absolute;inset:0;z-index:40;pointer-events:none;overflow:visible;';
      map.appendChild(layer);
    }
    return layer;
  }

  function render(){
    const layer=ensureLayer();if(!layer)return false;
    const info=api.getMapInfo?.()||{};
    const ppm=Math.max(1,num(info.ppm,48));
    layer.innerHTML=entities.map(o=>api.renderObjectHtml(o,ppm)).join('')+
      entities.map(o=>api.renderMicroHtml(o,ppm)).join('');
    layer.querySelectorAll('.lab-map-object,.lab-micro-actions').forEach(n=>n.style.pointerEvents='auto');
    return true;
  }

  function add(modelId,data={}){const o=create(modelId,data);entities.push(o);render();return o;}
  function get(id){return entities.find(o=>String(o.id)===String(id))||null;}
  function getAll(){return entities;}
  function remove(id){const i=entities.findIndex(o=>String(o.id)===String(id));if(i<0)return false;entities.splice(i,1);render();return true;}
  function clear(){entities.splice(0);render();}
  function exportRefs(){return entities.map(o=>({id:o.id,modeloId:o.modeloId,x:o.x,y:o.y,larguraM:o.larguraM,alturaM:o.alturaM,angulo:o.angulo,pvAtual:o.pvAtual,pvMax:o.pvMax,dureza:o.dureza,destruido:!!o.destruido,pegandoFogoLab:!!o.pegandoFogoLab,fogoUltimaRodadaLab:num(o.fogoUltimaRodadaLab,-1)}));}
  function importRefs(refs){entities.splice(0);for(const r of (Array.isArray(refs)?refs:[])){try{entities.push(create(r.modeloId,r));}catch(e){console.warn('[MapEntities 46.82.2] referência ignorada',r,e);}}render();return entities;}

  return Object.freeze({add,remove,get,getAll,clear,create,modelById,render,exportRefs,importRefs});
}
