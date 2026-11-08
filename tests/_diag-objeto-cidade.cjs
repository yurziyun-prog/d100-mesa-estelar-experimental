const {mapas}=require('./_mapas-remotos.cjs');
const M=mapas(['cidade_sem_nome_20261013']);
const mm=M['cidade_sem_nome_20261013'],W=Number(mm.larguraM)||56,H=Number(mm.alturaM)||56;
const px=11.8*W/28,py=7.6*H/14;
console.log('herói em (m):',px.toFixed(1),py.toFixed(1),'W,H=',W,H);
const objs=(mm.mesaScene?.objects||[]).filter(o=>o&&o.bloqueiaMovimento&&!o.destruido);
const perto=objs.map(o=>{const ox=Number(o.x)*W/28,oy=Number(o.y)*H/14;return {d:+Math.hypot(ox-px,oy-py).toFixed(2),nome:String(o.nome||o.modeloId||o.tipo||'').slice(0,28),x:+ox.toFixed(1),y:+oy.toFixed(1),w:+(Number(o.larguraM)||1).toFixed(1),h:+(Number(o.alturaM)||1).toFixed(1),camada:o.camada,andar:o.andarV144}}).filter(o=>o.d<4.5).sort((a,b)=>a.d-b.d);
perto.forEach(o=>console.log(JSON.stringify(o)));
