// Mesa Estelar v199 — Geradores de mapa do MapForge (masmorra, cidade, exterior) → PLANO para o Editor rápido.
//
// O motor do MapForge (js/mesa-mapforge-motor.js, carregado só quando o mestre abre o gerador) devolve geometria em metros: salas, corredores, ruas,
// prédios, paredes com vãos de porta, adereços, terreno em grade, trilhas, penhascos e água. Este módulo converte isso num PLANO simples
// (listas de pisos, paredes, portas, telhados, objetos, árvores, luzes e legendas, tudo em metros) com as TEXTURAS do mapa da mesa.
// O Editor rápido transforma o plano em objetos do rascunho (nada é gravado até 💾 Salvar mapa; Ctrl+Z desfaz a geração inteira).
// Funções puras (testáveis no Node), exceto gerarPlano (carrega o motor) e desenharPrevia (canvas).

import {cavernaNatural,abrirEntradas,celulasDe,retangulosDeCelulas,mulberry32} from './mesa-terreno-natural.js?v=201';
export const ESTILOS=[['retrofuturista','Retrofuturista (era atômica)'],['futurista','Futurista'],['medieval','Medieval'],['hiboriano','Hiboriano (era de Conan)'],['hibrido','Híbrido (pedra e neon)']];
export const BIOMAS=[['floresta','Floresta'],['penhasco','Penhasco'],['campo','Campo aberto'],['mina','Mina / pedreira']];
export const TIPOS=[['masmorra','🏚️ Masmorra'],['cidade','🏙️ Cidade'],['exterior','🌲 Exterior'],['caverna','🕳️ Caverna']];
export const TAMANHO_PADRAO={masmorra:[48,32],cidade:[110,80],exterior:[90,60],caverna:[60,40]};
/** grossura padrão das paredes (m) e opções do seletor do gerador (valor '' = padrão do estilo; 'custom' = campo livre) */
export const ESP_PADRAO=.45;
export const ESP_OPCOES=[['','Padrão ('+String(ESP_PADRAO).replace('.',',')+' m)'],['.25','Fina (0,25 m)'],['.4','Média (0,4 m)'],['.6','Grossa (0,6 m)'],['1','Muralha (1 m)'],['2','Fortaleza (2 m)'],['custom','Outra…']];
const espDe=op=>{const v=Number(op?.espessura);return Number.isFinite(v)&&v>=.1&&v<=6?v:0;};
/** quantos objetos novos o plano pode ter (≈480 bytes cada; a cena do mapa cabe em ~650 KB) */
export const MAX_OBJETOS=1000;

// ---------------------------------------------------------------- texturas por estilo (ids de TEXTURAS_BASE)
const E={
 retrofuturista:{chao:'terra_batida',parede:'metal',telhado:['chapa_xadrez','metal'],interior:'azulejo',rua:'terra_batida',praca:'pedra',parque:'grama_curta',
  piso:{entry:'azulejo',exit:'chapa_xadrez',hall:'azulejo',lab:'painel_scifi',utility:'chapa_xadrez',storage:'metal',quarters:'madeira',corridor:'aco_escovado'}},
 futurista:{chao:'aco_escovado',parede:'painel_scifi',telhado:['painel_scifi','aco_escovado'],interior:'aco_escovado',rua:'chapa_xadrez',praca:'aco_escovado',parque:'grama_alta',
  piso:{entry:'aco_escovado',exit:'chapa_xadrez',hall:'aco_escovado',lab:'painel_scifi',utility:'chapa_xadrez',storage:'metal',quarters:'azulejo',corridor:'chapa_xadrez'}},
 medieval:{chao:'terra',parede:'rocha',telhado:['telha','palha','telha'],interior:'madeira',rua:'cascalho',praca:'pedra',parque:'grama_curta',
  piso:{entry:'pedra',exit:'pedra',hall:'pedra',lab:'madeira',utility:'pedra',storage:'madeira',quarters:'madeira',corridor:'pedregulhos'}},
 hiboriano:{chao:'areia_clara',parede:'pedra',telhado:['palha','telha'],interior:'areia_clara',rua:'areia_clara',praca:'pedra',parque:'grama_seca',
  piso:{entry:'pedra',exit:'pedra',hall:'marmore_vermelho',lab:'pedra',utility:'areia_clara',storage:'madeira',quarters:'madeira',corridor:'pedra'}},
 hibrido:{chao:'terra_batida',parede:'pedra',telhado:['telha','chapa_xadrez'],interior:'pedra',rua:'terra_batida',praca:'pedra',parque:'grama_curta',
  piso:{entry:'pedra',exit:'pedra',hall:'pedra',lab:'painel_scifi',utility:'chapa_xadrez',storage:'madeira',quarters:'madeira',corridor:'pedra'}}
};
const BASE_BIOMA={floresta:'grama_alta',penhasco:'terra_batida',campo:'grama_curta',mina:'terra_rachada'};
const TERRENO={grass:null,dirt:'terra_batida',rock:'cascalho',water:'agua_rasa',sand:'areia_clara',field:'grama_seca'};
const COPA_BIOMA={floresta:{broadleaf:'copa_densa',pine:'copa_conifera',bush:'copa_moitas'},campo:{broadleaf:'copa_oasis',pine:'copa_conifera',bush:'copa_moitas'},
 penhasco:{broadleaf:'copa_sombria',pine:'copa_conifera',bush:'copa_arbustal'},mina:{broadleaf:'copa_sombria',pine:'copa_conifera',bush:'copa_arbustal'}};
