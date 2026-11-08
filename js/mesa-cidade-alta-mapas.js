// Mesa Estelar v145 — Mapas da Cidade Superior (Cidade Alta) de Véspera (dados puros, sem DOM).
//
// • Escadaria da Cidade Alta: lances escavados na rocha que vão contornando a montanha (com névoa de guerra), um
//   recanto com a boca de uma caverna (o caminho do presídio, depois) e, lá em cima, o portão com guardas.
// • Praça da Cidade Alta: piso polido, chafariz, a estátua de Valloton “o Pacificador”, jardins, bancos e postes.
// • O Cálice de Cristal: a taverna dos ricos.
// • Câmara do Conselho: anfiteatro em semicírculo descendo até o palco; metade dos assentos é da Cidade Alta
//   (estofados) e metade da Cidade Baixa (bancos de pedra), desde a reforma de Valloton.
// • Residência de Ilü-Mus-Ki: palácio de dois andares com átrio aberto (de cima se vê o salão), piscina, chafariz,
//   jardim interno, biblioteca, sala de jantar, escritório com a vitrine da pedra e robôs a serviço.

import {novoCtx,objRef,estadoDe,grade} from './mesa-gerador-mapas.js?v=141';
import {pecas,pessoa,marcarAndar} from './mesa-cenarios-mapas.js?v=151';

export const ID_ESCADARIA='v145_escadaria_alta',ID_PRACA_ALTA='v145_praca_cidade_alta',ID_TAVERNA_ALTA='v145_calice_cristal',ID_CAMARA='v145_camara_conselho',ID_PALACIO='v145_residencia_ilu';
const N=(v,M)=>+(v*28/M).toFixed(3),Nh=(v,M)=>+(v*14/M).toFixed(3);
// v145: arte da Casa Vaelkor (retrato, brasão, estandarte). A imagem é desenhada por cima pelo mesa-vaelkor.js.
function arteVK(f,els,x,y,w,h,tipo,nome){const e=f.forma(x,y,w,h,{fill:tipo==='estandarte'?'#4a1018':'#1a1210',nome,camada:3,material:'nenhum'});e.arteVaelkorV145=tipo;e.bloqueiaMovimento=false;els.push(e);return e;}

