// Mesa Estelar v203 — "🌿 Mapa de teste": cria um mapa novo (vale com floresta, lagos, pântano, lava, cordilheira com rampas, caverna natural, ruínas com torre de dois andares,
// acampamento e um calabouço pequeno com portas, celas, alavanca e armadilhas), põe criaturas em ecossistema (presas, predadores, sanguinários) e 3 NPCs (um é do mestre).
// Usa as MESMAS ferramentas do Editor rápido (formas orgânicas, paredes que barram movimento e visão, escadas e rampas entre andares). Só o mestre usa. Cria um mapa NOVO.
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
const NOME_MAPA='🌿 Ecossistema (teste)';
const W=80,H=50;

/** gerador pseudo-aleatório com semente (o mesmo mapa sempre sai igual) */
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
const hash2=(x,y,k=0)=>{const t=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return t-Math.floor(t);};
/** ruído suave 2D (0..1) */
const ruido=(x,y,k=0)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=hash2(xi,yi,k),b=hash2(xi+1,yi,k),c=hash2(xi,yi+1,k),d=hash2(xi+1,yi+1,k);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
const ruido2=(x,y,k=0)=>ruido(x,y,k)*.65+ruido(x*2.3,y*2.3,k+5)*.35;
const dentroElipse=(x,y,e,m=0)=>((x-e.x)/(e.rx+m))**2+((y-e.y)/(e.ry+m))**2<=1;
const dentroRet=(x,y,r,m=0)=>x>=r.x-m&&x<=r.x+r.w+m&&y>=r.y-m&&y<=r.y+r.h+m;
/** mancha orgânica: células de uma elipse com a borda balançada pelo ruído */
function mancha(e,k,irr=.35){const c=[];for(let y=Math.floor(e.y-e.ry*1.4);y<=Math.ceil(e.y+e.ry*1.4);y++)for(let x=Math.floor(e.x-e.rx*1.4);x<=Math.ceil(e.x+e.rx*1.4);x++){const d=Math.hypot((x+.5-e.x)/e.rx,(y+.5-e.y)/e.ry),lim=1+(ruido2(x*.35,y*.35,k)-.5)*irr*2;if(d<=lim&&x>=0&&y>=0&&x<W&&y<H)c.push([x,y]);}return c;}
/** trilha: células perto de uma poligonal, com largura que varia */
function trilha(pts,larg,k,irr=.5){const set=new Set();for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*2));
  for(let j=0;j<=n;j++){const t=j/n,x=a.x+(b.x-a.x)*t+(ruido2(t*3+i,k)-.5)*irr*3,y=a.y+(b.y-a.y)*t+(ruido2(t*3+i,k+9)-.5)*irr*3,l=larg*(.8+.4*ruido2(t*4+i,k+3));
   for(let dy=-Math.ceil(l);dy<=Math.ceil(l);dy++)for(let dx=-Math.ceil(l);dx<=Math.ceil(l);dx++)if(Math.hypot(dx,dy)<=l){const cx=Math.round(x+dx),cy=Math.round(y+dy);if(cx>=0&&cy>=0&&cx<W&&cy<H)set.add(cx+','+cy);}}}
 return [...set].map(s=>s.split(',').map(Number));}
const distSeg=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/l));return Math.hypot(x-(a.x+dx*t),y-(a.y+dy*t));};

// ------------------------------------------------------------------ geografia do vale
const LAGO={x:13,y:25,rx:9,ry:5.5},PANTANO={x:46,y:42.5,rx:10,ry:4.2},LAVA={x:68,y:44.5,rx:5.5,ry:3.8};
const CORDILHEIRA={x:48,y:1,w:30,h:14},CAVERNA={x:55,y:21,w:22,h:18};
const CASA={x:26,y:23,w:9,h:6},GRUTA={x:2,y:2,w:9,h:8},MORRO={x:11,y:2,w:7,h:8},RIACHO={x:13,y:9,w:3,h:14}; // v205: desce até DENTRO da lagoa (y 23): curso contínuo queda → canal → desembocadura
// subsolo (nível 9): câmaras sob a trilha da caverna; os dois acessos de superfície
const ANDAR_SUBSOLO=9; // igual a mesa-andares.ANDAR_SUBSOLO (conferido em teste)
const SUBSOLO={A:{x:43,y:26,w:10,h:7},B:{x:53,y:27,w:8,h:4},C:{x:61,y:25,w:10,h:9},D:{x:61,y:34,w:10,h:6}},ACESSO_POCO={x:48.2,y:28.6},ACESSO_RAMPA={x:54.4,y:29.4};
const RUINA={x:18,y:7,w:14,h:9},TORRE={x:38,y:6,w:6,h:6},CAMPO={x:35,y:21,w:11,h:8},CALABOUCO={x:3,y:37,w:26,h:11};
const TRILHAS=[ // do acampamento para cada lugar
 [{x:40,y:25},{x:33,y:20},{x:26,y:17},{x:22,y:16.5}],           // ruínas
 [{x:40,y:25},{x:41,y:17},{x:41,y:12.5}],                        // torre
 [{x:40,y:25},{x:48,y:28},{x:55,y:30}],                          // boca da caverna
 [{x:40,y:25},{x:34,y:31},{x:24,y:35},{x:17,y:36.5}],            // porta do calabouço
 [{x:40,y:25},{x:36,y:31},{x:28,y:31.5},{x:22,y:29}],           // lago (pelo sul da casa)
 [{x:40,y:25},{x:37,y:25.4}],                                    // porta leste da casa
 [{x:40,y:25},{x:34,y:19.5},{x:27,y:18},{x:20,y:17.8},{x:15,y:17.6},{x:10,y:15},{x:6.5,y:11.5}], // ponte da cachoeira e boca da gruta
 [{x:40,y:25},{x:42,y:34},{x:44,y:38}]                           // pântano
];
const emTrilha=(x,y,m=0)=>TRILHAS.some(t=>t.some((p,i)=>i&&distSeg(x,y,t[i-1],p)<2.2+m));
const ZONAS={campo_oeste:{x:6.2,y:15.2,rx:3.8,ry:2.2},floresta_norte:{x:30,y:3.5,rx:10,ry:2.5},campo_leste:{x:73.5,y:18,rx:3,ry:2},floresta_sul:{x:17,y:34.6,rx:7,ry:2.2},lago:{x:9,y:25.5,rx:6,ry:4.2},pantano:{x:50.5,y:45,rx:8.5,ry:3.4},ruinas:{x:23.5,y:11,rx:5,ry:2.8},caverna:{x:66,y:30,rx:6,ry:5},cordilheira:{x:64,y:6,rx:10,ry:4},acampamento:{x:40.5,y:25,rx:3,ry:2},calabouco:{x:16,y:42.5,rx:9,ry:2.5},torre:{x:41,y:9.5,rx:1.5,ry:1.5}};
const livreParaArvore=(x,y)=>!(dentroElipse(x,y,LAGO,3)||dentroElipse(x,y,PANTANO,2.5)||dentroElipse(x,y,LAVA,4)||dentroRet(x,y,CORDILHEIRA,2)||dentroRet(x,y,CAVERNA,2)||dentroRet(x,y,RUINA,2.5)||dentroRet(x,y,TORRE,2.5)||dentroRet(x,y,CAMPO,1.5)||dentroRet(x,y,CALABOUCO,2)||emTrilha(x,y,.6)||dentroRet(x,y,CASA,2.5)||dentroRet(x,y,GRUTA,2.5)||dentroRet(x,y,MORRO,2.5)||dentroRet(x,y,RIACHO,2.5));

