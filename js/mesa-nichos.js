// Mesa Estelar v205 — Nichos: habitat, água e atividades observáveis das criaturas do mapa de testes.
// Complementa (não substitui) a vida do mapa (mesa-vida.js) e as necessidades/caça/toca (mesa-exploracao.js). Cada criatura com `habitatV205` (elipse em metros, gravada no token)
// escolhe destinos DENTRO do seu habitat (anfíbio/aquático só na água; terrestre longe de água funda), vai BEBER quando a sede aperta e mostra o que faz (💧 bebendo · 🍃 pastando · 💤 descansando).
// A caça e a fuga continuam livres (podem sair do habitat); depois ela volta. Tudo roda no navegador do mestre (onde a vida roda); nada é gravado por quadro.
import {pocasDeAgua,profundidadeNoPonto} from './mesa-agua-visual.js?v=205';
export const SEDE_MS=70000,BEBER_PAUSA_MS=7000,RAIO_BUSCA_AGUA_M=22;
// papéis (da vida + personalidade + fome) que podem sentir sede, descansar ou pastar; guardas, comerciantes, sem-mente e montarias seguem a rotina própria
const SEM_NICHO=new Set(['parado','arrasta','montaria','foge','guarda','limpeza','comercio','civil','minerador','lenhador']);
const CARNIVORO=new Set(['predador','cacadora']);
const ATIVIDADE_DO_PAPEL={cacadora:'patrulhar_territorio',predador:'patrulhar_territorio',forrageira:'forragear',covarde:'esconder',construtora:'construir_abrigo',exploradora:'explorar',bando:'forragear',presa:'pastar',vaga:'forragear',neutro:'forragear'};
const dentroElipse=(p,h,m=0)=>((p.x-h.x)/(h.rx+m))**2+((p.y-h.y)/(h.ry+m))**2<=1;
/** ponto aleatório (metros) dentro do habitat que satisfaz `ok` (ex.: seco ou água); null se não achar */
export function sorteiaNoHabitat(h,ok,rnd=Math.random,tentativas=40){
 for(let i=0;i<tentativas;i++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd()),p={x:h.x+Math.cos(a)*h.rx*d,y:h.y+Math.sin(a)*h.ry*d};if(!ok||ok(p))return p;}
 return null;
}
/** margem da água mais perto de `eu` dentro de `raio`: um ponto seco (0,6 m para fora do retângulo da poça); null se não há */
export function margemMaisPerto(eu,pocas,raio=RAIO_BUSCA_AGUA_M,nivel=1){
 let melhor=null,dm=1e9;
 for(const p of pocas){if(p.nivel!==nivel)continue;for(const [rx,ry,rw,rh] of p.rects){
  const cx=Math.max(rx,Math.min(rx+rw,eu.x)),cy=Math.max(ry,Math.min(ry+rh,eu.y)),d=Math.hypot(cx-eu.x,cy-eu.y);if(d>=dm||d>raio)continue;
  // ponto na borda do retângulo mais perto, empurrado 0,6 m para fora (em direção a quem vem)
  const dx=eu.x-cx,dy=eu.y-cy,l=Math.hypot(dx,dy)||1;dm=d;melhor={x:cx+dx/l*.6,y:cy+dy/l*.6};}}
 return melhor;
}
const estados=new Map(),sede=new Map(),cache={chave:'',pocas:[]};
function pocasDe(objs,W,H){const k=W+'x'+H+':'+objs.length+':'+objs.filter(o=>o?.erPoca).length;if(cache.chave!==k){cache.chave=k;cache.pocas=pocasDeAgua(objs,W,H);}return cache.pocas;}
/** ajusta o destino sorteado pela vida. Devolve {p,acao?,pausa?} (p em coordenadas 28×14, como a vida usa) ou null para manter. */
export function ajustarDestino({t,dest,eu,objs,W,H,toM,toN,ponto,papel,agora=Date.now(),rnd=Math.random}){
 const h=t.habitatV205;if(!h||dest.caca||dest.fuga)return null;
 const pocas=pocasDe(objs,W,H),agua=p=>profundidadeNoPonto(p,pocas,1).prof>.3,seco=p=>profundidadeNoPonto(p,pocas,1).prof<.15;
 const id=t.id,alvoM=toM(dest.p),out={};let mudou=false;
 // 1) aquático/anfíbio: só na água do seu habitat
 if(h.aquatico){
  if(!agua(alvoM)){const q=sorteiaNoHabitat(h,agua,rnd);if(q){const n=ponto(q.x,q.y);out.p=n;mudou=true;}}
  estados.set(id,{atividade:'nadar',desde:agora,habitat:h.nome||''});return mudou?out:null;
 }
 // 2) sede: bebe na margem mais perto quando passou o tempo
 const ult=sede.get(id)??(sede.set(id,agora-rnd()*SEDE_MS*.8),sede.get(id));
 if(agora-ult>SEDE_MS&&!SEM_NICHO.has(papel)){
  const m=margemMaisPerto(eu,pocas,RAIO_BUSCA_AGUA_M);
  if(m){sede.set(id,agora);estados.set(id,{atividade:'beber',desde:agora,habitat:h.nome||''});return {p:ponto(m.x,m.y),acao:'💧',pausa:BEBER_PAUSA_MS};}
 }
 // 3) habitat: fora dele volta para dentro, longe de água funda
 if(!dentroElipse(alvoM,h,h.margem??3)||!seco(alvoM)){const q=sorteiaNoHabitat(h,seco,rnd);if(q){out.p=ponto(q.x,q.y);mudou=true;}}
 // 4) o que ela está fazendo (visível): pasto para quem come planta; descanso quando o destino é perto e a pausa é longa
 const ehPlanta=!CARNIVORO.has(papel);
 if(!dest.acao){
  if(Number(dest.pausa)>=5000&&ehPlanta){out.acao='🍃';mudou=true;estados.set(id,{atividade:'pastar',desde:agora,habitat:h.nome||''});}
  else if(Number(dest.pausa)>=6000&&CARNIVORO.has(papel)){out.acao='💤';mudou=true;estados.set(id,{atividade:'descansar',desde:agora,habitat:h.nome||''});}
  else estados.set(id,{atividade:ATIVIDADE_DO_PAPEL[papel]||'forragear',desde:agora,habitat:h.nome||''});
 }
 return mudou?out:null;
}
export const atividadeDe=id=>estados.get(id)?.atividade||'';
export const todasAtividades=()=>Object.fromEntries([...estados].map(([k,v])=>[k,v.atividade]));
export function reiniciarNichos(){estados.clear();sede.clear();cache.chave='';}
export function instalarNichos({root=document}={}){
 const win=root.defaultView||window;const api={ajustar:ajustarDestino,atividadeDe,todas:todasAtividades,reiniciar:reiniciarNichos,margemMaisPerto,sorteiaNoHabitat};
 win.mesaNichosV205=api;return api;
}
