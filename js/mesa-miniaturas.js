// Mesa Estelar v105 — Miniaturas vistas de cima.
//
// Gera miniaturas em SVG a partir de uma "receita" (spec) pequena: corpo, cores,
// roupas, armas, traços de espécie. A miniatura olha para a direita (+x); a camada
// visual gira a imagem conforme a direção do personagem no mapa.
//
// Nada aqui grava no banco: o módulo só desenha. Quem salva é o editor.

export const VERSAO='v105';
export const MARCA_MINI='#mini';

// ---------------------------------------------------------------- cores
function hexRgb(h){const m=/^#?([0-9a-f]{6})$/i.exec(String(h||''));const n=m?parseInt(m[1],16):0x888888;return [(n>>16)&255,(n>>8)&255,n&255];}
function rgbHex(r,g,b){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
export function tom(h,f){const [r,g,b]=hexRgb(h);return f>=0?rgbHex(r+(255-r)*f,g+(255-g)*f,b+(255-b)*f):rgbHex(r*(1+f),g*(1+f),b*(1+f));}
function mistura(a,b,t){const x=hexRgb(a),y=hexRgb(b);return rgbHex(x[0]+(y[0]-x[0])*t,x[1]+(y[1]-x[1])*t,x[2]+(y[2]-x[2])*t);}
const corOk=(c,d)=>/^#[0-9a-f]{6}$/i.test(String(c||''))?String(c).toLowerCase():d;

// ---------------------------------------------------------------- opções
export const CORPOS={
 humanoide:'Humanoide',quadrupede:'Quadrúpede',bipede:'Bípede predador',alado:'Alado (asas)',inseto:'Insetoide (6 patas)',
 aracnideo:'Aracnídeo / carrapato',serpente:'Serpente',amorfo:'Amorfo / limo',primata:'Primata de 4 braços',
 larva:'Larva',sessil:'Massa com pescoços',enxame:'Enxame',ave:'Ave',tanque:'Cérebro em tanque',robo:'Robô'
};
export const ARMAS={nenhuma:'Nada',pistola:'Pistola',revolver:'Revólver',blaster:'Blaster',rifle:'Rifle',espada:'Espada',sabre:'Sabre de energia',faca:'Faca',machado:'Machado',lanca:'Lança',cajado:'Cajado',escudo:'Escudo',ferramenta:'Ferramenta',tocha:'Tocha',bastao:'Bastão'};
export const CABELOS={curto:'Curto',longo:'Longo',rabo:'Rabo de cavalo',coque:'Coque',moicano:'Moicano',careca:'Careca',crespo:'Crespo volumoso'};
export const CABECAS={nenhum:'Nada',capuz:'Capuz',capacete:'Capacete',chapeu:'Chapéu',bandana:'Bandana',visor:'Visor'};
export const ARMADURAS={nenhuma:'Nenhuma',leve:'Leve',pesada:'Pesada'};
export const PADROES={nenhum:'Nenhum',listras:'Listras',manchas:'Manchas',escamas:'Escamas',placas:'Placas'};
export const CABECAS_CRIATURA={canina:'Canina',felina:'Felina',reptil:'Réptil',trombeta:'Trombeta (anel de olhos)',serpente:'Serpente',coruja:'Coruja'};
export const TRACOS={
 cauda:'Cauda',focinho:'Focinho',quatroBracos:'Quatro braços',cabecaGrande:'Cabeça grande',orelhasLongas:'Orelhas longas',
 nadadeiras:'Nadadeiras',membranas:'Membranas planadoras',chifres:'Chifres',antenas:'Antenas',tentaculos:'Tentáculos',
 olhosBrilho:'Olhos brilhantes',focinhoLongo:'Focinho de jacaré',barba:'Barba',asasDobradas:'Asas recolhidas',carapaca:'Carapaça',espinhos:'Espinhos',mandibulas:'Mandíbulas',translucido:'Translúcido',ferrao:'Ferrão',asas:'Asas',pescocoLongo:'Pescoço longo'
};
export const PELES=['#f1c9a5','#d9a47c','#b97c55','#8a5636','#5c3a24','#c9d9b0','#8fb37a','#7aa0c9','#9a8fd0','#c7c7c7','#e0b0b0'];

export function specPadrao(corpo='humanoide'){
 const base={corpo,porte:1,pele:'#d9a47c',roupa:'#34507a',roupa2:'#232a38',cabelo:'curto',corCabelo:'#3b2a1a',cabeca:'nenhum',
  capa:'',armadura:'nenhuma',corArmadura:'#8d99ab',mochila:false,maoD:'nenhuma',maoE:'nenhuma',pose:'normal',
  cor:'#6f6450',cor2:'#c9b48f',padrao:'nenhum',corOlhos:'#ffd447',cabecaCriatura:'canina',quantidade:14,pescocos:6,tracos:{}};
 if(corpo!=='humanoide'){base.pele=base.cor;}
 return base;
}
export function normalizarSpec(s={}){
 const corpo=Object.prototype.hasOwnProperty.call(CORPOS,s.corpo)?s.corpo:'humanoide',p=specPadrao(corpo);
 const pick=(obj,v,d)=>Object.prototype.hasOwnProperty.call(obj,v)?v:d;
 const tr={};for(const k of Object.keys(TRACOS))if(s.tracos?.[k])tr[k]=true;
 return {
  corpo,porte:Math.max(.7,Math.min(1.4,Number(s.porte)||1)),
  pele:corOk(s.pele,p.pele),roupa:corOk(s.roupa,p.roupa),roupa2:corOk(s.roupa2,p.roupa2),
  cabelo:pick(CABELOS,s.cabelo,p.cabelo),corCabelo:corOk(s.corCabelo,p.corCabelo),cabeca:pick(CABECAS,s.cabeca,p.cabeca),
  capa:s.capa?corOk(s.capa,''):'',armadura:pick(ARMADURAS,s.armadura,p.armadura),corArmadura:corOk(s.corArmadura,p.corArmadura),
  mochila:!!s.mochila,maoD:pick(ARMAS,s.maoD,'nenhuma'),maoE:pick(ARMAS,s.maoE,'nenhuma'),pose:s.pose==='zumbi'?'zumbi':'normal',
  cor:corOk(s.cor,p.cor),cor2:corOk(s.cor2,p.cor2),padrao:pick(PADROES,s.padrao,'nenhum'),corOlhos:corOk(s.corOlhos,p.corOlhos),
  cabecaCriatura:pick(CABECAS_CRIATURA,s.cabecaCriatura,'canina'),
  quantidade:Math.max(4,Math.min(40,Math.round(Number(s.quantidade)||14))),pescocos:Math.max(2,Math.min(9,Math.round(Number(s.pescocos)||6))),
  tracos:tr
 };
}

// ---------------------------------------------------------------- construtor de SVG
function criarDesenho(semente=1){
 const defs=[],corpo=[],grads=new Map();let n=0;
 let s=semente>>>0||1;const rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
 const f=v=>Number(v.toFixed(2));
 const g=cor=>{if(!grads.has(cor)){const id='g'+(n++);grads.set(cor,id);defs.push(`<radialGradient id="${id}" cx="40%" cy="34%" r="78%"><stop offset="0" stop-color="${tom(cor,.32)}"/><stop offset=".58" stop-color="${cor}"/><stop offset="1" stop-color="${tom(cor,-.42)}"/></radialGradient>`);}return `url(#${grads.get(cor)})`;};
 const lin=(cor,ang=0)=>{const id='l'+(n++);defs.push(`<linearGradient id="${id}" gradientTransform="rotate(${ang} .5 .5)"><stop offset="0" stop-color="${tom(cor,.25)}"/><stop offset=".5" stop-color="${cor}"/><stop offset="1" stop-color="${tom(cor,-.35)}"/></linearGradient>`);return `url(#${id})`;};
 const borda=()=>'#15110d';
 const api={
  rnd,f,g,lin,defs,
  add:svg=>corpo.push(svg),
  elipse:(cx,cy,rx,ry,cor,{rot=0,traco=2.6,op=1,plano=false}={})=>corpo.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${plano?cor:g(cor)}" stroke="${borda(cor)}" stroke-width="${traco}"${rot?` transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"`:''}${op<1?` opacity="${op}"`:''}/>`),
  circulo:(cx,cy,r,cor,o={})=>api.elipse(cx,cy,r,r,cor,o),
  caminho:(d,cor,{traco=2.6,op=1,plano=false,juncao='round'}={})=>corpo.push(`<path d="${d}" fill="${plano?cor:g(cor)}" stroke="${borda(cor)}" stroke-width="${traco}" stroke-linejoin="${juncao}"${op<1?` opacity="${op}"`:''}/>`),
  linha:(x1,y1,x2,y2,cor,w,{fim='round',op=1,contorno=true}={})=>{if(contorno)corpo.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${borda(cor)}" stroke-width="${f(w+2.8)}" stroke-linecap="${fim}"${op<1?` opacity="${op}"`:''}/>`);corpo.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${cor}" stroke-width="${f(w)}" stroke-linecap="${fim}"${op<1?` opacity="${op}"`:''}/>`);},
  traco:(d,cor,w,{op=1,contorno=true,fim='round'}={})=>{if(contorno)corpo.push(`<path d="${d}" fill="none" stroke="${borda(cor)}" stroke-width="${f(w+2.8)}" stroke-linecap="${fim}" stroke-linejoin="round"${op<1?` opacity="${op}"`:''}/>`);corpo.push(`<path d="${d}" fill="none" stroke="${cor}" stroke-width="${f(w)}" stroke-linecap="${fim}" stroke-linejoin="round"${op<1?` opacity="${op}"`:''}/>`);},
  brilho:(cx,cy,r,cor)=>{const id='b'+(n++);defs.push(`<radialGradient id="${id}"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="${cor}" stop-opacity=".9"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></radialGradient>`);corpo.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${id})"/>`);},
  grupo:(fn,transform='')=>{corpo.push(`<g${transform?` transform="${transform}"`:''}>`);fn();corpo.push('</g>');},
  svg:()=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-128 -128 256 256" width="256" height="256"><defs><filter id="sombra" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>${defs.join('')}</defs><g filter="url(#sombra)" opacity=".42" transform="translate(3 4)">${corpo.join('').replace(/fill="(?!none)[^"]*"/g,'fill="#000"').replace(/stroke="[^"]+"/g,'stroke="#000"')}</g>${corpo.join('')}</svg>`
 };
 return api;
}

// ---------------------------------------------------------------- partes humanoides
function arma(d,tipo,mx,my,lado,metal='#aab4c2'){
 // (mx,my) = mão; lado = +1 direita (y+), -1 esquerda
 const escuro='#2b2f38',madeira='#7a5232';
 if(tipo==='revolver'){d.linha(mx-2,my,mx+22,my,'#3a3f48',5,{fim:'butt'});d.circulo(mx+5,my,4.6,'#6d7480',{traco:1.4});d.linha(mx-4,my,mx+1,my+lado*3,'#6b4a2a',5);}
 else if(tipo==='pistola'){d.linha(mx-2,my,mx+20,my,escuro,6,{fim:'butt'});d.linha(mx+14,my,mx+22,my,'#55606e',3.4,{fim:'butt'});}
 else if(tipo==='blaster'){d.linha(mx-2,my,mx+18,my,'#4a4f63',8,{fim:'round'});d.circulo(mx+20,my,3,'#ff8a3c',{traco:1});}
 else if(tipo==='rifle'){d.linha(mx-12,my-lado*2,mx+40,my-lado*9,escuro,6.5,{fim:'butt'});d.linha(mx+26,my-lado*7,mx+44,my-lado*9.4,'#596474',3.4,{fim:'butt'});d.circulo(mx+24,my-lado*6.4,3,'#ff4b4b',{traco:1});}
 else if(tipo==='espada'){d.linha(mx+4,my,mx+46,my+lado*12,'#d7dde6',5,{fim:'round'});d.linha(mx+3,my-lado*8,mx+5,my+lado*8,'#b08d3c',4);d.circulo(mx-3,my-lado*1,3,'#b08d3c',{traco:1});}
 else if(tipo==='sabre'){d.add(`<line x1="${mx+5}" y1="${my}" x2="${mx+50}" y2="${my+lado*12}" stroke="#7fe9ff" stroke-width="11" stroke-linecap="round" opacity=".35"/>`);d.linha(mx+5,my,mx+50,my+lado*12,'#e9fdff',4.2,{contorno:false});d.linha(mx-4,my-lado*1,mx+6,my+lado*1,'#3c4350',6,{fim:'butt'});}
 else if(tipo==='faca'){d.linha(mx+3,my,mx+22,my+lado*5,'#d7dde6',3.6);d.linha(mx-3,my,mx+4,my,'#3b2b1e',4.4);}
 else if(tipo==='machado'){d.linha(mx-10,my,mx+34,my+lado*6,madeira,4.4);d.caminho(`M${mx+26} ${my+lado*-6} Q${mx+44} ${my+lado*2} ${mx+30} ${my+lado*18} L${mx+24} ${my+lado*6} Z`,'#b9c2cf',{traco:1.8});}
 else if(tipo==='lanca'){d.linha(mx-26,my,mx+44,my,madeira,4);d.caminho(`M${mx+42} ${my-5} L${mx+56} ${my} L${mx+42} ${my+5} Z`,'#cfd6e0',{traco:1.6});}
 else if(tipo==='cajado'){d.linha(mx-24,my-lado*6,mx+42,my+lado*4,madeira,5);d.brilho(mx+44,my+lado*4,9,'#9fd8ff');}
 else if(tipo==='escudo'){d.elipse(mx+8,my+lado*4,11,26,metal,{rot:lado*-8,traco:2.4});d.circulo(mx+10,my+lado*4,4,tom(metal,-.2),{traco:1.4});}
 else if(tipo==='ferramenta'){d.linha(mx-2,my,mx+22,my,'#e2a93b',6,{fim:'butt'});d.linha(mx+22,my,mx+30,my,'#c3cad5',3,{fim:'butt'});}
 else if(tipo==='tocha'){d.linha(mx-6,my,mx+20,my,madeira,4.4);d.brilho(mx+24,my,13,'#ff9640');d.brilho(mx+24,my,6,'#ffe2a0');}
 else if(tipo==='bastao'){d.linha(mx-22,my,mx+38,my,'#5d6676',5);}
}

function humanoide(d,s){d.grupo(()=>humanoideBase(d,s),'translate(-6 0) scale(1.95)');}
function humanoideBase(d,s){
 const T=s.tracos,w=s.porte,pele=s.pele,roupa=s.roupa,roupa2=s.roupa2;
 const larg=34*w,prof=15*w;
 const zumbi=s.pose==='zumbi';
 const duas=['rifle','lanca','cajado','machado','bastao'].includes(s.maoD);
 const ombroY=larg-7;
 // posições das mãos (x à frente, y para os lados)
 const maoD=zumbi?[40*w,14]:duas?[20,12]:s.maoD!=='nenhuma'?[22,24*w]:T.quatroBracos?[26,20*w]:[4,larg+4];
 const maoE=zumbi?[40*w,-14]:duas?[34,-4]:s.maoE!=='nenhuma'?[20,-24*w]:T.quatroBracos?[26,-20*w]:[4,-larg-4];
 // cauda
 if(T.cauda)d.traco(`M${-prof+2} 0 C ${-prof-22} 6, ${-prof-34} -10, ${-prof-50} -4`,tom(pele,-.05),9*w);
 // membranas planadoras (entre braço e corpo)
 if(T.membranas)for(const k of [-1,1])d.caminho(`M ${-2} ${k*(larg-6)} Q ${-12} ${k*(larg+26)} ${-36} ${k*(larg+10)} Q ${-22} ${k*(larg-2)} ${-prof} ${k*(larg-12)} Z`,tom(pele,-.18),{traco:1.4,op:.85});
 if(T.asasDobradas)for(const k of [-1,1])d.caminho(`M ${-prof*.4} ${k*larg*.55} Q ${-prof-10} ${k*(larg+10)} ${-prof-38} ${k*(larg*.85)} L ${-prof-30} ${k*larg*.45} Q ${-prof-40} ${k*larg*.25} ${-prof-24} ${k*6} Q ${-prof-6} ${k*larg*.2} ${-prof*.4} ${k*larg*.55} Z`,s.cor2&&s.cor2!=='#c9b48f'?s.cor2:tom(pele,-.28),{traco:1.6});
 // braços (antes do tronco: a junta fica escondida pelo ombro)
 const quitina=T.carapaca?tom(pele,-.12):roupa;
 const braco=(oy,[hx,hy],cor=quitina)=>{const ex=(hx>10?hx*.35:-2),ey=oy+(oy>0?6:-6);d.traco(`M ${-2} ${oy} Q ${ex} ${ey} ${hx} ${hy}`,cor,9.5*w);};
 // v114: insetoides têm um segundo par de braços (segmentado, com cotovelo) saindo do meio do tronco
 const par2=k=>[[-6,k*(ombroY-14)],[-16,k*(larg+14)],[12,k*(larg+18)]];
 if(T.quatroBracos)for(const k of [-1,1]){const [a,b,c]=par2(k);d.traco(`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]}`,tom(quitina,-.08),7*w);if(T.carapaca)d.circulo(b[0],b[1],3.2*w,tom(quitina,-.25),{traco:1});}
 braco(ombroY,maoD);braco(-ombroY,maoE);
 // mochila
 if(s.mochila)d.caminho(`M${-prof-12} ${-14} h14 a4 4 0 0 1 4 4 v20 a4 4 0 0 1 -4 4 h-14 a4 4 0 0 1 -4 -4 v-20 a4 4 0 0 1 4 -4 Z`,'#6b5a3e',{traco:1.8});
 // tronco (ombros vistos de cima)
 const ombros=`M ${prof+2} 0 C ${prof+3} ${-larg*.75}, ${prof*.2} ${-larg-1}, ${-prof*.35} ${-larg} C ${-prof-4} ${-larg+1}, ${-prof-3} ${-larg*.5}, ${-prof-2} 0 C ${-prof-3} ${larg*.5}, ${-prof-4} ${larg-1}, ${-prof*.35} ${larg} C ${prof*.2} ${larg+1}, ${prof+3} ${larg*.75}, ${prof+2} 0 Z`;
 d.caminho(ombros,roupa,{traco:2});
 d.caminho(`M ${-prof*.7} ${-larg*.55} Q ${prof*.2} ${-larg*.6} ${prof*.6} ${-larg*.3} L ${prof*.6} ${larg*.3} Q ${prof*.2} ${larg*.6} ${-prof*.7} ${larg*.55} Z`,roupa2,{traco:1.2,op:.85});
 if(T.carapaca){d.caminho(ombros,tom(pele,-.08),{traco:1.8,op:.92});d.linha(-prof*.9,0,prof*.8,0,tom(pele,-.45),1.4,{contorno:false});}
 if(s.armadura!=='nenhuma'){
  const m=s.corArmadura,r=s.armadura==='pesada'?11*w:8*w;
  d.caminho(`M ${-prof*.8} ${-larg*.5} Q ${prof*.4} ${-larg*.62} ${prof*.85} ${-larg*.3} L ${prof*.85} ${larg*.3} Q ${prof*.4} ${larg*.62} ${-prof*.8} ${larg*.5} Z`,m,{traco:1.8});
  d.elipse(-2,-ombroY+2,r,r*.85,m,{traco:1.8});d.elipse(-2,ombroY-2,r,r*.85,m,{traco:1.8});
  if(s.armadura==='pesada')d.linha(-prof*.6,0,prof*.7,0,tom(m,-.35),1.6,{contorno:false});
 }
 if(T.espinhos)for(let i=-2;i<=2;i++)d.caminho(`M${-prof+1} ${i*8-3} L${-prof-10} ${i*8} L${-prof+1} ${i*8+3} Z`,tom(pele,-.2),{traco:1});
 // capa: cobre as costas e os ombros
 if(s.capa)d.caminho(`M ${prof*.15} ${-larg-2} Q ${-prof*1.2} ${-larg-6} ${-prof-14} ${-larg*.6} Q ${-prof-20} 0 ${-prof-14} ${larg*.6} Q ${-prof*1.2} ${larg+6} ${prof*.15} ${larg+2} Q ${-prof*.4} 0 ${prof*.15} ${-larg-2} Z`,s.capa,{traco:1.8});
 // mãos e armas
 for(const [mao,lado,a] of [[maoD,1,s.maoD],[maoE,-1,duas?'nenhuma':s.maoE]]){
  d.circulo(mao[0],mao[1],5.2*w,pele,{traco:1.6});
  if(a!=='nenhuma')arma(d,a,mao[0],mao[1],lado,s.corArmadura);
 }
 if(T.quatroBracos)for(const k of [-1,1]){const c=par2(k)[2];if(T.carapaca){d.caminho(`M ${c[0]-3} ${c[1]-k*3} L ${c[0]+7} ${c[1]-k*1} L ${c[0]+1} ${c[1]+k*3} Z`,tom(pele,-.3),{traco:1});}else d.circulo(c[0],c[1],4.6*w,pele,{traco:1.4});}
 // cabeça
 const hr=(T.cabecaGrande?19:13.5)*Math.sqrt(w),hx=3;
 if(s.cabelo==='longo'&&!['capacete','capuz'].includes(s.cabeca))d.caminho(`M ${hx-hr*.2} ${-hr*.9} Q ${hx-hr*1.5} ${-hr*1.05} ${hx-hr*2.2} ${-hr*.45} Q ${hx-hr*2.5} 0 ${hx-hr*2.2} ${hr*.45} Q ${hx-hr*1.5} ${hr*1.05} ${hx-hr*.2} ${hr*.9} Z`,tom(s.corCabelo,.05),{traco:1.4});
 if(s.cabelo==='rabo'&&!['capacete','capuz'].includes(s.cabeca))d.traco(`M${hx-hr*.7} 0 q ${-10} 3 ${-20} -1`,s.corCabelo,6);
 if(T.focinho&&!T.focinhoLongo)d.elipse(hx+hr*.85,0,hr*.7,hr*.5,pele,{traco:1.8});
 if(T.nadadeiras)for(const k of [-1,1])d.caminho(`M${hx-hr*.3} ${k*(hr-2)} Q ${hx-hr*1.4} ${k*hr*1.5} ${hx-hr*1.6} ${k*hr*.35} Z`,tom(pele,-.12),{traco:1.4});
 if(T.orelhasLongas)for(const k of [-1,1])d.elipse(hx-hr*1.05,k*hr*.7,hr*.9,hr*.3,tom(pele,-.05),{rot:k*28,traco:1.6});
 if(T.tentaculos)for(const k of [-1,-.35,.35,1])d.traco(`M${hx-hr*.5} ${k*hr*.55} q ${-14} ${k*8} ${-24} ${k*3+6}`,tom(pele,-.08),4);
 d.circulo(hx,0,hr,pele,{traco:2});
 // olhos compostos dos insetoides
 if(T.carapaca)for(const k of [-1,1]){d.elipse(hx+hr*.45,k*hr*.58,hr*.42,hr*.3,'#2a1010',{rot:k*25,traco:.9});d.elipse(hx+hr*.55,k*hr*.5,hr*.12,hr*.08,'#ff9a6a',{plano:true,op:.7});}
 const olhos=!T.carapaca&&(T.olhosBrilho||T.cabecaGrande);
 if(olhos)for(const k of [-1,1])T.olhosBrilho?d.brilho(hx+hr*.6,k*hr*.4,hr*.36,s.corOlhos):d.elipse(hx+hr*.55,k*hr*.42,hr*.3,hr*.2,'#121212',{traco:.8,plano:true});
 else d.elipse(hx+hr*.95,0,2.4,3.4,tom(pele,-.1),{traco:.9});
 if(T.barba)d.caminho(`M ${hx+hr*.25} ${-hr*.8} Q ${hx+hr*1.45} ${-hr*.55} ${hx+hr*1.5} 0 Q ${hx+hr*1.45} ${hr*.55} ${hx+hr*.25} ${hr*.8} Q ${hx+hr*.85} 0 ${hx+hr*.25} ${-hr*.8} Z`,s.corCabelo,{traco:1.4});
 const c=s.corCabelo;
 if(s.cabeca==='capuz')d.caminho(`M${hx+hr*.5} ${-hr*.98} A ${hr*1.15} ${hr*1.15} 0 1 0 ${hx+hr*.5} ${hr*.98} Q ${hx+hr*.15} 0 ${hx+hr*.5} ${-hr*.98} Z`,s.capa||roupa2,{traco:2});
 else if(s.cabeca==='capacete'){d.circulo(hx-1,0,hr*1.1,s.corArmadura,{traco:2.2});d.caminho(`M${hx+hr*.42} ${-hr*.72} Q ${hx+hr*1.28} 0 ${hx+hr*.42} ${hr*.72} Z`,'#1b2230',{traco:1.2});d.add(`<path d="M${hx+hr*.6} ${-hr*.5} Q ${hx+hr*1.02} 0 ${hx+hr*.6} ${hr*.5}" stroke="#9fe8ff" stroke-width="1.4" fill="none" opacity=".8"/>`);}
 else if(s.cabeca==='chapeu'){d.circulo(hx-1,0,hr*1.5,tom(roupa2,.1),{traco:1.8});d.circulo(hx-1,0,hr*.92,roupa2,{traco:1.6});}
 else if(s.cabeca==='visor'){d.caminho(`M${hx-hr*.7} ${-hr*.88} A ${hr} ${hr} 0 0 0 ${hx-hr*.7} ${hr*.88} Z`,c,{traco:1.4});d.linha(hx+hr*.55,-hr*.85,hx+hr*.55,hr*.85,'#ff5a4f',3.4);}
 else if(s.cabelo!=='careca'){
  if(s.cabelo==='moicano')d.elipse(hx-2,0,hr*.95,hr*.22,c,{traco:1.2});
  else if(s.cabelo==='crespo')d.circulo(hx-hr*.3,0,hr*1.12,c,{traco:1.8});
  else d.caminho(`M${hx+hr*.3} ${-hr*.95} A ${hr} ${hr} 0 1 0 ${hx+hr*.3} ${hr*.95} Q ${hx} 0 ${hx+hr*.3} ${-hr*.95} Z`,c,{traco:1.6});
  if(s.cabelo==='coque')d.circulo(hx-hr*.9,0,hr*.4,c,{traco:1.4});
  if(s.cabeca==='bandana')d.caminho(`M${hx+hr*.4} ${-hr*.9} A ${hr} ${hr} 0 0 0 ${hx+hr*.4} ${hr*.9} L ${hx+hr*.12} ${hr*.6} A ${hr*.7} ${hr*.7} 0 0 1 ${hx+hr*.12} ${-hr*.6} Z`,'#b8322f',{traco:1.2});
 }
 if(T.chifres)for(const k of [-1,1])d.caminho(`M${hx-hr*.35} ${k*hr*.5} q ${-hr*.5} ${k*hr*.35} ${-hr*1.05} ${k*hr*.2} q ${hr*.45} ${-k*hr*.05} ${hr*.85} ${-k*hr*.4} Z`,'#d8ccb0',{traco:1});
 if(T.focinhoLongo){d.caminho(`M ${hx+hr*.3} ${-hr*.55} L ${hx+hr*2.25} ${-hr*.32} Q ${hx+hr*2.6} 0 ${hx+hr*2.25} ${hr*.32} L ${hx+hr*.3} ${hr*.55} Z`,pele,{traco:1.8});
  for(let i=0;i<5;i++)for(const k of [-1,1])d.add(`<path d="M ${d.f(hx+hr*(.9+i*.3))} ${d.f(k*hr*(.47-i*.03))} l ${d.f(hr*.08)} ${d.f(k*hr*.14)} l ${d.f(hr*.08)} ${d.f(-k*hr*.14)}" fill="#f4efe0" stroke="#3a3a2a" stroke-width=".6"/>`);
  d.circulo(hx+hr*2.1,-hr*.14,1.4,'#1a1a1a',{traco:0,plano:true});d.circulo(hx+hr*2.1,hr*.14,1.4,'#1a1a1a',{traco:0,plano:true});
  for(const k of [-1,1])d.elipse(hx+hr*.35,k*hr*.62,hr*.22,hr*.17,'#d9c23a',{traco:1});}

 if(T.antenas)for(const k of [-1,1]){d.traco(`M${hx+hr*.5} ${k*hr*.4} q 13 ${k*10} 24 ${k*8}`,tom(pele,-.25),2);d.circulo(hx+hr*.5+24,k*(hr*.4+8),2.2,s.corOlhos,{traco:.8});}
 if(T.mandibulas)for(const k of [-1,1])d.traco(`M${hx+hr*.7} ${k*hr*.4} q 10 ${k*2} 11 ${-k*7}`,'#3a2c20',3);
}

// ---------------------------------------------------------------- padrões de pele
function padrao(d,s,cx,cy,rx,ry,rot=0){
 const c=tom(s.cor,-.35),c2=s.cor2;
 if(s.padrao==='listras')for(let i=-3;i<=3;i++)d.add(`<path d="M${cx+i*rx*.25} ${cy-ry*.8} q ${rx*.08} ${ry*.8} 0 ${ry*1.6}" stroke="${c}" stroke-width="${Math.max(2,rx*.07)}" fill="none" opacity=".75" stroke-linecap="round"${rot?` transform="rotate(${rot} ${cx} ${cy})"`:''}/>`);
 if(s.padrao==='manchas')for(let i=0;i<9;i++){const a=d.rnd()*6.28,r=d.rnd()*.7;d.add(`<ellipse cx="${d.f(cx+Math.cos(a)*rx*r)}" cy="${d.f(cy+Math.sin(a)*ry*r)}" rx="${d.f(rx*.09+d.rnd()*rx*.06)}" ry="${d.f(ry*.12+d.rnd()*ry*.08)}" fill="${c}" opacity=".7"/>`);}
 if(s.padrao==='escamas')for(let i=0;i<22;i++){const a=d.rnd()*6.28,r=Math.sqrt(d.rnd())*.82;d.add(`<path d="M${d.f(cx+Math.cos(a)*rx*r-3)} ${d.f(cy+Math.sin(a)*ry*r)} q 3 -4 6 0" stroke="${c}" stroke-width="1.4" fill="none" opacity=".75"/>`);}
 if(s.padrao==='placas')for(let i=-2;i<=2;i++)d.elipse(cx+i*rx*.32,cy,rx*.16,ry*.72,tom(s.cor,-.12),{traco:1.6});
 if(c2&&s.padrao==='nenhum')d.elipse(cx-rx*.1,cy,rx*.55,ry*.45,mistura(s.cor,c2,.5),{traco:0,op:.35,plano:true});
}

// ---------------------------------------------------------------- criaturas
function cabecaCriatura(d,s,x,y,r,ang=0){
 const c=s.cor,olho=s.tracos.olhosBrilho;
 d.grupo(()=>{
  const k=s.cabecaCriatura;
  if(k==='trombeta'){
   d.elipse(0,0,r,r*.92,c,{traco:2.2});
   for(let i=0;i<8;i++){const a=i/8*6.283;olho?d.brilho(Math.cos(a)*r*.62,Math.sin(a)*r*.62,r*.3,s.corOlhos):d.circulo(Math.cos(a)*r*.62,Math.sin(a)*r*.62,r*.13,'#151515',{traco:1});}
   d.caminho(`M${r*.6} ${-r*.45} L ${r*1.6} ${-r*.75} Q ${r*1.85} 0 ${r*1.6} ${r*.75} L ${r*.6} ${r*.45} Z`,tom(s.cor2,-.1),{traco:2});
   for(let i=-2;i<=2;i++)d.linha(r*.7,i*r*.18,r*1.55,i*r*.28,tom(s.cor2,-.45),1.4,{contorno:false});
   return;
  }
  if(k==='coruja'){d.circulo(0,0,r,c,{traco:2.2});for(const sy of [-1,1]){d.circulo(r*.3,sy*r*.42,r*.38,'#f3e6b8',{traco:1.6});d.circulo(r*.42,sy*r*.42,r*.2,'#121212',{traco:1});d.circulo(r*.48,sy*r*.48,r*.06,'#fff',{traco:0,plano:true});}d.caminho(`M${r*.75} -4 L ${r*1.1} 0 L ${r*.75} 4 Z`,'#d9a640',{traco:1.2});return;}
  if(k==='serpente'){d.caminho(`M ${-r*.7} ${-r*.55} C ${-r*.2} ${-r*1.05}, ${r*.7} ${-r*.95}, ${r*1.55} ${-r*.12} Q ${r*1.7} 0 ${r*1.55} ${r*.12} C ${r*.7} ${r*.95}, ${-r*.2} ${r*1.05}, ${-r*.7} ${r*.55} Z`,c,{traco:2.2});d.add(`<path d="M ${d.f(-r*.4)} 0 L ${d.f(r*1.2)} 0" stroke="${tom(c,-.4)}" stroke-width="1.2" opacity=".5"/>`);}
  else if(k==='reptil'){d.caminho(`M ${-r*.7} ${-r*.75} Q ${r*.9} ${-r*.95} ${r*1.7} ${-r*.3} Q ${r*1.85} 0 ${r*1.7} ${r*.3} Q ${r*.9} ${r*.95} ${-r*.7} ${r*.75} Z`,c,{traco:2.2});d.circulo(r*1.55,-r*.18,1.6,'#111',{traco:0,plano:true});d.circulo(r*1.55,r*.18,1.6,'#111',{traco:0,plano:true});}
  else if(k==='felina'){d.elipse(0,0,r*1.05,r*.95,c,{traco:2.2});d.elipse(r*.85,0,r*.45,r*.4,tom(c,.08),{traco:1.8});d.caminho(`M${-r*.2} ${-r*.75} L ${-r*.75} ${-r*1.25} L ${-r*.55} ${-r*.45} Z`,c,{traco:1.6});d.caminho(`M${-r*.2} ${r*.75} L ${-r*.75} ${r*1.25} L ${-r*.55} ${r*.45} Z`,c,{traco:1.6});d.circulo(r*1.22,0,2.6,'#1d1d1d',{traco:0,plano:true});}
  else {d.elipse(0,0,r*1.05,r*.85,c,{traco:2.2});d.elipse(r*1.05,0,r*.65,r*.38,tom(c,.05),{traco:1.8});d.elipse(-r*.35,-r*.85,r*.45,r*.22,tom(c,-.15),{rot:-30,traco:1.6});d.elipse(-r*.35,r*.85,r*.45,r*.22,tom(c,-.15),{rot:30,traco:1.6});d.circulo(r*1.62,0,3,'#1a1a1a',{traco:0,plano:true});}
  const ox=k==='reptil'||k==='serpente'?r*.65:r*.45,oy=r*.48;
  if(olho){d.brilho(ox,-oy,r*.3,s.corOlhos);d.brilho(ox,oy,r*.3,s.corOlhos);}
  if(s.tracos.chifres){d.caminho(`M${-r*.1} ${-r*.6} q ${-r*.6} ${-r*.7} ${-r*1.4} ${-r*.5} q ${r*.6} ${r*.05} ${r*1.2} ${r*.75} Z`,'#e3d6b8',{traco:1.4});d.caminho(`M${-r*.1} ${r*.6} q ${-r*.6} ${r*.7} ${-r*1.4} ${r*.5} q ${r*.6} ${-r*.05} ${r*1.2} ${-r*.75} Z`,'#e3d6b8',{traco:1.4});}
  if(s.tracos.antenas){d.traco(`M${r*.6} ${-r*.4} q ${r} ${-r*.6} ${r*2.2} ${-r*.5}`,tom(c,-.3),2.2);d.traco(`M${r*.6} ${r*.4} q ${r} ${r*.6} ${r*2.2} ${r*.5}`,tom(c,-.3),2.2);}
  if(s.tracos.mandibulas){d.traco(`M${r*.8} ${-r*.45} q ${r*.9} ${-r*.2} ${r*1.05} ${r*.35}`,'#2a2016',4);d.traco(`M${r*.8} ${r*.45} q ${r*.9} ${r*.2} ${r*1.05} ${-r*.35}`,'#2a2016',4);}
 },`translate(${d.f(x)} ${d.f(y)}) rotate(${d.f(ang)})`);
}
function pata(d,x,y,r,cor){d.elipse(x,y,r*1.15,r*.8,tom(cor,-.12),{traco:1.8});}
function asas(d,s,cx,larg,comp){
 const c=s.tracos.translucido?'#cfe9ff':(s.cor2||s.cor);
 for(const k of [-1,1]){
  d.caminho(`M ${cx+6} ${k*8} C ${cx-10} ${k*larg*.5}, ${cx-comp*.4} ${k*larg}, ${cx-comp} ${k*larg*.92} Q ${cx-comp*.62} ${k*larg*.55} ${cx-comp*.78} ${k*larg*.3} Q ${cx-comp*.45} ${k*larg*.3} ${cx-comp*.5} ${k*12} Z`,c,{traco:2,op:s.tracos.translucido?.55:.95});
  d.traco(`M ${cx+4} ${k*8} Q ${cx-comp*.35} ${k*larg*.7} ${cx-comp} ${k*larg*.92}`,tom(s.cor,-.35),2.4,{contorno:false});
 }
}
function quadrupede(d,s){
 const c=s.cor,T=s.tracos,k=s.porte,L=56*k,W=30*k,pescoco=T.pescocoLongo;
 if(T.cauda||T.ferrao)d.traco(`M ${-L+8} 0 C ${-L-20} 12, ${-L-38} -12, ${-L-58} -4`,c,11*k);
 if(T.ferrao)d.caminho(`M ${-L-54} -11 L ${-L-74} -5 L ${-L-54} 1 Z`,'#2b2420',{traco:1.4});
 // patas: saem do corpo e aparecem dos lados
 for(const [x,y,a] of [[L*.52,1,22],[L*.52,-1,-22],[-L*.5,1,-18],[-L*.5,-1,18]]){
  const ex=x+Math.sin(a*Math.PI/180)*14*k,ey=y*(W+12*k);
  d.traco(`M ${x} ${y*W*.5} Q ${x} ${y*(W+4*k)} ${ex} ${ey}`,tom(c,-.08),12*k);
  d.elipse(ex+3*k,ey,8*k,6.5*k,tom(c,-.2),{traco:1.6});
 }
 if(T.asas)asas(d,s,L*.2,W*2.6,L*1.4);
 // corpo: peito mais largo + quadril
 d.elipse(-L*.42,0,L*.5,W*.88,c,{traco:2.2});
 d.elipse(L*.2,0,L*.62,W,c,{traco:2.2});
 d.elipse(-L*.15,0,L*.8,W*.82,c,{traco:0,plano:true,op:.98});
 padrao(d,s,-L*.1,0,L*.9,W*.85);
 d.add(`<ellipse cx="${d.f(-L*.05)}" cy="${d.f(-W*.42)}" rx="${d.f(L*.55)}" ry="${d.f(W*.16)}" fill="#fff" opacity=".12"/>`);
 if(T.espinhos)for(let i=-3;i<=3;i++){const x=i*L*.24;d.caminho(`M ${x+5*k} -4 L ${x-9*k} 0 L ${x+5*k} 4 Z`,tom(c,-.35),{traco:1});}
 const nx=pescoco?L+28*k:L*.9;
 if(pescoco)d.traco(`M ${L*.6} 0 Q ${L+12*k} -10 ${nx} -4`,c,16*k);
 cabecaCriatura(d,s,nx+10*k,pescoco?-4:0,20*k);
}
function bipede(d,s){
 const c=s.cor,T=s.tracos,L=40*s.porte,W=26*s.porte;
 d.traco(`M ${-L+4} 0 C ${-L-30} 6, ${-L-60} -10, ${-L-88} -2`,c,15*s.porte);
 d.traco(`M ${-L-60} -6 L ${-L-88} -2`,tom(c,-.1),6*s.porte,{contorno:false});
 for(const k of [-1,1])d.elipse(-6,k*W*.95,16*s.porte,9*s.porte,tom(c,-.1),{traco:1.8});
 if(T.asas)asas(d,s,6,W*3.2,L*2.1);
 d.elipse(0,0,L,W,c,{traco:2.4});padrao(d,s,0,0,L,W);
 if(!T.asas)for(const k of [-1,1])d.traco(`M ${L*.6} ${k*W*.6} q 10 ${k*4} 16 ${k*2}`,tom(c,-.05),5);
 if(T.espinhos)for(let i=-2;i<=2;i++)d.caminho(`M ${i*L*.35-5} 0 L ${i*L*.35} -8 L ${i*L*.35+5} 0 L ${i*L*.35} 8 Z`,tom(c,-.3),{traco:1.2});
 d.traco(`M ${L*.7} 0 Q ${L+10} 4 ${L+20} 0`,c,14*s.porte);
 cabecaCriatura(d,s,L+28,0,16*s.porte);
}
function inseto(d,s){
 const c=s.cor,T=s.tracos,k=s.porte,op=T.translucido?.75:1;
 for(const lado of [-1,1])for(const [x,a] of [[16,-35],[2,0],[-12,35]]){
  const ex=x+Math.cos((a+90*lado)*Math.PI/180)*8,ey=lado*20*k;
  d.traco(`M ${x} ${lado*8} L ${ex+lado*0+(x>8?14:x<-6?-14:0)} ${ey} L ${ex+(x>8?28:x<-6?-30:2)} ${lado*44*k}`,tom(c,-.3),4*k);
 }
 if(T.asas&&!T.translucido)for(const lado of [-1,1]){
  d.caminho(`M ${6*k} ${lado*6*k} C ${10*k} ${lado*60*k}, ${-30*k} ${lado*84*k}, ${-46*k} ${lado*62*k} C ${-56*k} ${lado*40*k}, ${-30*k} ${lado*20*k}, ${-10*k} ${lado*6*k} Z`,s.cor2,{traco:1.6});
  d.circulo(-18*k,lado*48*k,9*k,tom(s.cor,-.25),{traco:1.2});d.circulo(-18*k,lado*48*k,4*k,tom(s.cor2,.3),{traco:.8});
  d.caminho(`M ${-14*k} ${lado*6*k} C ${-40*k} ${lado*30*k}, ${-66*k} ${lado*36*k}, ${-70*k} ${lado*20*k} C ${-64*k} ${lado*8*k}, ${-40*k} ${lado*4*k}, ${-14*k} ${lado*6*k} Z`,tom(s.cor2,-.1),{traco:1.4});
 }
 else if(T.asas||T.translucido)for(const lado of [-1,1]){d.elipse(-10,lado*24*k,30*k,12*k,'#d8f0ff',{rot:lado*-22,traco:1.4,op:.5});d.elipse(-20,lado*18*k,24*k,9*k,'#d8f0ff',{rot:lado*-38,traco:1.4,op:.45});}
 d.elipse(-34*k,0,30*k,19*k,c,{traco:2.2,op});padrao(d,s,-34*k,0,30*k,19*k);
 if(T.ferrao)d.caminho(`M ${-62*k} -5 L ${-84*k} 0 L ${-62*k} 5 Z`,'#2b2420',{traco:1.4});
 d.elipse(4*k,0,17*k,14*k,tom(c,.05),{traco:2.2,op});
 d.add(`<path d="M ${-50*k} ${-10*k} q ${16*k} -6 ${30*k} 0" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>`);
 const hs=s.cabecaCriatura==='canina'?'serpente':s.cabecaCriatura;
 cabecaCriatura(d,{...s,cabecaCriatura:hs==='trombeta'?'trombeta':'serpente',tracos:{...T,mandibulas:true,antenas:T.antenas!==false}},26*k,0,11*k);
}
function aracnideo(d,s){
 const c=s.cor,k=s.porte;
 for(const lado of [-1,1])for(let i=0;i<4;i++){const a=(-50+i*33)*Math.PI/180;d.traco(`M ${Math.cos(a)*14*k} ${lado*Math.sin(Math.abs(a)+.3)*12*k} q ${Math.cos(a)*26*k} ${lado*30*k} ${Math.cos(a)*44*k} ${lado*48*k}`,tom(c,-.35),3.6*k);}
 d.elipse(-10*k,0,40*k,34*k,c,{traco:2.4});padrao(d,s,-10*k,0,40*k,34*k);
 d.add(`<ellipse cx="${-20*k}" cy="${-12*k}" rx="${16*k}" ry="${8*k}" fill="#fff" opacity=".22"/>`);
 d.elipse(32*k,0,12*k,11*k,tom(c,-.2),{traco:2});
 d.traco(`M ${40*k} -5 l 8 -3`,'#2a1d14',3);d.traco(`M ${40*k} 5 l 8 3`,'#2a1d14',3);
}
function serpente(d,s){
 const c=s.cor,k=s.porte,w=16*k;
 const dPath=`M ${-96*k} ${18*k} C ${-70*k} ${-40*k}, ${-34*k} ${44*k}, ${-4*k} ${-6*k} S ${40*k} ${-30*k}, ${58*k} 0`;
 d.traco(dPath,c,w);
 d.add(`<path d="${dPath}" fill="none" stroke="${tom(c,-.35)}" stroke-width="${d.f(w*.55)}" stroke-dasharray="3 6" opacity=".6"/>`);
 d.add(`<path d="${dPath}" fill="none" stroke="${tom(c,.3)}" stroke-width="${d.f(w*.18)}" opacity=".5" transform="translate(-1 -3)"/>`);
 cabecaCriatura(d,{...s,cabecaCriatura:'serpente'},64*k,0,12*k);
}
function amorfo(d,s){
 const c=s.cor,k=s.porte,pts=[];const n=11;
 for(let i=0;i<n;i++){const a=i/n*6.283,r=(52+d.rnd()*18)*k;pts.push([Math.cos(a)*r,Math.sin(a)*r*.86]);}
 let p=`M ${d.f((pts[0][0]+pts[n-1][0])/2)} ${d.f((pts[0][1]+pts[n-1][1])/2)}`;
 for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n];p+=` Q ${d.f(a[0])} ${d.f(a[1])} ${d.f((a[0]+b[0])/2)} ${d.f((a[1]+b[1])/2)}`;}
 d.caminho(p+' Z',c,{traco:2.6,op:s.tracos.translucido?.78:.95});
 for(let i=0;i<6;i++)d.circulo((d.rnd()-.5)*60*k,(d.rnd()-.5)*50*k,(4+d.rnd()*7)*k,tom(c,-.3),{traco:1,op:.7});
 d.add(`<ellipse cx="${-14*k}" cy="${-22*k}" rx="${22*k}" ry="${9*k}" fill="#fff" opacity=".3"/>`);
 if(s.tracos.olhosBrilho){d.brilho(26*k,-12*k,8*k,s.corOlhos);d.brilho(26*k,12*k,8*k,s.corOlhos);}
}
function primata(d,s){
 const c=s.cor,k=s.porte,larg=48*k,prof=30*k;
 for(const [oy,mx,my] of [[larg-8,40,larg*.95],[-larg+8,40,-larg*.95],[larg-18,52,larg*.45],[-larg+18,52,-larg*.45]]){d.traco(`M 0 ${oy} Q ${mx*.5*k} ${oy+(oy>0?10:-10)} ${mx*k} ${my}`,c,15*k);d.circulo(mx*k,my,9*k,tom(c,-.15),{traco:1.8});}
 d.elipse(-6,0,prof,larg,c,{traco:2.6});padrao(d,s,-6,0,prof,larg);
 d.circulo(14*k,0,20*k,tom(c,-.08),{traco:2.2});d.elipse(28*k,0,9*k,12*k,s.cor2||tom(c,.2),{traco:1.6});
 if(s.tracos.olhosBrilho){d.brilho(24*k,-8*k,5*k,s.corOlhos);d.brilho(24*k,8*k,5*k,s.corOlhos);}
}
function larva(d,s){
 const c=s.cor,k=s.porte;
 for(let i=4;i>=0;i--){const x=(-70+i*16)*k,r=(16+i*1.5)*k;d.circulo(x,Math.sin(i)*4*k,r,i%2?c:tom(c,-.08),{traco:2});if(s.padrao!=='nenhum')d.circulo(x,Math.sin(i)*4*k,r*.35,s.cor2,{traco:0,plano:true,op:.8});}
 cabecaCriatura(d,{...s,cabecaCriatura:'coruja'},20*k,0,24*k);
}
function sessil(d,s){
 const c=s.cor,k=s.porte,n=s.pescocos;
 for(let i=0;i<n;i++){const a=i/n*6.283+.3,ex=Math.cos(a)*80*k,ey=Math.sin(a)*80*k;
  d.traco(`M 0 0 Q ${d.f(Math.cos(a+.6)*50*k)} ${d.f(Math.sin(a+.6)*50*k)} ${d.f(ex)} ${d.f(ey)}`,tom(c,.05),13*k);
  cabecaCriatura(d,{...s,cabecaCriatura:'serpente'},ex,ey,10*k,a*180/Math.PI);}
 d.circulo(0,0,46*k,c,{traco:2.8});padrao(d,s,0,0,46*k,46*k);
 for(let i=0;i<7;i++)d.circulo((d.rnd()-.5)*50*k,(d.rnd()-.5)*50*k,(5+d.rnd()*6)*k,tom(c,-.25),{traco:1,op:.8});
}
function enxame(d,s){
 const c=s.cor;for(let i=0;i<s.quantidade;i++){const a=d.rnd()*6.283,r=Math.sqrt(d.rnd())*86,x=Math.cos(a)*r,y=Math.sin(a)*r,ang=d.rnd()*360;
  d.grupo(()=>{d.traco('M -4 -5 L 4 5 M -4 5 L 4 -5',tom(c,-.4),1.4,{contorno:false});d.elipse(0,0,7,4.5,c,{traco:1.2});d.circulo(6,0,2.8,tom(c,-.2),{traco:1});},`translate(${d.f(x)} ${d.f(y)}) rotate(${d.f(ang)})`);}
}
function ave(d,s){
 const c=s.cor,k=s.porte*1.6;
 for(const a of [-28,-10,10,28])d.elipse(-34*k,a*.25*k,16*k,5*k,tom(s.cor2||c,-.1),{rot:a,traco:1.4});
 for(const sy of [-1,1])d.traco(`M ${2*k} ${sy*14*k} l ${2*k} ${sy*6*k} m ${-2*k} ${-sy*6*k} l ${6*k} ${sy*4*k}`,'#d9952a',2.2*k);
 d.elipse(-4*k,0,30*k,21*k,c,{traco:2});
 for(const sy of [-1,1])d.elipse(-8*k,sy*14*k,22*k,9*k,tom(c,-.12),{rot:sy*-6,traco:1.6});
 d.circulo(22*k,0,11*k,c,{traco:1.8});
 d.caminho(`M ${31*k} ${-4*k} L ${42*k} 0 L ${31*k} ${4*k} Z`,'#e3a13a',{traco:1.2});
 for(const x of [14,19,24])d.circulo(x*k,0,3.4*k,'#d6322a',{traco:1});
 d.elipse(30*k,0,2.6*k,5*k,'#c4282a',{traco:.8,op:.9});
 d.circulo(25*k,-6.5*k,1.6*k,'#151515',{traco:0,plano:true});d.circulo(25*k,6.5*k,1.6*k,'#151515',{traco:0,plano:true});
}
function tanque(d,s){
 const k=s.porte;
 for(const [x,y] of [[30,38],[30,-38],[-30,38],[-30,-38]]){d.linha(0,0,x*k*1.25,y*k*1.25,'#59616e',7*k);d.circulo(x*k*1.25,y*k*1.25,7*k,'#3c434e',{traco:1.6});}
 d.circulo(0,0,48*k,'#7c8796',{traco:3});
 d.add(`<circle cx="0" cy="0" r="${40*k}" fill="#7fd6e0" opacity=".55" stroke="#bff6ff" stroke-width="2"/>`);
 d.caminho(`M ${-26*k} ${-6*k} q ${8*k} ${-22*k} ${26*k} ${-16*k} q ${22*k} ${-6*k} ${26*k} ${14*k} q ${6*k} ${18*k} ${-14*k} ${22*k} q ${-20*k} ${10*k} ${-34*k} ${-6*k} Z`,s.pele||'#e3a7b6',{traco:1.8,op:.95});
 d.traco(`M ${-18*k} 0 q ${8*k} -6 ${16*k} 2 t ${16*k} -2`,tom(s.pele||'#e3a7b6',-.35),1.6,{contorno:false});
 d.add(`<ellipse cx="${-14*k}" cy="${-24*k}" rx="${18*k}" ry="${7*k}" fill="#fff" opacity=".35"/>`);
}
function robo(d,s){
 const k=s.porte,m=s.corArmadura||'#8d99ab',larg=40*k,prof=24*k,dois=['rifle','lanca','cajado','machado','bastao'].includes(s.maoD);
 if(s.mochila)d.caminho(`M${-prof-16} ${-14} h20 v28 h-20 Z`,tom(m,-.25),{traco:2,juncao:'miter'});
 const mD=dois?[28,14]:[26,24*k],mE=dois?[42,-6]:[24,-24*k];
 const braco=(oy,[hx,hy])=>{d.linha(-2,oy,hx,hy,tom(m,-.2),11*k,{fim:'butt'});d.caminho(`M${hx-6} ${hy-6} h12 v12 h-12 Z`,tom(m,-.35),{traco:1.6,juncao:'miter'});};
 d.caminho(`M ${-prof} ${-larg} L ${prof*.7} ${-larg*.8} L ${prof*.9} ${larg*.8} L ${-prof} ${larg} Z`,m,{traco:2.6,juncao:'miter'});
 d.linha(-prof*.6,-larg*.6,-prof*.6,larg*.6,tom(m,-.4),1.6,{contorno:false});d.linha(prof*.2,-larg*.55,prof*.2,larg*.55,tom(m,-.4),1.6,{contorno:false});
 d.caminho(`M${-6} ${-larg-8} h14 v14 h-14 Z`,tom(m,-.15),{traco:2,juncao:'miter'});d.caminho(`M${-6} ${larg-6} h14 v14 h-14 Z`,tom(m,-.15),{traco:2,juncao:'miter'});
 braco(larg-2,mD);braco(-larg+2,mE);
 if(s.maoD!=='nenhuma')arma(d,s.maoD,mD[0],mD[1],1,m);
 if(s.maoE!=='nenhuma'&&!dois)arma(d,s.maoE,mE[0],mE[1],-1,m);
 d.caminho(`M ${-8*k} ${-15*k} h ${22*k} l ${6*k} ${6*k} v ${18*k} l ${-6*k} ${6*k} h ${-22*k} Z`,tom(m,.08),{traco:2.2,juncao:'miter'});
 d.linha(16*k,-10*k,16*k,10*k,s.corOlhos||'#ff5a4f',4,{contorno:false});d.brilho(16*k,0,9*k,s.corOlhos||'#ff5a4f');
}

