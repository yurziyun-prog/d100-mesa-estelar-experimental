// Mesa Estelar v135 — Tempo do jogo, sono, cápsulas de recuperação e efeitos de itens (lanterna).
//
// ⏰ Relógio do jogo (o mestre liga/desliga; padrão: 24 h do jogo = 1 h real, ajustável). Todos veem a hora no mapa.
// 😴 Dormir numa cama/cápsula: a Fadiga melhora um nível a cada tantas horas de jogo (tabela da Fadiga).
// 🩺 Cápsula de recuperação (hospital): +1 PV por hora em cada parte ferida, estabiliza os ferimentos e tira do coma.
// 🔦 Lanterna equipada: o mestre publica quem carrega o quê, para todos verem a luz.
// Só o navegador do mestre aplica a passagem do tempo (quando ele volta, recupera as horas que passaram).

const RELOGIO='combatesAtivos/mesaRelogio',HEALTH='combatesAtivos/mapaMesaSyncSaude',HIST='combatesAtivos/mapaMesaSyncHistorico',
 MAP='combatesAtivos/mapaMesaSyncDireta',POS='combatesAtivos/mapaMesaSyncDireta/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',
 ITENS_EF='combatesAtivos/mesaItensEfeito',NEC='combatesAtivos/mesaNecessidades';
const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const HORA=3600000,DIA=24*HORA;

