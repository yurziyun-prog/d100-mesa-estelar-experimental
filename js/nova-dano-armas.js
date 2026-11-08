export function aplicarDanoArma(item,danoBruto,{agora=new Date().toISOString()}={}){
 if(!item||typeof item!=='object')throw new Error('Arma inválida.');
 const pvMax=Math.max(0,Number(item.pv)||0);
 if(pvMax<=0)throw new Error('Esta arma não possui PV estrutural.');
 const pvAntes=Math.max(0,Math.min(pvMax,Number(item.pvAtual??pvMax)||0));
 const pa=Math.max(0,Number(item.pa)||0);
 const bruto=Math.max(0,Number(danoBruto)||0);
 const estrutural=Math.max(0,bruto-pa);
 const aplicado=Math.min(pvAntes,estrutural);
 const excesso=Math.max(0,estrutural-pvAntes);
 const pvAtual=Math.max(0,pvAntes-aplicado);
 const atualizado={...item,pvAtual};
 if(pvAtual<=0){atualizado.inutilizavel=true;atualizado.quebradoEm=agora;}
 return {item:atualizado,bruto,pa,estrutural,aplicado,excesso,pvAntes,pvAtual,pvMax};
}
