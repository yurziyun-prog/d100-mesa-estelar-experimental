// Mesa Estelar v110 — Gerador de mapas (dados puros, sem DOM).
//
// Gera um estado da Oficina 2 (o mesmo formato salvo pelo editor de mapas): chão com
// textura, paredes/canais/canteiros como formas e objetos do Banco por referência.
// Só usa objetos que EXISTEM no banco (função `existe`), então funciona com qualquer
// banco — quanto mais objetos (inclusive os pk_* da v107), mais rico o mapa.

import {rng,semente} from './mesa-mapa-arte.js?v=197';

export const TIPOS_MAPA={
 esgoto:{nome:'🕳️ Esgoto / túneis',textura:'esgoto',bg:'#3a3f38'},
 caverna:{nome:'🪨 Caverna / mina',textura:'caverna',bg:'#2a2724'},
 floresta:{nome:'🌲 Floresta / clareira',textura:'floresta',bg:'#3a3622'},
 ermos:{nome:'🏜️ Ermos / estrada',textura:'terra',bg:'#6b4f34'},
 cidade:{nome:'🏙️ Rua / praça da cidade',textura:'calcamento',bg:'#3e3a35'},
 interior:{nome:'🏠 Interior (salas)',textura:'assoalho',bg:'#5f4127'},
 arena:{nome:'🏟️ Arena / ringue / estande',textura:'areia',bg:'#c9a46a'},
};
export const TAMANHOS=[[28,14],[36,18],[42,21],[56,28]]; // v134: 56 m para lugares amplos (panorâmicos)
// v134: tipos a céu aberto saem maiores quando o gerador escolhe sozinho
export const ABERTOS=new Set(['cidade','floresta','ermos']);

// Sugere o tipo pelo nome do mapa/cenário (para preencher mapas vazios).
export function sugerirTipo(nome=''){
 const n=String(nome).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const regras=[[/esgot|tunel|subterr|galeria|cisterna|bueiro/,'esgoto'],[/cavern|mina|gruta|escavad/,'caverna'],[/flores|bosque|mata|selva|clareira/,'floresta'],
  [/ringue|arena|competic|tiro|torneio|estande/,'arena'],[/arquivo|clinica|casa|residenc|escritor|palacio|pavilh|tribunal|bar|taverna|loja|hotel|hospital|biblioteca|sala|quarto/,'interior'],
  [/praca|rua|porto|portao|mercado|feira|cidade|bairro|cais|vila/,'cidade'],[/caravana|estrada|deserto|mar de pedra|ermo|planicie|serra|campo|dunas/,'ermos']];
 for(const [re,t] of regras)if(re.test(n))return t;
 return 'cidade';
}

// ---------------------------------------------------------------- construtores de elementos
function fabrica(seed){
 let n=0,z=0;
 const id=p=>`${p}:gen${seed}:${(++n).toString(36)}`;
 const forma=(x,y,w,h,{fill,nome='Forma',bloq=false,camada=null,material=null,kind='retangulo',rot=0,radius=0,opacity=1,visao=null}={})=>({
  id:id('s'),type:'shape',kind,x:+x.toFixed(2),y:+y.toFixed(2),w:+w.toFixed(2),h:+h.toFixed(2),rot,fill,stroke:'#111111',strokeWidth:0,opacity,fillOpacity:1,strokeOpacity:1,radius,
  shadow:'nenhuma',shadowDir:'SE',shadowDist:4,z:++z,camada:camada??(bloq?3:1),bloqueiaMovimento:!!bloq,bloqueiaVisao:visao??!!bloq,nome,name:nome,locked:true,src:'',modeloId:'',
  pvMax:0,pvAtual:0,dureza:0,destrutivel:false,destruido:false,...(material?{material}:{})});
 const objeto=(m,cx,cy,{rot=0,escala=1}={})=>{const w=(Number(m.larguraM)||1)*escala,h=(Number(m.alturaM)||1)*escala;return {
  id:id('o'),type:'object',modeloId:String(m.id),objetoBancoId:String(m.id),x:+(cx-w/2).toFixed(2),y:+(cy-h/2).toFixed(2),w:+w.toFixed(2),h:+h.toFixed(2),rot:Math.round(rot),z:++z,
  camada:Number(m.camada)||3,bloqueiaMovimento:m.bloqueiaMovimento!==false&&String(m.bloqueiaMovimento)!=='false',bloqueiaVisao:!!m.bloqueiaVisao&&String(m.bloqueiaVisao)!=='false',
  nome:String(m.nome||m.id),name:String(m.nome||m.id),locked:false,opacity:1,shadow:'nenhuma',shadowDir:'SE',shadowDist:4,src:'',mapRef:true,
  pvMax:Number(m.pvMax||m.pv||0),pvAtual:Number(m.pvMax||m.pv||0),dureza:Number(m.dureza||0),destrutivel:Number(m.pvMax||m.pv||0)>0};};
 const caminho=(pontos,{cor='#7a6044',largura=2,nome='Trilha',opac=1}={})=>({id:id('p'),type:'path',brush:'redondo',points:pontos.map(([x,y])=>({x:+x.toFixed(2),y:+y.toFixed(2)})),stroke:cor,strokeWidth:largura*40,strokeWidthM:largura,strokeOpacity:opac,opacity:1,z:++z,camada:1,bloqueiaMovimento:false,nome,name:nome,locked:true});
 // v141: pincéis de textura da Oficina (areia, cascalho, grama, fumaça, ranhura…) — chão com textura de verdade
 const pincel=(pontos,{brush='areia',cor='#a88a5a',largura=.3,opac=1,nome='Textura'}={})=>({id:id('t'),type:'path',brush,points:pontos.map(([x,y])=>({x:+x.toFixed(2),y:+y.toFixed(2)})),stroke:cor,strokeWidth:Math.round(largura*48),strokeWidthM:largura,strokeOpacity:1,opacity:opac,z:++z,camada:1,bloqueiaMovimento:false,nome,name:nome,locked:true,shadow:'nenhuma',shadowDir:'SE',shadowDist:4});
 return {forma,objeto,caminho,pincel,proximoZ:()=>++z};
}

// Grade de ocupação (1 m) para não empilhar objetos e não bloquear passagens.
function grade(W,H){
 const g=new Uint8Array(W*H);
 const ok=(x,y,w,h,folga=0)=>{for(let j=Math.floor(y-folga);j<Math.ceil(y+h+folga);j++)for(let i=Math.floor(x-folga);i<Math.ceil(x+w+folga);i++){if(i<0||j<0||i>=W||j>=H)return false;if(g[j*W+i])return false;}return true;};
 const marcar=(x,y,w,h,v=1)=>{for(let j=Math.max(0,Math.floor(y));j<Math.min(H,Math.ceil(y+h));j++)for(let i=Math.max(0,Math.floor(x));i<Math.min(W,Math.ceil(x+w));i++)g[j*W+i]=v;};
 return {ok,marcar,g};
}
// Une células sólidas em retângulos (menos elementos = mapa leve).
export function retangulosDeCelulas(sol,W,H){
 const usados=new Uint8Array(W*H),out=[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  if(!sol[y*W+x]||usados[y*W+x])continue;
  let w=1;while(x+w<W&&sol[y*W+x+w]&&!usados[y*W+x+w])w++;
  let h=1;outer:while(y+h<H){for(let i=x;i<x+w;i++)if(!sol[(y+h)*W+i]||usados[(y+h)*W+i])break outer;h++;}
  for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)usados[j*W+i]=1;
  out.push({x,y,w,h});
 }
 return out;
}

function escolher(r,lista){return lista[Math.floor(r()*lista.length)];}
function candidatos(banco,ids){return ids.map(id=>banco.get(id)).filter(Boolean);}

