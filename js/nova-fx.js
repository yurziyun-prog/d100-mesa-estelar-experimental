export function tipoEfeito(item){
 const n=String(item?.nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/psiquic|psychic/.test(n)&&!/grito/.test(n))return 'psychic';
 for(const [kind,re]of [['sonic',/eco.*matilha|grito.*ps[ií]quico|cone.*son|trombeta/],['bite',/mordida|bite/],['stomp',/patada|pisot|stomp/],['tail',/cauda|calda|rabo|tail/],['phaser',/faser|phaser/],['saber',/espada|sabre|saber/],['laser',/laser/],['blaster',/blaster/]])if(re.test(n))return kind;
 return 'impact';
}
export function mostrarAtaque(board,event){
 if(!board||!event?.source||!event?.target)return;
 const doc=board.ownerDocument,ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 280 140');svg.setAttribute('preserveAspectRatio','none');svg.dataset.attackEffect=event.id;
 svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:8;overflow:hidden;';
 const type=tipoEfeito(event.item),a=event.source,b=event.target,x=b.x*10,y=b.y*10;
 const color={phaser:'#c56cff',laser:'#ff4545',blaster:'#ffd447',sonic:'#80dfff',bite:'#f2e6d0',stomp:'#c9a276',tail:'#c9ddb0',saber:'#64eaff',impact:'#ddd'}[type];
 const add=(tag,attrs)=>{const n=doc.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);return n;};
 if(type==='psychic'){
  for(const r of [3,6,9])add('circle',{cx:x,cy:y,r,fill:'none',stroke:'#dca8ff','stroke-width':'.8'});
  add('path',{d:`M ${a.x*10} ${a.y*10} Q ${(a.x*10+x)/2} ${(a.y*10+y)/2-6} ${x} ${y}`,fill:'none',stroke:'#dca8ff','stroke-width':'.8'});
 }else if(type==='sonic'&&event.area){
  const c=event.area,w=c.width||28,h=c.height||14,ax=c.source.x*w/28,ay=c.source.y*h/14;
  const heading=Math.atan2((c.aim.y-c.source.y)*h/14,(c.aim.x-c.source.x)*w/28),half=c.angle*Math.PI/360;
  const arc=f=>Array.from({length:25},(_,i)=>{const angle=heading-half+2*half*i/24;return `${(ax+Math.cos(angle)*c.range*f)*280/w},${(ay+Math.sin(angle)*c.range*f)*140/h}`;}).join(' ');
  add('polygon',{points:`${ax*280/w},${ay*140/h} `+arc(1),fill:color,'fill-opacity':'.18',stroke:color,'stroke-width':'.5'});
  for(const fraction of [.25,.5,.75,1])add('polyline',{points:arc(fraction),fill:'none',stroke:color,'stroke-width':'.8'});
 }else if(type==='bite'){
  for(const sign of [-1,1]){const jaw=add('path',{d:`M ${x-5} ${y+sign*6} L ${x-3} ${y+sign*2} L ${x-1} ${y+sign*5} L ${x+1} ${y+sign*2} L ${x+3} ${y+sign*5} L ${x+5} ${y+sign*6}`,fill:'none',stroke:color,'stroke-width':'1.3'});jaw.animate?.([{transform:`translateY(${sign*4}px)`},{transform:'translateY(0px)'}],{duration:230});}
 }else if(type==='stomp'){
  add('ellipse',{cx:x,cy:y,rx:3,ry:5,fill:color});for(const r of [5,8,11])add('ellipse',{cx:x,cy:y+3,rx:r,ry:r*.45,fill:'none',stroke:color,'stroke-width':'.7'});
 }else if(type==='tail'||type==='saber')add('path',{d:`M ${x-9} ${y+7} Q ${x+12} ${y+12} ${x+7} ${y-9}`,fill:'none',stroke:color,'stroke-width':type==='tail'?'2':'3'});
 else if(['laser','blaster','phaser'].includes(type)){
  if(type==='laser'){
   const dx=x-a.x*10,dy=y-a.y*10,len=Math.hypot(dx,dy)||1,nx=-dy/len*2.4,ny=dx/len*2.4;
   add('polygon',{points:`${a.x*10+nx},${a.y*10+ny} ${x+nx*.35},${y+ny*.35} ${x-nx*.35},${y-ny*.35} ${a.x*10-nx},${a.y*10-ny}`,fill:color,'fill-opacity':'.32',stroke:color,'stroke-width':'1.5'});
   add('line',{x1:a.x*10,y1:a.y*10,x2:x,y2:y,stroke:'#fff','stroke-width':'1.1'});
  }else add('line',{x1:a.x*10,y1:a.y*10,x2:x,y2:y,stroke:color,'stroke-width':type==='phaser'?'2.2':'1.3'});
  add('circle',{cx:x,cy:y,r:event.hit?3:1.5,fill:color});
 }else add('path',{d:`M ${x-4} ${y-4} L ${x+4} ${y+4} M ${x+4} ${y-4} L ${x-4} ${y+4}`,stroke:color,'stroke-width':1.3});
 board.append(svg);svg.animate?.([{opacity:1},{opacity:0}],{duration:type==='sonic'?1000:650,fill:'forwards'});setTimeout(()=>svg.remove(),1100);
}
export function tocarEfeito(context,item){
 if(!context)return false;
 const type=tipoEfeito(item);if(!['sonic','bite','stomp','tail','phaser','psychic'].includes(type))return false;
 const now=context.currentTime;
 const tone=(frequency,end,duration,volume,wave='sine',delay=0)=>{
  const osc=context.createOscillator(),gain=context.createGain(),start=now+delay;
  osc.type=wave;osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(end,start+duration);
  gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.015);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
  osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+duration+.01);osc.onended=()=>{osc.disconnect();gain.disconnect();};
 };
 const noise=(duration,frequency,volume)=>{
  const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=volume;
  source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.start(now);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 };
 if(type==='sonic'){tone(150,65,.8,.1,'sawtooth');tone(223,98,.7,.07,'triangle',.03);tone(307,133,.65,.04,'triangle',.07);noise(.65,650,.05);}
 if(type==='bite'){noise(.16,2200,.18);tone(190,55,.12,.07,'triangle');}
 if(type==='stomp'){tone(95,28,.32,.16);noise(.35,400,.22);}
 if(type==='tail'){noise(.2,1500,.13);tone(140,45,.14,.06);}
 if(type==='phaser'){tone(1650,310,.28,.07,'sawtooth');tone(1720,330,.25,.035,'triangle');noise(.1,3200,.025);}
 if(type==='psychic'){tone(440,660,.5,.04);tone(660,880,.5,.025,'sine',.04);}
 return true;
}
