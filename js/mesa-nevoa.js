// Mesa Estelar v145 — Névoa de guerra (por mapa).
//
// Num mapa com névoa ligada (🌫️ do mestre, ou mapas feitos com ela, como a Escadaria da Cidade Alta), cada jogador
// só vê o que o próprio personagem enxerga: rocha, paredes e portas fechadas cortam a visão. O que ele já viu fica
// esmaecido (sem mostrar quem está lá agora); o que nunca viu fica escuro. Miniaturas fora da vista somem para ele.
// O mestre vê tudo. A memória do que foi explorado fica neste navegador (por personagem e mapa).
// Módulo à parte: se falhar, o mapa aparece inteiro, como antes.

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const NEVOA='combatesAtivos/mesaNevoa',ALCANCE_VISTA=16,PASSO_GRADE=.5,RAIOS=360;
// Objeto corta a visão?
export function tapaVista(o){
 if(!o||o.destruido||o.tetoV139)return false;
 const e=o.estadoInterativo;if(e&&e.aberto===true)return false;
 if(o.bloqueiaVisao===true)return true;
 return !!o.bloqueiaMovimento&&/parede|muro|rocha|paredao|predio|porta|portao|pilar|penhasco|montanha/.test(sem(o.nome));
}
// Grade (metros) com as células que cortam a visão.
export function gradeVisao(objs,W,H,passo=PASSO_GRADE){
 const cw=Math.ceil(W/passo),ch=Math.ceil(H/passo),g=new Uint8Array(cw*ch);
 for(const o of objs){if(!tapaVista(o))continue;const cx=Number(o.x)*W/28,cy=Number(o.y)*H/14,r=Math.abs(((+o.angulo||0)%180+180)%180-90)<45,w=(r?+o.alturaM:+o.larguraM)||1,h=(r?+o.larguraM:+o.alturaM)||1;
  const i0=Math.max(0,Math.floor((cx-w/2)/passo)),i1=Math.min(cw-1,Math.floor((cx+w/2-1e-6)/passo)),j0=Math.max(0,Math.floor((cy-h/2)/passo)),j1=Math.min(ch-1,Math.floor((cy+h/2-1e-6)/passo));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)g[j*cw+i]=1;}
 return {g,cw,ch,passo,W,H};
}
// Polígono de visão (pontos em metros) a partir de p, por raios.
// v202 — lanterna em cone: com "direcao" (radianos, sentido que o personagem olha), os raios
// dentro do arco vão até "alcance"; fora do arco só até "perto" (luz ambiente de proximidade).
// Sem "direcao", comportamento de antes: círculo inteiro.
export function poligonoVisao(grade,p,alcance=ALCANCE_VISTA,raios=RAIOS,direcao=null,arco=Math.PI*.42,perto=3){
 const {g,cw,ch,passo,W,H}=grade,pts=[],st=passo*.5,usarCone=direcao!==null&&direcao!==undefined;
 for(let k=0;k<raios;k++){const a=k/raios*Math.PI*2,dx=Math.cos(a),dy=Math.sin(a);let maxD=alcance;
  if(usarCone){let da=a-direcao;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;if(Math.abs(da)>arco/2)maxD=perto;}
  let d=0,x=p.x,y=p.y;
  while(d<maxD){d+=st;x=p.x+dx*d;y=p.y+dy*d;if(x<0||y<0||x>=W||y>=H){d+=st*.6;x=p.x+dx*d;y=p.y+dy*d;break;}const i=Math.floor(x/passo),j=Math.floor(y/passo);if(g[j*cw+i]){let lo=d-st,hi=d;for(let n=0;n<7;n++){const mid=(lo+hi)/2,mi=Math.floor((p.x+dx*mid)/passo),mj=Math.floor((p.y+dy*mid)/passo);if(mi>=0&&mj>=0&&mi<cw&&mj<ch&&g[mj*cw+mi])hi=mid;else lo=mid;}d=hi+.04;x=p.x+dx*d;y=p.y+dy*d;break;}}
  pts.push({x:Math.max(0,Math.min(W,x)),y:Math.max(0,Math.min(H,y))});}
 return pts;
}
// v202 — o personagem carrega uma fonte de luz em equipado/bolso? (lanterna projeta cone)
export function temLanterna(ficha){
 const inv=ficha?.inventario||{},tudo=[...(Array.isArray(inv.equipado)?inv.equipado:[]),...(Array.isArray(inv.bolso)?inv.bolso:[])];
 return tudo.some(it=>it&&/lantern|tocheira|farol|tocha|holofote|lampada/.test(sem(String(it.nome||it.name||it.idBanco||it.id||''))));
}
// v204 — níveis de iluminação do mapa: quanto mais escuro, menor o alcance de visão
// sem lanterna. 'penumbra' ~10 m, 'escuro' ~5 m; lanterna projeta cone além disso.
export function paramsLuz(modo){
 if(modo==='escuro')return {alcance:5,perto:2};
 if(modo==='penumbra')return {alcance:10,perto:3};
 return {alcance:ALCANCE_VISTA,perto:3};
}
export function dentroPoligono(p,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/((b.y-a.y)||1e-9)+a.x)c=!c;}return c;}

