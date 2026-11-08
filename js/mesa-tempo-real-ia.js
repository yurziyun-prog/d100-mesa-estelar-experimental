// Mesa Estelar v111 — Combate em tempo real: decisões da IA (puro, sem Firebase e sem DOM).
//
// Coordenadas: os tokens usam o sistema lógico 28 × 14 do mapa; aqui tudo é convertido
// para metros (W × H) antes de medir distância, procurar caminho ou testar obstáculos.

export const FACCOES={
 grupo:{nome:'🛡️ Grupo',cor:'#57e3a1'},
 inimigos:{nome:'💀 Inimigos',cor:'#ff6b6b'},
 neutros:{nome:'🕊️ Neutros (não lutam)',cor:'#c6d3e6'},
 selvagens:{nome:'🐾 Cada um por si',cor:'#ffb347'},
 a:{nome:'🔵 Facção A',cor:'#5aa9ff'},
 b:{nome:'🟣 Facção B',cor:'#b07cff'},
 c:{nome:'🟡 Facção C',cor:'#ffd447'},
};
export const RODADA_S=5; // v123: uma rodada (turno) de combate = 5 s de jogo; 3 ações = 3 ataques e 3 defesas nesse tempo

const decMemoV203=new Map();const decId=k=>{let v=decMemoV203.get(k);if(v===undefined){try{v=decodeURIComponent(k);}catch(_){v=k;}if(decMemoV203.size>3000)decMemoV203.clear();decMemoV203.set(k,v);}return v;};
export const ehJogador=t=>!!t?.donoUid||!decId(String(t?.id||'')).startsWith('sync');
export function faccaoPadrao(t){return ehJogador(t)||globalThis.mesaCompanheiros?.ehCompanheiro?.(t?.id)?'grupo':'inimigos';} // v127: companheiros ficam do lado do grupo
export function faccaoDe(t,faccoes={}){
 const porAtitude=globalThis.mesaAtitudesIaV200?.faccaoDe?.(t); /* v200: atitude (sanguinária, agressiva, defensiva, aliada) define a facção */
 if(porAtitude&&FACCOES[porAtitude])return porAtitude;
 return FACCOES[faccoes?.[t?.id]]?faccoes[t.id]:faccaoPadrao(t);
}
/** v201: hostilidade entre DOIS tokens: a facção manda, mas a SANGUINÁRIA ataca qualquer um (até neutros e NPCs defensivos); quem não pode ser atacado (mesmo grupo/espécie com Ajuda) o `engaja` da atitude barra depois */
export function hostisEntre(ator,alvo,faccoes={}){
 if(hostis(faccaoDe(ator,faccoes),faccaoDe(alvo,faccoes),false))return true;
 return globalThis.mesaAtitudesIaV200?.atitudeDe?.(ator)?.id==='sanguinaria';
}
export function hostis(fa,fb,mesmo=false){
 if(fa==='neutros'||fb==='neutros')return false;
 if(fa==='selvagens'||fb==='selvagens')return !mesmo;
 return fa!==fb;
}

// Mais ações por turno = age mais vezes por rodada (e anda mais rápido).
export function intervaloAcaoMs(acoes,velocidade=1){
 const a=Math.max(1,Number(acoes)||1),v=Math.max(.25,Number(velocidade)||1);
 return Math.round(Math.max(700,RODADA_S*1000/a)/v);
}
export function velocidadeMs(mov,acoes,velocidade=1){
 const m=Math.max(1,Number(mov)||6),a=Math.max(1,Number(acoes)||1),v=Math.max(.25,Number(velocidade)||1);
 return m/RODADA_S*(.5+a/4)*v; // 2 ações → velocidade normal (deslocamento por rodada)
}

export const paraMetros=(p,W,H)=>({x:Number(p.x)*W/28,y:Number(p.y)*H/14});
export const deMetros=(p,W,H)=>({x:p.x*28/W,y:p.y*14/H});
export const diametro=t=>{const n=Number(t?.diametroM);return n>0?n:/besta\s+ululante/i.test(t?.nome||'')?2.4:1;};
export function distanciaBordas(a,b,W,H){
 const A=paraMetros(a,W,H),B=paraMetros(b,W,H);
 return Math.max(0,Math.hypot(A.x-B.x,A.y-B.y)-(diametro(a)+diametro(b))/2);
}

