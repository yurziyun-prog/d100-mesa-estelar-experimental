// Mesa Estelar v205 — Sombras projetadas e poças de luz quente (trecho de teste; inspirado nos battlemaps pintados que o Yuri mandou).
//  • Sombra projetada: paredes e móveis lançam uma sombra suave para o sudeste (luz de noroeste), uma camada SVG só entre o piso e as paredes.
//  • Poças de luz: lâmpadas, braseiros, fogueiras e velas ganham uma poça quente que tremula de leve; o resto do cômodo escurece um pouco para a luz aparecer.
// Só desenho, só dentro de áreas marcadas (campo sombrasV205 do mapa = lista de retângulos em metros; no mapa de teste "Ecossistema" vale a casa e as ruínas se o campo não existir).
// Não muda colisão nem visão. Se falhar, o mapa fica como era.
export const AREAS_PADRAO_ECOSSISTEMA=[{x:22,y:19,w:17,h:14,nome:'casa'},{x:15,y:4,w:20,h:13,nome:'ruínas'}];
export const SOMBRA_DX=.3,SOMBRA_DY=.45;
const ehLuz=o=>o&&!o.destruido&&(o.erTipo==='luz'?false:/lampi|lampad|braseir|fogueir|tocha|vela|lanterna|candel/i.test(String(o.nome||'')+' '+String(o.modeloId||o.imagem||'')));
const ehSombra=o=>{if(!o||o.destruido||o.invisivelV161||o.decorV205)return null;const t=String(o.erTipo||o.oficina3||'');
 if(/^(porta|janela|piso|chao|telhado|copa|luz|texto|macico|macicoTopo|caverna|escada|rampa)$/.test(t))return null;if(o.erPoca||o.tetoV139)return null;
 if(t==='parede'||/^parede/i.test(String(o.nome||'')))return .5;if(Number(o.camada)===3&&(o.bloqueiaMovimento||o.imagem))return .22;return null;};
