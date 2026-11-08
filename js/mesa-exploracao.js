// Mesa Estelar v200 (fases 2 e 3) — Personalidades e necessidades fora do combate: exploradora, covarde, construtora, abrigo, fome e caça.
//
// Fora do combate, a vida do mapa (mesa-vida.js) pergunta a este módulo o que cada miniatura vai fazer:
//  🧭 Exploradora: anda longe do seu canto, procura portas fechadas (não trancadas), ABRE e passa para o outro lado.
//  🏃 Covarde (ou Confiança 0): se alguém hostil chega perto, corre para a própria toca e ENTRA nela (some da vista até a ameaça passar),
//     ou, se for inteligente (NPC ou exploradora) e houver uma casa, ABRE a porta, entra, FECHA a porta e espera; sem toca nem casa, esconde-se atrás de pedra/árvore ou foge.
//  🕳️ Construtora: junta 3 pedras/árvores, volta para o seu canto e constrói uma TOCA; corre para dentro dela no perigo.
//  🍖 Fome (campo Alimentação): a saciedade cai com o tempo. Faminta, a CAÇADORA persegue uma presa menor, a mata e come (fica satisfeita);
//     a FRUGÍVORA procura uma árvore e come frutos; a ONÍVORA prefere frutos e só caça se estiver muito faminta. Sem Alimentação = não sente fome.
// Tudo no navegador do mestre (a vida só roda lá). Módulo à parte: se falhar, a vida segue como antes.
import {tipoInterativo,estadoDe,aplicarPedido} from './mesa-objetos.js?v=209';

const clean=v=>JSON.parse(JSON.stringify(v??null));
const dec=id=>{try{return decodeURIComponent(String(id||''));}catch(_){return String(id||'');}};
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const PEDRAS_PARA_TOCA=3,ALCANCE_AMEACA_M=9,ALCANCE_BUSCA_M=40,FAMINTA=50,MUITO_FAMINTA=25;
export const DIETAS={
 '':{nome:'Não precisa comer',icone:'',desc:'não sente fome'},
 cacadora:{nome:'Caçadora',icone:'🍖',desc:'faminta, caça uma presa menor e come'},
 frugivora:{nome:'Frugívora',icone:'🍎',desc:'faminta, procura frutos nas árvores'},
 onivora:{nome:'Onívora',icone:'🍽️',desc:'prefere frutos; caça se estiver muito faminta'}
};
export const dietaValida=v=>Object.hasOwn(DIETAS,String(v??''))?String(v??''):'';
const SCENE='combatesAtivos/mapaMesaSyncDiretaCena',POS='combatesAtivos/mapaMesaSyncDireta/posicoes',HEALTH='combatesAtivos/mapaMesaSyncSaude',FOME='combatesAtivos/mesaFomeV200',ABRIGO='combatesAtivos/mesaAbrigosV200';
const arquivo=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
const RECURSO=/\b(rocha|rochedo|pedra|pedregulho|minerio|veio|cristal|jazida|filao|arvore|arvores|palmeira|pinheiro|tronco|carvalho|cedro|sequoia)\b/;
const ARVORE=/\b(arvore|arvores|palmeira|pinheiro|tronco|carvalho|cedro|sequoia)\b/;
const PAPEIS=['exploradora','construtora','covarde','cacadora','forrageira','bando'];

