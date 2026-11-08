import {ocupadoNoArrasto} from './mesa-arrasto-regras.js';
// Mesa Estelar v136 — Arrastar: personagens caídos e objetos soltos.
//
// ✋ Quem está perto (até ~1,5 m) de um personagem caído/desacordado/morto ou de um objeto solto pode arrastá-lo:
//    ele segue logo atrás de quem puxa. Quem arrasta anda mais devagar, pelo peso comparado com a Força.
// 🤝 Outro personagem pode ajudar: soma a Força e anda junto, ao lado da carga.
// Leva-se, por exemplo, alguém em coma até a cápsula de recuperação do hospital (ao entrar na cápsula, solta sozinho).
// O mestre aplica (os jogadores fazem pedidos). Módulo à parte: se falhar, o mapa segue igual.

const ARR='combatesAtivos/mesaArrastos',POS='combatesAtivos/mapaMesaSyncDireta/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',
 HEALTH='combatesAtivos/mapaMesaSyncSaude',HIST='combatesAtivos/mapaMesaSyncHistorico',MAP='combatesAtivos/mapaMesaSyncDireta';
const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const limpa=n=>String(n||'Alguém').replace(/^(NPC|Monstro|PJ|PM|Criatura)\s*[·:-]\s*/i,'');
export const ALCANCE_ARRASTO=1.6;

// ---------------------------------------------------------------- regras puras
// Peso a partir do texto da ficha ("75 kg", "~18 t", "1,2 toneladas").
export function pesoDeTexto(txt,padrao=75){
 const m=/(\d+(?:[.,]\d+)?)\s*(t\b|ton|tonelada|kg|quilo)?/i.exec(String(txt||''));if(!m)return padrao;
 const v=Number(m[1].replace(',','.'));if(!Number.isFinite(v)||v<=0)return padrao;
 return /^t/i.test(m[2]||'')?v*1000:v;
}
// Peso estimado de um objeto (kg).
export function pesoObjeto(o){
 const p=Number(o?.pesoKg||o?.peso);if(p>0)return p;
 const a=Math.max(.05,(Number(o?.larguraM)||1)*(Number(o?.alturaM)||1)),m=sem([o?.material,o?.nome].join(' '));
 const dens=/metal|aco|ferro|maquina|console|cofre/.test(m)?120:/pedra|rocha|concreto/.test(m)?250:/tecido|papel|planta/.test(m)?10:/vidro|cristal/.test(m)?60:40;
 return Math.round(a*dens);
}
// Capacidade de arrasto (kg) pela Força (FOR 10 ≈ 80 kg com folga).
export const capacidade=FOR=>Math.max(3,Number(FOR)||10)*8;
// Fator de velocidade para quem puxa: carga leve quase não atrasa; pesada arrasta devagar; acima do dobro não sai do lugar.
export function fatorArrasto(peso,cap){
 const r=Number(cap)/Math.max(1,Number(peso));
 if(r<.5)return 0;
 return Math.max(.15,Math.min(.85,.2+.3*r));
}
// Onde a carga fica: atrás de quem puxa, no sentido contrário ao que ele olha (metros).
export function posicaoAtras(p,facing,dist){return {x:p.x-Math.cos(facing)*dist,y:p.y-Math.sin(facing)*dist};}
export function posicaoFrente(p,facing,dist){return {x:p.x+Math.cos(facing)*dist,y:p.y+Math.sin(facing)*dist};}
// Pode ser arrastado? (personagem fora de combate; objeto solto, não parede/porta/fixo)
export function tokenArrastavel(st,t=null){const monstro=/^synccriatura:/.test(decodeURIComponent(String(t?.id||'')));return !!(st&&(st.morto||(!monstro&&(st.inconsciente||st.incapacitado))));}
export function objetoArrastavel(o){
 if(!o||o.destruido===true&&!o.itemSolto)return !!o?.itemSolto;
 if(o.fixoAoMapa||o.locked)return false;
 const t=o.oficinaElement?.type;if(t==='shape'||t==='path')return false;
 if(/\b(parede|muro|piso|chao|porta|portao|escotilha|janela|balcao|rua|faixa)\b/.test(sem(o.nome)))return false;
 return pesoObjeto(o)<=1500;
}