/** os passos do mapa, para o Editor rápido (mesmo formato dos Modelos) */
export function passosEcossistema(){
 const r=rng(2026),P=[];
 // ---- chão e manchas orgânicas (clareiras, trilhas, praias, solo escuro da floresta)
 // fundo de TERRA, com a grama "pintada" por cima em pinceladas orgânicas (como o pincel das oficinas): grama curta onde o ruído é alto, mato alto nos miolos, terra nua nas trilhas, no acampamento e nas clareiras
 P.push({t:'chao',tex:'terra'});
 const semGrama=(x,y)=>emTrilha(x,y,-.3)||dentroElipse(x,y,{x:40.5,y:25,rx:6.5,ry:4.8})||dentroRet(x,y,RUINA,1)||dentroRet(x,y,TORRE,1.2)||dentroRet(x,y,CALABOUCO,1.2)||dentroRet(x,y,CASA,1)||dentroRet(x,y,GRUTA,1)||dentroRet(x,y,MORRO,1)||dentroRet(x,y,RIACHO,.6)||dentroRet(x,y,CORDILHEIRA,0)||dentroRet(x,y,CAVERNA,0)||dentroElipse(x,y,LAGO,2.4)||dentroElipse(x,y,LAVA,4.5)||dentroElipse(x,y,PANTANO,3.5);
 const grama=[],mato=[];
 // blocos de 2×2 m: a borda continua orgânica (o editor suaviza), mas o mapa fica leve para salvar
 const bloco=(L,x,y)=>{for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if(x+dx<W&&y+dy<H)L.push([x+dx,y+dy]);};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(semGrama(x,y)||semGrama(x+1,y+1))continue;const n=ruido2((x+.5)*.11,(y+.5)*.11,3)+(hash2(x,y,5)-.5)*.05,m=ruido2((x+.5)*.2,(y+.5)*.2,8);if(n>.36){grama.push([x,y]);if(n>.52&&m>.55)mato.push([x,y]);}} // v205: células de 1 m (antes 2×2): bordas orgânicas, sem 'quadrados' de grama
 P.push({t:'mancha',tex:'grama_curta',cels:grama,nome:'Grama',camada:1.02,borda:'#2f5a26'});
 P.push({t:'mancha',tex:'grama_alta',cels:mato,nome:'Mato alto',camada:1.03,borda:'#264a1f'});
 // tufos soltos de grama sobre a terra nua das clareiras (pinceladas pequenas)
 for(let k=0;k<12;k++){const e={x:3+r()*74,y:3+r()*44,rx:1.6+r()*2.2,ry:1.2+r()*1.6};if(semGrama(e.x,e.y)&&!emTrilha(e.x,e.y,1))continue;if(dentroElipse(e.x,e.y,LAGO,3)||dentroRet(e.x,e.y,CORDILHEIRA,1)||dentroRet(e.x,e.y,CAVERNA,1))continue;P.push({t:'mancha',tex:'grama_curta',cels:mancha(e,60+k,.6),nome:'Tufo de grama',camada:1.025,borda:'#2f5a26'});}
 const noCanal=(x,y)=>x>=RIACHO.x-.5&&x<=RIACHO.x+RIACHO.w+.5&&y<=RIACHO.y+RIACHO.h+.5,cheio=[];for(let cx=Math.floor(LAGO.x-LAGO.rx-5);cx<=Math.ceil(LAGO.x+LAGO.rx+5);cx++)for(let cy=Math.floor(LAGO.y-LAGO.ry-4);cy<=Math.ceil(LAGO.y+LAGO.ry+4);cy++)if(((cx+.5-LAGO.x)/(LAGO.rx+3.3))**2+((cy+.5-LAGO.y)/(LAGO.ry+2.7))**2<=1)cheio.push([cx,cy]);
 // v205: a margem da lagoa é SEMPRE areia (miolo cheio) com contorno irregular por fora e a faixa dos barrancos do canal; nunca terra marrom encostada na água
 const margemCanal=[];for(let cy=18;cy<=Math.ceil(LAGO.y-LAGO.ry+2.5);cy++)for(const cx of [RIACHO.x-3,RIACHO.x-2,RIACHO.x-1,RIACHO.x+RIACHO.w,RIACHO.x+RIACHO.w+1,RIACHO.x+RIACHO.w+2])margemCanal.push([cx,cy]);
 const praiaCels=[...mancha({...LAGO,rx:LAGO.rx+3.7,ry:LAGO.ry+3},31,.45),...cheio,...margemCanal].filter(([x,y])=>!noCanal(x,y)),praiaSet=new Set(praiaCels.map(c=>Math.floor(c[0])+','+Math.floor(c[1])));
 P.push({t:'mancha',tex:'areia_clara',cels:praiaCels,nome:'Praia',camada:1.04,borda:'#b9a46c'});
  // v205: AREIA MOLHADA — faixa mais escura entre a água e a areia seca (esmaece nas duas bordas)
 P.push({t:'mancha',tex:'areia_clara',cels:mancha({...LAGO,rx:LAGO.rx+2.3,ry:LAGO.ry+1.8},57,.4).filter(([x,y])=>!(x>=RIACHO.x-1.5&&x<=RIACHO.x+RIACHO.w+1.5&&y<=RIACHO.y+RIACHO.h)),nome:'Areia molhada',camada:1.045,borda:'#8a7440'});
 P.push({t:'mancha',tex:'rocha_vulcanica',cels:mancha({...LAVA,rx:LAVA.rx+4,ry:LAVA.ry+3},41,.45),nome:'Rocha vulcânica',camada:1.04,borda:'#2a1a12'});
 P.push({t:'mancha',tex:'terra_rachada',cels:mancha({x:60,y:27,rx:9,ry:7},51,.5),nome:'Terra seca',camada:1.03,borda:'#8a5a36'});
 // ---- água, lava e pântano (formas irregulares do editor)
 P.push({t:'cfg',terr:{pocaIrr:true,pocaIrreg:62}});
 P.push({t:'poca',r:{x:Math.round(LAGO.x-LAGO.rx),y:Math.round(LAGO.y-LAGO.ry),w:Math.round(LAGO.rx*2),h:Math.round(LAGO.ry*2)},o:{poca:'agua'}});
 P.push({t:'poca',r:{x:Math.round(LAGO.x-4),y:Math.round(LAGO.y-2),w:8,h:4},o:{poca:'agua_profunda'}});
 P.push({t:'poca',r:{x:Math.round(PANTANO.x-PANTANO.rx),y:Math.round(PANTANO.y-PANTANO.ry),w:Math.round(PANTANO.rx*2),h:Math.round(PANTANO.ry*2)},o:{poca:'agua_pantano'}});
 P.push({t:'poca',r:{x:Math.round(LAVA.x-LAVA.rx),y:Math.round(LAVA.y-LAVA.ry),w:Math.round(LAVA.rx*2),h:Math.round(LAVA.ry*2)},o:{poca:'lava'}});
 // v205: LAVA com perigo por região (a lógica lê estes DADOS, nunca a cor): lava exposta (2d6), núcleo ativo no meio (4d6, afunda) e crosta quente em volta (calor, 1d4); ponte de crosta firme cruza o lado sul
 P.push({t:'poca',r:{x:66,y:43,w:5,h:3},o:{poca:'lava'}});
 P.push({t:'cfg'}); // lote novo: as poças já existem como objetos finais
 P.push({t:'ajustar',poca:'lava',ordem:'maior',props:{perigoLavaV205:{tipo:'lava',dano:'2d6',intensidade:1,margemCalorM:1.2}}});
 P.push({t:'ajustar',poca:'lava',ordem:'menor',props:{perigoLavaV205:{tipo:'nucleo',dano:'4d6',intensidade:2}}});
 // v205: a ponte de crosta sobre a lava foi TIRADA a pedido do Yuri (a lava não tem passagem; a regra de suporte continua existindo em js/mesa-lava.js para outros mapas)
 // ---- cordilheira ao norte (planalto com paredões, picos e rampas) e caverna natural a leste
 P.push({t:'cfg',terr:{pontiaguda:true,pontas:65,irreg:62,paredao:1,rampas:2,topo:'grama_seca'},texParede:'rocha'});
 P.push({t:'cordilheira',r:CORDILHEIRA});
 P.push({t:'cfg',terr:{rocha:47,passos:4,entradas:1,chaoCav:'cascalho'}});
 P.push({t:'caverna_nat',r:CAVERNA});
 // ---- noroeste: pequena gruta (um bolsão), morro com a nascente e a CACHOEIRA que desce para a lagoa por um riacho raso, com ponte
 P.push({t:'caverna_nat',r:GRUTA});
 P.push({t:'cfg',terr:{pontiaguda:true,pontas:65,irreg:62,paredao:1,rampas:1,topo:'grama_seca'},texParede:'rocha'});
 P.push({t:'cordilheira',r:MORRO});
 P.push({t:'poca',r:{x:12.4,y:3.4,w:3.6,h:3},o:{poca:'agua'}});
 P.push({t:'poca',r:RIACHO,o:{poca:'agua_rasa'}});
 P.push({t:'cfg'});
 P.push({t:'ajustar',pocasPrefixo:'agua',props:{bordaLargura:0,borda:'transparent'}});
 P.push({t:'ajustar',nomeRe:'^Areia molhada',props:{tintaV205:'rgba(96,74,44,.6)'}});
 P.push({t:'ajustar',pocasPrefixo:'agua_pantano',props:{tintaV205:'rgba(16,46,24,.55)'}}); // v205: pântano é o ponto mais baixo: água verde-escura, densa
 // enfeites da lagoa: vitórias-régias nas águas rasas, juncos na margem e pedras molhadas (só desenho; não bloqueiam)
 {const it=[],rr=rng(4242),emL=(x,y,k)=>((x-LAGO.x)/(LAGO.rx*k))**2+((y-LAGO.y)/(LAGO.ry*k))**2,fundo=(x,y)=>(((x-LAGO.x)/4.3)**2+((y-LAGO.y)/2.3)**2)<1,canal=(x,y)=>x>12&&x<17.5&&y<23.5;
  const sorteia=(n,k0,k1,ok)=>{const out=[];for(let i=0;i<n*60&&out.length<n;i++){const a=rr()*6.283,d=k0+rr()*(k1-k0),x=LAGO.x+Math.cos(a)*LAGO.rx*d,y=LAGO.y+Math.sin(a)*LAGO.ry*d;if(!ok(x,y)||out.some(p=>Math.hypot(p.x-x,p.y-y)<1.7))continue;out.push({x,y});}return out;};
  sorteia(16,.35,.9,(x,y)=>!fundo(x,y)&&!canal(x,y)).forEach((p,i)=>it.push({id:'decor_lirio_'+i,nome:'Vitória-régia',img:'arte/decor/lirio_'+(1+i%3)+'.svg',x:p.x,y:p.y,w:.9+rr()*.5,h:.9+rr()*.5,rot:Math.floor(rr()*360)}));
  sorteia(12,1.02,1.16,(x,y)=>!canal(x,y)&&x>1&&y<(H-1.5)).forEach((p,i)=>it.push({id:'decor_junco_'+i,nome:'Junco',img:'arte/decor/junco_'+(1+i%3)+'.svg',x:p.x,y:p.y,w:1.3+rr()*.7,h:1.3+rr()*.7,rot:Math.floor(rr()*360),camada:2.2}));
  sorteia(9,.8,1.12,(x,y)=>!fundo(x,y)&&!canal(x,y)).forEach((p,i)=>it.push({id:'decor_pedra_'+i,nome:'Pedra molhada',img:'arte/decor/pedra_agua_'+(1+i%3)+'.svg',x:p.x,y:p.y,w:.6+rr()*.8,h:.6+rr()*.8,rot:Math.floor(rr()*360),camada:2.1}));
  // pedras onde a terra marrom encosta direto na água (sem areia no caminho): margem da lagoa fora da praia e barrancos do canal
  for(let a=0;a<6.283;a+=.11){const x=LAGO.x+Math.cos(a)*LAGO.rx*1.05,y=LAGO.y+Math.sin(a)*LAGO.ry*1.05,fx=LAGO.x+Math.cos(a)*LAGO.rx*1.22,fy=LAGO.y+Math.sin(a)*LAGO.ry*1.22;
   if(canal(x,y)||praiaSet.has(Math.floor(fx)+','+Math.floor(fy))||x<1.2||y>H-1.2||it.some(p=>Math.hypot(p.x-x,p.y-y)<1.1))continue;
   it.push({id:'decor_pedra_m'+it.length,nome:'Pedra da margem',img:'arte/decor/pedra_agua_'+(1+it.length%3)+'.svg',x,y,w:.7+rr()*.8,h:.7+rr()*.7,rot:Math.floor(rr()*360),camada:2.1});}
  for(const bx of [RIACHO.x-.05,RIACHO.x+RIACHO.w+.05])for(let y=RIACHO.y+1;y<RIACHO.y+RIACHO.h-.5;y+=1.3+rr()*1.3){if(Math.abs(y-17.8)<3.4)continue;it.push({id:'decor_pedra_r'+it.length,nome:'Pedra do barranco',img:'arte/decor/pedra_agua_'+(1+it.length%3)+'.svg',x:bx+(rr()-.5)*.3,y,w:.6+rr()*.6,h:.6+rr()*.6,rot:Math.floor(rr()*360),camada:2.1});}
  // peças do Blender (sl_lirio_agua, sl_junco_agua, sl_pedra_margem_a/b): entram como objetos do banco, sem bloqueio
  const bancoDe=d=>/lirio/.test(d.id)?'sl_lirio_agua':/junco/.test(d.id)?'sl_junco_agua':(d.id.length%2?'sl_pedra_margem_a':'sl_pedra_margem_b');
  const novas=[];for(let i=0;i<7;i++){const a=i/7*6.283+.4,k=.25+.6*((i*37)%10)/10;novas.push(['obj','sl_pedra_submersa',[+(LAGO.x+Math.cos(a)*4.1*k).toFixed(2),+(LAGO.y+Math.sin(a)*2.1*k).toFixed(2),(i*53)%360]]);} // rochas escuras no fundo da lagoa (a água ambiente passa por cima)
  // v211: vegetação REFEITA no Blender (vegetacao_pantano.py), em BAIXA densidade e posições escolhidas à mão (composição, não sorteio). Tudo só desenho, sem bloqueio:
  // a passagem e a visão das criaturas ficam como estavam. Substitui os troncos, raízes, vitórias-régias e juncos reprovados (sl_tronco_caido, sl_raiz_pantano, sl_lirio_agua, sl_junco_agua).
  const ver=[['sl_tronco_quebrado',[5.1,27.9,25]],['sl_raiz_arco',[18.6,29,120]],['sl_tronco_bifurcado',[21.3,23.6,60]],['sl_planta_alien',[4.6,23,70]],['sl_planta_alien',[19.8,27,200]],
   ...it.filter(d=>/junco/.test(d.id)).slice(0,4).map(d=>['sl_touceira_junco',[+d.x.toFixed(2),+d.y.toFixed(2),d.rot||0]]),
   // pântano (elipse PANTANO: x 36–56, y 38,3–46,7): cinco troncos (quebrado, curvo, bifurcado, oco), três raízes, quatro touceiras de junco e três plantas largas, afastados das trilhas centrais
   ['sl_tronco_quebrado',[41.5,40.8,8]],['sl_tronco_curvo',[51,44.4,150]],['sl_raiz_arco',[47.8,40.2,200]],['sl_raiz_assimetrica',[40.6,44.2,85]],['sl_tronco_bifurcado',[38.5,43.8,30]],['sl_tronco_oco',[43.2,44.6,170]],
   ['sl_touceira_junco',[44.5,42.9,20]],['sl_touceira_junco',[52.4,41.4,140]],['sl_touceira_junco',[38.6,41.8,260]],['sl_touceira_junco',[48.6,45.2,80]],
   ['sl_planta_alien',[46.2,44.5,0]],['sl_planta_alien',[43.2,39.6,70]],['sl_planta_alien',[53.2,43.3,230]]];
  P.push({t:'ops',ops:[...it.filter(d=>!/lirio|junco/.test(d.id)).map(d=>['obj',bancoDe(d),[+d.x.toFixed(2),+d.y.toFixed(2),d.rot||0]]),...novas,...ver.map(([k,p])=>['obj',k,p])]});} // sem contorno nas poças de água: a margem é a areia/terra (nada de linha cruzando a foz)
 P.push({t:'ajustar',poca:'agua_rasa',ordem:'maior',props:{fluxoV205:{dx:0,dy:1,vel:1}}}); // o canal corre para o sul (queda → lagoa); o módulo de água ambiente lê este dado
 // ---- floresta: árvores em grupos naturais (sem grade), fora de água, rocha, construções e trilhas
 const arv=[];const tenta=(n,ids,minD,filtro)=>{for(let i=0,ok=0;i<n*40&&ok<n;i++){const x=2+r()*(W-4),y=2+r()*(H-4);if(!livreParaArvore(x,y)||(filtro&&!filtro(x,y)))continue;if(arv.some(a=>Math.hypot(a.x-x,a.y-y)<minD))continue;
   const id=ids[Math.floor(r()*ids.length)],tam=3.4+r()*2.2;arv.push({x,y,id,tam:id==='copa_moitas'?1.5+r()*.8:tam});ok++;}};
 // só árvores TROPICAIS (poucas) e, no lugar das outras, rochas e troncos caídos espalhados
 tenta(22,['copa_tropical','copa_palmeiral'],4.6);
 const deco=[];for(let i=0,ok=0;i<900&&ok<22;i++){const x=2+r()*(W-4),y=2+r()*(H-4);if(!livreParaArvore(x,y)||arv.some(q=>Math.hypot(q.x-x,q.y-y)<2.4)||deco.some(q=>Math.hypot(q[1]-x,q[2]-y)<3))continue;deco.push([ok%5===4?'tronco':'pedra|rocha',x,y,Math.round(r()*359)]);ok++;}
 P.push({t:'ops',ops:deco.map(([kw,x,y,g])=>['obj',kw,[+x.toFixed(1),+y.toFixed(1),g]])});
 // a sombra das copas no chão é desenhada por js/mesa-sombras-luz.js (um passo 'decor' com 22 itens quebrava a reforma repetida: o banco guardava 1 peça a menos)
 for(const a of arv)P.push({t:'copa',r:{x:+(a.x-a.tam/2).toFixed(2),y:+(a.y-a.tam/2).toFixed(2),w:+a.tam.toFixed(2),h:+a.tam.toFixed(2)},o:{copa:a.id}});
 // ---- ruínas: casa de pedra quebrada com pátio, porta, janelas e móveis
 P.push({t:'cfg',texParede:'pedra',texPiso:'pedra',esp:.45});
 P.push({t:'ops',ops:[
  ['comodo',[18,7,10,7],{par:'pedra',piso:'pedra',esp:.45}],['porta',[22,14]],['porta',[28,10],{v:1}],['janela',[20,7]],['janela',[25,7]],['janela',[18,10],{v:1}],
  ['parede',[28,7,32,7],{par:'pedra'}],['parede',[32,7,32,10],{par:'pedra'}],['parede',[28,14,31,14],{par:'pedra'}],['parede',[22,4,26,4],{par:'pedra'}],
  ['piso',[28,8,5,6],{piso:'pedregulhos'}],
  ['obj','rf_mesa_pedra',[22,10.2]],['obj','rf_braseiro',[19.8,8.6]],['obj','bl_barril',[26.5,8.6]],['obj','rf_bau_bronze',[26,12.4]],['obj','rf_coluna',[28.2,7.4]],['obj','rf_estatua_guerreiro',[30.4,11.6]],['obj','esqueleto|ossada',[24,12.8]]
 ]});
 // ---- torre de vigia de dois andares (a escada leva ao andar de cima)
 P.push({t:'ops',ops:[['comodo',[38,6,6,6],{par:'tijolo',piso:'madeira',esp:.4}],['porta',[41,12]],['janela',[38,8],{v:1}],['janela',[44,9],{v:1}],['escada',[39,7,1.5,3]],['obj','rf_tambor_combustivel',[43,7.2]],['obj','rf_caixa_suprimentos',[43,10.4]]]});
 P.push({t:'cfg',andar:2});
 P.push({t:'ops',ops:[['comodo',[38,6,6,6],{par:'tijolo',piso:'madeira',esp:.4}],['janela',[41,6]],['janela',[38,9],{v:1}],['obj','rf_painel_retro',[41,9.6]],['obj','rf_cama_capsula',[42.4,7.8]],['obj','rf_cofre',[39.6,10.9]]]});
 P.push({t:'cfg',andar:1});
 // ---- casa habitável (quarto + sala, porta leste e porta sul, janelas, telhado); o riacho tem queda e ponte
 P.push({t:'cfg',texParede:'tijolo',texPiso:'madeira',esp:.3});
 P.push({t:'ops',ops:[
  ['obj','sl_cachoeira_queda',[14.5,14.2]],['obj','sl_ponte_madeira',[14.5,17.8,90]],
  ['comodo',[CASA.x,CASA.y,CASA.w,CASA.h],{par:'tijolo',piso:'madeira',esp:.3}],['parede',[CASA.x+5,CASA.y,CASA.x+5,CASA.y+3],{par:'tijolo'}],
  ['porta',[CASA.x+CASA.w,CASA.y+2],{v:1}],['porta',[CASA.x+4,CASA.y+CASA.h]],['janela',[CASA.x+2,CASA.y]],['janela',[CASA.x+7,CASA.y]],['janela',[CASA.x,CASA.y+3],{v:1}],['janela',[CASA.x+CASA.w,CASA.y+4],{v:1}],
  ['obj','sl_tapete_sala',[CASA.x+2.4,CASA.y+3.5]],['obj','bl_cama_casal',[CASA.x+2.1,CASA.y+1.6,90]],['obj','bl_bau',[CASA.x+.9,CASA.y+5.2]],['obj','bl_armario',[CASA.x+4.2,CASA.y+.6]],
  ['obj','bl_estante',[CASA.x+6.4,CASA.y+.55]],['obj','sl_escrivaninha',[CASA.x+7.4,CASA.y+5.0]],['obj','bl_cadeira',[CASA.x+7.4,CASA.y+3.9,0]],['obj','sl_lampiao',[CASA.x+CASA.w+1.4,CASA.y+1.2]],['obj','sl_lampiao',[CASA.x+3.2,CASA.y+1.1]],['obj','sl_lampiao',[CASA.x+7.6,CASA.y+4.6]]
 ]});
 P.push({t:'telhado',r:{x:CASA.x,y:CASA.y,w:CASA.w,h:CASA.h}});
 // ---- acampamento
 P.push({t:'ops',ops:[['obj','rf_tambor_combustivel',[37.6,22.4]],['obj','rf_caixa_suprimentos',[38.8,22.2]],['obj','rf_capsula_recuperacao',[43.6,23.6]],['obj','rf_monitor_vital',[42.2,22.5]],['obj','bl_fogueira',[40.5,25.6]],['obj','rf_banqueta_cromo',[38.8,27]],['obj','rf_banqueta_cromo',[42.2,27.2]],['obj','tronco',[44.8,27]],['obj','sl_lampiao',[38.3,24]],['obj','sl_lampiao',[43,24.2]]]});
 // ---- calabouço pequeno (a porta fica na trilha): corredor, 3 celas com grade, sala da guarda, sala do tesouro, armadilhas
 const C=CALABOUCO;
 P.push({t:'cfg',texParede:'rocha',texPiso:'pedra',esp:.5});
 P.push({t:'ops',ops:[
  ['comodo',[C.x,C.y,C.w,C.h],{par:'rocha',piso:'pedra',esp:.5}],
  ['parede',[C.x,C.y+4,C.x+19,C.y+4],{par:'rocha'}],['parede',[C.x+7,C.y,C.x+7,C.y+4],{par:'rocha'}],['parede',[C.x+13,C.y,C.x+13,C.y+4],{par:'rocha'}],
  ['parede',[C.x+19,C.y+4,C.x+19,C.y+C.h],{par:'rocha'}],['parede',[C.x+19,C.y+7,C.x+C.w,C.y+7],{par:'rocha'}],
  ['porta',[C.x+14,C.y]],['porta',[C.x+19,C.y+6],{v:1}],['porta',[C.x+23,C.y+7]],
  ['obj','rf_mesa_pedra',[C.x+22,C.y+9.4]],['obj','rf_braseiro',[C.x+23.6,C.y+10.4]],['obj','bl_barril',[C.x+21,C.y+10.6]],['obj','rf_bau_bronze',[C.x+23.5,C.y+2.4]],['obj','rf_cofre',[C.x+21,C.y+2.4]],['obj','rf_cama_peles',[C.x+3,C.y+8.8]],['obj','rf_cama_peles',[C.x+6,C.y+8.8]],['obj','esqueleto|ossada',[C.x+12,C.y+6.4]],['obj','rf_sarcofago_gotico',[C.x+16.2,C.y+9]]
 ]});
 const especiais=[];
 // celas: 3 compartimentos no alto do calabouço; a grade da frente é a porta (abre pela alavanca)
 for(let i=0;i<3;i++){const x0=C.x+[1,8,14][i],w=[5.5,4.5,4.5][i];especiais.push({k:'grade',jid:'c'+(i+1),porta:true,x:x0,y:C.y+4-.15,w:w,h:.3});especiais.push({k:'alavanca',jid:'c'+(i+1),x:x0+w/2,y:C.y+5.2,emperrada:i===1});}
 for(const [x,y,tipo] of [[C.x+8,C.y+5.6,'estacas'],[C.x+14,C.y+5.6,'laminas'],[C.x+20.5,C.y+7.8,'estacas'],[C.x+11,C.y+5.6,'estacas']])especiais.push({k:'armadilha',x,y,tipo});
 // armadilhas ao ar livre: ruínas, torre, boca da caverna, trilhas
 for(const [x,y,tipo] of [[22,15.5,'estacas'],[27.3,9.5,'laminas'],[41,13.6,'estacas'],[54,30,'estacas'],[57,28,'laminas'],[44,35,'estacas'],[24,33,'laminas']])especiais.push({k:'armadilha',x,y,tipo});
 // ---- v205: TETO DE ROCHA sobre a caverna natural e a gruta (o interior só aparece para quem está dentro; o vão da entrada continua livre: o teto não bloqueia)
 P.push({t:'telhado',r:CAVERNA,o:{teto:'rocha',rocha:true}});P.push({t:'telhado',r:GRUTA,o:{teto:'rocha',rocha:true}});
 // ---- v205: SUBSOLO REAL (nível 9, elevação -3 m): câmara sob a trilha → corredor → sala da boca → sala funda. Dois acessos de superfície com volta: o alçapão com escada
 // (ao lado da trilha da caverna) e a rampa na boca da caverna. A superfície e o subsolo não se veem nem se esbarram por dividirem X/Y.
 const SS=ANDAR_SUBSOLO;
 P.push({t:'cfg',andar:SS,texParede:'rocha',texPiso:'pedra',esp:.5});
 P.push({t:'ops',ops:[
  ['comodo',[SUBSOLO.A.x,SUBSOLO.A.y,SUBSOLO.A.w,SUBSOLO.A.h],{par:'rocha',piso:'pedra',esp:.5}],
  ['comodo',[SUBSOLO.B.x,SUBSOLO.B.y,SUBSOLO.B.w,SUBSOLO.B.h],{par:'rocha',piso:'pedra',esp:.5}],
  ['comodo',[SUBSOLO.C.x,SUBSOLO.C.y,SUBSOLO.C.w,SUBSOLO.C.h],{par:'rocha',piso:'pedra',esp:.5}],
  ['comodo',[SUBSOLO.D.x,SUBSOLO.D.y,SUBSOLO.D.w,SUBSOLO.D.h],{par:'rocha',piso:'pedra',esp:.5}],
  ['obj','sl_lampiao',[SUBSOLO.A.x+2,SUBSOLO.A.y+1.4]],['obj','sl_lampiao',[SUBSOLO.C.x+2.4,SUBSOLO.C.y+1.4]],['obj','rf_bau_bronze',[SUBSOLO.D.x+8,SUBSOLO.D.y+4.6]],['obj','rf_braseiro',[SUBSOLO.C.x+7.5,SUBSOLO.C.y+6.5]]
 ]});
 P.push({t:'cfg',andar:SS}); // lote novo: só agora as peças do subsolo já têm o andar gravado
 // passagens (arcos) entre as câmaras: as paredes vizinhas se duplicam nos cantos compartilhados, então se abre o vão cortando a área em todas elas
 P.push({t:'tirar_area',r:{x:SUBSOLO.B.x-.45,y:SUBSOLO.B.y+1,w:.9,h:1.5}});
 P.push({t:'tirar_area',r:{x:SUBSOLO.C.x-.45,y:SUBSOLO.B.y+1,w:.9,h:1.5}});
 P.push({t:'tirar_area',r:{x:SUBSOLO.C.x+4.2,y:SUBSOLO.D.y-.45,w:1.6,h:.9}});
 P.push({t:'cfg',andar:SS});
 P.push({t:'ajustar',andar:SS,props:{elevacaoAndarV205:-3,subsoloV205:true}});
 P.push({t:'cfg',andar:1,texParede:'rocha',texPiso:'pedra',esp:.5});
 P.push({t:'escada',r:{x:ACESSO_POCO.x-.8,y:ACESSO_POCO.y-1,w:1.6,h:2}});
 P.push({t:'rampa',r:{x:ACESSO_RAMPA.x-1,y:ACESSO_RAMPA.y-1.5,w:2,h:3}});
 P.push({t:'ajustar',x:ACESSO_POCO.x,y:ACESSO_POCO.y,props:{nome:'Alçapão com escada (subsolo)',ligaAndaresV205:[1,SS],vaoAndarV144:true,luzEntradaV205:{raio:3.4}}});
 P.push({t:'ajustar',x:ACESSO_RAMPA.x,y:ACESSO_RAMPA.y,props:{nome:'Rampa para o subsolo',ligaAndaresV205:[1,SS],vaoAndarV144:true,luzEntradaV205:{raio:4.2}}});
 return {passos:P,especiais,arvores:arv};
}

