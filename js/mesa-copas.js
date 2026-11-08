// Mesa Estelar v203 — Copas de árvore: (1) para QUEM está embaixo dela, a copa fica meio transparente (só para essa pessoa) para ver o personagem em relação ao tronco;
// (2) derrubado o tronco (cortado, queimado, destruído), a copa some junto (o mestre atualiza a cena).
// O tronco é uma peça sólida e menor que a copa (ver troncoDaCopa no Editor rápido): dá para se esconder atrás dele; por baixo da copa o resto é passável.
const SCENE='combatesAtivos/mapaMesaSyncDiretaCena';
export function copaEmbaixo(copa,tokens,W=28,H=14){
 const cx=Number(copa.x)*W/28,cy=Number(copa.y)*H/14,r=(Number(copa.larguraM)||4)/2*.82;
 return tokens.some(t=>Math.hypot(Number(t.x)*W/28-cx,Number(t.y)*H/14-cy)<r);
}
export const ehCopa=o=>o&&(o.erTipo==='copa'||o.oficina3==='copa');
/** ids das copas cujo tronco já caiu */
export function copasOrfas(objs=[]){
 const mortos=new Set(objs.filter(o=>o.erTipo==='tronco'&&(o.destruido||Number(o.pvAtual??o.pvMax)<=0&&o.destrutivel)).map(o=>o.grupoArvoreV203).filter(Boolean));
 return objs.filter(o=>ehCopa(o)&&o.grupoArvoreV203&&mortos.has(o.grupoArvoreV203)).map(o=>String(o.id));
}
export function instalarCopas(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const D=p=>dep.doc(dep.db,p);
 const estado=new Map();let ocupado=false,ultimaLimpeza=0;
 function transparencia(){
  const c=ctl();if(!c)return;const cena=c.cenaAtual?.(),b=root.getElementById('novaSyncBoard');if(!cena||!b)return;
  const d=c.dimsAtual?.()||{W:28,H:14},ator=c.ator?.();
  const meus=ator&&c.controla?.(ator)?[ator]:(c.tokensNoMapa?.()||[]).filter(t=>t.donoUid&&c.controla?.(t));
  for(const o of cena.objects||[]){if(!ehCopa(o))continue;const sob=!!(meus.length&&copaEmbaixo(o,meus,d.W,d.H)),id=String(o.id);
   const n=b.querySelector(`[data-scene-object="${CSS.escape(id)}"]`);if(!n)continue;const e=estado.get(id);if(e&&e.sob===sob&&e.n===n)continue;estado.set(id,{sob,n});
   n.style.transition='opacity .25s';n.style.opacity=sob?'.35':String(o.opacity??1);}
 }
 async function limpar(){
  if(!ehMestre()||ocupado||Date.now()-ultimaLimpeza<2000)return;ultimaLimpeza=Date.now();
  const c=ctl(),objs=c?.cenaAtual?.()?.objects||[],orf=copasOrfas(objs);if(!orf.length)return;
  ocupado=true;
  try{const set=new Set(orf);
   await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(SCENE));if(!s.exists())return;const cena=s.data(),novo=(cena.objects||[]).filter(o=>!set.has(String(o.id)));if(novo.length!==(cena.objects||[]).length)tx.set(D(SCENE),{...cena,objects:novo});});
  }catch(e){console.warn('[Copas]',e?.message||e);}finally{ocupado=false;}
 }
 const iv=setInterval(()=>{try{transparencia();void limpar();}catch(e){console.warn('[Copas]',e);}},250);iv.unref?.();
 const api={parar:()=>clearInterval(iv),transparencia,limpar};win.mesaCopasV203=api;return api;
}
