// Mesa Estelar v197 — 🎨 Editor rápido: construir o mapa como no "RPG Map" do Deepnight (simples e limpo).
//
// Uma paleta só, na lateral do mapa, e tudo se faz com o mouse, em quadrados de 1 m:
//  🧱 Paredes: PAREDE (linha fina de espessura fixa, só reta; arraste e solte) · ⟋ diagonal (45°) · 🚧 cerca baixa · 🪨 caverna (blocos de 1 m)
//     🏠 cômodo (4 paredes finas + piso) · ⬜ tirar área · ▫️ tirar blocos
//  🧽 Geral: borracha · 💧 conta-gotas · ✋ Alt+clique pega/move · Ctrl+Alt+clique duplica · botão DIREITO: pincel de rocha (blocos)
//  🚪 Objetos: porta e janela (clique na parede: vão de 1 m com a espessura dela), móveis do banco (busca e categorias), 💡 luz, 🔤 texto
//  📋 Modelos prontos (sci-fi, taverna, casa…) · 🌊 Poças · 🟫 Pisos · 🔍 zoom · 🆕 mapa novo do zero
// Tudo vai para o RASCUNHO do mapa (nada é gravado até clicar em 💾 Salvar mapa); ↶ desfazer / ↷ refazer por gesto.
// As peças são objetos comuns da mesa (colidem, bloqueiam visão, abrem portas); NPCs e criaturas na aba do mestre já respeitam o rascunho.

import {TEXTURAS_BASE,objParede,objChao,objTeto,objEscada,objPorta,objJanela,objDoBanco,retDoObjeto,objBloqueio} from './mesa-oficina3.js?v=180';
import {categoriaDeObjeto,blocosLinha} from './mesa-construcao.js?v=180';
import {cenaDoEstado,LIMITE_CENA} from './mesa-mapas-ui.js?v=141';
import {ehChao} from './mesa-chao.js?v=200';
import {RELEVO} from './mesa-relevo-dados.js?v=201';
import {ESTILOS_PINCEL,objetoPincel} from './mesa-pinceis.js?v=203';
import {contornoOrganico,cordilheira,cavernaNatural,abrirEntradas,celulasDe,retangulosDeCelulas,LIMITE_ESCARPADA,lacosSuaves,caminhoDeLacos,caixaDeLacos,picosDe} from './mesa-terreno-natural.js?v=201';
const R2=(x,y,w,h)=>({x:Math.round(x*100)/100,y:Math.round(y*100)/100,w:Math.round(w*100)/100,h:Math.round(h*100)/100});
import {ESTILOS,BIOMAS,TIPOS,TAMANHO_PADRAO,ESP_OPCOES,gerarPlano,recortarAoMapa,desenharPrevia as desenharPreviaPlano} from './mesa-mapforge-plano.js?v=199';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const CELULA=1; // metros por quadrado
const EPS=2e-3; // 2 mm: os objetos guardam x,y com 4 casas (28×14), então sobras menores que isso são ruído de arredondamento

// ------------------------------------------------------------ geometria (metros) — pura, testável
export const retInter=(a,b)=>{const x0=Math.max(a.x,b.x),y0=Math.max(a.y,b.y),x1=Math.min(a.x+a.w,b.x+b.w),y1=Math.min(a.y+a.h,b.y+b.h);return x1-x0>EPS&&y1-y0>EPS?{x:x0,y:y0,w:x1-x0,h:y1-y0}:null;};
// o que sobra de r depois de tirar c (até 4 retângulos, sem sobrepor)
export function subtrai(r,c){
 const i=retInter(r,c);if(!i)return [r];const out=[];
 if(i.y-r.y>EPS)out.push({x:r.x,y:r.y,w:r.w,h:i.y-r.y});
 if(r.y+r.h-(i.y+i.h)>EPS)out.push({x:r.x,y:i.y+i.h,w:r.w,h:r.y+r.h-(i.y+i.h)});
 if(i.x-r.x>EPS)out.push({x:r.x,y:i.y,w:i.x-r.x,h:i.h});
 if(r.x+r.w-(i.x+i.w)>EPS)out.push({x:i.x+i.w,y:i.y,w:r.x+r.w-(i.x+i.w),h:i.h});
 return out;
}
// retângulo em quadrados inteiros entre dois pontos (inclui os dois quadrados das pontas), limitado ao mapa
export function retDeQuadrados(a,b,W,H,cel=CELULA){
 const x0=Math.floor(Math.min(a.x,b.x)/cel),y0=Math.floor(Math.min(a.y,b.y)/cel),x1=Math.floor(Math.max(a.x,b.x)/cel),y1=Math.floor(Math.max(a.y,b.y)/cel);
 const X0=Math.max(0,x0),Y0=Math.max(0,y0),X1=Math.min(Math.ceil(W/cel)-1,x1),Y1=Math.min(Math.ceil(H/cel)-1,y1);
 if(X1<X0||Y1<Y0)return null;return {x:X0*cel,y:Y0*cel,w:(X1-X0+1)*cel,h:(Y1-Y0+1)*cel};
}
// contorno de um cômodo: 4 faixas de espessura e (menos que isso, vira bloco cheio)
export function contornoDe(r,e=CELULA){
 if(r.w<=2*e+EPS||r.h<=2*e+EPS)return {paredes:[r],piso:null};
 return {paredes:[{x:r.x,y:r.y,w:r.w,h:e},{x:r.x,y:r.y+r.h-e,w:r.w,h:e},{x:r.x,y:r.y+e,w:e,h:r.h-2*e},{x:r.x+r.w-e,y:r.y+e,w:e,h:r.h-2*e}],piso:{x:r.x+e,y:r.y+e,w:r.w-2*e,h:r.h-2*e}};
}
// paredes de verdade são FINAS: uma linha com espessura fixa (não um bloco de 1 m)
export const ESPESSURAS=[['Fina',.2],['Média',.3],['Grossa',.5],['Muralha',1],['Fortaleza',2]]; // + campo "Outra espessura" (0,1 a 6 m) no painel
const rd=v=>Math.round(v);
// pontos da linha em cruzamentos da grade; só horizontal ou vertical (a de maior alcance)
export function pontosDeLinha(a,b,W=1e9,H=1e9){
 const ax=Math.max(0,Math.min(W,rd(a.x))),ay=Math.max(0,Math.min(H,rd(a.y)));let bx=Math.max(0,Math.min(W,rd(b.x))),by=Math.max(0,Math.min(H,rd(b.y)));
 if(Math.abs(bx-ax)>=Math.abs(by-ay))by=ay;else bx=ax;return {a:{x:ax,y:ay},b:{x:bx,y:by}};
}
// retângulo (metros) de uma parede reta: a linha engrossada pela espessura, estendida meia espessura nas pontas (cantos fecham sem fresta)
export function retDeLinha(a,b,e,W,H){
 const {a:p,b:q}=pontosDeLinha(a,b,W,H);if(p.x===q.x&&p.y===q.y)return null;
 const x0=Math.min(p.x,q.x),x1=Math.max(p.x,q.x),y0=Math.min(p.y,q.y),y1=Math.max(p.y,q.y);
 return p.y===q.y?{x:x0-e/2,y:p.y-e/2,w:(x1-x0)+e,h:e}:{x:p.x-e/2,y:y0-e/2,w:e,h:(y1-y0)+e};
}
// pontos de uma diagonal a 45° (tamanho = o menor dos dois lados)
export function pontosDiagonal(a,b,W=1e9,H=1e9){
 const ax=rd(a.x),ay=rd(a.y);let dx=rd(b.x)-ax,dy=rd(b.y)-ay;const d=Math.min(Math.abs(dx),Math.abs(dy));if(!d)return null;
 dx=Math.sign(dx)*d;dy=Math.sign(dy)*d;const qx=ax+dx,qy=ay+dy;if(ax<0||ay<0||qx<0||qy<0||ax>W||qx>W||ay>H||qy>H)return null;return {a:{x:ax,y:ay},b:{x:qx,y:qy}};
}
// cômodo de verdade: 4 paredes finas sobre o contorno do retângulo + o piso dentro dele
export function contornoFino(r,e){
 return {paredes:[{x:r.x-e/2,y:r.y-e/2,w:r.w+e,h:e},{x:r.x-e/2,y:r.y+r.h-e/2,w:r.w+e,h:e},{x:r.x-e/2,y:r.y+e/2,w:e,h:r.h-e},{x:r.x+r.w-e/2,y:r.y+e/2,w:e,h:r.h-e}],piso:{x:r.x,y:r.y,w:r.w,h:r.h}};
}
// o segmento passa por dentro do retângulo r? (amostra a cada 25 cm)
export function segmentoToca(a,b,r){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.25));for(let i=0;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)return true;}return false;}
// distância de um ponto a um retângulo
export const distRet=(p,r)=>Math.hypot(Math.max(r.x-p.x,0,p.x-(r.x+r.w)),Math.max(r.y-p.y,0,p.y-(r.y+r.h)));
// quadrados soltos (pincel livre) viram poucos retângulos: junta os vizinhos na horizontal
export function juntaQuadrados(cels,cel=CELULA){
 const por=new Map();for(const c of cels){const k=c.y;if(!por.has(k))por.set(k,new Set());por.get(k).add(c.x);}
 const out=[];for(const [y,xs] of por){const l=[...xs].sort((a,b)=>a-b);let ini=l[0],fim=l[0];for(const x of l.slice(1)){if(x===fim+1)fim=x;else{out.push({x:ini*cel,y:y*cel,w:(fim-ini+1)*cel,h:cel});ini=fim=x;}}out.push({x:ini*cel,y:y*cel,w:(fim-ini+1)*cel,h:cel});}
 return out;
}
// diferença entre duas listas de objetos → edições do rascunho
export function diferencas(antes,depois){
 const A=new Map(antes.map(x=>[String(x.id),x])),B=new Map(depois.map(x=>[String(x.id),x])),ed=[];
 for(const [id,x] of B){const a=A.get(id);if(!a)ed.push({kind:'add',object:x});else if(JSON.stringify(a)!==JSON.stringify(x)){const p={};for(const k of new Set([...Object.keys(a),...Object.keys(x)]))if(JSON.stringify(a[k])!==JSON.stringify(x[k]))p[k]=x[k];ed.push({kind:'properties',id:x.id,properties:p});}}
 for(const [id,a] of A)if(!B.has(id))ed.push({kind:'remove',id:a.id});
 return ed;
}
const N=(r,W,H)=>({x:+((r.x+r.w/2)*28/W).toFixed(4),y:+((r.y+r.h/2)*14/H).toFixed(4),larguraM:+r.w.toFixed(3),alturaM:+r.h.toFixed(3)});
let seqId=0;const novoId=t=>'er_'+t+'_'+Date.now().toString(36)+(seqId++).toString(36);

// ------------------------------------------------------------ catálogo da paleta
export const CORES_LUZ=['#ffd27a','#ffffff','#7ad7ff','#ff7a5a','#7aff9a','#c77aff','#ff7ac8'];
/* copas: árvores inteiras (uma imagem por árvore), tamanho em metros [mín, máx] */
const CP='arte/copas/';
/* v203: toda copa é uma árvore de verdade: tem vida (PV), dureza, é de madeira e inflamável (pega fogo e é derrubada a golpes; o lenhador a corta) */
/* v203: cada copa tem um TRONCO (peça sólida, menor que a copa): barra o passo e a visão, tem vida, queima e é cortado; quem anda por baixo da copa passa pelo resto. A copa e o tronco formam um grupo (grupoArvoreV203): derrubado o tronco, a copa some. */
export function troncoDaCopa(id,cx,cy,tam,rot,W,H,grupo){
 if(/moita|arbust/.test(String(id)))return null;
 const palma=/palm|tropical/.test(String(id)),chave=palma?'tr_tronco_palmeira':(tam<4.3?'tr_tronco_fino':'tr_tronco_folhosa'),lado=({tr_tronco_palmeira:.76,tr_tronco_fino:.91,tr_tronco_folhosa:1.26})[chave]*(palma?1:Math.max(.85,Math.min(1.25,tam/5)));
 return {id:'tronco_'+Math.random().toString(36).slice(2,9),nome:palma?'Tronco de palmeira':'Tronco',modeloId:chave,objetoBancoId:chave,imagem:'arte/pecasbl/'+chave+'.webp',x:+(cx*28/W).toFixed(4),y:+(cy*14/H).toFixed(4),larguraM:+lado.toFixed(3),alturaM:+lado.toFixed(3),angulo:rot||0,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true,pvMax:60,pvAtual:60,dureza:4,destrutivel:true,material:'Madeira',inflamavel:true,inflamabilidade:3,oficina3:'objeto',erTipo:'tronco',grupoArvoreV203:grupo};
}
export const copaViva=id=>/moita|arbust/.test(String(id))?{destrutivel:true,pvMax:12,pvAtual:12,dureza:1,material:'Vegetal',inflamavel:true,inflamabilidade:4}:{destrutivel:true,pvMax:60,pvAtual:60,dureza:4,material:'Madeira',inflamavel:true,inflamabilidade:3};
const COPAS=[
 {id:'copa_oasis',nome:'Árvore de oásis',src:[CP+'arvore_oasis.webp'],m:[4.2,6]},{id:'copa_densa',nome:'Árvore densa',src:[CP+'arvore_densa.webp'],m:[4.6,6.4]},
 {id:'copa_outono',nome:'Árvore de outono',src:[CP+'arvore_outono.webp'],m:[4.2,6]},{id:'copa_sombria',nome:'Árvore sombria',src:[CP+'arvore_sombria.webp'],m:[4.4,6]},
 {id:'copa_nevada',nome:'Árvore nevada',src:[CP+'arvore_nevada.webp'],m:[4.2,6]},{id:'copa_tropical',nome:'Árvore tropical',src:[CP+'arvore_tropical.webp',CP+'palmeira_tropical.webp'],m:[4.2,6]},
 {id:'copa_palmeiral',nome:'Palmeiras',src:[CP+'palmeira.webp'],m:[4,5.6]},{id:'copa_conifera',nome:'Coníferas',src:[CP+'conifera_1.webp',CP+'conifera_2.webp',CP+'conifera_3.webp'],m:[3.2,5]},
 {id:'copa_conifera_neve',nome:'Coníferas nevadas',src:[CP+'conifera_neve_1.webp',CP+'conifera_neve_2.webp',CP+'conifera_neve_3.webp'],m:[3.2,5]},
 {id:'copa_moitas',nome:'Arbustos',src:[CP+'arbusto.webp'],m:[1.5,2.3]},{id:'copa_arbustal',nome:'Arbustos do deserto',src:[CP+'arbusto_deserto.webp'],m:[1.6,2.4]}];
