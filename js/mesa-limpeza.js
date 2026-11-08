// Mesa Estelar v146 — Faxina dos mapas (uma vez, na conta do mestre) e trava contra “vazamentos”.
//
// • Objetos gerados para um mapa carregam a semente do gerador no id (…:gen1320:…). Quando a Oficina/registro do mestre
//   salvou com a cena de outro mapa ainda carregada, móveis de um lugar (cápsulas, portas e banquetas da Última Bateria,
//   por exemplo) foram parar em outros (Portão, Espaço-porto). A faxina tira de cada mapa os objetos cuja semente é de
//   OUTRO mapa (o “dono” da semente é o mapa onde ela mais aparece). Objetos postos à mão pelo mestre não têm semente
//   e nunca são mexidos. Cópia de segurança de cada cena antes.
// • Cópias numeradas de NPCs únicos (ex.: “Hessa Varn 7”, “Hessa Varn 32”…) saem do mapa: fica só a original.
// • Registro do mestre (mesaObjetosMestre): sai o que era de outro mapa, para não voltar.
// Módulo à parte: se falhar, nada muda.

const SCENE='combatesAtivos/mapaMesaSyncDiretaCena',REG='combatesAtivos/mesaObjetosMestre',POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
const arquivo=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

// Semente do gerador num id (ou '' para objetos sem semente, como os postos à mão).
export const semente=id=>{const m=/gen(\d+)/.exec(String(id||''));return m?m[1]:'';};
// Conta as sementes de uma lista de objetos/elementos.
export function contarSementes(lista=[]){const c=new Map();for(const o of lista){const s=semente(o?.id);if(s)c.set(s,(c.get(s)||0)+1);}return c;}
// Dono de cada semente: o mapa onde ela mais aparece. cenas = Map(mapId → objetos)
export function donosDasSementes(cenas){
 const dono=new Map(),max=new Map();
 for(const [id,objs] of cenas)for(const [s,n] of contarSementes(objs))if(n>(max.get(s)||0)){max.set(s,n);dono.set(s,id);}
 return dono;
}
// Tira os objetos de sementes de outro mapa (puro).
export function semVazados(objs=[],mapId,dono){
 const fora=[];const fica=objs.filter(o=>{const s=semente(o?.id);if(!s)return true;const d=dono.get(s);if(d&&String(d)!==String(mapId)){fora.push(o);return false;}return true;});
 return {fica,fora};
}
// Móveis típicos da Última Bateria (taverna com cápsulas): fora dela, um grupo de semente com vários desses é vazamento.
export const DA_TAVERNA=/porta da capsula|capsula de aluguel|porta do dormitorio|beliche [ab]\d|armarios? dos hospedes|escada para os dormitorios|corredor dos (dormitorios|capsulas)|andar de cima|guarda-corpo|balcao do bar|prateleira de bebidas|caixa registradora de ur-17|banqueta|jukebox|porta do corredor das capsulas|fogao da cozinha/;
// Grupos de semente "estranhos" a um mapa pelo conteúdo: ≥3 móveis de taverna, num mapa que não é taverna, e não é a semente principal dele.
export function gruposDeTaverna(objs=[],ehTaverna=false){
 if(ehTaverna)return new Set();const c=contarSementes(objs);const principal=[...c.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'';const n=new Map();
 for(const o of objs){const sd=semente(o?.id);if(!sd||sd===principal)continue;if(DA_TAVERNA.test(sem(o.nome)))n.set(sd,(n.get(sd)||0)+1);}
 return new Set([...n.entries()].filter(([,k])=>k>=3).map(([sd])=>sd));
}
// Sem semente (registro do mestre / cópia): móvel de taverna solto num mapa que não é taverna.
export const soltoDeTaverna=(o,ehTaverna)=>!ehTaverna&&!semente(o?.id)&&/porta da capsula|capsula de aluguel|porta do dormitorio|beliche [ab]\d|escada para os dormitorios/.test(sem(o?.nome));
// Cópias por nome: "Hessa Varn 7", "Hessa Varn 49"… de um NPC com nome próprio, no mesmo mapa (fica a de menor número).
export function copiasPorNome(tokens=[],npcs=[]){
 const porId=new Map(npcs.map(n=>[String(n.id),n])),grupos=new Map();
 for(const t of tokens){const id=decodeURIComponent(String(t.id||''));if(!id.startsWith('syncnpc:'))continue;const base=id.slice(8).split('~')[0],npc=porId.get(base);
  const nome=String(t.nome||'').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,'').trim(),m=/^(.*?)\s+(\d+)$/.exec(nome),raiz=sem(m?m[1]:nome);
  if(!raiz||!npcUnico(npc||{nome:m?m[1]:nome}))continue;const k=String(t.mapaId||'')+'|'+raiz;if(!grupos.has(k))grupos.set(k,[]);grupos.get(k).push({t,num:m?Number(m[2]):0,id});}
 const fora=[];for(const g of grupos.values()){if(g.length<2)continue;g.sort((a,b)=>(a.id.includes('~')?1:0)-(b.id.includes('~')?1:0)||a.num-b.num);fora.push(...g.slice(1).map(x=>x.t));}
 return fora;
}
// NPC "genérico" (pode ter várias cópias) × NPC com nome próprio (uma só).
const GENERICO=/guarda|comerciante|morador|minerador|lenhador|trabalhador|operari|soldado|robo|cidada|mercenari|crianca|viajante|bandido|capanga|cultista|aldea|peregrin|servo|garcom|mordomo|cliente|bebado|marinheir|piloto|tecnico|vigia|sentinela|patrulh|atendente|ambulante|mendig|estivador|carregador|musico|danca|cozinheir|vendedor|seguranca|policial|recruta|escravo|prisioneir|refugiad|nomade|caravaneir|pastor|caçador|cacador|minion|drone|zumbi|livido/;
const RACA=/^(humano|humana|reptiliano|insetoide|nymari|zutariano|grey|androide|robo|ciborgue|mutante)s?\b/;
export function npcUnico(npc){
 if(!npc)return false;if(npc.unico===true)return true;if(npc.unico===false||String(npc.unico)==='false')return false;
 const n=sem(npc.nome||'').replace(/\s+\d+$/,'').trim();
 if(!n||GENERICO.test(n)||RACA.test(n)||/^(npc|pm|pj)\b/.test(n))return false;
 if(/^comerciante_generico_[a-z]+$|^trabalhador_/.test(String(npc.id)))return false; // modelos genéricos por raça/ofício
 return true; // nome próprio (Hessa Varn, Denzel, Nilo…) = pessoa única
}
// Cópias (syncnpc:x~k, k≥2) de NPCs únicos.
export function copiasDeUnicos(tokens=[],npcs=[]){
 const porId=new Map(npcs.map(n=>[String(n.id),n]));
 return tokens.filter(t=>{const m=/^syncnpc:([^~]+)~(\d+)$/.exec(decodeURIComponent(String(t.id||'')));return m&&Number(m[2])>=2&&npcUnico(porId.get(m[1]));});
}

