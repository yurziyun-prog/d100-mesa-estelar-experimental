import {feridas,ocupado,PSI_NARRATIVOS} from './nova-suporte.js?v=40';
export function painelSuporte({root,host,current,sheet,view,combat,allowed,send,load}){
 const node=(tag,text)=>{const n=root.createElement(tag);if(text)n.textContent=text;return n;};
 const support=sheet.support;if(!support)return;
 const box=node('details');box.open=!!view.health?.treatment;box.className='nova-support-panel';box.append(node('summary','🩹 Primeiros Socorros · 🔮 Psiquismo'));
 const body=node('div'),feedback=node('div'),targets=node('select'),locations=node('select');targets.id='novaSupportTarget';locations.id='novaSupportLocation';
 for(const t of view.tokens||[]){const option=node('option',t.nome+(t.id===current.id?' (você)':''));option.value=t.id;targets.append(option);}targets.value=view.health?.treatment?.targetId||view.targetId||current.id;
 const label=(text,control)=>{const wrap=node('label',text+' ');wrap.append(control);body.append(wrap);};
 label('Paciente / alvo',targets);label('Parte ferida',locations);
 let busy=false,serial=0;const buttons=[];
 const run=async payload=>{
  if(busy)return;busy=true;buttons.forEach(b=>b.disabled=true);feedback.textContent='⏳ Enviando…';
  try{feedback.textContent=await send({actorId:current.id,targetId:targets.value||current.id,turnId:combat?.active?combat.turnId:null,...payload});}
  catch(e){feedback.textContent=e.message;}finally{busy=false;buttons.forEach(b=>b.disabled=!allowed);}
 };
 const button=(text,action,disabled=false)=>{const b=node('button',text);b.type='button';b.className='btn-small btn-select';b.disabled=!allowed||disabled;b.onclick=action;body.append(b);buttons.push(b);return b;};
 const populate=async()=>{
  const tick=++serial;locations.replaceChildren(node('option','Carregando…'));
  const t=view.tokens.find(t=>t.id===targets.value);if(!t)return;
  try{const data=view.allHealth?.[t.id]?.combateLab||(await load(t)).health;if(tick!==serial)return;const opts=feridas(data);locations.replaceChildren();
   if(opts.length!==1){const p=node('option',opts.length?'Escolha a parte ferida':'Sem ferimentos');p.value='';locations.append(p);}
   for(const l of opts){const o=node('option',l+' · PV '+data.hit[l]+'/'+data.hitMax[l]);o.value=l;locations.append(o);}
   if(view.health?.treatment){locations.value=view.health.treatment.local;locations.disabled=true;targets.disabled=true;}
  }catch(e){feedback.textContent=e.message;}
 };
 targets.onchange=populate;populate();
 if(support.firstAid){
  const treatment=view.health?.treatment,kit=node('input');kit.type='checkbox';kit.checked=support.kits.some(k=>k.uses>0);kit.disabled=!kit.checked||!!treatment;label('Usar kit ('+support.kits.reduce((s,k)=>s+k.uses,0)+' usos disponíveis)',kit);
  body.append(node('p','Alcance 1,5 m. Sem kit: perícia pela metade. Cada turno adicional: +5 pontos. Durante o atendimento: apenas defesas, com −20.'));
  if(!treatment)button('🩹 Iniciar tratamento',()=>run({kind:'direct-first-aid',operation:'start',local:locations.value,useKit:kit.checked}),ocupado(view.health,combat));
  else{
   body.append(node('strong',`Tratamento de ${treatment.local} · ${treatment.turns}/3 turnos · bônus +${(treatment.turns-1)*5}`));
   const wait=!!combat?.active&&combat.round<=treatment.lastRound;
   button('Concluir e rolar',()=>run({kind:'direct-first-aid',operation:'finish'}),wait);
   button('Continuar (+5)',()=>run({kind:'direct-first-aid',operation:'continue'}),wait||treatment.turns>=3);
   button('Interromper',()=>run({kind:'direct-first-aid',operation:'cancel'}));
   if(wait)body.append(node('p','Aguarde sua vez na próxima rodada.'));
  }
 }
 if(support.powers.length){
  body.append(node('h4','🔮 Poderes psíquicos · PP '+Math.max(0,support.psiMax-(view.health?.psiSpent??support.psiSpent))+'/'+support.psiMax));
  const powers=node('select'),cost=node('input'),description=node('p'),text=node('textarea'),x=node('input'),y=node('input'),objects=node('select');
  powers.id='novaPsiPower';cost.id='novaPsiCost';cost.type='number';cost.step='1';text.placeholder='Mensagem, intenção ou descrição da ilusão';text.maxLength=1000;
  x.type=y.type='number';x.step=y.step='0.1';x.value=current.x;x.min='0';x.max='28';y.value=current.y;y.min='0';y.max='14';
  for(const p of support.powers){const o=node('option',p.name+' ('+p.value+'%)');o.value=p.id;powers.append(o);}
  for(const o of view.objects||[]){const option=node('option',o.nome||o.id);option.value=o.id;objects.append(option);}
  label('Poder',powers);label('Gasto de PP',cost);body.append(description);label('Mensagem / intenção',text);label('Destino X (unidades do mapa)',x);label('Destino Y',y);label('Objeto (telecinese)',objects);
  const paint=()=>{const p=support.powers.find(p=>p.id===powers.value);cost.min=p.cost;cost.value=p.cost;description.textContent=p.description+(PSI_NARRATIVOS.has(p.id)?' · Resultado sujeito à resposta do mestre.':'');};powers.onchange=paint;paint();
  button('🔮 Usar poder',()=>run({kind:'direct-psi',powerId:powers.value,cost:Number(cost.value),local:locations.value,text:text.value,x:Number(x.value),y:Number(y.value),objectId:objects.value}),ocupado(view.health,combat));
 }
 for(const request of (view.psiRequests||[]).filter(r=>r.status==='pending'&&view.isMaster)){
  body.append(node('p',request.powerName+' · '+request.text+' · '+(request.description||'')));const answer=node('textarea');answer.placeholder='Resultado ou mensagem autorizada pelo mestre';body.append(answer);
  const b=node('button','Registrar resposta do mestre');b.type='button';b.onclick=()=>run({kind:'direct-psi-review',requestId:request.id,text:answer.value});body.append(b);
 }
 if(view.health?.combateLab?.caido||view.health?.combateLab?.derrubado)button('Levantar (1 Ação)',()=>run({kind:'direct-stand',targetId:current.id}),ocupado(view.health,combat));
 body.append(feedback);box.append(body);host.append(box);
}
