// Mesa Estelar v132 — Elenco dos mapas e reforma da "A Última Bateria".
//
// 1) Elenco automático: quando o mestre abre um mapa, entram sozinhos os NPCs/PMs/criaturas vinculados ao cenário
//    desse mapa (personagens vinculados e nomes escritos em "NPCs da cena"), em lugares livres — a não ser que
//    a miniatura já esteja em outro mapa (ou já esteja neste). NPC com nome tem UMA miniatura no jogo inteiro.
// 2) Reforma (uma vez só): o mapa bar1_2 "A Última Bateria" vira uma taverna retrofuturista administrada pelo robô
//    UR-17, com quartos-cápsula de aluguel. O mapa antigo fica guardado em combatesAtivos/backupMapa_bar1_2_v132.
// Só o mestre. Módulo à parte: se falhar, o mapa segue igual.

import {gerarTaverna} from './mesa-gerador-mapas.js?v=141';
import {cenaDoEstado,LIMITE_CENA,limites} from './mesa-mapas-ui.js?v=141';
import {prepararPublicacaoOficina} from './nova-oficina.js?v=201';
import {livrePerto} from './mesa-ligacoes.js?v=154';
import {NOTA_IMG,novoUid} from './mesa-objetos.js?v=155';
import {itensProvaveis,textoDoBilhete,TITULOS_BILHETE} from './mesa-recheio.js?v=155';
import {sugerirEstilo} from './mesa-gerador-mapas.js?v=141';

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const clean=v=>JSON.parse(JSON.stringify(v??null));
const MAP='combatesAtivos/mapaMesaSyncDireta',SCENE='combatesAtivos/mapaMesaSyncDiretaCena';
export const MAPA_TAVERNA='bar1_2';

// Id "base" de uma miniatura (sem codificação e sem o sufixo de cópia ~k).
export const baseToken=id=>{let s=String(id||'');try{s=decodeURIComponent(s);}catch(_){}return s.split('~')[0];};

// Quem o cenário traz para o mapa. Retorna [{id,nome}] com ids de miniatura (syncnpc:X, synccriatura:X, id do PM).
export function elencoDoCenario(c,{npcs=[],criaturas=[],personagens=[],mestreUid=''}={}){
 if(!c)return [];
 // v139: a categoria PM acabou (todos são NPCs do banco); fichas do mestre não entram mais sozinhas no mapa.
 const pms=[];
 const out=new Map(),nomes=new Set();
 const add=(id,nome)=>{const k=sem(nome);if(!id||out.has(id)||(k&&nomes.has(k)))return;out.set(id,{id,nome:String(nome||id)});if(k)nomes.add(k);};
 // PMs primeiro (a ficha avançada vale mais que o NPC do banco com o mesmo nome)
 const vinc=(Array.isArray(c.personagensCena)?c.personagensCena.map(x=>String(x?.id||x||'')):String(c.personagensCenaIds||'').split('|')).map(x=>x.trim()).filter(Boolean);
 for(const id of vinc){const pm=pms.find(p=>String(p.id)===id);if(pm)add(String(pm.id),pm.nome);}
 const texto=sem(c.npcsCena);
 if(texto)for(const pm of pms){const k=sem(pm.nome);if(k&&k.length>2&&(' '+texto+' ').includes(' '+k+' '))add(String(pm.id),pm.nome);}
 for(const id of vinc){
  const m=/^npcdb:(.+)$/.exec(id);if(m){const n=npcs.find(x=>String(x.id)===m[1]);if(n)add('syncnpc:'+n.id,n.nome);continue;}
  const k=/^(?:criaturadb|criatura|synccriatura):(.+)$/.exec(id);if(k){const n=criaturas.find(x=>String(x.id)===k[1]);if(n)add('synccriatura:'+n.id,n.nome);}
 }
 if(texto){
  for(const n of npcs){const k=sem(n.nome);if(k&&k.length>2&&(' '+texto+' ').includes(' '+k+' '))add('syncnpc:'+n.id,n.nome);}
  for(const n of criaturas){const k=sem(n.nome);if(k&&k.length>3&&(' '+texto+' ').includes(' '+k+' '))add('synccriatura:'+n.id,n.nome);}
 }
 return [...out.values()];
}
// Quem ainda falta entrar: ninguém que já tenha miniatura em QUALQUER mapa.
export function quemFalta(elenco,tokens){
 const ja=new Set((tokens||[]).map(t=>baseToken(t?.id)));
 return elenco.filter(e=>!ja.has(baseToken(e.id)));
}
// Ponto de partida: perto de um objeto que leva o nome do NPC (ex.: "Caixa registradora de UR-17"), senão espalhado.
export function pontoPara(e,objetos,i){
 const k=sem(e.nome);const o=k?(objetos||[]).find(x=>sem(x?.nome).includes(k)):null;
 if(o)return {x:Number(o.x),y:Number(o.y)+1.2};
 const cols=[7,14,21,10,18,4,24,12];return {x:cols[i%cols.length],y:5+(Math.floor(i/cols.length)%3)*3+((i*7)%3)*.6};
}

