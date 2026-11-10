// Laboratório v224.3: renderização ortográfica de geometria 3D em Canvas 2D.
// Projeção de vértices reais [x,y,z], não fachadas coladas em um tabuleiro 2D.
// Apenas visualização experimental; não escreve no Firebase.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Inspirado na leitura isometrica de RPGs classicos: norte estavel, cameras sem rotacao livre no jogo.
const JOGO_YAW=-Math.PI/4, JOGO_PITCH=.72, JOGO_ZOOM=1.38;
const MESTRE_YAW=-Math.PI/4, MESTRE_PITCH=.68;
// Projeção estável, oblíqua, mais próxima da leitura clássica dos RPGs 2.5D.
const CONSTRUTOR_YAW=-Math.PI/4, CONSTRUTOR_PITCH=.82;
const V=(x,y,z=0)=>[x,y,z];
const casa={x:9,y:5,w:7,d:5,h:3.2,telhado:1.7};
const faces=[];
function face(vs,cor,borda='#24313b',camada=0,material='',imagem=''){faces.push({vs,cor,borda,camada,material,imagem,indice:faces.length});}
function caixa(x,y,z,w,d,h,cores,estilo='',imagemTopo=''){
 const A=V(x,y,z),B=V(x+w,y,z),C=V(x+w,y+d,z),D=V(x,y+d,z);
 const E=V(x,y,z+h),F=V(x+w,y,z+h),G=V(x+w,y+d,z+h),H=V(x,y+d,z+h);
 face([A,B,F,E],cores[0],null,0,estilo);face([B,C,G,F],cores[1],null,0,estilo);face([D,C,G,H],cores[2],null,0,estilo);face([D,A,E,H],cores[3],null,0,estilo);face([E,F,G,H],cores[4],null,0,estilo,imagemTopo);
}
const casaFaces=()=>{
 faces.length=0;
 // Terreno, estrada, cercado e sombra compartilham o mesmo plano do cenário.
 face([V(0,0),V(28,0),V(28,18),V(0,18)],'#61785b','#61785b');
 face([V(0,12),V(28,12),V(28,16),V(0,16)],'#9e9a86','#9e9a86');
 face([V(0,12),V(28,12),V(28,12.18),V(0,12.18)],'#ded3b4','#ded3b4');
 face([V(0,15.82),V(28,15.82),V(28,16),V(0,16)],'#ded3b4','#ded3b4');
 // Fundação de pedra de 7 x 5 metros e paredes de 3,2 metros.
 caixa(casa.x,casa.y,0,casa.w,casa.d,.28,['#77756b','#64655e','#77756b','#5c5b55','#b0a795']);
 caixa(casa.x+.15,casa.y+.15,.28,casa.w-.3,casa.d-.3,casa.h-.28,['#c9ae85','#977552','#d1b28c','#af8965','#d2b48b']);
 const x=casa.x,y=casa.y,w=casa.w,d=casa.d,h=casa.h,r=casa.telhado,ext=.45;
 // Telhado em duas águas: cumeeira paralela ao eixo y.
 const L=x-ext,R=x+w+ext,M=x+w/2;
 const front=y-ext,back=y+d+ext,wall=h-.03,top=h+r;
 face([V(L,front,wall),V(M,front,top),V(M,back,top),V(L,back,wall)],'#775341','#513a32');
 face([V(M,front,top),V(R,front,wall),V(R,back,wall),V(M,back,top)],'#a15f48','#543529');
 face([V(L,front,wall),V(M,front,top),V(R,front,wall)],'#6d4a39','#453126');
 face([V(L,back,wall),V(R,back,wall),V(M,back,top)],'#6a4637','#453126');
 // Ripas do telhado como geometria e chaminé com altura real.
 caixa(x+4.8,y+3.4,h+.5,.75,.7,1.7,['#8e5040','#803e32','#8e5040','#803e32','#b66b4d']);
 // Janelas e portas estão em planos verticais à frente das paredes.
 face([V(x+2.7,y-.016,.29),V(x+4.1,y-.016,.29),V(x+4.1,y-.016,2.35),V(x+2.7,y-.016,2.35)],'#59443b','#302b2a');
 face([V(x+.75,y-.02,1.2),V(x+2.05,y-.02,1.2),V(x+2.05,y-.02,2.3),V(x+.75,y-.02,2.3)],'#72b8bc','#2a4a53');
 face([V(x+w-.02,y+1.4,1.2),V(x+w-.02,y+2.9,1.2),V(x+w-.02,y+2.9,2.4),V(x+w-.02,y+1.4,2.4)],'#65aeb5','#294b52');
};

