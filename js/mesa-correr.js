// Mesa Estelar v205 — 🏃 Correr: o personagem selecionado anda mais rápido e GASTA FADIGA (a barra azul da miniatura, do modo de vida simples).
//   correr = bastante fadiga por segundo · atacar = pouca (6 por ataque, já existente) · a fadiga volta com calma (3 a cada 5 s). Sem fôlego (fadiga ≤ 20%) a pessoa para de correr sozinha.
// Só o MESTRE escreve a fadiga (regra existente de mesaFadigaV200): com o mestre online (ou o próprio mestre controlando o personagem, como o Kael de teste) o gasto vale; num jogador sem mestre, ele corre mas a barra não desce.
// Dados puros em cima, tela embaixo. Módulo à parte: se falhar, o personagem anda como antes.
export const VELOCIDADE_CORRIDA=1.8,CUSTO_POR_SEGUNDO=6,LIMITE_SEM_FOLEGO=20,TICK_MS=500;
/** fator de velocidade de quem corre (1 se parado, sem fôlego ou sem correr) */
export const fatorDeCorrida=(correndo,fadigaPct)=>correndo&&fadigaPct>LIMITE_SEM_FOLEGO?VELOCIDADE_CORRIDA:1;
/** fadiga gasta num intervalo: só se correu de fato (deslocou-se) */
export const custoDoTick=(correndo,andouM,dtMs)=>correndo&&andouM>.15?+(CUSTO_POR_SEGUNDO*dtMs/1000).toFixed(2):0;
export function instalarCorrer(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const correndo=new Set(),ult=new Map();let botao=null;
 const meuId=()=>{try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?String(t.id):'';}catch(_){return '';}};
 const vs=()=>win.mesaModoSimplesV200;
 const pct=id=>{const f=vs()?.fadiga?.(id);return Number.isFinite(f)?f:100;};
 // o jogo pergunta a velocidade a cada passo (nova-direta.js)
 win.mesaCorrerVelocidadeV205=id=>fatorDeCorrida(correndo.has(String(id)),pct(String(id)));
 function alternar(){const id=meuId();if(!id)return;if(correndo.has(id))correndo.delete(id);else{if(pct(id)<=LIMITE_SEM_FOLEGO){aviso('😮‍💨 Sem fôlego: espere a fadiga voltar para correr.');return;}correndo.add(id);}desenhar();}
 let avisoEl=null;function aviso(t){try{if(!avisoEl){avisoEl=root.createElement('div');avisoEl.style.cssText='position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:10070;padding:8px 12px;border-radius:10px;background:#101a2c;color:#e8eefc;border:1px solid #8ee7ff;font:13px Segoe UI,Arial,sans-serif';root.body.append(avisoEl);}avisoEl.textContent=t;avisoEl.hidden=false;clearTimeout(avisoEl._t);avisoEl._t=setTimeout(()=>{avisoEl.hidden=true;},3500);}catch(_){}}
 function desenhar(){
  const id=meuId(),barra=root.getElementById('mbMais')?.parentElement;
  if(!botao){botao=root.createElement('button');botao.id='crBotao';botao.type='button';botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',alternar);
   const st=root.createElement('style');st.id='crCss';st.textContent='#crBotao{height:36px;padding:0 12px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:600 12px "Segoe UI",Arial,sans-serif;cursor:pointer;white-space:nowrap}#crBotao[aria-pressed=true]{background:#7a3a10;border-color:#ffb86b;color:#fff}#crBotao[hidden]{display:none}';root.head.append(st);}
  if(barra&&botao.parentElement!==barra)barra.insertBefore(botao,root.getElementById('mbMais'));else if(!barra&&!botao.parentElement)root.body.append(botao);
  const liga=!!id&&correndo.has(id),p=id?Math.round(pct(id)):100;
  botao.hidden=!id;botao.setAttribute('aria-pressed',String(liga));
  botao.textContent=(liga?'🏃 Correndo':'🏃 Correr')+(id?' · fadiga '+p+'%':'');
  botao.title='Correr: anda '+VELOCIDADE_CORRIDA+'× mais rápido e gasta bastante fadiga (barra azul da miniatura). Atacar gasta pouca. Sem fôlego, a pessoa para de correr.';
 }
 function tick(){
  desenhar();const c=ctl();if(!c)return;
  for(const id of [...correndo]){
   const t=c.token?.(id);if(!t){correndo.delete(id);continue;}
   const {W,H}=c.dimsAtual?.()||{W:28,H:14},p0=ult.get(id),agora=Date.now(),p={x:Number(t.x)*W/28,y:Number(t.y)*H/14};
   if(p0){const andou=Math.hypot(p.x-p0.x,p.y-p0.y),custo=custoDoTick(true,andou,agora-p0.t);if(custo>0)try{vs()?.gastar?.(id,custo);}catch(_){}}
   ult.set(id,{...p,t:agora});
   if(pct(id)<=LIMITE_SEM_FOLEGO){correndo.delete(id);ult.delete(id);aviso('😮‍💨 Sem fôlego: parou de correr.');}
  }
  for(const k of [...ult.keys()])if(!correndo.has(k))ult.delete(k);
 }
 const iv=setInterval(()=>{try{tick();}catch(e){console.warn('[Correr]',e);}},TICK_MS);iv.unref?.();
 const api={alternar,correndo:id=>correndo.has(String(id)),tick,parar:()=>{clearInterval(iv);botao?.remove();}};win.mesaCorrerV205=api;return api;
}
