// Mesa Estelar v139 — Mapas feitos a partir da DESCRIÇÃO de cada cenário (dados puros, sem DOM).
//
// Lê nome, local, tipo e descrições do cenário e escolhe um modelo (feira, praça, rua, bar, clínica, arquivo,
// custódia, palácio, arena, porto, natureza). Regras de arrumação:
//  • mesas e cadeiras são objetos separados (cadeira na camada 2, sentável; mesa na camada 3);
//  • armários, estantes e máquinas de venda ficam encostados nas paredes;
//  • lugares públicos têm postes de luz (acendem à noite pela luz do mapa);
//  • tendas, lojas e bares em lugar aberto têm "Telhado · …" (some quando um jogador entra);
//  • escadas "… ·N" ligam o térreo ao andar de cima desenhado no mesmo mapa.
// Também devolve "pessoasV139": lugares para comerciantes e moradores (o mestre põe NPCs ali).

import {novoCtx,objRef,areiaDoDeserto,estadoDe,escolher,gerarMapa,grade} from './mesa-gerador-mapas.js?v=141';

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};

// ---------------------------------------------------------------- classificação pelo texto do cenário
export function classificarCenario(c={}){
 const so=sem(c.nome),loc=sem(c.local),tudo=sem([c.nome,c.local,c.tipo,c.descricaoJogadores,c.descricaoGM,c.objetivo,c.observacoes].join(' '));
 const diz=re=>re.test(tudo);
 const REGRAS=[[/ultima bateria/,'taverna'],[/mercado|feira|bazar|panelas|galeria/,'mercado'],[/clinica|hospital|enfermaria/,'clinica'],[/pavilh|custodia|prisao|cadeia|detencao/,'custodia'],
  [/arquivo|biblioteca|registro|cartorio|escritorio/,'arquivo'],[/tribunal/,'tribunal'],[/palacio|residencia|mansao|casa de/,'palacio'],[/praca|largo|terraco|patio/,'praca'],
  [/ringue|arena|competic|tiro|estande|torneio/,'arena'],[/porto|hangar|doca|estacao/,'porto'],[/\bbar\b|taverna|cantina|estalagem|bateria/,'bar'],[/mina|caverna|gruta/,'caverna'],
  [/bosque|floresta|mata|selva|trilha/,'floresta'],[/serra|mar de pedras|deserto|caravana|estrada|ermo|planicie|dunas/,'ermos'],[/\brua\b|beco|bairro|distrito/,'rua']];
 const achar=t=>{for(const [re,k] of REGRAS)if(re.test(t))return k;return '';};
 let tipo=c.intermediario?(achar(loc)||'rua'):(achar(so)||(/ ou /.test(loc)?'':achar(loc))||'');
 if(!tipo)tipo=diz(/mercado|feira|barraca/)?'mercado':diz(/taverna|\bbar\b|bebida/)?'bar':'rua';
 return {tipo,
  coberto:diz(/cavidade|subterr|caverna|escavad|galeria|tunel/),
  noite:diz(/sem luz|escurid|noturn|a noite|de noite/),
  comida:diz(/comida|panela|cozinh|refeic|ensopad|caldo|frito/),
  maquinas:diz(/maquina|vend|automat|robo/),
  veiculos:diz(/veicul|rodas|garag|oficina|carga|carroca|transport/),
  feudal:diz(/palacio|trono|nobre|fundador|casa de|vaelkor|lorde|dama|corte/),
  celas:diz(/cela|prision|custodia|deten|transfer/),
  tiro:diz(/tiro|alvo|estande|pontaria/),
  seed:hash(String(c.id||c.nome||'cena'))};
}
export const TAMANHO_MODELO={mercado:[84,42],praca:[56,28],tribunal:[56,28],rua:[56,28],taverna:[28,14],bar:[42,21],clinica:[42,21],arquivo:[42,21],custodia:[42,21],palacio:[56,28],arena:[42,21],porto:[56,28],caverna:[56,28],floresta:[56,28],ermos:[56,28]};