// ---------------------------------------------------------------- escadaria
export function gerarEscadariaAlta({objetos=[],nome='Escadaria da Cidade Alta'}={}){
 const W=56,H=28,ctx=novoCtx(W,H,1451,objetos),{f,els}=ctx,P=pecas(ctx,{parede:'#4a4038'});
 const ROCHA='#4a4038',CH='#8a7a68',X0=1.2,X1=W-1.2,AL=3.2,FA=2.2;
 const linhas=[];let y=1;for(let i=0;i<5;i++){linhas.unshift({y0:y,y1:y+AL});y+=AL+FA;} // linhas[0] = lance de baixo
 // rocha em volta
 for(const [x,yy,w,h] of [[0,0,W,1],[0,H-2.2,W,2.2],[0,0,X0,H],[X1,0,W-X1,H]])els.push(f.forma(x,yy,w,h,{fill:ROCHA,nome:'Rocha da montanha',bloq:true,material:'pedra'}));
 // lances (pisos) e degraus
 linhas.forEach((l,i)=>{els.push(f.forma(X0,l.y0,X1-X0,AL,{fill:CH,nome:'Degraus de pedra',camada:1,material:'nenhum'}));
  for(let x=X0+1.6;x<X1-1;x+=1.6)els.push(f.forma(x,l.y0+.1,.12,AL-.2,{fill:'#6e6152',nome:'Degrau',camada:1,material:'nenhum',opacity:.6}));});
 // faixas de rocha entre os lances, com a subida alternando direita/esquerda
 const cave={x0:19,x1:22.4};
 for(let i=0;i<4;i++){const baixo=linhas[i],cima=linhas[i+1],fy0=cima.y1,fy1=baixo.y0,direita=i%2===0,gx0=direita?X1-4.2:X0,gx1=direita?X1:X0+4.2;
  const partes=direita?[[X0,gx0]]:[[gx1,X1]];
  for(const [a,b] of partes){if(i===1){ // recanto da caverna na faixa entre o 2º e o 3º lance
    els.push(f.forma(a,fy0,cave.x0-a,fy1-fy0,{fill:ROCHA,nome:'Rocha da montanha',bloq:true,material:'pedra'}));els.push(f.forma(cave.x1,fy0,b-cave.x1,fy1-fy0,{fill:ROCHA,nome:'Rocha da montanha',bloq:true,material:'pedra'}));
    els.push(f.forma(cave.x0,fy0,cave.x1-cave.x0,1.0,{fill:ROCHA,nome:'Rocha da montanha',bloq:true,material:'pedra'}));
    els.push(f.forma(cave.x0,fy0+1.0,cave.x1-cave.x0,fy1-fy0-1.0,{fill:'#1a1512',nome:'Recanto escuro',camada:1,material:'nenhum'}));
    els.push(f.forma(cave.x0+.5,fy0+.35,cave.x1-cave.x0-1,1.3,{fill:'#050403',nome:'Boca da caverna',camada:2,kind:'elipse',material:'nenhum'}));
   }else els.push(f.forma(a,fy0,b-a,fy1-fy0,{fill:ROCHA,nome:'Rocha da montanha',bloq:true,material:'pedra'}));}
  // degraus da subida (escada) no vão
  P.escada((gx0+gx1)/2,(fy0+fy1)/2,'Escadaria (subida)',{rot:90});}
 // pilares de rocha que escondem o resto do lance
 linhas.forEach((l,i)=>{for(const fx of [.33,.66]){const x=X0+(X1-X0)*fx+(i%2?2:-2),cima=(i+(fx>.5?1:0))%2===0;els.push(f.forma(x,cima?l.y0:l.y1-1.7,1.8,1.7,{fill:ROCHA,nome:'Pilar de rocha',bloq:true,material:'pedra'}));}});
 // lanternas presas na rocha
 linhas.forEach((l,i)=>{for(let x=X0+5;x<X1-4;x+=11){const e=objRef(ctx,'pk_luminaria',x+(i%2)*4,l.y0+.5,{nome:'Lanterna na rocha',reserva:0,escala:.6});if(e){e.camada=4;e.bloqueiaMovimento=false;}}});
 // lá em cima: portão da Cidade Alta e o patamar
 const topo=linhas[4],gx=46,gy=(topo.y0+topo.y1)/2;
 const g=objRef(ctx,'pk_portao_vespera',gx,gy,{rot:90,escala:.5,nome:'Portão da Cidade Alta'});if(g){g.bloqueiaMovimento=true;}
 els.push(f.forma(gx+.6,topo.y0,X1-gx-.6,AL,{fill:'#c9c2b4',nome:'Patamar da Cidade Alta',camada:1,material:'nenhum'}));
 for(const x of [49,53]){const e=objRef(ctx,'pk_poste_luz',x,topo.y0+.4,{nome:'Poste da Cidade Alta',reserva:0});if(e){e.camada=4;e.bloqueiaMovimento=false;}}
 pessoa(P,gx-1.6,topo.y0+.8,'guarda');pessoa(P,gx-1.6,topo.y1-.8,'guarda');
 for(const yy of [topo.y0+.15,topo.y1-1.55])arteVK(f,els,gx+.8,yy,1,1.4,'estandarte','Estandarte da Casa Vaelkor');
 const baixo=linhas[0],c3=linhas[2];
 const st=estadoDe(ctx,nome,{bg:'#3b3530',texture:'ruinas',marca:{escadariaAltaV145:{
  portao:{x:N(gx,W),y:Nh(gy,H)},fora:{x:N(gx-2.2,W),y:Nh(gy,H)},dentro:{x:N(gx+2.4,W),y:Nh(gy,H)},
  entrada:{x:N(1.8,W),y:Nh((baixo.y0+baixo.y1)/2,H)},saidaAlta:{x:N(W-1.6,W),y:Nh(gy,H)},caverna:{x:N((cave.x0+cave.x1)/2,W),y:Nh(c3.y1+1.2,H)},
  nino:{x:N(26,W),y:Nh((c3.y0+c3.y1)/2,H)},guardas:[{x:N(gx-1.6,W),y:Nh(topo.y0+.8,H)},{x:N(gx-1.6,W),y:Nh(topo.y1-.8,H)}]},
  nevoaV145:true,pessoasV139:P.pessoas,geradoV110:{tipo:'escadaria',semente:1451,variante:'v145'}}});
 st.estiloV129='retro';return st;
}

