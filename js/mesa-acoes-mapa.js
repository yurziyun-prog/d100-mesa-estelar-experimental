import {hostisEntre} from './mesa-tempo-real-ia.js';
import {ataquesPorArma} from './mesa-ataques-por-arma.js';
import {acomodarPainelMapa} from './mesa-paineis-layout.js';
// Mesa Estelar v122 — Ações por dentro do mapa: balão flutuante sobre a miniatura.
//
// Clique numa miniatura (ou botão direito no mapa) → um balão com:
//   ⚔️ Atacar (perícia de ataque + arma; mostra dano, munição e se é em área)
//   🎲 Perícia (qualquer perícia da ficha, com busca)
//   🔮 Psi (poderes da ficha, gasto de PP, alvo já preenchido)
//   🩹 Curar (Primeiros Socorros na parte ferida; Cura psíquica, se tiver)
//   🫀 Corpo (PV e PA de cada parte do corpo)
// Atalhos (com o mouse sobre o mapa ou o balão aberto): A, T, P, C, F, Esc fecha, ? legenda.
// Disparo rápido (combate dinâmico): barra no canto do mapa; 1–9 escolhe o ataque, Espaço (ou X) dispara
// no alvo marcado, Shift+clique numa miniatura ataca direto. Respeita a recarga do tempo real.
// Tudo passa pelo mesmo caminho do painel "Ficha rápida" (mesmas regras, turnos, munição e Sorte).
// Módulo à parte: se falhar, o painel de baixo continua funcionando como antes.

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const semPrefixo=s=>String(s||'').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
export const ehArea=w=>!!(w&&(w.area||w.areaM||w.cone||/\b(cone|área|area|raio|explos|rajada|leque)/i.test(String(w.descricao||'')+' '+String(w.nome||''))));
export const ORDEM_PARTES=['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda'];

// Separa as perícias da ficha em ataques (com armas) e testes comuns.
export function separarPericias(sheet){
 const skills=Array.isArray(sheet?.skills)?sheet.skills:[];
 const ataques=skills.filter(s=>s.attack||(s.weapons||[]).length);
 const testes=skills.filter(s=>!ataques.includes(s));
 return {ataques,testes};
}
// Partes do corpo ordenadas, com estado (ok/ferida/zerada).
export function partesDoCorpo(h){
 if(!h?.hitMax)return [];
 return Object.keys(h.hitMax).sort((a,b)=>(ORDEM_PARTES.includes(a)?ORDEM_PARTES.indexOf(a):99)-(ORDEM_PARTES.includes(b)?ORDEM_PARTES.indexOf(b):99))
  .map(p=>{const pv=Number(h.hit?.[p]??h.hitMax[p]),max=Number(h.hitMax[p])||0;return {parte:p,pv,max,pa:Number(h.armor?.[p]||0),estado:pv<=0?'zerada':pv<max?'ferida':'ok'};});
}
// Lista numerada de ataques (perícia + arma) para o disparo rápido: teclas 1 a 9.
export function ataquesRapidos(sheet){return ataquesPorArma(sheet).slice(0,9).map(a=>({...a,nome:a.arma.nome,area:ehArea(a.arma),dano:a.arma.dano||'',ammunition:a.arma.ammunition||null}));}
export const ATALHOS={a:'atacar',t:'pericia',p:'psi',c:'curar',f:'corpo'};

