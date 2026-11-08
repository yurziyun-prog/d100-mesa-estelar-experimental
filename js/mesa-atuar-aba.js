// “Atuar como”: abre a visão do personagem no gesto de seleção.
// A aba original volta a Mestre; se pop-ups forem bloqueados, há um link real.
export const idParaAba=v=>{const s=String(v||'');return !s||s==='__mestre__'||s==='__automatico__'?'':s;};
export function urlParaAba(href,id){
 const personagem=idParaAba(id);if(!personagem)return '';
 const u=new URL(href);u.search='';u.searchParams.set('verComo',encodeURIComponent(personagem));return u.toString();
}
export function instalarAtuarAba(dep){
 const root=dep.root||document,win=root.defaultView||window;
 win.mesaAtuarAbaV205?.destruir?.();
 let ultimo={id:'',t:0},ligado=true,alvo='',nome='',volta=null,destruido=false;
 const off=()=>{try{return win.localStorage?.getItem('mesa:atuarAbaOff')==='1';}catch(_){return false;}};
 const mestre=()=>!!dep.ehMestre?.()&&!win.mesaModoJogadorV138_&&!win.mesaDiretorV206_;
 const seletor=()=>root.getElementById('novaSyncPersonagem');
 const aviso=t=>{
  let e=root.getElementById('aaAviso');if(!e){e=root.createElement('div');e.id='aaAviso';e.setAttribute('role','status');e.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:10070;max-width:min(560px,92vw);padding:10px 14px;border-radius:12px;background:#101a2c;color:#e8eefc;border:1px solid #ffb86b;font:13px Segoe UI,Arial,sans-serif';root.body.append(e);}e.textContent=t;
 };
 function voltarAoMestre(){
  clearTimeout(volta);volta=setTimeout(()=>{
   if(destruido||!mestre())return;
   const s=seletor();if(!s||![...s.options].some(o=>o.value==='__mestre__'))return;
   s.value='__mestre__';s.dispatchEvent(new win.Event('change',{bubbles:true}));sincronizar();
  },0);
 }
 function sincronizar(){
  const sel=seletor();if(!sel)return;
  root.body.dataset.atuando=(sel.value==='__mestre__'&&!win.mesaModoJogadorV138_&&!win.mesaDiretorV206_)?'mestre':'personagem';
  let link=root.getElementById('aaAbrirVisao');
  if(!link){link=root.createElement('a');link.id='aaAbrirVisao';link.target='_blank';link.rel='noopener';link.style.cssText='font:12px Segoe UI,Arial,sans-serif;color:#b5ddff;margin:4px 6px;display:inline-flex;max-width:100%;white-space:normal';sel.insertAdjacentElement('afterend',link);
   link.addEventListener('click',()=>{if(!mestre()||!ligado||off())return;ultimo={id:alvo,t:Date.now()};voltarAoMestre();root.getElementById('aaAviso')?.remove();});}
  const barra=root.getElementById('mbBarra');if(barra&&link.parentElement!==barra)barra.append(link);
  const atual=idParaAba(sel.value);if(atual&&atual!==alvo){alvo=atual;nome=sel.selectedOptions?.[0]?.textContent||atual;}
  const visivel=mestre()&&ligado&&!off()&&!!alvo;link.hidden=!visivel;link.style.display=visivel?'inline-flex':'none';
  if(visivel){link.href=urlParaAba(win.location.href,alvo);link.textContent='🎮 Abrir visão de '+(nome||alvo);link.title='Abre em outra aba, com a visão do personagem. Esta aba fica como Mestre.';}
 }
 function abrir(id){
  if(!mestre())return false;
  const personagem=idParaAba(id);if(!personagem)return false;
  alvo=personagem;const sel=seletor();nome=[...sel?.options||[]].find(o=>o.value===alvo)?.textContent||alvo;sincronizar();
  let w=null;
  try{w=win.open(urlParaAba(win.location.href,alvo),'_blank');if(w)w.opener=null;}catch(_){/* link de recuperação continua disponível */}
  voltarAoMestre();
  if(w)root.getElementById('aaAviso')?.remove();
  else aviso('O navegador não confirmou a abertura da aba. Use “Abrir visão de '+nome+'”, junto de “Atuar como”. Esta aba permanece como Mestre.');
  return !!w;
 }
 function selecionar(e){
  if(!ligado||off()||!mestre()||(!e.isTrusted&&!win.__TESTE_ATUAR_ABA)||e.target?.id!=='novaSyncPersonagem')return;
  const id=idParaAba(e.target.value);if(!id)return;
  if(ultimo.id===id&&Date.now()-ultimo.t<1000){voltarAoMestre();return;}
  ultimo={id,t:Date.now()};abrir(id);
 }
 // Abrir só no evento confiável, nunca no polling: um temporizador pode perder
 // a ativação do usuário e transformar uma atualização automática em pop-up.
 root.addEventListener('change',selecionar,true);
 if(!root.getElementById('aaCss')){const st=root.createElement('style');st.id='aaCss';st.textContent='body[data-atuando="mestre"] #crBotao,body[data-atuando="mestre"] #maLegenda,body[data-atuando="mestre"] #maRapido,body[data-atuando="mestre"] #pedBotao{display:none!important}';root.head.append(st);}
 const iv=setInterval(sincronizar,400);iv.unref?.();sincronizar();
 const api={abrir,escolher:id=>{if(!ligado||off()||!mestre()||!idParaAba(id))return false;ultimo={id:String(id),t:Date.now()};abrir(id);return true;},ligar:()=>{ligado=true;sincronizar();},desligar:()=>{ligado=false;sincronizar();},destruir:()=>{destruido=true;clearInterval(iv);clearTimeout(volta);root.removeEventListener('change',selecionar,true);root.getElementById('aaAbrirVisao')?.remove();root.getElementById('aaAviso')?.remove();}};
 win.mesaAtuarAbaV205=api;return api;
}
