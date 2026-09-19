export const RODADA_MS=6000;
export function criarRelogio(ms,combat,now=Date.now()){
 return {remaining:Math.max(0,ms),mode:combat?.active?'combat':'real',session:combat?.session||'',round:combat?.round||0,at:now};
}
export function tempoRestante(clock,combat,now=Date.now()){
 if(!clock)return 0;
 const elapsed=clock.mode==='real'?Math.max(0,now-clock.at):clock.session===combat?.session?Math.max(0,(combat.round||0)-clock.round)*RODADA_MS:0;
 return Math.max(0,clock.remaining-elapsed);
}
export function textoDuracao(clock,combat,now=Date.now()){
 const ms=tempoRestante(clock,combat,now);
 return combat?.active?Math.ceil(ms/RODADA_MS)+' rodada(s)':Math.ceil(ms/1000)+' s';
}
// Relógios reais são ancorados uma única vez, sem gravação a cada segundo.
export function atualizarRelogios(actors,combat,scene,now=Date.now()){
 let changed=false;
 const update=e=>{
  if(!e.clock){
   // Estados anteriores sem relógio não sobrevivem indefinidamente na exploração.
   if(!combat?.active){changed=true;return false;}
   const rounds=Math.max(0,Number(e.untilRound??((e.lastRound||0)+10))-combat.round);
   if(!rounds){changed=true;return false;}
   e.clock=criarRelogio(Math.min(60,rounds)*RODADA_MS,combat,now);changed=true;
  }
  const left=tempoRestante(e.clock,combat,now);if(left<=0){changed=true;return false;}
  if(e.maintenance){
   const m=e.maintenance,periods=Math.floor((m.remaining-left)/m.period),owner=actors[e.autorPsiId||e.source];
   if(periods>0){const cost=periods*m.cost;if(!owner||owner.combateLab?.morto||owner.combateLab?.inconsciente||Number(owner.psiMax||0)-Number(owner.psiSpent||0)<cost){changed=true;return false;}owner.psiSpent=Number(owner.psiSpent||0)+cost;m.remaining-=periods*m.period;changed=true;}
  }
  const mode=combat?.active?'combat':'real';
  if(e.clock.mode!==mode||mode==='combat'&&(e.clock.session!==combat.session||e.clock.round!==combat.round)){
   e.clock=criarRelogio(left,combat,now);changed=true;
  }
  const until=combat?.active?combat.round+Math.ceil(left/RODADA_MS):Number.MAX_SAFE_INTEGER;
  if(e.untilRound!==until){e.untilRound=until;changed=true;}
  return true;
 };
 for(const a of Object.values(actors||{})){
  for(const [id,e] of Object.entries(a.psiEffects||{}))if(!update(e))delete a.psiEffects[id];
  const st=a.combateLab;
  if(st?.unconsciousClock){const e={clock:st.unconsciousClock,untilRound:st.unconsciousUntilRound};if(update(e)){st.unconsciousClock=e.clock;st.unconsciousUntilRound=e.untilRound;}else{delete st.unconsciousClock;delete st.unconsciousUntilRound;if(!st.morto)st.inconsciente=false;}}
 }
 if(scene){
  scene.objects=(scene.objects||[]).filter(o=>!o.ilusaoPsi||update(o));
  scene.psiZones=(scene.psiZones||[]).filter(update);
 }
 return changed;
}
