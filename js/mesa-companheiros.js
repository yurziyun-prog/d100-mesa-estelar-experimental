// Mesa Estelar v127 — Companheiros que acompanham o dono no mapa.
//
// • Animais e drones companheiros (ex.: a Galinha do Sérgio) seguem o dono: quando ele anda,
//   o companheiro vai atrás, desviando de paredes; quando o dono troca de mapa, o companheiro vai junto.
// • Em perigo (combate por turnos ou em tempo real, com inimigo por perto) quem não luta FOGE
//   para longe dos inimigos — e volta para perto do dono quando o perigo passa. Companheiros
//   combatentes (ex.: lobo) ficam do lado do grupo no tempo real.
// • Quem é companheiro de quem: pelo nome ("Galinha do Sérgio" → Sérgio Leone), pela lista de
//   companheiros da ficha, ou escolhido pelo mestre no painel 🐾 (que também liga/desliga o seguir).
// Tudo roda no navegador do mestre. Módulo à parte: se falhar, o mapa segue igual.

import {montarGrade,caminho,avancar,pontoDeFuga,paraMetros,deMetros,hostis,faccaoDe} from './mesa-tempo-real-ia.js?v=131';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/^(npc|monstro|pj|pm)\s*[·:-]\s*/,'').trim();
const clean=v=>JSON.parse(JSON.stringify(v??null));
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',HIST='combatesAtivos/mapaMesaSyncHistorico';
export const PARES='combatesAtivos/mesaCompanheiros';
export const DIST_SEGUIR=1.4,RAIO_PERIGO=6;

const ehPJ=t=>!!t&&(!!t.donoUid||!decodeURIComponent(String(t.id||'')).startsWith('sync'));
const modeloId=t=>decodeURIComponent(String(t?.id||'')).replace(/^sync(criatura|npc):/,'').split('~')[0];
// O texto do modelo diz que é companheiro?
export function pareceCompanheiro(m={}){return /companheir|segue .* para todo lado|animal de estima/i.test([m.especie,m.habilidadesTexto,m.comportamento,m.habitat,m.categoria].join(' '));}
// "Galinha do Sérgio" → token do Sérgio Leone (pelo primeiro nome depois de do/da/de)
export function donoPeloNome(nome,pjs=[]){
 const m=/\bd[aoe]s?\s+([a-zÀ-ſ]+(?:\s+[a-zÀ-ſ]+)?)\s*$/i.exec(sem(nome));if(!m)return null;
 const alvo=m[1].split(/\s+/);
 return pjs.find(p=>{const n=sem(p.nome).split(/\s+/);return n[0]===alvo[0]&&(!alvo[1]||n.includes(alvo[1]));})||null;
}
// Ponto atrás do dono (em metros) para onde o companheiro vai.
export function pontoAtras(dono,W,H,dist=1.1){
 const p=paraMetros(dono,W,H),f=Number.isFinite(Number(dono.facing))?Number(dono.facing):0;
 return {x:Math.max(.5,Math.min(W-.5,p.x-Math.cos(f)*dist)),y:Math.max(.5,Math.min(H-.5,p.y-Math.sin(f)*dist))};
}
export function distM(a,b,W,H){const A=paraMetros(a,W,H),B=paraMetros(b,W,H);return Math.hypot(A.x-B.x,A.y-B.y);}

const ESTILO=`
#cpBotao{position:absolute;left:386px;top:8px;z-index:31;height:28px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:12px 'Segoe UI',Arial,sans-serif;cursor:pointer;padding:0 10px}
#cpPainel{position:absolute;z-index:9001;width:min(340px,calc(100vw - 24px));padding:10px 12px;border-radius:12px;background:rgba(9,15,29,.97);border:1px solid #b07cff;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.55)}
#cpPainel[hidden]{display:none}
#cpPainel h4{margin:0 0 6px;display:flex;align-items:center;gap:6px;color:#d6b6ff}
#cpPainel h4 span{flex:1}
#cpPainel .cp-par{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;padding:5px 6px;border-radius:8px;background:rgba(255,255,255,.04);margin:4px 0;font-size:12px}
#cpPainel select{height:28px!important;padding:0 6px!important;margin:0!important;width:auto!important;max-width:150px;background:#0b1322;color:#e8eefc;border:1px solid #3b5878;border-radius:8px;font:12px 'Segoe UI',Arial,sans-serif!important}
#cpPainel button{height:28px;border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#e8eefc;cursor:pointer;font:12px 'Segoe UI',Arial,sans-serif;padding:0 8px}
#cpPainel .cp-aj{color:#9fb3cc;font-size:11px;margin-top:6px}
#novaSyncBoard [data-token].cp-fugindo::before{content:'💨';position:absolute;right:-10px;top:-12px;font-size:14px;z-index:13;pointer-events:none}
`;