/** células ocupadas (rocha, parede, objeto sólido, água) lidas do mapa já construído: bichos nunca nascem dentro */
function celulasBloqueadas(objs,comAgua=true){
 const b=new Set();
 for(const o of objs||[]){const solido=o.bloqueiaMovimento&&!o.destruido&&!o.invisivelV161&&!(Number(o.andarV144??1)>1);const agua=comAgua&&(o.erPoca||o.pocaV198)&&!String(o.erPoca||'').includes('rasa');if(!solido&&!agua)continue;
  const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1,cx=Number(o.x)*W/28,cy=Number(o.y)*H/14;
  if(w*h>500)continue; // chão do mapa
  for(let x=Math.floor(cx-w/2);x<=Math.floor(cx+w/2);x++)for(let y=Math.floor(cy-h/2);y<=Math.floor(cy+h/2);y++)b.add(x+','+y);}
 return b;
}
let ARV=[];const emArvore=(x,y)=>ARV.some(a=>Math.hypot(a.x-x,a.y-y)<a.tam*.32);
function sorteia(zonas,area,bloq,usados,rnd){
 const a=zonas[area]||zonas.acampamento;
 for(let t=0;t<300;t++){const ang=rnd()*6.283,d=Math.sqrt(rnd()),x=a.x+Math.cos(ang)*a.rx*d,y=a.y+Math.sin(ang)*a.ry*d,k=Math.floor(x)+','+Math.floor(y);
  if(x<1||y<1||x>W-1||y>H-1||bloq.has(k)||emArvore(x,y))continue;if(usados.some(u=>Math.hypot(u.x-x,u.y-y)<1.8))continue;return {x,y};}
 return {x:a.x,y:a.y};
}

