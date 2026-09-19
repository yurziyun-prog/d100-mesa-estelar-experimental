export function classificarTeste(value,die){
 const v=Math.max(0,Math.min(100,Number(value)||0));
 if(die>=99)return {grau:'Fiasco',sucesso:false};
 if(die<v/10)return {grau:'Crítico',sucesso:true};
 return die<=v?{grau:'Sucesso',sucesso:true}:{grau:'Falha',sucesso:false};
}
export function locaisValidos(health){return Object.keys(health?.hitMax||{}).filter(l=>Number(health.hit?.[l]??health.hitMax[l])>-Number(health.hitMax[l]));}
export function descreverTeste(base,effective,die,modifiers=[]){
 const sum=modifiers.reduce((n,m)=>n+m.value,0),other=effective-base-sum;
 const parts=[...modifiers,...(other?[{name:'outros modificadores',value:other}]:[])].filter(m=>m.value).map(m=>(m.value>0?'+':'−')+Math.abs(m.value)+' '+m.name);
 return 'base '+base+(parts.length?' · '+parts.join(' · '):'')+' · efetiva '+effective+' · '+die+'/'+effective;
}
