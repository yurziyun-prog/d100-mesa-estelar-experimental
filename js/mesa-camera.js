// Mesa Estelar v144 — Zoom do mapa e câmera que acompanha o personagem.
//
// Cada um escolhe o tamanho da visualização (1× a 3×, botões 🔍 à direita do mapa; fica guardado só neste navegador).
// Ampliado, o mapa fica parado enquanto o personagem está perto da borda e passa a andar junto com ele quando ele
// chega ao centro da tela — até a outra borda do mapa. Sem personagem selecionado, a câmera fica onde estava.
// Só muda o desenho (transform + recorte): cliques, arrastes e medidas continuam certos. Módulo à parte.

// v158: o JOGADOR vê o mapa na escala da Última Bateria (um quadrado da grade ≈ 1 m, ~48 px por metro): num mapa
// maior que 28 m de largura a visão já começa ampliada e a câmera segue o personagem. A visão do mapa inteiro
// (panorâmica) fica para o mestre — ou para os jogadores num mapa em que o mestre ligar 🗺️ "panorâmico".
export const NIVEIS=[1,1.5,2,3,4];
export const NIVEIS_JOGADOR=[1,1.5,2,3];
// v198: o mestre tem zoom livre de 1× (mapa inteiro) a 8× pela roda do mouse ou pinça; o jogador, de 1× a 3× (nunca vê além do que já vê)
export const NIVEIS_MESTRE=[1,1.5,2,3,4,6,8];
export const LIMITE_MESTRE=8,LIMITE_JOGADOR=3;
// Ampliação mínima para o jogador num mapa de W metros de largura (28 m = mapa inteiro na tela).
// v170: em mapa maior que a taverna (28 m) o jogador vê uns 20 m de largura — mais perto, como pediu o mestre
export const baseJogador=(W,panoramico=false)=>{if(panoramico)return 1;const w=Number(W)||28;return w<=28?1:Math.max(1,w/20);};
// v196: escala da Última Bateria (taverna de 28 m numa tela de ~1400 px): ~52 px por metro. Quem joga (jogador, Kael, diretor) e a aba do
// construtor veem SEMPRE nessa escala, qualquer que seja o tamanho do mapa ou da janela; uma pessoa (1 m) ocupa ~52 px. Nunca menos que o mapa inteiro.
export const PX_POR_METRO=52;
export const zoomPorMetro=(W,larguraPx,pxm=PX_POR_METRO)=>{const w=Number(W)||28,l=Number(larguraPx)||1400;return Math.max(1,Math.min(4,Math.round(pxm*w/l*100)/100));};
// Deslocamento (px) para manter o ponto p (px no mapa sem zoom) no centro, sem sair do mapa.
export function deslocamento(p,z,w,h,vw=w,vh=h){
 const tx=Math.min(0,Math.max(w-w*z,vw/2-p.x*z)),ty=Math.min(0,Math.max(h-h*z,vh/2-p.y*z));
 return {tx,ty};
}

