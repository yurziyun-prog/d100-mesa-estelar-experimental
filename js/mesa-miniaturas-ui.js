// Mesa Estelar v105 — Editor de miniaturas.
//
// - Na ficha: botão "🧩 Miniatura do mapa" para o jogador montar a própria miniatura
//   (ou enviar uma imagem e ajustar recorte/direção).
// - No Banco (mestre): painéis em Criaturas e NPCs com prévias, edição e
//   "Gerar as que faltam" a partir das descrições.
// A miniatura é enviada ao Storage e o endereço fica em `miniatura.url` (com a marca
// #mini, que faz a camada visual girar a miniatura conforme a direção no mapa).
// Se o personagem já estiver no mapa, a miniatura do token é trocada na hora.

import {CORPOS,ARMAS,CABELOS,CABECAS,ARMADURAS,PADROES,CABECAS_CRIATURA,TRACOS,PELES,MARCA_MINI,
 specPadrao,normalizarSpec,renderizarMiniatura,svgParaDataUrl,specDeNpc,specDeCriatura,specDePersonagem} from './mesa-miniaturas.js?v=194';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SO_HUMANOIDE=['pele','roupa','roupa2','cabelo','corCabelo','cabeca','capa','armadura','corArmadura','mochila','maoD','maoE','pose'];
const SO_CRIATURA=['cor','cor2','padrao','cabecaCriatura','quantidade','pescocos'];
const HUMANOS=new Set(['humanoide','robo','tanque']);

const CSS=`
.mm-fundo{position:fixed;inset:0;z-index:10000;background:rgba(3,6,14,.72);display:flex;align-items:center;justify-content:center;padding:12px}
.mm-caixa{width:min(940px,100%);height:min(640px,calc(100vh - 24px));display:grid;grid-template-columns:300px 1fr;grid-template-rows:auto 1fr auto;gap:0;background:#121a2e;border:1px solid #49668a;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden}
.mm-topo{grid-column:1/3;display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
.mm-topo h3{margin:0;font-size:15px;color:#8ee7ff;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mm-abas{display:flex;gap:6px}.mm-abas button[aria-pressed="true"]{background:#2b4f74;color:#fff}
.mm-previa{padding:14px;display:flex;flex-direction:column;align-items:center;gap:10px;border-right:1px solid rgba(255,255,255,.08)}
.mm-base{width:250px;height:250px;border-radius:12px;background:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px) 0 0/25% 25%,linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px) 0 0/25% 25%,radial-gradient(circle at 45% 40%,#59606b,#2c3139);border:1px solid #49668a;overflow:hidden;position:relative;flex:none}
.mm-base img,.mm-base canvas{width:100%;height:100%;display:block}
.mm-frente{color:#9fb3cc;font-size:12px}
.mm-controles{padding:10px 14px;overflow:auto}
.mm-grade{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 14px}
.mm-grade label{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:30px}
.mm-grade label.mm-off{opacity:.38}
.mm-grade select,.mm-grade input[type=range]{width:150px;max-width:60%}
.mm-grade input[type=color]{width:44px;height:26px;padding:0;border:1px solid #49668a;background:none}
.mm-sep{grid-column:1/3;margin:8px 0 2px;color:#8ee7ff;font-size:11px;text-transform:uppercase;letter-spacing:.06em;border-top:1px solid rgba(255,255,255,.08);padding-top:6px}
.mm-tracos{grid-column:1/3;display:flex;flex-wrap:wrap;gap:4px 12px}
.mm-tracos label{min-height:0;justify-content:flex-start}
.mm-paleta{display:flex;gap:4px;flex-wrap:wrap}.mm-paleta button{width:20px;height:20px;border-radius:50%;border:1px solid #0008;padding:0;cursor:pointer}
.mm-rodape{grid-column:1/3;display:flex;gap:8px;justify-content:flex-end;align-items:center;padding:10px 14px;border-top:1px solid rgba(255,255,255,.08)}
.mm-rodape .mm-status{flex:1;color:#9fb3cc;min-height:1.2em}
.mm-painel{margin:0 0 14px;padding:10px 12px;border:1px solid #49668a;border-radius:10px;background:rgba(10,18,34,.55)}
.mm-painel summary{cursor:pointer;font-weight:bold;color:#8ee7ff}
.mm-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px;margin-top:10px;max-height:420px;overflow:auto}
.mm-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid transparent;cursor:pointer;font-size:11px;color:#c6d3e6;text-align:center}
.mm-item:hover{border-color:#49668a}
.mm-item .mm-mini{width:72px;height:72px;border-radius:8px;background:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px) 0 0/25% 25%,linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px) 0 0/25% 25%,radial-gradient(circle at 45% 40%,#59606b,#2c3139);overflow:hidden;border:1px solid #49668a}
.mm-item .mm-mini.mm-auto{border:1px dashed #9fb3cc}
.mm-item img{width:100%;height:100%}
`;