const PLANOS={humanoide,quadrupede,bipede,alado:(d,s)=>bipede(d,{...s,tracos:{...s.tracos,asas:true}}),inseto,aracnideo,serpente,amorfo,primata,larva,sessil,enxame,ave,
 tanque:(d,s)=>d.grupo(()=>tanque(d,s),'scale(1.6)'),robo:(d,s)=>d.grupo(()=>robo(d,s),'translate(-6 0) scale(1.8)')};

export function renderizarMiniatura(spec,semente){
 const s=normalizarSpec(spec);
 const seed=semente??[...JSON.stringify(s)].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
 const d=criarDesenho(seed);
 (PLANOS[s.corpo]||humanoide)(d,s);
 // v196: a pessoa vista de cima preenche ~1 m da base (antes ocupava só ~28% da largura e parecia muito menor que o quadrado de 1 m)
 return s.corpo==='humanoide'?d.svg().replace('viewBox="-128 -128 256 256"','viewBox="-95 -95 190 190"'):d.svg();
}
export const svgParaDataUrl=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
export const ehMiniatura=url=>String(url||'').includes(MARCA_MINI);

// ---------------------------------------------------------------- receitas automáticas
const sem=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function hashTexto(t){let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;}
export function specDeArmas(texto){
 const t=sem(texto),out={};
 const tipo=t.includes('rifle')?'rifle':t.includes('espada de forca')||t.includes('sabre')?'sabre':t.includes('lanca')?'lanca':/blaster/.test(t)?'blaster':/pistola/.test(t)?'pistola':/machad/.test(t)?'machado':/espada/.test(t)?'espada':/faca|adaga/.test(t)?'faca':/bastao/.test(t)?'bastao':/ferramenta|kit|scanner|braco manipulador/.test(t)?'ferramenta':'nenhuma';
 out.maoD=tipo;
 if(/escudo/.test(t))out.maoE='escudo';else if(tipo!=='rifle'&&/pistola/.test(t)&&tipo!=='pistola')out.maoE='pistola';
 return out;
}
// Receita de NPC a partir de raça, sexo, carreira, armas e descrição.
export function specDeNpc(n={}){
 const t=sem([n.raca,n.carreira,n.conceito,n.descricao].join(' ')),h=hashTexto(n.id||n.nome||t);
 const pick=a=>a[h%a.length];
 const s={...specPadrao('humanoide'),...specDeArmas(n.armasTexto),tracos:{}};
 s.pele=pick(['#f1c9a5','#d9a47c','#b97c55','#8a5636','#5c3a24']);
 s.corCabelo=pick(['#2a1c12','#4a3220','#7a5530','#b08d57','#1b1b1b','#8a8a8a']);
 s.cabelo=(/^f/.test(sem(n.sexo))||/^(dra|sra|srta|lady)\b/.test(sem(n.nome)))?pick(['longo','rabo','coque','crespo']):pick(['curto','curto','careca','moicano','crespo']);
 s.roupa=pick(['#34507a','#5b3a3a','#3e5a3e','#5a4a6e','#6e5a3a','#3a4f5a']);s.roupa2=tom(s.roupa,-.35);
 if(/guarda|soldado|mercenari|agente|seguranca/.test(t)){s.armadura=/soldado|mercenari/.test(t)?'pesada':'leve';s.roupa='#3d4654';s.corArmadura='#6f7c8f';}
 if(/guarda/.test(t))s.cabeca='capacete';
 if(/mineir|minera/.test(t)){s.cabeca='capacete';s.corArmadura='#d9a640';s.mochila=true;}
 if(/medic/.test(t)){s.roupa='#e8eef4';s.roupa2='#7fb6c9';}
 if(/caravan|mercador|mercante|comerciante|antiquario|cambista/.test(t)){s.capa=pick(['#6e4a2a','#4a3a5a','#5a2e2e']);s.mochila=/caravan|mercador/.test(t);}
 if(/cacador|caverna/.test(t)){s.roupa='#6e5a3a';s.roupa2='#4a3a24';s.cabelo='crespo';}
 if(/contrabandist|espia|agente/.test(t)){s.cabeca='capuz';s.capa='#22252e';}
 if(/crianca|garoto|bisca/.test(t))s.porte=.8;
 if(/lutador/.test(t)){s.roupa='#7a2e2e';s.roupa2='#d9a640';}
 // espécies
 if(/reptil/.test(t)){Object.assign(s.tracos,{focinho:true,cauda:true});s.pele=pick(['#6f8f4f','#4f6f5a','#8a7a4a']);s.cabelo='careca';s.porte=/lutador|grande/.test(t)?1.3:1.05;}
 if(/insetoid/.test(t)){Object.assign(s.tracos,{carapaca:true,antenas:true,mandibulas:true});s.pele=/ambar/.test(t)?'#c98a2a':pick(['#3c3f2e','#5a4a2e','#2e3a3f']);s.cabelo='careca';if(!/dois bracos|2 bracos/.test(t))s.tracos.quatroBracos=true;if(/armadura/.test(t)){s.armadura='pesada';s.corArmadura='#2b313c';s.cabeca='capacete';}}
 if(/grey/.test(t)){Object.assign(s.tracos,{cabecaGrande:true});s.pele='#b9bfc6';s.cabelo='careca';s.porte=/alto/.test(t)?.85:.75;}
 if(/nymari/.test(t)){Object.assign(s.tracos,{orelhasLongas:true});s.pele=pick(['#b9a48c','#9a8a7a','#c7b39a']);}
 if(/zutarian/.test(t)){s.pele='#7fa05a';s.porte=.8;}
 if(/talassi|anfibi/.test(t)){Object.assign(s.tracos,{nadadeiras:true});s.pele='#6f8fa6';s.cabelo='careca';}
 if(/aeral|aviari/.test(t)){Object.assign(s.tracos,{membranas:true});s.pele='#c9b48f';s.porte=.85;}
 if(/parasitad|revenante|vampir/.test(t)){s.pele=/vampir/.test(t)?'#e6dcd8':'#a8b39a';s.tracos.olhosBrilho=true;s.corOlhos='#ff3b3b';if(/vampir/.test(t))s.capa='#3a0f16';}
 if(/arisian/.test(t))return {...specPadrao('tanque'),pele:'#e3a7b6',corpo:'tanque',porte:.95};
 if(/robo|chassis|^ur-|maquina/.test(t)){const r={...specPadrao('robo'),...specDeArmas(n.armasTexto),corpo:'robo',corArmadura:/imperial/.test(t)?'#b08d3c':/assassin|combate/.test(t)?'#3a3f4a':/gigante/.test(t)?'#5a6a7e':'#8d99ab',corOlhos:/assassin|combate/.test(t)?'#ff3b3b':'#7fe9ff',porte:/gigante/.test(t)?1.4:1,mochila:/utilitari|manutencao/.test(t)};return r;}
 return s;
}
// Receitas desenhadas à mão para as criaturas do banco atual (ids do CSV de 26/09).
export const RECEITAS_CRIATURAS={
 besta_ululante:{corpo:'quadrupede',cor:'#6b5a48',cor2:'#c9a27a',padrao:'listras',cabecaCriatura:'serpente',porte:1.15,tracos:{pescocoLongo:true,cauda:true,espinhos:true,olhosBrilho:true},corOlhos:'#ffcf6b'},
 'caçador_de_nevoa':{corpo:'quadrupede',cor:'#7d8a94',cor2:'#c9d3da',padrao:'manchas',cabecaCriatura:'felina',porte:.95,tracos:{cauda:true,olhosBrilho:true},corOlhos:'#9fe8ff'},
 cadaver_de_chefe:{corpo:'humanoide',porte:1.32,pele:'#7f8c74',roupa:'#3a3530',roupa2:'#5a1f1f',cabelo:'careca',pose:'zumbi',tracos:{olhosBrilho:true,espinhos:true,carapaca:true},corOlhos:'#d6ff6b'},
 zumbi_1:{corpo:'humanoide',porte:.88,pele:'#a8b39a',roupa:'#6a5e4a',roupa2:'#3a2e22',cabelo:'careca',pose:'zumbi',tracos:{},corOlhos:'#d6ff6b'},
 inchado_pustulento:{corpo:'humanoide',porte:1.4,pele:'#9aa86a',roupa:'#4a4a36',roupa2:'#6a7a2a',cabelo:'careca',pose:'zumbi',tracos:{olhosBrilho:true,tentaculos:true},corOlhos:'#e0ff6b'},
 cao_de_sucata:{corpo:'quadrupede',cor:'#6a6258',cor2:'#9aa3ad',padrao:'placas',cabecaCriatura:'canina',porte:.85,tracos:{cauda:true,olhosBrilho:true},corOlhos:'#ff5a3b'},
 rastejador_de_tubulacoes:{corpo:'serpente',cor:'#4a3f5a',cor2:'#9a8ac9',porte:1,tracos:{olhosBrilho:true},corOlhos:'#bfff6b'},
 sentinela_imperial:{corpo:'robo',corArmadura:'#9a8a5a',corOlhos:'#ff3b3b',porte:1,maoD:'rifle'},
 mariposa_cinza:{corpo:'inseto',cor:'#8a8478',cor2:'#c9c2b0',porte:1,padrao:'manchas',tracos:{asas:true,antenas:true}},
 galinha_do_sergio:{corpo:'ave',cor:'#f2efe6',cor2:'#e2dccb',porte:.6},
 rato_gigante_esgoto:{corpo:'quadrupede',cor:'#5e5248',cor2:'#9a8a7a',cabecaCriatura:'canina',porte:.72,padrao:'nenhum',tracos:{cauda:true,olhosBrilho:true},corOlhos:'#ff8a5a'},
 enxame_ratos:{corpo:'enxame',cor:'#5a4a40',quantidade:28},
 lagarto_de_galeria:{corpo:'quadrupede',cor:'#4a5a3a',cor2:'#8a9a5a',cabecaCriatura:'reptil',porte:1.2,padrao:'escamas',tracos:{cauda:true,espinhos:true,olhosBrilho:true},corOlhos:'#e0d23a'},
 limo_de_esgoto:{corpo:'amorfo',cor:'#7a8a3a',porte:.95,tracos:{translucido:true,olhosBrilho:true},corOlhos:'#d6ff6b'},
 carrapato_de_ferro:{corpo:'aracnideo',cor:'#5a5f66',cor2:'#9aa3ad',padrao:'placas',porte:.9},
 cavalgante_prismatico:{corpo:'quadrupede',cor:'#7a6ad0',cor2:'#6fe0d0',padrao:'listras',cabecaCriatura:'canina',porte:1.15,tracos:{antenas:true,cauda:true,pescocoLongo:true}},
 cila:{corpo:'sessil',cor:'#a35a5a',cor2:'#e3a0a0',padrao:'manchas',pescocos:6,porte:1.1},
 dragao_trombeta_alado_domesticado:{corpo:'alado',cor:'#8a6a3a',cor2:'#d9b36a',cabecaCriatura:'trombeta',porte:1,padrao:'escamas'},
 dragao_trombeta_alado_selvagem:{corpo:'alado',cor:'#5a4a3a',cor2:'#c96a3a',cabecaCriatura:'trombeta',porte:1.2,padrao:'escamas',tracos:{espinhos:true,olhosBrilho:true},corOlhos:'#ffcf6b'},
 dragao_trombeta_corredor_domesticado:{corpo:'bipede',cor:'#7a7a4a',cor2:'#d9cf8a',cabecaCriatura:'trombeta',porte:.95,padrao:'escamas'},
 dragao_trombeta_corredor_selvagem:{corpo:'bipede',cor:'#5a6a3a',cor2:'#c9a63a',cabecaCriatura:'trombeta',porte:1.1,padrao:'listras',tracos:{espinhos:true}},
 enxame_mordedor:{corpo:'enxame',cor:'#4a3a2e',quantidade:22},
 escavador_de_carapaca:{corpo:'quadrupede',cor:'#6a5a46',cor2:'#a68a64',padrao:'placas',cabecaCriatura:'reptil',porte:1.15,tracos:{mandibulas:true,espinhos:true}},
 insetoide_predador:{corpo:'humanoide',porte:1.1,pele:'#3a4a2e',roupa:'#2e3a24',roupa2:'#55663a',cabelo:'careca',maoD:'nenhuma',maoE:'nenhuma',tracos:{carapaca:true,antenas:true,mandibulas:true,quatroBracos:true}},
 larva_interdimensional:{corpo:'larva',cor:'#c9b8e6',cor2:'#6f5aa6',padrao:'manchas',porte:.95},
 criatura_de_calico_2:{corpo:'amorfo',cor:'#6fbf73',porte:1,tracos:{translucido:true}},
 criatura_de_calico_1:{corpo:'primata',cor:'#7a5a3a',cor2:'#c9a27a',porte:1.25,tracos:{olhosBrilho:false}},
 metamorfo_generico:{corpo:'quadrupede',cor:'#8a5a5a',cor2:'#c98a8a',padrao:'manchas',cabecaCriatura:'canina',porte:1,tracos:{espinhos:true,olhosBrilho:true,cauda:true},corOlhos:'#ff6b3b'},
 metamorfo_psiquico:{corpo:'quadrupede',cor:'#6a4a8a',cor2:'#c98aff',padrao:'manchas',cabecaCriatura:'canina',porte:1,tracos:{espinhos:true,olhosBrilho:true,cauda:true},corOlhos:'#d6a6ff'},
 parasita_carniceiro:{corpo:'aracnideo',cor:'#7a5a4a',cor2:'#c99a7a',padrao:'listras',porte:.85},
 predador_couracado:{corpo:'quadrupede',cor:'#6a6a5a',cor2:'#a6a68a',padrao:'placas',cabecaCriatura:'reptil',porte:1.15,tracos:{cauda:true,espinhos:true}},
 predador_de_nevoa:{corpo:'quadrupede',cor:'#5a6a74',cor2:'#aebcc6',padrao:'listras',cabecaCriatura:'felina',porte:1,tracos:{cauda:true,olhosBrilho:true},corOlhos:'#bff6ff'},
 insetoide_predador_1:{corpo:'inseto',cor:'#23262e',cor2:'#5a6070',porte:1.15,tracos:{ferrao:true,olhosBrilho:true},corOlhos:'#ff5a3b'},
 rastejante_de_cinzas:{corpo:'inseto',cor:'#5a5550',cor2:'#9a948a',porte:.85,padrao:'manchas'},
 serpente_sanguessuga:{corpo:'serpente',cor:'#5a2a3a',cor2:'#c96a7a',porte:1,tracos:{olhosBrilho:true},corOlhos:'#ff3b5a'},
 vampiro_generico:{corpo:'humanoide',pele:'#e6dcd8',roupa:'#2a1e24',roupa2:'#5a1220',capa:'#3a0f16',cabelo:'longo',corCabelo:'#1b1b1b',tracos:{olhosBrilho:true},corOlhos:'#ff3b3b'},
 vampiro_psiquico:{corpo:'humanoide',pele:'#ddd6ee',roupa:'#241e2e',roupa2:'#4a2a6e',capa:'#2e1a4a',cabelo:'longo',corCabelo:'#e6e6f0',tracos:{olhosBrilho:true},corOlhos:'#d6a6ff'},
 vespa_de_vidro:{corpo:'inseto',cor:'#bfe6ff',cor2:'#e9f7ff',porte:.9,tracos:{translucido:true,asas:true,ferrao:true}}
};
export function specDeCriatura(c={}){
 if(RECEITAS_CRIATURAS[c.id])return normalizarSpec(RECEITAS_CRIATURAS[c.id]);
 if(/galinha/.test(sem(c.nome)))return normalizarSpec(RECEITAS_PERSONAGENS.galinha);
 const t=sem([c.nome,c.especie,c.tipo,c.descricao,c.armasTexto].join(' ')),h=hashTexto(c.id||c.nome||t);
 const cores=['#6b5a48','#5a6a74','#6a6a5a','#7a5a3a','#5a4a6a','#4a5a3a'];
 const s={...specPadrao('quadrupede'),cor:cores[h%cores.length],cor2:'#c9b48f',tracos:{cauda:true}};
 if(/insetoid/.test(t)&&!/hexapod|seis patas|formiga/.test(t))return normalizarSpec({...specPadrao('humanoide'),porte:1.05,pele:['#3c3f2e','#5a4a2e','#2e3a3f'][h%3],roupa:'#2e3a24',roupa2:'#4a5a32',cabelo:'careca',maoD:'nenhuma',maoE:'nenhuma',tracos:{carapaca:true,antenas:true,mandibulas:true,quatroBracos:true}});
 else if(/insetoid|hexapod|inseto|vespa/.test(t))Object.assign(s,{corpo:'inseto',tracos:{ferrao:/ferrao/.test(t),asas:/voador|vespa/.test(t)}});
 else if(/serpent|cobra/.test(t))s.corpo='serpente';
 else if(/carrapat|aranha|aracn/.test(t))s.corpo='aracnideo';
 else if(/limo|amorf/.test(t))Object.assign(s,{corpo:'amorfo',tracos:{translucido:true}});
 else if(/enxame/.test(t))s.corpo='enxame';
 else if(/alado|asas/.test(t))s.corpo='alado';
 else if(/bipede/.test(t))s.corpo='bipede';
 else if(/humanoide|cadaver|vampir|zumbi/.test(t))return normalizarSpec({...specDeNpc({...c,raca:'parasitado'}),pose:/cadaver|zumbi/.test(t)?'zumbi':'normal'});
 if(/psiquic/.test(t))Object.assign(s.tracos,{olhosBrilho:true}),s.corOlhos='#d6a6ff';
 if(/reptil|couraç|courac/.test(t))s.cabecaCriatura='reptil',s.padrao='escamas';
 if(/felin|emboscada/.test(t))s.cabecaCriatura='felina';
 return normalizarSpec(s);
}

