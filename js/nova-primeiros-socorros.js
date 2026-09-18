// Regras puras de Primeiros Socorros para o combate sincronizado.
export const PRIMEIROS_SOCORROS_ALCANCE=1.5;
export const PRIMEIROS_SOCORROS_MAX_TURNOS=3;
export function locaisTrataveis(health={}){
 const hit=health.hit||{},max=health.hitMax||{};
 return Object.keys(max).filter(local=>Number(hit[local])<Number(max[local])&&Number(hit[local])<Number(max[local])/2||health.ferimentos?.[local]==='Grave'||health.ferimentos?.[local]==='Sério');
}
export function localPrimeirosSocorros(health={},escolha=''){
 const locais=locaisTrataveis(health);
 if(escolha&&locais.includes(escolha))return {local:escolha,exigeEscolha:false};
 if(locais.length===1)return {local:locais[0],exigeEscolha:false};
 return {local:'',exigeEscolha:locais.length>1,locais};
}
export function primeirosSocorrosPodeAlcancar(actor,target){
 if(!actor||!target)return false;
 return Math.hypot((Number(actor.x)||0)-(Number(target.x)||0),(Number(actor.y)||0)-(Number(target.y)||0))<=PRIMEIROS_SOCORROS_ALCANCE+.001;
}
export function prepararPrimeirosSocorros({turnos=1,temKit=false,usosKit=0}={}){
 const n=Math.max(1,Math.min(PRIMEIROS_SOCORROS_MAX_TURNOS,Math.floor(Number(turnos)||1)));
 return {turnos:n,custoAcoes:1,dificuldade:n>1?(n-1)*5:0,usaKit:!!temKit&&usosKit>0,usosRestantes:temKit&&usosKit>0?Math.max(0,usosKit-1):usosKit};
}
export function concluirPrimeirosSocorros({valor=0,rolagem=100,maximoLocal=1,critico=false,ferimentoGrave=false}={}){
 const v=Math.max(0,Math.min(100,Number(valor)||0)),r=Math.max(1,Math.min(100,Number(rolagem)||100));
 const sucesso=r<=v,crit=!!critico||(sucesso&&r<=Math.max(1,Math.floor(v/10)));
 if(!sucesso)return {passou:false,recuperacao:0,estabilizado:false,inconsciente:false};
 const base=Math.max(1,Math.min(3,Math.floor(Math.max(0,v-r)/20)+1));
 const recuperacao=crit?Math.max(base,Math.min(Math.max(1,Number(maximoLocal)||1),Math.max(3,Math.floor(Math.max(0,v-r)/5)))):base;
 return {passou:true,recuperacao,estabilizado:!!ferimentoGrave,inconsciente:false,critico:crit};
}
