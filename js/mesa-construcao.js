// Mesa Estelar v177 — Construção por módulos (como Conan Exiles / No Man's Sky), usada pela 🏗️ Oficina 3.0.
//
// Escolhe-se o MATERIAL (metal futurista, metal enferrujado, pedra polida, pedras de rio, tijolo, madeira, adobe, bambu)
// e a PEÇA (chão, parede, parede com porta/janela, passagem, mureta, diagonal, curva, teto, escada… ou uma casa pronta).
// A peça "fantasma" segue o mouse encaixada na grade do módulo (1, 2 ou 3 m); R / roda do mouse gira; clique põe.
// Cada peça vira objetos comuns da cena da mesa (o 🛠️ move/apaga; teto some quando alguém entra; porta abre/fecha).
//
// TEXTURAS: cada peça aponta para arte/materiais/<material>/<parte>.webp (parte = parede, chao, teto, porta, janela,
// escada). Trocar a imagem com o MESMO nome muda o visual de TUDO o que já foi construído com ela.
// Paredes diagonais e curvas: o desenho é uma peça só (girada ou com máscara de arco) e quem barra são blocos invisíveis
// pequenos ao longo dela (os mesmos retângulos que todo o jogo entende).

export const MATERIAIS=[
 {id:'metal-limpo',nome:'Metal futurista',cor:'#78b0cd',dureza:18,pv:500,mat:'metal'},
 {id:'metal-ferrugem',nome:'Metal enferrujado',cor:'#845c42',dureza:12,pv:350,mat:'metal'},
 {id:'pedra-polida',nome:'Pedra polida',cor:'#c4bcac',dureza:16,pv:600,mat:'pedra'},
 {id:'pedra-rio',nome:'Pedras de rio',cor:'#848c96',dureza:14,pv:500,mat:'pedra'},
 {id:'tijolo',nome:'Tijolo',cor:'#a04e38',dureza:12,pv:400,mat:'pedra'},
 {id:'madeira',nome:'Madeira',cor:'#8c603a',dureza:6,pv:200,mat:'madeira'},
 {id:'adobe',nome:'Adobe (barro)',cor:'#cca470',dureza:8,pv:250,mat:'pedra'},
 {id:'bambu',nome:'Bambu',cor:'#b0a060',dureza:4,pv:120,mat:'madeira'}
];
export const PARTES=['parede','chao','teto','porta','janela','escada'];
export const texMat=(m,parte)=>`arte/materiais/${m}/${parte}.webp`;
export const matDe=id=>MATERIAIS.find(m=>m.id===id)||MATERIAIS[0];

// peças (tecla = número no teclado)
export const PECAS=[
 {id:'chao',nome:'Chão',icone:'⬛',grupo:'base',dica:'Um quadrado de chão do tamanho do módulo.'},
 {id:'chao_losango',nome:'Chão losango',icone:'🔷',grupo:'base',dica:'Chão em losango (para casas em losango).'},
 {id:'chao_redondo',nome:'Chão redondo',icone:'⚪',grupo:'base',dica:'Chão redondo (2 × 2 módulos).'},
 {id:'parede',nome:'Parede',icone:'🧱',grupo:'parede',dica:'Parede na borda do módulo. R gira.'},
 {id:'parede_porta',nome:'Parede com porta',icone:'🚪',grupo:'parede',dica:'Parede com porta no meio (abre, fecha, tranca).'},
 {id:'parede_janela',nome:'Parede com janela',icone:'🪟',grupo:'parede',dica:'Parede com janela: barra o passo, deixa ver.'},
 {id:'passagem',nome:'Passagem (vão)',icone:'⛩️',grupo:'parede',dica:'Parede com um vão aberto, sem porta.'},
 {id:'mureta',nome:'Mureta',icone:'▭',grupo:'parede',dica:'Muro baixo: barra o passo, deixa ver por cima.'},
 {id:'parede_diagonal',nome:'Parede diagonal',icone:'⟋',grupo:'parede',dica:'Atravessa o módulo na diagonal. R gira.'},
 {id:'parede_curva',nome:'Parede curva',icone:'◜',grupo:'parede',dica:'¼ de círculo no módulo. R gira.'},
 {id:'teto',nome:'Teto',icone:'🔺',grupo:'teto',dica:'Telhado do módulo (tetos encostados abrem juntos).'},
 {id:'escada',nome:'Escada',icone:'🪜',grupo:'teto',dica:'Degraus no módulo. R gira.'},
 {id:'casa_pequena',nome:'Casa pequena',icone:'🏠',grupo:'pronta',dica:'2 × 2 módulos: porta, janela, chão e teto.'},
 {id:'casa_media',nome:'Casa média',icone:'🏡',grupo:'pronta',dica:'3 × 2 módulos: porta, 2 janelas.'},
 {id:'galpao',nome:'Galpão',icone:'🏭',grupo:'pronta',dica:'3 × 3 módulos com portão largo.'},
 {id:'torre_redonda',nome:'Torre redonda',icone:'🗼',grupo:'pronta',dica:'Sala redonda (2 × 2 módulos) com porta.'},
 {id:'casa_losango',nome:'Casa losango',icone:'🔶',grupo:'pronta',dica:'Losango de 2 × 2 módulos com passagem.'}
];
export const pecaDe=id=>PECAS.find(p=>p.id===id)||null;
// quantos módulos a peça ocupa (largura × altura, antes de girar)
export const tamanhoPeca=id=>({chao_redondo:[2,2],casa_pequena:[2,2],casa_media:[3,2],galpao:[3,3],torre_redonda:[2,2],casa_losango:[2,2]}[id]||[1,1]);

