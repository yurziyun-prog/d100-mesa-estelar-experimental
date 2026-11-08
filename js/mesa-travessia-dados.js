// Geometry in metres; persisted positions retain the board's 28 × 14 coordinates.
export const propTrav=(o,k)=>o?.[k]??o?.oficinaElement?.[k];
export const pisoTrav=o=>Math.max(1,Number(propTrav(o,'andarV144'))||1);
export const noPiso=(o,p)=>!!propTrav(o,'andarAmbosV144')||pisoTrav(o)===p;
export const raioTrav=t=>Math.max(.1,(Number(t?.diametroM)||1)*.4);
export const metros=(p,W,H)=>({x:Number(p.x)*W/28,y:Number(p.y)*H/14});
export function folgaRet(p,o,W,H){const c=metros(o,W,H),a=-(Number(o.angulo)||0)*Math.PI/180,dx=p.x-c.x,dy=p.y-c.y,x=Math.abs(dx*Math.cos(a)-dy*Math.sin(a))-(Number(o.larguraM)||1)/2,y=Math.abs(dx*Math.sin(a)+dy*Math.cos(a))-(Number(o.alturaM)||1)/2;return Math.hypot(Math.max(x,0),Math.max(y,0))+Math.min(Math.max(x,y),0);}
export function pontoLivre(p,{objects=[],tokens=[],token={},andar=1,W=28,H=14}={}){
 if(!Number.isFinite(p?.x)||!Number.isFinite(p?.y))return false;const q=metros(p,W,H),r=raioTrav(token);if(q.x<r||q.y<r||q.x>W-r||q.y>H-r)return false;
 if(objects.some(o=>!o.destruido&&o.bloqueiaMovimento&&(o.camada??3)===3&&noPiso(o,andar)&&folgaRet(q,o,W,H)<r-1e-7))return false;
 if(tokens.some(t=>t.id!==token.id&&(t.andar??1)===andar&&Math.hypot((t.x-p.x)*W/28,(t.y-p.y)*H/14)<r+raioTrav(t)))return false;
 if(andar>1&&!objects.some(o=>Number(propTrav(o,'pisoAndarV144'))===andar&&!o.destruido&&folgaRet(q,o,W,H)<=-r))return false;
 return true;
}
export function patamarLivre(escada,context){const explicit=propTrav(escada,'saidaAndarV144')?.[context.andar];const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);const origin=valid(explicit)?explicit:{x:Number(escada.x),y:Number(escada.y)};
 if(pontoLivre(origin,context))return origin;
 // Never teleport beyond the local landing to compensate for an enclosed stair.
 for(let radius=.2;radius<=2.40001;radius+=.2)for(let k=0;k<32;k++){const a=k*Math.PI/16,p={x:origin.x+Math.cos(a)*radius*28/context.W,y:origin.y+Math.sin(a)*radius*14/context.H};if(pontoLivre(p,context))return p;}
 return null;
}
export function alturaNoPonto(p,andar,objects,W,H){const q=metros(p,W,H),floors=objects.filter(o=>Number(propTrav(o,'pisoAndarV144'))===andar&&folgaRet(q,o,W,H)<=0);return Math.max((andar-1)*3,...floors.map(o=>Number(propTrav(o,'elevacaoM'))||0));}
export function planejarSalto({de,para,andarDe=1,andarPara=1,objects=[],tokens=[],token={},W=28,H=14,atletismo=0}){
 if(!Number.isFinite(de?.x)||!Number.isFinite(de?.y)||!Number.isFinite(W)||!Number.isFinite(H)||W<=0||H<=0||!Number.isInteger(andarDe)||andarDe<1)throw Error('Origem ou escala do salto inválida.');
 if(!Number.isInteger(andarPara)||andarPara<1)throw Error('Andar de destino inválido.');if(!pontoLivre(para,{objects,tokens,token,andar:andarPara,W,H}))throw Error('O destino não tem espaço livre ou piso para aterrissar.');
 const dist=Math.hypot((para.x-de.x)*W/28,(para.y-de.y)*H/14),z0=alturaNoPonto(de,andarDe,objects,W,H),z1=alturaNoPonto(para,andarPara,objects,W,H),dh=z1-z0;
 if(dist<.15)throw Error('Escolha um destino um pouco mais distante.');if(dist>4.0001)throw Error('O salto comum alcança até 4 m.');if(dh>1.2001)throw Error('A subida supera 1,2 m. Use uma escada.');if(dh< -6)throw Error('A queda supera 6 m. Esta travessia exige orientação do mestre.');
 const arc=.6+Math.min(.6,dist*.15),steps=Math.ceil(dist/.08);
 for(let i=1;i<steps;i++){const f=i/steps,p={x:de.x+(para.x-de.x)*f,y:de.y+(para.y-de.y)*f},q=metros(p,W,H),z=z0+(z1-z0)*f+4*arc*f*(1-f);for(const o of objects){if(!o.bloqueiaMovimento||o.destruido||(o.camada??3)!==3||o.aguaV178||o.material==='AGUA_OASIS')continue;const bottom=(pisoTrav(o)-1)*3,explicit=propTrav(o,'alturaFisicaM'),height=Number.isFinite(explicit)?Math.max(0,explicit):/parapeito/i.test(o.nome||'')?1:3;if(z>=bottom-.05&&z<bottom+height+.1&&folgaRet(q,o,W,H)<raioTrav(token))throw Error('Uma parede ou obstáculo bloqueia a trajetória do salto.');}}
 const penalidade=Math.ceil(Math.max(0,dist-2))*10+Math.ceil(Math.max(0,dh)*20)+Math.ceil(Math.max(0,-dh-1))*5,chance=Math.max(0,Math.min(95,Math.round(Number(atletismo)||0)-penalidade));return{dist,desnivel:dh,chance,penalidade,de,para,andarDe,andarPara};
}
export function resolverSalto(plano,dado){if(!Number.isInteger(dado)||dado<1||dado>100)throw Error('Dado inválido.');const sucesso=plano.chance>0&&dado<=plano.chance,descida=plano.desnivel<0,alturaQueda=Math.max(0,-plano.desnivel-(sucesso?2:1)),dadosDano=Math.ceil(alturaQueda/2);return{sucesso,dado,destino:sucesso||descida?plano.para:plano.de,andar:sucesso||descida?plano.andarPara:plano.andarDe,caido:!sucesso||dadosDano>0,dadosDano,distancia:sucesso||descida?plano.dist:0};}