// ---------------------------------------------------------------- peças
function pecas(ctx,estilo={}){
 const {f,els,occ,r}=ctx;
 const semObjeto=(x,y,w,h)=>{const {W,H}=ctx;if(x<0||y<0||x+w>W||y+h>H)return false;for(let j=Math.floor(y+.05);j<Math.ceil(y+h-.05);j++)for(let i=Math.floor(x+.05);i<Math.ceil(x+w-.05);i++)if(occ.g[j*W+i]===1)return false;return true;};
 const P={
  parede(x,y,w,h,cor=estilo.parede||'#3a3532',nome='Parede'){els.push(f.forma(x,y,w,h,{fill:cor,nome,bloq:true}));occ.marcar(x,y,w,h,3);}, // 3 = parede (móveis podem encostar)
  piso(x,y,w,h,cor,nome='Piso',o={}){els.push(f.forma(x,y,w,h,{fill:cor,nome,camada:1,material:'nenhum',...o}));},
  // sala com paredes e vãos de porta: portas=[{lado:'n'|'s'|'l'|'o',em:0..1,larg}]
  sala(x,y,w,h,{portas=[],cor,piso,E=.4,nomePiso='Piso'}={}){
   if(piso)P.piso(x,y,w,h,piso,nomePiso);
   const vaos=l=>portas.filter(p=>p.lado===l).map(p=>{const comp=(l==='n'||l==='s')?w:h,larg=p.larg||1.8,c=(p.em??.5)*comp;return [Math.max(0,c-larg/2),Math.min(comp,c+larg/2)];}).sort((a,b)=>a[0]-b[0]);
   const lado=(l,x0,y0,comp,hor)=>{let ini=0;for(const [a,b] of [...vaos(l),[comp,comp]]){if(a>ini+.05)hor?P.parede(x0+ini,y0,a-ini,E,cor):P.parede(x0,y0+ini,E,a-ini,cor);ini=Math.max(ini,b);}};
   lado('n',x,y,w,true);lado('s',x,y+h-E,w,true);lado('o',x,y,h,false);lado('l',x+w-E,y,h,false);
   for(const p of portas){if(!p.objeto)continue;const comp=(p.lado==='n'||p.lado==='s')?w:h,c=(p.em??.5)*comp;
    const cx=p.lado==='n'||p.lado==='s'?x+c:p.lado==='o'?x+E/2:x+w-E/2,cy=p.lado==='n'?y+E/2:p.lado==='s'?y+h-E/2:y+c;
    const e=objRef(ctx,p.objeto,cx,cy,{rot:p.lado==='o'||p.lado==='l'?90:0,nome:p.nome,reserva:0});if(e)occ.marcar(cx-1,cy-1,2,2,0);}
   return {x:x+E,y:y+E,w:w-2*E,h:h-2*E};
  },
  // mesa com cadeiras soltas em volta (cadeira camada 2, sentável)
  mesa(cx,cy,{mesa='pk_mesa_quadrada',cadeira='pk_cadeira_madeira',lados=4,nome}={}){
   const m=ctx.banco.get(mesa)||ctx.banco.get('pk_mesa_quadrada');if(!m)return false;const w=Number(m.larguraM)||1.4,h=Number(m.alturaM)||1.4;
   if(!occ.ok(cx-w/2-.8,cy-h/2-.8,w+1.6,h+1.6,0))return false;
   objRef(ctx,m.id,cx,cy,{nome});
   const pos=[[0,-(h/2+.42),180],[0,h/2+.42,0],[-(w/2+.42),0,90],[w/2+.42,0,-90]];
   const extra=w>2.2?[[-w/4,-(h/2+.42),180],[w/4,-(h/2+.42),180],[-w/4,h/2+.42,0],[w/4,h/2+.42,0]]:[];
   const lista=w>2.2?[...extra,pos[2],pos[3]]:pos.slice(0,lados);
   for(const [dx,dy,rot] of lista){const c=ctx.banco.get(cadeira);if(!c)break;const e=f.objeto(c,cx+dx,cy+dy,{rot});e.camada=2;e.bloqueiaMovimento=false;els.push(e);}
   occ.marcar(cx-w/2-.7,cy-h/2-.7,w+1.4,h+1.4);return true;
  },
  // objetos encostados numa parede da sala (lado n/s/l/o), espaçados
  encostar(sala,ids,n,lado='n',{passo=null,margem=.8,nome}={}){
   let k=0;const lista=ids.map(i=>ctx.banco.get(i)).filter(Boolean);if(!lista.length)return 0;
   const hor=lado==='n'||lado==='s',comp=hor?sala.w:sala.h,step=passo||((comp-2*margem)/Math.max(1,n));
   for(let i=0;i<n;i++){const m=lista[i%lista.length],w=Number(m.larguraM)||1,h=Number(m.alturaM)||1;
    const fw=hor?w:h,fh=hor?h:w,t=margem+step*(i+.5),cx=hor?sala.x+t:lado==='o'?sala.x+fw/2+.05:sala.x+sala.w-fw/2-.05,cy=hor?(lado==='n'?sala.y+fh/2+.05:sala.y+sala.h-fh/2-.05):sala.y+t;
    if(!semObjeto(cx-fw/2,cy-fh/2,fw,fh))continue; // encosta na parede: só não pode bater em outro móvel
    const rot=lado==='n'?0:lado==='s'?180:lado==='o'?270:90;const e=f.objeto(m,cx,cy,{rot});if(nome){e.nome=nome;e.name=nome;}els.push(e);occ.marcar(cx-fw/2,cy-fh/2,fw,fh);k++;}
   return k;
  },
  poste(x,y){const m=ctx.banco.get('pk_poste_luz')||ctx.banco.get('pk_luminaria');if(!m)return;const e=f.objeto(m,x,y);e.camada=4;e.bloqueiaMovimento=false;e.nome='Poste de luz';e.name='Poste de luz';els.push(e);},
  // telhado/lona que cobre um lugar enterável (some quando um jogador entra): modelo esticado ou forma
  telhado(x,y,w,h,{modelo='telhado1',nome='Telhado',cor='#7a4a3a'}={}){
   const m=ctx.banco.get(modelo);let e;
   if(m){e=f.objeto(m,x+w/2,y+h/2);e.x=+x.toFixed(2);e.y=+y.toFixed(2);e.w=+w.toFixed(2);e.h=+h.toFixed(2);}
   else e=f.forma(x,y,w,h,{fill:cor,nome:'Telhado',camada:5,material:'nenhum'});
   Object.assign(e,{nome:'Telhado · '+nome,name:'Telhado · '+nome,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,locked:true,tetoV139:true});els.push(e);
  },
  escada(cx,cy,nome,{rot=0}={}){const m=ctx.banco.get('pk_escada');if(!m)return null;const e=f.objeto(m,cx,cy,{rot});Object.assign(e,{nome,name:nome,camada:1,bloqueiaMovimento:false});els.push(e);return e;},
  espalhar:(ids,n,area,folga=.3)=>ctx.espalhar(ids.map(i=>ctx.banco.get(i)).filter(Boolean),n,{area,folga}),
  pessoas:[]
 };
 return P;
}
const pessoa=(P,x,y,papel,npcId=null)=>P.pessoas.push({x:+x.toFixed(2),y:+y.toFixed(2),papel,npcId});

