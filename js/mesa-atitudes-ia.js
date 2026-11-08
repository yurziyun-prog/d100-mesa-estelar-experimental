// Mesa Estelar v200 — Atitudes das criaturas e NPCs (quem ataca quem) + personalidades + miniaturas que não se atravessam.
//
// Quatro atitudes (o mestre escolhe ao adicionar ou depois, uma a uma):
//   🩸 Sanguinária — sai para atacar qualquer um que perceber (até os outros monstros);
//   ⚔️ Agressiva  — vigia um território: só ataca quem ENTRA nele (e quem a atacar);
//   🛡️ Defensiva  — não começa briga; só ataca quem a atacou;
//   🤝 Aliada     — faz parte de um grupo de aliados; nunca ataca um aliado (mesmo atacada por ele); defende o grupo
//                   (ataca quem ataca um aliado) e, fora disso, não começa briga.
// Regras do mestre: a PRIMEIRA classificação dada a uma criatura vira o padrão de toda a espécie (dá para trocar um por um depois);
// NPCs que não são criaturas são defensivos por padrão. Criatura sem classificação e sem padrão segue como antes (sistema de facções ⚡).
//
// Isto liga no combate em tempo real que já existe (mesa-tempo-real*.js): a atitude define a FACÇÃO de cada um (faccaoDe) e quem ele ENGAJA
// (escolha de alvo). Quando uma criatura sanguinária (ou agressiva, com intruso no território) percebe alguém, o tempo real liga sozinho;
// quando a calma volta, ele é pausado. Também resolve a sobreposição: miniaturas não ficam umas em cima das outras.
// Personalidades (covarde, teimosa, furiosa) mudam o jeito de lutar (moral); explorador e outras ficam para o módulo de vida.
//
// Tudo no navegador do mestre. Módulo à parte: se falhar, o mapa segue como antes.
import {FACCOES,ehJogador,hostis,faccaoPadrao,distanciaBordas,estadoVivo,paraMetros,diametro} from './mesa-tempo-real-ia.js?v=133';
import {especieDoToken} from './mesa-sprites-npc.js?v=199';