// quem vive onde: [id do bestiário, quantidade, área, atitude, extras]
export const POPULACAO=[
 // presas / pacíficos (comem plantas, fogem dos predadores)
 ['cavalgante_prismatico',3,'campo_oeste','pacifica',{dieta:'frugivora',personalidade:'comum',confianca:0}],
 ['larva_interdimensional',3,'floresta_sul','pacifica',{dieta:'frugivora',personalidade:'covarde',confianca:0}],
 ['rastejante_de_cinzas',3,'floresta_norte','pacifica',{dieta:'onivora',personalidade:'covarde',confianca:0}],
 ['criatura_de_calico_2',2,'pantano','pacifica',{dieta:'frugivora',personalidade:'comum'}],
 ['criatura_de_calico_1',2,'campo_oeste','defensiva',{dieta:'frugivora',ajuda:1,personalidade:'construtora'}],
 ['montariapterodatil',1,'campo_oeste','pacifica',{dieta:'frugivora',confianca:0,personalidade:'explorador'}],
 ['cao_de_sucata',1,'campo_oeste','pacifica',{dieta:'frugivora',personalidade:'comum'}],
 // montarias do acampamento: dragões-trombeta domesticados (um alado, que voa com o cavaleiro, e um corredor)
 ['dragao_trombeta_alado_domesticado',1,'acampamento','aliada',{dieta:'frugivora',confianca:0,personalidade:'comum'}],
 ['dragao_trombeta_corredor_domesticado',1,'acampamento','aliada',{dieta:'frugivora',confianca:0,personalidade:'comum'}],
 // predadores (caçam presas, defendem o território)
 ['predador_de_nevoa',2,'floresta_norte','agressiva',{dieta:'cacadora',ajuda:1,territorioM:9,personalidade:'teimosa'}],
 ['caçador_de_nevoa',2,'campo_leste','agressiva',{dieta:'cacadora',ajuda:1,territorioM:9,personalidade:'explorador'}],
 ['predador_couracado',2,'lago','agressiva',{dieta:'cacadora',territorioM:6,personalidade:'teimosa'}],
 ['besta_ululante',1,'ruinas','agressiva',{dieta:'cacadora',confianca:3,territorioM:12,personalidade:'furiosa'}],
 ['dragao_trombeta_corredor_selvagem',2,'campo_leste','agressiva',{dieta:'cacadora',ajuda:1,confianca:2,territorioM:10,personalidade:'teimosa'}],
 ['dragao_trombeta_alado_selvagem',1,'cordilheira','agressiva',{dieta:'cacadora',confianca:3,territorioM:14,personalidade:'furiosa'}],
 ['escavador_de_carapaca',1,'caverna','agressiva',{dieta:'cacadora',territorioM:7,personalidade:'construtora'}],
 ['cila',1,'lago','agressiva',{territorioM:6,personalidade:'furiosa'}],
 ['carrapato_de_ferro',2,'floresta_sul','agressiva',{dieta:'cacadora',territorioM:5,personalidade:'furiosa'}],
 ['insetoide_predador',2,'caverna','agressiva',{dieta:'cacadora',ajuda:1,territorioM:8,personalidade:'teimosa'}],
 ['insetoide_predador_1',2,'floresta_norte','agressiva',{dieta:'cacadora',ajuda:1,territorioM:8,personalidade:'furiosa'}],
 ['parasita_carniceiro',1,'pantano','agressiva',{dieta:'cacadora',territorioM:5,personalidade:'covarde'}],
 ['enxame_mordedor',1,'floresta_sul','agressiva',{dieta:'cacadora',territorioM:6,personalidade:'furiosa'}],
 ['vespa_de_vidro',2,'campo_leste','agressiva',{dieta:'cacadora',territorioM:7,personalidade:'explorador'}],
 // sanguinários (atacam qualquer um que veem)
 ['zumbi_1',4,'ruinas','sanguinaria',{confianca:3,personalidade:'furiosa'}],
 ['cadaver_de_chefe',1,'calabouco','sanguinaria',{confianca:3,personalidade:'furiosa'}],
 ['serpente_sanguessuga',1,'pantano','sanguinaria',{dieta:'cacadora',personalidade:'teimosa'}],
 ['vampiro_generico',1,'calabouco','sanguinaria',{confianca:3,personalidade:'explorador'}]
];

