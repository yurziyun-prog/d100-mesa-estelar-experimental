import {acomodarPainelMapa} from './mesa-paineis-layout.js';
// Mesa Estelar v140 — Posturas (em pé, agachado, rastejando, caído) e o berro sonoro (Trombeta): empurrão, queda e surdez.
//
// Postura fica em mapaMesaSyncSaude.actors[id].postura ("caído" também liga combateLab.caido/derrubado, que a ficha já entende).
//  • em pé: normal · agachado: anda pela metade, +10 de defesa contra tiros e áreas
//  • rastejando: anda a ¼, +20 contra tiros/áreas, −20 contra corpo a corpo · caído: não anda até levantar (mesmos modificadores)
// O jogador escolhe a postura (botões ao lado do mapa); o mestre resolve o pedido.
// Berro sonoro (ataque com "trombeta", "berro", "bramido" ou propriedade sonora) que conecta: empurra o alvo para longe da
// boca de quem berrou (menos se ele for grande), teste de Atletismo para não cair e surdez por 1d20 rodadas.

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',HEALTH='combatesAtivos/mapaMesaSyncSaude',HIST='combatesAtivos/mapaMesaSyncHistorico';
export const PEDIDOS='combatesAtivos/mesaPosturas/acoes';
export const POSTURAS={
 em_pe:{icone:'🧍',nome:'Em pé',vel:1,dica:'Em pé: movimento normal.'},
 agachado:{icone:'🧎',nome:'Agachado',vel:.5,dica:'Agachado: anda pela metade; +10 na defesa contra tiros e ataques em área.'},
 rastejando:{icone:'🐍',nome:'Rastejando',vel:.25,dica:'Rastejando: anda a ¼; +20 na defesa contra tiros e áreas; −20 contra corpo a corpo.'},
 caido:{icone:'🛌',nome:'Deitado / caído',vel:0,dica:'Deitado/caído: não anda; +20 contra tiros e áreas; −20 contra corpo a corpo. Levantar leva 1 Ação (turno) ou ~2 s (tempo real).'}
};
export const LEVANTAR_MS=2000;
// Postura efetiva de alguém pela saúde (o "caído" da ficha manda).
export function posturaDe(a,agora=Date.now()){
 if(!a)return 'em_pe';const cl=a.combateLab||{};
 if(a.levantandoAte&&Number(a.levantandoAte)>agora)return 'levantando';
 if(cl.caido||cl.derrubado)return 'caido';
 const p=String(a.postura||'em_pe');return p==='caido'?'em_pe':(POSTURAS[p]?p:'em_pe');
}
export const velocidadePostura=p=>p==='levantando'?0:(POSTURAS[p]?.vel??1);
// Ataque sonoro (berro da Trombeta) que conectou: devolve {dano} ou null.
export function berroConectou(ev){
 if(!ev?.source||!ev?.target||ev.source.id===ev.target.id)return null;
 const msg=String(ev.message||''),arma=ev.item?.nome||msg.split(':').slice(1).join(':').split('·').slice(0,2).join(' '),txt=sem(arma+' '+(ev.sonoro?'sonoro':'')); // o nome de quem ataca (ex.: Dragão-Trombeta) não conta
 if(/psiquic/.test(txt)||!/trombeta|berro|bramid|sonic|sonor|rugido sonoro/.test(txt))return null;
 const m=/dano rolado (\d+)/.exec(sem(msg));if(!m)return null;
 return {dano:Number(m[1])||0};
}
// Distância do empurrão (m): 1 + dano/3, até 5; criaturas grandes são menos empurradas.
export function distanciaEmpurrao(dano,diametroM=1){const base=Math.min(5,1+Number(dano||0)/3),d=Number(diametroM)||1;return +(base/Math.max(1,d*.8)).toFixed(2);}
// Caminho do empurrão em passos de 0,25 m, parando antes de parede/objeto que bloqueia ou outra miniatura.
export function empurrar({de,alvo,dist,W=28,H=14,objetos=[],tokens=[],raio=.45}){
 const mx=p=>({x:p.x*W/28,y:p.y*H/14}),a=mx(de),b=mx(alvo);let dx=b.x-a.x,dy=b.y-a.y;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
 const bloq=objetos.filter(o=>o?.bloqueiaMovimento&&!o.destruido&&Number(o.camada??3)===3&&!(Number(o?.andarV144??o?.oficinaElement?.andarV144??1)>1)).map(o=>({...mx(o),w:(Number(o.larguraM)||1)/2,h:(Number(o.alturaM)||1)/2}));
 const outros=tokens.map(mx);let p={...b},bateu='';
 for(let s=.25;s<=dist+1e-9;s+=.25){const q={x:b.x+dx*s,y:b.y+dy*s};
  if(q.x<raio||q.y<raio||q.x>W-raio||q.y>H-raio){bateu='borda';break;}
  if(bloq.some(o=>Math.abs(q.x-o.x)<o.w+raio&&Math.abs(q.y-o.y)<o.h+raio)){bateu='parede';break;}
  if(outros.some(o=>Math.hypot(q.x-o.x,q.y-o.y)<raio*2)){bateu='alguém';break;}
  p=q;}
 return {x:p.x*28/W,y:p.y*14/H,andou:+Math.hypot(p.x-b.x,p.y-b.y).toFixed(2),bateu};
}

