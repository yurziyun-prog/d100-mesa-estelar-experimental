const clone = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  Object.values(value).forEach(child=>{if(child&&typeof child==='object')freeze(child);});
  return Object.freeze(value);
}
// Immutable blueprints, established before loading a session. Never read live loot.
export function createHouseModels(fixed, moveable) {
  const seed=()=>({fixed:clone(fixed),moveable:clone(moveable),shelf:Array(6).fill('book'),shelfRows:[2,2,2],rug:{x:.45,z:1.8,placed:true,collected:false}});
  const one=seed(),two=seed();
  const set=(model,label,values,index=0)=>Object.assign([...model.fixed,...model.moveable].filter(o=>o.label===label)[index],values);
  set(one,'armario',{x:6.10,z:.34});
  set(one,'bau',{x:.20,z:4.15});
  set(one,'escrivaninha',{x:4.30,z:4.10});
  set(one,'chamine',{x:6.56,z:1.22});
  set(one,'luminaria',{x:.61,z:2.21});
  set(one,'luminaria',{x:6.17,z:3.79},1);
  set(one,'mesa',{x:5.64,z:4.05});
  set(one,'banquinho',{x:4.87,z:3.58});
  // Preserve the existing Casa 2 instance layout, distinct from the base scene.
  set(two,'cama',{x:.18,z:3.84});
  set(two,'armario',{x:9.02,z:.36});
  return freeze({house1:{id:'casa-1',name:'Casa 1',width:7,depth:5,...one},house2:{id:'casa-2',name:'Casa 2',width:10,depth:5,...two}});
}
export function instantiateHouse(model) {
  return {...clone(model),door:{locked:false,open:false},chest:{locked:false,open:false},
    stores:{chest:[],drawerTop:[],drawerBottom:[],deskTop:[],table:['apple','cup','mug'],bed:[],shelf:[...model.shelf],floor:model.rug.placed?['rug']:[],inventory:[]},
    addedWindows:[],drawerOpen:[false,false],lamps:[true,true],droppedItems:[],fireplace:{wood:0,lit:false,burn:0}};
}
