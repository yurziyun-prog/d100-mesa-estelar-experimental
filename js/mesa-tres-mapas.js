// Mesa Estelar v222 — três abas do mestre em cima do MESMO mapa:
//   🏗️ Mapa construtor — visão de cima, para construir cidade/casa.
//   👑 Mapa do mestre — visão de jogo para dirigir a sessão; botão direito num NPC abre o jogo.
//   🎮 Mapa de jogo   — a mesma visão do jogador, controlando quem foi escolhido.
// Por enquanto as três usam o mesmo tabuleiro (`#sincronizacao-nova`), que é movido para a aba ativa.
// A aba "Mapa da Mesa" original continua exatamente como era; ao voltar, o tabuleiro volta para lá.
import {MATERIAIS,oChao,oParede,oPorta,montarPeca} from './mesa-construcao.js?v=180';
const MAPA_T='mesa_tres_v223',MAPA_I='mesa_tres_v223_dentro',LIG='combatesAtivos/mesaLigacoes';
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
const CSS=`
body.mapa-construtor,body.mapa-mestre,body.mapa-jogo{overflow-y:auto!important;height:auto!important;min-height:100vh!important}
#mapa-construtor,#mapa-mestre,#mapa-jogo{width:100%;max-width:none!important;box-sizing:border-box}
#mapa-construtor>.form-section,#mapa-mestre>.form-section,#mapa-jogo>.form-section{width:100%;max-width:none!important;margin:0!important;padding:8px!important;box-sizing:border-box}
.mtm-host{width:100%;max-width:none;min-height:calc(100dvh - 160px)}
.mtm-faixa{justify-content:space-between;gap:8px}
.mtm-controles{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}
.mtm-controles button{border:1px solid #43607d;background:#172a42;color:#e8f4ff;border-radius:7px;padding:5px 9px;cursor:pointer}
body:is(.mapa-construtor,.mapa-mestre,.mapa-jogo) #sincronizacao-nova{width:100%!important;max-width:none!important}
body:is(.mapa-construtor,.mapa-mestre,.mapa-jogo) #sincronizacao-nova .nova-view-tools{display:flex!important;flex-wrap:wrap!important;height:auto!important;gap:6px}
body:is(.mapa-construtor,.mapa-mestre) #mbBarra{display:flex;flex-wrap:wrap;gap:5px;height:auto!important;max-width:100%}

#mapa-construtor,#mapa-mestre,#mapa-jogo{position:relative}
.mtm-host{min-height:60vh}
.mtm-host>#sincronizacao-nova{display:block!important}
.mtm-faixa{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 8px;padding:7px 10px;border-radius:10px;border:1px solid #2f4664;background:rgba(8,14,26,.75);color:#c6d3e6;font:12.5px 'Segoe UI',Arial,sans-serif}
.mtm-faixa b{color:#eafcff}.mtm-faixa .mtm-dica{color:#9fb3cc}
body.mapa-construtor #mbBarra [data-a="atuar"],body.mapa-construtor #mbBarra [data-a="remover"]{display:none!important}
body.mapa-jogo #mbBarra [data-a="editar"],body.mapa-jogo #mbBarra [data-a="colocar"],body.mapa-jogo #mbBarra [data-a="mover"],body.mapa-jogo #mbBarra [data-a="remover"],body.mapa-jogo #mbBarra [data-a="desenhar"]{display:none!important}
body.mapa-jogo #mdAtalhos,body.mapa-jogo #mbTopo,body.mapa-jogo #mbBase{display:none!important}
/* a seção antiga vira só o tabuleiro dentro das abas novas */
body.mapa-construtor #sincronizacao-nova,body.mapa-mestre #sincronizacao-nova,body.mapa-jogo #sincronizacao-nova{display:flex!important;flex-direction:column;height:calc(100vh - 165px);height:calc(100dvh - 165px);min-height:0;margin:0!important}
body.mapa-construtor #sincronizacao-nova>.form-section,body.mapa-mestre #sincronizacao-nova>.form-section,body.mapa-jogo #sincronizacao-nova>.form-section{display:flex;flex-direction:column;height:100%;min-height:0;margin:0!important;padding:6px!important}
body.mapa-construtor #sincronizacao-nova h2,body.mapa-mestre #sincronizacao-nova h2,body.mapa-jogo #sincronizacao-nova h2,
body.mapa-construtor #novaSyncStatus,body.mapa-mestre #novaSyncStatus,body.mapa-jogo #novaSyncStatus,
body.mapa-construtor #novaSyncMasterPanel,body.mapa-mestre #novaSyncMasterPanel,body.mapa-jogo #novaSyncMasterPanel,
body.mapa-construtor #mdAtalhos,body.mapa-mestre #mdAtalhos,
body.mapa-construtor #novaSyncFichaGaveta,body.mapa-mestre #novaSyncFichaGaveta,body.mapa-jogo #novaSyncFichaGaveta,
body.mapa-construtor #novaSyncHistorySection,body.mapa-mestre #novaSyncHistorySection,body.mapa-jogo #novaSyncHistorySection{display:none!important}
body.mapa-construtor #sincronizacao-nova .nova-board-scroll,body.mapa-mestre #sincronizacao-nova .nova-board-scroll,body.mapa-jogo #sincronizacao-nova .nova-board-scroll{flex:1 1 auto!important;min-height:0!important;max-height:none!important}
body.mapa-jogo #mbBarra{display:none!important}
body.mapa-construtor #mbBarra>:not(select[data-mapa]):not([data-mapa-ant]):not([data-mapa-prox]):not([data-a="colocar"]):not([data-a="mover"]):not([data-a="desenhar"]):not([data-a="remover"]){display:none!important}
body.mapa-mestre #mbBarra>:not(select[data-mapa]):not([data-mapa-ant]):not([data-mapa-prox]):not([data-a="colocar"]):not([data-a="mover"]):not([data-a="atuar"]):not([data-a="remover"]):not([data-ator]){display:none!important}
body.mapa-construtor #mbTopo,body.mapa-mestre #mbTopo,body.mapa-construtor #mbBase,body.mapa-mestre #mbBase,
body.mapa-construtor #rlNecTopo,body.mapa-mestre #rlNecTopo,body.mapa-construtor #novaMapTopV68,body.mapa-mestre #novaMapTopV68,
body.mapa-construtor #novaSyncStatus,body.mapa-mestre #novaSyncStatus,body.mapa-jogo #novaSyncStatus,
body.mapa-jogo #rlNecTopo,body.mapa-jogo #novaMapTopV68{display:none!important}
body.mapa-construtor #mbBarra .mb-turno,body.mapa-mestre #mbBarra .mb-turno,body.mapa-construtor #mbBarra .mb-st,body.mapa-mestre #mbBarra .mb-st{display:none!important}
`;
export function instalarTresMapas(dep={}){
 const root=dep.root||document,win=root.defaultView||window;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'mestre');}catch(_){return 'mestre';}};
 function casaExterior(){
  const casa=montarPeca('casa_pequena',{x:14,y:7},{M:2,mat:'tijolo',W:28,H:14}).filter(o=>!o.tetoV139);
  return casa;
 }
 function interior(){
  const W=10,H=7,mat=MATERIAIS.find(m=>m.id==='madeira')||MATERIAIS[0],out=[oChao({x:0,y:0,w:W,h:H},MATERIAIS.find(m=>m.id==='pedra-polida')||mat,W,H)];
  out.push(oParede({x:0,y:0,w:W,h:.3},mat,W,H),oParede({x:0,y:H-.3,w:W,h:.3},mat,W,H),oParede({x:0,y:.3,w:.3,h:H-.6},mat,W,H),oParede({x:W-.3,y:.3,w:.3,h:H-.6},mat,W,H));
  out.push(oPorta({x:Math.round(W/2)-1,y:H-.3,w:2,h:.3},mat,W,H));return out;
 }
 async function garantirMapa(){
  if(!dep.setDoc||!dep.doc)return false;
  const ja=(dep.mapas?.()||[]).some(m=>String(m.id)===MAPA_T);if(ja)return true;
  const db=dep.db,docFn=dep.doc,setDoc=dep.setDoc,dono=uid();
  await setDoc(docFn(db,'mapas',MAPA_T),{id:MAPA_T,nome:'Mapa 2.5D — vila simples',larguraM:28,alturaM:14,pxPorMetro:40,fundo:'#4f6b3a',criadoPor:dono,atualizadoEm:new Date().toISOString(),testeV222:true});
  await setDoc(docFn(db,'combatesAtivos','mapaMesaSyncCena_'+MAPA_T),{mapId:MAPA_T,objects:casaExterior()});
  await setDoc(docFn(db,'mapas',MAPA_I),{id:MAPA_I,nome:'Mapa 2.5D — casa por dentro',larguraM:10,alturaM:7,pxPorMetro:40,fundo:'#6b5a44',criadoPor:dono,atualizadoEm:new Date().toISOString(),testeV222:true});
  await setDoc(docFn(db,'combatesAtivos','mapaMesaSyncCena_'+MAPA_I),{mapId:MAPA_I,objects:interior()});
  await setDoc(docFn(db,POS+'/demo_kael'),{nome:'Kael Teste',imagem:'',donoUid:dono,x:8,y:11,revision:0,facing:0,camada:3,mapaId:MAPA_T,diametroM:2.2});
  await setDoc(docFn(db,POS+'/syncnpc:ferreiro~1'),{nome:'Ferreiro',imagem:'',donoUid:'',x:19,y:9,revision:0,facing:0,camada:3,mapaId:MAPA_T,diametroM:1});
  await setDoc(docFn(db,POS+'/synccriatura:zumbi_1~1'),{nome:'Zumbi de teste',imagem:'',donoUid:'',x:23,y:5,revision:0,facing:0,camada:3,mapaId:MAPA_T,diametroM:1});
  const snap=await dep.getDoc?.(docFn(db,LIG));const v=snap?.exists?.()?snap.data():{};
  const ligs=(v.ligacoes||[]).filter(l=>l.id!=='ligTres222');
  ligs.push({id:'ligTres222',a:{mapa:MAPA_T,x:13,y:11.2},b:{mapa:MAPA_I,x:5,y:6.2},tipo:'porta',interiorV164:true,testeV222:true});
  await setDoc(docFn(db,LIG),{...v,ligacoes:ligs,atualizadoEm:Date.now()});
  await win.recarregarBancoMapas_?.();
  return true;
 }
 if(root.getElementById('mtmCss'))return;
 const st=root.createElement('style');st.id='mtmCss';st.textContent=CSS;root.head.append(st);
 const tabs=root.querySelector('#appScreen > .tabs');
 if(!tabs)return;
 const sync=root.getElementById('sincronizacao-nova');if(!sync)return;
 const paiOriginal=sync.parentElement,proximoOriginal=sync.nextSibling;
 const btnFicha=[...tabs.querySelectorAll('.tab-btn')].find(b=>/mostrarAba\('ficha'/.test(b.getAttribute('onclick')||''));
 const defs=[
  ['mapa-construtor','🏗️','Mapa construtor','Visão de cima para construir cidade e casa'],
  ['mapa-mestre','👑','Mapa do mestre','Direção da sessão; botão direito num NPC abre o jogo'],
  ['mapa-jogo','🎮','Mapa de jogo','A visão do jogador, controlando quem foi escolhido']
 ];
 let atual='';let ancora=btnFicha;let atorSelecionado='';let vistaAnterior=null;
 for(const [id,ic,nome,dica] of defs){
  if(root.getElementById(id))continue;
  const b=root.createElement('button');b.type='button';b.className='tab-btn mtm-tab';b.dataset.mtm=id;b.textContent=ic+' '+nome;b.title=dica;
  b.hidden=!ehMestre();
  b.addEventListener('click',()=>abrir(id,b));
  tabs.insertBefore(b,ancora?.nextSibling||null);ancora=b;
  const sec=root.createElement('div');sec.id=id;sec.className='tab-content';sec.innerHTML=`<div class="form-section"><div class="mtm-faixa"><b>${ic} ${nome}</b><span class="mtm-dica">${dica}</span><div class="mtm-controles"><button type="button" data-criar-demo>Criar vila de teste</button><button type="button" data-voltar-mesa>Voltar à Mesa</button></div></div><div class="mtm-host"></div></div>`;
  sec.querySelector('[data-criar-demo]').addEventListener('click',async e=>{if(!win.confirm('Criar vila, interior e personagens de teste no banco compartilhado?'))return;const btn=e.currentTarget;btn.disabled=true;try{await garantirMapa();await win.abrirMapaBancoNaMesa_?.(MAPA_T);}catch(err){console.warn('[Três mapas]',err);win.alert('Falha ao criar mapa: '+(err?.message||err));}finally{btn.disabled=false;}});
  sec.querySelector('[data-voltar-mesa]').addEventListener('click',()=>voltarMesa(true));
  root.getElementById('appScreen')?.append(sec);
 }
 function escondeTudo(){
  for(const s of root.querySelectorAll('#appScreen > .tab-content'))s.classList.remove('active');
  for(const b of root.querySelectorAll('#appScreen > .tabs .tab-btn'))b.classList.remove('active');
 }
 async function abrir(id,btn){
  if(!ehMestre())return;
  const alvo=root.getElementById(id),host=alvo?.querySelector('.mtm-host');if(!host)return;
  if(!atual)vistaAnterior={angulo:win.mesaCameraV144?.angulo?.(),zoom:win.mesaCameraV144?.zoom?.()};
  // Nenhuma gravação ou troca de mapa acontece ao abrir uma aba.
  escondeTudo();alvo.classList.add('active');btn?.classList.add('active');
  if(sync.parentElement!==host)host.append(sync);
  sync.classList.add('active');
  root.body.classList.remove('mapa-construtor','mapa-mestre','mapa-jogo');root.body.classList.add(id);
  atual=id;win.mesaVista25D=id!=='mapa-construtor';
  const cam=win.mesaCameraV144;
  if(id==='mapa-construtor'){cam?.seguirToken?.('');cam?.inclinar?.(0);cam?.definir?.(1);}
  else if(id==='mapa-mestre'){cam?.seguirToken?.('');cam?.inclinar?.(30);cam?.definir?.(1.5);}
  else{cam?.inclinar?.(35);cam?.definir?.(2);controleDoSelecionado();}
  try{win.dispatchEvent(new CustomEvent('mesa-aba-tres-mapas',{detail:{aba:id}}));}catch(_){}
 }
 function restaurarOrigem(){
  if(sync.parentElement!==paiOriginal)paiOriginal.insertBefore(sync,proximoOriginal||null);
  root.body.classList.remove('mapa-construtor','mapa-mestre','mapa-jogo');
  atual='';win.mesaVista25D=false;
  const cam=win.mesaCameraV144;cam?.seguirToken?.('');
  if(vistaAnterior){if(Number.isFinite(vistaAnterior.angulo))cam?.inclinar?.(vistaAnterior.angulo);if(Number.isFinite(vistaAnterior.zoom))cam?.definir?.(vistaAnterior.zoom);}
  vistaAnterior=null;
  for(const id of ['mapa-construtor','mapa-mestre','mapa-jogo'])root.getElementById(id)?.classList.remove('active');
 }
 function voltarMesa(navegar=false){
  restaurarOrigem();
  if(navegar)win.mostrarAba?.('sincronizacao-nova',root.getElementById('syncLabTabBtn'));
 }
 // Restaurar tabuleiro antes de navegar para qualquer outra aba existente.
 tabs.addEventListener('click',e=>{const bt=e.target.closest?.('.tab-btn');if(bt&&!bt.classList.contains('mtm-tab')&&atual)restaurarOrigem();},true);
 function controleDoSelecionado(){
  const s=root.getElementById('novaSyncPersonagem');
  const id=atorSelecionado||String(s?.value||'');
  if(id&&!id.startsWith('__'))win.mesaCameraV144?.seguirToken?.(id);
 }
 root.getElementById('novaSyncPersonagem')?.addEventListener('change',e=>{if(atual==='mapa-jogo'){atorSelecionado=String(e.target.value||'');controleDoSelecionado();}});
 // duplo clique numa casa/porta do mapa: se houver interior ligado, abre o interior ampliado
 root.addEventListener('dblclick',e=>{
  if(!ehMestre()||(atual!=='mapa-construtor'&&atual!=='mapa-mestre'))return;
  const obj=e.target.closest?.('#novaSyncBoard [data-scene-object]');if(!obj)return;
  const nome=String(obj.dataset.nome||obj.getAttribute('title')||obj.textContent||'');
  if(!/casa|porta|telhado|teto/i.test(nome))return;
  let mapa='';try{mapa=String(win.__APP__?.ctl?.().mapaAtual?.()||win.novaSyncController_?.mapaAtual?.()||'');}catch(_){}
  const l=(win.mesaLigacoes?.ligacoes?.()||[]).find(x=>x?.interiorV164&&(String(x.a?.mapa)===mapa||String(x.b?.mapa)===mapa));
  if(!l)return;
  const destino=String(l.a?.mapa)===mapa?String(l.b?.mapa):String(l.a?.mapa);
  if(!destino)return;
  e.preventDefault();e.stopPropagation();
  try{win.abrirMapaBancoNaMesa_?.(destino);}catch(_){}
 },true);
 // botão direito numa miniatura, no mapa do mestre, abre o mapa de jogo naquela perspectiva
 root.addEventListener('contextmenu',e=>{
  if(!ehMestre()||atual!=='mapa-mestre')return;
  if(!e.target.closest?.('#novaSyncBoard'))return;
  const tk=e.target.closest('#novaSyncBoard [data-token]');if(!tk)return;
  e.preventDefault();e.stopPropagation();
  const s=root.getElementById('novaSyncPersonagem');if(!s)return;
  atorSelecionado=String(tk.dataset.token||'');
  if([...s.options].some(o=>o.value===atorSelecionado)){s.value=atorSelecionado;s.dispatchEvent(new Event('change',{bubbles:true}));}
  abrir('mapa-jogo',root.querySelector('.mtm-tab[data-mtm="mapa-jogo"]'));
 },true);
 // se a sessão esconder a aba por troca de papel, restaura a seção
 const iv=setInterval(()=>{try{if(!ehMestre()&&atual){voltarMesa();}for(const b of root.querySelectorAll('.mtm-tab'))b.hidden=!ehMestre();}catch(_){}},1500);iv.unref?.();
 return {abrir,voltarMesa,aba:()=>atual};
}
