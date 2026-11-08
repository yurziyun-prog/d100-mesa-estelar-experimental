import {camadaEntidade,impactoObjeto} from './nova-camadas.js?v=48';
import {diametroMiniatura} from './nova-recuperacao.js?v=99';
export const TOKEN_DIAMETER=1.4; // só para colocar miniaturas novas sem sobrepor; NÃO é mais o piso da colisão entre corpos
/** v205: raio do CORPO que ocupa espaço = o espaço visual da miniatura (diâmetro de solo da arte de cima, sem asas/cauda/arma); sem arte medida, o diâmetro do token. Só esse espaço bloqueia outros corpos. */
export const raioCorpoM=t=>{let r=null;try{r=globalThis.mesaRaioCorpoV205?.(t);}catch(_){}return Number.isFinite(r)&&r>0?r:diametroMiniatura(t)/2;};
export const RAIO_CORPO=.8;
/** v205: contra paredes/móveis o corpo é o espaço VISUAL da miniatura (pessoa de cima: ombros de ~0,6 m; criatura: diâmetro de solo da arte); sem arte medida, 80% do diâmetro do token como antes */
export const raioParaObjetos=t=>{let r=null;try{r=globalThis.mesaRaioCorpoV205?.(t);}catch(_){}return Number.isFinite(r)&&r>0?r:diametroMiniatura(t)/2*RAIO_CORPO;};
// Sweep the whole segment, so distant destinations cannot jump over a token.
export function destinoSemColisao(token,dest,others,map={},objects=[]){
 const sx=(Number(map?.larguraM)||28)/28,sy=(Number(map?.alturaM)||14)/14;
 const dx=(dest.x-token.x)*sx,dy=(dest.y-token.y)*sy,a=dx*dx+dy*dy;
 if(a<1e-12)return {...dest};
 let ratio=1;
 const voa=!!globalThis.mesaVoandoV203?.(token.id); // v203: quem voa numa montaria alada passa por cima de paredes e objetos
 for(const other of others){
  if(other.id===token.id||camadaEntidade(other)!==camadaEntidade(token))continue;
  if(globalThis.mesaEspacoV205&&!globalThis.mesaEspacoV205.sobrepoemVertical(token,other))continue; // v205: voador alto passa por cima de quem está no chão
  const diameter=raioCorpoM(token)+raioCorpoM(other); // v205: soma dos raios dos corpos (antes: no mínimo 1,4 m, o que travava corredores com espaço de sobra)
  const x=(token.x-other.x)*sx,y=(token.y-other.y)*sy,b=x*dx+y*dy,c=x*x+y*y-diameter**2;
  if(c<0){if(b<0)ratio=0;continue;}
  const discriminant=b*b-a*c;
  if(b>=0||discriminant<0)continue;
  const hit=(-b-Math.sqrt(discriminant))/a;
  if(hit>=0&&hit<=ratio)ratio=Math.max(0,hit-1e-6);
 }
 for(const o of objects){
  if(!o.bloqueiaMovimento||o.destruido||camadaEntidade(o)!==camadaEntidade(token))continue;
  if(globalThis.mesaEspacoV205?globalThis.mesaEspacoV205.passaPorCima(token,o):voa)continue; // v205: depende da altura real do objeto
  // v120: o corpo que bate em paredes/objetos é um pouco menor que a base desenhada (80%):
  // uma pessoa (1 m) passa folgada por um vão de 1 m em vez de prender na quina.
  ratio=Math.min(ratio,impactoObjeto({x:token.x*sx,y:token.y*sy},{x:dest.x*sx,y:dest.y*sy},raioParaObjetos(token),{...o,x:o.x*sx,y:o.y*sy}));
 }
 return {x:token.x+(dest.x-token.x)*ratio,y:token.y+(dest.y-token.y)*ratio};
}

// Mantém o centro da miniatura dentro do mapa usando o diâmetro real dela.
// As coordenadas persistidas continuam no sistema lógico 28 × 14.
export function conterTokenNoMapa(token,ponto,map={}){
 const w=Number(map?.larguraM)||28,h=Number(map?.alturaM)||14,r=Math.max(0,diametroMiniatura(token)/2);
 const rx=Math.min(14,r*28/w),ry=Math.min(7,r*14/h);
 return {x:Math.max(rx,Math.min(28-rx,Number(ponto?.x)||0)),y:Math.max(ry,Math.min(14-ry,Number(ponto?.y)||0))};
}

// Linha reta do centro do atacante ao centro do alvo. Um obstáculo sólido na
// mesma camada bloqueia a linha se o segmento realmente atravessar sua área.
export function linhaBloqueadaPorObjetos(origem,destino,map={},objects=[],opcoes={}){
 const camada=Number.isFinite(Number(opcoes.camada))?Number(opcoes.camada):camadaEntidade(origem);
 const ignorar=new Set((opcoes.ignorarIds||[]).map(String));
 const sx=(Number(map?.larguraM)||28)/28,sy=(Number(map?.alturaM)||14)/14;
 const start={x:Number(origem?.x||0)*sx,y:Number(origem?.y||0)*sy},end={x:Number(destino?.x||0)*sx,y:Number(destino?.y||0)*sy};
 for(const o of objects||[]){
  if(!o||ignorar.has(String(o.id))||o.destruido||camadaEntidade(o)!==camada||!o.bloqueiaMovimento)continue;
  const hit=impactoObjeto(start,end,0,{...o,x:Number(o.x||0)*sx,y:Number(o.y||0)*sy});
  if(hit<1-1e-6)return true;
 }
 return false;
}

