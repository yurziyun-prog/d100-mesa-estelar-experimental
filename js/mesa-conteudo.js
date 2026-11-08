// Mesa Estelar v108 — Conteúdo novo aplicado pelo próprio site.
//
// Em vez de baixar e importar CSV, o mestre vê um aviso "📦 Conteúdo novo" e aplica
// com um clique. As criaturas/NPCs passam pelo MESMO normalizador da importação de CSV
// do banco, são gravadas com merge (miniatura e imagem atuais são preservadas) e,
// se ainda não tiverem miniatura, ganham uma automaticamente.

import {PACOTES} from './mesa-conteudo-dados.js?v=112';
import {renderizarMiniatura,specDeCriatura,specDeNpc,specDePersonagem,MARCA_MINI,RECEITAS_CRIATURAS} from './mesa-miniaturas.js?v=194';

// v122: quem precisa de miniatura desenhada.
// • Sem miniatura → sim.
// • Criaturas e NPCs do banco cuja "miniatura" é só a foto antiga (sem a marca #mini) → sim
//   (a foto continua guardada em "imagem" e em miniaturaAnterior).
// • Criatura com receita própria (ex.: Cila) cuja miniatura automática tem outro formato de corpo → redesenha.
// • Personagens dos jogadores com arte própria nunca são trocados.
export function precisaMini(tipo,m,insetoAntigo=()=>false){
 if(!m?.id)return false;
 const mi=m.miniatura;if(!mi?.url)return true;
 if(insetoAntigo(m))return true;
 if(tipo==='personagens')return false;
 if(!String(mi.url).includes(MARCA_MINI))return true;
 if(tipo==='criaturas'&&mi.tipo!=='montada')return true; // v130: foto enviada pelo editor (tipo "imagem") também vira miniatura desenhada nas criaturas
 if(tipo==='criaturas'&&mi.tipo==='montada'&&RECEITAS_CRIATURAS[m.id]&&mi.spec?.corpo&&mi.spec.corpo!==RECEITAS_CRIATURAS[m.id].corpo)return true;
 return false;
}

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function pacotesPendentes(aplicados={}){return PACOTES.filter(p=>!aplicados[p.id]);}