export const VERSAO_REFORMA=3;
const AQUATICAS=new Set(['cila','predador_couracado']);
/** habitat gravado no token (elipse em metros): onde a espécie vive; usado pela vida do mapa (mesa-nichos). Só para espécies da POPULACAO. */
export const habitatDe=id=>{const e=POPULACAO.find(p=>p[0]===id);const z=e&&ZONAS[e[2]];return z?{x:z.x,y:z.y,rx:z.rx,ry:z.ry,nome:e[2],aquatico:AQUATICAS.has(id),margem:3}:null;};
/** a cena inteira (terreno, prédios, armadilhas) no editor rápido já aberto no mapa certo; devolve {res} do construir */
export async function construirCena(E,{dizer=()=>{}}={}){
 const {passos,especiais,arvores}=passosEcossistema();ARV=arvores;
 dizer('⏳ Desenhando o terreno (pode levar alguns segundos)…');
 await new Promise(r=>setTimeout(r,50));
 const res=E.construir(passos,{semente:2026});
 await E.especiais(especiais);
 const esperado=E.objetos().length; // quantas peças a cena nova tem antes de salvar (o chamador confere se o banco guardou o mesmo tanto)
 {const o=E.objetos(),por={};let tot=0;for(const x of o){const n=JSON.stringify(x).length;tot+=n;const k=(x.erTipo||x.tipo||'?');por[k]=(por[k]||0)+n;}console.info('[Ecossistema] cena',Math.round(tot/1024)+' KB',JSON.stringify(Object.entries(por).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>k+'='+Math.round(v/1024)+'KB')));}
 await E.salvar();
 for(let i=0,ult=-1,igual=0;i<120&&igual<3;i++){const n=E.objetos().length;igual=(n===ult&&n>100)?igual+1:0;ult=n;await new Promise(r=>setTimeout(r,100));} // a cena nova volta do banco: só segue quando estabilizar
 return {...res,esperado};
}
const ehMonstro=t=>/^synccriatura:/.test(decodeURIComponent(String(t?.id||'')));
const especieDe=t=>decodeURIComponent(String(t?.id||'')).replace(/^synccriatura:/,'').split('~')[0];
/** acha a célula livre mais próxima de (x,y) em metros do mapa; null se não houver até 10 m */
export function celulaLivre(x,y,bloq,usados=[]){
 for(let r=0;r<=10;r+=.5){for(let k=0;k<(r?Math.ceil(r*8):1);k++){const ang=r?k/Math.ceil(r*8)*6.2832:0,px=x+Math.cos(ang)*r,py=y+Math.sin(ang)*r,c=Math.floor(px)+','+Math.floor(py);
  if(px<1||py<1||px>W-1||py>H-1||bloq.has(c)||emArvore(px,py))continue;if(usados.some(u=>Math.hypot(u.x-px,u.y-py)<1.4))continue;return {x:px,y:py};}}
 return null;
}
/**
 * Põe no mapa as criaturas e os NPCs que faltam (não duplica o que já existe) e tira do meio de paredes/água/troncos quem ficou dentro da geometria nova.
 * existentes: documentos de posição {id,...} que já estão neste mapa. As atitudes são gravadas POR TOKEN (não mexe no padrão da espécie na campanha).
 */