/** adereço do MapForge → objeto do banco do site (palavras-chave) / luz / escada / pula */
const ADERECO={
 stairsDown:{escada:true},floorLamp:{luz:[3.6,'#ffd9a0']},lamp:{luz:[3.2,'#ffd9a0']},bench:{kw:'banco'},serverRack:{kw:'terminal|computador|armario|console'},generator:{kw:'gerador'},
 holotable:{kw:'mesa de vidro|mesa'},console:{kw:'terminal|console|computador'},brazier:{kw:'braseiro|barril',luz:[3,'#ff9a4a']},cauldron:{kw:'barril|caldeir'},longTable:{kw:'mesa comprida|mesa longa|mesa'},
 bookshelf:{kw:'estante|armario'},altar:{kw:'estatua|mesa'},idol:{kw:'estatua'},cryopod:{kw:'capsula'},fountain:{kw:'fonte'},stall:{kw:'barraca'},vehicle:{kw:'carro|carroca|veiculo'},
 log:{kw:'tronco'},rock:{kw:'pedra|rocha'},pipeRun:{},stump:{},flowers:{}
};
const r2=x=>Math.round(x*100)/100;
const R=(x,y,w,h)=>({x:r2(x),y:r2(y),w:r2(w),h:r2(h)});
const HASH=(a,b)=>{const t=Math.sin(a*127.1+b*311.7)*43758.5453;return t-Math.floor(t);};

