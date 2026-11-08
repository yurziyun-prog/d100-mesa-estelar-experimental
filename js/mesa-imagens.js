// Mesa Estelar v104 — Biblioteca de imagens.
//
// Problema: muitas imagens (objetos de mapa, companheiros, veículos, naves…) estão
// gravadas DENTRO dos documentos do Firestore como texto "data:image/…;base64".
// Cada jogador baixa tudo isso ao entrar, e documentos têm limite de 1 MiB.
//
// Solução: o mestre clica em "Otimizar". Cada imagem pesada é convertida para WebP,
// enviada ao Firebase Storage (na mesma pasta que o site já usa para retratos) e o
// documento passa a guardar só o endereço da imagem.
//
// Segurança:
//  - antes de alterar qualquer coisa, um backup JSON com as imagens originais é baixado
//    no computador do mestre; o botão "Restaurar backup" desfaz tudo;
//  - cada documento é alterado só no campo da imagem (merge), um por vez;
//  - se o documento mudou desde a análise, ele é pulado;
//  - nada é apagado do Storage.

export const VERSAO='v104';
export const COLECOES=['npcs','criaturas','companheiros','veiculos','veiculosPossuidos','naves','navesPossuidas','cenarios','itens','especies'];
export const CAMPOS_IMAGEM=['imagem','image','src','retrato','imagemUrl','icone','miniatura','foto'];
export const MINIMO_BYTES=6000;
export const COMANDO_CORS="echo '[{\"origin\":[\"*\"],\"method\":[\"GET\"],\"maxAgeSeconds\":3600}]' > cors.json && gsutil cors set cors.json gs://d100-mesa-estelar.firebasestorage.app";

export function ehImagemPesada(v,min=MINIMO_BYTES){
 return typeof v==='string'&&/^data:image\/(png|jpe?g|webp|gif|bmp|avif)/i.test(v)&&v.length>=min;
}
export function objetoMapaDocId(id){return `objetoMapa_${String(id||'objeto').replace(/[^a-zA-Z0-9_-]/g,'_')}`;}
export function camposPesados(dados,min=MINIMO_BYTES){
 const out=[];if(!dados||typeof dados!=='object')return out;
 for(const campo of CAMPOS_IMAGEM)if(ehImagemPesada(dados[campo],min))out.push(campo);
 return out;
}
export function dataUrlParaBlob(dataUrl){
 const m=/^data:([^;,]+)(;base64)?,(.*)$/s.exec(String(dataUrl||''));if(!m)throw new Error('Imagem inválida.');
 const tipo=m[1],b64=!!m[2],corpo=m[3];
 if(!b64)return new Blob([decodeURIComponent(corpo)],{type:tipo});
 const bin=atob(corpo),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
 return new Blob([u],{type:tipo});
}
export async function hashCurto(blob){
 const buf=await blob.arrayBuffer(),h=await crypto.subtle.digest('SHA-256',buf);
 return [...new Uint8Array(h)].slice(0,10).map(b=>b.toString(16).padStart(2,'0')).join('');
}
export const formatarMB=b=>(b/1048576).toFixed(b>10485760?0:1)+' MB';

export async function otimizarParaWebp(dataUrl,{max=1024,qualidade=.86,root=document}={}){
 const original=dataUrlParaBlob(dataUrl);
 const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('Não foi possível ler a imagem.'));im.src=dataUrl;});
 const w0=img.naturalWidth||img.width,h0=img.naturalHeight||img.height,esc=Math.min(1,max/Math.max(w0,h0,1));
 const c=root.createElement('canvas');c.width=Math.max(1,Math.round(w0*esc));c.height=Math.max(1,Math.round(h0*esc));
 c.getContext('2d').drawImage(img,0,0,c.width,c.height);
 const webp=await new Promise(res=>c.toBlob(b=>res(b),'image/webp',qualidade));
 if(webp&&webp.type==='image/webp'&&webp.size<original.size)return {blob:webp,tipo:'image/webp',ext:'webp',largura:c.width,altura:c.height};
 const ext=(original.type.split('/')[1]||'png').replace('jpeg','jpg');
 return {blob:original,tipo:original.type,ext,largura:w0,altura:h0};
}