// ---------------------------------------------------------------- geradores
function gerarEsgoto(ctx){
 const {W,H,r,f,banco,els,occ}=ctx;
 // túneis em grade de células de 2 m (labirinto com laços)
 const C=2,cw=Math.floor(W/C),ch=Math.floor(H/C),aberto=new Uint8Array(cw*ch);
 const tuneis=[];
 const linhaPrincipal=1+Math.floor(r()*(ch-3));const larg=2;
 for(let x=0;x<cw;x++)for(let k=0;k<larg;k++)aberto[(linhaPrincipal+k)*cw+x]=1;
 tuneis.push({h:true,x:0,y:linhaPrincipal*C,len:W,larg:larg*C});
 const verticais=2+Math.floor(r()*3);
 for(let v=0;v<verticais;v++){
  const x=1+Math.floor(r()*(cw-2)),l=r()<.5?1:2;const y0=r()<.5?0:Math.floor(r()*linhaPrincipal),y1=r()<.5?ch:linhaPrincipal+2+Math.floor(r()*(ch-linhaPrincipal-2));
  for(let y=Math.min(y0,linhaPrincipal);y<Math.max(y1,linhaPrincipal+larg);y++)for(let k=0;k<l;k++)if(x+k<cw)aberto[y*cw+x+k]=1;
  tuneis.push({h:false,x:x*C,y:Math.min(y0,linhaPrincipal)*C,len:(Math.max(y1,linhaPrincipal+larg)-Math.min(y0,linhaPrincipal))*C,larg:l*C});
 }
 // salas laterais
 for(let s=0;s<2+Math.floor(r()*3);s++){const w=2+Math.floor(r()*2),h=2+Math.floor(r()*2),x=Math.floor(r()*(cw-w)),y=Math.floor(r()*(ch-h));for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)aberto[j*cw+i]=1;ctx.salas.push({x:x*C,y:y*C,w:w*C,h:h*C});
  // liga a sala ao túnel mais próximo com um corredor vertical
  const cx=x+Math.floor(w/2);for(let j=Math.min(y,linhaPrincipal);j<=Math.max(y+h-1,linhaPrincipal);j++)aberto[j*cw+cx]=1;}
 // paredes = tudo que não é túnel
 const sol=new Uint8Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const cx=Math.min(cw-1,Math.floor(x/C)),cy=Math.min(ch-1,Math.floor(y/C));sol[y*W+x]=aberto[cy*cw+cx]?0:1;}
 for(const q of retangulosDeCelulas(sol,W,H)){els.push(f.forma(q.x,q.y,q.w,q.h,{fill:'#2b2e2b',nome:'Parede de concreto',bloq:true,material:'rocha'}));occ.marcar(q.x,q.y,q.w,q.h);}
 // canal de água no túnel principal (água rasa: não bloqueia, mas é terreno difícil)
 const t=tuneis[0],cy=t.y+t.larg/2;
 els.push(f.forma(0,cy-.8,W,1.6,{fill:'#3e6f78',nome:'Canal de esgoto',bloq:false,camada:1}));
 occ.marcar(0,cy-.8,W,1.6);
 // passarelas e grades sobre o canal
 const grade1=banco.get('grade1');
 for(let x=3+r()*4;x<W-2;x+=6+r()*6){if(grade1)els.push(f.objeto(grade1,x,cy,{escala:.9}));else els.push(f.forma(x-1,cy-1,2,2,{fill:'#5f646a',nome:'Passarela',material:'metal'}));}
 // canos ao longo das paredes do túnel principal
 els.push(f.forma(0,t.y+.05,W,.28,{fill:'#5f6a70',nome:'Cano',bloq:false,camada:2,material:'metal'}));
 els.push(f.forma(0,t.y+t.larg-.33,W,.28,{fill:'#6a5a4a',nome:'Cano enferrujado',bloq:false,camada:2,material:'metal'}));
 // objetos
 ctx.espalhar(candidatos(banco,['pk_barril','caixa_madeira','caixa1','pk_caixote_suprimentos','caixa2']),6+Math.floor(r()*5),{perto:'parede'});
 ctx.espalhar(candidatos(banco,['esqueletos1','galhoseco1','tronco1']),1+Math.floor(r()*2));
 ctx.espalhar(candidatos(banco,['escotilha1']),1+Math.floor(r()*2));
 ctx.espalhar(candidatos(banco,['pk_luminaria','lampada']),2+Math.floor(r()*2));
}
function gerarCaverna(ctx){
 const {W,H,r,f,banco,els,occ}=ctx;
 let m=new Uint8Array(W*H);for(let i=0;i<W*H;i++)m[i]=r()<.47?1:0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x<1||y<1||x>=W-1||y>=H-1)m[y*W+x]=1;
 for(let it=0;it<5;it++){const n=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let c=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=x+i,yy=y+j;c+=(xx<0||yy<0||xx>=W||yy>=H)?1:m[yy*W+xx];}n[y*W+x]=c>=5?1:0;}m=n;}
 // garante uma passagem de um lado ao outro
 let y=Math.floor(H/2);for(let x=0;x<W;x++){for(let k=-1;k<=1;k++){const yy=Math.max(1,Math.min(H-2,y+k));m[yy*W+x]=0;}if(r()<.35)y=Math.max(2,Math.min(H-3,y+(r()<.5?-1:1)));}
 for(const q of retangulosDeCelulas(m,W,H)){els.push(f.forma(q.x,q.y,q.w,q.h,{fill:'#262320',nome:'Rocha',bloq:true,material:'rocha'}));occ.marcar(q.x,q.y,q.w,q.h);}
 if(r()<.7){const livres=[];for(let yy=2;yy<H-3;yy++)for(let xx=2;xx<W-4;xx++)if(!m[yy*W+xx]&&!m[yy*W+xx+2]&&!m[(yy+1)*W+xx])livres.push([xx,yy]);if(livres.length){const [px,py]=escolher(r,livres);els.push(f.forma(px,py,2.6,1.6,{fill:'#355f6a',nome:'Poça',kind:'elipse',camada:1}));occ.marcar(px,py,3,2);}}
 ctx.espalhar(candidatos(banco,['pk_pedra_grande','rocha_media','predranova2','predranova3','preda1','predramusgosa1']),6+Math.floor(r()*5));
 ctx.espalhar(candidatos(banco,['pk_pedra_pequena','predranova4']),6+Math.floor(r()*6));
 ctx.espalhar(candidatos(banco,['pk_cristal_azul','cristalgay1','predragay1','redragay2']),2+Math.floor(r()*4));
 ctx.espalhar(candidatos(banco,['esqueletos1','caixa_madeira','pk_barril']),2+Math.floor(r()*2));
}
function trilha(ctx,{larg=2,cor='#7a6044',borda='#4e3a26',nome='Trilha'}={}){
 const {W,H,r,f,els,occ}=ctx;let y=2+r()*(H-4);const pts=[];
 for(let x=-1;x<=W+1;x+=2){pts.push([x,y]);y=Math.max(1.5+larg/2,Math.min(H-1.5-larg/2,y+(r()-.5)*1.6));}
 els.push(f.caminho(pts,{cor:borda,largura:larg+.5,nome:nome+' (borda)',opac:.55}));
 els.push(f.caminho(pts,{cor,largura:larg,nome}));
 els.push(f.caminho(pts.map(([x,yy])=>[x,yy+(r()-.5)*.3]),{cor:'#a08664',largura:larg*.35,nome:nome+' (marcas)',opac:.35}));
 for(const [x,yy] of pts)occ.marcar(x-1,yy-larg/2,2.2,larg,2);
 return pts;
}
function gerarFloresta(ctx){
 const {W,H,r,f,banco,els,occ}=ctx;
 trilha(ctx,{larg:1.6});
 // clareira
 const cx=W*(.3+r()*.4),cy=H*(.3+r()*.4),R=Math.min(W,H)*.22;occ.marcar(cx-R,cy-R*.7,R*2,R*1.4,2);
 ctx.espalhar(candidatos(banco,['pk_tronco_caido','tronco1','tronco2','troncocortado1']),2,{area:{x:cx-R,y:cy-R*.7,w:R*2,h:R*1.4},ignorarReserva:true});
 const arvores=candidatos(banco,['arvre1','arvre3','avre4','pk_pinheiro','arvore_media','pk_arvore_florida','arvrepalmeira2']);
 ctx.espalhar(arvores,Math.floor(W*H/15),{folga:.1});
 ctx.espalhar(candidatos(banco,['arbusto','pk_arbusto_florido','planta1','planta2']),Math.floor(W*H/40));
 ctx.espalhar(candidatos(banco,['pk_pedra_grande','predramusgosa1','rocha_media','pk_pedra_pequena']),4+Math.floor(r()*4));
 ctx.espalhar(candidatos(banco,['galho1','galhoseco1','troncocortado1']),4);
}
function gerarErmos(ctx){
 const {W,H,r,f,banco,els}=ctx;
 trilha(ctx,{larg:2.6,cor:'#8a7052',nome:'Estrada de terra'});
 // muretas em ruínas
 for(let i=0;i<2+Math.floor(r()*3);i++){const x=1+r()*(W-8),y=1+r()*(H-4),hor=r()<.5,l=3+r()*5;
  for(let k=0;k<l;k+=1.2){if(r()<.25)continue;const px=hor?x+k:x,py=hor?y:y+k;if(ctx.occ.ok(px,py,1,.6)){els.push(f.forma(px,py,hor?1.1:.6,hor?.6:1.1,{fill:'#6e665a',nome:'Mureta em ruínas',bloq:true}));ctx.occ.marcar(px,py,1,1);}}}
 ctx.espalhar(candidatos(banco,['pk_pedra_grande','rocha_media','preda1','predranova2','predranova3']),8+Math.floor(r()*6));
 ctx.espalhar(candidatos(banco,['pk_pedra_pequena','predranova4']),8);
 ctx.espalhar(candidatos(banco,['galhoseco1','pk_tronco_caido','troncocortado1','esqueletos1']),4);
 ctx.espalhar(candidatos(banco,['arbusto','avrepalmeira','arvrepalmeira2']),3);
 ctx.espalhar(candidatos(banco,['pk_vei_carroca','pk_vei_cargueiro','pk_barril','caixa_madeira']).concat(candidatos(banco,['pk_vei_carroca','pk_vei_cargueiro']).length?[]:candidatos(banco,['carro1','caminhao1'])),2+Math.floor(r()*2)); // v138: carroças e cargueiros flutuantes
}
function gerarCidade(ctx){
 const {W,H,r,f,banco,els,occ}=ctx;
 const ruaH=3+Math.floor(r()*2),yRua=Math.floor(H*(.35+r()*.3));
 // v138: nada de asfalto com faixa branca — rua de pedra batida com trilho de levitação luminoso no meio
 els.push(f.forma(0,yRua,W,ruaH,{fill:'#6e6250',nome:'Rua de pedra batida',camada:1,material:'nenhum'}));
 els.push(f.forma(0,yRua+ruaH/2-.07,W,.14,{fill:'#2a9a9a',nome:'Trilho de levitação',camada:1,material:'nenhum',opacity:.75}));
 for(let x=1;x<W;x+=4)els.push(f.forma(x,yRua+ruaH/2-.18,.36,.36,{fill:'#7fffd4',nome:'Baliza do trilho',kind:'circulo',camada:1,material:'nenhum',opacity:.8}));
 occ.marcar(0,yRua,W,ruaH,2);
 // quarteirões acima e abaixo da rua, com calçada de 1,5 m
 const tetos=['#a8784a','#8a6a4a','#b08a5a','#7a5236','#9a8a6a']; // v138: barro e arenito
 for(const [y0,y1] of [[0,yRua-1.5],[yRua+ruaH+1.5,H]]){
  if(y1-y0<3)continue;let x=r()*2;
  while(x<W-3){const w=4+r()*6,beco=r()<.3?2+r()*2:1+r()*.5;if(x+w>W)break;
   if(r()<.18){ctx.praca={x,y:y0,w,h:y1-y0};x+=w+beco;continue;}
   const h=Math.max(3,(y1-y0)-(r()<.5?0:r()*1.5)),y=y0===0?y0:y1-h;
   els.push(f.forma(x,y,w,h,{fill:escolher(r,tetos),nome:'Prédio',bloq:true,radius:r()<.5?Math.min(w,h)*.25:0}));
   if(r()<.45){const d=Math.min(w,h)*.55;els.push(f.forma(x+w/2-d/2,y+h/2-d/2,d,d,{fill:'#c9b98f',nome:'Cúpula',kind:'elipse',camada:3,material:'nenhum',opacity:.9}));}
   else if(w>=h)els.push(f.forma(x+.3,y+h/2-.09,w-.6,.18,{fill:'#2a2522',nome:'Cumeeira',camada:3,material:'nenhum'}));else els.push(f.forma(x+w/2-.09,y+.3,.18,h-.6,{fill:'#2a2522',nome:'Cumeeira',camada:3,material:'nenhum'}));
   occ.marcar(x,y,w,h);x+=w+beco;}
 }
 // praça (se sorteada) com canteiros
 if(ctx.praca){const p=ctx.praca;els.push(f.forma(p.x+.5,p.y+.5,p.w-1,p.h-1,{fill:'#5f8a3a',nome:'Canteiro',camada:1}));}
 ctx.espalhar(candidatos(banco,['pk_luminaria','lampada']),3+Math.floor(r()*3),{faixa:[yRua-1.5,yRua]});
 ctx.espalhar(candidatos(banco,['pk_barril','caixa_madeira','caixa1','pk_caixote_suprimentos']),5+Math.floor(r()*4),{perto:'parede'});
 ctx.espalhar((v=>v.length?v:candidatos(banco,['carro1','pk_carro_vermelho','caminhao1']))(candidatos(banco,['pk_vei_aerocarro_turquesa','pk_vei_aerocarro_creme','pk_vei_aerocarro_rubi','pk_vei_cargueiro','pk_vei_carroca'])),1+Math.floor(r()*3),{faixa:[yRua+.3,yRua+ruaH-.3],ignorarReserva:true});
 ctx.espalhar(candidatos(banco,['planta1','planta2','arbusto','pk_arbusto_florido','arvre3']),3+Math.floor(r()*3));
}
function gerarInterior(ctx){
 const {W,H,r,f,banco,els,occ}=ctx;const E=.4;
 // paredes externas
 for(const [x,y,w,h] of [[0,0,W,E],[0,H-E,W,E],[0,0,E,H],[W-E,0,E,H]]){els.push(f.forma(x,y,w,h,{fill:'#3a3532',nome:'Parede',bloq:true}));}
 occ.marcar(0,0,W,1);occ.marcar(0,H-1,W,1);occ.marcar(0,0,1,H);occ.marcar(W-1,0,1,H);
 // divide em salas (BSP) com portas
 const salas=[];const dividir=(x,y,w,h,prof)=>{
  if(prof>3||(w<9&&h<7)||(prof>1&&r()<.25)){salas.push({x,y,w,h});return;}
  const vert=w/h>1.2?true:h/w>1.2?false:r()<.5;
  if(vert){const c=x+w*(.35+r()*.3);const porta=y+1+r()*Math.max(.1,h-3.4);
   els.push(f.forma(c-E/2,y,E,porta-y,{fill:'#3a3532',nome:'Parede',bloq:true}));els.push(f.forma(c-E/2,porta+1.4,E,y+h-porta-1.4,{fill:'#3a3532',nome:'Parede',bloq:true}));
   occ.marcar(c-.5,y,1,h);occ.marcar(c-1,porta-.2,2,1.8,0);
   dividir(x,y,c-x,h,prof+1);dividir(c,y,x+w-c,h,prof+1);}
  else{const c=y+h*(.35+r()*.3);const porta=x+1+r()*Math.max(.1,w-3.4);
   els.push(f.forma(x,c-E/2,porta-x,E,{fill:'#3a3532',nome:'Parede',bloq:true}));els.push(f.forma(porta+1.4,c-E/2,x+w-porta-1.4,E,{fill:'#3a3532',nome:'Parede',bloq:true}));
   occ.marcar(x,c-.5,w,1);occ.marcar(porta-.2,c-1,1.8,2,0);
   dividir(x,y,w,c-y,prof+1);dividir(x,c,w,y+h-c,prof+1);}
 };
 dividir(E,E,W-2*E,H-2*E,0);ctx.salas=salas; // v129: estilos usam as salas
 // porta de entrada
 const px=2+r()*(W-6);els.push(f.forma(px,H-E,1.6,E,{fill:'#7a5534',nome:'Porta',camada:1}));occ.marcar(px-.2,H-2,2,2,0);
 // mobília por sala
 const tipos=['quarto','escritorio','sala','deposito','refeitorio'];
 for(const s of salas){
  const tipo=s.w*s.h>40?escolher(r,['sala','refeitorio','escritorio']):escolher(r,tipos);
  const area={x:s.x+.6,y:s.y+.6,w:s.w-1.2,h:s.h-1.2};
  if(tipo==='refeitorio'||tipo==='deposito'||r()<.2)els.push(f.forma(s.x,s.y,s.w,s.h,{fill:tipo==='deposito'?'#6f6a62':'#b9ab92',nome:'Piso',camada:1,material:'lajota'}));
  if(r()<.6&&s.w>5&&s.h>4)ctx.espalhar(candidatos(banco,['tapete1','pk_tapete_retangular']),1,{area,ignorarReserva:true,centro:true});
  const listas={quarto:[['pk_cama_solteiro','camacasl1','camacasal2'],['planta1','cadeira1','poltronaamarela1']],escritorio:[['pk_terminal','mesa2','mesa1'],['cadeira1','cadeira2','planta2']],
   sala:[['sofacinza1','sofahippie','pk_sofa_couro','sofaazul1','sofavermeio'],['mesa3','poltronaamarela1','planta1','planta2']],deposito:[['caixa_madeira','caixa1','caixa2','pk_barril','pk_caixote_suprimentos'],['caixa_madeira','pk_barril']],
   refeitorio:[['pk_mesa_reuniao','mesa4','mesa2'],['cadeira1','cadeira3','planta2']]};
  const [a,b]=listas[tipo];
  ctx.espalhar(candidatos(banco,a),tipo==='deposito'?4:1,{area,perto:'parede'});
  ctx.espalhar(candidatos(banco,b),1+Math.floor(r()*2),{area});
  // estante como forma (madeira) encostada numa parede
  if(r()<.5&&s.w>3){els.push(f.forma(s.x+.6,s.y+.5,Math.min(3,s.w-1.2),.5,{fill:'#6b4a2c',nome:'Estante',bloq:true}));occ.marcar(s.x+.6,s.y+.5,3,1);}
 }
}
function gerarArena(ctx){
 const {W,H,r,f,banco,els,occ}=ctx;
 const tiro=ctx.variante==='tiro';
 // arquibancadas nas bordas
 for(let i=0;i<3;i++){els.push(f.forma(1,.4+i*.9,W-2,.6,{fill:'#7a5534',nome:'Arquibancada',bloq:true}));els.push(f.forma(1,H-1-i*.9,W-2,.6,{fill:'#7a5534',nome:'Arquibancada',bloq:true}));}
 occ.marcar(0,0,W,3);occ.marcar(0,H-3,W,3);
 if(tiro){
  const raias=4+Math.floor(r()*3),lh=(H-7)/raias;
  for(let i=0;i<=raias;i++)els.push(f.forma(4,3.5+i*lh-.1,W-6,.2,{fill:'#e0d9c0',nome:'Divisória',camada:1,material:'nenhum'}));
  els.push(f.forma(3.2,3.5,.5,H-7,{fill:'#5a4a3a',nome:'Balcão de tiro',bloq:true}));occ.marcar(3,3,1,H-6);
  const alvo=banco.get('boneco_treino_objeto');
  for(let i=0;i<raias;i++){const cy=3.5+i*lh+lh/2;if(alvo)els.push(f.objeto(alvo,W-3-r()*3,cy));else els.push(f.forma(W-4,cy-.4,.8,.8,{fill:'#c0392b',nome:'Alvo',kind:'circulo'}));}
 }else{
  const cx=W/2,cy=H/2,R=Math.min(W*.35,H*.3);
  els.push(f.forma(cx-R,cy-R,R*2,R*2,{fill:'#8a6a4a',nome:'Ringue',camada:1,material:'nenhum'}));
  for(const [x,y,w,h] of [[cx-R,cy-R,R*2,.25],[cx-R,cy+R-.25,R*2,.25],[cx-R,cy-R,.25,R*2],[cx+R-.25,cy-R,.25,R*2]])els.push(f.forma(x,y,w,h,{fill:'#c0392b',nome:'Corda',camada:2,visao:false}));
  occ.marcar(cx-R-1,cy-R-1,R*2+2,R*2+2,2);
  ctx.espalhar(candidatos(banco,['pk_barril','caixa_madeira','cadeira1','pk_luminaria','lampada']),6);
 }
}
const GERADORES={esgoto:gerarEsgoto,caverna:gerarCaverna,floresta:gerarFloresta,ermos:gerarErmos,cidade:gerarCidade,interior:gerarInterior,arena:gerarArena};

