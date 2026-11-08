import {instalarLatidoMesa} from './mesa-latido.js';
import {ocupadoNoArrasto} from './mesa-arrasto-regras.js';
import {acomodarPainelMapa} from './mesa-paineis-layout.js';
import {perfilRT,exigirAtaqueRT,psiOfensivoRT,MODOS_RT} from './mesa-atitudes-dados.js?v=183';
// Mesa Estelar v111 — Combate em tempo real (modo opcional).
//
// • O mestre liga pelo botão ⚡ nas ferramentas do mapa. O combate por turnos continua igual
//   e não pode estar ativo ao mesmo tempo.
// v207 — modo diretor: na aba em que o mestre abriu "?verComo=<token>" (mesaDiretorV206_),
//   esse token luta MANUALMENTE como um PJ (a IA solta ele em todas as abas via auto=false;
//   o mestre devolve à IA marcando 🤖 no painel ⚙️). Escolhas de crítico/consciência e a
//   barra de recarga passam a ser "dele" nessa aba.
// • Criaturas, NPCs (e personagens marcados como 🤖 automático) agem sozinhos: escolhem o
//   inimigo mais próximo, andam até ele desviando de paredes e atacam quando a recarga acaba.
//   Mais ações por turno = recarga menor e passo mais rápido.
// • Jogadores continuam usando o painel de ações normal; no tempo real o ataque respeita a
//   recarga do personagem e a defesa e os efeitos são escolhidos automaticamente (modo rápido).
// • Tudo roda no navegador do mestre, usando as MESMAS regras de ataque/dano/armadura da mesa.
// • ⏸ pausa tudo na hora. Facções permitem criaturas lutarem entre si.
//
// Segurança: módulo à parte. Se falhar, o mapa e o combate por turnos seguem normais.

import {FACCOES,RODADA_S,ehJogador,faccaoDe,faccaoPadrao,hostis,intervaloAcaoMs,velocidadeMs,paraMetros,deMetros,diametro,distanciaBordas,estadoVivo,
 escolherAlvo,escolherAtaque,montarGrade,caminho,avancar,combateAcabou,melhorDefesa,escolherEfeitos,
 COMPORTAMENTOS,perfilCombate,descreverPerfil,fracaoVida,escolherAlvoPerfil,hostisEntre,pontoDeFuga,chanceDeTrocar,cabecasDe,alvoDaCabeca} from './mesa-tempo-real-ia.js?v=133';
import {linhaBloqueadaPorObjetos,conterTokenNoMapa} from './nova-colisao.js?v=59';
import {camadaEntidade} from './nova-camadas.js?v=48';
import {alvosNoCone} from './nova-area.js?v=20260918';
import {gravidade,localParaTratar,ehMedico,vontadeDeSocorrer,papelTatico,DISTANCIA_SEGURA,testeConsciencia,restanteRelogio,escolherPsi,planejarManobra,emComa,escolherAtitude,linhaDeVisaoLivre,ALCANCE_VISAO,reacaoMs,percebe} from './mesa-tempo-real-tatica.js?v=186';

const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',CMDS=MAP+'/acoes';
const HEALTH='combatesAtivos/mapaMesaSyncSaude',HIST='combatesAtivos/mapaMesaSyncHistorico',SCENE='combatesAtivos/mapaMesaSyncDiretaCena';
export const ESTADO='combatesAtivos/mesaTempoReal';
// Só a pausa explícita do mestre congela o jogo; pausas legadas são migradas.
export function estadoContinuo(rt={},mapId,agora=Date.now()){
 const mesmo=rt.mapId===String(mapId),emergencia=rt.pausaEmergencia===true;
 return {...rt,ativo:true,continuoV214:true,pausado:emergencia,pausaEmergencia:emergencia,mapId:String(mapId),
  escolha:null,mensagem:emergencia?'Jogo pausado pelo mestre.':'',
  iniciadoEm:mesmo&&rt.iniciadoEm?rt.iniciadoEm:agora,atualizadoEm:agora,...(!mesmo?{prontoEm:{}}:{})};
}
const CHAVES_POS=['nome','imagem','donoUid','x','y','revision','movementTurn','movementUsed','movementMax','teleportNonce','facing','camada','mapaId','diametroM','atributosIndividuo','spriteIdV199','atitudeV200','grupoV200','territorioMV200','casaV200','personalidadeV200','confiancaV200','ajudaV200','dietaV200','bonusAtaqueV200','bonusDefesaV200','arte3dV200','arte3dAjusteV203','visualV203','activeSkillId','activeWeaponId','activeDefenseId','habitatV205']; // v200: as marcas das miniaturas e das atitudes não se perdem ao atacar; v131: o tamanho (diametroM) não se perde ao atacar
const soPosicao=p=>Object.fromEntries(Object.entries(p||{}).filter(([k,v])=>CHAVES_POS.includes(k)&&v!==undefined));
const clean=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const semente=()=>crypto.getRandomValues(new Uint32Array(1))[0];
const rngDe=s=>{let x=s>>>0||1;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};};

const CSS=`
#rtBarra{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:40;display:flex;gap:6px;align-items:center;padding:5px 10px;border-radius:999px;background:rgba(10,16,30,.88);border:1px solid #ffb347;color:#fff2dd;font:600 12px 'Segoe UI',Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.45);pointer-events:auto;white-space:nowrap}
#rtBarra[hidden]{display:none}
#rtBarra button{min-width:30px;height:26px;border-radius:999px;border:1px solid #ffb347;background:#2a1d0c;color:#ffe2b3;cursor:pointer;font:600 12px 'Segoe UI',Arial,sans-serif;padding:0 8px}
#rtBarra .rt-pausado{color:#8ee7ff}
#rtEscolha{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:10040;display:flex;flex-direction:column;gap:6px;min-width:260px;max-width:min(420px,92%);padding:10px 12px;border-radius:12px;background:rgba(18,12,4,.95);border:2px solid #ffd447;color:#fff3d1;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.5)}
#rtEscolha b{color:#ffd447;font-size:15px}
#rtConsciencia{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);z-index:45;display:flex;gap:10px;align-items:center;padding:9px 12px;border-radius:12px;background:rgba(14,20,38,.95);border:1px solid #8ee7ff;color:#dfe9f8;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5)}
#rtConsciencia button{height:30px;border-radius:8px;border:1px solid #3fae6a;background:#1d6b3e;color:#fff;font-weight:700;cursor:pointer;padding:0 10px}
#rtConsciencia small{color:#8ee7ff;font-weight:700}
#rtEscolha small{color:#ffcf8a;font-weight:700}
#rtEscolha select{height:28px;border-radius:7px;background:#20170a;color:#fff;border:1px solid #8a6a2a;margin-left:6px}
#rtEscolha .rt-ef{display:flex;flex-wrap:wrap;gap:4px 10px}
#rtEscolha button{height:30px;border-radius:8px;border:1px solid #3fae6a;background:#1d6b3e;color:#fff;font-weight:700;cursor:pointer}
#rtBarra .rt-recarga{display:inline-block;width:70px;height:8px;border-radius:5px;background:#3a2b18;overflow:hidden;vertical-align:middle}
#rtBarra .rt-recarga i{display:block;height:100%;background:#ffb347;width:0}
#rtGaveta{position:fixed;top:70px;right:12px;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - 90px);overflow:auto;z-index:9990;background:#121a2e;border:1px solid #ffb347;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;padding:12px;box-shadow:0 18px 50px rgba(0,0,0,.6)}
#rtGaveta[hidden]{display:none}
#rtGaveta h3{margin:0 0 6px;color:#ffcf8a;font-size:15px;display:flex;align-items:center;gap:8px}
#rtGaveta h3 span{flex:1}
#rtGaveta .rt-linha{display:flex;gap:6px;align-items:center;margin:6px 0;flex-wrap:wrap}
#rtGaveta .rt-turnos{margin:4px 0;font-size:12px;color:#c9d3e6}#rtGaveta .rt-turnos summary{cursor:pointer;opacity:.8}
#rtGaveta .rt-linha>button{flex:1}
#rtGaveta .rt-token{display:grid;grid-template-columns:1fr 128px 44px;gap:6px;align-items:center;padding:5px 6px;border-radius:8px;background:rgba(255,255,255,.04);margin:4px 0}
#rtGaveta .rt-token b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
#rtGaveta .rt-token.morto b{text-decoration:line-through;opacity:.55}
#rtGaveta select{width:100%;box-sizing:border-box}
#rtGaveta .rt-ajuda{color:#9fb3cc;font-size:12px;line-height:1.4}
#rtGaveta .rt-st{min-height:1.3em;color:#ffe2b3;margin:6px 0}
#rtGaveta .rt-perfil{grid-column:1/-1;display:grid;grid-template-columns:1fr 172px;gap:6px;align-items:center;font-size:11px;color:#9fb3cc}
#rtGaveta .rt-perfil span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* v113: no tempo real as criaturas deslizam entre um passo e outro (sem "travar") */
#novaSyncBoard.rt-ativo [data-token^="sync"]{transition:left .5s linear,top .5s linear!important}
`;