// ---------------------------------------------------------------- geometria
function dentroPoligono(x,y,P){let d=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)d=!d;}return d;}
/** polígono → retângulos de 1 m (linhas juntas na horizontal e depois na vertical) */
export function rasterizar(P,cel=1){
 if(!P||P.length<3)return [];
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of P){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);}
 const i0=Math.floor(x0/cel),i1=Math.ceil(x1/cel),j0=Math.floor(y0/cel),j1=Math.ceil(y1/cel),linhas=[];
 for(let j=j0;j<j1;j++){let ini=null;const corr=[];
  for(let i=i0;i<=i1;i++){const dentro=i<i1&&dentroPoligono((i+.5)*cel,(j+.5)*cel,P);if(dentro&&ini===null)ini=i;if(!dentro&&ini!==null){corr.push([ini,i]);ini=null;}}
  linhas.push([j,corr]);}
 const abertos=new Map(),out=[],fecha=o=>out.push(R(o.a*cel,o.j0*cel,(o.b-o.a)*cel,(o.j1-o.j0)*cel));
 for(const [j,corr] of linhas){
  const chaves=new Set(corr.map(([p,q])=>p+','+q));
  for(const [k,o] of [...abertos])if(!chaves.has(k)){fecha(o);abertos.delete(k);}
  for(const [p,q] of corr){const k=p+','+q,o=abertos.get(k);if(o)o.j1=j+1;else abertos.set(k,{a:p,b:q,j0:j,j1:j+1});}
 }
 for(const o of abertos.values())fecha(o);
 return out;
}
/** faixa (corredor, rua, trilha) → retângulos: exato nos trechos retos, rasterizado nos tortos */
export function rectsDeFaixa(path,largura,poligono){
 if(!path||path.length<2)return rasterizar(poligono||[]);
 const reto=path.every((p,i)=>i===0||Math.abs(p.x-path[i-1].x)<1e-6||Math.abs(p.y-path[i-1].y)<1e-6);
 if(!reto)return rasterizar(poligono||[]);
 const out=[],h=largura/2;
 for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1],ext0=i>0?h:0,ext1=i<path.length-2?h:0;
  if(Math.abs(a.y-b.y)<1e-6){const xa=Math.min(a.x,b.x),xb=Math.max(a.x,b.x),dir=b.x>=a.x?1:-1,e0=dir>0?ext0:ext1,e1=dir>0?ext1:ext0;out.push(R(xa-e0,a.y-h,xb-xa+e0+e1,largura));}
  else{const ya=Math.min(a.y,b.y),yb=Math.max(a.y,b.y),dir=b.y>=a.y?1:-1,e0=dir>0?ext0:ext1,e1=dir>0?ext1:ext0;out.push(R(a.x-h,ya-e0,largura,yb-ya+e0+e1));}}
 return out;
}
/** paredes finas dos dois lados de uma faixa reta (corredor da masmorra) */
function paredesDeFaixa(path,largura,esp,tex,plano){
 if(!path||path.length<2||!path.every((p,i)=>i===0||Math.abs(p.x-path[i-1].x)<1e-6||Math.abs(p.y-path[i-1].y)<1e-6))return;
 const h=largura/2,t=esp;
 for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1],n=path.length-1;
  if(Math.abs(a.y-b.y)<1e-6){const xa=Math.min(a.x,b.x),xb=Math.max(a.x,b.x);for(const s of [-1,1])plano.paredes.push({r:R(xa-(i>0&&i<n?t/2:0),a.y+s*h-t/2,xb-xa+(i>0&&i<n?t:0),t),tex,esp:t});}
  else{const ya=Math.min(a.y,b.y),yb=Math.max(a.y,b.y);for(const s of [-1,1])plano.paredes.push({r:R(a.x+s*h-t/2,ya-(i>0&&i<n?t/2:0),t,yb-ya+(i>0&&i<n?t:0)),tex,esp:t});}}
}
/** segmento de parede com vãos de porta → pedaços de parede + portas */
function paredeComVaos(s,tex,plano,tipoPorta){
 const t=plano.espOverride||s.thickness||.4,hor=Math.abs(s.a.y-s.b.y)<1e-6,ver=Math.abs(s.a.x-s.b.x)<1e-6;if(!hor&&!ver)return;
 const len=hor?Math.abs(s.b.x-s.a.x):Math.abs(s.b.y-s.a.y);if(len<.05)return;
 const dir=hor?(s.b.x>=s.a.x?1:-1):(s.b.y>=s.a.y?1:-1),gaps=[...(s.gaps||[])].sort((p,q)=>p.offset-q.offset);
 const ponto=d=>hor?{x:s.a.x+dir*d,y:s.a.y}:{x:s.a.x,y:s.a.y+dir*d};
 const peca=(d0,d1)=>{if(d1-d0<.05)return;const p0=ponto(d0),p1=ponto(d1),e0=d0<=.001?t/2:0,e1=d1>=len-.001?t/2:0;
  if(hor){const xa=Math.min(p0.x,p1.x),xb=Math.max(p0.x,p1.x),a0=dir>0?e0:e1,a1=dir>0?e1:e0;plano.paredes.push({r:R(xa-a0,s.a.y-t/2,xb-xa+a0+a1,t),tex,esp:t});}
  else{const ya=Math.min(p0.y,p1.y),yb=Math.max(p0.y,p1.y),a0=dir>0?e0:e1,a1=dir>0?e1:e0;plano.paredes.push({r:R(s.a.x-t/2,ya-a0,t,yb-ya+a0+a1),tex,esp:t});}};
 let cur=0;
 for(const g of gaps){const i0=Math.max(0,g.offset-g.width/2),i1=Math.min(len,g.offset+g.width/2);peca(cur,i0);
  const c=ponto((i0+i1)/2);plano.vaos.push({tipo:'porta',tipoPorta:tipoPorta?.(g.doorId)||'',r:hor?R(c.x-(i1-i0)/2,s.a.y-t/2,i1-i0,t):R(s.a.x-t/2,c.y-(i1-i0)/2,t,i1-i0)});cur=i1;}
 peca(cur,len);
}
/** junta linhas de quadrados iguais vizinhos numa lista só (reduz a contagem de objetos) */
function juntaPisos(lista){
 const por=new Map();for(const p of lista){const k=p.tex+'|'+p.r.x+'|'+p.r.w;if(!por.has(k))por.set(k,[]);por.get(k).push(p);}
 const out=[];for(const arr of por.values()){arr.sort((a,b)=>a.r.y-b.r.y);let cur=null;for(const p of arr){if(cur&&Math.abs(cur.r.y+cur.r.h-p.r.y)<.02){cur.r.h=r2(cur.r.h+p.r.h);}else{if(cur)out.push(cur);cur={...p,r:{...p.r}};}}if(cur)out.push(cur);}
 return out;
}

