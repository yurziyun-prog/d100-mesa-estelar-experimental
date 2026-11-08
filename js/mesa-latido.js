// A aba visível acorda o motor na aba do mestre da MESMA conta/origem.
// Não carrega comandos nem resultados; a autoridade continua validando no banco.
export function instalarLatidoMesa({root=globalThis.document,uid,acordar,aoComando=()=>{}}){
 if(!root)return {parar(){},comando(){}};
 const win=root.defaultView||globalThis.window;if(!win?.BroadcastChannel)return {parar(){},comando(){}};
 const canal=new win.BroadcastChannel('mesa-motor-v217');let fechado=false,ultimo=0;
 const enviar=tipo=>{if(!fechado&&uid()&&root.visibilityState!=='hidden')canal.postMessage({tipo,uid:uid()});};
 const timer=win.setInterval(()=>enviar('latido'),250);
 canal.onmessage=e=>{const d=e.data;if(fechado||!uid()||d?.uid!==uid())return;
  if(d.tipo==='latido'&&root.visibilityState==='hidden'&&Date.now()-ultimo>180){ultimo=Date.now();acordar();}
  if(d.tipo==='comando'&&typeof d.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(d.id))aoComando(d.id);
 };
 return {comando:id=>{if(uid())canal.postMessage({tipo:'comando',uid:uid(),id});},parar(){fechado=true;win.clearInterval(timer);canal.close();}};
}