// Telhado agrupado pelas peças reais do construtor. Volume com duas águas,
// cumeeira, empenas e beirais, em vez de placas separadas por módulo.
function telhadoCasa(box,material){
 const {x,y,w,h}=box,e=.28,z=2.72,r=Math.max(.85,Math.min(1.35,Math.min(w,h)*.29));
 const cor=material==='tijolo'?['#824d43','#ab6b52','#70443b']:material==='madeira'?['#57483f','#80604d','#4a3b34']:['#82624b','#a77759','#634c41'];
 if(w>=h){
  const mid=y+h/2;
  face([V(x-e,y-e,z),V(x+w+e,y-e,z),V(x+w+e,mid,z+r),V(x-e,mid,z+r)],cor[0],'#483a34',0,'telhas');
  face([V(x-e,mid,z+r),V(x+w+e,mid,z+r),V(x+w+e,y+h+e,z),V(x-e,y+h+e,z)],cor[1],'#483a34',0,'telhas');
  face([V(x,y,z),V(x,mid,z+r),V(x,y+h,z)],cor[2],'#493931');
  face([V(x+w,y,z),V(x+w,y+h,z),V(x+w,mid,z+r)],cor[2],'#493931');
 }else{
  const mid=x+w/2;
  face([V(x-e,y-e,z),V(mid,y-e,z+r),V(mid,y+h+e,z+r),V(x-e,y+h+e,z)],cor[0],'#483a34',0,'telhas');
  face([V(mid,y-e,z+r),V(x+w+e,y-e,z),V(x+w+e,y+h+e,z),V(mid,y+h+e,z+r)],cor[1],'#483a34',0,'telhas');
  face([V(x,y,z),V(x+w,y,z),V(mid,y,z+r)],cor[2],'#493931');
  face([V(x,y+h,z),V(mid,y+h,z+r),V(x+w,y+h,z)],cor[2],'#493931');
 }
 // As antigas fiadas eram quadriláteros quase coplanares às águas:
 // ao girar, alternavam à frente/atrás do telhado. Guardar só a geometria maciça.
 const linha=material==='madeira'?'#554338':'#805447';
 for(const t of []){
  if(w>=h){
   const mid=y+h/2,frente=y-e,tras=y+h+e;
   const ya=frente+(mid-frente)*t,za=z+r*t+.02;
   const yb=tras+(mid-tras)*t,zb=z+r*t+.02;
   face([V(x-e,ya,za),V(x+w+e,ya,za),V(x+w+e,ya+.024,za),V(x-e,ya+.024,za)],linha,null);
   face([V(x-e,yb,zb),V(x+w+e,yb,zb),V(x+w+e,yb-.024,zb),V(x-e,yb-.024,zb)],linha,null);
  }else{
   const mid=x+w/2,esq=x-e,dir=x+w+e;
   const xa=esq+(mid-esq)*t,xb=dir+(mid-dir)*t,za=z+r*t+.02;
   face([V(xa,y-e,za),V(xa+.024,y-e,za),V(xa+.024,y+h+e,za),V(xa,y+h+e,za)],linha,null);
   face([V(xb,y-e,za),V(xb-.024,y-e,za),V(xb-.024,y+h+e,za),V(xb,y+h+e,za)],linha,null);
  }
 }
 if(w>=h){
  const mid=y+h/2;
  face([V(x-e,mid-.042,z+r+.045),V(x+w+e,mid-.042,z+r+.045),V(x+w+e,mid+.042,z+r+.045),V(x-e,mid+.042,z+r+.045)],'#71513e',null);
 }else{
  const mid=x+w/2;
  face([V(mid-.042,y-e,z+r+.045),V(mid+.042,y-e,z+r+.045),V(mid+.042,y+h+e,z+r+.045),V(mid-.042,y+h+e,z+r+.045)],'#71513e',null);
 }
 // Chaminé apenas nas casas maiores. Fica sobre a água do telhado.
 if(w>=5.5){
  const px=x+w*.73,py=y+h*.67,bz=z+r*.58;
  caixa(px,py,bz,.46,.45,1.08,['#806858','#715547','#af8d78','#735747','#ccaa8e']);
  caixa(px-.07,py-.07,bz+1.04,.60,.59,.15,['#66605b','#4b4a49','#837b73','#4b4746','#93877c']);
 }
}
// Conversão de objetos reais do mapa. x/y são porcentagens 28x14 do motor;
// larguraM/alturaM e z são metros. Nenhum dado é alterado aqui.
function montarCenaReal(scene,W,H,mostrarTelhados=true,modoInterior=false){
 const lista=Array.isArray(scene?.objects)?scene.objects:[];
 if(!lista.length){faces.length=0;face([V(0,0),V(W,0),V(W,H),V(0,H)],'#607b5a',null,-20);return true;}
 faces.length=0;
 face([V(0,0),V(W,0),V(W,H),V(0,H)],'#607b5a',null,-20);
 const cores={
  madeira:['#a5815e','#825c3c','#c1a17b','#705238','#b69770'],
  tijolo:['#b7684a','#91503a','#cb8667','#8c4d37','#ad6b50'],
  adobe:['#cbb08c','#b29a77','#dec49a','#a88c69','#d3bb95'],
  pedra:['#b6b3a9','#858780','#c5c5bc','#8b8982','#b0afa8']
 };
 let visiveis=0;
 const gruposTelhado=new Map();
 const normal=(n,def)=>Number.isFinite(Number(n))?Number(n):def;
 const objects=lista.filter(o=>o&&!o.destruido&&!o.invisivelV161&&o.opacity!==0).slice(0,1500);
 const imagemObjeto=o=>{
  const raw=o?.imagem?.url||o?.imagem?.src||o?.imagem||o?.src||o?.imagemUrl||'';
  const value=typeof raw==='string'?raw:'';
  const textura=typeof o?.textura==='string'?o.textura:'';
  const css=textura.match(/^url\(\s*['"]?([^'")]+)['"]?\s*\)$/i);
  const path=value||(css?.[1]||textura);
  // Somente fontes de imagem, nunca HTML/scripts.
  return /^(https?:\/\/|data:image\/|\/|arte\/|assets\/|imagens\/)/i.test(path)?path:'';
 };
 const prioridade=o=>o.oficina3==='chao'?0:o.oficina3==='teto'?2:1;
 objects.sort((a,b)=>prioridade(a)-prioridade(b));
 for(const o of objects){
  const cx=normal(o.x,NaN)*W/28,cy=normal(o.y,NaN)*H/14;
  const w=normal(o.larguraM,0),h=normal(o.alturaM,0);
  if(![cx,cy,w,h].every(Number.isFinite)||w<=0||h<=0)continue;
  const x=cx-w/2,y=cy-h/2,kind=String(o.oficina3||o.parteV177||'').toLowerCase();
  const mat=String(o.materialV177||o.material||'').toLowerCase();
  const pal=cores[mat]||cores[mat.includes('pedra')?'pedra':'madeira'];
  if(kind==='chao'||o.camada===1&&kind!=='escada'){
   const estrada=/rua|travessa|praça|calçada|caminho/i.test(String(o.nome||''));
   const nome=String(o.nome||'');
   const corPadrao=estrada?(mat.includes('rio')?'#a29d89':'#b7ad94'):(/solo|terreno/i.test(nome)?'#668263':pal[4]);
   // Só cores hexadecimais são aceitas: qualquer mapa legado mantém a paleta atual.
   const cor=/^#[0-9a-f]{6}$/i.test(String(o.corChaoV253||''))?o.corChaoV253:corPadrao;
   const ordem=Number(o.ordemChaoV253);
   const planoCamada=o.pilotoTerrenoV253&&Number.isFinite(ordem)?ordem:
     /praça/i.test(nome)?3:estrada?2:/solo|terreno/i.test(nome)?0:1;
   // O lote piloto afunila apenas 1,1 m de cada lado da borda distante.
   // A frente permanece larga. A projeção ortográfica e a escala das casas
   // continuam intactas, com um terreno menos parecido com uma placa retangular.
   const contorno=o.pilotoTerrenoV253&&ordem===0&&w>20&&h>10
    ?[V(x+1.1,y,.018),V(x+w-1.1,y,.018),V(x+w,y+h,.018),V(x,y+h,.018)]
    :[V(x,y,.018),V(x+w,y,.018),V(x+w,y+h,.018),V(x,y+h,.018)];
   // Ordem de terreno invariável entre ângulos: sem z-fighting de pisos coplanares.
   const estiloChao=/piso|assoalho|chão/i.test(nome)&&mat==='madeira'?'assoalho':
     /solo|terreno|piso/i.test(nome)?'terreno':estrada?'caminho':'';
    face(contorno,cor,null,planoCamada,estiloChao);
   // Ruas contínuas sem juntas coplanares sobrepostas que tremulam com a câmera.
  }else if(kind==='arvore_vila'){
   // Tronco elevado e copa em volumes: ambos participam da ordenação de
   // profundidade, de modo que ocultem personagens atrás.
   const cx=x+w/2,cy=y+h/2;
   caixa(cx-.17,cy-.17,.02,.34,.34,1.65,['#62432f','#503626','#806044','#5a3b29','#806045']);
   caixa(x+.12,y+.12,1.48,w-.24,h-.24,1.10,['#52783e','#395e34','#78944b','#466b37','#8daa54']);
   caixa(x+w*.24,y+h*.19,2.38,w*.55,h*.58,.57,['#608c47','#456c3a','#94ab59','#456a39','#a6b966']);
  }else if(kind==='poco_vila'){
   // Poço octogonal baixo, com abertura escura e cobertura de madeira.
   const cx=x+w/2,cy=y+h/2,R=Math.min(w,h)*.43,n=8;
   const pts=Array.from({length:n},(_,i)=>[cx+Math.cos(Math.PI*i/4)*R,cy+Math.sin(Math.PI*i/4)*R]);
   for(let i=0;i<n;i++){
    const a=pts[i],b=pts[(i+1)%n];
    face([V(a[0],a[1],.06),V(b[0],b[1],.06),V(b[0],b[1],.90),V(a[0],a[1],.90)],i%2?'#78776e':'#9c9788','#57564f');
   }
   face(pts.map(p=>V(p[0],p[1],.93)),'#77756b','#5b584e');
   face(pts.map(p=>V(cx+(p[0]-cx)*.66,cy+(p[1]-cy)*.66,.96)),'#283942','#555b59');
   caixa(cx-R*.7,cy-.12,.9,.18,.24,1.35,['#68513a','#4e392c','#806046','#59432f','#886c4d']);
   caixa(cx+R*.54,cy-.12,.9,.18,.24,1.35,['#68513a','#4e392c','#806046','#59432f','#886c4d']);
   face([V(cx-R*.83,cy-.42,2.2),V(cx+R*.83,cy-.42,2.2),V(cx+R*.83,cy,2.65),V(cx-R*.83,cy,2.65)],'#8d543b','#4b382b');
   face([V(cx-R*.83,cy,2.65),V(cx+R*.83,cy,2.65),V(cx+R*.83,cy+.42,2.2),V(cx-R*.83,cy+.42,2.2)],'#694c39','#4b382b');
  }else if(kind==='poste_vila'){
   const cx=x+w/2,cy=y+h/2;
   caixa(cx-.1,cy-.1,0,.2,.2,2.35,['#71523a','#533b2b','#94704d','#5c422f','#a78157']);
   caixa(cx-.28,cy-.24,2.20,.56,.48,.42,['#d4a24f','#ac6d2b','#f2c976','#9a662b','#f6d994']);
   caixa(cx-.36,cy-.31,2.63,.72,.62,.13,['#4b4033','#4b4033','#6d5b44','#4b4033','#7b6046']);
  }else if(kind==='barril_vila'||kind==='caixote_vila'){
   const barril=kind==='barril_vila';
   caixa(x,y,.02,w,h,barril?.90:.68,barril?
    ['#886243','#6f4b34','#a17a51','#6a4933','#c29a61']:
    ['#a77e55','#85613f','#bd9064','#76563a','#be9568']);
   if(barril){
    caixa(x-.025,y-.025,.23,w+.05,h+.05,.10,['#555558','#4a4b50','#64666b','#4c4c50','#74757b']);
    caixa(x-.025,y-.025,.70,w+.05,h+.05,.09,['#555558','#4a4b50','#64666b','#4c4c50','#74757b']);
   }
  }else if(kind==='parede'||kind==='mureta'){
   const alturaOriginal=normal(o.alturaParedeM,kind==='mureta'?.9:2.7);
   const altura=modoInterior&&kind==='parede'?Math.min(.72,alturaOriginal):alturaOriginal;
   caixa(x,y,0,w,h,altura,pal,kind==='parede'?'fachada':'');
   // v243: embasamento de pedra e montantes aparentes tornam fachadas
   // identificáveis sem alterar a colisão nem a posição real das paredes.
   if(kind==='parede'&&altura>=2.3){
    const pedra=['#777a74','#63655e','#96978c','#64645c','#a7a99b'];
    caixa(x,y,.03,w,h,.25,pedra);
    if(['madeira','adobe','bambu'].includes(mat)){
     const madeira=['#634735','#513b2e','#806049','#4d392d','#9a7759'];
     if(w>=h){
      const largura=Math.min(.14,w*.21);
      caixa(x,y,0,largura,h,altura,madeira);
      if(w>1.15)caixa(x+w-largura,y,0,largura,h,altura,madeira);
     }else{
      const largura=Math.min(.14,h*.21);
      caixa(x,y,0,w,largura,altura,madeira);
      if(h>1.15)caixa(x,y+h-largura,0,w,largura,altura,madeira);
     }
    }
   }
  }else if(kind==='porta'||kind==='janela'){
   const janela=kind==='janela',altura=modoInterior ? .68 : (janela ? 1.05 : 2.25),z=modoInterior ? 0 : (janela ? 1.10 : 0);
   // A janela substitui um segmento da parede funcional. Completar o volume
   // desse mesmo segmento acima/abaixo do vão para não deixar faixas vazias.
   const alturaParede=2.72;
   if(janela&&!modoInterior){
    const peitoril=Math.max(.12,z),verga=z+altura;
    caixa(x,y,0,w,h,peitoril,pal);
    if(verga<alturaParede-.02)caixa(x,y,verga,w,h,alturaParede-verga,pal);
   }else if(!modoInterior&&altura<alturaParede-.02){
    // Bandeira de parede acima da porta, mantendo a passagem livre.
    caixa(x,y,altura,w,h,alturaParede-altura,pal);
   }
   const comprimento=Math.max(w,h),gross=.065;
   const cor=modoInterior?'#896d56':janela?'#74b5c4':'#644430';
   const borda=janela?'#dfd4b9':'#c19c70';
   // Vãos existentes no mapa viram esquadrias verticais. As molduras
   // continuam presas ao objeto original e seguem sua posição.
   const horizontal=w>=h;
   const painel=(a,b,lo,hi,color)=>{
    if(horizontal){const yy=y+h/2;face([V(a,yy,lo),V(b,yy,lo),V(b,yy,hi),V(a,yy,hi)],color,null);}
    else{const xx=x+w/2;face([V(xx,a,lo),V(xx,b,lo),V(xx,b,hi),V(xx,a,hi)],color,null);}
   };
   const ini=horizontal?x:y,fim=ini+comprimento;
   painel(ini,fim,z,z+altura,borda);
   const margem=Math.min(.115,comprimento*.12);
   painel(ini+margem,fim-margem,z+.11,z+altura-.11,cor);
   if(janela&&!modoInterior){
    const mid=(ini+fim)/2;
    painel(mid-gross/2,mid+gross/2,z+.1,z+altura-.1,'#e6d9bb');
    painel(ini+margem,fim-margem,z+altura*.49,z+altura*.49+.075,'#e6d9bb');
    painel(ini-.14,fim+.14,z-.11,z+.045,'#b1a18c');
   }else if(!modoInterior){
    painel(ini+margem,ini+margem+.07,z+.1,z+altura-.12,'#8a6148');
    const puxador=ini+comprimento*.77;
    painel(puxador,puxador+.055,z+.95,z+1.04,'#e4bf72');
    // Soleira de pedra com pequena profundidade, em vez de uma faixa solta.
    painel(ini-.10,fim+.10,z,z+.095,'#8d7c68');
    const degrau=['#8a877d','#737167','#a7a297','#76736b','#b5afa4'];
    if(horizontal)caixa(x-.12,y+h/2-.27,.015,w+.24,.54,.12,degrau);
    else caixa(x+w/2-.27,y-.12,.015,.54,h+.24,.12,degrau);
   }
  }else if(kind==='teto'||o.tetoV139){
   if(mostrarTelhados){
    const g=String(o.grupoTetoV177||o.id||'telhado');
    if(!gruposTelhado.has(g))gruposTelhado.set(g,{x,y,x2:x+w,y2:y+h,mat});
    else{const b=gruposTelhado.get(g);b.x=Math.min(b.x,x);b.y=Math.min(b.y,y);b.x2=Math.max(b.x2,x+w);b.y2=Math.max(b.y2,y+h);}
   }
  }else if(kind==='escada'){
   caixa(x,y,0,w,h,.35,pal);
   }else if(o.camada>=2&&w<=6&&h<=6){
   const img=imagemObjeto(o),nome=String(o.nome||'').toLowerCase();
   const plano=/tapete|carpete|piso|passadeira|mosaico|marcação|sinal/i.test(nome);
   // Desenhar a arte original dos tapetes no chão e dos móveis sobre a face.
   if(plano)face([V(x,y,.02),V(x+w,y,.02),V(x+w,y+h,.02),V(x,y+h,.02)],String(o.cor||pal[4]),null,4,'imagem',img);
   else caixa(x,y,0,w,h,Math.min(1.5,Math.max(.16,normal(o.alturaObjetoM,.6))),pal,'',img);
  }else continue;
  visiveis++;
 }
 if(mostrarTelhados){
  for(const roof of gruposTelhado.values())
   telhadoCasa({x:roof.x,y:roof.y,w:roof.x2-roof.x,h:roof.y2-roof.y},roof.mat);
 }
 return true; // Cena identificada, mesmo que alguns objetos não tenham equivalente 3D.
}