export function instalarCompanheiros(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const el=id=>root.getElementById(id);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 if(!el('cpCssV127')){const st=root.createElement('style');st.id='cpCssV127';st.textContent=ESTILO;root.head.append(st);}
 let manuais={},mapa=null,cena=null,cenaSalva=null,saude=null,parar=[],assinado=null,painel=null,grade=null,gradeChave='';
 const ultimo=new Map(),escrevendo=new Set(),fugindo=new Set(),avisou=new Set();
 const tokens=()=>{try{return ctl()?.tokensNoMapa?.()||[];}catch(_){return [];}};
 const todos=()=>{try{return ctl()?.todosTokens?.()||tokens();}catch(_){return tokens();}};
 const dims=()=>ctxMapa&&String(ctxMapa)!==String(mapa?.mapId||'')?dimsDe(ctxMapa):({W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14});
 const modelo=t=>{const id=modeloId(t);return (dep.criaturas?.()||[]).find(c=>String(c.id)===id)||(dep.npcs?.()||[]).find(c=>String(c.id)===id)||null;};

 // ------------------------------------------------------------ quem segue quem
 // v203: o cálculo é O(n²) e era refeito a cada pergunta (vida, tempo real, desenho…): agora guarda o resultado por 600 ms
 let cacheP=null,cacheT=0,cacheN=-1;
 function pares(){
  const agora=Date.now(),n=todos().length;
  if(cacheP&&agora-cacheT<600&&n===cacheN)return cacheP;
  cacheP=calcularPares();cacheT=agora;cacheN=n;return cacheP;
 }
 function calcularPares(){
  const lista=todos(),pjs=lista.filter(ehPJ),out=new Map();
  for(const t of lista){
   if(ehPJ(t))continue;const man=manuais[t.id];
   if(man){if(man.ativo!==false&&lista.some(p=>p.id===man.dono))out.set(t.id,{comp:t,dono:lista.find(p=>p.id===man.dono),funcao:man.funcao||'fugir',manual:true});continue;}
   const m=modelo(t);let dono=donoPeloNome(t.nome,pjs);
   if(!dono){// lista de companheiros da ficha do personagem
    for(const p of pjs){const ficha=(dep.personagens?.()||[]).find(c=>String(c.id)===decodeURIComponent(String(p.id)));if((ficha?.companheiros||[]).some(c=>{const n=sem(c?.nome||c?.modelo?.nome);return n&&(sem(t.nome)===n||sem(t.nome).startsWith(n));})){dono=p;break;}}
   }
   if(!dono||!(pareceCompanheiro(m||{})||donoPeloNome(t.nome,pjs)))continue;
   out.set(t.id,{comp:t,dono,funcao:/lobo|cao|cão|combatente|guarda/i.test(sem([m?.especie,m?.habilidadesTexto,t.nome].join(' ')))?'lutar':'fugir'});
  }
  return out;
 }
 win.mesaCompanheiros={ehCompanheiro:id=>pares().has(String(id)),naoLuta:id=>pares().get(String(id))?.funcao==='fugir',pares};

 // ------------------------------------------------------------ movimento (mestre)
 // v143: companheiros seguem o dono em qualquer mapa (não só no que o mestre está olhando)
 let ctxMapa=null;const cenasArq=new Map(),ouvindo=new Map(),grades=new Map();
 const dimsDe=id=>{if(String(id)===String(mapa?.mapId||''))return {W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14};const m=(dep.mapas?.()||[]).find(x=>String(x.id)===String(id));return {W:Number(m?.larguraM)||28,H:Number(m?.alturaM)||14};};
 function objsDe(id){if(String(id)===String(mapa?.mapId||''))return (cena&&String(cena.mapId||'')===String(id)?cena.objects:[])||[];
  if(!ouvindo.has(id))ouvindo.set(id,dep.onSnapshot(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)),s=>{cenasArq.set(id,s.exists()?s.data()?.objects||[]:[]);},()=>{}));return cenasArq.get(id)||[];}
 function gradeAtual(){
  if(ctxMapa&&String(ctxMapa)!==String(mapa?.mapId||'')){const id=String(ctxMapa),{W,H}=dimsDe(id),objs=objsDe(id).filter(o=>o?.bloqueiaMovimento&&!o.destruido&&Number(o.camada||3)===3&&!(Number(o?.andarV144??o?.oficinaElement?.andarV144??1)>1)),k=W+'x'+H+':'+objs.length;const g=grades.get(id);if(g?.k===k)return g.grade;
   const nova=montarGrade(objs.map(o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),W,H);grades.set(id,{k,grade:nova});return nova;}
  const {W,H}=dims(),objs=(cena&&String(cena.mapId||'')===String(mapa?.mapId||'')?cena.objects:[])||[];
  const k=W+'x'+H+':'+(cena?.mapId||'')+':'+objs.filter(o=>o.bloqueiaMovimento&&!o.destruido).map(o=>o.id+o.x+o.y).join(',');
  if(k!==gradeChave){gradeChave=k;grade=montarGrade(objs.filter(o=>o?.bloqueiaMovimento&&!o.destruido&&Number(o.camada||3)===3&&!(Number(o?.andarV144??o?.oficinaElement?.andarV144??1)>1)).map(o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),W,H);}
  return grade;
 }
 function emPerigo(par){
  const rt=win.mesaTempoRealV111,ativoRT=!!rt?.ativo?.()&&!rt.estado?.()?.pausado,turnos=!!mapa?.combat?.active;if(!ativoRT&&!turnos)return [];
  const {W,H}=dims(),fac=rt?.estado?.()?.faccoes||{},ps=pares();
  return tokens().filter(o=>o.id!==par.comp.id&&!ehPJ(o)&&!ps.has(o.id)&&String(o.mapaId||mapa?.mapId)===String(mapa?.mapId)&&!saude?.actors?.[o.id]?.combateLab?.morto&&(ativoRT?hostis(faccaoDe(o,fac),'grupo',false):true)&&(distM(o,par.comp,W,H)<RAIO_PERIGO||distM(o,par.dono,W,H)<RAIO_PERIGO));
 }
 async function escrever(t,p,facing){
  if(escrevendo.has(t.id))return;escrevendo.add(t.id);
  try{await dep.setDoc(D(POS+'/'+t.id),{x:Number(p.x.toFixed(3)),y:Number(p.y.toFixed(3)),facing:Number(facing.toFixed(3)),revision:Number(t.revision||0)+1},{merge:true});}
  catch(e){console.warn('[Companheiros]',e);}finally{escrevendo.delete(t.id);}
 }
 async function registrar(msg){
  try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HIST)),h=s.exists()?s.data():{entries:[],revision:0};tx.set(D(HIST),clean({entries:[...(h.entries||[]),{id:'cp:'+Date.now().toString(36),ts:Date.now(),actorUid:'',targetUid:'',message:msg}].slice(-120),revision:Number(h.revision||0)+1}));});}catch(_){}
 }
 async function trocarDeMapa(par){
  const d=par.dono;await dep.setDoc(D(POS+'/'+par.comp.id),{mapaId:String(d.mapaId||''),x:Math.max(.4,Math.min(27.6,Number(d.x)-.9)),y:Number(d.y),revision:Number(par.comp.revision||0)+1},{merge:true});
 }
 async function passo(){
  if(!ehMestre()||!mapa?.mapId)return;
  const agora=Date.now(),ps=pares();
  for(const par of ps.values()){ctxMapa=String(par.comp.mapaId||mapa.mapId);const {W,H}=dims();
   const {comp,dono}=par;if(saude?.actors?.[comp.id]?.combateLab?.morto||saude?.actors?.[comp.id]?.combateLab?.inconsciente)continue;
   if(dono.mapaId&&comp.mapaId&&String(dono.mapaId)!==String(comp.mapaId)){if(!escrevendo.has(comp.id)){escrevendo.add(comp.id);try{await trocarDeMapa(par);}finally{escrevendo.delete(comp.id);}}continue;}
   // (v143: segue em qualquer mapa onde o dono esteja)
   const dt=Math.min(.8,(agora-(ultimo.get(comp.id)||agora-450))/1000);ultimo.set(comp.id,agora);
   const m=modelo(comp),vel=Math.max(1.8,(Number(m?.movimentoTerrestre||m?.deslocamento)||4)/5*1.8);
   const perigo=par.funcao==='fugir'?emPerigo(par):[];
   let alvo=null;
   if(perigo.length){
    if(!fugindo.has(comp.id)){fugindo.add(comp.id);const k=comp.id+':'+(mapa.combat?.session||win.mesaTempoRealV111?.estado?.()?.iniciadoEm||'');if(!avisou.has(k)){avisou.add(k);void registrar(`💨 ${String(comp.nome||'O companheiro').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'')} foge do perigo${/galinha/i.test(comp.nome)?' cacarejando!':'!'}`);}}
    const f=pontoDeFuga(comp,perigo,gradeAtual(),W,H,4);if(f)alvo=f;
   }else{
    fugindo.delete(comp.id);
    if(distM(comp,dono,W,H)<=DIST_SEGUIR+(Number(dono.diametroM)||1)/2)continue;
    alvo=pontoAtras(dono,W,H,(Number(dono.diametroM)||1)/2+.6);
   }
   if(!alvo)continue;
   const de=paraMetros(comp,W,H);if(Math.hypot(alvo.x-de.x,alvo.y-de.y)<.15)continue;
   const pts=caminho(gradeAtual(),de,alvo);const novo=pts.length?avancar(de,pts,vel*dt):null;if(!novo)continue;
   const n=deMetros(novo,W,H),facing=Math.atan2(novo.y-de.y,novo.x-de.x);
   void escrever(comp,{x:Math.max(.2,Math.min(27.8,n.x)),y:Math.max(.2,Math.min(13.8,n.y))},facing);
  }
  ctxMapa=null;
  // marca visual de quem está fugindo
  const b=el('novaSyncBoard');if(b)for(const node of b.querySelectorAll('[data-token]'))node.classList.toggle('cp-fugindo',fugindo.has(node.dataset.token));
 }

 // ------------------------------------------------------------ painel do mestre
 function desenharBotao(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;if(!sc)return;let bt=el('cpBotao');
  if(!ehMestre()||!mapa?.mapId){bt?.remove();return;}
  if(!bt){bt=root.createElement('button');bt.type='button';bt.id='cpBotao';bt.title='Companheiros: quem segue quem (animais, drones)';bt.addEventListener('pointerdown',e=>e.stopPropagation());bt.addEventListener('click',()=>abrirPainel());if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(bt);}
  const n=pares().size,t='🐾 Companheiros'+(n?' ('+n+')':'');if(bt.textContent!==t)bt.textContent=t;
 }
 function abrirPainel(){
  if(!painel){painel=root.createElement('div');painel.id='cpPainel';painel.hidden=true;root.body.append(painel);painel.addEventListener('pointerdown',e=>e.stopPropagation());painel.addEventListener('click',aoClicar);}
  painel.hidden=!painel.hidden;if(painel.hidden)return;desenharPainel();
  const r=el('cpBotao').getBoundingClientRect();painel.style.left=Math.round(r.left+win.scrollX)+'px';painel.style.top=Math.round(r.bottom+6+win.scrollY)+'px';
 }
 const nome=t=>String(t?.nome||t?.id||'').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 function desenharPainel(){
  if(!painel||painel.hidden)return;const ps=pares(),lista=tokens(),pjs=lista.filter(ehPJ),outros=lista.filter(t=>!ehPJ(t));
  let h=`<h4>🐾 <span>Companheiros</span><button type="button" data-fechar>✕</button></h4>`;
  h+=[...ps.values()].map(p=>`<div class="cp-par"><span>${esc(nome(p.comp))} → ${esc(nome(p.dono))}${p.manual?'':' <small style="color:#9fb3cc">(automático)</small>'}</span><select data-funcao="${esc(p.comp.id)}"><option value="fugir"${p.funcao==='fugir'?' selected':''}>💨 foge do perigo</option><option value="lutar"${p.funcao==='lutar'?' selected':''}>⚔️ luta junto</option></select><button type="button" data-soltar="${esc(p.comp.id)}" title="Para de seguir">✕</button></div>`).join('')||'<div class="cp-aj">Nenhum companheiro no mapa.</div>';
  h+=`<div class="cp-par" style="grid-template-columns:1fr 1fr auto"><select data-novo-comp>${outros.map(t=>`<option value="${esc(t.id)}">${esc(nome(t))}</option>`).join('')}</select><select data-novo-dono>${pjs.map(t=>`<option value="${esc(t.id)}">${esc(nome(t))}</option>`).join('')}</select><button type="button" data-ligar>＋ Seguir</button></div>
   <div class="cp-aj">O companheiro anda atrás do dono, troca de mapa junto e, se não luta, foge quando há inimigo por perto em combate.</div>`;
  if(painel.dataset.h!==h&&!painel.contains(root.activeElement)){painel.innerHTML=h;painel.dataset.h=h;}
 }
 async function salvar(novo){manuais=novo;cacheP=null;await dep.setDoc(D(PARES),clean({pares:novo,atualizadoEm:Date.now()}));painel.dataset.h='';desenharPainel();}
 async function aoClicar(e){
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.fechar!==undefined){painel.hidden=true;return;}
  if(b.dataset.soltar){await salvar({...manuais,[b.dataset.soltar]:{...(manuais[b.dataset.soltar]||{}),dono:pares().get(b.dataset.soltar)?.dono?.id||'',ativo:false}});return;}
  if(b.dataset.ligar!==undefined){const c=painel.querySelector('[data-novo-comp]')?.value,d=painel.querySelector('[data-novo-dono]')?.value;if(c&&d)await salvar({...manuais,[c]:{dono:d,funcao:'fugir',ativo:true}});}
 }
 root.addEventListener('change',async e=>{const s=e.target;if(!painel?.contains(s)||!s.dataset.funcao)return;const p=pares().get(s.dataset.funcao);if(!p)return;s.blur();await salvar({...manuais,[s.dataset.funcao]:{dono:p.dono.id,funcao:s.value,ativo:true}});});

 // ------------------------------------------------------------ assinaturas
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(PARES),s=>{manuais=s.exists()?(s.data()?.pares||{}):{};cacheP=null;},e=>console.warn('[Companheiros]',e)));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},e=>console.warn('[Companheiros] mapa',e)));
  if(ehMestre()){parar.push(dep.onSnapshot(D(SCENE),s=>{cenaSalva=s.exists()?s.data():null;cena=globalThis.mesaRascunhoCenaV197_?.(cenaSalva)||cenaSalva;},()=>{}));globalThis.addEventListener('mesa-rascunho-v197',()=>{cena=globalThis.mesaRascunhoCenaV197_?.(cenaSalva)||cenaSalva;});parar.push(dep.onSnapshot(D('combatesAtivos/mapaMesaSyncSaude'),s=>{saude=s.exists()?s.data():null;},()=>{}));}
 }
 root.addEventListener('pointerdown',e=>{if(painel&&!painel.hidden&&!painel.contains(e.target)&&e.target.id!=='cpBotao')painel.hidden=true;});
 let voltas=0;
 const vigia=setInterval(()=>{
  try{if(!uid())return;const k=uid()+'|'+ehMestre();if(assinado!==k){assinado=k;assinar();}
   void passo();if(++voltas%3===0){desenharBotao();desenharPainel();}}catch(e){console.warn('[Companheiros]',e);}
 },450);
 return {pares,parar:()=>{clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});}};
}