export function instalarConteudo(dep){
 const root=dep.root||document;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 let aplicados=null,toast=null,verificado=false;

 async function lerAplicados(){
  const s=await dep.getDoc(dep.doc(dep.db,'configuracoes','conteudoMesa'));
  aplicados=s.exists()?(s.data()?.aplicados||{}):{};return aplicados;
 }
 async function enviarMini(svg,nome){
  const blob=new Blob([svg],{type:'image/svg+xml'});
  const h=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());const hx=[...new Uint8Array(h)].slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('');
  const snap=await dep.uploadBytes(dep.ref(dep.storage,`personagens/${uid()}/miniaturas/${nome.replace(/[^a-zA-Z0-9_-]/g,'_')}-${hx}.svg`),blob,{contentType:'image/svg+xml',cacheControl:'public,max-age=31536000,immutable'});
  return (await dep.getDownloadURL(snap.ref))+MARCA_MINI;
 }
 // v114: insetoides (bípedes de 4 braços) que ganharam miniatura automática antiga, de formiga, são redesenhados.
 const insetoAntigo=m=>m?.miniatura?.tipo==='montada'&&m.miniatura?.spec?.corpo==='inseto'&&/insetoid/i.test(String([m.nome,m.raca,m.especie].join(' ')).normalize('NFD'))&&!/hexapod|hexápod|seis patas|formiga/i.test(String(m.descricao||''));
 async function minisFaltando(log){
  let n=0;
  for(const [tipo,banco,spec] of [['criaturas',dep.criaturas,specDeCriatura],['npcs',dep.npcs,specDeNpc],['personagens',dep.personagens,specDePersonagem]]){
   const arr=banco?.()||[];
   for(let i=0;i<arr.length;i++){const m=arr[i];if(!precisaMini(tipo,m,insetoAntigo))continue;
    try{const sp=spec(m),miniatura={url:await enviarMini(renderizarMiniatura(sp),tipo+'-'+m.id),spec:sp,tipo:'montada',auto:true,atualizadoEm:new Date().toISOString()};
     const extra=m.miniatura?.url&&(!String(m.miniatura.url).includes(MARCA_MINI)||m.miniatura.tipo!=='montada')?{miniaturaAnterior:m.miniatura}:{};
     await dep.setDoc(dep.doc(dep.db,tipo,String(m.id)),{miniatura,...extra},{merge:true});arr[i]={...m,miniatura};n++;log?.(`${m.nome||m.id} ✓`);}
    catch(e){console.warn('[Conteúdo] miniatura',m.id,e);log?.(`${m.nome||m.id}: não foi possível (${e?.code||e?.message||e})`);}
   }
  }
  return n;
 }
 async function aplicarPacote(p,log){
  let n=0;
  if(p.acao==='minisFaltando')n=await minisFaltando(log);
  for(const [tipo,lista,banco,spec] of [['criaturas',p.criaturas,dep.criaturas,specDeCriatura],['npcs',p.npcs,dep.npcs,specDeNpc]]){
   for(const bruto of lista||[]){
    const modelo=dep.normalizar(tipo,bruto);if(!modelo?.id)continue;
    const existente=(banco?.()||[]).find(x=>String(x.id)===String(modelo.id));
    if(existente?.imagem&&!bruto.imagem)modelo.imagem=existente.imagem;
    if(existente?.miniatura)modelo.miniatura=existente.miniatura;
    else{try{const sp=spec(modelo);modelo.miniatura={url:await enviarMini(renderizarMiniatura(sp),tipo+'-'+modelo.id),spec:sp,tipo:'montada',atualizadoEm:new Date().toISOString()};}catch(e){console.warn('[Conteúdo] miniatura',modelo.id,e);}}
    await dep.setDoc(dep.doc(dep.db,tipo,modelo.id),JSON.parse(JSON.stringify(modelo)),{merge:true});
    const arr=banco?.();if(arr){const i=arr.findIndex(x=>String(x.id)===String(modelo.id));if(i>=0)arr[i]={...arr[i],...modelo};else arr.push(modelo);}
    n++;log?.(`${modelo.nome} ✓`);
   }
  }
  aplicados={...(aplicados||{}),[p.id]:new Date().toISOString()};
  await dep.setDoc(dep.doc(dep.db,'configuracoes','conteudoMesa'),{aplicados},{merge:true});
  return n;
 }
 function mostrarToast(pend){
  if(toast?.isConnected||!pend.length)return;
  toast=root.createElement('button');toast.type='button';
  toast.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9998;padding:10px 14px;border-radius:12px;border:1px solid #57e3a1;background:#122a24;color:#e8fff4;font:600 13px Segoe UI,Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);cursor:pointer';
  toast.textContent=`📦 Conteúdo novo para o banco (${pend.length})`;
  toast.addEventListener('click',()=>abrirModal());root.body.append(toast);
 }
 function abrirModal(){
  const pend=pacotesPendentes(aplicados||{});
  const f=root.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:10001;background:rgba(3,6,14,.7);display:flex;align-items:center;justify-content:center;padding:12px';
  f.innerHTML=`<div style="width:min(620px,100%);max-height:calc(100vh - 24px);overflow:auto;background:#121a2e;border:1px solid #49668a;border-radius:14px;padding:16px;color:#e8eefc;font:13px Segoe UI,Arial,sans-serif">
   <h3 style="margin:0 0 8px;color:#8ee7ff">📦 Conteúdo novo</h3>
   <div style="color:#c6d3e6;margin-bottom:10px">Aplicar grava direto no banco (sem arquivo). Criaturas e NPCs que já existem são atualizados mantendo a imagem e a miniatura atuais; os que não têm miniatura ganham uma.</div>
   ${pend.map(p=>`<label style="display:block;padding:10px;margin:6px 0;border-radius:10px;background:rgba(255,255,255,.05)"><input type="checkbox" data-p="${esc(p.id)}" checked> <b>${esc(p.titulo)}</b><div style="color:#9fb3cc;margin-top:4px">${esc(p.descricao)}</div></label>`).join('')||'<div>Nada pendente.</div>'}
   <div data-st style="min-height:2.4em;white-space:pre-line;color:#c6d3e6;margin-top:8px;max-height:140px;overflow:auto"></div>
   <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="button" class="btn-small" data-x>Fechar</button><button type="button" class="btn-small btn-select" data-ok>✅ Aplicar marcados</button></div></div>`;
  root.body.append(f);
  const st=f.querySelector('[data-st]');const log=t=>{st.textContent+=(st.textContent?'\n':'')+t;st.scrollTop=1e6;};
  f.querySelector('[data-x]').addEventListener('click',()=>f.remove());
  f.querySelector('[data-ok]').addEventListener('click',async e=>{
   const b=e.currentTarget;b.disabled=true;
   const ids=[...f.querySelectorAll('[data-p]:checked')].map(c=>c.dataset.p);
   try{for(const id of ids){const p=PACOTES.find(x=>x.id===id);log(`— ${p.titulo}`);const n=await aplicarPacote(p,log);log(`${n} registro(s) gravado(s).`);}
    log('Pronto!');try{await dep.recarregar?.();}catch(_){}
    if(!pacotesPendentes(aplicados).length)toast?.remove();else if(toast)toast.textContent=`📦 Conteúdo novo para o banco (${pacotesPendentes(aplicados).length})`;
   }catch(err){console.warn('[Conteúdo]',err);log('⚠️ Erro: '+(err?.code||err?.message||err)+'\nO que já foi gravado continua salvo; você pode tentar de novo.');}
   b.disabled=false;
  });
 }
 const vigia=setInterval(async()=>{
  if(verificado||!ehMestre()||!uid())return;verificado=true;
  try{await lerAplicados();mostrarToast(pacotesPendentes(aplicados));}catch(e){verificado=false;console.warn('[Conteúdo]',e);}
  // v117: NPC de ficha avançada (antigo PDM) fica com a miniatura do NPC gêmeo do banco (ex.: a da Dra. Ilya), se a dele era automática
  try{const nn=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^(dra?|sr|sra|srta|lord|lady)\.?\s+/,'').replace(/[^a-z0-9]+/g,' ').trim();
   const pcs=(dep.personagens?.()||[]).filter(c=>String(c.dono||c.donoUid||'')===uid());
   for(const pc of pcs){const gemeo=(dep.npcs?.()||[]).find(n=>nn(n.nome)===nn(pc.nome)&&n.miniatura?.url);if(!gemeo)continue;
    if(pc.miniatura?.url&&pc.miniatura.tipo!=='montada')continue;if(pc.miniatura?.url===gemeo.miniatura.url)continue;
    await dep.setDoc(dep.doc(dep.db,'personagens',String(pc.id)),{miniatura:gemeo.miniatura},{merge:true});pc.miniatura=gemeo.miniatura;console.info('[Conteúdo] miniatura do NPC gêmeo copiada para',pc.nome);}
  }catch(e){console.warn('[Conteúdo] gêmeos',e);}
  // v114: miniaturas para todos, sozinho (só quem ainda não tem; uma vez por sessão do mestre)
  try{const falta=[...(dep.criaturas?.()||[]),...(dep.npcs?.()||[]),...(dep.personagens?.()||[])].filter(m=>m?.id&&(!m.miniatura?.url||insetoAntigo(m)));
   for(const [tp,b] of [['criaturas',dep.criaturas],['npcs',dep.npcs]])for(const m of b?.()||[])if(precisaMini(tp,m,insetoAntigo)&&!falta.includes(m))falta.push(m);
   if(falta.length){const n=await minisFaltando(null);if(n){const av=root.createElement('div');av.textContent=`🧩 ${n} miniatura(s) nova(s) desenhada(s) para o banco.`;av.style.cssText='position:fixed;left:16px;bottom:16px;z-index:9998;padding:9px 13px;border-radius:12px;border:1px solid #57e3a1;background:#122a24;color:#e8fff4;font:600 13px Segoe UI,Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)';root.body.append(av);setTimeout(()=>av.remove(),7000);}}}
  catch(e){console.warn('[Conteúdo] miniaturas automáticas',e);}
 },3000);
 return {abrir:abrirModal,pacotes:PACOTES,parar:()=>clearInterval(vigia)};
}
