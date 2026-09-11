export function criarPainelAcoes({root,load,spend,roll,attack,unlock=()=>{}}){
 const host=root.getElementById('novaSyncActionPanel'),passButton=root.getElementById('novaSyncNext');
 const cache=new Map(),preferences=new Map(),results=new Map();
 let current=null,combat=null,allowed=false,busy=false,request=0,shown='',sheet=null,view={};
 const name=token=>String(token?.nome||'').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 const node=(tag,text,className)=>{const element=root.createElement(tag);if(text)element.textContent=text;if(className)element.className=className;return element;};
 const preference=()=>preferences.get(current?.id)||{};
 const selection=()=>{const pref=preference(),skill=sheet?.skills.find(entry=>entry.id===pref.skill);return {pref,skill,weapon:skill?.weapons.find(entry=>entry.id===pref.weapon)};};
 async function execute(targetId=view.targetId){
  if(busy||!allowed||!current||!sheet)return;
  const actor=current,{skill,weapon}=selection(),turn=combat?.active?combat.turnId:null;
  if(!skill)return;
  const target=(view.tokens||[]).find(token=>token.id===targetId&&token.id!==actor.id);
  if(target&&skill.attack&&!weapon)return;
  unlock();busy=true;render();
  try{
   let text;
   if(turn&&target&&skill.attack){
    results.set(actor.id,{text:'Ataque enviado · aguardando confirmação do mestre…',at:Date.now()});render();
    text=await attack({actorId:actor.id,targetId:target.id,skillId:skill.id,weaponId:weapon.id,turnId:turn});
   }
   else{
    if(turn&&!await spend(actor.id,turn))return;
    const value=weapon?.valor??skill.valor,outcome=roll(value);
    text=skill.nome+': '+outcome.die+' / '+value+' → '+outcome.grau;
   }
   results.set(actor.id,{text,at:Date.now()});
  }catch(error){results.set(actor.id,{text:'Não foi possível agir: '+error.message,at:Date.now()});}
  finally{busy=false;render();}
 }
 function render(){
  if(!host)return;
  if(passButton)root.getElementById('novaSyncActionParking')?.append(passButton);
  host.replaceChildren();
  if(!current){host.append(node('div',view.masterMode?'Modo Mestre · arraste miniaturas e objetos ou use o lápis para desenhar.':'Selecione em “Atuar como” o personagem que deseja controlar.'));return;}
  if(!sheet)return;
  host.append(node('strong','🎯 Ação de '+name(current),'nova-action-title'));
  if(view.defenses!==null&&view.defenses!==undefined)host.append(node('div','Defesas disponíveis: '+view.defenses+' · reserva separada das Ações','nova-target-hint'));
  const line=node('div',null,'nova-action-row'),skills=node('select'),weapons=node('select');
  skills.id='novaSyncSkill';weapons.id='novaSyncWeapon';
  for(const [label,control]of [['Ação / Perícia',skills],['Arma / ataque',weapons]]){
   const wrapper=node('label');wrapper.append(node('small',label),control);line.append(wrapper);
  }
  const pref=preference();
  for(const skill of sheet.skills){const option=node('option',skill.nome+' ('+skill.valor+'%)');option.value=skill.id;skills.append(option);}
  if(sheet.skills.some(skill=>skill.id===pref.skill))skills.value=pref.skill;
  pref.skill=skills.value;preferences.set(current.id,pref);
  const ammoLabel=node('label'),ammo=node('output',null,'nova-ammo');ammo.id='novaSyncAmmo';ammoLabel.append(node('small','Munição'),ammo);line.append(ammoLabel);
  if(passButton)line.append(passButton);
  const button=node('button','🎲 Testar','btn-small btn-select');button.id='novaSyncTest';button.type='button';line.append(button);
  const description=node('div',null,'nova-action-description'),targetHint=node('div',null,'nova-target-hint');
  const paint=()=>{
   const {skill,weapon}=selection();
   description.textContent=['ℹ️',skill?.descricao,weapon?.descricao,weapon?.dano?'🎲 Dano '+weapon.dano:''].filter(Boolean).join(' · ');
   const ammunition=weapon?.ammunition;
   ammo.textContent=ammunition?String(view.health?.municaoLab?.[ammunition.key]??ammunition.capacity)+' / '+ammunition.capacity:'—';
   ammo.title=ammunition?'Carga atual / capacidade da arma selecionada':'Esta arma não usa munição';
   const target=(view.tokens||[]).find(token=>token.id===view.targetId&&token.id!==current.id);
   targetHint.textContent=target?'🎯 '+name(target)+' selecionado · Testar executa a ação nesse alvo.':'Clique numa miniatura para selecionar o alvo. Sem alvo, Testar apenas rola a perícia.';
   button.disabled=!allowed||busy||!skill||!!(target&&skill.attack&&!weapon);
  };
  const populateWeapons=()=>{
   const skill=sheet.skills.find(entry=>entry.id===skills.value);pref.skill=skills.value;
   weapons.replaceChildren();for(const weapon of skill?.weapons||[]){const option=node('option',weapon.nome);option.value=weapon.id;weapons.append(option);}
   if(skill?.weapons.some(weapon=>weapon.id===pref.weapon))weapons.value=pref.weapon;
   pref.weapon=weapons.value;paint();
  };
  skills.addEventListener('change',populateWeapons);weapons.addEventListener('change',()=>{pref.weapon=weapons.value;paint();});
  button.addEventListener('click',()=>execute());populateWeapons();
  const pv=node('div'),health=view.health?.combateLab||sheet.health;
  pv.append(node('div','SEUS PV · '+name(current),'nova-pv-title'));
  if(health){
   const state=health.morto?'Morto':health.inconsciente?'Inconsciente':health.incapacitado?'Incapacitado':'';
   if(state)pv.append(node('div',state+' · não pode atacar neste estado; a indicação de turno permanece válida.','nova-state-warning'));
   const grid=node('div',null,'nova-pv-grid'),order=['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda'];
   const locations=Object.keys(health.hitMax||{}).sort((left,right)=>(order.includes(left)?order.indexOf(left):99)-(order.includes(right)?order.indexOf(right):99));
   for(const location of locations){
    const cell=node('div',null,'nova-pv-cell'),short=location.replace('Direito','D.').replace('Esquerdo','E.').replace('Direita','D.').replace('Esquerda','E.');
    cell.append(node('small',short),node('b','PV '+health.hit[location]+'/'+health.hitMax[location]),node('small','PA '+(health.armor?.[location]||0),'nova-armor'));grid.append(cell);
   }pv.append(grid);
  }else pv.innerHTML=sheet.pvHtml||'';
  const own=results.get(current.id),result=node('div',(own?.at>(view.event?.ts||0)?own.text:view.event?.message)||own?.text||'','nova-result');
  host.append(line,description,pv,result,targetHint);
 }
 const update=async(token,packet,canAct,extra={})=>{
  if(!host)return;
  const changed=current?.id!==token?.id;current=token;combat=packet;allowed=canAct;view=extra;if(changed)sheet=null;
  const key=JSON.stringify([token?.id,packet?.turnId,canAct,extra.health,extra.targetId,extra.event?.id,extra.masterMode,extra.defenses]);
  if(shown===key)return;shown=key;const pending=++request;
  if(!token){render();return;}
  try{
   const healthKey=JSON.stringify(extra.health||{}),cached=cache.get(token.id);
   if(!cached||cached.healthKey!==healthKey)cache.set(token.id,{healthKey,promise:load({...token,...extra.health})});
   const data=await cache.get(token.id).promise;if(pending!==request)return;sheet=data;render();
  }catch(error){cache.delete(token.id);if(pending===request)host.textContent='Não foi possível carregar a ficha: '+error.message;}
 };
 update.setTarget=targetId=>{view={...view,targetId};render();};
 update.triggerAttack=()=>execute();
 return update;
}
