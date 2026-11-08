// Mesa Estelar v205 — A SETA DO MOUSE MUDA conforme o que o mestre selecionou (antes: igual em tudo, e arrastar mexia a câmera ou desenhava sem aviso).
//   câmera (nada selecionado)  → mãozinha ✋ (agarra e arrasta o mapa)       mover peças (↖️ Selecionar e mover / forma "Selecionar") → ✥ mover
//   construir (parede, piso, cômodo, escada…) → mira ✛                          apagar / borracha → 🗑️                      colocar móvel/luz → cópia ⊕                          pincel → 🖌️
// Também mostra uma etiqueta discreta com o modo ("🖱️ Mover peças — o chão do mapa fica fixo"). Só desenho: não muda nenhuma função. Módulo à parte.
const svgCursor=(emoji,x=6,y=6)=>"url(\"data:image/svg+xml;utf8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><text x="2" y="23" font-size="22">'+emoji+'</text></svg>')+"\") "+x+" "+y;
export const MODOS={
 camera:{rotulo:'✋ Câmera — arraste para mover o mapa',cursor:'grab',ativo:'grabbing'},
 mover:{rotulo:'↖️ Mover peças — o chão básico fica fixo (arrastá-lo move a câmera)',cursor:'move',ativo:'move'},
 construir:{rotulo:'✛ Construir — arraste para desenhar',cursor:'crosshair',ativo:'crosshair'},
 apagar:{rotulo:'🗑️ Apagar — clique/arraste sobre a peça',cursor:svgCursor('🗑️',8,8)+', not-allowed',ativo:svgCursor('🗑️',8,8)+', not-allowed'},
 colocar:{rotulo:'⊕ Colocar — clique para pôr a peça',cursor:'copy',ativo:'copy'},
 pincel:{rotulo:'🖌️ Pincel — arraste para espalhar',cursor:svgCursor('🖌️',4,24)+', crosshair',ativo:svgCursor('🖌️',4,24)+', crosshair'},
 desenhar:{rotulo:'✏️ Desenhar forma — arraste no mapa',cursor:'crosshair',ativo:'crosshair'}
};
/** modo do mouse a partir da ferramenta do Editor rápido (data-ferr) ou da forma do editor clássico */
export function modoDaFerramenta(ferr,forma=''){
 if(ferr){if(ferr==='mover')return 'mover';if(/^(apagar_peca|tirar_area|tirar_bloco|borracha)$/.test(ferr))return 'apagar';if(/^(objeto|luz|copa)$/.test(ferr))return 'colocar';if(/^(espalhar)$/.test(ferr))return 'pincel';return 'construir';}
 if(forma){return forma==='move'?'mover':'desenhar';}
 return 'camera';
}
export function instalarCursorModos({root=document,controller}={}){
 const win=root.defaultView||window;let ult='';
 if(!root.getElementById('cursorModosV205')){const st=root.createElement('style');st.id='cursorModosV205';
  st.textContent=Object.entries(MODOS).map(([k,m])=>`#novaSyncBoard[data-modo-mouse="${k}"],#novaSyncBoard.er-ativa[data-modo-mouse="${k}"]{cursor:${m.cursor}!important}#novaSyncBoard[data-modo-mouse="${k}"]:active{cursor:${m.ativo}!important}`).join('\n')+
  '\n#modoMouseV205{position:absolute;left:8px;top:8px;z-index:37;padding:3px 10px;border-radius:999px;background:rgba(9,15,29,.82);border:1px solid #3b5878;color:#e8eefc;font:600 12px "Segoe UI",Arial,sans-serif;pointer-events:none;opacity:.92}';
  root.head.append(st);}
 function tick(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;
  let mestre=false;try{mestre=!!controller?.()?.mestre?.();}catch(_){}
  const painel=root.getElementById('erPainel'),aberto=!!painel&&!painel.hidden&&painel.offsetParent!==null,ferr=aberto?String(b.dataset.ferr||''):'';
  const tools=root.getElementById('novaSyncEditorTools'),clas=!!tools&&tools.offsetParent!==null,forma=clas?String(root.getElementById('novaSyncShape')?.value||''):'';
  const modo=aberto&&!ferr?'camera':modoDaFerramenta(ferr,aberto?'':forma);
  const jogador=!mestre&&!aberto&&!clas;
  const alvo=jogador?'':modo;
  if(alvo!==ult){ult=alvo;if(alvo)b.dataset.modoMouse=alvo;else delete b.dataset.modoMouse;
   const sc=b.parentElement;let e=root.getElementById('modoMouseV205');
   if(!alvo){e?.remove();}else if(sc){if(!e){e=root.createElement('div');e.id='modoMouseV205';sc.append(e);}e.textContent=MODOS[alvo].rotulo;}}
 }
 const iv=setInterval(()=>{try{tick();}catch(e){console.warn('[Cursor]',e);}},250);iv.unref?.();
 const api={tick,modo:()=>ult,parar:()=>clearInterval(iv)};win.mesaCursorModosV205=api;return api;
}