// ---------------------------------------------------------------- API
// objetos: lista do Banco de Objetos ({id,larguraM,alturaM,bloqueiaMovimento,...})
// v129: estilos do universo (futurista, retrofuturista, feudal galáctico): cores de parede/chão e
// móveis temáticos do pacote (pk_fut_*, pk_retro_*, pk_feu_*), quando já estão no banco.
export const ESTILOS={
 futurista:{nome:'🛰️ Futurista',bg:'#2a3038',textura:'chao_metal',parede:'#1c242e',porta:'#3fd0ff',pisos:['#3a4450','#2e3640'],ids:['pk_fut_console','pk_fut_armario','pk_fut_neon','pk_fut_mesa','pk_fut_cadeira','pk_fut_capsula'],parede_ids:['pk_fut_neon','pk_fut_armario']},
 retro:{nome:'📻 Retrofuturista',bg:'#6a5a46',textura:'lajotas',parede:'#2f5a5a',porta:'#e8743a',pisos:['#e6d6b0','#c9b98f'],ids:['pk_retro_sofa','pk_retro_luminaria','pk_retro_mesa','pk_retro_radio','pk_retro_poltrona'],parede_ids:['pk_retro_radio']},
 feudal:{nome:'👑 Feudal galáctico',bg:'#2c2630',textura:'ruinas',parede:'#3a2a30',porta:'#a8742a',pisos:['#4a3a3e','#3a2e34'],ids:['pk_feu_trono','pk_feu_braseiro','pk_feu_bau','pk_feu_mesa','pk_feu_armadura','pk_feu_estandarte'],parede_ids:['pk_feu_estandarte','pk_feu_bau']}
};
// Estilo sugerido pelo nome/local (pode ser trocado na tela do gerador).
export function sugerirEstilo(texto=''){
 const n=String(texto).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 if(/palacio|trono|tribunal|terraco|fundadores|superior|nobre|casa de|vaelkor|custodia|residencia/.test(n))return 'feudal';
 if(/mercado|feira|bar|bateria|panelas|patio|caravana|galeria|ringue|diner|taverna|loja/.test(n))return 'retro';
 if(/porto|clinica|arquivo|laborat|nave|estacao|hangar|terminal|ion|ruas escavadas/.test(n))return 'futurista';
 return '';
}
export function gerarMapa({tipo='esgoto',largura=28,altura=14,semente:sem=null,objetos=[],nome='',variante='',estilo=''}={}){
 const T=TIPOS_MAPA[tipo]||TIPOS_MAPA.esgoto,W=Math.round(largura),H=Math.round(altura);
 const seed=sem==null?Math.floor(Math.random()*1e9):Number(sem)>>>0||semente(String(sem));
 const r=rng(seed),f=fabrica(seed),els=[],occ=grade(W,H);
 const banco=new Map((objetos||[]).filter(o=>o?.id).map(o=>[String(o.id),o]));
 if(!variante&&tipo==='arena'&&/tiro|estande/i.test(nome))variante='tiro';
 const ctx={W,H,r,f,banco,els,occ,salas:[],variante,
  espalhar(lista,qtd,{area=null,perto=null,faixa=null,folga=.3,ignorarReserva=false,centro=false}={}){
   if(!lista.length)return 0;let n=0;
   for(let t=0;t<qtd*25&&n<qtd;t++){
    const m=escolher(r,lista),w=Number(m.larguraM)||1,h=Number(m.alturaM)||1,giro=w===h?Math.floor(r()*4)*90:(r()<.5?0:180);
    const A=area||{x:.5,y:.5,w:W-1,h:H-1};
    let x=centro?A.x+(A.w-w)/2:A.x+r()*Math.max(0,A.w-w),y=centro?A.y+(A.h-h)/2:A.y+r()*Math.max(0,A.h-h);
    if(faixa){y=faixa[0]+r()*Math.max(0,faixa[1]-faixa[0]-h);}
    if(x<0||y<0||x+w>W||y+h>H)continue;
    if(!ignorarReserva&&!occ.ok(x,y,w,h,folga))continue;
    if(ignorarReserva){let livre=true;for(let j=Math.floor(y);j<Math.ceil(y+h);j++)for(let i=Math.floor(x);i<Math.ceil(x+w);i++)if(occ.g[j*W+i]===1)livre=false;if(!livre)continue;}
    if(perto==='parede'){let encosta=false;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const i=Math.floor(x+w/2+dx*(w/2+.6)),j=Math.floor(y+h/2+dy*(h/2+.6));if(i<0||j<0||i>=W||j>=H||occ.g[j*W+i]===1)encosta=true;}if(!encosta&&t<qtd*18)continue;}
    els.push(f.objeto(m,x+w/2,y+h/2,{rot:giro}));occ.marcar(x,y,w,h);n++;
   }
   return n;
  }};
 (GERADORES[tipo]||gerarEsgoto)(ctx);
 const E=ESTILOS[estilo];
 if(E&&['interior','cidade','arena','esgoto'].includes(tipo)){
  let kp=0;for(const e of els){if(e.type!=='shape')continue;if(/^parede|pr[eé]dio/i.test(e.nome||''))e.fill=E.parede;else if(/^porta/i.test(e.nome||''))e.fill=E.porta;else if(/^piso/i.test(e.nome||''))e.fill=E.pisos[(kp++)%E.pisos.length];}
  // detalhes do estilo no chão: faixas de luz (futurista), tapete-passadeira carmim (feudal), ladrilhos creme/petróleo (retro)
  const salas=(ctx.salas||[]).slice().sort((a,b)=>b.w*b.h-a.w*a.h);
  if(estilo==='futurista')for(const sl of salas.slice(0,3)){els.push(f.forma(sl.x+.4,sl.y+sl.h-.6,sl.w-.8,.12,{fill:'#5ad8ff',nome:'Faixa de luz',camada:1,material:'nenhum',opacity:.85}));}
  if(estilo==='feudal'&&salas[0]){const sl=salas[0],hor=sl.w>=sl.h;els.push(f.forma(hor?sl.x+.8:sl.x+sl.w/2-.7,hor?sl.y+sl.h/2-.7:sl.y+.8,hor?sl.w-1.6:1.4,hor?1.4:sl.h-1.6,{fill:'#6a1a24',nome:'Passadeira carmim',camada:1,material:'nenhum'}));}
  if(estilo==='retro')for(const sl of salas.slice(0,2)){for(let i=0;i<Math.floor(sl.w);i+=2)els.push(f.forma(sl.x+i,sl.y+sl.h-1.2,1,1,{fill:'#2a9a9a',nome:'Ladrilho',camada:1,material:'nenhum',opacity:.55}));}
  const mods=E.ids.map(i=>banco.get(i)).filter(Boolean),deParede=E.parede_ids.map(i=>banco.get(i)).filter(Boolean);
  if(deParede.length)ctx.espalhar(deParede,Math.max(2,Math.round(W*H/120)),{perto:'parede'});
  if(mods.length)ctx.espalhar(mods,Math.max(3,Math.round(W*H/80)));
 }
 return {w:W,h:H,ppm:40,bg:E&&['interior','arena'].includes(tipo)?E.bg:T.bg,texture:E&&['interior','arena'].includes(tipo)?E.textura:T.textura,estiloV129:E?estilo:'',showGrid:true,grid:'#6e6e6e',name:nome||T.nome.replace(/^\S+\s/,''),formatoObjetos:'refs-v1',elements:els,geradoV110:{tipo,semente:seed,variante}};
}
export function resumoMapa(state){
 const c={paredes:0,formas:0,objetos:0};for(const e of state?.elements||[]){if(e.type==='object')c.objetos++;else if(e.bloqueiaMovimento)c.paredes++;else c.formas++;}return c;
}

