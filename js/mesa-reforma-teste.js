// Mesa Estelar v204 — 🛠️ Reformar mapa de teste (só o mestre).
// Publicar o gerador NÃO muda os mapas já salvos no banco. Esta ferramenta aplica a reforma (versão 2) NO MAPA ESCOLHIDO, com segurança:
//   1) Inventário: o que o mapa tem hoje (objetos por tipo, criaturas por espécie, NPCs, jogadores, versão da reforma).
//   2) Backup obrigatório antes de qualquer mudança (coleção backupsMapa, só o mestre lê/escreve) — separado do que está ativo.
//   3) Aplicar: reconstrói a CENA (terreno, casa, torre, cachoeira, gruta, calabouço, armadilhas) no mesmo mapa e acerta os HABITANTES:
//      quem já está lá mantém identidade, dono e ficha (só sai do meio de parede/água/tronco novo); só entra o que falta. Rodar de novo não duplica nada.
//   4) Restaurar: volta o mapa, os tokens e a saúde ao estado do backup.
//   5) Resetar o teste: reconstrói a cena (armadilhas, alavancas, portas) e recoloca SÓ as criaturas do laboratório; jogadores e NPCs ficam como estão.
// Nada disso roda sozinho no login de ninguém. Módulo à parte: se falhar, o mapa e o jogo seguem normais.
import {construirCena,povoarMapa,VERSAO_REFORMA,POPULACAO,passosEcossistema} from './mesa-ecossistema.js?v=204';

const MAPA='combatesAtivos/mapaMesaSyncDireta',POS=MAPA+'/posicoes',SAUDE='combatesAtivos/mapaMesaSyncSaude',BACKUPS='backupsMapa';
const TAM_PARTE=600000;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dec=s=>{try{return decodeURIComponent(String(s||''));}catch(_){return String(s||'');}};
const clean=v=>JSON.parse(JSON.stringify(v??null));

/** resumo puro do que há num mapa (para o inventário e para os testes) */
export function resumir({cena,tokens,mapa}){
 const objs=Array.isArray(cena?.objects)?cena.objects:[],porTipo={};
 for(const o of objs){const k=o.erTipo||o.tipo||o.oficina3||'objeto';porTipo[k]=(porTipo[k]||0)+1;}
 const especies={},npcs=[],jogadores=[];
 for(const t of tokens||[]){const id=dec(t.id);
  if(id.startsWith('synccriatura:')){const e=id.slice(13).split('~')[0];especies[e]=(especies[e]||0)+1;}
  else if(id.startsWith('syncnpc:'))npcs.push(t.nome||id);
  else jogadores.push(t.nome||id);}
 return {nome:mapa?.nome||'',larguraM:mapa?.larguraM,alturaM:mapa?.alturaM,reforma:mapa?.reformaTesteV2?.versao||0,objetos:objs.length,porTipo,criaturas:Object.values(especies).reduce((a,b)=>a+b,0),especies,npcs,jogadores,andares:[...new Set(objs.map(o=>Number(o.andarV144??1)))].sort()};
}
/** o que um mapa reformado deve ter, conferido contra a cena (usado pelo painel e pelos testes) */
export function conferirReforma(cena){
 const objs=Array.isArray(cena?.objects)?cena.objects:[],falta=[];
 const tem=(re,min=1)=>objs.filter(o=>re.test(String(o.nome||'')+' '+String(o.erTipo||'')+' '+String(o.modeloId||''))).length>=min;
 if(!tem(/telhado/i))falta.push('casa (telhado)');
 if(!tem(/cachoeira/i))falta.push('cachoeira');
 if(!tem(/ponte/i))falta.push('ponte');
 if(!tem(/escada/i))falta.push('escada da torre');
 if(!tem(/armadilha/i,3))falta.push('armadilhas');
 if(!tem(/alavanca/i))falta.push('alavancas');
 if(!tem(/copa/i,10))falta.push('árvores');
 if(!tem(/cordilheira|macico|rampa/i))falta.push('relevo');
 return {ok:!falta.length,falta};
}