// ---------------------------------------------------------------- encaixe
// canto de cima/esquerda do módulo sob o ponto; peças maiores ficam centradas no ponteiro
export function encaixe(p,M,id,giro=0){const [a,b]=tamanhoPeca(id),[w,h]=giro%2?[b,a]:[a,b];return {x:Math.round(p.x/M-w/2)*M,y:Math.round(p.y/M-h/2)*M,w:w*M,h:h*M};}
// parede de borda: a borda do módulo mais perto do ponteiro (giro par = horizontal, ímpar = vertical)
export function bordaMaisPerto(p,M,giro=0){
 if(giro%2===0){const y=Math.round(p.y/M)*M,x=Math.floor(p.x/M)*M;return {x,y,hor:true};}
 const x=Math.round(p.x/M)*M,y=Math.floor(p.y/M)*M;return {x,y,hor:false};
}

// ---------------------------------------------------------------- objetos (metros → formato da cena)
let seq=0;const nid=t=>'c177_'+t+'_'+Date.now().toString(36)+(seq++).toString(36);
const N=(r,W,H)=>({x:+((r.x+r.w/2)*28/W).toFixed(4),y:+((r.y+r.h/2)*14/H).toFixed(4),larguraM:+r.w.toFixed(3),alturaM:+r.h.toFixed(3)});
const base=(t,mat,parte,extra)=>({id:nid(t),forma:'rect',cor:mat.cor,bordaLargura:0,angulo:0,pvMax:0,pvAtual:0,dureza:0,material:mat.mat,textura:texMat(mat.id,parte),texturaM:2,materialV177:mat.id,parteV177:parte,oficina3:t,...extra});
export function oParede(r,mat,W,H,nome='Parede'){return {...base('parede',mat,'parede',{nome,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true,pvMax:mat.pv,pvAtual:mat.pv,dureza:mat.dureza,borda:'#1d1a17',bordaLargura:1,texturaM:1.5}),...N(r,W,H)};}
export function oMureta(r,mat,W,H){return {...oParede(r,mat,W,H,'Mureta'),bloqueiaVisao:false,opacity:.9,oficina3:'mureta'};}
export function oChao(r,mat,W,H,nome='Chão'){return {...base('chao',mat,'chao',{nome:nome+' · '+mat.nome,camada:1,bloqueiaMovimento:false,bloqueiaVisao:false}),...N(r,W,H)};}
export function oTeto(r,mat,W,H,grupo=''){return {...base('teto',mat,'teto',{nome:'Telhado · '+mat.nome,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,tetoV139:true,borda:'#2a1a12',bordaLargura:1,...(grupo?{grupoTetoV177:grupo}:{})}),...N(r,W,H)};}
export function oPorta(r,mat,W,H){return {...base('porta',mat,'porta',{nome:'Porta',camada:3,bloqueiaMovimento:true,bloqueiaVisao:true,pvMax:Math.round(mat.pv/4),pvAtual:Math.round(mat.pv/4),dureza:Math.round(mat.dureza/2),borda:'#ffb347',bordaLargura:2,texturaM:1}),...N(r,W,H)};}
export function oJanela(r,mat,W,H){return {...base('janela',mat,'janela',{nome:'Janela',camada:3,bloqueiaMovimento:true,bloqueiaVisao:false,pvMax:10,pvAtual:10,dureza:2,material:'vidro',borda:'#9fd3ff',bordaLargura:2,texturaM:1}),...N(r,W,H)};}
export function oEscada(r,mat,W,H,giro=0){return {...base('escada',mat,'escada',{nome:'Escada',camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,texturaM:1}),...N(giro%2?{x:r.x+r.w/2-r.h/2,y:r.y+r.h/2-r.w/2,w:r.h,h:r.w}:r,W,H),angulo:giro%2?90:0};}
// blocos invisíveis que barram ao longo de uma linha (diagonais e curvas)
export function blocosLinha(pts,esp,W,H,{visao=true,de=''}={}){
 const out=[],passo=Math.min(.45,esp+.1);
 for(let i=1;i<pts.length;i++){const [a,b]=[pts[i-1],pts[i]],L=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(L/passo));
  for(let k=(i===1?0:1);k<=n;k++){const x=a.x+(b.x-a.x)*k/n,y=a.y+(b.y-a.y)*k/n;out.push({id:nid('bloco'),nome:'Parede',forma:'rect',cor:'#000000',bordaLargura:0,opacity:0,invisivelV161:true,colisaoV177:de,...N({x:x-esp/2,y:y-esp/2,w:esp,h:esp},W,H),angulo:0,camada:3,bloqueiaMovimento:true,bloqueiaVisao:visao,pvMax:0,pvAtual:0,dureza:0,material:''});}}
 return out;
}
const arco=(cx,cy,r,a0,a1,n)=>{const pts=[];for(let k=0;k<=n;k++){const a=a0+(a1-a0)*k/n;pts.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r});}return pts;};

