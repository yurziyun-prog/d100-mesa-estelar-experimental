// Mesa Estelar v190 — Estrutura dos mapas: auditoria e conserto das ligações entre mapas.
//
// Roda no navegador do mestre depois que a mesa carrega (uma vez por sessão, sem custo se estiver tudo certo):
//  • tira ligações quebradas (apontam para mapa que não existe, ou para o mesmo mapa);
//  • põe saídas fora de parede/objeto que barra (usa a cena guardada do mapa) e dentro dos limites;
//  • liga a Masmorra de treino ao resto do jogo (entrada ↔ Ruas Escavadas; escada de saída ↔ outro lugar) e
//    liga qualquer mapa solto ao grupo principal, para o personagem poder andar de um mapa a outro.
// Mostra um aviso curto para o mestre com o que foi consertado. Em tudo o que escreve (só o documento de ligações),
// é idempotente: se não há o que consertar, não grava nada. Módulo à parte: se falhar, o jogo segue igual.

import {livrePerto} from './mesa-ligacoes.js?v=190';

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const LIGACOES='combatesAtivos/mesaLigacoes';
export const ID_MASMORRA='v184_masmorra';
const LARG=28,ALT=14; // coordenadas lógicas dos pontos de saída

// ---------------------------------------------------------------- partes puras
export const idDe=m=>String(m?.id??'');
export const ptOk=p=>!!p&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y));
// Limites de uma saída: a ponta fica um pouco para dentro do mapa.
export const dentroDoMapa=(p,margem=.6)=>({x:Math.max(margem,Math.min(LARG-margem,Number(p.x))),y:Math.max(margem,Math.min(ALT-margem,Number(p.y)))});
// Ligações quebradas: ponta sem mapa, mapa inexistente, ligação de um mapa para ele mesmo, ponto inválido.
export function ligacoesQuebradas(mapas,ligs){
 const ids=new Set((mapas||[]).map(idDe)),out=[];
 for(const l of ligs||[]){const a=String(l?.a?.mapa||''),b=String(l?.b?.mapa||'');
  if(!a||!b||a===b||!ids.has(a)||!ids.has(b)||!ptOk(l.a)||!ptOk(l.b))out.push(l);}
 return out;
}
// Componentes conexos do grafo mapas–ligações, do maior para o menor.
export function componentes(mapas,ligs){
 const ids=(mapas||[]).map(idDe).filter(Boolean),adj=new Map(ids.map(i=>[i,new Set()]));
 for(const l of ligs||[]){const a=String(l?.a?.mapa||''),b=String(l?.b?.mapa||'');if(adj.has(a)&&adj.has(b)&&a!==b){adj.get(a).add(b);adj.get(b).add(a);}}
 const vis=new Set(),comps=[];
 for(const i of ids){if(vis.has(i))continue;const comp=[],fila=[i];vis.add(i);while(fila.length){const x=fila.shift();comp.push(x);for(const y of adj.get(x)||[])if(!vis.has(y)){vis.add(y);fila.push(y);}}comps.push(comp);}
 return comps.sort((p,q)=>q.length-p.length);
}
export const mapasSoltos=(mapas,ligs)=>{const c=componentes(mapas,ligs);return c.length>1?c.slice(1).flat():[];};
// Mapas "de verdade": ignora rascunhos e mapas escondidos da mesa.
export const mapaReal=m=>!!m?.id&&!m.hiddenMesaLive&&!String(m.id).startsWith('__mesa_live__')&&!m.rascunho;
// Pontos de borda para ligar um mapa a outro: usa o lado que "olha" para o outro (por ordem do nome) para não cruzar tudo.
export function pontoDeBorda(lado){return {leste:{x:27.2,y:7},oeste:{x:.8,y:7},norte:{x:14,y:.8},sul:{x:14,y:13.2}}[lado]||{x:14,y:13.2};}
const lados=[['sul','norte'],['leste','oeste'],['norte','sul'],['oeste','leste']];
// Qual mapa do grupo principal recebe o mapa solto: o de nome parecido (mesma região), senão o primeiro.
export function melhorVizinho(solto,principais){
 const palavras=s=>sem(s).split(/[^a-z0-9]+/).filter(p=>p.length>3);const ps=new Set(palavras(solto.nome||solto.id));
 let melhor=null,nota=-1;for(const m of principais){const n=palavras(m.nome||m.id).filter(p=>ps.has(p)).length;if(n>nota){nota=n;melhor=m;}}
 return melhor||principais[0]||null;
}
// Liga os mapas soltos ao grupo principal. Devolve as ligações novas (sem alterar a lista dada).
export function ligarSoltos(mapas,ligs,{novoId=(a,b)=>`lig_v190_${a}_${b}`}={}){
 const reais=(mapas||[]).filter(mapaReal),novas=[];let atual=[...(ligs||[])];
 for(let guarda=0;guarda<50;guarda++){
  const comps=componentes(reais,atual);if(comps.length<2)break;
  const principal=new Set(comps[0]),solta=comps.at(-1),alvoId=solta[0],solto=reais.find(m=>idDe(m)===alvoId),vizinho=melhorVizinho(solto,reais.filter(m=>principal.has(idDe(m))));
  if(!solto||!vizinho)break;
  const [la,lb]=lados[novas.length%lados.length],l={id:novoId(idDe(vizinho),idDe(solto)),a:{mapa:idDe(vizinho),...pontoDeBorda(la)},b:{mapa:idDe(solto),...pontoDeBorda(lb)},tipo:'porta',auto:true,autoV190:true};
  novas.push(l);atual=[...atual,l];
 }
 return novas;
}
// Saídas da masmorra: entrada (pé da escada) ↔ Ruas Escavadas; escada de saída ↔ lugar da superfície.
export const PONTOS_MASMORRA={entrada:{x:8.9,y:2.7},saida:{x:26.4,y:10.4},poco:{x:19.1,y:12}}; // poco: na beira do poço da Sala do poço
export function ligacoesMasmorra(mapas,ligs){
 const reais=(mapas||[]).filter(mapaReal);if(!reais.some(m=>idDe(m)===ID_MASMORRA))return [];
 const tem=(a,b)=>(ligs||[]).some(l=>(String(l.a?.mapa)===a&&String(l.b?.mapa)===b)||(String(l.a?.mapa)===b&&String(l.b?.mapa)===a));
 const acha=(...res)=>{for(const re of res){const m=reais.find(x=>idDe(x)!==ID_MASMORRA&&!x.bairroV195&&re.test(sem((x.nome||'')+' '+x.id)));if(m)return m;}return null;};
 const ruas=acha(/ruas escavadas|cenario_c002/,/rua|escavad/,/portao|cenario_c001/),fora=acha(/espaco-porto|espacoporto|porto/,/cidade baixa/,/portao|cenario_c001/);
 const cidade=acha(/cidade sem nome|sem.?nome/),out=[];
 // poço da masmorra ↔ Cidade Sem Nome (sobe-se pelo poço)
 if(cidade&&!tem(ID_MASMORRA,idDe(cidade)))out.push({id:'lig_v190_masmorra_poco',a:{mapa:ID_MASMORRA,...PONTOS_MASMORRA.poco},b:{mapa:idDe(cidade),x:14,y:7},tipo:'porta',rotulo:'Poço',auto:true,autoV190:true,pocoV190:true});
 if(ruas&&!tem(ID_MASMORRA,idDe(ruas)))out.push({id:'lig_v190_masmorra_entrada',a:{mapa:idDe(ruas),x:7,y:12.9},b:{mapa:ID_MASMORRA,...PONTOS_MASMORRA.entrada},tipo:'porta',auto:true,autoV190:true});
 if(fora&&idDe(fora)!==idDe(ruas)&&!tem(ID_MASMORRA,idDe(fora)))out.push({id:'lig_v190_masmorra_saida',a:{mapa:ID_MASMORRA,...PONTOS_MASMORRA.saida},b:{mapa:idDe(fora),x:14,y:7},tipo:'porta',auto:true,autoV190:true});
 return out;
}
// Ponta dentro de parede ou de objeto que barra: devolve o ponto livre mais perto (ou o mesmo, se já está livre).
// Ponto da cidade onde fica o poço: objeto com nome de poço/fonte/cisterna na cena (ponto livre ao lado), senão o centro.
export function pontoDoPoco(cena,mapa,padrao={x:14,y:7}){
 const o=(cena?.objects||[]).find(x=>/po[cç]o|cisterna|fonte/i.test(sem((x.nome||'')+' '+(x.modeloId||''))));
 return o?pontoLivre({x:Number(o.x)+.0,y:Number(o.y)+Math.max(.8,(Number(o.alturaM)||1)/2*14/(Number(mapa?.alturaM)||14)+.8)},cena,mapa):padrao;
}
export function pontoLivre(ponto,cena,mapa){
 const W=Number(mapa?.larguraM)||28,H=Number(mapa?.alturaM)||14,p=dentroDoMapa(ponto);
 const objs=(cena?.objects||[]).filter(o=>o&&o.bloqueiaMovimento&&!o.destruido&&Number(o.camada??3)===3);
 const q=livrePerto(objs,p.x,p.y,W,H,.7);return {x:+q.x.toFixed(3),y:+q.y.toFixed(3)};
}
// Relatório completo (sem gravar nada).
export function auditar(mapas,ligs){
 const reais=(mapas||[]).filter(mapaReal);
 return {mapas:reais.length,ligacoes:(ligs||[]).length,quebradas:ligacoesQuebradas(reais,ligs).map(l=>l.id||'?'),soltos:mapasSoltos(reais,ligs),componentes:componentes(reais,ligs).length};
}

