// Mesa Estelar v163 — Marcas sobre um mapa feito de imagem (lógica pura, sem tela).
//
// O mestre (ou o reconhecimento inicial) marca áreas na imagem de fundo: parede, rocha, móvel, água, porta, escada,
// teto, "por cima" (toldo, varal, galho), planta e tapete. Cada etiqueta vira um comportamento no mapa:
//  - parede/rocha: bloqueiam movimento e visão (paredes invisíveis; a imagem já desenha);
//  - móvel/água: bloqueiam só o movimento;
//  - porta: abre passagem (tira a parede embaixo dela);
//  - escada: marca (invisível) chamada "Escada";
//  - teto: recorte da imagem por cima dos personagens que some quando um jogador entra embaixo;
//  - por cima / planta: o pedaço da imagem fica por cima dos personagens (eles passam por baixo);
//  - tapete: só anotação.
// Coordenadas em metros, origem no canto de cima à esquerda.

import {fabrica} from './mesa-gerador-mapas.js?v=163';

export const ETIQUETAS={
 parede:{nome:'Parede / casa',ic:'🧱',cor:'#ff4d6d',bloq:true,visao:true},
 terraco:{nome:'Casa com terraço (2º andar)',ic:'🏘️',cor:'#9c36b5',bloq:true,visao:true,terraco:true},
 rocha:{nome:'Rocha / penhasco',ic:'🪨',cor:'#c8783a',bloq:true,visao:true},
 movel:{nome:'Móvel / balcão / caixote',ic:'📦',cor:'#ffa94d',bloq:true,visao:false},
 agua:{nome:'Água',ic:'💧',cor:'#4dabf7',bloq:true,visao:false},
 porta:{nome:'Porta / passagem',ic:'🚪',cor:'#51cf66',abre:true},
 escada:{nome:'Escada',ic:'🪜',cor:'#fcc419'},
 teto:{nome:'Teto (abre quando entra)',ic:'🏠',cor:'#cc5de8',teto:true},
 acima:{nome:'Por cima (toldo, varal, galho)',ic:'⛺',cor:'#20c997',acima:true},
 planta:{nome:'Planta',ic:'🌿',cor:'#94d82d',acima:true},
 tapete:{nome:'Tapete / chão',ic:'🟫',cor:'#adb5bd'}
};
export const ORDEM_ETIQUETAS=Object.keys(ETIQUETAS);

