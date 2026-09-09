export const TOKEN_DIAMETER=1.4;
// Sweep the whole segment, so distant destinations cannot jump over a token.
export function destinoSemColisao(token,dest,others,map={}){
 const sx=(Number(map?.larguraM)||28)/28,sy=(Number(map?.alturaM)||14)/14;
 const dx=(dest.x-token.x)*sx,dy=(dest.y-token.y)*sy,a=dx*dx+dy*dy;
 if(a<1e-12)return {...dest};
 let ratio=1;
 for(const other of others){
  if(other.id===token.id)continue;
  const x=(token.x-other.x)*sx,y=(token.y-other.y)*sy,b=x*dx+y*dy,c=x*x+y*y-TOKEN_DIAMETER**2;
  if(c<0){if(b<0)ratio=0;continue;}
  const discriminant=b*b-a*c;
  if(b>=0||discriminant<0)continue;
  const hit=(-b-Math.sqrt(discriminant))/a;
  if(hit>=0&&hit<=ratio)ratio=Math.max(0,hit-1e-6);
 }
 return {x:token.x+(dest.x-token.x)*ratio,y:token.y+(dest.y-token.y)*ratio};
}