// Arrumação da cena da taverna: portas das cápsulas fechadas (algumas trancadas), armário com itens e o livro-caixa.
export function arrumarCenaTaverna(cena,itens=[]){
 const lista=itensProvaveis(itens,1320).slice(0,3);
 const objects=(cena.objects||[]).map(o=>{
  const n=String(o.nome||o.name||'');
  let m=/Porta da cápsula (\d+)|Porta do dormitório [AB]/.exec(n);
  if(m){const k=Number(m[1]);return {...o,bloqueiaMovimento:true,bloqueiaVisao:true,camada:3,estadoInterativo:{...(o.estadoInterativo||{}),aberto:false,trancado:true,dificuldade:'dificil',orig:{bloq:true,camada:3,visao:true}}};}
  if(/Porta do corredor das cápsulas/.test(n))return {...o,bloqueiaMovimento:true,bloqueiaVisao:true,camada:3,estadoInterativo:{aberto:false,trancado:false,dificuldade:'facil',orig:{bloq:true,camada:3,visao:true}}};
  if(/Armário de suprimentos/.test(n)){
   const dentro=lista.map(it=>({uid:novoUid(),tipo:'item',idBanco:String(it.id),nome:String(it.nome||it.id),imagem:String(it.imagem||'')}));
   dentro.push({uid:novoUid(),tipo:'nota',nome:'Livro-caixa de UR-17',texto:'[REGISTRO UR-17] Cápsulas 2, 4 e 6: ocupadas — pagamento adiantado. Cápsula 5: hóspede sumiu sem pagar, pertences retidos. Lembrete: recalibrar o resfriador da Última Bateria antes do próximo turno.'});
   return {...o,estadoInterativo:{...(o.estadoInterativo||{}),itens:dentro,trancado:true,dificuldade:'padrao'}};
  }
  return o;
 });
 objects.push({id:'chao_'+novoUid(),nome:'📜 Tabela de preços',x:9,y:4.9,larguraM:.45,alturaM:.45,angulo:-8,camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,imagem:NOTA_IMG,
  itemSolto:{uid:novoUid(),tipo:'nota',nome:'Tabela de preços',texto:'A ÚLTIMA BATERIA — atendimento UR-17. Dose de combustível: 3 cr · Recarga de célula: 5 cr · Cápsula (1 ciclo): 20 cr · Cápsula com chuveiro sônico: 28 cr · Leito de beliche no dormitório coletivo (A ou B): 8 cr. Banheiro no salão. Brigas = multa + expulsão.'}});
 return {...cena,objects};
}

