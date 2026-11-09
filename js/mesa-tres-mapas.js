// Mesa Estelar v224.1 — três modos do mestre para o mesmo mundo compartilhado:
//   🏗️ Mapa construtor — visão de cima, para construir cidade/casa.
//   👑 Mapa do mestre — visão de jogo para dirigir a sessão; botão direito num NPC abre o jogo.
//   🎮 Mapa de jogo   — a mesma visão do jogador, controlando quem foi escolhido.
// Por enquanto as três usam o mesmo tabuleiro (`#sincronizacao-nova`), que é movido para a aba ativa.
// A aba "Mapa da Mesa" original continua exatamente como era; ao voltar, o tabuleiro volta para lá.
import {MATERIAIS,oChao,oParede,oPorta,montarPeca} from './mesa-construcao.js?v=180';
import {instalarLaboratorio25D} from './mesa-lab25d.js?v=240';
const MAPA_T='mesa_laboratorio_v224',MAPA_I='mesa_laboratorio_v224_interior',LIG='combatesAtivos/mesaLigacoes';
const MAPAS_DESCARTADOS_V224=new Set([MAPA_T,MAPA_I]);
const MAPA_PILOTO_V237=/^Mapa\s*2[.,]?5\s*D\s*[—–-]\s*vila\s+simples$/i;
const mapaPilotoV237=m=>!!m?.id&&MAPA_PILOTO_V237.test(String(m.nome||'').trim());
const pilotoV237=mapas=>(Array.isArray(mapas)?mapas:[]).filter(m=>mapaPilotoV237(m)&&!m.arquivadoV176);
const TESTES_DESCARTAVEIS_V237=/^(?:Mapa\s*2[.,]?5\s*D\s*[—–-]\s*casa\s+por\s+dentro|Teste\s*2[.,]?5\s*D\s*[—–-]\s*casa\s+por\s+dentro|Teste\s*2[.,]?5\s*D\s*[—–-]\s*casa,?\s*NPC\s+e\s+criatura)$/i;

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
    mapaAtual:()=>String(win.novaSyncController_?.mapaAtual?.()||''),
    aoCliqueChao:({x,y,W,H})=>{
     if(atual!=='mapa-jogo'||!atorSelecionado)return;
     const ctl=win.novaSyncController_,id=String(atorSelecionado);
     const token=ctl?.token?.(id);
     if(!token||!ctl?.controla?.(token)||String(token.mapaId||'')!==String(ctl.mapaAtual?.()||''))return;
     const sel=root.getElementById('novaSyncPersonagem');
     if(sel&&sel.value!==id&&[...sel.options].some(o=>o.value===id)){
      sel.value=id;sel.dispatchEvent(new Event('change',{bubbles:true}));
     }
     ctl?.pararAndar?.();
     if(!ctl?.andarAteNoMapa?.({x:x*28/W,y:y*14/H})){
      console.info('[Mapa de jogo] destino bloqueado ou movimento indisponível');
     }
    }
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
  // O seletor original deve permanecer intacto para não quebrar o
  // Banco de Mapas nem os mapas da campanha. A lista das três vistas
  // é filtrada em atualizarPainel().
 }
 async function limparLaboratoriosRuins(){
  if(!ehMestre()||!dep.deleteDoc)throw Error('Exclusão indisponível para esta sessão.');
  const ids=[...MAPAS_DESCARTADOS_V224],existentes=(dep.mapas?.()||[]).filter(m=>
   ids.includes(String(m.id))||
   (TESTES_DESCARTAVEIS_V237.test(String(m.nome||'').trim())&&!mapaPilotoV237(m))
  );
  if(!existentes.length){win.alert('Nenhum laboratório descartado identificado para exclusão.');return;}
  const nomes=existentes.map(m=>m.nome||m.id).join('\\n');
  if(!win.confirm('Excluir PERMANENTEMENTE apenas estes laboratórios descartados do Firebase?\\n\\n'+nomes+'\\n\\nEcossistema (teste), Casa de teste (básico) e mapas da campanha NÃO serão excluídos.'))return;
  const atualId=String(win.novaSyncController_?.mapaAtual?.()||root.getElementById('novaSyncBoard')?.dataset.mapaVisivel||'');
  if(existentes.some(m=>String(m.id)===atualId)){
   const ref=pilotoV237(dep.mapas?.())[0];
   if(!ref)throw Error('O mapa piloto deve estar disponível antes da exclusão de um mapa ativo.');
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
  else win.alert('Testes descartados excluídos; mapa piloto, referências e campanha preservados.');
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
 // v239: a vila piloto aproveita o gerador modular existente, criando
 // quatro casas independentes, ruas cruzadas e uma praça pavimentada.
 // Nenhuma cena alternativa ou mapa adicional é criado.
 function vilaPiloto239(){
  const W=28,H=14,mat=id=>MATERIAIS.find(m=>m.id===id)||MATERIAIS[0];
  const objs=[
   oChao({x:0,y:0,w:W,h:H},mat('adobe'),W,H,'Solo da vila'),
   oChao({x:0,y:5.55,w:W,h:2.9},mat('pedra-polida'),W,H,'Rua principal'),
   oChao({x:12.2,y:0,w:3.6,h:H},mat('pedra-polida'),W,H,'Travessa central'),
   oChao({x:10.9,y:4.8,w:6.2,h:4.4},mat('pedra-rio'),W,H,'Praça do povoado')
  ];
  const locais=[
   {tipo:'casa_media',x:5.3,y:2.4,material:'madeira',giro:0},
   {tipo:'casa_pequena',x:22.4,y:2.7,material:'adobe',giro:0},
   {tipo:'casa_pequena',x:5.4,y:11.6,material:'tijolo',giro:2},
   {tipo:'casa_media',x:22.0,y:11.4,material:'madeira',giro:2}
  ];
  for(const c of locais)objs.push(...montarPeca(c.tipo,{x:c.x,y:c.y},{M:2,giro:c.giro,mat:c.material,W,H}));
  // Cenografia persistida no mesmo modelo de objetos do mapa. Os elementos
  // têm coordenadas próprias, não são um desenho fixo sobre a tela.
  const prop=(tipo,x,y,w,h,material='madeira')=>{
   const m=mat(material),base=oChao({x:x-w/2,y:y-h/2,w,h},m,W,H,tipo);
   return {...base,oficina3:tipo,parteV177:tipo,camada:3,nome:tipo.replaceAll('_',' '),
    bloqueiaMovimento:['arvore_vila','poco_vila','barril_vila','caixote_vila'].includes(tipo),
    bloqueiaVisao:false,pilotoDecoracaoV241:true};
  };
  [
   ['arvore_vila',10.0,2.1,1.6,1.6,'madeira'],
   ['arvore_vila',18.0,2.1,1.4,1.4,'madeira'],
   ['arvore_vila',10.0,11.8,1.55,1.55,'madeira'],
   ['arvore_vila',18.0,11.8,1.6,1.6,'madeira'],
   ['poco_vila',14.0,7.0,1.9,1.9,'pedra-polida'],
   ['poste_vila',10.95,5.35,.28,.28,'madeira'],
   ['poste_vila',17.15,8.7,.28,.28,'madeira'],
   ['barril_vila',8.85,3.5,.75,.75,'madeira'],
   ['barril_vila',25.3,3.65,.75,.75,'madeira'],
   ['caixote_vila',8.85,11.75,.9,.9,'madeira'],
   ['caixote_vila',25.4,11.7,1.0,1.0,'madeira']
  ].forEach(([tipo,x,y,w,h,material])=>objs.push(prop(tipo,x,y,w,h,material)));

  // A praça serve de ponto de orientação. As casas têm interiores e
  // portas produzidos pelo construtor original, não desenhos decorativos.
  return objs.map((o,i)=>({...o,pilotoV239:true,pilotoOrdemV239:i}));
 }
 async function prepararVilaPiloto239(){
  if(!ehMestre())throw Error('Somente o mestre pode editar o mapa piloto.');
  const ctl=win.novaSyncController_;
  const id=String(ctl?.mapaAtual?.()||'');
  const mapa=pilotoV237(dep.mapas?.())[0];
  if(!mapa||id!==String(mapa.id))throw Error('Abra o mapa piloto antes de montar a vila.');
  if(ctl?.emCombate?.())throw Error('Encerre o combate antes de reconstruir o cenário.');
  if(!dep.getDoc||!dep.setDoc||!dep.doc||!dep.db||!dep.runTransaction)throw Error('Firestore ainda não está pronto.');
  const objetos=vilaPiloto239();
  if(objetos.length<50||objetos.filter(o=>o.pilotoDecoracaoV241).length!==11)throw Error('O gerador não produziu a vila com a cenografia completa.');
  if(!win.confirm('Montar a vila piloto neste ÚNICO mapa?\\n\\nSerão construídas quatro casas, duas ruas, uma praça, quatro árvores, um poço, postes e objetos de rua. O antigo cenário da casa isolada será substituído, com uma cópia de segurança preservada no banco.\\n\\nOs mapas de campanha e as duas referências NÃO serão alterados.'))return false;
  const doc=dep.doc,db=dep.db,refMapa=doc(db,'mapas',id);
  const refEstado=doc(db,'combatesAtivos','mapaMesaSyncDireta');
  const refAtivo=doc(db,'combatesAtivos','mapaMesaSyncDiretaCena');
  const refArquivo=doc(db,'combatesAtivos','mapaMesaSyncCena_'+id);
  const refBackup=doc(db,'combatesAtivos','mapaMesaSyncCenaBackupV239_'+id);
  await dep.runTransaction(db,async tx=>{
   const [st,mp,at,ar,bk]=await Promise.all([
    tx.get(refEstado),tx.get(refMapa),tx.get(refAtivo),tx.get(refArquivo),tx.get(refBackup)
   ]);
   const estado=st.data()||{};
   if(String(estado.mapId||'')!==id)throw Error('O mapa ativo mudou. Nenhuma alteração foi salva.');
   if(estado.combat?.active)throw Error('O combate começou. Nenhuma alteração foi salva.');
   if(!mp.exists())throw Error('O mapa piloto não foi encontrado no banco.');
   const anterior=ar.exists()?ar.data():(at.data()?.mapId===id?at.data():mp.data()?.mesaScene||{mapId:id,objects:[]});
   if(!bk.exists())tx.set(refBackup,{mapId:id,copiaEm:new Date().toISOString(),scene:anterior});
   const nova={...anterior,mapId:id,objects:objetos,pilotoVersao:241};
   tx.set(refArquivo,nova);
   tx.set(refAtivo,nova);
   tx.update(refMapa,{mesaScene:nova,atualizadoEm:new Date().toISOString()});
  });
  try{await ctl.refreshView?.();}catch(e){console.warn('[Vila piloto] atualizar cena',e);}
  return true;
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
 let tentativasMapasV235=0,ultimaTentativaMapasV235=0,checandoMapasV235=false;
 for(const [id,ic,nome,dica] of defs){
  if(root.getElementById(id))continue;
  const b=root.createElement('button');b.type='button';b.className='tab-btn mtm-tab';b.dataset.mtm=id;b.textContent=ic+' '+nome;b.title=dica;
  b.hidden=!ehMestre();
  b.addEventListener('click',()=>abrir(id,b));
  tabs.insertBefore(b,ancora?.nextSibling||null);ancora=b;
  const sec=root.createElement('div');sec.id=id;sec.className='tab-content';sec.innerHTML=`<div class="form-section"><div class="mtm-faixa"><b>${ic} ${nome}</b><span class="mtm-dica">${dica}</span><div class="mtm-controles"><button type="button" data-limpar-demo>🗑️ Excluir laboratórios ruins</button><button type="button" data-mtm-gerar-vila title="Construir ou atualizar a vila no mesmo mapa piloto, com backup da versão original">🏘️ Atualizar vila</button><button type="button" data-mtm-preview hidden>🏠 Ver protótipo 2,5D</button><button type="button" data-editar-casa>🧱 Construir</button><button type="button" data-diretor>🧭 NPCs e criaturas</button><button type="button" data-voltar-mesa>Voltar à Mesa</button></div></div><div class="mtm-mini"><label data-mtm-escolha>Mapa <select data-mtm-mapa-select aria-label="Selecionar mapa para os três visualizadores"><option value="">Escolha um mapa…</option></select></label><span data-mtm-mapa>Mapa carregado: verificando…</span><span data-mtm-mapas-disponiveis style="color:#9fb3cc"></span><button type="button" data-mtm-recarregar-mapas hidden title="Recarregar mapas do Firebase" style="font:12px Segoe UI,Arial;color:#edf7ff;background:#21334d;border:1px solid #52647b;border-radius:6px;padding:3px 7px;cursor:pointer">↻ Recarregar mapas</button><label data-mtm-seletor style="display:none">Acompanhar <select data-mtm-ator><option value="">Selecione uma miniatura</option></select></label><span class="mtm-estado" data-mtm-estado></span></div><div class="mtm-host"></div></div>`;
  sec.querySelector('[data-mtm-recarregar-mapas]').addEventListener('click',async e=>{
   const btn=e.currentTarget;btn.disabled=true;
   try{
    if(typeof win.recarregarBancoMapas_!=='function')throw Error('Carregador de mapas ainda não iniciado.');
    await win.recarregarBancoMapas_();
    atualizarPainel();filtrarMapasDaArea();
   }catch(err){win.alert(String(err?.message||err));}
   finally{btn.disabled=false;}
  });
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
  const btnVila=sec.querySelector('[data-mtm-gerar-vila]');
  btnVila.hidden=id!=='mapa-construtor';
  btnVila.addEventListener('click',async()=>{
   btnVila.disabled=true;const anterior=btnVila.textContent;btnVila.textContent='Preparando vila…';
   try{
    const salvo=await prepararVilaPiloto239();
    if(salvo){win.alert('Vila salva! Quatro casas, ruas, praça, árvores, poço e objetos de rua no mesmo mapa. A cena anterior foi preservada em backup.');atualizarPainel();atualizarVisual25D();}
   }catch(e){console.error('[Vila piloto] montagem:',e);win.alert('Não foi possível montar a vila: '+(e?.message||e));}
   finally{btnVila.disabled=false;btnVila.textContent=anterior;}
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
  try{win.novaSyncController_?.pararAndar?.();}catch(_){}
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
  if(dest)dest.textContent=id?'Mapa compartilhado: '+nome+(mapaPilotoV237(mapa)?'':' · fora do cenário piloto'):'Nenhum mapa ativo. Escolha o mapa piloto acima.';
  const reload=sec?.querySelector('[data-mtm-recarregar-mapas]');
  if(reload)reload.hidden=pilotoV237(dep.mapas?.()).length>0;
  const selMapa=sec?.querySelector('[data-mtm-mapa-select]');
  if(selMapa){
   const lista=pilotoV237(dep.mapas?.());
   const signature=lista.map(m=>String(m.id)+'='+String(m.nome||m.id)).join('|')+'#'+id;
   const estado=win.mesaEstadoBancoMapasV235_;
   const aviso=sec?.querySelector('[data-mtm-mapas-disponiveis]');
   if(aviso){aviso.textContent=lista.length?'1 mapa de trabalho · outros preservados no Banco de Mapas':estado?.status==='erro'?'Leitura dos mapas falhou: '+String(estado.erro||'erro de rede'):estado?.status==='carregando'?'Carregando mapas…':'Mapa de trabalho indisponível. Recarregue ou confira o Banco de Mapas.';}
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
  if(st)st.textContent=atual==='mapa-construtor'?'Construção: câmera 3D livre · Construir abre o editor funcional':atual==='mapa-mestre'?'Direção: botão direito sobre uma miniatura para acompanhá-la':'Jogo: clique no chão para caminhar, ou use WASD/setas · colisões e permissões do motor original.';
 }
 root.querySelectorAll('[data-mtm-ator]').forEach(sel=>sel.addEventListener('change',e=>{
  pararMovimento();atorSelecionado=String(e.target.value||'');
  const orig=root.getElementById('novaSyncPersonagem');
  if(orig&&[...orig.options].some(o=>o.value===atorSelecionado)){orig.value=atorSelecionado;orig.dispatchEvent(new Event('change',{bubbles:true}));}
  if(atual==='mapa-jogo')controleDoSelecionado();
 }));
 // v234: input real no mapa de jogo, usando o movimento oficial do motor.
 // Não escrever posições diretamente nem ignorar colisões, turnos ou permissões.
 const teclasJogo=new Set(),dirs={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};
 const ignorarTecla=e=>e.altKey||e.ctrlKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')||e.target?.isContentEditable;
 function pararMovimento(){teclasJogo.clear();try{win.novaSyncController_?.pararAndar?.();}catch(err){console.warn('[Três mapas] parar:',err);}}
 function moverComTeclas(){
  if(atual!=='mapa-jogo'||!teclasJogo.size)return;
  const ctl=win.novaSyncController_,id=String(atorSelecionado||'');
  if(!ctl||!id||id.startsWith('__')){pararMovimento();return;}
  const tk=ctl.token?.(id);
  if(!tk||String(tk.mapaId||'')!==String(ctl.mapaAtual?.()||'')||!ctl.controla?.(tk)){pararMovimento();return;}
  const sel=root.getElementById('novaSyncPersonagem');
  if(sel&&sel.value!==id&&[...sel.options].some(o=>o.value===id)){
   sel.value=id;sel.dispatchEvent(new Event('change',{bubbles:true}));
  }
  let dx=0,dy=0;for(const k of teclasJogo){dx+=dirs[k][0];dy+=dirs[k][1];}
  if(dx||dy)ctl.andarDirecao?.(dx,dy);else ctl.pararAndar?.();
 }
 win.addEventListener('keydown',e=>{
  if(atual!=='mapa-jogo'||ignorarTecla(e)||!Object.hasOwn(dirs,e.code))return;
  // Sem controle de personagem, não consumir as teclas do navegador.
  const tk=win.novaSyncController_?.token?.(String(atorSelecionado||''));
  if(!tk||!win.novaSyncController_?.controla?.(tk))return;
  e.preventDefault();teclasJogo.add(e.code);moverComTeclas();
 });
 win.addEventListener('keyup',e=>{if(teclasJogo.delete(e.code)){if(teclasJogo.size)moverComTeclas();else pararMovimento();}});
 win.addEventListener('blur',pararMovimento);
 win.addEventListener('mesa-aba-tres-mapas',e=>{if(e.detail?.aba!=='mapa-jogo')pararMovimento();});
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
 const iv=setInterval(()=>{try{
  if(!ehMestre()&&atual){voltarMesa();}
  for(const b of root.querySelectorAll('.mtm-tab'))b.hidden=!ehMestre();
  if(atual){atualizarPainel();atualizarVisual25D();filtrarMapasDaArea();}
  else atualizarVisual25D();
  // Retry limitado enquanto o banco está vazio. Não criar nem salvar mapas.
  if(ehMestre()&&atual&&!(dep.mapas?.()||[]).length&&
      tentativasMapasV235<3&&!checandoMapasV235&&
      Date.now()-ultimaTentativaMapasV235>15000&&
      typeof win.recarregarBancoMapas_==='function'&&
      win.mesaEstadoBancoMapasV235_?.status!=='carregando'){
   checandoMapasV235=true;tentativasMapasV235++;ultimaTentativaMapasV235=Date.now();
   Promise.resolve(win.recarregarBancoMapas_({silencioso:true})).then(()=>{
    atualizarPainel();filtrarMapasDaArea();
   }).catch(e=>console.warn('[Três mapas] recarga de mapas:',e))
     .finally(()=>{checandoMapasV235=false;});
  }
 }catch(e){console.warn('[Três mapas] atualização:',e);}},1500);iv.unref?.();
 return {abrir,voltarMesa,aba:()=>atual};
}