// ---------------------------------------------------------------- v132: taverna retrofuturista com quartos-cápsula
// Salão com balcão (atendido por um robô), mesas bumerangue, jukebox e sala de estar; depósito com armário;
// corredor com 6 quartos-cápsula de aluguel atrás de portas deslizantes. Usa os móveis do pacote v129.
export function gerarTaverna({objetos=[],nome='Taverna',largura=28,altura=14}={}){
 const W=largura,H=altura,f=fabrica(1320),els=[],E=.4,banco=new Map((objetos||[]).filter(o=>o?.id).map(o=>[String(o.id),o]));
 const P='#2f5a5a',parede=(x,y,w,h)=>els.push(f.forma(x,y,w,h,{fill:P,nome:'Parede',bloq:true}));
 const obj=(id,cx,cy,o={})=>{const m=banco.get(id);if(m){const e=f.objeto(m,cx,cy,o);if(o.nome){e.nome=o.nome;e.name=o.nome;}els.push(e);return e;}return null;};
 const forma=(x,y,w,h,o)=>els.push(f.forma(x,y,w,h,o));
 // piso: creme no salão, xadrez petróleo na pista, metal no corredor das cápsulas
 forma(E,E,18.1-E,H-2*E,{fill:'#e6d6b0',nome:'Piso do salão',camada:1,material:'lajota'});
 for(let i=0;i<6;i++)for(let j=0;j<3;j++)if((i+j)%2===0)forma(5.5+i*1.2,8.2+j*1.2,1.2,1.2,{fill:'#2a9a9a',nome:'Ladrilho',camada:1,material:'nenhum',opacity:.55});
 forma(18.5,E,W-18.5-E,H-2*E,{fill:'#3a4450',nome:'Piso metálico',camada:1,material:'metal'});
 // paredes externas (entrada no sul) e divisória com porta para o corredor
 parede(0,0,W,E);parede(0,0,E,H);parede(W-E,0,E,H);parede(0,H-E,4.6,E);parede(6.4,H-E,W-6.4,E);
 forma(4.6,H-E,1.8,E,{fill:'#e8743a',nome:'Porta de entrada',camada:1});
 parede(18.1,0,E,5.9);parede(18.1,8.1,E,H-8.1);
 obj('pk_fut_porta',18.3,7,{rot:90,nome:'Porta do corredor das cápsulas'});
 // balcão do bar, prateleira e banquetas
 forma(3,2.3,10,1,{fill:'#2a9a9a',nome:'Balcão do bar',bloq:true,material:'metal'});forma(3,2.3,10,.22,{fill:'#e8743a',nome:'Borda do balcão',camada:3,material:'metal'});
 forma(1.2,E+.1,12.6,.8,{fill:'#5a3a2a',nome:'Prateleira de bebidas',bloq:true,material:'madeira'});
 obj('pk_fut_neon',7.5,E+.15);
 for(let i=0;i<6;i++)obj('pk_fut_cadeira',4.2+i*1.6,4,{nome:'Banqueta'});
 obj('pk_fut_console',14.2,1.4,{nome:'Caixa registradora de UR-17'});
 // mesas, poltronas, jukebox, sala de estar
 for(const [x,y] of [[3.6,7.2],[3.6,11],[11.6,6.9],[11.6,10.9]]){obj('pk_retro_mesa',x,y);obj('pk_retro_poltrona',x-1.6,y);obj('pk_retro_poltrona',x+1.6,y);}
 obj('pk_retro_radio',16.9,6.2,{nome:'Jukebox'});obj('pk_retro_luminaria',8.6,12.2);obj('pk_retro_luminaria',1.3,4.8);
 obj('pk_retro_sofa',15.4,12.3);obj('pk_retro_poltrona',16.6,10.2);
 // armário de suprimentos encostado na divisória
 obj('pk_fut_armario',17.6,3.4,{rot:90,nome:'Armário de suprimentos'});obj('pk_retro_luminaria',16.4,1.4);
 // corredor das cápsulas: 3 em cima, 3 embaixo, cada uma com porta deslizante
 const cw=(W-E-18.5)/3;
 for(let i=0;i<3;i++){
  const x=18.5+i*cw;
  if(i)parede(x-E/2,E,E,5.5),parede(x-E/2,8.5,E,H-E-8.5);
  parede(x,5.5,(cw-1.7)/2,E);parede(x+(cw+1.7)/2,5.5,(cw-1.7)/2,E);
  parede(x,8.5,(cw-1.7)/2,E);parede(x+(cw+1.7)/2,8.5,(cw-1.7)/2,E);
  obj('pk_fut_porta',x+cw/2,5.7,{nome:`Porta da cápsula ${i+1}`});obj('pk_fut_porta',x+cw/2,8.7,{nome:`Porta da cápsula ${i+4}`});
  obj('pk_fut_capsula',x+cw/2,2.9,{rot:90,nome:`Cápsula de aluguel ${i+1}`});obj('pk_fut_capsula',x+cw/2,11.2,{rot:90,nome:`Cápsula de aluguel ${i+4}`});
  obj('pk_fut_neon',x+cw/2,6.3,{nome:'Luz do corredor'});
 }
 return {w:W,h:H,ppm:40,bg:'#6a5a46',texture:'lajotas',showGrid:true,grid:'#6e6e6e',name:nome,formatoObjetos:'refs-v1',elements:els,estiloV129:'retro',tavernaV132:true,geradoV110:{tipo:'interior',semente:1320,variante:'taverna'}};
}

// ---------------------------------------------------------------- v138: Véspera — espaço-porto, portão no pico e ruas escavadas
// Véspera cresceu num pico rochoso (um oásis) no meio de desertos de areia branca, às vezes multicolorida.
const AREIAS=['#efe6cf','#e9dcc0','#f2e9d6'],VEIOS=['#e8b0a8','#c0b0e0','#e8c080','#a8d0c8','#f0c0d8'];
// v141: chão de deserto com os pincéis de textura (como nos mapas feitos à mão): sombra das dunas, ondulações do vento,
// grãos claros/escuros, poucos grãos coloridos (areia multicolorida) e cascalho perto das pedras.
function rabisco(r,x,y,comp,ang,passos=8){const pts=[];let a=ang;for(let i=0;i<=passos;i++){pts.push([x,y]);a+=(r()-.5)*.5;x+=Math.cos(a)*comp/passos;y+=Math.sin(a)*comp/passos;}return pts;}
function areiaDoDeserto(ctx,{dunas=6,veios=10,area=null}={}){
 const {W,H,r,f,els}=ctx,A=area||{x:0,y:0,w:W,h:H},dentro=([x,y])=>[Math.max(A.x,Math.min(A.x+A.w,x)),Math.max(A.y,Math.min(A.y+A.h,y))];
 const k=Math.max(1,A.w*A.h/1568); // escala pela área (56×28 = 1)
 const ponto=()=>[A.x+r()*A.w,A.y+r()*A.h];
 // sombras e luzes suaves das dunas (fumaça larga)
 for(let i=0;i<Math.round(dunas*2*k);i++){const [x,y]=ponto(),cor=i%3?'#b8945e':'#fff4dc';els.push(f.pincel(rabisco(r,x,y,6+r()*10,(r()-.5)*.6,10).map(dentro),{brush:'fumaca',cor,largura:1.4+r()*1.2,nome:'Sombra de duna'}));}
 // ondulações do vento (ranhuras finas)
 for(let i=0;i<Math.round(14*k);i++){const [x,y]=ponto();els.push(f.pincel(rabisco(r,x,y,2.5+r()*4,-.25+(r()-.5)*.3,6).map(dentro),{brush:'ranhura',cor:'#a8865a',largura:.25,opac:.35,nome:'Ondulação da areia'}));}
 // grãos claros e escuros
 for(let i=0;i<Math.round(26*k);i++){const [x,y]=ponto();els.push(f.pincel(rabisco(r,x,y,1.5+r()*3,r()*6.28,5).map(dentro),{brush:'areia',cor:i%2?'#8a6e46':'#fffaf0',largura:.3+r()*.3,nome:'Grãos de areia'}));}
 // areia colorida: poucos grãos, discretos
 for(let i=0;i<Math.round(veios*.8*k);i++){const [x,y]=ponto();els.push(f.pincel(rabisco(r,x,y,1.2+r()*2.2,r()*6.28,4).map(dentro),{brush:'areia',cor:escolher(r,['#c9706a','#8a76c0','#5a9a8a','#d9a03a']),largura:.25+r()*.2,opac:.8,nome:'Grãos coloridos'}));}
 // cascalho espalhado
 for(let i=0;i<Math.round(8*k);i++){const [x,y]=ponto();els.push(f.pincel(rabisco(r,x,y,1+r()*2,r()*6.28,4).map(dentro),{brush:'cascalho',cor:'#6e5e48',largura:.35,nome:'Cascalho'}));}
}
function objRef(ctx,id,cx,cy,o={}){const m=ctx.banco.get(id);if(!m)return null;const e=ctx.f.objeto(m,cx,cy,o);if(o.nome){e.nome=o.nome;e.name=o.nome;}ctx.els.push(e);const w=(Number(m.larguraM)||1)*(o.escala||1),h=(Number(m.alturaM)||1)*(o.escala||1);ctx.occ.marcar(cx-w/2,cy-h/2,w,h,o.reserva??1);return e;}
function novoCtx(W,H,seed,objetos){const r=rng(seed),f=fabrica(seed),els=[],occ=grade(W,H),banco=new Map((objetos||[]).filter(o=>o?.id).map(o=>[String(o.id),o]));
 const ctx={W,H,r,f,banco,els,occ,salas:[]};
 ctx.espalhar=(lista,qtd,{area=null,folga=.3}={})=>{if(!lista.length)return 0;let n=0;for(let t=0;t<qtd*25&&n<qtd;t++){const m=escolher(r,lista),w=Number(m.larguraM)||1,h=Number(m.alturaM)||1,A=area||{x:.5,y:.5,w:W-1,h:H-1};
  const x=A.x+r()*Math.max(0,A.w-w),y=A.y+r()*Math.max(0,A.h-h);if(x<0||y<0||x+w>W||y+h>H||!occ.ok(x,y,w,h,folga))continue;els.push(f.objeto(m,x+w/2,y+h/2,{rot:w===h?Math.floor(r()*4)*90:(r()<.5?0:180)}));occ.marcar(x,y,w,h);n++;}return n;};
 return ctx;}
