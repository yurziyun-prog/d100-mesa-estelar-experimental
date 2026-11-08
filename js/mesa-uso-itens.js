// Mesa Estelar v190 — Usar itens na mesa: curar, tirar veneno, estancar sangramento, recuperar fadiga, proteger, acender luz.
//
// Antes só comida/bebida e Nanogel tinham efeito (e só pela ficha). Agora, no mapa, o botão 🎒 do personagem controlado
// lista os itens da mochila/bolso/equipamento que têm efeito e aplica o efeito na saúde da mesa:
//   • curativo (Nanogel, Kit Médico Básico/Avançado, Kit de Primeiros Socorros): devolve PV à parte mais ferida;
//   • antídoto: tira veneno, infecção, paralisia e atordoamento; espuma selante e kit de primeiros socorros estancam o sangramento;
//   • comida, água, café, ração: melhoram a Fadiga em 1 nível (com tempo de espera para não abusar);
//   • respirador e reserva de oxigênio: proteção contra gás, fumaça e vácuo por alguns minutos;
//   • lanterna e holofote: luz portátil ligada/desligada em volta do personagem.
// Em combate por turnos, usar um item custa 1 Ação (feita antes do pedido); em tempo real, atrasa a recarga do personagem.
// Pedidos de jogadores vão pela fila combatesAtivos/mesaItens/acoes (coberta pelas regras) e o mestre aplica numa transação.
// Módulo à parte: se falhar, o mapa e o combate seguem normais.

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',HEALTH='combatesAtivos/mapaMesaSyncSaude',HIST='combatesAtivos/mapaMesaSyncHistorico';
export const PEDIDOS='combatesAtivos/mesaItens/acoes';
export const NIVEIS_FADIGA=['Fresh','Winded','Tired','Wearied','Exhausted','Debilitated','Incapacitated','Semi-Conscious','Comatose'];
export const NOME_FADIGA={Fresh:'Descansado',Winded:'Ofegante',Tired:'Cansado',Wearied:'Esgotado leve',Exhausted:'Exausto',Debilitated:'Debilitado',Incapacitated:'Incapacitado','Semi-Conscious':'Semiconsciente',Comatose:'Em coma'};
export const ESPERA_MS={cafe:600000,agua:120000,comida:180000,estimulante:300000};
export const PROTECAO_MS={respirador:600000,oxigenio:300000};
export const LUZ_RAIO={lanterna:4,holofote:9};
const ESTADOS_RUINS=['envenenado','veneno','infectado','infeccao','paralisado','atordoado'];