export function instalarNevoa(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const el=id=>root.getElementById(id);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let grade=null,gradeChave='',ultimoPonto=null,poli=null,luzAtual=null,explorado=null,exploradoChave='',raf=0,ultimoCalc=0;
 const mapaAtual=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 const dadosMapa=()=>(dep.mapas?.()||[]).find(m=>String(m.id)===mapaAtual())||null;
 let chaves={};
 // v204 — modo de luz do mapa: false (claro) | 'penumbra' | 'escuro'. Chave antiga booleana
 // (true) vira 'penumbra'; o campo do mapa luzV204 (ou nevoaV145) vale como padrão até o
 // mestre tocar no botão — a partir daí manda a escolha dele.
 // v205: AUTOMÁTICO por padrão — névoa só em lugar escuro (luz do mapa), de noite (relógio do jogo ou Visual do mapa) ou com neblina; de dia em lugar claro NÃO existe.
 // Só vale a escolha do mestre feita depois desta versão (guardada como {m,v:2}); valores antigos são ignorados para não deixar névoa esquecida num mapa claro.
 const escolhaDoMestre=()=>{const v=chaves[mapaAtual()];return v&&typeof v==='object'&&v.v===2?v.m:undefined;};
 const automatico=()=>{
  const m=dadosMapa();if(m?.luzV204==='escuro')return 'escuro';if(m?.luzV204&&m.luzV204!=='claro')return m.luzV204;if(m?.nevoaV145)return 'penumbra';
  try{const e=win.mesaVisualV205?.estado?.()?.config;if(e){if(e.ambiente==='escuro')return 'escuro';if(e.ambiente==='noite'||e.clima==='neblina')return 'penumbra';if(e.ambiente==='auto'&&win.mesaRelogio?.ambiente?.()==='noite')return 'penumbra';}}catch(_){}
  try{if(win.mesaRelogio?.ativo?.()&&win.mesaRelogio.ambiente?.()==='noite')return 'penumbra';}catch(_){}
  return false;};
 const modoLuz=()=>{const v=escolhaDoMestre();return v!==undefined?v:automatico();};
 const ehAutomatico=()=>escolhaDoMestre()===undefined;
 const ligada=()=>modoLuz()!==false;
 try{dep.onSnapshot(D(NEVOA),s=>{chaves=(s.exists()?s.data()?.mapas:null)||{};},()=>{});}catch(_){}
 function ator(){try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 const meuPersonagem=()=>{const a=ator();if(a)return a;try{const id=String(dep.personagemId?.()||'');return id?(ctl()?.todosTokens?.()||[]).find(t=>decodeURIComponent(String(t.id))===id&&String(t.mapaId||'')===mapaAtual())||null:null;}catch(_){return null;}};
 function carregarExplorado(chave,cw,ch){
  if(exploradoChave===chave&&explorado)return;exploradoChave=chave;explorado=new Uint8Array(cw*ch);
  try{const s=win.localStorage?.getItem('mesa:nevoa:'+chave);if(s){const b=atob(s);if(b.length===explorado.length)for(let i=0;i<b.length;i++)explorado[i]=b.charCodeAt(i);}}catch(_){}
 }
 let salvarT=0;function guardarExplorado(){clearTimeout(salvarT);salvarT=setTimeout(()=>{try{let s='';for(let i=0;i<explorado.length;i++)s+=String.fromCharCode(explorado[i]);win.localStorage?.setItem('mesa:nevoa:'+exploradoChave,btoa(s));}catch(_){}},800);}
 function limpar(){el('nvCanvas')?.remove();const st=el('nvEsconde');if(st&&st.textContent)st.textContent='';}
 function quadro(){
  raf=0;const b=el('novaSyncBoard');if(!b)return agendar();
  botaoMestre();
  if(!ligada()||ehMestre()){limpar();return agendar();}
  const a=meuPersonagem(),cena=ctl()?.cenaAtual?.(),{W,H}=ctl()?.dimsAtual?.()||{W:28,H:14};
  let cv=el('nvCanvas');if(!cv||cv.parentElement!==b){cv?.remove();cv=root.createElement('canvas');cv.id='nvCanvas';cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:14';b.append(cv);}
  const pw=b.offsetWidth,ph=b.offsetHeight;if(!pw||!ph)return agendar();
  if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;ultimoPonto=null;}
  const objs=(cena?.objects||[]).filter(o=>{try{return win.mesaAndarV144&&a?win.mesaAndarV144.colide(a.id,o):true;}catch(_){return true;}});
  const k=W+'x'+H+':'+objs.filter(tapaVista).map(o=>o.id+o.x+o.y).join(',').length+':'+objs.length;
  if(k!==gradeChave){grade=gradeVisao(objs,W,H);gradeChave=k;ultimoPonto=null;}
  const node=a?b.querySelector(`[data-token="${CSS.escape(String(a.id))}"]`):null;
  const p=a?{x:(node?parseFloat(node.style.left):Number(a.x)/28*100)/100*W,y:(node?parseFloat(node.style.top):Number(a.y)/14*100)/100*H}:null;
  const agora=Date.now();
  if(p&&(!ultimoPonto||Math.hypot(p.x-ultimoPonto.x,p.y-ultimoPonto.y)>.15||agora-ultimoCalc>1500)){
   ultimoPonto=p;ultimoCalc=agora;
   const ficha=(()=>{try{return dep.fichaDe?.(a?.id)||null;}catch(_){return null;}})();
   const dir=a&&temLanterna(ficha)?(Number.isFinite(Number(a.facing))?Number(a.facing):0):null;
   const P=paramsLuz(modoLuz());
   // v204: sem lanterna, o alcance segue a iluminação do mapa; com lanterna, o cone
   // projeta pelo menos 12 m, mesmo no escuro.
   const alc=dir!==null?Math.max(P.alcance,12):P.alcance;
   poli=poligonoVisao(grade,p,alc,RAIOS,dir,Math.PI*.42,P.perto);luzAtual={x:p.x,y:p.y,alcance:alc,comLuz:dir!==null,perto:P.perto};
   carregarExplorado(mapaAtual()+':'+String(a.id),grade.cw,grade.ch);
   // marca o que está à vista como explorado (células da grade)
   const {cw,ch,passo}=grade,r=P.alcance;let mudou=false;
   for(let j=Math.max(0,Math.floor((p.y-r)/passo));j<=Math.min(ch-1,Math.floor((p.y+r)/passo));j++)for(let i=Math.max(0,Math.floor((p.x-r)/passo));i<=Math.min(cw-1,Math.floor((p.x+r)/passo));i++){
    const c=j*cw+i;if(explorado[c])continue;if(dentroPoligono({x:(i+.5)*passo,y:(j+.5)*passo},poli)){explorado[c]=1;mudou=true;}}
   if(mudou)guardarExplorado();
   desenhar(cv,W,H);esconderTokens(a,W,H);
  }else if(!p&&!poli){desenhar(cv,W,H);}
  agendar();
 }
 function desenhar(cv,W,H){
  const c=cv.getContext('2d'),sx=cv.width/W,sy=cv.height/H;c.clearRect(0,0,cv.width,cv.height);
  c.globalCompositeOperation='source-over';c.fillStyle='rgba(4,6,12,1)';c.fillRect(0,0,cv.width,cv.height);
  if(explorado&&grade){const {cw,ch,passo}=grade;c.globalCompositeOperation='destination-out';try{c.filter='blur('+Math.max(2,Math.round(passo*sx*.5))+'px)';}catch(_){}c.fillStyle='rgba(0,0,0,.5)';
   for(let j=0;j<ch;j++)for(let i=0;i<cw;i++)if(explorado[j*cw+i])c.fillRect(i*passo*sx-.5,j*passo*sy-.5,passo*sx+1,passo*sy+1);}
  if(poli?.length){ // v205: o que a pessoa enxerga entra como GRADIENTE: sem fonte de luz é só um pouco claro em volta (fica um pouco escurecido onde ela está); com lanterna/tocha fica bem iluminado e esmaece na ponta do alcance
  c.save();c.globalCompositeOperation='destination-out';c.filter='none';c.beginPath();poli.forEach((q,i)=>i?c.lineTo(q.x*sx,q.y*sy):c.moveTo(q.x*sx,q.y*sy));c.closePath();c.clip();
  const L=luzAtual||{x:poli[0].x,y:poli[0].y,alcance:6,comLuz:false,perto:2},R=Math.max(1,L.alcance)*sx,g=c.createRadialGradient(L.x*sx,L.y*sy,0,L.x*sx,L.y*sy,R);
  if(L.comLuz){g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.72,'rgba(0,0,0,.95)');g.addColorStop(1,'rgba(0,0,0,.18)');}else{g.addColorStop(0,'rgba(0,0,0,.62)');g.addColorStop(.55,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');}
  c.fillStyle=g;c.fillRect(0,0,cv.width,cv.height);c.restore();}
  c.filter='none';c.globalCompositeOperation='source-over';
 }
 function esconderTokens(a,W,H){
  let st=el('nvEsconde');if(!st){st=root.createElement('style');st.id='nvEsconde';root.head.append(st);}
  const fora=[];for(const t of ctl()?.tokensNoMapa?.()||[]){if(t.id===a?.id)continue;const q={x:Number(t.x)*W/28,y:Number(t.y)*H/14};if(!poli||!dentroPoligono(q,poli))fora.push(`#novaSyncBoard [data-token="${CSS.escape(String(t.id))}"]`);}
  const css=fora.length?fora.join(',')+'{visibility:hidden!important;pointer-events:none!important}':'';if(st.textContent!==css)st.textContent=css;
 }
 // 🌫️ do mestre: cicla a iluminação do mapa — claro → penumbra → escuro → claro.
 // Penumbra/escuro ligam a névoa e encurtam a visão; lanterna em cone (v202) vira o
 // jeito de enxergar longe no escuro.
 function botaoMestre(){
  let bt=el('nvBotao');if(!ehMestre()){bt?.remove();return;}
  const b=el('novaSyncBoard'),sc=b?.parentElement;if(!sc)return;
  if(!bt){bt=root.createElement('button');bt.type='button';bt.id='nvBotao';bt.style.cssText="position:absolute;right:8px;bottom:186px;z-index:31;height:28px;padding:0 10px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:12px 'Segoe UI',Arial,sans-serif;cursor:pointer";
   bt.addEventListener('pointerdown',e=>e.stopPropagation());bt.addEventListener('click',alternar);sc.append(bt);}
  const modo=modoLuz(),aut=ehAutomatico(),tx=(aut?'🅰️ ':'')+(modo==='escuro'?'🌑 Escuro':modo==='penumbra'?'🌃 Penumbra':'☀️ Claro');
  if(bt.textContent!==tx)bt.textContent=tx;
  bt.title='Iluminação do mapa. 🅰️ = automática (escuro, noite ou neblina ligam a névoa; lugar claro de dia não tem névoa). Clique para ciclar: automática → claro → penumbra (visão ~10 m) → escuro (~5 m; lanterna em cone enxerga longe).';
  bt.style.borderColor=modo==='escuro'?'#241d3a':modo==='penumbra'?'#b07cff':'#3b5878';
 }
 async function alternar(){const id=mapaAtual();if(!id)return;const e=escolhaDoMestre(),seq=[undefined,false,'penumbra','escuro'],prox=seq[(seq.indexOf(e)+1)%seq.length],v=prox===undefined?null:{m:prox,v:2};chaves={...chaves,[id]:v};try{await dep.setDoc(D(NEVOA),{mapas:{[id]:v}},{merge:true});}catch(err){console.warn('[Névoa]',err);}}
 function agendar(){if(!raf)raf=win.requestAnimationFrame(()=>setTimeout(quadro,90));}
 agendar();
 win.mesaNevoaV145={ligada,limpar,modo:modoLuz,automatico:ehAutomatico};
 return {parar(){if(raf)win.cancelAnimationFrame(raf);limpar();}};
}
