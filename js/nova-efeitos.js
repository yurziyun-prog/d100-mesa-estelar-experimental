export function mostrarAtaque(board,event){
 if(!board||!event?.source||!event?.target)return;
 const doc=board.ownerDocument,ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 280 140');svg.setAttribute('preserveAspectRatio','none');svg.dataset.attackEffect=event.id;
 svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:8;filter:drop-shadow(0 0 4px currentColor)';
 const name=String(event.item?.nome||'').toLowerCase(),saber=/espada|sabre|saber/.test(name)&&/energia|laser|força|force|luz|saber/.test(name),laser=/laser|blaster|energia|rifle/.test(name);
 const color=/faser|phaser/.test(name)?'#c56cff':/laser/.test(name)?'#ff4545':/blaster/.test(name)?'#ffd447':saber?'#64eaff':'#ffda80',a=event.source,b=event.target;
 const shape=doc.createElementNS(ns,saber?'path':'line');
 if(saber)shape.setAttribute('d','M '+(b.x*10-9)+' '+(b.y*10+7)+' Q '+(b.x*10+12)+' '+(b.y*10+12)+' '+(b.x*10+7)+' '+(b.y*10-9));
 else for(const [key,value]of Object.entries({x1:a.x*10,y1:a.y*10,x2:b.x*10,y2:b.y*10}))shape.setAttribute(key,value);
 shape.setAttribute('fill','none');shape.setAttribute('stroke',color);shape.setAttribute('stroke-width',saber?'3':'1.3');svg.append(shape);
 const flash=doc.createElementNS(ns,'circle');flash.setAttribute('cx',b.x*10);flash.setAttribute('cy',b.y*10);flash.setAttribute('r',event.hit?'4':'2');flash.setAttribute('fill',event.hit?'white':color);svg.append(flash);board.append(svg);
 svg.animate([{opacity:1},{opacity:0}],{duration:550,fill:'forwards'});setTimeout(()=>svg.remove(),600);
}
