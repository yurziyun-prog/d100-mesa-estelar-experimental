export function saldoMovimento(token,combat){
 return Math.max(0,6-(token?.movementTurn===(combat?.roundId||combat?.turnId)?Number(token.movementUsed||0):0));
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
  movementTurn:combat.roundId||combat.turnId,movementUsed:Math.min(6,6-remaining+distance*ratio)};
}

export function iniciarIniciativa(participants,session,d10=()=>1+Math.floor(Math.random()*10)){
 const rolls=participants.filter(p=>p.actions>0).map(p=>{
  if(!Number.isFinite(p.initiative)||!Number.isInteger(p.actions))throw new Error('Iniciativa ou Ações ausentes na ficha de '+p.nome);
  const die=d10();
  return {...p,die,total:p.initiative+die};
 }).sort((a,b)=>b.total-a.total||b.initiative-a.initiative||a.id.localeCompare(b.id));
 if(!rolls.length)throw new Error('Não há personagens com Ações disponíveis.');
 const order=rolls.map(p=>p.id),initial=Object.fromEntries(rolls.map(p=>[p.id,{remaining:p.actions,passes:0}]));
 return {schema:2,active:true,session,order,queue:order,initial,actors:initial,
  rolls:Object.fromEntries(rolls.map(p=>[p.id,{initiative:p.initiative,die:p.die,total:p.total,owner:p.donoUid||''}])),
  round:1,roundId:session+':1',sequence:0,turnId:session+':0',activeId:order[0],lastAction:''};
}

export function acaoIniciativa(c,action,expected){
 if(!c?.active||c.schema!==2||c.turnId!==expected)throw new Error('A oportunidade mudou. Confira quem age agora.');
 if(!['spend','pass'].includes(action))throw new Error('Ação inválida');
 const id=c.activeId,a=c.actors[id];
 if(!a||a.remaining<=0||a.passes>=2)throw new Error('Este personagem já encerrou suas ações.');
 const changed=action==='spend'?{...a,remaining:a.remaining-1}:{...a,passes:a.passes+1};
 let queue=c.queue;
 if(action==='pass'||changed.remaining===0){
  queue=c.queue.slice(1);
  if(action==='pass'&&changed.passes===1)queue=[...queue,id];
 }
 const renewed=queue.length===0,round=c.round+(renewed?1:0),sequence=c.sequence+1;
 if(renewed)queue=[...c.order];
 return {...c,queue,actors:renewed?structuredClone(c.initial):{...c.actors,[id]:changed},
  activeId:queue[0],round,roundId:c.session+':'+round,sequence,turnId:c.session+':'+sequence,lastAction:action};
}