// ---------------------------------------------------------------- v134: mapas panorâmicos
// Amplia o lugar k vezes: o chão, as paredes, ruas e formas crescem junto; os móveis e objetos mantêm o
// tamanho real e só se afastam. Resultado: mais espaço, e as miniaturas ficam menores na tela.
export function ampliarEstado(state,k){
 const st=JSON.parse(JSON.stringify(state||{})),W=Number(st.w)||28,H=Number(st.h)||14;
 st.w=Math.round(W*k);st.h=Math.round(H*k);const kx=st.w/W,ky=st.h/H;
 if(Number(st.ppm)>0&&st.w>60)st.ppm=Math.max(20,Math.round(st.ppm*60/st.w));
 for(const e of st.elements||[]){
  if(e.type==='object'||e.type==='image'&&e.modeloId){const w=Number(e.w)||1,h=Number(e.h)||1,cx=(Number(e.x)+w/2)*kx,cy=(Number(e.y)+h/2)*ky;e.x=+(cx-w/2).toFixed(2);e.y=+(cy-h/2).toFixed(2);continue;}
  for(const [c,f] of [['x',kx],['y',ky],['w',kx],['h',ky]])if(Number.isFinite(Number(e[c])))e[c]=+(Number(e[c])*f).toFixed(2);
  if(Array.isArray(e.points))e.points=e.points.map(p=>Array.isArray(p)?[p[0]*kx,p[1]*ky]:{...p,x:Number(p.x)*kx,y:Number(p.y)*ky});
  if(Number(e.strokeWidthM)>0){e.strokeWidthM=+(e.strokeWidthM*k).toFixed(2);if(Number(e.strokeWidth)>0)e.strokeWidth=Math.round(e.strokeWidth*k);}
  if(Number(e.radius)>0&&e.type==='shape')e.radius=+(e.radius*k).toFixed(2);
 }
 st.panoramicoV134=(Number(state?.panoramicoV134)||1)*k;
 return st;
}
// Mapas a céu aberto e lugares amplos (sugestão para o 🔭).
export const AMPLO=/sete rodas|patio|praca|feira|mercado|porto|doca|estrada|caravana|mar de pedras|portao|serra|bosque|floresta|deserto|campo|ruas?\b|avenida|terraco|tribunal aberto|ferro.?velho|estacionamento|hangar|arena|ringue|competic/;

