// Mesa Estelar v205 — 🧪 Testar o mapa com um personagem (para o MESTRE experimentar sozinho o mapa de teste).
// Coloca um personagem de teste (pessoa ou insetoide guerreiro) no mapa que está aberto, com equipamento de luz opcional, e leva-o a cada região (acampamento, casa, cachoeira,
// lagoa, torre, alçapão do subsolo, rampa, lava) sem andar longe. Nada além do token de teste é criado; "Remover" apaga só ele. Módulo à parte: se falhar, o jogo segue igual.
const ID='teste_personagem_v205';
export const PERSONAGENS={
 pessoa:{nome:'Pessoa',arte:'cima_pessoa',diametroM:1,visual:''},
 insetoide:{nome:'Insetoide guerreiro (bípede, 4 braços)',arte:'cima_insetoide_predador',diametroM:.7,visual:''}
};
export const DESTINOS=[
 ['🏕️ Acampamento',46,26],['🏠 Porta da casa',36.2,25.5],['🌊 Ponte e cachoeira',14.5,19.4],['💧 Margem da lagoa',6,23.4],['🗼 Porta da torre',41.5,13.4],
 ['🕳️ Alçapão (desce ao subsolo)',46.2,29.1],['⛰️ Boca da caverna (rampa)',54.4,34],['🌋 Contorno da lava',55,46.5]
];
export const KAEL_ID='teste_jogador_v138';
/** ponto livre mais perto de (x,y) em metros, fora de objetos que bloqueiam o passo (margem 0,7 m) e dentro do mapa */
export function pontoLivre(x,y,objs,W,H){const bloqueia=o=>o&&!o.destruido&&o.bloqueiaMovimento&&Number(o.camada)===3;const caixas=(objs||[]).filter(bloqueia).map(o=>({cx:Number(o.x)*W/28,cy:Number(o.y)*H/14,w:Number(o.larguraM)||1,h:Number(o.alturaM)||1}));
 const livre=(px,py)=>px>1&&py>1&&px<W-1&&py<H-1&&!caixas.some(c=>Math.abs(px-c.cx)<c.w/2+.7&&Math.abs(py-c.cy)<c.h/2+.7);
 for(let r=0;r<=14;r+=.5){const n=r?Math.ceil(r*8):1;for(let k=0;k<n;k++){const a=k/n*6.2832,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(livre(px,py))return {x:+px.toFixed(2),y:+py.toFixed(2)};}}return {x:W/2,y:H/2};}