export function instalarMiniaturas(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 if(!root.getElementById('mmCssV105')){const st=root.createElement('style');st.id='mmCssV105';st.textContent=CSS;root.head.append(st);}

 async function hash(blob){const h=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());return [...new Uint8Array(h)].slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('');}
 async function enviar(blob,tipo,nomeBase){
  const ext=tipo==='image/svg+xml'?'svg':tipo==='image/webp'?'webp':'png';
  const caminho=`personagens/${uid()}/miniaturas/${String(nomeBase).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,60)}-${await hash(blob)}.${ext}`;
  const snap=await dep.uploadBytes(dep.ref(dep.storage,caminho),blob,{contentType:tipo,cacheControl:'public,max-age=31536000,immutable'});
  return (await dep.getDownloadURL(snap.ref))+MARCA_MINI;
 }
 async function trocarToken(tokenId,url){
  const r=dep.doc(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes',encodeURIComponent(tokenId));
  try{
   await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(r);if(!s.exists())return;const v=s.data();if(v.imagem===url)return;tx.update?tx.update(r,{imagem:url,revision:Number(v.revision||0)+1}):tx.set(r,{...v,imagem:url,revision:Number(v.revision||0)+1});});
   return true;
  }catch(e){console.warn('[Miniaturas] token não atualizado agora',e);return false;}
 }
 // ---------------------------------------------------------------- editor
 function abrirEditor({titulo,spec,imagemAtual='',aoSalvar}){
  let s=normalizarSpec(spec||specPadrao('humanoide')),modo='montar',propria=null;
  const fundo=root.createElement('div');fundo.className='mm-fundo';
  fundo.innerHTML=`<div class="mm-caixa" role="dialog" aria-label="Editor de miniatura">
   <div class="mm-topo"><h3>🧩 ${esc(titulo)}</h3><div class="mm-abas"><button type="button" class="btn-small" data-aba="montar" aria-pressed="true">Montar</button><button type="button" class="btn-small" data-aba="imagem" aria-pressed="false">Usar imagem própria</button></div><button type="button" class="btn-small" data-x title="Fechar">✕</button></div>
   <div class="mm-previa"><div class="mm-base" data-previa></div><div class="mm-frente">A miniatura olha para a direita →<br>No mapa ela gira para onde o personagem estiver virado.</div><button type="button" class="btn-small" data-aleatorio>🎲 Variar cores</button></div>
   <div class="mm-controles" data-controles></div>
   <div class="mm-rodape"><span class="mm-status" data-status></span><button type="button" class="btn-small" data-x>Cancelar</button><button type="button" class="btn-small btn-select" data-salvar>💾 Salvar miniatura</button></div>
  </div>`;
  root.body.append(fundo);
  const $=q=>fundo.querySelector(q),status=t=>{$('[data-status]').textContent=t||'';};
  const fechar=()=>fundo.remove();
  fundo.querySelectorAll('[data-x]').forEach(b=>b.addEventListener('click',fechar));
  fundo.addEventListener('click',e=>{if(e.target===fundo)fechar();});
  const previa=$('[data-previa]');
  function desenharPrevia(){
   if(modo==='montar'){previa.innerHTML=`<img alt="" src="${svgParaDataUrl(renderizarMiniatura(s))}">`;return;}
   const c=previa.querySelector('canvas')||(()=>{previa.innerHTML='<canvas width="512" height="512"></canvas>';return previa.querySelector('canvas');})();
   const ctx=c.getContext('2d');ctx.clearRect(0,0,512,512);
   if(!propria?.img){ctx.fillStyle='#9fb3cc';ctx.font='22px Arial';ctx.textAlign='center';ctx.fillText('Escolha uma imagem',256,262);return;}
   ctx.save();ctx.translate(256+propria.dx*2.56,256+propria.dy*2.56);ctx.rotate(propria.giro*Math.PI/180);
   const im=propria.img,esc=propria.zoom*512/Math.max(im.width,im.height);ctx.drawImage(im,-im.width*esc/2,-im.height*esc/2,im.width*esc,im.height*esc);ctx.restore();
   ctx.strokeStyle='rgba(255,212,71,.8)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(400,256);ctx.lineTo(480,256);ctx.moveTo(462,240);ctx.lineTo(482,256);ctx.lineTo(462,272);ctx.stroke();
  }
  const sel=(k,obj,rot)=>`<label data-campo="${k}">${rot}<select data-k="${k}">${Object.entries(obj).map(([v,n])=>`<option value="${v}"${s[k]===v?' selected':''}>${esc(n)}</option>`).join('')}</select></label>`;
  const cor=(k,rot,paleta)=>`<label data-campo="${k}">${rot}<span style="display:flex;gap:6px;align-items:center">${paleta?`<span class="mm-paleta">${PELES.slice(0,6).map(p=>`<button type="button" data-cor="${k}" data-v="${p}" style="background:${p}" title="${p}"></button>`).join('')}</span>`:''}<input type="color" data-k="${k}" value="${s[k]||'#000000'}"></span></label>`;
  function montarControles(){
   const ctl=$('[data-controles]');
   if(modo==='imagem'){
    ctl.innerHTML=`<div class="mm-grade">
     <div class="mm-sep">Imagem vista de cima</div>
     <label style="grid-column:1/3">Arquivo <input type="file" accept="image/*" data-arquivo></label>
     <label>Zoom <input type="range" min="0.4" max="3" step="0.05" value="${propria?.zoom||1}" data-p="zoom"></label>
     <label>Girar <input type="range" min="-180" max="180" step="1" value="${propria?.giro||0}" data-p="giro"></label>
     <label>Mover ↔ <input type="range" min="-50" max="50" step="1" value="${propria?.dx||0}" data-p="dx"></label>
     <label>Mover ↕ <input type="range" min="-50" max="50" step="1" value="${propria?.dy||0}" data-p="dy"></label>
     <div class="mm-sep">Dica</div><div style="grid-column:1/3;color:#9fb3cc">Use uma imagem do personagem visto <b>de cima</b>, de preferência com fundo transparente (PNG). Gire até a frente do personagem apontar para a seta amarela.</div></div>`;
    ctl.querySelector('[data-arquivo]').addEventListener('change',async ev=>{
     const f=ev.target.files?.[0];if(!f)return;
     try{const url=URL.createObjectURL(f);const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});propria={img,zoom:1,giro:0,dx:0,dy:0};montarControles();desenharPrevia();}
     catch(_){status('Não foi possível abrir esta imagem.');}
    });
    ctl.querySelectorAll('[data-p]').forEach(i=>i.addEventListener('input',()=>{if(!propria)return;propria[i.dataset.p]=Number(i.value);desenharPrevia();}));
    return;
   }
   const h=HUMANOS.has(s.corpo);
   ctl.innerHTML=`<div class="mm-grade">
    ${sel('corpo',CORPOS,'Corpo')}
    <label data-campo="porte">Porte <input type="range" min="0.7" max="1.4" step="0.05" value="${s.porte}" data-k="porte"></label>
    <div class="mm-sep">Pessoa / robô</div>
    ${cor('pele','Pele',true)}${cor('roupa','Roupa')}
    ${cor('roupa2','Roupa (detalhe)')}${sel('cabelo',CABELOS,'Cabelo')}
    ${cor('corCabelo','Cor do cabelo')}${sel('cabeca',CABECAS,'Na cabeça')}
    ${sel('armadura',ARMADURAS,'Armadura')}${cor('corArmadura','Metal / armadura')}
    ${sel('maoD',ARMAS,'Mão direita')}${sel('maoE',ARMAS,'Mão esquerda')}
    <label data-campo="capa">Capa <span style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-capa${s.capa?' checked':''}><input type="color" data-k="capa" value="${s.capa||'#5a2e2e'}"></span></label>
    <label data-campo="mochila">Mochila <input type="checkbox" data-k="mochila"${s.mochila?' checked':''}></label>
    ${sel('pose',{normal:'Normal',zumbi:'Braços à frente'},'Pose')}
    <div class="mm-sep">Criatura</div>
    ${cor('cor','Cor principal')}${cor('cor2','Cor secundária')}
    ${sel('padrao',PADROES,'Padrão')}${sel('cabecaCriatura',CABECAS_CRIATURA,'Cabeça')}
    <label data-campo="quantidade">Quantidade (enxame) <input type="range" min="4" max="40" step="1" value="${s.quantidade}" data-k="quantidade"></label>
    <label data-campo="pescocos">Pescoços <input type="range" min="2" max="9" step="1" value="${s.pescocos}" data-k="pescocos"></label>
    <div class="mm-sep">Traços</div>
    ${cor('corOlhos','Cor dos olhos / luz')}<span></span>
    <div class="mm-tracos">${Object.entries(TRACOS).map(([k,n])=>`<label><input type="checkbox" data-traco="${k}"${s.tracos[k]?' checked':''}> ${esc(n)}</label>`).join('')}</div>
   </div>`;
   ctl.querySelectorAll('[data-campo]').forEach(l=>{const k=l.dataset.campo;const off=(SO_HUMANOIDE.includes(k)&&!h)||(SO_CRIATURA.includes(k)&&h&&s.corpo!=='tanque')||(k==='quantidade'&&s.corpo!=='enxame')||(k==='pescocos'&&s.corpo!=='sessil');l.classList.toggle('mm-off',off);l.querySelectorAll('input,select').forEach(i=>i.disabled=off);});
   ctl.querySelectorAll('[data-k]').forEach(i=>i.addEventListener('input',()=>{
    const k=i.dataset.k;let v=i.type==='checkbox'?i.checked:i.type==='range'?Number(i.value):i.value;
    if(k==='capa'){if(!ctl.querySelector('[data-capa]').checked)return;}
    s=normalizarSpec({...s,[k]:v});
    if(k==='corpo'){montarControles();}
    desenharPrevia();
   }));
   ctl.querySelector('[data-capa]')?.addEventListener('change',e=>{s=normalizarSpec({...s,capa:e.target.checked?ctl.querySelector('input[data-k="capa"]').value:''});desenharPrevia();});
   ctl.querySelectorAll('[data-traco]').forEach(i=>i.addEventListener('change',()=>{s=normalizarSpec({...s,tracos:{...s.tracos,[i.dataset.traco]:i.checked}});desenharPrevia();}));
   ctl.querySelectorAll('[data-cor]').forEach(b=>b.addEventListener('click',()=>{s=normalizarSpec({...s,[b.dataset.cor]:b.dataset.v});const inp=ctl.querySelector(`input[data-k="${b.dataset.cor}"]`);if(inp)inp.value=b.dataset.v;desenharPrevia();}));
  }
  fundo.querySelectorAll('[data-aba]').forEach(b=>b.addEventListener('click',()=>{modo=b.dataset.aba;fundo.querySelectorAll('[data-aba]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('[data-aleatorio]').disabled=modo!=='montar';montarControles();desenharPrevia();}));
  $('[data-aleatorio]').addEventListener('click',()=>{
   const r=()=>'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
   const t=x=>x[Math.floor(Math.random()*x.length)];
   s=normalizarSpec(HUMANOS.has(s.corpo)?{...s,roupa:r(),roupa2:r(),corCabelo:t(['#2a1c12','#4a3220','#7a5530','#b08d57','#1b1b1b','#c9c9c9','#8a2a2a']),cabelo:t(Object.keys(CABELOS))}:{...s,cor:r(),cor2:r(),padrao:t(Object.keys(PADROES))});
   montarControles();desenharPrevia();
  });
  $('[data-salvar]').addEventListener('click',async()=>{
   const btn=$('[data-salvar]');btn.disabled=true;status('Salvando…');
   try{
    let blob,tipo,specSalvo=null;
    if(modo==='montar'){blob=new Blob([renderizarMiniatura(s)],{type:'image/svg+xml'});tipo='image/svg+xml';specSalvo=s;}
    else{
     if(!propria?.img)throw new Error('Escolha uma imagem primeiro.');
     const c=root.createElement('canvas');c.width=c.height=384;const ctx=c.getContext('2d');
     ctx.translate(192+propria.dx*1.92,192+propria.dy*1.92);ctx.rotate(propria.giro*Math.PI/180);
     const im=propria.img,k=propria.zoom*384/Math.max(im.width,im.height);ctx.drawImage(im,-im.width*k/2,-im.height*k/2,im.width*k,im.height*k);
     blob=await new Promise(r=>c.toBlob(r,'image/webp',.9));tipo=blob?.type==='image/webp'?'image/webp':'image/png';
     if(!blob||tipo!=='image/webp')blob=await new Promise(r=>c.toBlob(r,'image/png'));
    }
    const msg=await aoSalvar({blob,tipo,spec:specSalvo});
    status(msg||'Salvo!');setTimeout(fechar,900);
   }catch(e){console.warn('[Miniaturas]',e);status('Não foi possível salvar: '+(e?.code||e?.message||e));btn.disabled=false;}
  });
  montarControles();desenharPrevia();
  if(imagemAtual&&!spec){/* miniatura enviada como imagem: começamos pelo montador */}
 }

 // ---------------------------------------------------------------- ficha do personagem
 function instalarBotaoFicha(){
  const alvo=root.getElementById('editCharImagePreview');if(!alvo)return;
  if(root.getElementById('mmBotaoFichaV105'))return;
  const grupo=alvo.closest('.form-group')||alvo.parentElement;
  const wrap=root.createElement('div');wrap.className='form-group';wrap.id='mmBotaoFichaV105';
  wrap.innerHTML=`<button type="button" class="btn-small" title="Montar a miniatura vista de cima usada no Mapa da Mesa">🧩 Miniatura do mapa</button> <span data-mini-ficha style="display:inline-block;width:42px;height:42px;border-radius:6px;vertical-align:middle;overflow:hidden;background:radial-gradient(circle at 45% 40%,#59606b,#2c3139);border:1px solid #49668a"></span>`;
  grupo.after(wrap);
  wrap.querySelector('button').addEventListener('click',()=>{
   const c=dep.personagemAtual?.();if(!c?.id)return dep.notificar?.('Abra ou crie um personagem primeiro.','aviso');
   abrirEditor({titulo:'Miniatura de '+(c.nome||'personagem'),spec:c.miniatura?.spec||specDePersonagem(c),aoSalvar:async({blob,tipo,spec})=>{
    const url=await enviar(blob,tipo,c.id);
    const miniatura={url,spec:spec||null,tipo:spec?'montada':'imagem',atualizadoEm:new Date().toISOString()};
    await dep.setDoc(dep.doc(dep.db,'personagens',c.id),{miniatura},{merge:true});
    c.miniatura=miniatura;atualizarMiniFicha();
    const ok=await trocarToken(c.id,url);
    return ok?'Salvo! A miniatura já aparece no mapa.':'Salvo! A miniatura aparece no mapa quando o personagem for colocado de novo.';
   }});
  });
  atualizarMiniFicha();
 }
 let ultimoMiniFicha='';
 function atualizarMiniFicha(){
  const span=root.querySelector('#mmBotaoFichaV105 [data-mini-ficha]');if(!span)return;
  const c=dep.personagemAtual?.(),url=c?.miniatura?.url||'';
  if(url===ultimoMiniFicha)return;ultimoMiniFicha=url;
  span.innerHTML=url?`<img src="${esc(url)}" alt="" style="width:100%;height:100%">`:'';
 }

 // ---------------------------------------------------------------- banco (mestre)
 function instalarPainelBanco(abaId,tipo){
  if(!ehMestre())return;
  const aba=root.getElementById(abaId);if(!aba||aba.querySelector(`[data-mm-painel="${tipo}"]`))return;
  const det=root.createElement('details');det.className='mm-painel';det.dataset.mmPainel=tipo;
  const rotulo={criaturas:'criaturas',npcs:'NPCs',personagens:'personagens dos jogadores (PJ/PM)'}[tipo];
  det.innerHTML=`<summary>🧩 Miniaturas vistas de cima · ${rotulo}</summary>
   <div style="margin-top:8px;color:#c6d3e6;font-size:.92em">Borda tracejada = prévia automática feita a partir da descrição (ainda não salva). Clique para editar e salvar; ou gere todas de uma vez.</div>
   <div style="display:flex;gap:8px;margin-top:8px;align-items:center"><button type="button" class="btn-small btn-select" data-gerar>✨ Gerar as que faltam</button><span data-st style="color:#9fb3cc;min-height:1.2em"></span></div>
   <div class="mm-lista" data-lista></div>`;
  aba.prepend(det);
  const lista=()=>(tipo==='criaturas'?dep.criaturas?.():tipo==='npcs'?dep.npcs?.():dep.personagens?.())||[];
  const specAuto=x=>tipo==='criaturas'?specDeCriatura(x):tipo==='npcs'?specDeNpc(x):specDePersonagem(x);
  const st=t=>{det.querySelector('[data-st]').textContent=t||'';};
  const salvar=async(x,blob,tipoArq,spec)=>{
   const url=await enviar(blob,tipoArq,tipo+'-'+x.id);
   const miniatura={url,spec:spec||null,tipo:spec?'montada':'imagem',atualizadoEm:new Date().toISOString()};
   await dep.setDoc(dep.doc(dep.db,tipo,x.id),{miniatura},{merge:true});x.miniatura=miniatura;
   await trocarToken((tipo==='criaturas'?'synccriatura:':tipo==='npcs'?'syncnpc:':'')+x.id,url);
   return url;
  };
  function render(){
   const l=lista();
   det.querySelector('[data-lista]').innerHTML=l.map(x=>{const salvo=x.miniatura?.url;const src=salvo||svgParaDataUrl(renderizarMiniatura(specAuto(x)));
    return `<div class="mm-item" data-id="${esc(x.id)}" title="${esc(x.nome||x.id)}"><div class="mm-mini${salvo?'':' mm-auto'}"><img loading="lazy" alt="" src="${esc(src)}"></div>${esc(x.nome||x.id)}</div>`;}).join('')||'<span style="color:#9fb3cc">Nada no banco ainda.</span>';
   det.querySelectorAll('.mm-item').forEach(n=>n.addEventListener('click',()=>{
    const x=lista().find(y=>String(y.id)===n.dataset.id);if(!x)return;
    abrirEditor({titulo:'Miniatura · '+(x.nome||x.id),spec:x.miniatura?.spec||specAuto(x),aoSalvar:async({blob,tipo:t,spec})=>{await salvar(x,blob,t,spec);render();return 'Salvo!';}});
   }));
  }
  det.addEventListener('toggle',()=>{if(det.open)render();});
  det.querySelector('[data-gerar]').addEventListener('click',async e=>{
   const btn=e.currentTarget;btn.disabled=true;
   const falta=lista().filter(x=>!x.miniatura?.url);let ok=0;
   for(const [i,x] of falta.entries()){st(`${i+1}/${falta.length} · ${x.nome||x.id}`);
    try{const spec=specAuto(x);await salvar(x,new Blob([renderizarMiniatura(spec)],{type:'image/svg+xml'}),'image/svg+xml',spec);ok++;}catch(err){console.warn('[Miniaturas]',x.id,err);}
   }
   st(falta.length?`Pronto: ${ok} de ${falta.length} miniaturas salvas.`:'Todas já têm miniatura.');btn.disabled=false;render();
  });
 }

 const vigia=setInterval(()=>{
  try{instalarBotaoFicha();atualizarMiniFicha();instalarPainelBanco('banco-criaturas','criaturas');instalarPainelBanco('banco-npcs','npcs');instalarPainelBanco('banco-npcs','personagens');}
  catch(e){console.warn('[Miniaturas]',e);}
 },1500);
 return {abrirEditor,parar:()=>clearInterval(vigia)};
}
