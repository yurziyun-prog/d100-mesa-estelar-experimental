// Mesa Estelar v141 — Comerciantes genéricos (de raças diferentes) com nome descoberto na conversa.
//
// • Modelos no banco de NPCs: "Comerciante" humano, reptiliano, insetoide, nymari, zutariano e grey (comerciante_generico_<raça>).
// • No mapa aparecem como "Comerciante 1", "Comerciante 2"… Quando um jogador fala com um deles (clica na miniatura),
//   o mestre sorteia um nome da raça e grava; para ESSE jogador a legenda passa a mostrar o nome. O mestre vê os dois.
// • Uns ficam na barraca e se mexem pouco; outros (ambulantes) andam pela feira.
// • Uma vez: as cópias numeradas de NPCs com nome (ex.: "Hessa Varn 30") viram comerciantes genéricos, espalhados pelas barracas.

import {gerarNpc,ESPECIES_NPC} from './mesa-diretor-dados.js?v=108';
import {renderizarMiniatura,specDeNpc,MARCA_MINI} from './mesa-miniaturas.js?v=194';

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
export const ESTADO='combatesAtivos/mesaComerciantes',PEDIDOS='combatesAtivos/mesaComerciantes/acoes';
export const RACAS=['humano','reptiliano','insetoide','nymari','zutariano','grey','robo']; // v160: + robô
export const MAX_POR_MAPA=8,DIST_MIN=3.5;
export const idModelo=esp=>'comerciante_generico_'+esp;
export const ehGenerico=id=>/^syncnpc:comerciante_generico_[a-z]+(~\d+)?$/.test(decodeURIComponent(String(id||'')));
export const especieDoToken=id=>(/^syncnpc:comerciante_generico_([a-z]+)/.exec(decodeURIComponent(String(id||'')))||[])[1]||'';
// Nome que este usuário vê na legenda (undefined = não mexe).
export function nomeVisivel(t,meta,{uid='',mestre=false}={}){
 if(!t||!ehGenerico(t.id))return undefined;const m=meta?.[t.id]||meta?.[decodeURIComponent(t.id)];
 if(!m?.nomeReal)return undefined;
 if(mestre)return `${t.nome} · ${m.nomeReal}`;
 return m.conhecidoPor?.[uid]?m.nomeReal:undefined;
}
// Cópias numeradas de NPCs com nome (syncnpc:x~k) que são comerciantes.
export function copiasDeComerciantes(tokens=[],npcs=[]){
 const com=new Set(npcs.filter(n=>n?.comerciante===true||String(n?.comerciante)==='true').map(n=>String(n.id)));
 return tokens.filter(t=>{const m=/^syncnpc:([^~]+)~\d+$/.exec(decodeURIComponent(String(t.id||'')));return m&&com.has(m[1])&&!/^comerciante_generico_[a-z]+$/.test(m[1]);});
}
// Espalha: devolve novas posições (normalizadas) para quem está a menos de DIST_MIN de outro comerciante, perto de barracas livres.
export function espalhar(lista,barracas,W=28,H=14,dist=DIST_MIN){
 const dM=(a,b)=>Math.hypot((a.x-b.x)*W/28,(a.y-b.y)*H/14),fix=[],out=new Map();
 for(const t of lista){
  if(!fix.some(o=>dM(o,t)<dist)){fix.push({x:t.x,y:t.y});continue;}
  const b=barracas.find(b=>!fix.some(o=>dM(o,b)<dist));
  const p=b?{x:Number(b.x),y:Math.min(13.4,Number(b.y)+(Number(b.alturaM)||3)/2*14/H+.9*14/H)}:{x:Math.max(.8,Math.min(27.2,t.x+(fix.length%5-2)*dist*28/W)),y:t.y};
  fix.push(p);out.set(t.id,p);
 }
 return out;
}

