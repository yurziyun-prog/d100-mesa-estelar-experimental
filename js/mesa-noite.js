// Mesa Estelar v143 — Dia e noite no mapa: quem dorme, quem some, quem vigia — e o barulho que acorda.
//
// Com o relógio do jogo ligado, à noite (22h–6h):
//  😴 NPCs e criaturas dormem onde estão (os da mesa-vida param de andar);
//  🌙 comerciantes não ficam na banca (20h–7h): somem do mapa dos jogadores até de manhã;
//  🕳️ criaturas selvagens em mapas de natureza/ermos/caverna se recolhem na toca (somem) ou dormem;
//  🛡️ guardas dormem encostados nos muros, revezando: com dois ou mais, um fica acordado em turnos de 2 h;
//  🔋 robôs recarregam 2 h por dia (cada um no seu horário), dia ou noite;
//  🦇 criaturas noturnas fazem o contrário: dormem de dia (9h–17h) e andam à noite.
// Barulho: a cada poucos segundos, quem dorme perto do grupo pode acordar. Pesa o tamanho do grupo, quem está
// andando, a distância, as armaduras, e tiros/brigas/berros no mapa. O jogador pode ligar 🤫 “andar em silêncio”:
// cada passo perto de alguém dormindo testa Furtividade (sucesso: quase sem barulho; falha: mais barulho).
// O mestre calcula e publica (combatesAtivos/mesaNoite); todos só desenham. Módulo à parte: se falhar, nada muda.

import {livrePerto} from './mesa-ligacoes.js?v=154';
const NOITE='combatesAtivos/mesaNoite',POS='combatesAtivos/mapaMesaSyncDireta/posicoes',MAP='combatesAtivos/mapaMesaSyncDireta',
 HIST='combatesAtivos/mapaMesaSyncHistorico',HEALTH='combatesAtivos/mapaMesaSyncSaude';
const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const limpa=n=>String(n||'Alguém').replace(/^(NPC|Monstro|PJ|PM|Criatura)\s*[·:-]\s*/i,'');
export const ehJogadorN=t=>!!t?.donoUid||!String(decodeURIComponent(String(t?.id||''))).startsWith('sync');
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};