// ---------------------------------------------------------------- modelos
function bordaDeCidade(ctx,P,{coberto,cor='#8a6a4a'}={}){
 const {W,H,r}=ctx;
 if(coberto){ // paredões de rocha em volta (feira dentro da pedra)
  for(const [x,y,w,h] of [[0,0,W,2.2],[0,H-2.2,W,2.2],[0,0,2.2,H],[W-2.2,0,2.2,H]])P.parede(x,y,w,h,'#5e4a3a','Rocha');
  return {x:2.2,y:2.2,w:W-4.4,h:H-4.4};
 }
 // fachadas de prédios no alto e embaixo, com vãos de rua
 for(const yy of [0,H-4]){let x=0;while(x<W-2){const w=5+r()*7;if(x+w>W)break;if(r()<.22){x+=3;continue;}P.parede(x,yy,w,4,escolher(r,['#a8784a','#8a6a4a','#b08a5a','#9a8a6a']),'Prédio');x+=w+.3;}}
 return {x:0,y:4.4,w:W,h:H-8.8};
}
function modeloMercado(c,ctx,P,k){
 const {W,H,r}=ctx,area=bordaDeCidade(ctx,P,{coberto:k.coberto});
 const tendas=['pk_barraca_rubra','pk_barraca_anil','pk_barraca_acafrao'];
 // fileiras de barracas com corredores de 3 m
 const linhas=[area.y+4,area.y+10.5,area.y+area.h-10.5,area.y+area.h-4];
 for(const [li,y] of linhas.entries())for(let x=area.x+5;x<area.x+area.w-4;x+=5.2){
  if(x>W*.38&&x<W*.62&&(li===1||li===2))continue; // praça de comida no meio
  if(objRef(ctx,tendas[(li+Math.round(x))%3],x,y)){if(r()<.55)objRef(ctx,escolher(r,['pk_barril','caixa_madeira','pk_caixote_suprimentos','caixa1']),x+(r()<.5?-2.1:2.1),y+(li%2?-1.6:1.6));pessoa(P,x,y+(li%2?-2.3:2.3),'vendedor');}}
 // praça de comida: tenda grande com bancas de panelas e mesas (com telhado que abre)
 const tx=W*.38+1,ty=area.y+7.5,tw=W*.24-2,th=area.h-15;
 P.piso(tx,ty,tw,th,'#c9a87a','Chão batido da tenda');
 for(let i=0;i<3;i++)objRef(ctx,'pk_banca_panelas',tx+2.5+i*(tw-5)/2,ty+1.6,{nome:'Banca de panelas'});
 for(let i=0;i<3;i++)pessoa(P,tx+2.5+i*(tw-5)/2,ty+3,'cozinheiro');
 for(const fx of [.2,.5,.8])for(const fy of [.55,.85])P.mesa(tx+tw*fx,ty+th*fy,{mesa:fx===.5?'pk_mesa_redonda_bar':'pk_mesa_quadrada'});
 P.telhado(tx-.3,ty-.3,tw+.6,th+.6,{modelo:'pk_barraca_acafrao',nome:k.comida?'Tenda das panelas':'Tenda da feira'});
 // máquinas de venda encostadas nas fachadas/paredões
 const maq=['pk_maquina_venda','pk_maquina_venda_anil'];
 for(let i=0;i<(k.maquinas?8:5);i++){const x=area.x+3+i*(area.w-6)/(k.maquinas?8:5),y=area.y+.6;const e=objRef(ctx,maq[i%2],x,y,{nome:'Máquina de venda'});if(!e)continue;}
 for(let i=0;i<4;i++){const x=area.x+6+i*(area.w-12)/4,y=area.y+area.h-.6;objRef(ctx,maq[(i+1)%2],x,y,{rot:180,nome:'Máquina de venda'});}
 // postes nos corredores e bancos para sentar
 for(let x=area.x+3;x<area.x+area.w;x+=10){P.poste(x,area.y+7.2);P.poste(x+5,area.y+area.h-7.2);}
 for(let i=0;i<6;i++)objRef(ctx,'pk_banco_praca',area.x+8+i*(area.w-16)/6,H/2+(i%2?1.2:-1.2));
 for(let i=0;i<8;i++)pessoa(P,area.x+6+r()*(area.w-12),area.y+6+r()*(area.h-12),'morador');
 if(k.veiculos)for(const [id,x,y] of [['pk_vei_carroca',area.x+3,H/2],['pk_vei_cargueiro',area.x+area.w-5,H/2]])objRef(ctx,id,x,y);
 return {bg:k.coberto?'#6a5a48':'#b8a48a',texture:k.coberto?'caverna':'calcamento'};
}
function modeloPraca(c,ctx,P,k,tribunal=false){
 const {W,H,r}=ctx,area=bordaDeCidade(ctx,P,{});
 const cx=W/2,cy=H/2;
 P.piso(cx-11,cy-8,22,16,'#c9b98f','Calçada da praça',{radius:4});
 if(tribunal){
  P.piso(cx-4,area.y+1,8,4,'#7a1a24','Tribuna',{});objRef(ctx,'pk_feu_trono',cx,area.y+2.6,{nome:'Cadeira do juiz'});objRef(ctx,'pk_feu_estandarte',cx-3.2,area.y+1.4);objRef(ctx,'pk_feu_estandarte',cx+3.2,area.y+1.4);
  for(let row=0;row<4;row++)for(const s of [-1,1]){const e=objRef(ctx,'pk_banco_praca',cx+s*4.5,area.y+8+row*2.4,{nome:'Banco da plateia'});}
  pessoa(P,cx,area.y+4,'juiz');
 }else{objRef(ctx,'pk_fonte_praca',cx,cy);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;objRef(ctx,'pk_banco_praca',cx+Math.cos(a)*6.2,cy+Math.sin(a)*4.6,{rot:Math.round(a*180/Math.PI+90)});}}
 for(const [x,y] of [[cx-10,cy-7],[cx+10,cy-7],[cx-10,cy+7],[cx+10,cy+7]])objRef(ctx,escolher(r,['pk_arvore_florida','arvre3','avre4','pk_arvore_alienigena']),x,y,{escala:.7});
 for(let x=4;x<W;x+=9){P.poste(x,area.y+1.2);P.poste(x+4.5,area.y+area.h-1.2);}
 // loja/café enterável com telhado (canto)
 const lx=3,ly=area.y+area.h-11,lw=12,lh=9;const s=P.sala(lx,ly,lw,lh,{portas:[{lado:'n',em:.5,larg:2}],piso:'#e6d6b0',cor:'#6a5040'});
 P.encostar(s,['pk_balcao_v139','mesa4'],1,'s');P.mesa(lx+3.5,ly+3.5,{mesa:'pk_mesa_redonda_bar'});P.mesa(lx+8.3,ly+3.5,{mesa:'pk_mesa_redonda_bar'});
 P.encostar(s,['pk_fut_armario'],1,'l');pessoa(P,lx+6,ly+lh-2.4,'atendente');
 P.telhado(lx,ly,lw,lh,{modelo:'telhado1',nome:'Café da praça'});
 // barracas e máquinas
 for(let i=0;i<3;i++){const x=W-14+i*4.2,y=area.y+area.h-3.5;if(objRef(ctx,['pk_barraca_rubra','pk_barraca_anil','pk_barraca_acafrao'][i],x,y))pessoa(P,x,y-2.3,'vendedor');}
 objRef(ctx,'pk_maquina_venda',W-3,area.y+1,{nome:'Máquina de venda'});objRef(ctx,'pk_maquina_venda_anil',W-4.4,area.y+1,{nome:'Máquina de venda'});
 for(let i=0;i<6;i++)pessoa(P,cx-9+r()*18,cy-6+r()*12,'morador');
 if(k.veiculos)for(const [id,x,y] of [['pk_vei_cargueiro',8,area.y+4],['pk_vei_aerocarro_turquesa',W-8,area.y+4],['pk_vei_carroca',W-16,area.y+4]])objRef(ctx,id,x,y);
 return {bg:'#b8a890',texture:'calcamento'};
}
function modeloRua(c,ctx,P,k){
 const {W,H,r}=ctx;
 const st=gerarMapa({tipo:'cidade',largura:W,altura:H,objetos:[...ctx.banco.values()],nome:c.nome||'',semente:k.seed+7});
 ctx.els.push(...st.elements);
 // postes dos dois lados da rua e uma loja enterável
 for(let x=3;x<W;x+=8){P.poste(x,H*.5-2.6);P.poste(x+4,H*.5+2.6);}
 for(let i=0;i<4;i++)pessoa(P,4+r()*(W-8),H*.5+(r()-.5)*3,'morador');
 return {bg:st.bg,texture:st.texture};
}
function modeloBar(c,ctx,P,k){
 const {W,H}=ctx;const s=P.sala(0,0,W,H,{portas:[{lado:'s',em:.2,larg:2}],piso:'#e6d6b0',cor:'#2f5a5a'});
 objRef(ctx,'mesa4',W/2,s.y+1.4,{nome:'Balcão do bar'});P.encostar(s,['pk_retro_radio','pk_fut_armario'],2,'n',{margem:2});
 for(let i=0;i<5;i++){const e=objRef(ctx,'pk_cadeira_estofada',W/2-4+i*2,s.y+3,{nome:'Banqueta'});if(e){e.camada=2;e.bloqueiaMovimento=false;}}
 for(const [fx,fy] of [[.2,.5],[.4,.6],[.6,.5],[.8,.6],[.3,.85],[.7,.85]])P.mesa(W*fx,H*fy,{mesa:fx===.4||fx===.6?'pk_mesa_redonda_bar':'pk_mesa_quadrada'});
 P.encostar(s,['pk_retro_sofa'],2,'l');P.encostar(s,['pk_fut_armario'],1,'o',{nome:'Armário'});
 for(let x=4;x<W;x+=9)objRef(ctx,'pk_retro_luminaria',x,s.y+.9);
 pessoa(P,W/2,s.y+2.2,'atendente');for(let i=0;i<4;i++)pessoa(P,6+i*8,H*.72,'freguês');
 return {bg:'#6a5a46',texture:'lajotas'};
}
function modeloClinica(c,ctx,P,k){
 const {W,H}=ctx,E=.4;
 const rec=P.sala(0,0,16,H,{portas:[{lado:'s',em:.5,larg:2},{lado:'l',em:.3,larg:1.6,objeto:'pk_fut_porta',nome:'Porta da enfermaria'},{lado:'l',em:.8,larg:1.6}],piso:'#e8eef0',cor:'#5a6a74'});
 P.encostar(rec,['pk_cadeira_estofada'],6,'o',{nome:'Cadeira de espera'});objRef(ctx,'pk_terminal',8,3,{nome:'Balcão da recepção'});pessoa(P,8,4.6,'atendente');
 P.encostar(rec,['pk_fut_armario'],1,'n',{margem:9,nome:'Armário de remédios'});
 const enf=P.sala(16-E,0,W-16+E,H*.55,{portas:[{lado:'o',em:.3,larg:1.6}],piso:'#dfe8ea',cor:'#5a6a74'});
 for(let i=0;i<4;i++)objRef(ctx,'pk_cama_solteiro',enf.x+2+i*5,enf.y+1.6,{nome:'Leito hospitalar'});
 P.encostar(enf,['pk_fut_armario'],1,'s',{margem:enf.w-4,nome:'Armário de suprimentos médicos'});pessoa(P,enf.x+enf.w/2,enf.y+enf.h-2,'médico','dra_ilya_nemer');
 const cap=P.sala(16-E,H*.55-E,W-16+E,H*.45+E,{portas:[{lado:'o',em:.5,larg:1.6}],piso:'#d0e4e0',cor:'#5a6a74'});
 for(let i=0;i<4;i++)objRef(ctx,'pk_fut_capsula_med',cap.x+2+i*4.6,cap.y+cap.h/2,{rot:0,nome:'Cápsula de recuperação '+(i+1)});
 P.encostar(cap,['pk_fut_console'],1,'l');
 return {bg:'#c9d4d8',texture:'chao_metal'};
}
function modeloArquivo(c,ctx,P,k,celas=false){
 const {W,H}=ctx,E=.4;
 const hall=P.sala(0,0,W*.5,H,{portas:[{lado:'s',em:.5,larg:2},{lado:'l',em:.25,larg:1.6},{lado:'l',em:.75,larg:1.6}],piso:'#d9cdb0',cor:'#4a3e34'});
 P.encostar(hall,['pk_estante_arquivo'],5,'n');P.encostar(hall,['pk_estante_arquivo'],3,'o');
 for(const [fx,fy] of [[.3,.45],[.7,.45],[.5,.75]])P.mesa(W*.5*fx,H*fy,{mesa:'pk_mesa_longa',cadeira:'pk_cadeira_estofada'});
 objRef(ctx,'pk_terminal',W*.25,H-3,{nome:'Terminal de consulta'});pessoa(P,W*.25,H-4.4,'atendente');
 if(celas){ // custódia: celas com porta trancável
  const cw=(W*.5)/3;for(let i=0;i<3;i++){const s=P.sala(W*.5-E+i*cw,0,cw+E,H*.45,{portas:[{lado:'s',em:.5,larg:1.4,objeto:'pk_fut_porta',nome:'Porta da cela '+(i+1)}],piso:'#9a9a9a',cor:'#3a3e44'});objRef(ctx,'pk_cama_solteiro',s.x+s.w/2,s.y+1.4,{nome:'Catre da cela'});}
  const s2=P.sala(W*.5-E,H*.45-E,W*.5+E,H*.55+E,{portas:[{lado:'o',em:.5,larg:1.6}],piso:'#c9c0a8',cor:'#3a3e44'});P.mesa(s2.x+s2.w/2,s2.y+s2.h/2,{mesa:'pk_mesa_longa',cadeira:'pk_cadeira_estofada'});P.encostar(s2,['pk_fut_armario'],2,'l',{nome:'Armário de pertences'});pessoa(P,s2.x+4,s2.y+3,'guarda');
 }else{
  const s=P.sala(W*.5-E,0,W*.5+E,H,{portas:[{lado:'o',em:.25,larg:1.6},{lado:'o',em:.75,larg:1.6}],piso:'#cfc3a6',cor:'#4a3e34'});
  P.encostar(s,['pk_estante_arquivo'],5,'n');P.encostar(s,['pk_estante_arquivo'],5,'s');P.encostar(s,['pk_fut_armario','pk_feu_bau'],2,'l',{nome:'Arquivo trancado'});
  P.mesa(s.x+s.w/2,s.y+s.h/2,{mesa:'pk_mesa_longa',cadeira:'pk_cadeira_estofada'});
 }
 return {bg:'#cfc3a6',texture:'assoalho'};
}
function modeloPalacio(c,ctx,P,k){
 const {W,H,r}=ctx,E=.4;
 const salao=P.sala(0,0,W*.62,H,{portas:[{lado:'s',em:.5,larg:3},{lado:'l',em:.3,larg:1.8},{lado:'l',em:.75,larg:1.8}],piso:'#4a3a3e',cor:'#3a2a30'});
 P.piso(W*.31-1.5,2,3,H-4,'#6a1a24','Passadeira carmim');
 objRef(ctx,'pk_feu_trono',W*.31,2.4,{nome:'Trono'});
 P.mesa(W*.31,H*.55,{mesa:'pk_feu_mesa',cadeira:'pk_cadeira_estofada'});
 P.encostar(salao,['pk_feu_estandarte','pk_feu_braseiro'],6,'o');P.encostar(salao,['pk_feu_estandarte','pk_feu_braseiro'],6,'l');
 P.encostar(salao,['pk_feu_armadura'],4,'n',{margem:3});
 const q=P.sala(W*.62-E,0,W*.38+E,H*.5,{portas:[{lado:'o',em:.6,larg:1.8}],piso:'#3a2e34',cor:'#3a2a30'});
 objRef(ctx,'camacasal2',q.x+q.w/2,q.y+2,{nome:'Cama'});P.encostar(q,['pk_feu_bau'],2,'s',{nome:'Baú brasonado'});P.encostar(q,['pk_fut_armario'],1,'l',{nome:'Guarda-roupa'});
 const s=P.sala(W*.62-E,H*.5-E,W*.38+E,H*.5+E,{portas:[{lado:'o',em:.4,larg:1.8}],piso:'#3a2e34',cor:'#3a2a30'});
 P.mesa(s.x+s.w/2,s.y+s.h/2,{mesa:'pk_mesa_longa',cadeira:'pk_cadeira_estofada'});P.encostar(s,['pk_estante_arquivo'],2,'l');
 pessoa(P,W*.31,4.2,'nobre');for(let i=0;i<3;i++)pessoa(P,6+i*8,H-4,'guarda');
 return {bg:'#2c2630',texture:'ruinas'};
}
function modeloArena(c,ctx,P,k){
 const st=gerarMapa({tipo:'arena',largura:ctx.W,altura:ctx.H,objetos:[...ctx.banco.values()],nome:c.nome||'',variante:k.tiro?'tiro':'',semente:k.seed+7});
 ctx.els.push(...st.elements);
 for(let x=4;x<ctx.W-2;x+=8){ctx.occ.marcar(0,0,ctx.W,3);P.poste(x,3.4);}
 for(let i=0;i<5;i++)pessoa(P,4+i*8,ctx.H-4,'espectador');
 return {bg:st.bg,texture:st.texture};
}
function modeloNatureza(c,ctx,k,tipo){
 const st=gerarMapa({tipo,largura:ctx.W,altura:ctx.H,objetos:[...ctx.banco.values()],nome:c.nome||'',semente:k.seed+7});
 if(tipo==='ermos'){ctx.els.push(...st.elements);areiaDoDeserto(ctx,{dunas:5,veios:6});return {bg:'#e2d4b4',texture:'areia'};}
 ctx.els.push(...st.elements);return {bg:st.bg,texture:st.texture};
}
function modeloPorto(c,ctx,P,k){
 const {W,H}=ctx;
 for(const [x,y] of [[12,13],[32,13]])objRef(ctx,'pk_plataforma_pouso',x,y,{escala:.55,reserva:2});
 objRef(ctx,'pk_nave_cargueiro_ferrugem',12,13,{escala:.65});objRef(ctx,'pk_nave_disco',32,13,{escala:.9});
 const s=P.sala(44,4,11,14,{portas:[{lado:'o',em:.5,larg:2}],piso:'#d9cdb0',cor:'#6a5a46'});
 P.encostar(s,['pk_cadeira_estofada'],5,'l',{nome:'Cadeira de espera'});objRef(ctx,'pk_terminal',49,6.5,{nome:'Guichê do porto'});pessoa(P,49,8,'atendente');
 P.telhado(44,4,11,14,{modelo:'telhado2',nome:'Terminal do porto'});
 objRef(ctx,'pk_torre_controle',50,23);for(let x=4;x<W-12;x+=8)P.poste(x,25.5);
 for(const [id,x,y] of [['pk_vei_aerocarro_creme',40,22],['pk_vei_cargueiro',22,25]])objRef(ctx,id,x,y);
 for(let i=0;i<4;i++)pessoa(P,6+i*9,24,'morador');
 return {bg:'#d9d0b8',texture:'areia'};
}
// A Última Bateria em dois andares: térreo (salão, balcão, cozinha) e, no mesmo mapa, o andar de cima com 6 quartos-cápsula.
// v144: andares de verdade — o andar de cima fica POR CIMA do térreo (mesma área do mapa). Escada na lateral esquerda.
// Quem está no térreo não vê o andar de cima; quem sobe só vê o andar de cima (que cobre o térreo) e o vão da escada.
export function marcarAndar(els,desde,andar,extra={}){for(let i=desde;i<els.length;i++)Object.assign(els[i],{andarV144:andar},extra);}
function modeloTaverna(c,ctx,P,k){
 // v146: A Última Bateria em 28×14 m (mapa menor = tudo aparece maior). Escada larga na vertical, encostada na parede
 // esquerda (sobe para o norte); térreo com piso de ladrilhos; andar de cima por cima, com placas de metal, cápsulas
 // individuais e dois dormitórios com beliches de verdade.
 const {W,H,f,els}=ctx,E=.4,EX=.7,EW=2.4,EY0=4,EH=6; // escada: x EX..EX+EW, y EY0..EY0+EH
 const piso=(id,nome)=>{for(let x=0;x<W;x+=7)for(let y=0;y<H;y+=7){const e=objRef(ctx,id,x+3.5,y+3.5,{nome,reserva:0});if(e){e.camada=1;e.bloqueiaMovimento=false;e.locked=true;}}};
 // ---------------- térreo (andar 1)
 P.sala(0,0,W,H,{portas:[{lado:'s',em:.5,larg:2.2,nome:'Porta de entrada'}],piso:'#e6d6b0',cor:'#2f5a5a'});
 piso(ctx.banco.get('pk_ladrilhos_retro2')?'pk_ladrilhos_retro2':'pk_ladrilhos_retro','Piso de ladrilhos');
 ctx.occ.marcar(EX-.3,EY0-1.4,EW+1.6,EH+2.8); // escada e os dois pés dela livres
 els.push(f.forma(6.5,.45,11,.7,{fill:'#5a3a2a',nome:'Prateleira de bebidas',bloq:true,material:'madeira'}));ctx.occ.marcar(6.5,.4,11,.8);
 els.push(f.forma(6.5,2.2,11,.9,{fill:'#2a9a9a',nome:'Balcão do bar',bloq:true,material:'metal'}));ctx.occ.marcar(6.5,2.2,11,.9);
 objRef(ctx,'pk_fut_console',17,1.6,{nome:'Caixa registradora de UR-17'});objRef(ctx,'pk_fut_neon',12,.6,{reserva:0});
 for(let i=0;i<5;i++){const e=objRef(ctx,'pk_cadeira_estofada',7.8+i*2.1,3.75,{nome:'Banqueta',reserva:0});if(e){e.camada=2;e.bloqueiaMovimento=false;}}
 pessoa(P,12,1.6,'atendente','ur17');
 // cozinha (nordeste)
 const coz=P.sala(W-7.5,0,7.5,5.4,{portas:[{lado:'s',em:.35,larg:1.4,objeto:'pk_fut_porta',nome:'Porta da cozinha'}],piso:'#c9c0a8',cor:'#2f5a5a'});
 P.encostar(coz,['pk_fut_armario'],1,'n',{nome:'Armário de suprimentos'});objRef(ctx,'pk_banca_panelas',coz.x+coz.w-1.3,coz.y+coz.h/2+.3,{rot:90,nome:'Fogão da cozinha'});
 // banheiro unissex (sudeste)
 const ban=P.sala(W-5,H-4.6,5,4.6,{portas:[{lado:'o',em:.55,larg:1.2,objeto:'pk_fut_porta',nome:'Porta do banheiro (unissex)'}],piso:'#dfe8ea',cor:'#2f5a5a'});
 els.push(f.forma(ban.x+ban.w-.75,ban.y+.3,.6,1.4,{fill:'#eef2f4',nome:'Pia',bloq:true,material:'pedra',radius:.2}));
 els.push(f.forma(ban.x+ban.w-.9,ban.y+ban.h-1,.75,.75,{fill:'#f6f8fa',nome:'Vaso sanitário',bloq:true,kind:'circulo',material:'pedra'}));
 els.push(f.forma(ban.x+.3,ban.y+ban.h-.35,2,.2,{fill:'#9ab',nome:'Espelho',camada:2,material:'vidro'}));
 // mesas do salão
 for(const [x,y,m] of [[9,7.4,'pk_mesa_redonda_bar'],[14.5,7.4,'pk_mesa_redonda_bar'],[9,11.3,'pk_mesa_quadrada'],[18.5,10.6,'pk_mesa_quadrada']])P.mesa(x,y,{mesa:m,cadeira:'pk_retro_poltrona'});
 objRef(ctx,'pk_retro_radio',W-1,7.2,{rot:90,nome:'Jukebox'});
 for(const x of [7,13,19])objRef(ctx,'pk_retro_luminaria',x,5.2,{reserva:0});
 // escada: um objeto só, larga, na vertical; embaixo sai no térreo (pé sul), em cima sai no patamar (pé norte)
 const mEsc=ctx.banco.get('pk_escada_interna')?'pk_escada_interna':'pk_escada';
 const esc=objRef(ctx,mEsc,EX+EW/2,EY0+EH/2,{rot:mEsc==='pk_escada'?90:0,escala:mEsc==='pk_escada'?2:1,nome:'Escada para os dormitórios',reserva:0});
 if(esc)Object.assign(esc,{escadaAndarV144:true,andarAmbosV144:true,camada:2,bloqueiaMovimento:false,saidaAndarV144:{1:{x:(EX+EW/2)*28/W,y:(EY0+EH+.8)*14/H},2:{x:(EX+EW/2)*28/W,y:(EY0-.8)*14/H}}});
 // ---------------- andar de cima (andar 2): cobre o térreo inteiro, menos o vão da escada
 const desde=els.length,ctx2={...ctx,occ:grade(W,H)},P2=pecas(ctx2,{});
 P2.piso(0,0,W,H,'#3a4450','Andar de cima · piso metálico');els[els.length-1].pisoAndarV144=2;
 piso('pk_ladrilhos_metal','Andar de cima · placas de metal');
 P2.sala(0,0,W,H,{piso:null,cor:'#2f5a5a'});
 ctx2.occ.marcar(EX-.3,EY0-1.4,EW+1.2,EH+1.4);
 // guarda-corpo em volta do vão (fechado ao sul; abre ao norte, no patamar)
 P2.parede(EX+EW+.05,EY0+1,.2,EH-1,'#8a96a0','Guarda-corpo');P2.parede(EX,EY0+EH,EW+.25,.2,'#8a96a0','Guarda-corpo');
 const X=EX+EW+.9,CW=W-X-E,CY0=5.6,CY1=8.4,cw=CW/6; // corredor
 P2.piso(X-.9,CY0,CW+.9,CY1-CY0,'#2e3640','Corredor dos dormitórios',{opacity:.55});
 const porta=(x0,py,larg,nome)=>{const pw=1.3,px=x0+larg/2;P2.parede(x0,py,px-pw/2-x0,.35,'#2f5a5a');P2.parede(px+pw/2,py,x0+larg-(px+pw/2),.35,'#2f5a5a');objRef(ctx2,'pk_fut_porta',px,py+.17,{rot:0,nome,reserva:0});};
 // norte: 6 cápsulas individuais
 for(let i=0;i<6;i++){const x0=X+i*cw,y0=E,h=CY0-E;if(i<5)P2.parede(x0+cw-.15,y0,.3,h,'#2f5a5a');porta(x0,CY0-.35,cw,'Porta da cápsula '+(i+1));
  objRef(ctx2,'pk_fut_capsula',x0+cw/2,y0+h/2-.45,{rot:90,nome:'Cápsula de aluguel '+(i+1)});}
 P2.parede(X-.15,E,.3,CY0-E,'#2f5a5a');P2.parede(X-.15,CY1,.3,H-E-CY1,'#2f5a5a');
 // sul: cápsulas 7 e 8 e os dormitórios coletivos A e B (beliches)
 const ys=CY1,hs=H-E-ys;
 for(let i=0;i<2;i++){const x0=X+i*cw;P2.parede(x0+cw-.15,ys,.3,hs,'#2f5a5a');porta(x0,ys,cw,'Porta da cápsula '+(i+7));
  objRef(ctx2,'pk_fut_capsula',x0+cw/2,ys+hs/2+.45,{rot:90,nome:'Cápsula de aluguel '+(i+7)});}
 for(const [kk,L] of [[0,'A'],[1,'B']]){const x0=X+2*cw+kk*2*cw,w=2*cw;if(kk===0)P2.parede(x0+w-.15,ys,.3,hs,'#2f5a5a');porta(x0,ys,w,'Porta do dormitório '+L);
  for(let b=0;b<3;b++){const bx=x0+1+b*(w-2.6)/2,by=ys+hs-1.35;
   const e=objRef(ctx2,'pk_beliche',bx,by,{rot:0,nome:`Beliche ${L}${b+1} (de cima e de baixo)`,reserva:0})||objRef(ctx2,'pk_cama_solteiro',bx,by,{nome:`Beliche ${L}${b+1}`,reserva:0});}
  objRef(ctx2,'pk_fut_armario',x0+1.6,ys+.75,{rot:0,nome:'Armários dos hóspedes '+L,reserva:0});}
 for(const x of [X+cw,X+3*cw,X+5*cw])objRef(ctx2,'pk_fut_neon',x,CY0+.25,{nome:'Luz neon',reserva:0});
 marcarAndar(els,desde,2);
 if(esc){esc.andarV144=1;}
 return {bg:'#6a5a46',texture:'lajotas',tavernaV132:true,andaresV144:true,ultimaBateriaV146:true};
}