export const POCAS=[{id:'agua',nome:'Água',tex:'agua',cor:'#4a86b8'},{id:'agua_rasa',nome:'Água rasa',tex:'agua_rasa',cor:'#58c4cc'},{id:'agua_profunda',nome:'Água funda',tex:'agua_profunda',cor:'#164e96'},{id:'agua_pantano',nome:'Pântano',tex:'agua_pantano',cor:'#58702e'},{id:'agua_suja',nome:'Água turva',tex:'agua_suja',cor:'#8a6c3e'},{id:'lava',nome:'Lava',tex:'lava',cor:'#d4541c',brilho:true},{id:'lava_fluida',nome:'Lava fluida',tex:'lava_fluida',cor:'#e86a14',brilho:true},{id:'lodo',nome:'Lodo',tex:'lama',cor:'#6a4a2c'}];
// modelos prontos (coordenadas em quadrados a partir do canto de cima à esquerda; porta/janela = quadrado da parede)
export const MODELOS=[
 // paredes finas sobre as linhas da grade; porta/janela: [x,y] é o ponto NA parede (y na linha da parede horizontal; {v:1} = parede vertical, x na linha)
 {id:'scifi_sala',ic:'🚀',nome:'Sala sci-fi',w:10,h:8,ops:[['comodo',[0,0,10,8],{par:'metal',piso:'azulejo'}],['piso',[1,1,3,2],{piso:'metal'}],['porta',[4,8]],['porta',[10,4],{v:1}],['janela',[2,0]],['janela',[7,0]],['obj','terminal|computador|console|painel',[2,1.5]],['obj','mesa',[6,4]],['obj','cadeira',[6,5.2]],['obj','caixa|barril',[8.5,1.5]]]},
 {id:'scifi_base',ic:'🛸',nome:'Base sci-fi (3 salas e corredor)',w:24,h:12,ops:[['comodo',[0,0,24,12],{par:'metal',piso:'metal'}],['piso',[1,1,6,10],{piso:'azulejo'}],['piso',[17,1,6,10],{piso:'azulejo'}],['parede',[7,0,7,12],{par:'metal'}],['parede',[16,0,16,12],{par:'metal'}],['porta',[7,6],{v:1}],['porta',[16,6],{v:1}],['porta',[11,12]],['janela',[3,0]],['janela',[20,0]],['janela',[12,0]],['obj','terminal|computador|console|painel',[3,2]],['obj','cama',[3,9]],['obj','mesa',[20,3]],['obj','cadeira',[20,4.3]],['obj','caixa|barril',[12,6]],['obj','caixa|barril',[13,6.2]]]},
 {id:'taverna',ic:'🍺',nome:'Taverna',w:14,h:10,ops:[['comodo',[0,0,14,10],{par:'tijolo',piso:'madeira'}],['porta',[6,10]],['porta',[14,5],{v:1}],['janela',[3,0]],['janela',[10,0]],['parede',[0,3,4,3],{par:'madeira'}],['obj','mesa',[7,3]],['obj','mesa',[10.5,6]],['obj','cadeira',[7,4.4]],['obj','cadeira',[10.5,7.4]],['obj','barril',[1.5,1.5]],['obj','barril',[2.5,1.5]]]},
 {id:'casa',ic:'🏠',nome:'Casa simples',w:8,h:6,ops:[['comodo',[0,0,8,6],{par:'tijolo',piso:'madeira'}],['porta',[3,6]],['janela',[1,0]],['janela',[6,0]],['obj','cama',[6.5,1.5]],['obj','mesa',[3,2]]]},
 {id:'praca',ic:'⛲',nome:'Praça com chafariz',w:12,h:12,ops:[['piso',[0,0,12,12],{piso:'terra'}],['piso',[2,2,8,8],{piso:'pedra'}],['poca',[5,5,2,2],{poca:'agua'}],['obj','arvore',[1,1]],['obj','arvore',[11,1]],['obj','arvore',[1,11]],['obj','arvore',[11,11]],['obj','banco|cadeira',[3,6]],['obj','banco|cadeira',[9,6]]]},
 {id:'quarteirao',ic:'🏘️',nome:'Quarteirão (ruas e 3 casas)',w:26,h:16,ops:[['piso',[0,0,26,16],{piso:'terra'}],['piso',[0,6,26,4],{piso:'pedra'}],['piso',[11,0,4,16],{piso:'pedra'}],['comodo',[1,1,8,4],{par:'tijolo',piso:'madeira'}],['porta',[5,5]],['janela',[2,1]],['comodo',[16,1,8,4],{par:'adobe',piso:'madeira'}],['porta',[20,5]],['janela',[18,1]],['comodo',[1,11,9,4],{par:'tijolo',piso:'madeira'}],['porta',[5,11]],['janela',[3,15]],['obj','arvore',[13,3]],['obj','arvore',[13,13]],['obj','barril',[10.5,7]],['obj','mesa',[4,13]],['obj','cama',[22,2.5]]]},
 {id:'salao_marmore',ic:'🏛️',nome:'Salão de mármore',w:20,h:14,ops:[['comodo',[0,0,20,14],{par:'marmore_negro',piso:'marmore_branco',esp:.5}],['piso',[8,1,4,12],{piso:'marmore_vermelho'}],['piso',[7,1,6,2],{piso:'ouro'}],['porta',[10,14]],['janela',[4,0]],['janela',[16,0]],['janela',[0,6],{v:1}],['janela',[20,6],{v:1}],['obj','estatua|coluna|vaso',[2,2]],['obj','estatua|coluna|vaso',[18,2]],['obj','estatua|coluna|vaso',[2,12]],['obj','estatua|coluna|vaso',[18,12]],['obj','mesa',[10,11]]]},
 {id:'trono',ic:'👑',nome:'Sala do trono',w:14,h:12,ops:[['comodo',[0,0,14,12],{par:'marmore_vermelho',piso:'marmore_negro',esp:.5}],['piso',[5,0,4,12],{piso:'marmore_vermelho'}],['piso',[3,1,8,3],{piso:'ouro'}],['porta',[7,12]],['janela',[2,0]],['janela',[12,0]],['obj','cadeira|trono',[7,2.5]],['obj','estatua|coluna|vaso',[1.5,6]],['obj','estatua|coluna|vaso',[12.5,6]],['obj','estatua|coluna|vaso',[1.5,10]],['obj','estatua|coluna|vaso',[12.5,10]]]},
 {id:'templo_jade',ic:'🏯',nome:'Templo de jade',w:14,h:12,ops:[['comodo',[0,0,14,12],{par:'jade',piso:'marmore_branco'}],['piso',[4,3,6,6],{piso:'jade'}],['poca',[6,5,2,2],{poca:'agua'}],['porta',[7,12]],['porta',[14,6],{v:1}],['janela',[3,0]],['janela',[11,0]],['obj','estatua|vaso|arvore',[2,2]],['obj','estatua|vaso|arvore',[12,2]],['obj','banco|cadeira',[7,9.5]]]},
 {id:'laboratorio',ic:'🧪',nome:'Laboratório cromado',w:16,h:10,ops:[['comodo',[0,0,16,10],{par:'cromado',piso:'azulejo'}],['parede',[10,0,10,10],{par:'cromado'}],['porta',[10,5],{v:1}],['porta',[5,10]],['janela',[3,0]],['janela',[13,0]],['piso',[11,1,4,8],{piso:'metal'}],['obj','terminal|computador|console|painel',[2,2]],['obj','mesa',[6,4]],['obj','mesa',[6,7]],['obj','terminal|computador|console|painel',[13,2]],['obj','caixa|barril',[14,8]]]},
 {id:'galpao_ferrugem',ic:'🏭',nome:'Galpão enferrujado',w:18,h:12,ops:[['comodo',[0,0,18,12],{par:'metal_ferrugem',piso:'metal_ferrugem'}],['porta',[9,12]],['porta',[18,6],{v:1}],['janela',[4,0]],['janela',[13,0]],['piso',[1,1,6,4],{piso:'metal'}],['obj','caixa|barril',[3,3]],['obj','caixa|barril',[4.5,3]],['obj','caixa|barril',[14,9]],['obj','caixa|barril',[15.2,9.3]],['obj','mesa',[10,3]]]},
 {id:'cripta',ic:'💀',nome:'Cripta',w:16,h:12,ops:[['comodo',[0,0,16,12],{par:'rocha',piso:'pedra'}],['parede',[8,0,8,12],{par:'rocha'}],['porta',[8,6],{v:1}],['porta',[3,12]],['piso',[10,2,4,4],{piso:'rocha'}],['poca',[11,8,3,2],{poca:'lodo'}],['obj','caixa|barril',[2,2]],['obj','caixa|barril',[13,9]]]}
];
export const TIPOS_LINHA=['parede','cerca'];
export const FERRAMENTAS=[
 ['Paredes',[['parede','🧱','Parede','Arraste uma linha: parede fina (escolha a espessura abaixo). Solta e fica; dá para fazer outra ao lado.'],['diagonal','⟋','Diagonal','Arraste: parede em linha diagonal (45°).'],['cerca','🚧','Cerca','Arraste uma linha: cerca/mureta baixa (barra o passo, deixa ver).'],['caverna','🪨','Caverna','Arraste um retângulo: rocha ou parede grossa em blocos de 1 m (cavernas, muralhas).'],['comodo','🏠','Cômodo','Arraste um retângulo: 4 paredes finas no contorno e o piso escolhido por dentro.'],['tirar_area','⬜','Tirar área','Arraste: tira parede, porta e janela da área.'],['tirar_bloco','▫️','Tirar blocos','Clique ou arraste: tira de quadrado em quadrado.']]],
 ['Geral',[['borracha','🧽','Borracha','Arraste: apaga tudo na área (parede, piso, poça, objetos).'],['modelo','📋','Modelos','Escolha um modelo pronto e clique no mapa para carimbar.'],['conta_gotas','💧','Conta-gotas','Clique numa peça: pega o material dela para continuar desenhando.'],['mover','✋','Mover / duplicar','Alt+clique arrasta uma peça · Ctrl+Alt+clique duplica.']]],
 ['Objetos',[['porta','🚪','Porta','Clique numa parede: abre um vão de 1 m com porta.'],['janela','🪟','Janela','Clique numa parede: janela (barra o passo, deixa ver).'],['objeto','🪑','Móveis e objetos','Escolha na lista; clique no mapa para pôr · R ou roda gira.'],['luz','💡','Luz','Clique: põe uma luz colorida (cor e alcance abaixo).'],['texto','🔤','Texto','Clique: escreve uma legenda no mapa.']]]
];
/* piso e telhado ficam junto da parede; escada, rampa e poço junto de porta e janela */
FERRAMENTAS[0][1].splice(1,0,['piso','⬜','Piso','Arraste um retângulo de piso (escolha o material em Pisos).'],['telhado','🛖','Telhado','Arraste um retângulo: telhado (qualquer material; abre quando alguém entra). Copas de árvores ficam na ferramenta Copas.']);
FERRAMENTAS[2][1].splice(2,0,['escada','🪜','Escada','Arraste um retângulo: escada (degraus vistos de cima). Leva do andar escolhido ao de cima (o 🪜 aparece perto dela).'],['rampa','◢','Rampa','Arraste um retângulo: rampa (chão inclinado). Também leva ao andar de cima, como a escada.'],['poco','⭕','Poço','Clique: poço de pedra com água (barra o passo).']);
FERRAMENTAS[2][1].find(x=>x[0]==='objeto')[2]='Móveis';
/* v203: pincéis de espalhar (voltaram das oficinas antigas) */
FERRAMENTAS.push(['Pincéis',[['espalhar','🖌️','Espalhar','Arraste: espalha grama, mato, folhas, flores, areia, cascalho, neve, pelos, pegadas ou sangue pelo caminho do mouse, como um spray. Escolha o tipo, a cor, o tamanho e a densidade abaixo. Ctrl+Z desfaz.']]]);
FERRAMENTAS[0][1].find(x=>x[0]==='caverna')[3]='Arraste um retângulo (ou use o botão direito como pincel): parede de CAVERNA — rocha de contorno arredondado, em blocos de 1 m, que substitui as paredes quadradas.';

/* ordem: do menor para o maior. Chão (andar 0) → piso → paredes (e cômodo) → escada/rampa → telhado → copas (camada própria, por cima de tudo) */
{const T=Object.fromEntries(FERRAMENTAS.flatMap(sec=>sec[1]).map(x=>[x[0],x]));
 T.chao=['chao','🌍','Chão do mapa','Escolha um material abaixo: ele vira o chão de TODO o mapa (fica embaixo de tudo, andar 0).'];
 T.mover=['mover','↖️','Selecionar e mover','Clique numa peça e arraste para mudar de lugar (segure Ctrl para duplicar). Passe o mouse: a peça sob a seta fica contornada. Alt+clique faz o mesmo com qualquer ferramenta.'];
 T.apagar_peca=['apagar_peca','🗑️','Apagar peça','Clique numa peça (parede, piso, móvel, rocha, poça…): ela some inteira. Passe o mouse para ver qual será apagada. Ctrl+Z desfaz.'];
 T.caverna_nat=['caverna_nat','🕳️','Caverna natural','Arraste um retângulo (mín. 8×8 m): enche de rocha e escava uma caverna natural, com salas e passagens irregulares sempre ligadas. Opções abaixo.'];
 T.cordilheira=['cordilheira','⛰️','Cordilheira','Arraste um retângulo: terreno elevado natural com beiradas irregulares. Sem "Pontiaguda" é um planalto (topo plano, paredão de rocha e rampas); muito pontiaguda vira colinas escarpadas.'];
 T.copa=['copa','🌳','Copas','Arraste um retângulo: copas de árvores. Ficam por cima de tudo (até do telhado); dá para passar por baixo.'];
 FERRAMENTAS.length=0;
 FERRAMENTAS.push(['Construir',['mover','chao','piso','parede','diagonal','cerca','caverna','caverna_nat','cordilheira','comodo','escada','rampa','telhado','copa'].map(k=>T[k])],['Apagar',['apagar_peca','tirar_area','tirar_bloco','borracha'].map(k=>T[k])],['Objetos',['porta','janela','poco','objeto','luz','texto'].map(k=>T[k])],['Geral',['modelo','conta_gotas'].map(k=>T[k])],['Pincéis',['espalhar'].map(k=>T[k])]);}

export function instalarEditorRapido(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const el=id=>root.getElementById(id);
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const mapa=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 const dims=()=>{try{const d=ctl()?.dimsAtual?.();return {W:Number(d?.W)||28,H:Number(d?.H)||14};}catch(_){return {W:28,H:14};}};
 const rasc=()=>{const r=win.mesaRascunhoMapaV193;return r&&r.ativo()&&r.mapaAtual()===mapa()?r:null;};
 // estado
 let esp=.3,luzCor=CORES_LUZ[0],luzRaio=4,aberto=false,modeloSel='',ferr='',texParede='tijolo',texPiso='madeira',texTelhado='telha',texCopa='copa_oasis',texChao='',slotCom='p',andar=1,andarOp=1,semAndarAuto=false,poca='agua',objSel='',rot=0,busca='',cat='',botao=null,antigosBt=null,painel=null,previa=null,dicas=null,msg='';
 let arrasto=null; // {tipo:'ret'|'livre'|'mover'|'espalhar', a,b, cels:Set, obj, dx,dy, copia, pts}
 let pinc={estilo:'grama',cor:'',tam:1.8,dens:1}; // pincel de espalhar
 let terr={pontiaguda:false,pontas:60,irreg:55,paredao:1,rampas:2,topo:'grama_curta',rocha:46,passos:4,entradas:1,chaoCav:'cascalho',pincel:1,pocaIrr:true,pocaIrreg:65}; // v201: terreno natural
 const tex=id=>TEXTURAS_BASE.find(t=>t.id===id)||TEXTURAS_BASE[0];
 const zoomAtual=()=>{try{return Number(win.mesaCameraV144?.zoom?.())||1;}catch(_){return 1;}};
 // v203: algumas peças do Banco guardam a imagem como objeto ({url…}) e viravam "[object Object]" (imagem quebrada) ao serem posta pelo gerador: aqui a imagem sempre vira texto
 const imgDe=o=>typeof o?.imagem==='string'?o.imagem:String((o?.imagem&&(o.imagem.url||o.imagem.src||o.imagem.href||o.imagem.dataUrl))||'');
 const objetosBanco=()=>{try{return (dep.objetos?.()||[]).filter(o=>o&&o.id&&imgDe(o)).map(o=>typeof o.imagem==='string'?o:{...o,imagem:imgDe(o)});}catch(_){return [];}};

 // ------------------------------------------------------------ edição (sempre no rascunho)
 function aplicar(fn){
  const R=rasc();if(!R){aviso('Abra o mapa como mestre para construir.');return false;}
  andarOp=andar;const antes=R.objetosAtuais();let L=fn(antes.map(o=>o));if(!L)return false;
  if(andarOp>1){const ja=new Set(antes.map(o=>o.id));L=L.map(o=>ja.has(o.id)||o.andarV144?o:{...o,andarV144:andarOp,...(o.erTipo==='piso'?{pisoAndarV144:andarOp}:{})});}
  if(andarOp!==andar){andar=andarOp;aviso('Andar '+andar+': construído por cima de parede ou telhado. O chão dele cobre o de baixo.');try{win.mesaAndarV144?.editor?.(true,andar);}catch(_){}}
  {const {W,H}=dims();L=refazBordas(antes,L,W,H);}
  const ed=diferencas(antes,L);if(!ed.length)return false;R.empurrar(ed);desenharPainel();return true;
 }
 const maxOrdem=L=>L.reduce((m,o)=>Math.max(m,Number(o.ordemOficina)||0),0);
 const ehParede=o=>o.erTipo==='parede'||o.erTipo==='cerca'||o.erTipo==='caverna'||o.oficina3==='parede'||o.oficina3==='mureta';
 const cortavel=o=>!o.invisivelV161&&!o.lacosV201&&!(Number(o.angulo)%180)&&(o.forma==='rect'||o.erTipo==='luz');
 /* lados expostos (t,r,b,l) de cada peça de parede/caverna: só eles recebem contorno e, na caverna, os cantos de fora ficam arredondados */
 const ehPecaMuro=o=>(o.erTipo==='parede'||o.erTipo==='caverna')&&!o.erDiag&&cortavel(o);
 function refazBordas(antes,L,W,H){
  const ja=new Map(antes.map(o=>[o.id,o])),agora=new Set(L.map(o=>o.id)),reg=[];
  const mexe=o=>{if(ehPecaMuro(o)||ehVao(o)){const r=retDoObjeto(o,W,H);reg.push({x:r.x-.3,y:r.y-.3,w:r.w+.6,h:r.h+.6});}};
  for(const o of L){const a=ja.get(o.id);if(!a||a!==o)mexe(o);}
  for(const a of antes)if(!agora.has(a.id))mexe(a);
  if(!reg.length)return L;
  const cob=[];for(const o of L)if(ehParede(o)||ehVao(o))cob.push({id:o.id,r:retDoObjeto(o,W,H)});
  const dentro=(p,r)=>p.x>=r.x-1e-6&&p.x<=r.x+r.w+1e-6&&p.y>=r.y-1e-6&&p.y<=r.y+r.h+1e-6;
  let mudou=false;
  const M=L.map(o=>{
   if(!ehPecaMuro(o))return o;const r=retDoObjeto(o,W,H);
   if(!reg.some(q=>retInter(r,q)))return o;
   const viz=cob.filter(c=>c.id!==o.id&&retInter(c.r,{x:r.x-.1,y:r.y-.1,w:r.w+.2,h:r.h+.2}));
   const lado=(pts)=>pts.filter(p=>!viz.some(c=>dentro(p,c.r))).length>=2; /* exposto se a maior parte do lado não encosta noutra peça */
   const q=[.25,.5,.75],d=.04;
   const t=lado(q.map(k=>({x:r.x+r.w*k,y:r.y-d}))),b=lado(q.map(k=>({x:r.x+r.w*k,y:r.y+r.h+d}))),l=lado(q.map(k=>({x:r.x-d,y:r.y+r.h*k}))),rr=lado(q.map(k=>({x:r.x+r.w+d,y:r.y+r.h*k})));
   const fl=(t?'t':'')+(rr?'r':'')+(b?'b':'')+(l?'l':'');
   if(fl===(o.bordasV198??null))return o;mudou=true;return {...o,bordasV198:fl};
  });
  return mudou?M:L;
 }
 /* parede/caverna sobre outra parede ou sobre um telhado (metade ou mais da área) fica no andar de cima; o chão desse andar é o teto do de baixo */
 function andarSobre(L,r,W,H,aceita){
  if(semAndarAuto)return;const area=r.w*r.h;if(!(area>0))return;let cob=0,mx=0;
  for(const x of L){if(andarDe(x)!==andarOp||!aceita(x))continue;const i=retInter(retDoObjeto(x,W,H),r);if(i){cob+=i.w*i.h;mx=Math.max(mx,andarDe(x));}}
  if(cob>=area*.5)andarOp=mx+1;
 }
 // tira a área r dos objetos que passam no filtro (corta em pedaços); devolve a lista nova
 const ehVaoOuLeve=o=>o.erTipo==='porta'||o.erTipo==='janela'||o.erTipo==='luz'||o.erTipo==='texto'||o.oficina3==='porta'||o.oficina3==='janela';
 function cortar(L,r,filtro,W,H){
  const out=[];
  for(const o of L){
   if(andarDe(o)!==andarOp){out.push(o);continue;} /* outro andar: não mexe */
   if(o.erDiag&&filtro(o)){if(segmentoToca(o.erDiag.a,o.erDiag.b,r))continue;out.push(o);continue;} // diagonal atingida: some inteira (e os blocos dela, abaixo)
   if(!filtro(o)||!cortavel(o)){out.push(o);continue;}
   const ro=retDoObjeto(o,W,H);let rc=r;
   // linha fina (parede, cerca, porta, janela): a linha fica no cruzamento entre dois quadrados; se ela encosta na área, tira o trecho
   // de dentro da área com a espessura toda (senão sobrariam tiras de 5 cm de cada lado)
   if(Math.min(ro.w,ro.h)<.99&&(ehParede(o)||ehVao(o))){
    if(ro.w>=ro.h){const cy=ro.y+ro.h/2;if(cy<r.y-EPS||cy>r.y+r.h+EPS){out.push(o);continue;}rc={x:r.x,y:ro.y,w:r.w,h:ro.h};}
    else{const cx=ro.x+ro.w/2;if(cx<r.x-EPS||cx>r.x+r.w+EPS){out.push(o);continue;}rc={x:ro.x,y:r.y,w:ro.w,h:r.h};}
   }
   if(!retInter(ro,rc)){out.push(o);continue;}
   if(ehVaoOuLeve(o)){if(o.erTipo==='porta'||o.erTipo==='janela'){/* só some se o trecho coberto for a maior parte dele */const i=retInter(ro,rc);if(i.w*i.h<ro.w*ro.h*.5){out.push(o);continue;}}continue;} // porta, janela, luz e texto atingidos: somem inteiros
   for(const p of subtrai(ro,rc))if(p.w>.02&&p.h>.02)out.push({...o,id:novoId('p'),...N(p,W,H)});
  }
  const ids=new Set(out.map(o=>String(o.id)));
  return out.filter(o=>!o.colisaoV177||!o.erBloco||ids.has(String(o.colisaoV177))); // blocos invisíveis da diagonal vão embora junto com ela
 }
 function comOrdem(L,novos){let m=maxOrdem(L);return novos.map(o=>({...o,ordemOficina:++m}));}
 const parede1=(r,W,H,t,tipo='parede',e=0)=>({...objParede(r,tex(t),W,H,{nome:tipo==='caverna'?'Caverna':tipo==='cerca'?'Cerca':'Parede'}),erTipo:tipo,erTex:t,sombra:true,texMundoV198:true,bordaLargura:tipo==='cerca'?1:0,...(e?{erEsp:e}:{}),...(tipo==='cerca'?{bloqueiaVisao:false,opacity:.95}:{})});
 const ehCopaTex=t=>String(t).startsWith('copa_');
 /* textura de chão/copa não serve de parede; copa e telhado ficam por cima */
 const PAREDE_NAO=/^(copa_|chao_|agua|areia|terra|lama$|cascalho|pedregulhos|grama|flores_|lava|solo_nevado|gelo$|lixo|sucata)/;
 const TELHADOS=['telha','palha','madeira','pedra','metal','metal_ferrugem','aco_escovado','chapa_xadrez','painel_scifi'];
 const andarDe=o=>Math.max(1,Number(o.andarV144)||1);
 const piso1=(r,W,H,t)=>({...objChao(r,tex(ehCopaTex(t)?'madeira':t),W,H),erTipo:'piso',erTex:ehCopaTex(t)?'madeira':t,texMundoV198:true}); /* textura alinhada ao mapa: sem emenda entre peças de piso */
 /* copa: fundo transparente (os vãos entre as árvores mostram o chão); telhado: peça de cima que se abre quando alguém entra */
 /** v205: topo de rocha orgânico: o mesmo objeto "Telhado · …" (abre para quem está dentro), mas desenhado como massa irregular que só ultrapassa o retângulo, nunca deixa o interior à mostra */
 const rochaTetoV205=ob=>{const w=Number(ob.larguraM)||1,h=Number(ob.alturaM)||1;let sd=0;for(const c of String(ob.id))sd=(sd*31+c.charCodeAt(0))%2147483647;const R=()=>{sd=(sd*48271)%2147483647;return sd/2147483647;};
  const per=2*(w+h),n=Math.max(16,Math.round(per/1.1)),pts=[];let ex=0;for(let i=0;i<n;i++){const s=i/n*per;ex=.55*ex+.45*(.05+R()*.65);let x,y,nx=0,ny=0;if(s<w){x=s;y=0;ny=-1;}else if(s<w+h){x=w;y=s-w;nx=1;}else if(s<2*w+h){x=w-(s-w-h);y=h;ny=1;}else{x=0;y=h-(s-2*w-h);nx=-1;}pts.push([x+nx*ex,y+ny*ex]);}
  const f=v=>+v.toFixed(2),mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];let d='M'+f(mid(pts[n-1],pts[0])[0])+' '+f(mid(pts[n-1],pts[0])[1]);for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n],m=mid(p,q);d+=' Q'+f(p[0])+' '+f(p[1])+' '+f(m[0])+' '+f(m[1]);}
  return {...ob,erTex:ob.erTex==='pedra'?'rocha':ob.erTex,lacosV201:d+' Z',rochaOrganicaV205:true,borda:'#14100c'};};
 const teto1=(r,W,H,t)=>ehCopaTex(t)?{...objChao(r,tex(t),W,H),nome:'Copas · '+tex(t).nome,erTipo:'copa',erTex:t,oficina3:'copa',cor:'transparent',camada:5.5,opacity:.96,bloqueiaMovimento:false,bloqueiaVisao:false}:{...objTeto(r,tex(t),W,H),erTipo:'telhado',erTex:t,texMundoV198:true};
 function poca1(r,W,H,id){const p=POCAS.find(x=>x.id===id)||POCAS[0],t=p.tex?tex(p.tex):null;
  return {...objChao(r,t,W,H),nome:'Poça · '+p.nome,cor:p.cor,erTipo:'poca',erPoca:p.id,texMundoV198:true,pocaV198:true,opacity:p.id.startsWith('agua')?.92:1,bloqueiaMovimento:false,...(p.brilho?{sombra:true}:{})};}
 const ehChao=o=>(o.erTipo==='piso'||o.erTipo==='poca'||o.oficina3==='chao')&&o.nome!=='Chão do mapa';
 const ehVao=o=>o.erTipo==='porta'||o.erTipo==='janela'||o.oficina3==='porta'||o.oficina3==='janela';
 // ---- operações PURAS sobre a lista de objetos (as ferramentas e os modelos usam as mesmas)
 function fRet(L,tipo,r,W,H,o={}){
  const tp=o.par||texParede,ti=o.piso||texPiso,pc=o.poca||poca;
  if(tipo==='tirar_area'||tipo==='tirar_bloco')return cortar(tirarDeMacicos(L,r,W,H),r,x=>ehParede(x)||ehVao(x),W,H);
  if(tipo==='borracha'){
   const M=cortar(tirarDeMacicos(L,r,W,H),r,x=>(x.erTipo&&x.erTipo!=='objeto')||/^(parede|mureta|chao|porta|janela|escada|teto)$/.test(String(x.oficina3||'')),W,H);
   return M.filter(x=>!(x.modeloId||x.erTipo==='objeto')||!retInter(retDoObjeto(x,W,H),r)); // objetos do banco: some o que toca a área
  }
  if(tipo==='cordilheira')return fCordilheira(L,r,W,H);
  if(tipo==='caverna_nat')return fCavernaNat(L,r,W,H);
  if(tipo==='caverna'){andarSobre(L,r,W,H,x=>x.erTipo==='parede'||x.erTipo==='caverna'||x.erTipo==='telhado'||x.erTipo==='macico');const M=cortar(L,r,ehParede,W,H);return fMassaManual(M,setDeRects([r]),W,H,tp);}
  if(tipo==='copa'||(tipo==='piso'&&ehCopaTex(ti)))return fCopas(L,r,W,H,tipo==='copa'?(o.copa||texCopa):ti);
  if(tipo==='telhado'){const M=cortar(L,r,x=>x.erTipo==='telhado',W,H);const t1=teto1(r,W,H,o.teto||texTelhado);return [...M,...comOrdem(M,[o.rocha?rochaTetoV205(t1):t1])];}
  if(tipo==='escada'||tipo==='rampa')return fEscada(L,tipo,r,W,H);
  if(tipo==='piso'){const M=cortar(L,r,ehChao,W,H);return [...M,...comOrdem(M,[piso1(r,W,H,ti)])];}
  if(tipo==='poca'){if(terr.pocaIrr&&Math.round(r.w)>=2&&Math.round(r.h)>=2)return fPocaIrregular(L,r,W,H,pc);return [...L,...comOrdem(L,[poca1(r,W,H,pc)])];} /* a poça fica por cima do piso, sem cortá-lo */
  if(tipo==='comodo'){
   /* andar de cima só quando o mestre escolhe o andar (botões 1–4); cômodos sobrepostos no mesmo andar se fundem */
   const e=o.esp||esp,c=contornoFino(r,e);
   const salas=new Map();for(const x of L){if(!x.erSala||!x.erSalaRs||andarDe(x)!==andarOp)continue;for(const q of x.erSalaRs){const i=retInter(q,r);if(i&&i.w*i.h>=.99){salas.set(x.erSala,x.erSalaRs);break;}}}
   if(salas.size)return fundirSalas(L,r,salas,e,W,H,ti,tp);
   andarSobre(L,r,W,H,x=>x.erTipo==='telhado'); /* cômodo em cima de um telhado: andar de cima */
   const id=novoId('sala'),M=cortar(L,{x:r.x-e/2,y:r.y-e/2,w:r.w+e,h:r.h+e},x=>ehParede(x)||ehChao(x),W,H);
   return [...M,...comOrdem(M,[{...piso1(c.piso,W,H,ti),erComodo:true,erSala:id,erSalaRs:[r]},...c.paredes.map(p=>({...parede1(p,W,H,tp,'parede',e),erSala:id}))])];}
  return null;
 }