/** gerador pseudo-aleatório com semente (o desenho não muda entre quadros nem entre sessões) */
export const semente=n=>{let s=(n>>>0)||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
export function manchasDoPiso(a,W,H){const R=semente(Math.round(a.x*131+a.y*977+a.w*13+a.h*7)),n=Math.round(a.w*a.h/5),out=[];for(let i=0;i<n;i++){const rx=.5+R()*1.6;out.push({x:a.x+R()*a.w,y:a.y+R()*a.h,rx,ry:rx*(.45+R()*.5),rot:Math.round(R()*180),tom:R()<.7?'sujo':'claro',op:+(.10+R()*.14).toFixed(2)});}return out;}
export const dentroDeAlguma=(x,y,areas)=>areas.some(a=>x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h);
export function geometria(o,W,H){const cx=Number(o.x)*W/28,cy=Number(o.y)*H/14,w=Number(o.larguraM)||1,h=Number(o.alturaM)||1;return {cx,cy,w,h,ang:Number(o.angulo)||0};}
export function instalarSombrasLuz(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let chave='';
 const CSS='@keyframes slTrem{0%,100%{opacity:.82}35%{opacity:1}60%{opacity:.9}80%{opacity:.97}}#slLuz .sl-p{animation:slTrem 3.4s ease-in-out infinite}';
 const areas=()=>{const c=ctl(),id=String(c?.mapaAtual?.()||''),m=(dep.mapas?.()||[]).find(x=>String(x.id)===id);
  if(Array.isArray(m?.sombrasV205))return m.sombrasV205;if(/ecossistema/i.test(String(m?.nome||id)))return AREAS_PADRAO_ECOSSISTEMA;return [];};
 const camada=(b,id,z,mistura)=>{let s=root.getElementById(id);if(!s||s.parentElement!==b){s?.remove();s=root.createElementNS('http://www.w3.org/2000/svg','svg');s.id=id;s.setAttribute('preserveAspectRatio','none');s.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:'+z+';overflow:visible'+(mistura?';mix-blend-mode:'+mistura:'');b.append(s);}return s;};
 function limpar(){root.getElementById('slSujeira')?.remove();root.getElementById('slSombras')?.remove();root.getElementById('slLuz')?.remove();chave='';}
 function desenhar(){
  const b=root.getElementById('novaSyncBoard'),c=ctl();if(!b||!c)return;
  const A=areas();if(!A.length){limpar();return;}
  const cena=c.cenaAtual?.(),{W,H}=c.dimsAtual?.()||{W:28,H:14};if((cena?.objects||[]).length<20){limpar();return;}
  const objs=(cena?.objects||[]).filter(o=>(Number(o.andarV144??1)||1)===1);
  const k=W+'x'+H+'|'+JSON.stringify(A)+'|'+objs.length+'|'+objs.reduce((s,o)=>s+(Number(o.x)||0)+(Number(o.y)||0)+(Number(o.angulo)||0),0).toFixed(3);
  if(k===chave)return;chave=k;
  if(!root.getElementById('slCss')){const st=root.createElement('style');st.id='slCss';st.textContent=CSS;root.head.append(st);}
  // --- sujeira do piso (acima do piso, abaixo das sombras)
  const sj=camada(b,'slSujeira',240);sj.setAttribute('viewBox','0 0 '+W+' '+H);
  {let m='<defs><radialGradient id="slS"><stop offset="0" stop-color="#3a2a1a" stop-opacity="1"/><stop offset="1" stop-color="#3a2a1a" stop-opacity="0"/></radialGradient><radialGradient id="slC"><stop offset="0" stop-color="#e8d9b8" stop-opacity="1"/><stop offset="1" stop-color="#e8d9b8" stop-opacity="0"/></radialGradient></defs>';
   for(const a of A)for(const q of manchasDoPiso(a,W,H))m+='<ellipse cx="'+q.x.toFixed(2)+'" cy="'+q.y.toFixed(2)+'" rx="'+q.rx.toFixed(2)+'" ry="'+q.ry.toFixed(2)+'" transform="rotate('+q.rot+' '+q.x.toFixed(2)+' '+q.y.toFixed(2)+')" fill="url(#'+(q.tom==='sujo'?'slS':'slC')+')" opacity="'+q.op+'"/>';
   sj.innerHTML=m;}
  // --- sombras (entre o piso e as paredes/móveis)
  const sv=camada(b,'slSombras',250);sv.setAttribute('viewBox','0 0 '+W+' '+H);
  let g='';for(const o of objs){const f=ehSombra(o);if(!f)continue;const G=geometria(o,W,H);if(!dentroDeAlguma(G.cx,G.cy,A))continue;
   g+='<rect x="'+(G.cx-G.w/2+SOMBRA_DX*f/.5).toFixed(3)+'" y="'+(G.cy-G.h/2+SOMBRA_DY*f/.5).toFixed(3)+'" width="'+G.w.toFixed(3)+'" height="'+G.h.toFixed(3)+'" transform="rotate('+G.ang+' '+(G.cx+SOMBRA_DX*f/.5).toFixed(3)+' '+(G.cy+SOMBRA_DY*f/.5).toFixed(3)+')" fill="#0b0805"/>';}
  // sombras das copas (árvores) no chão, no mapa todo
  for(const o of (cena?.objects||[])){if(String(o.erTipo||o.oficina3||'')!=='copa'||o.destruido)continue;const G=geometria(o,W,H);g+='<ellipse cx="'+(G.cx+G.w*.14).toFixed(2)+'" cy="'+(G.cy+G.h*.2).toFixed(2)+'" rx="'+(G.w*.46).toFixed(2)+'" ry="'+(G.h*.34).toFixed(2)+'" fill="#0b1408" opacity=".7"/>';}
  sv.innerHTML='<defs><filter id="slBlur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".16"/></filter></defs><g opacity=".4" filter="url(#slBlur)">'+g+'</g>';
  // --- poças de luz quente (por cima de tudo que é do chão, abaixo do teto e das miniaturas)
  const lv=camada(b,'slLuz',360,'screen');lv.setAttribute('viewBox','0 0 '+W+' '+H);
  let l='<defs><radialGradient id="slQ"><stop offset="0" stop-color="#ffd27a" stop-opacity=".72"/><stop offset=".35" stop-color="#ffa13a" stop-opacity=".38"/><stop offset="1" stop-color="#ff8a1e" stop-opacity="0"/></radialGradient></defs>';
  let n=0;for(const o of objs){if(!ehLuz(o))continue;const G=geometria(o,W,H);if(!dentroDeAlguma(G.cx,G.cy,A))continue;
   const r=/fogueir|braseir/i.test(String(o.nome||''))?3.6:3;l+='<circle class="sl-p" style="animation-delay:-'+((n*.7)%3.4).toFixed(2)+'s" cx="'+G.cx.toFixed(3)+'" cy="'+G.cy.toFixed(3)+'" r="'+r+'" fill="url(#slQ)"/>';n++;}
  lv.innerHTML=l;
 }
 const iv=setInterval(()=>{try{desenhar();}catch(e){console.warn('[Sombras]',e);}},700);iv.unref?.();
 const api={desenhar,limpar,areas,parar:()=>{clearInterval(iv);limpar();}};win.mesaSombrasLuzV205=api;return api;
}
