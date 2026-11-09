// Mesa Estelar v224.1 — três modos do mestre para o mesmo mundo compartilhado:
//   🏗️ Mapa construtor — visão de cima, para construir cidade/casa.
//   👑 Mapa do mestre — visão de jogo para dirigir a sessão; botão direito num NPC abre o jogo.
//   🎮 Mapa de jogo   — a mesma visão do jogador, controlando quem foi escolhido.
// Por enquanto as três usam o mesmo tabuleiro (`#sincronizacao-nova`), que é movido para a aba ativa.
// A aba "Mapa da Mesa" original continua exatamente como era; ao voltar, o tabuleiro volta para lá.
import {MATERIAIS,oChao,oParede,oPorta,montarPeca} from './mesa-construcao.js?v=180';
import {instalarLaboratorio25D} from './mesa-lab25d.js?v=232';
const MAPA_T='mesa_laboratorio_v224',MAPA_I='mesa_laboratorio_v224_interior',LIG='combatesAtivos/mesaLigacoes';
const MAPAS_DESCARTADOS_V224=new Set([MAPA_T,MAPA_I]);
const MAPAS_REFERENCIA_V225=/^(?:Ecossistema\s*\(teste\)|Casa de teste\s*\(básico\))$/i;
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
const CSS=`
/* v224.1: o mundo ocupa a largura da área de trabalho, mantendo proporções do mapa. */
body:is(.mapa-construtor,.mapa-mestre,.mapa-jogo) #sincronizacao-nova .nova-board-scroll{width:100%!important;box-sizing:border-box!important;overflow:auto!important;scrollbar-width:thin;min-height:65dvh!important}
body:is(.mapa-construtor,.mapa-mestre,.mapa-jogo) #novaSyncBoard{width:100%!important;height:auto!important;min-height:550px!important;aspect-ratio:var(--mtm-proporcao,2 / 1)!important;max-width:none!important;box-sizing:border-box}
body:is(.mapa-construtor,.mapa-mestre,.mapa-jogo) #sincronizacao-nova{height:auto!important;min-height:calc(100dvh - 170px)!important}
body:is(.mapa-construtor,.mapa-mestre,.mapa-jogo) #sincronizacao-nova>.form-section{height:auto!important;min-height:calc(100dvh - 180px)!important}
body:is(.mapa-construtor,.mapa-mestre,.mapa-jogo) #mbBarra{max-height:none!important;overflow:visible!important;display:flex!important;flex-wrap:wrap!important;gap:6px}
body:is(.mapa-construtor,.mapa-mestre,.mapa-jogo) #mbBarra button,body:is(.mapa-construtor,.mapa-mestre,.mapa-jogo) #mbBarra select{max-width:100%;white-space:nowrap}
.mtm-mini{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 7px;padding:6px 9px;background:rgba(12,22,38,.87);border:1px solid #344c66;border-radius:8px;font:12px 'Segoe UI',sans-serif;color:#cbd9ea}
.mtm-mini label{display:flex;align-items:center;gap:5px}
.mtm-mini select{background:#17273d;color:white;border:1px solid #44607d;border-radius:5px;max-width:min(300px,60vw);padding:5px}
.mtm-mini .mtm-estado{color:#afc4dc}
body.mapa-jogo #mbBarra{display:flex!important}
body.mtm-preview25d .mtm-host>#sincronizacao-nova{position:absolute!important;left:-200vw!important;top:0!important;visibility:hidden!important;pointer-events:none!important;width:100%!important}
body.mtm-preview25d .mtm-host{position:relative}

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
body.mapa-construtor #mbBarra [data-a="atuar"]{display:none!important}
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
 let lab25D=null,modoLab25D=true;
 function atualizarVisual25D(){
  const board=root.getElementById('novaSyncBoard');
  const mapa=String(win.novaSyncController_?.mapaAtual?.()||board?.dataset.mapaVisivel||'');
  const mostrar=ehMestre()&&!!atual&&modoLab25D;
  if(mostrar&&!lab25D){
   const host=root.getElementById(atual)?.querySelector('.mtm-host');
   if(host)lab25D=instalarLaboratorio25D({
    root,win,host,
    cenaAtual:()=>win.novaSyncController_?.cenaAtual?.()||null,
    dimensoes:()=>win.novaSyncController_?.dimsAtual?.()||({W:28,H:14}),
    mapaAtual:()=>String(win.novaSyncController_?.mapaAtual?.()||'')
   });
  }
  // Quando o laboratório é alternado, o tabuleiro continua montado para as
  // assinaturas do Firebase, mas só uma visualização aparece ao usuário.
  root.body.classList.toggle('mtm-preview25d',mostrar);
  const host=root.getElementById(atual)?.querySelector('.mtm-host');
  if(lab25D?.el&&host&&!host.contains(lab25D.el))host.prepend(lab25D.el);
  lab25D?.atualizar({visivel:mostrar,token:atorSelecionado,modo:atual});
  for(const btn of root.querySelectorAll('[data-mtm-preview]')){
   btn.hidden=!atual;
   btn.textContent=modoLab25D?'🗺️ Editar no mapa funcional':(atual==='mapa-construtor'?'🏗️ Voltar à câmera 3D':'🏠 Ver protótipo 2,5D');
  }
 }

 function filtrarMapasDaArea(){
  // v225.1: Não filtrar as opções da barra. <option hidden/disabled> não
  // funciona de maneira consistente nos seletores nativos (Edge/Windows).
  // A barra já exclui mapas arquivados V176 e preserva os demais.
  const seletor=root.querySelector('#mbBarra [data-mapa]');
  if(!seletor)return;
  for(const option of seletor.options){
   option.hidden=false;
   option.disabled=false;
  }
  const quantidade=[...seletor.options].filter(o=>o.value).length;
  const aviso=root.getElementById(atual)?.querySelector('[data-mtm-mapas-disponiveis]');
  if(aviso)aviso.textContent=quantidade+' mapa'+(quantidade===1?'':'s')+' '+(quantidade===1?'disponível':'disponíveis')+' · Arquivados no Banco de Mapas';
 }
 async function limparLaboratoriosRuins(){
  if(!ehMestre()||!dep.deleteDoc)throw Error('Exclusão indisponível para esta sessão.');
  const ids=[...MAPAS_DESCARTADOS_V224],existentes=(dep.mapas?.()||[]).filter(m=>ids.includes(String(m.id)));
  if(!existentes.length){win.alert('Os dois mapas ruins v224 não aparecem mais na lista. Nada a excluir.');return;}
  const nomes=existentes.map(m=>m.nome||m.id).join('\\n');
  if(!win.confirm('Excluir SOMENTE estes mapas ruins do Firebase?\\n\\n'+nomes+'\\n\\nEcossistema (teste), Casa de teste (básico) e mapas da campanha NÃO serão excluídos.'))return;
  const atualId=String(win.novaSyncController_?.mapaAtual?.()||root.getElementById('novaSyncBoard')?.dataset.mapaVisivel||'');
  if(ids.includes(atualId)){
   const ref=(dep.mapas?.()||[]).find(m=>MAPAS_REFERENCIA_V225.test(String(m.nome||'')));
   if(!ref)throw Error('Selecione um mapa diferente no Mapa da Mesa antes de excluir o laboratório ativo.');
   await win.novaSyncController_?.openMap?.(String(ref.id));
  }
  const erros=[];
  for(const m of existentes){
   const id=String(m.id);
   try{
    // Documentos de cena criados exclusivamente pela ferramenta v224.
    await dep.deleteDoc(dep.doc(dep.db,'combatesAtivos','mapaMesaSyncCena_'+id));
    await dep.deleteDoc(dep.doc(dep.db,'mapas',id));
   }catch(e){erros.push((m.nome||id)+': '+(e?.code||e?.message||e));}
  }
  try{await win.recarregarBancoMapas_?.();}catch(e){console.warn('[Três mapas] atualização',e);}
  filtrarMapasDaArea();
  if(erros.length)win.alert('Algumas exclusões falharam:\\n'+erros.join('\\n'));
  else win.alert('Laboratórios v224 ruins excluídos. Os mapas de referência foram preservados.');
 }
 function casaExterior(){
  const W=28,H=14;
  const madeira=MATERIAIS.find(m=>m.id==='madeira')||MATERIAIS[0];
  const pedra=MATERIAIS.find(m=>m.id==='pedra-polida')||MATERIAIS[0];
  const solo=[oChao({x:0,y:0,w:W,h:H},MATERIAIS.find(m=>m.id==='adobe')||madeira,W,H,'Terreno da vila'),
    oChao({x:0,y:5.8,w:W,h:2.4},pedra,W,H,'Rua principal'),
    oChao({x:12.5,y:0,w:3,h:H},pedra,W,H,'Travessa')];
  const casas=[
    ...montarPeca('casa_media',{x:6,y:3},{M:2,mat:'madeira',W,H}),
    ...montarPeca('casa_pequena',{x:21,y:3},{M:2,mat:'tijolo',W,H}),
    ...montarPeca('casa_pequena',{x:6,y:11},{M:2,mat:'adobe',W,H}),
    ...montarPeca('casa_pequena',{x:21,y:11},{M:2,mat:'madeira',W,H})
  ];
  return [...solo,...casas];
 }
 function interior(){
  const W=10,H=7,mat=MATERIAIS.find(m=>m.id==='madeira')||MATERIAIS[0],out=[oChao({x:0,y:0,w:W,h:H},MATERIAIS.find(m=>m.id==='pedra-polida')||mat,W,H)];
  out.push(oParede({x:0,y:0,w:W,h:.3},mat,W,H),oParede({x:0,y:H-.3,w:W,h:.3},mat,W,H),oParede({x:0,y:.3,w:.3,h:H-.6},mat,W,H),oParede({x:W-.3,y:.3,w:.3,h:H-.6},mat,W,H));
  out.push(oPorta({x:Math.round(W/2)-1,y:H-.3,w:2,h:.3},mat,W,H));return out;
 }
 async function garantirMapa(){
  if(!dep.setDoc||!dep.doc||!dep.db)throw Error('API de gravação indisponível. Abra um mapa como mestre.');
  const db=dep.db,docFn=dep.doc,setDoc=dep.setDoc,dono=uid();
  let etapa='Verificar mapas';
  const gravar=async(path,data)=>{
    etapa=path;
    try{return await setDoc(docFn(db,...path.split('/')),data);}
    catch(err){
      const e=new Error('Permissão ou gravação recusada em '+etapa+': '+String(err?.code||err?.message||err));
      e.cause=err;
      throw e;
    }
  };
  // O laboratório cria SOMENTE mapas/cenas. Miniaturas e vínculos de campanha
  // devem ser adicionados pelos sistemas oficiais depois de confirmar o mapa.
  // Assim a demonstração não sobrescreve personagens com IDs reutilizados.
  etapa='mapas/'+MAPA_T;
  if(!(dep.mapas?.()||[]).some(m=>String(m.id)===MAPA_T)){
    await gravar('mapas/'+MAPA_T,{id:MAPA_T,nome:'Laboratório v224 — Vila de demonstração',larguraM:28,alturaM:14,pxPorMetro:40,fundo:'#4f6b3a',criadoPor:dono,atualizadoEm:new Date().toISOString(),testeV224:true});
  }
  await gravar('combatesAtivos/mapaMesaSyncCena_'+MAPA_T,{mapId:MAPA_T,objects:casaExterior()});
  etapa='mapas/'+MAPA_I;
  if(!(dep.mapas?.()||[]).some(m=>String(m.id)===MAPA_I)){
    await gravar('mapas/'+MAPA_I,{id:MAPA_I,nome:'Laboratório v224 — Interior da casa',larguraM:10,alturaM:7,pxPorMetro:40,fundo:'#6b5a44',criadoPor:dono,atualizadoEm:new Date().toISOString(),testeV224:true});
  }
  await gravar('combatesAtivos/mapaMesaSyncCena_'+MAPA_I,{mapId:MAPA_I,objects:interior()});
  try{await win.recarregarBancoMapas_?.();}catch(err){console.warn('[Três mapas] recarregar lista:',err);}
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
  ['mapa-construtor','🏗️','Mapa construtor','Câmera 3D livre para construir e inspecionar ambientes'],
  ['mapa-mestre','👑','Mapa do mestre','Direção da sessão; botão direito num NPC abre o jogo'],
  ['mapa-jogo','🎮','Mapa de jogo','A visão do jogador, controlando quem foi escolhido']
 ];
 let atual='';let ancora=btnFicha;let atorSelecionado='';let vistaAnterior=null;let seletorV224=null;
 for(const [id,ic,nome,dica] of defs){
  if(root.getElementById(id))continue;
  const b=root.createElement('button');b.type='button';b.className='tab-btn mtm-tab';b.dataset.mtm=id;b.textContent=ic+' '+nome;b.title=dica;
  b.hidden=!ehMestre();
  b.addEventListener('click',()=>abrir(id,b));
  tabs.insertBefore(b,ancora?.nextSibling||null);ancora=b;
  const sec=root.createElement('div');sec.id=id;sec.className='tab-content';sec.innerHTML=`<div class="form-section"><div class="mtm-faixa"><b>${ic} ${nome}</b><span class="mtm-dica">${dica}</span><div class="mtm-controles"><button type="button" data-limpar-demo>🗑️ Excluir laboratórios ruins</button><button type="button" data-mtm-preview hidden>🏠 Ver protótipo 2,5D</button><button type="button" data-editar-casa>🧱 Construir</button><button type="button" data-diretor>🧭 NPCs e criaturas</button><button type="button" data-voltar-mesa>Voltar à Mesa</button></div></div><div class="mtm-mini"><label data-mtm-escolha>Mapa <select data-mtm-mapa-select aria-label="Selecionar mapa para os três visualizadores"><option value="">Escolha um mapa…</option></select></label><span data-mtm-mapa>Mapa carregado: verificando…</span><span data-mtm-mapas-disponiveis style="color:#9fb3cc"></span><label data-mtm-seletor style="display:none">Acompanhar <select data-mtm-ator><option value="">Selecione uma miniatura</option></select></label><span class="mtm-estado" data-mtm-estado></span></div><div class="mtm-host"></div></div>`;
  sec.querySelector('[data-mtm-mapa-select]').addEventListener('change',async e=>{
    const sel=e.currentTarget,novo=String(sel.value||'');
    if(!novo)return;
    const old=String(win.novaSyncController_?.mapaAtual?.()||'');
    if(novo===old)return;
    sel.disabled=true;
    try{
     if(!win.novaSyncController_?.openMap)throw Error('Controlador de mapas não carregado.');
     await win.novaSyncController_.openMap(novo);
     atualizarPainel();atualizarVisual25D();
    }catch(err){
     console.warn('[Três mapas] falha ao selecionar mapa',err);
     sel.value=old;
     win.alert('Não foi possível abrir o mapa: '+(err?.message||err));
    }finally{sel.disabled=false;}
   });
   sec.querySelector('[data-limpar-demo]').hidden=id!=='mapa-construtor';
  sec.querySelector('[data-limpar-demo]').addEventListener('click',async e=>{
   const botao=e.currentTarget;botao.disabled=true;
   try{await limparLaboratoriosRuins();}catch(err){console.warn('[Três mapas] limpeza',err);win.alert(err?.message||String(err));}
   finally{botao.disabled=false;}
  });
  sec.querySelector('[data-mtm-preview]').addEventListener('click',()=>{modoLab25D=!modoLab25D;atualizarVisual25D();});
  const btnConstruir=sec.querySelector('[data-editar-casa]');
  btnConstruir.hidden=id!=='mapa-construtor';
  btnConstruir.addEventListener('click',()=>{
   // O editor oficial ainda usa o tabuleiro funcional. Não abri-lo por trás
   // da câmera 3D, onde seus controles ficariam invisíveis.
   if(modoLab25D){modoLab25D=false;atualizarVisual25D();}
   const construtor=win.mesaOficina3V175?.construtor;
   if(!construtor?.entrar){win.alert('O editor de construção ainda não carregou. Abra um mapa e tente novamente.');return;}
   try{construtor.entrar();}catch(err){win.alert('Não foi possível abrir o construtor: '+(err?.message||err));}
  });
  const btnDiretor=sec.querySelector('[data-diretor]');
  btnDiretor.hidden=id!=='mapa-mestre';
  btnDiretor.addEventListener('click',()=>{
   const botao=root.getElementById('mdBotao');
   if(botao)botao.click();else win.alert('O painel Diretor de cena ainda não está disponível.');
  });
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
  // Os três visualizadores iniciam no 2,5D. No Construtor, a edição 2D
  // continua acessível por um botão, sem mudar a aba nem abrir Mapa da Mesa.
  modoLab25D=true;
  atualizarPainel();
  atualizarVisual25D();
  filtrarMapasDaArea();
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
  atualizarVisual25D();
  filtrarMapasDaArea();
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
  win.mesaCameraV144?.seguirToken?.(id&&!id.startsWith('__')?id:'');
 }
 root.getElementById('novaSyncPersonagem')?.addEventListener('change',e=>{if(atual==='mapa-jogo'){atorSelecionado=String(e.target.value||'');controleDoSelecionado();}});
 function atualizarPainel(){
  if(!atual)return;
  const sec=root.getElementById(atual),board=root.getElementById('novaSyncBoard');
  const id=String(win.novaSyncController_?.mapaAtual?.()||board?.dataset.mapaVisivel||'');
  const mapa=(dep.mapas?.()||[]).find(m=>String(m.id)===id);
  const nome=mapa?.nome||id||'Nenhum mapa selecionado';
  const dest=sec?.querySelector('[data-mtm-mapa]');
  if(dest)dest.textContent=id?'Mapa compartilhado: '+nome:'Nenhum mapa ativo. Escolha um mapa acima.';
  const selMapa=sec?.querySelector('[data-mtm-mapa-select]');
  if(selMapa){
   const lista=[...(dep.mapas?.()||[])].filter(m=>m?.id&&!m.arquivadoV176&&!String(m.id).includes('__parte__'))
    .sort((a,b)=>String(a.nome||a.id).localeCompare(String(b.nome||b.id),'pt'));
   const signature=lista.map(m=>String(m.id)+'='+String(m.nome||m.id)).join('|')+'#'+id;
   if(selMapa.dataset.signature!==signature&&root.activeElement!==selMapa){
    selMapa.replaceChildren(new Option('Escolha um mapa…',''),...lista.map(m=>new Option(String(m.nome||m.id),String(m.id))));
    selMapa.dataset.signature=signature;
   }
   if(root.activeElement!==selMapa)selMapa.value=lista.some(m=>String(m.id)===id)?id:'';
  }
  const dims=win.novaSyncController_?.dimsAtual?.();
  const w=Number(dims?.W||mapa?.larguraM||28),h=Number(dims?.H||mapa?.alturaM||14);
  if(board&&w>0&&h>0)board.style.setProperty('--mtm-proporcao',w+' / '+h);
  const extra=sec?.querySelector('[data-mtm-seletor]');
  if(extra)extra.style.display=atual==='mapa-jogo'?'flex':'none';
  const orig=root.getElementById('novaSyncPersonagem'),sel=sec?.querySelector('[data-mtm-ator]');
  if(sel){
   // O seletor original pode estar vazio mesmo quando já há miniaturas no mapa.
   // Reconstruir a lista também a partir do tabuleiro visível.
   const itens=new Map();
   for(const o of [...(orig?.options||[])])if(o.value&&!o.value.startsWith('__')&&!/fora do mapa/i.test(o.textContent||''))itens.set(o.value,o.textContent||o.value);
   for(const tk of board?.querySelectorAll('[data-token]')||[]){
    const token=String(tk.dataset.token||'');if(!token)continue;
    if(!itens.has(token))itens.set(token,tk.dataset.nome||tk.getAttribute('title')||token.replace(/^sync(?:npc|criatura):/,''));
   }
   const cod=[...itens].map(([k,v])=>k+'='+v).join('|');
   if(sel.dataset.itens!==cod){
    sel.replaceChildren(new Option('Selecione uma miniatura',''),...[...itens].map(([k,v])=>new Option(v,k)));
    sel.dataset.itens=cod;
   }
   if(atorSelecionado&&!itens.has(atorSelecionado))atorSelecionado='';
   if(!atorSelecionado&&atual==='mapa-jogo'&&itens.size)atorSelecionado=itens.keys().next().value;
   sel.value=atorSelecionado||'';
  }
  const st=sec?.querySelector('[data-mtm-estado]');
  if(st)st.textContent=atual==='mapa-construtor'?'Construção: câmera 3D livre · Construir abre o editor funcional':atual==='mapa-mestre'?'Direção: botão direito sobre uma miniatura para acompanhá-la':'Jogo: protótipo geométrico experimental. Controle de personagens ainda em desenvolvimento.';
 }
 root.querySelectorAll('[data-mtm-ator]').forEach(sel=>sel.addEventListener('change',e=>{
  atorSelecionado=String(e.target.value||'');
  const orig=root.getElementById('novaSyncPersonagem');
  if(orig&&[...orig.options].some(o=>o.value===atorSelecionado)){orig.value=atorSelecionado;orig.dispatchEvent(new Event('change',{bubbles:true}));}
  if(atual==='mapa-jogo')controleDoSelecionado();
 }));
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
  try{if(typeof win.abrirMapaNosVisualizadores_==='function')void win.abrirMapaNosVisualizadores_(destino);else void win.novaSyncController_?.openMap?.(destino);}catch(err){console.warn('[Três mapas] abrir interior:',err);}
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
 const iv=setInterval(()=>{try{if(!ehMestre()&&atual){voltarMesa();}for(const b of root.querySelectorAll('.mtm-tab'))b.hidden=!ehMestre();if(atual){atualizarPainel();atualizarVisual25D();filtrarMapasDaArea();}else atualizarVisual25D();}catch(_){}},1500);iv.unref?.();
 return {abrir,voltarMesa,aba:()=>atual};
}