export function instalarTempoReal(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 win.mesaJogoPausadoV214=()=>estado?.pausaEmergencia===true;
 const api=()=>dep.api?.()||null;
 if(!root.getElementById('rtCssV111')){const st=root.createElement('style');st.id='rtCssV111';st.textContent=CSS;root.head.append(st);}

 let estado={ativo:false},mapa=null,health={actors:{}},cena=null,cenaSalva=null,tokens=new Map(),parar=[],gaveta=null,barra=null,erros=[];
 let pendentes=0,geracao=0,rodandoFila=false;const jobs=[],naFila=new Set();
 const dados=new Map(),carregando=new Map(),prontoEm=new Map(),ultimoMov=new Map(),indisponivel=new Map(),bloqueioAte=new Map(),agressor=new Map(),defesas=new Map();
 let grade=null,gradeChave='',houveLuta=false,ultimoProntoGravado=0;
 const alvoAtual=new Map(),provocacao=new Map(),cabecaProx=new Map(); // v132: próxima cabeça das criaturas de várias cabeças
 const modeloDe=t=>{const id=decodeURIComponent(String(t?.id||''));if(!id.startsWith('synccriatura:'))return null;const b=id.slice(13).split('~')[0];return (dep.criaturas?.()||[]).find(c=>String(c.id)===b)||null;};
 const nCabecas=t=>{try{return cabecasDe(modeloDe(t));}catch(_){return 0;}}; // v131: alvo fixo de cada criatura e quem a atacou por último
 const fugindo=new Set(),ameaca=new Map(),movendo=new Set(),avisouFuga=new Set();
 const atitudeEm=new Map(); // v185: última troca de atitude de cada criatura
 const alerta=new Map(); // v186: id → Map(inimigo → {desde,visto}): quem a criatura viu ou soube pela luta
 const perfilDe=(t,d)=>perfilCombate(d||{},estado?.comportamento?.[t.id]||win.mesaAtitudesIaV200?.comportamentoRT?.(t)||'auto'); /* v200: personalidade (covarde, teimosa, furiosa) */
 const dims=()=>({W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14});
 const noMapa=()=>[...tokens.values()].filter(t=>mapa?.mapId&&String(t.mapaId||'')===String(mapa.mapId)&&mapa?.joined?.[t.id]!==false);
 const automaticoRaw=t=>{const v=estado?.auto?.[t.id];return v===undefined?!ehJogador(t):!!v;};
 // v207: no modo diretor (aba do mestre como jogador), o token escolhido é manual nesta aba —
 // luta como um PJ (comandos da própria aba), e a IA para de dirigi-lo em todas (auto=false).
 const dirV207=()=>String(win.mesaDiretorV206_||'');
 const automatico=t=>{if(t&&dirV207()&&String(t.id)===dirV207())return false;return automaticoRaw(t);};
 const vel=()=>Math.max(.25,Number(estado?.velocidade)||1);

 function falha(e){
  if(/cancelado/.test(String(e?.message||e)))return;
  console.warn('[Tempo real]',e);const agora=Date.now();erros=erros.filter(t=>agora-t<60000);erros.push(agora);
  if(erros.length===8)dep.avisar?.('Há erros no processamento de ações: '+(e?.message||e));
 }
 async function gravarEstado(parcial){
  if(!ehMestre())return;
  try{await dep.setDoc(D(ESTADO),clean({...parcial,atualizadoEm:Date.now()}),{merge:true});}catch(e){console.warn('[Tempo real] estado',e);}
 }

 // ------------------------------------------------------------ dados das fichas
 async function dadosDe(t){
  const d=dados.get(t.id);if(d&&Date.now()-d.lido<30000)return d;
  if(carregando.has(t.id))return carregando.get(t.id);
  const p=(async()=>{try{const x=await api().dados({...t});const v={...x,lido:Date.now()};dados.set(t.id,v);return v;}finally{carregando.delete(t.id);}})();
  carregando.set(t.id,p);return p;
 }
 function defesasRestantes(id,acoes,atores=health?.actors,rt=estado){
  acoes=Math.ceil((Number(acoes)||1)*perfilRT(atores?.[id],rt,mapa).reserva);
  const janela=Math.floor(Date.now()/(RODADA_S*1000/vel())),d=defesas.get(id);
  if(!d||d.janela!==janela)return Math.max(1,Number(acoes)||1);
  return Math.max(0,Math.max(1,Number(acoes)||1)-d.usadas);
 }
 function gastarDefesa(id){
  const janela=Math.floor(Date.now()/(RODADA_S*1000/vel())),d=defesas.get(id);
  defesas.set(id,!d||d.janela!==janela?{janela,usadas:1}:{janela,usadas:d.usadas+1});
 }

 // ------------------------------------------------------------ resolução de um ataque
 // Mesmo resolvedor da mesa; defesa e efeitos escolhidos automaticamente.
 async function resolverAtaque(info){
  const a0=tokens.get(info.actorId),b0=tokens.get(info.targetId);
  if(!a0||!b0)throw Error('Participante não está no mapa.');
  const prep=await api().preparar({...a0},{...b0},{personagemId:info.actorId,targetId:info.targetId,targetKind:'character',skillId:info.skillId,weaponId:info.weaponId,seed:info.seed});
  if(prep.area)return resolverArea(info,prep); // v132: cone a partir do atacante (Trombeta, Eco da Matilha…)
  const dB=await dadosDe(b0).catch(()=>({acoes:1}));
  const perguntar=false; // efeitos automáticos no jogo contínuo, sem pausa coletiva
  const {W,H}=dims();let saida=null;
  await dep.runTransaction(dep.db,async tx=>{
   const g=async p=>{const s=await tx.get(D(p));return s.exists()?s.data():null;};
   const map=await g(MAP)||{},hp=await g(HEALTH)||{actors:{},revision:0},hist=await g(HIST)||{entries:[],revision:0},scene=await g(SCENE);
   const a=await g(POS+'/'+info.actorId),b=await g(POS+'/'+info.targetId);
   const cmdPath=info.cmdId?CMDS+'/'+info.cmdId:null,cmd=cmdPath?await g(cmdPath):null;
   const sheet=prep.targetSheetPath?await g(prep.targetSheetPath):null;
   if(cmdPath&&cmd?.status!=='pending')return;
   if(!a||!b)throw Error('Participante removido do mapa.');
   if(map.combat?.active)throw Error('Há um combate por turnos ativo.');
   const arrastos=await g('combatesAtivos/mesaArrastos');if(ocupadoNoArrasto(arrastos,info.actorId))throw Error('Solte a carga para atacar.');
   const rtAtual=await g(ESTADO);if(!rtAtual?.ativo||rtAtual.mapId!==map.mapId||rtAtual.pausado)throw Error('Combate em tempo real parado ou pausado.');
   exigirAtaqueRT(hp.actors?.[info.actorId],rtAtual,map);
   const A={...a,id:info.actorId},B={...b,id:info.targetId},atores=hp.actors||{};
   const resta=defesasRestantes(B.id,dB.acoes,hp.actors,rtAtual);
   const falso={...map,rtContext:rtAtual,combat:{active:true,schema:2,session:'rt',round:1,roundId:'rt',turnId:null,order:[],queue:[],actors:{},initial:{[B.id]:{remaining:resta,passes:0}},defenses:{roundId:'rt',values:{[B.id]:resta}}}};
   const pre=prep(A,B,atores,falso,{phase:'preview',choice:null},scene,sheet);
   const choice=pre?.pending?ocupadoNoArrasto(arrastos,B.id)?'none':melhorDefesa(pre.pending,B.activeDefenseId):'none';
   let r=prep(A,B,atores,falso,{phase:'resolve',choice,effectsConfirmed:false,effects:[],local:''},scene,sheet);
   if(r?.effectsPending){if(perguntar){saida={pendente:r.effectsPending};return;}const e=info.escolha||escolherEfeitos(r.effectsPending,rngDe(info.seed));r=prep(A,B,atores,falso,{phase:'resolve',choice,effectsConfirmed:true,effects:e.effects,local:e.local},scene,sheet);}
   if(!r?.event)throw Error('Ataque sem resultado.');
   const actors={...atores};for(const [k,v] of Object.entries(r.actors||{}))actors[k]={...actors[k],...v};
   {const S=win.mesaModoSimplesV200;if(S?.ativo?.())for(const k of [A.id,B.id])if(actors[k]?.combateLab)actors[k]={...actors[k],combateLab:S.colapsar(actors[k].combateLab)};} // v200: um PV só (sem partes do corpo)
   const id=info.cmdId||('rt:'+crypto.randomUUID());
   const event={...r.event,id,ts:Date.now(),mapId:String(map.mapId||''),actorUid:a.donoUid||'',targetUid:b.donoUid||'',source:{id:A.id,x:a.x,y:a.y},target:{id:B.id,x:b.x,y:b.y},...(Number.isInteger(info.cabeca)?{cabeca:info.cabeca}:{}),message:'⚡ '+String(r.event.message||'')};
   tx.set(D(HEALTH),clean({...hp,actors,revision:Number(hp.revision||0)+1,event}));
   tx.set(D(HIST),clean({entries:[...(hist.entries||[]),event].slice(-120),revision:Number(hist.revision||0)+1}));
   if(r.targetSheetPatch&&prep.targetSheetPath&&sheet)tx.set(D(prep.targetSheetPath),clean({...sheet,...r.targetSheetPatch}));
   const facing=Math.atan2((b.y-a.y)*H/14,(b.x-a.x)*W/28);
   tx.set(D(POS+'/'+info.actorId),clean(soPosicao({...a,facing:Number(facing.toFixed(3)),revision:Number(a.revision||0)+1})));
   if(cmdPath)tx.set(D(cmdPath),clean({...cmd,status:'done',message:event.message}));
   saida={r,choice,event};
  });
  if(saida?.pendente){const e=await perguntarEfeitos(info,saida.pendente);return resolverAtaque({...info,escolha:e});}
  if(saida){houveLuta=true;if(saida.r.defenseSpent)gastarDefesa(info.targetId);agressor.set(info.targetId,info.actorId);agredido(info.targetId,info.actorId);if(alvoAtual.get(info.targetId)!==info.actorId)provocacao.set(info.targetId,info.actorId);
   const m=ameaca.get(info.targetId)||new Map();m.set(info.actorId,(m.get(info.actorId)||0)+1);ameaca.set(info.targetId,m);}
  return saida;
 }
 // v132: ataque em área (cone) no tempo real — parte do atacante na direção do alvo e atinge todos no cone.
 // Mesma rolagem de ataque para todos; cada um se defende sozinho (defesa automática) e o alvo central tem a penalidade do cone.
 async function resolverArea(info,prep0){
  const a0=tokens.get(info.actorId),aim=tokens.get(info.targetId),{W,H}=dims(),shape=prep0.area;
  const afetados=alvosNoCone(a0,aim,noMapa().filter(t=>t.id!==info.actorId),{larguraM:W,alturaM:H},shape).filter(t=>!health.actors?.[t.id]?.combateLab?.morto);
  if(health.actors?.[info.targetId]?.combateLab?.morto)throw Error('O alvo já está morto.');
  if(!afetados.some(t=>t.id===info.targetId))throw Error('Alvo central fora do alcance do cone.');
  const cmdBase={personagemId:info.actorId,targetId:info.targetId,targetKind:'character',skillId:info.skillId,weaponId:info.weaponId,seed:info.seed};
  const preps=new Map([[info.targetId,prep0]]),dd=new Map();
  for(const t of afetados){
   if(!preps.has(t.id))try{preps.set(t.id,await api().preparar({...a0},{...t},cmdBase));}catch(e){console.warn('[Tempo real] área',t.id,e);}
   dd.set(t.id,await dadosDe(t).catch(()=>({acoes:1})));
  }
  const rnd=rngDe(info.seed);let saida=null;
  await dep.runTransaction(dep.db,async tx=>{
   const g=async p=>{const s=await tx.get(D(p));return s.exists()?s.data():null;};
   const map=await g(MAP)||{},hp=await g(HEALTH)||{actors:{},revision:0},hist=await g(HIST)||{entries:[],revision:0},scene=await g(SCENE);
   const a=await g(POS+'/'+info.actorId),cmdPath=info.cmdId?CMDS+'/'+info.cmdId:null,cmd=cmdPath?await g(cmdPath):null;
   if(cmdPath&&cmd?.status!=='pending')return;
   if(!a)throw Error('Participante removido do mapa.');
   if(map.combat?.active)throw Error('Há um combate por turnos ativo.');
   const arrastos=await g('combatesAtivos/mesaArrastos');if(ocupadoNoArrasto(arrastos,info.actorId))throw Error('Solte a carga para atacar.');
   const rtAtual=await g(ESTADO);if(!rtAtual?.ativo||rtAtual.mapId!==map.mapId||rtAtual.pausado)throw Error('Combate em tempo real parado ou pausado.');
   const alvos=[];for(const t of afetados){const b=await g(POS+'/'+t.id),f=preps.get(t.id);if(b&&f)alvos.push({B:{...b,id:t.id},f,sheet:f.targetSheetPath?await g(f.targetSheetPath):null});}
   const A={...a,id:info.actorId},atores=hp.actors||{},actors={...atores},events=[],gastas=[],patches=[];
   const initial={},values={};for(const {B} of alvos){const r=defesasRestantes(B.id,dd.get(B.id)?.acoes,hp.actors,rtAtual);initial[B.id]={remaining:r,passes:0};values[B.id]=r;}
   const falso={...map,rtContext:rtAtual,combat:{active:true,schema:2,session:'rt',round:1,roundId:'rt',turnId:null,order:[],queue:[],actors:{},initial,defenses:{roundId:'rt',values}}};
   for(const {B,f,sheet} of alvos){
    try{
     const pre=f(A,B,atores,falso,{phase:'preview',choice:null},scene,sheet),choice=pre?.pending?(ocupadoNoArrasto(arrastos,B.id)?'none':melhorDefesa(pre.pending,B.activeDefenseId)):'none';
     let r=f(A,B,atores,falso,{phase:'resolve',choice,effectsConfirmed:false,effects:[],local:''},scene,sheet);
     if(r?.effectsPending){const e=escolherEfeitos(r.effectsPending,rnd);r=f(A,B,atores,falso,{phase:'resolve',choice,effectsConfirmed:true,effects:e.effects,local:e.local},scene,sheet);}
     if(!r?.event)continue;
     for(const [k,v] of Object.entries(r.actors||{}))actors[k]={...actors[k],...v};
     if(r.defenseSpent)gastas.push(B.id);
     if(r.targetSheetPatch&&f.targetSheetPath&&sheet)patches.push([f.targetSheetPath,{...sheet,...r.targetSheetPatch}]);
     events.push({...r.event,id:(info.cmdId||'rt')+':'+B.id+':'+Date.now().toString(36),ts:Date.now(),mapId:String(map.mapId||''),actorUid:a.donoUid||'',targetUid:B.donoUid||'',source:{id:A.id,x:a.x,y:a.y},target:{id:B.id,x:B.x,y:B.y},message:'⚡ '+String(r.event.message||'')});
    }catch(e){console.warn('[Tempo real] área',B.id,e);}
   }
   if(!events.length)throw Error('Ataque em área sem resultado.');
   const id=info.cmdId||('rt:'+crypto.randomUUID());
   const event={...events[0],id,mapId:String(map.mapId||''),area:{...shape,source:{x:a.x,y:a.y},aim:{x:aim.x,y:aim.y},width:W,height:H},message:'⚡ 💥 '+(shape.name||'Ataque em área')+' em cone: '+events.map(e=>e.message.replace(/^⚡ /,'')).join(' | ')};
   tx.set(D(HEALTH),clean({...hp,actors,revision:Number(hp.revision||0)+1,event}));
   tx.set(D(HIST),clean({entries:[...(hist.entries||[]),...events].slice(-120),revision:Number(hist.revision||0)+1}));
   for(const [p,v] of patches)tx.set(D(p),clean(v));
   const facing=Math.atan2((aim.y-a.y)*H/14,(aim.x-a.x)*W/28);
   tx.set(D(POS+'/'+info.actorId),clean(soPosicao({...a,facing:Number(facing.toFixed(3)),revision:Number(a.revision||0)+1})));
   if(cmdPath)tx.set(D(cmdPath),clean({...cmd,status:'done',message:event.message}));
   saida={r:{defenseSpent:false},event,gastas,ids:alvos.map(x=>x.B.id)};
  });
  if(saida){houveLuta=true;for(const id of saida.gastas)gastarDefesa(id);
   for(const id of saida.ids){agressor.set(id,info.actorId);agredido(id,info.actorId);if(alvoAtual.get(id)!==info.actorId)provocacao.set(id,info.actorId);const m=ameaca.get(id)||new Map();m.set(info.actorId,(m.get(info.actorId)||0)+1);ameaca.set(id,m);}}
  return saida;
 }
 // v123: fila com prioridade. Ataques dos jogadores passam na frente; ações das criaturas que
 // ficaram para trás são canceladas ao pausar/encerrar, e cada criatura tem no máximo uma na fila.
 // (Antes a fila crescia sem fim: as criaturas seguiam atacando depois do ⏸ e o ataque do jogador
 // ficava "carregando" atrás de vários ataques delas.)
 function enfileirar(fn,{prioridade=1,ator=''}={}){
  return new Promise((res,rej)=>{jobs.push({fn,prioridade,ator,ger:geracao,res,rej});if(ator)naFila.add(ator);pendentes++;void tocarFila();});
 }
 async function tocarFila(){
  if(rodandoFila)return;rodandoFila=true;
  try{
   while(jobs.length){
    jobs.sort((a,b)=>a.prioridade-b.prioridade);const j=jobs.shift();
    if(j.prioridade>0&&(j.ger!==geracao||!estado?.ativo||estado.pausado)){pendentes--;if(j.ator)naFila.delete(j.ator);j.rej(Error('cancelado'));continue;}
    try{j.res(await j.fn());}catch(e){j.rej(e);}finally{pendentes--;if(j.ator)naFila.delete(j.ator);}
   }
  }finally{rodandoFila=false;}
 }
 function cancelarFila(){geracao++;}
 function pausarLocal(pausado){estado={...(estado||{}),pausado};if(pausado)cancelarFila();desenharBarra();}
 async function pausarJogo(pausado){
  if(!ehMestre())throw Error('Somente o mestre pode pausar o jogo.');
  await iniciarRT();let proximo=null;
  await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(ESTADO));proximo={...(s.exists()?s.data():{}),pausado:!!pausado,pausaEmergencia:!!pausado,escolha:null,mensagem:'',atualizadoEm:Date.now()};tx.set(D(ESTADO),clean(proximo));});
  estado=proximo;pausarLocal(!!pausado);return true;
 }

 // Comandos de ataque dos jogadores enquanto o tempo real está ligado (gancho em nova-ataques).
 async function assumir(cmdId,command){
  const dir=dirV207()&&String(command.personagemId)===dirV207();
  if((!ehMestre()&&!dir)||!estado?.ativo||mapa?.combat?.active)return false;
  exigirAtaqueRT(health?.actors?.[command.personagemId],estado,mapa);
  if(command.targetKind==='object'||command.powerId)return false;
  if(estado.pausado)throw Error('Combate em tempo real pausado pelo mestre.');
  const t=tokens.get(command.personagemId);if(!t)throw Error('Personagem não está no mapa.');
  {const st=health?.actors?.[t.id]?.combateLab,n=Number(st?.ataquesBloqueadosTurnos)||0;if(n>0)throw Error('Em choque pela ferida: sem ataques por mais '+n+' rodada(s) de 5 s.');if(health?.actors?.[t.id]?.treatment)throw Error('Ocupado com Primeiros Socorros.');}
  const d=await dadosDe(t).catch(()=>null),agora=Date.now(),pronto=prontoEm.get(t.id)||0;
  if(pronto>agora)throw Error('Recarregando: pronto em '+((pronto-agora)/1000).toFixed(1).replace('.',',')+' s.');
  const intervalo=intervaloAcaoMs(d?.acoes||1,vel())*perfilRT(health?.actors?.[t.id],estado,mapa).intervalo;prontoEm.set(t.id,agora+intervalo);
  void gravarEstado({prontoEm:{[t.id]:agora+intervalo}});
  try{await enfileirar(()=>resolverAtaque({cmdId,actorId:command.personagemId,targetId:command.targetId,skillId:command.skillId,weaponId:command.weaponId,seed:Number.isInteger(command.seed)?command.seed:semente()}),{prioridade:0});}
  catch(e){prontoEm.set(t.id,agora+700);throw e;}
  return true;
 }

 // v140: poderes psíquicos dos jogadores no tempo real — mesma recarga das ações, resolvidos aqui (sem turno).
 async function assumirPsi(cmdId,command){
  const dir=dirV207()&&String(command.personagemId)===dirV207();
  if((!ehMestre()&&!dir)||!estado?.ativo||mapa?.combat?.active)return false;
  if(estado.pausado)throw Error('Combate em tempo real pausado pelo mestre.');
  const t=tokens.get(command.personagemId);if(!t)throw Error('Personagem não está no mapa.');
  if(psiOfensivoRT(command.powerId,t.id,command.targetId))exigirAtaqueRT(health?.actors?.[t.id],estado,mapa);
  const st=health?.actors?.[t.id]?.combateLab;if(st?.inconsciente||st?.morto)throw Error('Inconsciente: não dá para usar psi.');
  if(health?.actors?.[t.id]?.treatment)throw Error('Ocupado com Primeiros Socorros.');
  const d=await dadosDe(t).catch(()=>null),agora=Date.now(),pronto=prontoEm.get(t.id)||0;
  if(pronto>agora)throw Error('Recarregando: pronto em '+((pronto-agora)/1000).toFixed(1).replace('.',',')+' s.');
  const intervalo=intervaloAcaoMs(d?.acoes||1,vel())*perfilRT(health?.actors?.[t.id],estado,mapa).intervalo;prontoEm.set(t.id,agora+intervalo);void gravarEstado({prontoEm:{[t.id]:agora+intervalo}});
  const {status,engineVersion,personagemId,donoUid,...resto}=command;
  try{await enfileirar(()=>executarSuporte(t.id,String(command.targetId||t.id),{...resto,kind:'direct-psi',turnId:null},cmdId),{prioridade:0,ator:t.id});}
  catch(e){prontoEm.set(t.id,agora+700);throw e;}
  return true;
 }

 // ------------------------------------------------------------ v123: crítico/acerto especial pausa para escolher
 // Quando quem acerta é controlado por alguém (jogador ou mestre atuando), o tempo real pausa por
 // alguns segundos para a pessoa escolher o local e os efeitos. Sem resposta, a escolha é automática.
 const ESCOLHA_MS=10000;
 const dormir=ms=>new Promise(r=>setTimeout(r,ms));
 async function perguntarEfeitos(info,pend){
  const a=tokens.get(info.actorId),b=tokens.get(info.targetId);
  const id='esc_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const escolha=clean({id,actorId:String(info.actorId),donoUid:String(a?.donoUid||''),ator:String(a?.nome||''),alvo:String(b?.nome||''),critico:!!pend.critical,
   max:Math.max(0,Number(pend.maxEffects)||0),opcoes:(pend.options||[]).map(o=>({id:String(o.id),nome:String(o.nome||o.label||o.rotulo||o.id),descricao:String(o.descricao||o.description||'').slice(0,160)})),
   locais:(pend.locations||[]).map(String),expira:Date.now()+ESCOLHA_MS});
  const jaPausado=!!estado?.pausado;
  estado={...(estado||{}),pausado:true,escolha};cancelarFila();desenharBarra();desenharEscolha();
  await gravarEstado({pausado:true,escolha,mensagem:(escolha.critico?'⭐ Crítico':'🎯 Acerto especial')+' de '+escolha.ator+': escolhendo local/efeito…'});
  let resp=null;
  while(Date.now()<escolha.expira+600){
   try{const s=await dep.getDoc(D(ESTADO+'/acoes/'+id));if(s.exists()){resp=s.data();break;}}catch(e){console.warn('[Tempo real] escolha',e);break;}
   if(estado?.ativo===false)break;
   await dormir(350);
  }
  const auto=escolherEfeitos(pend,rngDe(info.seed));
  let saida=auto;
  if(resp){const ok=new Set(escolha.opcoes.map(o=>o.id));
   saida={effects:[...new Set((resp.effects||[]).map(String))].filter(x=>ok.has(x)).slice(0,escolha.max),local:escolha.locais.includes(String(resp.local||''))?String(resp.local):''};}
  const continuar=estado?.ativo!==false&&!jaPausado&&estado?.escolha?.id===id;
  estado={...(estado||{}),escolha:null,...(continuar?{pausado:false}:{})};desenharEscolha();desenharBarra();
  await gravarEstado({escolha:null,mensagem:'',...(continuar?{pausado:false}:{})});
  return saida;
 }
 let escolhaEl=null,escolhaId='';
 function desenharEscolha(){
  const e=estado?.escolha,board=root.getElementById('novaSyncBoard');
  const minha=!!e&&Date.now()<Number(e.expira||0)+500&&((e.donoUid?e.donoUid===uid():ehMestre())||(dirV207()&&String(e.actorId)===dirV207()));
  if(!minha||!board){if(escolhaEl){escolhaEl.remove();escolhaEl=null;escolhaId='';}return;}
  const restam=Math.max(0,Math.ceil((Number(e.expira)-Date.now())/1000));
  if(escolhaEl&&escolhaId===e.id&&escolhaEl.isConnected){const c=escolhaEl.querySelector('[data-conta]');if(c)c.textContent=restam+' s';return;}
  escolhaEl?.remove();escolhaId=e.id;escolhaEl=root.createElement('div');escolhaEl.id='rtEscolha';
  escolhaEl.innerHTML=`<b>${e.critico?'⭐ Acerto crítico!':'🎯 Acerto especial!'}</b> <span>${esc(e.ator)} → ${esc(e.alvo)}</span> <small data-conta>${restam} s</small>
   ${e.locais?.length?`<label>Local do acerto <select data-local><option value="">— automático —</option>${e.locais.map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('')}</select></label>`:''}
   ${e.opcoes?.length&&e.max?`<div class="rt-ef">Efeitos (até ${e.max}):${e.opcoes.map(o=>`<label title="${esc(o.descricao)}"><input type="checkbox" value="${esc(o.id)}"> ${esc(o.nome)}</label>`).join('')}</div>`:''}
   <button type="button" data-ok>✅ Confirmar</button>`;
  escolhaEl.addEventListener('pointerdown',ev=>ev.stopPropagation());
  escolhaEl.addEventListener('change',ev=>{const marcados=[...escolhaEl.querySelectorAll('.rt-ef input:checked')];if(marcados.length>e.max)ev.target.checked=false;});
  escolhaEl.querySelector('[data-ok]').addEventListener('click',async ev=>{
   const b=ev.currentTarget;b.disabled=true;b.textContent='⏳';
   const effects=[...escolhaEl.querySelectorAll('.rt-ef input:checked')].map(i=>i.value),local=escolhaEl.querySelector('[data-local]')?.value||'';
   try{await dep.setDoc(D(ESTADO+'/acoes/'+e.id),{donoUid:uid(),personagemId:String(e.actorId),effects,local,criadoEm:Date.now()});b.textContent='✓ Enviado';}
   catch(err){console.warn('[Tempo real] escolha',err);b.textContent='Não foi possível (automático)';}
  });
  root.body.append(escolhaEl); // v205: fixa na tela (antes ficava dentro do mapa grande e podia estar fora da vista: o combate pausava 10 s sem ninguém ver o porquê)
 }

 // ------------------------------------------------------------ obstáculos
 function obstaculosMetros(camada){
  const {W,H}=dims(),out=[];
  if(!cena||String(cena.mapId||'')!==String(mapa?.mapId||''))return out;
  for(const o of cena.objects||[]){
   if(!o?.bloqueiaMovimento||o.destruido||globalThis.mesaPassavelV170_?.(o)||camadaEntidade(o)!==camada||!!(Number(o?.andarV144??o?.oficinaElement?.andarV144??1)>1))continue; // v144: andar de cima não barra o térreo
   out.push({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0});
  }
  return out;
 }
 /* v203: criaturas que VOAM (dragão-trombeta alado, vespa, mariposa, pterodátilo) passam por cima de muros, rochas, árvores e móveis (nada do térreo as barra);
    só o TELHADO as detém: para entrar numa casa elas precisam destruí-lo (a cena troca o telhado por "quebrado"). */
 const voa=t=>/alado|pterodatil|vespa|mariposa|voador/.test(String(decodeURIComponent(String(t?.id||''))+' '+(t?.nome||'')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
 const ehTelhado=o=>!!o&&!o.destruido&&(o.erTipo==='telhado'||o.tetoV139||o.oficina3==='teto')&&Number(o?.andarV144??1)<=2;
 let gradeVooChave='',gradeVooCache=null;
 function gradeDeVoo(){
  const {W,H}=dims(),objs=(cena?.objects||[]).filter(ehTelhado),chave=W+'x'+H+':'+(cena?.mapId||'')+':'+objs.map(o=>o.id+o.x+o.y).join(',');
  if(chave!==gradeVooChave||!gradeVooCache){gradeVooCache=montarGrade(objs.map(o=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14,larguraM:Number(o.larguraM)||1,alturaM:Number(o.alturaM)||1,angulo:Number(o.angulo)||0})),W,H);gradeVooChave=chave;}
  return gradeVooCache;
 }
 const quebrando=new Map();
 /** o voador está colado num telhado que cobre o alvo: depois de uns segundos de bicadas, o telhado cai */
 async function quebrarTelhado(t,alvo){
  const agora=Date.now();if((quebrando.get(t.id)||0)>agora-4500)return false;
  const {W,H}=dims(),a=paraMetros(alvo,W,H),p=paraMetros(t,W,H);
  const tel=(cena?.objects||[]).filter(ehTelhado).find(o=>{const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1,cx=Number(o.x)*W/28,cy=Number(o.y)*H/14;return Math.abs(a.x-cx)<=w/2&&Math.abs(a.y-cy)<=h/2&&Math.abs(p.x-cx)<=w/2+3.2&&Math.abs(p.y-cy)<=h/2+3.2;});
  if(!tel)return false;quebrando.set(t.id,agora);
  try{await dep.runTransaction(dep.db,async tx=>{const r=D(SCENE),s=await tx.get(r);if(!s.exists())return;const c=s.data();tx.set(r,clean({...c,objects:(c.objects||[]).map(o=>String(o.id)===String(tel.id)?{...o,destruido:true,nome:'Telhado quebrado',telhadoQuebradoV203:true}:o)}));});
   void registrar(`🐉 ${t.nome||'Criatura'} arranca o telhado para entrar.`);return true;}catch(e){console.warn('[Voo] telhado',e?.message||e);return false;}
 }
 function gradeAtual(){
  const {W,H}=dims(),chave=W+'x'+H+':'+(cena?.mapId||'')+':'+(cena?.editorRevision||0)+':'+(cena?.objects||[]).filter(o=>o.bloqueiaMovimento&&!o.destruido).length;
  if(chave!==gradeChave){grade=montarGrade(obstaculosMetros(3),W,H);gradeChave=chave;}
  return grade;
 }

 // ------------------------------------------------------------ cérebro (só no navegador do mestre)
 async function mover(t,alvo,d,agora,{parar:pararEm=null}={}){
  if(estado?.pausaEmergencia)return false;
  if(!(Number(d?.mov)>0))return false; // v132: sésseis (Cila) não saem do lugar
  const ult=ultimoMov.get(t.id)||0;if(agora-ult<480||movendo.has(t.id))return false;
  const dt=Math.min(1,ult?(agora-ult)/1000:.5);ultimoMov.set(t.id,agora);
  const {W,H}=dims(),de=paraMetros(t,W,H),para=paraMetros(alvo,W,H);
  const voador=voa(t),pts=caminho(voador?gradeDeVoo():gradeAtual(),de,para);
  if(voador&&(!pts.length||Math.hypot(pts[pts.length-1].x-para.x,pts[pts.length-1].y-para.y)>1.2))void quebrarTelhado(t,alvo); // o caminho para antes do alvo: tem telhado no meio
  if(!pts.length)return false;
  const passo=velocidadeMs(d.mov,d.acoes,vel())*dt*perfilRT(health?.actors?.[t.id],estado,mapa).velocidade*Number(win.mesaPosturaVelocidadeV140?.(t.id)??1)*Number(win.mesaTransporteVelocidadeV190?.(t.id)??1)*Number(win.mesaModoSimplesV200?.velocidadeFator?.(t.id)??1); // v140: agachado/rastejando/caído; v200: cansado anda devagar
  if(!(passo>0))return false;
  // para antes de encostar no alvo (a margem é o alcance corpo a corpo)
  const distCentro=Math.hypot(para.x-de.x,para.y-de.y),parar=pararEm??Math.max(0,(diametro(t)+diametro(alvo))/2+.35);
  const util=Math.min(passo,Math.max(0,distCentro-parar)+.05);if(util<.08)return false;
  win.mesaModoSimplesV200?.gastar?.(t.id,util*.35); // v200: correr e lutar cansa
  let novo=avancar(de,pts,util);
  // outros tokens: não atravessa ninguém
  for(const o of noMapa()){if(o.id===t.id)continue;const p=paraMetros(o,W,H),min=(diametro(t)+diametro(o))/2*.92,dd=Math.hypot(novo.x-p.x,novo.y-p.y);if(dd<min){const k=(min-dd)/Math.max(.01,dd);novo={x:novo.x+(novo.x-p.x)*k,y:novo.y+(novo.y-p.y)*k};}}
  let n=deMetros(novo,W,H);n=conterTokenNoMapa(t,n,mapa);
  const facing=Math.atan2((novo.y-de.y),(novo.x-de.x));
  if(Math.hypot((n.x-t.x)*W/28,(n.y-t.y)*H/14)<.05)return false;
  const rev=Number(t.revision||0)+1;tokens.set(t.id,{...t,x:n.x,y:n.y,facing,revision:rev});
  movendo.add(t.id);
  try{await dep.setDoc(D(POS+'/'+t.id),{x:Number(n.x.toFixed(3)),y:Number(n.y.toFixed(3)),facing:Number(facing.toFixed(3)),revision:rev},{merge:true});}
  finally{movendo.delete(t.id);}
  return true;
 }
 // Linha no histórico do combate (fuga, rendição…), sem mexer na vida de ninguém.
 async function registrar(msg){
  try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HIST)),h=s.exists()?s.data():{entries:[],revision:0};
   const ev={id:'rt:'+crypto.randomUUID(),ts:Date.now(),actorUid:'',targetUid:'',message:msg};
   tx.set(D(HIST),clean({entries:[...(h.entries||[]),ev].slice(-120),revision:Number(h.revision||0)+1}));});}catch(e){console.warn('[Tempo real] histórico',e);}
 }
 // v186: quem é atacado passa a saber do agressor na hora; quem está a até 10 m ouve a luta; neutro atacado se enfurece (vira "cada um por si")
 function lembrar(id,inimigoId,agora=Date.now()){const m=alerta.get(id)||new Map();const r=m.get(inimigoId);if(!r)m.set(inimigoId,{desde:agora-99999,visto:agora});else r.visto=agora;alerta.set(id,m);}
 function agredido(alvoId,agressorId){
  const agora=Date.now(),alvo=tokens.get(alvoId);lembrar(alvoId,agressorId,agora);if(!alvo)return;
  const {W,H}=dims();for(const o of noMapa()){if(o.id===alvoId||o.id===agressorId||!automatico(o))continue;if(distanciaBordas(alvo,o,W,H)<=10)lembrar(o.id,agressorId,agora);}
  if(automatico(alvo)&&faccaoDe(alvo,estado?.faccoes||{})==='neutros'){if(estado)estado={...estado,faccoes:{...(estado.faccoes||{}),[alvoId]:'selvagens'}};void gravarEstado({faccoes:{[alvoId]:'selvagens'}});void registrar(`😡 ${alvo.nome||'Criatura'} se enfurece e passa a atacar.`);}
 }
 // v185: a criatura troca de atitude pelo mesmo caminho do jogador (transação do módulo de atitudes); 1,5 s entre trocas
 async function trocarAtitude(t,modo,agora=Date.now()){
  const api=win.mesaAtitudesRT;if(!api?.processar||(atitudeEm.get(t.id)||0)>agora-1500)return false;atitudeEm.set(t.id,agora);
  try{await api.processar('ia_'+agora.toString(36)+'_'+t.id,{tokenId:t.id,personagemId:decodeURIComponent(String(t.id)),donoUid:'',modo,criadoEm:agora},true);
   const m=MODOS_RT[modo];if(modo!=='normal')void registrar(`${m.icone} ${t.nome||'Criatura'}: ${m.nome}.`);return true;}
  catch(e){if(!/Aguarde/.test(String(e?.message||e)))console.warn('[Tempo real] atitude',e?.message||e);return false;}
 }
 async function levantar(t){
  await dep.runTransaction(dep.db,async tx=>{
   const s=await tx.get(D(HEALTH)),hp=s.exists()?s.data():null,st=hp?.actors?.[t.id];if(!st?.combateLab)return;
   const actors={...hp.actors,[t.id]:{...st,combateLab:{...st.combateLab,caido:false,derrubado:false}}};
   tx.set(D(HEALTH),clean({...hp,actors,revision:Number(hp.revision||0)+1}));
  });
 }
 // ------------------------------------------------------------ v133: recuperação, primeiros socorros, psi
 const rodadaMs=()=>RODADA_S*1000/vel();
 const janelaAtual=()=>Math.floor(Date.now()/rodadaMs());
 const ultimoTesteCons=new Map(),pedidosCons=new Map(),socorro=new Map(),checandoPedido=new Set(),avisouComa=new Set();let janelaChoque=-1;
 const nomeDe=t=>String(t?.nome||'Personagem').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 async function anotarSaude(mexer,mensagem){
  // aplica uma mudança no estado de saúde de alguém e escreve no histórico (mesmo formato do combate)
  let feito=false;
  await dep.runTransaction(dep.db,async tx=>{
   const s=await tx.get(D(HEALTH)),hp=s.exists()?s.data():{actors:{},revision:0},h=await tx.get(D(HIST)),hh=h.exists()?h.data():{entries:[],revision:0};
   const actors=clean(hp.actors||{}),msg=mexer(actors);if(!msg)return;feito=true;
   const event={id:'rt:'+crypto.randomUUID(),ts:Date.now(),mapId:String(map?.mapId||''),actorUid:'',targetUid:'',message:msg};
   tx.set(D(HEALTH),clean({...hp,actors,event,revision:Number(hp.revision||0)+1}));
   tx.set(D(HIST),clean({entries:[...(hh.entries||[]),event].slice(-120),revision:Number(hh.revision||0)+1}));
  });
  return feito;
 }
 async function testarConsciencia(t,quem){
  const d=await dadosDe(t).catch(()=>({resistencia:0}));
  return anotarSaude(actors=>{
   const st=actors[t.id]?.combateLab;if(!st?.inconsciente||st.morto||emComa(st))return '';
   if(st.unconsciousClock&&restanteRelogio(st.unconsciousClock)>0)return '';
   const r=testeConsciencia({resistencia:d.resistencia,curas:st.curasConsciencia},1+Math.floor(Math.random()*100));
   if(!r.sucesso&&/^automático$/.test(quem||''))return ''; // v133: falha de quem é automático não enche o histórico
   if(r.sucesso){st.inconsciente=false;st.incapacitado=false;delete st.unconsciousClock;delete st.unconsciousUntilRound;delete st.inconscienteAteTurno;delete st.curasConsciencia;}
   return `💤 ${nomeDe(t)} · Teste de consciência${quem?' ('+quem+')':''} · Resistência ${d.resistencia}${r.bonus?' + '+r.bonus+' por cura':''} · ${r.die}/${r.valor} → ${r.grau} · ${r.sucesso?'recuperou a consciência':'continua inconsciente'}`;
  });
 }
 async function acordarPeloTempo(t){
  return anotarSaude(actors=>{const st=actors[t.id]?.combateLab;if(!st?.inconsciente||st.morto||!st.unconsciousClock||restanteRelogio(st.unconsciousClock)>0)return '';
   st.inconsciente=false;delete st.unconsciousClock;delete st.unconsciousUntilRound;return `💤 ${nomeDe(t)} recobra os sentidos (passou o tempo).`;});
 }
 async function passarChoque(ids){
  return anotarSaude(actors=>{const nomes=[];for(const id of ids){const st=actors[id]?.combateLab;if(st&&Number(st.ataquesBloqueadosTurnos)>0){st.ataquesBloqueadosTurnos=Number(st.ataquesBloqueadosTurnos)-1;if(!st.ataquesBloqueadosTurnos)nomes.push(nomeDe(tokens.get(id)));}}
   return nomes.length?'⚡ Passa o choque da ferida: '+nomes.join(', ')+' pode(m) atacar de novo.':'';}).catch(falha);
 }
 // Uma vez por rodada (5 s): testes de consciência, relógios de desmaio e choque das feridas.
 function cuidarDosCaidos(lista,agora){
  const jan=janelaAtual();
  // choque: perde-se uma "oportunidade" por rodada
  if(jan!==janelaChoque){janelaChoque=jan;const ids=lista.filter(t=>Number(health?.actors?.[t.id]?.combateLab?.ataquesBloqueadosTurnos)>0).map(t=>t.id);if(ids.length)void enfileirar(()=>passarChoque(ids),{prioridade:1}).catch(()=>{});}
  let mudouPedidos=false;
  for(const t of lista){
   const st=health?.actors?.[t.id]?.combateLab;
   if(!st?.inconsciente||st.morto){if(pedidosCons.delete(t.id))mudouPedidos=true;if(avisouComa.delete(t.id))mudouPedidos=true;continue;}
   // v134: em coma não há teste — só socorro/cura no ferimento grave tira do coma
   if(emComa(st)){if(!avisouComa.has(t.id)){avisouComa.add(t.id);mudouPedidos=true;void registrar(`🛌 ${nomeDe(t)} está em coma: só acorda depois de Primeiros Socorros ou cura no ferimento grave.`);}if(pedidosCons.delete(t.id))mudouPedidos=true;continue;}
   if(avisouComa.delete(t.id))mudouPedidos=true;
   if(st.unconsciousClock){if(restanteRelogio(st.unconsciousClock,agora)<=0&&ultimoTesteCons.get(t.id)!==jan){ultimoTesteCons.set(t.id,jan);void enfileirar(()=>acordarPeloTempo(t),{prioridade:1,ator:t.id}).catch(()=>{});}continue;}
   if(ultimoTesteCons.get(t.id)===jan)continue;
   if(automatico(t)||!t.donoUid){ultimoTesteCons.set(t.id,jan);void enfileirar(()=>testarConsciencia(t,'automático'),{prioridade:1,ator:t.id}).catch(falha);continue;}
   // jogador: aparece um balão; se ele não rolar até o fim da rodada, rola sozinho
   let p=pedidosCons.get(t.id);
   if(!p||p.janela!==jan&&p.feito){p={id:'cons_'+jan.toString(36)+'_'+Math.random().toString(36).slice(2,8),actorId:t.id,donoUid:String(t.donoUid||''),nome:nomeDe(t),janela:jan,expira:agora+rodadaMs()};pedidosCons.set(t.id,p);mudouPedidos=true;continue;}
   if(p.feito)continue;
   if(agora>=p.expira){p.feito=true;mudouPedidos=true;ultimoTesteCons.set(t.id,jan);void enfileirar(()=>testarConsciencia(t,'automático, sem resposta'),{prioridade:1,ator:t.id}).catch(falha);continue;}
   if(!checandoPedido.has(p.id)){checandoPedido.add(p.id);void dep.getDoc(D(ESTADO+'/acoes/'+p.id)).then(s=>{
    if(s.exists()&&!p.feito&&String(s.data()?.personagemId||'')===String(t.id)){p.feito=true;ultimoTesteCons.set(t.id,janelaAtual());void gravarEstado({consciencia:[...pedidosCons.values()].filter(x=>!x.feito)});void enfileirar(()=>testarConsciencia(t,'rolado pelo jogador'),{prioridade:0,ator:t.id}).catch(()=>{});}
   }).catch(()=>{}).finally(()=>setTimeout(()=>checandoPedido.delete(p.id),450));}
  }
  for(const [id] of pedidosCons)if(!lista.some(t=>t.id===id)){pedidosCons.delete(id);mudouPedidos=true;}
  if(mudouPedidos)void gravarEstado({consciencia:[...pedidosCons.values()].filter(x=>!x.feito).map(x=>({id:x.id,actorId:x.actorId,donoUid:x.donoUid,nome:x.nome,expira:x.expira})),coma:lista.filter(t=>avisouComa.has(t.id)).map(t=>({actorId:t.id,donoUid:String(t.donoUid||''),nome:nomeDe(t)}))});
 }
 // Primeiros socorros e psi pelo mesmo resolvedor da mesa (sem turno: no tempo real o relógio é a rodada de 5 s).
 async function executarSuporte(actorId,targetId,extra,cmdId=null){
  const lista=noMapa(),a0=tokens.get(actorId),b0=tokens.get(targetId);if(!a0||!b0)throw Error('Participante não está no mapa.');
  const prep=await api().suporte({...a0},{...b0},lista.map(t=>({...t})));let msg='';
  await dep.runTransaction(dep.db,async tx=>{
   const g=async p=>{const s=await tx.get(D(p));return s.exists()?s.data():null;};
   const map=await g(MAP)||{},hp=await g(HEALTH)||{actors:{},revision:0},hist=await g(HIST)||{entries:[],revision:0},scene=await g(SCENE),sheet=prep.sheetPath?await g(prep.sheetPath):null;
   const cmdPath=cmdId?CMDS+'/'+cmdId:null,cmdDoc=cmdPath?await g(cmdPath):null;if(cmdPath&&cmdDoc?.status!=='pending')return;
   if(map.combat?.active)throw Error('Há um combate por turnos ativo.');
   const rtAtual=await g(ESTADO);if(!rtAtual?.ativo||rtAtual.mapId!==map.mapId||rtAtual.pausado)throw Error('Combate em tempo real parado ou pausado.');
   const pos=[];for(const t of lista){const v=await g(POS+'/'+t.id);if(v)pos.push({...v,id:t.id});}
   const a=pos.find(x=>x.id===actorId),b=pos.find(x=>x.id===targetId);if(!a||!b)throw Error('Participante removido do mapa.');
   if(extra.kind==='direct-psi'&&psiOfensivoRT(extra.powerId,actorId,targetId))exigirAtaqueRT(hp.actors?.[actorId],rtAtual,map);
   const id='rt:'+crypto.randomUUID(),seed=semente();
   const res=prep.resolve({a,b,health:hp,map:{...map,combat:null},cmd:{...extra,id,time:Date.now(),seed},sheet,scene,positions:pos,seed});
   const event={id,ts:Date.now(),mapId:String(map?.mapId||''),actorUid:a.donoUid||'',targetUid:b.donoUid||'',message:'⚡ '+String(res.message||'')};
   if(extra.kind==='direct-psi')Object.assign(event,{source:{id:a.id,x:a.x,y:a.y},target:{id:b.id,x:b.x,y:b.y},item:{nome:res.powerName||'Poder psíquico'},hit:res.psiHit!==false,...(res.area?{area:res.area}:{})});
   tx.set(D(HEALTH),clean({...hp,actors:clean(res.actors||hp.actors||{}),psiRequests:res.psiRequests||hp.psiRequests||[],event,revision:Number(hp.revision||0)+1}));
   if(prep.sheetPath&&sheet&&(res.inventory||res.sheetPatch))tx.set(D(prep.sheetPath),clean({...sheet,...(res.sheetPatch||{}),...(res.inventory?{inventario:res.inventory}:{})}));
   if(res.scene)tx.set(D(SCENE),clean(res.scene));
   for(const [k,v] of Object.entries(res.moves||{}))tx.set(D(POS+'/'+k),clean(v));
   tx.set(D(HIST),clean({entries:[...(hist.entries||[]),event].slice(-120),revision:Number(hist.revision||0)+1}));
   if(cmdPath)tx.set(D(cmdPath),clean({...cmdDoc,status:'done',message:event.message}));
   msg=event.message;
  });
  houveLuta=true;return msg;
 }
 // Está sendo ameaçado de perto? (inimigo encostando ou mirando nele e ao alcance)
 function ameacado(t,inimigos,W,H){
  return inimigos.some(o=>{const dd=distanciaBordas(t,o,W,H);if(dd<=2.5)return true;if(alvoAtual.get(o.id)!==t.id)return false;
   const od=dados.get(o.id),alc=Math.max(1.5,...((od?.ataques||[]).map(a=>Number(a.alcance)||0)));return dd<=alc+1;});
 }
 // Socorrer um aliado ferido em vez de atacar. Retorna true quando o personagem está ocupado com isso.
 function cuidarDeAliado(t,d,lista,inimigos,fa,agora,pronto,podeAndar){
  if(!(Number(d.primeirosSocorros)>0))return false;
  const {W,H}=dims(),meu=health?.actors?.[t.id]||{},medico=ehMedico(d),risco=ameacado(t,inimigos,W,H);
  let plano=socorro.get(t.id);
  if(meu.treatment){ // atendimento em andamento: conclui depois de uma rodada
   const pid=meu.treatment.targetId,pst=health?.actors?.[pid]?.combateLab,p=lista.find(o=>o.id===pid);
   if(!p||!pst||pst.morto||(risco&&!medico)){if(pronto){prontoEm.set(t.id,agora+intervaloAcaoMs(d.acoes,vel()));socorro.delete(t.id);void enfileirar(()=>executarSuporte(t.id,pid,{kind:'direct-first-aid',operation:'cancel',targetId:pid}),{ator:t.id}).catch(falha);}return !!(p&&!risco);}
   if(!plano?.inicio){plano={...(plano||{}),paciente:pid,inicio:agora};socorro.set(t.id,plano);}
   if(pronto&&agora-plano.inicio>=rodadaMs()){prontoEm.set(t.id,agora+intervaloAcaoMs(d.acoes,vel()));
    // médico sem ninguém por perto capricha: mais uma rodada de atendimento (+5)
    if(medico&&!risco&&(Number(meu.treatment.turns)||1)<2){plano.inicio=agora;void enfileirar(()=>executarSuporte(t.id,pid,{kind:'direct-first-aid',operation:'continue',targetId:pid}),{ator:t.id}).catch(falha);}
    else{socorro.delete(t.id);void enfileirar(()=>executarSuporte(t.id,pid,{kind:'direct-first-aid',operation:'finish',targetId:pid}),{ator:t.id}).catch(falha);}}
   return true;
  }
  const jan=janelaAtual();
  if(!plano||(!plano.paciente&&plano.janela!==jan)){
   const aliados=lista.filter(o=>o.id!==t.id&&!hostis(fa,faccaoDe(o,estado.faccoes||{}),false)).map(o=>{const st=health?.actors?.[o.id]?.combateLab;const g=st?gravidade(st):0;return {o,g,local:st?localParaTratar(st):'',dist:distanciaBordas(t,o,W,H)};})
    .filter(x=>x.g>0&&x.local&&(podeAndar||x.dist<=1.5)).sort((a,b)=>(b.g/(1+b.dist/12))-(a.g/(1+a.dist/12)));
   const melhor=aliados[0];
   const quer=melhor?vontadeDeSocorrer({valor:d.primeirosSocorros,medico,gravidade:melhor.g,ameacado:risco,temKit:d.kits>0}):0;
   plano={janela:jan,paciente:melhor&&Math.random()<quer?melhor.o.id:null};socorro.set(t.id,plano);
   if(plano.paciente)void registrar(`🩹 ${nomeDe(t)} vai socorrer ${nomeDe(melhor.o)}.`);
  }
  if(!plano.paciente)return false;
  const p=lista.find(o=>o.id===plano.paciente),st=health?.actors?.[plano.paciente]?.combateLab;
  if(!p||!st||st.morto||gravidade(st)<=0||!localParaTratar(st)||(risco&&!(medico&&gravidade(st)>=2.2))){socorro.set(t.id,{janela:jan,paciente:null});return false;}
  const dist=distanciaBordas(t,p,W,H);
  if(dist>1.3){if(!podeAndar){socorro.set(t.id,{janela:jan,paciente:null});return false;}void mover(t,p,d,agora,{parar:(diametro(t)+diametro(p))/2+.4}).catch(falha);return true;}
  if(pronto){prontoEm.set(t.id,agora+intervaloAcaoMs(d.acoes,vel()));
   void enfileirar(()=>executarSuporte(t.id,p.id,{kind:'direct-first-aid',operation:'start',targetId:p.id,local:localParaTratar(st),useKit:true}),{ator:t.id}).then(()=>{const pl=socorro.get(t.id);if(pl)pl.inicio=Date.now();}).catch(e=>{falha(e);socorro.set(t.id,{janela:janelaAtual(),paciente:null});});}
  return true;
 }
 // Balão do jogador desacordado: "🎲 Teste de consciência"
 let consEl=null,consId='';
 function desenharConsciencia(){
  const board=root.getElementById('novaSyncBoard'),lista=Array.isArray(estado?.consciencia)?estado.consciencia:[];
  const e=estado?.ativo&&!estado.pausado?lista.find(x=>x&&Date.now()<Number(x.expira||0)+300&&((x.donoUid?x.donoUid===uid():ehMestre())||(dirV207()&&String(x.actorId)===dirV207()))):null;
  const coma=!e&&estado?.ativo?(Array.isArray(estado?.coma)?estado.coma:[]).find(x=>x&&x.donoUid&&x.donoUid===uid()):null;
  if(coma&&board){const id='coma_'+coma.actorId;if(consEl&&consId===id&&consEl.isConnected)return;consEl?.remove();consId=id;consEl=root.createElement('div');consEl.id='rtConsciencia';consEl.innerHTML=`<span>🛌 <b>${esc(coma.nome)}</b> está em coma. Só acorda depois de Primeiros Socorros ou cura no ferimento grave.</span>`;acomodarPainelMapa(root,consEl);return;}
  if(!e||!board){if(consEl){consEl.remove();consEl=null;consId='';}return;}
  const restam=Math.max(0,Math.ceil((Number(e.expira)-Date.now())/1000));
  if(consEl&&consId===e.id&&consEl.isConnected){const c=consEl.querySelector('[data-conta]');if(c)c.textContent=restam+' s';return;}
  consEl?.remove();consId=e.id;consEl=root.createElement('div');consEl.id='rtConsciencia';
  consEl.innerHTML=`<span>💤 <b>${esc(e.nome)}</b> está inconsciente.</span><button type="button" data-rolar title="Rola Resistência (+5 por PV curado enquanto desacordado). Um teste por rodada.">🎲 Teste de consciência</button><small data-conta>${restam} s</small>`;
  consEl.addEventListener('pointerdown',ev=>ev.stopPropagation());
  consEl.querySelector('[data-rolar]').addEventListener('click',async ev=>{const b=ev.currentTarget;b.disabled=true;b.textContent='⏳';
   try{await dep.setDoc(D(ESTADO+'/acoes/'+e.id),{donoUid:uid(),personagemId:String(e.actorId),tipo:'consciencia',criadoEm:Date.now()});b.textContent='✓ Rolando…';}
   catch(err){console.warn('[Tempo real] consciência',err);b.textContent='Não deu (rola sozinho)';}});
  acomodarPainelMapa(root,consEl);
 }
 // v133: manobra entre ataques (rodear, flanquear, recuar, andar de lado), com destino mantido por alguns segundos
 const manobras=new Map();
 async function manobrar(t,alvo,d,agora,o){
  const {W,H}=dims(),falta=(prontoEm.get(t.id)||0)-agora;
  if(o.papel==='linha'&&falta<900)return false; // corpo a corpo: só se mexe se ainda falta tempo para o próximo golpe
  let m=manobras.get(t.id);
  const chegou=m&&Math.hypot((t.x-m.x)*W/28,(t.y-m.y)*H/14)<.35;
  if(!m||agora>m.ate||chegou){
   if(m&&chegou&&agora<m.ate)return false;
   const M=p=>paraMetros(p,W,H),aliados=o.lista.filter(x=>x.id!==t.id&&estadoVivo(health,x.id)&&!hostis(o.fa,faccaoDe(x,estado.faccoes||{}),false)).map(M);
   const plano=planejarManobra({eu:M(t),alvo:M(alvo),contato:(diametro(t)+diametro(alvo))/2+.3,papel:o.papel,pensa:o.pensa,semMente:/sem mente/.test(o.perfil.tipo),frac:o.frac,aliados,inimigos:o.inimigos.map(M),alcance:Number(o.ataque?.alcance)||1.5,W,H});
   if(!plano){manobras.set(t.id,{x:t.x,y:t.y,ate:agora+1500+Math.random()*1500});return false;}
   m={...deMetros(plano,W,H),ate:agora+plano.ms,tipo:plano.tipo};manobras.set(t.id,m);
  }
  if(Math.hypot((t.x-m.x)*W/28,(t.y-m.y)*H/14)<.35)return false;
  return mover(t,{x:m.x,y:m.y,diametroM:.1},d,agora,{parar:0});
 }
 let pensando=false;
 async function pensar(){
  if(pensando||!ehMestre()||!estado?.ativo||estado.pausado||!mapa?.mapId||mapa?.combat?.active||!api())return;
  pensando=true;
  try{
   const agora=Date.now(),lista=noMapa(),{W,H}=dims();
   const fim=combateAcabou(lista,{faccoes:estado.faccoes||{},health});
   if(houveLuta&&fim.fim){houveLuta=false;/* o mapa continua vivo após a luta */}
   cuidarDosCaidos(lista,agora); // v133
   const poder=new Map();for(const o of lista){const dd=dados.get(o.id);if(dd)poder.set(o.id,Math.max(0,...(dd.ataques||[]).map(a=>Number(a.valor)||0)));else if(estadoVivo(health,o.id))void dadosDe(o).catch(()=>{});}
   for(const t of lista){
    if(!automatico(t)||!estadoVivo(health,t.id)||naFila.has(t.id)||win.mesaCompanheiros?.naoLuta?.(t.id))continue; // v127: companheiro que não luta só foge (módulo de companheiros)
    const d=dados.get(t.id);if(!d){void dadosDe(t).catch(falha);continue;}
    if(!d.ataques?.length&&!d.mov)continue;
    const perfil=perfilDe(t,d),podeAndar=d.mov>0&&!perfil.imovel,cl=health?.actors?.[t.id]?.combateLab||{};
    const fa=faccaoDe(t,estado.faccoes||{}),inimigos=lista.filter(o=>o.id!==t.id&&estadoVivo(health,o.id)&&hostisEntre(t,o,estado.faccoes||{}));
    // v186: só conta inimigo que a criatura vê (até 14 m, sem parede ou porta fechada no meio) ou de quem soube pela luta; lembra por 20 s; reage com o tempo do perfil
    {const mem=alerta.get(t.id)||new Map();alerta.set(t.id,mem);const reacao=reacaoMs(perfil),objs=cena?.objects||[];
     for(let i=inimigos.length-1;i>=0;i--){const o=inimigos[i],vis=distanciaBordas(t,o,W,H)<=ALCANCE_VISAO&&linhaDeVisaoLivre(t,o,mapa,objs);if(!percebe(mem,o.id,{visivel:vis,agora,reacao}))inimigos.splice(i,1);}}
    {const E=win.mesaAtitudesIaV200?.engaja;if(E)for(let i=inimigos.length-1;i>=0;i--)if(!E(t,inimigos[i]))inimigos.splice(i,1);} // v200: atitude (quem este engaja)
    if(!inimigos.length)continue;
    const pronto=(prontoEm.get(t.id)||0)<=agora,ind=indisponivel.get(t.id)||new Set();
    const alcanceMax=Math.max(0,...(d.ataques||[]).filter(a=>!ind.has(a.skillId+'|'+a.weaponId)).map(a=>Number(a.alcance)||0));
    // caído: levanta antes de qualquer coisa (exceto quem atira de onde está)
    if((cl.caido||cl.derrubado)&&pronto&&podeAndar){prontoEm.set(t.id,agora+intervaloAcaoMs(d.acoes,vel()));void enfileirar(()=>levantar(t),{ator:t.id}).catch(falha);continue;}
    // v133: em choque (ferida): não ataca nesta rodada, só se protege
    const emChoque=Number(cl.ataquesBloqueadosTurnos)>0,atitude=perfilRT(health?.actors?.[t.id],estado,mapa),atitudeId=Object.keys(MODOS_RT).find(k=>MODOS_RT[k]===atitude)||'normal';
    // v185: escolhe a atitude como um jogador (Recuo ao fugir; Defesa total em choque ou quase morta; Ataque total com vida alta e alvo colado; encurralada volta a lutar)
    {const frac=fracaoVida(health,t.id),pertoD=Math.min(...inimigos.map(o=>distanciaBordas(t,o,W,H)));let encurralado=false;
     if(fugindo.has(t.id)&&podeAndar){const pf=pontoDeFuga(t,inimigos,gradeAtual(),W,H);encurralado=!pf||pertoD<.6;}
     const desejada=escolherAtitude({perfil,frac,emChoque,fugindo:fugindo.has(t.id),encurralado,distAlvo:pertoD,alcance:alcanceMax,atual:atitudeId});
     if(desejada!==atitudeId)void trocarAtitude(t,desejada,agora);}
    if(!atitude.podeAtacar){if(atitude.velocidade>1&&podeAndar){const p=pontoDeFuga(t,inimigos,gradeAtual(),W,H);if(p)void mover(t,{...deMetros(p,W,H),diametroM:.1},d,agora,{parar:0}).catch(falha);}continue;}
    // v133: socorrer aliado ferido (quem tem Primeiros Socorros; médicos quase sempre preferem curar)
    if(!emChoque&&cuidarDeAliado(t,d,lista,inimigos,fa,agora,pronto,podeAndar))continue;
    // v133: papel na luta de quem pensa — quem é fraco no corpo a corpo fica atrás, atira, usa psi ou se esconde
    const pensa=d.tipo!=='criatura'||/inteligente/.test(perfil.tipo);
    const papel=pensa?papelTatico(d):'linha';
    if(papel!=='linha'&&podeAndar&&!fugindo.has(t.id)){
     const colado=inimigos.map(o=>({o,dist:distanciaBordas(t,o,W,H)})).sort((a,b)=>a.dist-b.dist)[0];
     if(colado&&colado.dist<DISTANCIA_SEGURA[papel]-1){
      const ponto=pontoDeFuga(t,inimigos.filter(o=>distanciaBordas(t,o,W,H)<10),gradeAtual(),W,H,Math.min(6,DISTANCIA_SEGURA[papel]));
      if(ponto&&colado.dist>.6)void mover(t,{...deMetros(ponto,W,H),diametroM:.1},d,agora,{parar:0}).catch(falha);
      if(papel==='escondido'&&(colado.dist>.6||!ponto))continue; // protege-se; só luta se encurralado
     }else if(papel==='escondido')continue;
    }
    if(emChoque)continue;
    // moral: com pouca vida, quem não é destemido foge
    const frac=fracaoVida(health,t.id);
    if(podeAndar&&perfil.fuga>0&&frac<=perfil.fuga)fugindo.add(t.id);
    if(fugindo.has(t.id)&&podeAndar){
     if(!avisouFuga.has(t.id)){avisouFuga.add(t.id);void registrar(`🏃 ${t.nome||'Criatura'} perde a coragem e foge!`);}
     const ponto=pontoDeFuga(t,inimigos,gradeAtual(),W,H);
     const perto=inimigos.map(o=>({o,dist:distanciaBordas(t,o,W,H)})).sort((a,b)=>a.dist-b.dist)[0];
     if(ponto){const alvoPonto={...deMetros(ponto,W,H),diametroM:.1};void mover(t,alvoPonto,{...d,mov:d.mov*1.15},agora,{parar:0}).catch(falha);}
     // encurralado: se não há para onde correr e o inimigo está colado, luta
     if((!ponto||perto.dist<.6)&&pronto){const bl=linhaBloqueadaPorObjetos(t,perto.o,mapa,cena?.objects||[],{camada:3});const {ataque,alcanca}=escolherAtaque(d.ataques,perto.dist,{bloqueado:bl,indisponivel:ind});
      if(ataque&&alcanca){prontoEm.set(t.id,agora+intervaloAcaoMs(d.acoes,vel()));void enfileirar(()=>resolverAtaque({actorId:t.id,targetId:perto.o.id,skillId:ataque.skillId,weaponId:ataque.weaponId,seed:semente()}),{ator:t.id}).catch(()=>prontoEm.set(t.id,Date.now()+600));}}
     continue;
    }
    const alvo=(()=>{ // v131: mantém o alvo; quando outro oponente ataca, decide se troca (na maioria das vezes, sim)
     const vivo=id=>{const o=inimigos.find(x=>x.id===id);return o&&estadoVivo(health,id)&&hostisEntre(t,o,estado.faccoes||{})&&(!win.mesaAtitudesIaV200?.engaja||win.mesaAtitudesIaV200.engaja(t,o))&&(podeAndar||distanciaBordas(t,o,W,H)<=alcanceMax+.05)?o:null;};
     let atual=vivo(alvoAtual.get(t.id));const prov=provocacao.get(t.id);
     if(prov){provocacao.delete(t.id);const ag=vivo(prov);
      if(ag&&(!atual||(atual.id!==ag.id&&Math.random()<chanceDeTrocar({poderAtual:Number(poder.get(atual.id))||0,poderAgressor:Number(poder.get(ag.id))||0,distAtual:distanciaBordas(t,atual,W,H),distAgressor:distanciaBordas(t,ag,W,H),perfil}))))atual=ag;}
     if(!atual)atual=escolherAlvoPerfil(t,inimigos,{faccoes:estado.faccoes||{},health,W,H,perfil:{...perfil,imovel:!podeAndar},ultimoAgressor:agressor.get(t.id),poder,ameaca:ameaca.get(t.id),alcanceMax});
     if(atual)alvoAtual.set(t.id,atual.id);else alvoAtual.delete(t.id);return atual;
    })();
    // v132: várias cabeças — cada ataque é de uma cabeça, que fica com o seu alvo entre os que estão ao alcance
    const nc=nCabecas(t);let cabeca=null,alvoFinal=alvo;
    if(nc&&pronto){const k=cabecaProx.get(t.id)||0;cabeca=k%nc;
     const ao=inimigos.map(o=>({o,dd:distanciaBordas(t,o,W,H)})).filter(x=>x.dd<=alcanceMax+.05).sort((a,b)=>a.dd-b.dd).map(x=>x.o);
     if(ao.length){alvoFinal=alvoDaCabeca(cabeca,alvo&&ao.some(o=>o.id===alvo.id)?[alvo,...ao.filter(o=>o.id!==alvo.id)]:ao);}}
    if(!alvoFinal)continue;
    const dist=distanciaBordas(t,alvoFinal,W,H);
    const bloqueado=(bloqueioAte.get(t.id)||0)>agora||linhaBloqueadaPorObjetos(t,alvoFinal,mapa,cena?.objects||[],{camada:3});
    const {ataque,alcanca}=escolherAtaque(d.ataques,dist,{bloqueado,indisponivel:ind});
    // v133: psi — quem é psíquico usa o poder de longe; os outros só quando nenhum ataque alcança
    if(pronto&&d.psi?.max>0&&(d.psi.poderes||[]).length&&(papel==='psiquico'||!(ataque&&alcanca))){
     const psiLivre=Number(d.psi.max)-Number(health?.actors?.[t.id]?.psiSpent??d.psi.gasto??0);
     let noCone=1;try{noCone=alvosNoCone(t,alvoFinal,inimigos,{larguraM:W,alturaM:H},{range:8,angle:60}).length;}catch(_){}
     const pod=escolherPsi(d,{psiLivre,distAlvo:dist,noCone,alvoAtordoado:!!health?.actors?.[alvoFinal.id]?.psiEffects?.atordoado});
     if(pod&&(papel==='psiquico'?Math.random()<.75:true)){
      prontoEm.set(t.id,agora+intervaloAcaoMs(d.acoes,vel())*atitude.intervalo);
      void enfileirar(()=>executarSuporte(t.id,alvoFinal.id,{kind:'direct-psi',powerId:pod.id,cost:pod.custo,targetId:alvoFinal.id}),{ator:t.id}).catch(e=>{if(!/PP|alcance|cancelado/i.test(String(e?.message||e)))falha(e);prontoEm.set(t.id,Date.now()+600);});
      continue;
     }
    }
    if(ataque&&alcanca&&pronto){
     prontoEm.set(t.id,agora+intervaloAcaoMs(d.acoes,vel())*atitude.intervalo*(win.mesaModoSimplesV200?.intervaloFator?.(t.id)||1));if(nc)cabecaProx.set(t.id,(cabecaProx.get(t.id)||0)+1);
     void enfileirar(()=>resolverAtaque({actorId:t.id,targetId:alvoFinal.id,cabeca,skillId:ataque.skillId,weaponId:ataque.weaponId,seed:semente()}),{ator:t.id}).catch(e=>{
      const m=String(e?.message||e);
      if(/muni|no chão/i.test(m)){ind.add(ataque.skillId+'|'+ataque.weaponId);indisponivel.set(t.id,ind);}
      else if(/linha de tiro/i.test(m))bloqueioAte.set(t.id,Date.now()+2500);
      else if(/alcance/i.test(m)){/* anda mais um pouco */}
      else if(!/não pode atacar|morto|removido|combate por turnos|cancelado/i.test(m))falha(e);
      prontoEm.set(t.id,Date.now()+600);
     });
    }
    if(!podeAndar)continue;
    // quem atira e é esperto recua quando alguém encosta; os outros se aproximam até alcançar
    const colado=inimigos.map(o=>({o,dist:distanciaBordas(t,o,W,H)})).sort((a,b)=>a.dist-b.dist)[0];
    if(perfil.distancia&&ataque?.distancia&&colado&&colado.dist<1.6){
     const ponto=pontoDeFuga(t,[colado.o],gradeAtual(),W,H,3);if(ponto)void mover(t,{...deMetros(ponto,W,H),diametroM:.1},d,agora,{parar:0}).catch(falha);
    }else if(!(ataque&&alcanca))void mover(t,alvoFinal,d,agora).catch(falha);
    else void manobrar(t,alvoFinal,d,agora,{papel,pensa,perfil,ataque,inimigos,lista,fa,frac}).catch(falha); // v133: não fica parado entre um ataque e outro
   }
  }catch(e){falha(e);}
  finally{pensando=false;}
 }

 // ------------------------------------------------------------ interface
 function instalarBotao(){
  return; // v201: botão movido para a faixa "Ferramentas do mestre" (⚡ Combate)
  if(!ehMestre())return;
  const barraFerr=root.querySelector('#sincronizacao-nova .nova-view-tools');if(!barraFerr||root.getElementById('rtBotao'))return;
  const b=root.createElement('button');b.type='button';b.id='rtBotao';b.className='btn-small';b.textContent='⚡';b.title='Combate em tempo real: criaturas agem sozinhas, com pausa e facções';
  b.addEventListener('click',()=>{abrirGaveta(gaveta?.hidden!==false);});barraFerr.append(b);
 }
 function abrirGaveta(abrir=true){
  if(!gaveta){gaveta=root.createElement('div');gaveta.id='rtGaveta';gaveta.hidden=true;root.body.append(gaveta);
   gaveta.addEventListener('click',aoClicarGaveta);gaveta.addEventListener('change',aoMudarGaveta);}
  gaveta.hidden=!abrir;if(abrir)desenharGaveta();
 }
 function desenharGaveta(){
  if(!gaveta||gaveta.hidden)return;
  const lista=noMapa().sort((a,b)=>Number(ehJogador(b))-Number(ehJogador(a))||String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  const opc=sel=>Object.entries(FACCOES).map(([k,f])=>`<option value="${k}"${k===sel?' selected':''}>${f.nome}</option>`).join('');
  const turnos=!!mapa?.combat?.active;
  const html=`<h3><span>⚡ Combate em tempo real</span><button type="button" class="btn-small" data-x title="Fechar">✕</button></h3>
   <div class="rt-st">${estado?.pausaEmergencia?'Jogo pausado pelo mestre.':'Tempo real contínuo'}</div>
   <div class="rt-linha">
    <button type="button" class="btn-small btn-select" data-pausa>${estado?.pausaEmergencia?'▶ Retomar jogo':'⏸ Pausa de emergência'}</button>
   </div>
   <div class="rt-linha"><label style="flex:1">Velocidade <select data-vel>${[[.5,'0,5× (lento)'],[1,'1× (normal)'],[1.5,'1,5×'],[2,'2× (rápido)']].map(([v,n])=>`<option value="${v}"${Number(estado?.velocidade||1)===v?' selected':''}>${n}</option>`).join('')}</select></label></div>
   <div class="rt-linha"><label title="Uma barra de vida, fadiga e psiquismo; sem dano por partes do corpo"><input type="checkbox" data-vida-simples${win.mesaModoSimplesV200?.ativo?.()!==false?" checked":""}> ❤️ Vida simples (sem partes do corpo)</label></div>
   <div class="rt-linha"><button type="button" class="btn-small" data-preset="grupo" title="Criaturas e NPCs contra os personagens">⚔️ Todos contra o grupo</button><button type="button" class="btn-small" data-preset="selvagens" title="Cada criatura ataca qualquer outra">🐾 Cada um por si</button><button type="button" class="btn-small" data-preset="ab" title="Divide as criaturas em duas facções">🔵🟣 Duas facções</button></div>
   <div class="rt-ajuda">Escolha a facção de cada um. 🤖 = age sozinho (criaturas já vêm ligadas; marque um personagem se o jogador não estiver).</div>
   ${lista.map(t=>{const f=faccaoDe(t,estado?.faccoes||{}),vivo=estadoVivo(health,t.id),esc2=estado?.comportamento?.[t.id]||'auto',d=dados.get(t.id),pf=d?perfilDe(t,d):null;
    const linhaPerfil=automatico(t)?`<div class="rt-perfil"><span title="${esc(pf?descreverPerfil(pf):'')}">${d?'⚔️ '+d.acoes+'/'+d.acoes+' · 🦶 '+String(d.mov).replace('.',',')+' m · ':''}${fugindo.has(t.id)?'🏃 fugindo · ':''}${alerta.get(t.id)?.size?'👁️ em alerta · ':''}${(a=>a!==MODOS_RT.normal?a.icone+' '+a.nome+' · ':'')(perfilRT(health?.actors?.[t.id],estado,mapa))}${d&&(d.tipo!=='criatura')?({atirador:'🎯 fica atrás atirando · ',psiquico:'🔮 fica atrás usando psi · ',escondido:'🫥 protege-se · ',linha:''}[papelTatico(d)]||''):''}${d&&ehMedico(d)?'🩹 médico · ':d?.primeirosSocorros>0?'🩹 socorre · ':''}${esc(pf?descreverPerfil(pf):'lendo a ficha…')}</span><select data-comp="${esc(t.id)}" title="Jeito de lutar">${Object.entries(COMPORTAMENTOS).map(([k,c])=>`<option value="${k}"${k===esc2?' selected':''}>${c.nome}</option>`).join('')}</select></div>`:'';
    return `<div class="rt-token${vivo?'':' morto'}"><b title="${esc(t.nome)}">${ehJogador(t)?'🧑':'👾'} ${esc(t.nome||t.id)}</b><select data-faccao="${esc(t.id)}">${opc(f)}</select><label title="Age sozinho"><input type="checkbox" data-auto="${esc(t.id)}"${automatico(t)?' checked':''}> 🤖</label>${linhaPerfil}</div>`;}).join('')||'<div class="rt-ajuda">Nenhuma miniatura neste mapa.</div>'}
   <div class="rt-ajuda" style="margin-top:8px">Mais ações por turno = recarga menor e passo mais rápido. Uma rodada = 5 s. Cada um usa as Ações/Defesas e o Deslocamento da própria ficha (⚔️ ao lado do nome): 2/2 = até 2 ataques e 2 defesas a cada 5 s. A defesa é rolada sozinha. Num crítico ou acerto especial de quem é controlado por alguém, o jogo pausa 10 s para escolher o local e o efeito. ⏸ também fica no topo do mapa e vale na hora. Cada jogador escolhe a atitude no canto do mapa: 🛡️ Defesa total (+40 na defesa, defende o dobro, anda a 60%, não ataca) · ⚔️ Ataque total (+15 no ataque, ataques mais rápidos, −25 na defesa) · 💨 Recuo (+15 na defesa, 1,6× mais rápido, não ataca).</div>`;
  if(gaveta.dataset.html===html)return; // nada mudou: não redesenha (sem "pulos" e sem fechar listas abertas)
  const ativo=root.activeElement&&gaveta.contains(root.activeElement)&&root.activeElement.tagName==='SELECT';
  if(ativo)return; // o mestre está escolhendo algo; redesenha no próximo evento
  const rol=gaveta.scrollTop;gaveta.innerHTML=html;gaveta.dataset.html=html;gaveta.scrollTop=rol;
 }
 // v208: início do tempo real em uma função — usada pelo botão ▶ e pelo início automático
 // quando alguém ataca fora de qualquer combate (estilo MMO: a hostilidade LIGA o combate).
 let iniciandoRT=null;
 async function iniciarRT(){
  if(!ehMestre())return false;
  if(iniciandoRT)return iniciandoRT;
  if(estado?.ativo&&estado.continuoV214&&estado.mapId===mapa?.mapId&&!mapa?.combat?.active&&estado.pausado===!!estado.pausaEmergencia)return true;
  const lista=noMapa();if(!lista.length)return false;
  iniciandoRT=(async()=>{let proximo=null;
   await dep.runTransaction(dep.db,async tx=>{
    proximo=null; // a função pode ser repetida pelo Firestore
    const ms=await tx.get(D(MAP)),rs=await tx.get(D(ESTADO));const m=ms.exists()?ms.data():null;if(!m?.mapId)return;
    proximo=estadoContinuo(rs.exists()?rs.data():{},m.mapId);
    tx.set(D(ESTADO),clean(proximo));
    if(m.combat?.active)tx.set(D(MAP),clean({...m,combat:{...m.combat,active:false,pendingAttack:null}}));
   });
   if(!proximo)return false;estado=proximo;houveLuta=false;prontoEm.clear();defesas.clear();indisponivel.clear();return true;
  })();
  try{return await iniciandoRT;}finally{iniciandoRT=null;}
 }
 async function aoClicarGaveta(e){
  if(!ehMestre())return;
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.x!==undefined)return abrirGaveta(false);
  if(b.dataset.turnos){const alvo=root.getElementById(b.dataset.turnos==='ini'?'novaSyncStart':'novaSyncEnd');if(alvo&&!alvo.disabled)alvo.click();else dep.avisar?.('Botão de turnos indisponível agora.');setTimeout(desenharGaveta,600);return;}
  if(b.dataset.iniciar!==undefined){await iniciarRT();return;}
  if(b.dataset.pausa!==undefined)return pausarJogo(!estado?.pausaEmergencia);
  if(b.dataset.parar!==undefined){estado={...(estado||{}),ativo:false};cancelarFila();desenharBarra();return dep.setDoc(D(ESTADO),{ativo:false,pausado:false,mensagem:'',escolha:null,atualizadoEm:Date.now()},{merge:true});}
  if(b.dataset.preset){
   const f={},lista=noMapa(),modelo=t=>decodeURIComponent(String(t.id)).split('~')[0];
   const especies=[...new Set(lista.filter(t=>!ehJogador(t)).map(modelo))];let k=0;
   for(const t of lista){
    if(ehJogador(t)){f[t.id]='grupo';continue;}
    if(b.dataset.preset==='grupo')f[t.id]='inimigos';
    else if(b.dataset.preset==='selvagens')f[t.id]='selvagens';
    else f[t.id]=especies.length>1?(especies.indexOf(modelo(t))%2?'b':'a'):(k++%2?'b':'a'); // espécies diferentes ficam em lados opostos
   }
   await dep.setDoc(D(ESTADO),{faccoes:f,atualizadoEm:Date.now()},{merge:true});
  }
 }
 async function aoMudarGaveta(e){
  if(!ehMestre())return;
  const s=e.target;
  if(s.dataset.faccao)await dep.setDoc(D(ESTADO),{faccoes:{[s.dataset.faccao]:s.value},atualizadoEm:Date.now()},{merge:true});
  else if(s.dataset.auto)await dep.setDoc(D(ESTADO),{auto:{[s.dataset.auto]:s.checked},atualizadoEm:Date.now()},{merge:true});
  else if(s.dataset.comp){fugindo.delete(s.dataset.comp);await dep.setDoc(D(ESTADO),{comportamento:{[s.dataset.comp]:s.value},atualizadoEm:Date.now()},{merge:true});}
  else if(s.dataset.vel!==undefined)await gravarEstado({velocidade:Number(s.value)||1});
  else if(s.dataset.vidaSimples!==undefined)await win.mesaModoSimplesV200?.definir(s.checked);
 }
 function meuToken(){
  const dir=dirV207();
  if(dir){const d=tokens.get(dir)||tokens.get(encodeURIComponent(dir));if(d)return d;}
  const id=String(dep.personagemId?.()||'');const enc=encodeURIComponent(id);
  return tokens.get(enc)||tokens.get(id)||[...tokens.values()].find(t=>t.donoUid&&t.donoUid===uid()&&String(t.mapaId||'')===String(estado?.mapId||''))||null;
 }
 function desenharBarra(){
  const board=root.getElementById('novaSyncBoard');
  let emergencia=root.getElementById('rtEmergencia');
  if(ehMestre()&&board&&mapa?.mapId){
   if(!emergencia){emergencia=root.createElement('button');emergencia.id='rtEmergencia';emergencia.type='button';emergencia.className='btn-small';emergencia.addEventListener('click',()=>void pausarJogo(!estado?.pausaEmergencia).catch(falha));}
   const host=root.getElementById('mbBarra')||board.parentElement;if(emergencia.parentElement!==host)host.append(emergencia);
   emergencia.textContent=estado?.pausaEmergencia?'▶ Retomar jogo':'⏸ Pausa de emergência';emergencia.setAttribute('aria-pressed',String(!!estado?.pausaEmergencia));
  }else emergencia?.remove();
  board?.classList.toggle('rt-ativo',!!estado?.ativo&&!estado?.pausado);
  if(true){if(barra)barra.hidden=true;return;} // v201: a barra "⚡ Tempo real" não aparece para ninguém (é o padrão do combate); opções do mestre: botão ⚡ Combate
  if(!barra||!barra.isConnected||barra.parentElement!==root.getElementById('mesaPaineisForaMapa')){barra?.remove();barra=root.createElement('div');barra.id='rtBarra';acomodarPainelMapa(root,barra);
   barra.addEventListener('pointerdown',e=>e.stopPropagation());barra.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.pausa!==undefined){const v=!estado.pausado;pausarLocal(v);void gravarEstado({pausado:v,mensagem:'',escolha:null});}if(b.dataset.painel!==undefined)abrirGaveta(true);});}
  barra.hidden=false;
  const t=ehMestre()?null:meuToken(),pronto=t?Number(estado.prontoEm?.[t.id]||0):0,falta=Math.max(0,pronto-Date.now());
  const intervalo=t?intervaloAcaoMs(dados.get(t.id)?.acoes||2,vel()):1;
  const html=`⚡ Tempo real${estado.pausado?' · <span class="rt-pausado">⏸ pausado</span>':''}${estado.velocidade&&Number(estado.velocidade)!==1?' · '+String(estado.velocidade).replace('.',',')+'×':''}`+
   (t?` · ${falta>0?'recarregando <span class="rt-recarga"><i style="width:'+Math.round(100-100*Math.min(1,falta/intervalo))+'%"></i></span>':'✅ pronto'}`:'')+
   (ehMestre()?` <button type="button" data-pausa title="${estado.pausado?'Continuar':'Pausar'}">${estado.pausado?'▶':'⏸'}</button><button type="button" data-painel title="Facções e opções">⚙️</button>`:'');
  if(barra.dataset.html!==html){barra.innerHTML=html;barra.dataset.html=html;}
 }

 // ------------------------------------------------------------ assinaturas
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(ESTADO),s=>{const antes=estado;estado=s.exists()?s.data():{ativo:false};
   if(!!estado.pausaEmergencia!==!!antes?.pausaEmergencia)win.dispatchEvent(new win.Event('mesa-pausa-v214'));
   if(estado.pausaEmergencia&&!antes?.pausaEmergencia&&ehMestre())void win.mesaVida?.parar?.();
   if(!antes?.ativo&&estado.ativo){houveLuta=false;prontoEm.clear();fugindo.clear();avisouFuga.clear();ameaca.clear();alvoAtual.clear();provocacao.clear();}
   if((estado.pausado&&!antes?.pausado)||(!estado.ativo&&antes?.ativo))cancelarFila();
   desenharEscolha();desenharConsciencia();
   desenharBarra();desenharGaveta();},e=>console.warn('[Tempo real] estado',e)));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;desenharGaveta();},e=>console.warn('[Tempo real] mapa',e)));
  parar.push(dep.onSnapshot(dep.collection(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes'),q=>{
   const novo=new Map();q.forEach(d=>novo.set(d.id,{...d.data(),id:d.id}));
   // mantém a posição local mais nova de quem a IA está movendo
   for(const [id,t] of novo){const v=tokens.get(id);if(v&&Number(v.revision||0)>Number(t.revision||0))novo.set(id,v);}
   tokens=novo;desenharGaveta();},e=>console.warn('[Tempo real] posições',e)));
  if(ehMestre()){
   parar.push(dep.onSnapshot(D(HEALTH),s=>{health=s.exists()?s.data():{actors:{}};},e=>console.warn('[Tempo real] saúde',e)));
   parar.push(dep.onSnapshot(D(SCENE),s=>{cenaSalva=s.exists()?s.data():null;cena=globalThis.mesaRascunhoCenaV197_?.(cenaSalva)||cenaSalva;},e=>console.warn('[Tempo real] cena',e)));globalThis.addEventListener('mesa-rascunho-v197',()=>{cena=globalThis.mesaRascunhoCenaV197_?.(cenaSalva)||cenaSalva;});
  }
 }
 let assinado=false,eraMestre=null,voltas=0,autoDirGravadoV207=false;
 const pulso=()=>{
  try{
   if(!uid())return;
   const m=ehMestre();if(!assinado||m!==eraMestre){assinado=true;eraMestre=m;assinar();}
   if(m&&mapa?.mapId)void iniciarRT().catch(falha);
   instalarBotao();desenharBarra();desenharEscolha();desenharConsciencia();if(++voltas%4===0)desenharGaveta();
   // v207: com o tempo real ligado, o token do diretor vira manual para todos (a IA solta ele);
   // o mestre devolve à IA quando quiser marcando 🤖 no painel ⚙️ do tempo real.
   const dir=dirV207();
   if(dir&&estado?.ativo&&tokens.get(dir)&&estado?.auto?.[dir]!==false&&!autoDirGravadoV207){autoDirGravadoV207=true;void dep.setDoc(D(ESTADO),{auto:{[dir]:false},atualizadoEm:Date.now()},{merge:true}).catch(()=>{autoDirGravadoV207=false;});}
   if(m&&estado?.ativo&&!estado.pausado){
    void pensar();
   }
  }catch(e){falha(e);}
 };
 const vigia=setInterval(pulso,250);
 const latido=instalarLatidoMesa({root,uid,acordar:pulso});

 // v116: o mestre passa a controlar a miniatura (sai do automático)
 const assumirControle=async id=>{if(!ehMestre()||!estado?.ativo)return false;await dep.setDoc(D(ESTADO),{auto:{[id]:false},atualizadoEm:Date.now()},{merge:true});return true;};
 const definirAutomatico=async(id,valor)=>{if(!ehMestre())throw Error('Somente o mestre pode mudar a IA.');if(!tokens.has(id))throw Error('Miniatura não encontrada.');if(valor&&dirV207()===String(id))throw Error('Saia de Atuar como nesta criatura antes de devolver à IA.');await iniciarRT();await dep.setDoc(D(ESTADO),{auto:{[id]:!!valor},atualizadoEm:Date.now()},{merge:true});return true;};
 // v125: pegar algo do chão gasta tempo (ex.: 1,5 ação para recuperar a arma)
 const atrasar=(id,acoes=1.5)=>{if(!ehMestre()||!estado?.ativo)return 0;const d=dados.get(id),ms=Math.round(intervaloAcaoMs(d?.acoes||2,vel())*acoes),ate=Math.max(prontoEm.get(id)||0,Date.now())+ms;prontoEm.set(id,ate);void gravarEstado({prontoEm:{[id]:ate}});return ms;};
 const diagnosticoCriatura=id=>{const t=tokens.get(id);if(!t)return null;const d=dados.get(id);let perfil=null;try{perfil=d?perfilDe(t,d):null;}catch(_){}
  return {ativo:!!estado?.ativo,pausado:!!estado?.pausado,auto:!!automatico(t),vivo:!!estadoVivo(health,id),dados:!!d,mov:d?d.mov:null,ataques:d?(d.ataques||[]).length:null,imovel:!!perfil?.imovel,fila:naFila.has(id),viu:(alerta.get(id)?alerta.get(id).size:0),alvo:alvoAtual.get(id)||'',fugindo:fugindo.has(id)};};
 // v203: a vida (rotina, caça, comida, fuga) roda junto do tempo real nos bichos que NÃO estão em luta agora: quem tem alvo, foge, anda para atacar ou acabou de agir fica por conta do tempo real
 const ocupadoRT=id=>alvoAtual.has(id)||fugindo.has(id)||movendo.has(id)||(prontoEm.get(id)||0)>Date.now()-2500;
 const ponte={ocupado:ocupadoRT,diagnosticoCriatura,abrirOpcoes:()=>abrirGaveta(gaveta?.hidden!==false),pausar:pausarJogo,definirAutomatico,assumir,assumirPsi,assumirControle,atrasar,iniciar:iniciarRT,automatico:id=>{const t=tokens.get(id);return t?automatico(t):false;},ativo:()=>!!estado?.ativo,estado:()=>estado,parar:()=>{latido.parar();clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});barra?.remove();gaveta?.remove();root.getElementById('rtEmergencia')?.remove();}};
 win.mesaTempoRealV111=ponte;
 return ponte;
}