const estadoDe=(ctx,nome,extra={})=>({w:ctx.W,h:ctx.H,ppm:40,bg:extra.bg||'#e9dcc0',texture:extra.texture||'areia',showGrid:true,grid:'#9a8a6a',name:nome,formatoObjetos:'refs-v1',elements:ctx.els,estiloV129:'retro',...extra.marca});

// Espaço-porto (84×42 m): plataformas, a nave do grupo, outras naves, torre, hangar e terminal.
export const SAIDAS_ESPACOPORTO={portao:{x:27.2,y:7}}; // normalizado 28×14 (borda leste)
export function gerarEspacoporto({objetos=[],nome='Espaço-porto de Véspera'}={}){
 const W=84,H=42,ctx=novoCtx(W,H,1380,objetos),{f,els,occ,r}=ctx;
 areiaDoDeserto(ctx,{dunas:9,veios:14});
 // pátio de pouso e via até o portão (leste)
 els.push(f.forma(2,2,48,38,{fill:'#cfc6b0',nome:'Pátio de pouso',camada:1,material:'nenhum',radius:3,opacity:.9}));
 els.push(f.forma(48,19,36,4,{fill:'#bdb39a',nome:'Via do portão',camada:1,material:'nenhum'}));
 for(let x=50;x<W;x+=5)els.push(f.forma(x,20.85,2.2,.3,{fill:'#2a9a9a',nome:'Baliza da via',camada:1,material:'nenhum',opacity:.8}));
 occ.marcar(48,19,36,4,2);
 const pads=[[14,11],[38,11],[14,31],[38,31]];
 for(const [x,y] of pads)objRef(ctx,'pk_plataforma_pouso',x,y,{escala:.6,reserva:2});
 objRef(ctx,'pk_nave_grupo',14,11,{nome:'Nave do grupo',escala:.75});
 objRef(ctx,'pk_nave_cargueiro_ferrugem',38,11,{escala:.75});
 objRef(ctx,'pk_nave_disco',14,31,{escala:1.1});
 objRef(ctx,'pk_nave_caca',38,31,{escala:1});
 // lado leste: hangar, terminal, torre e o transporte grande
 els.push(f.forma(60,2,22,13,{fill:'#8a7a62',nome:'Hangar',bloq:true,radius:5,material:'metal'}));occ.marcar(60,2,22,13);
 for(let i=1;i<6;i++)els.push(f.forma(60+i*22/6-.1,2.4,.2,12.2,{fill:'#6a5a46',nome:'Nervura do hangar',camada:3,material:'nenhum'}));
 els.push(f.forma(64,14.6,10,.5,{fill:'#e8743a',nome:'Portão do hangar',camada:3,material:'metal'}));
 els.push(f.forma(62,24,20,8,{fill:'#c9b98f',nome:'Terminal de passageiros',bloq:true,radius:3}));occ.marcar(62,24,20,8);
 els.push(f.forma(70,23.6,3,.5,{fill:'#2a9a9a',nome:'Porta do terminal',camada:1}));
 for(const cx of [66,74,79])els.push(f.forma(cx-1.6,26.4,3.2,3.2,{fill:'#e6d6b0',nome:'Cúpula',kind:'elipse',camada:3,material:'nenhum',opacity:.9}));
 objRef(ctx,'pk_torre_controle',54,29);
 objRef(ctx,'pk_nave_transporte',66,37,{escala:.55});
 // veículos, carga e combustível
 for(const [id,x,y] of [['pk_vei_aerocarro_turquesa',56,16],['pk_vei_aerocarro_creme',60,17],['pk_vei_cargueiro',29,21],['pk_vei_carroca',55,24.5],['pk_vei_aerocarro_rubi',78,17]])objRef(ctx,id,x,y);
 for(const [x,y] of [[26,4],[27.4,4],[26,5.4],[48,36],[49.4,36],[48,37.4],[3.5,21],[3.5,22.4]])objRef(ctx,'pk_barril',x,y);
 for(const [x,y] of [[24,17],[25.3,17],[24,18.3],[46,25],[47.3,25],[30,38],[31.4,38]])objRef(ctx,escolher(r,['caixa_madeira','pk_caixote_suprimentos','caixa1']),x,y);
 ctx.espalhar([...['avrepalmeira','arvrepalmeira2'].map(i=>ctx.banco.get(i)).filter(Boolean)],4,{area:{x:50,y:33,w:12,h:8}});
 ctx.espalhar(['pk_pedra_grande','predranova2','predragay1','redragay2','pk_pedra_pequena'].map(i=>ctx.banco.get(i)).filter(Boolean),12,{area:{x:50,y:2,w:10,h:16}});
 ctx.espalhar(['pk_luminaria','lampada'].map(i=>ctx.banco.get(i)).filter(Boolean),6,{area:{x:2,y:19,w:46,h:4}});
 return estadoDe(ctx,nome,{marca:{espacoportoV138:true,geradoV110:{tipo:'ermos',semente:1380,variante:'espacoporto'}}});
}

// Portão de Véspera (56×28 m): o pico de rocha ao norte com o portão; barracas de comerciantes na frente; trilha para o espaço-porto (oeste).
export const PORTAO={gateX:28,larg:7}; // metros
// v160: barracas em que se entra (metros, canto de cima à esquerda). vendedor = onde fica o comerciante; especie = quem vende
export const LOJAS_PORTAO=[
 {id:'agua',nome:'Água e comida da travessia',x:3,y:12.6,w:7,h:5.4,tenda:'pk_barraca_acafrao',lona:'#d9a63a',mercadorias:['pk_banca_panelas','pk_barril'],especie:'insetoide'},
 {id:'pecas',nome:'Peças e sucata',x:12.2,y:15.4,w:7,h:5.4,tenda:'pk_barraca_anil',lona:'#3a5a9a',mercadorias:['pk_caixote_suprimentos','pk_caixote_suprimentos'],especie:'robo'},
 {id:'armas',nome:'Armas e equipamento',x:36.8,y:15.4,w:7,h:5.4,tenda:'pk_barraca_rubra',lona:'#c9452a',mercadorias:['pk_caixote_suprimentos','pk_barril'],especie:'reptiliano'},
 {id:'cristais',nome:'Cristais e curiosidades',x:46,y:12.6,w:7,h:5.4,tenda:'pk_barraca_anil',lona:'#3a5a9a',mercadorias:['pk_cristal_azul','pk_caixote_suprimentos'],especie:'grey'}
].map(L=>({...L,vendedor:{x:L.x+L.w/2,y:L.y+1.05}}));
export const CARAVANAS_PORTAO=[
 {id:'oeste',carroca:{x:19,y:21.6},fardos:[[-2.8,1.2],[2.9,1.1]],bebedouro:{x:14.6,y:19.4},dragoes:[{x:16,y:21},{x:15.4,y:23},{x:22.8,y:20.6}],caravaneiro:{x:21.4,y:23.6,especie:'humano'}},
 {id:'leste',carroca:{x:36,y:24.6},fardos:[[2.9,1.1]],bebedouro:{x:34,y:21.6},dragoes:[{x:39.8,y:23},{x:33.2,y:26.2}],caravaneiro:{x:37,y:22.4,especie:'zutariano'}}
];
function lojaDeFeira(ctx,L){
 const {f,els,occ}=ctx,{x,y,w,h}=L,cx=x+w/2,lona=L.lona||'#c9452a';
 els.push(f.forma(x+.2,y+.2,w-.4,h-.4,{fill:'#c9a87a',nome:'Chão da barraca · '+L.nome,camada:1,material:'nenhum'}));
 {const t=ctx.banco.get('pk_tapete_retangular');if(t){const e=f.objeto(t,cx,y+h-1.4,{escala:1.2});Object.assign(e,{camada:1,bloqueiaMovimento:false,nome:'Tapete',name:'Tapete'});els.push(e);}}
 for(const [px,py,pw,ph] of [[x,y,w,.3],[x,y,.3,h],[x+w-.3,y,.3,h],[x,y+h-.3,1.4,.3],[x+w-1.4,y+h-.3,1.4,.3]])els.push(f.forma(px,py,pw,ph,{fill:lona,nome:'Lona da barraca',bloq:true,material:'tecido'}));
 const est=ctx.banco.get('pk_estante_arquivo');if(est){const e=f.objeto(est,cx,y+.7);Object.assign(e,{nome:'Prateleira de mercadorias',name:'Prateleira de mercadorias'});els.push(e);}
 const bal=ctx.banco.get('pk_mesa_longa');if(bal){const e=f.objeto(bal,cx,y+2.3,{escala:1.3});Object.assign(e,{nome:'Balcão · '+L.nome,name:'Balcão · '+L.nome,bloqueiaMovimento:true});els.push(e);}
 (L.mercadorias||[]).forEach((id,i)=>{const m=ctx.banco.get(id);if(!m)return;const e=f.objeto(m,cx+(i?1.2:-1.2),y+2.3,{escala:.45});Object.assign(e,{nome:'Mercadorias · '+L.nome,name:'Mercadorias · '+L.nome,camada:4,bloqueiaMovimento:false});els.push(e);});
 const t=ctx.banco.get(L.tenda||'pk_barraca_rubra');
 if(t){const e=f.objeto(t,cx,y+h/2);Object.assign(e,{x:+(x-.25).toFixed(2),y:+(y-.25).toFixed(2),w:+(w+.5).toFixed(2),h:+(h+.5).toFixed(2),nome:'Telhado · '+L.nome,name:'Telhado · '+L.nome,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,locked:true,tetoV139:true,lojaV160:L.id});els.push(e);}
 occ.marcar(x-.5,y-.5,w+1,h+1.5,2);
}
export const SAIDAS_PORTAO={espacoporto:{x:.8,y:11},ruas:{x:14,y:.8}};
export function gerarPortaoVespera({objetos=[],nome='Portão de Véspera'}={}){
 const W=56,H=28,ctx=novoCtx(W,H,1381,objetos),{f,els,occ,r}=ctx;
 areiaDoDeserto(ctx,{dunas:6,veios:10});
 // paredão do pico: borda irregular, com o corredor do portão no meio
 const g0=PORTAO.gateX-PORTAO.larg/2,g1=PORTAO.gateX+PORTAO.larg/2,sol=new Uint8Array(W*H);let borda=8;
 const bordaEm=[];for(let x=0;x<W;x++){borda=Math.max(6,Math.min(10,borda+(r()<.5?-1:1)*(r()<.6?1:0)));bordaEm.push(x>=g0-3&&x<g1+3?9:borda);}
 for(let x=0;x<W;x++)for(let y=0;y<bordaEm[x];y++){if(x>=g0+.5&&x<g1-.5)continue;sol[y*W+x]=1;}
 for(const q of retangulosDeCelulas(sol,W,H)){els.push(f.forma(q.x,q.y,q.w,q.h,{fill:'#a8927a',nome:'Rocha do pico',bloq:true,material:'rocha'}));occ.marcar(q.x,q.y,q.w,q.h);}
 // sombreado da encosta e árvores do oásis no alto do pico
 for(let x=0;x<W;x+=2)if(!(x>=g0&&x<g1))els.push(f.forma(x,bordaEm[x]-1.1,2,1.1,{fill:'#7a6650',nome:'Encosta',camada:3,material:'nenhum',opacity:.6}));
 els.push(f.forma(g0+.5,0,g1-g0-1,9,{fill:'#8a7a66',nome:'Rampa escavada',camada:1,material:'nenhum'}));
 {const esc=ctx.banco.get('pk_escada');if(esc)for(const y of [2.2,5.6]){const e=f.objeto(esc,PORTAO.gateX,y,{rot:270,escala:1.6});Object.assign(e,{nome:'Degraus da subida para Véspera',name:'Degraus da subida para Véspera',camada:1,bloqueiaMovimento:false});els.push(e);}} // v141: escadaria até a cidade
 for(const [id,x,y] of [['avrepalmeira',5,2.5],['arvrepalmeira2',11,3.5],['pk_arvore_alienigena',17,2.5],['avrepalmeira',38,2.2],['arvrepalmeira2',45,3.2],['pk_arvore_florida',51,2.6]]){const m=ctx.banco.get(id);if(m)els.push(f.objeto(m,x,y,{escala:.8}));}
 // portão (trancado) com braseiros e guarita
 objRef(ctx,'pk_portao_vespera',PORTAO.gateX,9.3,{nome:'Portão de Véspera'});
 objRef(ctx,'pk_feu_braseiro',g0-1.2,10.6);objRef(ctx,'pk_feu_braseiro',g1+1.2,10.6);
 els.push(f.forma(g1+3,9.2,3,2.4,{fill:'#6a5a46',nome:'Guarita',bloq:true,radius:.6,material:'pedra'}));occ.marcar(g1+3,9.2,3,2.4);
 objRef(ctx,'pk_fut_console',g1+4.5,12.4,{nome:'Terminal da guarita'});
 // rua livre diante do portão (para a fila)
 occ.marcar(g0,10,g1-g0,H-10,2);
 // v160: barracas em que se ENTRA — lona dos lados e no fundo, frente aberta, balcão com mercadorias, prateleira
 // e o telhado de lona que se abre quando um jogador entra. O comerciante fica atrás do balcão (posto pelo mestre).
 for(const L of LOJAS_PORTAO)lojaDeFeira(ctx,L);
 // barracas pequenas fechadas (só enfeite) mais para baixo
 const tendas=['pk_barraca_rubra','pk_barraca_anil','pk_barraca_acafrao'];let k=0;
 for(const [x,y] of [[44,24],[49,21.5]]){objRef(ctx,tendas[k++%3],x,y);objRef(ctx,escolher(r,['caixa_madeira','pk_barril','pk_caixote_suprimentos']),x-2.3,y+1.4);}
 // v160: caravanas paradas, com os dragões-trombeta de carga (sem asas) — as miniaturas dos dragões o mestre põe
 for(const C of CARAVANAS_PORTAO){objRef(ctx,'pk_vei_carroca',C.carroca.x,C.carroca.y,{nome:'Carroça da caravana'});
  for(const [dx,dy] of C.fardos)objRef(ctx,escolher(r,['pk_caixote_suprimentos','pk_barril','caixa_madeira']),C.carroca.x+dx,C.carroca.y+dy,{nome:'Fardos da caravana'});
  els.push(f.forma(C.bebedouro.x,C.bebedouro.y,2.2,.8,{fill:'#5a7a8a',nome:'Bebedouro dos dragões',bloq:true,radius:.3,material:'pedra'}));occ.marcar(C.bebedouro.x,C.bebedouro.y,2.2,.8);}
 // trilha até o espaço-porto (borda oeste) e veículos parados
 els.push(f.caminho([[g0+3,26],[20,25.5],[10,23.5],[4,22.4],[-1,22]],{cor:'#d8c8a4',largura:3,nome:'Trilha do espaço-porto',opac:.8}));
 objRef(ctx,'pk_vei_carroca',30,25.5);objRef(ctx,'pk_vei_cargueiro',52,25);objRef(ctx,'pk_vei_aerocarro_creme',4,26);
 ctx.espalhar(['pk_pedra_grande','predranova2','predranova3','predragay1','redragay2','pk_pedra_pequena'].map(i=>ctx.banco.get(i)).filter(Boolean),9,{area:{x:1,y:11,w:W-2,h:16}});
 ctx.espalhar(['arbusto','galhoseco1','esqueletos1'].map(i=>ctx.banco.get(i)).filter(Boolean),4,{area:{x:1,y:12,w:W-2,h:15}});
 return estadoDe(ctx,nome,{marca:{portaoV138:true,geradoV110:{tipo:'ermos',semente:1381,variante:'portao'}}});
}