export function instalarCamera(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const el=id=>root.getElementById(id);
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let zm=1,zj=1,alvo={tx:0,ty:0},atual={tx:0,ty:0},raf=0,ultimoMapa='',centrado=false,panorama={};
 let livre=false,ultimoAtor='',quadros=0,tokenExterno=''; // v173: câmera solta (o mestre arrastou/andou com as setas): não segue ninguém até ele pedir
 // v209: visão inclinada (estilo Ragnarok): o plano do mapa rotaciona em torno do eixo X (projeção
 // ortográfica — sem perspectiva, para o clique-para-andar continuar matematicamente exato: o retângulo
 // projetado encolhe cos(θ) na vertical e a normalização por getBoundingClientRect inverte a conta).
 const ANGULO_PADRAO=45;
 let angulo=ANGULO_PADRAO;
 try{const raw=win.localStorage?.getItem('mesa:cameraAnguloV209');if(raw!==null&&raw!==undefined){const v=Number(raw);if(Number.isFinite(v))angulo=Math.max(0,Math.min(45,v));}}catch(_){}
 const aplicarAngulo=a=>{angulo=Math.max(0,Math.min(45,Math.round(a)));try{win.localStorage?.setItem('mesa:cameraAnguloV209',String(angulo));}catch(_){}atual={...alvo};agendar();try{controles();}catch(_){}};
 try{const v=Number(win.localStorage?.getItem('mesa:zoomMapa'));if(Number.isFinite(v)&&v>=1&&v<=LIMITE_MESTRE)zm=v;}catch(_){}
 try{const v=Number(win.localStorage?.getItem('mesa:zoomJogador'));if(Number.isFinite(v)&&v>=1&&v<=LIMITE_JOGADOR)zj=v;}catch(_){}
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const mapaVisto=()=>String(el('novaSyncBoard')?.dataset.mapaVisivel||'');
 const largura=()=>{try{return Number(ctl()?.dimsAtual?.()?.W)||28;}catch(_){return 28;}};
 // zoom efetivo: o mestre escolhe livremente; o jogador parte da escala de 1 m por quadrado
 // v180: com o 👷 modo construtor ligado, o mestre vê na escala dos jogadores (ou mais perto) e a câmera segue o construtor
 const focoConstrutor=()=>{try{return win.mesaCameraFocoV180_?.()||null;}catch(_){return null;}};
 const larguraTela=()=>{const b=el('novaSyncBoard'),p=b?.parentElement;return ((p?.clientWidth||b?.offsetWidth||1400)-(p?parseFloat(getComputedStyle(p).paddingLeft)||0:0));};
 const abaConstrutor=(()=>{try{return new URL(win.location.href).searchParams.get('construtor')==='1';}catch(_){return false;}})();
 const zoomAtual=()=>ehMestre()?((focoConstrutor()||abaConstrutor)?Math.max(zm,zoomPorMetro(largura(),larguraTela())):zm):(panorama[mapaVisto()]?1:zoomPorMetro(largura(),larguraTela()))*zj;
 const niveis=()=>ehMestre()?NIVEIS_MESTRE:NIVEIS_JOGADOR;
 const nivel=()=>ehMestre()?zm:zj;
 if(dep.onSnapshot&&dep.doc&&dep.db)try{dep.onSnapshot(dep.doc(dep.db,'combatesAtivos','mesaCamera'),sn=>{panorama=(sn.exists()?sn.data()?.panorama:null)||{};centrado=false;agendar();},()=>{});}catch(_){}
 function ator(){try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 function controles(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;if(!sc)return;
  let box=el('camZoom');
  if(!box){box=root.createElement('div');box.id='camZoom';
   box.style.cssText="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:31;display:flex;flex-direction:column;gap:3px;padding:3px;border-radius:12px;background:rgba(9,15,29,.82);border:1px solid #3b5878";
   box.innerHTML='<button type="button" data-z="+" title="Aproximar: ver tudo maior (roda do mouse ou pinça também)">＋</button><button type="button" data-z="0" title="Voltar ao mapa inteiro">1×</button><button type="button" data-z="-" title="Afastar (até o mapa inteiro)">－</button><button type="button" data-z="a" title="Visão inclinada (estilo Ragnarok): alterna entre o mapa deitado (vista de cima) e levantado 30°">📐</button>';
   for(const bt of box.querySelectorAll('button'))bt.style.cssText="width:32px;height:30px;padding:0;border-radius:8px;border:1px solid #2f4664;background:#16233a;color:#d8e6ff;font:700 15px 'Segoe UI',Arial,sans-serif;cursor:pointer";
   box.addEventListener('pointerdown',e=>e.stopPropagation());
   box.addEventListener('click',async e=>{const bt=e.target.closest('button');if(!bt)return;
    if(bt.dataset.z==='a'){aplicarAngulo(angulo>0?0:ANGULO_PADRAO);return;}
    if(bt.dataset.z==='p'){if(!ehMestre())return;const id=mapaVisto();if(!id)return;try{await dep.setDoc(dep.doc(dep.db,'combatesAtivos','mesaCamera'),{panorama:{[id]:!panorama[id]}},{merge:true});}catch(err){console.warn('[Câmera]',err);}return;}
    const N=niveis(),i=Math.max(0,N.indexOf(nivel()));
    mudar(bt.dataset.z==='+'?N[Math.min(N.length-1,i+1)]:bt.dataset.z==='-'?N[Math.max(0,i-1)]:1);});
   if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(box);}
  const z=zoomAtual(),tx=String(Math.round(z*10)/10).replace('.',',')+'×',meio=box.querySelector('[data-z="0"]');if(meio&&meio.textContent!==tx)meio.textContent=tx;
  if(meio)meio.title=ehMestre()?'Voltar ao mapa inteiro':'Voltar à escala normal (1 quadrado ≈ 1 m)';
  const btA=box.querySelector('[data-z="a"]');
  if(btA){btA.textContent=angulo>0?'📐':'▭';btA.style.borderColor=angulo>0?'#8ee7ff':'#2f4664';btA.title=angulo>0?`Visão inclinada ligada (${angulo}°, estilo Ragnarok). Clique para deitar o mapa (vista de cima).`:'Mapa deitado (vista de cima). Clique para inclinar a visão (estilo Ragnarok).';}
  let pb=box.querySelector('[data-z="p"]');
  if(ehMestre()&&!pb){pb=root.createElement('button');pb.type='button';pb.dataset.z='p';pb.textContent='🗺️';pb.style.cssText="width:32px;height:30px;padding:0;border-radius:8px;border:1px solid #2f4664;background:#16233a;color:#d8e6ff;font:15px 'Segoe UI',Arial,sans-serif;cursor:pointer";box.append(pb);}
  if(!ehMestre()&&pb){pb.remove();pb=null;}
  if(pb){const on=!!panorama[mapaVisto()];pb.style.borderColor=on?'#ffd447':'#2f4664';pb.title=on?'Jogadores veem este mapa inteiro (panorâmico). Clique para voltar à escala de 1 m por quadrado.':'Deixar os jogadores verem este mapa inteiro (panorâmico). Hoje eles veem na escala de 1 m por quadrado, com a câmera seguindo o personagem.';}
 }
 function mudar(novo){if(ehMestre()){zm=novo;try{win.localStorage?.setItem('mesa:zoomMapa',String(zm));}catch(_){}}else{zj=novo;try{win.localStorage?.setItem('mesa:zoomJogador',String(zj));}catch(_){}}centrado=false;atual={...alvo};try{controles();}catch(_){}agendar();}
 // v198: roda do mouse (sem precisar do Ctrl) e pinça de dois dedos: zoom contínuo ao redor do ponteiro. Mestre 1×–8×; jogador 1×–3×.
 const limite=()=>ehMestre()?LIMITE_MESTRE:LIMITE_JOGADOR;
 function zoomLivre(novo,cx,cy){
  const b=el('novaSyncBoard');if(!b)return;novo=Math.max(1,Math.min(limite(),novo));
  if(ehMestre()&&Number.isFinite(cx)){
   const r=b.getBoundingClientRect(),w=b.offsetWidth,h=b.offsetHeight,z0=Math.max(.01,zoomAtual()),tem=!!b.style.transform,ox=r.left-(tem?atual.tx:0),oy=r.top-(tem?atual.ty:0);
   const px=(cx-r.left)/(tem?z0:1),py=(cy-r.top)/(tem?z0:1);
   const tx=Math.min(0,Math.max(w-w*novo,cx-ox-px*novo)),ty=Math.min(0,Math.max(h-h*novo,cy-oy-py*novo));
   livre=true;centrado=true;alvo={tx,ty};atual={...alvo};}
  if(ehMestre()){zm=novo;try{win.localStorage?.setItem('mesa:zoomMapa',String(Math.round(zm*100)/100));}catch(_){}}
  else{zj=novo;try{win.localStorage?.setItem('mesa:zoomJogador',String(Math.round(zj*100)/100));}catch(_){}centrado=false;atual={...alvo};}
  try{controles();}catch(_){}agendar();
 }
 function passoZoom(d){const N=niveis(),i=Math.max(0,N.indexOf(nivel()));mudar(N[Math.max(0,Math.min(N.length-1,i+(d>0?1:-1)))]);}
 root.addEventListener('wheel',e=>{const b=el('novaSyncBoard');if(!b||!b.parentElement?.contains(e.target))return;
  if(e.target.closest?.('#erPainel,#camZoom,#camPan,#erNovo'))return;                                    // painéis rolam sozinhos
  const ed=win.mesaEditorRapidoV197?.estado?.();if(!e.ctrlKey&&ed&&ed.ferr==='objeto'&&ehMestre())return; // com um móvel na mão a roda gira o móvel
  e.preventDefault();zoomLivre(nivel()*Math.exp(-e.deltaY*(e.ctrlKey?.01:.0018)),e.clientX,e.clientY);},{passive:false});
 let pinca=null;
 const meio=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2,d:Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)});
 root.addEventListener('touchstart',e=>{const b=el('novaSyncBoard');if(!b?.contains(e.target)||e.touches.length!==2){pinca=null;return;}const m=meio(e.touches);pinca={d0:m.d||1,z0:nivel(),x:m.x,y:m.y};},{passive:true});
 root.addEventListener('touchmove',e=>{if(!pinca||e.touches.length!==2)return;e.preventDefault();const m=meio(e.touches);
  if(ehMestre()&&livre===false){/* primeiro gesto: solta a câmera para o zoom ficar onde os dedos estão */}
  zoomLivre(pinca.z0*(m.d/pinca.d0),m.x,m.y);
  if(ehMestre()&&(Math.abs(m.x-pinca.x)>.5||Math.abs(m.y-pinca.y)>.5))mover(m.x-pinca.x,m.y-pinca.y);pinca.x=m.x;pinca.y=m.y;},{passive:false});
 root.addEventListener('touchend',()=>{pinca=null;},{passive:true});
 // ------------------------------------------------------------ v173: o mestre move a câmera para onde quiser
 // arrastar com o botão do meio (ou Espaço + arrastar), setas na tela (segure para ir andando) e 🎯 para voltar a seguir.
 function mover(dx,dy){const b=el('novaSyncBoard');if(!b)return;const z=zoomAtual(),w=b.offsetWidth,h=b.offsetHeight;
  if(z<=1.001){const sc=b.parentElement;if(sc){sc.scrollLeft-=dx;sc.scrollTop-=dy;}return;}
  livre=true;centrado=true;alvo={tx:Math.min(0,Math.max(w-w*z,alvo.tx+dx)),ty:Math.min(0,Math.max(h-h*z,alvo.ty+dy))};atual={...alvo};agendar();}
 let espaco=false,arr=null;
 root.addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')&&!e.target?.isContentEditable&&ehMestre()&&el('novaSyncBoard')?.matches(':hover')){espaco=true;e.preventDefault();}});
 root.addEventListener('keyup',e=>{if(e.code==='Space')espaco=false;});
 root.addEventListener('pointerdown',e=>{const b=el('novaSyncBoard');if(!b||!ehMestre()||!b.parentElement?.contains(e.target)||e.target.closest?.('#camZoom,#camPan'))return;
  if(!(e.button===1||(e.button===0&&espaco)))return;e.preventDefault();e.stopPropagation();arr={x:e.clientX,y:e.clientY,id:e.pointerId};try{b.style.cursor='grabbing';}catch(_){}},true);
 root.addEventListener('pointermove',e=>{if(!arr||e.pointerId!==arr.id)return;e.preventDefault();e.stopPropagation();mover(e.clientX-arr.x,e.clientY-arr.y);arr.x=e.clientX;arr.y=e.clientY;},true);
 const soltar=e=>{if(!arr||(e&&e.pointerId!==arr.id))return;arr=null;const b=el('novaSyncBoard');if(b)b.style.cursor='';};
 root.addEventListener('pointerup',e=>{if(arr){e.stopPropagation();soltar(e);}},true);root.addEventListener('pointercancel',soltar,true);
 root.addEventListener('auxclick',e=>{if(e.button===1&&el('novaSyncBoard')?.parentElement?.contains(e.target))e.preventDefault();},true);
 let segurando=0;
 function pad(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;if(!sc)return;let p=el('camPan');
  if(!ehMestre()){p?.remove();return;}
  if(!p){p=root.createElement('div');p.id='camPan';
   p.style.cssText="position:absolute;right:8px;bottom:8px;z-index:31;display:grid;grid-template-columns:repeat(3,26px);grid-template-rows:repeat(3,24px);gap:2px;padding:3px;border-radius:12px;background:rgba(9,15,29,.82);border:1px solid #3b5878";
   p.title='Mover a visão do mapa (mestre). Também: arraste com o botão do meio do mouse, ou segure Espaço e arraste.';
   const B=[['','',''],['↑','0,1',''],['','',''],['←','1,0',''],['🎯','seguir',''],['→','-1,0',''],['','',''],['↓','0,-1',''],['','','']];
   p.innerHTML=B.map(([t,d])=>t?`<button type="button" data-p="${d}" style="padding:0;border-radius:7px;border:1px solid #2f4664;background:#16233a;color:#d8e6ff;font:700 13px 'Segoe UI',Arial,sans-serif;cursor:pointer" title="${d==='seguir'?'Voltar a seguir o personagem (ou o meio do mapa)':'Mover a visão'}">${t}</button>`:'<span></span>').join('');
   p.addEventListener('pointerdown',e=>{e.stopPropagation();const bt=e.target.closest('button');if(!bt)return;
    if(bt.dataset.p==='seguir'){livre=false;centrado=false;agendar();return;}
    const [dx,dy]=bt.dataset.p.split(',').map(Number),passo=()=>mover(dx*40,dy*40);passo();clearInterval(segurando);segurando=setInterval(passo,60);});
   const fim=()=>{clearInterval(segurando);segurando=0;};p.addEventListener('pointerup',fim);p.addEventListener('pointerleave',fim);p.addEventListener('pointercancel',fim);
   if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(p);}
  p.hidden=zoomAtual()<=1.001&&!(sc.scrollWidth>sc.clientWidth+2||sc.scrollHeight>sc.clientHeight+2);
 }
 function quadro(){
  raf=0;const b=el('novaSyncBoard');if(!b)return;if(!quadros++){controles();try{pad();}catch(_){}} // v175: os botões são conferidos pelo vigia (antes: todo quadro)
  const w=b.offsetWidth,h=b.offsetHeight;if(!w||!h)return agendar();
  const mapa=String(b.dataset.mapaVisivel||'');if(mapa!==ultimoMapa){ultimoMapa=mapa;atual={tx:0,ty:0};alvo={tx:0,ty:0};}
  const z=zoomAtual();
  b.style.setProperty('--mz-inv',String(1/Math.max(1,z)));
  // v161: sem barra de rolagem na moldura do mapa quando a câmera amplia (a ampliação não cria espaço vazio para rolar);
  // para o jogador nunca há barra: o que ele vê é decidido pelo movimento do personagem
  {const sc=b.parentElement;if(sc){const esconder=z>1.001||(!ehMestre()&&b.offsetWidth<=sc.clientWidth+2);const ov=esconder?'hidden':'';if(sc.style.overflow!==ov){sc.style.overflow=ov;if(esconder){sc.scrollLeft=0;sc.scrollTop=0;}}}}
  if(z<=1.001&&angulo<=0){if(b.style.transform){b.style.transform='';b.style.clipPath='';b.style.transformOrigin='';b.style.willChange='';}return;}
  if(b.style.willChange!=='transform')b.style.willChange='transform'; // v175: a câmera anda na placa de vídeo
  if(z>1.001){
   const a=ator();
   // v222: nas abas novas (mapa do mestre/jogo) centraliza na moldura visível; a aba Mapa da Mesa mantém o comportamento antigo.
   const novaAba=/\bmapa-(mestre|jogo)\b/.test(String(root.body?.className||''));
   const vw=novaAba?(b.parentElement?.clientWidth||w):w,vh=novaAba?(b.parentElement?.clientHeight||h):h;
   const aid=a?String(a.id):'';if(aid!==ultimoAtor){ultimoAtor=aid;if(aid)livre=false;}
   const fc=focoConstrutor();
   const tok=tokenExterno&&/\bmapa-jogo\b/.test(String(root.body?.className||''))?b.querySelector('[data-token="'+CSS.escape(tokenExterno)+'"]'):null;
    const xp=tok?parseFloat(tok.style.left):NaN,yp=tok?parseFloat(tok.style.top):NaN;
    if(tok&&Number.isFinite(xp)&&Number.isFinite(yp)){livre=false;alvo=deslocamento({x:xp/100*w,y:yp/100*h},z,w,h,vw,vh);}
    else if(fc)alvo=deslocamento({x:fc.x/100*w,y:fc.y/100*h},z,w,h,vw,vh);
   else if(a&&!livre){const n=b.querySelector(`[data-token="${CSS.escape(String(a.id))}"]`);const px=n?parseFloat(n.style.left):Number(a.x)/28*100,py=n?parseFloat(n.style.top):Number(a.y)/14*100;
    if(Number.isFinite(px)&&Number.isFinite(py))alvo=deslocamento({x:px/100*w,y:py/100*h},z,w,h,vw,vh);}
   else if(!centrado&&!livre){alvo=deslocamento({x:w/2,y:h/2},z,w,h,vw,vh);centrado=true;} // v146: sem personagem, amplia a partir do meio do mapa
   else alvo={tx:Math.min(0,Math.max(w-w*z,alvo.tx)),ty:Math.min(0,Math.max(h-h*z,alvo.ty))};
   // anda suave até o alvo
   atual={tx:atual.tx+(alvo.tx-atual.tx)*.18,ty:atual.ty+(alvo.ty-atual.ty)*.18};
   if(Math.abs(alvo.tx-atual.tx)<.5&&Math.abs(alvo.ty-atual.ty)<.5)atual={...alvo};
  }
  // v209: inclinação ortográfica em torno do eixo superior do mapa; no zoom 1 o mapa inclinado ocupa
  // h·cos(θ) de altura — recuo de metade da diferença para ficar verticalmente centralizado na moldura.
  const rad=angulo*Math.PI/180,cosA=Math.cos(rad);
  const centro=angulo>0&&z<=1.001?(h-h*cosA)/2:0;
  const t=`translate(${atual.tx.toFixed(1)}px,${(atual.ty+centro).toFixed(1)}px) scale(${z})`+(angulo>0?` rotateX(${angulo}deg)`:'');
  if(b.style.transform!==t){b.style.transformOrigin='0 0';b.style.transform=t;
   if(angulo>0){b.style.clipPath='';} // com o plano inclinado o recorte em coordenadas do mapa ficaria torto; a moldura já corta (overflow hidden)
   else{
    // recorta o que passaria da moldura do mapa (coordenadas do próprio mapa, antes do zoom)
    const l=-atual.tx/z,tp=-atual.ty/z,r=w-(l+w/z),bt=h-(tp+h/z);b.style.clipPath=`inset(${tp.toFixed(1)}px ${r.toFixed(1)}px ${bt.toFixed(1)}px ${l.toFixed(1)}px)`;}}
  agendar();
 }
 function agendar(){if(!raf)raf=win.requestAnimationFrame(quadro);}
 const vigia=setInterval(()=>{try{controles();pad();}catch(_){}agendar();},500);agendar();
 win.mesaCameraV144={zoom:()=>zoomAtual(),mover,livre:()=>livre,definir:n=>{const N=niveis();mudar(N.includes(n)?n:N.reduce((p,q)=>Math.abs(q-n)<Math.abs(p-n)?q:p,N[0]));},angulo:()=>angulo,inclinar:a=>aplicarAngulo(a),seguirToken:id=>{tokenExterno=String(id||'');livre=false;centrado=false;agendar();}};
 return {parar(){clearInterval(vigia);if(raf)win.cancelAnimationFrame(raf);const b=el('novaSyncBoard');if(b){b.style.transform='';b.style.clipPath='';}}};
}
