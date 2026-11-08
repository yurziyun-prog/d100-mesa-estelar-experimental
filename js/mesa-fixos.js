// Mesa Estelar v143 — O que o mestre arruma fica arrumado.
//
// • Cada objeto que o mestre move, gira, retira ou acrescenta (na mesa ou na Oficina) entra num registro por mapa
//   (combatesAtivos/mesaObjetosMestre). Quando um mapa é refeito ou republicado (gerador, remodelagem, recheio…),
//   o registro é aplicado de novo: o objeto volta para onde o mestre deixou, mesmo que tenha ganhado outro id.
// • Ao abrir um mapa, se algum salvamento antigo tiver “puxado de volta” um objeto, ele é reposto onde o mestre deixou.
//   Movimentos feitos em jogo (arrastar um baú, por exemplo) não são desfeitos: só o que perdeu a marca do mestre.
// • Arrumação: móveis que ficaram um em cima do outro (mesa sobre cápsula) são afastados para um lugar livre e
//   armários/estantes soltos no meio do caminho vão para a parede mais próxima. Nada que o mestre posicionou é mexido.
// Módulo à parte: se falhar, os mapas seguem como estavam.

const REG='combatesAtivos/mesaObjetosMestre',SCENE='combatesAtivos/mapaMesaSyncDiretaCena';
const arquivo=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
export const chave=id=>String(id||'').replace(/[.\/\[\]*`~]/g,'_').slice(0,200);

// Objetos que não entram no registro: efeitos, ilusões, itens soltos no chão e restos temporários.
// v167: paredes invisíveis, fundo pintado e camadas do Marcador (🖌️) também não: quem cuida delas é o Marcador (senão o
// registro "repõe" paredes que o mestre tirou e a imagem antiga volta quando o mapa é refeito).
export const doMarcador=o=>{const e=o?.oficinaElement||{};return !!(o?.colisaoV173||o?.marcaV163||e.marcaV163||o?.invisivelV161||e.invisivelV161||o?.fundoV161||e.fundoV161||e.acimaV163||/mk163|:gen16[1-9]\d?:|gen1611|gen1621/.test(String(o?.id||'')));};
export function rastreavel(o){return !!(o&&o.id&&!o.clock&&o.tipo!=='ilusao'&&!o.itemSolto&&!/^chao_|^psi|^efeito/.test(String(o.id))&&!doMarcador(o));}
const M=(o,W,H)=>({x:Number(o.x)*W/28,y:Number(o.y)*H/14});
const dist=(a,b,W,H)=>Math.hypot((Number(a.x)-Number(b.x))*W/28,(Number(a.y)-Number(b.y))*H/14);

// Diferença entre duas cenas → lista de mudanças do mestre.
export function diffObjetos(antes={},depois={},{W=28,H=14}={}){
 const A=new Map((antes?.objects||[]).filter(rastreavel).map(o=>[String(o.id),o])),B=new Map((depois?.objects||[]).filter(rastreavel).map(o=>[String(o.id),o]));
 const out=[];
 for(const [id,b] of B){const a=A.get(id);
  if(!a){out.push({tipo:'adicionar',id,nome:b.nome||'',x:+b.x,y:+b.y,angulo:+b.angulo||0,obj:b});continue;}
  const mov=dist(a,b,W,H)>.12,gir=Math.abs((+a.angulo||0)-(+b.angulo||0))>.9;
  if(mov||gir)out.push({tipo:'mover',id,nome:b.nome||a.nome||'',de:{x:+a.x,y:+a.y},x:+b.x,y:+b.y,angulo:+b.angulo||0,marca:a.fixoMestreV143?.k||b.fixoMestreV143?.k||''});
 }
 for(const [id,a] of A)if(!B.has(id))out.push({tipo:'remover',id,nome:a.nome||'',de:{x:+a.x,y:+a.y},marca:a.fixoMestreV143?.k||''});
 return out;
}
// Junta as mudanças no registro de um mapa (puro). Mantém a posição ORIGINAL (de) da primeira vez.
export function registrar(reg={},mudancas=[],agora=Date.now()){
 const r={...reg};
 for(const m of mudancas){
  const k=chave(m.marca||m.id),velho=r[k]&&!r[k].apagado?r[k]:null;
  if(m.tipo==='adicionar'){r[k]={k,tipo:'adicionar',id:m.id,nome:m.nome,x:m.x,y:m.y,angulo:m.angulo,obj:clean({...m.obj,fixoMestreV143:null}),ts:agora};continue;}
  if(m.tipo==='remover'){if(velho?.tipo==='adicionar')r[k]={k,apagado:true,ts:agora};else r[k]={k,tipo:'remover',id:velho?.id||m.id,nome:velho?.nome||m.nome,de:velho?.de||m.de,ts:agora};
   // v174: apagou de vez — nenhum outro registro do mesmo objeto (com outro id/marca) o traz de volta
   for(const [k2,r2] of Object.entries(r))if(k2!==k&&r2&&!r2.apagado&&r2.tipo==='adicionar'&&(idBase(r2.id)===idBase(m.id)||idBase(r2.obj?.id)===idBase(m.id)||(m.de&&sem(r2.nome)===sem(m.nome)&&Math.hypot(Number(r2.x)-Number(m.de.x),Number(r2.y)-Number(m.de.y))<.35)))r[k2]={k:k2,apagado:true,ts:agora};
   continue;}
  if(velho?.tipo==='adicionar'){r[k]={...velho,x:m.x,y:m.y,angulo:m.angulo,obj:{...velho.obj,x:m.x,y:m.y,angulo:m.angulo},ts:agora};continue;}
  r[k]={k,tipo:'mover',id:velho?.id||m.id,nome:velho?.nome||m.nome,de:velho?.de||m.de,x:m.x,y:m.y,angulo:m.angulo,ts:agora};
 }
 return r;
}
// Acha, na cena, o objeto a que um registro se refere: pela marca, pelo id, ou pelo nome perto da posição original.
export const idBase=id=>String(id||'').replace(/(_v1[7-9]\d)+$/,''); // v174: o mesmo objeto depois de trocado (ex.: carro antigo → carro novo, id + "_v172")
function casar(objs,rec,usados,W,H){
 let i=objs.findIndex((o,j)=>!usados.has(j)&&o.fixoMestreV143?.k===rec.k);if(i>=0)return i;
 i=objs.findIndex((o,j)=>!usados.has(j)&&String(o.id)===String(rec.id));if(i>=0)return i;
 i=objs.findIndex((o,j)=>!usados.has(j)&&idBase(o.id)===idBase(rec.id));if(i>=0)return i; // v174
 const de=rec.de||(rec.tipo==='adicionar'&&Number.isFinite(+rec.x)?{x:+rec.x,y:+rec.y}:null);
 if(!de||!rec.nome)return -1;rec={...rec,de};
 let melhor=-1,dm=1.6;const n=sem(rec.nome);
 objs.forEach((o,j)=>{if(usados.has(j)||sem(o.nome)!==n)return;const d=dist(o,rec.de,W,H);if(d<dm){dm=d;melhor=j;}});
 return melhor;
}
// Aplica o registro de um mapa numa cena (puro). Só mexe no que ainda não está como o mestre deixou.
export function aplicarRegistro(cena,reg={},{W=28,H=14,forcar=false}={}){
 if(!cena)return {cena,mudou:0};
 const objs=[...(cena.objects||[])],usados=new Set(),fora=new Set();let mudou=0;
 const recs=Object.values(reg||{}).filter(r=>r&&!r.apagado&&r.k&&!doMarcador(r.obj||{id:r.id})&&!/^pintura do ch[aã]o$|^coberturas|^beirada do terra[cç]o$|^terra[cç]o$/i.test(String(r.nome||''))).sort((a,b)=>(a.ts||0)-(b.ts||0)); // v167
 // v146: móvel gerado para OUTRO mapa (semente do gerador que não existe nesta cena) não é acrescentado aqui
 const sem_=id=>{const m=/gen(\d+)/.exec(String(id||''));return m?m[1]:'';},daqui=new Set(objs.map(o=>sem_(o.id)).filter(Boolean));
 for(const rec of recs){
  const i=casar(objs,rec,usados,W,H);
  if(rec.tipo==='adicionar'){
   if(i>=0){usados.add(i);continue;}
   {const sd=sem_(rec.obj?.id||rec.id);if(sd&&daqui.size&&!daqui.has(sd))continue;}
   objs.push(clean({...rec.obj,id:rec.obj?.id||rec.id,x:rec.x,y:rec.y,angulo:rec.angulo,fixoMestreV143:{k:rec.k,ts:rec.ts}}));usados.add(objs.length-1);mudou++;continue;
  }
  if(i<0)continue;usados.add(i);
  if(rec.tipo==='remover'){fora.add(i);mudou++;continue;}
  const o=objs[i];if(!forcar&&o.fixoMestreV143?.k===rec.k&&o.fixoMestreV143?.ts===rec.ts)continue;
  objs[i]={...o,x:rec.x,y:rec.y,angulo:rec.angulo??o.angulo,fixoMestreV143:{k:rec.k,ts:rec.ts}};mudou++;
 }
 if(!mudou)return {cena,mudou:0};
 return {cena:{...cena,objects:objs.filter((_,j)=>!fora.has(j))},mudou};
}

// ---------------------------------------------------------------- arrumação (puro, coordenadas 28×14)
const NAO_MOVEL=/parede|muro|piso|chao|telhado|porta|portao|escotilha|escada|tapete|rua|trilho|faixa|areia|duna|rocha|nave|veiculo|aerocarro|cargueiro|carroca|plataforma|torre|barraca|tenda|predio|casa|janela|cerca|corda|terraco|caminho|trilha|grama|agua|lago|oasis|arvore|palmeira|fonte|poste|degrau|ponte|rampa|sombra|luz|nevoa|textura|pegada/;
const ASSENTO=/cadeira|banco|banqueta|poltrona|sofa|assento|trono/;
const MESA=/mesa|balcao|bancada|escrivaninha/;
export const ARMARIO=/armario|estante|cofre|\bbau\b|arca|guarda-roupa|prateleira|gaveteiro|arquivo de/;
const caixa=(o,W,H,folga=0)=>{const p=M(o,W,H),r=Math.abs(((+o.angulo||0)%180+180)%180-90)<45,w=(r?+o.alturaM:+o.larguraM)||1,h=(r?+o.larguraM:+o.alturaM)||1;return {x0:p.x-w/2-folga,x1:p.x+w/2+folga,y0:p.y-h/2-folga,y1:p.y+h/2+folga,w,h};};
const inter=(a,b)=>Math.max(0,Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0))*Math.max(0,Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0));
export function movel(o){
 if(!o||o.fixoMestreV143||o.itemSolto||o.clock||o.tetoV139||o.destruido)return false;
 const t=o.oficinaElement?.type;if(t==='shape'||t==='path')return false;
 if(Number(o.camada??3)>=5||Number(o.camada??3)<=1&&!ARMARIO.test(sem(o.nome)))return false;
 const a=(+o.larguraM||1)*(+o.alturaM||1);if(a<.25||a>12)return false;
 return !NAO_MOVEL.test(sem(o.nome));
}
const andarO=o=>Number(o?.andarV144??o?.oficinaElement?.andarV144??1)||1; // v144: cada andar se arruma sozinho
const solido=o=>o&&!o.destruido&&!o.itemSolto&&!o.tetoV139&&Number(o.camada??3)<5&&(o.bloqueiaMovimento||movel(o));
const parede=o=>o?.bloqueiaMovimento&&!o.destruido&&/parede|muro|rocha|pared[aã]o/.test(sem(o.nome))&&Math.max(+o.larguraM||0,+o.alturaM||0)>=2;
// Um lugar livre perto de (x,y) para um móvel com a caixa b (metros).
function vaga(objs,ignorar,o,W,H,{raio=7,alvo=null}={}){
 const b=caixa(o,W,H),hw=b.w/2,hh=b.h/2,base=alvo||M(o,W,H);
 const outros=objs.filter((q,j)=>j!==ignorar&&solido(q)&&andarO(q)===andarO(o)).map(q=>caixa(q,W,H,.08));
 const ok=(x,y)=>x-hw>.3&&y-hh>.3&&x+hw<W-.3&&y+hh<H-.3&&!outros.some(c=>inter({x0:x-hw,x1:x+hw,y0:y-hh,y1:y+hh},c)>1e-4);
 if(ok(base.x,base.y))return base;
 for(let r=.4;r<=raio;r+=.4)for(let a=0;a<24;a++){const x=base.x+Math.cos(a/24*Math.PI*2)*r,y=base.y+Math.sin(a/24*Math.PI*2)*r;if(ok(x,y))return {x,y};}
 return null;
}
const encostado=(o,objs,W,H)=>{const c=caixa(o,W,H,.55);return objs.some(q=>q!==o&&parede(q)&&andarO(q)===andarO(o)&&inter(c,caixa(q,W,H))>1e-4);};
// Pontos junto às paredes (lado de dentro e de fora), com o ângulo para o móvel “olhar” para longe da parede.
function juntoParede(objs,o,W,H){
 const b=caixa({...o,angulo:0},W,H),w=b.w,h=b.h,c=[];
 for(const q of objs){if(!parede(q)||andarO(q)!==andarO(o))continue;const p=M(q,W,H),lw=+q.larguraM||1,lh=+q.alturaM||1,hor=lw>=lh,comp=hor?lw:lh;
  for(let t=-comp/2+w*.6+.2;t<=comp/2-w*.6-.2;t+=.5)for(const s of [-1,1]){
   const x=hor?p.x+t:p.x+s*(lw/2+h/2+.12),y=hor?p.y+s*(lh/2+h/2+.12):p.y+t;
   c.push({x,y,angulo:hor?(s<0?180:0):(s<0?90:270)});}}
 return c;
}
export function arrumarCena(cena,{W=28,H=14}={}){
 if(!cena?.objects?.length)return {cena,mudou:0,log:[]};
 const objs=cena.objects.map(o=>({...o})),log=[];let mudou=0;
 const por=(o,p,ang)=>{o.x=+(p.x*28/W).toFixed(3);o.y=+(p.y*14/H).toFixed(3);if(ang!=null)o.angulo=ang;mudou++;};
 // 1) móveis um em cima do outro: o menor sai para um lugar livre
 for(let i=0;i<objs.length;i++)for(let j=i+1;j<objs.length;j++){
  const a=objs[i],b=objs[j];if(!(movel(a)||movel(b))||!solido(a)||!solido(b))continue;
  if(andarO(a)!==andarO(b))continue;
  const na=sem(a.nome),nb=sem(b.nome);if((ASSENTO.test(na)&&MESA.test(nb))||(ASSENTO.test(nb)&&MESA.test(na)))continue;
  const ca=caixa(a,W,H),cb=caixa(b,W,H),ar=inter(ca,cb),menor=Math.min(ca.w*ca.h,cb.w*cb.h);if(ar<menor*.3)continue;
  const [k,o]=!movel(b)?[i,a]:!movel(a)?[j,b]:(ca.w*ca.h<cb.w*cb.h?[i,a]:[j,b]);
  const p=vaga(objs,k,o,W,H);if(!p)continue;por(o,p);log.push(`${o.nome||'objeto'} saiu de cima de ${(o===a?b:a).nome||'outro objeto'}`);
 }
 // 2) armários/estantes soltos no meio do caminho vão para a parede mais próxima
 if(objs.some(parede))for(let i=0;i<objs.length;i++){
  const o=objs[i];if(!movel(o)||!ARMARIO.test(sem(o.nome))||encostado(o,objs,W,H))continue;
  const aqui=M(o,W,H),cands=juntoParede(objs,o,W,H).map(c=>({...c,d:Math.hypot(c.x-aqui.x,c.y-aqui.y)})).filter(c=>c.d<9).sort((a,b)=>a.d-b.d);
  for(const c of cands){const teste={...o,angulo:c.angulo},p=vaga(objs,i,teste,W,H,{raio:.01,alvo:c});if(p){por(o,p,c.angulo);log.push(`${o.nome} foi para junto da parede`);break;}}
 }
 return {cena:mudou?{...cena,objects:objs}:cena,mudou,log};
}

// ---------------------------------------------------------------- instalação
export function instalarFixos(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 let registro={},parar=[],ultimaChave='',aplicando=false;
 const dimsDe=id=>{const m=(dep.mapas?.()||[]).find(x=>String(x.id)===String(id));return {W:Number(m?.larguraM)||28,H:Number(m?.alturaM)||14};};
 // Chamado pela mesa/Oficina depois de um salvamento do mestre.
 async function anotar(mapId,antes,depois){
  if(!ehMestre()||!mapId)return;
  // v146: a cena “antes” precisa ser deste mapa; se for de outro (troca de mapa no meio), não anota nada
  if(antes?.mapId&&String(antes.mapId)!==String(mapId))return;
  const sd=id=>{const m=/gen(\d+)/.exec(String(id||''));return m?m[1]:'';},daqui=new Set((antes?.objects||[]).map(o=>sd(o.id)).filter(Boolean));
  const muds=diffObjetos(antes,depois,dimsDe(mapId)).filter(m=>!(m.tipo==='adicionar'&&daqui.size&&sd(m.id)&&!daqui.has(sd(m.id))));if(!muds.length)return;
  const atual=registro[mapId]||{},novo=registrar(atual,muds);registro={...registro,[mapId]:novo};
  // marca nos objetos movidos/acrescentados, para que nada os “puxe de volta” depois
  const parcial={};for(const k of Object.keys(novo))if(novo[k]!==atual[k])parcial[k]=novo[k];
  await dep.setDoc(D(REG),clean({mapas:{[mapId]:parcial},atualizadoEm:Date.now()}),{merge:true});
  await marcar(mapId).catch(()=>{});
 }
 // Gerador/remodelagem: aplica o registro (e a arrumação) antes de gravar a cena nova. Síncrono.
 function aplicar(mapId,cena,dims){
  try{const d=dims||dimsDe(mapId);const a=d.gerado===false?cena:arrumarCena(cena,d).cena;return aplicarRegistro(a,registro[mapId]||{},{...d,forcar:true}).cena;}catch(e){console.warn('[Fixos] aplicar',e);return cena;}
 }
 // Grava a marca do mestre na cena ativa/arquivada e repõe o que tiver voltado para trás.
 async function marcar(mapId){
  if(!ehMestre()||aplicando)return 0;const reg=registro[mapId];if(!reg||!Object.keys(reg).length)return 0;aplicando=true;
  let n=0;try{
   await dep.runTransaction(dep.db,async tx=>{
    const s=await tx.get(D(SCENE)),ativa=s.exists()&&String(s.data()?.mapId||'')===String(mapId);
    const caminho=ativa?SCENE:arquivo(mapId),snap=ativa?s:await tx.get(D(caminho));if(!snap.exists())return;
    const {cena,mudou}=aplicarRegistro(snap.data(),reg,dimsDe(mapId));n=mudou;if(!mudou)return;
    tx.set(D(caminho),clean(cena));if(ativa)tx.set(D(arquivo(mapId)),clean(cena));
   });
  }finally{aplicando=false;}
  return n;
 }
 // Uma vez: arrumar sobreposições e armários no caminho em todos os mapas já salvos.
 async function arrumarTodos(log=()=>{}){
  if(!ehMestre())throw Error('Só o mestre.');let total=0;
  for(const m of dep.mapas?.()||[]){
   const id=String(m.id);if(!id||id.startsWith('__mesa_live__')||!m.geradoV110)continue; /* só mapas gerados; os desenhados à mão pelo mestre ficam como estão */
   const dims={W:Number(m.larguraM)||28,H:Number(m.alturaM)||14};
   try{await dep.runTransaction(dep.db,async tx=>{
    const s=await tx.get(D(SCENE)),ativa=s.exists()&&String(s.data()?.mapId||'')===id,caminho=ativa?SCENE:arquivo(id),snap=ativa?s:await tx.get(D(caminho));if(!snap.exists())return;
    const r=arrumarCena(snap.data(),dims);if(!r.mudou)return;total+=r.mudou;
    tx.set(D(caminho),clean(r.cena));if(ativa)tx.set(D(arquivo(id)),clean(r.cena));
    log(`🧹 ${m.nome||id}: ${r.log.slice(0,4).join('; ')}${r.log.length>4?'…':''}`);
   });}catch(e){console.warn('[Fixos] arrumar',id,e);}
  }
  return total;
 }
 async function arrumarUmaVez(){
  try{const f=await dep.getDoc(D('configuracoes/arrumacaoV143'));if(f.exists())return;
   await dep.setDoc(D('configuracoes/arrumacaoV143'),{iniciadoEm:new Date().toISOString()});
   const n=await arrumarTodos(t=>console.info('[Fixos]',t));
   await dep.setDoc(D('configuracoes/arrumacaoV143'),{feitoEm:new Date().toISOString(),objetos:n},{merge:true});
  }catch(e){console.warn('[Fixos] arrumação',e);}
 }
 function iniciar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];if(!ehMestre()){setTimeout(iniciar,4000);return;}
  parar.push(dep.onSnapshot(D(REG),s=>{registro=s.exists()?(s.data()?.mapas||{}):{};ultimaChave='';},()=>{}));
  parar.push(dep.onSnapshot(D(SCENE),s=>{const c=s.exists()?s.data():null,id=String(c?.mapId||'');const k=id+'|'+JSON.stringify(registro[id]||{}).length;
   if(!id||k===ultimaChave)return;ultimaChave=k;setTimeout(()=>{void marcar(id).then(n=>{if(n)console.info('[Fixos] repostos',n,'objeto(s) onde o mestre deixou');}).catch(e=>console.warn('[Fixos]',e));},1200);},()=>{}));
  setTimeout(arrumarUmaVez,9000);
 }
 win.mesaFixosV143_={anotar,aplicar,marcar,arrumarTodos,registro:()=>registro};
 iniciar();
 return win.mesaFixosV143_;
}