// Nave do grupo por dentro (para o espaço-porto): casco com paredes, cabine, área comum, beliches, porão e rampa; o casco por cima vira telhado.
// v141: interior de qualquer nave do pacote (cargueiro, transporte, disco, caça); o casco vira telhado que abre.
export function interiorDeNave(ctx,modeloId,cx,cy,{escala=1,nome=''}={}){
 if(modeloId==='pk_nave_grupo')return naveComInterior(ctx,cx,cy,{escala});
 const P=pecas(ctx,{parede:'#5a6068'}),m=ctx.banco.get(modeloId);if(!m)return null;
 const forma=m.forma||'cargueiro',L=(Number(m.larguraM)||20)*escala,E=(Number(m.alturaM)||12)*escala,x0=cx-L/2,y0=cy-E/2,rotulo=nome||String(m.nome||'Nave');
 const banco=(x,y,n='Assento')=>{const e=objRef(ctx,'pk_cadeira_estofada',x,y,{nome:n,reserva:0});if(e){e.camada=2;e.bloqueiaMovimento=false;}};
 let caixa;
 if(forma==='transporte'){
  caixa=P.sala(x0+L*.1,y0+E*.22,L*.78,E*.56,{portas:[{lado:'s',em:.5,larg:2,objeto:'pk_fut_porta',nome:'Porta do '+rotulo}],cor:'#4a5058',piso:'#6a7078',nomePiso:'Piso da nave'});
  for(let i=0;i<8;i++)for(const dy of [-1.3,1.3]){if(i===4&&dy>0)continue;banco(caixa.x+1.5+i*(caixa.w-4)/8,caixa.y+caixa.h/2+dy,'Poltrona de passageiro');}
  objRef(ctx,'pk_fut_console',caixa.x+caixa.w-1,caixa.y+caixa.h/2,{nome:'Console de pilotagem'});banco(caixa.x+caixa.w-2.2,caixa.y+caixa.h/2,'Assento do piloto');
 }else if(forma==='disco'){
  const R=Math.min(L,E)*.34;caixa=P.sala(cx-R,cy-R,2*R,2*R,{portas:[{lado:'s',em:.5,larg:1.8,objeto:'pk_fut_porta',nome:'Escotilha do '+rotulo}],cor:'#4a5058',piso:'#6a7078',nomePiso:'Piso da nave'});
  objRef(ctx,'pk_fut_console',cx,cy,{nome:'Console central'});for(const [dx,dy] of [[-1.6,0],[1.6,0],[0,-1.6]])banco(cx+dx,cy+dy);
 }else if(forma==='caca'){
  caixa=P.sala(cx+L*.08,cy-E*.12,L*.26,E*.24,{portas:[{lado:'o',em:.5,larg:1.2,objeto:'pk_fut_porta',nome:'Cabine do '+rotulo}],cor:'#4a5058',piso:'#6a7078',nomePiso:'Piso da nave'});
  banco(caixa.x+caixa.w*.4,caixa.y+caixa.h/2,'Assento do piloto');objRef(ctx,'pk_fut_console',caixa.x+caixa.w*.8,caixa.y+caixa.h/2,{nome:'Console de pilotagem',reserva:0});
 }else{ // cargueiro
  const hx=x0+L*.08,hw=L*.86,hy=y0+E*.17,hh=E*.66;caixa=P.sala(hx,hy,hw,hh,{portas:[{lado:'o',em:.5,larg:2.2,objeto:'pk_fut_porta',nome:'Rampa do '+rotulo}],cor:'#4a5058',piso:'#6a5e54',nomePiso:'Piso da nave'});
  const c1=hx+hw*.45;P.parede(c1,hy,.3,hh*.35,'#4a5058');P.parede(c1,hy+hh*.35+1.6,.3,hh*.65-1.6,'#4a5058');
  for(let i=0;i<6;i++)objRef(ctx,escolher(ctx.r,['pk_caixote_suprimentos','caixa_madeira','pk_barril']),hx+1.2+(i%3)*1.5,hy+1.4+Math.floor(i/3)*(hh-2.8));
  objRef(ctx,'pk_fut_console',hx+hw-1.1,hy+hh/2,{nome:'Console de pilotagem'});banco(hx+hw-2.3,hy+hh/2-1);banco(hx+hw-2.3,hy+hh/2+1);
  objRef(ctx,'pk_cama_solteiro',c1+1.4,hy+1.3,{nome:'Beliche da nave'});
 }
 const e=ctx.f.objeto(m,cx,cy,{escala});Object.assign(e,{nome:'Telhado · '+rotulo,name:'Telhado · '+rotulo,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,locked:true,tetoV139:true});ctx.els.push(e);
 return caixa;
}
export function naveComInterior(ctx,cx,cy,{escala=.75}={}){
 const P=pecas(ctx,{parede:'#5a6068'}),m=ctx.banco.get('pk_nave_grupo');if(!m)return null;
 const L=(Number(m.larguraM)||24)*escala,E=(Number(m.alturaM)||14)*escala,x0=cx-L/2,y0=cy-E/2;
 const hx=x0+L*.08,hw=L*.86,hy=y0+E*.17,hh=E*.66;
 P.piso(hx,hy,hw,hh,'#5e646c','Piso da nave');
 const s=P.sala(hx,hy,hw,hh,{portas:[{lado:'o',em:.5,larg:2.2,objeto:'pk_fut_porta',nome:'Rampa da nave'}],cor:'#4a5058'});
 // divisórias: porão | área comum | beliches | cabine
 const c1=hx+hw*.28,c2=hx+hw*.55,c3=hx+hw*.78;
 for(const x of [c1,c2,c3]){P.parede(x,hy,.3,hh*.35,'#4a5058');P.parede(x,hy+hh*.35+1.6,.3,hh*.65-1.6,'#4a5058');}
 for(let i=0;i<4;i++)objRef(ctx,escolher(ctx.r,['pk_caixote_suprimentos','caixa_madeira','pk_barril']),hx+1.2+(i%2)*1.6,hy+1.4+Math.floor(i/2)*1.6);
 P.mesa((c1+c2)/2,hy+hh*.55,{mesa:'pk_mesa_quadrada',cadeira:'pk_cadeira_estofada'});
 objRef(ctx,'pk_fut_armario',(c1+c2)/2,hy+.75,{nome:'Armário da nave'});
 for(let i=0;i<2;i++){objRef(ctx,'pk_cama_solteiro',c2+.9+i*1.5,hy+1.4,{nome:'Beliche da nave'});objRef(ctx,'pk_cama_solteiro',c2+.9+i*1.5,hy+hh-1.4,{nome:'Beliche da nave'});}
 objRef(ctx,'pk_fut_console',c3+1.6,hy+hh/2,{nome:'Console de pilotagem'});
 for(const dy of [-1.2,1.2]){const e=objRef(ctx,'pk_cadeira_estofada',c3+.8,hy+hh/2+dy,{nome:'Assento do piloto',reserva:0});if(e){e.camada=2;e.bloqueiaMovimento=false;}}
 objRef(ctx,'pk_fut_console',hx+.9,hy+hh-1,{nome:'Painel do motor'});
 // casco como telhado (some quando alguém do grupo entra)
 const e=ctx.f.objeto(m,cx,cy,{escala});Object.assign(e,{nome:'Telhado · Nave do grupo',name:'Telhado · Nave do grupo',camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,locked:true,tetoV139:true});ctx.els.push(e);
 return {x:hx,y:hy,w:hw,h:hh};
}