// ---------------------------------------------------------------- v161: Portão de Véspera pintado (arte em arte/mapas/portao-vespera.webp)
// 45×34 m: paredão de pedra no alto com a rampa do portão (x 24,5–31,5), acampamento das caravanas na areia a oeste
// e a cidade baixa diante do portão (imagem com grade de 1 m, a partir de x=6, y=8). As casas da imagem são marcadas
// por cima com blocos invisíveis; quatro delas são lojas em que se entra (paredes com porta, balcão e comerciante).
export const ENTRADA_V161={arte:'arte/mapas/portao-vespera.webp',W:45,H:34,IX:6,IY:8,gateX:28,gateY:7.7,
 predios:[[0,1.9,6.0,7.0],[4.9,0,6.9,0.9],[6.9,1.9,9.9,6.0,'s'],[10.9,3.9,14.0,6.6],[11.2,6.6,18.0,12.8],[0,8.9,1.9,15.0],[16.0,0,19.9,4.9],[24.0,0,29.0,2.9],[26,2.9,29,5.9],[20.0,6.9,25.9,13.0,'o'],[29.9,4.9,33.0,9.9,'s'],[34.9,0,39,5.0],[35.9,6.0,39,10.0],[28.0,12.0,33.0,16.0],[34.0,12.0,38.0,18.0],[3.0,13.0,6.9,20.0],[6.9,13.9,9.9,17.0],[10.9,14.9,13.0,17.0],[0,21.5,4.8,26],[12.0,21.0,18.0,26.0],[18.9,16.9,25.9,21.0,'n'],[18.9,22.8,23.9,26],[26.0,17.0,30.0,23.0],[31.9,20.9,36.8,26]],
 lojas:{'6.9,1.9':{id:'agua',nome:'Água e comida da travessia',especie:'insetoide'},'20,6.9':{id:'pecas',nome:'Peças e sucata',especie:'robo'},'29.9,4.9':{id:'cristais',nome:'Cristais e curiosidades',especie:'grey'},'18.9,16.9':{id:'armas',nome:'Armas e equipamento',especie:'reptiliano'}},
 caravanas:[{id:'oeste',carroca:{x:3,y:14.5,rot:90},fardos:[[1.9,-2.6],[-1.6,2.8]],dragoes:[{x:1.2,y:11.6},{x:4.9,y:17.6},{x:1.3,y:18.4}],caravaneiro:{x:4.7,y:12,especie:'humano'}},
            {id:'leste',carroca:{x:3,y:24,rot:90},fardos:[[1.8,2.8]],dragoes:[{x:1.1,y:21.4},{x:4.9,y:21.2}],caravaneiro:{x:1.2,y:26.6,especie:'zutariano'}}],
 saidas:{ruas:{x:28,y:.8},espacoporto:{x:.8,y:28.8}},
 denzel:{x:29.4,y:10.2}
};
// metros → coordenadas da mesa (28×14)
export const paraMesaV161=(p,{W,H}=ENTRADA_V161)=>({x:+(p.x*28/W).toFixed(3),y:+(p.y*14/H).toFixed(3)});
export function portaoNV161(E=ENTRADA_V161){const c=paraMesaV161({x:E.gateX,y:E.gateY},E),d=paraMesaV161({x:E.gateX,y:E.gateY-2},E),f=paraMesaV161({x:E.gateX,y:E.gateY+2.6},E);return {x:c.x,y:c.y,dentro:d,fora:f};}
// porta (vão de 1,4 m) no meio do lado indicado
function paredesComPorta(x0,y0,x1,y1,lado,esp=.35,vao=1.4){
 const cx=(x0+x1)/2,cy=(y0+y1)/2,out=[];
 const h=(y,ab)=>ab?[[x0,y,cx-vao/2-x0,esp],[cx+vao/2,y,x1-(cx+vao/2),esp]]:[[x0,y,x1-x0,esp]];
 const v=(x,ab)=>ab?[[x,y0,esp,cy-vao/2-y0],[x,cy+vao/2,esp,y1-(cy+vao/2)]]:[[x,y0,esp,y1-y0]];
 out.push(...h(y0,lado==='n'),...h(y1-esp,lado==='s'),...v(x0,lado==='o'),...v(x1-esp,lado==='l'));
 return out;
}
export function gerarEntradaVespera({objetos=[],nome='Portão de Véspera'}={}){
 const E=ENTRADA_V161,{W,H,IX,IY}=E,ctx=novoCtx(W,H,1611,objetos),{f,els,occ,r}=ctx;
 const inv=(x,y,w,h,nome,visao=true)=>{const e=f.forma(x,y,w,h,{fill:'#3a2a1a',nome,bloq:true,opacity:0,material:'pedra',visao});e.invisivelV161=true;els.push(e);occ.marcar(x,y,w,h);return e;};
 // arte de fundo (uma imagem só, cobrindo o mapa inteiro)
 els.push({id:'img:gen1611:arte',type:'image',src:E.arte,name:'Pintura do chão',nome:'Pintura do chão',x:0,y:0,w:W,h:H,rot:0,z:0,locked:true,opacity:1,camada:0,bloqueiaMovimento:false,bloqueiaVisao:false,fundoV161:true});
 // paredão (bloqueia) dos dois lados da rampa, e as paredes da rampa
 const g0=E.gateX-3.5,g1=E.gateX+3.5;
 inv(0,0,g0,E.gateY-.1,'Paredão do pico');inv(g1,0,W-g1,E.gateY-.1,'Paredão do pico');
 inv(g0,0,.45,E.gateY,'Parede da rampa');inv(g1-.45,0,.45,E.gateY,'Parede da rampa');
 // portão (trancado), braseiros e degraus
 objRef(ctx,'pk_portao_vespera',E.gateX,E.gateY-.6,{nome:'Portão de Véspera'});
 objRef(ctx,'pk_feu_braseiro',g0-1,E.gateY+.9);objRef(ctx,'pk_feu_braseiro',g1+1,E.gateY+.9);
 {const esc=ctx.banco.get('pk_escada');if(esc)for(const y of [1.6,4.2]){const e=f.objeto(esc,E.gateX,y,{rot:270,escala:1.6});Object.assign(e,{nome:'Degraus da subida para Véspera',name:'Degraus da subida para Véspera',camada:1,bloqueiaMovimento:false,opacity:0,invisivelV161:true});els.push(e);}}
 objRef(ctx,'pk_fut_console',g1+2.6,E.gateY+1.1,{nome:'Terminal da guarita'});
 // fonte colada na rocha, no acampamento
 {const m=ctx.banco.get('pk_fonte_praca');if(m){const e=f.objeto(m,3,9.6,{escala:.62});Object.assign(e,{nome:'Fonte do oásis',name:'Fonte do oásis'});els.push(e);occ.marcar(1.4,8,3.2,3.2);}}
 // casas da imagem
 for(const pr of E.predios){
  const [a,b,c,d,lado]=pr,x0=a+IX,y0=b+IY,x1=c+IX,y1=d+IY,loja=E.lojas[`${a},${b}`];
  if(!lado||!loja){inv(x0,y0,x1-x0,y1-y0,'Casa');continue;}
  for(const [x,y,w,h] of paredesComPorta(x0,y0,x1,y1,lado))inv(x,y,w,h,'Parede · '+loja.nome);
  // balcão do lado oposto à porta, comerciante entre o balcão e a parede do fundo
  const cx=(x0+x1)/2,cy=(y0+y1)/2,bal=ctx.banco.get('pk_mesa_longa');
  // comerciante a 0,95 m da parede do fundo; balcão 1,5 m à frente dele (sobra corredor de ~1 m para ele)
  const fundo={n:{x:cx,y:y1-.95},s:{x:cx,y:y0+.95},o:{x:x1-.95,y:cy},l:{x:x0+.95,y:cy}}[lado],balP={n:{x:cx,y:y1-2.5},s:{x:cx,y:y0+2.5},o:{x:x1-2.5,y:cy},l:{x:x0+2.5,y:cy}}[lado];
  const interno=(lado==='o'||lado==='l'?y1-y0:x1-x0)-.9,esc=Math.max(.5,Math.min(1.1,interno/3));
  if(bal){const e=f.objeto(bal,balP.x,balP.y,{escala:esc,rot:lado==='o'||lado==='l'?90:0});Object.assign(e,{nome:'Balcão · '+loja.nome,name:'Balcão · '+loja.nome,bloqueiaMovimento:true});els.push(e);}
  loja.vendedor=fundo;loja.porta={n:{x:cx,y:y0-.8},s:{x:cx,y:y1+.8},o:{x:x0-.8,y:cy},l:{x:x1+.8,y:cy}}[lado];
 }
 // caravanas no acampamento
 for(const C of E.caravanas){objRef(ctx,'pk_vei_carroca',C.carroca.x,C.carroca.y,{nome:'Carroça da caravana',rot:C.carroca.rot||0});
  for(const [dx,dy] of C.fardos)objRef(ctx,escolher(r,['pk_caixote_suprimentos','pk_barril','caixa_madeira']),C.carroca.x+dx,C.carroca.y+dy,{nome:'Fardos da caravana'});}
 // trilha para o espaço-porto
 els.push(f.caminho([[-1,E.saidas.espacoporto.y],[3,E.saidas.espacoporto.y-.4],[IX+1.2,E.saidas.espacoporto.y-.8]],{cor:'#d8c8a4',largura:2.2,nome:'Trilha do espaço-porto',opac:.55}));
 return {w:W,h:H,ppm:40,bg:'#c49a52',texture:'nenhuma',showGrid:false,grid:'#9a8a6a',name:nome,formatoObjetos:'refs-v1',elements:els,estiloV129:'pintado',portaoV138:true,entradaV161:true,
  geradoV110:{tipo:'ermos',semente:1611,variante:'portao-pintado'},portaoN:portaoNV161(E)};
}