export function estadoVivo(health,id){
 const c=health?.actors?.[id]?.combateLab;
 return !(c?.morto||c?.inconsciente||c?.incapacitado);
}

// Alvo: o inimigo vivo mais próximo; quem atacou por último ganha um pequeno bônus (vingança).
export function escolherAlvo(ator,tokens,{faccoes={},health={},W=28,H=14,ultimoAgressor=null}={}){
 const fa=faccaoDe(ator,faccoes);let melhor=null,nota=Infinity;
 for(const t of tokens){
  if(t.id===ator.id||!estadoVivo(health,t.id))continue;
  if(!hostis(fa,faccaoDe(t,faccoes),false))continue;
  if(globalThis.mesaAtitudesIaV200?.engaja&&!globalThis.mesaAtitudesIaV200.engaja(ator,t))continue; /* v200 */
  const d=distanciaBordas(ator,t,W,H)-(t.id===ultimoAgressor?3:0);
  if(d<nota){nota=d;melhor=t;}
 }
 return melhor;
}

// ataques: [{skillId,weaponId,valor,alcance,distancia,nome}]
export function escolherAtaque(ataques,dist,{bloqueado=false,indisponivel=new Set()}={}){
 const lista=(ataques||[]).filter(x=>!indisponivel.has(x.skillId+'|'+x.weaponId));
 const alcancam=lista.filter(x=>dist<=x.alcance+.05&&!(x.distancia&&bloqueado));
 if(alcancam.length)return {ataque:alcancam.sort((a,b)=>b.valor-a.valor)[0],alcanca:true};
 // ninguém alcança: anda com o melhor ataque (preferindo à distância, que precisa andar menos)
 const ref=lista.sort((a,b)=>(b.distancia-a.distancia)||(b.valor-a.valor))[0]||null;
 return {ataque:ref,alcanca:false};
}