const ESTILO_MA=`
#maBalao{position:absolute;z-index:9000;width:min(360px,calc(100vw - 24px));max-height:min(460px,70vh);display:flex;flex-direction:column;border-radius:14px;border:1px solid #4d79a6;background:rgba(9,15,29,.97);box-shadow:0 12px 34px rgba(0,0,0,.55);color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif}
#maBalao[hidden]{display:none}
#maBalao.ma-recolhido nav,#maBalao.ma-recolhido .ma-corpo,#maBalao.ma-recolhido footer{display:none}#maBalao.ma-recolhido{width:min(260px,calc(100vw - 24px))}
#maBalao .ma-rec{width:26px;height:26px;border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;padding:0}
#maBalao header{display:flex;gap:8px;align-items:center;padding:8px 10px 6px;border-bottom:1px solid #22385a}
#maBalao header b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ffd447}
#maBalao header small{color:#9fb3cc}
#maBalao .ma-x{width:26px;height:26px;border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;padding:0}
#maBalao nav{display:flex;gap:4px;padding:6px 8px}
#maBalao nav button{flex:1;height:34px;border-radius:9px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;font-size:16px;padding:0;position:relative}
#maBalao nav button kbd{position:absolute;right:3px;bottom:1px;font:9px monospace;color:#8ee7ff}
#maBalao nav button[aria-pressed="true"]{background:#1f3f62;border-color:#8ee7ff}
#maBalao nav button:disabled{opacity:.35;cursor:not-allowed}
#maBalao .ma-corpo{overflow:auto;padding:4px 10px 8px;flex:1;min-height:60px}
#maBalao .ma-lista{display:grid;gap:5px}
#maBalao .ma-op{display:flex;gap:8px;align-items:center;width:100%;min-height:34px;padding:5px 8px;border-radius:9px;border:1px solid #2f4664;background:rgba(255,255,255,.04);color:#e8eefc;text-align:left;cursor:pointer;font:inherit}
#maBalao .ma-op:hover:not(:disabled){border-color:#8ee7ff}
#maBalao .ma-op:disabled{opacity:.45;cursor:not-allowed}
#maBalao .ma-op span{flex:1;min-width:0}
#maBalao .ma-op small{color:#9fb3cc}
#maBalao .ma-op em{font-style:normal;color:#ffd447;font-weight:700}
#maBalao .ma-grupo{margin:6px 0 3px;color:#8ee7ff;font-weight:700;font-size:12px}
#maBalao .ma-tag{display:inline-block;margin-left:4px;padding:0 5px;border-radius:6px;background:#3d2a12;color:#ffcf8a;font-size:10px}
#maBalao input,#maBalao select{height:30px!important;padding:0 8px!important;font-size:13px!important;margin:0!important;border-radius:8px;border:1px solid #3b5878;background:#0b1322;color:#e8eefc;padding:0 8px;font:inherit;box-sizing:border-box}
#maBalao .ma-linha{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0}
#maBalao .ma-acao{height:32px;padding:0 12px;border-radius:9px;border:1px solid #3fae6a;background:#1d6b3e;color:#fff;cursor:pointer;font:600 13px 'Segoe UI',Arial,sans-serif}
#maBalao .ma-acao:disabled{opacity:.45;cursor:not-allowed}
#maBalao .ma-partes{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:5px}
#maBalao .ma-parte{padding:5px;border-radius:8px;border:1px solid #2f4664;text-align:center;font-size:11px}
#maBalao .ma-parte b{display:block;font-size:13px}
#maBalao .ma-parte.ferida{border-color:#e0a23a;background:rgba(224,162,58,.12)}
#maBalao .ma-parte.zerada{border-color:#ff6b6b;background:rgba(255,107,107,.16)}
#maBalao .ma-aviso{color:#ffcf8a;font-size:12px;margin:4px 0}
#maBalao .ma-res{margin-top:6px;padding:6px 8px;border-radius:8px;background:rgba(142,231,255,.08);color:#d9f6ff;font-size:12px;white-space:pre-wrap}
#maBalao .ma-res:empty{display:none}
#maBalao footer{padding:5px 10px 7px;border-top:1px solid #22385a;color:#8ea3bf;font-size:11px;line-height:1.35}
#maBalao footer kbd,#maLegenda kbd{font:10px monospace;padding:0 3px;border-radius:4px;border:1px solid #3b5878;color:#8ee7ff}
#maLegenda{position:absolute;left:50%;transform:translateX(-50%);bottom:8px;z-index:30;display:flex;flex-wrap:wrap;justify-content:center;gap:4px 8px;align-items:center;max-width:calc(100% - 16px);padding:4px 12px;border-radius:12px;background:rgba(9,15,29,.82);border:1px solid #2f4664;color:#c6d3e6;font:11px 'Segoe UI',Arial,sans-serif;pointer-events:none}
#maLegenda.ma-off{display:none}
#maRapido{display:none!important}/* v205: o disparo é por TECLADO (␣) e CONTROLE (A/RT), não por botão na tela; as teclas ficam na legenda do mapa */
#maRapido{position:absolute;right:8px;top:8px;z-index:31;display:flex;gap:4px;align-items:center;flex-wrap:wrap;max-width:calc(100% - 16px);padding:4px;border-radius:12px;background:rgba(9,15,29,.88);border:1px solid #2f4664;font:12px 'Segoe UI',Arial,sans-serif;color:#e8eefc}
#maRapido.ma-off{display:none}
#maRapido .ma-r{height:30px;padding:0 8px;border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#e8eefc;cursor:pointer;font:inherit;white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis}
#maRapido .ma-r kbd{font:10px monospace;color:#8ee7ff;margin-right:3px}
#maRapido .ma-r[aria-pressed="true"]{background:#5a3b10;border-color:#ffd447;color:#fff}
#maRapido .ma-fogo{height:34px;padding:0 14px;border-radius:9px;border:1px solid #ff8a5c;background:#a8361b;color:#fff;font:700 13px 'Segoe UI',Arial,sans-serif;cursor:pointer;white-space:nowrap}
#maRapido .ma-fogo:disabled{opacity:.5;cursor:not-allowed}
#maRapido .ma-info{color:#9fb3cc;font-size:11px;padding:0 4px;white-space:nowrap}
#maRapido{max-width:calc(100% - 250px);justify-content:flex-end}
#maRapido .ma-sel{background:#5a3b10;border-color:#ffd447;color:#fff}
`;