/* contorno (paredes finas) de um conjunto de quadrados: só as arestas de fora; cantos fechados como no cômodo comum */
 function contornoDaUniao(U,e){
  const hs=new Map(),vs=new Map(),push=(m,k,v)=>{if(!m.has(k))m.set(k,[]);m.get(k).push(v);};
  for(const k of U){const [x,y]=k.split(',').map(Number);
   if(!U.has(x+','+(y-1)))push(hs,y,x);if(!U.has(x+','+(y+1)))push(hs,y+1,x);
   if(!U.has((x-1)+','+y))push(vs,x,y);if(!U.has((x+1)+','+y))push(vs,x+1,y);}
  const corridas=m=>{const o=[];for(const [l,v] of m){v.sort((a,b)=>a-b);let i=v[0],f=v[0];for(const t of v.slice(1)){if(t===f+1)f=t;else{o.push([l,i,f+1]);i=f=t;}}o.push([l,i,f+1]);}return o;};
  return [...corridas(hs).map(([y,x0,x1])=>({x:x0-e/2,y:y-e/2,w:(x1-x0)+e,h:e})),...corridas(vs).map(([x,y0,y1])=>({x:x-e/2,y:y0+e/2,w:e,h:(y1-y0)-e}))];
 }
 function fundirSalas(L,r,salas,e,W,H,ti,tp){
  const ids=new Set(salas.keys()),rs=[r,...[...salas.values()].flat()],U=new Set();
  for(const q of rs)for(let x=Math.round(q.x);x<Math.round(q.x+q.w);x++)for(let y=Math.round(q.y);y<Math.round(q.y+q.h);y++)U.add(x+','+y);
  const interno=o=>{const q=retDoObjeto(o,W,H),cx=q.x+q.w/2,cy=q.y+q.h/2,hor=q.w>=q.h,a=hor?[Math.floor(cx),Math.floor(cy-.5)]:[Math.floor(cx-.5),Math.floor(cy)],b=hor?[Math.floor(cx),Math.floor(cy+.5)]:[Math.floor(cx+.5),Math.floor(cy)];return U.has(a.join(','))&&U.has(b.join(','));};
  let M=L.filter(o=>!(o.erSala&&ids.has(o.erSala)&&o.erTipo==='parede'));          /* paredes antigas das salas fundidas saem */
  M=M.filter(o=>!(ehVao(o)&&andarDe(o)===andarOp&&interno(o)));                     /* portas e janelas que ficaram no meio saem */
  const c=contornoFino(r,e),id=novoId('sala');
  M=cortar(M,c.piso,ehChao,W,H).map(o=>o.erSala&&ids.has(o.erSala)?{...o,erSala:id,...(o.erSalaRs?{erSalaRs:rs}:{})}:o);
  return [...M,...comOrdem(M,[{...piso1(c.piso,W,H,ti),erComodo:true,erSala:id,erSalaRs:rs},...contornoDaUniao(U,e).map(q=>({...parede1(q,W,H,tp,'parede',e),erSala:id}))])];
 }