// ---------------------------------------------------------------- plano
function novoPlano(op,W,H,estilo){return {tipo:op.tipo,estilo,seed:op.seed,espOverride:espDe(op),W:Math.ceil(W),H:Math.ceil(H),chao:'',pisos:[],paredes:[],vaos:[],telhados:[],objetos:[],copas:[],luzes:[],textos:[],avisos:[],stats:{}};}
const marcar=(plano,objeto,onde)=>{plano[onde].push(objeto);};
function adereco(o,plano,ctx){
 const m=ADERECO[o.type];
 if(ctx.copas&&(o.type==='broadleaf'||o.type==='pine'||o.type==='bush')){plano.copas.push({id:ctx.copas[o.type],x:r2(o.pos.x),y:r2(o.pos.y),rot:Math.floor(HASH(o.pos.x,o.pos.y)*360),tam:o.type==='bush'?null:null,tipo:o.type});return;}
 if(!m)return;
 if(m.escada){const f=o.footprint;plano.pisos.push({r:R(f.x,f.y,f.w,f.h),tex:ctx.piso||'madeira',escada:true});return;}
 if(m.luz)plano.luzes.push({x:r2(o.pos.x),y:r2(o.pos.y),raio:m.luz[0],cor:m.luz[1]});
 if(m.kw)plano.objetos.push({kw:m.kw,x:r2(o.pos.x),y:r2(o.pos.y),rot:(o.rot||0)*90,tipo:o.type,w:r2(o.footprint?.w||1),h:r2(o.footprint?.h||1)});
}
function planoMasmorra(m,op,W,H){
 const estilo=op.estilo,t=E[estilo]||E.medieval,seed=op.seed;
 const doc=m.generateDungeon({seed,width:W,height:H,complexity:op.complexidade,density:op.densidade,conservation:op.conservacao,lighting:.6,styleId:estilo});
 try{m.mobiliarSalas(doc,seed);}catch(_){}
 const gd=m.exportGameData(doc),plano=novoPlano(op,gd.bounds.w,gd.bounds.h,estilo);
 const ferr=op.conservacao==='abandonado'||op.conservacao==='arruinado';
 const parede=ferr&&t.parede==='metal'?'metal_ferrugem':t.parede,esp=plano.espOverride||gd.wallThickness||ESP_PADRAO;
 plano.chao=estilo==='futurista'||estilo==='retrofuturista'?'metal_ferrugem':'rocha';
 const tipoPorta=id=>(gd.layers.doors.find(d=>d.id===id)||{}).type||'';
 for(const f of gd.layers.floor){
  if(f.shape.type==='rect'){const r=f.shape.rect;plano.pisos.push({r:R(r.x,r.y,r.w,r.h),tex:t.piso[f.kind]||t.piso.hall,sala:f.id});if(f.label&&f.kind!=='corridor')plano.textos.push({x:r2(r.x+r.w/2),y:r2(r.y+r.h/2),t:f.label});}
  else{for(const r of rectsDeFaixa(f.shape.path,f.shape.width,f.shape.polygon))plano.pisos.push({r,tex:t.piso.corridor});paredesDeFaixa(f.shape.path,f.shape.width,esp,parede,plano);}
 }
 for(const s of gd.layers.walls)paredeComVaos(s,parede,plano,tipoPorta);
 for(const o of gd.layers.objects)adereco(o,plano,{piso:t.piso.hall});
 for(const k of gd.layers.markers)if(k.type==='spawn')plano.textos.push({x:r2(k.pos.x),y:r2(k.pos.y),t:'⭐ Entrada'});
 plano.pisos=juntaPisos(plano.pisos);
 plano.nota=`${doc.rooms.length} salas e corredores, ${gd.layers.doors.length} portas`;
 return plano;
}
function planoCidade(m,op,W,H){
 const estilo=op.estilo,t=E[estilo]||E.medieval,seed=op.seed;
 const doc=m.generateCity({seed,width:W,height:H,styleId:estilo,density:op.densidade,conservation:op.conservacao,lighting:.6});
 const gd=m.exportCityGameData(doc),plano=novoPlano(op,gd.bounds.w,gd.bounds.h,estilo);
 plano.chao=t.chao;
 for(const f of gd.layers.floor){
  const tex=f.kind==='plaza'?t.praca:f.kind==='park'?t.parque:t.rua;
  if(f.shape.type==='rect'){const r=f.shape.rect;plano.pisos.push({r:R(r.x,r.y,r.w,r.h),tex});}
  else for(const r of rectsDeFaixa(f.shape.path,f.shape.width,f.shape.polygon))plano.pisos.push({r,tex});
 }
 const pred=new Map(gd.layers.objects.filter(o=>o.category==='building').map(o=>[o.id,o]));
 const ferr=op.conservacao==='abandonado'||op.conservacao==='arruinado',parede=ferr&&t.parede==='metal'?'metal_ferrugem':t.parede;
 for(const s of gd.layers.walls)paredeComVaos(s,parede,plano);
 for(const b of doc.buildings||[]){const o=pred.get(b.id),r=b.rect;
  plano.pisos.push({r:R(r.x,r.y,r.w,r.h),tex:t.interior});
  plano.telhados.push({r:R(r.x,r.y,r.w,r.h),tex:t.telhado[Math.floor(HASH(b.id.length,(b.variant||0)%977)*t.telhado.length)%t.telhado.length]});
  if(b.name&&b.usage&&!/resid/i.test(b.usage))plano.textos.push({x:r2(r.x+r.w/2),y:r2(r.y+r.h/2),t:b.name});}
 for(const o of gd.layers.objects)if(o.category!=='building')adereco(o,plano,{copas:{broadleaf:'copa_oasis',pine:'copa_conifera',bush:'copa_moitas'},piso:t.interior});
 // árvores da cidade: o motor chama de "tree"
 for(const o of gd.layers.objects)if(o.type==='tree')plano.copas.push({id:estilo==='hiboriano'?'copa_palmeiral':'copa_oasis',x:r2(o.pos.x),y:r2(o.pos.y),rot:Math.floor(HASH(o.pos.x,o.pos.y)*360),tipo:'tree'});
 for(const k of gd.layers.markers)if(k.type==='spawn')plano.textos.push({x:r2(k.pos.x),y:r2(k.pos.y),t:'⭐ Praça'});
 plano.pisos=juntaPisos(plano.pisos);
 plano.nota=`${(doc.buildings||[]).length} prédios, ${gd.layers.floor.filter(f=>f.kind==='street').length} ruas`;
 return plano;
}
/** caverna natural (autômato celular): rocha em blocos de 1 m, chão de cascalho, poças, tochas e entradas; sem o motor do MapForge */
function planoCaverna(op,W,H){
 const estilo=op.estilo||'medieval',seed=op.seed,plano=novoPlano(op,W,H,estilo);
 const dens=Math.max(.1,Math.min(1,Number(op.densidade)||.5)),comp=Math.max(.1,Math.min(1,Number(op.complexidade)||.6));
 const c=cavernaNatural(Math.ceil(W),Math.ceil(H),{rocha:.36+dens*.24,passos:2+Math.round(comp*4),seed});
 const ent=abrirEntradas(c.grade,c.w,c.h,2,seed),rocha=celulasDe(c.grade,c.w,1),vazio=celulasDe(c.grade,c.w,0);
 plano.chao='rocha';
 const piso=estilo==='hiboriano'?'areia_escura':estilo==='futurista'||estilo==='retrofuturista'?'rocha_vulcanica':'cascalho';
 for(const r of retangulosDeCelulas(vazio))plano.pisos.push({r:R(r.x,r.y,r.w,r.h),tex:piso});
 plano.macicos=[{tex:'rocha',piso,rocha:retangulosDeCelulas(rocha).map(r=>R(r.x,r.y,r.w,r.h)),tudo:retangulosDeCelulas(new Set([...rocha,...vazio])).map(r=>R(r.x,r.y,r.w,r.h))}];
 // poças: até 3 retângulos de água rasa 3×2 onde tudo em volta é chão
 const rnd=mulberry32((seed|0)+17),livres=[...vazio].map(k=>k.split(',').map(Number)).filter(([x,y])=>[0,1,2].every(i=>[0,1].every(j=>vazio.has((x+i)+','+(y+j))))),poças=[];
 for(let i=0;i<3&&livres.length;i++){const k=livres.splice(Math.floor(rnd()*livres.length),1)[0];if(poças.every(p=>Math.hypot(p[0]-k[0],p[1]-k[1])>8)){poças.push(k);plano.pisos.push({r:R(k[0],k[1],3,2),tex:'agua_rasa',poca:'agua_rasa'});}}
 // tochas: uma luz a cada ~90 quadrados abertos, espalhadas
 const abertos=[...vazio].map(k=>k.split(',').map(Number)),n=Math.max(2,Math.round(abertos.length/90));
 for(let i=0;i<n&&abertos.length;i++){const k=abertos.splice(Math.floor(rnd()*abertos.length),1)[0];plano.luzes.push({x:r2(k[0]+.5),y:r2(k[1]+.5),raio:5,cor:'#ffb060'});}
 for(const e of ent)plano.textos.push({x:r2(e.x+.5),y:r2(e.y+.5),t:'⭐ Entrada'});
 plano.pisos=juntaPisos(plano.pisos);
 plano.nota=Math.round(c.fracaoAberta*100)+'% aberta, '+ent.length+' entrada(s), '+poças.length+' poça(s)';
 return plano;
}
function planoExterior(m,op,W,H){
 const estilo=op.estilo,t=E[estilo]||E.medieval,seed=op.seed,bioma=op.bioma||'floresta';
 const doc=m.generateWild({seed,width:W,height:H,styleId:estilo,biome:bioma,density:op.densidade,conservation:op.conservacao,lighting:.6});
 const gd=m.exportWildGameData(doc),plano=novoPlano(op,gd.bounds.w,gd.bounds.h,estilo);
 plano.chao=BASE_BIOMA[bioma]||'grama_curta';
 // terreno em grade (4 m): só o que difere do chão-base vira piso
 const g=doc.grid,pisos=[];
 if(g&&g.data)for(let j=0;j<g.rows;j++){let ini=null,tipo=null;
  for(let i=0;i<=g.cols;i++){const k=i<g.cols?g.data[j*g.cols+i]:null,tex=k?TERRENO[k]:null;
   if(ini!==null&&(tex!==tipo||i===g.cols)){if(tipo)pisos.push({r:R(ini*g.cell,j*g.cell,(i-ini)*g.cell,g.cell),tex:tipo});ini=null;}
   if(ini===null&&tex){ini=i;tipo=tex;}}}
 plano.pisos.push(...pisos);
 for(const w of doc.waters||[])for(const r of rasterizar(w.polygon))plano.pisos.push({r,tex:'agua_rasa'});
 for(const f of gd.layers.floor)if(f.kind==='trail'&&f.shape.type==='capsule')for(const r of rectsDeFaixa(f.shape.path,f.shape.width,f.shape.polygon))plano.pisos.push({r,tex:bioma==='mina'?'cascalho':'terra_batida'});
 for(const s of gd.layers.walls){const a=s.a,b=s.b,tt=s.thickness||2;
  if(Math.abs(a.x-b.x)<1e-6)plano.paredes.push({r:R(a.x-tt/2,Math.min(a.y,b.y),tt,Math.abs(b.y-a.y)||.5),tex:'rocha',esp:tt,caverna:true});
  else if(Math.abs(a.y-b.y)<1e-6)plano.paredes.push({r:R(Math.min(a.x,b.x),a.y-tt/2,Math.abs(b.x-a.x)||.5,tt),tex:'rocha',esp:tt,caverna:true});
  else{/* escarpa na diagonal: faixa de rocha em blocos de 1 m */const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L*tt/2,ny=dx/L*tt/2;for(const r of rasterizar([{x:a.x+nx,y:a.y+ny},{x:b.x+nx,y:b.y+ny},{x:b.x-nx,y:b.y-ny},{x:a.x-nx,y:a.y-ny}]))plano.paredes.push({r,tex:'rocha',esp:1,caverna:true});}}
 const cb=COPA_BIOMA[bioma]||COPA_BIOMA.floresta;
 for(const o of gd.layers.objects)adereco(o,plano,{copas:cb,piso:'madeira'});
 for(const k of gd.layers.markers){if(k.type==='poi'&&k.label)plano.textos.push({x:r2(k.pos.x),y:r2(k.pos.y),t:'◆ '+k.label});else if(k.type==='spawn')plano.textos.push({x:r2(k.pos.x),y:r2(k.pos.y),t:'⭐ Entrada'});}
 plano.pisos=juntaPisos(plano.pisos);
 plano.nota=`${(doc.trails||[]).length} trilhas, ${(doc.cliffs||[]).length} escarpas, ${plano.copas.length} árvores e arbustos`;
 return plano;
}
/** nada fica fora do mapa: recorta os retângulos e descarta pontos de fora */
/** retângulo a menos retângulo d → pedaços que sobram (descarta lascas < 12 cm) */
export function menosRetangulo(a,d){
 const x0=Math.max(a.x,d.x),y0=Math.max(a.y,d.y),x1=Math.min(a.x+a.w,d.x+d.w),y1=Math.min(a.y+a.h,d.y+d.h);
 if(x1-x0<=.001||y1-y0<=.001)return [a];
 const out=[];
 if(x0-a.x>.12)out.push({x:a.x,y:a.y,w:x0-a.x,h:a.h});
 if(a.x+a.w-x1>.12)out.push({x:x1,y:a.y,w:a.x+a.w-x1,h:a.h});
 if(y0-a.y>.12)out.push({x:x0,y:a.y,w:x1-x0,h:y0-a.y});
 if(a.y+a.h-y1>.12)out.push({x:x0,y:y1,w:x1-x0,h:a.y+a.h-y1});
 return out;
}
/** Abre os vãos: nenhuma parede (nem a do corredor, nem outra sala) pode cruzar o vão de uma porta — senão a porta não leva a lugar nenhum
 *  e a sala fica trancada mesmo com a porta aberta. Corta de todas as paredes o espaço de cada porta. */