// ---------------------------------------------------------------- praça
export function gerarPracaAlta({objetos=[],nome='Praça da Cidade Superior'}={}){
 const W=56,H=28,ctx=novoCtx(W,H,1452,objetos),{f,els}=ctx,P=pecas(ctx,{parede:'#e8e2d4'});
 els.push(f.forma(0,0,W,H,{fill:'#e3ddd0',nome:'Piso polido',camada:1,material:'nenhum'}));
 for(let x=2;x<W-2;x+=4)for(let y=2;y<H-2;y+=4)if((x/4+y/4)%2<1)els.push(f.forma(x,y,4,4,{fill:'#d2c9b6',nome:'Laje de mármore',camada:1,material:'nenhum',opacity:.7}));
 // fachadas em volta (as saídas ficam nos vãos)
 const fach=(x,y,w,h,cor,n)=>{els.push(f.forma(x,y,w,h,{fill:cor,nome:'Fachada · '+n,bloq:true,material:'pedra',radius:.3}));ctx.occ.marcar(x,y,w,h,3);};
 fach(0,0,22,2.6,'#cfc4e8','Câmara do Conselho');fach(26,0,30,2.6,'#e8d7b8','Residências');
 fach(0,H-2.6,14,2.6,'#d9e3ea','Hospital');fach(18,H-2.6,18,2.6,'#e7e0cf','Comércio fino');fach(40,H-2.6,16,2.6,'#dfe7ef','Porto Alto');
 fach(0,2.6,2.4,6.4,'#efe4d6','O Cálice de Cristal');fach(0,13,2.4,4,'#efe4d6','Casas');fach(0,21,2.4,4.4,'#efe4d6','Casas');
 fach(W-2.4,2.6,2.4,10.4,'#f0e6ff','Residência de Ilü-Mus-Ki');fach(W-2.4,17,2.4,8.4,'#e8d7b8','Residências');
 // centro: chafariz e estátua
 objRef(ctx,'pk_fonte_praca',W/2,H/2,{nome:'Chafariz da Cidade Alta',escala:1.2});
 // a Casa Vaelkor domina os símbolos da Cidade Superior; Valloton tem um monumento menor
 els.push(f.forma(W/2-2,1.2+1.6,4,3,{fill:'#4a3a4a',nome:'Estátua de Lord Vaelkor e seus ancestrais',bloq:true,material:'pedra',radius:.4}));
 arteVK(f,els,W/2-.9,2.8+.6,1.8,1.8,'brasao','Brasão da Casa Vaelkor (na estátua)');
 for(const x of [8,34,46])arteVK(f,els,x,2.65,1.1,1.5,'estandarte','Estandarte da Casa Vaelkor');
 els.push(f.forma(W/2-.8,H/2-5.6,1.6,1.6,{fill:'#b9b2a4',nome:'Estátua de Valloton, o Pacificador',bloq:true,kind:'circulo',material:'pedra'}));
 // jardins, bancos e postes
 for(const [x,y] of [[10,8],[10,20],[46,8],[46,20]]){els.push(f.forma(x-3,y-2,6,4,{fill:'#5f8a4a',nome:'Canteiro de flores',camada:1,material:'nenhum',radius:1}));objRef(ctx,'pk_arvore_florida',x,y,{nome:'Árvore florida',reserva:0,escala:.8});
  for(const dx of [-2.2,2.2])objRef(ctx,'pk_arbusto_florido',x+dx,y+1.2,{nome:'Arbusto florido',reserva:0,escala:.7});}
 for(const [x,y,r] of [[18,9,0],[38,9,0],[18,19,180],[38,19,180]]){const e=objRef(ctx,'pk_banco_praca',x,y,{rot:r,nome:'Banco da praça',reserva:0});if(e){e.camada=2;e.bloqueiaMovimento=false;}}
 for(const [x,y] of [[14,5],[42,5],[14,23],[42,23],[24,8],[32,8],[24,20],[32,20]])P.poste(x,y);
 for(const [x,y] of [[30,24.6],[36,24.6]])objRef(ctx,'pk_vei_aerocarro_creme',x,y,{nome:'Aerocarro estacionado',reserva:0,escala:.8});
 pessoa(P,W/2+4,H/2+3,'civil');pessoa(P,20,14,'civil');pessoa(P,36,14,'guarda');
 const st=estadoDe(ctx,nome,{bg:'#e3ddd0',texture:'lajotas',marca:{pracaAltaV145:{saidas:{camara:{x:12,y:.7},escadaria:{x:8,y:13.3},porto:{x:19,y:13.3},taverna:{x:.7,y:5.5},hospital:{x:.7,y:9.5},palacio:{x:27.3,y:7.5}}},pessoasV139:P.pessoas,geradoV110:{tipo:'praca',semente:1452,variante:'cidade-alta'}}});st.estiloV129='futurista';return st;
}

