// Mesa Estelar v134 — Desmaio × coma × morte.
//  💤 Desmaio (inconsciente): pode fazer o teste de consciência a cada rodada e acordar sozinho, ou ser socorrido.
//  🛌 Coma: inconsciente com ferida grave num local vital (cabeça, peito, abdômen) ainda sem tratamento.
//     Não acorda sozinho: precisa de Primeiros Socorros (estabilizar) ou cura nesse local; depois vira desmaio.
//  💀 Morte: nada mais funciona.
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const VITAL=/^(cabeca|peito|abdomen|torso|tronco|nucleo|cerebro)/;
export function locaisDoComa(st){
 if(!st||st.morto||!st.inconsciente)return [];
 const max=st.hitMax||{},hit=st.hit||{},fer=st.ferimentos||{},est=st.estabilizados||{};
 return Object.keys(max).filter(k=>VITAL.test(sem(k))&&!est[k]&&(Number(hit[k]??max[k])<=0||String(fer[k]||'')==='Grave'));
}
export function emComa(st){
 if(!st||st.morto||!st.inconsciente)return false;
 if(st.coma===true)return true;
 if(st.coma===false)return false;
 return locaisDoComa(st).length>0;
}
// Rótulo curto do estado.
export function estadoVital(st){
 if(!st)return '';
 if(st.morto)return '💀 Morto';
 if(emComa(st))return '🛌 Em coma';
 if(st.inconsciente)return '💤 Desmaiado';
 if(st.incapacitado)return '🤕 Incapacitado';
 return '';
}
