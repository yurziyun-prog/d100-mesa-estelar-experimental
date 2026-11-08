// Mesa Estelar v178 — Site mais leve: imagens de objetos do banco guardadas DENTRO do documento (data:…, base64) viram
// arquivos. Cada abertura da mesa do mestre baixava todas elas (vários MB). Agora:
//  • modelos dos mapas do GPT (Therion, cidade sem nome) → arte/modelos/<id>.webp, que já vai junto com o site;
//  • outros com imagem embutida grande (> 40 KB) → enviados uma vez ao Storage (o mesmo das imagens de NPCs).
// Só no navegador do mestre, poucos por vez, sem travar; se o envio falhar, o objeto fica como estava.

import {MODELOS_HOSPEDADOS} from './mesa-gpt-mapas.js?v=178';

export const LIMITE_EMBUTIDA=40000;
export const precisaAliviar=o=>typeof o?.imagem==='string'&&o.imagem.startsWith('data:image/')&&(MODELOS_HOSPEDADOS.includes(String(o.id))||o.imagem.length>LIMITE_EMBUTIDA);
export const docIdObjeto=id=>`objetoMapa_${String(id||'objeto').replace(/[^a-zA-Z0-9_-]/g,'_')}`;

export function instalarLeveza(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,...p.split('/'));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 let rodando=false,feitos=0,falhas=new Set();
 async function aliviar(){
  if(rodando||!ehMestre())return;const lista=(dep.objetos?.()||[]).filter(o=>precisaAliviar(o)&&!falhas.has(String(o.id)));if(!lista.length)return;
  rodando=true;
  try{
   for(const o of lista.slice(0,6)){
    const id=String(o.id);let url='';
    try{
     if(MODELOS_HOSPEDADOS.includes(id))url=new URL('arte/modelos/'+id+'.webp',win.location.href).href;
     else if(dep.enviarImagem){const blob=await (await fetch(o.imagem)).blob();const ext=(blob.type.split('/')[1]||'png').replace('svg+xml','svg');url=await dep.enviarImagem(new File([blob],id+'.'+ext,{type:blob.type}));}
     if(!url){falhas.add(id);continue;}
     await dep.setDoc(D('configuracoes/'+docIdObjeto(id)),{imagem:url,imagemLeveV178:{em:new Date().toISOString(),antes:o.imagem.length}},{merge:true});
     o.imagem=url;feitos++;
    }catch(e){console.warn('[Leveza]',id,e?.message||e);falhas.add(id);}
   }
   if(feitos)console.info('[Leveza] imagens de objetos guardadas como arquivo:',feitos);
  }finally{rodando=false;}
 }
 const vigia=setInterval(()=>{void aliviar();},15000);setTimeout(()=>void aliviar(),20000);
 win.mesaLevezaV178={aliviar,feitos:()=>feitos};
 return {parar(){clearInterval(vigia);}};
}
