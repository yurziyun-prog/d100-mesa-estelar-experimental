// Mesa Estelar v137 — Vida no mapa fora do combate (NPCs e criaturas com rotina) e mapas amplos novos.
//
// v205 — autonomia por facção: neutros vivem no território (papel 'neutro') e só reagem se
// atacados (fogem, papel 'foge'); predadores não caçam neutros. Facção lida do estado de
// tempo real, que persiste fora do combate. Em combate em tempo real, neutro atacado já
// virava 'selvagens' (revide) — agora a reação existe também fora dele.
//
// Quando não há combate (nem por turnos nem em tempo real) e há jogadores no mapa ou o mestre está olhando:
//  🤖 UR-17, robôs de manutenção, garçons: passam de mesa em mesa arrumando;
//  🛒 comerciantes: ficam na banca, mexendo nas coisas; 🚶 fregueses e civis: passeiam e param nas bancas;
//  🛡️ guardas: fazem ronda — montados num dragão-trombeta domesticado (a miniatura do guarda vai em cima);
//  🦖 predadores: caçam as presas; 🐾 presas: pastam e fogem quando um predador chega perto;
//  🧟 sem mente: arrastam-se devagar; sésseis (Cila) ficam.
// Economia: o caminho de cada um é publicado num documento só (todos veem o movimento suave, calculado no
// próprio navegador) e a posição de verdade é gravada de tempos em tempos e quando o combate começa.

import {montarGrade,caminho,ehJogador,faccaoDe,fracaoVida} from './mesa-tempo-real-ia.js?v=133';
import {livrePerto} from './mesa-ligacoes.js?v=154';

const VIDA='combatesAtivos/mesaVida',MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',HEALTH='combatesAtivos/mapaMesaSyncSaude';
const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

// ---------------------------------------------------------------- regras puras
// Papel de rotina pelo texto da ficha (nome, carreira, comportamento) e pelo tipo.
export function papelVida({id='',texto='',comerciante=false,mov=1}={}){
 const t=sem(texto),cri=decodeURIComponent(String(id)).startsWith('synccriatura:');
 if(!(Number(mov)>0)||/sessil|\bs[ci]la\b/.test(t))return 'parado';
 if(cri){
  if(/domesticad|montaria|treinad/.test(t))return 'montaria';
  if(/zumbi|cadaver|morto|revenant/.test(t))return 'arrasta';
  if(/presa|herbivor|pacific|pastand|social|cavalgante|macaco|manada/.test(t))return 'presa';
  if(/predador|caca|cacador|investe|emboscad|apice|territorial|ataca/.test(t))return 'predador';
  return 'vaga';
 }
 if(/\b(minerador|mineiro|garimpeiro)\b/.test(t))return 'minerador'; // v144
 if(/\blenhador\b/.test(t))return 'lenhador';
 if(/\bur-?17\b|robo utilitari|manutencao|zelador|faxineir|garcom|garconete|administrador de tabern|limpeza/.test(t))return 'limpeza';
 if(comerciante||/comerciante|mercador|mercante|vendedor|feirante|ambulante|estalajadeir|cambista/.test(t))return 'comercio';
 if(/guarda|soldado|sentinela|vigia|patrulh|policia|seguranca|miliciano/.test(t))return 'guarda';
 if(/\bzumbi|revenante|cadaver/.test(t))return 'arrasta';
 return 'civil';
}
export const VELOCIDADE={limpeza:1.1,comercio:.7,guarda:1.3,civil:1.1,vaga:1.2,presa:.7,predador:1.4,arrasta:.45,montaria:1.3,montado:3,caca:3.8,fuga:4.4,neutro:.6};
// v205 — autonomia por facção (fora de combate). Neutros vivem no território e só reagem
// se atacados (fogem de quem os feriu). 'parado' e 'montaria' seguem como antes.
export function papelComFaccao(papel,fac,ferido=false){
 if(fac!=='neutros')return papel;
 if(papel==='parado'||papel==='montaria')return papel;
 return ferido?'foge':'neutro';
}
// v138: documento de posição que sobrou de um token apagado (escritas parciais com merge)
export function tokenFantasma(t){return !!t&&!('nome' in t)&&!('imagem' in t)&&!('mapaId' in t)&&!('donoUid' in t);}
// Posição no meio do caminho (normalizada) — usada por todos para desenhar.
export function posicaoNaPerna(l,agora=Date.now()){
 if(!l)return null;const f=Math.max(0,Math.min(1,(agora-Number(l.t0))/Math.max(1,Number(l.d))));
 return {x:l.a[0]+(l.b[0]-l.a[0])*f,y:l.a[1]+(l.b[1]-l.a[1])*f,fim:f>=1};
}
// Ronda: quatro pontos num retângulo em volta de casa (metros).
export function pontosDeRonda(casa,W,H,r=7){
 const c=(x,y)=>({x:Math.max(1,Math.min(W-1,x)),y:Math.max(1,Math.min(H-1,y))});
 return [c(casa.x-r,casa.y-r*.5),c(casa.x+r,casa.y-r*.5),c(casa.x+r,casa.y+r*.5),c(casa.x-r,casa.y+r*.5)];
}

