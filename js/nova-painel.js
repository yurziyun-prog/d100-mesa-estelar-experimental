export function criarPainelAcoes({root,load,spend,roll,attack,unlock=()=>{}}){
 const host=root.getElementById('novaSyncActionPanel');
 let current=null,packet=null,allowed=false,busy=false,request=0,shown='',sheet=null;
 const cache=new Map(),results=new Map(),preferences=new Map();let view={};
 function node(tag,text){const n=root.createElement(tag);if(text)n.textContent=text;return n;}
 function render(){
  if(!host||!sheet)return;
  host.replaceChildren();
  host.append(node('strong','🎯 Ação de '+current.nome));
  const line=node('div');line.style.cssText='display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin:8px 0;';
  const skills=node('select'),weapons=node('select'),targets=node('select'),button=node('button');button.className='btn-small btn-select';
  for(const [label,control]of [['Ação / Perícia',skills],['Arma / ataque',weapons]]){
   const wrapper=node('label');wrapper.style.cssText='flex:1;min-width:180px;margin:0';wrapper.append(node('small',label),control);control.style.cssText='width:100%;margin:4px 0 0';line.append(wrapper);
  }
  for(const s of sheet.skills){const o=node('option',s.nome+' ('+s.valor+'%)');o.value=s.id;skills.append(o);}
  const pref=preferences.get(current.id)||{};if(sheet.skills.some(s=>s.id===pref.skill))skills.value=pref.skill;
  const targetLabel=node('label');targetLabel.style.cssText='flex:1;min-width:160px;margin:0';targetLabel.append(node('small','Alvo'),targets);line.append(targetLabel);
  targets.style.cssText='width:100%;margin:4px 0 0';const empty=node('option','Escolha o alvo');empty.value='';targets.append(empty);
  for(const t of view.tokens||[])if(t.id!==current.id){const o=node('option',t.nome);o.value=t.id;targets.append(o);}targets.value=pref.target||'';
  const description=node('div'),pv=node('div'),result=node('div');
  description.style.cssText='padding:7px;background:rgba(255,255,255,.04);margin-bottom:8px;';
  const health=view.health?.combateLab||sheet.health;
  if(health){
   pv.append(node('strong','SEUS PV · '+current.nome));const grid=node('div');grid.style.cssText='display:flex;gap:4px;flex-wrap:wrap;margin:6px 0';
   for(const loc of Object.keys(health.hitMax||{})){const cell=node('div');cell.style.cssText='flex:1;min-width:85px;text-align:center;padding:5px;background:rgba(255,255,255,.07);border-radius:5px';cell.append(node('small',loc),node('div','PV '+health.hit[loc]+'/'+health.hitMax[loc]),node('small','PA '+(health.armor?.[loc]||0)));grid.append(cell);}pv.append(grid);
  }else pv.innerHTML=sheet.pvHtml||'';
  const refreshButton=()=>{const s=sheet.skills.find(s=>s.id===skills.value);targetLabel.hidden=!s?.attack;button.textContent=s?.attack?(packet?.active?'⚔ Atacar (1 Ação)':'⚔ Atacar'):(packet?.active?'🎲 Testar (1 Ação)':'🎲 Testar');button.disabled=!allowed||!s||busy||!!(s.attack&&(!targets.value||!weapons.value));};
  const paintDescription=()=>{const s=sheet.skills.find(s=>s.id===skills.value),w=s?.weapons.find(w=>w.id===weapons.value);description.textContent=[s?.descricao,w?.descricao,w?.dano?'Dano: '+w.dano:''].filter(Boolean).join(' · ');};
  skills.addEventListener('change',()=>{
   weapons.replaceChildren();const s=sheet.skills.find(s=>s.id===skills.value);
   for(const w of s?.weapons||[]){const o=node('option',w.nome);o.value=w.id;weapons.append(o);}
   if(!weapons.options.length){const empty=node('option','Sem arma');empty.value='';weapons.append(empty);}
   if(s?.weapons.some(w=>w.id===pref.weapon))weapons.value=pref.weapon;
   pref.skill=skills.value;pref.weapon=weapons.value;preferences.set(current.id,pref);
   paintDescription();refreshButton();
  });
  weapons.addEventListener('change',()=>{pref.weapon=weapons.value;paintDescription();refreshButton();});
  targets.addEventListener('change',()=>{pref.target=targets.value;refreshButton();});
  skills.dispatchEvent(new root.defaultView.Event('change'));
  refreshButton();
  button.addEventListener('click',async()=>{
   if(busy||!allowed)return;
   const actor=current,turn=packet?.active?packet.turnId:null,s=sheet.skills.find(s=>s.id===skills.value);
   if(!s)return;unlock();busy=true;button.disabled=true;
   try{
    if(s.attack){const text=await attack({actorId:actor.id,targetId:targets.value,skillId:s.id,weaponId:weapons.value,turnId:turn});results.set(actor.id,{text,at:Date.now()});return;}
    if(turn&&!await spend(actor.id,turn))return;
    const outcome=roll(s.valor);
    const text=s.nome+': '+outcome.die+' / '+s.valor+' → '+outcome.grau;
    results.set(actor.id,{text,at:Date.now()});if(current?.id===actor.id)result.textContent=text;
   }catch(e){results.set(actor.id,{text:'Não foi possível agir: '+e.message,at:Date.now()});}
   finally{busy=false;if(current?.id===actor.id)render();}
  });
  const own=results.get(current.id);line.append(button);result.textContent=(own?.at>(view.event?.ts||0)?own.text:view.event?.message)||own?.text||'';
  host.append(line,description,pv,result);
 }
 const update=async function update(token,combat,canAct,extra={}){
  if(!host)return;current=token;packet=combat;allowed=canAct;view=extra;
  const key=JSON.stringify([token?.id,combat?.turnId,canAct,extra.revision,(extra.tokens||[]).map(t=>t.id)]);if(shown===key)return;shown=key;
  const id=++request;
  if(!token){host.textContent='Selecione um personagem.';return;}
  try{
   if(!cache.has(token.id)){host.textContent='Carregando ficha…';cache.set(token.id,load(token));}
   const data=await cache.get(token.id);if(id!==request)return;sheet=data;render();
  }catch(e){cache.delete(token.id);if(id===request)host.textContent='Não foi possível carregar a ficha: '+e.message;}
 };`r`n update.setTarget=id=>{const pref=preferences.get(current?.id)||{};pref.target=id;preferences.set(current?.id,pref);shown="";render();};\n update.triggerAttack=()=>host?.querySelector("button")?.click();`r`n return update;`r`n}\n