// ---------------------------------------------------------------- obstáculos e caminho
export function folgaObjeto(p,o,raio){
 const ang=-(Number(o.angulo)||0)*Math.PI/180,c=Math.cos(ang),s=Math.sin(ang);
 const lx=(p.x-o.x)*c-(p.y-o.y)*s,ly=(p.x-o.x)*s+(p.y-o.y)*c;
 const hx=Math.max(.05,Number(o.larguraM)/2||.5),hy=Math.max(.05,Number(o.alturaM)/2||.5);
 const x=Math.abs(lx)-hx,y=Math.abs(ly)-hy;
 return Math.hypot(Math.max(0,x),Math.max(0,y))+Math.min(Math.max(x,y),0)-raio;
}
// objetos em metros (centro x,y, larguraM, alturaM, angulo) que bloqueiam movimento
export function montarGrade(objetos,W,H,{passo=.5,raio=.45}={}){
 const cw=Math.ceil(W/passo),ch=Math.ceil(H/passo),g=new Uint8Array(cw*ch);
 // v133: caixas envolventes pré-calculadas — células vazias não percorrem todos os objetos.
 const obs=objetos.map(o=>{const hx=Math.max(.05,Number(o.larguraM)/2||.5)+raio+passo,hy=Math.max(.05,Number(o.alturaM)/2||.5)+raio+passo;return {o,hx,hy};});
 for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){
  const p={x:(i+.5)*passo,y:(j+.5)*passo};
  if(p.x<raio||p.y<raio||p.x>W-raio||p.y>H-raio){g[j*cw+i]=1;continue;}
  for(const {o,hx,hy} of obs){
   const dx=Math.abs(p.x-o.x),dy=Math.abs(p.y-o.y);
   if(dx>hx&&dy>hy)continue; // fora da caixa: folga com certeza > 0
   if(folgaObjeto(p,o,raio)<0){g[j*cw+i]=1;break;}
  }
 }
 return {g,cw,ch,passo,W,H};
}
export function caminho(grade,de,para,{maxNos=Math.max(6000,grade.cw*grade.ch*2)}={}){
 const {g,cw,ch,passo}=grade,cel=p=>[Math.max(0,Math.min(cw-1,Math.floor(p.x/passo))),Math.max(0,Math.min(ch-1,Math.floor(p.y/passo)))];
 const [si,sj]=cel(de),[ti,tj]=cel(para),S=sj*cw+si,T=tj*cw+ti;
 if(S===T)return [para];
 const gc=new Float32Array(cw*ch).fill(Infinity),veio=new Int32Array(cw*ch).fill(-1),fechado=new Uint8Array(cw*ch);
 const h=k=>{const dx=Math.abs(k%cw-ti),dy=Math.abs(Math.floor(k/cw)-tj);return Math.max(dx,dy)+.414*Math.min(dx,dy);};
 const aberto=[[h(S),S]];gc[S]=0;let n=0,melhor=S,melhorH=h(S);
 while(aberto.length&&n++<maxNos){
  let bi=0;for(let k=1;k<aberto.length;k++)if(aberto[k][0]<aberto[bi][0])bi=k;
  const [,u]=aberto.splice(bi,1)[0];if(fechado[u])continue;fechado[u]=1;
  if(u===T){melhor=T;break;}
  const hu=h(u);if(hu<melhorH){melhorH=hu;melhor=u;}
  const ui=u%cw,uj=Math.floor(u/cw);
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
   if(!di&&!dj)continue;const vi=ui+di,vj=uj+dj;if(vi<0||vj<0||vi>=cw||vj>=ch)continue;
   const v=vj*cw+vi;if(fechado[v]||(g[v]&&v!==T))continue;
   if(di&&dj&&(g[uj*cw+vi]||g[vj*cw+ui]))continue; // não corta quina
   const custo=gc[u]+(di&&dj?1.414:1);
   if(custo<gc[v]){gc[v]=custo;veio[v]=u;aberto.push([custo+h(v),v]);}
  }
 }
 const pts=[];for(let k=melhor;k!==-1&&k!==S;k=veio[k])pts.push({x:(k%cw+.5)*passo,y:(Math.floor(k/cw)+.5)*passo});
 pts.reverse();
 if(melhor===T&&pts.length)pts[pts.length-1]={...para};
 return suavizar(grade,de,pts);
}
// remove pontos intermediários quando há linha livre (andar mais natural)
function linhaLivre(grade,a,b){
 const {g,cw,ch,passo}=grade,d=Math.hypot(b.x-a.x,b.y-a.y);
 // v133: amostras de ≤ passo/4 (antes: passo/2). Paredes finas rotacionadas (0,3–0,4 m) caíam ENTRE
 // duas amostras de passo/2 e a linha "livre" cortava a parede no caminho suavizado.
 // E exige a vizinhança 3×3 da célula livre: o atalho fica a ≥1 célula de qualquer célula bloqueada,
 // senão o atalho cortava o canto de paredes que a colisão exata (varredura do círculo) bloqueava.
 const n=Math.max(1,Math.ceil(d/(passo*.25)));
 for(let k=1;k<n;k++){
  const x=a.x+(b.x-a.x)*k/n,y=a.y+(b.y-a.y)*k/n,i=Math.floor(x/passo),j=Math.floor(y/passo);
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
   const ci=i+di,cj=j+dj;
   if(ci<0||cj<0||ci>=cw||cj>=ch||g[cj*cw+ci])return false;
  }
 }
 return true;
}
function suavizar(grade,de,pts){
 if(pts.length<3)return pts;const out=[];let atual=de,i=0;
 while(i<pts.length){let j=pts.length-1;while(j>i&&!linhaLivre(grade,atual,pts[j]))j--;out.push(pts[j]);atual=pts[j];i=j+1;}
 return out;
}
// Dá um passo de no máximo `passoM` metros ao longo do caminho.
export function avancar(de,pts,passoM){
 let p={...de},resto=passoM;
 for(const alvo of pts){const d=Math.hypot(alvo.x-p.x,alvo.y-p.y);if(d<=resto){p={...alvo};resto-=d;continue;}p={x:p.x+(alvo.x-p.x)*resto/d,y:p.y+(alvo.y-p.y)*resto/d};break;}
 return p;
}

