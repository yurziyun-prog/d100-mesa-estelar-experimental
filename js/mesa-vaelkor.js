// Mesa Estelar v145 — A Casa Vaelkor na mesa.
// • Retratos, brasões e estandartes de Lord Anthorion Vaelkor desenhados por cima dos objetos do mapa
//   (marca arteVaelkorV145, ou nome com “Vaelkor” + retrato/quadro/brasão/estandarte). Perto deles: “🖼️ Ver de perto”.
// • Carteira: os recursos da ficha viram créditos Vaelkor — cédulas e moedas com o brasão (e o rosto dele na nota de 1000).
//   Quando o personagem ganha dinheiro, aparece a moeda/cédula recebida.
// • Convite de Lord Vaelkor: o mestre entrega na hora ou sorteia um momento da sessão. Um drone chega, projeta o
//   holograma dele e entrega o convite (vai para a mochila de cada personagem do grupo).

import {ARTE_VAELKOR as ARTE,DENOMINACOES,trocar} from './mesa-vaelkor-arte.js?v=145';

export const CONVITE='combatesAtivos/mesaConviteVaelkor',CONVITE_ID='convite_vaelkor',ALCANCE_ARTE=3.2;
export const TEXTO_CONVITE=`A Casa Vaelkor saúda Qozae e seus companheiros.

Chegou ao meu conhecimento o que fizeram em Véspera — e o nome da vossa família não me é estranho.

Lord Anthorion Vaelkor, Senhor da Casa Vaelkor, tem a honra de convidá-los para um banquete em seu castelo, ao norte, além do Deserto dos Meteoros, ao pé das montanhas. Daqui a sete dias.

Venham como hóspedes. Haverá mesa farta, conversa digna e, quem sabe, as respostas que procuram.

Este convite garante passagem segura pelas terras da Casa.`;

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const prop=(o,k)=>o?.[k]??o?.oficinaElement?.[k];
const fmt=n=>Number(n||0).toLocaleString('pt-BR');

