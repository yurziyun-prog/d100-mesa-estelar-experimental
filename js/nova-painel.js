import {extintor} from './nova-fogo.js?v=50';
import {bonusConsciencia} from './nova-recuperacao.js?v=99';
import {emComa} from './nova-coma.js?v=134';
import {ataqueDaArma,ataquesPorArma} from './mesa-ataques-por-arma.js';
import {painelSuporte} from './nova-suporte-painel.js?v=57';
import {ocupado} from './nova-suporte.js?v=46';
export function criarPainelAcoes({root,load,spend,roll,attack,support,loadout=()=>{},unlock=()=>{}}){
 const host=root.getElementById('novaSyncActionPanel'),passButton=root.getElementById('novaSyncNext');
 const cache=new Map(),preferences=new Map(),results=new Map(),syncedLoadouts=new Map();
 let current=null,combat=null,allowed=false,busy=false,request=0,shown='',sheet=null,view={};
 const name=token=>String(token?.nome||'').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 const node=(tag,text,className)=>{const element=root.createElement(tag);if(text)element.textContent=text;if(className)element.className=className;return element;};
 const preference=()=>preferences.get(current?.id)||{};
 const selection=()=>{const pref=preference(),skill=sheet?.skills.find(entry=>entry.id===pref.skill);return {pref,skill,weapon:skill?.weapons.find(entry=>entry.id===pref.weapon)};};
 const dizer=(texto)=>{if(!current)return;results.set(current.id,{text:texto,at:Date.now(),aviso:true});render();}; // aviso: fica por cima do último evento da mesa por alguns segundos
 async function execute(targetId=view.targetId){
  if(busy)return;
  if(globalThis.mesaArrastoOcupadoV217?.(current?.id))return dizer('Solte a carga para atacar ou usar poderes.');
  if(!current)return;
  if(!sheet)return dizer('⚠️ A ficha deste personagem ainda não carregou. Escolha-o de novo em “Atuar como” e espere um instante.');
  if(!allowed)return dizer('⚠️ Você não controla este personagem agora (escolha-o em “Atuar como”; se há combate por turnos, espere a sua vez).');
  if(ocupado(view.health,combat)){results.set(current.id,{text:'Seu turno está dedicado a Primeiros Socorros. Use os controles de atendimento abaixo.',at:Date.now()});render();return;}
  const actor=current,{skill,weapon}=selection(),turn=combat?.active?combat.turnId:null;
  if(!skill)return dizer('⚠️ Este personagem não tem perícia de ataque na ficha. Treine uma perícia de combate ou equipe uma arma.');
  const object=(view.objects||[]).find(o=>o.id===targetId),target=(view.tokens||[]).find(token=>token.id===targetId&&token.id!==actor.id)||object;
  if(target&&skill.attack&&!weapon)return dizer('⚠️ Sem arma ou ataque escolhido: equipe uma arma no inventário (a perícia certa aparece sozinha) ou escolha um ataque natural/desarmado em “Arma / ataque”.');
  if(!target&&skill.attack&&weapon&&view.masterMode!==true)dizer('ℹ️ Sem alvo: clique numa miniatura para selecionar quem atacar. Agora só rola a perícia.');
  if(target&&skill.attack&&weapon?.ammunition&&Number(view.health?.municaoLab?.[weapon.ammunition.key]??weapon.ammunition.capacity)<=0)return dizer('⚠️ Arma sem munição ('+weapon.nome+' 0/'+weapon.ammunition.capacity+'). Recarregue ou troque de arma.');
  unlock();busy=true;render();
  try{
   let text;
   if(/primeiros.?socorros/i.test(skill.id+' '+skill.nome)){
    text='Abra “Primeiros Socorros” abaixo para escolher a parte e iniciar o atendimento.';
   }else if(target&&skill.attack){ // v122: no tempo real (sem turno) o ataque também vai para a mesa · v205: SEM combate nenhum também (antes virava só um teste da perícia em você mesmo: "enviando teste" e nada acontecia); a mesa liga o tempo real sozinha
    results.delete(actor.id);render();
    const dica=setTimeout(()=>{if(busy&&current?.id===actor.id)dizer('A ação está demorando mais que o normal. Verifique a conexão e mantenha a aba do mestre aberta.');},7000);
    try{text=await attack({actorId:actor.id,targetId:target.id,targetKind:object?'object':'character',skillId:skill.id,weaponId:weapon.id,turnId:turn});}finally{clearTimeout(dica);}
   }
   else if(support){text=await support({kind:'direct-test',actorId:actor.id,targetId:actor.id,turnId:turn,skillId:skill.id});}
   else{
    if(turn&&!await spend(actor.id,turn))return;
    const value=weapon?.valor??skill.valor,outcome=roll(value);
    text=skill.nome+': '+outcome.die+' / '+value+' → '+outcome.grau;
   }
   results.set(actor.id,{text,at:Date.now()});
  }catch(error){results.set(actor.id,{text:'Não foi possível agir: '+error.message,at:Date.now(),aviso:true});}
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
  const porArma=ataquesPorArma(sheet);
  if(pref.weapon&&!porArma.some(a=>a.weaponId===pref.weapon)&&porArma.length){pref.skill=porArma[0].skillId;pref.weapon=porArma[0].weaponId;}
  if(!pref.skill&&porArma.length){pref.skill=porArma[0].skillId;pref.weapon=porArma[0].weaponId;}
  const auto=pref.weapon?ataqueDaArma(sheet,pref.weapon,pref.skill):null;
  if(auto)pref.skill=auto.skillId;
  const ids=auto?(auto.improvisado?auto.alternativas.map(a=>a.skillId):[auto.skillId]):null;
  for(const skill of sheet.skills.filter(s=>!ids||ids.includes(s.id))){const option=node('option',skill.nome+' ('+skill.valor+'%)');option.value=skill.id;skills.append(option);}
  skills.disabled=!!auto&&!auto.improvisado;skills.parentElement.hidden=!!auto&&!auto.improvisado;
  if(sheet.skills.some(skill=>skill.id===pref.skill))skills.value=pref.skill;
  pref.skill=skills.value;preferences.set(current.id,pref);
  const ammoLabel=node('label'),ammo=node('output',null,'nova-ammo');ammo.id='novaSyncAmmo';ammoLabel.append(node('small','Munição'),ammo);line.append(ammoLabel);
  if(passButton)line.append(passButton);
  const button=node('button','🎲 Testar','btn-small btn-select');button.id='novaSyncTest';button.type='button';line.append(button);
  const firstAidHint=node('div','🩹 Primeiros Socorros: selecione um personagem ferido ao alcance. O tratamento ocupa a oportunidade e será concluído no turno seguinte.','nova-target-hint');firstAidHint.hidden=true;
  const description=node('div',null,'nova-action-description'),targetHint=node('div',null,'nova-target-hint');
  const paint=()=>{
   const {skill,weapon}=selection();
   description.textContent=['ℹ️',skill?.descricao,weapon?.descricao,weapon?.dano?'🎲 Dano '+weapon.dano:''].filter(Boolean).join(' · ');
   const ammunition=weapon?.ammunition;
   ammo.textContent=ammunition?String(view.health?.municaoLab?.[ammunition.key]??ammunition.capacity)+' / '+ammunition.capacity:'—';
   ammo.title=ammunition?'Carga atual / capacidade da arma selecionada':'Esta arma não usa munição';
   const object=(view.objects||[]).find(o=>o.id===view.targetId),target=(view.tokens||[]).find(token=>token.id===view.targetId&&token.id!==current.id)||object;
   targetHint.textContent=target?'🎯 '+name(target)+' selecionado · Testar executa a ação nesse alvo.':'Clique numa miniatura para selecionar o alvo. Sem alvo, Testar apenas rola a perícia.';
   if(object)targetHint.textContent='🧱 '+object.nome+' · PV '+object.pvAtual+'/'+object.pvMax+' · Dureza '+object.dureza+(object.destruido?' · Destruído':object.destrutivel===false?' · Indestrutível':' · Sem defesa ativa');
   firstAidHint.hidden=skills.value!=='primeiros_socorros';button.textContent=target&&!object&&skill?.attack&&weapon?'⚔️ Atacar':'🎲 Testar'; // v205: com alvo e arma o botão ataca de verdade
   button.disabled=!!(object&&(!combat?.active||object.destruido||!object.destrutivel))||!allowed||busy||!!(view.health?.combateLab||sheet.health)?.inconsciente||!!(view.health?.combateLab||sheet.health)?.morto||!skill||!!(target&&skill.attack&&!weapon);
  };
  const syncLoadout=()=>{
   if(!current)return;
   const key=String(pref.skill||'')+'|'+String(pref.weapon||'');
   if(syncedLoadouts.get(current.id)===key)return;
   syncedLoadouts.set(current.id,key);
   Promise.resolve(loadout({actorId:current.id,skillId:pref.skill||'',weaponId:pref.weapon||''})).catch(()=>{if(syncedLoadouts.get(current.id)===key)syncedLoadouts.delete(current.id);});
  };
  const populateWeapons=()=>{
   const skill=sheet.skills.find(entry=>entry.id===skills.value);pref.skill=skills.value;
   const lista=skill?.attack?porArma.map(a=>a.arma):(skill?.weapons||[]);
   weapons.replaceChildren();for(const weapon of lista){const option=node('option',weapon.nome.replace(/ ⚠.*$/,''));option.value=weapon.id;weapons.append(option);}
   if(lista.some(weapon=>weapon.id===pref.weapon))weapons.value=pref.weapon;
   pref.weapon=weapons.value;paint();syncLoadout();
  };
  skills.addEventListener('change',populateWeapons);weapons.addEventListener('change',()=>{pref.weapon=weapons.value;const a=ataqueDaArma(sheet,pref.weapon,pref.skill);if(a)pref.skill=a.skillId;preferences.set(current.id,pref);render();});
  button.addEventListener('click',()=>execute());populateWeapons();
  const pv=node('div'),health=view.health?.combateLab||sheet.health;
  pv.append(node('div','SEUS PV · '+name(current),'nova-pv-title'));
  if(health){
   const state=health.morto?'Morto':emComa(health)?'Em coma':health.inconsciente?'Desmaiado':health.incapacitado?'Incapacitado':'';
   if(state)pv.append(node('div',state+' · não pode atacar neste estado; a indicação de turno permanece válida.','nova-state-warning'));
   const grid=node('div',null,'nova-pv-grid'),order=['Cabeça','Peito','Abdômen','Braço Direito','Braço Esquerdo','Perna Direita','Perna Esquerda'];
   const locations=Object.keys(health.hitMax||{}).sort((left,right)=>(order.includes(left)?order.indexOf(left):99)-(order.includes(right)?order.indexOf(right):99));
   for(const location of locations){
    const cell=node('div',null,'nova-pv-cell'),short=location.replace('Direito','D.').replace('Esquerdo','E.').replace('Direita','D.').replace('Esquerda','E.');
    cell.append(node('small',short),node('b','PV '+health.hit[location]+'/'+health.hitMax[location]),node('small','PA '+(health.armor?.[location]||0),'nova-armor'));grid.append(cell);
   }pv.append(grid);
  }else pv.innerHTML=sheet.pvHtml||'';
  const own=results.get(current.id),result=node('div',(own&&(own.at>(view.event?.ts||0)||(own.aviso&&Date.now()-own.at<7000))?own.text:view.event?.message)||own?.text||'','nova-result');
  host.append(line,description,firstAidHint,pv,result,targetHint);
  const targetableObjects=(view.objects||[]).filter(o=>o.destrutivel===true&&Number(o.pvMax||0)>0&&!o.destruido);
  if(targetableObjects.length){const label=node('label','Alvo de cenário '),select=node('select');select.id='novaObjectTarget';select.append(node('option','— selecionar objeto —'));select.firstChild.value='';
   for(const o of targetableObjects){const option=node('option',o.nome+' · PV '+o.pvAtual+'/'+o.pvMax);option.value=o.id;select.append(option);}select.value=targetableObjects.some(o=>o.id===view.targetId)?view.targetId:'';
   select.onchange=()=>{view.selectTarget?.(select.value);};label.append(select);host.append(label);
  }
  const burning=(view.objects||[]).find(o=>o.id===view.targetId&&o.pegandoFogo&&!o.destruido);
  if(burning&&extintor(sheet.support?.inventory)){const extinguish=node('button','🧯 Apagar fogo','btn-small btn-select');extinguish.id='novaExtinguish';extinguish.disabled=busy||!allowed||health?.inconsciente||health?.morto;extinguish.onclick=async()=>{busy=true;render();try{const text=await support({kind:'direct-extinguish',actorId:current.id,targetId:current.id,objectId:burning.id,turnId:combat?.active?combat.turnId:null});results.set(current.id,{text,at:Date.now()});}catch(e){results.set(current.id,{text:e.message,at:Date.now()});}finally{busy=false;render();}};host.append(extinguish);}
  const luckBalance=view.health?.luckRemaining??sheet.support?.luck??0,luckOn=!!view.health?.luckPrepared;
  const luck=node('button',luckOn?'🍀 Sorte ativa · +50%':'🍀 Sorte ('+luckBalance+')','btn-small btn-select');luck.type='button';luck.id='novaLuck';luck.disabled=busy||luckOn||luckBalance<=0||!!health?.morto;
  luck.title=luckOn?'A Sorte já está ativa: o próximo teste que você fizer terá +50% do valor da perícia.':'Gasta 1 Ponto de Sorte: o próximo teste que você fizer terá +50% do valor da perícia.';
  luck.onclick=async()=>{luck.disabled=true;try{const text=await support({kind:'direct-luck',actorId:current.id,targetId:current.id,turnId:combat?.turnId||null});results.set(current.id,{text,at:Date.now()});}catch(e){results.set(current.id,{text:e.message,at:Date.now()});}finally{render();}};line.insertBefore(luck,button);
  if(health?.inconsciente&&!health.morto&&emComa(health)){const aviso=node('div','🛌 Em coma: só acorda depois de Primeiros Socorros (ou cura) no ferimento grave.','');aviso.style.cssText='color:#ffcf8a;font-size:12px;margin:4px 0';host.append(aviso);}
  if(health?.inconsciente&&!health.morto&&!emComa(health)){const bonus=bonusConsciencia(health,combat);const wake=node('button','Teste de consciência'+(bonus?' (+'+bonus+' por cura)':''),'btn-small btn-select');wake.type='button';wake.id='novaConsciousness';wake.disabled=!allowed||!combat?.active||view.health?.consciousnessRound===combat.roundId;wake.onclick=async()=>{wake.disabled=true;try{const text=await support({kind:'direct-consciousness',actorId:current.id,targetId:current.id,turnId:combat.turnId});results.set(current.id,{text,at:Date.now()});}catch(e){results.set(current.id,{text:e.message,at:Date.now()});}finally{render();}};host.append(wake);}
  painelSuporte({root,host,current,sheet,view,combat,allowed:allowed&&!health?.inconsciente&&!health?.morto,send:support,load});
  const state=view.health?.combateLab||sheet.health;
  if(state?.caido||state?.derrubado){
   const lift=node('button','⬆️ Levantar (1 Ação)','btn-small btn-select');lift.type='button';lift.disabled=!allowed||busy||ocupado(view.health,combat);lift.onclick=()=>support?.({kind:'direct-stand',actorId:current.id,targetId:current.id,turnId:combat?.active?combat.turnId:null});host.append(lift);
  }
 }
 const update=async(token,packet,canAct,extra={})=>{
  if(!host)return;
  const changed=current?.id!==token?.id;current=token;combat=packet;allowed=canAct;view=extra;if(changed)sheet=null;
  const key=JSON.stringify([extra.sheetRevision,token?.id,packet?.turnId,canAct,extra.health,extra.targetId,extra.event?.id,extra.masterMode,extra.defenses,extra.tokens?.map(t=>t.id),extra.objects?.map(t=>[t.id,t.pvAtual,t.destruido,t.destrutivel,t.pegandoFogo,t.estadoFogo]),extra.psiRequests]);
  if(shown===key)return;shown=key;const pending=++request;
  if(!token){render();return;}
  try{
   const healthKey=JSON.stringify([extra.sheetRevision,extra.health||{},packet?.round]),cached=cache.get(token.id);
   if(!cached||cached.healthKey!==healthKey)cache.set(token.id,{healthKey,promise:load({...token,...extra.health,supportRound:packet?.round||0})});
   const data=await cache.get(token.id).promise;if(pending!==request)return;sheet=data;render();
  }catch(error){cache.delete(token.id);if(pending===request)host.textContent='Não foi possível carregar a ficha: '+error.message;}
 };
 update.setTarget=targetId=>{view={...view,targetId};render();};
 update.triggerAttack=()=>execute();
 // v122: balão de ações no mapa usa a mesma ficha e o mesmo caminho de execução do painel.
 update.estado=()=>({sheet,current,view,combat,allowed,busy});
 update.escolher=(skillId,weaponId)=>{if(!current||!sheet)return false;const auto=weaponId?ataqueDaArma(sheet,weaponId,skillId):null;const sk=sheet.skills.find(s=>s.id===(auto?.skillId||skillId));if(!sk)return false;const pref={...preference(),skill:sk.id,weapon:sk.weapons.some(w=>w.id===weaponId)?weaponId:(sk.weapons[0]?.id||'')};preferences.set(current.id,pref);render();return true;};
 update.executar=targetId=>execute(targetId);
 return update;
}