export function instalarReformaTeste(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const E=()=>win.mesaEditorRapidoV197;
 const D=p=>dep.doc(dep.db,...p.split('/'));
 const col=p=>dep.collection(dep.db,...p.split('/'));
 let log=[];const diz=m=>{log.push(m);console.info('[Reforma]',m);try{const el=root.getElementById('rfLog');if(el){el.textContent=log.slice(-14).join('\n');el.scrollTop=1e9;}}catch(_){}};

 const candidatos=()=>(dep.mapas?.()||[]).filter(m=>/ecossistema/i.test(String(m.nome||m.id||''))).map(m=>({id:String(m.id),nome:String(m.nome||m.id),versao:m.reformaTesteV2?.versao||0,w:m.larguraM,h:m.alturaM}));
 const idCena=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);

 async function lerMapa(id){
  const cab=await dep.getDoc(D('mapas/'+id));if(!cab.exists())throw Error('O mapa "'+id+'" não existe.');
  const mapa={id,...cab.data()},partes={};
  if(mapa.formato==='partes-v1'&&Number(mapa.partes||0))for(let i=1;i<=Number(mapa.partes);i++){const pid=id+'__parte__'+String(i).padStart(4,'0'),s=await dep.getDoc(D('mapas/'+pid));if(s.exists())partes[pid]=s.data();}
  let cena=null,viva=null;
  try{const s=await dep.getDoc(D(idCena(id)));if(s.exists())cena=s.data();}catch(_){}
  try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'));if(s.exists()&&String(s.data()?.mapId||'')===id)viva=s.data();}catch(_){}
  const embutida=mapa.mesaScene&&Array.isArray(mapa.mesaScene.objects)?mapa.mesaScene:null;
  return {mapa,partes,cena,viva,embutida};
 }
 async function lerTokens(id){
  const snap=await dep.getDocs(col(POS));const out=[];snap.forEach(d=>{const t={id:d.id,...d.data()};if(String(t.mapaId||'')===String(id))out.push(t);});return out;
 }
 async function lerSaude(){const s=await dep.getDoc(D(SAUDE));return s.exists()?s.data():{actors:{},revision:0};}

 async function inventario(id){
  const m=await lerMapa(id),tokens=await lerTokens(id);
  return {...resumir({cena:m.viva||m.cena,tokens,mapa:m.mapa}),conferencia:conferirReforma(m.viva||m.cena),mapId:id,temCena:!!(m.viva||m.cena),partes:Object.keys(m.partes).length};
 }
 /** backup recuperável: grava tudo (cabeçalho, partes, cenas, tokens e saúde deles) em backupsMapa/<id> + partes de texto */
 async function backup(id,motivo='antes da reforma v'+VERSAO_REFORMA){
  diz('💾 Fazendo backup de "'+id+'"…');
  const m=await lerMapa(id),tokens=await lerTokens(id),saude=await lerSaude(),ids=new Set(tokens.map(t=>t.id));
  // v205: o backup guarda TODAS as fontes da cena: arquivada, viva, embutida no mapa e o que o Editor está mostrando agora (rascunho). Sem nenhuma, a reforma NÃO começa.
  let doEditor=[];try{doEditor=JSON.parse(JSON.stringify(win.mesaRascunhoMapaV193?.objetosAtuais?.()||[]));}catch(_){}
  const nCena=Math.max(m.cena?.objects?.length||0,m.viva?.objects?.length||0,m.embutida?.objects?.length||0,doEditor.length);
  const pacote={versao:2,mapId:id,mapa:m.mapa,partesMapa:m.partes,cena:m.cena,cenaViva:m.viva,cenaEditor:doEditor.length?{mapId:id,objects:doEditor}:null,nCena,tokens,saude:Object.fromEntries(Object.entries(saude.actors||{}).filter(([k])=>ids.has(k)||ids.has(encodeURIComponent(k))||ids.has(dec(k))))};
  const txt=JSON.stringify(pacote),bid=new Date().toISOString().replace(/[:.]/g,'-')+'_'+id.replace(/[^\w-]/g,'_').slice(0,40);
  const n=Math.ceil(txt.length/TAM_PARTE);
  await dep.setDoc(D(BACKUPS+'/'+bid),{mapaId:id,nome:String(m.mapa?.nome||id),criadoEm:new Date().toISOString(),por:String(dep.uid?.()||''),motivo,partes:n,bytes:txt.length,resumo:resumir({cena:m.viva||m.cena,tokens,mapa:m.mapa})});
  for(let i=0;i<n;i++)await dep.setDoc(D(BACKUPS+'/'+bid+'/partes/p'+String(i+1).padStart(4,'0')),{i:i+1,texto:txt.slice(i*TAM_PARTE,(i+1)*TAM_PARTE)});
  diz('✔ Backup "'+bid+'" ('+Math.round(txt.length/1024)+' KB em '+n+' parte(s); cena com '+nCena+' peça(s)).');
  if(nCena===0&&!(m.cena||m.viva||m.embutida))throw Error('O backup ficou SEM a cena do mapa (não achei as peças salvas nem no editor). Por segurança a reforma NÃO começou e nada foi apagado. Abra o mapa em 🗺️ Mapas como mestre, espere carregar, e tente de novo.');
  return bid;
 }
 async function backups(){const snap=await dep.getDocs(col(BACKUPS));const l=[];snap.forEach(d=>l.push({id:d.id,...d.data()}));return l.sort((a,b)=>String(b.criadoEm).localeCompare(String(a.criadoEm)));}
 async function lerBackup(bid){
  const cab=await dep.getDoc(D(BACKUPS+'/'+bid));if(!cab.exists())throw Error('Backup não encontrado.');
  let txt='';for(let i=1;i<=Number(cab.data().partes||0);i++){const s=await dep.getDoc(D(BACKUPS+'/'+bid+'/partes/p'+String(i).padStart(4,'0')));if(!s.exists())throw Error('O backup está incompleto (parte '+i+').');txt+=s.data().texto;}
  return JSON.parse(txt);
 }
 /** volta ao estado do backup: mapa, cenas, tokens (apaga os que surgiram depois neste mapa) e saúde deles */
 async function restaurar(bid){
  const b=await lerBackup(bid),id=b.mapId;diz('♻️ Restaurando "'+id+'" do backup…');
  await dep.setDoc(D('mapas/'+id),b.mapa);for(const [pid,d] of Object.entries(b.partesMapa||{}))await dep.setDoc(D('mapas/'+pid),d);
  if(b.cena)await dep.setDoc(D(idCena(id)),b.cena);
  if(b.cenaViva)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'),b.cenaViva);
  if(!b.cena&&!b.cenaViva&&b.cenaEditor){await dep.setDoc(D(idCena(id)),b.cenaEditor);diz('ℹ️ Cena restaurada a partir do que o Editor mostrava no backup.');}
  const atuais=await lerTokens(id),salvos=new Set((b.tokens||[]).map(t=>t.id));
  for(const t of atuais)if(!salvos.has(t.id))await dep.deleteDoc(D(POS+'/'+t.id));
  for(const t of b.tokens||[]){const {id:tid,...d}=t;await dep.setDoc(D(POS+'/'+tid),d);}
  await dep.runTransaction(dep.db,async tx=>{const r=D(SAUDE),s=await tx.get(r),c=s.exists()?s.data():{actors:{},revision:0},actors={...(c.actors||{})};
   for(const t of atuais)if(!salvos.has(t.id))delete actors[t.id];Object.assign(actors,b.saude||{});tx.set(r,clean({...c,actors,revision:Number(c.revision||0)+1}));});
  diz('✔ Restaurado. Recarregue a página para ver o mapa de volta.');return {mapId:id,tokens:(b.tokens||[]).length};
 }
 async function abrirParaEditar(id){
  const e=E();if(!e?.construir)throw Error('O Editor rápido ainda não carregou.');
  if(!e.pronto(id)){await ctl()?.openMap?.(id);for(let i=0;i<100&&!e.pronto(id);i++)await new Promise(r=>setTimeout(r,100));}
  if(!e.pronto(id))throw Error('Não consegui abrir o mapa "'+id+'" para edição (abra-o em Mapas como mestre e tente de novo).');
  return e;
 }
 /** reconstrói a cena no mapa aberto (apaga o que havia e desenha de novo) */
 let relatorio=null;
 const pausa=ms=>new Promise(r=>setTimeout(r,ms));
 /** espera o que o editor mostra parar de mudar (os registros chegam do banco aos poucos) */
 async function estabilizar(e,{min=1000,max=8000}={}){let ult=-1,desde=Date.now();const t0=Date.now();while(Date.now()-t0<max){const n=e.objetos().length;if(n!==ult){ult=n;desde=Date.now();}else if(Date.now()-desde>=min)return n;await pausa(150);}return ult;}
 /** confere que o BANCO guardou a cena nova inteira (e não só o que o editor mostra) */
 async function bancoTem(id,n,max=12000){const t0=Date.now();let ult=-1;while(Date.now()-t0<max){const m=await lerMapa(id).catch(()=>null),c=Math.max(m?.viva?.objects?.length??-1,m?.cena?.objects?.length??-1,m?.embutida?.objects?.length??-1);ult=c;if(c===n)return true;await pausa(300);}diz('⚠️ o banco guardou '+ult+' peças em vez de '+n);return false;}
 /** v205: confere o BANCO pelos IDs das peças que o editor tem (a cópia canônica = a cena viva, senão a arquivada), não por contagem: o editor mescla poças e a contagem esperada variava (381/400, 421/422). Falta ou sobra de ID = não gravou direito. */
 async function bancoTemIds(id,ids,max=15000){
  const t0=Date.now(),alvo=new Set(ids);let faltam=[],sobram=[],n=0;
  // o banco guarda a cena em até 3 lugares (viva, arquivada, embutida no mapa): basta UMA delas ter exatamente as peças do editor (antes só olhava viva/arquivada e no banco real dava "0 peças")
  let melhor=null;
  while(Date.now()-t0<max){const m=await lerMapa(id).catch(()=>null),reps=[['viva',m?.viva],['arquivada',m?.cena],['embutida',m?.embutida]].map(([nome,c])=>({nome,objs:c?.objects||[]}));
   for(const r of reps){const ds=new Set(r.objs.map(o=>o.id)),f2=ids.filter(i=>!ds.has(i)),so=[...ds].filter(i=>!alvo.has(i));r.faltam=f2;r.sobram=so;r.ok=!f2.length&&!so.length&&r.objs.length===ds.size;if(!melhor||r.faltam.length+r.sobram.length<melhor.faltam.length+melhor.sobram.length)melhor=r;if(r.ok)return true;}
   await pausa(300);}
  faltam=melhor?.faltam||ids;sobram=melhor?.sobram||[];n=melhor?.objs.length||0;
  diz('⚠️ nenhuma cópia do banco bate com o editor ('+ids.length+' peças). Melhor cópia ('+(melhor?.nome||'nenhuma')+'): '+n+' peças; faltam '+faltam.length+(faltam.length?' (ex.: '+faltam.slice(0,3).join(', ')+')':'')+' e sobram '+sobram.length+'.');return false;
 }
 /** o editor só grava (salvar) quando o seletor de personagem está em "Mestre"; com um personagem (ex.: Kael) selecionado o botão Salvar não faz NADA e as alterações ficam no rascunho ("N alterações ainda não salvas"). Foi a causa de "o banco tem 0 peças" no mapa real. */
 function garantirModoMestre(){const sel=root.getElementById('novaSyncPersonagem');if(!sel||sel.value==='__mestre__')return true;
  if(![...sel.options].some(o=>o.value==='__mestre__'))return false;sel.value='__mestre__';sel.dispatchEvent(new win.Event('change',{bubbles:true}));return sel.value==='__mestre__';}
 /** v205: salva pelo editor e devolve o RESULTADO estruturado. 'bloqueado-papel' (seletor fora de Mestre) → põe em Mestre e tenta UMA vez; 'falhou' → mostra o erro original (código e mensagem) no painel e PARA (sem tentativas empilhadas e sem gravação parcial em 3 documentos fora de transação). */
 async function salvarDeVerdade(R,e,id){
  let r=await R.salvar?.();
  if(r?.estado==='bloqueado-papel'){diz('ℹ️ O editor estava bloqueado (seletor fora de "Mestre"); coloquei em "Mestre" e vou tentar uma vez.');garantirModoMestre();await pausa(500);r=await R.salvar?.();}
  if(r?.estado==='ocupado'){diz('⏳ Outra gravação em andamento; esperando…');for(let k=0;k<20&&r?.estado==='ocupado';k++){await pausa(500);r=await R.salvar?.();}}
  relatorio={operacao:r?.id||'',estado:r?.estado||'(sem retorno: versão antiga do editor)',mapa:id,edicoes:r?.edicoes??null,pendentesDepois:Number(R.pendentes||0),erro:r?.erro||null,caminhos:r?.caminhos||[],kbPecas:Math.round(JSON.stringify(e.objetos()).length/1024),quando:new Date().toISOString()};
  if(r?.estado==='falhou')diz('❌ O Firebase/editor recusou a gravação: '+(r.erro.code?r.erro.code+' — ':'')+r.erro.message);
  else if(r?.estado!=='confirmado'&&r?.estado!=='sem-mudancas')diz('⚠️ Gravação não confirmada: estado "'+(r?.estado||'sem retorno')+'".');
  diz('📋 Relatório da gravação: '+JSON.stringify(relatorio));
  return r?.estado==='confirmado'||r?.estado==='sem-mudancas';
 }
 async function reconstruirCena(id){garantirModoMestre();
  let e=await abrirParaEditar(id),R=win.mesaRascunhoMapaV193;if(!R?.ativo?.())throw Error('O editor não está ativo neste mapa.');
  const limpaRascunho=async()=>{const n=Number(R.pendentes||0);if(n>0){diz('🧹 descartando '+n+' alteração(ões) não salvas do rascunho (ficam do banco, que não foi alterado)');try{R.descartar?.();}catch(_){}await pausa(400);}};
  for(let tentativa=1;tentativa<=3;tentativa++){
   await limpaRascunho(); // tentativa anterior que não gravou deixa edições empilhadas (450 → 1300 → 2150) e o mapa na tela fica quebrado (cachoeira some, objetos estranhos)
   await estabilizar(e);
   const doBanco=await lerMapa(id).then(m=>(m.viva||m.cena)?.objects||[]).catch(()=>[]),vistos=new Set(),velhos=[...R.objetosAtuais(),...doBanco].filter(o=>o&&o.id&&!vistos.has(o.id)&&vistos.add(o.id)); // o que o editor mostra + o que está salvo
   R.empurrar(velhos.map(o=>({kind:'remove',id:o.id})));diz('🏗️ Reconstruindo a cena ('+velhos.length+' peças antigas saem)'+(tentativa>1?' · tentativa '+tentativa:'')+'…');
   // v205: espera as peças antigas SAÍREM do editor antes de desenhar as novas (senão o gerador corta/apaga peças novas que tocam as velhas — pedras na lagoa, poças de lava — e a 2ª aplicação saía com menos peças)
   {const idsVelhos=new Set(velhos.map(o=>o.id));let resta=-1;for(let k=0;k<60;k++){resta=e.objetos().filter(o=>idsVelhos.has(o.id)).length;if(!resta)break;await pausa(150);}diz(resta?'⚠️ '+resta+' peça(s) antiga(s) ainda no editor':'🧹 peças antigas removidas do editor');}
   const res=await construirCena(e,{dizer:diz});
   try{diz('💾 Salvando o mapa…');const kb=Math.round(JSON.stringify(e.objetos()).length/1024);const gravou=await salvarDeVerdade(R,e,id);if(!gravou){await limpaRascunho();diz('↩️ Parei: o mapa voltou ao que está salvo no banco (nada foi perdido). Mande o relatório acima ao GPT.');throw Error('A gravação foi recusada ou não confirmada ('+(relatorio?.erro?(relatorio.erro.code||relatorio.erro.message):relatorio?.estado)+'). Backup seguro; mapa intacto.');}await pausa(300);
    // o editor grava a cena em 3 documentos numa só transação; se ela falhar (tamanho, permissão, mapa mudou) o motivo só aparece no aviso do editor: mostra aqui
    const av=String(root.getElementById('novaEditNotice')?.textContent||'').trim();diz('📝 Aviso do editor depois de salvar ('+kb+' KB de peças): '+(av||'(vazio)'));}catch(err){if(/^A gravação foi recusada/.test(String(err?.message)))throw err;diz('⚠️ salvar: '+(err?.message||err));}
   {await estabilizar(e);const ids=e.objetos().map(o=>o.id);if(ids.length!==res.esperado)diz('ℹ️ o editor mesclou peças: '+ids.length+' em vez de '+res.esperado+' (esperado pelo gerador)');if(await bancoTemIds(id,ids)){return {e,res};}}
   e=await abrirParaEditar(id);R=win.mesaRascunhoMapaV193;
  }
  await limpaRascunho();diz('↩️ Voltei o mapa ao que está salvo no banco (nada foi perdido).');
  throw Error('O banco não guardou a cena inteira depois de 3 tentativas. O backup está seguro; tente de novo.');
 }
 async function marcar(id,bid){await dep.setDoc(D('mapas/'+id),{reformaTesteV2:{versao:VERSAO_REFORMA,quando:new Date().toISOString(),backup:bid||'',por:String(dep.uid?.()||'')}},{merge:true});}
 /** aplica a reforma v2 no mapa escolhido (faz backup antes; idempotente) */
 async function aplicar(id){
  const antes=await inventario(id),bid=await backup(id);
  const {e,res}=await reconstruirCena(id);
  const existentes=await lerTokens(id),r=await povoarMapa({win,dep:{...dep,doc:dep.doc,criaturas:dep.criaturas,npcs:dep.npcs,uid:dep.uid},mapaId:id,objetos:e.objetos(),existentes,dizer:diz});
  await marcar(id,bid);
  const depois=await inventario(id);
  diz('✔ Reforma v'+VERSAO_REFORMA+' aplicada: '+depois.objetos+' peças, '+depois.criaturas+' criaturas; '+r.colocados.length+' criaturas novas, '+r.movidos.length+' tokens tirados do meio de paredes/água.');
  return {backup:bid,antes,depois,colocados:r.colocados.length,movidos:r.movidos,faltou:r.faltou,falhas:res?.falhas||0};
 }
 /** resetar o laboratório: reconstrói a cena e recoloca as criaturas do teste; jogadores e NPCs ficam como estão */
 async function resetar(id){
  const {e}=await reconstruirCena(id),tokens=await lerTokens(id),monstros=tokens.filter(t=>dec(t.id).startsWith('synccriatura:'));
  for(const t of monstros)await dep.deleteDoc(D(POS+'/'+t.id));
  await dep.runTransaction(dep.db,async tx=>{const r=D(SAUDE),s=await tx.get(r),c=s.exists()?s.data():{actors:{},revision:0},actors={...(c.actors||{})};for(const t of monstros)delete actors[t.id];tx.set(r,clean({...c,actors,revision:Number(c.revision||0)+1}));});
  const resto=tokens.filter(t=>!dec(t.id).startsWith('synccriatura:')),r=await povoarMapa({win,dep,mapaId:id,objetos:e.objetos(),existentes:resto,dizer:diz});
  diz('✔ Teste resetado: '+monstros.length+' criaturas recolocadas ('+r.colocados.length+' novas), armadilhas, portas e alavancas restauradas. Jogadores e NPCs ficaram como estavam.');
  return {recolocadas:r.colocados.length,mantidos:resto.length};
 }

 // ---------------------------------------------------------------- painel
 const CSS=`#rfPainel{position:fixed;inset:0;z-index:10020;background:rgba(0,0,0,.6);display:grid;place-items:center}
#rfPainel>div{background:#0f1a2e;color:#e8eefb;border:1px solid #3e5a8f;border-radius:14px;padding:14px;width:min(720px,96vw);max-height:92vh;overflow:auto;font:13px 'Segoe UI',system-ui,sans-serif}
#rfPainel h3{margin:0 0 6px;font-size:16px}#rfPainel p,#rfPainel li{color:#b7c6dd;font-size:12px;line-height:1.45}
#rfPainel select,#rfPainel button{padding:7px 10px;border-radius:8px;border:1px solid #3e5a8f;background:#16253f;color:#fff;font:600 12px 'Segoe UI',system-ui,sans-serif;cursor:pointer}
#rfPainel button.pri{background:#2d6cdf;border-color:#2d6cdf}#rfPainel button.pg{background:#7a2f2a;border-color:#b5483f}#rfPainel button:disabled{opacity:.5;cursor:wait}
#rfPainel .rf-lin{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;align-items:center}#rfPainel pre{margin:8px 0 0;padding:8px;border-radius:8px;background:#0a1222;color:#cfe0f5;max-height:230px;overflow:auto;white-space:pre-wrap;font:11px/1.4 ui-monospace,Consolas,monospace}
#rfPainel .rf-tab{width:100%;border-collapse:collapse;margin-top:6px}#rfPainel .rf-tab td{padding:2px 6px;border-bottom:1px solid #1e3050;font-size:12px}`;
 function abrirPainel(){
  if(!root.getElementById('rfCss')){const st=root.createElement('style');st.id='rfCss';st.textContent=CSS;root.head.append(st);}
  root.getElementById('rfPainel')?.remove();log=[];
  const d=root.createElement('div');d.id='rfPainel';d.setAttribute('role','dialog');d.setAttribute('aria-label','Reformar mapa de teste');
  const cs=candidatos();
  d.innerHTML=`<div><h3>🛠️ Reformar mapa de teste <button type="button" data-x style="float:right">✕</button></h3>
   <p>Aplica a reforma v${VERSAO_REFORMA} (casa, torre, cachoeira animada, gruta e caverna cobertas, subsolo escuro, lava, escala física, habitats) <b>no mapa que você escolher</b>, com backup antes. Quem já está no mapa mantém identidade, dono e ficha. <b>⚠️ Aplique UMA vez e espere terminar:</b> aplicar de novo no mesmo mapa ainda pode deixar peças repetidas ou a contagem diferente (problema conhecido; o backup fica guardado e dá para restaurar).</p>
   <div class="rf-lin"><label>Mapa: <select data-mapa>${cs.length?cs.map(m=>`<option value="${esc(m.id)}">${esc(m.nome)} · ${esc(m.id)}${m.versao?' · reforma v'+m.versao:' · antigo'}</option>`).join(''):'<option value="">(nenhum mapa "Ecossistema" encontrado)</option>'}</select></label></div>
   <div class="rf-lin"><button type="button" data-inv>📋 Inventário</button><button type="button" data-bak>💾 Só backup</button><button type="button" class="pri" data-apl>🏗️ Aplicar reforma (com backup)</button><button type="button" data-rst>🔄 Resetar o teste</button></div>
   <div class="rf-lin"><label>Backup: <select data-bk><option value="">— carregando —</option></select></label><button type="button" class="pg" data-res>♻️ Restaurar este backup</button></div>
   <div data-inv-out></div><pre id="rfLog">Escolha o mapa e clique em Inventário.</pre></div>`;
  root.body.append(d);
  const q=x=>d.querySelector(x),mapa=()=>q('[data-mapa]').value,trava=async(fn)=>{for(const b of d.querySelectorAll('button'))b.disabled=true;try{await fn();}catch(err){diz('⚠️ '+(err?.message||err));console.warn('[Reforma]',err);}finally{for(const b of d.querySelectorAll('button'))b.disabled=false;}};
  d.addEventListener('pointerdown',e=>e.stopPropagation());q('[data-x]').onclick=()=>d.remove();
  const listarBk=async()=>{try{const l=await backups();q('[data-bk]').innerHTML=l.length?l.map(b=>`<option value="${esc(b.id)}">${esc(b.criadoEm?.slice(0,19)||'')} · ${esc(b.mapaId)} · ${esc(b.motivo||'')}</option>`).join(''):'<option value="">(nenhum backup)</option>';}catch(e){q('[data-bk]').innerHTML='<option value="">(sem acesso aos backups)</option>';}};listarBk();
  const mostra=i=>{q('[data-inv-out]').innerHTML=`<table class="rf-tab"><tr><td>Mapa</td><td><b>${esc(i.nome)}</b> · ${esc(i.mapId)} · ${i.larguraM||'?'}×${i.alturaM||'?'} m · reforma: ${i.reforma?'v'+i.reforma:'antigo'}</td></tr><tr><td>Peças</td><td>${i.objetos} (${Object.entries(i.porTipo).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>k+' '+v).join(', ')}) · andares ${esc((i.andares||[]).join(', '))}</td></tr><tr><td>Criaturas</td><td>${i.criaturas} · ${Object.entries(i.especies).map(([k,v])=>k+' ×'+v).join(', ')||'—'}</td></tr><tr><td>NPCs / jogadores</td><td>${esc((i.npcs||[]).join(', ')||'—')} / ${esc((i.jogadores||[]).join(', ')||'—')}</td></tr><tr><td>Conferência v${VERSAO_REFORMA}</td><td>${i.conferencia.ok?'✔ completo':'faltam: '+esc(i.conferencia.falta.join(', '))}</td></tr></table>`;};
  q('[data-inv]').onclick=()=>trava(async()=>{if(!mapa())throw Error('Escolha um mapa.');const i=await inventario(mapa());mostra(i);diz('Inventário lido.');});
  q('[data-bak]').onclick=()=>trava(async()=>{if(!mapa())throw Error('Escolha um mapa.');await backup(mapa(),'backup manual');await listarBk();});
  q('[data-apl]').onclick=()=>trava(async()=>{if(!mapa())throw Error('Escolha um mapa.');if(!win.confirm('Reformar o mapa "'+mapa()+'"?\n\nEle será reconstruído (o que você desenhou à mão nele sai, mas fica no backup). Criaturas, NPCs e jogadores continuam.'))return;const r=await aplicar(mapa());mostra(r.depois);await listarBk();});
  q('[data-rst]').onclick=()=>trava(async()=>{if(!mapa())throw Error('Escolha um mapa.');if(!win.confirm('Resetar o laboratório em "'+mapa()+'"? Criaturas, armadilhas, portas e alavancas voltam ao início. Jogadores e NPCs não mudam.'))return;await resetar(mapa());});
  q('[data-res]').onclick=()=>trava(async()=>{const b=q('[data-bk]').value;if(!b)throw Error('Escolha um backup.');if(!win.confirm('Restaurar o backup "'+b+'"? O mapa e os tokens voltam ao estado dele.'))return;await restaurar(b);});
 }
 const api={abrirPainel,candidatos,inventario,backup,backups,restaurar,aplicar,resetar,conferirReforma,resumir,_reconstruirCena:reconstruirCena};
 win.mesaReformaTeste=api;return api;
}