export function instalarBibliotecaImagens(dep){
 const {root=document,db,doc,setDoc,getDoc,getDocs,collection,storage,ref,uploadBytes,getDownloadURL}=dep;
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const objetosMapa=()=>{try{return dep.objetosMapa?.()||[];}catch(_){return [];}};
 let analise=null,ocupado=false,corsOk=null;

 async function enviar(blob,pasta,nome,tipo){
  const caminho=`personagens/${uid()}/biblioteca/${pasta}/${nome}`;
  const snap=await uploadBytes(ref(storage,caminho),blob,{contentType:tipo,cacheControl:'public,max-age=31536000,immutable'});
  return await getDownloadURL(snap.ref);
 }
 // Testa se o Storage permite que o navegador leia a imagem num canvas (CORS).
 // Exibir imagens funciona de qualquer jeito; o teste importa para as ferramentas
 // de recorte/remover fundo da Oficina, que desenham a imagem num canvas.
 async function testarCors(){
  const c=root.createElement('canvas');c.width=c.height=2;const ctx=c.getContext('2d');ctx.fillStyle='#3fd0ff';ctx.fillRect(0,0,2,2);
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  const url=await enviar(blob,'_sistema','teste-cors.png','image/png');
  return await new Promise(res=>{
   const im=new Image();im.crossOrigin='anonymous';
   const t=setTimeout(()=>res(false),12000);
   im.onload=()=>{clearTimeout(t);try{const k=root.createElement('canvas');k.width=k.height=2;k.getContext('2d').drawImage(im,0,0);k.toDataURL();res(true);}catch(_){res(false);}};
   im.onerror=()=>{clearTimeout(t);res(false);};
   im.src=/^https?:/i.test(url)?url+(url.includes('?')?'&':'?')+'cb='+Date.now():url;
  });
 }

 async function analisar(){
  const itens=[];
  for(const o of objetosMapa())for(const campo of camposPesados(o))itens.push({colecao:'configuracoes',id:objetoMapaDocId(o.id),rotulo:'Objeto · '+(o.nome||o.id),campo,valor:o[campo],objetoMapaId:o.id});
  for(const col of COLECOES){
   let snap;try{snap=await getDocs(collection(db,col));}catch(e){console.warn('[Biblioteca] coleção indisponível',col,e);continue;}
   snap.forEach(d=>{const dados=d.data()||{};for(const campo of camposPesados(dados))itens.push({colecao:col,id:d.id,rotulo:col+' · '+(dados.nome||d.id),campo,valor:dados[campo]});});
  }
  const porColecao={};for(const i of itens){const k=i.colecao==='configuracoes'?'objetos de mapa':i.colecao;porColecao[k]=porColecao[k]||{n:0,bytes:0};porColecao[k].n++;porColecao[k].bytes+=i.valor.length;}
  analise={itens,porColecao,total:itens.reduce((s,i)=>s+i.valor.length,0),quando:Date.now()};
  return analise;
 }
 function baixar(nome,texto,tipo='application/json'){
  const a=root.createElement('a');a.href=URL.createObjectURL(new Blob([texto],{type:tipo}));a.download=nome;root.body.append(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);
 }
 async function migrar(progresso){
  if(!analise)await analisar();
  const lista=analise.itens;if(!lista.length)return {ok:0,pulados:0,erros:[]};
  const data=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  baixar(`backup-imagens-mesa-${data}.json`,JSON.stringify({formato:'mesa-imagens-backup-v1',criadoEm:new Date().toISOString(),itens:lista.map(({colecao,id,campo,valor,objetoMapaId})=>({colecao,id,campo,valor,objetoMapaId}))}));
  let ok=0,pulados=0,economia=0;const erros=[];
  for(const [n,item] of lista.entries()){
   progresso?.(n,lista.length,item.rotulo);
   try{
    const atual=await getDoc(doc(db,item.colecao,item.id));
    if(!atual.exists()||atual.data()?.[item.campo]!==item.valor){pulados++;continue;}
    const r=await otimizarParaWebp(item.valor,{root});
    const nome=(await hashCurto(r.blob))+'.'+r.ext;
    const pasta=item.colecao==='configuracoes'?'objetos':item.colecao;
    const url=await enviar(r.blob,pasta,nome,r.tipo);
    await setDoc(doc(db,item.colecao,item.id),{[item.campo]:url},{merge:true});
    if(item.objetoMapaId){const o=objetosMapa().find(x=>String(x.id)===String(item.objetoMapaId));if(o)o[item.campo]=url;}
    economia+=item.valor.length;ok++;
   }catch(e){console.warn('[Biblioteca] falha',item.rotulo,e);erros.push(item.rotulo+': '+(e?.code||e?.message||e));}
  }
  progresso?.(lista.length,lista.length,'');
  analise=null;
  try{dep.aoConcluir?.();}catch(_){}
  return {ok,pulados,erros,economia};
 }
 async function restaurar(arquivo,progresso){
  const json=JSON.parse(await arquivo.text());
  if(json?.formato!=='mesa-imagens-backup-v1'||!Array.isArray(json.itens))throw new Error('Este arquivo não é um backup de imagens da Mesa.');
  let ok=0;const erros=[];
  for(const [n,i] of json.itens.entries()){
   progresso?.(n,json.itens.length,i.id);
   try{await setDoc(doc(db,i.colecao,i.id),{[i.campo]:i.valor},{merge:true});if(i.objetoMapaId){const o=objetosMapa().find(x=>String(x.id)===String(i.objetoMapaId));if(o)o[i.campo]=i.valor;}ok++;}
   catch(e){erros.push(i.id+': '+(e?.code||e?.message||e));}
  }
  progresso?.(json.itens.length,json.itens.length,'');
  analise=null;try{dep.aoConcluir?.();}catch(_){}
  return {ok,erros};
 }

 // ---------------------------------------------------------------- painel (só mestre)
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function painelHtml(){
  return `<details id="mesaBibliotecaV104" style="margin:0 0 14px;padding:10px 12px;border:1px solid #49668a;border-radius:10px;background:rgba(10,18,34,.55)">
   <summary style="cursor:pointer;font-weight:bold;color:#8ee7ff">🖼️ Biblioteca de imagens · deixar o site mais leve</summary>
   <div style="margin-top:8px;color:#c6d3e6;font-size:.92em;line-height:1.45">Move as imagens pesadas guardadas dentro do banco (objetos de mapa, companheiros, veículos, naves, NPCs…) para o Storage, em WebP. O banco passa a guardar só o endereço. Antes de mudar qualquer coisa, um backup com as imagens originais é baixado no seu computador.</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
    <button type="button" class="btn-small" data-acao="analisar">🔎 Analisar</button>
    <button type="button" class="btn-small btn-select" data-acao="otimizar" disabled>🚀 Baixar backup e otimizar</button>
    <label class="btn-small" style="cursor:pointer">↩️ Restaurar backup<input type="file" accept="application/json,.json" data-acao="restaurar" hidden></label>
   </div>
   <div data-area="barra" style="height:8px;margin-top:10px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:0;background:#3fd0ff;transition:width .2s"></i></div>
   <div data-area="status" style="min-height:3.2em;margin-top:6px;font-size:.9em;color:#c6d3e6;white-space:pre-line"></div>
  </details>`;
 }
 function instalarPainel(){
  if(!ehMestre())return;
  const aba=root.getElementById('banco-objetosMapa');if(!aba||root.getElementById('mesaBibliotecaV104'))return;
  aba.insertAdjacentHTML('afterbegin',painelHtml());
  const p=root.getElementById('mesaBibliotecaV104'),st=p.querySelector('[data-area="status"]'),barra=p.querySelector('[data-area="barra"] i'),btnOt=p.querySelector('[data-acao="otimizar"]');
  const status=t=>{st.textContent=t;};
  const prog=(n,t,r)=>{barra.style.width=(t?Math.round(n/t*100):0)+'%';status(t?`${n}/${t} ${r?'· '+r:''}`:'');};
  const travar=v=>{ocupado=v;p.querySelectorAll('button,input').forEach(b=>b.disabled=v);if(!v)btnOt.disabled=!analise?.itens?.length;};
  p.querySelector('[data-acao="analisar"]').addEventListener('click',async()=>{
   if(ocupado)return;travar(true);status('Analisando o banco…');
   try{const a=await analisar();
    const linhas=Object.entries(a.porColecao).map(([k,v])=>`• ${k}: ${v.n} imagem(ns), ${formatarMB(v.bytes)}`);
    status(a.itens.length?`Encontradas ${a.itens.length} imagens pesadas (${formatarMB(a.total)} dentro do banco).\n${linhas.join('\n')}`:'Nenhuma imagem pesada dentro do banco. Tudo certo!');
   }catch(e){status('Não foi possível analisar: '+(e?.message||e));}
   travar(false);
  });
  btnOt.addEventListener('click',async()=>{
   if(ocupado||!analise?.itens?.length)return;travar(true);
   try{
    if(corsOk===null){status('Testando o Storage…');corsOk=await testarCors();}
    if(!corsOk){
     const seguir=root.defaultView.confirm('O Storage ainda não permite editar imagens no navegador (CORS).\n\nAs imagens vão APARECER normalmente, mas "remover fundo" e "recortar" na Oficina não funcionarão nas imagens otimizadas até você configurar o Storage (instruções aparecem abaixo).\n\nOtimizar mesmo assim?');
     status('Para liberar a edição: abra console.cloud.google.com, clique no ícone do Cloud Shell (>_) no topo e cole esta linha:\n'+COMANDO_CORS);
     if(!seguir){travar(false);return;}
    }
    const r=await migrar(prog);
    status(`Concluído: ${r.ok} imagem(ns) otimizada(s), ${formatarMB(r.economia||0)} a menos no banco.${r.pulados?`\n${r.pulados} pulada(s) porque mudaram desde a análise (clique em Analisar de novo).`:''}${r.erros.length?`\n⚠️ ${r.erros.length} erro(s):\n${r.erros.slice(0,6).join('\n')}`:''}${corsOk?'':'\n\nLembrete: configure o CORS (linha acima) para recortar/remover fundo dessas imagens na Oficina.'}`);
   }catch(e){status('Interrompido: '+(e?.message||e)+'\nNada foi perdido: os itens já concluídos ficam salvos e o backup foi baixado.');}
   travar(false);
  });
  p.querySelector('[data-acao="restaurar"]').addEventListener('change',async ev=>{
   const f=ev.target.files?.[0];ev.target.value='';if(!f||ocupado)return;
   if(!root.defaultView.confirm('Restaurar as imagens originais deste backup?'))return;
   travar(true);try{const r=await restaurar(f,prog);status(`Restauradas ${r.ok} imagem(ns).${r.erros.length?`\n⚠️ ${r.erros.length} erro(s).`:''}`);}catch(e){status('Não foi possível restaurar: '+(e?.message||e));}
   travar(false);
  });
 }
 // O banco é renderizado depois do login; tentamos instalar o painel quando a aba aparece.
 const vigia=setInterval(()=>{try{instalarPainel();}catch(e){console.warn('[Biblioteca]',e);}},1500);
 return {analisar,migrar,restaurar,testarCors,instalarPainel,parar:()=>clearInterval(vigia)};
}