// ---------------------------------------------------------------- taverna de luxo
export function gerarTavernaAlta({objetos=[],nome='O Cálice de Cristal'}={}){
 const W=42,H=21,ctx=novoCtx(W,H,1453,objetos),{f,els}=ctx,P=pecas(ctx,{parede:'#5a4a6a'});
 const sal=P.sala(0,0,W,H,{portas:[{lado:'l',em:.5,larg:2.4,nome:'Porta de entrada'}],piso:'#2a2236',cor:'#5a4a6a'});
 for(let x=4;x<W-4;x+=3)els.push(f.forma(x,1,.15,H-2,{fill:'#c9a85a',nome:'Friso dourado',camada:1,material:'nenhum',opacity:.12}));
 els.push(f.forma(4,2,16,1.1,{fill:'#c9a85a',nome:'Balcão de cristal',bloq:true,material:'vidro'}));ctx.occ.marcar(4,2,16,1.1);
 els.push(f.forma(3,.5,18,.8,{fill:'#3a2a4a',nome:'Prateleira de garrafas raras',bloq:true,material:'madeira'}));
 arteVK(f,els,22.6,.55,2,2.5,'retrato','Retrato de Lord Anthorion Vaelkor');
 for(let i=0;i<7;i++){const e=objRef(ctx,'pk_cadeira_estofada',5+i*2.2,3.9,{nome:'Banqueta de veludo',reserva:0});if(e){e.camada=2;e.bloqueiaMovimento=false;}}
 for(const [x,y] of [[8,9],[8,15],[15,12],[22,9],[22,15]])P.mesa(x,y,{mesa:'pk_mesa_redonda_bar',cadeira:'pk_cadeira_estofada'});
 // palco com músico e a área de sofás
 els.push(f.forma(27,2,8,4,{fill:'#4a2a3a',nome:'Palco',camada:1,material:'nenhum',radius:.4}));pessoa(P,31,3.6,'músico');
 for(const [x,y,r] of [[30,11,0],[30,16,180],[36,13.5,90]])objRef(ctx,'pk_sofa_couro',x,y,{rot:r,nome:'Sofá de couro'});
 objRef(ctx,'pk_tapete_retangular',31,13.5,{nome:'Tapete persa',reserva:0});
 for(const [x,y] of [[10,12],[24,12],[33,8]]){const e=objRef(ctx,'pk_luminaria',x,y,{nome:'Lustre de cristal',reserva:0});if(e){e.camada=4;e.bloqueiaMovimento=false;}}
 // banheiro (detalhe de realidade)
 const ban=P.sala(W-8,H-6,8,6,{portas:[{lado:'n',em:.3,larg:1.4,objeto:'pk_fut_porta',nome:'Porta do lavabo'}],piso:'#e8eef0',cor:'#5a4a6a'});
 els.push(f.forma(ban.x+.3,ban.y+ban.h-1.2,2.6,.8,{fill:'#dfe6ea',nome:'Pia de mármore',bloq:true,material:'pedra'}));els.push(f.forma(ban.x+ban.w-1.6,ban.y+.4,1.2,2,{fill:'#c8d2d8',nome:'Cabine do lavabo',bloq:true,material:'metal'}));
 pessoa(P,12,1.9,'atendente');pessoa(P,18,9,'freguês');pessoa(P,30,13.5,'freguês');
 const st=estadoDe(ctx,nome,{bg:'#2a2236',texture:'lajotas',marca:{tavernaAltaV145:{saida:{x:27.3,y:7}},pessoasV139:P.pessoas,geradoV110:{tipo:'bar',semente:1453,variante:'cidade-alta'}}});st.estiloV129='futurista';return st;
}

