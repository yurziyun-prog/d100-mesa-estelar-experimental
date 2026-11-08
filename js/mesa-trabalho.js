// Mesa Estelar v144 — Gente trabalhando: mineradores nas minas e lenhadores nas florestas.
//
// • Na primeira vez que um jogador (ou o mestre) aparece num mapa de mina/pedreira/caverna, entram 2–3 “Minerador N”;
//   num mapa de floresta/bosque/mata, 1–2 “Lenhador N”. Modelos no banco de NPCs (trabalhador_minerador / _lenhador).
// • Eles andam até uma rocha/árvore, trabalham um tempo (⛏️/🪓 em cima da miniatura) e, depois de umas voltas,
//   a pedra ou a árvore “sai” (fica um toco/cascalho apagado, sem barrar ninguém). Ela volta depois de 3 dias de jogo
//   (ou 2 dias reais com o relógio desligado).
// • Só trabalham quando a vida do mapa está rodando (jogador ou mestre olhando) e não estão dormindo (mesa-noite).
// Módulo à parte: se falhar, nada muda.

import {gerarNpc} from './mesa-diretor-dados.js?v=108';
import {renderizarMiniatura,specDeNpc,MARCA_MINI} from './mesa-miniaturas.js?v=194';
import {livrePerto} from './mesa-ligacoes.js?v=154';

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena';
const arquivo=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
export const DIA_JOGO=86400000,VOLTA_JOGO=3*DIA_JOGO,VOLTA_REAL=2*86400000;
export const OFICIOS={
 minerador:{nome:'Minerador',carreira:'Minerador',acao:'⛏️',recurso:/\b(rocha|rochedo|pedra|pedregulho|minerio|veio|cristal|jazida|filao)\b/,mapa:/\b(mina|minas|minera|pedreira|garimp|jazida|caverna|gruta|escavac)/,qtd:[2,3]},
 lenhador:{nome:'Lenhador',carreira:'Lenhador',acao:'🪓',recurso:/\b(arvore|arvores|palmeira|pinheiro|tronco|carvalho|cedro|sequoia)\b/,mapa:/\b(floresta|bosque|mata|selva|arvoredo)\b/,qtd:[1,2]}
};
export const idModelo=o=>'trabalhador_'+o;
export function oficioDoMapa(m={}){
 const t=sem([m.nome,m.descricao,m.geradoV110?.tipo,m.remodeladoV139?.tipo].join(' '));
 if(OFICIOS.minerador.mapa.test(t)||m.geradoV110?.tipo==='caverna')return 'minerador';
 if(OFICIOS.lenhador.mapa.test(t)||m.geradoV110?.tipo==='floresta')return 'lenhador';
 return '';
}
export const oficioDoTexto=t=>/\b(minerador|mineiro|garimpeiro)\b/.test(sem(t))?'minerador':/\blenhador\b/.test(sem(t))?'lenhador':'';
// Recurso que dá para trabalhar: rocha/árvore solta (não paredão de borda), ainda não colhida.
export function ehRecurso(o,oficio){
 if(!o||o.destruido||o.colhidoV144||!OFICIOS[oficio])return false;
 if(Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)>6)return false; // paredão/borda do mapa não
 return OFICIOS[oficio].recurso.test(sem(o.nome));
}
export function deveVoltar(o,agoraJogo,agoraReal,relogioLigado){
 const c=o?.colhidoV144;if(!c)return false;
 return relogioLigado?Number(agoraJogo)>=Number(c.ate||0):Number(agoraReal)>=Number(c.ateReal||0);
}