// ---------------------------------------------------------------- peças
// parede reta ao longo de uma borda (x,y,hor) com comprimento M e espessura t; vao: null | {tipo:'porta'|'janela'|'passagem'}
export function paredeDeBorda(b,M,t,mat,W,H,vao=null,larg=1){
 const r=b.hor?{x:b.x,y:b.y-t/2,w:M,h:t}:{x:b.x-t/2,y:b.y,w:t,h:M};
 if(!vao)return [oParede(r,mat,W,H)];
 const L=Math.min(larg,M-.2),ini=(M-L)/2,out=[];
 const pedaco=(a,c)=>b.hor?{x:r.x+a,y:r.y,w:c,h:t}:{x:r.x,y:r.y+a,w:t,h:c};
 if(ini>.1){out.push(oParede(pedaco(0,ini),mat,W,H));out.push(oParede(pedaco(ini+L,M-ini-L),mat,W,H));}
 const v=pedaco(ini,L);
 if(vao==='porta')out.push(oPorta(v,mat,W,H));else if(vao==='janela')out.push(oJanela(v,mat,W,H));
 return out;
}
export function montarPeca(id,p,{M=2,giro=0,t=.3,mat:matId,W=28,H=14,larg=1}={}){
 const mat=matDe(matId),g=((giro%4)+4)%4,out=[];
 if(['parede','parede_porta','parede_janela','passagem','mureta'].includes(id)){
  const b=bordaMaisPerto(p,M,g);
  if(id==='mureta'){const r=b.hor?{x:b.x,y:b.y-t/2,w:M,h:t}:{x:b.x-t/2,y:b.y,w:t,h:M};return [oMureta(r,mat,W,H)];}
  return paredeDeBorda(b,M,t,mat,W,H,{parede:null,parede_porta:'porta',parede_janela:'janela',passagem:'passagem'}[id],larg);
 }
 const c=encaixe(p,M,id,g);
 if(id==='chao')return [oChao(c,mat,W,H)];
 if(id==='teto')return [oTeto(c,mat,W,H)];
 if(id==='escada')return [oEscada(c,mat,W,H,g)];
 if(id==='chao_losango')return [{...oChao(c,mat,W,H,'Chão losango'),recorte:'polygon(50% 0,100% 50%,50% 100%,0 50%)'}];
 if(id==='chao_redondo')return [{...oChao(c,mat,W,H,'Chão redondo'),recorte:'circle(50% at 50% 50%)'}];
 if(id==='parede_diagonal'){
  // de um canto ao oposto; giro par = "\", ímpar = "/"
  const a=g%2?{x:c.x,y:c.y+c.h}:{x:c.x,y:c.y},b=g%2?{x:c.x+c.w,y:c.y}:{x:c.x+c.w,y:c.y+c.h},L=Math.hypot(c.w,c.h);
  const vis={...oParede({x:c.x+c.w/2-L/2,y:c.y+c.h/2-t/2,w:L,h:t},mat,W,H),angulo:g%2?-45:45,bloqueiaMovimento:false,bloqueiaVisao:false,oficina3:'parede_diagonal'};
  return [vis,...blocosLinha([a,b],t,W,H,{de:vis.id})];
 }
 if(id==='parede_curva'){
  // ¼ de círculo de raio M com centro num canto do módulo (o canto gira com R)
  const cantos=[[0,0],[1,0],[1,1],[0,1]],[kx,ky]=cantos[g],cx=c.x+kx*c.w,cy=c.y+ky*c.h,a0=[0,Math.PI/2,Math.PI,Math.PI*1.5][g];
  const pct=((M-t)/M*100).toFixed(1),at=`${kx*100}% ${ky*100}%`;
  const vis={...oParede(c,mat,W,H,'Parede curva'),bloqueiaMovimento:false,bloqueiaVisao:false,bordaLargura:0,oficina3:'parede_curva',
   mascara:`radial-gradient(ellipse 100% 100% at ${at}, transparent ${pct}%, #000 ${(+pct+.5).toFixed(1)}%, #000 99.4%, transparent 100%)`};
  return [vis,...blocosLinha(arco(cx,cy,M-t/2,a0,a0+Math.PI/2,8),t,W,H,{de:vis.id})];
 }
 // ---- casas prontas (giro troca largura × altura; a porta fica sempre "na frente": embaixo no giro 0)
 const grupo='g'+Date.now().toString(36)+(seq++).toString(36);
 const cel=(i,j)=>({x:c.x+i*M,y:c.y+j*M,w:M,h:M});
 const nx=Math.round(c.w/M),ny=Math.round(c.h/M);
 if(['casa_pequena','casa_media','galpao'].includes(id)){
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){out.push(oChao(cel(i,j),mat,W,H));out.push(oTeto(cel(i,j),mat,W,H,grupo));}
  // lados: [lista de bordas] com o que vai em cada uma
  const frente=['baixo','esquerda','cima','direita'][g],janelas=id==='casa_media'?2:id==='galpao'?0:1;let jan=0;
  const lados={cima:[],baixo:[],esquerda:[],direita:[]};
  for(let i=0;i<nx;i++){lados.cima.push({x:c.x+i*M,y:c.y,hor:true});lados.baixo.push({x:c.x+i*M,y:c.y+c.h,hor:true});}
  for(let j=0;j<ny;j++){lados.esquerda.push({x:c.x,y:c.y+j*M,hor:false});lados.direita.push({x:c.x+c.w,y:c.y+j*M,hor:false});}
  const fundo={baixo:'cima',cima:'baixo',esquerda:'direita',direita:'esquerda'}[frente];
  for(const [lado,bs] of Object.entries(lados))bs.forEach((b,k)=>{
   let vao=null;
   if(lado===frente&&k===Math.floor((bs.length-1)/2))vao='porta';
   else if(lado!==frente&&jan<janelas&&(lado===fundo||bs.length>1)&&k===Math.floor(bs.length/2)){vao='janela';jan++;}
   out.push(...paredeDeBorda(b,M,t,mat,W,H,vao,id==='galpao'&&vao==='porta'?Math.min(M*1.6,M-.2):larg));
  });
  return out;
 }
 if(id==='torre_redonda'){
  const cx=c.x+c.w/2,cy=c.y+c.h/2,R=Math.min(c.w,c.h)/2,pct=((R-t)/R*100).toFixed(1);
  out.push({...oChao(c,mat,W,H,'Chão redondo'),recorte:'circle(50% at 50% 50%)'});
  out.push({...oTeto(c,mat,W,H,grupo),recorte:'circle(50% at 50% 50%)',bordaLargura:0});
  const vis={...oParede(c,mat,W,H,'Parede redonda'),bloqueiaMovimento:false,bloqueiaVisao:false,bordaLargura:0,oficina3:'parede_redonda',
   mascara:`radial-gradient(circle closest-side at 50% 50%, transparent ${pct}%, #000 ${(+pct+.5).toFixed(1)}%, #000 99%, transparent 100%)`};
  out.push(vis);
  // porta na frente: abre ~1 m de arco e põe a porta reta ali
  const af=[Math.PI/2,Math.PI,Math.PI*1.5,0][g],meio=Math.asin(Math.min(1,.65/(R-t/2))),pts=arco(cx,cy,R-t/2,af+meio,af+Math.PI*2-meio,Math.max(12,Math.round(R*8)));
  out.push(...blocosLinha(pts,t,W,H,{de:vis.id}));
  const px=cx+Math.cos(af)*(R-t/2),py=cy+Math.sin(af)*(R-t/2),hor=Math.abs(Math.sin(af))>.5;
  out.push(oPorta(hor?{x:px-.6,y:py-t/2,w:1.2,h:t}:{x:px-t/2,y:py-.6,w:t,h:1.2},mat,W,H));
  return out;
 }
 if(id==='casa_losango'){
  out.push({...oChao(c,mat,W,H,'Chão losango'),recorte:'polygon(50% 0,100% 50%,50% 100%,0 50%)'});
  out.push({...oTeto(c,mat,W,H,grupo),recorte:'polygon(50% 0,100% 50%,50% 100%,0 50%)',bordaLargura:0});
  const T={x:c.x+c.w/2,y:c.y},R={x:c.x+c.w,y:c.y+c.h/2},B={x:c.x+c.w/2,y:c.y+c.h},L={x:c.x,y:c.y+c.h/2};
  const lados=[[L,T],[T,R],[R,B],[B,L]],frente=[2,3,0,1][g];
  lados.forEach(([a,b],k)=>{const comp=Math.hypot(b.x-a.x,b.y-a.y),ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
   const vis={...oParede({x:mx-comp/2,y:my-t/2,w:comp,h:t},mat,W,H),angulo:+ang.toFixed(2),bloqueiaMovimento:false,bloqueiaVisao:false,oficina3:'parede_diagonal'};
   if(k===frente){ // passagem de ~1,2 m no meio deste lado
    const f=.6/comp,m1={x:a.x+(b.x-a.x)*(.5-f),y:a.y+(b.y-a.y)*(.5-f)},m2={x:a.x+(b.x-a.x)*(.5+f),y:a.y+(b.y-a.y)*(.5+f)};
    const v1={...vis,id:nid('parede'),...N({x:(a.x+m1.x)/2-comp*(.5-f)/2,y:(a.y+m1.y)/2-t/2,w:comp*(.5-f),h:t},W,H),angulo:vis.angulo},v2={...vis,id:nid('parede'),...N({x:(m2.x+b.x)/2-comp*(.5-f)/2,y:(m2.y+b.y)/2-t/2,w:comp*(.5-f),h:t},W,H),angulo:vis.angulo};
    out.push(v1,v2,...blocosLinha([a,m1],t,W,H,{de:v1.id}),...blocosLinha([m2,b],t,W,H,{de:v2.id}));
   }else out.push(vis,...blocosLinha([a,b],t,W,H,{de:vis.id}));});
  return out;
 }
 return out;
}
// contorno da peça para o "fantasma" (metros): retângulos e linhas
export function contorno(id,p,{M=2,giro=0,t=.3}={}){
 const g=((giro%4)+4)%4;
 if(['parede','parede_porta','parede_janela','passagem','mureta'].includes(id)){const b=bordaMaisPerto(p,M,g);return {rets:[b.hor?{x:b.x,y:b.y-t/2,w:M,h:t}:{x:b.x-t/2,y:b.y,w:t,h:M}],linhas:[]};}
 const c=encaixe(p,M,id,g);
 if(id==='parede_diagonal')return {rets:[],linhas:[[g%2?{x:c.x,y:c.y+c.h}:{x:c.x,y:c.y},g%2?{x:c.x+c.w,y:c.y}:{x:c.x+c.w,y:c.y+c.h}]],caixa:c};
 if(id==='parede_curva'){const cantos=[[0,0],[1,0],[1,1],[0,1]],[kx,ky]=cantos[g],a0=[0,Math.PI/2,Math.PI,Math.PI*1.5][g];return {rets:[],linhas:[arco(c.x+kx*c.w,c.y+ky*c.h,M-t/2,a0,a0+Math.PI/2,10)],caixa:c};}
 return {rets:[c],linhas:[]};
}