// ---------------------------------------------------------------- câmara do conselho (anfiteatro)
export function gerarCamara({objetos=[],nome='Câmara do Conselho de Véspera'}={}){
 const W=56,H=28,ctx=novoCtx(W,H,1454,objetos),{f,els}=ctx,P=pecas(ctx,{parede:'#5a5068'});
 P.sala(0,0,W,H,{portas:[{lado:'n',em:.12,larg:2.4,nome:'Entrada da Cidade Alta'},{lado:'n',em:.88,larg:2.4,nome:'Entrada da Cidade Baixa'}],piso:'#cfc6b4',cor:'#5a5068'});
 const cx=W/2,cy=H-1.5;
 // degraus em semicírculo descendo até o palco (anéis concêntricos: do maior para o menor)
 for(let r=25,k=0;r>6;r-=2.3,k++){els.push(f.forma(cx-r,cy-r,2*r,2*r,{fill:k%2?'#b8ad98':'#c9bfaa',nome:'Degrau do anfiteatro',camada:1,kind:'circulo',material:'nenhum'}));}
 els.push(f.forma(cx-6,cy-6,12,12,{fill:'#e8dcc4',nome:'Palco do conselho',camada:1,kind:'circulo',material:'nenhum'}));
 els.push(f.forma(cx-1,1,2,cy-6,{fill:'#7a2a34',nome:'Passadeira central',camada:1,material:'nenhum',opacity:.85}));
 // assentos: à esquerda os estofados da Cidade Alta, à direita os bancos de pedra da Cidade Baixa
 for(let r=22.4,k=0;r>8;r-=2.3,k++){const n=Math.max(4,Math.round(r*.55));
  for(let i=0;i<n;i++){const a=Math.PI*(1.04+.42*i/(n-1)),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(y<1.6||x<1.2)continue;const e=objRef(ctx,'pk_cadeira_estofada',x,y,{rot:Math.round(a*180/Math.PI+90),nome:'Assento da Cidade Alta',reserva:0});if(e){e.camada=2;e.bloqueiaMovimento=false;}}
  for(let i=0;i<Math.max(2,Math.round(n/2));i++){const a=Math.PI*(1.54+.42*i/Math.max(1,Math.round(n/2)-1)),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(y<1.6||x>W-1.2)continue;const e=objRef(ctx,'pk_banco_praca',x,y,{rot:Math.round(a*180/Math.PI+90),nome:'Banco da Cidade Baixa',reserva:0,escala:.8});if(e){e.camada=2;e.bloqueiaMovimento=false;}}}
 // mesa do conselho no palco e a cadeira da chefe
 objRef(ctx,'pk_mesa_reuniao',cx,cy-3,{nome:'Mesa do conselho'});objRef(ctx,'pk_feu_trono',cx,cy-1.2,{rot:180,nome:'Cadeira da chefe do conselho'});
 for(const dx of [-3,-1.5,1.5,3]){const e=objRef(ctx,'pk_cadeira_estofada',cx+dx,cy-1.6,{rot:180,nome:'Cadeira de conselheiro',reserva:0});if(e){e.camada=2;e.bloqueiaMovimento=false;}}
 // estandartes e a placa de Valloton
 arteVK(f,els,2.4,1.9,2.2,2.8,'retrato','Retrato de Lord Anthorion Vaelkor');arteVK(f,els,51,1.9,2.6,2.6,'brasao','Brasão da Casa Vaelkor');
 for(const x of [6,14,42,50])objRef(ctx,'pk_feu_estandarte',x,1.4,{nome:x<28?'Estandarte da Cidade Alta':'Estandarte da Cidade Baixa',reserva:0});
 els.push(f.forma(cx-2.5,.45,5,.6,{fill:'#c9a85a',nome:'Placa de Valloton',bloq:true,material:'metal'}));
 pessoa(P,cx,cy-1.4,'chefe do conselho');for(const dx of [-3,-1.5,1.5,3])pessoa(P,cx+dx,cy-1.8,'conselheiro');pessoa(P,4,3,'guarda');pessoa(P,W-4,3,'guarda');
 const st=estadoDe(ctx,nome,{bg:'#cfc6b4',texture:'lajotas',marca:{camaraV145:{saida:{x:3.4,y:.8},chefe:{x:14,y:12.4}},pessoasV139:P.pessoas,geradoV110:{tipo:'tribunal',semente:1454,variante:'anfiteatro'}}});st.estiloV129='futurista';return st;
}

