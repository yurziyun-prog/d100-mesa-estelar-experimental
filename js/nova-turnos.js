export function saldoMovimento(token,combat){
 return Math.max(0,6-(token?.movementTurn===combat?.turnId?Number(token.movementUsed||0):0));
}
// As posições existentes usam 28 × 14 unidades; a distância usa os metros do mapa.
export function moverNoTurno(token,dest,map,expectedTurn){
 const combat=map?.combat;
 if(!combat?.active){
  if(expectedTurn)throw new Error('O turno terminou. Escolha o destino novamente.');
  return {...token,...dest};
 }
 if(combat.turnId!==expectedTurn||combat.activeId!==token.id)throw new Error('Aguarde o turno deste personagem.');
 const width=Number(map.larguraM)||28,height=Number(map.alturaM)||14;
 const dx=dest.x-token.x,dy=dest.y-token.y;
 const distance=Math.hypot(dx*width/28,dy*height/14),remaining=saldoMovimento(token,combat);
 const ratio=distance>0?Math.min(1,remaining/distance):0;
 return {...token,x:token.x+dx*ratio,y:token.y+dy*ratio,
  movementTurn:combat.turnId,movementUsed:Math.min(6,6-remaining+distance*ratio)};
}