// Quem ainda está de pé por facção (para saber se o combate acabou).
export function faccoesDePe(tokens,{faccoes={},health={}}={}){
 const vivos=new Map();
 for(const t of tokens){if(!estadoVivo(health,t.id))continue;const f=faccaoDe(t,faccoes);if(f==='neutros')continue;vivos.set(f,(vivos.get(f)||0)+1);}
 return vivos;
}
export function combateAcabou(tokens,ctx){
 const v=faccoesDePe(tokens,ctx);
 if(v.has('selvagens'))return v.size===1&&v.get('selvagens')<=1?{fim:true,vencedor:'selvagens'}:{fim:false};
 return v.size<=1?{fim:true,vencedor:[...v.keys()][0]||null}:{fim:false};
}

// Escolha automática de defesa e de efeitos especiais (modo rápido).
export function melhorDefesa(pending,preferencia='auto'){
 const ops=(pending?.options||[]).filter(o=>Number(o.valor)>0),wanted=ops.filter(o=>preferencia==='esquiva'?/esquiva/i.test(o.id+' '+o.nome):preferencia==='aparar'?/aparar/i.test(o.id+' '+o.nome):true);
 const available=wanted.length?wanted:ops;
 return available.length?available.sort((a,b)=>b.valor-a.valor)[0].id:'none';
}
export function escolherEfeitos(pending,rnd=Math.random){
 const ops=[...(pending?.options||[])],max=Math.max(0,Number(pending?.maxEffects)||0),out=[];
 while(out.length<max&&ops.length)out.push(ops.splice(Math.floor(rnd()*ops.length),1)[0].id);
 const locais=pending?.locations||[];
 return {effects:out,local:locais.length&&rnd()<.5?locais[Math.floor(rnd()*locais.length)]:''};
}