export function instalarAcoesMapa(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const el=id=>root.getElementById(id);
 if(!el('maCssV122')){const st=root.createElement('style');st.id='maCssV122';st.textContent=ESTILO_MA;root.head.append(st);}
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const acoes=()=>{try{return ctl()?.acoes?.()||null;}catch(_){return null;}};
 const estado=()=>{try{return acoes()?.estado?.()||null;}catch(_){return null;}};
 const board=()=>el('novaSyncBoard');
 let balao=null,alvoId='',aba='atacar',sobreMapa=false,ultima=null,inicio=null,legendaOn=true;
 try{legendaOn=win.localStorage.getItem('mesa:legendaAcoes')!=='0';}catch(_){}

 // ------------------------------------------------------------ dados
 function nomeDe(id){const t=ctl()?.token?.(id);if(t)return semPrefixo(t.nome);const o=(estado()?.view?.objects||[]).find(o=>o.id===id);return o?o.nome:'';}
 function pronto(){const st=estado();return !!(st&&st.current&&st.sheet);}
 function alvoEfetivo(){const st=estado();return alvoId&&alvoId!==st?.current?.id?alvoId:'';}

 // ------------------------------------------------------------ balão
 function criar(){
  balao=root.createElement('div');balao.id='maBalao';balao.hidden=true;balao.setAttribute('role','dialog');balao.setAttribute('aria-label','Ações no mapa');
  balao.innerHTML=`<header><b data-titulo></b><small data-ator></small><button type="button" class="ma-rec" data-recolher title="Recolher / abrir (fica só a barra)">▾</button><button type="button" class="ma-x" data-fechar title="Fechar (Esc)">✕</button></header>
  <nav>${[['atacar','⚔️','Atacar','A'],['defender','🛡️','Defender',''],['psi','🔮','Poder psíquico','P']].map(([k,i,t,a])=>`<button type="button" data-aba="${k}" title="${t} (${a})" aria-label="${t}">${i} ${k==='psi'?'Psi':t}${a?'<kbd>'+a+'</kbd>':''}</button>`).join('')}</nav>
  <div class="ma-corpo" data-corpo></div>
  <footer><kbd>A</kbd> atacar · <kbd>T</kbd> perícia · <kbd>P</kbd> psi · <kbd>C</kbd> curar · <kbd>F</kbd> corpo · <kbd>1</kbd>–<kbd>9</kbd> escolhe ataque · <kbd>J</kbd> ataca · <kbd>Espaço</kbd> pula · <kbd>Shift</kbd>+clique ataca · <kbd>Esc</kbd> fecha · botão direito abre aqui</footer>`;
  root.body.append(balao);
  balao.addEventListener('pointerdown',e=>e.stopPropagation());
  balao.addEventListener('click',e=>{
   if(e.target.closest('[data-fechar]')){fechar();return;}
   if(e.target.closest('[data-recolher]')){recolher(!balao.classList.contains('ma-recolhido'));return;}
   const b=e.target.closest('[data-aba]');if(b&&!b.disabled){aba=b.dataset.aba;desenhar();}
  });
 }
 function recolher(v){if(!balao)return;balao.classList.toggle('ma-recolhido',!!v);const b=balao.querySelector('[data-recolher]');if(b){b.textContent=v?'▸':'▾';}try{win.localStorage?.setItem('mesa:acoesRecolhido',v?'1':'0');}catch(_){}posicionar(alvoId);}
 // v149: o balão fica FORA do mapa quando há espaço (à direita ou à esquerda); sem espaço, encosta na borda da tela
 function posicionar(id){
  const b=board();if(!b||!balao)return;
  const rb=b.getBoundingClientRect(),w=balao.offsetWidth||360,h=balao.offsetHeight||300,vw=win.innerWidth,vh=win.innerHeight;
  let x,y=Math.max(8,Math.min(vh-h-8,Math.max(rb.top,8)));
  if(rb.right+10+w<=vw-8)x=rb.right+10;else if(rb.left-10-w>=8)x=rb.left-10-w;else x=vw-w-8;
  balao.style.left=Math.round(x+win.scrollX)+'px';balao.style.top=Math.round(y+win.scrollY)+'px';
 }
 function abrir(id,novaAba){
  if(!pronto())return false;
  if(!balao)criar();
  const st=estado();alvoId=id&&id!==st.current.id?id:'';
  if(alvoId)try{ctl()?.marcarAlvo?.(alvoId);}catch(_){}
  if(novaAba)aba=novaAba;else if(!novaAba)aba='atacar';
  balao.hidden=false;desenhar();let rec=false;try{rec=win.localStorage?.getItem('mesa:acoesRecolhido')==='1';}catch(_){}if(alvoId)rec=false;balao.classList.toggle('ma-recolhido',rec);const rb=balao.querySelector('[data-recolher]');if(rb)rb.textContent=rec?'▸':'▾';posicionar(alvoId);return true;
 }
 function fechar(){if(balao)balao.hidden=true;}
 const aberto=()=>!!balao&&!balao.hidden;

 function desenhar(){
  if(!balao)return;const st=estado();if(!st?.sheet||!st.current){fechar();return;}
  const alvo=alvoEfetivo(),{ataques}=separarPericias(st.sheet),psi=st.sheet.support?.powers||[];
  balao.querySelector('[data-titulo]').textContent=alvo?'🎯 '+(nomeDe(alvo)||'Alvo'):'🧍 '+semPrefixo(st.current.nome)+' (sem alvo)';
  balao.querySelector('[data-ator]').textContent=alvo?'por '+semPrefixo(st.current.nome):'';
  const dis={atacar:!ataques.length,defender:false,psi:!psi.length,pericia:false,curar:false,corpo:false};
  if(dis[aba])aba='pericia';
  balao.querySelectorAll('[data-aba]').forEach(b=>{b.hidden=b.dataset.aba==='psi'&&!psi.length;b.disabled=!!dis[b.dataset.aba];b.setAttribute('aria-pressed',b.dataset.aba===aba?'true':'false');});
  const corpo=balao.querySelector('[data-corpo]');corpo.replaceChildren();
  const aviso=!st.allowed&&!st.busy?`<div class="ma-aviso">${win.mesaJogoPausadoV214?.()?'Jogo pausado pelo mestre.':'Ação indisponível agora.'}</div>`:'';
  ({atacar:abaAtacar,defender:abaDefender,pericia:abaPericia,psi:abaPsi,curar:abaCurar,corpo:abaCorpo}[aba]||abaPericia)(corpo,st,alvo,aviso);
  const res=root.createElement('div');res.className='ma-res';res.dataset.res='';corpo.append(res);
 }
 function resultado(texto){const r=balao?.querySelector('[data-res]');if(r)r.textContent=texto||'';}
 function acompanhar(){ // mostra no balão o resultado que o painel da ficha recebe
  let n=0;const t=setInterval(()=>{n++;const txt=el('novaSyncActionPanel')?.querySelector('.nova-result')?.textContent||'';if(txt)resultado(txt);if(n>16||!aberto())clearInterval(t);},400);
 }

 function executar(skillId,weaponId){
  const a=acoes(),st=estado();if(!a||!st?.allowed)return;
  if(!a.escolher?.(skillId,weaponId))return;
  const alvo=alvoEfetivo();ultima={tipo:'pericia',skillId,weaponId,alvo};
  try{if(ataquesRapidos(st.sheet).some(a=>a.skillId===skillId&&a.weaponId===(weaponId||'')))win.localStorage.setItem(chaveRapido(st.current.id),skillId+'|'+(weaponId||''));}catch(_){} // o ataque do balão vira o ataque rápido
  resultado('⚔️ Atacando…');Promise.resolve(a.executar?.(alvo)).catch(e=>resultado(e.message)).finally(acompanhar);
 }

 function abaAtacar(corpo,st,alvo,aviso){
  const todas=ataquesPorArma(st.sheet),sel=root.createElement('select');sel.setAttribute('aria-label','Arma ativa');sel.style.width='100%';
  for(const a of todas){const option=root.createElement('option');option.value=a.weaponId;option.textContent=a.arma.nome.replace(/ ⚠.*$/,'');sel.append(option);}
  const atual=el('novaSyncWeapon')?.value||st.current.activeWeaponId;if(todas.some(a=>a.weaponId===atual))sel.value=atual;
  corpo.insertAdjacentHTML('beforeend',aviso);const label=root.createElement('label');label.textContent='Arma ativa';label.append(sel);corpo.append(label);
  const caixa=root.createElement('div');corpo.append(caixa);
  const pintar=()=>{caixa.replaceChildren();const a=todas.find(a=>a.weaponId===sel.value);if(!a)return;const w=a.arma;let skillId=a.skillId;
   if(a.improvisado){const alt=root.createElement('select');alt.setAttribute('aria-label','Perícia alternativa');for(const o of a.alternativas){const option=root.createElement('option');option.value=o.skillId;option.textContent=o.pericia+' · '+o.valor+'%';alt.append(option);}alt.value=skillId;alt.onchange=()=>{skillId=alt.value;acoes()?.escolher(skillId,w.id);};caixa.insertAdjacentHTML('beforeend','<div class="ma-aviso">Sem a perícia própria desta arma. Escolha uma alternativa para improvisar.</div>');caixa.append(alt);}
   const info=root.createElement('div');info.className='ma-grupo';info.textContent=a.pericia+' · '+a.valor+'%'+(w.dano?' · Dano '+w.dano:'');caixa.append(info);
   const detalhe=root.createElement('details'),summary=root.createElement('summary');summary.textContent='Chance e ajustes';detalhe.append(summary);const txt=root.createElement('small');txt.textContent=w.calculo||'';detalhe.append(txt);caixa.append(detalhe);
   const am=w.ammunition,carga=am?Number(st.view?.health?.municaoLab?.[am.key]??am.capacity):null;
   if(am){const mun=root.createElement('small');mun.textContent='Munição '+carga+'/'+am.capacity;caixa.append(mun);}
   const button=root.createElement('button');button.type='button';button.className='ma-op';button.textContent='⚔️ Atacar'+(alvo?' '+nomeDe(alvo):' — selecione um alvo');button.disabled=!alvo||!st.allowed||st.busy||!!(am&&carga<=0);button.onclick=()=>executar(skillId,w.id);caixa.append(button);
  };
  sel.onchange=()=>{const a=todas.find(a=>a.weaponId===sel.value);if(a)acoes()?.escolher(a.skillId,a.weaponId);pintar();};pintar();
 }
 function abaDefender(corpo,st,alvo,aviso){
  corpo.insertAdjacentHTML('beforeend',aviso);const select=root.createElement('select');select.setAttribute('aria-label','Defesa preferida');select.style.width='100%';
  for(const [id,nome] of [['auto','Automática — melhor defesa disponível'],['esquiva','Priorizar esquiva'],['aparar','Priorizar aparar com a arma ativa']]){const option=root.createElement('option');option.value=id;option.textContent=nome;select.append(option);}
  select.value=st.current.activeDefenseId||'auto';select.onchange=()=>Promise.resolve(ctl()?.escolherDefesa(select.value)).catch(e=>resultado(e.message));corpo.append(select);
  corpo.insertAdjacentHTML('beforeend','<div class="ma-aviso">A preferência é usada ao receber ataques. Se ela não estiver disponível, usa a melhor defesa possível. Defesa total impede ataques até voltar ao normal.</div>');
  for(const [id,label] of [['normal','⚖️ Normal'],['defesa','🛡️ Defesa total']]){const button=root.createElement('button');button.type='button';button.className='ma-op';button.textContent=label;button.disabled=st.busy||!!win.mesaJogoPausadoV214?.();button.onclick=()=>Promise.resolve(win.mesaAtitudesRT?.pedir(id)).catch(e=>resultado(e.message));corpo.append(button);}
 }
 function abaPericia(corpo,st,alvo,aviso){
  const {testes,ataques}=separarPericias(st.sheet);
  corpo.insertAdjacentHTML('beforeend',aviso);
  const busca=root.createElement('input');busca.type='search';busca.placeholder='Buscar perícia…';busca.style.width='100%';busca.setAttribute('aria-label','Buscar perícia');corpo.append(busca);
  const lista=root.createElement('div');lista.className='ma-lista';lista.style.marginTop='6px';corpo.append(lista);
  const todas=[...testes,...ataques];
  const pintar=()=>{const q=busca.value.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();lista.replaceChildren();
   for(const s of todas.filter(s=>!q||String(s.nome).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().includes(q))){
    const b=root.createElement('button');b.type='button';b.className='ma-op';b.disabled=!st.allowed||st.busy;
    b.innerHTML=`<span>🎲 ${esc(s.nome)}</span><em>${esc(s.valor)}%</em>`;b.title='Testar '+s.nome;b.onclick=()=>executar(s.id,'');lista.append(b);
   }};
  busca.addEventListener('input',pintar);busca.addEventListener('keydown',e=>e.stopPropagation());pintar();
 }
 function abaPsi(corpo,st,alvo,aviso){
  const sup=st.sheet.support||{},powers=sup.powers||[];
  const pp=Math.max(0,(sup.psiMax||0)-(st.view?.health?.psiSpent??sup.psiSpent??0));
  corpo.insertAdjacentHTML('beforeend',aviso+`<div class="ma-grupo">🔮 PP ${pp}/${sup.psiMax||0}</div>`);
  const linha=root.createElement('div');linha.className='ma-linha';
  const sel=root.createElement('select');sel.setAttribute('aria-label','Poder');sel.style.flex='1';
  for(const p of powers){const o=root.createElement('option');o.value=p.id;o.textContent=(p.name||p.nome||p.id)+(p.cost?' · '+p.cost+' PP':'');sel.append(o);}
  const custo=root.createElement('input');custo.type='number';custo.min='0';custo.max='99';custo.style.width='64px';custo.title='Gasto de PP';custo.setAttribute('aria-label','Gasto de PP');
  const usar=root.createElement('button');usar.type='button';usar.className='ma-acao';usar.textContent='🔮 Usar';usar.disabled=!st.allowed||st.busy;
  linha.append(sel,custo,usar);corpo.append(linha);
  const desc=root.createElement('div');desc.style.cssText='color:#9fb3cc;font-size:12px';corpo.append(desc);
  const painelSel=()=>el('novaPsiPower');
  try{const v=painelSel()?.value;if(v&&powers.some(p=>p.id===v))sel.value=v;if(ultima?.tipo==='psi'&&powers.some(p=>p.id===ultima.power))sel.value=ultima.power;}catch(_){}
  const sincronizar=()=>{ // escolhe o poder e o alvo no painel da ficha (mesmas regras)
   const ps=painelSel();if(!ps){desc.textContent='Abra a 🧾 Ficha rápida embaixo do mapa para carregar os poderes.';usar.disabled=true;return;}
   ps.value=sel.value;ps.dispatchEvent(new Event('change',{bubbles:true}));
   const tg=el('novaPsiTarget');const quem=alvoEfetivo()||st.current.id;
   if(tg&&[...tg.options].some(o=>o.value===quem)&&!tg.disabled){tg.value=quem;tg.dispatchEvent(new Event('change',{bubbles:true}));}
   const c=el('novaPsiCost');if(c&&!custo.matches(':focus'))custo.value=c.value;
   const precisaDestino=!el('novaPsiDestination')?.closest('label')?.hidden,precisaObjeto=!el('novaPsiObject')?.closest('label')?.hidden;
   const precisaParte=!el('novaPsiLocation')?.closest('label')?.hidden;
   const d=ps.closest('.nova-psi-row')?.querySelector('p,div:last-child');
   desc.textContent=(precisaDestino||precisaObjeto?'📍 Este poder precisa de destino/objeto: complete em 🔮 na Ficha rápida. ':'')+(precisaParte?'🩹 Escolha a parte na Ficha rápida se houver mais de uma ferida. ':'')+String(d?.textContent||'').slice(0,160);
  };
  sel.onchange=sincronizar;sincronizar();
  usar.onclick=async()=>{
   sincronizar();const c=el('novaPsiCost');if(c){c.value=custo.value;c.dispatchEvent(new Event('input',{bubbles:true}));}
   // v140: no combate em tempo real o poder vai direto (recarga do tempo real), sem depender do turno da ficha rápida
   if(rt()?.ativo?.()&&!ctl()?.emCombate?.()){
    const falta=recarga(st);if(falta>0){resultado('⏳ Recarregando: '+(falta/1000).toFixed(1).replace('.',',')+' s.');return;}
    const pw=powers.find(p=>p.id===sel.value),val=id=>{const e=el(id);return e&&!e.closest('label')?.hidden?e.value:undefined;};
    const alvoPsi=val('novaPsiTarget')||alvoEfetivo()||st.current.id;
    const cmd={kind:'direct-psi',actorId:st.current.id,powerId:sel.value,cost:Number(custo.value)||Number(pw?.cost)||0,targetId:alvoPsi};
    for(const [k,id] of [['destination','novaPsiDestination'],['objectId','novaPsiObject'],['location','novaPsiLocation']]){const v=val(id);if(v!==undefined&&v!=='')cmd[k]=v;}
    ultima={tipo:'psi',power:sel.value,alvo:alvoEfetivo()};usar.disabled=true;resultado('⏳ Enviando poder…');
    try{await ctl()?.suporte?.(cmd);resultado('🔮 '+(pw?.name||pw?.nome||'Poder')+' enviado · veja o histórico.');}catch(e){resultado('⚠️ '+(e?.message||e));}
    finally{setTimeout(()=>{usar.disabled=false;},600);}
    return;
   }
   const bt=[...(el('novaPsiPower')?.closest('.nova-psi-row')?.querySelectorAll('button')||[])].find(b=>/Usar poder/.test(b.textContent));
   if(!bt||bt.disabled){resultado('Poder indisponível agora.');return;}
   ultima={tipo:'psi',power:sel.value,alvo:alvoEfetivo()};bt.click();resultado('⏳ Enviando poder…');
   let n=0;const t=setInterval(()=>{n++;const fb=bt.parentElement?.parentElement?.querySelector(':scope > div:last-child')?.textContent||'';const r=el('novaSyncActionPanel')?.querySelector('.nova-result')?.textContent;resultado(r||fb||'Enviado · veja o histórico.');if(n>10||!aberto())clearInterval(t);},450);
  };
 }
 function secaoSocorros(){return [...(el('novaSyncActionPanel')?.querySelectorAll('details.nova-support-panel')||[])].find(d=>/Primeiros Socorros/.test(d.querySelector('summary')?.textContent||''));}
 function abaCurar(corpo,st,alvo,aviso){
  corpo.insertAdjacentHTML('beforeend',aviso);
  const quem=alvo||st.current.id,tg=el('novaSupportTarget');
  if(!tg){corpo.insertAdjacentHTML('beforeend','<div class="ma-aviso">A ficha não tem atendimento disponível.</div>');return;}
  if(!tg.disabled&&[...tg.options].some(o=>o.value===quem)&&tg.value!==quem){tg.value=quem;tg.dispatchEvent(new Event('change',{bubbles:true}));}
  corpo.insertAdjacentHTML('beforeend',`<div class="ma-grupo">🩹 Primeiros Socorros em ${esc(nomeDe(tg.value)||'você')}</div>`);
  const linha=root.createElement('div');linha.className='ma-linha';corpo.append(linha);
  const partes=root.createElement('select');partes.setAttribute('aria-label','Parte ferida');partes.style.flex='1';linha.append(partes);
  const botoes=root.createElement('div');botoes.className='ma-linha';corpo.append(botoes);
  const copiar=()=>{ // espelha as opções e botões do painel (mesmas regras de alcance, kit e turnos)
   const loc=el('novaSupportLocation');partes.replaceChildren();
   for(const o of loc?.options||[]){const n=root.createElement('option');n.value=o.value;n.textContent=o.textContent;partes.append(n);}
   if(loc){partes.value=loc.value;partes.disabled=loc.disabled;}
   botoes.replaceChildren();
   for(const b of secaoSocorros()?.querySelectorAll('button')||[]){
    const c=root.createElement('button');c.type='button';c.className='ma-acao';c.textContent=b.textContent;c.disabled=b.disabled;
    c.onclick=()=>{const l=el('novaSupportLocation');if(l&&!l.disabled&&partes.value){l.value=partes.value;l.dispatchEvent(new Event('change',{bubbles:true}));}if(!b.isConnected){resultado('Atualizando… tente de novo.');return;}b.click();resultado('⏳ Enviando atendimento…');setTimeout(()=>{const fb=secaoSocorros()?.parentElement?.querySelector('.nova-result')?.textContent;resultado(fb||'Enviado · veja o histórico.');},1400);};
    botoes.append(c);
   }
   if(!botoes.children.length)botoes.insertAdjacentHTML('beforeend','<div class="ma-aviso">A ficha não possui Primeiros Socorros.</div>');
  };
  copiar();setTimeout(()=>{if(aberto()&&aba==='curar')copiar();},500);
  if((st.sheet.support?.powers||[]).some(p=>p.id==='cura_psi')){
   const b=root.createElement('button');b.type='button';b.className='ma-op';b.style.marginTop='6px';b.innerHTML='<span>🔮 Cura psíquica</span><small>gasta PP</small>';
   b.onclick=()=>{const ps=el('novaPsiPower');if(ps){ps.value='cura_psi';ps.dispatchEvent(new Event('change',{bubbles:true}));}aba='psi';desenhar();};corpo.append(b);
  }
 }
 function abaCorpo(corpo,st,alvo){
  const quem=alvo||st.current.id,c=ctl(),tok=c?.token?.(quem);
  const pode=quem===st.current.id||c?.mestre?.()||(tok&&c?.controla?.(tok));
  const h=quem===st.current.id?(st.view?.health?.combateLab||st.sheet.health||c?.saude?.(quem)):c?.saude?.(quem);
  corpo.insertAdjacentHTML('beforeend',`<div class="ma-grupo">🫀 ${esc(nomeDe(quem)||'Você')}</div>`);
  if(!pode){corpo.insertAdjacentHTML('beforeend','<div class="ma-aviso">Os ferimentos deste alvo aparecem no histórico de combate.</div>');return;}
  const ps=partesDoCorpo(h);
  if(!ps.length){corpo.insertAdjacentHTML('beforeend','<div class="ma-aviso">Sem dados de ferimentos ainda.</div>');return;}
  const est=h.morto?'💀 Morto':(h.inconsciente&&(h.coma===true||(h.coma!==false&&Object.keys(h.hitMax||{}).some(k=>/^(cabe|peito|abd)/i.test(k.normalize('NFD').replace(/[\u0300-\u036f]/g,''))&&!(h.estabilizados||{})[k]&&(Number((h.hit||{})[k]??h.hitMax[k])<=0||(h.ferimentos||{})[k]==='Grave')))))?'🛌 Em coma (precisa de socorro)':h.inconsciente?'💤 Desmaiado':h.incapacitado?'🤕 Incapacitado':'';
  if(est)corpo.insertAdjacentHTML('beforeend',`<div class="ma-aviso">${est}</div>`);
  corpo.insertAdjacentHTML('beforeend','<div class="ma-partes">'+ps.map(p=>`<div class="ma-parte ${p.estado}"><small>${esc(p.parte)}</small><b>${p.pv}/${p.max}</b><small>PA ${p.pa}</small></div>`).join('')+'</div>');
 }

 // ------------------------------------------------------------ mouse
 root.addEventListener('pointerdown',e=>{
  const b=board();if(!b||!b.contains(e.target)||e.button!==0){inicio=null;return;}
  const id=e.target.closest('[data-token]')?.dataset.token||'';inicio={x:e.clientX,y:e.clientY,id,t:Date.now()};
 },true);
 root.addEventListener('pointerup',e=>{
  const i=inicio;inicio=null;if(!i||!i.id)return;
  if(Math.hypot(e.clientX-i.x,e.clientY-i.y)>6||Date.now()-i.t>600)return; // foi arrasto
  if(e.target.closest?.('[data-map-action],[data-facing-handle]'))return;
  setTimeout(()=>{try{const st=estado();if(!st?.current)return;if(i.id===st.current.id&&!aberto())return;
   // v146: NPC com conversa (Denzel, guardas do portão…): fora de combate o clique abre o diálogo dele; botão direito abre as ações
   if(!st.combat?.active&&typeof win.mesaDialogoNPC_==='function'&&win.mesaDialogoNPC_(i.id,st.current.id)){fechar();return;}
   const t=ctl()?.token?.(i.id);if(t&&hostisEntre(st.current,t,rt()?.estado?.()?.faccoes||{})){ctl()?.marcarAlvo?.(i.id);disparar(i.id);}else abrir(i.id);}catch(err){console.warn('[Ações no mapa]',err);}},60);
 },true);
 win.mesaAcoesMapaAbrir_=id=>{try{abrir(id);}catch(e){console.warn('[Ações no mapa]',e);}};
 root.addEventListener('contextmenu',e=>{
  const b=board();if(!b||!b.contains(e.target)||!pronto())return;
  e.preventDefault();const id=e.target.closest('[data-token]')?.dataset.token||'';abrir(id||ctl()?.alvo?.()||'');
 });
 root.addEventListener('pointerdown',e=>{if(aberto()&&!balao.contains(e.target)&&!board()?.contains(e.target))fechar();});
 const vigiaMapa=()=>{const b=board(),sc=b?.parentElement;if(!sc||sc.dataset.maV122)return;sc.dataset.maV122='1';
  sc.addEventListener('pointerenter',()=>sobreMapa=true);sc.addEventListener('pointerleave',()=>sobreMapa=false);};

 // ------------------------------------------------------------ teclado
 root.addEventListener('keydown',e=>{
  try{
   if(e.ctrlKey||e.metaKey||e.altKey)return;
   const tag=(root.activeElement?.tagName||'').toLowerCase();if(['input','textarea','select'].includes(tag)||root.activeElement?.isContentEditable)return;
   const barraRapida=!!el('maRapido')&&!el('maRapido').classList.contains('ma-off')&&!!rt()?.ativo?.();
   if(!(aberto()||sobreMapa||barraRapida)||!pronto())return;
   const k=e.key.toLowerCase();
   if(e.key==='Escape'&&aberto()){fechar();return;}
   if(e.key==='?'){alternarLegenda();e.preventDefault();return;}
   if(ATALHOS[k]){e.preventDefault();if(aberto()){aba=ATALHOS[k];desenhar();}else abrir(ctl()?.alvo?.()||'',ATALHOS[k]);return;}
   if(/^[1-9]$/.test(e.key)){if(escolherRapido(Number(e.key)-1))e.preventDefault();return;}
   if(k==='x'){e.preventDefault();disparar();return;}
  }catch(err){console.warn('[Ações no mapa] teclado',err);}
 });

 // ------------------------------------------------------------ disparo rápido (combate dinâmico): 1–9 escolhe, Espaço dispara
 const rt=()=>{try{return win.mesaTempoRealV111||null;}catch(_){return null;}};
 const chaveRapido=id=>'mesa:ataqueRapido:'+id;
 function escolhidoRapido(st){const lista=ataquesRapidos(st?.sheet);if(!lista.length)return {lista,i:-1};let i=0;const ativo=el('novaSyncWeapon')?.value||st?.current?.activeWeaponId;if(ativo){const k=lista.findIndex(a=>a.weaponId===ativo);if(k>=0)return {lista,i:k};}
  try{const v=win.localStorage.getItem(chaveRapido(st.current.id));const k=lista.findIndex(a=>a.skillId+'|'+a.weaponId===v);if(k>=0)i=k;}catch(_){}return {lista,i};}
 function escolherRapido(n){const st=estado();if(!st?.sheet)return false;const lista=ataquesRapidos(st.sheet);const a=lista[n];if(!a)return false;
  try{win.localStorage.setItem(chaveRapido(st.current.id),a.skillId+'|'+a.weaponId);}catch(_){}rapido(true);return true;}
 function recarga(st){try{const p=Number(rt()?.estado?.()?.prontoEm?.[st.current.id]||0);return Math.max(0,p-Date.now());}catch(_){return 0;}}
 function disparar(alvoForcado){
  const st=estado(),a=acoes();if(!st?.sheet||!a)return false;
  const {lista,i}=escolhidoRapido(st);const at=lista[i];if(!at){aviso('Este personagem não tem ataques.');return false;}
  const maisPerto=()=>{try{const c=ctl(),eu=c?.token?.(st.current.id);if(!eu)return '';const {W,H}=c.dimsAtual?.()||{W:28,H:14};let melhor='',d0=1e9;for(const t of c.tokensNoMapa?.()||[]){const id=String(t.id);if(id===String(st.current.id))continue;let raw=id;try{raw=decodeURIComponent(id);}catch(_){}if(!/^sync(criatura|npc):/.test(raw))continue;if(c.saude?.(id)?.morto)continue;const d=Math.hypot((t.x-eu.x)*W/28,(t.y-eu.y)*H/14);if(d<d0){d0=d;melhor=id;}}return melhor;}catch(_){return '';}}; /* v205: sem alvo marcado, o mais perto */
  const alvo=alvoForcado||alvoEfetivo()||(()=>{const x=ctl()?.alvo?.();return x&&x!==st.current.id?x:'';})()||maisPerto();
  if(!alvo){aviso('🎯 Nenhum alvo por perto: clique numa criatura (ou Shift+clique para atacar direto).');return false;}
  if(!st.allowed||st.busy){aviso(st.combat?.active?'⏳ Não é a vez deste personagem.':'⏳ Aguarde a ação anterior.');return false;}
  const r=recarga(st);if(r>0){aviso('⏳ Recarregando: '+(r/1000).toFixed(1).replace('.',',')+' s');return false;}
  if(!a.escolher?.(at.skillId,at.weaponId))return false;
  if(alvo!==alvoId){alvoId=alvo;try{ctl()?.marcarAlvo?.(alvo);}catch(_){}}
  ultima={tipo:'pericia',skillId:at.skillId,weaponId:at.weaponId,alvo};
  aviso('⚡ '+at.nome+' → '+(nomeDe(alvo)||'alvo'));
  Promise.resolve(a.executar?.(alvo)).then(()=>{const t=el('novaSyncActionPanel')?.querySelector('.nova-result')?.textContent;if(t)aviso(t);if(aberto())resultado(t||'');}).catch(e=>aviso(e.message));
  return true;
 }
 let avisoTimer=0;
 let avisoTxt='',avisoAte=0;
 function aviso(txt){avisoTxt=String(txt||'');avisoAte=Date.now()+5000;const i=el('maRapido')?.querySelector('[data-info]');if(i){i.textContent=avisoTxt;i.title=avisoTxt;}clearTimeout(avisoTimer);avisoTimer=setTimeout(()=>{rapido(true);},5100);}
 let rapidoChave='';
 let rapidoAberto=false;
 function rapido(forcar){
  const sc=board()?.parentElement;if(!sc)return;let r=el('maRapido');
  const st=estado(),ok=pronto(),lista=ok?ataquesRapidos(st.sheet):[];
  if(!r){r=root.createElement('div');r.id='maRapido';r.setAttribute('aria-label','Disparo rápido');if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(r);
   r.addEventListener('pointerdown',e=>e.stopPropagation());
   r.addEventListener('click',e=>{if(e.target.closest('[data-abrir]')){rapidoAberto=!rapidoAberto;rapido(true);return;}const b=e.target.closest('[data-n]');if(b){rapidoAberto=false;escolherRapido(Number(b.dataset.n));return;}if(e.target.closest('[data-fogo]'))disparar();});}
  const emCombate=ok&&(!!rt()?.ativo?.()||!!st.combat?.active);
  if(!ok||!lista.length||!emCombate){r.classList.add('ma-off');rapidoChave='';rapidoAberto=false;return;}
  r.classList.remove('ma-off');
  const {i}=escolhidoRapido(st),rec=recarga(st),alvo=alvoEfetivo()||((x=>x&&x!==st.current.id?x:'')(ctl()?.alvo?.()));
  const k=JSON.stringify([rapidoAberto,st.current.id,lista.map(a=>a.skillId+a.weaponId),i,Math.ceil(rec/500),alvo,st.allowed,st.busy]);
  if(!forcar&&k===rapidoChave)return;rapidoChave=k;
  r.innerHTML=(rapidoAberto?'':`<button type="button" class="ma-r ma-sel" data-abrir aria-pressed="true" title="Trocar o ataque rápido (ou teclas 1–9)"><kbd>${i+1}</kbd>${lista[i]?.area?'💥':'⚔️'} ${esc(lista[i]?.nome||'')} ▸</button>`)+(!rapidoAberto?'':lista.map((a,n)=>`<button type="button" class="ma-r" data-n="${n}" aria-pressed="${n===i}" title="${esc(a.pericia+' · '+a.nome+(a.dano?' · Dano '+a.dano:'')+(a.area?' · em área':'')+' · '+a.valor+'% (tecla '+(n+1)+')')}"><kbd>${n+1}</kbd>${a.area?'💥':'⚔️'} ${esc(a.nome)}</button>`).join('')+'<button type="button" class="ma-r" data-abrir title="Recolher">◂</button>')
   +`<button type="button" class="ma-fogo" data-fogo title="Disparar o ataque escolhido no alvo (Espaço · Shift+clique numa miniatura)" ${!st.allowed||st.busy||rec>0?'disabled':''}>${rec>0?'⏳ '+(rec/1000).toFixed(1).replace('.',',')+' s':'⚡ Disparar'}</button>`
   +`<span class="ma-info" data-info title="${esc(avisoTxt)}">${Date.now()<avisoAte?esc(avisoTxt.slice(0,70)):alvo?'🎯 '+esc(nomeDe(alvo)):'Clique num alvo'}</span>`;
 }
 // Shift+clique numa miniatura: dispara o ataque escolhido direto nela.
 root.addEventListener('pointerdown',e=>{
  if(!e.shiftKey||e.button!==0)return;const b=board();if(!b||!b.contains(e.target)||!pronto())return;
  const id=e.target.closest('[data-token]')?.dataset.token;if(!id||id===estado()?.current?.id)return;
  e.preventDefault();e.stopPropagation();inicio=null;disparar(id);
 },true);

 // ------------------------------------------------------------ legenda compacta no canto do mapa
 function alternarLegenda(){legendaOn=!legendaOn;try{win.localStorage.setItem('mesa:legendaAcoes',legendaOn?'1':'0');}catch(_){}legenda();}
 function legenda(){
  const sc=board()?.parentElement;if(!sc)return;let l=el('maLegenda');
  if(!l){l=root.createElement('div');l.id='maLegenda';l.innerHTML='⌨️ <kbd>WASD</kbd> andar <kbd>J</kbd> atacar · <kbd>Espaço</kbd> pular <kbd>E</kbd> correr <kbd>F</kbd> interagir <kbd>Tab</kbd> alvo <kbd>T</kbd> mais perto <kbd>Q</kbd>/<kbd>R</kbd> arma <kbd>I</kbd> mochila <kbd>G</kbd> personagem <kbd>C</kbd> postura <kbd>V</kbd> centralizar <kbd>H</kbd> ajuda &nbsp;·&nbsp; 🎮 <kbd>A</kbd> atacar <kbd>RT</kbd> atacar <kbd>X</kbd> interagir <kbd>L3</kbd> correr <kbd>Y</kbd> alvo <kbd>LB</kbd>/<kbd>RB</kbd> arma';l.title='Teclas e botões do controle (H abre a ajuda completa e deixa trocar). Clique ou botão direito numa miniatura abre o balão de ações. A atacar · T perícia · P psi · C curar · F partes do corpo · 1–9 escolhe o ataque rápido · Espaço dispara · Shift+clique ataca direto · ? esconde esta legenda';if(getComputedStyle(sc).position==='static')sc.style.position='relative';acomodarPainelMapa(root,l);}
  l.classList.toggle('ma-off',!legendaOn||!pronto());
 }

 let chave='';
 const vigia=setInterval(()=>{try{vigiaMapa();legenda();rapido();if(aberto()){if(!pronto()){fechar();return;}const st=estado(),k=JSON.stringify([st.allowed,st.busy,st.current?.id,st.combat?.turnId,st.combat?.active,alvoId,st.view?.health?.psiSpent,st.view?.health?.treatment]);
   if(k!==chave){const mexendo=balao.contains(root.activeElement)&&/input|select/i.test(root.activeElement.tagName);if(chave&&!mexendo){const r=balao.querySelector('[data-res]')?.textContent;desenhar();if(r)resultado(r);}chave=k;}}else chave='';}catch(e){console.warn('[Ações no mapa]',e);}},700);
 return {abrir,fechar,aberto,disparar,escolherRapido,parar:()=>clearInterval(vigia)};
}