export function instalarVida(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let vida={legs:{}},mapa=null,cena=null,cenaSalva=null,saude=null,parar=[],posicoes=new Map();
 // v205 — facção de cada token: vem do estado de tempo real (persiste fora do combate)
 const faccoesAtuais=()=>{try{return win.mesaTempoRealV111?.estado?.()?.faccoes||{};}catch(_){return {};}};
 const facDe=t=>{try{return faccaoDe(t,faccoesAtuais());}catch(_){return 'inimigos';}};
 const ferido=t=>{try{return fracaoVida(saude,t.id)<.999;}catch(_){return false;}};
 // v143: a vida roda em TODOS os mapas onde há jogadores (não só no que o mestre está olhando). ctx = mapa da vez.
 const trabalhos=new Map(),golpes=new Map();
 let ctx=null;const cenasArq=new Map(),pararArq=new Map(),grades=new Map(),encostados=new Set();
 const dimsMapa=id=>{if(String(id)===String(mapa?.mapId||''))return {W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14};const m=(dep.mapas?.()||[]).find(x=>String(x.id)===String(id));return {W:Number(m?.larguraM)||28,H:Number(m?.alturaM)||14};};
 const dims=()=>ctx?{W:ctx.W,H:ctx.H}:{W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14};
 const objsDoCtx=()=>ctx?ctx.objs:(cena?.mapId===mapa?.mapId?cena.objects||[]:[]);
 function objsDoMapa(id){
  if(String(id)===String(mapa?.mapId||''))return cena?.mapId===mapa?.mapId?cena.objects||[]:[];
  if(!pararArq.has(id)){pararArq.set(id,dep.onSnapshot(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)),s=>{cenasArq.set(id,s.exists()?s.data()?.objects||[]:[]);},()=>{}));}
  return cenasArq.get(id)||[];
 }
 const toM=p=>{const {W,H}=dims();return {x:Number(p.x)*W/28,y:Number(p.y)*H/14};};
 const toN=p=>{const {W,H}=dims();return {x:Math.max(.3,Math.min(27.7,p.x*28/W)),y:Math.max(.3,Math.min(13.7,p.y*14/H))};};

 // ------------------------------------------------------------ desenho suave (todos)
 let raf=0;
 function quadro(){
  if(win.mesaJogoPausadoV214?.()){raf=0;return;}
  raf=0;const legs=vida?.ativo?vida.legs||{}:{},b=root.getElementById('novaSyncBoard');
  const visivel=String(b?.dataset.mapaVisivel||mapa?.mapId||'');
  if(b&&(String(vida?.mapId||'')===visivel||(vida?.mapas||[]).map(String).includes(visivel))){
   const agora=Date.now()+Number(vida.desvio||0);
   for(const [id,l] of Object.entries(legs)){if(l.m&&String(l.m)!==visivel)continue;const p=posicaoNaPerna(l,agora);if(!p)continue;const n=b.querySelector(`[data-token="${CSS.escape(id)}"]`);if(!n)continue;
    n.style.left=p.x/28*100+'%';n.style.top=p.y/14*100+'%';if(l.cima)n.style.zIndex='6';
    const ac=l.acao&&p.fim?l.acao:'';if((n.dataset.acaoV144||'')!==ac){if(ac)n.dataset.acaoV144=ac;else delete n.dataset.acaoV144;}}
  }
  if(vida?.ativo&&Object.keys(legs).length)raf=win.requestAnimationFrame(quadro);
 }
 const agendar=()=>{if(!raf)raf=win.requestAnimationFrame(quadro);};

 // ------------------------------------------------------------ motor (mestre)
 const diagRegistro=new Map(); // v205: o que cada um decidiu por último (diagnóstico do mestre; nunca vira balão para jogadores)
 const casas=new Map(),rotinas=new Map(),filas=new Map(),pausas=new Map(),ultimaGravada=new Map(),infoCache=new Map();
 let grade=null,gradeChave='',ligado=false,ultimoCommit=0,legsLocais={};
 function info(t){
  const id=decodeURIComponent(String(t.id||''));if(infoCache.has(id))return infoCache.get(id);
  const base=id.split(':').slice(1).join(':').split('~')[0];let m=null;
  if(id.startsWith('syncnpc:'))m=(dep.npcs?.()||[]).find(x=>String(x.id)===base);
  else if(id.startsWith('synccriatura:'))m=(dep.criaturas?.()||[]).find(x=>String(x.id)===base);
  const comerciante=m?.comerciante===true||String(m?.comerciante)==='true';
  const mov=m?(m.movimentoTerrestre===undefined||m.movimentoTerrestre===''?6:Number(String(m.movimentoTerrestre).replace(',','.'))||0):6;
  const r={papel:papelVida({id,texto:[t.nome,m?.nome,m?.carreira,m?.tipo,m?.especie,m?.comportamento,m?.habilidadesTexto].join(' '),comerciante,mov:id.startsWith('synccriatura:')?(Number(m?.movimentoVoo)||mov):mov}),modelo:base};
  if(/^syncnpc:comerciante_generico_/.test(id))r.papel=win.mesaComerciantes?.ambulante?.(String(t.id))?'civil':'comercio'; // v141: na barraca ou ambulante
  if(/\bde carga\b|\bda caravana\b/i.test(String(t.nome||'')))r.papel='parado';
  if(/^syncnpc:guarda_do_portao_1(~|$)/.test(id)&&/denzel/i.test(String(t.nome||'')))r.papel='parado'; // v163: Denzel fica no portão (cobra a entrada) // v160: dragões da caravana ficam junto da carroça
  try{const mt=win.mesaComerciantes?.meta?.()?.[t.id]||win.mesaComerciantes?.meta?.()?.[decodeURIComponent(String(t.id))];if(mt?.lojaV160||mt?.lojaV161||mt?.caravanaV160)r.papel='parado';}catch(_){} // v161: comerciante de loja fica atrás do balcão
  if(!/^syncnpc:comerciante_generico_/.test(id))infoCache.set(id,r);return r;
 }
 // v144: quem voa passa por cima de muros, mas não entra onde há teto; quem anda respeita paredes e portas fechadas
 const ehTeto=o=>!!o&&(o.tetoV139||/^telhado\s*·/i.test(String(o.nome||'')));
 function voa(t){const id=decodeURIComponent(String(t.id||'')),base=id.split(':').slice(1).join(':').split('~')[0];const m=id.startsWith('synccriatura:')?(dep.criaturas?.()||[]).find(x=>String(x.id)===base):null;return Number(String(m?.movimentoVoo||'').replace(',','.'))>0;}
 function gradeDe(t){
  if(!voa(t))return gradeAtual();const {W,H}=dims(),tetos=objsDoCtx().filter(ehTeto),eu=toM(posAtual(t.id)||t);
  if(tetos.some(o=>{const c=toM(o),w=(Number(o.larguraM)||1)/2,h=(Number(o.alturaM)||1)/2;return Math.abs(eu.x-c.x)<w&&Math.abs(eu.y-c.y)<h;}))return gradeAtual(); // está debaixo de um teto: sai pelas portas
  const mid='voo:'+String(ctx?.mapId||mapa?.mapId||''),k=W+'x'+H+':'+tetos.length,g=grades.get(mid);if(g&&g.chave===k)return g.grade;
  const nova=montarGrade(tetos.map(o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),W,H,{passo:W>40?1:.5});grades.set(mid,{chave:k,grade:nova});return nova;
 }
 function gradeAtual(){
  const {W,H}=dims(),objs=objsDoCtx().filter(o=>o.bloqueiaMovimento&&!o.destruido&&!globalThis.mesaPassavelV170_?.(o)&&!(Number(o?.andarV144??o?.oficinaElement?.andarV144??1)>1)),mid=String(ctx?.mapId||mapa?.mapId||'');
  const chave=W+'x'+H+':'+objs.length+':'+objs.reduce((a,o)=>a+Number(o.x)+Number(o.y),0).toFixed(2),g=grades.get(mid);if(g&&g.chave===chave)return g.grade;
  const nova=montarGrade(objs.map(o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),W,H,{passo:W>40?1:.5});grades.set(mid,{chave,grade:nova});return nova;
 }
 // v200: grade mais fina (célula de 25 cm, folga de 20 cm) só quando o caminho normal não chega — deixa passar por portas estreitas (a partir de ~1 m)
 function gradeFina(){
  const {W,H}=dims(),objs=objsDoCtx().filter(o=>o.bloqueiaMovimento&&!o.destruido&&!globalThis.mesaPassavelV170_?.(o)&&!(Number(o?.andarV144??o?.oficinaElement?.andarV144??1)>1)),mid='fina:'+String(ctx?.mapId||mapa?.mapId||'');
  const chave=W+'x'+H+':'+objs.length+':'+objs.reduce((a,o)=>a+Number(o.x)+Number(o.y),0).toFixed(2),g=grades.get(mid);if(g&&g.chave===chave)return g.grade;
  const nova=montarGrade(objs.map(o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),W,H,{passo:.25,raio:.2});grades.set(mid,{chave,grade:nova});return nova;
 }
 // Mapas onde a vida roda agora: o que o mestre olha + todos os que têm jogadores (fora de combate).
 const mapasParaRodar=()=>{
  if(!ehMestre())return [];
  let rtMapa='';try{if(win.mesaTempoRealV111?.ativo?.())rtMapa=String(win.mesaTempoRealV111.estado?.()?.mapId||mapa?.mapId||'');}catch(_){}
  const out=new Set(),shared=String(mapa?.mapId||'');
  if(shared&&String(root.getElementById('novaSyncBoard')?.dataset.mapaVisivel||'')===shared&&!root.hidden)out.add(shared);
  for(const t of posicoes.values())if(ehJogador(t)&&t.nome!==undefined){const m=String(t.mapaId||shared);if(m)out.add(m);}
  if(mapa?.combat?.active)out.delete(shared); // v203: com o tempo real ligado a vida continua (só não mexe em quem o tempo real está usando: ver livre())
  return [...out].slice(0,5); // no máximo 5 mapas ao mesmo tempo (o do mestre vem primeiro)
 };
 const deveRodar=()=>mapasParaRodar().length>0;
 const posAtual=id=>{const l=legsLocais[id];if(l){const p=posicaoNaPerna(l);if(p)return p;}const t=posicoes.get(id);return t?{x:Number(t.x),y:Number(t.y)}:null;};
 // v173: alguém está atuando com ele (mestre com 🎭) ou foi movido à mão de propósito
 function controlado(t){try{if(ctl()?.ator?.()?.id===t.id)return true;}catch(_){}return false;}
 function livre(t){
  const st=saude?.actors?.[t.id]?.combateLab,a=saude?.actors?.[t.id];
  if(st?.morto||st?.inconsciente||st?.incapacitado||a?.repouso)return false;
  try{if(win.mesaCompanheiros?.ehCompanheiro?.(t.id))return false;}catch(_){}
  try{if(ctl()?.ator?.()?.id===t.id)return false;}catch(_){} // o mestre está atuando com ele
  try{if(win.mesaTempoRealV111?.ocupado?.(t.id))return false;}catch(_){} // v203: em luta no tempo real
  const arr=win.mesaArrastando?.()||{};if(arr[t.id]||Object.values(arr).some(v=>v.alvo?.id===t.id||(v.ajudantes||[]).includes(t.id)))return false;
  return true;
 }
 function destinoPara(t,papel,agora,lista){
  const {W,H}=dims(),eu=toM(posAtual(t.id)||t),casa=casas.get(t.id)||eu,objs=objsDoCtx(),r=Math.random;
  const ponto=(x,y)=>{const n=toN({x,y});return livrePerto(objs,n.x,n.y,W,H,.5);};
  {const X=win.mesaExploracaoV200;if(X&&X.quer(t,papel)){ // v200
   const jogadores=[...posicoes.values()].filter(p=>ehJogador(p)&&String(p.mapaId||mapa?.mapId||'')===String(ctx?.mapId||mapa?.mapId||'')&&p.nome!==undefined).map(p=>toM(posAtual(p.id)||p));
   const d=X.destino(t,papel,{eu,casa,objs,W,H,ponto,lista,jogadores,toM,mid:String(ctx?.mapId||mapa?.mapId||''),pos:i=>toM(posAtual(i)||posicoes.get(i)||{x:0,y:0}),viva:i=>!(saude?.actors?.[i]?.combateLab?.morto)});if(d)return d;}}
  if(papel==='limpeza'){const alvos=objs.filter(o=>/mesa|cadeira|banqueta|balcao|poltrona|sofa|bancada|prateleira|estante/.test(sem(o.nome))&&!o.destruido);
   if(alvos.length){const o=alvos[Math.floor(r()*alvos.length)],m=toM(o);return {p:ponto(m.x+(r()-.5)*1.4,m.y+(Number(o.alturaM)||1)/2+.7),pausa:3000+r()*4000,v:VELOCIDADE.limpeza};}}
  if(papel==='minerador'||papel==='lenhador'){ // v144: vai até uma rocha/árvore e trabalha
   const rec=objs.filter(o=>win.mesaTrabalhoV144?.ehRecurso?.(o,papel)).map(o=>({o,m:toM(o)})).filter(x=>Math.hypot(x.m.x-eu.x,x.m.y-eu.y)<35).sort((a,b)=>Math.hypot(a.m.x-eu.x,a.m.y-eu.y)-Math.hypot(b.m.x-eu.x,b.m.y-eu.y));
   if(rec.length){const x=rec[Math.min(rec.length-1,Math.floor(r()*Math.min(3,rec.length)))],lado=(Number(x.o.larguraM)||1)/2+.7,ang=r()*Math.PI*2;
    return {p:ponto(x.m.x+Math.cos(ang)*lado,x.m.y+Math.sin(ang)*lado),pausa:9000+r()*6000,v:VELOCIDADE.civil,acao:win.mesaTrabalhoV144?.ACAO?.(papel)||'⛏️',recurso:String(x.o.id)};}
   return {p:ponto(casa.x+(r()-.5)*8,casa.y+(r()-.5)*6),pausa:4000+r()*4000,v:VELOCIDADE.civil};
  }
  if(papel==='comercio')return {p:ponto(casa.x+(r()-.5)*2.4,casa.y+(r()-.5)*1.6),pausa:5000+r()*7000,v:VELOCIDADE.comercio};
  if(papel==='guarda'||papel==='montaria'){const rd=pontosDeRonda(casa,W,H,Math.min(10,W/5)),k=(Number(rotinas.get(t.id)?.k)||0)+1;rotinas.set(t.id,{k});const q=rd[k%4];
   const montado=lista.some(o=>o.id!==t.id&&montadoEm(o,t));return {p:ponto(q.x,q.y),pausa:1500+r()*2500,v:montado?VELOCIDADE.montado:VELOCIDADE[papel]};}
  if(papel==='civil'){
   const bancas=lista.filter(o=>info(o).papel==='comercio');
   if(bancas.length&&r()<.4){const b=toM(posAtual(bancas[Math.floor(r()*bancas.length)].id));return {p:ponto(b.x+(r()-.5)*2,b.y+1.3+r()),pausa:4000+r()*6000,v:VELOCIDADE.civil};}
   return {p:ponto(casa.x+(r()-.5)*Math.min(20,W*.5),casa.y+(r()-.5)*Math.min(12,H*.5)),pausa:2000+r()*5000,v:VELOCIDADE.civil};
  }
  if(papel==='presa'){
   const pred=lista.filter(o=>info(o).papel==='predador'&&facDe(o)!=='neutros').map(o=>({o,m:toM(posAtual(o.id))})).filter(x=>Math.hypot(x.m.x-eu.x,x.m.y-eu.y)<8).sort((a,b)=>Math.hypot(a.m.x-eu.x,a.m.y-eu.y)-Math.hypot(b.m.x-eu.x,b.m.y-eu.y))[0];
   if(pred){const dx=eu.x-pred.m.x,dy=eu.y-pred.m.y,l=Math.hypot(dx,dy)||1;return {p:ponto(eu.x+dx/l*7,eu.y+dy/l*7),pausa:300,v:VELOCIDADE.fuga,fuga:true};}
   return {p:ponto(casa.x+(r()-.5)*8,casa.y+(r()-.5)*6),pausa:3000+r()*6000,v:VELOCIDADE.presa};
  }
  if(papel==='predador'){
   const fome=(rotinas.get(t.id)?.saciadoAte||0)<agora;
   const presa=fome&&lista.filter(o=>info(o).papel==='presa'&&info(o).modelo!==info(t).modelo&&facDe(o)!=='neutros').map(o=>({o,m:toM(posAtual(o.id))})).filter(x=>Math.hypot(x.m.x-eu.x,x.m.y-eu.y)<25).sort((a,b)=>Math.hypot(a.m.x-eu.x,a.m.y-eu.y)-Math.hypot(b.m.x-eu.x,b.m.y-eu.y))[0];
   if(presa){const d=Math.hypot(presa.m.x-eu.x,presa.m.y-eu.y);
    if(d<1.4){rotinas.set(t.id,{saciadoAte:agora+20000});return {p:ponto(eu.x,eu.y),pausa:6000,v:VELOCIDADE.predador};}
    const passo=Math.min(d-.6,5),dx=(presa.m.x-eu.x)/d,dy=(presa.m.y-eu.y)/d;return {p:ponto(eu.x+dx*passo,eu.y+dy*passo),pausa:0,v:VELOCIDADE.caca,caca:true};}
   return {p:ponto(casa.x+(r()-.5)*14,casa.y+(r()-.5)*9),pausa:2500+r()*4000,v:VELOCIDADE.predador};
  }
  if(papel==='neutro')return {p:ponto(casa.x+(r()-.5)*5,casa.y+(r()-.5)*3.5),pausa:4000+r()*6000,v:VELOCIDADE.neutro};
  if(papel==='foge'){ // v205: neutro atacado foge de quem está por perto
   const ameaca=lista.filter(o=>ehJogador(o)).map(o=>({o,m:toM(posAtual(o.id))})).filter(x=>Math.hypot(x.m.x-eu.x,x.m.y-eu.y)<10).sort((a,b)=>Math.hypot(a.m.x-eu.x,a.m.y-eu.y)-Math.hypot(b.m.x-eu.x,b.m.y-eu.y))[0];
   if(ameaca){const dx=eu.x-ameaca.m.x,dy=eu.y-ameaca.m.y,l=Math.hypot(dx,dy)||1;return {p:ponto(eu.x+dx/l*7,eu.y+dy/l*7),pausa:500,v:VELOCIDADE.fuga,fuga:true};}
   return {p:ponto(casa.x+(r()-.5)*5,casa.y+(r()-.5)*3.5),pausa:3000+r()*5000,v:VELOCIDADE.neutro};}
  if(papel==='arrasta')return {p:ponto(eu.x+(r()-.5)*3,eu.y+(r()-.5)*3),pausa:2000+r()*3000,v:VELOCIDADE.arrasta};
  return {p:ponto(casa.x+(r()-.5)*8,casa.y+(r()-.5)*6),pausa:3000+r()*5000,v:VELOCIDADE.vaga};
 }
 // cavaleiro em cima da montaria: NPC/PJ a menos de 1,2 m de uma criatura domesticada
 function montadoEm(cav,mont){
  if(info(mont).papel!=='montaria'||decodeURIComponent(String(cav.id)).startsWith('synccriatura:'))return false;
  const a=toM(posicoes.get(cav.id)||cav),b=toM(posicoes.get(mont.id)||mont);return Math.hypot(a.x-b.x,a.y-b.y)<1.2;
 }
 async function tick(){
  if(win.mesaJogoPausadoV214?.())return;
  const lista0=mapasParaRodar();
  if(!lista0.length){if(ligado)await desligar();return;}
  const agora=Date.now();let mudou=false;const ativos=new Set(),montadosTodos=new Map();
  if(!ligado){ligado=true;legsLocais={};}
  for(const mid of lista0){
   const dm=dimsMapa(mid);ctx={mapId:mid,...dm,objs:objsDoMapa(mid)};const {W,H}=dm;
   const lista=[...posicoes.values()].filter(t=>String(t.mapaId||mapa?.mapId||'')===mid&&!ehJogador(t)&&t.nome!==undefined&&livre(t));
   // pares montados: o cavaleiro segue a montaria
   const montados=new Map();for(const m of lista)if(info(m).papel==='montaria')for(const c of lista)if(c.id!==m.id&&info(c).papel!=='montaria'&&!montados.has(c.id)&&montadoEm(c,m)){montados.set(c.id,m.id);break;}
   const cavaleiroDe=new Map([...montados].map(([c,m])=>[m,c]));for(const [c,m] of montados)montadosTodos.set(c,m);
   for(const t of lista){
    const id=t.id;if(montados.has(id))continue;
    const papelBruto=cavaleiroDe.has(id)?'guarda':(win.mesaExploracaoV200?.papelDe?.(t,info(t).papel)||info(t).papel); // v200: personalidade (exploradora, covarde, construtora)
    const papel=papelComFaccao(papelBruto,facDe(t),ferido(t));if(papel==='parado')continue;
    if(!casas.has(id))casas.set(id,toM(t));
    // mexido à mão pelo mestre? recomeça de onde está
    const g=ultimaGravada.get(id),pt=posicoes.get(id);if(g&&pt&&Math.hypot(Number(pt.x)-g.x,Number(pt.y)-g.y)>.2&&!legsLocais[id]){casas.set(id,toM(pt));ultimaGravada.delete(id);}
    const l=legsLocais[id],p=posicaoNaPerna(l,agora),fila=filas.get(id);
    // v143: dormindo / na toca / fora da banca / recarregando = fica parado (o guarda primeiro vai encostar num muro)
    let parado=false;try{parado=!!win.mesaNoiteV143?.parado?.(id);}catch(_){}
    if(parado){
     const guarda=(()=>{try{return !!win.mesaNoiteV143?.guardaDormindo?.(id);}catch(_){return false;}})();
     if(guarda&&!encostados.has(id)&&!(l&&!p?.fim)&&!fila?.length){encostados.add(id);const de=p||{x:Number(t.x),y:Number(t.y)},alvo=paraMuro(t,de);
      if(alvo){const deM=toM(de),paraM=toM(alvo);let pts=[];try{pts=caminho(gradeAtual(),deM,paraM)||[];}catch(_){}if(!pts.length)pts=[deM];const pts2=[...pts],v=VELOCIDADE.guarda,prim=toN(pts2.shift());filas.set(id,Object.assign(pts2,{v}));
       const d0=Math.hypot((prim.x-de.x)*W/28,(prim.y-de.y)*H/14);legsLocais[id]={a:[de.x,de.y],b:[prim.x,prim.y],t0:agora,d:Math.max(200,d0/v*1000),m:mid};pausas.set(id,agora+864e5);mudou=true;}}
     if(l&&!p?.fim){ativos.add(id);continue;}
     if(fila?.length&&encostados.has(id)){ativos.add(id);const prox=fila.shift(),de=p||{x:Number(t.x),y:Number(t.y)},n=toN(prox),d1=Math.hypot((n.x-de.x)*W/28,(n.y-de.y)*H/14);legsLocais[id]={a:[de.x,de.y],b:[n.x,n.y],t0:agora,d:Math.max(200,d1/Number(fila.v||1.2)*1000),m:mid};mudou=true;continue;}
     if(l)ativos.add(id); // mantém a última perna (posição final) até gravar
     filas.delete(id);continue;
    }
    if(encostados.has(id)){encostados.delete(id);pausas.delete(id);}
    ativos.add(id);
    const trab=trabalhos.get(id); // v144: chegou na rocha/árvore → trabalha (⛏️/🪓)
    if(trab&&l&&p?.fim&&!fila?.length&&!l.acao){legsLocais[id]={...l,acao:trab.acao};mudou=true;}
    if(l&&!p.fim)continue;
    if(fila?.length){const prox=fila.shift(),de=p||{x:Number(t.x),y:Number(t.y)},n=toN(prox),d1=Math.hypot((n.x-de.x)*W/28,(n.y-de.y)*H/14);
     legsLocais[id]={a:[de.x,de.y],b:[n.x,n.y],t0:agora,d:Math.max(200,d1/Number(fila.v||1.2)*1000),m:mid};mudou=true;continue;}
    if((pausas.get(id)||0)>agora)continue;
    if(trab){trabalhos.delete(id);if(legsLocais[id]?.acao){const k=mid+'|'+trab.recurso,g=(golpes.get(k)||0)+1;golpes.set(k,g);if(g>=(trab.golpes||3)){golpes.delete(k);if(trab.recurso){void win.mesaTrabalhoV144?.colher?.(mid,trab.recurso);win.mesaExploracaoV200?.aoColher?.(id,mid,trab.recurso);}}}}
    const dest=destinoPara(t,papel,agora,lista),de=p||{x:Number(t.x),y:Number(t.y)},deM=toM(de);
    {const N=win.mesaNichosV205;if(N&&t.habitatV205){try{const ajus=N.ajustar({t,dest,eu:deM,objs:objsDoCtx(),W,H,toM,toN,ponto:(x,y)=>{const n=toN({x,y});return livrePerto(objsDoCtx(),n.x,n.y,W,H,.5);},papel,agora});if(ajus)Object.assign(dest,ajus);}catch(e){console.warn('[Nichos]',e);}}} // v205: habitat, água e atividades
    diagRegistro.set(id,{papel,acao:dest.acao||'',caca:!!dest.caca,fuga:!!dest.fuga,pausa:Number(dest.pausa)||0,quando:agora});
    const paraM=toM(dest.p);
    // v144: sempre pelo caminho livre (antes pulava pontos e cortava paredes/portas); sem caminho = fica e tenta outro destino
    let pts=[];try{pts=caminho(gradeDe(t),deM,paraM)||[];}catch(_){pts=[];}
    {const longe=a=>!a?.length||Math.hypot(a[a.length-1].x-paraM.x,a[a.length-1].y-paraM.y)>.8;
     if(longe(pts)&&!voa(t)){try{const p2=caminho(gradeFina(),deM,paraM,{maxNos:30000})||[];if(!longe(p2))pts=p2;}catch(_){}}} // v200: porta estreita
    if(!pts?.length){pausas.set(id,agora+1500+Math.random()*2500);continue;}
    const pts2=[...pts];
    const S=win.mesaModoSimplesV200;if(S?.ativo?.()&&(dest.fuga||dest.caca))S.gastar?.(id,10); // v200: correr cansa
    const v=(Number(dest.v)||1.2)*(S?.velocidadeFator?.(id)||1);const primeiro=toN(pts2.shift());filas.set(id,Object.assign(pts2,{v}));
    const d2=Math.hypot((primeiro.x-de.x)*W/28,(primeiro.y-de.y)*H/14);
    legsLocais[id]={a:[de.x,de.y],b:[primeiro.x,primeiro.y],t0:agora,d:Math.max(200,d2/v*1000),m:mid};
    pausas.set(id,agora+Number(dest.pausa||0)+d2/v*1000);mudou=true;if(dest.acao)trabalhos.set(id,{acao:dest.acao,recurso:dest.recurso,golpes:dest.golpes});
   }
   // cavaleiro = mesma perna da montaria, por cima
   for(const [c,m] of montados){const l=legsLocais[m];if(l&&JSON.stringify(legsLocais[c])!==JSON.stringify({...l,cima:true})){legsLocais[c]={...l,cima:true};mudou=true;}}
  }
  ctx=null;
  for(const [id,l] of Object.entries(legsLocais))if(!ativos.has(id)&&!montadosTodos.has(id)){const tt=posicoes.get(id);if(!(tt&&controlado(tt)))await gravarUm(id,l);delete legsLocais[id];filas.delete(id);pausas.delete(id);mudou=true;} // v173: quem o mestre passou a controlar fica onde ele deixou (antes voltava para trás)
  // mapas que deixaram de rodar: para de ouvir a cena arquivada
  for(const [id,f] of pararArq)if(!lista0.includes(id)){try{f();}catch(_){}pararArq.delete(id);cenasArq.delete(id);}
  if(mudou){const shared=String(mapa?.mapId||'');vida={ativo:true,mapId:lista0.includes(shared)?shared:lista0[0],mapas:lista0,legs:legsLocais};agendar();try{await dep.setDoc(D(VIDA),clean({ativo:true,mapId:vida.mapId,mapas:lista0,legs:legsLocais,em:agora}));}catch(e){console.warn('[Vida]',e);}}
  if(agora-ultimoCommit>20000){ultimoCommit=agora;await gravarPosicoes();}
 }
 // v205: DIAGNÓSTICO (só para o mestre): por que cada um está parado ou o que decidiu. Responde "ninguém faz nada?" sem refazer o motor.
 function diagnostico(){
  const agora=Date.now(),out=[];
  for(const t of posicoes.values()){
   if(ehJogador(t)||t.nome===undefined)continue;const id=t.id,st=saude?.actors?.[id]?.combateLab,a=saude?.actors?.[id],papel=info(t).papel;let motivo='';
   if(st?.morto)motivo='morto';else if(st?.inconsciente||st?.incapacitado)motivo='inconsciente';else if(a?.repouso)motivo='em repouso';
   else if(!ehMestre())motivo='sem mestre online (a vida só roda no navegador do mestre)';else if(!deveRodar())motivo='nenhum jogador no mapa e o mestre não está olhando';
   else if(mapa?.combat?.active&&!win.mesaTempoRealV111?.ativo?.())motivo='combate por turnos em andamento';
   else if((()=>{try{return win.mesaTempoRealV111?.ocupado?.(id);}catch(_){return false;}})())motivo='em luta no tempo real';
   else if((()=>{try{return !!win.mesaNoiteV143?.parado?.(id);}catch(_){return false;}})())motivo='dormindo/na toca';
   else if(papel==='parado')motivo='papel parado (sem deslocamento ou séssil)';
   else if(legsLocais[id]&&!posicaoNaPerna(legsLocais[id],agora).fim)motivo='';
   else if((pausas.get(id)||0)>agora)motivo='pausa até '+Math.round(((pausas.get(id)||0)-agora)/1000)+' s';
   const d=diagRegistro.get(id)||{};out.push({id:decodeURIComponent(id),papel,andando:!!(legsLocais[id]&&!posicaoNaPerna(legsLocais[id],agora).fim),motivoInatividade:motivo,ultimaDecisao:d.acao||(d.caca?'caçar':d.fuga?'fugir':d.papel||''),ha:d.quando?Math.round((agora-d.quando)/1000):null,atividade:win.mesaNichosV205?.atividadeDe?.(id)||''});
  }
  return out;
 }
 win.mesaVidaDiagV205=diagnostico;
 // v143: ponto junto ao muro mais perto para o guarda dormir encostado (coordenadas 28×14)
 function paraMuro(t,de){
  const {W,H}=dims(),objs=objsDoCtx(),eu=toM(de);let melhor=null,dm=1e9;
  for(const o of objs){if(!o?.bloqueiaMovimento||o.destruido||!/parede|muro|rocha|paredao|predio/.test(sem(o.nome)))continue;
   const c=toM(o),lw=Number(o.larguraM)||1,lh=Number(o.alturaM)||1,hor=lw>=lh;if(Math.max(lw,lh)<2)continue;
   for(const s of [-1,1]){const px=hor?Math.max(c.x-lw/2+.6,Math.min(c.x+lw/2-.6,eu.x)):c.x+s*(lw/2+.55),py=hor?c.y+s*(lh/2+.55):Math.max(c.y-lh/2+.6,Math.min(c.y+lh/2-.6,eu.y));
    if(px<.5||py<.5||px>W-.5||py>H-.5)continue;const d=Math.hypot(px-eu.x,py-eu.y);if(d<dm&&d<14){dm=d;melhor={x:px,y:py};}}}
  return melhor?toN(melhor):null;
 }
 async function gravarUm(id,l,{congelando=false}={}){
  if(win.mesaJogoPausadoV214?.()&&!congelando)return;
  const p=posicaoNaPerna(l),t=posicoes.get(id);if(!p||!t)return;if(Math.hypot(Number(t.x)-p.x,Number(t.y)-p.y)<.05)return;
  const fac=Math.atan2((l.b[1]-l.a[1]),(l.b[0]-l.a[0]));
  try{const dados={x:Number(p.x.toFixed(3)),y:Number(p.y.toFixed(3)),facing:Number(fac.toFixed(3))};
   if(dep.runTransaction)await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+id),s=await tx.get(r);if(!s.exists())return;tx.set(r,{...s.data(),...dados,revision:Number(s.data().revision||0)+1});});
   else await dep.setDoc(D(POS+'/'+id),{...dados,revision:Number(t.revision||0)+1},{merge:true});
   ultimaGravada.set(id,{x:p.x,y:p.y});}catch(e){console.warn('[Vida] posição',e);}
 }
 async function gravarPosicoes(congelando=false){
  for(const [id,l] of Object.entries(legsLocais)){const tt=posicoes.get(id);if(tt&&controlado(tt))continue;await gravarUm(id,l,{congelando});}
 }
 async function desligar(){
  ligado=false;await gravarPosicoes(true);legsLocais={};filas.clear();pausas.clear();
  try{await dep.setDoc(D(VIDA),{ativo:false,legs:{},mapId:String(mapa?.mapId||''),em:Date.now()});}catch(_){}
 }

 // ------------------------------------------------------------ v137: mapas amplos com vida (uma vez, na conta do mestre)
 async function criarMapasAmplos(){
  const flag=D('configuracoes/mapasAmplosV137');try{if((await dep.getDoc(flag)).exists())return true;}catch(_){return false;}
  const ma=win.mesaMapasV110_,g=await import('./mesa-gerador-mapas.js?v=141').catch(()=>null),el=await import('./mesa-elenco.js?v=155').catch(()=>null),tam=await import('./mesa-tamanhos.js?v=134').catch(()=>null);
  if(!ma?.salvar||!g||!el)return false;const objs=ma.objetos?.()||[];if(objs.length<10)return false;
  const npcs=dep.npcs?.()||[],cris=dep.criaturas?.()||[],posTodas=[...posicoes.values()];
  const ocupado=id=>posTodas.some(t=>decodeURIComponent(String(t.id)).split('~')[0]===id);
  const feitos=[];
  async function criar(id,nome,tipo,estilo,povo){
   if((ma.mapas?.()||[]).some(m=>String(m.id)===id))return;
   try{if((await dep.getDoc(D('mapas/'+id))).exists())return;}catch(_){} // v141: confere no banco (a lista pode estar atrasada)
   let st=g.gerarMapa({tipo,largura:56,altura:28,objetos:objs,nome,estilo,semente:id.length*97});st=el.ampliarEstado(st,1.5);
   const {cenaDoEstado,LIMITE_CENA}=await import('./mesa-mapas-ui.js?v=141');
   await ma.salvar({id,nome,state:st,cenaDe:mid=>{const c=cenaDoEstado(st,mid);return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
   const W=st.w,H=st.h;let k=0;
   for(const p of povo){
    if(p.generico){for(let i=0;i<(p.n||1);i++)try{await win.mesaComerciantes?.novo?.(id,(p.x+i*7)*28/W,(p.y-(i%2)*6)*14/H,{ambulante:i%2===1});k++;}catch(_){}continue;}
    const modelo=p.cri?cris.find(c=>c.id===p.id):npcs.find(n=>n.id===p.id);if(!modelo)continue;
    for(let i=0;i<(p.n||1);i++){
     const base=(p.cri?'synccriatura:':'syncnpc:')+p.id;if(!p.copia&&ocupado(base))break;
     let tid=base;for(let j=1;j<60;j++){const cand=j===1?base:base+'~'+j;if(!posTodas.some(t=>decodeURIComponent(String(t.id))===cand)){tid=cand;break;}}
     const x=p.x!=null?p.x+(i%3)*1.4:(3+Math.random()*(W-6)),y=p.y!=null?p.y+Math.floor(i/3)*1.4:(3+Math.random()*(H-6));
     const doc={nome:String(modelo.nome||p.id)+(tid.includes('~')?' '+tid.split('~')[1]:''),imagem:String(modelo.miniatura?.url||modelo.imagem||''),donoUid:'',x:x*28/W,y:y*14/H,revision:0,facing:0,camada:3,mapaId:id,diametroM:tam?.tamanhoMiniaturaM?.(modelo)||1};
     await dep.setDoc(D(POS+'/'+encodeURIComponent(tid)),clean(doc));posTodas.push({...doc,id:encodeURIComponent(tid)});k++;
     // cavaleiro em cima da montaria
     if(p.cavaleiro){const cav=npcs.find(n=>n.id===p.cavaleiro);if(cav){let cid='syncnpc:'+p.cavaleiro;for(let j=1;j<60;j++){const cand=j===1?cid:cid+'~'+j;if(!posTodas.some(t=>decodeURIComponent(String(t.id))===cand)){cid=cand;break;}}
      const d2={...doc,nome:String(cav.nome)+(cid.includes('~')?' '+cid.split('~')[1]:''),imagem:String(cav.miniatura?.url||cav.imagem||''),diametroM:tam?.tamanhoMiniaturaM?.(cav)||1};await dep.setDoc(D(POS+'/'+encodeURIComponent(cid)),clean(d2));posTodas.push({...d2,id:encodeURIComponent(cid)});k++;}}
    }
   }
   feitos.push(`${nome} (${W}×${H} m, ${k} miniaturas)`);
  }
  try{
   await criar('v137_grande_feira','Grande Feira de Véspera','cidade','retro',[
    {id:'mercante_1',x:20,y:12},{id:'tessan_vey',x:42,y:12},{id:'insetoide_civil_1',x:62,y:12},{id:'contrabandista_1',x:30,y:30},{generico:true,x:52,y:30,n:4},
    {id:'dragao_trombeta_corredor_domesticado',cri:true,x:10,y:20,n:2,copia:true,cavaleiro:'guarda_generico_1'},{id:'guarda_generico_1',x:70,y:34,copia:true},
    {id:'crianca_de_rua_1',x:36,y:20},{id:'mensageiro_generico_1',x:46,y:22,n:2,copia:true},{id:'alien_aviario_1',x:24,y:24},{id:'cambista_1',x:58,y:22},{id:'motorista_generico_1',x:16,y:32},{id:'tecnico_generico_1',x:66,y:24},{id:'robo_utilitario_2',x:40,y:34}]);
   await criar('v137_planicie_trombetideos','Planície dos Trombetídeos','ermos','',[
    {id:'cavalgante_prismatico',cri:true,x:40,y:20,n:4,copia:true},{id:'macacodecalico',cri:true,x:60,y:28,n:3,copia:true},
    {id:'dragao_trombeta_corredor_selvagem',cri:true,x:12,y:10,n:2,copia:true},{id:'predador_couracado',cri:true,x:70,y:8,copia:true},{id:'rastejante_de_cinzas',cri:true,x:20,y:34,n:2,copia:true}]);
  }catch(e){console.warn('[Vida] mapas amplos',e);}
  try{await dep.setDoc(flag,{em:new Date().toISOString(),mapas:feitos});}catch(_){}
  if(feitos.length){const n=root.createElement('div');n.textContent='🗺️ Mapas amplos novos: '+feitos.join(' · ')+'. Abra pelo seletor de mapas.';n.style.cssText='position:fixed;left:16px;bottom:110px;z-index:9999;background:#1d2a44;border:1px solid #8ee7ff;color:#e8eefc;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:520px';root.body.append(n);setTimeout(()=>n.remove(),12000);}
  return true;
 }

 // ------------------------------------------------------------ assinaturas
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(VIDA),s=>{const v=s.exists()?s.data():{legs:{}};if(!ehMestre()){vida={...v,desvio:0};}else if(!ligado)vida=v;agendar();},()=>{}));
  parar.push(dep.onSnapshot(D(MAP),s=>{const antes=mapa?.mapId;mapa=s.exists()?s.data():null;if(antes&&antes!==mapa?.mapId){infoCache.clear();/* v143: os outros mapas com jogadores continuam vivos */}},()=>{}));
  parar.push(dep.onSnapshot(D(SCENE),s=>{cenaSalva=s.exists()?s.data():null;cena=globalThis.mesaRascunhoCenaV197_?.(cenaSalva)||cenaSalva;},()=>{}));globalThis.addEventListener('mesa-rascunho-v197',()=>{cena=globalThis.mesaRascunhoCenaV197_?.(cenaSalva)||cenaSalva;});
  parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(dep.collection(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes'),q=>{const n=new Map();q.forEach(d=>n.set(d.id,{...d.data(),id:d.id}));posicoes=n;agendar();
   // v138: restos de tokens apagados (só x/y, sem nome, imagem nem mapa) apareciam em TODOS os mapas: o mestre limpa
   if(ehMestre()&&dep.deleteDoc)for(const [id,t] of n)if(tokenFantasma(t)&&!limpando.has(id)){limpando.add(id);void dep.deleteDoc(D(POS+'/'+id)).catch(()=>{}).finally(()=>limpando.delete(id));}
   // v140: miniatura com nome "undefined"/vazio ganha o nome do banco
   if(ehMestre())for(const [id,t] of n){const nm=String(t.nome??'');if(nm&&nm!=='undefined'&&nm!=='null')continue;if(limpando.has(id)||tokenFantasma(t))continue;
    const raw=decodeURIComponent(id),base=raw.split(':').slice(1).join(':').split('~')[0],k=raw.includes('~')?' '+raw.split('~')[1]:'';
    const m=raw.startsWith('syncnpc:')?(dep.npcs?.()||[]).find(x=>String(x.id)===base):raw.startsWith('synccriatura:')?(dep.criaturas?.()||[]).find(x=>String(x.id)===base):null;
    const novo=m?String(m.nome||base)+k:(raw.startsWith('sync')?base+k:'Personagem');limpando.add(id);
    void dep.runTransaction?.(dep.db,async tx=>{const r=D(POS+'/'+id),s=await tx.get(r);if(!s.exists())return;tx.set(r,{...s.data(),nome:novo,revision:Number(s.data().revision||0)+1});}).catch(()=>{}).finally(()=>limpando.delete(id));}
  },()=>{}));
 }
 const limpando=new Set();let tentAmplos=0,assinado='',voltas=0,rodando=false,amplosFeitos=false;
 const vigia=setInterval(()=>{
  try{const k=String(dep.uid?.()||'')+'|'+ehMestre();if(!dep.uid?.())return;if(k!==assinado){assinado=k;assinar();}
   agendar();
   if(ehMestre()&&!rodando&&++voltas%3===0){rodando=true;void tick().catch(e=>console.warn('[Vida]',e)).finally(()=>{rodando=false;});}
   if(ehMestre()&&!amplosFeitos&&voltas===30){amplosFeitos=true;void criarMapasAmplos().then(ok=>{if(!ok&&++tentAmplos<2){amplosFeitos=false;voltas=0;}}).catch(()=>{});} // v141: no máximo 2 tentativas
  }catch(e){console.warn('[Vida]',e);}
 },500);
 win.mesaVida={estado:()=>({ligado,legs:legsLocais}),parar:()=>desligar()};
 return {parar:()=>{clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});},tick,desligar,criarMapasAmplos};
}