// ---------------------------------------------------------------- API
export function gerarDoCenario(c={},{objetos=[]}={}){
 const k=classificarCenario(c),[W,H]=TAMANHO_MODELO[k.tipo]||[56,28];
 const ctx=novoCtx(W,H,k.seed,objetos);
 // balcão (se não houver no banco, usa a mesa4 "balcão")
 if(!ctx.banco.get('pk_balcao_v139')&&ctx.banco.get('mesa4'))ctx.banco.set('pk_balcao_v139',ctx.banco.get('mesa4'));
 const P=pecas(ctx,{});let extra={};
 switch(k.tipo){
  case 'mercado':extra=modeloMercado(c,ctx,P,k);break;
  case 'praca':extra=modeloPraca(c,ctx,P,k);break;
  case 'tribunal':extra=modeloPraca(c,ctx,P,k,true);break;
  case 'taverna':extra=modeloTaverna(c,ctx,P,k);break;
  case 'bar':extra=modeloBar(c,ctx,P,k);break;
  case 'clinica':extra=modeloClinica(c,ctx,P,k);break;
  case 'arquivo':extra=modeloArquivo(c,ctx,P,k,false);break;
  case 'custodia':extra=modeloArquivo(c,ctx,P,k,true);break;
  case 'palacio':extra=modeloPalacio(c,ctx,P,k);break;
  case 'arena':extra=modeloArena(c,ctx,P,k);break;
  case 'porto':extra=modeloPorto(c,ctx,P,k);break;
  case 'caverna':case 'floresta':case 'ermos':extra=modeloNatureza(c,ctx,k,k.tipo);break;
  default:extra=modeloRua(c,ctx,P,k);
 }
 if(k.noite&&['mercado','praca','rua'].includes(k.tipo))for(let i=0;i<8;i++)P.poste(4+ctx.r()*(W-8),4+ctx.r()*(H-8));
 const {tavernaV132,andaresV144,...resto}=extra;
 const st=estadoDe(ctx,c.nome||'Mapa',{bg:resto.bg,texture:resto.texture,marca:{cenarioV139:{tipo:k.tipo,cenario:String(c.id||'')},pessoasV139:P.pessoas,geradoV110:{tipo:k.tipo,semente:k.seed,variante:'cenario-v139'},...(tavernaV132?{tavernaV132:true}:{}),...(andaresV144?{andaresV144:true}:{})}});
 st.estiloV129=k.feudal?'feudal':['clinica','arquivo','custodia','porto'].includes(k.tipo)?'futurista':'retro';
 return st;
}

// v141: espaço-porto com TODAS as naves por dentro (casco = telhado que abre quando alguém do grupo entra).
export function gerarEspacoportoV141({objetos=[]}={},gerarEspacoporto){
 const st=gerarEspacoporto({objetos}),ctx=novoCtx(84,42,1391,objetos);
 const NAVES=new Set(['Nave do grupo','Cargueiro enferrujado','Saltador em disco','Caça estelar','Transporte de passageiros']);
 ctx.els.push(...st.elements.filter(e=>!NAVES.has(e.nome)));
 interiorDeNave(ctx,'pk_nave_grupo',14,11,{escala:.75});
 interiorDeNave(ctx,'pk_nave_cargueiro_ferrugem',38,11,{escala:.75,nome:'Cargueiro enferrujado'});
 interiorDeNave(ctx,'pk_nave_disco',14,31,{escala:1.1,nome:'Saltador em disco'});
 interiorDeNave(ctx,'pk_nave_caca',38,31,{escala:1,nome:'Caça estelar'});
 interiorDeNave(ctx,'pk_nave_transporte',66,37,{escala:.55,nome:'Transporte de passageiros'});
 st.elements=ctx.els;st.navesV141=true;return st;
}
export {pecas,pessoa};