export const letrasDeEquipamento=o=>[o.lanterna&&'L',o.tocha&&'T',o.espada&&'N',o.mochila&&'M',o.capa&&'A'].filter(Boolean).join('');
export function instalarTestePersonagem(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const D=p=>dep.doc(dep.db,...p.split('/'));
 const POS='combatesAtivos/mapaMesaSyncDireta/posicoes/'+ID,ANDARES='combatesAtivos/mesaAndares';
 const mapaAtual=()=>String(ctl()?.mapaAtual?.()||'');
 let aviso=null;const dizer=t=>{try{const el=root.getElementById('tpTesteLog');if(el)el.textContent=t;}catch(_){}console.info('[Teste do mapa]',t);};
 const norm=(x,y,dims)=>{const d=dims||ctl()?.dimsAtual?.()||{W:28,H:14};return {x:+(x/d.W*28).toFixed(3),y:+(y/d.H*14).toFixed(3)};};
 async function colocar({quem='pessoa',lanterna=false,tocha=false,espada=false,mochila=false,capa=false,destino=0,posicaoM=null}={}){
  const mapa=mapaAtual();if(!mapa)throw Error('Abra o mapa de teste antes (🗺️ Mapas).');
  const p=PERSONAGENS[quem]||PERSONAGENS.pessoa,z=letrasDeEquipamento({lanterna,tocha,espada,mochila,capa}),d=posicaoM?['posição escolhida',posicaoM[0],posicaoM[1]]:(DESTINOS[destino]||DESTINOS[0]),n=norm(d[1],d[2]);
  let rev=0;try{const s=await dep.getDoc(D(POS));rev=s.exists()?Number(s.data().revision||0):0;}catch(_){}
  await dep.setDoc(D(POS),{nome:'🧪 Testador ('+p.nome.split(' (')[0]+')',imagem:'',donoUid:String(dep.uid?.()||''),x:n.x,y:n.y,revision:rev+1,facing:0,camada:3,mapaId:mapa,diametroM:p.diametroM,arte3dV200:p.arte,visualV203:z?'z='+z:''});
  await voltarAoTerreo();dizer('Personagem de teste colocado em '+d[0]+'. Selecione-o no seletor de personagem (ou use 🎭) e ande com WASD/mouse.');
  try{const sel=root.getElementById('novaSyncPersonagem');if(sel){sel.value=ID;sel.dispatchEvent(new win.Event('change',{bubbles:true}));}}catch(_){}
 }
 async function voltarAoTerreo(){try{await dep.setDoc(D(ANDARES),{tokens:{[ID]:{mapa:mapaAtual(),andar:1,em:Date.now()}}},{merge:true});}catch(_){}}
 async function ir(i){
  const d=DESTINOS[i];if(!d)return;const mapa=mapaAtual();let rev=0,existe=false;
  try{const s=await dep.getDoc(D(POS));existe=s.exists();rev=existe?Number(s.data().revision||0):0;}catch(_){}
  if(!existe)throw Error('Coloque o personagem de teste primeiro.');
  const n=norm(d[1],d[2]);await dep.setDoc(D(POS),{x:n.x,y:n.y,revision:rev+1,mapaId:mapa},{merge:true});await voltarAoTerreo();dizer('Personagem de teste levado a: '+d[0]);
 }
 async function equipar(o){
  let rev=0;try{const s=await dep.getDoc(D(POS));if(!s.exists())throw Error('x');rev=Number(s.data().revision||0);}catch(_){throw Error('Coloque o personagem de teste primeiro.');}
  const z=letrasDeEquipamento(o);await dep.setDoc(D(POS),{visualV203:z?'z='+z:'',revision:rev+1},{merge:true});dizer('Equipamento: '+(z||'nenhum')+' (L lanterna · T tocha · N espada de energia · M mochila · A capa)');
 }
 /** lista os personagens que existem em QUALQUER mapa (posicoes) para o mestre trazer o Kael etc. para o mapa aberto */
 async function listarPersonagens(){const r=await dep.getDocs(dep.collection(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes'));const l=[];r.forEach(d=>{const v=d.data();if(d.id!==ID&&v&&v.nome&&!/^sync(criatura|npc):/.test(d.id))l.push({id:d.id,nome:String(v.nome),mapa:String(v.mapaId||'')});});return l.sort((a,b)=>a.nome.localeCompare(b.nome));}
 async function trazer(id,destino=0){
  const mapa=mapaAtual();if(!mapa)throw Error('Abra o mapa de teste antes (🗺️ Mapas).');
  const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta/posicoes/'+id));if(!s.exists())throw Error('Personagem não encontrado.');
  const v=s.data(),d=DESTINOS[destino]||DESTINOS[0],n=norm(d[1],d[2]);
  await dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta/posicoes/'+id),{x:n.x,y:n.y,mapaId:mapa,camada:3,revision:Number(v.revision||0)+1,aliasMapaAnterior:String(v.mapaId||'')},{merge:true});
  try{await dep.setDoc(D(ANDARES),{tokens:{[id]:{mapa,andar:1,em:Date.now()}}},{merge:true});}catch(_){}
  let lig='';try{const L=win.mesaLigacoesMod||win.mesaLigacoes;if(v.mapaId&&L?.ligar&&await L.ligar(v.mapaId,mapa))lig=' Criei uma saída 🚪➜ entre os dois mapas: para voltar, ele anda até a porta e usa "segue para…" (ou use "Levar o grupo").';}catch(e){console.warn('[Teste do mapa] ligação',e);}
  dizer(v.nome+' foi trazido de "'+(v.mapaId||'?')+'" para este mapa ('+d[0]+'). Ele continua sendo o mesmo personagem; '+lig);
 }
 /** v205: o mapa onde está o personagem de teste do mestre (Kael ou outro) abre por padrão para o mestre, para ele editar o que precisar.
  Só troca se o mapa aberto NÃO tem personagem de teste do mestre e NÃO tem jogador de verdade (nunca tira o mapa de quem está jogando). Uma vez por carregamento. */
 async function abrirMapaDoTeste(){
  const c=ctl();if(!c||!dep.ehMestre?.()||!dep.uid?.())return 'espera';
  const atual=mapaAtual();if(!atual)return 'espera';
  const r=await dep.getDocs(dep.collection(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes'));const todos=[];r.forEach(d=>todos.push({id:d.id,...d.data()}));
  const eu=String(dep.uid()),doMestre=todos.filter(t=>t.mapaId&&!/^sync(criatura|npc):/.test(t.id)&&(String(t.donoUid||'')===eu||t.id===ID||t.id==='teste_jogador_v138'));
  if(!doMestre.length||doMestre.some(t=>t.mapaId===atual))return 'ja';
  if(todos.some(t=>t.mapaId===atual&&t.donoUid&&String(t.donoUid)!==eu&&!/^sync/.test(t.id)))return 'jogadores';
  const alvo=doMestre[0].mapaId;await c.openMap?.(alvo);dizer('Abri o mapa do personagem de teste ('+doMestre[0].nome+').');return alvo;
 }
 let tentativas=0;const espera=setInterval(async()=>{try{if(++tentativas>40){clearInterval(espera);return;}const r=await abrirMapaDoTeste();if(r!=='espera')clearInterval(espera);}catch(e){clearInterval(espera);console.warn('[Teste do mapa] mapa padrão',e);}},2500);espera.unref?.();
 // ---------------------------------------------------------------- v205: ⚔️ DUELO DE TREINO (motor real: ficha, perícia, arma, defesa, dano, tempo real)
 // Coloca uma criatura de treino perto do personagem escolhido em “Atuar como” (ou do personagem de teste). A FICHA REAL NÃO É ALTERADA: o duelo usa uma CÓPIA em treinoSessoes/<sessão>/fichas/<id>
 // (js/mesa-treino-sessao.js redireciona ferimentos, condições, Sorte, necessidades, munição e consumo de itens para a cópia). Reiniciar recria a cópia a partir da ficha real de agora; sair apaga a cópia.
 // O que continua no estado da MESA (documento de saúde e histórico do mapa): a saúde das criaturas de treino e as linhas do histórico; ao reiniciar/sair isso é limpo.
 const CRIATURAS_TREINO=[['rastejante_de_cinzas','🐛 Rastejante de Cinzas (34% · anda até você)'],['insetoide_predador_1','🪲 Insetoide (35% · 3 ataques)'],['carrapato_de_ferro','Carrapato de Ferro (30%)'],['parasita_carniceiro','Parasita Carniceiro (48%)'],['escavador_de_carapaca','Escavador de Carapaça (42%)'],['insetoide_predador','Insetoide Predador (forte · 62%)'],['zumbi_1','🧟 Zumbi parado (26% · só bate se você chegar perto)']];
 const treinoIds=new Set(),dorme=ms=>new Promise(r=>setTimeout(r,ms));
 const treino=()=>win.mesaTreinoV205||null;
 const idFicha=t=>{let s=String(t?.id||'');try{s=decodeURIComponent(s);}catch(_){}return /^(sync|dummy:)/.test(s)?'':s;};
 const seletorAtual=()=>{const v=root.getElementById('novaSyncPersonagem')?.value;return v&&v!=='__mestre__'?v:'';};
 function atorDoTreino(){const tks=ctl()?.todosTokens?.()||[],sel=seletorAtual(),dec=t=>{try{return decodeURIComponent(String(t.id));}catch(_){return String(t.id);}};
  return tks.find(t=>String(t.id)===sel)||tks.find(t=>dec(t)===ID)||tks.find(t=>dec(t)==='teste_jogador_v138')||tks.find(t=>t.donoUid&&String(t.donoUid)===String(dep.uid?.()||''))||null;}
 /** tira do estado da MESA o que o treino deixou (saúde das criaturas de treino e linhas de histórico desde o começo): dano de treino não vira dano de partida */
 async function limparEstadoDeTreino(idsCriaturas,desde){
  try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncSaude'));if(s.exists()){const h=s.data(),actors={...(h.actors||{})};let mud=false;for(const id of idsCriaturas){if(actors[id]){delete actors[id];mud=true;}}if(mud)await dep.setDoc(D('combatesAtivos/mapaMesaSyncSaude'),JSON.parse(JSON.stringify({...h,actors,revision:Number(h.revision||0)+1})));}}catch(e){console.warn('[Treino] saúde',e);}
  try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncHistorico'));if(s.exists()&&desde){const h=s.data(),entries=(h.entries||[]).filter(e=>Number(e?.ts||0)<desde);if(entries.length!==(h.entries||[]).length)await dep.setDoc(D('combatesAtivos/mapaMesaSyncHistorico'),JSON.parse(JSON.stringify({...h,entries,revision:Number(h.revision||0)+1})));}}catch(e){console.warn('[Treino] histórico',e);}
 }
 async function iniciarDuelo({criatura='rastejante_de_cinzas',dist=3.2}={}){
  const c=ctl();if(!dep.ehMestre?.())throw Error('Só o mestre inicia o treino.');if(!c?.place||!mapaAtual())throw Error('Abra o mapa antes (🗺️ Mapas).');
  const a=atorDoTreino();if(!a)throw Error('Escolha um personagem em “Atuar como” (ou coloque o personagem de teste) antes de iniciar o duelo.');
  if(!treino())throw Error('Módulo de sessão de treino indisponível: o duelo NÃO foi iniciado (não vou arriscar a ficha real).');
  const id=idFicha(a);if(!id)throw Error('Este personagem não tem ficha salva para copiar.');
  // 1º isola: cópia gravada e redirecionamento armado. Se falhar (rede, permissão), NADA começa e a ficha real fica como está.
  try{await treino().iniciar([id]);}catch(e){throw Error('Não consegui criar a cópia de treino da ficha ('+(e?.message||e)+'). O duelo NÃO foi iniciado e a ficha real não foi alterada.');}
  const {W,H}=c.dimsAtual?.()||{W:28,H:14},passo=dist/W*28,direita=Number(a.x)+passo<=27.2;
  const idsNoBanco=async()=>{const r=await dep.getDocs(dep.collection(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes'));const l=new Set();r.forEach(d=>l.add(String(d.id)));return l;}; // lista de verdade (a local pode ter ids já apagados)
  const antes=await idsNoBanco();
  const px=+(direita?Number(a.x)+passo:Number(a.x)-passo).toFixed(3),py=+Number(a.y).toFixed(3);
  await c.place('synccriatura:'+criatura,{x:px,y:py},{instancia:true});
  let novo=null;for(let i=0;i<16&&!novo;i++){await dorme(250);const agora=await idsNoBanco();const nid=[...agora].find(x=>!antes.has(x)&&decodeURIComponent(x).startsWith('synccriatura:'+criatura));if(nid)novo=(c.todosTokens?.()||[]).find(t=>String(t.id)===nid)||{id:nid,nome:criatura};}
  if(!novo){await treino().encerrar();throw Error('Não consegui colocar a criatura (o mapa pode estar em combate por turnos: encerre-o antes).');}
  treinoIds.add(String(novo.id));dizer('⚔️ Duelo: '+(a.nome||'personagem')+' × '+(novo.nome||criatura)+'. A ficha real está isolada (o duelo usa uma cópia). Selecione o personagem em “Atuar como”, clique na criatura e use ⚔️ Atacar. Reiniciar recria a cópia e restaura a saúde.');return novo.id;
 }
 async function reiniciarDuelo(){
  const c=ctl(),b=root.getElementById('novaSyncRestore');if(b?.disabled)throw Error('A mesa está ocupada ou em combate por turnos: espere ou encerre o combate.');
  if(!treino()?.ativa())throw Error('Não há sessão de treino nesta aba (a aba foi fechada/reaberta?). Inicie o duelo de novo; não vou restaurar nada para não tocar na ficha real.');
  await treino().reiniciar(); // recria a cópia a partir da ficha real de AGORA (edições legítimas feitas no meio entram; nada é sobrescrito na ficha real)
  const caidos=async()=>{try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncSaude'));const a=s.exists()?s.data().actors||{}:{};return Object.values(a).some(v=>{const c=v?.combateLab;if(!c)return false;if(c.morto||c.inconsciente||c.incapacitado)return true;if(Object.entries(c.hit||{}).some(([k,n])=>Number(n)<Number(c.hitMax?.[k]??n)))return true;return Object.values(v.municaoLab||{}).some(n=>Number(n)<=0);});}catch(_){return false;}};
  for(let i=0;i<6;i++){ // a mesa ignora o pedido se estiver ocupada gravando um golpe: repete até todos ficarem de pé, com vida cheia e munição
   if(c?.restaurarTudo)await c.restaurarTudo();else if(b)b.click();else throw Error('Restaurar indisponível agora.');await dorme(1600);if(!(await caidos()))break;}
  try{await dep.setDoc(D('combatesAtivos/mesaTempoReal'),{pausado:false,mensagem:'',escolha:null,atualizadoEm:Date.now()},{merge:true});}catch(_){}
  dizer('🔄 Duelo reiniciado: cópia da ficha recriada a partir da ficha real de agora, saúde e munição restauradas, tempo real destravado.');
 }
 async function sairDuelo(){let n=0;const ids=[...treinoIds],desde=treino()?.desde?.()||0;
  for(const id of ids){try{await dep.deleteDoc(D('combatesAtivos/mapaMesaSyncDireta/posicoes/'+id));n++;}catch(e){console.warn('[Treino]',e);}treinoIds.delete(id);}
  try{await dep.setDoc(D('combatesAtivos/mesaTempoReal'),{ativo:false,pausado:false,mensagem:'',escolha:null,atualizadoEm:Date.now()},{merge:true});}catch(_){}
  const armada=!!treino()?.ativa(),pcs=(treino()?.ids?.()||[]);
  // NÃO uso o 🔄 Restaurar da mesa aqui: ele regrava fadiga/necessidades/Sorte nas FICHAS dos personagens do mapa (e sua gravação pode terminar depois de eu desarmar a cópia). Em vez disso tiro do documento de saúde as entradas do treino (criaturas e personagem): a saúde recomeça da ficha.
  await limparEstadoDeTreino([...ids,...pcs],desde);
  const copias=await (treino()?.encerrar?.()||0); // apaga a cópia e DESARMA o redirecionamento: a partir daqui o combate volta a usar a ficha real, que nunca foi tocada
  dizer('Saí do duelo: '+n+' criatura(s) de treino removida(s), '+copias+' cópia(s) de ficha apagada(s). A ficha real não foi alterada'+(armada?'.':' (sem sessão nesta aba: a saúde do treino pode ter ficado no mapa; use 🔄 Restaurar do mestre se precisar).'));return n;}
 /** v205: o Kael (personagem de teste do mestre) COMEÇA no mapa que está aberto: vem para um ponto livre (no mapa de teste: o acampamento) e já fica selecionado */
 /** op: {mapaId,x,y,W,H} para começar num mapa que acabou de ser criado (o mapa "aberto" ainda pode ser o antigo); sem op usa o mapa aberto */
 async function iniciarComKael(op={}){
  const mapa=String(op.mapaId||mapaAtual()||'');if(!mapa)throw Error('Abra o mapa em que quer testar (🗺️ Mapas) e clique de novo.');
  const ref=D('combatesAtivos/mapaMesaSyncDireta/posicoes/'+KAEL_ID),s=await dep.getDoc(ref);if(!s.exists())throw Error('O Kael de teste ainda não existe em nenhum mapa. Use "Colocar um personagem de teste" (abaixo).');
  const v=s.data(),d=op.W?{W:op.W,H:op.H}:(ctl()?.dimsAtual?.()||{W:28,H:14}),objs=op.mapaId&&op.mapaId!==mapaAtual()?[]:(ctl()?.cenaAtual?.()?.objects||[]);
  const ini=/ecossistema/i.test(String((dep.mapas?.()||[]).find(m=>String(m.id)===mapa)?.nome||mapa))?{x:DESTINOS[0][1],y:DESTINOS[0][2]}:{x:d.W/2,y:d.H/2};
  const p=pontoLivre(Number.isFinite(op.x)?op.x:ini.x,Number.isFinite(op.y)?op.y:ini.y,objs,d.W,d.H),n=norm(p.x,p.y,d);
  await dep.setDoc(ref,{x:n.x,y:n.y,mapaId:mapa,camada:3,revision:Number(v.revision||0)+1,facing:0},{merge:true});
  try{await dep.setDoc(D(ANDARES),{tokens:{[KAEL_ID]:{mapa,andar:1,em:Date.now()}}},{merge:true});}catch(_){}
  try{win.dispatchEvent(new win.CustomEvent('personagem-selecionado',{detail:KAEL_ID}));const sel=root.getElementById('novaSyncPersonagem');if(sel&&[...sel.options].some(o=>o.value===KAEL_ID)){sel.value=KAEL_ID;sel.dispatchEvent(new win.Event('change',{bubbles:true}));}}catch(_){}
  dizer((v.nome||'Kael')+' começou neste mapa (de "'+(v.mapaId||'?')+'") em ('+p.x+', '+p.y+') m. Ele já está selecionado: ande com WASD ou o mouse.');return {id:KAEL_ID,mapa,x:p.x,y:p.y};
 }
 async function remover(){try{await dep.deleteDoc(D(POS));await dep.setDoc(D(ANDARES),{tokens:{[ID]:null}},{merge:true});}catch(e){console.warn('[Teste do mapa]',e);}dizer('Personagem de teste removido.');}
 function abrirPainel(){
  root.getElementById('tpTestePainel')?.remove();
  const q=root.createElement('div');q.id='tpTestePainel';
  q.style.cssText="position:fixed;right:14px;top:70px;z-index:10050;width:340px;max-height:86vh;overflow:auto;background:#101a2c;color:#e8eefc;border:1px solid #8ee7ff;border-radius:14px;padding:12px;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.6)";
  q.innerHTML=`<div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font-size:15px">🧪 Testar o mapa com um personagem</b><button type="button" data-x style="border:0;background:none;color:#fff;font-size:16px;cursor:pointer">✕</button></div>
  <p style="margin:6px 0;color:#9fb3cc;font-size:12px">Abra antes o mapa de teste (🗺️ Mapas). O personagem de teste é só seu; “Remover” apaga só ele.</p>
  <label style="display:flex;gap:8px;align-items:center;margin:6px 0">Personagem <select data-quem style="flex:1">${Object.entries(PERSONAGENS).map(([k,v])=>`<option value="${k}">${v.nome}</option>`).join('')}</select></label>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0">${[['lanterna','🔦 Lanterna'],['tocha','🔥 Tocha'],['espada','⚡ Espada de energia'],['mochila','🎒 Mochila'],['capa','🧥 Capa']].map(([k,t])=>`<label><input type="checkbox" data-eq="${k}"> ${t}</label>`).join('')}</div>
  <div style="color:#9fb3cc;font-size:12px;margin-top:8px">⚔️ Arma e perícia do personagem selecionado (usa a mesma lista da barra de ação: ao escolher uma perícia de ataque, a arma dela já vem escolhida):</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:4px 0"><label style="display:block;font-size:11px;color:#9fb3cc">Perícia<select data-pericia style="width:100%"><option>(selecione o personagem)</option></select></label><label style="display:block;font-size:11px;color:#9fb3cc">Arma / ataque<select data-arma style="width:100%"><option>—</option></select></label></div>
  <div style="display:flex;gap:6px;margin:8px 0"><button type="button" data-colocar style="flex:1;padding:6px;border-radius:8px;border:1px solid #57e3a1;background:#12301f;color:#d8ffe8;cursor:pointer">➕ Colocar / trocar</button><button type="button" data-equipar style="flex:1;padding:6px;border-radius:8px;border:1px solid #8ee7ff;background:#102a3a;color:#d8f6ff;cursor:pointer">🎽 Aplicar equipamento</button></div>
  <div style="color:#9fb3cc;font-size:12px;margin-top:6px">Ir para:</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:4px 0">${DESTINOS.map((d,i)=>`<button type="button" data-ir="${i}" style="padding:5px;border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;font-size:12px">${d[0]}</button>`).join('')}</div>
  <div style="color:#9fb3cc;font-size:12px;margin-top:8px">Ou traga um personagem existente (ex.: Kael) para este mapa:</div><div style="display:flex;gap:6px;margin:4px 0"><select data-lista style="flex:1"><option>(carregando…)</option></select><button type="button" data-trazer style="padding:5px 8px;border-radius:8px;border:1px solid #f0c060;background:#33280f;color:#ffe9b0;cursor:pointer">⬇️ Trazer</button></div>
  <div style="color:#9fb3cc;font-size:12px;margin-top:8px">⚔️ Duelo de treino (motor real). A ficha real NÃO é alterada: o duelo usa uma cópia da ficha (sessão de treino); fechar a aba não deixa nada para reparar. A saúde das criaturas de treino fica no mapa e é limpa ao reiniciar/sair:</div><div style="display:flex;gap:6px;margin:4px 0"><select data-criatura style="flex:1">${CRIATURAS_TREINO.map(([i,n])=>`<option value="${i}">${n}</option>`).join('')}</select><button type="button" data-duelo style="padding:5px 8px;border-radius:8px;border:1px solid #ff9a6a;background:#3a1a10;color:#ffe0d0;cursor:pointer">⚔️ Iniciar</button></div><div style="display:flex;gap:6px;margin:4px 0"><button type="button" data-reiniciar style="flex:1;padding:5px;border-radius:8px;border:1px solid #57e3a1;background:#12301f;color:#d8ffe8;cursor:pointer">🔄 Reiniciar</button><button type="button" data-sairduelo style="flex:1;padding:5px;border-radius:8px;border:1px solid #8ee7ff;background:#102a3a;color:#d8f6ff;cursor:pointer">🚪 Sair do duelo</button></div>
  <button type="button" data-rem style="width:100%;margin-top:6px;padding:6px;border-radius:8px;border:1px solid #c0505a;background:#3a1218;color:#ffd8dc;cursor:pointer">🗑️ Remover personagem de teste</button>
  <pre id="tpTesteLog" style="white-space:pre-wrap;margin:8px 0 0;color:#cfe;font:12px Consolas,monospace;min-height:34px"></pre>`;
  root.body.append(q);
  // espelha os seletores da barra de ação (#novaSyncSkill / #novaSyncWeapon): é o MESMO sistema (a arma padrão da perícia, vínculo perícia↔arma, munição e ataque continuam os do jogo)
  {const ps=q.querySelector('[data-pericia]'),pa=q.querySelector('[data-arma]');
   const espelha=()=>{if(!q.isConnected){clearInterval(iv);return;}const sk=root.getElementById('novaSyncSkill'),wp=root.getElementById('novaSyncWeapon');
    if(!sk||!wp||!sk.options.length){ps.innerHTML='<option>(selecione o personagem em "Atuar como")</option>';pa.innerHTML='<option>—</option>';ps.dataset.sig=pa.dataset.sig='';return;}
    const sig=(sel)=>JSON.stringify([...sel.options].map(o=>[o.value,o.textContent]))+'|'+sel.value;
    const refaz=(dst,src)=>{const g=sig(src);if(dst.dataset.sig===g)return;dst.dataset.sig=g;dst.innerHTML=[...src.options].map(o=>'<option value="'+o.value+'">'+o.textContent+'</option>').join('')||'<option>—</option>';dst.value=src.value;};
    refaz(ps,sk);refaz(pa,wp);};
   ps.addEventListener('change',()=>{const sk=root.getElementById('novaSyncSkill');if(!sk)return;sk.value=ps.value;sk.dispatchEvent(new win.Event('change',{bubbles:true}));setTimeout(espelha,60);});
   pa.addEventListener('change',()=>{const wp=root.getElementById('novaSyncWeapon');if(!wp)return;wp.value=pa.value;wp.dispatchEvent(new win.Event('change',{bubbles:true}));setTimeout(espelha,60);});
   const iv=setInterval(espelha,800);espelha();}
  listarPersonagens().then(l=>{const s=q.querySelector('[data-lista]');s.innerHTML=l.length?l.map(p=>`<option value="${p.id}">${p.nome} (${p.mapa||'sem mapa'})</option>`).join(''):'<option value="">(nenhum)</option>';}).catch(e=>dizer('⚠️ '+(e?.message||e)));
  const lerEq=()=>Object.fromEntries([...q.querySelectorAll('[data-eq]')].map(c=>[c.dataset.eq,c.checked]));
  const tenta=async f=>{try{await f();}catch(e){dizer('⚠️ '+(e?.message||e));}};
  q.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.hasAttribute('data-x'))q.remove();else if(b.hasAttribute('data-colocar'))tenta(()=>colocar({quem:q.querySelector('[data-quem]').value,...lerEq()}));
   else if(b.hasAttribute('data-equipar'))tenta(()=>equipar(lerEq()));else if(b.dataset.ir!==undefined)tenta(()=>ir(Number(b.dataset.ir)));else if(b.hasAttribute('data-duelo'))tenta(()=>iniciarDuelo({criatura:q.querySelector('[data-criatura]').value}));else if(b.hasAttribute('data-reiniciar'))tenta(reiniciarDuelo);else if(b.hasAttribute('data-sairduelo'))tenta(sairDuelo);else if(b.hasAttribute('data-trazer'))tenta(()=>trazer(q.querySelector('[data-lista]').value));else if(b.hasAttribute('data-rem'))tenta(remover);});
 }
 const api={iniciarComKael,iniciarDuelo,reiniciarDuelo,sairDuelo,CRIATURAS_TREINO,abrirMapaDoTeste,abrirPainel,listarPersonagens,trazer,colocar,ir,equipar,remover,ID};win.mesaTestePersonagem=api;return api;
}
