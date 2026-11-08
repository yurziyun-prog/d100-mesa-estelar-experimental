// Mesa Estelar v108 — Diretor de Cena (ferramentas do mestre no Mapa da Mesa).
//
// Gaveta lateral (não empurra o layout) aberta pelo botão 🧭:
//  🎲 Encontros: relógio de exploração por mapa, tensão que cresce com o tempo,
//     propostas de encontro que o mestre aprova — ao aprovar, as miniaturas entram
//     no mapa, objetos aparecem e clima/perigo (enchente, gás…) são aplicados.
//  ⛅ Clima: sorteio por ambiente e evolução automática com o tempo.
//  📌 Notas: balões no mapa (só mestre ou revelados aos jogadores) e resumo do cenário.
//  🎲 Gerador: NPCs e criaturas (motor do MapForge, regras d100, miniaturas artísticas), salvar no banco e colocar no mapa.
//
// Segurança: nada acontece sem o mestre clicar. Erros ficam no painel.

import {AMBIENTES_DIRETOR,ROTULO_TENSAO,tensao,chanceEncontro,sortearEvento,sortearClima,ESPECIES_NPC,PAPEIS_NPC,gerarNpc} from './mesa-diretor-dados.js?v=108';
import {renderizarMiniatura,specDeNpc,svgParaDataUrl,MARCA_MINI} from './mesa-miniaturas.js?v=194';
import {criarObjeto} from './nova-objetos.js?v=80';
import {tamanhoMiniaturaM} from './mesa-tamanhos.js?v=134';
import {criarGeradorNpc} from './mesa-gerador-npc.js?v=199';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
const MAP='combatesAtivos/mapaMesaSyncDireta';
const CENA='combatesAtivos/mapaMesaSyncDiretaCena';
const chaveMapa=id=>encodeURIComponent(String(id||'')).replace(/\./g,'%2E');
const caminhoVisual=id=>'combatesAtivos/mesaVisual_'+encodeURIComponent(String(id||''));
const caminhoNotas=id=>'combatesAtivos/mesaNotas_'+encodeURIComponent(String(id||''));
const fmtTempo=m=>{m=Math.floor(m);const h=Math.floor(m/60),mm=m%60;return h?`${h}h${String(mm).padStart(2,'0')}`:`${mm} min`;};

const CSS=`
#mdGaveta{position:fixed;top:70px;right:12px;bottom:12px;width:min(380px,calc(100vw - 24px));z-index:9990;background:#101828;border:1px solid #49668a;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden}
#mdGaveta[hidden]{display:none}
#mdGaveta .md-topo{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08)}
#mdGaveta .md-topo h3{margin:0;font-size:14px;color:#8ee7ff;flex:1}
#mdGaveta .md-abas{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:8px 10px}
#mdGaveta .md-abas button{padding:6px 1px;font-size:11px;white-space:nowrap}
#mdGaveta .md-abas button[aria-pressed="true"]{background:#2b4f74;color:#fff}
#mdGaveta .md-corpo{flex:1;overflow:auto;padding:4px 12px 14px}
#mdGaveta .md-sep{margin:12px 0 6px;color:#8ee7ff;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
#mdGaveta .md-linha{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0}
#mdGaveta .md-linha select,#mdGaveta .md-linha input[type=text],#mdGaveta textarea{flex:1;min-width:0}
#mdGaveta textarea{width:100%;min-height:70px;box-sizing:border-box}
#mdGaveta .md-barra{height:10px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden}
#mdGaveta .md-barra i{display:block;height:100%;transition:width .4s ease}
#mdGaveta .md-cartao{border:1px solid #49668a;border-radius:12px;padding:10px;background:rgba(255,255,255,.04);margin:8px 0}
#mdGaveta .md-cartao h4{margin:0 0 6px;font-size:14px}
#mdGaveta .md-log{font-size:12px;color:#b9c6da;max-height:180px;overflow:auto;white-space:pre-line}
#mdGaveta .md-mini{width:72px;height:72px;border-radius:8px;background:#4a4f57;flex:none}
#mdGaveta .md-mini img{width:100%;height:100%}
.md-pinos{position:absolute;inset:0;pointer-events:none;z-index:11}
.md-pino{position:absolute;transform:translate(-50%,-100%);pointer-events:auto;cursor:pointer;font-size:20px;line-height:1;filter:drop-shadow(0 2px 3px #000)}
.md-pino.md-gm{opacity:.85}
.md-balao{position:absolute;z-index:12;max-width:260px;padding:8px 10px;border-radius:10px;background:#0f1a2c;border:1px solid #8ee7ff;color:#e8eefc;font:12px/1.4 'Segoe UI',Arial,sans-serif;box-shadow:0 8px 20px rgba(0,0,0,.6);pointer-events:auto;white-space:pre-line}
.md-balao b{color:#8ee7ff}
#novaSyncBoard.md-colocando{cursor:crosshair!important}
`;