// ---------------------------------------------------------------- v180: 👷 modo construtor (um personagem que anda e constrói)
// O mestre anda com um construtor (alavanca esquerda / WASD) e a peça "fantasma" fica à frente dele, como no Conan
// Exiles. Quebrar, mover e pintar valem para a peça sob a mira. Tudo em METROS; a cena guarda 28×14.
export const CORES_LISAS=[
 {id:'cor:branco',nome:'Branco',cor:'#e6e1d6'},{id:'cor:cinza',nome:'Cinza',cor:'#7d7d7d'},{id:'cor:preto',nome:'Preto',cor:'#26231f'},
 {id:'cor:vermelho',nome:'Vermelho',cor:'#a8322a'},{id:'cor:laranja',nome:'Laranja',cor:'#c8742a'},{id:'cor:amarelo',nome:'Amarelo',cor:'#d8b23a'},
 {id:'cor:verde',nome:'Verde',cor:'#3f7a3a'},{id:'cor:azul',nome:'Azul',cor:'#2f5f9e'},{id:'cor:roxo',nome:'Roxo',cor:'#6a3f8e'}
];
// v196: mais pisos (texturas de arte/texturas, as mesmas do Chão da Oficina): valem para qualquer peça de chão
export const PISOS=[
 {id:'piso:terra',nome:'Terra batida',src:'arte/texturas/terra.webp',cor:'#8a6a46'},{id:'piso:areia',nome:'Areia',src:'arte/texturas/areia.webp',cor:'#d2b886'},
 {id:'piso:grama',nome:'Grama',src:'arte/texturas/grama.webp',cor:'#5b8a45'},{id:'piso:pedra',nome:'Lajota de pedra',src:'arte/texturas/pedra.webp',cor:'#8d8f93'},
 {id:'piso:rocha',nome:'Rocha',src:'arte/texturas/rocha.webp',cor:'#6c6a68'},{id:'piso:tijolo',nome:'Piso de tijolo',src:'arte/texturas/tijolo.webp',cor:'#a2503a'},
 {id:'piso:madeira',nome:'Tábuas de madeira',src:'arte/texturas/madeira.webp',cor:'#8c603a'},{id:'piso:palha',nome:'Palha',src:'arte/texturas/palha.webp',cor:'#c9b05a'},
 {id:'piso:azulejo',nome:'Azulejo',src:'arte/texturas/azulejo.webp',cor:'#5f93b5'},{id:'piso:metal',nome:'Placa de metal',src:'arte/texturas/metal.webp',cor:'#8a95a1'},
 {id:'piso:telha',nome:'Telha',src:'arte/texturas/telha.webp',cor:'#b65a3a'},{id:'piso:agua',nome:'Água rasa',src:'arte/texturas/agua.webp',cor:'#4a86b8'},
 {id:'piso:aco_escovado',nome:'Aço escovado',src:'arte/texturas/aco_escovado.webp',cor:'#aab2ba'},{id:'piso:chapa_xadrez',nome:'Chapa xadrez',src:'arte/texturas/chapa_xadrez.webp',cor:'#7d838a'},{id:'piso:painel_scifi',nome:'Painel sci-fi',src:'arte/texturas/painel_scifi.webp',cor:'#1d2530'},{id:'piso:metal_ferrugem',nome:'Metal enferrujado',src:'arte/texturas/metal_ferrugem.webp',cor:'#8a5a3a'},{id:'piso:cromado',nome:'Cromado',src:'arte/texturas/cromado.webp',cor:'#c9d3dd'},
 {id:'piso:marmore_branco',nome:'Mármore branco',src:'arte/texturas/marmore_branco.webp',cor:'#ebe8e1'},{id:'piso:marmore_negro',nome:'Mármore negro',src:'arte/texturas/marmore_negro.webp',cor:'#1c1c21'},{id:'piso:marmore_vermelho',nome:'Mármore vermelho',src:'arte/texturas/marmore_vermelho.webp',cor:'#8a2323'},
 {id:'piso:ouro',nome:'Ouro',src:'arte/texturas/ouro.webp',cor:'#d9a520'},{id:'piso:jade',nome:'Jade',src:'arte/texturas/jade.webp',cor:'#2f8f6a'},
 {id:'piso:agua_rasa',nome:'Água rasa',src:'arte/texturas/agua_rasa.webp',cor:'#58c4cc'},{id:'piso:agua_profunda',nome:'Água profunda',src:'arte/texturas/agua_profunda.webp',cor:'#164e96'},{id:'piso:agua_pantano',nome:'Água de pântano',src:'arte/texturas/agua_pantano.webp',cor:'#58702e'},{id:'piso:agua_suja',nome:'Água turva',src:'arte/texturas/agua_suja.webp',cor:'#8a6c3e'},{id:'piso:areia_clara',nome:'Areia clara',src:'arte/texturas/areia_clara.webp',cor:'#eadab0'},{id:'piso:areia_escura',nome:'Areia vulcânica',src:'arte/texturas/areia_escura.webp',cor:'#4c4846'},{id:'piso:areia_deserto',nome:'Areia do deserto',src:'arte/texturas/areia_deserto.webp',cor:'#d49a58'},{id:'piso:terra_rachada',nome:'Terra rachada',src:'arte/texturas/terra_rachada.webp',cor:'#b88458'},{id:'piso:lama',nome:'Lama',src:'arte/texturas/lama.webp',cor:'#6a4a2c'},{id:'piso:terra_batida',nome:'Terra batida',src:'arte/texturas/terra_batida.webp',cor:'#92704a'},{id:'piso:cascalho',nome:'Cascalho',src:'arte/texturas/cascalho.webp',cor:'#8a8478'},{id:'piso:pedregulhos',nome:'Rochas soltas',src:'arte/texturas/pedregulhos.webp',cor:'#8a6a48'},{id:'piso:grama_curta',nome:'Grama curta',src:'arte/texturas/grama_curta.webp',cor:'#4f8c3e'},{id:'piso:grama_alta',nome:'Grama alta',src:'arte/texturas/grama_alta.webp',cor:'#2f6a30'},{id:'piso:grama_seca',nome:'Grama seca',src:'arte/texturas/grama_seca.webp',cor:'#b49a56'},{id:'piso:flores_amarelas',nome:'Flores amarelas',src:'arte/texturas/flores_amarelas.webp',cor:'#6a9a42'},{id:'piso:flores_vermelhas',nome:'Flores vermelhas',src:'arte/texturas/flores_vermelhas.webp',cor:'#6a9a42'},{id:'piso:flores_azuis',nome:'Flores azuis',src:'arte/texturas/flores_azuis.webp',cor:'#6a9a42'},{id:'piso:sucata',nome:'Sucata',src:'arte/texturas/sucata.webp',cor:'#6a5a50'},{id:'piso:lixo',nome:'Lixo',src:'arte/texturas/lixo.webp',cor:'#4a4238'},{id:'piso:lava',nome:'Lava vulcânica',src:'arte/texturas/lava.webp',cor:'#d4541c'},{id:'piso:lava_fluida',nome:'Lava fluida',src:'arte/texturas/lava_fluida.webp',cor:'#e86a14'},{id:'piso:rocha_vulcanica',nome:'Rocha vulcânica',src:'arte/texturas/rocha_vulcanica.webp',cor:'#322e34'},
 {id:'piso:solo_nevado',nome:'Solo nevado',src:'arte/texturas/solo_nevado.webp',cor:'#e4eefa'},{id:'piso:gelo',nome:'Gelo',src:'arte/texturas/gelo.webp',cor:'#a8d8f0'},{id:'piso:parede_gelo',nome:'Parede de gelo',src:'arte/texturas/parede_gelo.webp',cor:'#7ab8e6'},{id:'piso:paredao_gelo',nome:'Paredão de gelo',src:'arte/texturas/paredao_gelo.webp',cor:'#5a9ad6'},
 {id:'piso:chao_floresta',nome:'Chão de floresta',src:'arte/texturas/chao_floresta.webp',cor:'#2a3a1a'},{id:'piso:chao_floresta_outono',nome:'Chão de outono',src:'arte/texturas/chao_floresta_outono.webp',cor:'#6a3a1e'},{id:'piso:chao_floresta_neve',nome:'Chão de floresta nevada',src:'arte/texturas/chao_floresta_neve.webp',cor:'#dde8f4'},{id:'piso:chao_conifera',nome:'Chão de coníferas',src:'arte/texturas/chao_conifera.webp',cor:'#4a3220'},{id:'piso:chao_tropical',nome:'Chão tropical',src:'arte/texturas/chao_tropical.webp',cor:'#1c3a1c'},{id:'piso:chao_palmeiral',nome:'Chão de palmeiral',src:'arte/texturas/chao_palmeiral.webp',cor:'#d8c088'},{id:'piso:chao_arbustal',nome:'Chão de arbustal',src:'arte/texturas/chao_arbustal.webp',cor:'#a87a48'}
];
export const pisoDe=id=>PISOS.find(p=>p.id===id)||null;
// o que o construtor "segura" para pôr e pintar: os 8 materiais, os pisos e as cores lisas
export const PINTURAS=[...MATERIAIS.map(m=>({id:m.id,nome:m.nome,cor:m.cor})),...PISOS.map(p=>({id:p.id,nome:'Piso: '+p.nome,cor:p.cor})),...CORES_LISAS];
// categoria de um objeto do banco (para a paleta do controle): pelo nome, id e tipo visual
export function categoriaDeObjeto(o){
 const t=String(((o?.nome||'')+' '+(o?.id||'')+' '+(o?.tipoVisual||'')+' '+(o?.categoria||''))).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const R=[['🪑 Móveis',/cama|mesa|cadeira|banco\b|sofa|armario|estante|balcao|cofre|ba[uú]|gaveta|mesinha|poltrona|tapete|prateleira|fogao|pia\b|vaso\b|chuveiro|cozinha|beliche/],['🌳 Natureza',/arvore|arbusto|planta|flor|pedra|rocha|palmeira|grama|tronco|riacho|mato|cacto/],['💡 Luz e tecnologia',/lampada|luminaria|tocha|lanterna|luz\b|terminal|computador|console|painel|monitor|antena|gerador|tecnologia/],['📦 Caixas e barris',/caixa|barril|caixote|saco|tonel|engradado|pilha/],['🚗 Veículos e naves',/veiculo|nave|moto|carro|rover|shuttle|disco|cargueiro|aerocarro/],['🏛️ Construção',/parede|muro|porta|janela|escada|coluna|portao|toldo|telhado|cerca|grade/],['🎭 Decoração',/estatua|quadro|bandeira|vela|fonte|varal|barraca|tenda|mascara/]];
 for(const [n,re] of R)if(re.test(t))return n;return '🧰 Outros';
}
export const corLisa=id=>CORES_LISAS.find(c=>c.id===id)||null;
export const ehParede=id=>['parede','parede_porta','parede_janela','passagem','mureta'].includes(id);
// ponto de mira: à frente do construtor, ou onde a alavanca direita/o mouse apontou (deslocamento em metros)
export function miraDe(p,facing=0,M=2,desl=null){
 if(desl&&(desl.x||desl.y))return {x:p.x+desl.x,y:p.y+desl.y};
 const d=M*.75+.6;return {x:p.x+Math.cos(facing)*d,y:p.y+Math.sin(facing)*d};
}
// parede de frente para quem constrói: olhando para os lados → parede em pé; para cima/baixo → deitada
export const giroAuto=facing=>Math.abs(Math.cos(facing))>=Math.abs(Math.sin(facing))?1:0;
export function limitarDesl(d,max=8){const m=Math.hypot(d.x,d.y);return m>max?{x:d.x/m*max,y:d.y/m*max}:d;}
// peça inteira de um objeto: a parte desenhada + os blocos invisíveis que barram ao longo dela
export function grupoDaPeca(objs,o){
 if(!o)return [];const raiz=o.colisaoV177?(objs.find(x=>String(x.id)===String(o.colisaoV177))||o):o,id=String(raiz.id);
 return objs.filter(x=>String(x.id)===id||String(x.colisaoV177||'')===id);
}
// o que está sob a mira (o menor; ignora o fundo e o chão do mapa inteiro; bloco invisível vale pela peça dele)
export function alvoNaMira(objs,p,W,H,folga=.2){
 let m=null,am=1e9;
 for(const o of objs||[]){
  const e=o.oficinaElement||{};if(e.fundoV161||e.acimaV163||o.fundoV161||/:fundo$|:acima$/.test(String(o.id))||o.destruido)continue;
  const g=Math.abs(Math.round((Number(o.angulo)||0)/90))%2===1,w=(g?+o.alturaM:+o.larguraM)||1,h=(g?+o.larguraM:+o.alturaM)||1,x=Number(o.x)*W/28,y=Number(o.y)*H/14;
  if(w*h>=W*H*.5)continue; // chão do mapa inteiro: não se quebra por engano
  if(Math.abs(p.x-x)<=w/2+folga&&Math.abs(p.y-y)<=h/2+folga){
   const a=w*h*(o.invisivelV161&&!o.colisaoV177?50:1)*(Number(o.camada)>=5?40:1); // invisível solto e telhado só se não houver outra coisa
   if(a<am){am=a;m=o;}}
 }
 if(m?.colisaoV177)m=(objs||[]).find(x=>String(x.id)===String(m.colisaoV177))||m;
 return m;
}
// arrastar uma peça (com os blocos dela) dx,dy metros
export const deslocar=(lista,dx,dy,W,H)=>lista.map(o=>({...o,x:+(Number(o.x)+dx*28/W).toFixed(4),y:+(Number(o.y)+dy*14/H).toFixed(4)}));
export function centroDe(lista,W,H){const v=lista.filter(o=>!o.invisivelV161);const l=v.length?v:lista;if(!l.length)return {x:0,y:0};
 return {x:l.reduce((s,o)=>s+Number(o.x)*W/28,0)/l.length,y:l.reduce((s,o)=>s+Number(o.y)*H/14,0)/l.length};}
