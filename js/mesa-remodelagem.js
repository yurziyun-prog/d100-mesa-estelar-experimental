// Mesa Estelar v139 — Refaz os mapas dos cenários a partir da descrição de cada um (uma vez, na conta do mestre).
// Cópia de segurança de cada mapa antigo em combatesAtivos/backupMapa_<id>_v139 e backupCena_<id>_v139.
// Também: nave do grupo por dentro no espaço-porto, NPCs nos lugares de comerciante/morador, tira as miniaturas
// duplicadas das antigas fichas do mestre (a categoria PM acabou) e recheia de novo os armários.

import {gerarDoCenario,naveComInterior,gerarEspacoportoV141,classificarCenario} from './mesa-cenarios-mapas.js?v=151';
import {gerarEspacoporto,novoCtx,gerarPortaoVespera,gerarRuasEscavadas,areiaDoDeserto,LOJAS_PORTAO,CARAVANAS_PORTAO,gerarEntradaVespera,ENTRADA_V161,paraMesaV161,gerarPortaoV162,PORTAO_V162} from './mesa-gerador-mapas.js?v=141';
import {prepararPublicacaoOficina} from './nova-oficina.js?v=201';
import {cenaDoEstado,LIMITE_CENA,limites} from './mesa-mapas-ui.js?v=141';
import {livrePerto,pontoDeBorda,afastarNaBorda} from './mesa-ligacoes.js?v=154';
import {arrumarCenaTaverna} from './mesa-elenco.js?v=155';
import {PORTAO_IA,gerarPortaoIA,portaoNIA,PORTAO_IA2,gerarPortaoIA2} from './mesa-mapa-ia.js?v=166';
import {CIDADE_BAIXA,gerarCidadeBaixaIA,NOME_V173,ligarCidadeBaixa} from './mesa-mapa-cidade-baixa.js?v=173';
import {decorar,plantaPassavel} from './mesa-pecas.js?v=171';
import {trocarVeiculos,naveDoGrupo,MODELO_NAVE_GRUPO} from './mesa-naves-cena.js?v=173';
import {fatiarRedondas} from './mesa-formas.js?v=173';
import {THERION_ARTE,THERION_OFICINA,CIDADE_SEM_NOME,AGUA_OASIS} from './mesa-gpt-mapas.js?v=178';

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
export const PRECISA_V139=['pk_mesa_quadrada','pk_cadeira_madeira','pk_poste_luz','pk_escada','pk_maquina_venda','pk_nave_grupo'];
export const PULAR=new Set(['cenario_c001','cenario_c002','v138_espacoporto']);
// Portas que começam trancadas: celas e cápsulas de aluguel.
export function trancarPortas(cena){return {...cena,objects:(cena.objects||[]).map(o=>/^porta da (cela|capsula)/.test(sem(o.nome))?{...o,bloqueiaMovimento:true,bloqueiaVisao:true,estadoInterativo:{...(o.estadoInterativo||{}),aberto:false,trancado:true,dificuldade:'dificil',orig:{bloq:true,camada:3,visao:true}}}:o)};}
// NPCs que podem ir para os lugares de comerciante/morador: livres (em nenhum mapa) e não citados em nenhum cenário.
export function npcsLivres(npcs=[],cenarios=[],tokens=[]){
 const citados=sem(cenarios.map(c=>[c.npcsCena,c.personagensCenaIds].join(' ')).join(' | '));
 const usados=new Set(tokens.map(t=>decodeURIComponent(String(t.id||'')).split('~')[0]));
 return npcs.filter(n=>n?.id&&!usados.has('syncnpc:'+n.id)&&!(sem(n.nome).length>2&&citados.includes(sem(n.nome)))&&!/monstro|revenant|vampir|assassin|robo gigante|arma estrat/.test(sem([n.tipo,n.carreira,n.conceito].join(' '))));
}
export function papelCombina(n,papel){
 const t=sem([n.carreira,n.tipo,n.conceito].join(' ')),com=n.comerciante===true||String(n.comerciante)==='true';
 if(papel==='vendedor'||papel==='cozinheiro')return com||/comerci|mercad|vendedor|feirante|cambista|cozinh/.test(t);
 if(papel==='atendente')return /atendent|garcom|recepc|balconist|estalaj/.test(t);
 if(papel==='guarda')return /guarda|soldad|seguranc|vigia/.test(t);
 return /mensageir|crianca|bisca|tecnic|mecanic|motorist|transport|minerador|civil|habitant|analista|antiquar/.test(t);
}