// ---------------------------------------------------------------- qual efeito tem cada item (pelo id do Banco, nome e categoria)
export function efeitoDoItem(item){
 if(!item)return null;
 const id=sem(item.idBanco||item.id||''),nome=sem(item.nome||item.name||''),cat=sem(item.categoria||''),t=id+' '+nome;
 if(/nanogel/.test(t))return {tipo:'cura',nome:'Nanogel Regenerativo',pontos:3,gasta:'tudo',icone:'💉'};
 if(/kit.?medico.?avancado/.test(t))return {tipo:'cura',nome:'Kit Médico Avançado',pontos:4,estanca:true,icone:'🩺'};
 if(/kit.?medico/.test(t))return {tipo:'cura',nome:'Kit Médico Básico',pontos:2,estanca:true,icone:'🩹'};
 if(/primeiros.?socorros/.test(t))return {tipo:'cura',nome:'Kit de Primeiros Socorros',pontos:1,estanca:true,icone:'🩹'};
 if(/antidoto/.test(t))return {tipo:'antidoto',nome:'Antídoto Universal',icone:'🧪'};
 if(/espuma.?selante/.test(t))return {tipo:'estanque',nome:'Espuma Selante',icone:'🧴'};
 if(/respirador/.test(t))return {tipo:'protecao',protecao:'respirador',nome:'Respirador',icone:'😷',duracaoMs:PROTECAO_MS.respirador};
 if(/reserva.?oxigenio|oxigenio/.test(t))return {tipo:'protecao',protecao:'oxigenio',nome:'Reserva de Oxigênio',icone:'🫧',duracaoMs:PROTECAO_MS.oxigenio};
 if(/holofote/.test(t))return {tipo:'luz',nome:'Holofote Portátil',raio:LUZ_RAIO.holofote,icone:'🔦'};
 if(/lanterna/.test(t))return {tipo:'luz',nome:'Lanterna',raio:LUZ_RAIO.lanterna,icone:'🔦'};
 if(/energetic|estimulante/.test(t))return {tipo:'fadiga',grupo:'estimulante',nome:item.nome||'Estimulante',icone:'⚡'};
 if(/\bcafe\b|coffee/.test(t))return {tipo:'fadiga',grupo:'cafe',nome:'Café',icone:'☕'};
 if(/\bagua\b|water/.test(t))return {tipo:'fadiga',grupo:'agua',nome:item.nome||'Água',icone:'💧'};
 if(/cerveja|beer/.test(t))return {tipo:'fadiga',grupo:'agua',nome:item.nome||'Bebida',icone:'🍺'};
 if(/comida|alimento|racao|refeicao|ration|meal/.test(t+' '+cat))return {tipo:'fadiga',grupo:'comida',nome:item.nome||'Comida',icone:'🍲'};
 return null;
}
// Quantos usos ainda tem (usos do kit, pontos de consumo, 1 para o que some de uma vez).
export function usosRestantes(item,ef=efeitoDoItem(item)){
 if(!item||!ef)return 0;
 if(Number.isFinite(Number(item.usosRestantes)))return Math.max(0,Number(item.usosRestantes));
 if(ef.tipo==='luz')return Infinity;
 if(ef.gasta==='tudo')return 1;
 const uso=Number(item.uso);if(Number.isFinite(uso)&&uso>0&&ef.tipo!=='fadiga')return uso;
 const pv=Number(item.pvConsumoAtual??item.pvAtual??item.pv);if(ef.tipo==='fadiga'&&Number.isFinite(pv)&&pv>1)return pv;
 return 1;
}
// Gasta 1 uso: devolve o item atualizado ou null se acabou (some da mochila). Lanterna não gasta.
export function gastarUso(item,ef=efeitoDoItem(item)){
 if(ef?.tipo==='luz')return item;
 const n=usosRestantes(item,ef)-1;if(n<=0)return null;
 const novo={...item,usosRestantes:n};if(ef?.tipo==='fadiga'&&('pvConsumoAtual' in item))novo.pvConsumoAtual=n;return novo;
}
// Itens com efeito do inventário de uma ficha: [{comp,index,item,ef,usos}]
export function itensUsaveis(inventario){
 const out=[];for(const comp of ['equipado','bolso','mochila'])(inventario?.[comp]||[]).forEach((item,index)=>{const ef=efeitoDoItem(item);if(ef&&usosRestantes(item,ef)>0)out.push({comp,index,item,ef,usos:usosRestantes(item,ef)});});
 return out;
}