export function instalarDiretor(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const D=(p)=>dep.doc(dep.db,...p.split('/'));
 if(!root.getElementById('mdCssV108')){const st=root.createElement('style');st.id='mdCssV108';st.textContent=CSS;root.head.append(st);}

 let gaveta=null,aba='encontros',mapaId='',estado=null,salvarTimer=0,ultimoTick=0,colocando=null,notasPublicas=[],pararNotas=null,npcAtual=null,balao=null;
 const board=()=>root.getElementById('novaSyncBoard');
 const mapaVisivel=()=>String(board()?.dataset.mapaVisivel||'');
 const dims=()=>({W:Number(board()?.dataset.mapaLargura)||28,H:Number(board()?.dataset.mapaAltura)||14});

 // ---------------------------------------------------------------- estado por mapa (privado do mestre)
 const ESTADO_PADRAO={ambiente:'esgoto',surgimento:'borda',minutos:0,ativo:false,escala:10,proposta:null,log:[],notas:[],climaAuto:false,ultimoTeste:0};
 async function carregarEstado(id){
  mapaId=id;estado={...ESTADO_PADRAO};
  if(!id||!ehMestre())return;
  try{const s=await dep.getDoc(D('configuracoes/escudoMestre'));const v=s.exists()?s.data()?.diretorV108?.[chaveMapa(id)]:null;if(v)estado={...ESTADO_PADRAO,...v};}catch(e){console.warn('[Diretor]',e);}
 }
 function salvar(){clearTimeout(salvarTimer);salvarTimer=setTimeout(async()=>{if(!mapaId||!ehMestre())return;try{await dep.setDoc(D('configuracoes/escudoMestre'),{diretorV108:{[chaveMapa(mapaId)]:JSON.parse(JSON.stringify(estado))}},{merge:true});}catch(e){console.warn('[Diretor] salvar',e);}},600);}
 const registrar=t=>{estado.log=[`${fmtTempo(estado.minutos)} · ${t}`,...(estado.log||[])].slice(0,30);salvar();};

 // ---------------------------------------------------------------- utilidades do mapa
 const existe=(tipo,id)=>tipo==='criaturas'?(dep.criaturas?.()||[]).some(c=>String(c.id)===id):tipo==='npcs'?(dep.npcs?.()||[]).some(n=>String(n.id)===id):(dep.objetosMapa?.()||[]).some(o=>String(o.id)===id);
 async function posicoes(){const s=await dep.getDocs(dep.collection(dep.db,...POS.split('/')));const out=[];s.forEach(d=>out.push({id:d.id,...d.data()}));return out;}
 // v109: obstáculos da cena (para não nascer dentro de paredes/objetos) e pontos de surgimento
 async function obstaculos(){
  try{const s=await dep.getDoc(D(CENA)),c=s.exists()?s.data():null;if(!c||String(c.mapId||'')!==mapaId)return [];
   return (c.objects||[]).filter(o=>o&&!o.destruido&&o.bloqueiaMovimento!==false&&!(Number(o?.andarV144??o?.oficinaElement?.andarV144??1)>1)&&!['terreno','terrain'].includes(o.tipo)).map(o=>({x:Number(o.x)||0,y:Number(o.y)||0,w:Math.max(.2,Number(o.larguraM)||1),h:Math.max(.2,Number(o.alturaM)||1)}));}catch(_){return [];}
 }
 const dentroObstaculo=(p,obs,{W,H},folga=.45)=>obs.some(o=>Math.abs((p.x-o.x)*W/28)<o.w/2+folga&&Math.abs((p.y-o.y)*H/14)<o.h/2+folga);
 function pontoLivre(ocupados,centro,{W,H},dist=[5,9],obs=[]){
  for(let tent=0;tent<90;tent++){
   const a=Math.random()*Math.PI*2,dm=dist[0]+Math.random()*(dist[1]-dist[0]);
   const x=centro.x+Math.cos(a)*dm*28/W,y=centro.y+Math.sin(a)*dm*14/H;
   if(x<.8||x>27.2||y<.8||y>13.2)continue;
   if(dentroObstaculo({x,y},obs,{W,H}))continue;
   if(ocupados.every(o=>Math.hypot((o.x-x)*W/28,(o.y-y)*H/14)>1.1))return {x,y};
  }
  return {x:Math.max(.8,Math.min(27.2,centro.x+2)),y:Math.max(.8,Math.min(13.2,centro.y+1))};
 }
 // Borda/canto aleatório do mapa, longe do grupo e fora de obstáculos.
 function pontoDeBorda(ocupados,centro,{W,H},obs=[]){
  let melhor=null,melhorD=-1;
  for(let tent=0;tent<120;tent++){
   const lado=Math.floor(Math.random()*4),m=(.9+Math.random()*1.8);
   let x=Math.random()*28,y=Math.random()*14;
   if(lado===0)y=m*14/H;else if(lado===1)y=14-m*14/H;else if(lado===2)x=m*28/W;else x=28-m*28/W;
   if(Math.random()<.35){x=Math.random()<.5?m*28/W:28-m*28/W;y=Math.random()<.5?m*14/H:14-m*14/H;}
   x=Math.max(.8,Math.min(27.2,x));y=Math.max(.8,Math.min(13.2,y));
   if(dentroObstaculo({x,y},obs,{W,H},.9))continue;
   if(!ocupados.every(o=>Math.hypot((o.x-x)*W/28,(o.y-y)*H/14)>1.4))continue;
   const d=Math.hypot((centro.x-x)*W/28,(centro.y-y)*H/14);
   if(d>=Math.min(8,Math.max(W,H)*.35))return {x,y};
   if(d>melhorD){melhorD=d;melhor={x,y};}
  }
  return melhor||pontoLivre(ocupados,centro,{W,H},[5,9],obs);
 }
 const centroGrupo=noMapa=>{const g=noMapa.filter(p=>p.donoUid);return g.length?{x:g.reduce((s,p)=>s+p.x,0)/g.length,y:g.reduce((s,p)=>s+p.y,0)/g.length}:{x:14,y:7};};
 async function colocarTokens(entradas,ancoraDada=null,modo='grupo'){
  // entradas: [{tipo:'criaturas'|'npcs', modelo, qtd}]
  const mapa=mapaId,{W,H}=dims(),todos=await posicoes(),noMapa=todos.filter(p=>String(p.mapaId||'')===mapa),obs=await obstaculos();
  const centro=centroGrupo(noMapa);
  const ancora=ancoraDada||(modo==='borda'?pontoDeBorda(noMapa,centro,{W,H},obs):pontoLivre(noMapa,centro,{W,H},[5,9],obs));const colocados=[];
  for(const e of entradas){
   const pref=e.tipo==='criaturas'?'synccriatura:':'syncnpc:',base=pref+e.modelo.id;
   for(let i=0;i<e.qtd;i++){
    let k=1,id=base;while(todos.some(p=>decodeURIComponent(p.id)===id)){k++;id=base+'~'+k;}
    const pos=pontoLivre([...noMapa,...colocados],ancora,{W,H},[0,1.8+e.qtd*.4],obs);
    const facing=Math.atan2((centro.y-pos.y)*H/14,(centro.x-pos.x)*W/28);
    const nome=(e.tipo==='criaturas'?'Monstro · ':'NPC · ')+e.modelo.nome+(k>1?' '+k:'');
    const dados={nome,imagem:String(e.modelo.miniatura?.url||e.modelo.imagem||''),diametroM:tamanhoMiniaturaM(e.modelo),donoUid:'',x:Number(pos.x.toFixed(3)),y:Number(pos.y.toFixed(3)),revision:0,facing:Number(facing.toFixed(3)),camada:3,mapaId:mapa,...(e.extra||{})};
    if(e.tipo==='criaturas')try{await win.mesaAtitudesIaV200?.reiniciarCriatura?.(encodeURIComponent(id));}catch(er){console.warn('[Diretor] saúde antiga',er?.code||er);}
    await dep.setDoc(D(POS+'/'+encodeURIComponent(id)),dados);
    todos.push({id:encodeURIComponent(id),...dados});colocados.push(dados);
   }
  }
  colocados.ancora=ancora;
  return colocados;
 }
 async function colocarObjetos(lista,perto=null){
  if(!lista.length)return 0;const {W,H}=dims(),pos=await posicoes(),noMapa=pos.filter(p=>String(p.mapaId||'')===mapaId);
  const centro=perto||centroGrupo(noMapa);
  let n=0;
  await dep.runTransaction(dep.db,async tx=>{
   const ref=D(CENA),s=await tx.get(ref),cena=s.exists()?s.data():null;
   if(!cena||String(cena.mapId||'')!==mapaId)throw new Error('Abra este mapa na mesa (como mestre) antes de adicionar objetos.');
   const objetos=[...(cena.objects||[])];
   for(const {id,qtd} of lista){const modelo=(dep.objetosMapa?.()||[]).find(o=>String(o.id)===id);if(!modelo)continue;
    for(let i=0;i<qtd;i++){const p=pontoLivre([...noMapa,...objetos],centro,{W,H},perto?[1.2,3]:[2.5,5]);objetos.push(JSON.parse(JSON.stringify(criarObjeto(modelo,{id:crypto.randomUUID(),x:p.x,y:p.y,tipo:'objeto'}))));n++;}}
   tx.set(ref,{...cena,objects:objetos});
  });
  return n;
 }
 async function aplicarVisual(parcial){await dep.setDoc(D(caminhoVisual(mapaId)),{...parcial,mapId:mapaId,atualizadoEm:new Date().toISOString()},{merge:true});}

 // ---------------------------------------------------------------- encontros
 function proporEncontro(forcar=false){
  const amb=estado.ambiente,ch=chanceEncontro(amb,estado.minutos),d=Math.random();
  if(!forcar&&d>ch){registrar(`Teste de encontro: nada (${Math.round(d*100)} > ${Math.round(ch*100)}%)`);desenhar();return;}
  const ev=sortearEvento(amb,estado.minutos,Math.random,existe);
  if(!ev){registrar('Nenhum encontro possível com o que há no banco.');desenhar();return;}
  estado.proposta=ev;registrar(`Proposta: ${ev.nome}`);desenhar();
  if(!gaveta||gaveta.hidden)avisar(`🎲 Encontro proposto: ${ev.nome}`);
 }
 const SURGIMENTOS=[['borda','🎲 Borda/canto aleatório'],['escolher','📍 Eu escolho no mapa'],['grupo','👥 Perto do grupo']];
 async function aprovar(ponto=null){
  const ev=estado.proposta;if(!ev)return;
  const modo=estado.surgimento||'borda';
  const temAlgo=(ev.criaturas||[]).length||(ev.npcs||[]).length||(ev.objetos||[]).length;
  if(modo==='escolher'&&!ponto&&temAlgo){
   colocando={tipo:'encontro'};instalarCapturaMapa();board()?.classList.add('md-colocando');
   // a gaveta sai da frente do mapa enquanto o mestre escolhe o ponto
   if(gaveta)gaveta.hidden=true;dica('📍 Clique no mapa onde o encontro deve surgir (Esc cancela)');return;
  }
  const st=gaveta?.querySelector('[data-st]');if(st)st.textContent='Executando…';
  try{
   const entradas=[...(ev.criaturas||[]).map(c=>({tipo:'criaturas',modelo:(dep.criaturas?.()||[]).find(x=>String(x.id)===c.id),qtd:c.qtd})),...(ev.npcs||[]).map(n=>({tipo:'npcs',modelo:(dep.npcs?.()||[]).find(x=>String(x.id)===n.id),qtd:1}))].filter(e=>e.modelo);
   const col=entradas.length?await colocarTokens(entradas,ponto,modo):[];const nt=col.length;
   let no=0;try{no=await colocarObjetos(ev.objetos||[],ponto||(modo==='borda'?col.ancora:null));}catch(e){registrar('Objetos: '+e.message);}
   if(ev.perigo)await aplicarVisual({perigo:ev.perigo});
   if(ev.clima)await aplicarVisual(ev.clima);
   const onde=ponto?'no ponto escolhido':modo==='borda'?'na borda do mapa':'perto do grupo';
   registrar(`✅ ${ev.nome}: ${nt} miniatura(s), ${no} objeto(s) ${onde}${ev.perigo?', perigo ativo':''}${ev.clima?', clima/luz alterados':''}.`);
   estado.proposta=null;if(ev.perigo)estado.perigoAtivo={...ev.perigo,desde:estado.minutos};
  }catch(e){console.warn('[Diretor]',e);registrar('⚠️ '+(e?.code||e?.message||e));}
  salvar();desenhar();
 }
 // relógio: avança só com a página do mestre aberta
 function tick(){
  if(!estado?.ativo||!mapaId){ultimoTick=0;return;}
  const agora=Date.now();if(!ultimoTick){ultimoTick=agora;return;}
  const antes=estado.minutos;estado.minutos+=(agora-ultimoTick)/60000*estado.escala;ultimoTick=agora;
  if(Math.floor(estado.minutos/10)>Math.floor(antes/10))passaram10();
  if(Math.floor(estado.minutos)!==Math.floor(antes)){atualizarRelogio();if(Math.floor(estado.minutos)%2===0)salvar();}
 }
 async function passaram10(){
  // perigo crescente (enchente sobe)
  if(estado.perigoAtivo?.tipo==='enchente'&&estado.perigoAtivo.nivel<1){estado.perigoAtivo.nivel=Math.min(1,estado.perigoAtivo.nivel+.15);try{await aplicarVisual({perigo:{tipo:'enchente',nivel:estado.perigoAtivo.nivel}});registrar(`🌊 A água sobe (nível ${Math.round(estado.perigoAtivo.nivel*100)}%).`);}catch(_){}}
  if(estado.climaAuto&&Math.floor(estado.minutos/60)>Math.floor((estado.minutos-10)/60)&&Math.random()<.35){const c=sortearClima(estado.ambiente);try{await aplicarVisual({clima:c.clima,intensidadeClima:c.intensidade||1});registrar(`⛅ Clima muda: ${c.nome}.`);}catch(_){}}
  if(!estado.proposta)proporEncontro(false);else desenhar();
 }
 // ---------------------------------------------------------------- notas no mapa
 function desenharPinos(){
  const b=board();if(!b)return;
  let camada=b.querySelector('.md-pinos');if(!camada){camada=root.createElement('div');camada.className='md-pinos';b.append(camada);}
  const notas=[...(ehMestre()&&estado?.notas||[]).map(n=>({...n,gm:true})),...notasPublicas.map(n=>({...n,gm:false}))];
  const chave=JSON.stringify(notas.map(n=>[n.id,n.x,n.y,n.icone,n.gm]));if(camada.dataset.chave===chave)return;camada.dataset.chave=chave;
  camada.innerHTML=notas.map(n=>`<span class="md-pino${n.gm?' md-gm':''}" data-nota="${esc(n.id)}" data-gm="${n.gm?1:0}" style="left:${n.x/28*100}%;top:${n.y/14*100}%" title="${esc(n.titulo)}">${esc(n.icone||(n.gm?'📌':'💬'))}</span>`).join('');
  camada.querySelectorAll('.md-pino').forEach(p=>p.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();abrirBalao(p.dataset.nota,p.dataset.gm==='1');}));
 }
 function abrirBalao(id,gm){
  fecharBalao();const n=(gm?estado?.notas:notasPublicas)?.find(x=>x.id===id);if(!n)return;
  const b=board();balao=root.createElement('div');balao.className='md-balao';
  balao.style.left=`calc(${n.x/28*100}% + 14px)`;balao.style.top=`calc(${n.y/14*100}% - 10px)`;
  balao.innerHTML=`<b>${esc(n.titulo)}</b>${gm?' <small style="color:#9fb3cc">(só mestre)</small>':''}\n${esc(n.texto)}${ehMestre()?`<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn-small" data-rev>${n.revelada?'🙈 Esconder':'👁️ Revelar'}</button><button type="button" class="btn-small" data-del>🗑️</button><button type="button" class="btn-small" data-x>✕</button></div>`:'<div style="text-align:right"><button type="button" class="btn-small" data-x>✕</button></div>'}`;
  balao.addEventListener('pointerdown',e=>e.stopPropagation());
  b.append(balao);
  balao.querySelector('[data-x]')?.addEventListener('click',fecharBalao);
  balao.querySelector('[data-del]')?.addEventListener('click',async()=>{estado.notas=(estado.notas||[]).filter(x=>x.id!==id);await publicarNotas();salvar();fecharBalao();desenharPinos();desenhar();});
  balao.querySelector('[data-rev]')?.addEventListener('click',async()=>{const x=(estado.notas||[]).find(y=>y.id===id);if(x)x.revelada=!x.revelada;await publicarNotas();salvar();fecharBalao();desenharPinos();desenhar();});
 }
 function fecharBalao(){balao?.remove();balao=null;}
 async function publicarNotas(){if(!mapaId)return;const pub=(estado.notas||[]).filter(n=>n.revelada).map(({id,x,y,titulo,texto,icone})=>({id,x,y,titulo,texto,icone:icone||'💬'}));await dep.setDoc(D(caminhoNotas(mapaId)),{notas:pub,mapId:mapaId});}
 function observarNotasPublicas(id){
  pararNotas?.();pararNotas=null;notasPublicas=[];
  if(!id||!dep.onSnapshot)return desenharPinos();
  pararNotas=dep.onSnapshot(D(caminhoNotas(id)),s=>{notasPublicas=ehMestre()?[]:(s.exists()?s.data()?.notas||[]:[]);desenharPinos();},e=>console.warn('[Diretor] notas',e));
 }
 // clique no mapa para posicionar nota
 function instalarCapturaMapa(){
  const b=board();if(!b||b.dataset.mdCaptura)return;b.dataset.mdCaptura='1';
  b.addEventListener('pointerdown',e=>{
   if(!colocando)return;e.stopPropagation();e.preventDefault();
   const r=b.getBoundingClientRect(),x=Math.max(0,Math.min(28,(e.clientX-r.left)/r.width*28)),y=Math.max(0,Math.min(14,(e.clientY-r.top)/r.height*14));
   const c=colocando;colocando=null;b.classList.remove('md-colocando');
   if(c.tipo==='encontro'){dicaEl?.remove();abrir('encontros');aprovar({x,y}).catch(err=>console.warn('[Diretor]',err));return;}
   estado.notas=[...(estado.notas||[]),{id:crypto.randomUUID(),x,y,titulo:c.titulo,texto:c.texto,icone:c.icone,revelada:c.revelada}];
   salvar();publicarNotas().catch(()=>{});desenharPinos();desenhar();
  },true);
 }
 // ---------------------------------------------------------------- NPC
 /* NPC gerado (modelo bruto do gerador): vira NPC do banco com a miniatura artística e, se pedido, entra no mapa */
 async function salvarNpcGerado(bruto,idArte,colocar){
  const modelo=dep.normalizar('npcs',bruto);if(!modelo)throw new Error('Ficha inválida.');
  const arte='arte/miniaturas/'+idArte+'.webp';
  modelo.imagem=arte;modelo.miniatura={url:arte,tipo:'sprite',spriteId:idArte,atualizadoEm:new Date().toISOString()};
  await dep.setDoc(D('npcs/'+modelo.id),JSON.parse(JSON.stringify(modelo)));
  (dep.npcs?.()||[]).push(modelo);
  let msg=`NPC ${modelo.nome} salvo no banco.`;
  if(colocar){await colocarTokens([{tipo:'npcs',modelo,qtd:1,extra:{spriteIdV199:idArte}}]);msg+=' Colocado no mapa.';}
  registrar(msg);return msg;
 }
 /* criatura gerada: entra pelo modelo do bestiário do site (mesmas fichas e regras); se não houver, cria um modelo simples */
 async function colocarCriaturaGerada(ficha){
  const id=String(ficha.especieId||'');
  const banco=(dep.criaturas?.()||[]).find(c=>String(c.id)===id)||{id,nome:String(ficha.nome||id).replace(/\s+\d+$/,''),tamanho:ficha.tamanho||'',imagem:''};
  await colocarTokens([{tipo:'criaturas',modelo:banco,qtd:1}]);
  const msg=`${banco.nome} colocada no mapa.`;registrar(msg);return msg;
 }
 const gerador=criarGeradorNpc({esc,redesenhar:()=>{if(aba==='npc')desenhar();},status:t=>{const e=gaveta?.querySelector('[data-st]');if(e)e.textContent=t;},salvarNpc:salvarNpcGerado,colocarCriatura:colocarCriaturaGerada});

 // ---------------------------------------------------------------- interface
 let avisoEl=null,dicaEl=null;
 function dica(t){dicaEl?.remove();dicaEl=root.createElement('div');dicaEl.style.cssText='position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:9992;padding:9px 14px;border-radius:12px;border:1px solid #8ee7ff;background:#0f1a2c;color:#e8eefc;font:600 13px Segoe UI,Arial;box-shadow:0 10px 30px rgba(0,0,0,.5);pointer-events:none';dicaEl.textContent=t;root.body.append(dicaEl);}
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&colocando){const era=colocando.tipo;colocando=null;board()?.classList.remove('md-colocando');dicaEl?.remove();if(era==='encontro')abrir('encontros');}});
 function avisar(t){avisoEl?.remove();avisoEl=root.createElement('button');avisoEl.type='button';avisoEl.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9991;padding:10px 16px;border-radius:12px;border:1px solid #ffd447;background:#2a2410;color:#fff6d6;font:600 13px Segoe UI,Arial;box-shadow:0 10px 30px rgba(0,0,0,.5);cursor:pointer';avisoEl.textContent=t+' — abrir';avisoEl.addEventListener('click',()=>{avisoEl.remove();abrir('encontros');});root.body.append(avisoEl);setTimeout(()=>avisoEl?.remove(),20000);}
 function instalarBotao(){
  if(!ehMestre())return;
  const barra=root.querySelector('#sincronizacao-nova .nova-view-tools');if(!barra||root.getElementById('mdBotao'))return;
  const b=root.createElement('button');b.type='button';b.id='mdBotao';b.className='btn-small';b.textContent='🧭';b.title='Diretor de cena: encontros, clima, notas e NPCs';
  b.addEventListener('click',()=>gaveta&&!gaveta.hidden?fechar():abrir());barra.append(b);
 }
 /* Atalhos visíveis (com nome) para o mestre: criaturas, geradores e tamanhos. Antes só havia o ícone 🧭 pequeno. */
 function instalarAtalhos(){
  if(!ehMestre()){root.getElementById('mdAtalhos')?.remove();return;}
  const b=board();const alvo=b?.parentElement;if(!alvo?.parentElement||root.getElementById('mdAtalhos'))return;
  const faixa=root.createElement('div');faixa.id='mdAtalhos';
  faixa.style.cssText='display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0;padding:6px 8px;border:1px solid #2f4c6d;border-radius:12px;background:#0d1626';
  const rot=root.createElement('span');rot.textContent='Ferramentas do mestre:';rot.style.cssText='color:#9fb3cc;font-size:12px;margin-right:4px';faixa.append(rot);
  const mk=(txt,tit,fn)=>{const x=root.createElement('button');x.type='button';x.className='btn-small';x.textContent=txt;x.title=tit;x.style.cssText='padding:6px 12px;font-weight:600';x.addEventListener('pointerdown',e=>e.stopPropagation());x.addEventListener('click',fn);faixa.append(x);return x;};
  mk('👾 Criaturas e comportamento','Adicionar criaturas/NPCs e escolher como se comportam (agressiva, sanguinária, defensiva, aliada, confiança, ajuda, alimentação)',()=>abrir('bichos'));
  mk('🎲 Gerar NPC / criatura','Gerador de NPCs e criaturas (regras do jogo, miniaturas)',()=>abrir('npc'));
  mk('🗺️ Gerar mapa','Gerador de mapas (masmorra, cidade, exterior): abre o Editor rápido com o gerador',()=>{const E=win.mesaEditorRapidoV197;if(!E){avisar2('O Editor rápido ainda não carregou. Tente de novo em alguns segundos.');return;}E.abrir();setTimeout(()=>E.gerador?.(),150);});
  mk('⚡ Combate','Opções do combate em tempo real: pausar, velocidade, facções e quem age sozinho',()=>{const rt=win.mesaTempoRealV111;if(rt?.abrirOpcoes)rt.abrirOpcoes();else avisar2('O combate em tempo real ainda não carregou.');});
  mk('🎞️ Galeria 3D','Veja todas as miniaturas 3D animadas, marque as que gostou e diga no lugar de quais criaturas elas devem entrar',()=>{import('./mesa-galeria3d.js?v=201').then(m=>m.abrirGaleria3D({root,dep:{db:dep.db,doc:dep.doc,getDoc:dep.getDoc,setDoc:dep.setDoc,criaturas:()=>dep.criaturas?.()||[],npcs:()=>dep.npcs?.()||[]}})).catch(e=>{console.warn('[Galeria 3D]',e);avisar2('Não consegui abrir a Galeria 3D.');});});
  mk('🌿 Mapa de teste','Tudo do mapa de teste num painel só: abrir, atualizar, colocar um personagem para testar, jogar como jogador e guardar os outros mapas',()=>{if(win.mesaHubTeste?.abrir)win.mesaHubTeste.abrir();else avisar2('O painel do mapa de teste ainda não carregou. Tente de novo em alguns segundos.');});
  alvo.parentElement.insertBefore(faixa,alvo);
 }
 function avisar2(t){dica(t);setTimeout(()=>dicaEl?.remove(),3500);}
 function abrir(qual){
  if(qual)aba=qual;
  if(!gaveta){gaveta=root.createElement('aside');gaveta.id='mdGaveta';root.body.append(gaveta);}
  gaveta.hidden=false;desenhar();
 }
 function fechar(){if(gaveta)gaveta.hidden=true;colocando=null;board()?.classList.remove('md-colocando');}
 function atualizarRelogio(){
  if(!gaveta||gaveta.hidden||aba!=='encontros')return;
  const t=tensao(estado.ambiente,estado.minutos),r=gaveta.querySelector('[data-relogio]'),bar=gaveta.querySelector('[data-tensao] i'),rot=gaveta.querySelector('[data-rot-tensao]');
  if(r)r.textContent=fmtTempo(estado.minutos);if(bar){bar.style.width=Math.round(t*100)+'%';bar.style.background=t<.25?'#57e3a1':t<.5?'#f2c14e':t<.75?'#ff8a3b':'#ff4b4b';}
  if(rot)rot.textContent=`${ROTULO_TENSAO(t)} · chance por 10 min: ${Math.round(chanceEncontro(estado.ambiente,estado.minutos)*100)}%`;
 }
 function htmlEncontros(){
  const p=estado.proposta;
  const desc=c=>{const m=(dep.criaturas?.()||[]).find(x=>String(x.id)===c.id);return `${c.qtd}× ${esc(m?.nome||c.id)}`;};
  return `<div class="md-linha"><span>Ambiente</span><select data-amb>${Object.entries(AMBIENTES_DIRETOR).map(([k,a])=>`<option value="${k}"${k===estado.ambiente?' selected':''}>${a.nome}</option>`).join('')}</select></div>
  <div class="md-sep">Tempo no local</div>
  <div class="md-linha"><b data-relogio style="font-size:20px;min-width:90px">${fmtTempo(estado.minutos)}</b>
   <button type="button" class="btn-small${estado.ativo?'':' btn-select'}" data-play>${estado.ativo?'⏸ Pausar':'▶ Iniciar'}</button>
   <button type="button" class="btn-small" data-mais="10">+10 min</button><button type="button" class="btn-small" data-mais="60">+1 h</button><button type="button" class="btn-small" data-zerar title="Zerar relógio">↺</button></div>
  <div class="md-linha"><span>Velocidade</span><select data-escala>${[[5,'1 min real = 5 min'],[10,'1 min real = 10 min'],[30,'1 min real = 30 min'],[60,'1 min real = 1 h']].map(([v,t])=>`<option value="${v}"${v===estado.escala?' selected':''}>${t}</option>`).join('')}</select></div>
  <div class="md-barra" data-tensao><i></i></div><div data-rot-tensao style="color:#9fb3cc;font-size:12px;margin-top:4px"></div>
  <div class="md-linha"><button type="button" class="btn-small" data-rolar>🎲 Rolar encontro agora</button>${estado.perigoAtivo?`<button type="button" class="btn-small" data-fim-perigo>🧯 Encerrar perigo</button>`:''}</div>
  ${p?`<div class="md-cartao" style="border-color:${p.gravidade>=3?'#ff4b4b':p.gravidade>=2?'#ff8a3b':p.gravidade===1?'#f2c14e':'#57e3a1'}"><h4>${p.gravidade>=3?'⚠️ ':''}${esc(p.nome)} <small style="color:#9fb3cc">· ${esc(p.tipo)}</small></h4><div style="white-space:pre-line">${esc(p.texto)}</div>
   ${(p.criaturas||[]).length?`<div style="margin-top:6px">👾 ${p.criaturas.map(desc).join(', ')}</div>`:''}${(p.npcs||[]).length?`<div>🧑 ${p.npcs.map(n=>esc((dep.npcs?.()||[]).find(x=>String(x.id)===n.id)?.nome||n.id)).join(', ')}</div>`:''}${(p.objetos||[]).length?`<div>📦 ${p.objetos.map(o=>`${o.qtd}× ${esc((dep.objetosMapa?.()||[]).find(x=>String(x.id)===o.id)?.nome||o.id)}`).join(', ')}</div>`:''}${p.perigo?`<div>☣️ Perigo: ${esc(p.perigo.tipo)}</div>`:''}${p.clima?`<div>⛅ Muda clima/luz</div>`:''}
   <div class="md-linha" style="margin-top:8px"><span>Surgem</span><select data-surg>${SURGIMENTOS.map(([k,t])=>`<option value="${k}"${k===(estado.surgimento||'borda')?' selected':''}>${t}</option>`).join('')}</select></div>
   <div class="md-linha"><button type="button" class="btn-small btn-select" data-aprovar>✅ Aprovar e colocar no mapa</button><button type="button" class="btn-small" data-outro>🎲 Outro</button><button type="button" class="btn-small" data-descartar>✖</button></div></div>`:''}
  <div data-st style="color:#9fb3cc;min-height:1.2em"></div>
  <div class="md-sep">Histórico</div><div class="md-log">${esc((estado.log||[]).join('\n'))||'—'}</div>`;
 }
 function htmlClima(){
  const a=AMBIENTES_DIRETOR[estado.ambiente]||AMBIENTES_DIRETOR.esgoto;
  return `<div style="color:#c6d3e6">Ambiente: <b>${a.nome}</b> (troque na aba Encontros).</div>
  <div class="md-sep">Sugestões para este ambiente</div>
  ${a.climas.map((c,i)=>`<div class="md-linha"><span style="flex:1">${esc(c.nome)}</span><button type="button" class="btn-small" data-clima="${i}">Aplicar</button></div>`).join('')}
  <div class="md-linha"><button type="button" class="btn-small btn-select" data-sortear-clima>🎲 Sortear clima</button></div>
  <div class="md-sep">Luz</div>
  <div class="md-linha">${[['dia','☀️'],['entardecer','🌇'],['noite','🌙'],['escuro','🕳️']].map(([k,i])=>`<button type="button" class="btn-small" data-luz="${k}" title="${k}">${i} ${k}</button>`).join('')}</div>
  <div class="md-linha"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-auto${estado.climaAuto?' checked':''}> Clima muda sozinho com o tempo (a cada hora de jogo, 35%)</label></div>
  <div data-st style="color:#9fb3cc;min-height:1.2em"></div>`;
 }
 function htmlNotas(){
  const cen=(dep.cenarios?.()||[]).find(c=>String(c.mapaId||'')===mapaId);
  const campos=cen?[['📜 Descrição (mestre)',cen.descricaoGM],['🎯 Objetivo',cen.objetivo],['🤫 Segredos',cen.segredos],['🎲 Testes sugeridos',cen.testesSugeridos],['⚡ Eventos',cen.eventos],['👾 Encontros',cen.encontros],['🤝 Interações',cen.interacoesTexto]].filter(([,v])=>String(v||'').trim()):[];
  return `<div class="md-sep">Nova nota no mapa</div>
  <div class="md-linha"><input type="text" data-titulo placeholder="Título (ex.: Comporta 3)"><select data-icone>${['📌','💬','⚠️','🔒','💰','🚪','☠️','❓'].map(i=>`<option>${i}</option>`).join('')}</select></div>
  <textarea data-texto placeholder="Texto do balão"></textarea>
  <div class="md-linha"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-revelar> Visível para os jogadores</label><button type="button" class="btn-small btn-select" data-colocar>📍 Clicar no mapa</button></div>
  <div data-st style="color:#9fb3cc;min-height:1.2em">${colocando?'Clique no mapa para colocar a nota…':''}</div>
  <div class="md-sep">Notas deste mapa (${(estado.notas||[]).length})</div>
  ${(estado.notas||[]).map(n=>`<div class="md-linha"><span>${esc(n.icone||'📌')}</span><span style="flex:1">${esc(n.titulo)}${n.revelada?' <small style="color:#57e3a1">· visível</small>':''}</span></div>`).join('')||'<div style="color:#9fb3cc">Nenhuma.</div>'}
  <div class="md-sep">Cenário vinculado</div>
  ${cen?`<div class="md-cartao"><h4>${esc(cen.nome)}</h4>${campos.map(([k,v])=>`<div style="margin:4px 0"><b>${k}</b><div style="white-space:pre-line;color:#c6d3e6">${esc(v)}</div></div>`).join('')||'<div style="color:#9fb3cc">Sem textos para o mestre.</div>'}${campos.length?`<button type="button" class="btn-small" data-notas-cena>📌 Criar balões do cenário no mapa</button>`:''}</div>`:'<div style="color:#9fb3cc">Nenhum cenário está ligado a este mapa.</div>'}`;
 }
 function htmlNpc(){return gerador.html();}
 // v200: aba 👾 Criaturas (atitudes). Módulo à parte: se falhar, a aba só mostra um aviso.
 let painelCr=null,cartao=null;
 import('./mesa-diretor-criaturas.js?v=200').then(m=>{cartao=m.criarCartaoComportamento({root,esc,api:()=>win.mesaAtitudesIaV200,ctl:()=>dep.controller?.(),criaturas:()=>dep.criaturas?.()||[],npcs:()=>dep.npcs?.()||[]});painelCr=m.criarPainelCriaturas({esc,api:()=>win.mesaAtitudesIaV200,listarTokens:async()=>(await posicoes()).filter(p=>String(p.mapaId||'')===mapaId),colocar:(e)=>colocarTokens(e),criaturas:()=>dep.criaturas?.()||[],npcs:()=>dep.npcs?.()||[],registrar});if(aba==='bichos'){painelCr.recarregar().then(desenhar);}}).catch(e=>console.warn('[Diretor] criaturas',e));
 function htmlBichos(){return painelCr?painelCr.html():'<div style="color:#9fb3cc;padding:8px 0">Carregando…</div>';}
 function desenhar(){
  if(!gaveta||gaveta.hidden)return;
  if(!mapaId){gaveta.innerHTML=`<div class="md-topo"><h3>🧭 Diretor de cena</h3><button type="button" class="btn-small" data-fechar>✕</button></div><div class="md-corpo">Abra um mapa na mesa primeiro.</div>`;gaveta.querySelector('[data-fechar]').addEventListener('click',fechar);return;}
  const corpo={encontros:htmlEncontros,clima:htmlClima,notas:htmlNotas,npc:htmlNpc,bichos:htmlBichos}[aba]();
  const rol=gaveta.querySelector('.md-corpo')?.scrollTop||0;
  gaveta.innerHTML=`<div class="md-topo"><h3>🧭 Diretor de cena</h3><button type="button" class="btn-small" data-fechar>✕</button></div>
   <div class="md-abas">${[['encontros','🎲 Encontros'],['clima','⛅ Clima'],['notas','📌 Notas'],['npc','🎲 Gerador'],['bichos','👾 Criaturas']].map(([k,t])=>`<button type="button" class="btn-small" data-aba="${k}" aria-pressed="${k===aba}">${t}</button>`).join('')}</div>
   <div class="md-corpo">${corpo}</div>`;
  gaveta.querySelector('.md-corpo').scrollTop=rol;
  const $=q=>gaveta.querySelector(q),st=t=>{const e=$('[data-st]');if(e)e.textContent=t||'';};
  $('[data-fechar]').addEventListener('click',fechar);
  gaveta.querySelectorAll('[data-aba]').forEach(b=>b.addEventListener('click',async()=>{aba=b.dataset.aba;if(aba==='bichos'&&painelCr)await painelCr.recarregar();desenhar();}));
  const acao=(sel,fn)=>gaveta.querySelectorAll(sel).forEach(el=>el.addEventListener(el.tagName==='SELECT'||el.type==='checkbox'?'change':'click',async ev=>{try{await fn(ev,el);}catch(e){console.warn('[Diretor]',e);st('⚠️ '+(e?.code||e?.message||e));}}));
  if(aba==='encontros'){
   atualizarRelogio();
   acao('[data-amb]',(e,el)=>{estado.ambiente=el.value;salvar();desenhar();});
   acao('[data-play]',()=>{estado.ativo=!estado.ativo;ultimoTick=0;registrar(estado.ativo?'▶ Relógio iniciado':'⏸ Relógio pausado');desenhar();});
   acao('[data-mais]',async(e,el)=>{const m=Number(el.dataset.mais),antes=estado.minutos;estado.minutos+=m;for(let k=Math.floor(antes/10)+1;k<=Math.floor(estado.minutos/10);k++){await passaram10();if(estado.proposta)break;}salvar();desenhar();});
   acao('[data-zerar]',()=>{if(!win.confirm('Zerar o tempo neste local?'))return;estado.minutos=0;estado.perigoAtivo=null;registrar('↺ Relógio zerado');desenhar();});
   acao('[data-escala]',(e,el)=>{estado.escala=Number(el.value)||10;salvar();});
   acao('[data-rolar]',()=>proporEncontro(true));
   acao('[data-aprovar]',()=>aprovar());
   acao('[data-surg]',(e,el)=>{estado.surgimento=el.value;salvar();});
   acao('[data-outro]',()=>{estado.proposta=null;proporEncontro(true);});
   acao('[data-descartar]',()=>{registrar(`✖ Descartado: ${estado.proposta?.nome}`);estado.proposta=null;desenhar();});
   acao('[data-fim-perigo]',async()=>{await aplicarVisual({perigo:null});estado.perigoAtivo=null;registrar('🧯 Perigo encerrado.');desenhar();});
  }
  if(aba==='clima'){
   const a=AMBIENTES_DIRETOR[estado.ambiente]||AMBIENTES_DIRETOR.esgoto;
   acao('[data-clima]',async(e,el)=>{const c=a.climas[Number(el.dataset.clima)];await aplicarVisual({clima:c.clima,intensidadeClima:c.intensidade||1});registrar(`⛅ ${c.nome}`);st('Aplicado: '+c.nome);});
   acao('[data-sortear-clima]',async()=>{const c=sortearClima(estado.ambiente);await aplicarVisual({clima:c.clima,intensidadeClima:c.intensidade||1});registrar(`⛅ Sorteado: ${c.nome}`);st('Sorteado: '+c.nome);});
   acao('[data-luz]',async(e,el)=>{await aplicarVisual({ambiente:el.dataset.luz});st('Luz: '+el.dataset.luz);});
   acao('[data-auto]',(e,el)=>{estado.climaAuto=el.checked;salvar();});
  }
  if(aba==='notas'){
   acao('[data-colocar]',()=>{const t=$('[data-titulo]').value.trim();if(!t)return st('Escreva um título.');colocando={titulo:t,texto:$('[data-texto]').value.trim(),icone:$('[data-icone]').value,revelada:$('[data-revelar]').checked};instalarCapturaMapa();board()?.classList.add('md-colocando');st('Clique no mapa para colocar a nota…');});
   acao('[data-notas-cena]',async()=>{
    const cen=(dep.cenarios?.()||[]).find(c=>String(c.mapaId||'')===mapaId);if(!cen)return;
    const itens=[['🤫','Segredos',cen.segredos],['🎲','Testes sugeridos',cen.testesSugeridos],['⚡','Eventos',cen.eventos],['👾','Encontros',cen.encontros],['🎯','Objetivo',cen.objetivo]].filter(([,,v])=>String(v||'').trim());
    itens.forEach(([icone,titulo,texto],i)=>{estado.notas=[...(estado.notas||[]),{id:crypto.randomUUID(),x:3+i*5.2,y:1.4,titulo,texto:String(texto),icone,revelada:false}];});
    salvar();desenharPinos();desenhar();
   });
  }
  if(aba==='npc')gerador.ligar(gaveta,desenhar);
  if(aba==='bichos'&&painelCr)painelCr.ligar(gaveta,async()=>{await painelCr.recarregar();desenhar();});
 }

 // ---------------------------------------------------------------- ciclo
 let ultimoMapa=null;
 const vigia=setInterval(async()=>{
  try{
   instalarBotao();instalarAtalhos();try{if(ehMestre())cartao?.tick();}catch(e){console.warn('[Diretor] cartão',e);}
   const id=mapaVisivel();
   if(id!==ultimoMapa){ultimoMapa=id;fecharBalao();await carregarEstado(id);observarNotasPublicas(id);desenhar();}
   if(ehMestre())tick();
   desenharPinos();
  }catch(e){console.warn('[Diretor]',e);}
 },2000);
 return {abrir,fechar,estado:()=>estado,parar:()=>{clearInterval(vigia);pararNotas?.();}};
}