export function abrirVaos(plano){
 if(!plano?.vaos?.length)return plano;
 let paredes=plano.paredes;
 for(const v of plano.vaos){
  const r=v.r,fino=r.w<r.h; // vão em pé (parede vertical) ou deitado
  const d=fino?{x:r.x-.25,y:r.y,w:r.w+.5,h:r.h}:{x:r.x,y:r.y-.25,w:r.w,h:r.h+.5};
  const novas=[];for(const p of paredes){for(const q of menosRetangulo(p.r,d))novas.push(q===p.r?p:{...p,r:R(q.x,q.y,q.w,q.h)});}
  paredes=novas;
 }
 plano.paredes=paredes;return plano;
}
export function recortarAoMapa(plano){
 const W=plano.W,H=plano.H,cl=l=>l.filter(p=>{const x0=Math.max(0,p.r.x),y0=Math.max(0,p.r.y),x1=Math.min(W,p.r.x+p.r.w),y1=Math.min(H,p.r.y+p.r.h);if(x1-x0<.05||y1-y0<.05)return false;p.r=R(x0,y0,x1-x0,y1-y0);return true;}),pt=l=>l.filter(p=>p.x>=0&&p.y>=0&&p.x<=W&&p.y<=H);
 plano.pisos=cl(plano.pisos);plano.paredes=cl(plano.paredes);plano.vaos=cl(plano.vaos);plano.telhados=cl(plano.telhados);
 plano.objetos=pt(plano.objetos);plano.copas=pt(plano.copas);plano.luzes=pt(plano.luzes);plano.textos=pt(plano.textos);
 return plano;
}
/** reduz adereços (árvores, luzes, objetos soltos) até o plano caber no orçamento de objetos da cena; a geometria nunca é cortada */
export function ajustarOrcamento(plano,max=MAX_OBJETOS){
 const fixo=plano.pisos.length+plano.paredes.length+(plano.macicos||[]).reduce((n,m)=>n+m.rocha.length,0)+plano.vaos.length+plano.telhados.length+plano.textos.length,vari=plano.copas.length+plano.luzes.length+plano.objetos.length;
 plano.stats={fixo,adereços:vari,total:fixo+vari,cortados:0};
 if(fixo+vari<=max)return plano;
 const sobra=Math.max(0,max-fixo),f=vari?sobra/vari:0,fino=l=>{const alvo=Math.floor(l.length*f);if(alvo>=l.length)return l;if(alvo<=0)return [];const passo=l.length/alvo,out=[];for(let i=0;i<alvo;i++)out.push(l[Math.floor(i*passo)]);return out;};
 const antes=vari;plano.copas=fino(plano.copas);plano.luzes=fino(plano.luzes);plano.objetos=fino(plano.objetos);
 const depois=plano.copas.length+plano.luzes.length+plano.objetos.length;plano.stats.cortados=antes-depois;plano.stats.total=fixo+depois;
 plano.avisos.push(fixo>max?`Mapa grande demais para o limite do mapa (${fixo} peças só de estrutura): escolha um tamanho menor.`:`Para caber no mapa, usei ${Math.round(f*100)}% dos adereços (árvores, luzes e objetos).`);
 return plano;
}
export async function gerarPlano(op){
 const m=await import('./mesa-mapforge-motor.js?v=199');
 const tipo=op.tipo||'masmorra',[pw,ph]=TAMANHO_PADRAO[tipo]||[48,32];
 const W=Math.max(16,Math.min(120,Math.round(Number(op.w)||pw))),H=Math.max(16,Math.min(120,Math.round(Number(op.h)||ph)));
 const bruto=Number(op.seed),seed=Number.isFinite(bruto)&&String(op.seed||'').trim()!==''&&bruto>=0?Math.floor(bruto)%2147483647:Math.floor(Math.random()*2147483647);
 const o={...op,tipo,seed,estilo:op.estilo||'medieval',densidade:Number.isFinite(Number(op.densidade))?Number(op.densidade):.5,complexidade:Number.isFinite(Number(op.complexidade))?Number(op.complexidade):.6,conservacao:op.conservacao||'usado'};
 const plano=tipo==='cidade'?planoCidade(m,o,W,H):tipo==='exterior'?planoExterior(m,o,W,H):tipo==='caverna'?planoCaverna(o,W,H):planoMasmorra(m,o,W,H);
 plano.seed=seed;plano.rotulo=(TIPOS.find(x=>x[0]===tipo)||[])[1]||tipo;
 return ajustarOrcamento(recortarAoMapa(abrirVaos(plano)),op.maxObjetos||MAX_OBJETOS);
}

