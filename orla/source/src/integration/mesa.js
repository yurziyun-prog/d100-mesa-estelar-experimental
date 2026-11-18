import {state as s} from '../core/state.js';
export function installMesaSession(){
 if(window.parent===window||!new URLSearchParams(location.search).has('mesa'))return;
 let role='';const control=s.controlCharacter;
 s.controlCharacter=id=>role==='jogador'&&id!=='traveler'?false:control(id);
 s.setRole=id=>s.controlCharacter(id);
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent||event.data?.app!=='mesa-orla-context')return;
  const c=event.data.context;if(!c)return;
  role=c.role==='mestre'?'mestre':'jogador';
  const p=s.campaign.party.find(a=>a.id==='traveler');
  if(p&&role==='jogador')p.name=String(c.character?.name||'Viajante').slice(0,60);
  s.controlCharacter(role==='mestre'?'god':'traveler');
  const b=document.getElementById('roleBtn');if(b){b.disabled=role!=='mestre';b.title=role==='mestre'?'Mestre da campanha':'Personagem da sua conta no Mesa';}
 });
 parent.postMessage({app:'orla-mesa-ready'},location.origin);
}