// ---------------------------------------------------------------- v134: aluguel de cápsulas com o UR-17
const svgChave=cor=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="6" y="11" width="28" height="18" rx="4" fill="#1d2a3a" stroke="${cor}" stroke-width="2"/><rect x="10" y="15" width="9" height="10" rx="2" fill="${cor}" opacity=".85"/><path d="M23 17h8M23 21h6M23 25h7" stroke="#e8f6ff" stroke-width="1.6" stroke-linecap="round"/><circle cx="14.5" cy="20" r="2" fill="#1d2a3a"/></svg>`);
export function itensDoAluguel(){
 const chaves=[1,2,3,4,5,6,7,8].map(n=>({id:'chave_capsula_'+n,nome:'Chave da cápsula '+n,nome_en:'Capsule '+n+' key card',categoria:'Chave',peso:0,preco:n%2===0?28:20,pa:0,pv:1,
  qualidade:'Básica',disponivelCampanha:false,material:'Plástico',imagem:svgChave(n%2===0?'#ffb347':'#3fd0ff'),abre:'Porta da cápsula '+n,
  descricao:`Cartão-chave da Última Bateria. Aluguel da cápsula ${n} por um ciclo${n%2===0?' (com chuveiro sônico)':''}. Abre a porta da cápsula ${n}.`}));
 // v145: dormitórios coletivos (mais baratos): a mesma chave serve para todos os hóspedes daquele dormitório
 for(const L of ['A','B'])chaves.push({id:'chave_dormitorio_'+L.toLowerCase(),nome:'Chave do dormitório '+L,nome_en:'Dorm '+L+' key card',categoria:'Chave',peso:0,preco:8,pa:0,pv:1,qualidade:'Básica',disponivelCampanha:false,material:'Plástico',imagem:svgChave('#9be37a'),abre:'Porta do dormitório '+L,
  descricao:`Cartão-chave da Última Bateria. Um leito de beliche no dormitório coletivo ${L} por um ciclo (cabe até 6 hóspedes). Abre a porta do dormitório ${L}.`});
 return [...chaves,{id:'dose_combustivel',nome:'Dose de combustível',categoria:'Bebida',peso:.2,preco:3,pa:0,pv:1,qualidade:'Básica',disponivelCampanha:false,material:'Vidro',descricao:'A bebida da casa na Última Bateria: forte, oleosa e com gosto de ozônio.'}];
}
export {chaveServe} from './mesa-objetos.js?v=155';

export function instalarElenco(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const toast=t=>{try{win.mesaToast?.(t);}catch(_){}console.info('[Elenco]',t);let n=root.getElementById('elToast');if(!n){n=root.createElement('div');n.id='elToast';n.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:10050;background:rgba(9,15,29,.94);color:#dfe9f8;border:1px solid #3b5878;border-radius:10px;padding:8px 14px;font:13px Segoe UI,Arial,sans-serif;max-width:min(560px,92vw);box-shadow:0 8px 24px rgba(0,0,0,.45);pointer-events:none';root.body.append(n);}n.textContent=t;n.style.opacity='1';clearTimeout(n._t);n._t=setTimeout(()=>{n.style.opacity='0';},5200);};
 const feitos=new Set();let parar=null,ultimoMapa='',reformando=false,reformado=false;

 // ------------------------------------------------------------ elenco automático
 async function carregarElenco(mapId){
  if(!ehMestre()||!mapId||feitos.has(mapId))return;
  const c=ctl();if(!c?.place||!c.todosTokens)return;
  const cen=(dep.cenarios?.()||[]).find(x=>String(x.mapaId||'')===mapId);if(!cen){feitos.add(mapId);return;}
  const elenco=elencoDoCenario(cen,{npcs:dep.npcs?.()||[],criaturas:dep.criaturas?.()||[],personagens:dep.personagens?.()||[],mestreUid:String(dep.uid?.()||'')});
  feitos.add(mapId);
  const falta=quemFalta(elenco,c.todosTokens());if(!falta.length)return;
  const mapa=(dep.mapas?.()||[]).find(m=>String(m.id)===mapId)||{},W=Number(mapa.larguraM)||28,H=Number(mapa.alturaM)||14;
  let cena=null;try{const s=await dep.getDoc(D(SCENE));cena=s.exists()&&String(s.data()?.mapId||'')===mapId?s.data():null;}catch(_){}
  const ocupados=[...(cena?.objects||[])],entrou=[];
  for(const [i,e] of falta.entries()){
   if(String(c.mapaAtual?.()||'')!==mapId)break; // o mestre já trocou de mapa
   const p0=pontoPara(e,cena?.objects,i),p=livrePerto(ocupados,p0.x,p0.y,W,H,.6);
   try{await c.place(e.id,{x:Number(p.x.toFixed(3)),y:Number(p.y.toFixed(3))});ocupados.push({x:p.x,y:p.y,larguraM:1,alturaM:1,bloqueiaMovimento:true});entrou.push(e.nome);}
   catch(err){console.warn('[Elenco]',e.id,err);}
  }
  if(entrou.length)toast(`🎭 Entraram no mapa (vinculados ao cenário): ${entrou.join(', ')}.`);
 }

 // ------------------------------------------------------------ reforma da Última Bateria
 async function reformar(){
  if(reformado||reformando||!ehMestre())return;
  const api=win.mesaMapasV110_,mapa=(dep.mapas?.()||[]).find(m=>String(m.id)===MAPA_TAVERNA),objs=dep.objetos?.()||[];
  if(!api?.salvar||!mapa||mapa.__carregando)return;
  if(mapa.remodeladoV132){reformado=true;return;}
  if(!objs.some(o=>String(o.id)==='pk_retro_mesa')||!objs.some(o=>String(o.id)==='pk_fut_capsula'))return; // o pacote de móveis ainda está entrando
  reformando=true;
  try{
   const arq='combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(MAPA_TAVERNA);
   // cópia de segurança do mapa antigo
   try{const m=await dep.getDoc(D('mapas/'+MAPA_TAVERNA));if(m.exists())await dep.setDoc(D('combatesAtivos/backupMapa_bar1_2_v132'),clean({em:new Date().toISOString(),mapa:m.data()}));}catch(e){console.warn('[Elenco] backup do mapa',e);}
   try{const s=await dep.getDoc(D(arq));if(s.exists())await dep.setDoc(D('combatesAtivos/backupCena_bar1_2_v132'),clean({em:new Date().toISOString(),cena:s.data()}));}catch(e){console.warn('[Elenco] backup da cena',e);}
   const nome=mapa.nome||'A Última Bateria',state=gerarTaverna({objetos:objs,nome,largura:28,altura:14});
   await api.salvar({id:MAPA_TAVERNA,nome,state,cenaDe:id=>{const c=arrumarCenaTaverna(cenaDoEstado(state,id),dep.itens?.()||[]);return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
   await dep.setDoc(D('mapas/'+MAPA_TAVERNA),{remodeladoV132:{em:new Date().toISOString(),backup:'combatesAtivos/backupMapa_bar1_2_v132'}},{merge:true});
   try{mapa.remodeladoV132=true;const novo=(dep.mapas?.()||[]).find(m=>String(m.id)===MAPA_TAVERNA);if(novo)novo.remodeladoV132=true;}catch(_){}
   reformado=true;
   toast('🍸 “A Última Bateria” foi reformada: taverna retrofuturista do robô UR-17 com 6 quartos-cápsula. O mapa antigo ficou guardado como cópia de segurança.');
   if(String(ctl()?.mapaAtual?.()||'')===MAPA_TAVERNA)try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Elenco] reforma da Última Bateria',e);}
  finally{reformando=false;}
 }

 // ------------------------------------------------------------ v134: bilhetes sem informação do mestre
 async function corrigirBilhetes(){
  const flag=D('configuracoes/bilhetesV134');try{if((await dep.getDoc(flag)).exists())return true;}catch(_){return false;}
  const mapas=(dep.mapas?.()||[]).filter(m=>m.recheadoV129);let n=0;
  for(const m of mapas){
   const id=String(m.id),c=(dep.cenarios?.()||[]).find(x=>String(x.mapaId||'')===id)||{nome:m.nome},estilo=sugerirEstilo((c.nome||'')+' '+(c.local||''))||'futurista';
   const trocar=(cena)=>{let mudou=false;const objects=(cena.objects||[]).map((o,i)=>{
     const e=o.estadoInterativo;let novo=o;
     if(Array.isArray(e?.itens)&&e.itens.some(x=>x?.tipo==='nota'&&TITULOS_BILHETE.includes(x.nome))){mudou=true;novo={...o,estadoInterativo:{...e,itens:e.itens.map((x,j)=>x?.tipo==='nota'&&TITULOS_BILHETE.includes(x.nome)?{...x,texto:textoDoBilhete(c,estilo,i*7+j).texto}:x)}};}
     const so=o.itemSolto;if(so?.tipo==='nota'&&TITULOS_BILHETE.includes(so.nome)){mudou=true;novo={...novo,itemSolto:{...so,texto:textoDoBilhete(c,'geral',i*13).texto}};}
     return novo;});return mudou?{...cena,objects}:null;};
   for(const p of ['combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id),SCENE]){
    try{const s=await dep.getDoc(D(p));if(!s.exists())continue;const cena=s.data();if(p===SCENE&&String(cena.mapId||'')!==id)continue;const nova=trocar(cena);if(nova){await dep.setDoc(D(p),clean(nova));n++;}}catch(e){console.warn('[Elenco] bilhetes',id,e);}
   }
  }
  try{await dep.setDoc(flag,{em:new Date().toISOString(),cenas:n});}catch(_){}
  if(n)toast(`📜 Bilhetes reescritos em ${n} cena(s): agora são recados do mundo do jogo, sem informação do mestre.`);
  return true;
 }
 // ------------------------------------------------------------ v134: aluguel de cápsulas com o UR-17
 async function prepararAluguel(){
  const npcs=dep.npcs?.()||[],ur=npcs.find(n=>String(n.id)==='ur17'||/^ur-?17\b/i.test(String(n.nome||'')));if(!ur)return true;
  const itens=dep.itens?.()||[],novos=itensDoAluguel(),ids=novos.map(i=>i.id);
  if(ur.aluguelV134&&ids.every(id=>itens.some(i=>String(i.id)===id)))return true;
  for(const it of novos){if(itens.some(i=>String(i.id)===it.id))continue;await dep.setDoc(D('itens/'+it.id),clean(it),{merge:true});try{itens.push({...it});}catch(_){}}
  const estoque=[...new Set([...String(ur.estoqueComercio||'').split(/[|;,\n]+/).map(x=>x.trim()).filter(Boolean),...ids])].join('|');
  const patch={comerciante:true,comercioNome:'Balcão da Última Bateria',estoqueComercio:estoque,comercioCompraJogador:false,comercioBarganha:true,comercioCompraPct:100,aluguelV134:true};
  await dep.setDoc(D('npcs/'+ur.id),patch,{merge:true});Object.assign(ur,patch);
  // portas das cápsulas trancadas: quem aluga recebe a chave
  for(const p of ['combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(MAPA_TAVERNA),SCENE]){
   try{const s=await dep.getDoc(D(p));if(!s.exists())continue;const cena=s.data();if(p===SCENE&&String(cena.mapId||'')!==MAPA_TAVERNA)continue;let mudou=false;
    const objects=(cena.objects||[]).map(o=>{if(!/Porta da cápsula \d|Porta do dormitório [AB]/.test(String(o.nome||''))||o.estadoInterativo?.aberto||o.estadoInterativo?.trancado)return o;mudou=true;return {...o,estadoInterativo:{...(o.estadoInterativo||{}),trancado:true,aberto:false,dificuldade:o.estadoInterativo?.dificuldade||'dificil'}};});
    if(mudou)await dep.setDoc(D(p),clean({...cena,objects}));}catch(e){console.warn('[Elenco] portas',e);}
  }
  try{await dep.republicar?.();}catch(_){}
  toast('🔑 UR-17 agora aluga as cápsulas: clique nele no mapa (🛒) para comprar a chave; a chave abre a porta da cápsula.');
  return true;
 }
 // ------------------------------------------------------------ v134: mapas panorâmicos
 async function ampliarMapa(id,k,{silencioso=false}={}){
  if(!ehMestre())throw Error('Só o mestre.');
  const api=win.mesaMapasV110_,hid=win.mesaSessaoV115_?.hidratarMapa;if(!api?.salvar||!hid)throw Error('Mapas ainda carregando.');
  const m=await hid(id);const st=m?.oficina2State;if(!st?.elements?.length)throw Error('Este mapa não tem desenho da Oficina para ampliar.');
  const arq='combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
  let cena=null;try{const a=await dep.getDoc(D(SCENE));if(a.exists()&&String(a.data()?.mapId||'')===String(id))cena=a.data();}catch(_){}
  if(!cena){try{const s=await dep.getDoc(D(arq));if(s.exists())cena=s.data();}catch(_){}}
  // cópia de segurança (se não couber, não mexe no mapa)
  await dep.setDoc(D('combatesAtivos/backupPanoramico_'+encodeURIComponent(id)),clean({em:new Date().toISOString(),k,state:st,nome:m.nome||id}));
  if(cena)await dep.setDoc(D('combatesAtivos/backupPanoramicoCena_'+encodeURIComponent(id)),clean({em:new Date().toISOString(),cena}));
  const novo=ampliarEstado(st,k);
  const pub=prepararPublicacaoOficina(novo,cena,limites),ids=new Set(pub.objects.map(o=>o.id));
  const novaCena={...(cena||{}),mapId:String(id),objetoSchema:1,objects:[...pub.objects,...((cena?.objects)||[]).filter(o=>!ids.has(o.id)&&!o.oficinaElement)],oficinaConfig:pub.config,oficinaErasers:pub.erasers,editorRevision:Number(cena?.editorRevision||0)+1};
  await api.salvar({id,nome:m.nome||id,state:novo,cenaDe:()=>JSON.stringify(novaCena).length<=LIMITE_CENA?novaCena:null});
  await dep.setDoc(D('mapas/'+id),{panoramicoV134:{k:novo.panoramicoV134,em:new Date().toISOString()}},{merge:true});
  try{const md=await dep.getDoc(D(MAP));if(md.exists()&&String(md.data()?.mapId||'')===String(id))await dep.setDoc(D(MAP),{larguraM:novo.w,alturaM:novo.h},{merge:true});}catch(_){}
  try{const mm=(dep.mapas?.()||[]).find(x=>String(x.id)===String(id));if(mm)mm.panoramicoV134={k:novo.panoramicoV134};}catch(_){}
  if(String(ctl()?.mapaAtual?.()||'')===String(id))try{ctl()?.refreshView?.();}catch(_){}
  if(!silencioso)toast(`🔭 ${m.nome||id}: agora ${novo.w} × ${novo.h} m (móveis no tamanho real, miniaturas menores). Dá para desfazer no 🔭.`);
  return novo;
 }
 async function desfazerAmpliacao(id){
  const api=win.mesaMapasV110_;const b=await dep.getDoc(D('combatesAtivos/backupPanoramico_'+encodeURIComponent(id)));if(!b.exists())throw Error('Sem cópia de segurança deste mapa.');
  const {state,nome}=b.data();let cena=null;try{const c=await dep.getDoc(D('combatesAtivos/backupPanoramicoCena_'+encodeURIComponent(id)));if(c.exists())cena=c.data().cena;}catch(_){}
  await api.salvar({id,nome:nome||id,state,cenaDe:mid=>cena?{...cena,mapId:String(mid)}:cenaDoEstado(state,mid)});
  await dep.setDoc(D('mapas/'+id),{panoramicoV134:null},{merge:true});
  try{const md=await dep.getDoc(D(MAP));if(md.exists()&&String(md.data()?.mapId||'')===String(id))await dep.setDoc(D(MAP),{larguraM:state.w,alturaM:state.h},{merge:true});}catch(_){}
  if(String(ctl()?.mapaAtual?.()||'')===String(id))try{ctl()?.refreshView?.();}catch(_){}
  toast('↩ Mapa voltou ao tamanho anterior.');
 }
 // Pátio das Sete Rodas (e outros "Sete Rodas"): ampliados uma vez, sozinhos
 const tentouPanorama=new Set();
 async function panoramasAutomaticos(){
  for(const m of dep.mapas?.()||[]){
   if(m.__carregando||m.panoramicoV134||tentouPanorama.has(m.id)||!/sete rodas/i.test(String(m.nome||'')+' '+m.id.replace(/_/g,' ')))continue;
   if(Number(m.larguraM)>40)continue;tentouPanorama.add(m.id);
   try{await ampliarMapa(m.id,2,{silencioso:true});toast(`🔭 ${m.nome}: ficou panorâmico (×2). Para outros mapas amplos, use o 🔭 na barra do mapa.`);}catch(e){console.warn('[Elenco] panorâmico',m.id,e);}
  }
 }
 let botaoPan=null,popPan=null;
 function instalarBotaoPan(){
  if(!ehMestre()||botaoPan?.isConnected)return;
  const barra=root.querySelector('#sincronizacao-nova .nova-view-tools')||root.querySelector('#mbBarra [data-extras]');if(!barra)return;
  botaoPan=root.createElement('button');botaoPan.type='button';botaoPan.id='elPanoramico';botaoPan.className='btn-small';botaoPan.textContent='🔭';
  botaoPan.title='Mapa panorâmico: ampliar o lugar (o chão e as paredes crescem, os móveis ficam no tamanho real e as miniaturas ficam menores)';
  botaoPan.addEventListener('click',ev=>{ev.stopPropagation();if(popPan){popPan.remove();popPan=null;return;}abrirPan();});barra.append(botaoPan);
 }
 function abrirPan(){
  const id=String(ctl()?.mapaAtual?.()||''),m=(dep.mapas?.()||[]).find(x=>String(x.id)===id);
  popPan=root.createElement('div');popPan.style.cssText='position:fixed;z-index:9995;background:#121a2e;border:1px solid #8ee7ff;border-radius:12px;padding:10px 12px;color:#e8eefc;font:13px Segoe UI,Arial,sans-serif;width:min(300px,92vw);box-shadow:0 10px 28px rgba(0,0,0,.55)';
  const r=botaoPan.getBoundingClientRect();popPan.style.top=(r.bottom+6)+'px';popPan.style.left=Math.max(12,Math.min(win.innerWidth-312,r.left-140))+'px';
  const sug=(dep.mapas?.()||[]).filter(x=>!x.panoramicoV134&&Number(x.larguraM||28)<=36&&AMPLO.test(String(x.nome||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase())).map(x=>x.nome).slice(0,8);
  popPan.innerHTML=`<b style="color:#8ee7ff">🔭 ${m?m.nome:'Mapa'}</b><div style="margin:4px 0 8px;color:#9fb3cc">Agora ${m?.larguraM||28} × ${m?.alturaM||14} m. Ampliar:</div>
   <div style="display:flex;gap:6px">${[1.5,2,3].map(k=>`<button type="button" class="btn-small" data-k="${k}" style="flex:1">×${String(k).replace('.',',')}</button>`).join('')}</div>
   ${m?.panoramicoV134?'<button type="button" class="btn-small" data-desfazer style="width:100%;margin-top:6px">↩ Desfazer (voltar ao tamanho anterior)</button>':''}
   ${sug.length?`<div style="margin-top:8px;color:#9fb3cc;font-size:12px">Bons candidatos: ${sug.join(', ')}.</div>`:''}<div data-st style="margin-top:6px;color:#ffe2b3;min-height:1em"></div>`;
  popPan.addEventListener('click',async ev=>{ev.stopPropagation();const b=ev.target.closest('button');if(!b||!id)return;const st=popPan.querySelector('[data-st]');b.disabled=true;st.textContent='⏳ Ampliando…';
   try{if(b.dataset.desfazer!==undefined)await desfazerAmpliacao(id);else await ampliarMapa(id,Number(b.dataset.k));popPan?.remove();popPan=null;}catch(e){st.textContent='⚠️ '+(e?.message||e);b.disabled=false;}});
  root.body.append(popPan);
  const fora=e=>{if(popPan&&!popPan.contains(e.target)&&e.target!==botaoPan){popPan.remove();popPan=null;root.removeEventListener('click',fora);}};setTimeout(()=>root.addEventListener('click',fora),0);
 }

 // ------------------------------------------------------------ vigia
 function assinar(){
  parar?.();parar=dep.onSnapshot(D(MAP),s=>{
   const id=String(s.exists()?s.data()?.mapId||'':'');if(!id||id===ultimoMapa)return;ultimoMapa=id;
   // espera as miniaturas chegarem antes de decidir quem falta
   setTimeout(()=>{void carregarElenco(id).catch(e=>console.warn('[Elenco]',e));},2200);
  },e=>console.warn('[Elenco] mapa',e));
 }
 let tentativas=0,assinado=false,extrasFeitos=false,extrasRodando=false;
 const vigia=setInterval(()=>{
  try{
   if(!ehMestre())return;
   if(!assinado){assinado=true;assinar();}
   if(!reformado&&tentativas++<120)void reformar();
   instalarBotaoPan();
   if(!extrasFeitos&&!extrasRodando&&(reformado||tentativas>8)&&(dep.mapas?.()||[]).length&&(dep.npcs?.()||[]).length){extrasRodando=true;(async()=>{try{const a=await corrigirBilhetes(),b=await prepararAluguel();await panoramasAutomaticos();extrasFeitos=!!(a&&b);}catch(e){console.warn('[Elenco] v134',e);}finally{extrasRodando=false;}})();}
  }catch(e){console.warn('[Elenco]',e);}
 },3000);
 const api={carregarElenco:id=>{feitos.delete(id);return carregarElenco(id);},reformar,ampliarMapa,desfazerAmpliacao,corrigirBilhetes,prepararAluguel,parar:()=>{clearInterval(vigia);parar?.();}};
 win.mesaElenco=api;
 return api;
}
