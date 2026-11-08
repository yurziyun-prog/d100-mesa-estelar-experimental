// Mesa Estelar v107 — Trocar as imagens dos objetos do mapa pelo novo visual desenhado.
//
// Painel do mestre em Banco → Objetos de Mapa:
//  - prévia lado a lado (atual × novo) de cada objeto que tem desenho pronto;
//  - "Trocar marcados": baixa backup, desenha, converte para WebP, envia ao Storage e
//    grava só o campo `imagem` do objeto (mapas que usam o objeto mudam juntos);
//  - "Adicionar objetos novos": cria os objetos do pacote (árvores, pedras, móveis…);
//  - o backup é no mesmo formato da Biblioteca de imagens (v104): o botão
//    "Restaurar backup" de lá desfaz a troca.

import {desenharObjeto,svgParaDataUrl,RECEITAS_OBJETOS,PACOTE_NOVO,DESENHOS,REVISUAL_V138,REVISUAL_V139} from './mesa-arte-objetos.js?v=151';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const docIdObjeto=id=>`objetoMapa_${String(id||'objeto').replace(/[^a-zA-Z0-9_-]/g,'_')}`;
const CHAO="background:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px) 0 0/25% 25%,linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px) 0 0/25% 25%,#4a4f57";

export function instalarArteObjetos(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const objetos=()=>{try{return dep.objetosMapa?.()||[];}catch(_){return [];}};
 let ocupado=false;

 async function rasterizar(svg,larguraM,alturaM){
  const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Falha ao desenhar.'));i.src=svgParaDataUrl(svg);});
  const lado=Math.max(Number(larguraM)||1,Number(alturaM)||1),px=Math.max(256,Math.min(768,Math.round(lado*170)));
  const k=px/Math.max(img.width,img.height),c=root.createElement('canvas');c.width=Math.max(8,Math.round(img.width*k));c.height=Math.max(8,Math.round(img.height*k));
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  let blob=await new Promise(r=>c.toBlob(r,'image/webp',.88));let tipo='image/webp';
  if(!blob||blob.type!=='image/webp'){blob=await new Promise(r=>c.toBlob(r,'image/png'));tipo='image/png';}
  return {blob,tipo};
 }
 async function enviar(blob,tipo,id){
  const h=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());const hx=[...new Uint8Array(h)].slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('');
  const snap=await dep.uploadBytes(dep.ref(dep.storage,`personagens/${uid()}/biblioteca/objetos-v107/${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}-${hx}.${tipo==='image/webp'?'webp':'png'}`),blob,{contentType:tipo,cacheControl:'public,max-age=31536000,immutable'});
  return await dep.getDownloadURL(snap.ref);
 }
 function baixar(nome,texto){const a=root.createElement('a');a.href=URL.createObjectURL(new Blob([texto],{type:'application/json'}));a.download=nome;root.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);}


 // cria no banco um objeto do pacote (desenho → imagem → modelo)
 async function criarDoPacote(p){
     const svg=desenharObjeto(p,p.larguraM,p.alturaM);const {blob,tipo}=await rasterizar(svg,p.larguraM,p.alturaM);const url=await enviar(blob,tipo,p.id);
     const modelo={id:p.id,nome:p.nome,tipoVisual:'personalizado',larguraM:p.larguraM,alturaM:p.alturaM,camada:p.camada??(p.bloqueiaMovimento?3:2),material:p.material||'',pesoKg:0,pvMax:p.pvMax||10,dureza:p.dureza||0,destrutivel:(p.pvMax||0)>0,inflamabilidade:p.inflamabilidade||0,inflamavel:!!p.inflamavel,bloqueiaMovimento:!!p.bloqueiaMovimento,bloqueiaVisao:!!p.bloqueiaVisao,fixoAoMapa:false,imagem:url};
     await dep.setDoc(dep.doc(dep.db,'configuracoes',docIdObjeto(p.id)),modelo);
     objetos().push(modelo);return modelo;
 }
 async function atualizarIndice(novos){
  const idx=await dep.getDoc(dep.doc(dep.db,'configuracoes','objetosMapa'));const atual=idx.exists()?idx.data():{};
  const ids=[...new Set([...(Array.isArray(atual.ids)?atual.ids:objetos().map(o=>o.id)),...novos.map(p=>p.id)])];
  await dep.setDoc(dep.doc(dep.db,'configuracoes','objetosMapa'),{...atual,formato:'docs-v1',ids,atualizadoEm:new Date().toISOString()});
 }
 // v129: móveis futuristas, retrofuturistas e feudais entram no banco sozinhos (uma vez, na conta do mestre)
 let autoFeito=false;
 async function pacoteAutomatico(){
  if(autoFeito||ocupado||!ehMestre()||objetos().length<3)return;autoFeito=true;
  const existentes=new Set(objetos().map(o=>String(o.id))),novos=PACOTE_NOVO.filter(p=>!existentes.has(p.id));if(!novos.length){try{await revisualVeiculos();}catch(e){console.warn('[Arte v138] veículos',e);}return;}
  ocupado=true;const feitos=[];
  try{for(const p of novos){try{await criarDoPacote(p);feitos.push(p);}catch(e){console.warn('[Arte v129]',p.id,e);}}if(feitos.length)await atualizarIndice(feitos);}
  finally{ocupado=false;}
  try{await revisualVeiculos();}catch(e){console.warn('[Arte v138] veículos',e);}
  if(feitos.length){const av=root.createElement('div');av.textContent=`🎨 ${feitos.length} objeto(s) novo(s) no banco de objetos do mapa (inclui os móveis futuristas, retrofuturistas e feudais galácticos).`;av.style.cssText='position:fixed;left:16px;bottom:64px;z-index:9999;background:#1d2a44;border:1px solid #8ee7ff;color:#e8eefc;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;box-shadow:0 8px 24px #0008';root.body.append(av);setTimeout(()=>av.remove(),7000);try{dep.aoConcluir?.();}catch(_){}}
 }
 // v138: carros e caminhões do banco ganham o visual retrofuturista (uma vez; cópia das imagens antigas fica guardada)
 async function revisualVeiculos(){
  await revisual('mesasSemCadeirasV139',REVISUAL_V139,'🪑 Mesas do banco agora sem cadeiras desenhadas (as cadeiras viram objetos separados, em que dá para sentar)');
  await revisual('veiculosRetroV138',REVISUAL_V138,'🚀 Veículos do banco com visual retrofuturista');
 }
 async function revisual(flagId,tabela,titulo){
  const flag=dep.doc(dep.db,'configuracoes',flagId);if((await dep.getDoc(flag)).exists())return;
  const backup={},feitos=[];
  for(const [id,r] of Object.entries(tabela)){
   const o=objetos().find(x=>String(x.id)===id);if(!o)continue;
   backup[id]={imagem:String(o.imagem||''),nome:String(o.nome||'')};
   const svg=desenharObjeto(r,o.larguraM,o.alturaM);const {blob,tipo}=await rasterizar(svg,o.larguraM,o.alturaM);const url=await enviar(blob,tipo,id+'_'+flagId);
   await dep.setDoc(dep.doc(dep.db,'configuracoes',docIdObjeto(id)),{imagem:url,nome:r.nome},{merge:true});o.imagem=url;o.nome=r.nome;feitos.push(r.nome);
  }
  await dep.setDoc(flag,{em:new Date().toISOString(),backup});
  if(feitos.length){const av=root.createElement('div');av.textContent=`${titulo}: ${feitos.join(', ')}. As imagens antigas ficaram guardadas.`;av.style.cssText='position:fixed;left:16px;bottom:110px;z-index:9999;background:#1d2a44;border:1px solid #8ee7ff;color:#e8eefc;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:520px';root.body.append(av);setTimeout(()=>av.remove(),9000);try{dep.aoConcluir?.();}catch(_){}}
 }
 function instalar(){
  if(!ehMestre())return;
  const aba=root.getElementById('banco-objetosMapa');if(!aba||root.getElementById('mesaArteV107'))return;
  const det=root.createElement('details');det.id='mesaArteV107';
  det.style.cssText='margin:0 0 14px;padding:10px 12px;border:1px solid #49668a;border-radius:10px;background:rgba(10,18,34,.55)';
  det.innerHTML=`<summary style="cursor:pointer;font-weight:bold;color:#8ee7ff">🎨 Novo visual dos objetos · desenhos no estilo das miniaturas</summary>
   <div style="margin-top:8px;color:#c6d3e6;font-size:.92em;line-height:1.45">Compare a imagem atual (esquerda) com o novo desenho (direita). Desmarque o que quiser manter. Ao trocar, um backup das imagens atuais é baixado; para desfazer, use <b>Restaurar backup</b> na Biblioteca de imagens. Mapas que usam o objeto mudam juntos.</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center">
    <button type="button" class="btn-small btn-select" data-trocar>🎨 Trocar marcados</button>
    <button type="button" class="btn-small" data-novos>➕ Adicionar objetos novos (${PACOTE_NOVO.length})</button>
    <label style="display:flex;gap:6px;align-items:center;color:#c6d3e6"><input type="checkbox" data-todos checked> marcar todos</label>
   </div>
   <div data-barra style="height:8px;margin-top:10px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:0;background:#57e3a1;transition:width .2s"></i></div>
   <div data-st style="min-height:2.6em;margin-top:6px;font-size:.9em;color:#c6d3e6;white-space:pre-line"></div>
   <div data-lista style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:8px;max-height:520px;overflow:auto"></div>`;
  aba.prepend(det);
  const st=t=>{det.querySelector('[data-st]').textContent=t||'';};
  const barra=det.querySelector('[data-barra] i'),prog=(n,t)=>{barra.style.width=(t?Math.round(n/t*100):0)+'%';};
  const travar=v=>{ocupado=v;det.querySelectorAll('button,input').forEach(b=>b.disabled=v);};
  const candidatos=()=>objetos().filter(o=>RECEITAS_OBJETOS[o.id]&&!String(o.imagem||'').includes('/objetos-v107/'));
  function render(){
   const l=objetos().filter(o=>RECEITAS_OBJETOS[o.id]);
   det.querySelector('[data-lista]').innerHTML=l.map(o=>{
    const feito=String(o.imagem||'').includes('/objetos-v107/');
    let novo='';try{novo=svgParaDataUrl(desenharObjeto(RECEITAS_OBJETOS[o.id],o.larguraM,o.alturaM));}catch(_){}
    return `<label style="display:flex;flex-direction:column;gap:4px;padding:6px;border-radius:10px;background:rgba(255,255,255,.04);cursor:pointer">
     <span style="display:flex;gap:4px"><span style="width:104px;height:104px;${CHAO};display:flex;align-items:center;justify-content:center">${o.imagem?`<img loading="lazy" src="${esc(o.imagem)}" style="max-width:100%;max-height:100%">`:'—'}</span><span style="width:104px;height:104px;${CHAO};display:flex;align-items:center;justify-content:center"><img loading="lazy" src="${esc(novo)}" style="max-width:100%;max-height:100%"></span></span>
     <span style="display:flex;gap:6px;align-items:center;font-size:12px;color:#c6d3e6"><input type="checkbox" data-id="${esc(o.id)}"${feito?' disabled':' checked'}> ${esc(o.nome||o.id)}${feito?' · ✅ já trocado':''}</span></label>`;}).join('')||'<span style="color:#9fb3cc">Nenhum objeto do banco tem desenho pronto.</span>';
  }
  det.addEventListener('toggle',()=>{if(det.open)render();});
  det.querySelector('[data-todos]').addEventListener('change',e=>det.querySelectorAll('[data-lista] input[data-id]:not(:disabled)').forEach(c=>c.checked=e.target.checked));
  det.querySelector('[data-trocar]').addEventListener('click',async()=>{
   if(ocupado)return;
   const ids=new Set([...det.querySelectorAll('[data-lista] input[data-id]:checked')].map(c=>c.dataset.id));
   const lista=candidatos().filter(o=>ids.has(String(o.id)));
   if(!lista.length)return st('Nada marcado para trocar.');
   travar(true);
   baixar(`backup-imagens-mesa-objetos-v107-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`,JSON.stringify({formato:'mesa-imagens-backup-v1',criadoEm:new Date().toISOString(),itens:lista.map(o=>({colecao:'configuracoes',id:docIdObjeto(o.id),campo:'imagem',valor:String(o.imagem||''),objetoMapaId:o.id}))}));
   let ok=0;const erros=[];
   for(const [i,o] of lista.entries()){
    st(`${i+1}/${lista.length} · ${o.nome||o.id}`);prog(i,lista.length);
    try{
     const svg=desenharObjeto(RECEITAS_OBJETOS[o.id],o.larguraM,o.alturaM);
     const {blob,tipo}=await rasterizar(svg,o.larguraM,o.alturaM);
     const url=await enviar(blob,tipo,o.id);
     await dep.setDoc(dep.doc(dep.db,'configuracoes',docIdObjeto(o.id)),{imagem:url},{merge:true});
     o.imagem=url;ok++;
    }catch(e){console.warn('[Arte v107]',o.id,e);erros.push((o.nome||o.id)+': '+(e?.code||e?.message||e));}
   }
   prog(1,1);st(`Pronto: ${ok} de ${lista.length} objetos com o novo visual.${erros.length?`\n⚠️ ${erros.slice(0,5).join('\n')}`:''}\nO backup das imagens antigas foi baixado.`);
   travar(false);render();try{dep.aoConcluir?.();}catch(_){}
  });
  det.querySelector('[data-novos]').addEventListener('click',async()=>{
   if(ocupado)return;travar(true);
   try{
    const existentes=new Set(objetos().map(o=>String(o.id)));
    const novos=PACOTE_NOVO.filter(p=>!existentes.has(p.id));
    if(!novos.length){st('Os objetos novos já estão no banco.');travar(false);return;}
    let ok=0;
    for(const [i,p] of novos.entries()){
     st(`${i+1}/${novos.length} · ${p.nome}`);prog(i,novos.length);
     await criarDoPacote(p);ok++;
    }
    await atualizarIndice(novos);
    prog(1,1);st(`Adicionados ${ok} objetos novos ao banco: ${novos.map(p=>p.nome).join(', ')}.`);
    try{dep.aoConcluir?.();}catch(_){}render();
   }catch(e){console.warn('[Arte v107]',e);st('Não foi possível adicionar: '+(e?.code||e?.message||e));}
   travar(false);
  });
 }
 const vigia=setInterval(()=>{try{instalar();void pacoteAutomatico().catch(e=>console.warn('[Arte v129]',e));}catch(e){console.warn('[Arte v107]',e);}},1500);
 return {desenhos:Object.keys(DESENHOS),parar:()=>clearInterval(vigia)};
}
