// Mesa Estelar v173 — Casas redondas, ovais, de cúpula e em losango barram com o FORMATO delas (não um quadrado/cruz).
// A área de bloqueio vira uma pilha de faixas finas que acompanha a curva da parede (funciona em tudo que já entende
// retângulos: andar, tempo real, vida dos NPCs, névoa, saídas). As faixas são invisíveis.

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const modelo=o=>String(o?.modeloId||o?.objetoBancoId||o?.oficinaElement?.modeloId||o?.oficinaElement?.objetoBancoId||'');
// formato pelo modelo/nome
export function formatoDe(o){
 const t=sem(modelo(o)+' '+(o?.nome||''));
 if(/losango|diamante/.test(t))return 'losango';
 if(/redond|cupula|circular|oval|cilindr|torre redonda|silo|tenda redonda|yurt/.test(t))return 'elipse';
 return '';
}
// meia-largura da forma na altura dy (relativo ao centro), forma de rx × ry
export function meiaLargura(forma,rx,ry,dy){
 const u=Math.min(1,Math.abs(dy)/ry);
 return forma==='losango'?rx*(1-u):rx*Math.sqrt(Math.max(0,1-u*u));
}
// faixas (metros) que cobrem a forma: n faixas horizontais
export function faixas(forma,cx,cy,w,h,n=10,margem=.96){
 const rx=w/2*margem,ry=h/2*margem,hf=2*ry/n,out=[];
 for(let i=0;i<n;i++){const y=cy-ry+(i+.5)*hf,dy=y-cy;
  // usa o meio da faixa, mas nunca menos que a borda mais larga dela (sem frestas entre faixas vizinhas)
  const lw=Math.max(meiaLargura(forma,rx,ry,dy),meiaLargura(forma,rx,ry,Math.abs(dy)-hf/2)*.92);
  if(lw<.12)continue;out.push({x:cx,y,w:2*lw,h:hf+.02});}
 return out;
}
// Troca, numa cena, o bloqueio quadrado/em cruz das casas de forma curva pelas faixas. Puro; devolve {cena,n}.
export function fatiarRedondas(cena,W=28,H=14){
 const objs=cena?.objects||[];let n=0;
 const casas=objs.filter(o=>formatoDe(o)&&(modelo(o)||o.imagem)&&!o.forma&&!o.colisaoV173&&!/^parede|^telhado/i.test(String(o.nome||''))&&(Number(o.larguraM)||0)>=2.5&&(Number(o.alturaM)||0)>=2.5);
 if(!casas.length)return {cena,n:0};
 const M=o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,w:Number(o.larguraM)||1,h:Number(o.alturaM)||1});
 const tirar=new Set(),novas=[];
 for(const c of casas){
  if(objs.some(o=>o.colisaoV173===String(c.id)))continue; // já feito
  const m=M(c),forma=formatoDe(c),andar=Number(c.andarV144??c.oficinaElement?.andarV144??1);
  // bloqueios que são desta casa: mesmo nome (ou a própria casa), barram, ficam dentro do retângulo dela
  const dela=objs.filter(o=>o.bloqueiaMovimento&&!o.colisaoV173&&(o===c||(sem(o.nome)===sem(c.nome)&&!modelo(o)))&&(()=>{const q=M(o);return Math.abs(q.x-m.x)<=m.w/2+.05&&Math.abs(q.y-m.y)<=m.h/2+.05&&q.w<=m.w+.05&&q.h<=m.h+.05;})()&&Number(o.andarV144??o.oficinaElement?.andarV144??1)===andar);
  if(!dela.length)continue;
  const visao=dela.some(o=>o.bloqueiaVisao||o.oficinaElement?.bloqueiaVisao),camada=Number(dela[0].camada??c.camada??3);
  for(const o of dela)if(o===c)tirar.add('__casa__'+o.id);else tirar.add(String(o.id));
  const gira=Math.abs(Math.round((Number(c.angulo)||0)/90))%2===1,w=gira?m.h:m.w,h=gira?m.w:m.h;
  faixas(forma,m.x,m.y,w,h).forEach((f,i)=>{novas.push({id:String(c.id)+'_f173_'+i,nome:String(c.nome||'Casa'),forma:'rect',cor:'#000000',borda:'#000000',bordaLargura:0,opacity:0,
   x:+(f.x*28/W).toFixed(4),y:+(f.y*14/H).toFixed(4),larguraM:+f.w.toFixed(3),alturaM:+f.h.toFixed(3),angulo:0,camada,bloqueiaMovimento:true,bloqueiaVisao:visao,fixoAoMapa:true,
   pvMax:0,pvAtual:0,dureza:0,material:'pedra',colisaoV173:String(c.id),...(andar>1?{andarV144:andar}:{})});});
  n++;
 }
 if(!n)return {cena,n:0};
 const resto=objs.filter(o=>!tirar.has(String(o.id))).map(o=>tirar.has('__casa__'+o.id)?{...o,bloqueiaMovimento:false,...(o.oficinaElement?{oficinaElement:{...o.oficinaElement,bloqueiaMovimento:false}}:{})}:o);
 return {cena:{...cena,objects:[...resto,...novas]},n};
}