export const encaixar=(v,passo=.5)=>Math.round(v/passo)*passo;
// qual "parte" do material vale para o objeto (para pintar com a textura certa)
export function parteDe(o){
 const p=o?.parteV177||({parede:'parede',mureta:'parede',parede_diagonal:'parede',parede_curva:'parede',parede_redonda:'parede',chao:'chao',teto:'teto',porta:'porta',janela:'janela',escada:'escada'})[o?.oficina3];
 if(p)return p;if(/porta/i.test(o?.nome||''))return 'porta';if(o?.tetoV139)return 'teto';return o?.bloqueiaMovimento?'parede':'chao';
}
// pintar: material (textura da parte certa) ou cor lisa. Objeto do banco (imagem) não se pinta → null
export function pintar(o,pid){
 if(!o||o.invisivelV161||(o.imagem&&!o.forma))return null;
 const pi=pisoDe(pid);
 if(pi){ // v196: piso só vale para peças de chão
  if(parteDe(o)!=='chao')return null;
  const {corLisaV180,materialV177,...r}=o;
  return {...r,nome:/ · /.test(String(o.nome||''))?String(o.nome).replace(/ · .*$/,' · '+pi.nome):'Chão · '+pi.nome,cor:pi.cor,textura:pi.src,texturaM:2,texturaId:pid.slice(5),pisoV196:pid};
 }
 const c=corLisa(pid);
 const nome=n=>/ · /.test(String(o.nome||''))?String(o.nome).replace(/ · .*$/,' · '+n):o.nome;
 if(c){const {textura,texturaM,texturaId,...r}=o;return {...r,nome:nome(c.nome),cor:c.cor,corLisaV180:c.id};}
 const m=matDe(pid),parte=parteDe(o),{corLisaV180,texturaId,...r}=o;
 return {...r,nome:nome(m.nome),cor:m.cor,textura:texMat(m.id,parte),texturaM:{parede:1.5,porta:1,janela:1,escada:1}[parte]||2,materialV177:m.id,parteV177:parte,...(parte==='parede'?{material:m.mat}:{})};
}
// peça nova com cor lisa: põe com um material e troca a textura pela cor
export const colorir=(lista,pid)=>{if(!corLisa(pid)&&!pisoDe(pid))return lista;return lista.map(o=>o.invisivelV161?o:pintar(o,pid)||o);};
// saídas (🚪 ligações entre mapas) perto do construtor: ponta deste mapa a até "raio" metros
export function saidaPerto(ligs,mapa,p,W,H,raio=1.1){
 let m=null,dm=raio;
 for(const l of ligs||[])for(const [de,para] of [[l.a,l.b],[l.b,l.a]]){
  if(String(de?.mapa||'')!==String(mapa)||!para?.mapa||String(para.mapa)===String(mapa))continue;
  const d=Math.hypot(Number(de.x)*W/28-p.x,Number(de.y)*H/14-p.y);if(d<=dm){dm=d;m={lig:l,de,para};}}
 return m;
}
// chegada pela outra ponta: um pouco para dentro do mapa (para não voltar na hora)
export function chegadaDentro(pt,W,H,dist=1.8){
 const x=Number(pt?.x)*W/28,y=Number(pt?.y)*H/14,cx=W/2,cy=H/2,d=Math.hypot(cx-x,cy-y)||1,k=Math.min(dist,d);
 return {x:Math.max(.5,Math.min(W-.5,x+(cx-x)/d*k)),y:Math.max(.5,Math.min(H-.5,y+(cy-y)/d*k))};
}