export function instalarArrastar(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const api=()=>{try{return dep.api?.()||null;}catch(_){return null;}};
 let estado={lista:{}},mapa=null,saude=null,cena=null,parar=[],posicoes=new Map();
 const dims=()=>({W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14});
 const M=p=>{const {W,H}=dims();return {x:Number(p.x)*W/28,y:Number(p.y)*H/14};};
 const N=p=>{const {W,H}=dims();return {x:Math.max(.3,Math.min(27.7,p.x*28/W)),y:Math.max(.3,Math.min(13.7,p.y*14/H))};};
 const diam=t=>Number(t?.diametroM)>0?Number(t.diametroM):1;
 const distBordas=(a,b,rb)=>{const A=M(a),B=M(b);return Math.max(0,Math.hypot(A.x-B.x,A.y-B.y)-diam(a)/2-(rb??diam(b)/2));};
 const raioObj=o=>Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)/2;

 // ganchos usados pelo movimento da mesa (nova-direta): velocidade e quem não bloqueia quem arrasta
 win.mesaVelocidadeV136=id=>{const a=estado?.lista?.[id];if(a)return Number.isFinite(Number(a.fator))?Number(a.fator):.5;for(const v of Object.values(estado?.lista||{}))if((v.ajudantes||[]).includes(id))return 0;return 1;};
 win.mesaArrastoIgnorar=(moverId,outroId)=>{const a=estado?.lista?.[moverId];if(!a)return false;return String(a.alvo?.id)===String(outroId)||(a.ajudantes||[]).includes(String(outroId));};
 win.mesaArrastando=()=>estado?.lista||{};
 win.mesaArrastoOcupadoV217=id=>ocupadoNoArrasto(estado,id);

 // ------------------------------------------------------------ mestre: aplicar pedidos
 async function infoForca(id){try{return await api()?.info?.({...(ctl()?.token?.(id)||{}),id})||{FOR:10,peso:75};}catch(_){return {FOR:10,peso:75};}}
 async function aplicar(cmd){
  const quem=String(cmd.personagemId||''),t=ctl()?.token?.(quem);if(!t)throw Error('Personagem não está no mapa.');
  const lista={...(estado?.lista||{})},nomeQuem=limpa(t.nome);
  if(cmd.acao==='soltar'){
   let msg='';for(const [k,v] of Object.entries(lista)){if(k===quem){delete lista[k];msg=`✋ ${nomeQuem} solta ${v.alvo?.nome||'a carga'}.`;}else if((v.ajudantes||[]).includes(quem)){lista[k]={...v,ajudantes:v.ajudantes.filter(x=>x!==quem)};msg=`🤝 ${nomeQuem} para de ajudar.`;}}
   await salvar(lista,msg);return msg||'Nada a soltar.';
  }
  if(lista[quem])throw Error('Já está arrastando algo: solte primeiro.');
  if(Object.values(lista).some(v=>(v.ajudantes||[]).includes(quem)))throw Error('Já está ajudando a arrastar.');
  const st=saude?.actors?.[quem]?.combateLab;if(st?.morto||st?.inconsciente||st?.incapacitado)throw Error('Personagem incapaz de arrastar.');
  if(cmd.acao==='ajudar'){
   const [k,v]=Object.entries(lista).find(([,x])=>x.alvo?.id===cmd.alvoId)||[];if(!k)throw Error('Ninguém está arrastando isso.');
   const alvoPos=v.alvo.tipo==='token'?ctl()?.token?.(cmd.alvoId):(cena?.objects||[]).find(o=>String(o.id)===String(cmd.alvoId));
   if(!alvoPos||distBordas(t,alvoPos,v.alvo.tipo==='objeto'?raioObj(alvoPos):undefined)>ALCANCE_ARRASTO+.4)throw Error('Chegue mais perto para ajudar.');
   const f=await infoForca(quem),cap=Number(v.cap)+capacidade(f.FOR),fator=fatorArrasto(v.peso,cap);
   lista[k]={...v,ajudantes:[...(v.ajudantes||[]),quem],cap,fator};
   await salvar(lista,`🤝 ${nomeQuem} ajuda a arrastar ${v.alvo.nome}${fator>0?'':' (ainda pesado demais)'}.`);return 'Ajudando.';
  }
  if(cmd.acao!=='arrastar')throw Error('Pedido inválido.');
  if(Object.values(lista).some(v=>String(v.alvo?.id)===String(cmd.alvoId)))throw Error('Alguém já está arrastando isso: use 🤝 Ajudar.');
  let alvo=null,peso=75;
  if(cmd.alvoTipo==='token'){
   const b=ctl()?.token?.(cmd.alvoId);if(!b)throw Error('Personagem não encontrado.');
   if(!tokenArrastavel(saude?.actors?.[cmd.alvoId]?.combateLab,b))throw Error(limpa(b.nome)+' não pode ser arrastado: criaturas vivas não são cargas.');
   if(distBordas(t,b)>ALCANCE_ARRASTO)throw Error('Chegue mais perto (até 1,5 m).');
   peso=(await infoForca(cmd.alvoId)).peso||75;alvo={tipo:'token',id:String(cmd.alvoId),nome:limpa(b.nome),raio:diam(b)/2};
  }else{
   const o=(cena?.objects||[]).find(x=>String(x.id)===String(cmd.alvoId));if(!o)throw Error('Objeto não encontrado.');
   if(!objetoArrastavel(o))throw Error('Isso não se arrasta.');
   if(distBordas(t,o,raioObj(o))>ALCANCE_ARRASTO)throw Error('Chegue mais perto (até 1,5 m).');
   peso=pesoObjeto(o);alvo={tipo:'objeto',id:String(o.id),nome:String(o.nome||'objeto').replace(/^📜\s*/,''),raio:raioObj(o)};
  }
  const f=await infoForca(quem),cap=capacidade(f.FOR),fator=fatorArrasto(peso,cap);
  lista[quem]={alvo,peso:Math.round(peso),cap,fator,ajudantes:[],desde:Date.now(),mapId:String(mapa?.mapId||'')};
  await salvar(lista,`✋ ${nomeQuem} começa a arrastar ${alvo.nome} (${Math.round(peso)} kg)${fator>0?'':' — pesado demais: precisa de ajuda (🤝)'}.`);
  return fator>0?'Arrastando.':'Pesado demais sozinho: peça ajuda.';
 }
 async function salvar(lista,msg){
  estado={...estado,lista};await dep.setDoc(D(ARR),clean({lista,atualizadoEm:Date.now()}));
  if(msg)try{await dep.runTransaction(dep.db,async tx=>{const h=await tx.get(D(HIST)),hh=h.exists()?h.data():{entries:[],revision:0};tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'arr:'+Math.random().toString(36).slice(2),ts:Date.now(),actorUid:'',targetUid:'',message:msg}].slice(-120),revision:Number(hh.revision||0)+1}));});}catch(_){}
  desenhar();
 }
 // pedido: o mestre aplica na hora; o jogador grava um pedido
 async function pedir(cmd){
  if(ehMestre())return aplicar(cmd);
  await dep.setDoc(D(ARR+'/acoes/'+(crypto.randomUUID?.()||Date.now().toString(36))),clean({...cmd,donoUid:uid(),criadoEm:Date.now()}));
  return '⏳ Pedido enviado.';
 }
 const feitos=new Set();
 async function processar(id,cmd){
  if(feitos.has(id))return;feitos.add(id);
  try{const t=ctl()?.token?.(String(cmd.personagemId||''));if(!t||String(t.donoUid||'')!==String(cmd.donoUid||''))throw Error('Pedido de quem não controla o personagem.');
   if(Date.now()-Number(cmd.criadoEm||0)<60000)await aplicar(cmd);}
  catch(e){console.warn('[Arrastar] pedido recusado',e?.message||e);}
  finally{try{await dep.deleteDoc?.(D(ARR+'/acoes/'+id));}catch(_){}}
 }

 // ------------------------------------------------------------ mestre: a carga segue quem puxa
 const ultimo=new Map();let movendo=false;
 async function seguir(){
  if(!ehMestre()||movendo||win.mesaJogoPausadoV214?.())return;const lista=estado?.lista||{};if(!Object.keys(lista).length)return;
  movendo=true;
  try{
   const solta=[];
   for(const [pid,a] of Object.entries(lista)){
    const p=posicoes.get(pid);if(!p||String(p.mapaId||'')!==String(mapa?.mapId||'')){solta.push(pid);continue;}
    const sp=saude?.actors?.[pid]?.combateLab;if(sp?.morto||sp?.inconsciente){solta.push(pid);continue;}
    if(a.alvo.tipo==='token'&&(!tokenArrastavel(saude?.actors?.[a.alvo.id]?.combateLab,posicoes.get(a.alvo.id))||saude?.actors?.[a.alvo.id]?.repouso)){solta.push(pid);continue;} // entrou na cápsula/cama
    const chave=[p.x,p.y,p.facing].map(v=>Number(v).toFixed(3)).join(',');if(ultimo.get(pid)===chave)continue;ultimo.set(pid,chave);
    const P=M(p),fac=Number(p.facing)||0,dist=diam(p)/2+Number(a.alvo.raio||.5)+.15,atras=posicaoFrente(P,fac,dist),n=N(atras);
    if(a.alvo.tipo==='token'){
     const b=posicoes.get(a.alvo.id);if(!b){solta.push(pid);continue;}
     await dep.setDoc(D(POS+'/'+a.alvo.id),{x:Number(n.x.toFixed(3)),y:Number(n.y.toFixed(3)),revision:Number(b.revision||0)+1},{merge:true});
    }else{
     await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(SCENE)),c=s.exists()?s.data():null;if(!c)return;const i=(c.objects||[]).findIndex(o=>String(o.id)===a.alvo.id);if(i<0)return;
      const objects=[...c.objects];objects[i]={...objects[i],x:Number(n.x.toFixed(3)),y:Number(n.y.toFixed(3))};tx.set(D(SCENE),clean({...c,objects}));});
    }
    // ajudantes andam ao lado da carga
    (a.ajudantes||[]).forEach((hid,k)=>{const h=posicoes.get(hid);if(!h)return;const lado=k%2?-1:1,perp=fac+lado*Math.PI/2,q=N({x:atras.x+Math.cos(perp)*(Number(a.alvo.raio||.5)+diam(h)/2+.1),y:atras.y+Math.sin(perp)*(Number(a.alvo.raio||.5)+diam(h)/2+.1)});
     void dep.setDoc(D(POS+'/'+hid),{x:Number(q.x.toFixed(3)),y:Number(q.y.toFixed(3)),facing:Number(fac.toFixed(3)),revision:Number(h.revision||0)+1},{merge:true});});
   }
   if(solta.length){const nova={...lista};const nomes=solta.map(k=>nova[k]?.alvo?.nome).filter(Boolean);for(const k of solta)delete nova[k];await salvar(nova,nomes.length?`✋ Soltaram ${nomes.join(', ')}.`:'');}
  }catch(e){console.warn('[Arrastar]',e);}finally{movendo=false;}
 }

 // Prévia acompanha o movimento local, sem esperar a gravação da cena inteira.
 const cargasPrevistas=new Map();
 function preverCargas(){const ativos=new Set(Object.values(estado?.lista||{}).filter(a=>a.alvo?.tipo==='objeto').map(a=>a.alvo.id));for(const [id,node] of cargasPrevistas){if(ativos.has(id))continue;const o=(cena?.objects||[]).find(o=>String(o.id)===id);if(o&&node.isConnected){node.style.left=o.x/28*100+'%';node.style.top=o.y/14*100+'%';}cargasPrevistas.delete(id);}const b=root.getElementById('novaSyncBoard');if(!b)return;for(const [id,a] of Object.entries(estado?.lista||{})){if(a.alvo?.tipo!=='objeto')continue;const t=ctl()?.tokenVisual?.(id)||ctl()?.token?.(id);if(!t)continue;const node=[...b.querySelectorAll('[data-scene-object]')].find(n=>n.dataset.sceneObject===a.alvo.id);if(!node)continue;cargasPrevistas.set(a.alvo.id,node);const q=N(posicaoFrente(M(t),Number(t.facing)||0,diam(t)/2+Number(a.alvo.raio||.5)+.15));node.style.left=q.x/28*100+'%';node.style.top=q.y/14*100+'%';}}
 const previa=setInterval(preverCargas,80);
 // ------------------------------------------------------------ botões flutuantes (todos)
 const CSS=`#arCamada{position:absolute;inset:0;pointer-events:none;z-index:33}
#arCamada button{position:absolute;transform:translate(-50%,-160%);pointer-events:auto;height:26px;border-radius:999px;border:1px solid #ffd447;background:rgba(32,24,6,.92);color:#ffe9a8;font:600 12px 'Segoe UI',Arial,sans-serif;padding:0 10px;cursor:pointer;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.45)}
#arCamada button.ar-sol{border-color:#8ee7ff;background:rgba(8,22,36,.92);color:#cdf6ff}
#arCamada small{position:absolute;transform:translate(-50%,40%);color:#ffe9a8;font:600 11px 'Segoe UI',Arial,sans-serif;text-shadow:0 1px 3px #000;white-space:nowrap}`;
 if(!root.getElementById('arCss')){const s=root.createElement('style');s.id='arCss';s.textContent=CSS;root.head.append(s);}
 let camada=null,res='';
 function desenhar(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;
  if(!camada||camada.parentElement!==b){camada?.remove();camada=root.createElement('div');camada.id='arCamada';b.append(camada);
   camada.addEventListener('pointerdown',e=>e.stopPropagation());
   camada.addEventListener('click',async e=>{const bt=e.target.closest('button');if(!bt)return;e.stopPropagation();bt.disabled=true;
    try{res=String(await pedir(JSON.parse(bt.dataset.cmd))||'');}catch(err){res='⚠️ '+(err?.message||err);}setTimeout(()=>{res='';desenhar();},4000);desenhar();});}
  const c=ctl(),a=c?.ator?.(),lista=estado?.lista||{};let html='';
  const pct=p=>`left:${Number(p.x)/28*100}%;top:${Number(p.y)/14*100}%`;
  if(a&&(c?.controla?.(a)||ehMestre())){
   const meu=lista[a.id],ajudando=Object.entries(lista).find(([,v])=>(v.ajudantes||[]).includes(a.id));
   if(meu||ajudando){const v=meu||ajudando[1];html+=`<button type="button" class="ar-sol" style="${pct(a)}" data-cmd='${JSON.stringify({acao:'soltar',personagemId:a.id})}'>✋ Soltar ${esc(v.alvo?.nome||'')}</button>`;
    if(meu)html+=`<small style="${pct(a)}">${meu.fator>0?`🐢 ${Math.round(meu.fator*100)}% da velocidade · ${meu.peso} kg`:'⚠️ pesado demais: precisa de ajuda'}</small>`;}
   else{
    // personagens caídos por perto
    for(const t of c?.tokensNoMapa?.()||[]){if(t.id===a.id||!tokenArrastavel(saude?.actors?.[t.id]?.combateLab,t)||saude?.actors?.[t.id]?.repouso)continue;if(distBordas(a,t)>ALCANCE_ARRASTO)continue;
     const sendo=Object.values(lista).find(v=>v.alvo?.id===t.id);
     html+=`<button type="button" style="${pct(t)}" data-cmd='${JSON.stringify(sendo?{acao:'ajudar',personagemId:a.id,alvoId:t.id}:{acao:'arrastar',personagemId:a.id,alvoTipo:'token',alvoId:t.id})}'>${sendo?'🤝 Ajudar a arrastar':'✋ Arrastar '+esc(limpa(t.nome))}</button>`;}
    // objeto sendo arrastado por outro (ajudar)
    for(const [,v] of Object.entries(lista)){if(v.alvo?.tipo!=='objeto')continue;const o=(cena?.objects||[]).find(x=>String(x.id)===v.alvo.id);if(!o||distBordas(a,o,raioObj(o))>ALCANCE_ARRASTO)continue;
     html+=`<button type="button" style="${pct(o)}" data-cmd='${JSON.stringify({acao:'ajudar',personagemId:a.id,alvoId:o.id})}'>🤝 Ajudar a arrastar</button>`;}
   }
  }
  if(res&&a)html+=`<small style="${pct(a)};transform:translate(-50%,-260%)">${esc(res)}</small>`;
  if(camada.dataset.h!==html){camada.dataset.h=html;camada.innerHTML=html;}
 }
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 win.mesaArrastar={pedir,arrastavel:objetoArrastavel};

 // ------------------------------------------------------------ assinaturas
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(ARR),s=>{estado=s.exists()?s.data():{lista:{}};desenhar();},()=>{}));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;desenhar();},()=>{}));
  parar.push(dep.onSnapshot(D(SCENE),s=>{cena=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(dep.collection(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes'),q=>{const n=new Map();q.forEach(d=>n.set(d.id,{...d.data(),id:d.id}));posicoes=n;if(ehMestre())void seguir();desenhar();},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,'combatesAtivos','mesaArrastos','acoes'),q=>{q.forEach(d=>void processar(d.id,d.data()));},()=>{}));
 }
 let assinado='',voltas=0;
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}if(++voltas%2===0)desenhar();if(ehMestre()&&voltas%4===0)void seguir();}catch(e){console.warn('[Arrastar]',e);}},400);
 return {parar:()=>{clearInterval(vigia);clearInterval(previa);parar.forEach(f=>{try{f();}catch(_){}});camada?.remove();},pedir,aplicar};
}