// ---------------------------------------------------------------- v162: Portão de Véspera com o kit do deserto (arte nossa)
// Chão pintado por nós (areia, praça de lajes, ruas de terra batida, paredão com a rampa: arte/mapas/portao-vespera-chao.webp,
// gerado por arte-fonte/chao.py a partir de arte-fonte/layout_portao.json) e casas/lojas/toldos/varais/agaves como OBJETOS
// do kit (o mestre pode mover, trocar, apagar). Casas de formato redondo/losango/L têm colisão pela forma.
export const PORTAO_V162={"W": 45, "H": 34, "gateX": 28, "gateY": 7.7, "praca": [19.5, 9.2, 37, 20.2], "ruas": [[[28, 9], [28, 20.5], [22, 21], [21, 27.2], [14, 27.4], [8, 28.8], [0, 29]], [[28, 20.5], [31.2, 26.6], [37, 26.4], [44, 26.2]], [[37, 15.5], [44.5, 15.2]], [[13, 15], [8, 15.2], [4, 14.5]]], "lojas": [{"id": "agua", "nome": "Água e comida da travessia", "especie": "insetoide", "x": 13, "y": 9.5, "w": 6, "h": 5, "porta": "l"}, {"id": "pecas", "nome": "Peças e sucata", "especie": "robo", "x": 37.5, "y": 9.5, "w": 6, "h": 5, "porta": "o"}, {"id": "armas", "nome": "Armas e equipamento", "especie": "reptiliano", "x": 14, "y": 21, "w": 6, "h": 5, "porta": "n"}, {"id": "cristais", "nome": "Cristais e curiosidades", "especie": "grey", "x": 32, "y": 20.6, "w": 6, "h": 5, "porta": "n"}], "casas": [["pk_casa_cupula", 23.6, 21.4], ["pk_casa_l", 7.9, 15.6], ["pk_casa_redonda", 8.6, 23.4], ["pk_casa_ret", 14.6, 28.3], ["pk_casa_oval", 21.6, 29.1], ["pk_casa_losango", 29.6, 27.4], ["pk_casa_ret_teal", 37, 27.3], ["pk_casa_redonda", 39.2, 16.6], ["pk_barraco", 8.6, 9.6], ["pk_barraco", 40.6, 22.6], ["pk_barraco", 9.2, 30.6]], "varais": [[17.2, 27.3, 0], [33.6, 26.7, 0], [38.6, 15.3, 0], [11, 14.6, 0]], "toldos": [["pk_toldo_rubi", 21.2, 11.2], ["pk_toldo_teal", 26.9, 15.8], ["pk_toldo_mostarda", 32.2, 11.6]], "agaves": [["pk_agave", 20.6, 18.6], ["pk_agave", 35.8, 18.2], ["pk_agave_verde", 21.6, 26.7], ["pk_agave", 4.6, 32]], "caravanas": [{"id": "oeste", "carroca": [3, 15.2], "dragoes": [[1.3, 12.4], [5.1, 18.4], [1.4, 19.1]], "caravaneiro": [5.4, 12.6, "humano"], "fardos": [[1.9, -2.6], [-1.6, 2.8]]}, {"id": "leste", "carroca": [3, 24.4], "dragoes": [[1.2, 21.8], [5.2, 21.6]], "caravaneiro": [1.4, 27, "zutariano"], "fardos": [[1.8, 2.8]]}], "fonte": [3, 10.2], "denzel": [29.6, 10.4], "saidas": {"ruas": [28, 0.8], "espacoporto": [0.8, 29]}};
PORTAO_V162.arte='arte/mapas/portao-vespera-chao.webp';
// retângulos de colisão (metros) que acompanham a forma da casa
export function colisaoForma(forma,x,y,w,h){
 if(forma==='redonda'||forma==='oval'||forma==='cupula'){const k=.17;return [[x+w*k,y,w*(1-2*k),h],[x,y+h*k,w,h*(1-2*k)]];}
 if(forma==='losango')return [[x+w*.25,y+h*.06,w*.5,h*.88],[x+w*.06,y+h*.25,w*.88,h*.5]];
 if(forma==='L')return [[x,y,w*.55,h],[x+w*.55,y+h*.45,w*.45,h*.55]];
 return [[x,y,w,h]];
}
export function gerarPortaoV162({objetos=[],nome='Portão de Véspera'}={}){
 const E=PORTAO_V162,{W,H}=E,ctx=novoCtx(W,H,1621,objetos),{f,els,occ,r}=ctx,banco=ctx.banco;
 const inv=(x,y,w,h,nome,visao=true)=>{const e=f.forma(x,y,w,h,{fill:'#3a2a1a',nome,bloq:true,opacity:0,material:'pedra',visao});e.invisivelV161=true;els.push(e);occ.marcar(x,y,w,h);return e;};
 const obj=(id,cx,cy,o={})=>{const m=banco.get(id);if(!m)return null;const e=f.objeto(m,cx,cy,o);if(o.nome){e.nome=o.nome;e.name=o.nome;}if(o.bloq!==undefined)e.bloqueiaMovimento=o.bloq;if(o.camada)e.camada=o.camada;els.push(e);return e;};
 els.push({id:'img:gen1621:chao',type:'image',src:E.arte,name:'Pintura do chão',nome:'Pintura do chão',x:0,y:0,w:W,h:H,rot:0,z:0,locked:true,opacity:1,camada:0,bloqueiaMovimento:false,bloqueiaVisao:false,fundoV161:true});
 const g0=E.gateX-3.5,g1=E.gateX+3.5;
 inv(0,0,g0,E.gateY-.1,'Paredão do pico');inv(g1,0,W-g1,E.gateY-.1,'Paredão do pico');inv(g0,0,.45,E.gateY,'Parede da rampa');inv(g1-.45,0,.45,E.gateY,'Parede da rampa');
 objRef(ctx,'pk_portao_vespera',E.gateX,E.gateY-.6,{nome:'Portão de Véspera'});
 objRef(ctx,'pk_feu_braseiro',g0-1,E.gateY+.9);objRef(ctx,'pk_feu_braseiro',g1+1,E.gateY+.9);
 objRef(ctx,'pk_fut_console',g1+2.4,E.gateY+1.2,{nome:'Terminal da guarita'});
 {const m=banco.get('pk_fonte_praca');if(m){const e=f.objeto(m,E.fonte[0],E.fonte[1],{escala:.62});Object.assign(e,{nome:'Fonte do oásis',name:'Fonte do oásis'});els.push(e);}}
 // casas do kit: arte sem colisão + colisão invisível pela forma
 for(const [id,x,y] of E.casas){const m=banco.get(id);if(!m)continue;const w=Number(m.larguraM)||5,h=Number(m.alturaM)||5;
  const e=f.objeto(m,x+w/2,y+h/2);e.bloqueiaMovimento=false;e.bloqueiaVisao=false;els.push(e);
  const forma=m.tipo==='casa_cupula'?'cupula':m.forma||'ret';for(const [a,b,c,d] of colisaoForma(forma,x,y,w,h))inv(a,b,c,d,String(m.nome||'Casa'));}
 // lojas (pátio aberto com porta): paredes invisíveis com o vão, balcão, lugar do comerciante
 E.lojasCalc={};
 for(const L of E.lojas){const {x,y,w,h,porta:lado}=L,x1=x+w,y1=y+h,cx=x+w/2,cy=y+h/2;
  obj('pk_patio_loja_'+lado,cx,cy,{nome:'Loja · '+L.nome,bloq:false,camada:1});
  for(const [a,b,c,d] of paredesComPorta(x,y,x1,y1,lado))inv(a,b,c,d,'Parede · '+L.nome);
  const fundo={n:{x:cx,y:y1-.95},s:{x:cx,y:y+.95},o:{x:x1-.95,y:cy},l:{x:x+.95,y:cy}}[lado],balP={n:{x:cx,y:y1-2.5},s:{x:cx,y:y+2.5},o:{x:x1-2.5,y:cy},l:{x:x+2.5,y:cy}}[lado];
  const bal=banco.get('pk_mesa_longa'),interno=(lado==='o'||lado==='l'?h:w)-.9,esc=Math.max(.5,Math.min(1.1,interno/3));
  if(bal){const e=f.objeto(bal,balP.x,balP.y,{escala:esc,rot:lado==='o'||lado==='l'?90:0});Object.assign(e,{nome:'Balcão · '+L.nome,name:'Balcão · '+L.nome,bloqueiaMovimento:true});els.push(e);}
  // mercadorias de cada loja em cima do balcão
  const merc={agua:['pk_barril','pk_banca_panelas'],pecas:['pk_caixote_suprimentos','pk_fut_console'],armas:['pk_caixote_suprimentos','pk_feu_armadura'],cristais:['pk_cristal_azul','pk_cristal_azul']}[L.id]||['pk_caixote_suprimentos'];
  merc.forEach((mid,i)=>{const mm=banco.get(mid);if(!mm)return;const hor=lado==='n'||lado==='s',dx=hor?(i?1:-1)*.9:0,dy=hor?0:(i?1:-1)*.9;const e=f.objeto(mm,balP.x+dx,balP.y+dy,{escala:.35});Object.assign(e,{nome:'Mercadorias · '+L.nome,name:'Mercadorias · '+L.nome,camada:4,bloqueiaMovimento:false});els.push(e);});
  E.lojasCalc[L.id]={...L,vendedor:fundo,porta:{n:{x:cx,y:y-.8},s:{x:cx,y:y1+.8},o:{x:x-.8,y:cy},l:{x:x1+.8,y:cy}}[lado]};}
 // feira da praça: toldos (por cima de quem passa) com caixotes, tapetes e barris embaixo
 for(const [id,x,y] of E.toldos){obj(id,x,y,{camada:5,bloq:false});for(let i=0;i<3;i++){const q=['pk_caixote_suprimentos','pk_barril','pk_tapete_retangular'][i];const mm=banco.get(q);if(!mm)continue;const e=f.objeto(mm,x+(i-1)*1.2,y+(i===2?.9:-.4),{escala:i===2?.6:.5});if(i===2){e.camada=1;e.bloqueiaMovimento=false;}els.push(e);}}
 for(const [x,y,rot] of E.varais)obj('pk_varal',x,y,{rot,camada:5,bloq:false});
 for(const [id,x,y] of E.agaves)obj(id,x,y);
 for(let i=0;i<6;i++)obj('pk_rachaduras',r()*(E.praca[2]-E.praca[0])+E.praca[0],r()*(E.praca[3]-E.praca[1])+E.praca[1],{camada:1,bloq:false,rot:Math.floor(r()*4)*90});
 for(const C of E.caravanas){objRef(ctx,'pk_vei_carroca',C.carroca[0],C.carroca[1],{nome:'Carroça da caravana'});for(const [dx,dy] of C.fardos)objRef(ctx,escolher(r,['pk_caixote_suprimentos','pk_barril','caixa_madeira']),C.carroca[0]+dx,C.carroca[1]+dy,{nome:'Fardos da caravana'});}
 return {w:W,h:H,ppm:40,bg:'#c49a52',texture:'nenhuma',showGrid:true,grid:'#7a5a2a',name:nome,formatoObjetos:'refs-v1',elements:els,estiloV129:'kit-deserto',portaoV138:true,portaoV162:true,
  geradoV110:{tipo:'ermos',semente:1621,variante:'portao-kit'},portaoN:portaoNV161({W,H,gateX:E.gateX,gateY:E.gateY})};
}