// ---------------------------------------------------------------- regras puras
export const ZZZ='<span class="nt-z"><i>z</i><i>z</i><i>Z</i></span>';
export const ICONE={dormindo:ZZZ,toca:'🕳️',ausente:ZZZ,recarga:'🔋',vigia:'👁️',acordado:'❗'};
export const SOME_PARA_JOGADOR=new Set(['toca','ausente']);
// Que tipo de ser é (pelo id do token e pelo texto da ficha).
export function tipoDe(id,texto=''){
 const raw=decodeURIComponent(String(id||'')),t=sem(texto+' '+raw);
 if(/\brobo|\brobô|droide|droid|android|automato|\bmech\b|drone|\bur-?\d|unidade de manutencao|sintetico/.test(t))return 'robo';
 const cri=raw.startsWith('synccriatura:');
 const noturno=/noturn|notivag|ativ[oa]s? a noite|caca a noite|cacam a noite|morcego|coruja|sombra viva/.test(t);
 if(cri)return noturno?'noturno':/domesticad|montaria|companheir|treinad/.test(t)?'domestico':'selvagem';
 if(/contrabandist|mercado negro|receptador|traficant|ilegal|clandestin|casa noturna|boate|cabare|bordel|cassino|agiota/.test(t))return 'comerciante_noturno'; // v144: abre à noite
 if(/comerciante_generico_|comerciante|mercador|vendedor|feirante|ambulante|cambista|mercante/.test(t))return 'comerciante';
 if(/guarda|soldado|sentinela|vigia|patrulh|policia|seguranca|miliciano/.test(t))return 'guarda';
 return noturno?'noturno':'npc';
}
export const ehNoite=h=>h>=22||h<6;
export const comercioFechado=h=>h>=20||h<7;
export const diaDeNoturno=h=>h>=9&&h<17;
// Estado de rotina de um ser, pela hora do jogo (h = 0–23).
export function modoRotina({id,tipo,h,selvagemMapa=false,guardasDoMapa=[]}){
 const s=hash(id);
 if(tipo==='robo'){const ini=s%24,d=((h-ini)%24+24)%24;return d<2?'recarga':null;}
 if(tipo==='noturno')return diaDeNoturno(h)?(selvagemMapa&&s%2?'toca':'dormindo'):null;
 if(tipo==='comerciante')return comercioFechado(h)?'ausente':null;
 if(tipo==='comerciante_noturno')return h>=8&&h<18?'ausente':null; // casas noturnas e comércio ilegal: de dia ficam fechados
 if(!ehNoite(h))return null;
 if(tipo==='guarda'){
  const lista=[...guardasDoMapa].sort();if(lista.length<2)return 'dormindo';
  const turno=Math.floor(((h+2)%24)/2);return lista[turno%lista.length]===id?'vigia':'dormindo';
 }
 if(tipo==='selvagem')return selvagemMapa&&s%3!==0?'toca':'dormindo';
 return 'dormindo';
}
// Chance de acordar nesta checagem (0–1). ruidos: [{dist, andando, armadura, silencio}] (silencio: 'ok'|'falhou'|null)
export function chanceDeAcordar(ruidos=[],{grupo=1,violencia=false,leve=false}={}){
 if(violencia)return .85;
 let r=0;
 for(const x of ruidos){const d=Number(x.dist);if(!(d<12))continue;
  let b=x.andando?1:.12;b*=1+.45*(Number(x.armadura)||0);
  if(x.silencio==='ok')b*=.15;else if(x.silencio==='falhou')b*=1.4;
  r+=b*Math.pow(1-d/12,1.6);}
 r*=1+.18*Math.max(0,grupo-1);
 const c=Math.min(.55,r*(leve?.09:.06));
 return c<.003?0:c;
}
// Peso de armadura a partir do inventário equipado: 0 nada, 1 leve, 2 pesada (soma por peça, máx. 3).
export function pesoArmadura(inv={}){
 let n=0;for(const i of inv?.equipado||[]){const t=sem([i?.categoria,i?.tipo,i?.nome].join(' '));if(!/armadura|couraca|colete|capacete|elmo|placa|cota de malha|blindag|escudo/.test(t))continue;n+=/pesad|placa|combate|blindad|exo|malha|completa/.test(t)?1:.5;}
 return Math.min(3,n);
}
const VIOLENCIA=/atac|atir|dispar|\btiro|dano|acert|errou|berro|trombeta|golpe|explos|derrub|ferid|crit/i;

