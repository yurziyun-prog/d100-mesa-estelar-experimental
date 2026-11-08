// Mesa Estelar v181 — 📜 Roteiros e 🤖 Mesa automática.
//
// • Jogadores: diálogos com escolhas e testes (o grupo do mapa vê o mesmo quadro), narrações que aparecem na tela,
//   e o 📜 diário de missões. Eles só fazem PEDIDOS (combatesAtivos/mesaRoteiro/acoes).
// • Navegador do mestre: lê os roteiros (só ele lê), roda os gatilhos, rola os testes, faz os NPCs/criaturas
//   aparecerem, começa lutas, passa o relógio e leva o grupo de mapa em mapa.
// • 🤖 Mesa automática: o mestre deixa o site aberto (pode sair de perto) e a mesa anda sozinha — segue o grupo
//   de mapa em mapa, responde os testes ocultos das conversas logo, e não deixa o computador dormir.
// Módulo à parte: se falhar, a mesa segue igual.

import {DOC,DOC_EST,PUB,PEDIDOS,ALCANCE_NPC,sem,DIFS,rolar,CONDICOES,EFEITOS,ACOES_MISSAO,avaliar,mapaDoGrupo,novoId,dialogoDoNpc,vistaDialogo,resolverOpcao,
 aplicarMissao,diario,sortear,proximaHora,conferir,historiaPronta,NPCS_HISTORIA} from './mesa-roteiros-dados.js?v=181';
import {gerarNpc} from './mesa-diretor-dados.js?v=108';
import {renderizarMiniatura,specDeNpc,MARCA_MINI} from './mesa-miniaturas.js?v=194';
import {tamanhoMiniaturaM} from './mesa-tamanhos.js?v=134';
import {livrePerto} from './mesa-ligacoes.js?v=154';
import {retratoDoNpc} from './mesa-retratos.js?v=148';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=v=>JSON.parse(JSON.stringify(v??null));
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',ARQ=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
const RELOGIO='combatesAtivos/mesaRelogio',TEMPO_REAL='combatesAtivos/mesaTempoReal',HIST='combatesAtivos/mapaMesaSyncHistorico';
const dorme=ms=>new Promise(r=>setTimeout(r,ms));

const ESTILO=`
#rtDlg{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9985;width:min(780px,calc(100vw - 32px));height:262px;box-sizing:border-box;display:grid;grid-template-columns:112px 1fr;gap:12px;padding:12px;border-radius:16px;background:linear-gradient(180deg,#141b2c,#0b1020);border:1px solid #c9a85a;box-shadow:0 10px 40px #000c;color:#e8eefc;font:14px 'Segoe UI',Arial,sans-serif;animation:rtEntra .45s ease-out}
#rtDlg[hidden]{display:none}
#rtDlg .rt-ret{width:112px;height:140px;border-radius:12px;background:#0a0f1a center/cover no-repeat;border:1px solid #2f4664;display:grid;place-items:center;font-size:52px}
#rtDlg .rt-nome{font:700 15px 'Segoe UI',Arial,sans-serif;color:#ffd98a;margin-bottom:4px;display:flex;justify-content:space-between;gap:8px}
#rtDlg .rt-nome button{background:none;border:1px solid #3b5878;color:#c6d3e6;border-radius:8px;cursor:pointer;padding:1px 8px}
#rtDlg .rt-col{display:flex;flex-direction:column;min-height:0}
#rtDlg .rt-conv{flex:1;min-height:0;overflow:auto;margin:2px 0 6px;padding-right:4px;line-height:1.4}
#rtDlg .rt-conv .l{font-size:12.5px;color:#9fb3d1;margin:1px 0}
#rtDlg .rt-conv .l.ok{color:#7ee0a0}#rtDlg .rt-conv .l.no{color:#ff9a8a}#rtDlg .rt-conv .l.pj{color:#c6d3e6;font-style:italic}
#rtDlg .rt-conv .f{font-size:14.5px;color:#f2ead8;margin-top:3px}
#rtDlg .rt-ops{display:flex;flex-direction:column;gap:4px;overflow:auto;flex:0 1 auto;max-height:118px;min-height:0}
#rtDlg .rt-ops button{text-align:left;border:1px solid #3b5878;background:#16233a;color:#e8eefc;border-radius:9px;padding:5px 10px;cursor:pointer;font:13.5px 'Segoe UI',Arial,sans-serif}
#rtDlg .rt-ops button:hover,#rtDlg .rt-ops button.ctl-foco{border-color:#ffd98a;background:#22324f}
#rtDlg .rt-ops button small{color:#ffd98a;margin-left:6px}
#rtDlg .rt-ops button:disabled{opacity:.5;cursor:wait}
#rtNar{position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:9990;width:min(620px,calc(100vw - 32px));box-sizing:border-box;padding:20px 24px 16px;border-radius:18px;background:radial-gradient(ellipse at top,#22314f,#0b1020 75%);border:1px solid #c9a85a;box-shadow:0 0 0 1px #000,0 18px 60px #000d;color:#f2ead8;font:15px Georgia,'Times New Roman',serif;text-align:center;animation:rtEntra .7s ease-out}
#rtNar h3{margin:0 0 8px;font:700 19px 'Segoe UI',Arial,sans-serif;color:#ffd98a;letter-spacing:.3px}
#rtNar p{margin:0 0 14px;line-height:1.55;white-space:pre-line}
#rtNar button{border:1px solid #c9a85a;background:#2a2110;color:#ffe9b8;border-radius:10px;padding:6px 16px;cursor:pointer;font:600 13.5px 'Segoe UI',Arial,sans-serif}
#rtNar .rt-fila{font:12px 'Segoe UI',Arial,sans-serif;color:#9fb3d1;margin-left:10px}
@keyframes rtEntra{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
#rtMissoes,#rtBotao{border-radius:999px;border:1px solid #c9a85a;background:#201a0a;color:#ffe9b8;padding:6px 12px;font:600 13px 'Segoe UI',Arial,sans-serif;cursor:pointer;position:relative}
#rtMissoes[data-novo="1"]::after{content:'';position:absolute;top:2px;right:3px;width:8px;height:8px;border-radius:50%;background:#ff6b6b}
#rtAutoChip{border-radius:999px;border:1px solid #57e3a1;background:#0d241a;color:#bff5d8;padding:5px 10px;font:600 12px 'Segoe UI',Arial,sans-serif}
#rtDiario{position:fixed;left:16px;bottom:64px;z-index:9984;width:min(380px,calc(100vw - 32px));height:min(420px,70vh);overflow:auto;box-sizing:border-box;padding:12px 14px;border-radius:14px;background:#120f08;border:1px solid #c9a85a;color:#f2ead8;font:13.5px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 40px #000c}
#rtDiario[hidden]{display:none}
#rtDiario h3{margin:0 0 8px;color:#ffd98a;font-size:16px;display:flex;justify-content:space-between}
#rtDiario h3 button{background:none;border:none;color:#c6d3e6;cursor:pointer;font-size:16px}
#rtDiario .rt-m{border:1px solid #3a2e14;border-radius:10px;padding:8px 10px;margin-bottom:8px;background:#1a150b}
#rtDiario .rt-m b{color:#ffe9b8}#rtDiario .rt-m .at{color:#ffd98a;margin-top:4px}#rtDiario .rt-m .ft{color:#8a8070;text-decoration:line-through;font-size:12.5px}
#rtDiario .rt-m.concluida{opacity:.7}#rtDiario .rt-m.falhou{opacity:.6;border-color:#5a2020}
#rtEd{position:fixed;inset:3vh 2vw;z-index:10020;display:flex;flex-direction:column;border-radius:16px;background:#0e1322;border:1px solid #c9a85a;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 20px 80px #000e;overflow:hidden}
#rtEd[hidden]{display:none}
#rtEd .ed-top{display:flex;gap:6px;align-items:center;padding:8px 10px;border-bottom:1px solid #2a3550;flex:0 0 auto}
#rtEd .ed-top b{color:#ffd98a;font-size:15px;margin-right:8px}
#rtEd .ed-top .ab{border:1px solid #2f4664;background:#16233a;color:#d8e6ff;border-radius:8px;padding:5px 11px;cursor:pointer;font:600 13px 'Segoe UI',Arial,sans-serif}
#rtEd .ed-top .ab[aria-pressed="true"]{background:#3a2e14;border-color:#c9a85a;color:#ffe9b8}
#rtEd .ed-top .st{margin-left:auto;color:#9fb3d1;font-size:12px;min-width:150px;text-align:right}
#rtEd .ed-corpo{flex:1;display:grid;grid-template-columns:250px 1fr;min-height:0}
#rtEd .ed-lista{border-right:1px solid #2a3550;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:4px}
#rtEd .ed-lista button{text-align:left;border:1px solid #243048;background:#121a2c;color:#d8e6ff;border-radius:8px;padding:6px 8px;cursor:pointer;font:13px 'Segoe UI',Arial,sans-serif}
#rtEd .ed-lista button[aria-pressed="true"]{border-color:#c9a85a;background:#2a2110}
#rtEd .ed-lista .novo{border-style:dashed;color:#ffd98a}
#rtEd .ed-form{overflow:auto;padding:10px 14px}
#rtEd .ed-form.cheio{grid-column:1 / -1}
#rtEd label{display:inline-flex;flex-direction:column;gap:2px;margin:0 8px 6px 0;color:#9fb3d1;font-size:11.5px;vertical-align:top}
#rtEd input,#rtEd select,#rtEd textarea{background:#0a0f1a;color:#e8eefc;border:1px solid #2f4664;border-radius:7px;padding:4px 6px;font:13px 'Segoe UI',Arial,sans-serif}
#rtEd textarea{width:min(640px,60vw);min-height:54px;resize:vertical}
#rtEd input[type=checkbox]{width:auto}
#rtEd .bx{border:1px solid #2a3550;border-radius:10px;padding:8px 10px;margin:6px 0;background:#111829}
#rtEd .bx.op{background:#0f1524;border-color:#243048}
#rtEd .bx h4{margin:0 0 6px;color:#ffd98a;font-size:13px;display:flex;gap:6px;align-items:center}
#rtEd .lin{display:flex;flex-wrap:wrap;align-items:flex-end;gap:2px;border-left:3px solid #3b5878;padding:4px 0 2px 8px;margin:4px 0}
#rtEd .b{border:1px solid #2f4664;background:#16233a;color:#d8e6ff;border-radius:7px;padding:3px 8px;cursor:pointer;font:12.5px 'Segoe UI',Arial,sans-serif}
#rtEd .b.vm{border-color:#7a3030;color:#ffb0a0}#rtEd .b.am{border-color:#c9a85a;color:#ffe9b8}
#rtEd .dica{color:#7f93b3;font-size:11.5px;margin:2px 0 6px}
#rtEd .aviso{color:#ffb0a0;font-size:12px}
#rtEd .log{font-family:Consolas,monospace;font-size:12px;color:#b8c7e0;white-space:pre-wrap;max-height:260px;overflow:auto;background:#0a0f1a;border-radius:8px;padding:6px 8px}
#rtEd .sw{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;color:#e8eefc;flex-direction:row;margin:4px 14px 8px 0}
`;

