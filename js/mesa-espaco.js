// Mesa Estelar v205 — espaço físico mínimo e ÚNICO: altitude dos pés e altura do corpo.
// Usado pela colisão (corpo × corpo, corpo × objeto), pela ordem de desenho e pelos perigos (lava). Só leitura: não grava nada.
// Altitude em metros acima do piso do nível em que o corpo está. Quem voa a 5 m passa por cima de gente, rochas e troncos; quem voa baixo (3 m) ainda bate em paredes e troncos.
import {ESCALA_FISICA} from './mesa-escala-fisica.js?v=205';
export const ALTITUDE_MONTARIA_VOANDO=5, ALTITUDE_VOADOR_NATURAL=3, ALTURA_PESSOA=1.8, FOLGA_VERTICAL=.3;
const sem=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const decod=id=>{let d=String(id||'');try{d=decodeURIComponent(d);}catch(_){}return d;};
const VOADOR=/alado|pterodatil|voador|vespa|mariposa/;
export const ehVoadorNatural=id=>VOADOR.test(sem(decod(id)));
const ehCriatura=id=>/^(synccriatura|syncnpc)/.test(decod(id));
/** altura do corpo em pé (m): do catálogo físico quando existe; pessoas 1,8 m; criatura sem dado 1,2 m */
export function alturaCorpoM(token){
 const f=ESCALA_FISICA[String(token?.arte3dV200||'')];if(f?.alturaM)return f.alturaM;
 return ehCriatura(token?.id)?1.2:ALTURA_PESSOA;}
/** altitude dos pés: montaria voando = 5 m; criatura que voa por natureza = 3 m; o resto, no piso */
export function altitudePesM(token,voando=false){
 if(voando)return ALTITUDE_MONTARIA_VOANDO;
 if(ehCriatura(token?.id)&&ehVoadorNatural(token.id))return ALTITUDE_VOADOR_NATURAL;
 return 0;}
export const intervaloM=(token,voando=false)=>{const a=altitudePesM(token,voando);return [a,a+alturaCorpoM(token)];};
/** dois corpos se bloqueiam só se os intervalos verticais se sobrepõem (com folga) */
export const sobrepoemVertical=(a,b,voandoA=false,voandoB=false)=>{const A=intervaloM(a,voandoA),B=intervaloM(b,voandoB);return A[0]<B[1]-FOLGA_VERTICAL&&B[0]<A[1]-FOLGA_VERTICAL;};
/** altura aproximada de um objeto sólido (m): o dado do objeto quando existe (alturaZM), senão por tipo */
export function alturaObjetoM(o){
 const z=Number(o?.alturaZM);if(Number.isFinite(z)&&z>0)return z;
 const t=sem((o?.erTipo||'')+' '+(o?.nome||''));
 if(/parede|porta|janela|muro|torre|escada/.test(t))return 3;
 if(/tronco|palmeira|arvore|pinheiro/.test(t))return 4;
 if(/rocha|pedra|rochoso|pedregulho/.test(t))return 1.5;
 return 1.5;}
/** o corpo passa por cima do objeto? (pés acima do topo + folga) */
export const passaPorCima=(altitudePes,o)=>altitudePes>=alturaObjetoM(o)+FOLGA_VERTICAL;
export function instalarEspaco({controller}={}){
 const ctl=()=>{try{return controller?.()||null;}catch(_){return null;}};
 const tk=t=>typeof t==='object'?t:ctl()?.token?.(t)||{id:t};
 const voa=t=>!!globalThis.mesaVoandoV203?.(t?.id);
 const api={altitudePes:t=>{t=tk(t);return altitudePesM(t,voa(t));},alturaCorpo:t=>alturaCorpoM(tk(t)),intervalo:t=>{t=tk(t);return intervaloM(t,voa(t));},
  sobrepoemVertical:(a,b)=>{a=tk(a);b=tk(b);return sobrepoemVertical(a,b,voa(a),voa(b));},passaPorCima:(t,o)=>{t=tk(t);return passaPorCima(altitudePesM(t,voa(t)),o);},alturaObjeto:alturaObjetoM};
 globalThis.mesaEspacoV205=api;return api;}
