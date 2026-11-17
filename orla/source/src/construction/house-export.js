import {state as s} from '../core/state.js';
const clone=value=>JSON.parse(JSON.stringify(value));
export function captureHouseInstance(house=null){
  const isBase=!house,kind=isBase?'house2':house.kind;
  if(!['house1','house2'].includes(kind))throw Error('Selecione uma casa.');
  const model=s.houseModels[kind],interior=isBase?{
    fixed:s.fixedSolids,moveable:s.pushables,stores:Object.fromEntries(Object.entries(s.game.stores).filter(([key])=>key!=='inventory')),
    door:s.game.door,chest:s.game.chest,drawerOpen:s.game.drawerOpen,lamps:s.game.lamps,rug:s.game.rug,
    droppedItems:s.game.droppedItems.filter(o=>s.inside(o.x,o.z)),shelfRows:s.shelfRows,fireplace:s.game.fireplace,addedWindows:s.game.addedWindows||[]
  }:s.ensureHouseState(house);
  const x=house?.x||0,z=house?.z||0;
  const components=s.editDecor.filter(o=>o!==house&&!o.hidden&&o.component&&o.x>=x&&o.z>=z&&o.x+o.w<=x+model.width&&o.z+o.d<=z+model.depth).map(o=>({...o,x:o.x-x,z:o.z-z}));
  return clone({format:'orla-house-instance',schemaVersion:1,sourceVersion:'0.54',modelId:model.id,
    instanceId:house?.instanceId||'base-house2',name:house?.name||model.name,transform:{x,z,rot:house?.rot||0},
    structure:{width:model.width,depth:model.depth,wallHeight:2.96,storeys:kind==='house2'?2:1,stair:isBase?s.stairArea:null,finish:isBase?s.houseFinish:null,floorFinish:isBase?s.baseFloorFinish:null,roof:{type:'gable-red',ridge:4.18},entrance:{x1:3.05,x2:4.23,z:5},innerWall:{x:3.6,z1:.1,z2:2.28},addedWindows:interior.addedWindows||[]},
    interior:{...interior,stores:{...interior.stores,inventory:[]}},components,
    componentAssociation:'Components wholly inside the footprint; standalone parts are not welded to the legacy shell.'});
}
export function downloadHouseInstance(house=null){
  if(!s.godMode())return;
  const payload=captureHouseInstance(house),blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=payload.modelId+'-instancia.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);s.toast('Instância exportada; modelo padrão preservado.');
}
