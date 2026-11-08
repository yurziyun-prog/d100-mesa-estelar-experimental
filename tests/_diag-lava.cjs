// Diagnóstico da lava na cena real do harness: retângulos, suportes e contato por ponto. [harness local]
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{
 const {H,page}=await preparar({removerFauna:true});
 const r=await page.evaluate(async()=>{
  const L=await import('/js/mesa-lava.js?v=205');const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena'),objs=c.objects||[];
  const W=80,Hh=50,z=L.zonasDeLava(objs,W,Hh),s=L.suportesDeLava(objs,W,Hh);
  const pt=(x,y)=>({x,y,contato:L.contatoComLava({x,y},z,s,0,1),dentro:z.map(q=>[q.tipo,q.rects.some(([rx,ry,rw,rh])=>x>=rx&&x<=rx+rw&&y>=ry&&y<=ry+rh)]),suporte:s.some(q=>x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1)});
  // varredura 0,5 m: pontos de calor (margem, sem suporte)
  const calor=[];for(let y=36;y<=52;y+=.5)for(let x=56;x<=80;x+=.5){const k=L.contatoComLava({x,y},z,s,0,1);if(k?.calor){const dentroSup=s.some(q=>x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1);calor.push([x,y,dentroSup]);}}
  return {zonas:z.map(q=>({tipo:q.tipo,margem:q.margem,nivel:q.nivel,nrects:q.rects.length,caixa:[Math.min(...q.rects.map(r=>r[0])),Math.min(...q.rects.map(r=>r[1])),Math.max(...q.rects.map(r=>r[0]+r[2])),Math.max(...q.rects.map(r=>r[1]+r[3]))].map(v=>+v.toFixed(1))})),suportes:s.map(q=>({x0:+q.x0.toFixed(2),x1:+q.x1.toFixed(2),y0:+q.y0.toFixed(2),y1:+q.y1.toFixed(2),nivel:q.nivel})),teste:pt(63.4,44.6),ponte_ao_lado:pt(63.4,43.5),pontosCalor:calor.length,exemplos:calor.slice(0,12),calorFora:calor.filter(c=>!c[2]).slice(0,10)};
 });
 console.log(JSON.stringify(r,null,1));await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
