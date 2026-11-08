// Seleção provisória por arma: uma ação por arma; perícia própria é automática.
export function ataquesPorArma(sheet){
 const grupos=new Map();
 for(const s of sheet?.skills||[]){if(!s.attack)continue;for(const w of s.weapons||[]){
  if(!w.id)continue;const list=grupos.get(w.id)||[];list.push({skillId:s.id,weaponId:w.id,pericia:s.nome,base:w.base??s.base??s.valor,valor:w.valor??s.valor,penalty:Number(w.penalty)||0,arma:w});grupos.set(w.id,list);
 }}
 return [...grupos.values()].map(list=>{
  const diretas=list.filter(o=>o.penalty===0),opcoes=diretas.length?diretas:list;
  opcoes.sort((a,b)=>(diretas.length?0:a.penalty-b.penalty)||(b.base-a.base)||(b.valor-a.valor));
  return {...opcoes[0],improvisado:!diretas.length,alternativas:diretas.length?[]:opcoes};
 });
}
export function ataqueDaArma(sheet,weaponId,skillId=''){
 const a=ataquesPorArma(sheet).find(a=>a.weaponId===weaponId);if(!a)return null;
 return a.improvisado?{...a,...(a.alternativas.find(o=>o.skillId===skillId)||{}),improvisado:true,alternativas:a.alternativas}:a;
}