export async function povoarMapa({win,dep,mapaId,objetos,existentes=[],dizer=()=>{}}){
 const bloq=celulasBloqueadas(objetos),bloqAq=celulasBloqueadas(objetos,false),criaturas=dep.criaturas?.()||[],npcs=dep.npcs?.()||[],rnd=rng(77),usados=existentes.map(t=>({x:Number(t.x)*W/28,y:Number(t.y)*H/14})),faltou=[],colocados=[],movidos=[],mantidos=[];
 const A=win.mesaAtitudesIaV200,conv=(x,y)=>({x:Number((x/W*28).toFixed(3)),y:Number((y/H*14).toFixed(3))});
 const tamanho=(await import('./mesa-tamanhos.js?v=134')).tamanhoMiniaturaM;
 const ID=await import('./mesa-especies-mapa.js?v=205'),reparos=[];
 const D=id=>dep.doc(dep.db,...POS.split('/'),id);
 const idLivre=async base=>{for(let k=101;k<400;k++){const id=base+'~'+k;let ex=false;try{ex=(await dep.getDoc(D(encodeURIComponent(id)))).exists();}catch(_){}if(!ex)return id;}return base+'~'+Date.now();};
 // 0) migração v205 (idempotente): nome de exibição por grupo (insetoide × artrópode alienígena) e diâmetro de colisão = pegada no chão; o ID e a ficha não mudam
 for(const t of existentes){const p=ID.reparoDoToken(t)||{};if(ehMonstro(t)&&!t.habitatV205){const hb=habitatDe(especieDe(t));if(hb)p.habitatV205=hb;}if(!Object.keys(p).length)continue;await dep.setDoc(D(t.id),{...p,revision:Number(t.revision||0)+1},{merge:true});reparos.push({id:t.id,...p});}
 // 1) quem já está lá e ficou dentro de parede, rocha, água funda ou tronco vai para a célula livre mais próxima (identidade, dono e ficha ficam como estavam)
 for(const t of existentes){
  if(AQUATICAS.has(especieDe(t)))continue; // criatura da água fica na água
  const px=Number(t.x)*W/28,py=Number(t.y)*H/14;if(!(bloq.has(Math.floor(px)+','+Math.floor(py))||emArvore(px,py))){mantidos.push(t.id);continue;}
  const p=celulaLivre(px,py,bloq,usados);if(!p){movidos.push({id:t.id,de:[+px.toFixed(1),+py.toFixed(1)],erro:'sem célula livre a 10 m'});continue;}usados.push(p);
  await dep.setDoc(D(t.id),{...conv(p.x,p.y),revision:Number(t.revision||0)+1},{merge:true});movidos.push({id:t.id,de:[+px.toFixed(1),+py.toFixed(1)],para:[+p.x.toFixed(1),+p.y.toFixed(1)]});
 }
 // 2) criaturas que faltam, por espécie
 dizer('⏳ Soltando os bichos…');
 for(const [id,qtd,area,atitude,extra] of POPULACAO){
  const modelo=criaturas.find(c=>String(c.id)===id);if(!modelo){faltou.push(id);continue;}
  const tem=existentes.filter(t=>ehMonstro(t)&&especieDe(t)===id).length;
  for(let i=tem;i<qtd;i++){
   const tid=await idLivre('synccriatura:'+id),p=sorteia(ZONAS,area,AQUATICAS.has(id)?bloqAq:bloq,usados,rnd);usados.push(p);
   const dados={...(habitatDe(id)?{habitatV205:habitatDe(id)}:{}),nome:ID.nomeExibicao(id,'Monstro · '+modelo.nome+(i?' '+(i+1):''),i),imagem:String(modelo.miniatura?.url||modelo.imagem||''),diametroM:ID.reparoDoToken({id:'synccriatura:'+id,nome:'x',diametroM:0})?.diametroM||tamanho(modelo),donoUid:'',...conv(p.x,p.y),revision:0,facing:Number((rnd()*6.28).toFixed(3)),camada:3,mapaId,...(extra.arte?{arte3dV200:extra.arte}:{})};
   try{await A?.reiniciarCriatura?.(encodeURIComponent(tid));}catch(_){}
   await dep.setDoc(D(encodeURIComponent(tid)),dados);
   const t={id:encodeURIComponent(tid),...dados};colocados.push(t);
   if(A){try{await A.definirToken(t,{atitude,grupo:extra.grupo||'a',territorioM:extra.territorioM||0,personalidade:extra.personalidade,confianca:extra.confianca,ajuda:extra.ajuda??(atitude==='sanguinaria'?0:1),dieta:extra.dieta});}catch(e){console.warn('[Ecossistema] atitude do token',id,e?.message||e);}}
  }
 }
 // 3) NPCs: até 3 sobreviventes, aliados entre si; o primeiro é do mestre (ator inicial)
 dizer('⏳ Chamando os NPCs…');
 const escolhidos=[],preferidos=[/engenheir|mec[aâ]nic|t[eé]cnic/i,/m[eé]dic|doutor|curand/i,/ca[cç]ador|soldad|guarda|mercen/i];
 for(const re of preferidos){const m=npcs.find(n=>re.test(String(n.nome||'')+' '+String(n.carreira||'')+' '+String(n.tipo||''))&&!escolhidos.includes(n));if(m)escolhidos.push(m);}
 for(const n of npcs){if(escolhidos.length>=3)break;if(!escolhidos.includes(n))escolhidos.push(n);}
 const meu=String(dep.uid?.()||''),npcPos=[],jaNpc=existentes.filter(t=>/^syncnpc:/.test(decodeURIComponent(String(t.id))));
 for(let i=0;i<Math.min(3,escolhidos.length);i++){
  const m=escolhidos[i],ja=jaNpc.find(t=>decodeURIComponent(String(t.id)).startsWith('syncnpc:'+m.id+'~'));if(ja){npcPos.push(ja);continue;}
  const tid=await idLivre('syncnpc:'+m.id),p=sorteia(ZONAS,'acampamento',bloq,usados,rnd);usados.push(p);
  const dados={nome:(i===0?'👤 ':'NPC · ')+m.nome,imagem:String(m.miniatura?.url||m.imagem||''),diametroM:Math.max(1.25,tamanho(m)),donoUid:i===0?meu:'',...conv(p.x,p.y),revision:0,facing:0,camada:3,mapaId};
  await dep.setDoc(D(encodeURIComponent(tid)),dados);const t={id:encodeURIComponent(tid),...dados};npcPos.push(t);
  if(A&&i>0){try{await A.definirToken(t,{atitude:'aliada',grupo:'n',territorioM:0,personalidade:i===1?'explorador':'comum',confianca:2,ajuda:2});}catch(e){console.warn('[Ecossistema] npc',e?.message||e);}}
 }
 if(!escolhidos.length&&!jaNpc.length)faltou.push('NPCs (nenhum no banco)');
 return {colocados,npcPos,faltou,movidos,mantidos,reparos};
}

