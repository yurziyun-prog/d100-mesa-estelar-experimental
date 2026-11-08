// Decodificador do export Firestore REST (mapas-remotos.json) → documentos em JS puro.
// O export usa o formato REST do Firestore: {name, fields:{campo:{stringValue|integerValue|...}}, ...}.
// As partes com array-dentro-de-array já vêm embrulhadas como {__arrV205:[...]} — o próprio app desembrulha
// ao ler (mesaDecodificarAninhadosV205_), então aqui mantemos exatamente o formato que o Firestore de verdade devolveria.
const fs=require('fs'),path=require('path');
const RAIZ=path.resolve(__dirname,'..');
const EXPORT_PADRAO=path.join(RAIZ,'arte-fonte/travessia-20261015/mapas-remotos.json');

function decodificarValor(v){
  if(v===null||v===undefined)return null;
  if('stringValue' in v)return v.stringValue;
  if('booleanValue' in v)return v.booleanValue===true;
  if('integerValue' in v){const n=Number(v.integerValue);return Number.isSafeInteger(n)?n:Number(v.integerValue);}
  if('doubleValue' in v)return Number(v.doubleValue);
  if('timestampValue' in v)return v.timestampValue; // ISO string: o app trata string como data em vários lugares
  if('referenceValue' in v)return v.referenceValue;
  if('nullValue' in v)return null;
  if('geoPointValue' in v)return v.geoPointValue;
  if('arrayValue' in v)return (v.arrayValue?.values||[]).map(decodificarValor);
  if('mapValue' in v)return decodificarCampos(v.mapValue?.fields||{});
  return undefined;
}
function decodificarCampos(fields){
  const o={};
  for(const [k,v] of Object.entries(fields||{}))o[k]=decodificarValor(v);
  return o;
}

let _cache=null;
function abrirExport(arq=EXPORT_PADRAO){
  if(_cache&&_cache.arq===arq)return _cache.docs;
  const j=JSON.parse(fs.readFileSync(arq,'utf8'));
  const brutos=Array.isArray(j)?j:(Array.isArray(j.writes)?j.writes.map(w=>w.update||{name:w.delete,_delete:true}):[]);
  const docs=brutos.filter(d=>d&&!d._delete).map(d=>({id:d.name.split('/').pop(),caminho:d.name.replace(/^projects\/[^/]+\/databases\/\(default\)\/documents\//,''),dados:decodificarCampos(d.fields||{})}));
  _cache={arq,docs};
  return docs;
}
// Documento de cabeçalho de um mapa (mapas/<id>) já em JS puro.
function mapa(id,arquivo){
  const d=abrirExport(arquivo).find(x=>x.id===id&&/^mapas\//.test(x.caminho));
  if(!d)throw new Error('mapa não encontrado no export: '+id);
  return d.dados;
}
// Cabeçalhos de vários mapas de uma vez: {id: dados}
function mapas(ids,arquivo){const out={};for(const id of ids)out[id]=mapa(id,arquivo);return out;}

module.exports={abrirExport,mapa,mapas,decodificarCampos,decodificarValor};
