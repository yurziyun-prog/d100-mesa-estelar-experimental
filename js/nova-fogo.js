import {danoObjeto,distanciaObjeto} from './nova-dano-objetos.js?v=50';
import {criarRelogio,tempoRestante} from './nova-duracoes.js?v=46';
import {acaoIniciativa} from './nova-turnos.js?v=46';
import {ocupado} from './nova-suporte.js?v=46';
const text=o=>Object.values(o||{}).filter(v=>typeof v==='string'||Array.isArray(v)).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function extintor(inventory={}){return (inventory.equipado||[]).find(o=>o&&/extintor|extinguisher|灭火器/.test(text(o))&&cargas(o)>0);}
export function cargas(o){return Math.max(0,Math.floor(Number(o.usoAtual??o.uso??o.cargas??o.capacidade??0)||0));}
export function acender(o,combat,now=Date.now()){
 if(o.destruido||o.destrutivel&&Number(o.pvAtual??o.pvMax)<=0||!o.inflamavel||Number(o.inflamabilidade)<=0||o.pegandoFogo)return false;
 o.pegandoFogo=true;o.estadoFogo={clock:criarRelogio(6000,combat,now)};return true;
}
export function ignicao(o,item,critico,combat,now=Date.now()){
 const s=text(item),calor=/incendi|fogo|flame/.test(s)?5:/plasma/.test(s)?4:/laser|lamina.*energia|espada.*forca/.test(s)?3:/blaster|phaser|faser/.test(s)?2:0;
 return calor>0&&calor+(critico?2:0)>=Math.max(1,6-Number(o.inflamabilidade||0))&&acender(o,combat,now);
}
export function apagarFogo({a,health,map,cmd,scene,info,sheet}){
 if(!scene||scene.mapId!==map.mapId||cmd.mapId!==map.mapId)throw Error('O mapa mudou.');
 const state=health.actors?.[a.id]||{combateLab:info.health};
 if(state.combateLab?.inconsciente||state.combateLab?.morto||ocupado(state,map.combat))throw Error('Não pode usar extintor neste estado.');
 const next=structuredClone(scene),o=next.objects.find(o=>o.id===cmd.objectId);
 if(!o?.pegandoFogo||o.destruido)throw Error('Este objeto não está em chamas.');
 if(distanciaObjeto(a,o,map)>1.5+.001)throw Error('Fora de alcance: aproxime-se até 1,5 m da borda.');
 if(!sheet)throw Error('É necessária uma ficha persistente para consumir a carga.');
 const inventory=structuredClone(info.inventory),ext=extintor(inventory);if(!ext)throw Error('Equipe um extintor com carga.');
 ext.usoAtual=cargas(ext)-1;
 const left=Math.max(0,Number(o.estadoFogo?.restanteKg??Math.max(1,Number(o.pesoKg)||1))-100);
 o.estadoFogo={...o.estadoFogo,restanteKg:left};if(!left){o.pegandoFogo=false;o.estadoFogo={};}
 return {scene:next,inventory,actors:{...health.actors,[a.id]:{...state,inventoryRevision:Number(state.inventoryRevision||0)+1}},combat:map.combat?.active?acaoIniciativa(map.combat,'spend',map.combat.turnId):map.combat,message:a.nome+' · Extintor: '+o.nome+(left?' · faltam '+Math.ceil(left/100)+' uso(s)':' · fogo apagado')+' · carga restante '+ext.usoAtual};
}
// Uma atualização por rodada (6 s na exploração). O relógio fica na instância,
// portanto duas janelas do mestre não aplicam o mesmo pulso duas vezes.
export function avancarFogo(scene,map,positions=[],now=Date.now(),random=Math.random){
 const messages=[],exposure=[];let changed=false;
 if(!scene||scene.mapId!==map.mapId)return {changed,messages,exposure};
 const sources=[];
 for(const o of scene.objects||[]){
  if(!o.pegandoFogo||o.destruido)continue;
  const state=o.estadoFogo||={},clock=state.clock;
  if(!clock){state.clock=criarRelogio(6000,map.combat,now);changed=true;continue;}
  const left=tempoRestante(clock,map.combat,now),mode=map.combat?.active?'combat':'real';
  if(left>0){if(clock.mode!==mode||mode==='combat'&&clock.session!==map.combat.session){state.clock=criarRelogio(left,map.combat,now);changed=true;}continue;}
  state.clock=criarRelogio(6000,map.combat,now);changed=true;sources.push(structuredClone(o));
  if(o.destrutivel){const n=Math.max(1,Math.ceil(Number(o.inflamabilidade||1)/2)),r=danoObjeto(o,n,o.dureza);Object.assign(o,r.object);messages.push(o.nome+' · fogo: −'+r.dano+' PV · '+o.pvAtual+'/'+o.pvMax+(o.destruido?' · destruído':''));if(o.destruido){o.pegandoFogo=false;o.estadoFogo={};}}
 }
 for(const o of scene.objects||[]){
  if(o.pegandoFogo||o.destruido||!o.inflamavel||!sources.length)continue;
  const infl=Number(o.inflamabilidade)||0,range=.25+infl*.22;
  // Distância conservadora entre bordas, usando os retângulos girados.
  const d=Math.min(...sources.filter(f=>f.id!==o.id&&f.camada===o.camada).map(f=>Math.max(0,distanciaObjeto({...o,diametroM:Math.min(o.larguraM,o.alturaM)},f,map))));
  if(infl>0&&d<=range&&random()<Math.max(.05,Math.min(.95,infl*.16+(range-d)*.22))&&acender(o,map.combat,now))messages.push(o.nome+' · fogo se espalhou.');
 }
 for(const t of positions){const d=Math.min(...sources.filter(o=>Number(o.camada??3)===Number(t.camada??3)).map(o=>distanciaObjeto(t,o,map)));if(d<=.15)exposure.push({id:t.id,damage:2});else if(d<=.45&&random()<.45)exposure.push({id:t.id,damage:1});}
 return {changed,messages,exposure};
}
