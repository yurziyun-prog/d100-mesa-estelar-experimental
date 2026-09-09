export function criarPainelAcoes({root,load,spend,roll}){
 const host=root.getElementById('novaSyncActionPanel');
 let current=null,packet=null,allowed=false,busy=false,request=0,shown='',sheet=null;
 const cache=new Map(),results=new Map();
 function node(tag,text){const n=root.createElement(tag);if(text)n.textContent=text;return n;}
 function render(){
  if(!host||!sheet)return;
  host.replaceChildren();
  host.append(node('strong','🎯 Ação de '+current.nome));
  const line=node('div');line.style.cssText='display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin:8px 0;';
  const skills=node('select'),weapons=node('select'),button=node('button');button.className='btn-small btn-select';
  for(const [label,control]of [['Ação / Perícia',skills],['Arma / ataque',weapons]]){
   const wrapper=node('label');wrapper.style.cssText='flex:1;min-width:180px;margin:0';wrapper.append(node('small',label),control);control.style.cssText='width:100%;margin:4px 0 0';line.append(wrapper);
  }
  for(const s of sheet.skills){const o=node('option',s.nome+' ('+s.valor+'%)');o.value=s.id;skills.append(o);}
  const description=node('div'),pv=node('div'),result=node('div');
  description.style.cssText='padding:7px;background:rgba(255,255,255,.04);margin-bottom:8px;';
  pv.innerHTML=sheet.pvHtml||'';
  const paintDescription=()=>{const s=sheet.skills.find(s=>s.id===skills.value),w=s?.weapons.find(w=>w.id===weapons.value);description.textContent=[s?.descricao,w?.descricao,w?.dano?'Dano: '+w.dano:''].filter(Boolean).join(' · ');};
  skills.addEventListener('change',()=>{
   weapons.replaceChildren();const s=sheet.skills.find(s=>s.id===skills.value);
   for(const w of s?.weapons||[]){const o=node('option',w.nome);o.value=w.id;weapons.append(o);}
   if(!weapons.options.length)weapons.append(node('option','Sem arma'));
   paintDescription();
  });
  weapons.addEventListener('change',paintDescription);
  skills.dispatchEvent(new root.defaultView.Event('change'));
  button.textContent=packet?.active?'🎲 Testar (1 Ação)':'🎲 Testar';button.disabled=!allowed||!sheet.skills.length||busy;
  button.addEventListener('click',async()=>{
   if(busy||!allowed)return;
   const actor=current,turn=packet?.active?packet.turnId:null,s=sheet.skills.find(s=>s.id===skills.value);
   if(!s)return;busy=true;button.disabled=true;
   try{
    if(turn&&!await spend(actor.id,turn))return;
    const outcome=roll(s.valor);
    const text=s.nome+': '+outcome.die+' / '+s.valor+' → '+outcome.grau;
    results.set(actor.id,text);if(current?.id===actor.id)result.textContent=text;
   }catch(e){result.textContent='Não foi possível testar: '+e.message;}
   finally{busy=false;if(current?.id===actor.id)render();}
  });
  line.append(button);result.textContent=results.get(current.id)||'';
  host.append(line,description,pv,node('small','Teste de perícia/ataque. Dano, defesas e efeitos ainda não são aplicados automaticamente.'),result);
 }
 return async function update(token,combat,canAct){
  if(!host)return;current=token;packet=combat;allowed=canAct;
  const key=JSON.stringify([token?.id,combat?.turnId,canAct]);if(shown===key)return;shown=key;
  const id=++request;
  if(!token){host.textContent='Selecione um personagem.';return;}
  try{
   if(!cache.has(token.id)){host.textContent='Carregando ficha…';cache.set(token.id,load(token));}
   const data=await cache.get(token.id);if(id!==request)return;sheet=data;render();
  }catch(e){cache.delete(token.id);if(id===request)host.textContent='Não foi possível carregar a ficha: '+e.message;}
 };
}