// Que arte vai num objeto (ou null).
export function tipoArte(o){
 if(!o||o.destruido)return null;const m=prop(o,'arteVaelkorV145');if(m)return String(m);
 const n=sem(o.nome);if(!/vaelkor/.test(n))return null;
 if(/retrato|quadro|pintura/.test(n))return 'retrato';if(/estandarte|bandeira/.test(n))return 'estandarte';if(/brasao|selo|emblema/.test(n))return 'brasao';
 if(/estatua/.test(n))return 'estatua';return null;
}
// Sorteia um momento entre min e max minutos a partir de agora.
export function sortearQuando(agora,min,max,r=Math.random()){const a=Math.max(1,Number(min)||1),b=Math.max(a,Number(max)||a);return agora+Math.round((a+(b-a)*r)*60000);}
// Põe um item no inventário (mochila → bolso → equipado), sem duplicar.
export function guardarNoInventario(inv,item){
 inv=JSON.parse(JSON.stringify(inv||{}));
 if(['equipado','bolso','mochila'].some(k=>(inv[k]||[]).some(i=>i&&String(i.idBanco||i.id||'')===String(item.id))))return {inv,ok:true,ja:true};
 for(const k of ['mochila','bolso','equipado']){const l=inv[k]=Array.isArray(inv[k])?inv[k]:[];const tam={equipado:12,mochila:20,bolso:2}[k];let i=l.findIndex(x=>!x);if(i<0&&l.length<tam)i=l.length;
  if(i>=0){l[i]={...item,idBanco:String(item.id),instanciaId:`convite_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,pvAtual:Number(item.pv||1)};return {inv,ok:true};}}
 return {inv,ok:false};
}

export function instalarVaelkor(dep){
 const win=dep.window||globalThis.window,root=win?.document;if(!root||win.mesaVaelkorV145_)return;
 const D=p=>dep.doc(dep.db,p);
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const el=id=>root.getElementById(id);
 const dims=()=>{try{return ctl()?.dimsAtual?.()||{W:28,H:14};}catch(_){return {W:28,H:14};}};
 const dist=(a,b)=>{const {W,H}=dims();return Math.hypot((a.x-b.x)*W/28,(a.y-b.y)*H/14);};
 function ator(){try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 const meuId=()=>{try{return String(dep.personagemId?.()||'');}catch(_){return '';}};

 const ESTILO=`.vkArte{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block}
.vkArte.vk-retrato{object-fit:cover;box-sizing:border-box;border:2px solid #c9a85a;box-shadow:0 0 0 1px #2a1a0a,0 3px 8px #000a;border-radius:2px}
.vkArte.vk-brasao{object-fit:contain;border-radius:50%;filter:drop-shadow(0 2px 3px #000a)}
.vkArte.vk-estandarte{object-fit:contain;padding:12% 8% 22%;box-sizing:border-box;background:linear-gradient(#5a121c,#3a0a12);clip-path:polygon(0 0,100% 0,100% 82%,50% 100%,0 82%)}
#vkVer{position:absolute;z-index:34;transform:translate(-50%,-160%);height:28px;padding:0 10px;border-radius:999px;border:1px solid #c9a85a;background:rgba(32,26,10,.94);color:#ffe9b8;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;white-space:nowrap}
#vkCarteira,#vkMestre{position:absolute;left:8px;bottom:74px;z-index:31;height:30px;min-width:30px;padding:0 9px;border-radius:999px;border:1px solid #c9a85a;background:rgba(32,26,10,.92);color:#ffe9b8;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;display:flex;align-items:center;gap:5px}
#vkCarteira img{width:18px;height:18px;border-radius:50%}
.vkPop{position:fixed;z-index:9996;width:min(330px,calc(100vw - 24px));max-height:calc(100vh - 40px);overflow:auto;background:#17120a;border:1px solid #c9a85a;border-radius:12px;padding:10px 12px;color:#f3e6c8;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 30px #000c}
.vkPop h4{margin:0 0 8px;display:flex;gap:8px;align-items:center;font-size:14px}.vkPop h4 span{flex:1}
.vkPop h4 button{width:24px;height:24px;border-radius:7px;border:1px solid #5a4a2a;background:#2a2010;color:#fff;cursor:pointer;padding:0}
.vkLinha{display:flex;align-items:center;gap:8px;margin:5px 0}.vkLinha img{width:38px;height:38px;object-fit:contain}.vkLinha img.nota{width:72px;height:36px;object-fit:cover;border-radius:3px}
.vkLinha b{min-width:30px;text-align:right}.vkInfo{color:#c9b48a;font-size:12px;margin:6px 0}
.vkB{display:block;width:100%;margin:5px 0;min-height:30px;padding:4px 10px;border-radius:9px;border:1px solid #5a4a2a;background:rgba(255,255,255,.05);color:#f3e6c8;cursor:pointer;font:inherit;text-align:left}
.vkB:disabled{opacity:.45;cursor:not-allowed}.vkPop textarea{width:100%;box-sizing:border-box;min-height:150px;background:#0e0b06;color:#f3e6c8;border:1px solid #5a4a2a;border-radius:8px;font:12px/1.4 Georgia,serif;padding:6px}
.vkPop input[type=number]{width:52px;background:#0e0b06;color:#f3e6c8;border:1px solid #5a4a2a;border-radius:6px;padding:2px 4px}
#vkToast{position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:10040;display:flex;align-items:center;gap:10px;padding:8px 14px 8px 8px;border-radius:14px;border:1px solid #c9a85a;background:rgba(23,18,10,.96);color:#ffe9b8;font:600 14px 'Segoe UI',Arial,sans-serif;pointer-events:none;box-shadow:0 8px 24px #000b;animation:vkEntra .35s ease-out}
#vkToast img{height:46px;max-width:96px;object-fit:contain;border-radius:4px}
@keyframes vkEntra{from{opacity:0;transform:translate(-50%,-14px)}to{opacity:1;transform:translate(-50%,0)}}
#vkFoto{position:fixed;inset:0;z-index:10050;background:rgba(5,4,2,.88);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:16px;box-sizing:border-box;cursor:zoom-out}
#vkFoto img{max-width:min(92vw,560px);max-height:78vh;object-fit:contain;border:3px solid #c9a85a;border-radius:4px;box-shadow:0 10px 40px #000}
#vkFoto img.redondo{border-radius:50%;border:none;max-width:min(70vw,360px)}
#vkFoto div{color:#f3e6c8;font:15px Georgia,serif;text-align:center;max-width:560px}
#vkCena{position:fixed;inset:0;z-index:10060;background:radial-gradient(circle at 50% 45%,rgba(10,30,40,.86),rgba(2,4,8,.96));display:flex;align-items:center;justify-content:center;overflow:hidden;padding:16px;box-sizing:border-box}
#vkCena .drone{position:absolute;font-size:54px;left:110%;top:18%;filter:drop-shadow(0 0 12px #6ff);animation:vkDrone 2.2s ease-out forwards}
@keyframes vkDrone{to{left:calc(50% - 27px);top:6%}}
#vkCena .feixe{position:absolute;left:50%;top:calc(6% + 50px);width:0;height:0;border-left:150px solid transparent;border-right:150px solid transparent;border-top:0 solid rgba(120,240,255,.16);transform:translateX(-50%);opacity:0;animation:vkFeixe .6s 2.1s forwards}
@keyframes vkFeixe{to{opacity:1;border-top-width:360px}}
#vkCena .holo{position:relative;opacity:0;animation:vkHolo .9s 2.4s forwards}
#vkCena .holo img{display:block;width:min(64vw,300px);filter:grayscale(.3) sepia(1) hue-rotate(150deg) saturate(2.6) brightness(1.15);opacity:.85;mix-blend-mode:screen;animation:vkPisca 3.2s 3.3s infinite}
#vkCena .holo::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(120,240,255,.12) 0 2px,transparent 2px 5px);pointer-events:none}
#vkCena .holo p{margin:8px 0 0;color:#9ff;font:italic 14px Georgia,serif;text-align:center;text-shadow:0 0 8px #3cf}
@keyframes vkHolo{from{opacity:0;transform:scaleY(.05)}to{opacity:1;transform:scaleY(1)}}
@keyframes vkPisca{0%,100%{opacity:.85}47%{opacity:.85}48%{opacity:.45}50%{opacity:.9}52%{opacity:.6}53%{opacity:.85}}
#vkCena .carta{display:none;position:relative;width:min(520px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;background:linear-gradient(#21160c,#140d06);border:2px solid #c9a85a;border-radius:10px;padding:18px 20px;box-sizing:border-box;color:#f3e6c8;font:15px/1.55 Georgia,serif;box-shadow:0 0 50px #000;animation:vkEntra .5s ease-out}
#vkCena.carta-on .carta{display:block}#vkCena.carta-on .holo,#vkCena.carta-on .drone,#vkCena.carta-on .feixe{display:none}
#vkCena .carta img.brasao{display:block;width:84px;height:84px;margin:0 auto 6px}
#vkCena .carta h3{margin:0 0 10px;text-align:center;color:#e9c97a;font:600 17px Georgia,serif;letter-spacing:.06em}
#vkCena .carta .txt{white-space:pre-wrap}#vkCena .carta .ass{margin-top:12px;text-align:right;font-style:italic;color:#e9c97a}
#vkCena .carta button,#vkCena .pular{margin-top:14px;min-height:34px;padding:4px 14px;border-radius:9px;border:1px solid #c9a85a;background:#2a2010;color:#ffe9b8;cursor:pointer;font:600 13px 'Segoe UI',Arial,sans-serif}
#vkCena .pular{position:absolute;right:16px;bottom:16px;margin:0}`;
 if(!el('vkCss')){const st=root.createElement('style');st.id='vkCss';st.textContent=ESTILO;root.head.append(st);}

 // ------------------------------------------------------------------ arte no mapa
 const IMG={retrato:ARTE.retrato,brasao:ARTE.ouro,estandarte:ARTE.ouro};
 function objetos(){try{return ctl()?.cenaAtual?.()?.objects||[];}catch(_){return [];}}
 function pintar(){
  const b=el('novaSyncBoard');if(!b)return;
  for(const o of objetos()){const t=tipoArte(o);if(!t||t==='estatua')continue;
   const node=b.querySelector(`[data-scene-object="${CSS.escape(String(o.id))}"]`);if(!node||node.querySelector('.vkArte'))continue;
   const img=root.createElement('img');img.className='vkArte vk-'+t;img.alt=o.nome||'';img.src=IMG[t]||ARTE.ouro;img.draggable=false;if(t!=='retrato')for(const c of node.children)c.style.visibility='hidden';node.style.background='transparent';node.append(img);}
 }
 let botaoVer=null,alvoVer=null;
 function desenharVer(){
  const b=el('novaSyncBoard'),a=ator();let melhor=null,md=1e9;
  if(b&&a){for(const o of objetos()){const t=tipoArte(o);if(!t)continue;const d=dist(a,o);if(d<=ALCANCE_ARTE&&d<md){md=d;melhor={o,t};}}}
  if(!melhor){botaoVer?.remove();botaoVer=null;alvoVer=null;return;}
  if(!botaoVer||botaoVer.parentElement!==b){botaoVer?.remove();botaoVer=root.createElement('button');botaoVer.type='button';botaoVer.id='vkVer';botaoVer.addEventListener('pointerdown',e=>e.stopPropagation());botaoVer.addEventListener('click',()=>alvoVer&&verDePerto(alvoVer));b.append(botaoVer);}
  alvoVer=melhor;const txt=melhor.t==='retrato'?'🖼️ Ver o retrato':melhor.t==='estatua'?'🗿 Ver a estátua':'🛡️ Ver o brasão';
  if(botaoVer.textContent!==txt)botaoVer.textContent=txt;botaoVer.title=melhor.o.nome||'';botaoVer.style.left=Number(melhor.o.x)/28*100+'%';botaoVer.style.top=Number(melhor.o.y)/14*100+'%';
 }
 function foto(src,legenda,redondo=false){
  el('vkFoto')?.remove();const f=root.createElement('div');f.id='vkFoto';f.title='Fechar';
  f.innerHTML=`<img src="${src}" alt="" class="${redondo?'redondo':''}"><div>${legenda}</div>`;f.addEventListener('click',()=>f.remove());root.body.append(f);
 }
 function verDePerto({o,t}){
  if(t==='retrato')foto(ARTE.retrato,'<b>Lord Anthorion Vaelkor</b><br><small>Senhor da Casa Vaelkor · retrato oficial da Casa, presente em toda a Cidade Superior</small>');
  else if(t==='estatua')foto(ARTE.retrato,`<b>${esc(o.nome)}</b><br><small>Em mármore escuro, Lord Anthorion Vaelkor sentado, com os ancestrais da Casa em volta. Aos pés, o brasão da estrela de oito pontas.</small>`);
  else foto(ARTE.ouro,'<b>Brasão da Casa Vaelkor</b><br><small>A estrela de oito pontas — o mesmo selo das moedas e cédulas do Domínio Vaelkor.</small>',true);
 }

 // ------------------------------------------------------------------ carteira (créditos Vaelkor)
 let carteira=null,popCarteira=null,saldo=null,saldoDe='',cancelarSaldo=null;
 function assinarSaldo(){
  const id=ehMestre()?'':meuId();if(id===saldoDe)return;saldoDe=id;saldo=null;try{cancelarSaldo?.();}catch(_){}cancelarSaldo=null;
  if(!id||!dep.onSnapshot)return;
  cancelarSaldo=dep.onSnapshot(D('personagens/'+id),s=>{if(saldoDe!==id)return;const v=Number(s.exists()?s.data().recursos||0:0);const antes=saldo;saldo=v;if(antes!==null&&v>antes)ganhou(v-antes);desenharCarteira(true);},e=>console.warn('[Vaelkor] carteira',e));
 }
 function imgDe(d){return ARTE[d.id]||ARTE.ouro;}
 function ganhou(qtd){
  const pecas=trocar(qtd),maior=pecas[0];if(!maior)return;el('vkToast')?.remove();
  const t=root.createElement('div');t.id='vkToast';t.innerHTML=`<img src="${imgDe(maior)}" alt=""><span>+${fmt(qtd)} créditos Vaelkor</span>`;root.body.append(t);
  setTimeout(()=>{t.style.transition='opacity .6s';t.style.opacity='0';},3400);setTimeout(()=>t.remove(),4100);
 }
 function desenharCarteira(forcar=false){
  const b=el('novaSyncBoard');
  if(!b||ehMestre()||!meuId()){carteira?.remove();carteira=null;return;}
  if(!carteira||!carteira.isConnected){carteira?.remove();carteira=root.createElement('button');carteira.type='button';carteira.id='vkCarteira';carteira.addEventListener('pointerdown',e=>e.stopPropagation());carteira.addEventListener('click',abrirCarteira);b.append(carteira);forcar=true;}
  const txt=saldo===null?'…':fmt(saldo);if(forcar||carteira.dataset.v!==txt){carteira.dataset.v=txt;carteira.innerHTML=`<img src="${ARTE.ouro}" alt=""><span>${txt}</span>`;carteira.title=`Carteira: ${txt} créditos Vaelkor (os recursos da ficha)`;}
  if(popCarteira&&!popCarteira.hidden&&forcar)preencherCarteira();
 }
 function abrirCarteira(){
  if(!popCarteira){popCarteira=root.createElement('div');popCarteira.className='vkPop';popCarteira.id='vkPopCarteira';popCarteira.hidden=true;root.body.append(popCarteira);
   popCarteira.addEventListener('pointerdown',e=>e.stopPropagation());popCarteira.addEventListener('click',e=>{const x=e.target.closest('button');if(!x)return;if(x.dataset.x!==undefined)popCarteira.hidden=true;if(x.dataset.ver==='nota')foto(ARTE.nota1000,'<b>Nota de 1000 créditos Vaelkor</b><br><small>Polímero reforçado com fio metálico. O rosto de Lord Anthorion Vaelkor e o castelo da Casa.</small>');if(x.dataset.convite!==undefined){popCarteira.hidden=true;mostrarConvite(convite||{},{soCarta:true});}});}
  if(!popCarteira.hidden){popCarteira.hidden=true;return;}
  popCarteira.hidden=false;preencherCarteira();const r=carteira?.getBoundingClientRect();
  if(r){popCarteira.style.left=Math.max(8,Math.min(win.innerWidth-342,r.left))+'px';popCarteira.style.top=Math.max(8,Math.min(win.innerHeight-420,r.top-330))+'px';}
 }
 function preencherCarteira(){
  const pecas=trocar(saldo||0);
  let h=`<h4><img src="${ARTE.ouro}" alt="" style="width:22px;height:22px"><span>Carteira · ${fmt(saldo||0)} créditos Vaelkor</span><button type="button" data-x title="Fechar">✕</button></h4>`;
  h+=pecas.length?pecas.map(d=>`<div class="vkLinha"><b>${d.n}×</b><img src="${imgDe(d)}" alt="" class="${d.tipo==='nota'?'nota':''}"><span>${esc(d.nome)}</span></div>`).join(''):'<div class="vkInfo">Bolsos vazios.</div>';
  h+=`<div class="vkInfo">Moeda oficial do Domínio Vaelkor: o brasão da Casa em todas as peças; o rosto de Lord Vaelkor na cédula de 1000.</div><button type="button" class="vkB" data-ver="nota">🔍 Ver a cédula de 1000</button>`;
  if(convite?.estado==='entregue'&&(convite.destinatarios||[]).some(d=>String(d.id)===meuId()))h+=`<button type="button" class="vkB" data-convite>✉️ Reler o convite de Lord Vaelkor</button>`;
  popCarteira.innerHTML=h;
 }

 // ------------------------------------------------------------------ convite de Lord Vaelkor
 let convite=null,botaoMestre=null,popMestre=null,ocupado=false,aviso='';
 if(dep.onSnapshot)dep.onSnapshot(D(CONVITE),s=>{convite=s.exists()?s.data():null;aoMudarConvite();},e=>console.warn('[Vaelkor] convite',e));
 const chaveVisto=c=>'mesa:conviteVaelkor:'+String(c?.entregueEm||'');
 function jaViu(c){try{return win.localStorage?.getItem(chaveVisto(c))==='1';}catch(_){return false;}}
 function marcarVisto(c){try{win.localStorage?.setItem(chaveVisto(c),'1');}catch(_){}}
 function aoMudarConvite(){
  const c=convite;if(popMestre&&!popMestre.hidden)preencherMestre();
  if(c?.estado!=='entregue'||!c.entregueEm||jaViu(c))return;
  const meu=meuId(),pra=ehMestre()||!(c.destinatarios||[]).length||(c.destinatarios||[]).some(d=>String(d.id)===meu);
  if(pra&&Date.now()-Number(c.entregueEm)<6*3600e3)mostrarConvite(c);else marcarVisto(c);
 }
 function mostrarConvite(c,{soCarta=false}={}){
  el('vkCena')?.remove();const cena=root.createElement('div');cena.id='vkCena';if(soCarta)cena.classList.add('carta-on');
  const texto=String(c.texto||TEXTO_CONVITE);
  cena.innerHTML=`<div class="drone" aria-hidden="true">🛸</div><div class="feixe" aria-hidden="true"></div>
<div class="holo"><img src="${ARTE.busto}" alt="Holograma de Lord Anthorion Vaelkor"><p>— Uma mensagem da Casa Vaelkor…</p></div>
<div class="carta" role="dialog" aria-label="Convite de Lord Anthorion Vaelkor"><img class="brasao" src="${ARTE.ouro}" alt=""><h3>CONVITE DA CASA VAELKOR</h3><div class="txt">${esc(texto)}</div><div class="ass">— Anthorion Vaelkor<br><small>Senhor da Casa Vaelkor</small></div><div style="text-align:center"><button type="button" data-fechar>📜 Guardar o convite</button></div></div>
<button type="button" class="pular" data-pular>Ler o convite ⏭</button>`;
  root.body.append(cena);const mostrarCarta=()=>{cena.classList.add('carta-on');cena.querySelector('[data-pular]')?.remove();};
  if(soCarta)cena.querySelector('[data-pular]')?.remove();else setTimeout(mostrarCarta,7600);
  cena.addEventListener('pointerdown',e=>e.stopPropagation());
  cena.addEventListener('click',e=>{const x=e.target.closest('button');if(!x)return;if(x.dataset.pular!==undefined)mostrarCarta();if(x.dataset.fechar!==undefined){marcarVisto(c);cena.remove();}});
 }
 const grupo=()=>{const m=String(dep.uid?.()||'');return (ctl()?.todosTokens?.()||[]).filter(t=>{const id=decodeURIComponent(String(t.id||''));return !id.startsWith('sync')&&t.nome!==undefined&&(String(t.donoUid||'')!==m||id==='teste_jogador_v138');});};
 function itemConvite(texto){return {id:CONVITE_ID,nome:'Convite de Lord Anthorion Vaelkor',nome_en:'Invitation from Lord Anthorion Vaelkor',categoria:'Documento',peso:0,preco:0,pa:0,pv:1,qualidade:'Excelente',disponivelCampanha:false,material:'Papel',imagem:ARTE.ouro,
  descricao:String(texto||TEXTO_CONVITE).replace(/\s*\n\s*/g,' ').slice(0,900)+' — Anthorion Vaelkor, Senhor da Casa Vaelkor.'};}
 async function entregar(){
  if(!ehMestre()||ocupado)return;ocupado=true;aviso='Entregando…';preencherMestre();
  try{
   const texto=String(convite?.texto||TEXTO_CONVITE),it=itemConvite(texto),toks=grupo(),dest=[],falhas=[];
   try{await dep.setDoc(D('itens/'+CONVITE_ID),JSON.parse(JSON.stringify(it)),{merge:true});}catch(e){console.warn('[Vaelkor] item',e);}
   for(const t of toks){const id=decodeURIComponent(String(t.id));
    try{let ok=false;await dep.runTransaction(dep.db,async tx=>{const r=D('personagens/'+id),s=await tx.get(r);if(!s.exists())return;const g=guardarNoInventario(s.data().inventario,it);ok=g.ok;if(g.ok&&!g.ja)tx.set(r,{inventario:g.inv},{merge:true});});
     if(ok)dest.push({id,nome:String(t.nome||id)});else falhas.push(String(t.nome||id));}catch(e){console.warn('[Vaelkor] convite para',id,e);falhas.push(String(t.nome||id));}}
   await dep.setDoc(D(CONVITE),{estado:'entregue',entregueEm:Date.now(),texto,destinatarios:dest,quando:null},{merge:true});
   aviso=`Entregue a ${dest.length} personagem(ns)${dest.length?': '+dest.map(d=>d.nome).join(', '):''}.${falhas.length?' Sem espaço/erro: '+falhas.join(', ')+'.':''}`;
  }catch(e){console.warn('[Vaelkor] entregar',e);aviso='Não deu para entregar: '+(e?.message||e);}
  ocupado=false;preencherMestre();
 }
 async function salvarConvite(dados){try{await dep.setDoc(D(CONVITE),dados,{merge:true});}catch(e){aviso='Erro: '+(e?.message||e);preencherMestre();}}
 function desenharMestre(){
  const b=el('novaSyncBoard');if(!b||!ehMestre()){botaoMestre?.remove();botaoMestre=null;return;}
  if(!botaoMestre||!botaoMestre.isConnected){botaoMestre?.remove();botaoMestre=root.createElement('button');botaoMestre.type='button';botaoMestre.id='vkMestre';botaoMestre.addEventListener('pointerdown',e=>e.stopPropagation());botaoMestre.addEventListener('click',abrirMestre);b.append(botaoMestre);}
  const ag=convite?.estado==='agendado',txt=ag?'✉️⏳':'✉️';if(botaoMestre.textContent!==txt)botaoMestre.textContent=txt;
  botaoMestre.title=ag?'Convite de Lord Vaelkor: sorteado, chega sozinho durante a sessão':convite?.estado==='entregue'?'Convite de Lord Vaelkor: já entregue':'Convite de Lord Vaelkor (mestre)';
 }
 function abrirMestre(){
  if(!popMestre){popMestre=root.createElement('div');popMestre.className='vkPop';popMestre.hidden=true;root.body.append(popMestre);popMestre.addEventListener('pointerdown',e=>e.stopPropagation());popMestre.addEventListener('click',aoClicarMestre);}
  if(!popMestre.hidden){popMestre.hidden=true;return;}
  popMestre.hidden=false;popMestre.dataset.h='';preencherMestre();const r=botaoMestre?.getBoundingClientRect();
  if(r){popMestre.style.left=Math.max(8,Math.min(win.innerWidth-342,r.left))+'px';popMestre.style.top=Math.max(8,Math.min(win.innerHeight-480,r.top-440))+'px';}
 }
 function preencherMestre(){
  if(!popMestre||popMestre.hidden)return;const c=convite||{},ta=popMestre.querySelector('textarea'),rascunho=ta?ta.value:null;
  let st='Ainda não entregue.';if(c.estado==='agendado')st=`🎲 Sorteado: chega sozinho por volta das ${new Date(Number(c.quando)).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} (só você vê a hora). Se a sessão for acabar antes, entregue agora.`;
  if(c.estado==='entregue')st=`✅ Entregue às ${new Date(Number(c.entregueEm)).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} para ${(c.destinatarios||[]).map(d=>esc(d.nome)).join(', ')||'—'}.`;
  const h=`<h4><img src="${ARTE.ouro}" alt="" style="width:22px;height:22px"><span>Convite de Lord Vaelkor</span><button type="button" data-x title="Fechar">✕</button></h4>
<div class="vkInfo">Um drone chega, projeta o holograma de Vaelkor e entrega o convite. Vai para a mochila de cada personagem do grupo. Pode editar o texto:</div>
<textarea data-texto>${esc(c.texto||TEXTO_CONVITE)}</textarea>
<button type="button" class="vkB" data-a="agora" ${ocupado?'disabled':''}>📨 Entregar agora</button>
<div class="vkLinha" style="flex-wrap:wrap"><button type="button" class="vkB" data-a="sortear" style="width:auto;flex:1" ${ocupado?'disabled':''}>🎲 Sortear um momento</button> entre <input type="number" data-min value="${Number(c.janelaMin?.[0]||30)}" min="1"> e <input type="number" data-max value="${Number(c.janelaMin?.[1]||150)}" min="1"> min</div>
${c.estado==='agendado'?'<button type="button" class="vkB" data-a="cancelar">✖ Cancelar o sorteio</button>':''}
<button type="button" class="vkB" data-a="ver">👁️ Ver como os jogadores veem</button>
<div class="vkInfo">${st}</div>${aviso?`<div class="vkInfo">${esc(aviso)}</div>`:''}`;
  if(popMestre.dataset.h!==h){popMestre.innerHTML=h;popMestre.dataset.h=h;if(rascunho!==null){const t2=popMestre.querySelector('textarea');if(t2)t2.value=rascunho;}}
 }
 async function aoClicarMestre(ev){
  const x=ev.target.closest('button');if(!x)return;if(x.dataset.x!==undefined){popMestre.hidden=true;return;}
  const texto=String(popMestre.querySelector('[data-texto]')?.value||TEXTO_CONVITE),a=x.dataset.a;
  if(a==='ver'){mostrarConvite({texto,entregueEm:0});return;}
  if(a==='agora'){await salvarConvite({texto});convite={...(convite||{}),texto};await entregar();return;}
  if(a==='sortear'){const mi=Number(popMestre.querySelector('[data-min]')?.value)||30,ma=Math.max(mi,Number(popMestre.querySelector('[data-max]')?.value)||150);
   aviso='';await salvarConvite({texto,estado:'agendado',quando:sortearQuando(Date.now(),mi,ma),janelaMin:[mi,ma]});return;}
  if(a==='cancelar'){aviso='';await salvarConvite({texto,estado:null,quando:null});}
 }
 function verificarSorteio(){if(ehMestre()&&convite?.estado==='agendado'&&Number(convite.quando)&&Date.now()>=Number(convite.quando)&&!ocupado)void entregar();}

 // ------------------------------------------------------------------ laço
 function passo(){try{pintar();desenharVer();assinarSaldo();desenharCarteira();desenharMestre();verificarSorteio();}catch(e){console.warn('[Vaelkor]',e);}}
 const timer=setInterval(passo,700);passo();
 win.mesaVaelkorV145_={ganhou,mostrarConvite:c=>mostrarConvite(c||convite||{}),entregar,parar:()=>clearInterval(timer)};
}