export function instalarPosturas(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let saude=null,mapa=null,cena=null,hist=null,parar=[],assinado='',barra=null,camada=null,primeiraHist=true;
 const vistos=new Set(),processados=new Set(),caidoDesde=new Map();
 const dims=()=>({W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14});
 const nomeDe=t=>String(t?.nome||'Alguém').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 const rtAtivo=()=>{try{return !!win.mesaTempoRealV111?.ativo?.();}catch(_){return false;}};
 win.mesaPosturaVelocidadeV140=id=>velocidadePostura(posturaDe(saude?.actors?.[id]));
 function ator(){const c=ctl();try{const t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}

 // ------------------------------------------------------------ interface
 const CSS=`#psBarra{position:absolute;left:8px;bottom:112px;z-index:33;display:flex;flex-direction:column;gap:4px;padding:4px;border-radius:12px;background:rgba(9,15,29,.82);border:1px solid #3b5878}
#psBarra button{width:32px;height:32px;border-radius:9px;border:1px solid #2f4664;background:#16233a;color:#fff;font-size:17px;cursor:pointer;padding:0}
#psBarra button[aria-pressed="true"]{border-color:#ffd447;background:#3a2e14}
#psBarra button:disabled{opacity:.45;cursor:not-allowed}
#psBarra .ps-tg{height:18px;font-size:11px;color:#9fb3cc;background:transparent;border-color:transparent}
#psCamada{position:absolute;inset:0;pointer-events:none;z-index:32}
#psCamada span{position:absolute;transform:translate(10px,-26px);font-size:14px;filter:drop-shadow(0 0 2px #000)}`;
 if(!root.getElementById('psCss')){const st=root.createElement('style');st.id='psCss';st.textContent=CSS;root.head.append(st);}
 let psMem=null;
 const psAberto=()=>{if(psMem!==null)return psMem;try{return win.localStorage?.getItem('mesa:posturasAberto')==='1';}catch(_){return false;}};
 const psAlternar=()=>{psMem=!psAberto();try{win.localStorage?.setItem('mesa:posturasAberto',psMem?'1':'0');}catch(_){}};
 function desenhar(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;
  // selos de postura e surdez em cima das miniaturas
  if(!camada||camada.parentElement!==b){camada?.remove();camada=root.createElement('div');camada.id='psCamada';b.append(camada);}
  const agora=Date.now();let h='';
  for(const t of (ctl()?.tokensNoMapa?.()||[])){const a=saude?.actors?.[t.id],p=posturaDe(a,agora),surdo=surdoAgora(a,agora);
   const s=(p==='levantando'?'⬆️':p!=='em_pe'?POSTURAS[p]?.icone||'':'')+(surdo?'🔇':'');if(s)h+=`<span style="left:${Number(t.x)/28*100}%;top:${Number(t.y)/14*100}%" title="${p!=='em_pe'?(POSTURAS[p]?.nome||'Levantando'):''}${surdo?' · surdo':''}">${s}</span>`;}
  if(camada.dataset.h!==h){camada.innerHTML=h;camada.dataset.h=h;}
  // botões de postura do personagem selecionado
  const a=ator(),sc=b.parentElement;
  if(!a){barra?.remove();barra=null;return;}
  if(!barra||!barra.isConnected){barra?.remove();barra=root.createElement('div');barra.id='psBarra';if(getComputedStyle(sc).position==='static')sc.style.position='relative';
   barra.addEventListener('pointerdown',e=>e.stopPropagation());barra.addEventListener('click',e=>{const bt=e.target.closest('button');if(!bt||bt.disabled)return;if(bt.dataset.tg!==undefined||(!psAberto()&&bt.dataset.atual!==undefined)){psAlternar();barra.dataset.h='';desenhar();return;}void pedir(bt.dataset.p);});acomodarPainelMapa(root,barra);}
  const atual=posturaDe(saude?.actors?.[a.id]),morto=saude?.actors?.[a.id]?.combateLab?.inconsciente||saude?.actors?.[a.id]?.combateLab?.morto;
  // v146: recolhido mostra só a postura atual (clique abre); aberto mostra todas e ▾ recolhe — não atrapalha o mapa
  const vAtual=POSTURAS[atual]||{icone:'⬆️',nome:'Levantando',dica:'Levantando'};
  const hh=psAberto()?Object.entries(POSTURAS).map(([k,v])=>`<button type="button" data-p="${k}" title="${v.dica}" aria-label="${v.nome}" aria-pressed="${atual===k}" ${morto||atual==='levantando'?'disabled':''}>${v.icone}</button>`).join('')+'<button type="button" class="ps-tg" data-tg title="Recolher as posturas">▾</button>'
   :`<button type="button" data-atual title="Postura: ${vAtual.nome}. Clique para mudar (de pé, agachado, rastejando, deitado)" aria-label="Postura: ${vAtual.nome}" aria-pressed="true">${vAtual.icone}</button>`;
  if(barra.dataset.h!==hh){barra.innerHTML=hh;barra.dataset.h=hh;}
 }
 const surdoAgora=(a,agora=Date.now())=>!!a?.surdo&&((Number(a.surdo.ate)||0)>agora||(Number(a.surdo.ateRodada)||0)>(Number(mapa?.combat?.round)||0)&&!!mapa?.combat?.active);
 async function pedir(postura){
  const a=ator();if(!a||!POSTURAS[postura])return;
  const atual=posturaDe(saude?.actors?.[a.id]);if(atual===postura)return;
  // no combate por turnos, levantar de caído é a ação "Levantar" (1 Ação) do próprio sistema
  if(atual==='caido'&&mapa?.combat?.active){try{await ctl()?.suporte?.({kind:'direct-stand',actorId:a.id,targetId:a.id});}catch(e){console.warn('[Posturas]',e);}if(postura==='em_pe')return;}
  const cmd={donoUid:uid(),personagemId:decodeURIComponent(String(a.id)),postura,criadoEm:Date.now()};
  if(ehMestre())await aplicar('local'+Date.now(),cmd);else await dep.setDoc(D(PEDIDOS+'/p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),cmd);
 }
 // ------------------------------------------------------------ mestre: aplica posturas, berros e levanta NPCs no tempo real
 async function gravarAtor(id,f,msg){
  await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HEALTH)),hp=s.exists()?s.data():{actors:{},revision:0};const actors={...(hp.actors||{})};actors[id]=f({...(actors[id]||{})});
   tx.set(D(HEALTH),clean({...hp,actors,revision:Number(hp.revision||0)+1}));
   if(msg){const h=await tx.get(D(HIST)),hh=h.exists()?h.data():{entries:[],revision:0};tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'ps:'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),ts:Date.now(),actorUid:'',targetUid:'',message:msg}].slice(-120),revision:Number(hh.revision||0)+1}));}});
 }
 async function aplicar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);
  try{
   const id=encodeURIComponent(String(cmd.personagemId||'')),t=ctl()?.token?.(id)||(ctl()?.todosTokens?.()||[]).find(x=>x.id===id);if(!t)throw Error('Personagem não está no mapa.');
   if(!String(pid).startsWith('local')&&String(t.donoUid||'')!==String(cmd.donoUid||''))throw Error('Pedido de quem não controla o personagem.');
   const p=String(cmd.postura),antes=posturaDe(saude?.actors?.[t.id]);if(!POSTURAS[p])throw Error('Postura inválida.');
   const levantar=antes==='caido'&&p!=='caido';
   await gravarAtor(t.id,a=>{const cl={...(a.combateLab||{})};if(p==='caido'){cl.caido=true;cl.derrubado=true;}else{cl.caido=false;cl.derrubado=false;}
    const n={...a,postura:p,...(a.combateLab?{combateLab:cl}:p==='caido'?{combateLab:cl}:{})};if(levantar&&!mapa?.combat?.active)n.levantandoAte=Date.now()+LEVANTAR_MS;else delete n.levantandoAte;return n;},
    `${POSTURAS[p].icone} ${nomeDe(t)}: ${levantar?'levanta-se'+(p!=='em_pe'?' e fica '+POSTURAS[p].nome.toLowerCase():''):POSTURAS[p].nome.toLowerCase()}.`);
  }catch(e){console.warn('[Posturas]',e?.message||e);}
  finally{if(!String(pid).startsWith('local'))try{await dep.deleteDoc?.(D(PEDIDOS+'/'+pid));}catch(_){}}
 }
 async function berro(ev){
  const r=berroConectou(ev);if(!r)return;
  const toks=ctl()?.tokensNoMapa?.()||[],alvo=toks.find(t=>t.id===ev.target.id),fonte=toks.find(t=>t.id===ev.source.id)||ev.source;if(!alvo)return;
  const a0=saude?.actors?.[alvo.id];if(a0?.combateLab?.morto)return;
  const {W,H}=dims(),dist=distanciaEmpurrao(r.dano,alvo.diametroM);
  const e=empurrar({de:fonte,alvo,dist,W,H,objetos:cena&&String(cena.mapId||'')===String(mapa?.mapId||'')?cena.objects||[]:[],tokens:toks.filter(x=>x.id!==alvo.id&&x.id!==fonte.id),raio:Math.max(.35,(Number(alvo.diametroM)||1)/2)});
  // teste para não cair: Atletismo − 5 por metro empurrado (−10 extra se bateu em algo)
  let valor=0;try{valor=Number(await win.mesaPedagioV138_?.pericia?.({...alvo},['atletismo']))||0;}catch(_){}
  const chance=Math.max(5,Math.min(95,Math.round(valor-dist*5-(e.bateu&&e.bateu!=='borda'?10:0)))),die=1+Math.floor(Math.random()*100),caiu=die>chance;
  const rodadas=1+Math.floor(Math.random()*20);
  if(e.andou>0)try{await dep.runTransaction(dep.db,async tx=>{const ref=D(POS+'/'+alvo.id),s=await tx.get(ref);if(!s.exists())return;tx.set(ref,{...s.data(),x:+e.x.toFixed(3),y:+e.y.toFixed(3),revision:Number(s.data().revision||0)+1});});}catch(err){console.warn('[Posturas] empurrão',err);}
  await gravarAtor(alvo.id,a=>{const n={...a,surdo:{ate:Date.now()+rodadas*5000,...(mapa?.combat?.active?{ateRodada:Number(mapa.combat.round||0)+rodadas}:{}),rodadas}};
   if(caiu){n.postura='caido';n.combateLab={...(a.combateLab||{}),caido:true,derrubado:true};}return n;},
   `📯 ${nomeDe(alvo)} é empurrado ${e.andou.toFixed(1).replace('.',',')} m pelo berro${e.bateu&&e.bateu!=='borda'?' e bate em '+(e.bateu==='alguém'?'alguém':'um obstáculo'):''} · Atletismo ${die}/${chance} → ${caiu?'🛌 cai':'fica de pé'} · 🔇 surdo por ${rodadas} rodada(s).`);
  if(caiu)caidoDesde.set(alvo.id,Date.now());
 }
 function novasEntradas(){
  const es=hist?.entries||[];
  if(primeiraHist){for(const e of es)vistos.add(e.id);primeiraHist=false;return;}
  for(const e of es){if(vistos.has(e.id))continue;vistos.add(e.id);if(ehMestre())void berro(e).catch(err=>console.warn('[Posturas] berro',err));}
 }
 // NPCs e criaturas caídos no tempo real levantam sozinhos depois de um tempo
 function levantarNpcs(){
  if(!ehMestre()||!rtAtivo())return;const agora=Date.now();
  for(const t of (ctl()?.tokensNoMapa?.()||[])){if(String(t.donoUid||''))continue;const a=saude?.actors?.[t.id];
   if(posturaDe(a,agora)!=='caido'||a?.combateLab?.inconsciente||a?.combateLab?.morto){caidoDesde.delete(t.id);continue;}
   if(!caidoDesde.has(t.id)){caidoDesde.set(t.id,agora);continue;}
   if(agora-caidoDesde.get(t.id)>LEVANTAR_MS+1500){caidoDesde.delete(t.id);void aplicar('local'+agora+t.id,{personagemId:decodeURIComponent(t.id),postura:'em_pe'});}}
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];primeiraHist=true;
  parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(SCENE),s=>{cena=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(HIST),s=>{hist=s.exists()?s.data():null;novasEntradas();},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void aplicar(d.id,d.data()||{});});},()=>{}));
 }
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}desenhar();levantarNpcs();}catch(e){console.warn('[Posturas]',e);}},400);
 win.mesaPosturas={pedir,aplicar,berro,postura:id=>posturaDe(saude?.actors?.[id])};
 return {parar(){clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});barra?.remove();camada?.remove();}};
}