export function instalarRemodelagem(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const toast=(t,ms=14000)=>{const n=root.createElement('div');n.textContent=t;n.style.cssText='position:fixed;left:16px;bottom:150px;z-index:9999;background:#1d2a44;border:1px solid #8ee7ff;color:#e8eefc;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:620px;max-height:40vh;overflow:auto';root.body.append(n);setTimeout(()=>n.remove(),ms);};
 let feito=false,rodando=false;

 async function backup(id){
  try{const m=await dep.getDoc(D('mapas/'+id));if(m.exists())await dep.setDoc(D('combatesAtivos/backupMapa_'+id+'_v139'),clean({em:new Date().toISOString(),mapa:m.data()}));}catch(e){console.warn('[Remodelagem] backup mapa',id,e);}
  try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)));if(s.exists()&&JSON.stringify(s.data()).length<900000)await dep.setDoc(D('combatesAtivos/backupCena_'+id+'_v139'),clean({em:new Date().toISOString(),cena:s.data()}));}catch(e){console.warn('[Remodelagem] backup cena',id,e);}
 }
 async function salvar(id,nome,state,ajustar=c=>c){
  let final=null;
  await win.mesaMapasV110_.salvar({id,nome,state,cenaDe:mid=>{const c=ajustar(cenaDoEstado(state,mid));final=c;return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
  return final;
 }
 async function moverToken(t,p,extra={}){
  await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+t.id),s=await tx.get(r);if(!s.exists())return;tx.set(r,{...s.data(),...extra,x:+p.x.toFixed(3),y:+p.y.toFixed(3),revision:Number(s.data().revision||0)+1});});
 }
 async function acomodar(id,cena,W,H){
  const ocup=[...(cena?.objects||[])].filter(o=>!(Number(o?.oficinaElement?.andarV144??o?.andarV144??1)>1)); // v166: só o que barra quem anda na rua (térreo)
  for(const t of (ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===id)){
   const p=livrePerto(ocup,Number(t.x),Number(t.y),W,H,.6);ocup.push({x:p.x,y:p.y,larguraM:1,alturaM:1,bloqueiaMovimento:true});
   if(Math.hypot(p.x-Number(t.x),p.y-Number(t.y))>.02)try{await moverToken(t,p);}catch(e){console.warn('[Remodelagem] token',e);}
  }
 }
 async function porGente(id,state,cena,W,H){
  const npcs=dep.npcs?.()||[],cens=dep.cenarios?.()||[];let livres=npcsLivres(npcs,cens,ctl()?.todosTokens?.()||[]);const ocup=[...(cena?.objects||[])];let n=0;
  for(const p of (state.pessoasV139||[])){
   if((p.papel==='vendedor'||p.papel==='cozinheiro')&&!p.npcId&&win.mesaComerciantes?.novo){try{const q=livrePerto(ocup,p.x*28/W,p.y*14/H,W,H,.5);ocup.push({x:q.x,y:q.y,larguraM:1,alturaM:1,bloqueiaMovimento:true});await win.mesaComerciantes.novo(id,q.x,q.y,{ambulante:p.papel==='vendedor'&&n%3===2});n++;}catch(e){console.warn('[Remodelagem] comerciante',e);}if(n>=(state.cenarioV139?.tipo==='mercado'?8:4))break;continue;} // v141
   let m=p.npcId?npcs.find(x=>String(x.id)===p.npcId):null;
   if(m&&(ctl()?.todosTokens?.()||[]).some(t=>decodeURIComponent(String(t.id)).split('~')[0]==='syncnpc:'+m.id))m=null;
   if(!m)m=livres.find(x=>papelCombina(x,p.papel));
   if(!m)continue;livres=livres.filter(x=>x!==m);
   const q=livrePerto(ocup,p.x*28/W,p.y*14/H,W,H,.5);ocup.push({x:q.x,y:q.y,larguraM:1,alturaM:1,bloqueiaMovimento:true});
   await dep.setDoc(D(POS+'/'+encodeURIComponent('syncnpc:'+m.id)),clean({nome:String(m.nome||m.id),imagem:String(m.miniatura?.url||m.imagem||''),donoUid:'',x:+q.x.toFixed(3),y:+q.y.toFixed(3),revision:0,facing:Math.PI/2,camada:3,mapaId:id,diametroM:1}));n++;
   if(n>=(state.cenarioV139?.tipo==='mercado'?8:4))break;
  }
  return n;
 }
 // miniaturas das antigas fichas do mestre (PMs) saem de todos os mapas; o personagem de teste fica
 async function tirarPMs(){
  const mestre=String(dep.uid?.()||''),fichas=new Map((dep.personagens?.()||[]).map(c=>[String(c.id),c]));const nomes=[];
  for(const t of (ctl()?.todosTokens?.()||[])){
   const id=decodeURIComponent(String(t.id||''));if(id.startsWith('sync'))continue;const f=fichas.get(id);
   if(!f||f.testeV138||String(f.dono||'')!==mestre)continue;
   try{await dep.deleteDoc(D(POS+'/'+t.id));nomes.push(String(t.nome||f.nome||id));}catch(e){console.warn('[Remodelagem] PM',e);}
  }
  return nomes;
 }
 async function montar(){
  if(feito||rodando||!ehMestre())return;
  const api=win.mesaMapasV110_,objs=dep.objetos?.()||[],mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens||!(dep.cenarios?.()||[]).length)return;
  if(!PRECISA_V139.every(id=>objs.some(o=>String(o.id)===id)))return; // o pacote de objetos ainda está entrando
  const flag=D('configuracoes/mapasCenariosV139');
  try{if((await dep.getDoc(flag)).exists()){feito=true;return;}if(!(await dep.getDoc(D('configuracoes/vesperaV138'))).exists())return;}catch(_){return;}
  rodando=true;const feitos=[],erros=[];let gente=0;
  try{
   const cens=(dep.cenarios?.()||[]).filter(c=>c.mapaId);
   const alvo=new Map();
   for(const c of cens){const m=mapas.find(x=>String(x.id)===String(c.mapaId));if(!m||PULAR.has(String(m.id))||m.portaoV138||m.ruasV138||m.espacoportoV138||alvo.has(String(m.id)))continue;alvo.set(String(m.id),{m,c});}
   for(const m of mapas)if(m.intermediario&&!alvo.has(String(m.id))&&!PULAR.has(String(m.id)))alvo.set(String(m.id),{m,c:{id:m.id,intermediario:true,nome:m.nome,local:m.intermediario.tipo==='cidade'?'Rua da cidade':m.intermediario.tipo==='floresta'?'Trilha no bosque':'Estrada no deserto',descricaoJogadores:m.intermediario.texto||''}});
   for(const [id,{m,c}] of alvo){
    try{
     await backup(id);
     const st=gerarDoCenario({...c,nome:m.nome||c.nome},{objetos:objs});
     const cena=await salvar(id,m.nome||c.nome||id,st,x=>{let y=trancarPortas(x);if(st.tavernaV132)y=arrumarCenaTaverna(y,dep.itens?.()||[]);return y;});
     await dep.setDoc(D('mapas/'+id),{remodeladoV139:{em:new Date().toISOString(),tipo:st.cenarioV139?.tipo||'',backup:'combatesAtivos/backupMapa_'+id+'_v139'},recheadoV129:st.tavernaV132?{em:new Date().toISOString()}:null},{merge:true});
     try{m.recheadoV129=st.tavernaV132?{em:1}:null;}catch(_){}
     await acomodar(id,cena,st.w,st.h);gente+=await porGente(id,st,cena,st.w,st.h);
     feitos.push(`${m.nome||id} (${st.cenarioV139?.tipo}, ${st.w}×${st.h} m)`);
    }catch(e){console.warn('[Remodelagem]',id,e);erros.push(`${m.nome||id}: ${e?.message||e}`);}
   }
   // espaço-porto com a nave do grupo por dentro
   try{const pm=mapas.find(x=>String(x.id)==='v138_espacoporto');if(pm){
    await backup('v138_espacoporto');const st=gerarEspacoporto({objetos:objs});const ctx=novoCtx(84,42,1390,objs);
    ctx.els.push(...st.elements.filter(e=>e.nome!=='Nave do grupo'));naveComInterior(ctx,14,11,{escala:.75});st.elements=ctx.els;
    const cena=await salvar('v138_espacoporto',pm.nome||'Espaço-porto de Véspera',st);await acomodar('v138_espacoporto',cena,84,42);feitos.push('Espaço-porto (nave do grupo por dentro)');}}catch(e){console.warn('[Remodelagem] espaço-porto',e);}
   const pms=await tirarPMs();
   try{await win.mesaRecheio?.rechear?.(()=>{});}catch(e){console.warn('[Remodelagem] recheio',e);}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros,npcs:gente,pmsRemovidos:pms});feito=true;
   toast(`🗺️ Mapas refeitos pela descrição dos cenários (${feitos.length}): ${feitos.join(' · ')}.${gente?` ${gente} NPC(s) postos como comerciantes/moradores.`:''}${pms.length?` Miniaturas de fichas antigas do mestre tiradas: ${pms.join(', ')}.`:''} Os mapas antigos ficaram guardados.${erros.length?' ⚠️ '+erros.join(' · '):''}`);
   const atual=String(ctl()?.mapaAtual?.()||'');if(alvo.has(atual)||atual==='v138_espacoporto')try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem]',e);}
  finally{rodando=false;}
 }
 // ------------------------------------------------------------ v141: naves por dentro, chão com textura, terraços e escadarias
 let feito141=false,rodando141=false,tent141=0;
 async function retexturizar(id){ // tira as elipses coloridas e pinta o chão com os pincéis de textura, mantendo o estado da cena
  const hid=win.mesaSessaoV115_?.hidratarMapa;if(!hid)return false;const m=await hid(id),st=m?.oficina2State;if(!st?.elements?.length)return false;
  const ctx=novoCtx(Number(st.w)||56,Number(st.h)||28,1417,dep.objetos?.()||[]);areiaDoDeserto(ctx,{dunas:6,veios:6});
  const novo={...st,elements:[...st.elements.filter(e=>!/^(duna|veio de areia colorida)$/i.test(String(e.nome||''))&&!/^(Sombra de duna|Ondulação da areia|Grãos de areia|Grãos coloridos|Cascalho)$/.test(String(e.nome||''))),...ctx.els].sort((a,b)=>(a.type==='path'?0:1)-(b.type==='path'?0:1)),texture:st.texture||'areia'};
  let cena=null;try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)));if(s.exists())cena=s.data();}catch(_){}
  await backup(id);
  const pub=prepararPublicacaoOficina(novo,cena,limites),ids=new Set(pub.objects.map(o=>o.id));
  const novaCena={...(cena||{}),mapId:String(id),objetoSchema:1,objects:[...pub.objects,...((cena?.objects)||[]).filter(o=>!ids.has(o.id)&&!o.oficinaElement)],oficinaConfig:pub.config,oficinaErasers:pub.erasers,editorRevision:Number(cena?.editorRevision||0)+1};
  await win.mesaMapasV110_.salvar({id,nome:m.nome||id,state:novo,cenaDe:()=>JSON.stringify(novaCena).length<=LIMITE_CENA?novaCena:cenaDoEstado(novo,id)});
  return true;
 }
 async function montar141(){
  if(feito141||rodando141||!ehMestre())return;
  const api=win.mesaMapasV110_,objs=dep.objetos?.()||[],mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens)return;
  if(!['pk_escada','pk_nave_grupo','pk_nave_transporte'].every(i=>objs.some(o=>String(o.id)===i)))return;
  const flag=D('configuracoes/mapasV141');
  try{if((await dep.getDoc(flag)).exists()){feito141=true;return;}
   if(!(await dep.getDoc(D('configuracoes/vesperaV138'))).exists()||!(await dep.getDoc(D('configuracoes/mapasCenariosV139'))).exists())return;}catch(_){return;}
  if(++tent141>2){feito141=true;return;}
  rodando141=true;const feitos=[],erros=[];
  try{
   const tenta=async(nome,f)=>{try{if(await f()!==false)feitos.push(nome);}catch(e){console.warn('[Remodelagem v141]',nome,e);erros.push(nome+': '+(e?.message||e));}};
   const porto=mapas.find(x=>String(x.id)==='v138_espacoporto'),portao=mapas.find(x=>String(x.id)==='cenario_c001'||x.portaoV138),ruas=mapas.find(x=>String(x.id)==='cenario_c002'||x.ruasV138);
   if(porto)await tenta('Espaço-porto (todas as naves por dentro)',async()=>{await backup(String(porto.id));const st=gerarEspacoportoV141({objetos:objs},gerarEspacoporto);const c=await salvar(String(porto.id),porto.nome||'Espaço-porto de Véspera',st);await acomodar(String(porto.id),c,84,42);});
   if(portao)await tenta('Portão de Véspera (areia com textura, escadaria até a cidade)',async()=>{const id=String(portao.id);await backup(id);const st=gerarPortaoVespera({objetos:objs,nome:portao.nome||'Portão de Véspera'});
    const c=await salvar(id,portao.nome||'Portão de Véspera',st,x=>({...x,objects:(x.objects||[]).map(o=>/^port[aã]o de v[eé]spera$/i.test(String(o.nome||''))?{...o,estadoInterativo:{...(o.estadoInterativo||{}),trancado:true,aberto:false,dificuldade:'dificil'}}:o)}));await acomodar(id,c,56,28);});
   if(ruas)await tenta('Ruas Escavadas (terraços com escadarias)',async()=>{const id=String(ruas.id);await backup(id);const st=gerarRuasEscavadas({objetos:objs,nome:ruas.nome||'Ruas Escavadas de Véspera'});const c=await salvar(id,ruas.nome||'Ruas Escavadas de Véspera',st);await acomodar(id,c,56,28);});
   for(const m of mapas){const tipo=m.remodeladoV139?.tipo||'';if(PULAR.has(String(m.id))||!(tipo==='ermos'||String(m.id)==='v137_planicie_trombetideos'))continue;await tenta(`${m.nome||m.id} (chão com textura)`,()=>retexturizar(String(m.id)));}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito141=true;
   toast(`🏜️ Mapas melhorados: ${feitos.join(' · ')}. Cópias antigas guardadas.${erros.length?' ⚠️ '+erros.join(' · '):''}`);
   const atual=String(ctl()?.mapaAtual?.()||'');if([porto?.id,portao?.id,ruas?.id].map(String).includes(atual))try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v141]',e);}
  finally{rodando141=false;}
 }
 // ------------------------------------------------------------ v144: Última Bateria com andares de verdade (o de cima por cima do térreo)
 let feito144=false,rodando144=false,tent144=0;
 async function montar144(forcar=false){
  if(forcar===true){feito144=false;tent144=0;}else forcar=false;
  if(feito144||rodando144||!ehMestre())return;
  const api=win.mesaMapasV110_,objs=dep.objetos?.()||[],mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens||!(dep.cenarios?.()||[]).length)return;
  {const falta=['pk_escada','pk_fut_capsula','pk_fut_porta','pk_beliche','pk_escada_interna','pk_ladrilhos_retro','pk_ladrilhos_retro2','pk_ladrilhos_metal'].filter(i=>!objs.some(o=>String(o.id)===i));if(falta.length){if(forcar)toast('🏢 Ainda faltam objetos novos no banco ('+falta.join(', ')+'). Espere uns segundos com a mesa aberta e tente de novo.');return;}}
  const flag=D('configuracoes/andaresV151'); // v146: refeita em 28×14 (menor e ampliada), escada vertical, beliches e ladrilhos
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito144=true;return;}if(!forcar&&!(await dep.getDoc(D('configuracoes/mapasCenariosV139'))).exists())return;}catch(_){return;}
  if(!forcar&&++tent144>2){feito144=true;return;}
  rodando144=true;const feitos=[],erros=[];
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   // v150: acha o mapa da Última Bateria pelo cenário (mapaId), pelo mapa (cenarioId) ou pelo nome
   const semN=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),alvos=new Map();
   for(const c of (dep.cenarios?.()||[])){if(classificarCenario(c).tipo!=='taverna')continue;for(const m of mapas)if(String(m.id)===String(c.mapaId||'')||String(m.cenarioId||'')===String(c.id))alvos.set(String(m.id),{c,m});}
   for(const m of mapas)if(/ultima bateria/.test(semN(m.nome))&&!alvos.has(String(m.id))){const c=(dep.cenarios?.()||[]).find(x=>/ultima bateria/.test(semN(x.nome)))||{id:'ultima_bateria',nome:m.nome};alvos.set(String(m.id),{c,m});}
   if(!alvos.size)erros.push('mapa da Última Bateria não encontrado');
   for(const {c,m} of alvos.values()){
    const id=String(m.id);
    try{await backup(id);const st=gerarDoCenario({...c,nome:m.nome||c.nome},{objetos:objs});
     const cena=await salvar(id,m.nome||c.nome||id,st,x=>arrumarCenaTaverna(trancarPortas(x),dep.itens?.()||[]));
     const terreo=cena?{...cena,objects:(cena.objects||[]).filter(o=>!(Number(o.andarV144??o.oficinaElement?.andarV144??1)>1))}:cena;
     await acomodar(id,terreo,st.w,st.h);
     // v150: bar iluminado por dentro (luz ambiente de dia, sem a escuridão da noite lá fora)
     try{await dep.setDoc(D('combatesAtivos/mesaVisual_'+encodeURIComponent(id)),{ambiente:'dia',mapId:id,atualizadoEm:new Date().toISOString()},{merge:true});}catch(e){console.warn('[Remodelagem v150] luz',e);}
     // v146: o mapa mudou de tamanho (42×21 → 28×14): a mesa aberta nele passa a usar o tamanho novo
     try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));if(sh.exists()&&String(sh.data()?.mapId||'')===id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta'),{larguraM:st.w,alturaM:st.h},{merge:true});}catch(e){console.warn('[Remodelagem v146] tamanho',e);}
     const tk={};for(const t of (ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===id))tk[t.id]={mapa:id,andar:1,em:Date.now()};
     if(Object.keys(tk).length)await dep.setDoc(D('combatesAtivos/mesaAndares'),clean({tokens:tk}),{merge:true});
     feitos.push(m.nome||id);}catch(e){console.warn('[Remodelagem v144]',id,e);erros.push((m.nome||id)+': '+(e?.message||e));}
   }
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito144=true;
   if(!feitos.length)toast('🏢 Última Bateria: nada foi refeito'+(erros.length?' — '+erros.join(' · '):'')+'.');
   if(feitos.length){toast(`🏢 ${feitos.join(' · ')}: refeita menor e ampliada (28×14 m), com piso de ladrilhos, escada larga na parede esquerda, banheiro unissex e, em cima, cápsulas e dormitórios com beliches. Cópia antiga guardada.${erros.length?' ⚠️ '+erros.join(' · '):''}`);try{ctl()?.refreshView?.();}catch(_){}}
  }catch(e){console.warn('[Remodelagem v144]',e);}
  finally{rodando144=false;}
 }
 // ------------------------------------------------------------ v160: Portão com barracas em que se entra, comerciantes atrás do balcão e caravanas
 let feito160=false,rodando160=false,tent160=0;
 async function montar160(forcar=false){
  if(forcar===true){feito160=false;tent160=0;}else forcar=false;
  if(feito160||rodando160||!ehMestre())return;
  const api=win.mesaMapasV110_,objs=dep.objetos?.()||[],mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens||!win.mesaComerciantes?.novo)return;
  if(!['pk_barraca_rubra','pk_mesa_longa','pk_estante_arquivo','pk_vei_carroca'].every(i=>objs.some(o=>String(o.id)===i)))return;
  const flag=D('configuracoes/portaoLojasV160');
  try{if(!forcar&&((await dep.getDoc(flag)).exists()||(await dep.getDoc(D('configuracoes/portaoPintadoV161'))).exists()||rodando161||rodando162)){feito160=true;return;}}catch(_){return;}
  if(!forcar){feito160=true;return;} // v161: o Portão agora é o pintado; a versão de barracas só se o mestre pedir no 🛠️
  if(!forcar&&++tent160>2){feito160=true;return;}
  const portao=mapas.find(x=>String(x.id)==='cenario_c001'||x.portaoV138);if(!portao){feito160=true;return;}
  rodando160=true;const id=String(portao.id),W=56,H=28,N=p=>({x:+(p.x*28/W).toFixed(3),y:+(p.y*14/H).toFixed(3)}),feitos=[],erros=[];
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   await backup(id);
   const st=gerarPortaoVespera({objetos:objs,nome:portao.nome||'Portão de Véspera'});
   const cena=await salvar(id,portao.nome||'Portão de Véspera',st,x=>({...x,objects:(x.objects||[]).map(o=>/^port[aã]o de v[eé]spera$/i.test(String(o.nome||''))?{...o,estadoInterativo:{...(o.estadoInterativo||{}),trancado:true,aberto:false,dificuldade:'dificil'}}:o)}));
   feitos.push('mapa refeito');
   // comerciantes atrás dos balcões: aproveita os genéricos que já estão no mapa (de raça que combina), cria os que faltam
   const toks=()=>(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===id);
   const usados=new Set(),esp=t=>(/^syncnpc:comerciante_generico_([a-z]+)/.exec(decodeURIComponent(String(t.id||'')))||[])[1]||'';
   for(const L of LOJAS_PORTAO){
    const p=N(L.vendedor);let t=toks().find(t=>!usados.has(t.id)&&esp(t)===L.especie);
    try{if(t){await moverToken(t,p,{facing:Math.PI/2});usados.add(t.id);}else{const nid=await win.mesaComerciantes.novo(id,p.x,p.y,{ambulante:false,especie:L.especie});usados.add(nid);}
     await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:{[[...usados].pop()]:{ambulante:false,lojaV160:L.id,lojaNome:L.nome}}}),{merge:true});feitos.push(L.nome);}catch(e){erros.push(L.nome+': '+(e?.message||e));}
   }
   // caravanas: dragões-trombeta de carga (sem asas) e um caravaneiro que também vende
   const cri=(dep.criaturas?.()||[]),drag=cri.find(c=>/trombet/i.test(String(c.nome||c.id))&&/corredor/i.test(String(c.id))&&/domestic/i.test(String(c.id)))||cri.find(c=>/trombet/i.test(String(c.nome||c.id))&&!/alad/i.test(String(c.id)));
   let n=0;for(const t of (ctl()?.todosTokens?.()||[])){const m=/^synccriatura:[^~]+~(\d+)$/.exec(decodeURIComponent(String(t.id||'')));if(m)n=Math.max(n,Number(m[1]));}
   for(const C of CARAVANAS_PORTAO){
    if(drag)for(const d of C.dragoes){const p=N(d);const tid=encodeURIComponent('synccriatura:'+drag.id+'~'+(++n));
     try{await dep.setDoc(D(POS+'/'+tid),clean({nome:'Dragão-trombeta de carga',imagem:String(drag.miniatura?.url||drag.imagem||''),donoUid:'',x:p.x,y:p.y,revision:0,facing:Math.random()*Math.PI*2,camada:3,mapaId:id,diametroM:Number(drag.diametroM)||2}));}catch(e){erros.push('dragão: '+(e?.message||e));}}
    try{const p=N(C.caravaneiro);const nid=await win.mesaComerciantes.novo(id,p.x,p.y,{ambulante:false,especie:C.caravaneiro.especie});await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:{[nid]:{ambulante:false,caravanaV160:C.id}}}),{merge:true});}catch(e){erros.push('caravaneiro: '+(e?.message||e));}
    feitos.push('caravana '+C.id);
   }
   if(!drag)erros.push('dragão-trombeta não achado no banco de criaturas');
   await acomodar(id,cena,W,H);
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito160=true;
   try{await win.publicarComerciantesV141_?.();}catch(_){}
   toast(`⛺ Portão de Véspera: ${LOJAS_PORTAO.length} barracas em que se entra (com balcão e comerciante), 2 caravanas com dragões-trombeta. Cópia antiga guardada.${erros.length?' ⚠️ '+erros.join(' · '):''}`);
   if(String(ctl()?.mapaAtual?.()||'')===id)try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v160]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando160=false;}
 }
 // ------------------------------------------------------------ v161: Portão de Véspera PINTADO (arte de cidade do deserto + paredão e portão)
 let feito161=false,rodando161=false,tent161=0;
 async function montar161(forcar=false){
  if(forcar===true){feito161=false;tent161=0;}else forcar=false;
  if(feito161||rodando161||!ehMestre())return;
  if(!forcar){feito161=true;return;} // v161b: as imagens eram só inspiração — este Portão não é montado sozinho (o novo vem na v162)
  const api=win.mesaMapasV110_,objs=dep.objetos?.()||[],mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens||!win.mesaComerciantes?.novo)return;
  if(!['pk_portao_vespera','pk_mesa_longa','pk_vei_carroca'].every(i=>objs.some(o=>String(o.id)===i)))return;
  const flag=D('configuracoes/portaoPintadoV161');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito161=true;return;}}catch(_){return;}
  if(!forcar&&++tent161>2){feito161=true;return;}
  const portao=mapas.find(x=>String(x.id)==='cenario_c001'||x.portaoV138);if(!portao){feito161=true;return;}
  rodando161=true;const id=String(portao.id),E=ENTRADA_V161,N=p=>paraMesaV161(p,E),feitos=[],erros=[];
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   await backup(id);
   const st=gerarEntradaVespera({objetos:objs,nome:portao.nome||'Portão de Véspera'});
   const cena=await salvar(id,portao.nome||'Portão de Véspera',st,x=>({...x,objects:(x.objects||[]).map(o=>/^port[aã]o de v[eé]spera$/i.test(String(o.nome||''))?{...o,estadoInterativo:{...(o.estadoInterativo||{}),trancado:true,aberto:false,dificuldade:'dificil'}}:o)}));
   await dep.setDoc(D('mapas/'+id),clean({larguraM:E.W,alturaM:E.H,portaoN:st.portaoN,entradaV161:true,portaoV138:true,estiloV129:'pintado'}),{merge:true});
   try{const m=mapas.find(x=>String(x.id)===id);if(m)Object.assign(m,{larguraM:E.W,alturaM:E.H,portaoN:st.portaoN,entradaV161:true});}catch(_){}
   try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));if(sh.exists()&&String(sh.data()?.mapId||'')===id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta'),{larguraM:E.W,alturaM:E.H},{merge:true});}catch(_){}
   feitos.push('mapa pintado');
   // saídas (ligações) nos lugares novos: subida para a cidade pela rampa, trilha do espaço-porto a oeste
   try{const ls=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));if(ls.exists()){const v=ls.data()||{};let mud=false;
    const ligs=(v.ligacoes||[]).map(l=>{const lado=String(l?.a?.mapa)===id?'a':String(l?.b?.mapa)===id?'b':'';if(!lado)return l;const outro=String(l[lado==='a'?'b':'a']?.mapa||'');
     const alvo=/espaco|porto/.test(outro)||outro==='v138_espacoporto'?E.saidas.espacoporto:E.saidas.ruas;mud=true;return {...l,[lado]:{...l[lado],...N(alvo)}};});
    if(mud)await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:ligs,atualizadoEm:Date.now()}));}}catch(e){erros.push('saídas: '+(e?.message||e));}
   // gente no lugar: primeiro tira todo mundo de dentro das paredes; depois põe cada um no seu posto
   await acomodar(id,cena,E.W,E.H);
   const toks=()=>(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===id),dec=t=>decodeURIComponent(String(t.id||''));
   const den=toks().find(t=>/^syncnpc:guarda_do_portao_1$/.test(dec(t)))||toks().find(t=>/^denzel/i.test(String(t.nome||'').replace(/^(NPC)\s*[·:-]\s*/i,'')));
   if(den)await moverToken(den,N(E.denzel),{facing:Math.PI/2});
   const genericos=toks().filter(t=>/^syncnpc:comerciante_generico_/.test(dec(t))),esp=t=>(/^syncnpc:comerciante_generico_([a-z]+)/.exec(dec(t))||[])[1]||'',usados=new Set();
   const pegar=(e)=>{let t=genericos.find(x=>!usados.has(x.id)&&esp(x)===e);if(t)usados.add(t.id);return t;};
   const metaPatch={};
   for(const L of Object.values(E.lojas)){if(!L.vendedor)continue;const p=N(L.vendedor);
    try{let t=pegar(L.especie);let tid;if(t){await moverToken(t,p,{facing:Math.PI/2});tid=t.id;}else{tid=await win.mesaComerciantes.novo(id,p.x,p.y,{ambulante:false,especie:L.especie});usados.add(tid);}
     metaPatch[tid]={ambulante:false,lojaV161:L.id,lojaNome:L.nome};feitos.push(L.nome);}catch(e){erros.push(L.nome+': '+(e?.message||e));}}
   // caravanas: dragões de carga e caravaneiros (reaproveita os que já existem)
   const cri=(dep.criaturas?.()||[]),drag=cri.find(c=>/trombet/i.test(String(c.nome||c.id))&&/corredor/i.test(String(c.nome||'')+' '+String(c.id))&&/domestic/i.test(String(c.nome||'')+' '+String(c.id)))||cri.find(c=>/trombet/i.test(String(c.nome||c.id))&&!/alad|asa/i.test(String(c.nome||'')+' '+String(c.id))); // sem asas, como camelos
   const dragoes=toks().filter(t=>/de carga/i.test(String(t.nome||''))&&!/alad/i.test(dec(t)));for(const t of toks().filter(t=>/de carga/i.test(String(t.nome||''))&&/alad/i.test(dec(t))))try{await dep.deleteDoc(D(POS+'/'+t.id));}catch(_){}let di=0,n=0;
   for(const t of (ctl()?.todosTokens?.()||[])){const m=/^synccriatura:[^~]+~(\d+)$/.exec(dec(t));if(m)n=Math.max(n,Number(m[1]));}
   for(const C of E.caravanas){
    for(const d of C.dragoes){const p=N(d),t=dragoes[di++];
     try{if(t)await moverToken(t,p);else if(drag){const tid=encodeURIComponent('synccriatura:'+drag.id+'~'+(++n));await dep.setDoc(D(POS+'/'+tid),clean({nome:'Dragão-trombeta de carga',imagem:String(drag.miniatura?.url||drag.imagem||''),donoUid:'',x:p.x,y:p.y,revision:0,facing:Math.random()*Math.PI*2,camada:3,mapaId:id,diametroM:Number(drag.diametroM)||2}));}}catch(e){erros.push('dragão: '+(e?.message||e));}}
    try{const p=N(C.caravaneiro);let t=pegar(C.caravaneiro.especie),tid;if(t){await moverToken(t,p);tid=t.id;}else{tid=await win.mesaComerciantes.novo(id,p.x,p.y,{ambulante:false,especie:C.caravaneiro.especie});usados.add(tid);}metaPatch[tid]={ambulante:false,caravanaV160:C.id};}catch(e){erros.push('caravaneiro: '+(e?.message||e));}
   }
   for(const t of dragoes.slice(di))try{await dep.deleteDoc(D(POS+'/'+t.id));}catch(_){}
   // comerciantes genéricos que sobraram neste mapa: ficam dois andando pela feira, os outros saem (eram cópias)
   const sobra=genericos.filter(t=>!usados.has(t.id));let tirados=0;
   for(const [i,t] of sobra.entries()){if(i<2){metaPatch[t.id]={ambulante:true};continue;}try{await dep.deleteDoc(D(POS+'/'+t.id));tirados++;}catch(_){}}
   if(tirados)feitos.push(tirados+' cópias de comerciante tiradas');
   if(Object.keys(metaPatch).length)await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:metaPatch}),{merge:true});
   await dep.setDoc(D('configuracoes/portaoLojasV160'),{em:new Date().toISOString(),substituidoPor:'portaoPintadoV161'},{merge:true});feito160=true;
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito161=true;
   try{await win.publicarComerciantesV141_?.();}catch(_){}
   toast(`🏜️ Portão de Véspera pintado: cidade diante do portão, paredão com a rampa, 4 lojas com comerciante atrás do balcão e acampamento das caravanas. Cópia antiga guardada.${erros.length?' ⚠️ '+erros.join(' · '):''}`);
   if(String(ctl()?.mapaAtual?.()||'')===id)try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v161]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando161=false;}
 }
 // ------------------------------------------------------------ v162: Portão de Véspera com o KIT DO DESERTO (casas de terraço, cúpula, lojas, toldos, varais, agaves, caravanas)
 let feito162=false,rodando162=false,tent162=0;
 async function montar162(forcar=false){
  if(forcar===true){feito162=false;tent162=0;}else forcar=false;
  if(feito162||rodando162||!ehMestre())return;
  const api=win.mesaMapasV110_,objs=dep.objetos?.()||[],mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens||!win.mesaComerciantes?.novo)return;
  if(!['pk_portao_vespera','pk_mesa_longa','pk_vei_carroca','pk_casa_ret','pk_casa_cupula','pk_patio_loja_n','pk_varal','pk_toldo_rubi','pk_agave'].every(i=>objs.some(o=>String(o.id)===i)))return;
  const flag=D('configuracoes/portaoKitV162');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito162=true;return;}}catch(_){return;}
  if(!forcar&&++tent162>2){feito162=true;return;}
  // v162: mapa NOVO, ao lado do Portão pintado (que continua valendo) — para comparar
  const portao={id:'v162_portao_kit',nome:'Portão de Véspera · nossa arte'};
  rodando162=true;const id=String(portao.id),E=PORTAO_V162,N=p=>paraMesaV161(Array.isArray(p)?{x:p[0],y:p[1]}:p,E),feitos=[],erros=[];
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   const st=gerarPortaoV162({objetos:objs,nome:portao.nome||'Portão de Véspera'});
   const cena=await salvar(id,portao.nome||'Portão de Véspera',st,x=>({...x,objects:(x.objects||[]).map(o=>/^port[aã]o de v[eé]spera$/i.test(String(o.nome||''))?{...o,estadoInterativo:{...(o.estadoInterativo||{}),trancado:true,aberto:false,dificuldade:'dificil'}}:o)}));
   await dep.setDoc(D('mapas/'+id),clean({larguraM:E.W,alturaM:E.H,portaoN:st.portaoN,portaoV162:true,estiloV129:'kit-deserto',comparacaoV162:true}),{merge:true});
   try{const m=mapas.find(x=>String(x.id)===id);if(m)Object.assign(m,{larguraM:E.W,alturaM:E.H,portaoN:st.portaoN,portaoV162:true});}catch(_){}
   try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));if(sh.exists()&&String(sh.data()?.mapId||'')===id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta'),{larguraM:E.W,alturaM:E.H},{merge:true});}catch(_){}
   feitos.push('mapa pintado');
   // gente no lugar: primeiro tira todo mundo de dentro das paredes; depois põe cada um no seu posto
   await acomodar(id,cena,E.W,E.H);
   const toks=()=>(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===id),dec=t=>decodeURIComponent(String(t.id||''));
   const den=toks().find(t=>/^syncnpc:guarda_do_portao_1$/.test(dec(t)))||toks().find(t=>/^denzel/i.test(String(t.nome||'').replace(/^(NPC)\s*[·:-]\s*/i,'')));
   const genericos=toks().filter(t=>/^syncnpc:comerciante_generico_/.test(dec(t))),esp=t=>(/^syncnpc:comerciante_generico_([a-z]+)/.exec(dec(t))||[])[1]||'',usados=new Set();
   const pegar=(e)=>{let t=genericos.find(x=>!usados.has(x.id)&&esp(x)===e);if(t)usados.add(t.id);return t;};
   const metaPatch={};
   for(const L of Object.values(E.lojasCalc||{})){if(!L.vendedor)continue;const p=N(L.vendedor);
    try{let t=pegar(L.especie);let tid;if(t){await moverToken(t,p,{facing:Math.PI/2});tid=t.id;}else{tid=await win.mesaComerciantes.novo(id,p.x,p.y,{ambulante:false,especie:L.especie});usados.add(tid);}
     metaPatch[tid]={ambulante:false,lojaV161:L.id,lojaNome:L.nome};feitos.push(L.nome);}catch(e){erros.push(L.nome+': '+(e?.message||e));}}
   // caravanas: dragões de carga e caravaneiros (reaproveita os que já existem)
   const cri=(dep.criaturas?.()||[]),drag=cri.find(c=>/trombet/i.test(String(c.nome||c.id))&&/corredor/i.test(String(c.nome||'')+' '+String(c.id))&&/domestic/i.test(String(c.nome||'')+' '+String(c.id)))||cri.find(c=>/trombet/i.test(String(c.nome||c.id))&&!/alad|asa/i.test(String(c.nome||'')+' '+String(c.id))); // sem asas, como camelos
   const dragoes=toks().filter(t=>/de carga/i.test(String(t.nome||''))&&!/alad/i.test(dec(t)));for(const t of toks().filter(t=>/de carga/i.test(String(t.nome||''))&&/alad/i.test(dec(t))))try{await dep.deleteDoc(D(POS+'/'+t.id));}catch(_){}let di=0,n=0;
   for(const t of (ctl()?.todosTokens?.()||[])){const m=/^synccriatura:[^~]+~(\d+)$/.exec(dec(t));if(m)n=Math.max(n,Number(m[1]));}
   for(const C of E.caravanas){
    for(const d of C.dragoes){const p=N(d),t=dragoes[di++];
     try{if(t)await moverToken(t,p);else if(drag){const tid=encodeURIComponent('synccriatura:'+drag.id+'~'+(++n));await dep.setDoc(D(POS+'/'+tid),clean({nome:'Dragão-trombeta de carga',imagem:String(drag.miniatura?.url||drag.imagem||''),donoUid:'',x:p.x,y:p.y,revision:0,facing:Math.random()*Math.PI*2,camada:3,mapaId:id,diametroM:Number(drag.diametroM)||2}));}}catch(e){erros.push('dragão: '+(e?.message||e));}}
    try{const p=N(C.caravaneiro);let t=pegar(C.caravaneiro[2]),tid;if(t){await moverToken(t,p);tid=t.id;}else{tid=await win.mesaComerciantes.novo(id,p.x,p.y,{ambulante:false,especie:C.caravaneiro[2]});usados.add(tid);}metaPatch[tid]={ambulante:false,caravanaV160:C.id};}catch(e){erros.push('caravaneiro: '+(e?.message||e));}
   }
   for(const t of dragoes.slice(di))try{await dep.deleteDoc(D(POS+'/'+t.id));}catch(_){}
   // comerciantes genéricos que sobraram neste mapa: ficam dois andando pela feira, os outros saem (eram cópias)
   const sobra=genericos.filter(t=>!usados.has(t.id));let tirados=0;
   for(const [i,t] of sobra.entries()){if(i<2){metaPatch[t.id]={ambulante:true};continue;}try{await dep.deleteDoc(D(POS+'/'+t.id));tirados++;}catch(_){}}
   if(tirados)feitos.push(tirados+' cópias de comerciante tiradas');
   if(Object.keys(metaPatch).length)await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:metaPatch}),{merge:true});
   
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito162=true;
   try{await win.publicarComerciantesV141_?.();}catch(_){}
   toast(`🏜️ Mapa novo para comparar — "Portão de Véspera · nossa arte": praça de lajes com toldos, casas de terraço (redondas, em losango, em L), casa de cúpula, varais, agaves, 4 lojas com comerciante atrás do balcão e o acampamento das caravanas. O Portão pintado continua como está.${erros.length?' ⚠️ '+erros.join(' · '):''}`);
   if(String(ctl()?.mapaAtual?.()||'')===id)try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v162]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando162=false;}
 }
 // ------------------------------------------------------------ v163: mapa da imagem de IA (com o 1º reconhecimento), Denzel nos mapas novos do portão
 // e feira grande = um vendedor para cada coisa (a loja "Água e comida" ganha um vendedor só de comida).
 let feito163=false,rodando163=false,tent163=0;
 async function montar163(forcar=false){
  if(forcar===true){feito163=false;tent163=0;}else forcar=false;
  if(feito163||rodando163||!ehMestre())return;
  const api=win.mesaMapasV110_,mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens||!win.mesaComerciantes?.novo)return;
  const flag=D('configuracoes/portaoIAV163');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito163=true;return;}}catch(_){return;}
  if(mapas.some(m=>String(m.id)==='cenario_c001'&&m.portaoV165)){feito163=true;return;} // v165: o portão IA já virou o Portão de Véspera
  if(!forcar&&++tent163>2){feito163=true;return;}
  rodando163=true;const feitos=[],erros=[],metaPatch={};
  const toks=id=>(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===id),dec=t=>decodeURIComponent(String(t.id||''));
  const metaAll=()=>win.mesaComerciantes?.meta?.()||{};
  const denzelOrig=()=>(ctl()?.todosTokens?.()||[]).find(t=>dec(t)==='syncnpc:guarda_do_portao_1');
  let nDen=1;
  async function poeDenzel(id,W,H,p){
   if(toks(id).some(t=>/^syncnpc:guarda_do_portao_1(~|$)/.test(dec(t))&&/denzel/i.test(String(t.nome||''))))return;
   let n=nDen;for(const t of (ctl()?.todosTokens?.()||[])){const m=/^syncnpc:guarda_do_portao_1~(\d+)$/.exec(dec(t));if(m)n=Math.max(n,Number(m[1]));}nDen=n+1;
   const o=denzelOrig(),tid=encodeURIComponent('syncnpc:guarda_do_portao_1~'+(n+1));
   await dep.setDoc(D(POS+'/'+tid),clean({nome:'Denzel',imagem:String(o?.imagem||''),donoUid:'',x:+(p.x*28/W).toFixed(3),y:+(p.y*14/H).toFixed(3),revision:0,facing:Math.PI/2,camada:3,mapaId:id,diametroM:Number(o?.diametroM)||1}));
   feitos.push('Denzel em '+id);
  }
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   const E=PORTAO_IA,id=E.id;
   if(!mapas.some(m=>String(m.id)===id)){
    const st=gerarPortaoIA();await salvar(id,E.nome,st);
    await dep.setDoc(D('mapas/'+id),clean({larguraM:E.W,alturaM:E.H,portaoN:st.portaoN,portaoV163:true,estiloV129:'imagem',imagemV163:{src:E.arte,W:E.W,H:E.H},marcasV163:E.marcas}),{merge:true});
    try{const m=(dep.mapas?.()||[]).find(x=>String(x.id)===id);if(m)Object.assign(m,{larguraM:E.W,alturaM:E.H,portaoN:st.portaoN,portaoV163:true,imagemV163:{src:E.arte,W:E.W,H:E.H},marcasV163:E.marcas});}catch(_){}
    feitos.push('mapa da imagem');
    // saídas: as mesmas do Portão pintado (subida para a cidade passando o portão; trilha do espaço-porto embaixo)
    try{const ls=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));if(ls.exists()){const v=ls.data()||{},NI=p=>({x:+(p.x*28/E.W).toFixed(3),y:+(p.y*14/E.H).toFixed(3)});const novas=[];
     for(const l of (v.ligacoes||[])){const lado=String(l?.a?.mapa)==='cenario_c001'?'a':String(l?.b?.mapa)==='cenario_c001'?'b':'';if(!lado)continue;const outro=String(l[lado==='a'?'b':'a']?.mapa||'');
      const alvo=/espaco|porto/.test(outro)?{x:14.5,y:47.3}:{x:E.gateX,y:.9};novas.push({...l,id:String(l.id||'lig')+'_ia163',[lado]:{...l[lado],mapa:id,...NI(alvo)}});}
     if(novas.length)await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:[...(v.ligacoes||[]),...novas],atualizadoEm:Date.now()}));if(novas.length)feitos.push(novas.length+' saída(s)');}}catch(e){erros.push('saídas: '+(e?.message||e));}
    for(const v of E.vendedores){try{const tid=await win.mesaComerciantes.novo(id,+(v.x*28/E.W).toFixed(3),+(v.y*14/E.H).toFixed(3),{ambulante:false,especie:v.especie});metaPatch[tid]={ambulante:false,lojaV161:v.id,lojaNome:v.loja.nome,loja:{ramos:v.loja.ramos,nome:v.loja.nome,incluir:[],excluir:[],militares:false}};}catch(e){erros.push(v.id+': '+(e?.message||e));}}
   }
   try{await poeDenzel(id,E.W,E.H,E.denzel);}catch(e){erros.push('Denzel: '+(e?.message||e));}
   // Denzel também no mapa "nossa arte" (v162)
   if(mapas.some(m=>String(m.id)==='v162_portao_kit'))try{await poeDenzel('v162_portao_kit',PORTAO_V162.W,PORTAO_V162.H,{x:PORTAO_V162.denzel[0],y:PORTAO_V162.denzel[1]});}catch(e){erros.push('Denzel v162: '+(e?.message||e));}
   // lojas "Água e comida" dos outros mapas do portão: um vendedor de água e outro de comida
   let meta=metaAll();try{const sm=await dep.getDoc(D('combatesAtivos/mesaComerciantes'));if(sm.exists())meta={...(sm.data()?.nomes||{}),...meta};}catch(_){}
   for(const [k,m] of Object.entries(meta)){
    if(m?.lojaV161!=='agua'&&m?.lojaV160!=='agua')continue;if(m.loja?.ramos?.length)continue;
    const t=(ctl()?.todosTokens?.()||[]).find(x=>String(x.id)===k||dec(x)===decodeURIComponent(k));if(!t)continue;
    const mid=String(t.mapaId||''),mp=(dep.mapas?.()||[]).find(x=>String(x.id)===mid),W=Number(mp?.larguraM)||28;
    try{const nid=await win.mesaComerciantes.novo(mid,+(Number(t.x)+1.0*28/W).toFixed(3),Number(t.y),{ambulante:false,especie:'humano'});
     metaPatch[k]={...(metaPatch[k]||{}),loja:{ramos:['agua'],nome:'Água da travessia',incluir:[],excluir:[],militares:false}};
     metaPatch[nid]={ambulante:false,lojaV161:'comida',lojaNome:'Comida da travessia',loja:{ramos:['comida'],nome:'Comida da travessia',incluir:[],excluir:[],militares:false}};feitos.push('vendedor de comida em '+(mp?.nome||mid));}catch(e){erros.push('comida: '+(e?.message||e));}
   }
   if(Object.keys(metaPatch).length)await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:metaPatch}),{merge:true});
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito163=true;
   try{await win.publicarComerciantesV141_?.();}catch(_){}
   toast(`🖼️ Mapa novo: "${PORTAO_IA.nome}" — a imagem da IA com o primeiro reconhecimento (casas e rochas bloqueiam, toldos e plantas ficam por cima de quem passa), Denzel cobrando a entrada e 7 vendedores, um para cada coisa (água, comida, mantimentos, peças, roupas, remédios, armas). Corrija as marcas no 🖌️. O Portão pintado continua valendo.${erros.length?' ⚠️ '+erros.join(' · '):''}`);
  }catch(e){console.warn('[Remodelagem v163]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando163=false;}
 }
 // ------------------------------------------------------------ v164: Cidade Baixa feita da imagem de IA (casas com terraço = 2º andar, escadas de fora)
 let feito164=false,rodando164=false,tent164=0;
 async function montar164(forcar=false){
  if(forcar===true){feito164=false;tent164=0;}else forcar=false;
  if(feito164||rodando164||!ehMestre())return;
  const api=win.mesaMapasV110_,mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens||!win.mesaComerciantes?.novo)return;
  const flag=D('configuracoes/cidadeBaixaIAV164');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito164=true;return;}}catch(_){return;}
  if(!forcar&&mapas.some(m=>m.cidadeBaixaV173)){feito164=true;return;} // v173: a Cidade Baixa já é o mapa das ruas
  if(!forcar&&++tent164>2){feito164=true;return;}
  rodando164=true;const E=CIDADE_BAIXA,id=E.id,feitos=[],erros=[],metaPatch={};
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   if(!mapas.some(m=>String(m.id)===id)){
    const st=gerarCidadeBaixaIA();await salvar(id,E.nome,st);
    await dep.setDoc(D('mapas/'+id),clean({larguraM:E.W,alturaM:E.H,estiloV129:'imagem',imagemV163:{src:E.arte,W:E.W,H:E.H},marcasV163:E.marcas,cidadeBaixaV164:true}),{merge:true});
    try{await dep.setDoc(D('combatesAtivos/marcasMapa_'+encodeURIComponent(id)),{json:JSON.stringify(E.marcas),mapId:id,em:Date.now()});}catch(_){}
    try{const m=(dep.mapas?.()||[]).find(x=>String(x.id)===id);if(m)Object.assign(m,{larguraM:E.W,alturaM:E.H,imagemV163:{src:E.arte,W:E.W,H:E.H},marcasV163:E.marcas});}catch(_){}
    feitos.push('mapa');
    for(const v of E.vendedores){try{const tid=await win.mesaComerciantes.novo(id,+(v.x*28/E.W).toFixed(3),+(v.y*14/E.H).toFixed(3),{ambulante:false,especie:v.especie});metaPatch[tid]={ambulante:false,lojaV161:v.id,lojaNome:v.loja.nome,loja:{ramos:v.loja.ramos,nome:v.loja.nome,incluir:[],excluir:[],militares:false}};}catch(e){erros.push(v.id+': '+(e?.message||e));}}
   }
   if(Object.keys(metaPatch).length)await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:metaPatch}),{merge:true});
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito164=true;
   toast(`🏘️ Mapa novo: "${E.nome}" — 63 casas com terraço (2º andar: suba pelas escadas de fora com 🪜), rochas, riacho, toldos por cima de quem passa e uma feira com 6 vendedores. No 🖌️ você corrige as marcas e cria o interior de cada casa (🏠).${erros.length?' ⚠️ '+erros.join(' · '):''}`);
  }catch(e){console.warn('[Remodelagem v164]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando164=false;}
 }
 // ------------------------------------------------------------ v165: o Portão da imagem de IA passa a SER o Portão de Véspera (cenario_c001)
 // Mesmo id: cenários, ligações, pedágio e quem já estava lá continuam valendo. O mapa separado "imagem IA" deixa de existir
 // (a cena dele, com as correções feitas no 🖌️, vira a cena do Portão). Cópia de segurança do Portão pintado em backup*_v165.
 let feito165=false,rodando165=false,tent165=0;
 async function montar165(forcar=false){
  if(forcar===true){feito165=false;tent165=0;}else forcar=false;
  if(feito165||rodando165||!ehMestre())return;
  if(rodando167&&!forcar)return; // v167: a conferência está cuidando
  const api=win.mesaMapasV110_,mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens)return;
  const flag=D('configuracoes/portaoTrocaV165');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito165=true;return;}}catch(_){return;}
  const ID='cenario_c001',IA=PORTAO_IA.id,E=PORTAO_IA;
  if(!mapas.some(m=>String(m.id)===ID))return;
  try{const f3=await dep.getDoc(D('configuracoes/portaoIAV163'));if(!f3.exists()||!f3.data()?.em)return;}catch(_){return;} // espera o mapa IA ficar pronto
  if(!forcar&&++tent165>3){feito165=true;return;}
  rodando165=true;const feitos=[],erros=[];
  const dec=t=>decodeURIComponent(String(t.id||'')),toks=id=>(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===id);
  const N=p=>({x:+(p.x*28/E.W).toFixed(3),y:+(p.y*14/E.H).toFixed(3)});
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   // cópia de segurança do Portão atual
   try{const m=await dep.getDoc(D('mapas/'+ID));if(m.exists())await dep.setDoc(D('combatesAtivos/backupMapa_'+ID+'_v165'),clean({em:new Date().toISOString(),mapa:m.data()}));}catch(e){erros.push('backup mapa: '+(e?.message||e));}
   try{const c=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+ID));if(c.exists()&&JSON.stringify(c.data()).length<900000)await dep.setDoc(D('combatesAtivos/backupCena_'+ID+'_v165'),clean({em:new Date().toISOString(),cena:c.data()}));}catch(e){erros.push('backup cena: '+(e?.message||e));}
   // cena: a do mapa "imagem IA" (com as correções do mestre), ou a gerada
   const regIA=mapas.find(m=>String(m.id)===IA)||{};let cenaIA=null;
   try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(IA)));if(s.exists())cenaIA=s.data();}catch(_){}
   const st=gerarPortaoIA(),nome=mapas.find(m=>String(m.id)===ID)?.nome||'Portão de Véspera';
   const cena=await salvar(ID,nome,{...st,name:nome},c=>cenaIA?{...cenaIA,mapId:ID}:c);
   const portaoN=regIA.portaoN?.x?regIA.portaoN:portaoNIA(E);
   const extra={larguraM:E.W,alturaM:E.H,portaoN,portaoV138:true,entradaV161:false,portaoV165:true,estiloV129:'imagem',imagemV163:regIA.imagemV163||{src:E.arte,W:E.W,H:E.H},marcasV163:regIA.marcasV163||E.marcas};
   await dep.setDoc(D('mapas/'+ID),clean(extra),{merge:true});
   try{const m=(dep.mapas?.()||[]).find(x=>String(x.id)===ID);if(m)Object.assign(m,extra);}catch(_){}
   try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));if(sh.exists()&&String(sh.data()?.mapId||'')===ID)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta'),{larguraM:E.W,alturaM:E.H},{merge:true});}catch(_){}
   feitos.push('mapa trocado');
   // gente: o Denzel de verdade vai para o portão novo; vendedores do mapa IA passam para cá; comerciantes e dragões do portão pintado saem
   const denOrig=toks(ID).find(t=>dec(t)==='syncnpc:guarda_do_portao_1');
   for(const t of toks(ID)){const d=dec(t);
    if(/^syncnpc:comerciante_generico_/.test(d)||/de carga/i.test(String(t.nome||'')))try{await dep.deleteDoc(D(POS+'/'+t.id));}catch(e){erros.push('tirar '+d+': '+(e?.message||e));}}
   for(const t of toks(IA)){const d=dec(t);
    try{if(denOrig&&/^syncnpc:guarda_do_portao_1~/.test(d)&&/denzel/i.test(String(t.nome||''))){await dep.deleteDoc(D(POS+'/'+t.id));continue;}
     await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+t.id),sn=await tx.get(r);if(!sn.exists())return;tx.set(r,{...sn.data(),mapaId:ID,revision:Number(sn.data().revision||0)+1});});}catch(e){erros.push('mover '+d+': '+(e?.message||e));}}
   // quem ficou (jogadores, guardas) sai de dentro das paredes novas
   try{await acomodar(ID,cena,E.W,E.H);}catch(e){erros.push('acomodar: '+(e?.message||e));}
   if(denOrig)try{await moverToken(denOrig,N(E.denzel),{facing:Math.PI/2});}catch(e){erros.push('Denzel: '+(e?.message||e));}
   // saídas: as do Portão vão para os lugares novos; as cópias feitas para o mapa IA saem
   try{const ls=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));if(ls.exists()){const v=ls.data()||{};
    const ligs=(v.ligacoes||[]).filter(l=>!/_ia163$/.test(String(l.id||''))&&String(l?.a?.mapa)!==IA&&String(l?.b?.mapa)!==IA).map(l=>{const lado=String(l?.a?.mapa)===ID?'a':String(l?.b?.mapa)===ID?'b':'';if(!lado)return l;
     const outro=String(l[lado==='a'?'b':'a']?.mapa||''),alvo=/espaco|porto/.test(outro)?{x:14.5,y:47.3}:{x:E.gateX,y:.9};return {...l,[lado]:{...l[lado],...N(alvo)}};});
    await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:ligs,atualizadoEm:Date.now()}));feitos.push('saídas');}}catch(e){erros.push('saídas: '+(e?.message||e));}
   // o mapa separado deixa de existir
   try{await dep.deleteDoc(D('mapas/'+IA));await dep.deleteDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(IA)));const arr=dep.mapas?.();const i=arr?.findIndex(x=>String(x.id)===IA);if(arr&&i>=0)arr.splice(i,1);feitos.push('mapa IA separado retirado');}catch(e){erros.push('retirar IA: '+(e?.message||e));}
   try{win.labAtualizarSelectMapas_?.();}catch(_){}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito165=true;
   try{await win.publicarComerciantesV141_?.();}catch(_){}
   toast(`🏜️ O Portão de Véspera agora é o da imagem de IA (o mesmo lugar no jogo: cenário, saídas e pedágio continuam). Denzel no portão, 7 vendedores (água, comida, mantimentos, peças, roupas, remédios, armas). Cópia do portão pintado guardada.${erros.length?' ⚠️ '+erros.join(' · '):''}`);
   if(String(ctl()?.mapaAtual?.()||'')===ID)try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v165]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando165=false;}
 }
 // ------------------------------------------------------------ v166: Portão de Véspera com a imagem NOVA da IA (margem em volta, casas inteiras, terraços)
 let feito166=false,rodando166=false,tent166=0;
 async function montar166(forcar=false){
  if(forcar===true){feito166=false;tent166=0;}else forcar=false;
  if(feito166||rodando166||!ehMestre())return;
  if(rodando167&&!forcar)return; // v167: a conferência está cuidando
  const api=win.mesaMapasV110_,mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens||!win.mesaComerciantes?.novo)return;
  const flag=D('configuracoes/portaoNovoV166');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito166=true;return;}}catch(_){return;}
  const ID='cenario_c001',E=PORTAO_IA2;
  if(!mapas.some(m=>String(m.id)===ID))return;
  if(!forcar)try{const f5=await dep.getDoc(D('configuracoes/portaoTrocaV165'));if(!f5.exists()||!f5.data()?.em)return;}catch(_){return;} // depois da troca da v165
  if(!forcar&&++tent166>3){feito166=true;return;}
  rodando166=true;const feitos=[],erros=[],metaPatch={};
  const dec=t=>decodeURIComponent(String(t.id||'')),toks=()=>(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===ID);
  const N=p=>({x:+(p.x*28/E.W).toFixed(3),y:+(p.y*14/E.H).toFixed(3)});
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   try{const c=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+ID));if(c.exists()&&JSON.stringify(c.data()).length<900000)await dep.setDoc(D('combatesAtivos/backupCena_'+ID+'_v166'),clean({em:new Date().toISOString(),cena:c.data()}));}catch(_){}
   const st=gerarPortaoIA2(),nome=mapas.find(m=>String(m.id)===ID)?.nome||E.nome;
   const cena=await salvar(ID,nome,{...st,name:nome},c=>({...c,objects:(c.objects||[]).map(o=>/^port[aã]o de v[eé]spera$/i.test(String(o.nome||''))?{...o,estadoInterativo:{...(o.estadoInterativo||{}),trancado:true,aberto:false,dificuldade:'dificil'}}:o)}));
   const extra={larguraM:E.W,alturaM:E.H,portaoN:st.portaoN,portaoV138:true,portaoV165:true,portaoV166:true,estiloV129:'imagem',imagemV163:{src:E.arte,W:E.W,H:E.H}};
   await dep.setDoc(D('mapas/'+ID),clean(extra),{merge:true});
   await dep.setDoc(D('combatesAtivos/marcasMapa_'+encodeURIComponent(ID)),{json:JSON.stringify(E.marcas),mapId:ID,em:Date.now()});
   try{const m=(dep.mapas?.()||[]).find(x=>String(x.id)===ID);if(m)Object.assign(m,extra,{marcasV163:E.marcas});}catch(_){}
   try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));if(sh.exists()&&String(sh.data()?.mapId||'')===ID)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta'),{larguraM:E.W,alturaM:E.H},{merge:true});}catch(_){}
   feitos.push('imagem nova');
   // todo mundo sai de dentro das paredes novas; depois Denzel e cada vendedor vão para o seu lugar
   try{await acomodar(ID,cena,E.W,E.H);}catch(e){erros.push('acomodar: '+(e?.message||e));}
   let meta={};try{const sm=await dep.getDoc(D('combatesAtivos/mesaComerciantes'));if(sm.exists())meta=sm.data()?.nomes||{};}catch(_){}
   const usados=new Set();
   for(const v of E.vendedores){
    const t=toks().find(x=>!usados.has(x.id)&&(meta[x.id]?.lojaV161===v.id||meta[encodeURIComponent(dec(x))]?.lojaV161===v.id));
    try{if(t){usados.add(t.id);await moverToken(t,N(v),{facing:Math.PI/2});}
     else{const tid=await win.mesaComerciantes.novo(ID,N(v).x,N(v).y,{ambulante:false,especie:v.especie});usados.add(tid);metaPatch[tid]={ambulante:false,lojaV161:v.id,lojaNome:v.loja.nome,loja:{ramos:v.loja.ramos,nome:v.loja.nome,incluir:[],excluir:[],militares:false}};}}catch(e){erros.push(v.id+': '+(e?.message||e));}
   }
   // v167: sobras do portão pintado (dragões de carga, comerciantes sem banca) saem
   for(const t of toks()){const d=dec(t);if(usados.has(t.id))continue;if(/de carga/i.test(String(t.nome||''))||/^syncnpc:comerciante_generico_/.test(d))try{await dep.deleteDoc(D(POS+'/'+t.id));}catch(_){}}
   const den=toks().find(t=>dec(t)==='syncnpc:guarda_do_portao_1')||toks().find(t=>/^syncnpc:guarda_do_portao_1~/.test(dec(t))&&/denzel/i.test(String(t.nome||'')));
   if(den)try{await moverToken(den,N(E.denzel),{facing:Math.PI/2});}catch(e){erros.push('Denzel: '+(e?.message||e));}
   if(Object.keys(metaPatch).length)await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:metaPatch}),{merge:true});
   // saídas nos lugares novos
   try{const ls=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));if(ls.exists()){const v=ls.data()||{};
    const ligs=(v.ligacoes||[]).map(l=>{const lado=String(l?.a?.mapa)===ID?'a':String(l?.b?.mapa)===ID?'b':'';if(!lado||l.interiorV164)return l;const outro=String(l[lado==='a'?'b':'a']?.mapa||'');
     return {...l,[lado]:{...l[lado],...N(/espaco|porto/.test(outro)?E.saidas.espacoporto:E.saidas.cidade)}};});
    await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:ligs,atualizadoEm:Date.now()}));feitos.push('saídas');}}catch(e){erros.push('saídas: '+(e?.message||e));}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito166=true;
   try{await win.publicarComerciantesV141_?.();}catch(_){}
   toast(`🏜️ Portão de Véspera com a imagem nova: margem em volta, casas inteiras com terraço (🪜 escadas de fora), Denzel no portão e os 7 vendedores nos lugares. No 🖌️ use "🧱 Ver colisão" para ver o que barra a passagem.${erros.length?' ⚠️ '+erros.join(' · '):''}`);
   if(String(ctl()?.mapaAtual?.()||'')===ID)try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v166]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando166=false;}
 }
 // ------------------------------------------------------------ v167: conferência a cada abertura (mestre). O Portão tem de estar com a imagem nova
 // e o mapa separado "imagem IA" não pode mais existir. Se algo ficou para trás (troca que falhou), refaz. Resultado em configuracoes/portaoCheckV167.
 let feito167=false,rodando167=false;
 async function montar167(){
  if(feito167||rodando167||!ehMestre())return;
  const mapas=dep.mapas?.()||[];if(!win.mesaMapasV110_?.salvar||!mapas.length||!ctl()?.todosTokens||!win.mesaComerciantes?.novo)return;
  if(!mapas.some(m=>String(m.id)==='cenario_c001'))return;
  if(rodando165||rodando166)return;
  rodando167=true;const feitos=[],erros=[],ID='cenario_c001',IA=PORTAO_IA.id,dec=t=>decodeURIComponent(String(t.id||''));
  try{
   // a troca antiga (v165) não roda mais depois daqui: esta conferência faz o trabalho dela
   try{const f5=await dep.getDoc(D('configuracoes/portaoTrocaV165'));if(!f5.exists()||!f5.data()?.em){await dep.setDoc(D('configuracoes/portaoTrocaV165'),{em:new Date().toISOString(),feitoPelaV167:true});feito165=true;}}catch(_){}
   let cena=null;try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+ID));if(s.exists())cena=s.data();}catch(_){}
   const fundo=(cena?.objects||[]).filter(o=>o?.oficinaElement?.fundoV161||/^pintura do ch[aã]o$/i.test(String(o?.nome||''))).map(o=>String(o?.oficinaElement?.src||o?.imagem||''));
   const certo=fundo.some(f=>/portao-ia-2/.test(f))&&fundo.length===1;
   // o mapa precisa saber onde fica o portão (o pedágio usa isso para saber quem está dentro e quem está fora)
   if(certo){const reg=(dep.mapas?.()||[]).find(x=>String(x.id)===ID),pn=gerarPortaoIA2().portaoN;if(!reg?.portaoN||Math.abs(Number(reg.portaoN.y)-pn.y)>.05||Math.abs(Number(reg.portaoN.x)-pn.x)>.05){await dep.setDoc(D('mapas/'+ID),clean({portaoN:pn,larguraM:32,alturaM:48}),{merge:true});if(reg)reg.portaoN=pn;feitos.push('posição do portão corrigida');}}
   if(!certo){feitos.push('portão refeito (fundo era: '+(fundo.join(', ')||'nenhum')+')');await montar166(true);if(!feito166)erros.push('a troca da imagem não terminou');}
   if((dep.mapas?.()||[]).some(m=>String(m.id)===IA)){
    for(const t of (ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===IA)){const d=dec(t);
     try{if(/^sync/.test(d))await dep.deleteDoc(D(POS+'/'+t.id));else{await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+t.id),sn=await tx.get(r);if(!sn.exists())return;tx.set(r,{...sn.data(),mapaId:ID,x:14.2,y:3,revision:Number(sn.data().revision||0)+1});});feitos.push('levou '+String(t.nome||d)+' para o Portão');}}catch(e){erros.push('token '+d+': '+(e?.message||e));}}
    try{await dep.deleteDoc(D('mapas/'+IA));await dep.deleteDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(IA)));const arr=dep.mapas?.(),i=arr?.findIndex(x=>String(x.id)===IA);if(arr&&i>=0)arr.splice(i,1);try{win.labAtualizarSelectMapas_?.();}catch(_){}feitos.push('mapa "imagem IA" retirado');}catch(e){erros.push('retirar IA: '+(e?.message||e));}
    try{const ls=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));if(ls.exists()){const v=ls.data()||{};const ligs=(v.ligacoes||[]).filter(l=>String(l?.a?.mapa)!==IA&&String(l?.b?.mapa)!==IA);if(ligs.length!==(v.ligacoes||[]).length)await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:ligs,atualizadoEm:Date.now()}));}}catch(_){}
   }
   // v169: a mesa ainda aberta no mapa "imagem IA" (que não existe mais) → abre o Portão de Véspera de verdade
   try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));const ativo=String(sh.exists()?sh.data()?.mapId||'':'');
    if(ativo===IA||(ativo&&!(dep.mapas?.()||[]).some(m=>String(m.id)===ativo)&&/portao|v16\d_/.test(ativo))){await ctl()?.openMap?.(ID);feitos.push('mesa aberta no Portão de Véspera (estava no mapa antigo)');}}catch(e){erros.push('abrir o Portão: '+(e?.message||e));}
   // o registro do mestre (mesa-fixos) não pode trazer de volta paredes/fundos do Marcador neste mapa
   try{const r=await dep.getDoc(D('combatesAtivos/mesaObjetosMestre'));const reg=r.exists()?r.data()?.mapas?.[ID]:null;
    if(reg){const limpo={};let n=0;for(const [k,v] of Object.entries(reg)){const id=String(v?.obj?.id||v?.id||'');if(/mk163|:gen16[1-9]\d?:|gen1611|gen1621/.test(id)||/^pintura do ch[aã]o$|^parede$|^obst[aá]culo$|^beirada|^terra[cç]o$|^escada do terra/i.test(String(v?.nome||''))){limpo[k]={k,apagado:true,ts:Date.now()};n++;}}
     if(n){await dep.setDoc(D('combatesAtivos/mesaObjetosMestre'),clean({mapas:{[ID]:limpo},atualizadoEm:Date.now()}),{merge:true});feitos.push(n+' registro(s) antigos de paredes/fundo limpos');}}}catch(e){erros.push('registro: '+(e?.message||e));}
   await dep.setDoc(D('configuracoes/portaoCheckV167'),clean({em:new Date().toISOString(),feitos,erros}));
   if(feitos.length||erros.length)toast(`🏜️ Conferência do Portão: ${feitos.join(' · ')||'tudo certo'}${erros.length?' ⚠️ '+erros.join(' · '):''}`,20000);
   feito167=true;
  }catch(e){console.warn('[Remodelagem v167]',e);try{await dep.setDoc(D('configuracoes/portaoCheckV167'),{em:new Date().toISOString(),erro:String(e?.message||e)});}catch(_){}toast('⚠️ Conferência do Portão falhou: '+(e?.message||e),20000);feito167=true;}
  finally{rodando167=false;}
 }
 // ------------------------------------------------------------ v170: Ruas Escavadas decoradas com as peças das imagens (pasta arte-fonte/imagens-ia)
 // Plantas soltas no meio da rua saem; arbustos, barris, caixas, sucata, varais, tapetes e fontes entram sem fechar passagem.
 let feito170=false,rodando170=false,tent170=0;
 async function montar170(forcar=false){
  if(forcar===true){feito170=false;tent170=0;}else forcar=false;
  if(feito170||rodando170||!ehMestre())return;
  const mapas=dep.mapas?.()||[],objs=dep.objetos?.()||[];if(!mapas.length||!objs.some(o=>String(o.id)==='ia_barril'))return; // espera as peças estarem no banco
  const flag=D('configuracoes/ruasDecoV170');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito170=true;return;}}catch(_){return;}
  const ruas=mapas.find(m=>String(m.id)==='cenario_c002')||mapas.find(m=>m.ruasV138||/ruas escavadas/i.test(String(m.nome||'')));if(!ruas||ruas.cidadeBaixaV173){feito170=true;return;}
  if(!forcar&&++tent170>3){feito170=true;return;}
  rodando170=true;const id=String(ruas.id);
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   const arq=D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id));const sn=await dep.getDoc(arq);if(!sn.exists())throw Error('cena das Ruas não encontrada');
   const cena=sn.data(),W=Number(ruas.larguraM)||56,H=Number(ruas.alturaM)||28;
   try{await dep.setDoc(D('combatesAtivos/backupCena_'+id+'_v170'),clean({em:new Date().toISOString(),cena}));}catch(_){}
   const tirar=o=>!!o.decoV170||plantaPassavel(o);
   const base={...cena,objects:(cena.objects||[]).filter(o=>!tirar(o))},tirados=(cena.objects||[]).length-base.objects.length;
   const pracas=(cena.objects||[]).filter(o=>/^pracinha$/i.test(String(o.nome||''))).map(o=>{const w=Number(o.larguraM)||4,h=Number(o.alturaM)||3;return {x:Number(o.x)*W/28-w/2,y:Number(o.y)*H/14-h/2,w,h};});
   let saidas=[];try{const ls=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));saidas=((ls.exists()?ls.data()?.ligacoes:[])||[]).flatMap(l=>[l.a,l.b]).filter(e=>String(e?.mapa)===id).map(e=>({x:Number(e.x)*W/28-1,y:Number(e.y)*H/14-1,w:2,h:2}));}catch(_){}
   const pedidos=[
    ...pracas.flatMap((p,i)=>[{tag:'praca'+i,ids:[i%2?'ia_estatua':'ia_fonte'],qtd:1,area:{x:p.x+p.w/2-1.8,y:p.y+p.h/2-1.8,w:3.6,h:3.6},escala:.85},
     {tag:'praca'+i,ids:['ia_mesa_mercado','ia_barraca_vermelha','ia_barraca_azul','ia_barraca_creme','ia_barraca_verde','ia_banco_madeira'],qtd:2,area:{x:p.x-1,y:p.y-1,w:p.w+2,h:p.h+2},escala:.8}]),
    {tag:'carga',ids:['ia_barril','ia_barris','ia_caixa','ia_caixas_agrupadas','ia_sucata','ia_secador_panos'],qtd:16,parede:true,escala:.8},
    {tag:'planta',ids:['ia_arbusto','ia_arbusto','ia_palmeira_pequena'],qtd:14,parede:true,escala:.75},
    {tag:'varal',ids:['ia_varal','ia_toldo_creme','ia_toldo_azul','ia_toldo_vermelho'],qtd:7,girar:true,escala:.7},
    {tag:'chao',ids:['ia_tapetes','ia_sujeira_pedrinhas'],qtd:10,girar:true,escala:.8}
   ];
   const novos=decorar(base,{W,H,pedidos,semente:1700,evitar:saidas});
   const nova={...base,objects:[...base.objects,...novos],editorRevision:Number(cena.editorRevision||0)+1};
   await dep.setDoc(arq,clean(nova));
   try{const s2=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'));if(s2.exists()&&String(s2.data()?.mapId||'')===id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'),clean(nova));}catch(_){}
   await dep.setDoc(flag,{em:new Date().toISOString(),tirados,postos:novos.length});feito170=true;
   toast(`🧱 Ruas Escavadas decoradas com as peças novas: ${novos.length} (fontes e estátuas nas pracinhas, barracas, barris, caixas, sucata, arbustos, varais, tapetes). ${tirados} planta(s) que atrapalhavam a passagem saíram. Plantas pequenas não barram mais ninguém.`);
   if(String(ctl()?.mapaAtual?.()||'')===id)try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v170]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando170=false;}
 }
 // ------------------------------------------------------------ v171: veículos e naves estacionados (decoração, no tamanho real) + concessionária e estaleiro
 let feito171=false,rodando171=false,tent171=0;
 async function montar171(forcar=false){
  if(forcar===true){feito171=false;tent171=0;}else forcar=false;
  if(feito171||rodando171||!ehMestre())return;
  const mapas=dep.mapas?.()||[],objs=dep.objetos?.()||[];if(!mapas.length||!objs.some(o=>String(o.id)==='ia_veiculo_sedan')||!win.mesaComerciantes?.novo)return;
  if(rodando172)return;
  const flag=D('configuracoes/veiculosDecoV171');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito171=true;return;}}catch(_){return;}
  try{const f2=await dep.getDoc(D('configuracoes/navesV172'));if(!f2.exists()||!f2.data()?.em)return;}catch(_){return;} // v172: primeiro a troca das naves (as duas mexem no espaço-porto)
  if(!forcar&&++tent171>3){feito171=true;return;}
  rodando171=true;const feitos=[],erros=[],metaPatch={};
  const CARROS=['ia_veiculo_sedan','ia_veiculo_coupe','ia_veiculo_hovercar','ia_veiculo_taxi_dourado','ia_veiculo_carro_turquesa','ia_veiculo_carro_esportivo','ia_veiculo_furgao','ia_veiculo_picape','ia_veiculo_limousine','ia_veiculo_rover','ia_veiculo_explorador'];
  const MOTOS=['ia_veiculo_moto_perola','ia_veiculo_moto_vermelha','ia_veiculo_moto_violeta','ia_veiculo_scooter_turquesa'];
  const NAVES_P=['ia_veiculo_nave_interceptor','ia_veiculo_caca','ia_veiculo_batedora','ia_veiculo_nave_batedora_azul','ia_veiculo_nave_disco_dourado','ia_veiculo_disco','ia_veiculo_nave_shuttle_turquesa','ia_veiculo_shuttle'];
  const NAVES_G=['ia_veiculo_cargueiro_leve','ia_veiculo_nave_prata_vermelha','ia_veiculo_exploracao','ia_veiculo_nave_exploradora_azul','ia_veiculo_nave_iate_violeta','ia_veiculo_transporte','ia_veiculo_cargueiro_pesado','ia_veiculo_nave_cargueiro_dourado'];
  const planos=[
   {id:'v138_espacoporto',pedidos:[{tag:'navesG',ids:NAVES_G,qtd:2},{tag:'navesP',ids:NAVES_P,qtd:4,girar:true},{tag:'carros',ids:CARROS,qtd:9,girar:true},{tag:'motos',ids:MOTOS,qtd:5,girar:true}],
    lojas:[{perto:'navesP',especie:'grey',loja:{ramos:['naves'],nome:'Estaleiro de Véspera'}},{perto:'carros',especie:'robo',loja:{ramos:['veiculos'],nome:'Concessionária do espaço-porto'}}]},
   {id:'v137_grande_feira',pedidos:[{tag:'motos',ids:MOTOS,qtd:6,girar:true},{tag:'carros',ids:CARROS,qtd:5,girar:true}],
    lojas:[{perto:'motos',especie:'humano',loja:{ramos:['veiculos'],nome:'Motos e carros da feira'}}]}
  ];
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   for(const pl of planos){const m=mapas.find(x=>String(x.id)===pl.id);if(!m)continue;
    try{const arq=D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(pl.id)),sn=await dep.getDoc(arq);if(!sn.exists())continue;
     const cena=sn.data(),W=Number(m.larguraM)||28,H=Number(m.alturaM)||14;
     try{await dep.setDoc(D('combatesAtivos/backupCena_'+pl.id+'_v171'),clean({em:new Date().toISOString(),cena}));}catch(_){}
     const base={...cena,objects:(cena.objects||[]).filter(o=>!String(o.decoV170||'').startsWith('v171'))};
     let saidas=[];try{const ls=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));saidas=((ls.exists()?ls.data()?.ligacoes:[])||[]).flatMap(l=>[l.a,l.b]).filter(e=>String(e?.mapa)===pl.id).map(e=>({x:Number(e.x)*W/28-2,y:Number(e.y)*H/14-2,w:4,h:4}));}catch(_){}
     const toks=(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===pl.id).map(t=>({x:Number(t.x)*W/28-.6,y:Number(t.y)*H/14-.6,w:1.2,h:1.2}));
     const novos=decorar(base,{W,H,pedidos:pl.pedidos.map(p=>({...p,tag:'v171'+p.tag})),semente:1710+pl.id.length,evitar:[...saidas,...toks]});
     const nova={...base,objects:[...base.objects,...novos],editorRevision:Number(cena.editorRevision||0)+1};
     await dep.setDoc(arq,clean(nova));
     try{const s2=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'));if(s2.exists()&&String(s2.data()?.mapId||'')===pl.id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'),clean(nova));}catch(_){}
     feitos.push(`${m.nome||pl.id}: ${novos.length} veículos/naves`);
     for(const L of pl.lojas){const v=novos.find(o=>o.decoV170==='v171'+L.perto)||novos.find(o=>/v171naves/.test(String(o.decoV170)))||novos[0];if(!v)continue;
      const p0=livrePerto(nova.objects,v.x+(v.larguraM/2+1.2)*28/W,v.y,W,H,.6);
      try{const tid=await win.mesaComerciantes.novo(pl.id,+p0.x.toFixed(3),+p0.y.toFixed(3),{ambulante:false,especie:L.especie});metaPatch[tid]={ambulante:false,lojaV161:L.loja.ramos[0],lojaNome:L.loja.nome,loja:{...L.loja,incluir:[],excluir:[],militares:false}};feitos.push(L.loja.nome);}catch(e){erros.push(L.loja.nome+': '+(e?.message||e));}}
    }catch(e){erros.push(pl.id+': '+(e?.message||e));}}
   if(Object.keys(metaPatch).length)await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:metaPatch}),{merge:true});
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito171=true;
   toast(`🚗🚀 Veículos e naves no tamanho real: ${feitos.join(' · ')}. Clique no vendedor da concessionária/estaleiro para comprar (o mestre entrega o veículo na ficha).${erros.length?' ⚠️ '+erros.join(' · '):''}`);
   const atual=String(ctl()?.mapaAtual?.()||'');if(planos.some(p=>p.id===atual))try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v171]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando171=false;}
 }
 // ------------------------------------------------------------ v172: veículos/naves dos cenários com as imagens novas + a nave do grupo (Sérgio Leone)
 let feito172=false,rodando172=false,tent172=0;
 async function montar172(forcar=false){
  if(forcar===true){feito172=false;tent172=0;}else forcar=false;
  if(feito172||rodando172||!ehMestre())return;
  const mapas=dep.mapas?.()||[],objs=dep.objetos?.()||[];if(!mapas.length||!objs.some(o=>String(o.id)==='ia_veiculo_sedan'))return;
  const flag=D('configuracoes/navesV172');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito172=true;return;}}catch(_){return;}
  if(!forcar&&++tent172>3){feito172=true;return;}
  rodando172=true;const feitos=[],erros=[];const modelos=new Map(objs.map(o=>[String(o.id),o]));
  const gravar=async(id,nova)=>{const arq=D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id));await dep.setDoc(arq,clean(nova));
   try{const s2=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'));if(s2.exists()&&String(s2.data()?.mapId||'')===id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'),clean(nova));}catch(_){}};
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   // 1) carros e naves antigos → imagens novas, em todos os mapas
   for(const m of mapas){const id=String(m.id);if(!id||id.startsWith('__'))continue;
    try{const sn=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)));if(!sn.exists())continue;const cena=sn.data();
     const r=trocarVeiculos(cena);if(!r.trocados)continue;
     try{await dep.setDoc(D('combatesAtivos/backupCena_'+id+'_v172'),clean({em:new Date().toISOString(),cena}));}catch(_){}
     await gravar(id,{...r.cena,editorRevision:Number(cena.editorRevision||0)+1});feitos.push(`${m.nome||id}: ${r.trocados}`);}catch(e){erros.push(id+': '+(e?.message||e));}}
   // 2) a nave do grupo, por dentro, no espaço-porto
   const porto=mapas.find(m=>String(m.id)==='v138_espacoporto');
   if(porto){const id='v138_espacoporto',W=Number(porto.larguraM)||84,H=Number(porto.alturaM)||42;
    const sn=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+id));
    if(sn.exists()){const cena=sn.data(),teto=(cena.objects||[]).find(o=>/^telhado · nave do grupo$/i.test(String(o.nome||'')));
     if(teto){const cx=Number(teto.x)*W/28,cy=Number(teto.y)*H/14,hw=Math.max(9,(Number(teto.larguraM)||18)/2),hh=Math.max(6.5,(Number(teto.alturaM)||10.5)/2);
      const dentro=o=>{const x=Number(o.x)*W/28,y=Number(o.y)*H/14;return Math.abs(x-cx)<=hw+.2&&Math.abs(y-cy)<=hh+.2;};
      const fica=o=>/plataforma|^rampa da nave$/i.test(String(o.nome||''))||(Number(o.larguraM)||0)*(Number(o.alturaM)||0)>200||!!o.decoV170;
      const resto=(cena.objects||[]).filter(o=>!o.naveGrupoV172&&!(dentro(o)&&!fica(o)));
      const nova={...cena,objects:[...resto,...naveDoGrupo(cx,cy,{W,H,modelos})],editorRevision:Number(cena.editorRevision||0)+1};
      await gravar(id,nova);feitos.push('nave do grupo refeita por dentro (beliches, cozinha, banheiro, arsenal, cabine com armas)');
      // ninguém fica preso dentro de uma parede nova
      try{await acomodar(id,nova,W,H);}catch(_){}}}}
   // 3) a nave na ficha: modelo no Banco → Naves e nave possuída pelo grupo (dono: Sérgio Leone; porão compartilhado)
   try{
    const abs=s=>s?new URL(s,win.location.href).href:'';const modelo={...MODELO_NAVE_GRUPO,imagem:abs(MODELO_NAVE_GRUPO.imagem)};
    await dep.setDoc(D('naves/'+modelo.id),clean(modelo),{merge:true});
    const ps=[];const q=await dep.getDocs(dep.collection(dep.db,'personagens'));q.forEach(d=>ps.push({id:d.id,...d.data()}));
    const grupo=ps.filter(c=>!c.testeV138&&String(c.tipo||'pc').toLowerCase()!=='npc'&&c.ativoNaCampanha!==false&&(c.fichaAprovada||c.criacaoConcluida||c.ativoNaCampanha));
    const dono=grupo.find(c=>/sergio leone/.test(sem(c.nome)))||ps.find(c=>/sergio leone/.test(sem(c.nome)));
    const membros=[...new Map([...(dono?[dono]:[]),...grupo].map(c=>[String(c.id),c])).values()];
    const vinculos=membros.map(c=>({personagemId:String(c.id),personagemNome:String(c.nome||''),usuarioUid:String(c.dono||''),papel:dono&&String(c.id)===String(dono.id)?'Capitão (dono)':'Tripulante'}));
    const naves=[];const qn=await dep.getDocs(dep.collection(dep.db,'navesPossuidas'));qn.forEach(d=>naves.push({id:d.id,...d.data()}));
    const ja=naves.find(n=>n.naveDoGrupoV172)||naves.find(n=>/grupo/.test(sem(n.nomeIndividual))||(dono&&(n.vinculos||[]).some(v=>String(v.personagemId)===String(dono.id))));
    const base={modeloId:modelo.id,modelo,vinculos,usuariosPermitidos:[...new Set(vinculos.map(v=>v.usuarioUid).filter(Boolean))],naveDoGrupoV172:true,donoPersonagemId:dono?String(dono.id):'',mapaV172:'v138_espacoporto',atualizadoEm:new Date().toISOString()};
    if(ja){await dep.setDoc(D('navesPossuidas/'+ja.id),clean({...base,nomeIndividual:ja.nomeIndividual||'Nave do grupo'}),{merge:true});feitos.push(`nave do grupo atualizada na ficha (${vinculos.length} tripulantes)`);}
    else{const nid='ship_grupo_'+Date.now().toString(36);await dep.setDoc(D('navesPossuidas/'+nid),clean({id:nid,...base,nomeIndividual:'Nave do grupo',cascoAtual:modelo.cascoMax,escudoAtual:modelo.escudoMax,energiaAtual:modelo.energiaMax,combustivelAtual:modelo.combustivelMax,estado:'Operacional',cargaItens:Array(100).fill(null),criadoEm:new Date().toISOString()}));feitos.push(`nave do grupo na ficha (${vinculos.length} tripulantes)`);}
    if(!dono)erros.push('não achei o personagem "Sérgio Leone" — a nave ficou com o grupo sem dono marcado');
   }catch(e){erros.push('nave na ficha: '+(e?.message||e));}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito172=true;
   toast(`🚀 Veículos e naves dos cenários trocados pelas imagens novas (tamanho real). ${feitos.join(' · ')}${erros.length?' ⚠️ '+erros.join(' · '):''}`,20000);
   try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v172]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando172=false;}
 }

 // ------------------------------------------------------------ v173: a Cidade Baixa (imagem) passa a SER o mapa das ruas (cenario_c002), sem "IA" no nome,
 // com portas para quase todos os mapas da cidade. Mesmo id: cenário, saídas antigas e quem estava lá continuam valendo.
 let feito173=false,rodando173=false,tent173=0;
 async function montar173(forcar=false){
  if(forcar===true){feito173=false;tent173=0;}else forcar=false;
  if(feito173||rodando173||!ehMestre())return;
  if(rodando164||rodando167)return;
  const api=win.mesaMapasV110_,mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens)return;
  const ID='cenario_c002',IA=CIDADE_BAIXA.id,E=CIDADE_BAIXA;
  if(!mapas.some(m=>String(m.id)===ID)){feito173=true;return;}
  const flag=D('configuracoes/cidadeBaixaV173');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito173=true;return;}}catch(_){return;}
  if(!forcar&&++tent173>3){feito173=true;return;}
  rodando173=true;const feitos=[],erros=[],dec=t=>decodeURIComponent(String(t.id||''));
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   // cópia de segurança das Ruas Escavadas
   try{const m=await dep.getDoc(D('mapas/'+ID));if(m.exists()&&JSON.stringify(m.data()).length<900000)await dep.setDoc(D('combatesAtivos/backupMapa_'+ID+'_v173'),clean({em:new Date().toISOString(),mapa:m.data()}));}catch(e){erros.push('backup mapa: '+(e?.message||e));}
   try{const c=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+ID));if(c.exists()&&JSON.stringify(c.data()).length<900000)await dep.setDoc(D('combatesAtivos/backupCena_'+ID+'_v173'),clean({em:new Date().toISOString(),cena:c.data()}));}catch(e){erros.push('backup cena: '+(e?.message||e));}
   // o registro do mestre das Ruas não vale para a Cidade Baixa; o do mapa "imagem IA" passa para cá
   try{const r=await dep.getDoc(D('combatesAtivos/mesaObjetosMestre'));if(r.exists()){const v=r.data()||{},mp={...(v.mapas||{})};const velho=mp[ID];
    if(velho)await dep.setDoc(D('combatesAtivos/backupRegistro_'+ID+'_v173'),clean({em:new Date().toISOString(),reg:velho}));
    if(mp[IA])mp[ID]=mp[IA];else delete mp[ID];delete mp[IA];await dep.setDoc(D('combatesAtivos/mesaObjetosMestre'),clean({...v,mapas:mp}));}}catch(e){erros.push('registro: '+(e?.message||e));}
   // cena: a do mapa "imagem IA" (com as correções feitas no 🖌️), ou a gerada
   const regIA=mapas.find(m=>String(m.id)===IA)||{};let cenaIA=null;
   try{const sn=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(IA)));if(sn.exists())cenaIA=sn.data();}catch(_){}
   const st=gerarCidadeBaixaIA();
   const cena=await salvar(ID,NOME_V173,{...st,name:NOME_V173},c=>cenaIA?{...cenaIA,mapId:ID}:c);
   const extra={nome:NOME_V173,larguraM:E.W,alturaM:E.H,estiloV129:'imagem',imagemV163:regIA.imagemV163||{src:E.arte,W:E.W,H:E.H},marcasV163:regIA.marcasV163||E.marcas,cidadeBaixaV164:true,cidadeBaixaV173:true,ruasV138:false};
   await dep.setDoc(D('mapas/'+ID),clean(extra),{merge:true});
   try{const m=(dep.mapas?.()||[]).find(x=>String(x.id)===ID);if(m)Object.assign(m,extra);}catch(_){}
   try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));if(sh.exists()&&String(sh.data()?.mapId||'')===ID)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta'),{larguraM:E.W,alturaM:E.H,nome:NOME_V173},{merge:true});}catch(_){}
   // marcas do 🖌️
   try{const mk=await dep.getDoc(D('combatesAtivos/marcasMapa_'+encodeURIComponent(IA)));const json=mk.exists()?mk.data()?.json:JSON.stringify(regIA.marcasV163||E.marcas);
    await dep.setDoc(D('combatesAtivos/marcasMapa_'+ID),{json,mapId:ID,em:Date.now(),sincronizadoV167:true});}catch(e){erros.push('marcas: '+(e?.message||e));}
   feitos.push('Ruas Escavadas → '+NOME_V173);
   // gente: quem estava no mapa "imagem IA" (vendedores da feira) vem junto; quem estava nas Ruas sai de dentro das casas
   for(const t of (ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===IA))
    try{await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+t.id),sn=await tx.get(r);if(!sn.exists())return;tx.set(r,{...sn.data(),mapaId:ID,revision:Number(sn.data().revision||0)+1});});}catch(e){erros.push('mover '+dec(t)+': '+(e?.message||e));}
   try{for(const t of (ctl()?.todosTokens?.()||[]))if(String(t.mapaId||'')===IA)t.mapaId=ID;}catch(_){}
   // sem o mapa "imagem IA" (nunca foi criado): a feira ganha os vendedores aqui
   if(!regIA.id&&win.mesaComerciantes?.novo){const metaPatch={};
    for(const v of E.vendedores){try{const tid=await win.mesaComerciantes.novo(ID,+(v.x*28/E.W).toFixed(3),+(v.y*14/E.H).toFixed(3),{ambulante:false,especie:v.especie});metaPatch[tid]={ambulante:false,lojaV161:v.id,lojaNome:v.loja.nome,loja:{ramos:v.loja.ramos,nome:v.loja.nome,incluir:[],excluir:[],militares:false}};}catch(e){erros.push(v.id+': '+(e?.message||e));}}
    if(Object.keys(metaPatch).length){await dep.setDoc(D('combatesAtivos/mesaComerciantes'),clean({nomes:metaPatch}),{merge:true});feitos.push(Object.keys(metaPatch).length+' vendedores na feira');}}
   try{await acomodar(ID,cena,E.W,E.H);}catch(e){erros.push('acomodar: '+(e?.message||e));}
   // saídas: as antigas nas bocas de rua; portas novas para os mapas da cidade
   try{const ls=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));const v=ls.exists()?ls.data()||{}:{};
    const r=ligarCidadeBaixa({ligs:v.ligacoes||[],mapas:(dep.mapas?.()||[]).filter(m=>String(m.id)!==IA),cenarios:dep.cenarios?.()||[],ID,IA,W:E.W,H:E.H,pontoDeBorda,afastarNaBorda});
    await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:r.ligs,atualizadoEm:Date.now(),ladosV138:v.ladosV138||true}));
    const nm=id=>String((dep.mapas?.()||[]).find(m=>String(m.id)===id)?.nome||id);
    feitos.push(`${r.feitos.length} porta(s): ${r.feitos.map(f=>nm(f.mapa)).join(', ')}`);}catch(e){erros.push('saídas: '+(e?.message||e));}
   // o cenário das Ruas passa a se chamar Cidade Baixa
   for(const c of (dep.cenarios?.()||[]).filter(c=>String(c.mapaId||'')===ID&&/ruas escavadas/i.test(String(c.nome||''))))
    try{await dep.setDoc(D('cenarios/'+c.id),{nome:NOME_V173,nomeAntesV173:String(c.nome)},{merge:true});c.nome=NOME_V173;feitos.push('cenário renomeado');}catch(e){erros.push('cenário: '+(e?.message||e));}
   // o mapa separado "imagem IA" deixa de existir
   if((dep.mapas?.()||[]).some(m=>String(m.id)===IA)){
    try{await dep.deleteDoc(D('mapas/'+IA));await dep.deleteDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(IA)));try{await dep.deleteDoc(D('combatesAtivos/marcasMapa_'+encodeURIComponent(IA)));}catch(_){}
     const arr=dep.mapas?.(),i=arr?.findIndex(x=>String(x.id)===IA);if(arr&&i>=0)arr.splice(i,1);feitos.push('mapa "imagem IA" retirado');}catch(e){erros.push('retirar IA: '+(e?.message||e));}}
   try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));if(sh.exists()&&String(sh.data()?.mapId||'')===IA)await ctl()?.openMap?.(ID);}catch(_){}
   try{win.labAtualizarSelectMapas_?.();}catch(_){}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito173=true;
   try{await win.publicarComerciantesV141_?.();}catch(_){}
   toast(`🏘️ As Ruas Escavadas agora são a "${NOME_V173}" (o mesmo lugar no jogo: cenário e saídas continuam). ${feitos.slice(1).join(' · ')}. Cópia das Ruas guardada.${erros.length?' ⚠️ '+erros.join(' · '):''}`,22000);
   if(String(ctl()?.mapaAtual?.()||'')===ID)try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v173]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando173=false;}
 }
 // ------------------------------------------------------------ v173: em TODOS os mapas — carros antigos viram os novos e casas redondas barram redondo
 let feito173b=false,rodando173b=false,tent173b=0;
 async function montar173b(forcar=false){
  if(forcar===true){feito173b=false;tent173b=0;}else forcar=false;
  if(feito173b||rodando173b||!ehMestre()||rodando173||rodando172)return;
  const mapas=dep.mapas?.()||[],objs=dep.objetos?.()||[];if(!mapas.length||!objs.some(o=>String(o.id)==='ia_veiculo_sedan'))return;
  const flag=D('configuracoes/formasV173');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito173b=true;return;}}catch(_){return;}
  if(!forcar&&++tent173b>3){feito173b=true;return;}
  rodando173b=true;const feitos=[],erros=[];
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   for(const m of mapas){const id=String(m.id);if(!id||id.startsWith('__'))continue;
    try{const arq=D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)),sn=await dep.getDoc(arq);if(!sn.exists())continue;const cena=sn.data(),W=Number(m.larguraM)||28,H=Number(m.alturaM)||14;
     const v=trocarVeiculos(cena),f=fatiarRedondas(v.cena,W,H);if(!v.trocados&&!f.n)continue;
     try{await dep.setDoc(D('combatesAtivos/backupCena_'+id+'_v173b'),clean({em:new Date().toISOString(),cena}));}catch(_){}
     const nova={...f.cena,editorRevision:Number(cena.editorRevision||0)+1};await dep.setDoc(arq,clean(nova));
     try{const s2=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'));if(s2.exists()&&String(s2.data()?.mapId||'')===id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'),clean(nova));}catch(_){}
     feitos.push(`${m.nome||id}: ${[v.trocados?v.trocados+' veículo(s)':'',f.n?f.n+' casa(s) redonda(s)':''].filter(Boolean).join(', ')}`);
    }catch(e){erros.push(id+': '+(e?.message||e));}}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito173b=true;
   if(feitos.length)toast(`🚗🏠 ${feitos.join(' · ')}${erros.length?' ⚠️ '+erros.join(' · '):''}`,16000);
   try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v173b]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando173b=false;}
 }

 // ------------------------------------------------------------ v174: o que o mestre apagou não volta. O registro do mestre (mesa-fixos) guardava carros
 // antigos como "acrescentados" e os trazia de volta depois da troca pelos novos; cenas com o carro velho E o novo ficam só com o novo.
 let feito174=false,rodando174=false,tent174=0;
 async function montar174(forcar=false){
  if(forcar===true){feito174=false;tent174=0;}else forcar=false;
  if(feito174||rodando174||!ehMestre()||rodando173||rodando173b||rodando172)return;
  const mapas=dep.mapas?.()||[],objs=dep.objetos?.()||[];if(!mapas.length||!objs.some(o=>String(o.id)==='ia_veiculo_sedan'))return;
  const flag=D('configuracoes/registroV174');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito174=true;return;}}catch(_){return;}
  if(!forcar&&++tent174>3){feito174=true;return;}
  rodando174=true;const feitos=[],erros=[];const base=id=>String(id||'').replace(/(_v1[7-9]\d)+$/,'');
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   // 1) registro: "acrescentados" que eram carros antigos passam a ser os carros novos
   try{const r=await dep.getDoc(D('combatesAtivos/mesaObjetosMestre'));if(r.exists()){const v=r.data()||{},mp={...(v.mapas||{})};let n=0;
    await dep.setDoc(D('combatesAtivos/backupRegistro_v174'),clean({em:new Date().toISOString(),mapas:v.mapas||{}}));
    for(const [mid,reg] of Object.entries(mp)){const novo={...reg};
     for(const [k,rec] of Object.entries(reg||{})){if(!rec||rec.apagado||rec.tipo!=='adicionar'||!rec.obj)continue;
      const t=trocarVeiculos({objects:[{...rec.obj,id:rec.obj.id||rec.id}]});if(!t.trocados)continue;const o=t.cena.objects[0];
      novo[k]={...rec,id:o.id,nome:o.nome,obj:{...o,fixoMestreV143:null}};n++;}
     mp[mid]=novo;}
    if(n){await dep.setDoc(D('combatesAtivos/mesaObjetosMestre'),clean({...v,mapas:mp}));feitos.push(n+' carro(s) do registro do mestre atualizados');}}}catch(e){erros.push('registro: '+(e?.message||e));}
   // 2) cenas: carro velho que voltou ao lado do novo sai; o que sobrou de carro velho vira novo
   for(const m of mapas){const id=String(m.id);if(!id||id.startsWith('__'))continue;
    try{const arq=D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)),sn=await dep.getDoc(arq);if(!sn.exists())continue;const cena=sn.data();
     const novos=new Set((cena.objects||[]).filter(o=>o.trocadoV172).map(o=>base(o.id)));
     const sem2=(cena.objects||[]).filter(o=>o.trocadoV172||!novos.has(base(o.id)));const dup=(cena.objects||[]).length-sem2.length;
     const t=trocarVeiculos({...cena,objects:sem2});if(!dup&&!t.trocados)continue;
     try{await dep.setDoc(D('combatesAtivos/backupCena_'+id+'_v174'),clean({em:new Date().toISOString(),cena}));}catch(_){}
     const nova={...t.cena,editorRevision:Number(cena.editorRevision||0)+1};await dep.setDoc(arq,clean(nova));
     try{const s2=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'));if(s2.exists()&&String(s2.data()?.mapId||'')===id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'),clean(nova));}catch(_){}
     feitos.push(`${m.nome||id}: ${dup?dup+' repetido(s) tirado(s)':''}${dup&&t.trocados?', ':''}${t.trocados?t.trocados+' trocado(s)':''}`);
    }catch(e){erros.push(id+': '+(e?.message||e));}}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito174=true;
   if(feitos.length)toast(`🧹 Carros antigos que voltavam: ${feitos.join(' · ')}${erros.length?' ⚠️ '+erros.join(' · '):''}`,16000);
   try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v174]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando174=false;}
 }

 // ------------------------------------------------------------ v176: Therion (do GPT) entra como mapa; mapas que não estão em uso são GUARDADOS
 // (somem do seletor, não são apagados; 🗂️ Mapas mostra de novo). Fica: o que o mestre pediu, onde há jogadores, o aberto e os interiores.
 let feito176=false,rodando176=false,tent176=0;
 async function montar176(forcar=false){
  if(forcar===true){feito176=false;tent176=0;}else forcar=false;
  if(feito176||rodando176||!ehMestre()||rodando173||rodando174)return;
  const mapas=dep.mapas?.()||[];if(!mapas.length||!ctl()?.todosTokens)return;
  const flag=D('configuracoes/mapasGuardadosV176');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito176=true;return;}}catch(_){return;}
  if(!forcar&&++tent176>3){feito176=true;return;}
  rodando176=true;const feitos=[],erros=[];
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   // 1) Therion
   try{const {THERION}=await import('./mesa-therion-dados.js?v=176');const id=String(THERION.id);
    if(!mapas.some(m=>String(m.id)===id||/^therion/i.test(String(m.id)))){ // v178: o GPT já publicou o Therion novo
     const {mesaScene,...resto}=THERION;const rec={...THERION,id,criadoPor:String(dep.uid?.()||''),atualizadoEm:new Date().toISOString(),therionV176:true};
     await dep.setDoc(D('mapas/'+id),clean(rec));
     await dep.setDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)),clean({...mesaScene,mapId:id,objetosMapaImportados:true}));
     mapas.push({...resto,id,therionV176:true});feitos.push(`Therion (${THERION.larguraM}×${THERION.alturaM} m) entrou nos mapas`);}}catch(e){erros.push('Therion: '+(e?.message||e));}
   // 2) guardar o que não está em uso
   let ligs=[];try{const s=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));ligs=s.exists()?(s.data()?.ligacoes||[]):[];}catch(_){}
   let aberto='';try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));aberto=String(sh.exists()?sh.data()?.mapId||'':'');}catch(_){}
   const {mapasParaGuardar}=await import('./mesa-apagar-mapas.js?v=176');
   const ids=mapasParaGuardar(mapas,ligs,{tokens:ctl()?.todosTokens?.()||[],aberto});
   for(const id of ids)try{await dep.setDoc(D('mapas/'+id),{arquivadoV176:true},{merge:true});const m=mapas.find(x=>String(x.id)===id);if(m)m.arquivadoV176=true;}catch(e){erros.push(id+': '+(e?.message||e));}
   const ficam=mapas.filter(m=>m?.id&&!m.arquivadoV176).map(m=>m.nome||m.id);
   feitos.push(`${ids.length} mapa(s) guardado(s); à mostra: ${ficam.join(', ')}`);
   try{win.labAtualizarSelectMapas_?.();}catch(_){}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros,guardados:ids});feito176=true;
   toast(`🗂️ ${feitos.join(' · ')}. Para mostrar de novo ou guardar outros: botão 🗂️ Mapas.${erros.length?' ⚠️ '+erros.join(' · '):''}`,25000);
  }catch(e){console.warn('[Remodelagem v176]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando176=false;}
 }

 // ------------------------------------------------------------ v178: mapas do GPT entram no jogo: água do oásis de Therion barra; o Therion antigo
 // (da Oficina) é guardado; Therion ↔ cidade sem nome ↔ Portão de Véspera ligados por saídas; os dois ficam à mostra.
 let feito178=false,rodando178=false,tent178=0;
 async function montar178(forcar=false){
  if(forcar===true){feito178=false;tent178=0;}else forcar=false;
  if(feito178||rodando178||!ehMestre()||rodando176)return;
  const mapas=dep.mapas?.()||[];if(!mapas.length)return;
  const tem=id=>mapas.some(m=>String(m.id)===id);
  if(!tem(THERION_ARTE)&&!tem(CIDADE_SEM_NOME)){return;}
  const flag=D('configuracoes/mapasGptV178');
  try{if(!forcar&&(await dep.getDoc(flag)).exists()){feito178=true;return;}}catch(_){return;}
  if(!forcar&&++tent178>3){feito178=true;return;}
  rodando178=true;const feitos=[],erros=[];
  const gravar=async(id,fn)=>{const arq=D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)),sn=await dep.getDoc(arq);if(!sn.exists())return false;const c=sn.data(),n=fn(c);if(!n)return false;
   const nova={...n,editorRevision:Number(c.editorRevision||0)+1};await dep.setDoc(arq,clean(nova));
   try{const s2=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'));if(s2.exists()&&String(s2.data()?.mapId||'')===id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDiretaCena'),clean(nova));}catch(_){}return true;};
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   // 1) água do oásis
   if(tem(THERION_ARTE))try{if(await gravar(THERION_ARTE,c=>{const ja=new Set((c.objects||[]).map(o=>String(o.id)));const novos=AGUA_OASIS.filter(o=>!ja.has(o.id));return novos.length?{...c,objects:[...(c.objects||[]),...novos]}:null;}))feitos.push('Therion: a água do oásis agora barra (as margens continuam andáveis)');}catch(e){erros.push('água: '+(e?.message||e));}
   // 2) mostrar os novos, guardar o Therion antigo
   for(const id of [THERION_ARTE,CIDADE_SEM_NOME])if(tem(id))try{await dep.setDoc(D('mapas/'+id),{arquivadoV176:false},{merge:true});const m=mapas.find(x=>String(x.id)===id);if(m)m.arquivadoV176=false;}catch(_){}
   if(tem(THERION_ARTE)&&tem(THERION_OFICINA))try{await dep.setDoc(D('mapas/'+THERION_OFICINA),{arquivadoV176:true},{merge:true});const m=mapas.find(x=>String(x.id)===THERION_OFICINA);if(m)m.arquivadoV176=true;feitos.push('Therion antigo (da Oficina) guardado');}catch(_){}
   // 3) saídas: Therion (portão sul) ↔ cidade sem nome (norte); cidade sem nome (entrada sul) ↔ Portão de Véspera (oeste)
   try{const ls=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));const v=ls.exists()?ls.data()||{}:{};let ligs=[...(v.ligacoes||[])];
    const ligado=(a,b)=>ligs.some(l=>(String(l.a?.mapa)===a&&String(l.b?.mapa)===b)||(String(l.a?.mapa)===b&&String(l.b?.mapa)===a));
    const ocup=id=>ligs.flatMap(l=>[l.a,l.b].filter(e=>String(e?.mapa)===id));
    const nova=(a,pa,b,pb)=>{ligs.push({id:'lig178_'+Date.now().toString(36)+ligs.length,a:{mapa:a,...pa},b:{mapa:b,...afastarNaBorda(pb,ocup(b))},tipo:'porta',gptV178:true});};
    if(tem(THERION_ARTE)&&tem(CIDADE_SEM_NOME)&&!ligado(THERION_ARTE,CIDADE_SEM_NOME)){nova(THERION_ARTE,{x:14,y:13.75},CIDADE_SEM_NOME,{x:13.8,y:.4});feitos.push('saída Therion ↔ cidade sem nome');}
    const portao=mapas.find(m=>String(m.id)==='cenario_c001');
    if(portao&&tem(CIDADE_SEM_NOME)&&!ligado(CIDADE_SEM_NOME,'cenario_c001')){nova(CIDADE_SEM_NOME,{x:13.8,y:13.7},'cenario_c001',pontoDeBorda(0,'oeste'));feitos.push('saída cidade sem nome ↔ Portão de Véspera (lado oeste do portão)');}
    if(ligs.length!==(v.ligacoes||[]).length)await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:ligs,atualizadoEm:Date.now(),ladosV138:v.ladosV138||true}));}catch(e){erros.push('saídas: '+(e?.message||e));}
   try{win.labAtualizarSelectMapas_?.();}catch(_){}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito178=true;
   if(feitos.length)toast(`🏜️ Mapas do GPT no jogo: ${feitos.join(' · ')}. As saídas podem ser arrastadas no 🕸️ Mapa geral.${erros.length?' ⚠️ '+erros.join(' · '):''}`,22000);
   const atual=String(ctl()?.mapaAtual?.()||'');if(atual===THERION_ARTE)try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Remodelagem v178]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:String(e?.message||e)},{merge:true});}catch(_){}}
  finally{rodando178=false;}
 }
 const vigia=setInterval(()=>{void montar178().catch(e=>console.warn('[Remodelagem v178]',e));void montar176().catch(e=>console.warn('[Remodelagem v176]',e));void montar174().catch(e=>console.warn('[Remodelagem v174]',e));void montar173().catch(e=>console.warn('[Remodelagem v173]',e));void montar173b().catch(e=>console.warn('[Remodelagem v173b]',e));void montar172().catch(e=>console.warn('[Remodelagem v172]',e));void montar171().catch(e=>console.warn('[Remodelagem v171]',e));void montar170().catch(e=>console.warn('[Remodelagem v170]',e));void montar167().catch(e=>console.warn('[Remodelagem v167]',e));void montar166().catch(e=>console.warn('[Remodelagem v166]',e));void montar165().catch(e=>console.warn('[Remodelagem v165]',e));void montar164().catch(e=>console.warn('[Remodelagem v164]',e));void montar163().catch(e=>console.warn('[Remodelagem v163]',e));void montar162().catch(e=>console.warn('[Remodelagem v162]',e));void montar161().catch(e=>console.warn('[Remodelagem v161]',e));void montar().catch(e=>console.warn('[Remodelagem]',e));void montar141().catch(e=>console.warn('[Remodelagem v141]',e));void montar144().catch(e=>console.warn('[Remodelagem v144]',e));void montar160().catch(e=>console.warn('[Remodelagem v160]',e));},3000);
 win.mesaRemodelagem={montar178,montar176,montar174,montar173,montar173b,montar,montar141,montar144,montar160,montar161,montar162,montar163,montar164,montar165,montar166,montar167,montar170,montar171,montar172,retexturizar,feito:()=>feito};
 return {parar(){clearInterval(vigia);}};
}
