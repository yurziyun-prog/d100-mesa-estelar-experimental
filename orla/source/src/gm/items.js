import {state as s} from '../core/state.js';
export function installMasterItems(){
 let pending=null;const panel=document.getElementById('powersPanel'),box=document.createElement('fieldset');box.id='masterItems';box.innerHTML='<legend>Criar itens</legend><label>Item <select id="masterItemType"></select></label><label>Quantidade <input id="masterItemCount" type="number" min="1" max="50" value="1"></label><label>Destino <select id="masterItemDestination"><option value="inventory">Mochila</option><option value="chest">Baú da casa base</option><option value="world">Cenário — clique para colocar</option></select></label><button id="masterCreateItem" type="button">Materializar</button><p>Deus pode recriar itens consumidos. Esc cancela a colocação.</p>';panel.append(box);
 const select=box.querySelector('#masterItemType');for(const [id,spec] of Object.entries(s.ITEM_SPEC))select.add(new Option(spec.name,id));
 s.materializeItem=(type,count,destination,point)=>{
  if(!s.godMode()||!s.ITEM_SPEC[type]||!Number.isInteger(count)||count<1||count>50||!['inventory','chest','world'].includes(destination))return false;
  if(destination==='world'){if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.z)||Math.abs(point.x)>60||Math.abs(point.z)>60)return false;for(let i=0;i<count;i++){s.game.droppedItems.push({type,x:point.x+(i%5)*.08,z:point.z+Math.floor(i/5)*.08});s.game.stores.floor.push(type);}}
  else {const items=s.game.stores[destination],litres=s.ITEM_SPEC[type].litres;if(items.length+count>50||s.storeLoad(destination)+litres*count>s.STORAGE_LIMIT[destination])return s.toast('Sem espaço para essa quantidade. Escolha o cenário ou reduza a quantidade.'),false;items.push(...Array(count).fill(type));}
  s.inventoryDraw();s.saveGame();s.renderCombat();s.toast(count+' × '+s.itemLabel(type)+' criado(s).');return true;
 };
 box.querySelector('#masterCreateItem').onclick=()=>{if(!s.godMode())return;const type=select.value,count=Number(box.querySelector('#masterItemCount').value),destination=box.querySelector('#masterItemDestination').value;if(destination==='world'){if(!Number.isInteger(count)||count<1||count>50)return;pending={type,count};s.masterItemPlacement=true;panel.classList.remove('open');s.toast('Clique no chão para materializar. Esc cancela.');}else s.materializeItem(type,count,destination);};
 document.addEventListener('pointerdown',e=>{if(!pending||!s.godMode()||e.target.id!=='game'||e.button!==0)return;const p=s.worldAt(e.clientX,e.clientY);s.materializeItem(pending.type,pending.count,'world',p);pending=null;s.masterItemPlacement=false;e.preventDefault();e.stopImmediatePropagation();},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){pending=null;s.masterItemPlacement=false;}});
 // Replace the old prompt with the complete catalogue, including consumables.
 document.getElementById('godCreateItem').onclick=()=>{if(s.godMode())box.scrollIntoView({block:'nearest'});};
}