// ---------------------------------------------------------------- pré-visualização (canvas)
const COR={terra_batida:'#92704a',terra:'#8a6a48',rocha:'#6a6258',pedra:'#8d8f93',metal:'#7d8790',metal_ferrugem:'#8a5a3a',madeira:'#8a5a30',azulejo:'#cfd8dc',painel_scifi:'#243041',aco_escovado:'#aab2ba',chapa_xadrez:'#7d838a',
 cascalho:'#8a8478',pedregulhos:'#8a6a48',areia_clara:'#e0cc98',grama_curta:'#4f8c3e',grama_alta:'#2f6a30',grama_seca:'#b49a56',agua_rasa:'#58c4cc',marmore_vermelho:'#a03030',terra_rachada:'#b88458',telha:'#b65a3a',palha:'#c8aa50'};
export function desenharPrevia(canvas,plano){
 const ctx=canvas.getContext('2d'),W=plano.W,H=plano.H,k=Math.min(canvas.width/W,canvas.height/H);
 canvas.width=Math.ceil(W*k);canvas.height=Math.ceil(H*k);
 const rect=(r,c,a=1)=>{ctx.globalAlpha=a;ctx.fillStyle=c;ctx.fillRect(r.x*k,r.y*k,Math.max(1,r.w*k),Math.max(1,r.h*k));ctx.globalAlpha=1;};
 rect({x:0,y:0,w:W,h:H},COR[plano.chao]||'#554');
 for(const p of plano.pisos)rect(p.r,COR[p.tex]||'#887766');
 for(const p of plano.telhados)rect(p.r,COR[p.tex]||'#b65a3a',.55);
 for(const p of plano.paredes)rect(p.r,plano.estilo==='futurista'?'#10161e':'#241f1a');
 for(const m of plano.macicos||[])for(const r of m.rocha)rect(r,'#241f1a');
 for(const p of plano.vaos)rect(p.r,'#e0a83a');
 for(const c of plano.copas){ctx.globalAlpha=.7;ctx.fillStyle='#2f7a34';ctx.beginPath();ctx.arc(c.x*k,c.y*k,Math.max(1.5,(c.tipo==='bush'?1:2.4)*k),0,6.3);ctx.fill();ctx.globalAlpha=1;}
 for(const o of plano.objetos)rect({x:o.x-.5,y:o.y-.5,w:1,h:1},'#c8a070');
 for(const l of plano.luzes){ctx.fillStyle='#ffd27a';ctx.fillRect(l.x*k-1,l.y*k-1,2,2);}
}
