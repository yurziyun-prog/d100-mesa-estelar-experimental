export function installOrlaTab(readSession){
 const button=document.getElementById('orlaTabBtn'),panel=document.getElementById('orla'),message=document.getElementById('orlaAccount');let frame,key='';
 function context(){const s=readSession();if(!s?.uid)return null;const owned=(s.characters||[]).filter(c=>c.dono===s.uid&&c.tipo!=='npc'&&c.ativoNaCampanha!==false);const character=owned.find(c=>c.id===s.selected)||(owned.length===1?owned[0]:null);return {uid:s.uid,role:s.role,character:character?{id:character.id,name:character.nome}:null};}
 function refresh(){const c=context();if(!c){frame?.remove();frame=null;key='';message.textContent='Entre com sua conta do Mesa Estelar.';return;}if(c.role!=='mestre'&&!c.character){frame?.remove();frame=null;key='';message.textContent='Selecione seu personagem na aba Ficha e volte à Orla.';return;}message.textContent=(c.role==='mestre'?'Mestre · Deus':c.character.name)+' · Exploração local; mapa compartilhado em integração.';if(!frame&&panel.classList.contains('active')){frame=document.createElement('iframe');frame.id='orlaGame';frame.title='Orla · cenário original';frame.allowFullscreen=true;frame.style.cssText='width:100%;height:75dvh;min-height:480px;border:1px solid #655789;border-radius:12px';frame.src='./orla/?mesa=1';panel.append(frame);frame.addEventListener('load',()=>send());}const next=JSON.stringify(c);if(next!==key){key=next;send();}}
 function send(){const c=context();if(frame&&c)frame.contentWindow.postMessage({app:'mesa-orla-context',context:c},location.origin);}
 button.addEventListener('click',()=>{window.mostrarAba('orla',button);refresh();});
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame?.contentWindow&&e.data?.app==='orla-mesa-ready')send();});
 setInterval(refresh,800);
}