export function instalarComerciantes(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 let meta={},parar=[],assinado='',migrado=false,migrando=false,tentativas=0;const processados=new Set();
 win.mesaNomeVisivelV141=t=>nomeVisivel(t,meta,{uid:uid(),mestre:ehMestre()});

 // ------------------------------------------------------------ modelos no banco
 let criandoModelos=null;
 async function garantirModelos(){
  if(!ehMestre())return [];
  if(criandoModelos)return criandoModelos;
  criandoModelos=(async()=>{
   const npcs=dep.npcs?.()||[],base=npcs.find(n=>String(n.id)==='comerciante_generico_1')||npcs.find(n=>n.comerciante===true||String(n.comerciante)==='true');
   const feitos=[];
   for(const [i,esp] of RACAS.entries()){
    const id=idModelo(esp);if(npcs.some(n=>String(n.id)===id))continue;
    const bruto={...gerarNpc({especie:esp,papel:'comerciante',rnd:(s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296))(1410+i)}),id,nome:'Comerciante',
     comerciante:'true',comercioNome:'Barraca',estoqueComercio:String(base?.estoqueComercio||''),comercioBarganha:'true',comercioCompraJogador:'true',comercioCompraPct:'100',comercioVendaPct:'50',
     descricao:`Comerciante ${ESPECIES_NPC[esp]?.nome||esp} das feiras de Véspera. O nome só aparece para quem conversa com ele.`};
    let modelo=bruto;try{modelo=dep.normalizar?dep.normalizar('npcs',bruto):bruto;}catch(_){}
    Object.assign(modelo,{id,nome:'Comerciante',genericoV141:true,especieV141:esp},esp==='robo'?{tipo:'Robô',raca:'Robô',carreira:'Unidade de comércio',conceito:'Robô mercador de chassis remendado'}:{});
    try{const sp=specDeNpc(modelo),blob=new Blob([renderizarMiniatura(sp)],{type:'image/svg+xml'});
     const snap=await dep.uploadBytes(dep.ref(dep.storage,`personagens/${uid()}/miniaturas/npcs-${id}.svg`),blob,{contentType:'image/svg+xml',cacheControl:'public,max-age=31536000'});
     modelo.miniatura={url:(await dep.getDownloadURL(snap.ref))+MARCA_MINI,spec:sp,tipo:'montada',atualizadoEm:new Date().toISOString()};}catch(e){console.warn('[Comerciantes] miniatura',esp,e);}
    await dep.setDoc(D('npcs/'+id),clean(modelo));try{npcs.push(modelo);}catch(_){}feitos.push(esp);
   }
   if(feitos.length)try{await win.publicarComerciantesV141_?.();}catch(_){}
   return RACAS.map(idModelo);
  })();
  try{return await criandoModelos;}finally{criandoModelos=null;}
 }
 // próximo número livre (Comerciante N) entre todas as miniaturas
 let ultimoNumero=0;
 function proximoNumero(){
  let n=ultimoNumero;for(const t of (ctl()?.todosTokens?.()||[])){const id=decodeURIComponent(String(t.id||''));if(!ehGenerico(id))continue;const k=Number((/~(\d+)$/.exec(id)||[])[1]||1);if(k>n)n=k;const m=/comerciante (\d+)/i.exec(String(t.nome||''));if(m&&Number(m[1])>n)n=Number(m[1]);}
  ultimoNumero=n+1;return ultimoNumero;
 }
 // cria um comerciante genérico no mapa (raça em rodízio)
 async function novo(mapId,x,y,{ambulante=null,especie=''}={}){
  await garantirModelos();
  const n=proximoNumero(),esp=RACAS.includes(especie)?especie:RACAS[(n-1)%RACAS.length],modelo=(dep.npcs?.()||[]).find(m=>String(m.id)===idModelo(esp));
  const id=encodeURIComponent('syncnpc:'+idModelo(esp)+'~'+n);
  await dep.setDoc(D(POS+'/'+id),clean({nome:'Comerciante '+n,imagem:String(modelo?.miniatura?.url||modelo?.imagem||''),donoUid:'',x:+Number(x).toFixed(3),y:+Number(y).toFixed(3),revision:0,facing:Math.PI/2,camada:3,mapaId:String(mapId),diametroM:1}));
  await gravarMeta(id,{especie:esp,ambulante:ambulante??(n%3===0)});
  return id;
 }
 async function gravarMeta(id,patch){
  await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(ESTADO)),v=s.exists()?s.data():{};const nomes={...(v.nomes||{})};nomes[id]={...(nomes[id]||{}),...patch};tx.set(D(ESTADO),clean({...v,nomes,atualizadoEm:Date.now()}));});
  meta={...meta,[id]:{...(meta[id]||{}),...patch}};
 }
 // ------------------------------------------------------------ conversa: o nome aparece para quem falou
 async function conhecer(tokenId){
  const id=String(tokenId||'');if(!ehGenerico(id))return;
  if(meta[id]?.conhecidoPor?.[uid()])return;
  const cmd={donoUid:uid(),personagemId:String(ctl()?.ator?.()?.id||'jogador'),alvo:id,criadoEm:Date.now()};
  if(ehMestre())await processar('local'+Date.now(),cmd);else await dep.setDoc(D(PEDIDOS+'/c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),cmd);
 }
 async function processar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);
  try{
   const id=String(cmd.alvo||'');if(!ehGenerico(id))return;const m=meta[id]||{};
   const esp=m.especie||especieDoToken(id)||'humano';
   const nomeReal=m.nomeReal||gerarNpc({especie:esp,papel:'comerciante'}).nome;
   await gravarMeta(id,{nomeReal,especie:esp,conhecidoPor:{...(m.conhecidoPor||{}),[String(cmd.donoUid||'')]:true}});
  }catch(e){console.warn('[Comerciantes]',e);}
  finally{if(!String(pid).startsWith('local'))try{await dep.deleteDoc?.(D(PEDIDOS+'/'+pid));}catch(_){}}
 }
 // ------------------------------------------------------------ uma vez: cópias numeradas → comerciantes genéricos espalhados
 async function migrar(){
  if(migrado||migrando||!ehMestre()||!ctl()?.todosTokens||!(dep.npcs?.()||[]).length)return;
  const flag=D('configuracoes/comerciantesV141');
  try{if((await dep.getDoc(flag)).exists()){migrado=true;return;}}catch(_){return;}
  if(++tentativas>2){migrado=true;return;} // nunca fica repetindo
  migrando=true;const log=[];
  try{
   await garantirModelos();
   const toks=ctl().todosTokens(),copias=copiasDeComerciantes(toks,dep.npcs?.()||[]);
   const porMapa=new Map();for(const t of copias){const k=String(t.mapaId||'');if(!porMapa.has(k))porMapa.set(k,[]);porMapa.get(k).push(t);}
   let trocados=0,tirados=0;
   for(const [mapId,lista] of porMapa){
    const ja=toks.filter(t=>String(t.mapaId||'')===mapId&&ehGenerico(t.id)).length,cabe=Math.max(0,MAX_POR_MAPA-ja);
    let cena=null;try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(mapId)));if(s.exists())cena=s.data();}catch(_){}
    const m=(dep.mapas?.()||[]).find(x=>String(x.id)===mapId),W=Number(m?.larguraM)||28,H=Number(m?.alturaM)||14;
    const barracas=(cena?.objects||[]).filter(o=>/barraca|banca/i.test(String(o.nome||'')));
    const pos=espalhar(lista.slice(0,cabe),barracas,W,H);
    for(const [i,t] of lista.entries()){
     try{if(i<cabe){const p=pos.get(t.id)||{x:t.x,y:t.y};await novo(mapId,p.x,p.y);trocados++;}else tirados++;await dep.deleteDoc(D(POS+'/'+t.id));}catch(e){console.warn('[Comerciantes] troca',t.id,e);}
    }
    log.push(`${m?.nome||mapId}: ${Math.min(lista.length,cabe)}`);
   }
   await dep.setDoc(flag,{em:new Date().toISOString(),trocados,tirados,mapas:log});
   try{await win.publicarComerciantesV141_?.();}catch(_){}
   if(trocados||tirados){const n=root.createElement('div');n.textContent=`🛒 ${trocados} cópia(s) de comerciantes com nome viraram “Comerciante N” de raças diferentes, espalhados pelas barracas${tirados?` (${tirados} sobrando foram tiradas)`:''}. O nome de cada um aparece para o jogador quando ele conversa com ele.`;n.style.cssText='position:fixed;left:16px;bottom:190px;z-index:9999;background:#2a2214;border:1px solid #ffd447;color:#ffe9a8;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:560px';root.body.append(n);setTimeout(()=>n.remove(),12000);}
   migrado=true;
  }catch(e){console.warn('[Comerciantes] migração',e);}
  finally{migrando=false;}
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(ESTADO),s=>{meta=s.exists()?(s.data()?.nomes||{}):{};},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},()=>{}));
 }
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}void migrar();}catch(e){console.warn('[Comerciantes]',e);}},3000);
 win.mesaComerciantes={novo,conhecer,garantirModelos,ambulante:id=>!!meta[id]?.ambulante,meta:()=>meta};
 return {parar(){clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});}};
}