export function instalarTrabalho(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 if(!root.getElementById('tbCssV144')){const st=root.createElement('style');st.id='tbCssV144';
  st.textContent='#novaSyncBoard [data-acao-v144]::after{content:attr(data-acao-v144);position:absolute;right:-12px;top:-14px;font-size:15px;pointer-events:none;filter:drop-shadow(0 1px 2px #000);animation:tbBate .9s ease-in-out infinite;transform-origin:20% 80%}@keyframes tbBate{0%,100%{transform:rotate(-25deg)}50%{transform:rotate(25deg)}}';root.head.append(st);}
 const relogio=()=>{try{const r=win.mesaRelogio;return {ligado:!!r?.ativo?.(),agora:Number(r?.agora?.())||0};}catch(_){return {ligado:false,agora:0};}};
 let criando=null,ocupado=false;const feitos=new Set();

 async function garantirModelos(){
  if(criando)return criando;
  criando=(async()=>{const npcs=dep.npcs?.()||[];
   for(const [k,o] of Object.entries(OFICIOS)){
    const id=idModelo(k);if(npcs.some(n=>String(n.id)===id))continue;
    const bruto={...gerarNpc({especie:'humano',papel:'civil',rnd:(s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296))(k==='minerador'?1441:1442)}),id,nome:o.nome,carreira:o.carreira,conceito:`${o.carreira} de Véspera`,
     descricao:`${o.carreira} que trabalha ${k==='minerador'?'nas minas, quebrando rocha atrás de minério':'nas matas, cortando árvores'}. Gente simples; o nome só aparece para quem conversa com ele.`};
    let modelo=bruto;try{modelo=dep.normalizar?dep.normalizar('npcs',bruto):bruto;}catch(_){}
    Object.assign(modelo,{id,nome:o.nome,carreira:o.carreira,trabalhadorV144:k});
    try{const sp=specDeNpc(modelo),blob=new Blob([renderizarMiniatura(sp)],{type:'image/svg+xml'});
     const snap=await dep.uploadBytes(dep.ref(dep.storage,`personagens/${uid()}/miniaturas/npcs-${id}.svg`),blob,{contentType:'image/svg+xml',cacheControl:'public,max-age=31536000'});
     modelo.miniatura={url:(await dep.getDownloadURL(snap.ref))+MARCA_MINI,spec:sp,tipo:'montada',atualizadoEm:new Date().toISOString()};}catch(e){console.warn('[Trabalho] miniatura',k,e);}
    await dep.setDoc(D('npcs/'+id),clean(modelo));try{npcs.push(modelo);}catch(_){}
   }})();
  try{return await criando;}finally{criando=null;}
 }
 async function cenaDe(id){
  try{const a=await dep.getDoc(D(SCENE));if(a.exists()&&String(a.data()?.mapId||'')===String(id))return {caminho:SCENE,cena:a.data(),ativa:true};}catch(_){}
  try{const s=await dep.getDoc(D(arquivo(id)));if(s.exists())return {caminho:arquivo(id),cena:s.data(),ativa:false};}catch(_){}
  return null;
 }
 // põe os trabalhadores num mapa (uma vez por mapa)
 async function povoar(m){
  const id=String(m.id),of=oficioDoMapa(m);if(!of||m.trabalhoV144||feitos.has(id))return;feitos.add(id);
  try{
   await dep.setDoc(D('mapas/'+id),{trabalhoV144:{em:new Date().toISOString(),oficio:of}},{merge:true});m.trabalhoV144=true;
   await garantirModelos();const modelo=(dep.npcs?.()||[]).find(n=>String(n.id)===idModelo(of));
   const c=await cenaDe(id),objs=c?.cena?.objects||[],W=Number(m.larguraM)||28,H=Number(m.alturaM)||14,rec=objs.filter(o=>ehRecurso(o,of));
   const [a,b]=OFICIOS[of].qtd,n=a+Math.floor(Math.random()*(b-a+1)),todos=ctl()?.todosTokens?.()||[];
   let k=todos.filter(t=>decodeURIComponent(String(t.id)).startsWith('syncnpc:'+idModelo(of))).length;const ocup=[...objs];
   for(let i=0;i<n;i++){k++;const alvo=rec.length?rec[(i*7)%rec.length]:{x:4+Math.random()*20,y:3+Math.random()*8};
    const p=livrePerto(ocup,Number(alvo.x)+1.2*28/W,Number(alvo.y),W,H,.55);ocup.push({x:p.x,y:p.y,larguraM:1,alturaM:1,bloqueiaMovimento:true});
    await dep.setDoc(D(POS+'/'+encodeURIComponent('syncnpc:'+idModelo(of)+'~'+k)),clean({nome:OFICIOS[of].nome+' '+k,imagem:String(modelo?.miniatura?.url||modelo?.imagem||''),donoUid:'',x:+p.x.toFixed(3),y:+p.y.toFixed(3),revision:0,facing:Math.PI/2,camada:3,mapaId:id,diametroM:1}));}
   console.info('[Trabalho]',m.nome||id,'+',n,OFICIOS[of].nome);
  }catch(e){console.warn('[Trabalho] povoar',id,e);}
 }
 // a pedra/árvore sai (vira toco/cascalho apagado) e volta depois
 async function colher(mapId,objId){
  if(!ehMestre())return;const {ligado,agora}=relogio();
  try{const c=await cenaDe(mapId);if(!c)return;
   await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(c.caminho)),cena=s.exists()?s.data():null;if(!cena)return;const objs=[...(cena.objects||[])],i=objs.findIndex(o=>String(o.id)===String(objId));if(i<0||objs[i].colhidoV144)return;
    const o=objs[i];objs[i]={...o,opacity:.22,bloqueiaMovimento:false,colhidoV144:{ate:(ligado?agora:0)+VOLTA_JOGO,ateReal:Date.now()+VOLTA_REAL,opacity:o.opacity??1,bloq:!!o.bloqueiaMovimento}};
    tx.set(D(c.caminho),clean({...cena,objects:objs}));if(c.ativa)tx.set(D(arquivo(mapId)),clean({...cena,objects:objs}));});
  }catch(e){console.warn('[Trabalho] colher',e);}
 }
 async function rebrotar(){
  const {ligado,agora}=relogio(),agoraReal=Date.now();
  for(const m of dep.mapas?.()||[]){if(!m?.trabalhoV144)continue;const id=String(m.id);
   try{const c=await cenaDe(id);if(!c||!(c.cena.objects||[]).some(o=>deveVoltar(o,agora,agoraReal,ligado)))continue;
    await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(c.caminho)),cena=s.exists()?s.data():null;if(!cena)return;
     const objs=(cena.objects||[]).map(o=>{if(!deveVoltar(o,agora,agoraReal,ligado))return o;const {colhidoV144:k,...resto}=o;return {...resto,opacity:k.opacity??1,bloqueiaMovimento:!!k.bloq};});
     tx.set(D(c.caminho),clean({...cena,objects:objs}));if(c.ativa)tx.set(D(arquivo(id)),clean({...cena,objects:objs}));});
   }catch(e){console.warn('[Trabalho] rebrotar',id,e);}
  }
 }
 async function passo(){
  if(!ehMestre()||ocupado)return;ocupado=true;
  try{
   const mapas=dep.mapas?.()||[],olhando=String(root.getElementById('novaSyncBoard')?.dataset.mapaVisivel||''),ids=new Set(olhando?[olhando]:[]);
   for(const t of ctl()?.todosTokens?.()||[])if(t.donoUid&&t.mapaId)ids.add(String(t.mapaId));
   for(const id of ids){const m=mapas.find(x=>String(x.id)===id);if(m&&!m.trabalhoV144&&oficioDoMapa(m))await povoar(m);}
  }catch(e){console.warn('[Trabalho]',e);}finally{ocupado=false;}
 }
 win.mesaTrabalhoV144={colher,rebrotar,povoar,oficioDoTexto,ehRecurso,ACAO:k=>OFICIOS[k]?.acao||''};
 let voltas=0;
 const vigia=setInterval(()=>{if(!uid()||!ehMestre())return;void passo();if(++voltas%30===1)void rebrotar();},10000);
 return {parar(){clearInterval(vigia);},povoar,colher,rebrotar};
}