export function instalarRoteiros(dep){
 const root=dep.root||document,win=root.defaultView||window;if(win.mesaRoteirosV181)return win.mesaRoteirosV181;
 const el=id=>root.getElementById(id);
 const D=p=>dep.doc(dep.db,...p.split('/'));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const mapas=()=>{try{return dep.mapas?.()||[];}catch(_){return [];}};
 const npcs=()=>{try{return dep.npcs?.()||[];}catch(_){return [];}};
 const criaturas=()=>{try{return dep.criaturas?.()||[];}catch(_){return [];}};
 const pericias=()=>{try{return [...new Set((dep.pericias?.()||[]).map(p=>String(p?.nome||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'));}catch(_){return [];}};
 const mapaAqui=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 const dimsDe=id=>{const m=mapas().find(x=>String(x.id)===String(id));return {W:Number(m?.larguraM)||28,H:Number(m?.alturaM)||14};};
 const nomeMapa=id=>mapas().find(x=>String(x.id)===String(id))?.nome||id;
 if(!el('rtCss')){const s=root.createElement('style');s.id='rtCss';s.textContent=ESTILO;root.head.append(s);}

 let pub={},R={missoes:[],dialogos:[],gatilhos:[]},E={flags:{},missoes:{},feitos:{},ok:{},feitas:{},log:[]},carregouR=false,carregouE=false;
 let posicoes=new Map(),parar=[],esperando='',vistoNar=new Set(),filaNar=[],diarioVisto='';
 try{vistoNar=new Set(JSON.parse(win.localStorage?.getItem('mesa:rtNarVistas')||'[]'));}catch(_){}
 const lembrarNar=()=>{try{win.localStorage?.setItem('mesa:rtNarVistas',JSON.stringify([...vistoNar].slice(-60)));}catch(_){}};
 try{diarioVisto=win.localStorage?.getItem('mesa:rtDiario')||'';}catch(_){}

 // ============================================================ todos: o que está acontecendo
 parar.push(dep.onSnapshot(D(PUB),s=>{pub=s.exists()?(s.data()||{}):{};desenharTudo();},()=>{}));
 const meuAtor=()=>{try{const a=ctl()?.ator?.();return a&&(ehMestre()||String(a.donoUid||'')===uid())?a:null;}catch(_){return null;}};
 async function pedir(tipo,extra={}){
  const a=meuAtor(),mapa=mapaAqui();
  const cmd={tipo,mapa,personagemId:String(a?.id||(ehMestre()?'__mestre__':'')),donoUid:uid(),em:Date.now(),...extra};
  if(!cmd.personagemId){aviso('Escolha seu personagem primeiro.');return;}
  if(ehMestre()){await processar('local'+Date.now(),cmd);return;}
  try{await dep.setDoc(D(PEDIDOS+'/p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),clean(cmd));}catch(e){aviso('Não deu: '+(e?.message||e));}
 }
 function aviso(t,ms=3400){el('rtAviso')?.remove();const n=root.createElement('div');n.id='rtAviso';n.textContent=t;n.style.cssText="position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:9999;background:#201a0a;border:1px solid #c9a85a;color:#ffe9b8;padding:8px 14px;border-radius:12px;font:600 13px 'Segoe UI',Arial,sans-serif;pointer-events:none;max-width:min(92vw,640px);text-align:center";root.body.append(n);setTimeout(()=>n.remove(),ms);}

 // ---------------------------------------------------------------- 💬 diálogo
 function desenharDialogo(){
  const v=pub.dialogos?.[mapaAqui()];let box=el('rtDlg');
  if(!v?.aberto){if(box)box.hidden=true;esperando='';return;}
  if(!box){box=root.createElement('section');box.id='rtDlg';box.setAttribute('aria-label','Diálogo');root.body.append(box);
   box.addEventListener('pointerdown',e=>e.stopPropagation());
   box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.op){esperando=b.dataset.op;box.querySelectorAll('[data-op]').forEach(x=>x.disabled=true);void pedir('opcao',{chave:b.dataset.chave,opcao:b.dataset.op});return;}
    if(b.dataset.fechar!==undefined)void pedir('fechar',{chave:b.dataset.chave});});}
  const html=`<div class="rt-ret" style="${v.retrato?`background-image:url('${esc(v.retrato)}');font-size:0`:''}">${v.retrato?'':esc(v.icone||'💬')}</div>
   <div class="rt-col"><div class="rt-nome"><span>${esc(v.icone||'')} ${esc(v.nome||'')}</span><button type="button" data-fechar data-chave="${esc(v.chave)}" title="Encerrar a conversa">✖</button></div>
   <div class="rt-conv">${(v.log||[]).map(l=>`<div class="l ${l.ok===true?'ok':l.ok===false?'no':l.pj?'pj':''}">${esc(l.t)}</div>`).join('')}${v.fala?`<div class="f">${esc(v.fala)}</div>`:''}</div>
   <div class="rt-ops">${(v.opcoes||[]).map(o=>`<button type="button" data-op="${esc(o.id)}" data-chave="${esc(v.chave)}" ${esperando&&esperando===o.id?'disabled':''}>▸ ${esc(o.texto)}${o.teste?`<small>🎲 ${esc(o.teste)}</small>`:''}</button>`).join('')||'<span style="color:#9fb3d1">…</span>'}</div></div>`;
  if(box.dataset.h!==html){box.innerHTML=html;box.dataset.h=html;esperando='';const cv=box.querySelector('.rt-conv');if(cv)cv.scrollTop=cv.scrollHeight;}
  box.hidden=false;
 }
 // ---------------------------------------------------------------- 📣 narração
 function desenharNarracao(){
  const lista=[...(pub.narracoes?.[mapaAqui()]||[]),...(pub.narracoes?.['*']||[])].filter(n=>n&&!vistoNar.has(n.id)&&Date.now()-Number(n.em||0)<20*60000).sort((a,b)=>a.em-b.em);
  filaNar=lista;let c=el('rtNar');
  if(!lista.length){c?.remove();return;}
  const n=lista[0];if(c&&c.dataset.id===n.id){const f=c.querySelector('.rt-fila');if(f)f.textContent=lista.length>1?`+${lista.length-1}`:'';return;}
  c?.remove();c=root.createElement('div');c.id='rtNar';c.dataset.id=n.id;c.setAttribute('role','dialog');
  c.innerHTML=`${n.titulo?`<h3>${esc(n.titulo)}</h3>`:''}<p>${esc(n.texto)}</p><button type="button">▶ Continuar</button><span class="rt-fila">${lista.length>1?`+${lista.length-1}`:''}</span>`;
  c.addEventListener('pointerdown',e=>e.stopPropagation());
  const fechar=()=>{vistoNar.add(n.id);lembrarNar();c.remove();desenharNarracao();};
  c.querySelector('button').addEventListener('click',fechar);setTimeout(()=>{if(c.isConnected)fechar();},45000);root.body.append(c);
 }
 // ---------------------------------------------------------------- 📜 diário
 function desenharDiario(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;if(!sc)return;const lista=pub.diario||[];
  let bt=el('rtMissoes');
  if(!lista.length){bt?.remove();el('rtDiario')?.remove();}
  else{if(!bt){bt=root.createElement('button');bt.type='button';bt.id='rtMissoes';bt.textContent='📜 Missões';bt.title='Diário de missões do grupo';
    bt.addEventListener('pointerdown',e=>e.stopPropagation());bt.addEventListener('click',()=>{const d=diarioBox();d.hidden=!d.hidden;if(!d.hidden){diarioVisto=assinatura();try{win.localStorage?.setItem('mesa:rtDiario',diarioVisto);}catch(_){}bt.dataset.novo='0';}});sc.append(bt);}
   bt.dataset.novo=assinatura()!==diarioVisto?'1':'0';const d=el('rtDiario');if(d&&!d.hidden)preencherDiario(d);}
  let ch=el('rtAutoChip');const vivo=pub.automatica&&Date.now()-Number(pub.vivoEm||0)<3*60000;
  if(vivo&&!ch){ch=root.createElement('span');ch.id='rtAutoChip';ch.textContent='🤖 Mesa automática';ch.title='O mestre deixou a mesa andando sozinha: diálogos, eventos e lutas acontecem sem ele.';sc.append(ch);}
  if(!vivo)ch?.remove();
 }
 const assinatura=()=>JSON.stringify((pub.diario||[]).map(m=>[m.id,m.estado,m.atual]));
 function diarioBox(){let d=el('rtDiario');if(!d){d=root.createElement('aside');d.id='rtDiario';d.hidden=true;d.addEventListener('pointerdown',e=>e.stopPropagation());d.addEventListener('click',e=>{if(e.target.closest('[data-x]'))d.hidden=true;});root.body.append(d);}preencherDiario(d);return d;}
 function preencherDiario(d){
  const html=`<h3>📜 Missões <button type="button" data-x title="Fechar">✖</button></h3>`+(pub.diario||[]).map(m=>`<div class="rt-m ${esc(m.estado)}"><b>${m.estado==='concluida'?'✅ ':m.estado==='falhou'?'❌ ':'🎯 '}${esc(m.nome)}</b>${m.descricao?`<div style="color:#b8ad98;font-size:12.5px">${esc(m.descricao)}</div>`:''}${(m.feitas||[]).map(t=>`<div class="ft">✔ ${esc(t)}</div>`).join('')}${m.estado==='ativa'&&m.atual?`<div class="at">➜ ${esc(m.atual)}</div>`:''}</div>`).join('');
  if(d.dataset.h!==html){d.innerHTML=html;d.dataset.h=html;}
 }
 function desenharTudo(){try{desenharDialogo();desenharNarracao();desenharDiario();}catch(e){console.warn('[Roteiros] tela',e);}}
 setInterval(desenharTudo,1500); // troca de mapa do jogador

 // ---------------------------------------------------------------- clique no NPC
 function npcDoToken(id){const raw=decodeURIComponent(String(id||''));if(!raw.startsWith('syncnpc:'))return null;const base=raw.slice(8).split('~')[0];return npcs().find(n=>String(n.id)===base)||null;}
 function ganchoNpc(){
  const ant=win.mesaDialogoNPC_;if(ant?.__rt181)return;
  const f=(id,atorId)=>{
   try{const dec=v=>{try{return decodeURIComponent(String(v));}catch(_){return String(v);}};const t=(ctl()?.todosTokens?.()||[]).find(x=>String(x.id)===String(id)||dec(x.id)===dec(id));const n=npcDoToken(id);
    const nomes=[t?.nome,n?.nome].filter(Boolean).map(sem);
    const tem=(pub.npcsDialogo||[]).find(p=>nomes.some(x=>x.includes(sem(p))));
    if(tem&&!ctl()?.emCombate?.()){
     const a=meuAtor();if(!a)return typeof ant==='function'?ant(id,atorId):false;
     const {W,H}=dimsDe(mapaAqui());if(t&&Math.hypot((a.x-t.x)*W/28,(a.y-t.y)*H/14)>ALCANCE_NPC){aviso(`🚶 Chegue perto (uns 3 m) para conversar.`);return true;}
     void pedir('abrir',{token:String(t?.id||id)});return true;}
   }catch(e){console.warn('[Roteiros] NPC',e);}
   return typeof ant==='function'?ant(id,atorId):false;};
  f.__rt181=true;win.mesaDialogoNPC_=f;
 }
 setInterval(ganchoNpc,2000);setTimeout(ganchoNpc,1200);

 // ============================================================ mestre: motor
 let ultimoSalvarE=0,timerE=0,rodando=false,lock=null,ultSeguir=0,ultVivo=0,pararM=[];
 const log=t=>{E.log=[`${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} ${t}`,...(E.log||[])].slice(0,80);salvarE();desenharEditor(false);};
 function salvarE(){clearTimeout(timerE);timerE=setTimeout(async()=>{if(!ehMestre())return;try{await dep.setDoc(D(DOC_EST),clean(E));ultimoSalvarE=Date.now();}catch(e){console.warn('[Roteiros] estado',e);}},500);}
 async function salvarPub(parcial){pub={...pub,...parcial};desenharTudo();if(!ehMestre())return;try{await dep.setDoc(D(PUB),clean(pub));}catch(e){console.warn('[Roteiros] público',e);}}
 function publicarResumo(){
  const npcsDialogo=[...new Set((R.dialogos||[]).map(d=>String(d.npc||'').trim()).filter(Boolean))];
  return salvarPub({diario:diario(R.missoes||[],E.missoes||{}),npcsDialogo,automatica:!!R.automatica,vivoEm:Date.now()});
 }
 function iniciarMestre(){
  if(pararM.length)return;
  pararM.push(dep.onSnapshot(D(DOC),s=>{const v=s.exists()?s.data()||{}:{};R={missoes:[],dialogos:[],gatilhos:[],...v};carregouR=true;if(!editando())rascunho=null;void publicarResumo();desenharEditor(false);ajustarAuto();},e=>console.warn('[Roteiros]',e)));
  pararM.push(dep.onSnapshot(D(DOC_EST),s=>{if(Date.now()-ultimoSalvarE<1500&&carregouE)return;const v=s.exists()?s.data()||{}:{};E={flags:{},missoes:{},feitos:{},ok:{},feitas:{},log:[],...v};carregouE=true;desenharEditor(false);},()=>{}));
  pararM.push(dep.onSnapshot(dep.collection(dep.db,...POS.split('/')),q=>{const m=new Map();q.forEach(d=>m.set(d.id,{id:d.id,...d.data()}));posicoes=m;},()=>{}));
  pararM.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},()=>{}));
  const t=setInterval(()=>{void tick();},1500);pararM.push(()=>clearInterval(t));
 }
 // ---- contexto das condições
 const objetosCache=new Map();
 async function objetosDe(mapa){
  const c=objetosCache.get(mapa);if(c&&Date.now()-c.em<4000)return c.lista;
  let objs=[];try{const cena=ctl()?.cenaAtual?.();if(cena&&String(cena.mapId||'')===mapa)objs=cena.objects||[];else{const s=await dep.getDoc(D(ARQ(mapa)));objs=s.exists()?(s.data()?.objects||[]):[];}}catch(_){}
  const {W,H}=dimsDe(mapa),lista=objs.filter(o=>o&&!o.destruido).map(o=>({nome:o.nome||'',x:Number(o.x)*W/28,y:Number(o.y)*H/14,w:Number(o.larguraM)||1,h:Number(o.alturaM)||1,ang:Number(o.angulo)||0}));objetosCache.set(mapa,{em:Date.now(),lista});return lista;
 }
 const ehPC=t=>!!String(t?.donoUid||'')&&!decodeURIComponent(String(t?.id||'')).startsWith('sync');
 function pcs(){const out=[];for(const t of posicoes.values()){if(!ehPC(t)||!t.mapaId)continue;const {W,H}=dimsDe(t.mapaId);out.push({id:t.id,nome:t.nome,mapa:String(t.mapaId),x:Number(t.x)*W/28,y:Number(t.y)*H/14,t});}return out;}
 function inimigosEm(mapa){
  let n=0;for(const t of posicoes.values()){if(String(t.mapaId||'')!==mapa||!decodeURIComponent(String(t.id)).startsWith('synccriatura:'))continue;
   const st=ctl()?.saude?.(t.id)||{};if(st.morto||st.inconsciente||st.incapacitado||st.dormindo)continue;n++;}
  return n;
 }
 async function contexto(){
  const lista=pcs(),mapasUsados=new Set();for(const g of R.gatilhos||[])for(const c of g.cond||[])if(c.tipo==='perto'&&c.alvo&&c.mapa)mapasUsados.add(String(c.mapa));
  const objs=new Map();for(const m of mapasUsados)objs.set(m,await objetosDe(m));
  let hora=null;try{const h=win.mesaRelogio?.hora?.();if(Number.isFinite(h))hora=h;}catch(_){}
  return {pcs:lista,hora,flags:E.flags||{},missoes:E.missoes||{},objetos:m=>objs.get(String(m))||[],inimigos:inimigosEm};
 }
 let tickando=false;
 async function tick(){
  if(!ehMestre()||!carregouR||!carregouE||tickando)return;tickando=true;
  try{
   if(Date.now()-ultVivo>60000){ultVivo=Date.now();void publicarResumo();}
   if(R.automatica)await seguirGrupo();
   if(!R.rodando)return;
   const ctx=await contexto();let mudou=false;
   for(const g of R.gatilhos||[]){
    if(g.ativo===false)continue;const r=avaliar(g.cond||[],ctx),antes=!!E.ok?.[g.id];
    if(r.ok!==antes){E.ok={...(E.ok||{}),[g.id]:r.ok};mudou=true;}
    if(r.ok&&!antes&&!(g.uma!==false&&E.feitos?.[g.id])){E.feitos={...(E.feitos||{}),[g.id]:Date.now()};mudou=true;await disparar(g,r.mapa);}
   }
   if(mudou)salvarE();
  }catch(e){console.warn('[Roteiros] gatilhos',e);}finally{tickando=false;}
 }
 async function disparar(g,mapa){log(`⚡ ${g.nome} (${nomeMapa(mapa)})`);await executar(g.efeitos||[],{mapa,origem:g.nome});}
 async function executar(lista,ctx){const l=lista||[];for(let i=0;i<l.length;i++){const e=l[i];
  if(e?.tipo==='esperar'){const ms=Math.max(0,Math.min(600,Number(e.segundos)||0))*1000,resto=l.slice(i+1);setTimeout(()=>{void executar(resto,ctx);},ms);return;} // o resto segue depois, sem travar os outros eventos
  try{await efeito(e,ctx);}catch(err){log(`⚠️ ${EFEITOS[e.tipo]?.nome||e.tipo}: ${err?.message||err}`);}}}
 // ---- efeitos
 async function efeito(e,ctx){
  const mapa=String(e.mapa||ctx.mapa||'');
  switch(e.tipo){
   case 'narrar':{const n={id:novoId('n'),titulo:e.titulo||'',texto:e.texto||'',em:Date.now()},k=mapa||'*';const nar={...(pub.narracoes||{})};nar[k]=[...(nar[k]||[]),n].slice(-6);await salvarPub({narracoes:nar});await historico(`📣 ${n.titulo?n.titulo+' — ':''}${n.texto}`);return;}
   case 'flag':E.flags={...(E.flags||{}),[e.flag]:e.valor!==false&&e.valor!=='nao'};if(!E.flags[e.flag])delete E.flags[e.flag];salvarE();log(`🏷️ ${e.flag} = ${!!E.flags[e.flag]}`);return;
   case 'missao':{const antes=JSON.stringify(E.missoes?.[e.missao]||null);E.missoes=aplicarMissao(E.missoes||{},e,R.missoes||[]);salvarE();if(JSON.stringify(E.missoes?.[e.missao]||null)!==antes){const m=(R.missoes||[]).find(x=>x.id===e.missao);log(`🎯 ${m?.nome||e.missao}: ${ACOES_MISSAO[e.acao]||e.acao}`);await publicarResumo();
     if(m){const st=E.missoes[e.missao],et=(m.etapas||[]).find(x=>x.id===st.etapa);await efeito({tipo:'narrar',titulo:`📜 ${st.estado==='concluida'?'Missão concluída':st.estado==='falhou'?'Missão perdida':e.acao==='iniciar'?'Nova missão':'Missão atualizada'}`,texto:`${m.nome}${st.estado==='ativa'&&et?'\n➜ '+et.texto:''}`},ctx);}}return;}
   case 'dialogo':{const d=(R.dialogos||[]).find(x=>x.id===e.dialogo);if(!d)throw Error('diálogo não encontrado');await abrirDialogo(d,mapa);return;}
   case 'criatura':case 'npc':return aparecer(e,mapa);
   case 'remover':{const alvo=sem(e.nome);if(!alvo)return;let n=0;for(const t of posicoes.values()){if(String(t.mapaId||'')!==mapa||ehPC(t))continue;const nn=npcDoToken(t.id);if(![t.nome,nn?.nome].some(x=>sem(x).includes(alvo)))continue;try{await dep.deleteDoc(D(POS+'/'+t.id));n++;}catch(_){}}log(`👋 ${n} saiu(saíram) de ${nomeMapa(mapa)}`);return;}
   case 'levar':return levar(String(ctx.mapa||''),String(e.mapa||''));
   case 'combate':return comecarLuta(mapa);
   case 'relogio':{const agora=Number(win.mesaRelogio?.agora?.())||0;const alvo=e.modo==='ate'?proximaHora(agora,Number(e.horas)||6):agora+(Number(e.horas)||1)*3600000;await dep.setDoc(D(RELOGIO),{jogoMs:alvo,realMs:Date.now()},{merge:true});const d=Math.floor(alvo/86400000)+1,h=Math.floor(alvo%86400000/3600000),mi=Math.floor(alvo%3600000/60000);log(`🕰️ relógio → dia ${d} · ${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`);return;}
   case 'esperar':await dorme(Math.max(0,Math.min(600,Number(e.segundos)||0))*1000);return;
   case 'sortear':{const o=sortear(e.opcoes||[]);if(o){log(`🎲 sorteio → caminho ${(e.opcoes||[]).indexOf(o)+1}`);await executar(o.efeitos||[],ctx);}return;}
  }
 }
 async function historico(t){try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HIST)),h=s.exists()?s.data():{entries:[],revision:0};tx.set(D(HIST),clean({...h,entries:[...(h.entries||[]),{id:'rt:'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),ts:Date.now(),actorUid:'',targetUid:'',message:String(t).slice(0,600)}].slice(-120),revision:Number(h.revision||0)+1}));});}catch(_){}}
 async function cenaObjs(mapa){try{const c=ctl()?.cenaAtual?.();if(c&&String(c.mapId||'')===mapa)return c.objects||[];const s=await dep.getDoc(D(ARQ(mapa)));return s.exists()?(s.data()?.objects||[]):[];}catch(_){return [];}}
 async function aparecer(e,mapa){
  if(!mapa)throw Error('sem mapa');const tipo=e.tipo==='criatura'?'criaturas':'npcs';
  const modelo=(tipo==='criaturas'?criaturas():npcs()).find(x=>String(x.id)===String(e.modelo));if(!modelo)throw Error(`${tipo==='criaturas'?'criatura':'NPC'} "${e.modelo}" não está no banco`);
  const {W,H}=dimsDe(mapa),objs=await cenaObjs(mapa),grupo=pcs().filter(p=>p.mapa===mapa);
  const cx=grupo.length?grupo.reduce((s,p)=>s+p.x,0)/grupo.length:W/2,cy=grupo.length?grupo.reduce((s,p)=>s+p.y,0)/grupo.length:H/2;
  let ax,ay;if(e.onde==='borda'){const cands=[[2,cy],[W-2,cy],[cx,2],[cx,H-2]].sort((a,b)=>Math.hypot(b[0]-cx,b[1]-cy)-Math.hypot(a[0]-cx,a[1]-cy));[ax,ay]=cands[Math.floor(Math.random()*2)];}
  else{const ang=Math.random()*Math.PI*2,d=e.onde==='perto'?3.5:6;ax=Math.max(1,Math.min(W-1,cx+Math.cos(ang)*d));ay=Math.max(1,Math.min(H-1,cy+Math.sin(ang)*d));}
  const ocup=[...objs,...[...posicoes.values()].filter(t=>String(t.mapaId)===mapa).map(t=>({x:t.x,y:t.y,larguraM:1,alturaM:1,bloqueiaMovimento:true}))];
  const qtd=Math.max(1,Math.min(12,Number(e.qtd)||1)),pref=tipo==='criaturas'?'synccriatura:':'syncnpc:';let feitos=0;
  for(let i=0;i<qtd;i++){
   let k=1,id=pref+modelo.id;while(posicoes.has(encodeURIComponent(id))&&String(posicoes.get(encodeURIComponent(id)).mapaId||'')){if(tipo==='npcs'&&!e.copias)break;k++;id=pref+modelo.id+'~'+k;}
   const q=livrePerto(ocup,(ax+(i%3)*1.3)*28/W,(ay+Math.floor(i/3)*1.3)*14/H,W,H,.6);ocup.push({x:q.x,y:q.y,larguraM:1,alturaM:1,bloqueiaMovimento:true});
   const nome=e.apelido||((tipo==='criaturas'?'Monstro · ':'')+modelo.nome+(k>1?' '+k:''));
   const facing=Math.atan2(cy-q.y*H/14,cx-q.x*W/28);
   const dados={nome,imagem:String(modelo.miniatura?.url||modelo.imagem||''),diametroM:tamanhoMiniaturaM(modelo),donoUid:'',x:+q.x.toFixed(3),y:+q.y.toFixed(3),revision:Date.now()%100000,facing:+facing.toFixed(3),camada:3,mapaId:mapa};
   await dep.setDoc(D(POS+'/'+encodeURIComponent(id)),clean(dados));posicoes.set(encodeURIComponent(id),{id:encodeURIComponent(id),...dados});feitos++;
  }
  log(`${tipo==='criaturas'?'🐾':'🧑'} ${feitos}× ${e.apelido||modelo.nome} em ${nomeMapa(mapa)}`);
 }
 async function levar(de,para){
  if(!para)throw Error('sem mapa de destino');const grupo=pcs().filter(p=>!de||p.mapa===de);if(!grupo.length)return;
  const {W,H}=dimsDe(para),objs=await cenaObjs(para),ocup=[...objs];let k=0;
  for(const p of grupo){const ang=k*1.1,q=livrePerto(ocup,(W/2+Math.cos(ang)*1.4)*28/W,(H/2+Math.sin(ang)*1.4)*14/H,W,H,.6);ocup.push({x:q.x,y:q.y,larguraM:1,alturaM:1,bloqueiaMovimento:true});k++;
   try{await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+p.id),s=await tx.get(r);if(!s.exists())return;tx.set(r,{...s.data(),mapaId:para,x:+q.x.toFixed(3),y:+q.y.toFixed(3),revision:Number(s.data().revision||0)+1});});}catch(e){console.warn('[Roteiros] levar',e);}
   try{await dep.setDoc(D('personagens/'+decodeURIComponent(p.id)),{localizacaoMapaId:para,localizacaoMapaDefinidaV92:true,...(win.__mesaLocalDoMapaV154_?{localizacaoCenarioId:String(win.__mesaLocalDoMapaV154_(para))}:{})},{merge:true});}catch(e){console.warn('[Roteiros] ficha',e);}}
  log(`🧭 grupo levado para ${nomeMapa(para)}`);
  if(R.automatica||ctl()?.mapaAtual?.()===de)try{await ctl()?.openMap?.(para);}catch(_){}
 }
 async function comecarLuta(mapa){
  if(!mapa)throw Error('sem mapa');const c=ctl();if(c?.emCombate?.())return;
  if(String(c?.mapaAtual?.()||'')!==mapa){await c?.openMap?.(mapa);await dorme(1800);}
  if(String(ctl()?.mapaAtual?.()||'')!==mapa)throw Error('não deu para abrir o mapa da luta');
  const faccoes={};for(const t of posicoes.values())if(String(t.mapaId||'')===mapa)faccoes[t.id]=ehPC(t)?'grupo':'inimigos';
  await dep.setDoc(D(TEMPO_REAL),clean({ativo:true,pausado:false,mapId:mapa,velocidade:1,faccoes,auto:{},prontoEm:{},mensagem:'',iniciadoEm:Date.now(),atualizadoEm:Date.now(),roteiroV181:true}));
  log(`⚔️ luta em tempo real em ${nomeMapa(mapa)}`);
 }
 // ---- diálogos
 function retratoDe(d){try{const n=npcs().find(x=>d.npc&&sem(x.nome).includes(sem(d.npc)));if(!n)return '';const u=[n.retrato,n.imagemPerfil].find(v=>typeof v==='string'&&/^(https?:|data:image)/.test(v));return u||retratoDoNpc(n);}catch(_){return '';}}
 async function abrirDialogo(d,mapa,nome=''){
  const ctx=await contexto(),v=vistaDialogo(d,d.inicio,ctx,{feitas:E.feitas?.[d.id]||{},nome:nome||d.nome,retrato:retratoDe(d)});if(!v)throw Error('diálogo sem fala inicial');
  await salvarPub({dialogos:{...(pub.dialogos||{}),[mapa]:v}});log(`💬 ${d.nome} aberto em ${nomeMapa(mapa)}`);
 }
 const processados=new Set();
 async function processar(id,cmd){
  if(!ehMestre()||processados.has(id))return;processados.add(id);
  try{
   if(!String(id).startsWith('local'))try{await dep.deleteDoc(D(PEDIDOS+'/'+id));}catch(_){}
   const mapa=String(cmd.mapa||''),tok=posicoes.get(String(cmd.personagemId))||posicoes.get(encodeURIComponent(String(cmd.personagemId)));
   const local=String(id).startsWith('local');
   if(!local&&(!tok||String(tok.donoUid||'')!==String(cmd.donoUid||'')))return;
   if(!local&&String(tok.mapaId||'')!==mapa)return;
   const quem=String(tok?.nome||'O mestre').replace(/^NPC · /,'');
   if(cmd.tipo==='abrir'){
    const t=posicoes.get(String(cmd.token))||posicoes.get(encodeURIComponent(String(cmd.token)));const n=npcDoToken(cmd.token);
    const d=dialogoDoNpc(R.dialogos,[t?.nome,n?.nome],await contexto());if(!d)return;
    const atual=pub.dialogos?.[mapa];if(atual?.aberto&&atual.dialogo===d.id)return;
    await abrirDialogo(d,mapa,t?.nome?String(t.nome).replace(/^NPC · /,''):'');return;}
   const v=pub.dialogos?.[mapa];if(!v?.aberto||v.chave!==cmd.chave)return;
   if(cmd.tipo==='fechar'){await salvarPub({dialogos:{...(pub.dialogos||{}),[mapa]:{...v,aberto:false}}});return;}
   if(cmd.tipo!=='opcao')return;
   const d=(R.dialogos||[]).find(x=>x.id===v.dialogo),no=d?.nos?.find(n=>n.id===v.no),o=no?.opcoes?.find(x=>x.id===cmd.opcao);if(!o)return;
   if(!v.opcoes.some(x=>x.id===o.id))return;
   let res=null,linhas=[...(v.log||[]),...(v.fala?[{t:v.fala}]:[]),{t:`${quem}: “${o.texto}”`,pj:true}];
   if(o.teste?.pericia){let val=25,nomeP=o.teste.pericia;
    for(const p of [o.teste.pericia,...(o.teste.alternativas||[])]){try{const r=await win.mesaObjetosV124_?.valor?.(tok||{id:cmd.personagemId},p);if(r&&Number(r.valor)>val){val=Number(r.valor);nomeP=r.nome||p;}}catch(_){}}
    res=rolar(val,o.teste.dif||'Padrão');linhas.push({t:`🎲 ${quem} · ${nomeP} ${res.die}/${res.chance} → ${res.grau}`,ok:res.sucesso});}
   const r=resolverOpcao(o,res);if(r.resposta)linhas.push({t:r.resposta,ok:o.teste?.pericia?r.ok:undefined});
   if(o.umaVez){E.feitas={...(E.feitas||{}),[d.id]:{...(E.feitas?.[d.id]||{}),[o.id]:Date.now()}};salvarE();}
   if(o.teste?.pericia)await historico(`🎲 ${quem} · ${o.texto} (${o.teste.pericia} ${res.die}/${res.chance}) → ${res.grau}${r.resposta?' · '+r.resposta:''}`);
   const ctx=await contexto();
   if(r.vai){const nv=vistaDialogo(d,r.vai,ctx,{feitas:E.feitas?.[d.id]||{},log:linhas,nome:v.nome,retrato:v.retrato,chave:v.chave});if(nv&&r.vai===v.no)nv.fala=''; // voltou à mesma fala: não repete
    await salvarPub({dialogos:{...(pub.dialogos||{}),[mapa]:nv||{...v,aberto:false}}});}
   else await salvarPub({dialogos:{...(pub.dialogos||{}),[mapa]:{...v,fala:'',log:linhas.slice(-8),opcoes:[],aberto:true,fimEm:Date.now()}}});
   if(!r.vai)setTimeout(()=>{const a=pub.dialogos?.[mapa];if(a?.chave===v.chave&&a.fimEm)void salvarPub({dialogos:{...(pub.dialogos||{}),[mapa]:{...a,aberto:false}}});},6000);
   await executar(r.efeitos,{mapa,origem:d.nome});
  }catch(e){console.warn('[Roteiros] pedido',e);}
 }
 // ---- 🤖 mesa automática
 async function seguirGrupo(){
  if(Date.now()-ultSeguir<6000)return;ultSeguir=Date.now();
  const c=ctl();if(!c||c.emCombate?.())return;try{const tr=win.mesaTempoRealV111?.ativo?.();if(tr)return;}catch(_){}
  const m=mapaDoGrupo(pcs());if(m&&String(c.mapaAtual?.()||'')!==m){try{await c.openMap?.(m);log(`🤖 seguindo o grupo: ${nomeMapa(m)}`);}catch(_){}}
 }
 async function ajustarAuto(){
  win.mesaAutomaticaV181_={ligada:()=>!!R.automatica&&ehMestre()};
  if(R.automatica&&ehMestre()){if(!lock&&win.navigator?.wakeLock?.request)try{lock=await win.navigator.wakeLock.request('screen');lock.addEventListener?.('release',()=>{lock=null;});}catch(_){}}
  else if(lock){try{await lock.release();}catch(_){}lock=null;}
 }
 root.addEventListener('visibilitychange',()=>{if(!root.hidden)void ajustarAuto();});

 // ============================================================ mestre: editor
 let rascunho=null,aba='mesa',sel='',timerR=0,editorAberto=false,status='';
 const editando=()=>editorAberto&&!!rascunho;
 function botao(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;if(!sc)return;let bt=el('rtBotao');
  if(!ehMestre()){bt?.remove();return;}
  if(!bt){bt=root.createElement('button');bt.type='button';bt.id='rtBotao';bt.textContent='📜 Roteiros';bt.title='Missões, diálogos, gatilhos e a 🤖 mesa automática';bt.addEventListener('pointerdown',e=>e.stopPropagation());bt.addEventListener('click',()=>abrirEditor(!editorAberto));sc.append(bt);}
  bt.textContent=R.automatica?'📜 Roteiros 🤖':R.rodando?'📜 Roteiros ⚡':'📜 Roteiros';
 }
 function abrirEditor(v=true){editorAberto=v;if(v&&!rascunho)rascunho=clean(R);desenharEditor(true);}
 const caminho=(o,p)=>p.split('.').reduce((a,k)=>a?.[/^\d+$/.test(k)?+k:k],o);
 function por(o,p,v){const ks=p.split('.');let a=o;for(let i=0;i<ks.length-1;i++){const k=/^\d+$/.test(ks[i])?+ks[i]:ks[i];if(a[k]==null)a[k]=/^\d+$/.test(ks[i+1])?[]:{};a=a[k];}a[/^\d+$/.test(ks.at(-1))?+ks.at(-1):ks.at(-1)]=v;}
 function guardar(){clearTimeout(timerR);status='✏️ guardando…';pintarStatus();timerR=setTimeout(async()=>{try{const v=clean({...rascunho,atualizadoEm:Date.now()});await dep.setDoc(D(DOC),v);status='✔ guardado';}catch(e){status='⚠️ '+(e?.message||e);}pintarStatus();},700);}
 function pintarStatus(){const s=el('rtEd')?.querySelector('.st');if(s)s.textContent=status;}
 // campos
 const opt=(lista,val)=>lista.map(([v,t])=>`<option value="${esc(v)}"${String(v)===String(val??'')?' selected':''}>${esc(t)}</option>`).join('');
 const optMapas=(val,vazio='— onde o gatilho aconteceu —')=>opt([['',vazio],...mapas().filter(m=>m?.id&&!/^__/.test(String(m.id))).sort((a,b)=>String(a.nome||a.id).localeCompare(String(b.nome||b.id),'pt')).map(m=>[m.id,m.nome||m.id])],val);
 const F={
  txt:(p,rot,v,extra='')=>`<label>${rot}<input data-p="${p}" value="${esc(v??'')}" ${extra}></label>`,
  num:(p,rot,v,extra='')=>`<label>${rot}<input type="number" data-p="${p}" data-num value="${esc(v??'')}" style="width:70px" ${extra}></label>`,
  area:(p,rot,v)=>`<label>${rot}<textarea data-p="${p}">${esc(v??'')}</textarea></label>`,
  sel:(p,rot,ops,v,re=false)=>`<label>${rot}<select data-p="${p}" ${re?'data-re':''}>${ops}</select></label>`,
  chk:(p,rot,v)=>`<label class="sw"><input type="checkbox" data-p="${p}" data-chk ${v?'checked':''}> ${rot}</label>`
 };
 const optMissoes=v=>opt([['','—'],...(rascunho.missoes||[]).map(m=>[m.id,m.nome])],v);
 const optEtapas=(mid,v,especiais=false)=>{const m=(rascunho.missoes||[]).find(x=>x.id===mid);return opt([...(especiais?[['__ativa','(qualquer etapa — ativa)'],['__concluida','(concluída)'],['__falhou','(falhou)'],['__nao','(ainda não começou)']]:[['','(primeira etapa)']]),...(m?.etapas||[]).map(e=>[e.id,e.texto])],v);};
 const optDialogos=v=>opt([['','—'],...(rascunho.dialogos||[]).map(d=>[d.id,d.nome])],v);
 const optPericias=v=>opt([['','(sem teste)'],...pericias().map(p=>[p,p])],v);
 function edEfeitos(p,lista=[],nivel=0){
  return `<div>${(lista||[]).map((e,i)=>{const q=`${p}.${i}`;let c='';
   switch(e.tipo){
    case 'narrar':c=F.txt(q+'.titulo','Título',e.titulo,'style="width:180px"')+F.area(q+'.texto','Texto',e.texto)+F.sel(q+'.mapa','Para quem está em',optMapas(e.mapa),e.mapa);break;
    case 'flag':c=F.txt(q+'.flag','Marca',e.flag,'style="width:150px"')+F.sel(q+'.valor','',opt([['true','liga'],['nao','desliga']],e.valor===false||e.valor==='nao'?'nao':'true'));break;
    case 'missao':c=F.sel(q+'.missao','Missão',optMissoes(e.missao),e.missao,true)+F.sel(q+'.acao','',opt(Object.entries(ACOES_MISSAO),e.acao||'iniciar'),e.acao,true)+(['iniciar','etapa'].includes(e.acao||'iniciar')?F.sel(q+'.etapa','Etapa',optEtapas(e.missao,e.etapa),e.etapa):'');break;
    case 'dialogo':c=F.sel(q+'.dialogo','Diálogo',optDialogos(e.dialogo),e.dialogo)+F.sel(q+'.mapa','No mapa',optMapas(e.mapa),e.mapa);break;
    case 'criatura':c=F.sel(q+'.modelo','Criatura',opt([['','—'],...criaturas().map(x=>[x.id,x.nome])],e.modelo),e.modelo)+F.num(q+'.qtd','Quantas',e.qtd??1)+F.sel(q+'.onde','Onde',opt([['perto','perto do grupo'],['meio','a uns 6 m do grupo'],['borda','numa beirada, longe']],e.onde||'borda'),e.onde)+F.sel(q+'.mapa','Mapa',optMapas(e.mapa),e.mapa);break;
    case 'npc':c=F.sel(q+'.modelo','NPC',opt([['','—'],...npcs().filter(n=>!/~/.test(n.id)).map(x=>[x.id,x.nome])],e.modelo),e.modelo)+F.txt(q+'.apelido','Nome que os jogadores veem (disfarce)',e.apelido,'style="width:180px"')+F.sel(q+'.onde','Onde',opt([['perto','perto do grupo'],['meio','a uns 6 m'],['borda','numa beirada']],e.onde||'perto'),e.onde)+F.sel(q+'.mapa','Mapa',optMapas(e.mapa),e.mapa);break;
    case 'remover':c=F.txt(q+'.nome','Parte do nome',e.nome)+F.sel(q+'.mapa','Mapa',optMapas(e.mapa),e.mapa);break;
    case 'levar':c=F.sel(q+'.mapa','Para o mapa',optMapas(e.mapa,'— escolha —'),e.mapa);break;
    case 'combate':c=F.sel(q+'.mapa','Mapa',optMapas(e.mapa),e.mapa);break;
    case 'relogio':c=F.sel(q+'.modo','',opt([['avancar','avançar'],['ate','até a hora']],e.modo||'avancar'),e.modo)+F.num(q+'.horas',(e.modo==='ate'?'Hora (0–23)':'Horas'),e.horas??1);break;
    case 'esperar':c=F.num(q+'.segundos','Segundos',e.segundos??10);break;
    case 'sortear':c=`<div style="flex-basis:100%">${(e.opcoes||[]).map((o,k)=>`<div class="bx op"><h4>Caminho ${k+1} ${F.num(`${q}.opcoes.${k}.peso`,'peso',o.peso??1)}<button type="button" class="b vm" data-rm="${q}.opcoes.${k}">🗑</button></h4>${nivel<2?edEfeitos(`${q}.opcoes.${k}.efeitos`,o.efeitos||[],nivel+1):''}</div>`).join('')}<button type="button" class="b" data-add="${q}.opcoes" data-modelo="caminho">+ caminho</button></div>`;break;
   }
   return `<div class="lin"><b style="color:#c6d3e6;min-width:150px;font-size:12.5px">${esc(EFEITOS[e.tipo]?.nome||e.tipo)}</b>${c}<button type="button" class="b" data-sobe="${q}" title="Subir">↑</button><button type="button" class="b vm" data-rm="${q}" title="Tirar">🗑</button></div>`;}).join('')}
   <select class="b" data-addtipo="${p}" data-qual="efeito"><option value="">+ efeito…</option>${Object.entries(EFEITOS).map(([k,v])=>`<option value="${k}">${esc(v.nome)}</option>`).join('')}</select></div>`;
 }
 function edConds(p,lista=[]){
  return `<div>${(lista||[]).map((c,i)=>{const q=`${p}.${i}`;let x='';
   switch(c.tipo){
    case 'mapa':x=`<label>Mapas (Ctrl+clique para vários)<select multiple size="4" data-p="${q}.mapas" data-multi style="min-width:240px">${mapas().filter(m=>m?.id&&!/^__/.test(String(m.id))).map(m=>`<option value="${esc(m.id)}"${(c.mapas||[]).map(String).includes(String(m.id))?' selected':''}>${esc(m.nome||m.id)}</option>`).join('')}</select></label>`;break;
    case 'perto':x=F.sel(q+'.mapa','Mapa',optMapas(c.mapa,'— escolha —'),c.mapa)+F.txt(q+'.alvo','Objeto (parte do nome)',c.alvo,'style="width:140px"')+F.num(q+'.x','ou x (m)',c.x)+F.num(q+'.y','y (m)',c.y)+F.num(q+'.raio','até (m)',c.raio??3);break;
    case 'hora':x=F.num(q+'.de','de (h)',c.de??20)+F.num(q+'.ate','até (h)',c.ate??5);break;
    case 'flag':x=F.txt(q+'.flag','Marca',c.flag,'style="width:150px"')+F.sel(q+'.valor','',opt([['true','está ligada'],['nao','está desligada']],c.valor===false||c.valor==='nao'?'nao':'true'));break;
    case 'missao':x=F.sel(q+'.missao','Missão',optMissoes(c.missao),c.missao,true)+F.sel(q+'.etapa','',optEtapas(c.missao,c.etapa||'__ativa',true),c.etapa);break;
    case 'semInimigos':x=F.sel(q+'.mapa','Mapa',optMapas(c.mapa,'— escolha —'),c.mapa);break;
   }
   return `<div class="lin" style="border-color:#57e3a1"><b style="color:#c6d3e6;min-width:150px;font-size:12.5px">${esc(CONDICOES[c.tipo]?.nome||c.tipo)}</b>${x}<button type="button" class="b vm" data-rm="${q}">🗑</button></div>`;}).join('')}
   <select class="b" data-addtipo="${p}" data-qual="cond"><option value="">+ condição…</option>${Object.entries(CONDICOES).map(([k,v])=>`<option value="${k}">${esc(v.nome)}</option>`).join('')}</select></div>`;
 }
 function formMesa(){
  const ps=pcs(),porMapa=new Map();for(const p of ps)porMapa.set(p.mapa,[...(porMapa.get(p.mapa)||[]),p.nome]);
  const faltas=conferir(rascunho,{mapas:mapas(),criaturas:criaturas(),npcs:npcs()});
  return `<div class="bx"><h4>🤖 Mesa automática</h4>
   ${F.chk('rodando','⚡ Gatilhos ligados (os eventos acontecem sozinhos)',rascunho.rodando)}${F.chk('automatica','🤖 Mesa automática (seguir o grupo, responder sozinha, não deixar o PC dormir)',rascunho.automatica)}
   <div class="dica">Para jogarem sem você: ligue os dois, deixe esta aba aberta e na frente (pode minimizar as outras janelas, mas não esta aba) e saia de perto. Os jogadores veem “🤖 Mesa automática”.</div></div>
   <div class="bx"><h4>👥 Onde está o grupo</h4>${[...porMapa].map(([m,n])=>`<div>🗺️ <b>${esc(nomeMapa(m))}</b>: ${esc(n.join(', '))}</div>`).join('')||'<div class="dica">Nenhum personagem de jogador no mapa.</div>'}
   <div style="margin-top:4px">🕰️ ${esc(win.mesaRelogio?.descrever?.()?.texto||'relógio desligado')}</div></div>
   <div class="bx"><h4>🏷️ Marcas</h4>${Object.keys(E.flags||{}).map(f=>`<span class="b" style="display:inline-block;margin:2px">${esc(f)} <a href="#" data-tirarflag="${esc(f)}" style="color:#ff9a8a;text-decoration:none">✖</a></span>`).join('')||'<span class="dica">nenhuma</span>'}
   <div style="margin-top:6px">${(rascunho.missoes||[]).map(m=>{const st=E.missoes?.[m.id];return `<div>🎯 ${esc(m.nome)}: <b>${st?st.estado+(st.estado==='ativa'?' → '+esc((m.etapas||[]).find(e=>e.id===st.etapa)?.texto||''):''):'não começou'}</b></div>`;}).join('')}</div></div>
   <div class="bx"><h4>📦 História pronta</h4><div class="dica">A noite na cidade sem nome (nave caída com a pista da sabotagem, monstros à noite, a caravana de Varra ao amanhecer) e a chegada a Therion (sorteio: Cronam ou Vaelkor disfarçado). Cria os 3 NPCs no banco se ainda não existirem. Não apaga o que você já escreveu.</div>
    <button type="button" class="b am" data-historia>📦 Instalar a história pronta</button> <button type="button" class="b vm" data-zerar title="Volta marcas, missões e gatilhos já disparados ao começo (não apaga o que está escrito)">↺ Zerar o andamento</button></div>
   ${faltas.length?`<div class="bx"><h4>⚠️ Conferir</h4>${faltas.map(f=>`<div class="aviso">• ${esc(f)}</div>`).join('')}</div>`:''}
   <div class="bx"><h4>📋 O que a mesa fez</h4><div class="log">${esc((E.log||[]).join('\n'))||'—'}</div></div>`;
 }
 function formMissao(i){const m=rascunho.missoes[i],p=`missoes.${i}`;
  return `${F.txt(p+'.nome','Nome',m.nome,'style="width:280px"')}<br>${F.area(p+'.descricao','Descrição (o que os jogadores leem)',m.descricao)}
  <div class="bx"><h4>Etapas</h4>${(m.etapas||[]).map((e,k)=>`<div class="lin">${F.txt(`${p}.etapas.${k}.texto`,`Etapa ${k+1}`,e.texto,'style="width:min(520px,50vw)"')}<button type="button" class="b" data-sobe="${p}.etapas.${k}">↑</button><button type="button" class="b vm" data-rm="${p}.etapas.${k}">🗑</button></div>`).join('')}
  <button type="button" class="b" data-add="${p}.etapas" data-modelo="etapa">+ etapa</button></div><button type="button" class="b vm" data-rmitem="missoes.${i}">🗑 Apagar a missão</button>`;}
 function formGatilho(i){const g=rascunho.gatilhos[i],p=`gatilhos.${i}`;
  return `${F.txt(p+'.nome','Nome',g.nome,'style="width:320px"')}${F.chk(p+'.ativo','ligado',g.ativo!==false)}${F.chk(p+'.uma','uma vez só',g.uma!==false)}
  <span class="dica">${E.feitos?.[g.id]?'já disparou '+new Date(E.feitos[g.id]).toLocaleString('pt-BR'):'ainda não disparou'}</span>
  <div class="bx"><h4>Quando… (todas valem ao mesmo tempo)</h4>${edConds(p+'.cond',g.cond)}</div>
  <div class="bx"><h4>…a mesa faz (em ordem)</h4>${edEfeitos(p+'.efeitos',g.efeitos)}</div>
  <button type="button" class="b am" data-disparar="${i}">▶ Disparar agora</button> <button type="button" class="b" data-rearmar="${i}">↺ Pode disparar de novo</button> <button type="button" class="b vm" data-rmitem="gatilhos.${i}">🗑 Apagar o gatilho</button>`;}
 function formDialogo(i){const d=rascunho.dialogos[i],p=`dialogos.${i}`,nos=d.nos||[];
  const optNos=(v,fim=true)=>opt([...(fim?[['fim','(fim da conversa)']]:[]),...nos.map((n,k)=>[n.id,`Fala ${k+1}: ${String(n.fala||'').slice(0,40)}`])],v);
  return `${F.txt(p+'.nome','Nome',d.nome,'style="width:220px"')}${F.txt(p+'.npc','NPC (parte do nome; vazio = só por gatilho)',d.npc,'style="width:200px"')}${F.txt(p+'.icone','Ícone',d.icone,'style="width:50px"')}${F.sel(p+'.inicio','Começa na',optNos(d.inicio,false),d.inicio)}
  <div class="bx"><h4>Só vale quando… (opcional)</h4>${edConds(p+'.cond',d.cond)}</div>
  ${nos.map((n,k)=>`<div class="bx"><h4>Fala ${k+1} <button type="button" class="b vm" data-rm="${p}.nos.${k}">🗑</button></h4>${F.area(`${p}.nos.${k}.fala`,'O que o NPC diz / o que acontece',n.fala)}
   ${(n.opcoes||[]).map((o,j)=>{const q=`${p}.nos.${k}.opcoes.${j}`,t=!!o.teste?.pericia;return `<div class="bx op"><h4>▸ ${F.txt(q+'.texto','Escolha',o.texto,'style="width:min(380px,40vw)"')}${F.sel(q+'.teste.pericia','Teste',optPericias(o.teste?.pericia),o.teste?.pericia,true)}${t?F.sel(q+'.teste.dif','Dificuldade',opt(DIFS.map(x=>[x,x]),o.teste?.dif||'Padrão'),o.teste?.dif):''}${F.chk(q+'.umaVez','uma vez só',o.umaVez)}<button type="button" class="b vm" data-rm="${q}">🗑</button></h4>
    ${t?F.txt(q+'.sucesso','Se acertar, diz',o.sucesso,'style="width:min(560px,52vw)"')+'<br>'+F.txt(q+'.falha','Se errar, diz',o.falha,'style="width:min(560px,52vw)"')+'<br>'+F.sel(q+'.vai','Acertou → vai para',optNos(o.vai||'fim'),o.vai)+F.sel(q+'.vaiFalha','Errou → vai para',optNos(o.vaiFalha||o.vai||'fim'),o.vaiFalha)
      :F.txt(q+'.resposta','Resposta',o.resposta,'style="width:min(560px,52vw)"')+'<br>'+F.sel(q+'.vai','Depois vai para',optNos(o.vai||'fim'),o.vai)}
    ${F.txt(q+'.precisaFlag','Só aparece com a marca',o.precisaFlag,'style="width:130px"')}
    <details><summary style="cursor:pointer;color:#ffd98a">Efeitos${t?' se acertar':''} (${(o.efeitos||[]).length})</summary>${edEfeitos(q+'.efeitos',o.efeitos)}</details>
    ${t?`<details><summary style="cursor:pointer;color:#ff9a8a">Efeitos se errar (${(o.efeitosFalha||[]).length})</summary>${edEfeitos(q+'.efeitosFalha',o.efeitosFalha)}</details>`:''}</div>`;}).join('')}
   <button type="button" class="b" data-add="${p}.nos.${k}.opcoes" data-modelo="opcao">+ escolha</button></div>`).join('')}
  <button type="button" class="b" data-add="${p}.nos" data-modelo="no">+ fala</button> <button type="button" class="b vm" data-rmitem="dialogos.${i}">🗑 Apagar o diálogo</button>
  ${(rascunho.automatica||rascunho.rodando)?'':'<div class="dica">Dica: para testar, ligue os gatilhos na aba 🤖 Mesa e clique no NPC com um personagem perto dele.</div>'}`;}
 function desenharEditor(tudo){
  try{botao();}catch(_){}
  let ed=el('rtEd');if(!editorAberto||!ehMestre()){if(ed)ed.hidden=true;return;}
  if(!rascunho)rascunho=clean(R);
  if(!ed){ed=root.createElement('section');ed.id='rtEd';ed.setAttribute('aria-label','Roteiros');root.body.append(ed);
   ed.addEventListener('pointerdown',e=>e.stopPropagation());ed.addEventListener('click',aoClicar);ed.addEventListener('input',aoMudar);ed.addEventListener('change',aoMudar);
   ed.addEventListener('keydown',e=>e.stopPropagation());}
  if(!tudo&&ed.contains(root.activeElement)&&/INPUT|TEXTAREA|SELECT/.test(root.activeElement.tagName))return; // escrevendo: não redesenha
  const abas=[['mesa','🤖 Mesa'],['missoes','🎯 Missões'],['dialogos','💬 Diálogos'],['gatilhos','⚡ Gatilhos']];
  const lista=aba==='mesa'?null:(rascunho[aba]||[]);
  const nomeItem=x=>aba==='gatilhos'?`${x.ativo===false?'⏸ ':E.feitos?.[x.id]&&x.uma!==false?'✔ ':'⚡ '}${x.nome}`:aba==='dialogos'?`${x.icone||'💬'} ${x.nome}`:`🎯 ${x.nome}`;
  const idx=lista?lista.findIndex(x=>x.id===sel):-1;
  const form=aba==='mesa'?formMesa():idx<0?'<div class="dica">Escolha à esquerda ou crie um novo.</div>':aba==='missoes'?formMissao(idx):aba==='gatilhos'?formGatilho(idx):formDialogo(idx);
  const scr=ed.querySelector('.ed-form')?.scrollTop||0;
  ed.innerHTML=`<div class="ed-top"><b>📜 Roteiros</b>${abas.map(([k,t])=>`<button type="button" class="ab" data-aba="${k}" aria-pressed="${aba===k}">${t}</button>`).join('')}<span class="st">${esc(status)}</span><button type="button" class="ab" data-fecharEd title="Fechar">✖</button></div>
   <div class="ed-corpo">${lista?`<div class="ed-lista">${lista.map(x=>`<button type="button" data-sel="${esc(x.id)}" aria-pressed="${x.id===sel}">${esc(nomeItem(x))}</button>`).join('')}<button type="button" class="novo" data-novo>+ ${aba==='missoes'?'missão':aba==='dialogos'?'diálogo':'gatilho'}</button></div>`:''}<div class="ed-form ${lista?'':'cheio'}">${form}</div></div>`;
  const f=ed.querySelector('.ed-form');if(f&&!tudo)f.scrollTop=scr;ed.hidden=false;
 }
 const MODELOS={etapa:()=>({id:novoId('e'),texto:''}),opcao:()=>({id:novoId('o'),texto:'',resposta:'',vai:'fim'}),no:()=>({id:novoId('n'),fala:'',opcoes:[{id:novoId('o'),texto:'Ir embora',vai:'fim'}]}),caminho:()=>({peso:1,efeitos:[]})};
 const NOVOS={missoes:()=>({id:novoId('m_'),nome:'Missão nova',descricao:'',etapas:[{id:novoId('e'),texto:''}]}),
  dialogos:()=>{const n=novoId('n');return {id:novoId('d_'),nome:'Diálogo novo',npc:'',icone:'💬',inicio:n,cond:[],nos:[{id:n,fala:'',opcoes:[{id:novoId('o'),texto:'Ir embora',vai:'fim'}]}]};},
  gatilhos:()=>({id:novoId('g_'),nome:'Gatilho novo',ativo:true,uma:true,cond:[],efeitos:[]})};
 async function aoClicar(e){
  const b=e.target.closest('button,a');if(!b)return;
  if(b.dataset.aba){aba=b.dataset.aba;sel='';return desenharEditor(true);}
  if(b.dataset.fechared!==undefined)return abrirEditor(false);
  if(b.dataset.sel){sel=b.dataset.sel;return desenharEditor(true);}
  if(b.dataset.novo!==undefined){const x=NOVOS[aba]();(rascunho[aba]=rascunho[aba]||[]).push(x);sel=x.id;guardar();return desenharEditor(true);}
  if(b.dataset.add){const arr=caminho(rascunho,b.dataset.add);const novo=MODELOS[b.dataset.modelo]();if(Array.isArray(arr))arr.push(novo);else por(rascunho,b.dataset.add,[novo]);guardar();return desenharEditor(false);}
  if(b.dataset.rm){const ks=b.dataset.rm.split('.'),i=+ks.pop(),arr=caminho(rascunho,ks.join('.'));if(Array.isArray(arr))arr.splice(i,1);guardar();return desenharEditor(false);}
  if(b.dataset.rmitem){if(!win.confirm('Apagar mesmo?'))return;const [k,i]=b.dataset.rmitem.split('.');rascunho[k].splice(+i,1);sel='';guardar();return desenharEditor(true);}
  if(b.dataset.sobe){const ks=b.dataset.sobe.split('.'),i=+ks.pop(),arr=caminho(rascunho,ks.join('.'));if(Array.isArray(arr)&&i>0){[arr[i-1],arr[i]]=[arr[i],arr[i-1]];guardar();desenharEditor(false);}return;}
  if(b.dataset.tirarflag){e.preventDefault();const f={...(E.flags||{})};delete f[b.dataset.tirarflag];E.flags=f;salvarE();return desenharEditor(false);}
  if(b.dataset.disparar!==undefined){const g=rascunho.gatilhos[+b.dataset.disparar];const m=mapaDoGrupo(pcs())||mapaAqui();if(g){E.feitos={...(E.feitos||{}),[g.id]:Date.now()};salvarE();void disparar(g,m);status=`▶ ${g.nome} em ${nomeMapa(m)}`;pintarStatus();}return;}
  if(b.dataset.rearmar!==undefined){const g=rascunho.gatilhos[+b.dataset.rearmar];if(g){const f={...(E.feitos||{})},o={...(E.ok||{})};delete f[g.id];delete o[g.id];E.feitos=f;E.ok=o;salvarE();desenharEditor(false);}return;}
  if(b.dataset.historia!==undefined)return instalarHistoria();
  if(b.dataset.zerar!==undefined){if(!win.confirm('Zerar o andamento? Marcas, missões, gatilhos disparados e escolhas "uma vez" voltam ao começo.'))return;E={flags:{},missoes:{},feitos:{},ok:{},feitas:{},log:[]};salvarE();await salvarPub({dialogos:{},narracoes:{}});await publicarResumo();log('↺ andamento zerado');return desenharEditor(true);}
 }
 function aoMudar(e){
  const t=e.target;
  if(t.dataset.addtipo&&e.type==='change'){const tipo=t.value;if(!tipo)return;const arr=caminho(rascunho,t.dataset.addtipo);const novo={tipo};if(tipo==='sortear')novo.opcoes=[{peso:1,efeitos:[]},{peso:1,efeitos:[]}];if(tipo==='mapa')novo.mapas=[];
   if(Array.isArray(arr))arr.push(novo);else por(rascunho,t.dataset.addtipo,[novo]);guardar();return desenharEditor(false);}
  const p=t.dataset.p;if(!p)return;
  if(t.dataset.chk!==undefined)por(rascunho,p,t.checked);
  else if(t.dataset.multi!==undefined)por(rascunho,p,[...t.selectedOptions].map(o=>o.value));
  else if(t.dataset.num!==undefined)por(rascunho,p,t.value===''?'':Number(t.value));
  else if(/\.valor$/.test(p)&&t.tagName==='SELECT')por(rascunho,p,t.value==='true');
  else por(rascunho,p,t.value);
  if(/\.teste\.pericia$/.test(p)&&!t.value){const base=p.replace(/\.teste\.pericia$/,'');por(rascunho,base+'.teste',null);}
  guardar();
  if(t.dataset.re!==undefined||(e.type==='change'&&t.tagName==='SELECT'&&/\.(tipo|acao|missao|modo)$|teste\.pericia$/.test(p)))desenharEditor(false);
  if(['rodando','automatica'].includes(p)){R={...R,[p]:t.checked};void publicarResumo();void ajustarAuto();try{botao();}catch(_){}}
 }
 // ---- 📦 instalar a história pronta
 async function instalarHistoria(){
  try{status='📦 instalando…';pintarStatus();
   // criatura da noite: a do banco que mora em ruínas/deserto
   const cs=criaturas(),cri=cs.find(c=>c.id==='rastejante_de_cinzas')||cs.find(c=>/ruin|desert/i.test(sem(String(c.ambiente||c.habitat||'')+' '+c.descricao)))||cs[0];
   const h=historiaPronta({criatura:cri?.id||'rastejante_de_cinzas'});
   // NPCs da história: usa os que já existem com o mesmo nome; senão cria no banco
   const trocar=new Map();
   for(const n of NPCS_HISTORIA){
    const ja=npcs().find(x=>String(x.id)===n.id)||npcs().find(x=>sem(x.nome)===sem(n.nome));
    if(ja){trocar.set(n.id,String(ja.id));continue;}
    const g=gerarNpc({especie:n.especie,papel:n.papel}),{especie,papel,...dados}=n;
    let modelo={...g,...dados,id:n.id,roteiroV181:true};
    try{modelo=dep.normalizar?{...dep.normalizar('npcs',modelo),id:n.id,roteiroV181:true}:modelo;}catch(_){}
    try{const sp=specDeNpc(modelo),svg=renderizarMiniatura(sp);if(dep.uploadBytes&&dep.storage){const snap=await dep.uploadBytes(dep.ref(dep.storage,`personagens/${uid()}/miniaturas/npcs-${n.id}.svg`),new Blob([svg],{type:'image/svg+xml'}),{contentType:'image/svg+xml',cacheControl:'public,max-age=31536000'});modelo.miniatura={url:(await dep.getDownloadURL(snap.ref))+MARCA_MINI,spec:sp,tipo:'montada',atualizadoEm:new Date().toISOString()};}}catch(e){console.warn('[Roteiros] miniatura',e);}
    await dep.setDoc(D('npcs/'+n.id),clean(modelo));try{dep.npcs?.()?.push?.(modelo);}catch(_){}
   }
   const troca=v=>JSON.parse(JSON.stringify(v),(k,x)=>k==='modelo'&&trocar.has(x)?trocar.get(x):x);
   const r=clean(rascunho||R);for(const k of ['missoes','dialogos','gatilhos']){const novos=troca(h[k]).filter(x=>!(r[k]||[]).some(y=>y.id===x.id));r[k]=[...(r[k]||[]),...novos];}
   r.rodando=true;rascunho=r;await dep.setDoc(D(DOC),clean({...r,atualizadoEm:Date.now()}));R=r;
   status='✔ história instalada';log('📦 história pronta instalada (cidade sem nome → Therion)');await publicarResumo();aba='gatilhos';sel='';desenharEditor(true);
  }catch(e){status='⚠️ '+(e?.message||e);pintarStatus();}
 }

 // ---------------------------------------------------------------- liga
 const vigia=setInterval(()=>{if(ehMestre()){iniciarMestre();try{botao();}catch(_){}}else el('rtBotao')?.remove();},1500);
 const api={estado:()=>({pub,R,E}),abrirEditor,disparar:(id,m)=>{const g=(R.gatilhos||[]).find(x=>x.id===id);return g?disparar(g,m||mapaDoGrupo(pcs())):null;},executar:(l,m)=>executar(l,{mapa:m}),instalarHistoria,processar,tick,
  parar(){clearInterval(vigia);[...parar,...pararM].forEach(f=>{try{f();}catch(_){}});}};
 win.mesaRoteirosV181=api;return api;
}