export const ATITUDES={
 sanguinaria:{nome:'Sanguinária',icone:'🩸',desc:'sai para atacar qualquer um'},
 agressiva:{nome:'Agressiva',icone:'⚔️',desc:'ataca quem entrar no seu território'},
 defensiva:{nome:'Defensiva',icone:'🛡️',desc:'só ataca se for atacada'},
 aliada:{nome:'Aliada',icone:'🤝',desc:'faz parte de um grupo; nunca ataca os aliados'},
 pacifica:{nome:'Pacífica',icone:'🕊️',desc:'nunca ataca ninguém (foge se for atacada)'}
};
/** Confiança (coragem na luta, como no Skyrim): vira o jeito de lutar do tempo real. Sem valor = Cautelosa (o comportamento de sempre). */
export const CONFIANCA={
 0:{nome:'Covarde',icone:'🏃',combate:'covarde',desc:'foge cedo e busca refúgio'},
 1:{nome:'Cautelosa',icone:'🦊',combate:'auto',desc:'jeito normal de lutar e fugir'},
 2:{nome:'Corajosa',icone:'🦁',combate:'teimoso',desc:'só foge quando quase morta'},
 3:{nome:'Destemida',icone:'🔥',combate:'furia',desc:'nunca foge'}
};
/** Ajuda: quem ela socorre quando é atacado (ataca o agressor). Padrão: aliada = espécie e grupo; as outras = ninguém. */
export const AJUDA={0:{nome:'Ninguém',desc:'cada um por si'},1:{nome:'Mesma espécie',desc:'defende o bando da sua espécie'},2:{nome:'Espécie e grupo',desc:'defende o bando e os aliados do grupo'}};
const nivel=(v,max)=>{if(v===''||v===null||v===undefined)return null;const n=Number(v);return Number.isInteger(n)&&n>=0&&n<=max?n:null;};
export const confiancaValida=v=>nivel(v,3),ajudaValida=v=>nivel(v,2);
const DIETAS_OK=['','cacadora','frugivora','onivora'];
/** chave da espécie (campo "espécie" do bestiário sem parênteses/acentos): todos os "Humanoide parasitado" (zumbi, cadáver chefe, carniçal…) são o mesmo bando */
const memoEsp=new Map(); // v203: a mesma espécie era normalizada milhares de vezes por segundo
export const chaveEspecie=s=>{const k=String(s||'');let v=memoEsp.get(k);if(v===undefined){v=chaveEspecieCalc(k);if(memoEsp.size>400)memoEsp.clear();memoEsp.set(k,v);}return v;};
const chaveEspecieCalc=s=>String(s||'').split('(')[0].normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/["“”]/g,'').replace(/\s+/g,' ').trim();
/** modelo (espécie ou NPC) de um token, sem o ~número dos repetidos */
export const modeloBase=t=>{const m=/^sync(?:criatura|npc):(.+)$/.exec(dec(t?.id));return m?m[1].replace(/~\d+$/,''):'';};
export const GRUPOS_ALIADOS=['grupo','a','b','c'];
export const rotuloGrupo=g=>FACCOES[g]?.nome||g;
export const TERRITORIO_PADRAO_M=7;
/** personalidades: jeito de lutar (moral) e, no módulo de vida, de passear */
export const PERSONALIDADES={
 comum:{nome:'Comum',icone:'🙂',combate:'auto'},
 covarde:{nome:'Covarde',icone:'🏃',combate:'covarde',desc:'foge cedo e busca refúgio'},
 teimosa:{nome:'Teimosa',icone:'🐗',combate:'teimoso',desc:'só foge com 10% da vida'},
 furiosa:{nome:'Furiosa',icone:'🔥',combate:'furia',desc:'nunca foge'},
 explorador:{nome:'Exploradora',icone:'🧭',combate:'auto',desc:'anda longe e abre portas'},
 construtora:{nome:'Construtora',icone:'🕳️',combate:'auto',desc:'junta pedras/árvores e constrói uma toca'}
};
export const MEMORIA_AGRESSAO_MS=90000;

const decMemoV203=new Map(); // v203: ids repetidos milhares de vezes por segundo
const dec=id=>{const k=String(id||'');let v=decMemoV203.get(k);if(v===undefined){try{v=decodeURIComponent(k);}catch(_){v=k;}if(decMemoV203.size>3000)decMemoV203.clear();decMemoV203.set(k,v);}return v;};
export const ehCriaturaToken=t=>/^synccriatura:/.test(dec(t?.id));
export const ehNpcToken=t=>/^syncnpc:/.test(dec(t?.id));
/** id da espécie para o padrão (criaturas) */
export const especieDe=t=>ehCriaturaToken(t)?especieDoToken(t):'';
const valida=a=>Object.hasOwn(ATITUDES,a);

/**
 * Atitude efetiva de um token. Ordem: ajuste do próprio token → padrão da espécie (criaturas) → facção manual do painel ⚡ (sem atitude)
 * → NPC comum = defensivo. Jogadores e companheiros do grupo não têm atitude (null = comportamento antigo).
 */
export function atitudeDe(t,{padroes={},faccoes={},companheiro=false}={}){
 if(!t||ehJogador(t)||companheiro)return null;
 const grupoDe=o=>GRUPOS_ALIADOS.includes(o?.grupo)?o.grupo:'a';
 const extras=(id,p)=>{const c=confiancaValida(t.confiancaV200)??confiancaValida(p?.confianca),a=ajudaValida(t.ajudaV200)??ajudaValida(p?.ajuda);return {confianca:c,ajuda:a??(id==='aliada'?2:0)};};
 if(valida(t.atitudeV200)){const p=ehCriaturaToken(t)?padroes[especieDe(t)]:null;return {id:t.atitudeV200,grupo:grupoDe({grupo:t.grupoV200}),territorioM:Number(t.territorioMV200)||0,origem:'token',...extras(t.atitudeV200,p)};}
 if(ehCriaturaToken(t)){const p=padroes[especieDe(t)];if(p&&valida(p.atitude))return {id:p.atitude,grupo:grupoDe(p),territorioM:Number(p.territorioM)||0,origem:'especie',...extras(p.atitude,p)};return null;}
 if(faccoes?.[t.id])return null;
 if(ehNpcToken(t))return {id:'defensiva',grupo:'a',territorioM:0,origem:'padrao-npc',...extras('defensiva',null)};
 return null;
}
/** facção usada pelo tempo real: aliada = a do grupo; as outras atitudes são "cada um por si" (quem engaja é decidido à parte) */
export function faccaoDaAtitude(a){
 if(!a)return null;
 return a.id==='aliada'?(GRUPOS_ALIADOS.includes(a.grupo)?a.grupo:'a'):'selvagens';
}
export const comportamentoRT=(t)=>PERSONALIDADES[t?.personalidadeV200]?.combate&&t.personalidadeV200!=='comum'?PERSONALIDADES[t.personalidadeV200].combate:null;

/**
 * Este ator vai atacar este alvo? (só decide o ENGAJAMENTO; quem é inimigo continua sendo da facção)
 * ctx: {atitude(t), agressorDe(id), casa(t)→{x,y} metros, W, H, aliadosDe(t)→tokens, agora}
 */
export function engaja(ator,alvo,ctx){
 const A=ctx.atitude(ator);if(!A)return true;               // sem atitude: como antes
 const B=ctx.atitude(alvo);
 const bando=ctx.mesmoBando?ctx.mesmoBando(ator,alvo):(!!modeloBase(ator)&&modeloBase(ator)===modeloBase(alvo));
 if(A.ajuda>=1&&bando)return false;                       // Ajuda ligada: não ataca quem é da mesma espécie (eles se juntam)
 if(A.id==='aliada'&&B&&B.id==='aliada'&&B.grupo===A.grupo)return false; // aliado nunca
 if(A.id==='pacifica')return false;                       // nunca ataca
 if(A.id==='sanguinaria')return true;
 const meuAgressor=ctx.agressorDe(ator.id);
 if(meuAgressor&&meuAgressor===alvo.id&&!(A.id==='aliada'&&B&&B.id==='aliada'&&B.grupo===A.grupo))return true; // revida (menos aliado)
 if(A.ajuda>=1&&!bando){ // ajuda: socorre quem do bando foi atacado por este alvo
  for(const o of ctx.ajudantesDe?.(ator,A.ajuda)||[]){if(o.id!==ator.id&&ctx.agressorDe(o.id)===alvo.id)return true;}
 }
 if(A.id==='defensiva')return false;
 if(A.id==='aliada'){ // defende o grupo: quem atacou um aliado
  for(const o of ctx.aliadosDe?.(ator)||[]){if(o.id!==ator.id&&ctx.agressorDe(o.id)===alvo.id)return true;}
  return false;
 }
 // agressiva: quem está dentro do território
 const casa=ctx.casa(ator);if(!casa)return false;
 const R=(A.territorioM||TERRITORIO_PADRAO_M)+diametro(ator)/2+diametro(alvo)/2,p=paraMetros(alvo,ctx.W,ctx.H);
 return Math.hypot(p.x-casa.x,p.y-casa.y)<=R;
}

/** empurra a posição p (metros) para fora de quem estiver sobreposto (soma das pegadas); devolve a nova posição */
export function separar(p,ator,outros,{W=28,H=14,folga=.9}={}){
 let q={...p},mexeu=false;
 for(const o of outros){if(!o||o.id===ator.id)continue;const c=paraMetros(o,W,H),min=(diametro(ator)+diametro(o))/2*folga,dx=q.x-c.x,dy=q.y-c.y,dd=Math.hypot(dx,dy);
  if(dd<min){const k=(min-dd)/Math.max(.01,dd);q={x:q.x+(dx||.01)*k,y:q.y+(dy||(dd?0:.01))*k};mexeu=true;}}
 return mexeu?q:null;
}

// ================================================================ instalação (mestre)
const ESTADO_RT='combatesAtivos/mesaTempoReal',MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',HEALTH='combatesAtivos/mapaMesaSyncSaude',PADROES='configuracoes/atitudesEspecieV200';
export function instalarAtitudes(dep){
 const root=dep.root||document,win=root.defaultView||window,D=p=>dep.doc(dep.db,...p.split('/'));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let padroes={},mapa=null,saude=null,parar=[],iniciadoPorMim=false,ultimaAtividade=0,agora0=Date.now();
 const agressoes=new Map(),casas=new Map();
 const tokensNoMapa=()=>{try{return ctl()?.tokensNoMapa?.()||[];}catch(_){return [];}};
 const dims=()=>({W:Number(mapa?.larguraM)||Number(ctl()?.dimsAtual?.()?.W)||28,H:Number(mapa?.alturaM)||Number(ctl()?.dimsAtual?.()?.H)||14});
 const faccoes=()=>{try{return win.mesaTempoRealV111?.estado?.()?.faccoes||{};}catch(_){return {};}};
 const companheiro=t=>{try{return !!win.mesaCompanheiros?.ehCompanheiro?.(t?.id);}catch(_){return false;}};
 const atitude=t=>atitudeDe(t,{padroes,faccoes:faccoes(),companheiro:companheiro(t)});
 const agressorDe=id=>{const r=agressoes.get(String(id));if(!r||Date.now()-r.t>MEMORIA_AGRESSAO_MS){agressoes.delete(String(id));return null;}return r.id;};
 const casa=t=>{
  if(t?.casaV200&&Number.isFinite(Number(t.casaV200.x)))return paraMetros(t.casaV200,dims().W,dims().H);
  let c=casas.get(t.id);if(!c){c=paraMetros(t,dims().W,dims().H);casas.set(t.id,c);}return c;
 };
 const aliadosDe=t=>{const A=atitude(t);if(!A||A.id!=='aliada')return [];return tokensNoMapa().filter(o=>{const B=atitude(o);return B&&B.id==='aliada'&&B.grupo===A.grupo;});};
 /** quem ela socorre: nível 1 = mesma espécie/modelo; nível 2 = também os aliados do mesmo grupo */
 const cacheModeloV203=new Map();let cacheModeloN=-1; // v203: acha o modelo uma vez por criatura (era uma busca na lista inteira a cada pergunta)
 const modeloDe=t=>{const m=/^synccriatura:(.+)$/.exec(dec(t?.id));if(!m)return null;const b=m[1].replace(/~\d+$/,''),lista=dep.criaturas?.()||[];if(lista.length!==cacheModeloN){cacheModeloV203.clear();cacheModeloN=lista.length;}if(cacheModeloV203.has(b))return cacheModeloV203.get(b);const r=lista.find(x=>String(x.id)===b)||null;cacheModeloV203.set(b,r);return r;};
 /** espécie do token para o bando: campo "espécie" do bestiário; sem ele, o próprio modelo */
 const grupoEspecieDe=t=>{const mo=modeloDe(t),k=chaveEspecie(mo?.especie);return k||modeloBase(t)||'';};
 const mesmoBando=(a,b)=>{const x=grupoEspecieDe(a);return !!x&&x===grupoEspecieDe(b);};
 const ajudantesDe=(t,nv)=>{const A=atitude(t);return tokensNoMapa().filter(o=>{if(o.id===t.id)return false;if(nv>=1&&mesmoBando(t,o))return true;const B=atitude(o);return nv>=2&&A?.id==='aliada'&&B?.id==='aliada'&&B.grupo===A.grupo;});};
 const contexto=()=>{const {W,H}=dims();return {atitude,agressorDe,casa,W,H,aliadosDe,ajudantesDe,mesmoBando};};
 // ---- ganchos usados pelo tempo real (mesa-tempo-real-ia.js / mesa-tempo-real.js)
 const faccaoDeHook=(t)=>faccaoDaAtitude(atitude(t));
 const engajaHook=(a,b)=>{try{return engaja(a,b,contexto());}catch(_){return true;}};
 // ---- padrões por espécie e atitude de cada token
 const padraoDe=especie=>padroes[especie]||null;
 async function definirPadrao(especie,{atitude:a,grupo='a',territorioM=0,confianca='',ajuda='',dieta='',personalidade=''}){
  if(!especie||!valida(a))return false;
  const p={atitude:a,grupo,territorioM:Number(territorioM)||0,confianca:confiancaValida(confianca)??'',ajuda:ajudaValida(ajuda)??'',dieta:DIETAS_OK.includes(String(dieta||''))?String(dieta||''):'',personalidade:Object.hasOwn(PERSONALIDADES,personalidade)?personalidade:''};
  padroes={...padroes,[especie]:p};
  await dep.setDoc(D(PADROES),{padroes:{[especie]:p},atualizadoEm:Date.now()},{merge:true});return true;
 }
 /** grava campos num token com a revisão ATUAL do servidor (+1), como as regras exigem; tenta de novo se a vida/o tempo real mexeram nele no meio */
 async function gravarToken(id,dados){
  let ultimo=null;
  for(let i=0;i<4;i++){
   try{const s=await dep.getDoc(D(POS+'/'+id)),rev=Number((s.exists()?s.data():{}).revision||0);
    await dep.setDoc(D(POS+'/'+id),{...dados,revision:rev+1},{merge:true});return true;}
   catch(e){ultimo=e;if(!/permission|aborted|conflict/i.test(String(e?.code||e?.message||e)))throw e;await new Promise(r=>setTimeout(r,120+Math.random()*180));}
  }
  throw ultimo;
 }
 async function definirToken(t,{atitude:a=undefined,grupo,territorioM,personalidade,confianca,ajuda,dieta}={}){
  if(!t)return false;const rev=Number(t.revision||0)+1,dados={revision:rev};
  if(confianca!==undefined)dados.confiancaV200=confiancaValida(confianca)??''; // '' = padrão da espécie
  if(ajuda!==undefined)dados.ajudaV200=ajudaValida(ajuda)??'';
  if(dieta!==undefined)dados.dietaV200=DIETAS_OK.includes(String(dieta||''))?String(dieta||''):'';
  if(a===null||a==='')Object.assign(dados,{atitudeV200:'',grupoV200:'',territorioMV200:0}); // volta ao padrão da espécie
  else if(valida(a))Object.assign(dados,{atitudeV200:a,grupoV200:GRUPOS_ALIADOS.includes(grupo)?grupo:'a',territorioMV200:Number(territorioM)||0});
  if(personalidade!==undefined)dados.personalidadeV200=(personalidade===''||personalidade===null)?'':(Object.hasOwn(PERSONALIDADES,personalidade)?personalidade:'comum');
  if(Object.keys(dados).length<2)return false;
  const {revision:_r,...semRev}=dados;await gravarToken(t.id,semRev);return true;
 }
 /** personalidade em vigor: a do token, senão a da espécie, senão comum */
 const personalidadeDe=t=>{const v=String(t?.personalidadeV200||'');if(v&&Object.hasOwn(PERSONALIDADES,v))return v;const p=ehCriaturaToken(t)?padroes[especieDe(t)]:null;return p?.personalidade&&Object.hasOwn(PERSONALIDADES,p.personalidade)?p.personalidade:'comum';};
 /** salvar SÓ este personagem: c = {atitude,personalidade,confianca,ajuda,dieta}; ''/null = volta ao padrão da espécie */
 async function aplicarToken(t,c={}){
  if(!t)return false;const o={};
  if('atitude' in c){o.atitude=c.atitude===''?null:c.atitude;if(valida(c.atitude)){o.grupo=t.grupoV200||'a';o.territorioM=t.territorioMV200||0;}}
  for(const k of ['personalidade','confianca','ajuda','dieta'])if(k in c)o[k]=c[k]===''?null:c[k];
  if('personalidade' in c)o.personalidade=c.personalidade===''?'':c.personalidade;
  await definirToken(t,o);return true;
 }
 /** salvar para TODA a espécie: vira o padrão e apaga as exceções individuais dos campos mudados (em todos os da espécie no mapa) */
 async function aplicarEspecie(t,c={}){
  const esp=ehCriaturaToken(t)?especieDe(t):'';if(!esp)return {especie:'',total:await aplicarToken(t,c)?1:0};
  const p0=padraoDe(esp)||{},A0=atitude(t),atit=('atitude' in c&&valida(c.atitude))?c.atitude:(valida(p0.atitude)?p0.atitude:(A0?A0.id:'defensiva'));
  const g=k=>k in c?(c[k]??''):(p0[k]??'');
  await definirPadrao(esp,{atitude:atit,grupo:p0.grupo||'a',territorioM:p0.territorioM||0,confianca:g('confianca'),ajuda:g('ajuda'),dieta:g('dieta'),personalidade:g('personalidade')});
  let n=0;
  for(const o of tokensNoMapa()){if(!ehCriaturaToken(o)||especieDe(o)!==esp)continue;
   const lim={};if('atitude' in c)lim.atitude=null;for(const k of ['personalidade','confianca','ajuda','dieta'])if(k in c)lim[k]=k==='personalidade'?'':null;
   try{await definirToken(o,lim);n++;}catch(e){console.warn('[Atitudes] espécie',e?.message||e);}}
  return {especie:esp,total:n};
 }
 /** o que esta criatura vai fazer agora (para o balão): atitude em vigor, tempo real e alvos hostis */
 function diagnostico(t){
  const A=atitude(t),rt=win.mesaTempoRealV111,out={atitude:A?A.id:'',origem:A?.origem||'',rt:rt?(rt.ativo()?(rt.estado?.()?.pausado?'pausado':'ligado'):'desligado'):'indisponível',alvos:[]};
  try{const {W,H}=dims(),fa=faccaoDeHook(t);for(const o of tokensNoMapa()){if(o.id===t.id||!estadoVivo(saude,o.id))continue;if(!(hostis(fa,faccaoDeHook(o)||faccaoPadrao(o),false)||A?.id==='sanguinaria'))continue;out.alvos.push({nome:o.nome||o.id,m:Math.round(distanciaBordas(t,o,W,H)*10)/10});}out.alvos.sort((a,b)=>a.m-b.m);}catch(_){}
  return out;
 }
 /** classificar uma criatura/NPC: a primeira vez numa espécie vira o padrão dela (regra do mestre); depois só vale para o token */
 async function classificar(t,{atitude:a,grupo='a',territorioM=0,personalidade,confianca,ajuda,dieta}={}){
  if(!t||!valida(a))return {padrao:false};
  let padrao=false;const esp=especieDe(t);
  if(esp&&!padraoDe(esp)){await definirPadrao(esp,{atitude:a,grupo,territorioM,confianca,ajuda,dieta});padrao=true;if(personalidade!==undefined)await definirToken(t,{personalidade});}
  else await definirToken(t,{atitude:a,grupo,territorioM,personalidade,confianca,ajuda,dieta});
  return {padrao,especie:esp};
 }
 // ---- eventos de ataque: quem atacou quem (vale para qualquer ataque do mapa)
 function aoEvento(ev){
  if(!ev?.id||!ev.source?.id||!ev.target?.id||Date.now()-Number(ev.ts||0)>8000)return;
  agressoes.set(String(ev.target.id),{id:String(ev.source.id),t:Date.now()});ultimaAtividade=Date.now();
 }
 // ---- liga o tempo real quando alguém percebe um alvo; pausa quando a calma volta
 async function tick(){
  if(!ehMestre()||!mapa?.mapId||mapa?.combat?.active)return;
  const rt=win.mesaTempoRealV111;if(!rt||win.mesaJogoPausadoV214?.())return;
  const lista=tokensNoMapa().filter(t=>String(t.mapaId||'')===String(mapa.mapId));if(lista.length<2)return;
  const {W,H}=dims(),ctx=contexto(),agora=Date.now();let gatilho=false;
  for(const t of lista){
   const A=atitude(t);if(!A||(A.id!=='sanguinaria'&&A.id!=='agressiva'))continue;if(!estadoVivo(saude,t.id)||!rt.automatico?.(t.id))continue;
   const fa=faccaoDeHook(t);
   for(const o of lista){if(o.id===t.id||!estadoVivo(saude,o.id))continue;
    if(!(hostis(fa,faccaoDeHook(o)||faccaoPadrao(o),false)||A.id==='sanguinaria'))continue;
    if(distanciaBordas(t,o,W,H)>(A.id==='sanguinaria'?14:(A.territorioM||TERRITORIO_PADRAO_M)+2))continue;
    if(engaja(t,o,ctx)){gatilho=true;break;}}
   if(gatilho)break;
  }
  if(gatilho){ultimaAtividade=agora;
   if(!rt.ativo()){if(await rt.iniciar()){iniciadoPorMim=true;}}
   else if(rt.estado?.()?.pausado&&!rt.estado?.()?.pausaEmergencia){await rt.iniciar?.();iniciadoPorMim=true;}
  }else if(iniciadoPorMim&&agora-ultimaAtividade>25000){
   iniciadoPorMim=false; // calmaria não pausa o jogo
  }
 }
 // ---- miniaturas não se atravessam: empurra com delicadeza quem ficou em cima de outro (só o mestre mexe)
 const sobrepostoDesde=new Map();let movendo=false;
 async function separarTodos(){
  if(!ehMestre()||movendo||!mapa?.mapId||win.__semSepararV201||win.mesaJogoPausadoV214?.())return;
  const lista=tokensNoMapa().filter(t=>String(t.mapaId||'')===String(mapa.mapId));if(lista.length<2)return;
  const {W,H}=dims(),agora=Date.now(),vivos=lista.filter(t=>estadoVivo(saude,t.id));
  for(const t of vivos){
   if(ehJogador(t)&&!win.mesaTempoRealV111?.automatico?.(t.id))continue; // não mexe em jogador
   const nova=separar(paraMetros(t,W,H),t,vivos,{W,H,folga:.96});
   if(!nova){sobrepostoDesde.delete(t.id);continue;}
   const desde=sobrepostoDesde.get(t.id)||agora;sobrepostoDesde.set(t.id,desde);if(agora-desde<450)continue; // dá um instante para resolver sozinho (andando)
   const n={x:Math.max(.3,Math.min(27.7,nova.x*28/W)),y:Math.max(.3,Math.min(13.7,nova.y*14/H))};
   movendo=true;try{await gravarToken(t.id,{x:Number(n.x.toFixed(3)),y:Number(n.y.toFixed(3))});}catch(e){console.warn('[Atitudes] separar',e?.message||e);}finally{movendo=false;}
   sobrepostoDesde.delete(t.id);break; // um por ciclo
  }
 }
 // ---- assinaturas e ciclo
 let assinado='';
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(PADROES),s=>{padroes=(s.exists()?s.data()?.padroes:null)||{};},()=>{}));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;if(saude?.event)aoEvento(saude.event);},()=>{}));
 }
 let cicloT=0;
 const vigia=setInterval(()=>{try{const k=String(dep.uid?.()||'')+'|'+ehMestre();if(!dep.uid?.())return;if(assinado!==k){assinado=k;assinar();}
  cicloT++;if(ehMestre()){if(cicloT%2===0)void tick().catch(e=>console.warn('[Atitudes]',e?.message||e));void separarTodos();}}catch(e){console.warn('[Atitudes]',e);}},700);
 /** criatura NOVA no mapa: nada de saúde, morte nem atributos sorteados de uma criatura anterior com o mesmo id (criatura comum não é NPC) */
 async function reiniciarCriatura(id){
  if(!id||!dep.runTransaction)return false;const hp=D(HEALTH),inst=D('combatesAtivos/mapaMesaSyncCriaturas');
  await dep.runTransaction(dep.db,async tx=>{
   const a=await tx.get(hp),b=await tx.get(inst),ha=a.exists()?a.data():null,ib=b.exists()?b.data():null;
   if(ha?.actors?.[id]){const {[id]:_x,...resto}=ha.actors;tx.set(hp,{...ha,actors:resto,revision:Number(ha.revision||0)+1});}
   if(ib?.instances?.[id]){const {[id]:_y,...resto2}=ib.instances;tx.set(inst,{...ib,instances:resto2});}
  });return true;
 }
 /** ficha rápida: nome e bônus (pontos %) de ataque e defesa deste token */
 async function definirFicha(t,{nome,bonusAtaque,bonusDefesa}={}){
  if(!t)return false;const d={revision:Number(t.revision||0)+1};
  const lim=v=>Math.max(-60,Math.min(60,Math.round(Number(v)||0)));
  if(nome!==undefined){const n=String(nome).trim().slice(0,60);if(n)d.nome=n;}
  if(bonusAtaque!==undefined)d.bonusAtaqueV200=lim(bonusAtaque);
  if(bonusDefesa!==undefined)d.bonusDefesaV200=lim(bonusDefesa);
  if(Object.keys(d).length<2)return false;const {revision:_r,...semRev}=d;await gravarToken(t.id,semRev);return true;
 }
 /** aparência 3D animada (arte/miniaturas3d) deste token; '' volta à arte de antes */
 async function definirArte3d(t,id){if(!t)return false;await gravarToken(t.id,{arte3dV200:String(id||'')});return true;}
 /** ajuste visual da miniatura 3D (matiz, saturação, brilho, tamanho, giro): texto curto 'h=0;s=100;b=100;z=100;g=0'; vale só para este personagem ou para toda a espécie no mapa */
 async function definirArteAjuste(t,txt,especie){
  if(!t)return 0;const v=String(txt||'').slice(0,60);let n=0;
  const alvos=especie&&ehCriaturaToken(t)?tokensNoMapa().filter(o=>ehCriaturaToken(o)&&especieDe(o)===especieDe(t)):[t];
  for(const o of alvos){try{await gravarToken(o.id,{arte3dAjusteV203:v});n++;}catch(e){console.warn('[Arte3D] ajuste',e?.message||e);}}
  return n;
 }
 /** vida (um PV só) deste token: novo máximo; mantém a proporção, ou cura tudo */
 async function definirVida(t,max,{curar=false}={}){
  const novo=Math.max(1,Math.min(9999,Math.round(Number(max)||0)));if(!t||!dep.runTransaction)return false;
  await dep.runTransaction(dep.db,async tx=>{
   const s=await tx.get(D(HEALTH)),hp=s.exists()?s.data():{actors:{},revision:0},a=hp.actors?.[t.id]||{},cl=a.combateLab||{hitMax:{},hit:{}};
   const ks=Object.keys(cl.hitMax||{}),tm=ks.reduce((n,k)=>n+Math.max(0,Number(cl.hitMax[k])||0),0),ta=ks.reduce((n,k)=>n+Number(cl.hit?.[k]??cl.hitMax[k]),0);
   const fr=tm>0?Math.max(0,Math.min(1,ta/tm)):1,pool='PV Global',atual=curar?novo:Math.max(0,Math.round(novo*fr));
   const cl2={...cl,hitMax:{[pool]:novo},hit:{[pool]:atual},armor:{[pool]:Number(cl.armor?.[pool])||0},ferimentos:{},membrosInuteis:{},resistenciaFerimentos:{}};
   if(atual>0){delete cl2.morto;delete cl2.inconsciente;delete cl2.incapacitado;}
   tx.set(D(HEALTH),{...hp,actors:{...(hp.actors||{}),[t.id]:{...a,combateLab:cl2}},revision:Number(hp.revision||0)+1});
  });return true;
 }
 /** tamanho da miniatura (m): o mestre ajusta pelo bestiário */
 async function definirTamanho(t,d){const v=Math.round(Number(d)*100)/100;if(!t||!(v>0)||v>12)return false;await gravarToken(t.id,{diametroM:v});return true;}
 const comportamentoHook=t=>{const p=comportamentoRT(t);if(p)return p;const A=atitude(t);return A&&A.confianca!==null&&A.confianca!==undefined?CONFIANCA[A.confianca].combate:null;}; // personalidade manda; senão a Confiança
 const api={definirArteAjuste,personalidadeDe,aplicarToken,aplicarEspecie,diagnostico,verificarAgora:()=>tick().catch(()=>{}),atitudeDe:t=>atitude(t),grupoEspecieDe,mesmoBando,faccaoDe:faccaoDeHook,engaja:engajaHook,comportamentoRT:comportamentoHook,padroes:()=>({...padroes}),padraoDe,definirPadrao,definirToken,definirTamanho,definirFicha,definirVida,definirArte3d,reiniciarCriatura,classificar,agressorDe,
  registrarAgressao:(vitima,agressor)=>{agressoes.set(String(vitima),{id:String(agressor),t:Date.now()});},
  parar:()=>{clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});}};
 win.mesaAtitudesIaV200=api;
 return api;
}
