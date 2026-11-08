// Mesa Estelar v205 — Lava: queimadura por CONTATO com perigo crescente. A lógica lê os DADOS da região (perigoLavaV205 no objeto da poça), nunca a cor da imagem.
//   lava exposta (tipo 'lava', 2d6) · núcleo mais ativo (tipo 'nucleo', 4d6, material menos sustentado) · crosta quente em volta (margemCalorM, 1d4 de calor)
//   ponte/crosta firme (suporteLavaV205) sustenta quem está em cima; quem VOA alto (pés a ≥ 2 m) não sofre contato; voo muito baixo (< 1 m) recebe só o calor da crosta.
// Quem aplica é o MESTRE online (uma vez por intervalo e por personagem; nunca por cliente nem por quadro). O dano passa pelo sistema de saúde/dano existente (dep.atingir),
// com armadura e resistência normais. Esta etapa NÃO muda a água: água, pântano e areia seguem só visuais (sem afogamento).
/** v205: o banco guarda cada array interno de rectsV201 como {__arrV205:[…]} (Firestore não aceita array dentro de array); aceita os dois formatos */
export const rectsNormais=a=>(a||[]).map(r=>Array.isArray(r)?r:(r&&r.__arrV205)||[]);
export const ALTITUDE_SEGURA_M=2,ALTITUDE_CALOR_M=1,INTERVALO_MS=3000,ESCALADA_MAX=3;
const dentroRects=(x,y,rects)=>(rects||[]).some(([rx,ry,rw,rh])=>x>=rx&&x<=rx+rw&&y>=ry&&y<=ry+rh);
const area=o=>(Number(o.larguraM)||1)*(Number(o.alturaM)||1);
/** zonas de perigo da cena (em metros). Lê perigoLavaV205; poças antigas 'lava' sem dados viram lava comum. */
export function zonasDeLava(objs=[],W=28,H=14){
 const z=[];
 for(const o of objs){
  if(!o||o.destruido)continue;
  const dados=o.perigoLavaV205||(String(o.erPoca||'').startsWith('lava')?{tipo:'lava',dano:'2d6',intensidade:1,margemCalorM:1.2}:null);if(!dados)continue;
  const cx=Number(o.x)*W/28,cy=Number(o.y)*H/14,w=Number(o.larguraM)||1,h=Number(o.alturaM)||1;
  z.push({id:o.id,tipo:dados.tipo||'lava',dano:dados.dano||'2d6',intensidade:Number(dados.intensidade)||1,margem:Number(dados.margemCalorM)||0,rects:o.rectsV201?.length?rectsNormais(o.rectsV201):[[cx-w/2,cy-h/2,w,h]],nivel:Math.max(1,Number(o.andarV144??1)||1)});
 }
 return z;
}
/** áreas de crosta/ponte firme que sustentam quem está em cima (cancelam a lava debaixo) */
export const suportesDeLava=(objs=[],W=28,H=14)=>objs.filter(o=>o&&o.suporteLavaV205&&!o.destruido).map(o=>{const cx=Number(o.x)*W/28,cy=Number(o.y)*H/14,w=Number(o.larguraM)||1,h=Number(o.alturaM)||1;return {x0:cx-w/2,y0:cy-h/2,x1:cx+w/2,y1:cy+h/2,nivel:Math.max(1,Number(o.andarV144??1)||1)};});
/** contato de um ponto (metros) com as zonas: {tipo,dano,intensidade,calor} ou null. altitude = altura dos pés (m). */
export function contatoComLava(p,zonas,suportes=[],altitude=0,nivel=1){
 if(altitude>=ALTITUDE_SEGURA_M)return null;
 let melhor=null;
 for(const z of zonas){
  if(z.nivel!==nivel)continue;
  const dentro=dentroRects(p.x,p.y,z.rects);
  const nasMargens=!dentro&&z.margem>0&&z.tipo==='lava'&&dentroRects(p.x,p.y,z.rects.map(([x,y,w,h])=>[x-z.margem,y-z.margem,w+2*z.margem,h+2*z.margem]));
  if(!dentro&&!nasMargens)continue;
  if(dentro&&suportes.some(s=>s.nivel===nivel&&p.x>=s.x0&&p.x<=s.x1&&p.y>=s.y0&&p.y<=s.y1))continue; // ponte firme: lava debaixo, sem contato
  const calor=nasMargens||altitude>=ALTITUDE_CALOR_M; // crosta quente ou voo muito baixo: só calor
  const c=calor?{tipo:'calor',dano:'1d4',intensidade:.3,calor:true,zona:z.id}:{tipo:z.tipo,dano:z.dano,intensidade:z.intensidade,calor:false,zona:z.id};
  if(!melhor||c.intensidade>melhor.intensidade)melhor=c;
 }
 return melhor;
}
/** perigo crescente: segundos seguidos no mesmo contato aumentam o dano (fator 1 → 3) */
export const fatorDeEscalada=ticks=>Math.min(ESCALADA_MAX,1+.5*Math.max(0,ticks-1));
