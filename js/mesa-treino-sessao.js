// Mesa Estelar v205 — SESSÃO DE TREINO: o duelo de treino NÃO escreve na ficha real.
// Ao começar, a ficha do personagem é COPIADA para treinoSessoes/<sessão>/fichas/<id> (documento separado, marcado treinoV205:true e com a origem). Enquanto a sessão está armada NESTE navegador
// (o do mestre, que é quem resolve ataques), todo caminho "personagens/<id>" usado pelo combate (ferimentos, condições, Sorte, necessidades, munição, consumo de itens, equipar) é
// redirecionado para a cópia (globalThis.mesaTreinoRotaV205). Fora da sessão — outra aba, aba fechada, sessão encerrada, falha ao copiar — o caminho é o da ficha real, como sempre foi:
// fechar a aba ou perder a rede NÃO deixa nada para reparar na ficha original. Reiniciar RECRIA a cópia a partir da ficha real de agora (edições legítimas feitas no meio entram na cópia, nunca são sobrescritas).
// Só o mestre lê/escreve a coleção (firestore.rules). Módulo à parte: se falhar, o jogo segue igual.
export const COLECAO='treinoSessoes';
const CHAVE_NAVEGADOR='mesaTreinoSidV205',MAX_IDADE_MS=12*3600*1000;
/** caminho de ficha real → caminho da cópia (ou o mesmo, se não há sessão para ele). Puro, para teste. */
export function rotaDe(path,mapa,sid){
 const m=/^personagens\/([^/]+)$/.exec(String(path||''));if(!m||!sid)return path;
 let id=m[1];try{id=decodeURIComponent(id);}catch(_){}
 return mapa.has(id)?COLECAO+'/'+sid+'/fichas/'+encodeURIComponent(id):path;
}
export function instalarTreinoSessao(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const mestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 let sid='',ids=new Set(),armada=false,iniciadoEm=0;
 const limpa=v=>JSON.parse(JSON.stringify(v??null));
 const idsValidos=l=>[...new Set((l||[]).map(x=>{let s=String(x||'');try{s=decodeURIComponent(s);}catch(_){}return s;}).filter(s=>s&&!/^(sync|dummy:)/.test(s)))];
 const salvarNavegador=v=>{try{if(v)win.sessionStorage?.setItem(CHAVE_NAVEGADOR,v);else win.sessionStorage?.removeItem(CHAVE_NAVEGADOR);}catch(_){}};
 /** copia a ficha REAL de agora para a sessão (sobrescreve a cópia anterior; a ficha real só é LIDA) */
 async function copiar(id){
  const s=await dep.getDoc(D('personagens/'+id));if(!s.exists())return false;
  await dep.setDoc(D(COLECAO+'/'+sid+'/fichas/'+encodeURIComponent(id)),{...limpa(s.data()),treinoV205:true,treinoOrigemV205:'personagens/'+id,treinoSessaoV205:sid,treinoCopiadoEmV205:Date.now()});
  return true;
 }
 async function iniciar(lista){
  if(!mestre())throw Error('Só o mestre inicia um treino.');
  const novos=idsValidos(lista);if(!novos.length)throw Error('Nenhum personagem com ficha para treinar.');
  if(!armada){sid='t_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);ids=new Set();iniciadoEm=Date.now();}
  const quem=String(dep.uid?.()||'');
  // 1) cópia + documento da sessão; SÓ DEPOIS arma o redirecionamento (se algo falhar aqui, nada é redirecionado e nada é escrito na ficha real)
  const feitos=[];for(const id of novos){if(ids.has(id))continue;if(await copiar(id))feitos.push(id);}
  if(!feitos.length&&!ids.size)throw Error('Não consegui copiar nenhuma ficha (sem ficha salva?).');
  await dep.setDoc(D(COLECAO+'/'+sid),{tipo:'treino',ativa:true,por:quem,criadoEm:iniciadoEm,fichas:[...ids,...feitos],aviso:'Sessão de treino: estas cópias NÃO são fichas de verdade.',mapaId:String(dep.mapaAtual?.()||'')},{merge:true});
  for(const id of feitos)ids.add(id);armada=true;salvarNavegador(sid);
  void limparAntigas();
  return {sid,ids:[...ids]};
 }
 /** recria as cópias a partir das fichas reais de AGORA (reiniciar o duelo) */
 async function reiniciar(){
  if(!armada)throw Error('Não há sessão de treino armada neste navegador.');
  const lista=[...ids];armada=false; // desarma enquanto recopia: nada é redirecionado pela metade
  try{for(const id of lista)await copiar(id);await dep.setDoc(D(COLECAO+'/'+sid),{reiniciadoEm:Date.now(),ativa:true},{merge:true});}
  finally{armada=true;}
  return {sid,ids:lista};
 }
 /** encerra: desarma e apaga as cópias (melhor esforço). A ficha real não é tocada. */
 async function encerrar(){
  const antigo=sid,lista=[...ids];armada=false;ids=new Set();salvarNavegador('');
  if(!antigo)return 0;let n=0;
  try{await dep.setDoc(D(COLECAO+'/'+antigo),{ativa:false,encerradoEm:Date.now()},{merge:true});}catch(e){console.warn('[Treino] encerrar',e);}
  for(const id of lista){try{await dep.deleteDoc(D(COLECAO+'/'+antigo+'/fichas/'+encodeURIComponent(id)));n++;}catch(e){console.warn('[Treino] apagar cópia',e);}}
  sid='';return n;
 }
 /** simula/representa "aba fechada": some só da memória (o que acontece de verdade ao fechar a aba) */
 function esquecer(){armada=false;ids=new Set();sid='';}
 async function limparAntigas(){ // cópias abandonadas (aba fechada) de mais de 12 h: o mestre as apaga na próxima vez
  try{const q=await dep.getDocs(dep.collection(dep.db,COLECAO));const velhas=[];q.forEach(d=>{const v=d.data()||{};if(d.id!==sid&&Date.now()-Number(v.criadoEm||0)>MAX_IDADE_MS)velhas.push({id:d.id,fichas:v.fichas||[]});});
   for(const v of velhas){for(const f of v.fichas){try{await dep.deleteDoc(D(COLECAO+'/'+v.id+'/fichas/'+encodeURIComponent(f)));}catch(_){}}try{await dep.deleteDoc(D(COLECAO+'/'+v.id));}catch(_){}}}catch(_){}
 }
 // reabrir a MESMA aba (F5) mantém a sessão; aba nova ou fechada não (sessionStorage é por aba)
 async function reanexar(){
  if(!mestre())return;let guardado='';try{guardado=win.sessionStorage?.getItem(CHAVE_NAVEGADOR)||'';}catch(_){}
  if(!guardado||armada)return;
  try{const s=await dep.getDoc(D(COLECAO+'/'+guardado));if(!s.exists()||s.data()?.ativa===false){salvarNavegador('');return;}
   sid=guardado;iniciadoEm=Number(s.data().criadoEm)||Date.now();ids=new Set(s.data().fichas||[]);armada=true;}catch(e){console.warn('[Treino] reanexar',e);}
 }
 win.mesaTreinoRotaV205=path=>armada&&mestre()?rotaDe(path,ids,sid):path;
 const api={iniciar,reiniciar,encerrar,esquecer,ativa:()=>armada,sessao:()=>sid,ids:()=>[...ids],desde:()=>iniciadoEm,rota:p=>win.mesaTreinoRotaV205(p),reanexar};
 win.mesaTreinoV205=api;
 setTimeout(()=>{void reanexar();},2500);
 return api;
}
