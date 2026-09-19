import {acaoIniciativa} from './nova-turnos.js?v=46';
export const identidadeItem=i=>String(i?.instanciaId||i?.idBanco||i?.id||'');
export function moverInventario({sheet,actor={},map,cmd,validarPeso=()=>true}){
 const c=map.combat;if(!c?.active||c.activeId!==cmd.personagemId||c.turnId!==cmd.turnId||c.pendingAttack)throw Error('Aguarde sua vez e resolva o ataque pendente.');
 if(actor.combateLab?.inconsciente||actor.combateLab?.morto||actor.treatment||actor.supportLock===c.roundId)throw Error('Este personagem não pode manipular equipamentos agora.');
 const {fromComp,toComp,fromIndex,toIndex}=cmd,accessible=['equipado','bolso','mochila'];
 if(!accessible.includes(fromComp)||!accessible.includes(toComp))throw Error('Casa e veículo não estão acessíveis durante combate.');
 const inventory=structuredClone(sheet.inventario||{}),source=inventory[fromComp],dest=inventory[toComp];
 if(!Array.isArray(source)||!Array.isArray(dest)||!Number.isInteger(fromIndex)||!Number.isInteger(toIndex)||fromIndex<0||toIndex<0||fromIndex>=source.length||toIndex>=dest.length)throw Error('Compartimento ou posição inválidos.');
 const item=source[fromIndex];if(!item||identidadeItem(item)!==cmd.itemKey||identidadeItem(dest[toIndex])!==cmd.targetKey)throw Error('O inventário mudou; selecione o item novamente.');
 if(fromComp===toComp&&fromIndex===toIndex)throw Error('O item já está nessa posição.');
 const cost=fromComp!==toComp&&[fromComp,toComp].includes('equipado')?1:0;
 if(Number(c.actors?.[cmd.personagemId]?.remaining||0)<Math.max(1,cost))throw Error('Sem ações disponíveis.');
 const old=dest[toIndex]||null;dest[toIndex]=item;source[fromIndex]=old;
 if(!validarPeso(inventory,fromComp)||!validarPeso(inventory,toComp))throw Error('A transferência ultrapassa a capacidade do compartimento.');
 return {inventory,cost,combat:cost?acaoIniciativa(c,'spend',c.turnId):c,message:'Inventário: '+(item.nome||item.idBanco||'item')+' · '+fromComp+' → '+toComp+' · '+cost+' Ação'};
}