// ---------------------------------------------------------------- aplicar o efeito (puro)
export function parteMaisFerida(combateLab){
 let pior=null,fr=1;for(const [loc,mx] of Object.entries(combateLab?.hitMax||{})){const max=Number(mx)||0;if(max<=0)continue;const f=(Number(combateLab.hit?.[loc]??max))/max;if(f<fr){fr=f;pior=loc;}}
 return pior;
}
export function curar(combateLab,pontos){
 const cl=clean(combateLab||{}),loc=parteMaisFerida(cl);if(!loc)return {combateLab:cl,local:'',ganho:0};
 const max=Number(cl.hitMax[loc]),antes=Number(cl.hit[loc]??max),depois=Math.min(max,antes+pontos);cl.hit={...cl.hit,[loc]:depois};
 if(depois>0&&cl.ferimentos&&cl.ferimentos[loc])delete cl.ferimentos[loc]; // saiu do estado de ferida aberta
 return {combateLab:cl,local:loc,ganho:depois-antes};
}
export function melhorarFadiga(nivel,passos=1){const i=Math.max(0,NIVEIS_FADIGA.indexOf(nivel));const j=Math.max(0,i-passos);return NIVEIS_FADIGA[j];}
// estado do ator na saúde da mesa → novo estado + mensagem. Não mexe em mochila nem em rede.
export function aplicarEfeito({ef,ator={},fadiga='Fresh',agora=Date.now(),nome='Alguém'}){
 const a=clean(ator)||{},cl=a.combateLab||{};
 if(cl.morto)return {ok:false,erro:'Morto: não adianta.'};
 if(cl.inconsciente&&ef.tipo!=='cura'&&ef.tipo!=='antidoto')return {ok:false,erro:'Inconsciente.'};
 switch(ef.tipo){
  case 'cura':{
   const r=curar(cl,ef.pontos);if(!r.local||r.ganho<=0&&!(ef.estanca&&cl.sangrando))return {ok:false,erro:'Nenhuma ferida para tratar.'};
   a.combateLab=r.combateLab;let extra='';if(ef.estanca&&a.combateLab.sangrando){a.combateLab.sangrando=false;extra=' · estancou o sangramento';}
   return {ok:true,ator:a,fadiga,msg:`${ef.icone} ${nome} usa ${ef.nome}: +${r.ganho} PV em ${r.local}${extra}.`};}
  case 'antidoto':{
   const tirados=ESTADOS_RUINS.filter(k=>cl[k]||a[k]);if(!tirados.length&&!a.psiEffects?.atordoado)return {ok:false,erro:'Nada a neutralizar.'};
   for(const k of tirados){if(cl[k])cl[k]=false;if(a[k])delete a[k];}if(a.psiEffects?.atordoado){a.psiEffects={...a.psiEffects};delete a.psiEffects.atordoado;}a.combateLab=cl;
   return {ok:true,ator:a,fadiga,msg:`${ef.icone} ${nome} toma ${ef.nome}: ${tirados.join(', ')||'atordoamento'} neutralizado(s).`};}
  case 'estanque':{
   if(!cl.sangrando)return {ok:false,erro:'Ninguém sangrando.'};cl.sangrando=false;a.combateLab=cl;
   return {ok:true,ator:a,fadiga,msg:`${ef.icone} ${nome} aplica ${ef.nome}: sangramento estancado.`};}
  case 'fadiga':{
   const espera=ESPERA_MS[ef.grupo]||120000,ult=Number(a.itensUsadosV190?.[ef.grupo]||0);
   if(agora-ult<espera){const falta=Math.ceil((espera-(agora-ult))/1000);return {ok:false,erro:`Já usou ${ef.grupo==='cafe'?'café':ef.grupo==='agua'?'água':ef.grupo==='comida'?'comida':'um estimulante'} há pouco (espere ${falta<90?falta+' s':Math.ceil(falta/60)+' min'}).`};}
   if(fadiga==='Fresh')return {ok:false,erro:'Já está Descansado.'};
   const novo=melhorarFadiga(fadiga);a.itensUsadosV190={...(a.itensUsadosV190||{}),[ef.grupo]:agora};
   return {ok:true,ator:a,fadiga:novo,msg:`${ef.icone} ${nome} consome ${ef.nome}: Fadiga ${NOME_FADIGA[fadiga]||fadiga} → ${NOME_FADIGA[novo]||novo}.`};}
  case 'protecao':{
   const ate=agora+ef.duracaoMs;a.protecoesV190={...(a.protecoesV190||{}),[ef.protecao]:ate};
   return {ok:true,ator:a,fadiga,msg:`${ef.icone} ${nome} usa ${ef.nome}: protegido contra gás, fumaça e vácuo por ${Math.round(ef.duracaoMs/60000)} min.`};}
  case 'luz':{
   const lig=!(a.luzPortatilV190?.ligada&&a.luzPortatilV190.tipo===ef.nome);a.luzPortatilV190=lig?{ligada:true,raio:ef.raio,tipo:ef.nome}:{ligada:false,raio:0,tipo:ef.nome};
   return {ok:true,ator:a,fadiga,msg:`${ef.icone} ${nome} ${lig?'acende':'apaga'} ${ef.nome}${lig?` (ilumina ${ef.raio} m)`:''}.`};}
 }
 return {ok:false,erro:'Este item não tem efeito.'};
}
export const protegidoContra=(ator,agora=Date.now())=>Object.values(ator?.protecoesV190||{}).some(t=>Number(t)>agora);

