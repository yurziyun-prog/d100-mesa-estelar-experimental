import {diametroMiniatura} from './nova-recuperacao.js?v=46';
export function distanciaObjeto(a,o,map={}){
 const sx=(map.larguraM||28)/28,sy=(map.alturaM||14)/14,angle=-(Number(o.angulo)||0)*Math.PI/180,dx=(a.x-o.x)*sx,dy=(a.y-o.y)*sy;
 const x=dx*Math.cos(angle)-dy*Math.sin(angle),y=dx*Math.sin(angle)+dy*Math.cos(angle);
 return Math.max(0,Math.hypot(Math.max(0,Math.abs(x)-(o.larguraM||1)/2),Math.max(0,Math.abs(y)-(o.alturaM||1)/2))-diametroMiniatura(a)/2);
}
export function danoObjeto(o,bruto,penetracao=0){
 if(o.destrutivel!==true)throw Error('Este objeto é indestrutível.');if(o.destruido||Number(o.pvAtual??o.pvMax)<=0)throw Error('Este objeto já está destruído.');
 const raw=Math.max(0,Math.floor(Number(bruto)||0)),dureza=Math.max(0,Number(o.dureza)||0),pen=Math.max(0,Number(penetracao)||0),efetiva=Math.max(0,dureza-pen),dano=Math.max(0,raw-efetiva),pv=Math.max(0,Number(o.pvAtual??o.pvMax)-dano);
 const object={...structuredClone(o),pvAtual:pv,destruido:pv===0};
 if(object.destruido){object.bloqueiosOriginais={movimento:!!o.bloqueiaMovimento,visao:!!o.bloqueiaVisao};object.bloqueiaMovimento=false;object.bloqueiaVisao=false;}
 return {object,bruto:raw,dureza,penetracao:pen,efetiva,dano};
}
export function restaurarObjeto(o){const restored={...o,pvAtual:o.pvMax||0,destruido:false};if(o.bloqueiosOriginais){restored.bloqueiaMovimento=o.bloqueiosOriginais.movimento;restored.bloqueiaVisao=o.bloqueiosOriginais.visao;delete restored.bloqueiosOriginais;}return restored;}