// ---------------------------------------------------------------- regras puras
// Hora do jogo agora (ms desde o "dia 1, 00:00").
export function agoraJogo(r,real=Date.now()){
 const base=Number(r?.jogoMs)||8*HORA,fator=Math.max(1,Number(r?.fator)||24);
 return r?.ativo?base+Math.max(0,real-(Number(r?.realMs)||real))*fator:base;
}
export function descreverHora(ms){
 const d=Math.floor(ms/DIA)+1,h=Math.floor(ms%DIA/HORA),m=Math.floor(ms%HORA/60000);
 return {dia:d,hora:h,min:m,texto:`dia ${d} · ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,icone:h>=6&&h<18?'☀️':h>=18&&h<20||h>=5&&h<6?'🌇':'🌙'};
}
// Luz pela hora: dia 7–17h, entardecer 5–7h e 17–19h, noite no resto.
export function ambientePelaHora(h){return h>=7&&h<17?'dia':(h>=5&&h<7)||(h>=17&&h<19)?'entardecer':'noite';}
// Horas de descanso para melhorar cada nível de Fadiga (da tabela da ficha).
// v139: regras de descanso
export const SONO_MAX=8,FATOR_SENTADO=1/3,DIA_MS=86400000;
export const ORDEM_FADIGA=['Fresh','Winded','Tired','Wearied','Exhausted','Debilitated','Incapacitated','Semi-Conscious','Comatose'];
export const HORAS_FADIGA={Winded:.25,Tired:3,Wearied:6,Exhausted:12,Debilitated:18,Incapacitated:24,'Semi-Conscious':36,Comatose:48};
export const NOME_FADIGA={Fresh:'Descansado',Winded:'Ofegante',Tired:'Cansado',Wearied:'Fatigado',Exhausted:'Exausto',Debilitated:'Debilitado',Incapacitated:'Incapacitado','Semi-Conscious':'Semiconsciente',Comatose:'Comatoso'};
export function dormir(nivel,acum,horas){
 let n=ORDEM_FADIGA.includes(nivel)?nivel:'Fresh',a=Number(acum)||0;a+=horas;
 while(n!=='Fresh'&&a>=HORAS_FADIGA[n]){a-=HORAS_FADIGA[n];n=ORDEM_FADIGA[ORDEM_FADIGA.indexOf(n)-1];}
 if(n==='Fresh')a=0;
 return {nivel:n,acum:a};
}
const VITAL=/^(cabeca|peito|abdomen|torso|tronco)/;
// Uma hora na cápsula de recuperação.
export function horaNaCapsula(st){
 const s=clean(st||{}),max=s.hitMax||{},hit=s.hit=s.hit||{};let pv=0;
 for(const k of Object.keys(max)){
  const atual=Number(hit[k]??max[k]),m=Number(max[k]);
  if(atual<m){hit[k]=atual+1;pv++;s.estabilizados={...(s.estabilizados||{}),[k]:true};s.tratados={...(s.tratados||{}),[k]:true};}
  if(Number(hit[k]??m)>m/2){if(s.ferimentos)delete s.ferimentos[k];}
  else if(s.ferimentos?.[k])s.ferimentos[k]=Number(hit[k])<=0?'Grave':'Sério';
 }
 let acordou=false;
 if(s.inconsciente&&!s.morto&&Object.keys(max).filter(k=>VITAL.test(sem(k))).every(k=>Number(hit[k]??max[k])>0)){s.inconsciente=false;s.incapacitado=false;delete s.unconsciousClock;acordou=true;}
 return {st:s,pv,acordou};
}
// Itens com efeito pelo nome (o que a mesa reconhece).
export function ferramentasDe(itens=[]){
 const t=itens.map(i=>sem(i?.nome||i?.name||i)).join(' | ');
 return {lanterna:/lanterna|flashlight|holofote portatil|luz de cabeca/.test(t),machado:/machad|\baxe\b/.test(t),picareta:/picaret|pickaxe/.test(t),
  pecabra:/pe de cabra|pe-de-cabra|crowbar|alavanca/.test(t),extintor:/extintor|extinguisher/.test(t),kit:/kit.*(medic|socorro)|medkit|primeiros socorros/.test(t)};
}

export function instalarRelogio(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const rF=p=>{try{return globalThis.mesaTreinoRotaV205?.(p)||p;}catch(_){return p;}}; // v205: durante um duelo de treino a ficha do personagem é a CÓPIA da sessão (treinoSessoes/…), nunca a ficha real
 const D=p=>dep.doc(dep.db,rF(p));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let rel=null,saude=null,parar=[],chip=null,pop=null,itensEf={};
 const agora=()=>agoraJogo(rel);
 win.mesaRelogio={ativo:()=>!!rel?.ativo,agora,hora:()=>descreverHora(agora()).hora,descrever:()=>descreverHora(agora()),ambiente:()=>rel?ambientePelaHora(descreverHora(agora()).hora):'dia'};
 win.mesaItensEfeito=id=>itensEf?.[id]||null;

 // ------------------------------------------------------------ chip da hora (todos) e controles (mestre)
 const CSS=`#rlChip{position:absolute;left:8px;bottom:8px;z-index:31;height:26px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.88);color:#e8eefc;font:600 12px 'Segoe UI',Arial,sans-serif;padding:0 10px;display:flex;align-items:center;gap:6px;cursor:default}
#rlChip.mestre{cursor:pointer}#rlChip .rl-off{color:#9fb3cc;font-weight:400}
#rlPop{position:fixed;z-index:9995;background:#121a2e;border:1px solid #8ee7ff;border-radius:12px;padding:10px 12px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;width:min(300px,92vw);box-shadow:0 10px 28px rgba(0,0,0,.55)}
#rlPop label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0}#rlPop input{width:70px}#rlPop .rl-l{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
#rlNecTopo{display:flex;flex-wrap:wrap;gap:6px 14px;margin:-4px 0 8px;font:12px 'Segoe UI',Arial,sans-serif;color:#c6d3e6}#rlNecTopo .rl-nec{background:rgba(0,0,0,.2);border-radius:8px;padding:3px 8px}#rlNecTopo b{color:#e8eefc}#rlNecTopo .rl-n2{color:#ffd27a}#rlNecTopo .rl-n4{color:#ff8a7a;font-weight:700}
#rlCamada .rl-z{display:inline-flex;align-items:flex-end;gap:1px;font:700 13px 'Segoe UI',Arial,sans-serif;color:#dfe8ff;text-shadow:0 1px 2px #000}#rlCamada .rl-z i{font-style:normal;opacity:0;animation:rlZ 2.4s ease-in-out infinite}#rlCamada .rl-z i:nth-child(1){font-size:9px}#rlCamada .rl-z i:nth-child(2){font-size:11px;animation-delay:.4s}#rlCamada .rl-z i:nth-child(3){font-size:14px;animation-delay:.8s}
@keyframes rlZ{0%{opacity:0;transform:translateY(4px)}25%{opacity:1}70%{opacity:1;transform:translateY(-3px)}100%{opacity:0;transform:translateY(-6px)}}
#rlCamada{position:absolute;inset:0;pointer-events:none;z-index:9}#rlCamada span{position:absolute;transform:translate(-50%,-120%);font-size:16px;text-shadow:0 1px 3px #000}`;
 if(!root.getElementById('rlCss')){const s=root.createElement('style');s.id='rlCss';s.textContent=CSS;root.head.append(s);}
 const board=()=>root.getElementById('novaSyncBoard');
 function desenharChip(){
  const b=board(),sc=b?.parentElement;if(!sc)return;if(getComputedStyle(sc).position==='static')sc.style.position='relative';
  if(!chip||!chip.isConnected){chip?.remove();chip=root.createElement('div');chip.id='rlChip';chip.addEventListener('pointerdown',e=>e.stopPropagation());chip.addEventListener('click',e=>{e.stopPropagation();if(ehMestre())abrirPop();});sc.append(chip);}
  chip.classList.toggle('mestre',ehMestre());
  if(!rel?.ativo&&!rel?.mostrar){chip.innerHTML=ehMestre()?'<span class="rl-off">⏰ relógio parado</span>':'';chip.style.display=ehMestre()?'flex':'none';chip.title='Tempo do jogo (clique para ligar)';return;}
  const d=descreverHora(agora());chip.style.display='flex';chip.innerHTML=`${d.icone} ${d.texto}${rel?.ativo?'':' <span class="rl-off">(parado)</span>'}`;
  chip.title=rel?.ativo?`Tempo do jogo · 24 h do jogo = ${(24/(Number(rel.fator)||24)).toLocaleString('pt-BR',{maximumFractionDigits:2})} h reais`:'Tempo do jogo parado';
 }
 function abrirPop(){
  if(pop){pop.remove();pop=null;return;}
  pop=root.createElement('div');pop.id='rlPop';const r=chip.getBoundingClientRect();pop.style.left=Math.max(12,r.left)+'px';pop.style.top=Math.max(12,r.top-230)+'px';
  const d=descreverHora(agora()),horasReais=24/(Number(rel?.fator)||24);
  pop.innerHTML=`<b style="color:#8ee7ff">⏰ Tempo do jogo</b>
   <label>Relógio andando <input type="checkbox" data-ativo ${rel?.ativo?'checked':''}></label>
   <label title="Quantas horas reais dura um dia (24 h) do jogo">24 h do jogo duram <span><input type="number" min="0.05" step="0.05" value="${+horasReais.toFixed(2)}" data-fator> h reais</span></label>
   <div style="color:#9fb3cc;font-size:12px">Para recomeçar a contagem (ex.: dia 1 às 22:00), troque o dia e a hora abaixo.</div><label>Dia <input type="number" min="1" value="${d.dia}" data-dia></label><label>Hora <input type="time" value="${String(d.hora).padStart(2,'0')}:${String(d.min).padStart(2,'0')}" data-hora></label>
   <div class="rl-l"><button type="button" class="btn-small" data-pular="1">+1 h</button><button type="button" class="btn-small" data-pular="8">+8 h (noite de sono)</button><button type="button" class="btn-small" data-pular="24">+1 dia</button></div>
   <label style="margin-top:8px">Mostrar a hora mesmo parado <input type="checkbox" data-mostrar ${rel?.mostrar?'checked':''}></label>
   <div style="color:#9fb3cc;font-size:12px;margin-top:6px">A luz segue a hora nos mapas com Iluminação "🕐 Pela hora do jogo" (painel 🎨). Sono e cápsulas de recuperação usam este relógio.</div>`;
  pop.addEventListener('click',e=>e.stopPropagation());
  pop.addEventListener('change',async e=>{
   const t=e.target,j=agora(),now=Date.now();
   if(t.dataset.ativo!==undefined)await salvar({ativo:t.checked,jogoMs:j,realMs:now});
   else if(t.dataset.fator!==undefined){const h=Math.max(.05,Number(t.value)||1);await salvar({fator:24/h,jogoMs:j,realMs:now});}
   else if(t.dataset.dia!==undefined||t.dataset.hora!==undefined){const dia=Math.max(1,Number(pop.querySelector('[data-dia]').value)||1),[hh,mm]=String(pop.querySelector('[data-hora]').value||'08:00').split(':').map(Number);await salvar({jogoMs:(dia-1)*DIA+(hh||0)*HORA+(mm||0)*60000,realMs:now});}
   else if(t.dataset.mostrar!==undefined)await salvar({mostrar:t.checked});
  });
  pop.addEventListener('click',async e=>{const b=e.target.closest('[data-pular]');if(!b)return;await salvar({jogoMs:agora()+Number(b.dataset.pular)*HORA,realMs:Date.now()});pop?.remove();pop=null;});
  root.body.append(pop);
  const fora=e=>{if(pop&&!pop.contains(e.target)&&e.target!==chip&&!chip.contains(e.target)){pop.remove();pop=null;root.removeEventListener('click',fora);}};setTimeout(()=>root.addEventListener('click',fora),0);
 }
 async function salvar(p){if(!ehMestre())return;rel={fator:24,...(rel||{}),...p};await dep.setDoc(D(RELOGIO),clean(rel),{merge:true});desenharChip();}

 // ------------------------------------------------------------ v145: fome e sede · passar a noite
 // Fome sobe 1 a cada 8 h de jogo e sede 1 a cada 6 h (dormindo também). Comer zera a fome; água zera a sede; café/bebida tiram 1 de sede.
 // O mestre publica o que cada personagem do grupo sente (combatesAtivos/mesaNecessidades); todos veem 🍖/💧 na miniatura a partir de 2.
 let nec={},ocupNec=false,ultimoNec='';
 const grupo=()=>{const m=String(dep.uid?.()||'');return (ctl()?.todosTokens?.()||[]).filter(t=>{const id=decodeURIComponent(String(t.id||''));return !id.startsWith('sync')&&t.nome!==undefined&&(String(t.donoUid||'')!==m||id==='teste_jogador_v138');});};
 async function necessidades(){
  if(ocupNec||!ehMestre()||!rel)return;const j=agora(),ult=Number(rel.necUltimo);
  if(!Number.isFinite(ult)){await salvar({necUltimo:j});return;}
  let dh=(j-ult)/HORA;if(dh<0){await salvar({necUltimo:j});dh=0;} // relógio voltou (mestre acertou a hora)
  ocupNec=true;
  try{
   const passa=dh>=1;if(passa)await salvar({necUltimo:j});const out={};
   for(const t of grupo()){const id=decodeURIComponent(String(t.id));
    try{const s=await dep.getDoc(D('personagens/'+id));if(!s.exists())continue;const n={fome:0,sede:0,hFome:0,hSede:0,...(s.data().necessidades||{})};
     if(passa){n.hFome+=dh;n.hSede+=dh;while(n.hFome>=8){n.hFome-=8;n.fome=Math.min(5,n.fome+1);}while(n.hSede>=6){n.hSede-=6;n.sede=Math.min(5,n.sede+1);}
      n.hFome=+n.hFome.toFixed(2);n.hSede=+n.hSede.toFixed(2);await dep.setDoc(D('personagens/'+id),{necessidades:n},{merge:true});}
     out[t.id]={fome:n.fome,sede:n.sede};}catch(e){console.warn('[Relógio] fome',e);}}
   const k=JSON.stringify(out);if(k!==ultimoNec){ultimoNec=k;await dep.setDoc(D(NEC),clean({tokens:out,em:Date.now()}));}
  }finally{ocupNec=false;}
 }
 // ⏩ quando todos os personagens do grupo estão dormindo, o mestre pula a noite (8 h) de uma vez
 let botaoNoite=null;
 function desenharNoite(){
  const b=board(),sc=b?.parentElement;if(!sc||!ehMestre()){botaoNoite?.remove();botaoNoite=null;return;}
  const aqui=String(ctl()?.mapaAtual?.()||''),todos=grupo(),noMapa=todos.filter(t=>String(t.mapaId||'')===aqui),g=noMapa.length?noMapa:todos; // os jogadores ativos: os do mapa aberto
  const dormem=g.length&&g.every(t=>saude?.actors?.[t.id]?.repouso?.tipo==='sono');
  if(!dormem){if(botaoNoite)botaoNoite.hidden=true;return;}
  if(!botaoNoite||!botaoNoite.isConnected){botaoNoite?.remove();botaoNoite=root.createElement('button');botaoNoite.type='button';botaoNoite.id='rlNoite';
   botaoNoite.style.cssText="position:absolute;left:8px;bottom:40px;z-index:32;height:30px;padding:0 12px;border-radius:999px;border:1px solid #b07cff;background:rgba(40,20,70,.95);color:#efe2ff;font:600 13px 'Segoe UI',Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.45)";
   botaoNoite.addEventListener('pointerdown',e=>e.stopPropagation());botaoNoite.addEventListener('click',passarNoite);sc.append(botaoNoite);}
  botaoNoite.hidden=false;botaoNoite.textContent='⏩ Passar a noite (8 h)';botaoNoite.title=`Todo o grupo está dormindo (${g.length}). Pula 8 h do jogo de uma vez: recuperam a Fadiga e ganham fome e sede.`;
 }
 async function passarNoite(){
  if(!ehMestre()||!botaoNoite)return;botaoNoite.disabled=true;
  try{await salvar({jogoMs:agora()+8*HORA,realMs:Date.now()});await passarTempo();await necessidades();await registrar(`🌅 A noite passa (8 h). ${descreverHora(agora()).texto}.`);}
  catch(e){console.warn('[Relógio] noite',e);}finally{if(botaoNoite)botaoNoite.disabled=false;}
 }

 // ------------------------------------------------------------ 😴 / 🩺 marcas nas miniaturas que estão descansando
 function desenharMarcas(){
  const b=board();if(!b)return;let c=root.getElementById('rlCamada');if(!c||c.parentElement!==b){c?.remove();c=root.createElement('div');c.id='rlCamada';b.append(c);}
  const toks=ctl()?.tokensNoMapa?.()||[],lista=toks.filter(t=>saude?.actors?.[t.id]?.repouso);
  let html=lista.map(t=>`<span style="left:${Number(t.x)/28*100}%;top:${Number(t.y)/14*100}%" title="${saude.actors[t.id].repouso.tipo==='cura'?'Na cápsula de recuperação':'Dormindo'}">${saude.actors[t.id].repouso.tipo==='cura'?'🩺':'<span class="rl-z"><i>z</i><i>z</i><i>Z</i></span>'}</span>`).join('');
  // v158: fome e sede saem de cima da miniatura e vão para a linha acima do mapa (só os seus; o mestre vê o grupo)
  desenharNecTopo(toks);
  if(c.dataset.h!==html){c.dataset.h=html;c.innerHTML=html;}
 }

 function desenharNecTopo(toks){
  const st=root.getElementById('novaSyncStatus');if(!st?.parentElement)return;
  let el=root.getElementById('rlNecTopo');if(!el||el.previousElementSibling!==st){el?.remove();el=root.createElement('div');el.id='rlNecTopo';st.after(el);}
  const c=ctl(),m=ehMestre();
  const meus=toks.filter(t=>!decodeURIComponent(String(t.id)).startsWith('sync')&&(m||c?.controla?.(t)));
  const nivel=v=>v>=4?'rl-n4':v>=2?'rl-n2':'';
  const partes=meus.map(t=>{const n=nec?.[t.id]||{fome:0,sede:0},nome=String(t.nome||'').replace(/^(PJ|PM)\s*[·:-]\s*/i,'').split(/[ ,]/)[0];
   return `<span class="rl-nec" title="Fome ${n.fome||0}/5 · Sede ${n.sede||0}/5 (comer zera a fome; água zera a sede)">${m||meus.length>1?`<b>${nome}</b> `:''}<span class="${nivel(n.fome||0)}">🍖 ${n.fome||0}/5</span> <span class="${nivel(n.sede||0)}">💧 ${n.sede||0}/5</span></span>`;});
  const html=partes.join('');if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}el.hidden=!html;
 }
 // ------------------------------------------------------------ passagem do tempo (mestre)
 let ocupado=false;
 async function passarTempo(){
  if(ocupado||!ehMestre()||!saude?.actors)return; // v145: também com o relógio parado (o mestre pula as horas)
  const j=agora(),pend=Object.entries(saude.actors).filter(([,a])=>a?.repouso&&j-Number(a.repouso.ultimo||j)>=HORA);if(!pend.length)return;
  ocupado=true;const fichas=[];
  try{
   await dep.runTransaction(dep.db,async tx=>{
    fichas.length=0;
    const s=await tx.get(D(HEALTH)),hp=s.exists()?s.data():null;if(!hp)return;const h=await tx.get(D(HIST)),hh=h.exists()?h.data():{entries:[],revision:0};
    const actors={...hp.actors},msgs=[];
    for(const [id,a0] of Object.entries(actors)){
     const rp=a0?.repouso;if(!rp)continue;const horas=Math.floor((j-Number(rp.ultimo||j))/HORA);if(horas<1)continue;
     const nome=String(ctl()?.token?.(id)?.nome||'Alguém').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
     const a={...a0,repouso:{...rp,ultimo:Number(rp.ultimo)+horas*HORA,horas:Number(rp.horas||0)+horas}};
     if(rp.tipo==='cura'&&a.combateLab){let pv=0,acordou=false,st=a.combateLab;for(let k=0;k<Math.min(horas,72);k++){const r=horaNaCapsula(st);st=r.st;pv+=r.pv;acordou=acordou||r.acordou;}a.combateLab=st;
      a.repouso.pv=Number(rp.pv||0)+pv;const curado=!pv&&Number(rp.pv||0)>0&&!rp.avisouCurado;if(curado)a.repouso.avisouCurado=true;
      if(acordou)msgs.push(`🩺 ${nome} acorda na cápsula de recuperação (+${a.repouso.pv} PV até agora).`);
      else if(curado)msgs.push(`🩺 ${nome} está curado na cápsula (+${a.repouso.pv} PV em ${a.repouso.horas} h). Pode sair.`);}
     // v139: sono conta no máximo 8 h (uma vez por dia) e acorda sozinho; sentado recupera ⅓ do sono, sem limite
     if(rp.tipo==='sono'){const ja=Number(rp.horas||0),conta=Math.max(0,Math.min(horas,SONO_MAX-ja));if(conta>0&&!/^sync/.test(decodeURIComponent(id)))fichas.push({id:decodeURIComponent(id),horas:conta,total:Math.min(SONO_MAX,a.repouso.horas),nome});
      if(a.repouso.horas>=SONO_MAX){delete a.repouso;msgs.push(`⏰ ${nome} acorda depois de ${SONO_MAX} h de sono.`);}}
     if(rp.tipo==='sentado'&&!/^sync/.test(decodeURIComponent(id)))fichas.push({id:decodeURIComponent(id),horas:horas*FATOR_SENTADO,total:a.repouso.horas,nome,sentado:true});
     actors[id]=a;
    }
    tx.set(D(HEALTH),clean({...hp,actors,revision:Number(hp.revision||0)+1}));
    if(msgs.length)tx.set(D(HIST),clean({entries:[...(hh.entries||[]),...msgs.map(m=>({id:'rl:'+Math.random().toString(36).slice(2),ts:Date.now(),actorUid:'',targetUid:'',message:m}))].slice(-120),revision:Number(hh.revision||0)+1}));
   });
   // sono: Fadiga na ficha do personagem
   for(const f of fichas){
    try{const s=await dep.getDoc(D('personagens/'+f.id));if(!s.exists())continue;const c=s.data(),cb=c.combate||{},antes=cb.fadiga||'Fresh',r=dormir(antes,cb.descansoHoras,f.horas);
     await dep.setDoc(D('personagens/'+f.id),{combate:{...cb,fadiga:r.nivel,descansoHoras:r.acum}},{merge:true});
     if(r.nivel!==antes)await registrar(f.sentado?`🪑 ${f.nome} descansou sentado (${f.total} h): ${NOME_FADIGA[antes]||antes} → ${NOME_FADIGA[r.nivel]||r.nivel}.`:`😴 ${f.nome} dormiu ${f.total} h: ${NOME_FADIGA[antes]||antes} → ${NOME_FADIGA[r.nivel]||r.nivel}.`);}
    catch(e){console.warn('[Relógio] sono',e);}
   }
  }catch(e){console.warn('[Relógio] tempo',e);}finally{ocupado=false;}
 }
 async function registrar(msg){try{await dep.runTransaction(dep.db,async tx=>{const h=await tx.get(D(HIST)),hh=h.exists()?h.data():{entries:[],revision:0};tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'rl:'+Math.random().toString(36).slice(2),ts:Date.now(),actorUid:'',targetUid:'',message:msg}].slice(-120),revision:Number(hh.revision||0)+1}));});}catch(_){}}

 // ------------------------------------------------------------ deitar / levantar (pedidos já conferidos por mesa-objetos)
 async function deitar({alvoId,objeto,tipo}){
  const j=agora(),nome=String(ctl()?.token?.(alvoId)?.nome||'Alguém').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
  await dep.runTransaction(dep.db,async tx=>{
   const s=await tx.get(D(HEALTH)),hp=s.exists()?s.data():{actors:{},revision:0},p=await tx.get(D(POS+'/'+alvoId)),pos=p.exists()?p.data():null;
   const h=await tx.get(D(HIST)),hh=h.exists()?h.data():{entries:[],revision:0};
   const actors={...(hp.actors||{})},dia=Math.floor(j/DIA_MS);
   if(tipo==='sono'&&Number(actors[alvoId]?.sonoDia)===dia)throw Error('Já dormiu hoje: dormir só uma vez por dia (8 h de jogo).');
   actors[alvoId]={...(actors[alvoId]||{}),...(tipo==='sono'?{sonoDia:dia}:{}),repouso:{tipo,objetoId:String(objeto.id),objetoNome:String(objeto.nome||''),desde:j,ultimo:j,horas:0}};
   tx.set(D(HEALTH),clean({...hp,actors,revision:Number(hp.revision||0)+1}));
   if(pos)tx.set(D(POS+'/'+alvoId),clean({...pos,x:Number(objeto.x),y:Number(objeto.y),revision:Number(pos.revision||0)+1}));
   tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'rl:'+Math.random().toString(36).slice(2),ts:Date.now(),actorUid:'',targetUid:'',message:tipo==='sentado'?`🪑 ${nome} senta para descansar (${objeto.nome||'cadeira'}).`:tipo==='cura'?`🩺 ${nome} entra na ${objeto.nome||'cápsula de recuperação'}.${rel?.ativo?'':' (o relógio do jogo está parado: ligue ⏰ para o tempo passar)'}`:`😴 ${nome} vai dormir (${objeto.nome||'cama'}).${rel?.ativo?'':' (o relógio do jogo está parado: ligue ⏰ para o tempo passar)'}`}].slice(-120),revision:Number(hh.revision||0)+1}));
  });
 }
 async function levantar({alvoId}){
  await passarTempo();
  const nome=String(ctl()?.token?.(alvoId)?.nome||'Alguém').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');let horas=0,tipo='',pvT=0;
  await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HEALTH)),hp=s.exists()?s.data():null;if(!hp?.actors?.[alvoId]?.repouso)return;const actors={...hp.actors},a={...actors[alvoId]};horas=Number(a.repouso.horas||0);tipo=a.repouso.tipo;pvT=Number(a.repouso.pv||0);delete a.repouso;actors[alvoId]=a;tx.set(D(HEALTH),clean({...hp,actors,revision:Number(hp.revision||0)+1}));});
  if(tipo)await registrar(tipo==='cura'?`🩺 ${nome} sai da cápsula depois de ${horas} h${pvT?` (+${pvT} PV)`:''}.`:tipo==='sentado'?`🧍 ${nome} levanta depois de ${horas} h sentado.`:`⏰ ${nome} acorda depois de ${horas} h de sono.`);
 }
 win.mesaRepouso={deitar,levantar,emRepouso:id=>saude?.actors?.[id]?.repouso||null,ocupantes:oid=>Object.entries(saude?.actors||{}).filter(([,a])=>String(a?.repouso?.objetoId||'')===String(oid)).map(([id,a])=>({id,...a.repouso}))};

 // ------------------------------------------------------------ itens com efeito (o mestre publica para todos)
 let ultimoItens='';
 async function publicarItens(){
  if(!ehMestre())return;
  const tokens=ctl()?.todosTokens?.()||[],out={};
  for(const t of tokens){const id=decodeURIComponent(String(t.id||''));let lista=[];
   try{if(id.startsWith('syncnpc:')){const n=(dep.npcs?.()||[]).find(x=>String(x.id)===id.slice(8).split('~')[0]);lista=String(n?.inventarioTexto||'').split(/[|;,\n]/);}
    else if(!id.startsWith('sync')){const c=(dep.personagens?.()||[]).find(x=>String(x.id)===id);lista=(c?.inventario?.equipado||[]).filter(Boolean);}}catch(_){}
   const f=ferramentasDe(lista);if(Object.values(f).some(Boolean))out[t.id]=f;}
  const j=JSON.stringify(out);if(j===ultimoItens)return;ultimoItens=j;
  try{await dep.setDoc(D(ITENS_EF),{tokens:out,em:Date.now()});}catch(e){console.warn('[Relógio] itens',e);}
 }

 // ------------------------------------------------------------ v135: cápsulas de recuperação no hospital (uma vez)
 async function equiparHospital(){
  const flag=D('configuracoes/hospitalV135');try{if((await dep.getDoc(flag)).exists())return true;}catch(_){return false;}
  const mapas=dep.mapas?.()||[],obj=(dep.objetos?.()||[]).find(o=>String(o.id)==='pk_fut_capsula_med');if(!obj)return false; // espera o pacote de móveis
  const alvos=mapas.filter(m=>/cl[ií]nica|hospital|enfermaria|centro m[eé]dico/i.test(String(m.nome||'')));let n=0;
  for(const m of alvos){
   for(const p of ['combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(m.id),SCENE]){
    try{const s=await dep.getDoc(D(p));if(!s.exists())continue;const cena=s.data();if(p===SCENE&&String(cena.mapId||'')!==String(m.id))continue;
     if((cena.objects||[]).some(o=>/c[aá]psula de recupera/i.test(String(o.nome||''))))continue;
     const W=Number(m.larguraM)||28,H=Number(m.alturaM)||14,novos=[0,1,2].map(i=>({id:'hosp_'+m.id+'_'+i,nome:'Cápsula de recuperação '+(i+1),modeloId:obj.id,imagem:obj.imagem||'',x:(W-3-i*1.6)*28/W,y:(2.2)*14/H,larguraM:Number(obj.larguraM)||1.1,alturaM:Number(obj.alturaM)||2.2,angulo:0,camada:3,bloqueiaMovimento:false,bloqueiaVisao:false,interativo:'recuperacao',material:'Metal',pvMax:30,pvAtual:30,dureza:6,destrutivel:true}));
     await dep.setDoc(D(p),clean({...cena,objects:[...(cena.objects||[]),...novos]}));n++;}catch(e){console.warn('[Relógio] hospital',e);}
   }
  }
  try{await dep.setDoc(flag,{em:new Date().toISOString(),mapas:alvos.map(m=>m.id)});}catch(_){}
  if(n)console.info('[Relógio] cápsulas de recuperação colocadas em',alvos.map(m=>m.nome).join(', '));
  return true;
 }

 // ------------------------------------------------------------ assinaturas e vigia
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(RELOGIO),s=>{rel=s.exists()?s.data():null;desenharChip();},()=>{}));
  parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;desenharMarcas();},()=>{}));
  parar.push(dep.onSnapshot(D(ITENS_EF),s=>{itensEf=s.exists()?s.data()?.tokens||{}:{};},()=>{}));
  parar.push(dep.onSnapshot(D(NEC),s=>{nec=s.exists()?s.data()?.tokens||{}:{};desenharMarcas();},()=>{}));
 }
 let assinado='',voltas=0,hospitalFeito=false;
 const vigia=setInterval(()=>{
  try{
   const k=String(dep.uid?.()||'')+'|'+ehMestre();if(!dep.uid?.())return;if(k!==assinado){assinado=k;assinar();}
   if(++voltas%2===0){desenharChip();desenharMarcas();desenharNoite();}
   if(ehMestre()){if(voltas%6===0)void passarTempo();if(voltas%16===7)void necessidades();if(voltas%8===0)void publicarItens();if(!hospitalFeito&&voltas%10===5)void equiparHospital().then(ok=>{hospitalFeito=!!ok;}).catch(()=>{});}
  }catch(e){console.warn('[Relógio]',e);}
 },500);
 return {parar:()=>{clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});chip?.remove();pop?.remove();},passarTempo,deitar,levantar};
}