/** papel de vida de acordo com a personalidade; null = não muda */
export function papelPorPersonalidade(pers,base){
 if(base==='parado'||base==='montaria'||base==='arrasta')return null;
 return {explorador:'exploradora',covarde:'covarde',construtora:'construtora'}[pers]||null;
}
/** papel de vida da fome: forrageira (frutos) ou cacadora; null = saciada ou sem dieta */
export function papelPorFome(dieta,sat){
 if(!(sat<FAMINTA))return null;
 if(dieta==='cacadora')return 'cacadora';
 if(dieta==='frugivora')return 'forrageira';
 if(dieta==='onivora')return sat<MUITO_FAMINTA?'cacadora':'forrageira';
 return null;
}
export const aberta=o=>tipoInterativo(o)==='porta'&&!o.destruido&&(!!estadoDe(o).aberto||!o.bloqueiaMovimento);
/** porta fechada e destrancada que dá para abrir */
export function portaFechada(o){
 if(!o||o.destruido||!o.bloqueiaMovimento)return false;
 if(tipoInterativo(o)!=='porta')return false;
 const e=estadoDe(o);return !e.aberto&&!e.trancado;
}
export const recursoParaToca=o=>!!o&&!o.destruido&&!o.colhidoV144&&Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)<=6&&RECURSO.test(sem(o.nome));
export const ehArvore=o=>!!o&&!o.destruido&&!o.colhidoV144&&Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)<=6&&ARVORE.test(sem(o.nome));
/** SVG de uma toca (monte de terra com a entrada escura) como data URL */
export function imagemToca(){
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110"><ellipse cx="80" cy="92" rx="72" ry="14" fill="#000" opacity=".25"/><path d="M8 94 Q20 30 80 22 Q140 30 152 94 Z" fill="#6b5236"/><path d="M20 90 Q32 42 80 34 Q128 42 140 90 Z" fill="#7d6142"/><ellipse cx="80" cy="84" rx="26" ry="22" fill="#1b130c"/><ellipse cx="80" cy="88" rx="18" ry="14" fill="#0a0704"/><g fill="#8e8a82"><circle cx="30" cy="88" r="7"/><circle cx="130" cy="86" r="8"/><circle cx="46" cy="60" r="5"/><circle cx="118" cy="58" r="6"/></g></svg>';
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
export function objetoToca({id,dono,nome,x,y}){
 return {id,nome:'Toca de '+String(nome||'criatura'),tipo:'objeto',x:+x.toFixed(3),y:+y.toFixed(3),larguraM:1.7,alturaM:1.2,angulo:0,camada:1,opacity:1,bloqueiaMovimento:false,bloqueiaVisao:false,imagem:imagemToca(),tocaV200:{dono:String(dono),em:Date.now()}};
}
/** ponto (metros) de um lado do alvo, afastado da ameaça */
export function pontoAtras(alvo,ameaca,dist){
 const dx=alvo.x-ameaca.x,dy=alvo.y-ameaca.y,l=Math.hypot(dx,dy)||1;return {x:alvo.x+dx/l*dist,y:alvo.y+dy/l*dist};
}
/** abrigo numa casa: escolhe a porta e os dois lados (de fora = antes, de dentro = dentro) longe da ameaça; null se o bicho já está do lado de dentro */
export function planoAbrigo(porta,m,eu,amea){
 const w=Number(porta.larguraM)||1,h=Number(porta.alturaM)||1,n=w>h?{x:0,y:1}:{x:1,y:0};
 const p1={x:m.x+n.x*2.4,y:m.y+n.y*2.4},p2={x:m.x-n.x*2.4,y:m.y-n.y*2.4};
 const d=p=>Math.hypot(p.x-amea.x,p.y-amea.y);
 const dentro=d(p1)>=d(p2)?p1:p2,fora=dentro===p1?-1:1;
 const lado=(eu.x-m.x)*n.x+(eu.y-m.y)*n.y;
 if(lado*fora<0)return null; // está do lado de dentro: a porta não o protege
 return {dentro,antes:{x:m.x+n.x*fora*1.2,y:m.y+n.y*fora*1.2}};
}

export function instalarExploracao(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const A=()=>win.mesaAtitudesIaV200;
 const pend=new Map(),obra=new Map(),tentadas=new Map(),ocupado=new Set(),sat=new Map(),dentro=new Set();
 const pers=t=>String(A()?.personalidadeDe?.(t)||t?.personalidadeV200||'');
 const modeloBase=t=>{const m=/^sync(?:criatura|npc):(.+)$/.exec(dec(t?.id));return m?m[1].replace(/~\d+$/,''):'';};
 const inteligente=t=>/^syncnpc:/.test(dec(t?.id))||pers(t)==='explorador';
 const dietaDe=t=>{const v=dietaValida(t?.dietaV200);if(v)return v;return dietaValida(A()?.padraoDe?.(modeloBase(t))?.dieta);};
 const satDe=id=>sat.get(id);
 function alimentar(id,n){sat.set(id,Math.min(100,(sat.get(id)??50)+n));sujoFome=true;}
 let sujoFome=false,sujoAbrigo=false;
 const papelDe=(t,base)=>{
  if(base==='parado'||base==='montaria'||base==='arrasta')return null;
  const d=dietaDe(t);
  if(d){if(!sat.has(t.id)){sat.set(t.id,40+Math.random()*50);sujoFome=true;}const pf=papelPorFome(d,sat.get(t.id));if(pf)return pf;}
  const ate=A()?.atitudeDe?.(t);
  return papelPorPersonalidade(pers(t),base)||(ate?.confianca===0?'covarde':null)||(ate?.ajuda>=1&&/^synccriatura:/.test(dec(t.id))?'bando':null); // Confiança 0 = covarde; Ajuda ligada = anda junto com a mesma espécie
 };
 const quer=(t,papel)=>PAPEIS.includes(papel)||dentro.has(t.id)||pend.get(t.id)?.tipo==='abrigo';
 const tocaDe=(objs,t)=>objs.find(o=>o?.tocaV200&&String(o.tocaV200.dono)===dec(t.id)&&!o.destruido);
 async function cenaDe(mid){
  try{const a=await dep.getDoc(D(SCENE));if(a.exists()&&String(a.data()?.mapId||'')===String(mid))return {caminho:SCENE,ativa:true};}catch(_){}
  return {caminho:arquivo(mid),ativa:false};
 }
 async function gravarCena(mid,fn){
  const c=await cenaDe(mid);
  await dep.runTransaction(dep.db,async tx=>{
   const s=await tx.get(D(c.caminho)),cena=s.exists()?(s.data?.()||s.data):null;if(!cena)return;
   const objs=fn([...(cena.objects||[])]);if(!objs)return;
   tx.set(D(c.caminho),clean({...cena,objects:objs}));if(c.ativa)tx.set(D(arquivo(mid)),clean({...cena,objects:objs}));
  });
 }
 const nomeCurto=t=>String(t.nome||'Alguém').replace(/^(Monstro|NPC)\s*·\s*/,'');
 /** abre (quer='abrir') ou fecha (quer='fechar') uma porta, como um personagem faria */
 async function alternarPorta(t,mid,objId,quer){
  await gravarCena(mid,objs=>{const i=objs.findIndex(o=>String(o.id)===String(objId));if(i<0)return null;
   const o=objs[i];if(quer==='abrir'?!portaFechada(o):!(aberta(o)&&!estadoDe(o).trancado))return null;
   objs[i]=aplicarPedido(o,{acao:'alternar',nome:nomeCurto(t)}).objeto;return objs;});
 }
 async function construirToca(t,mid,pos){
  const dono=dec(t.id),id='toca_'+Math.random().toString(36).slice(2,9);
  await gravarCena(mid,objs=>{if(objs.some(o=>o?.tocaV200&&String(o.tocaV200.dono)===dono))return null;objs.push(objetoToca({id,dono,nome:nomeCurto(t),x:pos.x,y:pos.y}));return objs;});
  // a toca passa a ser a casa (território da atitude agressiva)
  try{const ref=D(POS+'/'+encodeURIComponent(dono)),s=await dep.getDoc(ref);await dep.setDoc(ref,{casaV200:{x:+pos.x.toFixed(3),y:+pos.y.toFixed(3)},revision:Number((s.exists?.()?s.data():{}).revision||0)+1},{merge:true});}catch(e){console.warn('[Exploração] casa',e?.code||e);}
 }
 /** a caça morre (um PV só ou por partes) */
 async function matar(id){
  await dep.runTransaction(dep.db,async tx=>{
   const s=await tx.get(D(HEALTH)),hp=s.exists()?(s.data?.()||s.data):null;const a=hp?.actors?.[id],cl=a?.combateLab;if(!cl)return;
   const hm=cl.hitMax||{},hit={};for(const k of Object.keys(hm))hit[k]=-Math.ceil(Number(hm[k])||1);
   tx.set(D(HEALTH),clean({...hp,actors:{...hp.actors,[id]:{...a,combateLab:{...cl,hit:{...(cl.hit||{}),...hit},morto:true,incapacitado:true}}},revision:Number(hp.revision||0)+1}));
  });
 }
 const guarda=(k,fn)=>{if(ocupado.has(k))return;ocupado.add(k);Promise.resolve().then(fn).catch(e=>console.warn('[Exploração]',e?.code||e?.message||e)).finally(()=>setTimeout(()=>ocupado.delete(k),1500));};
 // ---- quem está dentro da toca some da vista (todos veem); o estado vai num documento só
 function marcarDentro(id,on){
  if(on===dentro.has(id))return;on?dentro.add(id):dentro.delete(id);sujoAbrigo=true;pintar();
 }
 function pintar(){
  try{const b=root.getElementById?.('novaSyncBoard');if(!b)return;const mestre=ehMestre();
   for(const n of b.querySelectorAll('[data-token]')){const d=dentro.has(n.dataset.token);if(d){if(n.dataset.dentroV200!==(mestre?'m':'x'))n.dataset.dentroV200=mestre?'m':'x';}else if(n.dataset.dentroV200)delete n.dataset.dentroV200;}
  }catch(_){}
 }
 try{if(root.getElementById&&!root.getElementById('exCssV200')){const st=root.createElement('style');st.id='exCssV200';
  st.textContent='#novaSyncBoard [data-token][data-dentro-v200="x"]{opacity:0!important;pointer-events:none}#novaSyncBoard [data-token][data-dentro-v200="m"]{opacity:.32!important;filter:grayscale(.6)}';root.head.append(st);}}catch(_){}

 /** ameaça por perto (jogador, ou criatura sanguinária/agressiva) → posição em metros */
 function ameacaPerto(t,c,alcance=ALCANCE_AMEACA_M){
  let melhor=null,dm=alcance;
  const ver=m=>{const d=Math.hypot(m.x-c.eu.x,m.y-c.eu.y);if(d<dm){dm=d;melhor={...m,d};}};
  for(const j of c.jogadores||[])ver(j);
  for(const o of c.lista||[]){if(o.id===t.id)continue;const a=A()?.atitudeDe?.(o);if(a&&(a.id==='sanguinaria'||a.id==='agressiva'))ver(c.pos(o.id));}
  return melhor;
 }
 function planejarAbrigo(t,c,amea){
  let melhor=null,db=1e9;
  for(const o of c.objs){if(tipoInterativo(o)!=='porta'||o.destruido||estadoDe(o).trancado)continue;
   const m=c.toM(o),d=Math.hypot(m.x-c.eu.x,m.y-c.eu.y);if(d>28||d>=db)continue;
   const pl=planoAbrigo(o,m,c.eu,amea);if(!pl)continue;
   if(Math.hypot(pl.antes.x-amea.x,pl.antes.y-amea.y)<2.5)continue; // a ameaça está na porta
   db=d;melhor={tipo:'abrigo',objId:String(o.id),etapa:0,...pl};}
  return melhor;
 }
 function refugio(t,c,amea){
  const toca=tocaDe(c.objs,t),id=t.id;
  if(toca){const m=c.toM(toca),d=Math.hypot(m.x-c.eu.x,m.y-c.eu.y);
   setTimeout(()=>marcarDentro(id,true),Math.max(300,d/4.4*1000)); // entra na toca ao chegar
   return {p:c.ponto(m.x,m.y),pausa:9000+Math.random()*6000,v:4.4,fuga:true};}
  if(inteligente(t)){const ab=planejarAbrigo(t,c,amea);if(ab){pend.set(id,ab);return {p:c.ponto(ab.antes.x,ab.antes.y),pausa:500,v:3.2,fuga:true};}}
  const bloc=c.objs.filter(o=>o.bloqueiaMovimento&&!o.destruido&&tipoInterativo(o)!=='porta'&&Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)<=8&&Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)>=.8)
   .map(o=>({o,m:c.toM(o)})).filter(x=>Math.hypot(x.m.x-c.eu.x,x.m.y-c.eu.y)<22&&Math.hypot(x.m.x-amea.x,x.m.y-amea.y)>Math.hypot(c.eu.x-amea.x,c.eu.y-amea.y)*.6)
   .sort((a,b)=>Math.hypot(a.m.x-c.eu.x,a.m.y-c.eu.y)-Math.hypot(b.m.x-c.eu.x,b.m.y-c.eu.y))[0];
  if(bloc){const meia=Math.max(Number(bloc.o.larguraM)||1,Number(bloc.o.alturaM)||1)/2+.9,q=pontoAtras(bloc.m,amea,meia);return {p:c.ponto(q.x,q.y),pausa:7000+Math.random()*5000,v:4.4,fuga:true};}
  const q=pontoAtras(c.eu,amea,8);return {p:c.ponto(q.x,q.y),pausa:800,v:4.4,fuga:true};
 }
 /** passos de entrar numa casa: ir até a porta → abrir → entrar → fechar → esperar → abrir e sair quando a ameaça passa */
 function passoAbrigo(t,c,ab){
  const id=t.id,porta=c.objs.find(o=>String(o.id)===ab.objId);
  if(!porta){pend.delete(id);return null;}
  if(ab.etapa===0){ab.etapa=1;if(portaFechada(porta))guarda('abrir|'+id,()=>alternarPorta(t,c.mid,ab.objId,'abrir'));return {p:c.ponto(c.eu.x,c.eu.y),pausa:1400,v:1,acao:'🚪'};}
  if(ab.etapa===1){ab.etapa=2;return {p:c.ponto(ab.dentro.x,ab.dentro.y),pausa:1800,v:3.2};}
  if(ab.etapa===2){ab.etapa=3;guarda('fechar|'+id,()=>alternarPorta(t,c.mid,ab.objId,'fechar'));return {p:c.ponto(c.eu.x,c.eu.y),pausa:4000,v:1,acao:'🔒'};}
  if(ameacaPerto(t,c,ALCANCE_AMEACA_M+2))return {p:c.ponto(c.eu.x,c.eu.y),pausa:5000,v:1};
  pend.delete(id);if(!aberta(porta))guarda('sair|'+id,()=>alternarPorta(t,c.mid,ab.objId,'abrir'));
  return {p:c.ponto(c.eu.x,c.eu.y),pausa:1500,v:1};
 }

 /** chamado pela vida quando a miniatura precisa de um novo destino; devolve {p,pausa,v,acao?,recurso?,fuga?,caca?} ou null (segue o padrão da vida) */
 function destino(t,papel,c){
  const id=t.id,r=Math.random;
  if(dentro.has(id)){ // dentro da toca: sai quando a ameaça passou
   if(ameacaPerto(t,c,ALCANCE_AMEACA_M+2))return {p:c.ponto(c.eu.x,c.eu.y),pausa:5000,v:1};
   marcarDentro(id,false);return {p:c.ponto(c.eu.x+1.6,c.eu.y+1.2),pausa:1500,v:1};
  }
  const ab=pend.get(id);if(ab?.tipo==='abrigo')return passoAbrigo(t,c,ab);
  if(papel==='covarde'||papel==='construtora'||papel==='forrageira'||papel==='cacadora'){
   const raio=papel==='covarde'?ALCANCE_AMEACA_M:5; // quem trabalha ou come só foge de quem chega bem perto
   const a=ameacaPerto(t,c,raio);if(a)return refugio(t,c,a);}
  if(papel==='covarde')return {p:c.ponto(c.casa.x+(r()-.5)*9,c.casa.y+(r()-.5)*6),pausa:1200+r()*1800,v:1.0}; // pausas curtas: reage logo ao perigo
  if(papel==='bando'){ // junta-se aos da mesma espécie: vai até o grupo e fica por perto
   const kin=(c.lista||[]).filter(o=>o.id!==id&&!dentro.has(o.id)&&(c.viva?c.viva(o.id):true)&&A()?.mesmoBando?.(t,o)).map(o=>c.pos(o.id)).filter(p=>Math.hypot(p.x-c.eu.x,p.y-c.eu.y)<35);
   if(kin.length){const gx=kin.reduce((s,p)=>s+p.x,0)/kin.length,gy=kin.reduce((s,p)=>s+p.y,0)/kin.length,d=Math.hypot(gx-c.eu.x,gy-c.eu.y);
    if(d>3.2){const a=Math.atan2(c.eu.y-gy,c.eu.x-gx);return {p:c.ponto(gx+Math.cos(a)*1.6+(r()-.5),gy+Math.sin(a)*1.6+(r()-.5)),pausa:800+r()*1200,v:1.1};}
    return {p:c.ponto(gx+(r()-.5)*4,gy+(r()-.5)*3),pausa:3000+r()*4000,v:.9};}
   return null; // sozinho: segue a rotina normal
  }
  if(papel==='cacadora'){
   const pe=pend.get(id);
   if(pe?.tipo==='comendo'){pend.delete(id);alimentar(id,100);return {p:c.ponto(c.eu.x+1,c.eu.y),pausa:2500,v:1};}
   const meu=Number(t.diametroM)||1,mb=modeloBase(t),AT=A()?.atitudeDe?.(t);
   const presas=(c.lista||[]).filter(o=>o.id!==id&&/^synccriatura:/.test(dec(o.id))&&modeloBase(o)!==mb&&!dentro.has(o.id)&&(c.viva?c.viva(o.id):true)&&(Number(o.diametroM)||1)<=meu*1.25
     &&!(AT?.id==='aliada'&&A()?.atitudeDe?.(o)?.id==='aliada'&&A().atitudeDe(o).grupo===AT.grupo))
    .map(o=>({o,m:c.pos(o.id)})).filter(x=>Math.hypot(x.m.x-c.eu.x,x.m.y-c.eu.y)<30).sort((a,b)=>Math.hypot(a.m.x-c.eu.x,a.m.y-c.eu.y)-Math.hypot(b.m.x-c.eu.x,b.m.y-c.eu.y));
   if(presas.length){const x=presas[0],d=Math.hypot(x.m.x-c.eu.x,x.m.y-c.eu.y);
    if(d<1.8){pend.set(id,{tipo:'comendo'});guarda('matar|'+id,()=>matar(x.o.id));return {p:c.ponto(c.eu.x,c.eu.y),pausa:5500,v:1,acao:'🍖'};}
    const passo=Math.min(d-.6,5),dx=(x.m.x-c.eu.x)/d,dy=(x.m.y-c.eu.y)/d;return {p:c.ponto(c.eu.x+dx*passo,c.eu.y+dy*passo),pausa:0,v:3.8,caca:true};}
   return {p:c.ponto(c.casa.x+(r()-.5)*14,c.casa.y+(r()-.5)*9),pausa:2500+r()*3000,v:1.2}; // sem presa à vista: rondando
  }
  if(papel==='forrageira'){
   const pe=pend.get(id);
   if(pe?.tipo==='fruto'){pend.delete(id);alimentar(id,60);return {p:c.ponto(c.eu.x+1,c.eu.y+.5),pausa:2000,v:1};}
   const arv=c.objs.filter(ehArvore).map(o=>({o,m:c.toM(o)})).filter(x=>Math.hypot(x.m.x-c.eu.x,x.m.y-c.eu.y)<ALCANCE_BUSCA_M).sort((a,b)=>Math.hypot(a.m.x-c.eu.x,a.m.y-c.eu.y)-Math.hypot(b.m.x-c.eu.x,b.m.y-c.eu.y));
   if(arv.length){const x=arv[Math.min(arv.length-1,Math.floor(r()*Math.min(2,arv.length)))],lado=(Number(x.o.larguraM)||1)/2+.7,ang=r()*Math.PI*2;
    pend.set(id,{tipo:'fruto'});return {p:c.ponto(x.m.x+Math.cos(ang)*lado,x.m.y+Math.sin(ang)*lado),pausa:6000,v:1.1,acao:'🍎'};}
   return {p:c.ponto(c.casa.x+(r()-.5)*10,c.casa.y+(r()-.5)*6),pausa:3000+r()*3000,v:1.0};
  }
  if(papel==='exploradora'){
   const pe=pend.get(id);
   if(pe){ // chegou na frente da porta: abre; passa só depois que a porta já abriu (o caminho é calculado agora)
    if(!pe.aberta){pe.aberta=true;pe.n=0;guarda('porta|'+id,()=>alternarPorta(t,c.mid,pe.objId,'abrir'));return {p:c.ponto(c.eu.x,c.eu.y),pausa:1600,v:1.5,acao:'🚪'};}
    if(++pe.n>=3)pend.delete(id);
    return {p:c.ponto(pe.alem.x,pe.alem.y),pausa:3000+r()*2500,v:1.5};}
   const feitas=tentadas.get(c.mid)||new Set();if(feitas.size&&r()<.06)feitas.clear(); // às vezes tenta de novo
   const portas=c.objs.filter(o=>portaFechada(o)&&!feitas.has(String(o.id))).map(o=>({o,m:c.toM(o)})).filter(x=>Math.hypot(x.m.x-c.eu.x,x.m.y-c.eu.y)<ALCANCE_BUSCA_M).sort((a,b)=>Math.hypot(a.m.x-c.eu.x,a.m.y-c.eu.y)-Math.hypot(b.m.x-c.eu.x,b.m.y-c.eu.y));
   if(portas.length&&r()<.75){
    const x=portas[0],dx=x.m.x-c.eu.x,dy=x.m.y-c.eu.y,l=Math.hypot(dx,dy)||1,f=Math.max(1.0,Math.max(Number(x.o.larguraM)||1,Number(x.o.alturaM)||1)/2+.7);
    const antes={x:x.m.x-dx/l*f,y:x.m.y-dy/l*f},alem={x:x.m.x+dx/l*2.6,y:x.m.y+dy/l*2.6};
    feitas.add(String(x.o.id));tentadas.set(c.mid,feitas);pend.set(id,{objId:String(x.o.id),alem});
    return {p:c.ponto(antes.x,antes.y),pausa:700,v:1.6};
   }
   return {p:c.ponto(r()*c.W,r()*c.H),pausa:1500+r()*3500,v:1.5};
  }
  if(papel==='construtora'){
   const st=obra.get(id)||{pedras:0};obra.set(id,st);
   const toca=tocaDe(c.objs,t);
   if(toca){const m=c.toM(toca);return {p:c.ponto(m.x+(r()-.5)*7,m.y+(r()-.5)*5),pausa:3000+r()*6000,v:1.0};}
   const pe=pend.get(id);
   if(pe&&pe.tipo==='construir'){pend.delete(id);st.pedras=0;guarda('toca|'+id,()=>construirToca(t,c.mid,pe.pos));return {p:c.ponto(pe.pos.x+1.6,pe.pos.y+.8),pausa:2500,v:1.0};}
   if(st.pedras>=PEDRAS_PARA_TOCA){const pos={x:c.casa.x+(r()-.5)*3,y:c.casa.y+(r()-.5)*2};pend.set(id,{tipo:'construir',pos});return {p:c.ponto(pos.x,pos.y),pausa:6000,v:1.1,acao:'🕳️'};}
   const rec=c.objs.filter(recursoParaToca).map(o=>({o,m:c.toM(o)})).filter(x=>Math.hypot(x.m.x-c.eu.x,x.m.y-c.eu.y)<ALCANCE_BUSCA_M).sort((a,b)=>Math.hypot(a.m.x-c.eu.x,a.m.y-c.eu.y)-Math.hypot(b.m.x-c.eu.x,b.m.y-c.eu.y));
   if(rec.length){const x=rec[Math.min(rec.length-1,Math.floor(r()*Math.min(3,rec.length)))],lado=(Number(x.o.larguraM)||1)/2+.7,ang=r()*Math.PI*2;
    return {p:c.ponto(x.m.x+Math.cos(ang)*lado,x.m.y+Math.sin(ang)*lado),pausa:5000+r()*2500,v:1.1,acao:ARVORE.test(sem(x.o.nome))?'🪓':'🪨',recurso:String(x.o.id),golpes:1};} // cada visita colhe uma pedra/árvore
   return {p:c.ponto(c.casa.x+(r()-.5)*8,c.casa.y+(r()-.5)*6),pausa:4000+r()*4000,v:1.0};
  }
  return null;
 }
 /** a vida avisa quando um recurso foi colhido (a pedra/árvore "sumiu") */
 function aoColher(id,mid,recurso){const st=obra.get(id);if(st)st.pedras++;}

 // ---- fome: a saciedade cai com o tempo (só o mestre mexe e grava; todos leem)
 let parar=[],ultGrava=0;
 const iv=setInterval(()=>{try{
  if(ehMestre()){for(const [id,v] of sat)sat.set(id,Math.max(0,v-1.5));if(sat.size)sujoFome=true;
   if(Date.now()-ultGrava>15000){ultGrava=Date.now();
    if(sujoFome){sujoFome=false;void dep.setDoc?.(D(FOME),{valores:Object.fromEntries([...sat].map(([k,v])=>[k,Math.round(v)])),atualizadoEm:Date.now()}).catch?.(()=>{});}}
   if(sujoAbrigo){sujoAbrigo=false;void dep.setDoc?.(D(ABRIGO),{dentro:Object.fromEntries([...dentro].map(k=>[k,1])),atualizadoEm:Date.now()}).catch?.(()=>{});}}
  pintar();
 }catch(e){console.warn('[Exploração]',e);}},6000);
 iv.unref?.();
 const ivPintar=setInterval(pintar,700);ivPintar.unref?.();
 try{if(dep.onSnapshot){
  parar.push(dep.onSnapshot(D(ABRIGO),s=>{if(ehMestre())return;const v=s.exists()?s.data()?.dentro||{}:{};dentro.clear();for(const k of Object.keys(v))dentro.add(k);pintar();},()=>{}));
  parar.push(dep.onSnapshot(D(FOME),s=>{if(ehMestre())return;const v=s.exists()?s.data()?.valores||{}:{};for(const [k,n] of Object.entries(v))sat.set(k,Number(n));},()=>{}));}}catch(_){}
 const api={papelDe,quer,destino,aoColher,tocaDe,alimentar,saciedade:satDe,dentro:id=>dentro.has(id),dietaDe,marcarDentro,
  parar:()=>{clearInterval(iv);clearInterval(ivPintar);parar.forEach(f=>{try{f();}catch(_){}});},_estado:()=>({pend,obra,tentadas,sat,dentro})};
 win.mesaExploracaoV200=api;return api;
}
