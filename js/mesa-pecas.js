// Mesa Estelar v170 — Peças feitas das imagens da pasta arte-fonte/imagens-ia (casas, toldos, barris, escadas, chãos…).
// • O navegador do mestre cadastra cada peça no Banco de Objetos de Mapa (uma vez; peça nova ou com tamanho mudado é
//   atualizada). As imagens são publicadas junto com o site (arte/pecas/*.webp), já limpas e no tamanho real.
// • Decorador (puro): espalha peças numa cena sem fechar passagem — coisas que barram só encostadas na parede e com
//   rua livre na frente; chão/tapete/planta não barram.
// • Plantas pequenas nunca barram ninguém (o personagem passa por elas, como passaria empurrando um galho).

import {PECAS as PECAS_IA} from './mesa-pecas-dados.js?v=171';
import {PECAS_3D} from './mesa-pecas3d-dados.js?v=200'; // v200: peças 3D vistas de cima (pacotes Quaternius, domínio público)
import {PECAS_BLENDER} from './mesa-pecas-blender-dados.js?v=203'; // v203: móveis e veículos modelados no Blender, vistos de cima
const PECAS=[...PECAS_IA,...PECAS_3D,...PECAS_BLENDER];

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const VERSAO_PECAS=170;
export const docIdObjeto=id=>`objetoMapa_${String(id||'objeto').replace(/[^a-zA-Z0-9_-]/g,'_')}`;

// planta pequena: passa por ela
export function plantaPassavel(o){
 if(!o)return false;const n=sem(o.nome||o.modeloId||o.oficinaElement?.modeloId||'');
 if(!/planta|agave|arbusto|samambaia|\bflor|erva|capim|grama|moita|folhagem|cacto|broto|muda\b/.test(n))return false;
 const a=(Number(o.larguraM)||1)*(Number(o.alturaM)||1);return a<=4.5;
}

export function modeloDaPeca(p,base=''){
 const src=base?new URL(p.src,base).href:p.src;
 return {id:p.id,nome:p.nome,tipoVisual:'personalizado',larguraM:p.larguraM,alturaM:p.alturaM,camada:p.camada,material:p.material||(p.cat==='casa'||p.cat==='parede'?'pedra':''),pesoKg:0,
  pvMax:Number(p.pvMax)||0,dureza:Number(p.dureza)||0,destrutivel:Number(p.pvMax)>0,inflamabilidade:Number(p.inflamabilidade)||0,inflamavel:Number(p.inflamabilidade)>0,bloqueiaMovimento:!!p.bloq,bloqueiaVisao:p.cat==='casa'||p.cat==='parede',fixoAoMapa:false,imagem:src,
  pecaV170:{cat:p.cat,versao:VERSAO_PECAS},...(p.cat==='telhado'?{tetoV139:true}:{})};
}