// ================================================================ v113: personalidade em combate
// Cada criatura ganha um jeito de lutar a partir da ficha (inteligência, tipo e descrição):
//  • sem mente (zumbis, limos, enxames, sésseis): ataca o mais próximo e nunca foge;
//  • animais e predadores: caçam o mais ferido e fogem com metade da vida;
//  • inteligentes (NPCs, vampiros, soldados…): enfrentam quem é mais perigoso, mantêm distância
//    se atiram e se rendem/fogem com 30% da vida;
//  • presas e domesticados: só revidam e fogem cedo;  • chefes/alfas nunca fogem;
//  • imóveis (Cila): não andam e só atacam quem estiver ao alcance.
// O mestre pode trocar o jeito de cada um no painel ⚡ (campo "comportamento" também é lido da ficha).
const semAc=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const COMPORTAMENTOS={
 auto:{nome:'🧠 Automático (pela ficha)'},
 proximo:{nome:'🎯 Ataca o mais próximo',alvo:'proximo',fuga:0},
 ferido:{nome:'🩸 Caça o mais ferido',alvo:'ferido',fuga:.5},
 perigoso:{nome:'⚔️ Enfrenta o mais forte',alvo:'perigoso',fuga:.3},
 covarde:{nome:'🏃 Covarde (foge cedo)',alvo:'vinganca',fuga:.75},
 teimoso:{nome:'🐗 Teimoso (só foge com 10%)',alvo:'proximo',fuga:.1},
 furia:{nome:'🔥 Fúria (nunca foge)',alvo:'proximo',fuga:0},
 parado:{nome:'🧱 Não sai do lugar',alvo:'proximo',fuga:0,imovel:true},
};
export function perfilCombate(d={},escolha='auto'){
 const t=semAc([d.texto,d.comportamento].join(' ')),int=Number(d.int)||0,mov=Number(d.mov)||0;
 const p={alvo:'proximo',fuga:0,distancia:false,imovel:!(mov>0),tipo:'sem mente'};
 const vampiro=/vampir/.test(t);
 const semMente=!vampiro&&(/zumbi|errante|cadaver|carnical|limo|amorf|enxame|sessil|\bcila\b|robo|automato|golem/.test(t)||(int>0&&int<=3));
 const chefe=/chefe|dominante|\balfa\b|lider|rainha|matriarca|patriarca/.test(t);
 const presa=/herbivor|\bpresa\b|domestica|galinha|montaria|pacifico/.test(t);
 const animal=/predador|besta|\brato|\bcao\b|cachorro|lagart|felin|inset|vespa|carrapat|serpente|dragao|macaco|rastej|escavador|mariposa|lobo|aranha|parasita/.test(t)||(int>=4&&int<=7);
 const esperto=int>=8||d.tipo==='npc'||vampiro||/psiquic|sentinela|soldado|guarda|capanga|cacador|mercenari|pistoleir|bandid/.test(t);
 if(presa)Object.assign(p,{alvo:'vinganca',fuga:.75,tipo:'presa'});
 else if(semMente)Object.assign(p,{alvo:'proximo',fuga:0,tipo:'sem mente'});
 else if(esperto&&!(animal&&int<8))Object.assign(p,{alvo:'perigoso',fuga:.3,distancia:true,tipo:'inteligente'});
 else if(animal){
  // grandes predadores aguentam até o fim (fogem com 10%); bichos pequenos fogem com metade da vida
  const apex=!/pequen|minuscul|miud/.test(t)&&(/besta|dragao|ululante|courac/.test(t)||/\b(grande|enorme|gigante|titan|colossal|pesado)/.test(t)||Number(d.diametroM)>=2);
  Object.assign(p,{alvo:'ferido',fuga:apex?.1:.5,tipo:apex?'grande predador':'animal'});
 }
 else Object.assign(p,{alvo:'proximo',fuga:.4,tipo:'comum'});
 if(chefe){p.fuga=0;p.alvo='perigoso';p.tipo+=' · chefe';}
 if(/covarde|medros|assustad/.test(t))p.fuga=Math.max(p.fuga,.7);
 if(p.fuga>0&&/teimos|feroz|obstinad|ate a morte/.test(t))p.fuga=Math.min(p.fuga,.1);
 if(/destemid|furia|frenes|berserk|nunca foge|implacav|territorial/.test(t))p.fuga=0;
 const c=COMPORTAMENTOS[escolha];
 if(c&&escolha!=='auto'){p.alvo=c.alvo;p.fuga=c.fuga;if(c.imovel)p.imovel=true;p.tipo=c.nome.replace(/^\S+\s/,'');}
 if(p.imovel)p.fuga=0;
 return p;
}
export function descreverPerfil(p){
 const alvo={proximo:'ataca o mais próximo',ferido:'caça o mais ferido',perigoso:'enfrenta o mais forte',vinganca:'só revida'}[p.alvo]||'';
 return [p.imovel?'imóvel':'',alvo,p.fuga>0?`foge com ${Math.round(p.fuga*100)}% da vida`:'nunca foge',p.distancia?'mantém distância ao atirar':''].filter(Boolean).join(' · ');
}
// Fração da vida (0–1) pela soma dos pontos de vida dos locais.
export function fracaoVida(health,id){
 const c=health?.actors?.[id]?.combateLab;if(!c?.hitMax)return 1;
 let m=0,a=0;for(const [k,v] of Object.entries(c.hitMax)){const mx=Math.max(0,Number(v)||0);m+=mx;a+=Math.max(0,Math.min(mx,Number(c.hit?.[k]??mx)||0));}
 return m>0?a/m:1;
}
// Alvo conforme o jeito da criatura. poder: Map(id→melhor valor de ataque); ameaca: Map(id→golpes que deu nesta criatura).
export function escolherAlvoPerfil(ator,tokens,{faccoes={},health={},W=28,H=14,perfil={alvo:'proximo'},ultimoAgressor=null,poder=new Map(),ameaca=new Map(),alcanceMax=Infinity}={}){
 const fa=faccaoDe(ator,faccoes),cand=[];
 for(const t of tokens){
  if(t.id===ator.id||!estadoVivo(health,t.id)||!hostisEntre(ator,t,faccoes))continue;
  if(globalThis.mesaAtitudesIaV200?.engaja&&!globalThis.mesaAtitudesIaV200.engaja(ator,t))continue; /* v200: só engaja quem a atitude manda */
  const d=distanciaBordas(ator,t,W,H);if(perfil.imovel&&d>alcanceMax+.05)continue;cand.push({t,d});
 }
 if(!cand.length)return null;
 const dmin=Math.min(...cand.map(c=>c.d));
 if(perfil.alvo==='vinganca'){const ag=cand.find(c=>c.t.id===ultimoAgressor);if(ag)return ag.t;}
 let melhor=null,nota=Infinity;
 for(const {t,d} of cand){
  let n=d-(t.id===ultimoAgressor?3:0);
  if(perfil.alvo==='ferido'){if(d>dmin+6)continue;n=fracaoVida(health,t.id)*10+d*.35;}
  else if(perfil.alvo==='perigoso'){if(d>dmin+10)continue;n=d*.3-(Number(poder.get(t.id))||0)/12-(Number(ameaca.get(t.id))||0)*1.5;}
  if(n<nota){nota=n;melhor=t;}
 }
 return melhor||cand.sort((a,b)=>a.d-b.d)[0].t;
}
// v131: quem é atacado por outro oponente tende a trocar de alvo e ir atrás de quem o atacou —
// mais ainda se o agressor for uma ameaça maior (perícia de ataque mais alta) ou o perfil for de vingança;
// menos se o agressor estiver bem mais longe. Às vezes não troca.
export function chanceDeTrocar({poderAtual=0,poderAgressor=0,distAtual=0,distAgressor=0,perfil={}}={}){
 let p=.6;
 if(poderAgressor>poderAtual+5)p+=.25;else if(poderAgressor<poderAtual-15)p-=.2;
 if(distAgressor>distAtual+6)p-=.25;
 if(perfil?.alvo==='vinganca')p+=.2;else if(perfil?.alvo==='ferido')p-=.1;
 return Math.max(.15,Math.min(.95,p));
}
// Ponto para onde fugir (metros): para longe dos inimigos, desviando de paredes e da borda.
export function pontoDeFuga(ator,inimigos,grade,W,H,passoM=6){
 const p=paraMetros(ator,W,H);let vx=0,vy=0;
 for(const t of inimigos){const q=paraMetros(t,W,H),dx=p.x-q.x,dy=p.y-q.y,d2=Math.max(.25,dx*dx+dy*dy);if(d2>400)continue;vx+=dx/d2;vy+=dy/d2;}
 if(!vx&&!vy){vx=p.x<W/2?-1:1;vy=0;}
 const base=Math.atan2(vy,vx),livre=(x,y)=>{if(!grade)return x>.6&&y>.6&&x<W-.6&&y<H-.6;const i=Math.floor(x/grade.passo),j=Math.floor(y/grade.passo);return i>=0&&j>=0&&i<grade.cw&&j<grade.ch&&!grade.g[j*grade.cw+i];};
 let melhor=null,ganho=-Infinity;
 for(const da of [0,.5,-.5,1,-1,1.5,-1.5,2.2,-2.2]){
  const a=base+da,x=Math.max(.7,Math.min(W-.7,p.x+Math.cos(a)*passoM)),y=Math.max(.7,Math.min(H-.7,p.y+Math.sin(a)*passoM));
  if(!livre(x,y))continue;
  const dist=Math.min(...inimigos.map(t=>{const q=paraMetros(t,W,H);return Math.hypot(x-q.x,y-q.y);}),99);
  if(dist>ganho){ganho=dist;melhor={x,y};}
 }
 return melhor;
}

// v132: criaturas com várias cabeças/pescoços (Cila: seis pescoços). Cada cabeça age por conta própria:
// a criatura não sai do lugar, e cada ação é de uma cabeça, que pode escolher um alvo diferente dentro do alcance.
const NUM_CABECAS={duas:2,dois:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,doze:12};
export function cabecasDe(m){
 const t=String([m?.descricao,m?.comportamento,m?.habilidadesTexto].join(' ')).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const r=/\b(\d+|duas|dois|tres|quatro|cinco|seis|sete|oito|nove|dez|doze)\s+(pescocos|cabecas)\b/.exec(t);
 const n=r?(Number(r[1])||NUM_CABECAS[r[1]]||0):0;return n>1?Math.min(12,n):0;
}
// Alvo da cabeça k: os inimigos ao alcance são repartidos entre as cabeças (cada cabeça fica com o seu).
export function alvoDaCabeca(k,emAlcance){if(!emAlcance?.length)return null;return emAlcance[k%emAlcance.length];}