// ---------------------------------------------------------------- instalação (navegador)
export function instalarUsoItens(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const rF=p=>{try{return globalThis.mesaTreinoRotaV205?.(p)||p;}catch(_){return p;}}; // v205: durante um duelo de treino a ficha do personagem é a CÓPIA da sessão (treinoSessoes/…), nunca a ficha real
 const D=p=>dep.doc(dep.db,rF(p));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 let seq=0;const novoId=()=>Date.now().toString(36)+(++seq).toString(36);
 let saude=null,parar=[],assinado='',botao=null,pop=null,camada=null,aberto=false,inv=null,invDe='',msg='',processados=new Set(),ocupado=false;
 const toast=t=>{msg=t;if(pop)desenharPop();setTimeout(()=>{if(msg===t){msg='';if(pop)desenharPop();}},6000);};
 const CSS=`#uiBotao{position:absolute;right:8px;bottom:8px;z-index:38;width:34px;height:34px;border-radius:50%;border:1px solid #8ee7ff;background:rgba(10,18,32,.88);color:#fff;font-size:17px;cursor:pointer;padding:0}
#uiPop{position:absolute;right:8px;bottom:48px;z-index:39;min-width:240px;max-width:min(320px,calc(100% - 20px));max-height:60%;overflow:auto;padding:8px;border-radius:12px;background:rgba(10,18,32,.95);border:1px solid #6b83a8;color:#e8eefc;font:12px 'Segoe UI',Arial,sans-serif}
#uiPop[hidden]{display:none}#uiPop button{display:flex;gap:8px;align-items:center;width:100%;text-align:left;margin:3px 0;padding:6px 8px;border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;font:600 12px 'Segoe UI',Arial,sans-serif}
#uiPop button:disabled{opacity:.5;cursor:wait}#uiPop small{color:#9fb3cc;display:block;margin-top:4px}
#uiLuz{position:absolute;inset:0;pointer-events:none;z-index:11}#uiLuz i{position:absolute;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,236,170,.34),rgba(255,236,170,.12) 55%,transparent 72%)}`;
 if(!root.getElementById('uiCss')){const st=root.createElement('style');st.id='uiCss';st.textContent=CSS;root.head.append(st);}
 function ator(){const c=ctl();try{const t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 const fichaId=t=>decodeURIComponent(String(t?.id||''));
 const ehPJ=t=>!!t&&!fichaId(t).startsWith('sync')&&!fichaId(t).startsWith('dummy:');
 async function carregarInventario(t){
  if(!ehPJ(t))return null;const id=fichaId(t);if(invDe===id&&inv&&Date.now()-inv.t<4000)return inv.v;
  try{const s=await dep.getDoc(D('personagens/'+id));const v=s.exists()?s.data():null;inv={v,t:Date.now()};invDe=id;return v;}catch(_){return null;}
 }
 // ---- pedido do jogador (ou do mestre agindo como personagem)
 async function pedir(comp,index,instanciaId){
  const t=ator();if(!t||ocupado)return;ocupado=true;
  try{
   const c=ctl();
   if(c?.emCombate?.()){const ok=await c.gastarAcao?.(t.id);if(!ok){toast('⏳ Usar um item gasta 1 Ação: espere a sua vez.');return;}}
   const cmd={donoUid:uid(),personagemId:fichaId(t),comp,index,instanciaId:String(instanciaId||''),criadoEm:Date.now()};
   if(ehMestre())await aplicar('local'+novoId(),cmd);else{await dep.setDoc(D(PEDIDOS+'/p'+novoId()),cmd);toast('⏳ Pedido enviado; a mesa aplica em instantes.');}
  }catch(e){toast('🎒 '+String(e?.message||e));}finally{ocupado=false;inv=null;if(pop)void desenharPop();}
 }
 // ---- mestre: aplica numa transação (saúde + ficha + histórico)
 async function aplicar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);let texto='',erro='';
  try{
   const idTok=encodeURIComponent(String(cmd.personagemId||'')),t=ctl()?.token?.(idTok)||(ctl()?.todosTokens?.()||[]).find(x=>x.id===idTok);if(!t)throw Error('Personagem não está no mapa.');
   if(!String(pid).startsWith('local')&&String(t.donoUid||'')!==String(cmd.donoUid||''))throw Error('Pedido de quem não controla o personagem.');
   if(Math.abs(Date.now()-Number(cmd.criadoEm||0))>60000)throw Error('Pedido expirado.');
   await dep.runTransaction(dep.db,async tx=>{
    const ficha=D('personagens/'+cmd.personagemId),[sf,sh,shi]=await Promise.all([tx.get(ficha),tx.get(D(HEALTH)),tx.get(D(HIST))]);
    if(!sf.exists())throw Error('Ficha não encontrada.');
    const f=sf.data(),invt=clean(f.inventario||{}),lista=invt[cmd.comp]||[],item=lista[cmd.index];
    if(!item||(cmd.instanciaId&&String(item.instanciaId||'')&&String(item.instanciaId)!==String(cmd.instanciaId)))throw Error('O item mudou de lugar.');
    const ef=efeitoDoItem(item);if(!ef)throw Error('Este item não tem efeito.');if(usosRestantes(item,ef)<=0)throw Error('Item esgotado.');
    const hp=sh.exists()?sh.data():{actors:{},revision:0},ator=hp.actors?.[t.id]||{},fadiga=String(f.combate?.fadiga||'Fresh');
    const r=aplicarEfeito({ef,ator,fadiga,agora:Date.now(),nome:String(t.nome||f.nome||'Alguém')});if(!r.ok)throw Error(r.erro);
    const novo=gastarUso(item,ef);lista[cmd.index]=novo;invt[cmd.comp]=lista;
    tx.set(ficha,clean({...f,inventario:invt,combate:{...(f.combate||{}),fadiga:r.fadiga}}));
    tx.set(D(HEALTH),clean({...hp,actors:{...(hp.actors||{}),[t.id]:r.ator},revision:Number(hp.revision||0)+1}));
    const hh=shi.exists()?shi.data():{entries:[],revision:0};
    tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'ui:'+novoId(),ts:Date.now(),actorUid:String(t.donoUid||''),targetUid:'',message:r.msg}].slice(-120),revision:Number(hh.revision||0)+1}));
    texto=r.msg;
   });
   try{win.mesaTempoRealV111?.atrasar?.(t.id,1);}catch(_){}
  }catch(e){erro=String(e?.message||e);}
  finally{if(!String(pid).startsWith('local'))try{await dep.deleteDoc?.(D(PEDIDOS+'/'+pid));}catch(_){}}
  if(String(pid).startsWith('local')){toast(erro?'🎒 '+erro:texto);if(!erro){inv=null;}}
  return {texto,erro};
 }
 // ---- interface
 async function desenharPop(){
  if(!pop)return;const t=ator(),f=t?await carregarInventario(t):null;
  const lista=f?itensUsaveis(f.inventario):[];
  const h=(lista.length?lista.map(u=>`<button type="button" data-c="${u.comp}" data-i="${u.index}" data-inst="${esc(u.item.instanciaId||'')}" ${ocupado?'disabled':''} title="${esc(u.item.nome||u.ef.nome)}">${u.ef.icone} <span style="flex:1">${esc(u.item.nome||u.ef.nome)}</span><small style="margin:0">${u.usos===Infinity?'liga/desliga':u.usos+' uso'+(u.usos>1?'s':'')}</small></button>`).join(''):`<small>${t?(ehPJ(t)?'Nenhum item com efeito na mochila.':'Só personagens de jogador usam itens.'):'Escolha o seu personagem.'}</small>`)+(msg?`<small style="color:#ffe9a8">${esc(msg)}</small>`:'')+`<small>${ctl()?.emCombate?.()?'Em combate por turnos, usar um item gasta 1 Ação.':'Em tempo real, usar um item atrasa a recarga.'}</small>`;
  if(pop.dataset.h!==h){pop.innerHTML=h;pop.dataset.h=h;}
 }
 function desenhar(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;const sc=b.parentElement;const t=ator();
  if(!t||!ehPJ(t)){botao?.remove();botao=null;pop?.remove();pop=null;aberto=false;}
  else if(!botao||!botao.isConnected){botao=root.createElement('button');botao.type='button';botao.id='uiBotao';botao.textContent='🎒';botao.title='Usar um item da mochila (curar, antídoto, comida, lanterna…)';botao.setAttribute('aria-label',botao.title);
   botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',()=>{if(win.mesaEquipar?.abrir){win.mesaEquipar.abrir();return;}aberto=!aberto;if(!pop){pop=root.createElement('div');pop.id='uiPop';pop.addEventListener('pointerdown',e=>e.stopPropagation());pop.addEventListener('click',e=>{const bt=e.target.closest('button[data-c]');if(bt)void pedir(bt.dataset.c,Number(bt.dataset.i),bt.dataset.inst);});if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(pop);}pop.hidden=!aberto;if(aberto)void desenharPop();});
   if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(botao);}
  if(pop&&aberto&&Date.now()%2000<450)void desenharPop();
  // luz portátil: círculo de luz em volta de quem acendeu
  if(!camada||camada.parentElement!==b){camada?.remove();camada=root.createElement('div');camada.id='uiLuz';b.append(camada);}
  const dim=ctl()?.dimsAtual?.()||{W:28,H:14};let h='';
  for(const tk of (ctl()?.tokensNoMapa?.()||[])){const l=saude?.actors?.[tk.id]?.luzPortatilV190;if(l?.ligada){const d=Number(l.raio)*2;h+=`<i style="left:${Number(tk.x)/28*100}%;top:${Number(tk.y)/14*100}%;width:${d/dim.W*100}%;height:${d/dim.H*100}%"></i>`;}}
  if(camada.dataset.h!==h){camada.innerHTML=h;camada.dataset.h=h;}
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void aplicar(d.id,d.data()||{});});},()=>{}));
 }
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}desenhar();}catch(e){console.warn('[Itens]',e);}},450);
 const api={pedir,aplicar,usaveis:async()=>{const t=ator(),f=t?await carregarInventario(t):null;return f?itensUsaveis(f.inventario):[];}};win.mesaUsoItens=api;
 return {...api,parar(){clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});botao?.remove();pop?.remove();camada?.remove();if(win.mesaUsoItens===api)delete win.mesaUsoItens;}};
}
