// Mesa Estelar v173 — Detalhes de visão do mapa.
// • Nomes de NPCs, criaturas e comerciantes só aparecem com o mouse (ou o seletor do controle) em cima deles.
// • A camada de coberturas (toldos/varais da imagem de IA) e a pintura do chão não "roubam" cliques: dá para clicar
//   nos objetos e nos ⚙️ de baixo delas.
// • Grade de 1 m por cima do mapa (botão ▦ ao lado do zoom; fica guardado neste navegador): um quadrado = 1 m = uma pessoa.

export const ESTILO_VISTA=`
#novaSyncBoard [data-token^="sync"] [data-rotulo]{opacity:0;transition:opacity .15s;pointer-events:none}
#novaSyncBoard [data-token^="sync"]:hover [data-rotulo],#novaSyncBoard [data-token^="sync"].ctl-escolhido [data-rotulo],#novaSyncBoard [data-token^="sync"]:focus-within [data-rotulo]{opacity:1}
#novaSyncBoard [data-scene-object$=":acima"],#novaSyncBoard [data-scene-object$=":acima"] *,#novaSyncBoard [data-scene-object$=":fundo"],#novaSyncBoard [data-scene-object$=":fundo"] *{pointer-events:none!important}
body.mesa-editando #novaSyncBoard [data-invisivel="1"]{opacity:.3!important;outline:1px dashed rgba(255,212,71,.6)}
#mvGrade{position:absolute;inset:0;pointer-events:none;z-index:1;opacity:.55}
`;
// tamanho do quadrado de 1 m em % do mapa
export const tamanhoGrade=(W,H)=>`${(100/(Number(W)||28)).toFixed(4)}% ${(100/(Number(H)||14)).toFixed(4)}%`;

export function instalarVista(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const el=id=>root.getElementById(id);
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 if(!el('mvCss')){const s=root.createElement('style');s.id='mvCss';s.textContent=ESTILO_VISTA;root.head.append(s);}
 let grade=false;try{const v=win.localStorage?.getItem('mesa:grade1mV196');if(v==='1')grade=true;}catch(_){} // v196: desligada por padrão (a escolha antiga de todos foi zerada); ▦ liga
 function desenhar(){
  const b=el('novaSyncBoard');if(!b)return;
  let g=el('mvGrade');
  const w=b.querySelector('[data-world-layer]');
  if(grade&&w){if(!g){g=root.createElement('div');g.id='mvGrade';}
   // logo acima da pintura do chão (imagem de fundo) e abaixo de todo o resto
   // v175: acima do chão (fundo, pisos e pinceladas), abaixo de paredes, móveis e miniaturas
   let chao=w.querySelector(':scope>#o3Camada'),zc=Number(chao?.style.zIndex)||0;
   if(!chao)for(const n of w.children){if(!n.dataset?.sceneObject)continue;const c=Number(n.dataset.camada),z=Number(n.style.zIndex)||0;if(c<=1&&z>=zc){zc=z;chao=n;}}
   if(chao){if(g.previousElementSibling!==chao)chao.after(g);if(g.style.zIndex!==String(zc||1))g.style.zIndex=String(zc||1);}else if(w.firstElementChild!==g)w.prepend(g);
   let W=28,H=14;try{const d=ctl()?.dimsAtual?.();W=Number(d?.W)||28;H=Number(d?.H)||14;}catch(_){}
   const tam=tamanhoGrade(W,H),img='linear-gradient(to right,rgba(255,255,255,.22) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.22) 1px,transparent 1px)';
   if(g.style.backgroundSize!==tam){g.style.backgroundImage=img;g.style.backgroundSize=tam;}}
  else if(!grade)g?.remove();
  const box=el('camZoom');if(box){let bt=box.querySelector('[data-grade]');
   if(!bt){bt=root.createElement('button');bt.type='button';bt.dataset.grade='';bt.textContent='▦';bt.style.cssText="width:32px;height:30px;padding:0;border-radius:8px;border:1px solid #2f4664;background:#16233a;color:#d8e6ff;font:700 15px 'Segoe UI',Arial,sans-serif;cursor:pointer";
    bt.addEventListener('click',e=>{e.stopPropagation();grade=!grade;try{win.localStorage?.setItem('mesa:grade1mV196',grade?'1':'0');}catch(_){}desenhar();});box.append(bt);}
   bt.style.borderColor=grade?'#ffd447':'#2f4664';bt.title=grade?'Esconder a grade de 1 m':'Mostrar a grade de 1 m (um quadrado = 1 metro = uma pessoa)';}
 }
 const vigia=setInterval(desenhar,700);desenhar();
 win.mesaVistaV173={desenhar,grade:()=>grade};
 return {parar(){clearInterval(vigia);}};
}
