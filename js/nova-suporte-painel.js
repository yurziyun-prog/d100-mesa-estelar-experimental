import {feridas,ocupado,PSI_NARRATIVOS} from './nova-suporte.js?v=44';

const states=new WeakMap();
export function painelSuporte({root,host,current,sheet,view,combat,allowed,send,load}){
 const support=sheet.support;if(!support)return;const width=view.mapWidth||28,height=view.mapHeight||14;
 if(!states.has(root))states.set(root,new Map());
 const store=states.get(root),key=current.id;
 if(!store.has(key)){let power='';try{power=root.defaultView.localStorage.getItem('mesa:psi-power:'+key)||'';}catch(_){}store.set(key,{power,open:{},target:current.id,patient:view.targetId||current.id});}
 const pref=store.get(key),node=(tag,text)=>{const n=root.createElement(tag);if(text)n.textContent=text;return n;};
 const section=(key,title)=>{const d=node('details');d.className='nova-support-panel';d.open=pref.open[key]??true;const s=node('summary',title);s.onclick=e=>{e.preventDefault();d.open=!d.open;pref.open[key]=d.open;};d.append(s);const b=node('div');d.append(b);host.append(d);return b;};
 const field=(body,text,control)=>{const l=node('label',text);l.append(control);body.append(l);return l;};
 let busy=false;const buttons=[],feedback=node('div');
 const run=async payload=>{if(busy)return;busy=true;buttons.forEach(({b})=>b.disabled=true);feedback.textContent='⏳ Enviando…';try{feedback.textContent=await send({actorId:current.id,turnId:combat?.active?combat.turnId:null,...payload});}catch(e){feedback.textContent=e.message;}finally{busy=false;buttons.forEach(({b,disabled})=>b.disabled=!allowed||disabled);}};
 const button=(body,text,action,disabled=false)=>{const b=node('button',text);b.className='btn-small btn-select';b.type='button';b.disabled=!allowed||disabled;b.onclick=action;body.append(b);buttons.push({b,disabled});return b;};
 const addOptions=(select,items)=>{select.replaceChildren();for(const t of items){const o=node('option',(t.nome||t.id)+(t.id===current.id?' (você)':''));o.value=t.id;select.append(o);}};
 const healthOf=async id=>{const t=(view.tokens||[]).find(t=>t.id===id);return t&&(view.allHealth?.[id]?.combateLab||(await load(t)).health);};
 const fillParts=(select,h,value)=>{const opts=feridas(h);select.replaceChildren();if(opts.length!==1){const o=node('option',opts.length?'Escolha a parte ferida':'Sem ferimentos');o.value='';select.append(o);}for(const l of opts){const o=node('option',l+' · PV '+h.hit[l]+'/'+h.hitMax[l]);o.value=l;select.append(o);}if(opts.includes(value))select.value=value;};
 const first=section('firstAid','🩹 Primeiros Socorros'),targets=node('select'),locations=node('select');targets.id='novaSupportTarget';locations.id='novaSupportLocation';
 addOptions(targets,view.tokens||[]);targets.value=view.health?.treatment?.targetId||pref.patient;if(!targets.value)targets.value=current.id;
 field(first,'Paciente',targets);field(first,'Parte ferida',locations);
 let serial=0;const populate=async()=>{const n=++serial;try{const h=await healthOf(targets.value);if(n!==serial)return;fillParts(locations,h,view.health?.treatment?.local||pref.part);if(view.health?.treatment){locations.disabled=true;targets.disabled=true;}}catch(e){feedback.textContent=e.message;}};
 targets.onchange=()=>{pref.patient=targets.value;pref.part='';populate();};locations.onchange=()=>pref.part=locations.value;populate();
 if(support.firstAid){
  const treatment=view.health?.treatment,kit=node('input'),line=node('div');line.style.cssText='display:flex;gap:12px;align-items:center;flex-wrap:wrap';first.append(line);
  kit.type='checkbox';const uses=(support.kits||[]).reduce((s,k)=>s+(view.health?.kitUses?.[k.comp+':'+k.index]??k.uses),0);kit.checked=uses>0&&(pref.kit??true);kit.disabled=!uses||!!treatment;kit.onchange=()=>pref.kit=kit.checked;
  const kitLabel=field(line,'Usar kit ('+uses+' usos)',kit);kitLabel.style.flexDirection='row';
  if(!treatment)button(line,'🩹 Iniciar tratamento',()=>run({kind:'direct-first-aid',operation:'start',targetId:targets.value,local:locations.value,useKit:kit.checked}),ocupado(view.health,combat));
  else{line.append(node('strong',`Tratamento de ${treatment.local} · ${treatment.turns}/3 turnos · bônus +${(treatment.turns-1)*5}`));const wait=!!combat?.active&&combat.round<=treatment.lastRound;
   button(line,'Concluir e rolar',()=>run({kind:'direct-first-aid',operation:'finish',targetId:treatment.targetId}),wait);
   button(line,'Continuar (+5)',()=>run({kind:'direct-first-aid',operation:'continue',targetId:treatment.targetId}),wait||treatment.turns>=3);
   button(line,'Interromper',()=>run({kind:'direct-first-aid',operation:'cancel',targetId:treatment.targetId}));
   if(wait)first.append(node('p','Aguarde sua vez na próxima rodada.'));
  }
  first.append(node('p','Alcance 1,5 m. Sem kit: perícia pela metade. Cada turno adicional: +5. Durante o atendimento: apenas defesas, com −20.'));
 }else first.append(node('p','A ficha não possui a perícia Primeiros Socorros.'));
 if(support.powers?.length){
  const psi=section('psi','🔮 Psiquismo · PP '+Math.max(0,support.psiMax-(view.health?.psiSpent??support.psiSpent))+'/'+support.psiMax);
  const powers=node('select'),cost=node('input'),description=node('p'),text=node('textarea'),target=node('select'),location=node('select'),destination=node('input'),objects=node('select');
  powers.id='novaPsiPower';cost.id='novaPsiCost';cost.type='number';cost.step='1';target.id='novaPsiTarget';location.id='novaPsiLocation';objects.id='novaPsiObject';destination.id='novaPsiDestination';destination.placeholder='2:3';destination.value=pref.destination||`${Math.floor(current.x*width/28)+1}:${Math.floor(current.y*height/14)+1}`;
  text.placeholder='Mensagem ou intenção';text.value=pref.text||'';text.oninput=()=>pref.text=text.value;destination.oninput=()=>pref.destination=destination.value;
  for(const p of support.powers){const o=node('option',p.name+' ('+p.value+'%)');o.value=p.id;powers.append(o);}if(support.powers.some(p=>p.id===pref.power))powers.value=pref.power;
  field(psi,'Poder',powers);field(psi,'Gasto de PP',cost);const targetLabel=field(psi,'Alvo / forma para copiar',target),locLabel=field(psi,'Parte do corpo para curar',location);psi.append(description);
  const textLabel=field(psi,'Mensagem / intenção',text),destLabel=field(psi,'Destino · coluna:linha (ex.: 2:3)',destination),objLabel=field(psi,'Objeto para mover',objects);
  addOptions(objects,view.objects||[]);if(pref.object)objects.value=pref.object;objects.onchange=()=>pref.object=objects.value;
  const selfIds=new Set(['meditacao_psi','meditacao_batalha','reflexos','fluxo_marcial','aceleracao','salto','teletransporte','teletransporte_caotico','agilidade_psi','ocultar_mente','anoitecer','circulo_protecao','defesa_mental']);
  let ps=0;const fillLocations=async()=>{const n=++ps;try{const h=await healthOf(target.value);if(n===ps)fillParts(location,h,pref.psiPart);}catch(e){feedback.textContent=e.message;}};
  const paint=()=>{const p=support.powers.find(p=>p.id===powers.value),copy=['ilusao','mimetismo_psi'].includes(p.id);pref.power=p.id;
   try{root.defaultView.localStorage.setItem('mesa:psi-power:'+key,p.id);}catch(_){}
   cost.min=p.cost||0;cost.value=p.cost||0;
   addOptions(target,copy?[...(view.tokens||[]),...(view.objects||[])]:view.tokens||[]);target.value=selfIds.has(p.id)?current.id:pref.target;if(!target.value)target.value=current.id;
   targetLabel.firstChild.textContent=copy?'Forma para copiar':p.id==='cura_psi'?'Paciente da cura psíquica':'Alvo';
   targetLabel.hidden=selfIds.has(p.id)||p.id==='mover_objeto';target.disabled=selfIds.has(p.id);
   locLabel.hidden=p.id!=='cura_psi';objLabel.hidden=p.id!=='mover_objeto';destLabel.hidden=!['teletransporte','salto','mover_objeto'].includes(p.id);textLabel.hidden=!PSI_NARRATIVOS.has(p.id);
   description.textContent=p.id==='grito_psiquico'?'Cone de 60° e 8 m, incluindo aliados. Sem dano físico. Esquiva (−20 no alvo central); se atingido, cai e testa Resistência: falha causa inconsciência por 1d4 rodadas. Use o botão Usar poder abaixo.':p.id==='ilusao'?'Cria uma cópia ilusória separada de uma pessoa, criatura ou objeto do mapa. Não causa dano e não muda a sua aparência. Duração: 1 minuto. Manutenção: 2 PP por rodada (6 segundos fora de combate).':p.id==='mimetismo_psi'?'Você assume a aparência da forma selecionada. A aparência não concede os atributos ou ataques da forma copiada. Duração: 1 minuto.':(p.description||'')+(PSI_NARRATIVOS.has(p.id)?' · O mestre responderá em uma janela separada.':'');
   if(p.id==='cura_psi')fillLocations();
  };
  powers.onchange=paint;target.onchange=()=>{pref.target=target.value;pref.psiPart='';if(powers.value==='cura_psi')fillLocations();};location.onchange=()=>pref.psiPart=location.value;paint();
  button(psi,'🔮 Usar poder',()=>{let x=current.x,y=current.y;if(!destLabel.hidden){const m=/^\s*(\d+)\s*:\s*(\d+)\s*$/.exec(destination.value);if(!m||+m[1]<1||+m[1]>Math.ceil(width)||+m[2]<1||+m[2]>Math.ceil(height)){feedback.textContent='Informe coluna:linha, entre 1:1 e '+Math.ceil(width)+':'+Math.ceil(height)+'.';return;}x=(+m[1]-.5)/width*28;y=(+m[2]-.5)/height*14;}
   const copy=['ilusao','mimetismo_psi'].includes(powers.value);run({kind:'direct-psi',powerId:powers.value,cost:Number(cost.value),targetId:copy||selfIds.has(powers.value)||powers.value==='mover_objeto'?current.id:target.value,sourceId:copy?target.value:'',local:location.value,text:text.value,x,y,objectId:powers.value==='mover_objeto'?objects.value:''});
  },ocupado(view.health,combat));
 }
 host.append(feedback);
}