// ---------------------------------------------------------------- instalação
export function instalarNoite(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const el=id=>root.getElementById(id);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let noite={estados:{},silencio:{},acordados:{}},mapa=null,saude=null,posicoes=new Map(),parar=[],assinado='',hist=null,ultimoHist=0;
 const antes=new Map(),furtCache=new Map(),armCache=new Map(),violentos=new Map();
 const CSS=`#ntCamada{position:absolute;inset:0;pointer-events:none;z-index:13}
#ntCamada .nt-z{display:inline-flex;align-items:flex-end;gap:1px;font:700 13px 'Segoe UI',Arial,sans-serif;color:#dfe8ff;text-shadow:0 1px 2px #000,0 0 4px #000}
#ntCamada .nt-z i{font-style:normal;opacity:0;animation:ntZ 2.4s ease-in-out infinite}#ntCamada .nt-z i:nth-child(1){font-size:9px;animation-delay:0s}#ntCamada .nt-z i:nth-child(2){font-size:11px;animation-delay:.4s}#ntCamada .nt-z i:nth-child(3){font-size:14px;animation-delay:.8s}
@keyframes ntZ{0%{opacity:0;transform:translateY(4px)}25%{opacity:1}70%{opacity:1;transform:translateY(-3px)}100%{opacity:0;transform:translateY(-6px)}}
#ntCamada .nt-b{position:absolute;transform:translate(-50%,-140%);font-size:14px;line-height:1;filter:drop-shadow(0 1px 2px #000);animation:ntFlut 2.6s ease-in-out infinite}
@keyframes ntFlut{0%,100%{margin-top:0}50%{margin-top:-4px}}
#ntSilencio{position:absolute;left:8px;top:44px;z-index:31;height:28px;padding:0 10px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:12px 'Segoe UI',Arial,sans-serif;cursor:pointer}
#ntSilencio.on{border-color:#b07cff;color:#e3d2ff;background:rgba(40,20,70,.9)}
#ntSilencio[hidden]{display:none}`;
 if(!el('ntCssV143')){const st=root.createElement('style');st.id='ntCssV143';st.textContent=CSS;root.head.append(st);}

 const board=()=>el('novaSyncBoard');
 const mapaVisivel=()=>String(board()?.dataset.mapaVisivel||ctl()?.mapaAtual?.()||mapa?.mapId||'');
 const dimsDe=id=>{const m=(dep.mapas?.()||[]).find(x=>String(x.id)===String(id));return {W:Number(m?.larguraM)||(String(mapa?.mapId)===String(id)?Number(mapa?.larguraM):0)||28,H:Number(m?.alturaM)||(String(mapa?.mapId)===String(id)?Number(mapa?.alturaM):0)||14,m};};
 const mapaDo=t=>String(t?.mapaId||mapa?.mapId||'');
 const distM=(a,b,W,H)=>Math.hypot((Number(a.x)-Number(b.x))*W/28,(Number(a.y)-Number(b.y))*H/14);
 const hora=()=>{try{return win.mesaRelogio?.ativo?.()?Number(win.mesaRelogio.hora()):12;}catch(_){return 12;}};
 const textoDe=t=>{const raw=decodeURIComponent(String(t.id||'')),base=raw.split(':').slice(1).join(':').split('~')[0];
  const m=raw.startsWith('syncnpc:')?(dep.npcs?.()||[]).find(x=>String(x.id)===base):raw.startsWith('synccriatura:')?(dep.criaturas?.()||[]).find(x=>String(x.id)===base):null;
  return [t.nome,m?.nome,m?.carreira,m?.tipo,m?.especie,m?.comportamento,m?.habitat,m?.habilidadesTexto,m?.comerciante?'comerciante':''].join(' ');};
 // mapa de vida noturna (boate, cabaré, cassino, mercado negro…): os comerciantes de lá trabalham à noite
 const noturnoMapa=id=>{const {m}=dimsDe(id);return /boate|cabar[eé]|casa noturna|bordel|cassino|mercado negro|clandestin|contrabando/i.test(String(m?.nome||'')+' '+String(m?.descricao||''));};
 const selvagem=id=>{const {m}=dimsDe(id);return /ermos|caverna|natureza|floresta/.test(String(m?.geradoV110?.tipo||''))||/desert|ermo|floresta|caverna|selva|duna|oasis|oásis|pantano|pântano|mata|trilha/i.test(String(m?.nome||''));};
 const vivo=t=>{const s=saude?.actors?.[t.id]?.combateLab;return !(s?.morto||s?.inconsciente);};
 win.mesaNoiteV143={estado:id=>noite?.estados?.[id]||null,parado:id=>['dormindo','toca','ausente','recarga'].includes(noite?.estados?.[id]),guardaDormindo:id=>noite?.estados?.[id]==='dormindo'&&noite?.guardas?.includes?.(id)};

 // ------------------------------------------------------------ desenho (todos)
 function desenhar(){
  const b=board();if(!b)return;let cam=el('ntCamada');if(!cam||cam.parentElement!==b){cam?.remove();cam=root.createElement('div');cam.id='ntCamada';b.append(cam);}
  const m=ehMestre(),vis=mapaVisivel(),est=noite?.estados||{},css=[];let html='';
  for(const [id,modo] of Object.entries(est)){
   const t=posicoes.get(id);if(!t||mapaDo(t)!==vis)continue;
   const node=b.querySelector(`[data-token="${CSS_ESC(id)}"]`);
   if(!node)continue; // v197: sem miniatura neste mapa não há "dormindo" para mostrar (antes o zzZ aparecia no canto de todos os mapas)
   if(SOME_PARA_JOGADOR.has(modo)){if(!m){css.push(`#novaSyncBoard [data-token="${CSS_ESC(id)}"]{visibility:hidden!important;pointer-events:none!important}`);continue;}css.push(`#novaSyncBoard [data-token="${CSS_ESC(id)}"]{opacity:.35!important}`);}
   if(modo==='vigia'&&!m)continue;
   const x=node?parseFloat(node.style.left):Number(t.x)/28*100,y=node?parseFloat(node.style.top):Number(t.y)/14*100;
   const tit={dormindo:'Dormindo',toca:'Recolhido na toca (os jogadores não veem)',ausente:'Fora da banca até de manhã (os jogadores não veem)',recarga:'Recarregando',vigia:'De vigia (acordado)',acordado:'Acordou!'}[modo]||modo;
   html+=`<span class="nt-b" style="left:${x}%;top:${y}%" title="${esc(limpa(t.nome))} · ${esc(tit)}">${ICONE[modo]||''}</span>`;
  }
  if(cam.dataset.h!==html){cam.innerHTML=html;cam.dataset.h=html;}
  let st=el('ntEsconde');if(!st){st=root.createElement('style');st.id='ntEsconde';root.head.append(st);}const t=css.join('\n');if(st.textContent!==t)st.textContent=t;
  // 🤫 andar em silêncio: só aparece se há alguém dormindo no mapa que esta tela mostra
  const sc=b.parentElement,a=ator(),temSono=Object.entries(est).some(([id,md])=>['dormindo','toca'].includes(md)&&mapaDo(posicoes.get(id))===vis);
  let bt=el('ntSilencio');
  if(a&&temSono){if(!bt){bt=root.createElement('button');bt.type='button';bt.id='ntSilencio';bt.addEventListener('pointerdown',e=>e.stopPropagation());bt.addEventListener('click',alternarSilencio);sc.append(bt);if(getComputedStyle(sc).position==='static')sc.style.position='relative';}
   const on=!!noite?.silencio?.[a.id];bt.hidden=false;bt.classList.toggle('on',on);const tx=on?'🤫 Em silêncio':'🤫 Andar em silêncio';if(bt.textContent!==tx)bt.textContent=tx;
   bt.title=on?`${limpa(a.nome)} anda devagar e com cuidado: cada passo perto de quem dorme testa Furtividade. Clique para voltar ao normal.`:'Tem gente dormindo por perto. Ande em silêncio para não acordar ninguém (teste de Furtividade).';}
  else if(bt)bt.hidden=true;
 }
 const CSS_ESC=s=>String(s).replace(/["\\]/g,'\\$&');
 function ator(){try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 async function alternarSilencio(){
  const a=ator();if(!a)return;const novo=!noite?.silencio?.[a.id];
  noite={...noite,silencio:{...(noite.silencio||{}),[a.id]:novo}};desenhar();
  try{if(ehMestre())await dep.setDoc(D(NOITE),{silencio:{[a.id]:novo}},{merge:true});
   else await dep.setDoc(D(NOITE+'/acoes/'+(crypto.randomUUID?.()||Date.now().toString(36))),clean({donoUid:uid(),personagemId:decodeURIComponent(String(a.id)),tokenId:String(a.id),silencio:novo,criadoEm:Date.now()}));}catch(e){console.warn('[Noite] silêncio',e);}
 }

 // ------------------------------------------------------------ cálculo (mestre)
 async function furtividade(t){
  const c=furtCache.get(t.id);if(c&&Date.now()-c.em<120000)return c.v;
  let v=0;try{v=Number(await win.mesaPedagioV138_?.pericia?.(t,['Furtividade']))||0;}catch(_){}
  furtCache.set(t.id,{v,em:Date.now()});return v;
 }
 async function armadura(t){
  const c=armCache.get(t.id);if(c&&Date.now()-c.em<300000)return c.v;let v=0;
  try{const id=decodeURIComponent(String(t.id));if(!id.startsWith('sync')){const s=await dep.getDoc(D('personagens/'+id));v=s.exists()?pesoArmadura(s.data().inventario||{}):0;}}catch(_){}
  armCache.set(t.id,{v,em:Date.now()});return v;
 }
 async function registrar(msg){
  try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HIST)),h=s.exists()?s.data():{entries:[],revision:0};tx.set(D(HIST),clean({entries:[...(h.entries||[]),{id:'nt:'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),ts:Date.now(),actorUid:'',targetUid:'',message:msg}].slice(-120),revision:Number(h.revision||0)+1}));});}catch(_){}
 }
 function calcularEstados(){
  const h=hora(),agora=Date.now(),est={},guardas=[],porMapa=new Map();
  const npcs=[...posicoes.values()].filter(t=>!ehJogadorN(t)&&t.nome!==undefined&&vivo(t));
  for(const t of npcs){const tp=tipoDe(t.id,textoDe(t));let comp=false;try{comp=!!win.mesaCompanheiros?.ehCompanheiro?.(t.id);}catch(_){}if(comp||tp==='domestico'&&!ehNoite(h))continue;
   const mid=mapaDo(t);if(!porMapa.has(mid))porMapa.set(mid,[]);porMapa.get(mid).push({t,tp});}
  for(const [mid,lista] of porMapa){
   const combate=(String(mapa?.mapId)===mid&&mapa?.combat?.active)||(()=>{try{const rt=win.mesaTempoRealV111;return !!rt?.ativo?.()&&String(rt.estado?.()?.mapId||'')===mid;}catch(_){return false;}})();
   const gs=lista.filter(x=>x.tp==='guarda').map(x=>x.t.id),selv=selvagem(mid),noturnoAqui=noturnoMapa(mid);
   for(const {t,tp} of lista){
    if(combate)continue; // luta no mapa: todo mundo acordado
    if(Number(noite?.acordados?.[t.id]||0)>agora){est[t.id]='acordado';continue;}
    const md=modoRotina({id:t.id,tipo:tp==='domestico'?'npc':tp==='comerciante'&&noturnoAqui?'comerciante_noturno':tp,h,selvagemMapa:selv,guardasDoMapa:gs});if(md)est[t.id]=md;
    if(tp==='guarda')guardas.push(t.id);
   }
  }
  return {est,guardas,h};
 }
 // v158: quem dorme vai para casa — cama, beliche, cabana, barraca, tenda… do mesmo mapa — e não fica no meio do caminho.
 // Bêbados, guardas e robôs ficam onde estão. De manhã cada um volta ao ponto de onde saiu.
 const LEITO=/\b(cama|beliche|catre|esteira|rede de dormir|saco de dormir|colchao|colchão|capsula|cápsula|cabana|barraca|tenda|choupana|casebre|casa|quarto|dormitorio|dormitório|abrigo|alojamento)\b/i;
 const NAO_LEITO=/porta|placa|letreiro|cartaz|parede|muro|telhado|piso|escada|janela|banca|balc[aã]o/i;
 const BEBADO=/b[eê]bad|[ée]brio|embriagad|cachaceir/i;
 const cenasCache=new Map();
 async function objetosDoMapa(mid){
  const c=cenasCache.get(mid);if(c&&Date.now()-c.em<60000)return c.objs;let objs=[];
  try{const ativa=String(mapa?.mapId||'')===mid;const sn=await dep.getDoc(D(ativa?'combatesAtivos/mapaMesaSyncDiretaCena':'combatesAtivos/mapaMesaSyncCena_'+mid));const d=sn.exists()?sn.data():null;if(d&&String(d.mapId||mid)===mid)objs=d.objects||[];}catch(_){}
  cenasCache.set(mid,{objs,em:Date.now()});return objs;
 }
 async function irParaCasa(est,guardas){
  const casa={...(noite?.casa||{})};let mudou=false;const usados=new Map();
  for(const [id,modo] of Object.entries(est)){
   if(modo!=='dormindo'||casa[id]||guardas.includes(id))continue;const t=posicoes.get(id);if(!t)continue;
   const tp=tipoDe(id,textoDe(t));if(tp==='robo'||tp==='guarda'||BEBADO.test(textoDe(t)))continue;
   const mid=mapaDo(t),objs=await objetosDoMapa(mid),{W,H}=dimsDe(mid);
   const leitos=objs.filter(o=>!o.destruido&&LEITO.test(sem(o.nome||''))&&!NAO_LEITO.test(sem(o.nome||'')));if(!leitos.length)continue;
   const ocup=usados.get(mid)||[];usados.set(mid,ocup);
   const perto=leitos.map(o=>({o,d:distM(o,t,W,H),n:ocup.filter(q=>distM(q,o,W,H)<1.2).length})).sort((a,b)=>a.n-b.n||a.d-b.d)[0].o;
   const ehCama=/cama|beliche|catre|esteira|rede|saco|colch|capsul/i.test(sem(perto.nome||''));
   const bloq=objs.filter(o=>o!==perto&&o.bloqueiaMovimento&&!(Number(o?.andarV144??o?.oficinaElement?.andarV144??1)>1));
   const q=ehCama?{x:Number(perto.x),y:Number(perto.y)}:livrePerto([...bloq,...ocup.map(p=>({...p,larguraM:.9,alturaM:.9,bloqueiaMovimento:true}))],Number(perto.x),Number(perto.y),W,H,.45);
   ocup.push(q);casa[id]={x:Number(t.x),y:Number(t.y),mapaId:mid,em:Date.now()};mudou=true;
   try{await dep.setDoc(D(POS+'/'+id),{x:+q.x.toFixed(3),y:+q.y.toFixed(3),revision:Number(t.revision||0)+1},{merge:true});}catch(e){console.warn('[Noite] casa',e);}
  }
  // acordou / amanheceu: volta para onde estava
  for(const [id,v] of Object.entries(casa)){
   if(est[id]==='dormindo')continue;const t=posicoes.get(id);delete casa[id];mudou=true;
   if(t&&mapaDo(t)===String(v.mapaId))try{await dep.setDoc(D(POS+'/'+id),{x:Number(v.x),y:Number(v.y),revision:Number(t.revision||0)+1},{merge:true});}catch(_){}
  }
  if(mudou){noite={...noite,casa};await dep.setDoc(D(NOITE),{casa:clean(casa)},{merge:true});}
 }
 let calculando=false,ultimoEscrito='';
 async function passoMestre(){
  if(!ehMestre()||calculando)return;calculando=true;
  try{
   const {est,guardas,h}=calcularEstados();
   // 🔊 barulho: quem dorme perto de jogadores pode acordar
   const acordar=[];const agora=Date.now();
   const jogadores=[...posicoes.values()].filter(t=>ehJogadorN(t)&&vivo(t)&&t.nome!==undefined);
   for(const [id,modo] of Object.entries(est)){
    if(!['dormindo','toca','recarga'].includes(modo))continue;const s=posicoes.get(id);if(!s)continue;const mid=mapaDo(s),{W,H}=dimsDe(mid);
    const perto=jogadores.filter(p=>mapaDo(p)===mid);const viol=(violentos.get(mid)||0)>agora-6000;
    if(!perto.length&&!viol)continue;
    const ruidos=[];let culpado=null,maior=0,nota='';
    for(const p of perto){const d=distM(p,s,W,H);if(d>=12)continue;const a=antes.get(p.id),andando=!!a&&distM(a,p,W,H)>.25;
     let sil=null;if(noite?.silencio?.[p.id]&&andando&&d<9){const v=await furtividade(p),r=1+Math.floor(Math.random()*100);sil=r<=v?'ok':'falhou';if(sil==='falhou')nota=` (Furtividade de ${limpa(p.nome)}: ${r}/${v} — falhou)`;}
     const arm=await armadura(p);ruidos.push({dist:d,andando,armadura:arm,silencio:sil});const peso=(andando?1:.1)*(1+arm)*(1-d/12);if(peso>maior){maior=peso;culpado=p;}}
    const c=chanceDeAcordar(ruidos,{grupo:perto.length,violencia:viol,leve:modo==='recarga'||guardas.includes(id)});
    if(c>0&&Math.random()<c)acordar.push({id,s,culpado,viol,nota});
   }
   for(const p of jogadores)antes.set(p.id,{x:p.x,y:p.y});
   if(acordar.length){
    const ac={};for(const x of acordar){ac[x.id]=agora+20*60000;est[x.id]='acordado';}
    noite={...noite,acordados:{...(noite.acordados||{}),...ac}};
    await dep.setDoc(D(NOITE),{acordados:ac},{merge:true});
    for(const x of acordar)void registrar(`${ICONE.acordado} ${limpa(x.s.nome)} acordou${x.viol?' com a confusão':x.culpado?' com o barulho de '+limpa(x.culpado.nome):''}!${x.nota}`);
   }
   try{await irParaCasa(est,guardas);}catch(e){console.warn('[Noite] casa',e);}
   const k=JSON.stringify([est,guardas]);
   if(k!==ultimoEscrito){ultimoEscrito=k;
    // o documento inteiro é regravado (estados que acabaram precisam sumir); acordados vencidos saem
    const ac=Object.fromEntries(Object.entries(noite.acordados||{}).filter(([,v])=>Number(v)>=Date.now()));
    noite={...noite,estados:est,guardas,hora:h,acordados:ac};
    await dep.setDoc(D(NOITE),clean({estados:est,guardas,hora:h,acordados:ac,silencio:noite.silencio||{},casa:noite.casa||{},em:Date.now()}));}
  }catch(e){console.warn('[Noite]',e);}finally{calculando=false;}
 }
 async function processar(id,cmd){
  try{if(cmd.tokenId)await dep.setDoc(D(NOITE),{silencio:{[String(cmd.tokenId)]:!!cmd.silencio}},{merge:true});}catch(e){console.warn('[Noite] pedido',e);}
  try{await dep.deleteDoc?.(D(NOITE+'/acoes/'+id));}catch(_){}
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(NOITE),s=>{noite={estados:{},silencio:{},acordados:{},...(s.exists()?s.data():{})};desenhar();},()=>{}));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(dep.collection(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes'),q=>{const n=new Map();q.forEach(d=>n.set(d.id,{...d.data(),id:d.id}));posicoes=n;},()=>{}));
  if(ehMestre()){
   parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;},()=>{}));
   parar.push(dep.onSnapshot(D(HIST),s=>{const h=s.exists()?s.data():null,es=h?.entries||[];const novos=es.filter(e=>Number(e.ts||0)>ultimoHist);if(ultimoHist&&novos.some(e=>VIOLENCIA.test(String(e.message||''))&&!/^nt:/.test(String(e.id||'')))){
     const ms=new Set([String(mapa?.mapId||'')]);try{const rt=win.mesaTempoRealV111;if(rt?.ativo?.())ms.add(String(rt.estado?.()?.mapId||''));}catch(_){}for(const m of ms)if(m)violentos.set(m,Date.now());}
    ultimoHist=Math.max(ultimoHist||Date.now(),...es.map(e=>Number(e.ts||0)));},()=>{}));
   parar.push(dep.onSnapshot(dep.collection(dep.db,'combatesAtivos','mesaNoite','acoes'),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},()=>{}));
  }
 }
 let voltas=0;
 const vigia=setInterval(()=>{
  try{if(!uid())return;const k=uid()+'|'+ehMestre();if(k!==assinado){assinado=k;assinar();}
   desenhar();if(ehMestre()&&++voltas%4===0)void passoMestre();}catch(e){console.warn('[Noite]',e);}
 },800);
 return {parar:()=>{clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});},calcularEstados,passoMestre};
}