// Ruas Escavadas (56×28 m): labirinto escavado na rocha do pico, com pracinhas, lampiões e saídas no meio de cada lado.
export const SAIDAS_RUAS={portao:{x:14,y:13.2}};
function P2piso(ctx,x,y,w,h){ctx.els.push(ctx.f.forma(x,y,w,h,{fill:'#d9b98a',nome:'Terraço escavado',camada:1,material:'nenhum',radius:.6}));}
export function gerarRuasEscavadas({objetos=[],nome='Ruas Escavadas de Véspera',semente:s=1382}={}){
 const W=56,H=28,ctx=novoCtx(W,H,s,objetos),{f,els,occ,r}=ctx;
 const C=2,cw=W/C,ch=H/C,ab=new Uint8Array(cw*ch);
 // labirinto em células ímpares (backtracker), depois laços e pracinhas
 const pilha=[[1,1]];ab[1*cw+1]=1;
 while(pilha.length){const [x,y]=pilha.at(-1);const viz=[[2,0],[-2,0],[0,2],[0,-2]].map(([dx,dy])=>[x+dx,y+dy,dx,dy]).filter(([nx,ny])=>nx>0&&ny>0&&nx<cw-1&&ny<ch-1&&!ab[ny*cw+nx]);
  if(!viz.length){pilha.pop();continue;}const [nx,ny,dx,dy]=viz[Math.floor(r()*viz.length)];ab[(y+dy/2)*cw+x+dx/2]=1;ab[ny*cw+nx]=1;pilha.push([nx,ny]);}
 for(let i=0;i<cw*ch*.08;i++){const x=1+Math.floor(r()*(cw-2)),y=1+Math.floor(r()*(ch-2));if((x+y)%2===1)ab[y*cw+x]=1;}
 const pracas=[];for(let i=0;i<4;i++){const w=3,h=2,x=2+Math.floor(r()*(cw-w-4)),y=2+Math.floor(r()*(ch-h-4));for(let j=y;j<y+h;j++)for(let q=x;q<x+w;q++)ab[j*cw+q]=1;pracas.push({x:x*C,y:y*C,w:w*C,h:h*C});}
 // v141: terraços escavados (um andar acima da rua), fechados na rocha e ligados à rua por escadarias
 const terracos=[{x0:10,y0:1,x1:14,y1:4,k:'T1'},{x0:10,y0:9,x1:14,y1:12,k:'T2'}],noTerraco=(x,y)=>terracos.some(t=>x>=t.x0&&x<=t.x1&&y>=t.y0&&y<=t.y1);
 for(const t of terracos)for(let y=t.y0;y<=t.y1;y++)for(let x=t.x0;x<=t.x1;x++)ab[y*cw+x]=(x>t.x0&&x<t.x1&&y>t.y0&&y<t.y1)?1:0;
 // aberturas nas bordas (saídas): meio de cada lado e algumas outras posições
 const abrirAte=(x,y,dx,dy)=>{while(x>=0&&y>=0&&x<cw&&y<ch){if(noTerraco(x,y))break;ab[y*cw+x]=1;x+=dx;y+=dy;if(x>0&&y>0&&x<cw-1&&y<ch-1&&ab[y*cw+x]&&ab[(y+dy)*cw+x+dx])break;}};
 for(const fr of [.15,.3,.5,.7,.85]){const cx=Math.floor(cw*fr)|1,cy=Math.floor(ch*fr)|1;abrirAte(cx,ch-1,0,-1);abrirAte(cx,0,0,1);abrirAte(0,cy,1,0);abrirAte(cw-1,cy,-1,0);}
 const sol=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)sol[y*W+x]=ab[Math.floor(y/C)*cw+Math.floor(x/C)]?0:1;
 for(const q of retangulosDeCelulas(sol,W,H)){els.push(f.forma(q.x,q.y,q.w,q.h,{fill:'#5e4a3a',nome:'Parede escavada',bloq:true,material:'rocha'}));occ.marcar(q.x,q.y,q.w,q.h);}
 for(const p of pracas)els.push(f.forma(p.x+.3,p.y+.3,p.w-.6,p.h-.6,{fill:'#c9a87a',nome:'Pracinha',camada:1,material:'nenhum',radius:.8,opacity:.7}));
 // portas talhadas em algumas paredes (casas no paredão), lampiões e vida
 for(let i=0;i<14;i++){const x=1+Math.floor(r()*(cw-2)),y=1+Math.floor(r()*(ch-2));if(ab[y*cw+x]||!ab[(y+1)*cw+x])continue;els.push(f.forma(x*C+.5,y*C+C-.35,1,.35,{fill:escolher(r,['#2a9a9a','#e8743a','#5a3a20']),nome:'Porta talhada',camada:3,material:'madeira'}));}
 // escadarias: uma na rua (célula aberta logo fora do terraço) e outra dentro do terraço, com o mesmo número
 for(const t of terracos){
  P2piso(ctx,(t.x0+1)*C,(t.y0+1)*C,(t.x1-t.x0-1)*C,(t.y1-t.y0-1)*C);
  let fora=null;for(const [x,y,dx,dy] of [...Array.from({length:t.x1-t.x0-1},(_,i)=>[t.x0+1+i,t.y1+1,0,-1]),...Array.from({length:t.x1-t.x0-1},(_,i)=>[t.x0+1+i,t.y0-1,0,1]),...Array.from({length:t.y1-t.y0-1},(_,i)=>[t.x0-1,t.y0+1+i,1,0]),...Array.from({length:t.y1-t.y0-1},(_,i)=>[t.x1+1,t.y0+1+i,-1,0])]){if(x>0&&y>0&&x<cw-1&&y<ch-1&&ab[y*cw+x]){fora={x,y,dx,dy};break;}}
  if(!fora)continue;
  const esc=ctx.banco.get('pk_escada');if(!esc)continue;
  const rua=f.objeto(esc,fora.x*C+C/2,fora.y*C+C/2,{escala:.6,rot:fora.dx?0:90});Object.assign(rua,{nome:`Escadaria para o terraço ·${t.k}`,name:`Escadaria para o terraço ·${t.k}`,camada:1,bloqueiaMovimento:false});els.push(rua);
  const ix=fora.dx?(fora.dx>0?t.x0+1:t.x1-1):fora.x,iy=fora.dy?(fora.dy>0?t.y0+1:t.y1-1):fora.y;
  const cima=f.objeto(esc,ix*C+C/2,iy*C+C/2,{escala:.6,rot:fora.dx?180:270});Object.assign(cima,{nome:`Escadaria para a rua ·${t.k}`,name:`Escadaria para a rua ·${t.k}`,camada:1,bloqueiaMovimento:false});els.push(cima);
  occ.marcar(ix*C,iy*C,C,C);occ.marcar(fora.x*C,fora.y*C,C,C);
  for(const [id,dx] of [['pk_banco_praca',.4],['pk_retro_luminaria',-.4]]){const m=ctx.banco.get(id);if(m){const cx=(t.x0+t.x1+1)/2*C+dx*C*1.5,cy=(t.y0+t.y1+1)/2*C;if(occ.ok(cx-.6,cy-.6,1.2,1.2,0)){const e=f.objeto(m,cx,cy);if(id==='pk_banco_praca'){e.camada=2;e.bloqueiaMovimento=false;}els.push(e);occ.marcar(cx-.6,cy-.6,1.2,1.2);}}}
 }
 ctx.espalhar(['pk_retro_luminaria','pk_luminaria','lampada'].map(i=>ctx.banco.get(i)).filter(Boolean),16,{folga:.1});
 for(const p of pracas){const m=ctx.banco.get(escolher(r,['pk_barraca_rubra','pk_barraca_anil','pk_barraca_acafrao']));if(m&&occ.ok(p.x+.4,p.y+.4,3.3,3.3,0))objRef(ctx,m.id,p.x+2,p.y+2,{escala:.9});}
 ctx.espalhar(['pk_barril','caixa_madeira','pk_caixote_suprimentos','planta1','planta2','pk_fut_neon','pk_vei_carroca'].map(i=>ctx.banco.get(i)).filter(Boolean),18,{folga:.15});
 return estadoDe(ctx,nome,{bg:'#b89a74',texture:'calcamento',marca:{ruasV138:true,geradoV110:{tipo:'caverna',semente:s,variante:'ruas-escavadas'}}});
}
// v139: peças reaproveitadas pelo compositor de mapas por cenário (mesa-cenarios-mapas.js)
export {fabrica,grade,novoCtx,objRef,areiaDoDeserto,estadoDe,escolher};