// ---------------------------------------------------------------- instalação (navegador do mestre)
export function instalarEstrutura(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const toast=t=>{const n=root.createElement('div');n.textContent=t;n.style.cssText='position:fixed;left:16px;bottom:190px;z-index:9999;background:#14242b;border:1px solid #6fd6c0;color:#d8fff5;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:560px';root.body.append(n);setTimeout(()=>n.remove(),14000);};
 let rodou=false,rodando=false,tentativas=0,ultimo=null;
 async function cenaDe(id){try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)));return s.exists()?s.data():null;}catch(_){return null;}}
 async function conferir({gravar=true}={}){
  const mapas=(dep.mapas?.()||[]).filter(mapaReal);if(!mapas.length)return null;
  const ref=D(LIGACOES),snap=await dep.getDoc(ref),atual=snap.exists()?(snap.data().ligacoes||[]):[];
  const relatorio={antes:auditar(mapas,atual),removidas:[],novas:[],ajustadas:0};
  // 1) quebradas
  const quebradas=new Set(ligacoesQuebradas(mapas,atual).map(l=>l));let ligs=atual.filter(l=>!quebradas.has(l));relatorio.removidas=[...quebradas].map(l=>l.id||'?');
  // 2) masmorra e mapas soltos
  const novasM=ligacoesMasmorra(mapas,ligs);ligs=[...ligs,...novasM];
  const manualV195=snap.exists()&&snap.data()?.bairroV195===true; // v195: o mestre cuida das ligações; só conferimos as quebradas
  const novasS=manualV195?[]:ligarSoltos(mapas,ligs);ligs=[...ligs,...novasS];relatorio.novas=[...novasM,...novasS].map(l=>l.id);
  // 3) pontas das ligações novas fora de parede
  for(const l of ligs.filter(x=>x.autoV190&&!x.ajustadoV190)){for(const k of ['a','b']){const m=mapas.find(x=>idDe(x)===String(l[k].mapa)),c=await cenaDe(idDe(m));if(c){const p=(l.pocoV190&&l[k].mapa!==ID_MASMORRA)?pontoDoPoco(c,m,l[k]):pontoLivre(l[k],c,m);if(Math.hypot(p.x-l[k].x,p.y-l[k].y)>.01){l[k]={...l[k],...p};relatorio.ajustadas++;}}}l.ajustadoV190=true;}
  // 4) pontas existentes fora do mapa
  ligs=ligs.map(l=>{let mudou=false;const r={...l};for(const k of ['a','b']){const p=dentroDoMapa(l[k]);if(p.x!==Number(l[k].x)||p.y!==Number(l[k].y)){r[k]={...l[k],...p};mudou=true;relatorio.ajustadas++;}}return mudou?r:l;});
  relatorio.depois=auditar(mapas,ligs);
  const mudou=relatorio.removidas.length||relatorio.novas.length||relatorio.ajustadas;
  if(mudou&&gravar){await dep.setDoc(ref,clean({...(snap.exists()?snap.data():{}),ligacoes:ligs,atualizadoEm:Date.now(),estruturaV190:true}));
   toast('🕸️ Estrutura dos mapas conferida: '+[relatorio.removidas.length?relatorio.removidas.length+' ligação(ões) quebrada(s) tirada(s)':'',relatorio.novas.length?relatorio.novas.length+' ligação(ões) nova(s) entre mapas':'',relatorio.ajustadas?relatorio.ajustadas+' saída(s) reposicionada(s)':''].filter(Boolean).join(' · ')+'.');}
  ultimo=relatorio;return relatorio;
 }
 async function tentar(){
  if(rodou||rodando||!ehMestre())return;if(!(dep.mapas?.()||[]).length)return;
  if(++tentativas>3){rodou=true;return;}rodando=true;
  try{await conferir();rodou=true;}catch(e){console.warn('[Estrutura]',e);}finally{rodando=false;}
 }
 const vigia=setInterval(()=>{try{void tentar();}catch(e){console.warn('[Estrutura]',e);}},3500);
 const api={conferir,auditar:()=>auditar(dep.mapas?.()||[],[]),ultimo:()=>ultimo};win.mesaEstrutura=api;
 return {...api,parar(){clearInterval(vigia);if(win.mesaEstrutura===api)delete win.mesaEstrutura;}};
}