// ---------------------------------------------------------------- personagens dos jogadores (v106)
// Receitas prontas, encontradas pelo nome da ficha (sem acento/maiúsculas).
export const RECEITAS_PERSONAGENS={
 qozae:{corpo:'humanoide',porte:1.15,pele:'#5f7a3e',roupa:'#8a6a44',roupa2:'#5a3a22',cabeca:'chapeu',cabelo:'careca',capa:'#7a5a3a',maoD:'revolver',corOlhos:'#d9c23a',tracos:{focinhoLongo:true,cauda:true}},
 jullytrath:{corpo:'humanoide',porte:.95,pele:'#2f8a74',roupa:'#5a2a5a',roupa2:'#d9b36a',cor2:'#1f5a4c',cabelo:'longo',corCabelo:'#7a1f2a',tracos:{chifres:true,cauda:true,asasDobradas:true},corOlhos:'#ffcf6b'},
 kibi:{corpo:'humanoide',porte:.74,pele:'#e8b98f',roupa:'#4a6e3a',roupa2:'#7a5a2a',cabelo:'curto',corCabelo:'#b0702a',mochila:true,tracos:{barba:true}},
 'sergio leone':{corpo:'humanoide',porte:1,pele:'#d9a47c',roupa:'#4a3a2a',roupa2:'#2e241a',cabeca:'capacete',corArmadura:'#c9ccd2',capa:'#8a5a2a',maoD:'revolver',tracos:{}},
 galinha:{corpo:'ave',cor:'#f2efe6',cor2:'#e2dccb',porte:.6}
};
const chaveNome=n=>String(n||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
export function receitaPorNome(nome){
 const k=chaveNome(nome);if(!k)return null;
 if(RECEITAS_PERSONAGENS[k])return RECEITAS_PERSONAGENS[k];
 if(k==='kozae')return RECEITAS_PERSONAGENS.qozae;
 for(const [id,r] of Object.entries(RECEITAS_PERSONAGENS))if(k.startsWith(id+' ')||k.includes(' '+id)||k===id.split(' ')[0])return r;
 return null;
}
export function specDePersonagem(c={}){
 const r=receitaPorNome(c.nome);
 return normalizarSpec(r||specDeNpc({id:c.id,nome:c.nome,raca:c.raca,sexo:c.sexo,carreira:c.carreira,conceito:c.conceito,descricao:c.descricao}));
}