export function pontoNoPoligono(x,y,pts){
 let dentro=false;
 for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-9)+xi))dentro=!dentro;}
 return dentro;
}
export function caixaDaMarca(m){
 if(m.forma==='poli'&&Array.isArray(m.pts)&&m.pts.length){const xs=m.pts.map(p=>p[0]),ys=m.pts.map(p=>p[1]);const x=Math.min(...xs),y=Math.min(...ys);return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};}
 if(m.forma==='celulas'&&m.celulas){const c=m.celulas;return {x:c.x,y:c.y,w:c.w*c.passo,h:c.h*c.passo};}
 return {x:Number(m.x)||0,y:Number(m.y)||0,w:Math.max(.05,Number(m.w)||0),h:Math.max(.05,Number(m.h)||0)};
}
export function contem(m,x,y){
 if(m.forma==='poli')return pontoNoPoligono(x,y,m.pts||[]);
 if(m.forma==='celulas'&&m.celulas){const c=m.celulas,i=Math.floor((x-c.x)/c.passo),j=Math.floor((y-c.y)/c.passo);if(i<0||j<0||i>=c.w||j>=c.h)return false;return bitLigado(c.bits,j*c.w+i);}
 const b=caixaDaMarca(m);return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
}
// máscara de células (varinha) guardada em base64 compacto
export function bitsParaTexto(arr){let s='';for(let i=0;i<arr.length;i+=6){let v=0;for(let k=0;k<6;k++)if(arr[i+k])v|=1<<k;s+='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[v];}return s;}
export function bitLigado(txt,i){const c=String(txt||'').charCodeAt(Math.floor(i/6));if(Number.isNaN(c))return false;const v='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.indexOf(String.fromCharCode(c));return v>=0&&!!(v&(1<<(i%6)));}

// grade (passo em metros) com as células cobertas por marcas destes tipos
export function gradeDeMarcas(marcas,{W,H,passo=.25,tipos}){
 const cw=Math.ceil(W/passo),ch=Math.ceil(H/passo),g=new Uint8Array(cw*ch);
 const pinta=(m,v)=>{const b=caixaDaMarca(m),i0=Math.max(0,Math.floor(b.x/passo)),j0=Math.max(0,Math.floor(b.y/passo)),i1=Math.min(cw,Math.ceil((b.x+b.w)/passo)),j1=Math.min(ch,Math.ceil((b.y+b.h)/passo));
  for(let j=j0;j<j1;j++)for(let i=i0;i<i1;i++)if(contem(m,(i+.5)*passo,(j+.5)*passo))g[j*cw+i]=v;};
 for(const m of marcas)if(tipos.includes(m.tipo))pinta(m,1);
 for(const m of marcas)if(m.tipo==='porta')pinta(m,0);
 return {g,cw,ch,passo};
}
// junta células vizinhas em poucos retângulos (linhas iguais empilhadas)
export function retangulosDaGrade({g,cw,ch,passo}){
 const usado=new Uint8Array(cw*ch),out=[];
 for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){
  if(!g[j*cw+i]||usado[j*cw+i])continue;
  let w=1;while(i+w<cw&&g[j*cw+i+w]&&!usado[j*cw+i+w])w++;
  let h=1;fora:while(j+h<ch){for(let k=i;k<i+w;k++)if(!g[(j+h)*cw+k]||usado[(j+h)*cw+k])break fora;h++;}
  for(let y=j;y<j+h;y++)for(let x=i;x<i+w;x++)usado[y*cw+x]=1;
  out.push({x:+(i*passo).toFixed(2),y:+(j*passo).toFixed(2),w:+(w*passo).toFixed(2),h:+(h*passo).toFixed(2)});
 }
 return out;
}

// Elementos do mapa (formato da Oficina) a partir das marcas.
// acimaSrc: imagem do tamanho do mapa só com os pedaços "por cima" (o resto transparente).
// tetos: {idDaMarca: {src}} recortes de cada teto.
export function elementosDeMarcas(marcas=[],{W,H,acimaSrc='',tetos={},semente=163}={}){
 const f=fabrica(semente),els=[];
 const inv=(r,nome,visao)=>{const e=f.forma(r.x,r.y,r.w,r.h,{fill:'#3a2a1a',nome,bloq:true,opacity:0,material:'pedra',visao});e.invisivelV161=true;e.marcaV163=true;return e;};
 const grupos=[[['parede','rocha','terraco'],'Parede',true],[['movel','agua'],'Obstáculo',false]];
 for(const [tipos,nome,visao] of grupos){
  const extra=marcas.filter(m=>m.bloq&&ETIQUETAS[m.tipo]?.acima&&!visao).map(m=>({...m,tipo:tipos[0]})); // planta/toldo marcados "bloqueia"
  for(const r of retangulosDaGrade(gradeDeMarcas([...marcas,...extra],{W,H,tipos})))els.push(inv(r,nome,visao));
 }
 // v164: terraços = 2º andar no mesmo mapa (mesa-andares). Em cima só se anda no terraço (a mureta e o vazio barram);
 // escada encostada num terraço leva da rua ao terraço; quem está no terraço continua visível da rua.
 const temTerraco=marcas.some(m=>m.tipo==='terraco');let andar2=null;
 if(temTerraco){
  const gT=gradeDeMarcas(marcas,{W,H,passo:.5,tipos:['terraco']}),{cw,ch}=gT,anda=new Uint8Array(cw*ch);
  for(let j=1;j<ch-1;j++)for(let i=1;i<cw-1;i++){const k=j*cw+i;if(gT.g[k]&&gT.g[k-1]&&gT.g[k+1]&&gT.g[k-cw]&&gT.g[k+cw])anda[k]=1;}
  const fora=new Uint8Array(cw*ch);for(let k=0;k<fora.length;k++)fora[k]=anda[k]?0:1;
  for(const r of retangulosDaGrade({g:fora,cw,ch,passo:.5})){const e=f.forma(r.x,r.y,r.w,r.h,{fill:'#3a2a1a',nome:'Beirada do terraço',bloq:true,opacity:0,visao:false});Object.assign(e,{invisivelV161:true,marcaV163:true,andarV144:2});els.push(e);}
  for(const r of retangulosDaGrade(gT)){const e=f.forma(r.x,r.y,r.w,r.h,{fill:'#9c36b5',nome:'Terraço',bloq:false,opacity:0,camada:1});Object.assign(e,{invisivelV161:true,marcaV163:true,andarV144:2,pisoAndarV144:2,abertoV164:true});els.push(e);}
  const g1=gradeDeMarcas(marcas,{W,H,passo:.5,tipos:['parede','rocha','terraco','movel','agua']});
  const perto=(grade,cond,cx,cy,max=4)=>{let best=null,bd=1e9;const i0=Math.max(0,Math.floor((cx-max)/.5)),i1=Math.min(cw-1,Math.ceil((cx+max)/.5)),j0=Math.max(0,Math.floor((cy-max)/.5)),j1=Math.min(ch-1,Math.ceil((cy+max)/.5));
   for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){if(!cond(grade[j*cw+i]))continue;const x=(i+.5)*.5,y=(j+.5)*.5,d=Math.hypot(x-cx,y-cy);if(d<bd){bd=d;best={x,y,d};}}return best;};
  andar2={anda,perto,g1:g1.g};
 }
 const N=p=>({x:+(p.x*28/W).toFixed(3),y:+(p.y*14/H).toFixed(3)});
 for(const m of marcas.filter(m=>m.tipo==='escada')){const b=caixaDaMarca(m),cx=b.x+b.w/2,cy=b.y+b.h/2;
  const cima=andar2?.perto(andar2.anda,v=>!!v,cx,cy,Math.max(b.w,b.h)/2+2.5),baixo=andar2?.perto(andar2.g1,v=>!v,cx,cy,Math.max(b.w,b.h)/2+3);
  if(cima&&baixo){const e=f.forma(b.x,b.y,b.w,b.h,{fill:'#fcc419',nome:m.nome?`Escada · ${m.nome}`:'Escada do terraço',bloq:false,opacity:0,camada:1});
   Object.assign(e,{invisivelV161:true,marcaV163:true,escadaAndarV144:true,andarAmbosV144:true,saidaAndarV144:{1:N(baixo),2:N(cima)}});els.push(e);continue;}
  const e=f.forma(b.x,b.y,b.w,b.h,{fill:'#fcc419',nome:m.nome?`Escada · ${m.nome}`:'Escada',bloq:false,opacity:0,camada:1});e.invisivelV161=true;e.marcaV163=true;els.push(e);}
 // v168: marcas com nome de portão viram um ponto (invisível, não barra) chamado assim: o pedágio acha o portão por ele
 for(const m of marcas.filter(m=>/port[aã]o/i.test(String(m.nome||''))&&m.tipo!=='porta')){const b=caixaDaMarca(m);const e=f.forma(b.x,b.y,b.w,b.h,{fill:'#51cf66',nome:m.nome,bloq:false,opacity:0,camada:1,visao:false});e.invisivelV161=true;e.marcaV163=true;e.portaoV168=true;els.push(e);}
 for(const m of marcas.filter(m=>m.tipo==='teto')){const t=tetos[m.id];if(!t?.src)continue;const b=caixaDaMarca(m);
  els.push({id:'img:mk163:teto:'+m.id,type:'image',src:t.src,name:'Telhado · '+(m.nome||'casa'),nome:'Telhado · '+(m.nome||'casa'),x:+b.x.toFixed(2),y:+b.y.toFixed(2),w:+b.w.toFixed(2),h:+b.h.toFixed(2),rot:0,z:9000,locked:true,opacity:1,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,tetoV139:true,marcaV163:true});}
 if(acimaSrc)els.push({id:'img:mk163:acima',type:'image',src:acimaSrc,name:'Coberturas (toldos, varais, plantas)',nome:'Coberturas (toldos, varais, plantas)',x:0,y:0,w:W,h:H,rot:0,z:9001,locked:true,opacity:1,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,acimaV163:true,marcaV163:true});
 return els;
}
// Quais marcas entram na imagem "por cima"
export const marcasAcima=marcas=>marcas.filter(m=>ETIQUETAS[m.tipo]?.acima);
// Resumo para o painel
export function resumoMarcas(marcas=[]){const n={};for(const m of marcas)n[m.tipo]=(n[m.tipo]||0)+1;return n;}