// ---------------------------------------------------------------- residência de Ilü-Mus-Ki (palácio, 2 andares)
export function gerarPalacioMusk({objetos=[],nome='Residência de Ilü-Mus-Ki'}={}){
 const W=84,H=42,ctx=novoCtx(W,H,1455,objetos),{f,els}=ctx,P=pecas(ctx,{parede:'#d8d0e8'});
 const E=.5,A={x:30,y:12,w:24,h:18}; // átrio central (aberto até o teto)
 // ---- térreo
 els.push(f.forma(0,0,W,H,{fill:'#6f9a5a',nome:'Gramado',camada:1,material:'nenhum'}));
 P.sala(4,4,W-8,H-8,{portas:[{lado:'s',em:.5,larg:3.2,nome:'Portal de entrada'}],piso:'#efe9de',cor:'#d8d0e8',E});
 for(let x=6;x<W-6;x+=3)for(let y=6;y<H-6;y+=3)if(((x+y)/3)%2<1)els.push(f.forma(x,y,3,3,{fill:'#e2d8c6',nome:'Mármore',camada:1,material:'nenhum',opacity:.6}));
 els.push(f.forma(A.x,A.y,A.w,A.h,{fill:'#f6f1e6',nome:'Átrio',camada:1,material:'nenhum'}));
 objRef(ctx,'pk_fonte_praca',A.x+A.w/2,A.y+A.h/2,{nome:'Chafariz do átrio'});
 // piscina no jardim interno (lado leste)
 els.push(f.forma(60,14,16,10,{fill:'#7fbf6a',nome:'Jardim interno',camada:1,material:'nenhum',radius:1}));
 els.push(f.forma(62,16,12,6,{fill:'#3fb6d8',nome:'Piscina',bloq:true,visao:false,material:'nenhum',radius:.8}));
 for(const [x,y] of [[61,25],[75,25]])objRef(ctx,'pk_arvore_florida',x,y,{nome:'Árvore do jardim',reserva:0,escala:.7});
 for(const x of [64,68,72]){const e=objRef(ctx,'pk_sofa_couro',x,13,{nome:'Espreguiçadeira',reserva:0,escala:.7});if(e){e.camada=2;e.bloqueiaMovimento=false;}}
 // sala de jantar (oeste) e biblioteca (noroeste)
 const jan=P.sala(4,20,22,14,{portas:[{lado:'l',em:.5,larg:2.4}],cor:'#d8d0e8',E});
 P.mesa(jan.x+jan.w/2,jan.y+jan.h/2,{mesa:'pk_mesa_longa',cadeira:'pk_cadeira_estofada'});P.mesa(jan.x+jan.w/2,jan.y+jan.h/2+3,{mesa:'pk_mesa_longa',cadeira:'pk_cadeira_estofada'});
 const bib=P.sala(4,4,22,12,{portas:[{lado:'l',em:.6,larg:2}],cor:'#d8d0e8',E});P.encostar(bib,['pk_estante_arquivo'],5,'n',{nome:'Estante da biblioteca'});P.encostar(bib,['pk_estante_arquivo'],3,'o',{nome:'Estante da biblioteca'});
 objRef(ctx,'pk_sofa_couro',bib.x+bib.w/2,bib.y+bib.h-2.5,{nome:'Sofá de leitura'});
 // banheiro do térreo
 const ban=P.sala(W-16,H-12,8,6,{portas:[{lado:'n',em:.3,larg:1.4,objeto:'pk_fut_porta',nome:'Porta do banheiro'}],piso:'#e8eef0',cor:'#d8d0e8',E});
 els.push(f.forma(ban.x+.3,ban.y+ban.h-1.1,2.6,.7,{fill:'#dfe6ea',nome:'Pia de mármore',bloq:true,material:'pedra'}));
 // escadaria nobre (sobe do átrio)
 const esc=P.escada(A.x+A.w/2,A.y+A.h+2.2,'Escadaria nobre',{rot:0});
 if(esc)Object.assign(esc,{escadaAndarV144:true,andarAmbosV144:true,camada:2,bloqueiaMovimento:false});
 arteVK(f,els,A.x+A.w/2-1.2,4.6,2.4,3,'retrato','Retrato de Lord Anthorion Vaelkor (presente da Casa Vaelkor)');
 // robôs a serviço e guardas
 pessoa(P,A.x+4,A.y+A.h-2,'robô mordomo');pessoa(P,jan.x+jan.w/2,jan.y+2,'robô garçom');pessoa(P,W/2-3,H-6,'robô guarda');pessoa(P,W/2+3,H-6,'robô guarda');
 // ---- andar de cima (2): galerias em volta do átrio (vão aberto: de cima se vê o salão)
 const desde=els.length,ctx2={...ctx,occ:grade(W,H)},P2=pecas(ctx2,{parede:'#d8d0e8'});
 P2.piso(4,4,W-8,H-8,'#e6dccd','Andar de cima · piso de madeira nobre');els[els.length-1].pisoAndarV144=2;
 P2.sala(4,4,W-8,H-8,{piso:null,cor:'#d8d0e8',E});
 els.push(f.forma(A.x,A.y,A.w,A.h,{fill:'#f6f1e6',nome:'Vão do átrio',camada:1,material:'nenhum',opacity:.05}));els[els.length-1].vaoAndarV144=true;
 for(const [x,y,w,h] of [[A.x-.3,A.y-.3,A.w+.6,.3],[A.x-.3,A.y+A.h,A.w+.6,.3],[A.x-.3,A.y,.3,A.h],[A.x+A.w,A.y,.3,A.h]])P2.parede(x,y,w,h,'#c9a85a','Balaustrada');
 // quartos e escritório
 const q1=P2.sala(4,4,22,12,{portas:[{lado:'l',em:.5,larg:1.8}],cor:'#d8d0e8',E});objRef(ctx2,'camacasal2',q1.x+q1.w/2,q1.y+2.2,{nome:'Cama de hóspedes'});
 const q2=P2.sala(4,24,22,14,{portas:[{lado:'l',em:.5,larg:1.8}],cor:'#d8d0e8',E});objRef(ctx2,'camacasal2',q2.x+5,q2.y+3,{nome:'Cama de hóspedes'});objRef(ctx2,'camacasal2',q2.x+14,q2.y+3,{nome:'Cama de hóspedes'});
 const esc2=P2.sala(58,4,22,14,{portas:[{lado:'o',em:.5,larg:1.8,objeto:'pk_fut_porta',nome:'Porta do escritório'}],cor:'#d8d0e8',E});
 objRef(ctx2,'pk_fut_mesa',esc2.x+esc2.w/2,esc2.y+4,{nome:'Mesa de Ilü-Mus-Ki'});objRef(ctx2,'pk_terminal',esc2.x+esc2.w/2,esc2.y+2,{nome:'Terminal pessoal'});
 objRef(ctx2,'pk_fut_armario',esc2.x+esc2.w-1.5,esc2.y+esc2.h-1.5,{rot:180,nome:'Vitrine com a Pedra de Fase'});
 const q3=P2.sala(58,22,22,16,{portas:[{lado:'o',em:.5,larg:1.8}],cor:'#d8d0e8',E});objRef(ctx2,'camacasal2',q3.x+q3.w/2,q3.y+3,{nome:'Poleiro de descanso de Ilü-Mus-Ki'});
 marcarAndar(els,desde,2);
 pessoa(P,A.x+A.w/2,A.y+3.2,'Ilü-Mus-Ki');
 const st=estadoDe(ctx,nome,{bg:'#6f9a5a',texture:'grama',marca:{palacioMuskV145:{saida:{x:14,y:13.4},ilu:{x:14,y:5.1}},andaresV144:true,pessoasV139:P.pessoas,geradoV110:{tipo:'palacio',semente:1455,variante:'musk'}}});st.estiloV129='futurista';return st;
}