export function instalarLaboratorio25D({root=document,win=window,host,cenaAtual=()=>null,dimensoes=()=>({W:28,H:14}),mapaAtual=()=>'',ativo=()=>false,modo=()=>'',mapa=()=>'',idMapa='',aoCliqueChao=null}={}){
 if(!host)return {atualizar(){},destruir(){}};
 const painel=root.createElement('div');painel.id='mtmLab25D';
 painel.style.cssText='position:relative;display:flex;flex-direction:column;gap:0;width:100%;min-height:560px;overflow:hidden;border:1px solid #516a79;border-radius:12px;background:#a6c2ce;touch-action:none';
 const canvas=root.createElement('canvas');canvas.style.cssText='width:100%;height:100%;display:block;cursor:grab;touch-action:none';canvas.setAttribute('aria-label','Protótipo geométrico 2,5D: casa, rua e personagem');
 const help=root.createElement('div');help.style.cssText='padding:7px 12px;background:#111f32;color:#d5e5f6;font:12px Segoe UI,Arial,sans-serif;pointer-events:none';help.textContent='RPG · arraste para mover · roda para aproximar · inspecione objetos';
 const viewport=root.createElement('div');
 viewport.style.cssText='position:relative;width:100%;height:min(72dvh,820px);min-height:500px;overflow:hidden;flex:1 1 auto';
 viewport.append(canvas);painel.append(help,viewport);host.prepend(painel);
 const tools=root.createElement('div');
 // Barra de ferramentas fora da área da câmera: nenhum botão cobre o cenário.
 tools.style.cssText='position:relative;z-index:2;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-start;align-items:center;padding:8px 10px;border-bottom:1px solid #516a79;background:#182a3e';
 const reset=root.createElement('button');reset.type='button';reset.textContent='⌖ Reenquadrar';
 reset.title='Voltar ao ângulo e ao centro recomendados para este modo';
 reset.style.cssText='background:#102339e8;border:1px solid #5c748f;color:#e4f1fd;border-radius:7px;padding:6px 9px;cursor:pointer;font:12px Segoe UI,Arial,sans-serif';
 const roofToggle=root.createElement('button');roofToggle.type='button';roofToggle.textContent='🏠 Telhados: visíveis';
 roofToggle.title='Alternar telhados para inspecionar o interior sem modificar a cena';
 roofToggle.style.cssText=reset.style.cssText;
 const criarBotao=(titulo,dica)=>{
  const b=root.createElement('button');b.type='button';b.textContent=titulo;b.title=dica;
  b.style.cssText=reset.style.cssText;return b;
 };
 const vistaSuperior=criarBotao('⬇ De cima','Ver a distribuição das construções na planta');
 const vistaFrontal=criarBotao('▣ Frente','Ver fachadas de frente e comparar alturas das construções');
 const zoomMenos=criarBotao('−','Afastar câmera');
 const zoomMais=criarBotao('+','Aproximar câmera');
 const foto=criarBotao('📷 PNG','Exportar a vista atual do mapa como imagem');
 const inspecionar=criarBotao('🔎 Inspecionar','Ativar câmera livre temporária para examinar construções');
 const setor=criarBotao('▦ Setores','Exibir a divisão espacial em setores de 8 metros');
 const interior=criarBotao('🚪 Ver interior','Mostrar o interior ocultando o telhado e rebaixando paredes na visualização');
 const infoObjeto=root.createElement('div');
 infoObjeto.style.cssText='position:relative;z-index:2;padding:6px 10px;border-top:1px solid #637b8d;background:#102339;color:#e4f1fd;font:12px Segoe UI,Arial,sans-serif;pointer-events:none';
 infoObjeto.hidden=true; painel.append(infoObjeto);
 // Não deixar os controles extravasarem pela borda direita em telas menores.
 tools.style.width='100%';tools.style.boxSizing='border-box';
 tools.append(roofToggle,interior,inspecionar,setor,vistaSuperior,vistaFrontal,zoomMenos,zoomMais,foto,reset);painel.insertBefore(tools,help);
 // Compor no buffer e publicar apenas quadros completos.
 const buffer=root.createElement('canvas'),ctx=buffer.getContext('2d',{alpha:false});
 const displayCtx=canvas.getContext('2d',{alpha:false});
 let ultimaCenaValida=null,ultimoIdCenaValida='',ultimoPainelVisivel=null;
 const publicarQuadro=()=>{displayCtx.setTransform(1,0,0,1,0,0);displayCtx.drawImage(buffer,0,0);};
 let yaw=-.65,pitch=.62,zoom=1.0,raf=0,drag=null,ultimoModo='',personagem=[18,13,0],selecionado='',modoAtual='mapa-construtor',centroCamera=[14,9],ultimoTokenPos='',ultimoMapaV230='',ultimaCenaRef=null,ultimoVisivel=false;
 let telhadosVisiveis=true,modoInterior=false,inspecaoLivre=false,exibirSetores=false,objetoSelecionadoId='',ignorarCliqueAposArrastar=false;
 const manterNorte=()=>{if(modoAtual==='mapa-construtor'&&!inspecaoLivre){yaw=CONSTRUTOR_YAW;pitch=CONSTRUTOR_PITCH;}};
 const atualizarInspecao=()=>{
  inspecionar.textContent=inspecaoLivre?'🔓 Encerrar inspeção':'🔎 Inspecionar';
  inspecionar.title=inspecaoLivre?'Voltar à orientação fixa do construtor':'Inspecionar a cidade com rotação temporária da câmera';
 };
 inspecionar.addEventListener('click',()=>{
  if(modoAtual==='mapa-jogo')return;
  inspecaoLivre=!inspecaoLivre;
  if(!inspecaoLivre)manterNorte();
  atualizarInspecao();invalidate();
 });
 setor.addEventListener('click',()=>{
  exibirSetores=!exibirSetores;
  setor.textContent=exibirSetores?'▦ Ocultar setores':'▦ Setores';
  invalidate();
 });
 roofToggle.addEventListener('click',()=>{
  telhadosVisiveis=!telhadosVisiveis;
  if(telhadosVisiveis&&modoInterior){modoInterior=false;interior.textContent='🚪 Ver interior';}
  roofToggle.textContent=telhadosVisiveis?'🏠 Telhados: visíveis':'🏠 Telhados: ocultos';invalidate();
 });
 interior.addEventListener('click',()=>{
  modoInterior=!modoInterior;telhadosVisiveis=!modoInterior;
  roofToggle.textContent=telhadosVisiveis?'🏠 Telhados: visíveis':'🏠 Telhados: ocultos';
  interior.textContent=modoInterior?'🚪 Fechar interior':'🚪 Ver interior';invalidate();
 });
 vistaSuperior.addEventListener('click',()=>{if(modoAtual==='mapa-jogo')return;inspecaoLivre=true;atualizarInspecao();yaw=0;pitch=Math.PI/2;invalidate();});
 vistaFrontal.addEventListener('click',()=>{if(modoAtual==='mapa-jogo')return;inspecaoLivre=true;atualizarInspecao();yaw=0;pitch=.30;invalidate();});
 const alterarZoom=passo=>{if(modoAtual==='mapa-jogo')return;zoom=clamp(zoom*passo,.7,3);invalidate();};
 zoomMenos.addEventListener('click',()=>alterarZoom(1/1.2));
 zoomMais.addEventListener('click',()=>alterarZoom(1.2));
 foto.addEventListener('click',()=>{
  if(!mapaAtual())return;
  const link=root.createElement('a');
  link.download='mesa-estelar-mapa-'+String(mapaAtual()).replace(/[^a-z0-9_-]/gi,'_')+'.png';
  link.href=canvas.toDataURL('image/png');link.click();
 });
 const movimentoVisual=new Map();
 const lerTokens=()=>{
  const b=root.getElementById('novaSyncBoard'),d=dimensoes(),W=Number(d?.W)||28,H=Number(d?.H)||14;
  const agora=win.performance.now();
  return [...(b?.querySelectorAll('[data-token]')||[])].map(el=>{
   const id=el.dataset.token,x=parseFloat(el.style.left)*W/100,y=parseFloat(el.style.top)*H/100;
   const prev=movimentoVisual.get(id);
   const mudou=prev&&Math.hypot(x-prev.x,y-prev.y)>.008;
   const ate=mudou?agora+260:(prev?.ate||0);
   movimentoVisual.set(id,{x,y,ate});
   return {id,x,y,andando:agora<ate,passo:agora*.013};
  }).filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y));
 };
 const dimValidas=()=>{const d=dimensoes();return {W:Number(d?.W)||28,H:Number(d?.H)||14};};
 const selecionarToken=()=>{const list=lerTokens();return list.find(t=>t.id===selecionado)||list[0]||null;};
 // Centraliza no conteúdo construído, evitando que casas pequenas fiquem
 // perdidas num campo vazio muito grande. Não altera objetos nem coordenadas.
 function enquadramentoCena(){
  const d=dimValidas(),c=cenaAtual(),objs=Array.isArray(c?.objects)?c.objects:[];
  const validos=objs.filter(o=>o&&!o.destruido&&!o.invisivelV161&&
   !['chao','teto'].includes(String(o.oficina3||o.parteV177||'').toLowerCase())&&
   Number.isFinite(Number(o.x))&&Number.isFinite(Number(o.y))&&
   Number(o.larguraM)>0&&Number(o.alturaM)>0);
  if(!validos.length)return {cx:d.W/2,cy:d.H/2,zoom:1};
  let minx=Infinity,maxx=-Infinity,miny=Infinity,maxy=-Infinity;
  for(const o of validos){
   const x=Number(o.x)*d.W/28,y=Number(o.y)*d.H/14,w=Number(o.larguraM),h=Number(o.alturaM);
   minx=Math.min(minx,x-w/2);maxx=Math.max(maxx,x+w/2);
   miny=Math.min(miny,y-h/2);maxy=Math.max(maxy,y+h/2);
  }
  return {cx:(minx+maxx)/2,cy:(miny+maxy)/2,
   zoom:clamp(Math.min(d.W/Math.max(9,(maxx-minx)*1.8),d.H/Math.max(8,(maxy-miny)*1.8)),.85,1.8)};
 }


 function orientar(p){const [x,y,z]=p,c=Math.cos(yaw),s=Math.sin(yaw);const xx=x*c-y*s,yy=x*s+y*c;return [xx,yy*Math.sin(pitch)-z*Math.cos(pitch),yy*Math.cos(pitch)+z*Math.sin(pitch)];}
  const imageCache=new Map();
  const obterImagem=url=>{
   if(!url)return null;
   if(imageCache.has(url))return imageCache.get(url);
   const img=new Image();img.crossOrigin='anonymous';
   const entry={img,ready:false};
   img.onload=()=>{entry.ready=true;invalidate();};
   img.onerror=()=>{entry.ready=false;};
   imageCache.set(url,entry);img.src=url;
   return entry;
  };
 function pintar(){
  raf=0;if(!painel.isConnected)return;
  const r=canvas.getBoundingClientRect(),dpr=clamp(win.devicePixelRatio||1,1,2),W=Math.max(1,Math.round(r.width*dpr)),H=Math.max(1,Math.round(r.height*dpr));
  if(buffer.width!==W||buffer.height!==H){buffer.width=W;buffer.height=H;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const width=W/dpr,height=H/dpr;
  const grad=ctx.createLinearGradient(0,0,0,height);grad.addColorStop(0,'#607b5a');grad.addColorStop(1,'#668263');ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
  // Sem mapa ativo não há cena. Evitar desenhar terreno fictício como se
  // o banco tivesse carregado: o mestre pode escolher o mapa na barra acima.
  if(!String(mapaAtual()||'')){
   ctx.fillStyle='#1a3044de';const w=Math.min(width-32,540),x=(width-w)/2,y=Math.max(80,height*.32);
   ctx.fillRect(x,y,w,94);ctx.fillStyle='#e6f3ff';ctx.textAlign='center';
   ctx.font='bold 17px Segoe UI,Arial,sans-serif';ctx.fillText('Nenhum mapa selecionado',width/2,y+35);
   ctx.font='13px Segoe UI,Arial,sans-serif';ctx.fillText('Escolha um mapa no seletor acima para carregar a cena.',width/2,y+64);
   ctx.textAlign='left';
   if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
   publicarQuadro();return;
  }
   // No modo de jogo a camera desliza suavemente para seguir a miniatura.
  // O angulo do mundo nunca gira quando a miniatura muda de direcao.
  const dims=dimValidas();
  const center=orientar(V(centroCamera[0],centroCamera[1],0)),scale=Math.min(width/(dims.W*1.36),height/(dims.H*1.85))*zoom;
  const projetar=v=>{const q=orientar(v);return [width/2+(q[0]-center[0])*scale,height*.53+(q[1]-center[1])*scale];};
  const desenharPoligono=(vs,cor,borda,material='',imagem='')=>{
   const pontos=vs.map(projetar);
   ctx.beginPath();pontos.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
   ctx.fillStyle=cor;ctx.fill();
   // A projeção afim preserva imagens originais do mapa 2D em faces 2,5D.
   if(imagem&&vs.length===4){
    const asset=obterImagem(imagem);
    if(asset?.ready&&asset.img.naturalWidth){
     ctx.save();
     try{
      const [a,b,,d]=pontos;
      ctx.clip();
      ctx.transform((b[0]-a[0])/asset.img.naturalWidth,(b[1]-a[1])/asset.img.naturalWidth,
       (d[0]-a[0])/asset.img.naturalHeight,(d[1]-a[1])/asset.img.naturalHeight,a[0],a[1]);
      ctx.drawImage(asset.img,0,0);
     }catch(e){console.warn('[Vista RPG] arte do objeto indisponível',e);}
     finally{ctx.restore();}
    }
   }
   // Materialidade visual: sombra nas bases e linhas sutis de assentamento,
   // sem modificar a geometria ou os objetos armazenados no Firebase.
   const vertical=vs.length>=3&&(Math.max(...vs.map(v=>v[2]))-Math.min(...vs.map(v=>v[2]))>.3);
   if(vertical&&pontos.length){
    const xs=pontos.map(p=>p[0]),ys=pontos.map(p=>p[1]);
    const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    ctx.save();ctx.clip();
    ctx.fillStyle='rgba(22,24,26,.065)';ctx.fillRect(x0,y0+(y1-y0)*.78,x1-x0,(y1-y0)*.22);
    // Sem linhas hachuradas em todas as faces: geravam riscos
   // atravessando portas e telhados durante a rotação.
    ctx.restore();
   }
   // Padrões pintados na mesma face: não criam planos extras nem z-fighting.
   if(vs.length===4&&['telhas','fachada','terreno','caminho','assoalho'].includes(material)){
    const p=(u,v)=>{
     const [a,b,c,d]=vs;
     return projetar(V(
      (1-u)*(1-v)*a[0]+u*(1-v)*b[0]+u*v*c[0]+(1-u)*v*d[0],
      (1-u)*(1-v)*a[1]+u*(1-v)*b[1]+u*v*c[1]+(1-u)*v*d[1],
      (1-u)*(1-v)*a[2]+u*(1-v)*b[2]+u*v*c[2]+(1-u)*v*d[2]));
    };
    const riscar=(u0,v0,u1,v1)=>{
     const a=p(u0,v0),b=p(u1,v1);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
    };
    ctx.save();ctx.clip();
    if(material==='telhas'){
     ctx.lineWidth=1.15;ctx.strokeStyle='rgba(39,25,19,.48)';
     const rows=9;
     for(let k=1;k<rows;k++){
      const v=k/rows;riscar(.015,v,.985,v);
      for(let j=0;j<12;j++){
       const u=(j+(k%2)*.5)/12;
       if(u>.02&&u<.98)riscar(u,v,u,Math.min(.985,v+1/rows));
      }
     }
     ctx.strokeStyle='rgba(250,214,173,.28)';ctx.lineWidth=1;
     for(let k=0;k<rows;k++)riscar(.02,k/rows+.018,.98,k/rows+.018);
    }else if(material==='assoalho'){
     // Tábuas no mesmo plano do piso: juntas estáveis, sem geometria coplanar.
     ctx.lineWidth=.85;ctx.strokeStyle='rgba(71,50,31,.22)';
     for(let k=1;k<13;k++)riscar(0,k/13,1,k/13);
     for(let k=0;k<13;k++){
      const v0=k/13,v1=(k+1)/13;
      for(let j=1;j<=3;j++){
       const u=(j+(k%2)*.5)/4;
       if(u<.98)riscar(u,v0+.006,u,v1-.006);
      }
     }
     ctx.strokeStyle='rgba(254,236,190,.13)';ctx.lineWidth=.6;
     for(let k=0;k<13;k++)riscar(0,k/13+.008,1,k/13+.008);
    }else if(material==='fachada'){
     ctx.strokeStyle='rgba(59,43,32,.17)';ctx.lineWidth=.8;
     for(let j=1;j<5;j++)riscar(j/5,.04,j/5,.96);
     ctx.strokeStyle='rgba(255,236,195,.18)';riscar(.02,.10,.98,.10);
    }else{
     ctx.lineWidth=.75;ctx.strokeStyle=material==='caminho'?'rgba(83,73,59,.13)':'rgba(44,75,45,.11)';
     for(let k=1;k<=6;k++){
      const u=((k*37)%97)/97,v=((k*59)%89)/89;
      riscar(u,v,Math.min(.98,u+.016),Math.min(.98,v+.026));
     }
    }
    ctx.restore();
   }
   // O padrão de textura cria caminhos próprios: reconstruir o contorno
   // antes de desenhar a borda geométrica da face.
   if(borda){ctx.beginPath();pontos.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.strokeStyle=borda;ctx.lineWidth=.75;ctx.stroke();}
  };
  const cena=cenaAtual(),mid=String(mapaAtual()||''),real=!!(cena&&mid&&String(cena.mapId||'')===mid);
  if(real){
   ultimaCenaValida=cena;ultimoIdCenaValida=mid;
   montarCenaReal(cena,dims.W,dims.H,telhadosVisiveis,modoInterior);
  }else if(ultimaCenaValida&&mid&&ultimoIdCenaValida===mid){
   // Atualização transitória vazia não deve fazer a vila desaparecer.
   montarCenaReal(ultimaCenaValida,dims.W,dims.H,telhadosVisiveis,modoInterior);
  }else{
   faces.length=0;face([V(0,0),V(dims.W,0),V(dims.W,dims.H),V(0,dims.H)],'#607b5a','#607b5a');
  }
  // O chão é a base do mundo: nunca deve ocultar paredes ou personagens.
  // Primeiro os planos horizontais baixos; depois as superfícies elevadas.
  // A ordenação completa de faces interseccionadas exige z-buffer, ainda pendente.
  const planos=faces.filter(f=>f.vs.every(v=>v[2]<=.03));
  const elevados=faces.filter(f=>!f.vs.every(v=>v[2]<=.03));
  const longePrimeiro=(a,b)=>a.vs.reduce((n,v)=>n+orientar(v)[2],0)/a.vs.length-b.vs.reduce((n,v)=>n+orientar(v)[2],0)/b.vs.length;
  // Pintar a base, depois o piso das ruas, depois as juntas do calçamento.
  // Ordenar só pela distância fazia o terreno cobrir a pavimentação.
  // Nunca usar profundidade para ordenar pisos sobrepostos: a ordem lógica
  // deve ser invariável ao girar a câmera.
  planos.sort((a,b)=>a.camada-b.camada||a.indice-b.indice);
  // As faces elevadas são ordenadas em um único passe com os personagens.
  for(const f of planos)desenharPoligono(f.vs,f.cor,f.borda,f.material,f.imagem);
  // Grades espaciais de 8 m, visíveis só por solicitação. Não armazenam
  // nem duplicam objetos e são calculadas a partir das dimensões da cena.
  if(exibirSetores&&modoAtual!=='mapa-jogo'){
   ctx.save();ctx.lineWidth=.9;ctx.strokeStyle='rgba(230,247,255,.42)';
   for(let gx=0;gx<=dims.W;gx+=8){
    const a=projetar(V(gx,0,.035)),b=projetar(V(gx,dims.H,.035));
    ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
   }
   for(let gy=0;gy<=dims.H;gy+=8){
    const a=projetar(V(0,gy,.035)),b=projetar(V(dims.W,gy,.035));
    ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
   }
   ctx.restore();
  }
  // Renderizar os personagens e cada face elevada no mesmo passe,
  // conforme a distância da câmera. Não se trata de opacidade.
  const personagens=lerTokens();
  const desenharPersonagem=t=>{
   const x=t.x,y=t.y,centro=projetar(V(x,y,0)),cabeca=projetar(V(x,y,1.65));
   const tamanho=Math.max(2,scale*.21),selected=t.id===selecionado;
   // Sombras, botas e torso usam as mesmas unidades de comprimento do mundo.
   ctx.fillStyle='rgba(20,29,33,.28)';
   ctx.beginPath();ctx.ellipse(centro[0]+scale*.13,centro[1]+scale*.08,scale*.36,scale*.17,0,0,Math.PI*2);ctx.fill();
   const ponto=z=>projetar(V(x,y,z));
   const quadril=ponto(.78),ombros=ponto(1.40),pe=ponto(.07);
   // Animação visual independente dos dados: pequeno balanço das pernas
   // apenas enquanto o personagem se desloca no tabuleiro original.
   const passo=t.andando?Math.sin(t.passo)*scale*.12:0;
   ctx.lineCap='round';ctx.lineJoin='round';
   ctx.strokeStyle='#273b51';ctx.lineWidth=Math.max(2,scale*.11);
   ctx.beginPath();ctx.moveTo(quadril[0]-scale*.10,quadril[1]);ctx.lineTo(pe[0]-scale*.14+passo,pe[1]);ctx.moveTo(quadril[0]+scale*.10,quadril[1]);ctx.lineTo(pe[0]+scale*.14-passo,pe[1]);ctx.stroke();
   ctx.strokeStyle=selected?'#b58b39':'#347b9e';ctx.lineWidth=Math.max(5,scale*.35);
   ctx.beginPath();ctx.moveTo(quadril[0],quadril[1]);ctx.lineTo(ombros[0],ombros[1]);ctx.stroke();
   ctx.strokeStyle='#d6a780';ctx.lineWidth=Math.max(2,scale*.105);
   ctx.beginPath();ctx.moveTo(ombros[0]-scale*.20,ombros[1]);ctx.lineTo(quadril[0]-scale*.24,quadril[1]);
   ctx.moveTo(ombros[0]+scale*.20,ombros[1]);ctx.lineTo(quadril[0]+scale*.24,quadril[1]);ctx.stroke();
   ctx.fillStyle='#edc29a';ctx.beginPath();ctx.arc(cabeca[0],cabeca[1]+scale*.08,tamanho,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#564536';ctx.beginPath();ctx.arc(cabeca[0],cabeca[1]+scale*.03,tamanho,Math.PI,Math.PI*1.97);ctx.fill();
   if(selected){ctx.strokeStyle='#f4d27e';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(centro[0],centro[1],scale*.4,scale*.16,0,0,Math.PI*2);ctx.stroke();}
  };
  const ordem=[
   ...elevados.map(f=>({tipo:'face',d:f.vs.reduce((s,v)=>s+orientar(v)[2],0)/f.vs.length,face:f})),
   ...personagens.map(t=>({tipo:'personagem',d:orientar(V(t.x,t.y,.8))[2],token:t}))
  ].map((parte,indice)=>({...parte,indice})).sort((a,b)=>a.d-b.d||a.indice-b.indice);
  for(const parte of ordem){
   if(parte.tipo==='face')desenharPoligono(parte.face.vs,parte.face.cor,parte.face.borda,parte.face.material,parte.face.imagem);
   else desenharPersonagem(parte.token);
  }
  // Destaque de seleção, sem modificar a posição do objeto persistido.
  if(modoAtual==='mapa-construtor'&&objetoSelecionadoId){
   const fonte=real?cena:ultimaCenaValida;
   const item=(fonte?.objects||[]).find(o=>String(o.id)===objetoSelecionadoId);
   if(item){
    const cx=Number(item.x)*dims.W/28,cy=Number(item.y)*dims.H/14;
    const w=Number(item.larguraM),h=Number(item.alturaM);
    if([cx,cy,w,h].every(Number.isFinite)){
     const vs=[V(cx-w/2,cy-h/2,.04),V(cx+w/2,cy-h/2,.04),V(cx+w/2,cy+h/2,.04),V(cx-w/2,cy+h/2,.04)].map(projetar);
     ctx.save();ctx.strokeStyle='#ffdc7e';ctx.lineWidth=2.5;ctx.setLineDash([7,4]);ctx.beginPath();
     vs.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.stroke();ctx.restore();
    }
   }
  }
  ctx.fillStyle='#102235bb';ctx.fillRect(10,height-29,Math.min(570,width-20),22);ctx.fillStyle='#edf7ff';ctx.font='12px Segoe UI,Arial';ctx.fillText(real||ultimoIdCenaValida===mid&&!!ultimaCenaValida?'Cena compartilhada · objetos reais em visualização 2,5D experimental':'Mapa sem cena 3D carregada · abra uma cena no Construtor',18,height-14);
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
  publicarQuadro();
 }
 const invalidate=()=>{if(!raf)raf=win.requestAnimationFrame(pintar);};
 canvas.addEventListener('pointerdown',e=>{
  if(modoAtual==='mapa-jogo')return;
  ignorarCliqueAposArrastar=false;
  drag={x:e.clientX,y:e.clientY,id:e.pointerId,pan:e.shiftKey||e.button===2,moved:false};
  canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';
 });
 canvas.addEventListener('contextmenu',e=>{if(modoAtual!=='mapa-jogo')e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{
  if(modoAtual==='mapa-jogo'||!drag||e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;
  if(drag.pan||modoAtual==='mapa-construtor'&&!inspecaoLivre){
   const r=canvas.getBoundingClientRect(),d=dimValidas();
   const factor=Math.min(r.width/(d.W*1.36),r.height/(d.H*1.85))*zoom||1;
   const horiz=dx/factor,vert=dy/(factor*Math.max(.2,Math.sin(pitch)));
   // Reverter a projeção horizontal para mover a câmera no plano do terreno.
   const c=Math.cos(yaw),sn=Math.sin(yaw);
   centroCamera[0]-=horiz*c+vert*sn;
   centroCamera[1]-=-horiz*sn+vert*c;
  }else{
   yaw+=dx*.007;
   pitch=clamp(pitch+dy*.005,.16,1.56);
  }
  drag.x=e.clientX;drag.y=e.clientY;invalidate();
 });
 // Cliques no chão usam a inversa da projeção ortográfica z=0.
 // O destino é entregue ao motor do jogo, que calcula a rota e colisões.
 canvas.addEventListener('click',e=>{
  if(ignorarCliqueAposArrastar){ignorarCliqueAposArrastar=false;return;}
  if(modoAtual==='mapa-construtor'&&!inspecaoLivre&&mapaAtual()){
   // Seleção 2D pela projeção dos pés: escolha a peça mais próxima.
   // Apenas inspeciona. Edição da cena será conectada ao motor funcional.
   const rect=canvas.getBoundingClientRect(),d=dimValidas(),w=rect.width,h=rect.height;
   const escala=Math.min(w/(d.W*1.36),h/(d.H*1.85))*zoom;
   const centro=orientar(V(centroCamera[0],centroCamera[1],0));
   const xx=centro[0]+(e.clientX-rect.left-w*.5)/escala;
   const yy=(centro[1]+(e.clientY-rect.top-h*.53)/escala)/Math.max(.15,Math.sin(pitch));
   const c=Math.cos(yaw),sn=Math.sin(yaw),x=xx*c+yy*sn,y=-xx*sn+yy*c;
   const fonte=cenaAtual()||ultimaCenaValida,lista=Array.isArray(fonte?.objects)?fonte.objects:[];
   const candidatos=lista.filter(o=>o&&!o.destruido&&!o.invisivelV161&&
    !['chao','teto'].includes(String(o.oficina3||o.parteV177||'').toLowerCase())&&
    Number(o.larguraM)>0&&Number(o.alturaM)>0&&Number.isFinite(Number(o.x))&&Number.isFinite(Number(o.y)))
    .filter(o=>Math.abs(x-Number(o.x)*d.W/28)<=Number(o.larguraM)/2+.15&&
               Math.abs(y-Number(o.y)*d.H/14)<=Number(o.alturaM)/2+.15);
   const escolhido=candidatos[candidatos.length-1]||null;
   objetoSelecionadoId=escolhido?String(escolhido.id):'';
   infoObjeto.hidden=!escolhido;
   if(escolhido)infoObjeto.textContent='Selecionado: '+String(escolhido.nome||escolhido.oficina3||'Objeto')+
    ' · '+Number(escolhido.larguraM).toFixed(1)+' × '+Number(escolhido.alturaM).toFixed(1)+' m · edição no mapa funcional';
   invalidate();return;
  }
  if(modoAtual!=='mapa-jogo'||!mapaAtual()||typeof aoCliqueChao!=='function')return;
  const rect=canvas.getBoundingClientRect(),width=rect.width,height=rect.height,d=dimValidas();
  if(width<1||height<1)return;
  const scale=Math.min(width/(d.W*1.36),height/(d.H*1.85))*zoom;
  const center=orientar(V(centroCamera[0],centroCamera[1],0));
  const xx=center[0]+(e.clientX-rect.left-width*.5)/scale;
  const yy=(center[1]+(e.clientY-rect.top-height*.53)/scale)/Math.max(.15,Math.sin(pitch));
  const c=Math.cos(yaw),sn=Math.sin(yaw);
  const x=xx*c+yy*sn,y=-xx*sn+yy*c;
  if(x<0||y<0||x>d.W||y>d.H)return;
  aoCliqueChao({x,y,W:d.W,H:d.H});
 });
 const stop=e=>{if(drag&&e.pointerId===drag.id){ignorarCliqueAposArrastar=!!drag.moved;drag=null;canvas.style.cursor='grab';}};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
 canvas.addEventListener('wheel',e=>{if(modoAtual==='mapa-jogo')return;e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.7,3);invalidate();},{passive:false});
 const resize=typeof ResizeObserver!=='undefined'?new ResizeObserver(invalidate):null;resize?.observe(painel);
 const reenquadrar=()=>{
  const enq=enquadramentoCena(),t=selecionarToken();
  if(modoAtual==='mapa-construtor'){
   yaw=CONSTRUTOR_YAW;pitch=CONSTRUTOR_PITCH;zoom=1.05*enq.zoom;
   centroCamera=[enq.cx,enq.cy];
  }else if(modoAtual==='mapa-mestre'){
   yaw=MESTRE_YAW;pitch=MESTRE_PITCH;zoom=enq.zoom;
   centroCamera=[enq.cx,enq.cy];
  }else{
   yaw=JOGO_YAW;pitch=JOGO_PITCH;zoom=JOGO_ZOOM*enq.zoom;
   centroCamera=t?[t.x,t.y]:[enq.cx,enq.cy];
  }
  invalidate();
 };
 reset.addEventListener('click',reenquadrar);
 const acompanhamento=win.setInterval(()=>{
  if(painel.hidden)return;
  if(modoAtual!=='mapa-jogo')return; // câmera livre: renderizar só quando houver mudança
  // Renderizar mais um quadro enquanto a caminhada está visível.
  if([...movimentoVisual.values()].some(v=>win.performance.now()<v.ate))invalidate();
  const t=selecionarToken();
  if(!t)return;
  centroCamera[0]+=(t.x-centroCamera[0])*.26;
  centroCamera[1]+=(t.y-centroCamera[1])*.26;
  if(Math.hypot(t.x-centroCamera[0],t.y-centroCamera[1])>.008)invalidate();
  const chave=t.id+':'+t.x.toFixed(3)+':'+t.y.toFixed(3);
  if(chave!==ultimoTokenPos){
   ultimoTokenPos=chave;
   // O jogador se move no mundo; o mundo mantém seu norte isométrico.
   // Câmera do jogo acompanha sem exigir controle manual do ângulo.
   invalidate();
  }
 },160);
 return {el:painel,atualizar({visivel=false,token='',modo='mapa-construtor'}={}){
  const mudou=modoAtual!==modo,tokenMudou=selecionado!==token;
  modoAtual=modo;selecionado=token;
  const idAtual=String(mapaAtual()||'');
  const mapaMudou=idAtual!==ultimoMapaV230;
  // Nunca redefinir a câmera por pequenas mudanças na cena recebida do Firestore.
  if(mapaMudou)ultimoMapaV230=idAtual;
  if(modo==='mapa-jogo'&&tokenMudou){const t=lerTokens().find(t=>t.id===token);if(t)centroCamera=[t.x,t.y];}
  if(mudou||mapaMudou){
   drag=null;inspecaoLivre=false;atualizarInspecao();objetoSelecionadoId='';infoObjeto.hidden=true;
   reenquadrar();
  }
  canvas.style.cursor=modo==='mapa-jogo'?'crosshair':'grab';
  canvas.style.touchAction=modo==='mapa-jogo'?'auto':'none';
  reset.hidden=modo==='mapa-jogo';
  for(const b of [roofToggle,interior,inspecionar,setor,vistaSuperior,vistaFrontal,zoomMenos,zoomMais,foto])b.hidden=modo==='mapa-jogo';
  help.textContent=modo==='mapa-construtor'
   ?'CONSTRUTOR RPG · arrastar: mover mapa · clique: selecionar objeto · inspeção 3D opcional · roda: zoom'
   :modo==='mapa-mestre'
   ?'MESTRE · arrastar: girar · Shift+arrastar: deslocar · roda: zoom'
   :'JOGO · clique no chão para caminhar · WASD ou setas · câmera acompanha o personagem';
  if(ultimoPainelVisivel!==visivel){
   painel.hidden=!visivel;painel.style.display=visivel?'block':'none';
   ultimoPainelVisivel=visivel;
  }
  // Evitar repintura periódica quando a cena e a câmera não mudaram.
  const cenaRef=cenaAtual(),cenaMudou=cenaRef!==ultimaCenaRef;
  const visibilidadeMudou=visivel!==ultimoVisivel;
  ultimaCenaRef=cenaRef;ultimoVisivel=visivel;
  if(visivel&&(mudou||mapaMudou||tokenMudou||cenaMudou||visibilidadeMudou))invalidate();
 },destruir(){win.clearInterval(acompanhamento);resize?.disconnect();if(raf)win.cancelAnimationFrame(raf);painel.remove();}};
}
