import {state as s} from '../core/state.js';
export function movementProfile(){
 const sprint=!!((s.keys.has('c')||s.runMouseBoth)&&(s.godMode()||(s.fatigue||0)>2.5));
 const speed=(s.godMode()?3.7:Math.max(1.5,s.SHEETS.traveler.mov*.5))*(sprint?(s.godMode()?2.6:1.7):1);
 return {speed,sprint};
}