/* troca a textura do "Chão do mapa" (ou cria um chão do tamanho do mapa, por baixo de tudo) */
 function fTrocaChao(L,t,W,H){
  if(ehCopaTex(t))return null;
  const ped=L.filter(o=>o.nome==='Chão do mapa'&&o.erTipo==='piso');
  if(ped.length===1&&ped[0].erTex===t){const r=retDoObjeto(ped[0],W,H);if(r.w>=W-.01&&r.h>=H-.01)return null;}
  const n={...objChao({x:0,y:0,w:W,h:H},tex(t),W,H),...(ped[0]?{id:ped[0].id}:{}),nome:'Chão do mapa',erTipo:'piso',erTex:t,ordemOficina:0,andarV144:1,andarAmbosV144:true,texMundoV198:true};
  return [n,...L.filter(o=>!(o.nome==='Chão do mapa'&&o.erTipo==='piso'))];
 }
 /* escada/rampa: peças de chão; com andares acima, a escada liga os dois andares (vão no de cima) */
 function fEscada(L,tipo,r,W,H){
  const t=ehCopaTex(texPiso)?'madeira':texPiso,lig={escadaAndarV144:true,andarAmbosV144:true,andarBaseV198:andarOp}; /* conduz do andar atual ao de cima */
  if(tipo==='escada')return [...L,...comOrdem(L,[{...objEscada(r,tex(t),W,H),erTipo:'escada',erTex:t,...lig}])];
  const g={...objEscada(r,tex(t),W,H),nome:'Rampa',erTipo:'rampa',erTex:t,oficina3:'rampa',sombra:true,...lig};g.texturaM=3;
  return [...L,...comOrdem(L,[g])];
 }
 function fPoco(L,p,W,H){
  const c={x:Math.round(p.x*2)/2,y:Math.round(p.y*2)/2},ext={x:c.x-.9,y:c.y-.9,w:1.8,h:1.8},int={x:c.x-.5,y:c.y-.5,w:1,h:1};
  const a={...objChao(ext,tex('pedra'),W,H),forma:'circle',nome:'Poço',erTipo:'poco',camada:3,bloqueiaMovimento:true,borda:'#2a2622',bordaLargura:2,sombra:true,oficina3:'poco',pvMax:80,pvAtual:80,dureza:10,material:'pedra'};
  const b={...objChao(int,tex('agua_profunda'),W,H),forma:'circle',nome:'Poço · água',erTipo:'poco',camada:3,bloqueiaMovimento:false,oficina3:'poco'};
  return [...L,...comOrdem(L,[a,b])];
 }
 /* copas: árvores INTEIRAS dentro do retângulo (nenhuma cortada); cada uma é um objeto da camada de cima, por cima do telhado */
 function fCopas(L,r,W,H,id){
  const c=COPAS.find(x=>x.id===id)||COPAS[0],[mn,mx]=c.m,lado=Math.min(r.w,r.h),passo=(mn+mx)/2*.85;
  const cols=Math.max(1,Math.floor(r.w/passo)),rows=Math.max(1,Math.floor(r.h/passo)),cw=r.w/cols,ch=r.h/rows;
  const h=(a,b,k)=>{const t=Math.sin(a*127.1+b*311.7+k*74.7)*43758.5453;return t-Math.floor(t);};
  const novos=[];
  const mais=(cx,cy,s,sem)=>{const x=Math.max(r.x+s/2,Math.min(r.x+r.w-s/2,cx)),y=Math.max(r.y+s/2,Math.min(r.y+r.h-s/2,cy)),src=c.src[Math.floor(h(sem,7,1)*c.src.length)%c.src.length];
   const gA='arv_'+Date.now().toString(36)+Math.round(Math.random()*1e6).toString(36),ang=Math.round(h(sem,5,3)*359);
   novos.push({...objChao({x:x-s/2,y:y-s/2,w:s,h:s},{id:c.id,nome:c.nome,src,tamM:s},W,H),nome:'Copa · '+c.nome,erTipo:'copa',erTex:c.id,modeloId:c.id,oficina3:'copa',cor:'transparent',camada:5.5,angulo:ang,bloqueiaMovimento:false,bloqueiaVisao:false,grupoArvoreV203:gA,...copaViva(c.id)});
   {const tr=troncoDaCopa(c.id,x,y,s,ang,W,H,gA);if(tr)novos.push(tr);}};
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
   const sem=Math.round(r.x*7+r.y*13+i*31+j*57);
   const s=Math.min(mn+(mx-mn)*h(sem,1,2),lado,cw*1.4,ch*1.4);if(s<.7)continue;
   mais(r.x+cw*(i+.5)+(h(sem,2,2)-.5)*cw*.4,r.y+ch*(j+.5)+(h(sem,3,2)-.5)*ch*.4,s,sem);}
  if(!novos.length)mais(r.x+r.w/2,r.y+r.h/2,Math.max(.7,Math.min(mn,lado)),Math.round(r.x*7+r.y*13));
  return [...L,...comOrdem(L,novos)];
 }
 /* v200: materialidade das portas e paredes geradas: cada material tem aparência, vida (PV) e dureza próprias */
 const PV_PAREDE={pedra:500,metal:420,madeira:160,palha:60};
 function portaMaterial(estilo,tipo){
  const sci=/futur/.test(String(estilo||''));
  if(tipo==='gate')return {tex:'metal',nome:'Portão de grade',campos:{material:'metal',pvMax:260,pvAtual:260,dureza:16,bloqueiaVisao:false,cor:'#4a4f57',borda:'#15181c',bordaLargura:2}};
  if(tipo==='reinforced')return sci?{tex:'aco_escovado',nome:'Porta de aço',campos:{material:'metal',pvMax:240,pvAtual:240,dureza:20,cor:'#8a949e',borda:'#1b2128',bordaLargura:2}}:{tex:'madeira',nome:'Porta reforçada',campos:{material:'madeira',pvMax:180,pvAtual:180,dureza:9,cor:'#6a4222',borda:'#23201d',bordaLargura:3}};
  return sci?{tex:'painel_scifi',nome:'Porta de painel',campos:{material:'metal',pvMax:140,pvAtual:140,dureza:14,cor:'#5b6b7d',borda:'#10151b',bordaLargura:2}}:{tex:'madeira',nome:'Porta de madeira',campos:{material:'madeira',pvMax:90,pvAtual:90,dureza:7,cor:'#7a4e2a',borda:'#2e1c0e',bordaLargura:2}};
 }
 /* ---- 🗺️ plano do gerador de mapas (MapForge) → objetos do rascunho: chão, pisos, paredes, portas, objetos do banco, árvores, luzes, telhados e legendas */
 function fPlano(L,pl0,W,H,ox=0,oy=0){
  /* v200: plano maior que o mapa atual → recorta nas bordas (sem perder as paredes das salas cortadas) e fecha a borda com uma parede, para as salas continuarem fechadas */
  let pl=pl0;if(pl0.W>W+.01||pl0.H>H+.01){pl=recortarAoMapa(JSON.parse(JSON.stringify({...pl0,W,H})));const e=.45,tx=pl.paredes[0]?.tex||pl0.paredes?.[0]?.tex||'pedra';pl.paredes.push(...[R2(0,0,W,e),R2(0,H-e,W,e),R2(0,e,e,H-2*e),R2(W-e,e,e,H-2*e)].map(r=>({r,tex:tx,esp:e})));pl.vaos=(pl.vaos||[]).filter(v=>Math.min(v.r.w,v.r.h)>=.3&&Math.max(v.r.w,v.r.h)>=1);}
  const novos=[],mv=r=>({x:r.x+ox,y:r.y+oy,w:r.w,h:r.h}),dentro=r=>r.x>=-.01&&r.y>=-.01&&r.x+r.w<=W+.01&&r.y+r.h<=H+.01,ponto=(x,y)=>x>=0&&y>=0&&x<=W&&y<=H;
  const ch=(a,b,k)=>{const t=Math.sin(a*127.1+b*311.7+k*74.7)*43758.5453;return t-Math.floor(t);};
  let M=L;const faltou=new Set();
  if(pl.chao){const t=fTrocaChao(M,pl.chao,W,H);if(t)M=t;}
  for(const m of (pl.macicos||[])){const grupo=novoGrupo(),seed=semente(),cel=rs=>absSet(setDeRects(rs.map(mv)),0,0);novos.push(...fazMacico(cel(m.tudo),W,H,{grupo,seed,t:m.piso||'cascalho',tipo:'macicoTopo',nome:'Chão da caverna',suav:2,ruido:.2,colideSet:null}));m.__grupo=grupo;m.__seed=seed;}
  for(const p of pl.pisos){const r=mv(p.r);if(!dentro(r))continue;
   if(p.poca){novos.push(poca1(r,W,H,p.poca));continue;}
   if(p.escada)novos.push({...objEscada(r,tex(p.tex),W,H),erTipo:'escada',erTex:p.tex,escadaAndarV144:true,andarAmbosV144:true,andarBaseV198:1});else novos.push(piso1(r,W,H,p.tex));}
  for(const p of pl.paredes){const r=mv(p.r);if(!dentro(r))continue;{const o=parede1(r,W,H,p.tex,p.caverna?'caverna':'parede',p.caverna?1:(p.esp||.4)),pv=PV_PAREDE[o.material]||300;novos.push({...o,pvMax:pv,pvAtual:pv});}}
  for(const m of (pl.macicos||[]))novos.push(...fazMacico(setDeRects(m.rocha.map(mv)),W,H,{grupo:m.__grupo,seed:m.__seed,t:m.tex||'rocha',nome:'Rocha da caverna',suav:2,ruido:.2}));
  for(const p of pl.vaos){const r=mv(p.r);if(!dentro(r))continue;{const pm=portaMaterial(pl.estilo,p.tipoPorta);novos.push({...objPorta(r,tex(pm.tex),W,H),nome:pm.nome,...pm.campos,erTipo:'porta',erMat:pm.campos.material,sombra:true});}}
  for(const o of pl.objetos){if(!ponto(o.x+ox,o.y+oy))continue;const m=achaObjeto(o.kw);if(!m){faltou.add(o.kw.split('|')[0]);continue;}novos.push({...objDoBanco(m,{x:o.x+ox,y:o.y+oy},W,H,o.rot||0),erTipo:'objeto'});}
  for(const l of pl.luzes){if(!ponto(l.x+ox,l.y+oy))continue;const d=l.raio*2,r={x:l.x+ox-d/2,y:l.y+oy-d/2,w:d,h:d};
   novos.push({id:novoId('luz'),nome:'Luz',forma:'circle',cor:l.cor,bordaLargura:0,borda:'',opacity:.6,mascara:'radial-gradient(circle closest-side, #000 0%, rgba(0,0,0,.55) 45%, transparent 100%)',misturaV197:'screen',...N(r,W,H),angulo:0,camada:4,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,erTipo:'luz'});}
  for(const t of pl.telhados){const r=mv(t.r);if(!dentro(r))continue;novos.push(teto1(r,W,H,t.tex));}
  for(const c of pl.copas){if(!ponto(c.x+ox,c.y+oy))continue;const cp=COPAS.find(q=>q.id===c.id)||COPAS[0],sem=Math.round(c.x*7+c.y*13),tam=cp.m[0]+(cp.m[1]-cp.m[0])*ch(sem,1,2),src=cp.src[Math.floor(ch(sem,7,1)*cp.src.length)%cp.src.length];
   {const gA='arv_'+Date.now().toString(36)+Math.round(Math.random()*1e6).toString(36);
   novos.push({...objChao({x:c.x+ox-tam/2,y:c.y+oy-tam/2,w:tam,h:tam},{id:cp.id,nome:cp.nome,src,tamM:tam},W,H),nome:'Copa · '+cp.nome,erTipo:'copa',erTex:cp.id,modeloId:cp.id,oficina3:'copa',cor:'transparent',camada:5.5,angulo:c.rot||0,bloqueiaMovimento:false,bloqueiaVisao:false,grupoArvoreV203:gA,...copaViva(cp.id)});
   const tr=troncoDaCopa(cp.id,c.x+ox,c.y+oy,tam,c.rot||0,W,H,gA);if(tr)novos.push(tr);}}
  for(const t of pl.textos){if(!ponto(t.x+ox,t.y+oy))continue;const w=Math.max(2,Math.min(14,t.t.length*.55));
   novos.push({id:novoId('txt'),nome:'Texto',forma:'rect',cor:'transparent',bordaLargura:0,textoV197:t.t,tamTexto:14,...N({x:t.x+ox-w/2,y:t.y+oy-.6,w,h:1.2},W,H),angulo:0,camada:6,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,erTipo:'texto'});}
  pl0.faltou=[...faltou];
  return [...M,...comOrdem(M,novos)];
 }
 /* ---- v201: terreno natural, desenhado como MASSAS ORGÂNICAS: um caminho SVG suave com a textura do mapa (contorno balançado, quinas arredondadas, sombra e relevo),
    mais blocos invisíveis que barram o passo e a visão. Guarda os retângulos da massa (rectsV201) para poder tirar pedaços depois ("Tirar área", "Tirar blocos", borracha). */
 let semFixa=null; // v204: o construir pode fixar a semente (mapa de teste reproduzível: reaplicar a reforma gera exatamente o mesmo terreno)
 const semente=()=>semFixa?semFixa():Math.floor(Math.random()*2147483647);
 let seqTerr=0;const novoGrupo=()=>'terr_'+Date.now().toString(36)+(seqTerr++).toString(36);
 const TOPOS=[['grama_curta','Grama'],['grama_alta','Mato alto'],['grama_seca','Capim seco'],['terra_batida','Terra'],['pedra','Pedra'],['areia_clara','Areia'],['solo_nevado','Neve'],['cascalho','Cascalho']];
 const CHAOS_CAV=[['cascalho','Cascalho'],['terra_batida','Terra'],['pedra','Pedra'],['areia_escura','Areia escura'],['rocha_vulcanica','Rocha vulcânica']];
 const texRocha=()=>{const t=String(texParede);return(t==='tijolo'||PAREDE_NAO.test(t)||t==='madeira'||t==='telha'||t==='palha')?'rocha':t;};
 const absSet=(set,ox,oy)=>{const s=new Set();for(const k of set){const [x,y]=k.split(',').map(Number);s.add((x+ox)+','+(y+oy));}return s;};
 const setDeRects=rs=>{const s=new Set();for(const q of rs)for(let x=Math.round(q.x);x<Math.round(q.x+q.w);x++)for(let y=Math.round(q.y);y<Math.round(q.y+q.h);y++)s.add(x+','+y);return s;};
 /* set = quadrados ABSOLUTOS ('x,y' em metros inteiros); colideSet = quadrados que barram o passo (padrão: todos) */
 function fazMacico(set,W,H,p){
  const {t,tipo='macico',nome='Rocha',grupo,suav=2,ruido=.16,seed=1,andarObj=0,texM=3,camada=0,manual=false}=p,colideSet=p.colideSet===undefined?set:p.colideSet;
  const lacos=lacosSuaves(set,{suavizar:suav,ruido,seed,angular:p.angular||0});if(!lacos.length)return [];
  const cx=caixaDeLacos(lacos),x0=Math.floor(cx.x0-.6),y0=Math.floor(cx.y0-.6),r={x:x0,y:y0,w:Math.ceil(cx.x1+.6)-x0,h:Math.ceil(cx.y1+.6)-y0};
  const rects=retangulosDeCelulas(set),bl=colideSet?retangulosDeCelulas(colideSet):[];
  const base=tipo==='macicoTopo'?{...objChao(r,tex(t),W,H),nome,erTipo:'macicoTopo'}:{...objParede(r,tex(t),W,H,{nome}),erTipo:'macico',bloqueiaMovimento:false,bloqueiaVisao:false,sombra:false,pvMax:0,pvAtual:0,dureza:0};
  const pai={...base,erTex:t,texturaM:texM,borda:p.borda||'#1a1612',...(p.extra||{}),lacosV201:caminhoDeLacos(lacos,x0,y0),rectsV201:rects.map(q=>[q.x,q.y,q.w,q.h]),blocosV201:bl.map(q=>[q.x,q.y,q.w,q.h]),
   parV201:{t,tipo,nome,grupo,suav,ruido,seed,andarObj,texM,camada,angular:p.angular||0,borda:p.borda,extra:p.extra,manual},grupoV201:grupo,...(camada?{camada}:{}),...(andarObj?{andarV144:andarObj,pisoAndarV144:andarObj}:{})};
  const filhos=bl.map(q=>({...objBloqueio(q,W,H,true),colisaoV177:pai.id,erBloco:true,grupoV201:grupo,nome:'Rocha',...(andarObj?{andarV144:andarObj}:{})}));
  return [pai,...filhos];
 }
 /* tira o retângulo r (metros inteiros) das massas orgânicas que ele toca: a massa é refeita com o que sobrou (ou some, se nada sobrou) */
 function tirarDeMacicos(L,r,W,H){
  const alvos=L.filter(o=>o.lacosV201&&Array.isArray(o.rectsV201)&&andarDe(o)===andarOp&&o.rectsV201.some(([x,y,w,h])=>retInter({x,y,w,h},r)));
  if(!alvos.length)return L;
  const fora=new Set(alvos.map(o=>o.id)),novos=[],gruposAlvo=new Set(alvos.map(o=>o.grupoV201).filter(Boolean));
  for(const o of L)if(o.erTipo==='pico'&&gruposAlvo.has(o.grupoV201)&&o.baseV201&&o.baseV201[0]>=r.x&&o.baseV201[0]<=r.x+r.w&&o.baseV201[1]>=r.y&&o.baseV201[1]<=r.y+r.h)fora.add(o.id);
  const resto=lista=>{const out=[];for(const [x,y,w,h] of lista)out.push(...subtrai({x,y,w,h},r));return out;};
  for(const o of alvos){
   const mass=setDeRects(resto(o.rectsV201));if(!mass.size)continue;
   const col=Array.isArray(o.blocosV201)?setDeRects(resto(o.blocosV201)):mass;
   novos.push(...fazMacico(mass,W,H,{...o.parV201,colideSet:col.size?col:null}).map(x=>x.lacosV201?{...x,ordemOficina:o.ordemOficina}:x));
  }
  return [...L.filter(o=>!fora.has(o.id)&&!fora.has(o.colisaoV177)),...novos];
 }
 /* a seta (mover): todas as peças do mesmo terreno natural andam juntas */
 function grupoDoTerreno(L,o){
  const pai=o.colisaoV177?L.find(x=>x.id===o.colisaoV177)||o:o,g=pai.grupoV201||o.grupoV201;
  if(!g)return new Set([o.id]);
  return new Set(L.filter(x=>x.grupoV201===g).map(x=>x.id));
 }
 /* pico 3D: sprite de montanha/rocha em vista inclinada, de pé (aponta para cima na tela), apoiado no chão em (x,y); fica por cima da rocha */
 const SPR_PICO=['montanha','montanha_b','grupo','serra'],SPR_PEDRA=['rocha','rochas'];
 function picoObj(p,ids,W,H,grupo){
  const m=RELEVO.find(q=>q.id===ids[p.v%ids.length])||RELEVO[0];if(!m)return null;
  const w=+(p.tam/Math.max(.2,m.proporcao)).toFixed(2),h=w,cy=p.y-(m.base-.5)*h;
  return {...objDoBanco({id:m.id,nome:'Pico · '+m.nome,imagem:m.src,larguraM:w,alturaM:h,camada:3.6,bloqueiaMovimento:false},{x:p.x,y:cy},W,H),erTipo:'pico',grupoV201:grupo,baseV201:[+p.x.toFixed(2),+p.y.toFixed(2)],modeloId:'relevo_'+m.id};
 }
 /* poça de forma IRREGULAR: lago/poça orgânico (contorno suave) dentro do retângulo arrastado; água, lava, pântano… (v201) */
 function fPocaIrregular(L,r,W,H,id){
  const p=POCAS.find(x=>x.id===id)||POCAS[0],t=p.tex||'agua',w=Math.round(r.w),h=Math.round(r.h),ox=Math.round(r.x),oy=Math.round(r.y),seed=semente();
  const g=contornoOrganico(w,h,{irregularidade:terr.pocaIrreg/100,pontas:0,seed}),set=absSet(celulasDe(g,w,1),ox,oy);
  const lava=p.id.startsWith('lava'),extra={erPoca:p.id,pocaIrregularV201:true,opacity:p.id.startsWith('agua')?.92:1,bloqueiaMovimento:false,...(lava?{sombra:true}:{})};
  const novos=fazMacico(set,W,H,{t,tipo:'macicoTopo',nome:'Poça · '+p.nome,grupo:novoGrupo(),suav:3,ruido:.22,seed,colideSet:null,borda:lava?'#5a1a08':'#0c2f4a',extra,camada:1.4,texM:3});
  return [...L,...comOrdem(L,novos)];
 }
 function fCordilheira(L,r,W,H){
  const ponta=terr.pontiaguda?terr.pontas/100:0,seed=semente(),ox=Math.round(r.x),oy=Math.round(r.y);
  const c=cordilheira(Math.round(r.w),Math.round(r.h),{irregularidade:terr.irreg/100,pontas:ponta,paredao:terr.paredao,rampas:terr.rampas,seed});
  const grupo=novoGrupo(),tp=texRocha(),andarCima=Math.min(4,andar+1),esc=c.tipo==='escarpada';
  let M=cortar(L,r,x=>ehParede(x),W,H);
  const par={grupo,seed,suav:esc?2:3,ruido:esc?.32:.2,angular:0},novos=[];
  if(esc){
   novos.push(...fazMacico(absSet(new Set([...c.rocha,...c.aberto]),ox,oy),W,H,{...par,t:'cascalho',tipo:'macicoTopo',nome:'Vale · '+c.nome,colideSet:null}));
   novos.push(...fazMacico(absSet(c.rocha,ox,oy),W,H,{...par,t:tp,nome:'Rocha · '+c.nome}));
   for(const p of picosDe(absSet(c.rocha,ox,oy),{pontas:Math.max(.7,ponta),seed}))novos.push(picoObj(p,SPR_PICO,W,H,grupo));
  }else{
   // o paredão e o topo formam UMA massa de rocha (sem frestas); o topo plano e elevado é desenhado por cima; só o paredão barra o passo
   novos.push(...fazMacico(absSet(new Set([...c.rocha,...c.topo]),ox,oy),W,H,{...par,t:tp,nome:'Paredão · '+c.nome,colideSet:absSet(c.rocha,ox,oy)}));
   novos.push(...fazMacico(absSet(c.topo,ox,oy),W,H,{...par,suav:3,ruido:.14,t:terr.topo,tipo:'macicoTopo',nome:'Topo · '+c.nome,colideSet:null,andarObj:andarCima,camada:3.2}));
   if(ponta>0)for(const p of picosDe(absSet(c.rocha,ox,oy),{pontas:ponta,seed,tamMin:1.5,tamMax:2.8,dentroMin:.5,maximo:16}))novos.push(picoObj(p,SPR_PEDRA,W,H,grupo));
   for(const q of c.rampas){ // v201: a rampa é de ROCHA como a cordilheira (mesma cor e textura) e de forma orgânica; por baixo segue o objeto de subida/descida
    const rr={x:q.x+ox,y:q.y+oy,w:q.w,h:q.h},sob=q.sobeParaDentro||{dx:1,dy:0};
    novos.push({...objEscada(rr,tex(tp),W,H),nome:'Rampa',erTipo:'rampa',erTex:tp,oficina3:'rampa',sombra:false,escadaAndarV144:true,andarAmbosV144:true,andarBaseV198:andarOp,texturaM:3,grupoV201:grupo,bordaLargura:0});
    novos.push(...fazMacico(absSet(setDeRects([{x:q.x,y:q.y,w:q.w,h:q.h}]),ox,oy),W,H,{...par,suav:3,ruido:.12,t:tp,nome:'Rampa de rocha',colideSet:null,camada:3.3,extra:{setasV201:{dx:sob.dx,dy:sob.dy}}}));
   }
  }
  msg=c.nome+(esc?' · picos 3D e rocha recortada com fendas por onde se passa':' · '+c.rampas.length+' rampa(s) de subida (leva ao andar '+andarCima+')')+'. Ctrl+Z desfaz; "Tirar área" tira pedaços; a seta (↖️) move tudo junto.';
  return [...M,...comOrdem(M,novos)];
 }
 function fCavernaNat(L,r,W,H){
  const w=Math.round(r.w),h=Math.round(r.h);
  if(w<8||h<8){aviso('A caverna natural precisa de pelo menos 8×8 m.');return null;}
  const seed=semente(),c=cavernaNatural(w,h,{rocha:terr.rocha/100,passos:terr.passos,seed}),ox=Math.round(r.x),oy=Math.round(r.y),grupo=novoGrupo();
  abrirEntradas(c.grade,w,h,terr.entradas,seed);
  const rocha=absSet(celulasDe(c.grade,w,1),ox,oy),tudo=absSet(new Set([...celulasDe(c.grade,w,1),...celulasDe(c.grade,w,0)]),ox,oy);
  let M=cortar(L,r,x=>ehParede(x)||ehChao(x),W,H);
  const par={grupo,seed,suav:2,ruido:.2};
  const novos=[...fazMacico(tudo,W,H,{...par,t:terr.chaoCav,tipo:'macicoTopo',nome:'Chão da caverna',colideSet:null}),...fazMacico(rocha,W,H,{...par,t:texRocha(),nome:'Rocha da caverna'})];
  msg='Caverna natural · '+Math.round(c.fracaoAberta*100)+'% aberta, '+terr.entradas+' entrada(s). Ctrl+Z desfaz; arraste de novo para sortear outra.';
  return [...M,...comOrdem(M,novos)];
 }
 /* painel do terreno natural: os controles só mudam o valor (sem redesenhar o painel: nada pula) */
 function blocoTerreno(){
  const sel=(k,lista,v)=>`<select data-ter="${k}">${lista.map(([id,n])=>`<option value="${id}"${String(id)===String(v)?' selected':''}>${esc(n)}</option>`).join('')}</select>`;
  const rng=(k,mn,mx,v,rot)=>`<label class="er-ter-l">${rot} <b data-terv="${k}">${v}%</b><input type="range" data-ter="${k}" min="${mn}" max="${mx}" step="1" value="${v}"></label>`;
  if(ferr==='cordilheira'){
   const esc2=terr.pontiaguda&&terr.pontas>=LIMITE_ESCARPADA*100;
   return `<div class="er-terreno"><h5>⛰️ Cordilheira</h5>
    <label class="er-ter-c"><input type="checkbox" data-ter="pontiaguda"${terr.pontiaguda?' checked':''}> Pontiaguda</label>
    <div data-terbloco="pontas" ${terr.pontiaguda?'':'hidden'}>${rng('pontas',10,100,terr.pontas,'Pontas')}</div>
    ${rng('irreg',0,100,terr.irreg,'Beiradas irregulares')}
    <div class="er-ter-l2"><label>Paredão ${sel('paredao',[[1,'1 m'],[2,'2 m'],[3,'3 m']],terr.paredao)}</label><label>Rampas ${sel('rampas',[[0,'0'],[1,'1'],[2,'2'],[3,'3']],terr.rampas)}</label></div>
    <label class="er-ter-l">Topo ${sel('topo',TOPOS,terr.topo)}</label>
    <div class="er-nota" data-terres>${esc2?'Muito pontiaguda: vira <b>colinas escarpadas</b> (rocha recortada, sem topo plano).':'Sem muitas pontas: é um <b>planalto</b> (topo plano elevado, paredão em volta e rampas de subida).'}</div></div>`;}
  if(ferr==='caverna_nat'){
   return `<div class="er-terreno"><h5>🕳️ Caverna natural</h5>
    ${rng('rocha',30,60,terr.rocha,'Rocha (mais = mais apertada)')}
    <div class="er-ter-l2"><label>Suavizar ${sel('passos',[[2,'Pouco'],[4,'Médio'],[6,'Muito']],terr.passos)}</label><label>Entradas ${sel('entradas',[[0,'0'],[1,'1'],[2,'2'],[3,'3']],terr.entradas)}</label></div>
    <label class="er-ter-l">Chão ${sel('chaoCav',CHAOS_CAV,terr.chaoCav)}</label>
    <div class="er-nota">Arraste um retângulo (mín. 8×8 m): enche de rocha e escava salas e passagens irregulares, todas ligadas. Arraste de novo para sortear outra.</div></div>`;}
  if(ferr==='poca'){
   return `<div class="er-terreno"><h5>💧 Poça</h5><label class="er-ter-c"><input type="checkbox" data-ter="pocaIrr"${terr.pocaIrr?' checked':''}> Forma irregular</label><div data-terbloco="pocaIrreg" ${terr.pocaIrr?'':'hidden'}>${rng('pocaIrreg',10,100,terr.pocaIrreg,'Irregularidade')}</div><div class="er-nota">Arraste um retângulo (mín. 2×2 m): a poça ocupa a área com contorno orgânico. Sem a caixa marcada, sai a forma de antes.</div></div>`;}
  if(ferr==='caverna'){
   return `<div class="er-terreno"><h5>🪨 Pincel de rocha</h5><label class="er-ter-l">Tamanho do pincel (botão direito) ${sel('pincel',[[1,'1 m'],[2,'2 m'],[3,'3 m'],[4,'4 m'],[6,'6 m']],terr.pincel)}</label></div>`;}
  return '';
 }
 function aoMudarTerreno(e){
  const t=e.target.closest?.('[data-ter]');if(!t)return false;const k=t.dataset.ter;
  if(k==='pontiaguda'){terr.pontiaguda=!!t.checked;const b=painel.querySelector('[data-terbloco="pontas"]');if(b)b.hidden=!terr.pontiaguda;}
  else if(k==='pocaIrr'){terr.pocaIrr=!!t.checked;const b=painel.querySelector('[data-terbloco="pocaIrreg"]');if(b)b.hidden=!terr.pocaIrr;}
  else if(t.type==='range'){terr[k]=Number(t.value);const v=painel.querySelector('[data-terv="'+k+'"]');if(v)v.textContent=t.value+'%';}
  else if(['topo','chaoCav'].includes(k))terr[k]=t.value;
  else terr[k]=Number(t.value);
  const r=painel.querySelector('[data-terres]');if(r){const esc2=terr.pontiaguda&&terr.pontas>=LIMITE_ESCARPADA*100;r.innerHTML=esc2?'Muito pontiaguda: vira <b>colinas escarpadas</b> (rocha recortada, sem topo plano).':'Sem muitas pontas: é um <b>planalto</b> (topo plano elevado, paredão em volta e rampas de subida).';}
  return true;
 }
 function fLivre(L,rs,W,H){let M=L;for(const r of rs)M=cortar(M,r,ehParede,W,H);return fMassaManual(M,setDeRects(rs),W,H,texParede);}
 /* v201: a ferramenta Caverna (arrastar ou pincel) desenha MASSA ORGÂNICA (contorno suave, cantos arredondados); massas vizinhas se fundem numa só */
 function fMassaManual(L,novas,W,H,tp){
  const vizinho=(k,set)=>{const [x,y]=k.split(',').map(Number);return set.has(k)||set.has((x+1)+','+y)||set.has((x-1)+','+y)||set.has(x+','+(y+1))||set.has(x+','+(y-1));};
  const juntar=L.filter(o=>o.erTipo==='macico'&&o.parV201?.manual&&Array.isArray(o.rectsV201)&&andarDe(o)===andarOp&&setDeRects(o.rectsV201.map(([x,y,w,h])=>({x,y,w,h}))).size&&[...setDeRects(o.rectsV201.map(([x,y,w,h])=>({x,y,w,h})))].some(k=>vizinho(k,novas)));
  const uniao=new Set(novas),fora=new Set(juntar.map(o=>o.id));
  for(const o of juntar)for(const k of setDeRects(o.rectsV201.map(([x,y,w,h])=>({x,y,w,h}))))uniao.add(k);
  const base=juntar[0],grupo=base?.grupoV201||novoGrupo(),seed=base?.parV201?.seed||semente();
  const M=L.filter(o=>!fora.has(o.id)&&!fora.has(o.colisaoV177));
  const massa=fazMacico(uniao,W,H,{t:tp,nome:'Caverna',grupo,suav:2,ruido:.2,seed,manual:true,...(andarOp>1?{andarObj:andarOp}:{})}).map(o=>o.lacosV201&&base?{...o,ordemOficina:base.ordemOficina}:o);
  return [...M,...comOrdem(M,massa)];
 }
 // parede/cerca em linha reta (espessura fixa; pode ser arrastada para onde quiser, mas sempre em linha)
 function fLinha(L,tipo,a,b,W,H,o={}){
  const e=tipo==='cerca'?(o.espCerca||.15):(o.esp||esp),r=retDeLinha(a,b,e,W,H);if(!r)return null;if(tipo==='parede')andarSobre(L,r,W,H,x=>x.erTipo==='parede'||x.erTipo==='caverna'||x.erTipo==='telhado');
  const M=cortar(L,r,x=>ehParede(x)&&x.erTipo!=='caverna',W,H);
  return [...M,...comOrdem(M,[parede1(r,W,H,o.par||texParede,tipo,e)])];
 }
 function fDiagonal(L,a,b,W,H,o={}){
  const pd=pontosDiagonal(a,b,W,H);if(!pd)return null;const e=o.esp||esp,{a:p,b:q}=pd;
  const comp=Math.hypot(q.x-p.x,q.y-p.y),mx=(p.x+q.x)/2,my=(p.y+q.y)/2,ang=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
  const vis={...objParede({x:mx-comp/2,y:my-e/2,w:comp,h:e},tex(o.par||texParede),W,H,{nome:'Parede diagonal'}),angulo:+ang.toFixed(2),bloqueiaMovimento:false,bloqueiaVisao:false,erTipo:'parede',erEsp:e,erDiag:{a:p,b:q},oficina3:'parede_diagonal'};
  const blocos=blocosLinha([p,q],e,W,H,{de:vis.id}).map(x=>({...x,erBloco:true}));
  return [...L,...comOrdem(L,[vis,...blocos])];
 }
 function fVao(L,tipo,p,W,H){
  // a parede mais perto do clique (até 60 cm); o vão tem 1 m ao longo dela e a MESMA espessura dela
  let alvo=null,dm=.6;for(const o of L){if(!ehParede(o)||!cortavel(o)||o.erTipo==='caverna'||andarDe(o)!==andarOp)continue;const d=distRet(p,retDoObjeto(o,W,H));if(d<=dm){dm=d;alvo=o;}}
  if(!alvo)return null;
  const ro=retDoObjeto(alvo,W,H),hor=ro.w>=ro.h;
  const c=hor?{x:Math.max(Math.floor(ro.x+EPS),Math.min(Math.floor(p.x),Math.floor(ro.x+ro.w-EPS-.001))),y:ro.y,w:CELULA,h:ro.h}:{x:ro.x,y:Math.max(Math.floor(ro.y+EPS),Math.min(Math.floor(p.y),Math.floor(ro.y+ro.h-EPS-.001))),w:ro.w,h:CELULA};
  const vao=retInter(ro,c);if(!vao)return null;
  const pedacos=subtrai(ro,vao).map(q=>({...alvo,id:novoId('p'),...N(q,W,H)}));
  const novo=tipo==='porta'?{...objPorta(vao,tex('madeira'),W,H),erTipo:'porta',sombra:true}:{...objJanela(vao,W,H),erTipo:'janela',sombra:true};
  const M=L.filter(o=>o.id!==alvo.id);return [...M,...pedacos,...comOrdem(M,[novo])];
 }
 function fLuz(L,p,W,H,cor=luzCor,raio=luzRaio){const d=raio*2,r={x:p.x-d/2,y:p.y-d/2,w:d,h:d};
  return [...L,...comOrdem(L,[{id:novoId('luz'),nome:'Luz',forma:'circle',cor,bordaLargura:0,borda:'',opacity:.6,mascara:'radial-gradient(circle closest-side, #000 0%, rgba(0,0,0,.55) 45%, transparent 100%)',misturaV197:'screen',...N(r,W,H),angulo:0,camada:4,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,erTipo:'luz'}])];}
 function fTexto(L,p,texto,W,H){const w=Math.max(2,Math.min(14,texto.length*.55)),r={x:p.x-w/2,y:p.y-.6,w,h:1.2};
  return [...L,...comOrdem(L,[{id:novoId('txt'),nome:'Texto',forma:'rect',cor:'transparent',bordaLargura:0,textoV197:texto,tamTexto:14,...N(r,W,H),angulo:0,camada:6,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,erTipo:'texto'}])];}
 function fObj(L,m,q,W,H,giro){return [...L,...comOrdem(L,[{...objDoBanco(m,q,W,H,giro),erTipo:'objeto'}])];}
 // objeto do banco que combina com alguma das palavras ("mesa|cadeira")
 const achaObjeto=chaves=>{const ps=String(chaves).split('|').map(sem);const c=objetosBanco().filter(o=>ps.some(p=>sem((o.nome||'')+' '+o.id).includes(p)));const pr=o=>String(o.id).startsWith('rf_')?2:String(o.id).startsWith('bl_')?1:0;c.sort((a,b)=>pr(b)-pr(a)||String(a.nome||a.id).length-String(b.nome||b.id).length); return c[0]||null;}; // v203: entre as que combinam, a de nome mais simples ("Mesa", não "Mesa com cadeiras")
 // ---- modelos: carimba um trecho pronto no mapa (tudo num gesto só: um Ctrl+Z desfaz o modelo inteiro)
 function fModelo(L,m,ox,oy,W,H){
  let M=L;semAndarAuto=true;try{
  for(const [tipo,a,o] of m.ops){
   if(tipo==='porta'||tipo==='janela'){M=fVao(M,tipo,(o&&o.v)?{x:ox+a[0],y:oy+a[1]+.5}:{x:ox+a[0]+.5,y:oy+a[1]},W,H)||M;}
   else if(tipo==='parede'||tipo==='cerca'){M=fLinha(M,tipo,{x:ox+a[0],y:oy+a[1]},{x:ox+a[2],y:oy+a[3]},W,H,o||{})||M;}
   else if(tipo==='diagonal'){M=fDiagonal(M,{x:ox+a[0],y:oy+a[1]},{x:ox+a[2],y:oy+a[3]},W,H,o||{})||M;}
   else if(tipo==='obj'){const ob=achaObjeto(a);if(ob)M=fObj(M,ob,{x:ox+o[0],y:oy+o[1]},W,H,o[2]||0);}
   else M=fRet(M,tipo,{x:ox+a[0],y:oy+a[1],w:a[2],h:a[3]},W,H,o||{})||M;
  }
  }finally{semAndarAuto=false;}
  return M;
 }
 function opModelo(p){
  const m=MODELOS.find(x=>x.id===modeloSel);if(!m)return false;const {W,H}=dims();
  const ox=Math.max(0,Math.min(Math.floor(W-m.w),Math.floor(p.x-m.w/2))),oy=Math.max(0,Math.min(Math.floor(H-m.h),Math.floor(p.y-m.h/2)));
  if(m.w>W||m.h>H){aviso('O mapa é menor que este modelo ('+m.w+'×'+m.h+' m).');return false;}
  const ok=aplicar(L=>fModelo(L,m,ox,oy,W,H));if(ok)aviso('📋 '+m.nome+' posto. Ctrl+Z desfaz o modelo inteiro.');return ok;
 }
 // ---- ferramentas (usam o gesto do mouse)
 function opRetangulo(tipo,r){const {W,H}=dims();return aplicar(L=>fRet(L,tipo,r,W,H));}
 function opLinha(tipo,a,b){const {W,H}=dims();const ok=aplicar(L=>tipo==='diagonal'?fDiagonal(L,a,b,W,H):fLinha(L,tipo,a,b,W,H));if(!ok)aviso(tipo==='diagonal'?'Arraste na diagonal (45°) por pelo menos 1 quadrado.':'Arraste para fazer a linha.');return ok;}
 function opEspalhar(pts){
  if(!pts?.length)return false;const {W,H}=dims(),meta=ESTILOS_PINCEL.find(e=>e.id===pinc.estilo)||ESTILOS_PINCEL[0];
  const obj=objetoPincel(pts,{estilo:meta.id,cor:pinc.cor||meta.cor,tam:pinc.tam,dens:pinc.dens,seed:semente(),id:novoId('pinc'),W,H});
  return aplicar(L=>[...L,...comOrdem(L,[obj])]);
 }
 function opLivre(cels){const {W,H}=dims(),rs=juntaQuadrados([...cels].map(k=>{const [x,y]=k.split(',').map(Number);return {x,y};}));return aplicar(L=>fLivre(L,rs,W,H));}
 /* v201: apagador de um clique: a peça sob o mouse some inteira (com os blocos invisíveis dela); o chão do mapa não */
 function opApagarPeca(p){
  const R=rasc();if(!R)return false;const {W,H}=dims(),alvo=alvoEm(R.objetosAtuais().filter(x=>!ehChao(x,{W,H})),p,W,H);
  if(!alvo){aviso('Nada aqui para apagar.');return false;}
  const pai=alvo.colisaoV177?(R.objetosAtuais().find(x=>x.id===alvo.colisaoV177)||alvo):alvo,ids=new Set([pai.id,alvo.id]);
  const ok=aplicar(L=>{for(const x of L)if(x.colisaoV177===pai.id)ids.add(x.id);return L.filter(x=>!ids.has(x.id));});
  if(ok)aviso('🗑️ Apagou: '+(pai.nome||pai.erTipo||'peça')+'. Ctrl+Z desfaz.');return ok;
 }
 function opVao(tipo,p){const {W,H}=dims();const ok=aplicar(L=>fVao(L,tipo,p,W,H));if(!ok)aviso('Clique em cima de uma parede.');return ok;}
 function opPoco(p){const {W,H}=dims();return aplicar(L=>fPoco(L,p,W,H));}
 function opLuz(p){const {W,H}=dims();return aplicar(L=>fLuz(L,p,W,H));}
 function opTexto(p){const t=String(win.prompt('Texto da legenda:','')||'').trim();if(!t)return false;const {W,H}=dims();return aplicar(L=>fTexto(L,p,t.slice(0,80),W,H));}
 function opObjeto(p){
  const m=objetosBanco().find(o=>String(o.id)===objSel);if(!m)return false;const {W,H}=dims();
  return aplicar(L=>fObj(L,m,{x:Math.round(p.x*2)/2,y:Math.round(p.y*2)/2},W,H,rot));
 }
 const alvoEm=(L,p,W,H)=>{let m=null,am=1e9;for(const o of L){if(o.invisivelV161&&!o.colisaoV177)continue;if(andarDe(o)!==andar&&!o.andarAmbosV144)continue;const r=retDoObjeto(o,W,H);if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h){const a=r.w*r.h*(Number(o.camada)<=1?100:1);if(a<am){am=a;m=o;}}}return m;};
 function opContaGotas(p){
  const R=rasc();if(!R)return;const {W,H}=dims(),o=alvoEm(R.objetosAtuais(),p,W,H);if(!o){aviso('Nada aqui.');return;}
  if(o.erTipo==='parede'||ehParede(o)){ferr=o.erTipo==='caverna'?'caverna':o.erTipo==='cerca'?'cerca':o.erDiag?'diagonal':'parede';texParede=o.erTex||texParede;if(o.erEsp&&ferr!=='caverna'&&ferr!=='cerca')esp=o.erEsp;}
  else if(o.erTipo==='piso'||o.oficina3==='chao'){ferr='piso';texPiso=o.erTex||o.texturaId||texPiso;}
  else if(o.erTipo==='telhado'){ferr='telhado';texTelhado=o.erTex||texTelhado;}
  else if(o.erTipo==='copa'){ferr='copa';texCopa=o.erTex||texCopa;}
  else if(o.erTipo==='poca'){ferr='poca';poca=o.erPoca||poca;}
  else if(o.modeloId){ferr='objeto';objSel=String(o.modeloId);rot=Number(o.angulo)||0;}
  aviso('💧 Peguei: '+(o.nome||'peça'));desenharPainel();
 }

 // ------------------------------------------------------------ mapa novo, do zero
 async function criarMapa(nome,w,h,pisoId){
  const api=win.mesaMapasV110_;if(!api?.salvar)throw Error('Ainda carregando os mapas; tente de novo em instantes.');
  nome=String(nome||'').trim();if(!nome)throw Error('Dê um nome ao mapa.');
  w=Math.max(8,Math.min(120,Math.round(Number(w)||40)));h=Math.max(8,Math.min(120,Math.round(Number(h)||26)));
  const state={w,h,ppm:40,bg:'#3a3530',texture:'nenhuma',showGrid:false,grid:'#777777',name:nome,formatoObjetos:'refs-v1',elements:[],editorRapidoV197:true};
  const r=await api.salvar({nome,state,cenaDe:id=>{const c=cenaDoEstado(state,id);
   if(pisoId)c.objects=[...(c.objects||[]),{...objChao({x:0,y:0,w,h},tex(pisoId),w,h),nome:'Chão do mapa',erTipo:'piso',erTex:pisoId,ordemOficina:1}];
   return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
  const id=String(r?.id||'');if(!id)throw Error('o mapa não voltou com id');
  await ctl()?.openMap?.(id);return id;
 }
 /* ---- 🗺️ gerador de mapas: masmorra, cidade e exterior (MapForge). Gera o PLANO, mostra a prévia e só então cria o mapa/rascunho */
 async function aplicarPlanoNoMapa(pl,destino,nome){
  let alvo=destino==='novo'?await criarMapa(nome||'Mapa gerado',pl.W,pl.H,''):mapa();
  if(destino==='novo'){for(let i=0;i<60&&!(rasc()&&String(mapa())===String(alvo));i++)await new Promise(r=>setTimeout(r,100));}
  if(destino==='novo'&&String(mapa())!==String(alvo))throw Error('O mapa novo foi criado, mas ainda não abriu. Abra-o em Mapas e use "Pôr no mapa atual".');
  const R=rasc();if(!R)throw Error('Abra o mapa como mestre para gerar.');
  const {W,H}=dims(),a0=andar;andar=1;let ok=false;
  try{ok=aplicar(L=>fPlano(L,pl,W,H));}finally{andar=a0;}
  if(!ok)throw Error('Nada foi gerado.');
  return {W,H};
 }
 function abrirGerador(){
  const R0=win.mesaRascunhoMapaV193;if(!rasc()){aviso('Abra um mapa como mestre para usar o gerador.');return;}
  root.getElementById('erGerador')?.remove();
  const d=root.createElement('div');d.id='erGerador';d.setAttribute('role','dialog');d.setAttribute('aria-label','Gerador de mapas');
  d.style.cssText='position:fixed;inset:0;z-index:10010;background:rgba(0,0,0,.62);display:grid;place-items:center';
  const sel=(k,l)=>`<select data-g="${k}" style="width:100%;padding:6px;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px">${l.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('')}</select>`;
  const num=(k,v,mn,mx)=>`<input data-g="${k}" type="number" min="${mn}" max="${mx}" value="${v}" style="width:100%;box-sizing:border-box;padding:6px;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px">`;
  const rot=t=>`<label style="display:block;font-size:12px;opacity:.85;margin:7px 0 2px">${t}</label>`;
  d.innerHTML='<div style="background:#140f0a;border:2px solid #b4491f;border-radius:12px;padding:14px;width:min(860px,96vw);max-height:94vh;overflow:auto;color:#ffe2c8;font:13px Segoe UI,Arial,sans-serif">'+
   '<h3 style="margin:0 0 8px;color:#ffb04a">🗺️ Gerador de mapas <small style="opacity:.7;font-weight:400">(MapForge)</small></h3>'+
   '<div style="display:flex;gap:14px;flex-wrap:wrap"><div style="flex:1 1 280px;min-width:260px">'+
   rot('Tipo')+sel('tipo',TIPOS)+rot('Estilo')+sel('estilo',ESTILOS)+'<div data-bioma>'+rot('Bioma')+sel('bioma',BIOMAS)+'</div>'+
   '<div style="display:flex;gap:8px"><div style="flex:1">'+rot('Largura (m)')+num('w',48,16,120)+'</div><div style="flex:1">'+rot('Altura (m)')+num('h',32,16,120)+'</div></div>'+
   '<div style="display:flex;gap:8px"><div style="flex:1">'+rot('Densidade')+'<input data-g="dens" type="range" min="10" max="100" value="50" style="width:100%"></div><div style="flex:1" data-comp>'+rot('Complexidade')+'<input data-g="comp" type="range" min="10" max="100" value="60" style="width:100%"></div></div>'+
   '<div data-espblk>'+rot('Grossura das paredes')+sel('esp',ESP_OPCOES)+'<input data-g="espnum" type="number" min="0.1" max="6" step="0.05" value="0.6" placeholder="metros" hidden style="width:100%;box-sizing:border-box;margin-top:4px;padding:6px;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px"></div>'+rot('Conservação')+sel('cons',[['novo','Novo'],['usado','Usado'],['abandonado','Abandonado'],['arruinado','Arruinado']])+
   rot('Semente (vazio = sorteia; repita o número para gerar o mesmo mapa)')+'<input data-g="seed" type="text" placeholder="ex.: 4242" style="width:100%;box-sizing:border-box;padding:6px;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px">'+
   '<div style="display:flex;gap:8px;margin-top:10px"><button type="button" data-gerar style="flex:1;padding:8px;background:#6a2e10;color:#fff;border:1px solid #ff9a4a;border-radius:8px;cursor:pointer;font-weight:700">🎲 Gerar prévia</button></div></div>'+
   '<div style="flex:1.4 1 380px;min-width:300px"><canvas data-pv width="460" height="330" style="width:100%;background:#0b0806;border:1px solid #5a2a14;border-radius:8px"></canvas><div data-info style="min-height:38px;margin-top:6px;font-size:12px;color:#ffd9a0">Escolha as opções e clique em Gerar prévia.</div></div></div>'+
   '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #4a2a14"><label style="margin-right:12px"><input type="radio" name="erGdest" value="novo" checked> Criar um mapa novo com isso</label><label><input type="radio" name="erGdest" value="atual"> Pôr no mapa atual (rascunho)</label>'+
   '<div data-nome style="margin-top:6px">'+rot('Nome do mapa novo')+'<input data-g="nome" type="text" value="Mapa gerado" style="width:100%;box-sizing:border-box;padding:6px;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px"></div></div>'+
   '<div data-st style="min-height:18px;margin:8px 0 0;color:#ffb04a"></div><div style="display:flex;gap:8px;margin-top:6px"><button type="button" data-ok disabled style="flex:1;padding:8px;background:#2d5a2d;color:#fff;border:1px solid #7fe08a;border-radius:8px;cursor:pointer;font-weight:700">✔ Usar este mapa</button><button type="button" data-x style="padding:8px 14px;background:#2a1408;color:#ffe2c8;border:1px solid #8a3a18;border-radius:8px;cursor:pointer">Cancelar</button></div></div>';
  root.body.append(d);
  const q=x=>d.querySelector(x),g=k=>d.querySelector('[data-g="'+k+'"]'),st=t=>{q('[data-st]').textContent=t;};let plano=null,ocupado=false;
  d.addEventListener('pointerdown',e=>e.stopPropagation());d.addEventListener('click',e=>{if(e.target===d)d.remove();});q('[data-x]').addEventListener('click',()=>d.remove());
  const dest=()=>d.querySelector('input[name="erGdest"]:checked')?.value||'novo';
  const visivel=()=>{const t=g('tipo').value;q('[data-bioma]').style.display=t==='exterior'?'':'none';q('[data-comp]').style.display=t==='masmorra'||t==='caverna'?'':'none';q('[data-espblk]').style.display=t==='masmorra'||t==='cidade'?'':'none';g('espnum').hidden=g('esp').value!=='custom';q('[data-nome]').style.display=dest()==='novo'?'':'none';};
  g('esp').addEventListener('change',visivel);g('tipo').addEventListener('change',()=>{const [w,h]=TAMANHO_PADRAO[g('tipo').value];g('w').value=w;g('h').value=h;plano=null;q('[data-ok]').disabled=true;visivel();});
  d.querySelectorAll('input[name="erGdest"]').forEach(r=>r.addEventListener('change',visivel));visivel();
  const op=()=>({tipo:g('tipo').value,estilo:g('estilo').value,bioma:g('bioma').value,w:Number(g('w').value),h:Number(g('h').value),densidade:Number(g('dens').value)/100,complexidade:Number(g('comp').value)/100,conservacao:g('cons').value,seed:g('seed').value,espessura:g('esp').value==='custom'?Number(g('espnum').value):Number(g('esp').value)||0});
  q('[data-gerar]').addEventListener('click',async()=>{if(ocupado)return;ocupado=true;q('[data-ok]').disabled=true;st('Gerando…');
   try{plano=await gerarPlano(op());desenharPreviaPlano(q('[data-pv]'),plano);
    const s=plano.stats||{};q('[data-info]').innerHTML=`<b>${esc(plano.rotulo||'')}</b> · ${plano.W}×${plano.H} m · semente <b>${plano.seed}</b><br>${esc(plano.nota||'')} · ${s.total||0} peças${(plano.avisos||[]).map(a=>'<br>⚠️ '+esc(a)).join('')}`;
    g('seed').placeholder=String(plano.seed);st('');q('[data-ok]').disabled=false;}
   catch(err){console.warn('[Gerador de mapas]',err);st('⚠️ '+(err?.message||err));}finally{ocupado=false;}});
  q('[data-ok]').addEventListener('click',async()=>{if(!plano||ocupado)return;ocupado=true;q('[data-ok]').disabled=true;st('Montando o mapa…');
   try{const r=await aplicarPlanoNoMapa(plano,dest(),g('nome').value);d.remove();ferr=ferr||'parede';
    aviso('🗺️ Mapa gerado como RASCUNHO ('+(plano.stats?.total||0)+' peças). Confira e clique em 💾 Salvar mapa; Ctrl+Z desfaz tudo.'+((plano.faltou||[]).length?' Sem objeto para: '+plano.faltou.join(', ')+'.':''));
    if(plano.W>r.W||plano.H>r.H)aviso('🗺️ O mapa atual é menor ('+r.W+'×'+r.H+' m) que o gerado ('+plano.W+'×'+plano.H+'): o que passou da borda ficou de fora.');desenharPainel();}
   catch(err){console.warn('[Gerador de mapas]',err);st('⚠️ '+(err?.message||err));q('[data-ok]').disabled=false;}finally{ocupado=false;}});
 }
 function abrirNovo(){
  const R=win.mesaRascunhoMapaV193;if(R?.pendentes&&!win.confirm('Há '+R.pendentes+' alteração(ões) não salvas neste mapa. Descartar e criar um mapa novo?'))return;
  root.getElementById('erNovo')?.remove();
  const d=root.createElement('div');d.id='erNovo';d.setAttribute('role','dialog');d.setAttribute('aria-label','Mapa novo');
  d.style.cssText='position:fixed;inset:0;z-index:10010;background:rgba(0,0,0,.6);display:grid;place-items:center';
  d.innerHTML='<div style="background:#140f0a;border:2px solid #b4491f;border-radius:12px;padding:16px;width:min(340px,92vw);color:#ffe2c8;font:13px Segoe UI,Arial,sans-serif"><h3 style="margin:0 0 10px;color:#ffb04a">🆕 Mapa novo, do zero</h3>'+
   '<label style="display:block;margin:6px 0 2px">Nome</label><input data-n type="text" placeholder="ex.: Cidade Baixa — bairro" style="width:100%;box-sizing:border-box;padding:6px;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px">'+
   '<div style="display:flex;gap:8px;margin-top:8px"><label style="flex:1">Largura (m)<input data-w type="number" min="8" max="120" value="40" style="width:100%;box-sizing:border-box;padding:6px;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px"></label><label style="flex:1">Altura (m)<input data-h type="number" min="8" max="120" value="26" style="width:100%;box-sizing:border-box;padding:6px;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px"></label></div>'+
   '<label style="display:block;margin:8px 0 2px">Piso de fundo</label><select data-p style="width:100%;padding:6px;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px"><option value="">Nenhum (escuro)</option>'+TEXTURAS_BASE.filter(t=>t.id!=='agua').map(t=>'<option value="'+t.id+'"'+(t.id==='terra'?' selected':'')+'>'+esc(t.nome)+'</option>').join('')+'</select>'+
   '<div data-st style="min-height:18px;margin:8px 0 0;color:#ffb04a"></div><div style="display:flex;gap:8px;margin-top:6px"><button type="button" data-ok style="flex:1;padding:8px;background:#2d5a2d;color:#fff;border:1px solid #7fe08a;border-radius:8px;cursor:pointer;font-weight:700">Criar mapa</button><button type="button" data-no style="padding:8px 12px;background:#3a1a0c;color:#ffe2c8;border:1px solid #8a3a18;border-radius:8px;cursor:pointer">Cancelar</button></div></div>';
  root.body.append(d);const q=x=>d.querySelector(x),st=t=>{q('[data-st]').textContent=t;};
  d.addEventListener('pointerdown',e=>e.stopPropagation());d.addEventListener('click',e=>{if(e.target===d)d.remove();});
  q('[data-no]').addEventListener('click',()=>d.remove());
  q('[data-ok]').addEventListener('click',async()=>{const b=q('[data-ok]');b.disabled=true;st('⏳ Criando…');
   try{const id=await criarMapa(q('[data-n]').value,q('[data-w]').value,q('[data-h]').value,q('[data-p]').value);d.remove();ferr=ferr||'parede';aviso('✅ Mapa criado e aberto. Escolha uma ferramenta e desenhe.');desenharPainel();return id;}
   catch(err){st('⚠️ '+(err?.message||err));b.disabled=false;}});
  q('[data-n]').focus();
 }

 // ------------------------------------------------------------ ponteiro
 const ponto=e=>{const b=el('novaSyncBoard'),r=b.getBoundingClientRect(),{W,H}=dims();return {x:Math.max(0,Math.min(W,(e.clientX-r.left)/r.width*W)),y:Math.max(0,Math.min(H,(e.clientY-r.top)/r.height*H))};};
 const noMapa=e=>{const b=el('novaSyncBoard');return !!b&&b.contains(e.target)&&!painel?.contains(e.target)&&!e.target.closest?.('#camZoom');};
 const tipoRet=()=>({parede:'parede',comodo:'comodo',tirar_area:'tirar_area',tirar_bloco:'tirar_bloco',borracha:'borracha',piso:'piso',poca:'poca',telhado:'telhado',copa:'copa',escada:'escada',rampa:'rampa',cordilheira:'cordilheira',caverna_nat:'caverna_nat'}[ferr]||'');
 function garantirPrevia(){const b=el('novaSyncBoard');if(!b)return null;if(!previa||previa.parentElement!==b){previa?.remove();previa=root.createElementNS('http://www.w3.org/2000/svg','svg');previa.id='erPrevia';previa.setAttribute('preserveAspectRatio','none');previa.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:44;overflow:visible';b.append(previa);}
  const {W,H}=dims();previa.setAttribute('viewBox','0 0 '+W+' '+H);return previa;}
 const limparPrevia=()=>{if(previa)previa.innerHTML='';};
 function corFerr(){return {diagonal:'#ff9a4a',cerca:'#d9b36a',caverna:'#ff9a4a',caverna_nat:'#c8a070',cordilheira:'#b8a07a',luz:'#ffd27a',texto:'#fff',modelo:'#ffb86b',parede:'#ff9a4a',comodo:'#ffb86b',apagar_peca:'#ff6b6b',tirar_area:'#ff6b6b',tirar_bloco:'#ff6b6b',borracha:'#ff6b6b',piso:'#7ee0a0',telhado:'#c8642e',copa:'#3aa84a',chao:'#d9b36a',escada:'#d9b36a',rampa:'#d9b36a',poco:'#6ab8ff',poca:'#6ab8ff',porta:'#ffd447',janela:'#9fd3ff',objeto:'#ffb86b',conta_gotas:'#fff',mover:'#fff'}[ferr]||'#fff';}
 function desenharPrevia(p){
  const s=garantirPrevia();if(!s)return;const {W,H}=dims();let h='';const cor=corFerr();
  if(arrasto?.tipo==='ret'){const r=retDeQuadrados(arrasto.a,arrasto.b,W,H);if(r)h+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${cor}33" stroke="${cor}" stroke-width=".07"/>`;
   if(r&&ferr==='comodo'){const c=contornoFino(r,esp);for(const q of c.paredes)h+=`<rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" fill="${cor}" opacity=".85"/>`;}}
  else if(arrasto?.tipo==='linha'){if(ferr==='diagonal'){const pd=pontosDiagonal(arrasto.a,arrasto.b,W,H);if(pd)h+=`<line x1="${pd.a.x}" y1="${pd.a.y}" x2="${pd.b.x}" y2="${pd.b.y}" stroke="${cor}" stroke-width="${esp}" stroke-linecap="butt" opacity=".85"/>`;}else{const e=ferr==='cerca'?.15:esp,r=retDeLinha(arrasto.a,arrasto.b,e,W,H);if(r)h+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${cor}" opacity=".85"/>`;}}
  else if(arrasto?.tipo==='espalhar'){const meta=ESTILOS_PINCEL.find(e=>e.id===pinc.estilo)||ESTILOS_PINCEL[0],c=pinc.cor||meta.cor;h+=`<polyline points="${arrasto.pts.map(q=>q[0]+','+q[1]).join(' ')}" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="${pinc.tam}" stroke-linecap="round" stroke-linejoin="round"/>`;}
  else if(p&&ferr==='espalhar'){const meta=ESTILOS_PINCEL.find(e=>e.id===pinc.estilo)||ESTILOS_PINCEL[0],c=pinc.cor||meta.cor;h+=`<circle cx="${p.x}" cy="${p.y}" r="${pinc.tam/2}" fill="${c}33" stroke="${c}" stroke-width=".06" stroke-dasharray=".25 .15"/>`;}
  else if(arrasto?.tipo==='livre'){for(const k of arrasto.cels){const [x,y]=k.split(',').map(Number);h+=`<rect x="${x*CELULA}" y="${y*CELULA}" width="${CELULA}" height="${CELULA}" fill="#ff9a4a55" stroke="#ff9a4a" stroke-width=".05"/>`;}}
  else if(arrasto?.tipo==='mover'&&arrasto.obj){const o=arrasto.obj,r=retDoObjeto(o,W,H);h+=`<rect x="${r.x+arrasto.dx}" y="${r.y+arrasto.dy}" width="${r.w}" height="${r.h}" fill="#ffffff22" stroke="#fff" stroke-width=".07" stroke-dasharray=".2 .15"/>`;}
  else if(p&&ferr==='objeto'&&objSel){const m=objetosBanco().find(o=>String(o.id)===objSel);if(m){const w=Number(m.larguraM)||1,hh=Number(m.alturaM)||1,x=Math.round(p.x*2)/2,y=Math.round(p.y*2)/2;
    h+=`<g transform="rotate(${rot} ${x} ${y})"><rect x="${x-w/2}" y="${y-hh/2}" width="${w}" height="${hh}" fill="#ffb86b22" stroke="#ffb86b" stroke-width=".05"/><image href="${esc(m.imagem)}" x="${x-w/2}" y="${y-hh/2}" width="${w}" height="${hh}" preserveAspectRatio="none" opacity=".75"/></g>`;}}
  else if(p&&(ferr==='mover'||ferr==='apagar_peca')){const R=rasc();if(R){const o=alvoEm(R.objetosAtuais().filter(x=>!ehChao(x,{W,H})),p,W,H);if(o){const r=retDoObjeto(o,W,H);{const cc=ferr==='apagar_peca'?'#ff6b6b':'#fff';h+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${cc}22" stroke="${cc}" stroke-width=".08" stroke-dasharray=".25 .15"/>`;}}}}
  else if(p&&ferr==='luz'){h+=`<circle cx="${p.x}" cy="${p.y}" r="${luzRaio}" fill="${luzCor}22" stroke="${luzCor}" stroke-width=".06" stroke-dasharray=".3 .2"/>`;}
  else if(p&&ferr==='modelo'&&modeloSel){const m=MODELOS.find(x=>x.id===modeloSel);if(m){const ox=Math.max(0,Math.min(Math.floor(W-m.w),Math.floor(p.x-m.w/2))),oy=Math.max(0,Math.min(Math.floor(H-m.h),Math.floor(p.y-m.h/2)));h+=`<rect x="${ox}" y="${oy}" width="${m.w}" height="${m.h}" fill="#ffb86b22" stroke="#ffb86b" stroke-width=".08" stroke-dasharray=".3 .2"/>`;}}
  else if(p&&['parede','cerca','diagonal'].includes(ferr)){h+=`<circle cx="${rd(p.x)}" cy="${rd(p.y)}" r=".14" fill="${cor}"/>`;}
  else if(p&&ferr){const x=Math.floor(p.x/CELULA)*CELULA,y=Math.floor(p.y/CELULA)*CELULA;h+=`<rect x="${x}" y="${y}" width="${CELULA}" height="${CELULA}" fill="${cor}22" stroke="${cor}" stroke-width=".06"/>`;}
  s.innerHTML=h;
 }
 function ferrAtiva(e){return aberto&&(ferr||e.altKey||e.button===2);}
 let espaco=false;
 root.addEventListener('keydown',e=>{if(e.code==='Space')espaco=true;},true);root.addEventListener('keyup',e=>{if(e.code==='Space')espaco=false;},true);
 root.addEventListener('pointerdown',e=>{
  if(!aberto||!noMapa(e)||!ehMestre())return;if(e.button===1||espaco)return; // botão do meio / Espaço: é a câmera (mover o mapa ampliado)
  if(!e.altKey&&e.button===0&&e.target.closest?.('[data-token]'))return; // v201: clicar numa miniatura continua selecionando (balão de comportamento) e arrastando, com qualquer ferramenta
  const {W,H}=dims(),p=ponto(e);
  if(e.altKey&&e.button===0){ // Alt+clique: pega e move; Ctrl+Alt: duplica
   const R=rasc();if(!R)return;const o=alvoEm(R.objetosAtuais().filter(x=>!ehChao(x,{W,H})),p,W,H);if(!o)return; // v200: o chão não se pega
   e.preventDefault();e.stopPropagation();arrasto={tipo:'mover',id:pointerId(e),a:p,obj:o,dx:0,dy:0,copia:!!e.ctrlKey};return;}
  if(e.button===2){e.preventDefault();e.stopPropagation();arrasto={tipo:'livre',id:pointerId(e),ult:p,cels:new Set()};celsPincel(arrasto.cels,Math.floor(p.x/CELULA),Math.floor(p.y/CELULA));desenharPrevia(p);return;}
  if(e.button!==0||!ferr)return;
  e.preventDefault();e.stopPropagation();
  if(['parede','cerca','diagonal'].includes(ferr)){arrasto={tipo:'linha',id:pointerId(e),a:p,b:p};desenharPrevia(p);return;}
  if(ferr==='espalhar'){arrasto={tipo:'espalhar',id:pointerId(e),pts:[[p.x,p.y]]};desenharPrevia(p);return;}
  if(['caverna','caverna_nat','cordilheira','comodo','tirar_area','tirar_bloco','borracha','piso','poca','telhado','copa','escada','rampa'].includes(ferr)){arrasto={tipo:'ret',id:pointerId(e),a:p,b:p};desenharPrevia(p);return;}
  if(ferr==='porta'||ferr==='janela'){opVao(ferr,p);return;}
  if(ferr==='objeto'){opObjeto(p);return;}
  if(ferr==='poco'){opPoco(p);return;}
  if(ferr==='mover'){const R=rasc();if(!R)return;const o=alvoEm(R.objetosAtuais().filter(x=>!ehChao(x,{W,H})),p,W,H);if(!o){aviso('Clique em cima de uma peça para arrastar.');return;}arrasto={tipo:'mover',id:pointerId(e),a:p,obj:o,dx:0,dy:0,copia:!!e.ctrlKey};desenharPrevia(p);return;}
  if(ferr==='apagar_peca'){opApagarPeca(p);return;}
  if(ferr==='conta_gotas'){opContaGotas(p);return;}
  if(ferr==='modelo'){opModelo(p);return;}
  if(ferr==='luz'){opLuz(p);return;}
  if(ferr==='texto'){opTexto(p);return;}
 },true);
 const pointerId=e=>e.pointerId;
 /* pincel de rocha de 1 a 6 m: um disco de quadrados em volta do ponto */
 function celsPincel(set,cx,cy){const sz=Math.max(1,Math.round(terr.pincel)),{W,H}=dims(),ini=-Math.floor((sz-1)/2);for(let i=0;i<sz;i++)for(let j=0;j<sz;j++){if(sz>2&&Math.hypot(i-(sz-1)/2,j-(sz-1)/2)>sz/2)continue;const x=cx+ini+i,y=cy+ini+j;if(x>=0&&y>=0&&x<Math.ceil(W/CELULA)&&y<Math.ceil(H/CELULA))set.add(x+','+y);}}
 root.addEventListener('pointermove',e=>{
  if(!aberto||!ehMestre())return;const b=el('novaSyncBoard');if(!b)return;
  if(arrasto&&e.pointerId===arrasto.id){e.preventDefault();const p=ponto(e);
   if(arrasto.tipo==='ret'||arrasto.tipo==='linha')arrasto.b=p;
   else if(arrasto.tipo==='livre'){const u=arrasto.ult||p,d=Math.hypot(p.x-u.x,p.y-u.y),n=Math.max(1,Math.ceil(d/(CELULA*.25)));for(let i=1;i<=n;i++)celsPincel(arrasto.cels,Math.floor((u.x+(p.x-u.x)*i/n)/CELULA),Math.floor((u.y+(p.y-u.y)*i/n)/CELULA));arrasto.ult=p;} // preenche os quadrados entre dois pontos do mouse (arrasto rápido)
   else if(arrasto.tipo==='espalhar'){const u=arrasto.pts[arrasto.pts.length-1];if(Math.hypot(p.x-u[0],p.y-u[1])>=.2&&arrasto.pts.length<900)arrasto.pts.push([p.x,p.y]);}
   else if(arrasto.tipo==='mover'){const q=(arrasto.obj?.grupoV201||arrasto.obj?.colisaoV177)?1:2;arrasto.dx=Math.round((p.x-arrasto.a.x)*q)/q;arrasto.dy=Math.round((p.y-arrasto.a.y)*q)/q;}
   desenharPrevia(p);return;}
  if(noMapa(e))desenharPrevia(ponto(e));else if(!arrasto)limparPrevia();
 },true);
 root.addEventListener('pointerup',e=>{
  if(!arrasto||e.pointerId!==arrasto.id)return;e.preventDefault();e.stopPropagation();const a=arrasto;arrasto=null;limparPrevia();
  const {W,H}=dims();
  if(a.tipo==='ret'){const r=retDeQuadrados(a.a,a.b,W,H);if(r)opRetangulo(ferr,r);}
  else if(a.tipo==='linha')opLinha(ferr,a.a,a.b);
  else if(a.tipo==='livre')opLivre(a.cels);
  else if(a.tipo==='espalhar')opEspalhar(a.pts);
  else if(a.tipo==='mover'&&(a.dx||a.dy)){
   aplicar(L=>{const ox=a.dx*28/W,oy=a.dy*14/H;
    const ids=grupoDoTerreno(L,a.obj);
    if(a.copia){if(ids.size>1){aviso('Terreno natural não duplica: gere outro (ou use Ctrl+Z).');return null;}const c={...a.obj,id:novoId('c'),x:+(a.obj.x+ox).toFixed(4),y:+(a.obj.y+oy).toFixed(4)};return [...L,...comOrdem(L,[c])];}
    return L.map(o=>ids.has(o.id)?{...o,x:+(o.x+ox).toFixed(4),y:+(o.y+oy).toFixed(4),...(o.baseV201?{baseV201:[+(o.baseV201[0]+a.dx).toFixed(2),+(o.baseV201[1]+a.dy).toFixed(2)]}:{}),...(o.rectsV201?{rectsV201:o.rectsV201.map(([x,y,w,h])=>[x+a.dx,y+a.dy,w,h]),blocosV201:(o.blocosV201||[]).map(([x,y,w,h])=>[x+a.dx,y+a.dy,w,h])}:{})}:o);});}
  else if(a.tipo==='mover'&&a.copia)aviso('Arraste para pôr a cópia em outro lugar.');
 },true);
 root.addEventListener('contextmenu',e=>{if(aberto&&noMapa(e)&&ehMestre())e.preventDefault();},true);
 root.addEventListener('click',e=>{if(aberto&&ferr&&noMapa(e)){e.stopPropagation();e.preventDefault();}},true);
 root.addEventListener('wheel',e=>{if(!aberto||ferr!=='objeto'||e.ctrlKey||!noMapa(e))return;e.preventDefault();rot=(rot+(e.deltaY>0?90:270))%360;desenharPrevia(ponto(e));},{passive:false});
 root.addEventListener('keydown',e=>{
  if(!aberto||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')||e.target?.isContentEditable)return;
  const k=String(e.key||'').toLowerCase();let usou=true;
  if((e.ctrlKey||e.metaKey)&&k==='z'&&!e.shiftKey)rasc()?.desfazerLote();
  else if((e.ctrlKey||e.metaKey)&&(k==='y'||(k==='z'&&e.shiftKey)))rasc()?.refazerLote();
  else if(e.ctrlKey||e.metaKey||e.altKey)usou=false;
  else if(k==='r'&&ferr==='objeto'){rot=(rot+90)%360;}
  else if(k==='escape'){if(arrasto){arrasto=null;limparPrevia();}else if(ferr){ferr='';}else fechar();}
  else usou=false;
  if(usou){e.preventDefault();desenharPainel();}
 },true);

 // ------------------------------------------------------------ painel
 const ESTILO_TERRENO=`
#o3Botao,#o3Painel{display:none!important}
#erPainel .er-sair{width:100%;box-sizing:border-box;margin:2px 0 4px;padding:6px 4px;border:1px solid #ffb86b;border-radius:8px;background:#3a2210;color:#ffe2bf;font-weight:700;cursor:pointer}
#erPainel .er-sair:hover{background:#4c2e14}
#novaSyncBoard.er-mover{cursor:grab!important}
#novaSyncBoard.er-mover:active{cursor:grabbing!important}
.er-terreno{margin:4px 0 6px;padding:5px 6px;border:1px solid #5a2a14;border-radius:8px;background:#1b0f08}
.er-terreno h5{margin:0 0 4px}
.er-ter-l,.er-ter-c{display:block;font-size:11px;margin:4px 0}
.er-ter-l b{float:right;color:#ffd9a0}
.er-ter-l input[type=range]{width:100%;display:block}
.er-ter-l select,.er-ter-l2 select{width:100%;box-sizing:border-box;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px;padding:3px;font-size:11px}
.er-ter-l2{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;margin:4px 0}
.er-ter-l2 label{display:block}
.er-ter-l input[type=number]{background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px;padding:2px 4px}
`;
const ESTILO=`
#erBotao{border-radius:999px;border:1px solid #ff9a4a;background:#2a1408;color:#ffe2c8;padding:6px 12px;font:600 13px 'Segoe UI',Arial,sans-serif;cursor:pointer}
/* editores antigos (Oficina 3.0 com pincéis/carimbos/formas, marcador, gerador, lápis/formas do 🛠️) ficam escondidos até ligar "🧰 Antigos"; o código continua todo aqui */
body:not(.er-antigos) #o3Botao,body:not(.er-antigos) #mkBotao,body:not(.er-antigos) #mgBotao,body:not(.er-antigos) #novaOficinaPanel,body:not(.er-antigos) #mbBarra [data-a="editar"]{display:none!important}
#erAntigos{border-radius:999px;border:1px solid #7a6a58;background:#1c1610;color:#d9c8b0;padding:6px 12px;font:600 13px 'Segoe UI',Arial,sans-serif;cursor:pointer}
#erAntigos[aria-pressed="true"]{background:#4a3a28;box-shadow:0 0 0 2px #c9a46a66}
#erPainel .er-andar{display:flex;align-items:center;gap:4px;margin:6px 0 2px}#erPainel .er-andar span{font:600 12px 'Segoe UI',Arial,sans-serif;margin-right:4px}#erPainel .er-andar button{flex:1;padding:4px 0;border-radius:7px;border:1px solid #8a3a18;background:#1f120a;color:#ffe2c8;cursor:pointer;font:600 12px 'Segoe UI',Arial,sans-serif}#erPainel .er-andar button[aria-pressed="true"]{background:#6a2e10;border-color:#ff9a4a}
#erPainel .er-chao{display:flex;align-items:center;gap:6px;width:100%;margin:6px 0 0;padding:5px 8px;border-radius:8px;border:1px solid #ff9a4a;background:#2a1408;color:#ffe2c8;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;text-align:left}
#erPainel .er-nota{font:10.5px 'Segoe UI',Arial,sans-serif;opacity:.78;margin:2px 4px 4px}#erPainel .er-h-andar{margin:6px 0 0}
#erPainel .er-slots{display:flex;align-items:stretch;gap:4px}#erPainel .er-slots i{align-self:center;font-style:normal}#erPainel .er-slots button{flex:1;display:grid;justify-items:center;gap:2px;padding:4px 2px;border-radius:8px;border:1px solid #8a3a18;background:#1f120a;color:#ffe2c8;cursor:pointer;font:600 11px 'Segoe UI',Arial,sans-serif}#erPainel .er-slots button[aria-pressed="true"]{background:#6a2e10;border-color:#ff9a4a}#erPainel .er-slots small{font-weight:400;opacity:.85;font-size:10px}
#erPainel .er-comodo{margin:6px 0;padding:6px;border:1px solid #ff9a4a;border-radius:8px;background:#2a1408;font:12px 'Segoe UI',Arial,sans-serif}#erPainel .er-comodo>div{display:flex;align-items:center;gap:6px;margin:4px 0}#erPainel .er-comodo i{font-style:normal;opacity:.8}#erPainel .er-mini{display:inline-block;width:26px;height:26px;border-radius:5px;border:1px solid #ffb86b;background-size:cover}#erPainel .er-comodo small{opacity:.8}
#erBotao[aria-pressed="true"]{background:#6a2e10;box-shadow:0 0 0 2px #ff9a4a66}
#erPainel{position:absolute;left:8px;top:8px;bottom:8px;width:190px;z-index:33;display:flex;flex-direction:column;background:rgba(14,10,8,.94);border:2px solid #b4491f;border-radius:10px;color:#ffe2c8;font:12px 'Segoe UI',Arial,sans-serif;box-shadow:0 8px 24px #000a}
#erPainel[hidden]{display:none}
#erPainel .er-topo{display:flex;gap:4px;padding:5px;border-bottom:1px solid #5a2a12;flex-wrap:wrap}
#erPainel button{cursor:pointer;color:#ffe2c8;background:#3a1a0c;border:1px solid #8a3a18;border-radius:7px}
#erPainel .er-topo button{padding:4px 7px;font-size:13px}
#erPainel .er-topo button:disabled{opacity:.4;cursor:default}
#erPainel .er-salvar{flex:1 1 100%;background:#2d5a2d!important;border-color:#7fe08a!important;font-weight:700;padding:5px!important}
#erPainel .er-corpo{overflow:auto;padding:4px 6px 8px;flex:1}
#erPainel h5{margin:8px 0 4px;text-align:center;color:#ffb04a;font:700 12px 'Segoe UI',Arial,sans-serif;letter-spacing:.04em}
#erPainel .er-g{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
#erPainel .er-g button{aspect-ratio:1;font-size:20px;padding:0;position:relative;display:grid;place-items:center;background-size:cover;background-position:center}
#erPainel [aria-pressed="true"]{outline:2px solid #ffd447;background-color:#6a2e10}
#erPainel .er-g button small{position:absolute;left:0;right:0;bottom:0;font-size:9px;background:#000a;border-radius:0 0 6px 6px;line-height:1.3}
#erPainel .er-sw{background-size:cover;background-position:center}
#erPainel input[type=search]{width:100%;box-sizing:border-box;margin:3px 0;background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px;padding:4px}
#erPainel .er-cats{display:flex;flex-wrap:wrap;gap:3px;margin:3px 0}#erPainel .er-cats button{padding:2px 6px;font-size:10.5px}
#erPainel .er-obj{grid-template-columns:repeat(3,1fr)}#erPainel .er-obj button{font-size:10px;background-size:contain;background-repeat:no-repeat;background-position:center 30%;background-color:#1f120a;align-content:end}
#erDicas{position:absolute;left:206px;right:8px;bottom:8px;z-index:33;padding:6px 10px;background:rgba(14,10,8,.9);border:1px solid #8a3a18;border-radius:9px;color:#ffe2c8;font:12px 'Segoe UI',Arial,sans-serif;pointer-events:none}
#erDicas kbd{background:#3a1a0c;border:1px solid #b4491f;border-radius:4px;padding:0 5px;margin:0 2px}
#erDicas[hidden]{display:none}
#novaSyncBoard.er-ativa{cursor:crosshair}`;
 const aviso=t=>{msg=t;if(dicas){dicas.innerHTML=textoDicas();}};
 function dicaDa(){const f=FERRAMENTAS.flatMap(s=>s[1]).find(x=>x[0]===ferr);return f?f[3]:ferr==='piso'?'Arraste um retângulo para pôr o piso escolhido.':ferr==='poca'?'Arraste um retângulo de poça.':'Escolha uma ferramenta na paleta.';}
 function textoDicas(){return (msg?'<b>'+esc(msg)+'</b> · ':'')+esc(dicaDa())+' &nbsp; <kbd>botão direito</kbd> pincel de rocha (blocos) · <kbd>Alt</kbd>+clique pega/move · <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+clique duplica · <kbd>Ctrl</kbd>+<kbd>Z</kbd> desfaz · <kbd>Esc</kbd> sai da ferramenta';}
 function montar(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;
  if(!ehMestre()||!sc){botao?.remove();botao=null;antigosBt?.remove();antigosBt=null;painel?.remove();painel=null;dicas?.remove();dicas=null;return;}
  if(!root.getElementById('erCss')){const st=root.createElement('style');st.id='erCss';st.textContent=ESTILO;root.head.append(st);}
  if(!root.getElementById('erCss201')){const st=root.createElement('style');st.id='erCss201';st.textContent=ESTILO_TERRENO;root.head.append(st);}
  if(!botao||!botao.isConnected){botao=root.createElement('button');botao.type='button';botao.id='erBotao';botao.textContent='🎨 Editor rápido';botao.title='Construir o mapa pintando, como no RPG Map (paredes, cômodos, pisos, portas, móveis)';
   botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',()=>aberto?fechar():abrir());
   const ref=el('o3Botao');if(ref&&ref.parentElement===sc)ref.after(botao);else sc.append(botao);}
  if(!antigosBt||!antigosBt.isConnected){antigosBt=root.createElement('button');antigosBt.type='button';antigosBt.id='erAntigos';antigosBt.textContent='🧰 Antigos';antigosBt.title='Mostrar ou esconder os editores antigos (pincéis, carimbos, formas, marcador, gerador). Ainda serão integrados ao Editor rápido.';
   antigosBt.addEventListener('pointerdown',e=>e.stopPropagation());antigosBt.addEventListener('click',()=>{const on=!root.body.classList.contains('er-antigos');root.body.classList.toggle('er-antigos',on);try{win.localStorage.setItem('mesa:editoresAntigosV197',on?'1':'0');}catch(_){}antigosBt.setAttribute('aria-pressed',String(on));});
   botao.after(antigosBt);let on0=false;try{on0=win.localStorage.getItem('mesa:editoresAntigosV197')==='1';}catch(_){}root.body.classList.toggle('er-antigos',on0);antigosBt.setAttribute('aria-pressed',String(on0));}
  botao.setAttribute('aria-pressed',String(aberto));
  if(getComputedStyle(sc).position==='static')sc.style.position='relative';
  if(!painel||!painel.isConnected){painel=root.createElement('aside');painel.id='erPainel';painel.hidden=!aberto;painel.setAttribute('aria-label','Editor rápido');
   painel.addEventListener('pointerdown',e=>e.stopPropagation());painel.addEventListener('click',aoClicarPainel);painel.addEventListener('input',e=>{if(e.target.matches('[data-busca]')){busca=e.target.value;desenharObjetos();}else aoMudarTerreno(e);});painel.addEventListener('change',e=>{if(e.target.matches('[data-luzraio]'))luzRaio=Number(e.target.value)||4;else if(e.target.matches('[data-espnum]')){esp=Math.max(.1,Math.min(6,Number(e.target.value)||.3));if(!['parede','comodo','diagonal'].includes(ferr))ferr='parede';desenharPainel();}else aoMudarTerreno(e);});sc.append(painel);}
  if(!dicas||!dicas.isConnected){dicas=root.createElement('div');dicas.id='erDicas';dicas.hidden=!aberto;sc.append(dicas);}
 }
 function desenharObjetos(){
  const box=painel?.querySelector('[data-lista-obj]');if(!box)return;
  const q=sem(busca),todos=objetosBanco().map(o=>({o,c:categoriaDeObjeto(o)})).filter(x=>(!cat||x.c===cat)&&(!q||sem((x.o.nome||'')+' '+x.o.id).includes(q))).sort((a,b)=>String(a.o.nome).localeCompare(String(b.o.nome),'pt')).slice(0,90);
  box.innerHTML=todos.map(({o})=>`<button type="button" data-obj="${esc(o.id)}" aria-pressed="${objSel===String(o.id)}" title="${esc(o.nome)} · ${Number(o.larguraM)||1}×${Number(o.alturaM)||1} m" style="background-image:url('${esc(o.imagem)}')"><small>${esc(o.nome)}</small></button>`).join('')||'<span style="grid-column:1/-1;text-align:center;opacity:.7">Nenhum objeto.</span>';
 }
 const FERRS_MAT=['parede','diagonal','cerca','caverna','caverna_nat','cordilheira','comodo','piso','escada','rampa','chao','telhado','copa'];
 const matAtual=()=>ferr==='copa'?texCopa:ferr==='telhado'?texTelhado:ferr==='chao'?texChao:ferr==='comodo'?(slotCom==='p'?texParede:texPiso):['piso','escada','rampa'].includes(ferr)?texPiso:texParede;
 function blocoMaterial(){
  const nome=(FERRAMENTAS.flatMap(x=>x[1]).find(x=>x[0]===ferr)||[])[2]||'Parede',id=matAtual(),copas=ferr==='copa';
  const lista=copas?COPAS.map(c=>({id:c.id,nome:c.nome,src:c.src[0],arv:true})):TEXTURAS_BASE.filter(t=>!ehCopaTex(t.id));
  const slot=(k,rot,tid)=>`<button type="button" data-slot="${k}" aria-pressed="${slotCom===k}"><span class="er-mini" style="background-image:url('${tex(tid).src}')"></span><b>${rot}</b><small>${esc(tex(tid).nome)}</small></button>`;
  const com=ferr==='comodo'?`<div class="er-comodo"><b>Cômodo = paredes + chão</b><div class="er-slots">${slot('p','Paredes',texParede)}<i>+</i>${slot('c','Chão',ehCopaTex(texPiso)?'madeira':texPiso)}</div><small>Toque em Paredes ou Chão e depois no material.</small></div>`:'';
  return `<div class="er-esp-g er-g" style="grid-template-columns:repeat(5,1fr);margin-top:4px">${ESPESSURAS.map(([n,v])=>`<button type="button" data-esp="${v}" aria-pressed="${esp===v}" title="Espessura ${v} m" style="aspect-ratio:auto;padding:4px 0;font-size:9.5px">${n}</button>`).join('')}</div><label class="er-ter-l" title="Espessura da parede, em metros (de 0,1 a 6). Vale para parede, cômodo e diagonal." style="margin:3px 0 0">Espessura (m) <input type="number" data-espnum min="0.1" max="6" step="0.05" value="${esp}" style="width:64px"></label><h5>Material · ${esc(nome)}</h5>${com}<div class="er-g">${lista.map(t=>`<button type="button" class="er-sw" data-mat="${t.id}" aria-pressed="${id===t.id}" title="${esc(t.nome)}" style="background-image:url('${t.src}')${t.arv?';background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#2c4a2c':''}"></button>`).join('')}</div>`;
 }
 function blocoPincel(){
  const meta=ESTILOS_PINCEL.find(e=>e.id===pinc.estilo)||ESTILOS_PINCEL[0],corv=pinc.cor||meta.cor;
  return `<div data-painel-pincel ${ferr==='espalhar'?'':'hidden'}><h5>Pincel de espalhar</h5><div class="er-g" style="grid-template-columns:repeat(3,1fr)">${ESTILOS_PINCEL.map(e=>`<button type="button" data-pinc="${e.id}" aria-pressed="${pinc.estilo===e.id}" title="${esc(e.nome)}">${e.ic}<small>${esc(e.nome)}</small></button>`).join('')}</div>
   <label class="er-ter-l">Cor <input type="color" data-pinc-cor value="${corv}" style="float:right;width:44px;height:22px;padding:0;border:0"></label>
   <label class="er-ter-l">Tamanho <b data-pinc-tamv>${String(pinc.tam).replace('.',',')} m</b><input type="range" min="0.5" max="8" step="0.25" value="${pinc.tam}" data-pinc-tam></label>
   <label class="er-ter-l">Densidade <b data-pinc-densv>${String(pinc.dens).replace('.',',')}×</b><input type="range" min="0.3" max="3" step="0.1" value="${pinc.dens}" data-pinc-dens></label></div>`;
 }
 function desenharPainel(){
  if(!painel)return;const R=win.mesaRascunhoMapaV193,pend=R?.pendentes||0;
  const g=(lista)=>lista.map(([id,ic,nome])=>`<button type="button" data-f="${id}" aria-pressed="${ferr===id}" title="${esc(nome)}">${ic}<small>${esc(nome)}</small></button>`).join('');
  const cats=[...new Set(objetosBanco().map(categoriaDeObjeto))].sort();
  const rol0=painel.querySelector('.er-corpo')?.scrollTop||0,rolLista0=painel.querySelector('[data-lista-obj]')?.scrollTop||0;
  painel.innerHTML=`<div class="er-topo"><button data-a="desfazer" title="Desfazer (Ctrl+Z)" ${R?.temLotes?'':'disabled'}>↶</button><button data-a="refazer" title="Refazer (Ctrl+Y)" ${R?.temRefazer?'':'disabled'}>↷</button><button data-a="descartar" title="Descartar o que não foi salvo" ${pend?'':'disabled'}>🗑️</button><button data-a="novo" title="Criar um mapa novo do zero">🆕</button><button data-a="gerador" title="Gerador de mapas: masmorra, cidade e exterior (MapForge)">🗺️</button><button data-a="fechar" title="Fechar o editor">✕</button><button class="er-salvar" data-a="salvar" ${pend?'':'disabled'}>💾 Salvar mapa${pend?' ('+pend+')':''}</button></div>
  <h5 class="er-h-andar">Andares</h5><div class="er-andar" title="Andar em que você desenha parede, piso e telhado. Escolha 2, 3 ou 4 para construir o andar de cima (o chão dele é o teto do de baixo). No 1 os cômodos sobrepostos se fundem.">${[1,2,3,4].map(n=>`<button type="button" data-andar="${n}" aria-pressed="${andar===n}">${n}</button>`).join('')}</div><div class="er-nota">Chão = andar 0 (sempre embaixo) · piso, parede e telhado ficam no andar escolhido · copas têm camada própria (por cima de tudo) e também seguem o andar escolhido.</div>
  <div class="er-corpo">${FERRAMENTAS.map(([sec,itens])=>`<h5>${esc(sec)}</h5><div class="er-g">${g(itens.map(i=>[i[0],i[1],i[2]]))}</div>${sec==='Construir'?blocoTerreno()+blocoMaterial():''}`).join('')}
  <div data-painel-obj ${ferr==='objeto'?'':'hidden'}><input type="search" data-busca placeholder="Procurar móvel…" value="${esc(busca)}"><div class="er-cats"><button data-cat="" aria-pressed="${!cat}">Todos</button>${cats.map(c=>`<button data-cat="${esc(c)}" aria-pressed="${cat===c}">${esc(c)}</button>`).join('')}</div><div class="er-g er-obj" data-lista-obj></div></div>
  <div data-painel-luz ${ferr==='luz'?'':'hidden'}><h5>Luz</h5><div class="er-g" style="grid-template-columns:repeat(7,1fr)">${CORES_LUZ.map(c=>`<button type="button" class="er-sw" data-luzcor="${c}" aria-pressed="${luzCor===c}" title="Cor da luz" style="background:${c};aspect-ratio:1"></button>`).join('')}</div><label style="display:block;margin-top:5px">Alcance <select data-luzraio style="background:#1f120a;color:#ffe2c8;border:1px solid #8a3a18;border-radius:6px">${[2,3,4,6,8,12].map(v=>`<option value="${v}"${v===luzRaio?' selected':''}>${v} m</option>`).join('')}</select></label></div>
  <div data-painel-modelos ${ferr==='modelo'?'':'hidden'}><h5>Modelos</h5><div class="er-g" style="grid-template-columns:1fr 1fr">${MODELOS.map(m=>`<button type="button" data-modelo="${m.id}" aria-pressed="${modeloSel===m.id}" title="${esc(m.nome)} · ${m.w}×${m.h} m" style="aspect-ratio:auto;padding:6px 2px;font-size:22px">${m.ic}<small style="position:static;background:none;font-size:10px;line-height:1.1">${esc(m.nome)}</small></button>`).join('')}</div></div>
  ${blocoPincel()}
  <h5>Poças</h5><div class="er-g">${POCAS.map(p=>`<button type="button" class="er-sw" data-poca="${p.id}" aria-pressed="${ferr==='poca'&&poca===p.id}" title="${esc(p.nome)}" style="background-color:${p.cor};${p.tex?`background-image:url('${tex(p.tex).src}')`:''}"><small>${esc(p.nome)}</small></button>`).join('')}</div>
  <h5>Zoom</h5><div class="er-g">${[1,2,3].map(z=>`<button type="button" data-z="${z}" aria-pressed="${Math.round(zoomAtual())===z}" title="Ampliar o mapa ${z*100}%" style="aspect-ratio:auto;padding:6px 0;font-size:12px">${z*100}%</button>`).join('')}</div><div style="font-size:10.5px;opacity:.8;margin:3px 0 6px;text-align:center">Ctrl+roda amplia · Espaço+arrastar (ou botão do meio) move</div>
</div>`;
  desenharObjetos();if(dicas)dicas.innerHTML=textoDicas();
  painel.querySelector('[data-pinc-cor]')?.addEventListener('input',e=>{pinc.cor=e.target.value;});
  painel.querySelector('[data-pinc-tam]')?.addEventListener('input',e=>{pinc.tam=Number(e.target.value)||1.8;const b=painel.querySelector('[data-pinc-tamv]');if(b)b.textContent=String(pinc.tam).replace('.',',')+' m';});
  painel.querySelector('[data-pinc-dens]')?.addEventListener('input',e=>{pinc.dens=Number(e.target.value)||1;const b=painel.querySelector('[data-pinc-densv]');if(b)b.textContent=String(pinc.dens).replace('.',',')+'×';});
  {const c=painel.querySelector('.er-corpo');if(c)c.scrollTop=rol0;const l=painel.querySelector('[data-lista-obj]');if(l)l.scrollTop=rolLista0;}
  {const bq=el('novaSyncBoard');if(bq){if(aberto&&ferr)bq.dataset.ferr=ferr;else delete bq.dataset.ferr;}} // v205: o módulo de cursor lê a ferramenta daqui
  el('novaSyncBoard')?.classList.toggle('er-ativa',aberto&&!!ferr);el('novaSyncBoard')?.classList.toggle('er-mover',aberto&&ferr==='mover');
 }
 function aoClicarPainel(e){
  if(e.target.closest?.('.er-terreno [data-ter],[data-espnum]'))return;
  const pc=e.target.closest('[data-pinc]'),f=e.target.closest('[data-f]'),a=e.target.closest('[data-a]'),tp=e.target.closest('[data-tp]'),po=e.target.closest('[data-poca]'),pi=e.target.closest('[data-piso]'),te=e.target.closest('[data-teto]'),ma=e.target.closest('[data-mat]'),sl=e.target.closest('[data-slot]'),an=e.target.closest('[data-andar]'),mo=e.target.closest('[data-modelo]'),lc=e.target.closest('[data-luzcor]'),ep=e.target.closest('[data-esp]'),zm=e.target.closest('[data-z]'),ob=e.target.closest('[data-obj]'),ct=e.target.closest('[data-cat]');
  const R=win.mesaRascunhoMapaV193;
  if(f){ferr=ferr===f.dataset.f?'':f.dataset.f;msg='';if(['caverna','caverna_nat','cordilheira'].includes(ferr)&&(texParede==='tijolo'||texParede==='madeira'))texParede='rocha';if(ferr==='comodo')slotCom='p';if(ferr==='modelo'&&!modeloSel)modeloSel=MODELOS[0].id;}
  else if(pc){pinc.estilo=pc.dataset.pinc;pinc.cor='';ferr='espalhar';}
  else if(tp){texParede=tp.dataset.tp;if(!['parede','comodo','diagonal','cerca','caverna','caverna_nat','cordilheira'].includes(ferr))ferr='parede';}
  else if(po){poca=po.dataset.poca;ferr='poca';}
  else if(pi){texPiso=pi.dataset.piso;if(ferr!=='comodo')ferr='piso';}
  else if(te){texTelhado=te.dataset.teto;ferr='telhado';}
  else if(sl){slotCom=sl.dataset.slot;}
  else if(ma){const id=ma.dataset.mat;
   if(ferr==='copa')texCopa=id;else if(ferr==='telhado')texTelhado=id;
   else if(ferr==='comodo'){if(slotCom==='p')texParede=id;else texPiso=id;}
   else if(ferr==='chao'){texChao=id;const {W,H}=dims();aviso(aplicar(L=>fTrocaChao(L,id,W,H))?'Chão do mapa trocado.':'O chão já era esse.');}
   else if(['piso','escada','rampa'].includes(ferr))texPiso=id;
   else if(['parede','diagonal','cerca','caverna','caverna_nat','cordilheira'].includes(ferr))texParede=id;
   else{ferr='parede';texParede=id;}}
  else if(an){andar=Number(an.dataset.andar)||1;aviso('Andar '+andar+': o que você desenhar agora fica nele.');try{win.mesaAndarV144?.editor?.(true,andar);}catch(_){}}
  else if(zm){win.mesaCameraV144?.definir?.(Number(zm.dataset.z));}
  else if(ep){esp=Number(ep.dataset.esp);if(!['parede','comodo','diagonal'].includes(ferr))ferr='parede';}
  else if(lc){luzCor=lc.dataset.luzcor;ferr='luz';}
  else if(mo){modeloSel=mo.dataset.modelo;ferr='modelo';msg='';}
  else if(ob){objSel=ob.dataset.obj;ferr='objeto';rot=0;}
  else if(ct){cat=ct.dataset.cat||'';}
  else if(a){const k=a.dataset.a;
   if(k==='fechar')return fechar();
   if(k==='novo'){abrirNovo();return;}
   if(k==='gerador'){abrirGerador();}else if(k==='chaomapa'){const {W,H}=dims();aviso(String(texPiso).startsWith('copa_')?'Copa não serve de chão: escolha um piso.':aplicar(L=>fTrocaChao(L,texPiso,W,H))?'Chão do mapa trocado.':'O chão já era esse.');}else if(k==='desfazer')R?.desfazerLote();else if(k==='refazer')R?.refazerLote();
   else if(k==='descartar'){if(win.confirm('Descartar o que ainda não foi salvo?'))R?.descartar();}
   else if(k==='salvar'){
    if(!R?.salvar){aviso('⚠️ O editor de mapas não está pronto.');return;}
    aviso('⏳ Salvando o mapa…');
    Promise.resolve(R.salvar()).then(resultado=>{
     if(resultado?.estado==='confirmado')aviso('✓ Mapa salvo e sincronizado.');
     else if(resultado?.estado==='sem-mudancas')aviso('Nenhuma alteração pendente.');
     else aviso('⚠️ O mapa NÃO foi salvo: '+String(resultado?.erro?.message||resultado?.estado||'não confirmado'));
    }).catch(err=>aviso('⚠️ O mapa NÃO foi salvo: '+String(err?.message||err)))
      .finally(desenharPainel);
    return;
   }}
  limparPrevia();desenharPainel();
 }
 function abrir(){if(!ehMestre())return;aberto=true;montar();reservarLado(true);painel.hidden=false;dicas.hidden=false;botao?.setAttribute('aria-pressed','true');if(!ferr)ferr='parede';win.mesaOficina3V175?.fechar?.();try{win.mesaAndarV144?.editor?.(true,andar);}catch(_){}desenharPainel();}
 function reservarLado(sim){const sc=el('novaSyncBoard')?.parentElement;if(!sc)return;if(sim){if(sc.dataset.erPad===undefined)sc.dataset.erPad=sc.style.paddingLeft||'';sc.style.paddingLeft='206px';sc.style.boxSizing='border-box';}else if(sc.dataset.erPad!==undefined){sc.style.paddingLeft=sc.dataset.erPad;delete sc.dataset.erPad;}try{ctl()?.refreshView?.();}catch(_){}}
 function fechar(){try{win.mesaAndarV144?.editor?.(false);}catch(_){}reservarLado(false);aberto=false;arrasto=null;limparPrevia();if(painel)painel.hidden=true;if(dicas)dicas.hidden=true;botao?.setAttribute('aria-pressed','false');el('novaSyncBoard')?.classList.remove('er-ativa');}
 let ultimaChave='';
 const vigia=setInterval(()=>{try{montar();if(aberto){const R=win.mesaRascunhoMapaV193,k=(R?.pendentes||0)+'|'+(R?.temLotes||0)+'|'+(R?.temRefazer||0);if(k!==ultimaChave){ultimaChave=k;desenharPainel();}}}catch(e){console.warn('[Editor rápido]',e);}},500);
 vigia?.unref?.();
 /* v203: para o "Mapa de teste" (ecossistema): aplica um plano pronto num mapa novo, põe armadilhas e salva */
 const SVG_ARM='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect x="3" y="3" width="74" height="74" rx="6" fill="#2a2520" stroke="#5a5448" stroke-width="4"/><g fill="#9a8a6a" stroke="#1d1a17" stroke-width="1.5"><path d="M14 66 L22 30 L30 66Z"/><path d="M33 66 L41 22 L49 66Z"/><path d="M52 66 L60 30 L68 66Z"/></g></svg>');
 function adicionarArmadilhas(pts){const {W,H}=dims();return aplicar(L=>[...L,...comOrdem(L,pts.map(a=>({id:novoId('armadilha'),nome:a.tipo==='laminas'?'Armadilha de lâminas':'Armadilha de estacas',tipo:'objeto',camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'',angulo:0,imagem:SVG_ARM,...N({x:a.x-.6,y:a.y-.6,w:1.2,h:1.2},W,H),opacity:.22,armadilhaV184:a.tipo,erTipo:'objeto'})))]);}
 /* v203: "construir": aplica uma lista de passos (mapa de teste/gerador novo) com as MESMAS ferramentas do editor — poças e cordilheiras orgânicas, caverna natural, cômodos, portas, copas, objetos.
    passos: {t:'chao',tex} · {t:'mancha',cels:[[x,y]…],tex,nome,camada} (chão orgânico) · {t:'cfg',terr:{…},andar:n} · {t:'ops',ops:[formato dos Modelos]} · {t:'copa'|'poca'|'cordilheira'|'caverna_nat'|…,r:{x,y,w,h},o:{…}} */
 function construir(passos,opc={}){
  if(opc.semente){let s=Number(opc.semente)>>>0||1;semFixa=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s%2147483647;};}
  const {W,H}=dims(),salvo={poca,texParede,texPiso,esp,andar,terr:{...terr}};let feitos=0,falhas=0,lote=[],andarLote=1;
  const rodar=L=>{let M=L;
   for(const o of lote){try{
    let R=null;
    if(o.t==='chao')R=fTrocaChao(M,o.tex,W,H);
    else if(o.t==='mancha'){const set=new Set(o.cels.map(c=>c[0]+','+c[1]));R=[...M,...comOrdem(M,fazMacico(set,W,H,{t:o.tex,tipo:'macicoTopo',nome:o.nome||'Terreno',grupo:novoGrupo(),suav:3,ruido:.25,seed:o.seed||semente(),colideSet:null,camada:o.camada??.5,texM:3,...(o.borda?{borda:o.borda}:{})}))];}
    else if(o.t==='ops')R=fModelo(M,{ops:o.ops},0,0,W,H);
    else if(o.t==='decor'){ // v205: enfeites leves (arquivo SVG em arte/decor) — não bloqueiam, não são destrutíveis; só desenho
     R=[...M,...comOrdem(M,(o.itens||[]).map(it=>({...objDoBanco({id:it.id,nome:it.nome,larguraM:it.w,alturaM:it.h,imagem:it.img},{x:it.x,y:it.y},W,H,it.rot||0),camada:it.camada??2,bloqueiaMovimento:false,bloqueiaVisao:false,destrutivel:false,pvMax:0,pvAtual:0,decorV205:true})))];}
    else if(o.t==='ajustar'){ // v205: acerta propriedades de objetos já criados. Seletores: andar inteiro (o.andar) · escada/rampa perto de (o.x,o.y) em metros · poça (o.poca) de maior/menor área · o.perto={x,y,r,erTipo}
     const area=x=>(Number(x.larguraM)||1)*(Number(x.alturaM)||1),pocas=o.poca?M.filter(x=>x.erPoca===o.poca).sort((p,q)=>area(p)-area(q)):[],alvoPoca=o.poca?(o.ordem==='menor'?pocas[0]:pocas[pocas.length-1]):null;
     R=M.map(x=>{let hit=false;
      if(o.andar)hit=(Number(x.andarV144)||1)===o.andar;
      else if(o.nomeRe)hit=new RegExp(o.nomeRe).test(String(x.nome||''));
      else if(o.pocasPrefixo)hit=String(x.erPoca||'').startsWith(o.pocasPrefixo);
      else if(o.poca)hit=!!alvoPoca&&x===alvoPoca;
      else if(o.perto)hit=(!o.perto.erTipo||x.erTipo===o.perto.erTipo)&&Math.hypot(Number(x.x)*W/28-o.perto.x,Number(x.y)*H/14-o.perto.y)<(o.perto.r||1.3);
      else hit=(x.erTipo==='escada'||x.erTipo==='rampa')&&Math.hypot(Number(x.x)*W/28-o.x,Number(x.y)*H/14-o.y)<1.3;
      return hit?{...x,...o.props}:x;});}
    else if(o.r)R=fRet(M,o.t,o.r,W,H,o.o||{});
    if(R){M=R;feitos++;}else falhas++;
   }catch(e){falhas++;console.warn('[Construir]',o.t,e?.message||e);}}
   return M;};
  const solta=()=>{if(!lote.length)return;andar=andarLote;try{aplicar(rodar);}catch(e){console.warn('[Construir] lote',e?.message||e);}lote=[];};
  try{
   for(const o of passos){
    if(o.t==='cfg'){solta();if(o.terr)Object.assign(terr,o.terr);if(o.poca)poca=o.poca;if(o.texParede)texParede=o.texParede;if(o.texPiso)texPiso=o.texPiso;if(o.esp)esp=o.esp;if(o.andar)andarLote=o.andar;continue;}
    lote.push(o);
   }
   solta();
  }finally{semFixa=null;poca=salvo.poca;texParede=salvo.texParede;texPiso=salvo.texPiso;esp=salvo.esp;andar=salvo.andar;Object.assign(terr,salvo.terr);}
  return {feitos,falhas};
 }
 const SVG_GRADE='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 20" preserveAspectRatio="none"><rect width="80" height="20" fill="#2b2f36"/><g stroke="#8a929c" stroke-width="3"><path d="M8 0V20M20 0V20M32 0V20M44 0V20M56 0V20M68 0V20"/></g><rect y="8" width="80" height="4" fill="#5a626c"/></svg>');
 const SVG_ALAVANCA='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="4" y="22" width="32" height="14" rx="3" fill="#3a3f47" stroke="#15181c" stroke-width="2"/><path d="M20 26 L28 6" stroke="#c9a23a" stroke-width="5" stroke-linecap="round"/><circle cx="28" cy="6" r="4.5" fill="#d9483a" stroke="#15181c" stroke-width="1.5"/></svg>');
 /* peças funcionais do calabouço: armadilhas, grades de cela (a 1ª é a porta), alavancas que abrem a cela */
 function adicionarEspeciais(lista){const {W,H}=dims();
  const base=(nome,r,extra)=>({id:novoId('esp'),nome,tipo:'objeto',camada:2,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'',angulo:0,...N(r,W,H),erTipo:'objeto',...extra});
  return aplicar(L=>[...L,...comOrdem(L,lista.map(a=>{
   if(a.k==='grade')return base('Grade da cela',{x:a.x,y:a.y,w:a.w,h:a.h},{camada:3,bloqueiaMovimento:true,pvMax:30,pvAtual:30,dureza:4,destrutivel:true,material:'metal',imagem:SVG_GRADE,jaulaV186:a.jid,...(a.porta?{portaJaulaV186:true}:{})});
   if(a.k==='alavanca')return base(a.emperrada?'Alavanca emperrada':'Alavanca',{x:a.x-.5,y:a.y-.5,w:1,h:1},{material:'metal',imagem:SVG_ALAVANCA,alavancaV186:a.jid});
   return base(a.tipo==='laminas'?'Armadilha de lâminas':'Armadilha de estacas',{x:a.x-.6,y:a.y-.6,w:1.2,h:1.2},{camada:1,imagem:SVG_ARM,opacity:.22,armadilhaV184:a.tipo});
  }))]);}
 win.mesaEditorRapidoV197={pronto:id=>{const R=rasc();return !!R&&String(mapa())===String(id);},construir,especiais:async l=>adicionarEspeciais(l),objetos:()=>{const R=rasc();return R?R.objetosAtuais():[];},aplicarPlano:(pl,d,n)=>aplicarPlanoNoMapa(pl,d,n),armadilhas:async pts=>adicionarArmadilhas(pts),salvar:async()=>{const R=rasc();return R?.salvar?.()||{estado:'indisponivel'};},mapaAtual:()=>String(mapa()||''),abrir,fechar,criarMapa,abrirNovo,gerador:abrirGerador,fazer:(tipo,r)=>opRetangulo(tipo,r),terreno:()=>({...terr}),aberto:()=>aberto,ferramenta:f=>{ferr=f;desenharPainel();},estado:()=>({ferr,texParede,texPiso,poca,objSel,rot,arrasto:arrasto?arrasto.tipo:''})};
 return {abrir,fechar,parar(){clearInterval(vigia);botao?.remove();painel?.remove();dicas?.remove();previa?.remove();}};
}
