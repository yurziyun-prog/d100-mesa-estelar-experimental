export function alvosNoCone(source,aim,tokens,map,{range=15,angle=60}={}){
 const sx=(Number(map.larguraM)||28)/28,sy=(Number(map.alturaM)||14)/14;
 const heading=Math.atan2((aim.y-source.y)*sy,(aim.x-source.x)*sx),half=angle*Math.PI/360;
 return tokens.filter(t=>{
  if(t.id===source.id)return false;
  const dx=(t.x-source.x)*sx,dy=(t.y-source.y)*sy,d=Math.hypot(dx,dy);
  const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-heading),Math.cos(Math.atan2(dy,dx)-heading));
  return d<=range+1e-8&&(d<1e-8||Math.abs(delta)<=half+1e-8);
 });
}