export function instalarLimpeza(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const rF=p=>{try{return globalThis.mesaTreinoRotaV205?.(p)||p;}catch(_){return p;}}; // v205: durante um duelo de treino a ficha do personagem é a CÓPIA da sessão (treinoSessoes/…), nunca a ficha real
 const D=p=>dep.doc(dep.db,rF(p));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let feito=false,rodando=false,tent=0;
 const toast=t=>{const n=root.createElement('div');n.textContent=t;n.style.cssText='position:fixed;left:16px;bottom:150px;z-index:9999;max-width:min(560px,calc(100vw - 32px));background:#1d2a44;border:1px solid #8ee7ff;color:#e8eefc;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;box-shadow:0 8px 24px #0008';root.body.append(n);setTimeout(()=>n.remove(),16000);};
 async function cenaDe(id){
  try{const s=await dep.getDoc(D(SCENE));if(s.exists()&&String(s.data()?.mapId||'')===String(id))return {cena:s.data(),ativa:true};}catch(_){}
  try{const s=await dep.getDoc(D(arquivo(id)));if(s.exists())return {cena:s.data(),ativa:false};}catch(_){}
  return null;
 }
 async function rodar(forcar=false){
  if(forcar===true)feito=false;else forcar=false;
  if(feito||rodando||!ehMestre())return;
  const mapas=dep.mapas?.()||[],npcs=dep.npcs?.()||[];
  if(!mapas.length||!ctl()?.todosTokens||!win.mesaMapasV110_?.salvar)return;
  const flag=D('configuracoes/limpezaV150');
  if(!forcar){try{if((await dep.getDoc(flag)).exists()){feito=true;return;}}catch(_){return;}
  // espera a Última Bateria nova (v146) ficar pronta, para a semente dela “ser dona” dos móveis vazados
  try{const ub=await dep.getDoc(D('configuracoes/andaresV151'));if(!ub.exists()||!ub.data()?.em){if(++tent<40)return;}}catch(_){return;}}
  rodando=true;const log=[];let tirados=0,copias=0,regTirados=0;
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   // 1) cenas de todos os mapas
   const cenas=new Map(),fontes=new Map();
   for(const m of mapas){const id=String(m.id||'');if(!id||id.startsWith('__mesa_live__'))continue;const c=await cenaDe(id);if(c?.cena?.objects){cenas.set(id,c.cena.objects);fontes.set(id,c);}}
   const dono=donosDasSementes(cenas);
   for(const [id,objs] of cenas){
    const mm=mapas.find(x=>String(x.id)===id),ehTav=!!(mm?.tavernaV132||mm?.oficina2State?.tavernaV132||/ultima bateria/.test(sem(mm?.nome)));
    const gt=gruposDeTaverna(objs,ehTav),r1=semVazados(objs,id,dono);
    const fora=r1.fora.concat(r1.fica.filter(o=>gt.has(semente(o?.id))||soltoDeTaverna(o,ehTav)));const idsFora=new Set(fora.map(o=>o.id));const fica=objs.filter(o=>!idsFora.has(o.id));
    if(!fora.length)continue;
    const f=fontes.get(id),nova={...f.cena,objects:fica,editorRevision:Number(f.cena.editorRevision||0)+1};
    try{await dep.setDoc(D('combatesAtivos/backupCena_'+id+'_v146'),clean({em:new Date().toISOString(),cena:f.cena}));}catch(e){console.warn('[Faxina] backup',id,e);}
    if(f.ativa)await dep.setDoc(D(SCENE),clean(nova));await dep.setDoc(D(arquivo(id)),clean(nova));
    // o desenho do mapa (Oficina) também, para não voltar ao republicar
    try{const hid=win.mesaSessaoV115_?.hidratarMapa;const mm=hid?await hid(id):null,st=mm?.oficina2State;
     if(st?.elements?.length){const ids=new Set(fora.map(o=>String(o.id).replace(/^oficina:/,'')));const els=st.elements.filter(e=>!ids.has(String(e.id)));
      if(els.length!==st.elements.length)await win.mesaMapasV110_.salvar({id,nome:mm.nome||id,state:{...st,elements:els},cenaDe:()=>clean(nova)});}}catch(e){console.warn('[Faxina] oficina',id,e);}
    tirados+=fora.length;const m=mapas.find(x=>String(x.id)===id);
    const nomes=[...new Set(fora.map(o=>String(o.nome||'').replace(/\s*\d+$/,'')))].slice(0,4).join(', ');
    log.push(`${m?.nome||id}: ${fora.length} (${nomes}${fora.length>4?'…':''})`);
   }
   // 2) registro do mestre: tira o que era de outro mapa
   try{const s=await dep.getDoc(D(REG));const reg=s.exists()?(s.data()?.mapas||{}):{};let mudou=false;const novo={};
    for(const [id,recs] of Object.entries(reg)){const r={};for(const [k,v] of Object.entries(recs||{})){const sd=semente(v?.obj?.id||v?.id);const d=sd?dono.get(sd):null;const mm=mapas.find(x=>String(x.id)===String(id)),ehTav=!!(mm?.tavernaV132||/ultima bateria/.test(sem(mm?.nome)));if(v?.tipo==='adicionar'&&((d&&String(d)!==String(id))||(!ehTav&&DA_TAVERNA.test(sem(v?.nome||v?.obj?.nome))))){r[k]={k,apagado:true,ts:Date.now()};regTirados++;mudou=true;}else r[k]=v;}novo[id]=r;}
    if(mudou)await dep.setDoc(D(REG),clean({mapas:novo,atualizadoEm:Date.now()}));}catch(e){console.warn('[Faxina] registro',e);}
   // 3) cópias de NPCs únicos
   const toks=ctl().todosTokens(),apagar=new Map();for(const t of [...copiasDeUnicos(toks,npcs),...copiasPorNome(toks,npcs)])apagar.set(String(t.id),t);
   // modelos "genéricos" com nome (ex.: guarda_generico_1 = Lera Vos, comerciante_generico_1 = Hessa Varn) só saem quando estão AMONTOADOS (3+ juntos)
   const base=t=>decodeURIComponent(String(t.id)).slice(8).split('~')[0];
   for(const [k,t] of [...apagar.entries()]){if(!/generico/.test(base(t)))continue;const viz=toks.filter(o=>o!==t&&base(o)===base(t)&&String(o.mapaId||'')===String(t.mapaId||'')&&Math.hypot(Number(o.x)-Number(t.x),Number(o.y)-Number(t.y))<=2.5);if(viz.length<2)apagar.delete(k);}
   for(const t of apagar.values()){try{await dep.deleteDoc(D(POS+'/'+t.id));copias++;}catch(e){console.warn('[Faxina] cópia',t.id,e);}}
   await dep.setDoc(flag,{em:new Date().toISOString(),tirados,copias,regTirados,mapas:log});feito=true;
   if(!tirados&&!copias)toast('🧹 Faxina dos mapas: nada sobrando de outro mapa e nenhuma cópia repetida de NPC com nome.');
   if(tirados||copias)toast(`🧹 Faxina dos mapas: ${tirados} móvel(is) que tinham vazado de outro lugar saíram${log.length?' — '+log.join(' · '):''}.${copias?` ${copias} cópia(s) repetida(s) de NPCs com nome (ex.: Hessa Varn) saíram.`:''} Cópias de segurança guardadas.`);
   try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Faxina]',e);toast('⚠️ Faxina dos mapas parou: '+(e?.message||e));}
  finally{rodando=false;}
 }
 // v150: ferramentas do mestre (canto de baixo à esquerda do mapa): rodar a faxina e refazer a Última Bateria na hora
 let botao=null,pop=null;
 function ferramentas(){
  const b=root.getElementById('novaSyncBoard');if(!b||!ehMestre()){botao?.remove();botao=null;if(pop)pop.hidden=true;return;}
  if(!botao||!botao.isConnected){botao?.remove();botao=root.createElement('button');botao.type='button';botao.id='lzBotao';botao.textContent='🛠️';botao.title='Ferramentas do mestre: faxina dos mapas e refazer a Última Bateria';
   botao.style.cssText="position:absolute;left:46px;bottom:74px;z-index:31;width:30px;height:30px;border-radius:999px;border:1px solid #8ee7ff;background:rgba(9,15,29,.9);color:#fff;cursor:pointer;padding:0;font-size:14px";
   botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',abrirPop);b.append(botao);}
 }
 // v153: o mestre restaura fome, sede e sono (quando não há como comprar comida/bebida ou dormir)
 const pjs=()=>{try{return (ctl()?.todosTokens?.()||[]).filter(t=>!decodeURIComponent(String(t.id||'')).startsWith('sync')&&t.nome!==undefined);}catch(_){return [];}};
 async function restaurar(oque,quem,mapaSo=''){
  const alvos=(oque==='tudo'?pjs():pjs().filter(t=>String(t.id)===String(quem))).filter(t=>!mapaSo||String(t.mapaId||'')===String(mapaSo)),feitos=[];
  for(const t of alvos){const id=decodeURIComponent(String(t.id));try{const s=await dep.getDoc(D('personagens/'+id));if(!s.exists())continue;const c=s.data()||{},patch={};
   if(oque==='fome'||oque==='tudo')patch.necessidades={...(patch.necessidades||c.necessidades||{}),fome:0,hFome:0};
   if(oque==='sede'||oque==='tudo')patch.necessidades={...(patch.necessidades||c.necessidades||{}),sede:0,hSede:0};
   if(oque==='sono'||oque==='tudo')patch.combate={...(c.combate||{}),fadiga:'Fresh',descansoHoras:0};
   if(oque==='tudo'&&mapaSo){ // v160: ♻️ Restaurar do mestre também devolve Sorte e PP
    try{const mx=win.__mesaSorteMaxV160_?.(c);if(Number.isFinite(Number(mx)))patch.pontosSorte=Number(mx);}catch(_){}
    patch.pontosMagiaGastos=0;}
   await dep.setDoc(D('personagens/'+id),patch,{merge:true});feitos.push(String(t.nome||id));}catch(e){console.warn('[Mestre] restaurar',id,e);}}
  try{const s=await dep.getDoc(D('combatesAtivos/mesaNecessidades'));if(s.exists()){const v=s.data()||{},por={...(v.porToken||v.tokens||{})};let mud=false;for(const t of alvos){const k=String(t.id);if(por[k]){por[k]={...por[k],...(oque==='fome'||oque==='tudo'?{fome:0}:{}),...(oque==='sede'||oque==='tudo'?{sede:0}:{})};mud=true;}}if(mud)await dep.setDoc(D('combatesAtivos/mesaNecessidades'),{...(v.porToken?{porToken:por}:{tokens:por})},{merge:true});}}catch(_){}
  const rot={fome:'🍖 sem fome',sede:'💧 sem sede',sono:'😴 descansado',tudo:'✨ sem fome, sem sede, descansado'+(arguments[2]?', com Sorte e PP de volta':'')}[oque];
  toast(feitos.length?`${rot}: ${feitos.join(', ')}.`:'Ninguém encontrado.');
 }
 win.addEventListener('mesa-restaurar-v160',e=>{if(!ehMestre())return;const m=String(e.detail?.mapId||'');if(m)setTimeout(()=>{void restaurar('tudo',null,m);},600);});
 function abrirPop(){
  if(!pop){pop=root.createElement('div');pop.hidden=true;pop.style.cssText="position:fixed;z-index:9996;width:min(320px,calc(100vw - 24px));background:#101828;border:1px solid #8ee7ff;border-radius:12px;padding:10px 12px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 30px #000c";root.body.append(pop);
   pop.addEventListener('pointerdown',e=>e.stopPropagation());
   pop.addEventListener('click',async e=>{const x=e.target.closest('button');if(!x)return;if(x.dataset.x!==undefined){pop.hidden=true;return;}
    if(x.dataset.nec){x.disabled=true;try{await restaurar(x.dataset.nec,x.dataset.quem||'');}catch(err){toast('⚠️ '+(err?.message||err));}x.disabled=false;return;}
    x.disabled=true;try{if(x.dataset.a==='faxina'){toast('🧹 Rodando a faxina dos mapas…');await rodar(true);}if(x.dataset.a==='ub'){toast('🏢 Refazendo a Última Bateria…');await win.mesaRemodelagem?.montar144?.(true);}if(x.dataset.a==='portao'){toast('🏜️ Refazendo o Portão pintado…');await win.mesaRemodelagem?.montar161?.(true);}}catch(err){toast('⚠️ '+(err?.message||err));}x.disabled=false;});}
  if(!pop.hidden){pop.hidden=true;return;}
  const bp="width:30px;height:28px;border-radius:7px;border:1px solid #2f4664;background:#16233a;color:#fff;cursor:pointer;padding:0";
  const bs="display:block;width:100%;margin:5px 0;min-height:32px;padding:4px 10px;border-radius:9px;border:1px solid #2f4664;background:rgba(255,255,255,.05);color:#e8eefc;cursor:pointer;font:inherit;text-align:left";
  pop.innerHTML=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><b style="flex:1">🛠️ Ferramentas do mestre</b><button type="button" data-x style="width:26px;height:26px;border-radius:7px;border:1px solid #2f4664;background:#16233a;color:#fff;cursor:pointer;padding:0">✕</button></div>
<button type="button" data-a="ub" style="${bs}">🏢 Refazer a Última Bateria agora</button><button type="button" data-a="portao" style="${bs}">🏜️ Refazer o Portão de Véspera</button><button type="button" data-a="faxina" style="${bs}">🧹 Rodar a faxina dos mapas agora</button>
<div style="margin:8px 0 4px;font-weight:600">🍖💧😴 Fome, sede e sono do grupo</div>${pjs().map(t=>`<div style="display:flex;gap:4px;align-items:center;margin:3px 0"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${String(t.nome||'').replace(/[<>&"]/g,'')}</span><button type="button" data-nec="fome" data-quem="${t.id}" title="Matar a fome (fome 0)" style="${bp}">🍖</button><button type="button" data-nec="sede" data-quem="${t.id}" title="Matar a sede (sede 0)" style="${bp}">💧</button><button type="button" data-nec="sono" data-quem="${t.id}" title="Descansado (Fadiga: Descansado)" style="${bp}">😴</button></div>`).join('')||'<div style="color:#9fb3cc;font-size:12px">Nenhum personagem de jogador nos mapas.</div>'}
<button type="button" data-nec="tudo" style="${bs}">✨ Grupo todo: sem fome, sem sede e descansado</button>
<div style="color:#9fb3cc;font-size:12px">A faxina tira móveis que vazaram de outro mapa (portas e cápsulas da Última Bateria) e as cópias amontoadas de NPCs com nome (Hessa Varn…). Guarda cópia de segurança.</div>`;
  pop.hidden=false;const r=botao?.getBoundingClientRect();if(r){pop.style.left=Math.max(8,Math.min(win.innerWidth-330,r.left))+'px';pop.style.top=Math.max(8,Math.min(win.innerHeight-200,r.top-190))+'px';}
 }
 // v151: o mapa aberto na mesa usa sempre o tamanho atual do mapa (ex.: Última Bateria 42×21 → 28×14); senão os móveis aparecem encolhidos
 let ultimoAcerto='';
 if(dep.onSnapshot)dep.onSnapshot(D('combatesAtivos/mapaMesaSyncDireta'),sn=>{try{
  if(!ehMestre()||!sn.exists())return;const v=sn.data()||{},id=String(v.mapId||'');if(!id)return;
  const m=(dep.mapas?.()||[]).find(x=>String(x.id)===id),W=Number(m?.larguraM),H=Number(m?.alturaM);if(!(W>0&&H>0))return;
  if(Number(v.larguraM)===W&&Number(v.alturaM)===H)return;const k=id+'|'+W+'x'+H;if(k===ultimoAcerto)return;ultimoAcerto=k;
  void dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta'),{larguraM:W,alturaM:H},{merge:true}).then(()=>{try{ctl()?.refreshView?.();}catch(_){}}).catch(e=>console.warn('[Faxina] tamanho do mapa',e));
 }catch(e){console.warn('[Faxina] tamanho',e);}},()=>{});
 const vigia=setInterval(()=>{try{ferramentas();}catch(_){}void rodar().catch(e=>console.warn('[Faxina]',e));},5000);
 setTimeout(()=>{try{ferramentas();}catch(_){}},1500);
 win.mesaLimpezaV146_={rodar,parar:()=>clearInterval(vigia)};
 return win.mesaLimpezaV146_;
}
