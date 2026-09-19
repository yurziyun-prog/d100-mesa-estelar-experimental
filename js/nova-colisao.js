import {camadaEntidade,impactoObjeto} from './nova-camadas.js?v=48';
import {diametroMiniatura} from './nova-recuperacao.js?v=46';
export const TOKEN_DIAMETER=1.4;
// Sweep the whole segment, so distant destinations cannot jump over a token.
export function destinoSemColisao(token,dest,others,map={},objects=[]){
 const sx=(Number(map?.larguraM)||28)/28,sy=(Number(map?.alturaM)||14)/14;
 const dx=(dest.x-token.x)*sx,dy=(dest.y-token.y)*sy,a=dx*dx+dy*dy;
 if(a<1e-12)return {...dest};
 let ratio=1;
 for(const other of others){
  if(other.id===token.id||camadaEntidade(other)!==camadaEntidade(token))continue;
  const diameter=Math.max(TOKEN_DIAMETER,(diametroMiniatura(token)+diametroMiniatura(other))/2);
  const x=(token.x-other.x)*sx,y=(token.y-other.y)*sy,b=x*dx+y*dy,c=x*x+y*y-diameter**2;
  if(c<0){if(b<0)ratio=0;continue;}
  const discriminant=b*b-a*c;
  if(b>=0||discriminant<0)continue;
  const hit=(-b-Math.sqrt(discriminant))/a;
  if(hit>=0&&hit<=ratio)ratio=Math.max(0,hit-1e-6);
 }
 for(const o of objects){
  if(!o.bloqueiaMovimento||o.destruido||camadaEntidade(o)!==camadaEntidade(token))continue;
  ratio=Math.min(ratio,impactoObjeto({x:token.x*sx,y:token.y*sy},{x:dest.x*sx,y:dest.y*sy},diametroMiniatura(token)/2,{...o,x:o.x*sx,y:o.y*sy}));
 }
 return {x:token.x+(dest.x-token.x)*ratio,y:token.y+(dest.y-token.y)*ratio};
}