export async function criarEcossistema({root,win,dep,avisar}){
 const dizer=m=>{try{avisar?.(m);}catch(_){}console.info('[Ecossistema]',m);};
 const E=win.mesaEditorRapidoV197;if(!E?.construir)throw new Error('O Editor rápido ainda não carregou.');
 if(!win.confirm('Criar o mapa "'+NOME_MAPA+'" (80 × 50 m) com ecossistema, casa, torre, cachoeira, gruta, calabouço, 3 NPCs e armadilhas? Ele é um mapa novo; nada do que existe é alterado.'))return null;
 dizer('⏳ Criando o mapa…');
 const mapaId0=await E.criarMapa(NOME_MAPA,W,H,'');
 for(let i=0;i<80&&!E.pronto(mapaId0);i++)await new Promise(r=>setTimeout(r,100)); // espera o mapa novo abrir para edição
 if(!E.pronto(mapaId0))throw new Error('O mapa novo foi criado, mas não abriu para edição. Abra-o em Mapas (como mestre) e clique de novo em 🌿 Mapa de teste.');
 const res=await construirCena(E,{dizer});
 const mapaId=String(E.mapaAtual?.()||mapaId0||'');
 if(!mapaId)throw new Error('O mapa foi criado, mas não consegui abrir. Abra-o em Mapas.');
 const r=await povoarMapa({win,dep,mapaId,objetos:E.objetos(),existentes:[],dizer});
 const {colocados,npcPos,faltou}=r;
 // o NPC do mestre: fica selecionado, aparece no centro da tela e vira o personagem da "Aba de jogador" (botão 👁️)
 if(npcPos[0]){const raw=decodeURIComponent(npcPos[0].id);try{win.localStorage?.setItem('mesaEcoJogador',raw);}catch(_){}
  setTimeout(()=>{try{win.dispatchEvent(new win.CustomEvent('personagem-selecionado',{detail:raw}));}catch(_){}try{root.querySelector('#novaSyncBoard [data-token="'+CSS.escape(npcPos[0].id)+'"]')?.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});}catch(_){}},1500);}
 const msg='✔ "'+NOME_MAPA+'" pronto: '+colocados.length+' criaturas, '+npcPos.length+' NPCs'+(npcPos.length?' ('+npcPos[0].nome+' é seu: clique nele ou use o controle)':'')+(faltou.length?' · não achei no bestiário: '+faltou.join(', '):'')+(res.falhas?' · '+res.falhas+' passo(s) do terreno não saíram':'')+'.';
 dizer(msg);return {mapaId,criaturas:colocados.length,npcs:npcPos.length,faltou,construir:res};
}

/** onde cada criatura nasceria (sem paredes/água): usado nos testes para garantir início seguro e encontros separados */
export function simularColocacao(){
 passosEcossistema();const rnd=rng(77),usados=[],out=[],vazio=new Set();
 for(const [id,qtd,area,atitude] of POPULACAO)for(let i=0;i<qtd;i++){const p=sorteia(ZONAS,area,vazio,usados,rnd);usados.push(p);out.push({id,area,atitude,x:p.x,y:p.y});}
 return out;
}
export const PONTOS_SEGUROS={acampamento:{x:40.5,y:25,raio:17},casa:{x:CASA.x+CASA.w/2,y:CASA.y+CASA.h/2,raio:10}};
