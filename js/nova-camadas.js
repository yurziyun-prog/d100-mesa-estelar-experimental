export const camadaEntidade=e=>Number.isFinite(Number(e?.camada))?Number(e.camada):3;
export function ordenarCamadas(nodes){return [...nodes].sort((a,b)=>camadaEntidade(a)-camadaEntidade(b)||(a.token?1:0)-(b.token?1:0));}
// Exact sweep of a circle against a rotated rectangular footprint (rounded corners).
export function impactoObjeto(start,end,radius,o){
 const angle=-(Number(o.angulo)||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const local=p=>({x:(p.x-o.x)*c-(p.y-o.y)*s,y:(p.x-o.x)*s+(p.y-o.y)*c});
 const a=local(start),b=local(end),dx=b.x-a.x,dy=b.y-a.y,hx=Math.max(.05,Number(o.larguraM)/2||.5),hy=Math.max(.05,Number(o.alturaM)/2||.5);
 const clearance=p=>{const x=Math.abs(p.x)-hx,y=Math.abs(p.y)-hy;return Math.hypot(Math.max(0,x),Math.max(0,y))+Math.min(Math.max(x,y),0)-radius;};
 if(clearance(a)<-1e-8){const epsilon={x:a.x+dx*1e-5,y:a.y+dy*1e-5};return clearance(epsilon)>=clearance(a)-1e-9&&clearance(b)>=clearance(a)?1:0;}
 let result=1;
 const hit=t=>{if(t>=0&&t<result)result=t;};
 for(const sign of [-1,1]){
  if(dx*sign<0){const t=(sign*(hx+radius)-a.x)/dx;if(Math.abs(a.y+dy*t)<=hy)hit(t);}
  if(dy*sign<0){const t=(sign*(hy+radius)-a.y)/dy;if(Math.abs(a.x+dx*t)<=hx)hit(t);}
 }
 const len=dx*dx+dy*dy;
 if(len>1e-15)for(const x of [-hx,hx])for(const y of [-hy,hy]){
  const px=a.x-x,py=a.y-y,dot=px*dx+py*dy,disc=dot*dot-len*(px*px+py*py-radius*radius);
  if(dot<0&&disc>1e-12){const t=(-dot-Math.sqrt(disc))/len;if((a.x+dx*t)*Math.sign(x)>=hx&&(a.y+dy*t)*Math.sign(y)>=hy)hit(t);}
 }
 return result<1?Math.max(0,result-1e-6):1;
}