// ---------------------------------------------------------------- decorador (puro)
// grade de 0,5 m com o que barra; devolve elementos novos (formato da cena da mesa: x,y normalizados 28×14)
export function decorar(cena,{W,H,pedidos=[],semente=170,pecas=PECAS,evitar=[]}={}){
 const P=.5,cw=Math.ceil(W/P),ch=Math.ceil(H/P),g=new Uint8Array(cw*ch);let s=semente>>>0||1;const r=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
 const marca=(x,y,w,h,v=1)=>{for(let j=Math.max(0,Math.floor(y/P));j<Math.min(ch,Math.ceil((y+h)/P));j++)for(let i=Math.max(0,Math.floor(x/P));i<Math.min(cw,Math.ceil((x+w)/P));i++)g[j*cw+i]=Math.max(g[j*cw+i],v);};
 const livre=(x,y,w,h,ate=1)=>{if(x<.3||y<.3||x+w>W-.3||y+h>H-.3)return false;for(let j=Math.floor(y/P);j<Math.ceil((y+h)/P);j++)for(let i=Math.floor(x/P);i<Math.ceil((x+w)/P);i++)if(g[j*cw+i]>=ate)return false;return true;};
 const parede=(x,y)=>{const i=Math.floor(x/P),j=Math.floor(y/P);return i<0||j<0||i>=cw||j>=ch||g[j*cw+i]===2;};
 for(const o of cena?.objects||[]){const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1,x=Number(o.x)*W/28-w/2,y=Number(o.y)*H/14-h/2,e=o.oficinaElement||{};
  if(Number(e.andarV144||o.andarV144||1)>1)continue;
  if(o.bloqueiaMovimento&&!o.destruido)marca(x,y,w,h,2);else if(Number(o.camada??3)>=3||/porta|escada|escadaria|saida/i.test(String(o.nome||'')))marca(x-.6,y-.6,w+1.2,h+1.2,1);}
 for(const z of evitar)marca(z.x-1.5,z.y-1.5,z.w+3,z.h+3,1); // saídas, portas: ficam livres
 const porId=new Map(pecas.map(p=>[p.id,p])),out=[];let n=0;
 for(const ped of pedidos){
  const ids=(ped.ids||[]).filter(i=>porId.has(i));if(!ids.length)continue;let feitos=0;
  for(let t=0;t<(ped.qtd||1)*60&&feitos<(ped.qtd||1);t++){
   const p=porId.get(ids[Math.floor(r()*ids.length)]),esc=ped.escala||1;let w=p.larguraM*esc,h=p.alturaM*esc,rot=0;
   if(ped.girar&&r()<.5){rot=90;[w,h]=[h,w];}
   const A=ped.area||{x:0,y:0,w:W,h:H},x=A.x+r()*Math.max(0,A.w-w),y=A.y+r()*Math.max(0,A.h-h);
   if(!livre(x,y,w,h,p.bloq?1:2))continue;
   if(ped.parede){ // encostado: algum lado toca a parede; o lado oposto tem 1,8 m de rua livre
    const lados=[[x-.3,y+h/2,'o'],[x+w+.3,y+h/2,'l'],[x+w/2,y-.3,'n'],[x+w/2,y+h+.3,'s']].filter(([px,py])=>parede(px,py));if(!lados.length)continue;
    const L=lados[0][2],f={o:[x+w,y,1.8,h],l:[x-1.8,y,1.8,h],n:[x,y+h,w,1.8],s:[x,y-1.8,w,1.8]}[L];if(p.bloq&&!livre(...f,2))continue;}
   if(ped.longeParede){let perto=false;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(parede(x+w/2+dx*(w/2+.8),y+h/2+dy*(h/2+.8)))perto=true;if(perto)continue;}
   marca(x-.2,y-.2,w+.4,h+.4,p.bloq?2:1);n++;feitos++;
   const ow=rot?h:w,oh=rot?w:h; // tamanho do objeto sem girar
   out.push({id:'deco170_'+(ped.tag||'d')+'_'+n.toString(36),nome:p.nome,modeloId:p.id,objetoBancoId:p.id,imagem:p.src,x:+((x+w/2)*28/W).toFixed(3),y:+((y+h/2)*14/H).toFixed(3),larguraM:+ow.toFixed(2),alturaM:+oh.toFixed(2),
    angulo:rot,camada:p.camada,bloqueiaMovimento:!!p.bloq,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,material:'',decoV170:ped.tag||true,...(p.cat==='telhado'?{tetoV139:true}:{})});
  }
 }
 return out;
}

// ---------------------------------------------------------------- instalação (mestre cadastra as peças no banco)
export function instalarPecas(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const objetos=()=>{try{return dep.objetosMapa?.()||[];}catch(_){return [];}};
 globalThis.mesaPassavelV170_=plantaPassavel;
 let feito=false,rodando=false;
 async function cadastrar(){
  if(feito||rodando||!ehMestre()||objetos().length<3)return;rodando=true;
  try{
   const base=win.location?.href||'',lista=objetos(),novos=[];
   for(const p of PECAS){const m=lista.find(o=>String(o.id)===p.id),mod=modeloDaPeca(p,base);
    if(m&&m.pecaV170?.versao===VERSAO_PECAS&&Number(m.larguraM)===mod.larguraM&&String(m.imagem)===mod.imagem)continue;
    await dep.setDoc(D('configuracoes/'+docIdObjeto(p.id)),clean(mod));if(m)Object.assign(m,mod);else lista.push(mod);novos.push(p.id);}
   if(novos.length){const idx=await dep.getDoc(D('configuracoes/objetosMapa'));const atual=idx.exists()?idx.data():{};
    const ids=[...new Set([...(Array.isArray(atual.ids)?atual.ids:lista.map(o=>o.id)),...novos])];
    await dep.setDoc(D('configuracoes/objetosMapa'),{...atual,formato:'docs-v1',ids,atualizadoEm:new Date().toISOString()});
    try{dep.aoConcluir?.();}catch(_){}console.info('[Peças] cadastradas',novos.length);}
   feito=true;
  }catch(e){console.warn('[Peças]',e);}finally{rodando=false;}
 }
 const vigia=setInterval(()=>{void cadastrar();},4000);
 win.mesaPecasV170={cadastrar,PECAS,decorar,plantaPassavel};
 return {parar(){clearInterval(vigia);}};
}
